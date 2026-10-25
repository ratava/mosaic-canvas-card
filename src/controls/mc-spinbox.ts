import { html, css, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { TAG_SPINBOX } from '../tags';
import { McControl } from './base';
import { resolveControlStyle } from '../view';

const clamp = (v: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v));

/**
 * Spin box control field — a numeric value with −/+ stepper buttons. Reads/writes
 * an input_number / number / counter entity via set_value.
 */
@customElement(TAG_SPINBOX)
export class McSpinbox extends McControl {
  static override styles = css`
    :host { display: inline-block; }
    .wrap {
      display: inline-flex; align-items: stretch; box-sizing: border-box; border-radius: var(--mc-radius, 7px); overflow: hidden;
      border: 1px solid var(--mc-border, rgba(255, 255, 255, 0.25));
    }
    button {
      width: var(--mc-btn-w, 30px); border: none; cursor: pointer; font-size: var(--mc-btn-fs, 18px); line-height: 1; color: currentColor;
      background: var(--mc-bg, rgba(255, 255, 255, 0.06));
    }
    /* Text on the accent fill — see the note in mc-dropdown; same Phase 4
       decision, same reason this site was missed then. */
    button:hover:not([disabled]) { background: var(--mc-hover, #00d4ff); color: var(--text-primary-color, #fff); }
    button[disabled] { opacity: 0.4; cursor: default; }
    .dec { border-right: 1px solid var(--mc-border, rgba(255, 255, 255, 0.25)); }
    .inc { border-left: 1px solid var(--mc-border, rgba(255, 255, 255, 0.25)); }
    input {
      width: 3.5em; text-align: center; border: none; background: transparent; color: currentColor;
      font-size: var(--mc-ts, 13px); font-family: inherit; box-sizing: border-box;
      appearance: textfield; -moz-appearance: textfield;
    }
    input:focus-visible { outline: none; }
    /* The −/+ buttons are the only stepper this control shows — the browser's
       native one would otherwise double up right next to them. */
    input::-webkit-outer-spin-button, input::-webkit-inner-spin-button {
      -webkit-appearance: none; margin: 0;
    }
    .unit {
      align-self: center; padding-right: calc(var(--mc-ctl-gap, 4px) * 1.5);
      font-size: calc(var(--mc-ctl-fs, 13px) - 2px); opacity: 0.7;
    }
  `;

  private get _min(): number { return this.field?.min ?? Number.NEGATIVE_INFINITY; }
  private get _max(): number { return this.field?.max ?? Number.POSITIVE_INFINITY; }
  private get _step(): number { return this.field?.step ?? 1; }

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
    const base = Number.isFinite(this._min) ? this._min : 0;
    const snapped = Math.round((v - base) / step) * step + base;
    return clamp(Number(snapped.toFixed(this.field?.spinbox_decimals ?? 4)), this._min, this._max);
  }

  private _current(): number {
    const v = this.displayValue();
    if (typeof v === 'number') return v;
    return Number.isFinite(this._min) ? this._min : 0;
  }

  private _bump(dir: 1 | -1): void {
    if (!this.entityId) return;
    this.commit(this._quantize(this._current() + dir * this._step));
  }

  private _onInput = (e: Event): void => {
    const n = Number((e.target as HTMLInputElement).value);
    if (Number.isFinite(n)) { this._editing = true; this._pending = clamp(n, this._min, this._max); }
  };

  private _onChange = (e: Event): void => {
    const n = Number((e.target as HTMLInputElement).value);
    this._editing = false;
    if (Number.isFinite(n)) this.commit(this._quantize(n));
  };

  protected override renderControl(): TemplateResult {
    const cs = resolveControlStyle(this.field ?? ({ id: '', type: 'spinbox' } as NonNullable<typeof this.field>), this.defaults);
    const value = this._current();
    const decimals = this.field?.spinbox_decimals;
    const displayValue = decimals != null ? value.toFixed(decimals) : String(value);
    const unit = this.field?.unit ?? '';
    const disabled = !this.entityId;
    const vars = `--mc-border:${cs.spinbox_border_color};--mc-bg:${cs.spinbox_bg_paint};--mc-radius:${cs.spinbox_radius}px;`
      + `--mc-ts:${cs.spinbox_text_size}px;--mc-hover:${cs.spinbox_button_hover_paint};--mc-btn-w:${cs.spinbox_button_width}px;`
      + `--mc-btn-fs:${cs.spinbox_button_font_size}px;`;

    return html`
      <div class="wrap" style="${vars}">
        <button class="dec" ?disabled=${disabled || value <= this._min} title="Decrease" @click=${() => this._bump(-1)}>−</button>
        <input type="number" .value=${displayValue} ?disabled=${disabled}
          @input=${this._onInput} @change=${this._onChange} />
        ${unit ? html`<span class="unit">${unit}</span>` : ''}
        <button class="inc" ?disabled=${disabled || value >= this._max} title="Increase" @click=${() => this._bump(1)}>+</button>
      </div>
    `;
  }
}
