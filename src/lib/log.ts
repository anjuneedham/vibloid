type Level = "debug" | "info" | "warn" | "error";
const ORDER: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };

/** One JSON object per line: easy to ship to any log platform. */
export function log(level: Level, msg: string, ctx: Record<string, unknown> = {}) {
  if (ORDER[level] < ORDER[(process.env.LOG_LEVEL as Level) ?? "info"]) return;
  const line = JSON.stringify({ ts: new Date().toISOString(), level, msg, ...ctx });
  (level === "error" || level === "warn" ? process.stderr : process.stdout).write(line + "\n");
}
export const logger = {
  debug: (m: string, c?: Record<string, unknown>) => log("debug", m, c),
  info: (m: string, c?: Record<string, unknown>) => log("info", m, c),
  warn: (m: string, c?: Record<string, unknown>) => log("warn", m, c),
  error: (m: string, c?: Record<string, unknown>) => log("error", m, c),
};

/**
 * Error capture hook. Always logs; if ERROR_WEBHOOK_URL is set (Slack/Discord/your own collector) it also posts a short JSON payload.
 * Never throws, never includes secrets (only message + stack + the context you pass).
 */
export function captureError(err: unknown, ctx: Record<string, unknown> = {}) {
  const e = err instanceof Error ? err : new Error(String(err));
  log("error", e.message, { ...ctx, stack: e.stack?.split("\n").slice(0, 6).join("\n") });
  const url = process.env.ERROR_WEBHOOK_URL;
  if (url) fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: `[vibloid] ${e.message}`, ...ctx }) }).catch(() => {});
}
