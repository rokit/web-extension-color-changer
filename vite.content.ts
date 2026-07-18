import { resolve } from "path";
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
    // change root to "src" otherwise it tries to put popup.html in "src/popup/popup.html"
    root: "src",
    publicDir: resolve(__dirname, "public"),
    build: {
        outDir: resolve(__dirname, "dist"),
        emptyOutDir: false,
        minify: false,
        rolldownOptions: {
            input: {
                content: "content.ts",
            },
            output: {
                format: "iife",
                entryFileNames: "[name].js",
            },
        }
    }
})
