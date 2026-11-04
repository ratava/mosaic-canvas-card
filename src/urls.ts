/**
 * Resource URL resolution (#96).
 *
 * Its own module because both sides need it and neither should import the
 * other: `fill.ts` resolves on every fetch, `editor.ts` writes the config and
 * renders the library thumbnails. Importing `fill.ts` into the editor would drag
 * the whole fill component into the editor chunk for one function.
 */

/**
 * Where the bundled resources live, resolved fresh on every load against
 * whatever base the dashboard is actually being served from — exactly how
 * `defaults.json` and the wizard's hero image already resolve.
 *
 * `pathname`, not `href`: nothing that carries an origin should ever reach the
 * config, and a root-relative path works on every base URL.
 */
export const LIB_BASE = (() => {
  try { return new URL(/* @vite-ignore */ './', import.meta.url).pathname; }
  catch { return '/local/community/mosaic-canvas-card/'; }
})();

/**
 * The URL to actually fetch for a `field.svg`.
 *
 * A bundled library element is stored as a bare filename and paired with the
 * base URL here, so it follows whatever address the dashboard is opened on. Any
 * value carrying a path is the user's own — `/local/tank.svg`, or a full URL to
 * somewhere else — and is used exactly as given.
 *
 * A config written before #96 holds a full origin-bearing URL and keeps asking
 * the machine the card was set up on. There is deliberately no automatic
 * migration: shorten those values to the bare filename by hand. One was written
 * and removed — `setConfig` did not reliably write the change back, and the only
 * affected configs are on this machine.
 */
export function resolveSvgUrl(svg: string): string {
  return svg.includes('/') ? svg : LIB_BASE + svg;
}
