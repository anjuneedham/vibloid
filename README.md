# Vibloid

Faceless YouTube channel studio (wealth / motivation). See `PROMPTS.md` for the build plan and `docs/architecture.md`.

## Setup
1. `pnpm install`
2. Create a Neon project, copy the connection string into `.env.local` as `DATABASE_URL` (see `.env.example`).
3. `pnpm db:migrate`
4. `pnpm dev` (web) and `pnpm worker` (in another terminal; needs `ffmpeg` on PATH).
5. `pnpm test` runs tests against `TEST_DATABASE_URL` (a throwaway Postgres) .

Providers default to mocks so the whole pipeline runs without paid keys.
