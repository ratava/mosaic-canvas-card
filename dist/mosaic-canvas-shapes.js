function c({pct:l,color:i,width:o,height:t}){const y=104*l/100,d=112-y;return`<svg viewBox="0 0 60 120" width="${o}" height="${t}"
      xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible">
    <defs>
      <linearGradient id="cyl-side" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%"   stop-color="rgba(0,0,0,0.28)"/>
        <stop offset="35%"  stop-color="rgba(255,255,255,0.09)"/>
        <stop offset="100%" stop-color="rgba(0,0,0,0.22)"/>
      </linearGradient>
      <clipPath id="cyl-clip">
        <rect x="3" y="8" width="54" height="104"/>
      </clipPath>
    </defs>
    <!-- Empty body -->
    <rect x="3" y="8" width="54" height="104" fill="rgba(0,0,0,0.22)"/>
    <!-- Liquid fill -->
    <rect x="3" y="${d}" width="54" height="${y}" fill="${i}" clip-path="url(#cyl-clip)"/>
    <!-- Side shading overlay -->
    <rect x="3" y="8" width="54" height="104" fill="url(#cyl-side)" opacity="0.55" clip-path="url(#cyl-clip)"/>
    <!-- Outline sides -->
    <line x1="3"  y1="8" x2="3"  y2="112" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>
    <line x1="57" y1="8" x2="57" y2="112" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>
    <!-- Bottom ellipse (rendered above fill so it frames it) -->
    <ellipse cx="30" cy="112" rx="27" ry="8"
      fill="rgba(0,0,0,0.45)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
    <!-- Top cap ellipse -->
    <ellipse cx="30" cy="8" rx="27" ry="8"
      fill="rgba(50,60,70,0.65)" stroke="rgba(255,255,255,0.28)" stroke-width="1.5"/>
  </svg>`}function b({pct:l,color:i,width:o,height:t}){const r=t-8,e=r*l/100,s=4+r-e;return`<svg viewBox="0 0 ${o} ${t}" width="${o}" height="${t}"
      xmlns="http://www.w3.org/2000/svg" style="display:block">
    <rect x="2" y="2" width="${o-4}" height="${t-4}"
      rx="4" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
    <rect x="4" y="${s}" width="${o-8}" height="${e}"
      rx="3" fill="${i}"/>
  </svg>`}function n({pct:l,color:i,width:o,height:t}){const e=(o-8)*l/100;return`<svg viewBox="0 0 ${o} ${t}" width="${o}" height="${t}"
      xmlns="http://www.w3.org/2000/svg" style="display:block">
    <rect x="2" y="2" width="${o-4}" height="${t-4}"
      rx="4" fill="rgba(0,0,0,0.25)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
    <rect x="4" y="4" width="${e}" height="${t-8}"
      rx="3" fill="${i}"/>
  </svg>`}const $={cylinder:c,"bar-v":b,"bar-h":n};export{$ as SHAPES};
