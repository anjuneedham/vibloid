import { requireOwner } from "@/lib/auth";
import { createDataset, listDatasets } from "@/lib/datasets";

export async function GET(req: Request) {
  const denied = requireOwner(req); if (denied) return denied;
  return Response.json({ datasets: await listDatasets() });
}

/** Body: { name, source, source_url?, as_of?, csv }. A source is mandatory: it is shown on every chart. */
export async function POST(req: Request) {
  const denied = requireOwner(req); if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  try {
    return Response.json({ dataset: await createDataset({ name: b.name, source: b.source, source_url: b.source_url, as_of: b.as_of, csv: b.csv, notes: b.notes }) }, { status: 201 });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
