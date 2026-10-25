import { html, css, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { TAG_SELECTOR } from '../tags';
import { McControl, type ResolvedOption, type ControlValue } from './base';
import { resolveControlStyle, deriveAttributeFromOptionsAttribute } from '../view';
import { gestures, type GestureKind } from '../gestures';
import type { ActionConfig, OptionIconPosition, OptionPartPosition, TextStyle } from '../types';

/**
 * Selector control field — one or more segmented lines of option cells.
 *
 * An option is either a **value option** (writes its value to the field's
 * entity, the original behaviour) or an **entity option** (`entity` set: it acts
 * on that entity with the domain default action and reflects its state). Both
 * kinds may appear in the same selector.
 *
 * Options group into lines via `option.line`, and each cell can stack up to
 * three rows (`option_rows`) — typically icon / label / state.
 */
@customElement(TAG_SELECTOR)
export class McSelector extends McControl {
  /**
   * Optimistic per-entity state, held until hass confirms: a boolean for a
   * toggled entity option, or a specific value for an entity shared by several
   * value-select options (each with its own `tap_action`, writing a distinct
   * value to the same entity).
   */
  @state() private _pendingEnt: Record<string, ControlValue> = {};

  static override styles = css`
    :host { display: inline-block; }
    /* --mc-line-gap is written inline only when the options are separated, so an
       unseparated selector's line gap falls through to the density knob. */
    .lines { display: inline-flex; flex-direction: column; gap: var(--mc-line-gap, var(--mc-ctl-gap, 4px)); }
    .row {
      display: inline-flex; box-sizing: border-box; border-radius: var(--mc-radius, 7px); overflow: hidden;
      border: var(--mc-bw, 1px) solid var(--mc-border, rgba(255, 255, 255, 0.25));
    }
    .row.wrap { flex-wrap: wrap; }
    /* Separated: the options become discrete buttons, so the shared outline and
       the divider lines between segments both go away. */
    .row.sep {
      border: none; overflow: visible; border-radius: 0;
      gap: var(--mc-opt-gap, 0px);
    }
    .opt {
      display: inline-flex; align-items: center; gap: calc(var(--mc-ctl-gap, 4px) * 1.25);
      padding: var(--mc-opt-pad, var(--mc-ctl-pad, 5px 10px)); cursor: pointer;
      font-size: var(--mc-ts, 13px); color: var(--mc-text, currentColor); background: var(--mc-bg, transparent); border: none;
      border-right: 1px solid var(--mc-border, rgba(255, 255, 255, 0.25)); white-space: nowrap;
      font-family: inherit;
      /* Each option is its own content width — never stretched to share the line
         evenly with its neighbours, however many are on it. */
      flex: 0 0 auto;
    }
    .opt ha-icon, .opt ha-state-icon {
      color: var(--mc-icon, currentColor);
      --mdc-icon-size: var(--mc-icon-size, 18px);
    }
    .opt.sel ha-icon, .opt.sel ha-state-icon { color: var(--mc-selected-icon, currentColor); }
    /* The label inherits the cell's font-size and color; the state value has its own. */
    .part.state { font-size: var(--mc-state-size, inherit); color: var(--mc-state-color, currentColor); }
    .opt.sel .part.state { color: var(--mc-selected-state-color, currentColor); }
    /* Stacked cells centre their rows; width follows their own content. */
    .opt.stacked {
      flex-direction: column; align-items: center; justify-content: center;
      gap: calc(var(--mc-ctl-gap, 4px) * 0.5);
    }
    .opt:last-child { border-right: none; }
    /* Joined: the frame's radius shapes the container's outer corners only — the
       row clips its children, so the end cells round and every internal corner
       stays square. The cells must never carry the radius themselves. */
    .row:not(.sep) .opt { border-radius: 0; }
    .row.sep .opt { border-right: none; border-radius: var(--mc-opt-radius, 7px); box-sizing: border-box; }
    .row.sep.bordered .opt {
      border: var(--mc-opt-bw, 1px) solid var(--mc-opt-border, rgba(255, 255, 255, 0.25));
    }
    .opt.sel { background: var(--mc-selected, #00d4ff); color: var(--mc-selected-text, var(--text-primary-color, #fff)); }
    .opt[disabled] { cursor: default; opacity: 0.5; }
    /* One horizontal line inside a cell: the label's line, or an above/below line. */
    .cline {
      display: inline-flex; align-items: center; justify-content: center;
      gap: calc(var(--mc-ctl-gap, 4px) * 1.25); line-height: 1.15;
    }
    .part { display: inline-flex; align-items: center; }
    :host(:focus-visible) .row { outline: 2px solid var(--mc-accent, #00d4ff); outline-offset: 2px; }
  `;

  protected readValue(): string | undefined {
    const so = this.stateObj;
    if (!so) return undefined;
    const attr = this.field?.read_attribute ?? deriveAttributeFromOptionsAttribute(this.field?.options_attribute);
    if (attr) return so.attributes?.[attr] != null ? String(so.attributes[attr]) : undefined;
    return so.state;
  }

  /** Clear per-entity optimistic state once hass agrees with it. */
  protected override updated(changed: PropertyValues): void {
    super.updated(changed);
    if (!changed.has('hass')) return;
    const ids = Object.keys(this._pendingEnt);
    if (!ids.length) return;
    const next = { ...this._pendingEnt };
    let dirty = false;
    for (const id of ids) {
      const pending = next[id];
      const actual = typeof pending === 'boolean'
        ? this.entityActive(id, this._attrForEntity(id))
        : this._rawState(id, this._attrForEntity(id));
      if (actual === pending) { delete next[id]; dirty = true; }
    }
    if (dirty) this._pendingEnt = next;
  }

  /**
   * Active = the option entity is on (optimistic first) for a toggled entity
   * option, or — when the option also carries its own `tap_action` — that
   * entity's current value (optimistic first) equals this option's own value,
   * so several options can share one entity and only the matching one lights up.
   */
  private _isActive(o: ResolvedOption, current: unknown): boolean {
    if (o.entity) {
      const pending = this._pendingEnt[o.entity];
      if (o.tap_action) {
        return (pending !== undefined ? pending : this._rawState(o.entity, o.attribute)) === o.value;
      }
      return (pending as boolean | undefined) ?? this.entityActive(o.entity, o.attribute);
    }
    return o.value === current;
  }

  /** The attribute configured for whichever option currently targets this entity (reconciliation has only the id). */
  private _attrForEntity(entityId: string): string | undefined {
    return this.options().find((o) => o.entity === entityId)?.attribute;
  }

  /** Raw state (or attribute) string for an entity, for equality-based active checks. */
  private _rawState(entityId: string, attribute?: string): string | undefined {
    const so = this.hass?.states[entityId];
    if (!so) return undefined;
    const raw = attribute ? so.attributes?.[attribute] : so.state;
    return raw != null ? String(raw) : undefined;
  }

  /**
   * Substitute '{{value}}' in an action's service_data with this option's own value.
   * Matches ha-service-control's own template marker ({{ / {% trips its template
   * mode, letting the field take free text) — but a plain hass.callService() call
   * from a dashboard never goes through HA's Jinja engine, so we resolve it
   * ourselves before firing the action rather than sending it through literally.
   */
  private _resolveAction(action: ActionConfig, value: string): ActionConfig {
    if (action.action !== 'call-service' || !action.service_data) return action;
    const token = /\{\{\s*value\s*\}\}/g;
    const data: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(action.service_data)) {
      data[k] = typeof v === 'string' ? v.replace(token, value) : v;
    }
    return { ...action, service_data: data };
  }

  /**
   * Run one gesture on an option.
   *
   * Only a tap can replace the option's write; hold and double tap are additions,
   * so they dispatch and then stop without falling through to the write below.
   */
  private _activate(o: ResolvedOption, kind: GestureKind = 'tap'): void {
    if (kind !== 'tap') {
      const cfg = kind === 'hold' ? o.hold_action : o.double_tap_action;
      if (!cfg) return;
      this.onAction?.(
        kind === 'hold'
          ? { hold_action: this._resolveAction(cfg, o.value) }
          : { double_tap_action: this._resolveAction(cfg, o.value) },
        o.entity ?? this.entityId,
        kind,
      );
      return;
    }
    // An option's own tap action replaces its normal write entirely.
    if (o.tap_action) {
      if (o.entity) {
        // Optimistically claim this entity's pending value so only this option
        // — not siblings sharing the same entity — shows active until confirmed.
        this._pendingEnt = { ...this._pendingEnt, [o.entity]: o.value };
      }
      this.onAction?.({ tap_action: this._resolveAction(o.tap_action, o.value) }, o.entity ?? this.entityId, 'tap');
      return;
    }
    if (o.entity) {
      const next = !this._isActive(o, undefined);
      this._pendingEnt = { ...this._pendingEnt, [o.entity]: next };
      this.commit(next, o.entity);
      return;
    }
    if (!this.entityId) return;
    this.commit(o.value);
  }

  /**
   * Inline style for one part of a cell — weight, family, letter-spacing only.
   *
   * `font_size` and `color` are deliberately ignored: both are owned by
   * ControlStyle (button_group_text/icon/state_size and the active/inactive colour
   * keys), applied as CSS variables on the cell. Emitting them inline here would
   * beat those variables — colour would also defeat the active/inactive state
   * change. Configs written before this split may still carry either; honouring
   * them would override a value the editor no longer shows.
   */
  private _partStyle(ts: TextStyle | undefined): string {
    if (!ts) return '';
    const out: string[] = [];
    if (ts.font_weight != null) out.push(`font-weight:${ts.font_weight}`);
    if (ts.font_family) out.push(`font-family:${ts.font_family}`);
    if (ts.letter_spacing != null) out.push(`letter-spacing:${ts.letter_spacing}px`);
    const extra = (ts.extra_css ?? '').trim().replace(/;+\s*$/, '');
    if (extra) out.push(extra);
    return out.join(';');
  }

  /**
   * The entity's state, formatted by HA when it can, else state + unit.
   * With `attribute` set, reads that attribute instead — `formatEntityState`
   * formats the entity's primary state, not an arbitrary attribute, so it's
   * skipped in that case.
   */
  private _stateText(entityId: string | undefined, attribute?: string): string {
    const so = entityId ? this.hass?.states[entityId] : undefined;
    if (!so) return '';
    const unit = so.attributes?.unit_of_measurement;
    if (attribute) {
      const v = so.attributes?.[attribute];
      if (v == null) return '';
      return unit ? `${v} ${unit}` : String(v);
    }
    const h = this.hass as unknown as { formatEntityState?: (s: unknown) => string };
    if (typeof h?.formatEntityState === 'function') {
      try { return h.formatEntityState(so); } catch { /* fall through to raw */ }
    }
    return unit ? `${so.state} ${unit}` : so.state;
  }

  /**
   * The icon for an option: an explicit icon wins; otherwise an entity option
   * derives its glyph from the entity's own state (bulb on/off, cover
   * open/closed) via ha-state-icon.
   */
  private _optionIcon(o: ResolvedOption, style?: TextStyle): TemplateResult | typeof nothing {
    // Size and colour both come from ControlStyle (button_group_icon_size /
    // _icon_color, with active/inactive states); only weight/family are inline.
    const css = this._partStyle(style);
    if (o.icon) return html`<ha-icon icon=${o.icon} style=${css || nothing}></ha-icon>`;
    const so = o.entity ? this.hass?.states[o.entity] : undefined;
    if (so) return html`<ha-state-icon .hass=${this.hass} .stateObj=${so} style=${css || nothing}></ha-state-icon>`;
    return nothing;
  }

  /**
   * Lay a cell out around the label, which is always the anchor.
   * `above`/`below` parts each take their own line; `left`/`right` join the
   * label's line. Any combination of the four therefore composes without
   * special cases — icon above + state below is the old stacked look.
   */
  protected renderCell(o: ResolvedOption, current: unknown, cellStyle = ''): TemplateResult {
    const f = this.field;
    const active = this._isActive(o, current);
    // A value option still needs the field entity to write to; an entity option
    // is self-sufficient, so it stays enabled regardless. An option whose own
    // tap action opens a popover needs neither — that action replaces the write
    // (see `_activate`) — so it stays enabled too, and just renders unselected.
    const disabled = o.tap_action?.action === 'open-extended'
      ? false
      : o.entity ? !this.hass?.states[o.entity] : !this.entityId;

    // Three-level cascade: option → field → global option_layout → built-in.
    // Selector and Button read independent GlobalDefaults objects (option_layout /
    // button_option_layout) so a global default set for one can never affect the
    // other — McButton extends McSelector and inherits this method unmodified, so
    // f?.type is what actually distinguishes them at render time.
    const g = f?.type === 'button' ? this.defaults?.button_option_layout : this.defaults?.option_layout;
    const iconPos: OptionIconPosition = o.icon_position ?? f?.option_icon_position ?? g?.icon_position ?? 'left';
    const statePos: OptionPartPosition = o.state_position ?? f?.option_state_position ?? g?.state_position ?? 'below';
    const showState = o.show_state ?? f?.option_show_state ?? g?.show_state ?? false;
    const iconStyle = f?.option_icon_style ?? g?.icon_style;
    const labelStyle = f?.option_label_style ?? g?.label_style;
    const stateStyle = f?.option_state_style ?? g?.state_style;

    // 'none' is decided before the icon is even built: an entity option derives
    // a glyph from its entity's state, so `icon !== nothing` is not a question
    // the user's answer can reach — this is the only way to say "no icon here".
    const icon = iconPos === 'none' ? nothing : this._optionIcon(o, iconStyle);
    const stateAttr = o.entity ? o.attribute : f?.read_attribute;
    const stateText = showState ? this._stateText(o.entity ?? this.entityId, stateAttr) : '';
    const parts: { pos: OptionPartPosition; node: TemplateResult }[] = [];
    if (icon !== nothing && iconPos !== 'none') parts.push({ pos: iconPos, node: html`<span class="part">${icon}</span>` });
    if (stateText) {
      parts.push({
        pos: statePos,
        node: html`<span class="part state" style=${this._partStyle(stateStyle) || nothing}>${stateText}</span>`,
      });
    }
    const at = (p: OptionPartPosition): TemplateResult[] => parts.filter((x) => x.pos === p).map((x) => x.node);

    const label = o.label
      ? html`<span class="part" style=${this._partStyle(labelStyle) || nothing}>${o.label}</span>`
      : nothing;
    const middle = html`<span class="cline">${at('left')}${label}${at('right')}</span>`;
    const above = at('above');
    const below = at('below');
    const stacked = above.length > 0 || below.length > 0;

    // Gestures rather than @click: an option can carry hold and double-tap
    // actions of its own, and the engine keeps a press alive across the
    // re-renders a hass state tick causes underneath it.
    const gest = gestures({
      hasHold: !!o.hold_action,
      hasDouble: !!o.double_tap_action,
      fire: (kind) => this._activate(o, kind),
    });

    return html`
      <button class="opt ${stacked ? 'stacked' : ''} ${active ? 'sel' : ''}"
        role=${o.entity ? 'switch' : 'radio'}
        aria-checked=${active ? 'true' : 'false'}
        ?disabled=${disabled}
        style=${cellStyle || nothing}
        @pointerdown=${gest.onPointerDown}
        @pointerup=${gest.onPointerUp}
        @pointerleave=${gest.onPointerLeave}
        @pointercancel=${gest.onPointerCancel}
      >
        ${above.map((n) => html`<span class="cline">${n}</span>`)}
        ${middle}
        ${below.map((n) => html`<span class="cline">${n}</span>`)}
      </button>
    `;
  }

  protected override renderControl(): TemplateResult {
    const cs = resolveControlStyle(this.field ?? ({ id: '', type: 'button_group' } as NonNullable<typeof this.field>), this.defaults);
    const current = this.displayValue();
    const opts = this.options();
    const wrap = this.field?.button_group_layout === 'wrap';
    const lines = this.optionLines(opts);
    // The gap is the only master switch, matching the editor: with no gap the
    // options stay joined inside the segmented frame, so the frame's border and
    // radius shape the container alone. A per-option border without a gap used to
    // detach them here, which handed the frame's radius to all four corners of
    // every cell — the frame is the only thing that should be rounded when joined.
    const gap = cs.button_group_option_gap;
    const sep = gap > 0;
    const pad = cs.button_group_option_padding;
    const vars = `--mc-accent:${cs.accent_color};--mc-border:${cs.button_group_border_color};--mc-bg:${cs.button_group_bg_paint};`
      + `--mc-radius:${cs.button_group_radius}px;--mc-ts:${cs.button_group_text_size}px;`
      + `--mc-selected:${cs.button_group_selected_paint};--mc-selected-text:${cs.button_group_selected_text_color};`
      + `--mc-text:${cs.button_group_text_color};--mc-icon:${cs.button_group_icon_color};`
      + `--mc-selected-icon:${cs.button_group_selected_icon_color};--mc-bw:${cs.button_group_border_width}px;`
      + `--mc-state-color:${cs.button_group_state_color};--mc-selected-state-color:${cs.button_group_selected_state_color};`
      + `--mc-icon-size:${cs.button_group_icon_size}px;--mc-state-size:${cs.button_group_state_size}px;`
      + `--mc-opt-border:${cs.button_group_option_border_color};--mc-opt-bw:${cs.button_group_option_border_width}px;`
      + `--mc-opt-radius:${cs.button_group_option_radius}px;`
      + `--mc-opt-gap:${gap}px;`
      + (sep ? `--mc-line-gap:${gap}px;` : '')
      + (pad != null ? `--mc-opt-pad:${pad}px;` : '');

    // Extra CSS is per separated cell, so detached option buttons can be fully styled.
    const cellExtra = sep ? (cs.button_group_option_extra_css ?? '') : '';
    return html`
      <div class="lines" style="${vars}">
        ${lines.map((line) => html`
          <div class="row ${wrap ? 'wrap' : ''} ${sep ? 'sep' : ''} ${sep && cs.button_group_option_border ? 'bordered' : ''}" role="radiogroup">
            ${line.map((o) => this.renderCell(o, current, cellExtra))}
          </div>
        `)}
      </div>
    `;
  }
}
