import fs from "node:fs";
import path from "node:path";
import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas";
import { describe, expect, it } from "vitest";
import { ScriptBody, buildFactItems, renderBlockers, scriptText, wordCount } from "@/lib/scripts";
import { drawScene, type Scene } from "@/lib/scenes";

/** Every spec in specs/tradenotes must pass the same checks make-short.ts applies, plus the series rules in docs/tradenotes-series.md. */
const dir = path.resolve("specs/tradenotes");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
const KINDS = ["kinetic", "chips", "sum", "kpis", "progress", "endcard", "typing", "checklist", "dots"];

describe("TradeNotes series specs", () => {
  it("has at least the template spec", () => expect(files).toContain("01-stuck-not-why.json"));

  for (const f of files) describe(f, () => {
    const spec = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    const body = ScriptBody.parse(spec.body);
    const text = scriptText(body);
    const scenes: Scene[] = [body.scenes?.hook, body.scenes?.promise, ...body.beats.map((b) => b.scene), body.scenes?.cta].filter(Boolean) as Scene[];

    it("is a brand/trading spec for the TradeNotes channel", () => {
      expect(spec.channel).toMatchObject({ name: "Andrew Builds (TradeNotes)", kind: "brand", niche: "trading", appName: "TradeNotes" });
      expect(spec.style.preset).toBe("andrew");
      expect(spec.slug).toMatch(/^tradenotes-\d\d-/);
    });

    it("passes the claims lint and has no render blockers", () => {
      expect(renderBlockers(body, buildFactItems(body, spec.channel), spec.channel)).toEqual([]);
      expect(body.claims).toEqual([]);
    });

    it("follows the series compliance rules", () => {
      expect(text).toMatch(/risk of (loss|losing)/i);           // one natural risk sentence
      expect(body.cta).toMatch(/Not financial advice\./);        // CTA ends the legal way
      expect(text).toMatch(/I built TradeNotes/);                // spoken ownership disclosure
      expect(text).not.toMatch(/\d\s?%|\$\s?\d/);                // narration stays number-free; numbers live in SAMPLE-badged scenes
      expect(text).not.toMatch(/\b(works|proven|will (improve|increase|boost)|guarantee)/i);
      expect(spec.post.ytDesc).toMatch(/not financial advice/i);
      expect(spec.post.ytDesc).toMatch(/SAMPLE|hypothetical|historical/);
    });

    it("is sized for a 45-60s Short", () => {
      expect(wordCount(body)).toBeGreaterThanOrEqual(120);
      expect(wordCount(body)).toBeLessThanOrEqual(175);
      expect(body.hook.split(/\s+/).length).toBeLessThanOrEqual(12);   // hook lands inside ~3 seconds
      expect(body.promise.split(/\s+/).length).toBeLessThanOrEqual(18); // first open loop by ~second 8
    });

    it("draws every scene with a known kind and short kinetic lines", () => {
      expect(scenes.length).toBe(body.beats.length + 3);
      expect(body.scenes?.hook?.kind).toBe("kinetic");
      expect(body.scenes?.cta?.kind).toBe("endcard");
      const c = createCanvas(540, 960).getContext("2d") as unknown as SKRSContext2D;
      for (const s of scenes) {
        expect(KINDS).toContain(s.kind);
        if (s.kind === "kinetic") for (const ln of s.lines) expect(ln.text.length).toBeLessThanOrEqual(14);
        expect(() => drawScene(c, 540, 960, 2, 5, s)).not.toThrow();
      }
    });
  });
});
