import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const isGitHubPages = process.env.GITHUB_ACTIONS === "true";

const plugins: any[] = [react(), tailwindcss()];

if (!isGitHubPages) {
  try {
    const mod = await import("@replit/vite-plugin-runtime-error-modal");
    plugins.push(mod.default());
  } catch {}
  try {
    const { metaImagesPlugin } = await import("./vite-plugin-meta-images");
    plugins.push(metaImagesPlugin());
  } catch {}
}

if (
  process.env.NODE_ENV !== "production" &&
  process.env.REPL_ID !== undefined
) {
  try {
    const m1 = await import("@replit/vite-plugin-cartographer");
    plugins.push(m1.cartographer());
  } catch {}
  try {
    const m2 = await import("@replit/vite-plugin-dev-banner");
    plugins.push(m2.devBanner());
  } catch {}
}

export default defineConfig({
  base: isGitHubPages ? "/SOSengitrack/" : "/",
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: isGitHubPages
      ? path.resolve(import.meta.dirname, "client", "dist")
      : path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
