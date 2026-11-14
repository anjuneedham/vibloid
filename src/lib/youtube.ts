import fs from "node:fs";
import { getPool } from "./db";
import { decrypt } from "./secrets";
import { DeferError } from "./queue";
import { httpError, wrapProvider } from "./resilience";

export const SCOPES = [
  "https://www.googleapis.com/auth/youtube.upload",
  "https://www.googleapis.com/auth/youtube.readonly",
  "https://www.googleapis.com/auth/yt-analytics.readonly",
];

// YouTube Data API v3 quota costs (units).
export const QUOTA_COST = { videosInsert: 1600, thumbnailsSet: 50 } as const;
export const DAILY_QUOTA = () => Number(process.env.YOUTUBE_DAILY_QUOTA ?? 10000);

export class QuotaError extends DeferError {
  constructor(public retryAfter: Date) { super(retryAfter, "YouTube daily quota would be exceeded; retrying after reset"); }
}

/** Quota resets at midnight Pacific. Returns the Pacific calendar date (YYYY-MM-DD) for `now`. */
export function pacificDay(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}
export function nextQuotaReset(now = new Date()): Date {
  for (let h = 1; h <= 25; h++) { const t = new Date(now.getTime() + h * 3600_000); if (pacificDay(t) !== pacificDay(now)) { t.setUTCMinutes(0, 0, 0); return t; } }
  return new Date(now.getTime() + 24 * 3600_000);
}

export async function quotaUsed(now = new Date()) {
  const r = await getPool().query("select units from quota_usage where day=$1", [pacificDay(now)]);
  return Number(r.rows[0]?.units ?? 0);
}
export async function reserveQuota(units: number, now = new Date()) {
  const day = pacificDay(now);
  // Atomic check-and-increment so concurrent workers cannot overspend.
  const r = await getPool().query(
    `insert into quota_usage (day, units) values ($1,$2)
     on conflict (day) do update set units = quota_usage.units + $2 where quota_usage.units + $2 <= $3
     returning units`, [day, units, DAILY_QUOTA()]);
  if (!r.rowCount) throw new QuotaError(nextQuotaReset(now));
  return Number(r.rows[0].units);
}

export type UploadMeta = { title: string; description: string; tags: string[]; publishAt?: Date; syntheticMedia: boolean; categoryId?: string };
export interface YouTubeClient {
  upload(filePath: string, meta: UploadMeta): Promise<{ videoId: string }>;
  setThumbnail(videoId: string, imagePath: string): Promise<void>;
}

export class MockYouTubeClient implements YouTubeClient {
  uploads: { filePath: string; meta: UploadMeta }[] = [];
  thumbs: string[] = [];
  async upload(filePath: string, meta: UploadMeta) { this.uploads.push({ filePath, meta }); return { videoId: `mock_${this.uploads.length}` }; }
  async setThumbnail(videoId: string) { this.thumbs.push(videoId); }
}

export async function accessToken(channelId?: string): Promise<string> {
  const r = channelId
    ? await getPool().query("select youtube_refresh_token from channels where id=$1", [channelId])
    : await getPool().query("select youtube_refresh_token from channels where youtube_refresh_token is not null order by created_at limit 1");
  const enc = r.rows[0]?.youtube_refresh_token;
  if (!enc) throw new Error("YouTube is not connected: complete OAuth at /api/youtube/auth");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: process.env.YOUTUBE_CLIENT_ID!, client_secret: process.env.YOUTUBE_CLIENT_SECRET!, refresh_token: decrypt(enc), grant_type: "refresh_token" }),
  });
  if (!res.ok) throw await httpError(res, "token refresh");
  return ((await res.json()) as any).access_token;
}

/** Real client. Not exercised by the test suite (needs live Google credentials); see docs/runbook.md. */
export class GoogleYouTubeClient implements YouTubeClient {
  constructor(private channelId?: string) {}
  async upload(filePath: string, meta: UploadMeta) {
    const token = await accessToken(this.channelId);
    const size = fs.statSync(filePath).size;
    const body = {
      snippet: { title: meta.title.slice(0, 100), description: meta.description.slice(0, 5000), tags: meta.tags, categoryId: meta.categoryId ?? "27" },
      // Scheduling requires private + publishAt. containsSyntheticMedia = the "altered or synthetic content" disclosure.
      status: { privacyStatus: "private", selfDeclaredMadeForKids: false, containsSyntheticMedia: meta.syntheticMedia, ...(meta.publishAt ? { publishAt: meta.publishAt.toISOString() } : {}) },
    };
    const init = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "content-type": "application/json; charset=UTF-8", "X-Upload-Content-Length": String(size), "X-Upload-Content-Type": "video/mp4" },
      body: JSON.stringify(body),
    });
    if (!init.ok) throw await httpError(init, "upload init");
    const session = init.headers.get("location");
    if (!session) throw new Error("no resumable session URL");
    let offset = 0;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const res = await fetch(session, {
          method: "PUT",
          headers: { "content-length": String(size - offset), "content-type": "video/mp4", ...(offset ? { "content-range": `bytes ${offset}-${size - 1}/${size}` } : {}) },
          body: fs.createReadStream(filePath, { start: offset }) as any, duplex: "half",
        } as any);
        if (res.ok) return { videoId: ((await res.json()) as any).id as string };
        if (res.status !== 308 && res.status < 500) throw await httpError(res, "upload");
      } catch (e) { if (attempt === 3) throw e; }
      // Ask the server how much it has, then resume from there.
      const probe = await fetch(session, { method: "PUT", headers: { "content-length": "0", "content-range": `bytes */${size}` } });
      const range = probe.headers.get("range");
      offset = range ? Number(range.split("-")[1]) + 1 : 0;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    }
    throw new Error("upload failed after retries");
  }
  async setThumbnail(videoId: string, imagePath: string) {
    const token = await accessToken(this.channelId);
    const res = await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`, {
      method: "POST", headers: { Authorization: `Bearer ${token}`, "content-type": "image/png" }, body: fs.readFileSync(imagePath),
    });
    if (!res.ok) throw await httpError(res, "thumbnail");
  }
}

let client: YouTubeClient | undefined;
const perChannel = new Map<string, YouTubeClient>();
export function getYouTubeClient(channelId?: string | null): YouTubeClient {
  if (channelId && !client && process.env.YOUTUBE_PROVIDER !== "mock") {
    if (!perChannel.has(channelId)) perChannel.set(channelId, wrapProvider("youtube", new GoogleYouTubeClient(channelId), {}, { upload: { retries: 0 } }));
    return perChannel.get(channelId)!;
  }
  // upload() is not idempotent (a retry after a lost response could create a duplicate video), so it never auto-retries; it has its own resume logic.
  return (client ??= process.env.YOUTUBE_PROVIDER === "mock" ? new MockYouTubeClient() : wrapProvider("youtube", new GoogleYouTubeClient(), {}, { upload: { retries: 0 } }));
}
export function setYouTubeClient(c: YouTubeClient) { client = c; }
