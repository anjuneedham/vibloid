import { requireOwner } from "@/lib/auth";
import { approveProject, computeChecklist } from "@/lib/publish";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireOwner(req); if (denied) return denied;
  const { id } = await params;
  return Response.json(await computeChecklist(id));
}
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireOwner(req); if (denied) return denied;
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  try {
    const item = await approveProject(id, { approvedBy: "owner", previewWatched: b.preview_watched === true, scheduledAt: b.scheduled_at ? new Date(b.scheduled_at) : null });
    return Response.json({ item }, { status: 201 });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
