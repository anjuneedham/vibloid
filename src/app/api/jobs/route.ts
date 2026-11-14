import { requireOwner } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { enqueue } from "@/lib/queue";

const ALLOWED = new Set(["assemble_project", "render_project", "package_project", "generate_script", "select_clips", "pull_analytics", "weekly_report"]);

export async function GET(req: Request) {
  const denied = requireOwner(req); if (denied) return denied;
  const ids = new URL(req.url).searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
  const projectId = new URL(req.url).searchParams.get("project");
  const r = projectId
    ? await getPool().query("select id,type,state,attempts,error,result,created_at,finished_at from jobs where payload->>'projectId'=$1 order by created_at desc limit 20", [projectId])
    : await getPool().query("select id,type,state,attempts,error,result,created_at,finished_at from jobs where id = any($1::uuid[])", [ids]);
  return Response.json({ jobs: r.rows });
}

export async function POST(req: Request) {
  const denied = requireOwner(req); if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  if (!ALLOWED.has(b.type)) return Response.json({ error: "job type not allowed" }, { status: 400 });
  return Response.json({ jobId: await enqueue(b.type, b.payload ?? {}) }, { status: 202 });
}
