import { defineConfig } from "vite";

// base "./" keeps every asset path relative, so the build works on
// GitHub Pages project sites (user.github.io/repo/) without config changes.
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    target: "es2020",
  },
});
