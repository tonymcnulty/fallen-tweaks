import { defineConfig } from "vite";
import { crx } from "@crxjs/vite-plugin";
import preact from "@preact/preset-vite";
import { resolve } from "path";
import manifest from "./src/manifest";

export default defineConfig({
  plugins: [preact(), crx({ manifest })],
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "src/shared"),
      "@modules": resolve(__dirname, "src/content/modules"),
      "@content": resolve(__dirname, "src/content"),
    },
  },
  build: {
    outDir: "dist",
    emptyDirOnBuild: true,
  },
});
