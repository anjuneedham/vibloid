import type { ImageLicense } from "./providers/images";

export type Segment = {
  id: string; kind: "hook" | "promise" | "beat" | "cta"; text: string; start: number; end: number; voiceKey: string;
  visual: { type: "image" | "clip"; key: string; license?: ImageLicense; clip?: { start: number; end: number }; sourceId?: string };
  onScreenText?: string;
};
export type Timeline = {
  version: 1; projectId: string; format: "short" | "long"; width: number; height: number; fps: number; duration: number;
  segments: Segment[]; captionsKey: string; music: { key: string; license: ImageLicense; volume: number };
};
export const DIMS = { short: { width: 1080, height: 1920 }, long: { width: 1920, height: 1080 } } as const;
