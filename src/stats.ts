import type { HomeAssistant } from 'custom-card-helpers';
import type { StatPeriod, StatSamplePeriod, StatType, MosaicCanvasConfig, GraphType, FieldConfig } from './types';
import { sd } from './seed-defaults';
import { mcDebug, mcLog, since } from './debug';

/** Keyed by field.id (or field.id:seriesIdx for graph series) → resolved value + unit. */
export type StatsMap = Map<string, { value: number; unit: string } | null>;

/** Unified stat fetch target — covers both value fields and graph series. */
export interface StatTarget {
  id: string;
  entity: string;
  /** Poll period in ms. The host groups targets by it, one timer per group. */
  refreshMs?: number;
  stat_period: StatPeriod;
  stat_type?: StatType;
  stat_period_n?: number;
  stat_period_start?: string;
  stat_period_end?: string;
}

interface StatBucket {
  start: string;
  sum?: number | null;
  change?: number | null;
  mean?: number | null;
  state?: number | null;
  max?: number | null;
  min?: number | null;
}

function computeTimeRange(
  target: StatTarget,
): { start: Date; end: Date; bucketPeriod: string } | null {
  const { stat_period: period, stat_period_n: n, stat_period_start, stat_period_end } = target;
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  // Calendar boundaries use date arithmetic, not ms offsets: subtracting
  // n * 86_400_000 from a local midnight lands at 23:00/01:00 across a DST
  // transition, while the Date constructor normalises to true local midnight.
  const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const dow = todayStart.getDay();
  const daysToMonday = dow === 0 ? 6 : dow - 1;
  const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysToMonday);
  const lastWeekStart = new Date(thisWeekStart.getFullYear(), thisWeekStart.getMonth(), thisWeekStart.getDate() - 7);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisYearStart = new Date(now.getFullYear(), 0, 1);
  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);

  switch (period) {
    case 'today':      return { start: todayStart,     end: now,           bucketPeriod: 'day' };
    case 'yesterday':  return { start: yesterdayStart,  end: todayStart,    bucketPeriod: 'day' };
    case 'this_week':  return { start: thisWeekStart,   end: now,           bucketPeriod: 'week' };
    case 'last_week':  return { start: lastWeekStart,   end: thisWeekStart, bucketPeriod: 'week' };
    case 'this_month': return { start: thisMonthStart,  end: now,           bucketPeriod: 'month' };
    case 'last_month': return { start: lastMonthStart,  end: thisMonthStart, bucketPeriod: 'month' };
    case 'this_year':  return { start: thisYearStart,   end: now,           bucketPeriod: 'month' };
    case 'last_year':  return { start: lastYearStart,   end: thisYearStart, bucketPeriod: 'month' };
    // Sub-hour windows need the recorder's 5minute buckets: hourly buckets
    // rarely start inside the window, so 'hour' returned nothing most of the time.
    case 'last_30_minutes': return { start: new Date(now.getTime() - 30 * 60_000), end: now, bucketPeriod: '5minute' };
    case 'last_hour':       return { start: new Date(now.getTime() - 3_600_000),   end: now, bucketPeriod: '5minute' };
    // A rolling day, distinct from the calendar 'today' above it — the default
    // window for a graph field (#123). Rolling, so it can't use date
    // arithmetic: 24 hours back from now is exactly that, DST included.
    case 'last_day':        return { start: new Date(now.getTime() - 86_400_000),  end: now, bucketPeriod: 'hour' };
    case 'last_n_minutes': {
      const mins = n ?? sd('stat_period_minutes_n') ?? 60;
      return { start: new Date(now.getTime() - mins * 60_000), end: now, bucketPeriod: mins <= 720 ? '5minute' : 'hour' };
    }
    case 'last_n_hours': {
      const hrs = n ?? sd('stat_period_hours_n') ?? 1;
      return { start: new Date(now.getTime() - hrs * 3_600_000), end: now, bucketPeriod: hrs <= 48 ? 'hour' : 'day' };
    }
    case 'last_n_days': {
      const days = n ?? sd('stat_period_days_n') ?? 7;
      return { start: new Date(now.getTime() - days * 86_400_000), end: now, bucketPeriod: days <= 60 ? 'day' : 'month' };
    }
    case 'last_n_months': {
      const months = n ?? sd('stat_period_months_n') ?? 1;
      // Clamp the day-of-month so month-end dates can't overflow into the
      // following month (May 31 − 1 month must not become May 1).
      const first = new Date(now.getFullYear(), now.getMonth() - months, 1);
      const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
      const start = new Date(first.getFullYear(), first.getMonth(), Math.min(now.getDate(), daysInMonth));
      return { start, end: now, bucketPeriod: 'month' };
    }
    case 'custom': {
      if (!stat_period_start || !stat_period_end) return null;
      const start = new Date(stat_period_start);
      const end = new Date(stat_period_end);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) return null;
      const diffDays = (end.getTime() - start.getTime()) / 86_400_000;
      const bucketPeriod = diffDays <= 2 ? 'hour' : diffDays <= 60 ? 'day' : 'month';
      return { start, end, bucketPeriod };
    }
    default: return null;
  }
}

function unitForEntity(hass: HomeAssistant, entityId: string): string {
  return (hass.states[entityId]?.attributes?.unit_of_measurement as string | undefined) ?? '';
}

/** Collect all stat fetch targets across value fields and graph series. */
/**
 * How often a graph field re-queries, in ms.
 *
 * `field ?? defaults ?? seed` — the same chain every styled property uses. The
 * global key stays `stat_update_interval`: config keys are frozen public API,
 * so only its editor label changed when it stopped being statistics-only.
 * Clamped to a minute so a typo can't turn a dashboard into a recorder DoS.
 */
export function graphRefreshMs(field: FieldConfig | undefined, config: MosaicCanvasConfig): number {
  const mins = field?.graph_refresh_minutes
    ?? config.defaults?.stat_update_interval
    ?? sd('stat_update_interval')
    ?? 5;
  return Math.max(1, mins) * 60_000;
}

// ── Graph Data (#123) ───────────────────────────────────────────────────────

/**
 * Hours one bucket of each sample period covers. Month and year are nominal —
 * they only ever feed a "how many buckets is this?" estimate, never a boundary.
 */
const SAMPLE_HOURS: Record<Exclude<StatSamplePeriod, 'auto'>, number> = {
  '5minute': 1 / 12,
  hour: 1,
  day: 24,
  week: 168,
  month: 730,
  year: 8760,
};

/**
 * Most buckets a chart is allowed to ask for. Set so that the finest resolution
 * survives its own retention window — 10 days of 5-minute records is 2,880 —
 * while still ruling out the combinations that are simply a mistake, like
 * hourly samples across a year.
 */
const MAX_BUCKETS = 4000;

/**
 * How far back 5-minute statistics exist. HA's recorder keeps short-term
 * statistics ~10 days and only hourly beyond, so a finer sample over a longer
 * window is not slow — it is empty.
 */
const SHORT_TERM_HOURS = 240;

/** The window a period resolves to, in hours. */
export function windowHours(period: StatPeriod, n?: number): number {
  const range = computeTimeRange({ id: '', entity: '', stat_period: period, stat_period_n: n });
  if (!range) return 24;
  return (range.end.getTime() - range.start.getTime()) / 3_600_000;
}

/**
 * Which sample periods a window can actually be drawn at.
 *
 * The editor offers exactly this list and the resolver clamps to it, so the
 * select can never promise a resolution the fetch would quietly coarsen (#123).
 * A bucket bigger than the window is excluded too — a year bucket over one day
 * is a single meaningless point.
 */
export function sampleOptionsFor(period: StatPeriod, n?: number): Exclude<StatSamplePeriod, 'auto'>[] {
  const hours = windowHours(period, n);
  return (Object.keys(SAMPLE_HOURS) as Exclude<StatSamplePeriod, 'auto'>[]).filter((s) => {
    const bucket = SAMPLE_HOURS[s];
    if (bucket > hours) return false;
    if (hours / bucket > MAX_BUCKETS) return false;
    if (s === '5minute' && hours > SHORT_TERM_HOURS) return false;
    return true;
  });
}

/** A graph field's resolved Graph Data. */
export interface GraphStat {
  /**
   * The window every series shares. Absent means live state — the aggregate
   * graph types (bar, gauge) draw the entity's current value when no window is
   * set, and that stays their unset state.
   */
  period?: StatPeriod;
  periodN?: number;
  /** Bucket resolution, already clamped to what the window can serve. */
  sample: StatSamplePeriod;
  /** Default calculation. A series' own `stat_type` still wins over it. */
  statType: StatType;
}

/** The allowed sample period closest in size to the one asked for. */
function nearestSample(
  asked: Exclude<StatSamplePeriod, 'auto'>,
  allowed: Exclude<StatSamplePeriod, 'auto'>[],
): StatSamplePeriod {
  if (!allowed.length) return 'auto';
  const want = SAMPLE_HOURS[asked];
  return allowed.reduce((best, s) =>
    Math.abs(Math.log(SAMPLE_HOURS[s] / want)) < Math.abs(Math.log(SAMPLE_HOURS[best] / want)) ? s : best);
}

/**
 * The human name of every window, and the only copy of it.
 *
 * The editor's period select reads this, and so does the default x-axis label a
 * chart draws under its time ticks (#123) — a second table would be two places
 * to rename "Last day" and one of them would be missed. The `last_n_*` entries
 * carry a literal N for `describeWindow` to substitute.
 */
export const STAT_PERIOD_LABELS: Record<StatPeriod, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This week',
  last_week: 'Last week',
  this_month: 'This month',
  last_month: 'Last month',
  this_year: 'This year',
  last_year: 'Last year',
  last_30_minutes: 'Last 30 minutes',
  last_hour: 'Last hour',
  last_day: 'Last day',
  last_n_minutes: 'Last N minutes',
  last_n_hours: 'Last N hours',
  last_n_days: 'Last N days',
  last_n_months: 'Last N months',
  custom: 'Custom range',
};

/** The seeded N for each rolling window, so a label can name it before it is set. */
function periodN(period: StatPeriod, n: number | undefined): number {
  if (n != null) return n;
  return (period === 'last_n_minutes' ? sd('stat_period_minutes_n') ?? 60
    : period === 'last_n_hours' ? sd('stat_period_hours_n') ?? 1
    : period === 'last_n_days' ? sd('stat_period_days_n') ?? 7
    : sd('stat_period_months_n') ?? 1);
}

/**
 * A graph field's window, named for a human — "Last day", "Last 7 days" — or
 * '' when it has none and is plotting live state.
 *
 * Resolves the field itself rather than taking a period, so a renderer can ask
 * without threading Graph Data through five chart functions.
 */
export function describeWindow(field: FieldConfig): string {
  const { period, periodN: n } = resolveGraphStat(field);
  if (!period) return '';
  const label = STAT_PERIOD_LABELS[period];
  if (!label.includes(' N ')) return label;
  const count = periodN(period, n);
  // "Last 1 days" reads as a bug, and the singular form already exists as its
  // own window for the two that have one.
  return count === 1
    ? label.replace(' N ', ' ').replace(/s$/, '')
    : label.replace(' N ', ` ${count} `);
}

/** A legacy `graph_hours` depth expressed as a window. */
function hoursToPeriod(hours: number): { period: StatPeriod; n?: number } {
  return hours === 24 ? { period: 'last_day' } : { period: 'last_n_hours', n: hours };
}

/**
 * Graph Data for one field, resolved field → lifted legacy → seed (#123).
 *
 * The fallbacks are ordered so that no existing dashboard changes what it
 * draws:
 *
 * - A per-series window from before this existed is lifted to the field; the
 *   first series carrying one wins, which is also what the editor writes when
 *   it migrates the config.
 * - A history chart with only `graph_hours` keeps that depth, expressed as a
 *   rolling window.
 * - An aggregate chart (bar, gauge) with no window at all keeps live state
 *   rather than acquiring the seeded one, because a window there would swap
 *   every existing bar from "now" to "the last day" on upgrade.
 *
 * Sample period is the one place a chart can change on upgrade: unset, it takes
 * the seed (5 minutes) rather than the old span heuristic. The editor writes
 * 'auto' onto every pre-existing field as it migrates it, so the only configs
 * affected are those never opened in the editor again — and the clamp below
 * keeps even those inside a sane bucket count.
 */
export function resolveGraphStat(field: FieldConfig): GraphStat {
  const gt = field.graph_type ?? sd('graph_type') ?? 'bar';
  const isHistory = HISTORY_GRAPH_TYPES.includes(gt);
  const lifted = (field.graph_series ?? []).find((s) => s.stat_period);
  const legacyHours = isHistory ? (field.graph_hours ?? sd('graph_hours') ?? 24) : undefined;

  let period = field.graph_stat_period ?? lifted?.stat_period;
  let periodN = field.graph_stat_period != null ? field.graph_stat_period_n : lifted?.stat_period_n;
  if (!period && legacyHours != null) {
    const legacy = hoursToPeriod(legacyHours);
    period = legacy.period;
    periodN = legacy.n;
  }

  let sample: StatSamplePeriod = field.graph_sample_period ?? sd('graph_sample_period') ?? '5minute';
  if (sample !== 'auto' && period) {
    const allowed = sampleOptionsFor(period, periodN);
    // Clamp rather than obey: a window that outgrew its sample period — N days
    // raised from 2 to 60 — must not start asking for 17,000 buckets. The
    // editor's select offers only `allowed`, so this is the backstop for a
    // hand-written YAML or a window edited without touching the resolution.
    if (!allowed.includes(sample as Exclude<StatSamplePeriod, 'auto'>)) {
      sample = nearestSample(sample as Exclude<StatSamplePeriod, 'auto'>, allowed);
    }
  }

  const statType = (field.graph_stat_type
    ?? (isHistory ? sd('stat_type_history') : sd('stat_type'))
    ?? (isHistory ? 'mean' : 'sum')) as StatType;

  return { period, periodN, sample, statType };
}

/**
 * Lift a pre-#123 graph field's statistics config to field level, or null when
 * there is nothing to lift.
 *
 * Deterministic and idempotent, because the editor runs it inside `setConfig`'s
 * backfill pass — which deliberately doesn't emit, so HA can hand the same YAML
 * back on every pass and must produce the same result each time. The keys reach
 * the stored config on the next write the user makes.
 *
 * `graph_hours` is deliberately left in place: the window it described is now
 * explicit in `graph_stat_period`, and leaving the old key means a downgrade to
 * an earlier card version still draws the depth the user chose.
 */
export function graphDataMigration(field: FieldConfig): Partial<FieldConfig> | null {
  if (field.type !== 'graph') return null;
  const series = field.graph_series ?? [];
  const legacy = series.some((s) => s.stat_period != null || s.stat_period_n != null);
  if (field.graph_stat_period != null && !legacy) return null;

  const patch: Partial<FieldConfig> = {};
  if (field.graph_stat_period == null) {
    const gt = field.graph_type ?? sd('graph_type') ?? 'bar';
    const lifted = series.find((s) => s.stat_period);
    if (lifted?.stat_period) {
      patch.graph_stat_period = lifted.stat_period;
      if (lifted.stat_period_n != null) patch.graph_stat_period_n = lifted.stat_period_n;
    } else if (HISTORY_GRAPH_TYPES.includes(gt)) {
      // Only a history chart had a window without a series period — its
      // `graph_hours` depth. An aggregate chart had live state, which stays
      // unset.
      const legacyWindow = hoursToPeriod(field.graph_hours ?? sd('graph_hours') ?? 24);
      patch.graph_stat_period = legacyWindow.period;
      if (legacyWindow.n != null) patch.graph_stat_period_n = legacyWindow.n;
    }
    // Whatever the window, the resolution this chart has been drawing at is the
    // span heuristic. Recording it as 'auto' keeps the chart identical; the new
    // 5-minute default is for charts made from here on.
    if (patch.graph_stat_period != null) patch.graph_sample_period = 'auto';
  }
  if (legacy) {
    patch.graph_series = series.map(({ stat_period: _p, stat_period_n: _n, ...rest }) => rest);
  }
  return Object.keys(patch).length ? patch : null;
}

export function collectStatTargets(config: MosaicCanvasConfig): StatTarget[] {
  const targets: StatTarget[] = [];
  for (const card of config.cards ?? []) {
    for (const field of card.fields) {
      if (field.type === 'value' && field.stat_period && field.entity) {
        targets.push({
          id: field.id,
          entity: field.entity,
          // A value field has no cadence of its own; it follows the dashboard.
          refreshMs: graphRefreshMs(undefined, config),
          stat_period: field.stat_period,
          stat_type: field.stat_type,
          stat_period_n: field.stat_period_n,
          stat_period_start: field.stat_period_start,
          stat_period_end: field.stat_period_end,
        });
      }
      // Aggregate charts only. A bucketed chart (line, area, stat-line) and a
      // state timeline are served by fetchHistory, and asking for both meant
      // two recorder queries per series for one chart — which a per-series
      // window used to make rare and a field-level one would make universal.
      if (field.type === 'graph' && field.graph_series
          && !HISTORY_GRAPH_TYPES.includes(field.graph_type ?? sd('graph_type') ?? 'bar')) {
        // One window for the whole chart (#123). No window means live state, so
        // an aggregate chart without one has nothing to fetch.
        const gs = resolveGraphStat(field);
        // Commented, not deleted (#123) — see the note in collectHistoryTargets.
        // mcLog(`graph "${field.id}" (${field.graph_type ?? sd('graph_type') ?? 'bar'}, aggregate):`
        //   + ` window=${gs.period ?? 'live state'}${gs.periodN != null ? `(n=${gs.periodN})` : ''}`
        //   + ` statType=${gs.statType} series=${field.graph_series.length}`);
        if (gs.period) {
          field.graph_series.forEach((s, i) => {
            if (!s.entity) return;
            targets.push({
              id: `${field.id}:${i}`, entity: s.entity,
              stat_period: gs.period!, stat_period_n: gs.periodN,
              stat_type: s.stat_type ?? gs.statType,
              refreshMs: graphRefreshMs(field, config),
            });
          });
        }
      }
    }
  }
  for (const v of config.virtuals ?? []) {
    if (v.op === 'statistic' && v.stat_period && v.entity) {
      targets.push({
        id: `virt:${v.id}`,
        entity: v.entity,
        refreshMs: graphRefreshMs(undefined, config),
        stat_period: v.stat_period,
        stat_type: v.stat_type,
        stat_period_n: v.stat_period_n,
        stat_period_start: v.stat_period_start,
        stat_period_end: v.stat_period_end,
      });
    }
  }
  return targets;
}

/** Fetch stats for all stat targets and return a populated StatsMap. */
/**
 * Collapse a target's buckets to its single value, or null when the columns it
 * needs are not there. Split out of fetchStats so that many targets can share
 * one recorder query and still each reduce their own way.
 */
function reduceBuckets(buckets: StatBucket[], statType: StatType): number | null {
  if (!buckets.length) return null;
  if (statType === 'sum') {
    // HA's per-bucket `sum` is the cumulative meter reading at bucket end,
    // not a period total — the period usage is the `change` column, summed.
    const changes = buckets.map((b) => b.change).filter((v): v is number => v != null && Number.isFinite(v));
    if (changes.length) return changes.reduce((a, c) => a + c, 0);
    // change column unavailable: cumulative last-minus-first needs two buckets.
    const sums = buckets.map((b) => b.sum).filter((v): v is number => v != null && Number.isFinite(v));
    if (sums.length < 2) return null;
    return sums[sums.length - 1]! - sums[0]!;
  }
  if (statType === 'difference') {
    const valid = buckets.filter(
      (b) => b.state !== null && b.state !== undefined && Number.isFinite(Number(b.state)),
    );
    if (valid.length < 2) return null;
    return Number(valid[valid.length - 1]!.state) - Number(valid[0]!.state);
  }
  if (statType === 'max') {
    const vals = buckets.map((b) => b.max).filter((v): v is number => v != null && Number.isFinite(v));
    return vals.length ? Math.max(...vals) : null;
  }
  if (statType === 'min') {
    const vals = buckets.map((b) => b.min).filter((v): v is number => v != null && Number.isFinite(v));
    return vals.length ? Math.min(...vals) : null;
  }
  if (statType === 'count') {
    return buckets.filter((b) => b.mean !== null && b.mean !== undefined).length;
  }
  if (statType === 'range') {
    const maxVals = buckets.map((b) => b.max).filter((v): v is number => v != null && Number.isFinite(v));
    const minVals = buckets.map((b) => b.min).filter((v): v is number => v != null && Number.isFinite(v));
    if (!maxVals.length || !minVals.length) return null;
    return Math.max(...maxVals) - Math.min(...minVals);
  }
  // Average over buckets that actually have a mean — dividing by the raw
  // bucket count treated partial/null buckets as zeroes and deflated it.
  const means = buckets.map((b) => b.mean).filter((v): v is number => v != null && Number.isFinite(v));
  if (!means.length) return null;
  return means.reduce((a, v) => a + v, 0) / means.length;
}

/**
 * Fetch every statistic target, one recorder query per distinct window.
 *
 * `recorder/statistics_during_period` takes a list of `statistic_ids`, but
 * every target was issued as its own call with a list of one. A dashboard with
 * 26 stat fields therefore opened 26 round trips that mostly asked for the
 * same window, and took about five seconds to settle on a cold load. Targets
 * are now grouped by (start, end, bucket period) — which is what actually has
 * to match for one response to serve them all — so the same dashboard makes a
 * handful of calls. Each target still reduces its own buckets its own way, so
 * two fields on one entity with different stat types are unaffected.
 */
export async function fetchStats(
  hass: HomeAssistant,
  targets: StatTarget[],
  previous: StatsMap,
): Promise<StatsMap> {
  const next: StatsMap = new Map(previous);

  interface Group {
    start: string;
    end: string;
    period: string;
    entities: Set<string>;
    members: { target: StatTarget; statType: StatType }[];
  }
  const groups = new Map<string, Group>();

  for (const target of targets) {
    const range = computeTimeRange(target);
    if (!range) continue;
    const statType = (target.stat_type ?? sd('stat_type') ?? 'sum') as StatType;
    // difference needs intra-period buckets to take first/last state from,
    // but must not coarsen a sub-hour range's 5minute buckets.
    const bucketPeriod = statType === 'difference' && range.bucketPeriod !== '5minute'
      ? 'hour'
      : range.bucketPeriod;
    const start = range.start.toISOString(), end = range.end.toISOString();
    const key = `${start}|${end}|${bucketPeriod}`;
    let g = groups.get(key);
    if (!g) {
      g = { start, end, period: bucketPeriod, entities: new Set(), members: [] };
      groups.set(key, g);
    }
    g.entities.add(target.entity);
    g.members.push({ target, statType });
  }

  mcLog(`stats: ${targets.length} target(s) collapsed to ${groups.size} recorder call(s)`
    + ` — ${[...groups.values()].map((g) => `${g.entities.size}@${g.period}`).join(', ')}`);

  await Promise.all([...groups.values()].map(async (g) => {
    const t0 = mcDebug() ? performance.now() : 0;
    try {
      const result = await (hass.connection as unknown as {
        sendMessagePromise: (msg: unknown) => Promise<Record<string, StatBucket[]>>;
      }).sendMessagePromise({
        type: 'recorder/statistics_during_period',
        start_time: g.start,
        end_time: g.end,
        statistic_ids: [...g.entities],
        period: g.period,
        units: {},
        types: ['change', 'sum', 'mean', 'state', 'max', 'min'],
      });

      mcLog(`  stats call: ${g.entities.size} entit(ies) @ ${g.period} took ${since(t0)}ms`);
      for (const { target, statType } of g.members) {
        const buckets: StatBucket[] = (result && result[target.entity]) || [];
        const value = reduceBuckets(buckets, statType);
        next.set(target.id, value === null ? null : { value, unit: unitForEntity(hass, target.entity) });
      }
    } catch {
      // Leave prior cached values for the whole group. The warning is kept,
      // commented, with the rest of the graph data trace (#123) — uncomment it
      // (and change this to `catch (err)`) when a chart draws nothing and the
      // question is whether the query itself failed.
      // console.warn('[mosaic-canvas-card] statistics query failed'
      //   + ` — ${[...g.entities].join(', ')} @ ${g.period}, ${g.start} → ${g.end}`, err);
    }
  }));

  return next;
}

// ── History (time-series for line/area/state-timeline) ───────────────────────

export interface HistoryPoint {
  t: number;
  v: number;
  /**
   * The raw state string, present only on the states path (#119). A state
   * timeline is about *which* state, not a number, so it can't be served by
   * the statistics API at all — see fetchHistory.
   */
  s?: string;
}
export type HistoryMap = Map<string, HistoryPoint[]>;

// Exported so the editor can gate its "Stat type" row on the same set the
// history fetch actually uses, instead of a second copy that can drift (#50).
export const HISTORY_GRAPH_TYPES: GraphType[] = ['stat-line', 'stat-area', 'line', 'area', 'state-timeline'];

export interface HistoryTarget {
  id: string;
  entity: string;
  hours: number;
  /** Poll period in ms. The host groups targets by it, one timer per group. */
  refreshMs?: number;
  /**
   * 'stats' reads aggregated numeric buckets from the recorder's statistics
   * tables; 'states' reads the raw state log. A state timeline has to use the
   * latter: statistics only exist for numeric entities, so every non-numeric
   * entity the chart is actually *for* — a binary_sensor, a climate mode, a
   * person, a media_player — returned nothing at all on the statistics path.
   */
  kind?: 'stats' | 'states';
  stat_type?: StatType;
  /** The field's window (Yesterday, Last N days, …) — see fetchHistory (#118, #123). */
  stat_period?: StatPeriod;
  stat_period_n?: number;
  /** The field's bucket resolution (#123). 'auto' keeps the span heuristic. */
  sample?: StatSamplePeriod;
}

export function collectHistoryTargets(config: MosaicCanvasConfig): HistoryTarget[] {
  const targets: HistoryTarget[] = [];
  for (const card of config.cards ?? []) {
    for (const field of card.fields) {
      if (field.type !== 'graph') continue;
      if (!HISTORY_GRAPH_TYPES.includes(field.graph_type ?? sd('graph_type') ?? 'bar')) continue;
      const hours = field.graph_hours ?? sd('graph_hours') ?? 24;
      const kind = (field.graph_type ?? sd('graph_type') ?? 'bar') === 'state-timeline' ? 'states' : 'stats';
      // Window, resolution and default calculation are the field's now (#123);
      // only the calculation is still overridable per series.
      const gs = resolveGraphStat(field);
      // What the resolver decided for this field. Kept, commented, for the next
      // time the graph data path needs watching (#123): uncomment these, deploy,
      // set `mosaicDebug = true` and reload. The failure warnings below stay
      // live — they only speak when a query actually fails.
      // mcLog(`graph "${field.id}" (${field.graph_type ?? sd('graph_type') ?? 'bar'}, ${kind}):`
      //   + ` window=${gs.period ?? `last ${hours}h`}${gs.periodN != null ? `(n=${gs.periodN})` : ''}`
      //   + ` sample=${gs.sample} statType=${gs.statType}`
      //   + ` series=${(field.graph_series ?? []).length}`
      //   + `${field.graph_sample_period == null ? ' (sample from seed)' : ''}`);
      (field.graph_series ?? []).forEach((s, i) => {
        if (s.entity) {
          targets.push({
            id: `${field.id}:${i}`, entity: s.entity, hours, stat_type: s.stat_type ?? gs.statType,
            stat_period: gs.period, stat_period_n: gs.periodN, sample: gs.sample, kind,
            refreshMs: graphRefreshMs(field, config),
          });
        }
      });
    }
  }
  return targets;
}

/** One bucket of a history series, reduced the way that series asked for. */
function bucketPoint(b: StatBucket, statType: StatType): HistoryPoint[] {
  // 'sum' means usage-per-bucket, which is HA's change column — the sum
  // column is the cumulative meter reading (falls back for older HA).
  const raw = statType === 'sum' ? (b.change ?? b.sum)
    : statType === 'change' ? b.change
    : statType === 'max' ? b.max
    : statType === 'min' ? b.min
    : statType === 'mean' ? b.mean
    // 'state' and any other value (e.g. 'difference', which fetchHistory
    // has no bucket column for) fall through to the bucket's own raw
    // reading — the unaggregated last value recorded in that period.
    : b.state;
  const v = Number(raw);
  return Number.isFinite(v) ? [{ t: new Date(b.start).getTime(), v }] : [];
}

/** Compressed state rows → timeline points, dropping repeats. */
function stateRowsToPoints(rows: { s?: string; lu?: number }[]): HistoryPoint[] {
  const points: HistoryPoint[] = [];
  for (const row of rows) {
    if (typeof row?.lu !== 'number' || row.s == null) continue;
    // Consecutive identical states are a recorder artefact (an attribute
    // changed, the state did not) and would draw as invisible seams.
    if (points.length && points[points.length - 1]!.s === row.s) continue;
    const n = Number(row.s);
    points.push({ t: row.lu * 1000, v: Number.isFinite(n) ? n : points.length, s: row.s });
  }
  return points;
}

/**
 * Fetch every history series, one recorder query per distinct window.
 *
 * Same batching as fetchStats, and for the same reason — this was the half
 * still doing it one call per series. Four PV strings plotted on one chart
 * share a window and a resolution exactly, so they were four round trips for
 * one query's worth of work. The recorder serialises concurrent requests, so
 * on a cold load that cost was additive, not parallel: the last of a dozen
 * queries landed at 2.9s while the first landed at 0.5s.
 *
 * Grouping is by (start, end, period) for numeric series and (start, end) for
 * the state log. Each target still reduces the shared buckets its own way, so
 * two series on one entity with different stat types are unaffected.
 */
export async function fetchHistory(
  hass: HomeAssistant,
  targets: HistoryTarget[],
  previous: HistoryMap,
): Promise<HistoryMap> {
  const next = new Map(previous);
  const conn = hass.connection as unknown as {
    sendMessagePromise: (msg: unknown) => Promise<Record<string, StatBucket[]>>;
  };
  const stateConn = hass.connection as unknown as {
    sendMessagePromise: (msg: unknown) => Promise<Record<string, { s?: string; lu?: number }[]>>;
  };

  interface NumGroup {
    start: string; end: string; period: string;
    entities: Set<string>;
    members: { target: HistoryTarget; statType: StatType }[];
  }
  interface StateGroup {
    start: string; end: string;
    entities: Set<string>;
    members: HistoryTarget[];
  }
  const numGroups = new Map<string, NumGroup>();
  const stateGroups = new Map<string, StateGroup>();

  const now = new Date();
  for (const target of targets) {
    // A series with its own stat_period (Yesterday, Last week, …) is a
    // *previous* window rather than the live one ending now (#118) — same
    // named periods and range math fetchStats already uses for its single
    // collapsed aggregate, reused here for the [start, end] boundaries only.
    const range = target.stat_period
      ? computeTimeRange({ id: target.id, entity: target.entity, stat_period: target.stat_period, stat_period_n: target.stat_period_n })
      : null;
    const startD = range?.start ?? new Date(now.getTime() - target.hours * 3_600_000);
    const endD = range?.end ?? now;
    const start = startD.toISOString(), end = endD.toISOString();

    if (target.kind === 'states') {
      const key = `${start}|${end}`;
      let g = stateGroups.get(key);
      if (!g) { g = { start, end, entities: new Set(), members: [] }; stateGroups.set(key, g); }
      g.entities.add(target.entity);
      g.members.push(target);
      continue;
    }

    const statType = (target.stat_type ?? sd('stat_type_history') ?? 'mean') as StatType;
    // Match bucket resolution to the span, not to computeTimeRange's own
    // bucketPeriod — that's sized for one collapsed aggregate bucket (a
    // single 'day' bucket for "Yesterday"), whereas a history series wants a
    // detailed timeline across whatever range it resolved to. Hourly buckets
    // give a 6-hour graph only 6 points; month-long graphs don't need 700
    // hourly buckets.
    // 'state' (raw, unaggregated) is the exception: HA's recorder only
    // populates the `state` column at 5-minute (short-term) resolution — an
    // 'hour'/'day' bucket's `state` comes back null, which silently emptied
    // the series (#118 follow-up). Forcing 5minute means state's own points
    // stop once the entity falls out of the recorder's short-term retention
    // window (10 days by default) rather than degrading to a bigger bucket.
    const spanHours = (endD.getTime() - startD.getTime()) / 3_600_000;
    const auto = spanHours <= 12 ? '5minute' : spanHours <= 24 * 14 ? 'hour' : 'day';
    // The field's Sample Period is the resolution now (#123); 'auto' keeps the
    // span heuristic that was the only behaviour before it existed. 'state' is
    // still forced to 5minute whatever was asked for — the recorder populates
    // that column at short-term resolution only, so a coarser bucket returns
    // nulls and empties the series.
    const asked = target.sample ?? 'auto';
    const period = statType === 'state' ? '5minute' : asked === 'auto' ? auto : asked;
    const key = `${start}|${end}|${period}`;
    let g = numGroups.get(key);
    if (!g) { g = { start, end, period, entities: new Set(), members: [] }; numGroups.set(key, g); }
    g.entities.add(target.entity);
    g.members.push({ target, statType });
  }

  mcLog(`history: ${targets.length} target(s) collapsed to ${numGroups.size + stateGroups.size} call(s)`
    + ` — ${[...numGroups.values()].map((g) => `${g.entities.size}@${g.period}`).join(', ')}`
    + `${stateGroups.size ? ` + ${[...stateGroups.values()].map((g) => `${g.entities.size}@states`).join(', ')}` : ''}`);

  await Promise.all([
    ...[...numGroups.values()].map(async (g) => {
      const t0 = mcDebug() ? performance.now() : 0;
      try {
        const result = await conn.sendMessagePromise({
          type: 'recorder/statistics_during_period',
          start_time: g.start,
          end_time: g.end,
          statistic_ids: [...g.entities],
          period: g.period,
          units: {},
          types: ['change', 'mean', 'sum', 'state', 'max', 'min'],
        });
        mcLog(`  history call: ${g.entities.size} entit(ies) @ ${g.period} took ${since(t0)}ms`
          + ` — ${g.start} → ${g.end}`);
        for (const { target, statType } of g.members) {
          const buckets: StatBucket[] = result?.[target.entity] ?? [];
          const points = buckets.flatMap((b) => bucketPoint(b, statType));
          // Buckets present but no points means the column this stat type reads
          // came back null for every one of them — the usual cause of an empty
          // chart on a valid query (a measurement sensor asked for state/change,
          // or 5-minute records past their retention). Commented (#123).
          // mcLog(`    ${target.entity} [${target.id}] ${statType}:`
          //   + ` ${buckets.length} bucket(s) → ${points.length} point(s)`
          //   + `${buckets.length && !points.length ? ` — every '${statType}' value was null` : ''}`);
          next.set(target.id, points);
        }
      } catch {
        // Keep prior values for the whole group — see the note on fetchStats'
        // catch (#123).
        // console.warn('[mosaic-canvas-card] history query failed'
        //   + ` — ${[...g.entities].join(', ')} @ ${g.period}, ${g.start} → ${g.end}`, err);
      }
    }),
    ...[...stateGroups.values()].map(async (g) => {
      const t0 = mcDebug() ? performance.now() : 0;
      try {
        const result = await stateConn.sendMessagePromise({
          type: 'history/history_during_period',
          start_time: g.start,
          end_time: g.end,
          entity_ids: [...g.entities],
          // The compressed response: `s` is the state, `lu` last_updated in
          // epoch *seconds*. Attributes are dropped — a timeline needs the
          // state and when it changed, nothing else — which is also what
          // keeps a month of history from being megabytes of payload.
          minimal_response: true,
          no_attributes: true,
        });
        mcLog(`  history(states) call: ${g.entities.size} entit(ies) took ${since(t0)}ms`
          + ` — ${g.start} → ${g.end}`);
        for (const target of g.members) {
          const points = stateRowsToPoints(result?.[target.entity] ?? []);
          // mcLog(`    ${target.entity} [${target.id}] states: ${points.length} point(s)`);  // (#123)
          next.set(target.id, points);
        }
      } catch {
        // console.warn('[mosaic-canvas-card] state history query failed'
        //   + ` — ${[...g.entities].join(', ')}, ${g.start} → ${g.end}`, err);
      }
    }),
  ]);
  return next;
}
