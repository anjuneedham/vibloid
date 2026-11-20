// The short Evidence Room "moment" every Episode 2 style test and the style reel restage:
// the Curator opens the court, Dig claims, Doubt objects, the Clerk produces a source, the verdict stamp lands.
// PLACEHOLDER LINES: the real script (scripts/evidence-room-2-caerleon/) replaces these. Nothing here is a verified claim.

export type Span = [number, number];
export type BeatId = "open" | "claim" | "object" | "source" | "verdict";
export const BEATS: BeatId[] = ["open", "claim", "object", "source", "verdict"];

export const MOMENT_TEXT: Record<BeatId, { who: "curator" | "dig" | "doubt" | "clerk"; line: string; tag: string }> = {
  open: { who: "curator", line: "Court is in session. Tonight: Caerleon.", tag: "Placeholder line. Sources pending (sources.md)" },
  claim: { who: "dig", line: "King Arthur held court right here!", tag: "Local tradition: “King Arthur’s Round Table” (to verify)" },
  object: { who: "doubt", line: "Says who? And written down when?", tag: "Placeholder line. Sources pending (sources.md)" },
  source: { who: "clerk", line: "Exhibit A: Geoffrey of Monmouth, about 1136.", tag: "Geoffrey of Monmouth, History of the Kings of Britain, c. 1136" },
  verdict: { who: "curator", line: "The court finds the claim...", tag: "Style test: the verdict word is a placeholder" },
};

export const VERDICT_WORD = "UNPROVEN";

/** Frame spans for one staging of the moment. `cuts[i]` = first frame of beat i; `hit` = the stamp frame. */
export type MomentTiming = { cuts: Record<BeatId, number>; lines: Record<BeatId, Span>; hit: number; end: number };

/**
 * Build a timing from line times in SECONDS (as a transcript of the real voiceover would give them).
 * Each beat starts `pre` seconds before its line; the last beat runs to `end`. This is how the
 * Short adapts to arbitrary line timings from a timing file.
 */
export const momentFromSeconds = (
  lines: Record<BeatId, readonly [number, number]>,
  hitSec: number,
  endSec: number,
  fps: number,
  pre = 0.25,
): MomentTiming => {
  const fr = (s: number) => Math.round(s * fps);
  const cuts = {} as Record<BeatId, number>;
  const spans = {} as Record<BeatId, Span>;
  BEATS.forEach((b, i) => {
    cuts[b] = i === 0 ? 0 : Math.max(0, fr(lines[b][0] - pre));
    spans[b] = [fr(lines[b][0]), fr(lines[b][1])];
  });
  return { cuts, lines: spans, hit: fr(hitSec), end: fr(endSec) };
};

/** Evenly paced timing for the style reel: `seconds` per moment. */
export const evenMoment = (seconds: number, fps: number): MomentTiming => {
  const w = [0.2, 0.2, 0.2, 0.2, 0.2];
  let t = 0.15;
  const lines = {} as Record<BeatId, [number, number]>;
  BEATS.forEach((b, i) => {
    const len = w[i] * seconds;
    lines[b] = [t + 0.1, t + len - 0.25];
    t += len;
  });
  return momentFromSeconds(lines, lines.verdict[0] + 0.55, seconds, fps, 0.25);
};

export const beatAt = (t: MomentTiming, frame: number): BeatId => {
  let cur: BeatId = "open";
  for (const b of BEATS) if (frame >= t.cuts[b]) cur = b;
  return cur;
};
export const beatEnd = (t: MomentTiming, b: BeatId) => {
  const i = BEATS.indexOf(b);
  return i < BEATS.length - 1 ? t.cuts[BEATS[i + 1]] : t.end;
};
