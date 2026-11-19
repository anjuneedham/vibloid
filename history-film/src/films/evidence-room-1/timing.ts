// =============================================================================
// THE EVIDENCE ROOM, PART 1: TIMING FILE
// =============================================================================
// This is the ONLY place that decides WHEN things happen.
//
// After the voiceover is recorded:
//   1. Put the audio at  public/evidence-room-1/voiceover.mp3
//   2. Set HAS_VOICEOVER to true below.
//   3. Change the start / end seconds of each beat in BEATS to match the audio.
//      Everything inside a beat (panels, bubbles, stamps, bursts) stretches to fit,
//      because the CUES below are fractions (0 to 1) of the beat's length.
//   4. If one bubble or stamp is a little off, nudge its cue fraction in CUES.
//
// The total film length is taken from the last beat's end time.
// =============================================================================

import { FPS } from "../../shared/theme";

/** Flip to true once public/evidence-room-1/voiceover.mp3 exists. */
export const HAS_VOICEOVER = false;
export const VOICEOVER_FILE = "evidence-room-1/voiceover.mp3";

export type BeatId = "b1" | "b2" | "b3" | "b4" | "b5" | "b6" | "b7" | "b8" | "b9";

/** Beat start and end, in SECONDS, from script.md. */
export const BEATS: Record<BeatId, { title: string; start: number; end: number }> = {
  b1: { title: "THE CASE", start: 0, end: 25 }, // 0:00 to 0:25
  b2: { title: "THE CLAIM", start: 25, end: 65 }, // 0:25 to 1:05
  b3: { title: "THE DATE", start: 65, end: 105 }, // 1:05 to 1:45
  b4: { title: "THE HAIR", start: 105, end: 155 }, // 1:45 to 2:35
  b5: { title: "THE NUMBERS", start: 155, end: 185 }, // 2:35 to 3:05
  b6: { title: "THE GREEK WITNESS", start: 185, end: 235 }, // 3:05 to 3:55
  b7: { title: "THE EVIDENCE BOARD", start: 235, end: 265 }, // 3:55 to 4:25
  b8: { title: "THE VERDICT", start: 265, end: 290 }, // 4:25 to 4:50
  b9: { title: "NEXT CASE + END CARD", start: 290, end: 300 }, // 4:50 to 5:00
};

export const BEAT_ORDER: BeatId[] = ["b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8", "b9"];

export const secToFrames = (s: number) => Math.round(s * FPS);
export const beatStartFrame = (id: BeatId) => secToFrames(BEATS[id].start);
export const beatLengthFrames = (id: BeatId) => secToFrames(BEATS[id].end) - secToFrames(BEATS[id].start);
export const TOTAL_FRAMES = secToFrames(BEATS.b9.end);

/** The end card is the whole of beat 9 (the last 10 seconds). */
export const END_CARD_SECONDS = 10;

export type Cue = number | [number, number];

/**
 * Cues: fractions (0 to 1) of each beat's length.
 *  - a single number = when something starts (a panel slams in, a stamp lands, a hit happens)
 *  - [from, to]      = how long a bubble or caption is on screen
 */
export const CUES: Record<BeatId, Record<string, Cue>> = {
  b1: {
    pA: 0,
    title: 0.03,
    l1: [0.08, 0.34], // "Ladies and gentlemen..."
    pB: 0.2,
    l2: [0.38, 0.68], // "Today's case..."
    pC: 0.72,
    hit: 0.76, // gavel slam + ORDER!
  },
  b2: {
    pA: 0,
    d1: [0.05, 0.28], // "Siberia! A huge burial mound..."
    pB: 0.3,
    seeds: 0.34, // seeds start to spill
    d2a: [0.3, 0.47], // "And inside the central chamber,"
    d2b: [0.48, 0.79], // "researchers report somewhere between..."
    counter: 0.6, // seed counter pops
    pC: 0.8,
    stamp: 0.86, // Clerk stamps SOURCE
    cap: [0.84, 1.0], // "Source: study published in Science..."
  },
  b3: {
    pA: 0,
    card: 0.03,
    c1a: [0.06, 0.3], // "Radiocarbon dating of six of those seeds..."
    marker: 0.2,
    c1b: [0.31, 0.52], // "That is somewhere around..."
    years: 0.38,
    pB: 0.54,
    d1: [0.56, 0.77], // "The oldest directly dated evidence..."
    pC: 0.78,
    o1: [0.8, 1.0], // "Hold on. 'Used to get high'..."
  },
  b4: {
    pA: 0,
    c1a: [0.04, 0.17], // "The seeds are not the key evidence. The hair is."
    c1b: [0.18, 0.4], // "Researchers report finding traces of THC..."
    pB: 0.41,
    d1: [0.43, 0.51], // "Proof they used it!"
    o1: [0.52, 0.64], // "Or proof the hair spent..."
    c2a: [0.66, 0.82], // "That is the objection. One outside researcher said..."
    pC: 0.7,
    c2b: [0.83, 0.97], // "Hair buried beside the seeds..."
  },
  b5: {
    pA: 0,
    o1: [0.05, 0.56], // "Another outside expert called the CBN levels..."
    pB: 0.5,
    cap: [0.58, 1.0], // "Contested. Both views are in the sources."
    stamp: 0.64,
  },
  b6: {
    pA: 0,
    c1a: [0.04, 0.13], // "Why does this matter? Because ... Herodotus described Scythian people using hemp seeds."
    c1b: [0.13, 0.205], // "He places it after a funeral, as a way to cleanse themselves."
    pB: 0.21,
    d1: [0.23, 0.44], // "He wrote that they crawled under felt covers..."
    steam: 0.3,
    pC: 0.46,
    o1: [0.48, 0.62], // "Herodotus wrote that centuries after... historians debate...""
    pD: 0.63,
    c2a: [0.65, 0.8], // "Archaeologists place Tunnug 1 in the oldest Scythian horizon."
    c2b: [0.81, 0.98], // "But the tomb does not establish..."
  },
  b7: {
    pA: 0,
    cl1: [0.04, 0.32], // "Seeds: found, and radiocarbon dated."
    card1: 0.06,
    stamp1: 0.2,
    cl2: [0.33, 0.58], // "Hair chemistry: contested."
    card2: 0.35,
    stamp2: 0.47,
    cl3: [0.59, 0.92], // "Use in burial ceremonies: not established."
    card3: 0.61,
    stamp3: 0.76,
  },
  b8: {
    pA: 0,
    c1a: [0.04, 0.3], // "The court finds: the seeds are real..."
    c1b: [0.34, 0.5], // "Verdict: plausible, not proven."
    pB: 0.49,
    hit: 0.53, // verdict stamp + starburst + flash + page shake
    pC: 0.62,
    d1: [0.64, 0.8], // "Plausible is still exciting!"
    pD: 0.8,
    o1: [0.82, 0.99], // "Plausible is where arguments start."
    pushFrom: 0.0, // slow push-in over the whole verdict
    pushTo: 1.0,
  },
  b9: {
    pA: 0,
    c1a: [0.04, 0.5], // "Next time: a Roman fort in Wales, and a legend..."
    c1b: [0.51, 0.96], // "Case adjourned."
    pB: 0.06, // "Next: a Roman fort in Wales"
    pC: 0.16, // series title + sources line
    hit: 0.56, // final gavel bang
  },
};

export const cueFrame = (id: BeatId, name: string): number => {
  const c = CUES[id][name];
  if (c === undefined) throw new Error(`Missing cue ${id}.${name}`);
  const v = Array.isArray(c) ? c[0] : c;
  return Math.round(v * beatLengthFrames(id));
};

export const cueSpan = (id: BeatId, name: string): [number, number] => {
  const c = CUES[id][name];
  if (!Array.isArray(c)) throw new Error(`Cue ${id}.${name} is not a span`);
  const len = beatLengthFrames(id);
  return [Math.round(c[0] * len), Math.round(c[1] * len)];
};
