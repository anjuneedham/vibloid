# Vibloid

Private studio for running a faceless YouTube channel (money / wealth / motivation): source or idea -> transcript -> clips -> original script -> voiceover -> visuals -> captions -> render -> title/thumbnail/SEO -> **human approval** -> YouTube upload -> analytics -> weekly plan.

See `PROMPTS.md` (the build plan), `docs/architecture.md`, and `docs/runbook.md` (failure modes).

## Quick start

```bash
pnpm install
cp .env.example .env.local      # fill DATABASE_URL etc.
pnpm db:migrate
pnpm seed                       # optional: demo channel + a generated sample source
pnpm dev                        # web on :3000
pnpm worker                     # in a second terminal (needs ffmpeg on PATH)
```

Everything defaults to **mock providers** (placeholder voice/images, canned transcripts), so the pipeline runs without paid keys. Set `LLM_PROVIDER` (unset = Anthropic) and the other `*_PROVIDER` variables plus keys in `.env.local` to go real.

## Neon

1. Create a Neon project and copy the connection strings.
2. `DATABASE_URL` = the **pooled** string for the web app and worker; run `pnpm db:migrate` with the **direct** string (set `DATABASE_URL` to it for that one command).
3. The worker polls the queue every `WORKER_POLL_MS` (2 s). That keeps Neon compute awake; raise it (e.g. 15000) if you want scale-to-zero.
4. There is no Supabase-style row-level security here. Access control is app-level: one owner password, a signed cookie, and an owner check on every API route (enforced by a test). Never expose the database URL to the browser.

## Commands

| | |
|---|---|
| `pnpm test` | unit/integration tests; needs `TEST_DATABASE_URL` (a throwaway Postgres, default `postgres://postgres@localhost:5433/vibloid`). **It drops and recreates the `public` schema, so never point it at a real database.** |
| `pnpm e2e` | full browser pipeline with mock providers (needs Playwright and a Postgres at `E2E_ADMIN_URL`) |
| `pnpm typecheck` / `pnpm lint` | `tsc --noEmit` (there is no ESLint config) |
| `pnpm scan:secrets` | repo secret scan (CI also runs gitleaks) |

## Safety rules built in
- Link sources need a rights status; `unknown` is not selectable. Media is only downloaded for `own` / `licensed` / `permissioned`.
- Scripts cannot render while fact-check items or `[CITATION NEEDED]` markers remain, or if they promise guaranteed returns, "risk-free", get-rich-quick, etc.
- Nothing uploads without an explicit approval click. The database refuses to advance an unapproved queue row, and the uploader re-checks every gate right before calling YouTube.
- Uploads declare synthetic media and include a financial disclaimer.
