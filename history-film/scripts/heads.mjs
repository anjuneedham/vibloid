import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
for (const who of ["curator", "dig", "doubt", "clerk"]) {
  const opts = { serveUrl, browserExecutable: "/opt/pw-browsers/chromium", inputProps: { who } };
  const composition = await selectComposition({ ...opts, id: "CastHead" });
  await renderStill({ ...opts, composition, frame: 0, imageFormat: "png", output: `out/head-${who}.png`, scale: 0.5 });
  console.log("done", who);
}
