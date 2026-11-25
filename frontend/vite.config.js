import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

function copyIndexToFlask() {
  return {
    name: "copy-index-to-flask",
    closeBundle() {
      const distHtmlPath = path.resolve(__dirname, "../app/static/dist/index.html");
      const templatePath = path.resolve(__dirname, "../app/templates/react_index.html");
      if (fs.existsSync(distHtmlPath)) {
        fs.copyFileSync(distHtmlPath, templatePath);
        console.log("Successfully copied dist/index.html -> app/templates/react_index.html");
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyIndexToFlask()],
  base: "/static/dist/",
  build: {
    outDir: "../app/static/dist",
    emptyOutDir: false,
  },
  server: {
    proxy: {
      "/api": "http://127.0.0.1:5000",
      "/static": "http://127.0.0.1:5000",
      "/auth": "http://127.0.0.1:5000",
    },
  },
});
