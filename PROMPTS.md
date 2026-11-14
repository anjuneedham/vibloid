# Vibloid Build Prompts: Wealth and Motivation Faceless Channel Platform

Run these in order, each in a fresh or continued Claude Code session. Each prompt is self-contained and ends with acceptance criteria. Commit after each one.

---

## Prompt 0: Project brief (paste first, keep as CLAUDE.md)

You are building **Vibloid**, a private, single-user platform that helps me run a faceless YouTube channel (long-form and Shorts) in the money, wealth-building, and motivation niche.

Pipeline: **Source (link or upload) -> transcript -> clip/idea selection -> original script and commentary -> voiceover -> visuals -> captions -> render -> title/thumbnail/SEO -> human review -> scheduled YouTube upload -> analytics feedback**.

Stack: Next.js (App Router, TypeScript) on Vercel; Supabase (Postgres, Auth, Storage); a separate long-running worker (Node + FFmpeg, containerized, deployable to Fly/Railway) for heavy media jobs, because Vercel functions can't run long FFmpeg jobs; a Postgres-backed job queue; Claude API for all LLM steps (use the latest model IDs); Whisper-class speech-to-text; a pluggable TTS provider; a pluggable stock/image provider.

Hard rules:
1. Every external provider sits behind an interface (`TTSProvider`, `TranscriptProvider`, `ImageProvider`, `LLM`) so I can swap vendors and mock in tests.
2. Nothing publishes without an explicit human approval click. No exceptions.
3. Every clip records `source_url`, `rights_status` (`own | licensed | permissioned | commentary_fair_use | unknown`), and attribution. `unknown` cannot be rendered for publishing.
4. No financial advice claims. All generated scripts must avoid guaranteed-returns language, fake income screenshots, and fake testimonials. Add a disclaimer snippet to descriptions.
5. Every job is idempotent, resumable, and logs cost (tokens, TTS characters, seconds) to a `job_costs` table.
6. Secrets live in env vars. Never commit keys.

First task: create the repo skeleton, `CLAUDE.md` containing this brief, `.env.example`, a README with setup steps, and a `docs/architecture.md`. Do not build features yet.

Acceptance: `pnpm dev` runs a placeholder page; lint and typecheck pass; the architecture doc has a diagram (Mermaid) of the pipeline.

---

## Prompt 1: Data model and job queue

Design and migrate the Supabase schema:
`channels`, `sources` (url, type, rights_status, license_note, attribution, status), `transcripts` (word-level timestamps JSONB), `clips` (source_id, start_s, end_s, score, reason, hook_text, status), `projects` (a video being made: format short/long, topic, status), `scripts` (versions), `assets` (audio/image/video in Storage), `renders`, `publish_queue` (scheduled_at, approved_by, approved_at), `analytics_snapshots`, `jobs` (type, payload, state, attempts, error, locked_by, run_after), `job_costs`.

Implement a Postgres job queue using `SELECT ... FOR UPDATE SKIP LOCKED`, with retry and backoff, a dead-letter state, and a `claim_job` function. Enable RLS on every table for a single authenticated owner. Generate TS types.

Acceptance: migrations apply cleanly; a script enqueues 100 jobs and 3 concurrent workers process each exactly once; RLS blocks anon access (include a test).

---

## Prompt 2: Source ingestion and the link clipper

Build ingestion for two paths:
(a) **Upload** of my own video/audio files to Supabase Storage.
(b) **Link ingestion** (YouTube or direct video URL). Before downloading, show a rights gate: the user must choose a `rights_status` and add a license or permission note. Block `unknown`. Store the original URL and creator name for attribution. Respect robots/ToS; if a download is not permitted for that status, fall back to storing only the URL and timestamps for reference (no media copy).

In the worker: download or ingest, normalize with FFmpeg (mp4/h264/aac, 1080p cap), extract audio, transcribe with word-level timestamps behind `TranscriptProvider`, store the transcript.

Acceptance: pasting a link, selecting rights, and waiting yields a transcript row with word timings; the UI shows job progress and cost; blocked statuses never download.

---

## Prompt 3: Clip and highlight selection (the clipper brain)

Given a transcript, call Claude to propose 5 to 15 candidate clips (15 to 60 s for Shorts; 60 to 180 s for long-form segments). Use structured JSON output and validate it with zod. For each clip return: `start_s`, `end_s` (snap to sentence/word boundaries from the transcript), `hook_text` (a first-3-seconds hook), `why_it_works`, `topic_tags`, `score 0-100` with sub-scores (hook strength, standalone clarity, emotional payload, quotability), and a `risk_flags` array (e.g. financial-advice claim, profanity, third-party music).

Add a rubric prompt file under `/prompts/clip-select.md` so I can tune it. Build a review UI: waveform and transcript with draggable in/out handles, accept/reject, and a "regenerate with feedback" box.

Acceptance: a golden-file test on a sample transcript returns valid, boundary-snapped clips; the UI can trim and save; rejected clips feed back as negative examples.

---

## Prompt 4: Original script and commentary generator

For a chosen topic or accepted clips, generate an **original** video script: pattern-interrupt hook, a clear promise, 3 to 5 beats with concrete examples, pacing notes, and a call to action. Clips are used as evidence or quotes inside my commentary, never the whole video. Provide the formats: "7 money habits", "story-driven motivation", "explained simply" (e.g., compound interest, inflation), "myth vs reality".

Include a niche-specific system prompt in `/prompts/script.md`: no guaranteed returns, no get-rich-quick claims, cite figures with source and date, flag any statistic for manual fact-check, and add `[CITATION NEEDED]` markers I must resolve before the render is allowed. Support Shorts (under 60 s, about 150 words) and long-form (8 to 12 min).

Acceptance: a script has a `fact_check_items` list; render is blocked while any remain unresolved; versions are saved and diffable.

---

## Prompt 5: Voiceover, visuals, and captions

Implement `TTSProvider` (ElevenLabs-style plus a free/local fallback), generating per-beat audio with word timings. Implement visual planning: for each beat, an LLM returns a visual query; fetch stock footage/images via `ImageProvider` (record license metadata), with a Ken Burns fallback. Burn in animated word-by-word captions (large, safe-area aware, high contrast) in the style typical for Shorts. Add royalty-free music with ducking under the voice.

Acceptance: from an approved script, produce an assembled timeline JSON (tracks, in/out, assets); license metadata is stored for every third-party asset; captions are synced to within 100 ms in a test.

---

## Prompt 6: Render engine

In the worker, render the timeline to MP4 with FFmpeg: 9:16 for Shorts and 16:9 for long-form, loudness normalized (-14 LUFS), 1080p, and a deterministic output hash. Add a preview render (low-res) for fast review. Add a "reframe" step for source clips (center-crop with optional face/subject tracking later). Store the output in Storage and write a `renders` row with duration, size, and cost.

Acceptance: a 45 s Short renders in under about 2 minutes on a 2-vCPU container; a re-run with the same input is idempotent; failures retry and resume.

---

## Prompt 7: Packaging: titles, thumbnails, SEO

Generate 10 title options (curiosity plus clarity, under 60 characters), pick the top 3 with reasoning, a description (with the disclaimer, source attributions, and chapters auto-built from beats), tags, and 3 thumbnail concepts. Render thumbnails (1280x720) from templates: big contrasting text of 4 words or fewer, subject on a brand-color background. No misleading clickbait: add a check that the title promise is actually delivered by the script.

Acceptance: a "promise-delivery" validator flags titles the script doesn't support; thumbnails export; all text passes a contrast check.

---

## Prompt 8: Review gate and YouTube publishing

Build the approval workflow: a checklist (rights OK, facts resolved, disclaimer present, no unlicensed audio, preview watched), then "Approve". Integrate the YouTube Data API with OAuth for my channel: resumable upload, set title/description/tags/thumbnail, schedule publish, mark the "altered or synthetic content" disclosure where applicable, and respect quota limits (track the daily quota). Store the video ID.

Acceptance: an unapproved item can never reach the uploader (test); an approved item uploads as private or scheduled; quota usage is displayed.

---

## Prompt 9: Analytics feedback loop

Pull YouTube Analytics daily (views, average view duration, retention curve, CTR, subscribers gained). Store snapshots. Build a "what's working" view: top hooks, best topics, best length, best posting time. Feed the winners back into the clip-select and script prompts as few-shot examples, and have Claude write a weekly "do more / stop doing" report with a content calendar for next week.

Acceptance: a weekly report is generated from real snapshot data; the calendar creates draft projects in the queue.

---

## Prompt 10: Dashboard UI and polish

Build the app UI: Library (sources and clips), Studio (script, timeline, preview), Queue (review, schedule), Insights, Costs (per-video and monthly spend vs. budget alerts), and Settings (providers, brand kit: fonts, colors, intro/outro). Mobile-friendly review screens. Add keyboard shortcuts in the clip trimmer.

Acceptance: end-to-end demo: paste an owned or licensed link, get clips, generate a script, render, review, schedule, all in one session, with per-video cost shown.

---

## Prompt 11: Hardening

Add structured logging, Sentry-style error capture, rate-limit handling and circuit breakers for every provider, secrets scanning in CI, a seed script and fixtures, an end-to-end Playwright test of the whole pipeline with mocked providers, and a runbook in `docs/`. Run a security review of the repo.

Acceptance: CI green; the e2e test passes offline; the runbook covers the top 10 failure modes.
