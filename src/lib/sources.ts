import crypto from "node:crypto";
import { getPool } from "./db";
import { enqueue } from "./queue";
import { validateIntake, type Rights } from "./rights";
import { assertSafeUrl } from "./download";
import { getStorage } from "./storage";

type Intake = { rights_status: Rights; license_note?: string; attribution?: string; creator?: string; title?: string };

export async function createLinkSource(input: Intake & { url: string }) {
  const err = validateIntake({ ...input, type: "link" });
  if (err) throw new Error(err);
  assertSafeUrl(input.url);
  const r = await getPool().query(
    `insert into sources (url, type, title, creator, rights_status, license_note, attribution) values ($1,'link',$2,$3,$4,$5,$6) returning id`,
    [input.url, input.title ?? null, input.creator ?? null, input.rights_status, input.license_note ?? null, input.attribution ?? null],
  );
  const id = r.rows[0].id as string;
  const jobId = await enqueue("ingest_source", { sourceId: id }, { idempotencyKey: `ingest:${id}` });
  return { id, jobId };
}

export async function createUploadSource(input: Intake & { filename: string; data: Buffer }) {
  const err = validateIntake({ ...input, type: "upload" });
  if (err) throw new Error(err);
  const key = `uploads/${crypto.randomUUID()}${(input.filename.match(/\.[a-z0-9]{1,5}$/i)?.[0] ?? ".mp4").toLowerCase()}`;
  await getStorage().putFile(key, input.data);
  const r = await getPool().query(
    `insert into sources (storage_key, type, title, creator, rights_status, license_note, attribution) values ($1,'upload',$2,$3,$4,$5,$6) returning id`,
    [key, input.title ?? input.filename, input.creator ?? null, input.rights_status, input.license_note ?? null, input.attribution ?? null],
  );
  const id = r.rows[0].id as string;
  const jobId = await enqueue("ingest_source", { sourceId: id }, { idempotencyKey: `ingest:${id}` });
  return { id, jobId };
}
