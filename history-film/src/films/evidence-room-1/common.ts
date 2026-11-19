import { BeatId, beatLengthFrames, cueFrame, cueSpan } from "./timing";
import { Span } from "../../shared/comic";

/** Per-beat shortcuts to the timing file. T = start frame of a cue, S = [from, to] span. */
export const beatTimes = (id: BeatId) => ({
  id,
  len: beatLengthFrames(id),
  T: (name: string): number => cueFrame(id, name),
  S: (name: string): Span => cueSpan(id, name),
});

/** Arm angle that raises, then slams down on each hit frame. */
export const slamArm = (frame: number, hits: number[], up: number, down: number) => {
  let a = up;
  for (const h of hits) {
    if (frame >= h - 8 && frame < h) a = up + ((down - up) * (frame - (h - 8))) / 8;
    else if (frame >= h && frame < h + 30) a = down + ((up - down) * (frame - h)) / 30;
  }
  return a;
};
