import { requireOwner } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { listChannels } from "@/lib/channels";
import { monthlyBudget, monthSpend, perVideoBudget } from "@/lib/budget";
import { kokoroAvailable } from "@/lib/providers/tts";

const has = (k: string) => !!process.env[k];
const p = (k: string, d: string) => process.env[k] ?? d;

export async function GET(req: Request) {
  const denied = requireOwner(req); if (denied) return denied;
  const spend = await monthSpend();
  return Response.json({
    channels: await listChannels(),
    budget: { monthly: monthlyBudget(), perVideo: perVideoBudget(), spent: spend, stopped: spend >= monthlyBudget() },
    providers: {
      llm: { name: p("LLM_PROVIDER", "anthropic"), configured: p("LLM_PROVIDER", "anthropic") === "mock" || has("ANTHROPIC_API_KEY") },
      tts: { name: p("TTS_PROVIDER", "mock"), configured: p("TTS_PROVIDER", "mock") === "mock" || (p("TTS_PROVIDER", "") === "kokoro" ? kokoroAvailable() : p("TTS_PROVIDER", "") === "openai" ? has("OPENAI_API_KEY") : has("ELEVENLABS_API_KEY")) },
      images: { name: p("IMAGE_PROVIDER", "mock"), configured: p("IMAGE_PROVIDER", "mock") === "mock" || has("PEXELS_API_KEY") },
      stock_video: { name: p("VIDEO_PROVIDER", "off (stills only)"), configured: !process.env.VIDEO_PROVIDER || process.env.VIDEO_PROVIDER === "mock" || has("PEXELS_API_KEY") },
      ai_images: { name: p("AI_IMAGE_PROVIDER", "mock"), configured: p("AI_IMAGE_PROVIDER", "mock") === "mock" || has("OPENAI_API_KEY") },
      transcript: { name: p("TRANSCRIPT_PROVIDER", "mock"), configured: p("TRANSCRIPT_PROVIDER", "mock") === "mock" || has("OPENAI_API_KEY") },
      youtube: { name: p("YOUTUBE_PROVIDER", "google"), configured: p("YOUTUBE_PROVIDER", "") === "mock" || (has("YOUTUBE_CLIENT_ID") && has("YOUTUBE_CLIENT_SECRET")) },
    },
  });
}

/** Per-channel brand kit: caption font + highlight color (applied at assembly). Intro/outro bumpers are not implemented yet. */
export async function POST(req: Request) {
  const denied = requireOwner(req); if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  const brand = {
    font: typeof b.font === "string" ? b.font.slice(0, 60) : undefined,
    accent: /^#[0-9a-f]{6}$/i.test(b.accent ?? "") ? b.accent : undefined,
  };
  const db = getPool();
  const target = b.channel_id ? { rows: [{ id: b.channel_id }] } : await db.query("select id from channels order by created_at limit 1");
  if (!target.rows[0]) return Response.json({ error: "create a channel first" }, { status: 400 });
  await db.query("update channels set brand = brand || $2::jsonb, name=coalesce($3,name) where id=$1", [target.rows[0].id, JSON.stringify(brand), b.name ?? null]);
  return Response.json({ ok: true });
}
