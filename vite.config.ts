import { defineConfig } from "vite";
import { execFileSync } from "node:child_process";
import react from "@vitejs/plugin-react";
export default defineConfig({
  define: {
    __BUILD_REVISION__: JSON.stringify(
      execFileSync("git", ["rev-parse", "--short=12", "HEAD"], {
        encoding: "utf8",
      }).trim(),
    ),
  },
  plugins: [react()],
  optimizeDeps: { include: ["papaparse", "zod"] },
});
