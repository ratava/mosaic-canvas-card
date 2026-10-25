/**
 * Writes `public/backgrounds.json` — the list of background images shipped with
 * the card, for the editor's image picker to offer.
 *
 * Generated rather than hand-maintained: the filenames change (and their casing
 * is already inconsistent — `house_day_no_ev` against `overview_day_no_EV`), so
 * any list written by hand drifts from what actually ships and the picker starts
 * offering images that 404.
 *
 * The rule is "every .webp in public/ that isn't a thumbnail". `thumb_*.webp`
 * are the element-library previews, not backgrounds. A new background therefore
 * needs no code change — drop the .webp in public/ and it appears in the picker.
 *
 * Each entry carries a display name derived from the filename, so a new image
 * gets a readable label for free. Derivation is deliberately dumb (underscores
 * to spaces, sentence case, `ev` uppercased). If one ever reads badly, give this
 * a lookup keyed by filename rather than renaming the file — the filename is
 * what configs store, so a rename breaks them.
 *
 * It is written into `public/` rather than emitted straight into the bundle so
 * it travels the same road as `defaults.json`: visible in the repo, copied to
 * `dist/` by vite, swept into the release commit, mirrored, and attached as a
 * release asset. The cost is that it is a generated file living in a source
 * directory — regenerated on every build, so never edit it by hand.
 */
import { readdirSync, writeFileSync } from 'node:fs';
import type { Plugin } from 'vite';

/** `house_night_no_ev.webp` → `House night no EV`. */
function displayName(file: string): string {
  const words = file
    .replace(/\.webp$/i, '')
    .split(/[_-]+/)
    .filter(Boolean)
    .map((w) => (w.toLowerCase() === 'ev' ? 'EV' : w.toLowerCase()));
  const [first, ...rest] = words;
  const head = first ? first.charAt(0).toUpperCase() + first.slice(1) : '';
  return [head, ...rest].join(' ');
}

export function backgroundsManifest(): Plugin {
  return {
    name: 'mosaic-backgrounds-manifest',
    // buildStart, so the file exists before vite copies public/ into dist/.
    buildStart() {
      const dir = new URL('./public/', import.meta.url);
      const backgrounds = readdirSync(dir)
        .filter((f) => f.toLowerCase().endsWith('.webp'))
        .filter((f) => !f.toLowerCase().startsWith('thumb_'))
        .map((file) => ({ file, name: displayName(file) }))
        // Sorted here rather than in the editor, so the manifest reads in the
        // same order the picker shows.
        .sort((a, b) => a.name.localeCompare(b.name));
      writeFileSync(
        new URL('backgrounds.json', dir),
        `${JSON.stringify({ backgrounds }, null, 2)}\n`,
        'utf-8',
      );
    },
  };
}
