import crypto from "node:crypto";

function key() {
  // Separate from SESSION_SECRET so rotating the login-cookie secret does not make stored tokens undecryptable.
  const s = process.env.ENCRYPTION_KEY ?? process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("ENCRYPTION_KEY (or SESSION_SECRET) must be set (16+ chars)");
  return crypto.createHash("sha256").update("vibloid-secrets:" + s).digest();
}
/** AES-256-GCM for tokens at rest (e.g. YouTube refresh token). */
export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
}
export function decrypt(blob: string): string {
  const [iv, tag, enc] = blob.split(".").map((p) => Buffer.from(p, "base64"));
  const d = crypto.createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
}
