// Entity-reference collection, shared by the card and the editor.
//
// This lives in its own module rather than in mosaic-canvas.ts on purpose. The editor
// is a lazy dynamic-import chunk of the entry module, so an editor -> mosaic-canvas
// import closes a cycle between an entry and its own chunk, and Rollup resolves that
// by inlining a second copy of the whole entry module — card class, custom-element
// registration and card-picker entry included — into the editor chunk. That is what
// produced the duplicate "Mosaic Canvas Card" tile in the Lovelace picker. Keep this
// module free of any import that leads back to mosaic-canvas.ts.

import type { MosaicCanvasConfig, FieldConfig } from './types';
import { sd } from './seed-defaults';

/**
 * Every real entity id the config references. Shared with the editor (#104) —
 * both the card's shouldUpdate and the editor's gate hass-driven re-renders on
 * exactly this set, so the two can never disagree about what "referenced" means.
 */
export function collectReferencedEntities(config: MosaicCanvasConfig): string[] {
  const ids = new Set<string>();
  // 'virtual:<id>' pseudo-entities never appear in hass.states; the virtuals
  // themselves contribute their real input entities below instead.
  const add = (id: string | undefined) => {
    if (id && !id.startsWith('virtual:')) ids.add(id);
  };
  const addField = (f: FieldConfig) => {
    add(f.entity);
    add(f.charging_entity);
    add(f.tank_pct_entity);
    add(f.tank_volume_entity);
    add(f.tank_capacity_entity);
    for (const s of f.graph_series ?? []) add(s.entity);
    for (const o of f.options ?? []) add(o.entity);
    add(f.slider_labels?.left?.entity);
    add(f.slider_labels?.center?.entity);
    add(f.slider_labels?.right?.entity);
  };

  const bg = config.background;
  if (bg) {
    // Mirror resolveBackgroundUrl: each method reads exactly one selector.
    // 'single' reads none at all, so it lands in no branch.
    if (bg.source === 'state') add(bg.entity);
    else if (bg.source === 'entity') add(bg.mode_entity);
    else if (bg.source !== 'day' && bg.source !== 'night' && bg.source !== 'single') {
      add(bg.sun_entity ?? sd('sun_entity') ?? 'sun.sun');
    }
  }

  for (const card of config.cards ?? []) {
    add(card.visible_when?.entity);
    // The background-image selector: without it a state change picks a new
    // image that nothing ever renders.
    if (card.bg?.rules?.length) add(card.bg.entity);
    for (const f of card.fields) addField(f);
  }
  for (const ext of config.extended_cards ?? []) {
    for (const f of ext.fields) addField(f);
  }
  for (const v of config.virtuals ?? []) {
    for (const input of v.inputs ?? []) add(input);
    add(v.entity);
    add(v.value_entity);
    add(v.rate_entity);
    add(v.capacity_entity);
    // legacy time_until keys the runtime still reads
    add(v.pct_entity);
    add(v.power_entity);
  }
  for (const flow of config.flows ?? []) add(flow.entity);

  return [...ids];
}
