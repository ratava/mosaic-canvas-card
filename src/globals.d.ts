// Compile-time constants injected by Vite `define`.
declare const __EC_BUILD__: string;
declare const __EC_VERSION__: string;
declare const __EC_TAG_SUFFIX__: string;

/**
 * Runtime debug switch, set from the browser console — `mosaicDebug = true`.
 * Deliberately a global rather than a config key: it is a diagnostic, not a
 * dashboard setting, and it has to be togglable without an edit and a redeploy.
 */
interface Window {
  mosaicDebug?: boolean;
}
