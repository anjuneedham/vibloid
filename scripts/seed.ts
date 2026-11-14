import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getPool, closePool } from "../src/lib/db";
import { migrate } from "./migrate";
import { run } from "../src/lib/media";
import { createUploadSource } from "../src/lib/sources";

/** Creates a demo channel and a 60s sample video (own rights) so the UI has something to work with. */
async function main() {
  await migrate();
  const db = getPool();
  if (!(await db.query("select 1 from channels limit 1")).rowCount) await db.query("insert into channels (name, brand) values ('Demo channel', $1)", [JSON.stringify({ font: "Inter", accent: "#f5c542" })]);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "seed-"));
  const f = path.join(tmp, "demo.mp4");
  await run("ffmpeg", ["-y", "-f", "lavfi", "-i", "testsrc2=duration=60:size=1280x720:rate=24", "-f", "lavfi", "-i", "sine=frequency=330:duration=60", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", f]);
  const { id } = await createUploadSource({ filename: "demo.mp4", data: fs.readFileSync(f), rights_status: "own", title: "Demo source (generated test video)" });
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log("seeded demo channel and source", id, "- run `pnpm worker` to ingest it");
  await closePool();
}
main().catch((e) => { console.error(e); process.exit(1); });
