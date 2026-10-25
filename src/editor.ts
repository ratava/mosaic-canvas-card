import { LitElement, html, svg, css, nothing, type TemplateResult, type PropertyValues } from 'lit';
import 'vanilla-colorful/hex-color-picker.js';
import { customElement, property, state } from 'lit/decorators.js';
import { html as staticHtml, unsafeStatic } from 'lit/static-html.js';
import type { HomeAssistant, LovelaceCardEditor } from 'custom-card-helpers';
import { TAG_EDITOR, TAG_CANVAS } from './tags';
import { isControlField, CONTROL_FIELD_TYPES } from './types';
import {
  getVariants, variantPreset, defaultVariantId, setUserVariants,
  bundledVariants, userVariants, uniqueVariantId, captureVariantPreset, MANAGED_KEYS,
  isCustomVariant, resolveVariant, variantSwitchClearsOptions,
} from './controls/variants';
import { LIB_BASE } from './urls';

// Static tag literal for the preview <mosaic-canvas> element (build-time suffixed).
const CANVAS_TAG = unsafeStatic(TAG_CANVAS);
import type {
  MosaicCanvasConfig,
  CardConfig,
  CardLayoutMode,
  FieldConfig,
  BoxStyle,
  TextStyle,
  Anchor,
  Align,
  FieldType,
  GlobalDefaults,
  CanvasConfig,
  BackgroundConfig,
  FlowConfig,
  FlowEndpoint,
  FlowStyle,
  FlowSide,
  VirtualConfig,
  VirtualOp,
  TimeUntilTrigger,
  VisibilityOperator,
  VisibilityCondition,
  StatPeriod,
  StatSamplePeriod,
  StatType,
  ActionConfig,
  ActionType,
  TapActions,
  ZoneConfig,
  EmbeddedCardConfig,
  FillThreshold,
  GraphType, GraphCurve, GraphLegendPos, GraphStateColor, GraphTimelineLabel,
  GraphSeries,
  ControlStyle,
  ControlLabel,
  ControlOption,
  SliderTrackLabel,
  ControlVariant,
  ControlVariantRegistry,
  OptionIconPosition,
  OptionPartPosition,
  OptionLayout,
  StatCharacteristic,
  TimeUntilLayoutItem,
  CardBackgroundConfig,
  BackgroundRule,
  IconRule,
} from './types';
import { computeCanvasDims, customVarStyles, matchPopupDimming, resolveFlowPoint, POPUP_DIMMING, POPUP_DIMMING_KEYS, MOSAIC_DIMMING_KEYS, POPOVER_DIMMING_KEYS, ANCHOR_FRAC, deriveAttributeFromOptionsAttribute, stateIcon, iconPrefix } from './view';
import type { PopupDimming } from './view';
import { HISTORY_GRAPH_TYPES, STAT_PERIOD_LABELS, describeWindow, graphDataMigration,
  resolveGraphStat, sampleOptionsFor } from './stats';
import { buildTemplate, downloadTemplate, parseTemplate, applyTemplate } from './templates';
import { buildVariantPack, downloadVariantPack, parseVariantPack, mergeVariantPack } from './templates';
import type { CardBox } from './view';
import { CARD_VERSION, BUILD_ID } from './version';
import { collectReferencedEntities } from './entities';
import type { MosaicCanvas } from './mosaic-canvas';
import { cardLayoutMode, sd } from './seed-defaults';
import { collectHealthIssues, errorCount, fieldStructuralKeys, HEALTH_CHECKS } from './health';
import type { HealthContext, HealthIssue, HealthRemoval, HealthReport } from './health';

// ── Small utilities ───────────────────────────────────────────────────────────

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
/** Round a 0-1 fraction to 4 decimal places. */
function roundFrac(n: number): number {
  return Math.round(n * 10000) / 10000;
}

/** Options for MosaicCanvasEditor._numInput/_numRow. */
type NumInputOpts = {
  value: number | string | null | undefined;
  onChange: (v: number | undefined) => void;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  placeholder?: string;
  /** Tooltip on the input itself. Prefer `hint`, which puts it on the label. */
  title?: string;
  /** Tier-2 tooltip, forwarded to `_row` (#93). */
  hint?: string;
};

/** Merge a patch into an object, dropping keys patched to undefined.
 *  Phantom `key: undefined` own-properties break `in`/Object.keys checks
 *  and make exported templates differ from visually identical configs. */
function mergePatch<T extends object>(obj: T | undefined, patch: Partial<T>): T {
  const merged = { ...(obj ?? ({} as T)), ...patch };
  for (const k of Object.keys(patch)) {
    if ((patch as Record<string, unknown>)[k] === undefined) delete (merged as Record<string, unknown>)[k];
  }
  return merged;
}

// ── Override manifests (#64) ──────────────────────────────────────────────────
//
// Every section screen declares the config slots it owns as dotted paths from
// that section's root object — `'width'`, `'box.border_color'`,
// `'graph.line_width'`. Two features read the one declaration: the count badge
// on the section's menu row, and its "Clear overrides" button. They cannot
// disagree about what a section holds, which is the failure #28 hit when
// `SEPARATION_KEYS` and the panel that rendered those rows drifted apart.
//
// A slot counts as overridden when its value is `!== undefined` — i.e. this
// level of the field → global defaults → seed → literal chain holds something
// of its own. That is the question "which of 40 screens holds the stray
// override?" actually asks; a resolved-value comparison would answer a
// different one and flag every value that merely matches its default.

/**
 * Prefix a container's relative keys into section paths — `pfx('box', […])`.
 * #75: generic so the result is `` `${container}.${key}` `` template-literal
 * types rather than plain `string` — that's what lets a `pfx(...)` call inside
 * a `NavSectionDef<T>.paths` literal be checked against `Path<T>` at all.
 */
function pfx<C extends string, K extends string>(container: C, keys: readonly K[]): readonly `${C}.${K}`[] {
  return keys.map((k) => `${container}.${k}`) as readonly `${C}.${K}`[];
}

/** Join a flat key prefix onto suffixes — `keyed('thermo_', ['tick_color'])`. For
 *  the families whose members are one flat namespace apart rather than nested.
 *  Generic for the same reason as `pfx`. */
function keyed<P extends string, S extends string>(prefix: P, suffixes: readonly S[]): readonly `${P}${S}`[] {
  return suffixes.map((s) => `${prefix}${s}`) as readonly `${P}${S}`[];
}

/** Read a dotted path off a section root, tolerating absent containers. */
function pathValue(root: unknown, path: string): unknown {
  let cur: unknown = root;
  for (const seg of path.split('.')) {
    if (cur === null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}

/** Master switch for the two override-count UI affordances (#64): the ribbon
 *  nav-card badge and the "N overrides on this screen / Clear overrides" div.
 *  Flipped off — display only, not removed — because the counts/wiring below
 *  currently mis-fire; see conversation. Set back to `true` once fixed. */
const _SHOW_OVERRIDE_INDICATORS = false;

/** How many of a section's slots this level actually sets. 0 renders no badge. */
function countOverrides(root: unknown, paths: readonly string[] | undefined): number {
  if (!paths) return 0;
  let n = 0;
  for (const p of paths) if (pathValue(root, p) !== undefined) n++;
  return n;
}

/**
 * A shallow patch for the section's root that clears every one of its slots.
 *
 * Nested containers are rebuilt with `mergePatch` rather than patched a level
 * down, because the root's own updater only sees the container key — a raw
 * `{ box: { k: undefined } }` would replace the whole box. A container left
 * with nothing in it collapses to `undefined` so an emptied `control_style`
 * doesn't linger as `{}`, which reads as "override on" to the inherit
 * switches and makes exported templates differ from identical configs (#58).
 */
function clearPatch(root: unknown, paths: readonly string[]): Record<string, unknown> {
  // Deletion tree — `['width', 'box.border']` becomes
  // `{ width: true, box: { border: true } }` — so nesting of any depth is one
  // recursion rather than special cases per level.
  type DelNode = Map<string, DelNode | true>;
  const tree: DelNode = new Map();
  for (const p of paths) {
    const segs = p.split('.');
    let cur = tree;
    for (const seg of segs.slice(0, -1)) {
      const next = cur.get(seg);
      if (next instanceof Map) { cur = next; continue; }
      const fresh: DelNode = new Map();
      cur.set(seg, fresh);
      cur = fresh;
    }
    cur.set(segs[segs.length - 1], true);
  }
  const strip = (obj: unknown, node: DelNode): Record<string, unknown> | undefined => {
    const out: Record<string, unknown> = { ...(obj && typeof obj === 'object' ? obj as Record<string, unknown> : {}) };
    for (const [seg, child] of node) {
      if (child === true) { delete out[seg]; continue; }
      const next = strip(out[seg], child);
      if (next === undefined) delete out[seg]; else out[seg] = next;
    }
    return Object.keys(out).length ? out : undefined;
  };
  const patch: Record<string, unknown> = {};
  for (const [seg, child] of tree) {
    patch[seg] = child === true ? undefined : strip(pathValue(root, seg), child);
  }
  return patch;
}

function generateStatisticsYaml(entityId: string, char: StatCharacteristic, maxAgeHours?: number, samplingSize?: number, percentile?: number): string {
  const base = (entityId.split('.')[1] ?? 'sensor').replace(/_/g, ' ');
  const charSlug = char.replace(/_/g, ' ');
  const lines = [
    '# Add to configuration.yaml',
    'sensor:',
    '  - platform: statistics',
    `    name: "${base} ${charSlug}"`,
    `    entity_id: ${entityId}`,
    `    state_characteristic: ${char}`,
  ];
  if (maxAgeHours) {
    lines.push('    max_age:');
    lines.push(`      hours: ${maxAgeHours}`);
  }
  if (samplingSize) lines.push(`    sampling_size: ${samplingSize}`);
  if (char === 'percentile' && percentile) lines.push(`    percentile: ${percentile}`);
  const slug = `${entityId.split('.')[1] ?? 'sensor'}_${char}`;
  lines.push('');
  lines.push('# Then set the field entity to:');
  lines.push(`# sensor.${slug}`);
  return lines.join('\n');
}

const STAT_CHARACTERISTICS: { value: StatCharacteristic; label: string; group: string; binary?: boolean }[] = [
  // Averages (numeric)
  { value: 'average_linear',   label: 'Average (linear)',    group: 'Averages' },
  { value: 'average_step',     label: 'Average (step)',      group: 'Averages', binary: true },
  { value: 'average_timeless', label: 'Average (timeless)',  group: 'Averages', binary: true },
  { value: 'mean',             label: 'Mean',                group: 'Averages', binary: true },
  { value: 'mean_circular',    label: 'Mean (circular)',     group: 'Averages' },
  { value: 'median',           label: 'Median',              group: 'Averages' },
  // Extremes
  { value: 'value_max',        label: 'Value maximum',       group: 'Extremes' },
  { value: 'value_min',        label: 'Value minimum',       group: 'Extremes' },
  { value: 'distance_absolute',label: 'Range (max − min)',   group: 'Extremes' },
  // Spread
  { value: 'standard_deviation',             label: 'Standard deviation',           group: 'Spread' },
  { value: 'variance',                        label: 'Variance',                     group: 'Spread' },
  { value: 'noisiness',                       label: 'Noisiness',                    group: 'Spread' },
  { value: 'percentile',                      label: 'Percentile',                   group: 'Spread' },
  { value: 'distance_95_percent_of_values',   label: 'Distance 95% of values',      group: 'Spread' },
  { value: 'distance_99_percent_of_values',   label: 'Distance 99% of values',      group: 'Spread' },
  // Change
  { value: 'change',        label: 'Change',             group: 'Change' },
  { value: 'change_sample', label: 'Change per sample',  group: 'Change' },
  { value: 'change_second', label: 'Change per second',  group: 'Change' },
  // Sums
  { value: 'sum',                        label: 'Sum',                          group: 'Sums' },
  { value: 'sum_differences',            label: 'Sum of differences',           group: 'Sums' },
  { value: 'sum_differences_nonnegative',label: 'Sum of differences (positive)',group: 'Sums' },
  { value: 'total',                      label: 'Total',                        group: 'Sums' },
  // Counts
  { value: 'count',     label: 'Count (samples)',  group: 'Counts', binary: true },
  { value: 'count_on',  label: 'Count (on)',       group: 'Counts', binary: true },
  { value: 'count_off', label: 'Count (off)',      group: 'Counts', binary: true },
  // Timestamps
  { value: 'datetime_newest',    label: 'Timestamp (newest)',     group: 'Timestamps' },
  { value: 'datetime_oldest',    label: 'Timestamp (oldest)',     group: 'Timestamps', binary: true },
  { value: 'datetime_value_max', label: 'Timestamp (at max)',     group: 'Timestamps' },
  { value: 'datetime_value_min', label: 'Timestamp (at min)',     group: 'Timestamps' },
];

const ANCHORS: Anchor[] = [
  'top-left', 'top', 'top-right',
  'left', 'center', 'right',
  'bottom-left', 'bottom', 'bottom-right',
];

const ANCHOR_LABELS: Record<Anchor, string> = {
  'top-left': 'Top Left', 'top': 'Top Center', 'top-right': 'Top Right',
  'left': 'Left Middle', 'center': 'Center', 'right': 'Right Middle',
  'bottom-left': 'Bottom Left', 'bottom': 'Bottom Center', 'bottom-right': 'Bottom Right',
};

const ALIGNS: Align[] = ['left', 'center', 'right'];

/** Menu labels for ALIGNS — the stored value stays lower case, as ANCHOR_LABELS does. */
const ALIGN_LABELS: Record<Align, string> = { left: 'Left', center: 'Center', right: 'Right' };

/** Base Home Assistant theme color variables offered in the color picker dropdown. */
const HA_THEME_VARS: { name: string; label: string }[] = [
  { name: '--primary-color', label: 'Primary' },
  { name: '--text-primary-color', label: 'Text on Primary' },
  { name: '--accent-color', label: 'Accent' },
  { name: '--primary-text-color', label: 'Primary text' },
  { name: '--secondary-text-color', label: 'Secondary text' },
  { name: '--disabled-text-color', label: 'Disabled text' },
  { name: '--primary-background-color', label: 'Primary background' },
  { name: '--secondary-background-color', label: 'Secondary background' },
  { name: '--card-background-color', label: 'Card background' },
  { name: '--divider-color', label: 'Divider' },
  { name: '--state-icon-color', label: 'State icon' },
  { name: '--state-active-color', label: 'State Active' },
  { name: '--state-inactive-color', label: 'State Inactive' },
  { name: '--error-color', label: 'Error' },
  { name: '--warning-color', label: 'Warning' },
  { name: '--success-color', label: 'Success' },
  { name: '--info-color', label: 'Info' },
];
// Every field type the Type dropdown offers. Canonical membership only — the
// dropdown renders FIELD_TYPES_SORTED below; 'graph' is deliberately absent
// (the Element Library picker sets it, see _healthOffered).
const FIELD_TYPES: FieldType[] = ['value', 'label', 'icon', 'svg', 'blank', 'rule', 'embedded_card', 'toggle', 'slider', 'dropdown', 'button_group', 'input', 'spinbox', 'button'];
const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  value: 'Value', label: 'Label', icon: 'Icon', svg: 'Element Library', graph: 'Graph / Gauge',
  blank: 'Blank', rule: 'Horizontal Rule', embedded_card: 'Embedded Card',
  toggle: 'Toggle', slider: 'Slider', dropdown: 'Dropdown', button_group: 'Button Group',
  input: 'Input', spinbox: 'Spin Box', button: 'Button',
};
/**
 * The Type dropdown's order: alphabetical by the label the user reads, not by
 * the type key behind it — `svg` belongs under "Element Library" and `rule`
 * under "Horizontal Rule", which is where someone scanning the list will look.
 *
 * Derived rather than hand-ordered so it cannot drift from `FIELD_TYPES`, which
 * stays the canonical membership list (Config Health reads it for the legal-value
 * check, where order means nothing).
 */
const FIELD_TYPES_SORTED: FieldType[] =
  [...FIELD_TYPES].sort((a, b) => FIELD_TYPE_LABELS[a].localeCompare(FIELD_TYPE_LABELS[b]));

const FIELD_TYPE_ICONS: Record<FieldType, string> = {
  value: 'mdi:function-variant', label: 'mdi:format-title', icon: 'mdi:image',
  svg: 'mdi:shape-outline', graph: 'mdi:chart-line', blank: 'mdi:crop-square-outline', rule: 'mdi:minus',
  embedded_card: 'mdi:widgets',
  toggle: 'mdi:toggle-switch-outline', slider: 'mdi:tune-variant', dropdown: 'mdi:form-dropdown',
  button_group: 'mdi:view-dashboard-variant-outline', input: 'mdi:form-textbox', spinbox: 'mdi:numeric',
  button: 'mdi:gesture-tap-button',
};
/**
 * What a given graph type actually honours, in one place.
 *
 * These lived as inline string arrays at each use site and had drifted from
 * what `view.ts` really does: 'stat-line' is a history type, so it was denied
 * its own History depth and Stroke width; a state timeline was offered a
 * stroke it never draws; a stacked bar was offered Min/Max it scales straight
 * past. A row that renders for a type that ignores it is worse than a missing
 * row — it reads as a setting that does nothing.
 *
 * Derived, not enumerated per type, so adding a type means answering these
 * questions rather than remembering every list that mentions it.
 */
interface GraphCaps {
  /** Reads the recorder over a window, so History (hours) applies. */
  history: boolean;
  /** Draws a stroked trace, so width and line shape apply. */
  stroke: boolean;
  /** Has a value axis the user can bound. */
  range: boolean;
  /**
   * Draws a rotated title down the left of a plot. Not the same question as
   * `range`: a gauge has bounds and no plot, a stacked bar has a plot and no
   * bounds, and a horizontal bar's categories run down the left where the
   * title would go. Only the renderers that call renderYTitle answer yes.
   */
  yTitle: boolean;
  /** Draws discrete bars whose values can be labelled. */
  bars: boolean;
  /** Names something in a legend — series for charts, states for a timeline. */
  legend: boolean;
  gauge: boolean;
  timeline: boolean;
  /** Aggregates buckets, so a series Stat type means something. */
  statType: boolean;
}

function graphCaps(gt: GraphType): GraphCaps {
  const is = (...types: GraphType[]) => types.includes(gt);
  return {
    history: HISTORY_GRAPH_TYPES.includes(gt),
    stroke: is('stat-line', 'stat-area', 'line', 'area'),
    range: !is('bar-stacked', 'state-timeline'),
    yTitle: is('bar', 'bar-stacked', 'stat-line', 'stat-area', 'line', 'area'),
    bars: is('bar', 'bar-h'),
    // A timeline's legend lists the states present rather than the series,
    // which is useful again now the states path yields real state names.
    legend: true,
    gauge: is('gauge', 'gauge-needle'),
    timeline: is('state-timeline'),
    // A state timeline reads the raw state log, so there is nothing for a stat
    // type to aggregate — offering one implied a choice that did nothing.
    statType: !is('state-timeline'),
  };
}

/**
 * The windows a graph field can be drawn over (#123) — Home Assistant's
 * `calendar` and `rolling_window` period shapes, in the two groups the select
 * renders as optgroups. 'custom' (HA's `fixed_period`) is deliberately absent:
 * a fixed start and end make a chart that stops updating, which is a value
 * field's job, not a chart's.
 */
const GRAPH_STAT_PERIODS: { value: StatPeriod; group: 'Calendar' | 'Rolling window' }[] = [
  { value: 'today',           group: 'Calendar' },
  { value: 'yesterday',       group: 'Calendar' },
  { value: 'this_week',       group: 'Calendar' },
  { value: 'last_week',       group: 'Calendar' },
  { value: 'this_month',      group: 'Calendar' },
  { value: 'last_month',      group: 'Calendar' },
  { value: 'this_year',       group: 'Calendar' },
  { value: 'last_year',       group: 'Calendar' },
  { value: 'last_30_minutes', group: 'Rolling window' },
  { value: 'last_hour',       group: 'Rolling window' },
  { value: 'last_day',        group: 'Rolling window' },
  { value: 'last_n_minutes',  group: 'Rolling window' },
  { value: 'last_n_hours',    group: 'Rolling window' },
  { value: 'last_n_days',     group: 'Rolling window' },
  { value: 'last_n_months',   group: 'Rolling window' },
];

/** Bucket resolutions, finest first — the order `sampleOptionsFor` returns. */
const SAMPLE_PERIOD_LABELS: Record<StatSamplePeriod, string> = {
  auto: 'Auto (from the window)',
  '5minute': '5 minutes',
  hour: 'Hour',
  day: 'Day',
  week: 'Week',
  month: 'Month',
  year: 'Year',
};

/** The N-value row's label for each of the last_n_* windows. */
const STAT_PERIOD_N_LABELS: Partial<Record<StatPeriod, string>> = {
  last_n_minutes: 'Number of minutes',
  last_n_hours: 'Number of hours',
  last_n_days: 'Number of days',
  last_n_months: 'Number of months',
};

const GRAPH_TIMELINE_LABELS: { value: GraphTimelineLabel; label: string }[] = [
  { value: 'above', label: 'Above the bar' },
  { value: 'left',  label: 'Left of the bar' },
  { value: 'none',  label: 'Hidden' },
];

const GRAPH_LEGEND_POSITIONS: { value: GraphLegendPos; label: string }[] = [
  { value: 'bottom', label: 'Below the chart' },
  { value: 'top',    label: 'Above the chart' },
  { value: 'left',   label: 'Left of the chart' },
  { value: 'right',  label: 'Right of the chart' },
];

const GRAPH_CURVES: { value: GraphCurve; label: string }[] = [
  { value: 'linear', label: 'Straight' },
  { value: 'smooth', label: 'Smoothed' },
  { value: 'step',   label: 'Stepped' },
];

const GRAPH_TYPES: { value: GraphType; label: string }[] = [
  { value: 'stat-line',      label: 'Statistics — Line' },
  { value: 'stat-area',      label: 'Statistics — Line (Stacked)' },
  { value: 'bar',            label: 'Statistics — Bar' },
  { value: 'bar-h',          label: 'Statistics — Bar (horizontal)' },
  { value: 'bar-stacked',    label: 'Statistics — Bar (stacked)' },
  { value: 'line',           label: 'History — Line (with unit)' },
  { value: 'area',           label: 'History — Line Stacked' },
  { value: 'state-timeline', label: 'History — State timeline' },
  { value: 'gauge',          label: 'Arc Gauge' },
  { value: 'gauge-needle',   label: 'Arc Gauge (Needle)' },
];

/**
 * #75: every legal dotted path into `T`, recursing into plain-object
 * properties and stopping at arrays, scalars and `undefined`-only members —
 * so `graph_series`/`thresholds`/`triggers` etc. are leaves (a manifest never
 * indexes into an array; see #64's own paths tables), never a combinatorial
 * walk through their element types. Every config container this editor
 * actually nests (`BoxStyle`, `TextStyle`, `ControlStyle`, `CardBackgroundConfig`)
 * is itself flat, so real usage never exceeds depth 3 (`canvas.grid.columns`);
 * the `Depth` counter is a structural backstop against that changing later,
 * not a limit this codebase currently presses against.
 *
 * A renamed or deleted config property now breaks the build at the manifest
 * that names it, instead of silently under-counting — the #64 review found
 * six defects invisible to every check the repo had; three become impossible
 * to write and one becomes impossible to leave stale (see the type's use on
 * `NavSectionDef.paths` below).
 */
type IsPlainObject<T> = T extends readonly unknown[] ? false : T extends object ? true : false;
type PathDepth = [never, 0, 1, 2, 3, 4, 5];
type PathImpl<T, D extends number> = D extends 0 ? never : {
  [K in keyof T & string]:
    IsPlainObject<NonNullable<T[K]>> extends true
      ? `${K}` | `${K}.${PathImpl<NonNullable<T[K]>, PathDepth[D]>}`
      : `${K}`
}[keyof T & string];
type Path<T> = PathImpl<T, 6>;

/**
 * One row of an in-panel Sections menu — the single source of truth for a
 * section screen's crumb key, label, hint and icon. Every menu renders from a
 * table (or producer) of these, and the editor-wide search index (#61) is
 * generated from the same tables, so search results cannot drift from what
 * the menus actually offer.
 *
 * Generic in `T`, the object its `paths` are relative to (see `SectionScope<T>`)
 * — a table declared `NavSectionDef<CardConfig>[]` can only ever list real
 * `CardConfig` paths, and can only be rendered against a `SectionScope<CardConfig>`
 * (#75's second requirement: nothing stops a mismatched root at the type
 * level today). `T` defaults to `unknown` for the handful of tables — Templates'
 * import/export screens, the Card Config editor that delegates to HA's own
 * card editor — that own no config of their own and so declare no `paths` at all.
 */
interface NavSectionDef<T = unknown> {
  key: string;
  label: string;
  hint: string;
  icon: string;
  /**
   * Hidden search vocabulary (#61): control-row labels and keywords on this
   * section's screen that don't already appear in `label`/`hint`. Matched by
   * `_searchResults()` like a hint hit, but never rendered anywhere.
   * DRIFT RULE: when a section screen gains, loses or renames a control row,
   * update its `terms` here in the same change — the row-rendering methods
   * carry reminder comments pointing back at this field. Sections whose rows
   * come from a shared row group reference the shared *_TERMS constant below
   * instead, so the group's vocabulary is updated in one place.
   */
  terms?: string;
  /**
   * Override manifest (#64): every config slot this section screen can set, as
   * dotted paths from the section's root object (see `SectionScope`). Drives
   * both the count badge on this row and the screen's "Clear overrides"
   * button — one declaration, so the two can never disagree.
   *
   * DRIFT RULE: same as `terms` — a section that gains, loses or renames a
   * control row updates `paths` in the same change. Sections built from a
   * shared row group reference the shared *_PATHS constant below rather than
   * restating its keys, which is what stops the #28 failure (a hand-copied key
   * list silently missing `button_group_option_extra_css`) from recurring.
   *
   * Slots are listed even when the row that edits them is conditionally
   * hidden — a stray override behind a collapsed row is exactly what these two
   * features exist to surface. A nested style container (`icon_style`) is one
   * slot, not one per property inside it.
   *
   * Omitted only for sections that own no config of their own — Templates'
   * import/export screens, the Card Config editor that delegates to HA's own
   * card editor. Those render no badge and no Clear button.
   *
   * #75: typed as `Path<T>[]` rather than `string[]` — a renamed/deleted
   * property is now a compile error here, not a silently under-counting badge.
   */
  paths?: readonly Path<T>[];
}

/**
 * What a Sections menu needs to resolve its rows' manifests (#64): the object
 * each section's `paths` are relative to, and the sink that writes a cleared
 * patch back. `apply` is the panel's existing shallow updater — `_updateCard`,
 * `_updateDefaults`, `_updateZone`, … — so clearing reuses the same merge
 * semantics (and the same undo step) as any ordinary edit on that screen.
 *
 * #75: generic in `T` so a scope built from a `CardConfig` cannot be handed to
 * `_navMenu`/`_clearOverridesBtn` alongside a `NavSectionDef<ZoneConfig>[]` table
 * — the mismatch #75 named as invisible today becomes a type error.
 */
interface SectionScope<T = unknown> {
  root: T | undefined;
  apply: (patch: Partial<T>) => void;
}

// Shared hidden-search vocabularies for the shared row groups. One constant per
// group — update alongside the group's rows (see NavSectionDef.terms).
/** Rows rendered by `_boxRows()`. */
const BOX_STYLE_TERMS = 'background gradient angle opacity color border width radius padding shadow drop box halo glow type offset spread blur css';
/** Rows rendered by `_textRows()`. */
const TEXT_STYLE_TERMS = 'font size color weight family letter spacing css';
/** Rows rendered by `_actionRows()`. */
const ACTION_TERMS = 'tap hold double navigate url more info toggle service action perform assist popover expand dom event entity write override';
/** Rows rendered by `_visibilityRows()`. */
const VISIBILITY_TERMS = 'entity operator value condition show hide visible';
/**
 * Default tooltip for `_cssRow` (#93). Every Additional CSS row says the same
 * thing; the handful that style a different surface pass their own.
 */
const CSS_ROW_HINT =
  'Raw CSS declarations applied to this element, e.g. outline: 1px dashed red;. Applied after everything above, so it wins.';
/** Rows rendered by `_fieldSecSvgThermo()` / the Element Library thermometer defaults. */
const THERMO_TERMS = 'tick minor major length thickness font size position grid line color temperature transparency opacity decimals value';
/**
 * Tier-2 tooltips for those rows (#93). One object, because the field editor and
 * the two Element Library thermometer screens render the same row set against
 * different keys — the text is identical and must stay that way.
 */
const THERMO_HINTS = {
  tick_color: 'Colour of the scale marks beside the tube.',
  tick_position: 'Which side of the tube the scale sits on.',
  minor_tick_text: 'Numbers the small ticks as well as the major ones.',
  tick_font_size: 'Size of the numbers beside the ticks.',
  grid_color: 'Colour of the lines running across the tube from each major tick. Leave blank for none.',
  decimals: 'Decimal places on the temperature reading.',
  temp_color: 'Colour of the temperature reading. Leave blank to follow the fill colour.',
} as const;

// Shared override manifests for the same row groups, container-relative — pair
// each with its *_TERMS constant above and update both alongside the group's
// rows (see NavSectionDef.paths). Call sites prefix them with `pfx()`.
/** Slots written by `_boxRows()`, relative to the BoxStyle it edits. */
const BOX_STYLE_PATHS = [
  'background', 'background_alpha', 'background2', 'background_angle', 'color',
  'border', 'border_width', 'radius', 'padding',
  'shadow', 'shadow_mode', 'shadow_x', 'shadow_y', 'shadow_blur', 'shadow_spread', 'shadow_color',
  'extra_css', 'blur',
] as const;
/** Slots written by `_textRows()`, relative to the TextStyle it edits. */
const TEXT_STYLE_PATHS = [
  'font_size', 'color', 'font_weight', 'font_family', 'letter_spacing', 'extra_css',
] as const;
/**
 * The same two lists minus `extra_css`, for the screens that call their row
 * group with `showCss: false`.
 *
 * That argument drops the Additional CSS row entirely, so on those screens the
 * slot is unreachable — no row can set it and none displays it. Badging or
 * clearing it there would report an override the user cannot see and cannot
 * have made from that screen.
 */
const BOX_STYLE_PATHS_NO_CSS = BOX_STYLE_PATHS.filter((k) => k !== 'extra_css');
const TEXT_STYLE_PATHS_NO_CSS = TEXT_STYLE_PATHS.filter((k) => k !== 'extra_css');
/**
 * #75 (defect 4): the field-level Control Style / Text Style screens' own
 * `control_box`/`style` rows never show their own "Additional CSS" row —
 * the field's own `extra_css` (rendered directly below each, via `_cssRow`)
 * already covers it, and a second one would let the user set the same CSS
 * two different ways. Previously this was two facts kept in sync only by a
 * comment: the `_boxRows(..., false)` / `_textRows(..., false)` call and the
 * `*_PATHS_NO_CSS` manifest choice. Both now read this one constant, so they
 * cannot independently drift — see its two render call sites (`_fieldSecControlStyle`,
 * `_fieldSecStyle`) and its two manifest sites (`controlStyle`'s `control_box`
 * paths, the `fsec:style` def's `style` paths) in `_fieldSectionDefs`.
 */
const FIELD_CONTAINER_SHOWS_CSS = false;
/** Slots written by `_actionRows()`, relative to the TapActions holder. */
const ACTION_PATHS = ['tap_action', 'hold_action', 'double_tap_action'] as const;
/** Slots written by `_optionLayoutRows()`, relative to the OptionLayout it edits.
 *  The three `*_style` entries are whole TextStyle containers — one slot each. */
const OPTION_LAYOUT_PATHS = [
  'icon_position', 'show_state', 'state_position', 'icon_style', 'label_style', 'state_style',
] as const;
/**
 * Slots written by `_selectorStateRows()`, per screen and control type, relative
 * to the ControlStyle it edits. Button and selector never share a key — that
 * separation is deliberate (see the method) and the split here preserves it.
 *
 * Each state's own `…_angle` is listed alongside its `…2` colour — the Gradient
 * checkbox reveals both together and unticking clears both, so they belong to
 * the same screen (#91). The control-wide `gradient_angle` they fall back to is
 * still absent: it is owned by Control Default ▸ Common, and listing it on each
 * state screen would let clearing Inactive silently retune Active.
 */
// #75: `satisfies` rather than a `Record<..., { sel: readonly string[]; ... }>`
// annotation — the latter would widen every array back to plain `string`.
const SELECTOR_STATE_PATHS = {
  'sub:container': {
    sel: ['button_group_text_size', 'button_group_icon_size', 'button_group_state_size'],
    btn: ['button_border_color', 'button_border_width', 'button_radius', 'button_option_padding',
          'button_text_size', 'button_icon_size', 'button_state_size'],
  },
  'sub:active': {
    sel: ['button_group_selected_color', 'button_group_selected_color2', 'button_group_selected_angle',
          'button_group_selected_text_color',
          'button_group_selected_icon_color', 'button_group_selected_state_color'],
    btn: ['button_selected_color', 'button_selected_color2', 'button_selected_angle',
          'button_selected_text_color',
          'button_selected_icon_color', 'button_selected_state_color'],
  },
  'sub:inactive': {
    sel: ['button_group_bg', 'button_group_bg2', 'button_group_bg_angle',
          'button_group_text_color', 'button_group_icon_color', 'button_group_state_color'],
    btn: ['button_bg', 'button_bg2', 'button_bg_angle',
          'button_text_color', 'button_icon_color', 'button_state_color'],
  },
} as const satisfies Record<'sub:container' | 'sub:active' | 'sub:inactive',
  { sel: readonly (keyof ControlStyle)[]; btn: readonly (keyof ControlStyle)[] }>;
/**
 * Slots written by `_optionSeparationRows()` for a selector, relative to the
 * ControlStyle. #75: `SEPARATION_KEYS` now derives from this constant (plus
 * `BUTTON_SEPARATION_PATHS`) instead of hand-duplicating it — see the note
 * there for the drift this used to cause.
 */
const OPTION_SEPARATION_PATHS = [
  'button_group_option_gap', 'button_group_border_color', 'button_group_border_width', 'button_group_radius',
  'button_group_option_padding', 'button_group_option_border', 'button_group_option_border_color',
  'button_group_option_border_width', 'button_group_option_radius', 'button_group_option_extra_css',
] as const;
/**
 * Slots written by `_optionSeparationRows()` for a button — padding only.
 *
 * `button_option_padding` is rendered on two different screens, so exactly one
 * has to own it per context (the invariant stated on `NavSectionDef.paths`):
 *
 * - Globally, a button has no Option Separation screen at all, so its Field
 *   Container screen renders the padding row and owns the slot. That is why
 *   `SELECTOR_STATE_PATHS['sub:container'].btn` lists it.
 * - Per field, Button Layout renders it *and* is always reachable, whereas
 *   `fscs:container` only appears while the field overrides the global control
 *   style. So the per-field variants hand ownership to Button Layout and
 *   subtract it from their container list — see `BUTTON_CONTAINER_FIELD_ONLY`.
 */
const BUTTON_SEPARATION_PATHS = ['button_option_padding'] as const;
/**
 * `sub:container`.btn minus the slot Button Layout owns per field (above).
 * Used by the two per-field consumers, `_fscsDefs` and `_controlStylePathsFor`.
 */
const BUTTON_CONTAINER_FIELD_ONLY: readonly (keyof ControlStyle)[] =
  SELECTOR_STATE_PATHS['sub:container'].btn
    .filter((k): k is Exclude<typeof k, typeof BUTTON_SEPARATION_PATHS[number]> =>
      !(BUTTON_SEPARATION_PATHS as readonly string[]).includes(k));
/**
 * Thermometer property suffixes. The field screen, the Element Library's
 * vertical screen and its horizontal screen all offer the same properties and
 * differ only in the flat prefix they write (`thermo_` vs `thermo_h_`, kept
 * independent per #23), so one list drives all three via `keyed()`.
 */
const THERMO_SUFFIXES = [
  'major_tick_length', 'major_tick_width', 'minor_tick_length', 'minor_tick_width',
  'show_minor_tick_text', 'tick_color', 'tick_font_size', 'text_position', 'grid_color',
  'temp_color', 'temp_font_size', 'decimals', 'fill_opacity_above',
] as const;
/** The Element Library thermometer screens add the fill colours and a CSS row
 *  that the per-field screen doesn't offer. */
const THERMO_LIB_SUFFIXES = [...THERMO_SUFFIXES, 'fill_color', 'fill_color2', 'fill_angle', 'extra_css'] as const;
/** Element Library tank screens — one set of four rows plus the CSS row. */
const TANK_LIB_SUFFIXES = ['fill_color', 'fill_color2', 'fill_angle', 'fill_direction', 'tank_color', 'extra_css'] as const;
/** Element Library battery screens — fill, gradient end, CSS. */
const BATTERY_LIB_SUFFIXES = ['fill_color', 'fill_color2', 'fill_angle', 'extra_css'] as const;
/**
 * Said under every SVG fill's angle row. The card can only aim a gradient it
 * built itself: an SVG that ships its own `linearGradient` stops keeps its own
 * vector and the card just recolours the stops, so the angle does nothing there.
 */
const SVG_FILL_ANGLE_HINT =
  'Blank runs the gradient along the fill direction. An SVG that defines its own gradient stops keeps its own direction — the angle only applies to gradients the card draws.';
/**
 * Slots written by `_controlStyleRows()`, keyed by the FieldType it renders for,
 * relative to the ControlStyle. `accent` is the `showAccent` block, listed
 * separately because the global Control Default screens pass `showAccent: false`
 * and own those two keys from Common instead.
 */
// #75: no `Record<string, readonly string[]>` annotation — that would widen
// every property back to plain `string`, exactly the loss of literal-ness
// `pfx()` now depends on to check a `NavSectionDef<T>.paths` at all. Each
// property keeps its own literal tuple via the object-level `as const`; the
// one place that needs to index this by an arbitrary `FieldType` key
// (`_controlStylePathsFor`) casts locally instead.
const CONTROL_STYLE_PATHS = {
  accent: ['accent_color', 'accent_color2', 'accent_angle'],
  toggle: ['toggle_on_color', 'toggle_on_color2', 'toggle_on_angle',
           'toggle_off_color', 'toggle_off_color2', 'toggle_off_angle',
           'toggle_thumb_color', 'toggle_thumb_size', 'toggle_thumb_radius',
           'toggle_thumb_padding', 'toggle_thumb_shadow'],
  slider: ['slider_track_color', 'slider_track_color2', 'slider_track_angle',
           'slider_fill_color', 'slider_fill_color2', 'slider_fill_angle',
           'slider_height', 'slider_length', 'slider_radius', 'slider_border',
           'slider_border_color', 'slider_border_width', 'slider_thumb_color', 'slider_thumb_size',
           'slider_thumb_width', 'slider_thumb_radius', 'slider_thumb_padding', 'slider_thumb_shadow'],
  dropdown: ['dropdown_border_color', 'dropdown_bg', 'dropdown_bg2', 'dropdown_bg_angle',
             'dropdown_menu_bg', 'dropdown_menu_bg2', 'dropdown_menu_bg_angle',
             'dropdown_menu_border_color', 'dropdown_selected_color',
             'dropdown_selected_color2', 'dropdown_selected_angle', 'dropdown_radius', 'dropdown_text_size',
             'dropdown_menu_radius', 'dropdown_menu_shadow', 'dropdown_option_radius',
             'dropdown_option_text_color', 'dropdown_option_hover_color'],
  input: ['input_border_color', 'input_bg', 'input_bg2', 'input_bg_angle', 'input_focus_color',
          'input_placeholder_color', 'input_radius', 'input_text_size'],
  spinbox: ['spinbox_border_color', 'spinbox_bg', 'spinbox_bg2', 'spinbox_bg_angle',
            'spinbox_button_hover_color', 'spinbox_button_hover_color2', 'spinbox_button_hover_angle', 'spinbox_button_width', 'spinbox_button_font_size',
            'spinbox_radius', 'spinbox_text_size'],
} as const satisfies Record<string, readonly (keyof ControlStyle)[]>;

/**
 * One editor-wide search result (#61): a navigable screen, resolved against
 * the current config at query time. `path` is a complete crumb trail ready to
 * hand to `_navigateTo(tab, panel, path)`.
 */
interface NavSearchResult {
  icon: string;
  label: string;
  hint: string;
  /** Where the screen lives, for the result's context line — e.g. "Mosaic Cards › Solar". */
  context: string;
  /** Hidden search vocabulary carried over from the section def — matched, never rendered. */
  terms?: string;
  tab: 'cards' | 'elements' | 'settings';
  panel: string;
  path: { key: string; label: string; hint?: string }[];
}


interface CardInfo {
  type: string;
  name: string;
  description?: string;
  source?: string;
}

/**
 * One entry of `backgrounds.json` (#101): the filename a config stores, and the
 * label the picker shows for it. Generated at build time — see
 * vite-plugin-backgrounds.ts.
 */
interface LibImage {
  file: string;
  name?: string;
}

/** What the shared embed-config editor/picker modal is currently editing. */
type EmbedTarget =
  | { kind: 'std'; idx: number }
  | { kind: 'field'; ci: number; fi: number }
  | { kind: 'extfield'; ci: number; fi: number };

const HA_BUILTIN_CARDS: CardInfo[] = [
  { type: 'alarm-panel',         name: 'Alarm Panel' },
  { type: 'button',              name: 'Button' },
  { type: 'calendar',            name: 'Calendar' },
  { type: 'entities',            name: 'Entities' },
  { type: 'entity',              name: 'Entity' },
  { type: 'entity-filter',       name: 'Entity Filter' },
  { type: 'gauge',               name: 'Gauge' },
  { type: 'glance',              name: 'Glance' },
  { type: 'history-graph',       name: 'History Graph' },
  { type: 'horizontal-stack',    name: 'Horizontal Stack' },
  { type: 'humidifier',          name: 'Humidifier' },
  { type: 'iframe',              name: 'iFrame' },
  { type: 'light',               name: 'Light' },
  { type: 'logbook',             name: 'Logbook' },
  { type: 'map',                 name: 'Map' },
  { type: 'markdown',            name: 'Markdown' },
  { type: 'media-control',       name: 'Media Control' },
  { type: 'picture',             name: 'Picture' },
  { type: 'picture-elements',    name: 'Picture Elements' },
  { type: 'picture-entity',      name: 'Picture Entity' },
  { type: 'picture-glance',      name: 'Picture Glance' },
  { type: 'plant-status',        name: 'Plant Status' },
  { type: 'sensor',              name: 'Sensor' },
  { type: 'shopping-list',       name: 'Shopping List' },
  { type: 'statistics-graph',    name: 'Statistics Graph' },
  { type: 'thermostat',          name: 'Thermostat' },
  { type: 'tile',                name: 'Tile' },
  { type: 'todo-list',           name: 'To-do List' },
  { type: 'vertical-stack',      name: 'Vertical Stack' },
  { type: 'weather-forecast',    name: 'Weather Forecast' },
  { type: 'webpage',             name: 'Webpage' },
];

// ── Color utility ─────────────────────────────────────────────────────────────

/**
 * Split a stored colour into the colour itself and its alpha (0–1).
 *
 * Three encodings round-trip: `color-mix(in srgb, <c> N%, transparent)` — how a
 * variable carries alpha without losing the reference — plus `rgba()` and
 * 8-digit hex. Anything else is opaque, which for a bare `var()` means it
 * inherits whatever alpha the theme itself defined.
 */
function splitColorAlpha(css: string): { base: string; alpha: number } {
  const t = (css ?? '').trim();
  const mix = t.match(/^color-mix\(\s*in\s+srgb\s*,\s*(.+?)\s+([\d.]+)%\s*,\s*transparent\s*\)$/i);
  if (mix) return { base: mix[1].trim(), alpha: Math.max(0, Math.min(1, Number(mix[2]) / 100)) };
  const hex8 = t.match(/^#([0-9a-f]{6})([0-9a-f]{2})$/i);
  if (hex8) return { base: `#${hex8[1]}`, alpha: parseInt(hex8[2], 16) / 255 };
  const rgba = t.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*[,/]\s*([\d.]+)\s*\)$/i);
  if (rgba) {
    const hex = '#' + [rgba[1], rgba[2], rgba[3]]
      .map((n) => Math.max(0, Math.min(255, Math.round(Number(n)))).toString(16).padStart(2, '0'))
      .join('');
    return { base: hex, alpha: Math.max(0, Math.min(1, Number(rgba[4]))) };
  }
  return { base: t, alpha: 1 };
}

/**
 * Re-apply alpha to a colour that is not plain RGB — a `var()` or any other CSS
 * colour expression. color-mix keeps the reference intact, so a theme variable
 * still follows the theme; at full opacity the bare value is stored so nothing
 * is wrapped needlessly.
 */
function withAlphaExpr(base: string, alpha: number): string {
  if (alpha >= 1) return base;
  return `color-mix(in srgb, ${base} ${Number((alpha * 100).toFixed(1))}%, transparent)`;
}

/**
 * Resolve any CSS colour expression to #rrggbb by letting the browser compute it.
 *
 * `host` is where the probe gets parked, and it decides which custom properties
 * are in scope. Parked on `document.body`, a `var()` resolves against the page
 * root only — so `--mccust_*` (set on the editor host) and any theme variable
 * scoped to a subtree both compute to nothing, and the caller silently gets
 * black. Pass the editor element and the probe inherits the same cascade the
 * real swatch sees.
 *
 * The probe goes in the host's *light* DOM: Lit renders into the shadow root
 * and never touches light children, and with no <slot> to place it the node is
 * never rendered — so this is safe to call from inside render().
 */
function cssColorToHex(css: string, host?: HTMLElement): string {
  const parent = host?.isConnected ? host : document.body;
  const el = document.createElement('div');
  try {
    el.style.color = css;
    el.style.display = 'none';
    parent.appendChild(el);
    const rgb = getComputedStyle(el).color;
    const m = rgb.match(/\d+/g)?.map(Number);
    if (!m || m.length < 3) return '#000000';
    return '#' + m.slice(0, 3).map((x: number) => x.toString(16).padStart(2, '0')).join('');
  } catch { return '#000000'; } finally { el.remove(); }
}

// ── Editor element ────────────────────────────────────────────────────────────

@customElement(TAG_EDITOR)
export class MosaicCanvasEditor extends LitElement implements LovelaceCardEditor {
  @property({ attribute: false }) public hass?: HomeAssistant;

  @state() private _config?: MosaicCanvasConfig;
  @state() private _selCard = 0;
  @state() private _selField = -1;
  @state() private _selCards = new Set<number>();
  @state() private _selEmbCards = new Set<number>();
  /** Gap panel: pending px gap values, typed but not yet applied (Set/Clear act on these, not a saved config field). */
  @state() private _selColGap?: number;
  @state() private _selRowGap?: number;
  @state() private _selFlow = -1;
  @state() private _showAddFlowInput = false;
  @state() private _newFlowName = '';
  @state() private _pendingFlowIdx = -1;
  @state() private _showFlowCompleteModal = false;
  @state() private _selPoint = -1;
  @state() private _selSeries = -1;
  /** Selected manual option, per panel — the same split as _selSeries/_selExtSeries. */
  @state() private _selOption = -1;
  @state() private _selBgRule = -1;
  /** Selected canvas background rule — the canvas twin of _selBgRule (#103). */
  @state() private _selCanvasBgRule = -1;

  // ── Image picker modal (#101) ──
  // One entry of backgrounds.json: the filename a config stores, plus the
  // label the picker shows for it.
  /** Set while the picker is open; receives the chosen path. */
  @state() private _pickerTarget?: (path: string) => void;
  @state() private _pickerLib: LibImage[] = [];
  @state() private _pickerFolder?: Record<string, unknown>;
  @state() private _pickerTrail: { id: string; title: string }[] = [];
  @state() private _pickerErr = '';
  @state() private _selExtOption = -1;
  // Separate from _selSeries (#56): the Mosaic and Popover field editors each
  // have their own graph-series list, and one shared index cross-highlighted a
  // row in whichever list wasn't being edited.
  @state() private _selExtSeries = -1;
  @state() private _selVirtual = -1;
  @state() private _selVirtualInput = -1;
  @state() private _selTrigger = -1;
  @state() private _selZone = -1;
  @state() private _selExtCard = 0;
  @state() private _selExtField = -1;
  @state() private _templateName = '';
  @state() private _templateIncludeEntities = false;
  @state() private _templateError = '';
  @state() private _previewBoxes: Record<string, CardBox> = {};

  @state() private _previewExpanded = false;
  @state() private _barAtTop: boolean = localStorage.getItem('mc-expanded-bar-top') === '1';

  /** Previous-render values behind the edge-triggered focus moves in `updated()`
   *  (#125). Plain fields, not `@state` — they are written during `updated()`
   *  and must not schedule a further render. */
  private _wasPreviewExpanded = false;
  private _wasShowAddFlowInput = false;

  private _previewRO?: ResizeObserver;
  private _onWindowResize = (): void => this._sizeExpandedCanvas();
  private _pickerStyleScheduled = false;
  private _pickerStyleRetries = 0;
  /** Pickers whose inner Material row is already styled. Finding that row is a
   *  nested shadow-root walk — the expensive half of styling — so a picker that
   *  has been done once is never walked again (#104). */
  private _styledPickers = new WeakSet<Element>();
  /** --mccust_* names currently written to the host, so renames/deletes clean up. */
  private _mccustApplied: string[] = [];
  @state() private _copiedFields: FieldConfig[] | null = null;
  // Copy-source markers are keyed by stable id, not list index (#56). As
  // indices they pointed at whatever slid into the slot after a remove,
  // reorder or duplicate — putting the "Copied" badge on the wrong row and
  // hiding the paste button on an unrelated one. Ids simply stop resolving
  // when the source is gone, which is the behaviour we want anyway.
  @state() private _copySourceId: string | null = null;
  @state() private _virtualClipboard: VirtualConfig | null = null;
  @state() private _copiedField: FieldConfig | null = null;
  @state() private _copiedFieldSrc: { isExt: boolean; cardId: string; fieldId: string } | null = null;
  @state() private _copiedOption: ControlOption | null = null;
  @state() private _dragSrc: string | null = null;
  @state() private _cpOpenId: string | null = null;
  /** Fixed-position coordinates for the open colour popup, taken from the
   *  swatch rect at open time. Fixed rather than absolute so the popup escapes
   *  .ec-panel-body's scroll clip — the clipped part of an absolute popup is
   *  unclickable, and clicks there fell through to the backdrop and closed the
   *  picker (#107). `top` opens below the swatch row, `bottom` above it. */
  @state() private _cpPos: { left: number; top?: number; bottom?: number } | null = null;
  /** The value the open colour picker had when it opened, so Escape can put it back. */
  private _cpOrigValue: string | undefined;
  /** Which open picker has already been given focus, so updated() only takes it once. */
  private _cpFocusedId: string | null = null;

  // Element Library unified picker
  @state() private _ggOpen = false;
  private _ggTarget: { ci: number; fi: number; isExtended?: boolean } | null = null;

  // wizard
  @state() private _wizStep = -1;
  @state() private _wiz = {
    cardType: '' as 'energy' | 'general' | '',
    // energy branch
    source: 'auto' as 'auto' | 'day' | 'none',
    sunEntity: 'sun.sun',
    dayImg: '',
    nightImg: '',
    evCount: 0,
    evImgs: [] as Array<{ day: string; night: string }>,
    // general branch
    bgCount: 'single' as 'none' | 'single' | 'multiple' | 'state',
    bgSwitchMode: 'sun' as 'sun' | 'entity',
    bgEntity: '',
    singleImg: '',
    // state branch (#103) — the same value/image pairs the Background screen edits
    bgStateEntity: '',
    bgRules: [] as Array<{ value: string; url: string }>,
  };
  private _wizardShown = false;
  /** #75: gates `_assertOneOwnerInvariant` to once per editor instance. */
  private _oneOwnerChecked = false;


  // card drag state
  private _dragCard = -1;
  private _startX = 0;
  private _startY = 0;
  private _hostRect?: DOMRect;
  private _dragMembers: { idx: number; start: { x: number; y: number } }[] = [];
  private _embDragMembers: { idx: number; start: { x: number; y: number } }[] = [];

  // point drag state
  private _dragPoint = -1;
  private _pStartX = 0;
  private _pStartY = 0;
  private _pStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private _pRect?: DOMRect;
  private _snapAxis: 'x' | 'y' | null = null;
  private _snapAnchor: { card: string; side: 'top'|'right'|'bottom'|'left' } | null = null;

  // zone drag state
  private _dragZone = -1;
  private _zStartX = 0;
  private _zStartY = 0;
  private _zStartPos: { x: number; y: number } = { x: 0, y: 0 };
  private _zRect?: DOMRect;

  // zone resize state
  private _resizeZone = -1;
  private _resizeCorner: 'tl' | 'tr' | 'bl' | 'br' = 'br';
  private _zResizeStartBox: { x: number; y: number; w: number; h: number } = { x: 0, y: 0, w: 0, h: 0 };

  // background (canvas image) drag/resize state — moves/resizes the base image
  // rectangle inside a fixed total frame; freed space becomes canvas.extend.
  @state() private _bgSelected = false;
  private _bgMode: 'move' | 'tl' | 'tr' | 'bl' | 'br' | null = null;
  private _bgRect?: DOMRect;
  private _bgStartX = 0;
  private _bgStartY = 0;
  private _bgStart = { L: 0, T: 0, baseW: 0, baseH: 0, totalW: 0, totalH: 0 };

  // embedded card selection
  @state() private _selEmbCard = -1;

  // embedded card drag state
  private _dragEmbCard = -1;
  private _ecStartX = 0;
  private _ecStartY = 0;
  private _ecRect?: DOMRect;

  // embedded card editor modal — shared by the standalone Embedded External Card
  // panel and the 'embedded_card' field type in both Mosaic and Popover cards.
  @state() private _embEditorOpen = false;
  @state() private _embEditorYaml = '';
  @state() private _embEditorYamlError = '';
  @state() private _embNativeEditor: Element | null = null;
  private _embEditorTarget: EmbedTarget | null = null;
  private _embEditorConfig: Record<string, unknown> | null = null;

  // embedded card picker
  @state() private _embPickerOpen = false;
  @state() private _embPickerSearch = '';
  private _embPickerTarget: EmbedTarget | null = null;

  // control variant builder
  @state() private _variantOpen = '';        // `${type}:${id}` of the expanded variant row
  @state() private _variantError = '';
  @state() private _saveVariantFor = '';     // _idFor() key of the field showing the save form
  @state() private _saveVariantLabel = '';
  @state() private _variantImportError = '';

  // ribbon navigation: tab → item panel → arbitrary-depth section drill-down
  @state() private _navTab: 'cards' | 'elements' | 'settings' = 'cards';
  @state() private _navPanel: string = '';
  @state() private _navPath: { key: string; label: string; hint?: string }[] = [];

  private _navPush(key: string, label: string, hint?: string): void {
    this._navPath = [...this._navPath, { key, label, ...(hint ? { hint } : {}) }];
  }

  /**
   * Resolve an item crumb key (`card:<id>`, `flow:<id>`, `pt:<n>`, …) to an
   * index in `list`. The tail after the first colon is matched against item
   * ids first — every top-level entity (cards, popover cards, embedded cards,
   * flows, zones, virtuals, fields) carries a required `id`, so those crumbs
   * survive reorders. Sub-item lists without ids (points, series, inputs,
   * triggers) fall through to the tail as a positional index. -1 if neither
   * resolves, which every dispatcher already treats as a dead end. See #59.
   *
   * The positional fallback is deliberately NOT limited to the id-less lists:
   * a numeric tail that matches no id resolves positionally on any list, so
   * legacy/hand-written `card:2`-style keys keep working. That is a softening
   * of #59's "indices stop being addressing state entirely" — accepted as
   * compat, with the caveats that a positional key is not reorder-safe and
   * that an id which is itself a small integer string always wins over the
   * position it happens to look like.
   */
  private _crumbIndex(key: string, list: readonly unknown[] | undefined | null): number {
    if (!list) return -1;
    const tail = key.slice(key.indexOf(':') + 1);
    const byId = list.findIndex((it) => {
      const id = it && typeof it === 'object' ? (it as { id?: string | number }).id : undefined;
      return id !== undefined && String(id) === tail;
    });
    if (byId >= 0) return byId;
    const n = Number(tail);
    return Number.isInteger(n) && n >= 0 && n < list.length ? n : -1;
  }

  // Saved .ec-panel-body scrollTop per nav location, captured live via @scroll.
  // Not @state: scroll bookkeeping must never trigger a re-render.
  private _panelScroll = new Map<string, number>();
  private _lastScrollKey = '';
  private _lastScrollDepth = 0;

  private _navScrollKey(): string {
    return `${this._navTab}|${this._navPanel}|${this._navPath.map((p) => p.key).join('/')}`;
  }

  /** Shown where a crumb resolves to nothing — the item was deleted externally
   *  (e.g. in the YAML editor) or the section key is unknown. Replaces the old
   *  blank screen with an explanation and a way back. */
  private _navDeadEnd(msg = 'This item no longer exists — it may have been removed in the YAML editor.'): TemplateResult {
    return html`
      <ha-alert alert-type="warning">${msg}</ha-alert>
      <button class="ec-btn-add" style="margin-top:10px;" @click=${() => this._navBack()}>← Back</button>
    `;
  }

  // List filter, valid only for the nav location it was typed on — navigating
  // anywhere else implicitly clears it without touching every nav call site.
  @state() private _listFilter = '';
  private _listFilterKey = '';

  private _currentListFilter(): string {
    return this._listFilterKey === this._navScrollKey() ? this._listFilter.trim().toLowerCase() : '';
  }

  /** Search box shown above item lists once they grow past 7 entries. */
  private _listFilterBox(count: number): TemplateResult | typeof nothing {
    if (count <= 7 && !this._currentListFilter()) return nothing;
    return html`
      <input class="ec-input ec-list-filter" type="search" placeholder="Filter…"
        .value=${this._listFilterKey === this._navScrollKey() ? this._listFilter : ''}
        @input=${(e: Event) => {
          this._listFilterKey = this._navScrollKey();
          this._listFilter = (e.target as HTMLInputElement).value;
        }}
      />
    `;
  }

  /** Empty-state line that is itself the add button. */
  private _emptyAdd(msg: string, onAdd: () => void): TemplateResult {
    return html`<button class="ec-empty ec-empty-action" @click=${onAdd}>${msg}</button>`;
  }

  // ── LovelaceCardEditor ──────────────────────────────────────────────────────

  public setConfig(config: MosaicCanvasConfig): void {
    this._assertOneOwnerInvariant();
    // Migrate: ensure every field has column set (default 1), and that every
    // card and field carries an id. Hand-written YAML can omit ids, and a great
    // deal of editor state is now keyed on them (#56: the copy-source markers,
    // _idFor's intent flags, the nav crumbs) — with several ids undefined those
    // keys all compare equal to each other, so the "Copied" badge would appear
    // on every row at once. Backfill here rather than defending at each reader.
    // Backfilled ids must be DETERMINISTIC, not minted from _newId: this
    // migration deliberately doesn't _emit, so HA can hand the same id-less
    // YAML back on every setConfig. Random ids would make each pass produce a
    // structurally different config, which trips the undo guard below into a
    // spurious 'external' snapshot every time and resets everything keyed on
    // ids (copy markers, nav crumbs). Position-derived ids are stable for a
    // given config, and the `mc-auto-` prefix keeps them clear of user ids.
    let dirty = false;
    const fixFields = (fields: FieldConfig[], scope: string): FieldConfig[] => {
      let changed = false;
      const result = fields.map((f, fi) => {
        const patch: Partial<FieldConfig> = {};
        if (f.column == null) patch.column = 1;
        if (!f.id) patch.id = `mc-auto-${scope}f${fi}`;
        // Graph Data (#123): a per-series window belongs to the field now.
        // Idempotent, for the same reason the id backfill has to be.
        const graphPatch = graphDataMigration(f);
        if (graphPatch) Object.assign(patch, graphPatch);
        if (Object.keys(patch).length === 0) return f;
        dirty = true;
        changed = true;
        return { ...f, ...patch };
      });
      return changed ? result : fields;
    };
    const withId = <T extends { id?: string }>(item: T, autoId: string): T => {
      if (item.id) return item;
      dirty = true;
      return { ...item, id: autoId };
    };
    const cards = (config.cards ?? []).map((c0, i) => {
      const c = withId(c0, `mc-auto-card${i}`);
      const fields = fixFields(c.fields, `card${i}-`);
      return fields === c.fields ? c : { ...c, fields };
    });
    const extCards = (config.extended_cards ?? []).map((ec0, i) => {
      const ec = withId(ec0, `mc-auto-ext${i}`);
      const fields = fixFields(ec.fields, `ext${i}-`);
      return fields === ec.fields ? ec : { ...ec, fields };
    });
    if (dirty) {
      config = { ...config, cards, ...(config.extended_cards ? { extended_cards: extCards } : {}) };
    }
    // An externally-edited config (YAML editor beside the visual editor) is as
    // destructive as any internal mutation, so it gets an undo point too. Our
    // own config-changed echo arrives structurally identical to _config and
    // must not push a duplicate snapshot. The exact object we emitted is
    // recognised by identity; anything else falls back to the structural
    // guard, with the current config's JSON cached per emit so an echo costs
    // one serialisation instead of two on every keystroke (#104).
    if (this._config && config !== this._lastEmitted) {
      const current = this._config === this._lastEmitted
        ? (this._lastEmittedJson ??= JSON.stringify(this._config))
        : JSON.stringify(this._config);
      if (current !== JSON.stringify(config)) {
        // 'external' keys these pushes so a rapid YAML editing session
        // coalesces under the same time window as local typing.
        this._pushUndo(this._config, 'external');
      }
    }
    this._config = config;
    // Custom control variants travel in the card config, not the bundle.
    setUserVariants(config.defaults?.control_variants);
    this._truncateStaleNavPath();
    // No _emit here: the migrated config lives in editor state and persists with
    // the user's first real edit. Emitting on open marked the dashboard dirty
    // without any user action.
    if (!this._wizardShown) {
      this._wizardShown = true;
      // Every method counts, or a card configured by the single-image or state
      // method would be met by the setup wizard on every open (#103).
      const bg = config.background;
      const noImages = !bg?.images?.day && !bg?.images?.night && !bg?.url && !bg?.rules?.length;
      const noCards = (config.cards ?? []).length === 0;
      if (noImages && noCards) this._wizStep = 0;
    }
  }

  /**
   * Truncate _navPath at the first crumb that no longer resolves against the
   * current config, and re-point the paired selection indexes at the resolved
   * items. setConfig can hand in an externally-edited config (YAML editor
   * open beside the visual editor) while a panel is drilled in: a deleted
   * target used to render a blank body under an intact breadcrumb, and the
   * guards downstream assume crumbs are valid. Landing on the nearest
   * surviving ancestor is the recoverable behaviour. Crumbs address items by
   * id (#59), so an external reorder keeps the crumb — and, via the re-point
   * here, the _sel* highlight — on the same item; only positional (id-less)
   * sub-item crumbs still resolve to whatever sits at that index.
   */
  private _truncateStaleNavPath(): void {
    const cfg = this._config;
    if (!cfg) return;
    // Context indices accumulated from earlier crumbs in the walk. The 'card:'
    // and 'field:' prefixes are shared by the mosaic and popover panels, which
    // index different arrays — _navPanel disambiguates.
    const panel = this._navPanel;
    let ci = -1, fi = -1, vi = -1, fli = -1;
    // One spec per item-based crumb prefix: the list its crumbs resolve
    // against, and the paired selection re-point. The re-point must happen
    // here and not only in the panel dispatchers (which do the same on
    // render): the panels don't render at all while the expanded preview is
    // open, but the preview highlight still reads _sel*. Keeping list and
    // select in one entry keeps them in lockstep per prefix.
    const crumbSpecs: Record<string, { list: () => readonly unknown[]; select: (idx: number) => void }> = {
      card: {
        list: () => (panel === 'popover' ? this._extCards() : (cfg.cards ?? [])),
        select: (idx) => { ci = idx; if (panel === 'popover') this._selExtCard = idx; else this._selCard = idx; },
      },
      field: {
        list: () => (ci < 0 ? [] : (panel === 'popover' ? this._extCards()[ci]?.fields : cfg.cards?.[ci]?.fields) ?? []),
        select: (idx) => { fi = idx; if (panel === 'popover') this._selExtField = idx; else this._selField = idx; },
      },
      gs: {
        list: () => (ci >= 0 && fi >= 0 ? (cfg.cards?.[ci]?.fields[fi]?.graph_series ?? []) : []),
        select: (idx) => { this._selSeries = idx; },
      },
      egs: {
        list: () => (ci >= 0 && fi >= 0 ? (this._extCards()[ci]?.fields[fi]?.graph_series ?? []) : []),
        select: (idx) => { this._selExtSeries = idx; },
      },
      opt: {
        list: () => (ci >= 0 && fi >= 0 ? (cfg.cards?.[ci]?.fields[fi]?.options ?? []) : []),
        select: (idx) => { this._selOption = idx; },
      },
      eopt: {
        list: () => (ci >= 0 && fi >= 0 ? (this._extCards()[ci]?.fields[fi]?.options ?? []) : []),
        select: (idx) => { this._selExtOption = idx; },
      },
      bgr: {
        list: () => (ci >= 0 ? (cfg.cards?.[ci]?.bg?.rules ?? []) : []),
        select: (idx) => { this._selBgRule = idx; },
      },
      cbgr: {
        list: () => cfg.background?.rules ?? [],
        select: (idx) => { this._selCanvasBgRule = idx; },
      },
      emb:  { list: () => this._embCards(), select: (idx) => { this._selEmbCard = idx; } },
      virt: { list: () => this._virtuals(), select: (idx) => { vi = idx; this._selVirtual = idx; } },
      vin:  { list: () => (vi >= 0 ? (this._virtuals()[vi]?.inputs ?? []) : []), select: (idx) => { this._selVirtualInput = idx; } },
      trig: { list: () => (vi >= 0 ? (this._virtuals()[vi]?.triggers ?? []) : []), select: (idx) => { this._selTrigger = idx; } },
      zone: { list: () => this._zones(), select: (idx) => { this._selZone = idx; } },
      flow: { list: () => this._flows(), select: (idx) => { fli = idx; this._selFlow = idx; } },
      pt:   { list: () => (fli >= 0 ? (this._flows()[fli]?.points ?? []) : []), select: (idx) => { this._selPoint = idx; } },
    };
    let keep = this._navPath.length;
    for (let i = 0; i < this._navPath.length; i++) {
      const key = this._navPath[i].key;
      const colon = key.indexOf(':');
      const prefix = colon > 0 ? key.slice(0, colon) : key;
      const spec = crumbSpecs[prefix];
      if (!spec) continue; // sec:/fsec:/fscs: — not item-based
      const idx = this._crumbIndex(key, spec.list());
      if (idx < 0) { keep = i; break; }
      spec.select(idx);
    }
    if (keep < this._navPath.length) this._navPath = this._navPath.slice(0, keep);
    // Clamp any top-level selections not re-pointed by a surviving crumb, so
    // the preview highlight and quick panels can't act on removed items.
    const clamp = (v: number, len: number) => Math.min(v, len - 1);
    this._selCard = clamp(this._selCard, cfg.cards?.length ?? 0);
    this._selExtCard = clamp(this._selExtCard, this._extCards().length);
    this._selEmbCard = clamp(this._selEmbCard, this._embCards().length);
    this._selVirtual = clamp(this._selVirtual, this._virtuals().length);
    this._selZone = clamp(this._selZone, this._zones().length);
    this._selFlow = clamp(this._selFlow, this._flows().length);
  }

  /**
   * Single programmatic navigation entry point (#59): open a tab / panel /
   * crumb path directly. Item crumbs address by id (`card:<id>`), with a
   * positional-index fallback for the id-less sub-item lists — see
   * _crumbIndex. The path is validated exactly the way setConfig validates a
   * stale one: resolved crumb by crumb, truncated at the first that doesn't
   * resolve, with the paired _sel* indexes re-pointed during the walk — so a
   * deep link can never land on a screen bound to the wrong item. Labels are
   * optional; a missing one falls back to the key tail, and the breadcrumb
   * re-derives entity labels live at render anyway (_liveCrumbLabel). All
   * ad-hoc jumpers (_syncNavTo, _goToFlow) route through here so crumb
   * resolution lives in exactly one place.
   */
  public _navigateTo(
    tab: 'cards' | 'elements' | 'settings',
    panel: string,
    path: { key: string; label?: string; hint?: string }[] = [],
  ): void {
    this._navTab = tab;
    this._navPanel = panel;
    this._navPath = path.map((p) => ({
      key: p.key,
      label: p.label ?? p.key.slice(p.key.indexOf(':') + 1),
      ...(p.hint ? { hint: p.hint } : {}),
    }));
    // A deep link defines the complete navigation state: sub-item selections
    // whose crumb is absent from the path must not survive the jump — coming
    // from card A / field 3, a jump to card B would otherwise leave
    // _selField = 3 highlighting a field the path never named. The walk
    // below re-points any of these whose crumb IS present. This reset can't
    // live in _truncateStaleNavPath: setConfig calls it too, and list
    // screens legitimately hold a sub-item selection with no crumb for it
    // (_addField selects the new field without navigating). Top-level
    // selections are left alone — opening Settings has never cleared the
    // card highlight.
    this._selField = -1;
    this._selExtField = -1;
    this._selSeries = -1;
    this._selExtSeries = -1;
    this._selPoint = -1;
    this._selVirtualInput = -1;
    this._selTrigger = -1;
    this._truncateStaleNavPath();
  }

  // ── Config mutation helpers ─────────────────────────────────────────────────

  private _emit(config: MosaicCanvasConfig): void {
    const prev = this._config;
    if (prev && prev !== config && !this._restoring) this._pushUndo(prev);
    this._config = config;
    // Remember what went out so setConfig can recognise our own echo (#104).
    this._lastEmitted = config;
    this._lastEmittedJson = undefined;
    this.dispatchEvent(
      new CustomEvent('config-changed', { detail: { config }, bubbles: true, composed: true }),
    );
  }

  // ── Undo / redo (#60) ───────────────────────────────────────────────────────
  // Bounded stack of deep-cloned config snapshots, pushed in _emit — the single
  // choke point every mutation flows through. setConfig contributes external
  // (YAML-editor) edits too, guarded by structural equality so our own
  // config-changed echo can't create a phantom step.

  private _undoStack: MosaicCanvasConfig[] = [];
  private _redoStack: MosaicCanvasConfig[] = [];
  /** The exact object last handed out via config-changed, plus its lazily
   *  computed JSON — setConfig uses these to recognise our own echo without
   *  serialising the config twice per keystroke (#104). */
  private _lastEmitted?: MosaicCanvasConfig;
  private _lastEmittedJson?: string;
  /** Coalesce source of the last push: a per-gesture string key, 'external'
   *  for setConfig-delivered YAML edits, or the focused form control.
   *  Restores and pointerup reset it to break the chain. */
  private _undoSrc: string | Element | null = null;
  private _undoLastPush = 0;
  /** True while _emit is applying an undo/redo snapshot — that emit must not
   *  push onto the stack it is restoring from. */
  private _restoring = false;
  private static readonly _UNDO_LIMIT = 50;
  private static readonly _UNDO_COALESCE_MS = 1000;

  private _cloneCfg(c: MosaicCanvasConfig): MosaicCanvasConfig {
    // structuredClone beats a JSON round trip (no string intermediate) and
    // restores the config exactly as it was (#104). Every HA-supported browser
    // has it; the JSON fallback is belt-and-braces.
    return typeof structuredClone === 'function'
      ? structuredClone(c)
      : (JSON.parse(JSON.stringify(c)) as MosaicCanvasConfig);
  }

  /**
   * Identity of whatever is driving the current mutation, for coalescing.
   * An active canvas drag keys on the gesture itself (index + pointerdown
   * coords, unique per drag) so a whole move — including the grid snap on
   * pointerup, which emits while the drag state is still set — is one undo
   * step regardless of duration. Otherwise the focused form control: typing,
   * slider drags and held +/- steppers coalesce; plain buttons (delete, add,
   * paste) deliberately don't, so two quick deletes stay two undo steps.
   */
  private _undoEmitSource(): string | Element | null {
    if (this._dragCard >= 0) return `drag:card:${this._dragCard}:${this._startX},${this._startY}`;
    if (this._dragEmbCard >= 0) return `drag:emb:${this._dragEmbCard}:${this._ecStartX},${this._ecStartY}`;
    if (this._dragZone >= 0) return `drag:zone:${this._dragZone}:${this._zStartX},${this._zStartY}`;
    if (this._resizeZone >= 0) return `resize:zone:${this._resizeZone}:${this._resizeCorner}:${this._zResizeStartBox.x},${this._zResizeStartBox.y}`;
    if (this._dragPoint >= 0) return `drag:pt:${this._dragPoint}:${this._pStartX},${this._pStartY}`;
    if (this._bgMode) return `drag:bg:${this._bgMode}:${this._bgStartX},${this._bgStartY}`;
    const el = this.shadowRoot?.activeElement ?? null;
    if (!el) return null;
    if (el.tagName === 'BUTTON') return el.classList.contains('ec-num-step') ? el : null;
    return el;
  }

  /** Gesture keys coalesce for the gesture's whole lifetime (no time window
   *  — a mid-drag pause must not split the step); everything else — focused
   *  controls, 'external' — needs the window so a session ends on a pause. */
  private static _isGestureKey(src: string | Element | null): src is string {
    return typeof src === 'string' && (src.startsWith('drag:') || src.startsWith('resize:'));
  }

  /** Pointerup in the preview ends any canvas gesture: a later drag must
   *  never coalesce into it, even one starting at identical coords (which
   *  would reproduce the same string key). */
  private _endUndoGesture(): void {
    if (MosaicCanvasEditor._isGestureKey(this._undoSrc)) this._undoSrc = null;
  }

  private _pushUndo(prev: MosaicCanvasConfig, srcOverride?: string): void {
    // Any new mutation invalidates a pending "X removed — Undo" toast: its
    // button runs plain _undo(), which after this push would revert the new
    // edit, not the delete the label promises.
    this._toastMsg = '';
    const now = Date.now();
    const src = srcOverride ?? this._undoEmitSource();
    const coalesce = src !== null && src === this._undoSrc
      && (MosaicCanvasEditor._isGestureKey(src) || now - this._undoLastPush < MosaicCanvasEditor._UNDO_COALESCE_MS);
    this._undoSrc = src;
    this._undoLastPush = now;
    if (!coalesce) {
      this._undoStack.push(this._cloneCfg(prev));
      if (this._undoStack.length > MosaicCanvasEditor._UNDO_LIMIT) this._undoStack.shift();
    }
    this._redoStack = [];
  }

  private _undo(): void { this._restore(this._undoStack, this._redoStack); }
  private _redo(): void { this._restore(this._redoStack, this._undoStack); }

  /** Undo and redo are the same move with the stacks swapped: pop `from`,
   *  save the live config onto `to`, apply the popped snapshot. */
  private _restore(from: MosaicCanvasConfig[], to: MosaicCanvasConfig[]): void {
    const cfg = this._config;
    if (!from.length || !cfg) return;
    const snap = from.pop()!;
    to.push(this._cloneCfg(cfg));
    if (to.length > MosaicCanvasEditor._UNDO_LIMIT) to.shift();
    this._applySnapshot(snap);
  }

  private _applySnapshot(snap: MosaicCanvasConfig): void {
    this._restoring = true;
    try {
      this._emit(snap);
    } finally {
      this._restoring = false;
    }
    this._undoSrc = null;
    this._toastMsg = '';
    // The restored config can invalidate the current drill-down exactly like
    // an external edit; the same walk recovers nav and selection state.
    this._truncateStaleNavPath();
  }

  private _onUndoKeydown = (e: KeyboardEvent): void => {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
    const k = e.key.toLowerCase();
    const isUndo = k === 'z' && !e.shiftKey;
    const isRedo = k === 'y' || (k === 'z' && e.shiftKey);
    if (!isUndo && !isRedo) return;
    // Leave native text undo alone while a text-entry control is focused —
    // anywhere on the page, including the HA YAML pane (CodeMirror is
    // contenteditable), which this window-level listener would otherwise
    // hijack.
    const origin = e.composedPath()[0];
    if (origin instanceof HTMLElement) {
      const tag = origin.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || origin.isContentEditable) return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (isUndo) this._undo(); else this._redo();
  };

  // Undo toast — HA-style snackbar after destructive actions ("Card removed —
  // Undo"), wired to the same stack so recoverability is discoverable without
  // modal confirms.
  @state() private _toastMsg = '';
  private _toastTimer?: number;

  private _showUndoToast(msg: string): void {
    this._toastMsg = msg;
    clearTimeout(this._toastTimer);
    this._toastTimer = window.setTimeout(() => { this._toastMsg = ''; }, 6000);
  }

  private _renderUndoToast(): TemplateResult | typeof nothing {
    if (!this._toastMsg) return nothing;
    return html`
      <div class="ec-undo-toast" role="status">
        <span>${this._toastMsg}</span>
        <button class="ec-undo-toast-btn" ?disabled=${!this._undoStack.length} @click=${() => this._undo()}>Undo</button>
      </div>
    `;
  }

  // ── Onboarding wizard ───────────────────────────────────────────────────────

  private _finishWizard(): void {
    if (!this._config) return;
    const w = this._wiz;
    let bg: BackgroundConfig | undefined;

    if (w.cardType === 'energy') {
      if (w.source !== 'none') {
        bg = { source: w.source as 'auto' | 'day' };
        if (w.source === 'auto') bg.sun_entity = w.sunEntity || 'sun.sun';
        const day: Record<string, string> = {};
        const night: Record<string, string> = {};
        if (w.dayImg) day['0'] = w.dayImg;
        if (w.nightImg && w.source === 'auto') night['0'] = w.nightImg;
        for (let i = 0; i < w.evCount; i++) {
          const ev = w.evImgs[i];
          if (ev?.day) day[String(i + 1)] = ev.day;
          if (ev?.night && w.source === 'auto') night[String(i + 1)] = ev.night;
        }
        bg.images = {};
        if (Object.keys(day).length > 0) bg.images.day = day;
        if (Object.keys(night).length > 0) bg.images.night = night;
      }
    } else {
      if (w.bgCount === 'single' && w.singleImg) {
        // The single-image method, not a day/night config forced to day (#103).
        bg = { source: 'single', url: w.singleImg };
      } else if (w.bgCount === 'state') {
        const rules = w.bgRules
          .filter((r) => r.value.trim() && r.url.trim())
          .map((r) => ({ value: r.value.trim(), url: r.url.trim() }));
        bg = { source: 'state', entity: w.bgStateEntity || undefined };
        if (rules.length) bg.rules = rules;
      } else if (w.bgCount === 'multiple') {
        bg = w.bgSwitchMode === 'sun'
          ? { source: 'auto', sun_entity: w.sunEntity || 'sun.sun' }
          : { source: 'entity', mode_entity: w.bgEntity };
        const day: Record<string, string> = {};
        const night: Record<string, string> = {};
        if (w.dayImg) day['0'] = w.dayImg;
        if (w.nightImg) night['0'] = w.nightImg;
        bg.images = {};
        if (Object.keys(day).length > 0) bg.images.day = day;
        if (Object.keys(night).length > 0) bg.images.night = night;
      }
    }

    const newConfig: MosaicCanvasConfig = { ...this._config };
    if (bg) newConfig.background = bg;
    if (w.cardType === 'energy' && w.evCount > 0) newConfig.ev_count = w.evCount;
    this._wizStep = -1;
    this._emit(newConfig);
    this._tutorialGo(0);
  }

  // ── Post-setup tutorial (#78) ───────────────────────────────────────────────
  // A short guided tour offered when the wizard closes. Each step is one modal
  // plus a _navigateTo() jump, so the screen being described is on show while
  // the modal explains it.

  @state() private _tutorialStep = -1;

  private static readonly _TUTORIAL_STEPS: {
    title: string;
    body: string;
    nav: { tab: 'cards' | 'elements' | 'settings'; panel: string; path?: { key: string; label?: string }[] };
  }[] = [
    { title: 'Take a quick tour?',
      body: 'Your card is set up. This short tour points out where everything lives — each step jumps the editor to the place it describes. Cancel any time.',
      nav: { tab: 'cards', panel: '' } },
    { title: 'The Cards tab',
      body: 'Everything that displays data: Mosaic Cards (your own layouts of values, labels and library elements), Popover Cards shown on a trigger action, and Embedded External Cards for placing any native or custom HA card on the canvas.',
      nav: { tab: 'cards', panel: '' } },
    { title: 'The Elements tab',
      body: 'Things that live on the canvas around your cards: Animated Flow Lines driven by entity values, Clickable Zones for bounded tap actions, and Virtual Entities — helper-like values computed from other entities.',
      nav: { tab: 'elements', panel: '' } },
    { title: 'The Settings tab',
      body: 'Card-wide configuration: the Canvas itself, Global Defaults inherited by every element, Templates for saving and loading whole layouts, and Config Health for finding broken references.',
      nav: { tab: 'settings', panel: '' } },
    { title: 'Canvas defaults',
      body: 'The Canvas panel holds the background images, day/night switching, aspect ratio and placement mode. The background you chose during setup can be changed here at any time.',
      nav: { tab: 'settings', panel: 'canvas' } },
    { title: 'Card Defaults',
      body: 'Global Defaults ▸ Mosaic Card Defaults is the styling every Mosaic Card inherits — box style, text colour and popup behaviour. Set the look once here rather than per card; individual cards only need overrides. Popover cards have their own screen beside it and do not inherit this one.',
      nav: { tab: 'settings', panel: 'defaults', path: [{ key: 'sec:card', label: 'Mosaic Card Defaults' }] } },
    { title: 'Your first Mosaic Card',
      body: 'This is the Mosaic Card list. Press “+ Mosaic Card” to create one, open it, then press “+ Field”, set the field’s Type to Value and pick an entity — that puts a live value on the canvas.',
      nav: { tab: 'cards', panel: 'mosaic' } },
    { title: 'The Mosaic Editor',
      body: '“Open Mosaic Editor Window” (above the tabs) opens the fullscreen drag editor — position cards, zones and flow points directly on your background. Double-click any element there to jump straight to its settings.',
      nav: { tab: 'cards', panel: '' } },
  ];

  /** Enter tutorial step `step`, navigating the editor to the screen it describes.
   *  Out-of-range steps end the tour. */
  private _tutorialGo(step: number): void {
    const steps = MosaicCanvasEditor._TUTORIAL_STEPS;
    if (step < 0 || step >= steps.length) { this._tutorialStep = -1; return; }
    const nav = steps[step].nav;
    this._navigateTo(nav.tab, nav.panel, nav.path ?? []);
    this._tutorialStep = step;
  }

  private _renderTutorial(): TemplateResult | typeof nothing {
    const steps = MosaicCanvasEditor._TUTORIAL_STEPS;
    const s = this._tutorialStep;
    if (s < 0 || s >= steps.length) return nothing;
    const last = s === steps.length - 1;
    return html`
      <div class="ec-tour" role="dialog" aria-label="Editor tour">
        <div class="ec-tour-head">
          <span class="ec-tour-title">${steps[s].title}</span>
          <span class="ec-tour-count">${s + 1} / ${steps.length}</span>
        </div>
        <p class="ec-tour-body">${steps[s].body}</p>
        <div class="ec-tour-btns">
          <button class="ec-wiz-btn-ghost" @click=${() => { this._tutorialStep = -1; }}>Cancel</button>
          <span class="ec-tour-spacer"></span>
          ${s > 0 ? html`<button class="ec-wiz-btn-ghost" @click=${() => this._tutorialGo(s - 1)}>← Back</button>` : nothing}
          <button class="ec-wiz-btn-primary" @click=${() => (last ? (this._tutorialStep = -1) : this._tutorialGo(s + 1))}>
            ${last ? 'Done' : 'Next →'}
          </button>
        </div>
      </div>
    `;
  }

  private _renderWizard(): TemplateResult {
    const step = this._wizStep;
    const w = this._wiz;
    const setWiz = (patch: Partial<typeof this._wiz>) => { this._wiz = { ...w, ...patch }; };
    const go = (s: number) => { this._wizStep = s; };
    // The energy branch's image grid is indexed by EV count, but the wizard
    // state splits row 0 (dayImg/nightImg) from rows 1..n (evImgs). These two
    // hide that seam so the grid can be written as one loop.
    const wizImg = (mode: 'day' | 'night', i: number): string =>
      i === 0 ? (mode === 'day' ? w.dayImg : w.nightImg) : (w.evImgs[i - 1]?.[mode] ?? '');
    const setWizImg = (mode: 'day' | 'night', i: number, v: string): void => {
      if (i === 0) { setWiz(mode === 'day' ? { dayImg: v } : { nightImg: v }); return; }
      setWiz({ evImgs: w.evImgs.map((x, j) => (j === i - 1 ? { ...x, [mode]: v } : x)) });
    };
    const setEvCount = (e: Event): void => {
      const n = Math.max(0, Math.min(3, parseInt((e.target as HTMLInputElement).value) || 0));
      if (n === w.evCount) return;
      setWiz({ evCount: n, evImgs: Array.from({ length: n }, (_, i) => w.evImgs[i] ?? { day: '', night: '' }) });
    };

    return html`
      <div class="ec-wizard">
        ${step === 0 ? html`
          <div class="ec-wiz-welcome">
            <div class="ec-wiz-icon">🎨</div>
            <h2 class="ec-wiz-title">Welcome to Mosaic Canvas Card</h2>
            <p class="ec-wiz-desc">A few quick questions will tailor the setup to your use case — or skip to jump straight into the editor.</p>
            <div class="ec-wiz-row ec-wiz-end">
              <button class="ec-wiz-btn-ghost" @click=${() => this._finishWizard()}>Skip setup</button>
              <button class="ec-wiz-btn-primary" @click=${() => go(1)}>Get started →</button>
            </div>
          </div>

        ` : step === 1 ? html`
          <h3 class="ec-wiz-heading">What will this card be used for?</h3>
          <p class="ec-wiz-desc">This determines what setup options you'll be asked about.</p>
          <div class="ec-wiz-type-grid">
            <button class="ec-wiz-type-btn${w.cardType === 'energy' ? ' selected' : ''}"
              @click=${() => setWiz({ cardType: 'energy' })}>
              <span class="ec-wiz-type-icon">⚡</span>
              <span class="ec-wiz-type-title">Energy Dashboard</span>
              <span class="ec-wiz-type-desc">Solar, battery, grid flows with day/night switching and EV variants</span>
            </button>
            <button class="ec-wiz-type-btn${w.cardType === 'general' ? ' selected' : ''}"
              @click=${() => setWiz({ cardType: 'general' })}>
              <span class="ec-wiz-type-icon">🗺️</span>
              <span class="ec-wiz-type-title">General Purpose</span>
              <span class="ec-wiz-type-desc">Any layout over a background image — floor plan, status board, custom display</span>
            </button>
          </div>
          <div class="ec-wiz-row ec-wiz-space">
            <button class="ec-wiz-btn-ghost" @click=${() => go(0)}>← Back</button>
            <button class="ec-wiz-btn-primary" ?disabled=${!w.cardType}
              @click=${() => go(w.cardType === 'energy' ? 2 : 20)}>Next →</button>
          </div>

        ` : step === 2 ? html`
          <h3 class="ec-wiz-heading">Background</h3>
          <div class="ec-wiz-field">
            <label class="ec-wiz-label">Day/night switching</label>
            <select class="ec-wiz-select" .value=${w.source}
              @change=${(e: Event) => setWiz({ source: (e.target as HTMLSelectElement).value as 'auto' | 'day' | 'none' })}>
              <option value="auto">Auto — follows sun entity</option>
              <option value="day">Day only — no switching</option>
              <option value="none">No background image</option>
            </select>
          </div>
          ${w.source === 'auto' ? html`
            <div class="ec-wiz-field">
              <label class="ec-wiz-label">Sun entity</label>
              <ha-entity-picker .hass=${this.hass} .value=${w.sunEntity} allow-custom-entity
                @value-changed=${(e: CustomEvent) => setWiz({ sunEntity: (e as CustomEvent<{ value: string }>).detail.value })}
              ></ha-entity-picker>
            </div>
          ` : nothing}
          ${w.source === 'none' ? nothing : html`
            <div class="ec-wiz-field">
              <label class="ec-wiz-label">EV count (0 = no EV variants)</label>
              ${/* The shared stepper chrome, with this field's own contract kept
                    inside it (clamped 0–3, '' → 0, and it resizes evImgs) — the
                    case _numInput's own doc points at _numWrap for. Both events
                    are bound: typing updates the rows live, and the steppers
                    fire 'change'. */
                this._numWrap(html`<input class="ec-input ec-input-num" type="number" min="0" max="3"
                  .value=${String(w.evCount)}
                  @input=${setEvCount} @change=${setEvCount}
                />`)}
            </div>

            <h3 class="ec-wiz-heading">Images</h3>
            <p class="ec-wiz-desc">One Day${w.source === 'auto' ? ' and one Night' : ''} image per EV variant — raising EV count adds rows.</p>

            ${/* The same grid the Canvas ▸ Background screen shows, so setup and
                  the editor read identically. Row 0 is the wizard's dayImg /
                  nightImg; rows 1..n are evImgs[i-1]. */
              (['day', 'night'] as const)
                .filter((mode) => mode === 'day' || w.source === 'auto')
                .map((mode) => html`
                  <div class="ec-wiz-ev-label">${mode}</div>
                  ${Array.from({ length: w.evCount + 1 }, (_, i) => html`
                    <div class="ec-wiz-field">
                      <label class="ec-wiz-label">${mode} / ${i} EV</label>
                      <div style="display:flex;gap:4px;align-items:center;">
                        <input class="ec-wiz-input" type="text" style="flex:1;min-width:0;"
                          .placeholder=${`/local/energy-${mode}${i ? `-${i}ev` : ''}.jpg`}
                          .value=${wizImg(mode, i)}
                          @input=${(e: Event) => setWizImg(mode, i, (e.target as HTMLInputElement).value)}/>
                        ${this._imagePickBtn((path) => setWizImg(mode, i, path))}
                      </div>
                    </div>
                  `)}
                `)}
          `}
          <div class="ec-wiz-row ec-wiz-space">
            <button class="ec-wiz-btn-ghost" @click=${() => go(1)}>← Back</button>
            <button class="ec-wiz-btn-primary" @click=${() => this._finishWizard()}>Finish &amp; open editor</button>
          </div>

        ` : step === 20 ? html`
          <h3 class="ec-wiz-heading">Background images</h3>
          <p class="ec-wiz-desc">Do you want a background image on this card?</p>
          <div class="ec-wiz-type-grid">
            <button class="ec-wiz-type-btn${w.bgCount === 'none' ? ' selected' : ''}"
              @click=${() => setWiz({ bgCount: 'none' })}>
              <span class="ec-wiz-type-icon">⬜</span>
              <span class="ec-wiz-type-title">No background</span>
              <span class="ec-wiz-type-desc">Cards float over a plain or transparent background</span>
            </button>
            <button class="ec-wiz-type-btn${w.bgCount === 'single' ? ' selected' : ''}"
              @click=${() => setWiz({ bgCount: 'single' })}>
              <span class="ec-wiz-type-icon">🖼️</span>
              <span class="ec-wiz-type-title">One image</span>
              <span class="ec-wiz-type-desc">A single static background image</span>
            </button>
            <button class="ec-wiz-type-btn${w.bgCount === 'multiple' ? ' selected' : ''}"
              @click=${() => setWiz({ bgCount: 'multiple' })}>
              <span class="ec-wiz-type-icon">🔄</span>
              <span class="ec-wiz-type-title">Day / Night</span>
              <span class="ec-wiz-type-desc">Two images, swapped by the sun or by an entity</span>
            </button>
            <button class="ec-wiz-type-btn${w.bgCount === 'state' ? ' selected' : ''}"
              @click=${() => setWiz({
                bgCount: 'state',
                bgRules: w.bgRules.length ? w.bgRules : [{ value: '', url: '' }],
              })}>
              <span class="ec-wiz-type-icon">🎛️</span>
              <span class="ec-wiz-type-title">Image by state</span>
              <span class="ec-wiz-type-desc">One image per state of an entity you choose</span>
            </button>
          </div>
          <div class="ec-wiz-row ec-wiz-space">
            <button class="ec-wiz-btn-ghost" @click=${() => go(1)}>← Back</button>
            <button class="ec-wiz-btn-primary"
              @click=${() => {
                if (w.bgCount === 'none') this._finishWizard();
                else if (w.bgCount === 'single') go(21);
                else if (w.bgCount === 'state') go(23);
                else go(22);
              }}>Next →</button>
          </div>

        ` : step === 21 ? html`
          <h3 class="ec-wiz-heading">Background image</h3>
          <div class="ec-wiz-field">
            <label class="ec-wiz-label">Image URL</label>
            <div style="display:flex;gap:4px;align-items:center;">
              <input class="ec-wiz-input" type="text" placeholder="/local/my-background.jpg" style="flex:1;min-width:0;"
                .value=${w.singleImg} @input=${(e: Event) => setWiz({ singleImg: (e.target as HTMLInputElement).value })}/>
              ${this._imagePickBtn((path) => setWiz({ singleImg: path }))}
            </div>
          </div>
          <div class="ec-wiz-row ec-wiz-space">
            <button class="ec-wiz-btn-ghost" @click=${() => go(20)}>← Back</button>
            <button class="ec-wiz-btn-primary" @click=${() => this._finishWizard()}>Finish &amp; open editor</button>
          </div>

        ` : step === 22 ? html`
          <h3 class="ec-wiz-heading">Multiple backgrounds</h3>
          <div class="ec-wiz-field">
            <label class="ec-wiz-label">When should the image change?</label>
            <select class="ec-wiz-select" .value=${w.bgSwitchMode}
              @change=${(e: Event) => setWiz({ bgSwitchMode: (e.target as HTMLSelectElement).value as 'sun' | 'entity' })}>
              <option value="sun">Time of day — follows the sun (day/night)</option>
              <option value="entity">Entity state — switches when an entity changes</option>
            </select>
          </div>
          ${w.bgSwitchMode === 'sun' ? html`
            <div class="ec-wiz-field">
              <label class="ec-wiz-label">Sun entity</label>
              <ha-entity-picker .hass=${this.hass} .value=${w.sunEntity} allow-custom-entity
                @value-changed=${(e: CustomEvent) => setWiz({ sunEntity: (e as CustomEvent<{ value: string }>).detail.value })}
              ></ha-entity-picker>
            </div>
          ` : html`
            <div class="ec-wiz-field">
              <label class="ec-wiz-label">Trigger entity</label>
              <ha-entity-picker .hass=${this.hass} .value=${w.bgEntity} allow-custom-entity
                @value-changed=${(e: CustomEvent) => setWiz({ bgEntity: (e as CustomEvent<{ value: string }>).detail.value })}
              ></ha-entity-picker>
            </div>
            <p class="ec-wiz-desc" style="font-size:11px;margin-top:-4px;">Alternate image shows when entity state is "on", "night", or "true".</p>
          `}
          <div class="ec-wiz-field">
            <label class="ec-wiz-label">${w.bgSwitchMode === 'sun' ? 'Day' : 'Main'} image URL</label>
            <input class="ec-wiz-input" type="text" placeholder="/local/background-main.jpg"
              .value=${w.dayImg} @input=${(e: Event) => setWiz({ dayImg: (e.target as HTMLInputElement).value })}/>
          </div>
          <div class="ec-wiz-field">
            <label class="ec-wiz-label">${w.bgSwitchMode === 'sun' ? 'Night' : 'Alternate'} image URL</label>
            <input class="ec-wiz-input" type="text" placeholder="/local/background-alt.jpg"
              .value=${w.nightImg} @input=${(e: Event) => setWiz({ nightImg: (e.target as HTMLInputElement).value })}/>
          </div>
          <div class="ec-wiz-row ec-wiz-space">
            <button class="ec-wiz-btn-ghost" @click=${() => go(20)}>← Back</button>
            <button class="ec-wiz-btn-primary" @click=${() => this._finishWizard()}>Finish &amp; open editor</button>
          </div>

        ` : step === 23 ? html`
          <h3 class="ec-wiz-heading">Image by state</h3>
          <p class="ec-wiz-desc">Pick the entity that decides the background, then pair each state you care about with an image. A state with no rule shows no background.</p>
          <div class="ec-wiz-field">
            <label class="ec-wiz-label">Entity</label>
            <ha-entity-picker .hass=${this.hass} .value=${w.bgStateEntity} allow-custom-entity
              @value-changed=${(e: CustomEvent) => setWiz({ bgStateEntity: (e as CustomEvent<{ value: string }>).detail.value })}
            ></ha-entity-picker>
          </div>
          ${w.bgRules.map((r, i) => html`
            <div class="ec-wiz-field">
              <label class="ec-wiz-label">When the state is…</label>
              <input class="ec-wiz-input" type="text" placeholder="e.g. on, 21, heat"
                .value=${r.value}
                @input=${(e: Event) => setWiz({
                  bgRules: w.bgRules.map((x, j) => j === i ? { ...x, value: (e.target as HTMLInputElement).value } : x),
                })}/>
              <div style="display:flex;gap:4px;align-items:center;margin-top:4px;">
                <input class="ec-wiz-input" type="text" placeholder="/local/my-background.jpg" style="flex:1;min-width:0;"
                  .value=${r.url}
                  @input=${(e: Event) => setWiz({
                    bgRules: w.bgRules.map((x, j) => j === i ? { ...x, url: (e.target as HTMLInputElement).value } : x),
                  })}/>
                ${this._imagePickBtn((path) => setWiz({
                  bgRules: w.bgRules.map((x, j) => j === i ? { ...x, url: path } : x),
                }))}
                <button class="ec-btn-remove" title="Remove"
                  @click=${() => setWiz({ bgRules: w.bgRules.filter((_, j) => j !== i) })}>✕</button>
              </div>
            </div>
          `)}
          <button class="ec-btn-add" @click=${() => setWiz({ bgRules: [...w.bgRules, { value: '', url: '' }] })}>+ Image</button>
          <div class="ec-wiz-row ec-wiz-space">
            <button class="ec-wiz-btn-ghost" @click=${() => go(20)}>← Back</button>
            <button class="ec-wiz-btn-primary" @click=${() => this._finishWizard()}>Finish &amp; open editor</button>
          </div>

        ` : nothing}
        ${/* The wizard short-circuits render(), so the picker modal has to be
              mounted here too or the Image path buttons above do nothing. */
          this._renderImagePickerModal()}
      </div>
    `;
  }

  private _updateCard(i: number, patch: Partial<CardConfig>): void {
    if (!this._config) return;
    const cards = this._config.cards.map((c, idx) => idx === i ? mergePatch(c, patch) : c);
    this._emit({ ...this._config, cards });
  }

  private _updateCardBox(i: number, patch: Partial<BoxStyle>): void {
    if (!this._config) return;
    const card = this._config.cards[i];
    if (!card) return;
    // mergePatch on the nested object, not a raw spread: the outer _updateCard
    // only sees the `box` key, so a cleared box property spread in as
    // `key: undefined` would survive as a phantom own-property inside it (#58).
    this._updateCard(i, { box: mergePatch(card.box ?? {}, patch) });
  }

  private _updateField(ci: number, fi: number, patch: Partial<FieldConfig>): void {
    if (!this._config) return;
    const card = this._config.cards[ci];
    if (!card) return;
    const fields = card.fields.map((f, idx) =>
      idx === fi ? mergePatch(f, patch) : f,
    );
    this._updateCard(ci, { fields });
  }

  private _updateDefaults(patch: Partial<GlobalDefaults>): void {
    if (!this._config) return;
    this._emit({ ...this._config, defaults: mergePatch(this._config.defaults, patch) });
  }

  private _updateCanvas(patch: Partial<CanvasConfig>): void {
    if (!this._config) return;
    this._emit({ ...this._config, canvas: mergePatch(this._config.canvas, patch) });
  }

  /** Grid-mode geometry, or null when the canvas is in precision mode. */
  private _gridGeom(): { cols: number; rows: number; padding: number; cellW: number; cellH: number; totalW: number; totalH: number } | null {
    const cv = this._config?.canvas;
    if (cv?.layout_mode !== 'grid' || !cv.grid) return null;
    const { totalW, totalH } = computeCanvasDims(this._config);
    const cols = Math.max(1, cv.grid.columns || 1);
    const rows = Math.max(1, cv.grid.rows || 1);
    const padding = cv.grid.padding ?? 0;
    return { cols, rows, padding, cellW: totalW / cols, cellH: totalH / rows, totalW, totalH };
  }

  /** Switch canvas layout mode. Entering grid mode does a one-time re-layout, snapping
   *  every existing card to its nearest intersection and deriving a grid_span from its
   *  current width. Leaving grid mode keeps cards exactly where they are. */
  private _setLayoutMode(mode: 'precision' | 'grid'): void {
    if (!this._config) return;
    const cv = { ...(this._config.canvas ?? {}) };
    cv.layout_mode = mode;
    if (mode === 'grid') {
      if (!cv.grid) cv.grid = { columns: 10, rows: 15, padding: 0 };
      const cols = Math.max(1, cv.grid.columns), rows = Math.max(1, cv.grid.rows), padding = cv.grid.padding ?? 0;
      const { totalW } = computeCanvasDims(this._config);
      const cellW = totalW / cols;
      const cards = this._config.cards.map((c) => {
        const box = this._previewBoxes[c.id];
        const cx = box ? box.x + box.w / 2 : c.position.x;
        const cy = box ? box.y + box.h / 2 : c.position.y;
        const col = Math.min(cols, Math.max(0, Math.round(cx * cols)));
        const row = Math.min(rows, Math.max(0, Math.round(cy * rows)));
        const span = c.grid_span ?? Math.max(1, Math.min(cols, Math.round((box?.w ?? 0) * cols) || 1));
        const width = Math.max(8, span * cellW - padding);
        return { ...c, anchor: 'center' as Anchor, grid_span: span, width, position: { x: roundFrac(col / cols), y: roundFrac(row / rows) } };
      });
      // Embedded cards resize by column span the same way regular cards do.
      const embedded_cards = this._embCards().map((ec) => {
        const box = this._previewBoxes[ec.id];
        const cx = box ? box.x + box.w / 2 : ec.position.x;
        const cy = box ? box.y + box.h / 2 : ec.position.y;
        const col = Math.min(cols, Math.max(0, Math.round(cx * cols)));
        const row = Math.min(rows, Math.max(0, Math.round(cy * rows)));
        const span = ec.grid_span ?? Math.max(1, Math.min(cols, Math.round((box?.w ?? 0) * cols) || 1));
        const width = Math.max(8, span * cellW - padding);
        return { ...ec, anchor: 'center' as Anchor, grid_span: span, width, position: { x: roundFrac(col / cols), y: roundFrac(row / rows) } };
      });
      this._emit({ ...this._config, canvas: cv, cards, embedded_cards });
      // One _emit means one undo step, so the toast's Undo restores the whole
      // precision layout — not just the mode flag (#63).
      const n = cards.length + embedded_cards.length;
      if (n) this._showUndoToast(`${n} card${n === 1 ? '' : 's'} re-laid out for Grid`);
    } else {
      this._emit({ ...this._config, canvas: cv });
    }
  }

  /** Faint intersection dots for the grid-mode canvas overlay. Editor-only, not in the runtime view. */
  private _renderGridOverlay(): TemplateResult | typeof nothing {
    const geom = this._gridGeom();
    if (!geom) return nothing;
    const { cols, rows } = geom;
    const dots: TemplateResult[] = [];
    for (let c = 0; c <= cols; c++) {
      for (let r = 0; r <= rows; r++) {
        dots.push(html`<div class="ec-grid-dot" style="left:${(c / cols) * 100}%;top:${(r / rows) * 100}%;"></div>`);
      }
    }
    return html`<div class="ec-grid-overlay">${dots}</div>`;
  }

  /** Draggable/resizable overlay for the base image rectangle. Sits below the card
   *  overlays so cards stay clickable; drag the body to reposition, corners to resize
   *  (aspect-locked). Freed space on a side becomes canvas.extend on that side. */
  private _renderBgOverlay(): TemplateResult | typeof nothing {
    if (!this._config) return nothing;
    const d = computeCanvasDims(this._config);
    const xPct = (d.L / d.totalW) * 100;
    const yPct = (d.T / d.totalH) * 100;
    const wPct = (d.baseW / d.totalW) * 100;
    const hPct = (d.baseH / d.totalH) * 100;
    return html`
      <div class="ec-bg-ov${this._bgSelected ? ' selected' : ''}"
        style="left:${xPct}%;top:${yPct}%;width:${wPct}%;height:${hPct}%;"
        @pointerdown=${(e: PointerEvent) => this._onBgDown(e, 'move')}
        title="Background image — drag to move, corners to resize">
        ${this._bgSelected ? (['tl', 'tr', 'bl', 'br'] as const).map((corner) => html`
          <div class="ec-bg-resize ec-bg-resize-${corner}"
            @pointerdown=${(e: PointerEvent) => this._onBgDown(e, corner)}></div>`) : nothing}
      </div>`;
  }

  private _updateBackground(patch: Partial<BackgroundConfig>): void {
    if (!this._config) return;
    this._emit({ ...this._config, background: mergePatch(this._config.background, patch) });
  }

  private _flows(): FlowConfig[] {
    return this._config?.flows ?? [];
  }

  private _updateFlow(fi: number, patch: Partial<FlowConfig>): void {
    if (!this._config) return;
    const flows = this._flows().map((f, idx) => idx === fi ? mergePatch(f, patch) : f);
    this._emit({ ...this._config, flows });
  }

  private _addFlow(): void {
    if (!this._config) return;
    const newFlow: FlowConfig = {
      id: 'flow-' + Date.now().toString(36),
      name: 'Flow',
      style: 'dashes',
      points: [
        { x: 0.4, y: 0.5 },
        { x: 0.6, y: 0.5 },
      ],
    };
    const flows = [...this._flows(), newFlow];
    this._selFlow = flows.length - 1;
    this._selPoint = -1;
    this._emit({ ...this._config, flows });
  }

  private _addFlowFromExpanded(): void {
    if (!this._config) return;
    const name = this._newFlowName.trim() || 'Flow';
    const newFlow: FlowConfig = {
      id: 'flow-' + Date.now().toString(36),
      name,
      style: 'dashes',
      points: [{ x: 0.4, y: 0.5 }, { x: 0.6, y: 0.5 }],
    };
    const flows = [...this._flows(), newFlow];
    this._selFlow = flows.length - 1;
    this._pendingFlowIdx = flows.length - 1;
    this._selPoint = -1;
    this._showAddFlowInput = false;
    this._newFlowName = '';
    this._emit({ ...this._config, flows });
  }

  private _collapseExpanded(): void {
    if (this._pendingFlowIdx >= 0) {
      this._showFlowCompleteModal = true;
    } else {
      this._previewExpanded = false;
    }
  }

  private _goToFlow(): void {
    const idx = this._pendingFlowIdx;
    this._showFlowCompleteModal = false;
    this._previewExpanded = false;
    this._pendingFlowIdx = -1;
    const flow = this._flows()[idx];
    // The pending flow may have been deleted while the modal was up — a
    // dangling _selFlow would highlight the wrong row in the flows list.
    this._selFlow = flow ? idx : -1;
    this._navigateTo('elements', 'flows', flow ? [{ key: `flow:${flow.id}`, label: flow.name ?? flow.id }] : []);
  }

  private _removeFlow(fi: number): void {
    if (!this._config) return;
    const flows = this._flows().filter((_, idx) => idx !== fi);
    this._selFlow = Math.min(this._selFlow, Math.max(0, flows.length - 1));
    if (flows.length === 0) this._selFlow = -1;
    // _selFlow now points at a different flow — a stale _selPoint would feed
    // snap-target clicks and _onFlowLayerClick's insert-after index.
    this._selPoint = -1;
    this._emit({ ...this._config, flows });
    this._showUndoToast('Flow removed');
  }

  /** One-click Duplicate (#62): deep-clone the flow (points included), re-ID
   *  it, insert directly after the source and select it. */
  private _duplicateFlow(fi: number): void {
    if (!this._config) return;
    const src = this._flows()[fi];
    if (!src) return;
    const copy = MosaicCanvasEditor._deepClone(src);
    copy.id = MosaicCanvasEditor._newId('flow');
    if (copy.name) copy.name += ' copy';
    const flows = [...this._flows()];
    flows.splice(fi + 1, 0, copy);
    this._selFlow = fi + 1;
    this._selPoint = -1;
    this._emit({ ...this._config, flows });
  }

  private _updateFlowPoint(fi: number, pi: number, patch: Partial<FlowEndpoint>): void {
    if (!this._config) return;
    const flows = this._flows().map((f, idx) => {
      if (idx !== fi) return f;
      const points = f.points.map((p, pidx) =>
        pidx === pi ? mergePatch(p, patch) : p,
      );
      return { ...f, points };
    });
    this._emit({ ...this._config, flows });
  }

  private _setPointKind(fi: number, pi: number, kind: 'card' | 'free'): void {
    if (!this._config) return;
    const flows = this._flows();
    const flow = flows[fi];
    if (!flow) return;
    const point = flow.points[pi];
    if (!point) return;
    const { dx, dy } = point;
    let newPoint: FlowEndpoint;
    if (kind === 'card') {
      const firstCardId = this._config.cards[0]?.id ?? '';
      newPoint = { card: firstCardId, side: 'center' as FlowSide, ...(dx != null ? { dx } : {}), ...(dy != null ? { dy } : {}) };
    } else {
      // Keep the point where it currently sits: resolve the anchored base
      // (dx/dy excluded — they stay on the point and still apply afterwards).
      const base = resolveFlowPoint({ ...point, dx: undefined, dy: undefined }, this._config.cards, this._previewBoxes);
      newPoint = { x: roundFrac(base.x), y: roundFrac(base.y), ...(dx != null ? { dx } : {}), ...(dy != null ? { dy } : {}) };
    }
    const newFlows = flows.map((f, idx) => {
      if (idx !== fi) return f;
      const points = f.points.map((p, pidx) => pidx === pi ? newPoint : p);
      return { ...f, points };
    });
    this._emit({ ...this._config, flows: newFlows });
  }

  private _addFlowPoint(fi: number): void {
    if (!this._config) return;
    const flows = this._flows().map((f, idx) => {
      if (idx !== fi) return f;
      return { ...f, points: [...f.points, { x: 0, y: 0 }] };
    });
    this._emit({ ...this._config, flows });
  }

  private _onFlowLayerClick(e: MouseEvent): void {
    if (e.target !== e.currentTarget) return;
    if (!this._config) return;
    const flows = this._flows();
    const flow = flows[this._selFlow];
    if (!flow) return;
    const layer = e.currentTarget as HTMLElement;
    const x = roundFrac(e.offsetX / layer.clientWidth);
    const y = roundFrac(e.offsetY / layer.clientHeight);
    const points = [...flow.points];
    const insertAfter = this._selPoint >= 0 ? this._selPoint : points.length - 1;
    points.splice(insertAfter + 1, 0, { x, y });
    const newFlows = flows.map((f, i) => i === this._selFlow ? { ...f, points } : f);
    this._selPoint = insertAfter + 1;
    this._emit({ ...this._config, flows: newFlows });
  }

  private _removeFlowPoint(fi: number, pi: number): void {
    if (!this._config) return;
    const flows = this._flows().map((f, idx) => {
      if (idx !== fi) return f;
      const points = f.points.filter((_, pidx) => pidx !== pi);
      return { ...f, points };
    });
    if (fi === this._selFlow && this._selPoint >= 0) {
      const remaining = flows[fi]?.points.length ?? 0;
      this._selPoint = Math.min(this._selPoint > pi ? this._selPoint - 1 : this._selPoint, remaining - 1);
    }
    this._emit({ ...this._config, flows });
    this._showUndoToast('Point removed');
  }

  /** One-click Duplicate (#62) for a flow point — points carry no id. */
  private _duplicateFlowPoint(fi: number, pi: number): void {
    if (!this._config) return;
    const flow = this._flows()[fi];
    const pt = flow?.points[pi];
    if (!flow || !pt) return;
    const points = [...flow.points];
    points.splice(pi + 1, 0, MosaicCanvasEditor._deepClone(pt));
    if (fi === this._selFlow) this._selPoint = pi + 1;
    const flows = this._flows().map((f, idx) => idx === fi ? { ...f, points } : f);
    this._emit({ ...this._config, flows });
  }

  // ── Virtual entity helpers ──────────────────────────────────────────────────

  private _virtuals(): VirtualConfig[] {
    return this._config?.virtuals ?? [];
  }

  private _addVirtual(): void {
    if (!this._config) return;
    const id = `v${Date.now()}`;
    const v: VirtualConfig = { id, name: 'New virtual', op: 'add', inputs: [] };
    const virtuals = [...this._virtuals(), v];
    this._selVirtual = virtuals.length - 1;
    this._emit({ ...this._config, virtuals });
  }

  private _updateVirtual(vi: number, patch: Partial<VirtualConfig>): void {
    if (!this._config) return;
    const virtuals = this._virtuals().map((v, i) => i === vi ? mergePatch(v, patch) : v);
    this._emit({ ...this._config, virtuals });
  }

  private _removeVirtual(vi: number): void {
    if (!this._config) return;
    const virtuals = this._virtuals().filter((_, i) => i !== vi);
    this._selVirtual = Math.min(this._selVirtual, virtuals.length - 1);
    this._emit({ ...this._config, virtuals });
    this._showUndoToast('Virtual entity removed');
  }

  /** One-click Duplicate (#62): deep-clone the virtual (inputs and triggers
   *  included), re-ID it, insert directly after the source and select it. */
  private _duplicateVirtual(vi: number): void {
    if (!this._config) return;
    const src = this._virtuals()[vi];
    if (!src) return;
    const copy = MosaicCanvasEditor._deepClone(src);
    copy.id = MosaicCanvasEditor._newId('v');
    if (copy.name) copy.name += ' copy';
    const virtuals = [...this._virtuals()];
    virtuals.splice(vi + 1, 0, copy);
    this._selVirtual = vi + 1;
    this._emit({ ...this._config, virtuals });
  }

  private _addVirtualInput(vi: number): void {
    if (!this._config) return;
    const inputs = [...(this._virtuals()[vi]?.inputs ?? []), ''];
    this._updateVirtual(vi, { inputs });
  }

  private _updateVirtualInput(vi: number, idx: number, entityId: string): void {
    const inputs = [...(this._virtuals()[vi]?.inputs ?? [])];
    inputs[idx] = entityId;
    this._updateVirtual(vi, { inputs });
  }

  private _removeVirtualInput(vi: number, idx: number): void {
    const inputs = (this._virtuals()[vi]?.inputs ?? []).filter((_, i) => i !== idx);
    if (this._selVirtualInput >= 0) {
      this._selVirtualInput = Math.min(
        this._selVirtualInput > idx ? this._selVirtualInput - 1 : this._selVirtualInput,
        inputs.length - 1,
      );
    }
    this._updateVirtual(vi, { inputs });
    this._showUndoToast('Input removed');
  }

  /** One-click Duplicate (#62) for a virtual-input row — inputs are plain entity ids. */
  private _duplicateVirtualInput(vi: number, idx: number): void {
    const v = this._virtuals()[vi];
    if (!v || v.inputs[idx] === undefined) return;
    const inputs = [...v.inputs];
    inputs.splice(idx + 1, 0, v.inputs[idx]!);
    this._selVirtualInput = idx + 1;
    this._updateVirtual(vi, { inputs });
  }

  /** One-click Duplicate (#62) for a time-until trigger row. The list is capped
   *  at 2 triggers, so the caller only renders the button below the cap. */
  private _duplicateTrigger(vi: number, ti: number): void {
    const v = this._virtuals()[vi];
    const t = v?.triggers?.[ti];
    if (!v || !t) return;
    const copy = MosaicCanvasEditor._deepClone(t);
    if (copy.label) copy.label += ' copy';
    const triggers = [...(v.triggers ?? [])];
    triggers.splice(ti + 1, 0, copy);
    this._selTrigger = ti + 1;
    this._updateVirtual(vi, { triggers });
  }

  private _copyVirtual(vi: number): void {
    const v = this._virtuals()[vi];
    if (v) this._virtualClipboard = { ...v };
  }

  private _pasteVirtual(): void {
    if (!this._config || !this._virtualClipboard) return;
    const v: VirtualConfig = { ...this._virtualClipboard, id: `v${Date.now()}` };
    const virtuals = [...this._virtuals(), v];
    this._selVirtual = virtuals.length - 1;
    this._emit({ ...this._config, virtuals });
  }

  // ── Zone helpers ────────────────────────────────────────────────────────────

  private _zones(): ZoneConfig[] {
    return this._config?.zones ?? [];
  }

  private _addZone(): void {
    if (!this._config) return;
    const newZone: ZoneConfig = {
      id: 'zone-' + Date.now().toString(36),
      name: 'Zone',
      position: { x: 0.5, y: 0.5 },
      anchor: 'center',
      width: 120,
      height: 70,
    };
    const zones = [...this._zones(), newZone];
    this._selZone = zones.length - 1;
    this._emit({ ...this._config, zones });
  }

  private _updateZone(zi: number, patch: Partial<ZoneConfig>): void {
    if (!this._config) return;
    const zones = this._zones().map((z, i) => i === zi ? mergePatch(z, patch) : z);
    this._emit({ ...this._config, zones });
  }

  private _removeZone(zi: number): void {
    if (!this._config) return;
    const zones = this._zones().filter((_, i) => i !== zi);
    this._selZone = Math.min(this._selZone, zones.length - 1);
    if (zones.length === 0) this._selZone = -1;
    this._emit({ ...this._config, zones });
    this._showUndoToast('Zone removed');
  }

  /** One-click Duplicate (#62): deep-clone the zone, re-ID it, insert directly
   *  after the source and select it. */
  private _duplicateZone(zi: number): void {
    if (!this._config) return;
    const src = this._zones()[zi];
    if (!src) return;
    const copy = MosaicCanvasEditor._deepClone(src);
    copy.id = MosaicCanvasEditor._newId('zone');
    if (copy.name) copy.name += ' copy';
    const zones = [...this._zones()];
    zones.splice(zi + 1, 0, copy);
    this._selZone = zi + 1;
    this._emit({ ...this._config, zones });
  }

  private _onZoneDown(e: PointerEvent, zi: number): void {
    e.preventDefault();
    e.stopPropagation();
    this._bgSelected = false;
    this._selZone = zi;
    this._syncNavTo('elements', 'zones', [{ key: `zone:${this._zones()[zi]?.id ?? zi}`, label: this._zones()[zi]?.name ?? this._zones()[zi]?.id ?? `Zone ${zi + 1}` }]);
    this._dragZone = zi;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    this._zRect = (this.renderRoot.querySelector('.ec-canvas-area') as HTMLElement).getBoundingClientRect();
    this._zStartX = e.clientX;
    this._zStartY = e.clientY;
    this._zStartPos = { ...(this._zones()[zi]?.position ?? { x: 0, y: 0 }) };
  }

  private _onZoneMove(e: PointerEvent): void {
    if (this._dragZone < 0 || !this._zRect || !this._config) return;
    const x = roundFrac(this._zStartPos.x + (e.clientX - this._zStartX) / this._zRect.width);
    const y = roundFrac(this._zStartPos.y + (e.clientY - this._zStartY) / this._zRect.height);
    this._updateZone(this._dragZone, { position: { x, y } });
  }

  private _onZoneUp(e: PointerEvent): void {
    if (this._dragZone >= 0) (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    this._dragZone = -1;
  }

  /** Anchor-aware top-left box of a zone in design px (position fractions × canvas dims). */
  private _zoneBox(z: ZoneConfig): { x: number; y: number; w: number; h: number } {
    const [fx, fy] = ANCHOR_FRAC[(z.anchor ?? sd('anchor') ?? 'top-left') as Anchor];
    const { totalW, totalH } = computeCanvasDims(this._config);
    return {
      x: z.position.x * totalW - fx * z.width,
      y: z.position.y * totalH - fy * z.height,
      w: z.width,
      h: z.height,
    };
  }

  private _onZoneResizeDown(e: PointerEvent, zi: number, corner: 'tl' | 'tr' | 'bl' | 'br'): void {
    e.preventDefault();
    e.stopPropagation();
    const z = this._zones()[zi];
    if (!z) return;
    this._selZone = zi;
    this._resizeZone = zi;
    this._resizeCorner = corner;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    this._zRect = (this.renderRoot.querySelector('.ec-canvas-area') as HTMLElement).getBoundingClientRect();
    this._zStartX = e.clientX;
    this._zStartY = e.clientY;
    this._zResizeStartBox = this._zoneBox(z);
  }

  private _onZoneResizeMove(e: PointerEvent): void {
    if (this._resizeZone < 0 || !this._zRect || !this._config) return;
    const z = this._zones()[this._resizeZone];
    if (!z) return;
    const { totalW, totalH } = computeCanvasDims(this._config);
    const dx = (e.clientX - this._zStartX) / this._zRect.width * totalW;
    const dy = (e.clientY - this._zStartY) / this._zRect.height * totalH;
    const start = this._zResizeStartBox;
    const MIN = 10;

    // The corner opposite the one being dragged stays fixed; the dragged corner follows the pointer.
    const fixedX = this._resizeCorner.includes('l') ? start.x + start.w : start.x;
    const fixedY = this._resizeCorner.includes('t') ? start.y + start.h : start.y;
    const draggedX0 = this._resizeCorner.includes('l') ? start.x : start.x + start.w;
    const draggedY0 = this._resizeCorner.includes('t') ? start.y : start.y + start.h;

    let w = draggedX0 + dx - fixedX;
    let h = draggedY0 + dy - fixedY;
    const wSign = w >= 0 ? 1 : -1;
    const hSign = h >= 0 ? 1 : -1;
    w = Math.max(MIN, Math.abs(w)) * wSign;
    h = Math.max(MIN, Math.abs(h)) * hSign;

    const boxX = wSign >= 0 ? fixedX : fixedX + w;
    const boxY = hSign >= 0 ? fixedY : fixedY + h;
    const boxW = Math.abs(w);
    const boxH = Math.abs(h);

    const [fx, fy] = ANCHOR_FRAC[(z.anchor ?? sd('anchor') ?? 'top-left') as Anchor];
    const position = { x: roundFrac((boxX + fx * boxW) / totalW), y: roundFrac((boxY + fy * boxH) / totalH) };
    this._updateZone(this._resizeZone, { width: round1(boxW), height: round1(boxH), position });
  }

  private _onZoneResizeUp(e: PointerEvent): void {
    if (this._resizeZone >= 0) (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    this._resizeZone = -1;
  }

  // ── Background (canvas image) drag / resize ──────────────────────────────────
  // The base image is the rectangle (L, T, baseW, baseH) inside the total frame
  // (totalW × totalH = baseW + L + R × baseH + T + B). Dragging/resizing it holds
  // the total frame constant and redistributes the difference into canvas.extend,
  // so shrinking the image on a side turns the freed strip into extend space that
  // cards can occupy on that side. Resize is aspect-locked to the image; the frame
  // is never grown past its current size. Grid mode snaps origin + size to cells.

  private _onBgDown(e: PointerEvent, mode: 'move' | 'tl' | 'tr' | 'bl' | 'br'): void {
    e.preventDefault();
    e.stopPropagation();
    this._bgSelected = true;
    this._bgMode = mode;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    this._bgRect = (this.renderRoot.querySelector('.ec-canvas-area') as HTMLElement).getBoundingClientRect();
    this._bgStartX = e.clientX;
    this._bgStartY = e.clientY;
    const d = computeCanvasDims(this._config);
    this._bgStart = { L: d.L, T: d.T, baseW: d.baseW, baseH: d.baseH, totalW: d.totalW, totalH: d.totalH };
  }

  private _onBgMove(e: PointerEvent): void {
    if (!this._bgMode || !this._bgRect || !this._config) return;
    const s = this._bgStart;
    const dx = (e.clientX - this._bgStartX) / this._bgRect.width * s.totalW;
    const dy = (e.clientY - this._bgStartY) / this._bgRect.height * s.totalH;
    const gg = this._gridGeom();
    const snap = (v: number, cell: number) => Math.round(v / cell) * cell;
    const MIN = 20;

    let L: number, T: number, baseW: number, baseH: number;

    if (this._bgMode === 'move') {
      // Reposition the image inside the frame; opposite-side extend compensates.
      baseW = s.baseW; baseH = s.baseH;
      L = Math.min(Math.max(0, s.L + dx), s.totalW - baseW);
      T = Math.min(Math.max(0, s.T + dy), s.totalH - baseH);
      if (gg) {
        L = Math.min(Math.max(0, snap(L, gg.cellW)), s.totalW - baseW);
        T = Math.min(Math.max(0, snap(T, gg.cellH)), s.totalH - baseH);
      }
    } else {
      // Aspect-locked resize from the opposite (fixed) corner.
      const left = this._bgMode.includes('l');
      const top = this._bgMode.includes('t');
      const sw = left ? -dx : dx;                 // signed width growth
      const sh = top ? -dy : dy;                  // signed height growth
      // Drive uniform scale from whichever axis the pointer moved more (normalised).
      let scale = (Math.abs(sw) / s.baseW >= Math.abs(sh) / s.baseH)
        ? (s.baseW + sw) / s.baseW
        : (s.baseH + sh) / s.baseH;
      // Available room on the growing side keeps the frame fixed (never grows total).
      const maxW = left ? s.L + s.baseW : s.totalW - s.L;
      const maxH = top ? s.T + s.baseH : s.totalH - s.T;
      const sMax = Math.min(maxW / s.baseW, maxH / s.baseH);
      const sMin = Math.max(MIN / s.baseW, MIN / s.baseH);
      scale = Math.min(Math.max(scale, sMin), sMax);
      baseW = s.baseW * scale;
      baseH = s.baseH * scale;
      // Fixed edge is opposite the dragged corner.
      L = left ? (s.L + s.baseW) - baseW : s.L;
      T = top ? (s.T + s.baseH) - baseH : s.T;
      if (gg) {
        // Keep aspect: snap width to whole cells, derive height, re-anchor + snap origin.
        baseW = Math.min(s.totalW, Math.max(gg.cellW, snap(baseW, gg.cellW)));
        baseH = Math.min(s.totalH, baseW * (s.baseH / s.baseW));
        L = left ? (s.L + s.baseW) - baseW : s.L;
        T = top ? (s.T + s.baseH) - baseH : s.T;
        L = Math.min(Math.max(0, snap(L, gg.cellW)), s.totalW - baseW);
        T = Math.min(Math.max(0, snap(T, gg.cellH)), s.totalH - baseH);
      }
    }

    const R = s.totalW - baseW - L;
    const B = s.totalH - baseH - T;
    this._updateCanvas({
      width: round1(baseW),
      height: round1(baseH),
      extend: {
        left:   L > 0.5 ? round1(L) : undefined,
        top:    T > 0.5 ? round1(T) : undefined,
        right:  R > 0.5 ? round1(R) : undefined,
        bottom: B > 0.5 ? round1(B) : undefined,
      },
    });
  }

  private _onBgUp(e: PointerEvent): void {
    if (this._bgMode) (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    this._bgMode = null;
  }

  // ── Embedded card helpers ───────────────────────────────────────────────────

  private _embCards(): EmbeddedCardConfig[] {
    return this._config?.embedded_cards ?? [];
  }

  private _addEmbCard(): void {
    if (!this._config) return;
    const newCard: EmbeddedCardConfig = {
      id: 'emb-' + Date.now().toString(36),
      name: 'Embedded Card',
      position: { x: 0.5, y: 0.5 },
      anchor: 'center',
      width: 200,
      card_config: {},
    };
    const geom = this._gridGeom();
    if (geom) {
      const { cols, rows, cellW, padding } = geom;
      const col = Math.round(cols / 2);
      const row = Math.round(rows / 2);
      const span = Math.max(1, Math.min(cols, 2));
      newCard.grid_span = span;
      newCard.width = Math.max(8, span * cellW - padding);
      newCard.position = { x: roundFrac(col / cols), y: roundFrac(row / rows) };
    }
    const embedded_cards = [...this._embCards(), newCard];
    this._selEmbCard = embedded_cards.length - 1;
    this._emit({ ...this._config, embedded_cards });
  }

  private _updateEmbCard(idx: number, patch: Partial<EmbeddedCardConfig>): void {
    if (!this._config) return;
    const embedded_cards = this._embCards().map((ec, i) => i === idx ? mergePatch(ec, patch) : ec);
    this._emit({ ...this._config, embedded_cards });
  }

  private _updateEmbCardBox(idx: number, patch: Partial<import('./types').BoxStyle>): void {
    const ec = this._embCards()[idx];
    if (!ec) return;
    // Nested-object prune, same reasoning as _updateCardBox (#58).
    this._updateEmbCard(idx, { box: mergePatch(ec.box ?? {}, patch) });
  }

  private _removeEmbCard(idx: number): void {
    if (!this._config) return;
    const embedded_cards = this._embCards().filter((_, i) => i !== idx);
    this._selEmbCard = Math.min(this._selEmbCard, embedded_cards.length - 1);
    if (embedded_cards.length === 0) this._selEmbCard = -1;
    // Shift the multi-selection down past the removed index, like _removeCard
    // does for _selCards, so group tools keep targeting the same cards.
    this._selEmbCards = new Set(
      [...this._selEmbCards].filter((i) => i !== idx).map((i) => (i > idx ? i - 1 : i)),
    );
    this._emit({ ...this._config, embedded_cards });
    this._showUndoToast('Embedded card removed');
  }

  /** One-click Duplicate (#62): deep-clone the embedded card (its card_config
   *  included), re-ID it, insert directly after the source and select it. */
  private _duplicateEmbCard(idx: number): void {
    if (!this._config) return;
    const src = this._embCards()[idx];
    if (!src) return;
    const copy = MosaicCanvasEditor._deepClone(src);
    copy.id = MosaicCanvasEditor._newId('emb');
    if (copy.name) copy.name += ' copy';
    const embedded_cards = [...this._embCards()];
    embedded_cards.splice(idx + 1, 0, copy);
    this._selEmbCard = idx + 1;
    this._selEmbCards = new Set([idx + 1]);
    this._emit({ ...this._config, embedded_cards });
  }

  private _onEmbCardDown(e: PointerEvent, idx: number): void {
    e.preventDefault();
    e.stopPropagation();
    this._bgSelected = false;
    this._selEmbCard = idx;
    this._syncNavTo('cards', 'embedded', [{ key: `emb:${this._embCards()[idx]?.id ?? idx}`, label: this._embCards()[idx]?.name ?? this._embCards()[idx]?.id ?? `Embedded ${idx + 1}` }]);

    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      const next = new Set(this._selEmbCards);
      if (next.has(idx)) { next.delete(idx); } else { next.add(idx); }
      this._selEmbCards = next;
      return;
    }

    const embCards = this._embCards();
    const clickedGroup = embCards[idx]?.group;
    const ecMemberIndices = clickedGroup
      ? embCards.map((ec, i) => ({ ec, i })).filter(({ ec }) => ec.group === clickedGroup).map(({ i }) => i)
      : [idx];

    this._selEmbCards = new Set(ecMemberIndices);
    this._dragEmbCard = idx;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    this._ecRect = (this.renderRoot.querySelector('.ec-canvas-area') as HTMLElement).getBoundingClientRect();
    this._ecStartX = e.clientX;
    this._ecStartY = e.clientY;
    this._embDragMembers = ecMemberIndices.map((i) => ({
      idx: i,
      start: { ...(embCards[i]?.position ?? { x: 0, y: 0 }) },
    }));

    // Pick up normal card group members sharing the same group
    if (clickedGroup) {
      const cards = this._config?.cards ?? [];
      const cardMemberIndices = cards
        .map((c, i) => ({ c, i }))
        .filter(({ c }) => c.group === clickedGroup)
        .map(({ i }) => i);
      this._selCards = new Set(cardMemberIndices);
      this._dragCard = cardMemberIndices[0] ?? -1;
      this._hostRect = (this.renderRoot.querySelector('.ec-canvas-area') as HTMLElement).getBoundingClientRect();
      this._startX = e.clientX;
      this._startY = e.clientY;
      this._dragMembers = cardMemberIndices.map((i) => ({
        idx: i,
        start: { ...(cards[i]?.position ?? { x: 0, y: 0 }) },
      }));
    } else {
      this._selCards = new Set();
      this._dragCard = -1;
      this._dragMembers = [];
    }
  }

  private _onEmbCardMove(e: PointerEvent): void {
    if (this._dragEmbCard < 0 || !this._ecRect || !this._config) return;
    const dx = (e.clientX - this._ecStartX) / this._ecRect.width;
    const dy = (e.clientY - this._ecStartY) / this._ecRect.height;
    const embedded_cards = this._embCards().map((ec, idx) => {
      const member = this._embDragMembers.find((m) => m.idx === idx);
      if (!member) return ec;
      return { ...ec, position: { x: roundFrac(member.start.x + dx), y: roundFrac(member.start.y + dy) } };
    });
    // Also move any normal card group members
    const cards = this._dragMembers.length > 0
      ? this._config.cards.map((c, idx) => {
          const member = this._dragMembers.find((m) => m.idx === idx);
          if (!member) return c;
          return { ...c, position: { x: roundFrac(member.start.x + dx), y: roundFrac(member.start.y + dy) } };
        })
      : this._config.cards;
    this._emit({ ...this._config, cards, embedded_cards });
  }

  private _onEmbCardUp(e: PointerEvent): void {
    // Grid-mode snapping for embedded members (including mixed regular+embedded
    // groups) is handled once in _onCardUp, which runs first in the pointerup
    // binding (see render()) and can see both _dragMembers and _embDragMembers.
    if (this._dragEmbCard >= 0) (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    this._dragEmbCard = -1;
  }

  /** Reads the card_config for any embed target (standalone card, or a Mosaic/Popover field). */
  private _embConfig(t: EmbedTarget): Record<string, unknown> | undefined {
    if (t.kind === 'std') return this._embCards()[t.idx]?.card_config;
    if (t.kind === 'field') return this._config?.cards[t.ci]?.fields[t.fi]?.embed_card_config;
    return this._extCards()[t.ci]?.fields[t.fi]?.embed_card_config;
  }

  /** Writes the card_config back to whichever kind of embed target is active. */
  private _embSetConfig(t: EmbedTarget, cfg: Record<string, unknown>): void {
    if (t.kind === 'std') { this._updateEmbCard(t.idx, { card_config: cfg }); return; }
    if (t.kind === 'field') { this._updateField(t.ci, t.fi, { embed_card_config: cfg }); return; }
    this._updateExtField(t.ci, t.fi, { embed_card_config: cfg });
  }

  private async _openEmbEditor(target: EmbedTarget): Promise<void> {
    this._embEditorTarget = target;
    const cfg = this._embConfig(target) ?? {};
    this._embEditorYaml = JSON.stringify(cfg, null, 2);
    this._embNativeEditor = null;

    const rawType = String(cfg?.type ?? '');

    if (rawType) {
      try {
        const helpers = await (window as any).loadCardHelpers?.();
        if (helpers?.createCardElement) {
          // Called for its side effect: triggers the real card module to load.
          try { helpers.createCardElement(cfg); } catch { /* noop */ }
        }

        // If createCardElement returned hui-error-card, the real card module is still
        // loading asynchronously. Wait for the expected tag name instead.
        const expectedTag = rawType.startsWith('custom:')
          ? rawType.slice(7)
          : `hui-${rawType}-card`;

        // Wait for the real card module to load
        await Promise.race([
          customElements.whenDefined(expectedTag),
          new Promise<void>((r) => setTimeout(r, 5000)),
        ]);

        // Resolve stub config so editors don't crash on incomplete configs
        const CardClass = customElements.get(expectedTag) as any;
        let editorConfig: Record<string, unknown> = { ...(cfg as Record<string, unknown>) };
        if (CardClass?.getStubConfig) {
          try {
            const entities = Object.keys(this.hass?.states ?? {});
            const stub = await CardClass.getStubConfig(this.hass, entities, entities) as Record<string, unknown>;
            if (stub && typeof stub === 'object') editorConfig = { ...stub, ...editorConfig };
          } catch { /* noop */ }
        }
        this._embEditorConfig = editorConfig;

        // hui-card-element-editor is HA's card editor wrapper used by stack cards.
        // It's registered globally when hui-dialog-edit-card loads (i.e. the moment any card editor opens).
        await Promise.race([
          customElements.whenDefined('hui-card-element-editor'),
          new Promise<void>((r) => setTimeout(r, 3000)),
        ]);
        const HuiCardEditorClass = customElements.get('hui-card-element-editor');

        if (HuiCardEditorClass) {
          const editorEl = document.createElement('hui-card-element-editor') as HTMLElement;
          (editorEl as any).hass = this.hass;
          (editorEl as any).value = editorConfig;
          editorEl.addEventListener('config-changed', (e: Event) => {
            e.stopPropagation();
            const detail = (e as CustomEvent).detail;
            if (detail?.config && this._embEditorTarget) {
              this._embSetConfig(this._embEditorTarget, detail.config);
            }
          });
          this._embNativeEditor = editorEl;
        } else {
          // Fallback: direct getConfigElement
          const getConfigFn: (() => Promise<HTMLElement>) | undefined = CardClass?.getConfigElement;
          if (getConfigFn) {
            const editorEl = await getConfigFn.call(CardClass) as HTMLElement | undefined;
            if (editorEl) {
              try { (editorEl as any).setConfig?.(editorConfig); } catch { /* noop */ }
              (editorEl as any).hass = this.hass;
              editorEl.addEventListener('config-changed', (e: Event) => {
                e.stopPropagation();
                const detail = (e as CustomEvent).detail;
                if (detail?.config && this._embEditorTarget) {
                  this._embSetConfig(this._embEditorTarget, detail.config);
                }
              });
              this._embNativeEditor = editorEl;
            }
          }
        }
      } catch (e) {
        console.warn('[mc-editor] native editor unavailable:', e);
      }
    }

    this._embEditorOpen = true;
  }

  private _closeEmbEditor(): void {
    this._embEditorOpen = false;
    this._embEditorTarget = null;
    this._embNativeEditor = null;
    this._embEditorConfig = null;
    this._embEditorYamlError = '';
  }

  private _saveEmbEditorYaml(): void {
    if (!this._embEditorTarget) return;
    try {
      const cfg = JSON.parse(this._embEditorYaml);
      this._embSetConfig(this._embEditorTarget, cfg);
      this._closeEmbEditor();
    } catch (err) {
      this._embEditorYamlError = 'Invalid JSON: ' + (err as Error).message;
    }
  }

  private async _openEmbPicker(target: EmbedTarget): Promise<void> {
    this._embPickerTarget = target;
    this._embPickerSearch = '';
    this._embPickerOpen = true;
  }

  private async _pickEmbCardType(type: string): Promise<void> {
    this._embPickerOpen = false;
    this._embPickerSearch = '';
    const target = this._embPickerTarget;
    if (!target) return;
    const newConfig = { ...(this._embConfig(target) ?? {}), type };
    this._embSetConfig(target, newConfig);
    await this._openEmbEditor(target);
  }

  private _setBgImage(mode: 'day' | 'night', count: string, url: string): void {
    if (!this._config) return;
    const bg = this._config.background ?? {};
    const modeImages = { ...(bg.images?.[mode] ?? {}) };
    if (url === '') {
      delete modeImages[count];
    } else {
      modeImages[count] = url;
    }
    this._updateBackground({
      images: { ...bg.images, [mode]: modeImages },
    });
  }

  private _addCard(): void {
    if (!this._config) return;
    const newCard: CardConfig = {
      id: 'card-' + Date.now().toString(36),
      name: 'Card',
      position: { x: 0.5, y: 0.5 },
      anchor: 'center',
      align: 'center',
      fields: [],
    };
    const geom = this._gridGeom();
    if (geom) {
      const { cols, rows, cellW, padding } = geom;
      const col = Math.round(cols / 2);
      const row = Math.round(rows / 2);
      const span = Math.max(1, Math.min(cols, 2));
      newCard.grid_span = span;
      newCard.width = Math.max(8, span * cellW - padding);
      newCard.position = { x: roundFrac(col / cols), y: roundFrac(row / rows) };
    }
    const cards = [...this._config.cards, newCard];
    this._selCard = cards.length - 1;
    this._selField = -1;
    this._emit({ ...this._config, cards });
  }

  private _removeCard(i: number): void {
    if (!this._config) return;
    const cards = this._config.cards.filter((_, idx) => idx !== i);
    this._selCard = Math.min(this._selCard, Math.max(0, cards.length - 1));
    this._selField = -1;
    // Drop the removed card from the multi-selection and shift every index above
    // it down by one, since the array just shrank — otherwise a stale or
    // now-wrong index lingers for the align/distribute tools.
    this._selCards = new Set(
      Array.from(this._selCards)
        .filter((idx) => idx !== i)
        .map((idx) => (idx > i ? idx - 1 : idx)),
    );
    this._emit({ ...this._config, cards });
    this._showUndoToast('Card removed');
  }

  /** Collision-safe id for a new config object — shared by the paste and
   *  duplicate (#62) flows so the re-ID convention lives in one place. */
  private static _newId(prefix: string): string {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  }

  /** Deep-clone a config subtree; configs are plain JSON throughout. */
  private static _deepClone<T>(v: T): T {
    return JSON.parse(JSON.stringify(v)) as T;
  }

  /** One-click Duplicate (#62): deep-clone the card, re-ID it and its fields,
   *  insert directly after the source and select it. No clipboard involved. */
  private _duplicateCard(i: number): void {
    if (!this._config) return;
    const src = this._config.cards[i];
    if (!src) return;
    const copy = MosaicCanvasEditor._deepClone(src);
    copy.id = MosaicCanvasEditor._newId('card');
    copy.fields = copy.fields.map((f) => ({ ...f, id: MosaicCanvasEditor._newId('f') }));
    if (copy.name) copy.name += ' copy';
    const cards = [...this._config.cards];
    cards.splice(i + 1, 0, copy);
    this._selCard = i + 1;
    this._selField = -1;
    this._selCards = new Set([i + 1]);
    this._emit({ ...this._config, cards });
  }

  private _copyFields(i: number): void {
    const card = this._config?.cards[i];
    if (!card) return;
    this._copiedFields = card.fields.map((f) => ({ ...f }));
    this._copySourceId = card.id;
  }

  private _pasteFields(i: number): void {
    if (!this._copiedFields || !this._config) return;
    const newFields = this._copiedFields.map((f) => ({
      ...f,
      id: MosaicCanvasEditor._newId('f'),
    }));
    // Appends and keeps the clipboard, matching _pasteField's (single-field)
    // behavior — so the same copied set can be pasted onto several cards.
    const cards = this._config.cards.map((c, idx) =>
      idx === i ? { ...c, fields: [...c.fields, ...newFields] } : c,
    );
    this._emit({ ...this._config, cards });
  }

  private _copyField(ci: number, fi: number, isExt = false): void {
    const cards = isExt ? this._extCards() : (this._config?.cards ?? []);
    const card = cards[ci];
    const field = card?.fields[fi];
    if (!card || !field) return;
    this._copiedField = { ...field };
    this._copiedFieldSrc = { isExt, cardId: card.id, fieldId: field.id };
  }

  private _pasteField(ci: number, isExt = false): void {
    if (!this._copiedField || !this._config) return;
    const newField = {
      ...this._copiedField,
      id: MosaicCanvasEditor._newId('f'),
    };
    if (isExt) {
      const card = this._extCards()[ci];
      if (!card) return;
      this._selExtField = card.fields.length;
      this._updateExtCard(ci, { fields: [...card.fields, newField] });
    } else {
      const card = this._config.cards[ci];
      if (!card) return;
      const fields = [...card.fields, newField];
      const updatedCards = this._config.cards.map((c, i) => i === ci ? { ...c, fields } : c);
      this._selField = fields.length - 1;
      this._emit({ ...this._config, cards: updatedCards });
    }
  }

  /** One-click Duplicate (#62) for a field row (mosaic or popover editor):
   *  deep-clone, re-ID, insert after the source and select it — the copy/paste
   *  clipboard is untouched. */
  private _duplicateField(ci: number, fi: number, isExt = false): void {
    if (!this._config) return;
    const card = isExt ? this._extCards()[ci] : this._config.cards[ci];
    const src = card?.fields[fi];
    if (!card || !src) return;
    const copy = MosaicCanvasEditor._deepClone(src);
    copy.id = MosaicCanvasEditor._newId('f');
    if (copy.display_name) copy.display_name += ' copy';
    const fields = [...card.fields];
    fields.splice(fi + 1, 0, copy);
    if (isExt) {
      this._selExtField = fi + 1;
      this._updateExtCard(ci, { fields });
    } else {
      this._selField = fi + 1;
      this._updateCard(ci, { fields });
    }
  }

  /**
   * Patch one graph series in place.
   *
   * Every row on the series screen used to hand-roll the same four lines —
   * copy the array, spread the entry, assign, emit — twelve times over. Beyond
   * the noise, each copy was an opportunity to splice the wrong index or drop
   * a sibling key, and it is the main reason nobody extended that screen. All
   * mutation still goes through `_updFor`, so the undo stack is unaffected.
   */
  private _updSeries(
    ci: number, fi: number, si: number, field: FieldConfig,
    patch: Partial<GraphSeries>, isExtended = false,
  ): void {
    const series = [...(field.graph_series ?? [])];
    if (!series[si]) return;
    series[si] = { ...series[si]!, ...patch };
    this._updFor(ci, fi, isExtended)({ graph_series: series });
  }

  /** One-click Duplicate (#62) for a graph-series row in either field editor. */
  private _duplicateGraphSeries(ci: number, fi: number, si: number, isExtended: boolean): void {
    const card = isExtended ? this._extCards()[ci] : this._config?.cards[ci];
    const field = card?.fields[fi];
    const src = field?.graph_series?.[si];
    if (!field || !src) return;
    const copy = MosaicCanvasEditor._deepClone(src);
    if (copy.label) copy.label += ' copy';
    const series = [...(field.graph_series ?? [])];
    series.splice(si + 1, 0, copy);
    if (isExtended) this._selExtSeries = si + 1; else this._selSeries = si + 1;
    this._updFor(ci, fi, isExtended)({ graph_series: series });
  }

  private _addField(ci: number): void {
    if (!this._config) return;
    const card = this._config.cards[ci];
    if (!card) return;
    const newField: FieldConfig = {
      id: 'f-' + Date.now().toString(36),
      type: 'value',
      column: 1,
    };
    const fields = [...card.fields, newField];
    this._selField = fields.length - 1;
    this._updateCard(ci, { fields });
  }

  private _removeField(ci: number, fi: number): void {
    if (!this._config) return;
    const card = this._config.cards[ci];
    if (!card) return;
    const fields = card.fields.filter((_, idx) => idx !== fi);
    if (this._selField >= fields.length) this._selField = fields.length - 1;
    this._updateCard(ci, { fields });
    this._showUndoToast('Field removed');
  }

  // ── Extended card mutations ─────────────────────────────────────────────────

  private _extCards(): import('./types').ExtendedCardConfig[] {
    return this._config?.extended_cards ?? [];
  }

  private _updateExtDefaults(patch: Partial<import('./types').ExtendedCardDefaults>): void {
    if (!this._config) return;
    // mergePatch rather than a raw spread so clearing a default removes the key
    // instead of leaving `key: undefined` behind (#58).
    this._emit({
      ...this._config,
      extended_card_defaults: mergePatch(this._config.extended_card_defaults ?? {}, patch),
    });
  }

  private _addExtCard(): void {
    if (!this._config) return;
    const newCard: import('./types').ExtendedCardConfig = {
      id: 'ext-' + Date.now().toString(36),
      name: 'Popover Card',
      columns: 2,
      fields: [],
    };
    const extended_cards = [...this._extCards(), newCard];
    this._selExtCard = extended_cards.length - 1;
    this._selExtField = -1;
    this._emit({ ...this._config, extended_cards });
  }

  private _removeExtCard(i: number): void {
    if (!this._config) return;
    const extended_cards = this._extCards().filter((_, idx) => idx !== i);
    this._selExtCard = Math.min(this._selExtCard, Math.max(0, extended_cards.length - 1));
    this._selExtField = -1;
    this._emit({ ...this._config, extended_cards });
    this._showUndoToast('Popover card removed');
  }

  /** One-click Duplicate (#62): deep-clone the popover card, re-ID it and its
   *  fields, insert directly after the source and select it. */
  private _duplicateExtCard(i: number): void {
    if (!this._config) return;
    const src = this._extCards()[i];
    if (!src) return;
    const copy = MosaicCanvasEditor._deepClone(src);
    copy.id = MosaicCanvasEditor._newId('ext');
    copy.fields = copy.fields.map((f) => ({ ...f, id: MosaicCanvasEditor._newId('f') }));
    if (copy.name) copy.name += ' copy';
    const extended_cards = [...this._extCards()];
    extended_cards.splice(i + 1, 0, copy);
    this._selExtCard = i + 1;
    this._selExtField = -1;
    this._emit({ ...this._config, extended_cards });
  }

  private _updateExtCard(eci: number, patch: Partial<import('./types').ExtendedCardConfig>): void {
    if (!this._config) return;
    const extended_cards = this._extCards().map((c, i) => i === eci ? mergePatch(c, patch) : c);
    this._emit({ ...this._config, extended_cards });
  }

  private _updateExtCardBox(eci: number, patch: Partial<import('./types').BoxStyle>): void {
    const card = this._extCards()[eci];
    if (!card) return;
    // Nested-object prune, same reasoning as _updateCardBox (#58).
    this._updateExtCard(eci, { box: mergePatch(card.box ?? {}, patch) });
  }

  private _addExtField(eci: number): void {
    if (!this._config) return;
    const card = this._extCards()[eci];
    if (!card) return;
    const newField: import('./types').FieldConfig = { id: 'f-' + Date.now().toString(36), type: 'value', column: 1 };
    const fields = [...card.fields, newField];
    this._selExtField = fields.length - 1;
    this._updateExtCard(eci, { fields });
  }

  private _removeExtField(eci: number, efi: number): void {
    const card = this._extCards()[eci];
    if (!card) return;
    const fields = card.fields.filter((_, i) => i !== efi);
    if (this._selExtField >= fields.length) this._selExtField = fields.length - 1;
    this._updateExtCard(eci, { fields });
    this._showUndoToast('Field removed');
  }

  /** +/- stepper buttons next to every numeric field (mock's "Number fields: stepper style"
   *  control pattern). Delegates to the native input's own stepUp/stepDown so it respects
   *  that field's own min/max/step — then fires a real 'change' event so the existing
   *  @change handler already bound on the input runs unchanged. */
  private _stepNumInput(e: Event, dir: 1 | -1): void {
    e.preventDefault();
    const btn = e.currentTarget as HTMLElement;
    const input = btn.closest('.ec-num-wrap')?.querySelector('input') as HTMLInputElement | null;
    if (!input) return;
    try {
      if (dir > 0) input.stepUp(); else input.stepDown();
    } catch {
      const step = Number(input.step) || 1;
      const cur = Number(input.value) || 0;
      input.value = String(cur + dir * step);
    }
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }

  /** Wrap an arbitrary numeric <input> in the shared −/+ stepper chrome. */
  private _numWrap(input: TemplateResult): TemplateResult {
    return html`<span class="ec-num-wrap">${input}<span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${(e: Event) => this._stepNumInput(e, -1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${(e: Event) => this._stepNumInput(e, 1)}>+</button></span></span>`;
  }

  /** Shared numeric input with stepper buttons. Standard parse: '' → undefined,
   *  anything else → Number. Sites with a different contract (parseFloat chains,
   *  clamping, '' meaning 0) keep their own <input> inside _numWrap instead. */
  private _numInput(opts: NumInputOpts): TemplateResult {
    return this._numWrap(html`<input class="ec-input ec-input-num" type="number"
      min=${opts.min ?? nothing} max=${opts.max ?? nothing} step=${opts.step ?? nothing}
      placeholder=${opts.placeholder ?? nothing} title=${opts.title ?? nothing}
      .value=${opts.value != null ? String(opts.value) : ''}
      @change=${(e: Event) => {
        const v = (e.target as HTMLInputElement).value;
        opts.onChange(v === '' ? undefined : Number(v));
      }}
    />`);
  }

  /** Labeled numeric editor row: _row + _numInput. */
  private _numRow(label: string, opts: NumInputOpts): TemplateResult {
    return this._row(label, this._numInput(opts), opts.hint);
  }

  // ── Drag-to-reorder ─────────────────────────────────────────────────────────

  /** Splice `from` out of `arr` and back in next to `to`, honoring drop position. */
  private _reorderArray<T>(arr: T[], from: number, to: number, before: boolean): { arr: T[]; target: number } {
    const copy = [...arr];
    const [moved] = copy.splice(from, 1);
    const target = from < to ? (before ? to - 1 : to) : (before ? to : to + 1);
    copy.splice(target, 0, moved!);
    return { arr: copy, target };
  }

  /**
   * Remap a multi-selection set after a single item moved from → target, so
   * the group align/gap tools keep operating on the same cards. Same shift
   * logic _removeCard already applies on delete.
   */
  private _remapSelectionAfterMove(sel: Set<number>, from: number, target: number): Set<number> {
    if (from === target || sel.size === 0) return sel;
    const next = new Set<number>();
    for (const i of sel) {
      if (i === from) next.add(target);
      else if (from < target && i > from && i <= target) next.add(i - 1);
      else if (from > target && i >= target && i < from) next.add(i + 1);
      else next.add(i);
    }
    return next;
  }

  private _moveCard(from: number, to: number, before: boolean): void {
    if (!this._config) return;
    const { arr, target } = this._reorderArray(this._config.cards, from, to, before);
    this._selCard = target;
    this._selCards = this._remapSelectionAfterMove(this._selCards, from, target);
    this._emit({ ...this._config, cards: arr });
  }

  private _moveExtCard(from: number, to: number, before: boolean): void {
    if (!this._config) return;
    const { arr, target } = this._reorderArray(this._extCards(), from, to, before);
    this._selExtCard = target;
    this._emit({ ...this._config, extended_cards: arr });
  }

  private _moveVirtual(from: number, to: number, before: boolean): void {
    if (!this._config) return;
    const { arr, target } = this._reorderArray(this._virtuals(), from, to, before);
    this._selVirtual = target;
    this._emit({ ...this._config, virtuals: arr });
  }

  private _moveZone(from: number, to: number, before: boolean): void {
    if (!this._config) return;
    const { arr, target } = this._reorderArray(this._zones(), from, to, before);
    this._selZone = target;
    this._emit({ ...this._config, zones: arr });
  }

  private _moveFlow(from: number, to: number, before: boolean): void {
    if (!this._config) return;
    const { arr, target } = this._reorderArray(this._flows(), from, to, before);
    this._selFlow = target;
    this._emit({ ...this._config, flows: arr });
  }

  private _moveEmbCard(from: number, to: number, before: boolean): void {
    if (!this._config) return;
    const { arr, target } = this._reorderArray(this._embCards(), from, to, before);
    this._selEmbCard = target;
    this._selEmbCards = this._remapSelectionAfterMove(this._selEmbCards, from, target);
    this._emit({ ...this._config, embedded_cards: arr });
  }

  private _movePoint(fi: number, from: number, to: number, before: boolean): void {
    if (!this._config) return;
    const flow = this._flows()[fi];
    if (!flow) return;
    const { arr, target } = this._reorderArray(flow.points, from, to, before);
    this._selPoint = target;
    this._updateFlow(fi, { points: arr });
  }

  private _moveVirtualInput(vi: number, from: number, to: number, before: boolean): void {
    if (!this._config) return;
    const virtual = this._virtuals()[vi];
    if (!virtual) return;
    const { arr, target } = this._reorderArray(virtual.inputs, from, to, before);
    this._selVirtualInput = target;
    this._updateVirtual(vi, { inputs: arr });
  }

  private _moveTrigger(vi: number, from: number, to: number, before: boolean): void {
    if (!this._config) return;
    const virtual = this._virtuals()[vi];
    if (!virtual) return;
    const { arr, target } = this._reorderArray(virtual.triggers ?? [], from, to, before);
    this._selTrigger = target;
    this._updateVirtual(vi, { triggers: arr });
  }

  /** One handler for both panels — the option list is identical in each. */
  private _moveOption(ci: number, fi: number, from: number, to: number, before: boolean, isExtended: boolean): void {
    const field = isExtended ? this._extCards()[ci]?.fields[fi] : this._config?.cards[ci]?.fields[fi];
    if (!field) return;
    const { arr, target } = this._reorderArray(field.options ?? [], from, to, before);
    if (isExtended) this._selExtOption = target; else this._selOption = target;
    this._updFor(ci, fi, isExtended)({ options: arr });
  }

  /** One handler for both panels — the Time-Until layout list is identical in each.
   *  No selection index to remap: the rows are inline edit surfaces, not navigable. */
  private _moveTuItem(ci: number, fi: number, from: number, to: number, before: boolean, isExtended: boolean): void {
    const field = isExtended ? this._extCards()[ci]?.fields[fi] : this._config?.cards[ci]?.fields[fi];
    if (!field) return;
    const { arr } = this._reorderArray(field.time_until_layout ?? [], from, to, before);
    this._updFor(ci, fi, isExtended)({ time_until_layout: arr });
  }

  private _moveGraphSeries(ci: number, fi: number, from: number, to: number, before: boolean): void {
    const field = this._config?.cards[ci]?.fields[fi];
    if (!field) return;
    const { arr, target } = this._reorderArray(field.graph_series ?? [], from, to, before);
    this._selSeries = target;
    this._updateField(ci, fi, { graph_series: arr });
  }

  private _moveExtGraphSeries(eci: number, efi: number, from: number, to: number, before: boolean): void {
    const field = this._extCards()[eci]?.fields[efi];
    if (!field) return;
    const { arr, target } = this._reorderArray(field.graph_series ?? [], from, to, before);
    this._selExtSeries = target;
    this._updateExtField(eci, efi, { graph_series: arr });
  }

  private _moveField(ci: number, from: number, to: number, before: boolean): void {
    if (!this._config) return;
    const card = this._config.cards[ci];
    if (!card) return;
    const { arr, target } = this._reorderArray(card.fields, from, to, before);
    this._selField = target;
    this._updateCard(ci, { fields: arr });
  }

  private _moveExtField(eci: number, from: number, to: number, before: boolean): void {
    const card = this._extCards()[eci];
    if (!card) return;
    const { arr, target } = this._reorderArray(card.fields, from, to, before);
    this._selExtField = target;
    this._updateExtCard(eci, { fields: arr });
  }

  // ── Pointer-event reorder (#66) ─────────────────────────────────────────────
  //
  // HTML5 drag-and-drop does not fire on touch at all, so on a wall-mounted
  // tablet none of the 13 `_itemCard` lists could be reordered — and #57's
  // Alt+↑/↓ fallback needs a keyboard the tablet also lacks. Pointer events
  // cover mouse, touch and pen in one path, so this replaces the HTML5
  // handlers outright rather than sitting beside them: two paths over the same
  // `_moveByKeys` dispatch would have to be kept in step, and a hybrid device
  // could fire both.
  //
  // `ha-sortable` is deliberately not used. #57 rejected it on record as an
  // undocumented HA internal with no load guarantee, and that decision stands.
  //
  // Scroll-vs-drag is settled structurally rather than with a long-press timer:
  // touch and pen must start from the grip (`touch-action: none` there, so the
  // gesture is ours from the first event), while everything else on the row
  // still scrolls and taps. A mouse keeps whole-row dragging, since a wheel
  // scrolls and there is nothing to disambiguate.

  /** Movement before a press counts as a drag rather than a tap. */
  private static readonly _PTR_DRAG_SLOP = 6;
  /** Distance from a scroll container's edge that starts auto-scrolling. */
  private static readonly _PTR_EDGE = 44;
  /** Peak auto-scroll speed, px per frame at the very edge. */
  private static readonly _PTR_SCROLL_MAX = 16;

  /**
   * Live pointer drag. Not `@state`: it changes on every pointermove and must
   * never drive a render. The two things the rows *do* render from (`_dragSrc`
   * and the drop marker) are separate reactive fields, set only when they
   * actually change.
   */
  private _ptrDrag: {
    key: string;
    pointerId: number;
    row: HTMLElement;
    /** Rows of the same list, by shared drag-key prefix — the only legal targets. */
    siblings: HTMLElement[];
    scroller: HTMLElement | null;
    startY: number;
    lastY: number;
    /** Past the slop threshold, so this is a drag and not a tap. */
    active: boolean;
    raf: number;
  } | null = null;

  /** Row the drop would land on, and which side. Reactive because the insertion
   *  line is a lit binding: `_itemCard`'s class attribute is bound, so lit
   *  rewrites it whole on any re-render — a hass tick alone is enough — and an
   *  imperative `classList.add` would silently vanish mid-drag. */
  @state() private _dropKey: string | null = null;
  @state() private _dropBefore = false;

  /**
   * A completed drag, or any press on the grip, must not also open the row.
   *
   * Cleared at the start of every press rather than only by the click that
   * consumes it: a drop re-renders the list, and if that replaces the row before
   * the browser dispatches its click, no click arrives to consume the flag and
   * it would swallow the *next* unrelated tap instead. Scoping it to one gesture
   * makes a stale flag impossible.
   */
  private _suppressClick = false;

  private _onItemPointerDown(e: PointerEvent, dragKey: string): void {
    this._suppressClick = false;
    // Left button only for mouse; touch and pen report button 0 too.
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    // The trailing copy/duplicate/remove buttons own their own presses.
    if (target.closest('.ec-item-card-actions')) return;
    const fromHandle = !!target.closest('.ec-drag-handle');
    if (e.pointerType !== 'mouse' && !fromHandle) return;

    const row = e.currentTarget as HTMLElement;
    const parts = dragKey.split(':');
    // Same prefix = same list, which is exactly what _moveByKeys requires of a
    // src/target pair. Mirrors the sibling lookup _onItemCardKeydown uses.
    // Only drag rows carry data-drag-key, so no class is needed to scope this —
    // and the Time-Until layout rows are .ec-list-row, not .ec-item-card.
    const prefix = [...parts.slice(0, -1), ''].join(':');
    const siblings = [...this.renderRoot.querySelectorAll<HTMLElement>(
      `[data-drag-key^="${prefix}"]`)];
    if (siblings.length < 2) return; // nothing to reorder against

    // Capture keeps the move/up stream on this row even once the pointer leaves
    // it. It throws if the pointer is no longer active, and it is unavailable to
    // synthetic events, so it is best-effort: without it the stream still
    // arrives by bubbling from whichever sibling row is under the pointer, since
    // they all carry these same handlers and read one shared _ptrDrag.
    try { row.setPointerCapture(e.pointerId); } catch { /* best-effort */ }
    this._ptrDrag = {
      key: dragKey, pointerId: e.pointerId, row, siblings,
      scroller: row.closest('.ec-panel-body'),
      startY: e.clientY, lastY: e.clientY, active: false, raf: 0,
    };
    // Pressing the grip is never a tap on the row, so claim it immediately.
    if (fromHandle) {
      this._suppressClick = true;
      e.preventDefault();
    }
  }

  private _onItemPointerMove(e: PointerEvent): void {
    const d = this._ptrDrag;
    if (!d || e.pointerId !== d.pointerId) return;
    d.lastY = e.clientY;
    if (!d.active) {
      if (Math.abs(e.clientY - d.startY) < MosaicCanvasEditor._PTR_DRAG_SLOP) return;
      d.active = true;
      this._dragSrc = d.key;
      // A mouse drag that started on the row body is a drag, not a click.
      this._suppressClick = true;
    }
    e.preventDefault();
    this._ptrTrack();
    this._ptrTickScroll();
  }

  /** Resolve the row under the pointer and which half, from live rects — they
   *  move under us while auto-scrolling, so this is recomputed every frame. */
  private _ptrTrack(): void {
    const d = this._ptrDrag;
    if (!d?.active) return;
    let key: string | null = null;
    let before = false;
    for (const el of d.siblings) {
      const r = el.getBoundingClientRect();
      if (d.lastY >= r.top && d.lastY <= r.bottom) {
        key = el.dataset.dragKey ?? null;
        before = d.lastY < r.top + r.height / 2;
        break;
      }
    }
    // Past either end of the list, clamp to the nearest edge so a drag to the
    // top or bottom still has somewhere to land.
    if (!key && d.siblings.length) {
      const first = d.siblings[0]!.getBoundingClientRect();
      const last = d.siblings[d.siblings.length - 1]!.getBoundingClientRect();
      if (d.lastY < first.top) { key = d.siblings[0]!.dataset.dragKey ?? null; before = true; }
      else if (d.lastY > last.bottom) { key = d.siblings[d.siblings.length - 1]!.dataset.dragKey ?? null; before = false; }
    }
    // Dropping either side of the dragged row itself is a no-op; show no line
    // rather than a target that would not move anything.
    if (key === d.key) key = null;
    if (this._dropKey !== key || this._dropBefore !== before) {
      this._dropKey = key;
      this._dropBefore = before;
    }
  }

  /**
   * Auto-scroll while dragging near a scroll container's edge. The browser does
   * this for free during an HTML5 drag and not at all for pointer events, so
   * without it a touch drag could never reach a row that is off screen — which
   * on a long Fields or Options list is most of them.
   */
  private _ptrTickScroll(): void {
    const d = this._ptrDrag;
    if (!d?.active || !d.scroller) return;
    const E = MosaicCanvasEditor;
    const r = d.scroller.getBoundingClientRect();
    const overTop = r.top + E._PTR_EDGE - d.lastY;
    const overBottom = d.lastY - (r.bottom - E._PTR_EDGE);
    const push = overTop > 0 ? -overTop : overBottom > 0 ? overBottom : 0;
    if (push === 0) {
      if (d.raf) { cancelAnimationFrame(d.raf); d.raf = 0; }
      return;
    }
    if (d.raf) return; // already looping
    const step = (): void => {
      const cur = this._ptrDrag;
      if (!cur?.active || !cur.scroller) return;
      const rect = cur.scroller.getBoundingClientRect();
      const t = rect.top + E._PTR_EDGE - cur.lastY;
      const b = cur.lastY - (rect.bottom - E._PTR_EDGE);
      const dy = t > 0 ? -Math.min(t, E._PTR_EDGE) : b > 0 ? Math.min(b, E._PTR_EDGE) : 0;
      if (dy === 0) { cur.raf = 0; return; }
      cur.scroller.scrollTop += (dy / E._PTR_EDGE) * E._PTR_SCROLL_MAX;
      this._ptrTrack();
      cur.raf = requestAnimationFrame(step);
    };
    d.raf = requestAnimationFrame(step);
  }

  private _onItemPointerUp(e: PointerEvent): void {
    const d = this._ptrDrag;
    if (!d || e.pointerId !== d.pointerId) return;
    const dropKey = this._dropKey;
    const before = this._dropBefore;
    const active = d.active;
    const srcKey = d.key;
    this._ptrEndDrag();
    if (active && dropKey && dropKey !== srcKey) this._moveByKeys(srcKey, dropKey, before);
  }

  private _onItemPointerCancel(e: PointerEvent): void {
    if (this._ptrDrag && e.pointerId !== this._ptrDrag.pointerId) return;
    this._ptrEndDrag();
  }

  private _ptrEndDrag(): void {
    const d = this._ptrDrag;
    if (d) {
      if (d.raf) cancelAnimationFrame(d.raf);
      // Releasing a capture the browser already dropped (the node was replaced
      // by a re-render) throws, and there is nothing to recover.
      try { d.row.releasePointerCapture(d.pointerId); } catch { /* already released */ }
    }
    this._ptrDrag = null;
    this._dragSrc = null;
    this._dropKey = null;
  }

  /** Keyboard parity for _itemCard rows: Enter/Space activate (Ctrl included,
   *  so multi-select toggles work), Alt+ArrowUp/Down reorder through the same
   *  per-type dispatch as drag & drop. */
  private _onItemCardKeydown(e: KeyboardEvent, dragKey: string | undefined, onClick: (e: MouseEvent) => void): void {
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.target !== e.currentTarget) return; // buttons inside `actions` handle their own keys
      e.preventDefault();
      onClick(e as unknown as MouseEvent); // handlers only read ctrlKey/metaKey, present on both event types
      return;
    }
    if (dragKey == null) return; // an unordered list has nothing to move
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const up = e.key === 'ArrowUp';
      const parts = dragKey.split(':');
      const tgtIdx = Number(parts[parts.length - 1]) + (up ? -1 : 1);
      if (tgtIdx < 0) return;
      // Bound the move by how many sibling rows of this list are rendered —
      // the move handlers assume an in-range target index.
      const prefix = [...parts.slice(0, -1), ''].join(':');
      const rows = this.renderRoot?.querySelectorAll(`[data-drag-key^="${prefix}"]`);
      if (!rows || tgtIdx >= rows.length) return;
      const targetKey = [...parts.slice(0, -1), String(tgtIdx)].join(':');
      this._moveByKeys(dragKey, targetKey, up);
      // The re-render rebuilds every row; put focus back on the moved item.
      void this.updateComplete.then(() => {
        (this.renderRoot?.querySelector(`[data-drag-key="${targetKey}"]`) as HTMLElement | null)?.focus();
      });
    }
  }

  /** Shared per-type reorder dispatch used by drag & drop and Alt+arrow moves. */
  private _moveByKeys(srcKey: string, targetKey: string, before: boolean): void {
    const [srcType, ...srcParts] = srcKey.split(':');
    const [tgtType, ...tgtParts] = targetKey.split(':');
    if (srcType !== tgtType) return;
    // Drops can carry arbitrary text/plain (stray text dragged from anywhere);
    // Number(undefined/'x') is NaN, and splice(NaN, 1) removes index 0.
    const validIdx = (parts: string[]) => parts.every((p) => Number.isInteger(Number(p)) && Number(p) >= 0);
    if (srcParts.length === 0 || srcParts.length !== tgtParts.length || !validIdx(srcParts) || !validIdx(tgtParts)) return;

    if (srcType === 'card') {
      this._moveCard(Number(srcParts[0]), Number(tgtParts[0]), before);
    } else if (srcType === 'field') {
      const [srcCi, srcFi] = srcParts.map(Number);
      const [tgtCi, tgtFi] = tgtParts.map(Number);
      if (srcCi !== tgtCi) return;
      this._moveField(srcCi, srcFi!, tgtFi!, before);
    } else if (srcType === 'extfield') {
      const [srcCi, srcFi] = srcParts.map(Number);
      const [tgtCi, tgtFi] = tgtParts.map(Number);
      if (srcCi !== tgtCi) return;
      this._moveExtField(srcCi, srcFi!, tgtFi!, before);
    } else if (srcType === 'extcard') {
      this._moveExtCard(Number(srcParts[0]), Number(tgtParts[0]), before);
    } else if (srcType === 'virt') {
      this._moveVirtual(Number(srcParts[0]), Number(tgtParts[0]), before);
    } else if (srcType === 'zone') {
      this._moveZone(Number(srcParts[0]), Number(tgtParts[0]), before);
    } else if (srcType === 'flow') {
      this._moveFlow(Number(srcParts[0]), Number(tgtParts[0]), before);
    } else if (srcType === 'emb') {
      this._moveEmbCard(Number(srcParts[0]), Number(tgtParts[0]), before);
    } else if (srcType === 'opt' || srcType === 'eopt') {
      const [srcCi, srcFi, srcOi] = srcParts.map(Number);
      const [tgtCi, tgtFi, tgtOi] = tgtParts.map(Number);
      if (srcCi !== tgtCi || srcFi !== tgtFi) return;
      this._moveOption(srcCi!, srcFi!, srcOi!, tgtOi!, before, srcType === 'eopt');
    } else if (srcType === 'tu' || srcType === 'etu') {
      const [srcCi, srcFi, srcIi] = srcParts.map(Number);
      const [tgtCi, tgtFi, tgtIi] = tgtParts.map(Number);
      if (srcCi !== tgtCi || srcFi !== tgtFi) return;
      this._moveTuItem(srcCi!, srcFi!, srcIi!, tgtIi!, before, srcType === 'etu');
    } else if (srcType === 'pt') {
      const [srcFi, srcPi] = srcParts.map(Number);
      const [tgtFi, tgtPi] = tgtParts.map(Number);
      if (srcFi !== tgtFi) return;
      this._movePoint(srcFi!, srcPi!, tgtPi!, before);
    } else if (srcType === 'vin') {
      const [srcVi, srcIi] = srcParts.map(Number);
      const [tgtVi, tgtIi] = tgtParts.map(Number);
      if (srcVi !== tgtVi) return;
      this._moveVirtualInput(srcVi!, srcIi!, tgtIi!, before);
    } else if (srcType === 'trig') {
      const [srcVi, srcTi] = srcParts.map(Number);
      const [tgtVi, tgtTi] = tgtParts.map(Number);
      if (srcVi !== tgtVi) return;
      this._moveTrigger(srcVi!, srcTi!, tgtTi!, before);
    } else if (srcType === 'gs') {
      const [srcCi, srcFi, srcSi] = srcParts.map(Number);
      const [tgtCi, tgtFi, tgtSi] = tgtParts.map(Number);
      if (srcCi !== tgtCi || srcFi !== tgtFi) return;
      this._moveGraphSeries(srcCi!, srcFi!, srcSi!, tgtSi!, before);
    } else if (srcType === 'egs') {
      const [srcEci, srcEfi, srcSi] = srcParts.map(Number);
      const [tgtEci, tgtEfi, tgtSi] = tgtParts.map(Number);
      if (srcEci !== tgtEci || srcEfi !== tgtEfi) return;
      this._moveExtGraphSeries(srcEci!, srcEfi!, srcSi!, tgtSi!, before);
    }
  }

  private _updateExtField(eci: number, efi: number, patch: Partial<import('./types').FieldConfig>): void {
    const card = this._extCards()[eci];
    if (!card) return;
    const fields = card.fields.map((f, i) => i === efi ? mergePatch(f, patch) : f);
    this._updateExtCard(eci, { fields });
  }

  // ── Align & distribute ──────────────────────────────────────────────────────

  private _alignCards(edge: 'left' | 'centerH' | 'right' | 'top' | 'middleV' | 'bottom'): void {
    if (!this._config || this._selCards.size < 2) return;
    const indices = Array.from(this._selCards);
    const cards = this._config.cards;
    const positions = indices.map((i) => ({ i, pos: { ...cards[i]!.position } }));
    const xs = positions.map((p) => p.pos.x);
    const ys = positions.map((p) => p.pos.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const newCards = cards.map((c, idx) => {
      if (!this._selCards.has(idx)) return c;
      let { x, y } = c.position;
      // roundFrac, not round1: positions are 0-1 canvas fractions, so one
      // decimal place quantizes to 10% of the canvas and visibly jumps cards.
      if (edge === 'left')    x = roundFrac(minX);
      if (edge === 'right')   x = roundFrac(maxX);
      if (edge === 'centerH') x = roundFrac((minX + maxX) / 2);
      if (edge === 'top')     y = roundFrac(minY);
      if (edge === 'bottom')  y = roundFrac(maxY);
      if (edge === 'middleV') y = roundFrac((minY + maxY) / 2);
      return { ...c, position: { x, y } };
    });
    this._emit({ ...this._config, cards: newCards });
  }

  private _distribute(axis: 'x' | 'y'): void {
    if (!this._config || this._selCards.size < 2) return;
    const indices = Array.from(this._selCards).sort(
      (a, b) => this._config!.cards[a]!.position[axis] - this._config!.cards[b]!.position[axis],
    );
    const n = indices.length;
    const cards = this._config.cards;
    const first = cards[indices[0]!]!.position[axis];
    const last  = cards[indices[n - 1]!]!.position[axis];
    const step  = n > 1 ? (last - first) / (n - 1) : 0;
    const newCards = cards.map((c, idx) => {
      const rank = indices.indexOf(idx);
      if (rank < 0) return c;
      const coord = roundFrac(first + step * rank);
      return { ...c, position: { ...c.position, [axis]: coord } };
    });
    this._emit({ ...this._config, cards: newCards });
  }

  private _distributeCanvas(axis: 'x' | 'y'): void {
    if (!this._config || this._selCards.size < 2) return;
    const indices = Array.from(this._selCards).sort(
      (a, b) => this._config!.cards[a]!.position[axis] - this._config!.cards[b]!.position[axis],
    );
    const n = indices.length;
    const cards = this._config.cards;
    const newCards = cards.map((c, idx) => {
      const rank = indices.indexOf(idx);
      if (rank < 0) return c;
      const coord = roundFrac((rank + 1) / (n + 1));
      return { ...c, position: { ...c.position, [axis]: coord } };
    });
    this._emit({ ...this._config, cards: newCards });
  }

  private _alignGroupToCanvas(axis: 'x' | 'y'): void {
    if (!this._config || this._selCards.size < 1) return;
    const canvasCenter = 0.5;
    const indices = Array.from(this._selCards);
    const cards = this._config.cards;
    const coords = indices.map((i) => cards[i]!.position[axis]);
    const groupCenter = (Math.min(...coords) + Math.max(...coords)) / 2;
    const delta = canvasCenter - groupCenter;
    const newCards = cards.map((c, idx) => {
      if (!this._selCards.has(idx)) return c;
      return { ...c, position: { ...c.position, [axis]: roundFrac(c.position[axis] + delta) } };
    });
    this._emit({ ...this._config, cards: newCards });
  }

  private _groupCards(): void {
    if (!this._config || (this._selCards.size + this._selEmbCards.size) < 2) return;
    const groupId = 'g-' + Date.now().toString(36);
    const cards = this._config.cards.map((c, idx) =>
      this._selCards.has(idx) ? { ...c, group: groupId } : c,
    );
    const embedded_cards = this._embCards().map((ec, idx) =>
      this._selEmbCards.has(idx) ? { ...ec, group: groupId } : ec,
    );
    this._emit({ ...this._config, cards, embedded_cards });
  }

  private _ungroupCards(): void {
    if (!this._config) return;
    const cards = this._config.cards.map((c, idx) => {
      if (!this._selCards.has(idx)) return c;
      const { group: _g, ...rest } = c;
      return rest as typeof c;
    });
    const embedded_cards = this._embCards().map((ec, idx) => {
      if (!this._selEmbCards.has(idx)) return ec;
      const { group: _g, ...rest } = ec;
      return rest as typeof ec;
    });
    this._emit({ ...this._config, cards, embedded_cards });
  }

  /**
   * Gap panel: apply an exact px gap between selected-card neighbors along one axis.
   * The selection is treated as a 2D grid — members are clustered into rows (overlapping
   * vertical extent) for Column Gap, or columns (overlapping horizontal extent) for
   * Row Gap, so cards don't need to be pixel-perfectly aligned first — then within
   * each cluster, sorted along the gap axis, every member after the first (leftmost/
   * topmost) is re-spaced from its predecessor's trailing edge by exactly `gapPx`,
   * preserving each member's own anchor. Clusters of 1 (nothing to space) are left
   * alone.
   *
   * #126: membership is the raw multi-selection — `card.group` is never consulted,
   * and never was. The panel used to be gated on a grouped selection in the align
   * bar, which was the only thing that made this look group-only.
   */
  private _applySelectionGap(axis: 'x' | 'y', gapPx: number): void {
    if (!this._config) return;
    const { totalW, totalH } = computeCanvasDims(this._config);
    const totalPx = axis === 'x' ? totalW : totalH;
    const crossPx = axis === 'x' ? totalH : totalW;
    const cardsList = this._config.cards;
    const embList = this._embCards();

    type Member = {
      kind: 'card' | 'emb'; idx: number; box: CardBox; anchor: Anchor;
      crossStart: number; crossEnd: number;
    };
    const members: Member[] = [];
    const collect = (kind: 'card' | 'emb', idx: number, cfg: CardConfig | EmbeddedCardConfig): void => {
      const box = this._previewBoxes[cfg.id];
      if (!box) return;
      const anchor = (cfg.anchor ?? sd('anchor') ?? 'top-left') as Anchor;
      // Cross axis is the OTHER axis: rows overlap in y (for Column Gap), columns overlap in x (for Row Gap).
      const crossStart = (axis === 'x' ? box.y : box.x) * crossPx;
      const crossEnd = crossStart + (axis === 'x' ? box.h : box.w) * crossPx;
      members.push({ kind, idx, box, anchor, crossStart, crossEnd });
    };
    for (const idx of this._selCards) { const c = cardsList[idx]; if (c) collect('card', idx, c); }
    for (const idx of this._selEmbCards) { const ec = embList[idx]; if (ec) collect('emb', idx, ec); }
    if (members.length < 2) return;

    // Cluster by overlapping cross-axis extent (interval union) rather than requiring
    // identical positions — cards roughly in the same row/column still cluster even
    // if they aren't pixel-perfectly aligned.
    const sorted = [...members].sort((a, b) => a.crossStart - b.crossStart);
    const clusters: Member[][] = [];
    let cluster: Member[] = [];
    let clusterEnd = -Infinity;
    for (const m of sorted) {
      if (cluster.length === 0 || m.crossStart < clusterEnd) {
        cluster.push(m);
        clusterEnd = Math.max(clusterEnd, m.crossEnd);
      } else {
        clusters.push(cluster);
        cluster = [m];
        clusterEnd = m.crossEnd;
      }
    }
    if (cluster.length > 0) clusters.push(cluster);

    const cardPatch = new Map<number, { x: number; y: number }>();
    const embPatch = new Map<number, { x: number; y: number }>();

    for (const c of clusters) {
      if (c.length < 2) continue;
      c.sort((a, b) => (axis === 'x' ? a.box.x - b.box.x : a.box.y - b.box.y));
      const first = c[0]!;
      let cursorPx = (axis === 'x' ? first.box.x : first.box.y) * totalPx
        + (axis === 'x' ? first.box.w : first.box.h) * totalPx;
      for (let i = 1; i < c.length; i++) {
        const m = c[i]!;
        const sizePx = (axis === 'x' ? m.box.w : m.box.h) * totalPx;
        const newEdgePx = cursorPx + gapPx;
        const [fx, fy] = ANCHOR_FRAC[m.anchor];
        const frac = roundFrac((newEdgePx + (axis === 'x' ? fx : fy) * sizePx) / totalPx);
        const own = (m.kind === 'card' ? cardsList[m.idx] : embList[m.idx])!;
        const patch = axis === 'x' ? { x: frac, y: own.position.y } : { x: own.position.x, y: frac };
        (m.kind === 'card' ? cardPatch : embPatch).set(m.idx, patch);
        cursorPx = newEdgePx + sizePx;
      }
    }

    if (cardPatch.size === 0 && embPatch.size === 0) return;
    const cards = cardsList.map((c, idx) => cardPatch.has(idx) ? { ...c, position: cardPatch.get(idx)! } : c);
    const embedded_cards = embList.map((ec, idx) => embPatch.has(idx) ? { ...ec, position: embPatch.get(idx)! } : ec);
    this._emit({ ...this._config, cards, embedded_cards });
  }

  // ── Drag handlers ───────────────────────────────────────────────────────────

  /**
   * Keep the ribbon nav in sync with a direct-manipulation selection made in the
   * live preview (card/zone/embedded-card/flow-point clicks). Without this, a
   * preview click changes _selCard/_selField/_selZone/etc. but leaves _navPath
   * pointing at whatever screen was open before — and since the expanded
   * preview hides _renderControls() entirely while it's open, the user doesn't
   * see the mismatch until they close the window and the stale crumb path
   * dispatches against the new (often now-invalid) selection, rendering a
   * blank screen behind a breadcrumb that still shows the old location. See #29.
   */
  private _syncNavTo(tab: 'cards' | 'elements', panel: string, path: { key: string; label: string }[]): void {
    this._navigateTo(tab, panel, path);
  }

  private _onCardDown(e: PointerEvent, i: number): void {
    e.preventDefault();
    this._bgSelected = false;

    if (e.altKey) {
      // Alt-click cycles through all cards stacked under the cursor (overlays
      // fully cover their cards, so a covered card would otherwise be
      // unclickable). Selection only — no drag is armed.
      const cards = this._config?.cards ?? [];
      const boxes = this._previewBoxes;
      const area = this.renderRoot.querySelector('.ec-canvas-area') as HTMLElement | null;
      if (area && Object.keys(boxes).length > 0) {
        const rect = area.getBoundingClientRect();
        const fx = (e.clientX - rect.left) / rect.width;
        const fy = (e.clientY - rect.top) / rect.height;
        const hits = cards
          .map((c, idx) => ({ idx, box: boxes[c.id] }))
          .filter((h): h is { idx: number; box: CardBox } =>
            !!h.box && fx >= h.box.x && fx <= h.box.x + h.box.w && fy >= h.box.y && fy <= h.box.y + h.box.h)
          .map((h) => h.idx)
          .sort((a, b) => a - b);
        if (hits.length > 0) {
          const curPos = hits.indexOf(this._selCard);
          const next = curPos >= 0 ? hits[(curPos + 1) % hits.length]! : hits[0]!;
          this._selCard = next;
          this._selField = -1;
          this._syncNavTo('cards', 'mosaic', [{ key: `card:${cards[next]?.id ?? next}`, label: cards[next]?.name ?? `Card ${next + 1}` }]);
          const nextGroup = cards[next]?.group;
          this._selCards = new Set(
            nextGroup
              ? cards.map((c, idx) => ({ c, idx })).filter(({ c }) => c.group === nextGroup).map(({ idx }) => idx)
              : [next]
          );
        }
      }
      return;
    }

    this._selCard = i;
    this._selField = -1;
    this._syncNavTo('cards', 'mosaic', [{ key: `card:${this._config?.cards[i]?.id ?? i}`, label: this._config?.cards[i]?.name ?? `Card ${i + 1}` }]);
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      const next = new Set(this._selCards);
      if (next.has(i)) {
        next.delete(i);
      } else {
        next.add(i);
      }
      this._selCards = next;
      return;
    }

    // Determine group members (all cards sharing the same group, or just [i])
    const cards = this._config?.cards ?? [];
    const clickedGroup = cards[i]?.group;
    const memberIndices = clickedGroup
      ? cards.map((c, idx) => ({ c, idx })).filter(({ c }) => c.group === clickedGroup).map(({ idx }) => idx)
      : [i];

    this._selCards = new Set(memberIndices);
    this._dragCard = i;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    this._hostRect = (
      this.renderRoot.querySelector('.ec-canvas-area') as HTMLElement
    ).getBoundingClientRect();
    this._startX = e.clientX;
    this._startY = e.clientY;
    this._dragMembers = memberIndices.map((idx) => ({
      idx,
      start: { ...(cards[idx]?.position ?? { x: 0, y: 0 }) },
    }));

    // Pick up embedded card group members sharing the same group
    if (clickedGroup) {
      const embCards = this._embCards();
      const embMemberIndices = embCards
        .map((ec, idx) => ({ ec, idx }))
        .filter(({ ec }) => ec.group === clickedGroup)
        .map(({ idx }) => idx);
      this._selEmbCards = new Set(embMemberIndices);
      this._embDragMembers = embMemberIndices.map((idx) => ({
        idx,
        start: { ...(embCards[idx]?.position ?? { x: 0, y: 0 }) },
      }));
    } else {
      this._selEmbCards = new Set();
      this._embDragMembers = [];
    }
  }

  private _onCardMove(e: PointerEvent): void {
    if (this._dragCard < 0 || !this._hostRect || !this._config) return;
    const dx = (e.clientX - this._startX) / this._hostRect.width;
    const dy = (e.clientY - this._startY) / this._hostRect.height;
    const cards = this._config.cards.map((c, idx) => {
      const member = this._dragMembers.find((m) => m.idx === idx);
      if (!member) return c;
      return {
        ...c,
        position: {
          x: roundFrac(member.start.x + dx),
          y: roundFrac(member.start.y + dy),
        },
      };
    });
    const embedded_cards = this._embDragMembers.length > 0
      ? this._embCards().map((ec, idx) => {
          const member = this._embDragMembers.find((m) => m.idx === idx);
          if (!member) return ec;
          return { ...ec, position: { x: roundFrac(member.start.x + dx), y: roundFrac(member.start.y + dy) } };
        })
      : this._embCards();
    this._emit({ ...this._config, cards, embedded_cards });
  }

  private _onCardUp(e: PointerEvent): void {
    // Grid-mode snap for BOTH regular and embedded dragged members, done once
    // here (this handler runs first in the pointerup binding — see render()).
    // A single dragged card snaps its own center to the nearest intersection.
    // A group (2+ members, regular and/or embedded — they can share a `group`
    // tag) snaps as a whole: the group's bounding-box center snaps to the
    // nearest intersection and every member is translated by the same delta,
    // so relative spacing within the group is preserved.
    const geom = this._gridGeom();
    if (geom && this._config && (this._dragMembers.length > 0 || this._embDragMembers.length > 0)) {
      const { cols, rows } = geom;
      const cardsList = this._config.cards;
      const embList = this._embCards();

      type Member = { kind: 'card' | 'emb'; idx: number; box: CardBox | undefined; pos: { x: number; y: number } };
      const members: Member[] = [];
      for (const m of this._dragMembers) {
        const c = cardsList[m.idx];
        if (c) members.push({ kind: 'card', idx: m.idx, box: this._previewBoxes[c.id], pos: c.position });
      }
      for (const m of this._embDragMembers) {
        const ec = embList[m.idx];
        if (ec) members.push({ kind: 'emb', idx: m.idx, box: this._previewBoxes[ec.id], pos: ec.position });
      }

      if (members.length === 1) {
        // Snap the card's own anchor point (not always its center) to the
        // nearest intersection, and leave `anchor` as whatever the user has
        // set — it's no longer forced to 'center' on every drag.
        const only = members[0];
        const anchor = (only.kind === 'card' ? cardsList[only.idx]?.anchor : embList[only.idx]?.anchor)
          ?? sd('anchor') ?? 'top-left';
        const [fx, fy] = ANCHOR_FRAC[anchor as Anchor];
        const ax = only.box ? only.box.x + fx * only.box.w : only.pos.x;
        const ay = only.box ? only.box.y + fy * only.box.h : only.pos.y;
        const col = Math.min(cols, Math.max(0, Math.round(ax * cols)));
        const row = Math.min(rows, Math.max(0, Math.round(ay * rows)));
        const snapped = { x: roundFrac(col / cols), y: roundFrac(row / rows) };
        if (only.kind === 'card') {
          const cards = cardsList.map((c, idx) => idx === only.idx ? { ...c, position: snapped } : c);
          this._emit({ ...this._config, cards });
        } else {
          const embedded_cards = embList.map((ec, idx) => idx === only.idx ? { ...ec, position: snapped } : ec);
          this._emit({ ...this._config, embedded_cards });
        }
      } else if (members.length >= 2) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const m of members) {
          if (m.box) {
            minX = Math.min(minX, m.box.x); minY = Math.min(minY, m.box.y);
            maxX = Math.max(maxX, m.box.x + m.box.w); maxY = Math.max(maxY, m.box.y + m.box.h);
          } else {
            minX = Math.min(minX, m.pos.x); minY = Math.min(minY, m.pos.y);
            maxX = Math.max(maxX, m.pos.x); maxY = Math.max(maxY, m.pos.y);
          }
        }
        const groupCenter = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
        const col = Math.min(cols, Math.max(0, Math.round(groupCenter.x * cols)));
        const row = Math.min(rows, Math.max(0, Math.round(groupCenter.y * rows)));
        const delta = { x: col / cols - groupCenter.x, y: row / rows - groupCenter.y };

        const cards = cardsList.map((c, idx) => {
          if (!this._dragMembers.some((m) => m.idx === idx)) return c;
          return { ...c, position: { x: roundFrac(c.position.x + delta.x), y: roundFrac(c.position.y + delta.y) } };
        });
        const embedded_cards = embList.map((ec, idx) => {
          if (!this._embDragMembers.some((m) => m.idx === idx)) return ec;
          return { ...ec, position: { x: roundFrac(ec.position.x + delta.x), y: roundFrac(ec.position.y + delta.y) } };
        });
        this._emit({ ...this._config, cards, embedded_cards });
      }
    }
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    this._dragCard = -1;
    // The member arrays must not outlive the drag: this handler fires on every
    // dialog-level pointerup, and stale members would re-run the grid snap
    // above (and emit) on any later click in the expanded editor.
    this._dragMembers = [];
    this._embDragMembers = [];
  }

  private _onPointDown(e: PointerEvent, pi: number): void {
    e.preventDefault();
    e.stopPropagation();
    this._selPoint = pi;
    if (!this._config) return;
    const flow = this._flows()[this._selFlow];
    if (!flow) return;
    const point = flow.points[pi];
    if (!point) return;
    if (e.shiftKey) {
      this._removeFlowPoint(this._selFlow, pi);
      this._selPoint = -1;
      return;
    }
    this._syncNavTo('elements', 'flows', [
      { key: `flow:${flow.id}`, label: flow.name ?? flow.id },
      { key: `pt:${pi}`, label: `Point ${pi + 1}` },
    ]);
    if (point.card != null) return; // anchored — select only, no drag
    this._dragPoint = pi;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    this._pRect = (this.renderRoot.querySelector('.ec-canvas-area') as HTMLElement).getBoundingClientRect();
    this._pStartX = e.clientX;
    this._pStartY = e.clientY;
    this._pStartPos = { x: point.x ?? 0, y: point.y ?? 0 };
    this._snapAxis = null;
  }

  private _onPointMove(e: PointerEvent): void {
    if (this._dragPoint < 0 || !this._pRect || !this._config) return;
    let x = roundFrac(this._pStartPos.x + (e.clientX - this._pStartX) / this._pRect.width);
    let y = roundFrac(this._pStartPos.y + (e.clientY - this._pStartY) / this._pRect.height);
    const rawX = x, rawY = y;

    if (e.ctrlKey) {
      const flow = this._flows()[this._selFlow];
      if (flow && this._pRect) {
        const cards = this._config.cards;
        const boxes = this._previewBoxes;
        const pi = this._dragPoint;
        const prevPt = pi > 0 ? flow.points[pi - 1] : null;
        const nextPt = pi < flow.points.length - 1 ? flow.points[pi + 1] : null;
        const prev = prevPt ? resolveFlowPoint(prevPt, cards, boxes) : null;
        const next = nextPt ? resolveFlowPoint(nextPt, cards, boxes) : null;
        const rw = this._pRect.width;
        const rh = this._pRect.height;

        if (prev && next) {
          // Middle point: pick the L-elbow whose corner is closest in pixel space.
          const d1 = Math.hypot((x - prev.x) * rw, (y - next.y) * rh);
          const d2 = Math.hypot((x - next.x) * rw, (y - prev.y) * rh);
          if (d1 <= d2) { x = prev.x; y = next.y; }
          else           { x = next.x; y = prev.y; }
        } else {
          const nb = prev ?? next;
          if (nb) {
            // Commit snap axis on first significant movement; hold it for the
            // rest of the drag so the direction cannot flip mid-stroke.
            if (this._snapAxis === null) {
              const dragDx = e.clientX - this._pStartX;
              const dragDy = e.clientY - this._pStartY;
              const dragMag = Math.hypot(dragDx, dragDy);
              if (dragMag > 4) {
                this._snapAxis = Math.abs(dragDx) >= Math.abs(dragDy) ? 'y' : 'x';
              } else {
                // Not moved enough to commit — use position to choose tentatively.
                this._snapAxis = Math.abs(x - nb.x) * rw < Math.abs(y - nb.y) * rh ? 'x' : 'y';
              }
            }
            if (this._snapAxis === 'x') x = nb.x;
            else                         y = nb.y;
          }
        }
        // Snapped axis keeps neighbour's exact value; free axis keeps roundFrac precision.
      }
    }

    // Proximity anchor snap — uses raw cursor pos, overrides ctrl snap
    {
      const SNAP_PX = 24;
      let snapped = false;
      outer: for (const card of this._config.cards) {
        const box = this._previewBoxes[card.id];
        if (!box) continue;
        for (const side of ['top', 'right', 'bottom', 'left'] as const) {
          let ax: number, ay: number;
          switch (side) {
            case 'top':    ax = box.x + box.w / 2; ay = box.y;             break;
            case 'right':  ax = box.x + box.w;     ay = box.y + box.h / 2; break;
            case 'bottom': ax = box.x + box.w / 2; ay = box.y + box.h;     break;
            case 'left':   ax = box.x;             ay = box.y + box.h / 2; break;
          }
          if (Math.hypot((rawX - ax) * this._pRect.width, (rawY - ay) * this._pRect.height) <= SNAP_PX) {
            x = ax; y = ay;
            this._snapAnchor = { card: card.id, side };
            snapped = true;
            break outer;
          }
        }
      }
      if (!snapped) this._snapAnchor = null;
    }

    this._updateFlowPoint(this._selFlow, this._dragPoint, { x, y });
  }

  private _onPointUp(e: PointerEvent): void {
    if (this._dragPoint >= 0) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      if (this._snapAnchor) {
        this._updateFlowPoint(this._selFlow, this._dragPoint, { card: this._snapAnchor.card, side: this._snapAnchor.side, x: undefined, y: undefined });
      }
    }
    this._dragPoint = -1;
    this._snapAnchor = null;
    this._snapAxis = null;
  }

  private _ptSegDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
    const dx = bx - ax, dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
    return Math.hypot(px - ax - t * dx, py - ay - t * dy);
  }

  private _onCanvasAreaClick(e: MouseEvent): void {
    // Deselect the background unless the click landed on it (keeps its handles up).
    if (!(e.target as HTMLElement).closest('.ec-bg-ov,.ec-bg-resize')) this._bgSelected = false;
    const flows = this._flows();
    if (flows.length === 0) return;
    // Ignore clicks that landed on a handle or interactive element. NOT
    // .ec-flow-hit (#71's wide double-click target for a flow line): this
    // method's own proximity scan below is what a single click on a flow line
    // already used to select that flow, pre-dating #71 — excluding the hit
    // target here would have silently broken that, not guarded anything real.
    if ((e.target as HTMLElement).closest('.ec-handle,.ec-card-ov,.ec-emb-handle,.ec-emb-ov,.ec-zone-handle,.ec-flow-node,.ec-snap')) return;
    const area = e.currentTarget as HTMLElement;
    const rect = area.getBoundingClientRect();
    const cxPx = e.clientX - rect.left;
    const cyPx = e.clientY - rect.top;
    const cards = this._config?.cards ?? [];
    const THRESHOLD = 10; // px
    let nearest = -1, nearestDist = Infinity;
    for (let fi = 0; fi < flows.length; fi++) {
      const pts = flows[fi]!.points.map((pt) => {
        const p = resolveFlowPoint(pt, cards, this._previewBoxes);
        return { x: p.x * rect.width, y: p.y * rect.height };
      });
      for (let i = 0; i < pts.length - 1; i++) {
        const d = this._ptSegDist(cxPx, cyPx, pts[i]!.x, pts[i]!.y, pts[i + 1]!.x, pts[i + 1]!.y);
        if (d < nearestDist) { nearestDist = d; nearest = fi; }
      }
    }
    if (nearest >= 0 && nearestDist <= THRESHOLD) {
      this._selFlow = nearest;
      this._selPoint = -1;
      // Same stale-crumb class _onCardDown/_onZoneDown were fixed for (#29):
      // without syncing the nav, closing the expanded editor shows the old
      // screen while _selFlow points at this flow.
      const flow = flows[nearest]!;
      this._syncNavTo('elements', 'flows', [{ key: `flow:${flow.id}`, label: flow.name ?? flow.id }]);
    }
  }

  /**
   * Keep the <dialog class="ec-preview"> element's native state in sync with
   * _previewExpanded. Collapsed: open non-modal, laid out inline like the old
   * div. Expanded: showModal() promotes it to the browser top layer, where
   * position:fixed resolves against the real viewport — immune to HA's
   * dialog resizing underneath (the cause of the old gap/jumping bugs).
   */
  private _syncPreviewDialog(): void {
    const dialog = this.renderRoot?.querySelector('dialog.ec-preview') as HTMLDialogElement | null;
    if (!dialog) return;
    const modal = dialog.matches(':modal');
    if (this._previewExpanded && !modal) {
      if (dialog.open) dialog.close();
      dialog.showModal();
    } else if (!this._previewExpanded && (modal || !dialog.open)) {
      if (dialog.open) dialog.close();
      dialog.show();
    }
  }

  /**
   * Expanded mode: size .ec-canvas-area so the whole canvas fits. The bottom
   * bar height varies, so measure the overlay's real box and pick the largest
   * width that keeps height within (overlay height − bottom bar). The canvas
   * inside is width:100% with aspect-ratio totalW/totalH, so the area's
   * height follows its width and %-positioned handles stay aligned.
   */
  private _sizeExpandedCanvas(): void {
    const area = this.renderRoot?.querySelector('.ec-canvas-area') as HTMLElement | null;
    if (!area) return;
    if (!this._previewExpanded) {
      if (area.style.width) area.style.removeProperty('width');
      return;
    }
    const preview = this.renderRoot?.querySelector('.ec-preview') as HTMLElement | null;
    if (!preview) return;
    if (!this._previewRO) {
      this._previewRO = new ResizeObserver(() => this._sizeExpandedCanvas());
      this._previewRO.observe(preview);
      window.addEventListener('resize', this._onWindowResize);
    }
    const { totalW, totalH } = computeCanvasDims(this._config);
    if (!totalW || !totalH) return;
    const bar = this.renderRoot?.querySelector('.ec-expanded-bottom-bar') as HTMLElement | null;
    // Dialog height fits its content, so measure against the viewport (real
    // in the top layer), not the preview box — that would be circular.
    const availW = preview.clientWidth;
    const availH = window.innerHeight - (bar?.offsetHeight ?? 0);
    if (availW <= 0 || availH <= 0) return;
    const px = `${Math.floor(Math.min(availW, (availH * totalW) / totalH))}px`;
    if (area.style.width !== px) area.style.width = px;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    // Window-level so it still works when focus fell to <body> (clicking a
    // non-focusable area); text-entry origins anywhere are filtered inside
    // the handler, and disconnectedCallback removes it when the editor goes.
    window.addEventListener('keydown', this._onUndoKeydown);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    window.removeEventListener('keydown', this._onUndoKeydown);
    clearTimeout(this._toastTimer);
    this._previewRO?.disconnect();
    this._previewRO = undefined;
    window.removeEventListener('resize', this._onWindowResize);
  }

  /**
   * HA hands the editor a fresh hass object on every state change anywhere in
   * the instance — the same churn the runtime card gates in its own
   * shouldUpdate. Re-rendering the whole editor for entities the config never
   * references is what made it sluggish on busy installs (#104): a hass-only
   * update now renders only when a referenced entity actually changed.
   * Skipping a render would starve the components whose template binding is
   * their only hass feed, so those get the fresh hass pushed directly instead.
   * Anything besides hass (config, nav, selections, …) must render: Lit clears
   * the changed map after a rejected update, so returning false would discard
   * those changes permanently, not defer them.
   */
  protected override shouldUpdate(changed: PropertyValues): boolean {
    if (!changed.has('hass') || changed.size > 1) return true;
    const oldHass = changed.get('hass') as HomeAssistant | undefined;
    if (!oldHass || !this.hass) return true;
    for (const id of this._referencedEntities()) {
      if (oldHass.states[id] !== this.hass.states[id]) return true;
    }
    this._forwardHass();
    return false;
  }

  // Cached per config object, mirroring the runtime's cache: setConfig/_emit
  // replace the config wholesale, so reference identity is a sound key.
  private _refEntityCache?: { config: MosaicCanvasConfig; ids: string[] };

  private _referencedEntities(): string[] {
    const config = this._config;
    if (!config) return [];
    if (this._refEntityCache?.config === config) return this._refEntityCache.ids;
    const ids = collectReferencedEntities(config);
    this._refEntityCache = { config, ids };
    return ids;
  }

  /**
   * Push a fresh hass to everything that keeps its own copy, in place of the
   * render shouldUpdate just skipped. ha-service-picker deliberately gets the
   * pseudo-action wrapper — the same object its binding in _actionPicker
   * carries; handing it the raw hass would drop the Mosaic actions from its
   * list. The preview canvas runs its own shouldUpdate gate against what we
   * forward, and the native embedded editor lives outside our templates
   * entirely (appended into #emb-native-slot), so it is addressed directly.
   */
  private _forwardHass(): void {
    const root = this.renderRoot;
    const hass = this.hass;
    if (!root || !hass) return;
    const push = (el: Element, h: HomeAssistant | undefined): void => {
      (el as unknown as { hass?: HomeAssistant }).hass = h;
    };
    root.querySelectorAll('ha-entity-picker, ha-icon-picker, ha-selector, ha-service-control, ha-navigation-picker')
      .forEach((el) => push(el, hass));
    const svcPickers = root.querySelectorAll('ha-service-picker');
    if (svcPickers.length) {
      const wrapped = this._actionHass();
      svcPickers.forEach((el) => push(el, wrapped));
    }
    root.querySelectorAll(TAG_CANVAS).forEach((el) => push(el, hass));
    if (this._embNativeEditor) push(this._embNativeEditor, hass);
  }

  /**
   * True when moving focus programmatically is safe — i.e. the user is not
   * currently typing (#125). Checks the shadow root's own `activeElement`,
   * which is where a focused control inside the editor's template reports, and
   * walks nested roots so a control inside an HA sub-component still counts.
   */
  private _focusEdgeGuard(): boolean {
    let root: DocumentOrShadowRoot | null = this.renderRoot as unknown as DocumentOrShadowRoot;
    let el = root?.activeElement ?? null;
    // A focused control inside a nested shadow root surfaces as its host here,
    // so follow the chain down to the real leaf before testing it.
    while (el && (el as Element & { shadowRoot?: ShadowRoot | null }).shadowRoot?.activeElement) {
      root = (el as Element & { shadowRoot: ShadowRoot }).shadowRoot;
      el = root.activeElement;
    }
    if (!el) return true;
    const tag = el.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return false;
    return !(el as HTMLElement).isContentEditable;
  }

  protected override updated(changed: PropertyValues): void {
    // Config reaches the preview canvas imperatively (its template binding
    // carries hass only), so re-push it when it changes or when the expanded
    // preview (re)mounts — not on every update (#104).
    if (this._config && (changed.has('_config') || changed.has('_previewExpanded'))) {
      this.renderRoot?.querySelectorAll<MosaicCanvas>(TAG_CANVAS)
        .forEach((el) => el.setConfig(this._config!));
    }
    this._syncPreviewDialog();
    this._sizeExpandedCanvas();
    // The colour popup handles Escape on its wrapper, which only sees the key if
    // focus is inside. A mouse click doesn't focus a <button> on every platform,
    // so put focus on the popup itself once, when it opens.
    if (!this._cpOpenId) {
      this._cpFocusedId = null;
    } else if (this._cpFocusedId !== this._cpOpenId) {
      const pop = this.renderRoot?.querySelector('.ec-cp-popup') as HTMLElement | null;
      if (pop) {
        pop.focus({ preventScroll: true });
        this._cpFocusedId = this._cpOpenId;
      }
    }
    // .ec-panel-body is the single scroll container at every nav depth, so a
    // drill-down would otherwise open pre-scrolled and popping would lose the
    // parent list position. Deeper = start at top; shallower = restore.
    const scrollKey = this._navScrollKey();
    if (scrollKey !== this._lastScrollKey) {
      const depth = (this._navPanel ? 1 : 0) + this._navPath.length;
      const body = this.renderRoot?.querySelector('.ec-panel-body') as HTMLElement | null;
      if (body) body.scrollTop = depth < this._lastScrollDepth ? (this._panelScroll.get(scrollKey) ?? 0) : 0;
      // Move focus with navigation so keyboard/screen-reader users land on the
      // new screen's header instead of restarting from the top of the editor.
      // preventScroll keeps the restore above authoritative.
      (this.renderRoot?.querySelector('.ec-panel-header-title') as HTMLElement | null)?.focus({ preventScroll: true });
      this._lastScrollKey = scrollKey;
      this._lastScrollDepth = depth;
    }
    /**
     * #125: both of these are edge-triggered, not per-render. The canvas needs
     * keyboard focus for its nudge/delete shortcuts and the flow-name input
     * should be ready to type into, but re-taking focus on *every* update stole
     * the caret out of whatever the user was typing in — the bottom bar's gap
     * and quick-panel number inputs sit inside the expanded editor, and a hass
     * change on any referenced entity is enough to re-render mid-keystroke.
     * `_focusEdgeGuard` additionally declines to move focus that already sits in
     * a text control, covering any other path that lands here while typing.
     */
    if (this._previewExpanded && !this._wasPreviewExpanded && this._focusEdgeGuard()) {
      (this.renderRoot?.querySelector('.ec-preview') as HTMLElement | null)?.focus();
    }
    if (this._showAddFlowInput && !this._wasShowAddFlowInput && this._focusEdgeGuard()) {
      (this.renderRoot?.querySelector('.ec-flow-name-input') as HTMLInputElement | null)?.focus();
    }
    this._wasPreviewExpanded = this._previewExpanded;
    this._wasShowAddFlowInput = this._showAddFlowInput;
    if (this._embEditorOpen && this._embNativeEditor) {
      const slot = this.renderRoot.querySelector('#emb-native-slot') as HTMLElement | null;
      if (slot && !slot.contains(this._embNativeEditor)) {
        slot.innerHTML = '';
        slot.appendChild(this._embNativeEditor);
        // Re-push setConfig and hass after DOM connection — many HA editors ignore
        // property assignments made before connectedCallback fires.
        const cfg = this._embEditorConfig ?? (this._embEditorTarget ? this._embConfig(this._embEditorTarget) : undefined);
        if (cfg) {
          const el = this._embNativeEditor as any;
          try { el.setConfig?.(cfg); } catch { /* noop */ }
          el.value = cfg; // hui-card-element-editor uses .value
        }
        (this._embNativeEditor as any).hass = this.hass;
      }
    }
    this._syncCustomColorVars();
    this._pickerStyleRetries = 0;
    this._stylePickers();
  }

  /**
   * Mirror the user's `--mccust_*` registry — both `custom_colors` and
   * `custom_vars` — onto the editor host.
   *
   * The runtime card emits these on its own wrapper (`mosaic-canvas.ts`), but
   * the editor never did — so a colour picked in CSS Mode rendered correctly
   * on the dashboard and came back as an empty swatch in the very picker that
   * offered it. Custom properties inherit through shadow boundaries, so
   * setting them on the host reaches every swatch, chip and preview in the
   * tree, including the ones inside HA's own pickers.
   *
   * This does not breach the preview boundary rule: `--mccust_*` is the shared
   * user domain, not an editor token, and the previewed card writes the same
   * values onto itself anyway. Values may reference each other or a theme var
   * (the Custom Colors row accepts any CSS colour expression), which resolves
   * naturally once the whole set is present on one element.
   */
  private _syncCustomColorVars(): void {
    const pairs = customVarStyles(this._config?.defaults);
    const names = pairs.map(([prop]) => prop.slice('--mccust_'.length));
    // Renaming or deleting an entry must take its property with it, or the
    // stale name keeps resolving and the picker lies about what still exists.
    for (const stale of this._mccustApplied) {
      if (!names.includes(stale)) this.style.removeProperty(`--mccust_${stale}`);
    }
    for (const [prop, value] of pairs) this.style.setProperty(prop, value);
    this._mccustApplied = names;
  }

  /**
   * Style every HA picker in the editor, then schedule a single retry if any
   * picker's inner shadow chain hasn't mounted yet. Entity and icon pickers
   * share one retry budget so they can't starve each other.
   */
  private _stylePickers(): void {
    const pending = [this._styleEntityPickers(), this._styleWalkedPickers()].some(Boolean);
    // Inner HA chain can take a few frames to mount; retry (bounded ~1s) until
    // every picker is styled. Budget resets on each real updated() call.
    if (pending && !this._pickerStyleScheduled && this._pickerStyleRetries < 60) {
      this._pickerStyleScheduled = true;
      this._pickerStyleRetries++;
      requestAnimationFrame(() => {
        this._pickerStyleScheduled = false;
        this._stylePickers();
      });
    }
  }

  /** The scoped stylesheet injected into a picker's ha-combo-box-item shadow root. */
  private _injectPickerStyle(cbi: HTMLElement | null | undefined): boolean {
    const root = cbi?.shadowRoot;
    if (!root) return false;
    if (root.querySelector('style[data-mc-picker]')) return true;
    const s = document.createElement('style');
    s.setAttribute('data-mc-picker', '');
    // Sized to match .ec-input: 15px text + 5px vertical padding + 1px border
    // ≈ 30px tall, 6px radius. Material's md-item carries its own min-height and
    // padding via :host rules in its own shadow root; a rule targeting md-item
    // from this (parent) scope outranks those, so the height actually applies.
    // The leading icon is trimmed to 20px so it can't hold the row open.
    s.textContent = `
      :host {
        border-radius: 6px !important;
        min-height: ${MosaicCanvasEditor.PICKER_HEIGHT}px !important;
      }
      :host::after, :host::before { content: none !important; }
      #item > md-item {
        border-radius: 6px !important;
        color: var(--mce-primary) !important;
        min-height: ${MosaicCanvasEditor.PICKER_HEIGHT}px !important;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        font-size: 15px !important;
        --mdc-icon-size: 20px;
      }
    `;
    root.appendChild(s);
    return true;
  }

  /** Height of an .ec-input, matched by the HA pickers so every field row lines up. */
  private static readonly PICKER_HEIGHT = 30;

  /**
   * Breadth-first walk through nested shadow roots for the first match. Used by
   * the icon picker, whose internal chain differs from the entity picker's and
   * has moved between HA releases — walking is more durable than hard-coding it.
   */
  private _findInShadow(start: HTMLElement, selector: string, maxDepth = 6): HTMLElement | null {
    let level: HTMLElement[] = [start];
    for (let d = 0; d < maxDepth && level.length; d++) {
      const next: HTMLElement[] = [];
      for (const el of level) {
        const sr = el.shadowRoot;
        if (!sr) continue;
        const hit = sr.querySelector(selector) as HTMLElement | null;
        if (hit) return hit;
        sr.querySelectorAll('*').forEach((c) => {
          if ((c as HTMLElement).shadowRoot) next.push(c as HTMLElement);
        });
      }
      level = next;
    }
    return null;
  }

  /**
   * Pickers whose Material row is found by walking rather than by the entity
   * picker's known chain: <ha-icon-picker>, the attribute <ha-selector>
   * (.ec-attr-picker, which sits two boundaries further up — ha-selector →
   * ha-selector-attribute → ha-attribute-picker → the generic chain) and
   * <ha-service-picker>. Their internal chains differ from each other and have
   * moved between HA releases, so walking is more durable than hard-coding a
   * path for each. A picker whose chain holds no ha-combo-box-item at all just
   * stays "pending" until the bounded retry budget in _stylePickers runs out
   * and keeps the host-level style only — no error, no infinite loop.
   * Returns true if any is still pending.
   */
  private static readonly _WALKED_PICKERS = ['ha-icon-picker', '.ec-attr-picker', 'ha-service-picker', '.ec-nav-picker'];

  private _styleWalkedPickers(): boolean {
    let pending = false;
    for (const sel of MosaicCanvasEditor._WALKED_PICKERS) {
      const pickers = this.renderRoot?.querySelectorAll(sel);
      if (!pickers || pickers.length === 0) continue;
      pickers.forEach((p) => {
        if (this._styledPickers.has(p)) return;
        // Depth 8: the attribute selector's row sits ~6 levels down, deeper
        // than the icon picker's. BFS returns the shallowest match, so a
        // larger bound can't change what the shallower pickers resolve to.
        const cbi = this._findInShadow(p as HTMLElement, 'ha-combo-box-item', 8);
        if (this._injectPickerStyle(cbi)) this._styledPickers.add(p);
        else pending = true;
      });
    }
    return pending;
  }

  /**
   * HA's <ha-entity-picker> renders its field as a Material <md-item> several
   * shadow roots deep (ha-entity-picker → ha-generic-picker → ha-picker-field →
   * ha-combo-box-item → md-item). Shadow encapsulation blocks our stylesheet
   * from reaching it, so match the editor's own rounded/HA-token form controls
   * by injecting a scoped <style> into each picker's ha-combo-box-item shadow
   * root: round all four corners (HA leaves the bottom flat), drop the 1px
   * ::after divider line, and tint the item text with --primary-color. Runs from
   * updated() (idempotent — skips roots already styled); retries on the next
   * frame while any picker's inner chain hasn't rendered yet.
   */
  private _styleEntityPickers(): boolean {
    const pickers = this.renderRoot?.querySelectorAll('ha-entity-picker');
    if (!pickers || pickers.length === 0) return false;
    let pending = false;
    pickers.forEach((p) => {
      if (this._styledPickers.has(p)) return;
      const cbi = (p as HTMLElement).shadowRoot?.querySelector('ha-generic-picker')?.shadowRoot
        ?.querySelector('ha-picker-field')?.shadowRoot
        ?.querySelector('ha-combo-box-item') as HTMLElement | null | undefined;
      if (this._injectPickerStyle(cbi)) this._styledPickers.add(p);
      else pending = true;
    });
    return pending;
  }

  /**
   * Icon input backed by HA's <ha-icon-picker> (searchable, with previews),
   * replacing the plain `mdi:…` text inputs. Styled to match the entity picker
   * via _styleWalkedPickers.
   */
  private _iconPicker(
    value: string | undefined,
    onChange: (v: string | undefined) => void,
    placeholder?: string,
  ): TemplateResult {
    return html`<ha-icon-picker
      .hass=${this.hass}
      .value=${value ?? ''}
      .placeholder=${placeholder ?? ''}
      @value-changed=${(e: Event) => {
        const v = (e as CustomEvent<{ value: string }>).detail.value;
        onChange(v || undefined);
      }}
    ></ha-icon-picker>`;
  }

  /**
   * Standard entity target: <ha-entity-picker>, an adjacent "Virtual Entity"
   * dropdown (this card's virtuals aren't real hass entities so the native
   * picker can't offer them), and — when `onAttribute` is passed — an
   * attribute picker scoped to whichever entity is selected. Used at every
   * entity-target site in both editors so the three behave identically
   * everywhere.
   *
   * The attribute field is an <ha-selector> with an `attribute` selector, not
   * an <ha-attribute-picker> directly — so it renders ha-selector-attribute →
   * ha-attribute-picker → the generic picker chain, putting its Material row
   * two boundaries further down than the entity picker's. It carries
   * .ec-attr-picker so the house field style can target it without catching
   * any other ha-selector we might render later.
   */
  private _entitySelector(opts: {
    label?: string;
    entity: string | undefined;
    onEntity: (v: string | undefined) => void;
    includeVirtuals?: boolean;
    attribute?: string;
    onAttribute?: (v: string | undefined) => void;
    /** Shown as a hint when attribute is unset (e.g. derived from options_attribute). */
    attributePlaceholder?: string;
  }): TemplateResult {
    const { label = 'Entity', entity, onEntity, includeVirtuals = true, attribute, onAttribute, attributePlaceholder } = opts;
    const isVirtual = entity?.startsWith('virtual:') ?? false;
    // No entity picked yet: keep the row (nothing to judge). Entity picked:
    // only show it once we know there's something to pick from.
    const entityHasAttrs = !entity || Object.keys(this.hass?.states[entity]?.attributes ?? {}).length > 0;

    return html`
      ${this._row(label,
        isVirtual
          ? html`<div style="display:flex;gap:4px;align-items:center;">
              <span class="ec-input" style="flex:1;opacity:0.8;">
                ${this._virtuals().find((v) => `virtual:${v.id}` === entity)?.name ?? entity}
              </span>
              <button class="ec-btn-clear" @click=${() => onEntity(undefined)} title="Switch to real entity">✕</button>
            </div>`
          : html`<ha-entity-picker
              .hass=${this.hass}
              .value=${entity ?? ''}
              allow-custom-entity
              @value-changed=${(e: Event) =>
                onEntity((e as CustomEvent<{ value: string }>).detail.value)}
            ></ha-entity-picker>`,
        'The entity this reads its value from.')}
      ${includeVirtuals && !isVirtual && this._virtuals().length > 0 ? this._row('Virtual Entity',
        html`<select class="ec-select"
          .value=${''}
          @change=${(e: Event) => {
            const v = (e.target as HTMLSelectElement).value;
            if (v) onEntity(v);
            (e.target as HTMLSelectElement).value = '';
          }}
        >
          <option value="">(pick a virtual)</option>
          ${this._virtuals().map((v) => html`<option value=${'virtual:' + v.id}>${v.name}</option>`)}
        </select>`,
        'Use a virtual entity from Elements ▸ Virtual Entities instead of a real one. Picking one replaces the entity above.') : nothing}
      ${onAttribute && !isVirtual && entityHasAttrs ? this._row('Attribute',
        html`<ha-selector
          class="ec-attr-picker"
          .hass=${this.hass}
          .selector=${{ attribute: { entity_id: entity || undefined } }}
          .value=${attribute}
          .placeholder=${attributePlaceholder}
          .required=${false}
          @value-changed=${(e: Event) => {
            const v = (e as CustomEvent<{ value: unknown }>).detail.value;
            onAttribute(typeof v === 'string' && v ? v : undefined);
          }}
        ></ha-selector>`,
        "Read one of the entity's attributes instead of its state.") : nothing}
    `;
  }

  // ── Reusable form-row helpers ───────────────────────────────────────────────

  /**
   * `showCss` renders the box's own "Additional CSS" row. Callers that already
   * expose a CSS row of their own pass false, so a panel never shows two.
   */
  // DRIFT: adding/removing/renaming a row here must be mirrored in
  // BOX_STYLE_TERMS — the hidden search vocabulary for every section that
  // renders this group (#61).
  private _boxRows(prefix: string, box: BoxStyle, update: (p: Partial<BoxStyle>) => void, showCss = true, radiusHint = 'Rounds the corners of the box.'): TemplateResult {
    return html`
      ${this._gradientRows({
        id: `${prefix}-bg`,
        label: 'Background',
        toLabel: 'Gradient to',
        colorHint: "The box's fill colour. Leave blank for no fill, so whatever sits behind shows through.",
        color: box.background,
        color2: box.background2,
        angle: box.background_angle,
        setColor: (v) => update({ background: v }),
        setColor2: (v) => update({ background2: v }),
        setAngle: (v) => update({ background_angle: v }),
        clearGradient: () => update({ background2: undefined, background_angle: undefined }),
        onClearColor: () => update({ background: undefined, background_alpha: undefined }),
      })}

      ${this._row('Opacity',
        html`<div class="ec-opacity-row">
          <input type="range" min="0" max="1" step="0.01"
            .value=${String(box.background_alpha ?? sd('box_background_alpha') ?? 1)}
            @input=${(e: Event) => {
              const v = parseFloat((e.target as HTMLInputElement).value);
              update({ background_alpha: v });
            }}
          />
          <span class="ec-opacity-val">${Math.round((box.background_alpha ?? sd('box_background_alpha') ?? 1) * 100)}%</span>
          <button class="ec-btn-clear" @click=${() => update({ background_alpha: undefined })} title="Clear">✕</button>
        </div>`,
        'How opaque the background colour is. The border and contents are unaffected.')}

      ${this._row('Border',
        html`<input type="checkbox" .checked=${box.border ?? false}
          @change=${(e: Event) => update({ border: (e.target as HTMLInputElement).checked })}
        />`,
        'Draws a border around the box, in Border Color below.')}

      ${box.border ? html`
        ${this._row('Border Color', this._colorPicker(`${prefix}-col`, box.color, (v) => update({ color: v })),
          'Colour of the border — not a fill. The fill is Background above.')}

        ${this._numRow('Border width (px)', { value: box.border_width, onChange: (v) => update({ border_width: v }), min: 0, placeholder: '1',
          hint: 'Thickness of the border line.' })}
      ` : nothing}

      ${this._numRow('Radius (px)', { value: box.radius, onChange: (v) => update({ radius: v }), min: 0, placeholder: '0',
        hint: radiusHint })}

      ${this._numRow('Padding (px)', { value: box.padding, onChange: (v) => update({ padding: v }), min: 0, placeholder: '0',
        hint: 'Space between the edge of the box and its contents.' })}

      ${this._row('Shadow',
        html`<input type="checkbox" .checked=${box.shadow ?? false}
          @change=${(e: Event) => update({ shadow: (e.target as HTMLInputElement).checked })}
        />`,
        'Casts a shadow behind the box, shaped by the rows below.')}

      ${box.shadow ? html`
        ${this._row('Shadow type',
          html`<select class="ec-select"
            .value=${box.shadow_mode ?? sd('box_shadow_mode') ?? 'drop'}
            @change=${(e: Event) => {
              const v = (e.target as HTMLSelectElement).value;
              // 'drop' is the seed, so it is stored as unset — the common case
              // keeps the YAML clean, the same idiom as the dimming presets.
              update({ shadow_mode: v === 'box' ? 'box' : undefined });
            }}
          >
            <option value="drop" .selected=${(box.shadow_mode ?? 'drop') === 'drop'}>Drop — offset, directional</option>
            <option value="box" .selected=${box.shadow_mode === 'box'}>Box — even halo all round</option>
          </select>`,
          'Drop casts to one side, shaped by the offsets. Box surrounds the box evenly — the glow look, with blur and spread to tune its reach.')}

        ${this._row('Shadow color', this._colorPicker(`${prefix}-shcol`, box.shadow_color, (v) => update({ shadow_color: v })),
          'Colour of the shadow. Leave blank for a translucent black.')}

        ${(box.shadow_mode ?? sd('box_shadow_mode') ?? 'drop') !== 'box' ? html`
          ${this._numRow('Shadow offset X (px)', { value: box.shadow_x, onChange: (v) => update({ shadow_x: v }), placeholder: '0',
            hint: 'Horizontal distance of the shadow. Negative moves it left.' })}

          ${this._numRow('Shadow offset Y (px)', { value: box.shadow_y, onChange: (v) => update({ shadow_y: v }), placeholder: '2',
            hint: 'Vertical distance of the shadow. Negative moves it up.' })}
        ` : nothing}

        ${this._numRow('Shadow blur (px)', { value: box.shadow_blur, onChange: (v) => update({ shadow_blur: v }), min: 0, placeholder: '8',
          hint: 'How soft the shadow edge is. 0 is a hard edge.' })}

        ${this._numRow('Shadow spread (px)', { value: box.shadow_spread, onChange: (v) => update({ shadow_spread: v }), placeholder: '0',
          hint: 'Grows the shadow in every direction. Negative shrinks it.' })}
      ` : nothing}

      ${showCss ? this._cssRow(box.extra_css, (v) => update({ extra_css: v })) : nothing}

      ${this._numRow('Blur (px)', { value: box.blur, onChange: (v) => update({ blur: v }), min: 0, placeholder: '0',
        hint: "Blurs what is behind the box — the background image, or the dashboard behind a popover. The box's own contents stay sharp." })}
    `;
  }

  /**
   * `showFontSize` / `showColor` hide those rows for callers where the property
   * is owned elsewhere — the selector's option parts take size AND colour (with
   * active/inactive states) from Control Style, so offering them again here
   * would silently win over it.
   */
  // DRIFT: row changes here must be mirrored in TEXT_STYLE_TERMS (hidden
  // search vocabulary, #61).
  private _textRows(
    prefix: string,
    ts: TextStyle,
    update: (p: Partial<TextStyle>) => void,
    showCss = true,
    showFontSize = true,
    showColor = true,
  ): TemplateResult {
    return html`
      ${showFontSize ? this._numRow('Font size (px)', { value: ts.font_size, onChange: (v) => update({ font_size: v }), min: 6, placeholder: 'inherit',
        hint: 'Unset keeps the size inherited from the style above this one.' }) : nothing}

      ${showColor ? this._row('Color', this._colorPicker(`${prefix}-col`, ts.color, (v) => update({ color: v })),
        'Unset follows the default text colour in Settings ▸ Global Defaults ▸ Mosaic Card Defaults.') : nothing}

      ${this._row('Font weight',
        html`<select class="ec-select"
          .value=${ts.font_weight != null ? String(ts.font_weight) : ''}
          @change=${(e: Event) => {
            const v = (e.target as HTMLSelectElement).value;
            update({ font_weight: v === '' ? undefined : Number(v) });
          }}
        >
          <option value="" .selected=${ts.font_weight == null}>(inherit)</option>
          <option value="400" .selected=${ts.font_weight === 400}>400 — Normal</option>
          <option value="600" .selected=${ts.font_weight === 600}>600 — Semi-bold</option>
          <option value="700" .selected=${ts.font_weight === 700}>700 — Bold</option>
        </select>`)}

      ${this._row('Font family',
        html`<input class="ec-input" type="text" .value=${ts.font_family ?? ''}
          placeholder="inherit"
          @change=${(e: Event) => {
            const v = (e.target as HTMLInputElement).value;
            update({ font_family: v === '' ? undefined : v });
          }}
        />`,
        'A CSS font stack, e.g. Roboto, sans-serif. Unset follows Settings ▸ Global Defaults ▸ Layout & Fonts.')}

      ${this._numRow('Letter spacing (px)', { value: ts.letter_spacing, onChange: (v) => update({ letter_spacing: v }), placeholder: '0',
        hint: 'Extra space between characters; negative values tighten.' })}

      ${showCss ? this._cssRow(ts.extra_css, (v) => update({ extra_css: v })) : nothing}
    `;
  }

  /**
   * "Additional CSS" editor row: a textarea of raw CSS declarations (prop: value;)
   * with rudimentary live validation — invalid input is highlighted in
   * var(--error-color). See _isValidCss.
   */
  private _cssRow(value: string | undefined, onChange: (v: string | undefined) => void, label = 'Additional CSS', hint = CSS_ROW_HINT): TemplateResult {
    return this._row(label, html`<textarea
      class="ec-input ec-css-input${this._isValidCss(value ?? '') ? '' : ' ec-css-invalid'}"
      rows="2" spellcheck="false"
      placeholder="e.g. outline: 1px dashed red; --my-var: 4px;"
      .value=${value ?? ''}
      @input=${(e: Event) => {
        const el = e.target as HTMLTextAreaElement;
        el.classList.toggle('ec-css-invalid', !this._isValidCss(el.value));
      }}
      @change=${(e: Event) => {
        const v = (e.target as HTMLTextAreaElement).value.trim();
        onChange(v || undefined);
      }}
    ></textarea>`, hint);
  }

  /**
   * Rudimentary CSS-declaration validity check (not exhaustive): the value must
   * be a set of `property: value;` pairs. Empty is valid; rule blocks ({ }) are
   * rejected since only declarations are expected; each non-empty segment needs a
   * colon, a valid property/custom-property identifier, and a non-empty value.
   */
  private _isValidCss(css: string): boolean {
    const s = (css ?? '').trim();
    if (!s) return true;
    if (/[{}]/.test(s)) return false;
    for (const seg of s.split(';')) {
      const d = seg.trim();
      if (!d) continue;
      const idx = d.indexOf(':');
      if (idx <= 0) return false;
      const prop = d.slice(0, idx).trim();
      const val = d.slice(idx + 1).trim();
      if (!val) return false;
      if (!/^(--[a-zA-Z0-9-]+|-?[a-zA-Z][a-zA-Z0-9-]*)$/.test(prop)) return false;
    }
    return true;
  }

  private _renderAlignBar(): TemplateResult {
    const isGrouped = Array.from(this._selCards).some((idx) => this._config?.cards[idx]?.group) ||
      Array.from(this._selEmbCards).some((idx) => this._embCards()[idx]?.group);
    return html`
      <div class="ec-align-bar">
        <button class="ec-btn-align" @click=${() => this._alignCards('left')} title="Align left edges">⇤ Left</button>
        <button class="ec-btn-align" @click=${() => this._alignCards('centerH')} title="Center horizontally">↔ Center H</button>
        <button class="ec-btn-align" @click=${() => this._alignCards('right')} title="Align right edges">⇥ Right</button>
        <button class="ec-btn-align" @click=${() => this._alignCards('top')} title="Align top edges">⇡ Top</button>
        <button class="ec-btn-align" @click=${() => this._alignCards('middleV')} title="Center vertically">↕ Middle V</button>
        <button class="ec-btn-align" @click=${() => this._alignCards('bottom')} title="Align bottom edges">⇣ Bottom</button>
        <button class="ec-btn-align" @click=${() => this._distribute('x')} title="Distribute horizontally within selection">⇔ Dist H</button>
        <button class="ec-btn-align" @click=${() => this._distribute('y')} title="Distribute vertically within selection">⇕ Dist V</button>
        <button class="ec-btn-align" @click=${() => this._distributeCanvas('x')} title="Distribute horizontally across full canvas">⇔ Dist H (canvas)</button>
        <button class="ec-btn-align" @click=${() => this._distributeCanvas('y')} title="Distribute vertically across full canvas">⇕ Dist V (canvas)</button>
        <button class="ec-btn-align" @click=${() => this._alignGroupToCanvas('x')} title="Center group horizontally on canvas">↔ Align H (canvas)</button>
        <button class="ec-btn-align" @click=${() => this._alignGroupToCanvas('y')} title="Center group vertically on canvas">↕ Align V (canvas)</button>
        <button class="ec-btn-align" @click=${() => this._groupCards()} title="Group selected cards — drag one to move all">Group</button>
        ${isGrouped
          ? html`<button class="ec-btn-align" @click=${() => this._ungroupCards()} title="Remove group from selected cards">Ungroup</button>`
          : nothing}
      </div>
      <div class="ec-align-bar ec-align-bar-gap">
        <label class="ec-quick-field">
          <span>Column gap (px)</span>
          ${this._numInput({ value: this._selColGap, onChange: (v) => this._selColGap = v, min: 0, placeholder: 'e.g. 12' })}
        </label>
        <button class="ec-btn-align" title="Space selected cards within each row by this many px"
          @click=${() => { if (this._selColGap != null) this._applySelectionGap('x', this._selColGap); }}
        >Set</button>
        <button class="ec-btn-align" title="Clear this field" @click=${() => { this._selColGap = undefined; }}>Clear</button>

        <label class="ec-quick-field">
          <span>Row gap (px)</span>
          ${this._numInput({ value: this._selRowGap, onChange: (v) => this._selRowGap = v, min: 0, placeholder: 'e.g. 12' })}
        </label>
        <button class="ec-btn-align" title="Space selected cards within each column by this many px"
          @click=${() => { if (this._selRowGap != null) this._applySelectionGap('y', this._selRowGap); }}
        >Set</button>
        <button class="ec-btn-align" title="Clear this field" @click=${() => { this._selRowGap = undefined; }}>Clear</button>
      </div>
      <p class="ec-hint">Column gap re-spaces cards whose rows overlap vertically (left-to-right neighbors); Row gap re-spaces cards whose columns overlap horizontally (top-to-bottom neighbors). Cards don't need to be pixel-perfectly aligned first, and don't need to be grouped.</p>
    `;
  }

  /** Compact labeled number input for the bottom-bar quick-edit panels. */
  private _quickNum(
    label: string,
    value: number | undefined,
    onChange: (v: string) => void,
    opts?: { min?: number; max?: number; placeholder?: string },
  ): TemplateResult {
    return html`<label class="ec-quick-field">
      <span>${label}</span>
      ${this._numWrap(html`<input class="ec-input ec-input-num" type="number"
        min=${opts?.min ?? ''} max=${opts?.max ?? ''}
        placeholder=${opts?.placeholder ?? ''}
        .value=${value != null ? String(value) : ''}
        @change=${(e: Event) => onChange((e.target as HTMLInputElement).value)}
      />`)}
    </label>`;
  }

  /** Single-card quick-edit panel shown in the bottom bar when exactly one
   *  regular card is selected (no group, no embedded selection). */
  private _renderCardQuickPanel(ci: number): TemplateResult | typeof nothing {
    const card = this._config?.cards[ci];
    if (!card) return nothing;
    const geom = this._gridGeom();
    return html`
      <div class="ec-quick-panel">
        ${geom ? this._quickNum('Span', card.grid_span ?? 1, (v) => {
          const span = Math.max(1, Math.min(geom.cols, Number(v) || 1));
          const width = Math.max(8, span * geom.cellW - geom.padding);
          this._updateCard(ci, { grid_span: span, width });
        }, { min: 1, max: geom.cols }) : nothing}
        ${this._quickNum('Width', card.width, (v) => this._updateCard(ci, { width: v === '' ? undefined : Number(v) }), { placeholder: 'auto' })}
        ${geom ? this._quickNum('Rows', card.grid_row_span ?? 1, (v) => {
          const span = Math.max(1, Math.min(geom.rows, Number(v) || 1));
          const height = Math.max(8, span * geom.cellH - geom.padding);
          this._updateCard(ci, { grid_row_span: span, height });
        }, { min: 1, max: geom.rows }) : nothing}
        ${this._quickNum('Height', card.height, (v) => this._updateCard(ci, { height: v === '' ? undefined : Number(v) }), { placeholder: 'auto' })}
        ${this._quickNum('Field gap', card.field_gap, (v) => this._updateCard(ci, { field_gap: v === '' ? undefined : Number(v) }), { placeholder: 'default' })}
        ${this._quickNum('Col gap', card.column_gap, (v) => this._updateCard(ci, { column_gap: v === '' ? undefined : Number(v) }), { placeholder: 'default' })}
      </div>
    `;
  }

  /** Single-card quick-edit panel shown in the bottom bar when exactly one
   *  embedded card is selected (no group, no regular-card selection). */
  private _renderEmbQuickPanel(ei: number): TemplateResult | typeof nothing {
    const ec = this._embCards()[ei];
    if (!ec) return nothing;
    const geom = this._gridGeom();
    return html`
      <div class="ec-quick-panel">
        ${geom ? this._quickNum('Span', ec.grid_span ?? 1, (v) => {
          const span = Math.max(1, Math.min(geom.cols, Number(v) || 1));
          const width = Math.max(8, span * geom.cellW - geom.padding);
          this._updateEmbCard(ei, { grid_span: span, width });
        }, { min: 1, max: geom.cols }) : nothing}
        ${this._quickNum('Width', ec.width, (v) => this._updateEmbCard(ei, { width: Number(v) }))}
        ${this._quickNum('Height', ec.height, (v) => this._updateEmbCard(ei, { height: v === '' ? undefined : Number(v) }), { placeholder: 'auto' })}
      </div>
    `;
  }

  // ── Rendering ───────────────────────────────────────────────────────────────

  protected override render(): TemplateResult | typeof nothing {
    if (!this._config) return nothing;
    if (this._wizStep >= 0) return this._renderWizard();

    const { totalW, totalH } = computeCanvasDims(this._config);
    const cards = this._config.cards ?? [];

    return html`
      ${this._renderTutorial()}

      <!-- ── Live preview ── -->
      <dialog class="ec-preview${this._previewExpanded ? ' ec-preview--expanded' : ''}${this._previewExpanded && this._barAtTop ? ' ec-bar-top' : ''}"
        @pointermove=${(e: PointerEvent) => { this._onCardMove(e); this._onPointMove(e); this._onZoneMove(e); this._onZoneResizeMove(e); this._onEmbCardMove(e); this._onBgMove(e); }}
        @pointerup=${(e: PointerEvent) => { this._onCardUp(e); this._onPointUp(e); this._onZoneUp(e); this._onZoneResizeUp(e); this._onEmbCardUp(e); this._onBgUp(e); this._endUndoGesture(); }}
        @cancel=${(e: Event) => { e.preventDefault(); this._collapseExpanded(); }}
        tabindex="-1"
      >
        ${!this._previewExpanded ? html`
        <div class="ec-open-editor-wrap">
          <button class="ec-open-editor-btn" @click=${() => { this._previewExpanded = true; }}>
            <ha-icon icon="mdi:arrow-expand-all"></ha-icon>
            Open Mosaic Editor Window
          </button>
        </div>
        ` : html`
        <div class="ec-canvas-area"
          @click=${(e: MouseEvent) => this._onCanvasAreaClick(e)}
        >
          ${staticHtml`<${CANVAS_TAG}
            class="ec-preview-card"
            .hass=${this.hass}
            ?editor=${true}
            @ec-boxes-changed=${(e: Event) => { this._previewBoxes = (e as CustomEvent<{ boxes: Record<string, CardBox> }>).detail.boxes; }}
          ></${CANVAS_TAG}>`}
          ${this._renderGridOverlay()}
          <div class="ec-handles">
            ${this._renderBgOverlay()}
            ${cards.map((c, i) => {
              const selCls = `${i === this._selCard ? ' selected' : ''}${this._selCards.has(i) && i !== this._selCard ? ' multi' : ''}${c.group ? ' grouped' : ''}`;
              const box = this._previewBoxes[c.id];
              return box
                ? html`
              <div
                class="ec-card-ov${selCls}"
                style="left:${box.x * 100}%;top:${box.y * 100}%;width:${box.w * 100}%;height:${box.h * 100}%;"
                @pointerdown=${(e: PointerEvent) => this._onCardDown(e, i)}
                @dblclick=${() => this._collapseExpanded()}
                title=${c.name ?? `Card ${i + 1}`}
              ></div>`
                : html`
              <div
                class="ec-handle${selCls}"
                style="left:${c.position.x * 100}%;top:${c.position.y * 100}%;"
                @pointerdown=${(e: PointerEvent) => this._onCardDown(e, i)}
                @dblclick=${() => this._collapseExpanded()}
                title=${c.name ?? `Card ${i + 1}`}
              ></div>`;
            })}
            ${this._zones().map((z, zi) => {
              const box = this._zoneBox(z);
              return html`
              <div
                class="ec-zone-handle${zi === this._selZone ? ' selected' : ''}"
                style="left:${(box.x / totalW) * 100}%;top:${(box.y / totalH) * 100}%;width:${(box.w / totalW) * 100}%;height:${(box.h / totalH) * 100}%;"
                @pointerdown=${(e: PointerEvent) => this._onZoneDown(e, zi)}
                @dblclick=${() => this._collapseExpanded()}
                title=${z.name ?? `Zone ${zi + 1}`}
              >
                <span class="ec-zone-label">${z.name ?? `Zone ${zi + 1}`}</span>
                ${zi === this._selZone ? (['tl', 'tr', 'bl', 'br'] as const).map((corner) => html`
                  <div
                    class="ec-zone-resize ec-zone-resize-${corner}"
                    @pointerdown=${(e: PointerEvent) => this._onZoneResizeDown(e, zi, corner)}
                  ></div>`) : nothing}
              </div>`;
            })}
            ${this._embCards().map((ec, idx) => {
              const selCls = `${idx === this._selEmbCard ? ' selected' : ''}${this._selEmbCards.has(idx) && idx !== this._selEmbCard ? ' multi' : ''}${ec.group ? ' grouped' : ''}`;
              const box = this._previewBoxes[ec.id];
              return box
                ? html`
              <div
                class="ec-emb-ov${selCls}"
                style="left:${box.x * 100}%;top:${box.y * 100}%;width:${box.w * 100}%;height:${box.h * 100}%;"
                @pointerdown=${(e: PointerEvent) => this._onEmbCardDown(e, idx)}
                @dblclick=${() => this._collapseExpanded()}
                title=${ec.name ?? `Embedded ${idx + 1}`}
              ></div>`
                : html`
              <div
                class="ec-emb-handle${selCls}"
                style="left:${ec.position.x * 100}%;top:${ec.position.y * 100}%;"
                @pointerdown=${(e: PointerEvent) => this._onEmbCardDown(e, idx)}
                @dblclick=${() => this._collapseExpanded()}
                title=${ec.name ?? `Embedded ${idx + 1}`}
              ></div>`;
            })}
          </div>
          ${this._flows().length > 0 ? html`
            <svg class="ec-flow-paths-overlay" viewBox="0 0 1 1" preserveAspectRatio="none">
              <defs>
                <filter id="ec-flow-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="0.003" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              ${this._flows().map((flow, fi) => {
                const pts = flow.points
                  .map((pt) => resolveFlowPoint(pt, cards, this._previewBoxes))
                  .map((p) => `${p.x},${p.y}`)
                  .join(' ');
                const sel = fi === this._selFlow;
                return svg`
                  <polyline
                    class="ec-flow-hit"
                    points="${pts}"
                    fill="none"
                    stroke="transparent"
                    stroke-width="16"
                    pointer-events="stroke"
                    vector-effect="non-scaling-stroke"
                    @dblclick=${() => {
                      this._selFlow = fi;
                      this._syncNavTo('elements', 'flows', [{ key: `flow:${flow.id}`, label: flow.name ?? flow.id }]);
                      this._collapseExpanded();
                    }}
                  ></polyline>
                  <polyline
                    points="${pts}"
                    fill="none"
                    stroke="${sel ? 'rgba(0,212,255,0.9)' : 'rgba(0,180,255,0.55)'}"
                    stroke-width="${sel ? 3 : 2.5}"
                    stroke-dasharray="6 4"
                    vector-effect="non-scaling-stroke"
                    filter="url(#ec-flow-glow)"
                  ></polyline>`;
              })}
            </svg>
          ` : nothing}
          ${this._selFlow >= 0 ? (() => {
            const flow = this._flows()[this._selFlow];
            if (!flow) return nothing;
            const SIDES: import('./types').FlowSide[] = ['top', 'right', 'bottom', 'left'];
            return html`
              <div class="ec-flow-layer"
                @click=${(e: MouseEvent) => this._onFlowLayerClick(e)}
              >
                ${this._selPoint >= 0 ? cards.map((card) => SIDES.map((side) => {
                  const box = this._previewBoxes[card.id];
                  if (!box) return nothing;
                  let px: number;
                  let py: number;
                  switch (side) {
                    case 'top':    px = box.x + box.w / 2; py = box.y;             break;
                    case 'right':  px = box.x + box.w;     py = box.y + box.h / 2; break;
                    case 'bottom': px = box.x + box.w / 2; py = box.y + box.h;     break;
                    case 'left':   px = box.x;             py = box.y + box.h / 2; break;
                    default:       px = box.x + box.w / 2; py = box.y + box.h / 2; break;
                  }
                  return html`<div
                    class="ec-snap"
                    style="left:${px * 100}%;top:${py * 100}%;"
                    @click=${(e: MouseEvent) => {
                      e.stopPropagation();
                      this._updateFlowPoint(this._selFlow, this._selPoint, { card: card.id, side, x: undefined, y: undefined });
                    }}
                  ></div>`;
                })) : nothing}
                ${flow.points.map((point, pi) => {
                  const p = resolveFlowPoint(point, cards, this._previewBoxes);
                  return html`<div
                    class="ec-flow-node${pi === this._selPoint ? ' selected' : ''}${point.card != null ? ' anchored' : ' free'}"
                    style="left:${p.x * 100}%;top:${p.y * 100}%;"
                    @pointerdown=${(e: PointerEvent) => this._onPointDown(e, pi)}
                    @dblclick=${() => {
                      // #71: a point's own single-click already synced the nav path down
                      // to the point (_onPointDown) — double-click overrides that back up
                      // to the flow's own root screen, per the issue's explicit choice not
                      // to land a point-level jump on a specific point.
                      this._syncNavTo('elements', 'flows', [{ key: `flow:${flow.id}`, label: flow.name ?? flow.id }]);
                      this._collapseExpanded();
                    }}
                  ></div>`;
                })}
              </div>
            `;
          })() : nothing}
        </div>
        <div class="ec-expanded-bottom-bar">
            <div class="ec-bottom-bar-left">
              ${this._showAddFlowInput ? html`
                <input class="ec-flow-name-input" type="text"
                  placeholder="Flow name"
                  .value=${this._newFlowName}
                  @input=${(e: Event) => { this._newFlowName = (e.target as HTMLInputElement).value; }}
                  @keydown=${(e: KeyboardEvent) => {
                    if (e.key === 'Enter') this._addFlowFromExpanded();
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      e.stopPropagation();
                      this._showAddFlowInput = false;
                      this._newFlowName = '';
                    }
                  }}
                >
                <button class="ec-btn-add" @click=${() => this._addFlowFromExpanded()}>Add</button>
                <button class="ec-btn-remove" @click=${() => { this._showAddFlowInput = false; this._newFlowName = ''; }}>✕</button>
              ` : html`
                <button class="ec-btn-add" @click=${() => { this._showAddFlowInput = true; }}>+ Add Flow Line</button>
              `}
            </div>
            <div class="ec-bottom-bar-center">
              ${(this._selCards.size + this._selEmbCards.size) >= 2
                ? this._renderAlignBar()
                : this._selCards.size === 1 && this._selEmbCards.size === 0
                  ? this._renderCardQuickPanel(Array.from(this._selCards)[0])
                  : this._selEmbCards.size === 1 && this._selCards.size === 0
                    ? this._renderEmbQuickPanel(Array.from(this._selEmbCards)[0])
                    : this._selFlow >= 0
                      ? html`<span class="ec-hint-text">Flow selected — click card anchor points to connect endpoints</span>`
                      : html`
                        <span class="ec-hint-text">Click on a flow to select it for editing or Add Flow to create a new one</span>
                        <span class="ec-hint-text">Click-drag a card to move it · Shift-click to multi-select · Double click to jump to configuration · Alt-click to cycle stacked cards</span>
                      `
              }
            </div>
            ${(this._selCards.size + this._selEmbCards.size) >= 2 ? html`
              <button class="ec-btn-done" title="Finish multi-card editing"
                @click=${() => { this._selCards = new Set(); this._selEmbCards = new Set(); }}>✓ Done</button>
            ` : (this._selCards.size === 1 && this._selEmbCards.size === 0) || (this._selEmbCards.size === 1 && this._selCards.size === 0) ? html`
              <button class="ec-btn-done" title="Finish card editing"
                @click=${() => { this._selCards = new Set(); this._selEmbCards = new Set(); this._selCard = -1; this._selEmbCard = -1; }}>✓ Done</button>
            ` : this._selFlow >= 0 ? html`
              <button class="ec-btn-done" title="Finish flow editing"
                @click=${() => { this._selFlow = -1; }}>✓ Done</button>
            ` : nothing}
            ${this._previewExpanded ? html`
              <button class="ec-undo-btn" title="Undo (Ctrl+Z)" ?disabled=${!this._undoStack.length} @click=${() => this._undo()}>
                <ha-icon icon="mdi:undo"></ha-icon>
              </button>
              <button class="ec-undo-btn" title="Redo (Ctrl+Y)" ?disabled=${!this._redoStack.length} @click=${() => this._redo()}>
                <ha-icon icon="mdi:redo"></ha-icon>
              </button>
              <button class="ec-side-close" title="Close Mosaic Editor Window" @click=${() => this._collapseExpanded()}>Close Window</button>
            ` : nothing}
          </div>
        `}
        ${this._renderGGModal()}
        ${this._renderEmbPickerModal()}
      ${this._renderImagePickerModal()}
        ${this._renderEmbEditorModal()}
        ${this._renderFlowCompleteModal()}
        ${this._previewExpanded ? this._renderUndoToast() : nothing}
      </dialog>

      ${!this._previewExpanded ? this._renderControls() : nothing}
      ${!this._previewExpanded ? this._renderUndoToast() : nothing}
    `;
  }

  // ── Ribbon navigation shell ──────────────────────────────────────────────────

  private static readonly _TAB_LABEL: Record<MosaicCanvasEditor['_navTab'], string> = {
    cards: 'Cards', elements: 'Elements', settings: 'Settings',
  };

  private static readonly _PANEL_META: Record<string, { icon: string; title: string; desc: string }> = {
    mosaic:    { icon: 'mdi:view-dashboard',                 title: 'Mosaic Cards',             desc: 'Canvas cards holding value, label, icon, Element Library (SVG fills & graphs), blank and rule fields. Reorder fields to stack them; style per-card or inherit the global defaults.' },
    popover:   { icon: 'mdi:picture-in-picture-bottom-right',title: 'Popover Cards',            desc: 'Popup panels opened by an Open Popover action from a card, field or zone. Column-based layout with their own defaults.' },
    embedded:  { icon: 'mdi:widgets',                        title: 'Embedded External Cards',  desc: 'Embed any native or custom Home Assistant dashboard card directly onto the canvas.' },
    flows:     { icon: 'mdi:chart-timeline-variant',         title: 'Animated Flow Lines',       desc: 'CSS-animated lines between canvas points. An entity value drives speed and direction; style is dashes, dots, fluid or particles.' },
    zones:     { icon: 'mdi:gesture-tap-box',                title: 'Clickable Zones',           desc: 'Bounded clickable hotspots pinned to canvas coordinates, used to trigger tap / hold / double-tap actions.' },
    virtuals:  { icon: 'mdi:memory',                         title: 'Virtual Entities',          desc: 'Computed helper entities — add, subtract, mean, signed net or time-until — usable across every card without a HA helper.' },
    canvas:    { icon: 'mdi:image-size-select-actual',       title: 'Canvas',                    desc: 'Placement mode (Precision or Grid), base size, fit, extend margins, the canvas box and the background image set.' },
    defaults:  { icon: 'mdi:palette',                        title: 'Global Defaults',           desc: 'Default box, value and label styling plus fonts, gaps and element fill colors. Cards and fields inherit these unless overridden.' },
    templates: { icon: 'mdi:bookmark-multiple',              title: 'Templates',                 desc: 'Save the current layout as a portable template, or import one to replace the configuration.' },
    health:    { icon: 'mdi:stethoscope',                    title: 'Config Health',             desc: 'Read-only checks over the whole configuration: references that no longer resolve, entities Home Assistant does not have, and values only reachable from the YAML editor. Every row opens the screen that owns it.' },
    about:     { icon: 'mdi:information-outline',            title: 'About',                     desc: 'Card version, documentation and project links.' },
  };

  private _navOpenPanel(panel: string): void {
    this._navPanel = panel;
    this._navPath = [];
  }

  private _navBack(): void {
    if (this._navPath.length) {
      this._navPath = this._navPath.slice(0, -1);
    } else {
      this._navPanel = '';
    }
  }

  /** `badge` is the Config Health row's problem count (#65); every other ribbon
   *  row passes 0. Kept as a count rather than a dot so the row says how much
   *  there is to look at without opening it. */
  private _navRow(icon: string, label: string, hint: string, onClick: () => void, badge = 0): TemplateResult {
    return html`
      <button class="ec-nav-item" @click=${onClick}>
        <ha-icon class="ec-nav-item-icon" icon=${icon}></ha-icon>
        <span class="ec-nav-item-text">
          <span class="ec-nav-item-label">${label}</span>
          ${hint ? html`<span class="ec-nav-item-hint">${hint}</span>` : nothing}
        </span>
        ${badge > 0 ? html`<span class="ec-nav-card-badge"
          title="${badge} item${badge === 1 ? '' : 's'} to review">${badge}</span>` : nothing}
        <ha-icon class="ec-nav-item-chevron" icon="mdi:chevron-right"></ha-icon>
      </button>
    `;
  }

  /** Bordered nav-card row used for every in-panel "Sections" menu (Card Style, Canvas Size,
   *  Element Library type chooser, Templates chooser, …) — one level deeper than the flat
   *  top-level ribbon item list rendered by `_navRow`. The nav-chrome-vs-data-list palette
   *  seam this used to describe is retired — `.ec-item-card` is themed too now. */
  private _navBtn(key: string, label: string, hint: string, icon: string, mods = 0): TemplateResult {
    return html`
      <button class="ec-nav-card" @click=${() => this._navPush(key, label, hint)}>
        <ha-icon class="ec-nav-card-icon" icon=${icon}></ha-icon>
        <span class="ec-nav-card-text">
          <span class="ec-nav-card-label">${label}</span>
          ${hint ? html`<span class="ec-nav-card-hint">${hint}</span>` : nothing}
        </span>
        ${_SHOW_OVERRIDE_INDICATORS && mods > 0 ? html`<span class="ec-nav-card-badge"
          title="${mods} setting${mods === 1 ? '' : 's'} overridden on this screen">${mods}</span>` : nothing}
        <ha-icon class="ec-nav-card-chevron" icon="mdi:chevron-right"></ha-icon>
      </button>
    `;
  }

  /** Render a Sections menu from its defs table — see NavSectionDef. `scope`
   *  resolves each row's `paths` manifest into the override count badge (#64);
   *  without it the menu renders unbadged. #75: generic in `T` so `defs` and
   *  `scope` are checked against the same root — a `NavSectionDef<CardConfig>[]`
   *  table can no longer be handed a `SectionScope<ZoneConfig>`. */
  private _navMenu<T>(defs: NavSectionDef<T>[], scope?: SectionScope<T>): TemplateResult {
    return html`${defs.map((d) =>
      this._navBtn(d.key, d.label, d.hint, d.icon, countOverrides(scope?.root, d.paths)))}`;
  }

  /**
   * "Clear overrides" button for a section screen, reading the same `paths`
   * manifest its menu row badges from (#64). Absent when the section holds
   * nothing, so it never offers a no-op. Undo (#60) covers the write, and the
   * toast makes that discoverable without a confirm dialog.
   */
  private _clearOverridesBtn<T>(def: NavSectionDef<T> | undefined, scope: SectionScope<T>): TemplateResult | typeof nothing {
    if (!_SHOW_OVERRIDE_INDICATORS) return nothing;
    const paths = def?.paths;
    if (!paths?.length) return nothing;
    const n = countOverrides(scope.root, paths);
    if (!n) return nothing;
    return html`
      <div class="ec-clear-overrides">
        <span class="ec-clear-overrides-count">${n} override${n === 1 ? '' : 's'} on this screen</span>
        <button class="ec-btn-clear-overrides" @click=${() => {
          // clearPatch is a runtime dotted-path deletion tree — it has no
          // notion of T, so its Record<string, unknown> result is cast at
          // this one generic boundary rather than threading T through it.
          scope.apply(clearPatch(scope.root, paths) as Partial<T>);
          this._showUndoToast(`${n} override${n === 1 ? '' : 's'} cleared`);
        }}>Clear overrides</button>
      </div>
    `;
  }

  /** Look a section def up by crumb key, for `_clearOverridesBtn`'s manifest. */
  private static _findDef<T>(defs: readonly NavSectionDef<T>[], key: string): NavSectionDef<T> | undefined {
    return defs.find((d) => d.key === key);
  }

  /**
   * #75: canary for the #64 defect class — a config slot claimed by two
   * *different* screens under the same root, which broke the one-owner
   * invariant `_findDef`'s manifests are supposed to guarantee
   * (`button_option_padding` was, until #64 subtracted it via
   * `BUTTON_CONTAINER_FIELD_ONLY`). `Path<T>` catches a renamed/deleted
   * property; it cannot catch two *live* properties both being listed by
   * separate defs, since both are individually valid paths. This is the
   * "cheapest form... a dev-mode assertion over the def tables" the issue
   * asks for — it runs once per session (from the first `setConfig`, gated
   * below) and only logs, since a real violation is an authoring bug the
   * editor should stay usable while it gets fixed, not a reason to crash.
   *
   * Field and Virtual tables are type-conditional, so they're checked per
   * representative shape rather than pooled globally — two different field
   * types both listing `'entity'` is not a conflict, since a field is never
   * both types at once; the only "field" objects here are ID (svg substring/
   * options_source) that route `_fieldSectionDefs`'s own branches, not real
   * card data.
   */
  private _assertOneOwnerInvariant(): void {
    if (this._oneOwnerChecked) return;
    this._oneOwnerChecked = true;
    const E = MosaicCanvasEditor;
    const violations: string[] = [];
    const check = (groupLabel: string, tables: readonly (readonly NavSectionDef<any>[])[]): void => {
      const owner = new Map<string, string>();
      for (const defs of tables) {
        for (const d of defs) {
          for (const p of d.paths ?? []) {
            const prev = owner.get(p);
            if (prev && prev !== d.key) violations.push(`${groupLabel}: "${p}" claimed by both "${prev}" and "${d.key}"`);
            else owner.set(p, d.key);
          }
        }
      }
    };

    check('Mosaic Card', [E._CARD_SECTIONS]);
    check('Zone', [E._ZONE_SECTIONS]);
    check('Flow', [E._FLOW_SECTIONS]);
    check('Embedded Card', [E._EMB_SECTIONS]);
    check('Popover Card', [E._POPOVER_CARD_SECTIONS]);
    check('Global Defaults', [
      E._DEFAULTS_SECTIONS, E._CONTROL_DEFAULTS_SECTIONS, E._ELEM_LIB_SECTIONS,
      E._selectorDefaultsDefs(false), E._selectorDefaultsDefs(true),
    ]);

    const fieldShapes: FieldConfig[] = [
      { id: 'x', type: 'value' }, { id: 'x', type: 'icon' }, { id: 'x', type: 'label' },
      { id: 'x', type: 'svg' },
      { id: 'x', type: 'svg', svg: 'thermometer-vertical.svg' },
      { id: 'x', type: 'svg', svg: 'battery-horizontal.svg' },
      { id: 'x', type: 'svg', svg: 'inverter.svg' },
      { id: 'x', type: 'svg', svg: 'gauge-arc.svg' },
      { id: 'x', type: 'graph' }, { id: 'x', type: 'embedded_card' },
      { id: 'x', type: 'toggle' }, { id: 'x', type: 'slider' }, { id: 'x', type: 'dropdown' },
      { id: 'x', type: 'button_group' }, { id: 'x', type: 'button_group', options_source: 'manual' },
      { id: 'x', type: 'input' }, { id: 'x', type: 'spinbox' }, { id: 'x', type: 'button' },
    ];
    for (const f of fieldShapes) {
      const hasStateSplit = f.type === 'button_group' || f.type === 'button';
      const extra: NavSectionDef<FieldConfig>[] = [];
      if (f.type === 'button_group' && (f.options_source ?? 'entity') !== 'manual') extra.push(E._OPTION_LAYOUT_DEF, ...E._fscsDefs(false));
      if (f.type === 'button') extra.push(...E._fscsDefs(true));
      // 'fsec:controlstyle' is a deliberate parent summary of the fscs:* state
      // screens for selector/button (see _fieldSecControlStyle's hasStateSplit
      // branch) — it renders their sub-menu rather than its own rows, so its
      // manifest legitimately restates every path they own. Not a sibling
      // conflict; excluded here rather than flagged as one.
      const base = hasStateSplit
        ? this._fieldSectionDefs(f).filter((d) => d.key !== 'fsec:controlstyle')
        : this._fieldSectionDefs(f);
      check(`Field (${f.type}${f.svg ? `:${f.svg}` : ''}${f.options_source ? `:${f.options_source}` : ''})`,
        [base, extra]);
    }

    const virtualShapes: VirtualConfig[] = [
      { id: 'x', name: 'x', op: 'add', inputs: [] },
      { id: 'x', name: 'x', op: 'time_until', inputs: [] },
      { id: 'x', name: 'x', op: 'statistic', inputs: [] },
    ];
    for (const v of virtualShapes) check(`Virtual (${v.op})`, [this._virtualSectionDefs(v)]);

    if (violations.length) {
      console.error(`[mosaic-canvas-card] #75 one-owner check failed:\n${violations.join('\n')}`);
    }
  }

  /** Bordered data-list row: icon + label + sub + trailing actions + chevron.
   *  Used for every content list (cards, fields, virtuals, zones, flows, …).
   *  With a `dragKey` the row is reorderable, and reorder is pointer-based (#66)
   *  so it works on touch; see _onItemPointerDown. Omit `dragKey` for a list
   *  whose order carries no meaning — card background rules are matched by
   *  state, not tested in sequence — and the grip and the drag and keyboard
   *  reorder wiring all drop out with it. */
  private _itemCard(opts: {
    dragKey?: string;
    icon: string;
    label: unknown;
    sub?: string;
    selected?: boolean;
    multi?: boolean;
    onClick: (e: MouseEvent) => void;
    actions?: TemplateResult | typeof nothing;
  }): TemplateResult {
    const { dragKey, icon, label, sub, selected, multi, onClick, actions } = opts;
    const dropping = dragKey != null && this._dropKey === dragKey;
    return html`
      <div
        class="ec-item-card${selected ? ' selected' : ''}${multi ? ' multi' : ''}${dragKey != null && this._dragSrc === dragKey ? ' ec-dragging' : ''}${dropping ? (this._dropBefore ? ' ec-drop-before' : ' ec-drop-after') : ''}"
        role="button"
        tabindex="0"
        data-drag-key=${dragKey ?? nothing}
        @pointerdown=${dragKey != null ? (e: PointerEvent) => this._onItemPointerDown(e, dragKey) : nothing}
        @pointermove=${dragKey != null ? (e: PointerEvent) => this._onItemPointerMove(e) : nothing}
        @pointerup=${dragKey != null ? (e: PointerEvent) => this._onItemPointerUp(e) : nothing}
        @pointercancel=${dragKey != null ? (e: PointerEvent) => this._onItemPointerCancel(e) : nothing}
        @click=${(e: MouseEvent) => {
          // A drag, or a press on the grip, must not also open the row.
          if (this._suppressClick) { this._suppressClick = false; return; }
          onClick(e);
        }}
        @keydown=${(e: KeyboardEvent) => this._onItemCardKeydown(e, dragKey, onClick)}
      >
        ${dragKey != null ? html`<span class="ec-drag-handle" title="Drag to reorder"></span>` : nothing}
        <ha-icon class="ec-item-card-icon" icon=${icon}></ha-icon>
        <span class="ec-item-card-text">
          <span class="ec-item-card-label">${label}</span>
          ${sub ? html`<span class="ec-item-card-sub">${sub}</span>` : nothing}
        </span>
        <span class="ec-item-card-actions">${actions ?? nothing}</span>
        <ha-icon class="ec-item-card-chevron" icon="mdi:chevron-right"></ha-icon>
      </div>
    `;
  }

  /**
   * The label stored on a _navPath entry is a snapshot taken at _navPush time,
   * so renaming an entity (e.g. a card, in Card Defaults) doesn't refresh its
   * breadcrumb until the crumb is re-pushed. Re-derive the label live from the
   * current config for the top-level entity crumb of each panel (depth 0) —
   * the only crumbs backed by a user-editable name — falling back to the
   * stored snapshot for anything else (deeper crumbs are placeholders like
   * "Field N" that never reflected live content in the first place, so there
   * is nothing for them to go stale against).
   */
  private _liveCrumbLabel(depth: number, fallback: string): string {
    const cfg = this._config;
    if (!cfg) return fallback;
    const key = this._navPath[depth]?.key ?? '';
    if (depth === 0) {
      // Only re-derive when the depth-0 crumb is actually the panel's entity
      // crumb. Section crumbs sit at depth 0 in some panels too, and rendering
      // the selected item's name over one of those is how this went wrong once.
      switch (this._navPanel) {
        case 'mosaic':    return key.startsWith('card:') ? (cfg.cards[this._selCard]?.name ?? fallback) : fallback;
        case 'popover':   return key.startsWith('card:') ? (this._extCards()[this._selExtCard]?.name ?? fallback) : fallback;
        case 'flows':     return key.startsWith('flow:') ? (cfg.flows?.[this._selFlow]?.name ?? cfg.flows?.[this._selFlow]?.id ?? fallback) : fallback;
        case 'zones':     return key.startsWith('zone:') ? (cfg.zones?.[this._selZone]?.name ?? cfg.zones?.[this._selZone]?.id ?? fallback) : fallback;
        case 'virtuals':  return key.startsWith('virt:') ? (cfg.virtuals?.[this._selVirtual]?.name || cfg.virtuals?.[this._selVirtual]?.id || fallback) : fallback;
        case 'embedded':  return key.startsWith('emb:') ? (cfg.embedded_cards?.[this._selEmbCard]?.name ?? cfg.embedded_cards?.[this._selEmbCard]?.id ?? fallback) : fallback;
        default:          return fallback;
      }
    }
    // Deeper crumbs backed by user-editable names: field and graph-series
    // screens rename themselves (display name / label / entity), so re-derive
    // instead of showing the label snapshot taken at push time.
    const panelField = (fi: number): FieldConfig | undefined => this._navPanel === 'mosaic'
      ? cfg.cards[this._selCard]?.fields[fi]
      : this._navPanel === 'popover'
        ? this._extCards()[this._selExtCard]?.fields[fi]
        : undefined;
    if (key.startsWith('field:')) {
      const fields = this._navPanel === 'mosaic'
        ? cfg.cards[this._selCard]?.fields
        : this._navPanel === 'popover' ? this._extCards()[this._selExtCard]?.fields : undefined;
      const f = panelField(this._crumbIndex(key, fields));
      return f ? this._fieldName(f) : fallback;
    }
    if (key.startsWith('gs:') || key.startsWith('egs:')) {
      const si = Number(key.slice(key.indexOf(':') + 1));
      const fi = this._navPanel === 'mosaic' ? this._selField : this._selExtField;
      const s = panelField(fi)?.graph_series?.[si];
      return s ? (s.label || s.entity || fallback) : fallback;
    }
    if (key.startsWith('opt:') || key.startsWith('eopt:')) {
      const oi = Number(key.slice(key.indexOf(':') + 1));
      const fi = this._navPanel === 'mosaic' ? this._selField : this._selExtField;
      const o = panelField(fi)?.options?.[oi];
      return o ? MosaicCanvasEditor._optionName(o, oi) : fallback;
    }
    return fallback;
  }

  private _renderBreadcrumb(): TemplateResult {
    const crumbs: { label: string; onClick: () => void }[] = [
      { label: MosaicCanvasEditor._TAB_LABEL[this._navTab], onClick: () => { this._navPanel = ''; this._navPath = []; } },
    ];
    if (this._navPanel) {
      crumbs.push({ label: MosaicCanvasEditor._PANEL_META[this._navPanel]?.title ?? this._navPanel, onClick: () => { this._navPath = []; } });
      this._navPath.forEach((e, i) => crumbs.push({ label: this._liveCrumbLabel(i, e.label), onClick: () => { this._navPath = this._navPath.slice(0, i + 1); } }));
    }
    // Undo/redo sit on their own row above the trail rather than at the end of
    // it. As trailing flex children of a wrapping breadcrumb they were the first
    // thing pushed to a second line once the trail got long — which is exactly
    // when a deep drill-down makes them most likely to be wanted, and it moved
    // them somewhere different every time the path length changed.
    return html`
      <div class="ec-nav-toolbar">
        <button class="ec-undo-btn" title="Undo (Ctrl+Z)" ?disabled=${!this._undoStack.length} @click=${() => this._undo()}>
          <ha-icon icon="mdi:undo"></ha-icon>
        </button>
        <button class="ec-undo-btn" title="Redo (Ctrl+Y)" ?disabled=${!this._redoStack.length} @click=${() => this._redo()}>
          <ha-icon icon="mdi:redo"></ha-icon>
        </button>
        <!-- #93: the one place the tooltip convention is announced. Without it
             a title= that only appears on hover is a feature nobody finds. Not
             a button — there is nothing to click, and a disabled-looking
             control beside Undo/Redo would read as broken. -->
        <span class="ec-help-hint" role="note"
          title="Hover over any option's name to see what it does.">?</span>
      </div>
      <div class="ec-breadcrumb">
        ${crumbs.map((c, i) => html`
          <button class="ec-crumb${i === crumbs.length - 1 ? ' ec-crumb--active' : ''}" @click=${c.onClick} title=${c.label}>${c.label}</button>
          ${i < crumbs.length - 1 ? html`<ha-icon class="ec-crumb-sep" icon="mdi:chevron-right"></ha-icon>` : nothing}
        `)}
      </div>
    `;
  }

  /** The top-level ribbon entries — shared by the ribbon item list and the
   *  editor-wide search index (#61). */
  private static readonly _RIBBON_ITEMS: { tab: MosaicCanvasEditor['_navTab']; panel: string; icon: string; label: string; hint: string }[] = [
    { tab: 'cards',    panel: 'mosaic',    icon: 'mdi:view-dashboard',                  label: 'Mosaic Card',             hint: 'Values, labels, icons & Element Library' },
    { tab: 'cards',    panel: 'popover',   icon: 'mdi:picture-in-picture-bottom-right', label: 'Popover Cards',           hint: 'Shown on a trigger action' },
    { tab: 'cards',    panel: 'embedded',  icon: 'mdi:widgets',                         label: 'Embedded External Cards', hint: 'Any native or custom HA card' },
    { tab: 'elements', panel: 'flows',     icon: 'mdi:chart-timeline-variant',          label: 'Animated Flow Lines',     hint: 'Entity-driven CSS flows' },
    { tab: 'elements', panel: 'zones',     icon: 'mdi:gesture-tap-box',                 label: 'Clickable Zones',         hint: 'Bounded action areas' },
    { tab: 'elements', panel: 'virtuals',  icon: 'mdi:memory',                          label: 'Virtual Entities',        hint: 'Helper-like computed values' },
    { tab: 'settings', panel: 'canvas',    icon: 'mdi:image-size-select-actual',        label: 'Canvas',                  hint: 'Background, aspect & placement mode' },
    { tab: 'settings', panel: 'defaults',  icon: 'mdi:palette',                         label: 'Global Defaults',         hint: 'Inherited element styling' },
    { tab: 'settings', panel: 'templates', icon: 'mdi:bookmark-multiple',               label: 'Templates',               hint: 'Import & export layout' },
    { tab: 'settings', panel: 'health',    icon: 'mdi:stethoscope',                     label: 'Config Health',           hint: 'Broken references & YAML-only values' },
    { tab: 'settings', panel: 'about',     icon: 'mdi:information-outline',             label: 'About',                   hint: 'Version, links & support' },
  ];

  private _renderRibbonItems(): TemplateResult {
    // The Health row carries the full finding count, errors and notes alike; the
    // Settings tab badge counts errors only (see _renderRibbon). Both exclude
    // ignored rows — an ignore is the user saying "stop showing me this", and a
    // badge that keeps counting it would defeat the button.
    return html`${MosaicCanvasEditor._RIBBON_ITEMS
      .filter((it) => it.tab === this._navTab)
      .map((it) => this._navRow(it.icon, it.label, it.hint, () => this._navOpenPanel(it.panel),
        it.panel === 'health' ? this._health().issues.filter((i) => !i.ignored).length : 0))}`;
  }

  // ── Editor-wide search / quick-jump (#61) ───────────────────────────────────
  // A search box on the ribbon root filters an index generated from the same
  // NavSectionDef tables the menus render from, so results can't drift from
  // reality. Item-scoped screens (a card's Card Style, a field's Thermometer
  // section, …) are resolved against the current config at query time — one
  // result per existing item, labelled with the item's name. Every result is
  // one _navigateTo() call (#59).

  @state() private _searchQuery = '';
  @state() private _searchActive = 0;
  private static readonly _SEARCH_LIMIT = 30;

  /** _buildSearchIndex is O(config) and was rebuilt on every search keystroke;
   *  it depends on nothing but the config, so cache it on identity (#104). */
  private _searchIndexCache?: { cfg: MosaicCanvasConfig; index: NavSearchResult[] };

  private _searchIndex(): NavSearchResult[] {
    const cfg = this._config;
    if (!cfg) return [];
    if (this._searchIndexCache?.cfg === cfg) return this._searchIndexCache.index;
    const index = this._buildSearchIndex();
    this._searchIndexCache = { cfg, index };
    return index;
  }

  /** Every navigable screen, resolved against the current config. */
  private _buildSearchIndex(): NavSearchResult[] {
    const cfg = this._config;
    if (!cfg) return [];
    const E = MosaicCanvasEditor;
    const out: NavSearchResult[] = [];
    type Crumb = NavSearchResult['path'][number];
    // #75: NavSectionDef<any> — like _healthDefs, this reads .key/.label/.hint/
    // .icon/.terms across defs tables of every different root type in one pass;
    // there is no single concrete T to give it.
    const crumb = (d: NavSectionDef<any>): Crumb => ({ key: d.key, label: d.label, hint: d.hint });
    const push = (
      tab: NavSearchResult['tab'], panel: string, icon: string,
      label: string, hint: string, context: string, path: Crumb[], terms?: string,
    ): void => { out.push({ tab, panel, icon, label, hint, context, path, ...(terms ? { terms } : {}) }); };
    const secs = (
      tab: NavSearchResult['tab'], panel: string, context: string,
      defs: NavSectionDef<any>[], base: Crumb[] = [],
    ): void => { for (const d of defs) push(tab, panel, d.icon, d.label, d.hint, context, [...base, crumb(d)], d.terms); };

    // Every panel root.
    for (const it of E._RIBBON_ITEMS) {
      push(it.tab, it.panel, it.icon, E._PANEL_META[it.panel]?.title ?? it.label, it.hint, E._TAB_LABEL[it.tab], []);
    }

    // Settings — config-independent section screens.
    secs('settings', 'canvas', 'Settings › Canvas', E._CANVAS_SECTIONS);
    secs('settings', 'defaults', 'Settings › Global Defaults', E._DEFAULTS_SECTIONS);
    const dControl = E._DEFAULTS_SECTIONS.find((d) => d.key === 'sec:control');
    if (dControl) {
      secs('settings', 'defaults', 'Global Defaults › Control Default', E._CONTROL_DEFAULTS_SECTIONS, [crumb(dControl)]);
      for (const cd of E._CONTROL_DEFAULTS_SECTIONS) {
        if (cd.key !== 'cd:selector' && cd.key !== 'cd:button') continue;
        secs('settings', 'defaults', `Control Default › ${cd.label}`,
          E._selectorDefaultsDefs(cd.key === 'cd:button'), [crumb(dControl), crumb(cd)]);
      }
    }
    const dElems = E._DEFAULTS_SECTIONS.find((d) => d.key === 'sec:elements');
    if (dElems) secs('settings', 'defaults', 'Global Defaults › Element Library', E._ELEM_LIB_SECTIONS, [crumb(dElems)]);
    secs('settings', 'templates', 'Settings › Templates', E._TEMPLATE_SECTIONS);

    // Popover Card Defaults is registered by the _DEFAULTS_SECTIONS sweep above
    // now that it lives under Settings ▸ Global Defaults (#89).

    // Item-scoped screens, one result per existing item.
    const fieldScreens = (panel: string, panelTitle: string, cardCrumb: Crumb, cardName: string, fields: FieldConfig[], ci: number, isExtended: boolean): void => {
      fields.forEach((f, fi) => {
        const fName = this._fieldName(f);
        const fCrumb: Crumb = { key: `field:${f.id}`, label: fName };
        const gridMode = !isExtended && this._cardLayoutMode(this._config?.cards[ci]) === 'grid';
        push('cards', panel, FIELD_TYPE_ICONS[f.type], fName, this._fieldSub(f, gridMode), `${panelTitle} › ${cardName}`, [cardCrumb, fCrumb]);
        for (const d of this._fieldSectionDefs(f)) {
          push('cards', panel, d.icon, d.label, d.hint, `${cardName} › ${fName}`, [cardCrumb, fCrumb, crumb(d)], d.terms);
          // The state sub-screens are only offered by the menu while the field
          // overrides the global control style — mirror that gate here so
          // search can't deep-link into screens whose edits would be inert.
          if (d.key === 'fsec:controlstyle' && (f.type === 'button_group' || f.type === 'button')
              && !this._controlStyleUsesGlobal(f, this._idFor(ci, fi, isExtended))) {
            for (const s of E._fscsDefs(f.type === 'button')) {
              push('cards', panel, s.icon, s.label, s.hint, `${fName} › ${d.label}`, [cardCrumb, fCrumb, crumb(d), crumb(s)], s.terms);
            }
          }
        }
      });
    };
    (cfg.cards ?? []).forEach((c, i) => {
      const name = c.name ?? `Card ${i + 1}`;
      const cCrumb: Crumb = { key: `card:${c.id}`, label: name };
      push('cards', 'mosaic', 'mdi:view-dashboard', name,
        `${c.fields.length} field${c.fields.length === 1 ? '' : 's'}`, 'Cards › Mosaic Cards', [cCrumb]);
      for (const d of E._CARD_SECTIONS) push('cards', 'mosaic', d.icon, d.label, d.hint, `Mosaic Cards › ${name}`, [cCrumb, crumb(d)], d.terms);
      fieldScreens('mosaic', 'Mosaic Cards', cCrumb, name, c.fields, i, false);
    });
    this._extCards().forEach((c, i) => {
      const name = c.name ?? `Popover Card ${i + 1}`;
      const cCrumb: Crumb = { key: `card:${c.id}`, label: name };
      push('cards', 'popover', 'mdi:picture-in-picture-bottom-right', name,
        `${c.fields.length} field${c.fields.length === 1 ? '' : 's'}`, 'Cards › Popover Cards', [cCrumb]);
      for (const d of E._POPOVER_CARD_SECTIONS) push('cards', 'popover', d.icon, d.label, d.hint, `Popover Cards › ${name}`, [cCrumb, crumb(d)], d.terms);
      fieldScreens('popover', 'Popover Cards', cCrumb, name, c.fields, i, true);
    });
    this._embCards().forEach((ec) => {
      const name = ec.name ?? ec.id;
      const cCrumb: Crumb = { key: `emb:${ec.id}`, label: name };
      push('cards', 'embedded', 'mdi:widgets', name,
        (ec.card_config?.type as string | undefined) ?? 'No card type set', 'Cards › Embedded External Cards', [cCrumb]);
      for (const d of E._EMB_SECTIONS) push('cards', 'embedded', d.icon, d.label, d.hint, `Embedded External Cards › ${name}`, [cCrumb, crumb(d)], d.terms);
    });
    this._flows().forEach((f) => {
      const name = f.name ?? f.id;
      const cCrumb: Crumb = { key: `flow:${f.id}`, label: name };
      push('elements', 'flows', 'mdi:chart-timeline-variant', name, f.style ?? 'dashes', 'Elements › Animated Flow Lines', [cCrumb]);
      for (const d of E._FLOW_SECTIONS) push('elements', 'flows', d.icon, d.label, d.hint, `Animated Flow Lines › ${name}`, [cCrumb, crumb(d)], d.terms);
    });
    this._zones().forEach((z) => {
      const name = z.name ?? z.id;
      const cCrumb: Crumb = { key: `zone:${z.id}`, label: name };
      push('elements', 'zones', 'mdi:gesture-tap-box', name, `${z.width}×${z.height}px`, 'Elements › Clickable Zones', [cCrumb]);
      for (const d of E._ZONE_SECTIONS) push('elements', 'zones', d.icon, d.label, d.hint, `Clickable Zones › ${name}`, [cCrumb, crumb(d)], d.terms);
    });
    this._virtuals().forEach((v) => {
      const name = v.name || v.id;
      const cCrumb: Crumb = { key: `virt:${v.id}`, label: name };
      push('elements', 'virtuals', v.op === 'time_until' ? 'mdi:progress-clock' : 'mdi:memory', name,
        E._VIRTUAL_OPS.find((o) => o.value === v.op)?.label ?? v.op, 'Elements › Virtual Entities', [cCrumb]);
      for (const d of this._virtualSectionDefs(v)) push('elements', 'virtuals', d.icon, d.label, d.hint, `Virtual Entities › ${name}`, [cCrumb, crumb(d)], d.terms);
    });
    return out;
  }

  /** Rank the index against the query. Every entry needs at least one token
   *  hit on its label, hint or hidden terms — the context line alone never
   *  qualifies, so "cards" doesn't return every screen under Cards. */
  private _searchResults(q: string): NavSearchResult[] {
    const query = q.toLowerCase();
    const tokens = query.split(/\s+/).filter(Boolean);
    if (!tokens.length) return [];
    const scored: { r: NavSearchResult; score: number }[] = [];
    for (const r of this._searchIndex()) {
      const label = r.label.toLowerCase();
      const hint = r.hint.toLowerCase();
      const terms = r.terms?.toLowerCase() ?? '';
      const ctx = r.context.toLowerCase();
      let score = 0;
      let primary = 0;
      for (const t of tokens) {
        if (label.includes(t)) { score += 3; primary++; }
        else if (hint.includes(t)) { score += 2; primary++; }
        else if (terms.includes(t)) { score += 2; primary++; }
        else if (ctx.includes(t)) { score += 1; }
      }
      if (!primary) continue;
      if (label === query) score += 4;
      else if (tokens.some((t) => label.startsWith(t))) score += 2;
      scored.push({ r, score });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.r);
  }

  private _searchNavigate(r: NavSearchResult): void {
    this._searchQuery = '';
    this._searchActive = 0;
    this._navigateTo(r.tab, r.panel, r.path);
  }

  /** ↑/↓ move the active result, Enter opens it, Escape clears — consistent
   *  with the list keyboard work from #57. */
  private _onSearchKeydown(e: KeyboardEvent, results: NavSearchResult[]): void {
    const max = Math.min(results.length, MosaicCanvasEditor._SEARCH_LIMIT) - 1;
    // Results can re-rank under a live query (undo, external YAML edit), so
    // never trust _searchActive against the current list — clamp first. The
    // render side clamps the same way, keeping Enter and the highlight in step.
    const cur = Math.max(0, Math.min(this._searchActive, max));
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (max < 0) return;
      this._searchActive = e.key === 'ArrowDown' ? Math.min(cur + 1, max) : Math.max(cur - 1, 0);
      void this.updateComplete.then(() => {
        this.shadowRoot?.querySelector('.ec-search-result.active')?.scrollIntoView({ block: 'nearest' });
      });
    } else if (e.key === 'Enter') {
      const r = results[cur];
      if (r) { e.preventDefault(); this._searchNavigate(r); }
    } else if (e.key === 'Escape' && this._searchQuery) {
      e.preventDefault();
      e.stopPropagation();
      this._searchQuery = '';
      this._searchActive = 0;
    }
  }

  private _renderSearchResults(results: NavSearchResult[]): TemplateResult {
    if (!results.length) {
      return html`<p id="ec-search-results" class="ec-empty ec-search-results">No screens match — try a section name or a setting, e.g. "ticks" or "card style".</p>`;
    }
    const shown = results.slice(0, MosaicCanvasEditor._SEARCH_LIMIT);
    const active = Math.min(this._searchActive, shown.length - 1);
    return html`
      <div id="ec-search-results" class="ec-search-results" role="listbox" aria-label="Search results">
        ${shown.map((r, i) => html`
          <button id=${`ec-search-opt-${i}`} class="ec-nav-card ec-search-result${i === active ? ' active' : ''}"
            role="option" aria-selected=${i === active}
            @click=${() => this._searchNavigate(r)}
            @mousemove=${() => { if (this._searchActive !== i) this._searchActive = i; }}
          >
            <ha-icon class="ec-nav-card-icon" icon=${r.icon}></ha-icon>
            <span class="ec-nav-card-text">
              <span class="ec-nav-card-label">${r.label}</span>
              ${r.hint ? html`<span class="ec-nav-card-hint">${r.hint}</span>` : nothing}
              <span class="ec-search-result-ctx">${r.context}</span>
            </span>
            <ha-icon class="ec-nav-card-chevron" icon="mdi:chevron-right"></ha-icon>
          </button>
        `)}
        ${results.length > shown.length
          ? html`<p class="ec-search-more">${results.length - shown.length} more — keep typing to narrow</p>`
          : nothing}
      </div>
    `;
  }

  private _renderRibbon(): TemplateResult {
    const tabs: { key: 'cards' | 'elements' | 'settings'; icon: string; label: string }[] = [
      { key: 'cards',    icon: 'mdi:view-grid', label: 'Cards' },
      { key: 'elements', icon: 'mdi:shape',     label: 'Elements' },
      { key: 'settings', icon: 'mdi:cog',       label: 'Settings' },
    ];
    const q = this._searchQuery.trim();
    const results = q ? this._searchResults(q) : [];
    const activeIdx = results.length
      ? Math.min(this._searchActive, Math.min(results.length, MosaicCanvasEditor._SEARCH_LIMIT) - 1)
      : -1;
    // Config health problems surface on the tab rail so they don't need the
    // Health screen to be visited (#65). Errors only: a value that merely isn't
    // editable here is working config, and badging it would nag forever.
    const healthErrors = errorCount(this._health());
    return html`
      <input class="ec-input ec-nav-search" type="search"
        placeholder="Search all editor screens…"
        aria-label="Search all editor screens"
        role="combobox"
        aria-expanded=${results.length > 0 ? 'true' : 'false'}
        aria-controls="ec-search-results"
        aria-activedescendant=${activeIdx >= 0 ? `ec-search-opt-${activeIdx}` : nothing}
        .value=${this._searchQuery}
        @input=${(e: Event) => { this._searchQuery = (e.target as HTMLInputElement).value; this._searchActive = 0; }}
        @keydown=${(e: KeyboardEvent) => this._onSearchKeydown(e, results)}
      />
      ${q ? this._renderSearchResults(results) : html`
      <div class="ec-nav-shell">
        <div class="ec-nav-rail">
          ${tabs.map((t) => html`
            <button class="ec-nav-tab${this._navTab === t.key ? ' active' : ''}"
              @click=${() => { this._navTab = t.key; this._navPanel = ''; this._navPath = []; }}
            >
              <ha-icon icon=${t.icon}></ha-icon>
              <span>${t.label}</span>
              ${t.key === 'settings' && healthErrors > 0 ? html`<span class="ec-nav-tab-badge"
                title="${healthErrors} configuration problem${healthErrors === 1 ? '' : 's'} — see Config Health">${healthErrors}</span>` : nothing}
            </button>
          `)}
        </div>
        <div class="ec-nav-list">${this._renderRibbonItems()}</div>
      </div>`}
    `;
  }

  private _renderPanelHost(): TemplateResult {
    const meta = MosaicCanvasEditor._PANEL_META[this._navPanel];
    const title = this._navPath.length ? this._navPath[this._navPath.length - 1].label : meta?.title ?? '';
    return html`
      <div class="ec-panel-header">
        <button class="ec-panel-back" @click=${() => this._navBack()}>
          <ha-icon icon="mdi:arrow-left"></ha-icon> ${this._navPath.length ? 'Back' : 'Ribbon'}
        </button>
        <ha-icon class="ec-panel-header-icon" icon=${meta?.icon ?? 'mdi:tune'}></ha-icon>
        <span class="ec-panel-header-title" tabindex="-1">${title}</span>
        <div class="ec-panel-header-spacer"></div>
      </div>
      <div class="ec-panel-body"
        @scroll=${(e: Event) => this._panelScroll.set(this._navScrollKey(), (e.target as HTMLElement).scrollTop)}
      >
        ${(() => {
          // Echo the clicked nav button's hint as the destination screen's
          // description; the panel-level desc covers the panel root.
          const desc = this._navPath.length ? this._navPath[this._navPath.length - 1]?.hint : meta?.desc;
          return desc ? html`<p class="ec-panel-desc">${desc}</p>` : nothing;
        })()}
        ${this._renderPanelBody()}
      </div>
    `;
  }

  private _renderPanelBody(): TemplateResult {
    switch (this._navPanel) {
      case 'mosaic':    return this._renderMosaicPanel();
      case 'popover':   return this._renderPopoverPanel();
      case 'embedded':  return this._renderEmbeddedPanel();
      case 'flows':     return this._renderFlowsRibbonPanel();
      case 'zones':     return this._renderZonesRibbonPanel();
      case 'virtuals':  return this._renderVirtualsRibbonPanel();
      case 'canvas':    return this._renderCanvasRibbonPanel();
      case 'defaults':  return this._renderDefaultsRibbonPanel();
      case 'templates': return this._renderTemplatesRibbonPanel();
      case 'health':    return this._renderHealthPanel();
      case 'about':     return this._renderAboutPanel();
      default:          return html``;
    }
  }

  // ── About (#98) ─────────────────────────────────────────────────────────────
  // A terminal screen with no sections and no config of its own — like the
  // Templates import/export screens, it declares no NavSectionDef table and so
  // no paths/terms; the ribbon-root sweep already puts it in the search index.

  private _renderAboutPanel(): TemplateResult {
    return html`
      <div class="ec-section ec-about">
        <div class="ec-about-version">Mosaic Canvas Card v${CARD_VERSION} · build ${BUILD_ID}</div>
        <a class="ec-about-link" href="https://github.com/ratava/mosaic-canvas-card" target="_blank" rel="noopener">
          <ha-icon icon="mdi:github"></ha-icon> Project repository
        </a>
        <a class="ec-about-link" href="https://ratava.github.io/mosaic-canvas-card/" target="_blank" rel="noopener">
          <ha-icon icon="mdi:book-open-variant"></ha-icon> Documentation
        </a>
        <a class="ec-about-link" href="https://ko-fi.com/brentwesley" target="_blank" rel="noopener">
          <ha-icon icon="mdi:coffee"></ha-icon> Support the project on Ko-fi
        </a>
        <a class="ec-about-kofi" href="https://ko-fi.com/brentwesley" target="_blank" rel="noopener">
          <img
            src="https://storage.ko-fi.com/cdn/useruploads/X8X31ME944/qrcode.png?v=22615b40-eb49-421a-8f13-03b424b5ba97?v=2"
            alt="Support Brent Wesley"
            title="Support Brent Wesley"
            width="60"
            height="60"
          />
        </a>
      </div>
    `;
  }

  // ── Config health (#65) ─────────────────────────────────────────────────────
  // A read-only pass over the whole config, listing each reference that no
  // longer resolves and each value this editor has no screen for. The walk lives
  // in src/health.ts; everything here supplies it with what only the editor
  // knows (the `paths` manifests, the picker option arrays) and renders the rows.

  /**
   * Top-level config key → crumb key of the section screen that declares it,
   * derived from the same `paths` manifests the override badges and Clear
   * buttons read (#64). First declaration wins, which is not a tie-break so much
   * as an invariant: a slot is only ever claimed by one screen, or the badges
   * would double-count it.
   *
   * A static *method* rather than a static field per table, because a field
   * initializer here would run before the `_*_SECTIONS` tables it reads — the
   * same ordering hazard `_OPTION_LAYOUT_DEF` documents.
   */
  private static _slotMap<T>(defs: readonly NavSectionDef<T>[]): ReadonlyMap<string, string> {
    const m = new Map<string, string>();
    for (const d of defs) {
      for (const p of d.paths ?? []) {
        const top = p.split('.')[0];
        if (!m.has(top)) m.set(top, d.key);
      }
    }
    return m;
  }

  /** Section crumb key → its screen label, from the same def tables `_slotMap`
   *  reads. A crumb pushed without a label falls back to the key's tail, which
   *  would title the destination screen `sec:actions`. */
  private static _labelMap<T>(defs: readonly NavSectionDef<T>[]): ReadonlyMap<string, string> {
    return new Map(defs.map((d) => [d.key, d.label]));
  }

  /**
   * blank / rule fields skip the Sections menu entirely for one flat form
   * (`_fieldSecBlankOrRule`), so `_fieldSectionDefs` returns nothing for them and
   * this is the only declaration of what that form writes. Manifest-only: its
   * `key` is never pushed as a crumb, because the flat form *is* the field screen.
   *
   * DRIFT: keep `paths` in step with `_fieldSecBlankOrRule`'s rows — without it,
   * every blank spacer carrying a gap was reported as unreachable YAML.
   */
  private static readonly _BLANK_RULE_DEF: NavSectionDef<FieldConfig> = {
    key: 'fsec:blankform', label: 'Spacer', hint: 'Gap height', icon: 'mdi:crop-square-outline',
    paths: ['blank_gap'],
  };

  /**
   * Every def whose screen is reachable *anywhere* under a field, which is what
   * editability means — not just the top-level Sections menu.
   *
   * `_fieldSectionDefs` deliberately excludes the slots its child screens own
   * ("their slots belong to those screens, not this one"), so reading it alone
   * reported perfectly editable keys as YAML-only and offered to delete them: a
   * selector's six `option_*` keys plus its option separation, and the per-state
   * control-style slots. #61's search index descends the same way for
   * `fsec:controlstyle`; this adds the Option Layout child it also misses.
   */
  private _fieldSlotDefs(field: FieldConfig): NavSectionDef<FieldConfig>[] {
    const E = MosaicCanvasEditor;
    const defs = [...this._fieldSectionDefs(field)];
    // Option Layout is a child crumb of fsec:options for a selector. A button
    // renders the same rows inline on Button Layout and already owns the slots.
    if (field.type === 'button_group') defs.push(E._OPTION_LAYOUT_DEF);
    // The per-state screens (fscs:*) sit under fsec:controlstyle.
    if (field.type === 'button_group' || field.type === 'button') {
      defs.push(...E._fscsDefs(field.type === 'button'));
    }
    if (field.type === 'blank' || field.type === 'rule') defs.push(E._BLANK_RULE_DEF);
    return defs;
  }

  /**
   * What each dropdown actually offers, for the "value not offered" check.
   * Every entry points at the exact array its `<option>` list is built from, so
   * the two cannot drift. Enums whose options are assembled inline are
   * deliberately absent rather than restated here — a hand-copied list is the
   * failure mode this check exists to find — and the Health screen names the
   * keys it did verify so the gap is visible.
   */
  private static _healthOffered(): HealthContext['offered'] {
    const anchors = ANCHORS as readonly string[];
    const aligns = ALIGNS as readonly string[];
    return {
      // 'graph' is a legal FieldType that FIELD_TYPES omits on purpose: the Type
      // dropdown shows a graph field as 'svg' and the Element Library picker is
      // what sets it. Leaving it out here would flag every graph field on the
      // canvas as unpickable.
      field: {
        type: [...FIELD_TYPES, 'graph'],
        graph_type: GRAPH_TYPES.map((g) => g.value),
        align: aligns,
        stat_characteristic: STAT_CHARACTERISTICS.map((c) => c.value),
      },
      card:    { anchor: anchors, align: aligns },
      extCard: { align: aligns },
      zone:    { anchor: anchors },
      emb:     { anchor: anchors },
      flow:    { style: MosaicCanvasEditor._FLOW_STYLES as readonly string[] },
      virtual: { op: MosaicCanvasEditor._VIRTUAL_OPS.map((o) => o.value) },
    };
  }

  /** The def tables behind one container kind — the whole subtree, not just its
   *  top-level menu (see `_fieldSlotDefs`). #75: `NavSectionDef<any>` is the
   *  deliberate type-erasure boundary here — `_slotMap`/`_labelMap` (the only
   *  consumers, via `_healthContext`) read `.key`/`.label`/`.paths` generically
   *  across whatever kind the health scan is currently walking, so there is no
   *  single concrete root type to give this dispatcher's return value. */
  private _healthDefs(kind: Parameters<HealthContext['screens']>[0], item?: unknown): readonly NavSectionDef<any>[] {
    const E = MosaicCanvasEditor;
    switch (kind) {
      case 'card':    return E._CARD_SECTIONS;
      case 'extCard': return E._POPOVER_CARD_SECTIONS;
      case 'zone':    return E._ZONE_SECTIONS;
      case 'flow':    return E._FLOW_SECTIONS;
      case 'emb':     return E._EMB_SECTIONS;
      case 'canvas':  return E._CANVAS_SECTIONS;
      case 'field':   return this._fieldSlotDefs(item as FieldConfig);
      case 'virtual': return this._virtualSectionDefs(item as VirtualConfig);
      default:        return [];
    }
  }

  private _healthContext(): HealthContext {
    const E = MosaicCanvasEditor;
    return {
      screens: (kind, item) => {
        const defs = this._healthDefs(kind, item);
        return { slots: E._slotMap(defs), labels: E._labelMap(defs) };
      },
      offered: E._healthOffered(),
      fieldName: (f) => this._fieldName(f),
    };
  }

  /**
   * Memoised on config identity plus what the walk actually reads from hass —
   * entity *existence*. `hass.states` is a fresh object on every state change,
   * so keying on its identity alone re-ran the whole O(config) walk per tick
   * (#104); a states swap now revalidates against a cheap existence
   * fingerprint of the referenced ids and keeps the report when none flipped.
   * `_config` is replaced wholesale by `_emit`, so reference identity is a
   * sound key. The Settings tab badge reads this on *every* render, including
   * every keystroke in a text row.
   */
  private _healthCache?: {
    cfg?: MosaicCanvasConfig;
    states?: HomeAssistant['states'];
    existKey?: string;
    report: HealthReport;
  };

  /** '1'/'0' existence flags for _referencedEntities(), in walk order. */
  private _entityExistKey(states: HomeAssistant['states']): string {
    let key = '';
    for (const id of this._referencedEntities()) key += states[id] ? '1' : '0';
    return key;
  }

  private _health(): HealthReport {
    const cfg = this._config;
    const states = this.hass?.states;
    const cached = this._healthCache;
    if (cached && cached.cfg === cfg && cached.states === states) return cached.report;
    if (cached && cached.cfg === cfg && states && cached.existKey !== undefined
        && cached.existKey === this._entityExistKey(states)) {
      cached.states = states;
      return cached.report;
    }
    const report = collectHealthIssues(cfg, this.hass, this._healthContext());
    this._healthCache = {
      cfg, states, report,
      ...(states ? { existKey: this._entityExistKey(states) } : {}),
    };
    return report;
  }

  /**
   * Resolve a `HealthRemoval` to the panel's own `SectionScope` — the same sink
   * an ordinary edit on that screen writes through, so Remove reuses its merge
   * semantics, its undo step and its toast rather than growing a second
   * mutation path. Addressed by id, so a reorder between render and click still
   * lands on the right item; `undefined` when the container is gone, which the
   * caller reports instead of silently clearing the wrong thing.
   */
  private _healthRemovalScope(r: HealthRemoval): SectionScope | undefined {
    const cfg = this._config;
    if (!cfg) return undefined;
    const find = <T extends { id?: string }>(list: readonly T[] | undefined, id: string): number =>
      (list ?? []).findIndex((it) => it.id === id);
    switch (r.kind) {
      case 'card': {
        const ci = find(cfg.cards, r.itemId);
        return ci < 0 ? undefined : this._cardScope(ci);
      }
      case 'extCard': {
        const eci = find(this._extCards(), r.itemId);
        return eci < 0 ? undefined : this._extCardScope(eci);
      }
      case 'field': {
        // Widened to the shared shape both stacks satisfy — only `id` and
        // `fields` are read here, and the two card types diverge elsewhere.
        const list: readonly { id?: string; fields: FieldConfig[] }[] =
          r.extended ? this._extCards() : (cfg.cards ?? []);
        const ci = find(list, r.cardId ?? '');
        if (ci < 0) return undefined;
        const fi = find(list[ci]?.fields, r.itemId);
        return fi < 0 ? undefined : this._fieldScope(ci, fi, !!r.extended);
      }
      case 'zone': {
        const zi = find(this._zones(), r.itemId);
        return zi < 0 ? undefined : this._zoneScope(zi);
      }
      case 'flow': {
        const fi = find(this._flows(), r.itemId);
        return fi < 0 ? undefined : this._flowScope(fi);
      }
      case 'emb': {
        const ei = find(this._embCards(), r.itemId);
        return ei < 0 ? undefined : this._embScope(ei);
      }
      case 'virtual': {
        const vi = find(this._virtuals(), r.itemId);
        return vi < 0 ? undefined : this._virtualScope(vi);
      }
      default: return undefined;
    }
  }

  /**
   * Clear one YAML-only key, after naming exactly what is being discarded — the
   * value is by definition one no screen displays, so this dialog is the user's
   * only sight of it before it goes.
   */
  private _healthRemove(r: HealthIssue): void {
    const rem = r.removal;
    if (!rem) return;
    const scope = this._healthRemovalScope(rem);
    if (!scope) {
      this._showUndoToast('That item no longer exists — nothing removed');
      return;
    }
    const current = (scope.root as Record<string, unknown> | undefined)?.[rem.key];
    if (!window.confirm(
      `Remove “${rem.key}” from the YAML?\n\n`
      + `${r.where}\n`
      + `Current value: ${JSON.stringify(current) ?? 'unset'}\n\n`
      + 'The key is deleted from the configuration and the slot falls back to '
      + 'whatever the defaults resolve. This editor has no screen for it, so '
      + 'putting it back means editing the YAML by hand.\n\n'
      + 'Undo (Ctrl+Z) reverses this.'
    )) return;
    scope.apply({ [rem.key]: undefined });
    this._showUndoToast(`“${rem.key}” removed`);
  }

  /** Add or drop a stable issue id in `config.health_ignore`. */
  private _healthIgnore(id: string, on: boolean): void {
    const cfg = this._config;
    if (!cfg) return;
    const cur = cfg.health_ignore ?? [];
    const next = on ? (cur.includes(id) ? cur : [...cur, id]) : cur.filter((x) => x !== id);
    // mergePatch drops an undefined value rather than leaving a phantom
    // `health_ignore: undefined` own-property, which would make an exported
    // template differ from a visually identical config.
    this._emit(mergePatch(cfg, { health_ignore: next.length ? next : undefined }));
    this._showUndoToast(on ? 'Row ignored' : 'Row restored');
  }

  /** Ignored rows stay listed behind a footer toggle — Ignore hides a row, it
   *  never makes it unrecoverable. */
  @state() private _healthShowIgnored = false;

  private _renderHealthPanel(): TemplateResult {
    const report = this._health();
    const live = report.issues.filter((i) => !i.ignored);
    const hidden = report.issues.filter((i) => i.ignored);
    const groups = HEALTH_CHECKS
      .map((meta) => ({ meta, rows: live.filter((i) => i.check === meta.id) }))
      .filter((g) => g.rows.length > 0);
    return html`
      ${live.length === 0
        ? html`<ha-alert alert-type="success">${hidden.length
            ? 'No problems outside the ignored rows below.'
            : 'No problems found — every reference in this configuration resolves.'}</ha-alert>`
        : nothing}
      ${groups.map((g) => html`
        <div class="ec-section">
          <div class="ec-subsection-title ec-health-group-title">
            <ha-icon icon=${g.meta.icon}></ha-icon>
            <span>${g.meta.label}</span>
            <span class="ec-nav-card-badge">${g.rows.length}</span>
          </div>
          <p class="ec-hint">${g.meta.hint}</p>
          ${g.rows.map((r) => this._healthRow(r))}
        </div>
      `)}
      ${report.skipped.map((s) => html`<ha-alert alert-type="info">${s.reason}</ha-alert>`)}
      ${hidden.length ? html`
        <div class="ec-section ec-health-ignored">
          <button class="ec-health-ignored-toggle"
            @click=${() => { this._healthShowIgnored = !this._healthShowIgnored; }}
          >
            <ha-icon icon=${this._healthShowIgnored ? 'mdi:chevron-down' : 'mdi:chevron-right'}></ha-icon>
            ${hidden.length} ignored — ${this._healthShowIgnored ? 'hide' : 'show'}
          </button>
          ${this._healthShowIgnored ? hidden.map((r) => this._healthRow(r)) : nothing}
        </div>
      ` : nothing}
      ${report.coverage.map((c) => html`<p class="ec-hint ec-health-coverage">${c}</p>`)}
    `;
  }

  /**
   * One finding: the statement and its location open the screen that owns it
   * (#59); the trailing buttons are the two things this screen can do about it.
   *
   * Not a single `<button>` any more — the actions are nested controls, and a
   * button inside a button is invalid HTML that browsers reflow out of the
   * parent. The clickable body is its own element inside a plain row.
   */
  private _healthRow(r: HealthIssue): TemplateResult {
    const go = r.target;
    return html`
      <div class="ec-health-row ec-health-row--${r.severity}${r.ignored ? ' ec-health-row--ignored' : ''}">
        <button class="ec-health-row-body" ?disabled=${!go}
          title=${go ? 'Open the screen that owns this' : 'No screen holds this value'}
          @click=${() => { if (go) this._navigateTo(go.tab, go.panel, go.path); }}
        >
          <ha-icon class="ec-nav-card-icon"
            icon=${r.severity === 'error' ? 'mdi:alert-circle-outline' : 'mdi:information-outline'}></ha-icon>
          <span class="ec-nav-card-text">
            <span class="ec-nav-card-label">${r.detail}</span>
            <span class="ec-health-row-where">${r.where}</span>
          </span>
          ${go ? html`<ha-icon class="ec-nav-card-chevron" icon="mdi:chevron-right"></ha-icon>` : nothing}
        </button>
        <div class="ec-health-row-actions">
          ${r.removal && !r.ignored ? html`
            <button class="ec-health-btn ec-health-btn-remove"
              title="Delete this key from the YAML"
              @click=${() => this._healthRemove(r)}
            >Remove</button>` : nothing}
          <button class="ec-health-btn ec-health-btn-ignore"
            title=${r.ignored ? 'Show this row again' : 'Hide this row from the Health screen'}
            @click=${() => this._healthIgnore(r.id, !r.ignored)}
          >${r.ignored ? 'Un-ignore' : 'Ignore'}</button>
        </div>
      </div>
    `;
  }

  private _renderControls(): TemplateResult {
    return html`
      <div class="ec-controls">
        ${this._renderBreadcrumb()}
        ${this._navPanel === '' ? this._renderRibbon() : this._renderPanelHost()}
      </div>
    `;
  }

  private _renderMosaicPanel(): TemplateResult {
    const cards = this._config?.cards ?? [];
    const path = this._navPath;
    if (path.length === 0) {
      return html`
        <div class="ec-section-header">
          <span></span>
          <button class="ec-btn-add" @click=${this._addCard}>+ Mosaic Card</button>
        </div>
        ${cards.length === 0
          ? this._emptyAdd('No mosaic cards yet — add one', () => this._addCard())
          : cards.map(
              (c, i) => this._itemCard({
                dragKey: `card:${i}`,
                icon: 'mdi:view-dashboard',
                label: c.name ?? `Card ${i + 1}`,
                sub: `${c.fields.length} field${c.fields.length === 1 ? '' : 's'}`,
                selected: i === this._selCard,
                multi: this._selCards.has(i),
                onClick: (e: MouseEvent) => {
                  if (e.ctrlKey || e.metaKey) {
                    const next = new Set(this._selCards);
                    if (next.has(i)) { next.delete(i); } else { next.add(i); }
                    this._selCards = next;
                    this._selCard = i;
                  } else {
                    this._selCard = i;
                    this._selField = -1;
                    this._selCards = new Set([i]);
                    this._navPush(`card:${c.id}`, c.name ?? `Card ${i + 1}`);
                  }
                },
                actions: html`
                  ${this._copySourceId === c.id
                    ? html`<span class="ec-copy-badge">Copied</span>`
                    : html`<button
                        class="ec-btn-copy"
                        @click=${(e: Event) => { e.stopPropagation(); this._copyFields(i); }}
                        title="Copy fields from this card"
                      >⎘</button>`}
                  ${this._copiedFields && this._copySourceId !== c.id
                    ? html`<button
                        class="ec-btn-paste"
                        @click=${(e: Event) => { e.stopPropagation(); this._pasteFields(i); }}
                        title="Paste fields onto this card (adds to its existing fields)"
                      >⎗</button>`
                    : nothing}
                  <button
                    class="ec-btn-dup"
                    @click=${(e: Event) => { e.stopPropagation(); this._duplicateCard(i); }}
                    title="Duplicate card"
                  >⧉</button>
                  <button
                    class="ec-btn-remove"
                    @click=${(e: Event) => { e.stopPropagation(); this._removeCard(i); }}
                    title="Remove card"
                  >✕</button>
                `,
              }),
            )}
      `;
    }
    // The crumb key is the source of truth for which item is open; _sel* is
    // kept in sync FROM it (rather than the other way round) so the live
    // preview's selection highlighting, quick panel, etc. still work off a
    // single index instead of duplicating addressing logic. See #29.
    const ci = this._crumbIndex(path[0].key, cards);
    this._selCard = ci;
    const card = cards[ci];
    if (!card) return this._navDeadEnd();
    if (path.length === 1) {
      return html`
        ${this._cardSectionMenu(ci)}
        ${this._renderFieldList(ci, card)}
      `;
    }
    const key = path[1].key;
    if (key.startsWith('field:')) {
      const fi = this._crumbIndex(key, card.fields);
      this._selField = fi;
      const field = card.fields[fi];
      if (!field) return this._navDeadEnd();
      if (path.length === 4 && path[2].key === 'fsec:series' && path[3].key.startsWith('gs:')) {
        const si = this._crumbIndex(path[3].key, field.graph_series);
        this._selSeries = si;
        return this._fieldSecGraphSeriesItem(ci, fi, field, si);
      }
      if (path.length === 4 && path[2].key === 'fsec:options') {
        if (path[3].key.startsWith('opt:')) {
          const oi = this._crumbIndex(path[3].key, field.options);
          this._selOption = oi;
          return this._fieldSecOptionItem(ci, fi, field, oi);
        }
        if (path[3].key === 'optlayout') {
          return html`
            ${this._clearOverridesBtn(MosaicCanvasEditor._OPTION_LAYOUT_DEF, this._fieldScope(ci, fi, false))}
            <div class="ec-section">${this._optionLayoutEditor(
              field, this._updFor(ci, fi, false), this._idFor(ci, fi, false))}</div>
          `;
        }
      }
      // Selector and Button drill one level deeper into Field Container / states.
      if (path.length === 4 && path[2].key === 'fsec:controlstyle' && path[3].key.startsWith('fscs:')) {
        return this._fieldControlStyleStateSection(ci, fi, field, path[3].key);
      }
      return path.length === 3
        ? this._fieldSection(ci, fi, field, path[2].key)
        : this._renderFieldPanel(ci, fi, field);
    }
    if (key === 'sec:bg' && path.length === 3 && path[2].key.startsWith('bgr:')) {
      const ri = this._crumbIndex(path[2].key, card.bg?.rules);
      this._selBgRule = ri;
      return this._cardSecBgRule(ci, card, ri);
    }
    return this._cardSection(ci, card, key);
  }

  /** Slots the card background-image screen owns, relative to `bg`. */
  private static readonly _CARD_BG_PATHS = [
    'url', 'entity', 'rules', 'fit', 'opacity', 'width', 'height',
    'padding_top', 'padding_bottom', 'padding_left', 'padding_right',
  ] as const;

  private static readonly _CARD_SECTIONS: NavSectionDef<CardConfig>[] = [
    { key: 'sec:defaults',   label: 'Card Defaults',    hint: 'Name, anchor, alignment, placement, size, gaps', icon: 'mdi:tune',   terms: 'name anchor canvas align alignment columns span width height gap transparent placement flow grid rows cells row gap',
      paths: ['name', 'anchor', 'align', 'columns', 'grid_span', 'grid_row_span', 'width', 'height', 'layout_mode', 'grid', 'field_gap', 'column_gap', 'transparent'] },
    { key: 'sec:style',      label: 'Card Style',       hint: 'Transparent, background, border, shadow', icon: 'mdi:palette',      terms: BOX_STYLE_TERMS,
      paths: pfx('box', BOX_STYLE_PATHS) },
    { key: 'sec:text',       label: 'Text Styles',      hint: 'Value & label style',                   icon: 'mdi:format-title', terms: TEXT_STYLE_TERMS,
      paths: [...pfx('value_style', TEXT_STYLE_PATHS), ...pfx('label_style', TEXT_STYLE_PATHS)] },
    // visible_when is one slot, not three: operator and value only exist once
    // the entity picker has set an entity, and clearing the entity drops all of it.
    { key: 'sec:visibility', label: 'Card Visibility',  hint: 'Show / hide by condition',              icon: 'mdi:eye-outline',  terms: VISIBILITY_TERMS,
      paths: ['visible_when'] },
    { key: 'sec:actions',    label: 'Actions',          hint: 'Tap · hold · double tap',               icon: 'mdi:gesture-tap',  terms: ACTION_TERMS,
      paths: ACTION_PATHS },
    { key: 'sec:bg',         label: 'Background Image', hint: 'Image behind the card fields',          icon: 'mdi:image-outline', terms: 'url path image fit opacity width height padding cover contain stretch entity state value rules images swap',
      paths: pfx('bg', MosaicCanvasEditor._CARD_BG_PATHS) },
  ];

  /** Manifest scope for the Mosaic card sections — paths are CardConfig-relative. */
  private _cardScope(ci: number): SectionScope<CardConfig> {
    return {
      root: this._config?.cards[ci],
      apply: (patch) => this._updateCard(ci, patch),
    };
  }

  private _cardSectionMenu(ci: number): TemplateResult {
    return this._navMenu(MosaicCanvasEditor._CARD_SECTIONS, this._cardScope(ci));
  }

  private _cardSection(ci: number, card: CardConfig, key: string): TemplateResult {
    const clear = this._clearOverridesBtn(
      MosaicCanvasEditor._findDef(MosaicCanvasEditor._CARD_SECTIONS, key), this._cardScope(ci));
    const body = (): TemplateResult => {
      switch (key) {
        case 'sec:defaults':   return this._cardSecDefaults(ci, card);
        case 'sec:style':      return this._cardSecStyle(ci, card);
        case 'sec:text':       return this._cardSecText(ci, card);
        case 'sec:visibility': return this._cardSecVisibility(ci, card);
        case 'sec:actions':    return this._cardSecActions(ci, card);
        case 'sec:bg':         return this._cardSecBg(ci, card);
        default:               return html``;
      }
    };
    return html`${clear}${body()}`;
  }

  // DRIFT: row changes here must be mirrored in the sec:defaults entry of
  // _CARD_SECTIONS `terms` (hidden search vocabulary, #61).
  private _cardSecDefaults(ci: number, card: CardConfig): TemplateResult {
    return html`
      <div class="ec-section">
        ${this._row('Name',
          html`<input class="ec-input" type="text" .value=${card.name ?? ''}
            @change=${(e: Event) => this._updateCard(ci, { name: (e.target as HTMLInputElement).value })}
          />`)}

        ${this._row('Canvas Anchor',
          html`<select class="ec-select"
            .value=${card.anchor ?? sd('anchor') ?? 'top-left'}
            @change=${(e: Event) => this._updateCard(ci, { anchor: (e.target as HTMLSelectElement).value as Anchor })}
          >
            ${ANCHORS.map((a) => html`<option value=${a} .selected=${(card.anchor ?? sd('anchor') ?? 'top-left') === a}>${ANCHOR_LABELS[a]}</option>`)}
          </select>`,
          'Which point of the card sits at its X/Y position — drag the card and this is the corner that stays put.')}
        ${this._gridGeom() ? html`<p class="ec-hint">In grid mode, this is the point of the card snapped to the nearest grid intersection.</p>` : nothing}

        ${this._row('Field Alignment',
          html`<select class="ec-select"
            .value=${card.align ?? sd('align') ?? 'left'}
            @change=${(e: Event) => this._updateCard(ci, { align: (e.target as HTMLSelectElement).value as Align })}
          >
            ${ALIGNS.map((a) => html`<option value=${a} .selected=${(card.align ?? sd('align') ?? 'left') === a}>${ALIGN_LABELS[a]}</option>`)}
          </select>`,
          "Horizontal alignment of the card's fields within the card.")}

        ${this._cardPlacementRow(ci, card)}

        ${this._cardLayoutMode(card) === 'grid' ? nothing : this._optRow('Columns', '1–8 content columns', card.columns === undefined,
          html`<select class="ec-select"
            .value=${String(card.columns ?? sd('card_columns') ?? 1)}
            @change=${(e: Event) => {
              const v = Number((e.target as HTMLSelectElement).value);
              this._updateCard(ci, { columns: v });
            }}
          >
            <option value="1" .selected=${(card.columns ?? sd('card_columns') ?? 1) === 1}>1</option>
            <option value="2" .selected=${(card.columns ?? sd('card_columns') ?? 1) === 2}>2</option>
            <option value="3" .selected=${(card.columns ?? sd('card_columns') ?? 1) === 3}>3</option>
            <option value="4" .selected=${(card.columns ?? sd('card_columns') ?? 1) === 4}>4</option>
            <option value="5" .selected=${(card.columns ?? sd('card_columns') ?? 1) === 5}>5</option>
            <option value="6" .selected=${(card.columns ?? sd('card_columns') ?? 1) === 6}>6</option>
            <option value="7" .selected=${(card.columns ?? sd('card_columns') ?? 1) === 7}>7</option>
            <option value="8" .selected=${(card.columns ?? sd('card_columns') ?? 1) === 8}>8</option>
          </select>`,
          (inherit) => this._updateCard(ci, { columns: inherit ? undefined : (card.columns ?? sd('card_columns') ?? 1) }))}

        ${this._gridGeom() ? this._row('Columns (span)',
          html`${this._numWrap(html`<input class="ec-input ec-input-num" type="number" min="1" max=${this._gridGeom()!.cols}
            .value=${String(card.grid_span ?? 1)}
            @change=${(e: Event) => {
              const geom = this._gridGeom();
              if (!geom) return;
              const span = Math.max(1, Math.min(geom.cols, Number((e.target as HTMLInputElement).value) || 1));
              const width = Math.max(8, span * geom.cellW - geom.padding);
              this._updateCard(ci, { grid_span: span, width });
            }}
          />`)}`,
          'How many grid columns the card covers. Changing it resets Width to match.') : nothing}

        ${this._numRow('Width (px)', { value: card.width, onChange: (v) => this._updateCard(ci, { width: v }), min: 20, placeholder: 'auto',
          hint: 'Unset lets the card size itself to its contents.' })}

        ${this._gridGeom() ? this._row('Rows (span)',
          html`${this._numWrap(html`<input class="ec-input ec-input-num" type="number" min="1" max=${this._gridGeom()!.rows}
            .value=${String(card.grid_row_span ?? 1)}
            @change=${(e: Event) => {
              const geom = this._gridGeom();
              if (!geom) return;
              const span = Math.max(1, Math.min(geom.rows, Number((e.target as HTMLInputElement).value) || 1));
              const height = Math.max(8, span * geom.cellH - geom.padding);
              this._updateCard(ci, { grid_row_span: span, height });
            }}
          />`)}`,
          'How many grid rows the card covers. Changing it resets Height to match.') : nothing}

        ${this._numRow('Height (px)', { value: card.height, onChange: (v) => this._updateCard(ci, { height: v }), min: 20, placeholder: 'auto',
          hint: 'Unset lets the card size itself to its contents. In grid field placement this is the height the rows divide up; in flow placement it is only a minimum, so a card can still grow past it.' })}

        ${this._cardGridSizeRows(ci, card)}

        ${this._optRow('Field gap (px)',
          this._cardLayoutMode(card) === 'grid'
            ? 'Space between a field’s own parts'
            : 'Vertical space between fields',
          card.field_gap === undefined,
          html`${this._numInput({ value: card.field_gap ?? sd('field_gap') ?? 4, onChange: (v) => this._updateCard(ci, { field_gap: v }), min: 0 })}`,
          (inherit) => this._updateCard(ci, { field_gap: inherit ? undefined : (card.field_gap ?? sd('field_gap') ?? 4) }))}
        ${this._cardLayoutMode(card) === 'grid' ? html`<p class="ec-hint">In grid placement the cells space the fields, so this
          only separates a field's own parts — its label from its value, or the lines of a time-until layout.</p>` : nothing}

        ${this._optRow('Column gap (px)', 'Space between field columns', card.column_gap === undefined,
          html`${this._numInput({ value: card.column_gap ?? sd('column_gap') ?? 3, onChange: (v) => this._updateCard(ci, { column_gap: v }), min: 0 })}`,
          (inherit) => this._updateCard(ci, { column_gap: inherit ? undefined : (card.column_gap ?? sd('column_gap') ?? 3) }))}

        ${this._cardRowGapRow(ci, card)}

        ${this._row('Transparent',
          html`<input type="checkbox" .checked=${card.transparent ?? false}
            @change=${(e: Event) => this._updateCard(ci, { transparent: (e.target as HTMLInputElement).checked || undefined })}
          />`)}
        <p class="ec-hint">Hides the card's box entirely — background, border, shadow and blur. <b>Card Style</b>
          is skipped while this is ticked.</p>
      </div>
    `;
  }

  /**
   * Field placement rows (#102) — the flow/grid switch and, in grid mode, the
   * cell definition.
   *
   * Switching modes is deliberately non-destructive in both directions: grid
   * mode reads `grid.columns`, never `columns`, so a card sent to grid and back
   * still has the flow layout it was drawn with, and a field keeps its `column`
   * either way.
   */
  // DRIFT: row changes here must be mirrored in the sec:defaults entry of
  // _CARD_SECTIONS `terms` and `paths` (search and Config Health, #61).
  //
  // The three parts are separate methods because they belong to three different
  // places on the Card Defaults screen: the mode sits with Align, the cell counts
  // with Width and Height, and the row gap with the other two gaps.
  /**
   * The Mosaic gaps a card inherits when it sets none, resolved down the same
   * chains `renderCard` uses — including the pre-#102 shared keys at the end, so
   * a placeholder shows what a config written before the split actually gets.
   */
  private _mosaicFieldGap(): number {
    const d = this._config?.defaults;
    return d?.card_field_gap ?? sd('card_field_gap') ?? d?.field_gap ?? sd('field_gap') ?? 4;
  }

  private _mosaicColumnGap(): number {
    const d = this._config?.defaults;
    return d?.card_column_gap ?? sd('card_column_gap') ?? d?.column_gap ?? sd('column_gap') ?? 3;
  }

  /** The card's field placement, resolved down the same chain the renderer uses. */
  private _cardLayoutMode(card: CardConfig | undefined): CardLayoutMode {
    return cardLayoutMode(card, this._config?.defaults);
  }

  /** The card's cell counts, resolved down the same chain the renderer uses. */
  private _cardGridDefaults(card: CardConfig): { cols: number; rows: number } {
    const d = this._config?.defaults;
    return {
      cols: card.grid?.columns ?? d?.card_grid_columns ?? sd('card_grid_columns') ?? 4,
      rows: card.grid?.rows ?? d?.card_grid_rows ?? sd('card_grid_rows') ?? 4,
    };
  }

  private _patchCardGrid(ci: number, card: CardConfig, patch: { columns?: number; rows?: number; row_gap?: number }): void {
    const { cols, rows } = this._cardGridDefaults(card);
    this._updateCard(ci, { grid: { columns: cols, rows, ...card.grid, ...patch } });
  }

  private _cardPlacementRow(ci: number, card: CardConfig): TemplateResult {
    const mode = this._cardLayoutMode(card);
    const gridMode = mode === 'grid';
    // Inherited when it matches what the card would get anyway, explicit when it
    // doesn't — so a card only carries the key when it is actually overriding the
    // global, and flipping the global still moves every card that never chose.
    const inherited = cardLayoutMode(undefined, this._config?.defaults);
    return this._row('Field placement',
      html`<select class="ec-select"
        .value=${mode}
        @change=${(e: Event) => {
          const picked = (e.target as HTMLSelectElement).value as CardLayoutMode;
          const { cols, rows } = this._cardGridDefaults(card);
          this._updateCard(ci, {
            layout_mode: picked === inherited ? undefined : picked,
            ...(picked === 'grid' && !card.grid ? { grid: { columns: cols, rows } } : {}),
          });
        }}
      >
        <option value="flow" .selected=${!gridMode}>Flow</option>
        <option value="grid" .selected=${gridMode}>Grid</option>
      </select>`,
      'Flow stacks fields in the order they are listed. Grid divides the card into cells and each field names the row and column it sits in. Switching between them keeps both layouts, so it is always reversible.');
  }

  private _cardGridSizeRows(ci: number, card: CardConfig): TemplateResult | typeof nothing {
    if (this._cardLayoutMode(card) !== 'grid') return nothing;
    const { cols, rows } = this._cardGridDefaults(card);
    return html`
      ${this._row('Grid columns',
        html`${this._numInput({ value: cols, onChange: (v) => this._patchCardGrid(ci, card, { columns: Math.max(1, Math.min(8, v ?? 4)) }), min: 1, max: 8 })}`,
        'Kept separate from the flow Columns setting, so switching back restores the layout the card was drawn with.')}

      ${this._row('Grid rows',
        html`${this._numInput({ value: rows, onChange: (v) => this._patchCardGrid(ci, card, { rows: Math.max(1, Math.min(20, v ?? 4)) }), min: 1, max: 20 })}`)}
      <p class="ec-hint">The rows divide the card's <b>Height</b>. Without one the card still sizes to its
        contents and the rows will not be even.</p>
    `;
  }

  private _cardRowGapRow(ci: number, card: CardConfig): TemplateResult | typeof nothing {
    if (this._cardLayoutMode(card) !== 'grid') return nothing;
    const d = this._config?.defaults;
    const fallback = card.grid?.row_gap ?? d?.card_grid_row_gap ?? sd('card_grid_row_gap')
      ?? card.field_gap ?? d?.field_gap ?? sd('field_gap') ?? 4;
    return this._optRow('Row gap (px)', 'Space between grid rows', card.grid?.row_gap === undefined,
      html`${this._numInput({ value: fallback, onChange: (v) => this._patchCardGrid(ci, card, { row_gap: v }), min: 0 })}`,
      (inherit) => this._patchCardGrid(ci, card, { row_gap: inherit ? undefined : fallback }));
  }

  /**
   * Show/hide-by-condition rows, shared by Mosaic cards and embedded cards
   * (#92). The caller owns which config slot the condition lands in; clearing
   * the entity clears the whole condition, which is why `visible_when` is one
   * manifest slot rather than three.
   */
  // DRIFT: row changes here must be mirrored in VISIBILITY_TERMS, which every
  // sec:visibility entry references (hidden search vocabulary, #61).
  private _visibilityRows(
    cond: VisibilityCondition | undefined,
    apply: (v: VisibilityCondition | undefined) => void,
  ): TemplateResult {
    return html`
      ${this._row('Entity',
        html`<ha-entity-picker
          .hass=${this.hass}
          .value=${cond?.entity ?? ''}
          allow-custom-entity
          @value-changed=${(e: Event) => {
            const entity = (e as CustomEvent<{ value: string }>).detail.value;
            apply(entity
              ? { entity, operator: cond?.operator ?? '==', value: cond?.value ?? 'on' }
              : undefined);
          }}
        ></ha-entity-picker>`,
        "The card is shown or hidden based on this entity's state. Leave blank and the card is always shown.")}
      ${cond ? html`
        ${this._row('Operator',
          html`<select class="ec-select"
            .value=${cond.operator}
            @change=${(e: Event) => apply({ ...cond, operator: (e.target as HTMLSelectElement).value as VisibilityOperator })}
          >
            ${([
              ['==', 'Equals'],
              ['!=', 'Not Equal'],
              ['>',  'Greater Than'],
              ['<',  'Less Than'],
              ['>=', 'Greater Than - Equal To'],
              ['<=', 'Less Than - Equal To'],
            ] as [VisibilityOperator, string][]).map(([op, label]) =>
              html`<option value=${op} .selected=${cond.operator === op}>${label}</option>`)}
          </select>`,
          "How the entity's state is compared with Value below.")}
        ${this._row('Value',
          html`<input class="ec-input" type="text" .value=${cond.value}
            placeholder="on / off / 100 / home …"
            @change=${(e: Event) => apply({ ...cond, value: (e.target as HTMLInputElement).value })}
          />`,
          'The state to compare against, written exactly as Home Assistant reports it — on, off, a number.')}
      ` : nothing}
    `;
  }

  private _cardSecVisibility(ci: number, card: CardConfig): TemplateResult {
    return html`
      <div class="ec-section">
        ${this._visibilityRows(card.visible_when, (v) => this._updateCard(ci, { visible_when: v }))}
      </div>
    `;
  }

  private _cardSecStyle(ci: number, card: CardConfig): TemplateResult {
    return html`
      <div class="ec-section">
        ${card.transparent ? html`<p class="ec-hint">This card is Transparent (set in Card Defaults) — box style is hidden while transparent.</p>` : html`
        ${this._row('Use global card style',
          html`<input type="checkbox" .checked=${card.box === undefined}
            @change=${(e: Event) => {
              if ((e.target as HTMLInputElement).checked) {
                this._updateCard(ci, { box: undefined });
              } else {
                this._updateCard(ci, { box: {} });
              }
            }}
          />`,
          'Ticked, this card follows Settings ▸ Global Defaults ▸ Mosaic Card Defaults. Unticking gives it a box of its own, starting empty.')}
        ${card.box !== undefined ? html`
          <div class="ec-subsection-title">Box style</div>
          ${this._boxRows(`c${ci}`, card.box, (p) => this._updateCardBox(ci, p))}
        ` : nothing}
        `}
      </div>
    `;
  }

  private _cardSecText(ci: number, card: CardConfig): TemplateResult {
    return html`
      <div class="ec-section">
        ${this._row('Use global value style',
          html`<input type="checkbox" .checked=${card.value_style === undefined}
            @change=${(e: Event) => {
              if ((e.target as HTMLInputElement).checked) {
                this._updateCard(ci, { value_style: undefined });
              } else {
                this._updateCard(ci, { value_style: {} });
              }
            }}
          />`,
          'Ticked, values on this card follow Settings ▸ Global Defaults ▸ Value Default.')}
        ${card.value_style !== undefined ? html`
          <div class="ec-subsection-title">Value text style</div>
          ${this._textRows(`c${ci}-vs`, card.value_style, (p) => this._updateCard(ci, { value_style: { ...card.value_style, ...p } }))}
        ` : nothing}

        ${this._row('Use global label style',
          html`<input type="checkbox" .checked=${card.label_style === undefined}
            @change=${(e: Event) => {
              if ((e.target as HTMLInputElement).checked) {
                this._updateCard(ci, { label_style: undefined });
              } else {
                this._updateCard(ci, { label_style: {} });
              }
            }}
          />`,
          'Ticked, labels on this card follow Settings ▸ Global Defaults ▸ Label Default.')}
        ${card.label_style !== undefined ? html`
          <div class="ec-subsection-title">Label text style</div>
          ${this._textRows(`c${ci}-ls`, card.label_style, (p) => this._updateCard(ci, { label_style: { ...card.label_style, ...p } }))}
        ` : nothing}
      </div>
    `;
  }

  private _cardSecActions(ci: number, card: CardConfig): TemplateResult {
    return html`
      <div class="ec-section">
        ${this._actionRows(
          { tap_action: card.tap_action, hold_action: card.hold_action, double_tap_action: card.double_tap_action },
          (p) => this._updateCard(ci, p),
        )}
      </div>
    `;
  }

  // DRIFT: row changes here must be mirrored in the sec:bg entry of
  // _CARD_SECTIONS `paths`/`terms` (Config Health and search derive from them,
  // #61).
  private _cardSecBg(ci: number, card: CardConfig): TemplateResult {
    const rules = card.bg?.rules ?? [];
    // Clearing the image path only drops the whole bg block when nothing else is
    // configured — otherwise a card driven entirely by rules would delete its
    // own rule list the moment the default image was cleared.
    const setUrl = (v: string): void => {
      if (v) { this._updateCard(ci, { bg: { ...card.bg, url: v } }); return; }
      const rest: CardBackgroundConfig = { ...card.bg, url: undefined };
      const empty = Object.values(rest).every((x) => x == null || (Array.isArray(x) && x.length === 0));
      this._updateCard(ci, { bg: empty ? undefined : rest });
    };
    const setRules = (r: BackgroundRule[]): void =>
      this._updateCard(ci, { bg: { ...card.bg, rules: r.length ? r : undefined } });
    // The display rows below are worth showing as soon as *any* image can
    // appear — a rules-only card has no `url`, but its images still need a fit.
    const hasAnyImage = !!card.bg?.url || rules.some((r) => !!r.url);
    return html`
      <div class="ec-section">
            ${this._row('Image path',
              html`<div style="display:flex;gap:4px;align-items:center;">
                <input class="ec-input" type="text" style="flex:1;min-width:0;"
                  .value=${card.bg?.url ?? ''}
                  placeholder="/local/image.png or https://…"
                  @change=${(e: Event) => setUrl((e.target as HTMLInputElement).value.trim())}
                />
                ${this._imagePickBtn((path) => setUrl(path))}
              </div>`,
              card.bg?.entity
                ? "The default image — shown when no rule below matches, or the entity is unavailable. Leave blank for none."
                : "An image drawn behind this card's fields, under the card box. Leave blank for none.")}

            <div class="ec-subsection-title">Image by state</div>
            ${this._entitySelector({
              entity: card.bg?.entity,
              onEntity: (v) => this._updateCard(ci, { bg: { ...card.bg, entity: v || undefined } }),
            })}
            <p class="ec-hint">Leave <b>Entity</b> blank for a single fixed background. Set one and the card shows the image whose rule matches that entity's state — falling back to the <b>Image path</b> above when nothing matches.</p>
            ${card.bg?.entity ? html`
              <div class="ec-subsection-title">Rules</div>
              ${rules.length === 0
                ? this._emptyAdd('No rules yet — add one', () => setRules([...rules, {}]))
                : rules.map((r, ri) => this._itemCard({
                    icon: r.url ? 'mdi:image-check-outline' : 'mdi:image-off-outline',
                    label: MosaicCanvasEditor._bgRuleName(r, ri),
                    sub: MosaicCanvasEditor._bgRuleSub(r),
                    selected: ri === this._selBgRule,
                    onClick: () => {
                      this._selBgRule = ri;
                      this._navPush(`bgr:${ri}`, MosaicCanvasEditor._bgRuleName(r, ri));
                    },
                    actions: html`
                      <button class="ec-btn-remove" title="Remove rule"
                        @click=${(e: Event) => { e.stopPropagation(); setRules(rules.filter((_, i) => i !== ri)); }}>✕</button>
                    `,
                  }))}
              <div style="display:flex;gap:6px;margin-top:6px;">
                <button class="ec-btn-add" @click=${() => setRules([...rules, {}])}>+ Rule</button>
              </div>
              <p class="ec-hint">Each rule stands alone — one state value, one image. A value matches the state as text, as a number (<code>21</code> matches <code>21.0</code>) or as a boolean (<code>true</code> matches <code>on</code>).</p>
            ` : nothing}

            ${hasAnyImage ? html`
              <div class="ec-subsection-title">Display</div>
              <p class="ec-hint">These apply to whichever image is showing.</p>
              ${this._row('Fit',
                html`<select class="ec-select"
                  .value=${card.bg?.fit ?? 'cover'}
                  @change=${(e: Event) => this._updateCard(ci, { bg: { ...card.bg!, fit: (e.target as HTMLSelectElement).value as CardBackgroundConfig['fit'] } })}
                >
                  <option value="cover"   .selected=${(card.bg?.fit ?? 'cover') === 'cover'}>cover (fill &amp; crop)</option>
                  <option value="contain" .selected=${card.bg?.fit === 'contain'}>contain (letterbox)</option>
                  <option value="fill"    .selected=${card.bg?.fit === 'fill'}>fill (stretch)</option>
                  <option value="none"    .selected=${card.bg?.fit === 'none'}>none (natural size)</option>
                </select>`,
                'Whether the image covers the card and crops, or fits inside it whole.')}
              ${this._row('Opacity',
                html`${this._numWrap(html`<input class="ec-input ec-input-num" type="number" min="0" max="1" step="0.05"
                  .value=${String(card.bg?.opacity ?? 1)}
                  @change=${(e: Event) => {
                    const v = parseFloat((e.target as HTMLInputElement).value);
                    this._updateCard(ci, { bg: { ...card.bg!, opacity: isNaN(v) ? undefined : Math.min(1, Math.max(0, v)) } });
                  }}
                />`)}`,
                "How opaque the card's background image is.")}
              ${this._numRow('Width (px)', { value: card.bg?.width, onChange: (v) => this._updateCard(ci, { bg: { ...card.bg!, width: v } }), min: 1, placeholder: 'fill card',
                hint: 'Unset sizes the image to the card.' })}
              ${this._numRow('Height (px)', { value: card.bg?.height, onChange: (v) => this._updateCard(ci, { bg: { ...card.bg!, height: v } }), min: 1, placeholder: 'fill card',
                hint: 'Unset sizes the image to the card.' })}
              <div class="ec-subsection-title">Padding (px)</div>
              ${this._row('Top / Bottom',
                html`<div style="display:flex;gap:4px;">
                  ${this._numInput({ value: card.bg?.padding_top, onChange: (v) => this._updateCard(ci, { bg: { ...card.bg!, padding_top: v } }), min: 0, placeholder: 'Top' })}
                  ${this._numInput({ value: card.bg?.padding_bottom, onChange: (v) => this._updateCard(ci, { bg: { ...card.bg!, padding_bottom: v } }), min: 0, placeholder: 'Bottom' })}
                </div>`,
                'Vertical position of the image inside the card.')}
              ${this._row('Left / Right',
                html`<div style="display:flex;gap:4px;">
                  ${this._numInput({ value: card.bg?.padding_left, onChange: (v) => this._updateCard(ci, { bg: { ...card.bg!, padding_left: v } }), min: 0, placeholder: 'Left' })}
                  ${this._numInput({ value: card.bg?.padding_right, onChange: (v) => this._updateCard(ci, { bg: { ...card.bg!, padding_right: v } }), min: 0, placeholder: 'Right' })}
                </div>`,
                'Horizontal position of the image inside the card.')}
            ` : nothing}
      </div>
    `;
  }

  // ───────────────────────────── Image picker (#101) ─────────────────────────
  // Backs the button on the end of every Image path row. Two sources:
  //
  //   1. Backgrounds shipped with the card. Stored as a bare filename and paired
  //      with LIB_BASE at render, so the value carries no install path and works
  //      on both the dev and prod folders — the convention resolveSvgUrl set in
  //      #96. The list comes from a generated manifest, never from source.
  //
  //   2. Images in the Home Assistant media share, including ones uploaded from
  //      here. These have no unsigned static URL, so the stored value is the
  //      media-source:// id and the renderer resolves it (see MosaicCanvas).
  //
  // The `media` selector is deliberately not used: it is built for playing
  // media and demands a media_player entity before it will show anything.
  // Browsing goes straight to media_source over the WebSocket API, and uploads
  // post to /api/media_source/local_source/upload — the endpoint the HA media
  // panel uses, which only accepts writable local sources.

  /**
   * The backgrounds shipped with the card, from `backgrounds.json` — generated
   * at build time from what is actually in public/ (see
   * vite-plugin-backgrounds.ts). Never hardcode this list: the filenames change,
   * and a stale copy offers images that 404.
   *
   * Fetched once, on first open, from the same base the bundle was loaded from,
   * so it costs nothing until the picker is used.
   */
  private static _libCache?: Promise<LibImage[]>;

  private static _libImages(): Promise<LibImage[]> {
    if (!MosaicCanvasEditor._libCache) {
      MosaicCanvasEditor._libCache = fetch(LIB_BASE + 'backgrounds.json')
        .then((r) => (r.ok ? r.json() : { backgrounds: [] }))
        .then((j) => (Array.isArray(j?.backgrounds) ? (j.backgrounds as LibImage[]) : []))
        .then((list) => list.filter((b) => typeof b?.file === 'string'))
        .catch(() => []);
    }
    return MosaicCanvasEditor._libCache;
  }

  private _openImagePicker(sink: (path: string) => void): void {
    this._pickerTarget = sink;
    this._pickerFolder = undefined;
    this._pickerTrail = [];
    this._pickerErr = '';
    void this._browseMedia();
    void MosaicCanvasEditor._libImages().then((imgs) => { this._pickerLib = imgs; });
  }

  private _closeImagePicker(): void {
    this._pickerTarget = undefined;
  }

  private get _pickerHass(): {
    callWS: (m: Record<string, unknown>) => Promise<Record<string, unknown>>;
    fetchWithAuth?: (path: string, init: RequestInit) => Promise<Response>;
    auth?: { data?: { access_token?: string } };
  } {
    return this.hass as unknown as {
      callWS: (m: Record<string, unknown>) => Promise<Record<string, unknown>>;
      fetchWithAuth?: (path: string, init: RequestInit) => Promise<Response>;
      auth?: { data?: { access_token?: string } };
    };
  }

  /** Browse a media_source folder. No id = the root. */
  private async _browseMedia(id?: string, title?: string, push = true): Promise<void> {
    this._pickerErr = '';
    try {
      const res = await this._pickerHass.callWS({
        type: 'media_source/browse_media',
        ...(id ? { media_content_id: id } : {}),
      });
      this._pickerFolder = res;
      if (!id) this._pickerTrail = [];
      else if (push) this._pickerTrail = [...this._pickerTrail, { id, title: title ?? id }];
    } catch (err) {
      this._pickerFolder = undefined;
      this._pickerErr = 'The media library could not be opened.';
    }
  }

  /** Up one level, re-browsing the parent (or the root). */
  private async _browseMediaUp(): Promise<void> {
    const trail = this._pickerTrail.slice(0, -1);
    this._pickerTrail = trail;
    const parent = trail[trail.length - 1];
    await this._browseMedia(parent?.id, parent?.title, false);
  }

  /** POST a file into the folder currently open. Only local sources accept this. */
  private async _uploadMedia(file: File): Promise<void> {
    const target = String(this._pickerFolder?.media_content_id ?? '');
    if (!target) return;
    this._pickerErr = '';
    const body = new FormData();
    body.append('media_content_id', target);
    body.append('file', file);
    try {
      const path = '/api/media_source/local_source/upload';
      const res = this._pickerHass.fetchWithAuth
        ? await this._pickerHass.fetchWithAuth(path, { method: 'POST', body })
        : await fetch(path, {
            method: 'POST',
            body,
            headers: { Authorization: `Bearer ${this._pickerHass.auth?.data?.access_token ?? ''}` },
          });
      if (!res.ok) {
        this._pickerErr = 'That image could not be uploaded.';
        return;
      }
      // Re-browse in place so the new file appears.
      await this._browseMedia(target, undefined, false);
    } catch {
      this._pickerErr = 'That image could not be uploaded.';
    }
  }

  /** The button that sits on the end of an Image path input. */
  private _imagePickBtn(sink: (path: string) => void): TemplateResult {
    return html`<button class="ec-btn-clear" title="Pick an image"
      style="flex:0 0 auto;"
      @click=${() => this._openImagePicker(sink)}>
      <ha-icon icon="mdi:image-search-outline" style="--mdc-icon-size:18px;"></ha-icon>
    </button>`;
  }

  private _renderImagePickerModal(): TemplateResult | typeof nothing {
    if (!this._pickerTarget) return nothing;
    const item = this._pickerFolder;
    const children = (item?.children as Record<string, unknown>[] | undefined) ?? [];
    const canUpload = String(item?.media_content_id ?? '')
      .startsWith('media-source://media_source/');
    const take = (v: string): void => { this._pickerTarget?.(v); this._closeImagePicker(); };
    return html`
      <div class="ec-lib-backdrop" @click=${() => this._closeImagePicker()}></div>
      <div class="ec-lib-modal" style="width:min(600px,94vw);">
        <div class="ec-lib-header">
          <span class="ec-lib-title">Select image</span>
          <button class="ec-btn-clear" @click=${() => this._closeImagePicker()}>✕</button>
        </div>
        <div style="max-height:70vh;overflow-y:auto;padding:12px 16px 16px;">
          ${this._pickerErr ? html`<p class="ec-hint" style="color:var(--error-color,#e45649);word-break:break-all;">
            ${this._pickerErr}</p>` : nothing}

          <div class="ec-subsection-title" style="margin-top:0;">Card library</div>
          <p class="ec-hint" style="margin-top:0;">Backgrounds that come with the card.</p>
          ${this._pickerLib.length === 0
            ? html`<p class="ec-hint">The images that ship with the card are not available.</p>`
            : nothing}
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;margin-bottom:16px;">
            ${/* Already sorted by name in the manifest, so the picker shows the
                  same order the file reads in. */
              this._pickerLib.map((b) => html`
              <div role="button" tabindex="0" title=${b.file}
                style="cursor:pointer;border:1px solid var(--divider-color,rgba(0,212,255,0.14));border-radius:8px;overflow:hidden;"
                @click=${() => take(b.file)}>
                <img src=${LIB_BASE + b.file} alt=${b.name ?? b.file}
                  style="width:100%;height:66px;object-fit:cover;display:block;" />
                <div class="ec-item-card-sub" style="padding:4px 6px;font-size:11px;">
                  ${b.name ?? b.file}</div>
              </div>`)}
          </div>

          <div class="ec-subsection-title">Media library</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px;">
            <button class="ec-btn-clear" @click=${() => void this._browseMedia()}>⌂ Root</button>
            ${this._pickerTrail.length
              ? html`<button class="ec-btn-clear" @click=${() => void this._browseMediaUp()}>↑ Up</button>`
              : nothing}
            ${canUpload ? html`
              <label class="ec-btn-add" style="cursor:pointer;">
                ⬆ Upload here
                <input type="file" accept="image/*" style="display:none;"
                  @change=${(e: Event) => {
                    const input = e.target as HTMLInputElement;
                    const f = input.files?.[0];
                    input.value = '';
                    if (f) void this._uploadMedia(f);
                  }} />
              </label>` : nothing}
          </div>
          ${item ? html`
            <p class="ec-hint">
              <b>${String(item.title ?? '')}</b> · ${children.length}
              item${children.length === 1 ? '' : 's'}${canUpload ? '' : ' · this folder is read-only'}
            </p>` : nothing}
          ${children.map((c) => {
            const cid = String(c.media_content_id ?? '');
            const expand = c.can_expand === true;
            const thumb = typeof c.thumbnail === 'string' ? c.thumbnail : '';
            return html`
              <div class="ec-item-card" role="button" tabindex="0"
                @click=${() => {
                  if (expand) this._browseMedia(cid, String(c.title ?? cid));
                  else take(cid);
                }}>
                ${/* A source root advertises a thumbnail that does not load, which
                      is what produced a row of broken-image glyphs. Folders always
                      get the icon; a file's thumbnail hides itself if it fails. */
                  expand || !thumb
                  ? html`<ha-icon class="ec-item-card-icon"
                      icon=${expand ? 'mdi:folder-outline' : 'mdi:file-image-outline'}></ha-icon>`
                  : html`<img src=${thumb} alt="" loading="lazy"
                      style="width:34px;height:34px;object-fit:cover;border-radius:4px;flex:0 0 auto;"
                      @error=${(e: Event) => { (e.target as HTMLElement).style.display = 'none'; }} />`}
                <span class="ec-item-card-text">
                  <span class="ec-item-card-label">${String(c.title ?? cid)}</span>
                </span>
              </div>`;
          })}
        </div>
      </div>
    `;
  }
  // ─────────────────────────── end image picker ──────────────────────────────

  /** A background rule's display name: the value it matches, else its position. */
  private static _bgRuleName(r: BackgroundRule, ri: number): string {
    return r.value?.trim() || `Rule ${ri + 1}`;
  }

  /** Muted subtitle for a background-rule row: the image file it selects. */
  private static _bgRuleSub(r: BackgroundRule): string {
    if (!r.url) return 'no image';
    return r.url.split('/').pop() || r.url;
  }

  /** Terminal screen for one background rule — a value to match and the image for it. */
  private _cardSecBgRule(ci: number, card: CardConfig, ri: number): TemplateResult {
    const rules = card.bg?.rules ?? [];
    const rule = rules[ri];
    if (!rule) return this._navDeadEnd();
    const upd = (patch: Partial<BackgroundRule>): void =>
      this._updateCard(ci, {
        bg: { ...card.bg, rules: rules.map((r, i) => (i === ri ? { ...r, ...patch } : r)) },
      });
    const state = card.bg?.entity ? this.hass?.states[card.bg.entity]?.state : undefined;
    return html`
      <div class="ec-section">
        ${this._row('Value',
          html`<input class="ec-input" type="text"
            .value=${rule.value ?? ''}
            placeholder=${state ?? 'e.g. on, 21, heat'}
            @change=${(e: Event) => upd({ value: (e.target as HTMLInputElement).value.trim() || undefined })}
          />`,
          "The entity state this rule matches. Text, a number, or a boolean.")}
        ${state != null
          ? html`<p class="ec-hint">${card.bg?.entity} is currently <b>${state}</b>.</p>`
          : nothing}
        ${this._row('Image path',
          html`<div style="display:flex;gap:4px;align-items:center;">
            <input class="ec-input" type="text" style="flex:1;min-width:0;"
              .value=${rule.url ?? ''}
              placeholder="/local/image.png or https://…"
              @change=${(e: Event) => upd({ url: (e.target as HTMLInputElement).value.trim() || undefined })}
            />
            ${this._imagePickBtn((path) => upd({ url: path }))}
          </div>`,
          'Shown while the state matches. Leave blank to skip this rule.')}
      </div>
    `;
  }

  /** Resolved display name for a field row (mirrors the value shown in the field editor). */
  private _fieldName(f: FieldConfig): string {
    return f.display_name ?? (f.text ?? (f.entity?.startsWith('virtual:')
      ? (this._virtuals().find((v) => `virtual:${v.id}` === f.entity)?.name ?? f.entity)
      : (this.hass?.states[f.entity ?? '']?.attributes?.friendly_name ?? f.entity))) ?? f.icon ?? '(untitled field)';
  }

  /**
   * Muted subtitle line for a field row: column/row badges · type · graph/shape
   * detail. A span shows as a range (`C2-4`), matching how the grid actually lays
   * it out — `column` through `column_end` inclusive. The row badge only appears
   * when `gridMode` is set — a flow-placed field (and a popover field, which never
   * has a row) has no row — but then it always shows, even unset, since every
   * field in a grid-mode card occupies a row whether or not it names one.
   */
  private _fieldSub(f: FieldConfig, gridMode = false): string {
    const extra = f.type === 'graph' && f.graph_type
      ? f.graph_type
      : f.type === 'svg' && (f.shape || f.svg)
        ? (f.shape ?? f.svg!.split('/').pop()?.replace(/\.svg$/i, '') ?? '')
        : f.type === 'embedded_card' && f.embed_card_config?.type
          ? String(f.embed_card_config.type)
          : '';
    const range = (letter: string, start: number | undefined, end: number | undefined) =>
      start != null ? `${letter}${start}${end != null && end > start ? `-${end}` : ''} · ` : '';
    const colPrefix = range('C', f.column, f.column_end);
    const rowPrefix = !gridMode ? '' : f.row != null ? range('R', f.row, f.row_end) : 'R auto · ';
    return `${colPrefix}${rowPrefix}${FIELD_TYPE_LABELS[f.type]}${extra ? ' · ' + extra : ''}`;
  }

  private _renderFieldList(ci: number, card: CardConfig): TemplateResult {
    const fields = card.fields;
    const gridMode = this._cardLayoutMode(card) === 'grid';
    return html`
      <div class="ec-section ec-section--fields">
        <div class="ec-section-header">
          <span class="ec-section-title">Fields</span>
          ${this._copiedField ? html`<button class="ec-btn-paste"
            @click=${() => this._pasteField(ci)}
            title="Paste copied field onto this card">⎗ Field</button>` : nothing}
          <button class="ec-btn-add" @click=${() => this._addField(ci)}>+ Field</button>
        </div>
        ${this._listFilterBox(fields.length)}
        ${fields.length === 0
          ? this._emptyAdd('No fields yet — add one', () => this._addField(ci))
          : fields
              .map((f, fi) => ({ f, fi }))
              .filter(({ f }) => {
                const q = this._currentListFilter();
                return !q || `${this._fieldName(f)} ${this._fieldSub(f, gridMode)}`.toLowerCase().includes(q);
              })
              .map(
              ({ f, fi }) => this._itemCard({
                dragKey: `field:${ci}:${fi}`,
                icon: FIELD_TYPE_ICONS[f.type],
                label: this._fieldName(f),
                sub: this._fieldSub(f, gridMode),
                selected: fi === this._selField,
                onClick: () => { this._selField = fi; this._navPush(`field:${f.id}`, `Field ${fi + 1}`); },
                actions: html`
                  ${this._copiedFieldSrc?.isExt === false && this._copiedFieldSrc.cardId === card.id && this._copiedFieldSrc.fieldId === f.id
                    ? html`<span class="ec-copy-badge">Copied</span>`
                    : html`<button class="ec-btn-copy"
                        @click=${(e: Event) => { e.stopPropagation(); this._copyField(ci, fi, false); }}
                        title="Copy this field">⎘</button>`}
                  <button class="ec-btn-dup"
                    @click=${(e: Event) => { e.stopPropagation(); this._duplicateField(ci, fi, false); }}
                    title="Duplicate field">⧉</button>
                  <button class="ec-btn-remove"
                    @click=${(e: Event) => { e.stopPropagation(); this._removeField(ci, fi); }}
                    title="Remove">✕</button>
                `,
              }),
            )}
      </div>
    `;
  }

  private _isTimeUntilVirtual(field: FieldConfig): boolean {
    if (!field.entity?.startsWith('virtual:')) return false;
    const id = field.entity.slice('virtual:'.length);
    return this._config?.virtuals?.find((v) => v.id === id)?.op === 'time_until';
  }

  /** Return the unit the user must enter hide_below in — i.e. what is actually displayed on screen. */
  private _displayUnit(entityId: string | undefined, fieldUnit: string | undefined): string {
    if (fieldUnit !== undefined) return fieldUnit;  // explicit field override wins
    if (!entityId || entityId.startsWith('virtual:') || !this.hass) return '';
    const stateObj   = this.hass.states[entityId];
    if (!stateObj) return '';
    const entityUnit  = (stateObj.attributes?.unit_of_measurement as string | undefined) ?? '';
    const deviceClass = (stateObj.attributes?.device_class as string | undefined) ?? '';
    // Power entities: display follows global power_unit setting
    if (deviceClass === 'power') {
      const gp = this._config?.defaults?.power_unit;
      if (gp === 'W' || gp === 'kW') return gp;
      return 'W or kW';   // auto mode — depends on magnitude
    }
    // Energy storage: auto-scales kWh → MWh above 1000 kWh
    if (entityUnit === 'kWh' || entityUnit === 'MWh') return 'kWh or MWh';
    return entityUnit;
  }

  /** #68: how many decimals the entity's own current state shows, e.g. a state
   *  string of "21.5" hints 1 — purely a placeholder signal, never written. */
  private _entityDecimalsHint(entityId: string | undefined): number | undefined {
    if (!entityId || entityId.startsWith('virtual:') || !this.hass) return undefined;
    const state = this.hass.states[entityId]?.state;
    const m = state?.match(/^-?\d+\.(\d+)$/);
    return m ? m[1].length : undefined;
  }

  /**
   * #68: device classes HA treats as monotonic counters (Statistics "Sum" is
   * the standard recommendation for these — energy dashboard sources, utility
   * meters). Consulted only when the entity carries no `state_class` of its
   * own to decide from directly.
   */
  private static readonly _SUM_DEVICE_CLASSES = new Set(['energy', 'gas', 'water', 'volume', 'monetary']);

  /**
   * #68: a sensible `stat_type` for a freshly-picked graph-series entity, from
   * its own `state_class`/`device_class` — `state_class` wins when present,
   * since that is what HA's own recorder uses to decide mean-vs-sum
   * aggregation; `device_class` is a fallback for entities with neither.
   * Returns undefined (write nothing, leave the existing sd() fallback in
   * charge) when neither attribute gives an actual signal — an unclassified
   * sensor shouldn't get a guessed default.
   */
  private _defaultStatType(entityId: string | undefined): StatType | undefined {
    if (!entityId || entityId.startsWith('virtual:') || !this.hass) return undefined;
    const attrs = this.hass.states[entityId]?.attributes;
    if (!attrs) return undefined;
    const stateClass = attrs.state_class as string | undefined;
    if (stateClass === 'total' || stateClass === 'total_increasing') return 'sum';
    if (stateClass === 'measurement') return 'mean';
    const deviceClass = attrs.device_class as string | undefined;
    if (deviceClass && MosaicCanvasEditor._SUM_DEVICE_CLASSES.has(deviceClass)) return 'sum';
    return undefined;
  }

  private _isThermometerSvg(field: FieldConfig): boolean {
    return !!field.svg?.toLowerCase().includes('thermometer');
  }

  private _isHorizontalThermometerSvg(field: FieldConfig): boolean {
    return !!field.svg?.toLowerCase().includes('thermometer-horizontal');
  }

  private _isBatterySvg(field: FieldConfig): boolean {
    return !!field.svg?.toLowerCase().includes('battery');
  }

  private _isInverterSvg(field: FieldConfig): boolean {
    return !!field.svg?.toLowerCase().includes('inverter');
  }

  private _isGaugeSvg(field: FieldConfig): boolean {
    return !!field.svg?.toLowerCase().includes('gauge');
  }

  /** Friendly name of the currently-selected Element Library graphic (SVG or graph). */
  private _elementLabel(field: FieldConfig): string {
    if (field.type === 'graph') {
      return GRAPH_TYPES.find((t) => t.value === field.graph_type)?.label ?? field.graph_type ?? 'Graph';
    }
    if (field.svg) {
      const base = field.svg.split('/').pop()?.replace(/\.svg$/i, '') ?? '';
      return base.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'SVG element';
    }
    return 'None selected';
  }

  private _renderTuLayoutBuilder(
    ci: number,
    fi: number,
    field: FieldConfig,
    isExtended: boolean,
  ): TemplateResult {
    const updateFn = this._updFor(ci, fi, isExtended);
    const layout = field.time_until_layout ?? [];

    const add = (item: TimeUntilLayoutItem) =>
      updateFn({ time_until_layout: [...layout, item] });
    const remove = (idx: number) => {
      const l = layout.filter((_, i) => i !== idx);
      updateFn({ time_until_layout: l.length ? l : undefined });
    };
    const updateItem = (idx: number, patch: Partial<TimeUntilLayoutItem>) => {
      const l = [...layout];
      l[idx] = { ...l[idx], ...patch };
      updateFn({ time_until_layout: l });
    };

    const chip = (item: TimeUntilLayoutItem) => {
      if (item.type === 'label') return html`<span class="ec-tu-chip ec-tu-chip--label">⏱ Time Until Label</span>`;
      if (item.type === 'value') return html`<span class="ec-tu-chip ec-tu-chip--value">⟨value⟩</span>`;
      if (item.type === 'newline') return html`<span class="ec-tu-chip ec-tu-chip--newline">↵ New Line</span>`;
      return nothing;
    };

    return html`
      <div class="ec-subsection-title">Time Until Layout</div>
      ${layout.length === 0
        ? html`<p class="ec-empty">No items — use the buttons below to build the layout.</p>`
        : layout.map((item, idx) => {
            const dragKey = `${isExtended ? 'etu' : 'tu'}:${ci}:${fi}:${idx}`;
            return html`
            <div
              class="ec-list-row${this._dragSrc === dragKey ? ' ec-dragging' : ''}${this._dropKey === dragKey ? (this._dropBefore ? ' ec-drop-before' : ' ec-drop-after') : ''}"
              tabindex="0"
              data-drag-key=${dragKey}
              @pointerdown=${(e: PointerEvent) => {
                // Unlike _itemCard, a mouse drag must also start from the grip:
                // the row body is an inline edit surface, and a mouse drag
                // across the text input is a text selection, not a reorder.
                if (!(e.target as HTMLElement).closest('.ec-drag-handle')) return;
                this._onItemPointerDown(e, dragKey);
              }}
              @pointermove=${(e: PointerEvent) => this._onItemPointerMove(e)}
              @pointerup=${(e: PointerEvent) => this._onItemPointerUp(e)}
              @pointercancel=${(e: PointerEvent) => this._onItemPointerCancel(e)}
              @keydown=${(e: KeyboardEvent) => this._onItemCardKeydown(e, dragKey, () => {})}
            >
              <span class="ec-drag-handle" title="Drag to reorder"></span>
              <span class="ec-list-label" style="flex:1;min-width:0;">
                ${item.type === 'text'
                  ? html`<input class="ec-input" type="text" .value=${item.text ?? ''}
                      placeholder="enter text"
                      @input=${(e: Event) => updateItem(idx, { text: (e.target as HTMLInputElement).value })}
                      style="width:100%;box-sizing:border-box;" />`
                  : chip(item)}
              </span>
              <button class="ec-btn-remove" @click=${() => remove(idx)} title="Remove">✕</button>
            </div>
          `;
          })}
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;">
        <button class="ec-btn-add" @click=${() => add({ type: 'text', text: '' })}>+ Text</button>
        <button class="ec-btn-add" @click=${() => add({ type: 'label' })}>+ Label</button>
        <button class="ec-btn-add" @click=${() => add({ type: 'newline' })}>↵ New Line</button>
        <button class="ec-btn-add" @click=${() => add({ type: 'value' })}>+ Value</button>
      </div>
    `;
  }

  /**
   * Field editor header shared by every type: Type / Display Name / Column, plus
   * Row while the owning card is in grid field placement (#102).
   *
   * The card is passed rather than looked up: every call site already holds it,
   * and the placement mode and cell counts are the card's, not the field's.
   */
  private _fieldHeader(ci: number, fi: number, field: FieldConfig, card?: CardConfig): TemplateResult {
    const gridMode = this._cardLayoutMode(card) === 'grid';
    const { cols: gridCols, rows: gridRows } = this._cardGridDefaults(card ?? ({} as CardConfig));
    return html`
        ${this._row('Type',
          html`<select class="ec-select"
            .value=${field.type === 'graph' ? 'svg' : field.type}
            @change=${(e: Event) => {
              const t = (e.target as HTMLSelectElement).value as FieldType;
              if (isControlField(t)) {
                const vid = defaultVariantId(t);
                if (vid && !this._confirmVariantOptionLoss(field, t, vid)) {
                  (e.target as HTMLSelectElement).value = field.type === 'graph' ? 'svg' : field.type;
                  return;
                }
                this._updateField(ci, fi, this._typeChangePatch(field, t, vid ? variantPreset(t, vid) : {}));
              } else {
                if (!this._confirmTypeOptionLoss(field, t)) {
                  (e.target as HTMLSelectElement).value = field.type === 'graph' ? 'svg' : field.type;
                  return;
                }
                this._updateField(ci, fi, this._typeChangePatch(field, t));
                if (t === 'svg') this._openGGPicker(ci, fi);
              }
            }}
          >
            ${FIELD_TYPES_SORTED.map((t) => html`<option value=${t} .selected=${(field.type === 'graph' ? 'svg' : field.type) === t}>${FIELD_TYPE_LABELS[t]}</option>`)}
          </select>`,
          'What kind of field this is. Changing it keeps the entity and drops settings the new type has no use for.')}

        ${isControlField(field.type) && getVariants(field.type).length > 1 ? this._row('Variant',
          html`<select class="ec-select"
            .value=${field.variant ?? ''}
            @change=${(e: Event) => {
              const vid = (e.target as HTMLSelectElement).value;
              if (!this._confirmVariantOptionLoss(field, field.type, vid)) {
                (e.target as HTMLSelectElement).value = field.variant ?? '';
                return;
              }
              this._updateField(ci, fi, variantPreset(field.type, vid));
            }}
          >
            ${this._variantOptions(field.type, field.variant)}
          </select>`,
          'A saved bundle of settings for this control type. Custom variants are built under Settings ▸ Global Defaults ▸ Control Default ▸ Variant Builder.') : nothing}

        ${(field.type === 'svg' || field.type === 'graph') ? this._row('Element',
          html`<div style="display:flex;gap:8px;align-items:center;">
            <span class="ec-input" style="flex:1;min-width:0;opacity:0.85;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${this._elementLabel(field)}</span>
            <button class="ec-lib-browse-btn" style="flex:0 0 auto;white-space:nowrap;" @click=${() => this._openGGPicker(ci, fi)}>Select SVG Element</button>
          </div>`,
          'Which graphic this field draws. Opens the Element Library picker.') : nothing}

        ${this._row('Display Name',
          html`<input class="ec-input" type="text"
            .value=${field.display_name ?? ''}
            placeholder=${(field.entity && !field.entity.startsWith('virtual:')
              ? (this.hass?.states[field.entity]?.attributes?.friendly_name as string | undefined)
              : undefined) ?? 'Friendly name for the field list'}
            @change=${(e: Event) => {
              const v = (e.target as HTMLInputElement).value.trim();
              this._updateField(ci, fi, { display_name: v === '' ? undefined : v });
            }}
          />`,
          "Names the field in the editor's lists only — it is not shown on the card.")}

        ${this._fieldAxisRow(ci, fi, field, 'column', gridMode ? gridCols : 8)}

        ${gridMode ? this._fieldAxisRow(ci, fi, field, 'row', gridRows) : nothing}
    `;
  }

  /**
   * One placement axis of a field — the track it starts in and the optional one
   * it spans to. Column and Row differ only in which pair of keys they write and
   * what bounds them, so they share this rather than being two near-identical
   * blocks that drift apart.
   *
   * `max` is the card's own cell count in grid placement, so the picker cannot
   * offer a track the card doesn't have. Flow placement has no row axis and its
   * column count is a per-segment bucketing rather than a fixed grid, so it keeps
   * the standing 1–8 ceiling.
   */
  private _fieldAxisRow(
    ci: number, fi: number, field: FieldConfig, axis: 'column' | 'row', max: number,
  ): TemplateResult {
    const startKey = axis;
    const endKey = axis === 'column' ? 'column_end' : 'row_end';
    const noun = axis === 'column' ? 'column' : 'row';
    const start = field[startKey];
    const end = field[endKey];
    const write = (key: 'column' | 'column_end' | 'row' | 'row_end') => (e: Event) => {
      const v = (e.target as HTMLInputElement).value;
      this._updateField(ci, fi, { [key]: v === '' ? undefined : Number(v) });
    };
    return this._row(axis === 'column' ? 'Column' : 'Row',
      html`<div style="display:flex;gap:4px;align-items:center">
        ${this._numWrap(html`<input class="ec-input ec-input-num-small" type="number" min="1" max=${max}
          .value=${start != null ? String(start) : ''}
          placeholder="auto"
          title=${`The ${noun} this field sits in. Blank lets it flow into the next free one.`}
          @change=${write(startKey)}
        />`)}
        <span style="font-size:11px;opacity:0.6">Span end (Opt)</span>
        ${this._numWrap(html`<input class="ec-input ec-input-num-small" type="number" min="2" max=${max}
          .value=${end != null ? String(end) : ''}
          placeholder="–"
          title=${`The last ${noun} this field reaches, to span several. Blank keeps it in one.`}
          @change=${write(endKey)}
        />`)}
      </div>`,
      `Which of the card’s ${noun}s this field sits in, and how many it spans. Each box has its own note.`);
  }

  /** Field editor: menu at path.length===3 empty, or the flat trivial-type form. */
  private _renderFieldPanel(ci: number, fi: number, field: FieldConfig): TemplateResult {
    // blank/rule intentionally skip _fieldSectionMenu entirely — a spacer or a
    // divider has nothing to point an entity at, and genuinely nothing to style
    // or act on, so they get this one flat form instead of every other field
    // type's Text Style + Actions (+ type-specific sections). Kept in sync with
    // the equivalent exclusion in _fieldSectionMenu below.
    if (field.type === 'blank' || field.type === 'rule') {
      return html`
        <div class="ec-section ec-section--fields">
          ${this._fieldHeader(ci, fi, field, this._config?.cards[ci])}
          ${this._fieldSecBlankOrRule(ci, fi, field)}
        </div>
      `;
    }
    return html`
      <div class="ec-section ec-section--fields">
        ${this._fieldHeader(ci, fi, field, this._config?.cards[ci])}
        ${this._fieldSectionMenu(field, ci, fi, false)}
      </div>
    `;
  }

  /** Thermometer slots on a field. The fill colours and CSS row are Element
   *  Library only, so this is `THERMO_SUFFIXES` rather than the LIB variant. */
  private static readonly _THERMO_PATHS = keyed('thermo_', THERMO_SUFFIXES);

  /** Graph chrome colours and label sizes — `fsec:graphchrome`. */
  private static readonly _GRAPH_CHROME_PATHS = [
    'graph_axis_color', 'graph_grid_color', 'graph_zero_line_color', 'graph_baseline_color',
    'graph_label_color', 'graph_tick_color', 'graph_label_size', 'graph_unit_label_color', 'graph_bar_label_color',
    'graph_legend_label_color', 'graph_gauge_track_color', 'graph_gauge_value_color', 'graph_palette',
  ] as const;

  /** HA-statistics slots, shared by a field and a virtual entity — `fsec:stats`. */
  private static readonly _STAT_PATHS = [
    'stat_type', 'stat_characteristic', 'stat_period', 'stat_period_start', 'stat_period_end',
    'stat_period_n', 'stat_max_age_hours', 'stat_sampling_size', 'stat_percentile',
  ] as const;

  /** Control Style slots for one field type, relative to `control_style` (#64).
   *  Per field, a button's container padding belongs to Button Layout, so the
   *  container list here is the subtracted one — see BUTTON_CONTAINER_FIELD_ONLY. */
  private static _controlStylePathsFor(type: FieldType): readonly (keyof ControlStyle)[] {
    if (type === 'button_group' || type === 'button') {
      const k = type === 'button' ? 'btn' : 'sel';
      return [
        ...MosaicCanvasEditor._containerPathsForField(k),
        ...SELECTOR_STATE_PATHS['sub:active'][k],
        ...SELECTOR_STATE_PATHS['sub:inactive'][k],
      ];
    }
    // #75: CONTROL_STYLE_PATHS dropped its index signature to keep each named
    // property's own literal tuple (see its declaration) — this is the one
    // place that needs to index it by an arbitrary FieldType, so it casts here
    // rather than widening the whole table back to plain `string`.
    const byType = CONTROL_STYLE_PATHS as Partial<Record<FieldType, readonly (keyof ControlStyle)[]>>;
    return [...CONTROL_STYLE_PATHS.accent, ...(byType[type] ?? [])];
  }

  /** `sub:container` slots as a *field* owns them — see BUTTON_CONTAINER_FIELD_ONLY. */
  private static _containerPathsForField(k: 'sel' | 'btn'): readonly (keyof ControlStyle)[] {
    return k === 'btn' ? BUTTON_CONTAINER_FIELD_ONLY : SELECTOR_STATE_PATHS['sub:container'].sel;
  }

  /** Section defs for one field, resolved against its type (and SVG kind).
   *  Feeds both the rendered menu and the search index — see NavSectionDef.
   *  Every `paths` here is FieldConfig-relative (see `_fieldScope`). */
  private _fieldSectionDefs(field: FieldConfig): NavSectionDef<FieldConfig>[] {
    const E = MosaicCanvasEditor;
    const defs: NavSectionDef<FieldConfig>[] = [];
    /**
     * A selector's manual options each carry their own entity, attribute and
     * actions, so the field-level ones are not what drives it — the section is
     * noise there and is dropped. Entity-sourced options come from the field's
     * own entity, so it stays for those.
     */
    const control = (): void => {
      if (field.type === 'button_group' && (field.options_source ?? 'entity') === 'manual') return;
      defs.push({ key: 'fsec:control', label: 'Entity & Action', hint: 'Controlled entity + write action', icon: 'mdi:database', terms: ACTION_TERMS,
        paths: ['entity', 'read_attribute', 'control_service'] });
    };
    // extra_css is deliberately absent: Control Style surfaces the same
    // field.extra_css row that Text Style owns, and only one screen may claim a
    // slot or the badges double-count and either Clear wipes the other's row.
    const controlStyle = (hint = 'Colors & container (override global)'): void => {
      defs.push({ key: 'fsec:controlstyle', label: 'Control Style', hint, icon: 'mdi:palette',
        paths: [
          ...pfx('control_style', E._controlStylePathsFor(field.type)),
          // #75: FIELD_CONTAINER_SHOWS_CSS is the same constant _fieldSecControlStyle
          // passes to _boxRows — control_box.extra_css has no row here when it's false.
          ...pfx('control_box', FIELD_CONTAINER_SHOWS_CSS ? BOX_STYLE_PATHS : BOX_STYLE_PATHS_NO_CSS),
        ] });
    };
    if (field.type === 'value') {
      defs.push({ key: 'fsec:source', label: 'Value Source', hint: 'Entity, virtual entity, time-until layout', icon: 'mdi:database',
        paths: ['entity', 'attribute'] });
      defs.push({ key: 'fsec:label', label: 'Value Label', hint: 'Optional label text, position & icon', icon: 'mdi:tag-text-outline',
        terms: 'icon entity override mdi left right above below no icon position',
        paths: ['label', 'label_position', 'label_column', 'icon', 'icon_position'] });
    } else if (field.type === 'icon') {
      defs.push({ key: 'fsec:icon', label: 'Icon', hint: 'Icon, entity, state rules & icon set', icon: 'mdi:emoticon-outline',
        terms: 'entity attribute state rule rules by state mdi match value use state value weather alt alternate prefix icon set collection iconify custom icons wi phu',
        paths: ['icon', 'entity', 'attribute', 'icon_rules', 'icon_use_state', 'icon_prefix'] });
    } else if (field.type === 'label') {
      defs.push({ key: 'fsec:content', label: 'Content', hint: 'Label text & icon', icon: 'mdi:format-text',
        terms: 'icon mdi left right above below position',
        paths: ['text', 'icon', 'icon_position'] });
    } else if (field.type === 'svg') {
      // `svg` / `shape` are set by the field header's Element Library picker, not
      // by this screen, so they are not its slots to count or clear.
      defs.push({ key: 'fsec:source', label: 'Value Source', hint: 'Entity, fill source', icon: 'mdi:database',
        paths: ['entity', 'attribute', 'charging_entity', 'charging_attribute',
                'tank_pct_entity', 'tank_pct_attribute', 'tank_volume_entity', 'tank_volume_attribute',
                'tank_capacity_entity', 'tank_capacity_attribute'] });
      if (!this._isInverterSvg(field)) defs.push({ key: 'fsec:range', label: 'Range', hint: 'Min / max value', icon: 'mdi:arrow-expand-vertical',
        paths: ['min', 'max'] });
      defs.push({ key: 'fsec:colors', label: 'Colors', hint: 'Fill direction, fill, gradient, svg color', icon: 'mdi:palette', terms: 'direction up down left right graduated tank line gradient angle degrees',
        paths: ['fill_direction', 'fill_color', 'fill_color2', 'fill_angle', 'tank_color'] });
      defs.push({ key: 'fsec:size', label: 'Size', hint: 'Height, width', icon: 'mdi:resize',
        paths: ['width', 'height'] });
      if (!this._isInverterSvg(field)) defs.push({ key: 'fsec:thresholds', label: 'Color Thresholds', hint: 'Value-driven fill color overrides', icon: 'mdi:format-color-fill',
        paths: ['thresholds'] });
      if (this._isGaugeSvg(field)) {
        defs.push({ key: 'fsec:gauge', label: 'Gauge Labels', hint: 'Min/max labels, value display', icon: 'mdi:speedometer', terms: 'size color centre center show current',
          paths: ['gauge_min_label', 'gauge_max_label', 'gauge_show_value', 'gauge_label_size', 'gauge_label_color'] });
      }
      if (this._isThermometerSvg(field)) defs.push({ key: 'fsec:thermo', label: 'Thermometer', hint: 'Ticks, grid, temperature text', icon: 'mdi:thermometer', terms: THERMO_TERMS,
        paths: E._THERMO_PATHS });
    } else if (field.type === 'graph') {
      defs.push({ key: 'fsec:graph', label: 'Graph Settings', hint: 'Type, axes, legend, range, size', icon: 'mdi:chart-bar', terms: 'type axes legend min max width height stroke fill opacity x axis label title window bar line stacked timeline gauge needle zero baseline gridlines ticks decimals precision unit title curve smooth smoothed step stepped straight points markers dots latest last value horizontal sideways bar labels legend position above below left right gauge tick marks sweep degrees arc caption refresh poll interval update state names unavailable unknown entity name label',
        paths: ['graph_type', 'graph_show_axes', 'graph_show_legend', 'graph_min', 'graph_max',
                'graph_stroke_width', 'graph_fill_opacity', 'width', 'height',
                'graph_include_zero', 'graph_tick_count', 'graph_precision', 'graph_unit', 'graph_y_title', 'graph_x_title',
                'graph_curve', 'graph_points', 'graph_last_point',
                'graph_bar_labels', 'graph_legend_position',
                'graph_gauge_ticks', 'graph_gauge_sweep', 'graph_gauge_label', 'graph_refresh_minutes',
                'graph_show_state_names', 'graph_unavailable_color', 'graph_timeline_label'] });
      defs.push({ key: 'fsec:graphdata', label: 'Graph Data', hint: 'Window, sample period, calculation', icon: 'mdi:database-clock',
        terms: 'stat statistic statistics period window sample resolution bucket buckets data points 5 five minute minutes 30 thirty hour hourly day daily week weekly month monthly year yearly auto today yesterday last rolling calendar n days mean average min minimum max maximum sum total state change calculation recorder history hours depth',
        paths: ['graph_stat_period', 'graph_stat_period_n', 'graph_sample_period', 'graph_stat_type'] });
      defs.push({ key: 'fsec:series', label: 'Series', hint: 'Entities plotted on the graph', icon: 'mdi:chart-line',
        paths: ['graph_series'] });
      const gCaps = graphCaps(field.graph_type ?? sd('graph_type') ?? 'bar');
      if (gCaps.timeline) {
        defs.push({ key: 'fsec:graphstates', label: 'State Colors', hint: 'A colour per state name', icon: 'mdi:palette-swatch',
          terms: 'state states colour color map on off open closed home away heat cool timeline',
          paths: ['graph_state_colors', 'graph_unavailable_color', 'graph_show_state_names'] });
      }
      if (gCaps.gauge) {
        defs.push({ key: 'fsec:graphbands', label: 'Color Bands', hint: 'Value-driven arc colours', icon: 'mdi:format-color-fill',
          terms: 'threshold thresholds band bands arc colour color level gauge',
          paths: ['graph_thresholds'] });
      }
      defs.push({ key: 'fsec:graphchrome', label: 'Graph Style', hint: 'Axis, grid, labels, gauge track, palette', icon: 'mdi:format-paint', terms: 'axis grid gridline zero baseline label labels tick ticks values numbers dates categories unit legend track gauge palette colour color size chrome',
        paths: E._GRAPH_CHROME_PATHS });
    } else if (field.type === 'embedded_card') {
      // The only screen an embedded_card field has, so it owns extra_css here.
      defs.push({ key: 'fsec:embed', label: 'Embedded Card', hint: 'Card type, width, transparency', icon: 'mdi:widgets',
        paths: ['embed_card_config', 'width', 'embed_transparent', 'extra_css'] });
    } else if (field.type === 'toggle') {
      control();
      controlStyle();
    } else if (field.type === 'slider') {
      control();
      defs.push({ key: 'fsec:sliderrange', label: 'Range', hint: 'Min / max / step, show value, unit', icon: 'mdi:arrow-expand-horizontal',
        paths: ['min', 'max', 'step', 'unit', 'show_value'] });
      controlStyle();
    } else if (field.type === 'dropdown' || field.type === 'button_group') {
      control();
      /**
       * Save as Variant normally rides along at the bottom of Entity & Action,
       * which `control()` just declined to add for a manual button group. That
       * field type is the one with the most worth saving — the option list is
       * the design — so it gets the panel on a screen of its own rather than
       * losing it. No `paths`: the panel writes `defaults.control_variants`,
       * not a field slot, so it has nothing here to badge or clear.
       */
      if (field.type === 'button_group' && (field.options_source ?? 'entity') === 'manual') {
        defs.push({ key: 'fsec:variant', label: 'Variant', hint: 'Save this field as a reusable variant', icon: 'mdi:shape-plus',
          terms: 'variant preset save custom reuse template' });
      }
      // Option Layout and each option are their own crumb below this screen, so
      // their slots belong to those screens, not this one.
      defs.push({ key: 'fsec:options', label: 'Options', hint: 'Option source & manual list', icon: 'mdi:format-list-bulleted',
        paths: ['options_source', 'options_attribute', 'options', 'placeholder'] });
      controlStyle();
    } else if (field.type === 'input') {
      control();
      defs.push({ key: 'fsec:input', label: 'Input', hint: 'Mode, submit timing, placeholder', icon: 'mdi:form-textbox',
        paths: ['submit_on', 'placeholder', 'input_maxlength', 'input_password'] });
      controlStyle();
    } else if (field.type === 'spinbox') {
      control();
      defs.push({ key: 'fsec:sliderrange', label: 'Range', hint: 'Min / max / step, unit', icon: 'mdi:arrow-expand-horizontal',
        paths: ['min', 'max', 'step', 'unit', 'spinbox_decimals'] });
      controlStyle();
    } else if (field.type === 'button') {
      control();
      // A button renders its Option Layout inline rather than as a child crumb,
      // so this screen owns the layout slots as well as its own three rows.
      defs.push({ key: 'fsec:options', label: 'Button Layout', hint: 'Icon & state position, text styles', icon: 'mdi:gesture-tap-button',
        paths: ['label', 'icon', 'button_value',
                ...MosaicCanvasEditor._OPTION_LAYOUT_KEYS,
                ...pfx('control_style', BUTTON_SEPARATION_PATHS)] });
      controlStyle('Colors, border, padding (override global)');
    }
    if (isControlField(field.type)) {
      // `align` positions the label rows for a control, so it is this screen's
      // slot rather than Text Style's — which hides the row for control fields.
      defs.push({ key: 'fsec:labels', label: 'Labels', hint: 'Icon + text rows around the control', icon: 'mdi:label-outline',
        paths: ['control_labels', 'control_labels_position', 'control_labels_gap', 'align'] });
    }
    if (field.type === 'slider') {
      defs.push({ key: 'fsec:sliderpoints', label: 'Track Labels', hint: 'Left / center / right labels', icon: 'mdi:format-horizontal-align-center',
        paths: ['slider_labels'] });
    }
    if (field.type === 'value') {
      defs.push({ key: 'fsec:stats', label: 'HA Statistics', hint: 'Advanced statistics integration', icon: 'mdi:chart-box-outline',
        paths: E._STAT_PATHS });
      // time_until_layout belongs to the Time-Until layout builder, which is a
      // separate modal rather than a row on this screen.
      defs.push({ key: 'fsec:display', label: 'Display', hint: 'Unit, decimals, hide below', icon: 'mdi:eye-outline',
        paths: ['unit', 'decimals', 'hide_below', 'show_time_until_label'] });
    } else if (field.type === 'icon') {
      /**
       * #124: an icon field renders no number, so Unit, Decimals and the
       * trigger label have nothing to act on, and HA Statistics was inert
       * altogether — the render path returns before a statistic is ever read.
       * What is left is the one threshold that does apply, so the screen is
       * named for what it does rather than keeping a Display screen with a
       * single unrelated row.
       */
      defs.push({ key: 'fsec:visibility', label: 'Visibility', hint: 'Hide below a value', icon: 'mdi:eye-outline',
        terms: 'hide below threshold visible visibility show minimum',
        paths: ['hide_below'] });
    }
    // embedded_card has its own card-native styling and actions; blank/rule are
    // routed to a flat form before this menu is ever reached (see the panel's
    // early return) and are listed here too so the exclusion reads as one
    // deliberate list rather than being split across two methods.
    if (field.type !== 'embedded_card' && field.type !== 'blank' && field.type !== 'rule') {
      // `align` only when the row is actually here — a control field's align is
      // Labels' slot (see above), and listing it twice would double-badge it.
      // #75: a local, explicitly-typed variable rather than inlining this
      // array in the object literal below — a spread of a ternary loses
      // contextual typing against `Path<FieldConfig>` when nested that way,
      // so every element silently widens back to plain `string`.
      const textStylePaths: Path<FieldConfig>[] = [
        // #75: FIELD_CONTAINER_SHOWS_CSS is the same constant _fieldSecStyle passes
        // to _textRows — style.extra_css has no row here when it's false, but the
        // *field's* own extra_css does, via _cssRow below it, hence the separate entry.
        ...pfx('style', FIELD_CONTAINER_SHOWS_CSS ? TEXT_STYLE_PATHS : TEXT_STYLE_PATHS_NO_CSS),
        'extra_css',
      ];
      if (!isControlField(field.type)) textStylePaths.push('align');
      defs.push({ key: 'fsec:style', label: 'Text Style', hint: 'Align & value/label text style', icon: 'mdi:format-title', terms: TEXT_STYLE_TERMS,
        paths: textStylePaths });
      // A control field's gestures live in Entity & Actions alongside the write
      // action they fall back to, so it gets no second Actions section.
      if (!isControlField(field.type)) {
        defs.push({ key: 'fsec:actions', label: 'Actions', hint: 'Tap · hold · double tap', icon: 'mdi:gesture-tap', terms: ACTION_TERMS,
          paths: ACTION_PATHS });
      }
    }
    return defs;
  }

  /** Manifest scope for a field's sections — paths are FieldConfig-relative. */
  private _fieldScope(ci: number, fi: number, isExtended: boolean): SectionScope<FieldConfig> {
    const upd = this._updFor(ci, fi, isExtended);
    const card = isExtended ? this._extCards()[ci] : this._config?.cards[ci];
    return {
      root: card?.fields[fi],
      apply: upd,
    };
  }

  private _fieldSectionMenu(field: FieldConfig, ci = -1, fi = -1, isExtended = false): TemplateResult {
    return this._navMenu(this._fieldSectionDefs(field),
      ci < 0 ? undefined : this._fieldScope(ci, fi, isExtended));
  }

  /** Section dispatcher for the field editor — shared by the Mosaic (isExtended=false)
   *  and Popover (isExtended=true) stacks; only the write and DOM-id prefix differ. */
  private _fieldSection(ci: number, fi: number, field: FieldConfig, key: string, isExtended = false): TemplateResult {
    return html`
      ${this._clearOverridesBtn(
        MosaicCanvasEditor._findDef(this._fieldSectionDefs(field), key),
        this._fieldScope(ci, fi, isExtended))}
      ${this._fieldSectionBody(ci, fi, field, key, isExtended)}
    `;
  }

  private _fieldSectionBody(ci: number, fi: number, field: FieldConfig, key: string, isExtended: boolean): TemplateResult {
    switch (key) {
      case 'fsec:source':     return field.type === 'svg' ? this._fieldSecSvgSource(ci, fi, field, isExtended) : this._fieldSecValueSource(ci, fi, field, isExtended);
      case 'fsec:control':    return this._fieldSecControlSource(ci, fi, field, isExtended);
      case 'fsec:variant':    return this._fieldSecVariant(ci, fi, field, isExtended);
      case 'fsec:embed':      return this._fieldSecEmbed(ci, fi, field, isExtended);
      case 'fsec:sliderrange': return this._fieldSecSliderRange(ci, fi, field, isExtended);
      case 'fsec:options':    return this._fieldSecOptions(ci, fi, field, isExtended);
      case 'fsec:input':      return this._fieldSecInput(ci, fi, field, isExtended);
      case 'fsec:controlstyle': return this._fieldSecControlStyle(ci, fi, field, isExtended);
      case 'fsec:labels':     return this._fieldSecControlLabels(ci, fi, field, isExtended);
      case 'fsec:sliderpoints': return this._fieldSecSliderPoints(ci, fi, field, isExtended);
      case 'fsec:label':      return this._fieldSecValueLabel(ci, fi, field, isExtended);
      case 'fsec:icon':       return this._fieldSecIcon(ci, fi, field, isExtended);
      case 'fsec:content':    return this._fieldSecLabelContent(ci, fi, field, isExtended);
      case 'fsec:range':      return this._fieldSecSvgRange(ci, fi, field, isExtended);
      case 'fsec:colors':     return this._fieldSecSvgColors(ci, fi, field, isExtended);
      case 'fsec:size':       return this._fieldSecSvgSize(ci, fi, field, isExtended);
      case 'fsec:thresholds': return this._fieldSecSvgThresholds(ci, fi, field, isExtended);
      case 'fsec:gauge':      return this._fieldSecSvgGauge(ci, fi, field, isExtended);
      case 'fsec:thermo':     return this._fieldSecSvgThermo(ci, fi, field, isExtended);
      case 'fsec:graph':      return this._fieldSecGraphSettings(ci, fi, field, isExtended);
      case 'fsec:graphdata':  return this._fieldSecGraphData(ci, fi, field, isExtended);
      case 'fsec:series':     return this._fieldSecGraphSeries(ci, fi, field, isExtended);
      case 'fsec:graphstates': return this._fieldSecGraphStates(ci, fi, field, isExtended);
      case 'fsec:graphbands': return this._fieldSecGraphBands(ci, fi, field, isExtended);
      case 'fsec:graphchrome': return this._fieldSecGraphChrome(ci, fi, field, isExtended);
      case 'fsec:stats':      return this._fieldSecStats(ci, fi, field, isExtended);
      case 'fsec:display':    return this._fieldSecDisplay(ci, fi, field, isExtended);
      case 'fsec:visibility': return this._fieldSecVisibility(ci, fi, field, isExtended);
      case 'fsec:style':      return this._fieldSecStyle(ci, fi, field, isExtended);
      case 'fsec:actions':    return this._fieldSecActions(ci, fi, field, isExtended);
      default:                return html``;
    }
  }

  private _fieldSecBlankOrRule(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    if (field.type !== 'blank') return html`<p class="ec-hint">Horizontal rule — no options.</p>`;
    return html`
        ${this._numRow('Gap (px)', { value: field.blank_gap, onChange: (v) => upd({ blank_gap: v }), min: 0, placeholder: '10' })}
    `;
  }

  /**
   * Field-patch writer for either editor, following the _openGGPicker/_pickGG
   * pattern: the control sections are shared and only the write is routed.
   */
  private _updFor(ci: number, fi: number, isExtended: boolean): (p: Partial<FieldConfig>) => void {
    return (p) => isExtended ? this._updateExtField(ci, fi, p) : this._updateField(ci, fi, p);
  }

  /** Shared 'embedded_card' field section — Mosaic and Popover editors both call this, only the write is routed. */
  private _fieldSecEmbed(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    const target: EmbedTarget = isExtended ? { kind: 'extfield', ci, fi } : { kind: 'field', ci, fi };
    const cardType = field.embed_card_config?.type ? String(field.embed_card_config.type) : '';
    return html`
      <div class="ec-section">
        ${this._row('Card Type',
          html`<span style="flex:1;min-width:0;font-family:monospace;font-size:12px;color:#5aadcc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            ${cardType || html`<span style="color:#555;font-style:italic;">not set</span>`}
          </span>`,
          'Which Home Assistant card is embedded in this field.')}
        <div style="margin-top:8px;display:flex;gap:6px;">
          <button class="ec-btn-add" style="flex:1;" @click=${() => this._openEmbPicker(target)}>
            ${cardType ? 'Change Type' : 'Pick Card Type'}
          </button>
          <button class="ec-btn-add" style="flex:1;" @click=${() => void this._openEmbEditor(target)}>
            Edit Config…
          </button>
        </div>
        ${this._row('Width (px)',
          html`${this._numWrap(html`<input class="ec-input ec-input-num" type="number" min="20"
            .value=${String(field.width ?? 300)}
            @change=${(e: Event) => upd({ width: Number((e.target as HTMLInputElement).value) })}
          />`)}`,
          "How wide the embedded card is drawn. Unset lets it fill the field's column.")}
        <p class="ec-hint">Height is automatic — the embedded card sizes itself.</p>
        ${this._row('Transparent',
          html`<input type="checkbox" .checked=${field.embed_transparent ?? false}
            @change=${(e: Event) => upd({ embed_transparent: (e.target as HTMLInputElement).checked })}
          />`)}
        <p class="ec-hint">Strips the embedded card's own background, border and shadow, so the Mosaic card
          behind it shows through. It paints nothing of its own.</p>
        ${this._cssRow(field.extra_css, (v) => upd({ extra_css: v }))}
      </div>
    `;
  }

  /**
   * DOM id prefix for a field, distinct per editor so ids never collide.
   * Keyed on the field's stable id, not its index (#56): the intent flags that
   * use this as a map key (_colorOverridesOn, _optionLayoutOn, _saveVariantFor)
   * would otherwise re-target a different field the moment the list is
   * drag-reordered. Falls back to the positional form only if the field can't
   * be resolved, which is the one case where nothing is keyed off it anyway.
   */
  private _idFor(ci: number, fi: number, isExtended: boolean): string {
    const card = isExtended ? this._extCards()[ci] : this._config?.cards[ci];
    const fid = card?.fields[fi]?.id;
    const scope = isExtended ? 'e' : 'c';
    return fid ? `${scope}${fid}` : `${scope}${ci}f${fi}`;
  }

  /**
   * What a control writes when no action is set at all — the domain default
   * `_writeControl` falls back to. Shown as the placeholder so "leave it blank"
   * says what blank actually does.
   *
   * DRIFT: mirrors `_writeControl`'s domain mapping in `mosaic-canvas.ts`. It is
   * display-only; if the two disagree the placeholder is wrong, not the write.
   */
  private _derivedService(field: FieldConfig): string {
    const domain = field.entity?.split('.')[0];
    if (!domain) return '';
    const has = (...d: string[]) => d.includes(domain);
    switch (field.type) {
      case 'toggle':
      case 'button':
        return 'homeassistant.turn_on / turn_off';
      case 'slider':
      case 'spinbox':
        return has('input_number', 'number', 'counter') ? `${domain}.set_value` : '';
      case 'dropdown':
      case 'button_group':
      case 'input':
        if (has('input_select', 'select')) return `${domain}.select_option`;
        if (has('input_text', 'text')) return `${domain}.set_value`;
        return '';
      default:
        return '';
    }
  }

  /**
   * Entity & Action — what a control drives, and how it writes to it.
   *
   * This briefly also held tap / hold / double tap, on the reasoning that a
   * gesture's action and a control's write action are the same setting at
   * different specificities. They are — but a control field never receives a
   * field-level gesture: `renderField` returns the control element early
   * (`view.ts`, the `isControlField` branch) with no gesture binding, because
   * the control owns its own pointer. A slider's tap is its drag; a selector's
   * tap is its option. Those rows fired for nothing and are gone.
   *
   * Gestures live where they actually dispatch: per option on a selector, and
   * on display fields, cards and zones. `fsec:actions` stays dropped for
   * control fields, so nothing here says "Action" twice any more.
   */
  private _fieldSecControlSource(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    const derived = this._derivedService(field);
    return html`
      <div class="ec-section">
        ${this._entitySelector({
          entity: field.entity,
          onEntity: (v) => upd({ entity: v }),
          attribute: field.read_attribute,
          onAttribute: (v) => upd({ read_attribute: v }),
          attributePlaceholder: deriveAttributeFromOptionsAttribute(field.options_attribute),
        })}
        <p class="ec-hint">The entity this control reads its value from and writes back to.</p>

        <div class="ec-subsection-title">When the value changes</div>
        <p class="ec-hint">Leave blank to drive the entity from its domain — a light toggles, an <code>input_number</code> takes a value, an <code>input_select</code> picks an option. Set one only when you need something else, e.g. <code>light.turn_on</code> to drive brightness rather than on/off. Variants like Brightness and Volume fill this in for you.</p>
        <p class="ec-hint">An option with its own entity ignores this and always uses that entity's domain default.</p>
        ${this._row('Action', html`<ha-service-picker
          .hass=${this.hass}
          .value=${field.control_service ?? ''}
          placeholder=${derived || 'no automatic action for this entity'}
          @value-changed=${(e: Event) => {
            const v = (e as CustomEvent<{ value: string | undefined }>).detail.value;
            upd({ control_service: v || undefined });
          }}
        ></ha-service-picker>`)}

        ${this._saveAsVariantRows(field, this._idFor(ci, fi, isExtended))}
      </div>
    `;
  }

  /**
   * A manual-option button group has no Entity & Action screen — its options
   * each carry their own entity, so the field-level rows are noise and
   * `_fieldSectionDefs` drops them. Save as Variant lived on that screen, so
   * this is where it lives instead for that one field type.
   */
  private _fieldSecVariant(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    return html`
      <div class="ec-section">
        ${this._saveAsVariantRows(field, this._idFor(ci, fi, isExtended))}
      </div>
    `;
  }

  /**
   * "Save as Variant" — snapshot this field's preset-owned keys into a custom
   * variant. Label is required (it's what the Variant dropdown shows); on a new
   * variant the id is derived from it and made unique against bundled + custom
   * ids.
   *
   * When the field is already on a custom variant the panel also offers
   * **Update**, which rewrites that entry in place under its existing id — so
   * every field using it picks the change up, which is the whole point of
   * having tuned one field and wanting the rest to follow. Save as New stays
   * available beside it. Deleting is the Variant Builder's job, not this
   * panel's.
   */
  private _saveAsVariantRows(field: FieldConfig, idKey: string): TemplateResult {
    if (!isControlField(field.type)) return html``;
    const type = field.type;
    const current = isCustomVariant(type, field.variant) ? resolveVariant(type, field.variant) : undefined;
    const open = this._saveVariantFor === idKey;
    if (!open) {
      return html`
        <div class="ec-subsection-title">Save as Variant</div>
        <p class="ec-hint">Store this field's settings as a reusable variant on this card. It then appears under <b>Custom</b> in every control field's Variant dropdown.</p>
        ${current ? html`<p class="ec-hint">This field uses the custom variant <b>${current.label}</b>, so you can also update it with the settings as they now stand.</p>` : nothing}
        <button class="ec-btn-add" style="width:100%;"
          @click=${() => {
            this._saveVariantFor = idKey;
            // Prefill with the current custom variant's label: Update is the
            // likely intent here, and Save as New gets a sensible starting
            // point to edit rather than an empty box.
            this._saveVariantLabel = current?.label ?? '';
            this._variantError = '';
          }}
        >＋ Save as Variant…</button>
      `;
    }
    const preset = captureVariantPreset(field);
    const close = (): void => {
      this._saveVariantFor = '';
      this._saveVariantLabel = '';
      this._variantError = '';
    };
    const label = (): string => this._saveVariantLabel.trim();
    const saveNew = (): void => {
      if (!label()) { this._variantError = 'Label is required.'; return; }
      const id = uniqueVariantId(type, label());
      this._updateVariants(type, (l) => [...l, {
        id,
        label: label(),
        ...(field.icon ? { icon: field.icon } : {}),
        ...(Object.keys(preset).length ? { preset } : {}),
      }]);
      close();
    };
    const update = (): void => {
      if (!current) return;
      if (!label()) { this._variantError = 'Label is required.'; return; }
      // Keep the id: fields store it, so rewriting it would orphan every field
      // already on this variant. Label, icon and preset are all replaced.
      this._updateVariants(type, (l) => l.map((v) => (v.id === current.id ? {
        ...v,
        label: label(),
        ...(field.icon ? { icon: field.icon } : { icon: undefined }),
        preset: Object.keys(preset).length ? preset : undefined,
      } : v)));
      close();
    };
    const optionCount = field.options?.length ?? 0;
    return html`
      <div class="ec-subsection-title">Save as Variant</div>
      ${this._row('Label',
        html`<input class="ec-input" type="text" autofocus
          placeholder="e.g. Bedroom Dimmer"
          .value=${this._saveVariantLabel}
          @input=${(e: Event) => { this._saveVariantLabel = (e.target as HTMLInputElement).value; }}
          @keydown=${(e: KeyboardEvent) => { if (e.key === 'Enter') { if (current) update(); else saveNew(); } }}
        />`)}
      <p class="ec-hint">
        Saves ${Object.keys(preset).length} setting(s) from this field.
        ${current
          ? html`<b>Update</b> rewrites <b>${current.label}</b> under its existing id, so every field using it follows.
                 <b>Save as New</b> creates a separate variant with id <code>${label() ? uniqueVariantId(type, label()) : '…'}</code>.`
          : html`Id will be <code>${label() ? uniqueVariantId(type, label()) : '…'}</code>.`}
      </p>
      <p class="ec-hint">
        The entity itself is not saved — a variant is a behaviour preset, not a binding.
        ${optionCount ? html`Its ${optionCount} option(s) do travel with it, carrying their labels, icons and layout, but with
          each option's own entity stripped for the same reason — point them at your entities after applying it.` : nothing}
      </p>
      ${this._variantError ? html`<p style="color:#f44;font-size:12px;margin:0 0 6px;">${this._variantError}</p>` : nothing}
      <div style="display:flex;gap:6px;">
        ${current ? html`<button class="ec-btn-add" style="flex:1;" @click=${update}>Update “${current.label}”</button>` : nothing}
        <button class="ec-btn-add" style="flex:1;" @click=${saveNew}>${current ? 'Save as New' : 'Save'}</button>
        <button class="ec-btn-add" style="flex:0 0 auto;" @click=${close}>Cancel</button>
      </div>
    `;
  }

  /**
   * Gate on a variant change that would discard a populated option list.
   *
   * `options` is a managed key, so applying a variant clears it like any other
   * — but every other managed key is a scalar you retype in seconds, and an
   * option list is the better part of an afternoon. Undo covers it either way;
   * this is about not making someone reach for undo in surprise. Returns true
   * when the caller should go ahead.
   */
  private _confirmVariantOptionLoss(field: FieldConfig, type: FieldType, vid: string): boolean {
    if (!variantSwitchClearsOptions(field, type, vid)) return true;
    const n = field.options?.length ?? 0;
    return window.confirm(
      `This variant brings no options of its own, so applying it will clear the ${n} option${n === 1 ? '' : 's'} on this field.\n\n`
      + 'Undo restores them. Save the field as a variant first if you want to keep this list.');
  }

  /**
   * The patch for a field-type change (#109): the new type plus any variant
   * preset, and `undefined` for every key the new type has no screen for — the
   * Type row's hint has always promised "drops settings the new type has no
   * use for", but the handlers used to patch `{ type }` alone, so a label
   * converted to an icon field kept its `icon_position` invisibly and Config
   * Health (correctly) flagged it as unreachable. The keep-set is the new
   * type's own manifests — the same `_fieldSlotDefs` tables the health walk
   * reads — plus health's structural allowlist, so by construction a type
   * change can no longer strand a key that walk would report.
   */
  private _typeChangePatch(field: FieldConfig, t: FieldType, preset: Partial<FieldConfig> = {}): Partial<FieldConfig> {
    const E = MosaicCanvasEditor;
    const next = mergePatch(field, { type: t, ...preset } as Partial<FieldConfig>);
    const keep = new Set<string>([
      ...E._slotMap(this._fieldSlotDefs(next)).keys(),
      ...fieldStructuralKeys(next),
    ]);
    const patch: Record<string, unknown> = { type: t, ...preset };
    for (const k of Object.keys(field)) {
      if (!(k in patch) && !keep.has(k)) patch[k] = undefined;
    }
    return patch as Partial<FieldConfig>;
  }

  /**
   * Companion confirm for `_typeChangePatch` when leaving control land: the
   * option list is the one pruned setting worth a pause (same reasoning as
   * `_confirmVariantOptionLoss` — everything else is retyped in seconds).
   * Control-to-control changes keep options structurally and need no ask.
   */
  private _confirmTypeOptionLoss(field: FieldConfig, t: FieldType): boolean {
    if (isControlField(t) || !field.options?.length) return true;
    const n = field.options.length;
    return window.confirm(
      `A ${FIELD_TYPE_LABELS[t] ?? t} field has no options, so changing the type drops the ${n} option${n === 1 ? '' : 's'} on this field.\n\n`
      + 'Undo restores them.');
  }

  /**
   * #68: `number.*`/`input_number.*` entities publish their own min/max/step
   * as state attributes — the same values HA's own more-info dialog uses to
   * build its slider. Any other domain (or no entity yet) yields undefined
   * for all three, so the caller's literal placeholders stand.
   */
  private _numberEntityRange(entityId: string | undefined): { min?: number; max?: number; step?: number } {
    if (!entityId || (!entityId.startsWith('number.') && !entityId.startsWith('input_number.')) || !this.hass) return {};
    const attrs = this.hass.states[entityId]?.attributes;
    if (!attrs) return {};
    const num = (v: unknown): number | undefined => typeof v === 'number' ? v : undefined;
    return { min: num(attrs.min), max: num(attrs.max), step: num(attrs.step) };
  }

  private _fieldSecSliderRange(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    const entityRange = this._numberEntityRange(field.entity);
    const numRow = (label: string, key: 'min' | 'max' | 'step', fallback: string, hint: string): TemplateResult =>
      this._numRow(label, { value: field[key], onChange: (v) => upd({ [key]: v } as Partial<FieldConfig>),
        placeholder: entityRange[key]?.toString() ?? fallback, hint });
    return html`
      <div class="ec-section">
        ${numRow('Min', 'min', '0', "Unset follows the entity's own minimum.")}
        ${numRow('Max', 'max', '100', "Unset follows the entity's own maximum.")}
        ${numRow('Step', 'step', '1', 'Smallest change the control can make.')}
        ${field.type === 'spinbox'
          ? this._controlNumRow('Decimals', field.spinbox_decimals, 'auto', (v) => upd({ spinbox_decimals: v }), 0,
              'How many decimal places the spin box shows.')
          : nothing}
        ${this._row('Unit',
          html`<input class="ec-input" type="text" .value=${field.unit ?? ''}
            placeholder=${this._displayUnit(field.entity, undefined) || 'e.g. %'}
            @change=${(e: Event) => {
              const v = (e.target as HTMLInputElement).value;
              upd({ unit: v === '' ? undefined : v });
            }} />`,
          "Shown after the value. Unset uses the entity's own unit.")}
        ${field.type === 'slider' ? this._row('Show value',
          html`<input type="checkbox" class="ec-checkbox"
            .checked=${field.show_value ?? true}
            @change=${(e: Event) => upd({ show_value: (e.target as HTMLInputElement).checked })} />`,
          'Shows the current value beside the slider.') : nothing}
      </div>
    `;
  }

  /** Editor for a single ControlLabel: icon + text + its own text style. */
  private _controlLabelEditor(idPrefix: string, label: ControlLabel, upd: (p: Partial<ControlLabel>) => void): TemplateResult {
    return html`
      ${this._row('Icon', this._iconPicker(label.icon, (v) => upd({ icon: v })),
        'An mdi icon shown on this label row. Leave blank for text only.')}
      ${this._row('Text',
        html`<input class="ec-input" type="text" .value=${label.text ?? ''}
          @change=${(e: Event) => { const v = (e.target as HTMLInputElement).value; upd({ text: v || undefined }); }} />`,
        'Text shown on this label row.')}
      <div class="ec-subsection-title">Text style</div>
      ${this._textRows(`${idPrefix}-st`, label.style ?? {}, (p) => upd({ style: { ...label.style, ...p } }), false)}
    `;
  }

  private _fieldSecControlLabels(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    const rows = field.control_labels ?? [];
    const setRows = (r: ControlLabel[]): void => upd({ control_labels: r.length ? r : undefined });
    const pos = field.control_labels_position ?? 'above';
    return html`
      <div class="ec-section">
        <p class="ec-hint">Stacked icon + text rows placed around the control. Each row has its own text style.</p>
        ${this._row('Position',
          html`<select class="ec-select" .value=${pos}
            @change=${(e: Event) => upd({ control_labels_position: (e.target as HTMLSelectElement).value as 'above' | 'below' | 'left' | 'right' })}
          >
            ${(['above', 'below', 'left', 'right'] as const).map((p) => html`<option value=${p} .selected=${pos === p}>${p.charAt(0).toUpperCase() + p.slice(1)}</option>`)}
          </select>`)}
        ${this._row('Alignment',
          html`<select class="ec-select" .value=${field.align ?? 'left'}
            @change=${(e: Event) => upd({ align: (e.target as HTMLSelectElement).value as Align })}
          >
            ${ALIGNS.map((a) => html`<option value=${a} .selected=${(field.align ?? 'left') === a}>${ALIGN_LABELS[a]}</option>`)}
          </select>`)}
        <p class="ec-hint">Horizontal placement of the label rows against the control — <b>Position</b> covers where they sit. Above or below, the rows align to the control's width; beside it, they align to each other.</p>
        ${this._controlNumRow('Gap to control (px)', field.control_labels_gap,
          String(this._config?.defaults?.control_gap ?? sd('control_gap') ?? 4),
          (v) => upd({ control_labels_gap: v }), 0)}
        ${rows.length === 0 ? html`<p class="ec-empty">No label rows — click "+ Label row".</p>` : nothing}
        ${rows.map((row, idx) => html`
          <div class="ec-section-header">
            <span class="ec-section-title">Row ${idx + 1}</span>
            <button class="ec-btn-remove" title="Remove row" @click=${() => setRows(rows.filter((_, i) => i !== idx))}>✕</button>
          </div>
          ${this._controlLabelEditor(`${this._idFor(ci, fi, isExtended)}-lbl${idx}`, row, (p) => { const n = [...rows]; n[idx] = { ...row, ...p }; setRows(n); })}
        `)}
        <button class="ec-btn-add" @click=${() => setRows([...rows, {}])}>+ Label row</button>
      </div>
    `;
  }

  private _fieldSecSliderPoints(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    const sl = field.slider_labels ?? {};
    const setPoint = (k: 'left' | 'center' | 'right', p: Partial<SliderTrackLabel>): void =>
      upd({ slider_labels: { ...sl, [k]: { ...sl[k], ...p } } });
    return html`
      <div class="ec-section">
        <p class="ec-hint">Labels anchored to the track — left (min), center, right (max). Each has its own text style and optional live value.</p>
        ${(['left', 'center', 'right'] as const).map((k) => {
          const pt: SliderTrackLabel = sl[k] ?? {};
          const idPrefix = `${this._idFor(ci, fi, isExtended)}-pt-${k}`;
          return html`
            <div class="ec-slider-pt">
              <div class="ec-section-header"><span class="ec-section-title">${k.charAt(0).toUpperCase() + k.slice(1)}</span></div>
              ${this._entitySelector({
                label: 'Value entity',
                entity: pt.entity,
                onEntity: (v) => setPoint(k, { entity: v }),
                attribute: pt.attribute,
                onAttribute: (v) => setPoint(k, { attribute: v }),
              })}
              ${pt.entity ? html`<p class="ec-hint">Showing this entity's live value instead of Text below.</p>` : nothing}
              ${k !== 'center'
                ? this._controlNumRow('Gap from edge (px)', pt.gap, '0', (v) => setPoint(k, { gap: v }), 0)
                : nothing}
              ${this._controlLabelEditor(idPrefix, pt, (p) => setPoint(k, p))}
            </div>
          `;
        })}
      </div>
    `;
  }

  private _fieldSecOptions(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    const source = field.options_source ?? 'entity';
    const opts = field.options ?? [];
    const setOpts = (o: NonNullable<FieldConfig['options']>): void =>
      upd({ options: o.length ? o : undefined });
    // Panel-scoped, like gs/egs: a drop can only land inside its own list.
    const optk = isExtended ? 'eopt' : 'opt';
    // A button is a one-option control built from the field itself — there is no
    // option list to configure, only the cell layout.
    if (field.type === 'button') {
      return html`<div class="ec-section">
        <p class="ec-hint">A button is a single cell. Its icon, label and state come from the field's own <b>Entity &amp; Action</b> settings; the layout below places them.</p>
        ${this._row('Label',
          html`<input class="ec-input" type="text" .value=${field.label ?? ''}
            @change=${(e: Event) => { const v = (e.target as HTMLInputElement).value; upd({ label: v || undefined }); }} />`,
          'Text on the button. Leave blank for an icon-only button.')}
        ${this._row('Icon', this._iconPicker(field.icon, (v) => upd({ icon: v }), 'from entity state'),
          'An mdi icon on the button.')}
        ${this._row('Press writes',
          html`<input class="ec-input" type="text" placeholder="toggle the entity" .value=${field.button_value ?? ''}
            @change=${(e: Event) => { const v = (e.target as HTMLInputElement).value.trim(); upd({ button_value: v || undefined }); }} />`)}
        <p class="ec-hint">Leave <b>Press writes</b> blank to toggle the entity with its domain default action. Set a value and the button writes that instead, showing as active while the entity's state matches it.</p>
        ${this._optionLayoutEditor(field, upd, this._idFor(ci, fi, isExtended))}
      </div>`;
    }
    return html`
      <div class="ec-section">
        ${this._row('Options source',
          html`<select class="ec-select" .value=${source}
            @change=${(e: Event) => upd({ options_source: (e.target as HTMLSelectElement).value as 'entity' | 'manual' })}
          >
            <option value="entity" .selected=${source === 'entity'}>From entity</option>
            <option value="manual" .selected=${source === 'manual'}>Manual list</option>
          </select>`,
          'Where the list of choices comes from.')}
        <p class="ec-hint"><b>From entity</b> reads the choices the entity itself offers (an <code>input_select</code>'s options, a light's effects, a climate's modes). <b>Manual list</b> lets you write your own options — the only source that can give an option its own entity, icon or line.</p>
        ${/* button_group_layout ('row' | 'wrap') is still read by the runtime and
              carried in variants — only its editor row is hidden. Variants set
              it, and existing configs keep working. */ nothing}
        ${field.type === 'dropdown' ? this._row('Placeholder',
          html`<input class="ec-input" type="text" .value=${field.placeholder ?? ''} placeholder="—"
            @change=${(e: Event) => { const v = (e.target as HTMLInputElement).value; upd({ placeholder: v === '' ? undefined : v }); }}
          />`,
          'Shown on the closed dropdown when nothing matches.') : nothing}
        ${field.type === 'dropdown'
          ? html`<p class="ec-hint">Shown on the closed dropdown when the entity's state doesn't match any option — usually because it is unavailable or mid-change.</p>`
          : nothing}
        ${source === 'entity'
          ? html`
            ${this._row('Options attribute',
              html`<input class="ec-input" type="text" placeholder="options" .value=${field.options_attribute ?? ''}
                @change=${(e: Event) => { const v = (e.target as HTMLInputElement).value.trim(); upd({ options_attribute: v || undefined }); }} />`,
              'The entity attribute holding the option list — e.g. options, effect_list, source_list, hvac_modes.')}`
          : html`
            <div class="ec-subsection-title">Options — drag to reorder</div>
            <p class="ec-hint">Each option opens its own screen. Leave its <b>Entity</b> blank for a normal option that writes its value to the field's entity; set one and the option acts on <i>that</i> entity instead, showing its state and state icon — so one button group can drive several lights.</p>
            ${opts.length === 0
              ? this._emptyAdd('No options yet — add one', () => setOpts([...opts, {}]))
              : opts.map((o, oi) => this._itemCard({
                  dragKey: `${optk}:${ci}:${fi}:${oi}`,
                  icon: o.icon || (o.entity ? 'mdi:link-variant' : 'mdi:format-list-bulleted'),
                  label: MosaicCanvasEditor._optionName(o, oi),
                  sub: MosaicCanvasEditor._optionSub(o),
                  selected: oi === (isExtended ? this._selExtOption : this._selOption),
                  onClick: () => {
                    if (isExtended) this._selExtOption = oi; else this._selOption = oi;
                    this._navPush(`${optk}:${oi}`, MosaicCanvasEditor._optionName(o, oi));
                  },
                  actions: html`
                    <button class="ec-btn-copy" title="Copy this option"
                      @click=${(e: Event) => { e.stopPropagation(); this._copiedOption = { ...o }; }}>⎘</button>
                    <button class="ec-btn-remove" title="Remove option"
                      @click=${(e: Event) => { e.stopPropagation(); setOpts(opts.filter((_, i) => i !== oi)); }}>✕</button>
                  `,
                }))}
            <div style="display:flex;gap:6px;margin-top:6px;">
              <button class="ec-btn-add" @click=${() => setOpts([...opts, {}])}>+ Option</button>
              ${this._copiedOption ? html`<button class="ec-btn-paste"
                @click=${() => setOpts([...opts, { ...this._copiedOption }])}
                title="Paste copied option">⎗ Option</button>` : nothing}
            </div>
            <p class="ec-hint"><b>Line</b> groups options into rows — options sharing a line number render on the same line, in order. Blank = line 1.</p>
          `}
        ${field.type === 'button_group' ? html`
          <div class="ec-subsection-title">Layout</div>
          ${(() => {
            const d = MosaicCanvasEditor._OPTION_LAYOUT_DEF;
            return this._navBtn(d.key, d.label, d.hint, d.icon, countOverrides(field, d.paths));
          })()}
        ` : nothing}
      </div>
    `;
  }

  /** An option's display name: its label, else its value, else its entity, else its position. */
  private static _optionName(o: ControlOption, oi: number): string {
    return o.label || o.value || o.entity || `Option ${oi + 1}`;
  }

  /** The line beneath it — whichever identifying parts the name did not already use. */
  private static _optionSub(o: ControlOption): string {
    const parts: string[] = [];
    if (o.label && o.value) parts.push(o.value);
    if (o.entity) parts.push(o.entity);
    else if (o.value || o.label) parts.push("writes to the field's entity");
    if (o.line && o.line > 1) parts.push(`line ${o.line}`);
    if (o.tap_action || o.hold_action || o.double_tap_action) parts.push('has actions');
    return parts.join(' · ');
  }

  /**
   * One manual option's own screen.
   *
   * The list outgrew being editable inline — every option carried a value, a
   * label, an entity picker, an icon, a line and (for a selector) three
   * position selects plus three action pickers, stacked one after another for
   * every option at once. It is the same drag-list-plus-detail shape the fields,
   * series and flow points use.
   */
  private _fieldSecOptionItem(ci: number, fi: number, field: FieldConfig, oi: number, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    const opts = field.options ?? [];
    const o = opts[oi];
    if (!o) return this._navDeadEnd();
    const set = (patch: Partial<ControlOption>): void => {
      const n = [...opts];
      n[oi] = { ...o, ...patch };
      upd({ options: n });
    };
    return html`
      <div class="ec-section">
        ${this._row('Value',
          html`<input class="ec-input" type="text" placeholder="written to the entity" .value=${o.value ?? ''}
            @change=${(e: Event) => { const v = (e.target as HTMLInputElement).value; set({ value: v || undefined }); }} />`,
          'The value written to the entity when this option is picked.')}
        ${this._row('Label',
          html`<input class="ec-input" type="text" placeholder="optional" .value=${o.label ?? ''}
            @change=${(e: Event) => { const v = (e.target as HTMLInputElement).value; set({ label: v || undefined }); }} />`,
          'Text shown on the option. Unset shows the value.')}
        ${this._entitySelector({
          entity: o.entity,
          onEntity: (v) => set({ entity: v }),
          attribute: o.attribute,
          onAttribute: (v) => set({ attribute: v }),
        })}
        <p class="ec-hint">Leave <b>Entity</b> blank and this option writes its value to the field's entity. Set one and it acts on that entity instead, with its domain default action.</p>
        ${this._row('Icon', this._iconPicker(o.icon, (v) => set({ icon: v }), 'from entity state'),
          "An mdi icon on this option. An option with its own entity shows that entity's state icon unless this is set.")}
        ${this._controlNumRow('Line', o.line, '1', (v) => set({ line: v }), 1,
          'Options sharing a line number render on the same row.')}
        ${field.type === 'button_group' ? html`
          <div class="ec-subsection-title">Cell layout</div>
          <p class="ec-hint">Overrides this option's placement only. <b>Inherit</b> follows the field's Option Layout.</p>
          ${this._row('Icon position',
            this._optionIconPosSelect(o.icon_position, (v) => set({ icon_position: v }), 'Inherit'),
            'Where the icon sits relative to the label, for this option only.')}
          ${this._row('Show state',
            html`<select class="ec-select" .value=${o.show_state === undefined ? '' : o.show_state ? 'y' : 'n'}
              @change=${(e: Event) => {
                const v = (e.target as HTMLSelectElement).value;
                set({ show_state: v === '' ? undefined : v === 'y' });
              }}
            >
              <option value="" .selected=${o.show_state === undefined}>Inherit</option>
              <option value="y" .selected=${o.show_state === true}>Show</option>
              <option value="n" .selected=${o.show_state === false}>Hide</option>
            </select>`,
            "Shows this option's entity state on the option. Needs an entity of its own, set above.")}
          ${(o.show_state ?? field.option_show_state) ? this._row('State position',
            this._optionPosSelect(o.state_position, (v) => set({ state_position: v }), 'Inherit'),
            'Where the state value sits relative to the label.') : nothing}
          <div class="ec-subsection-title">Actions</div>
          <p class="ec-hint">Run instead of this option's normal write. In a Perform Action's data, type <code>{{value}}</code> into any field to send this option's own value instead of a fixed one — typing it switches that field to free text, same as a template in the automation editor.</p>
          ${this._actionRows(
            { tap_action: o.tap_action, hold_action: o.hold_action, double_tap_action: o.double_tap_action },
            (p) => set(p as Partial<ControlOption>),
          )}
        ` : nothing}
      </div>
    `;
  }

  private static readonly _POS: readonly OptionPartPosition[] = ['above', 'below', 'left', 'right'];

  /**
   * The select shared by both option-cell position rows. Generic over the choice
   * union so the icon's extra `none` stays out of the state's type rather than
   * being filtered back out at render time.
   */
  private _posSelect<T extends string>(
    choices: readonly T[],
    labels: Partial<Record<T, string>>,
    value: T | undefined,
    onChange: (v: T | undefined) => void,
    inheritLabel?: string,
  ): TemplateResult {
    const cap = (s: string): string => s[0].toUpperCase() + s.slice(1);
    return html`<select class="ec-select" .value=${value ?? ''}
      @change=${(e: Event) => {
        const v = (e.target as HTMLSelectElement).value;
        onChange(v === '' ? undefined : (v as T));
      }}
    >
      ${inheritLabel ? html`<option value="" .selected=${value === undefined}>${inheritLabel}</option>` : nothing}
      ${choices.map((p) => html`<option value=${p} .selected=${value === p}>${labels[p] ?? cap(p)}</option>`)}
    </select>`;
  }

  /** Position select for the state part of an option cell. Hiding it is `show_state`, not a position. */
  private _optionPosSelect(
    value: OptionPartPosition | undefined,
    onChange: (v: OptionPartPosition | undefined) => void,
    inheritLabel?: string,
  ): TemplateResult {
    return this._posSelect(MosaicCanvasEditor._POS, {}, value, onChange, inheritLabel);
  }

  /**
   * Position select for the icon, which also carries **No Icon**. That is the
   * only way to suppress an entity option's glyph — it derives one from the
   * entity's state, so blanking the Icon row doesn't get you an empty cell.
   */
  private _optionIconPosSelect(
    value: OptionIconPosition | undefined,
    onChange: (v: OptionIconPosition | undefined) => void,
    inheritLabel?: string,
  ): TemplateResult {
    return this._posSelect(
      [...MosaicCanvasEditor._POS, 'none'] as readonly OptionIconPosition[],
      { none: 'No Icon' },
      value, onChange, inheritLabel);
  }

  /**
   * Field-level defaults for the option cell layout. Every option inherits
   * these unless it overrides them, so a uniform row is configured once here.
   */
  private _optionLayoutEditor(field: FieldConfig, upd: (p: Partial<FieldConfig>) => void, id = 'f'): TemplateResult {
    const g = (field.type === 'button' ? this._config?.defaults?.button_option_layout : this._config?.defaults?.option_layout) ?? {};
    // The field overrides the global only when it sets something of its own —
    // either a layout key, or one of the separation keys, which live in
    // control_style but belong to this panel.
    const ownLayout = MosaicCanvasEditor._OPTION_LAYOUT_KEYS.some((k) => field[k] !== undefined);
    const ownSep = MosaicCanvasEditor.SEPARATION_KEYS.some((k) => field.control_style?.[k] !== undefined);
    const usingGlobal = !ownLayout && !ownSep && !this._optionLayoutOn.has(id);
    return html`
      <div class="ec-subsection-title">Option layout</div>
      ${this._row('Use global option layout',
        html`<input type="checkbox" .checked=${usingGlobal}
          @change=${(e: Event) => {
            if ((e.target as HTMLInputElement).checked) {
              this._optionLayoutOn.delete(id);
              // Drop this field's layout keys and its separation keys, leaving
              // any colour overrides in control_style untouched.
              const cs: ControlStyle = { ...field.control_style };
              for (const k of MosaicCanvasEditor.SEPARATION_KEYS) delete cs[k];
              upd({
                ...(Object.fromEntries(
                  MosaicCanvasEditor._OPTION_LAYOUT_KEYS.map((k) => [k, undefined]),
                ) as Partial<FieldConfig>),
                control_style: Object.keys(cs).length ? cs : undefined,
              });
            } else {
              this._optionLayoutOn.add(id);
            }
            this.requestUpdate();
          }}
        />`)}
      <p class="ec-hint">Inherits <b>Settings ▸ Global Defaults ▸ Control Default ▸ ${field.type === 'button' ? 'Button' : 'Button Group'} ▸ Field Container</b>. Untick to set this field's own layout; each option can still override it individually.</p>
      ${usingGlobal ? nothing : this._optionLayoutRows(
        {
          icon_position: field.option_icon_position,
          show_state: field.option_show_state,
          state_position: field.option_state_position,
          icon_style: field.option_icon_style,
          label_style: field.option_label_style,
          state_style: field.option_state_style,
        },
        (p) => {
          // Map the shared OptionLayout patch onto the field's flat option_* keys.
          const patch: Partial<FieldConfig> = {};
          if ('icon_position' in p) patch.option_icon_position = p.icon_position;
          if ('show_state' in p) patch.option_show_state = p.show_state;
          if ('state_position' in p) patch.option_state_position = p.state_position;
          if ('icon_style' in p) patch.option_icon_style = p.icon_style;
          if ('label_style' in p) patch.option_label_style = p.label_style;
          if ('state_style' in p) patch.option_state_style = p.state_style;
          upd(patch);
        },
        `${id}-ol`,
        g,
      )}
      ${usingGlobal ? nothing : this._optionSeparationRows(
        field.control_style ?? {},
        (p) => upd({ control_style: { ...field.control_style, ...p } }),
        field.type === 'button',
      )}
    `;
  }

  /**
   * FieldConfig keys that make up the option layout, cleared together by the
   * inherit checkbox.
   *
   * CROSS-CHECK (#64): these are the field-flat spelling of `OPTION_LAYOUT_PATHS`
   * — same six properties, prefixed `option_` because a field stores them flat
   * while an OptionLayout object nests them. They must stay one-to-one: a
   * seventh entry in either list without the other means the inherit switch and
   * the Button Layout badge disagree about what "the option layout" is. #64
   * deliberately did not merge them; `_optionLayoutOn` gives this list a second
   * job (distinguishing an empty override from "use global") that a manifest
   * has no equivalent for.
   */
  private static readonly _OPTION_LAYOUT_KEYS: (keyof FieldConfig)[] = [
    'option_icon_position', 'option_show_state', 'option_state_position',
    'option_icon_style', 'option_label_style', 'option_state_style',
  ];

  /**
   * Option Layout — a selector field's own placement/text rows plus its option
   * separation. A real `NavSectionDef` rather than the bare `_navBtn` it used to
   * be, so it gets the same badge and Clear affordance as every other screen:
   * `fsec:options` explicitly disclaims these slots, so without a manifest here
   * a per-field `button_group_option_extra_css` override would be invisible and
   * unclearable — which is precisely the #28 key #64's third checkbox names.
   *
   * Selector-only. A button renders `_optionLayoutEditor` inline on Button
   * Layout instead of pushing this crumb, and owns these slots there.
   *
   * Declared after `_OPTION_LAYOUT_KEYS` on purpose: a static initializer that
   * spread a static declared further down the class body would read undefined.
   */
  private static readonly _OPTION_LAYOUT_DEF: NavSectionDef<FieldConfig> = {
    key: 'optlayout', label: 'Option Layout',
    hint: 'Icon & state position, sizes, separation', icon: 'mdi:view-grid-outline',
    paths: [
      ...MosaicCanvasEditor._OPTION_LAYOUT_KEYS,
      ...pfx('control_style', OPTION_SEPARATION_PATHS),
    ],
  };

  /** Fields whose option-layout override is on but still empty (see _colorOverridesOn). */
  private _optionLayoutOn = new Set<string>();

  /**
   * The option layout rows themselves, shared by the global Control Default
   * section and the per-field override. `inherited` supplies the placeholder
   * values so the field panel shows what it would fall back to.
   */
  private _optionLayoutRows(
    ol: OptionLayout,
    upd: (p: Partial<OptionLayout>) => void,
    idPrefix: string,
    inherited: OptionLayout = {},
  ): TemplateResult {
    const showState = ol.show_state ?? inherited.show_state ?? false;
    return html`
      <p class="ec-hint">The label is the anchor; the icon and state value sit around it. <b>Above</b> / <b>Below</b> take their own line, <b>Left</b> / <b>Right</b> share the label's line. <b>No Icon</b> leaves the icon out — the only way to drop it on an option with its own entity, which otherwise shows that entity's state icon.</p>
      ${this._row('Icon position',
        this._optionIconPosSelect(ol.icon_position ?? inherited.icon_position ?? 'left', (v) => upd({ icon_position: v })),
        'Where the icon sits relative to the label.')}
      ${this._row('Show state value',
        html`<input type="checkbox" .checked=${showState}
          @change=${(e: Event) => upd({ show_state: (e.target as HTMLInputElement).checked || undefined })}
        />`,
        "Shows each option's entity state alongside its label.")}
      <p class="ec-hint">The state value comes from the option's own entity, so options need an entity for this to show anything.</p>
      ${showState ? this._row('State position',
        this._optionPosSelect(ol.state_position ?? inherited.state_position ?? 'below', (v) => upd({ state_position: v })),
        'Where the state value sits relative to the label.') : nothing}

      <p class="ec-hint">Weight and font for the text parts. <b>Colors and sizes</b> are set per state in <b>Active</b> / <b>Inactive State</b>.</p>
      <div class="ec-subsection-title">Icon style</div>
      ${this._textRows(`${idPrefix}-icon`, ol.icon_style ?? {}, (p) => upd({ icon_style: { ...ol.icon_style, ...p } }), false, false, false)}
      <div class="ec-subsection-title">Label style</div>
      ${this._textRows(`${idPrefix}-label`, ol.label_style ?? {}, (p) => upd({ label_style: { ...ol.label_style, ...p } }), false, false, false)}
      ${showState ? html`
        <div class="ec-subsection-title">State style</div>
        ${this._textRows(`${idPrefix}-state`, ol.state_style ?? {}, (p) => upd({ state_style: { ...ol.state_style, ...p } }), false, false, false)}
      ` : nothing}
    `;
  }

  private _fieldSecInput(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    const submit = field.submit_on ?? 'change';
    return html`
      <div class="ec-section">
        ${this._row('Submit on',
          html`<select class="ec-select" .value=${submit}
            @change=${(e: Event) => upd({ submit_on: (e.target as HTMLSelectElement).value as 'enter' | 'blur' | 'change' })}
          >
            <option value="change" .selected=${submit === 'change'}>Change (click away or Enter)</option>
            <option value="blur" .selected=${submit === 'blur'}>Click away</option>
            <option value="enter" .selected=${submit === 'enter'}>Enter only</option>
          </select>`,
          'When the typed value is sent — as you type, on Enter, or when the field loses focus.')}
        ${this._row('Placeholder',
          html`<input class="ec-input" type="text" .value=${field.placeholder ?? ''}
            @change=${(e: Event) => { const v = (e.target as HTMLInputElement).value; upd({ placeholder: v === '' ? undefined : v }); }}
          />`,
          'Grey prompt text shown while the field is empty.')}
        ${this._controlNumRow('Max length', field.input_maxlength, 'no limit', (v) => upd({ input_maxlength: v }), 1,
          'Longest value the field accepts.')}
        ${this._row('Password field',
          html`<input type="checkbox" .checked=${field.input_password ?? false}
            @change=${(e: Event) => upd({ input_password: (e.target as HTMLInputElement).checked || undefined })}
          />`,
          'Masks what is typed. The value is still sent in clear text.')}
      </div>
    `;
  }

  private _fieldSecValueSource(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    return html`
      <div class="ec-section">
          ${this._entitySelector({
            entity: field.entity,
            onEntity: (v) => upd({ entity: v }),
            attribute: field.attribute,
            onAttribute: (v) => upd({ attribute: v }),
          })}
          ${this._isTimeUntilVirtual(field)
            ? this._renderTuLayoutBuilder(ci, fi, field, isExtended)
            : nothing}
      </div>
    `;
  }

  private _fieldSecValueLabel(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    return html`
      <div class="ec-section">
          ${this._row('Value Label (Optional)',
            html`<input class="ec-input" type="text" .value=${field.label ?? ''}
              placeholder="(optional)"
              @input=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                upd({ label: v || undefined });
              }}
            />`,
            'Text shown beside the value. Leave blank for none.')}
          ${field.label ? html`
            ${this._row('Value Label position',
              html`<select class="ec-select"
                .value=${field.label_position ?? sd('label_position') ?? 'above'}
                @change=${(e: Event) => upd({
                  label_position: (e.target as HTMLSelectElement).value as 'above' | 'below' | 'left' | 'right',
                })}
              >
                <option value="above"  .selected=${(field.label_position ?? sd('label_position') ?? 'above') === 'above'}>Above value</option>
                <option value="below"  .selected=${field.label_position === 'below'}>Below value</option>
                <option value="left"   .selected=${field.label_position === 'left'}>Left of value</option>
                <option value="right"  .selected=${field.label_position === 'right'}>Right of value</option>
              </select>`,
              'Where the label sits relative to the value.')}
            ${isExtended ? this._numRow('Label column', { value: field.label_column, onChange: (v) => upd({ label_column: v }), min: 1, max: 4, placeholder: '(same cell)',
              hint: "Puts the label in its own column of the popover grid." }) : nothing}
          ` : nothing}
          ${this._row('Icon',
            html`<select class="ec-select"
              .value=${field.icon_position ?? 'none'}
              @change=${(e: Event) => {
                const v = (e.target as HTMLSelectElement).value;
                // Unset rather than storing 'none': off is the value field's
                // default, so an explicit 'none' would badge as an override.
                upd({ icon_position: v === 'none' ? undefined : (v as OptionIconPosition) });
              }}
            >
              <option value="none"  .selected=${(field.icon_position ?? 'none') === 'none'}>No icon</option>
              <option value="left"  .selected=${field.icon_position === 'left'}>Left of value</option>
              <option value="right" .selected=${field.icon_position === 'right'}>Right of value</option>
              <option value="above" .selected=${field.icon_position === 'above'}>Above value</option>
              <option value="below" .selected=${field.icon_position === 'below'}>Below value</option>
            </select>`,
            "Shows the entity's own icon beside the value.")}
          ${field.icon_position && field.icon_position !== 'none' ? this._row('Icon (override)',
            this._iconPicker(field.icon, (v) => upd({ icon: v }), '(entity icon)'),
            "A picked icon shown instead of the entity's own.") : nothing}
      </div>
    `;
  }

  private _fieldSecLabelContent(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    return html`
      <div class="ec-section">
          ${this._row('Text',
              html`<input class="ec-input" type="text" .value=${field.text ?? ''}
                @change=${(e: Event) => upd({ text: (e.target as HTMLInputElement).value })}
              />`)}
          ${this._row('Icon', this._iconPicker(field.icon, (v) => upd({ icon: v })),
            'Optional icon shown with the text.')}
          ${field.icon ? this._row('Icon position',
            html`<select class="ec-select"
              .value=${field.icon_position ?? sd('icon_position') ?? 'left'}
              @change=${(e: Event) => upd({
                icon_position: (e.target as HTMLSelectElement).value as OptionIconPosition,
              })}
            >
              <option value="left"  .selected=${(field.icon_position ?? sd('icon_position') ?? 'left') === 'left'}>Left of text</option>
              <option value="right" .selected=${field.icon_position === 'right'}>Right of text</option>
              <option value="above" .selected=${field.icon_position === 'above'}>Above text</option>
              <option value="below" .selected=${field.icon_position === 'below'}>Below text</option>
            </select>`,
            'Where the icon sits relative to the text.') : nothing}
      </div>
    `;
  }

  /**
   * Show what "Use state value" resolves to right now (#124), rendered with the
   * real glyph so a prefix pointing at a set that isn't installed reads as a
   * blank rather than as a silent no-op the user can't diagnose. Uses the same
   * `stateIcon` the card renders with, so the preview can't drift from it.
   */
  private _iconStatePreview(field: FieldConfig): TemplateResult | typeof nothing {
    if (!field.entity || field.entity.startsWith('virtual:')) return nothing;
    const so = this.hass?.states[field.entity];
    if (!so) return nothing;
    const raw = field.attribute ? so.attributes?.[field.attribute] : so.state;
    const state = raw != null ? String(raw) : undefined;
    const name = stateIcon(field, state);
    if (!name) return nothing;
    return html`<p class="ec-hint">
      State <code>${state}</code> resolves to <code>${name}</code>
      <ha-icon icon=${name} style="--mdc-icon-size:18px;vertical-align:middle;"></ha-icon>
      — a blank here means the <b>${iconPrefix(field)}</b> set has no icon by that name.
    </p>`;
  }

  private _fieldSecIcon(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    const rules = field.icon_rules ?? [];
    const setRules = (r: IconRule[]): void => upd({ icon_rules: r.length ? r : undefined });
    return html`
      <div class="ec-section">
          ${this._row('Icon', this._iconPicker(field.icon, (v) => upd({ icon: v }), field.entity ? '(entity icon)' : ''),
            field.entity
              ? "Shown when no rule below matches. Leave blank to use the entity's own icon."
              : 'An mdi icon name, e.g. mdi:lightbulb.')}

          <div class="ec-subsection-title">Icon by state</div>
          ${this._entitySelector({
            entity: field.entity,
            onEntity: (v) => upd({ entity: v }),
            includeVirtuals: false,
            attribute: field.attribute,
            onAttribute: (v) => upd({ attribute: v }),
          })}
          <p class="ec-hint">Leave <b>Entity</b> blank for a fixed icon. Set one and the field shows the icon whose rule matches that entity's state — falling back to the <b>Icon</b> above, or to the entity's own icon.</p>
          ${field.entity ? html`
            ${this._row('Use state value',
              html`<input type="checkbox"
                .checked=${field.icon_use_state ?? false}
                @change=${(e: Event) => upd({ icon_use_state: (e.target as HTMLInputElement).checked || undefined })}
              />`,
              "Ticked, the entity's own state names the icon — a weather entity reading partlycloudy shows the partlycloudy glyph. The state is lowercased and underscores become dashes. A rule below still overrides it for the states it names.")}
            ${field.icon_use_state ? html`
              ${this._row('Alt icon prefix',
                html`<input class="ec-input" type="text" placeholder="mdi"
                  .value=${field.icon_prefix ?? ''}
                  @change=${(e: Event) => {
                    const el = e.target as HTMLInputElement;
                    // The separator is added at render, so a typed ':' is
                    // stripped rather than stored — 'wi:' and 'wi' are one thing.
                    const v = el.value.replace(/:/g, '').trim();
                    el.value = v;
                    upd({ icon_prefix: v === '' ? undefined : v });
                  }}
                />`,
                'The icon set the state name is looked up in. Blank means mdi. Integrations such as Custom Icons add Iconify collections — use their prefix here, without the colon.')}
              ${this._iconStatePreview(field)}
            ` : nothing}
          ` : nothing}
          ${field.entity ? html`
            <div class="ec-subsection-title">Rules</div>
            ${rules.length === 0
              ? this._emptyAdd('No rules yet — add one', () => setRules([...rules, {}]))
              : rules.map((r, ri) => html`
                <div style="display:flex;gap:4px;align-items:center;margin-bottom:4px;">
                  <input class="ec-input" type="text" style="flex:1;min-width:0;" placeholder="state value"
                    .value=${r.value ?? ''}
                    @change=${(e: Event) => setRules(rules.map((x, i) => i === ri ? { ...x, value: (e.target as HTMLInputElement).value } : x))}
                  />
                  <div style="flex:1.4;min-width:0;">
                    ${this._iconPicker(r.icon, (v) => setRules(rules.map((x, i) => i === ri ? { ...x, icon: v } : x)))}
                  </div>
                  <button class="ec-btn-remove" title="Remove rule"
                    @click=${() => setRules(rules.filter((_, i) => i !== ri))}>✕</button>
                </div>
              `)}
            <div style="display:flex;gap:6px;margin-top:6px;">
              <button class="ec-btn-add" @click=${() => setRules([...rules, {}])}>+ Rule</button>
            </div>
            <p class="ec-hint">Each rule stands alone — one state value, one icon. A value matches the state as text, as a number (<code>21</code> matches <code>21.0</code>) or as a boolean (<code>true</code> matches <code>on</code>). A matching rule with no icon picked shows <b>no icon</b> for that state, instead of falling back.</p>
          ` : nothing}
      </div>
    `;
  }

  private _fieldSecSvgSource(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    return html`
      <div class="ec-section">

          ${!field.svg || this._isThermometerSvg(field) || this._isBatterySvg(field) || this._isInverterSvg(field) || this._isGaugeSvg(field) ? this._entitySelector({
            entity: field.entity,
            onEntity: (v) => upd({ entity: v }),
            attribute: field.attribute,
            onAttribute: (v) => upd({ attribute: v }),
          }) : nothing}
          ${this._isBatterySvg(field) ? this._entitySelector({
            label: 'Charging entity',
            entity: field.charging_entity,
            onEntity: (v) => upd({ charging_entity: v }),
            attribute: field.charging_attribute,
            onAttribute: (v) => upd({ charging_attribute: v }),
          }) : nothing}
          ${field.svg && !this._isThermometerSvg(field) && !this._isBatterySvg(field) && !this._isInverterSvg(field) && !this._isGaugeSvg(field) ? html`
            <div class="ec-subsection-title" style="margin-top:6px">Tank fill source</div>
            ${this._entitySelector({
              label: '% entity',
              entity: field.tank_pct_entity,
              onEntity: (v) => upd({ tank_pct_entity: v }),
              attribute: field.tank_pct_attribute,
              onAttribute: (v) => upd({ tank_pct_attribute: v }),
            })}
            ${this._entitySelector({
              label: 'Flow In/Out Entity',
              entity: field.tank_volume_entity,
              onEntity: (v) => upd({ tank_volume_entity: v }),
              attribute: field.tank_volume_attribute,
              onAttribute: (v) => upd({ tank_volume_attribute: v }),
            })}
            ${this._entitySelector({
              label: 'Capacity entity',
              entity: field.tank_capacity_entity,
              onEntity: (v) => upd({ tank_capacity_entity: v }),
              attribute: field.tank_capacity_attribute,
              onAttribute: (v) => upd({ tank_capacity_attribute: v }),
            })}
          ` : nothing}
      </div>
    `;
  }

  private _fieldSecSvgRange(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    return html`
      <div class="ec-section">
            ${this._numRow('Min value', { value: field.min, onChange: (v) => upd({ min: v }), placeholder: '0',
              hint: 'Entity value that draws the graphic empty.' })}
            ${this._numRow('Max value', { value: field.max, onChange: (v) => upd({ max: v }), placeholder: '100',
              hint: 'Entity value that draws the graphic full.' })}
      </div>
    `;
  }

  // DRIFT: row changes here must be mirrored in the fsec:colors def's `terms`
  // in _fieldSectionDefs (hidden search vocabulary, #61).
  private _fieldSecSvgColors(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    const px = isExtended ? `ext${ci}-f${fi}` : `c${ci}-f${fi}`;
    return html`
      <div class="ec-section">
          ${field.svg && !this._isInverterSvg(field) ? this._row('Fill direction',
            html`<select class="ec-select"
              .value=${field.fill_direction ?? sd('fill_direction') ?? 'up'}
              @change=${(e: Event) => upd({ fill_direction: (e.target as HTMLSelectElement).value as FieldConfig['fill_direction'] })}
            >
              <option value="up"    .selected=${(field.fill_direction ?? sd('fill_direction') ?? 'up') === 'up'}>Up (liquid rising)</option>
              <option value="down"  .selected=${field.fill_direction === 'down'}>Down</option>
              <option value="left"  .selected=${field.fill_direction === 'left'}>Left</option>
              <option value="right" .selected=${field.fill_direction === 'right'}>Right</option>
            </select>`,
            'Which way the graphic fills as the value rises. It also sets a gradient’s direction unless Gradient angle overrides it.') : nothing}
          ${this._isInverterSvg(field)
            ? this._row('Line color', this._colorPicker(`${px}-fc`, field.fill_color, (v) => upd({ fill_color: v })),
                "Colour of the graphic's outline.")
            : this._gradientRows({
                id: `${px}-fc`,
                label: 'Fill color',
                toLabel: 'Gradient to',
                color: field.fill_color,
                color2: field.fill_color2,
                angle: field.fill_angle,
                anglePlaceholder: 'fill direction',
                colorHint: 'The colour the graphic fills with.',
                angleHint: SVG_FILL_ANGLE_HINT,
                setColor: (v) => upd({ fill_color: v }),
                setColor2: (v) => upd({ fill_color2: v }),
                setAngle: (v) => upd({ fill_angle: v }),
                clearGradient: () => upd({ fill_color2: undefined, fill_angle: undefined }),
              })}
          ${field.svg && !this._isThermometerSvg(field) && !this._isBatterySvg(field) && !this._isInverterSvg(field) && !this._isGaugeSvg(field) ? this._row('Tank color',
            this._colorPicker(`${px}-tkc`, field.tank_color, (v) => upd({ tank_color: v }), {
              clearTitle: 'Remove (use SVG default)', onClear: () => upd({ tank_color: undefined }),
            }), 'Colour of the tank body behind the fill.') : nothing}
      </div>
    `;
  }

  private _fieldSecSvgSize(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    return html`
      <div class="ec-section">
          ${this._numRow('Height (px)', { value: field.height, onChange: (v) => upd({ height: v }), min: 20, placeholder: '120' })}
          ${this._numRow('Width (px)', { value: field.width, onChange: (v) => upd({ width: v }), min: 10, placeholder: 'auto' })}
      </div>
    `;
  }

  private _fieldSecSvgThresholds(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    const px = isExtended ? `ext${ci}-f${fi}` : `c${ci}-f${fi}`;
    return html`
      <div class="ec-section">
            <p style="font-size:12px;color:#4a8aaa;margin:0 0 6px;">
              Each threshold sets the fill color when the entity value ≥ its level.
            </p>
            ${(field.thresholds ?? []).map((t, ti) => html`
              <div class="ec-row">
                ${this._numWrap(html`<input class="ec-input ec-input-num" type="number" style="width:70px"
                  .value=${String(t.value)}
                  @change=${(e: Event) => {
                    const thresholds = [...(field.thresholds ?? [])];
                    thresholds[ti] = { ...t, value: Number((e.target as HTMLInputElement).value) };
                    upd({ thresholds });
                  }}
                />`)}
                <div style="flex:1">
                  ${this._colorPicker(`${px}-t${ti}`, t.color, (v) => {
                      const thresholds = [...(field.thresholds ?? [])];
                      thresholds[ti] = { ...t, color: v ?? t.color };
                      upd({ thresholds });
                    }, { clearable: false })}
                  <button class="ec-btn-remove"
                    @click=${() => {
                      const thresholds = (field.thresholds ?? []).filter((_, i) => i !== ti);
                      upd({ thresholds: thresholds.length ? thresholds : undefined });
                    }}
                    title="Remove">✕</button>
                </div>
              </div>
            `)}
            <button class="ec-btn-add" style="margin-top:4px;"
              @click=${() => {
                const thresholds: FillThreshold[] = [...(field.thresholds ?? []), { value: 0, color: '#f44336' }];
                upd({ thresholds });
              }}>+ Threshold</button>
      </div>
    `;
  }

  /**
   * State-to-colour map for a State timeline (#119).
   *
   * The timeline reads the raw state log rather than the statistics tables, so
   * a state here is a string — `on`, `heat_cool`, `home` — not a number. Any
   * state left unmapped still gets a palette colour in first-seen order, so
   * this screen is for pinning the ones that carry meaning (on green, off
   * grey) rather than a requirement before the chart works.
   */
  private _fieldSecGraphStates(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    const px = isExtended ? `ext${ci}-f${fi}` : `c${ci}-f${fi}`;
    const map = field.graph_state_colors ?? [];
    const write = (next: GraphStateColor[]) => upd({ graph_state_colors: next.length ? next : undefined });
    return html`
      <div class="ec-section">
            <p style="font-size:12px;color:#4a8aaa;margin:0 0 6px;">
              Pin a colour to a state by name — <code>on</code>, <code>off</code>,
              <code>heat</code>, <code>home</code>. Capitalisation does not matter. Any
              state you do not list still gets its own colour automatically.
            </p>
            ${map.map((c, ti) => html`
              <div class="ec-row">
                <input class="ec-input" type="text" style="width:100px" .value=${c.state}
                  placeholder="state"
                  @change=${(e: Event) => {
                    const next = [...map];
                    next[ti] = { ...c, state: (e.target as HTMLInputElement).value };
                    write(next);
                  }}
                />
                <div style="flex:1">
                  ${this._colorPicker(`${px}-sc${ti}`, c.color, (v) => {
                      const next = [...map];
                      next[ti] = { ...c, color: v ?? c.color };
                      write(next);
                    }, { clearable: false })}
                  <button class="ec-btn-remove"
                    @click=${() => write(map.filter((_, i) => i !== ti))}
                    title="Remove">✕</button>
                </div>
              </div>
            `)}
            <button class="ec-btn-add" style="margin-top:4px;"
              @click=${() => write([...map, { state: '', color: '#7ecb20' }])}>+ State</button>
      </div>
    `;
  }

  /**
   * Colour bands for an Arc Gauge (#119).
   *
   * The segmented gauge has always read colour bands, but only from
   * `thresholds` — the *fill* field's key, whose editor lives on the svg
   * branch and is never reachable from a graph field. So the feature existed
   * in the renderer and could only be configured by hand-editing YAML. This
   * writes `graph_thresholds`, which the renderer prefers; a field that
   * already carries `thresholds` keeps working and is shown here so it can be
   * migrated by touching it.
   */
  private _fieldSecGraphBands(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    const px = isExtended ? `ext${ci}-f${fi}` : `c${ci}-f${fi}`;
    const bands = field.graph_thresholds ?? field.thresholds ?? [];
    // Any edit here also drops the legacy `thresholds` — that is what "migrated
    // by touching it" means. Writing only `graph_thresholds` left the old key
    // in place underneath, so clearing the last band emitted `undefined` and
    // the renderer's fallback brought the legacy bands straight back: from the
    // UI they could not be deleted at all.
    const write = (next: FillThreshold[]) => upd({
      graph_thresholds: next.length ? next : undefined,
      thresholds: undefined,
    });
    return html`
      <div class="ec-section">
            <p style="font-size:12px;color:#4a8aaa;margin:0 0 6px;">
              Each band colours the arc from its level upwards, so the gauge shows how far
              into which band the current value sits. Without any, the arc is one colour.
            </p>
            ${bands.map((t, ti) => html`
              <div class="ec-row">
                ${this._numWrap(html`<input class="ec-input ec-input-num" type="number" style="width:70px"
                  .value=${String(t.value)}
                  @change=${(e: Event) => {
                    const next = [...bands];
                    next[ti] = { ...t, value: Number((e.target as HTMLInputElement).value) };
                    write(next);
                  }}
                />`)}
                <div style="flex:1">
                  ${this._colorPicker(`${px}-gb${ti}`, t.color, (v) => {
                      const next = [...bands];
                      next[ti] = { ...t, color: v ?? t.color };
                      write(next);
                    }, { clearable: false })}
                  <button class="ec-btn-remove"
                    @click=${() => write(bands.filter((_, i) => i !== ti))}
                    title="Remove">✕</button>
                </div>
              </div>
            `)}
            <button class="ec-btn-add" style="margin-top:4px;"
              @click=${() => write([...bands, { value: 0, color: '#f44336' }])}>+ Band</button>
      </div>
    `;
  }

  // DRIFT: row changes here must be mirrored in the fsec:gauge def's `terms`
  // in _fieldSectionDefs (hidden search vocabulary, #61).
  private _fieldSecSvgGauge(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    const px = isExtended ? `ext${ci}-f${fi}` : `c${ci}-f${fi}`;
    return html`
      <div class="ec-section">
            ${this._row('Min label',
              html`<input class="ec-input" type="text" .value=${field.gauge_min_label ?? ''}
                placeholder="e.g. 0 kW"
                @change=${(e: Event) => {
                  const v = (e.target as HTMLInputElement).value;
                  upd({ gauge_min_label: v || undefined });
                }}
              />`,
              'Text under the low end of the arc. Unset shows the Min value.')}
            ${this._row('Max label',
              html`<input class="ec-input" type="text" .value=${field.gauge_max_label ?? ''}
                placeholder="e.g. 5 kW"
                @change=${(e: Event) => {
                  const v = (e.target as HTMLInputElement).value;
                  upd({ gauge_max_label: v || undefined });
                }}
              />`,
              'Text under the high end of the arc. Unset shows the Max value.')}
            ${this._row('Show value',
              html`<label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
                <input type="checkbox" .checked=${field.gauge_show_value ?? false}
                  @change=${(e: Event) =>
                    upd({ gauge_show_value: (e.target as HTMLInputElement).checked || undefined })}
                />
                <span>Display current value in centre</span>
              </label>`,
              'Shows the current value in the middle of the gauge.')}
            ${this._numRow('Label size (px)', { value: field.gauge_label_size, onChange: (v) => upd({ gauge_label_size: v }), min: 6, max: 48, placeholder: '11',
              hint: 'Size of the min, max and centre text.' })}
            ${this._row('Label color',
              this._colorPicker(`${px}-glc`, field.gauge_label_color, (v) => upd({ gauge_label_color: v }), {
                clearTitle: 'Reset to default',
              }), 'Colour of the min, max and centre text.')}
      </div>
    `;
  }

  // DRIFT: row changes here must be mirrored in THERMO_TERMS (hidden search
  // vocabulary shared with the Element Library thermometer defaults, #61).
  private _fieldSecSvgThermo(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    const px = isExtended ? `ext${ci}-f${fi}` : `c${ci}-f${fi}`;
    return html`
      <div class="ec-section">
            ${this._row('Tick color',
              this._colorPicker(`${px}-ttc`, field.thermo_tick_color, (v) => upd({ thermo_tick_color: v || undefined }), {
                clearTitle: 'Reset to default',
              }), THERMO_HINTS.tick_color)}
            ${this._row('Tick position',
              html`<select class="ec-select"
                .value=${field.thermo_text_position ?? sd('thermo_text_position') ?? 'right'}
                @change=${(e: Event) => upd({ thermo_text_position: (e.target as HTMLSelectElement).value as 'left' | 'right' | 'both' })}
              >
                ${(['right','left','both'] as const).map((s) => html`<option value=${s} .selected=${(field.thermo_text_position ?? sd('thermo_text_position') ?? 'right') === s}>${this._isHorizontalThermometerSvg(field) ? ({ right: 'Bottom', left: 'Top', both: 'Both' } as Record<string,string>)[s] : s.charAt(0).toUpperCase() + s.slice(1)}</option>`)}
              </select>`, THERMO_HINTS.tick_position)}
            ${this._row('Minor tick text',
              html`<input type="checkbox" class="ec-checkbox"
                .checked=${field.thermo_show_minor_tick_text ?? sd('thermo_show_minor_tick_text') ?? false}
                @change=${(e: Event) => upd({ thermo_show_minor_tick_text: (e.target as HTMLInputElement).checked })} />`, THERMO_HINTS.minor_tick_text)}
            ${this._numRow('Tick font size', { hint: THERMO_HINTS.tick_font_size, value: field.thermo_tick_font_size, onChange: (v) => upd({ thermo_tick_font_size: v }), min: 1, max: 20, step: 0.5, placeholder: '4' })}
            ${this._numRow('Major tick length', { value: field.thermo_major_tick_length, onChange: (v) => upd({ thermo_major_tick_length: v }), min: 0.5, max: 20, step: 0.5, placeholder: 'auto (from SVG)' })}
            ${this._numRow('Major tick thickness', { value: field.thermo_major_tick_width, onChange: (v) => upd({ thermo_major_tick_width: v }), min: 0.1, max: 5, step: 0.05, placeholder: 'auto (from SVG)' })}
            ${this._numRow('Minor tick length', { value: field.thermo_minor_tick_length, onChange: (v) => upd({ thermo_minor_tick_length: v }), min: 0.5, max: 20, step: 0.5, placeholder: 'auto (from SVG)' })}
            ${this._numRow('Minor tick thickness', { value: field.thermo_minor_tick_width, onChange: (v) => upd({ thermo_minor_tick_width: v }), min: 0.1, max: 5, step: 0.05, placeholder: 'auto (from SVG)' })}
            ${this._row('Grid line color',
              this._colorPicker(`${px}-tgc`, field.thermo_grid_color, (v) => upd({ thermo_grid_color: v || undefined }), {
                clearTitle: 'Reset to default',
              }), THERMO_HINTS.grid_color)}
            ${this._numRow('Above temperature transparency', { value: field.thermo_fill_opacity_above, onChange: (v) => upd({ thermo_fill_opacity_above: v }), min: 0, max: 1, step: 0.05, placeholder: '0.5' })}
            <p class="ec-hint">How visible the tube is above the current reading — 0 hides the empty part
              entirely, 1 draws it in full.</p>
            ${this._numRow('Decimals', { hint: THERMO_HINTS.decimals, value: field.thermo_decimals, onChange: (v) => upd({ thermo_decimals: v }), min: 0, max: 4, step: 1, placeholder: '1' })}
            ${this._row('Temperature value color',
              this._colorPicker(`${px}-tvc`, field.thermo_temp_color, (v) => upd({ thermo_temp_color: v || undefined }), {
                clearTitle: 'Reset to default',
              }), THERMO_HINTS.temp_color)}
            ${this._numRow('Temperature value size', { value: field.thermo_temp_font_size, onChange: (v) => upd({ thermo_temp_font_size: v }), min: 4, max: 30, step: 0.5, placeholder: '10' })}
      </div>
    `;
  }

  // DRIFT: row changes here must be mirrored in the fsec:graph def's `terms`
  // in _fieldSectionDefs (hidden search vocabulary, #61).
  private _fieldSecGraphSettings(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    const gt = field.graph_type ?? sd('graph_type') ?? 'bar';
    const caps = graphCaps(gt);
    const { stroke: hasStroke, range: hasRange, yTitle: hasYTitle,
            bars: hasBars, legend: hasLegend, gauge: isGauge, timeline: isTimeline } = caps;
    return html`
      <div class="ec-section">

          ${this._row('Type',
            html`<select class="ec-select"
              .value=${field.graph_type ?? sd('graph_type') ?? 'bar'}
              @change=${(e: Event) => upd({ graph_type: (e.target as HTMLSelectElement).value as GraphType })}
            >
              ${GRAPH_TYPES.map((t) => html`<option value=${t.value} .selected=${(field.graph_type ?? sd('graph_type') ?? 'bar') === t.value}>${t.label}</option>`)}
            </select>`,
            'Which chart this field draws. Line and area charts read history; bar and gauge read statistics.')}
          ${this._row('Show axes',
            html`<input type="checkbox" .checked=${field.graph_show_axes ?? sd('graph_show_axes') ?? true}
              @change=${(e: Event) => upd({ graph_show_axes: (e.target as HTMLInputElement).checked || undefined })}
            />`,
            'Draws the axis lines and their labels.')}
          ${hasLegend ? this._row('Show legend',
            html`<input type="checkbox" .checked=${field.graph_show_legend ?? sd('graph_show_legend') ?? false}
              @change=${(e: Event) => upd({ graph_show_legend: (e.target as HTMLInputElement).checked || undefined })}
            />`,
            'Names each series beside the chart.') : nothing}
          ${hasLegend && (field.graph_show_legend ?? sd('graph_show_legend') ?? false) ? this._row('Legend position',
            html`<select class="ec-select"
              .value=${field.graph_legend_position ?? sd('graph_legend_position') ?? 'bottom'}
              @change=${(e: Event) => upd({ graph_legend_position: (e.target as HTMLSelectElement).value as GraphLegendPos })}
            >
              ${GRAPH_LEGEND_POSITIONS.map((o) => html`<option value=${o.value} .selected=${(field.graph_legend_position ?? sd('graph_legend_position') ?? 'bottom') === o.value}>${o.label}</option>`)}
            </select>`,
            'Left and right stack the names in a column and take their width from the chart.') : nothing}
          ${hasBars ? this._row('Bar value labels',
            html`<input type="checkbox" .checked=${field.graph_bar_labels ?? sd('graph_bar_labels') ?? false}
              @change=${(e: Event) => upd({ graph_bar_labels: (e.target as HTMLInputElement).checked || undefined })}
            />`,
            'Prints each bar’s value at its end.') : nothing}
          ${hasRange ? this._numRow('Min value', { value: field.graph_min, onChange: (v) => upd({ graph_min: v }), placeholder: 'auto',
            hint: 'Unset scales the axis to the data, rounded to a whole gridline.' }) : nothing}
          ${hasRange ? this._numRow('Max value', { value: field.graph_max, onChange: (v) => upd({ graph_max: v }), placeholder: 'auto',
            hint: 'Unset scales the axis to the data, rounded to a whole gridline.' }) : nothing}
          ${hasStroke ? this._row('Start axis at zero',
            html`<input type="checkbox" .checked=${field.graph_include_zero ?? sd('graph_include_zero') ?? false}
              @change=${(e: Event) => upd({ graph_include_zero: (e.target as HTMLInputElement).checked || undefined })}
            />`,
            'Off, the chart scales to its data — a sensor that only moves between 18 and 24 fills the chart instead of hugging the top of a 0–24 axis. Bars always start at zero.') : nothing}
          ${hasRange ? this._numRow('Gridlines', { value: field.graph_tick_count, onChange: (v) => upd({ graph_tick_count: v }), min: 2, max: 12, placeholder: 'auto',
            hint: 'Unset picks a count that suits the chart\u2019s height and label size.' }) : nothing}
          ${this._numRow('Decimals', { value: field.graph_precision, onChange: (v) => upd({ graph_precision: v }), min: 0, max: 6, placeholder: 'from entity',
            hint: 'Applies to axis labels, bar labels, gauge readouts and tooltips. Unset follows the entity\u2019s own display precision.' })}
          ${this._row('Unit',
            html`<input class="ec-input" type="text" .value=${field.graph_unit ?? ''}
              placeholder="(from entity)"
              @change=${(e: Event) => upd({ graph_unit: (e.target as HTMLInputElement).value || undefined })}
            />`,
            'Shown against the axis. Unset takes the entity\u2019s own unit.')}
          ${hasYTitle ? this._row('Y-axis title',
            html`<input class="ec-input" type="text" .value=${field.graph_y_title ?? ''}
              placeholder=${field.graph_unit ?? '(the unit)'}
              @change=${(e: Event) => upd({ graph_y_title: (e.target as HTMLInputElement).value || undefined })}
            />`,
            'Rotated label down the left of the plot. Unset, the axis is labelled with the unit — which is where a unit belongs, rather than floating above the topmost gridline. Set a title and the unit goes back to its own strip above the plot, since the two are then saying different things.') : nothing}
          ${this._row('X-axis label',
            html`<input class="ec-input" type="text"
              .value=${field.graph_x_title ?? ''}
              placeholder=${describeWindow(field) || '(none)'}
              @change=${(e: Event) => upd({ graph_x_title: (e.target as HTMLInputElement).value || undefined })}
            />`,
            'Centred under the x-axis values. Unset it names the window from Graph Data — a single space hides it and gives the height back to the plot.')}
          ${this._numRow('Width (px)', { value: field.width, onChange: (v) => upd({ width: v }), min: 60, placeholder: 'auto' })}
          ${this._numRow('Height (px)', { value: field.height, onChange: (v) => upd({ height: v }), min: 40, placeholder: 'auto' })}
          ${hasStroke ? this._numRow('Stroke width', { value: field.graph_stroke_width, onChange: (v) => upd({ graph_stroke_width: v }), min: 0.5, max: 10, step: 0.5, placeholder: '1.5' }) : nothing}
          ${hasStroke ? this._row('Line shape',
            html`<select class="ec-select"
              .value=${field.graph_curve ?? sd('graph_curve') ?? 'linear'}
              @change=${(e: Event) => upd({ graph_curve: (e.target as HTMLSelectElement).value as GraphCurve })}
            >
              ${GRAPH_CURVES.map((c) => html`<option value=${c.value} .selected=${(field.graph_curve ?? sd('graph_curve') ?? 'linear') === c.value}>${c.label}</option>`)}
            </select>`,
            'Straight joins the readings as they came. Smoothed rounds the corners without inventing peaks between them. Stepped holds each value until the next reading, which is what a meter or a setpoint actually does.') : nothing}
          ${hasStroke ? this._row('Point markers',
            html`<input type="checkbox" .checked=${field.graph_points ?? sd('graph_points') ?? false}
              @change=${(e: Event) => upd({ graph_points: (e.target as HTMLInputElement).checked || undefined })}
            />`,
            'A dot at every reading. Dropped automatically when the readings are too close together to tell apart.') : nothing}
          ${hasStroke ? this._row('Label latest value',
            html`<input type="checkbox" .checked=${field.graph_last_point ?? sd('graph_last_point') ?? false}
              @change=${(e: Event) => upd({ graph_last_point: (e.target as HTMLInputElement).checked || undefined })}
            />`,
            'Marks the most recent reading of each series and prints its value beside it.') : nothing}
          ${this._numRow('Refresh (min)', { value: field.graph_refresh_minutes, onChange: (v) => upd({ graph_refresh_minutes: v }), min: 1, max: 1440, placeholder: 'from dashboard',
            hint: 'How often this graph re-queries Home Assistant. Unset follows the dashboard’s Graph refresh. A week-long chart has no reason to poll as often as a live gauge.' })}
          ${isTimeline ? this._row('Entity name',
            html`<select class="ec-select"
              .value=${field.graph_timeline_label ?? sd('graph_timeline_label') ?? 'above'}
              @change=${(e: Event) => upd({ graph_timeline_label: (e.target as HTMLSelectElement).value as GraphTimelineLabel })}
            >
              ${GRAPH_TIMELINE_LABELS.map((o) => html`<option value=${o.value} .selected=${(field.graph_timeline_label ?? sd('graph_timeline_label') ?? 'above') === o.value}>${o.label}</option>`)}
            </select>`,
            'Where the plotted entity is named, above the state legend. The legend lists the states present, so without this nothing on the chart says which entity it is. Left of the bar only has the width the bar gives up, so it suits short names.') : nothing}
          ${isTimeline ? this._row('Show state names',
            html`<input type="checkbox" .checked=${field.graph_show_state_names ?? sd('graph_show_state_names') ?? false}
              @change=${(e: Event) => upd({ graph_show_state_names: (e.target as HTMLInputElement).checked || undefined })}
            />`,
            'Prints the state inside each block wide enough to hold it.') : nothing}
          ${isTimeline ? this._row('Unavailable colour',
            this._colorPicker(`${isExtended ? `ext${ci}-f${fi}` : `c${ci}-f${fi}`}-unav`, field.graph_unavailable_color, (v) => upd({ graph_unavailable_color: v }), {
              clearTitle: 'Reset to default',
            }),
            'Used for unavailable and unknown, so a gap in the record does not read as a real state.') : nothing}
          ${isGauge ? this._row('Tick marks',
            html`<input type="checkbox" .checked=${field.graph_gauge_ticks ?? sd('graph_gauge_ticks') ?? false}
              @change=${(e: Event) => upd({ graph_gauge_ticks: (e.target as HTMLInputElement).checked || undefined })}
            />`,
            'Marks around the arc at the same values a chart axis would label.') : nothing}
          ${isGauge ? this._numRow('Sweep (degrees)', { value: field.graph_gauge_sweep, onChange: (v) => upd({ graph_gauge_sweep: v }), min: 30, max: 350, step: 5, placeholder: '270',
            hint: 'How far the arc travels, centred on twelve o’clock. 180 gives a half circle.' }) : nothing}
          ${isGauge ? this._row('Caption',
            html`<input class="ec-input" type="text" .value=${field.graph_gauge_label ?? ''}
              placeholder="(none)"
              @change=${(e: Event) => upd({ graph_gauge_label: (e.target as HTMLInputElement).value || undefined })}
            />`,
            'Printed under the gauge’s value.') : nothing}
          ${gt === 'area' || gt === 'stat-area' ? this._numRow('Fill opacity', { value: field.graph_fill_opacity, onChange: (v) => upd({ graph_fill_opacity: v }), min: 0, max: 1, step: 0.05, placeholder: '0.2',
            hint: 'How solid the area under a line is. 0 leaves the line alone.' }) : nothing}
      </div>
    `;
  }

  /**
   * Graph chrome — the axis/grid/label furniture (#74 Phase 6).
   *
   * Every row here was a hardcoded literal before, so an empty control means
   * "use the shipped seed value", not "no colour". These stay fixed rather
   * than theme-inherited on purpose: they are translucent white over an
   * arbitrary photo, where the alpha is the contrast guarantee (STYLING.md §8).
   */
  private _fieldSecGraphChrome(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    const px = isExtended ? `ext${ci}-f${fi}` : `c${ci}-f${fi}`;
    const col = (
      label: string,
      id: string,
      value: string | undefined,
      set: (v: string | undefined) => Partial<FieldConfig>,
      hint?: string,
    ): TemplateResult =>
      this._row(label, this._colorPicker(`${px}-${id}`, value, (v) => upd(set(v || undefined)), {
        clearTitle: 'Reset to default',
      }), hint);
    return html`
      <div class="ec-section">
        <p class="ec-hint">Empty means the shipped default. These stay fixed rather than following the
          theme — they sit over the card's background image, where the transparency is what keeps them legible.</p>
        ${col('Axis line', 'gac', field.graph_axis_color, (v) => ({ graph_axis_color: v }),
          'Colour of both axis lines — the one up the left of the plot and the one along the bottom.')}
        ${col('Grid lines', 'ggc', field.graph_grid_color, (v) => ({ graph_grid_color: v }),
          'Colour of the lines across the plot area.')}
        ${col('Zero line', 'gzc', field.graph_zero_line_color, (v) => ({ graph_zero_line_color: v }),
          'Colour of the line at zero, where the data crosses it.')}
        ${col('Empty-bar stub', 'gbc', field.graph_baseline_color, (v) => ({ graph_baseline_color: v }),
          "Colour of the small marker drawn where a bar's value is zero.")}
        ${col('Axis labels', 'glc', field.graph_label_color, (v) => ({ graph_label_color: v }),
          'Colour of the X and Y axis labels — the window caption under the chart and the rotated label down its left.')}
        ${col('Axis ticks', 'gtc', field.graph_tick_color, (v) => ({ graph_tick_color: v }),
          'Colour of the values along the axes: the numbers, the dates, the category names under each bar. Unset it follows Axis labels.')}
        ${this._numRow('Label size (px)', {
          value: field.graph_label_size,
          onChange: (v) => upd({ graph_label_size: v }),
          min: 5, max: 24,
          placeholder: 'auto (per chart)',
          hint: 'Unset lets each chart keep its own natural label size.',
        })}
        ${col('Unit label', 'guc', field.graph_unit_label_color, (v) => ({ graph_unit_label_color: v }),
          'Colour of the unit shown beside the axis.')}
        ${col('Legend label', 'gllc', field.graph_legend_label_color, (v) => ({ graph_legend_label_color: v }),
          'Colour of the series names under the chart.')}
        ${col('In-bar label', 'gblc', field.graph_bar_label_color, (v) => ({ graph_bar_label_color: v }),
          'Colour of the value printed inside a bar.')}
        ${col('Gauge track', 'ggtc', field.graph_gauge_track_color, (v) => ({ graph_gauge_track_color: v }),
          "Colour of the unfilled part of a gauge's arc.")}
        ${col('Gauge value text', 'ggvc', field.graph_gauge_value_color, (v) => ({ graph_gauge_value_color: v }),
          'Colour of the number in the middle of a gauge.')}
        <div class="ec-subsection-title">Series palette</div>
        <p class="ec-hint">Colour cycle for series without a colour of their own. Series order picks
          from this list; a series with its own colour always wins.</p>
        ${(field.graph_palette ?? sd('graph_palette') ?? []).map((c, i) => html`
          <div class="ec-list-row" style="align-items:center;gap:6px;">
            <span style="font-size:11px;opacity:0.6;white-space:nowrap;width:18px;">${i + 1}</span>
            <div style="flex:1;min-width:0;">
              ${this._colorPicker(`${px}-gp${i}`, c, (v) => {
                const base = [...(field.graph_palette ?? sd('graph_palette') ?? [])];
                base[i] = v ?? '';
                upd({ graph_palette: base });
              }, { clearable: false })}
            </div>
            <button class="ec-btn-remove" title="Remove" @click=${() => {
              const base = [...(field.graph_palette ?? sd('graph_palette') ?? [])];
              base.splice(i, 1);
              upd({ graph_palette: base.length ? base : undefined });
            }}>✕</button>
          </div>`)}
        <button class="ec-btn-add" @click=${() => {
          const base = [...(field.graph_palette ?? sd('graph_palette') ?? [])];
          upd({ graph_palette: [...base, '#00d4ff'] });
        }}>+ Colour</button>
      </div>
    `;
  }

  /**
   * Graph Data (#123) — the window, the resolution inside it and the
   * calculation, at the level Home Assistant's own statistics-graph card puts
   * them: once per chart, shared by every series.
   *
   * A series may still override the calculation (mean on one entity, max on
   * another, which HA cannot express); the window and the resolution it cannot,
   * because they decide the single recorder query the whole chart shares.
   */
  /**
   * The Calendar / Rolling window optgroups, for every select that picks a
   * statistics window — a graph field's Graph Data, a value field's HA
   * Statistics, a statistic virtual's (#123).
   *
   * They were three hand-written copies of the same fifteen options, which is
   * how "Last day" reached graphs and neither of the others. Labels come from
   * `STAT_PERIOD_LABELS`, so a rename lands everywhere at once. Only the
   * placeholder option and the Custom range group differ per caller: a chart
   * cannot use a fixed start and end, because it would stop updating.
   */
  private _statPeriodGroups(current: StatPeriod | undefined, withCustom = false): TemplateResult {
    return html`
      ${(['Calendar', 'Rolling window'] as const).map((group) => html`
        <optgroup label=${group}>
          ${GRAPH_STAT_PERIODS.filter((o) => o.group === group).map((o) => html`
            <option value=${o.value} .selected=${current === o.value}>${STAT_PERIOD_LABELS[o.value]}</option>`)}
        </optgroup>`)}
      ${withCustom ? html`
        <optgroup label="Custom range">
          <option value="custom" .selected=${current === 'custom'}>${STAT_PERIOD_LABELS.custom} (fixed start and end)</option>
        </optgroup>` : nothing}
    `;
  }

  private _fieldSecGraphData(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    const gt = field.graph_type ?? sd('graph_type') ?? 'bar';
    const caps = graphCaps(gt);
    const gs = resolveGraphStat(field);
    const period = field.graph_stat_period;
    const nLabel = period ? STAT_PERIOD_N_LABELS[period] : undefined;
    // Only a chart drawn from statistics buckets has a resolution to choose. An
    // aggregate chart (bar, gauge) collapses its window to one number per
    // series, so the bucket size inside it is invisible, and a state timeline
    // reads the raw state log, which has no buckets at all.
    const showSample = caps.history && !caps.timeline && gs.period != null;
    const allowed = gs.period ? sampleOptionsFor(gs.period, gs.periodN) : [];
    const seedPeriod = sd('graph_stat_period') ?? 'last_day';
    const seedSample = sd('graph_sample_period') ?? '5minute';
    return html`
      <div class="ec-section">
        <div class="ec-subsection-title">Window</div>
        ${this._row('Stat period',
          html`<select class="ec-select"
            .value=${period ?? ''}
            @change=${(e: Event) => {
              const v = (e.target as HTMLSelectElement).value as StatPeriod | '';
              upd({ graph_stat_period: v || undefined, ...(v ? {} : { graph_stat_period_n: undefined }) });
            }}
          >
            <option value="" .selected=${!period}>${caps.history
              ? `Default — ${STAT_PERIOD_LABELS[seedPeriod] ?? seedPeriod}`
              : 'Live state (no window)'}</option>
            ${this._statPeriodGroups(period)}
          </select>`,
          caps.history
            ? 'How far back the chart reaches. Every series on it shares this window.'
            : 'The window each series is collapsed to a single value over. Live state plots the entity’s current value instead.')}
        ${nLabel ? this._row(nLabel,
          this._numWrap(html`<input type="number" class="ec-input ec-input-num" min="1" step="1"
            .value=${String(field.graph_stat_period_n ?? '')}
            placeholder="e.g. 3"
            @change=${(e: Event) => {
              const v = parseInt((e.target as HTMLInputElement).value, 10);
              upd({ graph_stat_period_n: isNaN(v) || v < 1 ? undefined : v });
            }}
          />`)) : nothing}
        ${showSample ? html`
          <div class="ec-subsection-title">Resolution</div>
          ${this._row('Sample period',
            html`<select class="ec-select"
              .value=${field.graph_sample_period ?? ''}
              @change=${(e: Event) => {
                const v = (e.target as HTMLSelectElement).value as StatSamplePeriod | '';
                upd({ graph_sample_period: v || undefined });
              }}
            >
              <option value="" .selected=${field.graph_sample_period == null}>Default — ${SAMPLE_PERIOD_LABELS[seedSample]}</option>
              <option value="auto" .selected=${field.graph_sample_period === 'auto'}>${SAMPLE_PERIOD_LABELS.auto}</option>
              ${allowed.map((o) => html`
                <option value=${o} .selected=${field.graph_sample_period === o}>${SAMPLE_PERIOD_LABELS[o]}</option>`)}
            </select>`,
            'How often a data point is calculated inside the window — one point per sample, using the calculation below.')}
          <p class="ec-hint">Only the resolutions this window can actually be drawn at are listed: a bucket bigger than
            the window is a single point, more than 4,000 of them is more than a chart can show, and Home Assistant keeps
            5-minute statistics for about 10 days only. Widen or narrow the window and the list changes with it.
            ${field.graph_sample_period && field.graph_sample_period !== gs.sample
              ? html`<b>This window cannot serve the chosen resolution, so the chart is drawn at
                  ${SAMPLE_PERIOD_LABELS[gs.sample]}.</b>` : nothing}</p>
        ` : nothing}
        ${caps.statType ? html`
          <div class="ec-subsection-title">Calculation</div>
          ${(() => {
            const isHistory = caps.history;
            const eff = gs.statType;
            // fetchHistory has no 'difference' branch, so the option is hidden
            // for a bucketed chart unless a config already carries it — a
            // select with no matching option renders blank.
            const showDifference = !isHistory || eff === 'difference';
            return html`
              ${this._row('Stat type',
                html`<select class="ec-select"
                  .value=${field.graph_stat_type ?? ''}
                  @change=${(e: Event) => {
                    const v = (e.target as HTMLSelectElement).value as StatType | '';
                    upd({ graph_stat_type: v || undefined });
                  }}
                >
                  <option value="" .selected=${field.graph_stat_type == null}>Default — ${eff}</option>
                  ${isHistory ? html`<option value="state" .selected=${field.graph_stat_type === 'state'}>Raw value (no aggregation)</option>` : nothing}
                  ${isHistory ? html`<option value="change" .selected=${field.graph_stat_type === 'change'}>Change (per sample)</option>` : nothing}
                  <option value="sum"  .selected=${field.graph_stat_type === 'sum'}>Sum (total)</option>
                  ${showDifference ? html`<option value="difference" .selected=${field.graph_stat_type === 'difference'}>
                    Difference (end − start)${isHistory ? ' — not supported here' : ''}
                  </option>` : nothing}
                  <option value="mean" .selected=${field.graph_stat_type === 'mean'}>Mean (average)</option>
                  <option value="max"  .selected=${field.graph_stat_type === 'max'}>Maximum</option>
                  <option value="min"  .selected=${field.graph_stat_type === 'min'}>Minimum</option>
                </select>`,
                'Applied to every sample of every series, unless a series overrides it on its own screen.')}
              ${isHistory && eff === 'state' ? html`<p class="ec-hint">Raw value is recorded at 5-minute resolution only,
                so it ignores the sample period above, reaches back about 10 days, and exists only for a cumulative meter
                entity (state class total or total increasing). An ordinary measurement sensor — instantaneous power, for
                one — has no raw statistic at all and will draw nothing; use Mean, Maximum or Minimum for those.</p>` : nothing}
            `;
          })()}` : nothing}
      </div>
    `;
  }

  private _fieldSecGraphSeries(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    const gsk = isExtended ? 'egs' : 'gs';
    return html`
      <div class="ec-section">
          <div class="ec-subsection-title">Series — drag to reorder</div>
          ${(field.graph_series ?? []).length === 0
            ? this._emptyAdd('No series yet — add one', () => upd({ graph_series: [...(field.graph_series ?? []), {} as GraphSeries] }))
            : (field.graph_series ?? []).map((s: GraphSeries, si: number) => this._itemCard({
                dragKey: `${gsk}:${ci}:${fi}:${si}`,
                icon: 'mdi:chart-line',
                label: s.label || s.entity || `Series ${si + 1}`,
                sub: s.label && s.entity ? s.entity : s.entity ? `Series ${si + 1}` : 'No entity selected',
                selected: si === (isExtended ? this._selExtSeries : this._selSeries),
                onClick: () => {
                  if (isExtended) this._selExtSeries = si; else this._selSeries = si;
                  this._navPush(`${gsk}:${si}`, s.label || s.entity || `Series ${si + 1}`);
                },
                actions: html`
                  <button class="ec-btn-dup" title="Duplicate series"
                    @click=${(e: Event) => { e.stopPropagation(); this._duplicateGraphSeries(ci, fi, si, isExtended); }}>⧉</button>
                  <button class="ec-btn-remove" title="Remove series"
                    @click=${(e: Event) => {
                      e.stopPropagation();
                      const series = (field.graph_series ?? []).filter((_, idx) => idx !== si);
                      upd({ graph_series: series.length ? series : undefined });
                    }}>✕</button>
                `,
              }))}
          <button class="ec-btn-add" style="margin-top:6px;width:100%"
            @click=${() => {
              const series = [...(field.graph_series ?? []), {} as GraphSeries];
              upd({ graph_series: series });
            }}>+ Series</button>
      </div>
    `;
  }

  private _fieldSecGraphSeriesItem(ci: number, fi: number, field: FieldConfig, si: number, isExtended = false): TemplateResult {
    const px = isExtended ? `ext${ci}-f${fi}` : `c${ci}-f${fi}`;
    const s = (field.graph_series ?? [])[si];
    if (!s) return this._navDeadEnd();
    const set = (patch: Partial<GraphSeries>) => this._updSeries(ci, fi, si, field, patch, isExtended);
    return html`
      <div class="ec-section">
              <div class="ec-subsection-title">Entity</div>
              ${this._entitySelector({
                entity: s.entity,
                onEntity: (v) => {
                  // #68: preselect a sensible stat_type from the newly-picked
                  // entity's own state_class/device_class — but only when the
                  // user hasn't set one already, and only when the entity
                  // actually gives a signal (see _defaultStatType).
                  const preselect = s.stat_type ? undefined : this._defaultStatType(v);
                  set({ entity: v, ...(preselect ? { stat_type: preselect } : {}) });
                },
                attribute: s.attribute,
                onAttribute: (v) => set({ attribute: v }),
              })}
              <div class="ec-subsection-title">Appearance</div>
              ${this._row('Value Label (Optional)',
                html`<input class="ec-input" type="text" .value=${s.label ?? ''}
                  placeholder="(from entity)"
                  @change=${(e: Event) => set({ label: (e.target as HTMLInputElement).value || undefined })}
                />`,
                "Name for this series in the legend. Unset uses the entity's name.")}
              ${this._row('Color',
                this._colorPicker(`${px}-s${si}-col`, s.color, (v) => set({ color: v }),
                  { clearTitle: 'Reset to palette color' }),
                'Unset takes the next colour from the palette in Graph Style.')}
              <div class="ec-subsection-title">Data override</div>
              ${(() => {
                // The window and the resolution are the field's (#123) — they
                // decide one recorder query the whole chart shares. The
                // calculation is the one part a series can still differ on, so
                // this row is an override of Graph Data's Stat type rather than
                // the only place it can be set.
                const gtNow = field.graph_type ?? sd('graph_type') ?? 'bar';
                const sCaps = graphCaps(gtNow);
                if (!sCaps.statType) return nothing;
                const isHistory = sCaps.history;
                const fieldEff = resolveGraphStat(field).statType;
                const eff = s.stat_type ?? fieldEff;
                // fetchHistory has no 'difference' branch — it would silently
                // fall through to the bucket state — so the option is hidden
                // for history series. An existing config that already carries
                // it still needs a matching <option>, or the select renders
                // blank on selectedIndex -1.
                const showDifference = !isHistory || eff === 'difference';
                return html`
                  ${this._row('Stat type (override)',
                    html`<select class="ec-select"
                      .value=${s.stat_type ?? ''}
                      @change=${(e: Event) => {
                        const v = (e.target as HTMLSelectElement).value as StatType | '';
                        set({ stat_type: v || undefined });
                      }}
                    >
                      <option value="" .selected=${s.stat_type == null}>From Graph Data — ${fieldEff}</option>
                      ${isHistory ? html`<option value="state" .selected=${s.stat_type === 'state'}>Raw value (no aggregation)</option>` : nothing}
                      ${isHistory ? html`<option value="change" .selected=${s.stat_type === 'change'}>Change (per sample)</option>` : nothing}
                      <option value="sum"  .selected=${s.stat_type === 'sum'}>Sum (total)</option>
                      ${showDifference ? html`<option value="difference" .selected=${s.stat_type === 'difference'}>
                        Difference (end − start)${isHistory ? ' — not supported here' : ''}
                      </option>` : nothing}
                      <option value="mean" .selected=${s.stat_type === 'mean'}>Mean (average)</option>
                      <option value="max"  .selected=${s.stat_type === 'max'}>Maximum</option>
                      <option value="min"  .selected=${s.stat_type === 'min'}>Minimum</option>
                    </select>`,
                    'An override of the Stat type set in Graph Data, for this series alone — leave it on “From Graph Data” and the series follows the chart. The window and the sample period are the chart’s and cannot be overridden here.')}
                  ${isHistory ? html`<p class="ec-hint">Applied per sample.${eff === 'difference'
                    ? ' "Difference" has no meaning for history buckets — pick another type.'
                    : eff === 'state' ? ' Shows the last reading every 5 minutes, unaveraged — only available for roughly the last 10 days (Home Assistant’s short-term statistics retention), and only for a cumulative meter entity (state_class total/total_increasing); an ordinary measurement sensor (e.g. instantaneous power) never has this and will show no data — use Mean/Max/Min for those.'
                    : eff === 'change' ? ' Shows how much the entity advanced during each bucket — also only recorded for a cumulative meter entity (state_class total/total_increasing); an ordinary measurement sensor never has this either.'
                    : ''}</p>` : nothing}
                `;
              })()}
      </div>
    `;
  }

  private _fieldSecStats(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    return html`
      <div class="ec-section">
          <div class="ec-subsection-title">HA Statistics integration</div>
          <p class="ec-hint">For advanced statistics (median, std dev, percentile, etc.) configure a Statistics integration sensor in HA and point the Entity field at it.</p>
          ${this._row('Period',
            html`<select class="ec-select"
              .value=${field.stat_period ?? ''}
              @change=${(e: Event) => {
                const v = (e.target as HTMLSelectElement).value as StatPeriod | '';
                const isN = ['last_n_minutes','last_n_hours','last_n_days','last_n_months'].includes(v);
                upd({
                  stat_period: v || undefined,
                  stat_period_n: isN ? (field.stat_period_n ?? undefined) : undefined,
                  stat_period_start: v === 'custom' ? (field.stat_period_start ?? undefined) : undefined,
                  stat_period_end:   v === 'custom' ? (field.stat_period_end   ?? undefined) : undefined,
                });
              }}
            >
              <option value="">Live state (no stats)</option>
              ${this._statPeriodGroups(field.stat_period, true)}
            </select>`)}
          ${(['last_n_minutes','last_n_hours','last_n_days','last_n_months'] as const).includes(field.stat_period as 'last_n_minutes') ? this._row(
            field.stat_period === 'last_n_minutes' ? 'Number of minutes'
            : field.stat_period === 'last_n_hours'  ? 'Number of hours'
            : field.stat_period === 'last_n_days'   ? 'Number of days'
            : 'Number of months',
            this._numWrap(html`<input type="number" class="ec-input ec-input-num" min="1" step="1"
              .value=${String(field.stat_period_n ?? '')}
              placeholder="e.g. 3"
              @change=${(e: Event) => {
                const v = parseInt((e.target as HTMLInputElement).value, 10);
                upd({ stat_period_n: isNaN(v) || v < 1 ? undefined : v });
              }}
            />`)) : nothing}
          ${field.stat_period === 'custom' ? html`
            ${this._row('Start', html`<input type="datetime-local" class="ec-input"
              .value=${field.stat_period_start ?? ''}
              @change=${(e: Event) => upd({ stat_period_start: (e.target as HTMLInputElement).value || undefined })}
            />`)}
            ${this._row('End', html`<input type="datetime-local" class="ec-input"
              .value=${field.stat_period_end ?? ''}
              @change=${(e: Event) => upd({ stat_period_end: (e.target as HTMLInputElement).value || undefined })}
            />`)}
          ` : nothing}
          ${field.stat_period ? this._row('Stat type',
            html`<select class="ec-select"
              .value=${field.stat_type ?? sd('stat_type') ?? 'sum'}
              @change=${(e: Event) => upd({ stat_type: (e.target as HTMLSelectElement).value as StatType })}
            >
              <option value="sum"        .selected=${(field.stat_type ?? sd('stat_type') ?? 'sum') === 'sum'}>Sum (total)</option>
              <option value="difference" .selected=${field.stat_type === 'difference'}>Difference (end − start)</option>
              <option value="mean"       .selected=${field.stat_type === 'mean'}>Mean (average)</option>
              <option value="max"        .selected=${field.stat_type === 'max'}>Maximum</option>
              <option value="min"        .selected=${field.stat_type === 'min'}>Minimum</option>
              <option value="count"      .selected=${field.stat_type === 'count'}>Count (recorder records)</option>
              <option value="range"      .selected=${field.stat_type === 'range'}>Range (max − min)</option>
            </select>`) : nothing}
          ${field.stat_type === 'count' ? html`<p class="ec-hint">Counts the statistics records Home Assistant
            holds for the window, and the recorder's resolution changes with the window's length — the same
            sensor gives 12 records for the last hour (five-minute records) and 1 for today (a daily one).
            It answers "how much statistics data is there", not "how many times did this happen".</p>` : nothing}

          ${this._row('Adv statistics mode (opt)',
            html`<select class="ec-select"
              .value=${field.stat_characteristic ?? ''}
              @change=${(e: Event) => {
                const v = (e.target as HTMLSelectElement).value;
                upd({ stat_characteristic: (v as StatCharacteristic) || undefined });
              }}
            >
              <option value="">— none —</option>
              ${['Averages','Extremes','Spread','Change','Sums','Counts','Timestamps'].map(grp => html`
                <optgroup label="${grp}">
                  ${STAT_CHARACTERISTICS.filter(c => c.group === grp).map(c => html`
                    <option value=${c.value} .selected=${field.stat_characteristic === c.value}>
                      ${c.label}${c.binary ? ' ✦' : ''}
                    </option>`)}
                </optgroup>`)}
            </select>`)}
          <p class="ec-hint" style="margin-top:2px">✦ also valid for binary sensors</p>
          ${field.stat_characteristic === 'percentile' ? this._numRow('Percentile (1–99)', { value: field.stat_percentile, onChange: (v) => upd({ stat_percentile: v }), min: 1, max: 99, placeholder: '50' }) : nothing}
          ${this._numRow('Max age (hours)', { value: field.stat_max_age_hours, onChange: (v) => upd({ stat_max_age_hours: v }), min: 1, placeholder: '(none)' })}
          ${this._numRow('Sampling size', { value: field.stat_sampling_size, onChange: (v) => upd({ stat_sampling_size: v }), min: 1, placeholder: '(none)' })}
          ${field.stat_characteristic && field.entity ? html`
            <div class="ec-stat-yaml">
              <div class="ec-stat-yaml-header">
                <span>HA configuration.yaml</span>
                <button class="ec-btn-copy" title="Copy YAML"
                  @click=${() => {
                    const yaml = generateStatisticsYaml(field.entity!, field.stat_characteristic!, field.stat_max_age_hours, field.stat_sampling_size, field.stat_percentile);
                    void navigator.clipboard.writeText(yaml);
                  }}>⎘ Copy</button>
              </div>
              <pre class="ec-stat-yaml-code">${generateStatisticsYaml(field.entity!, field.stat_characteristic!, field.stat_max_age_hours, field.stat_sampling_size, field.stat_percentile)}</pre>
            </div>
          ` : nothing}
      </div>
    `;
  }

  private _fieldSecDisplay(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    return html`
      <div class="ec-section">
          <div class="ec-subsection-title">Display</div>
          ${this._row('Unit',
            html`<input class="ec-input" type="text" .value=${field.unit ?? ''}
              placeholder=${this._displayUnit(field.entity, undefined) || '(from entity)'}
              @change=${(e: Event) => { const v = (e.target as HTMLInputElement).value; upd({ unit: v === '' ? undefined : v }); }}
            />`,
            "Shown after the value. Unset uses the entity's own unit.")}
          ${this._numRow('Decimals', { value: field.decimals, onChange: (v) => upd({ decimals: v }), min: 0, max: 6,
            placeholder: this._entityDecimalsHint(field.entity)?.toString() ?? 'auto',
            hint: "Decimal places shown. Unset follows the entity's own precision." })}
          ${this._numRow('Hide below', { value: field.hide_below, onChange: (v) => upd({ hide_below: v }), min: 0, placeholder: '(always show)', hint: 'Hides the field while the value is under this, compared unsigned (applies to negative values too).' })}
          ${this._displayUnit(field.entity, field.unit) ? html`<p class="ec-hint">Enter in ${this._displayUnit(field.entity, field.unit)}</p>` : nothing}
          ${field.entity?.startsWith('virtual:') && !field.time_until_layout?.length ? this._row('Show trigger label',
            html`<input type="checkbox"
              .checked=${field.show_time_until_label ?? false}
              @change=${(e: Event) => upd({
                show_time_until_label: (e.target as HTMLInputElement).checked || undefined,
              })}
            />`,
            'Shows the matching trigger label from the virtual entity instead of the number.') : nothing}
      </div>
    `;
  }

  /**
   * #124: an icon field's slice of what used to be Display. Hide below is the
   * only row of that screen an icon can act on, and it needs the entity that is
   * picked over in the Icon section, hence the pointer rather than a second
   * entity row here — two places to set one key would be two places to
   * disagree.
   */
  private _fieldSecVisibility(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    return html`
      <div class="ec-section">
          ${this._numRow('Hide below', { value: field.hide_below, onChange: (v) => upd({ hide_below: v }), min: 0,
            placeholder: '(always show)',
            hint: "Hides the icon while the entity's value is under this, compared unsigned (applies to negative values too)." })}
          ${/* field.unit is deliberately not consulted here: an icon field has no
                unit row to set it from, so the threshold reads in the entity's own
                display unit. */ ''}
          ${field.entity
            ? (this._displayUnit(field.entity, undefined) ? html`<p class="ec-hint">Enter in ${this._displayUnit(field.entity, undefined)}</p>` : nothing)
            : html`<p class="ec-hint">Set an <b>Entity</b> in the <b>Icon</b> section first — there is no value to compare against until you do.</p>`}
      </div>
    `;
  }

  private _fieldSecStyle(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    const px = isExtended ? `ext${ci}-f${fi}` : `c${ci}-f${fi}`;
    return html`
      <div class="ec-section">
          ${/* A control's align aligns its label rows, so it is edited in Labels. */
            isControlField(field.type) ? nothing : this._row('Align',
            html`<select class="ec-select"
              .value=${field.align ?? sd('align') ?? 'left'}
              @change=${(e: Event) => upd({ align: (e.target as HTMLSelectElement).value as Align })}
            >
              ${ALIGNS.map((a) => html`<option value=${a} .selected=${(field.align ?? sd('align') ?? 'left') === a}>${ALIGN_LABELS[a]}</option>`)}
            </select>`,
            "Horizontal alignment of this field's own content — its text, or an icon field's glyph. Where the field sits in its column follows the card's Align.")}
          ${this._row('Use global text style',
            html`<input type="checkbox" .checked=${field.style === undefined}
              @change=${(e: Event) => {
                if ((e.target as HTMLInputElement).checked) {
                  upd({ style: undefined });
                } else {
                  upd({ style: {} });
                }
              }}
            />`,
            "Ticked, this field follows the card's text styles. Unticking gives it its own, starting empty.")}
          ${field.style !== undefined ? html`
            <div class="ec-subsection-title">Style overrides</div>
            ${this._textRows(`${px}-st`, field.style, (p) => upd({ style: { ...field.style, ...p } }), FIELD_CONTAINER_SHOWS_CSS)}
          ` : nothing}
          ${this._cssRow(field.extra_css, (v) => upd({ extra_css: v }))}
      </div>
    `;
  }

  private _fieldSecActions(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const upd = this._updFor(ci, fi, isExtended);
    return html`
      <div class="ec-section">
          <div class="ec-subsection-title">Actions</div>
          ${this._actionRows(
            { tap_action: field.tap_action, hold_action: field.hold_action, double_tap_action: field.double_tap_action },
            (p) => upd(p),
          )}
      </div>
    `;
  }

  private _renderDefaultsRibbonPanel(): TemplateResult {
    const path = this._navPath;
    if (path.length === 0) return this._defaultsSectionMenu();
    if (path[0].key === 'sec:elements') {
      if (path.length === 1) return this._elemLibMenu();
      return this._elemLibSection(path[1].key);
    }
    if (path[0].key === 'sec:control') {
      if (path.length === 1) return this._controlDefaultsMenu();
      const k = path[1].key;
      // Selector and Button drill one level deeper into Field Container / states.
      if (k === 'cd:selector' || k === 'cd:button') {
        if (path.length === 2) return this._selectorDefaultsMenu(k);
        return this._selectorDefaultsSection(k, path[2].key);
      }
      return this._controlDefaultsSection(k);
    }
    return this._defaultsSection(path[0].key);
  }

  private static readonly _DEFAULTS_SECTIONS: NavSectionDef<GlobalDefaults>[] = [
    // #89: "Mosaic" because it governs canvas cards only — popovers no longer
    // inherit this box style, and have their own screen below.
    // Field placement lives here, not on Layout & Fonts: it is Mosaic-only, and
    // that screen governs every card type (#102).
    { key: 'sec:card',         label: 'Mosaic Card Defaults', hint: 'Field placement, box style, text color and popup behaviour', icon: 'mdi:view-dashboard-outline', terms: `${BOX_STYLE_TERMS} text colour color white contrast photo scrim backdrop dim overlay expand modal close button radius placement flow grid columns rows cells row gap`,
      paths: [...pfx('card', BOX_STYLE_PATHS), 'card_text_color', 'card_columns', 'card_layout_mode',
              'card_grid_columns', 'card_grid_rows', 'card_field_gap', 'card_column_gap',
              'card_grid_row_gap', ...MOSAIC_DIMMING_KEYS] },
    // Roots differ: the rows below this crumb write `extended_card_defaults`
    // (its own scope, its own Clear inside the screen), but the popover scrim
    // is a GlobalDefaults key, so it is claimed here — where this menu's scope
    // can actually count and clear it.
    { key: 'sec:popover',      label: 'Popover Card Defaults', hint: 'Default columns, size, gaps, style & dimming for every popover card', icon: 'mdi:picture-in-picture-bottom-right',
      terms: `${BOX_STYLE_TERMS} popover extended popup panel columns width height gap scrim backdrop dim`,
      paths: [...POPOVER_DIMMING_KEYS] },
    // #92: a plain BoxStyle on GlobalDefaults rather than a container of its own
    // — an embedded card needs no columns, gaps or text styles — so unlike
    // sec:popover above this screen sits in this menu's own scope.
    { key: 'sec:embedded',     label: 'Embedded Card Default', hint: 'Default frame, transparency & CSS for embedded cards', icon: 'mdi:card-outline',
      terms: `${BOX_STYLE_TERMS} embedded external third party lovelace frame surround host transparent chrome css`,
      paths: [...pfx('embedded_card', BOX_STYLE_PATHS), 'embedded_card_transparent', 'embedded_card_extra_css'] },
    { key: 'sec:value',        label: 'Value Default',        hint: 'Default value text style',                     icon: 'mdi:function-variant',       terms: TEXT_STYLE_TERMS,
      paths: pfx('value', TEXT_STYLE_PATHS) },
    { key: 'sec:label',        label: 'Label Default',        hint: 'Default label text style',                     icon: 'mdi:format-title',           terms: TEXT_STYLE_TERMS,
      paths: pfx('label', TEXT_STYLE_PATHS) },
    // sec:control and sec:elements are pure menus — every slot belongs to a
    // screen below them, so they carry no manifest of their own.
    { key: 'sec:control',      label: 'Control Default',      hint: 'Per-control style sections',                   icon: 'mdi:toggle-switch-outline' },
    { key: 'sec:customcolors', label: 'Custom Colors',        hint: 'Reusable css color variables',                 icon: 'mdi:language-css3',
      paths: ['custom_colors'] },
    { key: 'sec:customvars',   label: 'Custom Variables',     hint: 'Reusable sizes, shadows and other values',     icon: 'mdi:code-braces',
      paths: ['custom_vars'] },
    // No gap rows since #102: field spacing belongs to whichever card type owns
    // it. `field_gap`/`column_gap` are the frozen pre-split keys and keep no row
    // — they are a compatibility floor, not a setting anything writes.
    { key: 'sec:layout',       label: 'Layout & Fonts',       hint: 'Fonts and units, for every card type',        icon: 'mdi:format-size',
      paths: ['power_unit', 'stat_update_interval', 'font_family', 'mono_font_family'] },
    { key: 'sec:elements',     label: 'Element Library',      hint: 'Thermometer, battery, tank, inverter, gauge',  icon: 'mdi:palette-swatch-outline' },
    // Reset owns no slot — it replaces the whole config rather than clearing keys.
    { key: 'sec:reset',        label: 'Reset & Rerun Wizard', hint: 'Clear all cards, flows, zones & background',   icon: 'mdi:restore-alert' },
  ];

  /** Manifest scope for every Global Defaults screen — paths are GlobalDefaults-relative. */
  private _defaultsScope(): SectionScope<GlobalDefaults> {
    return {
      root: this._config?.defaults,
      apply: (patch) => this._updateDefaults(patch),
    };
  }

  private _defaultsSectionMenu(): TemplateResult {
    return this._navMenu(MosaicCanvasEditor._DEFAULTS_SECTIONS, this._defaultsScope());
  }

  private _defaultsSection(key: string): TemplateResult {
    const d = this._config?.defaults ?? {};
    const clear = this._clearOverridesBtn(
      MosaicCanvasEditor._findDef(MosaicCanvasEditor._DEFAULTS_SECTIONS, key), this._defaultsScope());
    return html`${clear}${this._defaultsSectionBody(d, key)}`;
  }

  private _defaultsSectionBody(d: GlobalDefaults, key: string): TemplateResult {
    if (key === 'sec:card') return this._defaultsSecCard(d);
    // The screen itself still owns extended_card_defaults, so it carries its own
    // Clear for those keys; the one above this covers the popover scrim, which
    // lives in GlobalDefaults. Both hide themselves when their side is untouched.
    if (key === 'sec:popover') {
      return html`
        ${this._clearOverridesBtn(MosaicCanvasEditor._POPOVER_GLOBAL_DEFAULTS_DEF, this._extDefaultsScope())}
        ${this._popoverGlobalDefaults()}
      `;
    }
    if (key === 'sec:embedded') return this._defaultsSecEmbedded(d);
    if (key === 'sec:value') return html`<div class="ec-section">${this._textRows('d-value', d.value ?? {}, (p) => this._updateDefaults({ value: { ...d.value, ...p } }))}</div>`;
    if (key === 'sec:label') return html`<div class="ec-section">${this._textRows('d-label', d.label ?? {}, (p) => this._updateDefaults({ label: { ...d.label, ...p } }))}</div>`;
    if (key === 'sec:customcolors') return this._defaultsSecCustomColors();
    if (key === 'sec:customvars') return this._defaultsSecCustomVars();
    if (key === 'sec:layout') return this._defaultsSecLayout();
    if (key === 'sec:reset') return this._defaultsSecReset();
    return html``;
  }

  /**
   * Embedded Card Default (#92) — what every embedded card starts from.
   *
   * Both of the per-card screen's halves, in its order and with its subsection
   * titles, because they are the same two surfaces: the *frame* on the host,
   * and *the card itself* inside the shadow boundary. Each half owns its own
   * Additional CSS and they are not interchangeable — the hints there explain
   * which is which, and this screen must not imply there is only one.
   */
  private _defaultsSecEmbedded(d: GlobalDefaults): TemplateResult {
    return html`
      <div class="ec-section">
        <div class="ec-subsection-title">Frame</div>
        <p class="ec-hint">Drawn on the element that <i>holds</i> the card, not on the card itself. An embedded
          card paints its own background and border, and those stay its own — turn on <b>Transparent</b> below
          to take them away and let this frame show through. Additional CSS here styles the frame: size it,
          move it, layer it.</p>
        ${this._boxRows('d-emb', d.embedded_card ?? {},
          (p) => this._updateDefaults({ embedded_card: { ...d.embedded_card, ...p } }))}

        <div class="ec-subsection-title">The card itself</div>
        ${this._row('Transparent',
          html`<input type="checkbox" .checked=${d.embedded_card_transparent ?? false}
            @change=${(e: Event) => this._updateDefaults({
              embedded_card_transparent: (e.target as HTMLInputElement).checked || undefined })}
          />`)}
        <p class="ec-hint">Removes every embedded card's own background, border and shadow. A card can still
          set its own — untick <b>Use global transparency</b> on it to do that.</p>
        ${this._cssRow(d.embedded_card_extra_css,
          (v) => this._updateDefaults({ embedded_card_extra_css: v }), 'Card CSS')}
        <p class="ec-hint">Applied to the card itself, not to the frame — this is where a
          <code>--ha-card-…</code> override or a font change goes. A card's own <b>Card CSS</b> is added after
          this rather than replacing it, so it wins where the two name the same property.</p>
      </div>
    `;
  }

  private _defaultsSecReset(): TemplateResult {
    return html`
      <div class="ec-section">
        <ha-alert alert-type="warning">Clears all cards, flows, zones, and background settings, then restarts the setup wizard. This cannot be undone.</ha-alert>
        <div class="ec-wiz-reset-row">
          <button class="ec-wiz-btn-reset" @click=${this._resetToWizard}>⟳ Reset &amp; rerun setup wizard</button>
        </div>
      </div>
    `;
  }

  /**
   * Global Defaults ▸ Mosaic Card Defaults — the box style, the text colour
   * every card falls back to, and how popups behave. Canvas cards only since
   * #89; popovers have their own screen and their own box chain.
   *
   * Phase 6 gave the last two their own sections, "Card Text" and "Overlays &
   * Modals". Both were the wrong altitude: nine pickers, of which four were
   * close-button colours, fronted by words ("scrim", "modal") that are ours
   * rather than a user's. They fold in here instead — a popup *is* a card shown
   * large, and the text colour is card-wide.
   *
   * Nothing here follows the theme, and the hints say why: a card sits over an
   * unknown background image, so `--primary-text-color` would vanish in a light
   * theme and a themed scrim would stop darkening (STYLING.md §8).
   */
  private _defaultsSecCard(d: GlobalDefaults): TemplateResult {
    const dim = matchPopupDimming(d, MOSAIC_DIMMING_KEYS);
    const mode = cardLayoutMode(undefined, d);
    return html`
      <div class="ec-section">
        <div class="ec-subsection-title">Field layout</div>
        <p class="ec-hint">How a Mosaic card arranges its fields unless the card sets its own. These live here rather than
          on <b>Layout &amp; Fonts</b> because they are Mosaic-only — a popover and an embedded card have no field
          placement of their own.</p>

        ${this._row('Field placement',
          html`<select class="ec-select"
            .value=${mode}
            @change=${(e: Event) => {
              const v = (e.target as HTMLSelectElement).value as CardLayoutMode;
              this._updateDefaults({ card_layout_mode: v === 'flow' ? undefined : v });
            }}
          >
            <option value="flow" .selected=${mode === 'flow'}>Flow</option>
            <option value="grid" .selected=${mode === 'grid'}>Grid</option>
          </select>`,
          'Flow stacks fields in the order they are listed. Grid divides the card into cells and each field names the row and column it sits in.')}

        ${this._row('Columns (flow)',
          html`<select class="ec-select"
            .value=${String(d.card_columns ?? sd('card_columns') ?? 1)}
            @change=${(e: Event) => {
              const v = Number((e.target as HTMLSelectElement).value);
              this._updateDefaults({ card_columns: v === 1 ? undefined : v });
            }}
          >
            ${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => html`
              <option value=${String(n)} .selected=${(d.card_columns ?? sd('card_columns') ?? 1) === n}>${n}</option>`)}
          </select>`,
          "How many columns a card's fields flow into. Only used in flow placement.")}

        ${this._row('Grid columns',
          html`${this._numInput({ value: d.card_grid_columns ?? sd('card_grid_columns') ?? 4,
            onChange: (v) => this._updateDefaults({ card_grid_columns: v == null ? undefined : Math.max(1, Math.min(8, v)) }), min: 1, max: 8 })}`,
          'How many cells across a card has in grid placement.')}
        ${this._row('Grid rows',
          html`${this._numInput({ value: d.card_grid_rows ?? sd('card_grid_rows') ?? 4,
            onChange: (v) => this._updateDefaults({ card_grid_rows: v == null ? undefined : Math.max(1, Math.min(20, v)) }), min: 1, max: 20 })}`,
          'How many cells down a card has in grid placement. The card divides its own height between them.')}
        ${this._numRow('Field gap (px)', {
          value: d.card_field_gap,
          onChange: (v) => this._updateDefaults({ card_field_gap: v }),
          min: 0,
          placeholder: String(this._mosaicFieldGap()),
          hint: 'In flow placement, the vertical space between fields. In grid placement the cells do that, so it is only the space between a field\'s own parts — its label and its value.',
        })}
        ${this._numRow('Column gap (px)', {
          value: d.card_column_gap,
          onChange: (v) => this._updateDefaults({ card_column_gap: v }),
          min: 0,
          placeholder: String(this._mosaicColumnGap()),
          hint: 'Horizontal space between columns, in both placements.',
        })}
        ${this._numRow('Grid row gap (px)', {
          value: d.card_grid_row_gap,
          onChange: (v) => this._updateDefaults({ card_grid_row_gap: v }),
          min: 0,
          placeholder: String(this._mosaicFieldGap()),
          hint: 'Vertical space between grid rows. Unset follows Field gap, so one value still themes a whole card.',
        })}

        <div class="ec-subsection-title">Card box</div>
        ${this._boxRows('d-card', d.card ?? {}, (p) => this._updateDefaults({ card: { ...d.card, ...p } }))}

        <div class="ec-subsection-title">Card text</div>
        <p class="ec-hint">What every field, control label and popup title falls back to when nothing more specific is set. Cards sit over your background image, so this stays fixed rather than following the theme.</p>
        ${this._row('Default text color',
          this._colorPicker('d-cardtext', d.card_text_color, (v) => this._updateDefaults({ card_text_color: v || undefined }), {
            clearTitle: 'Reset to default',
          }))}

        <div class="ec-subsection-title">Popups</div>
        <p class="ec-hint">How an expanded Mosaic card looks when it opens over the dashboard. A popover's own dimming is set in <b>Popover Card Defaults</b>; the close button below is shared by both.</p>
        ${this._row('Dimming', html`
          <select class="ec-select"
            @change=${(e: Event) => this._setPopupDimming((e.target as HTMLSelectElement).value as PopupDimming, MOSAIC_DIMMING_KEYS)}
          >
            ${dim === undefined
              ? html`<option value="" selected>Custom</option>`
              : nothing}
            ${(Object.keys(POPUP_DIMMING) as PopupDimming[]).map((k) => html`
              <option value=${k} .selected=${dim === k}>${POPUP_DIMMING[k].label} — ${POPUP_DIMMING[k].hint}</option>`)}
          </select>`)}
        ${dim === undefined
          ? html`<p class="ec-hint">These colors were set by hand in YAML, so no preset describes them. Picking one replaces them.</p>`
          : nothing}
        <p class="ec-hint">An overlay's corners follow the card's own <b>Border radius</b> above — the panel behind it has no colour of its own, so a second radius here only fought the one setting that is visible.</p>
      </div>
    `;
  }

  /**
   * Apply a dimming preset across the keys the calling screen owns (#89) — the
   * Mosaic screen's five, or the popover's one. Defaults to all six so a caller
   * that wants the whole set still gets it.
   *
   * A preset whose values already match the seed file is written as `undefined`
   * rather than spelled out, so choosing the shipped look leaves the YAML clean
   * instead of restating values the seed already provides.
   */
  private _setPopupDimming(
    name: PopupDimming,
    keys: readonly (typeof POPUP_DIMMING_KEYS)[number][] = POPUP_DIMMING_KEYS,
  ): void {
    if (!(name in POPUP_DIMMING)) return; // the "Custom" placeholder
    const preset = POPUP_DIMMING[name].values;
    const patch: Partial<GlobalDefaults> = {};
    for (const k of keys) {
      patch[k] = sd(k) === preset[k] ? undefined : preset[k];
    }
    this._updateDefaults(patch);
  }

  /** A custom-variable name: usable as a CSS ident, so anything else becomes `_`. */
  private static _custName(s: string): string {
    return s.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  }

  /**
   * Names used more than once across `custom_colors` and `custom_vars` together.
   *
   * The two lists share the `--mccust_` namespace, so a name in both silently
   * resolves to whichever is emitted last (`customVarStyles`: colours first, so
   * the variable wins). Rather than pick a prefix per list and make users learn
   * two, the clash is surfaced where it is made.
   */
  private _custDuplicateNames(): Set<string> {
    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (const [prop] of customVarStyles(this._config?.defaults)) {
      const n = prop.slice('--mccust_'.length);
      if (seen.has(n)) dupes.add(n);
      seen.add(n);
    }
    return dupes;
  }

  /** A name field shared by both custom lists, flagged red when the name collides. */
  private _custNameInput(
    value: string,
    dupes: Set<string>,
    onChange: (name: string) => void,
  ): TemplateResult {
    const clash = value !== '' && dupes.has(value);
    return html`
      <span style="font-size:11px;opacity:0.6;white-space:nowrap;">mccust_</span>
      <input class="ec-input" type="text" placeholder="name" style="flex:0 1 110px;${clash ? 'border-color:var(--error-color, #db4437);' : ''}"
        title=${clash ? 'This name is used twice — colors and variables share one --mccust_ namespace, so only one of them will apply.' : 'Becomes --mccust_<name>.'}
        .value=${value}
        @change=${(e: Event) => onChange(MosaicCanvasEditor._custName((e.target as HTMLInputElement).value))} />
    `;
  }

  private _defaultsSecCustomColors(): TemplateResult {
    const list = this._config?.defaults?.custom_colors ?? [];
    const setList = (l: { name: string; color: string }[]): void =>
      this._updateDefaults({ custom_colors: l.length ? l : undefined });
    const dupes = this._custDuplicateNames();
    return html`
      <div class="ec-section">
        <p class="ec-hint">Reusable colors. Each becomes <code>--mccust_&lt;name&gt;</code>, and appears in every color picker's <b>CSS Mode</b> list. Specifying a custom theme variable is allowed in the RGB input field.</p>
        ${this._custDuplicateHint(dupes)}
        ${list.length === 0 ? html`<p class="ec-empty">No custom colors — click "+ Color".</p>` : nothing}
        ${list.map((c, idx) => html`
          <div class="ec-list-row" style="align-items:center;gap:6px;">
            ${this._custNameInput(c.name, dupes, (name) => { const n = [...list]; n[idx] = { ...c, name }; setList(n); })}
            <div style="flex:1;min-width:0;">
              ${this._colorPicker(`cust-${idx}`, c.color, (v) => { const n = [...list]; n[idx] = { ...c, color: v ?? '' }; setList(n); }, { clearable: false })}
            </div>
            <button class="ec-btn-remove" title="Remove" @click=${() => setList(list.filter((_, i) => i !== idx))}>✕</button>
          </div>`)}
        <button class="ec-btn-add" @click=${() => setList([...list, { name: `color${list.length + 1}`, color: '#00d4ff' }])}>+ Color</button>
      </div>
    `;
  }

  private _custDuplicateHint(dupes: Set<string>): TemplateResult | typeof nothing {
    if (dupes.size === 0) return nothing;
    return html`<p class="ec-hint" style="color:var(--error-color, #db4437);">
      Used in both lists: ${[...dupes].map((n) => `mccust_${n}`).join(', ')}. Colors and variables
      share one <code>--mccust_</code> namespace, so only the variable will apply. Rename one of each pair.
    </p>`;
  }

  /**
   * Global Defaults ▸ Custom Variables (#74 Phase 7).
   *
   * The non-colour half of the `--mccust_` registry: any CSS value, for
   * `extra_css` to share between rules. It is free-form rather than a sizes-only
   * list because a shadow, a font stack and a transition are just as worth
   * naming once as a length is, and a typed list would have to grow a case for
   * each of them.
   */
  private _defaultsSecCustomVars(): TemplateResult {
    const list = this._config?.defaults?.custom_vars ?? [];
    const setList = (l: { name: string; value: string }[]): void =>
      this._updateDefaults({ custom_vars: l.length ? l : undefined });
    const dupes = this._custDuplicateNames();
    return html`
      <div class="ec-section">
        <p class="ec-hint">Reusable values of any kind — sizes, shadows, font stacks. Each becomes <code>--mccust_&lt;name&gt;</code> on the card, so <b>Extra CSS</b> anywhere in the card can use <code>var(--mccust_&lt;name&gt;)</code> instead of repeating the value.</p>
        <p class="ec-hint">These share the same namespace as <b>Custom Colors</b>, so a name can only be used in one list. Colors go in that list — only they appear in the color pickers' CSS Mode.</p>
        ${this._custDuplicateHint(dupes)}
        ${list.length === 0 ? html`<p class="ec-empty">No custom variables — click "+ Variable".</p>` : nothing}
        ${list.map((c, idx) => html`
          <div class="ec-list-row" style="align-items:center;gap:6px;">
            ${this._custNameInput(c.name, dupes, (name) => { const n = [...list]; n[idx] = { ...c, name }; setList(n); })}
            <input class="ec-input" type="text" placeholder="value (e.g. 8px, 0 2px 6px rgba(0,0,0,.4))" style="flex:1;min-width:0;"
              .value=${c.value}
              @change=${(e: Event) => { const n = [...list]; n[idx] = { ...c, value: (e.target as HTMLInputElement).value.trim() }; setList(n); }} />
            <button class="ec-btn-remove" title="Remove" @click=${() => setList(list.filter((_, i) => i !== idx))}>✕</button>
          </div>`)}
        <button class="ec-btn-add" @click=${() => setList([...list, { name: `var${list.length + 1}`, value: '' }])}>+ Variable</button>
      </div>
    `;
  }

  /** Control-style number input row (px), used by both global and per-field control style. */
  private _controlNumRow(label: string, value: number | undefined, placeholder: string, onChange: (v: number | undefined) => void, min = 1, hint?: string): TemplateResult {
    return this._numRow(label, { value, onChange, placeholder, min, hint });
  }

  /**
   * ControlStyle keys that are edited outside the Control Style panel (in
   * Options / Button Layout, for a selector and a button respectively).
   * "Use global control style" governs the colour knobs only, so these survive
   * it being ticked, whichever of the two field types owns the `ControlStyle`.
   *
   * #75: derived from `OPTION_SEPARATION_PATHS` + `BUTTON_SEPARATION_PATHS` —
   * the manifests for the screens that actually render these rows — rather
   * than hand-duplicated, closing the #28 drift class this pair used to
   * demonstrate: this list used to be a hand-written selector-only subset
   * missing the segmented-frame keys (`button_group_border_color`,
   * `button_group_border_width`, `button_group_radius`), so ticking "Use global
   * control style" on a selector field silently discarded its frame border
   * and radius while preserving their nine neighbours. The frame keys stay
   * owned by Option Separation (where they already render); deriving from its
   * manifest is what stops the two from re-drifting, not a move of where the
   * user edits them.
   */
  private static readonly SEPARATION_KEYS: readonly (keyof ControlStyle)[] =
    [...OPTION_SEPARATION_PATHS, ...BUTTON_SEPARATION_PATHS] as readonly (keyof ControlStyle)[];

  /** The separation-only subset of a control style, or undefined if it holds none. */
  private static _separationOnly(cs: ControlStyle | undefined): ControlStyle | undefined {
    if (!cs) return undefined;
    const keep: ControlStyle = {};
    let any = false;
    for (const k of MosaicCanvasEditor.SEPARATION_KEYS) {
      if (cs[k] !== undefined) { (keep as Record<string, unknown>)[k] = cs[k]; any = true; }
    }
    return any ? keep : undefined;
  }

  /**
   * Fields whose colour overrides are switched on but still empty. Without this,
   * an empty control_style would be indistinguishable from "use global" and the
   * checkbox would spring back the moment it was unticked. Editor-only state.
   */
  private _colorOverridesOn = new Set<string>();

  /**
   * Option separation — the knobs that turn a joined segmented row into
   * discrete buttons. Lives in ControlStyle so it cascades global → field, but
   * is surfaced in the Options / Button Layout panels because that is where
   * someone looks for it.
   */
  private _optionSeparationRows(
    cs: ControlStyle,
    upd: (p: Partial<ControlStyle>) => void,
    forButton = false,
  ): TemplateResult {
    // A button is a single cell: there is nothing to be separated from, so gap
    // and per-option border are meaningless. Its padding still is.
    if (forButton) {
      return html`
        <div class="ec-subsection-title">Padding</div>
        ${this._csNumRow(cs, upd, 'Button padding (px)', 'button_option_padding', '5 / 10', 0,
          'Vertical / horizontal padding inside the button.')}
      `;
    }
    const cp = (id: string, val: string | undefined, set: (v: string | undefined) => void): TemplateResult =>
      this._colorPicker(id, val, (v) => set(v || undefined));
    // Gap is the master switch: a non-zero gap detaches the options into discrete
    // cells, so every other separation setting only makes sense — and only shows —
    // once a gap is set.
    const gapSet = (cs.button_group_option_gap ?? 0) > 0;
    return html`
      <div class="ec-subsection-title">Option separation</div>
      <p class="ec-hint">Set a gap to detach the options into discrete buttons — the shared outline and the divider lines between segments go away, and each option becomes its own cell. Leave the gap at 0 for the joined segmented look.</p>
      ${this._csNumRow(cs, upd, 'Gap between options (px)', 'button_group_option_gap', '0', 0)}
      <div class="ec-subsection-title">${gapSet ? 'Button group border (fallback for detached options)' : 'Segmented frame'}</div>
      <p class="ec-hint">${gapSet
        ? 'The button group’s own border. It has no visible frame to draw once options are detached, but it stays the fallback for "Border per option" below whenever an option is left without its own override.'
        : 'The outline around the joined segmented row, and the divider lines between options.'}</p>
      ${this._row('Border color', cp('sel-bd', cs.button_group_border_color, (v) => upd({ button_group_border_color: v })),
        'Colour of the outline described above.')}
      ${this._csNumRow(cs, upd, 'Border width (px)', 'button_group_border_width', '1', 0)}
      ${this._csNumRow(cs, upd, 'Radius (px)', 'button_group_radius', '7')}
      ${gapSet ? html`
        ${this._csNumRow(cs, upd, 'Internal padding (px)', 'button_group_option_padding', '5', 0,
          "Space between the group's frame and the detached options.")}
        ${this._row('Border per option',
          html`<input type="checkbox" .checked=${cs.button_group_option_border ?? false}
            @change=${(e: Event) => upd({ button_group_option_border: (e.target as HTMLInputElement).checked || undefined })}
          />`,
          'Gives each detached option its own border settings.')}
        ${cs.button_group_option_border ? html`
          ${this._row('Option border color', cp('sel-obd', cs.button_group_option_border_color, (v) => upd({ button_group_option_border_color: v })),
            "Unset reuses the button group's border colour above.")}
          ${this._csNumRow(cs, upd, 'Option border width (px)', 'button_group_option_border_width', 'group width', 0,
            "Unset reuses the button group's border width.")}
          ${this._csNumRow(cs, upd, 'Option border radius (px)', 'button_group_option_radius', 'group radius', 0,
            "Unset reuses the button group's radius.")}
        ` : nothing}
        <div class="ec-subsection-title">Option extra CSS</div>
        ${this._cssRow(cs.button_group_option_extra_css, (v) => upd({ button_group_option_extra_css: v }), 'Additional CSS',
          'Raw CSS applied to each separated option cell, so detached buttons can be fully styled.')}
      ` : nothing}
    `;
  }

  /** The control-wide default angle, edited from Control Default ▸ Common. */
  private _controlGradientAngleRow(cs: ControlStyle, upd: (p: Partial<ControlStyle>) => void): TemplateResult {
    return this._csNumRow(cs, upd, 'Gradient angle (deg)', 'gradient_angle', '180', 0);
  }

  /**
   * Gradients that are switched on but still have no end colour (#91). Ticking
   * Gradient writes nothing — the point is to start empty — so without this the
   * checkbox would spring straight back on the next render, exactly the problem
   * `_colorOverridesOn` solves for colour overrides. Editor-only state, keyed by
   * the picker id; a gradient with a colour needs no entry.
   */
  private _gradientOn = new Set<string>();

  /**
   * The colour + gradient group behind every gradient-capable colour: the main
   * colour with a Gradient checkbox beside its clear button, and — only while
   * that is ticked — the gradient end and its angle.
   *
   * Ticked is derived from the config (an end colour is set) OR `_gradientOn`,
   * so an existing gradient always opens showing its rows. Unticking clears both
   * config keys, because a set end colour is still what turns the gradient on:
   * leaving it behind would paint a gradient the UI claims is off.
   */
  private _gradientRows(o: {
    id: string;
    label: string;
    toLabel?: string;
    color: string | undefined;
    color2: string | undefined;
    angle: number | undefined;
    anglePlaceholder?: string;
    /** Tier-2 tooltip for the main colour row; the caller owns its wording. */
    colorHint?: string;
    /** Tier-2 tooltip for the angle row — a plain inheritance statement (#93). */
    angleTooltip?: string;
    /**
     * Tier-1 paragraph under the angle row. Reserved for the case where the
     * angle can silently do nothing (an SVG shipping its own gradient stops),
     * which is why it is a standing paragraph and `angleTooltip` is not.
     */
    angleHint?: string;
    setColor: (v: string | undefined) => void;
    setColor2: (v: string | undefined) => void;
    setAngle: (v: number | undefined) => void;
    /**
     * Clears the end colour and the angle in one config write. Required rather
     * than optional: calling `setColor2` and `setAngle` in turn would push two
     * entries onto the undo stack, so unticking would take two undos to put
     * back.
     */
    clearGradient: () => void;
    onClearColor?: () => void;
  }): TemplateResult {
    const on = o.color2 != null || this._gradientOn.has(o.id);
    const toggle = (next: boolean): void => {
      if (next) {
        this._gradientOn.add(o.id);
        this.requestUpdate();
        return;
      }
      this._gradientOn.delete(o.id);
      o.clearGradient();
    };
    return html`
      ${this._row(o.label, this._colorPicker(o.id, o.color, (v) => o.setColor(v || undefined), {
        onClear: o.onClearColor,
        gradient: { on, onToggle: toggle },
      }), o.colorHint)}
      ${on ? html`
        ${this._row(o.toLabel ?? `${o.label} gradient to`,
          this._colorPicker(`${o.id}-2`, o.color2, (v) => o.setColor2(v || undefined)),
          'The colour the gradient ends on. Nothing renders as a gradient until this is set.')}
        ${this._controlNumRow('Gradient angle (deg)', o.angle, o.anglePlaceholder ?? '180',
          (v) => o.setAngle(v), 0,
          o.angleTooltip ?? 'Direction the gradient runs — 0° fills upwards, 180° downwards.')}
        ${o.angleHint ? html`<p class="ec-hint">${o.angleHint}</p>` : nothing}
      ` : nothing}
    `;
  }

  /**
   * `_gradientRows` for one Element Library element, whose three keys are a flat
   * `<prefix>_fill_color` / `_fill_color2` / `_fill_angle` set on GlobalDefaults.
   * Driving it off the prefix keeps all eight screens on one implementation —
   * they were eight hand-copied blocks before #91.
   */
  private _libFillRows(id: string, prefix: string): TemplateResult {
    const d = (this._config?.defaults ?? {}) as Record<string, unknown>;
    const set = (k: string, v: string | number | undefined): void =>
      this._updateDefaults({ [`${prefix}_${k}`]: v } as Partial<GlobalDefaults>);
    return this._gradientRows({
      id,
      label: 'Fill color',
      toLabel: 'Gradient to',
      color: d[`${prefix}_fill_color`] as string | undefined,
      color2: d[`${prefix}_fill_color2`] as string | undefined,
      angle: d[`${prefix}_fill_angle`] as number | undefined,
      anglePlaceholder: 'fill direction',
      angleHint: SVG_FILL_ANGLE_HINT,
      setColor: (v) => set('fill_color', v),
      setColor2: (v) => set('fill_color2', v),
      setAngle: (v) => set('fill_angle', v),
      clearGradient: () => this._updateDefaults({
        [`${prefix}_fill_color2`]: undefined,
        [`${prefix}_fill_angle`]: undefined,
      } as Partial<GlobalDefaults>),
    });
  }

  /** `_gradientRows` for a ControlStyle triple, which is most of them. */
  private _csGradientRows(
    id: string,
    label: string,
    k1: keyof ControlStyle,
    k2: keyof ControlStyle,
    kAngle: keyof ControlStyle,
    cs: ControlStyle,
    upd: (p: Partial<ControlStyle>) => void,
    colorHint?: string,
  ): TemplateResult {
    const set = (k: keyof ControlStyle, v: string | number | undefined): void =>
      upd({ [k]: v } as Partial<ControlStyle>);
    return this._gradientRows({
      id,
      label,
      colorHint,
      color: cs[k1] as string | undefined,
      color2: cs[k2] as string | undefined,
      angle: cs[kAngle] as number | undefined,
      anglePlaceholder: String(cs.gradient_angle ?? 180),
      // #93: demoted from a standing paragraph. A plain inheritance statement is
      // the tier-2 shape, and this one was permanent vertical space on all 15
      // control surfaces.
      angleTooltip: 'Direction the gradient runs — 0° fills upwards, 180° downwards. '
        + 'Unset follows the control-wide Gradient angle in Settings ▸ Global Defaults ▸ Control Default ▸ Common.',
      setColor: (v) => set(k1, v),
      setColor2: (v) => set(k2, v),
      setAngle: (v) => set(kAngle, v),
      clearGradient: () => upd({ [k2]: undefined, [kAngle]: undefined } as Partial<ControlStyle>),
    });
  }

  /**
   * Field Container / Active / Inactive rows for a selector or button control
   * style. Shared by global defaults (_selectorDefaultsSection) and the
   * per-field Control Style panel (_fieldControlStyleStateSection) so the two
   * contexts can't drift apart.
   */
  private _selectorStateRows(
    idPrefix: string,
    cs: ControlStyle,
    upd: (p: Partial<ControlStyle>) => void,
    sub: 'sub:container' | 'sub:active' | 'sub:inactive',
    isButton: boolean,
  ): TemplateResult {
    const cp = (id: string, val: string | undefined, set: (v: string | undefined) => void): TemplateResult =>
      this._colorPicker(`${idPrefix}-${id}`, val, (v) => set(v || undefined));
    // #93: these two replace the "Icon and state value follow the label color"
    // paragraph that used to sit under the inactive rows of both states.
    const ICON_HINT = "Colour of the option's icon. Unset follows the label colour.";
    const STATE_HINT = 'Colour of the state value shown on the option. Unset follows the label colour.';

    // Button reads/writes its own button_* keys throughout — never a button_group_*
    // one — so styling one control type can never bleed into the other.
    if (sub === 'sub:active' || sub === 'sub:inactive') {
      const active = sub === 'sub:active';
      if (isButton) {
        return active ? html`
          <p class="ec-hint">Applied while the button's entity is on, or — with a value set — while the entity's state equals it.</p>
          ${this._csGradientRows(`${idPrefix}-sel-sel`, 'Background', 'button_selected_color', 'button_selected_color2', 'button_selected_angle', cs, upd,
            'Fill behind the button in this state.')}
          ${this._row('Label color', cp('sel-selt', cs.button_selected_text_color, (v) => upd({ button_selected_text_color: v })),
            "Colour of the button's text in this state.")}
          ${this._row('Icon color', cp('sel-selic', cs.button_selected_icon_color, (v) => upd({ button_selected_icon_color: v })),
            ICON_HINT)}
          ${this._row('State value color', cp('sel-selst', cs.button_selected_state_color, (v) => upd({ button_selected_state_color: v })),
            STATE_HINT)}
        ` : html`
          ${this._csGradientRows(`${idPrefix}-sel-bg`, 'Background', 'button_bg', 'button_bg2', 'button_bg_angle', cs, upd,
            'Fill behind the button in this state.')}
          ${this._row('Label color', cp('sel-txt', cs.button_text_color, (v) => upd({ button_text_color: v })),
            "Colour of the button's text in this state.")}
          ${this._row('Icon color', cp('sel-ic', cs.button_icon_color, (v) => upd({ button_icon_color: v })), ICON_HINT)}
          ${this._row('State value color', cp('sel-st', cs.button_state_color, (v) => upd({ button_state_color: v })), STATE_HINT)}
        `;
      }
      return active ? html`
        <p class="ec-hint">Applied to an option whose value is the entity's current state, or whose own entity is on.</p>
        ${this._csGradientRows(`${idPrefix}-sel-sel`, 'Background', 'button_group_selected_color', 'button_group_selected_color2', 'button_group_selected_angle', cs, upd,
          'Fill behind the option in this state.')}
        ${this._row('Label color', cp('sel-selt', cs.button_group_selected_text_color, (v) => upd({ button_group_selected_text_color: v })),
          "Colour of the option's text in this state.")}
        ${this._row('Icon color', cp('sel-selic', cs.button_group_selected_icon_color, (v) => upd({ button_group_selected_icon_color: v })), ICON_HINT)}
        ${this._row('State value color', cp('sel-selst', cs.button_group_selected_state_color, (v) => upd({ button_group_selected_state_color: v })), STATE_HINT)}
      ` : html`
        ${this._csGradientRows(`${idPrefix}-sel-bg`, 'Background', 'button_group_bg', 'button_group_bg2', 'button_group_bg_angle', cs, upd,
          'Fill behind the option in this state.')}
        ${this._row('Label color', cp('sel-txt', cs.button_group_text_color, (v) => upd({ button_group_text_color: v })),
          "Colour of the option's text in this state.")}
        ${this._row('Icon color', cp('sel-ic', cs.button_group_icon_color, (v) => upd({ button_group_icon_color: v })), ICON_HINT)}
        ${this._row('State value color', cp('sel-st', cs.button_group_state_color, (v) => upd({ button_group_state_color: v })), STATE_HINT)}
      `;
    }

    // sub:container — sizes only. Placement/text (option_layout) and the segmented-
    // frame border/separation live elsewhere; callers append what belongs to them.
    if (isButton) {
      return html`
        ${this._row('Border color', cp('sel-bd', cs.button_border_color, (v) => upd({ button_border_color: v })),
          "Colour of the button's outline.")}
        ${this._csNumRow(cs, upd, 'Border width (px)', 'button_border_width', '1', 0)}
        ${this._csNumRow(cs, upd, 'Radius (px)', 'button_radius', '7')}
        ${this._csNumRow(cs, upd, 'Padding (px)', 'button_option_padding', '5 / 10', 0,
          'Vertical / horizontal padding inside the button.')}
        ${this._csNumRow(cs, upd, 'Label font size (px)', 'button_text_size', '13')}
        ${this._csNumRow(cs, upd, 'Icon font size (px)', 'button_icon_size', '18')}
        ${this._csNumRow(cs, upd, 'State value font size (px)', 'button_state_size', 'label size')}
      `;
    }
    return html`
      ${this._csNumRow(cs, upd, 'Label font size (px)', 'button_group_text_size', '13')}
      ${this._csNumRow(cs, upd, 'Icon font size (px)', 'button_group_icon_size', '18')}
      ${this._csNumRow(cs, upd, 'State value font size (px)', 'button_group_state_size', 'label size')}
    `;
  }

  /**
   * A numeric ControlStyle row whose placeholder resolves down the same chain the
   * value does: the seed tier (#74 Phase 7) if it carries this key, otherwise the
   * built-in floor from `resolveControlStyle`. So a deployer who retunes
   * `control_style` in defaults.json sees their own numbers as the "unset" hint
   * instead of ours, in every panel that edits control style.
   *
   * `literal` is a word rather than a number wherever the key derives from a
   * sibling ("circle", "thumb size", "label size") — those keys are deliberately
   * unseeded, so no number would ever be the honest hint.
   */
  private _csNumRow(
    cs: ControlStyle,
    upd: (p: Partial<ControlStyle>) => void,
    label: string,
    k: keyof ControlStyle,
    literal: string,
    min = 1,
    hint?: string,
  ): TemplateResult {
    const seeded = sd('control_style')?.[k];
    return this._controlNumRow(label, cs[k] as number | undefined,
      typeof seeded === 'number' ? String(seeded) : literal,
      (v) => upd({ [k]: v } as Partial<ControlStyle>), min, hint);
  }

  /**
   * A whole CSS box-shadow value, not a colour: "none" has to be expressible, and
   * an alpha of zero would still leave the blur occupying space. Seed-aware on the
   * same terms as `_csNumRow`.
   */
  private _csShadowRow(
    cs: ControlStyle,
    upd: (p: Partial<ControlStyle>) => void,
    label: string,
    k: keyof ControlStyle,
    literal: string,
  ): TemplateResult {
    const seeded = sd('control_style')?.[k];
    // #93: the tooltip moved from the input to the label, text unchanged. It
    // serves every shadow row — thumb shadows and the dropdown menu shadow.
    return this._row(label, html`<input class="ec-input" type="text" .value=${(cs[k] as string | undefined) ?? ''}
      placeholder=${typeof seeded === 'string' ? seeded : literal}
      @change=${(e: Event) => upd({ [k]: (e.target as HTMLInputElement).value.trim() || undefined } as Partial<ControlStyle>)}
    />`, "A full CSS box-shadow value. Use 'none' to remove the shadow.");
  }

  /** Color rows for a ControlStyle, scoped to the given field type. */
  private _controlStyleRows(
    idPrefix: string,
    cs: ControlStyle,
    type: FieldType,
    upd: (p: Partial<ControlStyle>) => void,
    showAccent = true,
  ): TemplateResult {
    const cp = (id: string, val: string | undefined, set: (v: string | undefined) => void): TemplateResult =>
      this._colorPicker(`${idPrefix}-${id}`, val, (v) => set(v || undefined));
    const numRow = (label: string, k: keyof ControlStyle, literal: string, min = 1, hint?: string): TemplateResult =>
      this._csNumRow(cs, upd, label, k, literal, min, hint);
    const shadowRow = (label: string, k: keyof ControlStyle, literal: string): TemplateResult =>
      this._csShadowRow(cs, upd, label, k, literal);
    return html`
      ${showAccent ? html`
        ${this._csGradientRows(`${idPrefix}-accent`, 'Accent', 'accent_color', 'accent_color2', 'accent_angle', cs, upd)}
      ` : nothing}
      ${type === 'toggle' ? html`
        <div class="ec-subsection-title">Toggle</div>
        ${this._csGradientRows(`${idPrefix}-on`, 'On color', 'toggle_on_color', 'toggle_on_color2', 'toggle_on_angle', cs, upd,
          'Track colour while the toggle is on.')}
        ${this._csGradientRows(`${idPrefix}-off`, 'Off color', 'toggle_off_color', 'toggle_off_color2', 'toggle_off_angle', cs, upd,
          'Track colour while the toggle is off.')}
        <div class="ec-subsection-title">Toggle thumb</div>
        ${this._row('Thumb color', cp('th-col', cs.toggle_thumb_color, (v) => upd({ toggle_thumb_color: v })),
          'Colour of the moving knob.')}
        ${numRow('Thumb size (px)', 'toggle_thumb_size', '18')}
        ${numRow('Thumb radius (px)', 'toggle_thumb_radius', 'circle', 0, 'Unset keeps the thumb round.')}
        ${numRow('Thumb padding (px)', 'toggle_thumb_padding', '2', 0)}
        ${shadowRow('Thumb shadow', 'toggle_thumb_shadow', '0 1px 3px rgba(0,0,0,0.5)')}
      ` : nothing}
      ${type === 'slider' ? html`
        <div class="ec-subsection-title">Slider</div>
        ${this._csGradientRows(`${idPrefix}-track`, 'Track color', 'slider_track_color', 'slider_track_color2', 'slider_track_angle', cs, upd,
          "Colour of the slider's empty track.")}
        ${this._csGradientRows(`${idPrefix}-fill`, 'Fill color', 'slider_fill_color', 'slider_fill_color2', 'slider_fill_angle', cs, upd,
          'Colour of the filled part up to the value.')}
        ${numRow('Track height (px)', 'slider_height', '6')}
        ${numRow('Track length (px)', 'slider_length', 'fill width', 0, "Unset lets the track fill the field's width.")}
        ${numRow('Track radius (px)', 'slider_radius', 'pill', 0, 'Unset gives the track fully rounded ends.')}
        ${this._row('Border',
          html`<input type="checkbox" .checked=${cs.slider_border ?? false}
            @change=${(e: Event) => upd({ slider_border: (e.target as HTMLInputElement).checked || undefined })}
          />`,
          'Draws a border around the track, using the track radius above.')}
        ${cs.slider_border ? html`
          ${this._row('Border color', cp('track-bd', cs.slider_border_color, (v) => upd({ slider_border_color: v })),
            "Colour of the track's border.")}
          ${numRow('Border width (px)', 'slider_border_width', '1', 0)}
        ` : nothing}
        <div class="ec-subsection-title">Slider thumb</div>
        ${this._row('Thumb color', cp('thumb', cs.slider_thumb_color, (v) => upd({ slider_thumb_color: v })),
          'Colour of the moving knob.')}
        ${numRow('Thumb size (px)', 'slider_thumb_size', '16')}
        ${numRow('Thumb width (px)', 'slider_thumb_width', 'thumb size', 1, 'Unset keeps the thumb square-on.')}
        ${numRow('Thumb radius (px)', 'slider_thumb_radius', 'circle', 0, 'Unset keeps the thumb round.')}
        ${numRow('Thumb padding (px)', 'slider_thumb_padding', '0', 0)}
        ${shadowRow('Thumb shadow', 'slider_thumb_shadow', '0 1px 4px rgba(0,0,0,0.5)')}
      ` : nothing}
      ${type === 'dropdown' ? html`
        <div class="ec-subsection-title">Dropdown</div>
        ${this._row('Border', cp('dd-bd', cs.dropdown_border_color, (v) => upd({ dropdown_border_color: v })),
          "Colour of the control's outline.")}
        ${this._csGradientRows(`${idPrefix}-dd-bg`, 'Background', 'dropdown_bg', 'dropdown_bg2', 'dropdown_bg_angle', cs, upd,
          'Fill of the closed control.')}
        ${this._csGradientRows(`${idPrefix}-dd-mbg`, 'Menu background', 'dropdown_menu_bg', 'dropdown_menu_bg2', 'dropdown_menu_bg_angle', cs, upd,
          'Fill of the open dropdown menu.')}
        ${this._row('Menu border', cp('dd-mbd', cs.dropdown_menu_border_color, (v) => upd({ dropdown_menu_border_color: v })),
          "Colour of the open menu's outline.")}
        ${this._csGradientRows(`${idPrefix}-dd-sel`, 'Selected color', 'dropdown_selected_color', 'dropdown_selected_color2', 'dropdown_selected_angle', cs, upd,
          "Highlight behind the option matching the entity's state.")}
        ${numRow('Radius (px)', 'dropdown_radius', '6')}
        ${numRow('Text size (px)', 'dropdown_text_size', '13')}
        <div class="ec-subsection-title">Dropdown menu</div>
        ${numRow('Menu radius (px)', 'dropdown_menu_radius', '8', 0)}
        ${shadowRow('Menu shadow', 'dropdown_menu_shadow', '0 6px 20px rgba(0,0,0,0.5)')}
        ${numRow('Option radius (px)', 'dropdown_option_radius', '5', 0)}
        ${this._row('Option text', cp('dd-otx', cs.dropdown_option_text_color, (v) => upd({ dropdown_option_text_color: v })),
          'Colour of the options in the open menu.')}
        ${this._row('Option hover', cp('dd-ohv', cs.dropdown_option_hover_color, (v) => upd({ dropdown_option_hover_color: v })),
          'Highlight behind the option under the pointer.')}
        <p class="ec-hint">The menu is opaque so it can cover the background image, which is why its
          option text is set here rather than inherited from the card.</p>
      ` : nothing}
      ${type === 'input' ? html`
        <div class="ec-subsection-title">Input</div>
        ${this._row('Border', cp('in-bd', cs.input_border_color, (v) => upd({ input_border_color: v })),
          "Colour of the control's outline.")}
        ${this._csGradientRows(`${idPrefix}-in-bg`, 'Background', 'input_bg', 'input_bg2', 'input_bg_angle', cs, upd,
          'Fill of the input.')}
        ${this._row('Focus color', cp('in-fc', cs.input_focus_color, (v) => upd({ input_focus_color: v })),
          'Outline colour while the input has focus.')}
        ${this._row('Placeholder', cp('in-ph', cs.input_placeholder_color, (v) => upd({ input_placeholder_color: v })),
          'Colour of the prompt text shown while the input is empty.')}
        ${numRow('Radius (px)', 'input_radius', '6')}
        ${numRow('Text size (px)', 'input_text_size', '13')}
      ` : nothing}
      ${type === 'spinbox' ? html`
        <div class="ec-subsection-title">Spin Box</div>
        ${this._row('Border', cp('sp-bd', cs.spinbox_border_color, (v) => upd({ spinbox_border_color: v })),
          "Colour of the control's outline.")}
        ${this._csGradientRows(`${idPrefix}-sp-bg`, 'Button background', 'spinbox_bg', 'spinbox_bg2', 'spinbox_bg_angle', cs, upd,
          "Fill of the spin box's + and − buttons.")}
        ${this._csGradientRows(`${idPrefix}-sp-hv`, 'Button hover', 'spinbox_button_hover_color', 'spinbox_button_hover_color2', 'spinbox_button_hover_angle', cs, upd,
          'Fill of a spin box button under the pointer.')}
        ${numRow('Button width (px)', 'spinbox_button_width', '30')}
        ${numRow('Button glyph size (px)', 'spinbox_button_font_size', '18')}
        ${numRow('Radius (px)', 'spinbox_radius', '7')}
        ${numRow('Text size (px)', 'spinbox_text_size', '13')}
      ` : nothing}
    `;
  }

  private static readonly _CONTROL_DEFAULTS_SECTIONS: NavSectionDef<GlobalDefaults>[] = [
    // gradient_angle lives here rather than on every state screen — one angle
    // themes every gradient on every control (see SELECTOR_STATE_PATHS).
    { key: 'cd:common',    label: 'Common',          hint: 'Accent color — themes every control',        icon: 'mdi:palette',
      paths: pfx('control_style', [...CONTROL_STYLE_PATHS.accent, 'gradient_angle']) },
    { key: 'cd:density',   label: 'Density',         hint: 'Text size, padding and gap for every control', icon: 'mdi:arrow-collapse-vertical',
      paths: ['control_font_size', 'control_padding', 'control_gap'] },
    { key: 'cd:toggle',    label: 'Toggle',          hint: 'On / off colors',                             icon: 'mdi:toggle-switch-outline',
      paths: pfx('control_style', CONTROL_STYLE_PATHS.toggle) },
    { key: 'cd:slider',    label: 'Slider',          hint: 'Track, fill, thumb, height',                  icon: 'mdi:tune-variant',
      paths: pfx('control_style', CONTROL_STYLE_PATHS.slider) },
    { key: 'cd:dropdown',  label: 'Dropdown',        hint: 'Border, background, menu, selected',          icon: 'mdi:form-dropdown',
      paths: pfx('control_style', CONTROL_STYLE_PATHS.dropdown) },
    // Selector and Button are menus into sub:container / active / inactive
    // (+ separation), which own the slots — see _selectorDefaultsDefs.
    { key: 'cd:selector',  label: 'Button Group',    hint: 'Container, active / inactive, separation',    icon: 'mdi:view-dashboard-variant-outline',
      terms: 'selector segmented options option cells row wrap' },
    { key: 'cd:input',     label: 'Input',           hint: 'Border, background, focus',                   icon: 'mdi:form-textbox',
      paths: pfx('control_style', CONTROL_STYLE_PATHS.input) },
    { key: 'cd:spinbox',   label: 'Spin Box',        hint: 'Border, button, hover, width',                icon: 'mdi:numeric',
      paths: pfx('control_style', CONTROL_STYLE_PATHS.spinbox) },
    { key: 'cd:button',    label: 'Button',          hint: 'Container, active / inactive',                icon: 'mdi:gesture-tap-button' },
    { key: 'cd:container', label: 'Container Box',   hint: 'Box behind every control',                    icon: 'mdi:square-rounded-outline', terms: BOX_STYLE_TERMS,
      paths: pfx('control', BOX_STYLE_PATHS) },
    // The variant builder manages `control_variants` on the config root, not an
    // override under `defaults`, so it is outside this scope's reach.
    { key: 'cd:variants',  label: 'Variant Builder', hint: 'Create and manage custom control variants',   icon: 'mdi:shape-plus' },
  ];

  private _controlDefaultsMenu(): TemplateResult {
    return this._navMenu(MosaicCanvasEditor._CONTROL_DEFAULTS_SECTIONS, this._defaultsScope());
  }

  private _controlDefaultsSection(key: string): TemplateResult {
    return html`
      ${this._clearOverridesBtn(
        MosaicCanvasEditor._findDef(MosaicCanvasEditor._CONTROL_DEFAULTS_SECTIONS, key), this._defaultsScope())}
      ${this._controlDefaultsSectionBody(key)}
    `;
  }

  private _controlDefaultsSectionBody(key: string): TemplateResult {
    const d = this._config?.defaults ?? {};
    const cs = d.control_style ?? {};
    const upd = (p: Partial<ControlStyle>): void => this._updateDefaults({ control_style: { ...cs, ...p } });
    if (key === 'cd:container') {
      return html`<div class="ec-section">
        <p class="ec-hint">Box (background, border, radius, shadow) applied behind every control. Per-field <b>Control Style</b> can override it.</p>
        ${this._boxRows('d-ctl-box', d.control ?? {}, (p) => this._updateDefaults({ control: { ...d.control, ...p } }))}
      </div>`;
    }
    if (key === 'cd:common') {
      return html`<div class="ec-section">
        ${this._csGradientRows('d-ctl-accent', 'Accent', 'accent_color', 'accent_color2', 'accent_angle', cs, upd,
          "The colour slider fill, toggle-on, and each control's selected and focus state fall back to.")}
        <p class="ec-hint">Setting an accent gradient themes every surface that falls back to the accent — slider fill, toggle-on, dropdown / button group selected, spin box hover. Borders and focus outlines stay the flat accent color. Each surface stays flat until you tick <b>Gradient</b> on a color of its own.</p>
        <div class="ec-subsection-title">Default gradient angle</div>
        <p class="ec-hint">Used by every control gradient that has no angle of its own. Each <b>Gradient</b> checkbox reveals an angle beside its color — set one there to turn just that surface, or leave it blank to follow this.</p>
        ${this._controlGradientAngleRow(cs, upd)}
      </div>`;
    }
    if (key === 'cd:density') return this._controlDensitySection(d);
    if (key === 'cd:variants') return this._controlVariantsSection();
    const type = key.slice('cd:'.length) as FieldType;
    return html`<div class="ec-section">${this._controlStyleRows('d-ctl', cs, type, upd, false)}</div>`;
  }

  /**
   * Control Defaults ▸ Density (#74 Phase 7).
   *
   * These three are the only global knobs that reach *inside* the controls — the
   * label text, slider readout, track labels, field paddings and every internal
   * gap, none of which has a ControlStyle key. They ship unset on purpose, so the
   * placeholders show the natural size each site keeps until one is entered.
   */
  private _controlDensitySection(d: GlobalDefaults): TemplateResult {
    return html`<div class="ec-section">
      <p class="ec-hint">One set of knobs for how tight or loose <b>every</b> control is. Each sits below the per-field
        and per-card settings, so it can never override something you set on a specific field. Set one and the whole
        control surface scales off it, keeping the proportions — a slider's value readout stays a step smaller than
        its label, two label rows stay tighter than the gap to the control.</p>
      ${this._controlNumRow('Text size (px)', d.control_font_size, 'natural (13)',
        (v) => this._updateDefaults({ control_font_size: v }), 1,
        'Unset keeps each part of a control at its own natural size.')}
      ${this._row('Padding',
        html`<input class="ec-input" type="text" .value=${d.control_padding ?? ''}
          placeholder="natural (5px 8px)"
          @change=${(e: Event) => {
            const v = (e.target as HTMLInputElement).value.trim();
            this._updateDefaults({ control_padding: v || undefined });
          }}
        />`,
        "A full CSS padding value for every control's field box — the input, the dropdown trigger and its options, and each button group or button cell.")}
      ${this._controlNumRow('Gap (px)', d.control_gap, 'natural (4)',
        (v) => this._updateDefaults({ control_gap: v }), 0)}
      <p class="ec-hint">Every gap inside a control is a fixed multiple of this one: label rows sit at half, a control and its label at double.</p>
    </div>`;
  }

  // ── Selector / Button defaults: Field Container · states · separation ────────

  /**
   * Selector / Button defaults drill-down defs, GlobalDefaults-relative.
   *
   * Buttons have no Option Separation (a single cell has nothing to separate
   * from), and `sub:container` is the one screen spanning two containers: the
   * ControlStyle sizes plus the OptionLayout placement rows, which live under a
   * per-type key so styling a selector can never bleed into a button.
   */
  private static _selectorDefaultsDefs(isButton: boolean): NavSectionDef<GlobalDefaults>[] {
    const k = isButton ? 'btn' : 'sel';
    const olKey = isButton ? 'button_option_layout' : 'option_layout';
    const states: NavSectionDef<GlobalDefaults>[] = [
      { key: 'sub:container', label: 'Field Container', hint: 'Sizes, placement, text',               icon: 'mdi:card-outline',
        paths: [
          ...pfx('control_style', SELECTOR_STATE_PATHS['sub:container'][k]),
          ...pfx(olKey, OPTION_LAYOUT_PATHS),
        ] },
      { key: 'sub:active',    label: 'Active State',    hint: 'Colors when the option is active',     icon: 'mdi:circle-slice-8',
        paths: pfx('control_style', SELECTOR_STATE_PATHS['sub:active'][k]) },
      { key: 'sub:inactive',  label: 'Inactive State',  hint: 'Colors when the option is inactive',   icon: 'mdi:circle-outline',
        paths: pfx('control_style', SELECTOR_STATE_PATHS['sub:inactive'][k]) },
    ];
    if (isButton) return states;
    return [...states, { key: 'sub:separation', label: 'Option Separation', hint: 'Frame border, gap, per-option style', icon: 'mdi:dots-grid',
      paths: pfx('control_style', OPTION_SEPARATION_PATHS) }];
  }

  private _selectorDefaultsMenu(key: string): TemplateResult {
    return this._navMenu(MosaicCanvasEditor._selectorDefaultsDefs(key === 'cd:button'), this._defaultsScope());
  }

  private _selectorDefaultsSection(typeKey: string, sub: string): TemplateResult {
    return html`
      ${this._clearOverridesBtn(
        MosaicCanvasEditor._findDef(
          MosaicCanvasEditor._selectorDefaultsDefs(typeKey === 'cd:button'), sub),
        this._defaultsScope())}
      ${this._selectorDefaultsSectionBody(typeKey, sub)}
    `;
  }

  private _selectorDefaultsSectionBody(typeKey: string, sub: string): TemplateResult {
    const d = this._config?.defaults ?? {};
    const cs = d.control_style ?? {};
    const upd = (p: Partial<ControlStyle>): void => this._updateDefaults({ control_style: { ...cs, ...p } });
    const isButton = typeKey === 'cd:button';

    if (sub === 'sub:separation') {
      return html`<div class="ec-section">${this._optionSeparationRows(cs, upd)}</div>`;
    }

    if (sub === 'sub:active' || sub === 'sub:inactive') {
      return html`<div class="ec-section">${this._selectorStateRows('d-ctl', cs, upd, sub, isButton)}</div>`;
    }

    // Field Container: sizes + option placement/text. The frame border lives in
    // Option Separation (it's the segmented-row outline); the box behind the
    // control lives in the shared "Container Box" section. A button has no
    // separation section, so its border and padding belong here instead.
    // Selector and Button each get their own OptionLayout object so this screen's
    // placement/text settings can never bleed from one control type into the other.
    const ol = (isButton ? d.button_option_layout : d.option_layout) ?? {};
    const olUpd = (p: Partial<OptionLayout>): void => this._updateDefaults(
      isButton ? { button_option_layout: { ...ol, ...p } } : { option_layout: { ...ol, ...p } },
    );
    return html`<div class="ec-section">
      ${this._selectorStateRows('d-ctl', cs, upd, 'sub:container', isButton)}
      <div class="ec-subsection-title">Placement &amp; text</div>
      ${this._optionLayoutRows(ol, olUpd, 'd-ol')}
    </div>`;
  }

  // ── Control variant builder (custom variants stored in the card config) ──────

  /**
   * Options for a field's Variant dropdown. Bundled and custom variants are
   * split into optgroups only when customs exist, so cards without any custom
   * variants look exactly as they did before.
   */
  private _variantOptions(type: FieldType, current: string | undefined): TemplateResult {
    const opt = (v: ControlVariant): TemplateResult =>
      html`<option value=${v.id} .selected=${current === v.id}>${v.label}</option>`;
    const custom = userVariants(type);
    if (!custom.length) return html`${getVariants(type).map(opt)}`;
    return html`
      <optgroup label="Built-in">${bundledVariants(type).map(opt)}</optgroup>
      <optgroup label="Custom">${custom.map(opt)}</optgroup>
    `;
  }

  /** Write a mutated variant list for one control type back into the card config. */
  private _updateVariants(type: FieldType, mutate: (list: ControlVariant[]) => ControlVariant[]): void {
    const reg = this._config?.defaults?.control_variants ?? {};
    const next: ControlVariantRegistry = { ...reg, [type]: mutate([...(reg[type] ?? [])]) };
    // Drop empty type keys so the stored blob stays as small as possible.
    for (const k of Object.keys(next) as FieldType[]) if (!next[k]?.length) delete next[k];
    const value = Object.keys(next).length ? next : undefined;
    this._updateDefaults({ control_variants: value });
    // Apply immediately too — the config round-trip through HA is not synchronous,
    // and the Variant dropdowns read from the registry on this same render.
    setUserVariants(value);
  }

  private _controlVariantsSection(): TemplateResult {
    const reg = this._config?.defaults?.control_variants ?? {};
    const types = CONTROL_FIELD_TYPES.filter((t) => (reg[t] ?? []).length > 0);
    const total = types.reduce((n, t) => n + (reg[t]?.length ?? 0), 0);
    return html`
      <div class="ec-section">
        <p class="ec-hint">
          Custom variants are stored in <b>this card's configuration</b>, not in the Mosaic bundle — so
          installing a release that updates the built-in variants can never overwrite them. To reuse them on
          another card, use <b>Templates ▸ Export / Import Control Variants</b>.
        </p>
        <p class="ec-hint">
          To create one: configure a control field until it behaves the way you want, then use
          <b>Save as Variant</b> in that field's <b>Entity &amp; Action</b> section — or its
          <b>Variant</b> section, for a button group with manual options. If the field is already on a
          custom variant, the same panel can update it in place.
        </p>
        ${total === 0
          ? html`<p class="ec-empty">No custom variants yet.</p>`
          : types.map((t) => html`
              <div class="ec-subsection-title">${FIELD_TYPE_LABELS[t]}</div>
              ${(reg[t] ?? []).map((v, idx) => this._variantRow(t, v, idx))}
            `)}
      </div>
    `;
  }

  private _variantRow(type: FieldType, v: ControlVariant, idx: number): TemplateResult {
    const key = `${type}:${v.id}`;
    const open = this._variantOpen === key;
    const upd = (p: Partial<ControlVariant>): void =>
      this._updateVariants(type, (l) => l.map((x, i) => (i === idx ? { ...x, ...p } : x)));
    const keyCount = Object.keys(v.preset ?? {}).length;
    return html`
      <div class="ec-list-row" style="flex-direction:column;align-items:stretch;gap:6px;">
        <div style="display:flex;align-items:center;gap:6px;">
          <ha-icon icon=${v.icon || FIELD_TYPE_ICONS[type]}></ha-icon>
          <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${v.label}</span>
          <span style="font-size:11px;opacity:0.55;white-space:nowrap;">${keyCount} key${keyCount === 1 ? '' : 's'}</span>
          <button class="ec-btn-add" style="padding:2px 8px;"
            @click=${() => { this._variantOpen = open ? '' : key; this._variantError = ''; }}
          >${open ? 'Close' : 'Edit'}</button>
          <button class="ec-btn-add" style="padding:2px 8px;" title="Duplicate"
            @click=${() => {
              const id = uniqueVariantId(type, `${v.id}_copy`);
              this._updateVariants(type, (l) => [...l, { ...v, id, label: `${v.label} (copy)` }]);
              this._variantOpen = `${type}:${id}`;
            }}
          >⧉</button>
          <button class="ec-btn-remove" title="Delete"
            @click=${() => {
              if (!window.confirm(`Delete variant "${v.label}"?\n\nFields already using it keep their current settings — they just lose the link to this variant.`)) return;
              this._updateVariants(type, (l) => l.filter((_, i) => i !== idx));
            }}
          >✕</button>
        </div>
        ${open ? html`
          ${this._row('Label',
            html`<input class="ec-input" type="text" .value=${v.label}
              @change=${(e: Event) => {
                const t = (e.target as HTMLInputElement).value.trim();
                if (t) upd({ label: t }); else (e.target as HTMLInputElement).value = v.label;
              }} />`)}
          ${this._row('Icon', this._iconPicker(v.icon, (i) => upd({ icon: i }), FIELD_TYPE_ICONS[type]))}
          ${this._row('Id', html`<span class="ec-input" style="opacity:0.6;">${v.id}</span>`)}
          <p class="ec-hint">The id is fixed after creation — fields store it to remember which variant they use. Rename the <b>Label</b> instead; that's what the Variant dropdown shows.</p>
          ${this._row('Domains',
            html`<input class="ec-input" type="text" placeholder="light, switch — blank for any" .value=${(v.domain ?? []).join(', ')}
              @change=${(e: Event) => {
                const list = (e.target as HTMLInputElement).value.split(',').map((s) => s.trim()).filter(Boolean);
                upd({ domain: list.length ? list : undefined });
              }} />`)}
          <div class="ec-subsection-title">Preset</div>
          <p class="ec-hint">Captured from the field this variant was saved from. Richer settings (labels, track labels, option lists) are easiest to author on a real field and re-capture with <b>Save as Variant</b>; this JSON is the escape hatch.</p>
          <textarea class="ec-input" rows="8" spellcheck="false"
            style="font-family:ui-monospace,monospace;font-size:11px;line-height:1.4;resize:vertical;"
            .value=${JSON.stringify(v.preset ?? {}, null, 2)}
            @change=${(e: Event) => {
              const raw = (e.target as HTMLTextAreaElement).value.trim();
              try {
                const parsed: unknown = raw ? JSON.parse(raw) : {};
                if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                  throw new Error('Preset must be a JSON object.');
                }
                const unknown = Object.keys(parsed).filter((k) => !(MANAGED_KEYS as string[]).includes(k));
                if (unknown.length) throw new Error(`Not preset keys: ${unknown.join(', ')}`);
                this._variantError = '';
                upd({ preset: Object.keys(parsed).length ? (parsed as Partial<FieldConfig>) : undefined });
              } catch (err) {
                this._variantError = err instanceof Error ? err.message : 'Invalid JSON.';
              }
            }}
          ></textarea>
          ${this._variantError ? html`<p style="color:#f44;font-size:12px;margin:6px 0 0;">${this._variantError}</p>` : nothing}
        ` : nothing}
      </div>
    `;
  }

  /** Using global = no control_style at all, or one holding nothing but the
   *  separation keys (which the Control Style panel does not own) — unless the
   *  user has toggled override intent on this session (_colorOverridesOn).
   *  Shared by the Control Style menu and the search index (#61), so search
   *  only offers the Field Container / state screens the menu offers. */
  private _controlStyleUsesGlobal(field: FieldConfig, id: string): boolean {
    const cs = field.control_style;
    const kept = MosaicCanvasEditor._separationOnly(cs);
    return cs === undefined
      || (!this._colorOverridesOn.has(id)
          && kept !== undefined
          && Object.keys(cs).length === Object.keys(kept).length);
  }

  /**
   * The per-field mirror of `_selectorDefaultsDefs`, FieldConfig-relative.
   *
   * Unlike the global version this has no OptionLayout rows on `fscs:container`
   * — a field's option layout is its own `optlayout` screen under Options — and
   * no separation screen, since a field edits separation there too.
   */
  private static _fscsDefs(isButton: boolean): NavSectionDef<FieldConfig>[] {
    const k = isButton ? 'btn' : 'sel';
    return [
      { key: 'fscs:container', label: 'Field Container', hint: 'Border, radius, font sizes',          icon: 'mdi:card-outline',
        paths: pfx('control_style', MosaicCanvasEditor._containerPathsForField(k)) },
      { key: 'fscs:active',    label: 'Active State',    hint: 'Colors when the option is active',    icon: 'mdi:circle-slice-8',
        paths: pfx('control_style', SELECTOR_STATE_PATHS['sub:active'][k]) },
      { key: 'fscs:inactive',  label: 'Inactive State',  hint: 'Colors when the option is inactive',  icon: 'mdi:circle-outline',
        paths: pfx('control_style', SELECTOR_STATE_PATHS['sub:inactive'][k]) },
    ];
  }

  private _fieldSecControlStyle(ci: number, fi: number, field: FieldConfig, isExtended = false): TemplateResult {
    const updField = this._updFor(ci, fi, isExtended);
    const id = this._idFor(ci, fi, isExtended);
    const cs = field.control_style;
    const upd = (p: Partial<ControlStyle>) => updField({ control_style: { ...field.control_style, ...p } });
    // Separation is edited in Options / Button Layout, not here, so reverting to
    // the global *colour* style must not silently discard it.
    const kept = MosaicCanvasEditor._separationOnly(cs);
    const usingGlobal = this._controlStyleUsesGlobal(field, id);
    // Selector and Button drill into Field Container / Active / Inactive, mirroring
    // global defaults; every other control type keeps the flat row list.
    const hasStateSplit = field.type === 'button_group' || field.type === 'button';
    return html`
      <div class="ec-section">
        ${this._row('Use global control style',
          html`<input type="checkbox" .checked=${usingGlobal}
            @change=${(e: Event) => {
              if ((e.target as HTMLInputElement).checked) {
                // Drop the colour overrides, keep separation.
                this._colorOverridesOn.delete(id);
                updField({ control_style: kept });
              } else {
                // Remember the intent to override even before any colour is set,
                // so an otherwise-empty control_style doesn't read as "global".
                this._colorOverridesOn.add(id);
                updField({ control_style: { ...(cs ?? {}) } });
              }
              this.requestUpdate();
            }}
          />`)}
        <p class="ec-hint">Ticked, this control's colours follow <b>Settings ▸ Global Defaults ▸ Control
          Default</b>. Option separation is set in <b>Options</b> and is kept either way.</p>
        ${!usingGlobal ? (hasStateSplit ? this._navMenu(
            MosaicCanvasEditor._fscsDefs(field.type === 'button'),
            this._fieldScope(ci, fi, isExtended)) : html`
          <div class="ec-subsection-title">Color overrides</div>
          ${this._controlStyleRows(`${id}-ctl`, cs ?? {}, field.type, upd)}
        `) : nothing}
        <div class="ec-subsection-title">Container box</div>
        ${this._row('Override container',
          html`<input type="checkbox" .checked=${field.control_box !== undefined}
            @change=${(e: Event) => updField({ control_box: (e.target as HTMLInputElement).checked ? {} : undefined })}
          />`,
          'Gives this control its own box, instead of the one in Control Default ▸ Container Box.')}
        ${field.control_box !== undefined
          ? this._boxRows(`${id}-ctlbox`, field.control_box, (p) => updField({ control_box: { ...field.control_box, ...p } }), FIELD_CONTAINER_SHOWS_CSS)
          : nothing}
        ${this._cssRow(field.extra_css, (v) => updField({ extra_css: v }))}
      </div>
    `;
  }

  /** Field Container / Active / Inactive sub-page for a selector or button field's Control Style. */
  private _fieldControlStyleStateSection(ci: number, fi: number, field: FieldConfig, key: string, isExtended = false): TemplateResult {
    const updField = this._updFor(ci, fi, isExtended);
    const id = this._idFor(ci, fi, isExtended);
    const cs = field.control_style ?? {};
    const upd = (p: Partial<ControlStyle>) => updField({ control_style: { ...field.control_style, ...p } });
    const sub = key === 'fscs:active' ? 'sub:active' : key === 'fscs:inactive' ? 'sub:inactive' : 'sub:container';
    return html`
      ${this._clearOverridesBtn(
        MosaicCanvasEditor._findDef(MosaicCanvasEditor._fscsDefs(field.type === 'button'), key),
        this._fieldScope(ci, fi, isExtended))}
      <div class="ec-section">${this._selectorStateRows(`${id}-ctl`, cs, upd, sub, field.type === 'button')}</div>
    `;
  }

  private _defaultsSecLayout(): TemplateResult {
    const d = this._config?.defaults ?? {};
    return html`
      <div class="ec-section">
          ${this._row('Power unit',
            html`<select class="ec-select"
              .value=${d.power_unit ?? ''}
              @change=${(e: Event) => {
                const v = (e.target as HTMLSelectElement).value;
                this._updateDefaults({ power_unit: (v as 'W' | 'kW') || undefined });
              }}
            >
              <option value=""   .selected=${!d.power_unit}>Auto (W / kW)</option>
              <option value="W"  .selected=${d.power_unit === 'W'}>Always W</option>
              <option value="kW" .selected=${d.power_unit === 'kW'}>Always kW</option>
            </select>`,
            'Whether power values are shown in watts, kilowatts, or switched automatically as they grow.')}

          ${this._numRow('Graph refresh (min)', { value: d.stat_update_interval, onChange: (v) => this._updateDefaults({ stat_update_interval: v }), min: 1, max: 60, placeholder: '5',
            hint: 'How often every graph, gauge and statistic value on this dashboard re-queries Home Assistant. A single graph can set its own on its Graph Settings screen. Nothing polls while the card is off-screen or its tab is in the background.' })}

          ${this._row('Font family',
            html`<input class="ec-input" type="text" .value=${d.font_family ?? ''}
              placeholder="inherit"
              @change=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                this._updateDefaults({ font_family: v === '' ? undefined : v });
              }}
            />`,
            'A CSS font stack for every text on the card. Unset follows the dashboard theme.')}

          ${this._row('Font family – monospace',
            html`<input class="ec-input" type="text" .value=${d.mono_font_family ?? ''}
              placeholder="'Courier New', monospace"
              @change=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                this._updateDefaults({ mono_font_family: v === '' ? undefined : v });
              }}
            />`,
            'A CSS font stack for fixed-width text.')}
          <p class="ec-hint">Only used where a fixed-width font is required (e.g. numeric counters, timers).</p>

          <p class="ec-hint">Field spacing is not here: every card type owns its own. A Mosaic card's gaps and field
            placement are on <b>Mosaic Card Defaults</b>, a popover's on <b>Popover Card Defaults</b>, and an
            embedded card has no fields of its own to space.</p>
      </div>
    `;
  }

  // Each screen's `paths` include the per-type "Additional CSS" row that
  // _elemLibSection appends below the content — see ELEM_CSS_KEY, whose values
  // are exactly the `extra_css` entry of each list below.
  private static readonly _ELEM_LIB_SECTIONS: NavSectionDef<GlobalDefaults>[] = [
    { key: 'el:thermo-v',   label: 'Thermometer (Vertical)',   hint: 'Ticks, grid, fill, temperature text', icon: 'mdi:thermometer', terms: THERMO_TERMS,
      paths: keyed('thermo_', THERMO_LIB_SUFFIXES) },
    { key: 'el:thermo-h',   label: 'Thermometer (Horizontal)', hint: 'Ticks, grid, fill, temperature text', icon: 'mdi:thermometer', terms: THERMO_TERMS,
      paths: keyed('thermo_h_', THERMO_LIB_SUFFIXES) },
    { key: 'el:bat-h',      label: 'Battery (Horizontal)',     hint: 'Fill & gradient',                     icon: 'mdi:battery',
      paths: keyed('battery_h_', BATTERY_LIB_SUFFIXES) },
    { key: 'el:bat-v',      label: 'Battery (Vertical)',       hint: 'Fill & gradient',                     icon: 'mdi:battery',
      paths: keyed('battery_v_', BATTERY_LIB_SUFFIXES) },
    { key: 'el:tank-cyl',   label: 'Tank (Cylinder)',          hint: 'Fill, direction, wall',               icon: 'mdi:barrel',
      paths: keyed('tank_cylinder_', TANK_LIB_SUFFIXES) },
    { key: 'el:tank-water', label: 'Tank - Water',             hint: 'Fill, direction, wall',               icon: 'mdi:water',
      paths: keyed('tank_water_', TANK_LIB_SUFFIXES) },
    { key: 'el:tank-ferm',  label: 'Tank - Fermenter',         hint: 'Fill, direction, wall',               icon: 'mdi:flask-outline',
      paths: keyed('tank_fermenter_', TANK_LIB_SUFFIXES) },
    { key: 'el:tank-cone',  label: 'Tank - Cone',              hint: 'Fill, direction, wall',               icon: 'mdi:triangle-outline',
      paths: keyed('tank_cone_', TANK_LIB_SUFFIXES) },
    { key: 'el:inverter',   label: 'Inverter',                 hint: 'Line color',                          icon: 'mdi:sine-wave',
      paths: ['inverter_line_color', 'inverter_extra_css'] },
    { key: 'el:gauge-arc',  label: 'Gauge (Arc)',              hint: 'Needle, label color & size',          icon: 'mdi:speedometer',
      paths: ['gauge_arc_needle_color', 'gauge_arc_label_color', 'gauge_arc_label_size', 'gauge_arc_extra_css'] },
  ];

  private _elemLibMenu(): TemplateResult {
    const items = MosaicCanvasEditor._ELEM_LIB_SECTIONS;
    const q = this._currentListFilter();
    const root = this._config?.defaults;
    return html`
      ${this._listFilterBox(items.length)}
      ${items
        .filter((d) => !q || d.label.toLowerCase().includes(q))
        .map((d) => this._navBtn(d.key, d.label, d.hint, d.icon, countOverrides(root, d.paths)))}
    `;
  }

  /** GlobalDefaults per-element-type "Additional CSS" key for each library section. */
  private static readonly ELEM_CSS_KEY: Record<string, keyof GlobalDefaults> = {
    'el:thermo-v':   'thermo_extra_css',
    'el:thermo-h':   'thermo_h_extra_css',
    'el:bat-h':      'battery_h_extra_css',
    'el:bat-v':      'battery_v_extra_css',
    'el:tank-cyl':   'tank_cylinder_extra_css',
    'el:tank-water': 'tank_water_extra_css',
    'el:tank-ferm':  'tank_fermenter_extra_css',
    'el:tank-cone':  'tank_cone_extra_css',
    'el:inverter':   'inverter_extra_css',
    'el:gauge-arc':  'gauge_arc_extra_css',
  };

  private _elemLibSection(key: string): TemplateResult {
    let content: TemplateResult;
    switch (key) {
      case 'el:thermo-v':   content = this._elemThermoV();   break;
      case 'el:thermo-h':   content = this._elemThermoH();   break;
      case 'el:bat-h':      content = this._elemBatH();      break;
      case 'el:bat-v':      content = this._elemBatV();      break;
      case 'el:tank-cyl':   content = this._elemTankCyl();   break;
      case 'el:tank-water': content = this._elemTankWater(); break;
      case 'el:tank-ferm':  content = this._elemTankFerm();  break;
      case 'el:tank-cone':  content = this._elemTankCone();  break;
      case 'el:inverter':   content = this._elemInverter();  break;
      case 'el:gauge-arc':  content = this._elemGaugeArc();  break;
      default:              return html``;
    }
    const cssKey = MosaicCanvasEditor.ELEM_CSS_KEY[key];
    const d = this._config?.defaults ?? {};
    return html`
      ${this._clearOverridesBtn(
        MosaicCanvasEditor._findDef(MosaicCanvasEditor._ELEM_LIB_SECTIONS, key), this._defaultsScope())}
      ${content}
      <div class="ec-section">
        ${this._cssRow(d[cssKey] as string | undefined, (v) => this._updateDefaults({ [cssKey]: v } as Partial<GlobalDefaults>))}
      </div>`;
  }

  private _elemThermoV(): TemplateResult {
    const d = this._config?.defaults ?? {};
    return html`
      <div class="ec-section">
              <div class="ec-subsection-title">…– ticks</div>
              ${this._row('Tick color',
                this._colorPicker('d-thermo-tc', d.thermo_tick_color, (v) => this._updateDefaults({ thermo_tick_color: v || undefined })), THERMO_HINTS.tick_color)}
              ${this._row('Tick position',
                html`<select class="ec-select"
                  .value=${d.thermo_text_position ?? sd('thermo_text_position') ?? 'right'}
                  @change=${(e: Event) => this._updateDefaults({ thermo_text_position: (e.target as HTMLSelectElement).value as 'left' | 'right' | 'both' })}
                >
                  ${(['right','left','both'] as const).map((s) => html`<option value=${s} .selected=${(d.thermo_text_position ?? sd('thermo_text_position') ?? 'right') === s}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`)}
                </select>`, THERMO_HINTS.tick_position)}
              ${this._row('Minor tick text',
                html`<input type="checkbox" class="ec-checkbox"
                  .checked=${d.thermo_show_minor_tick_text ?? sd('thermo_show_minor_tick_text') ?? false}
                  @change=${(e: Event) => this._updateDefaults({ thermo_show_minor_tick_text: (e.target as HTMLInputElement).checked })} />`, THERMO_HINTS.minor_tick_text)}
              ${this._numRow('Tick font size', { hint: THERMO_HINTS.tick_font_size, value: d.thermo_tick_font_size, onChange: (v) => this._updateDefaults({ thermo_tick_font_size: v }), min: 1, max: 20, step: 0.5, placeholder: '4' })}
              ${this._numRow('Major tick length', { value: d.thermo_major_tick_length, onChange: (v) => this._updateDefaults({ thermo_major_tick_length: v }), min: 0.5, max: 20, step: 0.5, placeholder: 'auto (from SVG)' })}
              ${this._numRow('Major tick thickness', { value: d.thermo_major_tick_width, onChange: (v) => this._updateDefaults({ thermo_major_tick_width: v }), min: 0.1, max: 5, step: 0.05, placeholder: 'auto (from SVG)' })}
              ${this._numRow('Minor tick length', { value: d.thermo_minor_tick_length, onChange: (v) => this._updateDefaults({ thermo_minor_tick_length: v }), min: 0.5, max: 20, step: 0.5, placeholder: 'auto (from SVG)' })}
              ${this._numRow('Minor tick thickness', { value: d.thermo_minor_tick_width, onChange: (v) => this._updateDefaults({ thermo_minor_tick_width: v }), min: 0.1, max: 5, step: 0.05, placeholder: 'auto (from SVG)' })}
              ${this._row('Grid line color',
                this._colorPicker('d-thermo-gc', d.thermo_grid_color, (v) => this._updateDefaults({ thermo_grid_color: v || undefined })), THERMO_HINTS.grid_color)}
              <div class="ec-subsection-title">Fill &amp; temperature</div>
              ${this._numRow('Above temperature transparency', { value: d.thermo_fill_opacity_above, onChange: (v) => this._updateDefaults({ thermo_fill_opacity_above: v }), min: 0, max: 1, step: 0.05, placeholder: '0.5' })}
              <p class="ec-hint">How visible the tube is above the current reading — 0 hides the empty part
                entirely, 1 draws it in full.</p>
              ${this._numRow('Decimals', { hint: THERMO_HINTS.decimals, value: d.thermo_decimals, onChange: (v) => this._updateDefaults({ thermo_decimals: v }), min: 0, max: 4, step: 1, placeholder: '1' })}
              ${this._row('Temperature value color',
                this._colorPicker('d-thermo-ttc', d.thermo_temp_color, (v) => this._updateDefaults({ thermo_temp_color: v || undefined })), THERMO_HINTS.temp_color)}
              ${this._numRow('Temperature value size', { value: d.thermo_temp_font_size, onChange: (v) => this._updateDefaults({ thermo_temp_font_size: v }), min: 4, max: 30, step: 0.5, placeholder: '10' })}
              ${this._libFillRows('d-thermo-fc', 'thermo')}
      </div>
    `;
  }

  private _elemThermoH(): TemplateResult {
    // Every property on this screen writes a thermo_h_* key, independent of the
    // Thermometer (Vertical) screen's thermo_* keys — see #23.
    const d = this._config?.defaults ?? {};
    return html`
      <div class="ec-section">
              <div class="ec-subsection-title">…– ticks</div>
              ${this._row('Tick color',
                this._colorPicker('d-thermo-h-tc', d.thermo_h_tick_color, (v) => this._updateDefaults({ thermo_h_tick_color: v || undefined })), THERMO_HINTS.tick_color)}
              ${this._row('Tick position',
                html`<select class="ec-select"
                  .value=${d.thermo_h_text_position ?? sd('thermo_h_text_position') ?? 'right'}
                  @change=${(e: Event) => this._updateDefaults({ thermo_h_text_position: (e.target as HTMLSelectElement).value as 'left' | 'right' | 'both' })}
                >
                  ${(['right','left','both'] as const).map((s) => html`<option value=${s} .selected=${(d.thermo_h_text_position ?? sd('thermo_h_text_position') ?? 'right') === s}>${({ right: 'Bottom', left: 'Top', both: 'Both' } as Record<string,string>)[s]}</option>`)}
                </select>`, THERMO_HINTS.tick_position)}
              ${this._row('Minor tick text',
                html`<input type="checkbox" class="ec-checkbox"
                  .checked=${d.thermo_h_show_minor_tick_text ?? sd('thermo_h_show_minor_tick_text') ?? false}
                  @change=${(e: Event) => this._updateDefaults({ thermo_h_show_minor_tick_text: (e.target as HTMLInputElement).checked })} />`, THERMO_HINTS.minor_tick_text)}
              ${this._numRow('Tick font size', { hint: THERMO_HINTS.tick_font_size, value: d.thermo_h_tick_font_size, onChange: (v) => this._updateDefaults({ thermo_h_tick_font_size: v }), min: 1, max: 20, step: 0.5, placeholder: '4' })}
              ${this._numRow('Major tick length', { value: d.thermo_h_major_tick_length, onChange: (v) => this._updateDefaults({ thermo_h_major_tick_length: v }), min: 0.5, max: 20, step: 0.5, placeholder: 'auto (from SVG)' })}
              ${this._numRow('Major tick thickness', { value: d.thermo_h_major_tick_width, onChange: (v) => this._updateDefaults({ thermo_h_major_tick_width: v }), min: 0.1, max: 5, step: 0.05, placeholder: 'auto (from SVG)' })}
              ${this._numRow('Minor tick length', { value: d.thermo_h_minor_tick_length, onChange: (v) => this._updateDefaults({ thermo_h_minor_tick_length: v }), min: 0.5, max: 20, step: 0.5, placeholder: 'auto (from SVG)' })}
              ${this._numRow('Minor tick thickness', { value: d.thermo_h_minor_tick_width, onChange: (v) => this._updateDefaults({ thermo_h_minor_tick_width: v }), min: 0.1, max: 5, step: 0.05, placeholder: 'auto (from SVG)' })}
              ${this._row('Grid line color',
                this._colorPicker('d-thermo-h-gc', d.thermo_h_grid_color, (v) => this._updateDefaults({ thermo_h_grid_color: v || undefined })), THERMO_HINTS.grid_color)}
              <div class="ec-subsection-title">Fill &amp; temperature</div>
              ${this._numRow('Above temperature transparency', { value: d.thermo_h_fill_opacity_above, onChange: (v) => this._updateDefaults({ thermo_h_fill_opacity_above: v }), min: 0, max: 1, step: 0.05, placeholder: '0.5' })}
              <p class="ec-hint">How visible the tube is above the current reading — 0 hides the empty part
                entirely, 1 draws it in full.</p>
              ${this._numRow('Decimals', { hint: THERMO_HINTS.decimals, value: d.thermo_h_decimals, onChange: (v) => this._updateDefaults({ thermo_h_decimals: v }), min: 0, max: 4, step: 1, placeholder: '1' })}
              ${this._row('Temperature value color',
                this._colorPicker('d-thermo-h-ttc', d.thermo_h_temp_color, (v) => this._updateDefaults({ thermo_h_temp_color: v || undefined })), THERMO_HINTS.temp_color)}
              ${this._numRow('Temperature value size', { value: d.thermo_h_temp_font_size, onChange: (v) => this._updateDefaults({ thermo_h_temp_font_size: v }), min: 4, max: 30, step: 0.5, placeholder: '10' })}
              ${this._libFillRows('d-thermo-h-fc', 'thermo_h')}
      </div>
    `;
  }

  private _elemBatH(): TemplateResult {
    return html`
      <div class="ec-section">
              ${this._libFillRows('d-bh-fc', 'battery_h')}
      </div>
    `;
  }

  private _elemBatV(): TemplateResult {
    return html`
      <div class="ec-section">
              ${this._libFillRows('d-bv-fc', 'battery_v')}
      </div>
    `;
  }

  private _elemTankCyl(): TemplateResult {
    const d = this._config?.defaults ?? {};
    return html`
      <div class="ec-section">
              ${this._libFillRows('d-tc-fc', 'tank_cylinder')}
              ${this._row('Fill direction',
                html`<select class="ec-select"
                  .value=${d.tank_cylinder_fill_direction ?? 'up'}
                  @change=${(e: Event) => this._updateDefaults({ tank_cylinder_fill_direction: (e.target as HTMLSelectElement).value })}>
                  <option value="up">Up</option>
                  <option value="down">Down</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>`)}
              ${this._row('Tank wall color',
                d.tank_cylinder_tank_color
                  ? html`${this._colorPicker('d-tc-wc', d.tank_cylinder_tank_color, (v) => this._updateDefaults({ tank_cylinder_tank_color: v || undefined }), { clearTitle: 'Remove (use SVG default)', onClear: () => this._updateDefaults({ tank_cylinder_tank_color: undefined }) })}`
                  : html`<button class="ec-lib-browse-btn" style="font-size:12px" @click=${() => this._updateDefaults({ tank_cylinder_tank_color: '#808080' })}>+ Set wall color</button>`)}
      </div>
    `;
  }

  private _elemTankWater(): TemplateResult {
    const d = this._config?.defaults ?? {};
    return html`
      <div class="ec-section">
              ${this._libFillRows('d-tw-fc', 'tank_water')}
              ${this._row('Fill direction',
                html`<select class="ec-select"
                  .value=${d.tank_water_fill_direction ?? 'up'}
                  @change=${(e: Event) => this._updateDefaults({ tank_water_fill_direction: (e.target as HTMLSelectElement).value })}>
                  <option value="up">Up</option>
                  <option value="down">Down</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>`)}
              ${this._row('Tank wall color',
                d.tank_water_tank_color
                  ? html`${this._colorPicker('d-tw-wc', d.tank_water_tank_color, (v) => this._updateDefaults({ tank_water_tank_color: v || undefined }), { clearTitle: 'Remove (use SVG default)', onClear: () => this._updateDefaults({ tank_water_tank_color: undefined }) })}`
                  : html`<button class="ec-lib-browse-btn" style="font-size:12px" @click=${() => this._updateDefaults({ tank_water_tank_color: '#808080' })}>+ Set wall color</button>`)}
      </div>
    `;
  }

  private _elemTankFerm(): TemplateResult {
    const d = this._config?.defaults ?? {};
    return html`
      <div class="ec-section">
              ${this._libFillRows('d-tf-fc', 'tank_fermenter')}
              ${this._row('Fill direction',
                html`<select class="ec-select"
                  .value=${d.tank_fermenter_fill_direction ?? 'up'}
                  @change=${(e: Event) => this._updateDefaults({ tank_fermenter_fill_direction: (e.target as HTMLSelectElement).value })}>
                  <option value="up">Up</option>
                  <option value="down">Down</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>`)}
              ${this._row('Tank wall color',
                d.tank_fermenter_tank_color
                  ? html`${this._colorPicker('d-tf-wc', d.tank_fermenter_tank_color, (v) => this._updateDefaults({ tank_fermenter_tank_color: v || undefined }), { clearTitle: 'Remove (use SVG default)', onClear: () => this._updateDefaults({ tank_fermenter_tank_color: undefined }) })}`
                  : html`<button class="ec-lib-browse-btn" style="font-size:12px" @click=${() => this._updateDefaults({ tank_fermenter_tank_color: '#808080' })}>+ Set wall color</button>`)}
      </div>
    `;
  }

  private _elemTankCone(): TemplateResult {
    const d = this._config?.defaults ?? {};
    return html`
      <div class="ec-section">
              ${this._libFillRows('d-tn-fc', 'tank_cone')}
              ${this._row('Fill direction',
                html`<select class="ec-select"
                  .value=${d.tank_cone_fill_direction ?? 'up'}
                  @change=${(e: Event) => this._updateDefaults({ tank_cone_fill_direction: (e.target as HTMLSelectElement).value })}>
                  <option value="up">Up</option>
                  <option value="down">Down</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>`)}
              ${this._row('Tank wall color',
                d.tank_cone_tank_color
                  ? html`${this._colorPicker('d-tn-wc', d.tank_cone_tank_color, (v) => this._updateDefaults({ tank_cone_tank_color: v || undefined }), { clearTitle: 'Remove (use SVG default)', onClear: () => this._updateDefaults({ tank_cone_tank_color: undefined }) })}`
                  : html`<button class="ec-lib-browse-btn" style="font-size:12px" @click=${() => this._updateDefaults({ tank_cone_tank_color: '#808080' })}>+ Set wall color</button>`)}
      </div>
    `;
  }

  private _elemInverter(): TemplateResult {
    const d = this._config?.defaults ?? {};
    return html`
      <div class="ec-section">
              ${this._row('Line color',
                this._colorPicker('d-inv-lc', d.inverter_line_color, (v) => this._updateDefaults({ inverter_line_color: v || undefined })))}
      </div>
    `;
  }

  private _elemGaugeArc(): TemplateResult {
    const d = this._config?.defaults ?? {};
    return html`
      <div class="ec-section">
              ${this._row('Needle color',
                this._colorPicker('d-ga-nc', d.gauge_arc_needle_color, (v) => this._updateDefaults({ gauge_arc_needle_color: v || undefined })))}
              ${this._row('Label color',
                this._colorPicker('d-ga-lc', d.gauge_arc_label_color, (v) => this._updateDefaults({ gauge_arc_label_color: v || undefined })))}
              ${this._numRow('Label size', { value: d.gauge_arc_label_size, onChange: (v) => this._updateDefaults({ gauge_arc_label_size: v }), min: 6, max: 24, step: 1, placeholder: '11' })}
      </div>
    `;
  }

  // ── Extended Cards panel ────────────────────────────────────────────────────

  /**
   * Paths are ExtendedCardDefaults-relative — see `_extDefaultsScope`.
   *
   * Since #89 this is a **manifest only**: the screen it used to title is the
   * `sec:popover` crumb under Settings ▸ Global Defaults, and the label/icon/key
   * here no longer reach the UI. It survives because the screen writes two
   * roots — these keys under `extended_card_defaults`, the scrim under
   * `defaults` — and this is the half `sec:popover`'s own manifest cannot count.
   */
  private static readonly _POPOVER_GLOBAL_DEFAULTS_DEF: NavSectionDef<import('./types').ExtendedCardDefaults> =
    { key: 'defaults-global', label: 'Popover Card Defaults', hint: 'Default columns, size, gaps & style for every popover card', icon: 'mdi:tune',
      paths: ['columns', 'width', 'height', 'field_gap', 'column_gap',
              ...pfx('card', BOX_STYLE_PATHS),
              ...pfx('label', TEXT_STYLE_PATHS),
              ...pfx('value', TEXT_STYLE_PATHS)] };

  /** Paths are ExtendedCardConfig-relative — see `_extCardScope`. */
  private static readonly _POPOVER_CARD_SECTIONS: NavSectionDef<import('./types').ExtendedCardConfig>[] = [
    { key: 'sec:defaults', label: 'Card Defaults', hint: 'Columns, width %, height %, gaps', icon: 'mdi:tune',
      paths: ['name', 'columns', 'width', 'height', 'align', 'field_gap', 'column_gap'] },
    { key: 'sec:style',    label: 'Card Style',    hint: 'Inherit or override background, border, shadow, blur', icon: 'mdi:palette',      terms: `${BOX_STYLE_TERMS} use global inherit override`,
      paths: pfx('box', BOX_STYLE_PATHS) },
    { key: 'sec:text',     label: 'Text Styles',   hint: 'Inherit or override label & value style',            icon: 'mdi:format-title', terms: `${TEXT_STYLE_TERMS} use global inherit override`,
      paths: [...pfx('label_style', TEXT_STYLE_PATHS), ...pfx('value_style', TEXT_STYLE_PATHS)] },
  ];

  private _extCardScope(eci: number): SectionScope<import('./types').ExtendedCardConfig> {
    return {
      root: this._extCards()[eci],
      apply: (patch) => this._updateExtCard(eci, patch),
    };
  }

  private _extDefaultsScope(): SectionScope<import('./types').ExtendedCardDefaults> {
    return {
      root: this._config?.extended_card_defaults,
      apply: (patch) => this._updateExtDefaults(patch),
    };
  }

  private _renderPopoverPanel(): TemplateResult {
    const path = this._navPath;
    const extCards = this._extCards();
    if (path.length === 0) {
      // #89: the defaults for *every* popover are not a property of any one of
      // them, so the crumb that used to sit here moved to Settings ▸ Global
      // Defaults ▸ Popover Card Defaults.
      return html`
        <div class="ec-section-header">
          <span></span>
          <button class="ec-btn-add" @click=${this._addExtCard}>+ Popover Card</button>
        </div>
        ${extCards.length === 0
          ? this._emptyAdd('No popover cards yet — add one', () => this._addExtCard())
          : extCards.map((c, i) => this._itemCard({
              dragKey: `extcard:${i}`,
              icon: 'mdi:picture-in-picture-bottom-right',
              label: c.name ?? `Popover Card ${i + 1}`,
              sub: `${c.fields.length} field${c.fields.length === 1 ? '' : 's'}`,
              selected: i === this._selExtCard,
              onClick: () => { this._selExtCard = i; this._selExtField = -1; this._navPush(`card:${c.id}`, c.name ?? `Popover Card ${i + 1}`); },
              actions: html`
                <button class="ec-btn-dup"
                  @click=${(e: Event) => { e.stopPropagation(); this._duplicateExtCard(i); }}
                  title="Duplicate card">⧉</button>
                <button class="ec-btn-remove"
                  @click=${(e: Event) => { e.stopPropagation(); this._removeExtCard(i); }}
                  title="Remove">✕</button>
              `,
            }))}
      `;
    }
    // Every crumb under this panel is now card:N — the 'defaults-global' branch
    // that used to sit here went with the screen (#89).
    const eci = this._crumbIndex(path[0].key, extCards);
    this._selExtCard = eci;
    const card = extCards[eci];
    if (!card) return this._navDeadEnd();
    if (path.length === 1) {
      return html`
        ${this._navMenu(MosaicCanvasEditor._POPOVER_CARD_SECTIONS, this._extCardScope(eci))}
        ${this._renderExtFieldList(eci, card)}
      `;
    }
    const key = path[1].key;
    if (key.startsWith('field:')) {
      const efi = this._crumbIndex(key, card.fields);
      this._selExtField = efi;
      const field = card.fields[efi];
      if (!field) return this._navDeadEnd();
      if (path.length === 4 && path[2].key === 'fsec:series' && path[3].key.startsWith('egs:')) {
        const si = this._crumbIndex(path[3].key, field.graph_series);
        this._selExtSeries = si;
        return this._fieldSecGraphSeriesItem(eci, efi, field, si, true);
      }
      if (path.length === 4 && path[2].key === 'fsec:options') {
        if (path[3].key.startsWith('eopt:')) {
          const oi = this._crumbIndex(path[3].key, field.options);
          this._selExtOption = oi;
          return this._fieldSecOptionItem(eci, efi, field, oi, true);
        }
        if (path[3].key === 'optlayout') {
          return html`
            ${this._clearOverridesBtn(MosaicCanvasEditor._OPTION_LAYOUT_DEF, this._fieldScope(eci, efi, true))}
            <div class="ec-section">${this._optionLayoutEditor(
              field, this._updFor(eci, efi, true), this._idFor(eci, efi, true))}</div>
          `;
        }
      }
      // Selector and Button drill one level deeper into Field Container / states.
      if (path.length === 4 && path[2].key === 'fsec:controlstyle' && path[3].key.startsWith('fscs:')) {
        return this._fieldControlStyleStateSection(eci, efi, field, path[3].key, true);
      }
      return path.length === 3
        ? this._fieldSection(eci, efi, field, path[2].key, true)
        : this._renderExtFieldPanel(eci, efi, field);
    }
    return this._popoverCardSection(eci, card, key);
  }

  private _popoverGlobalDefaults(): TemplateResult {
    if (!this._config) return html``;
    return html`
      <div class="ec-section">
              ${this._row('Columns (default)',
                html`<select class="ec-select"
                  .value=${String(this._config.extended_card_defaults?.columns ?? sd('columns') ?? 2)}
                  @change=${(e: Event) => this._updateExtDefaults({ columns: Number((e.target as HTMLSelectElement).value) })}
                >
                  <option value="1">1</option>
                  <option value="2" .selected=${(this._config.extended_card_defaults?.columns ?? sd('columns') ?? 2) === 2}>2</option>
                  <option value="3" .selected=${this._config.extended_card_defaults?.columns === 3}>3</option>
                  <option value="4" .selected=${this._config.extended_card_defaults?.columns === 4}>4</option>
                  <option value="5" .selected=${this._config.extended_card_defaults?.columns === 5}>5</option>
                  <option value="6" .selected=${this._config.extended_card_defaults?.columns === 6}>6</option>
                  <option value="7" .selected=${this._config.extended_card_defaults?.columns === 7}>7</option>
                  <option value="8" .selected=${this._config.extended_card_defaults?.columns === 8}>8</option>
                </select>`)}
              ${this._row('Width % (default)',
                html`${this._numWrap(html`<input class="ec-input ec-input-num" type="number" min="20" max="100"
                  .value=${this._config.extended_card_defaults?.width != null ? String(this._config.extended_card_defaults.width) : ''}
                  placeholder="70"
                  @change=${(e: Event) => {
                    const v = (e.target as HTMLInputElement).value;
                    this._updateExtDefaults({ width: v === '' ? undefined : Number(v) });
                  }}
                />`)}`)}
              ${this._row('Height % (default)',
                html`${this._numWrap(html`<input class="ec-input ec-input-num" type="number" min="10" max="100"
                  .value=${this._config.extended_card_defaults?.height != null ? String(this._config.extended_card_defaults.height) : ''}
                  placeholder="auto"
                  @change=${(e: Event) => {
                    const v = (e.target as HTMLInputElement).value;
                    this._updateExtDefaults({ height: v === '' ? undefined : Number(v) });
                  }}
                />`)}`)}
              ${this._row('Field gap (px)',
                html`${this._numWrap(html`<input class="ec-input ec-input-num" type="number" min="0"
                  .value=${this._config.extended_card_defaults?.field_gap != null ? String(this._config.extended_card_defaults.field_gap) : ''}
                  placeholder="8"
                  @change=${(e: Event) => {
                    const v = (e.target as HTMLInputElement).value;
                    this._updateExtDefaults({ field_gap: v === '' ? undefined : Number(v) });
                  }}
                />`)}`)}
              ${this._row('Column gap (px)',
                html`${this._numWrap(html`<input class="ec-input ec-input-num" type="number" min="0"
                  .value=${this._config.extended_card_defaults?.column_gap != null ? String(this._config.extended_card_defaults.column_gap) : ''}
                  placeholder="(from global)"
                  @change=${(e: Event) => {
                    const v = (e.target as HTMLInputElement).value;
                    this._updateExtDefaults({ column_gap: v === '' ? undefined : Number(v) });
                  }}
                />`)}`)}
              <div class="ec-subsection-title">Card default</div>
              <p class="ec-hint">The box every popover starts from. Popovers do not inherit <b>Mosaic Card Defaults</b> — style them here, and each popover's own <b>Card Style</b> overrides this.</p>
              ${this._copyMosaicCardStyleRow()}
              ${this._boxRows('extd-card', this._config.extended_card_defaults?.card ?? {}, (p) => this._updateExtDefaults({ card: { ...this._config!.extended_card_defaults?.card, ...p } }))}
              ${this._popoverDimmingRows()}
              <div class="ec-subsection-title">Label default</div>
              <p class="ec-hint">Blank text styles here still cascade from <b>Global Defaults ▸ Label Default</b> and
                <b>Value Default</b> — only the card box above does not.</p>
              ${this._textRows('extd-lbl', this._config.extended_card_defaults?.label ?? {}, (p) => this._updateExtDefaults({ label: { ...this._config!.extended_card_defaults?.label, ...p } }))}
              <div class="ec-subsection-title">Value default</div>
              ${this._textRows('extd-val', this._config.extended_card_defaults?.value ?? {}, (p) => this._updateExtDefaults({ value: { ...this._config!.extended_card_defaults?.value, ...p } }))}
      </div>
    `;
  }

  /**
   * The box keys "Copy from Mosaic Card Defaults" brings across (#89) — every
   * row `_boxRows` renders, which is exactly `BOX_STYLE_PATHS`.
   *
   * It started as the frame only, on the theory that a popover sits over the
   * dashboard rather than over the background image and so always wants a
   * background of its own. In practice the backgrounds are the part people
   * most want carried across, so the whole box style copies. Changed before
   * #89 shipped, so the frame-only version was never released.
   *
   * Derived rather than restated so it cannot drift from the rows: a new
   * `_boxRows` row is copyable the moment it joins that list, and a path there
   * that isn't a bare `BoxStyle` key fails to compile here.
   */
  private static readonly _COPYABLE_CARD_STYLE_KEYS: readonly (keyof BoxStyle)[] = BOX_STYLE_PATHS;

  /**
   * One-off copy of the Mosaic card styling into the popover defaults.
   *
   * #89 removed the inheritance because it was invisible and surprising. That
   * does not mean the two should never match — it means matching should be a
   * thing you did, once, on purpose. This is that: it writes values, it does
   * not create a link, so editing Mosaic Card Defaults afterwards leaves the
   * popover alone.
   */
  private _copyMosaicCardStyleRow(): TemplateResult {
    const src = this._config?.defaults?.card ?? {};
    const keys = MosaicCanvasEditor._COPYABLE_CARD_STYLE_KEYS.filter((k) => src[k] !== undefined);
    if (!keys.length) {
      return html`<p class="ec-hint">Nothing to copy — <b>Mosaic Card Defaults</b> has no box styling set.</p>`;
    }
    const copy = (): void => {
      const n = keys.length;
      if (!window.confirm(
        `Copy ${n} styling value${n === 1 ? '' : 's'} from Mosaic Card Defaults?\n\n`
        + `${keys.join(', ')}\n\n`
        + 'This overwrites those values on the popover defaults, and is a one-off — '
        + 'the two do not stay linked.')) return;
      const patch: Partial<BoxStyle> = {};
      for (const k of keys) (patch as Record<string, unknown>)[k] = src[k];
      this._updateExtDefaults({ card: { ...this._config?.extended_card_defaults?.card, ...patch } });
      this._showUndoToast(`${n} value${n === 1 ? '' : 's'} copied from Mosaic Card Defaults`);
    };
    return html`
      <button class="ec-btn-add" style="width:100%;" @click=${copy}>⧉ Copy styling from Mosaic Card Defaults</button>
      <p class="ec-hint">Copies the whole box style — background and gradient, border colour, border, width, radius, padding, shadow, additional CSS and blur. Nothing stays linked afterwards.</p>
    `;
  }

  /**
   * The popover's own share of the dimming preset (#89) — the scrim behind the
   * panel, and nothing else. The close-button colours are not repeated here:
   * one CSS rule paints both overlays' close buttons, so they stay on the
   * Mosaic screen where they are set once.
   *
   * Written into `defaults`, not `extended_card_defaults`, which is why the
   * `sec:popover` manifest claims this key while the rest of the screen's keys
   * belong to `_POPOVER_GLOBAL_DEFAULTS_DEF`.
   */
  private _popoverDimmingRows(): TemplateResult {
    const d = this._config?.defaults ?? {};
    const dim = matchPopupDimming(d, POPOVER_DIMMING_KEYS);
    return html`
      <div class="ec-subsection-title">Dimming</div>
      <p class="ec-hint">How far the dashboard behind a popover is dimmed while it is open. Set independently of an expanded Mosaic card.</p>
      ${this._row('Dimming', html`
        <select class="ec-select"
          @change=${(e: Event) => this._setPopupDimming((e.target as HTMLSelectElement).value as PopupDimming, POPOVER_DIMMING_KEYS)}
        >
          ${dim === undefined ? html`<option value="" selected>Custom</option>` : nothing}
          ${(Object.keys(POPUP_DIMMING) as PopupDimming[]).map((k) => html`
            <option value=${k} .selected=${dim === k}>${POPUP_DIMMING[k].label} — ${POPUP_DIMMING[k].hint}</option>`)}
        </select>`)}
      ${dim === undefined
        ? html`<p class="ec-hint">This scrim was set by hand in YAML, so no preset describes it. Picking one replaces it.</p>`
        : nothing}
    `;
  }

  private _popoverCardSection(eci: number, card: import('./types').ExtendedCardConfig, key: string): TemplateResult {
    const body = (): TemplateResult => {
      switch (key) {
        case 'sec:defaults': return this._popoverSecDefaults(eci, card);
        case 'sec:style':    return this._popoverSecStyle(eci, card);
        case 'sec:text':     return this._popoverSecText(eci, card);
        default:              return html``;
      }
    };
    return html`
      ${this._clearOverridesBtn(
        MosaicCanvasEditor._findDef(MosaicCanvasEditor._POPOVER_CARD_SECTIONS, key), this._extCardScope(eci))}
      ${body()}
    `;
  }

  private _popoverSecDefaults(eci: number, card: import('./types').ExtendedCardConfig): TemplateResult {
    return html`
      <div class="ec-section">
        ${this._row('Name',
          html`<input class="ec-input" type="text" .value=${card.name ?? ''}
            @change=${(e: Event) => this._updateExtCard(eci, { name: (e.target as HTMLInputElement).value })}
          />`)}

        ${this._row('Columns',
          html`<select class="ec-select"
            .value=${String(card.columns ?? sd('columns') ?? 2)}
            @change=${(e: Event) => this._updateExtCard(eci, { columns: Number((e.target as HTMLSelectElement).value) })}
          >
            <option value="1">1</option>
            <option value="2" .selected=${(card.columns ?? sd('columns') ?? 2) === 2}>2</option>
            <option value="3" .selected=${card.columns === 3}>3</option>
            <option value="4" .selected=${card.columns === 4}>4</option>
            <option value="5" .selected=${card.columns === 5}>5</option>
            <option value="6" .selected=${card.columns === 6}>6</option>
            <option value="7" .selected=${card.columns === 7}>7</option>
            <option value="8" .selected=${card.columns === 8}>8</option>
          </select>`,
          "How many columns this popover's fields flow into.")}

        ${this._numRow('Width %', { value: card.width, onChange: (v) => this._updateExtCard(eci, { width: v }), min: 20, max: 100, placeholder: '(from defaults)',
          hint: 'Width as a percentage of the dashboard.' })}

        ${this._numRow('Height %', { value: card.height, onChange: (v) => this._updateExtCard(eci, { height: v }), min: 10, max: 100, placeholder: 'auto',
          hint: 'Unset lets the popover size itself to its contents.' })}

        ${this._row('Align',
          html`<select class="ec-select"
            .value=${card.align ?? sd('align') ?? 'left'}
            @change=${(e: Event) => this._updateExtCard(eci, { align: (e.target as HTMLSelectElement).value as import('./types').Align })}
          >
            ${ALIGNS.map((a) => html`<option value=${a} .selected=${(card.align ?? sd('align') ?? 'left') === a}>${ALIGN_LABELS[a]}</option>`)}
          </select>`,
          'Horizontal alignment of the fields inside the popover.')}

        ${this._numRow('Field gap (px)', { value: card.field_gap, onChange: (v) => this._updateExtCard(eci, { field_gap: v }), min: 0, placeholder: '(from defaults)',
          hint: 'Vertical space between fields.' })}

        ${this._numRow('Column gap (px)', { value: card.column_gap, onChange: (v) => this._updateExtCard(eci, { column_gap: v }), min: 0, placeholder: '(from defaults)',
          hint: 'Horizontal space between field columns.' })}
      </div>
    `;
  }

  /**
   * The inherit gate a Mosaic card already has (`_cardSecStyle`), for a style
   * container that follows a global default. `undefined` vs `{}` is the same
   * distinction there: every render chain treats an absent container as
   * "inherit", so the checkbox is real config state, not a UI flag that could
   * drift from it.
   *
   * The caller supplies the hint rather than sharing one, because "global" names
   * a different screen per surface — Popover Card Defaults for a popover (#89
   * cut the Mosaic inheritance), Embedded Card Default for an embedded card
   * (#92). Shared wording would imply they are still one surface.
   */
  private _inheritRow(
    label: string,
    hint: string,
    overriding: boolean,
    onToggle: (useGlobal: boolean) => void,
  ): TemplateResult {
    return html`
      ${this._row(label,
        html`<input type="checkbox" .checked=${!overriding}
          @change=${(e: Event) => onToggle((e.target as HTMLInputElement).checked)} />`,
        "Ticked, this follows the global default named below. Unticking gives it settings of its own, starting empty.")}
      ${!overriding ? html`<p class="ec-hint">${hint}</p>` : nothing}
    `;
  }

  private _popoverSecStyle(eci: number, card: import('./types').ExtendedCardConfig): TemplateResult {
    return html`
      <div class="ec-section">
        ${this._inheritRow('Use global card style',
          'Following Global Defaults ▸ Popover Card Defaults ▸ Card default.',
          card.box !== undefined,
          (useGlobal) => this._updateExtCard(eci, { box: useGlobal ? undefined : {} }))}
        ${card.box !== undefined ? html`
          <div class="ec-subsection-title">Box style</div>
          ${this._boxRows(`ext${eci}`, card.box, (p) => this._updateExtCardBox(eci, p))}
        ` : nothing}
      </div>
    `;
  }

  private _popoverSecText(eci: number, card: import('./types').ExtendedCardConfig): TemplateResult {
    return html`
      <div class="ec-section">
        ${this._inheritRow('Use global label style',
          'Following Global Defaults ▸ Popover Card Defaults ▸ Label default.',
          card.label_style !== undefined,
          (useGlobal) => this._updateExtCard(eci, { label_style: useGlobal ? undefined : {} }))}
        ${card.label_style !== undefined ? html`
          <div class="ec-subsection-title">Label Default</div>
          ${this._textRows(`ext${eci}-ls`, card.label_style, (p) => this._updateExtCard(eci, { label_style: { ...card.label_style, ...p } }))}
        ` : nothing}

        ${this._inheritRow('Use global value style',
          'Following Global Defaults ▸ Popover Card Defaults ▸ Value default.',
          card.value_style !== undefined,
          (useGlobal) => this._updateExtCard(eci, { value_style: useGlobal ? undefined : {} }))}
        ${card.value_style !== undefined ? html`
          <div class="ec-subsection-title">Value Default</div>
          ${this._textRows(`ext${eci}-vs`, card.value_style, (p) => this._updateExtCard(eci, { value_style: { ...card.value_style, ...p } }))}
        ` : nothing}
      </div>
    `;
  }

  private _renderExtFieldList(eci: number, card: import('./types').ExtendedCardConfig): TemplateResult {
    const fields = card.fields;
    return html`
      <div class="ec-section ec-section--fields">
        <div class="ec-section-header">
          <span class="ec-section-title">Fields</span>
          ${this._copiedField ? html`<button class="ec-btn-paste"
            @click=${() => this._pasteField(eci, true)}
            title="Paste copied field onto this card">⎗ Field</button>` : nothing}
          <button class="ec-btn-add" @click=${() => this._addExtField(eci)}>+ Field</button>
        </div>
        ${this._listFilterBox(fields.length)}
        ${fields.length === 0
          ? this._emptyAdd('No fields yet — add one', () => this._addExtField(eci))
          : fields
              .map((f, efi) => ({ f, efi }))
              .filter(({ f }) => {
                const q = this._currentListFilter();
                return !q || `${this._fieldName(f)} ${this._fieldSub(f)}`.toLowerCase().includes(q);
              })
              .map(({ f, efi }) => this._itemCard({
              dragKey: `extfield:${eci}:${efi}`,
              icon: FIELD_TYPE_ICONS[f.type],
              label: this._fieldName(f),
              sub: this._fieldSub(f),
              selected: efi === this._selExtField,
              onClick: () => { this._selExtField = efi; this._navPush(`field:${f.id}`, `Field ${efi + 1}`); },
              actions: html`
                ${this._copiedFieldSrc?.isExt === true && this._copiedFieldSrc.cardId === card.id && this._copiedFieldSrc.fieldId === f.id
                  ? html`<span class="ec-copy-badge">Copied</span>`
                  : html`<button class="ec-btn-copy"
                      @click=${(e: Event) => { e.stopPropagation(); this._copyField(eci, efi, true); }}
                      title="Copy this field">⎘</button>`}
                <button class="ec-btn-dup"
                  @click=${(e: Event) => { e.stopPropagation(); this._duplicateField(eci, efi, true); }}
                  title="Duplicate field">⧉</button>
                <button class="ec-btn-remove"
                  @click=${(e: Event) => { e.stopPropagation(); this._removeExtField(eci, efi); }}
                  title="Remove">✕</button>
              `,
            }))}
      </div>
    `;
  }

  private _extFieldHeader(eci: number, efi: number, field: import('./types').FieldConfig): TemplateResult {
    const upd = (p: Partial<import('./types').FieldConfig>) => this._updateExtField(eci, efi, p);
    return html`
        <div class="ec-section-header">
          <span class="ec-section-title">Field ${efi + 1}</span>
        </div>

        ${this._row('Type',
          html`<select class="ec-select"
            .value=${field.type === 'graph' ? 'svg' : field.type}
            @change=${(e: Event) => {
              const t = (e.target as HTMLSelectElement).value as import('./types').FieldType;
              if (isControlField(t)) {
                const vid = defaultVariantId(t);
                if (vid && !this._confirmVariantOptionLoss(field, t, vid)) {
                  (e.target as HTMLSelectElement).value = field.type === 'graph' ? 'svg' : field.type;
                  return;
                }
                upd(this._typeChangePatch(field, t, vid ? variantPreset(t, vid) : {}));
              } else {
                if (!this._confirmTypeOptionLoss(field, t)) {
                  (e.target as HTMLSelectElement).value = field.type === 'graph' ? 'svg' : field.type;
                  return;
                }
                upd(this._typeChangePatch(field, t));
                if (t === 'svg') this._openGGPicker(eci, efi, true);
              }
            }}
          >
            ${FIELD_TYPES_SORTED.map((t) => html`<option value=${t} .selected=${(field.type === 'graph' ? 'svg' : field.type) === t}>${FIELD_TYPE_LABELS[t]}</option>`)}
          </select>`)}

        ${isControlField(field.type) && getVariants(field.type).length > 1 ? this._row('Variant',
          html`<select class="ec-select"
            .value=${field.variant ?? ''}
            @change=${(e: Event) => {
              const vid = (e.target as HTMLSelectElement).value;
              if (!this._confirmVariantOptionLoss(field, field.type, vid)) {
                (e.target as HTMLSelectElement).value = field.variant ?? '';
                return;
              }
              upd(variantPreset(field.type, vid));
            }}
          >
            ${this._variantOptions(field.type, field.variant)}
          </select>`) : nothing}

        ${(field.type === 'svg' || field.type === 'graph') ? this._row('Element',
          html`<div style="display:flex;gap:8px;align-items:center;">
            <span class="ec-input" style="flex:1;min-width:0;opacity:0.85;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${this._elementLabel(field)}</span>
            <button class="ec-lib-browse-btn" style="flex:0 0 auto;white-space:nowrap;" @click=${() => this._openGGPicker(eci, efi, true)}>⊞ Change type…</button>
          </div>`) : nothing}

        ${this._row('Display Name',
          html`<input class="ec-input" type="text"
            .value=${field.display_name ?? ''}
            placeholder="Friendly name for the field list"
            @change=${(e: Event) => {
              const v = (e.target as HTMLInputElement).value.trim();
              upd({ display_name: v === '' ? undefined : v });
            }}
          />`)}

        ${this._row('Column',
          html`<div style="display:flex;gap:4px;align-items:center">
            ${this._numWrap(html`<input class="ec-input ec-input-num-small" type="number" min="1" max="8"
              .value=${field.column != null ? String(field.column) : ''}
              placeholder="auto"
              title="Force this field into a specific column (1–8). Leave blank for auto flow."
              @change=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                upd({ column: v === '' ? undefined : Number(v) });
              }}
            />`)}
            <span style="font-size:11px;opacity:0.6">Span end (Opt)</span>
            ${this._numWrap(html`<input class="ec-input ec-input-num-small" type="number" min="2" max="8"
              .value=${field.column_end != null ? String(field.column_end) : ''}
              placeholder="–"
              title="Span End Column (Opt) — last column this field occupies"
              @change=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                upd({ column_end: v === '' ? undefined : Number(v) });
              }}
            />`)}
          </div>`)}
    `;
  }

  /** Popover Card field editor: mirrors Mosaic Card's _renderFieldPanel — menu at path.length===3, or the flat trivial-type form. */
  private _renderExtFieldPanel(eci: number, efi: number, field: import('./types').FieldConfig): TemplateResult {
    if (field.type === 'blank' || field.type === 'rule') {
      return html`
        <div class="ec-section ec-section--fields">
          ${this._extFieldHeader(eci, efi, field)}
          ${this._fieldSecBlankOrRule(eci, efi, field, true)}
        </div>
      `;
    }
    return html`
      <div class="ec-section ec-section--fields">
        ${this._extFieldHeader(eci, efi, field)}
        ${this._fieldSectionMenu(field, eci, efi, true)}
      </div>
    `;
  }

  private _resetToWizard = () => {
    // Must name everything the _emit below actually discards — it replaces the
    // whole config, so this is the user's only warning (#58).
    if (!window.confirm(
      'Reset all configuration and restart the setup wizard?\n\n'
      + 'This will clear all cards, popover cards, embedded cards, virtuals, '
      + 'flows, zones, and background settings.\n\n'
      + 'It also resets Global Defaults to their starting values — including '
      + 'your saved custom control variants — and clears the popover card '
      + 'defaults and EV count.'
    )) return;
    this._wiz = {
      cardType: '',
      source: 'auto',
      sunEntity: 'sun.sun',
      dayImg: '',
      nightImg: '',
      evCount: 0,
      evImgs: [],
      bgCount: 'single',
      bgSwitchMode: 'sun',
      bgEntity: '',
      singleImg: '',
      bgStateEntity: '',
      bgRules: [],
    };
    this._wizStep = 0;
    this._emit({
      type: this._config!.type,
      background: {},
      canvas: {},
      defaults: {
        font_family: 'sans-serif',
        card: { background: 'rgba(8,18,28,0.55)', border: true, color: '#00d4ff', radius: 10, padding: 8 },
        label: { font_size: 13, color: '#cccccc' },
        value: { font_size: 22, color: '#ffffff', font_weight: 600 },
      },
      cards: [],
    });
  };

  private _renderCanvasRibbonPanel(): TemplateResult {
    const path = this._navPath;
    if (path.length === 0) return this._canvasSectionMenu();
    if (path[0].key === 'sec:bg' && path.length === 2 && path[1].key.startsWith('cbgr:')) {
      const ri = this._crumbIndex(path[1].key, this._config?.background?.rules);
      this._selCanvasBgRule = ri;
      return this._canvasSecBgRule(ri);
    }
    return this._canvasSection(path[0].key);
  }

  /**
   * Canvas manifests are config-root-relative, not `canvas`-relative: the
   * Background screen edits `background.*` and `ev_count` alongside the other
   * three screens' `canvas.*`, so one root spans all four (see `_canvasScope`).
   *
   * #75: typed against a `Pick` of the three top-level slots this panel
   * actually touches, rather than the full config root — narrower than
   * `_canvasScope`'s literal `root: this._config` needs to be, but that just
   * means the wider object structurally satisfies it; the payoff is that a
   * stray `'cards.*'`/`'defaults.*'` path here is now a compile error too,
   * not just a renamed-`canvas`-property one.
   */
  private static readonly _CANVAS_SECTIONS: NavSectionDef<Pick<MosaicCanvasConfig, 'canvas' | 'background' | 'ev_count'>>[] = [
    // Clearing `layout_mode` returns the canvas to precision without going
    // through `_setLayoutMode`, and that is safe in both directions that matter:
    // the key is unseeded (absent from defaults.json, so `sd()` can never
    // resolve it back to grid) and every reader tests `=== 'grid'`, so
    // `undefined` and `'precision'` are indistinguishable. Leaving grid is the
    // non-destructive direction anyway — `_setLayoutMode`'s else-branch only
    // writes the mode, and #63's warning covers the destructive direction.
    { key: 'sec:mode', label: 'Placement Mode', hint: 'Precision or Grid',           icon: 'mdi:grid',
      paths: ['canvas.layout_mode', 'canvas.grid.columns', 'canvas.grid.rows', 'canvas.grid.padding'] },
    { key: 'sec:size', label: 'Canvas Size',    hint: 'Base size, fit & extend',     icon: 'mdi:aspect-ratio',
      paths: ['canvas.width', 'canvas.height', 'canvas.fit',
              'canvas.extend.top', 'canvas.extend.right', 'canvas.extend.bottom', 'canvas.extend.left'] },
    { key: 'sec:box',  label: 'Canvas Box',     hint: 'Canvas background & border',  icon: 'mdi:image-frame', terms: BOX_STYLE_TERMS,
      paths: pfx('canvas.box', BOX_STYLE_PATHS) },
    { key: 'sec:bg',   label: 'Background',     hint: 'Method, images & EV count',   icon: 'mdi:image-multiple',
      terms: 'method single image day night state entity rules value swap url path picker library media',
      paths: ['background.source', 'background.sun_entity', 'background.sun_attribute',
              'background.mode_entity', 'background.mode_attribute', 'background.fit',
              'background.images', 'background.url', 'background.entity', 'background.rules',
              'ev_count'] },
  ];

  /** Manifest scope for the Canvas panel — paths are config-root-relative. */
  private _canvasScope(): SectionScope<Pick<MosaicCanvasConfig, 'canvas' | 'background' | 'ev_count'>> {
    return {
      root: this._config,
      apply: (patch) => {
        if (!this._config) return;
        // #75: patch is narrowed to the canvas/background/ev_count slice this
        // scope declares; mergePatch's generic infers from *both* arguments and
        // needs the full MosaicCanvasConfig shape here since `this._config` — the
        // config root, not a sub-slice — is what's actually being replaced.
        this._emit(mergePatch(this._config, patch as Partial<MosaicCanvasConfig>));
      },
    };
  }

  private _canvasSectionMenu(): TemplateResult {
    return this._navMenu(MosaicCanvasEditor._CANVAS_SECTIONS, this._canvasScope());
  }

  private _canvasSection(key: string): TemplateResult {
    const body = (): TemplateResult => {
      switch (key) {
        case 'sec:mode': return this._canvasSecMode();
        case 'sec:size': return this._canvasSecSize();
        case 'sec:box':  return this._canvasSecBox();
        case 'sec:bg':   return html`<div class="ec-section">${this._renderBackgroundControls()}</div>`;
        default:          return html``;
      }
    };
    return html`
      ${this._clearOverridesBtn(
        MosaicCanvasEditor._findDef(MosaicCanvasEditor._CANVAS_SECTIONS, key), this._canvasScope())}
      ${body()}
    `;
  }

  /** Entering grid mode rewrites every card's anchor, width and position in one
   *  pass, and leaving grid mode does not put them back, so the cost is stated
   *  on the way in rather than discovered afterwards (#63). A canvas with no
   *  cards has nothing to rewrite, so it gets no warning. */
  private _gridEntryWarning(): TemplateResult | typeof nothing {
    const cards = this._config?.cards?.length ?? 0;
    const emb = this._embCards().length;
    if (!cards && !emb) return nothing;
    const parts: string[] = [];
    if (cards) parts.push(`${cards} card${cards === 1 ? '' : 's'}`);
    if (emb) parts.push(`${emb} embedded card${emb === 1 ? '' : 's'}`);
    return html`
      <ha-alert alert-type="warning">
        Switching to Grid re-lays out ${parts.join(' and ')}: each one snaps to the nearest
        grid intersection, is re-anchored to its centre, and is resized to a whole number of
        columns. Switching back to Precision does not restore the old layout — use Ctrl+Z to
        undo.
      </ha-alert>
    `;
  }

  private _canvasSecMode(): TemplateResult {
    const cv = this._config?.canvas ?? {};
    const isGrid = cv.layout_mode === 'grid';
    return html`
      <div class="ec-section">
          <div class="ec-mode-tiles">
            <button type="button" class="ec-mode-tile${isGrid ? '' : ' active'}"
              @click=${() => this._setLayoutMode('precision')}
            >
              <ha-icon icon="mdi:crosshairs-gps"></ha-icon>
              <span>Precision</span>
            </button>
            <button type="button" class="ec-mode-tile${isGrid ? ' active' : ''}"
              @click=${() => this._setLayoutMode('grid')}
            >
              <ha-icon icon="mdi:grid"></ha-icon>
              <span>Grid</span>
            </button>
          </div>

          ${isGrid ? nothing : this._gridEntryWarning()}

          ${cv.layout_mode === 'grid' ? html`
            ${this._row('Grid columns',
              html`${this._numWrap(html`<input class="ec-input ec-input-num" type="number" min="1"
                .value=${String(cv.grid?.columns ?? 10)}
                @change=${(e: Event) => {
                  const v = Math.max(1, Number((e.target as HTMLInputElement).value) || 1);
                  this._updateCanvas({ grid: { ...(cv.grid ?? { columns: 10, rows: 15 }), columns: v } });
                }}
              />`)}`,
              'How many columns the canvas is divided into.')}

            ${this._row('Grid rows',
              html`${this._numWrap(html`<input class="ec-input ec-input-num" type="number" min="1"
                .value=${String(cv.grid?.rows ?? 15)}
                @change=${(e: Event) => {
                  const v = Math.max(1, Number((e.target as HTMLInputElement).value) || 1);
                  this._updateCanvas({ grid: { ...(cv.grid ?? { columns: 10, rows: 15 }), rows: v } });
                }}
              />`)}`,
              'How many rows the canvas is divided into.')}

            ${this._row('Card padding (px)',
              html`${this._numWrap(html`<input class="ec-input ec-input-num" type="number" min="0"
                .value=${String(cv.grid?.padding ?? 0)}
                @change=${(e: Event) => {
                  const v = Math.max(0, Number((e.target as HTMLInputElement).value) || 0);
                  this._updateCanvas({ grid: { ...(cv.grid ?? { columns: 10, rows: 15 }), padding: v } });
                }}
              />`)}`,
              'Space left inside each grid cell around a snapped card.')}
          ` : nothing}
      </div>
    `;
  }

  private _canvasSecSize(): TemplateResult {
    const cv = this._config?.canvas ?? {};
    return html`
      <div class="ec-section">
          ${this._numRow('Width (px)', { value: cv.width, onChange: (v) => this._updateCanvas({ width: v }), min: 1, placeholder: 'image width',
            hint: "The coordinate space cards are positioned in. Unset uses the background image's own width." })}

          ${this._numRow('Height (px)', { value: cv.height, onChange: (v) => this._updateCanvas({ height: v }), min: 1, placeholder: 'from aspect',
            hint: "Unset keeps the background image's aspect ratio." })}

          ${this._row('Fit',
            html`<select class="ec-select"
              .value=${cv.fit ?? sd('background_fit') ?? 'cover'}
              @change=${(e: Event) => this._updateCanvas({ fit: (e.target as HTMLSelectElement).value as 'cover' | 'contain' })}
            >
              <option value="cover" .selected=${(cv.fit ?? sd('background_fit') ?? 'cover') === 'cover'}>cover</option>
              <option value="contain" .selected=${cv.fit === 'contain'}>contain</option>
            </select>`)}
          <p class="ec-hint">The base fit for the background image. The Background section's own "Background fit" overrides this when set.</p>

          <div class="ec-subsection-title">Extend (px)</div>

          ${this._row('Top',
            html`${this._numWrap(html`<input class="ec-input ec-input-num" type="number" min="0"
              .value=${cv.extend?.top != null ? String(cv.extend.top) : ''}
              placeholder="0"
              @change=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                this._updateCanvas({ extend: { ...cv.extend, top: v === '' ? undefined : Number(v) } });
              }}
            />`)}`,
            'Adds canvas beyond the background image on this side, for cards that sit off the picture.')}

          ${this._row('Right',
            html`${this._numWrap(html`<input class="ec-input ec-input-num" type="number" min="0"
              .value=${cv.extend?.right != null ? String(cv.extend.right) : ''}
              placeholder="0"
              @change=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                this._updateCanvas({ extend: { ...cv.extend, right: v === '' ? undefined : Number(v) } });
              }}
            />`)}`,
            'Adds canvas beyond the background image on this side, for cards that sit off the picture.')}

          ${this._row('Bottom',
            html`${this._numWrap(html`<input class="ec-input ec-input-num" type="number" min="0"
              .value=${cv.extend?.bottom != null ? String(cv.extend.bottom) : ''}
              placeholder="0"
              @change=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                this._updateCanvas({ extend: { ...cv.extend, bottom: v === '' ? undefined : Number(v) } });
              }}
            />`)}`,
            'Adds canvas beyond the background image on this side, for cards that sit off the picture.')}

          ${this._row('Left',
            html`${this._numWrap(html`<input class="ec-input ec-input-num" type="number" min="0"
              .value=${cv.extend?.left != null ? String(cv.extend.left) : ''}
              placeholder="0"
              @change=${(e: Event) => {
                const v = (e.target as HTMLInputElement).value;
                this._updateCanvas({ extend: { ...cv.extend, left: v === '' ? undefined : Number(v) } });
              }}
            />`)}`,
            'Adds canvas beyond the background image on this side, for cards that sit off the picture.')}
      </div>
    `;
  }

  private _canvasSecBox(): TemplateResult {
    const cv = this._config?.canvas ?? {};
    return html`
      <div class="ec-section">
          ${this._boxRows('cv', cv.box ?? {}, (p) => this._updateCanvas({ box: { ...cv.box, ...p } }), true,
            // The canvas radius also shapes the outer ha-card corners (#97).
            "Rounds the corners of the canvas and the card itself. Leave blank to use the theme's radius.")}
      </div>
    `;
  }

  /**
   * Which of the three background methods the config is using (#103).
   *
   * `source` carries the method, so there is nothing to infer: the two new
   * values name their own method and every value that predates them is the
   * day/night one. A config the setup wizard wrote as a single image before
   * #103 lands in day/night with one image filled in — which is what it is,
   * and it stays editable there.
   */
  private static _bgMethod(bg: BackgroundConfig): 'single' | 'daynight' | 'state' {
    return bg.source === 'single' ? 'single' : bg.source === 'state' ? 'state' : 'daynight';
  }

  /**
   * Switch methods by rewriting `source` alone. Nothing is cleared: each method
   * reads only its own keys, so a user who switches away and back finds their
   * images, rules and entities where they left them. Clearing what a method no
   * longer reads is what the section's Clear Overrides button is for.
   */
  private _setBgMethod(method: 'single' | 'daynight' | 'state'): void {
    const bg = this._config?.background ?? {};
    if (MosaicCanvasEditor._bgMethod(bg) === method) return;
    // Day/night has four source values of its own; returning to it restores
    // 'auto' only when the stored one belongs to another method.
    const source: BackgroundConfig['source'] = method === 'single' ? 'single'
      : method === 'state' ? 'state'
      : 'auto';
    this._updateBackground({ source });
  }

  private _renderBackgroundControls(): TemplateResult {
    if (!this._config) return html``;
    const bg = this._config.background ?? {};
    const source = bg.source ?? 'auto';
    const method = MosaicCanvasEditor._bgMethod(bg);
    const rules = bg.rules ?? [];
    const setRules = (r: BackgroundRule[]): void =>
      this._updateBackground({ rules: r.length ? r : undefined });
    return html`
          <div class="ec-subsection-title">Background</div>

          <div class="ec-mode-tiles">
            <button type="button" class="ec-mode-tile${method === 'single' ? ' active' : ''}"
              @click=${() => this._setBgMethod('single')}>
              <ha-icon icon="mdi:image-outline"></ha-icon>
              <span>Single Image</span>
            </button>
            <button type="button" class="ec-mode-tile${method === 'daynight' ? ' active' : ''}"
              @click=${() => this._setBgMethod('daynight')}>
              <ha-icon icon="mdi:theme-light-dark"></ha-icon>
              <span>Day / Night</span>
            </button>
            <button type="button" class="ec-mode-tile${method === 'state' ? ' active' : ''}"
              @click=${() => this._setBgMethod('state')}>
              <ha-icon icon="mdi:image-multiple-outline"></ha-icon>
              <span>State Entity</span>
            </button>
          </div>
          <p class="ec-hint">${
            method === 'single' ? 'One fixed background image.'
            : method === 'daynight' ? 'Two sets of images — one for day, one for night — with an EV variant per set.'
            : "One image per entity state. Nothing matching paints no background, so cover every state you care about."
          }</p>

          ${method === 'single' ? html`
            ${this._row('Image path',
              html`<div style="display:flex;gap:4px;align-items:center;">
                <input class="ec-input" type="text" style="flex:1;min-width:0;"
                  .value=${bg.url ?? ''}
                  placeholder="/local/image.png or https://…"
                  @change=${(e: Event) =>
                    this._updateBackground({ url: (e.target as HTMLInputElement).value.trim() || undefined })}
                />
                ${this._imagePickBtn((path) => this._updateBackground({ url: path }))}
              </div>`,
              'The image drawn behind the whole canvas.')}
          ` : nothing}

          ${method === 'state' ? html`
            ${this._entitySelector({
              entity: bg.entity,
              onEntity: (v) => this._updateBackground({ entity: v || undefined }),
            })}
            <div class="ec-subsection-title">Rules</div>
            ${rules.length === 0
              ? this._emptyAdd('No rules yet — add one', () => setRules([...rules, {}]))
              : rules.map((r, ri) => this._itemCard({
                  icon: r.url ? 'mdi:image-check-outline' : 'mdi:image-off-outline',
                  label: MosaicCanvasEditor._bgRuleName(r, ri),
                  sub: MosaicCanvasEditor._bgRuleSub(r),
                  selected: ri === this._selCanvasBgRule,
                  onClick: () => {
                    this._selCanvasBgRule = ri;
                    this._navPush(`cbgr:${ri}`, MosaicCanvasEditor._bgRuleName(r, ri));
                  },
                  actions: html`
                    <button class="ec-btn-remove" title="Remove rule"
                      @click=${(e: Event) => { e.stopPropagation(); setRules(rules.filter((_, i) => i !== ri)); }}>✕</button>
                  `,
                }))}
            <div style="display:flex;gap:6px;margin-top:6px;">
              <button class="ec-btn-add" @click=${() => setRules([...rules, {}])}>+ Rule</button>
            </div>
            <p class="ec-hint">Each rule stands alone — one state value, one image. A value matches the state as text, as a number (<code>21</code> matches <code>21.0</code>) or as a boolean (<code>true</code> matches <code>on</code>).</p>
          ` : nothing}

          ${method !== 'daynight' ? nothing : html`
          ${this._row('Source',
            html`<select class="ec-select"
              .value=${source}
              @change=${(e: Event) => this._updateBackground({ source: (e.target as HTMLSelectElement).value as BackgroundConfig['source'] })}
            >
              <option value="auto" .selected=${source === 'auto'}>auto (sun)</option>
              <option value="day" .selected=${source === 'day'}>day</option>
              <option value="night" .selected=${source === 'night'}>night</option>
              <option value="entity" .selected=${source === 'entity'}>entity</option>
            </select>`)}

          ${source === 'auto' || source === undefined
            ? this._entitySelector({
                label: 'Sun entity',
                entity: bg.sun_entity,
                onEntity: (v) => this._updateBackground({ sun_entity: v }),
                attribute: bg.sun_attribute,
                onAttribute: (v) => this._updateBackground({ sun_attribute: v }),
              })
            : nothing}

          ${source === 'entity'
            ? this._entitySelector({
                label: 'Mode entity',
                entity: bg.mode_entity,
                onEntity: (v) => this._updateBackground({ mode_entity: v }),
                attribute: bg.mode_attribute,
                onAttribute: (v) => this._updateBackground({ mode_attribute: v }),
              })
            : nothing}

          ${this._numRow('EV count', { value: this._config.ev_count, onChange: (v) => this._emit({ ...this._config!, ev_count: v }), min: 0, placeholder: '0' })}

          <div class="ec-subsection-title">Images</div>
          <p class="ec-hint">One Day and one Night image per EV variant — raising EV count adds rows.</p>

          ${(() => {
            const evCount = Math.max(0, this._config?.ev_count ?? 0);
            const counts = Array.from({ length: evCount + 1 }, (_, i) => String(i));
            return (['day', 'night'] as const).map((mode) => html`
              <div class="ec-subsection-title ec-subsection-title--minor">${mode}</div>
              ${counts.map((count) => this._row(
                `${mode} / ${count} EV`,
                html`<div style="display:flex;gap:4px;align-items:center;">
                  <input class="ec-input" type="text" style="flex:1;min-width:0;"
                    .value=${bg.images?.[mode]?.[count] ?? ''}
                    placeholder="/local/image.png or https://…"
                    @change=${(e: Event) =>
                      this._setBgImage(mode, count, (e.target as HTMLInputElement).value)}
                  />
                  ${this._imagePickBtn((path) => this._setBgImage(mode, count, path))}
                </div>`,
              ))}
            `);
          })()}
          `}

          ${/* Fit belongs to no one method — it applies to whichever image the
                chosen method ends up painting, so it sits outside all three. */
            this._row('Background fit',
            html`<select class="ec-select"
              .value=${bg.fit ?? sd('background_fit') ?? 'cover'}
              @change=${(e: Event) => this._updateBackground({ fit: (e.target as HTMLSelectElement).value as 'cover' | 'contain' })}
            >
              <option value="cover" .selected=${(bg.fit ?? sd('background_fit') ?? 'cover') === 'cover'}>cover</option>
              <option value="contain" .selected=${bg.fit === 'contain'}>contain</option>
            </select>`)}
          <p class="ec-hint">Overrides the Canvas Size section's "Fit" when set. Leave unset to use that value.</p>
    `;
  }

  /** Terminal screen for one canvas background rule — the canvas twin of _cardSecBgRule. */
  private _canvasSecBgRule(ri: number): TemplateResult {
    const bg = this._config?.background ?? {};
    const rules = bg.rules ?? [];
    const rule = rules[ri];
    if (!rule) return this._navDeadEnd();
    const upd = (patch: Partial<BackgroundRule>): void =>
      this._updateBackground({ rules: rules.map((r, i) => (i === ri ? { ...r, ...patch } : r)) });
    const state = bg.entity ? this.hass?.states[bg.entity]?.state : undefined;
    return html`
      <div class="ec-section">
        ${this._row('Value',
          html`<input class="ec-input" type="text"
            .value=${rule.value ?? ''}
            placeholder=${state ?? 'e.g. on, 21, heat'}
            @change=${(e: Event) => upd({ value: (e.target as HTMLInputElement).value.trim() || undefined })}
          />`,
          'The entity state this rule matches. Text, a number, or a boolean.')}
        ${state != null
          ? html`<p class="ec-hint">${bg.entity} is currently <b>${state}</b>.</p>`
          : nothing}
        ${this._row('Image path',
          html`<div style="display:flex;gap:4px;align-items:center;">
            <input class="ec-input" type="text" style="flex:1;min-width:0;"
              .value=${rule.url ?? ''}
              placeholder="/local/image.png or https://…"
              @change=${(e: Event) => upd({ url: (e.target as HTMLInputElement).value.trim() || undefined })}
            />
            ${this._imagePickBtn((path) => upd({ url: path }))}
          </div>`,
          'Shown while the state matches. Leave blank to skip this rule.')}
      </div>
    `;
  }

  private static readonly _TEMPLATE_SECTIONS: NavSectionDef[] = [
    { key: 'sec:export',    label: 'Export Template',         hint: 'Save the current layout as a file',           icon: 'mdi:download' },
    { key: 'sec:import',    label: 'Import Template',         hint: 'Load a saved layout file',                    icon: 'mdi:upload' },
    { key: 'sec:varexport', label: 'Export Control Variants', hint: "Save this card's custom variants as a file",  icon: 'mdi:shape-plus' },
    { key: 'sec:varimport', label: 'Import Control Variants', hint: 'Merge custom variants from a file',           icon: 'mdi:shape-outline' },
  ];

  private _renderTemplatesRibbonPanel(): TemplateResult {
    const path = this._navPath;
    if (path.length === 0) {
      return this._navMenu(MosaicCanvasEditor._TEMPLATE_SECTIONS);
    }
    if (path[0].key === 'sec:import') return this._templatesSecImport();
    if (path[0].key === 'sec:varexport') return this._templatesSecVariantExport();
    if (path[0].key === 'sec:varimport') return this._templatesSecVariantImport();
    if (path[0].key === 'sec:export') return this._templatesSecExport();
    // Unrecognised key — was previously an unconditional fall-through to
    // _templatesSecExport(), which could mask a stale/typo'd crumb key behind
    // a plausible-looking screen. Fail visibly instead.
    console.warn(`[mosaic-canvas-card] Templates panel: unknown section key "${path[0].key}"`);
    return this._navDeadEnd('This editor screen is unavailable — press Back to recover.');
  }

  private _templatesSecVariantExport(): TemplateResult {
    const reg = this._config?.defaults?.control_variants ?? {};
    const count = Object.values(reg).reduce((n, l) => n + (l?.length ?? 0), 0);
    return html`
      <div class="ec-section">
        <p class="ec-hint">
          Exports only the custom control variants built in <b>Settings ▸ Global Defaults ▸ Control Default ▸ Variant Builder</b> —
          not the card layout. The file uses the same shape as Mosaic's built-in variant registry.
        </p>
        ${count === 0
          ? html`<p class="ec-empty">No custom variants to export.</p>`
          : html`
            ${this._row('Name',
              html`<input class="ec-input" type="text"
                .value=${this._templateName}
                placeholder="My Control Variants"
                @input=${(e: Event) => { this._templateName = (e.target as HTMLInputElement).value; }}
              />`)}
            <p class="ec-hint">${count} variant${count === 1 ? '' : 's'} across ${Object.keys(reg).length} control type${Object.keys(reg).length === 1 ? '' : 's'}.</p>
            <button class="ec-btn-add" style="width:100%;"
              @click=${() => downloadVariantPack(buildVariantPack(reg, this._templateName || 'Mosaic Control Variants'))}
            >⬇ Download control variants</button>
          `}
      </div>
    `;
  }

  private _templatesSecVariantImport(): TemplateResult {
    if (!this._config) return html``;
    return html`
      <div class="ec-section">
        <p class="ec-hint">
          Merges variants from a file into this card. Unlike <b>Import Template</b>, this
          <b>does not touch your layout</b> — it only adds control variants. An incoming variant whose
          id is already used is imported under a new id, so nothing is overwritten.
        </p>
        <input type="file" accept=".json,application/json" style="display:none" id="ec-variant-import"
          @change=${(e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            (e.target as HTMLInputElement).value = '';
            if (!file || !this._config) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
              const { pack, error } = parseVariantPack(ev.target?.result as string);
              if (error || !pack) { this._variantImportError = error ?? 'Unknown error.'; return; }
              const current = this._config?.defaults?.control_variants ?? {};
              const { merged, added, renamed } = mergeVariantPack(current, pack);
              if (added === 0) { this._variantImportError = 'That file contained no control variants.'; return; }
              const summary = renamed > 0
                ? `Import ${added} variant(s) from "${pack.name}"?\n\n${renamed} had an id already in use and will be imported under a new id.`
                : `Import ${added} variant(s) from "${pack.name}"?`;
              if (!window.confirm(summary)) return;
              this._variantImportError = '';
              this._updateDefaults({ control_variants: merged });
              setUserVariants(merged);
            };
            reader.readAsText(file);
          }}
        />
        <button class="ec-btn-add" style="width:100%;"
          @click=${() => this.shadowRoot?.querySelector<HTMLInputElement>('#ec-variant-import')?.click()}
        >⬆ Import from file</button>
        ${this._variantImportError
          ? html`<p style="color:#f44;font-size:12px;margin:6px 0 0;">${this._variantImportError}</p>`
          : nothing}
      </div>
    `;
  }

  private _templatesSecExport(): TemplateResult {
    if (!this._config) return html``;
    return html`
      <div class="ec-section">
          ${this._row('Name',
            html`<input class="ec-input" type="text"
              .value=${this._templateName}
              placeholder="My Mosaic Dashboard"
              @input=${(e: Event) => { this._templateName = (e.target as HTMLInputElement).value; }}
            />`)}
          ${this._row('Include entities',
            html`<input type="checkbox" .checked=${this._templateIncludeEntities}
              @change=${(e: Event) => { this._templateIncludeEntities = (e.target as HTMLInputElement).checked; }}
            />`)}
          ${this._templateIncludeEntities
            ? nothing
            : html`<p class="ec-hint">Entity, device and area references are removed from the file, so the
                template can be shared — whoever imports it picks their own entities. References to this
                card's Virtuals are kept.</p>`}
          <button class="ec-btn-add" style="width:100%;margin-bottom:12px;"
            @click=${() => {
              if (!this._config) return;
              const t = buildTemplate(this._config, this._templateName || 'Mosaic Canvas Template',
                { includeEntities: this._templateIncludeEntities });
              downloadTemplate(t);
            }}
          >⬇ Download template</button>
      </div>
    `;
  }

  private _templatesSecImport(): TemplateResult {
    if (!this._config) return html``;
    return html`
      <div class="ec-section">
          <p style="font-size:12px;color:#4a8aaa;margin:0 0 8px;">
            Importing will replace the entire card configuration.
          </p>
          <input type="file" accept=".json,application/json"
            style="display:none"
            id="ec-template-import"
            @change=${(e: Event) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (!file || !this._config) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                const text = ev.target?.result as string;
                const { template, error } = parseTemplate(text);
                if (error || !template) {
                  this._templateError = error ?? 'Unknown error.';
                  return;
                }
                if (!window.confirm(`Import "${template.name}"?\n\nThis will replace your entire card configuration.`)) return;
                this._templateError = '';
                this._emit(applyTemplate(template, this._config!.type));
              };
              reader.readAsText(file);
              (e.target as HTMLInputElement).value = '';
            }}
          />
          <button class="ec-btn-add" style="width:100%;"
            @click=${() => {
              this.shadowRoot?.querySelector<HTMLInputElement>('#ec-template-import')?.click();
            }}
          >⬆ Import from file</button>
          ${this._templateError
            ? html`<p style="color:#f44;font-size:12px;margin:6px 0 0;">${this._templateError}</p>`
            : nothing}
      </div>
    `;
  }

  private static readonly _VIRTUAL_OPS: { value: VirtualOp; label: string }[] = [
    { value: 'add',        label: 'Add (sum all)' },
    { value: 'subtract',   label: 'Subtract (first − rest)' },
    { value: 'mean',       label: 'Mean (average)' },
    { value: 'signed_net', label: 'Signed net (input[0] − input[1])' },
    { value: 'time_until', label: 'Time Until' },
    { value: 'statistic',  label: 'Statistic' },
  ];

  /** Section defs for one virtual, resolved against its operation.
   *  List-op virtuals (add/subtract/…) edit their inputs inline on the same
   *  screen, so Defaults is their only section. */
  /** Paths are VirtualConfig-relative — see `_virtualScope`. `inputs` belongs to
   *  the `vin:` screens below this menu, so no section here claims it. */
  private _virtualSectionDefs(v: VirtualConfig): NavSectionDef<VirtualConfig>[] {
    const defs: NavSectionDef<VirtualConfig>[] = [
      { key: 'sec:defaults', label: 'Virtual Defaults', hint: 'Name, operation, unit', icon: 'mdi:tune',
        paths: ['name', 'op', 'unit'] },
    ];
    if (v.op === 'time_until') {
      // Five of these rows are current/legacy pairs: each reads `current ??
      // legacy` and writes the current key while clearing the legacy one. Both
      // members belong here — a config carrying the legacy spelling from older
      // YAML genuinely holds an override this screen surfaces, so it has to be
      // counted and cleared. Pairs: value_entity/pct_entity,
      // rate_entity/power_entity, capacity/capacity_kwh, label_max/label_full,
      // label_min/label_empty.
      defs.push({ key: 'sec:tu',   label: 'Time Until Settings', hint: 'Mode, entities, capacity, labels', icon: 'mdi:progress-clock',
        paths: ['mode',
                'value_entity', 'pct_entity',
                'rate_entity', 'power_entity',
                'rate_unit_override', 'recalc_above', 'recalc_below',
                'capacity_entity', 'capacity', 'capacity_kwh',
                'label_max', 'label_full', 'label_min', 'label_empty'] });
      defs.push({ key: 'sec:trig', label: 'Extra Triggers',      hint: 'Up to 2 labelled thresholds',      icon: 'mdi:flag-outline',
        paths: ['triggers'] });
    } else if (v.op === 'statistic') {
      defs.push({ key: 'sec:value', label: 'Value',         hint: 'Source entity + attribute',                    icon: 'mdi:database-outline',
        paths: ['entity', 'attribute'] });
      defs.push({ key: 'sec:stats', label: 'HA Statistics', hint: 'Period, stat type, advanced characteristic', icon: 'mdi:chart-box-outline',
        paths: MosaicCanvasEditor._STAT_PATHS });
    }
    return defs;
  }

  private _virtualScope(vi: number): SectionScope<VirtualConfig> {
    return {
      root: this._virtuals()[vi],
      apply: (patch) => this._updateVirtual(vi, patch),
    };
  }

  private _renderVirtualsRibbonPanel(): TemplateResult {
    const path = this._navPath;
    const virtuals = this._virtuals();
    if (path.length === 0) {
      return html`
        <div class="ec-section-header">
          <span></span>
          <div style="display:flex;gap:4px;">
            ${this._virtualClipboard ? html`<button class="ec-btn-add" @click=${this._pasteVirtual} title="Paste virtual">⎘ Paste</button>` : nothing}
            <button class="ec-btn-add" @click=${this._addVirtual}>+ Virtual</button>
          </div>
        </div>
        ${virtuals.length === 0
          ? this._emptyAdd('No virtuals yet — add one', () => this._addVirtual())
          : virtuals.map((v, vi) => this._itemCard({
              dragKey: `virt:${vi}`,
              icon: v.op === 'time_until' ? 'mdi:progress-clock' : 'mdi:memory',
              label: v.name || v.id,
              sub: MosaicCanvasEditor._VIRTUAL_OPS.find((o) => o.value === v.op)?.label ?? v.op,
              selected: vi === this._selVirtual,
              onClick: () => { this._selVirtual = vi; this._navPush(`virt:${v.id}`, v.name || v.id); },
              actions: html`
                <button class="ec-btn-remove"
                  @click=${(e: Event) => { e.stopPropagation(); this._copyVirtual(vi); }}
                  title="Copy">⎘</button>
                <button class="ec-btn-dup"
                  @click=${(e: Event) => { e.stopPropagation(); this._duplicateVirtual(vi); }}
                  title="Duplicate virtual">⧉</button>
                <button class="ec-btn-remove"
                  @click=${(e: Event) => { e.stopPropagation(); this._removeVirtual(vi); }}
                  title="Remove">✕</button>
              `,
            }))}
      `;
    }
    const VI = this._crumbIndex(path[0].key, virtuals);
    this._selVirtual = VI;
    const selV = virtuals[VI];
    if (!selV) return this._navDeadEnd();
    if (path.length === 1) {
      return html`
        ${this._navMenu(this._virtualSectionDefs(selV), this._virtualScope(VI))}
        ${selV.op === 'time_until' || selV.op === 'statistic' ? nothing : html`
          <div class="ec-subsection-title">Inputs (in order) — drag to reorder</div>
          ${selV.inputs.length === 0
            ? this._emptyAdd('No inputs yet — add one', () => this._addVirtualInput(VI))
            : selV.inputs.map((inp, idx) => this._itemCard({
                dragKey: `vin:${VI}:${idx}`,
                icon: 'mdi:import',
                label: inp || `Input ${idx + 1}`,
                sub: inp ? `Input ${idx + 1}` : 'No entity selected',
                selected: idx === this._selVirtualInput,
                onClick: () => { this._selVirtualInput = idx; this._navPush(`vin:${idx}`, inp || `Input ${idx + 1}`); },
                actions: html`
                  <button class="ec-btn-dup"
                    @click=${(e: Event) => { e.stopPropagation(); this._duplicateVirtualInput(VI, idx); }}
                    title="Duplicate input">⧉</button>
                  <button class="ec-btn-remove"
                    @click=${(e: Event) => { e.stopPropagation(); this._removeVirtualInput(VI, idx); }}
                    title="Remove input">✕</button>
                `,
              }))}
          <button class="ec-btn-add" style="margin-top:4px;"
            @click=${() => this._addVirtualInput(VI)}>+ Input</button>
        `}
      `;
    }
    const key = path[1].key;
    if (key.startsWith('vin:')) {
      const idx = this._crumbIndex(key, selV.inputs);
      this._selVirtualInput = idx;
      return this._virtualSecInput(VI, idx);
    }
    if (path.length === 3 && key === 'sec:trig' && path[2].key.startsWith('trig:')) {
      const ti = this._crumbIndex(path[2].key, selV.triggers);
      this._selTrigger = ti;
      return this._virtualSecTriggerItem(VI, ti);
    }
    return this._virtualSection(VI, selV, key);
  }

  private _virtualSecInput(VI: number, idx: number): TemplateResult {
    const virtual = this._virtuals()[VI];
    const inp = virtual?.inputs[idx];
    if (!virtual || inp === undefined) return this._navDeadEnd();
    return html`
      <div class="ec-section">
          ${this._row('Entity',
            html`<ha-entity-picker
              .hass=${this.hass}
              .value=${inp}
              allow-custom-entity
              @value-changed=${(e: Event) =>
                this._updateVirtualInput(VI, idx, (e as CustomEvent<{ value: string }>).detail.value)}
            ></ha-entity-picker>`,
            "An entity feeding this virtual entity's calculation.")}
      </div>
    `;
  }

  private _virtualSection(VI: number, selV: VirtualConfig, key: string): TemplateResult {
    return html`
      ${this._clearOverridesBtn(
        MosaicCanvasEditor._findDef(this._virtualSectionDefs(selV), key), this._virtualScope(VI))}
      ${this._virtualSectionBody(VI, selV, key)}
    `;
  }

  private _virtualSectionBody(VI: number, selV: VirtualConfig, key: string): TemplateResult {
    if (key === 'sec:defaults') return this._virtualSecDefaults(VI, selV);
    if (key === 'sec:tu') return this._virtualSecTu(VI, selV);
    if (key === 'sec:trig') return this._virtualSecTrig(VI, selV);
    if (key === 'sec:value') return this._virtualSecValue(VI, selV);
    if (key === 'sec:stats') return this._virtualSecStats(VI, selV);
    return html``;
  }

  private _virtualSecValue(VI: number, selV: VirtualConfig): TemplateResult {
    return html`
      <div class="ec-section">
          ${this._entitySelector({
            entity: selV.entity,
            onEntity: (v) => this._updateVirtual(VI, { entity: v }),
            attribute: selV.attribute,
            onAttribute: (v) => this._updateVirtual(VI, { attribute: v }),
          })}
      </div>
    `;
  }

  private _virtualSecStats(VI: number, selV: VirtualConfig): TemplateResult {
    return html`
      <div class="ec-section">
          <div class="ec-subsection-title">HA Statistics integration</div>
          <p class="ec-hint">For advanced statistics (median, std dev, percentile, etc.) configure a Statistics integration sensor in HA and point the Value entity at it.</p>
          ${this._row('Period',
            html`<select class="ec-select"
              .value=${selV.stat_period ?? ''}
              @change=${(e: Event) => {
                const v = (e.target as HTMLSelectElement).value as StatPeriod | '';
                const isN = ['last_n_minutes','last_n_hours','last_n_days','last_n_months'].includes(v);
                this._updateVirtual(VI, {
                  stat_period: v || undefined,
                  stat_period_n: isN ? (selV.stat_period_n ?? undefined) : undefined,
                  stat_period_start: v === 'custom' ? (selV.stat_period_start ?? undefined) : undefined,
                  stat_period_end:   v === 'custom' ? (selV.stat_period_end   ?? undefined) : undefined,
                });
              }}
            >
              <option value="">Live state (no stats)</option>
              ${this._statPeriodGroups(selV.stat_period, true)}
            </select>`)}
          ${(['last_n_minutes','last_n_hours','last_n_days','last_n_months'] as const).includes(selV.stat_period as 'last_n_minutes') ? this._row(
            selV.stat_period === 'last_n_minutes' ? 'Number of minutes'
            : selV.stat_period === 'last_n_hours'  ? 'Number of hours'
            : selV.stat_period === 'last_n_days'   ? 'Number of days'
            : 'Number of months',
            this._numWrap(html`<input type="number" class="ec-input ec-input-num" min="1" step="1"
              .value=${String(selV.stat_period_n ?? '')}
              placeholder="e.g. 3"
              @change=${(e: Event) => {
                const v = parseInt((e.target as HTMLInputElement).value, 10);
                this._updateVirtual(VI, { stat_period_n: isNaN(v) || v < 1 ? undefined : v });
              }}
            />`)) : nothing}
          ${selV.stat_period === 'custom' ? html`
            ${this._row('Start', html`<input type="datetime-local" class="ec-input"
              .value=${selV.stat_period_start ?? ''}
              @change=${(e: Event) => this._updateVirtual(VI, { stat_period_start: (e.target as HTMLInputElement).value || undefined })}
            />`)}
            ${this._row('End', html`<input type="datetime-local" class="ec-input"
              .value=${selV.stat_period_end ?? ''}
              @change=${(e: Event) => this._updateVirtual(VI, { stat_period_end: (e.target as HTMLInputElement).value || undefined })}
            />`)}
          ` : nothing}
          ${selV.stat_period ? this._row('Stat type',
            html`<select class="ec-select"
              .value=${selV.stat_type ?? sd('stat_type') ?? 'sum'}
              @change=${(e: Event) => this._updateVirtual(VI, { stat_type: (e.target as HTMLSelectElement).value as StatType })}
            >
              <option value="sum"        .selected=${(selV.stat_type ?? sd('stat_type') ?? 'sum') === 'sum'}>Sum (total)</option>
              <option value="difference" .selected=${selV.stat_type === 'difference'}>Difference (end − start)</option>
              <option value="mean"       .selected=${selV.stat_type === 'mean'}>Mean (average)</option>
              <option value="max"        .selected=${selV.stat_type === 'max'}>Maximum</option>
              <option value="min"        .selected=${selV.stat_type === 'min'}>Minimum</option>
              <option value="count"      .selected=${selV.stat_type === 'count'}>Count (recorder records)</option>
              <option value="range"      .selected=${selV.stat_type === 'range'}>Range (max − min)</option>
            </select>`) : nothing}
          ${selV.stat_type === 'count' ? html`<p class="ec-hint">Counts the statistics records Home Assistant
            holds for the window, and the recorder's resolution changes with the window's length — the same
            sensor gives 12 records for the last hour (five-minute records) and 1 for today (a daily one).
            It answers "how much statistics data is there", not "how many times did this happen".</p>` : nothing}

          ${this._row('Adv statistics mode (opt)',
            html`<select class="ec-select"
              .value=${selV.stat_characteristic ?? ''}
              @change=${(e: Event) => {
                const v = (e.target as HTMLSelectElement).value;
                this._updateVirtual(VI, { stat_characteristic: (v as StatCharacteristic) || undefined });
              }}
            >
              <option value="">— none —</option>
              ${['Averages','Extremes','Spread','Change','Sums','Counts','Timestamps'].map(grp => html`
                <optgroup label="${grp}">
                  ${STAT_CHARACTERISTICS.filter(c => c.group === grp).map(c => html`
                    <option value=${c.value} .selected=${selV.stat_characteristic === c.value}>
                      ${c.label}${c.binary ? ' ✦' : ''}
                    </option>`)}
                </optgroup>`)}
            </select>`)}
          <p class="ec-hint" style="margin-top:2px">✦ also valid for binary sensors</p>
          ${selV.stat_characteristic === 'percentile' ? this._numRow('Percentile (1–99)', { value: selV.stat_percentile, onChange: (v) => this._updateVirtual(VI, { stat_percentile: v }), min: 1, max: 99, placeholder: '50' }) : nothing}
          ${this._numRow('Max age (hours)', { value: selV.stat_max_age_hours, onChange: (v) => this._updateVirtual(VI, { stat_max_age_hours: v }), min: 1, placeholder: '(none)' })}
          ${this._numRow('Sampling size', { value: selV.stat_sampling_size, onChange: (v) => this._updateVirtual(VI, { stat_sampling_size: v }), min: 1, placeholder: '(none)' })}
          ${selV.stat_characteristic && selV.entity ? html`
            <div class="ec-stat-yaml">
              <div class="ec-stat-yaml-header">
                <span>HA configuration.yaml</span>
                <button class="ec-btn-copy" title="Copy YAML"
                  @click=${() => {
                    const yaml = generateStatisticsYaml(selV.entity!, selV.stat_characteristic!, selV.stat_max_age_hours, selV.stat_sampling_size, selV.stat_percentile);
                    void navigator.clipboard.writeText(yaml);
                  }}>⎘ Copy</button>
              </div>
              <pre class="ec-stat-yaml-code">${generateStatisticsYaml(selV.entity!, selV.stat_characteristic!, selV.stat_max_age_hours, selV.stat_sampling_size, selV.stat_percentile)}</pre>
            </div>
          ` : nothing}
      </div>
    `;
  }

  private _virtualSecDefaults(VI: number, selV: VirtualConfig): TemplateResult {
    return html`
      <div class="ec-section">
              ${this._row('Name',
                html`<input class="ec-input" type="text" .value=${selV.name}
                  @change=${(e: Event) => this._updateVirtual(VI, { name: (e.target as HTMLInputElement).value })}
                />`,
                'Names this virtual entity wherever it can be picked.')}

              ${this._row('Operation',
                html`<select class="ec-select"
                  .value=${selV.op}
                  @change=${(e: Event) => this._updateVirtual(VI, { op: (e.target as HTMLSelectElement).value as VirtualOp })}
                >
                  ${MosaicCanvasEditor._VIRTUAL_OPS.map((o) => html`<option value=${o.value} .selected=${selV.op === o.value}>${o.label}</option>`)}
                </select>`,
                'How the input entities are combined into one value.')}

              ${selV.op !== 'time_until' ? this._row('Unit override',
                html`<input class="ec-input" type="text" .value=${selV.unit ?? ''}
                  placeholder="(from inputs[0])"
                  @change=${(e: Event) => {
                    const v = (e.target as HTMLInputElement).value;
                    this._updateVirtual(VI, { unit: v || undefined });
                  }}
                />`,
                "Shown after the value. Unset uses the first input entity's unit.") : nothing}
      </div>
    `;
  }

  private _virtualSecTu(VI: number, selV: VirtualConfig): TemplateResult {
    return html`
      <div class="ec-section">
                ${this._row('Mode',
                  html`<select class="ec-select"
                    .value=${selV.mode ?? sd('virtual_mode') ?? 'percent'}
                    @change=${(e: Event) =>
                      this._updateVirtual(VI, { mode: (e.target as HTMLSelectElement).value as 'percent' | 'absolute' })}
                  >
                    <option value="percent"  .selected=${(selV.mode ?? sd('virtual_mode') ?? 'percent') === 'percent'}>% based</option>
                    <option value="absolute" .selected=${selV.mode === 'absolute'}>Absolute value</option>
                  </select>`)}

                ${this._row((selV.mode ?? sd('virtual_mode') ?? 'percent') === 'percent' ? '% entity' : 'Current value entity',
                  html`<ha-entity-picker
                    .hass=${this.hass}
                    .value=${selV.value_entity ?? selV.pct_entity ?? ''}
                    allow-custom-entity
                    @value-changed=${(e: Event) =>
                      this._updateVirtual(VI, { value_entity: (e as CustomEvent<{ value: string }>).detail.value || undefined, pct_entity: undefined })}
                  ></ha-entity-picker>`)}

                ${this._row('Rate entity',
                  html`<ha-entity-picker
                    .hass=${this.hass}
                    .value=${selV.rate_entity ?? selV.power_entity ?? ''}
                    allow-custom-entity
                    @value-changed=${(e: Event) =>
                      this._updateVirtual(VI, { rate_entity: (e as CustomEvent<{ value: string }>).detail.value || undefined, power_entity: undefined })}
                  ></ha-entity-picker>`)}

                ${this._row('Rate unit override',
                  html`<input class="ec-input" type="text"
                    .value=${selV.rate_unit_override ?? ''}
                    placeholder="auto-detect from entity"
                    @change=${(e: Event) => {
                      const val = (e.target as HTMLInputElement).value;
                      this._updateVirtual(VI, { rate_unit_override: val || undefined });
                    }}
                  />`)}
                <p class="ec-hint">Auto-detected from the rate entity; only set this if auto-detection fails.</p>

                ${this._row('Recalc above (rate)',
                  this._numWrap(html`<input class="ec-input ec-input-num" type="number" step="any"
                    .value=${selV.recalc_above != null ? String(selV.recalc_above) : ''}
                    placeholder="e.g. 100"
                    @change=${(e: Event) => {
                      const n = parseFloat((e.target as HTMLInputElement).value);
                      this._updateVirtual(VI, { recalc_above: Number.isFinite(n) ? n : undefined });
                    }}
                  />`))}

                ${this._row('Recalc below (rate)',
                  this._numWrap(html`<input class="ec-input ec-input-num" type="number" step="any"
                    .value=${selV.recalc_below != null ? String(selV.recalc_below) : ''}
                    placeholder="e.g. -160"
                    @change=${(e: Event) => {
                      const n = parseFloat((e.target as HTMLInputElement).value);
                      this._updateVirtual(VI, { recalc_below: Number.isFinite(n) ? n : undefined });
                    }}
                  />`))}
                <p class="ec-hint">Only recompute Time Until when the raw rate reading is above and/or below these (signed, in the rate entity's units). Inside the band the last value is frozen. Leave blank to always recalculate.</p>

                ${this._row('Capacity entity',
                  html`<ha-entity-picker
                    .hass=${this.hass}
                    .value=${selV.capacity_entity ?? ''}
                    allow-custom-entity
                    @value-changed=${(e: Event) =>
                      this._updateVirtual(VI, { capacity_entity: (e as CustomEvent<{ value: string }>).detail.value || undefined })}
                  ></ha-entity-picker>`)}

                ${this._row('Capacity (Manual)',
                  this._numWrap(html`<input class="ec-input ec-input-num" type="number" min="0" step="0.1"
                    .value=${String(selV.capacity ?? selV.capacity_kwh ?? '')}
                    placeholder="e.g. 13.5"
                    @change=${(e: Event) => {
                      const n = parseFloat((e.target as HTMLInputElement).value);
                      this._updateVirtual(VI, { capacity: Number.isFinite(n) ? n : undefined, capacity_kwh: undefined });
                    }}
                  />`))}

                ${this._row('Maximum label',
                  html`<input class="ec-input" type="text"
                    .value=${selV.label_max ?? selV.label_full ?? ''}
                    placeholder="Full"
                    @change=${(e: Event) => {
                      const val = (e.target as HTMLInputElement).value;
                      this._updateVirtual(VI, { label_max: val || undefined, label_full: undefined });
                    }}
                  />`)}

                ${this._row('Minimum label',
                  html`<input class="ec-input" type="text"
                    .value=${selV.label_min ?? selV.label_empty ?? ''}
                    placeholder="Empty"
                    @change=${(e: Event) => {
                      const val = (e.target as HTMLInputElement).value;
                      this._updateVirtual(VI, { label_min: val || undefined, label_empty: undefined });
                    }}
                  />`)}
      </div>
    `;
  }

  private _virtualSecTrig(VI: number, selV: VirtualConfig): TemplateResult {
    return html`
      ${(selV.triggers ?? []).length === 0
        ? this._emptyAdd('No extra triggers yet — add one', () => {
            const triggers: TimeUntilTrigger[] = [...(selV.triggers ?? []), { value: 20, label: 'Reserve' }];
            this._updateVirtual(VI, { triggers });
          })
        : (selV.triggers ?? []).map((t: TimeUntilTrigger, ti: number) => this._itemCard({
            dragKey: `trig:${VI}:${ti}`,
            icon: 'mdi:flag-outline',
            label: t.label || `Trigger ${ti + 1}`,
            // back-compat: old configs stored percent instead of value (see view.ts computeVirtuals)
            sub: `${(t as unknown as { percent?: number }).percent ?? t.value}${(selV.mode ?? sd('virtual_mode') ?? 'percent') === 'percent' ? '%' : ''}`,
            selected: ti === this._selTrigger,
            onClick: () => { this._selTrigger = ti; this._navPush(`trig:${ti}`, t.label || `Trigger ${ti + 1}`); },
            actions: html`
              ${(selV.triggers ?? []).length < 2 ? html`<button class="ec-btn-dup" title="Duplicate trigger"
                @click=${(e: Event) => { e.stopPropagation(); this._duplicateTrigger(VI, ti); }}>⧉</button>` : nothing}
              <button class="ec-btn-remove" title="Remove trigger"
                @click=${(e: Event) => {
                  e.stopPropagation();
                  const triggers = (selV.triggers ?? []).filter((_, i) => i !== ti);
                  this._updateVirtual(VI, { triggers: triggers.length ? triggers : undefined });
                }}>✕</button>
            `,
          }))}
      ${(selV.triggers ?? []).length < 2 ? html`
        <button class="ec-btn-add" style="margin-top:6px"
          @click=${() => {
            const triggers: TimeUntilTrigger[] = [...(selV.triggers ?? []), { value: 20, label: 'Reserve' }];
            this._updateVirtual(VI, { triggers });
          }}>+ Trigger</button>
      ` : nothing}
      <p class="ec-hint" style="margin-top:10px">Auto-switches to the nearest trigger ahead in the current direction.</p>
    `;
  }

  private _virtualSecTriggerItem(VI: number, ti: number): TemplateResult {
    const selV = this._virtuals()[VI];
    const t = selV?.triggers?.[ti];
    if (!selV || !t) return this._navDeadEnd();
    return html`
      <div class="ec-section">
          ${this._row((selV.mode ?? sd('virtual_mode') ?? 'percent') === 'percent' ? 'Percent' : 'Value',
            html`${this._numWrap(html`<input class="ec-input ec-input-num" type="number"
              step="${(selV.mode ?? sd('virtual_mode') ?? 'percent') === 'percent' ? '1' : 'any'}"
              .value=${String(
                // back-compat: old configs stored percent instead of value (see view.ts computeVirtuals)
                (t as unknown as { percent?: number }).percent ?? t.value,
              )}
              @change=${(e: Event) => {
                const n = parseFloat((e.target as HTMLInputElement).value);
                const triggers = [...(selV.triggers ?? [])];
                triggers[ti] = { ...triggers[ti]!, value: Number.isFinite(n) ? n : t.value };
                this._updateVirtual(VI, { triggers });
              }}
            />`)}`)}
          ${this._row('Label',
            html`<input class="ec-input" type="text" .value=${t.label}
              placeholder="Label"
              @change=${(e: Event) => {
                const triggers = [...(selV.triggers ?? [])];
                triggers[ti] = { ...triggers[ti]!, label: (e.target as HTMLInputElement).value };
                this._updateVirtual(VI, { triggers });
              }}
            />`)}
      </div>
    `;
  }

  /** Paths are ZoneConfig-relative — see `_zoneScope`. */
  private static readonly _ZONE_SECTIONS: NavSectionDef<ZoneConfig>[] = [
    { key: 'sec:defaults', label: 'Zone Defaults', hint: 'Name, position, anchor, size, overlay', icon: 'mdi:tune',        terms: 'name x y position width height color radius',
      paths: ['name', 'position.x', 'position.y', 'anchor', 'width', 'height', 'color', 'radius'] },
    { key: 'sec:actions',  label: 'Actions',       hint: 'Tap · hold · double tap',               icon: 'mdi:gesture-tap', terms: ACTION_TERMS,
      paths: ACTION_PATHS },
  ];

  private _zoneScope(zi: number): SectionScope<ZoneConfig> {
    return {
      root: this._zones()[zi],
      apply: (patch) => this._updateZone(zi, patch),
    };
  }

  private _renderZonesRibbonPanel(): TemplateResult {
    const path = this._navPath;
    const zones = this._zones();
    if (path.length === 0) {
      return html`
        <p style="font-size:12px;color:#4a8aaa;margin:0 0 8px;">
          Invisible hotspot regions that trigger actions when tapped. Drag the dashed handles in the preview to reposition.
        </p>
        <div class="ec-section-header">
          <span></span>
          <button class="ec-btn-add" @click=${this._addZone}>+ Clickable Zone</button>
        </div>
        ${zones.length === 0
          ? this._emptyAdd('No clickable zones yet — add one', () => this._addZone())
          : zones.map((z, zi) => this._itemCard({
              dragKey: `zone:${zi}`,
              icon: 'mdi:gesture-tap-box',
              label: z.name ?? z.id,
              sub: `${z.width}×${z.height}px`,
              selected: zi === this._selZone,
              onClick: () => { this._selZone = zi; this._navPush(`zone:${z.id}`, z.name ?? z.id); },
              actions: html`
                <button class="ec-btn-dup"
                  @click=${(e: Event) => { e.stopPropagation(); this._duplicateZone(zi); }}
                  title="Duplicate zone">⧉</button>
                <button class="ec-btn-remove"
                  @click=${(e: Event) => { e.stopPropagation(); this._removeZone(zi); }}
                  title="Remove">✕</button>
              `,
            }))}
      `;
    }
    const ZI = this._crumbIndex(path[0].key, zones);
    this._selZone = ZI;
    const selZone = zones[ZI];
    if (!selZone) return this._navDeadEnd();
    if (path.length === 1) {
      return this._navMenu(MosaicCanvasEditor._ZONE_SECTIONS, this._zoneScope(ZI));
    }
    const zClear = this._clearOverridesBtn(
      MosaicCanvasEditor._findDef(MosaicCanvasEditor._ZONE_SECTIONS, path[1].key), this._zoneScope(ZI));
    if (path[1].key === 'sec:actions') return html`${zClear}${this._zoneSecActions(ZI, selZone)}`;
    return html`${zClear}${this._zoneSecDefaults(ZI, selZone)}`;
  }

  // DRIFT: row changes here must be mirrored in the sec:defaults entry of
  // _ZONE_SECTIONS `terms` (hidden search vocabulary, #61).
  private _zoneSecDefaults(ZI: number, selZone: ZoneConfig): TemplateResult {
    // position.x/y are 0-1 canvas fractions; these rows are labelled px, so
    // convert through the canvas dims like _embSecPos does.
    const { totalW: zoneTotalW, totalH: zoneTotalH } = computeCanvasDims(this._config);
    return html`
      <div class="ec-section">
              ${this._row('Name',
                html`<input class="ec-input" type="text" .value=${selZone.name ?? ''}
                  @change=${(e: Event) => this._updateZone(ZI, { name: (e.target as HTMLInputElement).value || undefined })}
                />`)}

              ${this._row('X (px)',
                html`${this._numWrap(html`<input class="ec-input ec-input-num" type="number"
                  .value=${String(Math.round(selZone.position.x * zoneTotalW))}
                  @change=${(e: Event) => this._updateZone(ZI, { position: { ...selZone.position, x: Number((e.target as HTMLInputElement).value) / zoneTotalW } })}
                />`)}`,
                "Distance from the left edge of the canvas to the zone's anchor point.")}

              ${this._row('Y (px)',
                html`${this._numWrap(html`<input class="ec-input ec-input-num" type="number"
                  .value=${String(Math.round(selZone.position.y * zoneTotalH))}
                  @change=${(e: Event) => this._updateZone(ZI, { position: { ...selZone.position, y: Number((e.target as HTMLInputElement).value) / zoneTotalH } })}
                />`)}`,
                "Distance from the top edge of the canvas to the zone's anchor point.")}

              ${this._row('Anchor',
                html`<select class="ec-select"
                  .value=${selZone.anchor ?? sd('anchor') ?? 'top-left'}
                  @change=${(e: Event) => this._updateZone(ZI, { anchor: (e.target as HTMLSelectElement).value as Anchor })}
                >
                  ${ANCHORS.map((a) => html`<option value=${a} .selected=${(selZone.anchor ?? sd('anchor') ?? 'top-left') === a}>${ANCHOR_LABELS[a]}</option>`)}
                </select>`,
                'Which corner of the zone sits at its X/Y position.')}

              ${this._row('Width (px)',
                html`${this._numWrap(html`<input class="ec-input ec-input-num" type="number" min="1"
                  .value=${String(selZone.width)}
                  @change=${(e: Event) => this._updateZone(ZI, { width: Math.max(1, Number((e.target as HTMLInputElement).value)) })}
                />`)}`)}

              ${this._row('Height (px)',
                html`${this._numWrap(html`<input class="ec-input ec-input-num" type="number" min="1"
                  .value=${String(selZone.height)}
                  @change=${(e: Event) => this._updateZone(ZI, { height: Math.max(1, Number((e.target as HTMLInputElement).value)) })}
                />`)}`)}

              ${this._row('Overlay color',
                this._colorPicker(`zone-${ZI}-overlay`, selZone.color, (v) => this._updateZone(ZI, { color: v }), { clearTitle: 'Clear' }),
                'Tints the zone so it can be seen on the dashboard. Leave blank for an invisible tap target.')}

              ${this._numRow('Radius (px)', { value: selZone.radius, onChange: (v) => this._updateZone(ZI, { radius: v }), min: 0, placeholder: '0',
                hint: "Rounds the zone's corners. Only visible with an overlay colour set." })}
      </div>
    `;
  }

  private _zoneSecActions(ZI: number, selZone: ZoneConfig): TemplateResult {
    return html`
      <div class="ec-section">
        ${this._actionRows(
          { tap_action: selZone.tap_action, hold_action: selZone.hold_action, double_tap_action: selZone.double_tap_action },
          (p) => this._updateZone(ZI, p),
        )}
      </div>
    `;
  }

  private static readonly _FLOW_STYLES: FlowStyle[] = ['dashes', 'dots', 'fluid', 'particles'];
  private static readonly _FLOW_SIDES: FlowSide[] = ['top', 'right', 'bottom', 'left', 'center'];

  /** Paths are FlowConfig-relative — see `_flowScope`. `points` belongs to the
   *  `pt:` screens below this menu, so no section here claims it. */
  private static readonly _FLOW_SECTIONS: NavSectionDef<FlowConfig>[] = [
    { key: 'sec:defaults', label: 'Flow Defaults', hint: 'Name, entity, min display power, invert',    icon: 'mdi:tune',
      paths: ['name', 'entity', 'min_power', 'invert'] },
    { key: 'sec:speed',    label: 'Speed',         hint: 'Slowest / fastest value → animation speed', icon: 'mdi:speedometer',
      paths: ['speed_min_value', 'speed_max_value', 'speed_min_duration', 'speed_max_duration', 'duration'] },
    // `color` is the legacy alias of `forward_color` — read as a fallback and
    // cleared on write, exactly like the Time Until pairs — so it stays listed.
    { key: 'sec:style',    label: 'Line Style',    hint: 'Style, colors, width, curve',                icon: 'mdi:brush-variant', terms: 'dashes dots fluid particles duration count',
      paths: ['style', 'forward_color', 'color', 'reverse_color', 'width', 'particle_count', 'curve'] },
  ];

  private _flowScope(fi: number): SectionScope<FlowConfig> {
    return {
      root: this._flows()[fi],
      apply: (patch) => this._updateFlow(fi, patch),
    };
  }

  private _renderFlowsRibbonPanel(): TemplateResult {
    const path = this._navPath;
    const flows = this._flows();
    if (path.length === 0) {
      return html`
        <div class="ec-section-header">
          <span></span>
          <button class="ec-btn-add" @click=${this._addFlow}>+ Flow Line</button>
        </div>
        ${flows.length === 0
          ? this._emptyAdd('No animated flow lines yet — add one', () => this._addFlow())
          : flows.map((f, fi) => this._itemCard({
              dragKey: `flow:${fi}`,
              icon: 'mdi:chart-timeline-variant',
              label: f.name ?? f.id,
              sub: `${f.style ?? 'dashes'}${f.entity ? ' · ' + (f.entity.startsWith('virtual:') ? (this._virtuals().find((v) => `virtual:${v.id}` === f.entity)?.name ?? f.entity) : f.entity) : ''}`,
              selected: fi === this._selFlow,
              onClick: () => { this._selFlow = fi; this._selPoint = -1; this._navPush(`flow:${f.id}`, f.name ?? f.id); },
              actions: html`
                <button class="ec-btn-dup"
                  @click=${(e: Event) => { e.stopPropagation(); this._duplicateFlow(fi); }}
                  title="Duplicate flow">⧉</button>
                <button class="ec-btn-remove"
                  @click=${(e: Event) => { e.stopPropagation(); this._removeFlow(fi); }}
                  title="Remove flow">✕</button>
              `,
            }))}
      `;
    }
    const fi = this._crumbIndex(path[0].key, flows);
    this._selFlow = fi;
    const selFlow = flows[fi];
    if (!selFlow) return this._navDeadEnd();
    if (path.length === 1) {
      return html`
        ${this._navMenu(MosaicCanvasEditor._FLOW_SECTIONS, this._flowScope(fi))}
        ${this._renderFlowPoints(selFlow)}
      `;
    }
    const key = path[1].key;
    if (key.startsWith('pt:')) {
      const pi = this._crumbIndex(key, selFlow.points);
      this._selPoint = pi;
      return this._flowSecPoint(fi, pi);
    }
    const fClear = this._clearOverridesBtn(
      MosaicCanvasEditor._findDef(MosaicCanvasEditor._FLOW_SECTIONS, key), this._flowScope(fi));
    switch (key) {
      case 'sec:speed':    return html`${fClear}${this._flowSecSpeed(selFlow)}`;
      case 'sec:style':    return html`${fClear}${this._flowSecStyle(selFlow)}`;
      case 'sec:defaults': return html`${fClear}${this._flowSecDefaults(selFlow)}`;
      default:
        // Was previously an unconditional fall-through to _flowSecDefaults(),
        // which could mask a stale/typo'd crumb key behind a plausible-looking
        // screen. Fail visibly instead.
        console.warn(`[mosaic-canvas-card] Flows panel: unknown section key "${key}"`);
        return this._navDeadEnd('This editor screen is unavailable — press Back to recover.');
    }
  }

  private _flowSecDefaults(selFlow: FlowConfig): TemplateResult {
    return html`
      <div class="ec-section">
              ${this._row('Name',
                html`<input class="ec-input" type="text" .value=${selFlow.name ?? ''}
                  @change=${(e: Event) => this._updateFlow(this._selFlow, { name: (e.target as HTMLInputElement).value })}
                />`)}

              ${this._row('Entity',
                selFlow.entity?.startsWith('virtual:')
                  ? html`<div style="display:flex;gap:4px;align-items:center;">
                      <span class="ec-input" style="flex:1;opacity:0.8;">
                        ${this._virtuals().find((v) => `virtual:${v.id}` === selFlow.entity)?.name ?? selFlow.entity}
                      </span>
                      <button class="ec-btn-clear"
                        @click=${() => this._updateFlow(this._selFlow, { entity: undefined })}
                        title="Switch to real entity">✕</button>
                    </div>`
                  : html`<ha-entity-picker
                      .hass=${this.hass}
                      .value=${selFlow.entity ?? ''}
                      allow-custom-entity
                      @value-changed=${(e: Event) =>
                        this._updateFlow(this._selFlow, { entity: (e as CustomEvent<{ value: string }>).detail.value })}
                    ></ha-entity-picker>`,
                'The entity whose value drives this flow. A positive value runs it forwards, a negative value backwards.'
              )}
              ${!selFlow.entity?.startsWith('virtual:') && this._virtuals().length > 0 ? this._row('Virtual Entity',
                html`<select class="ec-select"
                  .value=${''}
                  @change=${(e: Event) => {
                    const v = (e.target as HTMLSelectElement).value;
                    if (v) this._updateFlow(this._selFlow, { entity: v });
                    (e.target as HTMLSelectElement).value = '';
                  }}
                >
                  <option value="">(pick a virtual)</option>
                  ${this._virtuals().map((v) => html`<option value=${'virtual:' + v.id}>${v.name}</option>`)}
                </select>`,
                'Use a virtual entity from Elements ▸ Virtual Entities instead of a real one.') : nothing}

              ${this._numRow(`Min display power (${this._config?.defaults?.power_unit ?? 'W'})`, { value: selFlow.min_power, onChange: (v) => this._updateFlow(this._selFlow, { min_power: v }), min: 0, step: 1, placeholder: 'e.g. 5', hint: 'Hides the flow while the entity value is below this, in your global power unit.' })}

              ${this._row('Invert direction',
                html`<input type="checkbox"
                  .checked=${selFlow.invert ?? false}
                  @change=${(e: Event) => {
                    const checked = (e.target as HTMLInputElement).checked;
                    this._updateFlow(this._selFlow, { invert: checked || undefined });
                  }}
                />`,
                'Swaps which way the flow runs, and swaps the forward and reverse colours with it.')}
      </div>
    `;
  }

  private _flowSecSpeed(selFlow: FlowConfig): TemplateResult {
    const _flowMinDur = selFlow.speed_min_duration ?? sd('flow_speed_min_duration') ?? 5;
    const _flowMaxDur = selFlow.speed_max_duration ?? sd('flow_speed_max_duration') ?? 1;
    return html`
      <div class="ec-section">
              ${this._numRow(`Slowest animation value (${this._config?.defaults?.power_unit ?? 'W'})`, { value: selFlow.speed_min_value, onChange: (v) => this._updateFlow(this._selFlow, { speed_min_value: v }), min: 0, placeholder: 'e.g. 100', hint: 'Entity value at which the animation runs slowest.' })}

              ${this._numRow(`Fastest animation value (${this._config?.defaults?.power_unit ?? 'W'})`, { value: selFlow.speed_max_value, onChange: (v) => this._updateFlow(this._selFlow, { speed_max_value: v }), min: 0, placeholder: 'e.g. 5000', hint: 'Entity value at which the animation runs fastest.' })}

              ${this._row('Speed',
                html`<div class="ec-dual-range">
                  <span class="ec-dual-range-label">Slowest</span>
                  <div class="ec-dual-range-track">
                    <input type="range" min="0.5" max="10" step="0.5"
                      .value=${String(_flowMinDur)}
                      style="direction:rtl"
                      @input=${(e: Event) => {
                        const v = Number((e.target as HTMLInputElement).value);
                        const curMax = selFlow.speed_max_duration ?? sd('flow_speed_max_duration') ?? 1;
                        this._updateFlow(this._selFlow, { speed_min_duration: Math.max(v, curMax) });
                      }}
                    />
                    <input type="range" min="0.5" max="10" step="0.5"
                      .value=${String(_flowMaxDur)}
                      style="direction:rtl"
                      @input=${(e: Event) => {
                        const v = Number((e.target as HTMLInputElement).value);
                        const curMin = selFlow.speed_min_duration ?? sd('flow_speed_min_duration') ?? 5;
                        this._updateFlow(this._selFlow, { speed_max_duration: Math.min(v, curMin) });
                      }}
                    />
                  </div>
                  <span class="ec-dual-range-label">Fastest</span>
                </div>`,
                'How far apart the slowest and fastest animation speeds are. Drag the left handle for the slow end, the right for the fast end.')}
              ${selFlow.speed_min_value == null || selFlow.speed_max_value == null
                ? html`<p class="ec-hint">Has no effect until both "Slowest"/"Fastest animation value" above are set — the animation speed stays fixed at Duration below.</p>`
                : nothing}

              ${this._numRow('Duration (s)', { value: selFlow.duration, onChange: (v) => this._updateFlow(this._selFlow, { duration: v }), min: 0.1, step: 0.1, placeholder: '2',
                hint: 'Time for one particle to travel the line when the speed range is not in use.' })}
      </div>
    `;
  }

  // DRIFT: row or style-option changes here must be mirrored in the sec:style
  // entry of _FLOW_SECTIONS `terms` (hidden search vocabulary, #61).
  private _flowSecStyle(selFlow: FlowConfig): TemplateResult {
    return html`
      <div class="ec-section">
              ${this._row('Style',
                html`<select class="ec-select"
                  .value=${selFlow.style ?? sd('flow_style') ?? 'dashes'}
                  @change=${(e: Event) => this._updateFlow(this._selFlow, { style: (e.target as HTMLSelectElement).value as FlowStyle })}
                >
                  ${MosaicCanvasEditor._FLOW_STYLES.map((s) => html`<option value=${s} .selected=${(selFlow.style ?? sd('flow_style') ?? 'dashes') === s}>${s}</option>`)}
                </select>`,
                'How the line is drawn — dashes, dots, a fluid stream or discrete particles.')}

              ${this._row('Forward color',
                this._colorPicker(`flow-${this._selFlow}-fwd`, selFlow.forward_color ?? selFlow.color, (v) => this._updateFlow(this._selFlow, { forward_color: v, color: undefined })),
                'Colour while the value is positive.')}

              ${this._row('Reverse color',
                this._colorPicker(`flow-${this._selFlow}-rev`, selFlow.reverse_color, (v) => this._updateFlow(this._selFlow, { reverse_color: v })),
                'Colour while the value is negative.')}

              ${this._numRow('Width (px)', { value: selFlow.width, onChange: (v) => this._updateFlow(this._selFlow, { width: v }), min: 1, placeholder: '3' })}

              ${this._numRow('Particle count', { value: selFlow.particle_count, onChange: (v) => this._updateFlow(this._selFlow, { particle_count: v }), min: 1, placeholder: '6',
                hint: 'How many particles are in flight at once.' })}

              ${this._row('Curve',
                html`<select class="ec-select"
                  .value=${selFlow.curve ?? sd('flow_curve') ?? 'straight'}
                  @change=${(e: Event) => this._updateFlow(this._selFlow, { curve: (e.target as HTMLSelectElement).value as 'straight' | 'rounded' })}
                >
                  <option value="straight" .selected=${(selFlow.curve ?? sd('flow_curve') ?? 'straight') === 'straight'}>straight</option>
                  <option value="rounded" .selected=${selFlow.curve === 'rounded'}>rounded</option>
                </select>`,
                'Whether the line bows between its points or runs straight.')}
      </div>
    `;
  }

  private _pointLabel(pt: FlowEndpoint, pi: number): { label: string; sub: string } {
    if (pt.card != null) {
      const card = this._config?.cards.find((c) => c.id === pt.card);
      return { label: `Point ${pi + 1}`, sub: `Card · ${card?.name ?? pt.card} · ${pt.side ?? 'center'}` };
    }
    return { label: `Point ${pi + 1}`, sub: `Free · ${pt.x ?? 0}, ${pt.y ?? 0}` };
  }

  private _renderFlowPoints(selFlow: FlowConfig): TemplateResult {
    return html`
      <div class="ec-subsection-title">Points — drag to reorder</div>
      ${selFlow.points.length === 0
        ? this._emptyAdd('No points yet — add one', () => this._addFlowPoint(this._selFlow))
        : selFlow.points.map((pt, pi) => {
            const { label, sub } = this._pointLabel(pt, pi);
            return this._itemCard({
              dragKey: `pt:${this._selFlow}:${pi}`,
              icon: pt.card != null ? 'mdi:radio-button-on' : 'mdi:radio-button-off',
              label,
              sub,
              selected: pi === this._selPoint,
              onClick: () => { this._selPoint = pi; this._navPush(`pt:${pi}`, `Point ${pi + 1}`); },
              actions: html`
                <button class="ec-btn-dup"
                  @click=${(e: Event) => { e.stopPropagation(); this._duplicateFlowPoint(this._selFlow, pi); }}
                  title="Duplicate point">⧉</button>
                <button class="ec-btn-remove"
                  @click=${(e: Event) => { e.stopPropagation(); this._removeFlowPoint(this._selFlow, pi); }}
                  title="Remove">✕</button>
              `,
            });
          })}
      <button class="ec-btn-add" style="margin-top:4px;"
        @click=${() => this._addFlowPoint(this._selFlow)}>+ Point</button>
    `;
  }

  private _flowSecPoint(fi: number, pi: number): TemplateResult {
    const flow = this._flows()[fi];
    const pt = flow?.points[pi];
    if (!flow || !pt) return this._navDeadEnd();
    const kind = pt.card != null ? 'card' : 'free';
    return html`
      <div class="ec-section">
                    ${this._row('Kind',
                      html`<select class="ec-select"
                        .value=${kind}
                        @change=${(e: Event) => this._setPointKind(fi, pi, (e.target as HTMLSelectElement).value as 'card' | 'free')}
                      >
                        <option value="free" .selected=${kind === 'free'}>Free (x/y)</option>
                        <option value="card" .selected=${kind === 'card'}>Card</option>
                      </select>`)}

                    ${kind === 'card' ? html`
                      ${this._row('Card',
                        html`<select class="ec-select"
                          .value=${pt.card ?? ''}
                          @change=${(e: Event) => this._updateFlowPoint(fi, pi, { card: (e.target as HTMLSelectElement).value })}
                        >
                          ${this._config!.cards.map((c) => html`
                            <option value=${c.id} .selected=${pt.card === c.id}>${c.name ?? c.id}</option>
                          `)}
                        </select>`)}

                      ${this._row('Side',
                        html`<select class="ec-select"
                          .value=${pt.side ?? 'center'}
                          @change=${(e: Event) => this._updateFlowPoint(fi, pi, { side: (e.target as HTMLSelectElement).value as FlowSide })}
                        >
                          ${MosaicCanvasEditor._FLOW_SIDES.map((s) => html`<option value=${s} .selected=${(pt.side ?? 'center') === s}>${s}</option>`)}
                        </select>`)}
                    ` : html`
                      ${this._row('X',
                        html`${this._numWrap(html`<input class="ec-input ec-input-num" type="number"
                          .value=${String(pt.x ?? 0)}
                          @change=${(e: Event) => this._updateFlowPoint(fi, pi, { x: Number((e.target as HTMLInputElement).value) })}
                        />`)}`)}

                      ${this._row('Y',
                        html`${this._numWrap(html`<input class="ec-input ec-input-num" type="number"
                          .value=${String(pt.y ?? 0)}
                          @change=${(e: Event) => this._updateFlowPoint(fi, pi, { y: Number((e.target as HTMLInputElement).value) })}
                        />`)}`)}
                    `}

                    <div class="ec-subsection-title">Offset (px)</div>
                    <p class="ec-hint">Nudges this point away from its base position (card edge or x/y) without moving the card.</p>
                    ${this._numRow('dx', { value: pt.dx ?? 0, onChange: (v) => this._updateFlowPoint(fi, pi, { dx: v }) })}
                    ${this._numRow('dy', { value: pt.dy ?? 0, onChange: (v) => this._updateFlowPoint(fi, pi, { dy: v }) })}
      </div>
    `;
  }

  // ── Action rows ─────────────────────────────────────────────────────────────

  private static readonly _ACTION_LABELS: Record<'tap_action' | 'hold_action' | 'double_tap_action', string> = {
    tap_action: 'Tap', hold_action: 'Hold', double_tap_action: 'Double tap',
  };

  /** Tier-2 tooltips for the three action rows (#93). */
  private static readonly _ACTION_HINTS: Record<'tap_action' | 'hold_action' | 'double_tap_action', string> = {
    tap_action: 'What a single tap does. Leave blank for nothing.',
    hold_action: 'What a press-and-hold does. Leave blank for nothing.',
    double_tap_action: 'What two quick taps do. Leave blank for nothing.',
  };

  /**
   * The actions that are not Home Assistant services, expressed as pseudo
   * services so they can sit in the same `ha-service-picker` list as real ones.
   *
   * `ha-service-picker` builds its list exclusively from `hass.services` and
   * validates only that the chosen value is `domain.service` shaped, so a cloned
   * hass carrying extra domains puts these in the list as first-class rows. The
   * row label falls back to `services[domain][service].name` whenever localize
   * misses — which it always will for a domain no integration owns — and the
   * group heading comes from `domainToName(localize, domain)`, which is why the
   * clone also wraps localize.
   *
   * `mosaic.*` is ours. `ui.*` is HA's own non-service action types, which are
   * not services either and have nowhere else to live now that the two-step
   * mode-select-then-hui-action-editor arrangement is gone.
   */
  private static readonly _PSEUDO_ACTIONS: {
    id: string; action: ActionType; name: string; description: string;
  }[] = [
    { id: 'mosaic.open_popover',   action: 'open-extended',  name: 'Open Popover',   description: "Show one of this card's popover cards." },
    { id: 'mosaic.expand_card',    action: 'expand-card',    name: 'Expand Card',    description: 'Expand this card to fill the canvas.' },
    { id: 'mosaic.fire_dom_event', action: 'fire-dom-event', name: 'Fire DOM Event', description: 'Fire a browser DOM event for another frontend add-on to pick up.' },
    { id: 'ui.more_info',          action: 'more-info',      name: 'More info',      description: "Open the entity's more-info dialog." },
    { id: 'ui.toggle',             action: 'toggle',         name: 'Toggle',         description: 'Toggle the entity.' },
    { id: 'ui.navigate',           action: 'navigate',       name: 'Navigate',       description: 'Go to another dashboard view.' },
    { id: 'ui.url',                action: 'url',            name: 'Open URL',       description: 'Open a link.' },
    { id: 'ui.assist',             action: 'assist',         name: 'Assist',         description: 'Open the Assist dialog.' },
  ];

  /** The registry in `hass.services` shape. Built once; it never varies. */
  private static readonly _PSEUDO_SERVICES: Record<string, Record<string, unknown>> = (() => {
    const out: Record<string, Record<string, unknown>> = {};
    for (const a of MosaicCanvasEditor._PSEUDO_ACTIONS) {
      const dot = a.id.indexOf('.');
      const domain = a.id.slice(0, dot);
      (out[domain] ??= {})[a.id.slice(dot + 1)] = { name: a.name, description: a.description, fields: {} };
    }
    return out;
  })();

  /** Group headings for the two pseudo-domains; without these they read "mosaic" and "ui". */
  private static readonly _PSEUDO_TITLES: Record<string, string> = {
    'component.mosaic.title': 'Mosaic',
    'component.ui.title': 'Interface',
  };

  /**
   * The navigate action's path picker, as an `ha-selector` selector object.
   *
   * `navigation` is a first-class selector type with its own core chunk
   * (`ha-selector` lazy-imports `ha-selector-navigation`, which statically pulls
   * in `ha-navigation-picker`). It is NOT `ui_action` — that one instantiates
   * `hui-action-editor` out of HA's card-editor bundle, which is what the
   * two-step arrangement needed `_preloadHaActionEditor` for. Nothing here
   * touches the card bundles, and the same lazy-chunk path already backs the
   * attribute picker (see `_WALKED_PICKERS`).
   *
   * Hoisted because `ha-selector` re-derives its `_type` and re-fires the chunk
   * load whenever this object's identity changes — a fresh literal per render
   * would be churn for nothing.
   */
  private static readonly _NAV_SELECTOR = { navigation: {} } as const;

  private _mergedServicesSrc?: HomeAssistant['services'];
  private _mergedServices?: HomeAssistant['services'];

  /**
   * A hass whose `services` also contains the pseudo-actions.
   *
   * The merged services object is memoised on the real one's identity:
   * `ha-service-picker` rebuilds its whole item list when that changes, and with
   * several hundred services that is not something to redo on every render.
   * The wrapper object itself is rebuilt each call so the picker never holds a
   * stale `states`. Only the picker gets this — `ha-service-control` is given
   * the real hass, since it resolves live entities for its target fields.
   */
  private _actionHass(): HomeAssistant | undefined {
    const hass = this.hass;
    if (!hass) return undefined;
    if (this._mergedServicesSrc !== hass.services) {
      this._mergedServicesSrc = hass.services;
      this._mergedServices = { ...hass.services, ...MosaicCanvasEditor._PSEUDO_SERVICES } as HomeAssistant['services'];
    }
    const inner = hass.localize as unknown as (k: string, ...rest: unknown[]) => string;
    return {
      ...hass,
      services: this._mergedServices!,
      localize: ((k: string, ...rest: unknown[]) =>
        MosaicCanvasEditor._PSEUDO_TITLES[k] ?? inner(k, ...rest)) as unknown as HomeAssistant['localize'],
    } as HomeAssistant;
  }

  /** ActionConfig → the picker's `domain.service` string. Empty means unset. */
  private static _actionToServiceId(a: ActionConfig | undefined): string {
    if (!a || a.action === 'none') return '';
    if (a.action === 'call-service') return a.service ?? '';
    return MosaicCanvasEditor._PSEUDO_ACTIONS.find((p) => p.action === a.action)?.id ?? '';
  }

  /**
   * The picker's `domain.service` string → ActionConfig.
   *
   * `prev` carries across the fields the new action still uses, so retyping a
   * service name doesn't discard its data, and flipping between more-info and
   * toggle keeps the entity.
   */
  private static _serviceIdToAction(id: string, prev?: ActionConfig): ActionConfig | undefined {
    if (!id) return undefined;
    const pseudo = MosaicCanvasEditor._PSEUDO_ACTIONS.find((p) => p.id === id);
    if (!pseudo) {
      return { action: 'call-service', service: id, target: prev?.target, service_data: prev?.service_data };
    }
    switch (pseudo.action) {
      case 'more-info':
      case 'toggle':        return { action: pseudo.action, entity: prev?.entity };
      case 'navigate':      return { action: 'navigate', navigation_path: prev?.navigation_path };
      case 'url':           return { action: 'url', url_path: prev?.url_path };
      case 'open-extended': return { action: 'open-extended', extended_card_id: prev?.extended_card_id };
      default:              return { action: pseudo.action };
    }
  }


  /**
   * The "Open Popover" action's target picker.
   *
   * With no popover cards defined the `<select>` held nothing but "(select)",
   * which reads as the feature being missing rather than as a prerequisite not
   * being met. It now says so and offers the jump, and an id left dangling by a
   * deleted popover card is surfaced instead of silently showing "(select)"
   * beside an action that still fires and finds nothing.
   */
  private _popoverCardRow(action: ActionConfig, set: (a: ActionConfig) => void): TemplateResult {
    const cards = this._config?.extended_cards ?? [];
    if (cards.length === 0) {
      return html`
        <p class="ec-hint">No popover cards exist yet, so there is nothing to open.</p>
        <button class="ec-btn-add" @click=${() => { this._navTab = 'cards'; this._navPanel = 'popover'; this._navPath = []; }}>
          Go to Popover Cards
        </button>
      `;
    }
    const id = action.extended_card_id;
    const dangling = id != null && id !== '' && !cards.some((ec) => ec.id === id);
    return html`
      ${this._row('Popover card',
        html`<select class="ec-select"
          .value=${id ?? ''}
          @change=${(e: Event) => set({ ...action, extended_card_id: (e.target as HTMLSelectElement).value || undefined })}
        >
          <option value="" .selected=${!id}>(select)</option>
          ${cards.map((ec) => html`
            <option value=${ec.id} .selected=${id === ec.id}>${ec.name ?? ec.id}</option>
          `)}
        </select>`)}
      ${dangling
        ? html`<ha-alert alert-type="warning">This action points at <code>${id}</code>, which no longer exists. Pick another popover card.</ha-alert>`
        : nothing}
    `;
  }

  /**
   * One gesture's action: a single picker listing every HA service alongside the
   * Mosaic and Interface pseudo-actions, plus whatever sub-form the choice needs.
   *
   * `placeholder` is what runs when nothing is chosen — the entity-derived
   * service for a control field, nothing for anything else.
   */
  private _actionPicker(
    label: string,
    action: ActionConfig | undefined,
    set: (a: ActionConfig | undefined) => void,
    placeholder = '',
    hint?: string,
  ): TemplateResult {
    const id = MosaicCanvasEditor._actionToServiceId(action);
    return html`
      ${this._row(label, html`<ha-service-picker
        .hass=${this._actionHass()}
        .value=${id}
        placeholder=${placeholder}
        @value-changed=${(e: Event) => {
          e.stopPropagation();
          const v = (e as CustomEvent<{ value: string | undefined }>).detail.value ?? '';
          if (v === id) return;
          set(MosaicCanvasEditor._serviceIdToAction(v, action));
        }}
      ></ha-service-picker>`, hint)}
      ${this._actionSubForm(action, set)}
    `;
  }

  /**
   * The fields a chosen action needs beyond its name.
   *
   * A real service delegates to `ha-service-control` with `hidePicker`, so HA
   * still owns every service's data and target form — only the name picker above
   * it is ours. The rest are small enough to own outright.
   */
  private _actionSubForm(
    action: ActionConfig | undefined,
    set: (a: ActionConfig | undefined) => void,
  ): TemplateResult | typeof nothing {
    if (!action) return nothing;
    const text = (label: string, value: string | undefined, ph: string, apply: (v: string | undefined) => ActionConfig) =>
      this._row(label, html`<input class="ec-input" type="text" .value=${value ?? ''} placeholder=${ph}
        @change=${(e: Event) => set(apply((e.target as HTMLInputElement).value.trim() || undefined))} />`);

    switch (action.action) {
      case 'call-service':
        return html`<ha-service-control
          .hass=${this.hass}
          .hidePicker=${true}
          .value=${{ action: action.service, target: action.target, data: action.service_data }}
          @value-changed=${(e: Event) => {
            e.stopPropagation();
            const v = (e as CustomEvent<{ value?: { action?: string; target?: ActionConfig['target']; data?: Record<string, unknown> } }>).detail.value ?? {};
            set({ ...action, service: v.action ?? action.service, target: v.target, service_data: v.data });
          }}
        ></ha-service-control>`;
      case 'more-info':
      case 'toggle':
        return this._row('Entity', html`<ha-entity-picker
          .hass=${this.hass}
          .value=${action.entity ?? ''}
          allow-custom-entity
          @value-changed=${(e: Event) =>
            set({ ...action, entity: (e as CustomEvent<{ value: string }>).detail.value || undefined })}
        ></ha-entity-picker>`);
      case 'navigate':
        // HA's own dashboard/view picker, which also keeps `allow-custom-value`,
        // so a hand-written path like /lovelace/0 survives being reopened here.
        return this._row('Path', html`<ha-selector
          class="ec-nav-picker"
          .hass=${this.hass}
          .selector=${MosaicCanvasEditor._NAV_SELECTOR}
          .value=${action.navigation_path ?? ''}
          @value-changed=${(e: Event) => {
            e.stopPropagation();
            const v = (e as CustomEvent<{ value: string }>).detail.value;
            set({ ...action, navigation_path: v || undefined });
          }}
        ></ha-selector>`);
      case 'url':
        return text('URL', action.url_path, 'https://…', (v) => ({ ...action, url_path: v }));
      case 'open-extended':
        return this._popoverCardRow(action, set);
      default:
        return nothing;
    }
  }

  // DRIFT: action-type or row changes here must be mirrored in ACTION_TERMS
  // (hidden search vocabulary, #61).
  private _actionRows(
    actions: TapActions,
    update: (p: Partial<TapActions>) => void,
    keys: ('tap_action' | 'hold_action' | 'double_tap_action')[] = ['tap_action', 'hold_action', 'double_tap_action'],
    placeholder = '',
  ): TemplateResult {
    return html`${keys.map((k) => this._actionPicker(
      MosaicCanvasEditor._ACTION_LABELS[k],
      actions[k],
      (a) => update({ [k]: a }),
      placeholder,
      MosaicCanvasEditor._ACTION_HINTS[k],
    ))}`;
  }

  // ── Element Library unified picker ─────────────────────────────────────────

  private _openGGPicker(ci: number, fi: number, isExtended = false): void {
    this._ggTarget = { ci, fi, isExtended };
    this._ggOpen = true;
  }

  private _pickGG(type: 'svg' | 'graph', patch: Partial<FieldConfig>): void {
    if (!this._ggTarget) return;
    const { ci, fi, isExtended } = this._ggTarget;
    const update = { type, ...patch } as Partial<FieldConfig> & { type: FieldType };
    if (isExtended) {
      this._updateExtField(ci, fi, update);
    } else {
      this._updateField(ci, fi, update);
    }
    this._ggOpen = false;
    this._ggTarget = null;
  }

  // ── Embedded Cards panel ────────────────────────────────────────────────────

  /** Paths are EmbeddedCardConfig-relative — see `_embScope`. */
  private static readonly _EMB_SECTIONS: NavSectionDef<EmbeddedCardConfig>[] = [
    { key: 'sec:config', label: 'Card Config',     hint: 'Pick card type & edit config', icon: 'mdi:widgets',
      paths: ['name', 'card_config'] },
    { key: 'sec:pos',    label: 'Position & Size', hint: 'Anchor, width, span, height',  icon: 'mdi:arrow-expand-all',
      paths: ['position.x', 'position.y', 'anchor', 'grid_span', 'width', 'height'] },
    // #92: relabelled from "Appearance" once it gained the box rows. The crumb
    // key stays `sec:appear` — it is public nav state, and the screen is the
    // same screen.
    { key: 'sec:appear', label: 'Card Style',      hint: 'Frame, transparency & CSS',    icon: 'mdi:palette',
      terms: `${BOX_STYLE_TERMS} transparent chrome frame surround use global inherit override embedded external card css`,
      paths: ['transparent', 'extra_css', ...pfx('box', BOX_STYLE_PATHS)] },
    // One slot, same as the Mosaic card's — see _visibilityRows.
    { key: 'sec:visibility', label: 'Card Visibility', hint: 'Show / hide by condition', icon: 'mdi:eye-outline', terms: VISIBILITY_TERMS,
      paths: ['visible_when'] },
  ];

  private _embScope(idx: number): SectionScope<EmbeddedCardConfig> {
    return {
      root: this._embCards()[idx],
      apply: (patch) => this._updateEmbCard(idx, patch),
    };
  }

  private _renderEmbeddedPanel(): TemplateResult {
    const path = this._navPath;
    const embs = this._embCards();
    if (path.length === 0) {
      return html`
        <p style="font-size:12px;color:#4a8aaa;margin:0 0 8px;">
          Embed any HA Lovelace card as a positioned canvas element. Drag the ◈ handles in the preview to reposition.
        </p>
        <div class="ec-section-header">
          <span></span>
          <button class="ec-btn-add" @click=${this._addEmbCard}>+ Embedded External Card</button>
        </div>
        ${embs.length === 0
          ? this._emptyAdd('No embedded external cards yet — add one', () => this._addEmbCard())
          : embs.map((ec, idx) => this._itemCard({
              dragKey: `emb:${idx}`,
              icon: 'mdi:widgets',
              label: ec.name ?? ec.id,
              sub: (ec.card_config?.type as string | undefined) ?? 'No card type set',
              selected: idx === this._selEmbCard,
              onClick: () => { this._selEmbCard = idx; this._navPush(`emb:${ec.id}`, ec.name ?? ec.id); },
              actions: html`
                <button class="ec-btn-dup"
                  @click=${(e: Event) => { e.stopPropagation(); this._duplicateEmbCard(idx); }}
                  title="Duplicate card">⧉</button>
                <button class="ec-btn-remove"
                  @click=${(e: Event) => { e.stopPropagation(); this._removeEmbCard(idx); }}
                  title="Remove">✕</button>
              `,
            }))}
      `;
    }
    const IDX = this._crumbIndex(path[0].key, embs);
    this._selEmbCard = IDX;
    const sel = embs[IDX];
    if (!sel) return this._navDeadEnd();
    if (path.length === 1) {
      return this._navMenu(MosaicCanvasEditor._EMB_SECTIONS, this._embScope(IDX));
    }
    const eClear = this._clearOverridesBtn(
      MosaicCanvasEditor._findDef(MosaicCanvasEditor._EMB_SECTIONS, path[1].key), this._embScope(IDX));
    switch (path[1].key) {
      case 'sec:pos':    return html`${eClear}${this._embSecPos(IDX, sel)}`;
      case 'sec:appear': return html`${eClear}${this._embSecAppear(IDX, sel)}`;
      case 'sec:visibility': return html`${eClear}${this._embSecVisibility(IDX, sel)}`;
      case 'sec:config': return html`${eClear}${this._embSecConfig(IDX, sel)}`;
      default:
        // Was previously an unconditional fall-through to _embSecConfig(),
        // which could mask a stale/typo'd crumb key behind a plausible-looking
        // screen. Fail visibly instead.
        console.warn(`[mosaic-canvas-card] Embedded panel: unknown section key "${path[1].key}"`);
        return this._navDeadEnd('This editor screen is unavailable — press Back to recover.');
    }
  }

  private _embSecConfig(IDX: number, sel: EmbeddedCardConfig): TemplateResult {
    return html`
      <div class="ec-section">
        ${this._row('Name',
          html`<input class="ec-input" type="text" .value=${sel.name ?? ''}
            @change=${(e: Event) => this._updateEmbCard(IDX, { name: (e.target as HTMLInputElement).value || undefined })}
          />`)}

        ${this._row('Card Type',
          html`<span style="flex:1;min-width:0;font-family:monospace;font-size:12px;color:#5aadcc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            ${sel.card_config?.type ? String(sel.card_config.type) : html`<span style="color:#555;font-style:italic;">not set</span>`}
          </span>`,
          'Which Home Assistant card this is. Its own settings are edited in the config editor below.')}

        <div style="margin-top:8px;display:flex;gap:6px;">
          <button class="ec-btn-add" style="flex:1;" @click=${() => this._openEmbPicker({ kind: 'std', idx: IDX })}>
            ${sel.card_config?.type ? 'Change Type' : 'Pick Card Type'}
          </button>
          <button class="ec-btn-add" style="flex:1;" @click=${() => void this._openEmbEditor({ kind: 'std', idx: IDX })}>
            Edit Config…
          </button>
        </div>
      </div>
    `;
  }

  private _embSecPos(IDX: number, sel: EmbeddedCardConfig): TemplateResult {
    const { totalW, totalH } = computeCanvasDims(this._config);
    return html`
      <div class="ec-section">
        ${this._row('X (px)',
          html`${this._numWrap(html`<input class="ec-input ec-input-num" type="number"
            .value=${String(Math.round(sel.position.x * totalW))}
            @change=${(e: Event) => this._updateEmbCard(IDX, { position: { ...sel.position, x: Number((e.target as HTMLInputElement).value) / totalW } })}
          />`)}`,
          "Distance from the left edge of the canvas to the card's anchor point.")}

        ${this._row('Y (px)',
          html`${this._numWrap(html`<input class="ec-input ec-input-num" type="number"
            .value=${String(Math.round(sel.position.y * totalH))}
            @change=${(e: Event) => this._updateEmbCard(IDX, { position: { ...sel.position, y: Number((e.target as HTMLInputElement).value) / totalH } })}
          />`)}`,
          "Distance from the top edge of the canvas to the card's anchor point.")}

        ${this._row('Anchor',
          html`<select class="ec-select"
            .value=${sel.anchor ?? sd('anchor') ?? 'top-left'}
            @change=${(e: Event) => this._updateEmbCard(IDX, { anchor: (e.target as HTMLSelectElement).value as Anchor })}
          >
            ${ANCHORS.map((a) => html`<option value=${a} .selected=${(sel.anchor ?? sd('anchor') ?? 'top-left') === a}>${ANCHOR_LABELS[a]}</option>`)}
          </select>`,
          'Which point of the card sits at its X/Y position.')}
        ${this._gridGeom() ? html`<p class="ec-hint">In grid mode, this is the point of the card snapped to the nearest grid intersection.</p>` : nothing}

        ${this._gridGeom() ? this._row('Columns (span)',
          html`${this._numWrap(html`<input class="ec-input ec-input-num" type="number" min="1" max=${this._gridGeom()!.cols}
            .value=${String(sel.grid_span ?? 1)}
            @change=${(e: Event) => {
              const geom = this._gridGeom();
              if (!geom) return;
              const span = Math.max(1, Math.min(geom.cols, Number((e.target as HTMLInputElement).value) || 1));
              const width = Math.max(8, span * geom.cellW - geom.padding);
              this._updateEmbCard(IDX, { grid_span: span, width });
            }}
          />`)}`,
          'How many grid columns the card covers. Changing it resets Width to match.') : nothing}

        ${this._row('Width (px)',
          html`${this._numWrap(html`<input class="ec-input ec-input-num" type="number" min="20"
            .value=${String(sel.width)}
            @change=${(e: Event) => this._updateEmbCard(IDX, { width: Number((e.target as HTMLInputElement).value) })}
          />`)}`,
          'How wide the embedded card is drawn.')}

        ${this._numRow('Height (px)', { value: sel.height, onChange: (v) => this._updateEmbCard(IDX, { height: v }), min: 20, placeholder: 'auto',
          hint: 'Unset lets the embedded card size itself.' })}
      </div>
    `;
  }

  /**
   * Two surfaces, one screen (#92), which is the whole reason for the hints
   * here: the box rows decorate the host element that holds the card, while
   * **Transparent** reaches into the card and strips its own chrome. Neither
   * reads as the other's opposite, and a user who sets a Background while the
   * card is still opaque sees nothing happen.
   *
   * Each half owns its own Additional CSS, and they are not interchangeable:
   * the frame's (`box.extra_css`) goes on the host, the card's
   * (`EmbeddedCardConfig.extra_css`) is set on the third-party element itself,
   * the same reach `transparent` has. Two fields because the surfaces are two,
   * not because the strings differ.
   *
   * Both halves now inherit, and each does it the way its type allows: the box
   * and `transparent` pick a tier through an inherit row, because neither an
   * absent container nor an absent boolean has anything to merge, while the two
   * CSS fields concatenate onto their global silently — the same split
   * `embeddedInner`/`embeddedBoxCss` make.
   */
  private _embSecAppear(IDX: number, sel: EmbeddedCardConfig): TemplateResult {
    return html`
      <div class="ec-section">
        <div class="ec-subsection-title">Frame</div>
        <p class="ec-hint">Mosaic's own frame, drawn on the element that <i>holds</i> the card. The card inside
          keeps painting itself — use <b>Transparent</b> below to take its background away and let this show
          through. Additional CSS here styles the frame: size it, move it, layer it.</p>
        ${this._inheritRow('Use global card style',
          'Following Global Defaults ▸ Embedded Card Default.',
          sel.box !== undefined,
          (useGlobal) => this._updateEmbCard(IDX, { box: useGlobal ? undefined : {} }))}
        ${sel.box !== undefined
          ? html`
              ${this._boxRows(`emb${IDX}`, sel.box, (p) => this._updateEmbCardBox(IDX, p))}
              <p class="ec-hint"><b>Padding</b> insets the card inside its footprint rather than making it
                wider — the frame keeps the width set in <b>Position &amp; Size</b>.</p>
            `
          : nothing}

        <div class="ec-subsection-title">The card itself</div>
        ${this._inheritRow('Use global transparency',
          'Following Global Defaults ▸ Embedded Card Default.',
          sel.transparent !== undefined,
          (useGlobal) => this._updateEmbCard(IDX, { transparent: useGlobal ? undefined : false }))}
        ${sel.transparent !== undefined
          ? html`
              ${this._row('Transparent',
                html`<input type="checkbox" .checked=${sel.transparent}
                  @change=${(e: Event) => this._updateEmbCard(IDX, { transparent: (e.target as HTMLInputElement).checked })}
                />`)}
              <p class="ec-hint">Removes the embedded card's own background, border and shadow. Its content
                stays; only the panel it sits on goes.</p>
            `
          : nothing}
        ${this._cssRow(sel.extra_css, (v) => this._updateEmbCard(IDX, { extra_css: v }), 'Card CSS')}
        <p class="ec-hint">Applied to the card itself, not to the frame — this is where a
          <code>--ha-card-…</code> override or a font change goes. Anything that sizes, moves or layers the
          whole thing belongs in the frame's <b>Additional CSS</b> above. Added after the global <b>Card
          CSS</b> rather than replacing it, so this wins where the two name the same property.</p>
      </div>
    `;
  }

  private _embSecVisibility(IDX: number, sel: EmbeddedCardConfig): TemplateResult {
    return html`
      <div class="ec-section">
        ${this._visibilityRows(sel.visible_when, (v) => this._updateEmbCard(IDX, { visible_when: v }))}
        <p class="ec-hint">The card stays visible here in the editor whatever the condition says, so you can
          still select and edit it. It hides on the dashboard itself.</p>
      </div>
    `;
  }

  private _renderEmbEditorModal(): TemplateResult | typeof nothing {
    if (!this._embEditorOpen) return nothing;
    const isNative = !!this._embNativeEditor;
    const cfg = this._embEditorTarget ? this._embConfig(this._embEditorTarget) : undefined;
    const cardType = cfg ? String(cfg.type ?? '') : '';
    return html`
      <div class="ec-lib-backdrop" @click=${this._closeEmbEditor}></div>
      <div class="ec-lib-modal" style="width:min(580px,94vw);">
        <div class="ec-lib-header">
          <span class="ec-lib-title">${cardType || 'Embedded Card'} — Config</span>
          <div style="display:flex;align-items:center;gap:8px;">
            ${isNative ? html`
              <button class="ec-btn-ghost ec-btn-ghost--sm"
                @click=${() => { this._embNativeEditor = null; }}>
                Use JSON
              </button>` : nothing}
            <button class="ec-btn-clear" @click=${this._closeEmbEditor}>✕</button>
          </div>
        </div>

        ${isNative ? html`
          <div id="emb-native-slot"
            style="padding:12px 16px;max-height:62vh;overflow-y:auto;box-sizing:border-box;"
            @config-changed=${(e: Event) => e.stopPropagation()}
          ></div>
          <div style="display:flex;justify-content:flex-end;padding:0 16px 14px;">
            <button class="ec-btn-add" style="padding:6px 18px;" @click=${this._closeEmbEditor}>Done</button>
          </div>
        ` : html`
          <div style="padding:12px 16px;">
            <p style="font-size:12px;color:#888;margin:0 0 8px;">
              JSON object — <code style="color:#5aadcc">"type"</code> plus card-specific properties.
              ${cardType ? html`<span style="color:#c87aff;"> (no visual editor available for this card type)</span>` : nothing}
            </p>
            <textarea
              style="width:100%;box-sizing:border-box;min-height:220px;font-family:monospace;font-size:13px;background:#060e18;color:#c8d8e8;border:1px solid rgba(0,212,255,0.25);border-radius:6px;padding:10px;resize:vertical;outline:none;"
              .value=${this._embEditorYaml}
              @input=${(e: Event) => { this._embEditorYaml = (e.target as HTMLTextAreaElement).value; this._embEditorYamlError = ''; }}
              spellcheck="false"
            ></textarea>
            ${this._embEditorYamlError ? html`<p style="font-size:12px;color:#ff6b6b;margin:6px 0 0;">${this._embEditorYamlError}</p>` : nothing}
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end;padding:0 16px 14px;">
            <button class="ec-btn-ghost" @click=${this._closeEmbEditor}>Cancel</button>
            <button class="ec-btn-add" style="padding:6px 16px;" @click=${this._saveEmbEditorYaml}>Save</button>
          </div>
        `}
      </div>
    `;
  }

  private _renderEmbPickerModal(): TemplateResult | typeof nothing {
    if (!this._embPickerOpen) return nothing;
    const custom: CardInfo[] = ((window as any).customCards ?? []) as CardInfo[];
    const builtins = HA_BUILTIN_CARDS.map((c) => ({ ...c, source: 'Built-in' }));
    // window.customCards stores types WITHOUT 'custom:' but Lovelace configs need 'custom:' prefix
    const customMapped = custom.map((c) => ({
      type: c.type.startsWith('custom:') ? c.type : `custom:${c.type}`,
      name: c.name ?? c.type,
      description: c.description,
      source: 'Custom',
    }));
    const builtinTypes = new Set(builtins.map((c) => c.type));
    const all: CardInfo[] = [
      ...builtins,
      ...customMapped.filter((c) => !builtinTypes.has(c.type)),
    ];
    const q = this._embPickerSearch.trim().toLowerCase();
    const filtered = q
      ? all.filter((c) => c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q))
      : all;
    const exactMatch = all.some((c) => c.type === q || c.name.toLowerCase() === q);
    return html`
      <div class="ec-lib-backdrop" @click=${() => { this._embPickerOpen = false; }}></div>
      <div class="ec-lib-modal" style="width:min(480px,94vw);">
        <div class="ec-lib-header">
          <span class="ec-lib-title">Select Card Type</span>
          <button class="ec-btn-clear" @click=${() => { this._embPickerOpen = false; }}>✕</button>
        </div>
        <div style="padding:10px 16px 6px;">
          <input class="ec-input" type="search" placeholder="Search by name or type…"
            style="width:100%;box-sizing:border-box;"
            .value=${this._embPickerSearch}
            @input=${(e: Event) => { this._embPickerSearch = (e.target as HTMLInputElement).value; }}
          />
        </div>
        <div style="max-height:52vh;overflow-y:auto;padding:2px 8px 10px;">
          ${filtered.map((c) => html`
            <div class="ec-list-row" style="cursor:pointer;padding:8px 10px;"
              @click=${() => void this._pickEmbCardType(c.type)}>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;color:#c8d8e8;font-weight:500;">${c.name}</div>
                <div style="font-size:11px;color:#5aadcc;font-family:monospace;">${c.type}</div>
                ${c.description ? html`<div style="font-size:11px;color:#666;margin-top:1px;">${c.description}</div>` : nothing}
              </div>
              <span style="font-size:10px;color:#375f78;padding-left:10px;white-space:nowrap;">${c.source}</span>
            </div>
          `)}
          ${q && !exactMatch ? html`
            <div class="ec-list-row" style="cursor:pointer;padding:8px 10px;border-top:1px solid rgba(255,255,255,0.06);margin-top:4px;"
              @click=${() => void this._pickEmbCardType(q)}>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;color:#c8d8e8;">Use "<strong>${q}</strong>"</div>
                <div style="font-size:11px;color:#666;">Enter type manually</div>
              </div>
            </div>
          ` : nothing}
        </div>
      </div>
    `;
  }

  private _renderFlowCompleteModal(): TemplateResult | typeof nothing {
    if (!this._showFlowCompleteModal) return nothing;
    const flowName = this._flows()[this._pendingFlowIdx]?.name ?? 'Flow';
    return html`
      <div class="ec-lib-backdrop"></div>
      <div class="ec-lib-modal" style="width:min(420px,92vw);">
        <div class="ec-lib-header">
          <span class="ec-lib-title">Complete Flow Configuration</span>
        </div>
        <div style="padding:16px 20px;line-height:1.5;">
          <p style="margin:0 0 12px;">
            <strong>${flowName}</strong> was added. To set the entity, direction, and style,
            complete its configuration in the <strong>Flows</strong> section below.
          </p>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;padding:0 20px 16px;">
          <button class="ec-btn-add" @click=${() => this._goToFlow()}>Take Me There</button>
          <button class="ec-btn-align" @click=${() => {
            this._showFlowCompleteModal = false;
            this._previewExpanded = false;
            this._pendingFlowIdx = -1;
          }}>Close</button>
        </div>
      </div>
    `;
  }

  private _renderGGModal(): TemplateResult | typeof nothing {
    if (!this._ggOpen) return nothing;

    const thumb = (file: string) => html`<img class="ec-lib-preview" src="${LIB_BASE + file}" alt=""
      @error=${(e: Event) => {
        const img = e.target as HTMLImageElement;
        const ph = document.createElement('div');
        ph.className = 'ec-lib-thumb-placeholder';
        img.parentNode?.replaceChild(ph, img);
      }} />`;

    const BATTERY_THRESHOLDS = [
      { value: 15, color: '#ef4444' },
      { value: 35, color: '#f59e0b' },
      { value: 100, color: '#22c55e' },
    ];

    const svgItems: Array<{ label: string; file: string; fill_direction: FieldConfig['fill_direction']; width: number; height: number; thresholds?: typeof BATTERY_THRESHOLDS }> = [
      { label: 'Thermometer',            file: 'thermometer.svg',            fill_direction: 'up',   width: 60,  height: 200 },
      { label: 'Thermometer (Horizontal)', file: 'thermometer-horizontal.svg', fill_direction: 'left', width: 200, height: 60  },
      { label: 'Arc Gauge',          file: 'gauge-arc.svg',         fill_direction: 'up',   width: 200, height: 120 },
      { label: 'Battery (Vertical)', file: 'battery-vertical.svg',  fill_direction: 'up',   width: 44,  height: 100, thresholds: BATTERY_THRESHOLDS },
      { label: 'Battery (Horizontal)',file: 'battery-horizontal.svg',fill_direction: 'left', width: 100, height: 44,  thresholds: BATTERY_THRESHOLDS },
      // { label: 'Tank (Conical)',   file: 'tank-conical.svg',   fill_direction: 'up',   width: 100, height: 150 },
      { label: 'Tank (Cylinder)',    file: 'tank-cylinder.svg',     fill_direction: 'up',   width: 100, height: 150 },
      { label: 'Tank - Water',       file: 'tank-water.svg',        fill_direction: 'up',   width: 80,  height: 95  },
      // { label: 'Tank (Fuel)',      file: 'tank-fuel.svg',      fill_direction: 'down', width: 100, height: 80  },
      // { label: 'Tank (Hot Water)', file: 'tank-hot-water.svg', fill_direction: 'up',   width: 80,  height: 150 },
      { label: 'Tank (Fermenter)',   file: 'tank-fermenter.svg',    fill_direction: 'up',   width: 60,  height: 165 },
      { label: 'Tank (Cone)',        file: 'tank-cone.svg',         fill_direction: 'up',   width: 80,  height: 150 },
      { label: 'Inverter',           file: 'inverter.svg',          fill_direction: 'up',   width: 100, height: 100 },
    ];

    const statItems: Array<{ label: string; graph_type: GraphType; thumb: string }> = [
      { label: 'Line',         graph_type: 'stat-line',   thumb: 'thumb_stat_line.webp' },
      { label: 'Line (Stacked)', graph_type: 'stat-area',  thumb: 'thumb_stat_area.webp' },
      { label: 'Bar',          graph_type: 'bar',         thumb: 'thumb_stat_bar.webp' },
      { label: 'Bar (Horizontal)', graph_type: 'bar-h',   thumb: 'thumb_stat_bar_h.webp' },
      { label: 'Bar (Stacked)',graph_type: 'bar-stacked', thumb: 'thumb_statbar_stacked.webp' },
    ];

    const histItems: Array<{ label: string; graph_type: GraphType; thumb: string }> = [
      { label: 'With Unit (line)', graph_type: 'line',           thumb: 'thumb_history_uom.webp' },
      { label: 'No Unit (states)', graph_type: 'state-timeline', thumb: 'thumb_history_no_uom.webp' },
    ];

    const gaugeItems: Array<{ label: string; graph_type: GraphType; thumb: string }> = [
      { label: 'Arc Gauge',          graph_type: 'gauge',        thumb: 'thumb_gauge_arc.webp' },
      { label: 'Arc Gauge (Needle)', graph_type: 'gauge-needle', thumb: 'thumb_gauge_arc_needle.webp' },
    ];

    return html`
      <div class="ec-lib-backdrop" @click=${() => { this._ggOpen = false; }}></div>
      <div class="ec-lib-modal">
        <div class="ec-lib-header">
          <span class="ec-lib-title">Element Library</span>
          <button class="ec-btn-clear" @click=${() => { this._ggOpen = false; }}>✕</button>
        </div>

        <div class="ec-lib-cat">SVG Elements</div>
        <div class="ec-lib-grid">
          ${svgItems.map(item => html`
            <button class="ec-lib-item" title="${item.label}"
              @click=${() => this._pickGG('svg', {
                // The bare filename — `resolveSvgUrl` pairs it with the base URL at
        // fetch time, so the card follows whatever address it is opened on
        // rather than the one it was configured on (#96).
        svg: item.file,
                fill_direction: item.fill_direction,
                width: item.width,
                height: item.height,
                ...(item.thresholds ? { thresholds: item.thresholds } : {}),
              })}>
              ${thumb(item.file)}
              <span class="ec-lib-name">${item.label}</span>
            </button>
          `)}
        </div>

        <div class="ec-lib-cat">Statistics Graph</div>
        <div class="ec-lib-grid">
          ${statItems.map(item => html`
            <button class="ec-lib-item" title="${item.label}"
              @click=${() => this._pickGG('graph', { graph_type: item.graph_type })}>
              ${thumb(item.thumb)}
              <span class="ec-lib-name">${item.label}</span>
            </button>
          `)}
        </div>

        <div class="ec-lib-cat">History Graph</div>
        <div class="ec-lib-grid">
          ${histItems.map(item => html`
            <button class="ec-lib-item" title="${item.label}"
              @click=${() => this._pickGG('graph', { graph_type: item.graph_type })}>
              ${thumb(item.thumb)}
              <span class="ec-lib-name">${item.label}</span>
            </button>
          `)}
        </div>

        <div class="ec-lib-cat">Gauge</div>
        <div class="ec-lib-grid">
          ${gaugeItems.map(item => html`
            <button class="ec-lib-item" title="${item.label}"
              @click=${() => this._pickGG('graph', { graph_type: item.graph_type })}>
              ${thumb(item.thumb)}
              <span class="ec-lib-name">${item.label}</span>
            </button>
          `)}
        </div>
      </div>
    `;
  }

  // ── Layout helper ───────────────────────────────────────────────────────────

  /**
   * `hint` is the tier-2 tooltip (#93) — what the control does, and what
   * leaving it blank means. It lands on the label rather than the control so
   * one hover target covers every row shape, and because a control that is a
   * picker, a slider or a textarea has nowhere consistent to put it.
   *
   * Rows from a shared group carry their hint *in the group*, once. Leaving it
   * off is a decision, not an omission — see CODING_STANDARDS.md § Editor
   * helper text.
   */
  private _row(label: string, control: TemplateResult, hint?: string): TemplateResult {
    // One <label> wrapping text and control associates them without needing
    // for/id plumbing at 300+ call sites: clicking the text focuses/toggles
    // the first labelable element, and screen readers announce the label.
    return html`
      <label class="ec-row">
        <span class="ec-label${hint ? ' ec-label--hinted' : ''}" title=${hint ?? nothing}>${label}</span>
        <div class="ec-control">${control}</div>
      </label>
    `;
  }

  /**
   * A single-row inherit gate: an "Inherit" checkbox beside the control. While
   * inheriting, the control is greyed + non-interactive; unchecking it hands
   * editing back. `inheriting` reflects real data (value === undefined), not
   * separate UI-only state, so it can never drift from the config.
   */
  private _optRow(label: string, hint: string, inheriting: boolean, control: TemplateResult, onToggle: (inherit: boolean) => void): TemplateResult {
    return html`
      <div class="ec-row">
        <label class="ec-label">${label}${hint ? html`<span class="ec-label-hint">${hint}</span>` : nothing}</label>
        <div class="ec-control ec-opt-control">
          <label class="ec-opt-inherit">
            <input type="checkbox" .checked=${inheriting} @change=${(e: Event) => onToggle((e.target as HTMLInputElement).checked)} />
            Inherit
          </label>
          <div class="ec-opt-target${inheriting ? ' ec-opt-target--disabled' : ''}">${control}</div>
        </div>
      </div>
    `;
  }

  /** Colour popup mode: the RGB picker/presets, or the CSS variable list. Persists across pickers. */
  @state() private _cpMode: 'rgb' | 'css' = 'rgb';

  private _colorPicker(
    id: string,
    value: string | undefined,
    onChange: (v: string | undefined) => void,
    opts?: {
      clearTitle?: string;
      onClear?: () => void;
      clearable?: boolean;
      /** Renders the Gradient checkbox beside the clear button (#91). */
      gradient?: { on: boolean; onToggle: (on: boolean) => void };
    },
  ): TemplateResult {
    const text = value ?? '';
    const isOpen = this._cpOpenId === id;
    const { base: baseColor, alpha } = splitColorAlpha(text);
    const hexVal = /^#[0-9a-fA-F]{6}$/.test(baseColor) ? baseColor : baseColor ? cssColorToHex(baseColor, this) : '#000000';
    const swatchBg = text || 'transparent';
    const showClear = opts?.clearable !== false && value != null;
    const PRESETS = ['#ff0000','#ff4500','#ff8800','#ffff00','#00ff00','#00ff7f','#00ffff','#0000ff','#9400d3','#ff00ff','#ffffff','#00d4ff','#22c55e','#888888','#333333','#000000'];
    const cr = parseInt(hexVal.slice(1, 3), 16);
    const cg = parseInt(hexVal.slice(3, 5), 16);
    const cb = parseInt(hexVal.slice(5, 7), 16);
    const rgbToHex = (r: number, g: number, b: number) =>
      `#${[r, g, b].map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')).join('')}`;

    // A var() (or any non-RGB expression) keeps its reference and takes alpha via
    // color-mix; a literal colour becomes rgba(). Either way 100% stores the
    // plain value, so a bare var still inherits whatever alpha the theme set.
    const isExpr = baseColor !== '' && !/^#[0-9a-fA-F]{6}$/.test(baseColor) && !/^rgb/i.test(baseColor);
    /**
     * Emit a literal colour at the given opacity: plain hex at 100% (so existing
     * configs and the common case stay hex), rgba() below it.
     */
    const emit = (hex: string, a: number): void => {
      if (a >= 1) { onChange(hex); return; }
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      onChange(`rgba(${r},${g},${b},${Number(a.toFixed(3))})`);
    };
    /** Re-emit whatever the current base is at a new opacity. */
    const emitAlpha = (a: number): void => {
      if (isExpr) onChange(withAlphaExpr(baseColor, a));
      else emit(hexVal, a);
    };
    /**
     * Escape cancels: every control in the popup writes through live, so backing
     * out means re-emitting the value captured when it opened. The key must not
     * bubble — HA's card-edit dialog closes on a stray Escape.
     */
    const onCancelKey = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape' || this._cpOpenId !== id) return;
      e.preventDefault();
      e.stopPropagation();
      if (this._cpOrigValue !== value) onChange(this._cpOrigValue);
      this._cpOpenId = null;
    };
    return html`
      <div class="ec-cp-wrap" @keydown=${onCancelKey}
        @click=${(e: Event) => {
          // This subtree usually sits inside _row()'s <label>, whose default
          // action forwards any click on non-interactive content to its first
          // labelable element — the swatch button — whose toggle would close
          // the popup. hex-color-picker is such content, so picking a colour
          // closed the picker (#107). While open, cancel that default here
          // (handlers still run; only the label forwarding is suppressed).
          // This also catches the click a drag that releases outside the
          // popup synthesizes on this wrap, the common ancestor.
          if (this._cpOpenId === id) e.preventDefault();
        }}>
        <div class="ec-color-row">
          <button class="ec-color-swatch-btn" title="Open color picker"
            style="--mce-swatch:${swatchBg}"
            @click=${(e: Event) => {
              e.stopPropagation();
              if (!isOpen) {
                // Below the row when ~a full RGB-mode popup fits there, above
                // it otherwise; clamped into the viewport either way. The
                // popup's own max-height + scroll covers shorter windows.
                // fixed-position coordinates resolve against the *fixed
                // containing block*, which inside HA's edit dialog is the
                // transformed dialog surface, not the viewport — a probe
                // measures that block so the two spaces can be converted.
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const probe = document.createElement('div');
                probe.style.cssText = 'position:fixed;inset:0;pointer-events:none;visibility:hidden;';
                (e.currentTarget as HTMLElement).parentElement!.appendChild(probe);
                const cb = probe.getBoundingClientRect();
                probe.remove();
                const left = Math.max(12, Math.min(rect.left, window.innerWidth - 254)) - cb.left;
                this._cpPos = (window.innerHeight - rect.bottom) < 340
                  ? { left, bottom: cb.bottom - rect.top + 4 }
                  : { left, top: rect.bottom + 4 - cb.top };
                this._cpOrigValue = value;
              }
              this._cpOpenId = isOpen ? null : id;
            }}
          ></button>
          <input type="text" class="ec-color-text"
            .value=${text}
            placeholder="#rrggbb · rgb() · name"
            @change=${(e: Event) => {
              const v = (e.target as HTMLInputElement).value.trim();
              onChange(v || undefined);
            }}
          />
          ${showClear ? html`<button class="ec-btn-clear" title="${opts?.clearTitle ?? 'Clear'}"
            @click=${opts?.onClear ?? (() => onChange(undefined))}>✕</button>` : nothing}
          ${opts?.gradient ? html`<label class="ec-cp-grad-toggle"
            title="Blends this colour into a second one. Unticking clears the end colour and its angle.">
            <input type="checkbox" .checked=${opts.gradient.on}
              @change=${(e: Event) => opts.gradient!.onToggle((e.target as HTMLInputElement).checked)} />
            Gradient
          </label>` : nothing}
        </div>
        ${isOpen ? html`
          <div class="ec-cp-backdrop" @click=${() => { this._cpOpenId = null; }}></div>
          <div class="ec-cp-popup"
            style="left:${this._cpPos?.left ?? 0}px;${this._cpPos?.top != null
              ? `top:${this._cpPos.top}px` : `bottom:${this._cpPos?.bottom ?? 0}px`}"
            role="dialog" aria-label="Color picker — Escape to cancel" tabindex="-1"
            @click=${(e: MouseEvent) => {
              // preventDefault, not just stopPropagation: propagation stops at
              // this div, but the row <label>'s click-forwarding is a default
              // action and survives it — see the wrap handler above (#107).
              e.preventDefault();
              e.stopPropagation();
            }}>
            <div class="ec-cp-modes">
              <button class="ec-cp-mode${this._cpMode === 'rgb' ? ' active' : ''}"
                @click=${() => { this._cpMode = 'rgb'; }}>RGB Mode</button>
              <button class="ec-cp-mode${this._cpMode === 'css' ? ' active' : ''}"
                @click=${() => { this._cpMode = 'css'; }}>CSS Mode</button>
            </div>
            ${this._cpMode === 'css' ? this._renderCpVars(onChange, alpha) : html`
            <div class="ec-cp-main">
            <hex-color-picker
              .color=${hexVal}
              @color-changed=${(e: CustomEvent<{ value: string }>) => emit(e.detail.value, alpha)}
              @dblclick=${() => {
                // Double-click confirms: the colour is already written live by
                // color-changed, so confirming is just closing. Scoped to the
                // saturation/hue widget — a double-click on the RGB number
                // inputs is text selection, not a pick.
                this._cpOpenId = null;
              }}
            ></hex-color-picker>
            <div class="ec-cp-rgb">
              ${(['R','G','B'] as const).map((ch, i) => {
                const chVal = [cr, cg, cb][i];
                return html`<label class="ec-cp-rgb-label">${ch}
                  <input type="number" class="ec-cp-rgb-input" min="0" max="255"
                    .value=${String(chVal)}
                    @change=${(e: Event) => {
                      const v = Number((e.target as HTMLInputElement).value);
                      emit(rgbToHex(i === 0 ? v : cr, i === 1 ? v : cg, i === 2 ? v : cb), alpha);
                    }}
                  />
                </label>`;
              })}
            </div>
            <div class="ec-cp-presets">
              ${PRESETS.map((c) => html`
                <button class="ec-cp-preset" style="background:${c}" title="${c}"
                  @click=${() => { emit(c, alpha); this._cpOpenId = null; }}
                ></button>
              `)}
            </div>
            </div>
            `}
            <div class="ec-cp-alpha">
              <span class="ec-cp-alpha-label">Opacity</span>
              <div class="ec-opacity-row">
                <input type="range" min="0" max="1" step="0.01"
                  .value=${String(alpha)}
                  @input=${(e: Event) => emitAlpha(parseFloat((e.target as HTMLInputElement).value))}
                />
                <span class="ec-opacity-val">${Math.round(alpha * 100)}%</span>
              </div>
            </div>
          </div>
        ` : nothing}
      </div>
    `;
  }

  /** Theme-color + custom-color dropdown shown below the presets in the color popup. */
  private _renderCpVars(onChange: (v: string | undefined) => void, alpha = 1): TemplateResult {
    const custom = this._config?.defaults?.custom_colors ?? [];
    // Keep the opacity already dialled in when swapping which variable is used.
    const pick = (ref: string): void => { onChange(withAlphaExpr(ref, alpha)); this._cpOpenId = null; };
    return html`
      <div class="ec-cp-vars">
        <div class="ec-cp-vars-title">Theme color</div>
        <div class="ec-cp-vars-hint">Select a standard HA or custom color variable</div>
        <div class="ec-cp-vars-list">
          ${HA_THEME_VARS.map((v) => html`
            <button class="ec-cp-var-row" title="var(${v.name})" @click=${() => pick(`var(${v.name})`)}>
              <span class="ec-cp-var-chip" style="background:var(${v.name})"></span>
              <span class="ec-cp-var-name">${v.label}</span>
            </button>`)}
          ${custom.length ? html`<div class="ec-cp-vars-sep">Custom</div>` : nothing}
          ${custom.map((c) => html`
            <button class="ec-cp-var-row" title="var(--mccust_${c.name})" @click=${() => pick(`var(--mccust_${c.name})`)}>
              <span class="ec-cp-var-chip" style="background:${c.color}"></span>
              <span class="ec-cp-var-name">mccust_${c.name}</span>
            </button>`)}
        </div>
      </div>
    `;
  }

  // ── Styles ──────────────────────────────────────────────────────────────────

  static override styles = [
    css`
      :host {
        display: block;
        font-size: 16px;
        color: var(--primary-text-color);

        /* House style for every form field, so a native HA picker and one of
           our own inputs sitting in adjacent rows line up and match. Each
           token is a theme variable with the card's own palette as fallback.
           --mce-field-h must stay in step with PICKER_HEIGHT (TS), which sizes
           the Material row _injectPickerStyle reaches inside the pickers.
           Do NOT name tokens here that the runtime card consumes (--mc-*):
           the expanded preview renders the real card inside this shadow tree
           and would inherit them. */
        --mce-field-h: 30px;
        --mce-field-radius: 6px;
        --mce-field-font-size: 15px;
        --mce-field-bg: var(--primary-background-color, rgba(0,8,18,0.7));
        --mce-field-border-color: var(--divider-color, rgba(0,212,255,0.18));
        --mce-field-focus-color: var(--mce-accent);
        --mce-field-text: var(--primary-text-color, #c8e0ec);

        /* Editor palette. The fixed dark/cyan look is retired — STYLING.md
           § Retired rules. The 24 distinct cyan values collapsed to the four
           design intents that were actually in use: tint fill, selected fill,
           border/ring, foreground. --mce-accent is HA's *accent*, not its
           primary: themes set the two differently, and primary is the colour
           of ordinary non-accented buttons. */
        --mce-accent: var(--accent-color, #00d4ff);
        --mce-accent-fill: color-mix(in srgb, var(--mce-accent) 8%, transparent);
        --mce-accent-fill-strong: color-mix(in srgb, var(--mce-accent) 16%, transparent);
        --mce-accent-line: color-mix(in srgb, var(--mce-accent) 45%, transparent);
        /* --mce-primary is HA's *primary* (ratava/issues#76): the default for
           ordinary chrome. --mce-accent stays reserved for undo-adjacent actions,
           selection/focus states, and things whose job is to be noticed. */
        --mce-primary: var(--primary-color, #00d4ff);
        --mce-primary-fill: color-mix(in srgb, var(--mce-primary) 8%, transparent);
        --mce-primary-fill-strong: color-mix(in srgb, var(--mce-primary) 16%, transparent);
        --mce-primary-line: color-mix(in srgb, var(--mce-primary) 45%, transparent);
        /* Neutral wash. Reads off the text colour so it inverts with the theme;
           the raw rgba(255,255,255,…) literals it replaces did not. */
        --mce-fill-subtle: color-mix(in srgb, var(--primary-text-color, #fff) 5%, transparent);
        /* Deliberately not themed: a scrim must darken whatever is beneath it,
           and the checkerboard must stay neutral to read alpha honestly. */
        --mce-scrim: rgba(0,0,0,0.55);
        --mce-checker: var(--secondary-background-color, #444);
        --mce-checker-sq: color-mix(in srgb, var(--mce-checker) 78%, var(--primary-text-color, #fff));
        /* Row action icons. Deliberately NOT themed: this is a traffic-light
           set where the colour carries the meaning — cyan copy/duplicate,
           green paste, red remove — and routing them through one theme accent
           would flatten three distinct actions into one. Fixed values, but
           behind tokens so the set is named and changeable in one place. The
           idle and hover-wash states are alpha steps of these, derived below
           rather than hand-written, so a change here moves all three states. */
        --mce-action-copy: #00d4ff;
        --mce-action-paste: #50c878;
        --mce-action-remove: #ff5050;
        /* Time-Until layout chips. Same reasoning as the action icons: the
           colour is what tells the three chip types apart. Each has a wash hue
           (background and border derive from it) and its own foreground, which
           is not an alpha step of the hue, so the pair is spelled out. */
        --mce-chip-label: #00d4ff;
        --mce-chip-label-fg: #5aadcc;
        --mce-chip-value: #ffffff;
        --mce-chip-value-fg: #dddddd;
        --mce-chip-newline: #ffc800;
        --mce-chip-newline-fg: #b89900;
      }
      /* ── Settings › About (#98) ── */
      .ec-about {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
      .ec-about-version {
        font-size: 13px;
        color: var(--secondary-text-color);
        font-family: monospace;
      }
      .ec-about-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--mce-primary);
        text-decoration: none;
        font-size: 14px;
      }
      .ec-about-link:hover {
        text-decoration: underline;
      }
      .ec-about-link ha-icon {
        --mdc-icon-size: 18px;
      }
      .ec-about-kofi img {
        display: block;
        border-radius: 6px;
      }

      /* ── Post-setup tutorial (#78) ── */
      .ec-tour {
        position: fixed; right: 18px; bottom: 18px; z-index: 9999;
        width: 340px; max-width: calc(100vw - 36px);
        background: var(--card-background-color, #0b1622);
        color: var(--primary-text-color, #e8f4ff);
        border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
        border-radius: 12px; padding: 14px 16px;
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
      }
      .ec-tour-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px; }
      .ec-tour-title { font-weight: 600; font-size: 14px; flex: 1; }
      .ec-tour-count { font-size: 11px; opacity: 0.6; }
      .ec-tour-body { margin: 0 0 12px; font-size: 12.5px; line-height: 1.5; color: var(--secondary-text-color, #b8c8d8); }
      .ec-tour-btns { display: flex; gap: 8px; align-items: center; }
      .ec-tour-spacer { flex: 1; }

      /* ── Onboarding wizard ── */
      /* The opaque dark panel used to be a workaround: the text below was
         fixed #fff/#aaa, so sitting on the theme's card background gave
         white-on-white in a light theme. Both sides are themed now, so the
         panel simply takes --card-background-color and the workaround is
         gone. Do not reintroduce a fixed background here. */
      .ec-wizard { padding: 24px; min-height: 280px; display: flex; flex-direction: column; background: var(--card-background-color, #0b131d); border-radius: 8px; }
      .ec-wiz-welcome { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 14px; padding: 16px 0; }
      .ec-wiz-icon { font-size: 48px; line-height: 1; }
      .ec-wiz-title { font-size: 20px; font-weight: 700; color: var(--mce-primary); margin: 0; }
      .ec-wiz-heading { font-size: 15px; font-weight: 600; color: var(--mce-primary); margin: 0 0 16px; }
      .ec-wiz-desc { font-size: 13px; color: var(--secondary-text-color, #aaa); margin: 0 0 16px; line-height: 1.5; }
      .ec-wiz-field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
      .ec-wiz-label { font-size: 12px; color: var(--secondary-text-color, #aaa); font-weight: 500; }
      .ec-wiz-input {
        background: var(--mce-field-bg);
        border: 1px solid var(--mce-field-border-color);
        border-radius: 6px; color: var(--primary-text-color, #fff); font-size: 13px;
        padding: 7px 10px; width: 100%; box-sizing: border-box;
      }
      .ec-wiz-input:focus { outline: none; border-color: var(--mce-field-focus-color); }
      .ec-wiz-select {
        background: var(--mce-field-bg);
        border: 1px solid var(--mce-field-border-color);
        border-radius: 6px; color: var(--primary-text-color, #fff); font-size: 13px;
        padding: 7px 10px; width: 100%; cursor: pointer;
      }
      .ec-wiz-select:focus { outline: none; border-color: var(--mce-field-focus-color); }
      .ec-wiz-row { display: flex; gap: 10px; margin-top: 20px; }
      .ec-wiz-end { justify-content: flex-end; }
      .ec-wiz-space { justify-content: space-between; }
      .ec-wiz-btn-primary {
        background: var(--mce-primary-fill-strong); border: 1px solid var(--mce-primary-line);
        border-radius: 20px; color: var(--mce-primary); font-size: 13px; font-weight: 600;
        padding: 8px 20px; cursor: pointer; letter-spacing: 0.04em;
      }
      .ec-wiz-btn-primary:hover { background: var(--mce-primary-fill-strong); box-shadow: 0 0 10px var(--mce-primary-line); }
      .ec-wiz-btn-ghost {
        background: transparent; border: 1px solid var(--divider-color, rgba(255,255,255,0.2));
        border-radius: 20px; color: var(--secondary-text-color, #888); font-size: 13px;
        padding: 8px 16px; cursor: pointer;
      }
      .ec-wiz-btn-ghost:hover { border-color: var(--divider-color, rgba(255,255,255,0.4)); color: var(--primary-text-color, #ccc); }
      .ec-wiz-btn-primary:disabled { opacity: 0.4; cursor: default; pointer-events: none; }
      .ec-wiz-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 4px 0 8px; }
      .ec-wiz-type-btn {
        display: flex; flex-direction: column; align-items: center; gap: 5px; text-align: center;
        padding: 16px 10px; border-radius: 10px; cursor: pointer;
        border: 2px solid var(--divider-color, rgba(255,255,255,0.1)); background: var(--mce-fill-subtle);
        transition: border-color 0.15s, background 0.15s;
      }
      .ec-wiz-type-btn:hover { border-color: var(--mce-primary-line); background: var(--mce-primary-fill); }
      .ec-wiz-type-btn.selected { border-color: var(--mce-accent); background: var(--mce-accent-fill-strong); }
      .ec-wiz-type-icon { font-size: 26px; line-height: 1; }
      .ec-wiz-type-title { font-size: 13px; font-weight: 600; color: var(--primary-text-color, #fff); }
      .ec-wiz-type-desc { font-size: 11px; color: var(--secondary-text-color, #888); line-height: 1.4; }
      .ec-wiz-ev-label { font-size: 12px; font-weight: 600; color: var(--mce-primary); margin-bottom: 10px; }
      .ec-wiz-reset-row { margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--divider-color, rgba(255,255,255,0.08)); display: flex; justify-content: flex-end; }
      .ec-wiz-btn-reset {
        background: var(--mce-accent);
        border: none;
        border-radius: 6px;
        color: var(--text-primary-color, #fff);
        font-size: 12px;
        padding: 5px 14px; cursor: pointer;
      }

      /* ── Preview wrapper ── */
      /* .ec-preview is a native <dialog>: kept open (non-modal) inline when
         collapsed, promoted to the top layer via showModal() when expanded.
         Reset the UA dialog styles so the collapsed state lays out like the
         plain div it used to be. */
      .ec-preview {
        position: relative;
        inset: auto;
        width: 100%;
        height: auto;
        max-width: none;
        max-height: none;
        margin: 0;
        padding: 0;
        border: none;
        background: transparent;
        color: inherit;
      }
      .ec-preview-card {
        display: block;
        width: 100%;
        --ha-card-padding: 0px;
        --ha-card-border-width: 0px;
        --ha-card-box-shadow: none;
      }
      .ec-canvas-area {
        position: relative;
        width: 100%;
      }
      .ec-open-editor-wrap {
        padding: 14px;
      }
      .ec-open-editor-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 13px;
        border: none;
        border-radius: 8px;
        background: var(--mce-primary);
        color: var(--text-primary-color, #fff);
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.02em;
        cursor: pointer;
        box-shadow: 0 3px 10px var(--mce-primary-line);
      }
      /* Brightness rather than a second accent literal, so the hover lift
         survives whatever colour the theme's accent turns out to be. */
      .ec-open-editor-btn:hover { filter: brightness(1.1); box-shadow: 0 5px 16px var(--mce-primary-line); }
      .ec-open-editor-btn ha-icon { --mdc-icon-size: 20px; }

      /* ── Fullscreen expanded preview ── */
      .ec-preview--expanded {
        position: relative;
        inset: 0;
        z-index: 9999;
        background: var(--primary-background-color, #111);
        outline: none;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        width: 70vw;
        height: auto;
        margin: auto;
      }
      .ec-expanded-bottom-bar {
        display: flex;
        flex-direction: row;
        align-items: center;
        background: var(--card-background-color, rgba(8,18,28,0.92));
        color: var(--primary-text-color);
        border-top: 1px solid var(--divider-color, rgba(0,212,255,0.18));
        padding: 6px 10px;
        box-sizing: border-box;
        gap: 8px;
        min-height: 80px;
      }
      .ec-preview--expanded .ec-expanded-bottom-bar {
        flex: 0 0 auto;
        z-index: 10;
      }
      .ec-preview--expanded .ec-canvas-area {
        flex: 0 0 auto;
        margin: auto;
      }
      .ec-bottom-bar-left {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }
      .ec-bottom-bar-center {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        padding: 0 8px;
        gap: 2px;
      }
      .ec-hint-text {
        font-size: 12px;
        /* Muted hint text — a secondary text colour, not an accent. The cyan
           fallback here was a text colour dressed as an accent. */
        color: var(--secondary-text-color, #7fa7bd);
        font-style: italic;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ec-quick-panel {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        justify-content: center;
      }
      .ec-quick-field {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
      }
      .ec-quick-field span {
        font-size: 14px;
        color: var(--primary-text-color, #c8e0ec);
        white-space: nowrap;
      }
      .ec-quick-field input {
        width: 6em;
      }
      .ec-side-close {
        background: var(--mce-primary);
        border: none;
        border-radius: 6px;
        /* --text-primary-color is HA's text-on-primary token; --primary-text-color
           is text-on-card-background and goes dark-on-blue in light themes. */
        color: var(--text-primary-color, #fff);
        font-size: 14px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
      }
      .ec-btn-done {
        background: var(--mce-primary);
        border: none;
        border-radius: 6px;
        color: var(--text-primary-color, #fff);
        font-size: 14px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
      }
      .ec-bar-top .ec-expanded-bottom-bar {
        border-top: none;
        border-bottom: 1px solid var(--divider-color, rgba(0,212,255,0.18));
      }
      .ec-bar-top.ec-preview--expanded .ec-expanded-bottom-bar {
        order: -1;
      }

      /* ── Grid-mode overlay ── */
      .ec-grid-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
      }
      .ec-grid-dot {
        position: absolute;
        width: 4px;
        height: 4px;
        margin: -2px 0 0 -2px;
        border-radius: 50%;
        background: rgba(0,212,255,0.35);
      }

      /* ── Preview handles ── */
      .ec-handles {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .ec-handle {
        position: absolute;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.8);
        transform: translate(-50%, -50%);
        pointer-events: auto;
        cursor: grab;
        box-sizing: border-box;
        transition: width 0.1s, height 0.1s, background 0.1s;
      }
      .ec-handle.selected {
        width: 12px;
        height: 12px;
        background: transparent;
        border: 2px solid var(--mce-accent);
        box-shadow: 0 0 4px var(--mce-accent);
      }
      .ec-handle.multi {
        width: 12px;
        height: 12px;
        background: transparent;
        border: 2px dashed var(--mce-accent);
        opacity: 0.7;
      }
      .ec-handle:active {
        cursor: grabbing;
      }
      .ec-handle.grouped::after {
        content: '';
        position: absolute;
        inset: -3px;
        border-radius: 50%;
        border: 1px dotted rgba(255, 200, 0, 0.8);
        pointer-events: none;
      }
      .ec-card-ov,
      .ec-emb-ov {
        position: absolute;
        box-sizing: border-box;
        pointer-events: auto;
        cursor: grab;
        background: transparent;
        border-radius: 4px;
      }
      .ec-card-ov:hover,
      .ec-emb-ov:hover {
        box-shadow: inset 0 0 0 1px rgba(0, 212, 255, 0.35);
      }
      .ec-card-ov:active,
      .ec-emb-ov:active {
        cursor: grabbing;
      }
      .ec-card-ov.selected,
      .ec-emb-ov.selected {
        box-shadow: inset 0 0 0 2px var(--mce-accent);
      }
      .ec-card-ov.multi,
      .ec-emb-ov.multi {
        outline: 2px dashed var(--mce-accent);
        outline-offset: -2px;
      }
      .ec-card-ov.grouped,
      .ec-emb-ov.grouped {
        outline: 1px dotted rgba(255, 200, 0, 0.8);
        outline-offset: -1px;
      }
      .ec-emb-handle.grouped::after {
        content: '';
        position: absolute;
        inset: -3px;
        border-radius: 3px;
        border: 1px dotted rgba(255, 200, 0, 0.8);
        pointer-events: none;
      }
      .ec-emb-handle {
        position: absolute;
        width: 12px;
        height: 12px;
        border-radius: 3px;
        background: rgba(180, 100, 255, 0.35);
        border: 1px solid rgba(200, 130, 255, 0.85);
        transform: translate(-50%, -50%) rotate(45deg);
        pointer-events: auto;
        cursor: grab;
        box-sizing: border-box;
        transition: width 0.1s, height 0.1s, background 0.1s;
      }
      .ec-emb-handle.selected {
        width: 14px;
        height: 14px;
        background: transparent;
        border: 2px solid #c87aff;
        box-shadow: 0 0 6px rgba(180, 100, 255, 0.7);
      }
      .ec-emb-handle:active { cursor: grabbing; }

      /* ── Controls chrome ── */
      .ec-controls {
        background: var(--card-background-color, #070f1a);
        padding: 0;
        border-top: 1px solid var(--divider-color, rgba(0,212,255,0.1));
      }
      .ec-preview--expanded .ec-controls {
        position: absolute;
        bottom: 41px;
        left: 0;
        right: 0;
        max-height: 45%;
        overflow-y: auto;
        z-index: 10;
        border-top: 1px solid var(--divider-color, rgba(0,212,255,0.3));
      }
      .ec-section {
        border-bottom: 1px solid var(--divider-color, rgba(255,255,255,0.05));
        padding: 10px 14px;
      }
      .ec-section--fields {
        background: var(--primary-background-color, rgba(0,180,220,0.07));
        min-height: 500px;
      }
      .ec-section:not(.ec-section--fields) + .ec-section--fields {
        margin-top: 8px;
        border-top: 1px solid var(--divider-color, rgba(0,212,255,0.18));
      }
      .ec-tu-chip {
        display: inline-flex;
        align-items: center;
        padding: 2px 9px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.04em;
        white-space: nowrap;
      }
      .ec-tu-chip--label {
        background: color-mix(in srgb, var(--mce-chip-label) 12%, transparent);
        color: var(--mce-chip-label-fg);
        border: 1px solid color-mix(in srgb, var(--mce-chip-label) 28%, transparent);
      }
      .ec-tu-chip--value {
        background: color-mix(in srgb, var(--mce-chip-value) 9%, transparent);
        color: var(--mce-chip-value-fg);
        border: 1px solid color-mix(in srgb, var(--mce-chip-value) 18%, transparent);
      }
      .ec-tu-chip--newline {
        background: color-mix(in srgb, var(--mce-chip-newline) 9%, transparent);
        color: var(--mce-chip-newline-fg);
        border: 1px solid color-mix(in srgb, var(--mce-chip-newline) 22%, transparent);
      }
      .ec-section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .ec-section-title {
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--secondary-text-color, #4a8aaa);
      }
      .ec-hint { font-size: 11px; color: var(--secondary-text-color, #777); margin: -6px 0 8px; line-height: 1.4; }
      .ec-subsection-title {
        font-size: 12px;
        font-weight: 700;
        color: var(--secondary-text-color, #5aadcc);
        margin: 18px 0 8px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 10px 0 0;
        border-top: 1px solid var(--divider-color, rgba(255,255,255,0.08));
      }
      .ec-section > .ec-subsection-title:first-child {
        border-top: none;
        padding-top: 0;
        margin-top: 4px;
      }
      /* Slider track-label blocks (left/center/right): the rule belongs between
         one label's Letter spacing and the next label's header, not mid-block
         at "Text style" — so the divider moves to the block boundary instead. */
      .ec-slider-pt .ec-subsection-title {
        border-top: none;
        padding-top: 0;
      }
      .ec-slider-pt + .ec-slider-pt {
        border-top: 1px solid var(--divider-color, rgba(255,255,255,0.08));
        margin-top: 12px;
        padding-top: 16px;
      }
      .ec-subsection-title--minor {
        font-size: 11.5px;
        font-weight: 600;
        font-style: normal;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        margin: 12px 0 5px;
        color: var(--secondary-text-color, #4a8aaa);
        padding: 0;
        border: none;
      }

      /* ── Ribbon navigation shell ── */
      /* Its own row above the trail: as trailing children of the wrapping
         breadcrumb these were the first things pushed onto a second line, and
         they moved whenever the path length changed. */
      .ec-nav-toolbar {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 2px;
        padding: 4px 14px 0;
        background: var(--card-background-color, #070f1a);
      }
      /* #93. Accent per STYLING.md §9: it exists to be noticed, and sits in the
         undo/redo run. Sized to the icon buttons beside it so the row reads as
         one group rather than a glyph tacked on the end. */
      .ec-help-hint {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        margin-left: 2px;
        border-radius: 50%;
        border: 1px solid color-mix(in srgb, var(--mce-accent) 45%, transparent);
        background: color-mix(in srgb, var(--mce-accent) 10%, transparent);
        color: var(--mce-accent);
        font-size: 13px;
        font-weight: 700;
        line-height: 1;
        cursor: help;
        user-select: none;
      }
      .ec-help-hint:hover {
        background: color-mix(in srgb, var(--mce-accent) 20%, transparent);
      }
      .ec-breadcrumb {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 2px;
        padding: 4px 14px 8px;
        font-size: 12px;
        border-bottom: 1px solid var(--divider-color, rgba(0,212,255,0.12));
        background: var(--card-background-color, #070f1a);
      }
      .ec-crumb {
        border: none;
        background: transparent;
        cursor: pointer;
        padding: 3px 6px;
        border-radius: 4px;
        font-weight: 500;
        font-size: 12px;
        font-family: inherit;
        color: var(--secondary-text-color, #6b93a8);
        /* Depth 4-5 crumbs would otherwise push the trail off-screen; the full
           label lives in the title tooltip. */
        max-width: 9em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ec-crumb:hover {
        background: var(--mce-primary-fill-strong);
      }
      .ec-crumb--active { color: var(--mce-accent); }
      .ec-crumb-sep {
        --mdc-icon-size: 14px;
        color: var(--secondary-text-color, #567788);
        opacity: 0.7;
      }
      .ec-undo-btn {
        border: none;
        background: transparent;
        cursor: pointer;
        padding: 3px 6px;
        border-radius: 4px;
        color: var(--secondary-text-color, #6b93a8);
        --mdc-icon-size: 16px;
        display: flex;
        align-items: center;
      }
      .ec-undo-btn:hover:not(:disabled) {
        background: var(--mce-primary-fill-strong);
        color: var(--mce-primary);
      }
      .ec-undo-btn:disabled { opacity: 0.35; cursor: default; }
      .ec-undo-toast {
        position: fixed;
        left: 50%;
        bottom: 20px;
        transform: translateX(-50%);
        z-index: 30;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 10px 16px;
        border-radius: 6px;
        background: var(--card-background-color, #0a1420);
        border: 1px solid var(--divider-color, rgba(0,212,255,0.25));
        box-shadow: 0 4px 16px rgba(0,0,0,0.45);
        color: var(--primary-text-color, #dceaf2);
        font-size: 13px;
      }
      .ec-undo-toast-btn {
        border: none;
        background: transparent;
        cursor: pointer;
        padding: 3px 6px;
        border-radius: 4px;
        /* Not the font shorthand: 'inherit' is invalid inside a shorthand and
           drops the whole declaration. */
        font-weight: 600;
        font-size: 13px;
        font-family: inherit;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: var(--mce-primary);
      }
      .ec-undo-toast-btn:hover:not(:disabled) {
        background: var(--mce-primary-fill-strong);
      }
      .ec-undo-toast-btn:disabled { opacity: 0.35; cursor: default; }

      .ec-nav-shell { display: flex; min-height: 50vh; }
      .ec-nav-rail {
        flex: 0 0 76px;
        display: flex;
        flex-direction: column;
        padding: 6px 0;
        gap: 2px;
        border-right: 1px solid var(--divider-color, rgba(0,212,255,0.12));
        background: var(--secondary-background-color, #0a1420);
      }
      .ec-nav-tab {
        position: relative;
        border: none;
        background: transparent;
        cursor: pointer;
        padding: 12px 4px 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        font-weight: 500;
        color: var(--secondary-text-color, #6b93a8);
      }
      .ec-nav-tab ha-icon { --mdc-icon-size: 21px; }
      .ec-nav-tab:hover { background: var(--mce-primary-fill); }
      .ec-nav-tab.active { color: var(--mce-accent); }
      .ec-nav-tab.active::before {
        content: '';
        position: absolute;
        left: 0; top: 6px; bottom: 6px;
        width: 3px;
        background: var(--mce-accent);
        border-radius: 0 3px 3px 0;
      }
      .ec-nav-list { flex: 1; min-width: 0; overflow-y: auto; padding: 4px 0; }
      /* Config health error count on the Settings tab (#65). Takes its pill shape
         from .ec-nav-card-badge and overrides only what differs: placement, a
         size step down, and the destructive fill. --text-primary-color, not
         --primary-text-color — this one sits on a filled swatch. */
      .ec-nav-tab-badge {
        position: absolute;
        top: 5px;
        right: 9px;
        min-width: 16px;
        height: 16px;
        line-height: 14px;
        font-size: 10px;
        background: var(--error-color, #db4437);
        border-color: var(--error-color, #db4437);
        color: var(--text-primary-color, #fff);
      }

      .ec-nav-item {
        width: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 11px 14px;
        border: none;
        border-bottom: 1px solid var(--divider-color, rgba(255,255,255,0.05));
        background: transparent;
        cursor: pointer;
        text-align: left;
        color: inherit;
        font: inherit;
      }
      .ec-nav-item:hover { background: var(--mce-primary-fill); }
      .ec-nav-item-icon { --mdc-icon-size: 20px; color: var(--mce-primary); flex: 0 0 auto; }
      .ec-nav-item-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
      .ec-nav-item-label { font-size: 13.5px; font-weight: 500; color: var(--primary-text-color, #dceaf2); }
      .ec-nav-item-hint {
        font-size: 11px;
        color: var(--secondary-text-color, #6b93a8);
        margin-top: 1px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ec-nav-item-chevron { --mdc-icon-size: 18px; color: var(--secondary-text-color, #567788); flex: 0 0 auto; }

      /* ── In-panel "Sections" nav cards (one level deeper than the flat ribbon item list) ── */
      .ec-nav-card {
        width: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 12px;
        margin-bottom: 7px;
        border: 1px solid var(--divider-color, rgba(0,212,255,0.14));
        border-radius: 9px;
        background: transparent;
        cursor: pointer;
        text-align: left;
        color: inherit;
        font: inherit;
        transition: background 0.15s, border-color 0.15s;
      }
      .ec-nav-card:hover {
        background: var(--mce-primary-fill);
        border-color: var(--mce-primary);
      }
      .ec-nav-card-icon { --mdc-icon-size: 20px; color: var(--mce-primary); flex: 0 0 auto; }
      .ec-nav-card-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
      .ec-nav-card-label { font-size: 13.5px; font-weight: 500; color: var(--primary-text-color, #dceaf2); }
      .ec-nav-card-hint {
        font-size: 11px;
        color: var(--secondary-text-color, #6b93a8);
        margin-top: 1px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ec-nav-card-chevron { --mdc-icon-size: 18px; color: var(--secondary-text-color, #567788); flex: 0 0 auto; }

      /* ── Override count badge & Clear overrides (#64) ── */
      /* Also the shape base for .ec-nav-tab-badge (#65). */
      .ec-nav-card-badge, .ec-nav-tab-badge {
        flex: 0 0 auto;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        box-sizing: border-box;
        border-radius: 9px;
        background: var(--mce-accent-fill);
        border: 1px solid var(--mce-accent);
        color: var(--mce-accent);
        font-size: 11px;
        font-weight: 600;
        line-height: 16px;
        text-align: center;
        font-variant-numeric: tabular-nums;
      }
      /* ── Config Health rows (#65) ── */
      .ec-health-group-title { display: flex; align-items: center; gap: 7px; }
      .ec-health-group-title ha-icon { --mdc-icon-size: 17px; color: var(--mce-primary); }
      /* The row is a plain container, not a button: the Remove / Ignore controls
         are nested buttons, and a button inside a button is invalid HTML that
         browsers reflow out of its parent. The clickable body is its own child. */
      .ec-health-row {
        border: 1px solid var(--divider-color, rgba(0,212,255,0.14));
        border-radius: 9px;
        margin-bottom: 7px;
        overflow: hidden;
      }
      .ec-health-row-body {
        width: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: flex-start;
        gap: 11px;
        padding: 12px 12px 8px;
        border: none;
        background: transparent;
        cursor: pointer;
        text-align: left;
        color: inherit;
        font: inherit;
        transition: background 0.15s;
      }
      .ec-health-row-body:hover:not([disabled]) { background: var(--mce-primary-fill); }
      .ec-health-row-body[disabled] { cursor: default; }
      /* A problem statement is a sentence, so it wraps — unlike every other
         nav-card label, which is a short screen name. */
      .ec-health-row .ec-nav-card-label { white-space: normal; line-height: 1.35; }
      .ec-health-row--error .ec-nav-card-icon { color: var(--error-color, #db4437); }
      .ec-health-row--info .ec-nav-card-icon { color: var(--secondary-text-color, #6b93a8); }
      .ec-health-row--ignored { opacity: 0.6; }
      .ec-health-row-where {
        font-size: 11px;
        color: var(--secondary-text-color, #6b93a8);
        margin-top: 3px;
      }
      .ec-health-row-actions {
        display: flex;
        justify-content: flex-end;
        gap: 6px;
        padding: 0 10px 9px;
      }
      .ec-health-btn {
        border: 1px solid var(--divider-color, rgba(0,212,255,0.18));
        border-radius: 6px;
        background: transparent;
        color: var(--secondary-text-color, #6b93a8);
        font: inherit;
        font-size: 11.5px;
        line-height: 1.6;
        padding: 2px 10px;
        cursor: pointer;
        transition: color 0.12s, border-color 0.12s, background 0.12s;
      }
      .ec-health-btn:hover { border-color: var(--mce-primary); color: var(--mce-primary); }
      /* Destructive, so it takes the shared remove colour rather than the accent
         — but its own shape, since .ec-btn-remove is a borderless glyph button. */
      .ec-health-btn-remove {
        color: var(--mce-action-remove);
        border-color: color-mix(in srgb, var(--mce-action-remove) 45%, transparent);
      }
      .ec-health-btn-remove:hover {
        color: var(--mce-action-remove);
        border-color: var(--mce-action-remove);
        background: color-mix(in srgb, var(--mce-action-remove) 12%, transparent);
      }
      .ec-health-ignored { margin-top: 14px; }
      .ec-health-ignored-toggle {
        display: flex;
        align-items: center;
        gap: 5px;
        border: none;
        background: transparent;
        cursor: pointer;
        color: var(--secondary-text-color, #6b93a8);
        font: inherit;
        font-size: 12px;
        padding: 4px 0 8px;
      }
      .ec-health-ignored-toggle ha-icon { --mdc-icon-size: 16px; }
      .ec-health-ignored-toggle:hover { color: var(--mce-primary); }
      .ec-health-coverage { margin-top: 10px; }

      .ec-clear-overrides {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
        margin: 0 0 12px;
        padding: 8px 10px;
        border: 1px solid var(--divider-color, rgba(0,212,255,0.14));
        border-radius: 9px;
      }
      .ec-clear-overrides-count { font-size: 12px; color: var(--secondary-text-color, #6b93a8); }
      .ec-btn-clear-overrides {
        padding: 5px 11px;
        border-radius: 7px;
        border: 1px solid var(--mce-accent);
        background: var(--mce-accent-fill);
        color: var(--mce-accent);
        font: inherit;
        font-size: 12px;
        cursor: pointer;
      }
      .ec-btn-clear-overrides:hover { background: var(--mce-accent); color: var(--card-background-color, #070f1a); }

      /* ── Editor-wide search on the ribbon root (#61) ── */
      .ec-nav-search { width: 100%; box-sizing: border-box; margin: 0 0 8px; }
      .ec-search-results { min-height: 50vh; }
      .ec-search-result.active {
        background: var(--mce-accent-fill);
        border-color: var(--mce-accent);
      }
      .ec-search-result-ctx {
        font-size: 10px;
        color: var(--secondary-text-color, #6b93a8);
        opacity: 0.8;
        margin-top: 1px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ec-search-more {
        font-size: 11px;
        color: var(--secondary-text-color, #6b93a8);
        text-align: center;
        margin: 6px 0 0;
      }

      .ec-panel-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-bottom: 1px solid var(--divider-color, rgba(0,212,255,0.12));
        background: var(--secondary-background-color, #0a1420);
      }
      .ec-panel-back {
        display: flex;
        align-items: center;
        gap: 4px;
        border: none;
        background: transparent;
        cursor: pointer;
        padding: 6px 8px 6px 4px;
        border-radius: 6px;
        color: var(--primary-text-color, #dceaf2);
        font-size: 12.5px;
        font-weight: 500;
      }
      .ec-panel-back:hover { background: var(--mce-primary-fill); }
      .ec-panel-back ha-icon { --mdc-icon-size: 18px; color: var(--mce-accent); }
      .ec-panel-header-icon { --mdc-icon-size: 18px; color: var(--mce-primary); }
      .ec-panel-header-title { font-size: 14px; font-weight: 600; color: var(--primary-text-color, #dceaf2); }
      .ec-panel-header-spacer { flex: 1; }
      .ec-panel-body { flex: 1; min-height: 50vh; overflow-y: auto; padding: 10px 14px 16px; }
      .ec-panel-desc {
        font-size: 12px;
        line-height: 1.5;
        color: var(--secondary-text-color, #6b93a8);
        margin: 0 0 10px;
      }

      /* ── List rows ── */
      .ec-list-row {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 5px 8px;
        border-radius: 6px;
        cursor: pointer;
        margin-bottom: 2px;
        border: 1px solid transparent;
        transition: background 0.15s, border-color 0.15s;
      }
      .ec-list-row:hover {
        background: var(--mce-primary-fill);
        border-color: var(--mce-primary-line);
      }
      .ec-list-row.selected {
        background: var(--mce-accent-fill-strong);
        border-color: var(--mce-accent);
      }
      .ec-list-row.multi {
        background: var(--mce-accent-fill);
        border: 1px dashed var(--mce-accent);
      }
      .ec-list-label {
        flex: 1;
        font-size: 15px;
        color: var(--primary-text-color, #b8d4e0);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* ── Item cards (bordered, icon + label + sub + chevron; matches ribbon-redesign mock) ── */
      .ec-item-card {
        width: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 11px 12px;
        margin-bottom: 6px;
        border: 1px solid var(--divider-color, rgba(0,212,255,0.14));
        border-radius: 9px;
        background: transparent;
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s;
        /* A mouse drag starts on the row body (#66), and native HTML5 drag used
           to suppress selection for us. Without this the drag paints a text
           selection across the label instead. Not touch-action: the row must
           still scroll under a finger — only the grip claims the gesture. */
        user-select: none;
        -webkit-user-select: none;
      }
      .ec-item-card:hover {
        background: var(--mce-primary-fill);
        border-color: var(--mce-primary);
      }
      .ec-item-card.selected {
        background: var(--mce-accent-fill-strong);
        border-color: var(--mce-accent);
      }
      .ec-item-card.multi {
        background: var(--mce-accent-fill);
        border-style: dashed;
        border-color: var(--mce-accent);
      }
      .ec-item-card.ec-dragging { opacity: 0.4; }
      .ec-item-card:focus-visible, .ec-nav-card:focus-visible, .ec-nav-item:focus-visible,
      .ec-list-row:focus-visible,
      .ec-crumb:focus-visible, .ec-nav-tab:focus-visible, .ec-panel-back:focus-visible {
        outline: 2px solid var(--mce-accent);
        outline-offset: -2px;
      }
      .ec-item-card-icon { --mdc-icon-size: 20px; color: var(--mce-primary); flex: 0 0 auto; }
      .ec-item-card-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
      .ec-item-card-label {
        font-size: 13.5px;
        font-weight: 500;
        color: var(--primary-text-color, #dceaf2);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ec-item-card-sub {
        font-size: 11px;
        color: var(--secondary-text-color, #6b93a8);
        margin-top: 1px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ec-item-card-actions { display: flex; align-items: center; gap: 2px; flex: 0 0 auto; }
      .ec-item-card-chevron { --mdc-icon-size: 18px; color: var(--secondary-text-color, #567788); flex: 0 0 auto; }

      /* ── Form rows ── */
      .ec-list-filter { width: 100%; box-sizing: border-box; margin: 0 0 8px; }
      .ec-panel-header-title:focus { outline: none; }
      .ec-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 7px;
        min-height: 30px;
      }
      .ec-label {
        flex: 0 0 130px;
        font-size: 13px;
        font-weight: 500;
        color: var(--primary-text-color, #dceaf2);
        letter-spacing: 0.01em;
      }
      .ec-control { flex: 1; min-width: 0; }
      /* #93: a hinted label is a hover target. Deliberately quiet — the ? in the
         toolbar teaches the convention once, so this only has to confirm it on
         the row you are already looking at. cursor:help overrides the wrapping
         label's pointer cursor. */
      .ec-label--hinted {
        cursor: help;
        text-decoration: underline dotted
          color-mix(in srgb, var(--primary-text-color, #dceaf2) 35%, transparent);
        text-underline-offset: 3px;
      }
      .ec-label--hinted:hover {
        text-decoration-color: var(--mce-primary, var(--primary-color));
      }
      .ec-label-hint { display: block; font-size: 10.5px; font-weight: 400; color: var(--secondary-text-color, #6b93a8); margin-top: 1px; }
      .ec-opt-control { display: flex; align-items: center; gap: 10px; }
      .ec-opt-inherit {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        /* The fixed-palette rule this used to cite is retired (STYLING.md
           § Retired rules), so it now themes like every other muted label. The
           literal stays as the fallback: it was lightened from #6b93a8, which
           sat at ~4.0:1 on #070f1a, below the 4.5:1 small-text target (#55). */
        color: var(--secondary-text-color, #7fa7bd);
        white-space: nowrap;
        cursor: pointer;
        flex: 0 0 auto;
      }
      .ec-opt-target { flex: 1; min-width: 0; }
      .ec-opt-target--disabled { opacity: 0.4; pointer-events: none; }
      .ec-mode-tiles { display: flex; gap: 8px; margin: 6px 0 14px; }
      .ec-mode-tile {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid var(--divider-color, rgba(0,212,255,0.14));
        background: transparent;
        color: var(--secondary-text-color, #6b93a8);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
      }
      .ec-mode-tile ha-icon { --mdc-icon-size: 24px; }
      .ec-mode-tile.active {
        border-color: var(--mce-accent);
        background: var(--mce-accent-fill-strong);
        color: var(--mce-accent);
      }
      .ec-row:has(ha-entity-picker) {
        flex-direction: column;
        align-items: stretch;
        min-height: unset;
      }
      .ec-row:has(ha-entity-picker) .ec-label {
        flex: none;
        margin-bottom: 2px;
      }
      .ec-input, .ec-select {
        width: 100%;
        box-sizing: border-box;
        background: var(--mce-field-bg);
        border: 1px solid var(--mce-field-border-color);
        border-radius: var(--mce-field-radius);
        padding: 5px 8px;
        font-size: var(--mce-field-font-size);
        color: var(--mce-field-text);
        outline: none;
        transition: border-color 0.15s, box-shadow 0.15s;
        -webkit-appearance: none;
        appearance: none;
      }
      .ec-input:focus, .ec-select:focus {
        border-color: var(--mce-field-focus-color);
        box-shadow: 0 0 0 2px var(--mce-accent-fill-strong);
      }
      .ec-input-num { width: 6em; }

      /* ── HA pickers ──
         Every HA picker we render gets the house field style rather than its
         native Material look. Three mechanisms, because a stylesheet cannot
         cross a shadow boundary:
           1. the host box is a child of OUR shadow root, so border/radius/size
              are directly settable here;
           2. anything the component itself reads is settable as a custom
              property on that host, and inherits inward — use the --ha-* token
              the component reads, never the --wa-*/--md-*/--mdc-* it maps to
              internally, since those are declared in the component's own :host
              and an inherited value loses to that (and HA is migrating off
              Material, so those names are disappearing);
           3. the Material row itself is 3-5 boundaries deep and reachable only
              by the stylesheet _injectPickerStyle pushes into its shadow root.
         .ec-attr-picker is the attribute <ha-selector> and .ec-nav-picker the
         navigate action's; both are two boundaries above their picker, so
         ::part(field) cannot reach them — properties and the injected style do. */
      ha-entity-picker, ha-icon-picker, ha-service-picker, .ec-attr-picker, .ec-nav-picker {
        display: block;
        width: 100%;
        box-sizing: border-box;
        border: 1px solid var(--mce-field-border-color);
        border-radius: var(--mce-field-radius);
        transition: border-color 0.15s;
        --ha-color-form-background: var(--mce-field-bg);
        --ha-color-form-background-disabled: var(--mce-field-bg);
        --ha-border-radius-sm: var(--mce-field-radius);
        --ha-combo-box-item-min-height: var(--mce-field-h);
        --mdc-icon-size: 20px;
      }
      ha-entity-picker:hover, ha-icon-picker:hover,
      ha-service-picker:hover, .ec-attr-picker:hover, .ec-nav-picker:hover {
        border-color: var(--mce-field-focus-color);
      }
      ha-entity-picker::part(field), ha-icon-picker::part(field),
      ha-service-picker::part(field) { min-height: var(--mce-field-h); }

      /* Additional CSS textarea (issue #12) — monospace, resizable; invalid
         declarations highlighted in var(--error-color) via .ec-css-invalid. */
      .ec-css-input {
        font-family: monospace;
        font-size: 12px;
        line-height: 1.4;
        resize: vertical;
        min-height: 38px;
        white-space: pre;
      }
      .ec-css-invalid {
        border-color: var(--error-color, #db4437) !important;
        color: var(--error-color, #db4437) !important;
      }

      /* Number stepper — mock's "Number fields: stepper style" control pattern. Wraps the
         existing editable input (unchanged) with +/- buttons that call its native
         stepUp()/stepDown(); direct typing still works. */
      .ec-num-wrap { display: inline-flex; align-items: center; gap: 3px; vertical-align: middle; }
      /* Our own +/- steppers replace the browser's. "appearance: none" on the
         input does not remove the inner spin button, so it has to be hidden
         explicitly or the field shows two sets of arrows. Scoped to
         .ec-num-wrap so the color picker's RGB inputs keep their native ones. */
      .ec-num-wrap input[type='number'] { -moz-appearance: textfield; }
      .ec-num-wrap input[type='number']::-webkit-inner-spin-button,
      .ec-num-wrap input[type='number']::-webkit-outer-spin-button {
        -webkit-appearance: none;
        appearance: none;
        margin: 0;
      }
      .ec-num-wrap .ec-input-num { width: 6em; }
      .ec-num-wrap .ec-input-num-small { width: 3em; }
      .ec-num-steppers { display: flex; gap: 2px; flex: 0 0 auto; }
      .ec-num-step {
        width: 20px;
        height: 24px;
        padding: 0;
        border: 1px solid var(--divider-color, rgba(0,212,255,0.2));
        border-radius: 5px;
        background: var(--mce-primary);
        color: var(--text-primary-color, #fff);
        font-size: 14px;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* Select chevron — mock's "Select (chevron)" control pattern, per the ribbon-redesign
         README control-pattern spec. Pure CSS so every existing <select class="ec-select">
         picks it up with no markup changes. */
      .ec-select {
        padding-right: 26px;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b93a8' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 6px center;
        background-size: 16px;
      }

      /* Toggle switch — mock's "Switch/toggle" control pattern. Pure CSS restyle of every
         existing <input type="checkbox">; no markup or state-handling changes required. */
      input[type="checkbox"] {
        -webkit-appearance: none;
        appearance: none;
        width: 38px;
        height: 21px;
        flex: 0 0 auto;
        border-radius: 11px;
        background: color-mix(in srgb, var(--primary-text-color, #ffffff) 12%, transparent);
        border: 1px solid var(--divider-color, rgba(0,212,255,0.2));
        position: relative;
        cursor: pointer;
        outline: none;
        vertical-align: middle;
        transition: background 0.15s, border-color 0.15s;
      }
      input[type="checkbox"]::before {
        content: '';
        position: absolute;
        top: 1px;
        left: 1px;
        width: 17px;
        height: 17px;
        border-radius: 50%;
        background: var(--card-background-color, #f5f8fa);
        box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        transition: transform 0.15s, background 0.15s;
      }
      input[type="checkbox"]:checked {
        background: var(--mce-accent);
        border-color: var(--mce-accent);
      }
      input[type="checkbox"]:checked::before {
        transform: translateX(17px);
        background: var(--text-primary-color, #fff);
      }
      input[type="checkbox"]:focus-visible {
        box-shadow: 0 0 0 2px var(--mce-accent-fill-strong);
      }

      /* ── Dual-range speed slider ── */
      .ec-dual-range { display: flex; align-items: center; gap: 8px; width: 100%; }
      .ec-dual-range-label { font-size: 11px; color: var(--secondary-text-color, #aaa); white-space: nowrap; }
      .ec-dual-range-track { position: relative; flex: 1; height: 22px; }
      .ec-dual-range-track input[type=range] {
        position: absolute; top: 3px; left: 0; width: 100%; margin: 0;
        -webkit-appearance: none; appearance: none;
        background: transparent; pointer-events: none; height: 16px;
      }
      .ec-dual-range-track input[type=range]::-webkit-slider-runnable-track {
        background: var(--divider-color, rgba(255,255,255,0.15)); border-radius: 4px; height: 4px;
      }
      .ec-dual-range-track input[type=range]::-moz-range-track {
        background: var(--divider-color, rgba(255,255,255,0.15)); border-radius: 4px; height: 4px;
      }
      .ec-dual-range-track input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none; pointer-events: all; cursor: pointer;
        width: 16px; height: 16px; border-radius: 50%;
        background: var(--mce-primary); border: 2px solid rgba(0,0,0,0.35);
        margin-top: -6px;
      }
      .ec-dual-range-track input[type=range]::-moz-range-thumb {
        pointer-events: all; cursor: pointer;
        width: 14px; height: 14px; border-radius: 50%;
        background: var(--mce-primary); border: 2px solid rgba(0,0,0,0.35);
      }

      /* ── Color picker ── */
      .ec-cp-wrap { position: relative; }
      .ec-color-row { display: flex; align-items: center; gap: 6px; }
      .ec-cp-alpha { padding: 6px 8px 2px; }
      .ec-cp-alpha-label {
        display: block; font-size: 11px; margin-bottom: 3px;
        color: var(--secondary-text-color, #aaa);
      }
      .ec-cp-alpha .ec-opacity-row input[type=range] { max-width: none; }
      .ec-opacity-row { display: flex; align-items: center; gap: 6px; }
      .ec-opacity-row input[type=range] { flex: 1; min-width: 80px; max-width: 140px; }
      .ec-opacity-val { min-width: 36px; text-align: right; font-size: 12px; color: var(--secondary-text-color, #aaa); }
      .ec-color-swatch-btn {
        width: 36px;
        height: 28px;
        flex-shrink: 0;
        border: 1px solid var(--divider-color, rgba(0,212,255,0.3));
        border-radius: 6px;
        cursor: pointer;
        padding: 0;
        /* Alpha checkerboard. The squares are mixed off the base rather than
           being a second literal, so on a light theme the pair inverts together
           and the board stays legible instead of washing out. */
        background-image: linear-gradient(45deg, var(--mce-checker-sq) 25%, transparent 25%),
          linear-gradient(-45deg, var(--mce-checker-sq) 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, var(--mce-checker-sq) 75%),
          linear-gradient(-45deg, transparent 75%, var(--mce-checker-sq) 75%);
        background-size: 8px 8px;
        background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
        background-color: var(--mce-checker);
        position: relative;
      }
      /* The colour sits on an overlay rather than the button's own background,
         so the checkerboard stays visible behind a translucent value. */
      .ec-color-swatch-btn::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: var(--mce-swatch, transparent);
      }
      .ec-color-text {
        flex: 1;
        min-width: 0;
        max-width: 6em;
        font-family: monospace;
        font-size: 12px;
        background: var(--secondary-background-color, rgba(255,255,255,0.06));
        border: 1px solid var(--divider-color, rgba(255,255,255,0.15));
        border-radius: 4px;
        color: var(--primary-text-color, #fff);
        padding: 3px 6px;
        height: 28px;
        box-sizing: border-box;
      }
      .ec-color-text::placeholder { color: var(--secondary-text-color, rgba(255,255,255,0.3)); }
      .ec-cp-backdrop {
        position: fixed;
        inset: 0;
        z-index: 9998;
      }
      .ec-cp-popup {
        /* Fixed, not absolute: an absolute popup is clipped by .ec-panel-body's
           scroll box, and clicks on the clipped part fall through to the
           backdrop and close the picker (#107). Coordinates come inline from
           the swatch rect at open time; max-height + scroll covers windows
           too short for the whole popup. */
        position: fixed;
        z-index: 9999;
        background: var(--card-background-color, #1a2332);
        border: 1px solid var(--divider-color, rgba(0,212,255,0.3));
        border-radius: 10px;
        padding: 10px;
        box-shadow: 0 8px 32px var(--mce-scrim);
        width: 220px;
        max-width: calc(100vw - 24px);
        max-height: calc(100vh - 24px);
        overflow-y: auto;
      }
      /* Focused programmatically on open (to catch Escape), never by the user. */
      .ec-cp-popup:focus { outline: none; }
      /* Gradient checkbox, inline after the swatch row's clear button (#91). */
      .ec-cp-grad-toggle {
        display: inline-flex; align-items: center; gap: 4px;
        flex: 0 0 auto; white-space: nowrap; cursor: pointer;
        font-size: 11px; letter-spacing: 0.02em;
        color: var(--secondary-text-color, #aaa);
      }
      .ec-cp-grad-toggle:hover { color: var(--primary-text-color, #ddd); }
      .ec-cp-main { width: 100%; }
      /* RGB / CSS mode switch */
      .ec-cp-modes {
        display: flex; margin-bottom: 8px; border-radius: 6px; overflow: hidden;
        border: 1px solid var(--divider-color, rgba(255,255,255,0.15));
      }
      .ec-cp-mode {
        flex: 1 1 0; padding: 5px 0; font-size: 11px; cursor: pointer;
        background: transparent; border: none; letter-spacing: 0.04em;
        color: var(--secondary-text-color, #aaa);
      }
      .ec-cp-mode + .ec-cp-mode { border-left: 1px solid var(--divider-color, rgba(255,255,255,0.15)); }
      .ec-cp-mode:hover { background: var(--mce-fill-subtle); color: var(--primary-text-color, #ddd); }
      .ec-cp-mode.active { background: var(--mce-accent-fill-strong); color: var(--mce-accent); font-weight: 600; }
      .ec-cp-popup hex-color-picker {
        width: 100%;
        --cp-border-radius: 6px;
        --cp-color-focus-color: var(--mce-accent);
      }
      .ec-cp-rgb {
        display: flex;
        gap: 6px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--divider-color, rgba(255,255,255,0.08));
      }
      .ec-cp-rgb-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        font-size: 10px;
        color: var(--secondary-text-color, #aaa);
        gap: 3px;
      }
      .ec-cp-rgb-input {
        width: 100%;
        text-align: center;
        background: var(--mce-field-bg);
        border: 1px solid var(--mce-field-border-color);
        border-radius: 4px;
        color: var(--mce-field-text);
        font-size: 11px;
        padding: 3px 0;
        -moz-appearance: textfield;
      }
      .ec-cp-rgb-input::-webkit-inner-spin-button,
      .ec-cp-rgb-input::-webkit-outer-spin-button { opacity: 0.4; }
      .ec-cp-presets {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--divider-color, rgba(255,255,255,0.08));
      }
      .ec-cp-preset {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 1px solid var(--divider-color, rgba(255,255,255,0.25));
        cursor: pointer;
        padding: 0;
        transition: transform 0.1s, border-color 0.1s;
      }
      .ec-cp-preset:hover { transform: scale(1.25); border-color: var(--primary-text-color, rgba(255,255,255,0.7)); }

      /* ── Color-picker theme/custom variable column (right of the picker) ── */
      .ec-cp-vars { width: 100%; display: flex; flex-direction: column; }
      .ec-cp-vars-title {
        font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em;
        color: var(--secondary-text-color, #888); padding: 0 2px 4px;
      }
      .ec-cp-vars-hint { font-size: 10px; color: var(--secondary-text-color, #888); line-height: 1.4; padding: 0 2px 8px; }
      .ec-cp-vars-list {
        max-height: 260px;
        overflow-y: auto; display: flex; flex-direction: column; gap: 2px;
      }
      .ec-cp-vars-list::-webkit-scrollbar { width: 8px; }
      .ec-cp-vars-list::-webkit-scrollbar-thumb { background: var(--divider-color, rgba(255,255,255,0.18)); border-radius: 4px; }
      .ec-cp-var-row {
        display: flex; align-items: center; gap: 8px; width: 100%; text-align: left;
        background: transparent; border: none; border-radius: 5px; cursor: pointer;
        padding: 5px 6px; color: var(--primary-text-color); font-size: 12px;
      }
      .ec-cp-var-row:hover { background: var(--mce-fill-subtle); }
      .ec-cp-var-chip {
        width: 18px; height: 18px; flex: 0 0 auto; border-radius: 4px;
        border: 1px solid var(--divider-color, rgba(255,255,255,0.3)); box-sizing: border-box;
      }
      .ec-cp-var-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ec-cp-vars-sep { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--secondary-text-color, #888); padding: 6px 6px 2px; }

      /* ── Buttons ── */
      .ec-flow-paths-overlay {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: visible;
        z-index: 2;
      }
      /* #71: wide invisible hit-stroke layered under the thin visible flow
         line — a 2.5-3px stroke is too fine a double-click target on its own. */
      .ec-flow-hit { cursor: pointer; }
      .ec-flow-name-input {
        font-size: 12px;
        padding: 3px 8px;
        border: 1px solid var(--mce-field-border-color);
        border-radius: 4px;
        background: var(--mce-field-bg);
        color: var(--mce-field-text);
        width: 120px;
        outline: none;
      }
      .ec-flow-name-input:focus {
        border-color: var(--mce-accent);
        box-shadow: 0 0 6px var(--mce-accent-fill-strong);
      }
      .ec-btn-add {
        display: flex;
        align-items: center;
        gap: 4px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        padding: 6px 13px;
        /* Separate the button from the list row above and any hint below it. */
        margin: 8px 0 6px;
        font-size: 12.5px;
        font-weight: 600;
        background: var(--mce-primary);
        color: var(--text-primary-color, #fff);
      }
      .ec-btn-remove {
        font-size: 13px;
        padding: 2px 6px;
        border: none;
        border-radius: 4px;
        background: transparent;
        color: color-mix(in srgb, var(--mce-action-remove) 60%, transparent);
        cursor: pointer;
        line-height: 1;
        transition: color 0.12s, background 0.12s;
        }
      .ec-btn-remove:hover {
        background: color-mix(in srgb, var(--mce-action-remove) 12%, transparent);
        color: var(--mce-action-remove);
      }
      .ec-btn-copy, .ec-btn-paste, .ec-btn-dup {
        font-size: 14px;
        padding: 2px 5px;
        border: none;
        border-radius: 4px;
        background: transparent;
        cursor: pointer;
        line-height: 1;
        transition: color 0.12s, background 0.12s;
      }
      .ec-btn-copy, .ec-btn-dup { color: color-mix(in srgb, var(--mce-action-copy) 55%, transparent); }
      .ec-btn-copy:hover, .ec-btn-dup:hover {
        background: color-mix(in srgb, var(--mce-action-copy) 12%, transparent);
        color: var(--mce-action-copy);
      }
      .ec-btn-paste { color: color-mix(in srgb, var(--mce-action-paste) 70%, transparent); }
      .ec-btn-paste:hover {
        background: color-mix(in srgb, var(--mce-action-paste) 12%, transparent);
        color: var(--mce-action-paste);
      }
      .ec-stat-yaml {
        margin: 6px 0 4px;
        border: 1px solid var(--mce-primary-line);
        border-radius: 6px;
        overflow: hidden;
      }
      .ec-stat-yaml-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 8px;
        background: var(--mce-primary-fill);
        font-size: 11px;
        color: var(--secondary-text-color, rgba(255,255,255,0.5));
        font-weight: 600;
        letter-spacing: 0.04em;
      }
      .ec-stat-yaml-code {
        margin: 0;
        padding: 8px;
        font-size: 10px;
        font-family: 'Courier New', monospace;
        color: var(--primary-text-color, rgba(255,255,255,0.7));
        background: var(--mce-fill-subtle);
        white-space: pre;
        overflow-x: auto;
        line-height: 1.5;
      }
      .ec-copy-badge {
        font-size: 10px;
        padding: 1px 5px;
        border-radius: 3px;
        background: var(--mce-accent-fill-strong);
        color: var(--mce-accent);
        letter-spacing: 0.04em;
      }
      /* The grip is the whole touch target for reorder on touch and pen (#66), so
         it is a finger-sized box with the two 14px bars centred inside it — the
         visual grip is unchanged, only its hit area grew. touch-action:none is
         what makes the gesture ours from the first event instead of the browser
         claiming it as a scroll, which is how scroll-vs-drag is settled here
         without a long-press timer. */
      .ec-drag-handle {
        width: 34px;
        flex-shrink: 0;
        align-self: stretch;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 3px;
        margin: -11px 0 -11px -12px;  /* eat the row's padding, so the box reaches its edges */
        padding: 2px 1px;
        cursor: grab;
        opacity: 0.35;
        border-radius: 3px;
        transition: opacity 0.12s;
        touch-action: none;
      }
      .ec-drag-handle::before, .ec-drag-handle::after {
        content: '';
        width: 14px;
        height: 2px;
        background: currentColor;
        border-radius: 1px;
      }
      .ec-drag-handle:hover { opacity: 0.75; }
      .ec-drag-handle:active { cursor: grabbing; }
      /* A list row's padding is 5px 8px, not the item card's 11px 12px, so the
         grip eats a different amount to reach the row's edges. */
      .ec-list-row .ec-drag-handle { margin: -5px 0 -5px -8px; }
      .ec-list-row.ec-dragging { opacity: 0.3; }
      /* Insertion line for a pointer reorder (#66). A line on the edge being
         inserted at reads better than a whole-row highlight, which says "onto
         this" rather than "between these". Inset, so it cannot change the
         row's size mid-drag. List rows carry it too: the Time-Until layout
         builder reorders through the same pointer machinery. */
      .ec-item-card.ec-drop-before, .ec-list-row.ec-drop-before { box-shadow: inset 0 3px 0 0 var(--mce-accent); }
      .ec-item-card.ec-drop-after, .ec-list-row.ec-drop-after { box-shadow: inset 0 -3px 0 0 var(--mce-accent); }
      /* Bare ✕ icon button, for unsetting a value and for dismissing a modal.
         Text buttons that used to borrow this class now use .ec-btn-ghost
         below — they were patching padding and radius inline to escape a
         glyph-sized box. */
      .ec-btn-clear {
        font-size: 13px;
        padding: 2px 6px;
        border: 1px solid var(--divider-color, rgba(255,255,255,0.1));
        border-radius: 4px;
        background: transparent;
        color: var(--secondary-text-color, #375f78);
        cursor: pointer;
        transition: border-color 0.12s, color 0.12s;
      }
      .ec-btn-clear:hover {
        border-color: var(--mce-primary);
        color: var(--mce-primary);
      }
      /* Secondary text button — Cancel, and mode switches like "Use JSON".
         Same quiet treatment as .ec-btn-clear but sized for a word rather than
         a glyph. Sized to sit level with .ec-btn-add so a Cancel/Save pair
         lines up without either side being nudged inline. Distinct from
         .ec-wiz-btn-ghost, which is the wizard's own pill-shaped variant. */
      .ec-btn-ghost {
        font-size: 12.5px;
        font-weight: 600;
        padding: 6px 14px;
        border: 1px solid var(--divider-color, rgba(255,255,255,0.1));
        border-radius: 5px;
        background: transparent;
        color: var(--secondary-text-color, #375f78);
        cursor: pointer;
        transition: border-color 0.12s, color 0.12s;
      }
      .ec-btn-ghost:hover {
        border-color: var(--mce-primary);
        color: var(--mce-primary);
      }
      /* Compact variant for a modal header, where the full-size button crowds
         the title row. */
      .ec-btn-ghost--sm { font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 4px; }

      .ec-align-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        padding: 2px 0 4px;
      }
      .ec-btn-align {
        font-size: 13px;
        font-weight: 500;
        padding: 4px 8px;
        border: none;
        border-radius: 6px;
        background: var(--mce-primary);
        /* Text sits ON the primary fill, so it needs --text-primary-color (white),
           not --primary-text-color (body text on card background, which is
           near-black in HA's default light theme). Same fix as #55. */
        color: var(--text-primary-color, #fff);
        cursor: pointer;
        white-space: nowrap;
      }
      .ec-empty {
        font-size: 14px;
        font-style: italic;
        color: var(--secondary-text-color, #375f78);
        margin: 4px 0;
      }
      button.ec-empty.ec-empty-action {
        display: block;
        width: 100%;
        box-sizing: border-box;
        text-align: left;
        background: transparent;
        border: 1px dashed var(--divider-color, rgba(0,212,255,0.2));
        border-radius: 8px;
        padding: 10px 12px;
        cursor: pointer;
      }
      button.ec-empty.ec-empty-action:hover {
        border-color: var(--mce-primary);
        background: var(--mce-primary-fill);
      }

      /* ── Zone handles ── */
      .ec-zone-handle {
        position: absolute;
        border: 1px dashed rgba(255, 200, 0, 0.5);
        border-radius: 3px;
        pointer-events: auto;
        cursor: grab;
        box-sizing: border-box;
        transition: border-color 0.15s;
      }
      .ec-zone-handle:hover {
        border-color: rgba(255, 200, 0, 0.85);
      }
      .ec-zone-handle.selected {
        border: 2px dashed #ffd23f;
        box-shadow: 0 0 6px rgba(255, 210, 63, 0.4);
      }
      .ec-zone-handle:active { cursor: grabbing; }
      .ec-zone-label {
        position: absolute;
        top: 3px;
        left: 4px;
        font-size: 10px;
        font-weight: 600;
        color: rgba(255, 210, 63, 0.9);
        pointer-events: none;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: calc(100% - 8px);
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
        letter-spacing: 0.03em;
      }

      .ec-zone-resize {
        position: absolute;
        width: 9px;
        height: 9px;
        background: #ffd23f;
        border: 1px solid var(--card-background-color, #1a2a36);
        border-radius: 2px;
        pointer-events: auto;
        z-index: 2;
      }
      .ec-zone-resize-tl { left: -5px; top: -5px; cursor: nwse-resize; }
      .ec-zone-resize-tr { right: -5px; top: -5px; cursor: nesw-resize; }
      .ec-zone-resize-bl { left: -5px; bottom: -5px; cursor: nesw-resize; }
      .ec-zone-resize-br { right: -5px; bottom: -5px; cursor: nwse-resize; }

      /* ── Background (canvas image) overlay ── */
      .ec-bg-ov {
        position: absolute;
        box-sizing: border-box;
        pointer-events: auto;
        cursor: grab;
        border: 1px dashed rgba(120, 200, 255, 0);
        transition: border-color 0.15s;
      }
      .ec-bg-ov:hover {
        border-color: rgba(120, 200, 255, 0.45);
      }
      .ec-bg-ov.selected {
        border: 2px dashed #57c7ff;
        box-shadow: 0 0 6px rgba(87, 199, 255, 0.35), inset 0 0 20px rgba(87, 199, 255, 0.08);
      }
      .ec-bg-ov:active { cursor: grabbing; }
      .ec-bg-resize {
        position: absolute;
        width: 11px;
        height: 11px;
        background: #57c7ff;
        border: 1px solid var(--card-background-color, #10222e);
        border-radius: 2px;
        pointer-events: auto;
        z-index: 3;
      }
      .ec-bg-resize-tl { left: -6px; top: -6px; cursor: nwse-resize; }
      .ec-bg-resize-tr { right: -6px; top: -6px; cursor: nesw-resize; }
      .ec-bg-resize-bl { left: -6px; bottom: -6px; cursor: nesw-resize; }
      .ec-bg-resize-br { right: -6px; bottom: -6px; cursor: nwse-resize; }

      /* ── Flow overlay ── */
      .ec-flow-layer {
        position: absolute;
        inset: 0;
        pointer-events: auto;
        cursor: crosshair;
        /* Above .ec-flow-paths-overlay's z-index:2 (#79) — a positioned sibling
         * with an explicit z-index always wins stacking over one left at auto,
         * regardless of DOM order, so without this the invisible wide
         * .ec-flow-hit dblclick stroke (#71) intercepted pointerdown/click
         * before it reached the point/snap handles beneath it. */
        z-index: 3;
      }
      .ec-snap {
        position: absolute;
        width: 9px;
        height: 9px;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 230, 120, 0.55);
        border: 1px solid #0f9;
        pointer-events: auto;
        cursor: pointer;
      }
      .ec-snap:hover {
        width: 13px;
        height: 13px;
      }
      .ec-flow-node {
        position: absolute;
        width: 11px;
        height: 11px;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: auto;
        box-sizing: border-box;
      }
      .ec-flow-node.free {
        background: #ffd23f;
        border: 1px solid #fff;
        cursor: grab;
      }
      .ec-flow-node.anchored {
        background: transparent;
        border: 2px solid #ffd23f;
        cursor: pointer;
      }
      .ec-flow-node.selected {
        box-shadow: 0 0 5px #ffd23f, 0 0 0 2px rgba(255, 255, 255, 0.5);
      }

      /* ── SVG library browser ── */
      .ec-lib-backdrop {
        position: fixed; inset: 0; z-index: 10100;
        background: var(--mce-scrim);
      }
      .ec-lib-modal {
        position: fixed; z-index: 10101;
        top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: min(520px, 94vw); max-height: 80vh;
        background: var(--card-background-color, rgba(10,18,28,0.97));
        border: 1px solid var(--mce-primary-line);
        border-radius: 12px;
        overflow-y: auto;
        padding: 0 0 12px;
        box-shadow: 0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px var(--mce-primary-fill);
      }
      .ec-lib-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 14px 16px 10px;
        border-bottom: 1px solid var(--divider-color, rgba(0,212,255,0.12));
        position: sticky; top: 0;
        background: var(--card-background-color, rgba(10,18,28,0.98));
        z-index: 1;
      }
      .ec-lib-title {
        font-size: 15px; font-weight: 700; color: var(--mce-primary); letter-spacing: 0.03em;
      }
      .ec-lib-cat {
        font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
        color: var(--secondary-text-color, #375f78); padding: 10px 16px 4px;
      }
      .ec-lib-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
        gap: 8px; padding: 4px 12px 0;
      }
      .ec-lib-item {
        display: flex; flex-direction: column; align-items: center; gap: 6px;
        background: var(--mce-fill-subtle); border: 1px solid var(--divider-color, rgba(255,255,255,0.08));
        border-radius: 8px; padding: 10px 6px 8px; cursor: pointer;
        transition: background 0.14s, border-color 0.14s, box-shadow 0.14s;
      }
      .ec-lib-item:hover {
        background: var(--mce-primary-fill-strong);
        border-color: var(--mce-primary-line);
        box-shadow: 0 0 12px var(--mce-primary-line);
      }
      .ec-lib-preview {
        width: 52px; height: 52px; object-fit: contain;
      }
      .ec-lib-thumb-placeholder {
        width: 52px; height: 52px;
        background: var(--mce-primary-fill);
        border: 1px dashed var(--mce-primary-line);
        border-radius: 4px;
      }
      .ec-lib-name {
        font-size: 10px; color: var(--secondary-text-color, #7aacbf); text-align: center;
        line-height: 1.3; word-break: break-word;
      }
      .ec-lib-browse-row {
        padding: 2px 0 6px;
        display: flex;
      }
      .ec-lib-browse-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        padding: 5px 14px;
        font-size: 12px;
        font-weight: 600;
        background: var(--mce-primary);
        color: var(--text-primary-color, #fff);
      }
    `,
  ];
}

// Type-system boundary: HTMLElementTagNameMap requires a literal key, so this is the
// one place a tag name bypasses src/tags.ts. Type-level only — in -dev builds the real
// runtime tag is the TAG_EDITOR suffixed form; keep the literal in sync with tags.ts.
declare global {
  interface HTMLElementTagNameMap {
    'mosaic-canvas-editor': MosaicCanvasEditor;
  }
}
