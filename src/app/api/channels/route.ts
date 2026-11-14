import { requireOwner } from "@/lib/auth";
import { createChannel, listChannels } from "@/lib/channels";

export async function GET(req: Request) {
  const denied = requireOwner(req); if (denied) return denied;
  return Response.json({ channels: await listChannels() });
}

export async function POST(req: Request) {
  const denied = requireOwner(req); if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  if (!b.name || typeof b.name !== "string") return Response.json({ error: "name required" }, { status: 400 });
  if (b.kind && !["attention", "brand"].includes(b.kind)) return Response.json({ error: "kind must be attention or brand" }, { status: 400 });
  try {
    return Response.json({ channel: await createChannel({ name: b.name.slice(0, 80), kind: b.kind, niche: b.niche, appName: b.app_name, appBlurb: b.app_blurb }) }, { status: 201 });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
