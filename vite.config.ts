import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { backgroundsManifest } from './vite-plugin-backgrounds';

// Single source of truth for the card version: the root `version` file.
// Read at config time and injected via `define` (see src/version.ts).
const cardVersion = ((): string => {
  try {
    return readFileSync(new URL('./version', import.meta.url), 'utf-8').trim();
  } catch {
    return 'dev';
  }
})();

// DEV build. Custom-element tags are suffixed '-dev' and the bundle is named
// mosaic-canvas-card-dev.js so it can be installed alongside the production card
// (built by vite.config.prod.ts) in the same Home Assistant. Deploy to a
// separate directory / Lovelace resource.
export default defineConfig({
  plugins: [backgroundsManifest()],
  define: {
    // Dev suffix applied to every custom-element tag + the card display name.
    __EC_TAG_SUFFIX__: JSON.stringify('-dev'),
    // The card version, read from the root `version` file at build time.
    __EC_VERSION__: JSON.stringify(cardVersion),
    // Injected so the running bundle can report a build id (cache-bust check).
    __EC_BUILD__: JSON.stringify(
      new Date().toLocaleString('en-AU', { timeZone: 'Australia/Brisbane', hour12: false,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit' })
    ),
  },
  build: {
    rollupOptions: {
      input: 'src/mosaic-canvas.ts',
      output: {
        format: 'es',
        entryFileNames: 'mosaic-canvas-card-dev.js',
        chunkFileNames: 'mosaic-canvas-dev-[name].js',
        assetFileNames: 'mosaic-canvas-dev-[name].[ext]',
      },
    },
    outDir: 'dist',
    // false, not true: dist/ is shared with vite.config.prod.ts's output. Filenames
    // on both sides are fixed (no content hash), so each build only ever overwrites
    // its own files in place — emptying the dir would just delete the other build's
    // (or the last release's committed) bundle for no benefit.
    emptyOutDir: false,
    target: 'es2021',
    sourcemap: false,
  },
});
