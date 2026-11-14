import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { migrate } from "../scripts/migrate";
import { getPool, closePool } from "../src/lib/db";
import { setStorage, LocalStorage } from "../src/lib/storage";
import { createLinkSource, createUploadSource } from "../src/lib/sources";
import { validateIntake } from "../src/lib/rights";
import { run } from "../src/lib/media";
import { drain } from "../src/lib/queue";
import { ingestSource } from "../worker/handlers/ingest";

let server: http.Server, port = 0, hits = 0, sample: string, tmp: string;

beforeAll(async () => {
  process.env.ALLOW_PRIVATE_URLS = "1";
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "vt-"));
  setStorage(new LocalStorage(path.join(tmp, "storage")));
  await getPool().query("drop schema public cascade; create schema public;");
  await migrate();
  sample = path.join(tmp, "sample.mp4");
  await run("ffmpeg", ["-y", "-f", "lavfi", "-i", "testsrc=duration=6:size=640x360:rate=24", "-f", "lavfi", "-i", "sine=frequency=440:duration=6", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", sample]);
  server = http.createServer((req, res) => { hits++; fs.createReadStream(sample).pipe(res); });
  await new Promise<void>((r) => server.listen(0, () => r()));
  port = (server.address() as any).port;
});
afterAll(async () => { server.close(); await closePool(); fs.rmSync(tmp, { recursive: true, force: true }); });

const handlers = { ingest_source: (j: any) => ingestSource(j) };

describe("rights gate", () => {
  it("rejects unknown and missing notes", () => {
    expect(validateIntake({ type: "link", rights_status: "unknown" })).toMatch(/not allowed/);
    expect(validateIntake({ type: "link", rights_status: "licensed", attribution: "x" })).toMatch(/license_note/);
    expect(validateIntake({ type: "link", rights_status: "permissioned", license_note: "email", })).toMatch(/attribution/);
    expect(validateIntake({ type: "link", rights_status: "own" })).toBeNull();
  });
  it("refuses unknown at the source-creation API level", async () => {
    await expect(createLinkSource({ url: `http://localhost:${port}/v.mp4`, rights_status: "unknown" })).rejects.toThrow();
  });
});

describe("ingestion", () => {
  it("link with licensed rights downloads, normalizes and transcribes", async () => {
    hits = 0;
    const { id } = await createLinkSource({ url: `http://localhost:${port}/v.mp4`, rights_status: "licensed", license_note: "CC-BY, see description", attribution: "Some Creator" });
    await drain("t", handlers);
    const s = (await getPool().query("select * from sources where id=$1", [id])).rows[0];
    expect(s.status).toBe("ready");
    expect(Number(s.duration_s)).toBeGreaterThan(5);
    const t = (await getPool().query("select * from transcripts where source_id=$1", [id])).rows[0];
    expect(t.words.length).toBeGreaterThan(20);
    expect(t.words[0]).toHaveProperty("start");
    expect(hits).toBe(1);
  });

  it("fair-use link is reference-only: nothing downloaded", async () => {
    hits = 0;
    const { id } = await createLinkSource({ url: `http://localhost:${port}/v.mp4`, rights_status: "commentary_fair_use", license_note: "commentary on pricing claim", attribution: "Creator" });
    await drain("t", handlers);
    const s = (await getPool().query("select status from sources where id=$1", [id])).rows[0];
    expect(s.status).toBe("reference_only");
    expect(hits).toBe(0);
  });

  it("upload path works", async () => {
    const { id } = await createUploadSource({ filename: "mine.mp4", data: fs.readFileSync(sample), rights_status: "own" });
    await drain("t", handlers);
    expect((await getPool().query("select status from sources where id=$1", [id])).rows[0].status).toBe("ready");
  });

  it("blocks private hosts by default", async () => {
    process.env.ALLOW_PRIVATE_URLS = "0";
    await expect(createLinkSource({ url: "http://169.254.169.254/latest", rights_status: "own" })).rejects.toThrow(/private/);
    process.env.ALLOW_PRIVATE_URLS = "1";
  });
});
