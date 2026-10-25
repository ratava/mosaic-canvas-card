import { html, css, nothing, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { TAG_DROPDOWN } from '../tags';
import { McControl } from './base';
import { resolveControlStyle, deriveAttributeFromOptionsAttribute } from '../view';

/**
 * Dropdown control field — a Mosaic-styled trigger that opens a popup option
 * list. Reads/writes an input_select / select entity (or a manual option list).
 */
@customElement(TAG_DROPDOWN)
export class McDropdown extends McControl {
  @state() private _open = false;

  static override styles = css`
    :host { display: inline-block; position: relative; }
    .trigger {
      display: inline-flex; align-items: center; gap: calc(var(--mc-ctl-gap, 4px) * 1.5); box-sizing: border-box;
      min-width: 90px; padding: var(--mc-ctl-pad, 4px 8px); border-radius: var(--mc-radius, 6px); cursor: pointer;
      border: 1px solid var(--mc-border, rgba(255, 255, 255, 0.25));
      background: var(--mc-bg, rgba(255, 255, 255, 0.06)); color: currentColor; font-size: var(--mc-ts, 13px);
    }
    .trigger[aria-disabled='true'] { cursor: default; opacity: 0.5; }
    .trigger .label { flex: 1 1 auto; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .trigger ha-icon { --mdc-icon-size: 18px; flex: 0 0 auto; }
    .menu {
      position: absolute; z-index: 20; top: calc(100% + 4px); left: 0; min-width: 100%;
      /* The menu's own inset around the option list, not a field padding — it
         tracks the gap knob so a tightened control does not keep a loose menu. */
      max-height: 240px; overflow: auto; box-sizing: border-box; padding: var(--mc-ctl-gap, 4px);
      border-radius: var(--mc-menu-r, 8px); border: 1px solid var(--mc-menu-border, rgba(255, 255, 255, 0.25));
      background: var(--mc-menu-bg, #1c1f26); box-shadow: var(--mc-menu-shadow, 0 6px 20px rgba(0, 0, 0, 0.5));
    }
    .opt {
      display: flex; align-items: center; gap: calc(var(--mc-ctl-gap, 4px) * 2);
      padding: var(--mc-ctl-pad, 6px 8px); border-radius: var(--mc-opt-r, 5px);
      cursor: pointer; white-space: nowrap; color: var(--mc-opt-text, #fff); font-size: var(--mc-ts, 13px);
    }
    .opt:hover { background: var(--mc-opt-hover, rgba(255, 255, 255, 0.08)); }
    /* Text on the accent fill — --text-primary-color, matching what Phase 4
       did for the selector and button. This site was missed then because it
       lives here rather than in resolveControlStyle. */
    .opt.sel { background: var(--mc-selected, #00d4ff); color: var(--text-primary-color, #fff); }
    .opt ha-icon { --mdc-icon-size: 18px; }
    :host(:focus-visible) .trigger { outline: 2px solid var(--mc-accent, #00d4ff); outline-offset: 2px; }
  `;

  protected readValue(): string | undefined {
    const so = this.stateObj;
    if (!so) return undefined;
    const attr = this.field?.read_attribute ?? deriveAttributeFromOptionsAttribute(this.field?.options_attribute);
    if (attr) return so.attributes?.[attr] != null ? String(so.attributes[attr]) : undefined;
    return so.state;
  }

  private _onDocPointerDown = (e: Event): void => {
    if (this._open && !e.composedPath().includes(this)) this._open = false;
  };

  private _toggle = (): void => {
    if (this.entityId) this._open = !this._open;
  };

  private _select(value: string): void {
    this._open = false;
    this.commit(value);
  }

  private _onKey = (e: KeyboardEvent): void => {
    if (!this.entityId) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._open = !this._open; }
    else if (e.key === 'Escape') this._open = false;
  };

  override connectedCallback(): void {
    super.connectedCallback();
    this.tabIndex = 0;
    this.addEventListener('keydown', this._onKey);
    document.addEventListener('pointerdown', this._onDocPointerDown, true);
  }

  override disconnectedCallback(): void {
    this.removeEventListener('keydown', this._onKey);
    document.removeEventListener('pointerdown', this._onDocPointerDown, true);
    super.disconnectedCallback();
  }

  protected override renderControl(): TemplateResult {
    const cs = resolveControlStyle(this.field ?? ({ id: '', type: 'dropdown' } as NonNullable<typeof this.field>), this.defaults);
    const value = this.displayValue();
    const opts = this.options();
    const current = opts.find((o) => o.value === value);
    const placeholder = this.field?.placeholder ?? '—';
    const vars = `--mc-accent:${cs.accent_color};--mc-border:${cs.dropdown_border_color};--mc-bg:${cs.dropdown_bg_paint};`
      + `--mc-radius:${cs.dropdown_radius}px;--mc-ts:${cs.dropdown_text_size}px;--mc-menu-bg:${cs.dropdown_menu_bg_paint};`
      + `--mc-menu-border:${cs.dropdown_menu_border_color};--mc-selected:${cs.dropdown_selected_paint};`
      + `--mc-menu-r:${cs.dropdown_menu_radius}px;--mc-opt-r:${cs.dropdown_option_radius}px;`
      + `--mc-opt-text:${cs.dropdown_option_text_color};--mc-opt-hover:${cs.dropdown_option_hover_color};`
      + `--mc-menu-shadow:${cs.dropdown_menu_shadow};`;

    return html`
      <div class="trigger" role="button" aria-haspopup="listbox" aria-expanded=${this._open ? 'true' : 'false'}
        aria-disabled=${this.entityId ? 'false' : 'true'}
        style="${vars}"
        @click=${this._toggle}
      >
        ${current?.icon ? html`<ha-icon icon=${current.icon}></ha-icon>` : nothing}
        <span class="label">${current?.label ?? placeholder}</span>
        <ha-icon icon=${this._open ? 'mdi:menu-up' : 'mdi:menu-down'}></ha-icon>
      </div>
      ${this._open ? html`
        <div class="menu" role="listbox" style="${vars}">
          ${opts.map((o) => html`
            <div class="opt ${o.value === value ? 'sel' : ''}" role="option" aria-selected=${o.value === value ? 'true' : 'false'}
              @click=${() => this._select(o.value)}
            >
              ${o.icon ? html`<ha-icon icon=${o.icon}></ha-icon>` : nothing}
              <span>${o.label}</span>
            </div>
          `)}
        </div>
      ` : nothing}
    `;
  }
}
