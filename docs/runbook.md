# Vibloid runbook

Where to look first: **worker logs** (JSON lines; filter `"level":"error"` / `"msg":"job deferred"`), then the `jobs` table (`state`, `error`, `attempts`, `run_after`), then the Settings page (providers).

## Deploy shape
- **Web**: Next.js on Vercel. **Worker**: any container with Node 22 + FFmpeg + fonts (Fly, Railway, a VPS). Both use the same `DATABASE_URL` (Neon) and, in production, an object-storage `Storage` implementation (the default `LocalStorage` only works when web and worker share a disk, so on Vercel you need to implement `Storage` for S3/R2/Blob before deploying).
- **Neon**: use the *pooled* URL for the web app; use the *direct* URL for `pnpm db:migrate`. The queue (`FOR UPDATE SKIP LOCKED`) and plain `pg` queries work through the pooler.

## Top 10 failure modes

| # | Symptom | Cause | Fix |
|---|---|---|---|
| 1 | Neon bill higher than expected / compute never sleeps | Worker polls the DB every `WORKER_POLL_MS` (2s default) | Raise to 15000+ or accept the always-on compute. First query after idle can take a second or two on cold start. |
| 2 | Job stuck in `running` | Worker crashed or was redeployed mid-job | The worker re-queues jobs locked >15 min (`reapStale`). To do it now: `update jobs set state='queued', locked_by=null where id='…'`. Renders resume from cached segments. |
| 3 | Render fails: `ffmpeg: not found` or captions look wrong | FFmpeg/libass/fonts missing on the worker | Install `ffmpeg`, `fonts-inter`/`fonts-dejavu`. The caption font in Settings must exist on the worker. |
| 4 | Jobs show `job deferred … circuit open` | A provider (LLM/TTS/images/YouTube) failed repeatedly; breaker open for 60s | Not a failure: deferred jobs do not burn attempts. Check the provider's status page and keys. 401/403 are *not* retried: fix the key. |
| 5 | Upload deferred "daily quota would be exceeded" | YouTube Data API quota (default 10,000 units; one upload ≈ 1,650) | It retries after midnight Pacific. Request a quota increase in Google Cloud if you need more than ~6 uploads/day. Failed attempts still consume quota. |
| 6 | `token refresh failed: 400/401` | Refresh token revoked/expired. If the Google OAuth app is in "Testing", refresh tokens expire after 7 days | Reconnect on Settings. Publish the OAuth app (or use an Internal app) to avoid weekly expiry. If you changed `ENCRYPTION_KEY`, reconnect too. |
| 7 | Queue row `uploading` with an error | Network failure mid-upload | It retries automatically (resumable). If `youtube_video_id` is already set it will not upload twice; check YouTube Studio for a private orphan if attempts ran out. |
| 8 | "render blocked: …" or approval refused | The safety gates working: unresolved `[CITATION NEEDED]`, policy-lint hit, clip source rights unknown, stale render, missing disclaimer | Resolve in Studio (cite sources / edit the script), re-render, re-package, then approve. |
| 9 | `ENOSPC` on the worker | Storage dir full (renders, segment caches, sources) | Delete `projects/*/render-*` caches (safe: they rebuild) and old `sources/*/normalized.mp4`; move to object storage. |
| 10 | Output has placeholder noise audio/gradient images | Mock providers active | The worker logs `MOCK providers active` at startup and Settings shows `mock`. Set `TTS_PROVIDER`, `IMAGE_PROVIDER`, `TRANSCRIPT_PROVIDER` and API keys. |

## Also worth knowing
- **Link downloads**: only for `own`/`licensed`/`permissioned` rights. YouTube links need `yt-dlp` on the worker and can fail for age-gated/blocked videos: upload the file instead. `commentary_fair_use` is reference-only by design. The worker should run with an egress policy that blocks internal ranges (yt-dlp does its own networking; direct downloads are already blocked from private IPs at the socket level).
- **Login** is rate-limited per instance (best effort). Use a long random `OWNER_PASSWORD`.
- **Costs** for LLM calls are estimates (token counts × configurable rates); TTS/transcription are per-character/second estimates. Reconcile with provider invoices.
- **Secrets**: rotate by changing env vars. `SESSION_SECRET` rotation logs you out; `ENCRYPTION_KEY` rotation requires reconnecting YouTube.
- **Backups**: use Neon branches / point-in-time restore for the database. Media in storage is reproducible from the DB except uploaded sources.
- **Not verified against live services** in this repo's test suite: the real ElevenLabs, Pexels, OpenAI, YouTube Data/Analytics API calls and Neon itself. Run one real video through before relying on it, with `MONTHLY_BUDGET_USD` set low.
- **YPP progress tracker** (Insights page): the daily `pull_analytics` job also writes one `channel_snapshots` row per YouTube-connected channel (subscribers, trailing 365-day long-form watch time, trailing 90-day Shorts views, 28-day pace). Thresholds live in `src/lib/ypp.ts` (500/1,000 subs; 3,000/4,000 watch hours or 3M/10M Shorts views; 3 uploads for the early tier). YouTube changes these occasionally: update the constants, and treat Studio -> Earn as authoritative. Watch hours count long-form and live only, Analytics can't filter by privacy, and the upload count only covers videos Vibloid published. The Analytics `creatorContentType` query is untested against the live API; if hours look wrong, compare against Studio first. Subscribers show 0 for channels that hide their count.
