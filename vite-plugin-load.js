import fs from "fs";
import path from "path";

export default function loadPartials() {
  return {
    name: "vite-plugin-load",
    transformIndexHtml(html, ctx) {
      // Load etiketlerini bul
      return html.replace(
        /<load src="(.*?)"\s*\/>/g,
        (_, srcPath) => {
          const filePath = path.resolve(ctx.filename, "..", srcPath);
          return fs.readFileSync(filePath, "utf8");
        }
      );
    }
  };
}
