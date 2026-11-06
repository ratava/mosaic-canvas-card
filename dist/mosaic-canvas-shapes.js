import{f as n}from"./mosaic-canvas-card.js";const r=t=>{const o=Number(t);return Number.isFinite(o)?o:0};function y(t){const o=r(t.pct),e=r(t.width),l=r(t.height),h=8,i=h,s=120-h,c=s-i,d=c*o/100,g=s-d;return n`<svg viewBox="0 0 60 120" width=${e} height=${l}
      xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible">
    <defs>
      <linearGradient id="cyl-side" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stop-color="rgba(0,0,0,0.28)"/>
        <stop offset="35%"  stop-color="rgba(255,255,255,0.09)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.22)"/>
      </linearGradient>
      <clipPath id="cyl-clip">
        <rect x="3" y=${i} width="54" height=${c}/>
      </clipPath>
    </defs>
    <!-- Empty body -->
    <rect x="3" y=${i} width="54" height=${c} fill="rgba(0,0,0,0.22)"/>
    <!-- Liquid fill -->
    <rect x="3" y=${g} width="54" height=${d} style="fill:${t.color}" clip-path="url(#cyl-clip)"/>
    <!-- Side shading overlay -->
    <rect x="3" y=${i} width="54" height=${c} fill="url(#cyl-side)" opacity="0.55" clip-path="url(#cyl-clip)"/>
    <!-- Outline sides -->
    <line x1="3"  y1=${i} x2="3"  y2=${s} stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>
    <line x1="57" y1=${i} x2="57" y2=${s} stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>
    <!-- Bottom ellipse (rendered above fill so it frames it) -->
    <ellipse cx="30" cy=${s} rx="27" ry=${h}
      fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
    <!-- Top cap ellipse -->
    <ellipse cx="30" cy=${i} rx="27" ry=${h}
      fill="rgba(50,60,70,0.65)" stroke="rgba(255,255,255,0.28)" stroke-width="1.5"/>
  </svg>`}function w(t){const o=r(t.pct),e=r(t.width),l=r(t.height),h=l-8,i=h*o/100,s=4+h-i;return n`<svg viewBox="0 0 ${e} ${l}" width=${e} height=${l}
      xmlns="http://www.w3.org/2000/svg" style="display:block">
    <rect x="2" y="2" width=${e-4} height=${l-4}
      rx="4" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
    <rect x="4" y=${s} width=${e-8} height=${i}
      rx="3" style="fill:${t.color}"/>
  </svg>`}function $(t){const o=r(t.pct),e=r(t.width),l=r(t.height),i=(e-8)*o/100;return n`<svg viewBox="0 0 ${e} ${l}" width=${e} height=${l}
      xmlns="http://www.w3.org/2000/svg" style="display:block">
    <rect x="2" y="2" width=${e-4} height=${l-4}
      rx="4" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
    <rect x="4" y="4" width=${i} height=${l-8}
      rx="3" style="fill:${t.color}"/>
  </svg>`}const f={cylinder:y,"bar-v":w,"bar-h":$};export{f as SHAPES};
