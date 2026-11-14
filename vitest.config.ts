import { defineConfig } from "vitest/config";
import path from "node:path";
export default defineConfig({
  resolve: { alias: { "@": path.resolve("src") } },
  test: { setupFiles: ["tests/setup.ts"], testTimeout: 60000, fileParallelism: false },
});
