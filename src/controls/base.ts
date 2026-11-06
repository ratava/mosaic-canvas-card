// Shared base class for interactive control fields (toggle, slider, …).
//
// Control fields differ from display fields in two ways: they hold local,
// optimistic UI state (so the control moves instantly, before Home Assistant
// confirms), and they report value changes back to the host via `onChange`.
// The host owns `hass.callService`; these elements never call services directly.

import { LitElement, html, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import type { FieldConfig, GlobalDefaults, ChangeCallback, ControlLabel, OptionIconPosition, OptionPartPosition, ActionConfig } from '../types';
import { boxCss, controlDensityVars, resolveControlBox, resolveControlDensity, textCss, type ActionCallback } from '../view';
import type { VirtualMap } from '../format';

export type ControlValue = string | number | boolean;

/** An option after resolution from either the manual list or the entity attribute. */
export interface ResolvedOption {
  value: string;
  label: string;
  icon?: string;
  /** Per-option entity, when the option acts on its own entity. */
  entity?: string;
  /** Read this attribute of the option's entity instead of its state. */
  attribute?: string;
  /** 1-based line for 2-D grouping. */
  line?: number;
  // Per-option layout overrides; undefined = inherit the field's option_* default.
  icon_position?: OptionIconPosition;
  show_state?: boolean;
  state_position?: OptionPartPosition;
  /** Selector only. Runs instead of the option's normal write when set. */
  tap_action?: ActionConfig;
  /** Additions rather than replacements — see ControlOption. */
  hold_action?: ActionConfig;
  double_tap_action?: ActionConfig;
}

export abstract class McControl extends LitElement {
  @property({ attribute: false }) field?: FieldConfig;
  @property({ attribute: false }) defaults?: GlobalDefaults;
  @property({ attribute: false }) hass?: HomeAssistant;
  @property({ attribute: false }) onChange?: ChangeCallback;
  @property({ attribute: false }) onAction?: ActionCallback;
  @property({ attribute: false }) virtuals?: VirtualMap;

  /** Optimistic value: what the control shows until the underlying state catches up. */
  @state() protected _pending?: ControlValue;

  /** True while the user is actively interacting (suppresses hass reconciliation). */
  protected _editing = false;

  protected get entityId(): string | undefined {
    return this.field?.entity;
  }

  protected get stateObj() {
    const id = this.entityId;
    return id && this.hass ? this.hass.states[id] : undefined;
  }

  /** Authoritative current value read from hass, normalised to the UI range. */
  protected abstract readValue(): ControlValue | undefined;

  /** The value the control should render: optimistic if pending, else authoritative. */
  protected displayValue(): ControlValue | undefined {
    return this._pending !== undefined ? this._pending : this.readValue();
  }

  /**
   * Report a new UI value to the host and hold it optimistically until confirmed.
   * `targetEntity` routes the write to a per-option entity instead of the field's;
   * that case keeps its own optimistic state in the subclass, so `_pending`
   * (which tracks the field entity) is left alone.
   */
  protected commit(value: ControlValue, targetEntity?: string): void {
    if (!targetEntity) this._pending = value;
    if (this.field) this.onChange?.(this.field, value, targetEntity);
  }

  /** Whether an optimistic value is close enough to the authoritative one to clear it. */
  protected reconciled(pending: ControlValue, authoritative: ControlValue | undefined): boolean {
    if (authoritative === undefined) return false;
    if (typeof pending === 'number' && typeof authoritative === 'number') {
      return Math.abs(pending - authoritative) <= 1;
    }
    return pending === authoritative;
  }

  protected override updated(changed: PropertyValues): void {
    if (changed.has('hass') && !this._editing && this._pending !== undefined) {
      if (this.reconciled(this._pending, this.readValue())) this._pending = undefined;
    }
  }

  /**
   * Resolved option list for dropdown / selector fields. Source 'entity' (default)
   * reads the entity's `options` attribute (input_select / select); 'manual' uses
   * the field's own `options`. Falls back to manual options when the entity has none.
   */
  protected options(): ResolvedOption[] {
    const f = this.field;
    const manual: ResolvedOption[] = (f?.options ?? []).map((o) => ({
      // An entity option needs no value; fall back to the entity id so every
      // option still has a stable key for selection state and list rendering.
      value: o.value ?? o.entity ?? '',
      // No label means no label text — never the value or the entity id standing
      // in for one. An option with only an icon, or only a state value, is a
      // deliberate configuration, and a raw `light.kitchen` is never what was meant.
      label: o.label ?? '',
      icon: o.icon,
      entity: o.entity,
      attribute: o.attribute,
      line: o.line,
      icon_position: o.icon_position,
      show_state: o.show_state,
      state_position: o.state_position,
      tap_action: o.tap_action,
      hold_action: o.hold_action,
      double_tap_action: o.double_tap_action,
    }));
    if (f?.options_source === 'manual') return manual;
    const attr = this.stateObj?.attributes?.[f?.options_attribute ?? 'options'];
    if (Array.isArray(attr) && attr.length) return attr.map((o) => ({ value: String(o), label: String(o) }));
    return manual;
  }

  /** Group options into 1-based lines, preserving order. Unset `line` = line 1. */
  protected optionLines(opts: ResolvedOption[]): ResolvedOption[][] {
    const byLine = new Map<number, ResolvedOption[]>();
    for (const o of opts) {
      const n = o.line && o.line > 0 ? Math.floor(o.line) : 1;
      const list = byLine.get(n);
      if (list) list.push(o); else byLine.set(n, [o]);
    }
    return [...byLine.keys()].sort((a, b) => a - b).map((k) => byLine.get(k)!);
  }

  /** Whether a per-option entity counts as "active" (drives selected styling + toggle direction). */
  protected entityActive(entityId: string, attribute?: string): boolean {
    const so = this.hass?.states[entityId];
    if (!so) return false;
    const raw = attribute ? so.attributes?.[attribute] : so.state;
    if (raw == null) return false;
    const s = String(raw).toLowerCase();
    return s !== 'off' && s !== 'unavailable' && s !== 'unknown' && s !== 'closed' && s !== 'idle' && s !== 'false' && s !== '0';
  }

  /** Container box style resolved from the cascade (global control box → per-field control_box + extra_css). */
  protected containerStyle(): string {
    if (!this.field) return '';
    return boxCss(resolveControlBox(this.field, this.defaults));
  }

  /**
   * `display` for the container-box wrapper the base render draws around the
   * whole control. Inline controls shrink to their content; full-width controls
   * (slider, input) override this to `block`. Kept here so the box wraps the
   * icon rows and slider track labels too — the box is the *control's* frame,
   * not just its interactive body.
   */
  protected containerDisplay(): string {
    return 'inline-flex';
  }

  /** Render an icon + text label with its own text style (shared by rows and slider points). */
  protected labelInline(l: ControlLabel): TemplateResult {
    const iconSize = l.style?.font_size ?? 16;
    const iconColor = l.style?.color ? `color:${l.style.color};` : '';
    return html`
      ${l.icon ? html`<ha-icon icon=${l.icon} style="--mdc-icon-size:${iconSize}px;${iconColor}"></ha-icon>` : nothing}
      ${l.text ? html`<span style=${l.style ? textCss(l.style) : nothing}>${l.text}</span>` : nothing}
    `;
  }

  /** The subclass renders just the control itself; the base wraps it with label rows. */
  protected abstract renderControl(): TemplateResult;

  /**
   * Horizontal placement of the label rows, from the field's `align`.
   *
   * The block is a flex item that stretches to the wrapper's width, so above and
   * below the control this aligns the labels against the control itself — the
   * point of the setting. Beside the control there is no spare width, so it
   * aligns the rows against each other instead. Vertical placement is what
   * `control_labels_position` is for; this stays horizontal in both directions.
   */
  private _labelItems(): string {
    const a = this.field?.align;
    return a === 'center' ? 'center' : a === 'right' ? 'flex-end' : 'flex-start';
  }

  /**
   * The label block's two gaps, written as inline styles rather than CSS, so they
   * take the density base directly instead of a `calc()` off the token: rows sit at
   * half the base (they are two lines of one label), icon↔text at the base itself.
   */
  private _renderLabelRows(rows: ControlLabel[], base: number): TemplateResult {
    return html`<div class="mc-labels" style="display:flex;flex-direction:column;gap:${base / 2}px;align-items:${this._labelItems()};">
      ${rows.map((r) => html`<span class="mc-label-row" style="display:inline-flex;align-items:center;gap:${base}px;">${this.labelInline(r)}</span>`)}
    </div>`;
  }

  override render(): TemplateResult {
    const control = this.renderControl();
    const f = this.field;
    // The container box wraps the *whole* control — the interactive body plus any
    // icon/text label rows — so it reads as one framed control, not a box around
    // the track with the labels loose beside it.
    const box = this.containerStyle();
    // Density (#74 Phase 7) is written here rather than in each subclass because
    // this wrapper and every control's own shadow content share one shadow root,
    // so the properties inherit inward to all of it from a single site.
    const density = resolveControlDensity(this.defaults);
    const dvars = controlDensityVars(density);
    const rows = f?.control_labels?.length ? f.control_labels : undefined;
    if (!rows) {
      return html`<div class="mc-control-box" style="box-sizing:border-box;display:${this.containerDisplay()};${dvars}${box}">${control}</div>`;
    }

    const pos = f?.control_labels_position ?? 'above';
    const dir = pos === 'left' || pos === 'right' ? 'row' : 'column';
    // control_labels_gap has a field key but no seed default, so density is its
    // only global tier — and it stays below the field key, never above it.
    const base = density.gap ?? 4;
    const gap = f?.control_labels_gap ?? base;
    const labels = this._renderLabelRows(rows, base);
    const parts = pos === 'below' || pos === 'right' ? [control, labels] : [labels, control];
    return html`<div class="mc-control-wrap" style="box-sizing:border-box;display:flex;flex-direction:${dir};gap:${gap}px;${dir === 'row' ? 'align-items:center;' : ''}${dvars}${box}">${parts}</div>`;
  }
}
