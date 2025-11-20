import { defineConfig } from "vite";
import loadPartials from "./vite-plugin-load.js";

export default defineConfig({
  root: "src",

  base: "/My-Project-Cinemania/",

  build: {
    outDir: "../dist",
    emptyOutDir: true,

    rollupOptions: {
      input: {
        home: "src/index.html",
        catalog: "src/catalog.html",
        library: "src/my-library.html"
      }
    }
  },

  plugins: [
    loadPartials()
  ]
});
