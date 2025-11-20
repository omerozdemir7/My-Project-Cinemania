import { defineConfig } from "vite";
import { glob } from "glob";
import injectHTML from "vite-plugin-html-inject";

export default defineConfig(({ command }) => {
  return {
    // ... diğer ayarların ...
    
    // BURAYI EKLE: GitHub Repo adını buraya yaz
    base: "/my-project-cinemania/", 

    root: "src", 
    build: {
      outDir: "../dist", 
      emptyOutDir: true,
      sourcemap: true,
      rollupOptions: {
        input: glob.sync("./src/*.html"),
      },
    },
    plugins: [
      injectHTML(),
    ],
  };
});