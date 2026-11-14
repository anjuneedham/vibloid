import { requireOwner, cookieFromHeader } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { encrypt } from "@/lib/secrets";

export async function GET(req: Request) {
  const denied = requireOwner(req); if (denied) return denied;
  const url = new URL(req.url);
  const state = url.searchParams.get("state");
  const cookie = req.headers.get("cookie")?.split(";").map((c) => c.trim()).find((c) => c.startsWith("yt_state="))?.slice(9);
  const [cookieState, channelId] = (cookie ?? "").split(".");
  if (!state || state !== cookieState) return Response.json({ error: "bad oauth state" }, { status: 400 });
  const code = url.searchParams.get("code");
  if (!code) return Response.json({ error: "missing code" }, { status: 400 });
  const tok = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: process.env.YOUTUBE_CLIENT_ID!, client_secret: process.env.YOUTUBE_CLIENT_SECRET!, redirect_uri: process.env.YOUTUBE_REDIRECT_URI!, grant_type: "authorization_code" }),
  });
  const j: any = await tok.json();
  if (!tok.ok || !j.refresh_token) return Response.json({ error: "token exchange failed (no refresh token)" }, { status: 400 });
  const ch = await fetch("https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true", { headers: { Authorization: `Bearer ${j.access_token}` } });
  const cj: any = await ch.json();
  const item = cj.items?.[0];
  const db = getPool();
  const existing = channelId ? (await db.query("select id from channels where id=$1", [channelId])).rows[0] : (await db.query("select id from channels order by created_at limit 1")).rows[0];
  if (existing) await db.query("update channels set youtube_channel_id=$2, name=coalesce($3,name), youtube_refresh_token=$4 where id=$1", [existing.id, item?.id ?? null, item?.snippet?.title ?? null, encrypt(j.refresh_token)]);
  else await db.query("insert into channels (name, youtube_channel_id, youtube_refresh_token) values ($1,$2,$3)", [item?.snippet?.title ?? "My channel", item?.id ?? null, encrypt(j.refresh_token)]);
  return Response.redirect(new URL("/", req.url).toString(), 302);
}
