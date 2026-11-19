// Usage: node scripts/stills.mjs <outPrefix> <frame> [frame...]   (renders half-size stills of EvidenceRoom1)
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const [prefix, ...frames] = process.argv.slice(2);
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const opts = { serveUrl, browserExecutable: "/opt/pw-browsers/chromium", chromiumOptions: { gl: "angle" } };
const comp = await selectComposition({ ...opts, id: process.env.COMP || "EvidenceRoom1" });
for (const f of frames) {
  await renderStill({ ...opts, composition: comp, frame: Number(f), output: `${prefix}${f}.png`, scale: 0.5 });
  console.log("done", f);
}
