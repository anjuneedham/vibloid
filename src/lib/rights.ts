export const RIGHTS = ["own", "licensed", "permissioned", "commentary_fair_use", "unknown"] as const;
export type Rights = (typeof RIGHTS)[number];

/** Media may be copied to our storage only when we own it or hold a license/permission. */
export function canDownload(r: Rights): boolean {
  return r === "own" || r === "licensed" || r === "permissioned";
}

/** Rights that allow a clip to be rendered into a video destined for publishing. */
export function isPublishable(r: Rights): boolean {
  return r !== "unknown";
}

export function validateIntake(input: { rights_status: Rights; license_note?: string; attribution?: string; type: "upload" | "link" }): string | null {
  if (!RIGHTS.includes(input.rights_status)) return "invalid rights_status";
  if (input.rights_status === "unknown") return "rights_status 'unknown' is not allowed: choose how you have the right to use this";
  if (input.rights_status !== "own" && !input.license_note?.trim()) return "license_note is required unless rights_status is 'own'";
  if (input.type === "link" && input.rights_status !== "own" && !input.attribution?.trim()) return "attribution (creator name) is required for linked sources";
  return null;
}

/** A project may only be rendered if every source it uses is publishable. */
export function assertRenderable(sourceRights: Rights[]) {
  const bad = sourceRights.filter((r) => !isPublishable(r));
  if (bad.length) throw new Error("render blocked: a clip's source has rights_status 'unknown'");
}
