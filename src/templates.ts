import type { ControlVariant, ControlVariantRegistry, FieldType, MosaicCanvasConfig } from './types';
import { CONTROL_FIELD_TYPES } from './types';
import { bundledVariants, slugifyVariantId } from './controls/variants';
import { CARD_VERSION } from './version';

/** Increment when the template schema changes in a breaking way. */
export const TEMPLATE_SCHEMA_VERSION = 1;

export interface MosaicCanvasTemplate {
  ec_template: true;
  /** Schema version — used to detect breaking changes and trigger migration. */
  version: number;
  /** Card version at export time — informational only. */
  card_version: string;
  name: string;
  exported: string; // ISO 8601
  config: Omit<MosaicCanvasConfig, 'type'>;
}

/**
 * Keys that carry references into a specific Home Assistant instance. Covers
 * `entity`, `entity_id`, `entities`, every `*_entity` config key, and the
 * action-target `device_id`/`area_id` (same class of instance-specific ref).
 */
const ENTITY_KEY = /^(entity|entity_id|entities|device_id|area_id)$|_entity$/;

/** `virtual:<id>` refs point at virtuals inside the template itself, not at
 * the importer's HA instance, so they survive an entity strip. */
const isVirtualRef = (v: unknown): boolean =>
  typeof v === 'string' && v.startsWith('virtual:');

/**
 * Deep-copy `value` with all HA-instance-specific references removed, so a
 * template can be shared without leaking entity IDs. Virtual references are
 * kept (see above); virtual `inputs` are filtered down to them.
 */
function stripEntities<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => stripEntities(v)) as unknown as T;
  }
  if (typeof value !== 'object' || value === null) return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (ENTITY_KEY.test(k)) {
      if (isVirtualRef(v)) out[k] = v;
      else if (Array.isArray(v) && v.some(isVirtualRef)) out[k] = v.filter(isVirtualRef);
      // otherwise: dropped — the importer re-picks it on their own instance
    } else if (k === 'inputs' && Array.isArray(v) && v.every((s) => typeof s === 'string')) {
      // VirtualConfig.inputs — an array of entity IDs (required key, keep the shape)
      out[k] = v.filter(isVirtualRef);
    } else {
      out[k] = stripEntities(v);
    }
  }
  return out as T;
}

export function buildTemplate(
  config: MosaicCanvasConfig,
  name: string,
  opts: { includeEntities?: boolean } = {},
): MosaicCanvasTemplate {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { type: _type, ...rest } = config;
  return {
    ec_template: true,
    version: TEMPLATE_SCHEMA_VERSION,
    card_version: CARD_VERSION,
    name: name.trim() || 'Mosaic Canvas Template',
    exported: new Date().toISOString(),
    config: opts.includeEntities === false ? stripEntities(rest) : rest,
  };
}

export function downloadTemplate(template: MosaicCanvasTemplate): void {
  const json = JSON.stringify(template, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${template.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface ParseResult {
  template: MosaicCanvasTemplate | null;
  error: string | null;
}

export function parseTemplate(json: string): ParseResult {
  let obj: unknown;
  try {
    obj = JSON.parse(json);
  } catch {
    return { template: null, error: 'Invalid JSON — could not parse file.' };
  }

  if (typeof obj !== 'object' || obj === null || !(obj as Record<string, unknown>).ec_template) {
    return { template: null, error: 'Not a valid Mosaic Canvas template file.' };
  }

  const t = obj as MosaicCanvasTemplate;

  if (typeof t.version !== 'number') {
    return { template: null, error: 'Template is missing a version number.' };
  }
  if (t.version > TEMPLATE_SCHEMA_VERSION) {
    return {
      template: null,
      error: `Template schema v${t.version} is newer than this card supports (v${TEMPLATE_SCHEMA_VERSION}). Update the card first.`,
    };
  }

  return { template: t, error: null };
}

export function applyTemplate(
  template: MosaicCanvasTemplate,
  currentType: string,
): MosaicCanvasConfig {
  // template.config is typed Omit<MosaicCanvasConfig, 'type'> (guaranteed by
  // buildTemplate, the only place templates are constructed), so `cards` is
  // genuinely present here — TS just can't prove it through the spread once
  // MosaicCanvasConfig's LovelaceCardConfig base widens to an index signature.
  return { type: currentType, ...template.config } as MosaicCanvasConfig;
}

// ── Control variant packs ────────────────────────────────────────────────────
//
// A variant pack carries only custom control variants, never card layout. It is
// deliberately the same shape as the bundled controls/variants.json under
// `variants`, so a proven variant can also be pasted straight into the bundle.

/** Increment when the variant pack schema changes in a breaking way. */
export const VARIANT_PACK_SCHEMA_VERSION = 1;

export interface ControlVariantPack {
  mosaic_control_variants: true;
  version: number;
  card_version: string;
  name: string;
  exported: string; // ISO 8601
  variants: ControlVariantRegistry;
}

export function buildVariantPack(registry: ControlVariantRegistry, name: string): ControlVariantPack {
  return {
    mosaic_control_variants: true,
    version: VARIANT_PACK_SCHEMA_VERSION,
    card_version: CARD_VERSION,
    name: name.trim() || 'Mosaic Control Variants',
    exported: new Date().toISOString(),
    variants: registry,
  };
}

export function downloadVariantPack(pack: ControlVariantPack): void {
  const blob = new Blob([JSON.stringify(pack, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${pack.name.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface VariantPackParseResult {
  pack: ControlVariantPack | null;
  error: string | null;
}

export function parseVariantPack(json: string): VariantPackParseResult {
  let obj: unknown;
  try {
    obj = JSON.parse(json);
  } catch {
    return { pack: null, error: 'File is not valid JSON.' };
  }
  if (typeof obj !== 'object' || obj === null) {
    return { pack: null, error: 'File is not a control variant pack.' };
  }
  const o = obj as Partial<ControlVariantPack>;
  if (o.mosaic_control_variants !== true) {
    return { pack: null, error: 'File is not a control variant pack. (Card layouts use Import Template instead.)' };
  }
  if (typeof o.version !== 'number' || o.version > VARIANT_PACK_SCHEMA_VERSION) {
    return { pack: null, error: `Pack was made by a newer Mosaic version (schema ${String(o.version)}). Update the card first.` };
  }
  if (typeof o.variants !== 'object' || o.variants === null) {
    return { pack: null, error: 'Pack contains no variants.' };
  }
  return {
    pack: {
      mosaic_control_variants: true,
      version: o.version,
      card_version: o.card_version ?? 'unknown',
      name: o.name?.trim() || 'Imported variants',
      exported: o.exported ?? '',
      variants: o.variants,
    },
    error: null,
  };
}

/** A variant entry is only usable if it has both an id and a label. */
function isUsableVariant(v: unknown): v is ControlVariant {
  if (typeof v !== 'object' || v === null) return false;
  const c = v as Partial<ControlVariant>;
  return typeof c.id === 'string' && c.id.length > 0 && typeof c.label === 'string' && c.label.length > 0;
}

/**
 * Merge an imported pack into the card's existing custom variants.
 *
 * Additive by design — unlike template import, this never replaces anything.
 * An incoming id that collides with a bundled or existing custom variant is
 * given a fresh id, so both survive and no field silently changes behaviour.
 */
export function mergeVariantPack(
  current: ControlVariantRegistry,
  pack: ControlVariantPack,
): { merged: ControlVariantRegistry; added: number; renamed: number } {
  const merged: ControlVariantRegistry = { ...current };
  let added = 0;
  let renamed = 0;

  for (const type of CONTROL_FIELD_TYPES as readonly FieldType[]) {
    const incoming = (pack.variants[type] ?? []).filter(isUsableVariant);
    if (!incoming.length) continue;

    const list = [...(merged[type] ?? [])];
    // Collisions are checked against the bundled set too — a custom variant may
    // never shadow a built-in id (append-only registry semantics).
    const taken = new Set<string>([
      ...bundledVariants(type).map((v) => v.id),
      ...list.map((v) => v.id),
    ]);

    for (const v of incoming) {
      let id = v.id;
      if (taken.has(id)) {
        const root = slugifyVariantId(v.id);
        let n = 2;
        while (taken.has(`${root}_${n}`)) n++;
        id = `${root}_${n}`;
        renamed++;
      }
      taken.add(id);
      list.push({ ...v, id });
      added++;
    }
    merged[type] = list;
  }

  return { merged, added, renamed };
}
