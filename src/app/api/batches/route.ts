import { requireOwner } from "@/lib/auth";
import { batchStatus, planBatch } from "@/lib/batch";

export async function GET(req: Request) {
  const denied = requireOwner(req); if (denied) return denied;
  return Response.json({ batches: await batchStatus() });
}

/** Plans the batch (default 4 attention + 2 brand ideas) and queues production for each. Nothing is published. */
export async function POST(req: Request) {
  const denied = requireOwner(req); if (denied) return denied;
  const b = await req.json().catch(() => ({}));
  try {
    const clamp = (n: unknown, d: number) => Math.max(1, Math.min(8, Number.isFinite(Number(n)) ? Number(n) : d));
    const out = await planBatch({ attentionChannelId: b.attention_channel_id, brandChannelId: b.brand_channel_id, nAttention: clamp(b.n_attention, 4), nBrand: clamp(b.n_brand, 2) });
    return Response.json(out, { status: 201 });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 400 });
  }
}
