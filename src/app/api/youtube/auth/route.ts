import crypto from "node:crypto";
import { requireOwner } from "@/lib/auth";
import { SCOPES } from "@/lib/youtube";

export async function GET(req: Request) {
  const denied = requireOwner(req); if (denied) return denied;
  const channel = new URL(req.url).searchParams.get("channel") ?? "";
  const state = crypto.randomBytes(16).toString("hex");
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.search = new URLSearchParams({
    client_id: process.env.YOUTUBE_CLIENT_ID ?? "", redirect_uri: process.env.YOUTUBE_REDIRECT_URI ?? "", response_type: "code",
    scope: SCOPES.join(" "), access_type: "offline", prompt: "consent", state,
  }).toString();
  const out = new Response(null, { status: 302, headers: { location: u.toString() } });
  out.headers.append("set-cookie", `yt_state=${state}.${channel}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
  return out;
}
