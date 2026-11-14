# Vibloid

Private single-user platform for running a faceless YouTube channel (long-form + Shorts) in the money / wealth / motivation niche.

Pipeline: Source (link/upload) -> transcript -> clip/idea selection -> original script + commentary -> voiceover -> visuals -> captions -> render -> title/thumbnail/SEO -> human review -> scheduled YouTube upload -> analytics feedback.

Stack: Next.js (App Router, TS) on Vercel; **Neon Postgres** (plain `pg`, migrations in `/migrations`); media files via a `Storage` interface (local disk by default, S3/R2/Vercel Blob pluggable); separate Node + FFmpeg worker (`/worker`) for heavy jobs; Postgres-backed job queue; Claude API for LLM steps.

Hard rules
1. Every external provider sits behind an interface (`TTSProvider`, `TranscriptProvider`, `ImageProvider`, `LLM`, `Storage`) with mocks for tests.
2. Nothing publishes without explicit human approval.
3. Every clip records source_url, rights_status (own|licensed|permissioned|commentary_fair_use|unknown), attribution. `unknown` can never be rendered for publishing.
4. No financial-advice claims: no guaranteed returns, fake income screenshots or testimonials. Disclaimer in every description.
5. Jobs are idempotent, resumable, and log cost to `job_costs`.
6. Secrets only in env vars. Never commit keys.
7. Auth is app-level (single owner, `OWNER_PASSWORD` + signed cookie). Neon has no RLS-per-user; never expose the DB to the browser.
