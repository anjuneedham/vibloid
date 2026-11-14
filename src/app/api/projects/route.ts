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
  return Response.json({ project: await createProject(b) }, { status: 201 });
}
