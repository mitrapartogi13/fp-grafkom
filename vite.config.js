import { defineConfig } from "vite";

// GitHub Pages menyajikan situs di https://<user>.github.io/fp-grafkom/,
// jadi build produksi butuh base path tersebut. Mode dev tetap di "/".
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/fp-grafkom/" : "/",
  build: {
    chunkSizeWarningLimit: 700, // three.js memang ~540 kB
  },
}));
