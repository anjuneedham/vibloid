import { requireOwner } from "@/lib/auth";
import { resolveFactItem } from "@/lib/scripts";

export async function POST(req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const denied = requireOwner(req); if (denied) return denied;
  const { id, itemId } = await params;
  try {
    return Response.json({ script: await resolveFactItem(id, itemId, await req.json()) });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
