import crypto from "node:crypto";
import fs from "node:fs";
import { run } from "../media";
import { httpError, wrapProvider } from "../resilience";

export type ImageLicense = { source: string; license: string; author?: string; url?: string };
export type ImageResult = { license: ImageLicense; costUsd?: number };
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

/**
 * AI-generated stills (OpenAI Images API). The renderer animates them with parallax/zoom, which is how "AI clips" are made today:
 * OpenAI's Sora video API was shut down in Sept 2026, so there is no OpenAI text-to-video to call.
 * Prompts are suffixed to avoid text, logos and real people's likenesses.
 */
export class OpenAIImageGenProvider implements ImageProvider {
  async fetch(query: string, outPath: string, o: { orientation: "portrait" | "landscape" }): Promise<ImageResult> {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY not set");
    const style = process.env.AI_IMAGE_STYLE ?? "cinematic, dark moody lighting, high contrast, shallow depth of field, no text, no logos, no recognizable real people";
    const res = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST", headers: { Authorization: `Bearer ${key}`, "content-type": "application/json" },
      body: JSON.stringify({ model: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1", prompt: `${query}. ${style}`, size: o.orientation === "portrait" ? "1024x1536" : "1536x1024", n: 1 }),
    });
    if (!res.ok) throw await httpError(res, "OpenAI image");
    const j: any = await res.json();
    const b64 = j.data?.[0]?.b64_json;
    if (!b64) throw new Error("OpenAI image response had no image data");
    fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
    return { license: { source: "openai-generated", license: "AI-generated (use per OpenAI terms)" }, costUsd: aiImageCostUsd() };
  }
}
/** Estimate per generated image; set OPENAI_IMAGE_USD_EACH from current pricing for your model/size. */
export const aiImageCostUsd = () => Number(process.env.OPENAI_IMAGE_USD_EACH ?? 0.07);

export function getAIImageProvider(): ImageProvider {
  return process.env.AI_IMAGE_PROVIDER === "openai" ? wrapProvider("openai-image", new OpenAIImageGenProvider()) : new MockImageProvider();
}

export function getImageProvider(): ImageProvider {
  return process.env.IMAGE_PROVIDER === "pexels" ? wrapProvider("pexels", new PexelsImageProvider()) : new MockImageProvider();
}
