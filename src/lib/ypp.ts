/**
 * YouTube Partner Program (YPP) progress. Pure functions: no I/O, so thresholds and projections are unit-tested.
 * Thresholds are YouTube's published ones as last known; they change occasionally, so confirm in YouTube Studio -> Earn.
 */
export const YPP_THRESHOLDS = {
  early: { subscribers: 500, uploads90: 3, watchHours365: 3_000, shortsViews90: 3_000_000 },  // fan funding only
  full: { subscribers: 1_000, watchHours365: 4_000, shortsViews90: 10_000_000 },             // ad revenue share
} as const;

export type YppSnapshot = {
  subscribers: number | null;
  longWatchMinutes365: number;
  shortsViews90: number;
  longAvgViewDurationS: number | null;
  longWatchMinutes28: number;
  subsGained28: number;
};

export type Req = { label: string; current: number; target: number; met: boolean; pct: number };
export type Tier = { met: boolean; subs: Req; uploads: Req | null; hours: Req; shorts: Req };
export type YppProgress = {
  status: "full" | "early" | "not_yet";
  tiers: { early: Tier; full: Tier };
  projection: {
    remainingSubs: number; remainingHours: number;
    /** Views of the current average length needed to close the watch-hour gap. */
    viewsNeeded: number | null;
    weeksToSubs: number | null; weeksToHours: number | null;
    /** Slowest of the two requirements, on the last 28 days' pace. */
    weeksToFull: number | null;
  };
  nextStep: string;
};

const req = (label: string, current: number, target: number): Req => ({ label, current, target, met: current >= target, pct: Math.min(1, target ? current / target : 1) });
const weeks = (remaining: number, perWeek: number) => (remaining <= 0 ? 0 : perWeek > 0 ? Math.ceil(remaining / perWeek) : null);

export function evaluateYpp(s: YppSnapshot, uploads90: number): YppProgress {
  const subs = s.subscribers ?? 0;
  const hours = s.longWatchMinutes365 / 60;
  const tier = (t: { subscribers: number; watchHours365: number; shortsViews90: number }, withUploads: boolean): Tier => {
    const subsR = req("Subscribers", subs, t.subscribers);
    const uploadsR = withUploads ? req("Public uploads (90 days)", uploads90, YPP_THRESHOLDS.early.uploads90) : null;
    const hoursR = req("Watch hours (365 days)", Math.floor(hours), t.watchHours365);
    const shortsR = req("Shorts views (90 days)", s.shortsViews90, t.shortsViews90);
    return { met: subsR.met && (uploadsR?.met ?? true) && (hoursR.met || shortsR.met), subs: subsR, uploads: uploadsR, hours: hoursR, shorts: shortsR };
  };
  const early = tier(YPP_THRESHOLDS.early, true);
  const full = tier(YPP_THRESHOLDS.full, false);

  const remainingSubs = Math.max(0, YPP_THRESHOLDS.full.subscribers - subs);
  const remainingHours = Math.max(0, YPP_THRESHOLDS.full.watchHours365 - hours);
  const viewsNeeded = remainingHours > 0 && s.longAvgViewDurationS && s.longAvgViewDurationS > 0 ? Math.ceil((remainingHours * 3600) / s.longAvgViewDurationS) : remainingHours > 0 ? null : 0;
  const weeksToSubs = weeks(remainingSubs, s.subsGained28 / 4);
  const weeksToHours = weeks(remainingHours, s.longWatchMinutes28 / 60 / 4);
  const weeksToFull = weeksToSubs == null || weeksToHours == null ? null : Math.max(weeksToSubs, weeksToHours);

  const status = full.met ? "full" : early.met ? "early" : "not_yet";
  let nextStep: string;
  if (full.met) nextStep = "You meet the ad-revenue thresholds. Apply in YouTube Studio -> Earn (review usually takes about a month). Check there for any rights/reused-content flags first.";
  else if (full.subs.pct <= full.hours.pct) nextStep = `Subscribers are the bottleneck: ${remainingSubs} more needed. Add a subscribe CTA and end screens to long-form.`;
  else nextStep = `Watch time is the bottleneck: about ${Math.ceil(remainingHours)} more hours${viewsNeeded ? ` (~${viewsNeeded.toLocaleString("en-US")} more views at your current average watch time)` : ""}. Improve retention and keep publishing long-form.`;
  return { status, tiers: { early, full }, projection: { remainingSubs, remainingHours: Math.ceil(remainingHours), viewsNeeded, weeksToSubs, weeksToHours, weeksToFull }, nextStep };
}
