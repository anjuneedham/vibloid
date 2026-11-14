import fs from "node:fs";
import { execSync } from "node:child_process";

export const PATTERNS: [string, RegExp][] = [
  ["Anthropic API key", /sk-ant-[A-Za-z0-9_-]{20,}/],
  ["OpenAI-style key", /\bsk-(proj-)?[A-Za-z0-9]{32,}\b/],
  ["AWS access key id", /\bAKIA[0-9A-Z]{16}\b/],
  ["Google API key", /\bAIza[0-9A-Za-z_-]{35}\b/],
  ["Private key block", /-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----/],
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{36,}\b/],
  ["Slack token", /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/],
  ["Postgres URL with password", /postgres(ql)?:\/\/[^:\s/@]+:(?!pass\b|password\b|change-me\b|xxx)[^@\s]{6,}@(?!localhost|127\.0\.0\.1)[^\s'"]+/],
];

export function scanText(text: string): string[] {
  return PATTERNS.filter(([, re]) => re.test(text)).map(([name]) => name);
}

/** Files that intentionally contain fake secrets as test fixtures. */
const ALLOWLIST = new Set(["tests/security.test.ts"]);

export function scanRepo(): { file: string; finding: string }[] {
  const files = execSync("git ls-files -co --exclude-standard", { encoding: "utf8" }).split("\n").filter(Boolean);
  const out: { file: string; finding: string }[] = [];
  for (const f of files) {
    if (ALLOWLIST.has(f) || /\.(png|jpg|mp4|wav|lock|yaml)$|pnpm-lock/.test(f) || !fs.existsSync(f)) continue;
    const txt = fs.readFileSync(f, "utf8");
    for (const finding of scanText(txt)) out.push({ file: f, finding });
  }
  return out;
}

if (process.argv[1]?.endsWith("scan-secrets.ts")) {
  const hits = scanRepo();
  if (hits.length) { console.error("Possible secrets found:\n" + hits.map((h) => `  ${h.file}: ${h.finding}`).join("\n")); process.exit(1); }
  console.log("no secrets found");
}
