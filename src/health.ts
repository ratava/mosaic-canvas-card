/**
 * Config health analysis (#65).
 *
 * The config carries cross-references that can dangle — an `open-extended`
 * action naming a popover card that was deleted, a flow endpoint anchored to a
 * removed card, an entity that no longer exists in Home Assistant. All of them
 * fail *silently* at runtime: a blank region of canvas, or a tap that does
 * nothing. This module walks the config and names each one, so the editor's
 * Health screen can list them, deep-link (#59) to the screen that owns the
 * offending value, and — for the two "you cannot reach this from here" checks —
 * offer to clear the key outright.
 *
 * Design rules, because a false alarm here destroys trust in the whole feature
 * faster than a missed problem does:
 *
 * - **Nothing is inferred about Home Assistant's state when hass is absent.**
 *   The entity check is *skipped* and says so (`HealthReport.skipped`) rather
 *   than reporting every entity as missing.
 * - **`virtual:<id>` pseudo-entities never appear in `hass.states`** and are
 *   excluded from the entity check; the separate `virtual-ref` check validates
 *   them against `virtuals[]`. Mirrors the runtime's own walker (see
 *   `_referencedEntities` in `mosaic-canvas.ts`).
 * - **The two editor-reachability checks are driven by the #64 `paths`
 *   manifests**, supplied by the editor via `HealthContext` — never by a
 *   hand-copied key list here, which is exactly the drift that produced the
 *   problems these checks exist to find.
 * - **Whatever is not scanned says so** (`HealthReport.coverage`). A screen that
 *   reports nothing must not read as "everything was checked".
 * - **Every row has a stable id** so an ignore survives reorders and renames.
 *
 * This module is pure: no DOM, no lit, no editor state, and it never mutates the
 * config. A `removal` descriptor says *what* a Remove button would clear; the
 * editor decides how, through the same `SectionScope` machinery an ordinary edit
 * uses.
 */

import type { HomeAssistant } from 'custom-card-helpers';
import { isControlField } from './types';
import { cardLayoutMode, sd } from './seed-defaults';
import { MANAGED_KEYS } from './controls/variants';
import type {
  MosaicCanvasConfig,
  CardConfig,
  ExtendedCardConfig,
  FieldConfig,
  ZoneConfig,
  FlowConfig,
  VirtualConfig,
  EmbeddedCardConfig,
  ActionConfig,
  TapActions,
} from './types';

// ── Public shape ─────────────────────────────────────────────────────────────

export type HealthCheckId =
  | 'popover-ref'
  | 'flow-endpoint'
  | 'no-write-target'
  | 'entity'
  | 'virtual-ref'
  | 'unreachable-key'
  | 'unpickable-value'
  | 'grid-placement';

/**
 * `error` — the value is wrong at runtime: a reference that resolves to nothing,
 * so whatever it drives is dead, or (since #102) a placement the card's own grid
 * cannot honour, so the field lands somewhere the author did not put it. `info` —
 * the config is intact and working, but this editor has no way to show or change
 * the value; the user set it in YAML.
 *
 * The split is load-bearing twice over. The Settings tab badge counts errors
 * only, so a deliberately YAML-only key (`dock`, say) doesn't sit there flagging
 * a problem that isn't one. And only `info` rows offer Remove: clearing a key
 * with no screen is unambiguous, whereas clearing a broken *reference* is lossy
 * — a missing entity id at least records what was intended, so the repair
 * belongs on the owning screen, which the row already links to.
 */
export type HealthSeverity = 'error' | 'info';

/** Container kinds the reachability, picker and removal machinery are keyed by. */
export type HealthKind = 'card' | 'extCard' | 'field' | 'zone' | 'flow' | 'emb' | 'virtual';

/** A `_navigateTo(tab, panel, path)` argument triple (#59). */
export interface HealthNavTarget {
  tab: 'cards' | 'elements' | 'settings';
  panel: string;
  path: { key: string; label?: string }[];
}

/**
 * What a Remove button clears, addressed by stable id so it still resolves if
 * the config was reordered between render and click. Present on `info` rows
 * only — see HealthSeverity.
 */
export interface HealthRemoval {
  kind: HealthKind;
  /**
   * `field` only: the field lives on a popover card rather than a Mosaic one, so
   * the owning list is `extended_cards[]`. The card kinds don't need it — `card`
   * and `extCard` are already separate kinds.
   */
  extended?: boolean;
  /** Owning card id — `field` only. */
  cardId?: string;
  /** The container's own stable id. */
  itemId: string;
  /** Top-level config key to clear. */
  key: string;
}

export interface HealthIssue {
  /**
   * Stable identity, `<check>|<container ref>|<slot>`. The ignore list is keyed
   * on it, so it must not move when lists are reordered — hence container ids
   * rather than indices. Sub-item slots (`points.1`, `inputs.1`,
   * `graph_series.0.entity`) stay positional, matching the positional sub-item
   * crumbs the nav model already uses.
   */
  id: string;
  check: HealthCheckId;
  severity: HealthSeverity;
  /** Breadcrumb-style location, e.g. `Mosaic Cards › Battery › Level`. */
  where: string;
  /** One line stating the problem. */
  detail: string;
  icon: string;
  /** In `config.health_ignore` — listed under the footer toggle, not in a group. */
  ignored: boolean;
  /**
   * Screen to open for this row. For `unreachable-key` there is by definition no
   * screen holding the value, so the target is the nearest one that exists (the
   * container's own section menu) rather than nothing at all.
   */
  target?: HealthNavTarget;
  removal?: HealthRemoval;
}

export interface HealthReport {
  issues: HealthIssue[];
  /** Checks that could not run this pass, and why. Keeps a clean screen honest. */
  skipped: { check: HealthCheckId; reason: string }[];
  /** Prose notes on what a check deliberately does not cover. */
  coverage: string[];
}

/**
 * One container's `NavSectionDef` tables, reduced to the two lookups the walk
 * needs. They are always wanted together, so they are one type rather than two
 * parallel per-kind registries that had to be kept in step by hand.
 */
export interface HealthScreens {
  /**
   * Top-level config key → crumb key of the section screen that declares it,
   * derived from the `paths` manifests. A key absent from the map is one no
   * screen under this container offers.
   *
   * What this can and cannot detect: it finds a value the editor *declares no
   * screen for*. It cannot find a slot a screen declares but forgot to render a
   * row for — that is a source-level drift between a def's `paths` and its
   * render method (issue #30's exact shape), invisible from the config alone and
   * guarded instead by the DRIFT RULE on `NavSectionDef`.
   */
  slots: ReadonlyMap<string, string>;
  /**
   * Section crumb key → its screen label. A crumb pushed without one gets the
   * key's tail as its label (see `_navigateTo`), which lands the user on a screen
   * titled `sec:actions` — so every crumb this module emits carries the real
   * label instead.
   */
  labels: ReadonlyMap<string, string>;
}

/**
 * Everything the walk needs from the editor. Both registries are deliberately
 * *supplied* rather than restated here: the editor's `NavSectionDef` tables are
 * the single source of truth for what a screen can edit (`paths`, #64), what it
 * is called, and what a picker offers. A second copy in this file would drift.
 */
export interface HealthContext {
  /**
   * The screens under one container. A single accessor rather than a per-kind
   * record because half the kinds need the item anyway — a field's sections are
   * chosen by its type and a virtual's by its op — and it must resolve the
   * *whole* subtree, not just the top-level menu: several child screens
   * (a selector's Option Layout, the per-state control-style screens) hold slots
   * their parent section explicitly disclaims, and missing them reported
   * perfectly editable keys as unreachable.
   *
   * `canvas` contributes labels only; the config root is outside the editability
   * checks (see `coverage`).
   */
  screens: (kind: HealthKind | 'canvas', item?: FieldConfig | VirtualConfig) => HealthScreens;
  /** Values each picker offers, per container kind then config key. */
  offered: Partial<Record<HealthKind, Readonly<Record<string, readonly string[]>>>>;
  /** Display name for a field, matching the editor's field list. */
  fieldName: (f: FieldConfig) => string;
}

export const HEALTH_CHECKS: readonly { id: HealthCheckId; label: string; hint: string; icon: string }[] = [
  { id: 'popover-ref',      label: 'Dangling popover actions',  hint: 'Open Popover pointing at a card that no longer exists',    icon: 'mdi:picture-in-picture-bottom-right' },
  { id: 'flow-endpoint',    label: 'Broken flow endpoints',     hint: 'Flow point anchored to a removed card',                    icon: 'mdi:chart-timeline-variant' },
  { id: 'no-write-target',  label: 'Nowhere to write',          hint: 'A value is set, but there is no entity to write it to',    icon: 'mdi:pencil-off-outline' },
  { id: 'entity',           label: 'Missing entities',          hint: 'Entity not present in Home Assistant',                     icon: 'mdi:database-off-outline' },
  { id: 'virtual-ref',      label: 'Dangling virtual entities', hint: 'A virtual: reference with no matching virtual entity',     icon: 'mdi:memory' },
  { id: 'unreachable-key',  label: 'Not editable here',         hint: 'Set in YAML — this editor offers no screen for it',        icon: 'mdi:code-braces' },
  { id: 'unpickable-value', label: 'Value not offered',         hint: 'Legal in YAML but absent from this editor\'s picker',      icon: 'mdi:format-list-bulleted-type' },
  { id: 'grid-placement',   label: 'Grid placement problems',   hint: 'A field outside its card\'s cells, or sharing one',        icon: 'mdi:view-grid-outline' },
];

const CHECK_ICON: Record<HealthCheckId, string> =
  HEALTH_CHECKS.reduce((m, c) => { m[c.id] = c.icon; return m; }, {} as Record<HealthCheckId, string>);

// ── Internals ────────────────────────────────────────────────────────────────

/**
 * Keys a container legitimately carries that no section screen declares:
 * identity, child collections, and values written by a drag or a picker rather
 * than by a form row. Anything not listed here and not in the `paths` manifests
 * is genuinely orphaned, which is the point — keep this list minimal, and add to
 * it only for a value that really is set somewhere other than a section screen.
 */
/**
 * A field's content bindings, excluded from the reachability check on every
 * type. They are never *stray* config — `checkRef` already validates them, so
 * a broken one is reported as a missing entity rather than as an unreachable
 * key, which is the more useful of the two.
 *
 * The exclusion also avoids a noisy edge case. `_fieldSectionDefs` drops Entity
 * & Action for a manual-source selector, on the reasoning that its options each
 * carry their own entity — which the per-option screen does provide, so for the
 * ordinary manual selector `field.entity` is genuinely unused and there is
 * nothing missing. It is only load-bearing for an option left with a blank
 * Entity, which that screen supports and documents ("writes its value to the
 * field's entity"): `McSelector._activate` falls through to `commit(o.value)`
 * against `field.entity`. Firing on every manual selector to catch that would
 * be a bad trade, and Remove would break the write-back outright.
 */
const FIELD_CONTENT_BINDINGS = ['entity', 'attribute'] as const;

const STRUCTURAL: Record<HealthKind, readonly string[]> = {
  // NOTE the asymmetry with the rest of this module: `slots` is derived from the
  // editor's own manifests, but this — its complement — is a hand-written list,
  // because "written somewhere other than a section screen" is not something a
  // manifest records. It is therefore the one place a new drag-set or
  // picker-set key can produce a false alarm. A key added to the field header,
  // the Element Library picker or any drag handler belongs here in the same
  // change.
  // `position` is set by dragging the card in the mosaic editor, `group` by the
  // group-drag tooling. Neither has a form row and neither should be reported.
  card:    ['id', 'fields', 'position', 'group'],
  extCard: ['id', 'fields'],
  // `type`/`variant` come from the field header's own two dropdowns, `svg` and
  // `shape` from the Element Library picker, `time_until_layout` from the
  // layout-builder modal — none of them rows on a section screen.
  // `row`/`row_end` sit beside `column`/`column_end` in the field header, and
  // only appear there while the owning card is in grid field placement (#102).
  field:   ['id', 'type', 'variant', 'svg', 'shape', 'display_name', 'column', 'column_end',
            'row', 'row_end', 'time_until_layout', ...FIELD_CONTENT_BINDINGS],
  zone:    ['id'],
  // Points are their own crumb (`pt:<i>`) below the flow, not a slot on it.
  flow:    ['id', 'points'],
  emb:     ['id', 'group'],
  // Inputs are their own crumb (`vin:<i>`).
  virtual: ['id', 'inputs'],
};

const ACTION_KEYS = ['tap_action', 'hold_action', 'double_tap_action'] as const;

const ACTION_LABEL: Record<(typeof ACTION_KEYS)[number], string> = {
  tap_action: 'Tap action',
  hold_action: 'Hold action',
  double_tap_action: 'Double-tap action',
};


/**
 * Keys a *variant preset* writes on a control field. Suppressed there, and only
 * there: the user never typed them, and Remove on `control_service_data` or
 * `value_scale` would silently break the control's write-back. Imported from the
 * variant machinery rather than restated, so a new preset key needs no change
 * here. Non-control fields never receive a preset, so a stray `min` on a `value`
 * field is still reported.
 */
const VARIANT_WRITTEN: readonly string[] = MANAGED_KEYS as readonly string[];

/** The structural allowlist for one container, which is type-dependent for fields. */
function structuralFor(kind: HealthKind, item: Record<string, unknown>): readonly string[] {
  if (kind !== 'field') return STRUCTURAL[kind];
  return isControlField(item.type as FieldConfig['type'])
    ? [...STRUCTURAL.field, ...VARIANT_WRITTEN]
    : STRUCTURAL.field;
}

/**
 * The field structural allowlist, exported for the editor's type-change prune
 * (#109). A type change keeps exactly what this walk would not flag: the keys
 * the new type's manifests claim, plus these — keys legitimately set outside
 * any section screen. Sharing the list is the point: prune and check cannot
 * drift, so a type change can never strand a key this module would report.
 */
export function fieldStructuralKeys(field: { type?: FieldConfig['type'] }): readonly string[] {
  return structuralFor('field', field as Record<string, unknown>);
}

const VIRTUAL_PREFIX = 'virtual:';

type Crumb = { key: string; label?: string };

/** A crumb builder bound to one container's section-label map. */
function crumbs(labels: ReadonlyMap<string, string>): (key: string) => Crumb {
  return (key) => {
    const label = labels.get(key);
    return label ? { key, label } : { key };
  };
}

export function collectHealthIssues(
  cfg: MosaicCanvasConfig | undefined,
  hass: HomeAssistant | undefined,
  ctx: HealthContext,
): HealthReport {
  const issues: HealthIssue[] = [];
  const skipped: HealthReport['skipped'] = [];
  // The config root and `defaults` are deliberately outside the two editability
  // checks. The root's own keys are all either structural or Lovelace's
  // (`view_layout`, `grid_options`, …), which we neither own nor should report;
  // `defaults` is a several-hundred-key surface whose manifest coverage has not
  // been verified end to end, and an unverified manifest there would produce
  // exactly the false alarms this module exists to avoid. #64's override badges
  // already surface what is set on those screens.
  const coverage = [
    'Global Defaults and the config root are not scanned for keys this editor cannot reach — their override badges cover that ground instead.',
    'Grid placement is checked for cells outside the card and for two fields sharing one. Whether a field is too big for its cell is not checked — that depends on the rendered text, which this screen cannot measure.',
  ];
  // Derived from the registry rather than written by hand, so it cannot claim
  // coverage the check does not have. Dropdowns that assemble their options
  // inline have no entry and are therefore named as uncovered by omission.
  const pickerKeys = [...new Set(
    Object.values(ctx.offered).flatMap((byKey) => Object.keys(byKey ?? {})),
  )].sort();
  if (pickerKeys.length) {
    coverage.push(`Picker values are verified for ${pickerKeys.join(', ')}. Other dropdowns build their option list inline and are not checked.`);
  }
  if (!cfg) return { issues, skipped, coverage };

  const cards = cfg.cards ?? [];
  const extCards = cfg.extended_cards ?? [];
  const embCards = cfg.embedded_cards ?? [];
  const zones = cfg.zones ?? [];
  const flows = cfg.flows ?? [];
  const virtuals = cfg.virtuals ?? [];

  const cardIds = new Set(cards.map((c) => c.id));
  const extCardIds = new Set(extCards.map((c) => c.id));
  const virtualIds = new Set(virtuals.map((v) => v.id));
  const ignored = new Set(cfg.health_ignore ?? []);

  // An absent hass means "not loaded yet", never "no entities exist" — see the
  // module header. Every other check still runs.
  const states = hass?.states;
  if (!states) {
    skipped.push({
      check: 'entity',
      reason: 'Home Assistant state is not available to the editor yet, so entity references were not verified.',
    });
  }

  const add = (o: {
    check: HealthCheckId;
    severity: HealthSeverity;
    /** Container ref for the id — `card:c1`, `xfield:popA/pf1`, `canvas`, … */
    ref: string;
    /** Slot within the container for the id — `entity`, `points.1`, `dock`, … */
    slot: string;
    where: string;
    detail: string;
    target?: HealthNavTarget;
    removal?: HealthRemoval;
  }): void => {
    const id = `${o.check}|${o.ref}|${o.slot}`;
    issues.push({
      id,
      check: o.check,
      severity: o.severity,
      where: o.where,
      detail: o.detail,
      icon: CHECK_ICON[o.check],
      ignored: ignored.has(id),
      ...(o.target ? { target: o.target } : {}),
      ...(o.removal ? { removal: o.removal } : {}),
    });
  };

  /** Entity and virtual-reference checks for one slot. */
  const checkRef = (value: string | undefined, o: {
    ref: string; slot: string; label: string; where: string; target?: HealthNavTarget;
  }): void => {
    if (!value) return;
    if (value.startsWith(VIRTUAL_PREFIX)) {
      const id = value.slice(VIRTUAL_PREFIX.length);
      if (!virtualIds.has(id)) {
        add({
          check: 'virtual-ref', severity: 'error', ref: o.ref, slot: o.slot, where: o.where,
          detail: `${o.label} points at virtual entity “${id}”, which is not in the Virtual Entities list.`,
          target: o.target,
        });
      }
      return;
    }
    if (!states) return;
    if (!states[value]) {
      add({
        check: 'entity', severity: 'error', ref: o.ref, slot: o.slot, where: o.where,
        detail: `${o.label} is set to “${value}”, which does not exist in Home Assistant.`,
        target: o.target,
      });
    }
  };

  /** The open-extended target plus every entity an action touches. */
  const checkActions = (holder: TapActions, o: {
    ref: string; where: string; target?: HealthNavTarget; slotPfx?: string;
  }): void => {
    for (const key of ACTION_KEYS) {
      const a: ActionConfig | undefined = holder[key];
      if (!a) continue;
      const label = ACTION_LABEL[key];
      const slot = `${o.slotPfx ?? ''}${key}`;
      if (a.action === 'open-extended') {
        if (!a.extended_card_id) {
          add({
            check: 'popover-ref', severity: 'error', ref: o.ref, slot, where: o.where,
            detail: `${label} opens a popover card but names none.`, target: o.target,
          });
        } else if (!extCardIds.has(a.extended_card_id)) {
          add({
            check: 'popover-ref', severity: 'error', ref: o.ref, slot, where: o.where,
            detail: `${label} opens popover card “${a.extended_card_id}”, which is not in the Popover Cards list.`,
            target: o.target,
          });
        }
      }
      // `target` may hold one id or a list; `entity` covers more-info / toggle.
      const ents: string[] = [];
      if (a.entity) ents.push(a.entity);
      const t = a.target?.entity_id;
      if (typeof t === 'string') ents.push(t);
      else if (Array.isArray(t)) ents.push(...t.filter((s): s is string => typeof s === 'string'));
      ents.forEach((e, ei) => checkRef(e, {
        ref: o.ref, slot: `${slot}.entity.${ei}`, label: `${label} entity`, where: o.where, target: o.target,
      }));
    }
  };

  /**
   * The two editor-reachability checks for one container: `slots` decides
   * whether a key has a screen at all, `offered` whether its value is pickable
   * on that screen. Both come from the editor's own tables — see HealthContext.
   *
   * Both findings carry a `removal`: the value has no screen (or no picker
   * entry), so clearing the key is the only repair this editor can offer, and it
   * reverts the slot to whatever the fallback chain resolves.
   */
  const checkEditability = (o: {
    kind: HealthKind;
    item: Record<string, unknown>;
    screens: HealthScreens;
    ref: string;
    where: string;
    /** Crumb path to the container itself; a section crumb is appended when known. */
    base: HealthNavTarget;
    /** Builds the Remove descriptor for one of this container's keys. */
    removal: (key: string) => HealthRemoval;
  }): void => {
    const structural = structuralFor(o.kind, o.item);
    const offered = ctx.offered[o.kind];
    const sec = crumbs(o.screens.labels);
    for (const [key, value] of Object.entries(o.item)) {
      if (value === undefined) continue;
      const sectionKey = o.screens.slots.get(key);
      if (sectionKey === undefined) {
        if (structural.includes(key)) continue;
        add({
          check: 'unreachable-key', severity: 'info', ref: o.ref, slot: key, where: o.where,
          detail: `“${key}” is set in the YAML but no screen in this editor can show or change it.`,
          target: o.base, removal: o.removal(key),
        });
        continue;
      }
      const legal = offered?.[key];
      if (legal && typeof value === 'string' && value !== '' && !legal.includes(value)) {
        add({
          check: 'unpickable-value', severity: 'info', ref: o.ref, slot: key, where: o.where,
          detail: `“${key}” is “${value}”, which this editor's picker does not offer — it can only be changed in YAML.`,
          target: { ...o.base, path: [...o.base.path, sec(sectionKey)] },
          removal: o.removal(key),
        });
      }
    }
  };

  // ── Fields, shared between the Mosaic and Popover stacks ───────────────────
  // The section crumb keys are identical for both (`_fieldSectionDefs` is
  // shared); only the panel, the graph-series / option crumb prefixes and the
  // removal stack differ.
  const walkFields = (
    panel: 'mosaic' | 'popover',
    panelTitle: string,
    cardCrumb: Crumb,
    cardId: string,
    cardName: string,
    fields: FieldConfig[],
  ): void => {
    const extended = panel === 'popover';
    const seriesPfx = extended ? 'egs' : 'gs';
    const optionPfx = extended ? 'eopt' : 'opt';
    const refPfx = extended ? 'xfield' : 'field';
    fields.forEach((f) => {
      const name = ctx.fieldName(f);
      const where = `${panelTitle} › ${cardName} › ${name}`;
      const ref = `${refPfx}:${cardId}/${f.id}`;
      const fieldCrumb: Crumb = { key: `field:${f.id}`, label: name };
      const screens = ctx.screens('field', f);
      const sec = crumbs(screens.labels);
      const at = (...path: Crumb[]): HealthNavTarget =>
        ({ tab: 'cards', panel, path: [cardCrumb, fieldCrumb, ...path] });
      // A control field keeps its entity and its gestures together on Entity &
      // Action; every other type has Value Source and a separate Actions
      // section. Mirrors _fieldSectionDefs.
      const control = isControlField(f.type);
      const source = sec(control ? 'fsec:control' : 'fsec:source');

      checkRef(f.entity, { ref, slot: 'entity', label: 'Entity', where, target: at(source) });
      for (const [key, label] of [
        ['charging_entity', 'Charging entity'],
        ['tank_pct_entity', 'Tank % entity'],
        ['tank_volume_entity', 'Tank volume entity'],
        ['tank_capacity_entity', 'Tank capacity entity'],
      ] as const) {
        checkRef(f[key], { ref, slot: key, label, where, target: at(sec('fsec:source')) });
      }

      (f.graph_series ?? []).forEach((s, si) => {
        // Sub-item crumbs are positional and have no def, so their label is
        // generated here the same way the list row generates its own.
        const sName = s.label || s.entity || `Series ${si + 1}`;
        checkRef(s.entity, {
          ref, slot: `graph_series.${si}.entity`, label: 'Series entity',
          where: `${where} › ${sName}`,
          target: at(sec('fsec:series'), { key: `${seriesPfx}:${si}`, label: sName }),
        });
      });

      (f.options ?? []).forEach((opt, oi) => {
        const oName = opt.label || opt.value || `Option ${oi + 1}`;
        const oWhere = `${where} › ${oName}`;
        const oTarget = at(sec('fsec:options'), { key: `${optionPfx}:${oi}`, label: oName });
        checkRef(opt.entity, {
          ref, slot: `options.${oi}.entity`, label: 'Option entity', where: oWhere, target: oTarget,
        });
        checkActions(opt, { ref, where: oWhere, target: oTarget, slotPfx: `options.${oi}.` });
      });

      for (const side of ['left', 'center', 'right'] as const) {
        checkRef(f.slider_labels?.[side]?.entity, {
          ref, slot: `slider_labels.${side}.entity`, label: `${side} track label entity`,
          where, target: at(sec('fsec:sliderpoints')),
        });
      }

      checkActions(f, { ref, where, target: at(sec(control ? 'fsec:control' : 'fsec:actions')) });

      // A control with something to write and nowhere to write it. `McSelector`
      // renders a cell `disabled` when the option is a *value* option (no entity
      // of its own) and the field has no entity either —
      // `o.entity ? !states[o.entity] : !this.entityId` — and that lands on the
      // cell's own <button>, which then takes no pointer events at all. So the
      // option is fully inert: no write, and no tap/hold/double-tap action
      // either, even where one is configured. A button inherits the same rule,
      // because `_selfOption()` drops the entity as soon as `button_value` makes
      // it a value option. The entity-option branch of that expression is the
      // missing-entity case `checkRef` already reports.
      //
      // An option whose own tap action opens a popover is the exception: that
      // action replaces the write entirely (`McSelector._activate`), so having
      // nothing to write to is not a misconfiguration — the option just renders
      // unselected and stays tappable.
      if (!f.entity) {
        // A per-option entity only rescues a *selector*. `McDropdown._select`
        // calls `commit(value)` with no target, so a dropdown always writes to
        // the field's entity and ignores the option's own — there, every option
        // with a value is dead, whatever entity it carries.
        const dead = (f.options ?? []).filter((o) =>
          (o.value ?? '') !== '' && (f.type === 'dropdown' || !o.entity)
          && !(f.type === 'button_group' && o.tap_action?.action === 'open-extended'));
        if ((f.type === 'button_group' || f.type === 'dropdown') && dead.length) {
          const n = dead.length;
          const one = n === 1;
          add({
            check: 'no-write-target', severity: 'error', ref, slot: 'entity', where,
            detail: `${n} option${one ? '' : 's'} write${one ? 's' : ''} a value to this field's entity, but the field has none — ${one ? 'it renders' : 'they render'} disabled and can do nothing. ${f.type === 'dropdown'
              ? 'Set an entity on the field — a dropdown always writes to it and ignores an entity set on the option.'
              : `Give ${one ? 'the option its own entity' : 'each option its own entity'}, or set one on the field.`}`,
            target: at(sec('fsec:options')),
          });
        }
        if (f.type === 'button' && (f.button_value ?? '') !== '') {
          add({
            check: 'no-write-target', severity: 'error', ref, slot: 'button_value', where,
            detail: `Press writes “${f.button_value}” to this field's entity, but the field has none — the button renders disabled.`,
            target: at(sec('fsec:options')),
          });
        }
      }

      checkEditability({
        kind: 'field', item: f as unknown as Record<string, unknown>, screens,
        ref, where, base: { tab: 'cards', panel, path: [cardCrumb, fieldCrumb] },
        removal: (key) => ({ kind: 'field', extended, cardId, itemId: f.id, key }),
      });
    });
  };

  /**
   * Grid field placement (#102). Only a card in that mode has cells to be wrong
   * about, so a flow card is silent here — `row` on a flow card is unused config,
   * not a fault, and the editor hides the row entirely.
   *
   * What is checked is what the config can actually be wrong about: a track the
   * card does not have, a span that ends before it starts, and two fields claiming
   * the same cell. Overflow — a field too big for its cell — is deliberately not
   * here and is named in `coverage` instead: it depends on rendered text metrics,
   * which this walker has no access to, and guessing would produce exactly the
   * false alarms the module header forbids.
   */
  const checkGridPlacement = (
    c: CardConfig,
    o: { where: string; crumb: Crumb },
  ): void => {
    if (cardLayoutMode(c, cfg.defaults) !== 'grid') return;
    const cols = c.grid?.columns ?? cfg.defaults?.card_grid_columns ?? sd('card_grid_columns') ?? 4;
    const rows = c.grid?.rows ?? cfg.defaults?.card_grid_rows ?? sd('card_grid_rows') ?? 4;
    // "r,c" -> the field already holding it. Only fields pinned on both axes are
    // entered: with one axis auto-placed, which cell it lands in is decided by the
    // browser's own placement, and calling that a collision would be a guess.
    const taken = new Map<string, string>();

    (c.fields ?? []).forEach((f) => {
      const name = ctx.fieldName(f);
      const ref = `field:${c.id}/${f.id}`;
      const where = `${o.where} › ${name}`;
      const target: HealthNavTarget = { tab: 'cards', panel: 'mosaic', path: [o.crumb, { key: `field:${f.id}`, label: name }] };
      const report = (slot: string, detail: string): void =>
        add({ check: 'grid-placement', severity: 'error', ref, slot, where, detail, target });

      for (const [axis, start, end, limit, label] of [
        ['column', f.column, f.column_end, cols, 'Column'],
        ['row', f.row, f.row_end, rows, 'Row'],
      ] as const) {
        if (start != null && (start < 1 || start > limit)) {
          report(axis, `${label} ${start} is outside this card's grid, which is ${limit} ${axis}${limit === 1 ? '' : 's'} — the field renders outside the cells the card sizes.`);
        }
        if (end != null) {
          if (end > limit) {
            report(`${axis}_end`, `${label} span ends at ${end}, past this card's ${limit} ${axis}${limit === 1 ? '' : 's'} — the field renders outside the cells the card sizes.`);
          } else if (start != null && end <= start) {
            report(`${axis}_end`, `${label} span ends at ${end}, which is not past its start of ${start} — the span is ignored and the field occupies one cell.`);
          }
        }
      }

      if (f.row == null || f.column == null) return;
      const rEnd = f.row_end != null && f.row_end > f.row ? f.row_end : f.row;
      const cEnd = f.column_end != null && f.column_end > f.column ? f.column_end : f.column;
      for (let r = f.row; r <= rEnd; r++) {
        for (let cc = f.column; cc <= cEnd; cc++) {
          const key = `${r},${cc}`;
          const holder = taken.get(key);
          if (holder && holder !== name) {
            report('row', `Shares row ${r}, column ${cc} with “${holder}” — both render, one on top of the other.`);
            return;
          }
          taken.set(key, name);
        }
      }
    });
  };

  const cardScreens = ctx.screens('card');
  const cardSec = crumbs(cardScreens.labels);
  cards.forEach((c: CardConfig, i) => {
    const name = c.name ?? `Card ${i + 1}`;
    const where = `Mosaic Cards › ${name}`;
    const ref = `card:${c.id}`;
    const crumb: Crumb = { key: `card:${c.id}`, label: name };
    const at = (key?: string): HealthNavTarget =>
      ({ tab: 'cards', panel: 'mosaic', path: key ? [crumb, cardSec(key)] : [crumb] });
    checkRef(c.visible_when?.entity, {
      ref, slot: 'visible_when.entity', label: 'Visibility condition entity',
      where, target: at('sec:visibility'),
    });
    // Only when rules exist: an entity with no rules selects nothing, so a
    // dangling reference there changes no behaviour and isn't worth a report.
    if (c.bg?.rules?.length) {
      checkRef(c.bg.entity, {
        ref, slot: 'bg.entity', label: 'Background image entity',
        where, target: at('sec:bg'),
      });
    }
    checkActions(c, { ref, where, target: at('sec:actions') });
    checkEditability({
      kind: 'card', item: c as unknown as Record<string, unknown>, screens: cardScreens,
      ref, where, base: at(),
      removal: (key) => ({ kind: 'card', itemId: c.id, key }),
    });
    walkFields('mosaic', 'Mosaic Cards', crumb, c.id, name, c.fields ?? []);
    checkGridPlacement(c, { where, crumb });
  });

  const extScreens = ctx.screens('extCard');
  extCards.forEach((c: ExtendedCardConfig, i) => {
    const name = c.name ?? `Popover Card ${i + 1}`;
    const crumb: Crumb = { key: `card:${c.id}`, label: name };
    checkEditability({
      kind: 'extCard', item: c as unknown as Record<string, unknown>, screens: extScreens,
      ref: `xcard:${c.id}`, where: `Popover Cards › ${name}`,
      base: { tab: 'cards', panel: 'popover', path: [crumb] },
      removal: (key) => ({ kind: 'extCard', itemId: c.id, key }),
    });
    walkFields('popover', 'Popover Cards', crumb, c.id, name, c.fields ?? []);
  });

  const embScreens = ctx.screens('emb');
  embCards.forEach((ec: EmbeddedCardConfig, i) => {
    const name = ec.name ?? ec.id ?? `Embedded ${i + 1}`;
    checkEditability({
      kind: 'emb', item: ec as unknown as Record<string, unknown>, screens: embScreens,
      ref: `emb:${ec.id}`, where: `Embedded External Cards › ${name}`,
      base: { tab: 'cards', panel: 'embedded', path: [{ key: `emb:${ec.id}`, label: name }] },
      removal: (key) => ({ kind: 'emb', itemId: ec.id, key }),
    });
  });

  const zoneScreens = ctx.screens('zone');
  const zoneSec = crumbs(zoneScreens.labels);
  zones.forEach((z: ZoneConfig, i) => {
    const name = z.name ?? z.id ?? `Zone ${i + 1}`;
    const where = `Clickable Zones › ${name}`;
    const ref = `zone:${z.id}`;
    const crumb: Crumb = { key: `zone:${z.id}`, label: name };
    const at = (key?: string): HealthNavTarget =>
      ({ tab: 'elements', panel: 'zones', path: key ? [crumb, zoneSec(key)] : [crumb] });
    checkActions(z, { ref, where, target: at('sec:actions') });
    checkEditability({
      kind: 'zone', item: z as unknown as Record<string, unknown>, screens: zoneScreens,
      ref, where, base: at(),
      removal: (key) => ({ kind: 'zone', itemId: z.id, key }),
    });
  });

  const flowScreens = ctx.screens('flow');
  const flowSec = crumbs(flowScreens.labels);
  flows.forEach((f: FlowConfig, i) => {
    const name = f.name ?? f.id ?? `Flow ${i + 1}`;
    const where = `Animated Flow Lines › ${name}`;
    const ref = `flow:${f.id}`;
    const crumb: Crumb = { key: `flow:${f.id}`, label: name };
    const at = (...path: Crumb[]): HealthNavTarget =>
      ({ tab: 'elements', panel: 'flows', path: [crumb, ...path] });
    checkRef(f.entity, { ref, slot: 'entity', label: 'Entity', where, target: at(flowSec('sec:defaults')) });
    (f.points ?? []).forEach((p, pi) => {
      if (p.card && !cardIds.has(p.card)) {
        add({
          check: 'flow-endpoint', severity: 'error', ref, slot: `points.${pi}`, where,
          detail: `Point ${pi + 1} is anchored to card “${p.card}”, which no longer exists — the point falls back to the canvas origin.`,
          target: at({ key: `pt:${pi}`, label: `Point ${pi + 1}` }),
        });
      }
    });
    checkEditability({
      kind: 'flow', item: f as unknown as Record<string, unknown>, screens: flowScreens,
      ref, where, base: at(),
      removal: (key) => ({ kind: 'flow', itemId: f.id, key }),
    });
  });

  virtuals.forEach((v: VirtualConfig, i) => {
    const name = v.name || v.id || `Virtual ${i + 1}`;
    const where = `Virtual Entities › ${name}`;
    const ref = `virt:${v.id}`;
    const crumb: Crumb = { key: `virt:${v.id}`, label: name };
    const screens = ctx.screens('virtual', v);
    const sec = crumbs(screens.labels);
    const at = (...path: Crumb[]): HealthNavTarget =>
      ({ tab: 'elements', panel: 'virtuals', path: [crumb, ...path] });
    (v.inputs ?? []).forEach((input, ii) => {
      checkRef(input, {
        ref, slot: `inputs.${ii}`, label: `Input ${ii + 1}`, where,
        target: at({ key: `vin:${ii}`, label: input || `Input ${ii + 1}` }),
      });
    });
    checkRef(v.entity, { ref, slot: 'entity', label: 'Source entity', where, target: at(sec('sec:value')) });
    // The current/legacy pairs are read as `current ?? legacy` by the runtime, so
    // only the one it would actually use is checked — a stale legacy key behind a
    // live current one is dead config, not a broken reference.
    const timeUntil = sec('sec:tu');
    checkRef(v.value_entity ?? v.pct_entity, { ref, slot: 'value_entity', label: 'Value entity', where, target: at(timeUntil) });
    checkRef(v.rate_entity ?? v.power_entity, { ref, slot: 'rate_entity', label: 'Rate entity', where, target: at(timeUntil) });
    checkRef(v.capacity_entity, { ref, slot: 'capacity_entity', label: 'Capacity entity', where, target: at(timeUntil) });
    checkEditability({
      kind: 'virtual', item: v as unknown as Record<string, unknown>, screens,
      ref, where, base: at(),
      removal: (key) => ({ kind: 'virtual', itemId: v.id, key }),
    });
  });

  // Background mode entities, gated exactly the way resolveMode reads them, so a
  // stale entity behind an inactive source isn't reported as breaking anything.
  const bg = cfg.background;
  if (bg) {
    const target: HealthNavTarget = {
      tab: 'settings', panel: 'canvas', path: [crumbs(ctx.screens('canvas').labels)('sec:bg')],
    };
    const bgSlot = { ref: 'background', where: 'Canvas › Background', target };
    if (bg.source === 'state') {
      // The state method's selector, on the same footing as a card's (#103):
      // only worth reporting once rules exist to be selected between.
      if (bg.rules?.length) checkRef(bg.entity, { ...bgSlot, slot: 'entity', label: 'Background image entity' });
    }
    else if (bg.source === 'entity') checkRef(bg.mode_entity, { ...bgSlot, slot: 'mode_entity', label: 'Mode entity' });
    else if (bg.source !== 'day' && bg.source !== 'night' && bg.source !== 'single') {
      // Only an explicitly configured sun entity: the seeded fallback is ours,
      // not the user's, and reporting it would blame them for our default.
      checkRef(bg.sun_entity, { ...bgSlot, slot: 'sun_entity', label: 'Sun entity' });
    }
  }

  // Canvas-level gestures. CanvasConfig extends TapActions, but the Canvas panel
  // renders no Actions section, so a broken one here can only be repaired in
  // YAML — the row still deep-links to the panel root so the location is at
  // least findable.
  if (cfg.canvas) {
    checkActions(cfg.canvas, {
      ref: 'canvas', where: 'Canvas',
      target: { tab: 'settings', panel: 'canvas', path: [] },
    });
  }

  return { issues, skipped, coverage };
}

/** Rows that badge the Settings tab — errors the user has not ignored. */
export function errorCount(report: HealthReport): number {
  return report.issues.reduce((n, i) => n + (i.severity === 'error' && !i.ignored ? 1 : 0), 0);
}
