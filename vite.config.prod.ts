import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import stripComments from './strip-comments.mjs';
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

// Build a single self-contained ES module bundle for HACS to serve.
// Lit and all deps are bundled in (the card must be standalone in HA).
export default defineConfig({
  define: {
    // Production: no tag suffix — clean element tags and card name.
    __EC_TAG_SUFFIX__: JSON.stringify(''),
    // The card version, read from the root `version` file at build time.
    __EC_VERSION__: JSON.stringify(cardVersion),
    // Injected so the running bundle can report a build id (cache-bust check).
    __EC_BUILD__: JSON.stringify(
      new Date().toLocaleString('en-AU', { timeZone: 'Australia/Brisbane', hour12: false,
        year: 'numeric', month: '2-digit', day: '2-digit' })
    ),
  },
  // Release builds ship without source comments. Purely a transform — src/ is never
  // touched, and the dev config deliberately keeps its comments. See
  // strip-comments.mjs for what this does and does not actually save.
  plugins: [stripComments('all'), backgroundsManifest()],
  build: {
    rollupOptions: {
      input: 'src/mosaic-canvas.ts',
      output: {
        format: 'es',
        entryFileNames: 'mosaic-canvas-card.js',
        chunkFileNames: 'mosaic-canvas-[name].js',
        assetFileNames: 'mosaic-canvas-[name].[ext]',
      },
    },
    outDir: 'dist',
    // false, not true: dist/ is shared with vite.config.ts's (dev) output. Filenames
    // on both sides are fixed (no content hash), so each build only ever overwrites
    // its own files in place — emptying the dir would just delete the dev bundle
    // for no benefit.
    emptyOutDir: false,
    target: 'es2021',
    sourcemap: false,
  },
});
