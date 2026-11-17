import { requireOwner } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { createProject } from "@/lib/scripts";

export async function GET(req: Request) {
  const denied = requireOwner(req); if (denied) return denied;
  return Response.json({ projects: (await getPool().query("select * from projects order by created_at desc limit 200")).rows });
}
export async function POST(req: Request) {
  const denied = requireOwner(req); if (denied) return denied;
  const b = await req.json();
  if (!b.title || !["short", "long"].includes(b.format)) return Response.json({ error: "title and format required" }, { status: 400 });
  return Response.json({ project: await createProject({ ...b, brief: b.brief && typeof b.brief === "object" ? { current_event: String(b.brief.current_event ?? "").slice(0, 600) || undefined, style: b.brief.style, hook_idea: b.brief.hook_idea } : undefined }) }, { status: 201 });
}
