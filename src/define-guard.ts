// Idempotent customElements.define — must be imported before any module that
// auto-registers a custom element (see mosaic-canvas.ts, first import).
//
// Both the production and dev builds bundle their own copies of third-party
// custom elements that self-register on import (e.g. vanilla-colorful's
// `hex-color-picker`). When both cards are installed in the same Home Assistant,
// the second bundle to load re-defines those shared tags and throws
// "Failed to execute 'define' … the name X has already been used".
//
// Making define a no-op for an already-registered tag resolves it (first bundle
// wins; the element is identical across builds anyway). Our own card elements are
// uniquely named per build (see tags.ts), so this only ever skips genuine
// duplicates from shared bundled dependencies. The guard is installed once, even
// if both bundles run this module.
const reg = window.customElements as CustomElementRegistry & { __mcDefineGuard?: boolean };
if (reg && !reg.__mcDefineGuard) {
  const orig = reg.define.bind(reg);
  reg.define = (name: string, ctor: CustomElementConstructor, options?: ElementDefinitionOptions): void => {
    if (reg.get(name)) return;
    orig(name, ctor, options);
  };
  reg.__mcDefineGuard = true;
}
