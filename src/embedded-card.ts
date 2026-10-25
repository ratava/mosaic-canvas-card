import { LitElement, html, css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import type { HomeAssistant } from 'custom-card-helpers';
import { TAG_EMBEDDED } from './tags';

@customElement(TAG_EMBEDDED)
export class McEmbeddedCard extends LitElement {
  @property({ attribute: false }) cardConfig?: Record<string, unknown>;
  @property({ attribute: false }) hass?: HomeAssistant;
  @property({ type: Boolean }) transparent = false;
  /**
   * Raw declarations applied to the third-party card element itself (#92), not
   * to this host. Same reach as `transparent`: it lands inside the shadow
   * boundary, so `--ha-card-*` overrides and ordinary properties both bite on
   * the card rather than on the frame around it.
   */
  @property({ attribute: false }) extraCss?: string;

  @query('#slot') private _slot!: HTMLDivElement;

  private _cardEl: HTMLElement | null = null;
  private _lastType = '';
  /** Property names `_applyExtraCss` last wrote, so an edit can unset them. */
  private _extraProps: string[] = [];
  // Guards against interleaved rebuilds: two rapid cardConfig changes both
  // await in _rebuildCard, and the earlier one must not clobber the later.
  private _rebuildGen = 0;

  static override styles = css`
    :host { display: block; }
    #slot { width: 100%; }
  `;

  override render() {
    return html`<div id="slot"></div>`;
  }

  override updated(changed: Map<string, unknown>): void {
    if (changed.has('cardConfig')) {
      void this._rebuildCard();
    } else if (changed.has('hass') && this._cardEl) {
      (this._cardEl as any).hass = this.hass;
    }
    if ((changed.has('transparent') || changed.has('extraCss')) && this._cardEl) {
      this._applyOverrides();
    }
  }

  /**
   * Always both, always in this order — `_applyTransparent` removes the four
   * properties it owns when switched off, which would also drop them if the
   * user had set one from Additional CSS. Re-running the CSS pass afterwards
   * puts theirs back, and makes their declaration the winner where the two
   * name the same property.
   */
  private _applyOverrides(): void {
    this._applyTransparent();
    this._applyExtraCss();
  }

  /**
   * Declarations are set one property at a time rather than through `cssText`,
   * which would wipe whatever the card set on itself. `!important` is split off
   * and passed as the priority argument, because `setProperty` will not parse it
   * out of the value — and it is exactly what someone reaches for when a
   * third-party card is fighting them.
   */
  private _applyExtraCss(): void {
    if (!this._cardEl) return;
    for (const p of this._extraProps) this._cardEl.style.removeProperty(p);
    this._extraProps = [];
    for (const decl of (this.extraCss ?? '').split(';')) {
      const i = decl.indexOf(':');
      if (i < 0) continue;
      const prop = decl.slice(0, i).trim();
      let value = decl.slice(i + 1).trim();
      if (!prop || !value) continue;
      let priority = '';
      const bang = value.match(/!\s*important$/i);
      if (bang) {
        priority = 'important';
        value = value.slice(0, bang.index).trim();
      }
      if (!value) continue;
      this._cardEl.style.setProperty(prop, value, priority);
      this._extraProps.push(prop);
    }
  }

  private _applyTransparent(): void {
    if (!this._cardEl) return;
    if (this.transparent) {
      this._cardEl.style.setProperty('--ha-card-background', 'transparent');
      this._cardEl.style.setProperty('--ha-card-box-shadow', 'none');
      this._cardEl.style.setProperty('--ha-card-border-width', '0px');
      this._cardEl.style.setProperty('--ha-card-border-color', 'transparent');
    } else {
      this._cardEl.style.removeProperty('--ha-card-background');
      this._cardEl.style.removeProperty('--ha-card-box-shadow');
      this._cardEl.style.removeProperty('--ha-card-border-width');
      this._cardEl.style.removeProperty('--ha-card-border-color');
    }
  }

  private async _rebuildCard(): Promise<void> {
    const gen = ++this._rebuildGen;
    await this.updateComplete;
    if (gen !== this._rebuildGen) return;
    const cfg = this.cardConfig;
    const slot = this._slot;
    if (!slot) return;

    if (!cfg?.type) {
      slot.innerHTML = '';
      this._cardEl = null;
      return;
    }

    const type = String(cfg.type);
    if (this._cardEl && type === this._lastType) {
      try { (this._cardEl as any).setConfig(cfg); } catch { /* noop */ }
      (this._cardEl as any).hass = this.hass;
      this._applyOverrides();
      return;
    }

    try {
      const helpers = await (window as any).loadCardHelpers?.();
      if (gen !== this._rebuildGen) return;
      if (!helpers?.createCardElement) return;
      slot.innerHTML = '';
      const el = helpers.createCardElement(cfg) as HTMLElement;
      (el as any).hass = this.hass;
      this._lastType = type;
      this._cardEl = el;
      slot.appendChild(el);
      this._applyOverrides();
    } catch (e) {
      console.error('[mc-embedded-card] failed to create card:', e);
    }
  }
}

// Type-system boundary: HTMLElementTagNameMap requires a literal key, so this is the
// one place a tag name bypasses src/tags.ts. Type-level only — in -dev builds the real
// runtime tag is the TAG_EMBEDDED suffixed form; keep the literal in sync with tags.ts.
declare global {
  interface HTMLElementTagNameMap {
    'mc-embedded-card': McEmbeddedCard;
  }
}
