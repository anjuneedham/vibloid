// =============================================================================
// THE EVIDENCE ROOM, PART 2 SHORT: TIMING (reuses the long film's takes)
// =============================================================================
// Nothing to edit when the owner records: line lengths come from the long film's units.json
// (via ../evidence-room-2/timing.ts). The Short's own clock is: LEAD, then each line back to back with a
// small gap, then TAIL. Gaps shrink automatically so the Short stays under MAX_SECONDS.
// scripts/build_short_2.py cuts short-voiceover.mp3 from the long voiceover with the SAME rules.
// =============================================================================
import { FPS } from "../../shared/theme";
import { LINES as LONG, IS_ESTIMATE } from "../evidence-room-2/timing";
import type { LineId } from "../evidence-room-2/lines";

export const SHORT_ORDER: LineId[] = ["L02", "L04", "L09", "L10", "L17", "L26", "L28", "L36", "L37", "L38"];
export const LEAD = 0.3;
export const TAIL = 2.4;
export const MAX_SECONDS = 57.5;
/** Extra breath before the verdict (a shorter version of the long film's 1.5 s). */
export const VERDICT_PAUSE = 0.5;

const durs = SHORT_ORDER.map((id) => LONG[id].end - LONG[id].start);
const speech = durs.reduce((a, b) => a + b, 0);
/** Gap between lines: 0.45 s, squeezed down to 0.12 s if the takes run long. */
export const GAP = Math.max(0.12, Math.min(0.45, (MAX_SECONDS - LEAD - TAIL - VERDICT_PAUSE - speech) / (SHORT_ORDER.length - 1)));

export const SHORT_LINES = {} as Record<LineId, { start: number; end: number }>;
let t = LEAD;
SHORT_ORDER.forEach((id, i) => {
  if (id === "L36") t += VERDICT_PAUSE;
  SHORT_LINES[id] = { start: +t.toFixed(3), end: +(t + durs[i]).toFixed(3) };
  t += durs[i] + GAP;
});
export const SHORT_SECONDS = +(t - GAP + TAIL).toFixed(3);
export const SHORT_FRAMES = Math.round(SHORT_SECONDS * FPS);
/** The stamp lands on "unproven" (after "Verdict: /"), about 55 % into L36. */
export const VERDICT_HIT = SHORT_LINES.L36.start + (SHORT_LINES.L36.end - SHORT_LINES.L36.start) * 0.55;

export const HAS_SHORT_VOICEOVER = !IS_ESTIMATE;
export const SHORT_VOICEOVER = "evidence-room-2/short-voiceover.mp3";

export const sf = (s: number) => Math.round(s * FPS);
export const slf = (id: LineId): [number, number] => [sf(SHORT_LINES[id].start), sf(SHORT_LINES[id].end)];
