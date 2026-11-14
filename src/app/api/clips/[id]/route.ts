import { requireOwner } from "@/lib/auth";
import { updateClip } from "@/lib/clips";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireOwner(req); if (denied) return denied;
  const { id } = await params;
  try {
    return Response.json({ clip: await updateClip(id, await req.json()) });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
