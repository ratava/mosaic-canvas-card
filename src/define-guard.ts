// Idempotent custom-element registration, scoped to the elements this card
// registers itself.
//
// Both the production and dev builds bundle their own copies of third-party
// custom elements (vanilla-colorful's `hex-color-picker`). When both cards are
// installed in the same Home Assistant, the second bundle to load would re-define
// that shared tag and throw "Failed to execute 'define' … the name X has already
// been used". The same throw happens for our own tags if a module is ever
// evaluated twice in one page — a duplicated chunk, or a stale resource still
// registered alongside the current one.
//
// This used to patch customElements.define for the whole page (#142, HACS
// review), which also silenced genuine duplicate registrations by every other
// card on the dashboard. Now only our own registrations skip an already-defined
// tag: `@defineOnce` replaces lit's `@customElement`, and editor.ts registers the
// colour picker from vanilla-colorful's non-registering base class rather than
// through its self-registering entry point. (That import stays in editor.ts:
// this module is in the main bundle, and the picker belongs to the lazy chunk.)

/** Class decorator: `@customElement`, minus the throw when the tag is taken. */
export const defineOnce = (tag: string) => (cls: CustomElementConstructor): void => {
  if (!customElements.get(tag)) customElements.define(tag, cls);
};
