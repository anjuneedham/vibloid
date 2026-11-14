import { requireOwner } from "@/lib/auth";
import { DAILY_QUOTA, quotaUsed, nextQuotaReset, QUOTA_COST } from "@/lib/youtube";

export async function GET(req: Request) {
  const denied = requireOwner(req); if (denied) return denied;
  const used = await quotaUsed();
  const limit = DAILY_QUOTA();
  return Response.json({ used, limit, remaining: limit - used, uploadsLeft: Math.floor((limit - used) / (QUOTA_COST.videosInsert + QUOTA_COST.thumbnailsSet)), resetsAt: nextQuotaReset() });
}
