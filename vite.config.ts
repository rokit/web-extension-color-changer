import { resolve } from "path";
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
    // change root to "src" otherwise it tries to put popup.html in "src/popup/popup.html"
    root: "src",
    publicDir: resolve(__dirname, "public"),
    build: {
        outDir: resolve(__dirname, "dist"),
        emptyOutDir: true,
        minify: false,
        rollupOptions: {
            input: {
                popup: "popup/popup.html",
                background: "background.ts",
                content: "content.ts",
            },
            output: {
                entryFileNames: (assetInfo) => {
                    // console.log("entryFileName:", assetInfo.name);
                    if (assetInfo.name.includes("popup")) {
                        return "popup/[name].js";
                    }
                    return "[name].js";
                },

                chunkFileNames: "[name].js",

                assetFileNames: (assetInfo) => {
                    // console.log("assetFileName:", assetInfo.originalFileNames[0]);
                    if (assetInfo.originalFileNames[0].includes("popup")) {
                        return "popup/[name].[ext]";
                    }
                    return "[name].[ext]";
                },
            },
        }
    }
})
