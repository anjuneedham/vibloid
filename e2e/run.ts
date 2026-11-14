/**
 * Full-pipeline browser test, fully offline: mock LLM/TTS/images/transcripts/YouTube.
 * Usage: pnpm e2e   (needs ffmpeg, a Postgres at E2E_ADMIN_URL, and Playwright resolvable from NODE_PATH)
 */
import { spawn, execSync, type ChildProcess } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import pg from "pg";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const ADMIN = process.env.E2E_ADMIN_URL ?? "postgres://postgres@localhost:5433/postgres";
const DB = "vibloid_e2e";
const DBURL = ADMIN.replace(/\/[^/]*$/, `/${DB}`);
const PORT = 3100, BASE = `http://localhost:${PORT}`;
const storage = fs.mkdtempSync(path.join(os.tmpdir(), "e2e-storage-"));
const env = {
  ...process.env, DATABASE_URL: DBURL, STORAGE_DIR: storage, SESSION_SECRET: "e2e-secret-e2e-secret", OWNER_PASSWORD: "e2e-pass",
  LLM_PROVIDER: "mock", TTS_PROVIDER: "mock", IMAGE_PROVIDER: "mock", TRANSCRIPT_PROVIDER: "mock", YOUTUBE_PROVIDER: "mock", ANALYTICS_PROVIDER: "mock",
  WORKER_POLL_MS: "300", NODE_ENV: "production", ALLOW_PRIVATE_URLS: "0",
} as unknown as NodeJS.ProcessEnv;

const procs: ChildProcess[] = [];
const step = (m: string) => console.log(`\n▶ ${m}`);
function start(name: string, cmd: string, args: string[]) {
  const p = spawn(cmd, args, { env, stdio: ["ignore", "pipe", "pipe"] });
  p.stdout!.on("data", (d: Buffer) => process.env.E2E_VERBOSE && process.stdout.write(`[${name}] ${d}`));
  p.stderr!.on("data", (d: Buffer) => process.env.E2E_VERBOSE && process.stderr.write(`[${name}] ${d}`));
  procs.push(p);
  return p;
}
async function until<T>(what: string, fn: () => Promise<T | false | null | undefined>, ms = 120_000) {
  const t0 = Date.now();
  for (;;) {
    const v = await fn().catch(() => false);
    if (v) return v as T;
    if (Date.now() - t0 > ms) throw new Error(`timed out waiting for: ${what}`);
    await new Promise((r) => setTimeout(r, 500));
  }
}

async function main() {
  step("database");
  const admin = new pg.Client({ connectionString: ADMIN }); await admin.connect();
  await admin.query(`drop database if exists ${DB}`); await admin.query(`create database ${DB}`); await admin.end();
  execSync("pnpm db:migrate", { env, stdio: "inherit" });

  step("sample video (60s, own)");
  const sample = path.join(storage, "sample.mp4");
  execSync(`ffmpeg -y -f lavfi -i testsrc2=duration=60:size=1280x720:rate=24 -f lavfi -i sine=frequency=330:duration=60 -c:v libx264 -pix_fmt yuv420p -c:a aac -shortest ${sample}`, { stdio: "ignore" });

  step("build + start web and worker");
  execSync("pnpm build", { env, stdio: "ignore" });
  start("web", "pnpm", ["exec", "next", "start", "-p", String(PORT)]);
  start("worker", "pnpm", ["worker"]);
  await until("web up", async () => (await fetch(`${BASE}/login`)).ok);

  const browser = await chromium.launch({ args: ["--no-sandbox"] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(60_000);
  const errors: string[] = [];
  page.on("pageerror", (e: Error) => errors.push(e.message));

  try {
    step("auth: protected page redirects, wrong password rejected, right password works");
    await page.goto(`${BASE}/studio`); await page.waitForURL("**/login");
    await page.fill("input[type=password]", "wrong"); await page.click("button[type=submit]"); await page.getByText("Wrong password").waitFor();
    await page.fill("input[type=password]", "e2e-pass"); await page.click("button[type=submit]"); await page.waitForURL("**/library");

    step("library: unknown rights cannot be chosen; upload own video");
    const opts = await page.locator("select option").allTextContents();
    if (opts.some((o: string) => /unknown/i.test(o))) throw new Error("'unknown' rights must not be selectable");
    await page.getByRole("button", { name: "Upload" }).click();
    await page.setInputFiles("input[type=file]", sample);
    await page.getByRole("button", { name: "Add source" }).click();
    await page.getByText("Ingesting").waitFor();
    await page.getByRole("link", { name: /sample\.mp4/ }).waitFor();
    await until("source ready", async () => (await page.reload(), await page.getByText("ready", { exact: true }).first().isVisible()));

    step("clips: find, review, keyboard-accept");
    await page.getByRole("link", { name: /sample\.mp4/ }).click();
    await page.getByRole("button", { name: "Find clips" }).click();
    await page.getByText("Income is not wealth").waitFor({ timeout: 90_000 });
    await page.locator(".card", { hasText: "Income is not wealth" }).click();
    await page.keyboard.press("a");
    await page.locator(".card", { hasText: "Income is not wealth" }).getByText("accepted").waitFor();

    step("studio: create project with the accepted clip, script is drafted");
    await page.goto(`${BASE}/studio`);
    await page.fill("label:has-text('Title') input", "4 wealth habits");
    await page.getByText("Income is not wealth").locator("xpath=ancestor::label//input").check();
    await page.getByRole("button", { name: /Create and draft/ }).click();
    await page.waitForURL(/\/studio\/[0-9a-f-]{36}/);
    await page.getByText("Script v1").waitFor({ timeout: 90_000 });

    step("gates: render is blocked until the citation is resolved");
    await page.getByText(/unresolved fact-check/).first().waitFor();
    if (!(await page.getByRole("button", { name: "1. Voice + visuals" }).isDisabled())) throw new Error("assemble must be disabled while blockers exist");
    await page.getByPlaceholder("Source / citation").fill("BLS CPI data, 1925-2025");
    await page.getByRole("button", { name: "Resolve" }).click();
    await until("assemble enabled", async () => !(await page.getByRole("button", { name: "1. Voice + visuals" }).isDisabled()));

    step("pipeline: assemble, final render, package");
    await page.getByRole("button", { name: "1. Voice + visuals" }).click();
    await until("assembled", async () => (await page.getByText("assembled", { exact: true }).first().isVisible()), 120_000);
    await page.getByRole("button", { name: "3. Final render" }).click();
    await page.locator("video").first().waitFor({ timeout: 180_000 });
    await page.getByRole("button", { name: "4. Title, thumbnails, SEO" }).click();
    await page.getByText("promise check passed").waitFor({ timeout: 120_000 });
    await page.getByText("4 habits that quietly build wealth").first().waitFor();

    step("queue: approve is gated by the watch checkbox; approve; mock upload happens");
    await page.goto(`${BASE}/queue`);
    const approve = page.getByRole("button", { name: /Approve/ });
    await approve.waitFor();
    if (!(await approve.isDisabled())) throw new Error("approve must be disabled before confirming the watch");
    await page.getByLabel(/I watched the final video/).check();
    await until("approve enabled", async () => !(await approve.isDisabled()));
    await approve.click();
    await page.getByText("uploaded_private").waitFor({ timeout: 60_000 });
    await page.getByText("mock_1").waitFor();

    step("insights, costs, settings render");
    await page.goto(`${BASE}/insights`); await page.getByRole("heading", { name: /What’s working/ }).waitFor();
    await page.goto(`${BASE}/costs`); await page.getByRole("heading", { name: "Costs" }).waitFor();
    await page.goto(`${BASE}/settings`); await page.getByText("mock", { exact: false }).first().waitFor();

    step("api guard: anonymous requests are rejected");
    for (const p of ["/api/sources", "/api/projects", "/api/publish", "/api/costs", "/api/insights"]) {
      const r = await fetch(BASE + p); if (r.status !== 401) throw new Error(`${p} returned ${r.status}, expected 401`);
    }
    const bad = errors.filter((e) => !/ResizeObserver/.test(e));
    if (bad.length) throw new Error("browser errors: " + bad.join(" | "));
    console.log("\n✅ e2e passed");
  } catch (e) {
    await page.screenshot({ path: path.join(os.tmpdir(), "e2e-failure.png") }).catch(() => {});
    console.error("\n❌ e2e failed; screenshot at", path.join(os.tmpdir(), "e2e-failure.png"));
    throw e;
  } finally {
    await browser.close();
  }
}

main().then(() => cleanup(0), (e) => { console.error(e); cleanup(1); });
function cleanup(code: number) {
  procs.forEach((p) => p.kill("SIGTERM"));
  setTimeout(() => { fs.rmSync(storage, { recursive: true, force: true }); process.exit(code); }, 800);
}
