import crypto from "node:crypto";
import fs from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { run, probeDuration } from "../media";
import { httpError, wrapProvider } from "../resilience";
import type { ImageLicense } from "./images";

export type VideoResult = { license: ImageLicense; durationS: number };
export interface VideoProvider {
  /** Writes an mp4 (any length) to outPath. The renderer loops/trims it to the beat length. */
  fetch(query: string, outPath: string, o: { orientation: "portrait" | "landscape"; minSeconds?: number }): Promise<VideoResult>;
}

/** Offline stand-in: slowly moving gradient. */
export class MockVideoProvider implements VideoProvider {
  async fetch(query: string, outPath: string, o: { orientation: "portrait" | "landscape" }): Promise<VideoResult> {
    const h = crypto.createHash("md5").update(query).digest("hex");
    const size = o.orientation === "portrait" ? "540x960" : "960x540";
    await run("ffmpeg", ["-y", "-f", "lavfi", "-i", `gradients=s=${size}:c0=0x${h.slice(0, 6)}:c1=0x${h.slice(6, 12)}:duration=4:speed=0.04:rate=30`, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "ultrafast", outPath]);
    return { license: { source: "generated", license: "CC0 (generated placeholder)" }, durationS: 4 };
  }
}

/** Pexels stock video (free license; attribution appreciated but not required). */
export class PexelsVideoProvider implements VideoProvider {
  async fetch(query: string, outPath: string, o: { orientation: "portrait" | "landscape"; minSeconds?: number }): Promise<VideoResult> {
    const key = process.env.PEXELS_API_KEY;
    if (!key) throw new Error("PEXELS_API_KEY not set");
    const r = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&orientation=${o.orientation}&size=medium&per_page=10`, { headers: { Authorization: key } });
    if (!r.ok) throw await httpError(r, "Pexels video");
    const j: any = await r.json();
    const vids: any[] = (j.videos ?? []).filter((v: any) => v.duration >= Math.min(o.minSeconds ?? 3, 8));
    const v = vids[0] ?? j.videos?.[0];
    if (!v) throw new Error(`no Pexels videos for "${query}"`);
    // Prefer an mp4 near 720p on the short side to keep downloads and renders light.
    const short = (f: any) => Math.min(f.width ?? 0, f.height ?? 0);
    const file = (v.video_files as any[]).filter((f) => f.file_type === "video/mp4").sort((a, b) => Math.abs(short(a) - 720) - Math.abs(short(b) - 720))[0];
    if (!file) throw new Error("no mp4 file in Pexels result");
    const dl = await fetch(file.link);
    if (!dl.ok || !dl.body) throw await httpError(dl, "Pexels download");
    await pipeline(Readable.fromWeb(dl.body as any), fs.createWriteStream(outPath));
    return { license: { source: "pexels", license: "Pexels License", author: v.user?.name, url: v.url }, durationS: v.duration ?? (await probeDuration(outPath)) };
  }
}

export function getVideoProvider(): VideoProvider | null {
  const p = process.env.VIDEO_PROVIDER;
  if (p === "pexels") return wrapProvider("pexels-video", new PexelsVideoProvider());
  if (p === "mock") return new MockVideoProvider();
  return null; // not configured: beats fall back to still images
}
