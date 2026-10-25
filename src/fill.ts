import { LitElement, html, css, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { FieldConfig, FillThreshold, GlobalDefaults } from './types';
import { sd, type SeedDefaults } from './seed-defaults';
import { numToText } from './format';
import { resolveSvgUrl } from './urls';
import { TAG_FILL } from './tags';

// Module-level SVG fetch cache — shared across all mc-fill instances.
// Stores either the in-flight Promise or the resolved (sanitized) root node.
//
// Nodes, not strings: a cached node is never adopted away from the XML document
// it was parsed into — every instance takes an importNode() clone — so one entry
// can serve any number of mc-fill elements. See sanitizeSvg for why this is not
// a string cache.
const _svgCache = new Map<string, Element | null | Promise<Element | null>>();

// ── Helpers ───────────────────────────────────────────────────────────────────


/**
 * Strip script-capable content from fetched SVG text and return the scrubbed
 * root *node*: <script>/<foreignObject> elements, on* event-handler attributes,
 * and javascript: hrefs are removed. field.svg accepts arbitrary URLs, so the
 * serving host must not be able to run script in the HA session. The SVG is
 * otherwise passed through untouched. Returns null when the text doesn't parse
 * as SVG — failing closed beats injecting something a parser rejected.
 *
 * Returns a node rather than a string on purpose, and callers must keep it one
 * (#72). This used to serialize back with XMLSerializer so the caller could
 * assign it to .innerHTML — which reparsed those same bytes in HTML context.
 * XML and HTML do not agree on how identical bytes parse (CDATA, comment edge
 * cases, raw-text-ish <style>/<title>/<desc> content, mis-nested tags HTML
 * fixes up), so markup that was inert at scrub time could reconstitute itself
 * as live markup in the final tree: the sanitizer's tree and the browser's tree
 * were not the same tree. Textbook mutation XSS, and a whole bypass class that
 * no amount of extra denylist rules can close. Handing the caller the scrubbed
 * node means there is exactly one parse, and it is the one that was sanitized.
 *
 * The denylist scrub below stays regardless — it is what strips on* handlers and
 * <script> in the first place, and defence in depth is worth having.
 */
export function sanitizeSvg(text: string): Element | null {
  if (!text) return null;
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const root = doc.documentElement;
  if (!root || root.localName === 'parsererror' || root.querySelector('parsererror')) return null;
  const scrub = (el: Element): void => {
    for (const child of [...el.children]) {
      const tag = child.localName.toLowerCase();
      if (tag === 'script' || tag === 'foreignobject') {
        child.remove();
        continue;
      }
      // SMIL can re-introduce a stripped attribute after this pass has run
      // (<animate attributeName="href" to="javascript:...">, or the same trick
      // on an on* handler, which defeats the attribute strip below). Drop any
      // animation element targeting href or an event handler; the rest of SMIL
      // — geometry, colour, opacity animation — passes through untouched.
      const animates = (child.getAttribute('attributeName') ?? '').trim();
      if ((tag === 'animate' || tag === 'set')
        && (/href/i.test(animates) || /^on/i.test(animates))) {
        child.remove();
        continue;
      }
      scrub(child);
    }
    for (const attr of [...el.attributes]) {
      const name = attr.name.toLowerCase();
      // Strip whitespace/control chars before the scheme test — the HTML URL
      // parser removes tabs/newlines, so `java\tscript:` still executes when
      // a plain prefix regex would let it through.
      if (name.startsWith('on')
        || ((name === 'href' || name.endsWith(':href'))
          && /^javascript:/i.test(attr.value.replace(/[\s\p{Cc}]/gu, '')))) {
        el.removeAttribute(attr.name);
      }
    }
  };
  scrub(root);
  return root;
}

/**
 * sd() lookup for per-element-type keys built at runtime (`${_svgKey}_fill_color`
 * and friends). Most such keys exist in SeedDefaults; the ones that don't
 * (custom SVGs have no type entry at all) resolve to undefined, same as an
 * unseeded key.
 */
function sdDyn<T>(key: string | null | undefined): T | undefined {
  return key ? (sd(key as keyof SeedDefaults) as T | undefined) : undefined;
}

/**
 * What a graphical field shows in place of a number when there is no data (#73).
 * Same em dash format.ts uses for the text path — one honesty level, not two.
 */
const NO_DATA_TEXT = '—';

/**
 * Opacity applied to the whole element while it has no data. The level itself is
 * hidden outright, so this only dims the outline/chrome that remains: enough to
 * read as "unknown", not so faint it disappears.
 */
const NO_DATA_OPACITY = 0.4;

/**
 * Everything across the bundled and remote SVGs that draws a *level*, and so must
 * be hidden when there is no level to draw. `#fill` and `[data-fill]` are the tank
 * and battery columns, `[data-needle]` the arc gauge's needle, and the two
 * `#thermo-fill-*` ids are the mercury clones _applyThermometerFill builds.
 */
const LEVEL_SELECTORS = ['[data-fill]', '#fill', '[data-needle]', '#thermo-fill-below', '#thermo-fill-above'];

export function getFillPct(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
}

export function resolveFillColor(
  value: number,
  thresholds: FillThreshold[] | undefined,
  defaultColor: string,
): string {
  if (!thresholds?.length) return defaultColor;
  const sorted = [...thresholds].sort((a, b) => a.value - b.value);
  let color = defaultColor;
  for (const t of sorted) {
    if (value >= t.value) color = t.color;
  }
  return color;
}

/**
 * Set a gradient stop's colour.
 *
 * `stop-color` has no camelCase DOM property and, as a presentation attribute,
 * never resolves `var()` — so `setAttribute('stop-color', 'var(--x)')` renders
 * black rather than the token. Every colour reaching a stop here comes from
 * user config and may be a `var()`, so it has to go through the style property.
 */
function setStopColor(stop: Element, color: string): void {
  (stop as SVGElement).style.setProperty('stop-color', color);
}

// ── McFill element ────────────────────────────────────────────────────────────

@customElement(TAG_FILL)
export class McFill extends LitElement {
  @property({ attribute: false }) field?: FieldConfig;
  @property({ attribute: false }) defaults?: GlobalDefaults;
  // null = no data, and distinct from 0 — see getRawValue in view.ts (#73).
  @property({ type: Number }) rawValue: number | null = null;
  @property({ type: String }) entityUnit = '';
  @property({ type: Number }) fillPct?: number;

  // The sanitized SVG root, held as a node rather than text — see sanitizeSvg.
  @state() private _svgRoot: Element | null = null;
  @state() private _shapesReady = false;
  // Which _svgRoot the container currently holds a clone of, so the adopt pass
  // is idempotent across the many re-renders that don't change the SVG.
  private _adoptedRoot: Element | null = null;
  // Whether the no-data treatment is currently latched on, so _applyNoData only
  // touches inline styles when the state actually flips, plus what it hid and the
  // display value each of those nodes had beforehand.
  private _noDataApplied = false;
  private _noDataHidden: { el: SVGElement; display: string }[] = [];
  private _svgNatW = 0;
  private _svgNatH = 0;
  // Inputs the injected thermometer DOM (clips, gradient, ticks) was built from.
  // While these are reference-identical only the value changed, so the two clip
  // rects move instead of tearing the whole structure down every hass update.
  private _thermoStruct: { field: FieldConfig; defaults?: GlobalDefaults; unit: string; svgRoot: Element | null } | null = null;

  // Shared across all instances — loaded once on first use
  private static _shapesModule: typeof import('./shapes') | null = null;

  static override styles = css`
    :host { display: block; line-height: 0; }
    .fill { display: inline-block; }
  `;

  override connectedCallback() {
    super.connectedCallback();
    void this._load();
  }

  protected override updated(changed: PropertyValues) {
    if (changed.has('field')) void this._load();
    this._applyExtraCss();

    if (this.field?.svg && this._svgRoot) {
      const container = this.renderRoot.querySelector('.fill') as HTMLElement | null;
      if (container) {
        container.style.filter = '';
        // Must run before the _apply* passes below — they query the injected DOM.
        this._adoptSvg(container);
      }
      if (this.field.svg?.toLowerCase().includes('thermometer')) {
        this._applyThermometerFill();
      } else if (container?.querySelector('[data-needle]')) {
        // Needle SVGs (gauge-arc) carry the data-min-label/data-max-label/
        // data-value overlays too — the label pass must run for them as well.
        this._applyNeedleFill();
        this._updateSvgLabels();
      } else if (this._svgKey === 'inverter') {
        this._applyInverterFill();
      } else {
        this._applyExternalFill();
        this._updateSvgLabels();
      }
      this._applyTankColor();
      // Last: the passes above set the level geometry from _pct, and this decides
      // whether any of it should be visible at all.
      if (container) this._applyNoData(container);
    }
  }

  /**
   * Apply the "Additional CSS" declarations to this mc-fill host: the global
   * per-element-type value (defaults[`${_svgKey}_extra_css`]) followed by the
   * field's own extra_css (later wins). Scoped to the SVG element itself.
   */
  private _applyExtraCss(): void {
    const key = this._svgKey;
    const typeCss = key
      ? ((this.defaults as Record<string, unknown> | undefined)?.[`${key}_extra_css`] as string | undefined)
      : undefined;
    const css = [typeCss, this.field?.extra_css]
      .map((s) => (s ?? '').trim().replace(/;+\s*$/, ''))
      .filter((s) => s.length > 0)
      .join(';');
    if (css) this.setAttribute('style', css);
    else if (this.getAttribute('style')) this.removeAttribute('style');
  }

  private async _load() {
    const f = this.field;
    if (!f) return;
    if (f.svg) {
      await this._fetchSvg(f.svg);
    } else if (f.shape) {
      await this._loadShapes();
    }
  }

  private async _fetchSvg(rawUrl: string) {
    // Resolved before the cache lookup so the key is the URL actually fetched.
    const url = resolveSvgUrl(rawUrl);
    let cached = _svgCache.get(url);
    if (!cached) {
      const p = fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.text();
        })
        .then(sanitizeSvg)
        .catch((e) => {
          // Was a bare `.catch(() => null)`, which made every resource failure
          // invisible: the field just rendered empty with nothing logged, which
          // is why #96 presented as "not loading" rather than as an error.
          console.warn(`[mosaic] could not load SVG ${url}:`, e);
          return null;
        });
      _svgCache.set(url, p);
      cached = p;
    }
    const root = await cached;
    if (cached instanceof Promise) {
      // Replace the Promise entry with the resolved node for future callers —
      // but drop failures so a transient network blip retries on the next load
      // instead of pinning a placeholder for the whole session.
      if (root) _svgCache.set(url, root);
      else _svgCache.delete(url);
    }
    if (this._svgRoot !== root) {
      this._svgRoot = root;
      // Natural viewBox dimensions so _w/_h can use the correct aspect ratio.
      // Read off the parsed node's attribute — there is no serialized text to
      // regex over any more, and this handles comma separators for free.
      const vb = (root?.getAttribute('viewBox') ?? '').split(/[\s,]+/).filter(Boolean);
      if (vb.length === 4) {
        this._svgNatW = parseFloat(vb[2]!);
        this._svgNatH = parseFloat(vb[3]!);
      }
    }
  }

  /**
   * Put a clone of the sanitized SVG node into the container.
   *
   * This is the whole point of #72: the node handed over by sanitizeSvg is the
   * node that renders, so the tree that was scrubbed and the tree the browser
   * builds are the same tree. Never route this back through a string —
   * `.innerHTML = serialize(root)` is the parser differential that made the
   * denylist bypassable in the first place.
   *
   * importNode clones rather than moves, so the module-level cache entry stays
   * owned by its own XML document and can serve every other instance too.
   */
  private _adoptSvg(container: HTMLElement): void {
    const root = this._svgRoot;
    if (!root) return;
    // Idempotent: re-renders that only moved the value must not tear down and
    // rebuild the injected DOM the _apply* passes have already decorated.
    if (this._adoptedRoot === root && container.firstElementChild) return;
    container.replaceChildren(document.importNode(root, true));
    this._adoptedRoot = root;
    // The thermometer fast path caches structure that has just been discarded.
    this._thermoStruct = null;
    // Fresh DOM carries none of the no-data styling, so the latch has to reopen.
    this._resetNoDataLatch();
  }

  /**
   * Hide everything that draws a level, so a no-data element reads as "unknown"
   * rather than as a confident empty (#73).
   *
   * Only the hiding happens here. The dim is a lit binding on `.fill`'s style
   * attribute and the em dash comes from _valueText — deliberately, because lit
   * rewrites that whole attribute whenever an interpolated value changes, which
   * would silently discard an imperatively-set opacity. These `display` writes are
   * safe because they land on nodes *inside* the adopted SVG, which lit never touches.
   *
   * Reverts itself when data returns. That matters now that the injected SVG
   * persists across re-renders (#72) — before node adoption every update rebuilt
   * the DOM from scratch, so a latched style would have been washed away for free.
   */
  private _applyNoData(container: HTMLElement): void {
    const noData = this._noData;
    if (noData === this._noDataApplied) return;
    if (noData) {
      const id = this.field?.fill_id;
      const sels = id ? [`#${CSS.escape(id)}`, ...LEVEL_SELECTORS] : LEVEL_SELECTORS;
      this._noDataHidden = [];
      for (const s of sels) {
        const el = container.querySelector(s) as SVGElement | null;
        if (!el) continue;
        this._noDataHidden.push({ el, display: el.style.display });
        el.style.display = 'none';
      }
    } else {
      // Restore each element's *previous* inline display, not a blanket ''. A
      // blanket reset would unhide the thermometer's original #fill path, which
      // _applyThermometerFill hides on purpose in favour of its two clipped
      // clones — the un-clipped path would then draw a full-height column.
      for (const { el, display } of this._noDataHidden) el.style.display = display;
      this._noDataHidden = [];
    }
    this._noDataApplied = noData;
  }

  /**
   * Forget that the no-data treatment was applied, because the DOM it was applied
   * to has just been replaced. Callers must run before _applyNoData in the same
   * update so the fresh nodes get re-hidden in the same frame.
   */
  private _resetNoDataLatch(): void {
    this._noDataApplied = false;
    this._noDataHidden = [];
  }

  private async _loadShapes() {
    if (!McFill._shapesModule) {
      McFill._shapesModule = await import('./shapes');
    }
    if (!this._shapesReady) this._shapesReady = true;
  }

  // ── Computed properties ──────────────────────────────────────────────────────

  /**
   * No level to draw: neither an explicit tank percentage nor a numeric value.
   *
   * Distinct from `rawValue == null` on purpose. A tank driven by
   * `tank_pct_entity` has a real level with no `field.entity` behind it, so it is
   * *not* a no-data element even though `rawValue` is null — while its value text
   * still has no number to show. Hence two predicates: this one gates the
   * graphics, `rawValue == null` gates the text.
   */
  private get _noData(): boolean {
    return this.fillPct == null && this.rawValue == null;
  }

  /**
   * The value as display text, or an em dash when there is no number behind it.
   * Keyed off rawValue rather than _noData — see the note there.
   */
  private _valueText(decimals: number | undefined): string {
    return this.rawValue == null ? NO_DATA_TEXT : numToText(this.rawValue, decimals);
  }

  private get _pct(): number {
    if (this.fillPct != null) return Math.max(0, Math.min(100, this.fillPct));
    // 0 rather than a guess when there's no data. Nothing renders it — the level
    // elements are hidden outright — but a needle at 0 would otherwise sit at the
    // minimum and read as a real measurement.
    if (this.rawValue == null) return 0;
    return getFillPct(this.rawValue, this.field?.min ?? sd('fill_min') ?? 0, this.field?.max ?? sd('fill_max') ?? 100);
  }

  private get _svgKey(): string | null {
    const url = this.field?.svg?.toLowerCase() ?? '';
    if (url.includes('thermometer-horizontal')) return 'thermo_h';
    if (url.includes('thermometer'))            return 'thermo';
    if (url.includes('battery-horizontal')) return 'battery_h';
    if (url.includes('battery-vertical'))   return 'battery_v';
    if (url.includes('tank-cylinder'))      return 'tank_cylinder';
    if (url.includes('tank-water'))         return 'tank_water';
    if (url.includes('tank-fermenter'))     return 'tank_fermenter';
    if (url.includes('tank-cone'))          return 'tank_cone';
    if (url.includes('gauge-arc'))          return 'gauge_arc';
    if (url.includes('inverter'))           return 'inverter';
    return null;
  }

  private get _color(): string {
    const key = this._svgKey;
    // The arc gauge's per-type colour lives under gauge_arc_needle_color —
    // there is no gauge_arc_fill_color key in any layer.
    const typeKey = key === 'gauge_arc' ? 'gauge_arc_needle_color' : key ? `${key}_fill_color` : null;
    const typeDefault = typeKey ? (this.defaults as Record<string, unknown>)?.[typeKey] as string | undefined : undefined;
    return resolveFillColor(
      // Thresholds need a number. With no data nothing coloured is drawn, so the
      // choice is immaterial — the lowest threshold is the least surprising.
      this.rawValue ?? 0,
      this.field?.thresholds,
      this.field?.fill_color ?? typeDefault ?? sdDyn<string>(typeKey) ?? sd('fill_color') ?? '#00d4ff',
    );
  }

  private get _fillColor2(): string | undefined {
    const key = this._svgKey;
    const typeDefault = key ? (this.defaults as Record<string, unknown>)?.[`${key}_fill_color2`] as string | undefined : undefined;
    return this.field?.fill_color2 ?? typeDefault ?? sdDyn<string>(key ? `${key}_fill_color2` : null);
  }

  /**
   * Gradient angle, same chain as `_fillColor2`. Undefined means "no angle
   * chosen" — the gradient then runs along the fill direction, which is what it
   * did before the angle existed, so an untouched config renders identically.
   */
  private get _fillAngle(): number | undefined {
    const key = this._svgKey;
    const typeDefault = key ? (this.defaults as Record<string, unknown>)?.[`${key}_fill_angle`] as number | undefined : undefined;
    return this.field?.fill_angle ?? typeDefault ?? sdDyn<number>(key ? `${key}_fill_angle` : null);
  }

  private get _w(): number {
    const f = this.field;
    if (!f) return 60;
    if (f.width != null) return f.width;
    const h = this._h;
    if (f.svg && this._svgNatW && this._svgNatH) return Math.round(h * this._svgNatW / this._svgNatH);
    return f.shape === 'bar-h' ? Math.round(h * 4) : Math.round(h * 0.5);
  }

  private get _h(): number {
    const f = this.field;
    if (!f) return 120;
    if (f.height != null) return f.height;
    if (f.svg && this._svgNatH) return this._svgNatH;
    return f.shape === 'bar-h' ? 40 : 120;
  }

  // ── External SVG clip-path ───────────────────────────────────────────────────

  private _applyExternalFill() {
    const f = this.field;
    if (!f) return;

    const container = this.renderRoot.querySelector('.fill') as HTMLElement | null;
    if (!container) return;
    const svgEl = container.querySelector('svg') as SVGSVGElement | null;
    if (svgEl) { svgEl.setAttribute('width', '100%'); svgEl.setAttribute('height', '100%'); }

    const id = f.fill_id;
    const fillEl = (id ? container.querySelector(`#${CSS.escape(id)}`) : null)
      ?? container.querySelector('[data-fill]')
      ?? container.querySelector('#fill');
    if (!fillEl) return;

    const pct = this._pct;
    const dirKey = this._svgKey ? `${this._svgKey}_fill_direction` : null;
    const dirTypeDefault = dirKey ? (this.defaults as Record<string, unknown>)?.[dirKey] as string | undefined : undefined;
    const dir = f.fill_direction ?? dirTypeDefault ?? sdDyn<string>(dirKey) ?? sd('fill_direction') ?? 'up';
    const clips: Record<string, string> = {
      up:    `polygon(0% ${100 - pct}%, 100% ${100 - pct}%, 100% 100%, 0% 100%)`,
      down:  `polygon(0% 0%, 100% 0%, 100% ${pct}%, 0% ${pct}%)`,
      left:  `polygon(0% 0%, ${pct}% 0%, ${pct}% 100%, 0% 100%)`,
      right: `polygon(${100 - pct}% 0%, 100% 0%, 100% 100%, ${100 - pct}% 100%)`,
    };

    const el = fillEl as SVGElement;
    if (!el.style.transition) el.style.transition = 'clip-path 0.6s ease';
    el.style.clipPath = clips[dir] ?? clips.up;

    const hasThresholds = (f.thresholds?.length ?? 0) > 0;
    const color2 = this._fillColor2;
    const stop0 = container.querySelector('[data-fill-stop="0"]') as SVGStopElement | null;
    const stop1 = container.querySelector('[data-fill-stop="1"]') as SVGStopElement | null;

    if (!hasThresholds && color2) {
      // Gradient mode: fill_color at fill-start → fill_color2 at fill-end
      if (stop0 && stop1) {
        // SVG has built-in gradient stops — update colors and restore gradient fill
        setStopColor(stop0, this._color);
        setStopColor(stop1, color2);
        const grad = stop0.closest('linearGradient,radialGradient') as SVGElement | null;
        if (grad?.id) el.style.fill = `url(#${grad.id})`;
      } else {
        // Inject gradient dynamically for SVGs without built-in stops
        this._applyInjectedGradient(svgEl, el, this._color, color2, dir, this._fillAngle);
      }
    } else {
      // Solid mode: thresholds take priority (no gradient), or no fill_color2 set
      this._removeInjectedGradient(svgEl);
      if (stop0) setStopColor(stop0, this._color);
      if (stop1) setStopColor(stop1, this._color);
      el.style.fill = this._color;
    }
  }

  /**
   * A CSS gradient angle as an SVG `objectBoundingBox` vector. 180° = top →
   * bottom, matching `linear-gradient()`; the half-length keeps the box corners
   * on the gradient line the way CSS does, exact here because the bounding box
   * is a unit square in this coordinate space.
   */
  private static _angleVector(deg: number): [string, string, string, string] {
    const rad = (deg * Math.PI) / 180;
    const dx = Math.sin(rad);
    const dy = -Math.cos(rad);
    const half = (Math.abs(dx) + Math.abs(dy)) / 2;
    const f = (n: number): string => String(Number(n.toFixed(4)));
    return [f(0.5 - dx * half), f(0.5 - dy * half), f(0.5 + dx * half), f(0.5 + dy * half)];
  }

  private _applyInjectedGradient(
    svgEl: SVGSVGElement | null, el: SVGElement,
    color1: string, color2: string, dir: string, angle?: number,
  ) {
    if (!svgEl) { el.style.fill = color1; return; }
    const GRAD_ID = '_mc_fg';
    let defs = svgEl.querySelector('defs') as SVGDefsElement | null;
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs') as SVGDefsElement;
      svgEl.insertBefore(defs, svgEl.firstChild);
    }
    let grad = defs.querySelector(`#${GRAD_ID}`) as SVGLinearGradientElement | null;
    if (!grad) {
      grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient') as SVGLinearGradientElement;
      grad.setAttribute('id', GRAD_ID);
      grad.setAttribute('gradientUnits', 'objectBoundingBox');
      const s0 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      s0.setAttribute('offset', '0%');
      const s1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
      s1.setAttribute('offset', '100%');
      grad.appendChild(s0);
      grad.appendChild(s1);
      defs.appendChild(grad);
    }
    // An explicit angle wins; otherwise the vector starts at the source of the
    // fill direction (color1) and ends opposite it (color2), as it always has.
    // The four directions are themselves just angles — up is 0°, down 180° —
    // so the two paths agree where they overlap.
    const vec: Record<string, [string, string, string, string]> = {
      up:    ['0.5', '1',   '0.5', '0'  ],
      down:  ['0.5', '0',   '0.5', '1'  ],
      left:  ['0',   '0.5', '1',   '0.5'],
      right: ['1',   '0.5', '0',   '0.5'],
    };
    const [x1, y1, x2, y2] = angle != null
      ? McFill._angleVector(angle)
      : (vec[dir] ?? vec.up);
    grad.setAttribute('x1', x1); grad.setAttribute('y1', y1);
    grad.setAttribute('x2', x2); grad.setAttribute('y2', y2);
    const stops = grad.querySelectorAll('stop');
    setStopColor(stops[0], color1);
    setStopColor(stops[1], color2);
    el.style.fill = `url(#${GRAD_ID})`;
  }

  private _removeInjectedGradient(svgEl: SVGSVGElement | null) {
    svgEl?.querySelector('#_mc_fg')?.remove();
  }

  private _applyInverterFill() {
    const container = this.renderRoot.querySelector('.fill') as HTMLElement | null;
    if (!container) return;
    const svgEl = container.querySelector('svg') as SVGSVGElement | null;
    if (!svgEl) return;
    // Ensure viewBox exists so width/height="100%" scales content rather than just clipping it
    if (!svgEl.getAttribute('viewBox')) {
      const w = svgEl.getAttribute('width');
      const h = svgEl.getAttribute('height');
      if (w && h) svgEl.setAttribute('viewBox', `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
    }
    svgEl.setAttribute('width', '100%');
    svgEl.setAttribute('height', '100%');
    const lineEl = svgEl.querySelector('#line') as SVGElement | null;
    if (!lineEl) return;
    const color = this.field?.fill_color
      ?? (this.defaults as Record<string, unknown>)?.['inverter_line_color'] as string | undefined
      ?? sd('inverter_line_color')
      ?? '#00d4ff';
    lineEl.style.fill = color;
  }

  private _applyTankColor() {
    const key = this._svgKey;
    const typeDefault = key ? (this.defaults as Record<string, unknown>)?.[`${key}_tank_color`] as string | undefined : undefined;
    const color = this.field?.tank_color ?? typeDefault ?? sdDyn<string>(key ? `${key}_tank_color` : null);
    if (!color) return;
    const container = this.renderRoot.querySelector('.fill') as HTMLElement | null;
    if (!container) return;
    const tankEl   = container.querySelector('#tank')     as SVGElement | null;
    const tankTopEl = container.querySelector('#tank-top') as SVGElement | null;
    if (tankEl) {
      // Cylinder style has a stroke-only #tank + separate #tank-top fill cap;
      // flat-fill tanks (tank-cone.svg, tank-fermenter.svg) have a filled #tank with no #tank-top.
      if (tankTopEl) {
        tankEl.style.stroke = color;
      } else {
        tankEl.style.fill = color;
      }
    }
    if (tankTopEl) tankTopEl.style.fill = color;
  }

  private _applyNeedleFill() {
    const container = this.renderRoot.querySelector('.fill') as HTMLElement | null;
    if (!container) return;
    const needle = container.querySelector('[data-needle]') as SVGElement | null;
    if (!needle) return;
    const angle = -90 + this._pct * 1.8;
    needle.style.transition = 'transform 0.6s ease';
    needle.style.transformBox = 'fill-box';
    needle.style.transformOrigin = '50% 100%';
    needle.style.transform = `rotate(${angle}deg)`;
    const needlePath = needle.querySelector('path') as SVGElement | null;
    if (needlePath) needlePath.style.fill = this._color;
  }

  private _updateSvgLabels() {
    const container = this.renderRoot.querySelector('.fill') as HTMLElement | null;
    if (!container) return;
    const f = this.field;
    if (!f) return;

    const key = this._svgKey;
    const labelColorDefault = key ? (this.defaults as Record<string, unknown>)?.[`${key}_label_color`] as string | undefined : undefined;
    const labelSizeDefault  = key ? (this.defaults as Record<string, unknown>)?.[`${key}_label_size`]  as number | undefined : undefined;
    const color = f.gauge_label_color ?? labelColorDefault ?? sdDyn<string>(key ? `${key}_label_color` : null) ?? sd('gauge_label_color') ?? '#cccccc';
    const size  = f.gauge_label_size  ?? labelSizeDefault  ?? sdDyn<number>(key ? `${key}_label_size` : null) ?? sd('gauge_label_size')  ?? 11;

    const minEl = container.querySelector('[data-min-label]') as SVGTextElement | null;
    const maxEl = container.querySelector('[data-max-label]') as SVGTextElement | null;
    const valEl = container.querySelector('[data-value]') as SVGTextElement | null;

    if (minEl) {
      minEl.textContent = f.gauge_min_label ?? '';
      minEl.style.fill = color;
      minEl.setAttribute('font-size', String(size));
      minEl.style.display = f.gauge_min_label ? '' : 'none';
    }
    if (maxEl) {
      maxEl.textContent = f.gauge_max_label ?? '';
      maxEl.style.fill = color;
      maxEl.setAttribute('font-size', String(size));
      maxEl.style.display = f.gauge_max_label ? '' : 'none';
    }
    if (valEl) {
      if (f.gauge_show_value) {
        const valStr = this._valueText(f.decimals);
        // No unit on an em dash — "— kWh" reads as a measurement in kWh.
        valEl.textContent = f.unit && this.rawValue != null ? `${valStr} ${f.unit}` : valStr;
        valEl.style.fill = color;
        valEl.setAttribute('font-size', String(Math.round(size * 1.5)));
        valEl.style.display = '';
      } else {
        valEl.style.display = 'none';
      }
    }
  }

  // ── Thermometer SVG ──────────────────────────────────────────────────────────

  private _applyThermometerFill() {
    const container = this.renderRoot.querySelector('.fill') as HTMLElement | null;
    if (!container) return;
    const f = this.field;
    if (!f) return;
    const svg = container.querySelector('svg') as SVGSVGElement | null;
    if (!svg) return;
    // Let the container control size — strip any hardcoded dimensions from the SVG
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    const NS = 'http://www.w3.org/2000/svg';

    // Reference elements
    const fillAreaEl  = container.querySelector('#fill-area')    as SVGRectElement | null;
    // Support new left/right SVG format; fall back to legacy unsuffixed IDs on the right side
    const tickMajorREl = (container.querySelector('#tick-major-right') ?? container.querySelector('#tick-major')) as SVGRectElement | null;
    const tickMinorREl = (container.querySelector('#tick-minor-right') ?? container.querySelector('#tick-minor')) as SVGRectElement | null;
    const tickTextREl  = (container.querySelector('#tick-text-right')  ?? container.querySelector('#tick-text'))  as SVGRectElement | null;
    const tickMajorLEl = container.querySelector('#tick-major-left') as SVGRectElement | null;
    const tickMinorLEl = container.querySelector('#tick-minor-left') as SVGRectElement | null;
    const tickTextLEl  = container.querySelector('#tick-text-left')  as SVGRectElement | null;
    const fillEl      = container.querySelector('#fill')       as SVGPathElement | null;
    const outerEl    = container.querySelector('#outer')      as SVGPathElement | null;
    const tempEl     = container.querySelector('#temp')       as SVGTextElement | null;
    const degCEl     = container.querySelector('#degrees-c')  as SVGTextElement | null;
    const degFEl     = container.querySelector('#degrees-f')  as SVGTextElement | null;
    if (!fillAreaEl || !fillEl) return;

    // fill-area coordinate space
    const faX = fillAreaEl.x.baseVal.value;
    const faY = fillAreaEl.y.baseVal.value;
    const faW = fillAreaEl.width.baseVal.value;
    const faH = fillAreaEl.height.baseVal.value;

    const minTemp = f.min ?? sd('fill_min') ?? 0;
    const maxTemp = f.max ?? sd('fill_max') ?? 100;
    const range   = maxTemp - minTemp;
    const isHorizThermo = this._svgKey === 'thermo_h';

    // 4-tier fallback for the thermo_*/thermo_h_* twin keys: field value →
    // per-orientation global default → per-orientation seed. Callers append
    // their own final literal.
    const pick = <T,>(fieldVal: T | undefined, key: string): T | undefined => {
      const dKey = isHorizThermo ? `thermo_h_${key}` : `thermo_${key}`;
      return fieldVal
        ?? ((this.defaults as Record<string, unknown> | undefined)?.[dKey] as T | undefined)
        ?? (sd(dKey as keyof SeedDefaults) as T | undefined);
    };

    const baseColor = pick<string>(f.fill_color, 'fill_color') ?? sd('fill_color') ?? '#00d4ff';

    // Clamp temperature and compute y of the current level
    // No data collapses to the bottom of the scale; the mercury clones are then
    // hidden by _applyNoData, so this only keeps the clip geometry well-formed.
    const rv    = this.rawValue ?? minTemp;
    const pct   = range > 0 ? Math.max(0, Math.min(1, (rv - minTemp) / range)) : 0;
    const tempY = faY + faH * (1 - pct);

    const tickColor         = pick<string>(f.thermo_tick_color, 'tick_color') ?? 'rgba(255,255,255,0.7)';
    const tickFontSize      = pick<number>(f.thermo_tick_font_size, 'tick_font_size') ?? 4;
    const fillOpacityAbove  = pick<number>(f.thermo_fill_opacity_above, 'fill_opacity_above') ?? 0.5;
    const gridColor         = pick<string>(f.thermo_grid_color, 'grid_color') ?? 'rgba(255,255,255,0.25)';
    const minorTickWidth    = pick<number>(f.thermo_minor_tick_width, 'minor_tick_width') ?? 0.5;
    const majorTickWidth    = pick<number>(f.thermo_major_tick_width, 'major_tick_width') ?? 0.75;
    const tempColor         = pick<string>(f.thermo_temp_color, 'temp_color') ?? '#ffffff';
    const tempFontSize      = pick<number>(f.thermo_temp_font_size, 'temp_font_size') ?? 10;
    const fontFamily        = this.defaults?.font_family    ?? 'inherit';
    const monoFontFamily    = this.defaults?.mono_font_family ?? sd('mono_font_family') ?? "'Courier New', monospace";

    const clipBottomForFastPath = faY + faH + 200;
    const setTempText = () => {
      if (!tempEl) return;
      const thermDecimals = pick<number>(f.thermo_decimals, 'decimals') ?? f.decimals;
      const valStr = this._valueText(thermDecimals);
      const tspan = tempEl.querySelector('tspan');
      if (tspan) tspan.textContent = valStr;
      else tempEl.textContent = valStr;
      return valStr;
    };

    // Fast path: the injected structure (clips, gradient, fill clones, ticks)
    // only depends on config/defaults/unit/SVG text. When those are unchanged
    // and only the value moved, reposition the two clip rects and refresh the
    // temperature text instead of rebuilding all of it.
    const prev = this._thermoStruct;
    if (prev && prev.field === f && prev.defaults === this.defaults
      && prev.unit === this.entityUnit && prev.svgRoot === this._svgRoot) {
      const rBelowOld = container.querySelector('#thermo-clip-below rect') as SVGRectElement | null;
      const rAboveOld = container.querySelector('#thermo-clip-above rect') as SVGRectElement | null;
      if (rBelowOld && rAboveOld) {
        rBelowOld.setAttribute('y', String(tempY));
        rBelowOld.setAttribute('height', String(Math.max(0, clipBottomForFastPath - tempY)));
        rAboveOld.setAttribute('height', String(Math.max(0, tempY)));
        setTempText();
        return;
      }
    }
    this._thermoStruct = { field: f, defaults: this.defaults, unit: this.entityUnit, svgRoot: this._svgRoot };
    // Past this point the mercury clones are rebuilt from scratch, so anything
    // _applyNoData hid is gone and its recorded nodes are stale. It runs again
    // later in this same update pass and will re-hide the new ones.
    this._resetNoDataLatch();

    // ── Outer: keep SVG-native fill, ensure no stroke ────────────────────────
    if (outerEl) {
      outerEl.style.stroke = 'none';
    }

    // ── Unit labels ───────────────────────────────────────────────────────────
    const applyTickColor = (el: SVGTextElement) => {
      el.style.fill       = tickColor;
      el.style.stroke     = 'none';
      el.style.fontFamily = fontFamily;
      el.removeAttribute('fill');
      const tspan = el.querySelector('tspan');
      if (tspan) {
        // Inkscape export bug: tspan may have x="0" y="0" instead of inheriting parent coords
        if (tspan.getAttribute('x') === '0' && tspan.getAttribute('y') === '0') {
          const px = el.getAttribute('x');
          const py = el.getAttribute('y');
          if (px) tspan.setAttribute('x', px);
          if (py) tspan.setAttribute('y', py);
        }
        (tspan as SVGElement).style.fill       = tickColor;
        (tspan as SVGElement).style.stroke     = 'none';
        (tspan as SVGElement).style.fontFamily = fontFamily;
        tspan.removeAttribute('fill');
      }
    };

    const isFahrenheit = this.entityUnit.includes('F');
    if (degCEl) {
      degCEl.style.display = isFahrenheit ? 'none' : 'inline';
      if (!isFahrenheit) applyTickColor(degCEl);
    }
    if (degFEl) {
      degFEl.style.display = isFahrenheit ? 'inline' : 'none';
      if (isFahrenheit) applyTickColor(degFEl);
    }

    // ── Temperature value text ────────────────────────────────────────────────
    if (tempEl) {
      setTempText();
      tempEl.style.fill       = tempColor;
      tempEl.style.stroke     = 'none';
      tempEl.style.fontFamily = monoFontFamily;
      tempEl.style.fontSize   = `${tempFontSize}px`;
      tempEl.removeAttribute('fill');
      const tspan = tempEl.querySelector('tspan');
      if (tspan) {
        (tspan as SVGElement).style.fill       = tempColor;
        (tspan as SVGElement).style.stroke     = 'none';
        (tspan as SVGElement).style.fontFamily = monoFontFamily;
        (tspan as SVGElement).style.fontSize   = `${tempFontSize}px`;
        tspan.removeAttribute('fill');
      }
    }

    // ── Two-opacity fill: remove previous, inject two clipped copies ──────────
    container.querySelector('#thermo-clip-below')?.closest('clipPath')?.remove();
    container.querySelector('#thermo-clip-above')?.closest('clipPath')?.remove();
    container.querySelector('#thermo-fill-group')?.remove();
    container.querySelector('#thermo-fill-below')?.remove();
    container.querySelector('#thermo-fill-above')?.remove();
    svg.querySelector('#thermo-fill-gradient')?.remove();

    // Clip rects are in g1-local coordinate space. Use a large constant below the
    // fill-area so the bulb (which extends below faY+faH) is always fully covered.
    // Deriving clipBottom from the SVG transform breaks for rotate() transforms
    // (e.g. thermometer-horizontal uses rotate(90,...) not translate).
    const clipBottom = faY + faH + 200;

    // clip-below: tempY → bottom (full opacity — below the temperature level and bulb)
    const clipBelow = document.createElementNS(NS, 'clipPath');
    clipBelow.id = 'thermo-clip-below';
    const rBelow = document.createElementNS(NS, 'rect');
    rBelow.setAttribute('x', '0'); rBelow.setAttribute('width', '100');
    rBelow.setAttribute('y', String(tempY));
    rBelow.setAttribute('height', String(Math.max(0, clipBottom - tempY)));
    clipBelow.appendChild(rBelow);

    // clip-above: top → tempY (50% opacity — above the current temperature)
    const clipAbove = document.createElementNS(NS, 'clipPath');
    clipAbove.id = 'thermo-clip-above';
    const rAbove = document.createElementNS(NS, 'rect');
    rAbove.setAttribute('x', '0'); rAbove.setAttribute('width', '100');
    rAbove.setAttribute('y', '0');
    rAbove.setAttribute('height', String(Math.max(0, tempY)));
    clipAbove.appendChild(rAbove);

    let defs = svg.querySelector('defs');
    if (!defs) { defs = document.createElementNS(NS, 'defs'); svg.prepend(defs); }
    defs.appendChild(clipBelow);
    defs.appendChild(clipAbove);

    // ── Fill paint: solid / gradient / threshold segments ─────────────────────
    let fillPaint: string;
    const thresholds = f.thresholds;

    if (thresholds && thresholds.length > 0) {
      // Threshold mode — hard-stop segments; fill_color2 ignored
      const sorted = [...thresholds].sort((a, b) => a.value - b.value);
      const grad = document.createElementNS(NS, 'linearGradient');
      grad.id = 'thermo-fill-gradient';
      grad.setAttribute('gradientUnits', 'userSpaceOnUse');
      grad.setAttribute('x1', '0'); grad.setAttribute('x2', '0');
      grad.setAttribute('y1', String(faY + faH)); // bottom = minTemp
      grad.setAttribute('y2', String(faY));        // top    = maxTemp

      const addStop = (offset: number, clr: string) => {
        const s = document.createElementNS(NS, 'stop');
        s.setAttribute('offset', String(Math.max(0, Math.min(1, offset))));
        setStopColor(s, clr);
        grad.appendChild(s);
      };

      let prevColor = baseColor;
      for (const t of sorted) {
        const offset = range > 0 ? (t.value - minTemp) / range : 0;
        if (offset <= 0) { prevColor = t.color; continue; }
        if (offset >= 1) break;
        addStop(offset, prevColor);
        addStop(offset, t.color);
        prevColor = t.color;
      }
      addStop(1, prevColor);

      defs.appendChild(grad);
      fillPaint = 'url(#thermo-fill-gradient)';

    } else if (this._fillColor2) {
      // Smooth gradient mode: fill_color (bottom) → fill_color2 (top), unless an
      // angle turns it. The angle vector is a unit square, so it is scaled onto
      // the fill-area rect here rather than switching to objectBoundingBox —
      // the threshold branch above depends on these same user-space coordinates.
      const grad = document.createElementNS(NS, 'linearGradient');
      grad.id = 'thermo-fill-gradient';
      grad.setAttribute('gradientUnits', 'userSpaceOnUse');
      const deg = this._fillAngle;
      if (deg != null) {
        const [ux1, uy1, ux2, uy2] = McFill._angleVector(deg).map(Number);
        grad.setAttribute('x1', String(faX + ux1 * faW));
        grad.setAttribute('y1', String(faY + uy1 * faH));
        grad.setAttribute('x2', String(faX + ux2 * faW));
        grad.setAttribute('y2', String(faY + uy2 * faH));
      } else {
        grad.setAttribute('x1', '0'); grad.setAttribute('x2', '0');
        grad.setAttribute('y1', String(faY + faH));
        grad.setAttribute('y2', String(faY));
      }

      const s0 = document.createElementNS(NS, 'stop');
      s0.setAttribute('offset', '0'); setStopColor(s0, baseColor);
      const s1 = document.createElementNS(NS, 'stop');
      s1.setAttribute('offset', '1'); setStopColor(s1, this._fillColor2);
      grad.appendChild(s0); grad.appendChild(s1);

      defs.appendChild(grad);
      fillPaint = 'url(#thermo-fill-gradient)';

    } else {
      fillPaint = baseColor;
    }

    // Clone fill path twice into a group — the SVG filter (#filter47) is applied to the
    // group so the drop-shadow sees the composite alpha of both clones (one shadow, no seam).
    fillEl.style.display = 'none';

    const fillBelow = fillEl.cloneNode(true) as SVGPathElement;
    fillBelow.id = 'thermo-fill-below';
    fillBelow.style.removeProperty('filter');
    fillBelow.style.display = '';
    fillBelow.style.fill = fillPaint;
    fillBelow.style.opacity = '1';
    fillBelow.setAttribute('clip-path', 'url(#thermo-clip-below)');

    const fillAbove = fillEl.cloneNode(true) as SVGPathElement;
    fillAbove.id = 'thermo-fill-above';
    fillAbove.style.removeProperty('filter');
    fillAbove.style.display = '';
    fillAbove.style.fill = fillPaint;
    fillAbove.style.opacity = String(fillOpacityAbove);
    fillAbove.setAttribute('clip-path', 'url(#thermo-clip-above)');

    const fillGroup = document.createElementNS(NS, 'g');
    fillGroup.id = 'thermo-fill-group';
    fillGroup.setAttribute('filter', 'url(#filter47)');
    fillGroup.appendChild(fillBelow);
    fillGroup.appendChild(fillAbove);
    fillEl.after(fillGroup);

    // CSS drop-shadow on the container — sees the composited alpha of both clones,
    // so shadow intensity naturally fades through the ghost region (no hard clip line).
    // SVG filter: dx=6 dy=8 stdDeviation=1.5 opacity=0.5 in SVG user units.
    // Allow the SVG filter's drop-shadow to render outside the SVG viewport.
    svg.style.overflow = 'visible';

    // ── Generate ticks ────────────────────────────────────────────────────────
    container.querySelector('#thermo-ticks')?.remove();

    const textPos = pick<string>(f.thermo_text_position, 'text_position') ?? 'right';
    const showRight = textPos === 'right' || textPos === 'both';
    const showLeft  = textPos === 'left'  || textPos === 'both';
    const hasRight  = !!(tickMajorREl && tickMinorREl && tickTextREl);
    const hasLeft   = !!(tickMajorLEl && tickMinorLEl && tickTextLEl);
    if (!hasRight && !hasLeft) return;

    const majorLenOverride  = pick<number>(f.thermo_major_tick_length, 'major_tick_length');
    const minorLenOverride  = pick<number>(f.thermo_minor_tick_length, 'minor_tick_length');
    const showMinorTickText = pick<boolean>(f.thermo_show_minor_tick_text, 'show_minor_tick_text') ?? false;

    // Pick smallest nice step that gives ≤ 10 major ticks
    const niceSteps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
    const majorStep = niceSteps.find((s) => Math.ceil(range / s) <= 5) ?? 10;
    const minorStep = majorStep / 2;

    const g = document.createElementNS(NS, 'g');
    g.id = 'thermo-ticks';

    const yForVal = (v: number) => faY + faH * (1 - (v - minTemp) / range);

    // Active sides: { major rect, minor rect, text rect, anchorEnd (left side) }
    type SideRects = { tmEl: SVGRectElement; tnEl: SVGRectElement; ttEl: SVGRectElement; anchorEnd: boolean };
    const sides: SideRects[] = [];
    if (showRight && hasRight) sides.push({ tmEl: tickMajorREl!, tnEl: tickMinorREl!, ttEl: tickTextREl!, anchorEnd: false });
    if (showLeft  && hasLeft)  sides.push({ tmEl: tickMajorLEl!, tnEl: tickMinorLEl!, ttEl: tickTextLEl!, anchorEnd: true  });
    if (sides.length === 0) return;

    // Minor ticks
    const firstMinorIdx = Math.ceil(minTemp / minorStep);
    const lastMinorIdx  = Math.floor(maxTemp / minorStep);
    for (const { tnEl, ttEl, anchorEnd } of sides) {
      const tnX = tnEl.x.baseVal.value;
      const tnW = minorLenOverride ?? tnEl.width.baseVal.value;
      const ttX = ttEl.x.baseVal.value;
      const ttW = ttEl.width.baseVal.value;
      for (let i = firstMinorIdx; i <= lastMinorIdx; i++) {
        if (i % 2 === 0) continue;
        const v = i * minorStep;
        const y = yForVal(v);
        const ln = document.createElementNS(NS, 'line');
        ln.setAttribute('x1', String(tnX)); ln.setAttribute('x2', String(tnX + tnW));
        ln.setAttribute('y1', String(y));   ln.setAttribute('y2', String(y));
        ln.style.stroke = tickColor;
        ln.setAttribute('stroke-width', String(minorTickWidth));
        g.appendChild(ln);
        if (showMinorTickText) {
          const textX = anchorEnd ? ttX + ttW : ttX;
          const txt = document.createElementNS(NS, 'text');
          txt.setAttribute('x', String(textX));
          txt.setAttribute('y', String(y));
          txt.setAttribute('dominant-baseline', 'middle');
          txt.setAttribute('text-anchor', anchorEnd ? 'end' : 'start');
          txt.setAttribute('font-size', String(tickFontSize));
          txt.style.fill = tickColor;
          txt.style.fontFamily = fontFamily;
          txt.textContent = String(v);
          g.appendChild(txt);
        }
      }
    }

    // Major ticks + grid line (once) + labels
    const firstMajorIdx = Math.ceil(minTemp / majorStep);
    const lastMajorIdx  = Math.floor(maxTemp / majorStep);
    for (let i = firstMajorIdx; i <= lastMajorIdx; i++) {
      const v = i * majorStep;
      const y = yForVal(v);

      // Grid line inside fill-area — drawn once per y
      const gl = document.createElementNS(NS, 'line');
      gl.setAttribute('x1', String(faX)); gl.setAttribute('x2', String(faX + faW));
      gl.setAttribute('y1', String(y));   gl.setAttribute('y2', String(y));
      gl.style.stroke = gridColor;
      gl.setAttribute('stroke-width', String(minorTickWidth));
      g.appendChild(gl);

      for (const { tmEl, ttEl, anchorEnd } of sides) {
        const tmX = tmEl.x.baseVal.value;
        const tmW = majorLenOverride ?? tmEl.width.baseVal.value;
        const ttX = ttEl.x.baseVal.value;
        const ttW = ttEl.width.baseVal.value;

        const ln = document.createElementNS(NS, 'line');
        ln.setAttribute('x1', String(tmX)); ln.setAttribute('x2', String(tmX + tmW));
        ln.setAttribute('y1', String(y));   ln.setAttribute('y2', String(y));
        ln.style.stroke = tickColor;
        ln.setAttribute('stroke-width', String(majorTickWidth));
        g.appendChild(ln);

        const textX = anchorEnd ? ttX + ttW : ttX;
        const txt = document.createElementNS(NS, 'text');
        txt.setAttribute('x', String(textX));
        txt.setAttribute('y', String(y));
        txt.setAttribute('dominant-baseline', 'middle');
        txt.setAttribute('text-anchor', anchorEnd ? 'end' : 'start');
        txt.setAttribute('font-size', String(tickFontSize));
        txt.style.fill = tickColor;
        txt.style.fontFamily = fontFamily;
        txt.textContent = String(v);
        g.appendChild(txt);
      }
    }

    // Append ticks into the same group as the reference rects so both share
    // the same coordinate space (g1-local, not root SVG space).
    const tickParent = (tickMajorREl?.parentElement ?? tickMajorLEl?.parentElement) as Element | null;
    (tickParent ?? svg).appendChild(g);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  protected override render() {
    const f = this.field;
    if (!f) return nothing;

    const w = this._w;
    const h = this._h;
    const placeholder = html`<div class="fill" style="width:${w}px;height:${h}px;background:rgba(0,0,0,0.2);border-radius:4px;"></div>`;

    // ── External SVG ──────────────────────────────────────────────────────────
    if (f.svg) {
      if (!this._svgRoot) return placeholder;
      // Deliberately empty: _adoptSvg() inserts the sanitized node in updated(),
      // which then applies clip-path and the rest. lit cannot bind a node through
      // .innerHTML, and serializing it to satisfy that binding is exactly the
      // XML→HTML reparse #72 removed — the div stays childless here.
      //
      // The no-data dim rides along in this binding rather than being written
      // imperatively in _applyNoData: lit owns this attribute and rewrites it
      // whole whenever w/h change, so an imperative opacity would vanish.
      return html`<div class="fill" style="width:${w}px;height:${h}px;overflow:hidden;${this._noData ? `opacity:${NO_DATA_OPACITY};` : ''}"></div>`;
    }

    // ── Built-in shape ────────────────────────────────────────────────────────
    if (f.shape) {
      const mod = McFill._shapesModule;
      if (!mod) return placeholder;
      const renderer = mod.SHAPES[f.shape];
      if (!renderer) return nothing;
      // Built-in shapes are all fill-style (cylinder, barV, barH) with no needle,
      // so _pct === 0 already leaves the level undrawn — no-data only needs the dim.
      return html`<div class="fill" style=${this._noData ? `opacity:${NO_DATA_OPACITY};` : nothing}
        .innerHTML=${renderer({ pct: this._pct, color: this._color, width: w, height: h })}
      ></div>`;
    }

    return nothing;
  }
}
