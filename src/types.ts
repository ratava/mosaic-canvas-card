import type { LovelaceCardConfig } from 'custom-card-helpers';

export type BackgroundMode = 'day' | 'night';

export interface BackgroundConfig {
  /**
   * Which method picks the canvas image, and — for the day/night method — how
   * the active mode is chosen.
   *
   *   'single'                        → `url`, one fixed image
   *   'auto' | 'day' | 'night' | 'entity' → the day/night method: `images`
   *   'state'                         → `entity` + `rules`
   *
   * The three methods are exclusive; each reads only its own keys, so switching
   * between them in the editor leaves the others' config intact.
   */
  source?: 'auto' | 'day' | 'night' | 'entity' | 'single' | 'state';
  sun_entity?: string;
  sun_attribute?: string;   // read this attribute of sun_entity instead of its state
  mode_entity?: string;
  mode_attribute?: string;  // read this attribute of mode_entity instead of its state
  /** object-fit for the image within its slot. */
  fit?: 'cover' | 'contain';
  /** images[mode][evCount] -> url. evCount key is a string ("0", "1", ...). */
  images?: Partial<Record<BackgroundMode, Record<string, string>>>;
  /** The single fixed image, for `source: 'single'`. */
  url?: string;
  /** Entity whose state selects from `rules`, for `source: 'state'`. */
  entity?: string;
  /**
   * Value → image rules matched against `entity`'s state, for `source: 'state'`.
   * Each rule stands on its own value, so list order carries no meaning.
   *
   * Unlike a card there is no default image behind these: a state nothing
   * matches paints no background (#103).
   */
  rules?: BackgroundRule[];
}

/** Which point of a box is pinned to its position. */
export type Anchor =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export type Align = 'left' | 'center' | 'right';

/**
 * Box styling — shared by cards and the canvas. All sizes in design px.
 * Cascades: global default (defaults.card / canvas.box) <- per-card box.
 */
export interface BoxStyle {
  background?: string;
  /**
   * Gradient end colour. When set, `background` becomes the gradient start and
   * the box paints a linear-gradient; leave unset for a flat `background`.
   * Same idiom as the fill fields' `fill_color` / `fill_color2`.
   */
  background2?: string;
  /** Gradient angle in degrees (CSS linear-gradient). Default 180 = top → bottom. */
  background_angle?: number;
  /** Alpha channel for the background (0–1). Overrides any alpha in the background color string. Applies to both gradient stops. */
  background_alpha?: number;
  /** Border color. */
  color?: string;
  border?: boolean;
  border_width?: number; // px
  radius?: number; // px
  padding?: number; // px
  /** Shadow — enable like border; the parts below seed when unset. */
  shadow?: boolean;
  /**
   * How the shadow renders (#112). 'drop' (the seed) is offset and
   * directional; 'box' zeroes the offsets for an even halo on every side —
   * the replacement for the removed Glow (#111). The editor stores 'drop'
   * as unset so the common case keeps the YAML clean.
   */
  shadow_mode?: 'drop' | 'box';
  shadow_x?: number; // px, horizontal offset (drop mode only)
  shadow_y?: number; // px, vertical offset (drop mode only)
  shadow_blur?: number; // px
  shadow_spread?: number; // px
  shadow_color?: string;
  blur?: number; // backdrop blur px
  /** Extra raw CSS declarations (prop: value; …) appended to the box element's inline style. */
  extra_css?: string;
}

/**
 * Text styling for label/value lines.
 * Cascades: global (defaults.label / defaults.value, + defaults.font_family)
 *   <- per-card (label_style / value_style) <- per-field (field.style).
 */
export interface TextStyle {
  font_size?: number; // px (design space)
  color?: string;
  font_weight?: number | string;
  font_family?: string;
  letter_spacing?: number; // px
  /** Extra raw CSS declarations (prop: value; …) appended to the text element's inline style. */
  extra_css?: string;
}

export type FieldType =
  | 'value' | 'label' | 'icon' | 'svg' | 'graph' | 'blank' | 'rule' | 'embedded_card'
  // interactive control fields (Mosaic Sub Card fields)
  | 'toggle' | 'slider' | 'dropdown' | 'button_group' | 'input' | 'spinbox' | 'button';

/** The subset of FieldType that renders an interactive, write-back control. */
export const CONTROL_FIELD_TYPES = ['toggle', 'slider', 'dropdown', 'button_group', 'input', 'spinbox', 'button'] as const;
export type ControlFieldType = (typeof CONTROL_FIELD_TYPES)[number];
export function isControlField(t: FieldType): t is ControlFieldType {
  return (CONTROL_FIELD_TYPES as readonly string[]).includes(t);
}

/**
 * Fired when an interactive control field's value changes. The host owns
 * `hass.callService`; the control element only reports its new value. `value`
 * is the raw UI value (e.g. slider 0–100, toggle boolean, dropdown option
 * string) — service resolution / scaling happens in the host handler.
 */
export type ChangeCallback = (
  field: FieldConfig,
  value: string | number | boolean,
  /**
   * Act on this entity instead of `field.entity` — used by selector options that
   * carry their own entity. When set, the field-level `control_service` override
   * is skipped and the domain default action applies, because that override
   * describes how to write the *field's* entity, not an arbitrary one.
   */
  targetEntity?: string,
) => void;

/**
 * How a line/area trace joins its samples. 'step' is the honest shape for a
 * meter or a thermostat setpoint, which holds a value until it changes rather
 * than sliding between readings; 'smooth' is a monotone cubic, which will not
 * overshoot into invented peaks the way a plain cardinal spline does.
 */
export type GraphCurve = 'linear' | 'smooth' | 'step';

/** Where a state timeline names the entity it is plotting. */
export type GraphTimelineLabel = 'left' | 'above' | 'none';

/** One entry of a state timeline's state-to-colour map. */
export interface GraphStateColor {
  state: string;
  color: string;
}

/** Where the legend sits relative to the plot. */
export type GraphLegendPos = 'top' | 'bottom' | 'left' | 'right';

export type GraphType =
  | 'stat-line' | 'bar' | 'bar-h' | 'bar-stacked'
  | 'stat-area'
  | 'line' | 'area' | 'state-timeline'
  | 'gauge' | 'gauge-needle';

export interface GraphSeries {
  entity?: string;
  attribute?: string;
  /**
   * Legacy per-series window (#123). The window is a field-level property now —
   * `graph_stat_period` — because it decides one recorder query the whole chart
   * shares. These two are read only so an existing dashboard can be lifted to
   * the field on load; the editor no longer writes them and strips them on the
   * next config write.
   */
  stat_period?: StatPeriod;
  stat_period_n?: number;
  /** Per-series override of the field's `graph_stat_type`. Still user-facing. */
  stat_type?: StatType;
  label?: string;
  color?: string;
}

export type TimeUntilLayoutItemType = 'text' | 'label' | 'value' | 'newline';

export interface TimeUntilLayoutItem {
  type: TimeUntilLayoutItemType;
  text?: string;
}

export type FillShape = 'cylinder' | 'bar-v' | 'bar-h';

export interface FillThreshold {
  /** Entity value at which this color activates (ascending order). */
  value: number;
  color: string;
}

export type StatPeriod =
  | 'today' | 'yesterday'
  | 'this_week' | 'last_week'
  | 'this_month' | 'last_month'
  | 'this_year' | 'last_year'
  | 'last_30_minutes' | 'last_hour' | 'last_day'
  | 'last_n_minutes' | 'last_n_hours' | 'last_n_days' | 'last_n_months'
  | 'custom';

/**
 * Bucket resolution asked of `recorder/statistics_during_period` — Home
 * Assistant's own `period`, which its `statistics-graph` card puts at card
 * level. A Mosaic graph field is the analogue of that card, so this lives on
 * the field and every series on it shares one resolution (#123).
 *
 * 'auto' sizes the bucket from the resolved window the way the card always did
 * before the option existed, so it is the compatibility choice rather than the
 * default.
 *
 * Every other value is a recorder period, passed through untouched. HA offers
 * no finer or intermediate resolution — there is no half-hourly bucket — so
 * nothing here is synthesised on the client.
 */
export type StatSamplePeriod =
  | 'auto' | '5minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

/**
 * 'state' and 'change' are offered only by a history-fetched graph series
 * (`fetchHistory` in stats.ts) — the aggregate `fetchStats` path (value
 * fields, virtuals, a series with its own `stat_period`) has no per-bucket
 * concept of either and never shows them as an option. Both are populated by
 * HA's recorder only for a `total`/`total_increasing` (cumulative meter)
 * entity — a `measurement` entity (e.g. instantaneous power) never gets a
 * `state` or `change` value at any bucket resolution, only mean/min/max.
 * 'state' is the bucket's last raw reading, unaggregated; 'change' is HA's
 * own per-bucket delta (how much the meter advanced during that bucket) —
 * distinct from 'difference', which needs the first/last reading of the
 * *whole* queried range and has no per-bucket meaning at all.
 */
export type StatType = 'sum' | 'difference' | 'mean' | 'max' | 'min' | 'count' | 'range' | 'state' | 'change';

/** All HA Statistics integration state_characteristic values (numeric + binary sensors). */
export type StatCharacteristic =
  // Averages
  | 'average_linear' | 'average_step' | 'average_timeless'
  | 'mean' | 'mean_circular' | 'median'
  // Extremes
  | 'value_max' | 'value_min' | 'distance_absolute'
  // Spread
  | 'standard_deviation' | 'variance' | 'noisiness' | 'percentile'
  | 'distance_95_percent_of_values' | 'distance_99_percent_of_values'
  // Change
  | 'change' | 'change_sample' | 'change_second'
  // Sums / totals
  | 'sum' | 'sum_differences' | 'sum_differences_nonnegative' | 'total'
  // Counts (numeric + binary)
  | 'count' | 'count_on' | 'count_off'
  // Timestamps
  | 'datetime_newest' | 'datetime_oldest' | 'datetime_value_max' | 'datetime_value_min';

/**
 * A single content line inside a card. The order of a card's `fields` array
 * is the stacking order (fields flow vertically; no individual x/y).
 */
export interface FieldConfig {
  id: string;
  type: FieldType;
  // content
  entity?: string; // type 'value'
  attribute?: string; // read this attribute instead of state
  text?: string; // type 'label' (static text)
  icon?: string; // type 'icon' (mdi); on label fields an optional picked icon; on value fields an override of the entity's own icon
  /**
   * Icon placement on label and value fields (#105), reusing the option-cell
   * vocabulary: the text is the anchor, `left`/`right` share its line,
   * `above`/`below` stack, `none` means no icon. The two field types resolve
   * unset differently, deliberately: a value field falls to `'none'` — its
   * entity would otherwise conjure a glyph onto every existing dashboard —
   * while a label field's icon exists only once picked, so unset falls through
   * the `icon_position` seed to `'left'`.
   */
  icon_position?: OptionIconPosition;
  /**
   * icon fields (#106): state-based icon rules, live only while `entity` is
   * set. A matching rule's icon wins; nothing matching falls back to the
   * picked `icon`, else the entity's own state-aware glyph.
   */
  icon_rules?: IconRule[];
  /**
   * icon fields (#124): the entity's own state names the glyph, for entities
   * whose states line up with an icon set (weather being the case that drives
   * it). The state is slug-normalised — lowercased, `_` to `-` — and joined to
   * `icon_prefix`. A matching `icon_rules` entry still wins over it.
   */
  icon_use_state?: boolean;
  /**
   * icon fields (#124): collection prefix for the state-derived name, stored
   * bare and without the `:` (`wi`, not `wi:`). Unset means `mdi`. Applies only
   * to the name built from the state — `icon` and each rule's icon come from
   * the icon picker already qualified, so prefixing those would break them.
   */
  icon_prefix?: string;
  unit?: string; // '' hides the unit
  decimals?: number;
  hide_below?: number;  // suppress display when |value| is below this threshold
  show_time_until_label?: boolean; // prefix rendered text with the active trigger's label (time_until virtuals)
  time_until_layout?: TimeUntilLayoutItem[];
  // auto-label (value fields only)
  label?: string;
  label_position?: 'above' | 'below' | 'left' | 'right';
  label_column?: number; // 1-based grid column for label in extended card column-split mode
  // per-field overrides (win over card + global)
  align?: Align;
  style?: TextStyle;
  /** Extra raw CSS declarations (prop: value; …) appended to this field's rendered element. */
  extra_css?: string;
  // statistics (value fields only)
  stat_period?: StatPeriod;
  stat_type?: StatType; // default 'sum'
  // battery field
  charging_entity?: string;
  charging_attribute?: string; // read this attribute of charging_entity instead of its state
  height?: number; // design px; default 100 vertical / 44 horizontal
  margin?: number; // px gap around the battery separating it from adjacent fields
  dock?: 'left' | 'right'; // place this field beside the other fields in the card
  column?: number;          // 1-based grid column for multi-column extended card layout
  column_end?: number;      // 1-based end column for spanning (must be > column)
  /**
   * 1-based grid row, honoured only when the card is in `layout_mode: 'grid'`
   * (#102). Flow mode derives a field's row from its order in `fields`, so this
   * is ignored there rather than fighting it.
   */
  row?: number;
  /** 1-based end row for spanning (must be > row). Grid mode only. */
  row_end?: number;
  display_name?: string;    // friendly label shown in the field list; falls back to entity/text/type
  // blank / rule fields
  blank_gap?: number;       // px height of blank spacer (default 10)
  // fill field
  shape?: FillShape;        // built-in shape; omit when using svg
  svg?: string;             // URL to user SVG (e.g. /local/tank.svg)
  fill_id?: string;         // id of element to clip; fallback: [data-fill]
  fill_color?: string;      // fill colour (gradient start / flat colour)
  fill_color2?: string;     // gradient end colour; enables gradient when set
  /**
   * Gradient angle in degrees, 180 = top → bottom. Unset = the gradient runs
   * along `fill_direction`, which is what it always did before the angle
   * existed. Only applies where the card injects the gradient itself — an SVG
   * that ships its own `linearGradient` stops keeps its own vector and the card
   * only recolours the stops.
   */
  fill_angle?: number;
  fill_direction?: 'up' | 'down' | 'left' | 'right';
  min?: number;             // entity value → 0% (default 0)
  max?: number;             // entity value → 100% (default 100)
  thresholds?: FillThreshold[];
  // tank fill level source (overrides entity+min/max when set)
  tank_pct_entity?: string;       // entity reporting fill % (0-100) directly
  tank_pct_attribute?: string;    // read this attribute of tank_pct_entity instead of its state
  tank_volume_entity?: string;    // entity reporting current liquid volume
  tank_volume_attribute?: string; // read this attribute of tank_volume_entity instead of its state
  tank_capacity?: number;         // fixed capacity value
  tank_capacity_entity?: string;  // entity reporting capacity (alternative to tank_capacity)
  tank_capacity_attribute?: string; // read this attribute of tank_capacity_entity instead of its state
  // tank appearance
  tank_color?: string;            // outer tank/shell colour
  width?: number;           // design px width (fill fields); height already covers vertical size
  // gauge label overlays (driven by McFill into data-min-label / data-max-label / data-value elements)
  gauge_min_label?: string;   // text at left arc end, e.g. "0 kW"
  gauge_max_label?: string;   // text at right arc end, e.g. "5 kW"
  gauge_show_value?: boolean; // show current entity value in centre of gauge
  gauge_label_size?: number;  // font size px (default 11)
  gauge_label_color?: string; // label colour (default '#cccccc')
  // thermometer SVG tick styling
  thermo_tick_color?: string;           // tick mark and label colour (default rgba(255,255,255,0.7))
  thermo_tick_font_size?: number;       // tick label font size in SVG units (default 4)
  thermo_fill_opacity_above?: number;   // opacity of fill above current level (default 0.5)
  thermo_grid_color?: string;           // grid lines inside tube (default rgba(255,255,255,0.25))
  thermo_minor_tick_width?: number;     // minor tick stroke width in SVG units (default 0.5)
  thermo_major_tick_width?: number;     // major tick stroke width in SVG units (default 0.75)
  thermo_major_tick_length?: number;    // override major tick line length in SVG units (default: from SVG rect)
  thermo_minor_tick_length?: number;    // override minor tick line length in SVG units (default: from SVG rect)
  thermo_decimals?: number;             // decimal places for the temperature value display (overrides decimals)
  thermo_temp_color?: string;           // colour of the temperature value text in the bulb
  thermo_temp_font_size?: number;       // font size of the temperature value in SVG units
  thermo_text_position?: 'left' | 'right' | 'both'; // which side(s) to show tick marks and labels (default 'right')
  thermo_show_minor_tick_text?: boolean;            // show labels at minor tick positions (default false)
  // HA Statistics integration (rolling window sensor)
  stat_period_n?: number;        // value of N for last_n_* periods
  stat_period_start?: string;    // datetime-local string (custom range start)
  stat_period_end?: string;      // datetime-local string (custom range end)
  stat_characteristic?: StatCharacteristic;
  stat_max_age_hours?: number;    // hours for max_age in HA Statistics config
  stat_sampling_size?: number;    // sampling_size in HA Statistics config
  stat_percentile?: number;       // 1-99, required when stat_characteristic === 'percentile'
  // embedded_card field — embeds a 3rd-party Lovelace card
  embed_card_config?: Record<string, unknown>; // full Lovelace card config (type + props)
  embed_transparent?: boolean; // strips ha-card background/shadow/border
  // graph field
  graph_type?: GraphType;
  graph_series?: GraphSeries[];
  graph_min?: number;
  graph_max?: number;
  graph_show_legend?: boolean;
  graph_show_axes?: boolean;
  graph_hours?: number;       // legacy history depth hours — superseded by graph_stat_period (#123)
  /**
   * Graph Data (#123) — the statistics model Home Assistant puts at card level,
   * held here because a Mosaic field is the analogue of an HA card.
   *
   * `graph_stat_period` is the window every series on the chart is drawn over,
   * `graph_sample_period` the bucket resolution inside it, and
   * `graph_stat_type` the calculation applied per bucket, which a series may
   * still override. Unset, each falls back through the card's defaults to the
   * seed (`graph_stat_period`, `graph_sample_period`, and `stat_type_history` /
   * `stat_type` by graph kind).
   *
   * `graph_hours` is what the window used to be. It stays readable so an
   * existing line chart keeps its depth until the field gains a period.
   */
  graph_stat_period?: StatPeriod;
  graph_stat_period_n?: number;   // value of N for the last_n_* windows
  graph_sample_period?: StatSamplePeriod;
  graph_stat_type?: StatType;
  graph_stroke_width?: number;
  graph_fill_opacity?: number;
  // Axis control (#119 pass 2). Each of these overrides a decision the chart
  // otherwise makes for itself, so unset is the normal state.
  /** Force zero into a line/area chart's range. Bars always include it. */
  graph_include_zero?: boolean;
  /** Gridline count override; unset derives it from plot height and label size. */
  graph_tick_count?: number;
  /** Decimal places for every readout; unset follows the entity's own precision. */
  graph_precision?: number;
  /** Unit shown on the axis. Unset takes the entity's; empty string hides it. */
  graph_unit?: string;
  /**
   * Rotated title down the left of the plot. Unset, the axis is labelled with
   * the unit instead of the unit getting its own strip above the topmost tick
   * (#123); set, the title takes the axis and the unit keeps that strip.
   */
  graph_y_title?: string;
  /**
   * Label centred under the x-axis ticks (#123). Unset it names the window the
   * chart covers — "Last day", "Last 7 days"; an empty string hides it, the
   * same convention as `graph_unit`.
   */
  graph_x_title?: string;
  // Line/area shaping (#119 pass 2).
  graph_curve?: GraphCurve;
  /** Dot at every sample. Suppressed automatically when they would collide. */
  graph_points?: boolean;
  /** Dot plus value label at the most recent sample of each series. */
  graph_last_point?: boolean;
  // Bar and legend options (#119 pass 2).
  /** Print each bar's value at its end. */
  graph_bar_labels?: boolean;
  graph_legend_position?: GraphLegendPos;
  // Gauge options (#119 pass 2).
  /** Tick marks around the arc. */
  graph_gauge_ticks?: boolean;
  /** Total sweep in degrees, centred on 12 o'clock. Default 270. */
  graph_gauge_sweep?: number;
  /** Caption under the gauge's value. */
  graph_gauge_label?: string;
  /**
   * The gauge's own colour bands. A segmented gauge used to read `thresholds`,
   * which is the *fill* field's key — so a field that was once a fill and
   * became a gauge inherited bands it never asked for, and the two features
   * could not be configured independently. `thresholds` is still honoured
   * when this is unset, so existing gauges keep working.
   */
  graph_thresholds?: FillThreshold[];
  // State timeline (#119 pass 2).
  /** Colour per state string, e.g. `on` -> green. Matched case-insensitively. */
  graph_state_colors?: GraphStateColor[];
  /** Colour for `unavailable` / `unknown`. */
  graph_unavailable_color?: string;
  /** Print the state's name inside each segment wide enough to hold it. */
  graph_show_state_names?: boolean;
  /** Where the entity's name goes. Its legend lists states, not series. */
  graph_timeline_label?: GraphTimelineLabel;
  /**
   * How often this graph re-queries the recorder, in minutes (#119). Unset
   * inherits the dashboard's own setting and then the seed, like any other
   * styled property — the point is that a live gauge and a week-long history
   * chart have no business sharing a cadence.
   */
  graph_refresh_minutes?: number;
  // Graph chrome — the axis/grid/label furniture. Every one of these was a
  // hardcoded literal until #74 Phase 6; seeded values in defaults.json keep
  // the shipped look, and they are deliberately NOT themed (STYLING.md §8:
  // translucent white over an arbitrary photo, where the alpha is the
  // contrast guarantee).
  graph_axis_color?: string;
  graph_grid_color?: string;
  graph_zero_line_color?: string;
  graph_baseline_color?: string;
  graph_label_color?: string;
  /**
   * Colour of the numbers, dates and category names along the axes (#123).
   * Unset it follows `graph_label_color`, which is what coloured them before
   * the two were separable — so an existing chart keeps its ticks and gains an
   * axis-label colour that matches them.
   */
  graph_tick_color?: string;
  /** Unset means each chart keeps its own natural size (8px or 9px). */
  graph_label_size?: number;
  graph_unit_label_color?: string;
  graph_legend_label_color?: string;
  graph_bar_label_color?: string;
  graph_gauge_track_color?: string;
  graph_gauge_value_color?: string;
  /** Series colour cycle. A series with its own colour still wins. */
  graph_palette?: string[];
  // ── interactive control fields (toggle / slider / dropdown / selector / input / spinbox) ──
  /** Variant id from the control registry (e.g. 'switch', 'checkbox', 'brightness', 'volume'). */
  variant?: string;
  /** Explicit 'domain.service' override for write-back. When unset, the service is inferred from the entity domain. */
  control_service?: string;
  /** Service data template for the override; string values containing '{value}' are substituted with the UI value. */
  control_service_data?: Record<string, unknown>;
  /** Multiply the UI value by this before sending (e.g. media volume: 0.01 maps 0–100 → 0–1). */
  value_scale?: number;
  /** Read the current value from this entity attribute instead of the state (e.g. light 'brightness'). */
  read_attribute?: string;
  /** Divide the read attribute/state by this to normalise to the UI range (e.g. brightness 255 → 0–100 when max is 100). */
  read_scale?: number;
  // slider / spinbox / numeric input
  step?: number;
  slider_orientation?: 'horizontal' | 'vertical';
  show_value?: boolean;
  /** Spin box: decimal places to round and display to. Unset = natural precision (4-decimal float-safety rounding, no forced display padding). */
  spinbox_decimals?: number;
  // dropdown / selector
  options_source?: 'entity' | 'manual';
  options?: ControlOption[];
  // ── selector option cell layout (field defaults; each option may override) ──
  /** Icon position relative to the label, or 'none' to hide it. Default 'left'. */
  option_icon_position?: OptionIconPosition;
  /** Show each option's state value. Requires the option to have its own entity. */
  option_show_state?: boolean;
  /** State position relative to the label. Default 'below'. */
  option_state_position?: OptionPartPosition;
  /** Text style for the option icon (font_size drives the icon size). */
  option_icon_style?: TextStyle;
  /** Text style for the option label. */
  option_label_style?: TextStyle;
  /** Text style for the option state value. */
  option_state_style?: TextStyle;
  /**
   * Button: write this fixed value to the entity when pressed, and render as
   * active while the entity's state equals it. Leave unset for the common case
   * — the button toggles its entity with the domain default action.
   */
  button_value?: string;
  /** Entity attribute holding the option list when source is 'entity'. Default 'options' (input_select/select); e.g. 'effect_list', 'source_list', 'preset_modes', 'hvac_modes'. */
  options_attribute?: string;
  button_group_layout?: 'row' | 'wrap';
  // input
  submit_on?: 'enter' | 'blur' | 'change';
  placeholder?: string;
  /** Maximum character length. Unset = no limit. */
  input_maxlength?: number;
  /** Render as a masked password field instead of plain text. */
  input_password?: boolean;
  // toggle
  toggle_variant?: 'switch' | 'checkbox';
  // per-field visual overrides for control fields (win over GlobalDefaults.control_style / .control)
  control_style?: ControlStyle;
  control_box?: BoxStyle;
  // stacked label rows (icon + text, each with its own style)
  control_labels?: ControlLabel[];
  control_labels_position?: 'above' | 'below' | 'left' | 'right';
  /** px between the label rows and the control (default 4). */
  control_labels_gap?: number;
  // slider positional labels along the track
  slider_labels?: { left?: SliderTrackLabel; center?: SliderTrackLabel; right?: SliderTrackLabel };

  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}

// ── Tap / hold / double-tap actions ──────────────────────────────────────────

export type ActionType =
  | 'more-info' | 'toggle' | 'call-service'
  | 'navigate' | 'url' | 'assist' | 'fire-dom-event' | 'none'
  | 'expand-card' | 'open-extended';

export interface ActionConfig {
  action: ActionType;
  /** Entity for more-info / toggle. */
  entity?: string;
  /** navigation_path for navigate action. */
  navigation_path?: string;
  /** domain.service for call-service action. */
  service?: string;
  service_data?: Record<string, unknown>;
  target?: { entity_id?: string | string[]; device_id?: string | string[]; area_id?: string | string[] };
  /** URL for url action. */
  url_path?: string;
  /** Target extended card ID for open-extended action. */
  extended_card_id?: string;
}

export interface TapActions {
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}

// ── Zone ────────────────────────────────────────────────────────────────────

/** Invisible (or semi-visible) clickable hotspot pinned to canvas coordinates. */
export interface ZoneConfig extends TapActions {
  id: string;
  name?: string;
  position: { x: number; y: number };
  anchor?: Anchor;
  width: number;  // design px
  height: number; // design px
  /** Optional visible overlay color (e.g. 'rgba(0,212,255,0.15)'). */
  color?: string;
  /** Border radius px. */
  radius?: number;
}

// ── Embedded Card ────────────────────────────────────────────────────────────

/** A full HA Lovelace card embedded as a positioned canvas element. */
export interface EmbeddedCardConfig {
  id: string;
  /** Editor display name. */
  name?: string;
  /** Design-px position, pinned by anchor. */
  position: { x: number; y: number };
  anchor?: Anchor;
  /** Design px width. */
  width: number;
  /** Grid mode: number of grid columns this card spans. width is derived from it. */
  grid_span?: number;
  /** Design px height — omit for auto height. */
  height?: number;
  /**
   * Strip ha-card background, shadow, and border.
   *
   * `undefined` means "follow `defaults.embedded_card_transparent`", the same
   * distinction `box` carries below — which is why the editor gates it behind
   * an inherit row rather than writing `false` for an unticked box.
   */
  transparent?: boolean;
  /**
   * Mosaic's own box, painted on the host element that holds the embedded card
   * (#92). Independent of `transparent`, which subtracts the *third-party*
   * card's chrome inside it — the two touch different surfaces.
   *
   * `undefined` means "follow `defaults.embedded_card`", and an empty object
   * means "override it with nothing set", the same distinction
   * `ExtendedCardConfig.box` carries.
   */
  box?: BoxStyle;
  /**
   * Show/hide condition, same shape and same evaluation as `CardConfig` (#92).
   * Unset means always visible. The editor renders a hidden card anyway, or it
   * would be unreachable to edit.
   */
  visible_when?: VisibilityCondition;
  /** The full Lovelace card config (type + card-specific props). */
  card_config: Record<string, unknown>;
  /** Editor-only grouping token — shared with FieldConfig.group for mixed groups. */
  group?: string;
  /**
   * Extra raw CSS declarations (prop: value; …) applied to the **third-party
   * card element itself**, inside the shadow boundary — the same reach
   * `transparent` has.
   *
   * It sat on the host's inline style until #92, which is why the same config
   * can now land somewhere else: the frame moved to `box`, and this key kept the
   * name but became what its screen always claimed it was. A declaration that
   * used to move or size the whole element (`z-index`, `transform`, `opacity`)
   * belongs in `box.extra_css` now.
   *
   * Appended after `defaults.embedded_card_extra_css` rather than replacing it,
   * the same as every other Additional CSS in the card — later declarations win,
   * so a card overrides the global by naming the same property.
   */
  extra_css?: string;
}

export type VisibilityOperator = '==' | '!=' | '>' | '<' | '>=' | '<=';

export interface VisibilityCondition {
  entity: string;
  operator: VisibilityOperator;
  /** Compared as number when both sides are numeric, otherwise as string. */
  value: string;
}

/**
 * How a card places its fields (#102). 'flow' is the column/order model the card
 * has always had; 'grid' divides it into cells and each field names one.
 */
export type CardLayoutMode = 'flow' | 'grid';

/**
 * The cell definition for a card in `layout_mode: 'grid'` (#102) — the card's
 * content box divided into `columns` × `rows`, with a field placed by `row` /
 * `column` instead of by its order in the field list.
 *
 * Only the row height is ever a real number: the columns are `1fr` tracks, so
 * the grid fills whatever width is left after padding and any docked fields,
 * and nothing here has to know the card's width.
 */
export interface CardGrid {
  /** Default 4. The editor clamps to 1–8; the renderer honours any value. */
  columns: number;
  /** Default 4. The editor clamps to 1–8; the renderer honours any value. */
  rows: number;
  /** px gap between rows. Unset falls back to the resolved `field_gap`. */
  row_gap?: number;
}

export interface CardConfig {
  id: string;
  /** Editor display name, e.g. "Battery". */
  name?: string;
  /** Design-px position, pinned by `anchor`. */
  position: { x: number; y: number };
  /** Which point of the card box sits on `position`. Default 'top-left'. */
  anchor?: Anchor;
  /** Fixed width in design px; omit to shrink-to-content. */
  width?: number;
  /**
   * Fixed height in design px (#102). Omit to size to content.
   *
   * A hard height in `layout_mode: 'grid'`, where the row heights are divided
   * out of it, and a `min-height` in flow mode — so giving a flow card a height
   * can never clip content that outgrows it.
   */
  height?: number;
  /** Number of content columns. Default 1 (single column). */
  columns?: number;
  /** Grid mode: number of grid columns this card spans. width is derived from it. */
  grid_span?: number;
  /**
   * Grid mode: number of grid rows this card spans. `height` is derived from it,
   * the same way `width` is derived from `grid_span` (#102).
   *
   * Only meaningful on a grid canvas; a precision canvas types `height` in px.
   */
  grid_row_span?: number;
  /**
   * Field placement mode. Default 'flow' — the column/order model the card has
   * always had. 'grid' divides the card into `grid.columns` × `grid.rows` cells
   * and places each field by `row` / `column` (#102).
   *
   * Deliberately the same key name as `CanvasConfig.layout_mode`: same concept,
   * different scope (cards on the canvas vs fields in a card).
   *
   * Unset inherits `GlobalDefaults.card_layout_mode`, so read it through
   * `cardLayoutMode()` rather than comparing it directly.
   */
  layout_mode?: CardLayoutMode;
  /** Cell definition, used when layout_mode === 'grid'. */
  grid?: CardGrid;
  /** Default text alignment for the card's fields. */
  align?: Align;
  /** px gap between fields (overrides defaults.field_gap). */
  field_gap?: number;
  /** px gap between field-columns (overrides defaults.column_gap). */
  column_gap?: number;
  /** Card box style (overrides defaults.card). */
  box?: BoxStyle;
  /** Per-card override of the global label default. */
  label_style?: TextStyle;
  /** Per-card override of the global value default. */
  value_style?: TextStyle;
  /** Suppress the card box entirely — no background, border, or shadow. Fields still render. */
  transparent?: boolean;
  /** Hide this card when the condition evaluates to false. */
  visible_when?: VisibilityCondition;
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
  fields: FieldConfig[];
  /**
   * Editor-only grouping token. Cards sharing the same group string move
   * together when any member is dragged. Ignored by the runtime view.
   */
  group?: string;
  /** Optional background image rendered behind the card's fields. */
  bg?: CardBackgroundConfig;
}

export interface CardBackgroundConfig {
  /**
   * The card's background image. With `entity` set this is the default — the
   * image shown when no rule matches, or the entity is missing/unavailable.
   */
  url?: string;
  /**
   * Entity whose state selects the image from `rules`. Unset (or with no rules)
   * keeps the single-image behaviour: `url` always wins.
   */
  entity?: string;
  /**
   * Value → image rules matched against `entity`'s state. Each rule stands on
   * its own value, so list order carries no meaning — it is not a priority
   * chain, and a duplicated value just resolves to whichever was added first.
   */
  rules?: BackgroundRule[];
  /** CSS object-fit for the background image. Default 'cover'. */
  fit?: 'cover' | 'contain' | 'fill' | 'none';
  /** Explicit image width in px; omit to fill available width. */
  width?: number;
  /** Explicit image height in px; omit to fill available height. */
  height?: number;
  /** Opacity 0–1. Default 1. */
  opacity?: number;
  padding_top?: number;
  padding_right?: number;
  padding_bottom?: number;
  padding_left?: number;
}

/**
 * One state → image rule, used by both a card background and the canvas one.
 *
 * The rule only chooses the image *source*; every display knob
 * (`fit`, `opacity`, `width`, `height`, `padding_*`) stays on the parent
 * config and applies to whichever image wins.
 */
export interface BackgroundRule {
  /**
   * State value to match. Compared as a string first, then numerically, then
   * as a boolean — so `21` matches a state of `21.0`, and `true` matches `on`.
   */
  value?: string;
  /** Image shown while the entity's state matches `value`. */
  url?: string;
}

/** The name this rule shipped under, when only cards had rules (#100). */
export type CardBackgroundRule = BackgroundRule;

/**
 * One state → icon rule on an icon field (#106) — the icon-field mirror of
 * `BackgroundRule`, matched with the same `bgValueMatches` semantics so
 * backgrounds and icons can never drift apart on what "matches" means.
 */
export interface IconRule {
  /**
   * State value to match. Compared as a string first, then numerically, then
   * as a boolean — so `21` matches a state of `21.0`, and `true` matches `on`.
   */
  value?: string;
  /** Icon shown while the entity's state matches `value`. */
  icon?: string;
}

/** px margins added around the image so cards can sit outside it. */
export interface CanvasExtend {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface CanvasConfig extends TapActions {
  /** Design-space base (image slot) size in px. Defaults to the image's natural size. */
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain';
  extend?: CanvasExtend;
  /** Canvas background/border style (same knobs as a card box). */
  box?: BoxStyle;
  /** Card placement mode. Default 'precision' (free px drag). */
  layout_mode?: 'precision' | 'grid';
  /** Grid definition, used when layout_mode === 'grid'. */
  grid?: CanvasGrid;
}

/** Invisible snap grid dividing the canvas into columns × rows (grid layout mode). */
export interface CanvasGrid {
  columns: number;
  rows: number;
  /** px padding between adjacent cards (design space). Default 0. */
  padding?: number;
}

/**
 * Visual style for interactive control fields (toggle, slider, …).
 * Cascades global (`GlobalDefaults.control_style`) → per-field (`FieldConfig.control_style`).
 * See `resolveControlStyle` for the resolution order and accent-derived fallbacks.
 */
export interface ControlStyle {
  /** Accent colour — the fallback for slider fill, toggle-on, and each control's selected/focus state. */
  accent_color?: string;
  /**
   * Gradient end for the accent. Unset = flat `accent_color`. Every surface that
   * falls back to the accent (slider fill, toggle-on, dropdown/selector selected,
   * spin box hover) inherits this gradient unless it sets a colour of its own.
   * Borders and focus outlines always use the flat `accent_color` — a
   * linear-gradient is not a legal border or outline colour.
   */
  accent_color2?: string;
  /** Angle for the accent gradient. Unset = `gradient_angle`. */
  accent_angle?: number;
  /**
   * Default angle in degrees for every control gradient below (CSS
   * linear-gradient). Default 180 = top → bottom.
   *
   * Each gradient also has its own `…_angle`, which wins when set; this is what
   * the rest fall back to, so one value still themes a whole control unless a
   * surface is deliberately turned away from it.
   */
  gradient_angle?: number;
  // toggle
  toggle_on_color?: string;
  /** Gradient end for the on-state track. Unset = flat `toggle_on_color`. */
  toggle_on_color2?: string;
  /** Angle for the on-state track gradient. Unset = `gradient_angle`. */
  toggle_on_angle?: number;
  toggle_off_color?: string;
  /** Gradient end for the off-state track. Unset = flat `toggle_off_color`. */
  toggle_off_color2?: string;
  /** Angle for the off-state track gradient. Unset = `gradient_angle`. */
  toggle_off_angle?: number;
  /** Toggle thumb (knob): colour, size in px, corner radius in px (defaults to a circle), and the gap between thumb and track edge. */
  toggle_thumb_color?: string;
  toggle_thumb_size?: number;
  toggle_thumb_radius?: number;
  toggle_thumb_padding?: number;
  // slider
  slider_track_color?: string;
  /** Gradient end for the slider track. Unset = flat `slider_track_color`. */
  slider_track_color2?: string;
  /** Angle for the slider track gradient. Unset = `gradient_angle`. */
  slider_track_angle?: number;
  slider_fill_color?: string;
  /** Gradient end for the slider fill. Unset = flat `slider_fill_color`. */
  slider_fill_color2?: string;
  /** Angle for the slider fill gradient. Unset = `gradient_angle`. */
  slider_fill_angle?: number;
  slider_thumb_color?: string;
  /** Slider thumb (knob) size in px, corner radius in px (defaults to a circle), and travel inset from each track end. */
  slider_thumb_size?: number;
  /** Thumb width in px, independent of its height. Unset = `slider_thumb_size` (a square/circular thumb). */
  slider_thumb_width?: number;
  slider_thumb_radius?: number;
  slider_thumb_padding?: number;
  slider_height?: number;
  /** Track length in px. Unset = the track fills the width available to the field. */
  slider_length?: number;
  /** Track corner radius in px. Unset = a full pill. */
  slider_radius?: number;
  /** Off by default — the slider track has no border unless this is set. */
  slider_border?: boolean;
  slider_border_color?: string;
  slider_border_width?: number;      // px, default 1
  // dropdown
  dropdown_border_color?: string;
  dropdown_bg?: string;
  dropdown_bg2?: string;                 // gradient end for the trigger background
  dropdown_bg_angle?: number;            // angle for it (fallback: gradient_angle)
  dropdown_radius?: number;
  dropdown_text_size?: number;
  dropdown_menu_bg?: string;
  dropdown_menu_bg2?: string;            // gradient end for the popup menu background
  dropdown_menu_bg_angle?: number;       // angle for it (fallback: gradient_angle)
  dropdown_menu_border_color?: string;
  dropdown_selected_color?: string;      // selected option highlight (fallback: accent)
  dropdown_selected_color2?: string;     // gradient end for the selected option
  dropdown_selected_angle?: number;      // angle for it (fallback: gradient_angle)
  // selector
  button_group_border_color?: string;
  button_group_border_width?: number;        // px, default 1
  button_group_icon_size?: number;           // px, option icon
  button_group_state_size?: number;          // px, option state value (fallback: label size)
  // inactive state
  button_group_bg?: string;                  // unselected segment background
  button_group_bg2?: string;                 // gradient end for the unselected segment
  button_group_bg_angle?: number;            // angle for it (fallback: gradient_angle)
  button_group_text_color?: string;          // label on unselected segments
  button_group_icon_color?: string;          // icon on unselected segments (fallback: label colour)
  button_group_state_color?: string;         // state value on unselected segments (fallback: label colour)
  // active state — an option is active when its value is the entity's current
  // state, or when its own entity is on
  button_group_selected_color?: string;      // selected segment (fallback: accent)
  button_group_selected_color2?: string;     // gradient end for the selected segment
  button_group_selected_angle?: number;      // angle for it (fallback: gradient_angle)
  button_group_selected_text_color?: string;  // label on the selected segment
  button_group_selected_icon_color?: string;  // icon on the selected segment (fallback: selected label)
  button_group_selected_state_color?: string; // state value on the selected segment (fallback: selected label)
  button_group_radius?: number;
  button_group_text_size?: number;
  /**
   * Separation — turns the joined segmented row into discrete buttons.
   * A gap above 0, or `button_group_option_border`, detaches the options: the shared
   * row outline and the divider lines between segments both go away, and each
   * option becomes its own rounded cell.
   */
  button_group_option_gap?: number;          // px between options, and between lines
  button_group_option_padding?: number;      // px padding inside each option cell
  button_group_option_border?: boolean;      // give every option its own border
  /** Per-option border/corner overrides. Each falls back to the row's own value. */
  button_group_option_border_color?: string; // fallback: button_group_border_color
  button_group_option_border_width?: number; // fallback: button_group_border_width
  button_group_option_radius?: number;       // fallback: button_group_radius
  /** Extra raw CSS applied to each separated option cell (only meaningful when a gap detaches them). */
  button_group_option_extra_css?: string;
  // button — independent from selector; a button field never reads a button_group_* key.
  button_border_color?: string;
  button_border_width?: number;          // px, default 1
  button_icon_size?: number;             // px
  button_state_size?: number;            // px, fallback: label size
  // inactive state
  button_bg?: string;                    // background while inactive
  button_bg2?: string;                   // gradient end for the inactive background
  button_bg_angle?: number;              // angle for it (fallback: gradient_angle)
  button_text_color?: string;            // label while inactive
  button_icon_color?: string;            // icon while inactive (fallback: label colour)
  button_state_color?: string;           // state value while inactive (fallback: label colour)
  // active state — active while the entity is on, or (with a value set) while the
  // entity's state equals it
  button_selected_color?: string;        // background while active (fallback: accent)
  button_selected_color2?: string;       // gradient end for the active background
  button_selected_angle?: number;        // angle for it (fallback: gradient_angle)
  button_selected_text_color?: string;   // label while active
  button_selected_icon_color?: string;   // icon while active (fallback: active label)
  button_selected_state_color?: string;  // state value while active (fallback: active label)
  button_radius?: number;
  button_text_size?: number;
  button_option_padding?: number;        // px padding inside the button cell
  // input
  input_border_color?: string;
  input_bg?: string;
  input_bg2?: string;                    // gradient end for the input background
  input_bg_angle?: number;               // angle for it (fallback: gradient_angle)
  input_radius?: number;
  input_text_size?: number;
  input_focus_color?: string;            // border colour on focus (fallback: accent)
  // spinbox
  spinbox_border_color?: string;
  spinbox_bg?: string;                   // button background
  spinbox_bg2?: string;                  // gradient end for the button background
  spinbox_bg_angle?: number;             // angle for it (fallback: gradient_angle)
  spinbox_radius?: number;
  spinbox_text_size?: number;
  spinbox_button_hover_color?: string;   // button hover (fallback: accent)
  spinbox_button_hover_color2?: string;  // gradient end for the button hover
  spinbox_button_hover_angle?: number;   // angle for it (fallback: gradient_angle)
  spinbox_button_width?: number;
  spinbox_button_font_size?: number;     // +/- glyph size
  // Control internals that had no config path at all until #74 Phase 6.
  dropdown_menu_radius?: number;
  dropdown_option_radius?: number;
  dropdown_option_text_color?: string;
  dropdown_option_hover_color?: string;
  dropdown_menu_shadow?: string;         // whole box-shadow value; "none" removes it
  input_placeholder_color?: string;
  slider_thumb_shadow?: string;          // whole box-shadow value; "none" removes it
  toggle_thumb_shadow?: string;          // whole box-shadow value; "none" removes it
}

/**
 * A single label element attached to a control: an optional icon + text with its
 * own text style. Used both for stacked control label rows (`control_labels`) and
 * for slider positional labels (`slider_labels`).
 */
export interface ControlLabel {
  text?: string;
  icon?: string;   // mdi icon name
  style?: TextStyle;
}

/**
 * A slider track label (left / center / right), anchored to the track itself.
 * Adds an optional entity (or `virtual:<id>`) whose formatted value replaces
 * `text`.
 */
export interface SliderTrackLabel extends ControlLabel {
  /** Entity or virtual whose value replaces `text` when set. */
  entity?: string;
  /** Read this attribute of `entity` instead of its state. */
  attribute?: string;
  /** px inset from the track's edge. Left/right only — center is already centered. */
  gap?: number;
}

/**
 * Where a part of an option cell sits **relative to the label**, which is always
 * the anchor. `above`/`below` stack on their own line; `left`/`right` share the
 * label's line.
 */
export type OptionPartPosition = 'above' | 'below' | 'left' | 'right';

/**
 * The icon's placement, which unlike the state's also carries its absence.
 *
 * The state part hides via `show_state`, so `OptionPartPosition` deliberately
 * stays narrow: giving it a `'none'` would mean two settings that say the same
 * thing about the state, and configs rot at exactly that seam. The icon has no
 * such boolean and no natural "off" — an entity option derives a glyph from its
 * entity whether or not one was asked for — so `'none'` is how it says no icon,
 * decided in the same place as where the icon would have gone.
 */
export type OptionIconPosition = OptionPartPosition | 'none';

/**
 * How a selector/button option cell is laid out and styled. Cascades
 * global (`GlobalDefaults.option_layout`) → field (`FieldConfig.option_*`)
 * → option (`ControlOption.icon_position` and friends).
 */
export interface OptionLayout {
  icon_position?: OptionIconPosition;
  show_state?: boolean;
  state_position?: OptionPartPosition;
  icon_style?: TextStyle;
  label_style?: TextStyle;
  state_style?: TextStyle;
}

/**
 * One option in a dropdown / selector.
 *
 * Two flavours, decided per option rather than per field:
 *  - **value option** — writes `value` to the *field's* entity (select_option
 *    and friends). The original behaviour.
 *  - **entity option** — sets `entity`, and the option acts on *that* entity
 *    with its domain default action while showing its state and state icon.
 *    Lets one selector drive several unrelated entities, e.g. a row of lights.
 *
 * Layout keys are all optional overrides — unset means "inherit the field's
 * `option_*` default", so a uniform row is configured once on the field.
 */
export interface ControlOption {
  /** Written to the field entity when the option has no `entity` of its own. */
  value?: string;
  label?: string;
  icon?: string;
  /** Per-option entity — the option acts on and reflects this entity. */
  entity?: string;
  /** Read this attribute of the option's entity instead of its state. */
  attribute?: string;
  /** 1-based line for 2-D grouping. Unset = line 1. */
  line?: number;
  /** Icon position relative to the label, or 'none' to hide it. Unset = field's `option_icon_position`. */
  icon_position?: OptionIconPosition;
  /** Show this option's state value. Unset = field's `option_show_state`. */
  show_state?: boolean;
  /** State position relative to the label. Unset = field's `option_state_position`. */
  state_position?: OptionPartPosition;
  /**
   * Selector only. Runs instead of the option's normal write (value → entity, or
   * per-option entity toggle) when set. `{value}` in `service_data` (or a string
   * containing it) is substituted with this option's own value.
   *
   * Only `tap_action` replaces the write — a hold or a double tap is an addition
   * to the option, not a redefinition of what pressing it means, so an option
   * with only a hold action still writes normally when tapped.
   */
  tap_action?: ActionConfig;
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}

/**
 * A named preset for a control field. Bundled variants ship in
 * `controls/variants.json`; user-authored ones live in
 * `GlobalDefaults.control_variants`. Same shape either way, so a variant is
 * portable between the two.
 */
export interface ControlVariant {
  id: string;
  label: string;
  icon?: string;
  /** In-element rendering mode (e.g. 'switch' | 'checkbox'). */
  render?: string;
  /** Entity domains this variant is intended for (editor hint / filtering). */
  domain?: string[];
  /** Partial FieldConfig applied when this variant is selected. */
  preset?: Partial<FieldConfig>;
}

/** Registry shape shared by the bundled variants.json and user-authored variants. */
export type ControlVariantRegistry = Partial<Record<FieldType, ControlVariant[]>>;

export interface GlobalDefaults {
  // Card text. Fixed white on a drop shadow by default and deliberately not
  // themed — the backdrop is an unknown photo, which is exactly why the shadow
  // exists (STYLING.md §8). Configurable since #74 Phase 6, not theme-derived.
  card_text_color?: string;

  // Overlay / modal chrome — the expand overlay and the popover-card overlay.
  overlay_scrim_color?: string;
  extended_scrim_color?: string;
  // `overlay_panel_radius` was retired in #89 and is no longer read. An overlay
  // panel has no background of its own, so its radius only clipped the card
  // inside — which already rounds itself — and the two disagreeing cut the
  // card's corners square. Overlays now take the radius of the card they show
  // (`overlayPanelRadius`). The name stays reserved, never reused: a config
  // that still sets it is reported by Config Health as a key no screen can
  // reach, so it is visible and clearable rather than silently ignored.
  close_button_bg?: string;
  close_button_hover_bg?: string;
  close_button_text_color?: string;
  close_button_border_color?: string;

  font_family?: string;
  mono_font_family?: string;
  /** Default px gap between fields in a card. */
  field_gap?: number;
  /** Default px gap between field-columns in a multi-column card. Default 3. */
  column_gap?: number;
  /** Default number of columns for normal (canvas) cards. Default 1. */
  card_columns?: number;
  /**
   * Default field placement for Mosaic cards (#102) — the mode a card is in
   * unless it sets its own. Read via `cardLayoutMode()`, never directly.
   */
  card_layout_mode?: CardLayoutMode;
  /**
   * Default cell counts for a card in grid field placement (#102). Kept apart
   * from `card_columns`, which is the flow column count — the two mean different
   * things and a card can carry both.
   */
  card_grid_columns?: number;
  card_grid_rows?: number;
  /**
   * Default px gap between grid rows (#102). Unset follows `field_gap`, so one
   * gap value still themes a whole card. The horizontal gap is `column_gap`,
   * shared with flow placement rather than split per mode.
   */
  card_grid_row_gap?: number;
  /**
   * The Mosaic card's own gaps (#102). Every card type owns its spacing outright:
   * a popover's live on `extended_card_defaults`, an embedded card has no fields
   * to space, and these are the Mosaic card's.
   *
   * `field_gap`/`column_gap` above are the pre-#102 shared keys. They are frozen
   * public API and stay as a compatibility floor beneath these two, so a config
   * written before the split keeps the spacing it had — but nothing writes them
   * any more.
   */
  card_field_gap?: number;
  card_column_gap?: number;
  /** Default card box style. */
  card?: BoxStyle;
  /**
   * Default box style for embedded cards (#92). Painted on the element that
   * *holds* the third-party card, never on the card itself — which is why this
   * is its own key rather than a reuse of `card`: the two decorate different
   * things and a Mosaic card's frame is rarely what an embedded card wants.
   */
  embedded_card?: BoxStyle;
  /**
   * Defaults for the *other* embedded-card surface — the third-party card
   * itself, inside the shadow boundary — matching the two rows the per-card
   * Card Style screen has always had under "The card itself".
   *
   * They are their own keys rather than more of `embedded_card` for the reason
   * that key already gives: `embedded_card` decorates the host, these reach
   * inside it. `embedded_card.extra_css` and `embedded_card_extra_css` are two
   * different surfaces, exactly as `box.extra_css` and `extra_css` are on
   * `EmbeddedCardConfig`.
   *
   * Neither is seeded, for the reason `embedded_card` isn't (CSS_REFERENCE.md):
   * a seeded `true` would strip every embedded card's chrome on upgrade.
   */
  embedded_card_transparent?: boolean;
  embedded_card_extra_css?: string;
  /** Default style for label-type fields. */
  label?: TextStyle;
  /** Default style for value-type fields. */
  value?: TextStyle;

  /**
   * User-defined custom colours, surfaced in the colour picker and injected as
   * `--mccust_<name>` CSS custom properties on the card host. `name` is the bare
   * user name (without the prefix); `color` is an rgb/hex value.
   */
  custom_colors?: { name: string; color: string }[];

  /**
   * User-defined custom variables of any kind — sizes, shadows, font stacks,
   * whatever `extra_css` needs to share between rules (#74 Phase 7). Injected as
   * `--mccust_<name>` on the card host exactly like `custom_colors`, which is the
   * point: one prefix to learn, and a colour can be moved between the two lists
   * without every reference to it breaking.
   *
   * The shared namespace means a name used in both lists would collide silently,
   * so the editor validates uniqueness across the pair. Colours keep their own
   * list because only they can be offered in the pickers' CSS Mode.
   */
  custom_vars?: { name: string; value: string }[];

  // ── interactive control-field defaults (cascade below into per-field overrides) ──
  /** Default container box style for control fields. */
  control?: BoxStyle;
  /** Default visual style for interactive controls; per-field `control_style` wins. */
  control_style?: ControlStyle;
  /**
   * Control density (#74 Phase 7) — the three knobs that reach the control-internal
   * literals no `ControlStyle` key touches. All three sit *below* the per-field and
   * per-card `control_style` keys in the resolution chain, so a global can never
   * override someone's per-field setting.
   *
   * Leave unset and every control site keeps its own natural size; set one and the
   * whole control surface scales off it, ratios preserved. See `resolveControlDensity`.
   */
  /** Base text size for all controls, px. Fallback for the five `*_text_size` keys. */
  control_font_size?: number;
  /** A whole CSS padding value (e.g. `"5px 8px"`) for every control's field box. */
  control_padding?: string;
  /** Base gap, px. Every control gap is a fixed multiple of it. */
  control_gap?: number;
  /** Default selector option cell layout; per-field `option_*` keys win. */
  option_layout?: OptionLayout;
  /** Default button option cell layout; per-field `option_*` keys win. Independent of
   * option_layout so styling one control type can never bleed into the other. */
  button_option_layout?: OptionLayout;
  /**
   * User-authored control variants, in the same shape as the bundled
   * `controls/variants.json`. Stored in the card config rather than the bundle
   * so that shipping a release which updates variants.json cannot destroy them.
   * Portable between cards via Templates ▸ Export / Import Control Variants.
   */
  control_variants?: ControlVariantRegistry;
  /** Global display unit for device_class:power entities. Omit = auto (W below 1 kW, kW above). */
  power_unit?: 'W' | 'kW';
  /** How often to refresh statistics fields, in minutes. Default 5. */
  stat_update_interval?: number;
  /** Default tick/label color for thermometer SVG fills. */
  thermo_tick_color?: string;
  thermo_tick_font_size?: number;
  thermo_fill_opacity_above?: number;
  thermo_grid_color?: string;
  thermo_minor_tick_width?: number;
  thermo_major_tick_width?: number;
  thermo_major_tick_length?: number;
  thermo_minor_tick_length?: number;
  thermo_decimals?: number;
  thermo_temp_color?: string;
  thermo_temp_font_size?: number;
  thermo_text_position?: 'left' | 'right' | 'both';
  thermo_show_minor_tick_text?: boolean;
  /** Thermometer fill colors (liquid color below and above current temp). */
  thermo_fill_color?: string;
  thermo_fill_color2?: string;
  thermo_fill_angle?: number;
  /**
   * Thermometer (Horizontal) — independent copies of every thermo_* default above.
   * Kept separate so editing the horizontal thermometer's ticks/colours/decimals in
   * Global Defaults cannot silently change the vertical thermometer's defaults.
   */
  thermo_h_fill_color?: string;
  thermo_h_fill_color2?: string;
  thermo_h_fill_angle?: number;
  thermo_h_tick_color?: string;
  thermo_h_tick_font_size?: number;
  thermo_h_fill_opacity_above?: number;
  thermo_h_grid_color?: string;
  thermo_h_minor_tick_width?: number;
  thermo_h_major_tick_width?: number;
  thermo_h_major_tick_length?: number;
  thermo_h_minor_tick_length?: number;
  thermo_h_decimals?: number;
  thermo_h_temp_color?: string;
  thermo_h_temp_font_size?: number;
  thermo_h_text_position?: 'left' | 'right' | 'both';
  thermo_h_show_minor_tick_text?: boolean;
  /** Battery (Horizontal) fill colors. */
  battery_h_fill_color?: string;
  battery_h_fill_color2?: string;
  battery_h_fill_angle?: number;
  /** Battery (Vertical) fill colors. */
  battery_v_fill_color?: string;
  battery_v_fill_color2?: string;
  battery_v_fill_angle?: number;
  /** Tank (Cylinder) fill + wall colors. */
  tank_cylinder_fill_color?: string;
  tank_cylinder_fill_color2?: string;
  tank_cylinder_fill_angle?: number;
  tank_cylinder_fill_direction?: string;
  tank_cylinder_tank_color?: string;
  /** Tank (Water/Pressure) fill + wall colors. */
  tank_water_fill_color?: string;
  tank_water_fill_color2?: string;
  tank_water_fill_angle?: number;
  tank_water_fill_direction?: string;
  tank_water_tank_color?: string;

  tank_fermenter_fill_color?: string;
  tank_fermenter_fill_color2?: string;
  tank_fermenter_fill_angle?: number;
  tank_fermenter_fill_direction?: string;
  tank_fermenter_tank_color?: string;

  tank_cone_fill_color?: string;
  tank_cone_fill_color2?: string;
  tank_cone_fill_angle?: number;
  tank_cone_fill_direction?: string;
  tank_cone_tank_color?: string;
  /** Inverter SVG line color. */
  inverter_line_color?: string;
  /** Gauge (Arc) needle + label options. */
  gauge_arc_needle_color?: string;
  gauge_arc_label_color?: string;
  gauge_arc_label_size?: number;
  /**
   * Per-element-type "Additional CSS": raw declarations appended to the inline
   * style of every SVG fill element of that library type. Keys mirror McFill's
   * `_svgKey` (see fill.ts).
   */
  thermo_extra_css?: string;
  thermo_h_extra_css?: string;
  battery_h_extra_css?: string;
  battery_v_extra_css?: string;
  tank_cylinder_extra_css?: string;
  tank_water_extra_css?: string;
  tank_fermenter_extra_css?: string;
  tank_cone_extra_css?: string;
  inverter_extra_css?: string;
  gauge_arc_extra_css?: string;
}

// ── Extended Cards ────────────────────────────────────────────────────────────

/** Default styles applied to all extended cards (cascade below GlobalDefaults). */
export interface ExtendedCardDefaults {
  /** Number of content columns. Default 2, max 8. */
  columns?: number;
  /** Panel width as % of the canvas host. Default 70. */
  width?: number;
  /** Panel height as % of the canvas host. If omitted the panel auto-sizes (capped at 85%). */
  height?: number;
  card?: BoxStyle;
  label?: TextStyle;
  value?: TextStyle;
  field_gap?: number;
  column_gap?: number;
}

/** A popup panel opened via the open-extended action. Not canvas-positioned. */
export interface ExtendedCardConfig {
  id: string;
  name?: string;
  /** Column count override; falls back to ExtendedCardDefaults.columns (default 2). */
  columns?: number;
  /** Width % override. */
  width?: number;
  /** Height % override. */
  height?: number;
  align?: Align;
  field_gap?: number;
  column_gap?: number;
  box?: BoxStyle;
  label_style?: TextStyle;
  value_style?: TextStyle;
  fields: FieldConfig[];
}

export type VirtualOp = 'add' | 'subtract' | 'mean' | 'signed_net' | 'time_until' | 'statistic';

export interface TimeUntilTrigger {
  /** Value in same units as the mode: % (percent mode) or absolute value (absolute mode). */
  value: number;
  label: string;
}

export interface VirtualConfig {
  id: string;
  name: string;
  op: VirtualOp;
  /** Entity IDs that feed this computation (order matters for subtract/signed_net). */
  inputs: string[];
  /** Override the unit (default: inherited from inputs[0]). */
  unit?: string;
  // statistic — single source entity (mirrors the value-type field's Value section;
  // `inputs` is unused for this op).
  entity?: string;
  attribute?: string; // read this attribute of entity instead of its state
  // statistic — HA Statistics (recorder period query), same fields as FieldConfig
  stat_period?: StatPeriod;
  stat_period_n?: number;
  stat_period_start?: string;    // datetime-local string (custom range start)
  stat_period_end?: string;      // datetime-local string (custom range end)
  stat_type?: StatType;          // default 'sum'
  // statistic — advanced HA Statistics integration (YAML-generator only, not computed here)
  stat_characteristic?: StatCharacteristic;
  stat_max_age_hours?: number;
  stat_sampling_size?: number;
  stat_percentile?: number;      // 1-99, required when stat_characteristic === 'percentile'
  // time_until — mode
  mode?: 'percent' | 'absolute';
  // time_until — entities & capacity
  value_entity?: string;       // current % (percent mode) or current absolute value (absolute mode)
  rate_entity?: string;        // rate of change entity
  rate_unit_override?: string; // manual unit override if auto-detection fails
  // time_until — recalc gate: only recompute when the raw signed rate reading (entity units)
  // is above recalc_above OR below recalc_below; inside the band the last value is frozen.
  // Each optional; unset = that side never gates. Both unset = never gated.
  recalc_above?: number;
  recalc_below?: number;
  capacity?: number;           // total capacity: kWh (percent mode) or absolute units (absolute mode)
  capacity_entity?: string;    // HA entity for capacity (overrides manual capacity)
  // time_until — endpoint labels
  label_max?: string;          // label for max endpoint (100% or capacity); default 'Full'
  label_min?: string;          // label for min endpoint (0); default 'Empty'
  // time_until — extra triggers (up to 2)
  triggers?: TimeUntilTrigger[];
  // deprecated — kept for backward compat, no longer written by editor
  pct_entity?: string;
  power_entity?: string;
  capacity_kwh?: number;
  /** @deprecated */
  target_pct?: number;
  label_full?: string;
  label_empty?: string;
}

export type FlowStyle = 'dashes' | 'dots' | 'fluid' | 'particles';

export type FlowSide = 'top' | 'right' | 'bottom' | 'left' | 'center';

export interface FlowEndpoint {
  x?: number;
  y?: number;
  card?: string;
  side?: FlowSide;
  dx?: number;
  dy?: number;
}

export interface FlowConfig {
  id: string;
  name?: string;
  /** Entity whose value drives speed + direction. */
  entity?: string;
  /** Hide flow when |entity value| is below this threshold. */
  min_power?: number;
  /** Entity |value| at which animation is slowest (maps to speed_min_duration). */
  speed_min_value?: number;
  /** Seconds per cycle at speed_min_value (slow end). */
  speed_min_duration?: number;
  /** Entity |value| at which animation is fastest (maps to speed_max_duration). */
  speed_max_value?: number;
  /** Seconds per cycle at speed_max_value (fast end). */
  speed_max_duration?: number;
  /** Flip the flow direction (a negative value normally reverses). */
  invert?: boolean;
  /** 2+ points; middle points are direction nodes. */
  points: FlowEndpoint[];
  /** default 'dashes' */
  style?: FlowStyle;
  /** Forward-direction color (positive entity value). Default '#00d4ff'. Replaces legacy 'color'. */
  forward_color?: string;
  /** Reverse-direction color (negative entity value). Defaults to forward_color when unset. */
  reverse_color?: string;
  /** @deprecated use forward_color */
  color?: string;
  /** px (design), default 3 */
  width?: number;
  /** seconds per cycle, default 2 */
  duration?: number;
  /** 'particles' style, default 6 */
  particle_count?: number;
  /** corner handling, default 'straight' */
  curve?: 'straight' | 'rounded';
}

export interface MosaicCanvasConfig extends LovelaceCardConfig {
  type: string; // 'custom:mosaic-canvas'
  background?: BackgroundConfig;
  canvas?: CanvasConfig;
  /** Number of EVs; selects background variant. */
  ev_count?: number;
  defaults?: GlobalDefaults;
  extended_card_defaults?: ExtendedCardDefaults;
  virtuals?: VirtualConfig[];
  zones?: ZoneConfig[];
  cards: CardConfig[];
  extended_cards?: ExtendedCardConfig[];
  embedded_cards?: EmbeddedCardConfig[];
  flows?: FlowConfig[];
  /**
   * Config Health rows (#65) the user has chosen to hide, by stable issue id
   * (`<check>|<container ref>|<slot>`). Editor-only bookkeeping — the runtime
   * never reads it. It lives in the config rather than in browser storage so an
   * ignore survives a cache clear, follows the card to another device, and is a
   * normal undoable edit. Excluded from the Health screen's own
   * unreachable-key check along with the rest of the config root.
   */
  health_ignore?: string[];
}
