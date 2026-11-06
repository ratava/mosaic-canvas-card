// __EC_VERSION__ is replaced at build time by Vite with the contents of the
// root `version` file (see vite.config.ts `define`). The typeof guard keeps it
// safe under tsc / any environment where it's absent.
export const CARD_VERSION: string =
  typeof __EC_VERSION__ !== 'undefined' ? __EC_VERSION__ : 'dev';

// __EC_BUILD__ is replaced at build time by Vite (see vite.config.ts `define`).
// The typeof guard keeps it safe under tsc / any environment where it's absent.
export const BUILD_ID: string =
  typeof __EC_BUILD__ !== 'undefined' ? __EC_BUILD__ : 'dev';
