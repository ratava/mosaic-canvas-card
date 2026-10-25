/**
 * Built-in fill shape renderers.
 * Dynamically imported — only loaded when fill fields with built-in shapes are present.
 * Each renderer returns a complete SVG string with the fill level already baked in.
 */

export interface ShapeOpts {
  pct: number;    // 0–100 fill percentage
  color: string;  // fill color
  width: number;  // design px
  height: number; // design px
}

export type ShapeRenderer = (opts: ShapeOpts) => string;

function cylinder({ pct, color, width, height }: ShapeOpts): string {
  // Proportional geometry within a 60×120 viewBox
  const ex = 8; // ellipse ry
  const bodyTop = ex;
  const bodyBot = 120 - ex;
  const bodyH = bodyBot - bodyTop;
  const fillH = (bodyH * pct) / 100;
  const fillY = bodyBot - fillH;

  return `<svg viewBox="0 0 60 120" width="${width}" height="${height}"
      xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible">
    <defs>
      <linearGradient id="cyl-side" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stop-color="rgba(0,0,0,0.28)"/>
        <stop offset="35%"  stop-color="rgba(255,255,255,0.09)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.22)"/>
      </linearGradient>
      <clipPath id="cyl-clip">
        <rect x="3" y="${bodyTop}" width="54" height="${bodyH}"/>
      </clipPath>
    </defs>
    <!-- Empty body -->
    <rect x="3" y="${bodyTop}" width="54" height="${bodyH}" fill="rgba(0,0,0,0.22)"/>
    <!-- Liquid fill -->
    <rect x="3" y="${fillY}" width="54" height="${fillH}" style="fill:${color}" clip-path="url(#cyl-clip)"/>
    <!-- Side shading overlay -->
    <rect x="3" y="${bodyTop}" width="54" height="${bodyH}" fill="url(#cyl-side)" opacity="0.55" clip-path="url(#cyl-clip)"/>
    <!-- Outline sides -->
    <line x1="3"  y1="${bodyTop}" x2="3"  y2="${bodyBot}" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>
    <line x1="57" y1="${bodyTop}" x2="57" y2="${bodyBot}" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>
    <!-- Bottom ellipse (rendered above fill so it frames it) -->
    <ellipse cx="30" cy="${bodyBot}" rx="27" ry="${ex}"
      fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
    <!-- Top cap ellipse -->
    <ellipse cx="30" cy="${bodyTop}" rx="27" ry="${ex}"
      fill="rgba(50,60,70,0.65)" stroke="rgba(255,255,255,0.28)" stroke-width="1.5"/>
  </svg>`;
}

function barV({ pct, color, width, height }: ShapeOpts): string {
  const inner = height - 8;
  const fillH = (inner * pct) / 100;
  const fillY = 4 + inner - fillH;
  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"
      xmlns="http://www.w3.org/2000/svg" style="display:block">
    <rect x="2" y="2" width="${width - 4}" height="${height - 4}"
      rx="4" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
    <rect x="4" y="${fillY}" width="${width - 8}" height="${fillH}"
      rx="3" style="fill:${color}"/>
  </svg>`;
}

function barH({ pct, color, width, height }: ShapeOpts): string {
  const inner = width - 8;
  const fillW = (inner * pct) / 100;
  return `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"
      xmlns="http://www.w3.org/2000/svg" style="display:block">
    <rect x="2" y="2" width="${width - 4}" height="${height - 4}"
      rx="4" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
    <rect x="4" y="4" width="${fillW}" height="${height - 8}"
      rx="3" style="fill:${color}"/>
  </svg>`;
}

export const SHAPES: Record<string, ShapeRenderer> = {
  'cylinder': cylinder,
  'bar-v':    barV,
  'bar-h':    barH,
};
