import path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/main.js"),
      name: "Pathfinder",
      formats: ["es"],
    },
    outDir: "../pathfinder/public/js",
    emptyOutDir: false,
  },
  resolve: {
    alias: {
      "@pathfinder": path.resolve(__dirname, "src"),
    },
  },
});
