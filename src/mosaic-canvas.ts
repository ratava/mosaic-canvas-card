import './define-guard'; // MUST be first — makes customElements.define idempotent before any auto-registering import runs.
import { LitElement, html, css, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type {
  HomeAssistant,
  LovelaceCard,
  LovelaceCardEditor,
} from 'custom-card-helpers';
import { handleAction } from 'custom-card-helpers';

// './editor' is deliberately NOT imported here. It is ~77% of the bundle (about 463 kB
// minified) and is only needed once a user opens the card's config UI, so it is loaded
// on demand in getConfigElement() below. Re-adding a static import here undoes that and
// puts the whole editor back into every dashboard view.
import './fill';
import './embedded-card';
import './controls/mc-toggle';
import './controls/mc-slider';
import './controls/mc-dropdown';
import './controls/mc-selector';
import './controls/mc-input';
import './controls/mc-spinbox';
import './controls/mc-button';
import { setUserVariants } from './controls/variants';
import { renderCard, renderExtendedCard, renderFlows, renderZones, resolveBackgroundUrl, boxCss, embeddedBoxCss, embeddedInner, evaluateVisibility, viewCss, flowCss, computeCanvasDims, computeVirtuals, cardChromeVars, customVarCss, overlayPanelRadius, ANCHOR_FRAC, ANCHOR_TRANSLATE } from './view';
import type { CardBox, RenderContext } from './view';
import { actionGesture, hasAnyAction } from './gestures';
import type { VirtualMap } from './format';
import type { MosaicCanvasConfig, CardConfig } from './types';
import { CARD_VERSION, BUILD_ID } from './version';
import { fetchStats, collectStatTargets, fetchHistory, collectHistoryTargets } from './stats';
import type { StatTarget, HistoryTarget } from './stats';
import { mcDebug, mcLog, fmtMins, since } from './debug';
import type { StatsMap, HistoryMap } from './stats';
import { seedReady, sd } from './seed-defaults';
import { html as staticHtml, unsafeStatic } from 'lit/static-html.js';
import { TAG_CANVAS, TAG_EDITOR, TAG_EMBEDDED, CARD_NAME } from './tags';
import { collectReferencedEntities } from './entities';

// Static tag literal for the embedded-card element (tag name is build-time
// suffixed for dev builds, so it can't be a plain literal in the lit template).
const EMB_TAG = unsafeStatic(TAG_EMBEDDED);

// Picker/stub preview image, shipped in dist/ beside the bundle so the same
// relative resolution works for dev and prod installs whatever the directory.
const PREVIEW_IMAGE = (() => {
  try { return new URL(/* @vite-ignore */ './hero-dashboard.png', import.meta.url).href; }
  catch { return '/local/community/mosaic-canvas-card/hero-dashboard.png'; }
})();


/* eslint-disable no-console */
console.info(
  `%c MOSAIC-CANVAS %c v${CARD_VERSION} · build ${BUILD_ID} `,
  'color: white; background: #03a9f4; font-weight: 700;',
  'color: #03a9f4; background: white; font-weight: 700;',
);

@customElement(TAG_CANVAS)
export class MosaicCanvas extends LitElement implements LovelaceCard {
  @property({ attribute: false }) public hass?: HomeAssistant;
  /** Editor preview mode: render cards/flows regardless of their visible_when conditions. */
  @property({ type: Boolean }) public editor = false;
  @state() private _config?: MosaicCanvasConfig;
  @state() private _imgNatural?: { w: number; h: number };
  @state() private _cardBoxes: Record<string, CardBox> = {};
  @state() private _statsMap: StatsMap = new Map();
  @state() private _historyMap: HistoryMap = new Map();
  @state() private _expandedCardId: string | null = null;
  @state() private _expandScale = 1;
  @state() private _openExtendedId: string | null = null;
  @state() private _extZoom = 1;

  private _ro?: ResizeObserver;
  private _totalW = 1000;
  private _measureRaf?: number;
  private _pendingScale = false;
  private _pendingExpand = false;
  private _pendingExtZoom = false;
  /** Shrink-to-fit iterations spent on the current popover — see _recomputeExtZoom. */
  private _extZoomPasses = 0;
  private _statDebounceTimer?: ReturnType<typeof setTimeout>;
  // Bumped on every polling restart; in-flight fetches from a previous
  // generation discard their result instead of overwriting newer data.
  private _statFetchGen = 0;
  // Non-reactive cache of the last computed virtuals, so time_until recalc gates
  // can freeze their last projection while the rate sits inside the dead band.
  private _virtualsCache: VirtualMap = new Map();
  /**
   * One timer per distinct refresh interval, not one for statistics and one
   * for history (#119). A graph carries its own cadence now, so a live gauge
   * on one minute and a week-long history chart on an hour no longer have to
   * agree — and the hourly one stops making 59 pointless recorder queries.
   */
  private _pollTimers: ReturnType<typeof setInterval>[] = [];
  /** Epoch ms of the last completed fetch — read by the debug helper. */
  private _lastPollAt?: number;
  /** Targets the running timers were armed for; see _pollSignature. */
  private _pollSig?: string;
  /** True while a full sweep is running, so a second cannot be launched over it. */
  private _sweepInFlight = false;
  /** Cleared while the card is off-screen or its tab is in the background. */
  private _pollPaused = false;
  private _io?: IntersectionObserver;
  private _onVisibility?: () => void;
  private _onKeyDown?: (e: KeyboardEvent) => void;

  public static async getConfigElement(): Promise<LovelaceCardEditor> {
    // Loads the editor chunk on first use. Home Assistant awaits this, so returning a
    // promise is supported. define-guard (imported at the top of this module) has already
    // made customElements.define idempotent, so the editor's own @customElement
    // registration is safe even if the chunk is evaluated more than once.
    await import('./editor');
    return document.createElement(TAG_EDITOR) as unknown as LovelaceCardEditor;
  }

  public static getStubConfig(): Partial<MosaicCanvasConfig> {
    const previewImage = PREVIEW_IMAGE;
    return {
      background: {
        source: 'auto',
        sun_entity: 'sun.sun',
        images: { day: { '0': previewImage }, night: { '0': previewImage } },
      },
      canvas: {},
      defaults: {
        font_family: 'sans-serif',
        card: { background: 'rgba(8,18,28,0.55)', border: true, color: '#00d4ff', radius: 10, padding: 8 },
        label: { font_size: 13, color: '#cccccc' },
        value: { font_size: 22, color: '#ffffff', font_weight: 600 },
      },
      cards: [],
    };
  }

  /**
   * The editor chunk is ~77% of the bundle, and getConfigElement() pays its
   * fetch and parse synchronously while the config dialog is opening. HA marks
   * preview instances (edit dialog, card picker, sections-view edit mode) by
   * setting editMode/preview on the element — the earliest signal an editing
   * session is underway — so start the import from an idle callback then, and
   * the dialog finds the chunk already cached (#104). Deliberately NOT done for
   * ordinary dashboard views: a kiosk tablet that never edits never pays the
   * parse (see the lazy-load note above the getConfigElement import).
   */
  private static _editorPrefetched = false;

  private static _prefetchEditor(): void {
    if (MosaicCanvas._editorPrefetched) return;
    MosaicCanvas._editorPrefetched = true;
    const idle: (cb: () => void) => unknown =
      typeof requestIdleCallback === 'function' ? requestIdleCallback : (cb) => setTimeout(cb, 250);
    idle(() => {
      import('./editor').catch(() => { MosaicCanvas._editorPrefetched = false; });
    });
  }

  private _editMode = false;
  /** Set by HA on preview/edit-mode card instances (LovelaceCard.editMode). */
  public get editMode(): boolean { return this._editMode; }
  public set editMode(v: boolean) {
    this._editMode = v;
    if (v) MosaicCanvas._prefetchEditor();
  }

  private _isPreview = false;
  /** hui-card's preview flag — set alongside (or instead of) editMode depending on HA version. */
  public get preview(): boolean { return this._isPreview; }
  public set preview(v: boolean) {
    this._isPreview = v;
    if (v) MosaicCanvas._prefetchEditor();
  }

  public setConfig(config: MosaicCanvasConfig): void {
    if (!config) throw new Error('Invalid configuration');
    if (!Array.isArray(config.cards)) {
      // Fail here with a message the HA editor can surface — a missing cards
      // list used to pass and TypeError later inside _measureCardBoxes.
      throw new Error("Mosaic Canvas: 'cards' must be a list (use cards: [] for an empty canvas)");
    }
    this._config = config;
    // Custom control variants travel in the card config, not the bundle.
    setUserVariants(config.defaults?.control_variants);
    // Note: do NOT reset _imgNatural here — the <img> @load re-fires when the
    // resolved src changes, which updates it. Resetting on every setConfig would
    // lose the natural size on unrelated edits (e.g. each drag in the editor).
  }

  public getCardSize(): number {
    // Estimate rows (~50px each) from the canvas aspect ratio at a typical
    // ~500px column width, instead of a hardcoded 5.
    if (!this._config) return 5;
    const { totalW, totalH } = computeCanvasDims(this._config, this._imgNatural);
    if (!totalW || !totalH) return 5;
    return Math.max(1, Math.round((500 * totalH / totalW) / 50));
  }

  /** Sections-layout sizing: span the full grid width, auto height. */
  public getGridOptions(): { columns: number; rows: string } {
    return { columns: 12, rows: 'auto' };
  }

  public get cardBoxes(): Record<string, CardBox> {
    return this._cardBoxes;
  }

  /** Only re-render when config changes or a referenced entity actually changed. */
  protected override shouldUpdate(changed: PropertyValues): boolean {
    // Anything besides hass (config, stats maps, expand state, …) must render:
    // Lit clears the changed map after a rejected update, so returning false
    // here would discard those changes permanently, not defer them.
    if (!changed.has('hass') || changed.size > 1) return true;
    const oldHass = changed.get('hass') as HomeAssistant | undefined;
    if (!oldHass || !this.hass) return true;
    for (const id of this._referencedEntities()) {
      if (oldHass.states[id] !== this.hass.states[id]) return true;
    }
    // Skipping this render starves embedded child cards — the template binding
    // is their only hass feed. Push the fresh hass to them directly; each child
    // card runs its own update gating against it.
    this._forwardHassToEmbedded();
    return false;
  }

  private _forwardHassToEmbedded(): void {
    this.renderRoot?.querySelectorAll(TAG_EMBEDDED).forEach((el) => {
      (el as unknown as { hass?: HomeAssistant }).hass = this.hass;
    });
  }

  // Cached per config object: setConfig replaces the config wholesale, so
  // reference identity is a safe cache key, and hass churn (once a second on
  // busy installs) shouldn't walk the whole config tree each time.
  private _refEntityCache?: { config: MosaicCanvasConfig; ids: string[] };

  private _referencedEntities(): string[] {
    const config = this._config;
    if (!config) return [];
    if (this._refEntityCache?.config === config) return this._refEntityCache.ids;
    const out = collectReferencedEntities(config);
    this._refEntityCache = { config, ids: out };
    return out;
  }

  // ── media-source resolution (#101) ─────────────────────────────────────────
  // A media-source:// id has no static URL: it resolves to a signed one that
  // expires, so the id is what a config stores and this is where it becomes
  // paintable. Resolution is async and render is not, so results land in a
  // reactive map and the next render picks them up.
  @state() private _mediaUrls: Record<string, string> = {};
  private _mediaPending = new Set<string>();
  private _mediaAt: Record<string, number> = {};
  private _mediaTimer?: ReturnType<typeof setInterval>;

  /**
   * How long a resolved media URL is trusted before it is fetched again.
   *
   * Home Assistant signs these and the signature expires; the lifetime is not
   * published and has not been measured here, so this is deliberately well
   * under any plausible one. Re-resolving is a single WebSocket round trip
   * against ids the config already names, and only while a card carrying one is
   * on screen — cheap next to a dashboard that silently loses its background
   * after sitting open.
   */
  private static readonly MEDIA_TTL_MS = 10 * 60 * 1000;

  /** Every media-source id the current config references. */
  private _mediaIds(): string[] {
    const ids = new Set<string>();
    const add = (v: string | undefined) => {
      if (v?.startsWith('media-source://')) ids.add(v);
    };
    const bg = this._config?.background;
    add(bg?.url);
    for (const rule of bg?.rules ?? []) add(rule.url);
    for (const mode of Object.values(bg?.images ?? {})) {
      for (const url of Object.values(mode ?? {})) add(url);
    }
    for (const card of this._config?.cards ?? []) {
      add(card.bg?.url);
      for (const rule of card.bg?.rules ?? []) add(rule.url);
    }
    return [...ids];
  }

  private async _ensureMediaResolved(): Promise<void> {
    if (!this.hass) return;
    const hass = this.hass as unknown as {
      callWS: (m: Record<string, unknown>) => Promise<Record<string, unknown>>;
    };
    const now = Date.now();
    const wanted = this._mediaIds().filter((id) => {
      if (this._mediaPending.has(id)) return false;
      if (!this._mediaUrls[id]) return true;
      return now - (this._mediaAt[id] ?? 0) >= MosaicCanvas.MEDIA_TTL_MS;
    });
    if (!wanted.length) return;
    wanted.forEach((id) => this._mediaPending.add(id));
    const resolved: Record<string, string> = {};
    await Promise.all(wanted.map(async (id) => {
      try {
        const res = await hass.callWS({ type: 'media_source/resolve_media', media_content_id: id });
        const url = String(res?.url ?? '');
        if (url) resolved[id] = url;
      } catch {
        // Leave it unresolved; the card paints no background rather than a
        // broken one, and the next config change retries.
      } finally {
        this._mediaPending.delete(id);
      }
    }));
    if (Object.keys(resolved).length) {
      const at = Date.now();
      for (const id of Object.keys(resolved)) this._mediaAt[id] = at;
      this._mediaUrls = { ...this._mediaUrls, ...resolved };
    }
  }

  /**
   * Nothing else guarantees a wake-up: a card whose only media id sits behind a
   * rarely-changing entity can go a long time without re-rendering, which is
   * exactly the card that would still be showing an expired URL.
   */
  private _startMediaRefresh(): void {
    if (this._mediaTimer !== undefined) return;
    this._mediaTimer = setInterval(() => {
      if (this._mediaIds().length) void this._ensureMediaResolved();
    }, MosaicCanvas.MEDIA_TTL_MS);
  }

  private _stopMediaRefresh(): void {
    if (this._mediaTimer === undefined) return;
    clearInterval(this._mediaTimer);
    this._mediaTimer = undefined;
  }

  private _recomputeScale(): void {
    const host = this.renderRoot?.querySelector('.ec-host') as HTMLElement | null;
    if (!host || this._totalW === 0) return;
    const w = host.clientWidth;
    // A host in a hidden or not-yet-laid-out view measures 0. Pinning the scale
    // to that collapses the canvas, and nothing recomputes it until the next
    // config change — so treat 0 as "no measurement" and keep the last good one.
    if (w === 0) return;
    // Measured on .ec-host but written to the custom element itself, because
    // .ec-host's style attribute is owned by the lit template — it interpolates
    // cardChromeVars()/customVarCss(), so the moment seed defaults resolve those
    // helpers return a different string, lit rewrites the whole attribute, and
    // an imperatively-set custom property on it is silently discarded. Nothing
    // recomputes the scale afterwards, so the canvas stays at the var(...,1)
    // fallback until an unrelated resize happens to fire the observer. :host is
    // not template-managed, and --mc-scale inherits down to .ec-canvas anyway.
    this.style.setProperty('--mc-scale', String(w / this._totalW));
  }

  /**
   * The observer has to survive a detach. HA reattaches cached card DOM when you
   * switch dashboard views, disconnectedCallback drops the observer, and
   * firstUpdated only ever runs once — so without re-arming, --mc-scale freezes
   * at whatever width the card last measured (and the first render can predate
   * the host entirely, when setConfig hasn't landed yet). observe() delivers an
   * initial callback, so re-arming also re-measures for free.
   */
  private _ensureRo(): void {
    if (this._ro) return;
    const host = this.renderRoot?.querySelector('.ec-host') as HTMLElement | null;
    if (!host) return;
    this._ro = new ResizeObserver(() => {
      this._recomputeScale();
      this._recomputeExpandScale();
      // A resize moves the canvas scale, so an open popover has to search again
      // from the new target rather than refine the width it was fitted to.
      this._extZoomPasses = 0;
      this._recomputeExtZoom();
    });
    this._ro.observe(host);
  }

  protected override firstUpdated(): void {
    this._ensureRo();
    this._ensureVisibilityWatch();
    this._recomputeScale();
  }

  protected override updated(changed: PropertyValues): void {
    this._ensureRo();
    // Same re-arm reason as _ensureRo: the host may not have existed at
    // firstUpdated, and a reattach drops the observer.
    this._ensureVisibilityWatch();
    // Scale depends on clientWidth (the ResizeObserver covers resizes) and the
    // design-space dims — only config/image changes move it, so don't force a
    // synchronous layout read on every entity tick. The flags accumulate across
    // updates because the rAF below coalesces them: a plain hass tick arriving
    // before the frame fires must not cancel a pending rescale.
    if (changed.has('_config') || changed.has('_imgNatural')) {
      this._pendingScale = true;
      this._pendingExpand = true;
    }
    if (changed.has('_expandedCardId')) this._pendingExpand = true;
    // A new popover restarts the shrink-to-fit search from the canvas scale;
    // _extZoom changing is the search itself, and must re-measure to converge.
    if (changed.has('_openExtendedId')) {
      this._extZoomPasses = 0;
      this._pendingExtZoom = true;
    }
    if (changed.has('_extZoom')) this._pendingExtZoom = true;
    // Box measurement must still track content-driven size changes (a longer
    // value string grows a shrink-to-fit card, and flows anchor to the boxes),
    // but coalesced into a rAF so the offset reads happen after layout settles
    // instead of forcing one mid-update on every hass churn. The scale reads
    // ride along for the same reason — measuring synchronously inside updated()
    // can catch HA mid-layout and pin the canvas to a transitional width.
    if (this._measureRaf !== undefined) cancelAnimationFrame(this._measureRaf);
    this._measureRaf = requestAnimationFrame(() => {
      this._measureRaf = undefined;
      if (this._pendingScale) { this._pendingScale = false; this._recomputeScale(); }
      if (this._pendingExpand) { this._pendingExpand = false; this._recomputeExpandScale(); }
      if (this._pendingExtZoom) { this._pendingExtZoom = false; this._recomputeExtZoom(); }
      this._measureCardBoxes();
    });
    if (changed.has('_config') || (changed.has('hass') && !changed.get('hass'))) {
      this._restartStatPolling();
    }
  }

  /**
   * The scale the canvas itself is drawn at. Both overlays aim for this (#88):
   * they render outside `.ec-canvas` and inherit none of its transform, so
   * without it an authored 14px reads as 14px in an overlay sitting on top of a
   * canvas where the same 14px reads as 32px.
   *
   * Recomputed from the same two numbers as `_recomputeScale` rather than read
   * back off `--mc-scale`: a string round-trip through the style attribute is
   * the sort of thing that silently yields NaN, and this way the three scales
   * cannot disagree about what the design width is.
   */
  private _canvasScale(): number | undefined {
    const host = this.renderRoot?.querySelector('.ec-host') as HTMLElement | null;
    if (!host || this._totalW <= 0) return undefined;
    const w = host.clientWidth;
    return w > 0 ? w / this._totalW : undefined;
  }

  /**
   * Expanding a card keeps it at its natural size and scales the whole thing
   * with a CSS transform rather than stretching the box, so fonts and graphics
   * grow together — the same trick --mc-scale plays on the canvas.
   *
   * It targets the canvas scale, with the fit factor as a ceiling: a card whose
   * natural size can't take that scale shrinks to fit rather than overflowing.
   * The consequence is that an expanded card no longer always fills its panel —
   * it matches the canvas and leaves space around itself when the canvas scale
   * is the smaller of the two, which is the trade #88 deliberately makes.
   */
  private _recomputeExpandScale(): void {
    if (!this._expandedCardId) {
      if (this._expandScale !== 1) this._expandScale = 1;
      return;
    }
    const panel = this.renderRoot?.querySelector('.ec-expand-panel') as HTMLElement | null;
    const wrap = this.renderRoot?.querySelector('.ec-expand-card-wrap') as HTMLElement | null;
    if (!panel || !wrap) return;
    // offsetWidth/Height are the wrap's pre-transform layout size: a transform
    // never feeds back into layout, so these stay the natural size no matter
    // what _expandScale currently is, and the fit factor can't oscillate.
    const naturalW = wrap.offsetWidth;
    const naturalH = wrap.offsetHeight;
    if (!naturalW || !naturalH) return;
    const fit = Math.min(panel.clientWidth / naturalW, panel.clientHeight / naturalH);
    const canvasScale = this._canvasScale();
    const factor = canvasScale === undefined ? fit : Math.min(canvasScale, fit);
    if (Number.isFinite(factor) && factor > 0 && Math.abs(factor - this._expandScale) > 0.01) {
      this._expandScale = factor;
    }
  }

  /** Shrink-to-fit iterations allowed before the popover keeps whatever it has. */
  private static readonly EXT_ZOOM_MAX_PASSES = 4;

  /**
   * The popover's zoom (#88). `zoom` rather than a transform because the panel
   * is `overflow: auto` with a percentage `max-height`: zoom feeds into layout,
   * so the panel's own box, its scrollbars and its clamp all keep working on
   * the scaled content, where a transform would leave the scroll area
   * describing a size nobody can see.
   *
   * That same property is why this converges by iteration instead of arithmetic.
   * Under zoom the content's available width is the panel's width divided by the
   * zoom, so the content **reflows** at every candidate value and its natural
   * height is not a constant to divide by — text wraps differently at 2.3x than
   * at 1.4x. So: take the canvas scale outright, then shrink by whatever ratio
   * the overflow reports, re-measuring after each render until it fits or the
   * pass budget runs out. Each pass strictly reduces the zoom, so it terminates
   * whatever the content does.
   */
  private _recomputeExtZoom(): void {
    if (!this._openExtendedId) {
      if (this._extZoom !== 1) this._extZoom = 1;
      this._extZoomPasses = 0;
      return;
    }
    const panel = this.renderRoot?.querySelector('.ec-extended-panel') as HTMLElement | null;
    if (!panel) return;

    // Pass 0 is the target: the canvas scale, unconditionally.
    if (this._extZoomPasses === 0) {
      this._extZoomPasses = 1;
      const canvasScale = this._canvasScale();
      if (canvasScale !== undefined && Math.abs(canvasScale - this._extZoom) > 0.01) {
        this._extZoom = canvasScale;
        return; // re-measure once the new zoom has actually laid out
      }
    }
    if (this._extZoomPasses >= MosaicCanvas.EXT_ZOOM_MAX_PASSES) return;

    // scrollHeight/clientHeight are the panel's own, unzoomed pixels — the
    // zoomed child contributes its rendered size — so their ratio is exactly
    // how much too big the content currently is.
    const overflowH = panel.scrollHeight - panel.clientHeight;
    const overflowW = panel.scrollWidth - panel.clientWidth;
    if (overflowH <= 1 && overflowW <= 1) return;
    if (!panel.scrollHeight || !panel.scrollWidth) return;
    const ratio = Math.min(
      overflowH > 1 ? panel.clientHeight / panel.scrollHeight : 1,
      overflowW > 1 ? panel.clientWidth / panel.scrollWidth : 1,
    );
    const next = this._extZoom * ratio;
    if (!Number.isFinite(next) || next <= 0) return;
    this._extZoomPasses++;
    if (Math.abs(next - this._extZoom) > 0.01) this._extZoom = next;
  }

  private _stopStatPolling(): void {
    if (this._statDebounceTimer !== undefined) {
      clearTimeout(this._statDebounceTimer);
      this._statDebounceTimer = undefined;
    }
    for (const t of this._pollTimers) clearInterval(t);
    this._pollTimers = [];
    // Timers are gone, so the next restart must actually re-arm rather than
    // recognise its own signature and decline.
    this._pollSig = undefined;
  }

  /**
   * Fetch every target whose cadence is `ms`, or all of them when `ms` is
   * undefined (the initial sweep). Re-collecting rather than closing over the
   * target list keeps a config edit mid-flight from fetching stale entities.
   */
  private async _runPoll(gen: number, ms?: number): Promise<void> {
    if (!this.hass || !this._config) return;
    const isFull = ms === undefined;
    if (isFull) this._sweepInFlight = true;
    try {
      await this._runPollInner(gen, ms);
    } finally {
      if (isFull) this._sweepInFlight = false;
    }
  }

  private async _runPollInner(gen: number, ms?: number): Promise<void> {
    if (!this.hass || !this._config) return;
    const pick = <T extends { refreshMs?: number }>(all: T[]) =>
      ms === undefined ? all : all.filter((t) => (t.refreshMs ?? ms) === ms);
    const stats = pick(collectStatTargets(this._config));
    const hist = pick(collectHistoryTargets(this._config));
    const t0 = mcDebug() ? performance.now() : 0;
    // Statistics and history are awaited together rather than in sequence.
    // They are independent queries against the same recorder, and running them
    // one after the other made a cold load cost the sum of both.
    let statMs = 0, histMs = 0;
    await Promise.all([
      (async () => {
        if (!stats.length || !this.hass) return;
        const tS = mcDebug() ? performance.now() : 0;
        const result = await fetchStats(this.hass, stats, this._statsMap);
        statMs = since(tS);
        // A restart may have superseded this run while it was in flight — a
        // stale sweep finishing last must not overwrite newer data.
        if (gen === this._statFetchGen) this._statsMap = result;
      })(),
      (async () => {
        if (!hist.length || !this.hass) return;
        const tH = mcDebug() ? performance.now() : 0;
        const result = await fetchHistory(this.hass, hist, this._historyMap);
        histMs = since(tH);
        if (gen === this._statFetchGen) this._historyMap = result;
      })(),
    ]);
    if (stats.length || hist.length) {
      // Gap since the previous fetch is the number that actually answers "is
      // it refreshing?" — a timer that silently died shows as a growing gap.
      const gap = this._lastPollAt ? `, ${Math.round((Date.now() - this._lastPollAt) / 1000)}s since last` : '';
      this._lastPollAt = Date.now();
      mcLog(`fetched ${stats.length} stat + ${hist.length} history target(s)`
        + `${ms === undefined ? ' (initial sweep)' : ` on the ${fmtMins(ms)} timer`}`
        + ` in ${since(t0)}ms (stats ${statMs}ms, history ${histMs}ms)${gap}`
        + `${gen === this._statFetchGen ? '' : ' — SUPERSEDED, result discarded'}`);
    }
  }

  /**
   * What the poller is actually watching. Two restarts with the same signature
   * would fetch exactly the same things, so the second is a no-op rather than
   * a reason to throw the first away.
   */
  private _pollSignature(stats: StatTarget[], hist: HistoryTarget[]): string {
    const key = (t: StatTarget | HistoryTarget) =>
      `${t.id}|${t.entity}|${t.refreshMs ?? ''}|${JSON.stringify(t)}`;
    return [...stats.map(key), ...hist.map(key)].sort().join('\n');
  }

  /**
   * Whether enough time has passed since the last fetch to justify another one
   * now. The yardstick is the shortest configured cadence: a target that
   * refreshes every 5 minutes has nothing to gain from a fetch 20 seconds
   * after the last. No cadence configured at all means refresh is off, so a
   * resume is not a reason to fetch either.
   */
  private _pollIsStale(): boolean {
    if (!this._lastPollAt) return true;
    if (!this._config) return false;
    const periods = [...collectStatTargets(this._config), ...collectHistoryTargets(this._config)]
      .map((t) => t.refreshMs)
      .filter((ms): ms is number => typeof ms === 'number' && ms > 0);
    if (!periods.length) return false;
    return Date.now() - this._lastPollAt >= Math.min(...periods);
  }

  /**
   * `force` fetches now regardless — used when resuming from hidden with data
   * old enough that it really is stale, even though nothing about the config
   * changed.
   */
  private _restartStatPolling(force = false): void {
    if (!this._config || !this.hass) return;
    const statTargets = collectStatTargets(this._config);
    const histTargets = collectHistoryTargets(this._config);

    // Restart is called from three places — setConfig, connectedCallback and
    // resume — and on a page load the first two fire back to back. Each used
    // to bump the generation and launch a full sweep, so the first sweep was
    // discarded *after* completing: 62 recorder round trips to get 31 results,
    // and five seconds of the card saying "Loading" for nothing. Removing the
    // cold-start debounce is what exposed it; the debounce had been hiding the
    // double call by cancelling the first one's timer.
    const sig = this._pollSignature(statTargets, histTargets);
    if (!force && sig === this._pollSig && this._pollTimers.length) {
      mcLog('restart ignored — same targets, timers already running');
      return;
    }
    // A full sweep already in flight is fetching exactly these targets, so a
    // second one is pure duplicate load — and because the restart bumps the
    // generation, the first sweep's result would be thrown away *after*
    // completing. Two concurrent sweeps meant ~26 simultaneous recorder
    // queries, which pushed individual calls from 500ms to 14s: the load the
    // duplicate caused was what made the duplicate expensive.
    if (this._sweepInFlight) {
      mcLog(`restart declined — a full sweep is already in flight${force ? ' (force ignored)' : ''}`);
      // Letting the sweep finish is right — it re-collects its own targets, so
      // it already fetches the current config. The armed timers do not: they
      // still describe the cadences from before this restart. Left alone, a
      // refresh interval edited mid-sweep leaves an interval firing for a
      // period no target holds any more, and _runPoll's cadence filter then
      // matches nothing — that graph stops refreshing until the next config
      // change. Re-arm without bumping the generation, which would make the
      // in-flight sweep discard its own result.
      this._stopStatPolling();
      if (!this._pollPaused) this._armTimers(this._statFetchGen, statTargets, histTargets);
      return;
    }
    if (!force) {
      mcLog(`restarting — ${sig !== this._pollSig ? 'targets changed' : 'no timers armed'}`);
    }
    // _stopStatPolling clears the signature (the timers it describes are gone),
    // so recording the new one has to come after it — setting it first meant
    // every restart immediately wiped its own guard and the duplicate sweep
    // survived the fix meant to stop it.
    this._stopStatPolling();
    this._pollSig = sig;
    const gen = ++this._statFetchGen;
    if (!statTargets.length && !histTargets.length) return;

    // Debounce exists because the editor calls setConfig per drag step, and
    // each restart would otherwise launch a full recorder query storm. On a
    // cold start there is nothing to debounce against and every millisecond
    // is a millisecond the card spends saying "Loading" — so the very first
    // sweep goes straight out.
    const cold = force || (this._statsMap.size === 0 && this._historyMap.size === 0);
    if (cold) {
      mcLog(force ? 'refetching now' : 'cold start — fetching immediately');
      void this._runPoll(gen);
    } else {
      this._statDebounceTimer = setTimeout(() => {
        this._statDebounceTimer = undefined;
        void this._runPoll(gen);
      }, 250);
    }

    // Nothing polls while the card is off-screen or its tab is hidden. A
    // dashboard left up on a wall tablet used to query the recorder forever,
    // and a backgrounded tab queued a wakeup per interval to run all at once
    // on return.
    if (this._pollPaused) return;
    this._armTimers(gen, statTargets, histTargets);
  }

  /** One interval timer per distinct cadence. Separate from restart so that
   *  resuming can re-arm without launching a fetch. */
  private _armTimers(gen: number, statTargets: StatTarget[], histTargets: HistoryTarget[]): void {
    const periods = new Set<number>();
    for (const t of [...statTargets, ...histTargets]) if (t.refreshMs) periods.add(t.refreshMs);
    for (const ms of periods) {
      this._pollTimers.push(setInterval(() => void this._runPoll(gen, ms), ms));
    }
    this._pollSig = this._pollSignature(statTargets, histTargets);
    mcLog(`armed ${periods.size} timer(s): ${[...periods].sort((a, b) => a - b).map(fmtMins).join(', ')}`
      + ` for ${statTargets.length} stat + ${histTargets.length} history target(s)`);
  }

  /** Off-screen / hidden-tab gate around the pollers. */
  private _setPollPaused(paused: boolean): void {
    if (paused === this._pollPaused) return;
    this._pollPaused = paused;
    if (paused) {
      mcLog(`paused — ${document.hidden ? 'tab hidden' : 'card off-screen'}`);
      this._stopStatPolling();
      return;
    }
    mcLog('resumed');
    // Coming back visible only earns a fetch if the data has actually gone
    // stale. The observer's 200px rootMargin means an ordinary scroll past the
    // card pauses and resumes it seconds apart, and forcing there ignored
    // graph_refresh_minutes entirely — every scroll-out/scroll-in cost a full
    // recorder sweep. Inside the cadence the timers are simply re-armed, so
    // the next fetch lands when it was already due.
    if (this._pollIsStale()) {
      // Restart declines the force if a sweep is already running, so a resume
      // landing mid-fetch re-arms the timers instead of racing it.
      this._restartStatPolling(true);
      return;
    }
    if (!this._config || !this.hass) return;
    mcLog('resume within the refresh interval — re-arming timers, no fetch');
    this._armTimers(this._statFetchGen, collectStatTargets(this._config), collectHistoryTargets(this._config));
  }

  private _ensureVisibilityWatch(): void {
    if (!this._onVisibility) {
      this._onVisibility = () => this._setPollPaused(document.hidden || this._offScreen);
      document.addEventListener('visibilitychange', this._onVisibility);
    }
    if (this._io) return;
    const host = this.renderRoot?.querySelector('.ec-host') as HTMLElement | null;
    if (!host) return;
    this._io = new IntersectionObserver((entries) => {
      const e = entries[entries.length - 1];
      if (!e) return;
      // A zero-size box means the host has not been laid out yet, not that it
      // is off-screen. The observer's first callback lands before layout, so
      // taking it at face value paused polling milliseconds after arming it,
      // tore down the timers, and made the subsequent resume force a second
      // full sweep over the first — the duplicate fetch this feature was
      // supposed to be unrelated to.
      const r = e.boundingClientRect;
      if (r.width === 0 && r.height === 0) return;
      this._offScreen = !e.isIntersecting;
      this._setPollPaused(document.hidden || this._offScreen);
    }, { rootMargin: '200px' });
    this._io.observe(host);
  }

  private _offScreen = false;

  private _measureCardBoxes(): void {
    if (!this._config) return;
    const els = this.renderRoot?.querySelectorAll<HTMLElement>('.ec-card[data-card-id]');

    const { totalW, totalH } = computeCanvasDims(this._config, this._imgNatural);
    const next: Record<string, CardBox> = {};
    // offsetLeft = position.x * totalW (the anchor point); subtract anchor fraction
    // to get the visual top-left, then store as 0-1 fractions of the canvas.
    const anchorBox = (el: HTMLElement, anchor: keyof typeof ANCHOR_FRAC): CardBox => {
      const [fx, fy] = ANCHOR_FRAC[anchor];
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const x = el.offsetLeft - fx * w;
      const y = el.offsetTop - fy * h;
      return { x: x / totalW, y: y / totalH, w: w / totalW, h: h / totalH };
    };
    for (const el of els ?? []) {
      const id = el.getAttribute('data-card-id');
      if (!id) continue;
      const cardCfg = this._config?.cards.find((c) => c.id === id);
      next[id] = anchorBox(el, cardCfg?.anchor ?? 'top-left');
    }

    // Embedded cards: same anchor formula (they position via left/top% + an
    // ANCHOR_TRANSLATE transform, so offsetLeft is the anchor point too).
    const embEls = this.renderRoot?.querySelectorAll<HTMLElement>(`${TAG_EMBEDDED}[data-emb-id]`);
    embEls?.forEach((el) => {
      const id = el.getAttribute('data-emb-id');
      if (!id) return;
      const ecCfg = this._config?.embedded_cards?.find((c) => c.id === id);
      next[id] = anchorBox(el, ecCfg?.anchor ?? 'top-left');
    });

    if (JSON.stringify(next) !== JSON.stringify(this._cardBoxes)) {
      this._cardBoxes = next;
      this.dispatchEvent(new CustomEvent('ec-boxes-changed', { detail: { boxes: next } }));
    }
  }

  override connectedCallback(): void {
    super.connectedCallback();
    void seedReady.then(() => this.requestUpdate());
    // Polling timers are torn down on disconnect and updated() only restarts
    // them on config change or first hass — restore them here so switching to
    // another dashboard view and back (HA reattaches cached DOM) doesn't leave
    // stat/history fields frozen on their last values.
    if (this._config && this.hass) this._restartStatPolling();
    // Same reattach problem for layout: the observer was dropped on disconnect
    // and updated() may not run again, which left --mc-scale frozen at the width
    // measured in whatever view the card was last shown in.
    this._ensureRo();
    this._recomputeScale();
    this._onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (this._openExtendedId !== null) { this._openExtendedId = null; return; }
        if (this._expandedCardId !== null) { this._expandedCardId = null; }
      }
    };
    window.addEventListener('keydown', this._onKeyDown);
    this._startMediaRefresh();
  }

  override disconnectedCallback(): void {
    if (this._onKeyDown) {
      window.removeEventListener('keydown', this._onKeyDown);
      this._onKeyDown = undefined;
    }
    super.disconnectedCallback();
    this._stopMediaRefresh();
    this._ro?.disconnect();
    this._ro = undefined;
    this._io?.disconnect();
    this._io = undefined;
    if (this._onVisibility) {
      document.removeEventListener('visibilitychange', this._onVisibility);
      this._onVisibility = undefined;
    }
    // A reattach re-observes from scratch; leaving this true would keep the
    // card paused until the observer happened to fire again.
    this._offScreen = false;
    this._pollPaused = false;
    if (this._measureRaf !== undefined) {
      cancelAnimationFrame(this._measureRaf);
      this._measureRaf = undefined;
    }
    this._stopStatPolling();
  }

  /** Build a call-service data object from a template, substituting '{value}'. */
  private _svcData(
    template: Record<string, unknown> | undefined,
    value: string | number | boolean,
    entity: string,
  ): Record<string, unknown> {
    const out: Record<string, unknown> = { entity_id: entity };
    for (const [k, v] of Object.entries(template ?? {})) {
      out[k] = v === '{value}'
        ? value
        : typeof v === 'string' ? v.split('{value}').join(String(value)) : v;
    }
    return out;
  }

  /**
   * Write an interactive control's new value back to Home Assistant. Uses an
   * explicit service override when configured, otherwise infers the service
   * from the entity domain and the value type.
   */
  private _writeControl(
    field: CardConfig['fields'][number],
    value: string | number | boolean,
    targetEntity?: string,
  ): void {
    const entity = targetEntity ?? field.entity;
    if (!this.hass || !entity) return;
    const domain = entity.split('.')[0];
    const scale = (v: number) => (field.value_scale != null ? v * field.value_scale : v);

    // A per-option entity always takes the domain default action: the field's
    // service override describes how to write the field's own entity (it comes
    // from a variant preset), so applying it to an unrelated entity is wrong.
    if (targetEntity) {
      if (typeof value === 'boolean') {
        this.hass.callService('homeassistant', value ? 'turn_on' : 'turn_off', { entity_id: entity });
      }
      return;
    }

    // Explicit service override.
    if (field.control_service) {
      const dot = field.control_service.indexOf('.');
      if (dot <= 0) return;
      const svcDomain = field.control_service.slice(0, dot);
      const svcName = field.control_service.slice(dot + 1);
      const sent = typeof value === 'number' ? scale(value) : value;
      this.hass.callService(svcDomain, svcName, this._svcData(field.control_service_data, sent, entity));
      return;
    }

    // Domain-mapped defaults.
    if (typeof value === 'boolean') {
      this.hass.callService('homeassistant', value ? 'turn_on' : 'turn_off', { entity_id: entity });
      return;
    }
    if (typeof value === 'number') {
      if (domain === 'input_number' || domain === 'number' || domain === 'counter') {
        this.hass.callService(domain, 'set_value', { entity_id: entity, value: scale(value) });
      }
      return;
    }
    if (typeof value === 'string') {
      if (domain === 'input_select' || domain === 'select') {
        this.hass.callService(domain, 'select_option', { entity_id: entity, option: value });
      } else if (domain === 'input_text' || domain === 'text') {
        this.hass.callService(domain, 'set_value', { entity_id: entity, value });
      }
    }
  }

  protected override render() {
    if (!this._config) return nothing;

    const dims = computeCanvasDims(this._config, this._imgNatural);
    const { baseW, baseH, L, T, totalW, totalH } = dims;
    this._totalW = totalW;

    const canvas = this._config.canvas;
    const defaults = this._config.defaults;
    const cards = this._config.cards ?? [];
    const url = resolveBackgroundUrl(this._config, this.hass, this._mediaUrls);
    const fit = this._config.background?.fit ?? canvas?.fit ?? sd('background_fit') ?? 'cover';

    const canvasBoxCss = canvas?.box ? boxCss(canvas.box) : '';
    const virtuals = computeVirtuals(this._config.virtuals, this.hass, this._virtualsCache, this._statsMap);
    this._virtualsCache = virtuals;

    const onAction = (actions: import('./types').TapActions, entity: string | undefined, actionType: 'tap' | 'hold' | 'double_tap') => {
      if (!this.hass) return;
      const actionCfg = actionType === 'tap' ? actions.tap_action
        : actionType === 'hold' ? actions.hold_action
        : actions.double_tap_action;
      if (actionCfg?.action === 'expand-card' && 'fields' in actions) {
        this._expandScale = 1;
        this._expandedCardId = (actions as CardConfig).id;
        return;
      }
      if (actionCfg?.action === 'open-extended' && actionCfg.extended_card_id) {
        this._openExtendedId = actionCfg.extended_card_id;
        return;
      }
      // Our ActionConfig is a flat, editor-friendly shape covering every action
      // type at once; custom-card-helpers' own type is a true discriminated
      // union. Both describe the same runtime data — handleAction only reads
      // the fields relevant to whichever `.action` is set — so this is a
      // boundary cast between two type systems, not a logic mismatch.
      handleAction(this, this.hass, { ...actions, entity } as Parameters<typeof handleAction>[2], actionType);
    };

    const onChange: import('./types').ChangeCallback = (field, value, targetEntity) => {
      if (this.hass && (targetEntity ?? field.entity)) this._writeControl(field, value, targetEntity);
    };

    // One bundle of the live data + callbacks every renderer threads through.
    void this._ensureMediaResolved();

    const ctx: RenderContext = {
      hass: this.hass,
      virtuals,
      stats: this._statsMap,
      history: this._historyMap,
      onAction,
      onChange,
      mediaUrls: this._mediaUrls,
    };

    const canvasTap = hasAnyAction(canvas);
    const expandedCard = this._expandedCardId ? cards.find((c) => c.id === this._expandedCardId) : undefined;
    const collapse = () => { this._expandedCardId = null; this._expandScale = 1; };
    const extCards = this._config.extended_cards ?? [];
    const openedExtCard = this._openExtendedId ? extCards.find((c) => c.id === this._openExtendedId) : undefined;
    const closeExtended = () => { this._openExtendedId = null; };

    // The outer ha-card clips the canvas (overflow: hidden) at the theme's
    // --ha-card-border-radius, so a canvas radius alone can't square the
    // corners — an explicit canvas.box.radius is forwarded to the wrapper.
    // Explicit config only, no seed tier: unset must keep the theme's radius.
    const haCardStyle = canvas?.box?.radius != null ? `border-radius:${canvas.box.radius}px;` : '';
    return html`
      <ha-card style=${haCardStyle}>
        <div
          class="ec-host"
          style="position:relative; width:100%; aspect-ratio:${totalW}/${totalH}; overflow:hidden;${cardChromeVars(defaults)}${customVarCss(defaults)}"
        >
          <div
            class="ec-canvas"
            style="position:absolute; top:0; left:0; width:${totalW}px; height:${totalH}px; transform:scale(var(--mc-scale,1)); transform-origin:top left; ${canvasBoxCss}${canvasTap ? 'cursor:pointer;' : ''}"
            ${actionGesture(canvas, onAction)}
          >
            ${url
              ? html`<img
                  class="ec-bg"
                  src=${url}
                  @load=${(e: Event) => {
                    const img = e.target as HTMLImageElement;
                    this._imgNatural = { w: img.naturalWidth, h: img.naturalHeight };
                  }}
                  style="position:absolute; left:${L}px; top:${T}px; width:${baseW}px; height:${baseH}px; object-fit:${fit}; display:block;"
                  decoding="async"
                  alt=""
                />`
              : nothing}
            ${renderFlows(this._config, dims, this.hass, this._cardBoxes, defaults)}
            ${cards.map((c) => renderCard(c, defaults, ctx, false, this.editor))}
            ${renderZones(this._config.zones, onAction)}
            ${(this._config.embedded_cards ?? [])
              // Editor mode ignores the condition, exactly as renderCard does for
              // a Mosaic card — a hidden card still has to be selectable to edit.
              .filter((ec) => this.editor || !ec.visible_when
                || evaluateVisibility(ec.visible_when, this.hass, virtuals))
              .map((ec) => {
                const inner = embeddedInner(ec, defaults);
                return staticHtml`<${EMB_TAG}
                  data-emb-id="${ec.id}"
                  style="position:absolute;left:${ec.position.x * 100}%;top:${ec.position.y * 100}%;transform:${ANCHOR_TRANSLATE[ec.anchor ?? 'top-left']};width:${ec.width}px;${ec.height != null ? `height:${ec.height}px;` : ''}${embeddedBoxCss(ec, defaults)}"
                  .cardConfig=${ec.card_config}
                  .hass=${this.hass}
                  ?transparent=${inner.transparent}
                  .extraCss=${inner.extraCss}
                ></${EMB_TAG}>`;
              })}
          </div>
          ${expandedCard ? html`
            <div class="ec-expand-backdrop" @click=${collapse}>
              <div class="ec-expand-panel"
                style="border-radius:${overlayPanelRadius(expandedCard.box, defaults?.card)}px">
                <div class="ec-expand-card-wrap" style="transform:scale(${this._expandScale})" @click=${(e: Event) => e.stopPropagation()}>
                  ${renderCard(expandedCard, defaults, ctx, true, false)}
                </div>
                <button class="ec-expand-close" title="Collapse (Esc)" @click=${collapse}>✕</button>
              </div>
            </div>
          ` : nothing}
          ${openedExtCard ? (() => {
            const extDef = this._config.extended_card_defaults;
            const w = openedExtCard.width ?? extDef?.width ?? 70;
            const h = openedExtCard.height ?? extDef?.height;
            // Popovers no longer inherit defaults.card (#89), so the radius
            // chain stops at the popover defaults — same tiers boxCss resolves.
            const r = overlayPanelRadius(openedExtCard.box, extDef?.card);
            const panelStyle = `width:${w}%;${h != null ? `height:${h}%` : 'max-height:85%'};overflow:auto;border-radius:${r}px;`;
            return html`
              <div class="ec-extended-backdrop" @click=${closeExtended}>
                <div class="ec-extended-panel" style=${panelStyle} @click=${(e: Event) => e.stopPropagation()}>
                  <div class="ec-ext-zoom" style="zoom:${this._extZoom}">
                    ${renderExtendedCard(openedExtCard, extDef, defaults, ctx)}
                  </div>
                  <button class="ec-ext-close" title="Close (Esc)" @click=${closeExtended}>✕</button>
                </div>
              </div>
            `;
          })() : nothing}
        </div>
      </ha-card>
    `;
  }

  static override styles = [
    viewCss,
    flowCss,
    css`
      :host {
        display: block;
      }
      ha-card {
        overflow: hidden;
      }
    `,
  ];
}

// Register with the Lovelace card picker (and surface in HACS).
interface CustomCardEntry {
  type: string;
  name: string;
  description: string;
  preview?: boolean;
  documentationURL?: string;
  image?: string;
}
const w = window as unknown as { customCards?: CustomCardEntry[] };
w.customCards = w.customCards || [];
// Idempotent, for the same reason define-guard makes customElements.define idempotent:
// if this module is ever evaluated twice in one page — a duplicated copy in a chunk, a
// stale resource still registered alongside the current one — a second push puts a
// second, indistinguishable tile in the Lovelace card picker. Registering the tag
// already fails silently in that situation; the picker entry must too.
if (!w.customCards.some((c) => c.type === TAG_CANVAS)) {
  w.customCards.push({
    type: TAG_CANVAS,
    name: CARD_NAME,
    description: 'Place cards freely over a background image (day/night, EV variants, animated flows).',
    preview: true,
    image: PREVIEW_IMAGE,
  });
}

// Type-system boundary: HTMLElementTagNameMap requires a literal key, so this is the
// one place a tag name bypasses src/tags.ts. Type-level only — in -dev builds the real
// runtime tag is the TAG_CANVAS suffixed form; keep the literal in sync with tags.ts.
declare global {
  interface HTMLElementTagNameMap {
    'mosaic-canvas': MosaicCanvas;
  }
}
