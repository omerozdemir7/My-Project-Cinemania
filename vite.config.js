import { defineConfig } from "vite";
import injectHTML from "vite-plugin-html-inject";

export default defineConfig({
  root: "src",

  base: "/My-Project-Cinemania/",

  build: {
    outDir: "../dist",
    emptyOutDir: true,

    rollupOptions: {
      input: {
        main: "src/index.html",
        catalog: "src/catalog.html",
        library: "src/my-library.html",
      }
    }
  },

  plugins: [
    injectHTML({
      // partials klasörünü aktif olarak kullanabilmen için
      injections: {
        // örnek: <load src="partials/modals.html">
      }
    })
  ],
});
