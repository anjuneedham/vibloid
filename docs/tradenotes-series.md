# TradeNotes series: "Stuck on a plateau" (5 Shorts)

Channel: **Andrew Builds (TradeNotes)** (brand channel, trading niche). Format: 45-60 s vertical Shorts, code-drawn scenes, Kokoro voice.
Specs live in `specs/tradenotes/`; reusable formats in `specs/templates/` (see the README there). `tests/tradenotes-specs.test.ts` checks every spec in both folders.

## Audience
Traders who already trade and already try: results flat for months, switching strategies, watching more content, maybe keeping a P&L-only journal.
They do not need motivation. They need a different thing to measure. Tone: calm, specific, a peer who builds a journal app, never a guru.

## Hook formulas (first 3 seconds, 12 words or fewer)
1. **True observation + reversal**: "Your trading results are stuck. But it's not why you think."
2. **Praise, then doubt**: "Your backtest looks great. That might be the problem."
3. **Number-free tease**: "One tag in your journal can expose your worst habit."
4. **Identity call-out**: "Your weekly trade review is missing a step. Probably the important one."

Never hype, never a result ("how I..."), never a number the video cannot source. The on-screen hook is a `kinetic` scene: 3-4 lines, 14 characters or fewer each, last line amber.

## Curiosity-loop rules
- **Promise + loop A by second 8** (18 words or fewer): a named count with the last item teased ("three things... the third almost nobody writes down").
- **Re-hook every 8-12 s**: each beat ends on a line the next beat only partly answers ("Still, one piece is missing.", "Here is what surprised me.").
- **At most 3 loops open at once.** Typical set: H (the hook's "why"), A (the named count), B (a twist opened mid-video).
- **Every loop is paid off truthfully in the same video**, smallest first, the hook's loop last, right before the CTA. If the payoff is modest, make the tease modest.
- **CTA after the payoff**: one small action for today, then "Not financial advice."
- Budget: 150-158 words total gives 57-60 s (Kokoro runs about 2.6 words/s including the 2 s end hold).

## Compliance guardrails (prompts/trading.md, prompts/brand.md, CLAUDE.md rule 4)
- Educational only. No win rate, profit, "this works", "will improve your returns", signals, entries or targets.
- Journaling = evidence about your own behavior. Backtesting = what an idea did historically, never a prediction. Say so whenever backtesting is mentioned.
- Narration is number-free (no `%`, no `$`). Numbers appear only in scenes that carry the "SAMPLE DATA · NOT REAL TRADES" badge (`chips`, `sum`, `kpis`, `progress`, or `kinetic` with `"badge": true`) and are called "sample" out loud.
- One natural sentence acknowledging risk of loss, inside a beat (not only in the description).
- Spoken ownership: "I built TradeNotes, my own trading journal, so I'm biased." Describe only what the software does. The app gets one beat.
- "Not financial advice." spoken in the CTA and shown on the end card. `claims: []` (nothing in the script needs a source; if a sourced statistic is added, list it in `claims` and resolve it).
- No fake testimonials, user counts or income. Nothing publishes without the owner's approval.

## The five videos

| # | Spec / slug | Working title | Format template | Scene kinds |
|---|---|---|---|---|
| 1 | `01-stuck-not-why.json` / `tradenotes-01-stuck-not-why` (done, rendered) | Your trading is stuck. It's not why you think. | belief-reversal | kinetic, chips, typing, checklist, kpis, checklist, kinetic, endcard |
| 2 | `02-plan-vs-actual.json` / `tradenotes-02-plan-vs-actual` (done, rendered) | You don't have a strategy problem. You have a gap. | belief-reversal | kinetic, typing (the plan), typing (what happened), dots, checklist, kinetic, endcard |
| 3 | `03-backtest-lying.json` / `tradenotes-03-backtest-lying` (done, rendered) | Your backtest looks great. That might be the problem. | belief-reversal (start from `specs/templates/belief-reversal.json`) | kinetic, checklist, dots, kpis, kinetic, checklist, kinetic, endcard |
| 4 | `04-one-tag.json` / `tradenotes-04-one-tag` (done, rendered) | One tag that can expose your worst trading habit | sample-data-reveal (start from `specs/templates/sample-data-reveal.json`) | kinetic+badge, chips, typing, kpis, kinetic+badge, checklist, kinetic, endcard |
| 5 | `05-weekly-loop.json` / `tradenotes-05-weekly-loop` (done, rendered) | Your weekly trade review is missing a step | checklist-loop (start from `specs/templates/checklist-loop.json`) | kinetic, checklist, typing, checklist, dots, checklist, kinetic, endcard |

### 1. Plateau is a measurement problem (final)
- **Hook**: "Your trading results are stuck. But it's not why you think." Opens **H**: why, then?
- **Promise**: "Three things hide in every plateau. The third, almost nobody writes down." Opens **A**.
- Beat 1 (chips, sample P&L): #1 the result; "what happened, never why" keeps H open.
- Beat 2 (typing): #2 the plan; "Still, one piece is missing" advances A.
- Beat 3 (checklist): #3 what you actually did. **Pays A.**
- Beat 4 (kpis, sample counts): "Here is what surprised me" opens and pays **B**: a plateau can look like one habit, repeated.
- Beat 5 (checklist): app beat with ownership line.
- Beat 6 (kinetic): **pays H**: not effort, measurement. Risk sentence.
- **CTA**: "Tonight, log one thing on your last trade: what you actually did. Not financial advice."

### 2. The plan-versus-actual gap (journal)
- **Hook**: "You don't have a strategy problem. You have a gap." Opens **H**: what gap?
- **Promise**: "It sits between two sentences you can write in a minute. Most traders only ever write one." Opens **A** (which two, and which is missing).
- Beat 1 (typing, "Before"): sentence one, the plan: setup, risk, exit. Ends "That is the easy one."
- Beat 2 (typing, "After"): sentence two, what you actually did, written before you look at the result. **Pays A.** Ends "And here is why the order matters."
- Beat 3 (kinetic): opens and pays **B**: once you see the result, you rewrite the story; a win after a broken rule gets remembered as skill.
- Beat 4 (dots, total 20, "trades where plan and action match"): the gap is a count you can watch, not a feeling. No money shown.
- Beat 5 (checklist): app beat, ownership line; it stores both sentences per trade.
- Beat 6 (kinetic): **pays H**: the gap is between plan and action, so a new strategy inherits the same gap. Risk sentence: following a plan does not remove the risk of loss.
- **CTA**: "On your next trade, write the second sentence before you check the result. Not financial advice."

### 3. Your backtest may be lying
- **Hook**: "Your backtest looks great. That might be the problem." Opens **H**.
- **Promise**: "Three quiet errors can flatter a backtest. The third hides in plain sight." Opens **A**.
- Beats 1-3: look-ahead (checklist), overfitting (dots: settings tried on the same data), costs (kpis, hypothetical SAMPLE numbers). Beat 3 **pays A**.
- Beat 4 (kinetic): "Here is the part people skip" opens and pays **B**: even a clean test is history, not a forecast; live trades can lose money.
- Beat 5: app beat (the journal logs what you actually did, to hold next to the test).
- Beat 6: **pays H**: a great backtest is a claim to check, not a finish line.
- **CTA**: ask the three questions before trusting a test. Do not repeat the sample-size / fair-coin point; that video already exists in `scripts/make-tradenotes-videos.ts`.

### 4. The one tag that exposes a habit (SAMPLE data)
- **Hook**: "One tag in your journal can expose your worst habit." Opens **H**: which tag, which habit?
- **Promise**: "Watch ten sample trades. The pattern is not in the wins or the losses." Opens **A**.
- Beat 1 (chips): looks random. Beat 2 (typing): add the tag "after a loss: yes / no".
- Beat 3 (kpis): the split by tag. **Pays A.** The card numbers must be recomputed from the chips.
- Beat 4 (kinetic+badge): twist **B**, opened and paid: ten trades prove nothing; it is a question for your own data.
- Beat 5: app beat (tag trades, split results by tag). Beat 6: **pays H**: the habit hides in what came before the trade. Risk sentence.
- **CTA**: pick one tag, log it on the next twenty trades. Optional variant: time of day instead of after-a-loss.

### 5. The weekly loop
- **Hook**: "Your weekly trade review is missing a step. Probably the important one." Opens **H**.
- **Promise**: "It is a ten-minute loop with three steps. The third is the one people skip." Opens **A**.
- Step 1 (checklist): the journal finds the leak (ties back to videos 1, 2, 4). Step 2 (typing): a backtest questions the fix; history, not a prediction (ties back to 3).
- Step 3 (checklist): write the rule down before Monday. **Pays A and H.**
- Beat 4 (dots): **B**: why it matters; next week's review starts with one count, the days you followed the rule.
- Beat 5: app beat. Beat 6 (kinetic): the whole loop in one line. Risk sentence.
- **CTA**: ten-minute timer this weekend, run it once.

## Production notes
- Run: `TTS_PROVIDER=kokoro pnpm exec tsx scripts/make-short.ts specs/tradenotes/<file>.json` (needs Postgres at `E2E_ADMIN_URL`, default `localhost:5433`, ffmpeg, and `scripts/setup-kokoro.sh` once). Output: `output/shorts/<slug>/`.
- The script's `ok20to45s` QA flag is `false` for this series on purpose (target is 45-60 s). Check `durationS` instead.
- The cover is the frame at 1.6 s, so all hook lines must have landed by then: 4 lines maximum.
- `endcard.tagline` is split into lines after every full stop: avoid "vs." and other abbreviations there.
- `kpis` shows 4 cards at most; `checklist` reads best with 2-3 items; `typing` holds about 4 lines of 24 characters.

## Build status
All five rendered with Kokoro (`output/shorts/<slug>/`: mp4, srt, vtt, cover, POST-COPY.md). Loudness and peak OK on all. Loops: H = hook, A = promise, B = mid-video twist; payoff order smallest first, H last before the CTA.

| # | Hook (tease type) | Loop map | Words | durationS | Output |
|---|---|---|---|---|---|
| 1 | "Your trading results are stuck. But it's not why you think." (reversal + named count) | H 0s; A promise; A paid beat 3; B opened+paid beat 4; H paid beat 6 | 152 | 59.8 | `output/shorts/tradenotes-01-stuck-not-why/` |
| 2 | "You don't have a strategy problem. You have a gap." (reversal; "two sentences, most write one") | H 0s; A promise (which two?); A paid beat 2 ("the order is the trick" opens B); B paid beat 3 (result rewrites the story); dots: gap as a count; H paid beat 6 ("new strategy, same gap") | 158 | 58.7 | `output/shorts/tradenotes-02-plan-vs-actual/tradenotes-02-plan-vs-actual.mp4` |
| 3 | "Your backtest looks great. That might be the problem." (praise, then doubt; named count, "hides in plain sight") | H 0s; A promise; each error ends on a pull ("easy to check" / "harder to see"); A paid beat 3 (costs, SAMPLE kpis); B "the part people skip" opened+paid beat 4; H paid beat 6 | 156 | 60.0 | `output/shorts/tradenotes-03-backtest-lying/tradenotes-03-backtest-lying.mp4` |
| 4 | "One tag in your journal can expose your worst habit." (number-free tease; "not in the wins or the losses") | H 0s; A promise; "so where is it hiding?"; A paid beat 3 (split, kpis recomputed from chips, tested); "but that is not the twist" opens B; B paid beat 4 (the tag shows where, not why); H paid beat 6 | 158 | 57.1 | `output/shorts/tradenotes-04-one-tag/tradenotes-04-one-tag.mp4` |
| 5 | "Your weekly trade review is missing a step. Probably the important one." (identity call-out; before/after promise) | H 0s; A promise (before: regret, after: a loop, last step skipped); "most reviews stop there"; A+H paid beat 3 (write the rule); B "why does that matter?" paid beat 4 (dots); loop restated beat 6 | 158 | 59.8 | `output/shorts/tradenotes-05-weekly-loop/tradenotes-05-weekly-loop.mp4` |

Notes: video 4's twist no longer repeats the small-sample point in narration (it stays in the kpis note); `tests/tradenotes-specs.test.ts` now also checks the five slugs, the 150-158 word budget and that video 4's kpis equal sums of its chips.
