import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const opts = { serveUrl, browserExecutable: "/opt/pw-browsers/chromium" };
for (const [id, out] of [["Avatar", "out/past-tense-profile-800.png"], ["Banner", "out/past-tense-banner-2560x1440.png"]]) {
  const composition = await selectComposition({ ...opts, id });
  await renderStill({ ...opts, composition, frame: 0, imageFormat: "png", output: out });
  console.log("done", id);
}
