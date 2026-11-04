// Build-time custom-element tag names.
//
// A dev build suffixes every custom-element tag (and the card's display name) so
// it can be installed alongside the production card in the same Home Assistant
// without `customElements.define` collisions. The suffix is injected by Vite
// `define` as __EC_TAG_SUFFIX__: '' for production, '-dev' for the dev build.
// The typeof guard keeps it safe under tsc / any environment where it's absent.
const SUFFIX: string =
  typeof __EC_TAG_SUFFIX__ !== 'undefined' ? __EC_TAG_SUFFIX__ : '';

export const TAG_CANVAS = `mosaic-canvas${SUFFIX}`;
export const TAG_EDITOR = `mosaic-canvas-editor${SUFFIX}`;
export const TAG_EMBEDDED = `mc-embedded-card${SUFFIX}`;
export const TAG_FILL = `mc-fill${SUFFIX}`;

// Interactive control-field elements (Mosaic Sub Card fields).
export const TAG_TOGGLE = `mc-toggle${SUFFIX}`;
export const TAG_SLIDER = `mc-slider${SUFFIX}`;
export const TAG_DROPDOWN = `mc-dropdown${SUFFIX}`;
export const TAG_SELECTOR = `mc-selector${SUFFIX}`;
export const TAG_INPUT = `mc-input${SUFFIX}`;
export const TAG_SPINBOX = `mc-spinbox${SUFFIX}`;
export const TAG_BUTTON = `mc-button${SUFFIX}`;

// Display name shown in the Lovelace card picker / HACS.
export const CARD_NAME = `Mosaic Canvas Card${SUFFIX ? ' Dev' : ''}`;
