// Runtime seed defaults — fetched from defaults.json deployed alongside the card.
// Edit defaults.json on the HA server to change values without rebuilding.

import type { Align, CardConfig, CardLayoutMode, ControlStyle, GlobalDefaults, GraphType, GraphCurve, GraphLegendPos, GraphTimelineLabel, StatPeriod, StatSamplePeriod } from './types';

export interface SeedDefaults {
  field_gap: number;
  column_gap: number;
  extended_field_gap: number;
  columns: number;
  card_columns: number;
  /** Field placement a card starts in (#102). */
  card_layout_mode: CardLayoutMode;
  /** Columns a card gets when it is switched to grid field placement (#102). */
  card_grid_columns: number;
  /** Rows a card gets when it is switched to grid field placement (#102). */
  card_grid_rows: number;
  /**
   * px gap between grid rows (#102). Deliberately NOT shipped in defaults.json —
   * absent means it inherits `field_gap`, which is the behaviour the card level
   * already has. Shipping a number here would break that inheritance for every
   * deployment (CSS_REFERENCE ▸ "Absent = inherits the next tier down").
   */
  card_grid_row_gap: number;
  /**
   * The Mosaic card's own gaps (#102). Also deliberately unshipped: absent means
   * they inherit the shipped `field_gap`/`column_gap`, so splitting the keys
   * changes no existing dashboard's spacing on upgrade.
   */
  card_field_gap: number;
  card_column_gap: number;
  align: Align;
  anchor: string;
  label_position: string;
  /**
   * Placement of a label field's picked icon (#105). Value fields deliberately
   * do not read this seed: their icon is opt-in per field, and a seeded
   * position would switch entity icons on for every value field on upgrade.
   */
  icon_position: string;
  font_size: number;
  icon_size: number;

  box_border_width: number;
  box_border_color: string;
  box_radius: number;
  box_padding: number;
  box_background_alpha: number;
  // Shadow parts (#108). Inert until a box ticks `shadow` — like
  // `box_border_width`, they only give the enabled state its starting look.
  // `box_shadow_mode` picks the form (#112): 'drop' is offset and directional,
  // 'box' an even halo on every side — the replacement for Glow (#111).
  box_shadow_mode: string;
  box_shadow_x: number;
  box_shadow_y: number;
  box_shadow_blur: number;
  box_shadow_spread: number;
  box_shadow_color: string;

  fill_color: string;
  fill_direction: string;
  fill_min: number;
  fill_max: number;

  gauge_label_color: string;
  gauge_label_size: number;

  thermo_tick_color: string;
  thermo_tick_font_size: number;
  thermo_fill_opacity_above: number;
  thermo_grid_color: string;
  thermo_minor_tick_width: number;
  thermo_major_tick_width: number;
  thermo_major_tick_length: number;
  thermo_minor_tick_length: number;
  thermo_decimals: number;
  thermo_temp_color: string;
  thermo_temp_font_size: number;
  thermo_text_position: string;
  thermo_show_minor_tick_text: boolean;
  thermo_fill_color: string;
  thermo_h_fill_color: string;
  // Gradient ends and their angles are deliberately absent from defaults.json:
  // seeding a `…_fill_color2` would give every element a gradient nobody asked
  // for, and an angle means nothing without one. Unset angle = the gradient runs
  // along the fill direction, as it did before angles existed.
  thermo_fill_color2?: string;
  thermo_fill_angle?: number;
  thermo_h_fill_color2?: string;
  thermo_h_fill_angle?: number;

  // Thermometer (Horizontal) — independent seed values mirroring the thermo_* block above.
  thermo_h_tick_color: string;
  thermo_h_tick_font_size: number;
  thermo_h_fill_opacity_above: number;
  thermo_h_grid_color: string;
  thermo_h_minor_tick_width: number;
  thermo_h_major_tick_width: number;
  thermo_h_major_tick_length: number;
  thermo_h_minor_tick_length: number;
  thermo_h_decimals: number;
  thermo_h_temp_color: string;
  thermo_h_temp_font_size: number;
  thermo_h_text_position: string;
  thermo_h_show_minor_tick_text: boolean;

  battery_h_fill_color: string;
  battery_h_fill_color2?: string;
  battery_h_fill_angle?: number;
  battery_v_fill_color: string;
  battery_v_fill_color2?: string;
  battery_v_fill_angle?: number;

  tank_cylinder_fill_color: string;
  tank_cylinder_fill_color2?: string;
  tank_cylinder_fill_angle?: number;
  tank_cylinder_fill_direction: string;
  tank_cylinder_tank_color?: string;

  tank_water_fill_color: string;
  tank_water_fill_color2?: string;
  tank_water_fill_angle?: number;
  tank_water_fill_direction: string;
  tank_water_tank_color?: string;

  tank_fermenter_fill_color: string;
  tank_fermenter_fill_color2?: string;
  tank_fermenter_fill_angle?: number;
  tank_fermenter_fill_direction: string;
  tank_fermenter_tank_color?: string;

  tank_cone_fill_color: string;
  tank_cone_fill_color2?: string;
  tank_cone_fill_angle?: number;
  tank_cone_fill_direction: string;
  tank_cone_tank_color?: string;

  inverter_line_color?: string;

  gauge_arc_needle_color: string;
  gauge_arc_label_color: string;
  gauge_arc_label_size: number;

  graph_bar_v_width: number;
  graph_bar_v_height: number;
  graph_gauge_width: number;
  graph_time_chart_width: number;
  graph_time_chart_height: number;
  graph_type: GraphType;
  graph_show_axes: boolean;
  graph_show_legend: boolean;
  graph_stroke_width: number;
  graph_fill_opacity: number;
  graph_min: number;
  graph_max: number;
  graph_hours: number;
  /**
   * Graph Data (#123). The window a graph field is drawn over and the bucket
   * resolution inside it — Home Assistant's card-level `days_to_show` and
   * `period`, at the level a Mosaic field corresponds to.
   *
   * Seeded, unlike `graph_tick_count`, because there is nothing for a chart to
   * derive them from: a window has to come from somewhere, and before this it
   * came from `graph_hours` and a span heuristic no user could see.
   */
  graph_stat_period: StatPeriod;
  graph_sample_period: StatSamplePeriod;
  graph_include_zero: boolean;
  graph_curve: GraphCurve;
  graph_points: boolean;
  graph_last_point: boolean;
  graph_bar_labels: boolean;
  graph_legend_position: GraphLegendPos;
  graph_gauge_ticks: boolean;
  graph_gauge_sweep: number;
  graph_unavailable_color: string;
  graph_show_state_names: boolean;
  graph_timeline_label: GraphTimelineLabel;
  /**
   * Gridline count and decimal precision are **deliberately absent from
   * `defaults.json`** — the `graph_label_size` precedent. Unset, each chart
   * derives its gridlines from its own height and its decimals from the
   * entity; seeding either would freeze that derivation for everyone on
   * upgrade, so a tall chart would stop earning a denser axis.
   */
  graph_tick_count?: number;
  graph_precision?: number;

  // Graph chrome. graph_label_size is intentionally absent from defaults.json
  // so each chart keeps its own natural label size until a user sets one.
  graph_axis_color: string;
  graph_grid_color: string;
  graph_zero_line_color: string;
  graph_baseline_color: string;
  graph_label_color: string;
  /**
   * Tick colour (#123). **Deliberately absent from `defaults.json`** — unset it
   * resolves to `graph_label_color`, so the two axis text colours ship as one
   * and only diverge for someone who wants them to.
   */
  graph_tick_color?: string;
  graph_label_size?: number;
  graph_unit_label_color: string;
  graph_legend_label_color: string;
  graph_bar_label_color: string;
  graph_gauge_track_color: string;
  graph_gauge_value_color: string;
  graph_palette: string[];

  flow_color: string;
  flow_width: number;
  flow_style: string;
  flow_curve: 'straight' | 'rounded';
  flow_duration: number;
  flow_particle_count: number;
  flow_speed_min_duration: number;
  flow_speed_max_duration: number;

  virtual_mode: string;
  virtual_label_max: string;
  virtual_label_min: string;

  stat_update_interval: number;
  stat_type: string;
  stat_type_history: string;
  stat_period_minutes_n: number;
  stat_period_hours_n: number;
  stat_period_days_n: number;
  stat_period_months_n: number;

  mono_font_family: string;

  // Card text + overlay chrome (#74 Phase 6). Card-wide, so these have a
  // user-global tier and no per-field one.
  card_text_color: string;
  overlay_scrim_color: string;
  extended_scrim_color: string;
  // overlay_panel_radius retired in #89 — an overlay clips at the radius of the
  // card it shows (overlayPanelRadius), so there is nothing left to seed.
  close_button_bg: string;
  close_button_hover_bg: string;
  close_button_text_color: string;
  close_button_border_color: string;

  /**
   * Installation-wide control chrome (#74 Phase 7). Nested rather than ~90 flat
   * keys because `resolveControlStyle` resolves the whole set through a single
   * `pick()`, so one seed object gives every `ControlStyle` key a fourth tier for
   * two lines of code. It reverses the Phase 6 note that `control_style` is
   * deliberately three-tier — see STYLING.md §2.
   *
   * `defaults.json` ships **numerics only**. A seeded colour would resolve before
   * any HA tier and permanently pin `accent_color` off `--accent-color` (§2's
   * trap); the type stays wide so a deployer who wants that can still opt in.
   *
   * It also omits every *derived* key — `toggle_thumb_radius`, `slider_thumb_width`,
   * `slider_thumb_radius`, the two `*_state_size`, the three `button_group_option_border*`
   * and both `*_option_padding`. Those resolve from a sibling key when unset
   * (a thumb radius is half its size, a state size tracks its label), and seeding
   * a value would freeze the derivation: resizing the thumb would stop rounding it.
   */
  control_style?: Partial<ControlStyle>;

  /**
   * Control density (#74 Phase 7). All three are **deliberately absent from
   * `defaults.json`** — the `graph_label_size` precedent from Phase 6. Unset,
   * every control site keeps its own natural literal; set, one value governs the
   * whole control surface. Seeding a value here would flatten the deliberate
   * size hierarchy for everyone on upgrade.
   */
  control_font_size?: number;
  control_padding?: string;
  control_gap?: number;

  background_fit: string;
  sun_entity: string;
  canvas_fallback_width: number;

  decimals_w: number;
  decimals_wh: number;
  decimals_mwh: number;
}

let _seed: Partial<SeedDefaults> = {};

export const seedReady: Promise<void> = fetch(new URL(/* @vite-ignore */ './defaults.json', import.meta.url).href)
  .then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  })
  .then((data: Partial<SeedDefaults>) => {
    _seed = data;
  })
  .catch((err: unknown) => {
    console.error(
      '[mosaic-canvas-card] Failed to load defaults.json — card-level and field-level overrides still apply.',
      err,
    );
  });

export function sd<K extends keyof SeedDefaults>(key: K): SeedDefaults[K] | undefined {
  return _seed[key] as SeedDefaults[K] | undefined;
}

/**
 * A card's field placement, resolved card → global → seed (#102).
 *
 * It lives here rather than being spelled out at each call site because the
 * renderer, the editor and Config Health all have to agree on it — a card that
 * renders as a grid while the editor still shows it the flow rows is exactly the
 * drift this single reader exists to prevent.
 */
export function cardLayoutMode(
  card: Pick<CardConfig, 'layout_mode'> | undefined,
  defaults: Pick<GlobalDefaults, 'card_layout_mode'> | undefined,
): CardLayoutMode {
  return card?.layout_mode ?? defaults?.card_layout_mode ?? sd('card_layout_mode') ?? 'flow';
}
