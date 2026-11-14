import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { migrate } from "../scripts/migrate";
import { getPool, closePool } from "../src/lib/db";
import { MockLLM } from "../src/lib/llm";
import { MockTranscriptProvider } from "../src/lib/providers/transcript";
import { snapClip, selectClips, updateClip, normalizeCandidates } from "../src/lib/clips";

let sourceId: string;
let words: any[];

beforeAll(async () => {
  await getPool().query("drop schema public cascade; create schema public;");
  await migrate();
  sourceId = (await getPool().query("insert into sources (type,url,rights_status,status) values ('link','http://x','own','ready') returning id")).rows[0].id;
  const t = await new MockTranscriptProvider().transcribe("", 100);
  words = t.words;
  await getPool().query("insert into transcripts (source_id,text,words) values ($1,$2,$3)", [sourceId, t.text, JSON.stringify(words)]);
});
afterAll(closePool);

const cand = (s: number, e: number, score = 80, flags: string[] = []) => ({
  start_s: s, end_s: e, hook_text: "Stop confusing income with wealth", why_it_works: "bold claim", topic_tags: ["assets"],
  sub_scores: { hook_strength: 80, standalone_clarity: 80, emotional_payload: 70, quotability: 75 }, score, risk_flags: flags,
});

describe("clip selection", () => {
  it("snaps boundaries to sentence start/end", () => {
    const s = snapClip(words, 1.0, 20.0);
    expect(words.some((w) => w.start === s.start_s)).toBe(true);
    const endWord = words.find((w) => w.end === s.end_s);
    expect(endWord.w).toMatch(/[.!?]$/);
    // start must be a sentence start: index 0 or after an ender
    const i = words.findIndex((w) => w.start === s.start_s);
    expect(i === 0 || /[.!?]$/.test(words[i - 1].w)).toBe(true);
  });

  it("filters wrong lengths and overlaps; sorts by score", () => {
    const out = normalizeCandidates(words, [cand(0, 40, 70), cand(2, 41, 90), cand(50, 55, 99), cand(55, 100, 60)], "short");
    expect(out.length).toBe(2); // 3rd too short, 2nd overlaps 1st (kept first)
    expect(out[0].score).toBeGreaterThanOrEqual(out[1].score);
  });

  it("stores validated, snapped clips and feeds rejections back", async () => {
    const llm = new MockLLM(() => ({ clips: [cand(0, 45, 88, ["financial_advice_claim"]), cand(50, 95, 75)] }));
    const n = await selectClips(sourceId, "short", { llm });
    expect(n).toBeGreaterThan(0);
    const rows = (await getPool().query("select * from clips where source_id=$1 order by score desc", [sourceId])).rows;
    expect(rows[0].risk_flags).toContain("financial_advice_claim");
    await updateClip(rows[0].id, { status: "rejected", reject_feedback: "too salesy" });
    await selectClips(sourceId, "short", { llm });
    expect(llm.calls[1].user).toContain("too salesy");
    // rejected clips survive regeneration
    expect((await getPool().query("select count(*) from clips where status='rejected'")).rows[0].count).toBe("1");
  });

  it("trims a clip and validates range", async () => {
    const c = (await getPool().query("select id,start_s from clips where status='candidate' limit 1")).rows[0];
    const u = await updateClip(c.id, { start_s: Number(c.start_s) + 1, end_s: Number(c.start_s) + 30, status: "accepted" });
    expect(u.status).toBe("accepted");
    await expect(updateClip(c.id, { start_s: 10, end_s: 5 })).rejects.toThrow();
  });
});
