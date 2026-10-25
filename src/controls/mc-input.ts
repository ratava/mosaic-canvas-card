import { html, css, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { TAG_INPUT } from '../tags';
import { McControl } from './base';
import { resolveControlStyle } from '../view';

/**
 * Input control field — a Mosaic-styled text field (optionally password-masked,
 * with an optional max length). Reads/writes an input_text / text entity via
 * set_value. Commit timing is configurable (on change, on click-away, or on Enter).
 * Numeric entry lives on the Spin Box control instead — it's the better-controlled
 * fit for that.
 */
@customElement(TAG_INPUT)
export class McInput extends McControl {
  static override styles = css`
    :host { display: inline-block; width: 100%; }
    input {
      box-sizing: border-box; width: 100%; padding: var(--mc-ctl-pad, 5px 8px); font-size: var(--mc-ts, 13px);
      color: currentColor; border-radius: var(--mc-radius, 6px); font-family: inherit;
      border: 1px solid var(--mc-border, rgba(255, 255, 255, 0.25));
      background: var(--mc-bg, rgba(255, 255, 255, 0.06));
    }
    input:focus-visible { outline: none; border-color: var(--mc-focus, #00d4ff); }
    input::placeholder { color: var(--mc-ph, rgba(255, 255, 255, 0.4)); }
  `;

  // The input is full-width, so its container box is block-level too.
  protected override containerDisplay(): string {
    return 'block';
  }

  protected readValue(): string | undefined {
    const so = this.stateObj;
    if (!so) return undefined;
    const attr = this.field?.read_attribute;
    if (!attr) return so.state;
    const v = so.attributes?.[attr];
    return v != null ? String(v) : undefined;
  }

  private _submit(v: string): void {
    this._editing = false;
    this.commit(v);
  }

  private _onInput = (e: Event): void => {
    this._editing = true;
    this._pending = (e.target as HTMLInputElement).value;
  };

  private _onChange = (e: Event): void => {
    if ((this.field?.submit_on ?? 'change') === 'change') this._submit((e.target as HTMLInputElement).value);
  };

  private _onBlur = (e: Event): void => {
    if (this.field?.submit_on === 'blur') this._submit((e.target as HTMLInputElement).value);
    else this._editing = false;
  };

  private _onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Enter') { e.preventDefault(); this._submit((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).blur(); }
  };

  protected override renderControl(): TemplateResult {
    const cs = resolveControlStyle(this.field ?? ({ id: '', type: 'input' } as NonNullable<typeof this.field>), this.defaults);
    const raw = this.displayValue();
    const value = raw === undefined ? '' : String(raw);
    const vars = `--mc-border:${cs.input_border_color};--mc-bg:${cs.input_bg_paint};--mc-radius:${cs.input_radius}px;`
      + `--mc-ts:${cs.input_text_size}px;--mc-focus:${cs.input_focus_color};`
      + `--mc-ph:${cs.input_placeholder_color};`;

    return html`
      <input
        type=${this.field?.input_password ? 'password' : 'text'}
        .value=${value}
        .maxLength=${this.field?.input_maxlength ?? -1}
        placeholder=${this.field?.placeholder ?? ''}
        ?disabled=${!this.entityId}
        style="${vars}"
        @input=${this._onInput}
        @change=${this._onChange}
        @blur=${this._onBlur}
        @keydown=${this._onKey}
      />
    `;
  }
}
