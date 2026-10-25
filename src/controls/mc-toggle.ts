import { html, css, nothing, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { TAG_TOGGLE } from '../tags';
import { McControl } from './base';
import { resolveControlStyle } from '../view';

/**
 * Toggle control field — switch or checkbox variant. Reflects an on/off entity
 * (input_boolean, switch, light, fan, …) and reports a boolean to the host.
 */
@customElement(TAG_TOGGLE)
export class McToggle extends McControl {
  static override styles = css`
    :host { display: inline-flex; align-items: center; line-height: 0; }
    .wrap { display: inline-flex; align-items: center; gap: calc(var(--mc-ctl-gap, 4px) * 2); cursor: pointer; }
    .wrap[aria-disabled='true'] { cursor: default; opacity: 0.5; }
    .label { font-size: var(--mc-ctl-fs, 13px); color: currentColor; white-space: nowrap; }

    /* switch */
    .track {
      position: relative; width: var(--mc-tr-w, 40px); height: var(--mc-tr-h, 22px);
      border-radius: var(--mc-tr-r, 11px);
      transition: background 0.18s ease; box-sizing: border-box;
    }
    .thumb {
      position: absolute; top: var(--mc-pad, 2px); left: var(--mc-pad, 2px);
      width: var(--mc-th-size, 18px); height: var(--mc-th-size, 18px);
      border-radius: var(--mc-th-r, 9px); background: var(--mc-th-color, #fff);
      transition: transform 0.18s ease; box-shadow: var(--mc-th-shadow, 0 1px 3px rgba(0, 0, 0, 0.5));
    }
    .track.on .thumb { transform: translateX(var(--mc-th-shift, 18px)); }

    /* checkbox */
    .box {
      width: 20px; height: 20px; border-radius: 4px; box-sizing: border-box;
      border: 2px solid currentColor; display: inline-flex;
      align-items: center; justify-content: center; transition: background 0.15s ease, border-color 0.15s ease;
    }
    .box ha-icon { --mdc-icon-size: 16px; color: #fff; }

    :host(:focus-visible) .track,
    :host(:focus-visible) .box { outline: 2px solid var(--mc-accent, #00d4ff); outline-offset: 2px; }
  `;

  protected readValue(): boolean {
    const so = this.stateObj;
    if (!so) return false;
    const attr = this.field?.read_attribute;
    if (!attr) return so.state === 'on';
    const v = so.attributes?.[attr];
    if (v == null) return false;
    const s = String(v).toLowerCase();
    return s !== 'off' && s !== 'false' && s !== '0' && s !== 'unavailable' && s !== 'unknown';
  }

  private _toggle = (): void => {
    if (!this.entityId) return;
    this._editing = false;
    this.commit(!(this.displayValue() === true));
  };

  private _onKey = (e: KeyboardEvent): void => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this._toggle(); }
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
    const on = this.displayValue() === true;
    const variant = f?.toggle_variant ?? 'switch';
    const cs = resolveControlStyle(f ?? ({ id: '', type: 'toggle' } as NonNullable<typeof f>), this.defaults);
    // Paint carries the gradient (or the flat colour); the plain colours are
    // still needed for the checkbox border, where a gradient is not legal.
    const onPaint = cs.toggle_on_paint;
    const offPaint = cs.toggle_off_paint;
    const onColor = cs.toggle_on_color;
    const offColor = cs.toggle_off_color;
    const label = f?.label;

    // Track geometry derives from the thumb size + padding so a resized knob stays proportional.
    const pad = cs.toggle_thumb_padding;
    const thSize = cs.toggle_thumb_size;
    const thRadius = cs.toggle_thumb_radius;
    const trackVars = `--mc-pad:${pad}px;--mc-th-size:${thSize}px;--mc-th-r:${thRadius}px;`
      + `--mc-th-color:${cs.toggle_thumb_color};--mc-th-shift:${thSize}px;--mc-th-shadow:${cs.toggle_thumb_shadow};`
      + `--mc-tr-w:${thSize * 2 + pad * 2}px;--mc-tr-h:${thSize + pad * 2}px;--mc-tr-r:${thRadius + pad}px;`;

    const control = variant === 'checkbox'
      ? html`<span class="box" style="background:${on ? onPaint : 'transparent'};border-color:${on ? onColor : offColor}">
          ${on ? html`<ha-icon icon="mdi:check"></ha-icon>` : nothing}
        </span>`
      : html`<span class="track ${on ? 'on' : ''}" style="${trackVars}background:${on ? onPaint : offPaint}">
          <span class="thumb"></span>
        </span>`;

    // --mc-accent goes on the wrapper rather than on .track: the focus outline is
    // declared for BOTH .track and .box, and the checkbox variant's .box carries no
    // vars of its own, so the wrapper is the one place that makes accent_color
    // actually reach the focus ring in either variant.
    return html`
      <span class="wrap" role="switch"
        style="--mc-accent:${cs.accent_color};"
        aria-checked=${on ? 'true' : 'false'}
        aria-disabled=${this.entityId ? 'false' : 'true'}
        @click=${this._toggle}
      >
        ${control}
        ${label ? html`<span class="label">${label}</span>` : nothing}
      </span>
    `;
  }
}
