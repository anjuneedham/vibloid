import type { Handler } from "../../src/lib/queue";
import { ingestSource } from "./ingest";

export const handlers: Record<string, Handler> = {
  ingest_source: (job) => ingestSource(job),
};
