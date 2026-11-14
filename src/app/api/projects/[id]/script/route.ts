import { requireOwner } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { enqueue } from "@/lib/queue";
import { editScript, ScriptBody, renderBlockers, diffScripts } from "@/lib/scripts";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireOwner(req); if (denied) return denied;
  const { id } = await params;
  const rows = (await getPool().query("select * from scripts where project_id=$1 order by version desc", [id])).rows;
  const latest = rows[0];
  return Response.json({
    scripts: rows,
    blockers: latest ? renderBlockers(latest.body, latest.fact_check_items) : ["no script"],
    diff: rows.length > 1 ? diffScripts(rows[1].body, rows[0].body) : [],
  });
}
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireOwner(req); if (denied) return denied;
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  if (b.body) { // manual edit
    const parsed = ScriptBody.safeParse(b.body);
    if (!parsed.success) return Response.json({ error: parsed.error.message }, { status: 400 });
    return Response.json({ script: await editScript(id, parsed.data) }, { status: 201 });
  }
  return Response.json({ jobId: await enqueue("generate_script", { projectId: id, style: b.style, feedback: b.feedback }) }, { status: 202 });
}
