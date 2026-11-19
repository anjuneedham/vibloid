// After `remotion bundle`, copy the plain web pages that sit next to the Studio:
//   /photo-finder/  searchable archive photo finder
//   /previews/      finished preview videos (if any)
import { cpSync, existsSync, mkdirSync } from "node:fs";

mkdirSync("build", { recursive: true });
if (existsSync("photo-finder")) cpSync("photo-finder", "build/photo-finder", { recursive: true });
if (existsSync("previews")) cpSync("previews", "build/previews", { recursive: true });
console.log("Copied photo-finder and previews into build/");
