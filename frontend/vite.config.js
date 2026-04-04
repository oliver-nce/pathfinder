import path from "path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/main.js"),
      name: "Pathfinder",
      fileName: () => "pathfinder.bundle.js",
      formats: ["umd"],
    },
    outDir: "../pathfinder/public/js",
    emptyOutDir: false,
    rollupOptions: {
      // frappe-ui references ~icons/* via unplugin-icons — externalize so
      // the build doesn't fail if the icon plugin isn't installed
      external: [/^~icons\/.*/],
    },
  },
  resolve: {
    alias: {
      "@pathfinder": path.resolve(__dirname, "src"),
    },
  },
});
