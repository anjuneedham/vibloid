import { requireOwner } from "@/lib/auth";
import { enqueue } from "@/lib/queue";

/** Continue a project's pipeline (after you resolved fact-check items or edited the script). Never approves or uploads. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = requireOwner(req); if (denied) return denied;
  const { id } = await params;
  return Response.json({ jobId: await enqueue("produce_project", { projectId: id }) }, { status: 202 });
}
