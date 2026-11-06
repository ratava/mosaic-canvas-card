// Control-field variant registry.
//
// Variants are declared in variants.json (bundled at build). Each entry may
// carry a `render` discriminator (an in-element rendering mode, e.g. toggle
// switch vs checkbox) and/or a `preset` (a partial FieldConfig applied when the
// variant is chosen in the editor — service, range, unit, read mapping, …).
//
// The loader is abstracted so a future in-app "variant builder" can layer
// user-defined variants on top of the bundled set via setUserVariants().

import type { ControlOption, ControlVariant, ControlVariantRegistry, FieldConfig, FieldType } from '../types';
import bundled from './variants.json';

export type { ControlVariant, ControlVariantRegistry };

type Registry = ControlVariantRegistry;

const _bundled = bundled as Registry;
let _user: Registry = {};

/**
 * Install the user-authored variants from `GlobalDefaults.control_variants`.
 * Called from both hosts' setConfig, so the runtime and the editor see the same
 * registry. Append-only: user variants never shadow a bundled id (the editor
 * rejects colliding ids at save time via `variantIdTaken`).
 */
export function setUserVariants(user: Registry | undefined): void {
  _user = user ?? {};
}

/** All variants available for a control type (bundled first, then user additions). */
export function getVariants(type: FieldType): ControlVariant[] {
  return [...(_bundled[type] ?? []), ...(_user[type] ?? [])];
}

/** Only the bundled (shipped) variants for a control type. */
export function bundledVariants(type: FieldType): ControlVariant[] {
  return _bundled[type] ?? [];
}

/** Only the user-authored variants for a control type. */
export function userVariants(type: FieldType): ControlVariant[] {
  return _user[type] ?? [];
}

/** True when this id belongs to a user-authored variant rather than a bundled one. */
export function isCustomVariant(type: FieldType, id: string | undefined): boolean {
  if (!id) return false;
  return userVariants(type).some((v) => v.id === id) && !bundledVariants(type).some((v) => v.id === id);
}

/** True when the id is already used by a bundled or user variant of this type. */
export function variantIdTaken(type: FieldType, id: string): boolean {
  return getVariants(type).some((v) => v.id === id);
}

/** Normalise a user-entered label into a candidate variant id. */
export function slugifyVariantId(label: string): string {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'variant';
}

/** A free variant id for this type, suffixing `_2`, `_3`, … until one is unused. */
export function uniqueVariantId(type: FieldType, base: string): string {
  const root = slugifyVariantId(base);
  if (!variantIdTaken(type, root)) return root;
  for (let n = 2; ; n++) {
    const candidate = `${root}_${n}`;
    if (!variantIdTaken(type, candidate)) return candidate;
  }
}

/** Look up a single variant by control type + id. */
export function resolveVariant(type: FieldType, id: string | undefined): ControlVariant | undefined {
  if (!id) return undefined;
  return getVariants(type).find((v) => v.id === id);
}

/** The default variant id for a control type (first entry), if any. */
export function defaultVariantId(type: FieldType): string | undefined {
  return getVariants(type)[0]?.id;
}

/**
 * FieldConfig keys owned by variant presets — cleared before a new preset applies.
 *
 * `options` is here because a manual button group keeps most of its design in
 * its option list (labels, icons, lines, per-option layout), and a variant that
 * couldn't carry that would capture almost nothing worth reusing. It is the one
 * managed key whose clearing is expensive to undo by hand, so the editor asks
 * before a switch that would drop a populated list — see
 * `variantSwitchClearsOptions`.
 */
export const MANAGED_KEYS: (keyof FieldConfig)[] = [
  'options',
  'control_service', 'control_service_data', 'value_scale',
  'read_attribute', 'read_scale', 'min', 'max', 'step', 'unit', 'spinbox_decimals',
  'toggle_variant', 'options_source', 'options_attribute', 'button_group_layout',
  'submit_on', 'input_maxlength', 'input_password', 'control_labels', 'control_labels_position', 'control_labels_gap',
  'slider_labels',
  'option_icon_position', 'option_show_state', 'option_state_position',
  'option_icon_style', 'option_label_style', 'option_state_style', 'button_value',
];

/**
 * The FieldConfig patch to apply when a variant is chosen in the editor: clear
 * any keys the previous variant's preset set, then apply the new preset and
 * persist the `variant` id. Clearing prevents stale service/range carry-over
 * (e.g. switching Brightness → Volume, or a preset variant → Generic).
 */
export function variantPreset(type: FieldType, id: string): Partial<FieldConfig> {
  const v = resolveVariant(type, id);
  const cleared = Object.fromEntries(MANAGED_KEYS.map((k) => [k, undefined])) as Partial<FieldConfig>;
  return { ...cleared, ...(v?.preset ?? {}), variant: id };
}

/**
 * Drop the entity bindings from a captured option list.
 *
 * A variant is a behaviour preset, not a binding — the same promise the field's
 * own `entity` makes by never being captured. An option's `entity` (and the
 * `attribute` that only means anything relative to it) is that same binding one
 * level down, so it goes too: the layout, labels, icons and actions travel, and
 * whoever applies the variant points it at their own entities.
 *
 * `tap_action` and friends are kept as-is. They are what the option *does*,
 * which is the behaviour being reused; a service target inside one is the
 * author's deliberate choice rather than an incidental binding.
 */
function stripOptionBindings(options: ControlOption[]): ControlOption[] {
  return options.map((o) => {
    const { entity: _entity, attribute: _attribute, ...rest } = o;
    return rest;
  });
}

/**
 * Snapshot a configured field's preset-owned keys, for "Save as Variant".
 * Sparse by design — only keys the field actually sets are captured, so a
 * stored variant stays as small as possible in the card YAML.
 */
export function captureVariantPreset(field: FieldConfig): Partial<FieldConfig> {
  const preset: Record<string, unknown> = {};
  for (const k of MANAGED_KEYS) {
    const v = field[k];
    if (v !== undefined) preset[k] = v;
  }
  if (field.options?.length) preset.options = stripOptionBindings(field.options);
  else delete preset.options;
  return preset as Partial<FieldConfig>;
}

/**
 * True when applying `id` to `field` would discard a populated option list —
 * the field has options and the incoming variant brings none of its own, so the
 * MANAGED_KEYS clear in `variantPreset` wins and the list is gone. The editor
 * confirms before that; nothing else here is costly enough to be worth asking.
 */
export function variantSwitchClearsOptions(field: FieldConfig, type: FieldType, id: string): boolean {
  if (!field.options?.length) return false;
  return resolveVariant(type, id)?.preset?.options === undefined;
}
