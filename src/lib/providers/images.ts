import crypto from "node:crypto";
import fs from "node:fs";
import { run } from "../media";
import { httpError, wrapProvider } from "../resilience";

export type ImageLicense = { source: string; license: string; author?: string; url?: string };
export type ImageResult = { license: ImageLicense };
export interface ImageProvider {
  /** Writes an image to outPath and returns its license metadata. */
  fetch(query: string, outPath: string, o: { orientation: "portrait" | "landscape" }): Promise<ImageResult>;
}

export class MockImageProvider implements ImageProvider {
  async fetch(query: string, outPath: string, o: { orientation: "portrait" | "landscape" }): Promise<ImageResult> {
    const h = crypto.createHash("md5").update(query).digest("hex");
    const c0 = h.slice(0, 6), c1 = h.slice(6, 12);
    const size = o.orientation === "portrait" ? "1080x1920" : "1920x1080";
    await run("ffmpeg", ["-y", "-f", "lavfi", "-i", `gradients=s=${size}:c0=0x${c0}:c1=0x${c1}:x0=0:y0=0:x1=${o.orientation === "portrait" ? 1080 : 1920}:y1=${o.orientation === "portrait" ? 1920 : 1080}`, "-frames:v", "1", outPath]);
    return { license: { source: "generated", license: "CC0 (generated placeholder)" } };
  }
}

export class PexelsImageProvider implements ImageProvider {
  async fetch(query: string, outPath: string, o: { orientation: "portrait" | "landscape" }): Promise<ImageResult> {
    const key = process.env.PEXELS_API_KEY;
    if (!key) throw new Error("PEXELS_API_KEY not set");
    const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=${o.orientation}&per_page=5`, { headers: { Authorization: key } });
    if (!r.ok) throw await httpError(r, "Pexels");
    const j: any = await r.json();
    const p = j.photos?.[0];
    if (!p) throw new Error(`no Pexels results for "${query}"`);
    const img = await fetch(o.orientation === "portrait" ? p.src.portrait : p.src.landscape);
    if (!img.ok) throw await httpError(img, "Pexels image");
    fs.writeFileSync(outPath, Buffer.from(await img.arrayBuffer()));
    return { license: { source: "pexels", license: "Pexels License", author: p.photographer, url: p.url } };
  }
}

export function getImageProvider(): ImageProvider {
  return process.env.IMAGE_PROVIDER === "pexels" ? wrapProvider("pexels", new PexelsImageProvider()) : new MockImageProvider();
}
