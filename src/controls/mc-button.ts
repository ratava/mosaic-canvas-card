import { html, type TemplateResult } from 'lit';
import { customElement } from 'lit/decorators.js';
import { TAG_BUTTON } from '../tags';
import { McSelector } from './mc-selector';
import type { ResolvedOption } from './base';
import { resolveControlStyle } from '../view';

/**
 * Button control field — a single button.
 *
 * Mechanically a selector with exactly one option, which is why it extends
 * McSelector: the cell layout (icon / label / state with per-part positions),
 * the state icon, the active styling and the write path are all inherited
 * rather than duplicated. The button's option is synthesised from the field
 * itself, so there is no option list to configure.
 *
 * It exists as its own type because "add a button" is what a user actually
 * wants to do — configuring a one-entry selector is not an obvious way to get
 * there.
 */
@customElement(TAG_BUTTON)
export class McButton extends McSelector {
  /**
   * The single option this button represents, built from the field's own config.
   *
   * With `button_value` set it behaves as a *value* option — writes that value
   * to the entity and is active while the state matches. Without one it behaves
   * as an *entity* option, toggling the entity with its domain default action,
   * which is the common case.
   */
  private _selfOption(): ResolvedOption {
    const f = this.field;
    const asValue = f?.button_value != null && f.button_value !== '';
    return {
      value: asValue ? f!.button_value! : '',
      label: f?.label ?? '',
      icon: f?.icon,
      entity: asValue ? undefined : f?.entity,
      attribute: asValue ? undefined : f?.read_attribute,
      icon_position: f?.option_icon_position,
      show_state: f?.option_show_state,
      state_position: f?.option_state_position,
    };
  }

  protected override renderControl(): TemplateResult {
    const cs = resolveControlStyle(this.field ?? ({ id: '', type: 'button' } as NonNullable<typeof this.field>), this.defaults);
    const pad = cs.button_option_padding;
    // A lone button has no row frame to be joined to — the shared `.row.sep` cell
    // styling (border-radius:var(--mc-opt-*)) is what actually paints it, so the
    // "opt" vars carry the button's own border/radius, not a separate row one.
    const vars = `--mc-accent:${cs.accent_color};--mc-bg:${cs.button_bg_paint};`
      + `--mc-ts:${cs.button_text_size}px;`
      + `--mc-selected:${cs.button_selected_paint};--mc-selected-text:${cs.button_selected_text_color};`
      + `--mc-text:${cs.button_text_color};--mc-icon:${cs.button_icon_color};`
      + `--mc-selected-icon:${cs.button_selected_icon_color};`
      + `--mc-state-color:${cs.button_state_color};--mc-selected-state-color:${cs.button_selected_state_color};`
      + `--mc-icon-size:${cs.button_icon_size}px;--mc-state-size:${cs.button_state_size}px;`
      + `--mc-opt-border:${cs.button_border_color};--mc-opt-bw:${cs.button_border_width}px;`
      + `--mc-opt-radius:${cs.button_radius}px;`
      + (pad != null ? `--mc-opt-pad:${pad}px;` : '');

    // A lone button is always bordered — an unbordered single button reads as
    // plain text rather than something clickable — and always "separated",
    // since there is nothing to be joined to.
    return html`
      <div class="lines" style="${vars}">
        <div class="row sep bordered">
          ${this.renderCell(this._selfOption(), this.displayValue(), '')}
        </div>
      </div>
    `;
  }
}
