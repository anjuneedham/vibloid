import { describe, it, expect, afterEach, vi } from "vitest";
vi.mock("../src/lib/queue", async (orig) => ({ ...(await orig<typeof import("../src/lib/queue")>()), logCost: vi.fn(async () => {}) }));
import { roleConfig, estimateCost } from "../src/lib/llm";
import { creditsPerChar, estimateCredits, maxNarrationChars, assertVoiceCredits } from "../src/lib/providers/tts";
import { overlapRatio } from "../src/lib/style";
import { directVisuals } from "../src/lib/visual-director";
import { MockLLM } from "../src/lib/llm";

const saved = { ...process.env };
afterEach(() => { process.env = { ...saved }; });

describe("model roles", () => {
  it("routes main to Opus, visual to Fable, light to Sonnet, all at the configured effort", () => {
    expect(roleConfig("main")).toMatchObject({ model: "claude-opus-5-5", effort: "low" });
    expect(roleConfig("visual")).toMatchObject({ model: "claude-fable-5-2", effort: "low" });
    expect(roleConfig("light")).toMatchObject({ model: "claude-sonnet-5-5", effort: null });
  });
  it("env overrides model and effort", () => {
    process.env.MODEL_MAIN = "x"; process.env.EFFORT_MAIN = "medium";
    expect(roleConfig("main")).toMatchObject({ model: "x", effort: "medium" });
  });
  it("estimates cost per role", () => { expect(estimateCost(1_000_000, 0, "light")).toBe(3); });
});

describe("ElevenLabs credit budget", () => {
  it("Flash is half price: a 9,000-character (~10 min) script is 4,500 credits", () => {
    delete process.env.ELEVENLABS_MODEL;
    expect(creditsPerChar()).toBe(0.5);
    expect(estimateCredits(9000)).toBe(4500);
    expect(maxNarrationChars()).toBe(9000);
  });
  it("Multilingual v2 costs 1 credit per character", () => { expect(creditsPerChar("eleven_multilingual_v2")).toBe(1); });
  it("blocks narration over the cap before generating audio, only for elevenlabs", () => {
    expect(() => assertVoiceCredits(["a".repeat(9001)], "elevenlabs")).toThrow(/over the 4500 cap/);
    expect(() => assertVoiceCredits(["a".repeat(9000)], "elevenlabs")).not.toThrow();
    expect(() => assertVoiceCredits(["a".repeat(50000)], "mock")).not.toThrow();
  });
});

describe("originality", () => {
  const prior = ["the one habit that quietly changes how you spend money every single month is writing it down"];
  it("flags recycled phrasing", () => { expect(overlapRatio(prior[0], prior)).toBeGreaterThan(0.9); });
  it("passes fresh text in the same voice", () => { expect(overlapRatio("prices rose again this week and most people felt it at the checkout", prior)).toBe(0); });
});

describe("visual director", () => {
  const body: any = { hook: "h", promise: "p", cta: "c", claims: [], beats: [1, 2, 3, 4].map((n) => ({ narration: `beat ${n}`, visual_query: "money" })) };
  it("uses the visual role, caps AI images, and leaves narration alone", async () => {
    process.env.AI_MAX_PER_VIDEO = "1";
    const llm = new MockLLM(() => ({ beats: [0, 1, 2].map((i) => ({ i, visual_type: "ai_image", visual_query: "q" + i, ai_prompt: "a scene" })) }));
    const out = await directVisuals(body, { llm });
    expect(llm.calls[0].role).toBe("visual");
    expect(out.beats.filter((b: any) => b.visual_type === "ai_image")).toHaveLength(1);
    expect(out.beats.map((b) => b.narration)).toEqual(body.beats.map((b: any) => b.narration));
  });
  it("keeps the script if the model fails", async () => {
    const llm = new MockLLM(() => { throw new Error("boom"); });
    expect(await directVisuals(body, { llm })).toBe(body);
  });
});
