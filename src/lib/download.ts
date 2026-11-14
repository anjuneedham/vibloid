import fs from "node:fs";
import dns from "node:dns";
import net from "node:net";
import { pipeline } from "node:stream/promises";
import { Readable, Transform } from "node:stream";
import { Agent } from "undici";
import { run } from "./media";

const YT = /^https?:\/\/(www\.|m\.)?(youtube\.com|youtu\.be)\//i;

/** True for loopback, private, link-local (incl. cloud metadata 169.254.169.254), CGNAT, multicast and reserved ranges. */
export function isPrivateIp(ip: string): boolean {
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase();
    if (v === "::1" || v === "::") return true;
    if (v.startsWith("::ffff:")) return isPrivateIp(v.slice(7)); // IPv4-mapped
    return /^(fc|fd|fe[89ab]|ff)/.test(v);
  }
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true;
  const [a, b] = p;
  return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 192 && b === 0) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
}

const allowPrivate = () => process.env.ALLOW_PRIVATE_URLS === "1";

/** Intake check: scheme + literal IPs/obvious local names. DNS names are re-checked at connect time by safeLookup. */
export function assertSafeUrl(raw: string): URL {
  const u = new URL(raw);
  if (!/^https?:$/.test(u.protocol)) throw new Error("only http(s) URLs are allowed");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (!allowPrivate() && (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || (net.isIP(host) && isPrivateIp(host)))) {
    throw new Error("private/loopback hosts are not allowed");
  }
  return u;
}

/** DNS lookup that refuses private addresses. Used as the socket-level lookup, so redirects and DNS rebinding are covered. */
export function safeLookup(resolve: typeof dns.lookup = dns.lookup) {
  return (hostname: string, opts: any, cb: any) => {
    resolve(hostname, { ...opts, all: true }, (err: any, addrs: any) => {
      if (err) return cb(err);
      const list = Array.isArray(addrs) ? addrs : [{ address: addrs, family: 4 }];
      if (!allowPrivate() && list.some((a: any) => isPrivateIp(a.address))) return cb(new Error(`blocked: ${hostname} resolves to a private address`));
      if (opts?.all) return cb(null, list);
      cb(null, list[0].address, list[0].family);
    });
  };
}
const agent = () => new Agent({ connect: { lookup: safeLookup() as any } });

/** Download a source the user has rights to. YouTube links go through yt-dlp (must be installed); others by direct HTTP. */
export async function downloadSource(url: string, dest: string): Promise<{ title?: string }> {
  const u = assertSafeUrl(url);
  if (YT.test(url)) {
    // yt-dlp does its own networking; run the worker with an egress policy that blocks internal ranges (see docs/runbook.md).
    try {
      await run("yt-dlp", ["-f", "bv*[height<=1080]+ba/b[height<=1080]", "--merge-output-format", "mp4", "--no-playlist", "-o", dest, url]);
    } catch (e: any) {
      if (e?.code === "ENOENT") throw new Error("yt-dlp is not installed on the worker");
      throw e;
    }
    return {};
  }
  const res = await fetch(u, { dispatcher: agent(), signal: AbortSignal.timeout(30 * 60_000) } as any);
  if (!res.ok || !res.body) throw new Error(`download failed: HTTP ${res.status}`);
  const max = Number(process.env.MAX_DOWNLOAD_BYTES ?? 4e9);
  if (Number(res.headers.get("content-length") ?? 0) > max) throw new Error("file too large");
  let seen = 0;
  const cap = new Transform({ transform(chunk, _e, cb) { seen += chunk.length; cb(seen > max ? new Error("file too large") : null, chunk); } });
  await pipeline(Readable.fromWeb(res.body as any), cap, fs.createWriteStream(dest));
  return {};
}
