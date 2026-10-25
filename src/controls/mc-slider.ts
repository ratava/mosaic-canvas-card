import { html, css, nothing, type TemplateResult } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { TAG_SLIDER } from '../tags';
import { McControl } from './base';
import { resolveControlStyle } from '../view';
import { formatFieldValue } from '../format';
import type { ControlLabel, FieldConfig, SliderTrackLabel } from '../types';

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/**
 * Slider control field. Reads a numeric value (from the entity state or a named
 * attribute, normalised via read_scale) and reports 0..max on release. Live drag
 * updates the thumb optimistically; the service call fires only on pointer-up /
 * keyboard commit.
 */
@customElement(TAG_SLIDER)
export class McSlider extends McControl {
  @query('.track') private _trackEl?: HTMLElement;

  static override styles = css`
    :host { display: block; width: 100%; }
    .wrap { display: flex; align-items: center; gap: calc(var(--mc-ctl-gap, 4px) * 2); }
    .track {
      position: relative; flex: 1 1 auto; min-width: 60px; height: var(--mc-slider-h, 6px);
      border-radius: var(--mc-slider-r, 999px); cursor: pointer; touch-action: none;
      box-sizing: border-box;
    }
    /* A set track length pins the width instead of flexing to the field's. */
    /* Fallback keeps this valid-at-computed-value if .fixed is ever applied
       without --mc-slider-len being written; today the two always travel together. */
    .track.fixed { flex: 0 0 auto; width: var(--mc-slider-len, auto); min-width: 0; }
    /* The fill shares the track's radius so a squared-off track fills square. */
    .fill { position: absolute; top: 0; left: 0; bottom: 0; border-radius: var(--mc-slider-r, 999px); }
    .thumb {
      position: absolute; top: 50%; width: var(--mc-th-w, 16px); height: var(--mc-th-size, 16px);
      border-radius: var(--mc-th-r, 8px);
      background: var(--mc-slider-thumb, #fff); transform: translate(-50%, -50%);
      box-shadow: var(--mc-th-shadow, 0 1px 4px rgba(0, 0, 0, 0.5)); cursor: grab;
    }
    .track:active .thumb { cursor: grabbing; }
    .val { font-size: calc(var(--mc-ctl-fs, 13px) - 1px); min-width: 2.5em; text-align: right; white-space: nowrap; color: currentColor; }
    .point {
      position: absolute; top: 50%; display: inline-flex; align-items: center;
      gap: calc(var(--mc-ctl-gap, 4px) * 0.75);
      white-space: nowrap; font-size: calc(var(--mc-ctl-fs, 13px) - 2px); pointer-events: none;
    }
    :host(:focus-visible) .track { outline: 2px solid var(--mc-accent, #00d4ff); outline-offset: 3px; }
  `;

  private get _min(): number { return this.field?.min ?? 0; }
  private get _max(): number { return this.field?.max ?? 100; }
  private get _step(): number { return this.field?.step ?? 1; }

  // Full-width by default so the track fills the field; a fixed track length
  // shrinks the box to hug the track instead.
  protected override containerDisplay(): string {
    const cs = resolveControlStyle(this.field ?? ({ id: '', type: 'slider' } as NonNullable<typeof this.field>), this.defaults);
    return cs.slider_length != null ? 'inline-block' : 'block';
  }

  protected readValue(): number | undefined {
    const so = this.stateObj;
    if (!so) return undefined;
    const attr = this.field?.read_attribute;
    const raw = attr ? Number(so.attributes?.[attr]) : Number(so.state);
    if (!Number.isFinite(raw)) return undefined;
    return raw / (this.field?.read_scale ?? 1);
  }

  private _quantize(v: number): number {
    const step = this._step || 1;
    const snapped = Math.round((v - this._min) / step) * step + this._min;
    return clamp(Number(snapped.toFixed(4)), this._min, this._max);
  }

  /**
   * Thumb-centre travel is inset from each track end so the knob stays fully
   * inside the track at 0 % / 100 % — half the thumb's width (the horizontal
   * dimension), plus any thumb padding. Pointer mapping and the rendered
   * thumb/fill all use this same inset.
   */
  private get _inset(): number {
    const cs = resolveControlStyle(this.field ?? ({ id: '', type: 'slider' } as NonNullable<typeof this.field>), this.defaults);
    return cs.slider_thumb_padding + cs.slider_thumb_width / 2;
  }

  /** Anchor style for a track label, positioned directly on the track. `gap` insets left/right from its edge (unused for center). */
  private _pointStyle(anchor: 'left' | 'center' | 'right', gap: number | undefined): string {
    if (anchor === 'left') return `left:${gap ?? 0}px;transform:translateY(-50%);`;
    if (anchor === 'right') return `right:${gap ?? 0}px;transform:translateY(-50%);`;
    return 'left:50%;transform:translate(-50%,-50%);';
  }

  /** A track label with its text resolved from `entity` (a live value, or virtual), falling back to its own `text`. */
  private _resolvedLabel(pt: SliderTrackLabel): ControlLabel {
    if (!pt.entity) return pt;
    const synthetic = { id: '', type: 'value', entity: pt.entity, attribute: pt.attribute } as FieldConfig;
    const { value, unit } = formatFieldValue(this.hass, synthetic, this.defaults, this.virtuals);
    return { ...pt, text: value ? `${value}${unit}` : pt.text };
  }

  private _valueFromClientX(clientX: number): number {
    const rect = this._trackEl?.getBoundingClientRect();
    if (!rect || rect.width === 0) return this._min;
    const pad = this._inset;
    const span = rect.width - pad * 2;
    if (span <= 0) return this._min;
    const ratio = clamp((clientX - rect.left - pad) / span, 0, 1);
    return this._quantize(this._min + ratio * (this._max - this._min));
  }

  private _onPointerDown = (e: PointerEvent): void => {
    if (!this.entityId) return;
    e.preventDefault();
    this._editing = true;
    this._trackEl?.setPointerCapture(e.pointerId);
    this._pending = this._valueFromClientX(e.clientX);
  };

  private _onPointerMove = (e: PointerEvent): void => {
    if (!this._editing) return;
    this._pending = this._valueFromClientX(e.clientX);
  };

  private _onPointerUp = (e: PointerEvent): void => {
    if (!this._editing) return;
    this._editing = false;
    this._trackEl?.releasePointerCapture(e.pointerId);
    const v = this._valueFromClientX(e.clientX);
    this.commit(v); // fire the service call on release
  };

  private _onKey = (e: KeyboardEvent): void => {
    if (!this.entityId) return;
    const cur = typeof this.displayValue() === 'number' ? (this.displayValue() as number) : this._min;
    let next = cur;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = cur + this._step;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = cur - this._step;
    else if (e.key === 'Home') next = this._min;
    else if (e.key === 'End') next = this._max;
    else return;
    e.preventDefault();
    this.commit(this._quantize(next));
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.tabIndex = 0;
    this.addEventListener('keydown', this._onKey);
  }

  override disconnectedCallback(): void {
    this.removeEventListener('keydown', this._onKey);
    super.disconnectedCallback();
  }

  protected override renderControl(): TemplateResult {
    const f = this.field;
    const raw = this.displayValue();
    const value = typeof raw === 'number' ? raw : this._min;
    const pct = this._max > this._min ? ((value - this._min) / (this._max - this._min)) * 100 : 0;

    const cs = resolveControlStyle(f ?? ({ id: '', type: 'slider' } as NonNullable<typeof f>), this.defaults);
    const accent = cs.accent_color;
    const trackColor = cs.slider_track_paint;
    const fillColor = cs.slider_fill_paint;
    const thumbColor = cs.slider_thumb_color;
    const height = cs.slider_height;
    const showValue = f?.show_value ?? true;
    const unit = f?.unit ?? '';

    const sl = f?.slider_labels;
    const points = html`
      ${sl?.left ? html`<span class="point" style="${this._pointStyle('left', sl.left.gap)}">${this.labelInline(this._resolvedLabel(sl.left))}</span>` : nothing}
      ${sl?.center ? html`<span class="point" style="${this._pointStyle('center', undefined)}">${this.labelInline(this._resolvedLabel(sl.center))}</span>` : nothing}
      ${sl?.right ? html`<span class="point" style="${this._pointStyle('right', sl.right.gap)}">${this.labelInline(this._resolvedLabel(sl.right))}</span>` : nothing}
    `;

    // With a fixed track the whole control shrinks to it, so the value text, the
    // track labels below and the label rows all line up with the track rather
    // than with the full field width.
    const len = cs.slider_length;
    // Thumb-centre travel is inset by half the thumb (plus padding) so the knob
    // never overhangs the track ends; the fill tracks the same centre.
    const inset = cs.slider_thumb_padding + cs.slider_thumb_width / 2;
    return html`
      <div style="width:${len != null ? 'max-content' : '100%'};">
        <div class="wrap"
          role="slider" aria-valuemin=${this._min} aria-valuemax=${this._max} aria-valuenow=${Math.round(value)}
        >
          <div class="track ${len != null ? 'fixed' : ''}"
            style="--mc-slider-h:${height}px;--mc-slider-r:${cs.slider_radius}px;${len != null ? `--mc-slider-len:${len}px;` : ''}--mc-slider-thumb:${thumbColor};--mc-th-size:${cs.slider_thumb_size}px;--mc-th-w:${cs.slider_thumb_width}px;--mc-th-r:${cs.slider_thumb_radius}px;--mc-th-shadow:${cs.slider_thumb_shadow};--mc-accent:${accent};background:${trackColor}${cs.slider_border ? `;border:${cs.slider_border_width}px solid ${cs.slider_border_color}` : ''}"
            @pointerdown=${this._onPointerDown}
            @pointermove=${this._onPointerMove}
            @pointerup=${this._onPointerUp}
            @pointercancel=${this._onPointerUp}
          >
            <div class="fill" style="width:calc(${inset}px + (100% - ${inset * 2}px) * ${pct / 100});background:${fillColor}"></div>
            <div class="thumb" style="left:calc(${inset}px + (100% - ${inset * 2}px) * ${pct / 100})"></div>
            ${points}
          </div>
          ${showValue ? html`<span class="val">${Math.round(value)}${unit}</span>` : nothing}
        </div>
      </div>
    `;
  }
}
