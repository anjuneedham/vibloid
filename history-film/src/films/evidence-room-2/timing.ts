// =============================================================================
// THE EVIDENCE ROOM, PART 2: TIMING
// =============================================================================
// Start / end SECONDS of every line (L01..L39) come from ONE file: ./units.json.
//
// NOW: units.json holds ESTIMATED timings written by scripts/estimate_timing_2.py
//      (Curator 120, Dig 128, Doubt 112, Clerk 100 wpm; 0.35 s per slash; 1.0 s between lines,
//      2.5 s between beats, 1.5 s before L36). It carries "estimated": true, so no audio is played.
//
// AFTER RECORDING (the swap is one file):
//   1. Build the clean voiceover exactly as for Part 1:  python3 scripts/build_vo.py raw.m4a transcript.json public/evidence-room-2
//      with build_vo.py's U table listing the 39 takes in script order, ids "L01".."L39" (ids "u1".."u39" also work).
//   2. Copy public/evidence-room-2/units.json over src/films/evidence-room-2/units.json.
//   That's it: the real file has no "estimated" flag, so HAS_VOICEOVER turns on and
//   public/evidence-room-2/voiceover.mp3 plays. Every shot, cartouche, stamp and the Short re-flow,
//   because they are all placed relative to line starts and ends.
// =============================================================================

import RAW from "./units.json";
import { FPS } from "../../shared/theme";
import { LINE_IDS, LINE_TEXT, LineId } from "./lines";

type Unit = { id: string; beat?: number; who?: string; start: number; end: number };
const DATA = RAW as unknown as { estimated?: boolean; units: Unit[]; total: number };

/** true once the real recording's units.json is in place (no "estimated" flag). */
export const HAS_VOICEOVER = !DATA.estimated;
export const IS_ESTIMATE = !!DATA.estimated;
export const VOICEOVER_FILE = "evidence-room-2/voiceover.mp3";

/** "u7" (build_vo.py's default naming, script order) -> "L07"; "L07" stays. */
const norm = (id: string) => (/^u\d+$/.test(id) ? `L${id.slice(1).padStart(2, "0")}` : id);

/** Start / end in SECONDS for each line id. */
export const LINES = Object.fromEntries(DATA.units.map((u) => [norm(u.id), { start: u.start, end: u.end }])) as Record<LineId, { start: number; end: number }>;
for (const id of LINE_IDS) if (!LINES[id]) throw new Error(`timing: units.json has no ${id}`);

export const sec = (s: number) => Math.round(s * FPS);
/** Line span in absolute FRAMES. */
export const lf = (id: LineId): [number, number] => [sec(LINES[id].start), sec(LINES[id].end)];

/** Beats 1..10 start BEAT_LEAD s before their first line (beat 1 at 0). Beat 11 = end card. */
export const BEAT_LEAD = 0.7;
export const END_CARD_SECONDS = 10;
const firstLine = (b: number) => LINE_IDS.find((id) => LINE_TEXT[id].beat === b) as LineId;
const lastLine = (b: number) => [...LINE_IDS].reverse().find((id) => LINE_TEXT[id].beat === b) as LineId;
export const BEAT_START: Record<number, number> = {};
for (let b = 1; b <= 10; b++) BEAT_START[b] = b === 1 ? 0 : sec(LINES[firstLine(b)].start - BEAT_LEAD);
BEAT_START[11] = sec(LINES.L39.end + 1.4);
export const TOTAL_FRAMES = BEAT_START[11] + sec(END_CARD_SECONDS);
export const beatSpan = (b: number): [number, number] => [BEAT_START[b], b < 11 ? BEAT_START[b + 1] : TOTAL_FRAMES];
export { firstLine, lastLine };

/** Cut point: `lead` seconds before a line starts (absolute frames). */
export const cutBefore = (id: LineId, lead = 0.45) => sec(LINES[id].start - lead);
/** A moment inside a line: fraction 0..1 of its length (absolute frames). */
export const inLine = (id: LineId, k: number) => sec(LINES[id].start + (LINES[id].end - LINES[id].start) * k);
