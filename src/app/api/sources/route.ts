import { requireOwner } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { createLinkSource, createUploadSource } from "@/lib/sources";

export async function GET(req: Request) {
  const denied = requireOwner(req);
  if (denied) return denied;
  const r = await getPool().query(
    `select s.*, (select state from jobs j where j.payload->>'sourceId' = s.id::text and j.type='ingest_source' order by created_at desc limit 1) as job_state,
            (select coalesce(sum(cost_usd),0) from job_costs c join jobs j on j.id=c.job_id where j.payload->>'sourceId' = s.id::text) as cost_usd
     from sources s order by created_at desc limit 200`,
  );
  return Response.json({ sources: r.rows });
}

export async function POST(req: Request) {
  const denied = requireOwner(req);
  if (denied) return denied;
  try {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("multipart/form-data")) {
      const f = await req.formData();
      const file = f.get("file");
      if (!(file instanceof File)) return Response.json({ error: "file required" }, { status: 400 });
      const out = await createUploadSource({
        filename: file.name, data: Buffer.from(await file.arrayBuffer()),
        rights_status: f.get("rights_status") as any, license_note: f.get("license_note")?.toString(),
        attribution: f.get("attribution")?.toString(), title: f.get("title")?.toString(),
      });
      return Response.json(out, { status: 201 });
    }
    const b = await req.json();
    return Response.json(await createLinkSource(b), { status: 201 });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
