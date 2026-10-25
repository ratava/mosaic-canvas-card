import{C as rt,a as At,b as Ft,s as Kt,i as J,c as De,d as b,M as Dt,e as qt,f as r,A as u,g as Ge,h as te,r as me,j as ke,k as Zt,T as Je,l as mt,u as Xt,w as Jt,B as Qt,L as He,m as bt,v as Se,n as We,o as ei,p as ti,q as ii,t as oi,x as Ce,y as si,z as ai,D as ni,E as ri,S as Ue,F as vt,G as li,H as ft,I as Qe,P as de,J as ci,K as et,N as di,O as hi,Q as pi,R as ui,U as _i,V as gi,W as w,X as mi,Y as bi}from"./mosaic-canvas-card.js";const we=(e,t=0,i=1)=>e>i?i:e<t?t:e,q=(e,t=0,i=Math.pow(10,t))=>Math.round(i*e)/i,vi=e=>$i(tt(e)),tt=e=>(e[0]==="#"&&(e=e.substring(1)),e.length<6?{r:parseInt(e[0]+e[0],16),g:parseInt(e[1]+e[1],16),b:parseInt(e[2]+e[2],16),a:e.length===4?q(parseInt(e[3]+e[3],16)/255,2):1}:{r:parseInt(e.substring(0,2),16),g:parseInt(e.substring(2,4),16),b:parseInt(e.substring(4,6),16),a:e.length===8?q(parseInt(e.substring(6,8),16)/255,2):1}),fi=e=>xi(wi(e)),yi=({h:e,s:t,v:i,a:o})=>{const s=(200-t)*i/100;return{h:q(e),s:q(s>0&&s<200?t*i/100/(s<=100?s:200-s)*100:0),l:q(s/2),a:q(o,2)}},it=e=>{const{h:t,s:i,l:o}=yi(e);return`hsl(${t}, ${i}%, ${o}%)`},wi=({h:e,s:t,v:i,a:o})=>{e=e/360*6,t=t/100,i=i/100;const s=Math.floor(e),a=i*(1-t),n=i*(1-(e-s)*t),l=i*(1-(1-e+s)*t),c=s%6;return{r:q([i,n,a,a,l,i][c]*255),g:q([l,i,i,n,a,a][c]*255),b:q([a,a,l,i,i,n][c]*255),a:q(o,2)}},Ee=e=>{const t=e.toString(16);return t.length<2?"0"+t:t},xi=({r:e,g:t,b:i,a:o})=>{const s=o<1?Ee(q(o*255)):"";return"#"+Ee(e)+Ee(t)+Ee(i)+s},$i=({r:e,g:t,b:i,a:o})=>{const s=Math.max(e,t,i),a=s-Math.min(e,t,i),n=a?s===e?(t-i)/a:s===t?2+(i-e)/a:4+(e-t)/a:0;return{h:q(60*(n<0?n+6:n)),s:q(s?a/s*100:0),v:q(s/255*100),a:o}},Ot=(e,t)=>{if(e===t)return!0;for(const i in e)if(e[i]!==t[i])return!1;return!0},ki=(e,t)=>e.toLowerCase()===t.toLowerCase()?!0:Ot(tt(e),tt(t)),yt={},Nt=e=>{let t=yt[e];return t||(t=document.createElement("template"),t.innerHTML=e,yt[e]=t),t},lt=(e,t,i)=>{e.dispatchEvent(new CustomEvent(t,{bubbles:!0,detail:i}))};let be=!1;const ot=e=>"touches"in e,Si=e=>be&&!ot(e)?!1:(be||(be=ot(e)),!0),wt=(e,t)=>{const i=ot(t)?t.touches[0]:t,o=e.el.getBoundingClientRect();lt(e.el,"move",e.getMove({x:we((i.pageX-(o.left+window.pageXOffset))/o.width),y:we((i.pageY-(o.top+window.pageYOffset))/o.height)}))},Ci=(e,t)=>{const i=t.keyCode;i>40||e.xy&&i<37||i<33||(t.preventDefault(),lt(e.el,"move",e.getMove({x:i===39?.01:i===37?-.01:i===34?.05:i===33?-.05:i===35?1:i===36?-1:0,y:i===40?.01:i===38?-.01:0},!0)))};class Lt{constructor(t,i,o,s){const a=Nt(`<div role="slider" tabindex="0" part="${i}" ${o}><div part="${i}-pointer"></div></div>`);t.appendChild(a.content.cloneNode(!0));const n=t.querySelector(`[part=${i}]`);n.addEventListener("mousedown",this),n.addEventListener("touchstart",this),n.addEventListener("keydown",this),this.el=n,this.xy=s,this.nodes=[n.firstChild,n]}set dragging(t){const i=t?document.addEventListener:document.removeEventListener;i(be?"touchmove":"mousemove",this),i(be?"touchend":"mouseup",this)}handleEvent(t){switch(t.type){case"mousedown":case"touchstart":if(t.preventDefault(),!Si(t)||!be&&t.button!=0)return;this.el.focus(),wt(this,t),this.dragging=!0;break;case"mousemove":case"touchmove":t.preventDefault(),wt(this,t);break;case"mouseup":case"touchend":this.dragging=!1;break;case"keydown":Ci(this,t);break}}style(t){t.forEach((i,o)=>{for(const s in i)this.nodes[o].style.setProperty(s,i[s])})}}class Ei extends Lt{constructor(t){super(t,"hue",'aria-label="Hue" aria-valuemin="0" aria-valuemax="360"',!1)}update({h:t}){this.h=t,this.style([{left:`${t/360*100}%`,color:it({h:t,s:100,v:100,a:1})}]),this.el.setAttribute("aria-valuenow",`${q(t)}`)}getMove(t,i){return{h:i?we(this.h+t.x*360,0,360):360*t.x}}}class Ti extends Lt{constructor(t){super(t,"saturation",'aria-label="Color"',!0)}update(t){this.hsva=t,this.style([{top:`${100-t.v}%`,left:`${t.s}%`,color:it(t)},{"background-color":it({h:t.h,s:100,v:100,a:1})}]),this.el.setAttribute("aria-valuetext",`Saturation ${q(t.s)}%, Brightness ${q(t.v)}%`)}getMove(t,i){return{s:i?we(this.hsva.s+t.x*100,0,100):t.x*100,v:i?we(this.hsva.v-t.y*100,0,100):Math.round(100-t.y*100)}}}const zi=':host{display:flex;flex-direction:column;position:relative;width:200px;height:200px;user-select:none;-webkit-user-select:none;cursor:default}:host([hidden]){display:none!important}[role=slider]{position:relative;touch-action:none;user-select:none;-webkit-user-select:none;outline:0}[role=slider]:last-child{border-radius:0 0 8px 8px}[part$=pointer]{position:absolute;z-index:1;box-sizing:border-box;width:28px;height:28px;display:flex;place-content:center center;transform:translate(-50%,-50%);background-color:#fff;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,.2)}[part$=pointer]::after{content:"";width:100%;height:100%;border-radius:inherit;background-color:currentColor}[role=slider]:focus [part$=pointer]{transform:translate(-50%,-50%) scale(1.1)}',Ri="[part=hue]{flex:0 0 24px;background:linear-gradient(to right,red 0,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,red 100%)}[part=hue-pointer]{top:50%;z-index:2}",Pi="[part=saturation]{flex-grow:1;border-color:transparent;border-bottom:12px solid #000;border-radius:8px 8px 0 0;background-image:linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,rgba(255,255,255,0));box-shadow:inset 0 0 0 1px rgba(0,0,0,.05)}[part=saturation-pointer]{z-index:3}",Te=Symbol("same"),Ve=Symbol("color"),xt=Symbol("hsva"),Ye=Symbol("update"),$t=Symbol("parts"),kt=Symbol("css"),St=Symbol("sliders");class Ii extends HTMLElement{static get observedAttributes(){return["color"]}get[kt](){return[zi,Ri,Pi]}get[St](){return[Ti,Ei]}get color(){return this[Ve]}set color(t){if(!this[Te](t)){const i=this.colorModel.toHsva(t);this[Ye](i),this[Ve]=t}}constructor(){super();const t=Nt(`<style>${this[kt].join("")}</style>`),i=this.attachShadow({mode:"open"});i.appendChild(t.content.cloneNode(!0)),i.addEventListener("move",this),this[$t]=this[St].map(o=>new o(i))}connectedCallback(){if(this.hasOwnProperty("color")){const t=this.color;delete this.color,this.color=t}else this.color||(this.color=this.colorModel.defaultColor)}attributeChangedCallback(t,i,o){const s=this.colorModel.fromAttr(o);this[Te](s)||(this.color=s)}handleEvent(t){const i=this[xt],o={...i,...t.detail};this[Ye](o);let s;!Ot(o,i)&&!this[Te](s=this.colorModel.fromHsva(o))&&(this[Ve]=s,lt(this,"color-changed",{value:s}))}[Te](t){return this.color&&this.colorModel.equal(t,this.color)}[Ye](t){this[xt]=t,this[$t].forEach(i=>i.update(t))}}const Mi={defaultColor:"#000",toHsva:vi,fromHsva:({h:e,s:t,v:i})=>fi({h:e,s:t,v:i,a:1}),equal:ki,fromAttr:e=>e};class Ai extends Ii{get colorModel(){return Mi}}class Fi extends Ai{}customElements.define("hex-color-picker",Fi);const st=1,Di=/^(entity|entity_id|entities|device_id|area_id)$|_entity$/,ze=e=>typeof e=="string"&&e.startsWith("virtual:");function at(e){if(Array.isArray(e))return e.map(i=>at(i));if(typeof e!="object"||e===null)return e;const t={};for(const[i,o]of Object.entries(e))Di.test(i)?ze(o)?t[i]=o:Array.isArray(o)&&o.some(ze)&&(t[i]=o.filter(ze)):i==="inputs"&&Array.isArray(o)&&o.every(s=>typeof s=="string")?t[i]=o.filter(ze):t[i]=at(o);return t}function Oi(e,t,i={}){const{type:o,...s}=e;return{ec_template:!0,version:st,card_version:rt,name:t.trim()||"Mosaic Canvas Template",exported:new Date().toISOString(),config:i.includeEntities===!1?at(s):s}}function Ni(e){const t=JSON.stringify(e,null,2),i=new Blob([t],{type:"application/json"}),o=URL.createObjectURL(i),s=document.createElement("a");s.href=o,s.download=`${e.name.replace(/[^a-z0-9]+/gi,"_").toLowerCase()}.json`,document.body.appendChild(s),s.click(),document.body.removeChild(s),URL.revokeObjectURL(o)}function Li(e){let t;try{t=JSON.parse(e)}catch{return{template:null,error:"Invalid JSON — could not parse file."}}if(typeof t!="object"||t===null||!t.ec_template)return{template:null,error:"Not a valid Mosaic Canvas template file."};const i=t;return typeof i.version!="number"?{template:null,error:"Template is missing a version number."}:i.version>st?{template:null,error:`Template schema v${i.version} is newer than this card supports (v${st}). Update the card first.`}:{template:i,error:null}}function Bi(e,t){return{type:t,...e.config}}const Bt=1;function Gi(e,t){return{mosaic_control_variants:!0,version:Bt,card_version:rt,name:t.trim()||"Mosaic Control Variants",exported:new Date().toISOString(),variants:e}}function Hi(e){const t=new Blob([JSON.stringify(e,null,2)],{type:"application/json"}),i=URL.createObjectURL(t),o=document.createElement("a");o.href=i,o.download=`${e.name.replace(/[^a-z0-9]+/gi,"_").toLowerCase()}.json`,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(i)}function Wi(e){let t;try{t=JSON.parse(e)}catch{return{pack:null,error:"File is not valid JSON."}}if(typeof t!="object"||t===null)return{pack:null,error:"File is not a control variant pack."};const i=t;return i.mosaic_control_variants!==!0?{pack:null,error:"File is not a control variant pack. (Card layouts use Import Template instead.)"}:typeof i.version!="number"||i.version>Bt?{pack:null,error:`Pack was made by a newer Mosaic version (schema ${String(i.version)}). Update the card first.`}:typeof i.variants!="object"||i.variants===null?{pack:null,error:"Pack contains no variants."}:{pack:{mosaic_control_variants:!0,version:i.version,card_version:i.card_version??"unknown",name:i.name?.trim()||"Imported variants",exported:i.exported??"",variants:i.variants},error:null}}function Ui(e){if(typeof e!="object"||e===null)return!1;const t=e;return typeof t.id=="string"&&t.id.length>0&&typeof t.label=="string"&&t.label.length>0}function Vi(e,t){const i={...e};let o=0,s=0;for(const a of At){const n=(t.variants[a]??[]).filter(Ui);if(!n.length)continue;const l=[...i[a]??[]],c=new Set([...Ft(a).map(d=>d.id),...l.map(d=>d.id)]);for(const d of n){let h=d.id;if(c.has(h)){const _=Kt(d.id);let m=2;for(;c.has(`${_}_${m}`);)m++;h=`${_}_${m}`,s++}c.add(h),l.push({...d,id:h}),o++}i[a]=l}return{merged:i,added:o,renamed:s}}const Gt=[{id:"popover-ref",label:"Dangling popover actions",hint:"Open Popover pointing at a card that no longer exists",icon:"mdi:picture-in-picture-bottom-right"},{id:"flow-endpoint",label:"Broken flow endpoints",hint:"Flow point anchored to a removed card",icon:"mdi:chart-timeline-variant"},{id:"no-write-target",label:"Nowhere to write",hint:"A value is set, but there is no entity to write it to",icon:"mdi:pencil-off-outline"},{id:"entity",label:"Missing entities",hint:"Entity not present in Home Assistant",icon:"mdi:database-off-outline"},{id:"virtual-ref",label:"Dangling virtual entities",hint:"A virtual: reference with no matching virtual entity",icon:"mdi:memory"},{id:"unreachable-key",label:"Not editable here",hint:"Set in YAML — this editor offers no screen for it",icon:"mdi:code-braces"},{id:"unpickable-value",label:"Value not offered",hint:"Legal in YAML but absent from this editor's picker",icon:"mdi:format-list-bulleted-type"},{id:"grid-placement",label:"Grid placement problems",hint:"A field outside its card's cells, or sharing one",icon:"mdi:view-grid-outline"}],Yi=Gt.reduce((e,t)=>(e[t.id]=t.icon,e),{}),ji=["entity","attribute"],je={card:["id","fields","position","group"],extCard:["id","fields"],field:["id","type","variant","svg","shape","display_name","column","column_end","row","row_end","time_until_layout",...ji],zone:["id"],flow:["id","points"],emb:["id","group"],virtual:["id","inputs"]},Ki=["tap_action","hold_action","double_tap_action"],qi={tap_action:"Tap action",hold_action:"Hold action",double_tap_action:"Double-tap action"},Zi=Dt;function Ht(e,t){return e!=="field"?je[e]:J(t.type)?[...je.field,...Zi]:je.field}function Xi(e){return Ht("field",e)}const Ct="virtual:";function _e(e){return t=>{const i=e.get(t);return i?{key:t,label:i}:{key:t}}}function Ji(e,t,i){const o=[],s=[],a=["Global Defaults and the config root are not scanned for keys this editor cannot reach — their override badges cover that ground instead.","Grid placement is checked for cells outside the card and for two fields sharing one. Whether a field is too big for its cell is not checked — that depends on the rendered text, which this screen cannot measure."],n=[...new Set(Object.values(i.offered).flatMap(v=>Object.keys(v??{})))].sort();if(n.length&&a.push(`Picker values are verified for ${n.join(", ")}. Other dropdowns build their option list inline and are not checked.`),!e)return{issues:o,skipped:s,coverage:a};const l=e.cards??[],c=e.extended_cards??[],d=e.embedded_cards??[],h=e.zones??[],_=e.flows??[],m=e.virtuals??[],g=new Set(l.map(v=>v.id)),f=new Set(c.map(v=>v.id)),$=new Set(m.map(v=>v.id)),R=new Set(e.health_ignore??[]),k=t?.states;k||s.push({check:"entity",reason:"Home Assistant state is not available to the editor yet, so entity references were not verified."});const x=v=>{const T=`${v.check}|${v.ref}|${v.slot}`;o.push({id:T,check:v.check,severity:v.severity,where:v.where,detail:v.detail,icon:Yi[v.check],ignored:R.has(T),...v.target?{target:v.target}:{},...v.removal?{removal:v.removal}:{}})},C=(v,T)=>{if(v){if(v.startsWith(Ct)){const O=v.slice(Ct.length);$.has(O)||x({check:"virtual-ref",severity:"error",ref:T.ref,slot:T.slot,where:T.where,detail:`${T.label} points at virtual entity “${O}”, which is not in the Virtual Entities list.`,target:T.target});return}k&&(k[v]||x({check:"entity",severity:"error",ref:T.ref,slot:T.slot,where:T.where,detail:`${T.label} is set to “${v}”, which does not exist in Home Assistant.`,target:T.target}))}},S=(v,T)=>{for(const O of Ki){const I=v[O];if(!I)continue;const M=qi[O],z=`${T.slotPfx??""}${O}`;I.action==="open-extended"&&(I.extended_card_id?f.has(I.extended_card_id)||x({check:"popover-ref",severity:"error",ref:T.ref,slot:z,where:T.where,detail:`${M} opens popover card “${I.extended_card_id}”, which is not in the Popover Cards list.`,target:T.target}):x({check:"popover-ref",severity:"error",ref:T.ref,slot:z,where:T.where,detail:`${M} opens a popover card but names none.`,target:T.target}));const N=[];I.entity&&N.push(I.entity);const L=I.target?.entity_id;typeof L=="string"?N.push(L):Array.isArray(L)&&N.push(...L.filter(W=>typeof W=="string")),N.forEach((W,ae)=>C(W,{ref:T.ref,slot:`${z}.entity.${ae}`,label:`${M} entity`,where:T.where,target:T.target}))}},E=v=>{const T=Ht(v.kind,v.item),O=i.offered[v.kind],I=_e(v.screens.labels);for(const[M,z]of Object.entries(v.item)){if(z===void 0)continue;const N=v.screens.slots.get(M);if(N===void 0){if(T.includes(M))continue;x({check:"unreachable-key",severity:"info",ref:v.ref,slot:M,where:v.where,detail:`“${M}” is set in the YAML but no screen in this editor can show or change it.`,target:v.base,removal:v.removal(M)});continue}const L=O?.[M];L&&typeof z=="string"&&z!==""&&!L.includes(z)&&x({check:"unpickable-value",severity:"info",ref:v.ref,slot:M,where:v.where,detail:`“${M}” is “${z}”, which this editor's picker does not offer — it can only be changed in YAML.`,target:{...v.base,path:[...v.base.path,I(N)]},removal:v.removal(M)})}},F=(v,T,O,I,M,z)=>{const N=v==="popover",L=N?"egs":"gs",W=N?"eopt":"opt",ae=N?"xfield":"field";z.forEach(D=>{const ne=i.fieldName(D),Q=`${T} › ${M} › ${ne}`,B=`${ae}:${I}/${D.id}`,j={key:`field:${D.id}`,label:ne},ee=i.screens("field",D),U=_e(ee.labels),X=(...G)=>({tab:"cards",panel:v,path:[O,j,...G]}),ut=J(D.type),jt=U(ut?"fsec:control":"fsec:source");C(D.entity,{ref:B,slot:"entity",label:"Entity",where:Q,target:X(jt)});for(const[G,K]of[["charging_entity","Charging entity"],["tank_pct_entity","Tank % entity"],["tank_volume_entity","Tank volume entity"],["tank_capacity_entity","Tank capacity entity"]])C(D[G],{ref:B,slot:G,label:K,where:Q,target:X(U("fsec:source"))});(D.graph_series??[]).forEach((G,K)=>{const oe=G.label||G.entity||`Series ${K+1}`;C(G.entity,{ref:B,slot:`graph_series.${K}.entity`,label:"Series entity",where:`${Q} › ${oe}`,target:X(U("fsec:series"),{key:`${L}:${K}`,label:oe})})}),(D.options??[]).forEach((G,K)=>{const oe=G.label||G.value||`Option ${K+1}`,_t=`${Q} › ${oe}`,gt=X(U("fsec:options"),{key:`${W}:${K}`,label:oe});C(G.entity,{ref:B,slot:`options.${K}.entity`,label:"Option entity",where:_t,target:gt}),S(G,{ref:B,where:_t,target:gt,slotPfx:`options.${K}.`})});for(const G of["left","center","right"])C(D.slider_labels?.[G]?.entity,{ref:B,slot:`slider_labels.${G}.entity`,label:`${G} track label entity`,where:Q,target:X(U("fsec:sliderpoints"))});if(S(D,{ref:B,where:Q,target:X(U(ut?"fsec:control":"fsec:actions"))}),!D.entity){const G=(D.options??[]).filter(K=>(K.value??"")!==""&&(D.type==="dropdown"||!K.entity)&&!(D.type==="button_group"&&K.tap_action?.action==="open-extended"));if((D.type==="button_group"||D.type==="dropdown")&&G.length){const K=G.length,oe=K===1;x({check:"no-write-target",severity:"error",ref:B,slot:"entity",where:Q,detail:`${K} option${oe?"":"s"} write${oe?"s":""} a value to this field's entity, but the field has none — ${oe?"it renders":"they render"} disabled and can do nothing. ${D.type==="dropdown"?"Set an entity on the field — a dropdown always writes to it and ignores an entity set on the option.":`Give ${oe?"the option its own entity":"each option its own entity"}, or set one on the field.`}`,target:X(U("fsec:options"))})}D.type==="button"&&(D.button_value??"")!==""&&x({check:"no-write-target",severity:"error",ref:B,slot:"button_value",where:Q,detail:`Press writes “${D.button_value}” to this field's entity, but the field has none — the button renders disabled.`,target:X(U("fsec:options"))})}E({kind:"field",item:D,screens:ee,ref:B,where:Q,base:{tab:"cards",panel:v,path:[O,j]},removal:G=>({kind:"field",extended:N,cardId:I,itemId:D.id,key:G})})})},Y=(v,T)=>{if(De(v,e.defaults)!=="grid")return;const O=v.grid?.columns??e.defaults?.card_grid_columns??b("card_grid_columns")??4,I=v.grid?.rows??e.defaults?.card_grid_rows??b("card_grid_rows")??4,M=new Map;(v.fields??[]).forEach(z=>{const N=i.fieldName(z),L=`field:${v.id}/${z.id}`,W=`${T.where} › ${N}`,ae={tab:"cards",panel:"mosaic",path:[T.crumb,{key:`field:${z.id}`,label:N}]},D=(B,j)=>x({check:"grid-placement",severity:"error",ref:L,slot:B,where:W,detail:j,target:ae});for(const[B,j,ee,U,X]of[["column",z.column,z.column_end,O,"Column"],["row",z.row,z.row_end,I,"Row"]])j!=null&&(j<1||j>U)&&D(B,`${X} ${j} is outside this card's grid, which is ${U} ${B}${U===1?"":"s"} — the field renders outside the cells the card sizes.`),ee!=null&&(ee>U?D(`${B}_end`,`${X} span ends at ${ee}, past this card's ${U} ${B}${U===1?"":"s"} — the field renders outside the cells the card sizes.`):j!=null&&ee<=j&&D(`${B}_end`,`${X} span ends at ${ee}, which is not past its start of ${j} — the span is ignored and the field occupies one cell.`));if(z.row==null||z.column==null)return;const ne=z.row_end!=null&&z.row_end>z.row?z.row_end:z.row,Q=z.column_end!=null&&z.column_end>z.column?z.column_end:z.column;for(let B=z.row;B<=ne;B++)for(let j=z.column;j<=Q;j++){const ee=`${B},${j}`,U=M.get(ee);if(U&&U!==N){D("row",`Shares row ${B}, column ${j} with “${U}” — both render, one on top of the other.`);return}M.set(ee,N)}})},Z=i.screens("card"),Ne=_e(Z.labels);l.forEach((v,T)=>{const O=v.name??`Card ${T+1}`,I=`Mosaic Cards › ${O}`,M=`card:${v.id}`,z={key:`card:${v.id}`,label:O},N=L=>({tab:"cards",panel:"mosaic",path:L?[z,Ne(L)]:[z]});C(v.visible_when?.entity,{ref:M,slot:"visible_when.entity",label:"Visibility condition entity",where:I,target:N("sec:visibility")}),v.bg?.rules?.length&&C(v.bg.entity,{ref:M,slot:"bg.entity",label:"Background image entity",where:I,target:N("sec:bg")}),S(v,{ref:M,where:I,target:N("sec:actions")}),E({kind:"card",item:v,screens:Z,ref:M,where:I,base:N(),removal:L=>({kind:"card",itemId:v.id,key:L})}),F("mosaic","Mosaic Cards",z,v.id,O,v.fields??[]),Y(v,{where:I,crumb:z})});const Le=i.screens("extCard");c.forEach((v,T)=>{const O=v.name??`Popover Card ${T+1}`,I={key:`card:${v.id}`,label:O};E({kind:"extCard",item:v,screens:Le,ref:`xcard:${v.id}`,where:`Popover Cards › ${O}`,base:{tab:"cards",panel:"popover",path:[I]},removal:M=>({kind:"extCard",itemId:v.id,key:M})}),F("popover","Popover Cards",I,v.id,O,v.fields??[])});const $e=i.screens("emb");d.forEach((v,T)=>{const O=v.name??v.id??`Embedded ${T+1}`;E({kind:"emb",item:v,screens:$e,ref:`emb:${v.id}`,where:`Embedded External Cards › ${O}`,base:{tab:"cards",panel:"embedded",path:[{key:`emb:${v.id}`,label:O}]},removal:I=>({kind:"emb",itemId:v.id,key:I})})});const ve=i.screens("zone"),Be=_e(ve.labels);h.forEach((v,T)=>{const O=v.name??v.id??`Zone ${T+1}`,I=`Clickable Zones › ${O}`,M=`zone:${v.id}`,z={key:`zone:${v.id}`,label:O},N=L=>({tab:"elements",panel:"zones",path:L?[z,Be(L)]:[z]});S(v,{ref:M,where:I,target:N("sec:actions")}),E({kind:"zone",item:v,screens:ve,ref:M,where:I,base:N(),removal:L=>({kind:"zone",itemId:v.id,key:L})})});const pt=i.screens("flow"),Yt=_e(pt.labels);_.forEach((v,T)=>{const O=v.name??v.id??`Flow ${T+1}`,I=`Animated Flow Lines › ${O}`,M=`flow:${v.id}`,z={key:`flow:${v.id}`,label:O},N=(...L)=>({tab:"elements",panel:"flows",path:[z,...L]});C(v.entity,{ref:M,slot:"entity",label:"Entity",where:I,target:N(Yt("sec:defaults"))}),(v.points??[]).forEach((L,W)=>{L.card&&!g.has(L.card)&&x({check:"flow-endpoint",severity:"error",ref:M,slot:`points.${W}`,where:I,detail:`Point ${W+1} is anchored to card “${L.card}”, which no longer exists — the point falls back to the canvas origin.`,target:N({key:`pt:${W}`,label:`Point ${W+1}`})})}),E({kind:"flow",item:v,screens:pt,ref:M,where:I,base:N(),removal:L=>({kind:"flow",itemId:v.id,key:L})})}),m.forEach((v,T)=>{const O=v.name||v.id||`Virtual ${T+1}`,I=`Virtual Entities › ${O}`,M=`virt:${v.id}`,z={key:`virt:${v.id}`,label:O},N=i.screens("virtual",v),L=_e(N.labels),W=(...D)=>({tab:"elements",panel:"virtuals",path:[z,...D]});(v.inputs??[]).forEach((D,ne)=>{C(D,{ref:M,slot:`inputs.${ne}`,label:`Input ${ne+1}`,where:I,target:W({key:`vin:${ne}`,label:D||`Input ${ne+1}`})})}),C(v.entity,{ref:M,slot:"entity",label:"Source entity",where:I,target:W(L("sec:value"))});const ae=L("sec:tu");C(v.value_entity??v.pct_entity,{ref:M,slot:"value_entity",label:"Value entity",where:I,target:W(ae)}),C(v.rate_entity??v.power_entity,{ref:M,slot:"rate_entity",label:"Rate entity",where:I,target:W(ae)}),C(v.capacity_entity,{ref:M,slot:"capacity_entity",label:"Capacity entity",where:I,target:W(ae)}),E({kind:"virtual",item:v,screens:N,ref:M,where:I,base:W(),removal:D=>({kind:"virtual",itemId:v.id,key:D})})});const ie=e.background;if(ie){const T={ref:"background",where:"Canvas › Background",target:{tab:"settings",panel:"canvas",path:[_e(i.screens("canvas").labels)("sec:bg")]}};ie.source==="state"?ie.rules?.length&&C(ie.entity,{...T,slot:"entity",label:"Background image entity"}):ie.source==="entity"?C(ie.mode_entity,{...T,slot:"mode_entity",label:"Mode entity"}):ie.source!=="day"&&ie.source!=="night"&&ie.source!=="single"&&C(ie.sun_entity,{...T,slot:"sun_entity",label:"Sun entity"})}return e.canvas&&S(e.canvas,{ref:"canvas",where:"Canvas",target:{tab:"settings",panel:"canvas",path:[]}}),{issues:o,skipped:s,coverage:a}}function Qi(e){return e.issues.reduce((t,i)=>t+(i.severity==="error"&&!i.ignored?1:0),0)}var eo=Object.defineProperty,to=Object.getOwnPropertyDescriptor,y=(e,t,i,o)=>{for(var s=o>1?void 0:o?to(t,i):t,a=e.length-1,n;a>=0;a--)(n=e[a])&&(s=(o?n(t,i,s):n(s))||s);return o&&s&&eo(t,i,s),s};const Et=pi(Je);function he(e){return Math.round(e*10)/10}function P(e){return Math.round(e*1e4)/1e4}function V(e,t){const i={...e??{},...t};for(const o of Object.keys(t))t[o]===void 0&&delete i[o];return i}function A(e,t){return t.map(i=>`${e}.${i}`)}function re(e,t){return t.map(i=>`${e}${i}`)}function io(e,t){let i=e;for(const o of t.split(".")){if(i===null||typeof i!="object")return;i=i[o]}return i}function Ke(e,t){if(!t)return 0;let i=0;for(const o of t)io(e,o)!==void 0&&i++;return i}function Re(e,t,i,o,s){const a=(e.split(".")[1]??"sensor").replace(/_/g," "),n=t.replace(/_/g," "),l=["# Add to configuration.yaml","sensor:","  - platform: statistics",`    name: "${a} ${n}"`,`    entity_id: ${e}`,`    state_characteristic: ${t}`];i&&(l.push("    max_age:"),l.push(`      hours: ${i}`)),o&&l.push(`    sampling_size: ${o}`),t==="percentile"&&s&&l.push(`    percentile: ${s}`);const c=`${e.split(".")[1]??"sensor"}_${t}`;return l.push(""),l.push("# Then set the field entity to:"),l.push(`# sensor.${c}`),l.join(`
`)}const qe=[{value:"average_linear",label:"Average (linear)",group:"Averages"},{value:"average_step",label:"Average (step)",group:"Averages",binary:!0},{value:"average_timeless",label:"Average (timeless)",group:"Averages",binary:!0},{value:"mean",label:"Mean",group:"Averages",binary:!0},{value:"mean_circular",label:"Mean (circular)",group:"Averages"},{value:"median",label:"Median",group:"Averages"},{value:"value_max",label:"Value maximum",group:"Extremes"},{value:"value_min",label:"Value minimum",group:"Extremes"},{value:"distance_absolute",label:"Range (max − min)",group:"Extremes"},{value:"standard_deviation",label:"Standard deviation",group:"Spread"},{value:"variance",label:"Variance",group:"Spread"},{value:"noisiness",label:"Noisiness",group:"Spread"},{value:"percentile",label:"Percentile",group:"Spread"},{value:"distance_95_percent_of_values",label:"Distance 95% of values",group:"Spread"},{value:"distance_99_percent_of_values",label:"Distance 99% of values",group:"Spread"},{value:"change",label:"Change",group:"Change"},{value:"change_sample",label:"Change per sample",group:"Change"},{value:"change_second",label:"Change per second",group:"Change"},{value:"sum",label:"Sum",group:"Sums"},{value:"sum_differences",label:"Sum of differences",group:"Sums"},{value:"sum_differences_nonnegative",label:"Sum of differences (positive)",group:"Sums"},{value:"total",label:"Total",group:"Sums"},{value:"count",label:"Count (samples)",group:"Counts",binary:!0},{value:"count_on",label:"Count (on)",group:"Counts",binary:!0},{value:"count_off",label:"Count (off)",group:"Counts",binary:!0},{value:"datetime_newest",label:"Timestamp (newest)",group:"Timestamps"},{value:"datetime_oldest",label:"Timestamp (oldest)",group:"Timestamps",binary:!0},{value:"datetime_value_max",label:"Timestamp (at max)",group:"Timestamps"},{value:"datetime_value_min",label:"Timestamp (at min)",group:"Timestamps"}],Pe=["top-left","top","top-right","left","center","right","bottom-left","bottom","bottom-right"],Ze={"top-left":"Top Left",top:"Top Center","top-right":"Top Right",left:"Left Middle",center:"Center",right:"Right Middle","bottom-left":"Bottom Left",bottom:"Bottom Center","bottom-right":"Bottom Right"},fe=["left","center","right"],Ie={left:"Left",center:"Center",right:"Right"},oo=[{name:"--primary-color",label:"Primary"},{name:"--text-primary-color",label:"Text on Primary"},{name:"--accent-color",label:"Accent"},{name:"--primary-text-color",label:"Primary text"},{name:"--secondary-text-color",label:"Secondary text"},{name:"--disabled-text-color",label:"Disabled text"},{name:"--primary-background-color",label:"Primary background"},{name:"--secondary-background-color",label:"Secondary background"},{name:"--card-background-color",label:"Card background"},{name:"--divider-color",label:"Divider"},{name:"--state-icon-color",label:"State icon"},{name:"--state-active-color",label:"State Active"},{name:"--state-inactive-color",label:"State Inactive"},{name:"--error-color",label:"Error"},{name:"--warning-color",label:"Warning"},{name:"--success-color",label:"Success"},{name:"--info-color",label:"Info"}],Wt=["value","label","icon","svg","blank","rule","embedded_card","toggle","slider","dropdown","button_group","input","spinbox","button"],ge={value:"Value",label:"Label",icon:"Icon",svg:"Element Library",graph:"Graph / Gauge",blank:"Blank",rule:"Horizontal Rule",embedded_card:"Embedded Card",toggle:"Toggle",slider:"Slider",dropdown:"Dropdown",button_group:"Button Group",input:"Input",spinbox:"Spin Box",button:"Button"},Tt=[...Wt].sort((e,t)=>ge[e].localeCompare(ge[t])),ye={value:"mdi:function-variant",label:"mdi:format-title",icon:"mdi:image",svg:"mdi:shape-outline",graph:"mdi:chart-line",blank:"mdi:crop-square-outline",rule:"mdi:minus",embedded_card:"mdi:widgets",toggle:"mdi:toggle-switch-outline",slider:"mdi:tune-variant",dropdown:"mdi:form-dropdown",button_group:"mdi:view-dashboard-variant-outline",input:"mdi:form-textbox",spinbox:"mdi:numeric",button:"mdi:gesture-tap-button"};function Me(e){const t=(...i)=>i.includes(e);return{history:ui.includes(e),stroke:t("stat-line","stat-area","line","area"),range:!t("bar-stacked","state-timeline"),yTitle:t("bar","bar-stacked","stat-line","stat-area","line","area"),bars:t("bar","bar-h"),legend:!0,gauge:t("gauge","gauge-needle"),timeline:t("state-timeline"),statType:!t("state-timeline")}}const so=[{value:"today",group:"Calendar"},{value:"yesterday",group:"Calendar"},{value:"this_week",group:"Calendar"},{value:"last_week",group:"Calendar"},{value:"this_month",group:"Calendar"},{value:"last_month",group:"Calendar"},{value:"this_year",group:"Calendar"},{value:"last_year",group:"Calendar"},{value:"last_30_minutes",group:"Rolling window"},{value:"last_hour",group:"Rolling window"},{value:"last_day",group:"Rolling window"},{value:"last_n_minutes",group:"Rolling window"},{value:"last_n_hours",group:"Rolling window"},{value:"last_n_days",group:"Rolling window"},{value:"last_n_months",group:"Rolling window"}],Ae={auto:"Auto (from the window)","5minute":"5 minutes",hour:"Hour",day:"Day",week:"Week",month:"Month",year:"Year"},ao={last_n_minutes:"Number of minutes",last_n_hours:"Number of hours",last_n_days:"Number of days",last_n_months:"Number of months"},no=[{value:"above",label:"Above the bar"},{value:"left",label:"Left of the bar"},{value:"none",label:"Hidden"}],ro=[{value:"bottom",label:"Below the chart"},{value:"top",label:"Above the chart"},{value:"left",label:"Left of the chart"},{value:"right",label:"Right of the chart"}],lo=[{value:"linear",label:"Straight"},{value:"smooth",label:"Smoothed"},{value:"step",label:"Stepped"}],Xe=[{value:"stat-line",label:"Statistics — Line"},{value:"stat-area",label:"Statistics — Line (Stacked)"},{value:"bar",label:"Statistics — Bar"},{value:"bar-h",label:"Statistics — Bar (horizontal)"},{value:"bar-stacked",label:"Statistics — Bar (stacked)"},{value:"line",label:"History — Line (with unit)"},{value:"area",label:"History — Line Stacked"},{value:"state-timeline",label:"History — State timeline"},{value:"gauge",label:"Arc Gauge"},{value:"gauge-needle",label:"Arc Gauge (Needle)"}],ue="background gradient angle opacity color border width radius padding shadow drop box halo glow type offset spread blur css",xe="font size color weight family letter spacing css",Oe="tap hold double navigate url more info toggle service action perform assist popover expand dom event entity write override",Ut="entity operator value condition show hide visible",co="Raw CSS declarations applied to this element, e.g. outline: 1px dashed red;. Applied after everything above, so it wins.",nt="tick minor major length thickness font size position grid line color temperature transparency opacity decimals value",H={tick_color:"Colour of the scale marks beside the tube.",tick_position:"Which side of the tube the scale sits on.",minor_tick_text:"Numbers the small ticks as well as the major ones.",tick_font_size:"Size of the numbers beside the ticks.",grid_color:"Colour of the lines running across the tube from each major tick. Leave blank for none.",decimals:"Decimal places on the temperature reading.",temp_color:"Colour of the temperature reading. Leave blank to follow the fill colour."},se=["background","background_alpha","background2","background_angle","color","border","border_width","radius","padding","shadow","shadow_mode","shadow_x","shadow_y","shadow_blur","shadow_spread","shadow_color","extra_css","blur"],ce=["font_size","color","font_weight","font_family","letter_spacing","extra_css"],ho=se.filter(e=>e!=="extra_css"),po=ce.filter(e=>e!=="extra_css"),zt=!1,ct=["tap_action","hold_action","double_tap_action"],uo=["icon_position","show_state","state_position","icon_style","label_style","state_style"],le={"sub:container":{sel:["button_group_text_size","button_group_icon_size","button_group_state_size"],btn:["button_border_color","button_border_width","button_radius","button_option_padding","button_text_size","button_icon_size","button_state_size"]},"sub:active":{sel:["button_group_selected_color","button_group_selected_color2","button_group_selected_angle","button_group_selected_text_color","button_group_selected_icon_color","button_group_selected_state_color"],btn:["button_selected_color","button_selected_color2","button_selected_angle","button_selected_text_color","button_selected_icon_color","button_selected_state_color"]},"sub:inactive":{sel:["button_group_bg","button_group_bg2","button_group_bg_angle","button_group_text_color","button_group_icon_color","button_group_state_color"],btn:["button_bg","button_bg2","button_bg_angle","button_text_color","button_icon_color","button_state_color"]}},dt=["button_group_option_gap","button_group_border_color","button_group_border_width","button_group_radius","button_group_option_padding","button_group_option_border","button_group_option_border_color","button_group_option_border_width","button_group_option_radius","button_group_option_extra_css"],ht=["button_option_padding"],_o=le["sub:container"].btn.filter(e=>!ht.includes(e)),Vt=["major_tick_length","major_tick_width","minor_tick_length","minor_tick_width","show_minor_tick_text","tick_color","tick_font_size","text_position","grid_color","temp_color","temp_font_size","decimals","fill_opacity_above"],Rt=[...Vt,"fill_color","fill_color2","fill_angle","extra_css"],Fe=["fill_color","fill_color2","fill_angle","fill_direction","tank_color","extra_css"],Pt=["fill_color","fill_color2","fill_angle","extra_css"],It="Blank runs the gradient along the fill direction. An SVG that defines its own gradient stops keeps its own direction — the angle only applies to gradients the card draws.",pe={accent:["accent_color","accent_color2","accent_angle"],toggle:["toggle_on_color","toggle_on_color2","toggle_on_angle","toggle_off_color","toggle_off_color2","toggle_off_angle","toggle_thumb_color","toggle_thumb_size","toggle_thumb_radius","toggle_thumb_padding","toggle_thumb_shadow"],slider:["slider_track_color","slider_track_color2","slider_track_angle","slider_fill_color","slider_fill_color2","slider_fill_angle","slider_height","slider_length","slider_radius","slider_border","slider_border_color","slider_border_width","slider_thumb_color","slider_thumb_size","slider_thumb_width","slider_thumb_radius","slider_thumb_padding","slider_thumb_shadow"],dropdown:["dropdown_border_color","dropdown_bg","dropdown_bg2","dropdown_bg_angle","dropdown_menu_bg","dropdown_menu_bg2","dropdown_menu_bg_angle","dropdown_menu_border_color","dropdown_selected_color","dropdown_selected_color2","dropdown_selected_angle","dropdown_radius","dropdown_text_size","dropdown_menu_radius","dropdown_menu_shadow","dropdown_option_radius","dropdown_option_text_color","dropdown_option_hover_color"],input:["input_border_color","input_bg","input_bg2","input_bg_angle","input_focus_color","input_placeholder_color","input_radius","input_text_size"],spinbox:["spinbox_border_color","spinbox_bg","spinbox_bg2","spinbox_bg_angle","spinbox_button_hover_color","spinbox_button_hover_color2","spinbox_button_hover_angle","spinbox_button_width","spinbox_button_font_size","spinbox_radius","spinbox_text_size"]},go=[{type:"alarm-panel",name:"Alarm Panel"},{type:"button",name:"Button"},{type:"calendar",name:"Calendar"},{type:"entities",name:"Entities"},{type:"entity",name:"Entity"},{type:"entity-filter",name:"Entity Filter"},{type:"gauge",name:"Gauge"},{type:"glance",name:"Glance"},{type:"history-graph",name:"History Graph"},{type:"horizontal-stack",name:"Horizontal Stack"},{type:"humidifier",name:"Humidifier"},{type:"iframe",name:"iFrame"},{type:"light",name:"Light"},{type:"logbook",name:"Logbook"},{type:"map",name:"Map"},{type:"markdown",name:"Markdown"},{type:"media-control",name:"Media Control"},{type:"picture",name:"Picture"},{type:"picture-elements",name:"Picture Elements"},{type:"picture-entity",name:"Picture Entity"},{type:"picture-glance",name:"Picture Glance"},{type:"plant-status",name:"Plant Status"},{type:"sensor",name:"Sensor"},{type:"shopping-list",name:"Shopping List"},{type:"statistics-graph",name:"Statistics Graph"},{type:"thermostat",name:"Thermostat"},{type:"tile",name:"Tile"},{type:"todo-list",name:"To-do List"},{type:"vertical-stack",name:"Vertical Stack"},{type:"weather-forecast",name:"Weather Forecast"},{type:"webpage",name:"Webpage"}];function mo(e){const t=(e??"").trim(),i=t.match(/^color-mix\(\s*in\s+srgb\s*,\s*(.+?)\s+([\d.]+)%\s*,\s*transparent\s*\)$/i);if(i)return{base:i[1].trim(),alpha:Math.max(0,Math.min(1,Number(i[2])/100))};const o=t.match(/^#([0-9a-f]{6})([0-9a-f]{2})$/i);if(o)return{base:`#${o[1]}`,alpha:parseInt(o[2],16)/255};const s=t.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*[,/]\s*([\d.]+)\s*\)$/i);return s?{base:"#"+[s[1],s[2],s[3]].map(n=>Math.max(0,Math.min(255,Math.round(Number(n)))).toString(16).padStart(2,"0")).join(""),alpha:Math.max(0,Math.min(1,Number(s[4])))}:{base:t,alpha:1}}function Mt(e,t){return t>=1?e:`color-mix(in srgb, ${e} ${Number((t*100).toFixed(1))}%, transparent)`}function bo(e,t){const i=t?.isConnected?t:document.body,o=document.createElement("div");try{o.style.color=e,o.style.display="none",i.appendChild(o);const a=getComputedStyle(o).color.match(/\d+/g)?.map(Number);return!a||a.length<3?"#000000":"#"+a.slice(0,3).map(n=>n.toString(16).padStart(2,"0")).join("")}catch{return"#000000"}finally{o.remove()}}let p=class extends qt{constructor(){super(...arguments),this._selCard=0,this._selField=-1,this._selCards=new Set,this._selEmbCards=new Set,this._selFlow=-1,this._showAddFlowInput=!1,this._newFlowName="",this._pendingFlowIdx=-1,this._showFlowCompleteModal=!1,this._selPoint=-1,this._selSeries=-1,this._selOption=-1,this._selBgRule=-1,this._selCanvasBgRule=-1,this._pickerLib=[],this._pickerTrail=[],this._pickerErr="",this._selExtOption=-1,this._selExtSeries=-1,this._selVirtual=-1,this._selVirtualInput=-1,this._selTrigger=-1,this._selZone=-1,this._selExtCard=0,this._selExtField=-1,this._templateName="",this._templateIncludeEntities=!1,this._templateError="",this._previewBoxes={},this._previewExpanded=!1,this._barAtTop=localStorage.getItem("mc-expanded-bar-top")==="1",this._wasPreviewExpanded=!1,this._wasShowAddFlowInput=!1,this._onWindowResize=()=>this._sizeExpandedCanvas(),this._pickerStyleScheduled=!1,this._pickerStyleRetries=0,this._styledPickers=new WeakSet,this._mccustApplied=[],this._copiedFields=null,this._copySourceId=null,this._virtualClipboard=null,this._copiedField=null,this._copiedFieldSrc=null,this._copiedOption=null,this._dragSrc=null,this._cpOpenId=null,this._cpPos=null,this._cpFocusedId=null,this._ggOpen=!1,this._ggTarget=null,this._wizStep=-1,this._wiz={cardType:"",source:"auto",sunEntity:"sun.sun",dayImg:"",nightImg:"",evCount:0,evImgs:[],bgCount:"single",bgSwitchMode:"sun",bgEntity:"",singleImg:"",bgStateEntity:"",bgRules:[]},this._wizardShown=!1,this._oneOwnerChecked=!1,this._dragCard=-1,this._startX=0,this._startY=0,this._dragMembers=[],this._embDragMembers=[],this._dragPoint=-1,this._pStartX=0,this._pStartY=0,this._pStartPos={x:0,y:0},this._snapAxis=null,this._snapAnchor=null,this._dragZone=-1,this._zStartX=0,this._zStartY=0,this._zStartPos={x:0,y:0},this._resizeZone=-1,this._resizeCorner="br",this._zResizeStartBox={x:0,y:0,w:0,h:0},this._bgSelected=!1,this._bgMode=null,this._bgStartX=0,this._bgStartY=0,this._bgStart={L:0,T:0,baseW:0,baseH:0,totalW:0,totalH:0},this._selEmbCard=-1,this._dragEmbCard=-1,this._ecStartX=0,this._ecStartY=0,this._embEditorOpen=!1,this._embEditorYaml="",this._embEditorYamlError="",this._embNativeEditor=null,this._embEditorTarget=null,this._embEditorConfig=null,this._embPickerOpen=!1,this._embPickerSearch="",this._embPickerTarget=null,this._variantOpen="",this._variantError="",this._saveVariantFor="",this._saveVariantLabel="",this._variantImportError="",this._navTab="cards",this._navPanel="",this._navPath=[],this._panelScroll=new Map,this._lastScrollKey="",this._lastScrollDepth=0,this._listFilter="",this._listFilterKey="",this._undoStack=[],this._redoStack=[],this._undoSrc=null,this._undoLastPush=0,this._restoring=!1,this._onUndoKeydown=e=>{if(!(e.ctrlKey||e.metaKey)||e.altKey)return;const t=e.key.toLowerCase(),i=t==="z"&&!e.shiftKey,o=t==="y"||t==="z"&&e.shiftKey;if(!i&&!o)return;const s=e.composedPath()[0];if(s instanceof HTMLElement){const a=s.tagName;if(a==="INPUT"||a==="TEXTAREA"||a==="SELECT"||s.isContentEditable)return}e.preventDefault(),e.stopPropagation(),i?this._undo():this._redo()},this._toastMsg="",this._tutorialStep=-1,this._ptrDrag=null,this._dropKey=null,this._dropBefore=!1,this._suppressClick=!1,this._searchQuery="",this._searchActive=0,this._healthShowIgnored=!1,this._optionLayoutOn=new Set,this._colorOverridesOn=new Set,this._gradientOn=new Set,this._resetToWizard=()=>{window.confirm(`Reset all configuration and restart the setup wizard?

This will clear all cards, popover cards, embedded cards, virtuals, flows, zones, and background settings.

It also resets Global Defaults to their starting values — including your saved custom control variants — and clears the popover card defaults and EV count.`)&&(this._wiz={cardType:"",source:"auto",sunEntity:"sun.sun",dayImg:"",nightImg:"",evCount:0,evImgs:[],bgCount:"single",bgSwitchMode:"sun",bgEntity:"",singleImg:"",bgStateEntity:"",bgRules:[]},this._wizStep=0,this._emit({type:this._config.type,background:{},canvas:{},defaults:{font_family:"sans-serif",card:{background:"rgba(8,18,28,0.55)",border:!0,color:"#00d4ff",radius:10,padding:8},label:{font_size:13,color:"#cccccc"},value:{font_size:22,color:"#ffffff",font_weight:600}},cards:[]}))},this._cpMode="rgb"}_navPush(e,t,i){this._navPath=[...this._navPath,{key:e,label:t,...i?{hint:i}:{}}]}_crumbIndex(e,t){if(!t)return-1;const i=e.slice(e.indexOf(":")+1),o=t.findIndex(a=>{const n=a&&typeof a=="object"?a.id:void 0;return n!==void 0&&String(n)===i});if(o>=0)return o;const s=Number(i);return Number.isInteger(s)&&s>=0&&s<t.length?s:-1}_navScrollKey(){return`${this._navTab}|${this._navPanel}|${this._navPath.map(e=>e.key).join("/")}`}_navDeadEnd(e="This item no longer exists — it may have been removed in the YAML editor."){return r`
      <ha-alert alert-type="warning">${e}</ha-alert>
      <button class="ec-btn-add" style="margin-top:10px;" @click=${()=>this._navBack()}>← Back</button>
    `}_currentListFilter(){return this._listFilterKey===this._navScrollKey()?this._listFilter.trim().toLowerCase():""}_listFilterBox(e){return e<=7&&!this._currentListFilter()?u:r`
      <input class="ec-input ec-list-filter" type="search" placeholder="Filter…"
        .value=${this._listFilterKey===this._navScrollKey()?this._listFilter:""}
        @input=${t=>{this._listFilterKey=this._navScrollKey(),this._listFilter=t.target.value}}
      />
    `}_emptyAdd(e,t){return r`<button class="ec-empty ec-empty-action" @click=${t}>${e}</button>`}setConfig(e){this._assertOneOwnerInvariant();let t=!1;const i=(n,l)=>{let c=!1;const d=n.map((h,_)=>{const m={};h.column==null&&(m.column=1),h.id||(m.id=`mc-auto-${l}f${_}`);const g=di(h);return g&&Object.assign(m,g),Object.keys(m).length===0?h:(t=!0,c=!0,{...h,...m})});return c?d:n},o=(n,l)=>n.id?n:(t=!0,{...n,id:l}),s=(e.cards??[]).map((n,l)=>{const c=o(n,`mc-auto-card${l}`),d=i(c.fields,`card${l}-`);return d===c.fields?c:{...c,fields:d}}),a=(e.extended_cards??[]).map((n,l)=>{const c=o(n,`mc-auto-ext${l}`),d=i(c.fields,`ext${l}-`);return d===c.fields?c:{...c,fields:d}});if(t&&(e={...e,cards:s,...e.extended_cards?{extended_cards:a}:{}}),this._config&&e!==this._lastEmitted&&(this._config===this._lastEmitted?this._lastEmittedJson??=JSON.stringify(this._config):JSON.stringify(this._config))!==JSON.stringify(e)&&this._pushUndo(this._config,"external"),this._config=e,Ge(e.defaults?.control_variants),this._truncateStaleNavPath(),!this._wizardShown){this._wizardShown=!0;const n=e.background,l=!n?.images?.day&&!n?.images?.night&&!n?.url&&!n?.rules?.length,c=(e.cards??[]).length===0;l&&c&&(this._wizStep=0)}}_truncateStaleNavPath(){const e=this._config;if(!e)return;const t=this._navPanel;let i=-1,o=-1,s=-1,a=-1;const n={card:{list:()=>t==="popover"?this._extCards():e.cards??[],select:d=>{i=d,t==="popover"?this._selExtCard=d:this._selCard=d}},field:{list:()=>i<0?[]:(t==="popover"?this._extCards()[i]?.fields:e.cards?.[i]?.fields)??[],select:d=>{o=d,t==="popover"?this._selExtField=d:this._selField=d}},gs:{list:()=>i>=0&&o>=0?e.cards?.[i]?.fields[o]?.graph_series??[]:[],select:d=>{this._selSeries=d}},egs:{list:()=>i>=0&&o>=0?this._extCards()[i]?.fields[o]?.graph_series??[]:[],select:d=>{this._selExtSeries=d}},opt:{list:()=>i>=0&&o>=0?e.cards?.[i]?.fields[o]?.options??[]:[],select:d=>{this._selOption=d}},eopt:{list:()=>i>=0&&o>=0?this._extCards()[i]?.fields[o]?.options??[]:[],select:d=>{this._selExtOption=d}},bgr:{list:()=>i>=0?e.cards?.[i]?.bg?.rules??[]:[],select:d=>{this._selBgRule=d}},cbgr:{list:()=>e.background?.rules??[],select:d=>{this._selCanvasBgRule=d}},emb:{list:()=>this._embCards(),select:d=>{this._selEmbCard=d}},virt:{list:()=>this._virtuals(),select:d=>{s=d,this._selVirtual=d}},vin:{list:()=>s>=0?this._virtuals()[s]?.inputs??[]:[],select:d=>{this._selVirtualInput=d}},trig:{list:()=>s>=0?this._virtuals()[s]?.triggers??[]:[],select:d=>{this._selTrigger=d}},zone:{list:()=>this._zones(),select:d=>{this._selZone=d}},flow:{list:()=>this._flows(),select:d=>{a=d,this._selFlow=d}},pt:{list:()=>a>=0?this._flows()[a]?.points??[]:[],select:d=>{this._selPoint=d}}};let l=this._navPath.length;for(let d=0;d<this._navPath.length;d++){const h=this._navPath[d].key,_=h.indexOf(":"),m=_>0?h.slice(0,_):h,g=n[m];if(!g)continue;const f=this._crumbIndex(h,g.list());if(f<0){l=d;break}g.select(f)}l<this._navPath.length&&(this._navPath=this._navPath.slice(0,l));const c=(d,h)=>Math.min(d,h-1);this._selCard=c(this._selCard,e.cards?.length??0),this._selExtCard=c(this._selExtCard,this._extCards().length),this._selEmbCard=c(this._selEmbCard,this._embCards().length),this._selVirtual=c(this._selVirtual,this._virtuals().length),this._selZone=c(this._selZone,this._zones().length),this._selFlow=c(this._selFlow,this._flows().length)}_navigateTo(e,t,i=[]){this._navTab=e,this._navPanel=t,this._navPath=i.map(o=>({key:o.key,label:o.label??o.key.slice(o.key.indexOf(":")+1),...o.hint?{hint:o.hint}:{}})),this._selField=-1,this._selExtField=-1,this._selSeries=-1,this._selExtSeries=-1,this._selPoint=-1,this._selVirtualInput=-1,this._selTrigger=-1,this._truncateStaleNavPath()}_emit(e){const t=this._config;t&&t!==e&&!this._restoring&&this._pushUndo(t),this._config=e,this._lastEmitted=e,this._lastEmittedJson=void 0,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e},bubbles:!0,composed:!0}))}_cloneCfg(e){return typeof structuredClone=="function"?structuredClone(e):JSON.parse(JSON.stringify(e))}_undoEmitSource(){if(this._dragCard>=0)return`drag:card:${this._dragCard}:${this._startX},${this._startY}`;if(this._dragEmbCard>=0)return`drag:emb:${this._dragEmbCard}:${this._ecStartX},${this._ecStartY}`;if(this._dragZone>=0)return`drag:zone:${this._dragZone}:${this._zStartX},${this._zStartY}`;if(this._resizeZone>=0)return`resize:zone:${this._resizeZone}:${this._resizeCorner}:${this._zResizeStartBox.x},${this._zResizeStartBox.y}`;if(this._dragPoint>=0)return`drag:pt:${this._dragPoint}:${this._pStartX},${this._pStartY}`;if(this._bgMode)return`drag:bg:${this._bgMode}:${this._bgStartX},${this._bgStartY}`;const e=this.shadowRoot?.activeElement??null;return e?e.tagName==="BUTTON"?e.classList.contains("ec-num-step")?e:null:e:null}static _isGestureKey(e){return typeof e=="string"&&(e.startsWith("drag:")||e.startsWith("resize:"))}_endUndoGesture(){p._isGestureKey(this._undoSrc)&&(this._undoSrc=null)}_pushUndo(e,t){this._toastMsg="";const i=Date.now(),o=t??this._undoEmitSource(),s=o!==null&&o===this._undoSrc&&(p._isGestureKey(o)||i-this._undoLastPush<p._UNDO_COALESCE_MS);this._undoSrc=o,this._undoLastPush=i,s||(this._undoStack.push(this._cloneCfg(e)),this._undoStack.length>p._UNDO_LIMIT&&this._undoStack.shift()),this._redoStack=[]}_undo(){this._restore(this._undoStack,this._redoStack)}_redo(){this._restore(this._redoStack,this._undoStack)}_restore(e,t){const i=this._config;if(!e.length||!i)return;const o=e.pop();t.push(this._cloneCfg(i)),t.length>p._UNDO_LIMIT&&t.shift(),this._applySnapshot(o)}_applySnapshot(e){this._restoring=!0;try{this._emit(e)}finally{this._restoring=!1}this._undoSrc=null,this._toastMsg="",this._truncateStaleNavPath()}_showUndoToast(e){this._toastMsg=e,clearTimeout(this._toastTimer),this._toastTimer=window.setTimeout(()=>{this._toastMsg=""},6e3)}_renderUndoToast(){return this._toastMsg?r`
      <div class="ec-undo-toast" role="status">
        <span>${this._toastMsg}</span>
        <button class="ec-undo-toast-btn" ?disabled=${!this._undoStack.length} @click=${()=>this._undo()}>Undo</button>
      </div>
    `:u}_finishWizard(){if(!this._config)return;const e=this._wiz;let t;if(e.cardType==="energy"){if(e.source!=="none"){t={source:e.source},e.source==="auto"&&(t.sun_entity=e.sunEntity||"sun.sun");const o={},s={};e.dayImg&&(o[0]=e.dayImg),e.nightImg&&e.source==="auto"&&(s[0]=e.nightImg);for(let a=0;a<e.evCount;a++){const n=e.evImgs[a];n?.day&&(o[String(a+1)]=n.day),n?.night&&e.source==="auto"&&(s[String(a+1)]=n.night)}t.images={},Object.keys(o).length>0&&(t.images.day=o),Object.keys(s).length>0&&(t.images.night=s)}}else if(e.bgCount==="single"&&e.singleImg)t={source:"single",url:e.singleImg};else if(e.bgCount==="state"){const o=e.bgRules.filter(s=>s.value.trim()&&s.url.trim()).map(s=>({value:s.value.trim(),url:s.url.trim()}));t={source:"state",entity:e.bgStateEntity||void 0},o.length&&(t.rules=o)}else if(e.bgCount==="multiple"){t=e.bgSwitchMode==="sun"?{source:"auto",sun_entity:e.sunEntity||"sun.sun"}:{source:"entity",mode_entity:e.bgEntity};const o={},s={};e.dayImg&&(o[0]=e.dayImg),e.nightImg&&(s[0]=e.nightImg),t.images={},Object.keys(o).length>0&&(t.images.day=o),Object.keys(s).length>0&&(t.images.night=s)}const i={...this._config};t&&(i.background=t),e.cardType==="energy"&&e.evCount>0&&(i.ev_count=e.evCount),this._wizStep=-1,this._emit(i),this._tutorialGo(0)}_tutorialGo(e){const t=p._TUTORIAL_STEPS;if(e<0||e>=t.length){this._tutorialStep=-1;return}const i=t[e].nav;this._navigateTo(i.tab,i.panel,i.path??[]),this._tutorialStep=e}_renderTutorial(){const e=p._TUTORIAL_STEPS,t=this._tutorialStep;if(t<0||t>=e.length)return u;const i=t===e.length-1;return r`
      <div class="ec-tour" role="dialog" aria-label="Editor tour">
        <div class="ec-tour-head">
          <span class="ec-tour-title">${e[t].title}</span>
          <span class="ec-tour-count">${t+1} / ${e.length}</span>
        </div>
        <p class="ec-tour-body">${e[t].body}</p>
        <div class="ec-tour-btns">
          <button class="ec-wiz-btn-ghost" @click=${()=>{this._tutorialStep=-1}}>Cancel</button>
          <span class="ec-tour-spacer"></span>
          ${t>0?r`<button class="ec-wiz-btn-ghost" @click=${()=>this._tutorialGo(t-1)}>← Back</button>`:u}
          <button class="ec-wiz-btn-primary" @click=${()=>i?this._tutorialStep=-1:this._tutorialGo(t+1)}>
            ${i?"Done":"Next →"}
          </button>
        </div>
      </div>
    `}_renderWizard(){const e=this._wizStep,t=this._wiz,i=l=>{this._wiz={...t,...l}},o=l=>{this._wizStep=l},s=(l,c)=>c===0?l==="day"?t.dayImg:t.nightImg:t.evImgs[c-1]?.[l]??"",a=(l,c,d)=>{if(c===0){i(l==="day"?{dayImg:d}:{nightImg:d});return}i({evImgs:t.evImgs.map((h,_)=>_===c-1?{...h,[l]:d}:h)})},n=l=>{const c=Math.max(0,Math.min(3,parseInt(l.target.value)||0));c!==t.evCount&&i({evCount:c,evImgs:Array.from({length:c},(d,h)=>t.evImgs[h]??{day:"",night:""})})};return r`
      <div class="ec-wizard">
        ${e===0?r`
          <div class="ec-wiz-welcome">
            <div class="ec-wiz-icon">🎨</div>
            <h2 class="ec-wiz-title">Welcome to Mosaic Canvas Card</h2>
            <p class="ec-wiz-desc">A few quick questions will tailor the setup to your use case — or skip to jump straight into the editor.</p>
            <div class="ec-wiz-row ec-wiz-end">
              <button class="ec-wiz-btn-ghost" @click=${()=>this._finishWizard()}>Skip setup</button>
              <button class="ec-wiz-btn-primary" @click=${()=>o(1)}>Get started →</button>
            </div>
          </div>

        `:e===1?r`
          <h3 class="ec-wiz-heading">What will this card be used for?</h3>
          <p class="ec-wiz-desc">This determines what setup options you'll be asked about.</p>
          <div class="ec-wiz-type-grid">
            <button class="ec-wiz-type-btn${t.cardType==="energy"?" selected":""}"
              @click=${()=>i({cardType:"energy"})}>
              <span class="ec-wiz-type-icon">⚡</span>
              <span class="ec-wiz-type-title">Energy Dashboard</span>
              <span class="ec-wiz-type-desc">Solar, battery, grid flows with day/night switching and EV variants</span>
            </button>
            <button class="ec-wiz-type-btn${t.cardType==="general"?" selected":""}"
              @click=${()=>i({cardType:"general"})}>
              <span class="ec-wiz-type-icon">🗺️</span>
              <span class="ec-wiz-type-title">General Purpose</span>
              <span class="ec-wiz-type-desc">Any layout over a background image — floor plan, status board, custom display</span>
            </button>
          </div>
          <div class="ec-wiz-row ec-wiz-space">
            <button class="ec-wiz-btn-ghost" @click=${()=>o(0)}>← Back</button>
            <button class="ec-wiz-btn-primary" ?disabled=${!t.cardType}
              @click=${()=>o(t.cardType==="energy"?2:20)}>Next →</button>
          </div>

        `:e===2?r`
          <h3 class="ec-wiz-heading">Background</h3>
          <div class="ec-wiz-field">
            <label class="ec-wiz-label">Day/night switching</label>
            <select class="ec-wiz-select" .value=${t.source}
              @change=${l=>i({source:l.target.value})}>
              <option value="auto">Auto — follows sun entity</option>
              <option value="day">Day only — no switching</option>
              <option value="none">No background image</option>
            </select>
          </div>
          ${t.source==="auto"?r`
            <div class="ec-wiz-field">
              <label class="ec-wiz-label">Sun entity</label>
              <ha-entity-picker .hass=${this.hass} .value=${t.sunEntity} allow-custom-entity
                @value-changed=${l=>i({sunEntity:l.detail.value})}
              ></ha-entity-picker>
            </div>
          `:u}
          ${t.source==="none"?u:r`
            <div class="ec-wiz-field">
              <label class="ec-wiz-label">EV count (0 = no EV variants)</label>
              ${this._numWrap(r`<input class="ec-input ec-input-num" type="number" min="0" max="3"
                  .value=${String(t.evCount)}
                  @input=${n} @change=${n}
                />`)}
            </div>

            <h3 class="ec-wiz-heading">Images</h3>
            <p class="ec-wiz-desc">One Day${t.source==="auto"?" and one Night":""} image per EV variant — raising EV count adds rows.</p>

            ${["day","night"].filter(l=>l==="day"||t.source==="auto").map(l=>r`
                  <div class="ec-wiz-ev-label">${l}</div>
                  ${Array.from({length:t.evCount+1},(c,d)=>r`
                    <div class="ec-wiz-field">
                      <label class="ec-wiz-label">${l} / ${d} EV</label>
                      <div style="display:flex;gap:4px;align-items:center;">
                        <input class="ec-wiz-input" type="text" style="flex:1;min-width:0;"
                          .placeholder=${`/local/energy-${l}${d?`-${d}ev`:""}.jpg`}
                          .value=${s(l,d)}
                          @input=${h=>a(l,d,h.target.value)}/>
                        ${this._imagePickBtn(h=>a(l,d,h))}
                      </div>
                    </div>
                  `)}
                `)}
          `}
          <div class="ec-wiz-row ec-wiz-space">
            <button class="ec-wiz-btn-ghost" @click=${()=>o(1)}>← Back</button>
            <button class="ec-wiz-btn-primary" @click=${()=>this._finishWizard()}>Finish &amp; open editor</button>
          </div>

        `:e===20?r`
          <h3 class="ec-wiz-heading">Background images</h3>
          <p class="ec-wiz-desc">Do you want a background image on this card?</p>
          <div class="ec-wiz-type-grid">
            <button class="ec-wiz-type-btn${t.bgCount==="none"?" selected":""}"
              @click=${()=>i({bgCount:"none"})}>
              <span class="ec-wiz-type-icon">⬜</span>
              <span class="ec-wiz-type-title">No background</span>
              <span class="ec-wiz-type-desc">Cards float over a plain or transparent background</span>
            </button>
            <button class="ec-wiz-type-btn${t.bgCount==="single"?" selected":""}"
              @click=${()=>i({bgCount:"single"})}>
              <span class="ec-wiz-type-icon">🖼️</span>
              <span class="ec-wiz-type-title">One image</span>
              <span class="ec-wiz-type-desc">A single static background image</span>
            </button>
            <button class="ec-wiz-type-btn${t.bgCount==="multiple"?" selected":""}"
              @click=${()=>i({bgCount:"multiple"})}>
              <span class="ec-wiz-type-icon">🔄</span>
              <span class="ec-wiz-type-title">Day / Night</span>
              <span class="ec-wiz-type-desc">Two images, swapped by the sun or by an entity</span>
            </button>
            <button class="ec-wiz-type-btn${t.bgCount==="state"?" selected":""}"
              @click=${()=>i({bgCount:"state",bgRules:t.bgRules.length?t.bgRules:[{value:"",url:""}]})}>
              <span class="ec-wiz-type-icon">🎛️</span>
              <span class="ec-wiz-type-title">Image by state</span>
              <span class="ec-wiz-type-desc">One image per state of an entity you choose</span>
            </button>
          </div>
          <div class="ec-wiz-row ec-wiz-space">
            <button class="ec-wiz-btn-ghost" @click=${()=>o(1)}>← Back</button>
            <button class="ec-wiz-btn-primary"
              @click=${()=>{t.bgCount==="none"?this._finishWizard():t.bgCount==="single"?o(21):t.bgCount==="state"?o(23):o(22)}}>Next →</button>
          </div>

        `:e===21?r`
          <h3 class="ec-wiz-heading">Background image</h3>
          <div class="ec-wiz-field">
            <label class="ec-wiz-label">Image URL</label>
            <div style="display:flex;gap:4px;align-items:center;">
              <input class="ec-wiz-input" type="text" placeholder="/local/my-background.jpg" style="flex:1;min-width:0;"
                .value=${t.singleImg} @input=${l=>i({singleImg:l.target.value})}/>
              ${this._imagePickBtn(l=>i({singleImg:l}))}
            </div>
          </div>
          <div class="ec-wiz-row ec-wiz-space">
            <button class="ec-wiz-btn-ghost" @click=${()=>o(20)}>← Back</button>
            <button class="ec-wiz-btn-primary" @click=${()=>this._finishWizard()}>Finish &amp; open editor</button>
          </div>

        `:e===22?r`
          <h3 class="ec-wiz-heading">Multiple backgrounds</h3>
          <div class="ec-wiz-field">
            <label class="ec-wiz-label">When should the image change?</label>
            <select class="ec-wiz-select" .value=${t.bgSwitchMode}
              @change=${l=>i({bgSwitchMode:l.target.value})}>
              <option value="sun">Time of day — follows the sun (day/night)</option>
              <option value="entity">Entity state — switches when an entity changes</option>
            </select>
          </div>
          ${t.bgSwitchMode==="sun"?r`
            <div class="ec-wiz-field">
              <label class="ec-wiz-label">Sun entity</label>
              <ha-entity-picker .hass=${this.hass} .value=${t.sunEntity} allow-custom-entity
                @value-changed=${l=>i({sunEntity:l.detail.value})}
              ></ha-entity-picker>
            </div>
          `:r`
            <div class="ec-wiz-field">
              <label class="ec-wiz-label">Trigger entity</label>
              <ha-entity-picker .hass=${this.hass} .value=${t.bgEntity} allow-custom-entity
                @value-changed=${l=>i({bgEntity:l.detail.value})}
              ></ha-entity-picker>
            </div>
            <p class="ec-wiz-desc" style="font-size:11px;margin-top:-4px;">Alternate image shows when entity state is "on", "night", or "true".</p>
          `}
          <div class="ec-wiz-field">
            <label class="ec-wiz-label">${t.bgSwitchMode==="sun"?"Day":"Main"} image URL</label>
            <input class="ec-wiz-input" type="text" placeholder="/local/background-main.jpg"
              .value=${t.dayImg} @input=${l=>i({dayImg:l.target.value})}/>
          </div>
          <div class="ec-wiz-field">
            <label class="ec-wiz-label">${t.bgSwitchMode==="sun"?"Night":"Alternate"} image URL</label>
            <input class="ec-wiz-input" type="text" placeholder="/local/background-alt.jpg"
              .value=${t.nightImg} @input=${l=>i({nightImg:l.target.value})}/>
          </div>
          <div class="ec-wiz-row ec-wiz-space">
            <button class="ec-wiz-btn-ghost" @click=${()=>o(20)}>← Back</button>
            <button class="ec-wiz-btn-primary" @click=${()=>this._finishWizard()}>Finish &amp; open editor</button>
          </div>

        `:e===23?r`
          <h3 class="ec-wiz-heading">Image by state</h3>
          <p class="ec-wiz-desc">Pick the entity that decides the background, then pair each state you care about with an image. A state with no rule shows no background.</p>
          <div class="ec-wiz-field">
            <label class="ec-wiz-label">Entity</label>
            <ha-entity-picker .hass=${this.hass} .value=${t.bgStateEntity} allow-custom-entity
              @value-changed=${l=>i({bgStateEntity:l.detail.value})}
            ></ha-entity-picker>
          </div>
          ${t.bgRules.map((l,c)=>r`
            <div class="ec-wiz-field">
              <label class="ec-wiz-label">When the state is…</label>
              <input class="ec-wiz-input" type="text" placeholder="e.g. on, 21, heat"
                .value=${l.value}
                @input=${d=>i({bgRules:t.bgRules.map((h,_)=>_===c?{...h,value:d.target.value}:h)})}/>
              <div style="display:flex;gap:4px;align-items:center;margin-top:4px;">
                <input class="ec-wiz-input" type="text" placeholder="/local/my-background.jpg" style="flex:1;min-width:0;"
                  .value=${l.url}
                  @input=${d=>i({bgRules:t.bgRules.map((h,_)=>_===c?{...h,url:d.target.value}:h)})}/>
                ${this._imagePickBtn(d=>i({bgRules:t.bgRules.map((h,_)=>_===c?{...h,url:d}:h)}))}
                <button class="ec-btn-remove" title="Remove"
                  @click=${()=>i({bgRules:t.bgRules.filter((d,h)=>h!==c)})}>✕</button>
              </div>
            </div>
          `)}
          <button class="ec-btn-add" @click=${()=>i({bgRules:[...t.bgRules,{value:"",url:""}]})}>+ Image</button>
          <div class="ec-wiz-row ec-wiz-space">
            <button class="ec-wiz-btn-ghost" @click=${()=>o(20)}>← Back</button>
            <button class="ec-wiz-btn-primary" @click=${()=>this._finishWizard()}>Finish &amp; open editor</button>
          </div>

        `:u}
        ${this._renderImagePickerModal()}
      </div>
    `}_updateCard(e,t){if(!this._config)return;const i=this._config.cards.map((o,s)=>s===e?V(o,t):o);this._emit({...this._config,cards:i})}_updateCardBox(e,t){if(!this._config)return;const i=this._config.cards[e];i&&this._updateCard(e,{box:V(i.box??{},t)})}_updateField(e,t,i){if(!this._config)return;const o=this._config.cards[e];if(!o)return;const s=o.fields.map((a,n)=>n===t?V(a,i):a);this._updateCard(e,{fields:s})}_updateDefaults(e){this._config&&this._emit({...this._config,defaults:V(this._config.defaults,e)})}_updateCanvas(e){this._config&&this._emit({...this._config,canvas:V(this._config.canvas,e)})}_gridGeom(){const e=this._config?.canvas;if(e?.layout_mode!=="grid"||!e.grid)return null;const{totalW:t,totalH:i}=te(this._config),o=Math.max(1,e.grid.columns||1),s=Math.max(1,e.grid.rows||1),a=e.grid.padding??0;return{cols:o,rows:s,padding:a,cellW:t/o,cellH:i/s,totalW:t,totalH:i}}_setLayoutMode(e){if(!this._config)return;const t={...this._config.canvas??{}};if(t.layout_mode=e,e==="grid"){t.grid||(t.grid={columns:10,rows:15,padding:0});const i=Math.max(1,t.grid.columns),o=Math.max(1,t.grid.rows),s=t.grid.padding??0,{totalW:a}=te(this._config),n=a/i,l=this._config.cards.map(h=>{const _=this._previewBoxes[h.id],m=_?_.x+_.w/2:h.position.x,g=_?_.y+_.h/2:h.position.y,f=Math.min(i,Math.max(0,Math.round(m*i))),$=Math.min(o,Math.max(0,Math.round(g*o))),R=h.grid_span??Math.max(1,Math.min(i,Math.round((_?.w??0)*i)||1)),k=Math.max(8,R*n-s);return{...h,anchor:"center",grid_span:R,width:k,position:{x:P(f/i),y:P($/o)}}}),c=this._embCards().map(h=>{const _=this._previewBoxes[h.id],m=_?_.x+_.w/2:h.position.x,g=_?_.y+_.h/2:h.position.y,f=Math.min(i,Math.max(0,Math.round(m*i))),$=Math.min(o,Math.max(0,Math.round(g*o))),R=h.grid_span??Math.max(1,Math.min(i,Math.round((_?.w??0)*i)||1)),k=Math.max(8,R*n-s);return{...h,anchor:"center",grid_span:R,width:k,position:{x:P(f/i),y:P($/o)}}});this._emit({...this._config,canvas:t,cards:l,embedded_cards:c});const d=l.length+c.length;d&&this._showUndoToast(`${d} card${d===1?"":"s"} re-laid out for Grid`)}else this._emit({...this._config,canvas:t})}_renderGridOverlay(){const e=this._gridGeom();if(!e)return u;const{cols:t,rows:i}=e,o=[];for(let s=0;s<=t;s++)for(let a=0;a<=i;a++)o.push(r`<div class="ec-grid-dot" style="left:${s/t*100}%;top:${a/i*100}%;"></div>`);return r`<div class="ec-grid-overlay">${o}</div>`}_renderBgOverlay(){if(!this._config)return u;const e=te(this._config),t=e.L/e.totalW*100,i=e.T/e.totalH*100,o=e.baseW/e.totalW*100,s=e.baseH/e.totalH*100;return r`
      <div class="ec-bg-ov${this._bgSelected?" selected":""}"
        style="left:${t}%;top:${i}%;width:${o}%;height:${s}%;"
        @pointerdown=${a=>this._onBgDown(a,"move")}
        title="Background image — drag to move, corners to resize">
        ${this._bgSelected?["tl","tr","bl","br"].map(a=>r`
          <div class="ec-bg-resize ec-bg-resize-${a}"
            @pointerdown=${n=>this._onBgDown(n,a)}></div>`):u}
      </div>`}_updateBackground(e){this._config&&this._emit({...this._config,background:V(this._config.background,e)})}_flows(){return this._config?.flows??[]}_updateFlow(e,t){if(!this._config)return;const i=this._flows().map((o,s)=>s===e?V(o,t):o);this._emit({...this._config,flows:i})}_addFlow(){if(!this._config)return;const e={id:"flow-"+Date.now().toString(36),name:"Flow",style:"dashes",points:[{x:.4,y:.5},{x:.6,y:.5}]},t=[...this._flows(),e];this._selFlow=t.length-1,this._selPoint=-1,this._emit({...this._config,flows:t})}_addFlowFromExpanded(){if(!this._config)return;const e=this._newFlowName.trim()||"Flow",t={id:"flow-"+Date.now().toString(36),name:e,style:"dashes",points:[{x:.4,y:.5},{x:.6,y:.5}]},i=[...this._flows(),t];this._selFlow=i.length-1,this._pendingFlowIdx=i.length-1,this._selPoint=-1,this._showAddFlowInput=!1,this._newFlowName="",this._emit({...this._config,flows:i})}_collapseExpanded(){this._pendingFlowIdx>=0?this._showFlowCompleteModal=!0:this._previewExpanded=!1}_goToFlow(){const e=this._pendingFlowIdx;this._showFlowCompleteModal=!1,this._previewExpanded=!1,this._pendingFlowIdx=-1;const t=this._flows()[e];this._selFlow=t?e:-1,this._navigateTo("elements","flows",t?[{key:`flow:${t.id}`,label:t.name??t.id}]:[])}_removeFlow(e){if(!this._config)return;const t=this._flows().filter((i,o)=>o!==e);this._selFlow=Math.min(this._selFlow,Math.max(0,t.length-1)),t.length===0&&(this._selFlow=-1),this._selPoint=-1,this._emit({...this._config,flows:t}),this._showUndoToast("Flow removed")}_duplicateFlow(e){if(!this._config)return;const t=this._flows()[e];if(!t)return;const i=p._deepClone(t);i.id=p._newId("flow"),i.name&&(i.name+=" copy");const o=[...this._flows()];o.splice(e+1,0,i),this._selFlow=e+1,this._selPoint=-1,this._emit({...this._config,flows:o})}_updateFlowPoint(e,t,i){if(!this._config)return;const o=this._flows().map((s,a)=>{if(a!==e)return s;const n=s.points.map((l,c)=>c===t?V(l,i):l);return{...s,points:n}});this._emit({...this._config,flows:o})}_setPointKind(e,t,i){if(!this._config)return;const o=this._flows(),s=o[e];if(!s)return;const a=s.points[t];if(!a)return;const{dx:n,dy:l}=a;let c;if(i==="card")c={card:this._config.cards[0]?.id??"",side:"center",...n!=null?{dx:n}:{},...l!=null?{dy:l}:{}};else{const h=me({...a,dx:void 0,dy:void 0},this._config.cards,this._previewBoxes);c={x:P(h.x),y:P(h.y),...n!=null?{dx:n}:{},...l!=null?{dy:l}:{}}}const d=o.map((h,_)=>{if(_!==e)return h;const m=h.points.map((g,f)=>f===t?c:g);return{...h,points:m}});this._emit({...this._config,flows:d})}_addFlowPoint(e){if(!this._config)return;const t=this._flows().map((i,o)=>o!==e?i:{...i,points:[...i.points,{x:0,y:0}]});this._emit({...this._config,flows:t})}_onFlowLayerClick(e){if(e.target!==e.currentTarget||!this._config)return;const t=this._flows(),i=t[this._selFlow];if(!i)return;const o=e.currentTarget,s=P(e.offsetX/o.clientWidth),a=P(e.offsetY/o.clientHeight),n=[...i.points],l=this._selPoint>=0?this._selPoint:n.length-1;n.splice(l+1,0,{x:s,y:a});const c=t.map((d,h)=>h===this._selFlow?{...d,points:n}:d);this._selPoint=l+1,this._emit({...this._config,flows:c})}_removeFlowPoint(e,t){if(!this._config)return;const i=this._flows().map((o,s)=>{if(s!==e)return o;const a=o.points.filter((n,l)=>l!==t);return{...o,points:a}});if(e===this._selFlow&&this._selPoint>=0){const o=i[e]?.points.length??0;this._selPoint=Math.min(this._selPoint>t?this._selPoint-1:this._selPoint,o-1)}this._emit({...this._config,flows:i}),this._showUndoToast("Point removed")}_duplicateFlowPoint(e,t){if(!this._config)return;const i=this._flows()[e],o=i?.points[t];if(!i||!o)return;const s=[...i.points];s.splice(t+1,0,p._deepClone(o)),e===this._selFlow&&(this._selPoint=t+1);const a=this._flows().map((n,l)=>l===e?{...n,points:s}:n);this._emit({...this._config,flows:a})}_virtuals(){return this._config?.virtuals??[]}_addVirtual(){if(!this._config)return;const t={id:`v${Date.now()}`,name:"New virtual",op:"add",inputs:[]},i=[...this._virtuals(),t];this._selVirtual=i.length-1,this._emit({...this._config,virtuals:i})}_updateVirtual(e,t){if(!this._config)return;const i=this._virtuals().map((o,s)=>s===e?V(o,t):o);this._emit({...this._config,virtuals:i})}_removeVirtual(e){if(!this._config)return;const t=this._virtuals().filter((i,o)=>o!==e);this._selVirtual=Math.min(this._selVirtual,t.length-1),this._emit({...this._config,virtuals:t}),this._showUndoToast("Virtual entity removed")}_duplicateVirtual(e){if(!this._config)return;const t=this._virtuals()[e];if(!t)return;const i=p._deepClone(t);i.id=p._newId("v"),i.name&&(i.name+=" copy");const o=[...this._virtuals()];o.splice(e+1,0,i),this._selVirtual=e+1,this._emit({...this._config,virtuals:o})}_addVirtualInput(e){if(!this._config)return;const t=[...this._virtuals()[e]?.inputs??[],""];this._updateVirtual(e,{inputs:t})}_updateVirtualInput(e,t,i){const o=[...this._virtuals()[e]?.inputs??[]];o[t]=i,this._updateVirtual(e,{inputs:o})}_removeVirtualInput(e,t){const i=(this._virtuals()[e]?.inputs??[]).filter((o,s)=>s!==t);this._selVirtualInput>=0&&(this._selVirtualInput=Math.min(this._selVirtualInput>t?this._selVirtualInput-1:this._selVirtualInput,i.length-1)),this._updateVirtual(e,{inputs:i}),this._showUndoToast("Input removed")}_duplicateVirtualInput(e,t){const i=this._virtuals()[e];if(!i||i.inputs[t]===void 0)return;const o=[...i.inputs];o.splice(t+1,0,i.inputs[t]),this._selVirtualInput=t+1,this._updateVirtual(e,{inputs:o})}_duplicateTrigger(e,t){const i=this._virtuals()[e],o=i?.triggers?.[t];if(!i||!o)return;const s=p._deepClone(o);s.label&&(s.label+=" copy");const a=[...i.triggers??[]];a.splice(t+1,0,s),this._selTrigger=t+1,this._updateVirtual(e,{triggers:a})}_copyVirtual(e){const t=this._virtuals()[e];t&&(this._virtualClipboard={...t})}_pasteVirtual(){if(!this._config||!this._virtualClipboard)return;const e={...this._virtualClipboard,id:`v${Date.now()}`},t=[...this._virtuals(),e];this._selVirtual=t.length-1,this._emit({...this._config,virtuals:t})}_zones(){return this._config?.zones??[]}_addZone(){if(!this._config)return;const e={id:"zone-"+Date.now().toString(36),name:"Zone",position:{x:.5,y:.5},anchor:"center",width:120,height:70},t=[...this._zones(),e];this._selZone=t.length-1,this._emit({...this._config,zones:t})}_updateZone(e,t){if(!this._config)return;const i=this._zones().map((o,s)=>s===e?V(o,t):o);this._emit({...this._config,zones:i})}_removeZone(e){if(!this._config)return;const t=this._zones().filter((i,o)=>o!==e);this._selZone=Math.min(this._selZone,t.length-1),t.length===0&&(this._selZone=-1),this._emit({...this._config,zones:t}),this._showUndoToast("Zone removed")}_duplicateZone(e){if(!this._config)return;const t=this._zones()[e];if(!t)return;const i=p._deepClone(t);i.id=p._newId("zone"),i.name&&(i.name+=" copy");const o=[...this._zones()];o.splice(e+1,0,i),this._selZone=e+1,this._emit({...this._config,zones:o})}_onZoneDown(e,t){e.preventDefault(),e.stopPropagation(),this._bgSelected=!1,this._selZone=t,this._syncNavTo("elements","zones",[{key:`zone:${this._zones()[t]?.id??t}`,label:this._zones()[t]?.name??this._zones()[t]?.id??`Zone ${t+1}`}]),this._dragZone=t,e.target.setPointerCapture(e.pointerId),this._zRect=this.renderRoot.querySelector(".ec-canvas-area").getBoundingClientRect(),this._zStartX=e.clientX,this._zStartY=e.clientY,this._zStartPos={...this._zones()[t]?.position??{x:0,y:0}}}_onZoneMove(e){if(this._dragZone<0||!this._zRect||!this._config)return;const t=P(this._zStartPos.x+(e.clientX-this._zStartX)/this._zRect.width),i=P(this._zStartPos.y+(e.clientY-this._zStartY)/this._zRect.height);this._updateZone(this._dragZone,{position:{x:t,y:i}})}_onZoneUp(e){this._dragZone>=0&&e.target.releasePointerCapture(e.pointerId),this._dragZone=-1}_zoneBox(e){const[t,i]=ke[e.anchor??b("anchor")??"top-left"],{totalW:o,totalH:s}=te(this._config);return{x:e.position.x*o-t*e.width,y:e.position.y*s-i*e.height,w:e.width,h:e.height}}_onZoneResizeDown(e,t,i){e.preventDefault(),e.stopPropagation();const o=this._zones()[t];o&&(this._selZone=t,this._resizeZone=t,this._resizeCorner=i,e.target.setPointerCapture(e.pointerId),this._zRect=this.renderRoot.querySelector(".ec-canvas-area").getBoundingClientRect(),this._zStartX=e.clientX,this._zStartY=e.clientY,this._zResizeStartBox=this._zoneBox(o))}_onZoneResizeMove(e){if(this._resizeZone<0||!this._zRect||!this._config)return;const t=this._zones()[this._resizeZone];if(!t)return;const{totalW:i,totalH:o}=te(this._config),s=(e.clientX-this._zStartX)/this._zRect.width*i,a=(e.clientY-this._zStartY)/this._zRect.height*o,n=this._zResizeStartBox,l=10,c=this._resizeCorner.includes("l")?n.x+n.w:n.x,d=this._resizeCorner.includes("t")?n.y+n.h:n.y,h=this._resizeCorner.includes("l")?n.x:n.x+n.w,_=this._resizeCorner.includes("t")?n.y:n.y+n.h;let m=h+s-c,g=_+a-d;const f=m>=0?1:-1,$=g>=0?1:-1;m=Math.max(l,Math.abs(m))*f,g=Math.max(l,Math.abs(g))*$;const R=f>=0?c:c+m,k=$>=0?d:d+g,x=Math.abs(m),C=Math.abs(g),[S,E]=ke[t.anchor??b("anchor")??"top-left"],F={x:P((R+S*x)/i),y:P((k+E*C)/o)};this._updateZone(this._resizeZone,{width:he(x),height:he(C),position:F})}_onZoneResizeUp(e){this._resizeZone>=0&&e.target.releasePointerCapture(e.pointerId),this._resizeZone=-1}_onBgDown(e,t){e.preventDefault(),e.stopPropagation(),this._bgSelected=!0,this._bgMode=t,e.target.setPointerCapture(e.pointerId),this._bgRect=this.renderRoot.querySelector(".ec-canvas-area").getBoundingClientRect(),this._bgStartX=e.clientX,this._bgStartY=e.clientY;const i=te(this._config);this._bgStart={L:i.L,T:i.T,baseW:i.baseW,baseH:i.baseH,totalW:i.totalW,totalH:i.totalH}}_onBgMove(e){if(!this._bgMode||!this._bgRect||!this._config)return;const t=this._bgStart,i=(e.clientX-this._bgStartX)/this._bgRect.width*t.totalW,o=(e.clientY-this._bgStartY)/this._bgRect.height*t.totalH,s=this._gridGeom(),a=(g,f)=>Math.round(g/f)*f,n=20;let l,c,d,h;if(this._bgMode==="move")d=t.baseW,h=t.baseH,l=Math.min(Math.max(0,t.L+i),t.totalW-d),c=Math.min(Math.max(0,t.T+o),t.totalH-h),s&&(l=Math.min(Math.max(0,a(l,s.cellW)),t.totalW-d),c=Math.min(Math.max(0,a(c,s.cellH)),t.totalH-h));else{const g=this._bgMode.includes("l"),f=this._bgMode.includes("t"),$=g?-i:i,R=f?-o:o;let k=Math.abs($)/t.baseW>=Math.abs(R)/t.baseH?(t.baseW+$)/t.baseW:(t.baseH+R)/t.baseH;const x=g?t.L+t.baseW:t.totalW-t.L,C=f?t.T+t.baseH:t.totalH-t.T,S=Math.min(x/t.baseW,C/t.baseH),E=Math.max(n/t.baseW,n/t.baseH);k=Math.min(Math.max(k,E),S),d=t.baseW*k,h=t.baseH*k,l=g?t.L+t.baseW-d:t.L,c=f?t.T+t.baseH-h:t.T,s&&(d=Math.min(t.totalW,Math.max(s.cellW,a(d,s.cellW))),h=Math.min(t.totalH,d*(t.baseH/t.baseW)),l=g?t.L+t.baseW-d:t.L,c=f?t.T+t.baseH-h:t.T,l=Math.min(Math.max(0,a(l,s.cellW)),t.totalW-d),c=Math.min(Math.max(0,a(c,s.cellH)),t.totalH-h))}const _=t.totalW-d-l,m=t.totalH-h-c;this._updateCanvas({width:he(d),height:he(h),extend:{left:l>.5?he(l):void 0,top:c>.5?he(c):void 0,right:_>.5?he(_):void 0,bottom:m>.5?he(m):void 0}})}_onBgUp(e){this._bgMode&&e.target.releasePointerCapture(e.pointerId),this._bgMode=null}_embCards(){return this._config?.embedded_cards??[]}_addEmbCard(){if(!this._config)return;const e={id:"emb-"+Date.now().toString(36),name:"Embedded Card",position:{x:.5,y:.5},anchor:"center",width:200,card_config:{}},t=this._gridGeom();if(t){const{cols:o,rows:s,cellW:a,padding:n}=t,l=Math.round(o/2),c=Math.round(s/2),d=Math.max(1,Math.min(o,2));e.grid_span=d,e.width=Math.max(8,d*a-n),e.position={x:P(l/o),y:P(c/s)}}const i=[...this._embCards(),e];this._selEmbCard=i.length-1,this._emit({...this._config,embedded_cards:i})}_updateEmbCard(e,t){if(!this._config)return;const i=this._embCards().map((o,s)=>s===e?V(o,t):o);this._emit({...this._config,embedded_cards:i})}_updateEmbCardBox(e,t){const i=this._embCards()[e];i&&this._updateEmbCard(e,{box:V(i.box??{},t)})}_removeEmbCard(e){if(!this._config)return;const t=this._embCards().filter((i,o)=>o!==e);this._selEmbCard=Math.min(this._selEmbCard,t.length-1),t.length===0&&(this._selEmbCard=-1),this._selEmbCards=new Set([...this._selEmbCards].filter(i=>i!==e).map(i=>i>e?i-1:i)),this._emit({...this._config,embedded_cards:t}),this._showUndoToast("Embedded card removed")}_duplicateEmbCard(e){if(!this._config)return;const t=this._embCards()[e];if(!t)return;const i=p._deepClone(t);i.id=p._newId("emb"),i.name&&(i.name+=" copy");const o=[...this._embCards()];o.splice(e+1,0,i),this._selEmbCard=e+1,this._selEmbCards=new Set([e+1]),this._emit({...this._config,embedded_cards:o})}_onEmbCardDown(e,t){if(e.preventDefault(),e.stopPropagation(),this._bgSelected=!1,this._selEmbCard=t,this._syncNavTo("cards","embedded",[{key:`emb:${this._embCards()[t]?.id??t}`,label:this._embCards()[t]?.name??this._embCards()[t]?.id??`Embedded ${t+1}`}]),e.shiftKey||e.ctrlKey||e.metaKey){const a=new Set(this._selEmbCards);a.has(t)?a.delete(t):a.add(t),this._selEmbCards=a;return}const i=this._embCards(),o=i[t]?.group,s=o?i.map((a,n)=>({ec:a,i:n})).filter(({ec:a})=>a.group===o).map(({i:a})=>a):[t];if(this._selEmbCards=new Set(s),this._dragEmbCard=t,e.target.setPointerCapture(e.pointerId),this._ecRect=this.renderRoot.querySelector(".ec-canvas-area").getBoundingClientRect(),this._ecStartX=e.clientX,this._ecStartY=e.clientY,this._embDragMembers=s.map(a=>({idx:a,start:{...i[a]?.position??{x:0,y:0}}})),o){const a=this._config?.cards??[],n=a.map((l,c)=>({c:l,i:c})).filter(({c:l})=>l.group===o).map(({i:l})=>l);this._selCards=new Set(n),this._dragCard=n[0]??-1,this._hostRect=this.renderRoot.querySelector(".ec-canvas-area").getBoundingClientRect(),this._startX=e.clientX,this._startY=e.clientY,this._dragMembers=n.map(l=>({idx:l,start:{...a[l]?.position??{x:0,y:0}}}))}else this._selCards=new Set,this._dragCard=-1,this._dragMembers=[]}_onEmbCardMove(e){if(this._dragEmbCard<0||!this._ecRect||!this._config)return;const t=(e.clientX-this._ecStartX)/this._ecRect.width,i=(e.clientY-this._ecStartY)/this._ecRect.height,o=this._embCards().map((a,n)=>{const l=this._embDragMembers.find(c=>c.idx===n);return l?{...a,position:{x:P(l.start.x+t),y:P(l.start.y+i)}}:a}),s=this._dragMembers.length>0?this._config.cards.map((a,n)=>{const l=this._dragMembers.find(c=>c.idx===n);return l?{...a,position:{x:P(l.start.x+t),y:P(l.start.y+i)}}:a}):this._config.cards;this._emit({...this._config,cards:s,embedded_cards:o})}_onEmbCardUp(e){this._dragEmbCard>=0&&e.target.releasePointerCapture(e.pointerId),this._dragEmbCard=-1}_embConfig(e){return e.kind==="std"?this._embCards()[e.idx]?.card_config:e.kind==="field"?this._config?.cards[e.ci]?.fields[e.fi]?.embed_card_config:this._extCards()[e.ci]?.fields[e.fi]?.embed_card_config}_embSetConfig(e,t){if(e.kind==="std"){this._updateEmbCard(e.idx,{card_config:t});return}if(e.kind==="field"){this._updateField(e.ci,e.fi,{embed_card_config:t});return}this._updateExtField(e.ci,e.fi,{embed_card_config:t})}async _openEmbEditor(e){this._embEditorTarget=e;const t=this._embConfig(e)??{};this._embEditorYaml=JSON.stringify(t,null,2),this._embNativeEditor=null;const i=String(t?.type??"");if(i)try{const o=await window.loadCardHelpers?.();if(o?.createCardElement)try{o.createCardElement(t)}catch{}const s=i.startsWith("custom:")?i.slice(7):`hui-${i}-card`;await Promise.race([customElements.whenDefined(s),new Promise(c=>setTimeout(c,5e3))]);const a=customElements.get(s);let n={...t};if(a?.getStubConfig)try{const c=Object.keys(this.hass?.states??{}),d=await a.getStubConfig(this.hass,c,c);d&&typeof d=="object"&&(n={...d,...n})}catch{}if(this._embEditorConfig=n,await Promise.race([customElements.whenDefined("hui-card-element-editor"),new Promise(c=>setTimeout(c,3e3))]),customElements.get("hui-card-element-editor")){const c=document.createElement("hui-card-element-editor");c.hass=this.hass,c.value=n,c.addEventListener("config-changed",d=>{d.stopPropagation();const h=d.detail;h?.config&&this._embEditorTarget&&this._embSetConfig(this._embEditorTarget,h.config)}),this._embNativeEditor=c}else{const c=a?.getConfigElement;if(c){const d=await c.call(a);if(d){try{d.setConfig?.(n)}catch{}d.hass=this.hass,d.addEventListener("config-changed",h=>{h.stopPropagation();const _=h.detail;_?.config&&this._embEditorTarget&&this._embSetConfig(this._embEditorTarget,_.config)}),this._embNativeEditor=d}}}}catch(o){console.warn("[mc-editor] native editor unavailable:",o)}this._embEditorOpen=!0}_closeEmbEditor(){this._embEditorOpen=!1,this._embEditorTarget=null,this._embNativeEditor=null,this._embEditorConfig=null,this._embEditorYamlError=""}_saveEmbEditorYaml(){if(this._embEditorTarget)try{const e=JSON.parse(this._embEditorYaml);this._embSetConfig(this._embEditorTarget,e),this._closeEmbEditor()}catch(e){this._embEditorYamlError="Invalid JSON: "+e.message}}async _openEmbPicker(e){this._embPickerTarget=e,this._embPickerSearch="",this._embPickerOpen=!0}async _pickEmbCardType(e){this._embPickerOpen=!1,this._embPickerSearch="";const t=this._embPickerTarget;if(!t)return;const i={...this._embConfig(t)??{},type:e};this._embSetConfig(t,i),await this._openEmbEditor(t)}_setBgImage(e,t,i){if(!this._config)return;const o=this._config.background??{},s={...o.images?.[e]??{}};i===""?delete s[t]:s[t]=i,this._updateBackground({images:{...o.images,[e]:s}})}_addCard(){if(!this._config)return;const e={id:"card-"+Date.now().toString(36),name:"Card",position:{x:.5,y:.5},anchor:"center",align:"center",fields:[]},t=this._gridGeom();if(t){const{cols:o,rows:s,cellW:a,padding:n}=t,l=Math.round(o/2),c=Math.round(s/2),d=Math.max(1,Math.min(o,2));e.grid_span=d,e.width=Math.max(8,d*a-n),e.position={x:P(l/o),y:P(c/s)}}const i=[...this._config.cards,e];this._selCard=i.length-1,this._selField=-1,this._emit({...this._config,cards:i})}_removeCard(e){if(!this._config)return;const t=this._config.cards.filter((i,o)=>o!==e);this._selCard=Math.min(this._selCard,Math.max(0,t.length-1)),this._selField=-1,this._selCards=new Set(Array.from(this._selCards).filter(i=>i!==e).map(i=>i>e?i-1:i)),this._emit({...this._config,cards:t}),this._showUndoToast("Card removed")}static _newId(e){return e+"-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,6)}static _deepClone(e){return JSON.parse(JSON.stringify(e))}_duplicateCard(e){if(!this._config)return;const t=this._config.cards[e];if(!t)return;const i=p._deepClone(t);i.id=p._newId("card"),i.fields=i.fields.map(s=>({...s,id:p._newId("f")})),i.name&&(i.name+=" copy");const o=[...this._config.cards];o.splice(e+1,0,i),this._selCard=e+1,this._selField=-1,this._selCards=new Set([e+1]),this._emit({...this._config,cards:o})}_copyFields(e){const t=this._config?.cards[e];t&&(this._copiedFields=t.fields.map(i=>({...i})),this._copySourceId=t.id)}_pasteFields(e){if(!this._copiedFields||!this._config)return;const t=this._copiedFields.map(o=>({...o,id:p._newId("f")})),i=this._config.cards.map((o,s)=>s===e?{...o,fields:[...o.fields,...t]}:o);this._emit({...this._config,cards:i})}_copyField(e,t,i=!1){const s=(i?this._extCards():this._config?.cards??[])[e],a=s?.fields[t];!s||!a||(this._copiedField={...a},this._copiedFieldSrc={isExt:i,cardId:s.id,fieldId:a.id})}_pasteField(e,t=!1){if(!this._copiedField||!this._config)return;const i={...this._copiedField,id:p._newId("f")};if(t){const o=this._extCards()[e];if(!o)return;this._selExtField=o.fields.length,this._updateExtCard(e,{fields:[...o.fields,i]})}else{const o=this._config.cards[e];if(!o)return;const s=[...o.fields,i],a=this._config.cards.map((n,l)=>l===e?{...n,fields:s}:n);this._selField=s.length-1,this._emit({...this._config,cards:a})}}_duplicateField(e,t,i=!1){if(!this._config)return;const o=i?this._extCards()[e]:this._config.cards[e],s=o?.fields[t];if(!o||!s)return;const a=p._deepClone(s);a.id=p._newId("f"),a.display_name&&(a.display_name+=" copy");const n=[...o.fields];n.splice(t+1,0,a),i?(this._selExtField=t+1,this._updateExtCard(e,{fields:n})):(this._selField=t+1,this._updateCard(e,{fields:n}))}_updSeries(e,t,i,o,s,a=!1){const n=[...o.graph_series??[]];n[i]&&(n[i]={...n[i],...s},this._updFor(e,t,a)({graph_series:n}))}_duplicateGraphSeries(e,t,i,o){const a=(o?this._extCards()[e]:this._config?.cards[e])?.fields[t],n=a?.graph_series?.[i];if(!a||!n)return;const l=p._deepClone(n);l.label&&(l.label+=" copy");const c=[...a.graph_series??[]];c.splice(i+1,0,l),o?this._selExtSeries=i+1:this._selSeries=i+1,this._updFor(e,t,o)({graph_series:c})}_addField(e){if(!this._config)return;const t=this._config.cards[e];if(!t)return;const i={id:"f-"+Date.now().toString(36),type:"value",column:1},o=[...t.fields,i];this._selField=o.length-1,this._updateCard(e,{fields:o})}_removeField(e,t){if(!this._config)return;const i=this._config.cards[e];if(!i)return;const o=i.fields.filter((s,a)=>a!==t);this._selField>=o.length&&(this._selField=o.length-1),this._updateCard(e,{fields:o}),this._showUndoToast("Field removed")}_extCards(){return this._config?.extended_cards??[]}_updateExtDefaults(e){this._config&&this._emit({...this._config,extended_card_defaults:V(this._config.extended_card_defaults??{},e)})}_addExtCard(){if(!this._config)return;const e={id:"ext-"+Date.now().toString(36),name:"Popover Card",columns:2,fields:[]},t=[...this._extCards(),e];this._selExtCard=t.length-1,this._selExtField=-1,this._emit({...this._config,extended_cards:t})}_removeExtCard(e){if(!this._config)return;const t=this._extCards().filter((i,o)=>o!==e);this._selExtCard=Math.min(this._selExtCard,Math.max(0,t.length-1)),this._selExtField=-1,this._emit({...this._config,extended_cards:t}),this._showUndoToast("Popover card removed")}_duplicateExtCard(e){if(!this._config)return;const t=this._extCards()[e];if(!t)return;const i=p._deepClone(t);i.id=p._newId("ext"),i.fields=i.fields.map(s=>({...s,id:p._newId("f")})),i.name&&(i.name+=" copy");const o=[...this._extCards()];o.splice(e+1,0,i),this._selExtCard=e+1,this._selExtField=-1,this._emit({...this._config,extended_cards:o})}_updateExtCard(e,t){if(!this._config)return;const i=this._extCards().map((o,s)=>s===e?V(o,t):o);this._emit({...this._config,extended_cards:i})}_updateExtCardBox(e,t){const i=this._extCards()[e];i&&this._updateExtCard(e,{box:V(i.box??{},t)})}_addExtField(e){if(!this._config)return;const t=this._extCards()[e];if(!t)return;const i={id:"f-"+Date.now().toString(36),type:"value",column:1},o=[...t.fields,i];this._selExtField=o.length-1,this._updateExtCard(e,{fields:o})}_removeExtField(e,t){const i=this._extCards()[e];if(!i)return;const o=i.fields.filter((s,a)=>a!==t);this._selExtField>=o.length&&(this._selExtField=o.length-1),this._updateExtCard(e,{fields:o}),this._showUndoToast("Field removed")}_stepNumInput(e,t){e.preventDefault();const o=e.currentTarget.closest(".ec-num-wrap")?.querySelector("input");if(o){try{t>0?o.stepUp():o.stepDown()}catch{const s=Number(o.step)||1,a=Number(o.value)||0;o.value=String(a+t*s)}o.dispatchEvent(new Event("change",{bubbles:!0}))}}_numWrap(e){return r`<span class="ec-num-wrap">${e}<span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`}_numInput(e){return this._numWrap(r`<input class="ec-input ec-input-num" type="number"
      min=${e.min??u} max=${e.max??u} step=${e.step??u}
      placeholder=${e.placeholder??u} title=${e.title??u}
      .value=${e.value!=null?String(e.value):""}
      @change=${t=>{const i=t.target.value;e.onChange(i===""?void 0:Number(i))}}
    />`)}_numRow(e,t){return this._row(e,this._numInput(t),t.hint)}_reorderArray(e,t,i,o){const s=[...e],[a]=s.splice(t,1),n=t<i?o?i-1:i:o?i:i+1;return s.splice(n,0,a),{arr:s,target:n}}_remapSelectionAfterMove(e,t,i){if(t===i||e.size===0)return e;const o=new Set;for(const s of e)s===t?o.add(i):t<i&&s>t&&s<=i?o.add(s-1):t>i&&s>=i&&s<t?o.add(s+1):o.add(s);return o}_moveCard(e,t,i){if(!this._config)return;const{arr:o,target:s}=this._reorderArray(this._config.cards,e,t,i);this._selCard=s,this._selCards=this._remapSelectionAfterMove(this._selCards,e,s),this._emit({...this._config,cards:o})}_moveExtCard(e,t,i){if(!this._config)return;const{arr:o,target:s}=this._reorderArray(this._extCards(),e,t,i);this._selExtCard=s,this._emit({...this._config,extended_cards:o})}_moveVirtual(e,t,i){if(!this._config)return;const{arr:o,target:s}=this._reorderArray(this._virtuals(),e,t,i);this._selVirtual=s,this._emit({...this._config,virtuals:o})}_moveZone(e,t,i){if(!this._config)return;const{arr:o,target:s}=this._reorderArray(this._zones(),e,t,i);this._selZone=s,this._emit({...this._config,zones:o})}_moveFlow(e,t,i){if(!this._config)return;const{arr:o,target:s}=this._reorderArray(this._flows(),e,t,i);this._selFlow=s,this._emit({...this._config,flows:o})}_moveEmbCard(e,t,i){if(!this._config)return;const{arr:o,target:s}=this._reorderArray(this._embCards(),e,t,i);this._selEmbCard=s,this._selEmbCards=this._remapSelectionAfterMove(this._selEmbCards,e,s),this._emit({...this._config,embedded_cards:o})}_movePoint(e,t,i,o){if(!this._config)return;const s=this._flows()[e];if(!s)return;const{arr:a,target:n}=this._reorderArray(s.points,t,i,o);this._selPoint=n,this._updateFlow(e,{points:a})}_moveVirtualInput(e,t,i,o){if(!this._config)return;const s=this._virtuals()[e];if(!s)return;const{arr:a,target:n}=this._reorderArray(s.inputs,t,i,o);this._selVirtualInput=n,this._updateVirtual(e,{inputs:a})}_moveTrigger(e,t,i,o){if(!this._config)return;const s=this._virtuals()[e];if(!s)return;const{arr:a,target:n}=this._reorderArray(s.triggers??[],t,i,o);this._selTrigger=n,this._updateVirtual(e,{triggers:a})}_moveOption(e,t,i,o,s,a){const n=a?this._extCards()[e]?.fields[t]:this._config?.cards[e]?.fields[t];if(!n)return;const{arr:l,target:c}=this._reorderArray(n.options??[],i,o,s);a?this._selExtOption=c:this._selOption=c,this._updFor(e,t,a)({options:l})}_moveTuItem(e,t,i,o,s,a){const n=a?this._extCards()[e]?.fields[t]:this._config?.cards[e]?.fields[t];if(!n)return;const{arr:l}=this._reorderArray(n.time_until_layout??[],i,o,s);this._updFor(e,t,a)({time_until_layout:l})}_moveGraphSeries(e,t,i,o,s){const a=this._config?.cards[e]?.fields[t];if(!a)return;const{arr:n,target:l}=this._reorderArray(a.graph_series??[],i,o,s);this._selSeries=l,this._updateField(e,t,{graph_series:n})}_moveExtGraphSeries(e,t,i,o,s){const a=this._extCards()[e]?.fields[t];if(!a)return;const{arr:n,target:l}=this._reorderArray(a.graph_series??[],i,o,s);this._selExtSeries=l,this._updateExtField(e,t,{graph_series:n})}_moveField(e,t,i,o){if(!this._config)return;const s=this._config.cards[e];if(!s)return;const{arr:a,target:n}=this._reorderArray(s.fields,t,i,o);this._selField=n,this._updateCard(e,{fields:a})}_moveExtField(e,t,i,o){const s=this._extCards()[e];if(!s)return;const{arr:a,target:n}=this._reorderArray(s.fields,t,i,o);this._selExtField=n,this._updateExtCard(e,{fields:a})}_onItemPointerDown(e,t){if(this._suppressClick=!1,e.button!==0)return;const i=e.target;if(i.closest(".ec-item-card-actions"))return;const o=!!i.closest(".ec-drag-handle");if(e.pointerType!=="mouse"&&!o)return;const s=e.currentTarget,n=[...t.split(":").slice(0,-1),""].join(":"),l=[...this.renderRoot.querySelectorAll(`[data-drag-key^="${n}"]`)];if(!(l.length<2)){try{s.setPointerCapture(e.pointerId)}catch{}this._ptrDrag={key:t,pointerId:e.pointerId,row:s,siblings:l,scroller:s.closest(".ec-panel-body"),startY:e.clientY,lastY:e.clientY,active:!1,raf:0},o&&(this._suppressClick=!0,e.preventDefault())}}_onItemPointerMove(e){const t=this._ptrDrag;if(!(!t||e.pointerId!==t.pointerId)){if(t.lastY=e.clientY,!t.active){if(Math.abs(e.clientY-t.startY)<p._PTR_DRAG_SLOP)return;t.active=!0,this._dragSrc=t.key,this._suppressClick=!0}e.preventDefault(),this._ptrTrack(),this._ptrTickScroll()}}_ptrTrack(){const e=this._ptrDrag;if(!e?.active)return;let t=null,i=!1;for(const o of e.siblings){const s=o.getBoundingClientRect();if(e.lastY>=s.top&&e.lastY<=s.bottom){t=o.dataset.dragKey??null,i=e.lastY<s.top+s.height/2;break}}if(!t&&e.siblings.length){const o=e.siblings[0].getBoundingClientRect(),s=e.siblings[e.siblings.length-1].getBoundingClientRect();e.lastY<o.top?(t=e.siblings[0].dataset.dragKey??null,i=!0):e.lastY>s.bottom&&(t=e.siblings[e.siblings.length-1].dataset.dragKey??null,i=!1)}t===e.key&&(t=null),(this._dropKey!==t||this._dropBefore!==i)&&(this._dropKey=t,this._dropBefore=i)}_ptrTickScroll(){const e=this._ptrDrag;if(!e?.active||!e.scroller)return;const t=p,i=e.scroller.getBoundingClientRect(),o=i.top+t._PTR_EDGE-e.lastY,s=e.lastY-(i.bottom-t._PTR_EDGE);if((o>0?-o:s>0?s:0)===0){e.raf&&(cancelAnimationFrame(e.raf),e.raf=0);return}if(e.raf)return;const n=()=>{const l=this._ptrDrag;if(!l?.active||!l.scroller)return;const c=l.scroller.getBoundingClientRect(),d=c.top+t._PTR_EDGE-l.lastY,h=l.lastY-(c.bottom-t._PTR_EDGE),_=d>0?-Math.min(d,t._PTR_EDGE):h>0?Math.min(h,t._PTR_EDGE):0;if(_===0){l.raf=0;return}l.scroller.scrollTop+=_/t._PTR_EDGE*t._PTR_SCROLL_MAX,this._ptrTrack(),l.raf=requestAnimationFrame(n)};e.raf=requestAnimationFrame(n)}_onItemPointerUp(e){const t=this._ptrDrag;if(!t||e.pointerId!==t.pointerId)return;const i=this._dropKey,o=this._dropBefore,s=t.active,a=t.key;this._ptrEndDrag(),s&&i&&i!==a&&this._moveByKeys(a,i,o)}_onItemPointerCancel(e){this._ptrDrag&&e.pointerId!==this._ptrDrag.pointerId||this._ptrEndDrag()}_ptrEndDrag(){const e=this._ptrDrag;if(e){e.raf&&cancelAnimationFrame(e.raf);try{e.row.releasePointerCapture(e.pointerId)}catch{}}this._ptrDrag=null,this._dragSrc=null,this._dropKey=null}_onItemCardKeydown(e,t,i){if(e.key==="Enter"||e.key===" "){if(e.target!==e.currentTarget)return;e.preventDefault(),i(e);return}if(t!=null&&e.altKey&&(e.key==="ArrowUp"||e.key==="ArrowDown")){e.preventDefault();const o=e.key==="ArrowUp",s=t.split(":"),a=Number(s[s.length-1])+(o?-1:1);if(a<0)return;const n=[...s.slice(0,-1),""].join(":"),l=this.renderRoot?.querySelectorAll(`[data-drag-key^="${n}"]`);if(!l||a>=l.length)return;const c=[...s.slice(0,-1),String(a)].join(":");this._moveByKeys(t,c,o),this.updateComplete.then(()=>{this.renderRoot?.querySelector(`[data-drag-key="${c}"]`)?.focus()})}}_moveByKeys(e,t,i){const[o,...s]=e.split(":"),[a,...n]=t.split(":");if(o!==a)return;const l=c=>c.every(d=>Number.isInteger(Number(d))&&Number(d)>=0);if(!(s.length===0||s.length!==n.length||!l(s)||!l(n))){if(o==="card")this._moveCard(Number(s[0]),Number(n[0]),i);else if(o==="field"){const[c,d]=s.map(Number),[h,_]=n.map(Number);if(c!==h)return;this._moveField(c,d,_,i)}else if(o==="extfield"){const[c,d]=s.map(Number),[h,_]=n.map(Number);if(c!==h)return;this._moveExtField(c,d,_,i)}else if(o==="extcard")this._moveExtCard(Number(s[0]),Number(n[0]),i);else if(o==="virt")this._moveVirtual(Number(s[0]),Number(n[0]),i);else if(o==="zone")this._moveZone(Number(s[0]),Number(n[0]),i);else if(o==="flow")this._moveFlow(Number(s[0]),Number(n[0]),i);else if(o==="emb")this._moveEmbCard(Number(s[0]),Number(n[0]),i);else if(o==="opt"||o==="eopt"){const[c,d,h]=s.map(Number),[_,m,g]=n.map(Number);if(c!==_||d!==m)return;this._moveOption(c,d,h,g,i,o==="eopt")}else if(o==="tu"||o==="etu"){const[c,d,h]=s.map(Number),[_,m,g]=n.map(Number);if(c!==_||d!==m)return;this._moveTuItem(c,d,h,g,i,o==="etu")}else if(o==="pt"){const[c,d]=s.map(Number),[h,_]=n.map(Number);if(c!==h)return;this._movePoint(c,d,_,i)}else if(o==="vin"){const[c,d]=s.map(Number),[h,_]=n.map(Number);if(c!==h)return;this._moveVirtualInput(c,d,_,i)}else if(o==="trig"){const[c,d]=s.map(Number),[h,_]=n.map(Number);if(c!==h)return;this._moveTrigger(c,d,_,i)}else if(o==="gs"){const[c,d,h]=s.map(Number),[_,m,g]=n.map(Number);if(c!==_||d!==m)return;this._moveGraphSeries(c,d,h,g,i)}else if(o==="egs"){const[c,d,h]=s.map(Number),[_,m,g]=n.map(Number);if(c!==_||d!==m)return;this._moveExtGraphSeries(c,d,h,g,i)}}}_updateExtField(e,t,i){const o=this._extCards()[e];if(!o)return;const s=o.fields.map((a,n)=>n===t?V(a,i):a);this._updateExtCard(e,{fields:s})}_alignCards(e){if(!this._config||this._selCards.size<2)return;const t=Array.from(this._selCards),i=this._config.cards,o=t.map(_=>({i:_,pos:{...i[_].position}})),s=o.map(_=>_.pos.x),a=o.map(_=>_.pos.y),n=Math.min(...s),l=Math.max(...s),c=Math.min(...a),d=Math.max(...a),h=i.map((_,m)=>{if(!this._selCards.has(m))return _;let{x:g,y:f}=_.position;return e==="left"&&(g=P(n)),e==="right"&&(g=P(l)),e==="centerH"&&(g=P((n+l)/2)),e==="top"&&(f=P(c)),e==="bottom"&&(f=P(d)),e==="middleV"&&(f=P((c+d)/2)),{..._,position:{x:g,y:f}}});this._emit({...this._config,cards:h})}_distribute(e){if(!this._config||this._selCards.size<2)return;const t=Array.from(this._selCards).sort((c,d)=>this._config.cards[c].position[e]-this._config.cards[d].position[e]),i=t.length,o=this._config.cards,s=o[t[0]].position[e],a=o[t[i-1]].position[e],n=i>1?(a-s)/(i-1):0,l=o.map((c,d)=>{const h=t.indexOf(d);if(h<0)return c;const _=P(s+n*h);return{...c,position:{...c.position,[e]:_}}});this._emit({...this._config,cards:l})}_distributeCanvas(e){if(!this._config||this._selCards.size<2)return;const t=Array.from(this._selCards).sort((a,n)=>this._config.cards[a].position[e]-this._config.cards[n].position[e]),i=t.length,s=this._config.cards.map((a,n)=>{const l=t.indexOf(n);if(l<0)return a;const c=P((l+1)/(i+1));return{...a,position:{...a.position,[e]:c}}});this._emit({...this._config,cards:s})}_alignGroupToCanvas(e){if(!this._config||this._selCards.size<1)return;const t=.5,i=Array.from(this._selCards),o=this._config.cards,s=i.map(c=>o[c].position[e]),a=(Math.min(...s)+Math.max(...s))/2,n=t-a,l=o.map((c,d)=>this._selCards.has(d)?{...c,position:{...c.position,[e]:P(c.position[e]+n)}}:c);this._emit({...this._config,cards:l})}_groupCards(){if(!this._config||this._selCards.size+this._selEmbCards.size<2)return;const e="g-"+Date.now().toString(36),t=this._config.cards.map((o,s)=>this._selCards.has(s)?{...o,group:e}:o),i=this._embCards().map((o,s)=>this._selEmbCards.has(s)?{...o,group:e}:o);this._emit({...this._config,cards:t,embedded_cards:i})}_ungroupCards(){if(!this._config)return;const e=this._config.cards.map((i,o)=>{if(!this._selCards.has(o))return i;const{group:s,...a}=i;return a}),t=this._embCards().map((i,o)=>{if(!this._selEmbCards.has(o))return i;const{group:s,...a}=i;return a});this._emit({...this._config,cards:e,embedded_cards:t})}_applySelectionGap(e,t){if(!this._config)return;const{totalW:i,totalH:o}=te(this._config),s=e==="x"?i:o,a=e==="x"?o:i,n=this._config.cards,l=this._embCards(),c=[],d=(x,C,S)=>{const E=this._previewBoxes[S.id];if(!E)return;const F=S.anchor??b("anchor")??"top-left",Y=(e==="x"?E.y:E.x)*a,Z=Y+(e==="x"?E.h:E.w)*a;c.push({kind:x,idx:C,box:E,anchor:F,crossStart:Y,crossEnd:Z})};for(const x of this._selCards){const C=n[x];C&&d("card",x,C)}for(const x of this._selEmbCards){const C=l[x];C&&d("emb",x,C)}if(c.length<2)return;const h=[...c].sort((x,C)=>x.crossStart-C.crossStart),_=[];let m=[],g=-1/0;for(const x of h)m.length===0||x.crossStart<g?(m.push(x),g=Math.max(g,x.crossEnd)):(_.push(m),m=[x],g=x.crossEnd);m.length>0&&_.push(m);const f=new Map,$=new Map;for(const x of _){if(x.length<2)continue;x.sort((E,F)=>e==="x"?E.box.x-F.box.x:E.box.y-F.box.y);const C=x[0];let S=(e==="x"?C.box.x:C.box.y)*s+(e==="x"?C.box.w:C.box.h)*s;for(let E=1;E<x.length;E++){const F=x[E],Y=(e==="x"?F.box.w:F.box.h)*s,Z=S+t,[Ne,Le]=ke[F.anchor],$e=P((Z+(e==="x"?Ne:Le)*Y)/s),ve=F.kind==="card"?n[F.idx]:l[F.idx],Be=e==="x"?{x:$e,y:ve.position.y}:{x:ve.position.x,y:$e};(F.kind==="card"?f:$).set(F.idx,Be),S=Z+Y}}if(f.size===0&&$.size===0)return;const R=n.map((x,C)=>f.has(C)?{...x,position:f.get(C)}:x),k=l.map((x,C)=>$.has(C)?{...x,position:$.get(C)}:x);this._emit({...this._config,cards:R,embedded_cards:k})}_syncNavTo(e,t,i){this._navigateTo(e,t,i)}_onCardDown(e,t){if(e.preventDefault(),this._bgSelected=!1,e.altKey){const a=this._config?.cards??[],n=this._previewBoxes,l=this.renderRoot.querySelector(".ec-canvas-area");if(l&&Object.keys(n).length>0){const c=l.getBoundingClientRect(),d=(e.clientX-c.left)/c.width,h=(e.clientY-c.top)/c.height,_=a.map((m,g)=>({idx:g,box:n[m.id]})).filter(m=>!!m.box&&d>=m.box.x&&d<=m.box.x+m.box.w&&h>=m.box.y&&h<=m.box.y+m.box.h).map(m=>m.idx).sort((m,g)=>m-g);if(_.length>0){const m=_.indexOf(this._selCard),g=m>=0?_[(m+1)%_.length]:_[0];this._selCard=g,this._selField=-1,this._syncNavTo("cards","mosaic",[{key:`card:${a[g]?.id??g}`,label:a[g]?.name??`Card ${g+1}`}]);const f=a[g]?.group;this._selCards=new Set(f?a.map(($,R)=>({c:$,idx:R})).filter(({c:$})=>$.group===f).map(({idx:$})=>$):[g])}}return}if(this._selCard=t,this._selField=-1,this._syncNavTo("cards","mosaic",[{key:`card:${this._config?.cards[t]?.id??t}`,label:this._config?.cards[t]?.name??`Card ${t+1}`}]),e.shiftKey||e.ctrlKey||e.metaKey){const a=new Set(this._selCards);a.has(t)?a.delete(t):a.add(t),this._selCards=a;return}const i=this._config?.cards??[],o=i[t]?.group,s=o?i.map((a,n)=>({c:a,idx:n})).filter(({c:a})=>a.group===o).map(({idx:a})=>a):[t];if(this._selCards=new Set(s),this._dragCard=t,e.target.setPointerCapture(e.pointerId),this._hostRect=this.renderRoot.querySelector(".ec-canvas-area").getBoundingClientRect(),this._startX=e.clientX,this._startY=e.clientY,this._dragMembers=s.map(a=>({idx:a,start:{...i[a]?.position??{x:0,y:0}}})),o){const a=this._embCards(),n=a.map((l,c)=>({ec:l,idx:c})).filter(({ec:l})=>l.group===o).map(({idx:l})=>l);this._selEmbCards=new Set(n),this._embDragMembers=n.map(l=>({idx:l,start:{...a[l]?.position??{x:0,y:0}}}))}else this._selEmbCards=new Set,this._embDragMembers=[]}_onCardMove(e){if(this._dragCard<0||!this._hostRect||!this._config)return;const t=(e.clientX-this._startX)/this._hostRect.width,i=(e.clientY-this._startY)/this._hostRect.height,o=this._config.cards.map((a,n)=>{const l=this._dragMembers.find(c=>c.idx===n);return l?{...a,position:{x:P(l.start.x+t),y:P(l.start.y+i)}}:a}),s=this._embDragMembers.length>0?this._embCards().map((a,n)=>{const l=this._embDragMembers.find(c=>c.idx===n);return l?{...a,position:{x:P(l.start.x+t),y:P(l.start.y+i)}}:a}):this._embCards();this._emit({...this._config,cards:o,embedded_cards:s})}_onCardUp(e){const t=this._gridGeom();if(t&&this._config&&(this._dragMembers.length>0||this._embDragMembers.length>0)){const{cols:i,rows:o}=t,s=this._config.cards,a=this._embCards(),n=[];for(const l of this._dragMembers){const c=s[l.idx];c&&n.push({kind:"card",idx:l.idx,box:this._previewBoxes[c.id],pos:c.position})}for(const l of this._embDragMembers){const c=a[l.idx];c&&n.push({kind:"emb",idx:l.idx,box:this._previewBoxes[c.id],pos:c.position})}if(n.length===1){const l=n[0],c=(l.kind==="card"?s[l.idx]?.anchor:a[l.idx]?.anchor)??b("anchor")??"top-left",[d,h]=ke[c],_=l.box?l.box.x+d*l.box.w:l.pos.x,m=l.box?l.box.y+h*l.box.h:l.pos.y,g=Math.min(i,Math.max(0,Math.round(_*i))),f=Math.min(o,Math.max(0,Math.round(m*o))),$={x:P(g/i),y:P(f/o)};if(l.kind==="card"){const R=s.map((k,x)=>x===l.idx?{...k,position:$}:k);this._emit({...this._config,cards:R})}else{const R=a.map((k,x)=>x===l.idx?{...k,position:$}:k);this._emit({...this._config,embedded_cards:R})}}else if(n.length>=2){let l=1/0,c=1/0,d=-1/0,h=-1/0;for(const k of n)k.box?(l=Math.min(l,k.box.x),c=Math.min(c,k.box.y),d=Math.max(d,k.box.x+k.box.w),h=Math.max(h,k.box.y+k.box.h)):(l=Math.min(l,k.pos.x),c=Math.min(c,k.pos.y),d=Math.max(d,k.pos.x),h=Math.max(h,k.pos.y));const _={x:(l+d)/2,y:(c+h)/2},m=Math.min(i,Math.max(0,Math.round(_.x*i))),g=Math.min(o,Math.max(0,Math.round(_.y*o))),f={x:m/i-_.x,y:g/o-_.y},$=s.map((k,x)=>this._dragMembers.some(C=>C.idx===x)?{...k,position:{x:P(k.position.x+f.x),y:P(k.position.y+f.y)}}:k),R=a.map((k,x)=>this._embDragMembers.some(C=>C.idx===x)?{...k,position:{x:P(k.position.x+f.x),y:P(k.position.y+f.y)}}:k);this._emit({...this._config,cards:$,embedded_cards:R})}}e.target.releasePointerCapture(e.pointerId),this._dragCard=-1,this._dragMembers=[],this._embDragMembers=[]}_onPointDown(e,t){if(e.preventDefault(),e.stopPropagation(),this._selPoint=t,!this._config)return;const i=this._flows()[this._selFlow];if(!i)return;const o=i.points[t];if(o){if(e.shiftKey){this._removeFlowPoint(this._selFlow,t),this._selPoint=-1;return}this._syncNavTo("elements","flows",[{key:`flow:${i.id}`,label:i.name??i.id},{key:`pt:${t}`,label:`Point ${t+1}`}]),o.card==null&&(this._dragPoint=t,e.target.setPointerCapture(e.pointerId),this._pRect=this.renderRoot.querySelector(".ec-canvas-area").getBoundingClientRect(),this._pStartX=e.clientX,this._pStartY=e.clientY,this._pStartPos={x:o.x??0,y:o.y??0},this._snapAxis=null)}}_onPointMove(e){if(this._dragPoint<0||!this._pRect||!this._config)return;let t=P(this._pStartPos.x+(e.clientX-this._pStartX)/this._pRect.width),i=P(this._pStartPos.y+(e.clientY-this._pStartY)/this._pRect.height);const o=t,s=i;if(e.ctrlKey){const a=this._flows()[this._selFlow];if(a&&this._pRect){const n=this._config.cards,l=this._previewBoxes,c=this._dragPoint,d=c>0?a.points[c-1]:null,h=c<a.points.length-1?a.points[c+1]:null,_=d?me(d,n,l):null,m=h?me(h,n,l):null,g=this._pRect.width,f=this._pRect.height;if(_&&m){const $=Math.hypot((t-_.x)*g,(i-m.y)*f),R=Math.hypot((t-m.x)*g,(i-_.y)*f);$<=R?(t=_.x,i=m.y):(t=m.x,i=_.y)}else{const $=_??m;if($){if(this._snapAxis===null){const R=e.clientX-this._pStartX,k=e.clientY-this._pStartY;Math.hypot(R,k)>4?this._snapAxis=Math.abs(R)>=Math.abs(k)?"y":"x":this._snapAxis=Math.abs(t-$.x)*g<Math.abs(i-$.y)*f?"x":"y"}this._snapAxis==="x"?t=$.x:i=$.y}}}}{let n=!1;e:for(const l of this._config.cards){const c=this._previewBoxes[l.id];if(c)for(const d of["top","right","bottom","left"]){let h,_;switch(d){case"top":h=c.x+c.w/2,_=c.y;break;case"right":h=c.x+c.w,_=c.y+c.h/2;break;case"bottom":h=c.x+c.w/2,_=c.y+c.h;break;case"left":h=c.x,_=c.y+c.h/2;break}if(Math.hypot((o-h)*this._pRect.width,(s-_)*this._pRect.height)<=24){t=h,i=_,this._snapAnchor={card:l.id,side:d},n=!0;break e}}}n||(this._snapAnchor=null)}this._updateFlowPoint(this._selFlow,this._dragPoint,{x:t,y:i})}_onPointUp(e){this._dragPoint>=0&&(e.target.releasePointerCapture(e.pointerId),this._snapAnchor&&this._updateFlowPoint(this._selFlow,this._dragPoint,{card:this._snapAnchor.card,side:this._snapAnchor.side,x:void 0,y:void 0})),this._dragPoint=-1,this._snapAnchor=null,this._snapAxis=null}_ptSegDist(e,t,i,o,s,a){const n=s-i,l=a-o,c=n*n+l*l,d=c===0?0:Math.max(0,Math.min(1,((e-i)*n+(t-o)*l)/c));return Math.hypot(e-i-d*n,t-o-d*l)}_onCanvasAreaClick(e){e.target.closest(".ec-bg-ov,.ec-bg-resize")||(this._bgSelected=!1);const t=this._flows();if(t.length===0||e.target.closest(".ec-handle,.ec-card-ov,.ec-emb-handle,.ec-emb-ov,.ec-zone-handle,.ec-flow-node,.ec-snap"))return;const o=e.currentTarget.getBoundingClientRect(),s=e.clientX-o.left,a=e.clientY-o.top,n=this._config?.cards??[],l=10;let c=-1,d=1/0;for(let h=0;h<t.length;h++){const _=t[h].points.map(m=>{const g=me(m,n,this._previewBoxes);return{x:g.x*o.width,y:g.y*o.height}});for(let m=0;m<_.length-1;m++){const g=this._ptSegDist(s,a,_[m].x,_[m].y,_[m+1].x,_[m+1].y);g<d&&(d=g,c=h)}}if(c>=0&&d<=l){this._selFlow=c,this._selPoint=-1;const h=t[c];this._syncNavTo("elements","flows",[{key:`flow:${h.id}`,label:h.name??h.id}])}}_syncPreviewDialog(){const e=this.renderRoot?.querySelector("dialog.ec-preview");if(!e)return;const t=e.matches(":modal");this._previewExpanded&&!t?(e.open&&e.close(),e.showModal()):!this._previewExpanded&&(t||!e.open)&&(e.open&&e.close(),e.show())}_sizeExpandedCanvas(){const e=this.renderRoot?.querySelector(".ec-canvas-area");if(!e)return;if(!this._previewExpanded){e.style.width&&e.style.removeProperty("width");return}const t=this.renderRoot?.querySelector(".ec-preview");if(!t)return;this._previewRO||(this._previewRO=new ResizeObserver(()=>this._sizeExpandedCanvas()),this._previewRO.observe(t),window.addEventListener("resize",this._onWindowResize));const{totalW:i,totalH:o}=te(this._config);if(!i||!o)return;const s=this.renderRoot?.querySelector(".ec-expanded-bottom-bar"),a=t.clientWidth,n=window.innerHeight-(s?.offsetHeight??0);if(a<=0||n<=0)return;const l=`${Math.floor(Math.min(a,n*i/o))}px`;e.style.width!==l&&(e.style.width=l)}connectedCallback(){super.connectedCallback(),window.addEventListener("keydown",this._onUndoKeydown)}disconnectedCallback(){super.disconnectedCallback(),window.removeEventListener("keydown",this._onUndoKeydown),clearTimeout(this._toastTimer),this._previewRO?.disconnect(),this._previewRO=void 0,window.removeEventListener("resize",this._onWindowResize)}shouldUpdate(e){if(!e.has("hass")||e.size>1)return!0;const t=e.get("hass");if(!t||!this.hass)return!0;for(const i of this._referencedEntities())if(t.states[i]!==this.hass.states[i])return!0;return this._forwardHass(),!1}_referencedEntities(){const e=this._config;if(!e)return[];if(this._refEntityCache?.config===e)return this._refEntityCache.ids;const t=Zt(e);return this._refEntityCache={config:e,ids:t},t}_forwardHass(){const e=this.renderRoot,t=this.hass;if(!e||!t)return;const i=(s,a)=>{s.hass=a};e.querySelectorAll("ha-entity-picker, ha-icon-picker, ha-selector, ha-service-control, ha-navigation-picker").forEach(s=>i(s,t));const o=e.querySelectorAll("ha-service-picker");if(o.length){const s=this._actionHass();o.forEach(a=>i(a,s))}e.querySelectorAll(Je).forEach(s=>i(s,t)),this._embNativeEditor&&i(this._embNativeEditor,t)}_focusEdgeGuard(){let e=this.renderRoot,t=e?.activeElement??null;for(;t&&t.shadowRoot?.activeElement;)e=t.shadowRoot,t=e.activeElement;if(!t)return!0;const i=t.tagName.toLowerCase();return i==="input"||i==="textarea"||i==="select"?!1:!t.isContentEditable}updated(e){if(this._config&&(e.has("_config")||e.has("_previewExpanded"))&&this.renderRoot?.querySelectorAll(Je).forEach(i=>i.setConfig(this._config)),this._syncPreviewDialog(),this._sizeExpandedCanvas(),!this._cpOpenId)this._cpFocusedId=null;else if(this._cpFocusedId!==this._cpOpenId){const i=this.renderRoot?.querySelector(".ec-cp-popup");i&&(i.focus({preventScroll:!0}),this._cpFocusedId=this._cpOpenId)}const t=this._navScrollKey();if(t!==this._lastScrollKey){const i=(this._navPanel?1:0)+this._navPath.length,o=this.renderRoot?.querySelector(".ec-panel-body");o&&(o.scrollTop=i<this._lastScrollDepth?this._panelScroll.get(t)??0:0),this.renderRoot?.querySelector(".ec-panel-header-title")?.focus({preventScroll:!0}),this._lastScrollKey=t,this._lastScrollDepth=i}if(this._previewExpanded&&!this._wasPreviewExpanded&&this._focusEdgeGuard()&&this.renderRoot?.querySelector(".ec-preview")?.focus(),this._showAddFlowInput&&!this._wasShowAddFlowInput&&this._focusEdgeGuard()&&this.renderRoot?.querySelector(".ec-flow-name-input")?.focus(),this._wasPreviewExpanded=this._previewExpanded,this._wasShowAddFlowInput=this._showAddFlowInput,this._embEditorOpen&&this._embNativeEditor){const i=this.renderRoot.querySelector("#emb-native-slot");if(i&&!i.contains(this._embNativeEditor)){i.innerHTML="",i.appendChild(this._embNativeEditor);const o=this._embEditorConfig??(this._embEditorTarget?this._embConfig(this._embEditorTarget):void 0);if(o){const s=this._embNativeEditor;try{s.setConfig?.(o)}catch{}s.value=o}this._embNativeEditor.hass=this.hass}}this._syncCustomColorVars(),this._pickerStyleRetries=0,this._stylePickers()}_syncCustomColorVars(){const e=mt(this._config?.defaults),t=e.map(([i])=>i.slice(9));for(const i of this._mccustApplied)t.includes(i)||this.style.removeProperty(`--mccust_${i}`);for(const[i,o]of e)this.style.setProperty(i,o);this._mccustApplied=t}_stylePickers(){[this._styleEntityPickers(),this._styleWalkedPickers()].some(Boolean)&&!this._pickerStyleScheduled&&this._pickerStyleRetries<60&&(this._pickerStyleScheduled=!0,this._pickerStyleRetries++,requestAnimationFrame(()=>{this._pickerStyleScheduled=!1,this._stylePickers()}))}_injectPickerStyle(e){const t=e?.shadowRoot;if(!t)return!1;if(t.querySelector("style[data-mc-picker]"))return!0;const i=document.createElement("style");return i.setAttribute("data-mc-picker",""),i.textContent=`
      :host {
        border-radius: 6px !important;
        min-height: ${p.PICKER_HEIGHT}px !important;
      }
      :host::after, :host::before { content: none !important; }
      #item > md-item {
        border-radius: 6px !important;
        color: var(--mce-primary) !important;
        min-height: ${p.PICKER_HEIGHT}px !important;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        font-size: 15px !important;
        --mdc-icon-size: 20px;
      }
    `,t.appendChild(i),!0}_findInShadow(e,t,i=6){let o=[e];for(let s=0;s<i&&o.length;s++){const a=[];for(const n of o){const l=n.shadowRoot;if(!l)continue;const c=l.querySelector(t);if(c)return c;l.querySelectorAll("*").forEach(d=>{d.shadowRoot&&a.push(d)})}o=a}return null}_styleWalkedPickers(){let e=!1;for(const t of p._WALKED_PICKERS){const i=this.renderRoot?.querySelectorAll(t);!i||i.length===0||i.forEach(o=>{if(this._styledPickers.has(o))return;const s=this._findInShadow(o,"ha-combo-box-item",8);this._injectPickerStyle(s)?this._styledPickers.add(o):e=!0})}return e}_styleEntityPickers(){const e=this.renderRoot?.querySelectorAll("ha-entity-picker");if(!e||e.length===0)return!1;let t=!1;return e.forEach(i=>{if(this._styledPickers.has(i))return;const o=i.shadowRoot?.querySelector("ha-generic-picker")?.shadowRoot?.querySelector("ha-picker-field")?.shadowRoot?.querySelector("ha-combo-box-item");this._injectPickerStyle(o)?this._styledPickers.add(i):t=!0}),t}_iconPicker(e,t,i){return r`<ha-icon-picker
      .hass=${this.hass}
      .value=${e??""}
      .placeholder=${i??""}
      @value-changed=${o=>{const s=o.detail.value;t(s||void 0)}}
    ></ha-icon-picker>`}_entitySelector(e){const{label:t="Entity",entity:i,onEntity:o,includeVirtuals:s=!0,attribute:a,onAttribute:n,attributePlaceholder:l}=e,c=i?.startsWith("virtual:")??!1,d=!i||Object.keys(this.hass?.states[i]?.attributes??{}).length>0;return r`
      ${this._row(t,c?r`<div style="display:flex;gap:4px;align-items:center;">
              <span class="ec-input" style="flex:1;opacity:0.8;">
                ${this._virtuals().find(h=>`virtual:${h.id}`===i)?.name??i}
              </span>
              <button class="ec-btn-clear" @click=${()=>o(void 0)} title="Switch to real entity">✕</button>
            </div>`:r`<ha-entity-picker
              .hass=${this.hass}
              .value=${i??""}
              allow-custom-entity
              @value-changed=${h=>o(h.detail.value)}
            ></ha-entity-picker>`,"The entity this reads its value from.")}
      ${s&&!c&&this._virtuals().length>0?this._row("Virtual Entity",r`<select class="ec-select"
          .value=${""}
          @change=${h=>{const _=h.target.value;_&&o(_),h.target.value=""}}
        >
          <option value="">(pick a virtual)</option>
          ${this._virtuals().map(h=>r`<option value=${"virtual:"+h.id}>${h.name}</option>`)}
        </select>`,"Use a virtual entity from Elements ▸ Virtual Entities instead of a real one. Picking one replaces the entity above."):u}
      ${n&&!c&&d?this._row("Attribute",r`<ha-selector
          class="ec-attr-picker"
          .hass=${this.hass}
          .selector=${{attribute:{entity_id:i||void 0}}}
          .value=${a}
          .placeholder=${l}
          .required=${!1}
          @value-changed=${h=>{const _=h.detail.value;n(typeof _=="string"&&_?_:void 0)}}
        ></ha-selector>`,"Read one of the entity's attributes instead of its state."):u}
    `}_boxRows(e,t,i,o=!0,s="Rounds the corners of the box."){return r`
      ${this._gradientRows({id:`${e}-bg`,label:"Background",toLabel:"Gradient to",colorHint:"The box's fill colour. Leave blank for no fill, so whatever sits behind shows through.",color:t.background,color2:t.background2,angle:t.background_angle,setColor:a=>i({background:a}),setColor2:a=>i({background2:a}),setAngle:a=>i({background_angle:a}),clearGradient:()=>i({background2:void 0,background_angle:void 0}),onClearColor:()=>i({background:void 0,background_alpha:void 0})})}

      ${this._row("Opacity",r`<div class="ec-opacity-row">
          <input type="range" min="0" max="1" step="0.01"
            .value=${String(t.background_alpha??b("box_background_alpha")??1)}
            @input=${a=>{const n=parseFloat(a.target.value);i({background_alpha:n})}}
          />
          <span class="ec-opacity-val">${Math.round((t.background_alpha??b("box_background_alpha")??1)*100)}%</span>
          <button class="ec-btn-clear" @click=${()=>i({background_alpha:void 0})} title="Clear">✕</button>
        </div>`,"How opaque the background colour is. The border and contents are unaffected.")}

      ${this._row("Border",r`<input type="checkbox" .checked=${t.border??!1}
          @change=${a=>i({border:a.target.checked})}
        />`,"Draws a border around the box, in Border Color below.")}

      ${t.border?r`
        ${this._row("Border Color",this._colorPicker(`${e}-col`,t.color,a=>i({color:a})),"Colour of the border — not a fill. The fill is Background above.")}

        ${this._numRow("Border width (px)",{value:t.border_width,onChange:a=>i({border_width:a}),min:0,placeholder:"1",hint:"Thickness of the border line."})}
      `:u}

      ${this._numRow("Radius (px)",{value:t.radius,onChange:a=>i({radius:a}),min:0,placeholder:"0",hint:s})}

      ${this._numRow("Padding (px)",{value:t.padding,onChange:a=>i({padding:a}),min:0,placeholder:"0",hint:"Space between the edge of the box and its contents."})}

      ${this._row("Shadow",r`<input type="checkbox" .checked=${t.shadow??!1}
          @change=${a=>i({shadow:a.target.checked})}
        />`,"Casts a shadow behind the box, shaped by the rows below.")}

      ${t.shadow?r`
        ${this._row("Shadow type",r`<select class="ec-select"
            .value=${t.shadow_mode??b("box_shadow_mode")??"drop"}
            @change=${a=>{const n=a.target.value;i({shadow_mode:n==="box"?"box":void 0})}}
          >
            <option value="drop" .selected=${(t.shadow_mode??"drop")==="drop"}>Drop — offset, directional</option>
            <option value="box" .selected=${t.shadow_mode==="box"}>Box — even halo all round</option>
          </select>`,"Drop casts to one side, shaped by the offsets. Box surrounds the box evenly — the glow look, with blur and spread to tune its reach.")}

        ${this._row("Shadow color",this._colorPicker(`${e}-shcol`,t.shadow_color,a=>i({shadow_color:a})),"Colour of the shadow. Leave blank for a translucent black.")}

        ${(t.shadow_mode??b("box_shadow_mode")??"drop")!=="box"?r`
          ${this._numRow("Shadow offset X (px)",{value:t.shadow_x,onChange:a=>i({shadow_x:a}),placeholder:"0",hint:"Horizontal distance of the shadow. Negative moves it left."})}

          ${this._numRow("Shadow offset Y (px)",{value:t.shadow_y,onChange:a=>i({shadow_y:a}),placeholder:"2",hint:"Vertical distance of the shadow. Negative moves it up."})}
        `:u}

        ${this._numRow("Shadow blur (px)",{value:t.shadow_blur,onChange:a=>i({shadow_blur:a}),min:0,placeholder:"8",hint:"How soft the shadow edge is. 0 is a hard edge."})}

        ${this._numRow("Shadow spread (px)",{value:t.shadow_spread,onChange:a=>i({shadow_spread:a}),placeholder:"0",hint:"Grows the shadow in every direction. Negative shrinks it."})}
      `:u}

      ${o?this._cssRow(t.extra_css,a=>i({extra_css:a})):u}

      ${this._numRow("Blur (px)",{value:t.blur,onChange:a=>i({blur:a}),min:0,placeholder:"0",hint:"Blurs what is behind the box — the background image, or the dashboard behind a popover. The box's own contents stay sharp."})}
    `}_textRows(e,t,i,o=!0,s=!0,a=!0){return r`
      ${s?this._numRow("Font size (px)",{value:t.font_size,onChange:n=>i({font_size:n}),min:6,placeholder:"inherit",hint:"Unset keeps the size inherited from the style above this one."}):u}

      ${a?this._row("Color",this._colorPicker(`${e}-col`,t.color,n=>i({color:n})),"Unset follows the default text colour in Settings ▸ Global Defaults ▸ Mosaic Card Defaults."):u}

      ${this._row("Font weight",r`<select class="ec-select"
          .value=${t.font_weight!=null?String(t.font_weight):""}
          @change=${n=>{const l=n.target.value;i({font_weight:l===""?void 0:Number(l)})}}
        >
          <option value="" .selected=${t.font_weight==null}>(inherit)</option>
          <option value="400" .selected=${t.font_weight===400}>400 — Normal</option>
          <option value="600" .selected=${t.font_weight===600}>600 — Semi-bold</option>
          <option value="700" .selected=${t.font_weight===700}>700 — Bold</option>
        </select>`)}

      ${this._row("Font family",r`<input class="ec-input" type="text" .value=${t.font_family??""}
          placeholder="inherit"
          @change=${n=>{const l=n.target.value;i({font_family:l===""?void 0:l})}}
        />`,"A CSS font stack, e.g. Roboto, sans-serif. Unset follows Settings ▸ Global Defaults ▸ Layout & Fonts.")}

      ${this._numRow("Letter spacing (px)",{value:t.letter_spacing,onChange:n=>i({letter_spacing:n}),placeholder:"0",hint:"Extra space between characters; negative values tighten."})}

      ${o?this._cssRow(t.extra_css,n=>i({extra_css:n})):u}
    `}_cssRow(e,t,i="Additional CSS",o=co){return this._row(i,r`<textarea
      class="ec-input ec-css-input${this._isValidCss(e??"")?"":" ec-css-invalid"}"
      rows="2" spellcheck="false"
      placeholder="e.g. outline: 1px dashed red; --my-var: 4px;"
      .value=${e??""}
      @input=${s=>{const a=s.target;a.classList.toggle("ec-css-invalid",!this._isValidCss(a.value))}}
      @change=${s=>{const a=s.target.value.trim();t(a||void 0)}}
    ></textarea>`,o)}_isValidCss(e){const t=(e??"").trim();if(!t)return!0;if(/[{}]/.test(t))return!1;for(const i of t.split(";")){const o=i.trim();if(!o)continue;const s=o.indexOf(":");if(s<=0)return!1;const a=o.slice(0,s).trim();if(!o.slice(s+1).trim()||!/^(--[a-zA-Z0-9-]+|-?[a-zA-Z][a-zA-Z0-9-]*)$/.test(a))return!1}return!0}_renderAlignBar(){const e=Array.from(this._selCards).some(t=>this._config?.cards[t]?.group)||Array.from(this._selEmbCards).some(t=>this._embCards()[t]?.group);return r`
      <div class="ec-align-bar">
        <button class="ec-btn-align" @click=${()=>this._alignCards("left")} title="Align left edges">⇤ Left</button>
        <button class="ec-btn-align" @click=${()=>this._alignCards("centerH")} title="Center horizontally">↔ Center H</button>
        <button class="ec-btn-align" @click=${()=>this._alignCards("right")} title="Align right edges">⇥ Right</button>
        <button class="ec-btn-align" @click=${()=>this._alignCards("top")} title="Align top edges">⇡ Top</button>
        <button class="ec-btn-align" @click=${()=>this._alignCards("middleV")} title="Center vertically">↕ Middle V</button>
        <button class="ec-btn-align" @click=${()=>this._alignCards("bottom")} title="Align bottom edges">⇣ Bottom</button>
        <button class="ec-btn-align" @click=${()=>this._distribute("x")} title="Distribute horizontally within selection">⇔ Dist H</button>
        <button class="ec-btn-align" @click=${()=>this._distribute("y")} title="Distribute vertically within selection">⇕ Dist V</button>
        <button class="ec-btn-align" @click=${()=>this._distributeCanvas("x")} title="Distribute horizontally across full canvas">⇔ Dist H (canvas)</button>
        <button class="ec-btn-align" @click=${()=>this._distributeCanvas("y")} title="Distribute vertically across full canvas">⇕ Dist V (canvas)</button>
        <button class="ec-btn-align" @click=${()=>this._alignGroupToCanvas("x")} title="Center group horizontally on canvas">↔ Align H (canvas)</button>
        <button class="ec-btn-align" @click=${()=>this._alignGroupToCanvas("y")} title="Center group vertically on canvas">↕ Align V (canvas)</button>
        <button class="ec-btn-align" @click=${()=>this._groupCards()} title="Group selected cards — drag one to move all">Group</button>
        ${e?r`<button class="ec-btn-align" @click=${()=>this._ungroupCards()} title="Remove group from selected cards">Ungroup</button>`:u}
      </div>
      <div class="ec-align-bar ec-align-bar-gap">
        <label class="ec-quick-field">
          <span>Column gap (px)</span>
          ${this._numInput({value:this._selColGap,onChange:t=>this._selColGap=t,min:0,placeholder:"e.g. 12"})}
        </label>
        <button class="ec-btn-align" title="Space selected cards within each row by this many px"
          @click=${()=>{this._selColGap!=null&&this._applySelectionGap("x",this._selColGap)}}
        >Set</button>
        <button class="ec-btn-align" title="Clear this field" @click=${()=>{this._selColGap=void 0}}>Clear</button>

        <label class="ec-quick-field">
          <span>Row gap (px)</span>
          ${this._numInput({value:this._selRowGap,onChange:t=>this._selRowGap=t,min:0,placeholder:"e.g. 12"})}
        </label>
        <button class="ec-btn-align" title="Space selected cards within each column by this many px"
          @click=${()=>{this._selRowGap!=null&&this._applySelectionGap("y",this._selRowGap)}}
        >Set</button>
        <button class="ec-btn-align" title="Clear this field" @click=${()=>{this._selRowGap=void 0}}>Clear</button>
      </div>
      <p class="ec-hint">Column gap re-spaces cards whose rows overlap vertically (left-to-right neighbors); Row gap re-spaces cards whose columns overlap horizontally (top-to-bottom neighbors). Cards don't need to be pixel-perfectly aligned first, and don't need to be grouped.</p>
    `}_quickNum(e,t,i,o){return r`<label class="ec-quick-field">
      <span>${e}</span>
      ${this._numWrap(r`<input class="ec-input ec-input-num" type="number"
        min=${o?.min??""} max=${o?.max??""}
        placeholder=${o?.placeholder??""}
        .value=${t!=null?String(t):""}
        @change=${s=>i(s.target.value)}
      />`)}
    </label>`}_renderCardQuickPanel(e){const t=this._config?.cards[e];if(!t)return u;const i=this._gridGeom();return r`
      <div class="ec-quick-panel">
        ${i?this._quickNum("Span",t.grid_span??1,o=>{const s=Math.max(1,Math.min(i.cols,Number(o)||1)),a=Math.max(8,s*i.cellW-i.padding);this._updateCard(e,{grid_span:s,width:a})},{min:1,max:i.cols}):u}
        ${this._quickNum("Width",t.width,o=>this._updateCard(e,{width:o===""?void 0:Number(o)}),{placeholder:"auto"})}
        ${i?this._quickNum("Rows",t.grid_row_span??1,o=>{const s=Math.max(1,Math.min(i.rows,Number(o)||1)),a=Math.max(8,s*i.cellH-i.padding);this._updateCard(e,{grid_row_span:s,height:a})},{min:1,max:i.rows}):u}
        ${this._quickNum("Height",t.height,o=>this._updateCard(e,{height:o===""?void 0:Number(o)}),{placeholder:"auto"})}
        ${this._quickNum("Field gap",t.field_gap,o=>this._updateCard(e,{field_gap:o===""?void 0:Number(o)}),{placeholder:"default"})}
        ${this._quickNum("Col gap",t.column_gap,o=>this._updateCard(e,{column_gap:o===""?void 0:Number(o)}),{placeholder:"default"})}
      </div>
    `}_renderEmbQuickPanel(e){const t=this._embCards()[e];if(!t)return u;const i=this._gridGeom();return r`
      <div class="ec-quick-panel">
        ${i?this._quickNum("Span",t.grid_span??1,o=>{const s=Math.max(1,Math.min(i.cols,Number(o)||1)),a=Math.max(8,s*i.cellW-i.padding);this._updateEmbCard(e,{grid_span:s,width:a})},{min:1,max:i.cols}):u}
        ${this._quickNum("Width",t.width,o=>this._updateEmbCard(e,{width:Number(o)}))}
        ${this._quickNum("Height",t.height,o=>this._updateEmbCard(e,{height:o===""?void 0:Number(o)}),{placeholder:"auto"})}
      </div>
    `}render(){if(!this._config)return u;if(this._wizStep>=0)return this._renderWizard();const{totalW:e,totalH:t}=te(this._config),i=this._config.cards??[];return r`
      ${this._renderTutorial()}

      <!-- ── Live preview ── -->
      <dialog class="ec-preview${this._previewExpanded?" ec-preview--expanded":""}${this._previewExpanded&&this._barAtTop?" ec-bar-top":""}"
        @pointermove=${o=>{this._onCardMove(o),this._onPointMove(o),this._onZoneMove(o),this._onZoneResizeMove(o),this._onEmbCardMove(o),this._onBgMove(o)}}
        @pointerup=${o=>{this._onCardUp(o),this._onPointUp(o),this._onZoneUp(o),this._onZoneResizeUp(o),this._onEmbCardUp(o),this._onBgUp(o),this._endUndoGesture()}}
        @cancel=${o=>{o.preventDefault(),this._collapseExpanded()}}
        tabindex="-1"
      >
        ${this._previewExpanded?r`
        <div class="ec-canvas-area"
          @click=${o=>this._onCanvasAreaClick(o)}
        >
          ${Xt`<${Et}
            class="ec-preview-card"
            .hass=${this.hass}
            ?editor=${!0}
            @ec-boxes-changed=${o=>{this._previewBoxes=o.detail.boxes}}
          ></${Et}>`}
          ${this._renderGridOverlay()}
          <div class="ec-handles">
            ${this._renderBgOverlay()}
            ${i.map((o,s)=>{const a=`${s===this._selCard?" selected":""}${this._selCards.has(s)&&s!==this._selCard?" multi":""}${o.group?" grouped":""}`,n=this._previewBoxes[o.id];return n?r`
              <div
                class="ec-card-ov${a}"
                style="left:${n.x*100}%;top:${n.y*100}%;width:${n.w*100}%;height:${n.h*100}%;"
                @pointerdown=${l=>this._onCardDown(l,s)}
                @dblclick=${()=>this._collapseExpanded()}
                title=${o.name??`Card ${s+1}`}
              ></div>`:r`
              <div
                class="ec-handle${a}"
                style="left:${o.position.x*100}%;top:${o.position.y*100}%;"
                @pointerdown=${l=>this._onCardDown(l,s)}
                @dblclick=${()=>this._collapseExpanded()}
                title=${o.name??`Card ${s+1}`}
              ></div>`})}
            ${this._zones().map((o,s)=>{const a=this._zoneBox(o);return r`
              <div
                class="ec-zone-handle${s===this._selZone?" selected":""}"
                style="left:${a.x/e*100}%;top:${a.y/t*100}%;width:${a.w/e*100}%;height:${a.h/t*100}%;"
                @pointerdown=${n=>this._onZoneDown(n,s)}
                @dblclick=${()=>this._collapseExpanded()}
                title=${o.name??`Zone ${s+1}`}
              >
                <span class="ec-zone-label">${o.name??`Zone ${s+1}`}</span>
                ${s===this._selZone?["tl","tr","bl","br"].map(n=>r`
                  <div
                    class="ec-zone-resize ec-zone-resize-${n}"
                    @pointerdown=${l=>this._onZoneResizeDown(l,s,n)}
                  ></div>`):u}
              </div>`})}
            ${this._embCards().map((o,s)=>{const a=`${s===this._selEmbCard?" selected":""}${this._selEmbCards.has(s)&&s!==this._selEmbCard?" multi":""}${o.group?" grouped":""}`,n=this._previewBoxes[o.id];return n?r`
              <div
                class="ec-emb-ov${a}"
                style="left:${n.x*100}%;top:${n.y*100}%;width:${n.w*100}%;height:${n.h*100}%;"
                @pointerdown=${l=>this._onEmbCardDown(l,s)}
                @dblclick=${()=>this._collapseExpanded()}
                title=${o.name??`Embedded ${s+1}`}
              ></div>`:r`
              <div
                class="ec-emb-handle${a}"
                style="left:${o.position.x*100}%;top:${o.position.y*100}%;"
                @pointerdown=${l=>this._onEmbCardDown(l,s)}
                @dblclick=${()=>this._collapseExpanded()}
                title=${o.name??`Embedded ${s+1}`}
              ></div>`})}
          </div>
          ${this._flows().length>0?r`
            <svg class="ec-flow-paths-overlay" viewBox="0 0 1 1" preserveAspectRatio="none">
              <defs>
                <filter id="ec-flow-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="0.003" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              ${this._flows().map((o,s)=>{const a=o.points.map(l=>me(l,i,this._previewBoxes)).map(l=>`${l.x},${l.y}`).join(" "),n=s===this._selFlow;return Jt`
                  <polyline
                    class="ec-flow-hit"
                    points="${a}"
                    fill="none"
                    stroke="transparent"
                    stroke-width="16"
                    pointer-events="stroke"
                    vector-effect="non-scaling-stroke"
                    @dblclick=${()=>{this._selFlow=s,this._syncNavTo("elements","flows",[{key:`flow:${o.id}`,label:o.name??o.id}]),this._collapseExpanded()}}
                  ></polyline>
                  <polyline
                    points="${a}"
                    fill="none"
                    stroke="${n?"rgba(0,212,255,0.9)":"rgba(0,180,255,0.55)"}"
                    stroke-width="${n?3:2.5}"
                    stroke-dasharray="6 4"
                    vector-effect="non-scaling-stroke"
                    filter="url(#ec-flow-glow)"
                  ></polyline>`})}
            </svg>
          `:u}
          ${this._selFlow>=0?(()=>{const o=this._flows()[this._selFlow];if(!o)return u;const s=["top","right","bottom","left"];return r`
              <div class="ec-flow-layer"
                @click=${a=>this._onFlowLayerClick(a)}
              >
                ${this._selPoint>=0?i.map(a=>s.map(n=>{const l=this._previewBoxes[a.id];if(!l)return u;let c,d;switch(n){case"top":c=l.x+l.w/2,d=l.y;break;case"right":c=l.x+l.w,d=l.y+l.h/2;break;case"bottom":c=l.x+l.w/2,d=l.y+l.h;break;case"left":c=l.x,d=l.y+l.h/2;break;default:c=l.x+l.w/2,d=l.y+l.h/2;break}return r`<div
                    class="ec-snap"
                    style="left:${c*100}%;top:${d*100}%;"
                    @click=${h=>{h.stopPropagation(),this._updateFlowPoint(this._selFlow,this._selPoint,{card:a.id,side:n,x:void 0,y:void 0})}}
                  ></div>`})):u}
                ${o.points.map((a,n)=>{const l=me(a,i,this._previewBoxes);return r`<div
                    class="ec-flow-node${n===this._selPoint?" selected":""}${a.card!=null?" anchored":" free"}"
                    style="left:${l.x*100}%;top:${l.y*100}%;"
                    @pointerdown=${c=>this._onPointDown(c,n)}
                    @dblclick=${()=>{this._syncNavTo("elements","flows",[{key:`flow:${o.id}`,label:o.name??o.id}]),this._collapseExpanded()}}
                  ></div>`})}
              </div>
            `})():u}
        </div>
        <div class="ec-expanded-bottom-bar">
            <div class="ec-bottom-bar-left">
              ${this._showAddFlowInput?r`
                <input class="ec-flow-name-input" type="text"
                  placeholder="Flow name"
                  .value=${this._newFlowName}
                  @input=${o=>{this._newFlowName=o.target.value}}
                  @keydown=${o=>{o.key==="Enter"&&this._addFlowFromExpanded(),o.key==="Escape"&&(o.preventDefault(),o.stopPropagation(),this._showAddFlowInput=!1,this._newFlowName="")}}
                >
                <button class="ec-btn-add" @click=${()=>this._addFlowFromExpanded()}>Add</button>
                <button class="ec-btn-remove" @click=${()=>{this._showAddFlowInput=!1,this._newFlowName=""}}>✕</button>
              `:r`
                <button class="ec-btn-add" @click=${()=>{this._showAddFlowInput=!0}}>+ Add Flow Line</button>
              `}
            </div>
            <div class="ec-bottom-bar-center">
              ${this._selCards.size+this._selEmbCards.size>=2?this._renderAlignBar():this._selCards.size===1&&this._selEmbCards.size===0?this._renderCardQuickPanel(Array.from(this._selCards)[0]):this._selEmbCards.size===1&&this._selCards.size===0?this._renderEmbQuickPanel(Array.from(this._selEmbCards)[0]):this._selFlow>=0?r`<span class="ec-hint-text">Flow selected — click card anchor points to connect endpoints</span>`:r`
                        <span class="ec-hint-text">Click on a flow to select it for editing or Add Flow to create a new one</span>
                        <span class="ec-hint-text">Click-drag a card to move it · Shift-click to multi-select · Double click to jump to configuration · Alt-click to cycle stacked cards</span>
                      `}
            </div>
            ${this._selCards.size+this._selEmbCards.size>=2?r`
              <button class="ec-btn-done" title="Finish multi-card editing"
                @click=${()=>{this._selCards=new Set,this._selEmbCards=new Set}}>✓ Done</button>
            `:this._selCards.size===1&&this._selEmbCards.size===0||this._selEmbCards.size===1&&this._selCards.size===0?r`
              <button class="ec-btn-done" title="Finish card editing"
                @click=${()=>{this._selCards=new Set,this._selEmbCards=new Set,this._selCard=-1,this._selEmbCard=-1}}>✓ Done</button>
            `:this._selFlow>=0?r`
              <button class="ec-btn-done" title="Finish flow editing"
                @click=${()=>{this._selFlow=-1}}>✓ Done</button>
            `:u}
            ${this._previewExpanded?r`
              <button class="ec-undo-btn" title="Undo (Ctrl+Z)" ?disabled=${!this._undoStack.length} @click=${()=>this._undo()}>
                <ha-icon icon="mdi:undo"></ha-icon>
              </button>
              <button class="ec-undo-btn" title="Redo (Ctrl+Y)" ?disabled=${!this._redoStack.length} @click=${()=>this._redo()}>
                <ha-icon icon="mdi:redo"></ha-icon>
              </button>
              <button class="ec-side-close" title="Close Mosaic Editor Window" @click=${()=>this._collapseExpanded()}>Close Window</button>
            `:u}
          </div>
        `:r`
        <div class="ec-open-editor-wrap">
          <button class="ec-open-editor-btn" @click=${()=>{this._previewExpanded=!0}}>
            <ha-icon icon="mdi:arrow-expand-all"></ha-icon>
            Open Mosaic Editor Window
          </button>
        </div>
        `}
        ${this._renderGGModal()}
        ${this._renderEmbPickerModal()}
      ${this._renderImagePickerModal()}
        ${this._renderEmbEditorModal()}
        ${this._renderFlowCompleteModal()}
        ${this._previewExpanded?this._renderUndoToast():u}
      </dialog>

      ${this._previewExpanded?u:this._renderControls()}
      ${this._previewExpanded?u:this._renderUndoToast()}
    `}_navOpenPanel(e){this._navPanel=e,this._navPath=[]}_navBack(){this._navPath.length?this._navPath=this._navPath.slice(0,-1):this._navPanel=""}_navRow(e,t,i,o,s=0){return r`
      <button class="ec-nav-item" @click=${o}>
        <ha-icon class="ec-nav-item-icon" icon=${e}></ha-icon>
        <span class="ec-nav-item-text">
          <span class="ec-nav-item-label">${t}</span>
          ${i?r`<span class="ec-nav-item-hint">${i}</span>`:u}
        </span>
        ${s>0?r`<span class="ec-nav-card-badge"
          title="${s} item${s===1?"":"s"} to review">${s}</span>`:u}
        <ha-icon class="ec-nav-item-chevron" icon="mdi:chevron-right"></ha-icon>
      </button>
    `}_navBtn(e,t,i,o,s=0){return r`
      <button class="ec-nav-card" @click=${()=>this._navPush(e,t,i)}>
        <ha-icon class="ec-nav-card-icon" icon=${o}></ha-icon>
        <span class="ec-nav-card-text">
          <span class="ec-nav-card-label">${t}</span>
          ${i?r`<span class="ec-nav-card-hint">${i}</span>`:u}
        </span>
        ${u}
        <ha-icon class="ec-nav-card-chevron" icon="mdi:chevron-right"></ha-icon>
      </button>
    `}_navMenu(e,t){return r`${e.map(i=>this._navBtn(i.key,i.label,i.hint,i.icon,Ke(t?.root,i.paths)))}`}_clearOverridesBtn(e,t){return u}static _findDef(e,t){return e.find(i=>i.key===t)}_assertOneOwnerInvariant(){if(this._oneOwnerChecked)return;this._oneOwnerChecked=!0;const e=p,t=[],i=(a,n)=>{const l=new Map;for(const c of n)for(const d of c)for(const h of d.paths??[]){const _=l.get(h);_&&_!==d.key?t.push(`${a}: "${h}" claimed by both "${_}" and "${d.key}"`):l.set(h,d.key)}};i("Mosaic Card",[e._CARD_SECTIONS]),i("Zone",[e._ZONE_SECTIONS]),i("Flow",[e._FLOW_SECTIONS]),i("Embedded Card",[e._EMB_SECTIONS]),i("Popover Card",[e._POPOVER_CARD_SECTIONS]),i("Global Defaults",[e._DEFAULTS_SECTIONS,e._CONTROL_DEFAULTS_SECTIONS,e._ELEM_LIB_SECTIONS,e._selectorDefaultsDefs(!1),e._selectorDefaultsDefs(!0)]);const o=[{id:"x",type:"value"},{id:"x",type:"icon"},{id:"x",type:"label"},{id:"x",type:"svg"},{id:"x",type:"svg",svg:"thermometer-vertical.svg"},{id:"x",type:"svg",svg:"battery-horizontal.svg"},{id:"x",type:"svg",svg:"inverter.svg"},{id:"x",type:"svg",svg:"gauge-arc.svg"},{id:"x",type:"graph"},{id:"x",type:"embedded_card"},{id:"x",type:"toggle"},{id:"x",type:"slider"},{id:"x",type:"dropdown"},{id:"x",type:"button_group"},{id:"x",type:"button_group",options_source:"manual"},{id:"x",type:"input"},{id:"x",type:"spinbox"},{id:"x",type:"button"}];for(const a of o){const n=a.type==="button_group"||a.type==="button",l=[];a.type==="button_group"&&(a.options_source??"entity")!=="manual"&&l.push(e._OPTION_LAYOUT_DEF,...e._fscsDefs(!1)),a.type==="button"&&l.push(...e._fscsDefs(!0));const c=n?this._fieldSectionDefs(a).filter(d=>d.key!=="fsec:controlstyle"):this._fieldSectionDefs(a);i(`Field (${a.type}${a.svg?`:${a.svg}`:""}${a.options_source?`:${a.options_source}`:""})`,[c,l])}const s=[{id:"x",name:"x",op:"add",inputs:[]},{id:"x",name:"x",op:"time_until",inputs:[]},{id:"x",name:"x",op:"statistic",inputs:[]}];for(const a of s)i(`Virtual (${a.op})`,[this._virtualSectionDefs(a)]);t.length&&console.error(`[mosaic-canvas-card] #75 one-owner check failed:
${t.join(`
`)}`)}_itemCard(e){const{dragKey:t,icon:i,label:o,sub:s,selected:a,multi:n,onClick:l,actions:c}=e,d=t!=null&&this._dropKey===t;return r`
      <div
        class="ec-item-card${a?" selected":""}${n?" multi":""}${t!=null&&this._dragSrc===t?" ec-dragging":""}${d?this._dropBefore?" ec-drop-before":" ec-drop-after":""}"
        role="button"
        tabindex="0"
        data-drag-key=${t??u}
        @pointerdown=${t!=null?h=>this._onItemPointerDown(h,t):u}
        @pointermove=${t!=null?h=>this._onItemPointerMove(h):u}
        @pointerup=${t!=null?h=>this._onItemPointerUp(h):u}
        @pointercancel=${t!=null?h=>this._onItemPointerCancel(h):u}
        @click=${h=>{if(this._suppressClick){this._suppressClick=!1;return}l(h)}}
        @keydown=${h=>this._onItemCardKeydown(h,t,l)}
      >
        ${t!=null?r`<span class="ec-drag-handle" title="Drag to reorder"></span>`:u}
        <ha-icon class="ec-item-card-icon" icon=${i}></ha-icon>
        <span class="ec-item-card-text">
          <span class="ec-item-card-label">${o}</span>
          ${s?r`<span class="ec-item-card-sub">${s}</span>`:u}
        </span>
        <span class="ec-item-card-actions">${c??u}</span>
        <ha-icon class="ec-item-card-chevron" icon="mdi:chevron-right"></ha-icon>
      </div>
    `}_liveCrumbLabel(e,t){const i=this._config;if(!i)return t;const o=this._navPath[e]?.key??"";if(e===0)switch(this._navPanel){case"mosaic":return o.startsWith("card:")?i.cards[this._selCard]?.name??t:t;case"popover":return o.startsWith("card:")?this._extCards()[this._selExtCard]?.name??t:t;case"flows":return o.startsWith("flow:")?i.flows?.[this._selFlow]?.name??i.flows?.[this._selFlow]?.id??t:t;case"zones":return o.startsWith("zone:")?i.zones?.[this._selZone]?.name??i.zones?.[this._selZone]?.id??t:t;case"virtuals":return o.startsWith("virt:")&&(i.virtuals?.[this._selVirtual]?.name||i.virtuals?.[this._selVirtual]?.id)||t;case"embedded":return o.startsWith("emb:")?i.embedded_cards?.[this._selEmbCard]?.name??i.embedded_cards?.[this._selEmbCard]?.id??t:t;default:return t}const s=a=>this._navPanel==="mosaic"?i.cards[this._selCard]?.fields[a]:this._navPanel==="popover"?this._extCards()[this._selExtCard]?.fields[a]:void 0;if(o.startsWith("field:")){const a=this._navPanel==="mosaic"?i.cards[this._selCard]?.fields:this._navPanel==="popover"?this._extCards()[this._selExtCard]?.fields:void 0,n=s(this._crumbIndex(o,a));return n?this._fieldName(n):t}if(o.startsWith("gs:")||o.startsWith("egs:")){const a=Number(o.slice(o.indexOf(":")+1)),n=this._navPanel==="mosaic"?this._selField:this._selExtField,l=s(n)?.graph_series?.[a];return l&&(l.label||l.entity)||t}if(o.startsWith("opt:")||o.startsWith("eopt:")){const a=Number(o.slice(o.indexOf(":")+1)),n=this._navPanel==="mosaic"?this._selField:this._selExtField,l=s(n)?.options?.[a];return l?p._optionName(l,a):t}return t}_renderBreadcrumb(){const e=[{label:p._TAB_LABEL[this._navTab],onClick:()=>{this._navPanel="",this._navPath=[]}}];return this._navPanel&&(e.push({label:p._PANEL_META[this._navPanel]?.title??this._navPanel,onClick:()=>{this._navPath=[]}}),this._navPath.forEach((t,i)=>e.push({label:this._liveCrumbLabel(i,t.label),onClick:()=>{this._navPath=this._navPath.slice(0,i+1)}}))),r`
      <div class="ec-nav-toolbar">
        <button class="ec-undo-btn" title="Undo (Ctrl+Z)" ?disabled=${!this._undoStack.length} @click=${()=>this._undo()}>
          <ha-icon icon="mdi:undo"></ha-icon>
        </button>
        <button class="ec-undo-btn" title="Redo (Ctrl+Y)" ?disabled=${!this._redoStack.length} @click=${()=>this._redo()}>
          <ha-icon icon="mdi:redo"></ha-icon>
        </button>
        <!-- #93: the one place the tooltip convention is announced. Without it
             a title= that only appears on hover is a feature nobody finds. Not
             a button — there is nothing to click, and a disabled-looking
             control beside Undo/Redo would read as broken. -->
        <span class="ec-help-hint" role="note"
          title="Hover over any option's name to see what it does.">?</span>
      </div>
      <div class="ec-breadcrumb">
        ${e.map((t,i)=>r`
          <button class="ec-crumb${i===e.length-1?" ec-crumb--active":""}" @click=${t.onClick} title=${t.label}>${t.label}</button>
          ${i<e.length-1?r`<ha-icon class="ec-crumb-sep" icon="mdi:chevron-right"></ha-icon>`:u}
        `)}
      </div>
    `}_renderRibbonItems(){return r`${p._RIBBON_ITEMS.filter(e=>e.tab===this._navTab).map(e=>this._navRow(e.icon,e.label,e.hint,()=>this._navOpenPanel(e.panel),e.panel==="health"?this._health().issues.filter(t=>!t.ignored).length:0))}`}_searchIndex(){const e=this._config;if(!e)return[];if(this._searchIndexCache?.cfg===e)return this._searchIndexCache.index;const t=this._buildSearchIndex();return this._searchIndexCache={cfg:e,index:t},t}_buildSearchIndex(){const e=this._config;if(!e)return[];const t=p,i=[],o=d=>({key:d.key,label:d.label,hint:d.hint}),s=(d,h,_,m,g,f,$,R)=>{i.push({tab:d,panel:h,icon:_,label:m,hint:g,context:f,path:$,...R?{terms:R}:{}})},a=(d,h,_,m,g=[])=>{for(const f of m)s(d,h,f.icon,f.label,f.hint,_,[...g,o(f)],f.terms)};for(const d of t._RIBBON_ITEMS)s(d.tab,d.panel,d.icon,t._PANEL_META[d.panel]?.title??d.label,d.hint,t._TAB_LABEL[d.tab],[]);a("settings","canvas","Settings › Canvas",t._CANVAS_SECTIONS),a("settings","defaults","Settings › Global Defaults",t._DEFAULTS_SECTIONS);const n=t._DEFAULTS_SECTIONS.find(d=>d.key==="sec:control");if(n){a("settings","defaults","Global Defaults › Control Default",t._CONTROL_DEFAULTS_SECTIONS,[o(n)]);for(const d of t._CONTROL_DEFAULTS_SECTIONS)d.key!=="cd:selector"&&d.key!=="cd:button"||a("settings","defaults",`Control Default › ${d.label}`,t._selectorDefaultsDefs(d.key==="cd:button"),[o(n),o(d)])}const l=t._DEFAULTS_SECTIONS.find(d=>d.key==="sec:elements");l&&a("settings","defaults","Global Defaults › Element Library",t._ELEM_LIB_SECTIONS,[o(l)]),a("settings","templates","Settings › Templates",t._TEMPLATE_SECTIONS);const c=(d,h,_,m,g,f,$)=>{g.forEach((R,k)=>{const x=this._fieldName(R),C={key:`field:${R.id}`,label:x},S=!$&&this._cardLayoutMode(this._config?.cards[f])==="grid";s("cards",d,ye[R.type],x,this._fieldSub(R,S),`${h} › ${m}`,[_,C]);for(const E of this._fieldSectionDefs(R))if(s("cards",d,E.icon,E.label,E.hint,`${m} › ${x}`,[_,C,o(E)],E.terms),E.key==="fsec:controlstyle"&&(R.type==="button_group"||R.type==="button")&&!this._controlStyleUsesGlobal(R,this._idFor(f,k,$)))for(const F of t._fscsDefs(R.type==="button"))s("cards",d,F.icon,F.label,F.hint,`${x} › ${E.label}`,[_,C,o(E),o(F)],F.terms)})};return(e.cards??[]).forEach((d,h)=>{const _=d.name??`Card ${h+1}`,m={key:`card:${d.id}`,label:_};s("cards","mosaic","mdi:view-dashboard",_,`${d.fields.length} field${d.fields.length===1?"":"s"}`,"Cards › Mosaic Cards",[m]);for(const g of t._CARD_SECTIONS)s("cards","mosaic",g.icon,g.label,g.hint,`Mosaic Cards › ${_}`,[m,o(g)],g.terms);c("mosaic","Mosaic Cards",m,_,d.fields,h,!1)}),this._extCards().forEach((d,h)=>{const _=d.name??`Popover Card ${h+1}`,m={key:`card:${d.id}`,label:_};s("cards","popover","mdi:picture-in-picture-bottom-right",_,`${d.fields.length} field${d.fields.length===1?"":"s"}`,"Cards › Popover Cards",[m]);for(const g of t._POPOVER_CARD_SECTIONS)s("cards","popover",g.icon,g.label,g.hint,`Popover Cards › ${_}`,[m,o(g)],g.terms);c("popover","Popover Cards",m,_,d.fields,h,!0)}),this._embCards().forEach(d=>{const h=d.name??d.id,_={key:`emb:${d.id}`,label:h};s("cards","embedded","mdi:widgets",h,d.card_config?.type??"No card type set","Cards › Embedded External Cards",[_]);for(const m of t._EMB_SECTIONS)s("cards","embedded",m.icon,m.label,m.hint,`Embedded External Cards › ${h}`,[_,o(m)],m.terms)}),this._flows().forEach(d=>{const h=d.name??d.id,_={key:`flow:${d.id}`,label:h};s("elements","flows","mdi:chart-timeline-variant",h,d.style??"dashes","Elements › Animated Flow Lines",[_]);for(const m of t._FLOW_SECTIONS)s("elements","flows",m.icon,m.label,m.hint,`Animated Flow Lines › ${h}`,[_,o(m)],m.terms)}),this._zones().forEach(d=>{const h=d.name??d.id,_={key:`zone:${d.id}`,label:h};s("elements","zones","mdi:gesture-tap-box",h,`${d.width}×${d.height}px`,"Elements › Clickable Zones",[_]);for(const m of t._ZONE_SECTIONS)s("elements","zones",m.icon,m.label,m.hint,`Clickable Zones › ${h}`,[_,o(m)],m.terms)}),this._virtuals().forEach(d=>{const h=d.name||d.id,_={key:`virt:${d.id}`,label:h};s("elements","virtuals",d.op==="time_until"?"mdi:progress-clock":"mdi:memory",h,t._VIRTUAL_OPS.find(m=>m.value===d.op)?.label??d.op,"Elements › Virtual Entities",[_]);for(const m of this._virtualSectionDefs(d))s("elements","virtuals",m.icon,m.label,m.hint,`Virtual Entities › ${h}`,[_,o(m)],m.terms)}),i}_searchResults(e){const t=e.toLowerCase(),i=t.split(/\s+/).filter(Boolean);if(!i.length)return[];const o=[];for(const s of this._searchIndex()){const a=s.label.toLowerCase(),n=s.hint.toLowerCase(),l=s.terms?.toLowerCase()??"",c=s.context.toLowerCase();let d=0,h=0;for(const _ of i)a.includes(_)?(d+=3,h++):n.includes(_)||l.includes(_)?(d+=2,h++):c.includes(_)&&(d+=1);h&&(a===t?d+=4:i.some(_=>a.startsWith(_))&&(d+=2),o.push({r:s,score:d}))}return o.sort((s,a)=>a.score-s.score),o.map(s=>s.r)}_searchNavigate(e){this._searchQuery="",this._searchActive=0,this._navigateTo(e.tab,e.panel,e.path)}_onSearchKeydown(e,t){const i=Math.min(t.length,p._SEARCH_LIMIT)-1,o=Math.max(0,Math.min(this._searchActive,i));if(e.key==="ArrowDown"||e.key==="ArrowUp"){if(e.preventDefault(),i<0)return;this._searchActive=e.key==="ArrowDown"?Math.min(o+1,i):Math.max(o-1,0),this.updateComplete.then(()=>{this.shadowRoot?.querySelector(".ec-search-result.active")?.scrollIntoView({block:"nearest"})})}else if(e.key==="Enter"){const s=t[o];s&&(e.preventDefault(),this._searchNavigate(s))}else e.key==="Escape"&&this._searchQuery&&(e.preventDefault(),e.stopPropagation(),this._searchQuery="",this._searchActive=0)}_renderSearchResults(e){if(!e.length)return r`<p id="ec-search-results" class="ec-empty ec-search-results">No screens match — try a section name or a setting, e.g. "ticks" or "card style".</p>`;const t=e.slice(0,p._SEARCH_LIMIT),i=Math.min(this._searchActive,t.length-1);return r`
      <div id="ec-search-results" class="ec-search-results" role="listbox" aria-label="Search results">
        ${t.map((o,s)=>r`
          <button id=${`ec-search-opt-${s}`} class="ec-nav-card ec-search-result${s===i?" active":""}"
            role="option" aria-selected=${s===i}
            @click=${()=>this._searchNavigate(o)}
            @mousemove=${()=>{this._searchActive!==s&&(this._searchActive=s)}}
          >
            <ha-icon class="ec-nav-card-icon" icon=${o.icon}></ha-icon>
            <span class="ec-nav-card-text">
              <span class="ec-nav-card-label">${o.label}</span>
              ${o.hint?r`<span class="ec-nav-card-hint">${o.hint}</span>`:u}
              <span class="ec-search-result-ctx">${o.context}</span>
            </span>
            <ha-icon class="ec-nav-card-chevron" icon="mdi:chevron-right"></ha-icon>
          </button>
        `)}
        ${e.length>t.length?r`<p class="ec-search-more">${e.length-t.length} more — keep typing to narrow</p>`:u}
      </div>
    `}_renderRibbon(){const e=[{key:"cards",icon:"mdi:view-grid",label:"Cards"},{key:"elements",icon:"mdi:shape",label:"Elements"},{key:"settings",icon:"mdi:cog",label:"Settings"}],t=this._searchQuery.trim(),i=t?this._searchResults(t):[],o=i.length?Math.min(this._searchActive,Math.min(i.length,p._SEARCH_LIMIT)-1):-1,s=Qi(this._health());return r`
      <input class="ec-input ec-nav-search" type="search"
        placeholder="Search all editor screens…"
        aria-label="Search all editor screens"
        role="combobox"
        aria-expanded=${i.length>0?"true":"false"}
        aria-controls="ec-search-results"
        aria-activedescendant=${o>=0?`ec-search-opt-${o}`:u}
        .value=${this._searchQuery}
        @input=${a=>{this._searchQuery=a.target.value,this._searchActive=0}}
        @keydown=${a=>this._onSearchKeydown(a,i)}
      />
      ${t?this._renderSearchResults(i):r`
      <div class="ec-nav-shell">
        <div class="ec-nav-rail">
          ${e.map(a=>r`
            <button class="ec-nav-tab${this._navTab===a.key?" active":""}"
              @click=${()=>{this._navTab=a.key,this._navPanel="",this._navPath=[]}}
            >
              <ha-icon icon=${a.icon}></ha-icon>
              <span>${a.label}</span>
              ${a.key==="settings"&&s>0?r`<span class="ec-nav-tab-badge"
                title="${s} configuration problem${s===1?"":"s"} — see Config Health">${s}</span>`:u}
            </button>
          `)}
        </div>
        <div class="ec-nav-list">${this._renderRibbonItems()}</div>
      </div>`}
    `}_renderPanelHost(){const e=p._PANEL_META[this._navPanel],t=this._navPath.length?this._navPath[this._navPath.length-1].label:e?.title??"";return r`
      <div class="ec-panel-header">
        <button class="ec-panel-back" @click=${()=>this._navBack()}>
          <ha-icon icon="mdi:arrow-left"></ha-icon> ${this._navPath.length?"Back":"Ribbon"}
        </button>
        <ha-icon class="ec-panel-header-icon" icon=${e?.icon??"mdi:tune"}></ha-icon>
        <span class="ec-panel-header-title" tabindex="-1">${t}</span>
        <div class="ec-panel-header-spacer"></div>
      </div>
      <div class="ec-panel-body"
        @scroll=${i=>this._panelScroll.set(this._navScrollKey(),i.target.scrollTop)}
      >
        ${(()=>{const i=this._navPath.length?this._navPath[this._navPath.length-1]?.hint:e?.desc;return i?r`<p class="ec-panel-desc">${i}</p>`:u})()}
        ${this._renderPanelBody()}
      </div>
    `}_renderPanelBody(){switch(this._navPanel){case"mosaic":return this._renderMosaicPanel();case"popover":return this._renderPopoverPanel();case"embedded":return this._renderEmbeddedPanel();case"flows":return this._renderFlowsRibbonPanel();case"zones":return this._renderZonesRibbonPanel();case"virtuals":return this._renderVirtualsRibbonPanel();case"canvas":return this._renderCanvasRibbonPanel();case"defaults":return this._renderDefaultsRibbonPanel();case"templates":return this._renderTemplatesRibbonPanel();case"health":return this._renderHealthPanel();case"about":return this._renderAboutPanel();default:return r``}}_renderAboutPanel(){return r`
      <div class="ec-section ec-about">
        <div class="ec-about-version">Mosaic Canvas Card v${rt} · build ${Qt}</div>
        <a class="ec-about-link" href="https://github.com/ratava/mosaic-canvas-card" target="_blank" rel="noopener">
          <ha-icon icon="mdi:github"></ha-icon> Project repository
        </a>
        <a class="ec-about-link" href="https://ratava.github.io/mosaic-canvas-card/" target="_blank" rel="noopener">
          <ha-icon icon="mdi:book-open-variant"></ha-icon> Documentation
        </a>
        <a class="ec-about-link" href="https://ko-fi.com/brentwesley" target="_blank" rel="noopener">
          <ha-icon icon="mdi:coffee"></ha-icon> Support the project on Ko-fi
        </a>
        <a class="ec-about-kofi" href="https://ko-fi.com/brentwesley" target="_blank" rel="noopener">
          <img
            src="https://storage.ko-fi.com/cdn/useruploads/X8X31ME944/qrcode.png?v=22615b40-eb49-421a-8f13-03b424b5ba97?v=2"
            alt="Support Brent Wesley"
            title="Support Brent Wesley"
            width="60"
            height="60"
          />
        </a>
      </div>
    `}static _slotMap(e){const t=new Map;for(const i of e)for(const o of i.paths??[]){const s=o.split(".")[0];t.has(s)||t.set(s,i.key)}return t}static _labelMap(e){return new Map(e.map(t=>[t.key,t.label]))}_fieldSlotDefs(e){const t=p,i=[...this._fieldSectionDefs(e)];return e.type==="button_group"&&i.push(t._OPTION_LAYOUT_DEF),(e.type==="button_group"||e.type==="button")&&i.push(...t._fscsDefs(e.type==="button")),(e.type==="blank"||e.type==="rule")&&i.push(t._BLANK_RULE_DEF),i}static _healthOffered(){const e=Pe,t=fe;return{field:{type:[...Wt,"graph"],graph_type:Xe.map(i=>i.value),align:t,stat_characteristic:qe.map(i=>i.value)},card:{anchor:e,align:t},extCard:{align:t},zone:{anchor:e},emb:{anchor:e},flow:{style:p._FLOW_STYLES},virtual:{op:p._VIRTUAL_OPS.map(i=>i.value)}}}_healthDefs(e,t){const i=p;switch(e){case"card":return i._CARD_SECTIONS;case"extCard":return i._POPOVER_CARD_SECTIONS;case"zone":return i._ZONE_SECTIONS;case"flow":return i._FLOW_SECTIONS;case"emb":return i._EMB_SECTIONS;case"canvas":return i._CANVAS_SECTIONS;case"field":return this._fieldSlotDefs(t);case"virtual":return this._virtualSectionDefs(t);default:return[]}}_healthContext(){const e=p;return{screens:(t,i)=>{const o=this._healthDefs(t,i);return{slots:e._slotMap(o),labels:e._labelMap(o)}},offered:e._healthOffered(),fieldName:t=>this._fieldName(t)}}_entityExistKey(e){let t="";for(const i of this._referencedEntities())t+=e[i]?"1":"0";return t}_health(){const e=this._config,t=this.hass?.states,i=this._healthCache;if(i&&i.cfg===e&&i.states===t)return i.report;if(i&&i.cfg===e&&t&&i.existKey!==void 0&&i.existKey===this._entityExistKey(t))return i.states=t,i.report;const o=Ji(e,this.hass,this._healthContext());return this._healthCache={cfg:e,states:t,report:o,...t?{existKey:this._entityExistKey(t)}:{}},o}_healthRemovalScope(e){const t=this._config;if(!t)return;const i=(o,s)=>(o??[]).findIndex(a=>a.id===s);switch(e.kind){case"card":{const o=i(t.cards,e.itemId);return o<0?void 0:this._cardScope(o)}case"extCard":{const o=i(this._extCards(),e.itemId);return o<0?void 0:this._extCardScope(o)}case"field":{const o=e.extended?this._extCards():t.cards??[],s=i(o,e.cardId??"");if(s<0)return;const a=i(o[s]?.fields,e.itemId);return a<0?void 0:this._fieldScope(s,a,!!e.extended)}case"zone":{const o=i(this._zones(),e.itemId);return o<0?void 0:this._zoneScope(o)}case"flow":{const o=i(this._flows(),e.itemId);return o<0?void 0:this._flowScope(o)}case"emb":{const o=i(this._embCards(),e.itemId);return o<0?void 0:this._embScope(o)}case"virtual":{const o=i(this._virtuals(),e.itemId);return o<0?void 0:this._virtualScope(o)}default:return}}_healthRemove(e){const t=e.removal;if(!t)return;const i=this._healthRemovalScope(t);if(!i){this._showUndoToast("That item no longer exists — nothing removed");return}const o=i.root?.[t.key];window.confirm(`Remove “${t.key}” from the YAML?

${e.where}
Current value: ${JSON.stringify(o)??"unset"}

The key is deleted from the configuration and the slot falls back to whatever the defaults resolve. This editor has no screen for it, so putting it back means editing the YAML by hand.

Undo (Ctrl+Z) reverses this.`)&&(i.apply({[t.key]:void 0}),this._showUndoToast(`“${t.key}” removed`))}_healthIgnore(e,t){const i=this._config;if(!i)return;const o=i.health_ignore??[],s=t?o.includes(e)?o:[...o,e]:o.filter(a=>a!==e);this._emit(V(i,{health_ignore:s.length?s:void 0})),this._showUndoToast(t?"Row ignored":"Row restored")}_renderHealthPanel(){const e=this._health(),t=e.issues.filter(s=>!s.ignored),i=e.issues.filter(s=>s.ignored),o=Gt.map(s=>({meta:s,rows:t.filter(a=>a.check===s.id)})).filter(s=>s.rows.length>0);return r`
      ${t.length===0?r`<ha-alert alert-type="success">${i.length?"No problems outside the ignored rows below.":"No problems found — every reference in this configuration resolves."}</ha-alert>`:u}
      ${o.map(s=>r`
        <div class="ec-section">
          <div class="ec-subsection-title ec-health-group-title">
            <ha-icon icon=${s.meta.icon}></ha-icon>
            <span>${s.meta.label}</span>
            <span class="ec-nav-card-badge">${s.rows.length}</span>
          </div>
          <p class="ec-hint">${s.meta.hint}</p>
          ${s.rows.map(a=>this._healthRow(a))}
        </div>
      `)}
      ${e.skipped.map(s=>r`<ha-alert alert-type="info">${s.reason}</ha-alert>`)}
      ${i.length?r`
        <div class="ec-section ec-health-ignored">
          <button class="ec-health-ignored-toggle"
            @click=${()=>{this._healthShowIgnored=!this._healthShowIgnored}}
          >
            <ha-icon icon=${this._healthShowIgnored?"mdi:chevron-down":"mdi:chevron-right"}></ha-icon>
            ${i.length} ignored — ${this._healthShowIgnored?"hide":"show"}
          </button>
          ${this._healthShowIgnored?i.map(s=>this._healthRow(s)):u}
        </div>
      `:u}
      ${e.coverage.map(s=>r`<p class="ec-hint ec-health-coverage">${s}</p>`)}
    `}_healthRow(e){const t=e.target;return r`
      <div class="ec-health-row ec-health-row--${e.severity}${e.ignored?" ec-health-row--ignored":""}">
        <button class="ec-health-row-body" ?disabled=${!t}
          title=${t?"Open the screen that owns this":"No screen holds this value"}
          @click=${()=>{t&&this._navigateTo(t.tab,t.panel,t.path)}}
        >
          <ha-icon class="ec-nav-card-icon"
            icon=${e.severity==="error"?"mdi:alert-circle-outline":"mdi:information-outline"}></ha-icon>
          <span class="ec-nav-card-text">
            <span class="ec-nav-card-label">${e.detail}</span>
            <span class="ec-health-row-where">${e.where}</span>
          </span>
          ${t?r`<ha-icon class="ec-nav-card-chevron" icon="mdi:chevron-right"></ha-icon>`:u}
        </button>
        <div class="ec-health-row-actions">
          ${e.removal&&!e.ignored?r`
            <button class="ec-health-btn ec-health-btn-remove"
              title="Delete this key from the YAML"
              @click=${()=>this._healthRemove(e)}
            >Remove</button>`:u}
          <button class="ec-health-btn ec-health-btn-ignore"
            title=${e.ignored?"Show this row again":"Hide this row from the Health screen"}
            @click=${()=>this._healthIgnore(e.id,!e.ignored)}
          >${e.ignored?"Un-ignore":"Ignore"}</button>
        </div>
      </div>
    `}_renderControls(){return r`
      <div class="ec-controls">
        ${this._renderBreadcrumb()}
        ${this._navPanel===""?this._renderRibbon():this._renderPanelHost()}
      </div>
    `}_renderMosaicPanel(){const e=this._config?.cards??[],t=this._navPath;if(t.length===0)return r`
        <div class="ec-section-header">
          <span></span>
          <button class="ec-btn-add" @click=${this._addCard}>+ Mosaic Card</button>
        </div>
        ${e.length===0?this._emptyAdd("No mosaic cards yet — add one",()=>this._addCard()):e.map((a,n)=>this._itemCard({dragKey:`card:${n}`,icon:"mdi:view-dashboard",label:a.name??`Card ${n+1}`,sub:`${a.fields.length} field${a.fields.length===1?"":"s"}`,selected:n===this._selCard,multi:this._selCards.has(n),onClick:l=>{if(l.ctrlKey||l.metaKey){const c=new Set(this._selCards);c.has(n)?c.delete(n):c.add(n),this._selCards=c,this._selCard=n}else this._selCard=n,this._selField=-1,this._selCards=new Set([n]),this._navPush(`card:${a.id}`,a.name??`Card ${n+1}`)},actions:r`
                  ${this._copySourceId===a.id?r`<span class="ec-copy-badge">Copied</span>`:r`<button
                        class="ec-btn-copy"
                        @click=${l=>{l.stopPropagation(),this._copyFields(n)}}
                        title="Copy fields from this card"
                      >⎘</button>`}
                  ${this._copiedFields&&this._copySourceId!==a.id?r`<button
                        class="ec-btn-paste"
                        @click=${l=>{l.stopPropagation(),this._pasteFields(n)}}
                        title="Paste fields onto this card (adds to its existing fields)"
                      >⎗</button>`:u}
                  <button
                    class="ec-btn-dup"
                    @click=${l=>{l.stopPropagation(),this._duplicateCard(n)}}
                    title="Duplicate card"
                  >⧉</button>
                  <button
                    class="ec-btn-remove"
                    @click=${l=>{l.stopPropagation(),this._removeCard(n)}}
                    title="Remove card"
                  >✕</button>
                `}))}
      `;const i=this._crumbIndex(t[0].key,e);this._selCard=i;const o=e[i];if(!o)return this._navDeadEnd();if(t.length===1)return r`
        ${this._cardSectionMenu(i)}
        ${this._renderFieldList(i,o)}
      `;const s=t[1].key;if(s.startsWith("field:")){const a=this._crumbIndex(s,o.fields);this._selField=a;const n=o.fields[a];if(!n)return this._navDeadEnd();if(t.length===4&&t[2].key==="fsec:series"&&t[3].key.startsWith("gs:")){const l=this._crumbIndex(t[3].key,n.graph_series);return this._selSeries=l,this._fieldSecGraphSeriesItem(i,a,n,l)}if(t.length===4&&t[2].key==="fsec:options"){if(t[3].key.startsWith("opt:")){const l=this._crumbIndex(t[3].key,n.options);return this._selOption=l,this._fieldSecOptionItem(i,a,n,l)}if(t[3].key==="optlayout")return r`
            ${this._clearOverridesBtn(p._OPTION_LAYOUT_DEF,this._fieldScope(i,a,!1))}
            <div class="ec-section">${this._optionLayoutEditor(n,this._updFor(i,a,!1),this._idFor(i,a,!1))}</div>
          `}return t.length===4&&t[2].key==="fsec:controlstyle"&&t[3].key.startsWith("fscs:")?this._fieldControlStyleStateSection(i,a,n,t[3].key):t.length===3?this._fieldSection(i,a,n,t[2].key):this._renderFieldPanel(i,a,n)}if(s==="sec:bg"&&t.length===3&&t[2].key.startsWith("bgr:")){const a=this._crumbIndex(t[2].key,o.bg?.rules);return this._selBgRule=a,this._cardSecBgRule(i,o,a)}return this._cardSection(i,o,s)}_cardScope(e){return{root:this._config?.cards[e],apply:t=>this._updateCard(e,t)}}_cardSectionMenu(e){return this._navMenu(p._CARD_SECTIONS,this._cardScope(e))}_cardSection(e,t,i){const o=this._clearOverridesBtn(p._findDef(p._CARD_SECTIONS,i),this._cardScope(e));return r`${o}${(()=>{switch(i){case"sec:defaults":return this._cardSecDefaults(e,t);case"sec:style":return this._cardSecStyle(e,t);case"sec:text":return this._cardSecText(e,t);case"sec:visibility":return this._cardSecVisibility(e,t);case"sec:actions":return this._cardSecActions(e,t);case"sec:bg":return this._cardSecBg(e,t);default:return r``}})()}`}_cardSecDefaults(e,t){return r`
      <div class="ec-section">
        ${this._row("Name",r`<input class="ec-input" type="text" .value=${t.name??""}
            @change=${i=>this._updateCard(e,{name:i.target.value})}
          />`)}

        ${this._row("Canvas Anchor",r`<select class="ec-select"
            .value=${t.anchor??b("anchor")??"top-left"}
            @change=${i=>this._updateCard(e,{anchor:i.target.value})}
          >
            ${Pe.map(i=>r`<option value=${i} .selected=${(t.anchor??b("anchor")??"top-left")===i}>${Ze[i]}</option>`)}
          </select>`,"Which point of the card sits at its X/Y position — drag the card and this is the corner that stays put.")}
        ${this._gridGeom()?r`<p class="ec-hint">In grid mode, this is the point of the card snapped to the nearest grid intersection.</p>`:u}

        ${this._row("Field Alignment",r`<select class="ec-select"
            .value=${t.align??b("align")??"left"}
            @change=${i=>this._updateCard(e,{align:i.target.value})}
          >
            ${fe.map(i=>r`<option value=${i} .selected=${(t.align??b("align")??"left")===i}>${Ie[i]}</option>`)}
          </select>`,"Horizontal alignment of the card's fields within the card.")}

        ${this._cardPlacementRow(e,t)}

        ${this._cardLayoutMode(t)==="grid"?u:this._optRow("Columns","1–8 content columns",t.columns===void 0,r`<select class="ec-select"
            .value=${String(t.columns??b("card_columns")??1)}
            @change=${i=>{const o=Number(i.target.value);this._updateCard(e,{columns:o})}}
          >
            <option value="1" .selected=${(t.columns??b("card_columns")??1)===1}>1</option>
            <option value="2" .selected=${(t.columns??b("card_columns")??1)===2}>2</option>
            <option value="3" .selected=${(t.columns??b("card_columns")??1)===3}>3</option>
            <option value="4" .selected=${(t.columns??b("card_columns")??1)===4}>4</option>
            <option value="5" .selected=${(t.columns??b("card_columns")??1)===5}>5</option>
            <option value="6" .selected=${(t.columns??b("card_columns")??1)===6}>6</option>
            <option value="7" .selected=${(t.columns??b("card_columns")??1)===7}>7</option>
            <option value="8" .selected=${(t.columns??b("card_columns")??1)===8}>8</option>
          </select>`,i=>this._updateCard(e,{columns:i?void 0:t.columns??b("card_columns")??1}))}

        ${this._gridGeom()?this._row("Columns (span)",r`${this._numWrap(r`<input class="ec-input ec-input-num" type="number" min="1" max=${this._gridGeom().cols}
            .value=${String(t.grid_span??1)}
            @change=${i=>{const o=this._gridGeom();if(!o)return;const s=Math.max(1,Math.min(o.cols,Number(i.target.value)||1)),a=Math.max(8,s*o.cellW-o.padding);this._updateCard(e,{grid_span:s,width:a})}}
          />`)}`,"How many grid columns the card covers. Changing it resets Width to match."):u}

        ${this._numRow("Width (px)",{value:t.width,onChange:i=>this._updateCard(e,{width:i}),min:20,placeholder:"auto",hint:"Unset lets the card size itself to its contents."})}

        ${this._gridGeom()?this._row("Rows (span)",r`${this._numWrap(r`<input class="ec-input ec-input-num" type="number" min="1" max=${this._gridGeom().rows}
            .value=${String(t.grid_row_span??1)}
            @change=${i=>{const o=this._gridGeom();if(!o)return;const s=Math.max(1,Math.min(o.rows,Number(i.target.value)||1)),a=Math.max(8,s*o.cellH-o.padding);this._updateCard(e,{grid_row_span:s,height:a})}}
          />`)}`,"How many grid rows the card covers. Changing it resets Height to match."):u}

        ${this._numRow("Height (px)",{value:t.height,onChange:i=>this._updateCard(e,{height:i}),min:20,placeholder:"auto",hint:"Unset lets the card size itself to its contents. In grid field placement this is the height the rows divide up; in flow placement it is only a minimum, so a card can still grow past it."})}

        ${this._cardGridSizeRows(e,t)}

        ${this._optRow("Field gap (px)",this._cardLayoutMode(t)==="grid"?"Space between a field’s own parts":"Vertical space between fields",t.field_gap===void 0,r`${this._numInput({value:t.field_gap??b("field_gap")??4,onChange:i=>this._updateCard(e,{field_gap:i}),min:0})}`,i=>this._updateCard(e,{field_gap:i?void 0:t.field_gap??b("field_gap")??4}))}
        ${this._cardLayoutMode(t)==="grid"?r`<p class="ec-hint">In grid placement the cells space the fields, so this
          only separates a field's own parts — its label from its value, or the lines of a time-until layout.</p>`:u}

        ${this._optRow("Column gap (px)","Space between field columns",t.column_gap===void 0,r`${this._numInput({value:t.column_gap??b("column_gap")??3,onChange:i=>this._updateCard(e,{column_gap:i}),min:0})}`,i=>this._updateCard(e,{column_gap:i?void 0:t.column_gap??b("column_gap")??3}))}

        ${this._cardRowGapRow(e,t)}

        ${this._row("Transparent",r`<input type="checkbox" .checked=${t.transparent??!1}
            @change=${i=>this._updateCard(e,{transparent:i.target.checked||void 0})}
          />`)}
        <p class="ec-hint">Hides the card's box entirely — background, border, shadow and blur. <b>Card Style</b>
          is skipped while this is ticked.</p>
      </div>
    `}_mosaicFieldGap(){const e=this._config?.defaults;return e?.card_field_gap??b("card_field_gap")??e?.field_gap??b("field_gap")??4}_mosaicColumnGap(){const e=this._config?.defaults;return e?.card_column_gap??b("card_column_gap")??e?.column_gap??b("column_gap")??3}_cardLayoutMode(e){return De(e,this._config?.defaults)}_cardGridDefaults(e){const t=this._config?.defaults;return{cols:e.grid?.columns??t?.card_grid_columns??b("card_grid_columns")??4,rows:e.grid?.rows??t?.card_grid_rows??b("card_grid_rows")??4}}_patchCardGrid(e,t,i){const{cols:o,rows:s}=this._cardGridDefaults(t);this._updateCard(e,{grid:{columns:o,rows:s,...t.grid,...i}})}_cardPlacementRow(e,t){const i=this._cardLayoutMode(t),o=i==="grid",s=De(void 0,this._config?.defaults);return this._row("Field placement",r`<select class="ec-select"
        .value=${i}
        @change=${a=>{const n=a.target.value,{cols:l,rows:c}=this._cardGridDefaults(t);this._updateCard(e,{layout_mode:n===s?void 0:n,...n==="grid"&&!t.grid?{grid:{columns:l,rows:c}}:{}})}}
      >
        <option value="flow" .selected=${!o}>Flow</option>
        <option value="grid" .selected=${o}>Grid</option>
      </select>`,"Flow stacks fields in the order they are listed. Grid divides the card into cells and each field names the row and column it sits in. Switching between them keeps both layouts, so it is always reversible.")}_cardGridSizeRows(e,t){if(this._cardLayoutMode(t)!=="grid")return u;const{cols:i,rows:o}=this._cardGridDefaults(t);return r`
      ${this._row("Grid columns",r`${this._numInput({value:i,onChange:s=>this._patchCardGrid(e,t,{columns:Math.max(1,Math.min(8,s??4))}),min:1,max:8})}`,"Kept separate from the flow Columns setting, so switching back restores the layout the card was drawn with.")}

      ${this._row("Grid rows",r`${this._numInput({value:o,onChange:s=>this._patchCardGrid(e,t,{rows:Math.max(1,Math.min(20,s??4))}),min:1,max:20})}`)}
      <p class="ec-hint">The rows divide the card's <b>Height</b>. Without one the card still sizes to its
        contents and the rows will not be even.</p>
    `}_cardRowGapRow(e,t){if(this._cardLayoutMode(t)!=="grid")return u;const i=this._config?.defaults,o=t.grid?.row_gap??i?.card_grid_row_gap??b("card_grid_row_gap")??t.field_gap??i?.field_gap??b("field_gap")??4;return this._optRow("Row gap (px)","Space between grid rows",t.grid?.row_gap===void 0,r`${this._numInput({value:o,onChange:s=>this._patchCardGrid(e,t,{row_gap:s}),min:0})}`,s=>this._patchCardGrid(e,t,{row_gap:s?void 0:o}))}_visibilityRows(e,t){return r`
      ${this._row("Entity",r`<ha-entity-picker
          .hass=${this.hass}
          .value=${e?.entity??""}
          allow-custom-entity
          @value-changed=${i=>{const o=i.detail.value;t(o?{entity:o,operator:e?.operator??"==",value:e?.value??"on"}:void 0)}}
        ></ha-entity-picker>`,"The card is shown or hidden based on this entity's state. Leave blank and the card is always shown.")}
      ${e?r`
        ${this._row("Operator",r`<select class="ec-select"
            .value=${e.operator}
            @change=${i=>t({...e,operator:i.target.value})}
          >
            ${[["==","Equals"],["!=","Not Equal"],[">","Greater Than"],["<","Less Than"],[">=","Greater Than - Equal To"],["<=","Less Than - Equal To"]].map(([i,o])=>r`<option value=${i} .selected=${e.operator===i}>${o}</option>`)}
          </select>`,"How the entity's state is compared with Value below.")}
        ${this._row("Value",r`<input class="ec-input" type="text" .value=${e.value}
            placeholder="on / off / 100 / home …"
            @change=${i=>t({...e,value:i.target.value})}
          />`,"The state to compare against, written exactly as Home Assistant reports it — on, off, a number.")}
      `:u}
    `}_cardSecVisibility(e,t){return r`
      <div class="ec-section">
        ${this._visibilityRows(t.visible_when,i=>this._updateCard(e,{visible_when:i}))}
      </div>
    `}_cardSecStyle(e,t){return r`
      <div class="ec-section">
        ${t.transparent?r`<p class="ec-hint">This card is Transparent (set in Card Defaults) — box style is hidden while transparent.</p>`:r`
        ${this._row("Use global card style",r`<input type="checkbox" .checked=${t.box===void 0}
            @change=${i=>{i.target.checked?this._updateCard(e,{box:void 0}):this._updateCard(e,{box:{}})}}
          />`,"Ticked, this card follows Settings ▸ Global Defaults ▸ Mosaic Card Defaults. Unticking gives it a box of its own, starting empty.")}
        ${t.box!==void 0?r`
          <div class="ec-subsection-title">Box style</div>
          ${this._boxRows(`c${e}`,t.box,i=>this._updateCardBox(e,i))}
        `:u}
        `}
      </div>
    `}_cardSecText(e,t){return r`
      <div class="ec-section">
        ${this._row("Use global value style",r`<input type="checkbox" .checked=${t.value_style===void 0}
            @change=${i=>{i.target.checked?this._updateCard(e,{value_style:void 0}):this._updateCard(e,{value_style:{}})}}
          />`,"Ticked, values on this card follow Settings ▸ Global Defaults ▸ Value Default.")}
        ${t.value_style!==void 0?r`
          <div class="ec-subsection-title">Value text style</div>
          ${this._textRows(`c${e}-vs`,t.value_style,i=>this._updateCard(e,{value_style:{...t.value_style,...i}}))}
        `:u}

        ${this._row("Use global label style",r`<input type="checkbox" .checked=${t.label_style===void 0}
            @change=${i=>{i.target.checked?this._updateCard(e,{label_style:void 0}):this._updateCard(e,{label_style:{}})}}
          />`,"Ticked, labels on this card follow Settings ▸ Global Defaults ▸ Label Default.")}
        ${t.label_style!==void 0?r`
          <div class="ec-subsection-title">Label text style</div>
          ${this._textRows(`c${e}-ls`,t.label_style,i=>this._updateCard(e,{label_style:{...t.label_style,...i}}))}
        `:u}
      </div>
    `}_cardSecActions(e,t){return r`
      <div class="ec-section">
        ${this._actionRows({tap_action:t.tap_action,hold_action:t.hold_action,double_tap_action:t.double_tap_action},i=>this._updateCard(e,i))}
      </div>
    `}_cardSecBg(e,t){const i=t.bg?.rules??[],o=n=>{if(n){this._updateCard(e,{bg:{...t.bg,url:n}});return}const l={...t.bg,url:void 0},c=Object.values(l).every(d=>d==null||Array.isArray(d)&&d.length===0);this._updateCard(e,{bg:c?void 0:l})},s=n=>this._updateCard(e,{bg:{...t.bg,rules:n.length?n:void 0}}),a=!!t.bg?.url||i.some(n=>!!n.url);return r`
      <div class="ec-section">
            ${this._row("Image path",r`<div style="display:flex;gap:4px;align-items:center;">
                <input class="ec-input" type="text" style="flex:1;min-width:0;"
                  .value=${t.bg?.url??""}
                  placeholder="/local/image.png or https://…"
                  @change=${n=>o(n.target.value.trim())}
                />
                ${this._imagePickBtn(n=>o(n))}
              </div>`,t.bg?.entity?"The default image — shown when no rule below matches, or the entity is unavailable. Leave blank for none.":"An image drawn behind this card's fields, under the card box. Leave blank for none.")}

            <div class="ec-subsection-title">Image by state</div>
            ${this._entitySelector({entity:t.bg?.entity,onEntity:n=>this._updateCard(e,{bg:{...t.bg,entity:n||void 0}})})}
            <p class="ec-hint">Leave <b>Entity</b> blank for a single fixed background. Set one and the card shows the image whose rule matches that entity's state — falling back to the <b>Image path</b> above when nothing matches.</p>
            ${t.bg?.entity?r`
              <div class="ec-subsection-title">Rules</div>
              ${i.length===0?this._emptyAdd("No rules yet — add one",()=>s([...i,{}])):i.map((n,l)=>this._itemCard({icon:n.url?"mdi:image-check-outline":"mdi:image-off-outline",label:p._bgRuleName(n,l),sub:p._bgRuleSub(n),selected:l===this._selBgRule,onClick:()=>{this._selBgRule=l,this._navPush(`bgr:${l}`,p._bgRuleName(n,l))},actions:r`
                      <button class="ec-btn-remove" title="Remove rule"
                        @click=${c=>{c.stopPropagation(),s(i.filter((d,h)=>h!==l))}}>✕</button>
                    `}))}
              <div style="display:flex;gap:6px;margin-top:6px;">
                <button class="ec-btn-add" @click=${()=>s([...i,{}])}>+ Rule</button>
              </div>
              <p class="ec-hint">Each rule stands alone — one state value, one image. A value matches the state as text, as a number (<code>21</code> matches <code>21.0</code>) or as a boolean (<code>true</code> matches <code>on</code>).</p>
            `:u}

            ${a?r`
              <div class="ec-subsection-title">Display</div>
              <p class="ec-hint">These apply to whichever image is showing.</p>
              ${this._row("Fit",r`<select class="ec-select"
                  .value=${t.bg?.fit??"cover"}
                  @change=${n=>this._updateCard(e,{bg:{...t.bg,fit:n.target.value}})}
                >
                  <option value="cover"   .selected=${(t.bg?.fit??"cover")==="cover"}>cover (fill &amp; crop)</option>
                  <option value="contain" .selected=${t.bg?.fit==="contain"}>contain (letterbox)</option>
                  <option value="fill"    .selected=${t.bg?.fit==="fill"}>fill (stretch)</option>
                  <option value="none"    .selected=${t.bg?.fit==="none"}>none (natural size)</option>
                </select>`,"Whether the image covers the card and crops, or fits inside it whole.")}
              ${this._row("Opacity",r`${this._numWrap(r`<input class="ec-input ec-input-num" type="number" min="0" max="1" step="0.05"
                  .value=${String(t.bg?.opacity??1)}
                  @change=${n=>{const l=parseFloat(n.target.value);this._updateCard(e,{bg:{...t.bg,opacity:isNaN(l)?void 0:Math.min(1,Math.max(0,l))}})}}
                />`)}`,"How opaque the card's background image is.")}
              ${this._numRow("Width (px)",{value:t.bg?.width,onChange:n=>this._updateCard(e,{bg:{...t.bg,width:n}}),min:1,placeholder:"fill card",hint:"Unset sizes the image to the card."})}
              ${this._numRow("Height (px)",{value:t.bg?.height,onChange:n=>this._updateCard(e,{bg:{...t.bg,height:n}}),min:1,placeholder:"fill card",hint:"Unset sizes the image to the card."})}
              <div class="ec-subsection-title">Padding (px)</div>
              ${this._row("Top / Bottom",r`<div style="display:flex;gap:4px;">
                  ${this._numInput({value:t.bg?.padding_top,onChange:n=>this._updateCard(e,{bg:{...t.bg,padding_top:n}}),min:0,placeholder:"Top"})}
                  ${this._numInput({value:t.bg?.padding_bottom,onChange:n=>this._updateCard(e,{bg:{...t.bg,padding_bottom:n}}),min:0,placeholder:"Bottom"})}
                </div>`,"Vertical position of the image inside the card.")}
              ${this._row("Left / Right",r`<div style="display:flex;gap:4px;">
                  ${this._numInput({value:t.bg?.padding_left,onChange:n=>this._updateCard(e,{bg:{...t.bg,padding_left:n}}),min:0,placeholder:"Left"})}
                  ${this._numInput({value:t.bg?.padding_right,onChange:n=>this._updateCard(e,{bg:{...t.bg,padding_right:n}}),min:0,placeholder:"Right"})}
                </div>`,"Horizontal position of the image inside the card.")}
            `:u}
      </div>
    `}static _libImages(){return p._libCache||(p._libCache=fetch(He+"backgrounds.json").then(e=>e.ok?e.json():{backgrounds:[]}).then(e=>Array.isArray(e?.backgrounds)?e.backgrounds:[]).then(e=>e.filter(t=>typeof t?.file=="string")).catch(()=>[])),p._libCache}_openImagePicker(e){this._pickerTarget=e,this._pickerFolder=void 0,this._pickerTrail=[],this._pickerErr="",this._browseMedia(),p._libImages().then(t=>{this._pickerLib=t})}_closeImagePicker(){this._pickerTarget=void 0}get _pickerHass(){return this.hass}async _browseMedia(e,t,i=!0){this._pickerErr="";try{const o=await this._pickerHass.callWS({type:"media_source/browse_media",...e?{media_content_id:e}:{}});this._pickerFolder=o,e?i&&(this._pickerTrail=[...this._pickerTrail,{id:e,title:t??e}]):this._pickerTrail=[]}catch{this._pickerFolder=void 0,this._pickerErr="The media library could not be opened."}}async _browseMediaUp(){const e=this._pickerTrail.slice(0,-1);this._pickerTrail=e;const t=e[e.length-1];await this._browseMedia(t?.id,t?.title,!1)}async _uploadMedia(e){const t=String(this._pickerFolder?.media_content_id??"");if(!t)return;this._pickerErr="";const i=new FormData;i.append("media_content_id",t),i.append("file",e);try{const o="/api/media_source/local_source/upload";if(!(this._pickerHass.fetchWithAuth?await this._pickerHass.fetchWithAuth(o,{method:"POST",body:i}):await fetch(o,{method:"POST",body:i,headers:{Authorization:`Bearer ${this._pickerHass.auth?.data?.access_token??""}`}})).ok){this._pickerErr="That image could not be uploaded.";return}await this._browseMedia(t,void 0,!1)}catch{this._pickerErr="That image could not be uploaded."}}_imagePickBtn(e){return r`<button class="ec-btn-clear" title="Pick an image"
      style="flex:0 0 auto;"
      @click=${()=>this._openImagePicker(e)}>
      <ha-icon icon="mdi:image-search-outline" style="--mdc-icon-size:18px;"></ha-icon>
    </button>`}_renderImagePickerModal(){if(!this._pickerTarget)return u;const e=this._pickerFolder,t=e?.children??[],i=String(e?.media_content_id??"").startsWith("media-source://media_source/"),o=s=>{this._pickerTarget?.(s),this._closeImagePicker()};return r`
      <div class="ec-lib-backdrop" @click=${()=>this._closeImagePicker()}></div>
      <div class="ec-lib-modal" style="width:min(600px,94vw);">
        <div class="ec-lib-header">
          <span class="ec-lib-title">Select image</span>
          <button class="ec-btn-clear" @click=${()=>this._closeImagePicker()}>✕</button>
        </div>
        <div style="max-height:70vh;overflow-y:auto;padding:12px 16px 16px;">
          ${this._pickerErr?r`<p class="ec-hint" style="color:var(--error-color,#e45649);word-break:break-all;">
            ${this._pickerErr}</p>`:u}

          <div class="ec-subsection-title" style="margin-top:0;">Card library</div>
          <p class="ec-hint" style="margin-top:0;">Backgrounds that come with the card.</p>
          ${this._pickerLib.length===0?r`<p class="ec-hint">The images that ship with the card are not available.</p>`:u}
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px;margin-bottom:16px;">
            ${this._pickerLib.map(s=>r`
              <div role="button" tabindex="0" title=${s.file}
                style="cursor:pointer;border:1px solid var(--divider-color,rgba(0,212,255,0.14));border-radius:8px;overflow:hidden;"
                @click=${()=>o(s.file)}>
                <img src=${He+s.file} alt=${s.name??s.file}
                  style="width:100%;height:66px;object-fit:cover;display:block;" />
                <div class="ec-item-card-sub" style="padding:4px 6px;font-size:11px;">
                  ${s.name??s.file}</div>
              </div>`)}
          </div>

          <div class="ec-subsection-title">Media library</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:8px;">
            <button class="ec-btn-clear" @click=${()=>void this._browseMedia()}>⌂ Root</button>
            ${this._pickerTrail.length?r`<button class="ec-btn-clear" @click=${()=>void this._browseMediaUp()}>↑ Up</button>`:u}
            ${i?r`
              <label class="ec-btn-add" style="cursor:pointer;">
                ⬆ Upload here
                <input type="file" accept="image/*" style="display:none;"
                  @change=${s=>{const a=s.target,n=a.files?.[0];a.value="",n&&this._uploadMedia(n)}} />
              </label>`:u}
          </div>
          ${e?r`
            <p class="ec-hint">
              <b>${String(e.title??"")}</b> · ${t.length}
              item${t.length===1?"":"s"}${i?"":" · this folder is read-only"}
            </p>`:u}
          ${t.map(s=>{const a=String(s.media_content_id??""),n=s.can_expand===!0,l=typeof s.thumbnail=="string"?s.thumbnail:"";return r`
              <div class="ec-item-card" role="button" tabindex="0"
                @click=${()=>{n?this._browseMedia(a,String(s.title??a)):o(a)}}>
                ${n||!l?r`<ha-icon class="ec-item-card-icon"
                      icon=${n?"mdi:folder-outline":"mdi:file-image-outline"}></ha-icon>`:r`<img src=${l} alt="" loading="lazy"
                      style="width:34px;height:34px;object-fit:cover;border-radius:4px;flex:0 0 auto;"
                      @error=${c=>{c.target.style.display="none"}} />`}
                <span class="ec-item-card-text">
                  <span class="ec-item-card-label">${String(s.title??a)}</span>
                </span>
              </div>`})}
        </div>
      </div>
    `}static _bgRuleName(e,t){return e.value?.trim()||`Rule ${t+1}`}static _bgRuleSub(e){return e.url?e.url.split("/").pop()||e.url:"no image"}_cardSecBgRule(e,t,i){const o=t.bg?.rules??[],s=o[i];if(!s)return this._navDeadEnd();const a=l=>this._updateCard(e,{bg:{...t.bg,rules:o.map((c,d)=>d===i?{...c,...l}:c)}}),n=t.bg?.entity?this.hass?.states[t.bg.entity]?.state:void 0;return r`
      <div class="ec-section">
        ${this._row("Value",r`<input class="ec-input" type="text"
            .value=${s.value??""}
            placeholder=${n??"e.g. on, 21, heat"}
            @change=${l=>a({value:l.target.value.trim()||void 0})}
          />`,"The entity state this rule matches. Text, a number, or a boolean.")}
        ${n!=null?r`<p class="ec-hint">${t.bg?.entity} is currently <b>${n}</b>.</p>`:u}
        ${this._row("Image path",r`<div style="display:flex;gap:4px;align-items:center;">
            <input class="ec-input" type="text" style="flex:1;min-width:0;"
              .value=${s.url??""}
              placeholder="/local/image.png or https://…"
              @change=${l=>a({url:l.target.value.trim()||void 0})}
            />
            ${this._imagePickBtn(l=>a({url:l}))}
          </div>`,"Shown while the state matches. Leave blank to skip this rule.")}
      </div>
    `}_fieldName(e){return e.display_name??e.text??(e.entity?.startsWith("virtual:")?this._virtuals().find(t=>`virtual:${t.id}`===e.entity)?.name??e.entity:this.hass?.states[e.entity??""]?.attributes?.friendly_name??e.entity)??e.icon??"(untitled field)"}_fieldSub(e,t=!1){const i=e.type==="graph"&&e.graph_type?e.graph_type:e.type==="svg"&&(e.shape||e.svg)?e.shape??e.svg.split("/").pop()?.replace(/\.svg$/i,"")??"":e.type==="embedded_card"&&e.embed_card_config?.type?String(e.embed_card_config.type):"",o=(n,l,c)=>l!=null?`${n}${l}${c!=null&&c>l?`-${c}`:""} · `:"",s=o("C",e.column,e.column_end),a=t?e.row!=null?o("R",e.row,e.row_end):"R auto · ":"";return`${s}${a}${ge[e.type]}${i?" · "+i:""}`}_renderFieldList(e,t){const i=t.fields,o=this._cardLayoutMode(t)==="grid";return r`
      <div class="ec-section ec-section--fields">
        <div class="ec-section-header">
          <span class="ec-section-title">Fields</span>
          ${this._copiedField?r`<button class="ec-btn-paste"
            @click=${()=>this._pasteField(e)}
            title="Paste copied field onto this card">⎗ Field</button>`:u}
          <button class="ec-btn-add" @click=${()=>this._addField(e)}>+ Field</button>
        </div>
        ${this._listFilterBox(i.length)}
        ${i.length===0?this._emptyAdd("No fields yet — add one",()=>this._addField(e)):i.map((s,a)=>({f:s,fi:a})).filter(({f:s})=>{const a=this._currentListFilter();return!a||`${this._fieldName(s)} ${this._fieldSub(s,o)}`.toLowerCase().includes(a)}).map(({f:s,fi:a})=>this._itemCard({dragKey:`field:${e}:${a}`,icon:ye[s.type],label:this._fieldName(s),sub:this._fieldSub(s,o),selected:a===this._selField,onClick:()=>{this._selField=a,this._navPush(`field:${s.id}`,`Field ${a+1}`)},actions:r`
                  ${this._copiedFieldSrc?.isExt===!1&&this._copiedFieldSrc.cardId===t.id&&this._copiedFieldSrc.fieldId===s.id?r`<span class="ec-copy-badge">Copied</span>`:r`<button class="ec-btn-copy"
                        @click=${n=>{n.stopPropagation(),this._copyField(e,a,!1)}}
                        title="Copy this field">⎘</button>`}
                  <button class="ec-btn-dup"
                    @click=${n=>{n.stopPropagation(),this._duplicateField(e,a,!1)}}
                    title="Duplicate field">⧉</button>
                  <button class="ec-btn-remove"
                    @click=${n=>{n.stopPropagation(),this._removeField(e,a)}}
                    title="Remove">✕</button>
                `}))}
      </div>
    `}_isTimeUntilVirtual(e){if(!e.entity?.startsWith("virtual:"))return!1;const t=e.entity.slice(8);return this._config?.virtuals?.find(i=>i.id===t)?.op==="time_until"}_displayUnit(e,t){if(t!==void 0)return t;if(!e||e.startsWith("virtual:")||!this.hass)return"";const i=this.hass.states[e];if(!i)return"";const o=i.attributes?.unit_of_measurement??"";if((i.attributes?.device_class??"")==="power"){const a=this._config?.defaults?.power_unit;return a==="W"||a==="kW"?a:"W or kW"}return o==="kWh"||o==="MWh"?"kWh or MWh":o}_entityDecimalsHint(e){if(!e||e.startsWith("virtual:")||!this.hass)return;const i=this.hass.states[e]?.state?.match(/^-?\d+\.(\d+)$/);return i?i[1].length:void 0}_defaultStatType(e){if(!e||e.startsWith("virtual:")||!this.hass)return;const t=this.hass.states[e]?.attributes;if(!t)return;const i=t.state_class;if(i==="total"||i==="total_increasing")return"sum";if(i==="measurement")return"mean";const o=t.device_class;if(o&&p._SUM_DEVICE_CLASSES.has(o))return"sum"}_isThermometerSvg(e){return!!e.svg?.toLowerCase().includes("thermometer")}_isHorizontalThermometerSvg(e){return!!e.svg?.toLowerCase().includes("thermometer-horizontal")}_isBatterySvg(e){return!!e.svg?.toLowerCase().includes("battery")}_isInverterSvg(e){return!!e.svg?.toLowerCase().includes("inverter")}_isGaugeSvg(e){return!!e.svg?.toLowerCase().includes("gauge")}_elementLabel(e){return e.type==="graph"?Xe.find(t=>t.value===e.graph_type)?.label??e.graph_type??"Graph":e.svg?(e.svg.split("/").pop()?.replace(/\.svg$/i,"")??"").replace(/[-_]/g," ").replace(/\b\w/g,i=>i.toUpperCase())||"SVG element":"None selected"}_renderTuLayoutBuilder(e,t,i,o){const s=this._updFor(e,t,o),a=i.time_until_layout??[],n=h=>s({time_until_layout:[...a,h]}),l=h=>{const _=a.filter((m,g)=>g!==h);s({time_until_layout:_.length?_:void 0})},c=(h,_)=>{const m=[...a];m[h]={...m[h],..._},s({time_until_layout:m})},d=h=>h.type==="label"?r`<span class="ec-tu-chip ec-tu-chip--label">⏱ Time Until Label</span>`:h.type==="value"?r`<span class="ec-tu-chip ec-tu-chip--value">⟨value⟩</span>`:h.type==="newline"?r`<span class="ec-tu-chip ec-tu-chip--newline">↵ New Line</span>`:u;return r`
      <div class="ec-subsection-title">Time Until Layout</div>
      ${a.length===0?r`<p class="ec-empty">No items — use the buttons below to build the layout.</p>`:a.map((h,_)=>{const m=`${o?"etu":"tu"}:${e}:${t}:${_}`;return r`
            <div
              class="ec-list-row${this._dragSrc===m?" ec-dragging":""}${this._dropKey===m?this._dropBefore?" ec-drop-before":" ec-drop-after":""}"
              tabindex="0"
              data-drag-key=${m}
              @pointerdown=${g=>{g.target.closest(".ec-drag-handle")&&this._onItemPointerDown(g,m)}}
              @pointermove=${g=>this._onItemPointerMove(g)}
              @pointerup=${g=>this._onItemPointerUp(g)}
              @pointercancel=${g=>this._onItemPointerCancel(g)}
              @keydown=${g=>this._onItemCardKeydown(g,m,()=>{})}
            >
              <span class="ec-drag-handle" title="Drag to reorder"></span>
              <span class="ec-list-label" style="flex:1;min-width:0;">
                ${h.type==="text"?r`<input class="ec-input" type="text" .value=${h.text??""}
                      placeholder="enter text"
                      @input=${g=>c(_,{text:g.target.value})}
                      style="width:100%;box-sizing:border-box;" />`:d(h)}
              </span>
              <button class="ec-btn-remove" @click=${()=>l(_)} title="Remove">✕</button>
            </div>
          `})}
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;">
        <button class="ec-btn-add" @click=${()=>n({type:"text",text:""})}>+ Text</button>
        <button class="ec-btn-add" @click=${()=>n({type:"label"})}>+ Label</button>
        <button class="ec-btn-add" @click=${()=>n({type:"newline"})}>↵ New Line</button>
        <button class="ec-btn-add" @click=${()=>n({type:"value"})}>+ Value</button>
      </div>
    `}_fieldHeader(e,t,i,o){const s=this._cardLayoutMode(o)==="grid",{cols:a,rows:n}=this._cardGridDefaults(o??{});return r`
        ${this._row("Type",r`<select class="ec-select"
            .value=${i.type==="graph"?"svg":i.type}
            @change=${l=>{const c=l.target.value;if(J(c)){const d=bt(c);if(d&&!this._confirmVariantOptionLoss(i,c,d)){l.target.value=i.type==="graph"?"svg":i.type;return}this._updateField(e,t,this._typeChangePatch(i,c,d?Se(c,d):{}))}else{if(!this._confirmTypeOptionLoss(i,c)){l.target.value=i.type==="graph"?"svg":i.type;return}this._updateField(e,t,this._typeChangePatch(i,c)),c==="svg"&&this._openGGPicker(e,t)}}}
          >
            ${Tt.map(l=>r`<option value=${l} .selected=${(i.type==="graph"?"svg":i.type)===l}>${ge[l]}</option>`)}
          </select>`,"What kind of field this is. Changing it keeps the entity and drops settings the new type has no use for.")}

        ${J(i.type)&&We(i.type).length>1?this._row("Variant",r`<select class="ec-select"
            .value=${i.variant??""}
            @change=${l=>{const c=l.target.value;if(!this._confirmVariantOptionLoss(i,i.type,c)){l.target.value=i.variant??"";return}this._updateField(e,t,Se(i.type,c))}}
          >
            ${this._variantOptions(i.type,i.variant)}
          </select>`,"A saved bundle of settings for this control type. Custom variants are built under Settings ▸ Global Defaults ▸ Control Default ▸ Variant Builder."):u}

        ${i.type==="svg"||i.type==="graph"?this._row("Element",r`<div style="display:flex;gap:8px;align-items:center;">
            <span class="ec-input" style="flex:1;min-width:0;opacity:0.85;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${this._elementLabel(i)}</span>
            <button class="ec-lib-browse-btn" style="flex:0 0 auto;white-space:nowrap;" @click=${()=>this._openGGPicker(e,t)}>Select SVG Element</button>
          </div>`,"Which graphic this field draws. Opens the Element Library picker."):u}

        ${this._row("Display Name",r`<input class="ec-input" type="text"
            .value=${i.display_name??""}
            placeholder=${(i.entity&&!i.entity.startsWith("virtual:")?this.hass?.states[i.entity]?.attributes?.friendly_name:void 0)??"Friendly name for the field list"}
            @change=${l=>{const c=l.target.value.trim();this._updateField(e,t,{display_name:c===""?void 0:c})}}
          />`,"Names the field in the editor's lists only — it is not shown on the card.")}

        ${this._fieldAxisRow(e,t,i,"column",s?a:8)}

        ${s?this._fieldAxisRow(e,t,i,"row",n):u}
    `}_fieldAxisRow(e,t,i,o,s){const a=o,n=o==="column"?"column_end":"row_end",l=o==="column"?"column":"row",c=i[a],d=i[n],h=_=>m=>{const g=m.target.value;this._updateField(e,t,{[_]:g===""?void 0:Number(g)})};return this._row(o==="column"?"Column":"Row",r`<div style="display:flex;gap:4px;align-items:center">
        ${this._numWrap(r`<input class="ec-input ec-input-num-small" type="number" min="1" max=${s}
          .value=${c!=null?String(c):""}
          placeholder="auto"
          title=${`The ${l} this field sits in. Blank lets it flow into the next free one.`}
          @change=${h(a)}
        />`)}
        <span style="font-size:11px;opacity:0.6">Span end (Opt)</span>
        ${this._numWrap(r`<input class="ec-input ec-input-num-small" type="number" min="2" max=${s}
          .value=${d!=null?String(d):""}
          placeholder="–"
          title=${`The last ${l} this field reaches, to span several. Blank keeps it in one.`}
          @change=${h(n)}
        />`)}
      </div>`,`Which of the card’s ${l}s this field sits in, and how many it spans. Each box has its own note.`)}_renderFieldPanel(e,t,i){return i.type==="blank"||i.type==="rule"?r`
        <div class="ec-section ec-section--fields">
          ${this._fieldHeader(e,t,i,this._config?.cards[e])}
          ${this._fieldSecBlankOrRule(e,t,i)}
        </div>
      `:r`
      <div class="ec-section ec-section--fields">
        ${this._fieldHeader(e,t,i,this._config?.cards[e])}
        ${this._fieldSectionMenu(i,e,t,!1)}
      </div>
    `}static _controlStylePathsFor(e){if(e==="button_group"||e==="button"){const i=e==="button"?"btn":"sel";return[...p._containerPathsForField(i),...le["sub:active"][i],...le["sub:inactive"][i]]}const t=pe;return[...pe.accent,...t[e]??[]]}static _containerPathsForField(e){return e==="btn"?_o:le["sub:container"].sel}_fieldSectionDefs(e){const t=p,i=[],o=()=>{e.type==="button_group"&&(e.options_source??"entity")==="manual"||i.push({key:"fsec:control",label:"Entity & Action",hint:"Controlled entity + write action",icon:"mdi:database",terms:Oe,paths:["entity","read_attribute","control_service"]})},s=(a="Colors & container (override global)")=>{i.push({key:"fsec:controlstyle",label:"Control Style",hint:a,icon:"mdi:palette",paths:[...A("control_style",t._controlStylePathsFor(e.type)),...A("control_box",ho)]})};if(e.type==="value")i.push({key:"fsec:source",label:"Value Source",hint:"Entity, virtual entity, time-until layout",icon:"mdi:database",paths:["entity","attribute"]}),i.push({key:"fsec:label",label:"Value Label",hint:"Optional label text, position & icon",icon:"mdi:tag-text-outline",terms:"icon entity override mdi left right above below no icon position",paths:["label","label_position","label_column","icon","icon_position"]});else if(e.type==="icon")i.push({key:"fsec:icon",label:"Icon",hint:"Icon, entity, state rules & icon set",icon:"mdi:emoticon-outline",terms:"entity attribute state rule rules by state mdi match value use state value weather alt alternate prefix icon set collection iconify custom icons wi phu",paths:["icon","entity","attribute","icon_rules","icon_use_state","icon_prefix"]});else if(e.type==="label")i.push({key:"fsec:content",label:"Content",hint:"Label text & icon",icon:"mdi:format-text",terms:"icon mdi left right above below position",paths:["text","icon","icon_position"]});else if(e.type==="svg")i.push({key:"fsec:source",label:"Value Source",hint:"Entity, fill source",icon:"mdi:database",paths:["entity","attribute","charging_entity","charging_attribute","tank_pct_entity","tank_pct_attribute","tank_volume_entity","tank_volume_attribute","tank_capacity_entity","tank_capacity_attribute"]}),this._isInverterSvg(e)||i.push({key:"fsec:range",label:"Range",hint:"Min / max value",icon:"mdi:arrow-expand-vertical",paths:["min","max"]}),i.push({key:"fsec:colors",label:"Colors",hint:"Fill direction, fill, gradient, svg color",icon:"mdi:palette",terms:"direction up down left right graduated tank line gradient angle degrees",paths:["fill_direction","fill_color","fill_color2","fill_angle","tank_color"]}),i.push({key:"fsec:size",label:"Size",hint:"Height, width",icon:"mdi:resize",paths:["width","height"]}),this._isInverterSvg(e)||i.push({key:"fsec:thresholds",label:"Color Thresholds",hint:"Value-driven fill color overrides",icon:"mdi:format-color-fill",paths:["thresholds"]}),this._isGaugeSvg(e)&&i.push({key:"fsec:gauge",label:"Gauge Labels",hint:"Min/max labels, value display",icon:"mdi:speedometer",terms:"size color centre center show current",paths:["gauge_min_label","gauge_max_label","gauge_show_value","gauge_label_size","gauge_label_color"]}),this._isThermometerSvg(e)&&i.push({key:"fsec:thermo",label:"Thermometer",hint:"Ticks, grid, temperature text",icon:"mdi:thermometer",terms:nt,paths:t._THERMO_PATHS});else if(e.type==="graph"){i.push({key:"fsec:graph",label:"Graph Settings",hint:"Type, axes, legend, range, size",icon:"mdi:chart-bar",terms:"type axes legend min max width height stroke fill opacity x axis label title window bar line stacked timeline gauge needle zero baseline gridlines ticks decimals precision unit title curve smooth smoothed step stepped straight points markers dots latest last value horizontal sideways bar labels legend position above below left right gauge tick marks sweep degrees arc caption refresh poll interval update state names unavailable unknown entity name label",paths:["graph_type","graph_show_axes","graph_show_legend","graph_min","graph_max","graph_stroke_width","graph_fill_opacity","width","height","graph_include_zero","graph_tick_count","graph_precision","graph_unit","graph_y_title","graph_x_title","graph_curve","graph_points","graph_last_point","graph_bar_labels","graph_legend_position","graph_gauge_ticks","graph_gauge_sweep","graph_gauge_label","graph_refresh_minutes","graph_show_state_names","graph_unavailable_color","graph_timeline_label"]}),i.push({key:"fsec:graphdata",label:"Graph Data",hint:"Window, sample period, calculation",icon:"mdi:database-clock",terms:"stat statistic statistics period window sample resolution bucket buckets data points 5 five minute minutes 30 thirty hour hourly day daily week weekly month monthly year yearly auto today yesterday last rolling calendar n days mean average min minimum max maximum sum total state change calculation recorder history hours depth",paths:["graph_stat_period","graph_stat_period_n","graph_sample_period","graph_stat_type"]}),i.push({key:"fsec:series",label:"Series",hint:"Entities plotted on the graph",icon:"mdi:chart-line",paths:["graph_series"]});const a=Me(e.graph_type??b("graph_type")??"bar");a.timeline&&i.push({key:"fsec:graphstates",label:"State Colors",hint:"A colour per state name",icon:"mdi:palette-swatch",terms:"state states colour color map on off open closed home away heat cool timeline",paths:["graph_state_colors","graph_unavailable_color","graph_show_state_names"]}),a.gauge&&i.push({key:"fsec:graphbands",label:"Color Bands",hint:"Value-driven arc colours",icon:"mdi:format-color-fill",terms:"threshold thresholds band bands arc colour color level gauge",paths:["graph_thresholds"]}),i.push({key:"fsec:graphchrome",label:"Graph Style",hint:"Axis, grid, labels, gauge track, palette",icon:"mdi:format-paint",terms:"axis grid gridline zero baseline label labels tick ticks values numbers dates categories unit legend track gauge palette colour color size chrome",paths:t._GRAPH_CHROME_PATHS})}else e.type==="embedded_card"?i.push({key:"fsec:embed",label:"Embedded Card",hint:"Card type, width, transparency",icon:"mdi:widgets",paths:["embed_card_config","width","embed_transparent","extra_css"]}):e.type==="toggle"?(o(),s()):e.type==="slider"?(o(),i.push({key:"fsec:sliderrange",label:"Range",hint:"Min / max / step, show value, unit",icon:"mdi:arrow-expand-horizontal",paths:["min","max","step","unit","show_value"]}),s()):e.type==="dropdown"||e.type==="button_group"?(o(),e.type==="button_group"&&(e.options_source??"entity")==="manual"&&i.push({key:"fsec:variant",label:"Variant",hint:"Save this field as a reusable variant",icon:"mdi:shape-plus",terms:"variant preset save custom reuse template"}),i.push({key:"fsec:options",label:"Options",hint:"Option source & manual list",icon:"mdi:format-list-bulleted",paths:["options_source","options_attribute","options","placeholder"]}),s()):e.type==="input"?(o(),i.push({key:"fsec:input",label:"Input",hint:"Mode, submit timing, placeholder",icon:"mdi:form-textbox",paths:["submit_on","placeholder","input_maxlength","input_password"]}),s()):e.type==="spinbox"?(o(),i.push({key:"fsec:sliderrange",label:"Range",hint:"Min / max / step, unit",icon:"mdi:arrow-expand-horizontal",paths:["min","max","step","unit","spinbox_decimals"]}),s()):e.type==="button"&&(o(),i.push({key:"fsec:options",label:"Button Layout",hint:"Icon & state position, text styles",icon:"mdi:gesture-tap-button",paths:["label","icon","button_value",...p._OPTION_LAYOUT_KEYS,...A("control_style",ht)]}),s("Colors, border, padding (override global)"));if(J(e.type)&&i.push({key:"fsec:labels",label:"Labels",hint:"Icon + text rows around the control",icon:"mdi:label-outline",paths:["control_labels","control_labels_position","control_labels_gap","align"]}),e.type==="slider"&&i.push({key:"fsec:sliderpoints",label:"Track Labels",hint:"Left / center / right labels",icon:"mdi:format-horizontal-align-center",paths:["slider_labels"]}),e.type==="value"?(i.push({key:"fsec:stats",label:"HA Statistics",hint:"Advanced statistics integration",icon:"mdi:chart-box-outline",paths:t._STAT_PATHS}),i.push({key:"fsec:display",label:"Display",hint:"Unit, decimals, hide below",icon:"mdi:eye-outline",paths:["unit","decimals","hide_below","show_time_until_label"]})):e.type==="icon"&&i.push({key:"fsec:visibility",label:"Visibility",hint:"Hide below a value",icon:"mdi:eye-outline",terms:"hide below threshold visible visibility show minimum",paths:["hide_below"]}),e.type!=="embedded_card"&&e.type!=="blank"&&e.type!=="rule"){const a=[...A("style",po),"extra_css"];J(e.type)||a.push("align"),i.push({key:"fsec:style",label:"Text Style",hint:"Align & value/label text style",icon:"mdi:format-title",terms:xe,paths:a}),J(e.type)||i.push({key:"fsec:actions",label:"Actions",hint:"Tap · hold · double tap",icon:"mdi:gesture-tap",terms:Oe,paths:ct})}return i}_fieldScope(e,t,i){const o=this._updFor(e,t,i);return{root:(i?this._extCards()[e]:this._config?.cards[e])?.fields[t],apply:o}}_fieldSectionMenu(e,t=-1,i=-1,o=!1){return this._navMenu(this._fieldSectionDefs(e),t<0?void 0:this._fieldScope(t,i,o))}_fieldSection(e,t,i,o,s=!1){return r`
      ${this._clearOverridesBtn(p._findDef(this._fieldSectionDefs(i),o),this._fieldScope(e,t,s))}
      ${this._fieldSectionBody(e,t,i,o,s)}
    `}_fieldSectionBody(e,t,i,o,s){switch(o){case"fsec:source":return i.type==="svg"?this._fieldSecSvgSource(e,t,i,s):this._fieldSecValueSource(e,t,i,s);case"fsec:control":return this._fieldSecControlSource(e,t,i,s);case"fsec:variant":return this._fieldSecVariant(e,t,i,s);case"fsec:embed":return this._fieldSecEmbed(e,t,i,s);case"fsec:sliderrange":return this._fieldSecSliderRange(e,t,i,s);case"fsec:options":return this._fieldSecOptions(e,t,i,s);case"fsec:input":return this._fieldSecInput(e,t,i,s);case"fsec:controlstyle":return this._fieldSecControlStyle(e,t,i,s);case"fsec:labels":return this._fieldSecControlLabels(e,t,i,s);case"fsec:sliderpoints":return this._fieldSecSliderPoints(e,t,i,s);case"fsec:label":return this._fieldSecValueLabel(e,t,i,s);case"fsec:icon":return this._fieldSecIcon(e,t,i,s);case"fsec:content":return this._fieldSecLabelContent(e,t,i,s);case"fsec:range":return this._fieldSecSvgRange(e,t,i,s);case"fsec:colors":return this._fieldSecSvgColors(e,t,i,s);case"fsec:size":return this._fieldSecSvgSize(e,t,i,s);case"fsec:thresholds":return this._fieldSecSvgThresholds(e,t,i,s);case"fsec:gauge":return this._fieldSecSvgGauge(e,t,i,s);case"fsec:thermo":return this._fieldSecSvgThermo(e,t,i,s);case"fsec:graph":return this._fieldSecGraphSettings(e,t,i,s);case"fsec:graphdata":return this._fieldSecGraphData(e,t,i,s);case"fsec:series":return this._fieldSecGraphSeries(e,t,i,s);case"fsec:graphstates":return this._fieldSecGraphStates(e,t,i,s);case"fsec:graphbands":return this._fieldSecGraphBands(e,t,i,s);case"fsec:graphchrome":return this._fieldSecGraphChrome(e,t,i,s);case"fsec:stats":return this._fieldSecStats(e,t,i,s);case"fsec:display":return this._fieldSecDisplay(e,t,i,s);case"fsec:visibility":return this._fieldSecVisibility(e,t,i,s);case"fsec:style":return this._fieldSecStyle(e,t,i,s);case"fsec:actions":return this._fieldSecActions(e,t,i,s);default:return r``}}_fieldSecBlankOrRule(e,t,i,o=!1){const s=this._updFor(e,t,o);return i.type!=="blank"?r`<p class="ec-hint">Horizontal rule — no options.</p>`:r`
        ${this._numRow("Gap (px)",{value:i.blank_gap,onChange:a=>s({blank_gap:a}),min:0,placeholder:"10"})}
    `}_updFor(e,t,i){return o=>i?this._updateExtField(e,t,o):this._updateField(e,t,o)}_fieldSecEmbed(e,t,i,o=!1){const s=this._updFor(e,t,o),a=o?{kind:"extfield",ci:e,fi:t}:{kind:"field",ci:e,fi:t},n=i.embed_card_config?.type?String(i.embed_card_config.type):"";return r`
      <div class="ec-section">
        ${this._row("Card Type",r`<span style="flex:1;min-width:0;font-family:monospace;font-size:12px;color:#5aadcc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            ${n||r`<span style="color:#555;font-style:italic;">not set</span>`}
          </span>`,"Which Home Assistant card is embedded in this field.")}
        <div style="margin-top:8px;display:flex;gap:6px;">
          <button class="ec-btn-add" style="flex:1;" @click=${()=>this._openEmbPicker(a)}>
            ${n?"Change Type":"Pick Card Type"}
          </button>
          <button class="ec-btn-add" style="flex:1;" @click=${()=>void this._openEmbEditor(a)}>
            Edit Config…
          </button>
        </div>
        ${this._row("Width (px)",r`${this._numWrap(r`<input class="ec-input ec-input-num" type="number" min="20"
            .value=${String(i.width??300)}
            @change=${l=>s({width:Number(l.target.value)})}
          />`)}`,"How wide the embedded card is drawn. Unset lets it fill the field's column.")}
        <p class="ec-hint">Height is automatic — the embedded card sizes itself.</p>
        ${this._row("Transparent",r`<input type="checkbox" .checked=${i.embed_transparent??!1}
            @change=${l=>s({embed_transparent:l.target.checked})}
          />`)}
        <p class="ec-hint">Strips the embedded card's own background, border and shadow, so the Mosaic card
          behind it shows through. It paints nothing of its own.</p>
        ${this._cssRow(i.extra_css,l=>s({extra_css:l}))}
      </div>
    `}_idFor(e,t,i){const s=(i?this._extCards()[e]:this._config?.cards[e])?.fields[t]?.id,a=i?"e":"c";return s?`${a}${s}`:`${a}${e}f${t}`}_derivedService(e){const t=e.entity?.split(".")[0];if(!t)return"";const i=(...o)=>o.includes(t);switch(e.type){case"toggle":case"button":return"homeassistant.turn_on / turn_off";case"slider":case"spinbox":return i("input_number","number","counter")?`${t}.set_value`:"";case"dropdown":case"button_group":case"input":return i("input_select","select")?`${t}.select_option`:i("input_text","text")?`${t}.set_value`:"";default:return""}}_fieldSecControlSource(e,t,i,o=!1){const s=this._updFor(e,t,o),a=this._derivedService(i);return r`
      <div class="ec-section">
        ${this._entitySelector({entity:i.entity,onEntity:n=>s({entity:n}),attribute:i.read_attribute,onAttribute:n=>s({read_attribute:n}),attributePlaceholder:ei(i.options_attribute)})}
        <p class="ec-hint">The entity this control reads its value from and writes back to.</p>

        <div class="ec-subsection-title">When the value changes</div>
        <p class="ec-hint">Leave blank to drive the entity from its domain — a light toggles, an <code>input_number</code> takes a value, an <code>input_select</code> picks an option. Set one only when you need something else, e.g. <code>light.turn_on</code> to drive brightness rather than on/off. Variants like Brightness and Volume fill this in for you.</p>
        <p class="ec-hint">An option with its own entity ignores this and always uses that entity's domain default.</p>
        ${this._row("Action",r`<ha-service-picker
          .hass=${this.hass}
          .value=${i.control_service??""}
          placeholder=${a||"no automatic action for this entity"}
          @value-changed=${n=>{const l=n.detail.value;s({control_service:l||void 0})}}
        ></ha-service-picker>`)}

        ${this._saveAsVariantRows(i,this._idFor(e,t,o))}
      </div>
    `}_fieldSecVariant(e,t,i,o=!1){return r`
      <div class="ec-section">
        ${this._saveAsVariantRows(i,this._idFor(e,t,o))}
      </div>
    `}_saveAsVariantRows(e,t){if(!J(e.type))return r``;const i=e.type,o=ti(i,e.variant)?ii(i,e.variant):void 0;if(!(this._saveVariantFor===t))return r`
        <div class="ec-subsection-title">Save as Variant</div>
        <p class="ec-hint">Store this field's settings as a reusable variant on this card. It then appears under <b>Custom</b> in every control field's Variant dropdown.</p>
        ${o?r`<p class="ec-hint">This field uses the custom variant <b>${o.label}</b>, so you can also update it with the settings as they now stand.</p>`:u}
        <button class="ec-btn-add" style="width:100%;"
          @click=${()=>{this._saveVariantFor=t,this._saveVariantLabel=o?.label??"",this._variantError=""}}
        >＋ Save as Variant…</button>
      `;const a=oi(e),n=()=>{this._saveVariantFor="",this._saveVariantLabel="",this._variantError=""},l=()=>this._saveVariantLabel.trim(),c=()=>{if(!l()){this._variantError="Label is required.";return}const _=Ce(i,l());this._updateVariants(i,m=>[...m,{id:_,label:l(),...e.icon?{icon:e.icon}:{},...Object.keys(a).length?{preset:a}:{}}]),n()},d=()=>{if(o){if(!l()){this._variantError="Label is required.";return}this._updateVariants(i,_=>_.map(m=>m.id===o.id?{...m,label:l(),...e.icon?{icon:e.icon}:{icon:void 0},preset:Object.keys(a).length?a:void 0}:m)),n()}},h=e.options?.length??0;return r`
      <div class="ec-subsection-title">Save as Variant</div>
      ${this._row("Label",r`<input class="ec-input" type="text" autofocus
          placeholder="e.g. Bedroom Dimmer"
          .value=${this._saveVariantLabel}
          @input=${_=>{this._saveVariantLabel=_.target.value}}
          @keydown=${_=>{_.key==="Enter"&&(o?d():c())}}
        />`)}
      <p class="ec-hint">
        Saves ${Object.keys(a).length} setting(s) from this field.
        ${o?r`<b>Update</b> rewrites <b>${o.label}</b> under its existing id, so every field using it follows.
                 <b>Save as New</b> creates a separate variant with id <code>${l()?Ce(i,l()):"…"}</code>.`:r`Id will be <code>${l()?Ce(i,l()):"…"}</code>.`}
      </p>
      <p class="ec-hint">
        The entity itself is not saved — a variant is a behaviour preset, not a binding.
        ${h?r`Its ${h} option(s) do travel with it, carrying their labels, icons and layout, but with
          each option's own entity stripped for the same reason — point them at your entities after applying it.`:u}
      </p>
      ${this._variantError?r`<p style="color:#f44;font-size:12px;margin:0 0 6px;">${this._variantError}</p>`:u}
      <div style="display:flex;gap:6px;">
        ${o?r`<button class="ec-btn-add" style="flex:1;" @click=${d}>Update “${o.label}”</button>`:u}
        <button class="ec-btn-add" style="flex:1;" @click=${c}>${o?"Save as New":"Save"}</button>
        <button class="ec-btn-add" style="flex:0 0 auto;" @click=${n}>Cancel</button>
      </div>
    `}_confirmVariantOptionLoss(e,t,i){if(!si(e,t,i))return!0;const o=e.options?.length??0;return window.confirm(`This variant brings no options of its own, so applying it will clear the ${o} option${o===1?"":"s"} on this field.

Undo restores them. Save the field as a variant first if you want to keep this list.`)}_typeChangePatch(e,t,i={}){const o=p,s=V(e,{type:t,...i}),a=new Set([...o._slotMap(this._fieldSlotDefs(s)).keys(),...Xi(s)]),n={type:t,...i};for(const l of Object.keys(e))!(l in n)&&!a.has(l)&&(n[l]=void 0);return n}_confirmTypeOptionLoss(e,t){if(J(t)||!e.options?.length)return!0;const i=e.options.length;return window.confirm(`A ${ge[t]??t} field has no options, so changing the type drops the ${i} option${i===1?"":"s"} on this field.

Undo restores them.`)}_numberEntityRange(e){if(!e||!e.startsWith("number.")&&!e.startsWith("input_number.")||!this.hass)return{};const t=this.hass.states[e]?.attributes;if(!t)return{};const i=o=>typeof o=="number"?o:void 0;return{min:i(t.min),max:i(t.max),step:i(t.step)}}_fieldSecSliderRange(e,t,i,o=!1){const s=this._updFor(e,t,o),a=this._numberEntityRange(i.entity),n=(l,c,d,h)=>this._numRow(l,{value:i[c],onChange:_=>s({[c]:_}),placeholder:a[c]?.toString()??d,hint:h});return r`
      <div class="ec-section">
        ${n("Min","min","0","Unset follows the entity's own minimum.")}
        ${n("Max","max","100","Unset follows the entity's own maximum.")}
        ${n("Step","step","1","Smallest change the control can make.")}
        ${i.type==="spinbox"?this._controlNumRow("Decimals",i.spinbox_decimals,"auto",l=>s({spinbox_decimals:l}),0,"How many decimal places the spin box shows."):u}
        ${this._row("Unit",r`<input class="ec-input" type="text" .value=${i.unit??""}
            placeholder=${this._displayUnit(i.entity,void 0)||"e.g. %"}
            @change=${l=>{const c=l.target.value;s({unit:c===""?void 0:c})}} />`,"Shown after the value. Unset uses the entity's own unit.")}
        ${i.type==="slider"?this._row("Show value",r`<input type="checkbox" class="ec-checkbox"
            .checked=${i.show_value??!0}
            @change=${l=>s({show_value:l.target.checked})} />`,"Shows the current value beside the slider."):u}
      </div>
    `}_controlLabelEditor(e,t,i){return r`
      ${this._row("Icon",this._iconPicker(t.icon,o=>i({icon:o})),"An mdi icon shown on this label row. Leave blank for text only.")}
      ${this._row("Text",r`<input class="ec-input" type="text" .value=${t.text??""}
          @change=${o=>{const s=o.target.value;i({text:s||void 0})}} />`,"Text shown on this label row.")}
      <div class="ec-subsection-title">Text style</div>
      ${this._textRows(`${e}-st`,t.style??{},o=>i({style:{...t.style,...o}}),!1)}
    `}_fieldSecControlLabels(e,t,i,o=!1){const s=this._updFor(e,t,o),a=i.control_labels??[],n=c=>s({control_labels:c.length?c:void 0}),l=i.control_labels_position??"above";return r`
      <div class="ec-section">
        <p class="ec-hint">Stacked icon + text rows placed around the control. Each row has its own text style.</p>
        ${this._row("Position",r`<select class="ec-select" .value=${l}
            @change=${c=>s({control_labels_position:c.target.value})}
          >
            ${["above","below","left","right"].map(c=>r`<option value=${c} .selected=${l===c}>${c.charAt(0).toUpperCase()+c.slice(1)}</option>`)}
          </select>`)}
        ${this._row("Alignment",r`<select class="ec-select" .value=${i.align??"left"}
            @change=${c=>s({align:c.target.value})}
          >
            ${fe.map(c=>r`<option value=${c} .selected=${(i.align??"left")===c}>${Ie[c]}</option>`)}
          </select>`)}
        <p class="ec-hint">Horizontal placement of the label rows against the control — <b>Position</b> covers where they sit. Above or below, the rows align to the control's width; beside it, they align to each other.</p>
        ${this._controlNumRow("Gap to control (px)",i.control_labels_gap,String(this._config?.defaults?.control_gap??b("control_gap")??4),c=>s({control_labels_gap:c}),0)}
        ${a.length===0?r`<p class="ec-empty">No label rows — click "+ Label row".</p>`:u}
        ${a.map((c,d)=>r`
          <div class="ec-section-header">
            <span class="ec-section-title">Row ${d+1}</span>
            <button class="ec-btn-remove" title="Remove row" @click=${()=>n(a.filter((h,_)=>_!==d))}>✕</button>
          </div>
          ${this._controlLabelEditor(`${this._idFor(e,t,o)}-lbl${d}`,c,h=>{const _=[...a];_[d]={...c,...h},n(_)})}
        `)}
        <button class="ec-btn-add" @click=${()=>n([...a,{}])}>+ Label row</button>
      </div>
    `}_fieldSecSliderPoints(e,t,i,o=!1){const s=this._updFor(e,t,o),a=i.slider_labels??{},n=(l,c)=>s({slider_labels:{...a,[l]:{...a[l],...c}}});return r`
      <div class="ec-section">
        <p class="ec-hint">Labels anchored to the track — left (min), center, right (max). Each has its own text style and optional live value.</p>
        ${["left","center","right"].map(l=>{const c=a[l]??{},d=`${this._idFor(e,t,o)}-pt-${l}`;return r`
            <div class="ec-slider-pt">
              <div class="ec-section-header"><span class="ec-section-title">${l.charAt(0).toUpperCase()+l.slice(1)}</span></div>
              ${this._entitySelector({label:"Value entity",entity:c.entity,onEntity:h=>n(l,{entity:h}),attribute:c.attribute,onAttribute:h=>n(l,{attribute:h})})}
              ${c.entity?r`<p class="ec-hint">Showing this entity's live value instead of Text below.</p>`:u}
              ${l!=="center"?this._controlNumRow("Gap from edge (px)",c.gap,"0",h=>n(l,{gap:h}),0):u}
              ${this._controlLabelEditor(d,c,h=>n(l,h))}
            </div>
          `})}
      </div>
    `}_fieldSecOptions(e,t,i,o=!1){const s=this._updFor(e,t,o),a=i.options_source??"entity",n=i.options??[],l=d=>s({options:d.length?d:void 0}),c=o?"eopt":"opt";return i.type==="button"?r`<div class="ec-section">
        <p class="ec-hint">A button is a single cell. Its icon, label and state come from the field's own <b>Entity &amp; Action</b> settings; the layout below places them.</p>
        ${this._row("Label",r`<input class="ec-input" type="text" .value=${i.label??""}
            @change=${d=>{const h=d.target.value;s({label:h||void 0})}} />`,"Text on the button. Leave blank for an icon-only button.")}
        ${this._row("Icon",this._iconPicker(i.icon,d=>s({icon:d}),"from entity state"),"An mdi icon on the button.")}
        ${this._row("Press writes",r`<input class="ec-input" type="text" placeholder="toggle the entity" .value=${i.button_value??""}
            @change=${d=>{const h=d.target.value.trim();s({button_value:h||void 0})}} />`)}
        <p class="ec-hint">Leave <b>Press writes</b> blank to toggle the entity with its domain default action. Set a value and the button writes that instead, showing as active while the entity's state matches it.</p>
        ${this._optionLayoutEditor(i,s,this._idFor(e,t,o))}
      </div>`:r`
      <div class="ec-section">
        ${this._row("Options source",r`<select class="ec-select" .value=${a}
            @change=${d=>s({options_source:d.target.value})}
          >
            <option value="entity" .selected=${a==="entity"}>From entity</option>
            <option value="manual" .selected=${a==="manual"}>Manual list</option>
          </select>`,"Where the list of choices comes from.")}
        <p class="ec-hint"><b>From entity</b> reads the choices the entity itself offers (an <code>input_select</code>'s options, a light's effects, a climate's modes). <b>Manual list</b> lets you write your own options — the only source that can give an option its own entity, icon or line.</p>
        ${u}
        ${i.type==="dropdown"?this._row("Placeholder",r`<input class="ec-input" type="text" .value=${i.placeholder??""} placeholder="—"
            @change=${d=>{const h=d.target.value;s({placeholder:h===""?void 0:h})}}
          />`,"Shown on the closed dropdown when nothing matches."):u}
        ${i.type==="dropdown"?r`<p class="ec-hint">Shown on the closed dropdown when the entity's state doesn't match any option — usually because it is unavailable or mid-change.</p>`:u}
        ${a==="entity"?r`
            ${this._row("Options attribute",r`<input class="ec-input" type="text" placeholder="options" .value=${i.options_attribute??""}
                @change=${d=>{const h=d.target.value.trim();s({options_attribute:h||void 0})}} />`,"The entity attribute holding the option list — e.g. options, effect_list, source_list, hvac_modes.")}`:r`
            <div class="ec-subsection-title">Options — drag to reorder</div>
            <p class="ec-hint">Each option opens its own screen. Leave its <b>Entity</b> blank for a normal option that writes its value to the field's entity; set one and the option acts on <i>that</i> entity instead, showing its state and state icon — so one button group can drive several lights.</p>
            ${n.length===0?this._emptyAdd("No options yet — add one",()=>l([...n,{}])):n.map((d,h)=>this._itemCard({dragKey:`${c}:${e}:${t}:${h}`,icon:d.icon||(d.entity?"mdi:link-variant":"mdi:format-list-bulleted"),label:p._optionName(d,h),sub:p._optionSub(d),selected:h===(o?this._selExtOption:this._selOption),onClick:()=>{o?this._selExtOption=h:this._selOption=h,this._navPush(`${c}:${h}`,p._optionName(d,h))},actions:r`
                    <button class="ec-btn-copy" title="Copy this option"
                      @click=${_=>{_.stopPropagation(),this._copiedOption={...d}}}>⎘</button>
                    <button class="ec-btn-remove" title="Remove option"
                      @click=${_=>{_.stopPropagation(),l(n.filter((m,g)=>g!==h))}}>✕</button>
                  `}))}
            <div style="display:flex;gap:6px;margin-top:6px;">
              <button class="ec-btn-add" @click=${()=>l([...n,{}])}>+ Option</button>
              ${this._copiedOption?r`<button class="ec-btn-paste"
                @click=${()=>l([...n,{...this._copiedOption}])}
                title="Paste copied option">⎗ Option</button>`:u}
            </div>
            <p class="ec-hint"><b>Line</b> groups options into rows — options sharing a line number render on the same line, in order. Blank = line 1.</p>
          `}
        ${i.type==="button_group"?r`
          <div class="ec-subsection-title">Layout</div>
          ${(()=>{const d=p._OPTION_LAYOUT_DEF;return this._navBtn(d.key,d.label,d.hint,d.icon,Ke(i,d.paths))})()}
        `:u}
      </div>
    `}static _optionName(e,t){return e.label||e.value||e.entity||`Option ${t+1}`}static _optionSub(e){const t=[];return e.label&&e.value&&t.push(e.value),e.entity?t.push(e.entity):(e.value||e.label)&&t.push("writes to the field's entity"),e.line&&e.line>1&&t.push(`line ${e.line}`),(e.tap_action||e.hold_action||e.double_tap_action)&&t.push("has actions"),t.join(" · ")}_fieldSecOptionItem(e,t,i,o,s=!1){const a=this._updFor(e,t,s),n=i.options??[],l=n[o];if(!l)return this._navDeadEnd();const c=d=>{const h=[...n];h[o]={...l,...d},a({options:h})};return r`
      <div class="ec-section">
        ${this._row("Value",r`<input class="ec-input" type="text" placeholder="written to the entity" .value=${l.value??""}
            @change=${d=>{const h=d.target.value;c({value:h||void 0})}} />`,"The value written to the entity when this option is picked.")}
        ${this._row("Label",r`<input class="ec-input" type="text" placeholder="optional" .value=${l.label??""}
            @change=${d=>{const h=d.target.value;c({label:h||void 0})}} />`,"Text shown on the option. Unset shows the value.")}
        ${this._entitySelector({entity:l.entity,onEntity:d=>c({entity:d}),attribute:l.attribute,onAttribute:d=>c({attribute:d})})}
        <p class="ec-hint">Leave <b>Entity</b> blank and this option writes its value to the field's entity. Set one and it acts on that entity instead, with its domain default action.</p>
        ${this._row("Icon",this._iconPicker(l.icon,d=>c({icon:d}),"from entity state"),"An mdi icon on this option. An option with its own entity shows that entity's state icon unless this is set.")}
        ${this._controlNumRow("Line",l.line,"1",d=>c({line:d}),1,"Options sharing a line number render on the same row.")}
        ${i.type==="button_group"?r`
          <div class="ec-subsection-title">Cell layout</div>
          <p class="ec-hint">Overrides this option's placement only. <b>Inherit</b> follows the field's Option Layout.</p>
          ${this._row("Icon position",this._optionIconPosSelect(l.icon_position,d=>c({icon_position:d}),"Inherit"),"Where the icon sits relative to the label, for this option only.")}
          ${this._row("Show state",r`<select class="ec-select" .value=${l.show_state===void 0?"":l.show_state?"y":"n"}
              @change=${d=>{const h=d.target.value;c({show_state:h===""?void 0:h==="y"})}}
            >
              <option value="" .selected=${l.show_state===void 0}>Inherit</option>
              <option value="y" .selected=${l.show_state===!0}>Show</option>
              <option value="n" .selected=${l.show_state===!1}>Hide</option>
            </select>`,"Shows this option's entity state on the option. Needs an entity of its own, set above.")}
          ${l.show_state??i.option_show_state?this._row("State position",this._optionPosSelect(l.state_position,d=>c({state_position:d}),"Inherit"),"Where the state value sits relative to the label."):u}
          <div class="ec-subsection-title">Actions</div>
          <p class="ec-hint">Run instead of this option's normal write. In a Perform Action's data, type <code>{{value}}</code> into any field to send this option's own value instead of a fixed one — typing it switches that field to free text, same as a template in the automation editor.</p>
          ${this._actionRows({tap_action:l.tap_action,hold_action:l.hold_action,double_tap_action:l.double_tap_action},d=>c(d))}
        `:u}
      </div>
    `}_posSelect(e,t,i,o,s){const a=n=>n[0].toUpperCase()+n.slice(1);return r`<select class="ec-select" .value=${i??""}
      @change=${n=>{const l=n.target.value;o(l===""?void 0:l)}}
    >
      ${s?r`<option value="" .selected=${i===void 0}>${s}</option>`:u}
      ${e.map(n=>r`<option value=${n} .selected=${i===n}>${t[n]??a(n)}</option>`)}
    </select>`}_optionPosSelect(e,t,i){return this._posSelect(p._POS,{},e,t,i)}_optionIconPosSelect(e,t,i){return this._posSelect([...p._POS,"none"],{none:"No Icon"},e,t,i)}_optionLayoutEditor(e,t,i="f"){const o=(e.type==="button"?this._config?.defaults?.button_option_layout:this._config?.defaults?.option_layout)??{},s=p._OPTION_LAYOUT_KEYS.some(l=>e[l]!==void 0),a=p.SEPARATION_KEYS.some(l=>e.control_style?.[l]!==void 0),n=!s&&!a&&!this._optionLayoutOn.has(i);return r`
      <div class="ec-subsection-title">Option layout</div>
      ${this._row("Use global option layout",r`<input type="checkbox" .checked=${n}
          @change=${l=>{if(l.target.checked){this._optionLayoutOn.delete(i);const c={...e.control_style};for(const d of p.SEPARATION_KEYS)delete c[d];t({...Object.fromEntries(p._OPTION_LAYOUT_KEYS.map(d=>[d,void 0])),control_style:Object.keys(c).length?c:void 0})}else this._optionLayoutOn.add(i);this.requestUpdate()}}
        />`)}
      <p class="ec-hint">Inherits <b>Settings ▸ Global Defaults ▸ Control Default ▸ ${e.type==="button"?"Button":"Button Group"} ▸ Field Container</b>. Untick to set this field's own layout; each option can still override it individually.</p>
      ${n?u:this._optionLayoutRows({icon_position:e.option_icon_position,show_state:e.option_show_state,state_position:e.option_state_position,icon_style:e.option_icon_style,label_style:e.option_label_style,state_style:e.option_state_style},l=>{const c={};"icon_position"in l&&(c.option_icon_position=l.icon_position),"show_state"in l&&(c.option_show_state=l.show_state),"state_position"in l&&(c.option_state_position=l.state_position),"icon_style"in l&&(c.option_icon_style=l.icon_style),"label_style"in l&&(c.option_label_style=l.label_style),"state_style"in l&&(c.option_state_style=l.state_style),t(c)},`${i}-ol`,o)}
      ${n?u:this._optionSeparationRows(e.control_style??{},l=>t({control_style:{...e.control_style,...l}}),e.type==="button")}
    `}_optionLayoutRows(e,t,i,o={}){const s=e.show_state??o.show_state??!1;return r`
      <p class="ec-hint">The label is the anchor; the icon and state value sit around it. <b>Above</b> / <b>Below</b> take their own line, <b>Left</b> / <b>Right</b> share the label's line. <b>No Icon</b> leaves the icon out — the only way to drop it on an option with its own entity, which otherwise shows that entity's state icon.</p>
      ${this._row("Icon position",this._optionIconPosSelect(e.icon_position??o.icon_position??"left",a=>t({icon_position:a})),"Where the icon sits relative to the label.")}
      ${this._row("Show state value",r`<input type="checkbox" .checked=${s}
          @change=${a=>t({show_state:a.target.checked||void 0})}
        />`,"Shows each option's entity state alongside its label.")}
      <p class="ec-hint">The state value comes from the option's own entity, so options need an entity for this to show anything.</p>
      ${s?this._row("State position",this._optionPosSelect(e.state_position??o.state_position??"below",a=>t({state_position:a})),"Where the state value sits relative to the label."):u}

      <p class="ec-hint">Weight and font for the text parts. <b>Colors and sizes</b> are set per state in <b>Active</b> / <b>Inactive State</b>.</p>
      <div class="ec-subsection-title">Icon style</div>
      ${this._textRows(`${i}-icon`,e.icon_style??{},a=>t({icon_style:{...e.icon_style,...a}}),!1,!1,!1)}
      <div class="ec-subsection-title">Label style</div>
      ${this._textRows(`${i}-label`,e.label_style??{},a=>t({label_style:{...e.label_style,...a}}),!1,!1,!1)}
      ${s?r`
        <div class="ec-subsection-title">State style</div>
        ${this._textRows(`${i}-state`,e.state_style??{},a=>t({state_style:{...e.state_style,...a}}),!1,!1,!1)}
      `:u}
    `}_fieldSecInput(e,t,i,o=!1){const s=this._updFor(e,t,o),a=i.submit_on??"change";return r`
      <div class="ec-section">
        ${this._row("Submit on",r`<select class="ec-select" .value=${a}
            @change=${n=>s({submit_on:n.target.value})}
          >
            <option value="change" .selected=${a==="change"}>Change (click away or Enter)</option>
            <option value="blur" .selected=${a==="blur"}>Click away</option>
            <option value="enter" .selected=${a==="enter"}>Enter only</option>
          </select>`,"When the typed value is sent — as you type, on Enter, or when the field loses focus.")}
        ${this._row("Placeholder",r`<input class="ec-input" type="text" .value=${i.placeholder??""}
            @change=${n=>{const l=n.target.value;s({placeholder:l===""?void 0:l})}}
          />`,"Grey prompt text shown while the field is empty.")}
        ${this._controlNumRow("Max length",i.input_maxlength,"no limit",n=>s({input_maxlength:n}),1,"Longest value the field accepts.")}
        ${this._row("Password field",r`<input type="checkbox" .checked=${i.input_password??!1}
            @change=${n=>s({input_password:n.target.checked||void 0})}
          />`,"Masks what is typed. The value is still sent in clear text.")}
      </div>
    `}_fieldSecValueSource(e,t,i,o=!1){const s=this._updFor(e,t,o);return r`
      <div class="ec-section">
          ${this._entitySelector({entity:i.entity,onEntity:a=>s({entity:a}),attribute:i.attribute,onAttribute:a=>s({attribute:a})})}
          ${this._isTimeUntilVirtual(i)?this._renderTuLayoutBuilder(e,t,i,o):u}
      </div>
    `}_fieldSecValueLabel(e,t,i,o=!1){const s=this._updFor(e,t,o);return r`
      <div class="ec-section">
          ${this._row("Value Label (Optional)",r`<input class="ec-input" type="text" .value=${i.label??""}
              placeholder="(optional)"
              @input=${a=>{const n=a.target.value;s({label:n||void 0})}}
            />`,"Text shown beside the value. Leave blank for none.")}
          ${i.label?r`
            ${this._row("Value Label position",r`<select class="ec-select"
                .value=${i.label_position??b("label_position")??"above"}
                @change=${a=>s({label_position:a.target.value})}
              >
                <option value="above"  .selected=${(i.label_position??b("label_position")??"above")==="above"}>Above value</option>
                <option value="below"  .selected=${i.label_position==="below"}>Below value</option>
                <option value="left"   .selected=${i.label_position==="left"}>Left of value</option>
                <option value="right"  .selected=${i.label_position==="right"}>Right of value</option>
              </select>`,"Where the label sits relative to the value.")}
            ${o?this._numRow("Label column",{value:i.label_column,onChange:a=>s({label_column:a}),min:1,max:4,placeholder:"(same cell)",hint:"Puts the label in its own column of the popover grid."}):u}
          `:u}
          ${this._row("Icon",r`<select class="ec-select"
              .value=${i.icon_position??"none"}
              @change=${a=>{const n=a.target.value;s({icon_position:n==="none"?void 0:n})}}
            >
              <option value="none"  .selected=${(i.icon_position??"none")==="none"}>No icon</option>
              <option value="left"  .selected=${i.icon_position==="left"}>Left of value</option>
              <option value="right" .selected=${i.icon_position==="right"}>Right of value</option>
              <option value="above" .selected=${i.icon_position==="above"}>Above value</option>
              <option value="below" .selected=${i.icon_position==="below"}>Below value</option>
            </select>`,"Shows the entity's own icon beside the value.")}
          ${i.icon_position&&i.icon_position!=="none"?this._row("Icon (override)",this._iconPicker(i.icon,a=>s({icon:a}),"(entity icon)"),"A picked icon shown instead of the entity's own."):u}
      </div>
    `}_fieldSecLabelContent(e,t,i,o=!1){const s=this._updFor(e,t,o);return r`
      <div class="ec-section">
          ${this._row("Text",r`<input class="ec-input" type="text" .value=${i.text??""}
                @change=${a=>s({text:a.target.value})}
              />`)}
          ${this._row("Icon",this._iconPicker(i.icon,a=>s({icon:a})),"Optional icon shown with the text.")}
          ${i.icon?this._row("Icon position",r`<select class="ec-select"
              .value=${i.icon_position??b("icon_position")??"left"}
              @change=${a=>s({icon_position:a.target.value})}
            >
              <option value="left"  .selected=${(i.icon_position??b("icon_position")??"left")==="left"}>Left of text</option>
              <option value="right" .selected=${i.icon_position==="right"}>Right of text</option>
              <option value="above" .selected=${i.icon_position==="above"}>Above text</option>
              <option value="below" .selected=${i.icon_position==="below"}>Below text</option>
            </select>`,"Where the icon sits relative to the text."):u}
      </div>
    `}_iconStatePreview(e){if(!e.entity||e.entity.startsWith("virtual:"))return u;const t=this.hass?.states[e.entity];if(!t)return u;const i=e.attribute?t.attributes?.[e.attribute]:t.state,o=i!=null?String(i):void 0,s=ai(e,o);return s?r`<p class="ec-hint">
      State <code>${o}</code> resolves to <code>${s}</code>
      <ha-icon icon=${s} style="--mdc-icon-size:18px;vertical-align:middle;"></ha-icon>
      — a blank here means the <b>${ni(e)}</b> set has no icon by that name.
    </p>`:u}_fieldSecIcon(e,t,i,o=!1){const s=this._updFor(e,t,o),a=i.icon_rules??[],n=l=>s({icon_rules:l.length?l:void 0});return r`
      <div class="ec-section">
          ${this._row("Icon",this._iconPicker(i.icon,l=>s({icon:l}),i.entity?"(entity icon)":""),i.entity?"Shown when no rule below matches. Leave blank to use the entity's own icon.":"An mdi icon name, e.g. mdi:lightbulb.")}

          <div class="ec-subsection-title">Icon by state</div>
          ${this._entitySelector({entity:i.entity,onEntity:l=>s({entity:l}),includeVirtuals:!1,attribute:i.attribute,onAttribute:l=>s({attribute:l})})}
          <p class="ec-hint">Leave <b>Entity</b> blank for a fixed icon. Set one and the field shows the icon whose rule matches that entity's state — falling back to the <b>Icon</b> above, or to the entity's own icon.</p>
          ${i.entity?r`
            ${this._row("Use state value",r`<input type="checkbox"
                .checked=${i.icon_use_state??!1}
                @change=${l=>s({icon_use_state:l.target.checked||void 0})}
              />`,"Ticked, the entity's own state names the icon — a weather entity reading partlycloudy shows the partlycloudy glyph. The state is lowercased and underscores become dashes. A rule below still overrides it for the states it names.")}
            ${i.icon_use_state?r`
              ${this._row("Alt icon prefix",r`<input class="ec-input" type="text" placeholder="mdi"
                  .value=${i.icon_prefix??""}
                  @change=${l=>{const c=l.target,d=c.value.replace(/:/g,"").trim();c.value=d,s({icon_prefix:d===""?void 0:d})}}
                />`,"The icon set the state name is looked up in. Blank means mdi. Integrations such as Custom Icons add Iconify collections — use their prefix here, without the colon.")}
              ${this._iconStatePreview(i)}
            `:u}
          `:u}
          ${i.entity?r`
            <div class="ec-subsection-title">Rules</div>
            ${a.length===0?this._emptyAdd("No rules yet — add one",()=>n([...a,{}])):a.map((l,c)=>r`
                <div style="display:flex;gap:4px;align-items:center;margin-bottom:4px;">
                  <input class="ec-input" type="text" style="flex:1;min-width:0;" placeholder="state value"
                    .value=${l.value??""}
                    @change=${d=>n(a.map((h,_)=>_===c?{...h,value:d.target.value}:h))}
                  />
                  <div style="flex:1.4;min-width:0;">
                    ${this._iconPicker(l.icon,d=>n(a.map((h,_)=>_===c?{...h,icon:d}:h)))}
                  </div>
                  <button class="ec-btn-remove" title="Remove rule"
                    @click=${()=>n(a.filter((d,h)=>h!==c))}>✕</button>
                </div>
              `)}
            <div style="display:flex;gap:6px;margin-top:6px;">
              <button class="ec-btn-add" @click=${()=>n([...a,{}])}>+ Rule</button>
            </div>
            <p class="ec-hint">Each rule stands alone — one state value, one icon. A value matches the state as text, as a number (<code>21</code> matches <code>21.0</code>) or as a boolean (<code>true</code> matches <code>on</code>). A matching rule with no icon picked shows <b>no icon</b> for that state, instead of falling back.</p>
          `:u}
      </div>
    `}_fieldSecSvgSource(e,t,i,o=!1){const s=this._updFor(e,t,o);return r`
      <div class="ec-section">

          ${!i.svg||this._isThermometerSvg(i)||this._isBatterySvg(i)||this._isInverterSvg(i)||this._isGaugeSvg(i)?this._entitySelector({entity:i.entity,onEntity:a=>s({entity:a}),attribute:i.attribute,onAttribute:a=>s({attribute:a})}):u}
          ${this._isBatterySvg(i)?this._entitySelector({label:"Charging entity",entity:i.charging_entity,onEntity:a=>s({charging_entity:a}),attribute:i.charging_attribute,onAttribute:a=>s({charging_attribute:a})}):u}
          ${i.svg&&!this._isThermometerSvg(i)&&!this._isBatterySvg(i)&&!this._isInverterSvg(i)&&!this._isGaugeSvg(i)?r`
            <div class="ec-subsection-title" style="margin-top:6px">Tank fill source</div>
            ${this._entitySelector({label:"% entity",entity:i.tank_pct_entity,onEntity:a=>s({tank_pct_entity:a}),attribute:i.tank_pct_attribute,onAttribute:a=>s({tank_pct_attribute:a})})}
            ${this._entitySelector({label:"Flow In/Out Entity",entity:i.tank_volume_entity,onEntity:a=>s({tank_volume_entity:a}),attribute:i.tank_volume_attribute,onAttribute:a=>s({tank_volume_attribute:a})})}
            ${this._entitySelector({label:"Capacity entity",entity:i.tank_capacity_entity,onEntity:a=>s({tank_capacity_entity:a}),attribute:i.tank_capacity_attribute,onAttribute:a=>s({tank_capacity_attribute:a})})}
          `:u}
      </div>
    `}_fieldSecSvgRange(e,t,i,o=!1){const s=this._updFor(e,t,o);return r`
      <div class="ec-section">
            ${this._numRow("Min value",{value:i.min,onChange:a=>s({min:a}),placeholder:"0",hint:"Entity value that draws the graphic empty."})}
            ${this._numRow("Max value",{value:i.max,onChange:a=>s({max:a}),placeholder:"100",hint:"Entity value that draws the graphic full."})}
      </div>
    `}_fieldSecSvgColors(e,t,i,o=!1){const s=this._updFor(e,t,o),a=o?`ext${e}-f${t}`:`c${e}-f${t}`;return r`
      <div class="ec-section">
          ${i.svg&&!this._isInverterSvg(i)?this._row("Fill direction",r`<select class="ec-select"
              .value=${i.fill_direction??b("fill_direction")??"up"}
              @change=${n=>s({fill_direction:n.target.value})}
            >
              <option value="up"    .selected=${(i.fill_direction??b("fill_direction")??"up")==="up"}>Up (liquid rising)</option>
              <option value="down"  .selected=${i.fill_direction==="down"}>Down</option>
              <option value="left"  .selected=${i.fill_direction==="left"}>Left</option>
              <option value="right" .selected=${i.fill_direction==="right"}>Right</option>
            </select>`,"Which way the graphic fills as the value rises. It also sets a gradient’s direction unless Gradient angle overrides it."):u}
          ${this._isInverterSvg(i)?this._row("Line color",this._colorPicker(`${a}-fc`,i.fill_color,n=>s({fill_color:n})),"Colour of the graphic's outline."):this._gradientRows({id:`${a}-fc`,label:"Fill color",toLabel:"Gradient to",color:i.fill_color,color2:i.fill_color2,angle:i.fill_angle,anglePlaceholder:"fill direction",colorHint:"The colour the graphic fills with.",angleHint:It,setColor:n=>s({fill_color:n}),setColor2:n=>s({fill_color2:n}),setAngle:n=>s({fill_angle:n}),clearGradient:()=>s({fill_color2:void 0,fill_angle:void 0})})}
          ${i.svg&&!this._isThermometerSvg(i)&&!this._isBatterySvg(i)&&!this._isInverterSvg(i)&&!this._isGaugeSvg(i)?this._row("Tank color",this._colorPicker(`${a}-tkc`,i.tank_color,n=>s({tank_color:n}),{clearTitle:"Remove (use SVG default)",onClear:()=>s({tank_color:void 0})}),"Colour of the tank body behind the fill."):u}
      </div>
    `}_fieldSecSvgSize(e,t,i,o=!1){const s=this._updFor(e,t,o);return r`
      <div class="ec-section">
          ${this._numRow("Height (px)",{value:i.height,onChange:a=>s({height:a}),min:20,placeholder:"120"})}
          ${this._numRow("Width (px)",{value:i.width,onChange:a=>s({width:a}),min:10,placeholder:"auto"})}
      </div>
    `}_fieldSecSvgThresholds(e,t,i,o=!1){const s=this._updFor(e,t,o),a=o?`ext${e}-f${t}`:`c${e}-f${t}`;return r`
      <div class="ec-section">
            <p style="font-size:12px;color:#4a8aaa;margin:0 0 6px;">
              Each threshold sets the fill color when the entity value ≥ its level.
            </p>
            ${(i.thresholds??[]).map((n,l)=>r`
              <div class="ec-row">
                ${this._numWrap(r`<input class="ec-input ec-input-num" type="number" style="width:70px"
                  .value=${String(n.value)}
                  @change=${c=>{const d=[...i.thresholds??[]];d[l]={...n,value:Number(c.target.value)},s({thresholds:d})}}
                />`)}
                <div style="flex:1">
                  ${this._colorPicker(`${a}-t${l}`,n.color,c=>{const d=[...i.thresholds??[]];d[l]={...n,color:c??n.color},s({thresholds:d})},{clearable:!1})}
                  <button class="ec-btn-remove"
                    @click=${()=>{const c=(i.thresholds??[]).filter((d,h)=>h!==l);s({thresholds:c.length?c:void 0})}}
                    title="Remove">✕</button>
                </div>
              </div>
            `)}
            <button class="ec-btn-add" style="margin-top:4px;"
              @click=${()=>{const n=[...i.thresholds??[],{value:0,color:"#f44336"}];s({thresholds:n})}}>+ Threshold</button>
      </div>
    `}_fieldSecGraphStates(e,t,i,o=!1){const s=this._updFor(e,t,o),a=o?`ext${e}-f${t}`:`c${e}-f${t}`,n=i.graph_state_colors??[],l=c=>s({graph_state_colors:c.length?c:void 0});return r`
      <div class="ec-section">
            <p style="font-size:12px;color:#4a8aaa;margin:0 0 6px;">
              Pin a colour to a state by name — <code>on</code>, <code>off</code>,
              <code>heat</code>, <code>home</code>. Capitalisation does not matter. Any
              state you do not list still gets its own colour automatically.
            </p>
            ${n.map((c,d)=>r`
              <div class="ec-row">
                <input class="ec-input" type="text" style="width:100px" .value=${c.state}
                  placeholder="state"
                  @change=${h=>{const _=[...n];_[d]={...c,state:h.target.value},l(_)}}
                />
                <div style="flex:1">
                  ${this._colorPicker(`${a}-sc${d}`,c.color,h=>{const _=[...n];_[d]={...c,color:h??c.color},l(_)},{clearable:!1})}
                  <button class="ec-btn-remove"
                    @click=${()=>l(n.filter((h,_)=>_!==d))}
                    title="Remove">✕</button>
                </div>
              </div>
            `)}
            <button class="ec-btn-add" style="margin-top:4px;"
              @click=${()=>l([...n,{state:"",color:"#7ecb20"}])}>+ State</button>
      </div>
    `}_fieldSecGraphBands(e,t,i,o=!1){const s=this._updFor(e,t,o),a=o?`ext${e}-f${t}`:`c${e}-f${t}`,n=i.graph_thresholds??i.thresholds??[],l=c=>s({graph_thresholds:c.length?c:void 0,thresholds:void 0});return r`
      <div class="ec-section">
            <p style="font-size:12px;color:#4a8aaa;margin:0 0 6px;">
              Each band colours the arc from its level upwards, so the gauge shows how far
              into which band the current value sits. Without any, the arc is one colour.
            </p>
            ${n.map((c,d)=>r`
              <div class="ec-row">
                ${this._numWrap(r`<input class="ec-input ec-input-num" type="number" style="width:70px"
                  .value=${String(c.value)}
                  @change=${h=>{const _=[...n];_[d]={...c,value:Number(h.target.value)},l(_)}}
                />`)}
                <div style="flex:1">
                  ${this._colorPicker(`${a}-gb${d}`,c.color,h=>{const _=[...n];_[d]={...c,color:h??c.color},l(_)},{clearable:!1})}
                  <button class="ec-btn-remove"
                    @click=${()=>l(n.filter((h,_)=>_!==d))}
                    title="Remove">✕</button>
                </div>
              </div>
            `)}
            <button class="ec-btn-add" style="margin-top:4px;"
              @click=${()=>l([...n,{value:0,color:"#f44336"}])}>+ Band</button>
      </div>
    `}_fieldSecSvgGauge(e,t,i,o=!1){const s=this._updFor(e,t,o),a=o?`ext${e}-f${t}`:`c${e}-f${t}`;return r`
      <div class="ec-section">
            ${this._row("Min label",r`<input class="ec-input" type="text" .value=${i.gauge_min_label??""}
                placeholder="e.g. 0 kW"
                @change=${n=>{const l=n.target.value;s({gauge_min_label:l||void 0})}}
              />`,"Text under the low end of the arc. Unset shows the Min value.")}
            ${this._row("Max label",r`<input class="ec-input" type="text" .value=${i.gauge_max_label??""}
                placeholder="e.g. 5 kW"
                @change=${n=>{const l=n.target.value;s({gauge_max_label:l||void 0})}}
              />`,"Text under the high end of the arc. Unset shows the Max value.")}
            ${this._row("Show value",r`<label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
                <input type="checkbox" .checked=${i.gauge_show_value??!1}
                  @change=${n=>s({gauge_show_value:n.target.checked||void 0})}
                />
                <span>Display current value in centre</span>
              </label>`,"Shows the current value in the middle of the gauge.")}
            ${this._numRow("Label size (px)",{value:i.gauge_label_size,onChange:n=>s({gauge_label_size:n}),min:6,max:48,placeholder:"11",hint:"Size of the min, max and centre text."})}
            ${this._row("Label color",this._colorPicker(`${a}-glc`,i.gauge_label_color,n=>s({gauge_label_color:n}),{clearTitle:"Reset to default"}),"Colour of the min, max and centre text.")}
      </div>
    `}_fieldSecSvgThermo(e,t,i,o=!1){const s=this._updFor(e,t,o),a=o?`ext${e}-f${t}`:`c${e}-f${t}`;return r`
      <div class="ec-section">
            ${this._row("Tick color",this._colorPicker(`${a}-ttc`,i.thermo_tick_color,n=>s({thermo_tick_color:n||void 0}),{clearTitle:"Reset to default"}),H.tick_color)}
            ${this._row("Tick position",r`<select class="ec-select"
                .value=${i.thermo_text_position??b("thermo_text_position")??"right"}
                @change=${n=>s({thermo_text_position:n.target.value})}
              >
                ${["right","left","both"].map(n=>r`<option value=${n} .selected=${(i.thermo_text_position??b("thermo_text_position")??"right")===n}>${this._isHorizontalThermometerSvg(i)?{right:"Bottom",left:"Top",both:"Both"}[n]:n.charAt(0).toUpperCase()+n.slice(1)}</option>`)}
              </select>`,H.tick_position)}
            ${this._row("Minor tick text",r`<input type="checkbox" class="ec-checkbox"
                .checked=${i.thermo_show_minor_tick_text??b("thermo_show_minor_tick_text")??!1}
                @change=${n=>s({thermo_show_minor_tick_text:n.target.checked})} />`,H.minor_tick_text)}
            ${this._numRow("Tick font size",{hint:H.tick_font_size,value:i.thermo_tick_font_size,onChange:n=>s({thermo_tick_font_size:n}),min:1,max:20,step:.5,placeholder:"4"})}
            ${this._numRow("Major tick length",{value:i.thermo_major_tick_length,onChange:n=>s({thermo_major_tick_length:n}),min:.5,max:20,step:.5,placeholder:"auto (from SVG)"})}
            ${this._numRow("Major tick thickness",{value:i.thermo_major_tick_width,onChange:n=>s({thermo_major_tick_width:n}),min:.1,max:5,step:.05,placeholder:"auto (from SVG)"})}
            ${this._numRow("Minor tick length",{value:i.thermo_minor_tick_length,onChange:n=>s({thermo_minor_tick_length:n}),min:.5,max:20,step:.5,placeholder:"auto (from SVG)"})}
            ${this._numRow("Minor tick thickness",{value:i.thermo_minor_tick_width,onChange:n=>s({thermo_minor_tick_width:n}),min:.1,max:5,step:.05,placeholder:"auto (from SVG)"})}
            ${this._row("Grid line color",this._colorPicker(`${a}-tgc`,i.thermo_grid_color,n=>s({thermo_grid_color:n||void 0}),{clearTitle:"Reset to default"}),H.grid_color)}
            ${this._numRow("Above temperature transparency",{value:i.thermo_fill_opacity_above,onChange:n=>s({thermo_fill_opacity_above:n}),min:0,max:1,step:.05,placeholder:"0.5"})}
            <p class="ec-hint">How visible the tube is above the current reading — 0 hides the empty part
              entirely, 1 draws it in full.</p>
            ${this._numRow("Decimals",{hint:H.decimals,value:i.thermo_decimals,onChange:n=>s({thermo_decimals:n}),min:0,max:4,step:1,placeholder:"1"})}
            ${this._row("Temperature value color",this._colorPicker(`${a}-tvc`,i.thermo_temp_color,n=>s({thermo_temp_color:n||void 0}),{clearTitle:"Reset to default"}),H.temp_color)}
            ${this._numRow("Temperature value size",{value:i.thermo_temp_font_size,onChange:n=>s({thermo_temp_font_size:n}),min:4,max:30,step:.5,placeholder:"10"})}
      </div>
    `}_fieldSecGraphSettings(e,t,i,o=!1){const s=this._updFor(e,t,o),a=i.graph_type??b("graph_type")??"bar",n=Me(a),{stroke:l,range:c,yTitle:d,bars:h,gauge:_,timeline:m}=n;return r`
      <div class="ec-section">

          ${this._row("Type",r`<select class="ec-select"
              .value=${i.graph_type??b("graph_type")??"bar"}
              @change=${g=>s({graph_type:g.target.value})}
            >
              ${Xe.map(g=>r`<option value=${g.value} .selected=${(i.graph_type??b("graph_type")??"bar")===g.value}>${g.label}</option>`)}
            </select>`,"Which chart this field draws. Line and area charts read history; bar and gauge read statistics.")}
          ${this._row("Show axes",r`<input type="checkbox" .checked=${i.graph_show_axes??b("graph_show_axes")??!0}
              @change=${g=>s({graph_show_axes:g.target.checked||void 0})}
            />`,"Draws the axis lines and their labels.")}
          ${this._row("Show legend",r`<input type="checkbox" .checked=${i.graph_show_legend??b("graph_show_legend")??!1}
              @change=${g=>s({graph_show_legend:g.target.checked||void 0})}
            />`,"Names each series beside the chart.")}
          ${i.graph_show_legend??b("graph_show_legend")??!1?this._row("Legend position",r`<select class="ec-select"
              .value=${i.graph_legend_position??b("graph_legend_position")??"bottom"}
              @change=${g=>s({graph_legend_position:g.target.value})}
            >
              ${ro.map(g=>r`<option value=${g.value} .selected=${(i.graph_legend_position??b("graph_legend_position")??"bottom")===g.value}>${g.label}</option>`)}
            </select>`,"Left and right stack the names in a column and take their width from the chart."):u}
          ${h?this._row("Bar value labels",r`<input type="checkbox" .checked=${i.graph_bar_labels??b("graph_bar_labels")??!1}
              @change=${g=>s({graph_bar_labels:g.target.checked||void 0})}
            />`,"Prints each bar’s value at its end."):u}
          ${c?this._numRow("Min value",{value:i.graph_min,onChange:g=>s({graph_min:g}),placeholder:"auto",hint:"Unset scales the axis to the data, rounded to a whole gridline."}):u}
          ${c?this._numRow("Max value",{value:i.graph_max,onChange:g=>s({graph_max:g}),placeholder:"auto",hint:"Unset scales the axis to the data, rounded to a whole gridline."}):u}
          ${l?this._row("Start axis at zero",r`<input type="checkbox" .checked=${i.graph_include_zero??b("graph_include_zero")??!1}
              @change=${g=>s({graph_include_zero:g.target.checked||void 0})}
            />`,"Off, the chart scales to its data — a sensor that only moves between 18 and 24 fills the chart instead of hugging the top of a 0–24 axis. Bars always start at zero."):u}
          ${c?this._numRow("Gridlines",{value:i.graph_tick_count,onChange:g=>s({graph_tick_count:g}),min:2,max:12,placeholder:"auto",hint:"Unset picks a count that suits the chart’s height and label size."}):u}
          ${this._numRow("Decimals",{value:i.graph_precision,onChange:g=>s({graph_precision:g}),min:0,max:6,placeholder:"from entity",hint:"Applies to axis labels, bar labels, gauge readouts and tooltips. Unset follows the entity’s own display precision."})}
          ${this._row("Unit",r`<input class="ec-input" type="text" .value=${i.graph_unit??""}
              placeholder="(from entity)"
              @change=${g=>s({graph_unit:g.target.value||void 0})}
            />`,"Shown against the axis. Unset takes the entity’s own unit.")}
          ${d?this._row("Y-axis title",r`<input class="ec-input" type="text" .value=${i.graph_y_title??""}
              placeholder=${i.graph_unit??"(the unit)"}
              @change=${g=>s({graph_y_title:g.target.value||void 0})}
            />`,"Rotated label down the left of the plot. Unset, the axis is labelled with the unit — which is where a unit belongs, rather than floating above the topmost gridline. Set a title and the unit goes back to its own strip above the plot, since the two are then saying different things."):u}
          ${this._row("X-axis label",r`<input class="ec-input" type="text"
              .value=${i.graph_x_title??""}
              placeholder=${ri(i)||"(none)"}
              @change=${g=>s({graph_x_title:g.target.value||void 0})}
            />`,"Centred under the x-axis values. Unset it names the window from Graph Data — a single space hides it and gives the height back to the plot.")}
          ${this._numRow("Width (px)",{value:i.width,onChange:g=>s({width:g}),min:60,placeholder:"auto"})}
          ${this._numRow("Height (px)",{value:i.height,onChange:g=>s({height:g}),min:40,placeholder:"auto"})}
          ${l?this._numRow("Stroke width",{value:i.graph_stroke_width,onChange:g=>s({graph_stroke_width:g}),min:.5,max:10,step:.5,placeholder:"1.5"}):u}
          ${l?this._row("Line shape",r`<select class="ec-select"
              .value=${i.graph_curve??b("graph_curve")??"linear"}
              @change=${g=>s({graph_curve:g.target.value})}
            >
              ${lo.map(g=>r`<option value=${g.value} .selected=${(i.graph_curve??b("graph_curve")??"linear")===g.value}>${g.label}</option>`)}
            </select>`,"Straight joins the readings as they came. Smoothed rounds the corners without inventing peaks between them. Stepped holds each value until the next reading, which is what a meter or a setpoint actually does."):u}
          ${l?this._row("Point markers",r`<input type="checkbox" .checked=${i.graph_points??b("graph_points")??!1}
              @change=${g=>s({graph_points:g.target.checked||void 0})}
            />`,"A dot at every reading. Dropped automatically when the readings are too close together to tell apart."):u}
          ${l?this._row("Label latest value",r`<input type="checkbox" .checked=${i.graph_last_point??b("graph_last_point")??!1}
              @change=${g=>s({graph_last_point:g.target.checked||void 0})}
            />`,"Marks the most recent reading of each series and prints its value beside it."):u}
          ${this._numRow("Refresh (min)",{value:i.graph_refresh_minutes,onChange:g=>s({graph_refresh_minutes:g}),min:1,max:1440,placeholder:"from dashboard",hint:"How often this graph re-queries Home Assistant. Unset follows the dashboard’s Graph refresh. A week-long chart has no reason to poll as often as a live gauge."})}
          ${m?this._row("Entity name",r`<select class="ec-select"
              .value=${i.graph_timeline_label??b("graph_timeline_label")??"above"}
              @change=${g=>s({graph_timeline_label:g.target.value})}
            >
              ${no.map(g=>r`<option value=${g.value} .selected=${(i.graph_timeline_label??b("graph_timeline_label")??"above")===g.value}>${g.label}</option>`)}
            </select>`,"Where the plotted entity is named, above the state legend. The legend lists the states present, so without this nothing on the chart says which entity it is. Left of the bar only has the width the bar gives up, so it suits short names."):u}
          ${m?this._row("Show state names",r`<input type="checkbox" .checked=${i.graph_show_state_names??b("graph_show_state_names")??!1}
              @change=${g=>s({graph_show_state_names:g.target.checked||void 0})}
            />`,"Prints the state inside each block wide enough to hold it."):u}
          ${m?this._row("Unavailable colour",this._colorPicker(`${o?`ext${e}-f${t}`:`c${e}-f${t}`}-unav`,i.graph_unavailable_color,g=>s({graph_unavailable_color:g}),{clearTitle:"Reset to default"}),"Used for unavailable and unknown, so a gap in the record does not read as a real state."):u}
          ${_?this._row("Tick marks",r`<input type="checkbox" .checked=${i.graph_gauge_ticks??b("graph_gauge_ticks")??!1}
              @change=${g=>s({graph_gauge_ticks:g.target.checked||void 0})}
            />`,"Marks around the arc at the same values a chart axis would label."):u}
          ${_?this._numRow("Sweep (degrees)",{value:i.graph_gauge_sweep,onChange:g=>s({graph_gauge_sweep:g}),min:30,max:350,step:5,placeholder:"270",hint:"How far the arc travels, centred on twelve o’clock. 180 gives a half circle."}):u}
          ${_?this._row("Caption",r`<input class="ec-input" type="text" .value=${i.graph_gauge_label??""}
              placeholder="(none)"
              @change=${g=>s({graph_gauge_label:g.target.value||void 0})}
            />`,"Printed under the gauge’s value."):u}
          ${a==="area"||a==="stat-area"?this._numRow("Fill opacity",{value:i.graph_fill_opacity,onChange:g=>s({graph_fill_opacity:g}),min:0,max:1,step:.05,placeholder:"0.2",hint:"How solid the area under a line is. 0 leaves the line alone."}):u}
      </div>
    `}_fieldSecGraphChrome(e,t,i,o=!1){const s=this._updFor(e,t,o),a=o?`ext${e}-f${t}`:`c${e}-f${t}`,n=(l,c,d,h,_)=>this._row(l,this._colorPicker(`${a}-${c}`,d,m=>s(h(m||void 0)),{clearTitle:"Reset to default"}),_);return r`
      <div class="ec-section">
        <p class="ec-hint">Empty means the shipped default. These stay fixed rather than following the
          theme — they sit over the card's background image, where the transparency is what keeps them legible.</p>
        ${n("Axis line","gac",i.graph_axis_color,l=>({graph_axis_color:l}),"Colour of both axis lines — the one up the left of the plot and the one along the bottom.")}
        ${n("Grid lines","ggc",i.graph_grid_color,l=>({graph_grid_color:l}),"Colour of the lines across the plot area.")}
        ${n("Zero line","gzc",i.graph_zero_line_color,l=>({graph_zero_line_color:l}),"Colour of the line at zero, where the data crosses it.")}
        ${n("Empty-bar stub","gbc",i.graph_baseline_color,l=>({graph_baseline_color:l}),"Colour of the small marker drawn where a bar's value is zero.")}
        ${n("Axis labels","glc",i.graph_label_color,l=>({graph_label_color:l}),"Colour of the X and Y axis labels — the window caption under the chart and the rotated label down its left.")}
        ${n("Axis ticks","gtc",i.graph_tick_color,l=>({graph_tick_color:l}),"Colour of the values along the axes: the numbers, the dates, the category names under each bar. Unset it follows Axis labels.")}
        ${this._numRow("Label size (px)",{value:i.graph_label_size,onChange:l=>s({graph_label_size:l}),min:5,max:24,placeholder:"auto (per chart)",hint:"Unset lets each chart keep its own natural label size."})}
        ${n("Unit label","guc",i.graph_unit_label_color,l=>({graph_unit_label_color:l}),"Colour of the unit shown beside the axis.")}
        ${n("Legend label","gllc",i.graph_legend_label_color,l=>({graph_legend_label_color:l}),"Colour of the series names under the chart.")}
        ${n("In-bar label","gblc",i.graph_bar_label_color,l=>({graph_bar_label_color:l}),"Colour of the value printed inside a bar.")}
        ${n("Gauge track","ggtc",i.graph_gauge_track_color,l=>({graph_gauge_track_color:l}),"Colour of the unfilled part of a gauge's arc.")}
        ${n("Gauge value text","ggvc",i.graph_gauge_value_color,l=>({graph_gauge_value_color:l}),"Colour of the number in the middle of a gauge.")}
        <div class="ec-subsection-title">Series palette</div>
        <p class="ec-hint">Colour cycle for series without a colour of their own. Series order picks
          from this list; a series with its own colour always wins.</p>
        ${(i.graph_palette??b("graph_palette")??[]).map((l,c)=>r`
          <div class="ec-list-row" style="align-items:center;gap:6px;">
            <span style="font-size:11px;opacity:0.6;white-space:nowrap;width:18px;">${c+1}</span>
            <div style="flex:1;min-width:0;">
              ${this._colorPicker(`${a}-gp${c}`,l,d=>{const h=[...i.graph_palette??b("graph_palette")??[]];h[c]=d??"",s({graph_palette:h})},{clearable:!1})}
            </div>
            <button class="ec-btn-remove" title="Remove" @click=${()=>{const d=[...i.graph_palette??b("graph_palette")??[]];d.splice(c,1),s({graph_palette:d.length?d:void 0})}}>✕</button>
          </div>`)}
        <button class="ec-btn-add" @click=${()=>{const l=[...i.graph_palette??b("graph_palette")??[]];s({graph_palette:[...l,"#00d4ff"]})}}>+ Colour</button>
      </div>
    `}_statPeriodGroups(e,t=!1){return r`
      ${["Calendar","Rolling window"].map(i=>r`
        <optgroup label=${i}>
          ${so.filter(o=>o.group===i).map(o=>r`
            <option value=${o.value} .selected=${e===o.value}>${Ue[o.value]}</option>`)}
        </optgroup>`)}
      ${t?r`
        <optgroup label="Custom range">
          <option value="custom" .selected=${e==="custom"}>${Ue.custom} (fixed start and end)</option>
        </optgroup>`:u}
    `}_fieldSecGraphData(e,t,i,o=!1){const s=this._updFor(e,t,o),a=i.graph_type??b("graph_type")??"bar",n=Me(a),l=vt(i),c=i.graph_stat_period,d=c?ao[c]:void 0,h=n.history&&!n.timeline&&l.period!=null,_=l.period?li(l.period,l.periodN):[],m=b("graph_stat_period")??"last_day",g=b("graph_sample_period")??"5minute";return r`
      <div class="ec-section">
        <div class="ec-subsection-title">Window</div>
        ${this._row("Stat period",r`<select class="ec-select"
            .value=${c??""}
            @change=${f=>{const $=f.target.value;s({graph_stat_period:$||void 0,...$?{}:{graph_stat_period_n:void 0}})}}
          >
            <option value="" .selected=${!c}>${n.history?`Default — ${Ue[m]??m}`:"Live state (no window)"}</option>
            ${this._statPeriodGroups(c)}
          </select>`,n.history?"How far back the chart reaches. Every series on it shares this window.":"The window each series is collapsed to a single value over. Live state plots the entity’s current value instead.")}
        ${d?this._row(d,this._numWrap(r`<input type="number" class="ec-input ec-input-num" min="1" step="1"
            .value=${String(i.graph_stat_period_n??"")}
            placeholder="e.g. 3"
            @change=${f=>{const $=parseInt(f.target.value,10);s({graph_stat_period_n:isNaN($)||$<1?void 0:$})}}
          />`)):u}
        ${h?r`
          <div class="ec-subsection-title">Resolution</div>
          ${this._row("Sample period",r`<select class="ec-select"
              .value=${i.graph_sample_period??""}
              @change=${f=>{const $=f.target.value;s({graph_sample_period:$||void 0})}}
            >
              <option value="" .selected=${i.graph_sample_period==null}>Default — ${Ae[g]}</option>
              <option value="auto" .selected=${i.graph_sample_period==="auto"}>${Ae.auto}</option>
              ${_.map(f=>r`
                <option value=${f} .selected=${i.graph_sample_period===f}>${Ae[f]}</option>`)}
            </select>`,"How often a data point is calculated inside the window — one point per sample, using the calculation below.")}
          <p class="ec-hint">Only the resolutions this window can actually be drawn at are listed: a bucket bigger than
            the window is a single point, more than 4,000 of them is more than a chart can show, and Home Assistant keeps
            5-minute statistics for about 10 days only. Widen or narrow the window and the list changes with it.
            ${i.graph_sample_period&&i.graph_sample_period!==l.sample?r`<b>This window cannot serve the chosen resolution, so the chart is drawn at
                  ${Ae[l.sample]}.</b>`:u}</p>
        `:u}
        ${n.statType?r`
          <div class="ec-subsection-title">Calculation</div>
          ${(()=>{const f=n.history,$=l.statType,R=!f||$==="difference";return r`
              ${this._row("Stat type",r`<select class="ec-select"
                  .value=${i.graph_stat_type??""}
                  @change=${k=>{const x=k.target.value;s({graph_stat_type:x||void 0})}}
                >
                  <option value="" .selected=${i.graph_stat_type==null}>Default — ${$}</option>
                  ${f?r`<option value="state" .selected=${i.graph_stat_type==="state"}>Raw value (no aggregation)</option>`:u}
                  ${f?r`<option value="change" .selected=${i.graph_stat_type==="change"}>Change (per sample)</option>`:u}
                  <option value="sum"  .selected=${i.graph_stat_type==="sum"}>Sum (total)</option>
                  ${R?r`<option value="difference" .selected=${i.graph_stat_type==="difference"}>
                    Difference (end − start)${f?" — not supported here":""}
                  </option>`:u}
                  <option value="mean" .selected=${i.graph_stat_type==="mean"}>Mean (average)</option>
                  <option value="max"  .selected=${i.graph_stat_type==="max"}>Maximum</option>
                  <option value="min"  .selected=${i.graph_stat_type==="min"}>Minimum</option>
                </select>`,"Applied to every sample of every series, unless a series overrides it on its own screen.")}
              ${f&&$==="state"?r`<p class="ec-hint">Raw value is recorded at 5-minute resolution only,
                so it ignores the sample period above, reaches back about 10 days, and exists only for a cumulative meter
                entity (state class total or total increasing). An ordinary measurement sensor — instantaneous power, for
                one — has no raw statistic at all and will draw nothing; use Mean, Maximum or Minimum for those.</p>`:u}
            `})()}`:u}
      </div>
    `}_fieldSecGraphSeries(e,t,i,o=!1){const s=this._updFor(e,t,o),a=o?"egs":"gs";return r`
      <div class="ec-section">
          <div class="ec-subsection-title">Series — drag to reorder</div>
          ${(i.graph_series??[]).length===0?this._emptyAdd("No series yet — add one",()=>s({graph_series:[...i.graph_series??[],{}]})):(i.graph_series??[]).map((n,l)=>this._itemCard({dragKey:`${a}:${e}:${t}:${l}`,icon:"mdi:chart-line",label:n.label||n.entity||`Series ${l+1}`,sub:n.label&&n.entity?n.entity:n.entity?`Series ${l+1}`:"No entity selected",selected:l===(o?this._selExtSeries:this._selSeries),onClick:()=>{o?this._selExtSeries=l:this._selSeries=l,this._navPush(`${a}:${l}`,n.label||n.entity||`Series ${l+1}`)},actions:r`
                  <button class="ec-btn-dup" title="Duplicate series"
                    @click=${c=>{c.stopPropagation(),this._duplicateGraphSeries(e,t,l,o)}}>⧉</button>
                  <button class="ec-btn-remove" title="Remove series"
                    @click=${c=>{c.stopPropagation();const d=(i.graph_series??[]).filter((h,_)=>_!==l);s({graph_series:d.length?d:void 0})}}>✕</button>
                `}))}
          <button class="ec-btn-add" style="margin-top:6px;width:100%"
            @click=${()=>{const n=[...i.graph_series??[],{}];s({graph_series:n})}}>+ Series</button>
      </div>
    `}_fieldSecGraphSeriesItem(e,t,i,o,s=!1){const a=s?`ext${e}-f${t}`:`c${e}-f${t}`,n=(i.graph_series??[])[o];if(!n)return this._navDeadEnd();const l=c=>this._updSeries(e,t,o,i,c,s);return r`
      <div class="ec-section">
              <div class="ec-subsection-title">Entity</div>
              ${this._entitySelector({entity:n.entity,onEntity:c=>{const d=n.stat_type?void 0:this._defaultStatType(c);l({entity:c,...d?{stat_type:d}:{}})},attribute:n.attribute,onAttribute:c=>l({attribute:c})})}
              <div class="ec-subsection-title">Appearance</div>
              ${this._row("Value Label (Optional)",r`<input class="ec-input" type="text" .value=${n.label??""}
                  placeholder="(from entity)"
                  @change=${c=>l({label:c.target.value||void 0})}
                />`,"Name for this series in the legend. Unset uses the entity's name.")}
              ${this._row("Color",this._colorPicker(`${a}-s${o}-col`,n.color,c=>l({color:c}),{clearTitle:"Reset to palette color"}),"Unset takes the next colour from the palette in Graph Style.")}
              <div class="ec-subsection-title">Data override</div>
              ${(()=>{const c=i.graph_type??b("graph_type")??"bar",d=Me(c);if(!d.statType)return u;const h=d.history,_=vt(i).statType,m=n.stat_type??_,g=!h||m==="difference";return r`
                  ${this._row("Stat type (override)",r`<select class="ec-select"
                      .value=${n.stat_type??""}
                      @change=${f=>{const $=f.target.value;l({stat_type:$||void 0})}}
                    >
                      <option value="" .selected=${n.stat_type==null}>From Graph Data — ${_}</option>
                      ${h?r`<option value="state" .selected=${n.stat_type==="state"}>Raw value (no aggregation)</option>`:u}
                      ${h?r`<option value="change" .selected=${n.stat_type==="change"}>Change (per sample)</option>`:u}
                      <option value="sum"  .selected=${n.stat_type==="sum"}>Sum (total)</option>
                      ${g?r`<option value="difference" .selected=${n.stat_type==="difference"}>
                        Difference (end − start)${h?" — not supported here":""}
                      </option>`:u}
                      <option value="mean" .selected=${n.stat_type==="mean"}>Mean (average)</option>
                      <option value="max"  .selected=${n.stat_type==="max"}>Maximum</option>
                      <option value="min"  .selected=${n.stat_type==="min"}>Minimum</option>
                    </select>`,"An override of the Stat type set in Graph Data, for this series alone — leave it on “From Graph Data” and the series follows the chart. The window and the sample period are the chart’s and cannot be overridden here.")}
                  ${h?r`<p class="ec-hint">Applied per sample.${m==="difference"?' "Difference" has no meaning for history buckets — pick another type.':m==="state"?" Shows the last reading every 5 minutes, unaveraged — only available for roughly the last 10 days (Home Assistant’s short-term statistics retention), and only for a cumulative meter entity (state_class total/total_increasing); an ordinary measurement sensor (e.g. instantaneous power) never has this and will show no data — use Mean/Max/Min for those.":m==="change"?" Shows how much the entity advanced during each bucket — also only recorded for a cumulative meter entity (state_class total/total_increasing); an ordinary measurement sensor never has this either.":""}</p>`:u}
                `})()}
      </div>
    `}_fieldSecStats(e,t,i,o=!1){const s=this._updFor(e,t,o);return r`
      <div class="ec-section">
          <div class="ec-subsection-title">HA Statistics integration</div>
          <p class="ec-hint">For advanced statistics (median, std dev, percentile, etc.) configure a Statistics integration sensor in HA and point the Entity field at it.</p>
          ${this._row("Period",r`<select class="ec-select"
              .value=${i.stat_period??""}
              @change=${a=>{const n=a.target.value,l=["last_n_minutes","last_n_hours","last_n_days","last_n_months"].includes(n);s({stat_period:n||void 0,stat_period_n:l?i.stat_period_n??void 0:void 0,stat_period_start:n==="custom"?i.stat_period_start??void 0:void 0,stat_period_end:n==="custom"?i.stat_period_end??void 0:void 0})}}
            >
              <option value="">Live state (no stats)</option>
              ${this._statPeriodGroups(i.stat_period,!0)}
            </select>`)}
          ${["last_n_minutes","last_n_hours","last_n_days","last_n_months"].includes(i.stat_period)?this._row(i.stat_period==="last_n_minutes"?"Number of minutes":i.stat_period==="last_n_hours"?"Number of hours":i.stat_period==="last_n_days"?"Number of days":"Number of months",this._numWrap(r`<input type="number" class="ec-input ec-input-num" min="1" step="1"
              .value=${String(i.stat_period_n??"")}
              placeholder="e.g. 3"
              @change=${a=>{const n=parseInt(a.target.value,10);s({stat_period_n:isNaN(n)||n<1?void 0:n})}}
            />`)):u}
          ${i.stat_period==="custom"?r`
            ${this._row("Start",r`<input type="datetime-local" class="ec-input"
              .value=${i.stat_period_start??""}
              @change=${a=>s({stat_period_start:a.target.value||void 0})}
            />`)}
            ${this._row("End",r`<input type="datetime-local" class="ec-input"
              .value=${i.stat_period_end??""}
              @change=${a=>s({stat_period_end:a.target.value||void 0})}
            />`)}
          `:u}
          ${i.stat_period?this._row("Stat type",r`<select class="ec-select"
              .value=${i.stat_type??b("stat_type")??"sum"}
              @change=${a=>s({stat_type:a.target.value})}
            >
              <option value="sum"        .selected=${(i.stat_type??b("stat_type")??"sum")==="sum"}>Sum (total)</option>
              <option value="difference" .selected=${i.stat_type==="difference"}>Difference (end − start)</option>
              <option value="mean"       .selected=${i.stat_type==="mean"}>Mean (average)</option>
              <option value="max"        .selected=${i.stat_type==="max"}>Maximum</option>
              <option value="min"        .selected=${i.stat_type==="min"}>Minimum</option>
              <option value="count"      .selected=${i.stat_type==="count"}>Count (recorder records)</option>
              <option value="range"      .selected=${i.stat_type==="range"}>Range (max − min)</option>
            </select>`):u}
          ${i.stat_type==="count"?r`<p class="ec-hint">Counts the statistics records Home Assistant
            holds for the window, and the recorder's resolution changes with the window's length — the same
            sensor gives 12 records for the last hour (five-minute records) and 1 for today (a daily one).
            It answers "how much statistics data is there", not "how many times did this happen".</p>`:u}

          ${this._row("Adv statistics mode (opt)",r`<select class="ec-select"
              .value=${i.stat_characteristic??""}
              @change=${a=>{const n=a.target.value;s({stat_characteristic:n||void 0})}}
            >
              <option value="">— none —</option>
              ${["Averages","Extremes","Spread","Change","Sums","Counts","Timestamps"].map(a=>r`
                <optgroup label="${a}">
                  ${qe.filter(n=>n.group===a).map(n=>r`
                    <option value=${n.value} .selected=${i.stat_characteristic===n.value}>
                      ${n.label}${n.binary?" ✦":""}
                    </option>`)}
                </optgroup>`)}
            </select>`)}
          <p class="ec-hint" style="margin-top:2px">✦ also valid for binary sensors</p>
          ${i.stat_characteristic==="percentile"?this._numRow("Percentile (1–99)",{value:i.stat_percentile,onChange:a=>s({stat_percentile:a}),min:1,max:99,placeholder:"50"}):u}
          ${this._numRow("Max age (hours)",{value:i.stat_max_age_hours,onChange:a=>s({stat_max_age_hours:a}),min:1,placeholder:"(none)"})}
          ${this._numRow("Sampling size",{value:i.stat_sampling_size,onChange:a=>s({stat_sampling_size:a}),min:1,placeholder:"(none)"})}
          ${i.stat_characteristic&&i.entity?r`
            <div class="ec-stat-yaml">
              <div class="ec-stat-yaml-header">
                <span>HA configuration.yaml</span>
                <button class="ec-btn-copy" title="Copy YAML"
                  @click=${()=>{const a=Re(i.entity,i.stat_characteristic,i.stat_max_age_hours,i.stat_sampling_size,i.stat_percentile);navigator.clipboard.writeText(a)}}>⎘ Copy</button>
              </div>
              <pre class="ec-stat-yaml-code">${Re(i.entity,i.stat_characteristic,i.stat_max_age_hours,i.stat_sampling_size,i.stat_percentile)}</pre>
            </div>
          `:u}
      </div>
    `}_fieldSecDisplay(e,t,i,o=!1){const s=this._updFor(e,t,o);return r`
      <div class="ec-section">
          <div class="ec-subsection-title">Display</div>
          ${this._row("Unit",r`<input class="ec-input" type="text" .value=${i.unit??""}
              placeholder=${this._displayUnit(i.entity,void 0)||"(from entity)"}
              @change=${a=>{const n=a.target.value;s({unit:n===""?void 0:n})}}
            />`,"Shown after the value. Unset uses the entity's own unit.")}
          ${this._numRow("Decimals",{value:i.decimals,onChange:a=>s({decimals:a}),min:0,max:6,placeholder:this._entityDecimalsHint(i.entity)?.toString()??"auto",hint:"Decimal places shown. Unset follows the entity's own precision."})}
          ${this._numRow("Hide below",{value:i.hide_below,onChange:a=>s({hide_below:a}),min:0,placeholder:"(always show)",hint:"Hides the field while the value is under this, compared unsigned (applies to negative values too)."})}
          ${this._displayUnit(i.entity,i.unit)?r`<p class="ec-hint">Enter in ${this._displayUnit(i.entity,i.unit)}</p>`:u}
          ${i.entity?.startsWith("virtual:")&&!i.time_until_layout?.length?this._row("Show trigger label",r`<input type="checkbox"
              .checked=${i.show_time_until_label??!1}
              @change=${a=>s({show_time_until_label:a.target.checked||void 0})}
            />`,"Shows the matching trigger label from the virtual entity instead of the number."):u}
      </div>
    `}_fieldSecVisibility(e,t,i,o=!1){const s=this._updFor(e,t,o);return r`
      <div class="ec-section">
          ${this._numRow("Hide below",{value:i.hide_below,onChange:a=>s({hide_below:a}),min:0,placeholder:"(always show)",hint:"Hides the icon while the entity's value is under this, compared unsigned (applies to negative values too)."})}
          ${""}
          ${i.entity?this._displayUnit(i.entity,void 0)?r`<p class="ec-hint">Enter in ${this._displayUnit(i.entity,void 0)}</p>`:u:r`<p class="ec-hint">Set an <b>Entity</b> in the <b>Icon</b> section first — there is no value to compare against until you do.</p>`}
      </div>
    `}_fieldSecStyle(e,t,i,o=!1){const s=this._updFor(e,t,o),a=o?`ext${e}-f${t}`:`c${e}-f${t}`;return r`
      <div class="ec-section">
          ${J(i.type)?u:this._row("Align",r`<select class="ec-select"
              .value=${i.align??b("align")??"left"}
              @change=${n=>s({align:n.target.value})}
            >
              ${fe.map(n=>r`<option value=${n} .selected=${(i.align??b("align")??"left")===n}>${Ie[n]}</option>`)}
            </select>`,"Horizontal alignment of this field's own content — its text, or an icon field's glyph. Where the field sits in its column follows the card's Align.")}
          ${this._row("Use global text style",r`<input type="checkbox" .checked=${i.style===void 0}
              @change=${n=>{n.target.checked?s({style:void 0}):s({style:{}})}}
            />`,"Ticked, this field follows the card's text styles. Unticking gives it its own, starting empty.")}
          ${i.style!==void 0?r`
            <div class="ec-subsection-title">Style overrides</div>
            ${this._textRows(`${a}-st`,i.style,n=>s({style:{...i.style,...n}}),zt)}
          `:u}
          ${this._cssRow(i.extra_css,n=>s({extra_css:n}))}
      </div>
    `}_fieldSecActions(e,t,i,o=!1){const s=this._updFor(e,t,o);return r`
      <div class="ec-section">
          <div class="ec-subsection-title">Actions</div>
          ${this._actionRows({tap_action:i.tap_action,hold_action:i.hold_action,double_tap_action:i.double_tap_action},a=>s(a))}
      </div>
    `}_renderDefaultsRibbonPanel(){const e=this._navPath;if(e.length===0)return this._defaultsSectionMenu();if(e[0].key==="sec:elements")return e.length===1?this._elemLibMenu():this._elemLibSection(e[1].key);if(e[0].key==="sec:control"){if(e.length===1)return this._controlDefaultsMenu();const t=e[1].key;return t==="cd:selector"||t==="cd:button"?e.length===2?this._selectorDefaultsMenu(t):this._selectorDefaultsSection(t,e[2].key):this._controlDefaultsSection(t)}return this._defaultsSection(e[0].key)}_defaultsScope(){return{root:this._config?.defaults,apply:e=>this._updateDefaults(e)}}_defaultsSectionMenu(){return this._navMenu(p._DEFAULTS_SECTIONS,this._defaultsScope())}_defaultsSection(e){const t=this._config?.defaults??{},i=this._clearOverridesBtn(p._findDef(p._DEFAULTS_SECTIONS,e),this._defaultsScope());return r`${i}${this._defaultsSectionBody(t,e)}`}_defaultsSectionBody(e,t){return t==="sec:card"?this._defaultsSecCard(e):t==="sec:popover"?r`
        ${this._clearOverridesBtn(p._POPOVER_GLOBAL_DEFAULTS_DEF,this._extDefaultsScope())}
        ${this._popoverGlobalDefaults()}
      `:t==="sec:embedded"?this._defaultsSecEmbedded(e):t==="sec:value"?r`<div class="ec-section">${this._textRows("d-value",e.value??{},i=>this._updateDefaults({value:{...e.value,...i}}))}</div>`:t==="sec:label"?r`<div class="ec-section">${this._textRows("d-label",e.label??{},i=>this._updateDefaults({label:{...e.label,...i}}))}</div>`:t==="sec:customcolors"?this._defaultsSecCustomColors():t==="sec:customvars"?this._defaultsSecCustomVars():t==="sec:layout"?this._defaultsSecLayout():t==="sec:reset"?this._defaultsSecReset():r``}_defaultsSecEmbedded(e){return r`
      <div class="ec-section">
        <div class="ec-subsection-title">Frame</div>
        <p class="ec-hint">Drawn on the element that <i>holds</i> the card, not on the card itself. An embedded
          card paints its own background and border, and those stay its own — turn on <b>Transparent</b> below
          to take them away and let this frame show through. Additional CSS here styles the frame: size it,
          move it, layer it.</p>
        ${this._boxRows("d-emb",e.embedded_card??{},t=>this._updateDefaults({embedded_card:{...e.embedded_card,...t}}))}

        <div class="ec-subsection-title">The card itself</div>
        ${this._row("Transparent",r`<input type="checkbox" .checked=${e.embedded_card_transparent??!1}
            @change=${t=>this._updateDefaults({embedded_card_transparent:t.target.checked||void 0})}
          />`)}
        <p class="ec-hint">Removes every embedded card's own background, border and shadow. A card can still
          set its own — untick <b>Use global transparency</b> on it to do that.</p>
        ${this._cssRow(e.embedded_card_extra_css,t=>this._updateDefaults({embedded_card_extra_css:t}),"Card CSS")}
        <p class="ec-hint">Applied to the card itself, not to the frame — this is where a
          <code>--ha-card-…</code> override or a font change goes. A card's own <b>Card CSS</b> is added after
          this rather than replacing it, so it wins where the two name the same property.</p>
      </div>
    `}_defaultsSecReset(){return r`
      <div class="ec-section">
        <ha-alert alert-type="warning">Clears all cards, flows, zones, and background settings, then restarts the setup wizard. This cannot be undone.</ha-alert>
        <div class="ec-wiz-reset-row">
          <button class="ec-wiz-btn-reset" @click=${this._resetToWizard}>⟳ Reset &amp; rerun setup wizard</button>
        </div>
      </div>
    `}_defaultsSecCard(e){const t=ft(e,Qe),i=De(void 0,e);return r`
      <div class="ec-section">
        <div class="ec-subsection-title">Field layout</div>
        <p class="ec-hint">How a Mosaic card arranges its fields unless the card sets its own. These live here rather than
          on <b>Layout &amp; Fonts</b> because they are Mosaic-only — a popover and an embedded card have no field
          placement of their own.</p>

        ${this._row("Field placement",r`<select class="ec-select"
            .value=${i}
            @change=${o=>{const s=o.target.value;this._updateDefaults({card_layout_mode:s==="flow"?void 0:s})}}
          >
            <option value="flow" .selected=${i==="flow"}>Flow</option>
            <option value="grid" .selected=${i==="grid"}>Grid</option>
          </select>`,"Flow stacks fields in the order they are listed. Grid divides the card into cells and each field names the row and column it sits in.")}

        ${this._row("Columns (flow)",r`<select class="ec-select"
            .value=${String(e.card_columns??b("card_columns")??1)}
            @change=${o=>{const s=Number(o.target.value);this._updateDefaults({card_columns:s===1?void 0:s})}}
          >
            ${[1,2,3,4,5,6,7,8].map(o=>r`
              <option value=${String(o)} .selected=${(e.card_columns??b("card_columns")??1)===o}>${o}</option>`)}
          </select>`,"How many columns a card's fields flow into. Only used in flow placement.")}

        ${this._row("Grid columns",r`${this._numInput({value:e.card_grid_columns??b("card_grid_columns")??4,onChange:o=>this._updateDefaults({card_grid_columns:o==null?void 0:Math.max(1,Math.min(8,o))}),min:1,max:8})}`,"How many cells across a card has in grid placement.")}
        ${this._row("Grid rows",r`${this._numInput({value:e.card_grid_rows??b("card_grid_rows")??4,onChange:o=>this._updateDefaults({card_grid_rows:o==null?void 0:Math.max(1,Math.min(20,o))}),min:1,max:20})}`,"How many cells down a card has in grid placement. The card divides its own height between them.")}
        ${this._numRow("Field gap (px)",{value:e.card_field_gap,onChange:o=>this._updateDefaults({card_field_gap:o}),min:0,placeholder:String(this._mosaicFieldGap()),hint:"In flow placement, the vertical space between fields. In grid placement the cells do that, so it is only the space between a field's own parts — its label and its value."})}
        ${this._numRow("Column gap (px)",{value:e.card_column_gap,onChange:o=>this._updateDefaults({card_column_gap:o}),min:0,placeholder:String(this._mosaicColumnGap()),hint:"Horizontal space between columns, in both placements."})}
        ${this._numRow("Grid row gap (px)",{value:e.card_grid_row_gap,onChange:o=>this._updateDefaults({card_grid_row_gap:o}),min:0,placeholder:String(this._mosaicFieldGap()),hint:"Vertical space between grid rows. Unset follows Field gap, so one value still themes a whole card."})}

        <div class="ec-subsection-title">Card box</div>
        ${this._boxRows("d-card",e.card??{},o=>this._updateDefaults({card:{...e.card,...o}}))}

        <div class="ec-subsection-title">Card text</div>
        <p class="ec-hint">What every field, control label and popup title falls back to when nothing more specific is set. Cards sit over your background image, so this stays fixed rather than following the theme.</p>
        ${this._row("Default text color",this._colorPicker("d-cardtext",e.card_text_color,o=>this._updateDefaults({card_text_color:o||void 0}),{clearTitle:"Reset to default"}))}

        <div class="ec-subsection-title">Popups</div>
        <p class="ec-hint">How an expanded Mosaic card looks when it opens over the dashboard. A popover's own dimming is set in <b>Popover Card Defaults</b>; the close button below is shared by both.</p>
        ${this._row("Dimming",r`
          <select class="ec-select"
            @change=${o=>this._setPopupDimming(o.target.value,Qe)}
          >
            ${t===void 0?r`<option value="" selected>Custom</option>`:u}
            ${Object.keys(de).map(o=>r`
              <option value=${o} .selected=${t===o}>${de[o].label} — ${de[o].hint}</option>`)}
          </select>`)}
        ${t===void 0?r`<p class="ec-hint">These colors were set by hand in YAML, so no preset describes them. Picking one replaces them.</p>`:u}
        <p class="ec-hint">An overlay's corners follow the card's own <b>Border radius</b> above — the panel behind it has no colour of its own, so a second radius here only fought the one setting that is visible.</p>
      </div>
    `}_setPopupDimming(e,t=ci){if(!(e in de))return;const i=de[e].values,o={};for(const s of t)o[s]=b(s)===i[s]?void 0:i[s];this._updateDefaults(o)}static _custName(e){return e.trim().replace(/[^a-zA-Z0-9_-]/g,"_")}_custDuplicateNames(){const e=new Set,t=new Set;for(const[i]of mt(this._config?.defaults)){const o=i.slice(9);e.has(o)&&t.add(o),e.add(o)}return t}_custNameInput(e,t,i){const o=e!==""&&t.has(e);return r`
      <span style="font-size:11px;opacity:0.6;white-space:nowrap;">mccust_</span>
      <input class="ec-input" type="text" placeholder="name" style="flex:0 1 110px;${o?"border-color:var(--error-color, #db4437);":""}"
        title=${o?"This name is used twice — colors and variables share one --mccust_ namespace, so only one of them will apply.":"Becomes --mccust_<name>."}
        .value=${e}
        @change=${s=>i(p._custName(s.target.value))} />
    `}_defaultsSecCustomColors(){const e=this._config?.defaults?.custom_colors??[],t=o=>this._updateDefaults({custom_colors:o.length?o:void 0}),i=this._custDuplicateNames();return r`
      <div class="ec-section">
        <p class="ec-hint">Reusable colors. Each becomes <code>--mccust_&lt;name&gt;</code>, and appears in every color picker's <b>CSS Mode</b> list. Specifying a custom theme variable is allowed in the RGB input field.</p>
        ${this._custDuplicateHint(i)}
        ${e.length===0?r`<p class="ec-empty">No custom colors — click "+ Color".</p>`:u}
        ${e.map((o,s)=>r`
          <div class="ec-list-row" style="align-items:center;gap:6px;">
            ${this._custNameInput(o.name,i,a=>{const n=[...e];n[s]={...o,name:a},t(n)})}
            <div style="flex:1;min-width:0;">
              ${this._colorPicker(`cust-${s}`,o.color,a=>{const n=[...e];n[s]={...o,color:a??""},t(n)},{clearable:!1})}
            </div>
            <button class="ec-btn-remove" title="Remove" @click=${()=>t(e.filter((a,n)=>n!==s))}>✕</button>
          </div>`)}
        <button class="ec-btn-add" @click=${()=>t([...e,{name:`color${e.length+1}`,color:"#00d4ff"}])}>+ Color</button>
      </div>
    `}_custDuplicateHint(e){return e.size===0?u:r`<p class="ec-hint" style="color:var(--error-color, #db4437);">
      Used in both lists: ${[...e].map(t=>`mccust_${t}`).join(", ")}. Colors and variables
      share one <code>--mccust_</code> namespace, so only the variable will apply. Rename one of each pair.
    </p>`}_defaultsSecCustomVars(){const e=this._config?.defaults?.custom_vars??[],t=o=>this._updateDefaults({custom_vars:o.length?o:void 0}),i=this._custDuplicateNames();return r`
      <div class="ec-section">
        <p class="ec-hint">Reusable values of any kind — sizes, shadows, font stacks. Each becomes <code>--mccust_&lt;name&gt;</code> on the card, so <b>Extra CSS</b> anywhere in the card can use <code>var(--mccust_&lt;name&gt;)</code> instead of repeating the value.</p>
        <p class="ec-hint">These share the same namespace as <b>Custom Colors</b>, so a name can only be used in one list. Colors go in that list — only they appear in the color pickers' CSS Mode.</p>
        ${this._custDuplicateHint(i)}
        ${e.length===0?r`<p class="ec-empty">No custom variables — click "+ Variable".</p>`:u}
        ${e.map((o,s)=>r`
          <div class="ec-list-row" style="align-items:center;gap:6px;">
            ${this._custNameInput(o.name,i,a=>{const n=[...e];n[s]={...o,name:a},t(n)})}
            <input class="ec-input" type="text" placeholder="value (e.g. 8px, 0 2px 6px rgba(0,0,0,.4))" style="flex:1;min-width:0;"
              .value=${o.value}
              @change=${a=>{const n=[...e];n[s]={...o,value:a.target.value.trim()},t(n)}} />
            <button class="ec-btn-remove" title="Remove" @click=${()=>t(e.filter((a,n)=>n!==s))}>✕</button>
          </div>`)}
        <button class="ec-btn-add" @click=${()=>t([...e,{name:`var${e.length+1}`,value:""}])}>+ Variable</button>
      </div>
    `}_controlNumRow(e,t,i,o,s=1,a){return this._numRow(e,{value:t,onChange:o,placeholder:i,min:s,hint:a})}static _separationOnly(e){if(!e)return;const t={};let i=!1;for(const o of p.SEPARATION_KEYS)e[o]!==void 0&&(t[o]=e[o],i=!0);return i?t:void 0}_optionSeparationRows(e,t,i=!1){if(i)return r`
        <div class="ec-subsection-title">Padding</div>
        ${this._csNumRow(e,t,"Button padding (px)","button_option_padding","5 / 10",0,"Vertical / horizontal padding inside the button.")}
      `;const o=(a,n,l)=>this._colorPicker(a,n,c=>l(c||void 0)),s=(e.button_group_option_gap??0)>0;return r`
      <div class="ec-subsection-title">Option separation</div>
      <p class="ec-hint">Set a gap to detach the options into discrete buttons — the shared outline and the divider lines between segments go away, and each option becomes its own cell. Leave the gap at 0 for the joined segmented look.</p>
      ${this._csNumRow(e,t,"Gap between options (px)","button_group_option_gap","0",0)}
      <div class="ec-subsection-title">${s?"Button group border (fallback for detached options)":"Segmented frame"}</div>
      <p class="ec-hint">${s?'The button group’s own border. It has no visible frame to draw once options are detached, but it stays the fallback for "Border per option" below whenever an option is left without its own override.':"The outline around the joined segmented row, and the divider lines between options."}</p>
      ${this._row("Border color",o("sel-bd",e.button_group_border_color,a=>t({button_group_border_color:a})),"Colour of the outline described above.")}
      ${this._csNumRow(e,t,"Border width (px)","button_group_border_width","1",0)}
      ${this._csNumRow(e,t,"Radius (px)","button_group_radius","7")}
      ${s?r`
        ${this._csNumRow(e,t,"Internal padding (px)","button_group_option_padding","5",0,"Space between the group's frame and the detached options.")}
        ${this._row("Border per option",r`<input type="checkbox" .checked=${e.button_group_option_border??!1}
            @change=${a=>t({button_group_option_border:a.target.checked||void 0})}
          />`,"Gives each detached option its own border settings.")}
        ${e.button_group_option_border?r`
          ${this._row("Option border color",o("sel-obd",e.button_group_option_border_color,a=>t({button_group_option_border_color:a})),"Unset reuses the button group's border colour above.")}
          ${this._csNumRow(e,t,"Option border width (px)","button_group_option_border_width","group width",0,"Unset reuses the button group's border width.")}
          ${this._csNumRow(e,t,"Option border radius (px)","button_group_option_radius","group radius",0,"Unset reuses the button group's radius.")}
        `:u}
        <div class="ec-subsection-title">Option extra CSS</div>
        ${this._cssRow(e.button_group_option_extra_css,a=>t({button_group_option_extra_css:a}),"Additional CSS","Raw CSS applied to each separated option cell, so detached buttons can be fully styled.")}
      `:u}
    `}_controlGradientAngleRow(e,t){return this._csNumRow(e,t,"Gradient angle (deg)","gradient_angle","180",0)}_gradientRows(e){const t=e.color2!=null||this._gradientOn.has(e.id),i=o=>{if(o){this._gradientOn.add(e.id),this.requestUpdate();return}this._gradientOn.delete(e.id),e.clearGradient()};return r`
      ${this._row(e.label,this._colorPicker(e.id,e.color,o=>e.setColor(o||void 0),{onClear:e.onClearColor,gradient:{on:t,onToggle:i}}),e.colorHint)}
      ${t?r`
        ${this._row(e.toLabel??`${e.label} gradient to`,this._colorPicker(`${e.id}-2`,e.color2,o=>e.setColor2(o||void 0)),"The colour the gradient ends on. Nothing renders as a gradient until this is set.")}
        ${this._controlNumRow("Gradient angle (deg)",e.angle,e.anglePlaceholder??"180",o=>e.setAngle(o),0,e.angleTooltip??"Direction the gradient runs — 0° fills upwards, 180° downwards.")}
        ${e.angleHint?r`<p class="ec-hint">${e.angleHint}</p>`:u}
      `:u}
    `}_libFillRows(e,t){const i=this._config?.defaults??{},o=(s,a)=>this._updateDefaults({[`${t}_${s}`]:a});return this._gradientRows({id:e,label:"Fill color",toLabel:"Gradient to",color:i[`${t}_fill_color`],color2:i[`${t}_fill_color2`],angle:i[`${t}_fill_angle`],anglePlaceholder:"fill direction",angleHint:It,setColor:s=>o("fill_color",s),setColor2:s=>o("fill_color2",s),setAngle:s=>o("fill_angle",s),clearGradient:()=>this._updateDefaults({[`${t}_fill_color2`]:void 0,[`${t}_fill_angle`]:void 0})})}_csGradientRows(e,t,i,o,s,a,n,l){const c=(d,h)=>n({[d]:h});return this._gradientRows({id:e,label:t,colorHint:l,color:a[i],color2:a[o],angle:a[s],anglePlaceholder:String(a.gradient_angle??180),angleTooltip:"Direction the gradient runs — 0° fills upwards, 180° downwards. Unset follows the control-wide Gradient angle in Settings ▸ Global Defaults ▸ Control Default ▸ Common.",setColor:d=>c(i,d),setColor2:d=>c(o,d),setAngle:d=>c(s,d),clearGradient:()=>n({[o]:void 0,[s]:void 0})})}_selectorStateRows(e,t,i,o,s){const a=(c,d,h)=>this._colorPicker(`${e}-${c}`,d,_=>h(_||void 0)),n="Colour of the option's icon. Unset follows the label colour.",l="Colour of the state value shown on the option. Unset follows the label colour.";if(o==="sub:active"||o==="sub:inactive"){const c=o==="sub:active";return s?c?r`
          <p class="ec-hint">Applied while the button's entity is on, or — with a value set — while the entity's state equals it.</p>
          ${this._csGradientRows(`${e}-sel-sel`,"Background","button_selected_color","button_selected_color2","button_selected_angle",t,i,"Fill behind the button in this state.")}
          ${this._row("Label color",a("sel-selt",t.button_selected_text_color,d=>i({button_selected_text_color:d})),"Colour of the button's text in this state.")}
          ${this._row("Icon color",a("sel-selic",t.button_selected_icon_color,d=>i({button_selected_icon_color:d})),n)}
          ${this._row("State value color",a("sel-selst",t.button_selected_state_color,d=>i({button_selected_state_color:d})),l)}
        `:r`
          ${this._csGradientRows(`${e}-sel-bg`,"Background","button_bg","button_bg2","button_bg_angle",t,i,"Fill behind the button in this state.")}
          ${this._row("Label color",a("sel-txt",t.button_text_color,d=>i({button_text_color:d})),"Colour of the button's text in this state.")}
          ${this._row("Icon color",a("sel-ic",t.button_icon_color,d=>i({button_icon_color:d})),n)}
          ${this._row("State value color",a("sel-st",t.button_state_color,d=>i({button_state_color:d})),l)}
        `:c?r`
        <p class="ec-hint">Applied to an option whose value is the entity's current state, or whose own entity is on.</p>
        ${this._csGradientRows(`${e}-sel-sel`,"Background","button_group_selected_color","button_group_selected_color2","button_group_selected_angle",t,i,"Fill behind the option in this state.")}
        ${this._row("Label color",a("sel-selt",t.button_group_selected_text_color,d=>i({button_group_selected_text_color:d})),"Colour of the option's text in this state.")}
        ${this._row("Icon color",a("sel-selic",t.button_group_selected_icon_color,d=>i({button_group_selected_icon_color:d})),n)}
        ${this._row("State value color",a("sel-selst",t.button_group_selected_state_color,d=>i({button_group_selected_state_color:d})),l)}
      `:r`
        ${this._csGradientRows(`${e}-sel-bg`,"Background","button_group_bg","button_group_bg2","button_group_bg_angle",t,i,"Fill behind the option in this state.")}
        ${this._row("Label color",a("sel-txt",t.button_group_text_color,d=>i({button_group_text_color:d})),"Colour of the option's text in this state.")}
        ${this._row("Icon color",a("sel-ic",t.button_group_icon_color,d=>i({button_group_icon_color:d})),n)}
        ${this._row("State value color",a("sel-st",t.button_group_state_color,d=>i({button_group_state_color:d})),l)}
      `}return s?r`
        ${this._row("Border color",a("sel-bd",t.button_border_color,c=>i({button_border_color:c})),"Colour of the button's outline.")}
        ${this._csNumRow(t,i,"Border width (px)","button_border_width","1",0)}
        ${this._csNumRow(t,i,"Radius (px)","button_radius","7")}
        ${this._csNumRow(t,i,"Padding (px)","button_option_padding","5 / 10",0,"Vertical / horizontal padding inside the button.")}
        ${this._csNumRow(t,i,"Label font size (px)","button_text_size","13")}
        ${this._csNumRow(t,i,"Icon font size (px)","button_icon_size","18")}
        ${this._csNumRow(t,i,"State value font size (px)","button_state_size","label size")}
      `:r`
      ${this._csNumRow(t,i,"Label font size (px)","button_group_text_size","13")}
      ${this._csNumRow(t,i,"Icon font size (px)","button_group_icon_size","18")}
      ${this._csNumRow(t,i,"State value font size (px)","button_group_state_size","label size")}
    `}_csNumRow(e,t,i,o,s,a=1,n){const l=b("control_style")?.[o];return this._controlNumRow(i,e[o],typeof l=="number"?String(l):s,c=>t({[o]:c}),a,n)}_csShadowRow(e,t,i,o,s){const a=b("control_style")?.[o];return this._row(i,r`<input class="ec-input" type="text" .value=${e[o]??""}
      placeholder=${typeof a=="string"?a:s}
      @change=${n=>t({[o]:n.target.value.trim()||void 0})}
    />`,"A full CSS box-shadow value. Use 'none' to remove the shadow.")}_controlStyleRows(e,t,i,o,s=!0){const a=(c,d,h)=>this._colorPicker(`${e}-${c}`,d,_=>h(_||void 0)),n=(c,d,h,_=1,m)=>this._csNumRow(t,o,c,d,h,_,m),l=(c,d,h)=>this._csShadowRow(t,o,c,d,h);return r`
      ${s?r`
        ${this._csGradientRows(`${e}-accent`,"Accent","accent_color","accent_color2","accent_angle",t,o)}
      `:u}
      ${i==="toggle"?r`
        <div class="ec-subsection-title">Toggle</div>
        ${this._csGradientRows(`${e}-on`,"On color","toggle_on_color","toggle_on_color2","toggle_on_angle",t,o,"Track colour while the toggle is on.")}
        ${this._csGradientRows(`${e}-off`,"Off color","toggle_off_color","toggle_off_color2","toggle_off_angle",t,o,"Track colour while the toggle is off.")}
        <div class="ec-subsection-title">Toggle thumb</div>
        ${this._row("Thumb color",a("th-col",t.toggle_thumb_color,c=>o({toggle_thumb_color:c})),"Colour of the moving knob.")}
        ${n("Thumb size (px)","toggle_thumb_size","18")}
        ${n("Thumb radius (px)","toggle_thumb_radius","circle",0,"Unset keeps the thumb round.")}
        ${n("Thumb padding (px)","toggle_thumb_padding","2",0)}
        ${l("Thumb shadow","toggle_thumb_shadow","0 1px 3px rgba(0,0,0,0.5)")}
      `:u}
      ${i==="slider"?r`
        <div class="ec-subsection-title">Slider</div>
        ${this._csGradientRows(`${e}-track`,"Track color","slider_track_color","slider_track_color2","slider_track_angle",t,o,"Colour of the slider's empty track.")}
        ${this._csGradientRows(`${e}-fill`,"Fill color","slider_fill_color","slider_fill_color2","slider_fill_angle",t,o,"Colour of the filled part up to the value.")}
        ${n("Track height (px)","slider_height","6")}
        ${n("Track length (px)","slider_length","fill width",0,"Unset lets the track fill the field's width.")}
        ${n("Track radius (px)","slider_radius","pill",0,"Unset gives the track fully rounded ends.")}
        ${this._row("Border",r`<input type="checkbox" .checked=${t.slider_border??!1}
            @change=${c=>o({slider_border:c.target.checked||void 0})}
          />`,"Draws a border around the track, using the track radius above.")}
        ${t.slider_border?r`
          ${this._row("Border color",a("track-bd",t.slider_border_color,c=>o({slider_border_color:c})),"Colour of the track's border.")}
          ${n("Border width (px)","slider_border_width","1",0)}
        `:u}
        <div class="ec-subsection-title">Slider thumb</div>
        ${this._row("Thumb color",a("thumb",t.slider_thumb_color,c=>o({slider_thumb_color:c})),"Colour of the moving knob.")}
        ${n("Thumb size (px)","slider_thumb_size","16")}
        ${n("Thumb width (px)","slider_thumb_width","thumb size",1,"Unset keeps the thumb square-on.")}
        ${n("Thumb radius (px)","slider_thumb_radius","circle",0,"Unset keeps the thumb round.")}
        ${n("Thumb padding (px)","slider_thumb_padding","0",0)}
        ${l("Thumb shadow","slider_thumb_shadow","0 1px 4px rgba(0,0,0,0.5)")}
      `:u}
      ${i==="dropdown"?r`
        <div class="ec-subsection-title">Dropdown</div>
        ${this._row("Border",a("dd-bd",t.dropdown_border_color,c=>o({dropdown_border_color:c})),"Colour of the control's outline.")}
        ${this._csGradientRows(`${e}-dd-bg`,"Background","dropdown_bg","dropdown_bg2","dropdown_bg_angle",t,o,"Fill of the closed control.")}
        ${this._csGradientRows(`${e}-dd-mbg`,"Menu background","dropdown_menu_bg","dropdown_menu_bg2","dropdown_menu_bg_angle",t,o,"Fill of the open dropdown menu.")}
        ${this._row("Menu border",a("dd-mbd",t.dropdown_menu_border_color,c=>o({dropdown_menu_border_color:c})),"Colour of the open menu's outline.")}
        ${this._csGradientRows(`${e}-dd-sel`,"Selected color","dropdown_selected_color","dropdown_selected_color2","dropdown_selected_angle",t,o,"Highlight behind the option matching the entity's state.")}
        ${n("Radius (px)","dropdown_radius","6")}
        ${n("Text size (px)","dropdown_text_size","13")}
        <div class="ec-subsection-title">Dropdown menu</div>
        ${n("Menu radius (px)","dropdown_menu_radius","8",0)}
        ${l("Menu shadow","dropdown_menu_shadow","0 6px 20px rgba(0,0,0,0.5)")}
        ${n("Option radius (px)","dropdown_option_radius","5",0)}
        ${this._row("Option text",a("dd-otx",t.dropdown_option_text_color,c=>o({dropdown_option_text_color:c})),"Colour of the options in the open menu.")}
        ${this._row("Option hover",a("dd-ohv",t.dropdown_option_hover_color,c=>o({dropdown_option_hover_color:c})),"Highlight behind the option under the pointer.")}
        <p class="ec-hint">The menu is opaque so it can cover the background image, which is why its
          option text is set here rather than inherited from the card.</p>
      `:u}
      ${i==="input"?r`
        <div class="ec-subsection-title">Input</div>
        ${this._row("Border",a("in-bd",t.input_border_color,c=>o({input_border_color:c})),"Colour of the control's outline.")}
        ${this._csGradientRows(`${e}-in-bg`,"Background","input_bg","input_bg2","input_bg_angle",t,o,"Fill of the input.")}
        ${this._row("Focus color",a("in-fc",t.input_focus_color,c=>o({input_focus_color:c})),"Outline colour while the input has focus.")}
        ${this._row("Placeholder",a("in-ph",t.input_placeholder_color,c=>o({input_placeholder_color:c})),"Colour of the prompt text shown while the input is empty.")}
        ${n("Radius (px)","input_radius","6")}
        ${n("Text size (px)","input_text_size","13")}
      `:u}
      ${i==="spinbox"?r`
        <div class="ec-subsection-title">Spin Box</div>
        ${this._row("Border",a("sp-bd",t.spinbox_border_color,c=>o({spinbox_border_color:c})),"Colour of the control's outline.")}
        ${this._csGradientRows(`${e}-sp-bg`,"Button background","spinbox_bg","spinbox_bg2","spinbox_bg_angle",t,o,"Fill of the spin box's + and − buttons.")}
        ${this._csGradientRows(`${e}-sp-hv`,"Button hover","spinbox_button_hover_color","spinbox_button_hover_color2","spinbox_button_hover_angle",t,o,"Fill of a spin box button under the pointer.")}
        ${n("Button width (px)","spinbox_button_width","30")}
        ${n("Button glyph size (px)","spinbox_button_font_size","18")}
        ${n("Radius (px)","spinbox_radius","7")}
        ${n("Text size (px)","spinbox_text_size","13")}
      `:u}
    `}_controlDefaultsMenu(){return this._navMenu(p._CONTROL_DEFAULTS_SECTIONS,this._defaultsScope())}_controlDefaultsSection(e){return r`
      ${this._clearOverridesBtn(p._findDef(p._CONTROL_DEFAULTS_SECTIONS,e),this._defaultsScope())}
      ${this._controlDefaultsSectionBody(e)}
    `}_controlDefaultsSectionBody(e){const t=this._config?.defaults??{},i=t.control_style??{},o=a=>this._updateDefaults({control_style:{...i,...a}});if(e==="cd:container")return r`<div class="ec-section">
        <p class="ec-hint">Box (background, border, radius, shadow) applied behind every control. Per-field <b>Control Style</b> can override it.</p>
        ${this._boxRows("d-ctl-box",t.control??{},a=>this._updateDefaults({control:{...t.control,...a}}))}
      </div>`;if(e==="cd:common")return r`<div class="ec-section">
        ${this._csGradientRows("d-ctl-accent","Accent","accent_color","accent_color2","accent_angle",i,o,"The colour slider fill, toggle-on, and each control's selected and focus state fall back to.")}
        <p class="ec-hint">Setting an accent gradient themes every surface that falls back to the accent — slider fill, toggle-on, dropdown / button group selected, spin box hover. Borders and focus outlines stay the flat accent color. Each surface stays flat until you tick <b>Gradient</b> on a color of its own.</p>
        <div class="ec-subsection-title">Default gradient angle</div>
        <p class="ec-hint">Used by every control gradient that has no angle of its own. Each <b>Gradient</b> checkbox reveals an angle beside its color — set one there to turn just that surface, or leave it blank to follow this.</p>
        ${this._controlGradientAngleRow(i,o)}
      </div>`;if(e==="cd:density")return this._controlDensitySection(t);if(e==="cd:variants")return this._controlVariantsSection();const s=e.slice(3);return r`<div class="ec-section">${this._controlStyleRows("d-ctl",i,s,o,!1)}</div>`}_controlDensitySection(e){return r`<div class="ec-section">
      <p class="ec-hint">One set of knobs for how tight or loose <b>every</b> control is. Each sits below the per-field
        and per-card settings, so it can never override something you set on a specific field. Set one and the whole
        control surface scales off it, keeping the proportions — a slider's value readout stays a step smaller than
        its label, two label rows stay tighter than the gap to the control.</p>
      ${this._controlNumRow("Text size (px)",e.control_font_size,"natural (13)",t=>this._updateDefaults({control_font_size:t}),1,"Unset keeps each part of a control at its own natural size.")}
      ${this._row("Padding",r`<input class="ec-input" type="text" .value=${e.control_padding??""}
          placeholder="natural (5px 8px)"
          @change=${t=>{const i=t.target.value.trim();this._updateDefaults({control_padding:i||void 0})}}
        />`,"A full CSS padding value for every control's field box — the input, the dropdown trigger and its options, and each button group or button cell.")}
      ${this._controlNumRow("Gap (px)",e.control_gap,"natural (4)",t=>this._updateDefaults({control_gap:t}),0)}
      <p class="ec-hint">Every gap inside a control is a fixed multiple of this one: label rows sit at half, a control and its label at double.</p>
    </div>`}static _selectorDefaultsDefs(e){const t=e?"btn":"sel",i=e?"button_option_layout":"option_layout",o=[{key:"sub:container",label:"Field Container",hint:"Sizes, placement, text",icon:"mdi:card-outline",paths:[...A("control_style",le["sub:container"][t]),...A(i,uo)]},{key:"sub:active",label:"Active State",hint:"Colors when the option is active",icon:"mdi:circle-slice-8",paths:A("control_style",le["sub:active"][t])},{key:"sub:inactive",label:"Inactive State",hint:"Colors when the option is inactive",icon:"mdi:circle-outline",paths:A("control_style",le["sub:inactive"][t])}];return e?o:[...o,{key:"sub:separation",label:"Option Separation",hint:"Frame border, gap, per-option style",icon:"mdi:dots-grid",paths:A("control_style",dt)}]}_selectorDefaultsMenu(e){return this._navMenu(p._selectorDefaultsDefs(e==="cd:button"),this._defaultsScope())}_selectorDefaultsSection(e,t){return r`
      ${this._clearOverridesBtn(p._findDef(p._selectorDefaultsDefs(e==="cd:button"),t),this._defaultsScope())}
      ${this._selectorDefaultsSectionBody(e,t)}
    `}_selectorDefaultsSectionBody(e,t){const i=this._config?.defaults??{},o=i.control_style??{},s=c=>this._updateDefaults({control_style:{...o,...c}}),a=e==="cd:button";if(t==="sub:separation")return r`<div class="ec-section">${this._optionSeparationRows(o,s)}</div>`;if(t==="sub:active"||t==="sub:inactive")return r`<div class="ec-section">${this._selectorStateRows("d-ctl",o,s,t,a)}</div>`;const n=(a?i.button_option_layout:i.option_layout)??{},l=c=>this._updateDefaults(a?{button_option_layout:{...n,...c}}:{option_layout:{...n,...c}});return r`<div class="ec-section">
      ${this._selectorStateRows("d-ctl",o,s,"sub:container",a)}
      <div class="ec-subsection-title">Placement &amp; text</div>
      ${this._optionLayoutRows(n,l,"d-ol")}
    </div>`}_variantOptions(e,t){const i=s=>r`<option value=${s.id} .selected=${t===s.id}>${s.label}</option>`,o=hi(e);return o.length?r`
      <optgroup label="Built-in">${Ft(e).map(i)}</optgroup>
      <optgroup label="Custom">${o.map(i)}</optgroup>
    `:r`${We(e).map(i)}`}_updateVariants(e,t){const i=this._config?.defaults?.control_variants??{},o={...i,[e]:t([...i[e]??[]])};for(const a of Object.keys(o))o[a]?.length||delete o[a];const s=Object.keys(o).length?o:void 0;this._updateDefaults({control_variants:s}),Ge(s)}_controlVariantsSection(){const e=this._config?.defaults?.control_variants??{},t=At.filter(o=>(e[o]??[]).length>0),i=t.reduce((o,s)=>o+(e[s]?.length??0),0);return r`
      <div class="ec-section">
        <p class="ec-hint">
          Custom variants are stored in <b>this card's configuration</b>, not in the Mosaic bundle — so
          installing a release that updates the built-in variants can never overwrite them. To reuse them on
          another card, use <b>Templates ▸ Export / Import Control Variants</b>.
        </p>
        <p class="ec-hint">
          To create one: configure a control field until it behaves the way you want, then use
          <b>Save as Variant</b> in that field's <b>Entity &amp; Action</b> section — or its
          <b>Variant</b> section, for a button group with manual options. If the field is already on a
          custom variant, the same panel can update it in place.
        </p>
        ${i===0?r`<p class="ec-empty">No custom variants yet.</p>`:t.map(o=>r`
              <div class="ec-subsection-title">${ge[o]}</div>
              ${(e[o]??[]).map((s,a)=>this._variantRow(o,s,a))}
            `)}
      </div>
    `}_variantRow(e,t,i){const o=`${e}:${t.id}`,s=this._variantOpen===o,a=l=>this._updateVariants(e,c=>c.map((d,h)=>h===i?{...d,...l}:d)),n=Object.keys(t.preset??{}).length;return r`
      <div class="ec-list-row" style="flex-direction:column;align-items:stretch;gap:6px;">
        <div style="display:flex;align-items:center;gap:6px;">
          <ha-icon icon=${t.icon||ye[e]}></ha-icon>
          <span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${t.label}</span>
          <span style="font-size:11px;opacity:0.55;white-space:nowrap;">${n} key${n===1?"":"s"}</span>
          <button class="ec-btn-add" style="padding:2px 8px;"
            @click=${()=>{this._variantOpen=s?"":o,this._variantError=""}}
          >${s?"Close":"Edit"}</button>
          <button class="ec-btn-add" style="padding:2px 8px;" title="Duplicate"
            @click=${()=>{const l=Ce(e,`${t.id}_copy`);this._updateVariants(e,c=>[...c,{...t,id:l,label:`${t.label} (copy)`}]),this._variantOpen=`${e}:${l}`}}
          >⧉</button>
          <button class="ec-btn-remove" title="Delete"
            @click=${()=>{window.confirm(`Delete variant "${t.label}"?

Fields already using it keep their current settings — they just lose the link to this variant.`)&&this._updateVariants(e,l=>l.filter((c,d)=>d!==i))}}
          >✕</button>
        </div>
        ${s?r`
          ${this._row("Label",r`<input class="ec-input" type="text" .value=${t.label}
              @change=${l=>{const c=l.target.value.trim();c?a({label:c}):l.target.value=t.label}} />`)}
          ${this._row("Icon",this._iconPicker(t.icon,l=>a({icon:l}),ye[e]))}
          ${this._row("Id",r`<span class="ec-input" style="opacity:0.6;">${t.id}</span>`)}
          <p class="ec-hint">The id is fixed after creation — fields store it to remember which variant they use. Rename the <b>Label</b> instead; that's what the Variant dropdown shows.</p>
          ${this._row("Domains",r`<input class="ec-input" type="text" placeholder="light, switch — blank for any" .value=${(t.domain??[]).join(", ")}
              @change=${l=>{const c=l.target.value.split(",").map(d=>d.trim()).filter(Boolean);a({domain:c.length?c:void 0})}} />`)}
          <div class="ec-subsection-title">Preset</div>
          <p class="ec-hint">Captured from the field this variant was saved from. Richer settings (labels, track labels, option lists) are easiest to author on a real field and re-capture with <b>Save as Variant</b>; this JSON is the escape hatch.</p>
          <textarea class="ec-input" rows="8" spellcheck="false"
            style="font-family:ui-monospace,monospace;font-size:11px;line-height:1.4;resize:vertical;"
            .value=${JSON.stringify(t.preset??{},null,2)}
            @change=${l=>{const c=l.target.value.trim();try{const d=c?JSON.parse(c):{};if(typeof d!="object"||d===null||Array.isArray(d))throw new Error("Preset must be a JSON object.");const h=Object.keys(d).filter(_=>!Dt.includes(_));if(h.length)throw new Error(`Not preset keys: ${h.join(", ")}`);this._variantError="",a({preset:Object.keys(d).length?d:void 0})}catch(d){this._variantError=d instanceof Error?d.message:"Invalid JSON."}}}
          ></textarea>
          ${this._variantError?r`<p style="color:#f44;font-size:12px;margin:6px 0 0;">${this._variantError}</p>`:u}
        `:u}
      </div>
    `}_controlStyleUsesGlobal(e,t){const i=e.control_style,o=p._separationOnly(i);return i===void 0||!this._colorOverridesOn.has(t)&&o!==void 0&&Object.keys(i).length===Object.keys(o).length}static _fscsDefs(e){const t=e?"btn":"sel";return[{key:"fscs:container",label:"Field Container",hint:"Border, radius, font sizes",icon:"mdi:card-outline",paths:A("control_style",p._containerPathsForField(t))},{key:"fscs:active",label:"Active State",hint:"Colors when the option is active",icon:"mdi:circle-slice-8",paths:A("control_style",le["sub:active"][t])},{key:"fscs:inactive",label:"Inactive State",hint:"Colors when the option is inactive",icon:"mdi:circle-outline",paths:A("control_style",le["sub:inactive"][t])}]}_fieldSecControlStyle(e,t,i,o=!1){const s=this._updFor(e,t,o),a=this._idFor(e,t,o),n=i.control_style,l=_=>s({control_style:{...i.control_style,..._}}),c=p._separationOnly(n),d=this._controlStyleUsesGlobal(i,a),h=i.type==="button_group"||i.type==="button";return r`
      <div class="ec-section">
        ${this._row("Use global control style",r`<input type="checkbox" .checked=${d}
            @change=${_=>{_.target.checked?(this._colorOverridesOn.delete(a),s({control_style:c})):(this._colorOverridesOn.add(a),s({control_style:{...n??{}}})),this.requestUpdate()}}
          />`)}
        <p class="ec-hint">Ticked, this control's colours follow <b>Settings ▸ Global Defaults ▸ Control
          Default</b>. Option separation is set in <b>Options</b> and is kept either way.</p>
        ${d?u:h?this._navMenu(p._fscsDefs(i.type==="button"),this._fieldScope(e,t,o)):r`
          <div class="ec-subsection-title">Color overrides</div>
          ${this._controlStyleRows(`${a}-ctl`,n??{},i.type,l)}
        `}
        <div class="ec-subsection-title">Container box</div>
        ${this._row("Override container",r`<input type="checkbox" .checked=${i.control_box!==void 0}
            @change=${_=>s({control_box:_.target.checked?{}:void 0})}
          />`,"Gives this control its own box, instead of the one in Control Default ▸ Container Box.")}
        ${i.control_box!==void 0?this._boxRows(`${a}-ctlbox`,i.control_box,_=>s({control_box:{...i.control_box,..._}}),zt):u}
        ${this._cssRow(i.extra_css,_=>s({extra_css:_}))}
      </div>
    `}_fieldControlStyleStateSection(e,t,i,o,s=!1){const a=this._updFor(e,t,s),n=this._idFor(e,t,s),l=i.control_style??{},c=h=>a({control_style:{...i.control_style,...h}}),d=o==="fscs:active"?"sub:active":o==="fscs:inactive"?"sub:inactive":"sub:container";return r`
      ${this._clearOverridesBtn(p._findDef(p._fscsDefs(i.type==="button"),o),this._fieldScope(e,t,s))}
      <div class="ec-section">${this._selectorStateRows(`${n}-ctl`,l,c,d,i.type==="button")}</div>
    `}_defaultsSecLayout(){const e=this._config?.defaults??{};return r`
      <div class="ec-section">
          ${this._row("Power unit",r`<select class="ec-select"
              .value=${e.power_unit??""}
              @change=${t=>{const i=t.target.value;this._updateDefaults({power_unit:i||void 0})}}
            >
              <option value=""   .selected=${!e.power_unit}>Auto (W / kW)</option>
              <option value="W"  .selected=${e.power_unit==="W"}>Always W</option>
              <option value="kW" .selected=${e.power_unit==="kW"}>Always kW</option>
            </select>`,"Whether power values are shown in watts, kilowatts, or switched automatically as they grow.")}

          ${this._numRow("Graph refresh (min)",{value:e.stat_update_interval,onChange:t=>this._updateDefaults({stat_update_interval:t}),min:1,max:60,placeholder:"5",hint:"How often every graph, gauge and statistic value on this dashboard re-queries Home Assistant. A single graph can set its own on its Graph Settings screen. Nothing polls while the card is off-screen or its tab is in the background."})}

          ${this._row("Font family",r`<input class="ec-input" type="text" .value=${e.font_family??""}
              placeholder="inherit"
              @change=${t=>{const i=t.target.value;this._updateDefaults({font_family:i===""?void 0:i})}}
            />`,"A CSS font stack for every text on the card. Unset follows the dashboard theme.")}

          ${this._row("Font family – monospace",r`<input class="ec-input" type="text" .value=${e.mono_font_family??""}
              placeholder="'Courier New', monospace"
              @change=${t=>{const i=t.target.value;this._updateDefaults({mono_font_family:i===""?void 0:i})}}
            />`,"A CSS font stack for fixed-width text.")}
          <p class="ec-hint">Only used where a fixed-width font is required (e.g. numeric counters, timers).</p>

          <p class="ec-hint">Field spacing is not here: every card type owns its own. A Mosaic card's gaps and field
            placement are on <b>Mosaic Card Defaults</b>, a popover's on <b>Popover Card Defaults</b>, and an
            embedded card has no fields of its own to space.</p>
      </div>
    `}_elemLibMenu(){const e=p._ELEM_LIB_SECTIONS,t=this._currentListFilter(),i=this._config?.defaults;return r`
      ${this._listFilterBox(e.length)}
      ${e.filter(o=>!t||o.label.toLowerCase().includes(t)).map(o=>this._navBtn(o.key,o.label,o.hint,o.icon,Ke(i,o.paths)))}
    `}_elemLibSection(e){let t;switch(e){case"el:thermo-v":t=this._elemThermoV();break;case"el:thermo-h":t=this._elemThermoH();break;case"el:bat-h":t=this._elemBatH();break;case"el:bat-v":t=this._elemBatV();break;case"el:tank-cyl":t=this._elemTankCyl();break;case"el:tank-water":t=this._elemTankWater();break;case"el:tank-ferm":t=this._elemTankFerm();break;case"el:tank-cone":t=this._elemTankCone();break;case"el:inverter":t=this._elemInverter();break;case"el:gauge-arc":t=this._elemGaugeArc();break;default:return r``}const i=p.ELEM_CSS_KEY[e],o=this._config?.defaults??{};return r`
      ${this._clearOverridesBtn(p._findDef(p._ELEM_LIB_SECTIONS,e),this._defaultsScope())}
      ${t}
      <div class="ec-section">
        ${this._cssRow(o[i],s=>this._updateDefaults({[i]:s}))}
      </div>`}_elemThermoV(){const e=this._config?.defaults??{};return r`
      <div class="ec-section">
              <div class="ec-subsection-title">…– ticks</div>
              ${this._row("Tick color",this._colorPicker("d-thermo-tc",e.thermo_tick_color,t=>this._updateDefaults({thermo_tick_color:t||void 0})),H.tick_color)}
              ${this._row("Tick position",r`<select class="ec-select"
                  .value=${e.thermo_text_position??b("thermo_text_position")??"right"}
                  @change=${t=>this._updateDefaults({thermo_text_position:t.target.value})}
                >
                  ${["right","left","both"].map(t=>r`<option value=${t} .selected=${(e.thermo_text_position??b("thermo_text_position")??"right")===t}>${t.charAt(0).toUpperCase()+t.slice(1)}</option>`)}
                </select>`,H.tick_position)}
              ${this._row("Minor tick text",r`<input type="checkbox" class="ec-checkbox"
                  .checked=${e.thermo_show_minor_tick_text??b("thermo_show_minor_tick_text")??!1}
                  @change=${t=>this._updateDefaults({thermo_show_minor_tick_text:t.target.checked})} />`,H.minor_tick_text)}
              ${this._numRow("Tick font size",{hint:H.tick_font_size,value:e.thermo_tick_font_size,onChange:t=>this._updateDefaults({thermo_tick_font_size:t}),min:1,max:20,step:.5,placeholder:"4"})}
              ${this._numRow("Major tick length",{value:e.thermo_major_tick_length,onChange:t=>this._updateDefaults({thermo_major_tick_length:t}),min:.5,max:20,step:.5,placeholder:"auto (from SVG)"})}
              ${this._numRow("Major tick thickness",{value:e.thermo_major_tick_width,onChange:t=>this._updateDefaults({thermo_major_tick_width:t}),min:.1,max:5,step:.05,placeholder:"auto (from SVG)"})}
              ${this._numRow("Minor tick length",{value:e.thermo_minor_tick_length,onChange:t=>this._updateDefaults({thermo_minor_tick_length:t}),min:.5,max:20,step:.5,placeholder:"auto (from SVG)"})}
              ${this._numRow("Minor tick thickness",{value:e.thermo_minor_tick_width,onChange:t=>this._updateDefaults({thermo_minor_tick_width:t}),min:.1,max:5,step:.05,placeholder:"auto (from SVG)"})}
              ${this._row("Grid line color",this._colorPicker("d-thermo-gc",e.thermo_grid_color,t=>this._updateDefaults({thermo_grid_color:t||void 0})),H.grid_color)}
              <div class="ec-subsection-title">Fill &amp; temperature</div>
              ${this._numRow("Above temperature transparency",{value:e.thermo_fill_opacity_above,onChange:t=>this._updateDefaults({thermo_fill_opacity_above:t}),min:0,max:1,step:.05,placeholder:"0.5"})}
              <p class="ec-hint">How visible the tube is above the current reading — 0 hides the empty part
                entirely, 1 draws it in full.</p>
              ${this._numRow("Decimals",{hint:H.decimals,value:e.thermo_decimals,onChange:t=>this._updateDefaults({thermo_decimals:t}),min:0,max:4,step:1,placeholder:"1"})}
              ${this._row("Temperature value color",this._colorPicker("d-thermo-ttc",e.thermo_temp_color,t=>this._updateDefaults({thermo_temp_color:t||void 0})),H.temp_color)}
              ${this._numRow("Temperature value size",{value:e.thermo_temp_font_size,onChange:t=>this._updateDefaults({thermo_temp_font_size:t}),min:4,max:30,step:.5,placeholder:"10"})}
              ${this._libFillRows("d-thermo-fc","thermo")}
      </div>
    `}_elemThermoH(){const e=this._config?.defaults??{};return r`
      <div class="ec-section">
              <div class="ec-subsection-title">…– ticks</div>
              ${this._row("Tick color",this._colorPicker("d-thermo-h-tc",e.thermo_h_tick_color,t=>this._updateDefaults({thermo_h_tick_color:t||void 0})),H.tick_color)}
              ${this._row("Tick position",r`<select class="ec-select"
                  .value=${e.thermo_h_text_position??b("thermo_h_text_position")??"right"}
                  @change=${t=>this._updateDefaults({thermo_h_text_position:t.target.value})}
                >
                  ${["right","left","both"].map(t=>r`<option value=${t} .selected=${(e.thermo_h_text_position??b("thermo_h_text_position")??"right")===t}>${{right:"Bottom",left:"Top",both:"Both"}[t]}</option>`)}
                </select>`,H.tick_position)}
              ${this._row("Minor tick text",r`<input type="checkbox" class="ec-checkbox"
                  .checked=${e.thermo_h_show_minor_tick_text??b("thermo_h_show_minor_tick_text")??!1}
                  @change=${t=>this._updateDefaults({thermo_h_show_minor_tick_text:t.target.checked})} />`,H.minor_tick_text)}
              ${this._numRow("Tick font size",{hint:H.tick_font_size,value:e.thermo_h_tick_font_size,onChange:t=>this._updateDefaults({thermo_h_tick_font_size:t}),min:1,max:20,step:.5,placeholder:"4"})}
              ${this._numRow("Major tick length",{value:e.thermo_h_major_tick_length,onChange:t=>this._updateDefaults({thermo_h_major_tick_length:t}),min:.5,max:20,step:.5,placeholder:"auto (from SVG)"})}
              ${this._numRow("Major tick thickness",{value:e.thermo_h_major_tick_width,onChange:t=>this._updateDefaults({thermo_h_major_tick_width:t}),min:.1,max:5,step:.05,placeholder:"auto (from SVG)"})}
              ${this._numRow("Minor tick length",{value:e.thermo_h_minor_tick_length,onChange:t=>this._updateDefaults({thermo_h_minor_tick_length:t}),min:.5,max:20,step:.5,placeholder:"auto (from SVG)"})}
              ${this._numRow("Minor tick thickness",{value:e.thermo_h_minor_tick_width,onChange:t=>this._updateDefaults({thermo_h_minor_tick_width:t}),min:.1,max:5,step:.05,placeholder:"auto (from SVG)"})}
              ${this._row("Grid line color",this._colorPicker("d-thermo-h-gc",e.thermo_h_grid_color,t=>this._updateDefaults({thermo_h_grid_color:t||void 0})),H.grid_color)}
              <div class="ec-subsection-title">Fill &amp; temperature</div>
              ${this._numRow("Above temperature transparency",{value:e.thermo_h_fill_opacity_above,onChange:t=>this._updateDefaults({thermo_h_fill_opacity_above:t}),min:0,max:1,step:.05,placeholder:"0.5"})}
              <p class="ec-hint">How visible the tube is above the current reading — 0 hides the empty part
                entirely, 1 draws it in full.</p>
              ${this._numRow("Decimals",{hint:H.decimals,value:e.thermo_h_decimals,onChange:t=>this._updateDefaults({thermo_h_decimals:t}),min:0,max:4,step:1,placeholder:"1"})}
              ${this._row("Temperature value color",this._colorPicker("d-thermo-h-ttc",e.thermo_h_temp_color,t=>this._updateDefaults({thermo_h_temp_color:t||void 0})),H.temp_color)}
              ${this._numRow("Temperature value size",{value:e.thermo_h_temp_font_size,onChange:t=>this._updateDefaults({thermo_h_temp_font_size:t}),min:4,max:30,step:.5,placeholder:"10"})}
              ${this._libFillRows("d-thermo-h-fc","thermo_h")}
      </div>
    `}_elemBatH(){return r`
      <div class="ec-section">
              ${this._libFillRows("d-bh-fc","battery_h")}
      </div>
    `}_elemBatV(){return r`
      <div class="ec-section">
              ${this._libFillRows("d-bv-fc","battery_v")}
      </div>
    `}_elemTankCyl(){const e=this._config?.defaults??{};return r`
      <div class="ec-section">
              ${this._libFillRows("d-tc-fc","tank_cylinder")}
              ${this._row("Fill direction",r`<select class="ec-select"
                  .value=${e.tank_cylinder_fill_direction??"up"}
                  @change=${t=>this._updateDefaults({tank_cylinder_fill_direction:t.target.value})}>
                  <option value="up">Up</option>
                  <option value="down">Down</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>`)}
              ${this._row("Tank wall color",e.tank_cylinder_tank_color?r`${this._colorPicker("d-tc-wc",e.tank_cylinder_tank_color,t=>this._updateDefaults({tank_cylinder_tank_color:t||void 0}),{clearTitle:"Remove (use SVG default)",onClear:()=>this._updateDefaults({tank_cylinder_tank_color:void 0})})}`:r`<button class="ec-lib-browse-btn" style="font-size:12px" @click=${()=>this._updateDefaults({tank_cylinder_tank_color:"#808080"})}>+ Set wall color</button>`)}
      </div>
    `}_elemTankWater(){const e=this._config?.defaults??{};return r`
      <div class="ec-section">
              ${this._libFillRows("d-tw-fc","tank_water")}
              ${this._row("Fill direction",r`<select class="ec-select"
                  .value=${e.tank_water_fill_direction??"up"}
                  @change=${t=>this._updateDefaults({tank_water_fill_direction:t.target.value})}>
                  <option value="up">Up</option>
                  <option value="down">Down</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>`)}
              ${this._row("Tank wall color",e.tank_water_tank_color?r`${this._colorPicker("d-tw-wc",e.tank_water_tank_color,t=>this._updateDefaults({tank_water_tank_color:t||void 0}),{clearTitle:"Remove (use SVG default)",onClear:()=>this._updateDefaults({tank_water_tank_color:void 0})})}`:r`<button class="ec-lib-browse-btn" style="font-size:12px" @click=${()=>this._updateDefaults({tank_water_tank_color:"#808080"})}>+ Set wall color</button>`)}
      </div>
    `}_elemTankFerm(){const e=this._config?.defaults??{};return r`
      <div class="ec-section">
              ${this._libFillRows("d-tf-fc","tank_fermenter")}
              ${this._row("Fill direction",r`<select class="ec-select"
                  .value=${e.tank_fermenter_fill_direction??"up"}
                  @change=${t=>this._updateDefaults({tank_fermenter_fill_direction:t.target.value})}>
                  <option value="up">Up</option>
                  <option value="down">Down</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>`)}
              ${this._row("Tank wall color",e.tank_fermenter_tank_color?r`${this._colorPicker("d-tf-wc",e.tank_fermenter_tank_color,t=>this._updateDefaults({tank_fermenter_tank_color:t||void 0}),{clearTitle:"Remove (use SVG default)",onClear:()=>this._updateDefaults({tank_fermenter_tank_color:void 0})})}`:r`<button class="ec-lib-browse-btn" style="font-size:12px" @click=${()=>this._updateDefaults({tank_fermenter_tank_color:"#808080"})}>+ Set wall color</button>`)}
      </div>
    `}_elemTankCone(){const e=this._config?.defaults??{};return r`
      <div class="ec-section">
              ${this._libFillRows("d-tn-fc","tank_cone")}
              ${this._row("Fill direction",r`<select class="ec-select"
                  .value=${e.tank_cone_fill_direction??"up"}
                  @change=${t=>this._updateDefaults({tank_cone_fill_direction:t.target.value})}>
                  <option value="up">Up</option>
                  <option value="down">Down</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>`)}
              ${this._row("Tank wall color",e.tank_cone_tank_color?r`${this._colorPicker("d-tn-wc",e.tank_cone_tank_color,t=>this._updateDefaults({tank_cone_tank_color:t||void 0}),{clearTitle:"Remove (use SVG default)",onClear:()=>this._updateDefaults({tank_cone_tank_color:void 0})})}`:r`<button class="ec-lib-browse-btn" style="font-size:12px" @click=${()=>this._updateDefaults({tank_cone_tank_color:"#808080"})}>+ Set wall color</button>`)}
      </div>
    `}_elemInverter(){const e=this._config?.defaults??{};return r`
      <div class="ec-section">
              ${this._row("Line color",this._colorPicker("d-inv-lc",e.inverter_line_color,t=>this._updateDefaults({inverter_line_color:t||void 0})))}
      </div>
    `}_elemGaugeArc(){const e=this._config?.defaults??{};return r`
      <div class="ec-section">
              ${this._row("Needle color",this._colorPicker("d-ga-nc",e.gauge_arc_needle_color,t=>this._updateDefaults({gauge_arc_needle_color:t||void 0})))}
              ${this._row("Label color",this._colorPicker("d-ga-lc",e.gauge_arc_label_color,t=>this._updateDefaults({gauge_arc_label_color:t||void 0})))}
              ${this._numRow("Label size",{value:e.gauge_arc_label_size,onChange:t=>this._updateDefaults({gauge_arc_label_size:t}),min:6,max:24,step:1,placeholder:"11"})}
      </div>
    `}_extCardScope(e){return{root:this._extCards()[e],apply:t=>this._updateExtCard(e,t)}}_extDefaultsScope(){return{root:this._config?.extended_card_defaults,apply:e=>this._updateExtDefaults(e)}}_renderPopoverPanel(){const e=this._navPath,t=this._extCards();if(e.length===0)return r`
        <div class="ec-section-header">
          <span></span>
          <button class="ec-btn-add" @click=${this._addExtCard}>+ Popover Card</button>
        </div>
        ${t.length===0?this._emptyAdd("No popover cards yet — add one",()=>this._addExtCard()):t.map((a,n)=>this._itemCard({dragKey:`extcard:${n}`,icon:"mdi:picture-in-picture-bottom-right",label:a.name??`Popover Card ${n+1}`,sub:`${a.fields.length} field${a.fields.length===1?"":"s"}`,selected:n===this._selExtCard,onClick:()=>{this._selExtCard=n,this._selExtField=-1,this._navPush(`card:${a.id}`,a.name??`Popover Card ${n+1}`)},actions:r`
                <button class="ec-btn-dup"
                  @click=${l=>{l.stopPropagation(),this._duplicateExtCard(n)}}
                  title="Duplicate card">⧉</button>
                <button class="ec-btn-remove"
                  @click=${l=>{l.stopPropagation(),this._removeExtCard(n)}}
                  title="Remove">✕</button>
              `}))}
      `;const i=this._crumbIndex(e[0].key,t);this._selExtCard=i;const o=t[i];if(!o)return this._navDeadEnd();if(e.length===1)return r`
        ${this._navMenu(p._POPOVER_CARD_SECTIONS,this._extCardScope(i))}
        ${this._renderExtFieldList(i,o)}
      `;const s=e[1].key;if(s.startsWith("field:")){const a=this._crumbIndex(s,o.fields);this._selExtField=a;const n=o.fields[a];if(!n)return this._navDeadEnd();if(e.length===4&&e[2].key==="fsec:series"&&e[3].key.startsWith("egs:")){const l=this._crumbIndex(e[3].key,n.graph_series);return this._selExtSeries=l,this._fieldSecGraphSeriesItem(i,a,n,l,!0)}if(e.length===4&&e[2].key==="fsec:options"){if(e[3].key.startsWith("eopt:")){const l=this._crumbIndex(e[3].key,n.options);return this._selExtOption=l,this._fieldSecOptionItem(i,a,n,l,!0)}if(e[3].key==="optlayout")return r`
            ${this._clearOverridesBtn(p._OPTION_LAYOUT_DEF,this._fieldScope(i,a,!0))}
            <div class="ec-section">${this._optionLayoutEditor(n,this._updFor(i,a,!0),this._idFor(i,a,!0))}</div>
          `}return e.length===4&&e[2].key==="fsec:controlstyle"&&e[3].key.startsWith("fscs:")?this._fieldControlStyleStateSection(i,a,n,e[3].key,!0):e.length===3?this._fieldSection(i,a,n,e[2].key,!0):this._renderExtFieldPanel(i,a,n)}return this._popoverCardSection(i,o,s)}_popoverGlobalDefaults(){return this._config?r`
      <div class="ec-section">
              ${this._row("Columns (default)",r`<select class="ec-select"
                  .value=${String(this._config.extended_card_defaults?.columns??b("columns")??2)}
                  @change=${e=>this._updateExtDefaults({columns:Number(e.target.value)})}
                >
                  <option value="1">1</option>
                  <option value="2" .selected=${(this._config.extended_card_defaults?.columns??b("columns")??2)===2}>2</option>
                  <option value="3" .selected=${this._config.extended_card_defaults?.columns===3}>3</option>
                  <option value="4" .selected=${this._config.extended_card_defaults?.columns===4}>4</option>
                  <option value="5" .selected=${this._config.extended_card_defaults?.columns===5}>5</option>
                  <option value="6" .selected=${this._config.extended_card_defaults?.columns===6}>6</option>
                  <option value="7" .selected=${this._config.extended_card_defaults?.columns===7}>7</option>
                  <option value="8" .selected=${this._config.extended_card_defaults?.columns===8}>8</option>
                </select>`)}
              ${this._row("Width % (default)",r`${this._numWrap(r`<input class="ec-input ec-input-num" type="number" min="20" max="100"
                  .value=${this._config.extended_card_defaults?.width!=null?String(this._config.extended_card_defaults.width):""}
                  placeholder="70"
                  @change=${e=>{const t=e.target.value;this._updateExtDefaults({width:t===""?void 0:Number(t)})}}
                />`)}`)}
              ${this._row("Height % (default)",r`${this._numWrap(r`<input class="ec-input ec-input-num" type="number" min="10" max="100"
                  .value=${this._config.extended_card_defaults?.height!=null?String(this._config.extended_card_defaults.height):""}
                  placeholder="auto"
                  @change=${e=>{const t=e.target.value;this._updateExtDefaults({height:t===""?void 0:Number(t)})}}
                />`)}`)}
              ${this._row("Field gap (px)",r`${this._numWrap(r`<input class="ec-input ec-input-num" type="number" min="0"
                  .value=${this._config.extended_card_defaults?.field_gap!=null?String(this._config.extended_card_defaults.field_gap):""}
                  placeholder="8"
                  @change=${e=>{const t=e.target.value;this._updateExtDefaults({field_gap:t===""?void 0:Number(t)})}}
                />`)}`)}
              ${this._row("Column gap (px)",r`${this._numWrap(r`<input class="ec-input ec-input-num" type="number" min="0"
                  .value=${this._config.extended_card_defaults?.column_gap!=null?String(this._config.extended_card_defaults.column_gap):""}
                  placeholder="(from global)"
                  @change=${e=>{const t=e.target.value;this._updateExtDefaults({column_gap:t===""?void 0:Number(t)})}}
                />`)}`)}
              <div class="ec-subsection-title">Card default</div>
              <p class="ec-hint">The box every popover starts from. Popovers do not inherit <b>Mosaic Card Defaults</b> — style them here, and each popover's own <b>Card Style</b> overrides this.</p>
              ${this._copyMosaicCardStyleRow()}
              ${this._boxRows("extd-card",this._config.extended_card_defaults?.card??{},e=>this._updateExtDefaults({card:{...this._config.extended_card_defaults?.card,...e}}))}
              ${this._popoverDimmingRows()}
              <div class="ec-subsection-title">Label default</div>
              <p class="ec-hint">Blank text styles here still cascade from <b>Global Defaults ▸ Label Default</b> and
                <b>Value Default</b> — only the card box above does not.</p>
              ${this._textRows("extd-lbl",this._config.extended_card_defaults?.label??{},e=>this._updateExtDefaults({label:{...this._config.extended_card_defaults?.label,...e}}))}
              <div class="ec-subsection-title">Value default</div>
              ${this._textRows("extd-val",this._config.extended_card_defaults?.value??{},e=>this._updateExtDefaults({value:{...this._config.extended_card_defaults?.value,...e}}))}
      </div>
    `:r``}_copyMosaicCardStyleRow(){const e=this._config?.defaults?.card??{},t=p._COPYABLE_CARD_STYLE_KEYS.filter(o=>e[o]!==void 0);return t.length?r`
      <button class="ec-btn-add" style="width:100%;" @click=${()=>{const o=t.length;if(!window.confirm(`Copy ${o} styling value${o===1?"":"s"} from Mosaic Card Defaults?

${t.join(", ")}

This overwrites those values on the popover defaults, and is a one-off — the two do not stay linked.`))return;const s={};for(const a of t)s[a]=e[a];this._updateExtDefaults({card:{...this._config?.extended_card_defaults?.card,...s}}),this._showUndoToast(`${o} value${o===1?"":"s"} copied from Mosaic Card Defaults`)}}>⧉ Copy styling from Mosaic Card Defaults</button>
      <p class="ec-hint">Copies the whole box style — background and gradient, border colour, border, width, radius, padding, shadow, additional CSS and blur. Nothing stays linked afterwards.</p>
    `:r`<p class="ec-hint">Nothing to copy — <b>Mosaic Card Defaults</b> has no box styling set.</p>`}_popoverDimmingRows(){const e=this._config?.defaults??{},t=ft(e,et);return r`
      <div class="ec-subsection-title">Dimming</div>
      <p class="ec-hint">How far the dashboard behind a popover is dimmed while it is open. Set independently of an expanded Mosaic card.</p>
      ${this._row("Dimming",r`
        <select class="ec-select"
          @change=${i=>this._setPopupDimming(i.target.value,et)}
        >
          ${t===void 0?r`<option value="" selected>Custom</option>`:u}
          ${Object.keys(de).map(i=>r`
            <option value=${i} .selected=${t===i}>${de[i].label} — ${de[i].hint}</option>`)}
        </select>`)}
      ${t===void 0?r`<p class="ec-hint">This scrim was set by hand in YAML, so no preset describes it. Picking one replaces it.</p>`:u}
    `}_popoverCardSection(e,t,i){const o=()=>{switch(i){case"sec:defaults":return this._popoverSecDefaults(e,t);case"sec:style":return this._popoverSecStyle(e,t);case"sec:text":return this._popoverSecText(e,t);default:return r``}};return r`
      ${this._clearOverridesBtn(p._findDef(p._POPOVER_CARD_SECTIONS,i),this._extCardScope(e))}
      ${o()}
    `}_popoverSecDefaults(e,t){return r`
      <div class="ec-section">
        ${this._row("Name",r`<input class="ec-input" type="text" .value=${t.name??""}
            @change=${i=>this._updateExtCard(e,{name:i.target.value})}
          />`)}

        ${this._row("Columns",r`<select class="ec-select"
            .value=${String(t.columns??b("columns")??2)}
            @change=${i=>this._updateExtCard(e,{columns:Number(i.target.value)})}
          >
            <option value="1">1</option>
            <option value="2" .selected=${(t.columns??b("columns")??2)===2}>2</option>
            <option value="3" .selected=${t.columns===3}>3</option>
            <option value="4" .selected=${t.columns===4}>4</option>
            <option value="5" .selected=${t.columns===5}>5</option>
            <option value="6" .selected=${t.columns===6}>6</option>
            <option value="7" .selected=${t.columns===7}>7</option>
            <option value="8" .selected=${t.columns===8}>8</option>
          </select>`,"How many columns this popover's fields flow into.")}

        ${this._numRow("Width %",{value:t.width,onChange:i=>this._updateExtCard(e,{width:i}),min:20,max:100,placeholder:"(from defaults)",hint:"Width as a percentage of the dashboard."})}

        ${this._numRow("Height %",{value:t.height,onChange:i=>this._updateExtCard(e,{height:i}),min:10,max:100,placeholder:"auto",hint:"Unset lets the popover size itself to its contents."})}

        ${this._row("Align",r`<select class="ec-select"
            .value=${t.align??b("align")??"left"}
            @change=${i=>this._updateExtCard(e,{align:i.target.value})}
          >
            ${fe.map(i=>r`<option value=${i} .selected=${(t.align??b("align")??"left")===i}>${Ie[i]}</option>`)}
          </select>`,"Horizontal alignment of the fields inside the popover.")}

        ${this._numRow("Field gap (px)",{value:t.field_gap,onChange:i=>this._updateExtCard(e,{field_gap:i}),min:0,placeholder:"(from defaults)",hint:"Vertical space between fields."})}

        ${this._numRow("Column gap (px)",{value:t.column_gap,onChange:i=>this._updateExtCard(e,{column_gap:i}),min:0,placeholder:"(from defaults)",hint:"Horizontal space between field columns."})}
      </div>
    `}_inheritRow(e,t,i,o){return r`
      ${this._row(e,r`<input type="checkbox" .checked=${!i}
          @change=${s=>o(s.target.checked)} />`,"Ticked, this follows the global default named below. Unticking gives it settings of its own, starting empty.")}
      ${i?u:r`<p class="ec-hint">${t}</p>`}
    `}_popoverSecStyle(e,t){return r`
      <div class="ec-section">
        ${this._inheritRow("Use global card style","Following Global Defaults ▸ Popover Card Defaults ▸ Card default.",t.box!==void 0,i=>this._updateExtCard(e,{box:i?void 0:{}}))}
        ${t.box!==void 0?r`
          <div class="ec-subsection-title">Box style</div>
          ${this._boxRows(`ext${e}`,t.box,i=>this._updateExtCardBox(e,i))}
        `:u}
      </div>
    `}_popoverSecText(e,t){return r`
      <div class="ec-section">
        ${this._inheritRow("Use global label style","Following Global Defaults ▸ Popover Card Defaults ▸ Label default.",t.label_style!==void 0,i=>this._updateExtCard(e,{label_style:i?void 0:{}}))}
        ${t.label_style!==void 0?r`
          <div class="ec-subsection-title">Label Default</div>
          ${this._textRows(`ext${e}-ls`,t.label_style,i=>this._updateExtCard(e,{label_style:{...t.label_style,...i}}))}
        `:u}

        ${this._inheritRow("Use global value style","Following Global Defaults ▸ Popover Card Defaults ▸ Value default.",t.value_style!==void 0,i=>this._updateExtCard(e,{value_style:i?void 0:{}}))}
        ${t.value_style!==void 0?r`
          <div class="ec-subsection-title">Value Default</div>
          ${this._textRows(`ext${e}-vs`,t.value_style,i=>this._updateExtCard(e,{value_style:{...t.value_style,...i}}))}
        `:u}
      </div>
    `}_renderExtFieldList(e,t){const i=t.fields;return r`
      <div class="ec-section ec-section--fields">
        <div class="ec-section-header">
          <span class="ec-section-title">Fields</span>
          ${this._copiedField?r`<button class="ec-btn-paste"
            @click=${()=>this._pasteField(e,!0)}
            title="Paste copied field onto this card">⎗ Field</button>`:u}
          <button class="ec-btn-add" @click=${()=>this._addExtField(e)}>+ Field</button>
        </div>
        ${this._listFilterBox(i.length)}
        ${i.length===0?this._emptyAdd("No fields yet — add one",()=>this._addExtField(e)):i.map((o,s)=>({f:o,efi:s})).filter(({f:o})=>{const s=this._currentListFilter();return!s||`${this._fieldName(o)} ${this._fieldSub(o)}`.toLowerCase().includes(s)}).map(({f:o,efi:s})=>this._itemCard({dragKey:`extfield:${e}:${s}`,icon:ye[o.type],label:this._fieldName(o),sub:this._fieldSub(o),selected:s===this._selExtField,onClick:()=>{this._selExtField=s,this._navPush(`field:${o.id}`,`Field ${s+1}`)},actions:r`
                ${this._copiedFieldSrc?.isExt===!0&&this._copiedFieldSrc.cardId===t.id&&this._copiedFieldSrc.fieldId===o.id?r`<span class="ec-copy-badge">Copied</span>`:r`<button class="ec-btn-copy"
                      @click=${a=>{a.stopPropagation(),this._copyField(e,s,!0)}}
                      title="Copy this field">⎘</button>`}
                <button class="ec-btn-dup"
                  @click=${a=>{a.stopPropagation(),this._duplicateField(e,s,!0)}}
                  title="Duplicate field">⧉</button>
                <button class="ec-btn-remove"
                  @click=${a=>{a.stopPropagation(),this._removeExtField(e,s)}}
                  title="Remove">✕</button>
              `}))}
      </div>
    `}_extFieldHeader(e,t,i){const o=s=>this._updateExtField(e,t,s);return r`
        <div class="ec-section-header">
          <span class="ec-section-title">Field ${t+1}</span>
        </div>

        ${this._row("Type",r`<select class="ec-select"
            .value=${i.type==="graph"?"svg":i.type}
            @change=${s=>{const a=s.target.value;if(J(a)){const n=bt(a);if(n&&!this._confirmVariantOptionLoss(i,a,n)){s.target.value=i.type==="graph"?"svg":i.type;return}o(this._typeChangePatch(i,a,n?Se(a,n):{}))}else{if(!this._confirmTypeOptionLoss(i,a)){s.target.value=i.type==="graph"?"svg":i.type;return}o(this._typeChangePatch(i,a)),a==="svg"&&this._openGGPicker(e,t,!0)}}}
          >
            ${Tt.map(s=>r`<option value=${s} .selected=${(i.type==="graph"?"svg":i.type)===s}>${ge[s]}</option>`)}
          </select>`)}

        ${J(i.type)&&We(i.type).length>1?this._row("Variant",r`<select class="ec-select"
            .value=${i.variant??""}
            @change=${s=>{const a=s.target.value;if(!this._confirmVariantOptionLoss(i,i.type,a)){s.target.value=i.variant??"";return}o(Se(i.type,a))}}
          >
            ${this._variantOptions(i.type,i.variant)}
          </select>`):u}

        ${i.type==="svg"||i.type==="graph"?this._row("Element",r`<div style="display:flex;gap:8px;align-items:center;">
            <span class="ec-input" style="flex:1;min-width:0;opacity:0.85;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${this._elementLabel(i)}</span>
            <button class="ec-lib-browse-btn" style="flex:0 0 auto;white-space:nowrap;" @click=${()=>this._openGGPicker(e,t,!0)}>⊞ Change type…</button>
          </div>`):u}

        ${this._row("Display Name",r`<input class="ec-input" type="text"
            .value=${i.display_name??""}
            placeholder="Friendly name for the field list"
            @change=${s=>{const a=s.target.value.trim();o({display_name:a===""?void 0:a})}}
          />`)}

        ${this._row("Column",r`<div style="display:flex;gap:4px;align-items:center">
            ${this._numWrap(r`<input class="ec-input ec-input-num-small" type="number" min="1" max="8"
              .value=${i.column!=null?String(i.column):""}
              placeholder="auto"
              title="Force this field into a specific column (1–8). Leave blank for auto flow."
              @change=${s=>{const a=s.target.value;o({column:a===""?void 0:Number(a)})}}
            />`)}
            <span style="font-size:11px;opacity:0.6">Span end (Opt)</span>
            ${this._numWrap(r`<input class="ec-input ec-input-num-small" type="number" min="2" max="8"
              .value=${i.column_end!=null?String(i.column_end):""}
              placeholder="–"
              title="Span End Column (Opt) — last column this field occupies"
              @change=${s=>{const a=s.target.value;o({column_end:a===""?void 0:Number(a)})}}
            />`)}
          </div>`)}
    `}_renderExtFieldPanel(e,t,i){return i.type==="blank"||i.type==="rule"?r`
        <div class="ec-section ec-section--fields">
          ${this._extFieldHeader(e,t,i)}
          ${this._fieldSecBlankOrRule(e,t,i,!0)}
        </div>
      `:r`
      <div class="ec-section ec-section--fields">
        ${this._extFieldHeader(e,t,i)}
        ${this._fieldSectionMenu(i,e,t,!0)}
      </div>
    `}_renderCanvasRibbonPanel(){const e=this._navPath;if(e.length===0)return this._canvasSectionMenu();if(e[0].key==="sec:bg"&&e.length===2&&e[1].key.startsWith("cbgr:")){const t=this._crumbIndex(e[1].key,this._config?.background?.rules);return this._selCanvasBgRule=t,this._canvasSecBgRule(t)}return this._canvasSection(e[0].key)}_canvasScope(){return{root:this._config,apply:e=>{this._config&&this._emit(V(this._config,e))}}}_canvasSectionMenu(){return this._navMenu(p._CANVAS_SECTIONS,this._canvasScope())}_canvasSection(e){const t=()=>{switch(e){case"sec:mode":return this._canvasSecMode();case"sec:size":return this._canvasSecSize();case"sec:box":return this._canvasSecBox();case"sec:bg":return r`<div class="ec-section">${this._renderBackgroundControls()}</div>`;default:return r``}};return r`
      ${this._clearOverridesBtn(p._findDef(p._CANVAS_SECTIONS,e),this._canvasScope())}
      ${t()}
    `}_gridEntryWarning(){const e=this._config?.cards?.length??0,t=this._embCards().length;if(!e&&!t)return u;const i=[];return e&&i.push(`${e} card${e===1?"":"s"}`),t&&i.push(`${t} embedded card${t===1?"":"s"}`),r`
      <ha-alert alert-type="warning">
        Switching to Grid re-lays out ${i.join(" and ")}: each one snaps to the nearest
        grid intersection, is re-anchored to its centre, and is resized to a whole number of
        columns. Switching back to Precision does not restore the old layout — use Ctrl+Z to
        undo.
      </ha-alert>
    `}_canvasSecMode(){const e=this._config?.canvas??{},t=e.layout_mode==="grid";return r`
      <div class="ec-section">
          <div class="ec-mode-tiles">
            <button type="button" class="ec-mode-tile${t?"":" active"}"
              @click=${()=>this._setLayoutMode("precision")}
            >
              <ha-icon icon="mdi:crosshairs-gps"></ha-icon>
              <span>Precision</span>
            </button>
            <button type="button" class="ec-mode-tile${t?" active":""}"
              @click=${()=>this._setLayoutMode("grid")}
            >
              <ha-icon icon="mdi:grid"></ha-icon>
              <span>Grid</span>
            </button>
          </div>

          ${t?u:this._gridEntryWarning()}

          ${e.layout_mode==="grid"?r`
            ${this._row("Grid columns",r`${this._numWrap(r`<input class="ec-input ec-input-num" type="number" min="1"
                .value=${String(e.grid?.columns??10)}
                @change=${i=>{const o=Math.max(1,Number(i.target.value)||1);this._updateCanvas({grid:{...e.grid??{columns:10,rows:15},columns:o}})}}
              />`)}`,"How many columns the canvas is divided into.")}

            ${this._row("Grid rows",r`${this._numWrap(r`<input class="ec-input ec-input-num" type="number" min="1"
                .value=${String(e.grid?.rows??15)}
                @change=${i=>{const o=Math.max(1,Number(i.target.value)||1);this._updateCanvas({grid:{...e.grid??{columns:10,rows:15},rows:o}})}}
              />`)}`,"How many rows the canvas is divided into.")}

            ${this._row("Card padding (px)",r`${this._numWrap(r`<input class="ec-input ec-input-num" type="number" min="0"
                .value=${String(e.grid?.padding??0)}
                @change=${i=>{const o=Math.max(0,Number(i.target.value)||0);this._updateCanvas({grid:{...e.grid??{columns:10,rows:15},padding:o}})}}
              />`)}`,"Space left inside each grid cell around a snapped card.")}
          `:u}
      </div>
    `}_canvasSecSize(){const e=this._config?.canvas??{};return r`
      <div class="ec-section">
          ${this._numRow("Width (px)",{value:e.width,onChange:t=>this._updateCanvas({width:t}),min:1,placeholder:"image width",hint:"The coordinate space cards are positioned in. Unset uses the background image's own width."})}

          ${this._numRow("Height (px)",{value:e.height,onChange:t=>this._updateCanvas({height:t}),min:1,placeholder:"from aspect",hint:"Unset keeps the background image's aspect ratio."})}

          ${this._row("Fit",r`<select class="ec-select"
              .value=${e.fit??b("background_fit")??"cover"}
              @change=${t=>this._updateCanvas({fit:t.target.value})}
            >
              <option value="cover" .selected=${(e.fit??b("background_fit")??"cover")==="cover"}>cover</option>
              <option value="contain" .selected=${e.fit==="contain"}>contain</option>
            </select>`)}
          <p class="ec-hint">The base fit for the background image. The Background section's own "Background fit" overrides this when set.</p>

          <div class="ec-subsection-title">Extend (px)</div>

          ${this._row("Top",r`${this._numWrap(r`<input class="ec-input ec-input-num" type="number" min="0"
              .value=${e.extend?.top!=null?String(e.extend.top):""}
              placeholder="0"
              @change=${t=>{const i=t.target.value;this._updateCanvas({extend:{...e.extend,top:i===""?void 0:Number(i)}})}}
            />`)}`,"Adds canvas beyond the background image on this side, for cards that sit off the picture.")}

          ${this._row("Right",r`${this._numWrap(r`<input class="ec-input ec-input-num" type="number" min="0"
              .value=${e.extend?.right!=null?String(e.extend.right):""}
              placeholder="0"
              @change=${t=>{const i=t.target.value;this._updateCanvas({extend:{...e.extend,right:i===""?void 0:Number(i)}})}}
            />`)}`,"Adds canvas beyond the background image on this side, for cards that sit off the picture.")}

          ${this._row("Bottom",r`${this._numWrap(r`<input class="ec-input ec-input-num" type="number" min="0"
              .value=${e.extend?.bottom!=null?String(e.extend.bottom):""}
              placeholder="0"
              @change=${t=>{const i=t.target.value;this._updateCanvas({extend:{...e.extend,bottom:i===""?void 0:Number(i)}})}}
            />`)}`,"Adds canvas beyond the background image on this side, for cards that sit off the picture.")}

          ${this._row("Left",r`${this._numWrap(r`<input class="ec-input ec-input-num" type="number" min="0"
              .value=${e.extend?.left!=null?String(e.extend.left):""}
              placeholder="0"
              @change=${t=>{const i=t.target.value;this._updateCanvas({extend:{...e.extend,left:i===""?void 0:Number(i)}})}}
            />`)}`,"Adds canvas beyond the background image on this side, for cards that sit off the picture.")}
      </div>
    `}_canvasSecBox(){const e=this._config?.canvas??{};return r`
      <div class="ec-section">
          ${this._boxRows("cv",e.box??{},t=>this._updateCanvas({box:{...e.box,...t}}),!0,"Rounds the corners of the canvas and the card itself. Leave blank to use the theme's radius.")}
      </div>
    `}static _bgMethod(e){return e.source==="single"?"single":e.source==="state"?"state":"daynight"}_setBgMethod(e){const t=this._config?.background??{};if(p._bgMethod(t)===e)return;const i=e==="single"?"single":e==="state"?"state":"auto";this._updateBackground({source:i})}_renderBackgroundControls(){if(!this._config)return r``;const e=this._config.background??{},t=e.source??"auto",i=p._bgMethod(e),o=e.rules??[],s=a=>this._updateBackground({rules:a.length?a:void 0});return r`
          <div class="ec-subsection-title">Background</div>

          <div class="ec-mode-tiles">
            <button type="button" class="ec-mode-tile${i==="single"?" active":""}"
              @click=${()=>this._setBgMethod("single")}>
              <ha-icon icon="mdi:image-outline"></ha-icon>
              <span>Single Image</span>
            </button>
            <button type="button" class="ec-mode-tile${i==="daynight"?" active":""}"
              @click=${()=>this._setBgMethod("daynight")}>
              <ha-icon icon="mdi:theme-light-dark"></ha-icon>
              <span>Day / Night</span>
            </button>
            <button type="button" class="ec-mode-tile${i==="state"?" active":""}"
              @click=${()=>this._setBgMethod("state")}>
              <ha-icon icon="mdi:image-multiple-outline"></ha-icon>
              <span>State Entity</span>
            </button>
          </div>
          <p class="ec-hint">${i==="single"?"One fixed background image.":i==="daynight"?"Two sets of images — one for day, one for night — with an EV variant per set.":"One image per entity state. Nothing matching paints no background, so cover every state you care about."}</p>

          ${i==="single"?r`
            ${this._row("Image path",r`<div style="display:flex;gap:4px;align-items:center;">
                <input class="ec-input" type="text" style="flex:1;min-width:0;"
                  .value=${e.url??""}
                  placeholder="/local/image.png or https://…"
                  @change=${a=>this._updateBackground({url:a.target.value.trim()||void 0})}
                />
                ${this._imagePickBtn(a=>this._updateBackground({url:a}))}
              </div>`,"The image drawn behind the whole canvas.")}
          `:u}

          ${i==="state"?r`
            ${this._entitySelector({entity:e.entity,onEntity:a=>this._updateBackground({entity:a||void 0})})}
            <div class="ec-subsection-title">Rules</div>
            ${o.length===0?this._emptyAdd("No rules yet — add one",()=>s([...o,{}])):o.map((a,n)=>this._itemCard({icon:a.url?"mdi:image-check-outline":"mdi:image-off-outline",label:p._bgRuleName(a,n),sub:p._bgRuleSub(a),selected:n===this._selCanvasBgRule,onClick:()=>{this._selCanvasBgRule=n,this._navPush(`cbgr:${n}`,p._bgRuleName(a,n))},actions:r`
                    <button class="ec-btn-remove" title="Remove rule"
                      @click=${l=>{l.stopPropagation(),s(o.filter((c,d)=>d!==n))}}>✕</button>
                  `}))}
            <div style="display:flex;gap:6px;margin-top:6px;">
              <button class="ec-btn-add" @click=${()=>s([...o,{}])}>+ Rule</button>
            </div>
            <p class="ec-hint">Each rule stands alone — one state value, one image. A value matches the state as text, as a number (<code>21</code> matches <code>21.0</code>) or as a boolean (<code>true</code> matches <code>on</code>).</p>
          `:u}

          ${i!=="daynight"?u:r`
          ${this._row("Source",r`<select class="ec-select"
              .value=${t}
              @change=${a=>this._updateBackground({source:a.target.value})}
            >
              <option value="auto" .selected=${t==="auto"}>auto (sun)</option>
              <option value="day" .selected=${t==="day"}>day</option>
              <option value="night" .selected=${t==="night"}>night</option>
              <option value="entity" .selected=${t==="entity"}>entity</option>
            </select>`)}

          ${t==="auto"||t===void 0?this._entitySelector({label:"Sun entity",entity:e.sun_entity,onEntity:a=>this._updateBackground({sun_entity:a}),attribute:e.sun_attribute,onAttribute:a=>this._updateBackground({sun_attribute:a})}):u}

          ${t==="entity"?this._entitySelector({label:"Mode entity",entity:e.mode_entity,onEntity:a=>this._updateBackground({mode_entity:a}),attribute:e.mode_attribute,onAttribute:a=>this._updateBackground({mode_attribute:a})}):u}

          ${this._numRow("EV count",{value:this._config.ev_count,onChange:a=>this._emit({...this._config,ev_count:a}),min:0,placeholder:"0"})}

          <div class="ec-subsection-title">Images</div>
          <p class="ec-hint">One Day and one Night image per EV variant — raising EV count adds rows.</p>

          ${(()=>{const a=Math.max(0,this._config?.ev_count??0),n=Array.from({length:a+1},(l,c)=>String(c));return["day","night"].map(l=>r`
              <div class="ec-subsection-title ec-subsection-title--minor">${l}</div>
              ${n.map(c=>this._row(`${l} / ${c} EV`,r`<div style="display:flex;gap:4px;align-items:center;">
                  <input class="ec-input" type="text" style="flex:1;min-width:0;"
                    .value=${e.images?.[l]?.[c]??""}
                    placeholder="/local/image.png or https://…"
                    @change=${d=>this._setBgImage(l,c,d.target.value)}
                  />
                  ${this._imagePickBtn(d=>this._setBgImage(l,c,d))}
                </div>`))}
            `)})()}
          `}

          ${this._row("Background fit",r`<select class="ec-select"
              .value=${e.fit??b("background_fit")??"cover"}
              @change=${a=>this._updateBackground({fit:a.target.value})}
            >
              <option value="cover" .selected=${(e.fit??b("background_fit")??"cover")==="cover"}>cover</option>
              <option value="contain" .selected=${e.fit==="contain"}>contain</option>
            </select>`)}
          <p class="ec-hint">Overrides the Canvas Size section's "Fit" when set. Leave unset to use that value.</p>
    `}_canvasSecBgRule(e){const t=this._config?.background??{},i=t.rules??[],o=i[e];if(!o)return this._navDeadEnd();const s=n=>this._updateBackground({rules:i.map((l,c)=>c===e?{...l,...n}:l)}),a=t.entity?this.hass?.states[t.entity]?.state:void 0;return r`
      <div class="ec-section">
        ${this._row("Value",r`<input class="ec-input" type="text"
            .value=${o.value??""}
            placeholder=${a??"e.g. on, 21, heat"}
            @change=${n=>s({value:n.target.value.trim()||void 0})}
          />`,"The entity state this rule matches. Text, a number, or a boolean.")}
        ${a!=null?r`<p class="ec-hint">${t.entity} is currently <b>${a}</b>.</p>`:u}
        ${this._row("Image path",r`<div style="display:flex;gap:4px;align-items:center;">
            <input class="ec-input" type="text" style="flex:1;min-width:0;"
              .value=${o.url??""}
              placeholder="/local/image.png or https://…"
              @change=${n=>s({url:n.target.value.trim()||void 0})}
            />
            ${this._imagePickBtn(n=>s({url:n}))}
          </div>`,"Shown while the state matches. Leave blank to skip this rule.")}
      </div>
    `}_renderTemplatesRibbonPanel(){const e=this._navPath;return e.length===0?this._navMenu(p._TEMPLATE_SECTIONS):e[0].key==="sec:import"?this._templatesSecImport():e[0].key==="sec:varexport"?this._templatesSecVariantExport():e[0].key==="sec:varimport"?this._templatesSecVariantImport():e[0].key==="sec:export"?this._templatesSecExport():(console.warn(`[mosaic-canvas-card] Templates panel: unknown section key "${e[0].key}"`),this._navDeadEnd("This editor screen is unavailable — press Back to recover."))}_templatesSecVariantExport(){const e=this._config?.defaults?.control_variants??{},t=Object.values(e).reduce((i,o)=>i+(o?.length??0),0);return r`
      <div class="ec-section">
        <p class="ec-hint">
          Exports only the custom control variants built in <b>Settings ▸ Global Defaults ▸ Control Default ▸ Variant Builder</b> —
          not the card layout. The file uses the same shape as Mosaic's built-in variant registry.
        </p>
        ${t===0?r`<p class="ec-empty">No custom variants to export.</p>`:r`
            ${this._row("Name",r`<input class="ec-input" type="text"
                .value=${this._templateName}
                placeholder="My Control Variants"
                @input=${i=>{this._templateName=i.target.value}}
              />`)}
            <p class="ec-hint">${t} variant${t===1?"":"s"} across ${Object.keys(e).length} control type${Object.keys(e).length===1?"":"s"}.</p>
            <button class="ec-btn-add" style="width:100%;"
              @click=${()=>Hi(Gi(e,this._templateName||"Mosaic Control Variants"))}
            >⬇ Download control variants</button>
          `}
      </div>
    `}_templatesSecVariantImport(){return this._config?r`
      <div class="ec-section">
        <p class="ec-hint">
          Merges variants from a file into this card. Unlike <b>Import Template</b>, this
          <b>does not touch your layout</b> — it only adds control variants. An incoming variant whose
          id is already used is imported under a new id, so nothing is overwritten.
        </p>
        <input type="file" accept=".json,application/json" style="display:none" id="ec-variant-import"
          @change=${e=>{const t=e.target.files?.[0];if(e.target.value="",!t||!this._config)return;const i=new FileReader;i.onload=o=>{const{pack:s,error:a}=Wi(o.target?.result);if(a||!s){this._variantImportError=a??"Unknown error.";return}const n=this._config?.defaults?.control_variants??{},{merged:l,added:c,renamed:d}=Vi(n,s);if(c===0){this._variantImportError="That file contained no control variants.";return}const h=d>0?`Import ${c} variant(s) from "${s.name}"?

${d} had an id already in use and will be imported under a new id.`:`Import ${c} variant(s) from "${s.name}"?`;window.confirm(h)&&(this._variantImportError="",this._updateDefaults({control_variants:l}),Ge(l))},i.readAsText(t)}}
        />
        <button class="ec-btn-add" style="width:100%;"
          @click=${()=>this.shadowRoot?.querySelector("#ec-variant-import")?.click()}
        >⬆ Import from file</button>
        ${this._variantImportError?r`<p style="color:#f44;font-size:12px;margin:6px 0 0;">${this._variantImportError}</p>`:u}
      </div>
    `:r``}_templatesSecExport(){return this._config?r`
      <div class="ec-section">
          ${this._row("Name",r`<input class="ec-input" type="text"
              .value=${this._templateName}
              placeholder="My Mosaic Dashboard"
              @input=${e=>{this._templateName=e.target.value}}
            />`)}
          ${this._row("Include entities",r`<input type="checkbox" .checked=${this._templateIncludeEntities}
              @change=${e=>{this._templateIncludeEntities=e.target.checked}}
            />`)}
          ${this._templateIncludeEntities?u:r`<p class="ec-hint">Entity, device and area references are removed from the file, so the
                template can be shared — whoever imports it picks their own entities. References to this
                card's Virtuals are kept.</p>`}
          <button class="ec-btn-add" style="width:100%;margin-bottom:12px;"
            @click=${()=>{if(!this._config)return;const e=Oi(this._config,this._templateName||"Mosaic Canvas Template",{includeEntities:this._templateIncludeEntities});Ni(e)}}
          >⬇ Download template</button>
      </div>
    `:r``}_templatesSecImport(){return this._config?r`
      <div class="ec-section">
          <p style="font-size:12px;color:#4a8aaa;margin:0 0 8px;">
            Importing will replace the entire card configuration.
          </p>
          <input type="file" accept=".json,application/json"
            style="display:none"
            id="ec-template-import"
            @change=${e=>{const t=e.target.files?.[0];if(!t||!this._config)return;const i=new FileReader;i.onload=o=>{const s=o.target?.result,{template:a,error:n}=Li(s);if(n||!a){this._templateError=n??"Unknown error.";return}window.confirm(`Import "${a.name}"?

This will replace your entire card configuration.`)&&(this._templateError="",this._emit(Bi(a,this._config.type)))},i.readAsText(t),e.target.value=""}}
          />
          <button class="ec-btn-add" style="width:100%;"
            @click=${()=>{this.shadowRoot?.querySelector("#ec-template-import")?.click()}}
          >⬆ Import from file</button>
          ${this._templateError?r`<p style="color:#f44;font-size:12px;margin:6px 0 0;">${this._templateError}</p>`:u}
      </div>
    `:r``}_virtualSectionDefs(e){const t=[{key:"sec:defaults",label:"Virtual Defaults",hint:"Name, operation, unit",icon:"mdi:tune",paths:["name","op","unit"]}];return e.op==="time_until"?(t.push({key:"sec:tu",label:"Time Until Settings",hint:"Mode, entities, capacity, labels",icon:"mdi:progress-clock",paths:["mode","value_entity","pct_entity","rate_entity","power_entity","rate_unit_override","recalc_above","recalc_below","capacity_entity","capacity","capacity_kwh","label_max","label_full","label_min","label_empty"]}),t.push({key:"sec:trig",label:"Extra Triggers",hint:"Up to 2 labelled thresholds",icon:"mdi:flag-outline",paths:["triggers"]})):e.op==="statistic"&&(t.push({key:"sec:value",label:"Value",hint:"Source entity + attribute",icon:"mdi:database-outline",paths:["entity","attribute"]}),t.push({key:"sec:stats",label:"HA Statistics",hint:"Period, stat type, advanced characteristic",icon:"mdi:chart-box-outline",paths:p._STAT_PATHS})),t}_virtualScope(e){return{root:this._virtuals()[e],apply:t=>this._updateVirtual(e,t)}}_renderVirtualsRibbonPanel(){const e=this._navPath,t=this._virtuals();if(e.length===0)return r`
        <div class="ec-section-header">
          <span></span>
          <div style="display:flex;gap:4px;">
            ${this._virtualClipboard?r`<button class="ec-btn-add" @click=${this._pasteVirtual} title="Paste virtual">⎘ Paste</button>`:u}
            <button class="ec-btn-add" @click=${this._addVirtual}>+ Virtual</button>
          </div>
        </div>
        ${t.length===0?this._emptyAdd("No virtuals yet — add one",()=>this._addVirtual()):t.map((a,n)=>this._itemCard({dragKey:`virt:${n}`,icon:a.op==="time_until"?"mdi:progress-clock":"mdi:memory",label:a.name||a.id,sub:p._VIRTUAL_OPS.find(l=>l.value===a.op)?.label??a.op,selected:n===this._selVirtual,onClick:()=>{this._selVirtual=n,this._navPush(`virt:${a.id}`,a.name||a.id)},actions:r`
                <button class="ec-btn-remove"
                  @click=${l=>{l.stopPropagation(),this._copyVirtual(n)}}
                  title="Copy">⎘</button>
                <button class="ec-btn-dup"
                  @click=${l=>{l.stopPropagation(),this._duplicateVirtual(n)}}
                  title="Duplicate virtual">⧉</button>
                <button class="ec-btn-remove"
                  @click=${l=>{l.stopPropagation(),this._removeVirtual(n)}}
                  title="Remove">✕</button>
              `}))}
      `;const i=this._crumbIndex(e[0].key,t);this._selVirtual=i;const o=t[i];if(!o)return this._navDeadEnd();if(e.length===1)return r`
        ${this._navMenu(this._virtualSectionDefs(o),this._virtualScope(i))}
        ${o.op==="time_until"||o.op==="statistic"?u:r`
          <div class="ec-subsection-title">Inputs (in order) — drag to reorder</div>
          ${o.inputs.length===0?this._emptyAdd("No inputs yet — add one",()=>this._addVirtualInput(i)):o.inputs.map((a,n)=>this._itemCard({dragKey:`vin:${i}:${n}`,icon:"mdi:import",label:a||`Input ${n+1}`,sub:a?`Input ${n+1}`:"No entity selected",selected:n===this._selVirtualInput,onClick:()=>{this._selVirtualInput=n,this._navPush(`vin:${n}`,a||`Input ${n+1}`)},actions:r`
                  <button class="ec-btn-dup"
                    @click=${l=>{l.stopPropagation(),this._duplicateVirtualInput(i,n)}}
                    title="Duplicate input">⧉</button>
                  <button class="ec-btn-remove"
                    @click=${l=>{l.stopPropagation(),this._removeVirtualInput(i,n)}}
                    title="Remove input">✕</button>
                `}))}
          <button class="ec-btn-add" style="margin-top:4px;"
            @click=${()=>this._addVirtualInput(i)}>+ Input</button>
        `}
      `;const s=e[1].key;if(s.startsWith("vin:")){const a=this._crumbIndex(s,o.inputs);return this._selVirtualInput=a,this._virtualSecInput(i,a)}if(e.length===3&&s==="sec:trig"&&e[2].key.startsWith("trig:")){const a=this._crumbIndex(e[2].key,o.triggers);return this._selTrigger=a,this._virtualSecTriggerItem(i,a)}return this._virtualSection(i,o,s)}_virtualSecInput(e,t){const i=this._virtuals()[e],o=i?.inputs[t];return!i||o===void 0?this._navDeadEnd():r`
      <div class="ec-section">
          ${this._row("Entity",r`<ha-entity-picker
              .hass=${this.hass}
              .value=${o}
              allow-custom-entity
              @value-changed=${s=>this._updateVirtualInput(e,t,s.detail.value)}
            ></ha-entity-picker>`,"An entity feeding this virtual entity's calculation.")}
      </div>
    `}_virtualSection(e,t,i){return r`
      ${this._clearOverridesBtn(p._findDef(this._virtualSectionDefs(t),i),this._virtualScope(e))}
      ${this._virtualSectionBody(e,t,i)}
    `}_virtualSectionBody(e,t,i){return i==="sec:defaults"?this._virtualSecDefaults(e,t):i==="sec:tu"?this._virtualSecTu(e,t):i==="sec:trig"?this._virtualSecTrig(e,t):i==="sec:value"?this._virtualSecValue(e,t):i==="sec:stats"?this._virtualSecStats(e,t):r``}_virtualSecValue(e,t){return r`
      <div class="ec-section">
          ${this._entitySelector({entity:t.entity,onEntity:i=>this._updateVirtual(e,{entity:i}),attribute:t.attribute,onAttribute:i=>this._updateVirtual(e,{attribute:i})})}
      </div>
    `}_virtualSecStats(e,t){return r`
      <div class="ec-section">
          <div class="ec-subsection-title">HA Statistics integration</div>
          <p class="ec-hint">For advanced statistics (median, std dev, percentile, etc.) configure a Statistics integration sensor in HA and point the Value entity at it.</p>
          ${this._row("Period",r`<select class="ec-select"
              .value=${t.stat_period??""}
              @change=${i=>{const o=i.target.value,s=["last_n_minutes","last_n_hours","last_n_days","last_n_months"].includes(o);this._updateVirtual(e,{stat_period:o||void 0,stat_period_n:s?t.stat_period_n??void 0:void 0,stat_period_start:o==="custom"?t.stat_period_start??void 0:void 0,stat_period_end:o==="custom"?t.stat_period_end??void 0:void 0})}}
            >
              <option value="">Live state (no stats)</option>
              ${this._statPeriodGroups(t.stat_period,!0)}
            </select>`)}
          ${["last_n_minutes","last_n_hours","last_n_days","last_n_months"].includes(t.stat_period)?this._row(t.stat_period==="last_n_minutes"?"Number of minutes":t.stat_period==="last_n_hours"?"Number of hours":t.stat_period==="last_n_days"?"Number of days":"Number of months",this._numWrap(r`<input type="number" class="ec-input ec-input-num" min="1" step="1"
              .value=${String(t.stat_period_n??"")}
              placeholder="e.g. 3"
              @change=${i=>{const o=parseInt(i.target.value,10);this._updateVirtual(e,{stat_period_n:isNaN(o)||o<1?void 0:o})}}
            />`)):u}
          ${t.stat_period==="custom"?r`
            ${this._row("Start",r`<input type="datetime-local" class="ec-input"
              .value=${t.stat_period_start??""}
              @change=${i=>this._updateVirtual(e,{stat_period_start:i.target.value||void 0})}
            />`)}
            ${this._row("End",r`<input type="datetime-local" class="ec-input"
              .value=${t.stat_period_end??""}
              @change=${i=>this._updateVirtual(e,{stat_period_end:i.target.value||void 0})}
            />`)}
          `:u}
          ${t.stat_period?this._row("Stat type",r`<select class="ec-select"
              .value=${t.stat_type??b("stat_type")??"sum"}
              @change=${i=>this._updateVirtual(e,{stat_type:i.target.value})}
            >
              <option value="sum"        .selected=${(t.stat_type??b("stat_type")??"sum")==="sum"}>Sum (total)</option>
              <option value="difference" .selected=${t.stat_type==="difference"}>Difference (end − start)</option>
              <option value="mean"       .selected=${t.stat_type==="mean"}>Mean (average)</option>
              <option value="max"        .selected=${t.stat_type==="max"}>Maximum</option>
              <option value="min"        .selected=${t.stat_type==="min"}>Minimum</option>
              <option value="count"      .selected=${t.stat_type==="count"}>Count (recorder records)</option>
              <option value="range"      .selected=${t.stat_type==="range"}>Range (max − min)</option>
            </select>`):u}
          ${t.stat_type==="count"?r`<p class="ec-hint">Counts the statistics records Home Assistant
            holds for the window, and the recorder's resolution changes with the window's length — the same
            sensor gives 12 records for the last hour (five-minute records) and 1 for today (a daily one).
            It answers "how much statistics data is there", not "how many times did this happen".</p>`:u}

          ${this._row("Adv statistics mode (opt)",r`<select class="ec-select"
              .value=${t.stat_characteristic??""}
              @change=${i=>{const o=i.target.value;this._updateVirtual(e,{stat_characteristic:o||void 0})}}
            >
              <option value="">— none —</option>
              ${["Averages","Extremes","Spread","Change","Sums","Counts","Timestamps"].map(i=>r`
                <optgroup label="${i}">
                  ${qe.filter(o=>o.group===i).map(o=>r`
                    <option value=${o.value} .selected=${t.stat_characteristic===o.value}>
                      ${o.label}${o.binary?" ✦":""}
                    </option>`)}
                </optgroup>`)}
            </select>`)}
          <p class="ec-hint" style="margin-top:2px">✦ also valid for binary sensors</p>
          ${t.stat_characteristic==="percentile"?this._numRow("Percentile (1–99)",{value:t.stat_percentile,onChange:i=>this._updateVirtual(e,{stat_percentile:i}),min:1,max:99,placeholder:"50"}):u}
          ${this._numRow("Max age (hours)",{value:t.stat_max_age_hours,onChange:i=>this._updateVirtual(e,{stat_max_age_hours:i}),min:1,placeholder:"(none)"})}
          ${this._numRow("Sampling size",{value:t.stat_sampling_size,onChange:i=>this._updateVirtual(e,{stat_sampling_size:i}),min:1,placeholder:"(none)"})}
          ${t.stat_characteristic&&t.entity?r`
            <div class="ec-stat-yaml">
              <div class="ec-stat-yaml-header">
                <span>HA configuration.yaml</span>
                <button class="ec-btn-copy" title="Copy YAML"
                  @click=${()=>{const i=Re(t.entity,t.stat_characteristic,t.stat_max_age_hours,t.stat_sampling_size,t.stat_percentile);navigator.clipboard.writeText(i)}}>⎘ Copy</button>
              </div>
              <pre class="ec-stat-yaml-code">${Re(t.entity,t.stat_characteristic,t.stat_max_age_hours,t.stat_sampling_size,t.stat_percentile)}</pre>
            </div>
          `:u}
      </div>
    `}_virtualSecDefaults(e,t){return r`
      <div class="ec-section">
              ${this._row("Name",r`<input class="ec-input" type="text" .value=${t.name}
                  @change=${i=>this._updateVirtual(e,{name:i.target.value})}
                />`,"Names this virtual entity wherever it can be picked.")}

              ${this._row("Operation",r`<select class="ec-select"
                  .value=${t.op}
                  @change=${i=>this._updateVirtual(e,{op:i.target.value})}
                >
                  ${p._VIRTUAL_OPS.map(i=>r`<option value=${i.value} .selected=${t.op===i.value}>${i.label}</option>`)}
                </select>`,"How the input entities are combined into one value.")}

              ${t.op!=="time_until"?this._row("Unit override",r`<input class="ec-input" type="text" .value=${t.unit??""}
                  placeholder="(from inputs[0])"
                  @change=${i=>{const o=i.target.value;this._updateVirtual(e,{unit:o||void 0})}}
                />`,"Shown after the value. Unset uses the first input entity's unit."):u}
      </div>
    `}_virtualSecTu(e,t){return r`
      <div class="ec-section">
                ${this._row("Mode",r`<select class="ec-select"
                    .value=${t.mode??b("virtual_mode")??"percent"}
                    @change=${i=>this._updateVirtual(e,{mode:i.target.value})}
                  >
                    <option value="percent"  .selected=${(t.mode??b("virtual_mode")??"percent")==="percent"}>% based</option>
                    <option value="absolute" .selected=${t.mode==="absolute"}>Absolute value</option>
                  </select>`)}

                ${this._row((t.mode??b("virtual_mode")??"percent")==="percent"?"% entity":"Current value entity",r`<ha-entity-picker
                    .hass=${this.hass}
                    .value=${t.value_entity??t.pct_entity??""}
                    allow-custom-entity
                    @value-changed=${i=>this._updateVirtual(e,{value_entity:i.detail.value||void 0,pct_entity:void 0})}
                  ></ha-entity-picker>`)}

                ${this._row("Rate entity",r`<ha-entity-picker
                    .hass=${this.hass}
                    .value=${t.rate_entity??t.power_entity??""}
                    allow-custom-entity
                    @value-changed=${i=>this._updateVirtual(e,{rate_entity:i.detail.value||void 0,power_entity:void 0})}
                  ></ha-entity-picker>`)}

                ${this._row("Rate unit override",r`<input class="ec-input" type="text"
                    .value=${t.rate_unit_override??""}
                    placeholder="auto-detect from entity"
                    @change=${i=>{const o=i.target.value;this._updateVirtual(e,{rate_unit_override:o||void 0})}}
                  />`)}
                <p class="ec-hint">Auto-detected from the rate entity; only set this if auto-detection fails.</p>

                ${this._row("Recalc above (rate)",this._numWrap(r`<input class="ec-input ec-input-num" type="number" step="any"
                    .value=${t.recalc_above!=null?String(t.recalc_above):""}
                    placeholder="e.g. 100"
                    @change=${i=>{const o=parseFloat(i.target.value);this._updateVirtual(e,{recalc_above:Number.isFinite(o)?o:void 0})}}
                  />`))}

                ${this._row("Recalc below (rate)",this._numWrap(r`<input class="ec-input ec-input-num" type="number" step="any"
                    .value=${t.recalc_below!=null?String(t.recalc_below):""}
                    placeholder="e.g. -160"
                    @change=${i=>{const o=parseFloat(i.target.value);this._updateVirtual(e,{recalc_below:Number.isFinite(o)?o:void 0})}}
                  />`))}
                <p class="ec-hint">Only recompute Time Until when the raw rate reading is above and/or below these (signed, in the rate entity's units). Inside the band the last value is frozen. Leave blank to always recalculate.</p>

                ${this._row("Capacity entity",r`<ha-entity-picker
                    .hass=${this.hass}
                    .value=${t.capacity_entity??""}
                    allow-custom-entity
                    @value-changed=${i=>this._updateVirtual(e,{capacity_entity:i.detail.value||void 0})}
                  ></ha-entity-picker>`)}

                ${this._row("Capacity (Manual)",this._numWrap(r`<input class="ec-input ec-input-num" type="number" min="0" step="0.1"
                    .value=${String(t.capacity??t.capacity_kwh??"")}
                    placeholder="e.g. 13.5"
                    @change=${i=>{const o=parseFloat(i.target.value);this._updateVirtual(e,{capacity:Number.isFinite(o)?o:void 0,capacity_kwh:void 0})}}
                  />`))}

                ${this._row("Maximum label",r`<input class="ec-input" type="text"
                    .value=${t.label_max??t.label_full??""}
                    placeholder="Full"
                    @change=${i=>{const o=i.target.value;this._updateVirtual(e,{label_max:o||void 0,label_full:void 0})}}
                  />`)}

                ${this._row("Minimum label",r`<input class="ec-input" type="text"
                    .value=${t.label_min??t.label_empty??""}
                    placeholder="Empty"
                    @change=${i=>{const o=i.target.value;this._updateVirtual(e,{label_min:o||void 0,label_empty:void 0})}}
                  />`)}
      </div>
    `}_virtualSecTrig(e,t){return r`
      ${(t.triggers??[]).length===0?this._emptyAdd("No extra triggers yet — add one",()=>{const i=[...t.triggers??[],{value:20,label:"Reserve"}];this._updateVirtual(e,{triggers:i})}):(t.triggers??[]).map((i,o)=>this._itemCard({dragKey:`trig:${e}:${o}`,icon:"mdi:flag-outline",label:i.label||`Trigger ${o+1}`,sub:`${i.percent??i.value}${(t.mode??b("virtual_mode")??"percent")==="percent"?"%":""}`,selected:o===this._selTrigger,onClick:()=>{this._selTrigger=o,this._navPush(`trig:${o}`,i.label||`Trigger ${o+1}`)},actions:r`
              ${(t.triggers??[]).length<2?r`<button class="ec-btn-dup" title="Duplicate trigger"
                @click=${s=>{s.stopPropagation(),this._duplicateTrigger(e,o)}}>⧉</button>`:u}
              <button class="ec-btn-remove" title="Remove trigger"
                @click=${s=>{s.stopPropagation();const a=(t.triggers??[]).filter((n,l)=>l!==o);this._updateVirtual(e,{triggers:a.length?a:void 0})}}>✕</button>
            `}))}
      ${(t.triggers??[]).length<2?r`
        <button class="ec-btn-add" style="margin-top:6px"
          @click=${()=>{const i=[...t.triggers??[],{value:20,label:"Reserve"}];this._updateVirtual(e,{triggers:i})}}>+ Trigger</button>
      `:u}
      <p class="ec-hint" style="margin-top:10px">Auto-switches to the nearest trigger ahead in the current direction.</p>
    `}_virtualSecTriggerItem(e,t){const i=this._virtuals()[e],o=i?.triggers?.[t];return!i||!o?this._navDeadEnd():r`
      <div class="ec-section">
          ${this._row((i.mode??b("virtual_mode")??"percent")==="percent"?"Percent":"Value",r`${this._numWrap(r`<input class="ec-input ec-input-num" type="number"
              step="${(i.mode??b("virtual_mode")??"percent")==="percent"?"1":"any"}"
              .value=${String(o.percent??o.value)}
              @change=${s=>{const a=parseFloat(s.target.value),n=[...i.triggers??[]];n[t]={...n[t],value:Number.isFinite(a)?a:o.value},this._updateVirtual(e,{triggers:n})}}
            />`)}`)}
          ${this._row("Label",r`<input class="ec-input" type="text" .value=${o.label}
              placeholder="Label"
              @change=${s=>{const a=[...i.triggers??[]];a[t]={...a[t],label:s.target.value},this._updateVirtual(e,{triggers:a})}}
            />`)}
      </div>
    `}_zoneScope(e){return{root:this._zones()[e],apply:t=>this._updateZone(e,t)}}_renderZonesRibbonPanel(){const e=this._navPath,t=this._zones();if(e.length===0)return r`
        <p style="font-size:12px;color:#4a8aaa;margin:0 0 8px;">
          Invisible hotspot regions that trigger actions when tapped. Drag the dashed handles in the preview to reposition.
        </p>
        <div class="ec-section-header">
          <span></span>
          <button class="ec-btn-add" @click=${this._addZone}>+ Clickable Zone</button>
        </div>
        ${t.length===0?this._emptyAdd("No clickable zones yet — add one",()=>this._addZone()):t.map((a,n)=>this._itemCard({dragKey:`zone:${n}`,icon:"mdi:gesture-tap-box",label:a.name??a.id,sub:`${a.width}×${a.height}px`,selected:n===this._selZone,onClick:()=>{this._selZone=n,this._navPush(`zone:${a.id}`,a.name??a.id)},actions:r`
                <button class="ec-btn-dup"
                  @click=${l=>{l.stopPropagation(),this._duplicateZone(n)}}
                  title="Duplicate zone">⧉</button>
                <button class="ec-btn-remove"
                  @click=${l=>{l.stopPropagation(),this._removeZone(n)}}
                  title="Remove">✕</button>
              `}))}
      `;const i=this._crumbIndex(e[0].key,t);this._selZone=i;const o=t[i];if(!o)return this._navDeadEnd();if(e.length===1)return this._navMenu(p._ZONE_SECTIONS,this._zoneScope(i));const s=this._clearOverridesBtn(p._findDef(p._ZONE_SECTIONS,e[1].key),this._zoneScope(i));return e[1].key==="sec:actions"?r`${s}${this._zoneSecActions(i,o)}`:r`${s}${this._zoneSecDefaults(i,o)}`}_zoneSecDefaults(e,t){const{totalW:i,totalH:o}=te(this._config);return r`
      <div class="ec-section">
              ${this._row("Name",r`<input class="ec-input" type="text" .value=${t.name??""}
                  @change=${s=>this._updateZone(e,{name:s.target.value||void 0})}
                />`)}

              ${this._row("X (px)",r`${this._numWrap(r`<input class="ec-input ec-input-num" type="number"
                  .value=${String(Math.round(t.position.x*i))}
                  @change=${s=>this._updateZone(e,{position:{...t.position,x:Number(s.target.value)/i}})}
                />`)}`,"Distance from the left edge of the canvas to the zone's anchor point.")}

              ${this._row("Y (px)",r`${this._numWrap(r`<input class="ec-input ec-input-num" type="number"
                  .value=${String(Math.round(t.position.y*o))}
                  @change=${s=>this._updateZone(e,{position:{...t.position,y:Number(s.target.value)/o}})}
                />`)}`,"Distance from the top edge of the canvas to the zone's anchor point.")}

              ${this._row("Anchor",r`<select class="ec-select"
                  .value=${t.anchor??b("anchor")??"top-left"}
                  @change=${s=>this._updateZone(e,{anchor:s.target.value})}
                >
                  ${Pe.map(s=>r`<option value=${s} .selected=${(t.anchor??b("anchor")??"top-left")===s}>${Ze[s]}</option>`)}
                </select>`,"Which corner of the zone sits at its X/Y position.")}

              ${this._row("Width (px)",r`${this._numWrap(r`<input class="ec-input ec-input-num" type="number" min="1"
                  .value=${String(t.width)}
                  @change=${s=>this._updateZone(e,{width:Math.max(1,Number(s.target.value))})}
                />`)}`)}

              ${this._row("Height (px)",r`${this._numWrap(r`<input class="ec-input ec-input-num" type="number" min="1"
                  .value=${String(t.height)}
                  @change=${s=>this._updateZone(e,{height:Math.max(1,Number(s.target.value))})}
                />`)}`)}

              ${this._row("Overlay color",this._colorPicker(`zone-${e}-overlay`,t.color,s=>this._updateZone(e,{color:s}),{clearTitle:"Clear"}),"Tints the zone so it can be seen on the dashboard. Leave blank for an invisible tap target.")}

              ${this._numRow("Radius (px)",{value:t.radius,onChange:s=>this._updateZone(e,{radius:s}),min:0,placeholder:"0",hint:"Rounds the zone's corners. Only visible with an overlay colour set."})}
      </div>
    `}_zoneSecActions(e,t){return r`
      <div class="ec-section">
        ${this._actionRows({tap_action:t.tap_action,hold_action:t.hold_action,double_tap_action:t.double_tap_action},i=>this._updateZone(e,i))}
      </div>
    `}_flowScope(e){return{root:this._flows()[e],apply:t=>this._updateFlow(e,t)}}_renderFlowsRibbonPanel(){const e=this._navPath,t=this._flows();if(e.length===0)return r`
        <div class="ec-section-header">
          <span></span>
          <button class="ec-btn-add" @click=${this._addFlow}>+ Flow Line</button>
        </div>
        ${t.length===0?this._emptyAdd("No animated flow lines yet — add one",()=>this._addFlow()):t.map((n,l)=>this._itemCard({dragKey:`flow:${l}`,icon:"mdi:chart-timeline-variant",label:n.name??n.id,sub:`${n.style??"dashes"}${n.entity?" · "+(n.entity.startsWith("virtual:")?this._virtuals().find(c=>`virtual:${c.id}`===n.entity)?.name??n.entity:n.entity):""}`,selected:l===this._selFlow,onClick:()=>{this._selFlow=l,this._selPoint=-1,this._navPush(`flow:${n.id}`,n.name??n.id)},actions:r`
                <button class="ec-btn-dup"
                  @click=${c=>{c.stopPropagation(),this._duplicateFlow(l)}}
                  title="Duplicate flow">⧉</button>
                <button class="ec-btn-remove"
                  @click=${c=>{c.stopPropagation(),this._removeFlow(l)}}
                  title="Remove flow">✕</button>
              `}))}
      `;const i=this._crumbIndex(e[0].key,t);this._selFlow=i;const o=t[i];if(!o)return this._navDeadEnd();if(e.length===1)return r`
        ${this._navMenu(p._FLOW_SECTIONS,this._flowScope(i))}
        ${this._renderFlowPoints(o)}
      `;const s=e[1].key;if(s.startsWith("pt:")){const n=this._crumbIndex(s,o.points);return this._selPoint=n,this._flowSecPoint(i,n)}const a=this._clearOverridesBtn(p._findDef(p._FLOW_SECTIONS,s),this._flowScope(i));switch(s){case"sec:speed":return r`${a}${this._flowSecSpeed(o)}`;case"sec:style":return r`${a}${this._flowSecStyle(o)}`;case"sec:defaults":return r`${a}${this._flowSecDefaults(o)}`;default:return console.warn(`[mosaic-canvas-card] Flows panel: unknown section key "${s}"`),this._navDeadEnd("This editor screen is unavailable — press Back to recover.")}}_flowSecDefaults(e){return r`
      <div class="ec-section">
              ${this._row("Name",r`<input class="ec-input" type="text" .value=${e.name??""}
                  @change=${t=>this._updateFlow(this._selFlow,{name:t.target.value})}
                />`)}

              ${this._row("Entity",e.entity?.startsWith("virtual:")?r`<div style="display:flex;gap:4px;align-items:center;">
                      <span class="ec-input" style="flex:1;opacity:0.8;">
                        ${this._virtuals().find(t=>`virtual:${t.id}`===e.entity)?.name??e.entity}
                      </span>
                      <button class="ec-btn-clear"
                        @click=${()=>this._updateFlow(this._selFlow,{entity:void 0})}
                        title="Switch to real entity">✕</button>
                    </div>`:r`<ha-entity-picker
                      .hass=${this.hass}
                      .value=${e.entity??""}
                      allow-custom-entity
                      @value-changed=${t=>this._updateFlow(this._selFlow,{entity:t.detail.value})}
                    ></ha-entity-picker>`,"The entity whose value drives this flow. A positive value runs it forwards, a negative value backwards.")}
              ${!e.entity?.startsWith("virtual:")&&this._virtuals().length>0?this._row("Virtual Entity",r`<select class="ec-select"
                  .value=${""}
                  @change=${t=>{const i=t.target.value;i&&this._updateFlow(this._selFlow,{entity:i}),t.target.value=""}}
                >
                  <option value="">(pick a virtual)</option>
                  ${this._virtuals().map(t=>r`<option value=${"virtual:"+t.id}>${t.name}</option>`)}
                </select>`,"Use a virtual entity from Elements ▸ Virtual Entities instead of a real one."):u}

              ${this._numRow(`Min display power (${this._config?.defaults?.power_unit??"W"})`,{value:e.min_power,onChange:t=>this._updateFlow(this._selFlow,{min_power:t}),min:0,step:1,placeholder:"e.g. 5",hint:"Hides the flow while the entity value is below this, in your global power unit."})}

              ${this._row("Invert direction",r`<input type="checkbox"
                  .checked=${e.invert??!1}
                  @change=${t=>{const i=t.target.checked;this._updateFlow(this._selFlow,{invert:i||void 0})}}
                />`,"Swaps which way the flow runs, and swaps the forward and reverse colours with it.")}
      </div>
    `}_flowSecSpeed(e){const t=e.speed_min_duration??b("flow_speed_min_duration")??5,i=e.speed_max_duration??b("flow_speed_max_duration")??1;return r`
      <div class="ec-section">
              ${this._numRow(`Slowest animation value (${this._config?.defaults?.power_unit??"W"})`,{value:e.speed_min_value,onChange:o=>this._updateFlow(this._selFlow,{speed_min_value:o}),min:0,placeholder:"e.g. 100",hint:"Entity value at which the animation runs slowest."})}

              ${this._numRow(`Fastest animation value (${this._config?.defaults?.power_unit??"W"})`,{value:e.speed_max_value,onChange:o=>this._updateFlow(this._selFlow,{speed_max_value:o}),min:0,placeholder:"e.g. 5000",hint:"Entity value at which the animation runs fastest."})}

              ${this._row("Speed",r`<div class="ec-dual-range">
                  <span class="ec-dual-range-label">Slowest</span>
                  <div class="ec-dual-range-track">
                    <input type="range" min="0.5" max="10" step="0.5"
                      .value=${String(t)}
                      style="direction:rtl"
                      @input=${o=>{const s=Number(o.target.value),a=e.speed_max_duration??b("flow_speed_max_duration")??1;this._updateFlow(this._selFlow,{speed_min_duration:Math.max(s,a)})}}
                    />
                    <input type="range" min="0.5" max="10" step="0.5"
                      .value=${String(i)}
                      style="direction:rtl"
                      @input=${o=>{const s=Number(o.target.value),a=e.speed_min_duration??b("flow_speed_min_duration")??5;this._updateFlow(this._selFlow,{speed_max_duration:Math.min(s,a)})}}
                    />
                  </div>
                  <span class="ec-dual-range-label">Fastest</span>
                </div>`,"How far apart the slowest and fastest animation speeds are. Drag the left handle for the slow end, the right for the fast end.")}
              ${e.speed_min_value==null||e.speed_max_value==null?r`<p class="ec-hint">Has no effect until both "Slowest"/"Fastest animation value" above are set — the animation speed stays fixed at Duration below.</p>`:u}

              ${this._numRow("Duration (s)",{value:e.duration,onChange:o=>this._updateFlow(this._selFlow,{duration:o}),min:.1,step:.1,placeholder:"2",hint:"Time for one particle to travel the line when the speed range is not in use."})}
      </div>
    `}_flowSecStyle(e){return r`
      <div class="ec-section">
              ${this._row("Style",r`<select class="ec-select"
                  .value=${e.style??b("flow_style")??"dashes"}
                  @change=${t=>this._updateFlow(this._selFlow,{style:t.target.value})}
                >
                  ${p._FLOW_STYLES.map(t=>r`<option value=${t} .selected=${(e.style??b("flow_style")??"dashes")===t}>${t}</option>`)}
                </select>`,"How the line is drawn — dashes, dots, a fluid stream or discrete particles.")}

              ${this._row("Forward color",this._colorPicker(`flow-${this._selFlow}-fwd`,e.forward_color??e.color,t=>this._updateFlow(this._selFlow,{forward_color:t,color:void 0})),"Colour while the value is positive.")}

              ${this._row("Reverse color",this._colorPicker(`flow-${this._selFlow}-rev`,e.reverse_color,t=>this._updateFlow(this._selFlow,{reverse_color:t})),"Colour while the value is negative.")}

              ${this._numRow("Width (px)",{value:e.width,onChange:t=>this._updateFlow(this._selFlow,{width:t}),min:1,placeholder:"3"})}

              ${this._numRow("Particle count",{value:e.particle_count,onChange:t=>this._updateFlow(this._selFlow,{particle_count:t}),min:1,placeholder:"6",hint:"How many particles are in flight at once."})}

              ${this._row("Curve",r`<select class="ec-select"
                  .value=${e.curve??b("flow_curve")??"straight"}
                  @change=${t=>this._updateFlow(this._selFlow,{curve:t.target.value})}
                >
                  <option value="straight" .selected=${(e.curve??b("flow_curve")??"straight")==="straight"}>straight</option>
                  <option value="rounded" .selected=${e.curve==="rounded"}>rounded</option>
                </select>`,"Whether the line bows between its points or runs straight.")}
      </div>
    `}_pointLabel(e,t){if(e.card!=null){const i=this._config?.cards.find(o=>o.id===e.card);return{label:`Point ${t+1}`,sub:`Card · ${i?.name??e.card} · ${e.side??"center"}`}}return{label:`Point ${t+1}`,sub:`Free · ${e.x??0}, ${e.y??0}`}}_renderFlowPoints(e){return r`
      <div class="ec-subsection-title">Points — drag to reorder</div>
      ${e.points.length===0?this._emptyAdd("No points yet — add one",()=>this._addFlowPoint(this._selFlow)):e.points.map((t,i)=>{const{label:o,sub:s}=this._pointLabel(t,i);return this._itemCard({dragKey:`pt:${this._selFlow}:${i}`,icon:t.card!=null?"mdi:radio-button-on":"mdi:radio-button-off",label:o,sub:s,selected:i===this._selPoint,onClick:()=>{this._selPoint=i,this._navPush(`pt:${i}`,`Point ${i+1}`)},actions:r`
                <button class="ec-btn-dup"
                  @click=${a=>{a.stopPropagation(),this._duplicateFlowPoint(this._selFlow,i)}}
                  title="Duplicate point">⧉</button>
                <button class="ec-btn-remove"
                  @click=${a=>{a.stopPropagation(),this._removeFlowPoint(this._selFlow,i)}}
                  title="Remove">✕</button>
              `})})}
      <button class="ec-btn-add" style="margin-top:4px;"
        @click=${()=>this._addFlowPoint(this._selFlow)}>+ Point</button>
    `}_flowSecPoint(e,t){const i=this._flows()[e],o=i?.points[t];if(!i||!o)return this._navDeadEnd();const s=o.card!=null?"card":"free";return r`
      <div class="ec-section">
                    ${this._row("Kind",r`<select class="ec-select"
                        .value=${s}
                        @change=${a=>this._setPointKind(e,t,a.target.value)}
                      >
                        <option value="free" .selected=${s==="free"}>Free (x/y)</option>
                        <option value="card" .selected=${s==="card"}>Card</option>
                      </select>`)}

                    ${s==="card"?r`
                      ${this._row("Card",r`<select class="ec-select"
                          .value=${o.card??""}
                          @change=${a=>this._updateFlowPoint(e,t,{card:a.target.value})}
                        >
                          ${this._config.cards.map(a=>r`
                            <option value=${a.id} .selected=${o.card===a.id}>${a.name??a.id}</option>
                          `)}
                        </select>`)}

                      ${this._row("Side",r`<select class="ec-select"
                          .value=${o.side??"center"}
                          @change=${a=>this._updateFlowPoint(e,t,{side:a.target.value})}
                        >
                          ${p._FLOW_SIDES.map(a=>r`<option value=${a} .selected=${(o.side??"center")===a}>${a}</option>`)}
                        </select>`)}
                    `:r`
                      ${this._row("X",r`${this._numWrap(r`<input class="ec-input ec-input-num" type="number"
                          .value=${String(o.x??0)}
                          @change=${a=>this._updateFlowPoint(e,t,{x:Number(a.target.value)})}
                        />`)}`)}

                      ${this._row("Y",r`${this._numWrap(r`<input class="ec-input ec-input-num" type="number"
                          .value=${String(o.y??0)}
                          @change=${a=>this._updateFlowPoint(e,t,{y:Number(a.target.value)})}
                        />`)}`)}
                    `}

                    <div class="ec-subsection-title">Offset (px)</div>
                    <p class="ec-hint">Nudges this point away from its base position (card edge or x/y) without moving the card.</p>
                    ${this._numRow("dx",{value:o.dx??0,onChange:a=>this._updateFlowPoint(e,t,{dx:a})})}
                    ${this._numRow("dy",{value:o.dy??0,onChange:a=>this._updateFlowPoint(e,t,{dy:a})})}
      </div>
    `}_actionHass(){const e=this.hass;if(!e)return;this._mergedServicesSrc!==e.services&&(this._mergedServicesSrc=e.services,this._mergedServices={...e.services,...p._PSEUDO_SERVICES});const t=e.localize;return{...e,services:this._mergedServices,localize:((i,...o)=>p._PSEUDO_TITLES[i]??t(i,...o))}}static _actionToServiceId(e){return!e||e.action==="none"?"":e.action==="call-service"?e.service??"":p._PSEUDO_ACTIONS.find(t=>t.action===e.action)?.id??""}static _serviceIdToAction(e,t){if(!e)return;const i=p._PSEUDO_ACTIONS.find(o=>o.id===e);if(!i)return{action:"call-service",service:e,target:t?.target,service_data:t?.service_data};switch(i.action){case"more-info":case"toggle":return{action:i.action,entity:t?.entity};case"navigate":return{action:"navigate",navigation_path:t?.navigation_path};case"url":return{action:"url",url_path:t?.url_path};case"open-extended":return{action:"open-extended",extended_card_id:t?.extended_card_id};default:return{action:i.action}}}_popoverCardRow(e,t){const i=this._config?.extended_cards??[];if(i.length===0)return r`
        <p class="ec-hint">No popover cards exist yet, so there is nothing to open.</p>
        <button class="ec-btn-add" @click=${()=>{this._navTab="cards",this._navPanel="popover",this._navPath=[]}}>
          Go to Popover Cards
        </button>
      `;const o=e.extended_card_id,s=o!=null&&o!==""&&!i.some(a=>a.id===o);return r`
      ${this._row("Popover card",r`<select class="ec-select"
          .value=${o??""}
          @change=${a=>t({...e,extended_card_id:a.target.value||void 0})}
        >
          <option value="" .selected=${!o}>(select)</option>
          ${i.map(a=>r`
            <option value=${a.id} .selected=${o===a.id}>${a.name??a.id}</option>
          `)}
        </select>`)}
      ${s?r`<ha-alert alert-type="warning">This action points at <code>${o}</code>, which no longer exists. Pick another popover card.</ha-alert>`:u}
    `}_actionPicker(e,t,i,o="",s){const a=p._actionToServiceId(t);return r`
      ${this._row(e,r`<ha-service-picker
        .hass=${this._actionHass()}
        .value=${a}
        placeholder=${o}
        @value-changed=${n=>{n.stopPropagation();const l=n.detail.value??"";l!==a&&i(p._serviceIdToAction(l,t))}}
      ></ha-service-picker>`,s)}
      ${this._actionSubForm(t,i)}
    `}_actionSubForm(e,t){if(!e)return u;const i=(o,s,a,n)=>this._row(o,r`<input class="ec-input" type="text" .value=${s??""} placeholder=${a}
        @change=${l=>t(n(l.target.value.trim()||void 0))} />`);switch(e.action){case"call-service":return r`<ha-service-control
          .hass=${this.hass}
          .hidePicker=${!0}
          .value=${{action:e.service,target:e.target,data:e.service_data}}
          @value-changed=${o=>{o.stopPropagation();const s=o.detail.value??{};t({...e,service:s.action??e.service,target:s.target,service_data:s.data})}}
        ></ha-service-control>`;case"more-info":case"toggle":return this._row("Entity",r`<ha-entity-picker
          .hass=${this.hass}
          .value=${e.entity??""}
          allow-custom-entity
          @value-changed=${o=>t({...e,entity:o.detail.value||void 0})}
        ></ha-entity-picker>`);case"navigate":return this._row("Path",r`<ha-selector
          class="ec-nav-picker"
          .hass=${this.hass}
          .selector=${p._NAV_SELECTOR}
          .value=${e.navigation_path??""}
          @value-changed=${o=>{o.stopPropagation();const s=o.detail.value;t({...e,navigation_path:s||void 0})}}
        ></ha-selector>`);case"url":return i("URL",e.url_path,"https://…",o=>({...e,url_path:o}));case"open-extended":return this._popoverCardRow(e,t);default:return u}}_actionRows(e,t,i=["tap_action","hold_action","double_tap_action"],o=""){return r`${i.map(s=>this._actionPicker(p._ACTION_LABELS[s],e[s],a=>t({[s]:a}),o,p._ACTION_HINTS[s]))}`}_openGGPicker(e,t,i=!1){this._ggTarget={ci:e,fi:t,isExtended:i},this._ggOpen=!0}_pickGG(e,t){if(!this._ggTarget)return;const{ci:i,fi:o,isExtended:s}=this._ggTarget,a={type:e,...t};s?this._updateExtField(i,o,a):this._updateField(i,o,a),this._ggOpen=!1,this._ggTarget=null}_embScope(e){return{root:this._embCards()[e],apply:t=>this._updateEmbCard(e,t)}}_renderEmbeddedPanel(){const e=this._navPath,t=this._embCards();if(e.length===0)return r`
        <p style="font-size:12px;color:#4a8aaa;margin:0 0 8px;">
          Embed any HA Lovelace card as a positioned canvas element. Drag the ◈ handles in the preview to reposition.
        </p>
        <div class="ec-section-header">
          <span></span>
          <button class="ec-btn-add" @click=${this._addEmbCard}>+ Embedded External Card</button>
        </div>
        ${t.length===0?this._emptyAdd("No embedded external cards yet — add one",()=>this._addEmbCard()):t.map((a,n)=>this._itemCard({dragKey:`emb:${n}`,icon:"mdi:widgets",label:a.name??a.id,sub:a.card_config?.type??"No card type set",selected:n===this._selEmbCard,onClick:()=>{this._selEmbCard=n,this._navPush(`emb:${a.id}`,a.name??a.id)},actions:r`
                <button class="ec-btn-dup"
                  @click=${l=>{l.stopPropagation(),this._duplicateEmbCard(n)}}
                  title="Duplicate card">⧉</button>
                <button class="ec-btn-remove"
                  @click=${l=>{l.stopPropagation(),this._removeEmbCard(n)}}
                  title="Remove">✕</button>
              `}))}
      `;const i=this._crumbIndex(e[0].key,t);this._selEmbCard=i;const o=t[i];if(!o)return this._navDeadEnd();if(e.length===1)return this._navMenu(p._EMB_SECTIONS,this._embScope(i));const s=this._clearOverridesBtn(p._findDef(p._EMB_SECTIONS,e[1].key),this._embScope(i));switch(e[1].key){case"sec:pos":return r`${s}${this._embSecPos(i,o)}`;case"sec:appear":return r`${s}${this._embSecAppear(i,o)}`;case"sec:visibility":return r`${s}${this._embSecVisibility(i,o)}`;case"sec:config":return r`${s}${this._embSecConfig(i,o)}`;default:return console.warn(`[mosaic-canvas-card] Embedded panel: unknown section key "${e[1].key}"`),this._navDeadEnd("This editor screen is unavailable — press Back to recover.")}}_embSecConfig(e,t){return r`
      <div class="ec-section">
        ${this._row("Name",r`<input class="ec-input" type="text" .value=${t.name??""}
            @change=${i=>this._updateEmbCard(e,{name:i.target.value||void 0})}
          />`)}

        ${this._row("Card Type",r`<span style="flex:1;min-width:0;font-family:monospace;font-size:12px;color:#5aadcc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            ${t.card_config?.type?String(t.card_config.type):r`<span style="color:#555;font-style:italic;">not set</span>`}
          </span>`,"Which Home Assistant card this is. Its own settings are edited in the config editor below.")}

        <div style="margin-top:8px;display:flex;gap:6px;">
          <button class="ec-btn-add" style="flex:1;" @click=${()=>this._openEmbPicker({kind:"std",idx:e})}>
            ${t.card_config?.type?"Change Type":"Pick Card Type"}
          </button>
          <button class="ec-btn-add" style="flex:1;" @click=${()=>void this._openEmbEditor({kind:"std",idx:e})}>
            Edit Config…
          </button>
        </div>
      </div>
    `}_embSecPos(e,t){const{totalW:i,totalH:o}=te(this._config);return r`
      <div class="ec-section">
        ${this._row("X (px)",r`${this._numWrap(r`<input class="ec-input ec-input-num" type="number"
            .value=${String(Math.round(t.position.x*i))}
            @change=${s=>this._updateEmbCard(e,{position:{...t.position,x:Number(s.target.value)/i}})}
          />`)}`,"Distance from the left edge of the canvas to the card's anchor point.")}

        ${this._row("Y (px)",r`${this._numWrap(r`<input class="ec-input ec-input-num" type="number"
            .value=${String(Math.round(t.position.y*o))}
            @change=${s=>this._updateEmbCard(e,{position:{...t.position,y:Number(s.target.value)/o}})}
          />`)}`,"Distance from the top edge of the canvas to the card's anchor point.")}

        ${this._row("Anchor",r`<select class="ec-select"
            .value=${t.anchor??b("anchor")??"top-left"}
            @change=${s=>this._updateEmbCard(e,{anchor:s.target.value})}
          >
            ${Pe.map(s=>r`<option value=${s} .selected=${(t.anchor??b("anchor")??"top-left")===s}>${Ze[s]}</option>`)}
          </select>`,"Which point of the card sits at its X/Y position.")}
        ${this._gridGeom()?r`<p class="ec-hint">In grid mode, this is the point of the card snapped to the nearest grid intersection.</p>`:u}

        ${this._gridGeom()?this._row("Columns (span)",r`${this._numWrap(r`<input class="ec-input ec-input-num" type="number" min="1" max=${this._gridGeom().cols}
            .value=${String(t.grid_span??1)}
            @change=${s=>{const a=this._gridGeom();if(!a)return;const n=Math.max(1,Math.min(a.cols,Number(s.target.value)||1)),l=Math.max(8,n*a.cellW-a.padding);this._updateEmbCard(e,{grid_span:n,width:l})}}
          />`)}`,"How many grid columns the card covers. Changing it resets Width to match."):u}

        ${this._row("Width (px)",r`${this._numWrap(r`<input class="ec-input ec-input-num" type="number" min="20"
            .value=${String(t.width)}
            @change=${s=>this._updateEmbCard(e,{width:Number(s.target.value)})}
          />`)}`,"How wide the embedded card is drawn.")}

        ${this._numRow("Height (px)",{value:t.height,onChange:s=>this._updateEmbCard(e,{height:s}),min:20,placeholder:"auto",hint:"Unset lets the embedded card size itself."})}
      </div>
    `}_embSecAppear(e,t){return r`
      <div class="ec-section">
        <div class="ec-subsection-title">Frame</div>
        <p class="ec-hint">Mosaic's own frame, drawn on the element that <i>holds</i> the card. The card inside
          keeps painting itself — use <b>Transparent</b> below to take its background away and let this show
          through. Additional CSS here styles the frame: size it, move it, layer it.</p>
        ${this._inheritRow("Use global card style","Following Global Defaults ▸ Embedded Card Default.",t.box!==void 0,i=>this._updateEmbCard(e,{box:i?void 0:{}}))}
        ${t.box!==void 0?r`
              ${this._boxRows(`emb${e}`,t.box,i=>this._updateEmbCardBox(e,i))}
              <p class="ec-hint"><b>Padding</b> insets the card inside its footprint rather than making it
                wider — the frame keeps the width set in <b>Position &amp; Size</b>.</p>
            `:u}

        <div class="ec-subsection-title">The card itself</div>
        ${this._inheritRow("Use global transparency","Following Global Defaults ▸ Embedded Card Default.",t.transparent!==void 0,i=>this._updateEmbCard(e,{transparent:i?void 0:!1}))}
        ${t.transparent!==void 0?r`
              ${this._row("Transparent",r`<input type="checkbox" .checked=${t.transparent}
                  @change=${i=>this._updateEmbCard(e,{transparent:i.target.checked})}
                />`)}
              <p class="ec-hint">Removes the embedded card's own background, border and shadow. Its content
                stays; only the panel it sits on goes.</p>
            `:u}
        ${this._cssRow(t.extra_css,i=>this._updateEmbCard(e,{extra_css:i}),"Card CSS")}
        <p class="ec-hint">Applied to the card itself, not to the frame — this is where a
          <code>--ha-card-…</code> override or a font change goes. Anything that sizes, moves or layers the
          whole thing belongs in the frame's <b>Additional CSS</b> above. Added after the global <b>Card
          CSS</b> rather than replacing it, so this wins where the two name the same property.</p>
      </div>
    `}_embSecVisibility(e,t){return r`
      <div class="ec-section">
        ${this._visibilityRows(t.visible_when,i=>this._updateEmbCard(e,{visible_when:i}))}
        <p class="ec-hint">The card stays visible here in the editor whatever the condition says, so you can
          still select and edit it. It hides on the dashboard itself.</p>
      </div>
    `}_renderEmbEditorModal(){if(!this._embEditorOpen)return u;const e=!!this._embNativeEditor,t=this._embEditorTarget?this._embConfig(this._embEditorTarget):void 0,i=t?String(t.type??""):"";return r`
      <div class="ec-lib-backdrop" @click=${this._closeEmbEditor}></div>
      <div class="ec-lib-modal" style="width:min(580px,94vw);">
        <div class="ec-lib-header">
          <span class="ec-lib-title">${i||"Embedded Card"} — Config</span>
          <div style="display:flex;align-items:center;gap:8px;">
            ${e?r`
              <button class="ec-btn-ghost ec-btn-ghost--sm"
                @click=${()=>{this._embNativeEditor=null}}>
                Use JSON
              </button>`:u}
            <button class="ec-btn-clear" @click=${this._closeEmbEditor}>✕</button>
          </div>
        </div>

        ${e?r`
          <div id="emb-native-slot"
            style="padding:12px 16px;max-height:62vh;overflow-y:auto;box-sizing:border-box;"
            @config-changed=${o=>o.stopPropagation()}
          ></div>
          <div style="display:flex;justify-content:flex-end;padding:0 16px 14px;">
            <button class="ec-btn-add" style="padding:6px 18px;" @click=${this._closeEmbEditor}>Done</button>
          </div>
        `:r`
          <div style="padding:12px 16px;">
            <p style="font-size:12px;color:#888;margin:0 0 8px;">
              JSON object — <code style="color:#5aadcc">"type"</code> plus card-specific properties.
              ${i?r`<span style="color:#c87aff;"> (no visual editor available for this card type)</span>`:u}
            </p>
            <textarea
              style="width:100%;box-sizing:border-box;min-height:220px;font-family:monospace;font-size:13px;background:#060e18;color:#c8d8e8;border:1px solid rgba(0,212,255,0.25);border-radius:6px;padding:10px;resize:vertical;outline:none;"
              .value=${this._embEditorYaml}
              @input=${o=>{this._embEditorYaml=o.target.value,this._embEditorYamlError=""}}
              spellcheck="false"
            ></textarea>
            ${this._embEditorYamlError?r`<p style="font-size:12px;color:#ff6b6b;margin:6px 0 0;">${this._embEditorYamlError}</p>`:u}
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end;padding:0 16px 14px;">
            <button class="ec-btn-ghost" @click=${this._closeEmbEditor}>Cancel</button>
            <button class="ec-btn-add" style="padding:6px 16px;" @click=${this._saveEmbEditorYaml}>Save</button>
          </div>
        `}
      </div>
    `}_renderEmbPickerModal(){if(!this._embPickerOpen)return u;const e=window.customCards??[],t=go.map(c=>({...c,source:"Built-in"})),i=e.map(c=>({type:c.type.startsWith("custom:")?c.type:`custom:${c.type}`,name:c.name??c.type,description:c.description,source:"Custom"})),o=new Set(t.map(c=>c.type)),s=[...t,...i.filter(c=>!o.has(c.type))],a=this._embPickerSearch.trim().toLowerCase(),n=a?s.filter(c=>c.name.toLowerCase().includes(a)||c.type.toLowerCase().includes(a)):s,l=s.some(c=>c.type===a||c.name.toLowerCase()===a);return r`
      <div class="ec-lib-backdrop" @click=${()=>{this._embPickerOpen=!1}}></div>
      <div class="ec-lib-modal" style="width:min(480px,94vw);">
        <div class="ec-lib-header">
          <span class="ec-lib-title">Select Card Type</span>
          <button class="ec-btn-clear" @click=${()=>{this._embPickerOpen=!1}}>✕</button>
        </div>
        <div style="padding:10px 16px 6px;">
          <input class="ec-input" type="search" placeholder="Search by name or type…"
            style="width:100%;box-sizing:border-box;"
            .value=${this._embPickerSearch}
            @input=${c=>{this._embPickerSearch=c.target.value}}
          />
        </div>
        <div style="max-height:52vh;overflow-y:auto;padding:2px 8px 10px;">
          ${n.map(c=>r`
            <div class="ec-list-row" style="cursor:pointer;padding:8px 10px;"
              @click=${()=>void this._pickEmbCardType(c.type)}>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;color:#c8d8e8;font-weight:500;">${c.name}</div>
                <div style="font-size:11px;color:#5aadcc;font-family:monospace;">${c.type}</div>
                ${c.description?r`<div style="font-size:11px;color:#666;margin-top:1px;">${c.description}</div>`:u}
              </div>
              <span style="font-size:10px;color:#375f78;padding-left:10px;white-space:nowrap;">${c.source}</span>
            </div>
          `)}
          ${a&&!l?r`
            <div class="ec-list-row" style="cursor:pointer;padding:8px 10px;border-top:1px solid rgba(255,255,255,0.06);margin-top:4px;"
              @click=${()=>void this._pickEmbCardType(a)}>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;color:#c8d8e8;">Use "<strong>${a}</strong>"</div>
                <div style="font-size:11px;color:#666;">Enter type manually</div>
              </div>
            </div>
          `:u}
        </div>
      </div>
    `}_renderFlowCompleteModal(){if(!this._showFlowCompleteModal)return u;const e=this._flows()[this._pendingFlowIdx]?.name??"Flow";return r`
      <div class="ec-lib-backdrop"></div>
      <div class="ec-lib-modal" style="width:min(420px,92vw);">
        <div class="ec-lib-header">
          <span class="ec-lib-title">Complete Flow Configuration</span>
        </div>
        <div style="padding:16px 20px;line-height:1.5;">
          <p style="margin:0 0 12px;">
            <strong>${e}</strong> was added. To set the entity, direction, and style,
            complete its configuration in the <strong>Flows</strong> section below.
          </p>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;padding:0 20px 16px;">
          <button class="ec-btn-add" @click=${()=>this._goToFlow()}>Take Me There</button>
          <button class="ec-btn-align" @click=${()=>{this._showFlowCompleteModal=!1,this._previewExpanded=!1,this._pendingFlowIdx=-1}}>Close</button>
        </div>
      </div>
    `}_renderGGModal(){if(!this._ggOpen)return u;const e=n=>r`<img class="ec-lib-preview" src="${He+n}" alt=""
      @error=${l=>{const c=l.target,d=document.createElement("div");d.className="ec-lib-thumb-placeholder",c.parentNode?.replaceChild(d,c)}} />`,t=[{value:15,color:"#ef4444"},{value:35,color:"#f59e0b"},{value:100,color:"#22c55e"}],i=[{label:"Thermometer",file:"thermometer.svg",fill_direction:"up",width:60,height:200},{label:"Thermometer (Horizontal)",file:"thermometer-horizontal.svg",fill_direction:"left",width:200,height:60},{label:"Arc Gauge",file:"gauge-arc.svg",fill_direction:"up",width:200,height:120},{label:"Battery (Vertical)",file:"battery-vertical.svg",fill_direction:"up",width:44,height:100,thresholds:t},{label:"Battery (Horizontal)",file:"battery-horizontal.svg",fill_direction:"left",width:100,height:44,thresholds:t},{label:"Tank (Cylinder)",file:"tank-cylinder.svg",fill_direction:"up",width:100,height:150},{label:"Tank - Water",file:"tank-water.svg",fill_direction:"up",width:80,height:95},{label:"Tank (Fermenter)",file:"tank-fermenter.svg",fill_direction:"up",width:60,height:165},{label:"Tank (Cone)",file:"tank-cone.svg",fill_direction:"up",width:80,height:150},{label:"Inverter",file:"inverter.svg",fill_direction:"up",width:100,height:100}],o=[{label:"Line",graph_type:"stat-line",thumb:"thumb_stat_line.webp"},{label:"Line (Stacked)",graph_type:"stat-area",thumb:"thumb_stat_area.webp"},{label:"Bar",graph_type:"bar",thumb:"thumb_stat_bar.webp"},{label:"Bar (Horizontal)",graph_type:"bar-h",thumb:"thumb_stat_bar_h.webp"},{label:"Bar (Stacked)",graph_type:"bar-stacked",thumb:"thumb_statbar_stacked.webp"}],s=[{label:"With Unit (line)",graph_type:"line",thumb:"thumb_history_uom.webp"},{label:"No Unit (states)",graph_type:"state-timeline",thumb:"thumb_history_no_uom.webp"}],a=[{label:"Arc Gauge",graph_type:"gauge",thumb:"thumb_gauge_arc.webp"},{label:"Arc Gauge (Needle)",graph_type:"gauge-needle",thumb:"thumb_gauge_arc_needle.webp"}];return r`
      <div class="ec-lib-backdrop" @click=${()=>{this._ggOpen=!1}}></div>
      <div class="ec-lib-modal">
        <div class="ec-lib-header">
          <span class="ec-lib-title">Element Library</span>
          <button class="ec-btn-clear" @click=${()=>{this._ggOpen=!1}}>✕</button>
        </div>

        <div class="ec-lib-cat">SVG Elements</div>
        <div class="ec-lib-grid">
          ${i.map(n=>r`
            <button class="ec-lib-item" title="${n.label}"
              @click=${()=>this._pickGG("svg",{svg:n.file,fill_direction:n.fill_direction,width:n.width,height:n.height,...n.thresholds?{thresholds:n.thresholds}:{}})}>
              ${e(n.file)}
              <span class="ec-lib-name">${n.label}</span>
            </button>
          `)}
        </div>

        <div class="ec-lib-cat">Statistics Graph</div>
        <div class="ec-lib-grid">
          ${o.map(n=>r`
            <button class="ec-lib-item" title="${n.label}"
              @click=${()=>this._pickGG("graph",{graph_type:n.graph_type})}>
              ${e(n.thumb)}
              <span class="ec-lib-name">${n.label}</span>
            </button>
          `)}
        </div>

        <div class="ec-lib-cat">History Graph</div>
        <div class="ec-lib-grid">
          ${s.map(n=>r`
            <button class="ec-lib-item" title="${n.label}"
              @click=${()=>this._pickGG("graph",{graph_type:n.graph_type})}>
              ${e(n.thumb)}
              <span class="ec-lib-name">${n.label}</span>
            </button>
          `)}
        </div>

        <div class="ec-lib-cat">Gauge</div>
        <div class="ec-lib-grid">
          ${a.map(n=>r`
            <button class="ec-lib-item" title="${n.label}"
              @click=${()=>this._pickGG("graph",{graph_type:n.graph_type})}>
              ${e(n.thumb)}
              <span class="ec-lib-name">${n.label}</span>
            </button>
          `)}
        </div>
      </div>
    `}_row(e,t,i){return r`
      <label class="ec-row">
        <span class="ec-label${i?" ec-label--hinted":""}" title=${i??u}>${e}</span>
        <div class="ec-control">${t}</div>
      </label>
    `}_optRow(e,t,i,o,s){return r`
      <div class="ec-row">
        <label class="ec-label">${e}${t?r`<span class="ec-label-hint">${t}</span>`:u}</label>
        <div class="ec-control ec-opt-control">
          <label class="ec-opt-inherit">
            <input type="checkbox" .checked=${i} @change=${a=>s(a.target.checked)} />
            Inherit
          </label>
          <div class="ec-opt-target${i?" ec-opt-target--disabled":""}">${o}</div>
        </div>
      </div>
    `}_colorPicker(e,t,i,o){const s=t??"",a=this._cpOpenId===e,{base:n,alpha:l}=mo(s),c=/^#[0-9a-fA-F]{6}$/.test(n)?n:n?bo(n,this):"#000000",d=s||"transparent",h=o?.clearable!==!1&&t!=null,_=["#ff0000","#ff4500","#ff8800","#ffff00","#00ff00","#00ff7f","#00ffff","#0000ff","#9400d3","#ff00ff","#ffffff","#00d4ff","#22c55e","#888888","#333333","#000000"],m=parseInt(c.slice(1,3),16),g=parseInt(c.slice(3,5),16),f=parseInt(c.slice(5,7),16),$=(S,E,F)=>`#${[S,E,F].map(Y=>Math.max(0,Math.min(255,Y)).toString(16).padStart(2,"0")).join("")}`,R=n!==""&&!/^#[0-9a-fA-F]{6}$/.test(n)&&!/^rgb/i.test(n),k=(S,E)=>{if(E>=1){i(S);return}const F=parseInt(S.slice(1,3),16),Y=parseInt(S.slice(3,5),16),Z=parseInt(S.slice(5,7),16);i(`rgba(${F},${Y},${Z},${Number(E.toFixed(3))})`)},x=S=>{R?i(Mt(n,S)):k(c,S)};return r`
      <div class="ec-cp-wrap" @keydown=${S=>{S.key!=="Escape"||this._cpOpenId!==e||(S.preventDefault(),S.stopPropagation(),this._cpOrigValue!==t&&i(this._cpOrigValue),this._cpOpenId=null)}}
        @click=${S=>{this._cpOpenId===e&&S.preventDefault()}}>
        <div class="ec-color-row">
          <button class="ec-color-swatch-btn" title="Open color picker"
            style="--mce-swatch:${d}"
            @click=${S=>{if(S.stopPropagation(),!a){const E=S.currentTarget.getBoundingClientRect(),F=document.createElement("div");F.style.cssText="position:fixed;inset:0;pointer-events:none;visibility:hidden;",S.currentTarget.parentElement.appendChild(F);const Y=F.getBoundingClientRect();F.remove();const Z=Math.max(12,Math.min(E.left,window.innerWidth-254))-Y.left;this._cpPos=window.innerHeight-E.bottom<340?{left:Z,bottom:Y.bottom-E.top+4}:{left:Z,top:E.bottom+4-Y.top},this._cpOrigValue=t}this._cpOpenId=a?null:e}}
          ></button>
          <input type="text" class="ec-color-text"
            .value=${s}
            placeholder="#rrggbb · rgb() · name"
            @change=${S=>{const E=S.target.value.trim();i(E||void 0)}}
          />
          ${h?r`<button class="ec-btn-clear" title="${o?.clearTitle??"Clear"}"
            @click=${o?.onClear??(()=>i(void 0))}>✕</button>`:u}
          ${o?.gradient?r`<label class="ec-cp-grad-toggle"
            title="Blends this colour into a second one. Unticking clears the end colour and its angle.">
            <input type="checkbox" .checked=${o.gradient.on}
              @change=${S=>o.gradient.onToggle(S.target.checked)} />
            Gradient
          </label>`:u}
        </div>
        ${a?r`
          <div class="ec-cp-backdrop" @click=${()=>{this._cpOpenId=null}}></div>
          <div class="ec-cp-popup"
            style="left:${this._cpPos?.left??0}px;${this._cpPos?.top!=null?`top:${this._cpPos.top}px`:`bottom:${this._cpPos?.bottom??0}px`}"
            role="dialog" aria-label="Color picker — Escape to cancel" tabindex="-1"
            @click=${S=>{S.preventDefault(),S.stopPropagation()}}>
            <div class="ec-cp-modes">
              <button class="ec-cp-mode${this._cpMode==="rgb"?" active":""}"
                @click=${()=>{this._cpMode="rgb"}}>RGB Mode</button>
              <button class="ec-cp-mode${this._cpMode==="css"?" active":""}"
                @click=${()=>{this._cpMode="css"}}>CSS Mode</button>
            </div>
            ${this._cpMode==="css"?this._renderCpVars(i,l):r`
            <div class="ec-cp-main">
            <hex-color-picker
              .color=${c}
              @color-changed=${S=>k(S.detail.value,l)}
              @dblclick=${()=>{this._cpOpenId=null}}
            ></hex-color-picker>
            <div class="ec-cp-rgb">
              ${["R","G","B"].map((S,E)=>{const F=[m,g,f][E];return r`<label class="ec-cp-rgb-label">${S}
                  <input type="number" class="ec-cp-rgb-input" min="0" max="255"
                    .value=${String(F)}
                    @change=${Y=>{const Z=Number(Y.target.value);k($(E===0?Z:m,E===1?Z:g,E===2?Z:f),l)}}
                  />
                </label>`})}
            </div>
            <div class="ec-cp-presets">
              ${_.map(S=>r`
                <button class="ec-cp-preset" style="background:${S}" title="${S}"
                  @click=${()=>{k(S,l),this._cpOpenId=null}}
                ></button>
              `)}
            </div>
            </div>
            `}
            <div class="ec-cp-alpha">
              <span class="ec-cp-alpha-label">Opacity</span>
              <div class="ec-opacity-row">
                <input type="range" min="0" max="1" step="0.01"
                  .value=${String(l)}
                  @input=${S=>x(parseFloat(S.target.value))}
                />
                <span class="ec-opacity-val">${Math.round(l*100)}%</span>
              </div>
            </div>
          </div>
        `:u}
      </div>
    `}_renderCpVars(e,t=1){const i=this._config?.defaults?.custom_colors??[],o=s=>{e(Mt(s,t)),this._cpOpenId=null};return r`
      <div class="ec-cp-vars">
        <div class="ec-cp-vars-title">Theme color</div>
        <div class="ec-cp-vars-hint">Select a standard HA or custom color variable</div>
        <div class="ec-cp-vars-list">
          ${oo.map(s=>r`
            <button class="ec-cp-var-row" title="var(${s.name})" @click=${()=>o(`var(${s.name})`)}>
              <span class="ec-cp-var-chip" style="background:var(${s.name})"></span>
              <span class="ec-cp-var-name">${s.label}</span>
            </button>`)}
          ${i.length?r`<div class="ec-cp-vars-sep">Custom</div>`:u}
          ${i.map(s=>r`
            <button class="ec-cp-var-row" title="var(--mccust_${s.name})" @click=${()=>o(`var(--mccust_${s.name})`)}>
              <span class="ec-cp-var-chip" style="background:${s.color}"></span>
              <span class="ec-cp-var-name">mccust_${s.name}</span>
            </button>`)}
        </div>
      </div>
    `}};p._UNDO_LIMIT=50;p._UNDO_COALESCE_MS=1e3;p._TUTORIAL_STEPS=[{title:"Take a quick tour?",body:"Your card is set up. This short tour points out where everything lives — each step jumps the editor to the place it describes. Cancel any time.",nav:{tab:"cards",panel:""}},{title:"The Cards tab",body:"Everything that displays data: Mosaic Cards (your own layouts of values, labels and library elements), Popover Cards shown on a trigger action, and Embedded External Cards for placing any native or custom HA card on the canvas.",nav:{tab:"cards",panel:""}},{title:"The Elements tab",body:"Things that live on the canvas around your cards: Animated Flow Lines driven by entity values, Clickable Zones for bounded tap actions, and Virtual Entities — helper-like values computed from other entities.",nav:{tab:"elements",panel:""}},{title:"The Settings tab",body:"Card-wide configuration: the Canvas itself, Global Defaults inherited by every element, Templates for saving and loading whole layouts, and Config Health for finding broken references.",nav:{tab:"settings",panel:""}},{title:"Canvas defaults",body:"The Canvas panel holds the background images, day/night switching, aspect ratio and placement mode. The background you chose during setup can be changed here at any time.",nav:{tab:"settings",panel:"canvas"}},{title:"Card Defaults",body:"Global Defaults ▸ Mosaic Card Defaults is the styling every Mosaic Card inherits — box style, text colour and popup behaviour. Set the look once here rather than per card; individual cards only need overrides. Popover cards have their own screen beside it and do not inherit this one.",nav:{tab:"settings",panel:"defaults",path:[{key:"sec:card",label:"Mosaic Card Defaults"}]}},{title:"Your first Mosaic Card",body:"This is the Mosaic Card list. Press “+ Mosaic Card” to create one, open it, then press “+ Field”, set the field’s Type to Value and pick an entity — that puts a live value on the canvas.",nav:{tab:"cards",panel:"mosaic"}},{title:"The Mosaic Editor",body:"“Open Mosaic Editor Window” (above the tabs) opens the fullscreen drag editor — position cards, zones and flow points directly on your background. Double-click any element there to jump straight to its settings.",nav:{tab:"cards",panel:""}}];p._PTR_DRAG_SLOP=6;p._PTR_EDGE=44;p._PTR_SCROLL_MAX=16;p.PICKER_HEIGHT=30;p._WALKED_PICKERS=["ha-icon-picker",".ec-attr-picker","ha-service-picker",".ec-nav-picker"];p._TAB_LABEL={cards:"Cards",elements:"Elements",settings:"Settings"};p._PANEL_META={mosaic:{icon:"mdi:view-dashboard",title:"Mosaic Cards",desc:"Canvas cards holding value, label, icon, Element Library (SVG fills & graphs), blank and rule fields. Reorder fields to stack them; style per-card or inherit the global defaults."},popover:{icon:"mdi:picture-in-picture-bottom-right",title:"Popover Cards",desc:"Popup panels opened by an Open Popover action from a card, field or zone. Column-based layout with their own defaults."},embedded:{icon:"mdi:widgets",title:"Embedded External Cards",desc:"Embed any native or custom Home Assistant dashboard card directly onto the canvas."},flows:{icon:"mdi:chart-timeline-variant",title:"Animated Flow Lines",desc:"CSS-animated lines between canvas points. An entity value drives speed and direction; style is dashes, dots, fluid or particles."},zones:{icon:"mdi:gesture-tap-box",title:"Clickable Zones",desc:"Bounded clickable hotspots pinned to canvas coordinates, used to trigger tap / hold / double-tap actions."},virtuals:{icon:"mdi:memory",title:"Virtual Entities",desc:"Computed helper entities — add, subtract, mean, signed net or time-until — usable across every card without a HA helper."},canvas:{icon:"mdi:image-size-select-actual",title:"Canvas",desc:"Placement mode (Precision or Grid), base size, fit, extend margins, the canvas box and the background image set."},defaults:{icon:"mdi:palette",title:"Global Defaults",desc:"Default box, value and label styling plus fonts, gaps and element fill colors. Cards and fields inherit these unless overridden."},templates:{icon:"mdi:bookmark-multiple",title:"Templates",desc:"Save the current layout as a portable template, or import one to replace the configuration."},health:{icon:"mdi:stethoscope",title:"Config Health",desc:"Read-only checks over the whole configuration: references that no longer resolve, entities Home Assistant does not have, and values only reachable from the YAML editor. Every row opens the screen that owns it."},about:{icon:"mdi:information-outline",title:"About",desc:"Card version, documentation and project links."}};p._RIBBON_ITEMS=[{tab:"cards",panel:"mosaic",icon:"mdi:view-dashboard",label:"Mosaic Card",hint:"Values, labels, icons & Element Library"},{tab:"cards",panel:"popover",icon:"mdi:picture-in-picture-bottom-right",label:"Popover Cards",hint:"Shown on a trigger action"},{tab:"cards",panel:"embedded",icon:"mdi:widgets",label:"Embedded External Cards",hint:"Any native or custom HA card"},{tab:"elements",panel:"flows",icon:"mdi:chart-timeline-variant",label:"Animated Flow Lines",hint:"Entity-driven CSS flows"},{tab:"elements",panel:"zones",icon:"mdi:gesture-tap-box",label:"Clickable Zones",hint:"Bounded action areas"},{tab:"elements",panel:"virtuals",icon:"mdi:memory",label:"Virtual Entities",hint:"Helper-like computed values"},{tab:"settings",panel:"canvas",icon:"mdi:image-size-select-actual",label:"Canvas",hint:"Background, aspect & placement mode"},{tab:"settings",panel:"defaults",icon:"mdi:palette",label:"Global Defaults",hint:"Inherited element styling"},{tab:"settings",panel:"templates",icon:"mdi:bookmark-multiple",label:"Templates",hint:"Import & export layout"},{tab:"settings",panel:"health",icon:"mdi:stethoscope",label:"Config Health",hint:"Broken references & YAML-only values"},{tab:"settings",panel:"about",icon:"mdi:information-outline",label:"About",hint:"Version, links & support"}];p._SEARCH_LIMIT=30;p._BLANK_RULE_DEF={key:"fsec:blankform",label:"Spacer",hint:"Gap height",icon:"mdi:crop-square-outline",paths:["blank_gap"]};p._CARD_BG_PATHS=["url","entity","rules","fit","opacity","width","height","padding_top","padding_bottom","padding_left","padding_right"];p._CARD_SECTIONS=[{key:"sec:defaults",label:"Card Defaults",hint:"Name, anchor, alignment, placement, size, gaps",icon:"mdi:tune",terms:"name anchor canvas align alignment columns span width height gap transparent placement flow grid rows cells row gap",paths:["name","anchor","align","columns","grid_span","grid_row_span","width","height","layout_mode","grid","field_gap","column_gap","transparent"]},{key:"sec:style",label:"Card Style",hint:"Transparent, background, border, shadow",icon:"mdi:palette",terms:ue,paths:A("box",se)},{key:"sec:text",label:"Text Styles",hint:"Value & label style",icon:"mdi:format-title",terms:xe,paths:[...A("value_style",ce),...A("label_style",ce)]},{key:"sec:visibility",label:"Card Visibility",hint:"Show / hide by condition",icon:"mdi:eye-outline",terms:Ut,paths:["visible_when"]},{key:"sec:actions",label:"Actions",hint:"Tap · hold · double tap",icon:"mdi:gesture-tap",terms:Oe,paths:ct},{key:"sec:bg",label:"Background Image",hint:"Image behind the card fields",icon:"mdi:image-outline",terms:"url path image fit opacity width height padding cover contain stretch entity state value rules images swap",paths:A("bg",p._CARD_BG_PATHS)}];p._SUM_DEVICE_CLASSES=new Set(["energy","gas","water","volume","monetary"]);p._THERMO_PATHS=re("thermo_",Vt);p._GRAPH_CHROME_PATHS=["graph_axis_color","graph_grid_color","graph_zero_line_color","graph_baseline_color","graph_label_color","graph_tick_color","graph_label_size","graph_unit_label_color","graph_bar_label_color","graph_legend_label_color","graph_gauge_track_color","graph_gauge_value_color","graph_palette"];p._STAT_PATHS=["stat_type","stat_characteristic","stat_period","stat_period_start","stat_period_end","stat_period_n","stat_max_age_hours","stat_sampling_size","stat_percentile"];p._POS=["above","below","left","right"];p._OPTION_LAYOUT_KEYS=["option_icon_position","option_show_state","option_state_position","option_icon_style","option_label_style","option_state_style"];p._OPTION_LAYOUT_DEF={key:"optlayout",label:"Option Layout",hint:"Icon & state position, sizes, separation",icon:"mdi:view-grid-outline",paths:[...p._OPTION_LAYOUT_KEYS,...A("control_style",dt)]};p._DEFAULTS_SECTIONS=[{key:"sec:card",label:"Mosaic Card Defaults",hint:"Field placement, box style, text color and popup behaviour",icon:"mdi:view-dashboard-outline",terms:`${ue} text colour color white contrast photo scrim backdrop dim overlay expand modal close button radius placement flow grid columns rows cells row gap`,paths:[...A("card",se),"card_text_color","card_columns","card_layout_mode","card_grid_columns","card_grid_rows","card_field_gap","card_column_gap","card_grid_row_gap",...Qe]},{key:"sec:popover",label:"Popover Card Defaults",hint:"Default columns, size, gaps, style & dimming for every popover card",icon:"mdi:picture-in-picture-bottom-right",terms:`${ue} popover extended popup panel columns width height gap scrim backdrop dim`,paths:[...et]},{key:"sec:embedded",label:"Embedded Card Default",hint:"Default frame, transparency & CSS for embedded cards",icon:"mdi:card-outline",terms:`${ue} embedded external third party lovelace frame surround host transparent chrome css`,paths:[...A("embedded_card",se),"embedded_card_transparent","embedded_card_extra_css"]},{key:"sec:value",label:"Value Default",hint:"Default value text style",icon:"mdi:function-variant",terms:xe,paths:A("value",ce)},{key:"sec:label",label:"Label Default",hint:"Default label text style",icon:"mdi:format-title",terms:xe,paths:A("label",ce)},{key:"sec:control",label:"Control Default",hint:"Per-control style sections",icon:"mdi:toggle-switch-outline"},{key:"sec:customcolors",label:"Custom Colors",hint:"Reusable css color variables",icon:"mdi:language-css3",paths:["custom_colors"]},{key:"sec:customvars",label:"Custom Variables",hint:"Reusable sizes, shadows and other values",icon:"mdi:code-braces",paths:["custom_vars"]},{key:"sec:layout",label:"Layout & Fonts",hint:"Fonts and units, for every card type",icon:"mdi:format-size",paths:["power_unit","stat_update_interval","font_family","mono_font_family"]},{key:"sec:elements",label:"Element Library",hint:"Thermometer, battery, tank, inverter, gauge",icon:"mdi:palette-swatch-outline"},{key:"sec:reset",label:"Reset & Rerun Wizard",hint:"Clear all cards, flows, zones & background",icon:"mdi:restore-alert"}];p.SEPARATION_KEYS=[...dt,...ht];p._CONTROL_DEFAULTS_SECTIONS=[{key:"cd:common",label:"Common",hint:"Accent color — themes every control",icon:"mdi:palette",paths:A("control_style",[...pe.accent,"gradient_angle"])},{key:"cd:density",label:"Density",hint:"Text size, padding and gap for every control",icon:"mdi:arrow-collapse-vertical",paths:["control_font_size","control_padding","control_gap"]},{key:"cd:toggle",label:"Toggle",hint:"On / off colors",icon:"mdi:toggle-switch-outline",paths:A("control_style",pe.toggle)},{key:"cd:slider",label:"Slider",hint:"Track, fill, thumb, height",icon:"mdi:tune-variant",paths:A("control_style",pe.slider)},{key:"cd:dropdown",label:"Dropdown",hint:"Border, background, menu, selected",icon:"mdi:form-dropdown",paths:A("control_style",pe.dropdown)},{key:"cd:selector",label:"Button Group",hint:"Container, active / inactive, separation",icon:"mdi:view-dashboard-variant-outline",terms:"selector segmented options option cells row wrap"},{key:"cd:input",label:"Input",hint:"Border, background, focus",icon:"mdi:form-textbox",paths:A("control_style",pe.input)},{key:"cd:spinbox",label:"Spin Box",hint:"Border, button, hover, width",icon:"mdi:numeric",paths:A("control_style",pe.spinbox)},{key:"cd:button",label:"Button",hint:"Container, active / inactive",icon:"mdi:gesture-tap-button"},{key:"cd:container",label:"Container Box",hint:"Box behind every control",icon:"mdi:square-rounded-outline",terms:ue,paths:A("control",se)},{key:"cd:variants",label:"Variant Builder",hint:"Create and manage custom control variants",icon:"mdi:shape-plus"}];p._ELEM_LIB_SECTIONS=[{key:"el:thermo-v",label:"Thermometer (Vertical)",hint:"Ticks, grid, fill, temperature text",icon:"mdi:thermometer",terms:nt,paths:re("thermo_",Rt)},{key:"el:thermo-h",label:"Thermometer (Horizontal)",hint:"Ticks, grid, fill, temperature text",icon:"mdi:thermometer",terms:nt,paths:re("thermo_h_",Rt)},{key:"el:bat-h",label:"Battery (Horizontal)",hint:"Fill & gradient",icon:"mdi:battery",paths:re("battery_h_",Pt)},{key:"el:bat-v",label:"Battery (Vertical)",hint:"Fill & gradient",icon:"mdi:battery",paths:re("battery_v_",Pt)},{key:"el:tank-cyl",label:"Tank (Cylinder)",hint:"Fill, direction, wall",icon:"mdi:barrel",paths:re("tank_cylinder_",Fe)},{key:"el:tank-water",label:"Tank - Water",hint:"Fill, direction, wall",icon:"mdi:water",paths:re("tank_water_",Fe)},{key:"el:tank-ferm",label:"Tank - Fermenter",hint:"Fill, direction, wall",icon:"mdi:flask-outline",paths:re("tank_fermenter_",Fe)},{key:"el:tank-cone",label:"Tank - Cone",hint:"Fill, direction, wall",icon:"mdi:triangle-outline",paths:re("tank_cone_",Fe)},{key:"el:inverter",label:"Inverter",hint:"Line color",icon:"mdi:sine-wave",paths:["inverter_line_color","inverter_extra_css"]},{key:"el:gauge-arc",label:"Gauge (Arc)",hint:"Needle, label color & size",icon:"mdi:speedometer",paths:["gauge_arc_needle_color","gauge_arc_label_color","gauge_arc_label_size","gauge_arc_extra_css"]}];p.ELEM_CSS_KEY={"el:thermo-v":"thermo_extra_css","el:thermo-h":"thermo_h_extra_css","el:bat-h":"battery_h_extra_css","el:bat-v":"battery_v_extra_css","el:tank-cyl":"tank_cylinder_extra_css","el:tank-water":"tank_water_extra_css","el:tank-ferm":"tank_fermenter_extra_css","el:tank-cone":"tank_cone_extra_css","el:inverter":"inverter_extra_css","el:gauge-arc":"gauge_arc_extra_css"};p._POPOVER_GLOBAL_DEFAULTS_DEF={key:"defaults-global",label:"Popover Card Defaults",hint:"Default columns, size, gaps & style for every popover card",icon:"mdi:tune",paths:["columns","width","height","field_gap","column_gap",...A("card",se),...A("label",ce),...A("value",ce)]};p._POPOVER_CARD_SECTIONS=[{key:"sec:defaults",label:"Card Defaults",hint:"Columns, width %, height %, gaps",icon:"mdi:tune",paths:["name","columns","width","height","align","field_gap","column_gap"]},{key:"sec:style",label:"Card Style",hint:"Inherit or override background, border, shadow, blur",icon:"mdi:palette",terms:`${ue} use global inherit override`,paths:A("box",se)},{key:"sec:text",label:"Text Styles",hint:"Inherit or override label & value style",icon:"mdi:format-title",terms:`${xe} use global inherit override`,paths:[...A("label_style",ce),...A("value_style",ce)]}];p._COPYABLE_CARD_STYLE_KEYS=se;p._CANVAS_SECTIONS=[{key:"sec:mode",label:"Placement Mode",hint:"Precision or Grid",icon:"mdi:grid",paths:["canvas.layout_mode","canvas.grid.columns","canvas.grid.rows","canvas.grid.padding"]},{key:"sec:size",label:"Canvas Size",hint:"Base size, fit & extend",icon:"mdi:aspect-ratio",paths:["canvas.width","canvas.height","canvas.fit","canvas.extend.top","canvas.extend.right","canvas.extend.bottom","canvas.extend.left"]},{key:"sec:box",label:"Canvas Box",hint:"Canvas background & border",icon:"mdi:image-frame",terms:ue,paths:A("canvas.box",se)},{key:"sec:bg",label:"Background",hint:"Method, images & EV count",icon:"mdi:image-multiple",terms:"method single image day night state entity rules value swap url path picker library media",paths:["background.source","background.sun_entity","background.sun_attribute","background.mode_entity","background.mode_attribute","background.fit","background.images","background.url","background.entity","background.rules","ev_count"]}];p._TEMPLATE_SECTIONS=[{key:"sec:export",label:"Export Template",hint:"Save the current layout as a file",icon:"mdi:download"},{key:"sec:import",label:"Import Template",hint:"Load a saved layout file",icon:"mdi:upload"},{key:"sec:varexport",label:"Export Control Variants",hint:"Save this card's custom variants as a file",icon:"mdi:shape-plus"},{key:"sec:varimport",label:"Import Control Variants",hint:"Merge custom variants from a file",icon:"mdi:shape-outline"}];p._VIRTUAL_OPS=[{value:"add",label:"Add (sum all)"},{value:"subtract",label:"Subtract (first − rest)"},{value:"mean",label:"Mean (average)"},{value:"signed_net",label:"Signed net (input[0] − input[1])"},{value:"time_until",label:"Time Until"},{value:"statistic",label:"Statistic"}];p._ZONE_SECTIONS=[{key:"sec:defaults",label:"Zone Defaults",hint:"Name, position, anchor, size, overlay",icon:"mdi:tune",terms:"name x y position width height color radius",paths:["name","position.x","position.y","anchor","width","height","color","radius"]},{key:"sec:actions",label:"Actions",hint:"Tap · hold · double tap",icon:"mdi:gesture-tap",terms:Oe,paths:ct}];p._FLOW_STYLES=["dashes","dots","fluid","particles"];p._FLOW_SIDES=["top","right","bottom","left","center"];p._FLOW_SECTIONS=[{key:"sec:defaults",label:"Flow Defaults",hint:"Name, entity, min display power, invert",icon:"mdi:tune",paths:["name","entity","min_power","invert"]},{key:"sec:speed",label:"Speed",hint:"Slowest / fastest value → animation speed",icon:"mdi:speedometer",paths:["speed_min_value","speed_max_value","speed_min_duration","speed_max_duration","duration"]},{key:"sec:style",label:"Line Style",hint:"Style, colors, width, curve",icon:"mdi:brush-variant",terms:"dashes dots fluid particles duration count",paths:["style","forward_color","color","reverse_color","width","particle_count","curve"]}];p._ACTION_LABELS={tap_action:"Tap",hold_action:"Hold",double_tap_action:"Double tap"};p._ACTION_HINTS={tap_action:"What a single tap does. Leave blank for nothing.",hold_action:"What a press-and-hold does. Leave blank for nothing.",double_tap_action:"What two quick taps do. Leave blank for nothing."};p._PSEUDO_ACTIONS=[{id:"mosaic.open_popover",action:"open-extended",name:"Open Popover",description:"Show one of this card's popover cards."},{id:"mosaic.expand_card",action:"expand-card",name:"Expand Card",description:"Expand this card to fill the canvas."},{id:"mosaic.fire_dom_event",action:"fire-dom-event",name:"Fire DOM Event",description:"Fire a browser DOM event for another frontend add-on to pick up."},{id:"ui.more_info",action:"more-info",name:"More info",description:"Open the entity's more-info dialog."},{id:"ui.toggle",action:"toggle",name:"Toggle",description:"Toggle the entity."},{id:"ui.navigate",action:"navigate",name:"Navigate",description:"Go to another dashboard view."},{id:"ui.url",action:"url",name:"Open URL",description:"Open a link."},{id:"ui.assist",action:"assist",name:"Assist",description:"Open the Assist dialog."}];p._PSEUDO_SERVICES=(()=>{const e={};for(const t of p._PSEUDO_ACTIONS){const i=t.id.indexOf("."),o=t.id.slice(0,i);(e[o]??={})[t.id.slice(i+1)]={name:t.name,description:t.description,fields:{}}}return e})();p._PSEUDO_TITLES={"component.mosaic.title":"Mosaic","component.ui.title":"Interface"};p._NAV_SELECTOR={navigation:{}};p._EMB_SECTIONS=[{key:"sec:config",label:"Card Config",hint:"Pick card type & edit config",icon:"mdi:widgets",paths:["name","card_config"]},{key:"sec:pos",label:"Position & Size",hint:"Anchor, width, span, height",icon:"mdi:arrow-expand-all",paths:["position.x","position.y","anchor","grid_span","width","height"]},{key:"sec:appear",label:"Card Style",hint:"Frame, transparency & CSS",icon:"mdi:palette",terms:`${ue} transparent chrome frame surround use global inherit override embedded external card css`,paths:["transparent","extra_css",...A("box",se)]},{key:"sec:visibility",label:"Card Visibility",hint:"Show / hide by condition",icon:"mdi:eye-outline",terms:Ut,paths:["visible_when"]}];p.styles=[_i`
      :host {
        display: block;
        font-size: 16px;
        color: var(--primary-text-color);

        

        --mce-field-h: 30px;
        --mce-field-radius: 6px;
        --mce-field-font-size: 15px;
        --mce-field-bg: var(--primary-background-color, rgba(0,8,18,0.7));
        --mce-field-border-color: var(--divider-color, rgba(0,212,255,0.18));
        --mce-field-focus-color: var(--mce-accent);
        --mce-field-text: var(--primary-text-color, #c8e0ec);

        

        --mce-accent: var(--accent-color, #00d4ff);
        --mce-accent-fill: color-mix(in srgb, var(--mce-accent) 8%, transparent);
        --mce-accent-fill-strong: color-mix(in srgb, var(--mce-accent) 16%, transparent);
        --mce-accent-line: color-mix(in srgb, var(--mce-accent) 45%, transparent);
        

        --mce-primary: var(--primary-color, #00d4ff);
        --mce-primary-fill: color-mix(in srgb, var(--mce-primary) 8%, transparent);
        --mce-primary-fill-strong: color-mix(in srgb, var(--mce-primary) 16%, transparent);
        --mce-primary-line: color-mix(in srgb, var(--mce-primary) 45%, transparent);
        

        --mce-fill-subtle: color-mix(in srgb, var(--primary-text-color, #fff) 5%, transparent);
        

        --mce-scrim: rgba(0,0,0,0.55);
        --mce-checker: var(--secondary-background-color, #444);
        --mce-checker-sq: color-mix(in srgb, var(--mce-checker) 78%, var(--primary-text-color, #fff));
        

        --mce-action-copy: #00d4ff;
        --mce-action-paste: #50c878;
        --mce-action-remove: #ff5050;
        

        --mce-chip-label: #00d4ff;
        --mce-chip-label-fg: #5aadcc;
        --mce-chip-value: #ffffff;
        --mce-chip-value-fg: #dddddd;
        --mce-chip-newline: #ffc800;
        --mce-chip-newline-fg: #b89900;
      }
       
      .ec-about {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
      .ec-about-version {
        font-size: 13px;
        color: var(--secondary-text-color);
        font-family: monospace;
      }
      .ec-about-link {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--mce-primary);
        text-decoration: none;
        font-size: 14px;
      }
      .ec-about-link:hover {
        text-decoration: underline;
      }
      .ec-about-link ha-icon {
        --mdc-icon-size: 18px;
      }
      .ec-about-kofi img {
        display: block;
        border-radius: 6px;
      }

       
      .ec-tour {
        position: fixed; right: 18px; bottom: 18px; z-index: 9999;
        width: 340px; max-width: calc(100vw - 36px);
        background: var(--card-background-color, #0b1622);
        color: var(--primary-text-color, #e8f4ff);
        border: 1px solid var(--divider-color, rgba(255, 255, 255, 0.12));
        border-radius: 12px; padding: 14px 16px;
        box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
      }
      .ec-tour-head { display: flex; align-items: baseline; gap: 8px; margin-bottom: 6px; }
      .ec-tour-title { font-weight: 600; font-size: 14px; flex: 1; }
      .ec-tour-count { font-size: 11px; opacity: 0.6; }
      .ec-tour-body { margin: 0 0 12px; font-size: 12.5px; line-height: 1.5; color: var(--secondary-text-color, #b8c8d8); }
      .ec-tour-btns { display: flex; gap: 8px; align-items: center; }
      .ec-tour-spacer { flex: 1; }

       
      

      .ec-wizard { padding: 24px; min-height: 280px; display: flex; flex-direction: column; background: var(--card-background-color, #0b131d); border-radius: 8px; }
      .ec-wiz-welcome { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 14px; padding: 16px 0; }
      .ec-wiz-icon { font-size: 48px; line-height: 1; }
      .ec-wiz-title { font-size: 20px; font-weight: 700; color: var(--mce-primary); margin: 0; }
      .ec-wiz-heading { font-size: 15px; font-weight: 600; color: var(--mce-primary); margin: 0 0 16px; }
      .ec-wiz-desc { font-size: 13px; color: var(--secondary-text-color, #aaa); margin: 0 0 16px; line-height: 1.5; }
      .ec-wiz-field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
      .ec-wiz-label { font-size: 12px; color: var(--secondary-text-color, #aaa); font-weight: 500; }
      .ec-wiz-input {
        background: var(--mce-field-bg);
        border: 1px solid var(--mce-field-border-color);
        border-radius: 6px; color: var(--primary-text-color, #fff); font-size: 13px;
        padding: 7px 10px; width: 100%; box-sizing: border-box;
      }
      .ec-wiz-input:focus { outline: none; border-color: var(--mce-field-focus-color); }
      .ec-wiz-select {
        background: var(--mce-field-bg);
        border: 1px solid var(--mce-field-border-color);
        border-radius: 6px; color: var(--primary-text-color, #fff); font-size: 13px;
        padding: 7px 10px; width: 100%; cursor: pointer;
      }
      .ec-wiz-select:focus { outline: none; border-color: var(--mce-field-focus-color); }
      .ec-wiz-row { display: flex; gap: 10px; margin-top: 20px; }
      .ec-wiz-end { justify-content: flex-end; }
      .ec-wiz-space { justify-content: space-between; }
      .ec-wiz-btn-primary {
        background: var(--mce-primary-fill-strong); border: 1px solid var(--mce-primary-line);
        border-radius: 20px; color: var(--mce-primary); font-size: 13px; font-weight: 600;
        padding: 8px 20px; cursor: pointer; letter-spacing: 0.04em;
      }
      .ec-wiz-btn-primary:hover { background: var(--mce-primary-fill-strong); box-shadow: 0 0 10px var(--mce-primary-line); }
      .ec-wiz-btn-ghost {
        background: transparent; border: 1px solid var(--divider-color, rgba(255,255,255,0.2));
        border-radius: 20px; color: var(--secondary-text-color, #888); font-size: 13px;
        padding: 8px 16px; cursor: pointer;
      }
      .ec-wiz-btn-ghost:hover { border-color: var(--divider-color, rgba(255,255,255,0.4)); color: var(--primary-text-color, #ccc); }
      .ec-wiz-btn-primary:disabled { opacity: 0.4; cursor: default; pointer-events: none; }
      .ec-wiz-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 4px 0 8px; }
      .ec-wiz-type-btn {
        display: flex; flex-direction: column; align-items: center; gap: 5px; text-align: center;
        padding: 16px 10px; border-radius: 10px; cursor: pointer;
        border: 2px solid var(--divider-color, rgba(255,255,255,0.1)); background: var(--mce-fill-subtle);
        transition: border-color 0.15s, background 0.15s;
      }
      .ec-wiz-type-btn:hover { border-color: var(--mce-primary-line); background: var(--mce-primary-fill); }
      .ec-wiz-type-btn.selected { border-color: var(--mce-accent); background: var(--mce-accent-fill-strong); }
      .ec-wiz-type-icon { font-size: 26px; line-height: 1; }
      .ec-wiz-type-title { font-size: 13px; font-weight: 600; color: var(--primary-text-color, #fff); }
      .ec-wiz-type-desc { font-size: 11px; color: var(--secondary-text-color, #888); line-height: 1.4; }
      .ec-wiz-ev-label { font-size: 12px; font-weight: 600; color: var(--mce-primary); margin-bottom: 10px; }
      .ec-wiz-reset-row { margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--divider-color, rgba(255,255,255,0.08)); display: flex; justify-content: flex-end; }
      .ec-wiz-btn-reset {
        background: var(--mce-accent);
        border: none;
        border-radius: 6px;
        color: var(--text-primary-color, #fff);
        font-size: 12px;
        padding: 5px 14px; cursor: pointer;
      }

       
      

      .ec-preview {
        position: relative;
        inset: auto;
        width: 100%;
        height: auto;
        max-width: none;
        max-height: none;
        margin: 0;
        padding: 0;
        border: none;
        background: transparent;
        color: inherit;
      }
      .ec-preview-card {
        display: block;
        width: 100%;
        --ha-card-padding: 0px;
        --ha-card-border-width: 0px;
        --ha-card-box-shadow: none;
      }
      .ec-canvas-area {
        position: relative;
        width: 100%;
      }
      .ec-open-editor-wrap {
        padding: 14px;
      }
      .ec-open-editor-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 13px;
        border: none;
        border-radius: 8px;
        background: var(--mce-primary);
        color: var(--text-primary-color, #fff);
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.02em;
        cursor: pointer;
        box-shadow: 0 3px 10px var(--mce-primary-line);
      }
      

      .ec-open-editor-btn:hover { filter: brightness(1.1); box-shadow: 0 5px 16px var(--mce-primary-line); }
      .ec-open-editor-btn ha-icon { --mdc-icon-size: 20px; }

       
      .ec-preview--expanded {
        position: relative;
        inset: 0;
        z-index: 9999;
        background: var(--primary-background-color, #111);
        outline: none;
        display: flex;
        flex-direction: column;
        align-items: stretch;
        width: 70vw;
        height: auto;
        margin: auto;
      }
      .ec-expanded-bottom-bar {
        display: flex;
        flex-direction: row;
        align-items: center;
        background: var(--card-background-color, rgba(8,18,28,0.92));
        color: var(--primary-text-color);
        border-top: 1px solid var(--divider-color, rgba(0,212,255,0.18));
        padding: 6px 10px;
        box-sizing: border-box;
        gap: 8px;
        min-height: 80px;
      }
      .ec-preview--expanded .ec-expanded-bottom-bar {
        flex: 0 0 auto;
        z-index: 10;
      }
      .ec-preview--expanded .ec-canvas-area {
        flex: 0 0 auto;
        margin: auto;
      }
      .ec-bottom-bar-left {
        display: flex;
        flex-direction: row;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }
      .ec-bottom-bar-center {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        padding: 0 8px;
        gap: 2px;
      }
      .ec-hint-text {
        font-size: 12px;
        

        color: var(--secondary-text-color, #7fa7bd);
        font-style: italic;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .ec-quick-panel {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 10px;
        align-items: center;
        justify-content: center;
      }
      .ec-quick-field {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 2px;
      }
      .ec-quick-field span {
        font-size: 14px;
        color: var(--primary-text-color, #c8e0ec);
        white-space: nowrap;
      }
      .ec-quick-field input {
        width: 6em;
      }
      .ec-side-close {
        background: var(--mce-primary);
        border: none;
        border-radius: 6px;
        

        color: var(--text-primary-color, #fff);
        font-size: 14px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
      }
      .ec-btn-done {
        background: var(--mce-primary);
        border: none;
        border-radius: 6px;
        color: var(--text-primary-color, #fff);
        font-size: 14px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
      }
      .ec-bar-top .ec-expanded-bottom-bar {
        border-top: none;
        border-bottom: 1px solid var(--divider-color, rgba(0,212,255,0.18));
      }
      .ec-bar-top.ec-preview--expanded .ec-expanded-bottom-bar {
        order: -1;
      }

       
      .ec-grid-overlay {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 0;
      }
      .ec-grid-dot {
        position: absolute;
        width: 4px;
        height: 4px;
        margin: -2px 0 0 -2px;
        border-radius: 50%;
        background: rgba(0,212,255,0.35);
      }

       
      .ec-handles {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .ec-handle {
        position: absolute;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.35);
        border: 1px solid rgba(255, 255, 255, 0.8);
        transform: translate(-50%, -50%);
        pointer-events: auto;
        cursor: grab;
        box-sizing: border-box;
        transition: width 0.1s, height 0.1s, background 0.1s;
      }
      .ec-handle.selected {
        width: 12px;
        height: 12px;
        background: transparent;
        border: 2px solid var(--mce-accent);
        box-shadow: 0 0 4px var(--mce-accent);
      }
      .ec-handle.multi {
        width: 12px;
        height: 12px;
        background: transparent;
        border: 2px dashed var(--mce-accent);
        opacity: 0.7;
      }
      .ec-handle:active {
        cursor: grabbing;
      }
      .ec-handle.grouped::after {
        content: '';
        position: absolute;
        inset: -3px;
        border-radius: 50%;
        border: 1px dotted rgba(255, 200, 0, 0.8);
        pointer-events: none;
      }
      .ec-card-ov,
      .ec-emb-ov {
        position: absolute;
        box-sizing: border-box;
        pointer-events: auto;
        cursor: grab;
        background: transparent;
        border-radius: 4px;
      }
      .ec-card-ov:hover,
      .ec-emb-ov:hover {
        box-shadow: inset 0 0 0 1px rgba(0, 212, 255, 0.35);
      }
      .ec-card-ov:active,
      .ec-emb-ov:active {
        cursor: grabbing;
      }
      .ec-card-ov.selected,
      .ec-emb-ov.selected {
        box-shadow: inset 0 0 0 2px var(--mce-accent);
      }
      .ec-card-ov.multi,
      .ec-emb-ov.multi {
        outline: 2px dashed var(--mce-accent);
        outline-offset: -2px;
      }
      .ec-card-ov.grouped,
      .ec-emb-ov.grouped {
        outline: 1px dotted rgba(255, 200, 0, 0.8);
        outline-offset: -1px;
      }
      .ec-emb-handle.grouped::after {
        content: '';
        position: absolute;
        inset: -3px;
        border-radius: 3px;
        border: 1px dotted rgba(255, 200, 0, 0.8);
        pointer-events: none;
      }
      .ec-emb-handle {
        position: absolute;
        width: 12px;
        height: 12px;
        border-radius: 3px;
        background: rgba(180, 100, 255, 0.35);
        border: 1px solid rgba(200, 130, 255, 0.85);
        transform: translate(-50%, -50%) rotate(45deg);
        pointer-events: auto;
        cursor: grab;
        box-sizing: border-box;
        transition: width 0.1s, height 0.1s, background 0.1s;
      }
      .ec-emb-handle.selected {
        width: 14px;
        height: 14px;
        background: transparent;
        border: 2px solid #c87aff;
        box-shadow: 0 0 6px rgba(180, 100, 255, 0.7);
      }
      .ec-emb-handle:active { cursor: grabbing; }

       
      .ec-controls {
        background: var(--card-background-color, #070f1a);
        padding: 0;
        border-top: 1px solid var(--divider-color, rgba(0,212,255,0.1));
      }
      .ec-preview--expanded .ec-controls {
        position: absolute;
        bottom: 41px;
        left: 0;
        right: 0;
        max-height: 45%;
        overflow-y: auto;
        z-index: 10;
        border-top: 1px solid var(--divider-color, rgba(0,212,255,0.3));
      }
      .ec-section {
        border-bottom: 1px solid var(--divider-color, rgba(255,255,255,0.05));
        padding: 10px 14px;
      }
      .ec-section--fields {
        background: var(--primary-background-color, rgba(0,180,220,0.07));
        min-height: 500px;
      }
      .ec-section:not(.ec-section--fields) + .ec-section--fields {
        margin-top: 8px;
        border-top: 1px solid var(--divider-color, rgba(0,212,255,0.18));
      }
      .ec-tu-chip {
        display: inline-flex;
        align-items: center;
        padding: 2px 9px;
        border-radius: 10px;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.04em;
        white-space: nowrap;
      }
      .ec-tu-chip--label {
        background: color-mix(in srgb, var(--mce-chip-label) 12%, transparent);
        color: var(--mce-chip-label-fg);
        border: 1px solid color-mix(in srgb, var(--mce-chip-label) 28%, transparent);
      }
      .ec-tu-chip--value {
        background: color-mix(in srgb, var(--mce-chip-value) 9%, transparent);
        color: var(--mce-chip-value-fg);
        border: 1px solid color-mix(in srgb, var(--mce-chip-value) 18%, transparent);
      }
      .ec-tu-chip--newline {
        background: color-mix(in srgb, var(--mce-chip-newline) 9%, transparent);
        color: var(--mce-chip-newline-fg);
        border: 1px solid color-mix(in srgb, var(--mce-chip-newline) 22%, transparent);
      }
      .ec-section-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      .ec-section-title {
        font-size: 13px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--secondary-text-color, #4a8aaa);
      }
      .ec-hint { font-size: 11px; color: var(--secondary-text-color, #777); margin: -6px 0 8px; line-height: 1.4; }
      .ec-subsection-title {
        font-size: 12px;
        font-weight: 700;
        color: var(--secondary-text-color, #5aadcc);
        margin: 18px 0 8px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 10px 0 0;
        border-top: 1px solid var(--divider-color, rgba(255,255,255,0.08));
      }
      .ec-section > .ec-subsection-title:first-child {
        border-top: none;
        padding-top: 0;
        margin-top: 4px;
      }
      

      .ec-slider-pt .ec-subsection-title {
        border-top: none;
        padding-top: 0;
      }
      .ec-slider-pt + .ec-slider-pt {
        border-top: 1px solid var(--divider-color, rgba(255,255,255,0.08));
        margin-top: 12px;
        padding-top: 16px;
      }
      .ec-subsection-title--minor {
        font-size: 11.5px;
        font-weight: 600;
        font-style: normal;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        margin: 12px 0 5px;
        color: var(--secondary-text-color, #4a8aaa);
        padding: 0;
        border: none;
      }

       
      

      .ec-nav-toolbar {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 2px;
        padding: 4px 14px 0;
        background: var(--card-background-color, #070f1a);
      }
      

      .ec-help-hint {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        margin-left: 2px;
        border-radius: 50%;
        border: 1px solid color-mix(in srgb, var(--mce-accent) 45%, transparent);
        background: color-mix(in srgb, var(--mce-accent) 10%, transparent);
        color: var(--mce-accent);
        font-size: 13px;
        font-weight: 700;
        line-height: 1;
        cursor: help;
        user-select: none;
      }
      .ec-help-hint:hover {
        background: color-mix(in srgb, var(--mce-accent) 20%, transparent);
      }
      .ec-breadcrumb {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 2px;
        padding: 4px 14px 8px;
        font-size: 12px;
        border-bottom: 1px solid var(--divider-color, rgba(0,212,255,0.12));
        background: var(--card-background-color, #070f1a);
      }
      .ec-crumb {
        border: none;
        background: transparent;
        cursor: pointer;
        padding: 3px 6px;
        border-radius: 4px;
        font-weight: 500;
        font-size: 12px;
        font-family: inherit;
        color: var(--secondary-text-color, #6b93a8);
        

        max-width: 9em;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ec-crumb:hover {
        background: var(--mce-primary-fill-strong);
      }
      .ec-crumb--active { color: var(--mce-accent); }
      .ec-crumb-sep {
        --mdc-icon-size: 14px;
        color: var(--secondary-text-color, #567788);
        opacity: 0.7;
      }
      .ec-undo-btn {
        border: none;
        background: transparent;
        cursor: pointer;
        padding: 3px 6px;
        border-radius: 4px;
        color: var(--secondary-text-color, #6b93a8);
        --mdc-icon-size: 16px;
        display: flex;
        align-items: center;
      }
      .ec-undo-btn:hover:not(:disabled) {
        background: var(--mce-primary-fill-strong);
        color: var(--mce-primary);
      }
      .ec-undo-btn:disabled { opacity: 0.35; cursor: default; }
      .ec-undo-toast {
        position: fixed;
        left: 50%;
        bottom: 20px;
        transform: translateX(-50%);
        z-index: 30;
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 10px 16px;
        border-radius: 6px;
        background: var(--card-background-color, #0a1420);
        border: 1px solid var(--divider-color, rgba(0,212,255,0.25));
        box-shadow: 0 4px 16px rgba(0,0,0,0.45);
        color: var(--primary-text-color, #dceaf2);
        font-size: 13px;
      }
      .ec-undo-toast-btn {
        border: none;
        background: transparent;
        cursor: pointer;
        padding: 3px 6px;
        border-radius: 4px;
        

        font-weight: 600;
        font-size: 13px;
        font-family: inherit;
        text-transform: uppercase;
        letter-spacing: 0.03em;
        color: var(--mce-primary);
      }
      .ec-undo-toast-btn:hover:not(:disabled) {
        background: var(--mce-primary-fill-strong);
      }
      .ec-undo-toast-btn:disabled { opacity: 0.35; cursor: default; }

      .ec-nav-shell { display: flex; min-height: 50vh; }
      .ec-nav-rail {
        flex: 0 0 76px;
        display: flex;
        flex-direction: column;
        padding: 6px 0;
        gap: 2px;
        border-right: 1px solid var(--divider-color, rgba(0,212,255,0.12));
        background: var(--secondary-background-color, #0a1420);
      }
      .ec-nav-tab {
        position: relative;
        border: none;
        background: transparent;
        cursor: pointer;
        padding: 12px 4px 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        font-weight: 500;
        color: var(--secondary-text-color, #6b93a8);
      }
      .ec-nav-tab ha-icon { --mdc-icon-size: 21px; }
      .ec-nav-tab:hover { background: var(--mce-primary-fill); }
      .ec-nav-tab.active { color: var(--mce-accent); }
      .ec-nav-tab.active::before {
        content: '';
        position: absolute;
        left: 0; top: 6px; bottom: 6px;
        width: 3px;
        background: var(--mce-accent);
        border-radius: 0 3px 3px 0;
      }
      .ec-nav-list { flex: 1; min-width: 0; overflow-y: auto; padding: 4px 0; }
      

      .ec-nav-tab-badge {
        position: absolute;
        top: 5px;
        right: 9px;
        min-width: 16px;
        height: 16px;
        line-height: 14px;
        font-size: 10px;
        background: var(--error-color, #db4437);
        border-color: var(--error-color, #db4437);
        color: var(--text-primary-color, #fff);
      }

      .ec-nav-item {
        width: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 11px 14px;
        border: none;
        border-bottom: 1px solid var(--divider-color, rgba(255,255,255,0.05));
        background: transparent;
        cursor: pointer;
        text-align: left;
        color: inherit;
        font: inherit;
      }
      .ec-nav-item:hover { background: var(--mce-primary-fill); }
      .ec-nav-item-icon { --mdc-icon-size: 20px; color: var(--mce-primary); flex: 0 0 auto; }
      .ec-nav-item-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
      .ec-nav-item-label { font-size: 13.5px; font-weight: 500; color: var(--primary-text-color, #dceaf2); }
      .ec-nav-item-hint {
        font-size: 11px;
        color: var(--secondary-text-color, #6b93a8);
        margin-top: 1px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ec-nav-item-chevron { --mdc-icon-size: 18px; color: var(--secondary-text-color, #567788); flex: 0 0 auto; }

       
      .ec-nav-card {
        width: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 12px;
        margin-bottom: 7px;
        border: 1px solid var(--divider-color, rgba(0,212,255,0.14));
        border-radius: 9px;
        background: transparent;
        cursor: pointer;
        text-align: left;
        color: inherit;
        font: inherit;
        transition: background 0.15s, border-color 0.15s;
      }
      .ec-nav-card:hover {
        background: var(--mce-primary-fill);
        border-color: var(--mce-primary);
      }
      .ec-nav-card-icon { --mdc-icon-size: 20px; color: var(--mce-primary); flex: 0 0 auto; }
      .ec-nav-card-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
      .ec-nav-card-label { font-size: 13.5px; font-weight: 500; color: var(--primary-text-color, #dceaf2); }
      .ec-nav-card-hint {
        font-size: 11px;
        color: var(--secondary-text-color, #6b93a8);
        margin-top: 1px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ec-nav-card-chevron { --mdc-icon-size: 18px; color: var(--secondary-text-color, #567788); flex: 0 0 auto; }

       
       
      .ec-nav-card-badge, .ec-nav-tab-badge {
        flex: 0 0 auto;
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        box-sizing: border-box;
        border-radius: 9px;
        background: var(--mce-accent-fill);
        border: 1px solid var(--mce-accent);
        color: var(--mce-accent);
        font-size: 11px;
        font-weight: 600;
        line-height: 16px;
        text-align: center;
        font-variant-numeric: tabular-nums;
      }
       
      .ec-health-group-title { display: flex; align-items: center; gap: 7px; }
      .ec-health-group-title ha-icon { --mdc-icon-size: 17px; color: var(--mce-primary); }
      

      .ec-health-row {
        border: 1px solid var(--divider-color, rgba(0,212,255,0.14));
        border-radius: 9px;
        margin-bottom: 7px;
        overflow: hidden;
      }
      .ec-health-row-body {
        width: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: flex-start;
        gap: 11px;
        padding: 12px 12px 8px;
        border: none;
        background: transparent;
        cursor: pointer;
        text-align: left;
        color: inherit;
        font: inherit;
        transition: background 0.15s;
      }
      .ec-health-row-body:hover:not([disabled]) { background: var(--mce-primary-fill); }
      .ec-health-row-body[disabled] { cursor: default; }
      

      .ec-health-row .ec-nav-card-label { white-space: normal; line-height: 1.35; }
      .ec-health-row--error .ec-nav-card-icon { color: var(--error-color, #db4437); }
      .ec-health-row--info .ec-nav-card-icon { color: var(--secondary-text-color, #6b93a8); }
      .ec-health-row--ignored { opacity: 0.6; }
      .ec-health-row-where {
        font-size: 11px;
        color: var(--secondary-text-color, #6b93a8);
        margin-top: 3px;
      }
      .ec-health-row-actions {
        display: flex;
        justify-content: flex-end;
        gap: 6px;
        padding: 0 10px 9px;
      }
      .ec-health-btn {
        border: 1px solid var(--divider-color, rgba(0,212,255,0.18));
        border-radius: 6px;
        background: transparent;
        color: var(--secondary-text-color, #6b93a8);
        font: inherit;
        font-size: 11.5px;
        line-height: 1.6;
        padding: 2px 10px;
        cursor: pointer;
        transition: color 0.12s, border-color 0.12s, background 0.12s;
      }
      .ec-health-btn:hover { border-color: var(--mce-primary); color: var(--mce-primary); }
      

      .ec-health-btn-remove {
        color: var(--mce-action-remove);
        border-color: color-mix(in srgb, var(--mce-action-remove) 45%, transparent);
      }
      .ec-health-btn-remove:hover {
        color: var(--mce-action-remove);
        border-color: var(--mce-action-remove);
        background: color-mix(in srgb, var(--mce-action-remove) 12%, transparent);
      }
      .ec-health-ignored { margin-top: 14px; }
      .ec-health-ignored-toggle {
        display: flex;
        align-items: center;
        gap: 5px;
        border: none;
        background: transparent;
        cursor: pointer;
        color: var(--secondary-text-color, #6b93a8);
        font: inherit;
        font-size: 12px;
        padding: 4px 0 8px;
      }
      .ec-health-ignored-toggle ha-icon { --mdc-icon-size: 16px; }
      .ec-health-ignored-toggle:hover { color: var(--mce-primary); }
      .ec-health-coverage { margin-top: 10px; }

      .ec-clear-overrides {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        flex-wrap: wrap;
        margin: 0 0 12px;
        padding: 8px 10px;
        border: 1px solid var(--divider-color, rgba(0,212,255,0.14));
        border-radius: 9px;
      }
      .ec-clear-overrides-count { font-size: 12px; color: var(--secondary-text-color, #6b93a8); }
      .ec-btn-clear-overrides {
        padding: 5px 11px;
        border-radius: 7px;
        border: 1px solid var(--mce-accent);
        background: var(--mce-accent-fill);
        color: var(--mce-accent);
        font: inherit;
        font-size: 12px;
        cursor: pointer;
      }
      .ec-btn-clear-overrides:hover { background: var(--mce-accent); color: var(--card-background-color, #070f1a); }

       
      .ec-nav-search { width: 100%; box-sizing: border-box; margin: 0 0 8px; }
      .ec-search-results { min-height: 50vh; }
      .ec-search-result.active {
        background: var(--mce-accent-fill);
        border-color: var(--mce-accent);
      }
      .ec-search-result-ctx {
        font-size: 10px;
        color: var(--secondary-text-color, #6b93a8);
        opacity: 0.8;
        margin-top: 1px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ec-search-more {
        font-size: 11px;
        color: var(--secondary-text-color, #6b93a8);
        text-align: center;
        margin: 6px 0 0;
      }

      .ec-panel-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-bottom: 1px solid var(--divider-color, rgba(0,212,255,0.12));
        background: var(--secondary-background-color, #0a1420);
      }
      .ec-panel-back {
        display: flex;
        align-items: center;
        gap: 4px;
        border: none;
        background: transparent;
        cursor: pointer;
        padding: 6px 8px 6px 4px;
        border-radius: 6px;
        color: var(--primary-text-color, #dceaf2);
        font-size: 12.5px;
        font-weight: 500;
      }
      .ec-panel-back:hover { background: var(--mce-primary-fill); }
      .ec-panel-back ha-icon { --mdc-icon-size: 18px; color: var(--mce-accent); }
      .ec-panel-header-icon { --mdc-icon-size: 18px; color: var(--mce-primary); }
      .ec-panel-header-title { font-size: 14px; font-weight: 600; color: var(--primary-text-color, #dceaf2); }
      .ec-panel-header-spacer { flex: 1; }
      .ec-panel-body { flex: 1; min-height: 50vh; overflow-y: auto; padding: 10px 14px 16px; }
      .ec-panel-desc {
        font-size: 12px;
        line-height: 1.5;
        color: var(--secondary-text-color, #6b93a8);
        margin: 0 0 10px;
      }

       
      .ec-list-row {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 5px 8px;
        border-radius: 6px;
        cursor: pointer;
        margin-bottom: 2px;
        border: 1px solid transparent;
        transition: background 0.15s, border-color 0.15s;
      }
      .ec-list-row:hover {
        background: var(--mce-primary-fill);
        border-color: var(--mce-primary-line);
      }
      .ec-list-row.selected {
        background: var(--mce-accent-fill-strong);
        border-color: var(--mce-accent);
      }
      .ec-list-row.multi {
        background: var(--mce-accent-fill);
        border: 1px dashed var(--mce-accent);
      }
      .ec-list-label {
        flex: 1;
        font-size: 15px;
        color: var(--primary-text-color, #b8d4e0);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

       
      .ec-item-card {
        width: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 11px 12px;
        margin-bottom: 6px;
        border: 1px solid var(--divider-color, rgba(0,212,255,0.14));
        border-radius: 9px;
        background: transparent;
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s;
        

        user-select: none;
        -webkit-user-select: none;
      }
      .ec-item-card:hover {
        background: var(--mce-primary-fill);
        border-color: var(--mce-primary);
      }
      .ec-item-card.selected {
        background: var(--mce-accent-fill-strong);
        border-color: var(--mce-accent);
      }
      .ec-item-card.multi {
        background: var(--mce-accent-fill);
        border-style: dashed;
        border-color: var(--mce-accent);
      }
      .ec-item-card.ec-dragging { opacity: 0.4; }
      .ec-item-card:focus-visible, .ec-nav-card:focus-visible, .ec-nav-item:focus-visible,
      .ec-list-row:focus-visible,
      .ec-crumb:focus-visible, .ec-nav-tab:focus-visible, .ec-panel-back:focus-visible {
        outline: 2px solid var(--mce-accent);
        outline-offset: -2px;
      }
      .ec-item-card-icon { --mdc-icon-size: 20px; color: var(--mce-primary); flex: 0 0 auto; }
      .ec-item-card-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
      .ec-item-card-label {
        font-size: 13.5px;
        font-weight: 500;
        color: var(--primary-text-color, #dceaf2);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ec-item-card-sub {
        font-size: 11px;
        color: var(--secondary-text-color, #6b93a8);
        margin-top: 1px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .ec-item-card-actions { display: flex; align-items: center; gap: 2px; flex: 0 0 auto; }
      .ec-item-card-chevron { --mdc-icon-size: 18px; color: var(--secondary-text-color, #567788); flex: 0 0 auto; }

       
      .ec-list-filter { width: 100%; box-sizing: border-box; margin: 0 0 8px; }
      .ec-panel-header-title:focus { outline: none; }
      .ec-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 7px;
        min-height: 30px;
      }
      .ec-label {
        flex: 0 0 130px;
        font-size: 13px;
        font-weight: 500;
        color: var(--primary-text-color, #dceaf2);
        letter-spacing: 0.01em;
      }
      .ec-control { flex: 1; min-width: 0; }
      

      .ec-label--hinted {
        cursor: help;
        text-decoration: underline dotted
          color-mix(in srgb, var(--primary-text-color, #dceaf2) 35%, transparent);
        text-underline-offset: 3px;
      }
      .ec-label--hinted:hover {
        text-decoration-color: var(--mce-primary, var(--primary-color));
      }
      .ec-label-hint { display: block; font-size: 10.5px; font-weight: 400; color: var(--secondary-text-color, #6b93a8); margin-top: 1px; }
      .ec-opt-control { display: flex; align-items: center; gap: 10px; }
      .ec-opt-inherit {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        

        color: var(--secondary-text-color, #7fa7bd);
        white-space: nowrap;
        cursor: pointer;
        flex: 0 0 auto;
      }
      .ec-opt-target { flex: 1; min-width: 0; }
      .ec-opt-target--disabled { opacity: 0.4; pointer-events: none; }
      .ec-mode-tiles { display: flex; gap: 8px; margin: 6px 0 14px; }
      .ec-mode-tile {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 12px;
        border-radius: 8px;
        border: 1px solid var(--divider-color, rgba(0,212,255,0.14));
        background: transparent;
        color: var(--secondary-text-color, #6b93a8);
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
      }
      .ec-mode-tile ha-icon { --mdc-icon-size: 24px; }
      .ec-mode-tile.active {
        border-color: var(--mce-accent);
        background: var(--mce-accent-fill-strong);
        color: var(--mce-accent);
      }
      .ec-row:has(ha-entity-picker) {
        flex-direction: column;
        align-items: stretch;
        min-height: unset;
      }
      .ec-row:has(ha-entity-picker) .ec-label {
        flex: none;
        margin-bottom: 2px;
      }
      .ec-input, .ec-select {
        width: 100%;
        box-sizing: border-box;
        background: var(--mce-field-bg);
        border: 1px solid var(--mce-field-border-color);
        border-radius: var(--mce-field-radius);
        padding: 5px 8px;
        font-size: var(--mce-field-font-size);
        color: var(--mce-field-text);
        outline: none;
        transition: border-color 0.15s, box-shadow 0.15s;
        -webkit-appearance: none;
        appearance: none;
      }
      .ec-input:focus, .ec-select:focus {
        border-color: var(--mce-field-focus-color);
        box-shadow: 0 0 0 2px var(--mce-accent-fill-strong);
      }
      .ec-input-num { width: 6em; }

      
--md-*/--mdc-* it maps to
              internally, since those are declared in the component's own :host
              and an inherited value loses to that (and HA is migrating off
              Material, so those names are disappearing);
           3. the Material row itself is 3-5 boundaries deep and reachable only
              by the stylesheet _injectPickerStyle pushes into its shadow root.
         .ec-attr-picker is the attribute <ha-selector> and .ec-nav-picker the
         navigate action's; both are two boundaries above their picker, so
         ::part(field) cannot reach them — properties and the injected style do. */
      ha-entity-picker, ha-icon-picker, ha-service-picker, .ec-attr-picker, .ec-nav-picker {
        display: block;
        width: 100%;
        box-sizing: border-box;
        border: 1px solid var(--mce-field-border-color);
        border-radius: var(--mce-field-radius);
        transition: border-color 0.15s;
        --ha-color-form-background: var(--mce-field-bg);
        --ha-color-form-background-disabled: var(--mce-field-bg);
        --ha-border-radius-sm: var(--mce-field-radius);
        --ha-combo-box-item-min-height: var(--mce-field-h);
        --mdc-icon-size: 20px;
      }
      ha-entity-picker:hover, ha-icon-picker:hover,
      ha-service-picker:hover, .ec-attr-picker:hover, .ec-nav-picker:hover {
        border-color: var(--mce-field-focus-color);
      }
      ha-entity-picker::part(field), ha-icon-picker::part(field),
      ha-service-picker::part(field) { min-height: var(--mce-field-h); }

      

      .ec-css-input {
        font-family: monospace;
        font-size: 12px;
        line-height: 1.4;
        resize: vertical;
        min-height: 38px;
        white-space: pre;
      }
      .ec-css-invalid {
        border-color: var(--error-color, #db4437) !important;
        color: var(--error-color, #db4437) !important;
      }

      

      .ec-num-wrap { display: inline-flex; align-items: center; gap: 3px; vertical-align: middle; }
      

      .ec-num-wrap input[type='number'] { -moz-appearance: textfield; }
      .ec-num-wrap input[type='number']::-webkit-inner-spin-button,
      .ec-num-wrap input[type='number']::-webkit-outer-spin-button {
        -webkit-appearance: none;
        appearance: none;
        margin: 0;
      }
      .ec-num-wrap .ec-input-num { width: 6em; }
      .ec-num-wrap .ec-input-num-small { width: 3em; }
      .ec-num-steppers { display: flex; gap: 2px; flex: 0 0 auto; }
      .ec-num-step {
        width: 20px;
        height: 24px;
        padding: 0;
        border: 1px solid var(--divider-color, rgba(0,212,255,0.2));
        border-radius: 5px;
        background: var(--mce-primary);
        color: var(--text-primary-color, #fff);
        font-size: 14px;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      

      .ec-select {
        padding-right: 26px;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b93a8' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 6px center;
        background-size: 16px;
      }

      

      input[type="checkbox"] {
        -webkit-appearance: none;
        appearance: none;
        width: 38px;
        height: 21px;
        flex: 0 0 auto;
        border-radius: 11px;
        background: color-mix(in srgb, var(--primary-text-color, #ffffff) 12%, transparent);
        border: 1px solid var(--divider-color, rgba(0,212,255,0.2));
        position: relative;
        cursor: pointer;
        outline: none;
        vertical-align: middle;
        transition: background 0.15s, border-color 0.15s;
      }
      input[type="checkbox"]::before {
        content: '';
        position: absolute;
        top: 1px;
        left: 1px;
        width: 17px;
        height: 17px;
        border-radius: 50%;
        background: var(--card-background-color, #f5f8fa);
        box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        transition: transform 0.15s, background 0.15s;
      }
      input[type="checkbox"]:checked {
        background: var(--mce-accent);
        border-color: var(--mce-accent);
      }
      input[type="checkbox"]:checked::before {
        transform: translateX(17px);
        background: var(--text-primary-color, #fff);
      }
      input[type="checkbox"]:focus-visible {
        box-shadow: 0 0 0 2px var(--mce-accent-fill-strong);
      }

       
      .ec-dual-range { display: flex; align-items: center; gap: 8px; width: 100%; }
      .ec-dual-range-label { font-size: 11px; color: var(--secondary-text-color, #aaa); white-space: nowrap; }
      .ec-dual-range-track { position: relative; flex: 1; height: 22px; }
      .ec-dual-range-track input[type=range] {
        position: absolute; top: 3px; left: 0; width: 100%; margin: 0;
        -webkit-appearance: none; appearance: none;
        background: transparent; pointer-events: none; height: 16px;
      }
      .ec-dual-range-track input[type=range]::-webkit-slider-runnable-track {
        background: var(--divider-color, rgba(255,255,255,0.15)); border-radius: 4px; height: 4px;
      }
      .ec-dual-range-track input[type=range]::-moz-range-track {
        background: var(--divider-color, rgba(255,255,255,0.15)); border-radius: 4px; height: 4px;
      }
      .ec-dual-range-track input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none; pointer-events: all; cursor: pointer;
        width: 16px; height: 16px; border-radius: 50%;
        background: var(--mce-primary); border: 2px solid rgba(0,0,0,0.35);
        margin-top: -6px;
      }
      .ec-dual-range-track input[type=range]::-moz-range-thumb {
        pointer-events: all; cursor: pointer;
        width: 14px; height: 14px; border-radius: 50%;
        background: var(--mce-primary); border: 2px solid rgba(0,0,0,0.35);
      }

       
      .ec-cp-wrap { position: relative; }
      .ec-color-row { display: flex; align-items: center; gap: 6px; }
      .ec-cp-alpha { padding: 6px 8px 2px; }
      .ec-cp-alpha-label {
        display: block; font-size: 11px; margin-bottom: 3px;
        color: var(--secondary-text-color, #aaa);
      }
      .ec-cp-alpha .ec-opacity-row input[type=range] { max-width: none; }
      .ec-opacity-row { display: flex; align-items: center; gap: 6px; }
      .ec-opacity-row input[type=range] { flex: 1; min-width: 80px; max-width: 140px; }
      .ec-opacity-val { min-width: 36px; text-align: right; font-size: 12px; color: var(--secondary-text-color, #aaa); }
      .ec-color-swatch-btn {
        width: 36px;
        height: 28px;
        flex-shrink: 0;
        border: 1px solid var(--divider-color, rgba(0,212,255,0.3));
        border-radius: 6px;
        cursor: pointer;
        padding: 0;
        

        background-image: linear-gradient(45deg, var(--mce-checker-sq) 25%, transparent 25%),
          linear-gradient(-45deg, var(--mce-checker-sq) 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, var(--mce-checker-sq) 75%),
          linear-gradient(-45deg, transparent 75%, var(--mce-checker-sq) 75%);
        background-size: 8px 8px;
        background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
        background-color: var(--mce-checker);
        position: relative;
      }
      

      .ec-color-swatch-btn::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: var(--mce-swatch, transparent);
      }
      .ec-color-text {
        flex: 1;
        min-width: 0;
        max-width: 6em;
        font-family: monospace;
        font-size: 12px;
        background: var(--secondary-background-color, rgba(255,255,255,0.06));
        border: 1px solid var(--divider-color, rgba(255,255,255,0.15));
        border-radius: 4px;
        color: var(--primary-text-color, #fff);
        padding: 3px 6px;
        height: 28px;
        box-sizing: border-box;
      }
      .ec-color-text::placeholder { color: var(--secondary-text-color, rgba(255,255,255,0.3)); }
      .ec-cp-backdrop {
        position: fixed;
        inset: 0;
        z-index: 9998;
      }
      .ec-cp-popup {
        

        position: fixed;
        z-index: 9999;
        background: var(--card-background-color, #1a2332);
        border: 1px solid var(--divider-color, rgba(0,212,255,0.3));
        border-radius: 10px;
        padding: 10px;
        box-shadow: 0 8px 32px var(--mce-scrim);
        width: 220px;
        max-width: calc(100vw - 24px);
        max-height: calc(100vh - 24px);
        overflow-y: auto;
      }
       
      .ec-cp-popup:focus { outline: none; }
       
      .ec-cp-grad-toggle {
        display: inline-flex; align-items: center; gap: 4px;
        flex: 0 0 auto; white-space: nowrap; cursor: pointer;
        font-size: 11px; letter-spacing: 0.02em;
        color: var(--secondary-text-color, #aaa);
      }
      .ec-cp-grad-toggle:hover { color: var(--primary-text-color, #ddd); }
      .ec-cp-main { width: 100%; }
       
      .ec-cp-modes {
        display: flex; margin-bottom: 8px; border-radius: 6px; overflow: hidden;
        border: 1px solid var(--divider-color, rgba(255,255,255,0.15));
      }
      .ec-cp-mode {
        flex: 1 1 0; padding: 5px 0; font-size: 11px; cursor: pointer;
        background: transparent; border: none; letter-spacing: 0.04em;
        color: var(--secondary-text-color, #aaa);
      }
      .ec-cp-mode + .ec-cp-mode { border-left: 1px solid var(--divider-color, rgba(255,255,255,0.15)); }
      .ec-cp-mode:hover { background: var(--mce-fill-subtle); color: var(--primary-text-color, #ddd); }
      .ec-cp-mode.active { background: var(--mce-accent-fill-strong); color: var(--mce-accent); font-weight: 600; }
      .ec-cp-popup hex-color-picker {
        width: 100%;
        --cp-border-radius: 6px;
        --cp-color-focus-color: var(--mce-accent);
      }
      .ec-cp-rgb {
        display: flex;
        gap: 6px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--divider-color, rgba(255,255,255,0.08));
      }
      .ec-cp-rgb-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        font-size: 10px;
        color: var(--secondary-text-color, #aaa);
        gap: 3px;
      }
      .ec-cp-rgb-input {
        width: 100%;
        text-align: center;
        background: var(--mce-field-bg);
        border: 1px solid var(--mce-field-border-color);
        border-radius: 4px;
        color: var(--mce-field-text);
        font-size: 11px;
        padding: 3px 0;
        -moz-appearance: textfield;
      }
      .ec-cp-rgb-input::-webkit-inner-spin-button,
      .ec-cp-rgb-input::-webkit-outer-spin-button { opacity: 0.4; }
      .ec-cp-presets {
        display: flex;
        flex-wrap: wrap;
        gap: 5px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid var(--divider-color, rgba(255,255,255,0.08));
      }
      .ec-cp-preset {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 1px solid var(--divider-color, rgba(255,255,255,0.25));
        cursor: pointer;
        padding: 0;
        transition: transform 0.1s, border-color 0.1s;
      }
      .ec-cp-preset:hover { transform: scale(1.25); border-color: var(--primary-text-color, rgba(255,255,255,0.7)); }

       
      .ec-cp-vars { width: 100%; display: flex; flex-direction: column; }
      .ec-cp-vars-title {
        font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em;
        color: var(--secondary-text-color, #888); padding: 0 2px 4px;
      }
      .ec-cp-vars-hint { font-size: 10px; color: var(--secondary-text-color, #888); line-height: 1.4; padding: 0 2px 8px; }
      .ec-cp-vars-list {
        max-height: 260px;
        overflow-y: auto; display: flex; flex-direction: column; gap: 2px;
      }
      .ec-cp-vars-list::-webkit-scrollbar { width: 8px; }
      .ec-cp-vars-list::-webkit-scrollbar-thumb { background: var(--divider-color, rgba(255,255,255,0.18)); border-radius: 4px; }
      .ec-cp-var-row {
        display: flex; align-items: center; gap: 8px; width: 100%; text-align: left;
        background: transparent; border: none; border-radius: 5px; cursor: pointer;
        padding: 5px 6px; color: var(--primary-text-color); font-size: 12px;
      }
      .ec-cp-var-row:hover { background: var(--mce-fill-subtle); }
      .ec-cp-var-chip {
        width: 18px; height: 18px; flex: 0 0 auto; border-radius: 4px;
        border: 1px solid var(--divider-color, rgba(255,255,255,0.3)); box-sizing: border-box;
      }
      .ec-cp-var-name { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .ec-cp-vars-sep { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--secondary-text-color, #888); padding: 6px 6px 2px; }

       
      .ec-flow-paths-overlay {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: visible;
        z-index: 2;
      }
      

      .ec-flow-hit { cursor: pointer; }
      .ec-flow-name-input {
        font-size: 12px;
        padding: 3px 8px;
        border: 1px solid var(--mce-field-border-color);
        border-radius: 4px;
        background: var(--mce-field-bg);
        color: var(--mce-field-text);
        width: 120px;
        outline: none;
      }
      .ec-flow-name-input:focus {
        border-color: var(--mce-accent);
        box-shadow: 0 0 6px var(--mce-accent-fill-strong);
      }
      .ec-btn-add {
        display: flex;
        align-items: center;
        gap: 4px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        padding: 6px 13px;
         
        margin: 8px 0 6px;
        font-size: 12.5px;
        font-weight: 600;
        background: var(--mce-primary);
        color: var(--text-primary-color, #fff);
      }
      .ec-btn-remove {
        font-size: 13px;
        padding: 2px 6px;
        border: none;
        border-radius: 4px;
        background: transparent;
        color: color-mix(in srgb, var(--mce-action-remove) 60%, transparent);
        cursor: pointer;
        line-height: 1;
        transition: color 0.12s, background 0.12s;
        }
      .ec-btn-remove:hover {
        background: color-mix(in srgb, var(--mce-action-remove) 12%, transparent);
        color: var(--mce-action-remove);
      }
      .ec-btn-copy, .ec-btn-paste, .ec-btn-dup {
        font-size: 14px;
        padding: 2px 5px;
        border: none;
        border-radius: 4px;
        background: transparent;
        cursor: pointer;
        line-height: 1;
        transition: color 0.12s, background 0.12s;
      }
      .ec-btn-copy, .ec-btn-dup { color: color-mix(in srgb, var(--mce-action-copy) 55%, transparent); }
      .ec-btn-copy:hover, .ec-btn-dup:hover {
        background: color-mix(in srgb, var(--mce-action-copy) 12%, transparent);
        color: var(--mce-action-copy);
      }
      .ec-btn-paste { color: color-mix(in srgb, var(--mce-action-paste) 70%, transparent); }
      .ec-btn-paste:hover {
        background: color-mix(in srgb, var(--mce-action-paste) 12%, transparent);
        color: var(--mce-action-paste);
      }
      .ec-stat-yaml {
        margin: 6px 0 4px;
        border: 1px solid var(--mce-primary-line);
        border-radius: 6px;
        overflow: hidden;
      }
      .ec-stat-yaml-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 8px;
        background: var(--mce-primary-fill);
        font-size: 11px;
        color: var(--secondary-text-color, rgba(255,255,255,0.5));
        font-weight: 600;
        letter-spacing: 0.04em;
      }
      .ec-stat-yaml-code {
        margin: 0;
        padding: 8px;
        font-size: 10px;
        font-family: 'Courier New', monospace;
        color: var(--primary-text-color, rgba(255,255,255,0.7));
        background: var(--mce-fill-subtle);
        white-space: pre;
        overflow-x: auto;
        line-height: 1.5;
      }
      .ec-copy-badge {
        font-size: 10px;
        padding: 1px 5px;
        border-radius: 3px;
        background: var(--mce-accent-fill-strong);
        color: var(--mce-accent);
        letter-spacing: 0.04em;
      }
      

      .ec-drag-handle {
        width: 34px;
        flex-shrink: 0;
        align-self: stretch;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 3px;
        margin: -11px 0 -11px -12px;   
        padding: 2px 1px;
        cursor: grab;
        opacity: 0.35;
        border-radius: 3px;
        transition: opacity 0.12s;
        touch-action: none;
      }
      .ec-drag-handle::before, .ec-drag-handle::after {
        content: '';
        width: 14px;
        height: 2px;
        background: currentColor;
        border-radius: 1px;
      }
      .ec-drag-handle:hover { opacity: 0.75; }
      .ec-drag-handle:active { cursor: grabbing; }
      

      .ec-list-row .ec-drag-handle { margin: -5px 0 -5px -8px; }
      .ec-list-row.ec-dragging { opacity: 0.3; }
      

      .ec-item-card.ec-drop-before, .ec-list-row.ec-drop-before { box-shadow: inset 0 3px 0 0 var(--mce-accent); }
      .ec-item-card.ec-drop-after, .ec-list-row.ec-drop-after { box-shadow: inset 0 -3px 0 0 var(--mce-accent); }
      

      .ec-btn-clear {
        font-size: 13px;
        padding: 2px 6px;
        border: 1px solid var(--divider-color, rgba(255,255,255,0.1));
        border-radius: 4px;
        background: transparent;
        color: var(--secondary-text-color, #375f78);
        cursor: pointer;
        transition: border-color 0.12s, color 0.12s;
      }
      .ec-btn-clear:hover {
        border-color: var(--mce-primary);
        color: var(--mce-primary);
      }
      

      .ec-btn-ghost {
        font-size: 12.5px;
        font-weight: 600;
        padding: 6px 14px;
        border: 1px solid var(--divider-color, rgba(255,255,255,0.1));
        border-radius: 5px;
        background: transparent;
        color: var(--secondary-text-color, #375f78);
        cursor: pointer;
        transition: border-color 0.12s, color 0.12s;
      }
      .ec-btn-ghost:hover {
        border-color: var(--mce-primary);
        color: var(--mce-primary);
      }
      

      .ec-btn-ghost--sm { font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 4px; }

      .ec-align-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        padding: 2px 0 4px;
      }
      .ec-btn-align {
        font-size: 13px;
        font-weight: 500;
        padding: 4px 8px;
        border: none;
        border-radius: 6px;
        background: var(--mce-primary);
        

        color: var(--text-primary-color, #fff);
        cursor: pointer;
        white-space: nowrap;
      }
      .ec-empty {
        font-size: 14px;
        font-style: italic;
        color: var(--secondary-text-color, #375f78);
        margin: 4px 0;
      }
      button.ec-empty.ec-empty-action {
        display: block;
        width: 100%;
        box-sizing: border-box;
        text-align: left;
        background: transparent;
        border: 1px dashed var(--divider-color, rgba(0,212,255,0.2));
        border-radius: 8px;
        padding: 10px 12px;
        cursor: pointer;
      }
      button.ec-empty.ec-empty-action:hover {
        border-color: var(--mce-primary);
        background: var(--mce-primary-fill);
      }

       
      .ec-zone-handle {
        position: absolute;
        border: 1px dashed rgba(255, 200, 0, 0.5);
        border-radius: 3px;
        pointer-events: auto;
        cursor: grab;
        box-sizing: border-box;
        transition: border-color 0.15s;
      }
      .ec-zone-handle:hover {
        border-color: rgba(255, 200, 0, 0.85);
      }
      .ec-zone-handle.selected {
        border: 2px dashed #ffd23f;
        box-shadow: 0 0 6px rgba(255, 210, 63, 0.4);
      }
      .ec-zone-handle:active { cursor: grabbing; }
      .ec-zone-label {
        position: absolute;
        top: 3px;
        left: 4px;
        font-size: 10px;
        font-weight: 600;
        color: rgba(255, 210, 63, 0.9);
        pointer-events: none;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: calc(100% - 8px);
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
        letter-spacing: 0.03em;
      }

      .ec-zone-resize {
        position: absolute;
        width: 9px;
        height: 9px;
        background: #ffd23f;
        border: 1px solid var(--card-background-color, #1a2a36);
        border-radius: 2px;
        pointer-events: auto;
        z-index: 2;
      }
      .ec-zone-resize-tl { left: -5px; top: -5px; cursor: nwse-resize; }
      .ec-zone-resize-tr { right: -5px; top: -5px; cursor: nesw-resize; }
      .ec-zone-resize-bl { left: -5px; bottom: -5px; cursor: nesw-resize; }
      .ec-zone-resize-br { right: -5px; bottom: -5px; cursor: nwse-resize; }

       
      .ec-bg-ov {
        position: absolute;
        box-sizing: border-box;
        pointer-events: auto;
        cursor: grab;
        border: 1px dashed rgba(120, 200, 255, 0);
        transition: border-color 0.15s;
      }
      .ec-bg-ov:hover {
        border-color: rgba(120, 200, 255, 0.45);
      }
      .ec-bg-ov.selected {
        border: 2px dashed #57c7ff;
        box-shadow: 0 0 6px rgba(87, 199, 255, 0.35), inset 0 0 20px rgba(87, 199, 255, 0.08);
      }
      .ec-bg-ov:active { cursor: grabbing; }
      .ec-bg-resize {
        position: absolute;
        width: 11px;
        height: 11px;
        background: #57c7ff;
        border: 1px solid var(--card-background-color, #10222e);
        border-radius: 2px;
        pointer-events: auto;
        z-index: 3;
      }
      .ec-bg-resize-tl { left: -6px; top: -6px; cursor: nwse-resize; }
      .ec-bg-resize-tr { right: -6px; top: -6px; cursor: nesw-resize; }
      .ec-bg-resize-bl { left: -6px; bottom: -6px; cursor: nesw-resize; }
      .ec-bg-resize-br { right: -6px; bottom: -6px; cursor: nwse-resize; }

       
      .ec-flow-layer {
        position: absolute;
        inset: 0;
        pointer-events: auto;
        cursor: crosshair;
        

        z-index: 3;
      }
      .ec-snap {
        position: absolute;
        width: 9px;
        height: 9px;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 230, 120, 0.55);
        border: 1px solid #0f9;
        pointer-events: auto;
        cursor: pointer;
      }
      .ec-snap:hover {
        width: 13px;
        height: 13px;
      }
      .ec-flow-node {
        position: absolute;
        width: 11px;
        height: 11px;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        pointer-events: auto;
        box-sizing: border-box;
      }
      .ec-flow-node.free {
        background: #ffd23f;
        border: 1px solid #fff;
        cursor: grab;
      }
      .ec-flow-node.anchored {
        background: transparent;
        border: 2px solid #ffd23f;
        cursor: pointer;
      }
      .ec-flow-node.selected {
        box-shadow: 0 0 5px #ffd23f, 0 0 0 2px rgba(255, 255, 255, 0.5);
      }

       
      .ec-lib-backdrop {
        position: fixed; inset: 0; z-index: 10100;
        background: var(--mce-scrim);
      }
      .ec-lib-modal {
        position: fixed; z-index: 10101;
        top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: min(520px, 94vw); max-height: 80vh;
        background: var(--card-background-color, rgba(10,18,28,0.97));
        border: 1px solid var(--mce-primary-line);
        border-radius: 12px;
        overflow-y: auto;
        padding: 0 0 12px;
        box-shadow: 0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px var(--mce-primary-fill);
      }
      .ec-lib-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 14px 16px 10px;
        border-bottom: 1px solid var(--divider-color, rgba(0,212,255,0.12));
        position: sticky; top: 0;
        background: var(--card-background-color, rgba(10,18,28,0.98));
        z-index: 1;
      }
      .ec-lib-title {
        font-size: 15px; font-weight: 700; color: var(--mce-primary); letter-spacing: 0.03em;
      }
      .ec-lib-cat {
        font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
        color: var(--secondary-text-color, #375f78); padding: 10px 16px 4px;
      }
      .ec-lib-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
        gap: 8px; padding: 4px 12px 0;
      }
      .ec-lib-item {
        display: flex; flex-direction: column; align-items: center; gap: 6px;
        background: var(--mce-fill-subtle); border: 1px solid var(--divider-color, rgba(255,255,255,0.08));
        border-radius: 8px; padding: 10px 6px 8px; cursor: pointer;
        transition: background 0.14s, border-color 0.14s, box-shadow 0.14s;
      }
      .ec-lib-item:hover {
        background: var(--mce-primary-fill-strong);
        border-color: var(--mce-primary-line);
        box-shadow: 0 0 12px var(--mce-primary-line);
      }
      .ec-lib-preview {
        width: 52px; height: 52px; object-fit: contain;
      }
      .ec-lib-thumb-placeholder {
        width: 52px; height: 52px;
        background: var(--mce-primary-fill);
        border: 1px dashed var(--mce-primary-line);
        border-radius: 4px;
      }
      .ec-lib-name {
        font-size: 10px; color: var(--secondary-text-color, #7aacbf); text-align: center;
        line-height: 1.3; word-break: break-word;
      }
      .ec-lib-browse-row {
        padding: 2px 0 6px;
        display: flex;
      }
      .ec-lib-browse-btn {
        display: flex;
        align-items: center;
        gap: 4px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        padding: 5px 14px;
        font-size: 12px;
        font-weight: 600;
        background: var(--mce-primary);
        color: var(--text-primary-color, #fff);
      }
    `];y([gi({attribute:!1})],p.prototype,"hass",2);y([w()],p.prototype,"_config",2);y([w()],p.prototype,"_selCard",2);y([w()],p.prototype,"_selField",2);y([w()],p.prototype,"_selCards",2);y([w()],p.prototype,"_selEmbCards",2);y([w()],p.prototype,"_selColGap",2);y([w()],p.prototype,"_selRowGap",2);y([w()],p.prototype,"_selFlow",2);y([w()],p.prototype,"_showAddFlowInput",2);y([w()],p.prototype,"_newFlowName",2);y([w()],p.prototype,"_pendingFlowIdx",2);y([w()],p.prototype,"_showFlowCompleteModal",2);y([w()],p.prototype,"_selPoint",2);y([w()],p.prototype,"_selSeries",2);y([w()],p.prototype,"_selOption",2);y([w()],p.prototype,"_selBgRule",2);y([w()],p.prototype,"_selCanvasBgRule",2);y([w()],p.prototype,"_pickerTarget",2);y([w()],p.prototype,"_pickerLib",2);y([w()],p.prototype,"_pickerFolder",2);y([w()],p.prototype,"_pickerTrail",2);y([w()],p.prototype,"_pickerErr",2);y([w()],p.prototype,"_selExtOption",2);y([w()],p.prototype,"_selExtSeries",2);y([w()],p.prototype,"_selVirtual",2);y([w()],p.prototype,"_selVirtualInput",2);y([w()],p.prototype,"_selTrigger",2);y([w()],p.prototype,"_selZone",2);y([w()],p.prototype,"_selExtCard",2);y([w()],p.prototype,"_selExtField",2);y([w()],p.prototype,"_templateName",2);y([w()],p.prototype,"_templateIncludeEntities",2);y([w()],p.prototype,"_templateError",2);y([w()],p.prototype,"_previewBoxes",2);y([w()],p.prototype,"_previewExpanded",2);y([w()],p.prototype,"_barAtTop",2);y([w()],p.prototype,"_copiedFields",2);y([w()],p.prototype,"_copySourceId",2);y([w()],p.prototype,"_virtualClipboard",2);y([w()],p.prototype,"_copiedField",2);y([w()],p.prototype,"_copiedFieldSrc",2);y([w()],p.prototype,"_copiedOption",2);y([w()],p.prototype,"_dragSrc",2);y([w()],p.prototype,"_cpOpenId",2);y([w()],p.prototype,"_cpPos",2);y([w()],p.prototype,"_ggOpen",2);y([w()],p.prototype,"_wizStep",2);y([w()],p.prototype,"_wiz",2);y([w()],p.prototype,"_bgSelected",2);y([w()],p.prototype,"_selEmbCard",2);y([w()],p.prototype,"_embEditorOpen",2);y([w()],p.prototype,"_embEditorYaml",2);y([w()],p.prototype,"_embEditorYamlError",2);y([w()],p.prototype,"_embNativeEditor",2);y([w()],p.prototype,"_embPickerOpen",2);y([w()],p.prototype,"_embPickerSearch",2);y([w()],p.prototype,"_variantOpen",2);y([w()],p.prototype,"_variantError",2);y([w()],p.prototype,"_saveVariantFor",2);y([w()],p.prototype,"_saveVariantLabel",2);y([w()],p.prototype,"_variantImportError",2);y([w()],p.prototype,"_navTab",2);y([w()],p.prototype,"_navPanel",2);y([w()],p.prototype,"_navPath",2);y([w()],p.prototype,"_listFilter",2);y([w()],p.prototype,"_toastMsg",2);y([w()],p.prototype,"_tutorialStep",2);y([w()],p.prototype,"_dropKey",2);y([w()],p.prototype,"_dropBefore",2);y([w()],p.prototype,"_searchQuery",2);y([w()],p.prototype,"_searchActive",2);y([w()],p.prototype,"_healthShowIgnored",2);y([w()],p.prototype,"_cpMode",2);p=y([mi(bi)],p);export{p as MosaicCanvasEditor};
