import { html, svg, css, nothing, type TemplateResult, type CSSResult } from 'lit';
import { html as staticHtml, unsafeStatic } from 'lit/static-html.js';
import type { HomeAssistant } from 'custom-card-helpers';
import { TAG_FILL, TAG_TOGGLE, TAG_SLIDER, TAG_DROPDOWN, TAG_SELECTOR, TAG_INPUT, TAG_SPINBOX, TAG_BUTTON, TAG_EMBEDDED } from './tags';
import { isControlField } from './types';
import type { FieldType } from './types';

// Static tag literals for elements (tag names are build-time suffixed for dev
// builds, so they can't be plain literals in the lit template).
const FILL_TAG = unsafeStatic(TAG_FILL);
const EMBED_TAG = unsafeStatic(TAG_EMBEDDED);
const CONTROL_TAGS: Partial<Record<FieldType, ReturnType<typeof unsafeStatic>>> = {
  toggle: unsafeStatic(TAG_TOGGLE),
  slider: unsafeStatic(TAG_SLIDER),
  dropdown: unsafeStatic(TAG_DROPDOWN),
  button_group: unsafeStatic(TAG_SELECTOR),
  input: unsafeStatic(TAG_INPUT),
  spinbox: unsafeStatic(TAG_SPINBOX),
  button: unsafeStatic(TAG_BUTTON),
};
import { formatFieldValue } from './format';
import type { VirtualMap } from './format';
import { calculateTimeUntil } from './time-until';
import type { StatsMap, HistoryMap, HistoryPoint } from './stats';
import { resolveGraphStat, describeWindow } from './stats';
// import { mcDebug, mcLog } from './debug';  // with the graph trace below (#123)
import type {
  MosaicCanvasConfig,
  BackgroundMode,
  BackgroundConfig,
  FieldConfig,
  IconRule,
  CardConfig,
  CardBackgroundConfig,
  GlobalDefaults,
  BoxStyle,
  ControlStyle,
  TextStyle,
  Anchor,
  Align,
  FlowEndpoint,
  FlowConfig,
  FlowSide,
  VirtualConfig,
  VisibilityCondition,
  TapActions,
  ZoneConfig,
  GraphSeries, GraphCurve, GraphLegendPos, GraphTimelineLabel,
  ExtendedCardConfig,
  ExtendedCardDefaults,
  EmbeddedCardConfig,
  TimeUntilLayoutItem,
  ChangeCallback,
} from './types';
import { cardLayoutMode, sd } from './seed-defaults';
import { actionGesture, hasAnyAction } from './gestures';
import { LIB_BASE } from './urls';
import type { SeedDefaults } from './seed-defaults';

/** Callback fired when the user taps/holds/double-taps an interactive element. */
export type ActionCallback = (
  actions: TapActions,
  entity: string | undefined,
  actionType: 'tap' | 'hold' | 'double_tap',
) => void;

/**
 * The per-render inputs every renderer threads through unchanged: the live
 * data sources and the host's two callbacks. Bundled so the render chain
 * (renderCard/renderExtendedCard → layoutFields → renderField) doesn't carry
 * six parallel parameters per hop.
 */
export interface RenderContext {
  hass: HomeAssistant | undefined;
  virtuals: VirtualMap;
  stats: StatsMap;
  history: HistoryMap;
  onAction?: ActionCallback;
  onChange?: ChangeCallback;
  /** Resolved URLs for media-source:// ids, keyed by id (#101). */
  mediaUrls?: Record<string, string>;
}

// ── Shared canvas dimensions ──────────────────────────────────────────────────

export interface CanvasDims {
  baseW: number;
  baseH: number;
  L: number;
  T: number;
  R: number;
  B: number;
  totalW: number;
  totalH: number;
}

export function computeCanvasDims(
  config: MosaicCanvasConfig | undefined,
  imgNatural?: { w: number; h: number },
): CanvasDims {
  const canvas = config?.canvas;
  const cw = canvas?.width;
  const ch = canvas?.height;
  const nat = imgNatural;
  // Image aspect (w/h); fall back to ~1.94 until the natural size is known.
  const aspect = nat && nat.h > 0 ? nat.w / nat.h : 1.94;

  let baseW: number;
  let baseH: number;
  if (cw != null && ch != null) {
    // Both given: use as-is (may intentionally distort).
    baseW = cw;
    baseH = ch;
  } else if (cw != null) {
    // Only width given: derive height from the image aspect (NOT raw natural h).
    baseW = cw;
    baseH = Math.round(cw / aspect);
  } else if (ch != null) {
    // Only height given: derive width from the image aspect.
    baseH = ch;
    baseW = Math.round(ch * aspect);
  } else {
    // Always use the configured fallback width, derive height from image aspect ratio.
    // Using raw natural size (e.g. 3840px) would make design coordinates screen-resolution
    // dependent and break handle positioning when the image loads late.
    baseW = sd('canvas_fallback_width') ?? 1000;
    baseH = nat && nat.w > 0 ? Math.round(baseW / (nat.w / nat.h)) : Math.round(baseW / 1.94);
  }

  const ext = canvas?.extend;
  const L = ext?.left ?? 0;
  const R = ext?.right ?? 0;
  const T = ext?.top ?? 0;
  const B = ext?.bottom ?? 0;

  return { baseW, baseH, L, T, R, B, totalW: baseW + L + R, totalH: baseH + T + B };
}

// ── Anchor → CSS transform ────────────────────────────────────────────────────

export const ANCHOR_TRANSLATE: Record<Anchor, string> = {
  center: 'translate(-50%, -50%)',
  top: 'translate(-50%, 0)',
  bottom: 'translate(-50%, -100%)',
  left: 'translate(0, -50%)',
  right: 'translate(-100%, -50%)',
  'top-left': 'translate(0, 0)',
  'top-right': 'translate(-100%, 0)',
  'bottom-left': 'translate(0, -100%)',
  'bottom-right': 'translate(-100%, -100%)',
};

/** Visual bounding box of a card in design-px coordinates. */
export interface CardBox { x: number; y: number; w: number; h: number; }

/** Fractional [x, y] position within a box for each Anchor value. */
export const ANCHOR_FRAC: Record<Anchor, [number, number]> = {
  center:        [0.5, 0.5],
  top:           [0.5, 0  ],
  bottom:        [0.5, 1  ],
  left:          [0,   0.5],
  right:         [1,   0.5],
  'top-left':    [0,   0  ],
  'top-right':   [1,   0  ],
  'bottom-left': [0,   1  ],
  'bottom-right':[1,   1  ],
};

/** Resolve a FlowSide to an absolute {x,y} within a CardBox. */
function sidePoint(box: CardBox, side: FlowSide): { x: number; y: number } {
  switch (side) {
    case 'top':    return { x: box.x + box.w / 2, y: box.y };
    case 'right':  return { x: box.x + box.w,     y: box.y + box.h / 2 };
    case 'bottom': return { x: box.x + box.w / 2, y: box.y + box.h };
    case 'left':   return { x: box.x,             y: box.y + box.h / 2 };
    case 'center': return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
  }
}

function alignToItems(align: Align | undefined): string {
  if (align === 'center') return 'center';
  if (align === 'right') return 'flex-end';
  return 'flex-start';
}

// ── Background helpers (unchanged contract) ───────────────────────────────────

/** Resolve the active background mode from config + hass state. */
export function resolveMode(
  config: MosaicCanvasConfig | undefined,
  hass: HomeAssistant | undefined,
): BackgroundMode {
  const bg = config?.background;
  // 'single' and 'state' are not day/night methods at all, but resolveMode is
  // read by callers that only want a mode word — give them the neutral one
  // rather than letting the sun branch below decide something meaningless.
  if (!bg || bg.source === 'day' || bg.source === 'single' || bg.source === 'state') return 'day';
  if (bg.source === 'night') return 'night';
  if (bg.source === 'entity') {
    const st = bg.mode_entity ? hass?.states[bg.mode_entity] : undefined;
    const raw = st ? (bg.mode_attribute ? st.attributes?.[bg.mode_attribute] : st.state) : undefined;
    return raw != null && /^(night|on|true)$/i.test(String(raw)) ? 'night' : 'day';
  }
  const sun = hass?.states[bg.sun_entity ?? sd('sun_entity') ?? 'sun.sun'];
  const sunRaw = sun ? (bg.sun_attribute ? sun.attributes?.[bg.sun_attribute] : sun.state) : undefined;
  return sunRaw === 'below_horizon' ? 'night' : 'day';
}

/**
 * The canvas background image, by whichever of the three methods `source`
 * names (#103):
 *
 *   'single'  → the one fixed `url`
 *   'state'   → the rule whose value matches `entity`'s state
 *   otherwise → images[mode][evCount], the original day/night matrix
 *
 * The state method has no default image behind it: nothing matching paints no
 * background. That mirrors the day/night method, where a mode with no image
 * configured has always painted nothing, rather than the card method, where
 * the card's own `url` is a genuine fallback.
 */
export function resolveBackgroundUrl(
  config: MosaicCanvasConfig | undefined,
  hass: HomeAssistant | undefined,
  mediaUrls?: Record<string, string>,
): string | undefined {
  const bg = config?.background;
  if (bg?.source === 'single') return resolveImageUrl(bg.url, mediaUrls);
  if (bg?.source === 'state') return resolveImageUrl(matchBgRule(bg, hass), mediaUrls);

  const images = bg?.images?.[resolveMode(config, hass)];
  if (!images) return undefined;

  const target = Number(config?.ev_count ?? 0);
  if (images[String(target)]) return resolveImageUrl(images[String(target)], mediaUrls);

  const counts = Object.keys(images)
    .map(Number)
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);

  let pick: number | undefined;
  for (const c of counts) if (c <= target) pick = c;
  if (pick === undefined && counts.length) pick = counts[0];
  return pick !== undefined ? resolveImageUrl(images[String(pick)], mediaUrls) : undefined;
}

/** The rule whose value matches the selector entity's state, if any. */
function matchBgRule(
  bg: BackgroundConfig,
  hass: HomeAssistant | undefined,
): string | undefined {
  if (!bg.entity) return undefined;
  const state = hass?.states[bg.entity]?.state;
  if (state == null) return undefined;
  for (const rule of bg.rules ?? []) {
    if (!rule.url || rule.value == null || rule.value === '') continue;
    if (bgValueMatches(state, rule.value)) return rule.url;
  }
  return undefined;
}

/**
 * Words HA uses for a boolean state, so `true` can match `on`.
 *
 * Deliberately narrow: `open`/`home` and friends were in here, which made a rule
 * value of `on` match a state of `home`. Those are domain words that happen to
 * read as truthy, not boolean spellings, and collapsing them together means a
 * rule silently matches states it never named.
 */
const BG_TRUTHY = new Set(['true', 'on', 'yes', '1']);
const BG_FALSY  = new Set(['false', 'off', 'no', '0']);

/**
 * Does an entity state satisfy a background rule's value?
 *
 * Three passes, cheapest first, because a rule value is typed by hand and may
 * be a string, a number or a boolean:
 *   1. string — exact, then case-insensitive ("Home" matches "home")
 *   2. numeric — both sides parse as finite numbers ("21" matches "21.0")
 *   3. boolean — both sides are a known truthy/falsy word ("true" matches "on")
 *
 * Numeric runs before boolean so "1" vs "0" is decided as arithmetic rather
 * than by the boolean word lists, which also carry those two digits.
 */
export function bgValueMatches(state: string | undefined, value: string): boolean {
  if (state == null) return false;
  const a = state.trim();
  const b = value.trim();
  if (a === b) return true;
  const al = a.toLowerCase();
  const bl = b.toLowerCase();
  if (al === bl) return true;

  const an = Number(a);
  const bn = Number(b);
  if (a !== '' && b !== '' && Number.isFinite(an) && Number.isFinite(bn)) return an === bn;

  const aBool = BG_TRUTHY.has(al) ? true : BG_FALSY.has(al) ? false : undefined;
  const bBool = BG_TRUTHY.has(bl) ? true : BG_FALSY.has(bl) ? false : undefined;
  return aBool !== undefined && aBool === bBool;
}

/**
 * The image a card should paint: the rule whose value matches the selector
 * entity's state, else the card's own `url`.
 *
 * Rules are keyed by state, not ranked, so the scan order is an implementation
 * detail — at most one rule should claim any given value.
 *
 * `url` is the fallback for every failure mode — no entity, no rules, an
 * entity that isn't in `hass.states` (unavailable, renamed, not yet loaded),
 * or a state nothing matches — so a card configured this way always degrades
 * to the single-image behaviour rather than losing its background.
 */
export function resolveCardBgUrl(
  bg: CardBackgroundConfig | undefined,
  hass: HomeAssistant | undefined,
  mediaUrls?: Record<string, string>,
): string | undefined {
  const pick = (): string | undefined => {
    if (!bg) return undefined;
    if (!bg.entity || !bg.rules?.length) return bg.url;
    const state = hass?.states[bg.entity]?.state;
    if (state == null) return bg.url;
    for (const rule of bg.rules) {
      if (!rule.url || rule.value == null || rule.value === '') continue;
      if (bgValueMatches(state, rule.value)) return rule.url;
    }
    return bg.url;
  };
  return resolveImageUrl(pick(), mediaUrls);
}

/**
 * Turn a stored image value into something an <img>/CSS url() can use.
 *
 * Three shapes, mirroring resolveSvgUrl's convention (#96):
 *   • bare filename        → a background shipped with the card, paired with
 *                            LIB_BASE so it follows the install folder
 *   • media-source:// id   → looked up in the resolved-URL map; undefined until
 *                            the element has resolved it, so the image simply
 *                            isn't painted yet rather than painting a bad URL
 *   • anything with a '/'  → the user's own path or URL, used exactly as given
 */
export function resolveImageUrl(
  value: string | undefined,
  mediaUrls?: Record<string, string>,
): string | undefined {
  if (!value) return undefined;
  if (value.startsWith('media-source://')) return mediaUrls?.[value];
  if (!value.includes('/')) return LIB_BASE + value;
  return value;
}

// ── Style cascade helpers ─────────────────────────────────────────────────────

/** Merge box styles: defaults.card wins over nothing; card.box wins over defaults.card. */
export function resolveCardBox(card: CardConfig, defaults: GlobalDefaults | undefined): BoxStyle {
  return {
    ...defaults?.card,
    ...card.box,
    // Additional CSS cascades (both apply, per-card wins) rather than being overridden.
    extra_css: cascadeCss(defaults?.card?.extra_css, card.box?.extra_css) || undefined,
  };
}

/**
 * The inline style for an embedded card's own box (#92), or `''` when neither
 * tier sets anything.
 *
 * The empty-string case is load-bearing rather than tidiness: `boxCss()` always
 * emits `border-radius` and `padding`, so calling it unconditionally would put
 * two declarations on every embedded card that has never been styled. Returning
 * nothing keeps an untouched dashboard byte-identical to before the feature.
 *
 * `box-sizing` is set alongside because the host also carries the card's `width`
 * — without it a padding value would widen the footprint instead of insetting
 * the card, the same reason `renderCard` sets it on a grouped card.
 *
 * The box decorates the element that *holds* the third-party card. It has
 * nothing to do with `EmbeddedCardConfig.transparent`, which reaches inside and
 * strips that card's own chrome.
 */
export function embeddedBoxCss(
  ec: EmbeddedCardConfig,
  defaults: GlobalDefaults | undefined,
): string {
  const g = defaults?.embedded_card;
  if (!g && !ec.box) return '';
  const box: BoxStyle = {
    ...g,
    ...ec.box,
    extra_css: cascadeCss(g?.extra_css, ec.box?.extra_css) || undefined,
  };
  const css = boxCss(box);
  return css ? `box-sizing:border-box;${css};` : '';
}

/**
 * The other half of an embedded card's styling — what reaches *inside* the
 * shadow boundary onto the third-party card, as opposed to `embeddedBoxCss`
 * above, which decorates the host holding it.
 *
 * Both tiers live here rather than at the call site so the pair stays one
 * decision: `transparent` picks a tier (a card that sets it wins outright,
 * `undefined` follows the global), while the CSS concatenates, which is what
 * every other Additional CSS in the card does — see `cascadeCss`. They differ
 * because a boolean has nothing to merge.
 */
export function embeddedInner(
  ec: EmbeddedCardConfig,
  defaults: GlobalDefaults | undefined,
): { transparent: boolean; extraCss: string | undefined } {
  return {
    transparent: ec.transparent ?? defaults?.embedded_card_transparent ?? false,
    extraCss: cascadeCss(defaults?.embedded_card_extra_css, ec.extra_css) || undefined,
  };
}

/**
 * Build the resolved TextStyle for a field.
 * Merge order (later wins):
 *   { font_family: defaults?.font_family }
 *   → defaults?.label | defaults?.value   (base by field type)
 *   → card.label_style | card.value_style (per-card override)
 *   → field.style                          (per-field override)
 */
export function resolveText(
  field: FieldConfig,
  card: CardConfig,
  defaults: GlobalDefaults | undefined,
): TextStyle {
  const base: TextStyle = field.type === 'label' ? (defaults?.label ?? {}) : (defaults?.value ?? {});
  const cardOverride: TextStyle =
    field.type === 'label' ? (card.label_style ?? {}) : (card.value_style ?? {});
  return {
    font_family: defaults?.font_family,
    ...base,
    ...cardOverride,
    ...field.style,
    // Additional CSS cascades global text style → per-card → per-field style →
    // the field's own extra_css (later wins), rather than being overridden.
    extra_css: cascadeCss(base.extra_css, cardOverride.extra_css, field.style?.extra_css, field.extra_css) || undefined,
  };
}

/** Every control-style property resolved to a concrete value. */
export interface ResolvedControlStyle {
  accent_color: string;
  /** Accent as a background: gradient when `accent_color2` is set, else the flat accent. */
  accent_paint: string;
  gradient_angle: number;
  /**
   * `*_paint` values are the resolved *background* for a surface: a
   * `linear-gradient(…)` when that surface's `…_color2` / `…_bg2` partner is
   * set, otherwise the flat colour. The plain colour keys are kept alongside
   * because some of them are also used for borders and text, where a gradient
   * is not a legal value.
   */
  toggle_on_paint: string;
  toggle_off_paint: string;
  slider_track_paint: string;
  slider_fill_paint: string;
  dropdown_bg_paint: string;
  dropdown_menu_bg_paint: string;
  dropdown_selected_paint: string;
  button_group_bg_paint: string;
  button_group_selected_paint: string;
  button_bg_paint: string;
  button_selected_paint: string;
  input_bg_paint: string;
  spinbox_bg_paint: string;
  spinbox_button_hover_paint: string;
  toggle_on_color: string;
  toggle_off_color: string;
  toggle_thumb_color: string;
  toggle_thumb_size: number;
  toggle_thumb_radius: number;
  toggle_thumb_padding: number;
  slider_track_color: string;
  slider_fill_color: string;
  slider_thumb_color: string;
  slider_thumb_size: number;
  slider_thumb_width: number;
  slider_thumb_radius: number;
  slider_thumb_padding: number;
  slider_height: number;
  /** undefined = the track flexes to the available width. */
  slider_length?: number;
  slider_radius: number;
  slider_border: boolean;
  slider_border_color: string;
  slider_border_width: number;
  dropdown_border_color: string;
  dropdown_bg: string;
  dropdown_radius: number;
  dropdown_text_size: number;
  dropdown_menu_bg: string;
  dropdown_menu_border_color: string;
  dropdown_selected_color: string;
  button_group_border_color: string;
  button_group_bg: string;
  button_group_radius: number;
  button_group_text_size: number;
  button_group_selected_color: string;
  button_group_selected_text_color: string;
  button_group_text_color: string;
  button_group_icon_color: string;
  button_group_state_color: string;
  button_group_selected_icon_color: string;
  button_group_selected_state_color: string;
  button_group_border_width: number;
  button_group_icon_size: number;
  button_group_state_size: number;
  button_group_option_gap: number;
  button_group_option_padding: number | undefined;
  button_group_option_border: boolean;
  button_group_option_border_color: string;
  button_group_option_border_width: number;
  button_group_option_radius: number;
  button_group_option_extra_css: string;
  button_border_color: string;
  button_bg: string;
  button_radius: number;
  button_text_size: number;
  button_selected_color: string;
  button_selected_text_color: string;
  button_text_color: string;
  button_icon_color: string;
  button_state_color: string;
  button_selected_icon_color: string;
  button_selected_state_color: string;
  button_border_width: number;
  button_icon_size: number;
  button_state_size: number;
  button_option_padding: number | undefined;
  input_border_color: string;
  input_bg: string;
  input_radius: number;
  input_text_size: number;
  input_focus_color: string;
  spinbox_border_color: string;
  spinbox_bg: string;
  spinbox_radius: number;
  spinbox_text_size: number;
  spinbox_button_hover_color: string;
  spinbox_button_width: number;
  spinbox_button_font_size: number;
  dropdown_menu_radius: number;
  dropdown_option_radius: number;
  dropdown_option_text_color: string;
  dropdown_option_hover_color: string;
  dropdown_menu_shadow: string;
  input_placeholder_color: string;
  slider_thumb_shadow: string;
  toggle_thumb_shadow: string;
}

/**
 * Control density: the three knobs that reach the control-internal literals no
 * `ControlStyle` key touches (#74 Phase 7).
 *
 * All three are *optional at every tier* and unset by default. That is the whole
 * design: the natural sizes across the six controls are a deliberate hierarchy
 * (13px body, 12px slider readout, 11px track labels; 8px between a control and
 * its label, 2px between two label rows), and seeding any single value would
 * flatten it for everyone on upgrade. Unset, each CSS site falls back to its own
 * literal and nothing changes; set, one value scales the whole surface.
 *
 * The CSS sites scale off the base rather than adopting it flat — `calc(var(…) * 2)`
 * for the wrapper gaps, `calc(var(…) - 1px)` for the secondary text — so the ratios
 * survive. With the fallbacks in place every current literal is reproduced exactly.
 */
export interface ControlDensity {
  font_size: number | undefined;
  padding: string | undefined;
  gap: number | undefined;
}

export function resolveControlDensity(defaults: GlobalDefaults | undefined): ControlDensity {
  return {
    font_size: defaults?.control_font_size ?? sd('control_font_size'),
    padding: defaults?.control_padding ?? sd('control_padding'),
    gap: defaults?.control_gap ?? sd('control_gap'),
  };
}

/**
 * The `--mc-ctl-*` custom properties for a resolved density, written once on the
 * control wrapper in `McControl.render` so they inherit to every control's shadow
 * CSS. Only resolved values are emitted — an unwritten property leaves each site's
 * own literal fallback in play, which is what "unset means natural" requires.
 */
export function controlDensityVars(d: ControlDensity): string {
  return (d.font_size != null ? `--mc-ctl-fs:${d.font_size}px;` : '')
    + (d.padding ? `--mc-ctl-pad:${d.padding};` : '')
    + (d.gap != null ? `--mc-ctl-gap:${d.gap}px;` : '');
}

/**
 * Resolve the visual style for a control field.
 * Merge order (later wins): built-in fallback → seed → defaults.control_style → field.control_style.
 * `accent_color` is resolved first, then used as the fallback for slider fill and
 * toggle-on when those remain unset — so setting one accent themes the whole control.
 *
 * The seed tier (#74 Phase 7) is what makes an installation-wide control restyle
 * possible without editing every card. It ships numerics only — see the note on
 * `SeedDefaults.control_style`.
 */
export function resolveControlStyle(
  field: FieldConfig,
  defaults: GlobalDefaults | undefined,
): ResolvedControlStyle {
  const g = defaults?.control_style;
  const f = field.control_style;
  const s = sd('control_style');
  const pick = <K extends keyof ControlStyle>(k: K): ControlStyle[K] | undefined => f?.[k] ?? g?.[k] ?? s?.[k];

  /**
   * A text size that also answers to the general `control_font_size` knob (#74
   * Phase 7). Font size is the only density knob that collides with a `ControlStyle`
   * key and so has to be resolved here — padding and gap reach the CSS directly,
   * through `--mc-ctl-*` tokens no seeded key feeds. See `resolveControlDensity`.
   *
   * The ordering matters and is not `pick() ?? density`: the five `*_text_size` keys
   * *are* seeded, so a plain `pick()` would always find 13 in the seed tier and the
   * knob would never be reached. Specific beats general **within** a tier, and any
   * tier beats the one below it:
   *
   *   field.control_style.x → defaults.control_style.x → defaults.control_font_size
   *   → seed control_style.x → seed control_font_size → literal
   */
  const sized = (k: keyof ControlStyle, literal: number): number =>
    (f?.[k] as number | undefined)
    ?? (g?.[k] as number | undefined)
    ?? defaults?.control_font_size
    ?? (s?.[k] as number | undefined)
    ?? sd('control_font_size')
    ?? literal;

  // --accent-color, not --primary-color. Most themes set the two differently —
  // the Material convention HA follows is a blue primary and an orange accent —
  // and primary is the colour of ordinary, non-accented buttons. This key is
  // Mosaic's accent, so it maps to HA's.
  const accent = pick('accent_color') ?? 'var(--accent-color, #00d4ff)';
  // Deliberately NOT --divider-color, and the field fills below are not a theme
  // surface: both are translucent white over an arbitrary photo, so the alpha is
  // the contrast guarantee. A solid theme colour loses it. STYLING.md §8.
  const BORDER = 'rgba(255,255,255,0.25)';
  const FIELD_BG = 'rgba(255,255,255,0.06)';
  // Text on an accent-filled surface. --text-primary-color is HA's only "text
  // on a coloured background" token — there is no accent-specific counterpart —
  // and it is white in the default theme, which is right over the default
  // orange accent. Note it is --text-primary-color, not --primary-text-color,
  // which is body text on the card background. STYLING.md §4 has the pair.
  const SELECTED_TEXT = 'var(--text-primary-color, #fff)';
  // Thumb radius defaults to half the thumb size, i.e. a circle.
  const toggleThumbSize = pick('toggle_thumb_size') ?? 18;
  const sliderThumbSize = pick('slider_thumb_size') ?? 16;

  const TOGGLE_OFF = 'rgba(255,255,255,0.22)';
  const SLIDER_TRACK = 'rgba(255,255,255,0.2)';
  const MENU_BG = '#1c1f26';

  const angle = pick('gradient_angle') ?? 180;
  /** A surface's own angle, or the control-wide one it falls back to. */
  const angleFor = (k: keyof ControlStyle): number => {
    const own = pick(k);
    return typeof own === 'number' ? own : angle;
  };
  const grad = (c1: string, c2: string, deg: number): string => `linear-gradient(${deg}deg,${c1},${c2})`;

  // Accent may itself be a gradient. Surfaces that fall back to accent inherit
  // that gradient, so setting one accent pair still themes the whole control.
  const accent2 = pick('accent_color2');
  const accentPaint = accent2 ? grad(accent, accent2, angleFor('accent_angle')) : accent;

  /**
   * Resolve one surface's background, in precedence order:
   *   own gradient (…2 set)  →  own flat colour  →  inherited paint.
   * `inherited` is `accentPaint` for accent-derived surfaces and the surface's
   * own built-in default otherwise. `flatFallback` is the gradient's start
   * colour when a `…2` is set without its base colour.
   */
  const surface = (
    k1: keyof ControlStyle,
    k2: keyof ControlStyle,
    kAngle: keyof ControlStyle,
    inherited: string,
    flatFallback: string,
  ): string => {
    const own = pick(k1);
    const own2 = pick(k2);
    if (typeof own2 === 'string' && own2) {
      return grad(typeof own === 'string' && own ? own : flatFallback, own2, angleFor(kAngle));
    }
    if (typeof own === 'string' && own) return own;
    return inherited;
  };

  /**
   * `button_*` and `button_group_*` are pairwise-identical key families (the
   * flat config keys are frozen API, so they can't merge) — resolve the shared
   * shape once from the prefix so the fallback chains can't drift apart. The
   * group's extra `option_*` keys have no button counterpart and stay inline.
   */
  const buttonish = (p: 'button' | 'button_group') => ({
    border_color: pick(`${p}_border_color`) ?? BORDER,
    bg: pick(`${p}_bg`) ?? 'transparent',
    radius: pick(`${p}_radius`) ?? 7,
    text_size: sized(`${p}_text_size`, 13),
    selected_color: pick(`${p}_selected_color`) ?? accent,
    selected_text_color: pick(`${p}_selected_text_color`) ?? SELECTED_TEXT,
    // Icon and state value both fall back to their own state's label colour, so
    // setting the label alone recolours the whole cell.
    text_color: pick(`${p}_text_color`) ?? 'currentColor',
    icon_color: pick(`${p}_icon_color`) ?? pick(`${p}_text_color`) ?? 'currentColor',
    state_color: pick(`${p}_state_color`) ?? pick(`${p}_text_color`) ?? 'currentColor',
    selected_icon_color: pick(`${p}_selected_icon_color`) ?? pick(`${p}_selected_text_color`) ?? SELECTED_TEXT,
    selected_state_color: pick(`${p}_selected_state_color`) ?? pick(`${p}_selected_text_color`) ?? SELECTED_TEXT,
    border_width: pick(`${p}_border_width`) ?? 1,
    icon_size: pick(`${p}_icon_size`) ?? 18,
    // The state value tracks the label size unless given one of its own.
    state_size: pick(`${p}_state_size`) ?? sized(`${p}_text_size`, 13),
    option_padding: pick(`${p}_option_padding`),
  });
  const btnGroup = buttonish('button_group');
  const btn = buttonish('button');

  return {
    accent_color: accent,
    accent_paint: accentPaint,
    gradient_angle: angle,
    toggle_on_paint: surface('toggle_on_color', 'toggle_on_color2', 'toggle_on_angle', accentPaint, accent),
    toggle_off_paint: surface('toggle_off_color', 'toggle_off_color2', 'toggle_off_angle', TOGGLE_OFF, TOGGLE_OFF),
    slider_track_paint: surface('slider_track_color', 'slider_track_color2', 'slider_track_angle', SLIDER_TRACK, SLIDER_TRACK),
    slider_fill_paint: surface('slider_fill_color', 'slider_fill_color2', 'slider_fill_angle', accentPaint, accent),
    dropdown_bg_paint: surface('dropdown_bg', 'dropdown_bg2', 'dropdown_bg_angle', FIELD_BG, FIELD_BG),
    dropdown_menu_bg_paint: surface('dropdown_menu_bg', 'dropdown_menu_bg2', 'dropdown_menu_bg_angle', MENU_BG, MENU_BG),
    dropdown_selected_paint: surface('dropdown_selected_color', 'dropdown_selected_color2', 'dropdown_selected_angle', accentPaint, accent),
    button_group_bg_paint: surface('button_group_bg', 'button_group_bg2', 'button_group_bg_angle', 'transparent', 'transparent'),
    button_group_selected_paint: surface('button_group_selected_color', 'button_group_selected_color2', 'button_group_selected_angle', accentPaint, accent),
    button_bg_paint: surface('button_bg', 'button_bg2', 'button_bg_angle', 'transparent', 'transparent'),
    button_selected_paint: surface('button_selected_color', 'button_selected_color2', 'button_selected_angle', accentPaint, accent),
    input_bg_paint: surface('input_bg', 'input_bg2', 'input_bg_angle', FIELD_BG, FIELD_BG),
    spinbox_bg_paint: surface('spinbox_bg', 'spinbox_bg2', 'spinbox_bg_angle', FIELD_BG, FIELD_BG),
    spinbox_button_hover_paint: surface('spinbox_button_hover_color', 'spinbox_button_hover_color2', 'spinbox_button_hover_angle', accentPaint, accent),
    toggle_on_color: pick('toggle_on_color') ?? accent,
    toggle_off_color: pick('toggle_off_color') ?? TOGGLE_OFF,
    toggle_thumb_color: pick('toggle_thumb_color') ?? '#fff',
    toggle_thumb_size: toggleThumbSize,
    toggle_thumb_radius: pick('toggle_thumb_radius') ?? toggleThumbSize / 2,
    toggle_thumb_padding: pick('toggle_thumb_padding') ?? 2,
    slider_track_color: pick('slider_track_color') ?? SLIDER_TRACK,
    slider_fill_color: pick('slider_fill_color') ?? accent,
    slider_thumb_color: pick('slider_thumb_color') ?? '#fff',
    slider_thumb_size: sliderThumbSize,
    slider_thumb_width: pick('slider_thumb_width') ?? sliderThumbSize,
    slider_thumb_radius: pick('slider_thumb_radius') ?? sliderThumbSize / 2,
    slider_thumb_padding: pick('slider_thumb_padding') ?? 0,
    slider_height: pick('slider_height') ?? 6,
    // No default: unset means "fill the width", which no number can express.
    slider_length: pick('slider_length'),
    // 999 is the pill the track has always been; any smaller value squares it off.
    slider_radius: pick('slider_radius') ?? 999,
    slider_border: pick('slider_border') ?? false,
    slider_border_color: pick('slider_border_color') ?? BORDER,
    slider_border_width: pick('slider_border_width') ?? 1,
    dropdown_border_color: pick('dropdown_border_color') ?? BORDER,
    dropdown_bg: pick('dropdown_bg') ?? FIELD_BG,
    dropdown_radius: pick('dropdown_radius') ?? 6,
    dropdown_text_size: sized('dropdown_text_size', 13),
    dropdown_menu_bg: pick('dropdown_menu_bg') ?? MENU_BG,
    dropdown_menu_border_color: pick('dropdown_menu_border_color') ?? BORDER,
    dropdown_selected_color: pick('dropdown_selected_color') ?? accent,
    button_group_border_color: btnGroup.border_color,
    button_group_bg: btnGroup.bg,
    button_group_radius: btnGroup.radius,
    button_group_text_size: btnGroup.text_size,
    button_group_selected_color: btnGroup.selected_color,
    button_group_selected_text_color: btnGroup.selected_text_color,
    button_group_text_color: btnGroup.text_color,
    button_group_icon_color: btnGroup.icon_color,
    button_group_state_color: btnGroup.state_color,
    button_group_selected_icon_color: btnGroup.selected_icon_color,
    button_group_selected_state_color: btnGroup.selected_state_color,
    button_group_border_width: btnGroup.border_width,
    button_group_icon_size: btnGroup.icon_size,
    button_group_state_size: btnGroup.state_size,
    button_group_option_gap: pick('button_group_option_gap') ?? 0,
    button_group_option_padding: btnGroup.option_padding,
    button_group_option_border: pick('button_group_option_border') ?? false,
    // Each per-option border value falls back to the row's, so setting the row
    // border once still styles detached options.
    button_group_option_border_color: pick('button_group_option_border_color') ?? btnGroup.border_color,
    button_group_option_border_width: pick('button_group_option_border_width') ?? btnGroup.border_width,
    button_group_option_radius: pick('button_group_option_radius') ?? btnGroup.radius,
    button_group_option_extra_css: cascadeCss(g?.button_group_option_extra_css, f?.button_group_option_extra_css),
    button_border_color: btn.border_color,
    button_bg: btn.bg,
    button_radius: btn.radius,
    button_text_size: btn.text_size,
    button_selected_color: btn.selected_color,
    button_selected_text_color: btn.selected_text_color,
    button_text_color: btn.text_color,
    button_icon_color: btn.icon_color,
    button_state_color: btn.state_color,
    button_selected_icon_color: btn.selected_icon_color,
    button_selected_state_color: btn.selected_state_color,
    button_border_width: btn.border_width,
    button_icon_size: btn.icon_size,
    button_state_size: btn.state_size,
    button_option_padding: btn.option_padding,
    input_border_color: pick('input_border_color') ?? BORDER,
    input_bg: pick('input_bg') ?? FIELD_BG,
    input_radius: pick('input_radius') ?? 6,
    input_text_size: sized('input_text_size', 13),
    input_focus_color: pick('input_focus_color') ?? accent,
    spinbox_border_color: pick('spinbox_border_color') ?? BORDER,
    spinbox_bg: pick('spinbox_bg') ?? FIELD_BG,
    spinbox_radius: pick('spinbox_radius') ?? 7,
    spinbox_text_size: sized('spinbox_text_size', 13),
    spinbox_button_hover_color: pick('spinbox_button_hover_color') ?? accent,
    spinbox_button_width: pick('spinbox_button_width') ?? 30,
    spinbox_button_font_size: pick('spinbox_button_font_size') ?? 18,
    // Control internals (#74 Phase 6). The shadows hold a whole box-shadow
    // value so "none" can remove them outright, which is what a flat design
    // actually wants — an alpha of zero still leaves the blur in the layout.
    dropdown_menu_radius: pick('dropdown_menu_radius') ?? 8,
    dropdown_option_radius: pick('dropdown_option_radius') ?? 5,
    // The dropdown menu is an opaque surface that must occlude the background
    // image (STYLING.md §8), so its option text is white on that surface
    // rather than currentColor from the card.
    dropdown_option_text_color: pick('dropdown_option_text_color') ?? '#fff',
    dropdown_option_hover_color: pick('dropdown_option_hover_color') ?? 'rgba(255,255,255,0.08)',
    dropdown_menu_shadow: pick('dropdown_menu_shadow') ?? '0 6px 20px rgba(0,0,0,0.5)',
    input_placeholder_color: pick('input_placeholder_color') ?? 'rgba(255,255,255,0.4)',
    slider_thumb_shadow: pick('slider_thumb_shadow') ?? '0 1px 4px rgba(0,0,0,0.5)',
    toggle_thumb_shadow: pick('toggle_thumb_shadow') ?? '0 1px 3px rgba(0,0,0,0.5)',
  };
}

/** Resolve the container box for a control field: defaults.control → field.control_box, extra_css cascades. */
export function resolveControlBox(field: FieldConfig, defaults: GlobalDefaults | undefined): BoxStyle {
  return {
    ...defaults?.control,
    ...field.control_box,
    extra_css: cascadeCss(defaults?.control?.extra_css, field.control_box?.extra_css, field.extra_css) || undefined,
  };
}

/**
 * Dropdown/selector fields with `options_source: 'entity'` read their option
 * LIST from one attribute (e.g. `effect_list`) and their CURRENT value from a
 * different, related one (e.g. `effect`) via `read_attribute` — but the two
 * are almost always the same base name with HA's `_list` convention, so this
 * derives a sensible default when `read_attribute` hasn't been set explicitly.
 */
export function deriveAttributeFromOptionsAttribute(optionsAttribute: string | undefined): string | undefined {
  return optionsAttribute?.endsWith('_list') ? optionsAttribute.slice(0, -5) : undefined;
}

// ── CSS string builders ───────────────────────────────────────────────────────

function applyBgAlpha(color: string, alpha: number): string {
  // Fully-opaque is a no-op, not a rewrite: the rgba()/hex branches below REPLACE
  // any alpha the source colour carried, so without this an alpha of 1 would turn
  // `rgba(8,18,28,0.55)` (what the setup wizard emits) fully opaque. The editor's
  // Opacity slider already displays 1 for an unset value, and unset means "leave
  // the colour alone" — so an explicit 1 must mean the same.
  if (alpha >= 1) return color;
  const rgb = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgb) return `rgba(${rgb[1]},${rgb[2]},${rgb[3]},${alpha})`;
  const hex = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);
  if (hex) return `rgba(${parseInt(hex[1],16)},${parseInt(hex[2],16)},${parseInt(hex[3],16)},${alpha})`;
  // Anything else — a var(), color-mix(), a named colour, an hsl() — can't be
  // taken apart textually. color-mix against transparent applies the alpha
  // without needing to know the channels, which is what lets a tokenised
  // background (var(--mc-…) / var(--mccust_…)) keep working with the Opacity row.
  // Guarded because color-mix has no fallback of its own: if the value resolves
  // to a non-colour the whole declaration would drop, so the untinted colour is
  // the safer floor for anything we can't reason about.
  if (/^(var|color-mix|hsla?|rgba?|oklch|lab|lch)\(/i.test(color.trim())) {
    return `color-mix(in srgb, ${color} ${alpha * 100}%, transparent)`;
  }
  return color;
}

/**
 * Join non-empty "Additional CSS" fragments in cascade order (global → specific).
 * Inline-style declarations are last-wins, so a later fragment overrides an
 * earlier one on any conflicting property. Trailing semicolons are normalised.
 */
export function cascadeCss(...parts: (string | undefined | null)[]): string {
  return parts
    .map((p) => (p ?? '').trim().replace(/;+\s*$/, ''))
    .filter((p) => p.length > 0)
    .join(';');
}

export function boxCss(box: BoxStyle): string {
  const parts: string[] = [];
  if (box.background || box.background2) {
    // Seed tier belongs only to the tint path, where the seeded value (1) is
    // an identity — see applyBgAlpha, which early-returns at 1 precisely so
    // this tier stays inert. The no-background branch below must stay gated on
    // an explicit value or every unstyled box would get a black tint overlay.
    const alpha = box.background_alpha ?? sd('box_background_alpha');
    const tint = (c: string): string =>
      alpha !== undefined ? applyBgAlpha(c, alpha) : c;
    // background2 set → linear-gradient; unset → flat background, as before.
    parts.push(`background:${box.background2
      ? `linear-gradient(${box.background_angle ?? 180}deg,${tint(box.background ?? 'transparent')},${tint(box.background2)})`
      : tint(box.background!)}`);
  } else if (box.background_alpha !== undefined) {
    parts.push(`background:rgba(0,0,0,${box.background_alpha})`);
  }
  if (box.border === true) {
    const w = box.border_width ?? sd('box_border_width') ?? 1;
    const c = box.color ?? sd('box_border_color') ?? '#00d4ff';
    parts.push(`border:${w}px solid ${c}`);
  }
  parts.push(`border-radius:${box.radius ?? sd('box_radius') ?? 0}px`);
  parts.push(`padding:${box.padding ?? sd('box_padding') ?? 0}px`);
  if (box.shadow === true) {
    // Box mode (#112) is the glow replacement: offsets are forced to zero so
    // the halo falls evenly on every side; blur/spread/colour still shape it.
    const mode = box.shadow_mode ?? sd('box_shadow_mode') ?? 'drop';
    const x = mode === 'box' ? 0 : box.shadow_x ?? sd('box_shadow_x') ?? 0;
    const y = mode === 'box' ? 0 : box.shadow_y ?? sd('box_shadow_y') ?? 2;
    const blur = box.shadow_blur ?? sd('box_shadow_blur') ?? 8;
    const spread = box.shadow_spread ?? sd('box_shadow_spread') ?? 0;
    const c = box.shadow_color ?? sd('box_shadow_color') ?? 'rgba(0,0,0,0.5)';
    parts.push(`box-shadow:${x}px ${y}px ${blur}px ${spread}px ${c}`);
  }
  if (box.blur) {
    parts.push(
      `backdrop-filter:blur(${box.blur}px);-webkit-backdrop-filter:blur(${box.blur}px)`,
    );
  }
  const extra = cascadeCss(box.extra_css);
  if (extra) parts.push(extra);
  return parts.join(';');
}

export function textCss(ts: TextStyle): string {
  const parts: string[] = [];
  parts.push(`font-size:${ts.font_size ?? sd('font_size') ?? 14}px`);
  if (ts.color) parts.push(`color:${ts.color}`);
  if (ts.font_weight != null) parts.push(`font-weight:${ts.font_weight}`);
  if (ts.font_family) parts.push(`font-family:${ts.font_family}`);
  if (ts.letter_spacing != null) parts.push(`letter-spacing:${ts.letter_spacing}px`);
  const extra = cascadeCss(ts.extra_css);
  if (extra) parts.push(extra);
  return parts.join(';');
}

// ── Field renderer ────────────────────────────────────────────────────────────

// ── Visibility condition ───────────────────────────────────────────────────────

/**
 * Exported since #92 so embedded cards can share it — they are rendered by
 * `mosaic-canvas.ts` directly rather than going through `renderCard`, so there
 * is no other way for them to answer the question the same way.
 *
 * An unknown entity resolves to *visible*: a condition on an entity that has
 * not loaded yet must not blank the dashboard.
 */
export function evaluateVisibility(
  cond: VisibilityCondition,
  hass: HomeAssistant | undefined,
  virtuals: VirtualMap,
): boolean {
  let stateStr: string;
  if (cond.entity.startsWith('virtual:')) {
    const v = virtuals.get(cond.entity);
    if (v === undefined) return true;
    stateStr = String(v.value);
  } else {
    const stateObj = hass?.states[cond.entity];
    if (!stateObj) return true;
    stateStr = stateObj.state;
  }

  const numState = Number(stateStr);
  const numValue = Number(cond.value);
  const numeric = Number.isFinite(numState) && Number.isFinite(numValue);

  switch (cond.operator) {
    case '==': return numeric ? numState === numValue : stateStr === cond.value;
    case '!=': return numeric ? numState !== numValue : stateStr !== cond.value;
    case '>':  return numeric && numState >  numValue;
    case '<':  return numeric && numState <  numValue;
    case '>=': return numeric && numState >= numValue;
    case '<=': return numeric && numState <= numValue;
    default:   return true;
  }
}

// ── Virtual entity computation ─────────────────────────────────────────────────

/**
 * Sanitize a raw numeric value to a canonical base unit before any calculation.
 *
 * Canonical bases:
 *   Energy power    mW / W / kW / MW / GW          → kW
 *   Energy storage  Wh / kWh / MWh / GWh           → kWh
 *   Volume          mL / L / m³ / gal / fl oz …    → L
 *   Mass            mg / g / kg / t / lb / oz       → kg
 *   Compound rates  gal/min, fl oz/h, m³/s …       → normalised-numerator / h
 *   Everything else → unchanged
 *
 * For compound units (X/time) the function recurses on the numerator so that
 * e.g. "gal/min" → L/h correctly in one call.
 */
function sanitizeEntityValue(value: number, unit: string): { value: number; unit: string } {
  const u = unit.trim();

  // ── Energy power → kW ───────────────────────────────────────────────────────
  if (u === 'mW')   return { value: value / 1_000_000, unit: 'kW' };
  if (u === 'W')    return { value: value / 1000,       unit: 'kW' };
  if (u === 'kW')   return { value,                    unit: 'kW' };
  if (u === 'MW')   return { value: value * 1000,        unit: 'kW' };
  if (u === 'GW')   return { value: value * 1_000_000,   unit: 'kW' };

  // ── Energy storage → kWh ────────────────────────────────────────────────────
  if (u === 'Wh')    return { value: value / 1000,       unit: 'kWh' };
  if (u === 'kWh')   return { value,                    unit: 'kWh' };
  if (u === 'MWh')   return { value: value * 1000,        unit: 'kWh' };
  if (u === 'GWh')   return { value: value * 1_000_000,   unit: 'kWh' };
  if (u === 'kWh/h') return { value,                    unit: 'kW' };   // same as kW
  if (u === 'Wh/h')  return { value: value / 1000,       unit: 'kW' };

  // ── Volume → L ──────────────────────────────────────────────────────────────
  if (u === 'mL' || u === 'ml')            return { value: value / 1000,     unit: 'L' };
  if (u === 'L'  || u === 'l')             return { value,                   unit: 'L' };
  if (/^m[3³]$/.test(u))                   return { value: value * 1000,      unit: 'L' };   // cubic metre
  if (/^f[tT][3³]$/.test(u))              return { value: value * 28.3168,   unit: 'L' };   // cubic foot
  if (/^gal(lon)?s?$/i.test(u))            return { value: value * 3.78541,  unit: 'L' };   // US gallon
  if (/^imp\.?\s*gal(lon)?s?$/i.test(u))  return { value: value * 4.54609,  unit: 'L' };   // imperial gallon
  if (/^fl\.?\s*oz\.?s?$/i.test(u))       return { value: value * 0.029574, unit: 'L' };   // US fl oz
  if (/^(pt|pint)s?$/i.test(u))            return { value: value * 0.473176, unit: 'L' };   // US pint
  if (/^(qt|quart)s?$/i.test(u))           return { value: value * 0.946353, unit: 'L' };   // US quart

  // ── Mass → kg ───────────────────────────────────────────────────────────────
  if (u === 'mg')                          return { value: value / 1_000_000, unit: 'kg' };
  if (/^g$/.test(u))                       return { value: value / 1000,      unit: 'kg' };
  if (u === 'kg')                          return { value,                    unit: 'kg' };
  if (/^(t|tonne?)s?$/i.test(u))           return { value: value * 1000,       unit: 'kg' };  // metric tonne
  if (/^(lb|lbs|pound)s?$/i.test(u))       return { value: value * 0.453592,  unit: 'kg' };
  if (/^oz$/.test(u))                      return { value: value * 0.028350,  unit: 'kg' };  // mass oz

  // ── Compound rate units (X/time): recurse on numerator ──────────────────────
  const slash = u.lastIndexOf('/');
  if (slash > 0) {
    const num = u.slice(0, slash).trim();
    const den = u.slice(slash + 1).trim();
    if (num) {
      let timeFactor = 1;
      let normDen = den;
      if (/^s(ec(ond)?s?)?$/i.test(den))      { timeFactor = 3600; normDen = 'h'; }
      else if (/^(min|minute)s?$/i.test(den)) { timeFactor = 60;   normDen = 'h'; }
      const { value: normVal, unit: normNum } = sanitizeEntityValue(value * timeFactor, num);
      return { value: normVal, unit: `${normNum}/${normDen}` };
    }
  }

  return { value, unit: u };
}

/** Read an HA entity state as a sanitized {value, unit} pair. Returns null if unavailable or non-numeric. */
function readEntity(hass: HomeAssistant, entityId: string): { value: number; unit: string } | null {
  const state = hass.states[entityId];
  if (!state) return null;
  const raw = Number(state.state);
  if (!Number.isFinite(raw)) return null;
  const unit = (state.attributes?.unit_of_measurement as string | undefined) ?? '';
  return sanitizeEntityValue(raw, unit);
}

export function computeVirtuals(
  virtuals: VirtualConfig[] | undefined,
  hass: HomeAssistant | undefined,
  prev?: VirtualMap,
  stats?: StatsMap,
): VirtualMap {
  const map: VirtualMap = new Map();
  if (!virtuals || !hass) return map;
  for (const v of virtuals) {
    if (v.op === 'statistic') {
      const entry = stats?.get(`virt:${v.id}`);
      if (!entry) continue;
      map.set(`virtual:${v.id}`, { value: entry.value, unit: v.unit ?? entry.unit });
      continue;
    }
    if (v.op === 'time_until') {
      const mode = v.mode ?? sd('virtual_mode') ?? 'percent';
      // backward compat: old field names still work
      const valueEntityId = v.value_entity ?? v.pct_entity ?? '';
      const rateEntityId  = v.rate_entity  ?? v.power_entity ?? '';

      const valueRead = readEntity(hass, valueEntityId);
      if (!valueRead) continue;
      const currentValue = valueRead.value;

      // Rate: if user overrides unit, re-sanitize raw value with override instead of reported unit
      const rateState = hass.states[rateEntityId];
      if (!rateState) continue;
      const rateRaw = Number(rateState.state);
      if (!Number.isFinite(rateRaw)) continue;

      // Recalc gate: when a threshold is set and the raw signed rate is inside
      // the dead band (not above recalc_above and not below recalc_below),
      // freeze — reuse the previously computed projection if we have one.
      const { recalc_above: gateAbove, recalc_below: gateBelow } = v;
      if (gateAbove != null || gateBelow != null) {
        const active = (gateAbove != null && rateRaw > gateAbove) || (gateBelow != null && rateRaw < gateBelow);
        if (!active) {
          const frozen = prev?.get(`virtual:${v.id}`);
          if (frozen) { map.set(`virtual:${v.id}`, frozen); continue; }
          // No prior value to freeze (first render inside the band): fall through and compute.
        }
      }

      const rateUnitAttr  = (rateState.attributes?.unit_of_measurement as string | undefined) ?? '';
      const effectiveUnit = v.rate_unit_override ?? rateUnitAttr;
      const { value: ratePerHourRaw } = sanitizeEntityValue(rateRaw, effectiveUnit);
      if (!Number.isFinite(ratePerHourRaw)) continue;

      let capacityRaw: number;
      if (v.capacity_entity) {
        const capRead = readEntity(hass, v.capacity_entity);
        if (!capRead) continue;
        capacityRaw = capRead.value;
      } else {
        capacityRaw = v.capacity ?? v.capacity_kwh ?? 1;
      }
      if (!Number.isFinite(capacityRaw) || capacityRaw <= 0) continue;

      let ratePerHour: number;
      let maxTriggerValue: number;
      if (mode === 'absolute') {
        ratePerHour     = ratePerHourRaw;
        maxTriggerValue = capacityRaw;
      } else {
        // percent mode: convert rate to %/hour via capacity
        ratePerHour     = (ratePerHourRaw / capacityRaw) * 100;
        maxTriggerValue = 100;
      }
      if (!Number.isFinite(ratePerHour)) continue;

      const labelMax = v.label_max ?? v.label_full  ?? sd('virtual_label_max') ?? 'Full';
      const labelMin = v.label_min ?? v.label_empty ?? sd('virtual_label_min') ?? 'Empty';

      const triggers = [
        { value: 0,               label: labelMin },
        { value: maxTriggerValue, label: labelMax },
        // backward compat: old configs stored percent instead of value
        ...(v.triggers ?? []).map((t) => ({ value: (t as unknown as { percent?: number }).percent ?? t.value, label: t.label })),
      ];

      // Already at (or past) a terminal boundary — show it directly rather than
      // computing time-until-the-next-inner-trigger from the edge. Without this,
      // a battery sitting at 100% with even a tiny negative (discharging) rate
      // reading would compute "time until Reserve" instead of "Full", since 100
      // is correctly excluded as a decreasing-target from itself.
      if (currentValue >= maxTriggerValue) {
        map.set(`virtual:${v.id}`, { value: -1, unit: 'duration', label: labelMax });
        continue;
      }
      if (currentValue <= 0) {
        map.set(`virtual:${v.id}`, { value: -1, unit: 'duration', label: labelMin });
        continue;
      }

      const result = calculateTimeUntil(currentValue, ratePerHour, triggers);
      if (result.direction === 'none' || result.hours === null) {
        // Steady state: entity is not moving or has reached a boundary.
        // Store value:-1 sentinel + the nearest trigger label so the renderer
        // can display the boundary label instead of a meaningless layout.
        const nearest = triggers.reduce<{ value: number; label: string } | undefined>(
          (best, t) => !best || Math.abs(t.value - currentValue) < Math.abs(best.value - currentValue) ? t : best,
          undefined,
        );
        map.set(`virtual:${v.id}`, { value: -1, unit: 'duration', label: nearest?.label });
        continue;
      }
      map.set(`virtual:${v.id}`, { value: result.hours, unit: 'duration', label: result.label ?? undefined });
      continue;
    }

    const reads = v.inputs.map((id) => readEntity(hass, id));
    // An unavailable input must make the virtual absent, not shift the other
    // operands into its slot: with grid-import unavailable, signed_net would
    // otherwise subtract export from export and display +export as if it were
    // import. No data beats a plausible-looking wrong number.
    if (reads.length === 0 || reads.some((r) => r === null)) continue;
    const sanitized = reads as { value: number; unit: string }[];
    const values = sanitized.map((s) => s.value);
    let result: number;
    switch (v.op) {
      case 'add':        result = values.reduce((a, b) => a + b, 0); break;
      case 'subtract':   result = values.slice(1).reduce((a, b) => a - b, values[0]); break;
      case 'mean':       result = values.reduce((a, b) => a + b, 0) / values.length; break;
      case 'signed_net': result = (values[0] ?? 0) - (values[1] ?? 0); break;
      default:           result = values[0];
    }
    const unit = v.unit ?? sanitized[0].unit;
    map.set(`virtual:${v.id}`, { value: result, unit });
  }
  return map;
}

// ── Graph field renderer ──────────────────────────────────────────────────────

const GRAPH_PALETTE = ['#00d4ff','#ff6b35','#7ecb20','#9b59b6','#f39c12','#e74c3c','#1abc9c','#e91e63'];

interface GraphChrome {
  axis: string; grid: string; zero: string; baseline: string;
  /** The x and y axis labels. */
  label: string;
  /** The numbers, dates and category names along the axes. */
  tick: string; tickDim: string;
  unit: string; legend: string;
  barLabel: string; track: string; value: string; palette: string[];
  /** undefined = keep each chart's own natural size. */
  size?: number;
}

/**
 * Resolve a graph's axis/grid/label furniture.
 *
 * `field.x ?? sd('x') ?? literal` — graph keys have no user-global tier, which
 * matches the nine graph_* keys that already existed rather than the thermo_*
 * pattern. The literals are a last-resort floor only; defaults.json is what
 * actually ships, and these stay fixed rather than themed because they are
 * translucent white over an arbitrary photo (STYLING.md §8).
 */
function resolveGraphChrome(field: FieldConfig): GraphChrome {
  const label = field.graph_label_color ?? sd('graph_label_color') ?? 'rgba(255,255,255,0.45)';
  // Ticks follow the axis labels until they are given a colour of their own,
  // which is exactly the behaviour before the two were separable (#123).
  const tick = field.graph_tick_color ?? sd('graph_tick_color') ?? label;
  return {
    axis: field.graph_axis_color ?? sd('graph_axis_color') ?? 'rgba(255,255,255,0.15)',
    grid: field.graph_grid_color ?? sd('graph_grid_color') ?? 'rgba(255,255,255,0.06)',
    zero: field.graph_zero_line_color ?? sd('graph_zero_line_color') ?? 'rgba(255,255,255,0.25)',
    baseline: field.graph_baseline_color ?? sd('graph_baseline_color') ?? 'rgba(255,255,255,0.12)',
    label,
    tick,
    // A bar with no value keeps its category name visibly dimmer than a real
    // one. That was the one meaningful difference among the old x-label alphas,
    // so it is preserved as a ratio of the tick colour instead of a second key.
    tickDim: `color-mix(in srgb, ${tick} 55%, transparent)`,
    unit: field.graph_unit_label_color ?? sd('graph_unit_label_color') ?? 'rgba(255,255,255,0.3)',
    legend: field.graph_legend_label_color ?? sd('graph_legend_label_color') ?? 'rgba(255,255,255,0.6)',
    barLabel: field.graph_bar_label_color ?? sd('graph_bar_label_color') ?? 'rgba(255,255,255,0.8)',
    track: field.graph_gauge_track_color ?? sd('graph_gauge_track_color') ?? 'rgba(255,255,255,0.1)',
    value: field.graph_gauge_value_color ?? sd('graph_gauge_value_color') ?? '#ffffff',
    palette: field.graph_palette ?? sd('graph_palette') ?? GRAPH_PALETTE,
    size: field.graph_label_size ?? sd('graph_label_size'),
  };
}

// ── Axis scale + number formatting (#119 pass 1) ──────────────────────────────
//
// Every chart used to place its gridlines at fixed fractions of the raw data
// range — `[0, 0.5, 1]` on bars, `[0, .25, .5, .75, 1]` on time charts — and
// label them with `fmtShort`, which rounded anything ≥ 10 to an integer. An
// auto-scaled chart therefore read `0 / 3.47 / 6.93`, and every axis on the
// card disagreed with every other about how many decimals a number has. The
// three pieces below replace that: a 1/2/5×10ⁿ scale, one uniform format
// decision per axis, and a gutter measured from the labels that result.

/** Round `x` to a 1/2/5×10ⁿ step — `round` picks nearest rather than up. */
function niceNum(x: number, round: boolean): number {
  if (!(x > 0)) return 1;
  const exp = Math.floor(Math.log10(x));
  const f = x / Math.pow(10, exp);
  const nf = round
    ? (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10)
    : (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10);
  return nf * Math.pow(10, exp);
}

interface Scale {
  lo: number;
  hi: number;
  step: number;
  ticks: number[];
}

/**
 * A 1/2/5×10ⁿ axis over `[dataLo, dataHi]`, aiming for `target` gridlines.
 *
 * An explicitly configured `graph_min`/`graph_max` is honoured exactly — that
 * end is pinned and only the step is chosen nicely, because a user who typed
 * a bound meant that bound. An unpinned end is expanded outwards to the next
 * step so the topmost gridline is a round number the data fits under.
 */
function niceScale(dataLo: number, dataHi: number, fixedLo?: number, fixedHi?: number, target = 5): Scale {
  let lo = fixedLo ?? dataLo;
  let hi = fixedHi ?? dataHi;
  if (!Number.isFinite(lo)) lo = 0;
  if (!Number.isFinite(hi)) hi = 1;
  if (hi < lo) [lo, hi] = [hi, lo];
  // A flat series (every reading identical) has no range to scale. Give it a
  // symmetric window around the value rather than dividing by zero.
  if (hi === lo) {
    const pad = Math.abs(hi) > 0 ? Math.abs(hi) * 0.1 : 1;
    lo -= pad; hi += pad;
  }
  // A reading a hair the wrong side of zero must not drag the whole axis over
  // it. A solar sensor that logs -0.01 kW overnight was enough to make
  // `Math.floor(lo / step) * step` open the axis at -10, throwing away half
  // the plot to represent a rounding artefact. An excursion under 5% of the
  // span is treated as touching zero, not crossing it; anything genuinely
  // bipolar is well past that and still scales both ways.
  const span = hi - lo;
  if (fixedLo == null && lo < 0 && lo > -span * 0.05) lo = 0;
  if (fixedHi == null && hi > 0 && hi < span * 0.05) hi = 0;
  // The step is the *smallest* nice value the budget allows, not the one
  // nearest the average gap. Rounding to nearest overshot badly on the way up:
  // a 0..12 axis with room for five gaps wanted 2.4, rounded to 5, and drew
  // 0 | 5 | 10 at less than half the density the plot could carry. Ceiling
  // instead always lands on the densest legible axis, and the loop below is
  // then only needed for the case where expanding the bounds adds a gap.
  let step = niceNum((hi - lo) / Math.max(1, target), false);
  let outLo = lo, outHi = hi;
  for (let guard = 0; guard < 6; guard++) {
    outLo = fixedLo != null ? lo : Math.floor(lo / step) * step;
    outHi = fixedHi != null ? hi : Math.ceil(hi / step) * step;
    if (Math.round((outHi - outLo) / step) <= target) break;
    step = niceNum(step * 1.5, false);
  }
  lo = outLo; hi = outHi;

  const ticks: number[] = [];
  // Walk by index rather than accumulating `t += step`, which drifts on
  // fractional steps (0.1 × 7 ≠ 0.7 in binary floating point).
  const first = Math.ceil(lo / step - 1e-9);
  const last = Math.floor(hi / step + 1e-9);
  for (let k = first; k <= last && ticks.length < 40; k++) ticks.push(k * step);
  // A pinned bound that isn't a multiple of the step still deserves its label.
  if (ticks.length === 0 || Math.abs(ticks[0]! - lo) > step * 0.01) ticks.unshift(lo);
  if (Math.abs(ticks[ticks.length - 1]! - hi) > step * 0.01) ticks.push(hi);
  return { lo, hi, step, ticks };
}

/**
 * One formatting decision for a whole axis: the same divisor, suffix and
 * decimal count for every tick, so the labels line up as a column of like
 * numbers instead of a ragged mix of `1.2k`, `950` and `1500`.
 */
interface TickFormat { div: number; suffix: string; decimals: number }

function tickFormat(scale: Scale, precision?: number): TickFormat {
  const mag = Math.max(Math.abs(scale.lo), Math.abs(scale.hi));
  // Compaction only past 10k — below that the full number is shorter to read
  // than `1.5k` is to decode, and it keeps `1500` looking like a reading.
  const div = mag >= 1_000_000 ? 1_000_000 : mag >= 10_000 ? 1_000 : 1;
  const suffix = div === 1_000_000 ? 'M' : div === 1_000 ? 'k' : '';
  const stepScaled = scale.step / div;
  // Decimals come from the step, not the value: a 0.5 step needs one place so
  // consecutive gridlines don't both render as "21".
  const stepDecimals = Math.max(0, Math.min(3, Math.ceil(-Math.log10(stepScaled) - 1e-9)));
  // A configured precision can only *add* places here, never take the step's
  // away. A precision-0 sensor spanning 0..2 gets a 0.5 step, and letting the
  // precision win produced the axis `0, 1, 1, 2, 2` — two pairs of gridlines
  // labelled identically. Precision still governs the readouts (fmtValue);
  // the axis needs whatever it takes to stay legible.
  const decimals = precision != null && div === 1
    ? Math.max(stepDecimals, Math.min(6, Math.max(0, precision)))
    : stepDecimals;
  return { div, suffix, decimals };
}

function fmtTick(v: number, tf: TickFormat): string {
  // A compacted axis labels its origin "0", not "0k" or "0.0M".
  if (v === 0 && tf.div > 1) return '0';
  const n = v / tf.div;
  // Separators only on the uncompacted scale — "1,234k" is noise.
  const body = tf.div === 1 && Math.abs(n) >= 1000
    ? n.toLocaleString(undefined, { minimumFractionDigits: tf.decimals, maximumFractionDigits: tf.decimals })
    : n.toFixed(tf.decimals);
  // -0 is a real toFixed output and reads as an error on an axis.
  return (body === '-0' || body === `-0.${'0'.repeat(tf.decimals)}` ? body.slice(1) : body) + tf.suffix;
}

/**
 * A single reading — gauge centre, bar label — rather than an axis tick.
 * `precision` is the entity's own `suggested_display_precision` when it has
 * one, so a graph agrees with the value field sitting next to it on the card.
 */
function fmtValue(v: number, precision?: number): string {
  const abs = Math.abs(v);
  if (precision == null) {
    if (abs >= 1_000_000) return `${+(v / 1_000_000).toPrecision(3)}M`;
    if (abs >= 10_000)    return `${+(v / 1_000).toPrecision(3)}k`;
    const dp = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
    return `${+v.toFixed(dp)}`;
  }
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(Math.min(precision, 2))}M`;
  return v.toLocaleString(undefined, { minimumFractionDigits: precision, maximumFractionDigits: precision });
}

/**
 * Approximate rendered width of `s` at `fontSize`, in the SVG's user units.
 *
 * There is no measurement API available at template-build time, and the 0.6em
 * average advance of a digit-heavy string in the HA sans stack is close enough
 * for gutter sizing. It is deliberately a slight over-estimate: too wide a
 * gutter costs a few px of plot, too narrow puts the label through the axis.
 */
function textWidth(s: string, fontSize: number): number {
  return s.length * fontSize * 0.62;
}

/**
 * How many gridline gaps the plot is tall enough to carry.
 *
 * A fixed target can't serve a 60px sparkline and a 200px chart at once, and
 * getting it wrong is expensive in both directions: too few gaps leaves the
 * axis coarser than the plot can carry (a 110px plot drawing 0 | 5 | 10 where
 * 0 | 2 | 4 | 6 | 8 | 10 fits comfortably); too many crowd the labels.
 *
 * The pitch is one label's height plus a gap of about nine tenths of it —
 * ~15px for the 8px default. That is the tightest spacing at which a column of
 * tick labels still reads as separate numbers, and it is deliberately measured
 * against the label size rather than a constant, so raising graph_label_size
 * thins the gridlines out on its own.
 */
function tickBudget(cH: number, fontSize: number, override?: number): number {
  if (override != null && Number.isFinite(override)) return Math.max(2, Math.min(12, Math.round(override)));
  return Math.max(3, Math.min(8, Math.floor(cH / (fontSize * 1.9))));
}

/**
 * Rotated axis title down the left of the plot, and the extra gutter it costs.
 * Returns nothing when unset, so a chart without one loses no plot width.
 */
function yTitleWidth(field: FieldConfig, fontSize: number, unit = ''): number {
  return yAxisTitle(field, unit) ? fontSize + 5 : 0;
}

/**
 * The rotated label down the left of the plot.
 *
 * Unset, it becomes the unit — which is where a unit belongs, naming the axis
 * rather than floating above the topmost tick as its own strip. Set, the title
 * takes the axis and the unit keeps that strip, because the two are then saying
 * different things ("Power" and "kW") and both are worth having.
 */
function yAxisTitle(field: FieldConfig, unit: string): string {
  return field.graph_y_title || unit;
}

/** Whether the unit still has its own strip above the plot — see yAxisTitle. */
function unitStrip(field: FieldConfig, unit: string): boolean {
  return !!unit && !!field.graph_y_title;
}

function renderYTitle(field: FieldConfig, pT: number, cH: number, g: GraphChrome, fontSize: number, unit = '') {
  const title = yAxisTitle(field, unit);
  if (!title) return nothing;
  const y = pT + cH / 2;
  return svg`<text x="${fontSize}" y="${y}" text-anchor="middle" style="fill:${g.label}" font-size="${fontSize}"
    transform="rotate(-90 ${fontSize} ${y})">${title}</text>`;
}

/**
 * The label under the x-axis ticks, centred on the plot (#123).
 *
 * Unset it names the window the chart covers — "Last day", "Last 7 days" —
 * which is the one thing a statistics chart's x-axis was never saying. An empty
 * string hides it, the same way `graph_unit` does.
 */
function xAxisTitle(field: FieldConfig): string {
  const t = field.graph_x_title ?? describeWindow(field);
  // A blank title is a deliberate hide, and trimming it means a single space
  // typed into the editor gives the strip back to the plot rather than
  // reserving height for nothing.
  return t.trim() ? t : '';
}

/** Height the x-axis label needs, or 0 when there isn't one. */
function xTitleHeight(field: FieldConfig, axes: boolean, fontSize: number): number {
  return axes && xAxisTitle(field) ? fontSize + 3 : 0;
}

function renderXTitle(field: FieldConfig, cx: number, y: number, g: GraphChrome, fontSize: number) {
  const title = xAxisTitle(field);
  if (!title) return nothing;
  return svg`<text x="${cx.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" style="fill:${g.label}" font-size="${fontSize}">${title}</text>`;
}

/**
 * Keeps a time-axis label inside the plot instead of hanging off its end.
 *
 * Every tick was anchored `middle`, so the last one — which by construction
 * sits at or near the right edge — lost half its text to the viewBox, and a
 * date read as "8/2" instead of "8/21". Swapping the anchor at each end trims
 * nothing and shifts the label only as far as it has to go.
 */
function tickAnchor(x: number, label: string, fontSize: number, lo: number, hi: number): { x: number; anchor: string } {
  const half = textWidth(label, fontSize) / 2;
  if (x - half < lo) return { x: Math.max(x, lo), anchor: 'start' };
  if (x + half > hi) return { x: Math.min(x, hi), anchor: 'end' };
  return { x, anchor: 'middle' };
}

/** Left gutter that actually fits the widest tick label, replacing a flat 32. */
function axisGutter(ticks: number[], tf: TickFormat, fontSize: number): number {
  const widest = ticks.reduce((w, t) => Math.max(w, textWidth(fmtTick(t, tf), fontSize)), 0);
  return Math.ceil(Math.min(Math.max(widest + 7, 14), 70));
}

/**
 * The legend, as HTML under the chart rather than inside the SVG.
 *
 * It used to be `x = pL + i * 70` drawn over the plot at the top: a fixed
 * stride that overlapped the data and ran off the right edge past about three
 * series. Reserving SVG space for it instead just moved the problem — two
 * legend rows and a unit strip left a 120px chart with ~57px of plot, which
 * starved the tick budget and forced a coarser axis than the data deserved.
 * As HTML it wraps natively (no 0.62em width guess), and the configured
 * `height` goes back to meaning the height of the chart.
 */
function legendRow(labels: string[], colorOf: (i: number) => string, g: GraphChrome, fs: number, vertical = false): TemplateResult | typeof nothing {
  const items = labels.map((label, i) => ({ label, i })).filter((it) => it.label);
  if (!items.length) return nothing;
  // Centred, so a legend of two or three entries sits under the middle of the
  // plot rather than hugging the y-axis gutter. A side legend stays left-aligned:
  // it is a column, and centring its rows would ragged the swatches.
  //
  // No space of its own above it. Each renderer's bottom padding is trimmed to
  // fit its own axis text exactly (see the `pB` maths in each), so any padding
  // here reads as the whole of the gap — and even half a line was more than the
  // chart wanted.
  return html`<div style="display:flex;flex-direction:${vertical ? 'column' : 'row'};flex-wrap:wrap;${vertical ? '' : 'justify-content:center;'}gap:3px 12px;padding:0 2px 0;font-size:${fs}px;color:${g.legend};line-height:1.35">
    ${items.map(({ label, i }) => html`<span style="display:inline-flex;align-items:center;gap:5px">
      <span style="width:10px;height:3px;border-radius:1.5px;background:${colorOf(i)};flex:none"></span>${label}</span>`)}
  </div>`;
}

/**
 * Wraps a chart and its legend in the requested arrangement.
 *
 * A side legend has to become a column and take its width out of the chart's
 * row, which flexbox does for free; a top legend is the same row order
 * reversed. Keeping it here means each renderer only decides *whether* it has
 * a legend, never where it goes.
 */
function chartFrame(chart: unknown, legend: TemplateResult | typeof nothing, pos: GraphLegendPos): TemplateResult {
  if (legend === nothing) return html`<div style="width:100%;overflow:hidden">${chart}</div>`;
  const side = pos === 'left' || pos === 'right';
  const dir = pos === 'top' ? 'column-reverse' : pos === 'bottom' ? 'column'
    : pos === 'left' ? 'row-reverse' : 'row';
  return html`<div style="width:100%;overflow:hidden;display:flex;flex-direction:${dir};${side ? 'align-items:center;gap:6px' : ''}">
    <div style="${side ? 'flex:1 1 auto;min-width:0' : ''}">${chart}</div>
    <div style="${side ? 'flex:0 1 auto;max-width:40%' : ''}">${legend}</div>
  </div>`;
}

/**
 * The one empty state every chart type shows, instead of four different ones.
 *
 * "No data" and "not fetched yet" are different facts and used to render the
 * same, so every graph on the dashboard claimed to be empty for the first
 * second after a page load. The maps already tell them apart — a target's key
 * is absent until its first fetch lands — so the message can too.
 */
function noData(H: number, g: GraphChrome, pending = false): TemplateResult {
  return html`<div style="width:100%;height:${H}px;display:flex;align-items:center;justify-content:center;color:${g.label};font-size:${(g.size ?? 9) + 2}px;${pending ? 'opacity:.7' : ''}">${pending ? 'Loading…' : 'No data'}</div>`;
}

/**
 * `windowed` is the chart's Graph Data window (#123), not the series' own — a
 * window is a field-level property now, and it is what decides whether this
 * series was fetched as a statistic or is read live off the entity.
 */
function resolveSeriesValue(
  s: GraphSeries,
  fieldId: string,
  idx: number,
  hass: HomeAssistant | undefined,
  virtuals: VirtualMap,
  stats: StatsMap,
  windowed: boolean,
): number | null {
  if (!s.entity) return null;
  if (windowed) return stats.get(`${fieldId}:${idx}`)?.value ?? null;
  if (s.entity.startsWith('virtual:')) return virtuals.get(s.entity)?.value ?? null;
  const st = hass?.states[s.entity];
  if (!st) return null;
  const raw = s.attribute ? st.attributes?.[s.attribute] : st.state;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function seriesLabel(s: GraphSeries, hass: HomeAssistant | undefined): string {
  if (s.label) return s.label;
  if (!s.entity) return '';
  if (s.entity.startsWith('virtual:')) return s.entity.replace('virtual:', '');
  return (hass?.states[s.entity]?.attributes?.friendly_name as string | undefined)
    ?? s.entity.split('.')[1]?.replace(/_/g, ' ') ?? s.entity;
}

/**
 * The entity's own display precision, so a chart's readouts agree with the
 * value field beside it on the card instead of each rounding its own way.
 * undefined means "no opinion" and lets fmtValue pick by magnitude.
 */
function seriesPrecision(s: GraphSeries | undefined, hass: HomeAssistant | undefined): number | undefined {
  if (!s?.entity || s.entity.startsWith('virtual:')) return undefined;
  const p = hass?.states[s.entity]?.attributes?.suggested_display_precision;
  return typeof p === 'number' ? p : undefined;
}

function seriesUnit(s: GraphSeries, hass: HomeAssistant | undefined, stats: StatsMap, fieldId: string, idx: number, windowed: boolean): string {
  if (windowed) return stats.get(`${fieldId}:${idx}`)?.unit ?? '';
  if (!s.entity || s.entity.startsWith('virtual:')) return '';
  return (hass?.states[s.entity]?.attributes?.unit_of_measurement as string | undefined) ?? '';
}

/**
 * Fit a category label under a bar of `bW`, truncating on measured width
 * rather than the old blind `slice(0, 7)` — which turned six series into six
 * indistinguishable stubs regardless of how much room each bar actually had.
 */
function fitLabel(s: string, bW: number, fontSize: number): string {
  if (!s) return '';
  if (textWidth(s, fontSize) <= bW) return s;
  const max = Math.max(1, Math.floor(bW / (fontSize * 0.62)) - 1);
  return s.slice(0, max) + '…';
}

function renderBarV(field: FieldConfig, values: (number|null)[], labels: string[], unit: string, precision?: number, pending = false): TemplateResult {
  const W = field.width ?? sd('graph_bar_v_width') ?? 200;
  const H = field.height ?? sd('graph_bar_v_height') ?? 130;
  const axes = field.graph_show_axes ?? sd('graph_show_axes') ?? true;
  const g = resolveGraphChrome(field);
  const fs = g.size ?? 9, fsSm = g.size ?? 8;

  const n = Math.max(values.length, 1);
  const nums = values.filter((v): v is number => v !== null && Number.isFinite(v));
  if (values.length === 0) return noData(H, g, pending);

  const showLegend = field.graph_show_legend ?? sd('graph_show_legend') ?? false;

  // Vertical padding is settled before the scale, because the scale's tick
  // budget depends on how tall the plot ends up. The unit gets its own strip
  // above the plot rather than being hung off pT-1, where it overlapped the
  // top gridline's label and was clipped by the top edge of the SVG.
  const showValues = field.graph_bar_labels ?? sd('graph_bar_labels') ?? false;
  // A value printed above a bar needs room above the tallest one, or the
  // topmost label is clipped by the top edge exactly as the unit used to be.
  const unitH = unitStrip(field, unit) && axes ? fsSm + 3 : 0;
  const xTH = xTitleHeight(field, axes, fsSm);
  const pT = 6 + unitH + (showValues ? fs + 2 : 0), pB = (axes ? 17 : 2) + xTH, pR = 4;
  const cH = H - pT - pB;

  // Bars are read as areas from a zero base, so zero stays in range here even
  // though a line chart no longer forces it (see renderTimeChart).
  const scale = niceScale(Math.min(0, ...nums), nums.length ? Math.max(...nums) : 1,
    field.graph_min, field.graph_max, tickBudget(cH, fs, field.graph_tick_count));
  const tf = tickFormat(scale, precision);

  const yTW = axes ? yTitleWidth(field, fs, unit) : 0;
  const pL = axes ? axisGutter(scale.ticks, tf, fs) + yTW : 2;
  const cW = W - pL - pR;
  const range = scale.hi - scale.lo || 1;
  const gap = Math.max(2, Math.floor(cW / n * 0.2));
  const bW = (cW - gap * (n - 1)) / n;
  const toY = (v: number) => cH - ((v - scale.lo) / range) * cH;
  const zeroY = toY(Math.min(scale.hi, Math.max(scale.lo, 0)));
  const colorOf = (i: number) => field.graph_series?.[i]?.color ?? g.palette[i % g.palette.length]!;

  const pos = field.graph_legend_position ?? sd('graph_legend_position') ?? 'bottom';
  const chart = svg`<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" style="display:block;overflow:visible">
    ${axes ? svg`
      <line x1="${pL}" y1="${pT}" x2="${pL}" y2="${pT+cH}" style="stroke:${g.axis}" stroke-width="1"/>
      <line x1="${pL}" y1="${pT+cH}" x2="${pL+cW}" y2="${pT+cH}" style="stroke:${g.axis}" stroke-width="1"/>
      ${renderYTitle(field, pT, cH, g, fs, unit)}
      ${renderXTitle(field, pL + cW / 2, pT + cH + 14 + fsSm + 1, g, fsSm)}
      ${scale.ticks.map(v => {
        const y = pT + toY(v);
        return svg`
          <line x1="${pL}" y1="${y}" x2="${pL+cW}" y2="${y}" style="stroke:${g.grid}" stroke-width="1"/>
          <text x="${pL-4}" y="${y+3}" text-anchor="end" style="fill:${g.tick}" font-size="${fs}">${fmtTick(v, tf)}</text>`;
      })}
      ${unitStrip(field, unit) ? svg`<text x="${pL-4}" y="${pT-4}" text-anchor="end" style="fill:${g.unit}" font-size="${fsSm}">${unit}</text>` : nothing}
    ` : nothing}
    ${values.map((v, i) => {
      const x = pL + i * (bW + gap);
      const lbl = fitLabel(labels[i] ?? '', bW, fs);
      if (v === null || !Number.isFinite(v)) return svg`
        <rect x="${x}" y="${pT+cH-2}" width="${bW}" height="2" style="fill:${g.baseline}" rx="1"/>
        ${axes ? svg`<text x="${x+bW/2}" y="${pT+cH+14}" text-anchor="middle" style="fill:${g.tickDim}" font-size="${fs}">${lbl}</text>` : nothing}`;
      const bH = Math.max(Math.abs(toY(v) - zeroY), 1);
      const bY = pT + Math.min(toY(v), zeroY);
      return svg`
        <rect x="${x}" y="${bY}" width="${bW}" height="${bH}" style="fill:${colorOf(i)}" rx="2" opacity="0.85">
          <title>${labels[i] ?? ''}: ${fmtValue(v, precision)}${unit ? ` ${unit}` : ''}</title>
        </rect>
        ${showValues ? svg`<text x="${x+bW/2}" y="${(bY - 3).toFixed(1)}" text-anchor="middle" style="fill:${g.barLabel}" font-size="${fs}">${fmtValue(v, precision)}</text>` : nothing}
        ${axes ? svg`<text x="${x+bW/2}" y="${pT+cH+14}" text-anchor="middle" style="fill:${g.tick}" font-size="${fs}">${lbl}</text>` : nothing}`;
    })}
    ${scale.lo < 0 && scale.hi > 0 ? svg`<line x1="${pL}" y1="${pT+zeroY}" x2="${pL+cW}" y2="${pT+zeroY}" style="stroke:${g.zero}" stroke-width="1"/>` : nothing}
  </svg>`;
  return chartFrame(chart, showLegend ? legendRow(labels, colorOf, g, fsSm, pos === 'left' || pos === 'right') : nothing, pos);
}

/**
 * Horizontal bars — the `bar-h` the `graph_bar_v_*` key naming implied for
 * years without ever existing.
 *
 * It earns its place on category labels alone: a vertical bar chart can only
 * give each label the width of its own bar, so six room names truncate to
 * stubs, while here every label gets a whole row and the gutter grows to fit
 * the longest one (capped, so one long name cannot eat the plot).
 */
function renderBarH(field: FieldConfig, values: (number|null)[], labels: string[], unit: string, precision?: number, pending = false): TemplateResult {
  const W = field.width ?? sd('graph_bar_v_width') ?? 200;
  const H = field.height ?? sd('graph_bar_v_height') ?? 130;
  const axes = field.graph_show_axes ?? sd('graph_show_axes') ?? true;
  const g = resolveGraphChrome(field);
  const fs = g.size ?? 9;
  if (values.length === 0) return noData(H, g, pending);

  const showLegend = field.graph_show_legend ?? sd('graph_show_legend') ?? false;
  const showValues = field.graph_bar_labels ?? sd('graph_bar_labels') ?? false;
  const nums = values.filter((v): v is number => v !== null && Number.isFinite(v));

  const xTH = xTitleHeight(field, axes, fs);
  const pT = 6, pB = (axes ? 14 : 4) + xTH;
  const cH = H - pT - pB;
  const scale = niceScale(Math.min(0, ...nums), nums.length ? Math.max(...nums) : 1,
    field.graph_min, field.graph_max, tickBudget(W * 0.55, fs, field.graph_tick_count));
  const tf = tickFormat(scale, precision);

  // The gutter is the widest category label, capped at 40% so one long name
  // cannot crowd out the bars it is labelling.
  const pL = axes
    ? Math.ceil(Math.min(labels.reduce((w, l) => Math.max(w, textWidth(l, fs)), 0) + 6, W * 0.4))
    : 2;
  const pR = showValues ? Math.ceil(textWidth('000.0', fs) + 6) : 6;
  const cW = W - pL - pR;
  const n = Math.max(values.length, 1);
  const gap = Math.max(2, Math.floor(cH / n * 0.25));
  const bH = (cH - gap * (n - 1)) / n;
  const range = scale.hi - scale.lo || 1;
  const toX = (v: number) => pL + ((v - scale.lo) / range) * cW;
  const zeroX = toX(Math.max(scale.lo, 0));
  const colorOf = (i: number) => field.graph_series?.[i]?.color ?? g.palette[i % g.palette.length]!;

  const chart = svg`<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" style="display:block;overflow:visible">
    ${axes ? svg`
      <line x1="${pL}" y1="${pT}" x2="${pL}" y2="${pT+cH}" style="stroke:${g.axis}" stroke-width="1"/>
      <line x1="${pL}" y1="${pT+cH}" x2="${pL+cW}" y2="${pT+cH}" style="stroke:${g.axis}" stroke-width="1"/>
      ${scale.ticks.map(v => {
        const x = toX(v), lbl = fmtTick(v, tf);
        const a = tickAnchor(x, lbl, fs, 0, W);
        return svg`
          <line x1="${x}" y1="${pT}" x2="${x}" y2="${pT+cH}" style="stroke:${g.grid}" stroke-width="1"/>
          <text x="${a.x.toFixed(1)}" y="${pT+cH+11}" text-anchor="${a.anchor}" style="fill:${g.tick}" font-size="${fs}">${lbl}</text>`;
      })}
      ${unit ? svg`<text x="${W-2}" y="${pT+cH+11}" text-anchor="end" style="fill:${g.unit}" font-size="${fs}">${unit}</text>` : nothing}
      ${renderXTitle(field, pL + cW / 2, pT + cH + 11 + fs + 1, g, fs)}
    ` : nothing}
    ${values.map((v, i) => {
      const y = pT + i * (bH + gap);
      const cy = y + bH / 2 + fs * 0.35;
      const lbl = axes ? svg`<text x="${pL-4}" y="${cy.toFixed(1)}" text-anchor="end" style="fill:${v == null ? g.tickDim : g.tick}" font-size="${fs}">${fitLabel(labels[i] ?? '', pL - 6, fs)}</text>` : nothing;
      if (v === null || !Number.isFinite(v)) return svg`
        <rect x="${zeroX.toFixed(1)}" y="${y.toFixed(1)}" width="2" height="${bH.toFixed(1)}" style="fill:${g.baseline}" rx="1"/>${lbl}`;
      const x = Math.min(toX(v), zeroX), w = Math.max(Math.abs(toX(v) - zeroX), 1);
      return svg`
        <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${bH.toFixed(1)}" style="fill:${colorOf(i)}" rx="2" opacity="0.85">
          <title>${labels[i] ?? ''}: ${fmtValue(v, precision)}${unit ? ` ${unit}` : ''}</title>
        </rect>
        ${lbl}
        ${showValues ? svg`<text x="${(x + w + 4).toFixed(1)}" y="${cy.toFixed(1)}" style="fill:${g.barLabel}" font-size="${fs}">${fmtValue(v, precision)}</text>` : nothing}`;
    })}
    ${scale.lo < 0 && scale.hi > 0 ? svg`<line x1="${zeroX}" y1="${pT}" x2="${zeroX}" y2="${pT+cH}" style="stroke:${g.zero}" stroke-width="1"/>` : nothing}
  </svg>`;

  const pos = field.graph_legend_position ?? sd('graph_legend_position') ?? 'bottom';
  return chartFrame(chart, showLegend ? legendRow(labels, colorOf, g, fs, pos === 'left' || pos === 'right') : nothing, pos);
}

// ── Gauge helpers ─────────────────────────────────────────────────────────────

/**
 * The gauge's arc endpoints, from a configurable total sweep centred on 12
 * o'clock. Clamped to 30..350 — below 30 the arc is a stub with no readable
 * travel, and a full 360 would put the start and end marks on top of each
 * other with no way to tell which end you are at.
 */
function gaugeSweep(field: FieldConfig): { start: number; end: number } {
  const raw = field.graph_gauge_sweep ?? sd('graph_gauge_sweep') ?? 270;
  const sweep = Math.max(30, Math.min(350, raw));
  return { start: -sweep / 2, end: sweep / 2 };
}

/** Tick marks around a gauge arc, at the same values the axis scale would use. */
function gaugeTicks(field: FieldConfig, lo: number, hi: number, cx: number, cy: number, R: number,
                    start: number, end: number, g: GraphChrome) {
  if (!(field.graph_gauge_ticks ?? sd('graph_gauge_ticks') ?? false)) return nothing;
  const scale = niceScale(lo, hi, lo, hi, field.graph_tick_count ?? 5);
  const range = hi - lo || 1;
  return scale.ticks.map((v) => {
    const deg = start + ((v - lo) / range) * (end - start);
    const [x1, y1] = polarToCart(cx, cy, R * 0.86, deg);
    const [x2, y2] = polarToCart(cx, cy, R * 0.72, deg);
    return svg`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" style="stroke:${g.axis}" stroke-width="1"/>`;
  });
}

/** Caption under a gauge's value readout. */
function gaugeCaption(field: FieldConfig, cx: number, y: number, g: GraphChrome, fs: number) {
  if (!field.graph_gauge_label) return nothing;
  return svg`<text x="${cx}" y="${y.toFixed(1)}" text-anchor="middle" style="fill:${g.legend}" font-size="${fs}">${field.graph_gauge_label}</text>`;
}

function polarToCart(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = (deg - 90) * Math.PI / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const [sx, sy] = polarToCart(cx, cy, r, startDeg);
  const [ex, ey] = polarToCart(cx, cy, r, endDeg);
  const sweep = ((endDeg - startDeg) + 360) % 360;
  const large = sweep > 180 ? 1 : 0;
  return `M ${sx.toFixed(2)} ${sy.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${ex.toFixed(2)} ${ey.toFixed(2)}`;
}

function renderGaugeNeedle(field: FieldConfig, value: number | null, unit: string, precision?: number): TemplateResult {
  const W = field.width ?? sd('graph_gauge_width') ?? 180;
  const H = field.height ?? Math.round(W * 0.72);
  const lo = field.graph_min ?? sd('graph_min') ?? 0, hi = field.graph_max ?? sd('graph_max') ?? 100;
  const range = hi - lo || 1;
  const pct = value !== null ? Math.max(0, Math.min(1, (value - lo) / range)) : 0;
  const { start: gStart, end: gEnd } = gaugeSweep(field);
  const needleDeg = gStart + pct * (gEnd - gStart);
  const R = Math.min((W - 20) / 2, (H - 28) / (1 + Math.sin((135) * Math.PI / 180)));
  const cx = W / 2, cy = H - 14 - R * Math.sin((gEnd - 90) * Math.PI / 180);

  const g = resolveGraphChrome(field);
  const fs = g.size ?? 9;
  const trackColor = g.track;
  const color = field.graph_series?.[0]?.color ?? g.palette[0];
  const [nx, ny] = polarToCart(cx, cy, R * 0.82, needleDeg);
  const [n0x, n0y] = polarToCart(cx, cy, R * 0.12, needleDeg + 180);
  const [startPx, startPy] = polarToCart(cx, cy, R + 10, gStart);
  const [endPx, endPy] = polarToCart(cx, cy, R + 10, gEnd);

  return html`<div style="width:100%;overflow:hidden">${svg`<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" style="display:block">
    <path d="${arcPath(cx, cy, R, gStart, gEnd)}" fill="none" style="stroke:${trackColor}" stroke-width="8" stroke-linecap="round"/>
    ${value !== null ? svg`<path d="${arcPath(cx, cy, R, gStart, needleDeg)}" fill="none" style="stroke:${color}" stroke-width="8" stroke-linecap="round" opacity="0.85"/>` : nothing}
    <line x1="${n0x.toFixed(2)}" y1="${n0y.toFixed(2)}" x2="${nx.toFixed(2)}" y2="${ny.toFixed(2)}" style="stroke:${color}" stroke-width="2.5" stroke-linecap="round" opacity="0.9"/>
    <circle cx="${cx}" cy="${cy}" r="5" style="fill:${color}" opacity="0.9"/>
    ${value !== null ? svg`<text x="${cx}" y="${cy + R * 0.28}" text-anchor="middle" style="fill:${g.value}" font-size="${Math.round(R * 0.28)}" font-weight="600">${fmtValue(value, precision)}${unit ? svg`<tspan font-size="${Math.round(R * 0.17)}" style="fill:${g.unit}"> ${unit}</tspan>` : nothing}</text>` : nothing}
    ${gaugeTicks(field, lo, hi, cx, cy, R, gStart, gEnd, g)}
    ${gaugeCaption(field, cx, cy + R * 0.52, g, fs)}
    <text x="${startPx.toFixed(1)}" y="${(startPy + 12).toFixed(1)}" text-anchor="middle" style="fill:${g.tick}" font-size="${fs}">${fmtValue(lo, precision)}</text>
    <text x="${endPx.toFixed(1)}" y="${(endPy + 12).toFixed(1)}" text-anchor="middle" style="fill:${g.tick}" font-size="${fs}">${fmtValue(hi, precision)}</text>
  </svg>`}</div>`;
}

function renderGaugeSegmented(field: FieldConfig, value: number | null, unit: string, precision?: number): TemplateResult {
  const W = field.width ?? sd('graph_gauge_width') ?? 180;
  const H = field.height ?? Math.round(W * 0.72);
  const lo = field.graph_min ?? sd('graph_min') ?? 0, hi = field.graph_max ?? sd('graph_max') ?? 100;
  const range = hi - lo || 1;
  const pct = value !== null ? Math.max(0, Math.min(1, (value - lo) / range)) : 0;
  const { start: gStart, end: gEnd } = gaugeSweep(field);
  const valueDeg = gStart + pct * (gEnd - gStart);
  const R = Math.min((W - 20) / 2, (H - 28) / (1 + Math.sin((135) * Math.PI / 180)));
  const cx = W / 2, cy = H - 14 - R * Math.sin((gEnd - 90) * Math.PI / 180);
  const Ri = R * 0.72;
  const g = resolveGraphChrome(field);
  const fs = g.size ?? 9;

  // graph_thresholds first: `thresholds` is the fill field's key and was
  // cross-purposed here, so a field converted from a fill inherited bands it
  // never asked for. It still works when the new key is unset.
  const thresholds = field.graph_thresholds ?? field.thresholds ?? [];
  const [startPx, startPy] = polarToCart(cx, cy, R + 10, gStart);
  const [endPx, endPy] = polarToCart(cx, cy, R + 10, gEnd);

  // Build colored arc segments
  const segments: TemplateResult[] = [];
  if (thresholds.length === 0) {
    // Single color fill up to value
    const color = field.graph_series?.[0]?.color ?? g.palette[0];
    segments.push(svg`
      <path d="${arcPath(cx, cy, R, gStart, gEnd)}" fill="none" style="stroke:${g.track}" stroke-width="14"/>
      ${value !== null ? svg`<path d="${arcPath(cx, cy, R, gStart, valueDeg)}" fill="none" style="stroke:${color}" stroke-width="14" stroke-linecap="round" opacity="0.85"/>` : nothing}
    `);
  } else {
    // Threshold-based segments
    const sorted = [...thresholds].sort((a, b) => a.value - b.value);
    const breakpoints = [lo, ...sorted.map((t) => t.value), hi];
    const colors = [g.track, ...sorted.map((t) => t.color)];
    for (let k = 0; k < breakpoints.length - 1; k++) {
      const s = gStart + ((breakpoints[k]! - lo) / range) * (gEnd - gStart);
      const e = gStart + ((breakpoints[k + 1]! - lo) / range) * (gEnd - gStart);
      if (e <= s) continue;
      const col = value !== null && breakpoints[k]! <= value ? colors[k + 1]! : g.track;
      segments.push(svg`<path d="${arcPath(cx, cy, R, s, Math.min(e, value !== null ? valueDeg : s))}" fill="none" style="stroke:${col}" stroke-width="14" stroke-linecap="butt" opacity="0.85"/>`);
      segments.push(svg`<path d="${arcPath(cx, cy, R, Math.min(e, value !== null ? valueDeg : s), e)}" fill="none" style="stroke:${g.track}" stroke-width="14" stroke-linecap="butt"/>`);
    }
  }

  return html`<div style="width:100%;overflow:hidden">${svg`<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" style="display:block">
    ${segments}
    <path d="${arcPath(cx, cy, Ri, gStart, gEnd)}" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="2"/>
    ${value !== null ? svg`<text x="${cx}" y="${cy + R * 0.22}" text-anchor="middle" style="fill:${g.value}" font-size="${Math.round(R * 0.28)}" font-weight="600">${fmtValue(value, precision)}${unit ? svg`<tspan font-size="${Math.round(R * 0.17)}" style="fill:${g.unit}"> ${unit}</tspan>` : nothing}</text>` : nothing}
    ${gaugeTicks(field, lo, hi, cx, cy, R, gStart, gEnd, g)}
    ${gaugeCaption(field, cx, cy + R * 0.52, g, fs)}
    <text x="${startPx.toFixed(1)}" y="${(startPy + 12).toFixed(1)}" text-anchor="middle" style="fill:${g.tick}" font-size="${fs}">${fmtValue(lo, precision)}</text>
    <text x="${endPx.toFixed(1)}" y="${(endPy + 12).toFixed(1)}" text-anchor="middle" style="fill:${g.tick}" font-size="${fs}">${fmtValue(hi, precision)}</text>
  </svg>`}</div>`;
}

// ── Time-series chart helpers ─────────────────────────────────────────────────

/**
 * x-axis tick positions + labels for a time-series chart, scaled from minutes
 * to months. A history series's own Stat period (#118) now ranges from "Last
 * 30 minutes" to "Last year" rather than only ever a multi-hour/day live
 * window, so a single fixed 6/12/24-hour step (the old renderTimeChart logic)
 * produced zero ticks on a short window and unreadable clutter on a long one.
 * Shared by renderTimeChart and renderStateTimeline so the two can't drift.
 */
function timeAxisTicks(tMin: number, tMax: number): { t: number; label: string }[] {
  const pad2 = (n: number) => String(n).padStart(2, '0');
  const spanHours = (tMax - tMin) / 3_600_000;
  // Beyond ~3 days a bare hour-of-day label repeats across different days and
  // stops meaning anything on its own; switch to a date label instead.
  const dateScale = spanHours > 72;
  const ticks: number[] = [];
  if (!dateScale) {
    const stepMs = spanHours <= 2 ? 15 * 60_000 : spanHours <= 6 ? 30 * 60_000
      : spanHours <= 24 ? 3 * 3_600_000 : 6 * 3_600_000;
    // Align to local-midnight-relative minutes rather than raw ms since tMin,
    // so ticks land on nice boundaries (:00/:15/:30/:45, or 0/3/6/9h) instead
    // of wherever the data happens to start.
    const dayStart = new Date(tMin); dayStart.setHours(0, 0, 0, 0);
    const stepMin = stepMs / 60_000;
    const minsSinceMidnight = (tMin - dayStart.getTime()) / 60_000;
    let t = dayStart.getTime() + Math.ceil(minsSinceMidnight / stepMin) * stepMin * 60_000;
    while (t <= tMax) { ticks.push(t); t += stepMs; }
  } else {
    // Calendar-day stepping, not ms arithmetic — a fixed ms step drifts across
    // a DST transition over a multi-week/month span (same reasoning as
    // computeTimeRange's calendar boundaries in stats.ts).
    const stepDays = spanHours <= 24 * 14 ? 1 : spanHours <= 24 * 90 ? 7 : 30;
    const d = new Date(tMin); d.setHours(0, 0, 0, 0);
    if (d.getTime() < tMin) d.setDate(d.getDate() + stepDays);
    while (d.getTime() <= tMax) { ticks.push(d.getTime()); d.setDate(d.getDate() + stepDays); }
  }
  return ticks.map((t) => {
    const d = new Date(t);
    return { t, label: dateScale ? `${d.getMonth() + 1}/${d.getDate()}` : `${d.getHours()}:${pad2(d.getMinutes())}` };
  });
}

/**
 * The `d` for a trace through `pts`, in the requested curve.
 *
 * 'smooth' is a monotone cubic rather than a plain spline: the tangents are
 * clamped (Fritsch–Carlson) so a control point can never bulge past its
 * neighbours, which stops a smoothed solar curve inventing a dip below zero
 * between two readings that never went there. 'step' holds each value until
 * the next sample, which is what a meter or a setpoint actually does.
 */
function tracePath(pts: { x: number; y: number }[], curve: GraphCurve): string {
  if (pts.length < 2) return '';
  const f = (n: number) => n.toFixed(1);
  if (curve === 'step') {
    let d = `M ${f(pts[0]!.x)},${f(pts[0]!.y)}`;
    for (let i = 1; i < pts.length; i++) d += ` L ${f(pts[i]!.x)},${f(pts[i - 1]!.y)} L ${f(pts[i]!.x)},${f(pts[i]!.y)}`;
    return d;
  }
  if (curve !== 'smooth') return `M ${pts.map((p) => `${f(p.x)},${f(p.y)}`).join(' L ')}`;

  const n = pts.length;
  const dx: number[] = [], slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const h = pts[i + 1]!.x - pts[i]!.x || 1e-6;
    dx.push(h);
    slope.push((pts[i + 1]!.y - pts[i]!.y) / h);
  }
  // A sample that sits between two opposite slopes is a turning point, and
  // gets a flat tangent so the curve cannot overshoot through it.
  const m: number[] = new Array(n);
  m[0] = slope[0]!;
  m[n - 1] = slope[n - 2]!;
  for (let i = 1; i < n - 1; i++) {
    const a = slope[i - 1]!, b = slope[i]!;
    m[i] = a * b <= 0 ? 0 : (a + b) / 2;
  }
  for (let i = 0; i < n - 1; i++) {
    if (slope[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const ak = m[i]! / slope[i]!, bk = m[i + 1]! / slope[i]!;
    const sq = ak * ak + bk * bk;
    if (sq > 9) {
      const t = 3 / Math.sqrt(sq);
      m[i] = t * ak * slope[i]!;
      m[i + 1] = t * bk * slope[i]!;
    }
  }
  let d = `M ${f(pts[0]!.x)},${f(pts[0]!.y)}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i]!;
    d += ` C ${f(pts[i]!.x + h / 3)},${f(pts[i]!.y + (m[i]! * h) / 3)}`
      +  ` ${f(pts[i + 1]!.x - h / 3)},${f(pts[i + 1]!.y - (m[i + 1]! * h) / 3)}`
      +  ` ${f(pts[i + 1]!.x)},${f(pts[i + 1]!.y)}`;
  }
  return d;
}

function renderTimeChart(field: FieldConfig, allSeries: HistoryPoint[][], labels: string[], filled: boolean, unit = '', precision?: number, pending = false): TemplateResult {
  const W = field.width ?? sd('graph_time_chart_width') ?? 260;
  const H = field.height ?? sd('graph_time_chart_height') ?? 120;
  const axes = field.graph_show_axes ?? sd('graph_show_axes') ?? true;
  const g = resolveGraphChrome(field);
  const fs = g.size ?? 8;

  const allPoints = allSeries.flat();
  if (allPoints.length === 0) return noData(H, g, pending);

  const tMin = Math.min(...allPoints.map((p) => p.t));
  const tMax = Math.max(...allPoints.map((p) => p.t));
  const tRange = tMax - tMin || 1;

  // Zero is no longer forced into the range. A sensor that lives between 18
  // and 24 used to be plotted in the top quarter of a 0-24 axis and read as a
  // flat line; a line chart is about the shape of the trace, not the distance
  // from zero (a bar chart, which is, keeps its zero base in renderBarV).
  const showLegend = field.graph_show_legend ?? sd('graph_show_legend') ?? false;

  // See renderBarV: padding first, then the scale, so the tick budget knows
  // how tall the plot is and the unit label has a strip of its own.
  const unitH = unitStrip(field, unit) && axes ? fs + 3 : 0;
  const xTH = xTitleHeight(field, axes, fs);
  const pT = 6 + unitH, pB = (axes ? 14 : 2) + xTH, pR = 4;
  const cH = H - pT - pB;

  const nums = allPoints.map((p) => p.v).filter((v) => Number.isFinite(v));
  const zeroBase = field.graph_include_zero ?? sd('graph_include_zero') ?? false;
  const scale = niceScale(zeroBase ? Math.min(0, ...nums) : Math.min(...nums),
    zeroBase ? Math.max(0, ...nums) : Math.max(...nums),
    field.graph_min, field.graph_max, tickBudget(cH, fs, field.graph_tick_count));
  const tf = tickFormat(scale, precision);

  const yTW = axes ? yTitleWidth(field, fs, unit) : 0;
  const pL = axes ? axisGutter(scale.ticks, tf, fs) + yTW : 2;
  const cW = W - pL - pR;
  const vRange = scale.hi - scale.lo || 1;

  const toX = (t: number) => pL + ((t - tMin) / tRange) * cW;
  const toY = (v: number) => pT + cH - ((v - scale.lo) / vRange) * cH;
  const zeroY = toY(Math.min(scale.hi, Math.max(scale.lo, 0)));
  const colorOf = (i: number) => field.graph_series?.[i]?.color ?? g.palette[i % g.palette.length]!;

  const timeTicks = timeAxisTicks(tMin, tMax);
  const curve = field.graph_curve ?? sd('graph_curve') ?? 'linear';
  const showPoints = field.graph_points ?? sd('graph_points') ?? false;
  const showLast = field.graph_last_point ?? sd('graph_last_point') ?? false;

  // A <title> on the polyline is a whole-element tooltip: it reads the same
  // wherever along the trace the pointer happens to be, which made it a
  // confident lie about the value under the cursor. Instead the plot is
  // covered by one invisible band per sample time, each carrying the reading
  // of every series at that moment — so hovering anywhere answers "what was
  // it here?" rather than "what is it now?".
  const bandTimes = (() => {
    const set = new Set<number>();
    for (const pts of allSeries) for (const p of pts) if (Number.isFinite(p.v)) set.add(p.t);
    const all = [...set].sort((a, b) => a - b);
    // A day of 5-minute buckets is ~290 samples; past ~120 bands the rects are
    // sub-pixel and the DOM cost stops buying anything.
    if (all.length <= 120) return all;
    const every = Math.ceil(all.length / 120);
    return all.filter((_, i) => i % every === 0);
  })();

  // Walked once per series rather than searched per band — a naive lookup is
  // bands x points, which is six figures of work on every hass update.
  const bandValues: (number | null)[][] = allSeries.map((pts) => {
    const out: (number | null)[] = [];
    let i = 0, cur: number | null = null;
    for (const t of bandTimes) {
      while (i < pts.length && pts[i]!.t <= t) { if (Number.isFinite(pts[i]!.v)) cur = pts[i]!.v; i++; }
      out.push(cur);
    }
    return out;
  });

  const stampFor = (t: number) => (tMax - tMin) / 3_600_000 > 24
    ? new Date(t).toLocaleString()
    : new Date(t).toLocaleTimeString();

  const hoverBands = bandTimes.map((t, bi) => {
    const prev = bandTimes[bi - 1], next = bandTimes[bi + 1];
    // Bands meet at the midpoints between samples, so the nearest reading is
    // the one you get — the edge bands run out to the plot edge.
    const x0 = prev == null ? pL : (toX(prev) + toX(t)) / 2;
    const x1 = next == null ? pL + cW : (toX(t) + toX(next)) / 2;
    const lines = allSeries.map((_, si) => {
      const v = bandValues[si]![bi];
      const shown = v == null ? '—' : `${fmtValue(v, precision)}${unit ? ` ${unit}` : ''}`;
      return `${labels[si] || `Series ${si + 1}`}: ${shown}`;
    });
    return svg`<rect x="${x0.toFixed(1)}" y="${pT}" width="${Math.max(x1 - x0, 0.5).toFixed(1)}" height="${cH}"
      fill="transparent" style="pointer-events:all"><title>${[stampFor(t), ...lines].join('\n')}</title></rect>`;
  });

  const pos = field.graph_legend_position ?? sd('graph_legend_position') ?? 'bottom';
  const chart = svg`<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" style="display:block;overflow:visible">
    ${axes ? svg`
      <line x1="${pL}" y1="${pT}" x2="${pL}" y2="${pT+cH}" style="stroke:${g.axis}" stroke-width="1"/>
      <line x1="${pL}" y1="${pT+cH}" x2="${pL+cW}" y2="${pT+cH}" style="stroke:${g.axis}" stroke-width="1"/>
      ${renderYTitle(field, pT, cH, g, fs, unit)}
      ${renderXTitle(field, pL + cW / 2, pT + cH + 11 + fs + 1, g, fs)}
      ${scale.ticks.map(v => {
        const y = toY(v);
        return svg`
          <line x1="${pL}" y1="${y}" x2="${pL+cW}" y2="${y}" style="stroke:${g.grid}" stroke-width="1"/>
          <text x="${pL-4}" y="${y+3}" text-anchor="end" style="fill:${g.tick}" font-size="${fs}">${fmtTick(v, tf)}</text>`;
      })}
      ${unitStrip(field, unit) ? svg`<text x="${pL-4}" y="${pT-4}" text-anchor="end" style="fill:${g.unit}" font-size="${fs}">${unit}</text>` : nothing}
      ${timeTicks.map(({ t, label: lbl }) => {
        const x = toX(t);
        const a = tickAnchor(x, lbl, fs, 0, W);
        return svg`
          <line x1="${x}" y1="${pT}" x2="${x}" y2="${pT+cH}" style="stroke:${g.grid}" stroke-width="1"/>
          <text x="${a.x.toFixed(1)}" y="${pT+cH+11}" text-anchor="${a.anchor}" style="fill:${g.tick}" font-size="${fs}">${lbl}</text>`;
      })}
    ` : nothing}
    ${allSeries.map((pts, si) => {
      const color = colorOf(si);
      const sw = field.graph_stroke_width ?? sd('graph_stroke_width') ?? 1.5;
      const valid = pts.filter((p) => Number.isFinite(p.v));
      if (valid.length < 2) return nothing;
      const xy = valid.map((p) => ({ x: toX(p.t), y: toY(p.v) }));
      const lineD = tracePath(xy, curve);
      const last = valid[valid.length - 1]!;
      const lastXY = xy[xy.length - 1]!;
      // A dot per sample is unreadable once the samples are closer together
      // than the dot is wide, so it is dropped rather than drawn as a smear.
      const dots = showPoints && cW / xy.length >= sw * 4
        ? xy.map((q) => svg`<circle cx="${q.x.toFixed(1)}" cy="${q.y.toFixed(1)}" r="${(sw * 1.2).toFixed(1)}" style="fill:${color}" opacity="0.9"/>`)
        : nothing;
      const endMark = showLast ? svg`
        <circle cx="${lastXY.x.toFixed(1)}" cy="${lastXY.y.toFixed(1)}" r="${(sw * 1.6).toFixed(1)}" style="fill:${color}"/>
        <text x="${(lastXY.x - sw * 2.4).toFixed(1)}" y="${(lastXY.y - sw * 2).toFixed(1)}" text-anchor="end"
          style="fill:${color}" font-size="${fs}" font-weight="600">${fmtValue(last.v, precision)}</text>` : nothing;
      if (filled) {
        // The fill follows the same curve as the stroke — closing the area
        // with straight edges to the baseline would leave a smoothed or
        // stepped line floating above its own fill.
        const areaD = `${lineD} L ${lastXY.x.toFixed(1)},${zeroY.toFixed(1)} L ${xy[0]!.x.toFixed(1)},${zeroY.toFixed(1)} Z`;
        const fo = field.graph_fill_opacity ?? sd('graph_fill_opacity') ?? 0.2;
        return svg`
          <path d="${areaD}" style="fill:${color}" opacity="${fo}"/>
          <path d="${lineD}" fill="none" style="stroke:${color}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round" opacity="0.9"/>
          ${dots}${endMark}`;
      }
      return svg`<path d="${lineD}" fill="none" style="stroke:${color}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round" opacity="0.9"/>${dots}${endMark}`;
    })}
    ${hoverBands}
    ${scale.lo < 0 && scale.hi > 0 ? svg`<line x1="${pL}" y1="${zeroY}" x2="${pL+cW}" y2="${zeroY}" style="stroke:${g.zero}" stroke-width="1"/>` : nothing}
  </svg>`;
  return chartFrame(chart, showLegend ? legendRow(labels, colorOf, g, fs, pos === 'left' || pos === 'right') : nothing, pos);
}

function renderBarStacked(field: FieldConfig, values: (number|null)[], labels: string[], unit: string, precision?: number, pending = false): TemplateResult {
  const W = field.width ?? sd('graph_bar_v_width') ?? 200;
  const H = field.height ?? sd('graph_bar_v_height') ?? 130;
  const axes = field.graph_show_axes ?? sd('graph_show_axes') ?? true;
  const g = resolveGraphChrome(field);
  const fs = g.size ?? 8;
  const nums = values.filter((v): v is number => v !== null && Number.isFinite(v) && v > 0);
  if (values.length === 0) return noData(H, g, pending);
  const total = nums.reduce((a, b) => a + b, 0) || 1;

  const showLegend = field.graph_show_legend ?? sd('graph_show_legend') ?? false;

  const unitH = unitStrip(field, unit) && axes ? fs + 3 : 0;
  const xTH = xTitleHeight(field, axes, fs);
  // Nothing is drawn below a stacked bar's plot but its own x label, so the
  // strip is the label's height and a hair, not the 20px a tick row needed.
  const pT = 6 + unitH, pB = 4 + xTH, pR = axes ? 10 : 4;
  const cH = H - pT - pB;

  // A stacked bar's axis runs 0..total, so the scale is derived from the total
  // rather than from graph_min/graph_max -- those two are meaningless here and
  // the editor no longer offers them for this type.
  const scale = niceScale(0, total, 0, undefined, tickBudget(cH, fs, field.graph_tick_count));
  const tf = tickFormat(scale, precision);

  const yTW = axes ? yTitleWidth(field, fs, unit) : 0;
  const pL = axes ? axisGutter(scale.ticks, tf, fs) + yTW : 4;
  const cW = W - pL - pR;
  const barW = Math.min(cW * 0.6, 40);
  const bX = pL + (cW - barW) / 2;
  const colorOf = (i: number) => field.graph_series?.[i]?.color ?? g.palette[i % g.palette.length]!;
  // Segments are laid out against the same nice scale as the gridlines, so the
  // top of the stack lands on the total's tick instead of always at the top of
  // the plot regardless of where the axis said the total was.
  const toH = (v: number) => (v / (scale.hi - scale.lo || 1)) * cH;

  let stackY = pT + cH;
  const segments = values.map((v, i) => {
    const color = colorOf(i);
    if (v === null || !Number.isFinite(v) || v <= 0) return { color, h: 0, y: stackY, lbl: labels[i] ?? '', v: v ?? 0 };
    const h = toH(v);
    stackY -= h;
    return { color, h, y: stackY, lbl: labels[i] ?? '', v };
  });

  const pos = field.graph_legend_position ?? sd('graph_legend_position') ?? 'bottom';
  const chart = svg`<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" style="display:block;overflow:visible">
    ${axes ? svg`
      ${unitStrip(field, unit) ? svg`<text x="${pL-4}" y="${pT-4}" text-anchor="end" style="fill:${g.unit}" font-size="${fs}">${unit}</text>` : nothing}
      <line x1="${pL}" y1="${pT}" x2="${pL}" y2="${pT+cH}" style="stroke:${g.axis}" stroke-width="1"/>
      <line x1="${pL}" y1="${pT+cH}" x2="${pL+cW}" y2="${pT+cH}" style="stroke:${g.axis}" stroke-width="1"/>
      ${renderYTitle(field, pT, cH, g, fs, unit)}
      ${renderXTitle(field, pL + cW / 2, pT + cH + fs + 2, g, fs)}
      ${scale.ticks.map(v => {
        const y = pT + cH - toH(v);
        return svg`
          <line x1="${pL}" y1="${y}" x2="${pL+cW}" y2="${y}" style="stroke:${g.grid}" stroke-width="1"/>
          <text x="${pL-4}" y="${y+3}" text-anchor="end" style="fill:${g.tick}" font-size="${fs}">${fmtTick(v, tf)}</text>`;
      })}
    ` : nothing}
    ${segments.map((seg, i) => seg.h > 0 ? svg`
      <rect x="${bX.toFixed(1)}" y="${seg.y.toFixed(1)}" width="${barW.toFixed(1)}" height="${seg.h.toFixed(1)}" style="fill:${seg.color}" opacity="0.85" rx="1">
        <title>${seg.lbl || `Series ${i + 1}`}: ${fmtValue(seg.v, precision)}${unit ? ` ${unit}` : ''}</title>
      </rect>
      ${seg.h > fs + 2 ? svg`<text x="${(bX + barW / 2).toFixed(1)}" y="${(seg.y + seg.h / 2 + 3).toFixed(1)}" text-anchor="middle" style="fill:${g.barLabel}" font-size="${fs}">${fitLabel(seg.lbl, barW - 4, fs)}</text>` : nothing}
    ` : nothing)}
  </svg>`;
  return chartFrame(chart, showLegend ? legendRow(labels, colorOf, g, fs, pos === 'left' || pos === 'right') : nothing, pos);
}

/** Pretty-print a raw state for a timeline label: `heat_cool` -> `Heat cool`. */
function stateLabel(raw: string): string {
  const t = raw.replace(/_/g, ' ').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const UNAVAILABLE_STATES = new Set(['unavailable', 'unknown', 'none', '']);

function renderStateTimeline(field: FieldConfig, pts: HistoryPoint[], name = '', pending = false): TemplateResult {
  const W = field.width ?? sd('graph_time_chart_width') ?? 260;
  const barH = field.height ?? 36;
  const axes = field.graph_show_axes ?? sd('graph_show_axes') ?? true;

  const g = resolveGraphChrome(field);
  const fs = g.size ?? 8;

  // The timeline's legend lists the states present rather than the series, so
  // it is the one chart where nothing on screen said *which* entity was being
  // plotted. The name gets its own place instead of competing for the legend.
  const labelPos: GraphTimelineLabel = field.graph_timeline_label ?? sd('graph_timeline_label') ?? 'above';
  const showName = labelPos !== 'none' && !!name;
  // Above by default: a left label can only have the width the bar gives up,
  // and a third of a 260px chart is about 12 characters — less than an average
  // friendly name, so it truncated more often than it read. Above costs one
  // line of height and fits the name whole.
  const pL = showName && labelPos === 'left'
    ? Math.ceil(Math.min(textWidth(name, fs) + 6, W / 3))
    : 0;
  const nameFs = fs + 1;
  const pTop = showName && labelPos === 'above' ? nameFs + 4 : 0;
  // The bar itself keeps whatever height was configured; axis labels get
  // their own strip below it rather than shrinking the bar to make room.
  const xTH = xTitleHeight(field, axes, fs);
  const pB = (axes ? 13 : 0) + xTH;
  const H = barH + pB + pTop;
  const barW = W - pL;

  if (pts.length < 1) return noData(H, g, pending);

  const tMin = pts[0]!.t, tMax = pts[pts.length - 1]!.t, tRange = tMax - tMin || 1;
  const toX = (t: number) => pL + ((t - tMin) / tRange) * barW;

  const showNames = field.graph_show_state_names ?? sd('graph_show_state_names') ?? false;
  const unavailColor = field.graph_unavailable_color ?? sd('graph_unavailable_color') ?? 'rgba(255,255,255,0.12)';
  // The configured map wins, matched case-insensitively so `On` and `on` are
  // the same state to a human writing the config. Anything unmapped falls back
  // to the palette in first-seen order, which is at least guaranteed to make
  // different states look different.
  const mapped = new Map<string, string>();
  for (const c of field.graph_state_colors ?? []) if (c.state) mapped.set(c.state.toLowerCase(), c.color);

  const keyOf = (p: HistoryPoint) => (p.s ?? String(p.v)).toLowerCase();
  const order = new Map<string, number>();
  for (const p of pts) { const k = keyOf(p); if (!order.has(k)) order.set(k, order.size); }

  const colorFor = (p: HistoryPoint): string => {
    const k = keyOf(p);
    const explicit = mapped.get(k);
    if (explicit) return explicit;
    if (UNAVAILABLE_STATES.has(k)) return unavailColor;
    return g.palette[(order.get(k) ?? 0) % g.palette.length]!;
  };

  const segments = pts.map((p, i) => {
    const x1 = toX(p.t);
    const x2 = i + 1 < pts.length ? toX(pts[i + 1]!.t) : W;
    return { x1, x2, t: p.t, label: p.s != null ? stateLabel(p.s) : fmtValue(p.v), color: colorFor(p) };
  });
  // A state timeline had no x-axis at all before #118 — its whole point is
  // showing when things changed, which is unreadable without a time scale.
  const timeTicks = axes ? timeAxisTicks(tMin, tMax) : [];

  // The legend lists the states present, not the series — a timeline plots one
  // entity, so naming the series says nothing the field label doesn't.
  const showLegend = field.graph_show_legend ?? sd('graph_show_legend') ?? false;
  const seen: string[] = [];
  const seenColors: string[] = [];
  for (const p of pts) {
    const k = keyOf(p);
    if (seen.includes(k)) continue;
    seen.push(k);
    seenColors.push(colorFor(p));
  }
  const pos = field.graph_legend_position ?? sd('graph_legend_position') ?? 'bottom';

  const chart = svg`<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" style="display:block">
    ${showName && labelPos === 'above'
      ? svg`<text x="0" y="${nameFs}" style="fill:${g.legend}" font-size="${nameFs}">${name}</text>` : nothing}
    ${showName && labelPos === 'left'
      ? svg`<text x="${pL - 5}" y="${(pTop + barH / 2 + fs * 0.35).toFixed(1)}" text-anchor="end" style="fill:${g.legend}" font-size="${fs}">${fitLabel(name, pL - 5, fs)}</text>` : nothing}
    ${segments.map(seg => {
      const w = Math.max(seg.x2 - seg.x1, 0.5);
      return svg`
      <rect x="${seg.x1.toFixed(1)}" y="${pTop}" width="${w.toFixed(1)}" height="${barH}" style="fill:${seg.color}" opacity="0.8">
        <title>${seg.label} — ${new Date(seg.t).toLocaleString()}</title>
      </rect>
      ${showNames && w > textWidth(seg.label, fs) + 6 ? svg`<text x="${(seg.x1 + w / 2).toFixed(1)}" y="${(pTop + barH / 2 + fs * 0.35).toFixed(1)}" text-anchor="middle" style="fill:${g.barLabel}" font-size="${fs}">${seg.label}</text>` : nothing}`;
    })}
    ${timeTicks.map(({ t, label: lbl }) => {
      const a = tickAnchor(toX(t), lbl, fs, 0, W);
      return svg`
      <text x="${a.x.toFixed(1)}" y="${pTop + barH + 10}" text-anchor="${a.anchor}" style="fill:${g.tick}" font-size="${fs}">${lbl}</text>`;
    })}
    ${axes ? renderXTitle(field, pL + barW / 2, pTop + barH + 10 + fs + 1, g, fs) : nothing}
  </svg>`;

  return chartFrame(chart,
    showLegend ? legendRow(seen.map(stateLabel), (i) => seenColors[i]!, g, fs, pos === 'left' || pos === 'right') : nothing,
    pos);
}

function renderGraphField(
  field: FieldConfig,
  hass: HomeAssistant | undefined,
  virtuals: VirtualMap,
  stats: StatsMap,
  history: HistoryMap,
): TemplateResult {
  const series = field.graph_series ?? [];
  const type = field.graph_type ?? sd('graph_type') ?? 'bar';

  // A key is absent from the maps until that target's first fetch lands, so
  // this separates "the recorder returned nothing" from "we have not asked
  // yet" — which is the whole first second of a page load. The `entity` test
  // mirrors collectHistoryTargets/collectStatTargets: a series with no entity
  // picked yet never becomes a target, so nothing will ever land under its
  // key, and counting it as pending left a half-configured chart saying
  // "Loading…" forever instead of "No data".
  const historyPending = series.some((s, i) => !!s.entity && !history.has(`${field.id}:${i}`));
  // Whether this chart reads statistics at all is the field's Graph Data
  // window (#123): set, every series was fetched; unset, they are live state.
  const gs = resolveGraphStat(field);
  const windowed = gs.period != null;
  const statsPending = windowed && series.some((s, i) => !!s.entity && !stats.has(`${field.id}:${i}`));
  // Kept, commented, for the next time the graph data path needs watching
  // (#123): uncomment, deploy, set `mosaicDebug = true` and reload.
  // What this chart has to draw with, at the moment it draws — the other half
  // of the fetch trace in stats.ts. Which map it reads is decided by the graph
  // type, so an empty chart is either "nothing fetched" or "fetched into the
  // map I am not reading", and this says which.
  // if (mcDebug()) {
  //   const reads = type === 'stat-line' || type === 'stat-area' || type === 'line' || type === 'area' || type === 'state-timeline'
  //     ? 'history' : 'stats';
  //   mcLog(`render graph "${field.id}" (${type}) reads ${reads}:`
  //     + ` window=${gs.period ?? 'live state'} sample=${gs.sample} statType=${gs.statType}`
  //     + ` historyPending=${historyPending} statsPending=${statsPending}`
  //     + ` — ${series.map((s, i) => `${s.entity ?? '(no entity)'}:`
  //         + `${reads === 'history'
  //           ? `${history.has(`${field.id}:${i}`) ? `${(history.get(`${field.id}:${i}`) ?? []).length}pts` : 'not fetched'}`
  //           : `${stats.has(`${field.id}:${i}`) ? `${stats.get(`${field.id}:${i}`)?.value ?? 'null'}` : 'not fetched'}`}`).join(', ')}`);
  // }

  // The first series sets the unit and the decimal precision for the whole
  // chart — one axis can only carry one of each, and a mixed-unit chart is a
  // second-axis problem rather than a formatting one. Either can be overridden
  // on the field, which is also the only way to label a virtual series or an
  // attribute the recorder gives no unit for.
  const precision = field.graph_precision ?? seriesPrecision(series[0], hass);

  // Gauge types — single series, current value
  if (type === 'gauge-needle' || type === 'gauge') {
    const s0 = series[0];
    const value = s0 ? resolveSeriesValue(s0, field.id, 0, hass, virtuals, stats, windowed) : null;
    const unit = field.graph_unit ?? (s0 ? seriesUnit(s0, hass, stats, field.id, 0, windowed) : '');
    return type === 'gauge-needle'
      ? renderGaugeNeedle(field, value, unit, precision)
      : renderGaugeSegmented(field, value, unit, precision);
  }

  // Time-series types — use history map
  if (type === 'stat-line' || type === 'stat-area' || type === 'line' || type === 'area') {
    const allSeries = series.map((_, i) => history.get(`${field.id}:${i}`) ?? []);
    const labels = series.map((s) => seriesLabel(s, hass));
    const unit = field.graph_unit ?? (series.length > 0 ? seriesUnit(series[0]!, hass, stats, field.id, 0, windowed) : '');
    return renderTimeChart(field, allSeries, labels, type === 'area' || type === 'stat-area', unit, precision, historyPending);
  }

  if (type === 'state-timeline') {
    const pts = history.get(`${field.id}:0`) ?? [];
    return renderStateTimeline(field, pts, series[0] ? seriesLabel(series[0], hass) : '', historyPending);
  }

  // Bar types (default)
  const values = series.map((s, i) => resolveSeriesValue(s, field.id, i, hass, virtuals, stats, windowed));
  const labels = series.map((s) => seriesLabel(s, hass));
  const unit = field.graph_unit ?? (series.length > 0 ? seriesUnit(series[0]!, hass, stats, field.id, 0, windowed) : '');
  if (type === 'bar-stacked') return renderBarStacked(field, values, labels, unit, precision, statsPending);
  if (type === 'bar-h') return renderBarH(field, values, labels, unit, precision, statsPending);
  return renderBarV(field, values, labels, unit, precision, statsPending);
}

// ── Field renderer ────────────────────────────────────────────────────────────

/**
 * The numeric value behind a graphical field, or null when there isn't one.
 *
 * null means "no data" and is deliberately distinct from 0 (#73). Every failure
 * path here used to return 0, so an offline sensor rendered as a genuinely empty
 * tank, a flat battery, a gauge pinned to minimum — each drawn with full
 * confidence at a plausible-looking position, and indistinguishable from a real
 * zero. The text path already got this right (format.ts renders an em dash), so
 * the graphical path was the odd one out rather than merely austere.
 *
 * Note the isFinite check rather than `Number(raw) || 0`: that idiom collapsed a
 * real 0 and NaN into the same value, so honouring "no data" and honouring a
 * true zero are the same fix.
 */
function getRawValue(
  field: FieldConfig,
  hass: HomeAssistant | undefined,
  virtuals: VirtualMap,
  stats: StatsMap,
): number | null {
  if (!field.entity) return null;
  if (field.stat_period) return stats.get(field.id)?.value ?? null;
  if (field.entity.startsWith('virtual:')) return virtuals.get(field.entity)?.value ?? null;
  const stateObj = hass?.states[field.entity];
  if (!stateObj) return null;
  const raw = field.attribute ? stateObj.attributes?.[field.attribute] : stateObj.state;
  // Empty string and null are absent values, not zeroes — Number() maps both to 0.
  if (raw == null || raw === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Compose a field's icon around its text anchor (#105), the same geometry the
 * option cells use: `left`/`right` share the text's line, `above`/`below`
 * stack on the card's alignment.
 */
function composeIcon(
  icon: TemplateResult,
  content: TemplateResult,
  pos: string,
  align: Align,
  gap: number,
): TemplateResult {
  if (pos === 'above' || pos === 'below') {
    return html`<div style="display:flex;flex-direction:column;align-items:${alignToItems(align)};gap:${gap}px;">${pos === 'above' ? [icon, content] : [content, icon]}</div>`;
  }
  return html`<span style="display:inline-flex;align-items:center;gap:${gap}px;">${pos === 'left' ? [icon, content] : [content, icon]}</span>`;
}

/**
 * Normalise an icon-collection prefix to its bare form (#124). Stored without
 * the separator, but a user who types `wi:` should get `wi`, not `wi::weather`,
 * so the `:` is stripped here as well as on input.
 */
export function iconPrefix(field: FieldConfig): string {
  const p = (field.icon_prefix ?? '').replace(/:/g, '').trim();
  return p || 'mdi';
}

/**
 * The icon name an `icon` field derives from its entity's state, when
 * `icon_use_state` is on (#124). The state is slug-normalised — lowercased,
 * `_` and whitespace to `-` — because HA state casing is inconsistent
 * (`Not_Home`, `not_home`) while icon-set names are not. Returns undefined when
 * the option is off or there is no state to build from, so callers can fall
 * through to the picked icon.
 */
export function stateIcon(field: FieldConfig, state: string | undefined): string | undefined {
  if (!field.icon_use_state) return undefined;
  const slug = (state ?? '').trim().toLowerCase().replace(/[\s_]+/g, '-');
  return slug ? `${iconPrefix(field)}:${slug}` : undefined;
}

export function renderField(
  field: FieldConfig,
  card: CardConfig,
  defaults: GlobalDefaults | undefined,
  ctx: RenderContext,
): TemplateResult | typeof nothing {
  const { hass, virtuals, stats, history, onAction, onChange } = ctx;
  if (isControlField(field.type)) {
    const TAG = CONTROL_TAGS[field.type];
    if (!TAG) return html``;
    return staticHtml`<${TAG} .field=${field} .defaults=${defaults} .hass=${hass} .onChange=${onChange} .onAction=${onAction} .virtuals=${virtuals}></${TAG}>`;
  }
  if (field.type === 'blank') return html`<div style="height:${field.blank_gap ?? 10}px"></div>`;
  if (field.type === 'rule')  return html`<hr style="border:none;border-top:2px solid currentColor;width:80%;margin:0;opacity:0.4">`;
  if (field.type === 'graph') {
    const g = renderGraphField(field, hass, virtuals, stats, history);
    return field.extra_css ? html`<div style=${field.extra_css}>${g}</div>` : g;
  }
  if (field.type === 'embedded_card') {
    const w = field.width ?? 300;
    const el = staticHtml`<${EMBED_TAG}
      style="display:block;width:${w}px;"
      .cardConfig=${field.embed_card_config ?? {}}
      .hass=${hass}
      ?transparent=${field.embed_transparent ?? false}
    ></${EMBED_TAG}>`;
    return field.extra_css ? html`<div style=${field.extra_css}>${el}</div>` : el;
  }
  if (field.type === 'svg') {
    const m = field.margin;
    const marginCss = m != null
      ? field.dock === 'right' ? `margin-left:${m}px;`
      : field.dock === 'left'  ? `margin-right:${m}px;`
      : `margin-top:${m}px;margin-bottom:${m}px;`
      : '';
    // Reads an entity's state, or a named attribute of it when `attribute` is set.
    const readSub = (entityId: string | undefined, attribute: string | undefined): string | undefined => {
      if (!entityId || !hass) return undefined;
      const so = hass.states[entityId];
      if (!so) return undefined;
      const v = attribute ? so.attributes?.[attribute] : so.state;
      return v != null ? String(v) : undefined;
    };
    let tankFillPct: number | undefined;
    if (field.tank_pct_entity && hass) {
      const val = parseFloat(readSub(field.tank_pct_entity, field.tank_pct_attribute) ?? '');
      if (Number.isFinite(val)) tankFillPct = Math.max(0, Math.min(100, val));
    } else if (field.tank_volume_entity && hass) {
      const vol = parseFloat(readSub(field.tank_volume_entity, field.tank_volume_attribute) ?? '');
      const cap = field.tank_capacity_entity
        ? parseFloat(readSub(field.tank_capacity_entity, field.tank_capacity_attribute) ?? '')
        : field.tank_capacity;
      if (Number.isFinite(vol) && cap != null && Number.isFinite(cap) && cap > 0) {
        tankFillPct = Math.max(0, Math.min(100, (vol / cap) * 100));
      }
    }
    const isCharging = field.charging_entity
      ? readSub(field.charging_entity, field.charging_attribute) === 'on'
      : false;
    const fill = staticHtml`<${FILL_TAG}
      .field=${field}
      .defaults=${defaults}
      .rawValue=${getRawValue(field, hass, virtuals, stats)}
      .fillPct=${tankFillPct}
      .entityUnit=${(field.entity && !field.entity.startsWith('virtual:') && hass)
        ? ((hass.states[field.entity]?.attributes?.unit_of_measurement as string | undefined) ?? '')
        : ''}
    ></${FILL_TAG}>`;
    const h = field.height ?? 100;
    const inner = isCharging
      ? html`<div style="position:relative;display:inline-block;line-height:0;">${fill}<div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;font-size:${Math.round(h * 0.35)}px;pointer-events:none;text-shadow:0 0 4px rgba(0,0,0,0.8);">⚡</div></div>`
      : fill;
    return marginCss ? html`<div style=${marginCss}>${inner}</div>` : inner;
  }

  const ts = resolveText(field, card, defaults);
  const align: Align = field.align ?? card.align ?? 'left';

  // One binding covers tap, hold and double tap; before #74's follow-up this was
  // a bare @click that could only ever dispatch 'tap'.
  const fieldGesture = actionGesture(field, onAction);
  const cursorStyle = hasAnyAction(field) && onAction ? 'cursor:pointer;' : '';

  if (field.type === 'icon') {
    const size = ts.font_size ?? sd('icon_size') ?? 20;
    const color = ts.color ?? '';
    const iconStyle = `${cursorStyle}--mdc-icon-size:${size}px;${color ? `color:${color};` : ''}${field.extra_css ?? ''}`;
    // The Align row (#110): the icon rides the same full-width text-aligned
    // block a label's text does, so field.align places the glyph in its cell.
    // Unset falls back to the card's align — visually where the bare icon
    // already sat — so existing dashboards do not move. line-height:0 kills
    // the inline line-box gap the wrapper would otherwise add under the icon.
    const aligned = (icon: TemplateResult): TemplateResult =>
      html`<div style="width:100%;line-height:0;text-align:${align}">${icon}</div>`;
    // Entity-driven icon (#106). Precedence: a matching state rule, then the
    // picked icon, then the entity's own state-aware glyph — mirroring
    // background-by-state, where the fixed url is the floor under the rules.
    // bgValueMatches is shared with backgrounds so "matches" means one thing.
    // Visibility (#124): the same hide_below test the value path applies further
    // down, run here because the icon branch returns before ever reaching it.
    // Compared against the display value, so the threshold is entered in the
    // same unit a value field's would be.
    if (field.hide_below !== undefined && field.entity) {
      const n = parseFloat(formatFieldValue(hass, field, defaults, virtuals, stats).value);
      if (Number.isFinite(n) && Math.abs(n) < field.hide_below) return nothing;
    }
    if (field.entity && !field.entity.startsWith('virtual:')) {
      const so = hass?.states[field.entity];
      const raw = so ? (field.attribute ? so.attributes?.[field.attribute] : so.state) : undefined;
      const state = raw != null ? String(raw) : undefined;
      let matched: IconRule | undefined;
      for (const r of field.icon_rules ?? []) {
        if (r.value == null || r.value === '') continue;
        if (bgValueMatches(state, r.value)) { matched = r; break; }
      }
      // A matched rule with no icon means "no icon for this state" — the rule
      // claims the state and deliberately shows nothing, rather than falling
      // through to the picked icon or the entity's glyph.
      if (matched && !matched.icon) return nothing;
      // #124: an explicit rule still beats the state-derived name — the rule is
      // the user naming one state's glyph by hand, so it overrides the blanket
      // "state names the icon" mapping, which in turn sits where ha-state-icon
      // used to and keeps the picked icon as its floor.
      const resolved = matched?.icon ?? stateIcon(field, state) ?? field.icon;
      if (resolved) return aligned(html`<ha-icon icon=${resolved} style=${iconStyle} ${fieldGesture}></ha-icon>`);
      if (so) return aligned(html`<ha-state-icon .hass=${hass} .stateObj=${so} style=${iconStyle} ${fieldGesture}></ha-state-icon>`);
      // Entity not in hass yet: fall through to the static path below.
    }
    return aligned(html`<ha-icon
      icon=${field.icon ?? ''}
      style=${iconStyle}
      ${fieldGesture}
    ></ha-icon>`);
  }

  if (field.type === 'label') {
    const textSpan = html`<span
      class="ec-label"
      style="${cursorStyle}${textCss(ts)};text-align:${align}"
      ${fieldGesture}
      >${field.text ?? ''}</span
    >`;
    // Label icon (#105): exists only once picked — there is no entity to derive
    // one from — so absence is the off state and the editor never stores 'none'.
    if (!field.icon || field.icon_position === 'none') return textSpan;
    const iconSize = ts.font_size ?? sd('font_size') ?? 14;
    const icon = html`<ha-icon icon=${field.icon}
      style="${cursorStyle}--mdc-icon-size:${iconSize}px;${ts.color ? `color:${ts.color};` : ''}"
      ${actionGesture(field, onAction)}></ha-icon>`;
    const fg = card.field_gap ?? defaults?.field_gap ?? sd('field_gap') ?? 4;
    return composeIcon(icon, textSpan, field.icon_position ?? sd('icon_position') ?? 'left', align, fg);
  }

  // type === 'value'
  const { value, unit } = formatFieldValue(hass, field, defaults, virtuals, stats);
  let displayValue = value;

  // Compare hide_below against the display value (already converted to the global display unit,
  // e.g. global power_unit=W means the user enters W here, not the entity's native unit).
  if (field.hide_below !== undefined) {
    const displayNum = parseFloat(displayValue);
    if (Number.isFinite(displayNum) && Math.abs(displayNum) < field.hide_below) return nothing;
  }
  if (field.show_time_until_label && !field.time_until_layout?.length && field.entity?.startsWith('virtual:')) {
    const vLabel = virtuals.get(field.entity)?.label;
    if (vLabel) displayValue = `${vLabel}: ${value}`;
  }

  if (field.time_until_layout?.length && field.entity?.startsWith('virtual:')) {
    const tuVirtual = virtuals.get(field.entity);
    const tuLabel   = tuVirtual?.label ?? '';
    const labelTs   = resolveText({ ...field, type: 'label' } as FieldConfig, card, defaults);
    const fg        = card.field_gap ?? defaults?.field_gap ?? sd('field_gap') ?? 4;

    // Steady state (rate = 0 or at a boundary): show the trigger label, not the layout
    if (tuVirtual && tuVirtual.value < 0) {
      return html`<span class="ec-label" style="${textCss(labelTs)}">${tuLabel}</span>`;
    }

    const rows: TimeUntilLayoutItem[][] = [[]];
    for (const item of field.time_until_layout) {
      if (item.type === 'newline') rows.push([]);
      else rows[rows.length - 1].push(item);
    }
    const nonEmpty = rows.filter((r) => r.length > 0);

    const renderItem = (item: TimeUntilLayoutItem) => {
      if (item.type === 'text') return html`<span class="ec-label" style="${textCss(labelTs)}">${item.text ?? ''}</span>`;
      if (item.type === 'label') return html`<span class="ec-label" style="${textCss(labelTs)}">${tuLabel}</span>`;
      if (item.type === 'value') return html`<span class="ec-value" style="${cursorStyle}${textCss(ts)}" ${fieldGesture}>${displayValue}${unit ? html`<span class="ec-unit">${unit}</span>` : nothing}</span>`;
      return nothing;
    };

    const renderRow = (row: TimeUntilLayoutItem[]) =>
      html`<span style="display:inline-flex;align-items:baseline;gap:${fg}px;">${row.map(renderItem)}</span>`;

    if (nonEmpty.length === 1) return renderRow(nonEmpty[0]);
    return html`<div style="display:flex;flex-direction:column;align-items:${alignToItems(align)};gap:${fg}px;">${nonEmpty.map(renderRow)}</div>`;
  }

  const valueSpan = html`<span
    class="ec-value"
    style="${cursorStyle}${textCss(ts)};text-align:${align}"
    ${fieldGesture}
    >${displayValue}${unit ? html`<span class="ec-unit">${unit}</span>` : nothing}</span
  >`;

  // Value icon (#105): opt-in via icon_position — unset resolves to 'none' so
  // existing dashboards render byte-identical, and the seed tier is deliberately
  // absent from this chain for the same reason. The glyph is the entity's own,
  // via ha-state-icon (attributes.icon misses the icons HA computes from
  // domain/device_class/state), with a picked `icon` overriding it. Virtuals
  // have no state object, so they only ever show an override.
  const iconPos = field.icon_position ?? 'none';
  let valueBody: TemplateResult = valueSpan;
  if (iconPos !== 'none') {
    const iconSize = ts.font_size ?? sd('font_size') ?? 14;
    const iconCss = `${cursorStyle}--mdc-icon-size:${iconSize}px;${ts.color ? `color:${ts.color};` : ''}`;
    const so = field.entity && !field.entity.startsWith('virtual:') ? hass?.states[field.entity] : undefined;
    const icon = field.icon
      ? html`<ha-icon icon=${field.icon} style=${iconCss} ${actionGesture(field, onAction)}></ha-icon>`
      : so
        ? html`<ha-state-icon .hass=${hass} .stateObj=${so} style=${iconCss} ${actionGesture(field, onAction)}></ha-state-icon>`
        : undefined;
    if (icon) {
      const fg = card.field_gap ?? defaults?.field_gap ?? sd('field_gap') ?? 4;
      valueBody = composeIcon(icon, valueSpan, iconPos, align, fg);
    }
  }

  if (field.label) {
    const labelTs = resolveText({ ...field, type: 'label' } as FieldConfig, card, defaults);
    const fg = card.field_gap ?? defaults?.field_gap ?? sd('field_gap') ?? 4;
    const pos = field.label_position ?? sd('label_position') ?? 'above';
    const isRow = pos === 'left' || pos === 'right';
    const flexDir = isRow ? 'row' : 'column';
    const alignItems = isRow ? 'baseline' : alignToItems(align);
    const labelSpan = html`<span class="ec-label" style="${textCss(labelTs)};text-align:${align}">${field.label}</span>`;
    const parts = (pos === 'below' || pos === 'right') ? [valueBody, labelSpan] : [labelSpan, valueBody];
    return html`<div style="display:flex;flex-direction:${flexDir};align-items:${alignItems};gap:${fg}px;">${parts}</div>`;
  }

  return valueBody;
}

// ── Shared field layout ───────────────────────────────────────────────────────

/**
 * The column, span, dock and alignment layout, shared by Mosaic cards and
 * popovers so the two cannot drift apart.
 *
 * They used to be two independent implementations, and every difference between
 * them was an accident rather than a decision: a popover's columns ignored
 * `align` entirely (they were left at `stretch`, so a control could not be
 * centred), split the card evenly instead of sizing to content, spaced
 * themselves by `field_gap` while the **Column gap** row sat there doing
 * nothing, kept empty columns, and supported neither `column_end` spans nor
 * docked fields — while `label_column` existed only on the popover side.
 *
 * The two surfaces still differ, deliberately, in the three ways they always
 * did: a popover has its own width control, it opens over the dashboard, and it
 * has no background image. None of those live here.
 *
 * Returns the card's inner content only. Callers own the outer element — its
 * box style, and for a Mosaic card the background-image grid — because that is
 * exactly where the two are allowed to differ.
 */
function layoutFields(
  fields: FieldConfig[],
  opts: {
    align: Align;
    columns: number;
    /** Vertical gap between fields in a column. */
    gap: number;
    /** Horizontal gap between columns, and between a dock and the content. */
    colGap: number;
    /**
     * Set to switch from flow placement to fixed cells (#102). `columns` above
     * still gives the column count; this adds the rows and their gap.
     */
    grid?: { rows: number; rowGap: number };
    renderOne: (f: FieldConfig) => TemplateResult | typeof nothing;
  },
): TemplateResult {
  const { align, columns, gap, colGap, grid, renderOne } = opts;
  const items = alignToItems(align);

  // A value field carrying `label_column` becomes two cells — the label pinned
  // to that column, the value to its own. The half-index keeps the label ahead
  // of its value once buckets are sorted back into field order.
  type Cell = { f: FieldConfig; i: number };
  const cells: Cell[] = [];
  fields.forEach((f, i) => {
    if (f.type === 'value' && f.label && f.label_column != null) {
      // The spans belong to the value, not to its label. Carrying `column_end`
      // through pinned the label to its own column and then stretched it across
      // the value's — which in grid mode lands the two on top of each other, and
      // in flow mode promoted the label into a full-width span segment of its own.
      cells.push({ f: { ...f, type: 'label', text: f.label, column: f.label_column, column_end: undefined, row_end: undefined }, i: i - 0.5 });
      cells.push({ f: { ...f, label: undefined }, i });
    } else {
      cells.push({ f, i });
    }
  });

  const left    = cells.filter((x) => x.f.dock === 'left');
  const right   = cells.filter((x) => x.f.dock === 'right');
  const content = cells.filter((x) => !x.f.dock);

  // Segment at each spanning field. Non-spanning fields between spans form
  // independent column-bucket rows, which keeps column heights decoupled;
  // spanning fields are full-width breaks between those rows, so there is no
  // CSS grid row-track coupling anywhere.
  const segments: Array<{ kind: 'group'; cells: Cell[] } | { kind: 'span'; f: FieldConfig }> = [];
  let grpBuf: Cell[] = [];
  for (const x of content) {
    if (x.f.column != null && x.f.column_end != null && x.f.column_end > x.f.column) {
      if (grpBuf.length) { segments.push({ kind: 'group', cells: grpBuf }); grpBuf = []; }
      segments.push({ kind: 'span', f: x.f });
    } else {
      grpBuf.push(x);
    }
  }
  if (grpBuf.length) segments.push({ kind: 'group', cells: grpBuf });

  // Columns size to their content rather than splitting the card evenly, so
  // `align` has something to move. The card's align places every box; a field's
  // own `align` is text-only, including on a spanning field.
  const colStyle = `display:flex;flex-direction:column;gap:${gap}px;align-items:${items}`;

  const colBucketRow = (group: Cell[]) => {
    const unpin = group.filter((x) => x.f.column == null);
    const pin   = group.filter((x) => x.f.column != null);
    const perC  = Math.ceil(unpin.length / columns) || 1;
    const bkts: Cell[][] = Array.from({ length: columns }, () => []);
    unpin.forEach((x, i) => { bkts[Math.min(columns - 1, Math.floor(i / perC))].push(x); });
    pin.forEach((x) => { bkts[Math.max(0, Math.min(columns - 1, x.f.column! - 1))].push(x); });
    // Pinned cells are appended after the unpinned ones, so sort each bucket
    // back into field order — otherwise a pinned field always sinks to the
    // bottom of its column regardless of where it sits in the field list.
    bkts.forEach((b) => b.sort((a, c) => a.i - c.i));
    return html`<div style="display:flex;flex-direction:row;gap:${colGap}px;align-items:flex-start;justify-content:${items}">
      ${bkts.map((b) => b.length
        ? html`<div style=${colStyle}>${b.map((x) => renderOne(x.f))}</div>`
        : nothing)}
    </div>`;
  };

  // Fixed cells (#102). This is a separate branch rather than a variation of the
  // flow path above precisely because it wants the CSS grid row-track coupling
  // that path goes out of its way to avoid: here a field's row is a property of
  // the card, not of whatever happens to sit beside it.
  //
  // Both track lists are fractions, so no width or height is ever computed here.
  // The rows divide whatever height the card's box gives the grid, which keeps
  // padding, borders and docked fields out of this function entirely.
  const gridBody = () => {
    const area = (f: FieldConfig) => {
      const c  = f.column != null && f.column > 0 ? Math.floor(f.column) : null;
      const ce = c != null && f.column_end != null && f.column_end > c ? Math.floor(f.column_end) : null;
      const r  = f.row != null && f.row > 0 ? Math.floor(f.row) : null;
      const re = r != null && f.row_end != null && f.row_end > r ? Math.floor(f.row_end) : null;
      // A field with no row and no column is left to the grid's own
      // auto-placement, which drops it in the first free cell.
      return `${c != null ? `grid-column:${c}/${(ce ?? c) + 1};` : ''}${r != null ? `grid-row:${r}/${(re ?? r) + 1};` : ''}`;
    };
    // Vertically centred always. Horizontally, the field's own box stretches
    // to fill the whole cell — spanned or not — so a field's `align` (falling
    // back to the card's) governs alignment across the full cell width, the
    // same as it does for an icon's glyph since #110.
    const cell = `display:flex;align-items:center;min-width:0;`;
    return html`<div style="display:grid;height:100%;grid-template-columns:repeat(${columns},1fr);grid-template-rows:repeat(${grid!.rows},1fr);column-gap:${colGap}px;row-gap:${grid!.rowGap}px">
      ${content.map((x) => html`<div style="${cell}${area(x.f)}"><div style="width:100%;text-align:${x.f.align ?? align}">${renderOne(x.f)}</div></div>`)}
    </div>`;
  };

  const body = grid ? gridBody() : html`<div style="display:flex;flex-direction:column;gap:${gap}px">
    ${segments.map((seg) => seg.kind === 'span'
      ? html`<div style="display:flex;flex-direction:column;align-items:${items}">${renderOne(seg.f)}</div>`
      : colBucketRow(seg.cells))}
  </div>`;

  if (!left.length && !right.length) return body;

  const dockStyle = `display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0`;
  // Grid mode stretches the row instead of centring it, so the grid still has a
  // definite height to divide; the docks centre themselves within it either way.
  return html`<div style="display:flex;flex-direction:row;gap:${colGap}px;align-items:${grid ? 'stretch' : 'center'}">
    ${left.length ? html`<div style=${dockStyle}>${left.map((x) => renderOne(x.f))}</div>` : nothing}
    ${content.length ? html`<div style="flex:1;min-width:0${grid ? ';min-height:0' : ''}">${body}</div>` : nothing}
    ${right.length ? html`<div style=${dockStyle}>${right.map((x) => renderOne(x.f))}</div>` : nothing}
  </div>`;
}

// ── Extended card renderer ────────────────────────────────────────────────────

/**
 * Render an extended card (popup panel) in its natural size.
 * The caller wraps this in a sized panel overlay; this function only produces
 * the card content with box styling, a title bar, and a multi-column field grid.
 */
export function renderExtendedCard(
  extCard: ExtendedCardConfig,
  extDefaults: ExtendedCardDefaults | undefined,
  globalDefaults: GlobalDefaults | undefined,
  ctx: RenderContext,
): TemplateResult {
  // #89: deliberately does NOT start from globalDefaults.card. That is the
  // Mosaic card's box, and inheriting it here entangled the two surfaces —
  // restyling canvas cards silently restyled every popover, with nothing in the
  // editor saying so. A popover's chain is its own: Popover Card Defaults →
  // this card's Card Style → the seed floor inside boxCss().
  const box: BoxStyle = { ...extDefaults?.card, ...extCard.box };
  box.extra_css = cascadeCss(extDefaults?.card?.extra_css, extCard.box?.extra_css) || undefined;
  const columns = extCard.columns ?? extDefaults?.columns ?? sd('columns') ?? 2;
  // #102: no `globalDefaults` step in either chain any more. A popover's spacing
  // is its own — card, then Popover Card Defaults, then the popover's own seed —
  // rather than falling through to a pair of keys the Mosaic card also used and
  // whose editor rows now sit on the Mosaic screen.
  const gap = extCard.field_gap ?? extDefaults?.field_gap ?? sd('extended_field_gap') ?? 8;
  // Column gap is its own setting here as it is on a Mosaic card. The popover
  // used to space its columns by `gap` (the *field* gap), which left the editor's
  // Column gap row with nothing to do.
  const colGap = extCard.column_gap ?? extDefaults?.column_gap ?? sd('column_gap') ?? 3;
  const align: Align = extCard.align ?? sd('align') ?? 'left';

  // Merge defaults so renderField gets the full cascade: global → ext section → per-card
  const mergedDefaults: GlobalDefaults = {
    ...globalDefaults,
    label: { ...globalDefaults?.label, ...extDefaults?.label, extra_css: cascadeCss(globalDefaults?.label?.extra_css, extDefaults?.label?.extra_css) || undefined },
    value: { ...globalDefaults?.value, ...extDefaults?.value, extra_css: cascadeCss(globalDefaults?.value?.extra_css, extDefaults?.value?.extra_css) || undefined },
    field_gap:  gap,
    column_gap: colGap,
  };

  // Stub CardConfig so renderField can resolve text styles and alignment
  const cardLike: CardConfig = {
    id: extCard.id,
    position: { x: 0, y: 0 },
    fields: [],
    label_style: extCard.label_style,
    value_style: extCard.value_style,
    align,
  };

  // No `grid` here, and that is the one deliberate gap in the parity rule (#102).
  // Grid placement divides a fixed height, and a popover has none to divide: it
  // opens over the dashboard at its natural height, where a Mosaic card has a
  // box on the canvas that the author has sized. `layoutFields` supports the mode
  // for both — nothing is forked — so surfacing it here is a config question
  // (`ExtendedCardConfig` would need a height), not a layout one.
  return html`
    <div class="ec-ext-card" style="${boxCss(box)}">
      ${extCard.name ? html`<div class="ec-ext-title">${extCard.name}</div>` : nothing}
      <div class="ec-ext-grid">
        ${layoutFields(extCard.fields, {
          align, columns, gap, colGap,
          renderOne: (f) => renderField(f, cardLike, mergedDefaults, ctx),
        })}
      </div>
    </div>
  `;
}

// ── Zone renderer ─────────────────────────────────────────────────────────────

export function renderZones(
  zones: ZoneConfig[] | undefined,
  onAction?: ActionCallback,
): TemplateResult {
  if (!zones?.length) return html``;
  return html`${zones.map((z) => {
    const translate = ANCHOR_TRANSLATE[z.anchor ?? 'top-left'];
    const style = [
      'position:absolute',
      `left:${z.position.x * 100}%`,
      `top:${z.position.y * 100}%`,
      `width:${z.width}px`,
      `height:${z.height}px`,
      `transform:${translate}`,
      z.color ? `background:${z.color}` : '',
      z.radius ? `border-radius:${z.radius}px` : '',
      (z.tap_action || z.hold_action || z.double_tap_action) ? 'cursor:pointer' : '',
      'box-sizing:border-box',
    ].filter(Boolean).join(';');
    // The cursor above promises all three gestures; before the gesture engine
    // only tap was ever dispatched, so a hold-only zone advertised itself as
    // clickable and did nothing.
    return html`<div
      class="ec-zone"
      data-zone-id="${z.id}"
      style=${style}
      ${actionGesture(z, onAction)}
    ></div>`;
  })}`;
}

// ── Card renderer ─────────────────────────────────────────────────────────────

export function renderCard(
  card: CardConfig,
  defaults: GlobalDefaults | undefined,
  ctx: RenderContext,
  panelMode = false,
  ignoreVisibility = false,
): TemplateResult {
  const { hass, virtuals, onAction } = ctx;
  if (!ignoreVisibility && card.visible_when && !evaluateVisibility(card.visible_when, hass, virtuals)) {
    return html``;
  }

  const cardTap = hasAnyAction(card);
  const cardGesture = !panelMode ? actionGesture(card, onAction) : nothing;

  const box = resolveCardBox(card, defaults);
  // Since #102 the Mosaic card has gaps of its own rather than sharing a pair
  // with the popover. The old keys stay at the end of each chain as the
  // compatibility floor for a config written before the split.
  const gap    = card.field_gap ?? defaults?.card_field_gap ?? sd('card_field_gap')
    ?? defaults?.field_gap ?? sd('field_gap') ?? 4;
  const colGap = card.column_gap ?? defaults?.card_column_gap ?? sd('card_column_gap')
    ?? defaults?.column_gap ?? sd('column_gap') ?? 3;
  const align: Align = (card.align ?? sd('align') ?? 'left') as Align;

  // Fixed-cell placement (#102). `grid.columns` is deliberately not `card.columns`
  // — keeping the two counts apart is what makes switching modes reversible, so a
  // card that goes to grid and back still has the flow layout it was drawn with.
  const gridMode = cardLayoutMode(card, defaults) === 'grid';
  const columns = gridMode
    ? (card.grid?.columns ?? defaults?.card_grid_columns ?? sd('card_grid_columns') ?? 4)
    : (card.columns ?? defaults?.card_columns ?? sd('card_columns') ?? 1);
  const cardGrid = gridMode
    ? {
        rows: card.grid?.rows ?? defaults?.card_grid_rows ?? sd('card_grid_rows') ?? 4,
        // One gap value themes the whole card until the author says otherwise —
        // hence the fall through to the resolved field gap at the end.
        rowGap: card.grid?.row_gap ?? defaults?.card_grid_row_gap ?? sd('card_grid_row_gap') ?? gap,
      }
    : undefined;

  // A height is what the rows divide up, so grid mode takes it literally. Flow
  // mode treats it as a floor instead — a card on a grid canvas gets a height
  // derived from `grid_row_span` whether or not its fields are in grid mode, and
  // that must never start clipping a card that outgrows it.
  const sizeStyle = card.height != null
    ? `${gridMode ? 'height' : 'min-height'}:${card.height}px`
    : '';

  // Resolved once: a card's background may be state-driven (bg.entity + bg.rules),
  // and the grid wrapper below has to agree with the bg div about whether there
  // is an image at all.
  const bgUrl = resolveCardBgUrl(card.bg, hass, ctx.mediaUrls);
  const hasBg = !!bgUrl;
  const baseStyle = panelMode
    ? ['position:relative', card.width != null ? `width:${card.width}px` : '', sizeStyle, 'box-sizing:border-box', card.transparent ? '' : boxCss(box)].filter(Boolean).join(';')
    : ['position:absolute', `left:${card.position.x * 100}%`, `top:${card.position.y * 100}%`, `transform:${ANCHOR_TRANSLATE[(card.anchor ?? sd('anchor') ?? 'top-left') as Anchor]}`, card.width != null ? `width:${card.width}px` : '', sizeStyle, 'box-sizing:border-box', card.transparent ? '' : boxCss(box), cardTap ? 'cursor:pointer' : ''].filter(Boolean).join(';');

  // When bg is present the card becomes a grid container so the bg div shares the same grid area
  // as the content wrapper — the grid cell is sized by the content, giving the bg div a real height.
  const bgEl = (() => {
    if (!bgUrl || !card.bg) return nothing;
    const bg = card.bg;
    const pt = bg.padding_top ?? 0;
    const pr = bg.padding_right ?? 0;
    const pb = bg.padding_bottom ?? 0;
    const pl = bg.padding_left ?? 0;
    const fit = bg.fit ?? 'cover';
    const opacity = bg.opacity ?? 1;
    if (bg.width != null || bg.height != null) {
      const w = bg.width  != null ? `width:${bg.width}px`   : '';
      const h = bg.height != null ? `height:${bg.height}px` : '';
      return html`<div style="grid-area:1/1;${w};${h};margin-top:${pt}px;margin-left:${pl}px;justify-self:start;align-self:start;background-image:url('${bgUrl}');background-size:${fit};background-position:center;background-repeat:no-repeat;opacity:${opacity};pointer-events:none"></div>`;
    }
    return html`<div style="grid-area:1/1;padding:${pt}px ${pr}px ${pb}px ${pl}px;background-image:url('${bgUrl}');background-size:${fit};background-position:center;background-repeat:no-repeat;background-origin:content-box;background-clip:content-box;opacity:${opacity};pointer-events:none"></div>`;
  })();

  // renderField reads the gap from `defaults` for a field's own internals (label
  // to value, the lines of a time-until layout). Handing it the already-resolved
  // number is what keeps those in step with the card's gap now that the Mosaic
  // key is a different one — the same thing renderExtendedCard does for popovers.
  const fieldDefaults: GlobalDefaults = { ...defaults, field_gap: gap, column_gap: colGap };

  const body = layoutFields(card.fields, {
    align, columns, gap, colGap, grid: cardGrid,
    renderOne: (f) => renderField(f, card, fieldDefaults, ctx),
  });

  // The background image is the one part of a card's layout a popover has no
  // equivalent for, so it stays here rather than in `layoutFields`: the card
  // becomes a grid container and the image shares a single grid area with the
  // content, which is what gives the image a real height to fill.
  if (hasBg) {
    return html`<div class="ec-card" data-card-id="${card.id}" style="${baseStyle};display:grid;overflow:hidden" ${cardGesture}>
      ${bgEl}
      <div style="grid-area:1/1">${body}</div>
    </div>`;
  }
  return html`<div class="ec-card" data-card-id="${card.id}" style="${baseStyle}" ${cardGesture}>${body}</div>`;
}

/**
 * Emit the card-wide chrome seed values as custom properties on the host.
 *
 * A seed default cannot reach `viewCss` directly — that is a `static styles`
 * template, evaluated once, while seeds are resolved in TS at render time
 * (STYLING.md §5). Writing them onto the host is the documented way across,
 * and is the same mechanism `--mccust_*` and `--mc-scale` already use.
 *
 * Only resolved values are written, so the `var(…, <literal>)` fallbacks in
 * `viewCss` stay meaningful: if defaults.json fails to load, `sd()` returns
 * undefined, nothing is emitted, and the CSS floor renders the shipped look.
 */
/**
 * Popup dimming presets.
 *
 * Phase 6 surfaced the six scrim and close-button colours as individual pickers.
 * That was the wrong altitude — "scrim" is our word, not a user's, and nobody
 * restyling a dashboard wants four separate close-button colours. The keys stay:
 * they are the plumbing, `cardChromeVars` still reads them and YAML still reaches
 * them. What changed is that the editor offers named looks and writes the set.
 *
 * `medium` reproduces the shipped seed values exactly, so choosing it is a no-op
 * for an existing card. The close-button colours track the dim level rather than
 * staying fixed — a heavier scrim wants heavier chrome on the panel corner.
 */
export type PopupDimming = 'none' | 'light' | 'medium' | 'heavy';

export const POPUP_DIMMING_KEYS = [
  'overlay_scrim_color',
  'extended_scrim_color',
  'close_button_bg',
  'close_button_hover_bg',
  'close_button_text_color',
  'close_button_border_color',
] as const;

/**
 * The two surfaces' shares of the dimming keys (#89). Each editor screen sets
 * and matches only its own, so an expanded Mosaic card and a popover can be
 * dimmed differently instead of moving together.
 *
 * The close-button colours sit with the Mosaic screen rather than being split
 * or duplicated: one CSS rule styles both overlays' close buttons (see
 * `.ec-expand-close, .ec-ext-close` below), so there is one thing to set and
 * four new keys would buy nothing.
 */
export const MOSAIC_DIMMING_KEYS = [
  'overlay_scrim_color',
  'close_button_bg',
  'close_button_hover_bg',
  'close_button_text_color',
  'close_button_border_color',
] as const;

export const POPOVER_DIMMING_KEYS = ['extended_scrim_color'] as const;

type PopupDimmingValues = Pick<GlobalDefaults, (typeof POPUP_DIMMING_KEYS)[number]>;

export const POPUP_DIMMING: Record<PopupDimming, { label: string; hint: string; values: PopupDimmingValues }> = {
  none: {
    label: 'None',
    hint: 'The dashboard behind stays fully visible',
    values: {
      overlay_scrim_color: 'rgba(0,0,0,0)',
      extended_scrim_color: 'rgba(0,0,0,0)',
      close_button_bg: 'rgba(0,0,0,0.5)',
      close_button_hover_bg: 'rgba(0,0,0,0.75)',
      close_button_text_color: '#ffffff',
      close_button_border_color: 'rgba(255,255,255,0.3)',
    },
  },
  light: {
    label: 'Light',
    hint: 'Barely dimmed',
    values: {
      overlay_scrim_color: 'rgba(0,0,0,0.3)',
      extended_scrim_color: 'rgba(0,0,0,0.45)',
      close_button_bg: 'rgba(0,0,0,0.35)',
      close_button_hover_bg: 'rgba(0,0,0,0.55)',
      close_button_text_color: '#ffffff',
      close_button_border_color: 'rgba(255,255,255,0.25)',
    },
  },
  medium: {
    label: 'Medium',
    hint: 'The shipped look',
    values: {
      overlay_scrim_color: 'rgba(0,0,0,0.55)',
      extended_scrim_color: 'rgba(0,0,0,0.75)',
      close_button_bg: 'rgba(0,0,0,0.5)',
      close_button_hover_bg: 'rgba(0,0,0,0.75)',
      close_button_text_color: '#ffffff',
      close_button_border_color: 'rgba(255,255,255,0.3)',
    },
  },
  heavy: {
    label: 'Heavy',
    hint: 'Nearly blacks out everything behind',
    values: {
      overlay_scrim_color: 'rgba(0,0,0,0.8)',
      extended_scrim_color: 'rgba(0,0,0,0.92)',
      close_button_bg: 'rgba(0,0,0,0.65)',
      close_button_hover_bg: 'rgba(0,0,0,0.85)',
      close_button_text_color: '#ffffff',
      close_button_border_color: 'rgba(255,255,255,0.35)',
    },
  },
};

/**
 * Which preset the current config is showing, or `undefined` for a hand-tuned
 * set the presets don't describe.
 *
 * It compares *effective* values — config over seed — so a deployer who retunes
 * the scrims in `defaults.json` gets "Custom" rather than a preset name that
 * lies about what is rendering. The editor offers Custom as a read-only entry so
 * that opening the panel can never silently overwrite such a config.
 */
export function matchPopupDimming(
  defaults?: GlobalDefaults,
  keys: readonly (typeof POPUP_DIMMING_KEYS)[number][] = POPUP_DIMMING_KEYS,
): PopupDimming | undefined {
  const effective = (k: (typeof POPUP_DIMMING_KEYS)[number]): string | undefined =>
    defaults?.[k] ?? sd(k);
  return (Object.keys(POPUP_DIMMING) as PopupDimming[]).find((name) =>
    keys.every((k) => effective(k) === POPUP_DIMMING[name].values[k]));
}

/**
 * The border-radius an overlay panel should clip at: whatever the card it is
 * showing rounds itself to (#89).
 *
 * Same resolution `boxCss` uses for the card, so the clip and the card's own
 * corner are one number by construction rather than two settings kept in sync
 * by hand. Pass the box tiers most-specific first.
 */
export function overlayPanelRadius(...tiers: (BoxStyle | undefined)[]): number {
  for (const t of tiers) if (t?.radius != null) return t.radius;
  return sd('box_radius') ?? 0;
}

export function cardChromeVars(defaults?: GlobalDefaults): string {
  const pick = <K extends keyof SeedDefaults>(
    own: string | number | undefined,
    key: K,
  ): string | number | undefined => own ?? (sd(key) as string | number | undefined);
  const out: [string, string | number | undefined][] = [
    ['--mc-card-text', pick(defaults?.card_text_color, 'card_text_color')],
    ['--mc-overlay-scrim', pick(defaults?.overlay_scrim_color, 'overlay_scrim_color')],
    ['--mc-extended-scrim', pick(defaults?.extended_scrim_color, 'extended_scrim_color')],
    ['--mc-close-bg', pick(defaults?.close_button_bg, 'close_button_bg')],
    ['--mc-close-hover-bg', pick(defaults?.close_button_hover_bg, 'close_button_hover_bg')],
    ['--mc-close-text', pick(defaults?.close_button_text_color, 'close_button_text_color')],
    ['--mc-close-border', pick(defaults?.close_button_border_color, 'close_button_border_color')],
  ];
  // No overlay radius here any more (#89). An overlay panel has no background
  // of its own — its border-radius only clips the card inside, which already
  // rounds itself — so a global radius was a second control for one visible
  // corner, and the two disagreeing meant the clip cut the card's rounding.
  // Each overlay now takes the radius of the card it is actually showing; see
  // `overlayPanelRadius`.
  return out
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}:${String(v)};`)
    .join('');
}

/**
 * The user's `--mccust_*` registry — both lists, in one namespace.
 *
 * `custom_colors` and `custom_vars` (#74 Phase 7) share the `--mccust_` prefix
 * deliberately: one prefix for a user to learn, and a value can move between the
 * lists without breaking references to it. The cost is that a name in both would
 * collide, which the editor prevents by validating uniqueness across the pair.
 *
 * Colours are emitted first, so if a duplicate ever reaches the runtime — a
 * hand-edited YAML, or a config written before the validation existed — the
 * colour is the one that loses, and the picker showing an unexpected swatch makes
 * the clash visible rather than leaving it to be found in a stylesheet.
 *
 * Shared by the runtime card and the editor host so the two can never disagree
 * about what a name resolves to.
 */
export function customVarStyles(defaults?: GlobalDefaults): [string, string][] {
  const out: [string, string][] = [];
  for (const c of defaults?.custom_colors ?? []) if (c.name) out.push([`--mccust_${c.name}`, c.color]);
  for (const v of defaults?.custom_vars ?? []) if (v.name) out.push([`--mccust_${v.name}`, v.value]);
  return out;
}

/** `customVarStyles` as an inline-style fragment, for the runtime card's host. */
export function customVarCss(defaults?: GlobalDefaults): string {
  return customVarStyles(defaults).map(([k, v]) => `${k}:${v};`).join('');
}

// ── Shared CSS ────────────────────────────────────────────────────────────────

export const viewCss = css`
  .ec-card {
    /* Fixed, not configurable: the card sits over an unknown photo and this
       shadow is what keeps text legible on it (STYLING.md §8). The Phase 6 key
       that exposed it took a raw CSS text-shadow string — the wrong altitude for
       a setting nobody should have to reason about. extra_css still reaches it. */
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
    color: var(--mc-card-text, #fff);
    white-space: nowrap;
    line-height: 1.15;
  }
  .ec-label {
    display: block;
  }
  .ec-value {
    display: block;
  }
  .ec-unit {
    font-size: 0.7em;
    opacity: 0.85;
    margin-left: 0.15em;
  }

  /* ── Expand overlay ── */
  .ec-expand-backdrop {
    position: fixed;
    inset: 0;
    z-index: 999;
    background: var(--mc-overlay-scrim, rgba(0, 0, 0, 0.55));
    display: flex;
    align-items: center;
    justify-content: center;
  }
  /* border-radius is set inline per overlay — see overlayPanelRadius (#89). */
  .ec-expand-panel {
    position: relative;
    width: 80%;
    height: 80%;
    overflow: auto;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ec-expand-card-wrap {
    flex-shrink: 0;
    transform-origin: center center;
    transition: transform 0.15s ease-out;
  }
  /* Both overlays' close buttons. These were two byte-identical rule sets
     until #74 Phase 6; one rule now serves both so the close_button_* keys
     cannot drift apart between the expand overlay and the popover overlay. */
  .ec-expand-close,
  .ec-ext-close {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 2;
    background: var(--mc-close-bg, rgba(0, 0, 0, 0.5));
    color: var(--mc-close-text, #fff);
    border: 1px solid var(--mc-close-border, rgba(255, 255, 255, 0.3));
    border-radius: 4px;
    padding: 4px 10px;
    cursor: pointer;
    font-size: 13px;
    line-height: 1.4;
  }


  /* ── Extended card overlay ── */
  .ec-extended-backdrop {
    position: absolute;
    inset: 0;
    z-index: 51;
    background: var(--mc-extended-scrim, rgba(0, 0, 0, 0.75));
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ec-extended-panel {
    position: relative;
    overflow: auto;
    max-height: 85%;
  }
  .ec-ext-card {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
    color: var(--mc-card-text, #fff);
    line-height: 1.15;
    box-sizing: border-box;
  }
  .ec-ext-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--mc-card-text, #fff);
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  }
  .ec-expand-close:hover,
  .ec-ext-close:hover {
    background: var(--mc-close-hover-bg, rgba(0, 0, 0, 0.75));
  }
`;

// ── Flow helpers ──────────────────────────────────────────────────────────────

/** Resolve a FlowEndpoint to an absolute {x, y} in design-px. */
export function resolveFlowPoint(
  ep: FlowEndpoint,
  cards: CardConfig[],
  boxes?: Record<string, CardBox>,
): { x: number; y: number } {
  let base: { x: number; y: number };
  if (ep.card !== undefined) {
    const box = boxes?.[ep.card];
    if (box !== undefined && ep.side !== undefined) {
      // Use the live measured box + requested side.
      base = sidePoint(box, ep.side);
    } else {
      // Fall back to the card's declared position (pre-measure or no side).
      const found = cards.find((c) => c.id === ep.card);
      base = found ? { x: found.position.x, y: found.position.y } : { x: 0, y: 0 };
    }
  } else {
    base = { x: ep.x ?? 0, y: ep.y ?? 0 };
  }
  return { x: base.x + (ep.dx ?? 0), y: base.y + (ep.dy ?? 0) };
}

/** Build an SVG path `d` string from resolved points. */
export function buildFlowD(
  pts: { x: number; y: number }[],
  curve: 'straight' | 'rounded',
): string {
  if (pts.length < 2) return '';

  if (curve === 'straight') {
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }

  // Rounded: trim ~12px from each side of interior nodes and use a quadratic.
  const TRIM = 12;
  const parts: string[] = [`M ${pts[0].x} ${pts[0].y}`];

  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const next = pts[i + 1];

    const dxIn = curr.x - prev.x;
    const dyIn = curr.y - prev.y;
    const lenIn = Math.sqrt(dxIn * dxIn + dyIn * dyIn);

    const dxOut = next.x - curr.x;
    const dyOut = next.y - curr.y;
    const lenOut = Math.sqrt(dxOut * dxOut + dyOut * dyOut);

    if (lenIn < TRIM * 2 || lenOut < TRIM * 2) {
      // Segment too short — straight line to the node.
      parts.push(`L ${curr.x} ${curr.y}`);
    } else {
      const t = TRIM / lenIn;
      const inX = curr.x - dxIn * t;
      const inY = curr.y - dyIn * t;

      const u = TRIM / lenOut;
      const outX = curr.x + dxOut * u;
      const outY = curr.y + dyOut * u;

      parts.push(`L ${inX.toFixed(2)} ${inY.toFixed(2)}`);
      parts.push(`Q ${curr.x} ${curr.y} ${outX.toFixed(2)} ${outY.toFixed(2)}`);
    }
  }

  const last = pts[pts.length - 1];
  parts.push(`L ${last.x} ${last.y}`);
  return parts.join(' ');
}

/** Map a flow's bound entity to animation duration + direction + visibility. */
function flowAnimState(
  flow: FlowConfig,
  hass: HomeAssistant | undefined,
  defaults: GlobalDefaults | undefined,
): { duration: number; reverse: boolean; hidden: boolean } {
  const base = flow.duration ?? sd('flow_duration') ?? 2;
  if (!flow.entity || !hass) return { duration: base, reverse: false, hidden: false };
  const st = hass.states[flow.entity];
  const v = st ? Number(st.state) : NaN;
  if (!Number.isFinite(v)) return { duration: base, reverse: false, hidden: false };
  // Normalise to the global power_unit so min_power / speed values match what the user sees.
  const entityUnit = (st?.attributes?.unit_of_measurement as string | undefined) ?? '';
  const inW = entityUnit === 'kW' ? v * 1000 : v;
  const normalised = (defaults?.power_unit === 'kW') ? inW / 1000 : inW;
  const mag = Math.abs(normalised);
  if (flow.min_power !== undefined && mag < flow.min_power) {
    return { duration: base, reverse: false, hidden: true };
  }
  let reverse = normalised < 0;
  if (flow.invert) reverse = !reverse;

  // Linear speed interpolation — values in global power_unit.
  const minVal = flow.speed_min_value;
  const maxVal = flow.speed_max_value;
  let duration: number;
  if (minVal !== undefined && maxVal !== undefined && maxVal > minVal) {
    const minDur = flow.speed_min_duration ?? sd('flow_speed_min_duration') ?? base;
    const maxDur = flow.speed_max_duration ?? sd('flow_speed_max_duration') ?? Math.max(0.2, base * 0.1);
    const t = Math.max(0, Math.min(1, (mag - minVal) / (maxVal - minVal)));
    duration = minDur + t * (maxDur - minDur);
  } else {
    duration = base;
  }
  return { duration, reverse, hidden: false };
}

/** Render the animated flows overlay (SVG paths + particle divs). */
export function renderFlows(
  config: MosaicCanvasConfig,
  dims: CanvasDims,
  hass?: HomeAssistant,
  boxes?: Record<string, CardBox>,
  defaults?: GlobalDefaults,
): TemplateResult {
  const flows: FlowConfig[] = config.flows ?? [];
  const cards: CardConfig[] = config.cards ?? [];
  const { totalW, totalH } = dims;


  // Resolve each flow's points (direction applied at render time via path reversal).
  type Resolved = { flow: FlowConfig; pts: { x: number; y: number }[] };
  const resolved = flows
    .map((flow): Resolved | null => {
      if ((flow.points ?? []).length < 2) return null;
      // resolveFlowPoint returns 0-1 fractions; scale to design px for SVG rendering.
      const pts = flow.points
        .map((ep) => resolveFlowPoint(ep, cards, boxes))
        .map((p) => ({ x: p.x * totalW, y: p.y * totalH }));
      return { flow, pts };
    })
    .filter((r): r is Resolved => r !== null);

  const svgFlows    = resolved.filter(({ flow }) => flow.style !== 'particles');
  const particleFlows = resolved.filter(({ flow }) => flow.style === 'particles');

  return html`
    <svg
      class="ec-flows"
      viewBox="0 0 ${totalW} ${totalH}"
      preserveAspectRatio="none"
      style="position:absolute;inset:0;width:${totalW}px;height:${totalH}px;overflow:visible;pointer-events:none;"
    >
      ${svgFlows.map(({ flow, pts }) => {
        const style = flow.style ?? sd('flow_style') ?? 'dashes';
        const forwardColor = flow.forward_color ?? flow.color ?? sd('flow_color') ?? '#00d4ff';
        const reverseColor = flow.reverse_color ?? forwardColor;
        const width = flow.width ?? sd('flow_width') ?? 3;
        const { duration, reverse, hidden } = flowAnimState(flow, hass, defaults);
        const color = reverse ? reverseColor : forwardColor;
        // Round to 0.1 s steps — prevents micro-fluctuations from restarting the
        // animation via --mc-flow-dur changes. Direction is encoded in path geometry
        // (reversed pts) so animation-direction stays 'normal' at all times.
        const dur = (Math.round(duration * 10) / 10).toFixed(1);
        const effPts = reverse ? [...pts].reverse() : pts;
        const d = buildFlowD(effPts, flow.curve ?? sd('flow_curve') ?? 'straight');
        return svg`<path
          d=${d}
          class="ecf ecf-${style}"
          style="fill:none;stroke:${color};stroke-width:${width}px;stroke-linecap:round;--mc-flow-dur:${dur}s;${hidden ? 'opacity:0;' : ''}"
        ></path>`;
      })}
    </svg>
    <div
      class="ec-particles"
      style="position:absolute;inset:0;pointer-events:none;"
    >
      ${particleFlows.map(({ flow, pts }) => {
        const forwardColor = flow.forward_color ?? flow.color ?? sd('flow_color') ?? '#00d4ff';
        const reverseColor = flow.reverse_color ?? forwardColor;
        const width = flow.width ?? sd('flow_width') ?? 3;
        const { duration, reverse, hidden } = flowAnimState(flow, hass, defaults);
        const color = reverse ? reverseColor : forwardColor;
        if (hidden) return nothing;
        const dur = (Math.round(duration * 10) / 10).toFixed(1);
        const effPts = reverse ? [...pts].reverse() : pts;
        const d = buildFlowD(effPts, flow.curve ?? sd('flow_curve') ?? 'straight');
        const n = flow.particle_count ?? sd('flow_particle_count') ?? 6;
        return Array.from({ length: n }, (_, i) => {
          const delay = -((i * Number(dur)) / n).toFixed(3);
          return html`<div
            class="ecf-dot"
            style="offset-path:path('${d}');--mc-flow-dur:${dur}s;animation-delay:${delay}s;background:${color};width:${width * 2}px;height:${width * 2}px;"
          ></div>`;
        });
      })}
    </div>
  `;
}

// ── Flow CSS ──────────────────────────────────────────────────────────────────

export const flowCss: CSSResult = css`
  @keyframes ec-dash {
    to {
      stroke-dashoffset: -20;
    }
  }
  @keyframes ec-dash-fluid {
    to {
      stroke-dashoffset: -110;
    }
  }
  @keyframes ec-move {
    from {
      offset-distance: 0%;
    }
    to {
      offset-distance: 100%;
    }
  }

  .ecf {
    animation: ec-dash var(--mc-flow-dur, 2s) linear infinite;
  }
  .ecf-dashes {
    stroke-dasharray: 10 10;
  }
  .ecf-dots {
    stroke-dasharray: 1 12;
    stroke-linecap: round;
  }
  .ecf-fluid {
    stroke-dasharray: 30 80;
    animation-name: ec-dash-fluid;
  }

  .ecf-dot {
    position: absolute;
    border-radius: 50%;
    offset-rotate: 0deg;
    animation: ec-move var(--mc-flow-dur, 2s) linear infinite;
    box-shadow: 0 0 6px currentColor;
  }
`;
