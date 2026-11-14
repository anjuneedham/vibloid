import fs from "node:fs";
import { Readable } from "node:stream";
import { requireOwner } from "@/lib/auth";
import { getStorage } from "@/lib/storage";

const TYPES: Record<string, string> = { mp4: "video/mp4", wav: "audio/wav", mp3: "audio/mpeg", png: "image/png", jpg: "image/jpeg", json: "application/json", ass: "text/plain" };

/** Authenticated media streaming with HTTP Range support (needed for video seeking). */
export async function GET(req: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const denied = requireOwner(req); if (denied) return denied;
  const { key } = await params;
  let file: string;
  try { file = getStorage().localPath(key.join("/")); } catch { return new Response("bad key", { status: 400 }); }
  if (!fs.existsSync(file)) return new Response("not found", { status: 404 });
  const size = fs.statSync(file).size;
  const type = TYPES[file.split(".").pop()!.toLowerCase()] ?? "application/octet-stream";
  const range = req.headers.get("range")?.match(/bytes=(\d*)-(\d*)/);
  if (range) {
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start > end || start >= size) return new Response("bad range", { status: 416, headers: { "content-range": `bytes */${size}` } });
    return new Response(Readable.toWeb(fs.createReadStream(file, { start, end })) as any, { status: 206, headers: { "content-type": type, "content-range": `bytes ${start}-${end}/${size}`, "content-length": String(end - start + 1), "accept-ranges": "bytes" } });
  }
  return new Response(Readable.toWeb(fs.createReadStream(file)) as any, { headers: { "content-type": type, "content-length": String(size), "accept-ranges": "bytes" } });
}
