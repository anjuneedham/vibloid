import fs from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import { run } from "./media";

const YT = /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//i;

export function assertSafeUrl(raw: string): URL {
  const u = new URL(raw);
  if (!/^https?:$/.test(u.protocol)) throw new Error("only http(s) URLs are allowed");
  const h = u.hostname;
  if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.0\.0\.0|\[?::1)/.test(h) && process.env.ALLOW_PRIVATE_URLS !== "1") {
    throw new Error("private/loopback hosts are not allowed");
  }
  return u;
}

/** Download a source the user has rights to. YouTube links go through yt-dlp (must be installed); others by direct HTTP. */
export async function downloadSource(url: string, dest: string): Promise<{ title?: string }> {
  const u = assertSafeUrl(url);
  if (YT.test(url)) {
    try {
      await run("yt-dlp", ["-f", "bv*[height<=1080]+ba/b[height<=1080]", "--merge-output-format", "mp4", "--no-playlist", "-o", dest, url]);
    } catch (e: any) {
      if (e?.code === "ENOENT") throw new Error("yt-dlp is not installed on the worker");
      throw e;
    }
    return {};
  }
  const res = await fetch(u);
  if (!res.ok || !res.body) throw new Error(`download failed: HTTP ${res.status}`);
  await pipeline(Readable.fromWeb(res.body as any), fs.createWriteStream(dest));
  return {};
}
