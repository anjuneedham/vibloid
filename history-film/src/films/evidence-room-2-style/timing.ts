// Timing for the Episode 2 style tests, in SECONDS, shaped like a transcript of a real voiceover.
// When the owner records, replace these with the real line times (scripts/make_timing.py style) and everything re-flows.
export const SHADOW_TEST = {
  seconds: 14.4,
  lines: {
    open: [0.4, 2.9],
    claim: [3.5, 5.2],
    object: [5.6, 7.0],
    source: [10.1, 11.7],
    verdict: [12.0, 12.9],
  },
  place: [7.25, 9.85],
  hit: 13.05,
} as const;

/** The Short is cut from lines recorded for the long film: only these four line times are needed. */
export const LINO_TEST = {
  seconds: 10.0,
  lines: {
    open: [0.05, 1.9], // the hook
    claim: [2.1, 3.9],
    object: [4.1, 5.9],
    source: [6.1, 7.0],
    verdict: [7.1, 7.6],
  },
  hit: 7.7,
} as const;
