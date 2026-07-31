import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  if (mode === "production") {
    const env = loadEnv(mode, process.cwd(), "VITE_");
    const required = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "VITE_BACKEND_BASE_URL"];
    const missing = required.filter((key) => !env[key]);
    if (missing.length > 0) {
      throw new Error(
        `Cannot build for production: missing required env var(s): ${missing.join(", ")}. ` +
        `Set them in the build environment to avoid shipping a broken bundle.`
      );
    }
  }
  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
