import type { HomeAssistant } from 'custom-card-helpers';
import type { FieldConfig, GlobalDefaults } from './types';
import type { StatsMap } from './stats';
import { sd } from './seed-defaults';

export interface FormattedValue {
  value: string;
  unit: string;
}

/** Resolved virtual entity value, keyed as `virtual:<id>`. */
export type VirtualMap = Map<string, { value: number; unit: string; label?: string }>;

/**
 * Number → display text. With `decimals` set it's a plain toFixed; unset, the
 * toPrecision(12) round-trip strips float noise off computed values, so a
 * virtual summing 0.1 + 0.2 renders "0.3" and not "0.30000000000000004".
 * Shared with the SVG label paths in fill.ts, which had the same defect (#58).
 */
export function numToText(num: number, decimals: number | undefined): string {
  return decimals != null ? num.toFixed(decimals) : String(Number(num.toPrecision(12)));
}

/**
 * Shared numeric formatter — applies power_unit scaling, kWh→MWh auto-scaling,
 * and field.decimals. Called from all three value paths (HA entity, virtual, stat).
 */
function formatNumeric(
  num: number,
  entityUnit: string,
  field: FieldConfig,
  defaults: GlobalDefaults | undefined,
  deviceClass = '',
): FormattedValue {
  if (field.unit === undefined && deviceClass === 'power') {
    const valueInW = entityUnit === 'kW' ? num * 1000 : num;
    const globalUnit = defaults?.power_unit;
    if (globalUnit === 'W') {
      return { value: valueInW.toFixed(field.decimals ?? sd('decimals_w') ?? 0), unit: 'W' };
    }
    if (globalUnit === 'kW') {
      const kw = valueInW / 1000;
      const dec = field.decimals ?? (Math.abs(kw) < 10 ? 2 : 1);
      return { value: kw.toFixed(dec), unit: 'kW' };
    }
    if (Math.abs(valueInW) >= 1000) {
      const kw = valueInW / 1000;
      const dec = field.decimals ?? (Math.abs(kw) < 10 ? 2 : 1);
      return { value: kw.toFixed(dec), unit: 'kW' };
    }
    return { value: valueInW.toFixed(field.decimals ?? sd('decimals_w') ?? 0), unit: 'W' };
  }

  if (field.unit === undefined && (entityUnit === 'kWh' || entityUnit === 'MWh')) {
    const kwh = entityUnit === 'MWh' ? num * 1000 : num;
    const globalUnit = defaults?.power_unit;
    if (globalUnit === 'W') {
      const wh = kwh * 1000;
      return { value: wh.toFixed(field.decimals ?? sd('decimals_wh') ?? 0), unit: 'Wh' };
    }
    if (globalUnit === 'kW') {
      const dec = field.decimals ?? (Math.abs(kwh) < 10 ? 2 : 1);
      return { value: kwh.toFixed(dec), unit: 'kWh' };
    }
    if (Math.abs(kwh) >= 1000) {
      return { value: (kwh / 1000).toFixed(field.decimals ?? sd('decimals_mwh') ?? 2), unit: 'MWh' };
    }
    const dec = field.decimals ?? (Math.abs(kwh) < 10 ? 2 : 1);
    return { value: kwh.toFixed(dec), unit: 'kWh' };
  }

  const unit = field.unit !== undefined ? field.unit : entityUnit;
  const value = numToText(num, field.decimals);
  return { value, unit };
}

function formatDuration(hours: number): FormattedValue {
  if (!Number.isFinite(hours) || hours < 0) return { value: '--', unit: '' };
  const totalMins = Math.round(hours * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return { value: `${m}m`, unit: '' };
  if (m === 0) return { value: `${h}h`, unit: '' };
  return { value: `${h}h ${m}m`, unit: '' };
}

/**
 * Resolve and format a field's display value.
 * Priority: stat_period → virtual: prefix → live HA state
 * Power unit, kWh→MWh scaling, and field.decimals applied uniformly.
 */
export function formatFieldValue(
  hass: HomeAssistant | undefined,
  field: FieldConfig,
  defaults?: GlobalDefaults,
  virtuals?: VirtualMap,
  stats?: StatsMap,
): FormattedValue {
  if (!field.entity) return { value: '', unit: '' };

  // ── Statistics path ────────────────────────────────────────────────────────
  if (field.stat_period && stats) {
    const entry = stats.get(field.id);
    if (!entry) return { value: '—', unit: '' };
    const deviceClass = (hass?.states[field.entity]?.attributes?.device_class as string | undefined) ?? '';
    return formatNumeric(entry.value, entry.unit, field, defaults, deviceClass);
  }

  // ── Virtual entity path ────────────────────────────────────────────────────
  if (field.entity.startsWith('virtual:')) {
    const v = virtuals?.get(field.entity);
    if (!v) return { value: '', unit: '' };
    if (v.unit === 'duration') {
      // Steady-state sentinel (value < 0, e.g. -1): show the trigger/boundary
      // label ('Full', 'Empty', ...) instead of formatting it as a duration.
      if (v.value < 0 && v.label) return { value: v.label, unit: '' };
      return formatDuration(v.value);
    }
    const isPower = v.unit === 'W' || v.unit === 'kW';
    return formatNumeric(v.value, v.unit, field, defaults, isPower ? 'power' : '');
  }

  // ── Real HA entity path ────────────────────────────────────────────────────
  const stateObj = hass?.states[field.entity];
  if (!stateObj) return { value: '', unit: '' };

  const entityUnit = (stateObj.attributes?.unit_of_measurement as string | undefined) ?? '';
  const deviceClass = (stateObj.attributes?.device_class as string | undefined) ?? '';
  const raw = field.attribute ? stateObj.attributes?.[field.attribute] : stateObj.state;
  const num = Number(raw);
  const isNumeric = raw !== '' && raw !== null && raw !== undefined && Number.isFinite(num);

  if (isNumeric) return formatNumeric(num, entityUnit, field, defaults, deviceClass);

  return { value: String(raw ?? ''), unit: field.unit ?? '' };
}
