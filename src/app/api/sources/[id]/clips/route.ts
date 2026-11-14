import { requireOwner } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { enqueue } from "@/lib/queue";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireOwner(req); if (denied) return denied;
  const { id } = await params;
  const r = await getPool().query("select * from clips where source_id=$1 order by score desc nulls last, start_s", [id]);
  return Response.json({ clips: r.rows });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireOwner(req); if (denied) return denied;
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const format = b.format === "long" ? "long" : "short";
  const jobId = await enqueue("select_clips", { sourceId: id, format, feedback: b.feedback });
  return Response.json({ jobId }, { status: 202 });
}
