import { requireOwner } from "@/lib/auth";
import { getPool } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireOwner(req); if (denied) return denied;
  const { id } = await params;
  const db = getPool();
  const source = (await db.query("select * from sources where id=$1", [id])).rows[0];
  if (!source) return Response.json({ error: "not found" }, { status: 404 });
  const t = (await db.query("select words, provider from transcripts where source_id=$1", [id])).rows[0] ?? null;
  const jobs = (await db.query("select id,type,state,error from jobs where payload->>'sourceId'=$1 order by created_at desc limit 5", [id])).rows;
  return Response.json({ source, words: t?.words ?? [], provider: t?.provider ?? null, jobs });
}
