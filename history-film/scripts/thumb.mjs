import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const opts = { serveUrl, browserExecutable: "/opt/pw-browsers/chromium" };
const composition = await selectComposition({ ...opts, id: "Thumbnail1" });
await renderStill({ ...opts, composition, frame: 0, imageFormat: "jpeg", jpegQuality: 92, output: "out/thumbnail-evidence-room-1.jpg" });
console.log("done");
