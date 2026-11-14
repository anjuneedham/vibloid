import { requireOwner } from "@/lib/auth";
import { getPool } from "@/lib/db";

const has = (k: string) => !!process.env[k];

export async function GET(req: Request) {
  const denied = requireOwner(req); if (denied) return denied;
  const ch = (await getPool().query("select id,name,niche,youtube_channel_id,(youtube_refresh_token is not null) as youtube_connected, brand from channels order by created_at limit 1")).rows[0] ?? null;
  return Response.json({
    channel: ch,
    providers: {
      llm: { name: "anthropic", configured: has("ANTHROPIC_API_KEY") },
      tts: { name: process.env.TTS_PROVIDER ?? "mock", configured: (process.env.TTS_PROVIDER ?? "mock") === "mock" || has("ELEVENLABS_API_KEY") },
      images: { name: process.env.IMAGE_PROVIDER ?? "mock", configured: (process.env.IMAGE_PROVIDER ?? "mock") === "mock" || has("PEXELS_API_KEY") },
      transcript: { name: process.env.TRANSCRIPT_PROVIDER ?? "mock", configured: (process.env.TRANSCRIPT_PROVIDER ?? "mock") === "mock" || has("OPENAI_API_KEY") },
      youtube: { name: "youtube", configured: has("YOUTUBE_CLIENT_ID") && has("YOUTUBE_CLIENT_SECRET") },
    },
  });
}

/** Brand kit: caption font + colors (applied at assembly). Intro/outro bumpers are not implemented yet. */
export async function POST(req: Request) {
  const denied = requireOwner(req); if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  const brand = {
    font: typeof b.font === "string" ? b.font.slice(0, 60) : undefined,
    primary: /^#[0-9a-f]{6}$/i.test(b.primary ?? "") ? b.primary : undefined,
    accent: /^#[0-9a-f]{6}$/i.test(b.accent ?? "") ? b.accent : undefined,
  };
  const db = getPool();
  const ex = (await db.query("select id from channels order by created_at limit 1")).rows[0];
  if (ex) await db.query("update channels set brand = brand || $2::jsonb, name=coalesce($3,name) where id=$1", [ex.id, JSON.stringify(brand), b.name ?? null]);
  else await db.query("insert into channels (name,brand) values ($1,$2)", [b.name ?? "My channel", JSON.stringify(brand)]);
  return Response.json({ ok: true });
}
