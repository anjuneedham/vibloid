# Architecture

```mermaid
flowchart LR
  A[Source: upload / link + rights gate] --> B[Ingest + normalize]
  B --> C[Transcript w/ word timings]
  C --> D[Clip selection - Claude]
  D --> E[Original script + fact-check items]
  E --> F[TTS voiceover]
  F --> G[Visual plan + assets]
  G --> H[Timeline JSON]
  H --> I[FFmpeg render]
  I --> J[Titles / thumbnails / SEO]
  J --> K{Human review gate}
  K -->|approved| L[YouTube upload / schedule]
  L --> M[Analytics snapshots]
  M --> N[Weekly report + calendar]
  N --> E
```

Components
- **web** (Next.js, Vercel): UI + API routes; enqueues jobs, never does heavy media work.
- **worker** (Node + FFmpeg, container): claims jobs from the `jobs` table with `FOR UPDATE SKIP LOCKED`.
- **Neon Postgres**: system of record and queue.
- **Storage**: interface; local disk in dev, object storage in prod.
