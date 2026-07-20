/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const ae=globalThis,Te=ae.ShadowRoot&&(ae.ShadyCSS===void 0||ae.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,De=Symbol(),qe=new WeakMap;let Ss=class{constructor(t,s,i){if(this._$cssResult$=!0,i!==De)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=s}get styleSheet(){let t=this.o;const s=this.t;if(Te&&t===void 0){const i=s!==void 0&&s.length===1;i&&(t=qe.get(s)),t===void 0&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),i&&qe.set(s,t))}return t}toString(){return this.cssText}};const js=e=>new Ss(typeof e=="string"?e:e+"",void 0,De),Bt=(e,...t)=>{const s=e.length===1?e[0]:t.reduce((i,n,a)=>i+(r=>{if(r._$cssResult$===!0)return r.cssText;if(typeof r=="number")return r;throw Error("Value passed to 'css' function must be a 'css' function result: "+r+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(n)+e[a+1],e[0]);return new Ss(s,e,De)},Us=(e,t)=>{if(Te)e.adoptedStyleSheets=t.map(s=>s instanceof CSSStyleSheet?s:s.styleSheet);else for(const s of t){const i=document.createElement("style"),n=ae.litNonce;n!==void 0&&i.setAttribute("nonce",n),i.textContent=s.cssText,e.appendChild(i)}},Ye=Te?e=>e:e=>e instanceof CSSStyleSheet?(t=>{let s="";for(const i of t.cssRules)s+=i.cssText;return js(s)})(e):e;/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const{is:qs,defineProperty:Ys,getOwnPropertyDescriptor:Xs,getOwnPropertyNames:Zs,getOwnPropertySymbols:Ks,getPrototypeOf:Js}=Object,ue=globalThis,Xe=ue.trustedTypes,Qs=Xe?Xe.emptyScript:"",ti=ue.reactiveElementPolyfillSupport,jt=(e,t)=>e,oe={toAttribute(e,t){switch(t){case Boolean:e=e?Qs:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let s=e;switch(t){case Boolean:s=e!==null;break;case Number:s=e===null?null:Number(e);break;case Object:case Array:try{s=JSON.parse(e)}catch{s=null}}return s}},Ae=(e,t)=>!qs(e,t),Ze={attribute:!0,type:String,converter:oe,reflect:!1,useDefault:!1,hasChanged:Ae};Symbol.metadata??=Symbol("metadata"),ue.litPropertyMetadata??=new WeakMap;let Pt=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,s=Ze){if(s.state&&(s.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((s=Object.create(s)).wrapped=!0),this.elementProperties.set(t,s),!s.noAccessor){const i=Symbol(),n=this.getPropertyDescriptor(t,i,s);n!==void 0&&Ys(this.prototype,t,n)}}static getPropertyDescriptor(t,s,i){const{get:n,set:a}=Xs(this.prototype,t)??{get(){return this[s]},set(r){this[s]=r}};return{get:n,set(r){const l=n?.call(this);a?.call(this,r),this.requestUpdate(t,l,i)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??Ze}static _$Ei(){if(this.hasOwnProperty(jt("elementProperties")))return;const t=Js(this);t.finalize(),t.l!==void 0&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(jt("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(jt("properties"))){const s=this.properties,i=[...Zs(s),...Ks(s)];for(const n of i)this.createProperty(n,s[n])}const t=this[Symbol.metadata];if(t!==null){const s=litPropertyMetadata.get(t);if(s!==void 0)for(const[i,n]of s)this.elementProperties.set(i,n)}this._$Eh=new Map;for(const[s,i]of this.elementProperties){const n=this._$Eu(s,i);n!==void 0&&this._$Eh.set(n,s)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const s=[];if(Array.isArray(t)){const i=new Set(t.flat(1/0).reverse());for(const n of i)s.unshift(Ye(n))}else t!==void 0&&s.push(Ye(t));return s}static _$Eu(t,s){const i=s.attribute;return i===!1?void 0:typeof i=="string"?i:typeof t=="string"?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),this.renderRoot!==void 0&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,s=this.constructor.elementProperties;for(const i of s.keys())this.hasOwnProperty(i)&&(t.set(i,this[i]),delete this[i]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return Us(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,s,i){this._$AK(t,i)}_$ET(t,s){const i=this.constructor.elementProperties.get(t),n=this.constructor._$Eu(t,i);if(n!==void 0&&i.reflect===!0){const a=(i.converter?.toAttribute!==void 0?i.converter:oe).toAttribute(s,i.type);this._$Em=t,a==null?this.removeAttribute(n):this.setAttribute(n,a),this._$Em=null}}_$AK(t,s){const i=this.constructor,n=i._$Eh.get(t);if(n!==void 0&&this._$Em!==n){const a=i.getPropertyOptions(n),r=typeof a.converter=="function"?{fromAttribute:a.converter}:a.converter?.fromAttribute!==void 0?a.converter:oe;this._$Em=n;const l=r.fromAttribute(s,a.type);this[n]=l??this._$Ej?.get(n)??l,this._$Em=null}}requestUpdate(t,s,i,n=!1,a){if(t!==void 0){const r=this.constructor;if(n===!1&&(a=this[t]),i??=r.getPropertyOptions(t),!((i.hasChanged??Ae)(a,s)||i.useDefault&&i.reflect&&a===this._$Ej?.get(t)&&!this.hasAttribute(r._$Eu(t,i))))return;this.C(t,s,i)}this.isUpdatePending===!1&&(this._$ES=this._$EP())}C(t,s,{useDefault:i,reflect:n,wrapped:a},r){i&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,r??s??this[t]),a!==!0||r!==void 0)||(this._$AL.has(t)||(this.hasUpdated||i||(s=void 0),this._$AL.set(t,s)),n===!0&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(s){Promise.reject(s)}const t=this.scheduleUpdate();return t!=null&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[n,a]of this._$Ep)this[n]=a;this._$Ep=void 0}const i=this.constructor.elementProperties;if(i.size>0)for(const[n,a]of i){const{wrapped:r}=a,l=this[n];r!==!0||this._$AL.has(n)||l===void 0||this.C(n,void 0,a,l)}}let t=!1;const s=this._$AL;try{t=this.shouldUpdate(s),t?(this.willUpdate(s),this._$EO?.forEach(i=>i.hostUpdate?.()),this.update(s)):this._$EM()}catch(i){throw t=!1,this._$EM(),i}t&&this._$AE(s)}willUpdate(t){}_$AE(t){this._$EO?.forEach(s=>s.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(s=>this._$ET(s,this[s])),this._$EM()}updated(t){}firstUpdated(t){}};Pt.elementStyles=[],Pt.shadowRootOptions={mode:"open"},Pt[jt("elementProperties")]=new Map,Pt[jt("finalized")]=new Map,ti?.({ReactiveElement:Pt}),(ue.reactiveElementVersions??=[]).push("2.1.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Re=globalThis,Ke=e=>e,re=Re.trustedTypes,Je=re?re.createPolicy("lit-html",{createHTML:e=>e}):void 0,Cs="$lit$",mt=`lit$${Math.random().toFixed(9).slice(2)}$`,Ns="?"+mt,ei=`<${Ns}>`,zt=document,Ut=()=>zt.createComment(""),qt=e=>e===null||typeof e!="object"&&typeof e!="function",Be=Array.isArray,si=e=>Be(e)||typeof e?.[Symbol.iterator]=="function",fe=`[ 	
\f\r]`,Vt=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Qe=/-->/g,ts=/>/g,kt=RegExp(`>|${fe}(?:([^\\s"'>=/]+)(${fe}*=${fe}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`,"g"),es=/'/g,ss=/"/g,Es=/^(?:script|style|textarea|title)$/i,Is=e=>(t,...s)=>({_$litType$:e,strings:t,values:s}),o=Is(1),P=Is(2),At=Symbol.for("lit-noChange"),m=Symbol.for("lit-nothing"),is=new WeakMap,Et=zt.createTreeWalker(zt,129);function zs(e,t){if(!Be(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return Je!==void 0?Je.createHTML(t):t}const ii=(e,t)=>{const s=e.length-1,i=[];let n,a=t===2?"<svg>":t===3?"<math>":"",r=Vt;for(let l=0;l<s;l++){const c=e[l];let p,u,h=-1,d=0;for(;d<c.length&&(r.lastIndex=d,u=r.exec(c),u!==null);)d=r.lastIndex,r===Vt?u[1]==="!--"?r=Qe:u[1]!==void 0?r=ts:u[2]!==void 0?(Es.test(u[2])&&(n=RegExp("</"+u[2],"g")),r=kt):u[3]!==void 0&&(r=kt):r===kt?u[0]===">"?(r=n??Vt,h=-1):u[1]===void 0?h=-2:(h=r.lastIndex-u[2].length,p=u[1],r=u[3]===void 0?kt:u[3]==='"'?ss:es):r===ss||r===es?r=kt:r===Qe||r===ts?r=Vt:(r=kt,n=void 0);const g=r===kt&&e[l+1].startsWith("/>")?" ":"";a+=r===Vt?c+ei:h>=0?(i.push(p),c.slice(0,h)+Cs+c.slice(h)+mt+g):c+mt+(h===-2?l:g)}return[zs(e,a+(e[s]||"<?>")+(t===2?"</svg>":t===3?"</math>":"")),i]};class Yt{constructor({strings:t,_$litType$:s},i){let n;this.parts=[];let a=0,r=0;const l=t.length-1,c=this.parts,[p,u]=ii(t,s);if(this.el=Yt.createElement(p,i),Et.currentNode=this.el.content,s===2||s===3){const h=this.el.content.firstChild;h.replaceWith(...h.childNodes)}for(;(n=Et.nextNode())!==null&&c.length<l;){if(n.nodeType===1){if(n.hasAttributes())for(const h of n.getAttributeNames())if(h.endsWith(Cs)){const d=u[r++],g=n.getAttribute(h).split(mt),b=/([.?@])?(.*)/.exec(d);c.push({type:1,index:a,name:b[2],strings:g,ctor:b[1]==="."?ai:b[1]==="?"?oi:b[1]==="@"?ri:de}),n.removeAttribute(h)}else h.startsWith(mt)&&(c.push({type:6,index:a}),n.removeAttribute(h));if(Es.test(n.tagName)){const h=n.textContent.split(mt),d=h.length-1;if(d>0){n.textContent=re?re.emptyScript:"";for(let g=0;g<d;g++)n.append(h[g],Ut()),Et.nextNode(),c.push({type:2,index:++a});n.append(h[d],Ut())}}}else if(n.nodeType===8)if(n.data===Ns)c.push({type:2,index:a});else{let h=-1;for(;(h=n.data.indexOf(mt,h+1))!==-1;)c.push({type:7,index:a}),h+=mt.length-1}a++}}static createElement(t,s){const i=zt.createElement("template");return i.innerHTML=t,i}}function Rt(e,t,s=e,i){if(t===At)return t;let n=i!==void 0?s._$Co?.[i]:s._$Cl;const a=qt(t)?void 0:t._$litDirective$;return n?.constructor!==a&&(n?._$AO?.(!1),a===void 0?n=void 0:(n=new a(e),n._$AT(e,s,i)),i!==void 0?(s._$Co??=[])[i]=n:s._$Cl=n),n!==void 0&&(t=Rt(e,n._$AS(e,t.values),n,i)),t}class ni{constructor(t,s){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=s}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:s},parts:i}=this._$AD,n=(t?.creationScope??zt).importNode(s,!0);Et.currentNode=n;let a=Et.nextNode(),r=0,l=0,c=i[0];for(;c!==void 0;){if(r===c.index){let p;c.type===2?p=new Zt(a,a.nextSibling,this,t):c.type===1?p=new c.ctor(a,c.name,c.strings,this,t):c.type===6&&(p=new li(a,this,t)),this._$AV.push(p),c=i[++l]}r!==c?.index&&(a=Et.nextNode(),r++)}return Et.currentNode=zt,n}p(t){let s=0;for(const i of this._$AV)i!==void 0&&(i.strings!==void 0?(i._$AI(t,i,s),s+=i.strings.length-2):i._$AI(t[s])),s++}}class Zt{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,s,i,n){this.type=2,this._$AH=m,this._$AN=void 0,this._$AA=t,this._$AB=s,this._$AM=i,this.options=n,this._$Cv=n?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const s=this._$AM;return s!==void 0&&t?.nodeType===11&&(t=s.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,s=this){t=Rt(this,t,s),qt(t)?t===m||t==null||t===""?(this._$AH!==m&&this._$AR(),this._$AH=m):t!==this._$AH&&t!==At&&this._(t):t._$litType$!==void 0?this.$(t):t.nodeType!==void 0?this.T(t):si(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==m&&qt(this._$AH)?this._$AA.nextSibling.data=t:this.T(zt.createTextNode(t)),this._$AH=t}$(t){const{values:s,_$litType$:i}=t,n=typeof i=="number"?this._$AC(t):(i.el===void 0&&(i.el=Yt.createElement(zs(i.h,i.h[0]),this.options)),i);if(this._$AH?._$AD===n)this._$AH.p(s);else{const a=new ni(n,this),r=a.u(this.options);a.p(s),this.T(r),this._$AH=a}}_$AC(t){let s=is.get(t.strings);return s===void 0&&is.set(t.strings,s=new Yt(t)),s}k(t){Be(this._$AH)||(this._$AH=[],this._$AR());const s=this._$AH;let i,n=0;for(const a of t)n===s.length?s.push(i=new Zt(this.O(Ut()),this.O(Ut()),this,this.options)):i=s[n],i._$AI(a),n++;n<s.length&&(this._$AR(i&&i._$AB.nextSibling,n),s.length=n)}_$AR(t=this._$AA.nextSibling,s){for(this._$AP?.(!1,!0,s);t!==this._$AB;){const i=Ke(t).nextSibling;Ke(t).remove(),t=i}}setConnected(t){this._$AM===void 0&&(this._$Cv=t,this._$AP?.(t))}}class de{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,s,i,n,a){this.type=1,this._$AH=m,this._$AN=void 0,this.element=t,this.name=s,this._$AM=n,this.options=a,i.length>2||i[0]!==""||i[1]!==""?(this._$AH=Array(i.length-1).fill(new String),this.strings=i):this._$AH=m}_$AI(t,s=this,i,n){const a=this.strings;let r=!1;if(a===void 0)t=Rt(this,t,s,0),r=!qt(t)||t!==this._$AH&&t!==At,r&&(this._$AH=t);else{const l=t;let c,p;for(t=a[0],c=0;c<a.length-1;c++)p=Rt(this,l[i+c],s,c),p===At&&(p=this._$AH[c]),r||=!qt(p)||p!==this._$AH[c],p===m?t=m:t!==m&&(t+=(p??"")+a[c+1]),this._$AH[c]=p}r&&!n&&this.j(t)}j(t){t===m?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class ai extends de{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===m?void 0:t}}class oi extends de{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==m)}}class ri extends de{constructor(t,s,i,n,a){super(t,s,i,n,a),this.type=5}_$AI(t,s=this){if((t=Rt(this,t,s,0)??m)===At)return;const i=this._$AH,n=t===m&&i!==m||t.capture!==i.capture||t.once!==i.once||t.passive!==i.passive,a=t!==m&&(i===m||n);n&&this.element.removeEventListener(this.name,this,i),a&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){typeof this._$AH=="function"?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}let li=class{constructor(t,s,i){this.element=t,this.type=6,this._$AN=void 0,this._$AM=s,this.options=i}get _$AU(){return this._$AM._$AU}_$AI(t){Rt(this,t)}};const ci=Re.litHtmlPolyfillSupport;ci?.(Yt,Zt),(Re.litHtmlVersions??=[]).push("3.3.3");const pi=(e,t,s)=>{const i=s?.renderBefore??t;let n=i._$litPart$;if(n===void 0){const a=s?.renderBefore??null;i._$litPart$=n=new Zt(t.insertBefore(Ut(),a),a,void 0,s??{})}return n._$AI(e),n};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const Le=globalThis;class bt extends Pt{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const s=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=pi(s,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return At}}bt._$litElement$=!0,bt.finalized=!0,Le.litElementHydrateSupport?.({LitElement:bt});const ui=Le.litElementPolyfillSupport;ui?.({LitElement:bt});(Le.litElementVersions??=[]).push("4.2.2");/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const he=e=>(t,s)=>{s!==void 0?s.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)};/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const di={attribute:!0,type:String,converter:oe,reflect:!1,hasChanged:Ae},hi=(e=di,t,s)=>{const{kind:i,metadata:n}=s;let a=globalThis.litPropertyMetadata.get(n);if(a===void 0&&globalThis.litPropertyMetadata.set(n,a=new Map),i==="setter"&&((e=Object.create(e)).wrapped=!0),a.set(s.name,e),i==="accessor"){const{name:r}=s;return{set(l){const c=t.get.call(this);t.set.call(this,l),this.requestUpdate(r,c,e,!0,l)},init(l){return l!==void 0&&this.C(r,void 0,e,l),l}}}if(i==="setter"){const{name:r}=s;return function(l){const c=this[r];t.call(this,l),this.requestUpdate(r,c,e,!0,l)}}throw Error("Unsupported decorator location: "+i)};function st(e){return(t,s)=>typeof s=="object"?hi(e,t,s):((i,n,a)=>{const r=n.hasOwnProperty(a);return n.constructor.createProperty(a,i),r?Object.getOwnPropertyDescriptor(n,a):void 0})(e,t,s)}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function E(e){return st({...e,state:!0,attribute:!1})}/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */const _i=(e,t,s)=>(s.configurable=!0,s.enumerable=!0,Reflect.decorate&&typeof t!="object"&&Object.defineProperty(e,t,s),s);/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */function mi(e,t){return(s,i,n)=>{const a=r=>r.renderRoot?.querySelector(e)??null;return _i(s,i,{get(){return a(this)}})}}var ns,as;(function(e){e.language="language",e.system="system",e.comma_decimal="comma_decimal",e.decimal_comma="decimal_comma",e.space_comma="space_comma",e.none="none"})(ns||(ns={})),(function(e){e.language="language",e.system="system",e.am_pm="12",e.twenty_four="24"})(as||(as={}));function gi(e){return e.substr(0,e.indexOf("."))}var bi=["closed","locked","off"],le=function(e,t,s,i){i=i||{},s=s??{};var n=new Event(t,{bubbles:i.bubbles===void 0||i.bubbles,cancelable:!!i.cancelable,composed:i.composed===void 0||i.composed});return n.detail=s,e.dispatchEvent(n),n},ee=function(e){le(window,"haptic",e)},vi=function(e,t,s){s===void 0&&(s=!1),s?history.replaceState(null,"",t):history.pushState(null,"",t),le(window,"location-changed",{replace:s})},fi=function(e,t,s){s===void 0&&(s=!0);var i,n=gi(t),a=n==="group"?"homeassistant":n;switch(n){case"lock":i=s?"unlock":"lock";break;case"cover":i=s?"open_cover":"close_cover";break;default:i=s?"turn_on":"turn_off"}return e.callService(a,i,{entity_id:t})},yi=function(e,t){var s=bi.includes(e.states[t].state);return fi(e,t,s)},$i=function(e,t,s,i){if(i||(i={action:"more-info"}),!i.confirmation||i.confirmation.exemptions&&i.confirmation.exemptions.some(function(a){return a.user===t.user.id})||(ee("warning"),confirm(i.confirmation.text||"Are you sure you want to "+i.action+"?")))switch(i.action){case"more-info":(s.entity||s.camera_image)&&le(e,"hass-more-info",{entityId:s.entity?s.entity:s.camera_image});break;case"navigate":i.navigation_path&&vi(0,i.navigation_path);break;case"url":i.url_path&&window.open(i.url_path);break;case"toggle":s.entity&&(yi(t,s.entity),ee("success"));break;case"call-service":if(!i.service)return void ee("failure");var n=i.service.split(".",2);t.callService(n[0],n[1],i.service_data,i.target),ee("success");break;case"fire-dom-event":le(e,"ll-custom",i)}},xi=function(e,t,s,i){var n;i==="double_tap"&&s.double_tap_action?n=s.double_tap_action:i==="hold"&&s.hold_action?n=s.hold_action:i==="tap"&&s.tap_action&&(n=s.tap_action),$i(e,t,s,n)};const Xt=(e,t=0,s=1)=>e>s?s:e<t?t:e,U=(e,t=0,s=Math.pow(10,t))=>Math.round(s*e)/s,wi=e=>Ei(Ie(e)),Ie=e=>(e[0]==="#"&&(e=e.substring(1)),e.length<6?{r:parseInt(e[0]+e[0],16),g:parseInt(e[1]+e[1],16),b:parseInt(e[2]+e[2],16),a:e.length===4?U(parseInt(e[3]+e[3],16)/255,2):1}:{r:parseInt(e.substring(0,2),16),g:parseInt(e.substring(2,4),16),b:parseInt(e.substring(4,6),16),a:e.length===8?U(parseInt(e.substring(6,8),16)/255,2):1}),ki=e=>Ni(Ci(e)),Si=({h:e,s:t,v:s,a:i})=>{const n=(200-t)*s/100;return{h:U(e),s:U(n>0&&n<200?t*s/100/(n<=100?n:200-n)*100:0),l:U(n/2),a:U(i,2)}},ze=e=>{const{h:t,s,l:i}=Si(e);return`hsl(${t}, ${s}%, ${i}%)`},Ci=({h:e,s:t,v:s,a:i})=>{e=e/360*6,t=t/100,s=s/100;const n=Math.floor(e),a=s*(1-t),r=s*(1-(e-n)*t),l=s*(1-(1-e+n)*t),c=n%6;return{r:U([s,r,a,a,l,s][c]*255),g:U([l,s,s,r,a,a][c]*255),b:U([a,a,l,s,s,r][c]*255),a:U(i,2)}},se=e=>{const t=e.toString(16);return t.length<2?"0"+t:t},Ni=({r:e,g:t,b:s,a:i})=>{const n=i<1?se(U(i*255)):"";return"#"+se(e)+se(t)+se(s)+n},Ei=({r:e,g:t,b:s,a:i})=>{const n=Math.max(e,t,s),a=n-Math.min(e,t,s),r=a?n===e?(t-s)/a:n===t?2+(s-e)/a:4+(e-t)/a:0;return{h:U(60*(r<0?r+6:r)),s:U(n?a/n*100:0),v:U(n/255*100),a:i}},Fs=(e,t)=>{if(e===t)return!0;for(const s in e)if(e[s]!==t[s])return!1;return!0},Ii=(e,t)=>e.toLowerCase()===t.toLowerCase()?!0:Fs(Ie(e),Ie(t)),os={},Ms=e=>{let t=os[e];return t||(t=document.createElement("template"),t.innerHTML=e,os[e]=t),t},We=(e,t,s)=>{e.dispatchEvent(new CustomEvent(t,{bubbles:!0,detail:s}))};let Dt=!1;const Fe=e=>"touches"in e,zi=e=>Dt&&!Fe(e)?!1:(Dt||(Dt=Fe(e)),!0),rs=(e,t)=>{const s=Fe(t)?t.touches[0]:t,i=e.el.getBoundingClientRect();We(e.el,"move",e.getMove({x:Xt((s.pageX-(i.left+window.pageXOffset))/i.width),y:Xt((s.pageY-(i.top+window.pageYOffset))/i.height)}))},Fi=(e,t)=>{const s=t.keyCode;s>40||e.xy&&s<37||s<33||(t.preventDefault(),We(e.el,"move",e.getMove({x:s===39?.01:s===37?-.01:s===34?.05:s===33?-.05:s===35?1:s===36?-1:0,y:s===40?.01:s===38?-.01:0},!0)))};class Ps{constructor(t,s,i,n){const a=Ms(`<div role="slider" tabindex="0" part="${s}" ${i}><div part="${s}-pointer"></div></div>`);t.appendChild(a.content.cloneNode(!0));const r=t.querySelector(`[part=${s}]`);r.addEventListener("mousedown",this),r.addEventListener("touchstart",this),r.addEventListener("keydown",this),this.el=r,this.xy=n,this.nodes=[r.firstChild,r]}set dragging(t){const s=t?document.addEventListener:document.removeEventListener;s(Dt?"touchmove":"mousemove",this),s(Dt?"touchend":"mouseup",this)}handleEvent(t){switch(t.type){case"mousedown":case"touchstart":if(t.preventDefault(),!zi(t)||!Dt&&t.button!=0)return;this.el.focus(),rs(this,t),this.dragging=!0;break;case"mousemove":case"touchmove":t.preventDefault(),rs(this,t);break;case"mouseup":case"touchend":this.dragging=!1;break;case"keydown":Fi(this,t);break}}style(t){t.forEach((s,i)=>{for(const n in s)this.nodes[i].style.setProperty(n,s[n])})}}class Mi extends Ps{constructor(t){super(t,"hue",'aria-label="Hue" aria-valuemin="0" aria-valuemax="360"',!1)}update({h:t}){this.h=t,this.style([{left:`${t/360*100}%`,color:ze({h:t,s:100,v:100,a:1})}]),this.el.setAttribute("aria-valuenow",`${U(t)}`)}getMove(t,s){return{h:s?Xt(this.h+t.x*360,0,360):360*t.x}}}class Pi extends Ps{constructor(t){super(t,"saturation",'aria-label="Color"',!0)}update(t){this.hsva=t,this.style([{top:`${100-t.v}%`,left:`${t.s}%`,color:ze(t)},{"background-color":ze({h:t.h,s:100,v:100,a:1})}]),this.el.setAttribute("aria-valuetext",`Saturation ${U(t.s)}%, Brightness ${U(t.v)}%`)}getMove(t,s){return{s:s?Xt(this.hsva.s+t.x*100,0,100):t.x*100,v:s?Xt(this.hsva.v-t.y*100,0,100):Math.round(100-t.y*100)}}}const Ti=':host{display:flex;flex-direction:column;position:relative;width:200px;height:200px;user-select:none;-webkit-user-select:none;cursor:default}:host([hidden]){display:none!important}[role=slider]{position:relative;touch-action:none;user-select:none;-webkit-user-select:none;outline:0}[role=slider]:last-child{border-radius:0 0 8px 8px}[part$=pointer]{position:absolute;z-index:1;box-sizing:border-box;width:28px;height:28px;display:flex;place-content:center center;transform:translate(-50%,-50%);background-color:#fff;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,.2)}[part$=pointer]::after{content:"";width:100%;height:100%;border-radius:inherit;background-color:currentColor}[role=slider]:focus [part$=pointer]{transform:translate(-50%,-50%) scale(1.1)}',Di="[part=hue]{flex:0 0 24px;background:linear-gradient(to right,red 0,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,red 100%)}[part=hue-pointer]{top:50%;z-index:2}",Ai="[part=saturation]{flex-grow:1;border-color:transparent;border-bottom:12px solid #000;border-radius:8px 8px 0 0;background-image:linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,rgba(255,255,255,0));box-shadow:inset 0 0 0 1px rgba(0,0,0,.05)}[part=saturation-pointer]{z-index:3}",ie=Symbol("same"),ye=Symbol("color"),ls=Symbol("hsva"),$e=Symbol("update"),cs=Symbol("parts"),ps=Symbol("css"),us=Symbol("sliders");class Ri extends HTMLElement{static get observedAttributes(){return["color"]}get[ps](){return[Ti,Di,Ai]}get[us](){return[Pi,Mi]}get color(){return this[ye]}set color(t){if(!this[ie](t)){const s=this.colorModel.toHsva(t);this[$e](s),this[ye]=t}}constructor(){super();const t=Ms(`<style>${this[ps].join("")}</style>`),s=this.attachShadow({mode:"open"});s.appendChild(t.content.cloneNode(!0)),s.addEventListener("move",this),this[cs]=this[us].map(i=>new i(s))}connectedCallback(){if(this.hasOwnProperty("color")){const t=this.color;delete this.color,this.color=t}else this.color||(this.color=this.colorModel.defaultColor)}attributeChangedCallback(t,s,i){const n=this.colorModel.fromAttr(i);this[ie](n)||(this.color=n)}handleEvent(t){const s=this[ls],i={...s,...t.detail};this[$e](i);let n;!Fs(i,s)&&!this[ie](n=this.colorModel.fromHsva(i))&&(this[ye]=n,We(this,"color-changed",{value:n}))}[ie](t){return this.color&&this.colorModel.equal(t,this.color)}[$e](t){this[ls]=t,this[cs].forEach(s=>s.update(t))}}const Bi={defaultColor:"#000",toHsva:wi,fromHsva:({h:e,s:t,v:s})=>ki({h:e,s:t,v:s,a:1}),equal:Ii,fromAttr:e=>e};class Li extends Ri{get colorModel(){return Bi}}class Wi extends Li{}customElements.define("hex-color-picker",Wi);let Ts={};const Hi=fetch(new URL("./defaults.json",import.meta.url).href).then(e=>{if(!e.ok)throw new Error(`HTTP ${e.status}`);return e.json()}).then(e=>{Ts=e}).catch(e=>{console.error("[mosaic-canvas-card] Failed to load defaults.json — card-level and field-level overrides still apply.",e)});function _(e){return Ts[e]}function xe(e,t,s,i,n=""){if(s.unit===void 0&&n==="power"){const l=t==="kW"?e*1e3:e,c=i?.power_unit;if(c==="W")return{value:l.toFixed(s.decimals??_("decimals_w")??0),unit:"W"};if(c==="kW"){const p=l/1e3,u=s.decimals??(Math.abs(p)<10?2:1);return{value:p.toFixed(u),unit:"kW"}}if(Math.abs(l)>=1e3){const p=l/1e3,u=s.decimals??(Math.abs(p)<10?2:1);return{value:p.toFixed(u),unit:"kW"}}return{value:l.toFixed(s.decimals??_("decimals_w")??0),unit:"W"}}if(s.unit===void 0&&(t==="kWh"||t==="MWh")&&Math.abs(e)>=1e3)return{value:((t==="MWh"?e*1e3:e)/1e3).toFixed(s.decimals??_("decimals_mwh")??2),unit:"MWh"};const a=s.unit!==void 0?s.unit:t;return{value:s.decimals!=null?e.toFixed(s.decimals):String(e),unit:a}}function Oi(e){if(!Number.isFinite(e)||e<0)return{value:"--",unit:""};const t=Math.round(e*60),s=Math.floor(t/60),i=t%60;return s===0?{value:`${i}m`,unit:""}:i===0?{value:`${s}h`,unit:""}:{value:`${s}h ${i}m`,unit:""}}function Gi(e,t,s,i,n){if(!t.entity)return{value:"",unit:""};if(t.stat_period&&n){const h=n.get(t.id);if(!h)return{value:"—",unit:""};const d=e?.states[t.entity]?.attributes?.device_class??"";return xe(h.value,h.unit,t,s,d)}if(t.entity.startsWith("virtual:")){const h=i?.get(t.entity);if(!h)return{value:"",unit:""};if(h.unit==="duration")return Oi(h.value);const d=h.unit==="W"||h.unit==="kW";return xe(h.value,h.unit,t,s,d?"power":"")}const a=e?.states[t.entity];if(!a)return{value:"",unit:""};const r=a.attributes?.unit_of_measurement??"",l=a.attributes?.device_class??"",c=t.attribute?a.attributes?.[t.attribute]:a.state,p=Number(c);return c!==""&&c!==null&&c!==void 0&&Number.isFinite(p)?xe(p,r,t,s,l):{value:String(c??""),unit:t.unit??""}}function Vi(e,t,s){const i=t>0?"increasing":t<0?"decreasing":"none";if(i==="none")return{hours:null,label:null,direction:"none"};let n;if(i==="increasing"?n=s.filter(c=>c.value>e).reduce((c,p)=>c===void 0||p.value<c.value?p:c,void 0):n=s.filter(c=>c.value<e).reduce((c,p)=>c===void 0||p.value>c.value?p:c,void 0),!n)return{hours:null,label:null,direction:i};const r=Math.abs(n.value-e)/Math.abs(t);return Number.isFinite(r)?{hours:r,label:n.label,direction:i}:{hours:null,label:null,direction:i}}function rt(e,t){const s=e?.canvas,i=s?.width,n=s?.height,a=t,r=a&&a.h>0?a.w/a.h:1.94;let l,c;i!=null&&n!=null?(l=i,c=n):i!=null?(l=i,c=Math.round(i/r)):n!=null?(c=n,l=Math.round(n*r)):(l=_("canvas_fallback_width")??1e3,c=a&&a.w>0?Math.round(l/(a.w/a.h)):Math.round(l/1.94));const p=s?.extend,u=p?.left??0,h=p?.right??0,d=p?.top??0,g=p?.bottom??0;return{baseW:l,baseH:c,L:u,T:d,R:h,B:g,totalW:l+u+h,totalH:c+d+g}}const He={center:"translate(-50%, -50%)",top:"translate(-50%, 0)",bottom:"translate(-50%, -100%)",left:"translate(0, -50%)",right:"translate(-100%, -50%)","top-left":"translate(0, 0)","top-right":"translate(-100%, 0)","bottom-left":"translate(0, -100%)","bottom-right":"translate(-100%, -100%)"},ce={center:[.5,.5],top:[.5,0],bottom:[.5,1],left:[0,.5],right:[1,.5],"top-left":[0,0],"top-right":[1,0],"bottom-left":[0,1],"bottom-right":[1,1]};function ji(e,t){switch(t){case"top":return{x:e.x+e.w/2,y:e.y};case"right":return{x:e.x+e.w,y:e.y+e.h/2};case"bottom":return{x:e.x+e.w/2,y:e.y+e.h};case"left":return{x:e.x,y:e.y+e.h/2};case"center":return{x:e.x+e.w/2,y:e.y+e.h/2}}}function _t(e){return e==="center"?"center":e==="right"?"flex-end":"flex-start"}function Ui(e,t){const s=e?.background;if(!s||s.source==="day")return"day";if(s.source==="night")return"night";if(s.source==="entity"){const n=s.mode_entity?t?.states[s.mode_entity]:void 0;return n&&/^(night|on|true)$/i.test(String(n.state))?"night":"day"}return t?.states[s.sun_entity??_("sun_entity")??"sun.sun"]?.state==="below_horizon"?"night":"day"}function qi(e,t){const s=e?.background?.images?.[Ui(e,t)];if(!s)return;const i=Number(e?.ev_count??0);if(s[String(i)])return s[String(i)];const n=Object.keys(s).map(Number).filter(r=>!Number.isNaN(r)).sort((r,l)=>r-l);let a;for(const r of n)r<=i&&(a=r);return a===void 0&&n.length&&(a=n[0]),a!==void 0?s[String(a)]:void 0}function Yi(e,t){return{...t?.card,...e.box}}function we(e,t,s){const i=e.type==="label"?s?.label??{}:s?.value??{},n=e.type==="label"?t.label_style??{}:t.value_style??{};return{font_family:s?.font_family,...i,...n,...e.style}}function Xi(e,t){const s=e.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);if(s)return`rgba(${s[1]},${s[2]},${s[3]},${t})`;const i=e.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i);return i?`rgba(${parseInt(i[1],16)},${parseInt(i[2],16)},${parseInt(i[3],16)},${t})`:e}function pe(e){const t=[];if(e.background){const s=e.background_alpha!==void 0?Xi(e.background,e.background_alpha):e.background;t.push(`background:${s}`)}else e.background_alpha!==void 0&&t.push(`background:rgba(0,0,0,${e.background_alpha})`);if(e.border===!0){const s=e.border_width??_("box_border_width")??1,i=e.color??_("box_border_color")??"#00d4ff";t.push(`border:${s}px solid ${i}`)}if(t.push(`border-radius:${e.radius??_("box_radius")??0}px`),t.push(`padding:${e.padding??_("box_padding")??0}px`),e.glow===!0){const s=e.color??_("box_border_color")??"#00d4ff";t.push(`box-shadow:0 0 8px ${s}, inset 0 0 6px ${s}`)}return e.blur&&t.push(`backdrop-filter:blur(${e.blur}px);-webkit-backdrop-filter:blur(${e.blur}px)`),t.join(";")}function St(e){const t=[];return t.push(`font-size:${e.font_size??_("font_size")??14}px`),e.color&&t.push(`color:${e.color}`),e.font_weight!=null&&t.push(`font-weight:${e.font_weight}`),e.font_family&&t.push(`font-family:${e.font_family}`),e.letter_spacing!=null&&t.push(`letter-spacing:${e.letter_spacing}px`),t.join(";")}function Zi(e,t,s){let i;if(e.entity.startsWith("virtual:")){const l=s.get(e.entity);if(l===void 0)return!0;i=String(l.value)}else{const l=t?.states[e.entity];if(!l)return!0;i=l.state}const n=Number(i),a=Number(e.value),r=Number.isFinite(n)&&Number.isFinite(a);switch(e.operator){case"==":return r?n===a:i===e.value;case"!=":return r?n!==a:i!==e.value;case">":return r&&n>a;case"<":return r&&n<a;case">=":return r&&n>=a;case"<=":return r&&n<=a;default:return!0}}function Oe(e,t){const s=t.trim();if(s==="mW")return{value:e/1e6,unit:"kW"};if(s==="W")return{value:e/1e3,unit:"kW"};if(s==="kW")return{value:e,unit:"kW"};if(s==="MW")return{value:e*1e3,unit:"kW"};if(s==="GW")return{value:e*1e6,unit:"kW"};if(s==="Wh")return{value:e/1e3,unit:"kWh"};if(s==="kWh")return{value:e,unit:"kWh"};if(s==="MWh")return{value:e*1e3,unit:"kWh"};if(s==="GWh")return{value:e*1e6,unit:"kWh"};if(s==="kWh/h")return{value:e,unit:"kW"};if(s==="Wh/h")return{value:e/1e3,unit:"kW"};if(s==="mL"||s==="ml")return{value:e/1e3,unit:"L"};if(s==="L"||s==="l")return{value:e,unit:"L"};if(/^m[3³]$/.test(s))return{value:e*1e3,unit:"L"};if(/^f[tT][3³]$/.test(s))return{value:e*28.3168,unit:"L"};if(/^gal(lon)?s?$/i.test(s))return{value:e*3.78541,unit:"L"};if(/^imp\.?\s*gal(lon)?s?$/i.test(s))return{value:e*4.54609,unit:"L"};if(/^fl\.?\s*oz\.?s?$/i.test(s))return{value:e*.029574,unit:"L"};if(/^(pt|pint)s?$/i.test(s))return{value:e*.473176,unit:"L"};if(/^(qt|quart)s?$/i.test(s))return{value:e*.946353,unit:"L"};if(s==="mg")return{value:e/1e6,unit:"kg"};if(/^g$/.test(s))return{value:e/1e3,unit:"kg"};if(s==="kg")return{value:e,unit:"kg"};if(/^(t|tonne?)s?$/i.test(s))return{value:e*1e3,unit:"kg"};if(/^(lb|lbs|pound)s?$/i.test(s))return{value:e*.453592,unit:"kg"};if(/^oz$/.test(s))return{value:e*.02835,unit:"kg"};const i=s.lastIndexOf("/");if(i>0){const n=s.slice(0,i).trim(),a=s.slice(i+1).trim();if(n){let r=1,l=a;/^s(ec(ond)?s?)?$/i.test(a)?(r=3600,l="h"):/^(min|minute)s?$/i.test(a)&&(r=60,l="h");const{value:c,unit:p}=Oe(e*r,n);return{value:c,unit:`${p}/${l}`}}}return{value:e,unit:s}}function ke(e,t){const s=e.states[t];if(!s)return null;const i=Number(s.state);if(!Number.isFinite(i))return null;const n=s.attributes?.unit_of_measurement??"";return Oe(i,n)}function Ki(e,t,s){const i=new Map;if(!e||!t)return i;for(const n of e){if(n.op==="time_until"){const p=n.mode??_("virtual_mode")??"percent",u=n.value_entity??n.pct_entity??"",h=n.rate_entity??n.power_entity??"",d=ke(t,u);if(!d)continue;const g=d.value,b=t.states[h];if(!b)continue;const y=Number(b.state);if(!Number.isFinite(y))continue;const{recalc_above:x,recalc_below:f}=n;if((x!=null||f!=null)&&!(x!=null&&y>x||f!=null&&y<f)){const B=s?.get(`virtual:${n.id}`);if(B){i.set(`virtual:${n.id}`,B);continue}}const k=b.attributes?.unit_of_measurement??"",v=n.rate_unit_override??k,{value:w}=Oe(y,v);if(!Number.isFinite(w))continue;let $;if(n.capacity_entity){const T=ke(t,n.capacity_entity);if(!T)continue;$=T.value}else $=n.capacity??n.capacity_kwh??1;if(!Number.isFinite($)||$<=0)continue;let C,N;if(p==="absolute"?(C=w,N=$):(C=w/$*100,N=100),!Number.isFinite(C))continue;const z=n.label_max??n.label_full??_("virtual_label_max")??"Full",H=[{value:0,label:n.label_min??n.label_empty??_("virtual_label_min")??"Empty"},{value:N,label:z},...(n.triggers??[]).map(T=>({value:T.percent??T.value,label:T.label}))],W=Vi(g,C,H);if(W.direction==="none"||W.hours===null){const T=H.reduce((B,G)=>!B||Math.abs(G.value-g)<Math.abs(B.value-g)?G:B,void 0);i.set(`virtual:${n.id}`,{value:-1,unit:"duration",label:T?.label});continue}i.set(`virtual:${n.id}`,{value:W.hours,unit:"duration",label:W.label??void 0});continue}const a=n.inputs.map(p=>ke(t,p)).filter(p=>p!==null);if(a.length===0)continue;const r=a.map(p=>p.value);let l;switch(n.op){case"add":l=r.reduce((p,u)=>p+u,0);break;case"subtract":l=r.slice(1).reduce((p,u)=>p-u,r[0]);break;case"mean":l=r.reduce((p,u)=>p+u,0)/r.length;break;case"signed_net":l=(r[0]??0)-(r[1]??0);break;default:l=r[0]}const c=n.unit??a[0].unit;i.set(`virtual:${n.id}`,{value:l,unit:c})}return i}const et=["#00d4ff","#ff6b35","#7ecb20","#9b59b6","#f39c12","#e74c3c","#1abc9c","#e91e63"];function dt(e){const t=Math.abs(e);return t>=1e6?`${+(e/1e6).toPrecision(3)}M`:t>=1e3?`${+(e/1e3).toPrecision(3)}k`:t<10?`${+e.toPrecision(3)}`:`${Math.round(e)}`}function ds(e,t,s,i,n,a){if(!e.entity)return null;if(e.stat_period)return a.get(`${t}:${s}`)?.value??null;if(e.entity.startsWith("virtual:"))return n.get(e.entity)?.value??null;const r=i?.states[e.entity];if(!r)return null;const l=e.attribute?r.attributes?.[e.attribute]:r.state,c=Number(l);return Number.isFinite(c)?c:null}function hs(e,t){return e.label?e.label:e.entity?e.entity.startsWith("virtual:")?e.entity.replace("virtual:",""):t?.states[e.entity]?.attributes?.friendly_name??e.entity.split(".")[1]?.replace(/_/g," ")??e.entity:""}function _s(e,t,s,i,n){return e.stat_period?s.get(`${i}:${n}`)?.unit??"":!e.entity||e.entity.startsWith("virtual:")?"":t?.states[e.entity]?.attributes?.unit_of_measurement??""}function Ji(e,t,s,i){const n=e.width??_("graph_bar_v_width")??200,a=e.height??_("graph_bar_v_height")??130,r=e.graph_show_axes??_("graph_show_axes")??!0,l=r?32:2,c=r?22:2,p=6,h=n-l-4,d=a-p-c,g=Math.max(t.length,1),b=t.filter(C=>C!==null&&Number.isFinite(C)),y=e.graph_min??Math.min(0,...b),x=e.graph_max??(b.length?Math.max(...b):1),f=x-y||1,k=Math.max(2,Math.floor(h/g*.2)),v=(h-k*(g-1))/g,w=C=>d-(C-y)/f*d,$=w(Math.max(y,0));return o`<div style="width:100%;overflow:hidden">${P`<svg viewBox="0 0 ${n} ${a}" width="100%" height="${a}" style="display:block;overflow:visible">
    ${r?P`
      <line x1="${l}" y1="${p}" x2="${l}" y2="${p+d}" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
      ${[0,.5,1].map(C=>{const N=y+C*f,z=p+w(N);return P`
          <line x1="${l}" y1="${z}" x2="${l+h}" y2="${z}" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
          <text x="${l-4}" y="${z+3}" text-anchor="end" fill="rgba(255,255,255,0.45)" font-size="9">${dt(N)}</text>`})}
      ${i?P`<text x="${l-4}" y="${p-1}" text-anchor="end" fill="rgba(255,255,255,0.3)" font-size="8">${i}</text>`:m}
    `:m}
    ${t.map((C,N)=>{const z=e.graph_series?.[N]?.color??et[N%et.length],M=l+N*(v+k),H=s[N]??"";if(C===null||!Number.isFinite(C))return P`
        <rect x="${M}" y="${p+d-2}" width="${v}" height="2" fill="rgba(255,255,255,0.12)" rx="1"/>
        ${r?P`<text x="${M+v/2}" y="${p+d+14}" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="9">${H.length>8?H.slice(0,7)+"…":H}</text>`:m}`;const W=Math.max(Math.abs(w(C)-$),1),T=p+Math.min(w(C),$);return P`
        <rect x="${M}" y="${T}" width="${v}" height="${W}" fill="${z}" rx="2" opacity="0.85"/>
        ${r?P`<text x="${M+v/2}" y="${p+d+14}" text-anchor="middle" fill="rgba(255,255,255,0.55)" font-size="9">${H.length>8?H.slice(0,7)+"…":H}</text>`:m}`})}
    ${y<0&&x>0?P`<line x1="${l}" y1="${p+$}" x2="${l+h}" y2="${p+$}" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>`:m}
  </svg>`}</div>`}const nt=-135,It=135;function gt(e,t,s,i){const n=(i-90)*Math.PI/180;return[e+s*Math.cos(n),t+s*Math.sin(n)]}function Nt(e,t,s,i,n){const[a,r]=gt(e,t,s,i),[l,c]=gt(e,t,s,n),u=(n-i+360)%360>180?1:0;return`M ${a.toFixed(2)} ${r.toFixed(2)} A ${s} ${s} 0 ${u} 1 ${l.toFixed(2)} ${c.toFixed(2)}`}function Qi(e,t,s){const i=e.width??_("graph_gauge_width")??180,n=e.height??Math.round(i*.72),a=e.graph_min??_("graph_min")??0,r=e.graph_max??_("graph_max")??100,l=r-a||1,c=t!==null?Math.max(0,Math.min(1,(t-a)/l)):0,p=nt+c*270,u=Math.min((i-20)/2,(n-28)/(1+Math.sin(135*Math.PI/180))),h=i/2,d=n-14-u*Math.sin((It-90)*Math.PI/180),g=e.graph_series?.[0]?.color??et[0],b="rgba(255,255,255,0.12)",[y,x]=gt(h,d,u*.82,p),[f,k]=gt(h,d,u*.12,p+180),[v,w]=gt(h,d,u+10,nt),[$,C]=gt(h,d,u+10,It);return o`<div style="width:100%;overflow:hidden">${P`<svg viewBox="0 0 ${i} ${n}" width="100%" height="${n}" style="display:block">
    <path d="${Nt(h,d,u,nt,It)}" fill="none" stroke="${b}" stroke-width="8" stroke-linecap="round"/>
    ${t!==null?P`<path d="${Nt(h,d,u,nt,p)}" fill="none" stroke="${g}" stroke-width="8" stroke-linecap="round" opacity="0.85"/>`:m}
    <line x1="${f.toFixed(2)}" y1="${k.toFixed(2)}" x2="${y.toFixed(2)}" y2="${x.toFixed(2)}" stroke="${g}" stroke-width="2.5" stroke-linecap="round" opacity="0.9"/>
    <circle cx="${h}" cy="${d}" r="5" fill="${g}" opacity="0.9"/>
    ${t!==null?P`<text x="${h}" y="${d+u*.28}" text-anchor="middle" fill="white" font-size="${Math.round(u*.28)}" font-weight="600">${dt(t)}${s?P`<tspan font-size="${Math.round(u*.17)}" fill="rgba(255,255,255,0.6)"> ${s}</tspan>`:m}</text>`:m}
    <text x="${v.toFixed(1)}" y="${(w+12).toFixed(1)}" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="9">${dt(a)}</text>
    <text x="${$.toFixed(1)}" y="${(C+12).toFixed(1)}" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="9">${dt(r)}</text>
  </svg>`}</div>`}function tn(e,t,s){const i=e.width??_("graph_gauge_width")??180,n=e.height??Math.round(i*.72),a=e.graph_min??_("graph_min")??0,r=e.graph_max??_("graph_max")??100,l=r-a||1,c=t!==null?Math.max(0,Math.min(1,(t-a)/l)):0,p=nt+c*270,u=Math.min((i-20)/2,(n-28)/(1+Math.sin(135*Math.PI/180))),h=i/2,d=n-14-u*Math.sin((It-90)*Math.PI/180),g=u*.72,b=e.thresholds??[],[y,x]=gt(h,d,u+10,nt),[f,k]=gt(h,d,u+10,It),v=[];if(b.length===0){const w=e.graph_series?.[0]?.color??et[0];v.push(P`
      <path d="${Nt(h,d,u,nt,It)}" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="14"/>
      ${t!==null?P`<path d="${Nt(h,d,u,nt,p)}" fill="none" stroke="${w}" stroke-width="14" stroke-linecap="round" opacity="0.85"/>`:m}
    `)}else{const w=[...b].sort((N,z)=>N.value-z.value),$=[a,...w.map(N=>N.value),r],C=["rgba(255,255,255,0.1)",...w.map(N=>N.color)];for(let N=0;N<$.length-1;N++){const z=nt+($[N]-a)/l*270,M=nt+($[N+1]-a)/l*270;if(M<=z)continue;const H=t!==null&&$[N]<=t?C[N+1]:"rgba(255,255,255,0.08)";v.push(P`<path d="${Nt(h,d,u,z,Math.min(M,t!==null?p:z))}" fill="none" stroke="${H}" stroke-width="14" stroke-linecap="butt" opacity="0.85"/>`),v.push(P`<path d="${Nt(h,d,u,Math.min(M,t!==null?p:z),M)}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="14" stroke-linecap="butt"/>`)}}return o`<div style="width:100%;overflow:hidden">${P`<svg viewBox="0 0 ${i} ${n}" width="100%" height="${n}" style="display:block">
    ${v}
    <path d="${Nt(h,d,g,nt,It)}" fill="none" stroke="rgba(0,0,0,0.3)" stroke-width="2"/>
    ${t!==null?P`<text x="${h}" y="${d+u*.22}" text-anchor="middle" fill="white" font-size="${Math.round(u*.28)}" font-weight="600">${dt(t)}${s?P`<tspan font-size="${Math.round(u*.17)}" fill="rgba(255,255,255,0.6)"> ${s}</tspan>`:m}</text>`:m}
    <text x="${y.toFixed(1)}" y="${(x+12).toFixed(1)}" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="9">${dt(a)}</text>
    <text x="${f.toFixed(1)}" y="${(k+12).toFixed(1)}" text-anchor="middle" fill="rgba(255,255,255,0.4)" font-size="9">${dt(r)}</text>
  </svg>`}</div>`}function en(e,t,s,i){const n=e.width??_("graph_time_chart_width")??260,a=e.height??_("graph_time_chart_height")??120,r=e.graph_show_axes??_("graph_show_axes")??!0,l=r?32:2,c=r?18:2,p=6,h=n-l-4,d=a-p-c,g=t.flat();if(g.length===0)return o`<div style="width:100%;height:${a}px;display:flex;align-items:center;justify-content:center;opacity:.4;font-size:11px">No data</div>`;const b=Math.min(...g.map(T=>T.t)),y=Math.max(...g.map(T=>T.t)),x=y-b||1,f=g.map(T=>T.v),k=e.graph_min??Math.min(0,...f),v=e.graph_max??Math.max(...f),w=v-k||1,$=T=>l+(T-b)/x*h,C=T=>p+d-(T-k)/w*d,N=C(Math.max(k,0)),z=(y-b)/36e5,M=z<=24?6:z<=72?12:24,H=[],W=new Date(b);for(W.setMinutes(0,0,0),W.setHours(W.getHours()+M-(W.getHours()%M||M));W.getTime()<=y;)H.push(W.getTime()),W.setHours(W.getHours()+M);return o`<div style="width:100%;overflow:hidden">${P`<svg viewBox="0 0 ${n} ${a}" width="100%" height="${a}" style="display:block;overflow:visible">
    ${r?P`
      <line x1="${l}" y1="${p}" x2="${l}" y2="${p+d}" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
      ${[0,.25,.5,.75,1].map(T=>{const B=k+T*w,G=C(B);return P`
          <line x1="${l}" y1="${G}" x2="${l+h}" y2="${G}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
          <text x="${l-4}" y="${G+3}" text-anchor="end" fill="rgba(255,255,255,0.4)" font-size="8">${dt(B)}</text>`})}
      ${H.map(T=>{const B=$(T),I=`${new Date(T).getHours()}:00`;return P`
          <line x1="${B}" y1="${p}" x2="${B}" y2="${p+d}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
          <text x="${B}" y="${p+d+11}" text-anchor="middle" fill="rgba(255,255,255,0.35)" font-size="8">${I}</text>`})}
    `:m}
    ${t.map((T,B)=>{const G=e.graph_series?.[B]?.color??et[B%et.length],I=e.graph_stroke_width??_("graph_stroke_width")??1.5,q=T.filter(K=>Number.isFinite(K.v));if(q.length<2)return m;const Y=q.map(K=>`${$(K.t).toFixed(1)},${C(K.v).toFixed(1)}`).join(" ");if(i){const K=q[0],J=q[q.length-1],lt=`M ${$(K.t).toFixed(1)},${N.toFixed(1)} L ${Y} L ${$(J.t).toFixed(1)},${N.toFixed(1)} Z`,O=e.graph_fill_opacity??_("graph_fill_opacity")??.2;return P`
          <path d="${lt}" fill="${G}" opacity="${O}"/>
          <polyline points="${Y}" fill="none" stroke="${G}" stroke-width="${I}" stroke-linejoin="round" stroke-linecap="round" opacity="0.9"/>`}return P`<polyline points="${Y}" fill="none" stroke="${G}" stroke-width="${I}" stroke-linejoin="round" stroke-linecap="round" opacity="0.9"/>`})}
    ${k<0&&v>0?P`<line x1="${l}" y1="${N}" x2="${l+h}" y2="${N}" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>`:m}
    ${(e.graph_show_legend??_("graph_show_legend")??!1)&&s.some(Boolean)?s.map((T,B)=>{const G=e.graph_series?.[B]?.color??et[B%et.length];return P`<rect x="${l+B*70}" y="${p+2}" width="10" height="3" fill="${G}" rx="1"/>
        <text x="${l+B*70+13}" y="${p+6}" fill="rgba(255,255,255,0.6)" font-size="8">${T}</text>`}):m}
  </svg>`}</div>`}function sn(e,t,s,i){const n=e.width??_("graph_bar_v_width")??200,a=e.height??_("graph_bar_v_height")??130,r=e.graph_show_axes??_("graph_show_axes")??!0,l=r?32:4,c=r?10:4,p=6,u=r?20:4,h=n-l-c,d=a-p-u,b=t.filter(v=>v!==null&&Number.isFinite(v)&&v>0).reduce((v,w)=>v+w,0)||1,y=Math.min(h*.6,40),x=l+(h-y)/2;let f=p+d;const k=t.map((v,w)=>{const $=e.graph_series?.[w]?.color??et[w%et.length];if(v===null||!Number.isFinite(v)||v<=0)return{color:$,h:0,y:f,lbl:s[w]??"",v:v??0};const C=v/b*d;return f-=C,{color:$,h:C,y:f,lbl:s[w]??"",v}});return o`<div style="width:100%;overflow:hidden">${P`<svg viewBox="0 0 ${n} ${a}" width="100%" height="${a}" style="display:block;overflow:visible">
    ${r?P`
      ${i?P`<text x="${l-4}" y="${p-1}" text-anchor="end" fill="rgba(255,255,255,0.3)" font-size="8">${i}</text>`:m}
      <line x1="${l}" y1="${p}" x2="${l}" y2="${p+d}" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
      ${[0,.5,1].map(v=>{const w=v*b,$=p+d-v*d;return P`
          <line x1="${l}" y1="${$}" x2="${l+h}" y2="${$}" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
          <text x="${l-4}" y="${$+3}" text-anchor="end" fill="rgba(255,255,255,0.4)" font-size="8">${dt(w)}</text>`})}
    `:m}
    ${k.map(v=>v.h>0?P`
      <rect x="${x.toFixed(1)}" y="${v.y.toFixed(1)}" width="${y.toFixed(1)}" height="${v.h.toFixed(1)}" fill="${v.color}" opacity="0.85" rx="1"/>
      ${v.h>10?P`<text x="${(x+y/2).toFixed(1)}" y="${(v.y+v.h/2+3).toFixed(1)}" text-anchor="middle" fill="rgba(255,255,255,0.8)" font-size="8">${v.lbl.length>8?v.lbl.slice(0,7)+"…":v.lbl}</text>`:m}
    `:m)}
  </svg>`}</div>`}function nn(e,t){const s=e.width??_("graph_time_chart_width")??260,i=e.height??36;if(t.length<1)return o`<div style="width:${s}px;height:${i}px"/>`;const n=t[0].t,a=t[t.length-1].t,r=a-n||1,l=p=>(p-n)/r*s,c=t.map((p,u)=>{const h=l(p.t),d=u+1<t.length?l(t[u+1].t):s,g=Math.abs(Math.round(p.v))%et.length;return{x1:h,x2:d,color:e.graph_series?.[g]?.color??et[g]}});return o`<div style="width:100%;overflow:hidden">${P`<svg viewBox="0 0 ${s} ${i}" width="100%" height="${i}" style="display:block">
    ${c.map(p=>P`
      <rect x="${p.x1.toFixed(1)}" y="0" width="${Math.max(p.x2-p.x1,.5).toFixed(1)}" height="${i}" fill="${p.color}" opacity="0.8"/>
    `)}
  </svg>`}</div>`}function an(e,t,s,i,n){const a=e.graph_series??[],r=e.graph_type??_("graph_type")??"bar";if(r==="gauge-needle"||r==="gauge"){const u=a[0],h=u?ds(u,e.id,0,t,s,i):null,d=u?_s(u,t,i,e.id,0):"";return r==="gauge-needle"?Qi(e,h,d):tn(e,h,d)}if(r==="stat-line"||r==="line"||r==="area"){const u=a.map((d,g)=>n.get(`${e.id}:${g}`)??[]),h=a.map(d=>hs(d,t));return en(e,u,h,r==="area")}if(r==="state-timeline"){const u=n.get(`${e.id}:0`)??[];return nn(e,u)}const l=a.map((u,h)=>ds(u,e.id,h,t,s,i)),c=a.map(u=>hs(u,t)),p=a.length>0?_s(a[0],t,i,e.id,0):"";return r==="bar-stacked"?sn(e,l,c,p):Ji(e,l,c,p)}function on(e,t,s,i){if(!e.entity)return 0;if(e.stat_period)return i.get(e.id)?.value??0;if(e.entity.startsWith("virtual:"))return s.get(e.entity)?.value??0;const n=t?.states[e.entity];if(!n)return 0;const a=e.attribute?n.attributes?.[e.attribute]:n.state;return Number(a)||0}function Ct(e,t,s,i,n,a=new Map,r=new Map,l){if(e.type==="blank")return o`<div style="height:${e.blank_gap??10}px"></div>`;if(e.type==="rule")return o`<hr style="border:none;border-top:2px solid currentColor;width:80%;margin:0;opacity:0.4">`;if(e.type==="graph")return an(e,n,s,a,r);if(e.type==="svg"){const f=e.margin,k=f!=null?e.dock==="right"?`margin-left:${f}px;`:e.dock==="left"?`margin-right:${f}px;`:`margin-top:${f}px;margin-bottom:${f}px;`:"";let v;if(e.tank_pct_entity&&n){const z=parseFloat(n.states[e.tank_pct_entity]?.state??"");Number.isFinite(z)&&(v=Math.max(0,Math.min(100,z)))}else if(e.tank_volume_entity&&n){const z=parseFloat(n.states[e.tank_volume_entity]?.state??""),M=e.tank_capacity_entity?parseFloat(n.states[e.tank_capacity_entity]?.state??""):e.tank_capacity;Number.isFinite(z)&&M!=null&&Number.isFinite(M)&&M>0&&(v=Math.max(0,Math.min(100,z/M*100)))}const w=e.charging_entity?n?.states[e.charging_entity]?.state==="on":!1,$=o`<mc-fill
      .field=${e}
      .defaults=${i}
      .rawValue=${on(e,n,s,a)}
      .fillPct=${v}
      .entityUnit=${e.entity&&!e.entity.startsWith("virtual:")&&n?n.states[e.entity]?.attributes?.unit_of_measurement??"":""}
    ></mc-fill>`,C=e.height??100,N=w?o`<div style="position:relative;display:inline-block;line-height:0;">${$}<div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;font-size:${Math.round(C*.35)}px;pointer-events:none;text-shadow:0 0 4px rgba(0,0,0,0.8);">⚡</div></div>`:$;return k?o`<div style=${k}>${N}</div>`:N}const c=we(e,t,i),p=e.align??t.align??"left",u=e.tap_action&&e.tap_action.action!=="none",h=u&&l?f=>{f.stopPropagation(),l(e,e.tap_action.entity,"tap")}:void 0,d=u?"cursor:pointer;":"";if(e.type==="icon"){const f=c.font_size??_("icon_size")??20,k=c.color??"";return o`<ha-icon
      icon=${e.icon??""}
      style="${d}--mdc-icon-size:${f}px;${k?`color:${k}`:""}"
      @click=${h}
    ></ha-icon>`}if(e.type==="label")return o`<span
      class="ec-label"
      style="${d}${St(c)};text-align:${p}"
      @click=${h}
      >${e.text??""}</span
    >`;const{value:g,unit:b}=Gi(n,e,i,s,a);let y=g;if(e.hide_below!==void 0){const f=parseFloat(y);if(Number.isFinite(f)&&Math.abs(f)<e.hide_below)return m}if(e.show_time_until_label&&!e.time_until_layout?.length&&e.entity?.startsWith("virtual:")){const f=s.get(e.entity)?.label;f&&(y=`${f}: ${g}`)}if(e.time_until_layout?.length&&e.entity?.startsWith("virtual:")){const f=s.get(e.entity),k=f?.label??"",v=we({...e,type:"label"},t,i),w=t.field_gap??i?.field_gap??_("field_gap")??4;if(f&&f.value<0)return o`<span class="ec-label" style="${St(v)}">${k}</span>`;const $=[[]];for(const M of e.time_until_layout)M.type==="newline"?$.push([]):$[$.length-1].push(M);const C=$.filter(M=>M.length>0),N=M=>M.type==="text"?o`<span class="ec-label" style="${St(v)}">${M.text??""}</span>`:M.type==="label"?o`<span class="ec-label" style="${St(v)}">${k}</span>`:M.type==="value"?o`<span class="ec-value" style="${d}${St(c)}" @click=${h}>${y}${b?o`<span class="ec-unit">${b}</span>`:m}</span>`:m,z=M=>o`<span style="display:inline-flex;align-items:baseline;gap:${w}px;">${M.map(N)}</span>`;return C.length===1?z(C[0]):o`<div style="display:flex;flex-direction:column;align-items:${_t(p)};gap:${w}px;">${C.map(z)}</div>`}const x=o`<span
    class="ec-value"
    style="${d}${St(c)};text-align:${p}"
    @click=${h}
    >${y}${b?o`<span class="ec-unit">${b}</span>`:m}</span
  >`;if(e.label){const f=we({...e,type:"label"},t,i),k=t.field_gap??i?.field_gap??_("field_gap")??4,v=e.label_position??_("label_position")??"above",w=v==="left"||v==="right",$=w?"row":"column",C=w?"baseline":_t(p),N=o`<span class="ec-label" style="${St(f)};text-align:${p}">${e.label}</span>`;return o`<div style="display:flex;flex-direction:${$};align-items:${C};gap:${k}px;">${v==="below"||v==="right"?[x,N]:[N,x]}</div>`}return x}function rn(e,t,s,i,n=new Map,a=new Map,r=new Map,l){const c={...s?.card,...t?.card,...e.box},p=e.columns??t?.columns??_("columns")??2,u=e.field_gap??t?.field_gap??s?.field_gap??_("extended_field_gap")??8,h=e.align??_("align")??"left",d={...s,label:{...s?.label,...t?.label},value:{...s?.value,...t?.value},field_gap:t?.field_gap??s?.field_gap,column_gap:e.column_gap??t?.column_gap??s?.column_gap},g={id:e.id,label_style:e.label_style,value_style:e.value_style,align:h},b=[];e.fields.forEach((v,w)=>{v.type==="value"&&v.label&&v.label_column!=null?(b.push({f:{...v,type:"label",text:v.label,column:v.label_column},i:w-.5}),b.push({f:{...v,label:void 0},i:w})):b.push({f:v,i:w})});const y=b.filter(v=>v.f.column!=null),x=b.filter(v=>v.f.column==null),f=Math.ceil(x.length/p)||1,k=Array.from({length:p},()=>[]);return x.forEach((v,w)=>{const $=Math.min(p-1,Math.floor(w/f));k[$].push(v)}),y.forEach(v=>{const w=Math.min(p,Math.max(1,v.f.column))-1;k[w].push(v)}),k.forEach(v=>v.sort((w,$)=>w.i-$.i)),o`
    <div class="ec-ext-card" style="${pe(c)}">
      ${e.name?o`<div class="ec-ext-title">${e.name}</div>`:m}
      <div class="ec-ext-grid" style="display:flex;align-items:flex-start;gap:${u}px;">
        ${k.map(v=>o`
          <div style="flex:1 1 0;min-width:0;display:flex;flex-direction:column;gap:${u}px;">
            ${v.map(({f:w})=>Ct(w,g,n,d,i,a,r,l))}
          </div>
        `)}
      </div>
    </div>
  `}function ln(e,t){return e?.length?o`${e.map(s=>{const i=He[s.anchor??"top-left"],n=["position:absolute",`left:${s.position.x*100}%`,`top:${s.position.y*100}%`,`width:${s.width}px`,`height:${s.height}px`,`transform:${i}`,s.color?`background:${s.color}`:"",s.radius?`border-radius:${s.radius}px`:"",s.tap_action||s.hold_action||s.double_tap_action?"cursor:pointer":"","box-sizing:border-box"].filter(Boolean).join(";");return o`<div
      class="ec-zone"
      data-zone-id="${s.id}"
      style=${n}
      @click=${a=>{!s.tap_action||s.tap_action.action==="none"||!t||(a.stopPropagation(),t(s,s.tap_action.entity,"tap"))}}
    ></div>`})}`:o``}function ms(e,t,s,i=new Map,n=new Map,a=new Map,r,l=!1,c=!1){if(!c&&e.visible_when&&!Zi(e.visible_when,s,i))return o``;const p=e.tap_action&&e.tap_action.action!=="none",u=p&&!l&&r?I=>{I.stopPropagation(),r(e,e.tap_action.entity,"tap")}:void 0,h=Yi(e,t),d=e.field_gap??t?.field_gap??_("field_gap")??4,g=e.column_gap??t?.column_gap??_("column_gap")??3,b=e.align??_("align")??"left",y=e.columns??t?.card_columns??_("card_columns")??1,x=e.fields.filter(I=>I.dock==="left"),f=e.fields.filter(I=>I.dock==="right"),k=e.fields.filter(I=>!I.dock),v=x.length>0||f.length>0,w=!!e.bg?.url,$=l?["position:relative",e.width!=null?`width:${e.width}px`:"","box-sizing:border-box",e.transparent?"":pe(h)].filter(Boolean).join(";"):["position:absolute",`left:${e.position.x*100}%`,`top:${e.position.y*100}%`,`transform:${He[e.anchor??_("anchor")??"top-left"]}`,e.width!=null?`width:${e.width}px`:"","box-sizing:border-box",e.transparent?"":pe(h),p?"cursor:pointer":""].filter(Boolean).join(";"),C=(()=>{if(!e.bg?.url)return m;const I=e.bg,q=I.padding_top??0,Y=I.padding_right??0,K=I.padding_bottom??0,J=I.padding_left??0,lt=I.fit??"cover",O=I.opacity??1;if(I.width!=null||I.height!=null){const ot=I.width!=null?`width:${I.width}px`:"",_e=I.height!=null?`height:${I.height}px`:"";return o`<div style="grid-area:1/1;${ot};${_e};margin-top:${q}px;margin-left:${J}px;justify-self:start;align-self:start;background-image:url('${I.url}');background-size:${lt};background-position:center;background-repeat:no-repeat;opacity:${O};pointer-events:none"></div>`}return o`<div style="grid-area:1/1;padding:${q}px ${Y}px ${K}px ${J}px;background-image:url('${I.url}');background-size:${lt};background-position:center;background-repeat:no-repeat;background-origin:content-box;background-clip:content-box;opacity:${O};pointer-events:none"></div>`})(),N=[];let z=[];for(const I of k)I.column!=null&&I.column_end!=null&&I.column_end>I.column?(z.length&&(N.push({kind:"group",fields:z}),z=[]),N.push({kind:"span",field:I})):z.push(I);z.length&&N.push({kind:"group",fields:z});const M="display:flex;flex-direction:column;align-items:center;justify-content:center;flex-shrink:0",H=`display:flex;flex-direction:column;gap:${d}px;align-items:${_t(b)};flex:1;min-width:0`,W=I=>{const q=I.filter(O=>O.column==null),Y=I.filter(O=>O.column!=null),K=Math.ceil(q.length/y)||1,J=Array.from({length:y},()=>[]);q.forEach((O,ot)=>{J[Math.min(y-1,Math.floor(ot/K))].push(O)}),Y.forEach(O=>{J[Math.max(0,Math.min(y-1,O.column-1))].push(O)});const lt=`display:flex;flex-direction:column;gap:${d}px;align-items:${_t(b)}`;return o`<div style="display:flex;flex-direction:row;gap:${g}px;align-items:flex-start;justify-content:${_t(b)}">
      ${J.map(O=>O.length?o`<div style=${lt}>${O.map(ot=>Ct(ot,e,i,t,s,n,a,r))}</div>`:m)}
    </div>`},T=I=>o`<div style="display:flex;flex-direction:column;align-items:${_t(I.align??b)}">${Ct(I,e,i,t,s,n,a,r)}</div>`,B=()=>o`<div style="display:flex;flex-direction:column;gap:${d}px">
    ${N.map(I=>I.kind==="span"?T(I.field):W(I.fields))}
  </div>`;if(v){const I=y>1?o`<div style="flex:1;min-width:0">${B()}</div>`:o`<div style=${H}>${k.map(Y=>Ct(Y,e,i,t,s,n,a,r))}</div>`,q=o`
      ${x.length?o`<div style=${M}>${x.map(Y=>Ct(Y,e,i,t,s,n,a,r))}</div>`:m}
      ${k.length?I:m}
      ${f.length?o`<div style=${M}>${f.map(Y=>Ct(Y,e,i,t,s,n,a,r))}</div>`:m}`;return w?o`<div class="ec-card" data-card-id="${e.id}" style="${$};display:grid;overflow:hidden" @click=${u}>
        ${C}
        <div style="grid-area:1/1;display:flex;flex-direction:row;gap:${g}px;align-items:center">${q}</div>
      </div>`:o`<div class="ec-card" data-card-id="${e.id}" style="${$};display:flex;flex-direction:row;gap:${g}px;align-items:center" @click=${u}>${q}</div>`}if(y>1)return w?o`<div class="ec-card" data-card-id="${e.id}" style="${$};display:grid;overflow:hidden" @click=${u}>
        ${C}
        <div style="grid-area:1/1">${B()}</div>
      </div>`:o`<div class="ec-card" data-card-id="${e.id}" style="${$}" @click=${u}>${B()}</div>`;const G=e.fields.map(I=>Ct(I,e,i,t,s,n,a,r));return w?o`<div class="ec-card" data-card-id="${e.id}" style="${$};display:grid;overflow:hidden" @click=${u}>
      ${C}
      <div style="grid-area:1/1;display:flex;flex-direction:column;gap:${d}px;align-items:${_t(b)}">${G}</div>
    </div>`:o`<div class="ec-card" data-card-id="${e.id}" style="${$};display:flex;flex-direction:column;gap:${d}px;align-items:${_t(b)}" @click=${u}>${G}</div>`}const cn=Bt`
  .ec-card {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
    color: #fff;
    white-space: nowrap;
    line-height: 1.15;
  }
  .ec-label {
    display: block;
  }
  .ec-value {
    display: block;
  }
  .ec-unit {
    font-size: 0.7em;
    opacity: 0.85;
    margin-left: 0.15em;
  }

  /* ── Expand overlay ── */
  .ec-expand-backdrop {
    position: fixed;
    inset: 0;
    z-index: 999;
    background: rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ec-expand-panel {
    position: relative;
    width: 80%;
    height: 80%;
    overflow: auto;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ec-expand-card-wrap {
    flex-shrink: 0;
    transform-origin: center center;
    transition: transform 0.15s ease-out;
  }
  .ec-expand-close {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 2;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    padding: 4px 10px;
    cursor: pointer;
    font-size: 13px;
    line-height: 1.4;
  }
  .ec-expand-close:hover {
    background: rgba(0, 0, 0, 0.75);
  }

  /* ── Extended card overlay ── */
  .ec-extended-backdrop {
    position: absolute;
    inset: 0;
    z-index: 51;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .ec-extended-panel {
    position: relative;
    overflow: auto;
    border-radius: 8px;
    max-height: 85%;
  }
  .ec-ext-card {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
    color: #fff;
    line-height: 1.15;
    box-sizing: border-box;
  }
  .ec-ext-title {
    font-size: 15px;
    font-weight: 600;
    color: #fff;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  }
  .ec-ext-close {
    position: absolute;
    top: 8px;
    right: 8px;
    z-index: 2;
    background: rgba(0, 0, 0, 0.5);
    color: #fff;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 4px;
    padding: 4px 10px;
    cursor: pointer;
    font-size: 13px;
    line-height: 1.4;
  }
  .ec-ext-close:hover {
    background: rgba(0, 0, 0, 0.75);
  }
`;function Tt(e,t,s){let i;if(e.card!==void 0){const n=s?.[e.card];if(n!==void 0&&e.side!==void 0)i=ji(n,e.side);else{const a=t.find(r=>r.id===e.card);i=a?{x:a.position.x,y:a.position.y}:{x:0,y:0}}}else i={x:e.x??0,y:e.y??0};return{x:i.x+(e.dx??0),y:i.y+(e.dy??0)}}function gs(e,t){if(e.length<2)return"";if(t==="straight")return e.map((a,r)=>`${r===0?"M":"L"} ${a.x} ${a.y}`).join(" ");const s=12,i=[`M ${e[0].x} ${e[0].y}`];for(let a=1;a<e.length-1;a++){const r=e[a-1],l=e[a],c=e[a+1],p=l.x-r.x,u=l.y-r.y,h=Math.sqrt(p*p+u*u),d=c.x-l.x,g=c.y-l.y,b=Math.sqrt(d*d+g*g);if(h<s*2||b<s*2)i.push(`L ${l.x} ${l.y}`);else{const y=s/h,x=l.x-p*y,f=l.y-u*y,k=s/b,v=l.x+d*k,w=l.y+g*k;i.push(`L ${x.toFixed(2)} ${f.toFixed(2)}`),i.push(`Q ${l.x} ${l.y} ${v.toFixed(2)} ${w.toFixed(2)}`)}}const n=e[e.length-1];return i.push(`L ${n.x} ${n.y}`),i.join(" ")}function bs(e,t,s){const i=e.duration??_("flow_duration")??2;if(!e.entity||!t)return{duration:i,reverse:!1,hidden:!1};const n=t.states[e.entity],a=n?Number(n.state):NaN;if(!Number.isFinite(a))return{duration:i,reverse:!1,hidden:!1};const l=(n?.attributes?.unit_of_measurement??"")==="kW"?a*1e3:a,c=s?.power_unit==="kW"?l/1e3:l,p=Math.abs(c);if(e.min_power!==void 0&&p<e.min_power)return{duration:i,reverse:!1,hidden:!0};let u=c<0;e.invert&&(u=!u);const h=e.speed_min_value,d=e.speed_max_value;let g;if(h!==void 0&&d!==void 0&&d>h){const b=e.speed_min_duration??i,y=e.speed_max_duration??Math.max(.2,i*.1),x=Math.max(0,Math.min(1,(p-h)/(d-h)));g=b+x*(y-b)}else g=i;return{duration:g,reverse:u,hidden:!1}}function pn(e,t,s,i,n){const a=e.flows??[],r=e.cards??[],{totalW:l,totalH:c}=t,p=a.map(d=>{if((d.points??[]).length<2)return null;const g=d.points.map(b=>Tt(b,r,i)).map(b=>({x:b.x*l,y:b.y*c}));return{flow:d,pts:g}}).filter(d=>d!==null),u=p.filter(({flow:d})=>d.style!=="particles"),h=p.filter(({flow:d})=>d.style==="particles");return o`
    <svg
      class="ec-flows"
      viewBox="0 0 ${l} ${c}"
      preserveAspectRatio="none"
      style="position:absolute;inset:0;width:${l}px;height:${c}px;overflow:visible;pointer-events:none;"
    >
      ${u.map(({flow:d,pts:g})=>{const b=d.style??_("flow_style")??"dashes",y=d.forward_color??d.color??_("flow_color")??"#00d4ff",x=d.reverse_color??y,f=d.width??_("flow_width")??3,{duration:k,reverse:v,hidden:w}=bs(d,s,n),$=v?x:y,C=(Math.round(k*10)/10).toFixed(1),N=v?[...g].reverse():g,z=gs(N,d.curve??_("flow_curve")??"straight");return P`<path
          d=${z}
          class="ecf ecf-${b}"
          style="fill:none;stroke:${$};stroke-width:${f}px;stroke-linecap:round;--ecf-dur:${C}s;${w?"opacity:0;":""}"
        ></path>`})}
    </svg>
    <div
      class="ec-particles"
      style="position:absolute;inset:0;pointer-events:none;"
    >
      ${h.map(({flow:d,pts:g})=>{const b=d.forward_color??d.color??_("flow_color")??"#00d4ff",y=d.reverse_color??b,x=d.width??_("flow_width")??3,{duration:f,reverse:k,hidden:v}=bs(d,s,n),w=k?y:b;if(v)return m;const $=(Math.round(f*10)/10).toFixed(1),C=k?[...g].reverse():g,N=gs(C,d.curve??_("flow_curve")??"straight"),z=d.particle_count??_("flow_particle_count")??6;return Array.from({length:z},(M,H)=>{const W=-(H*Number($)/z).toFixed(3);return o`<div
            class="ecf-dot"
            style="offset-path:path('${N}');--ecf-dur:${$}s;animation-delay:${W}s;background:${w};width:${x*2}px;height:${x*2}px;"
          ></div>`})})}
    </div>
  `}const un=Bt`
  @keyframes ec-dash {
    to {
      stroke-dashoffset: -20;
    }
  }
  @keyframes ec-dash-fluid {
    to {
      stroke-dashoffset: -110;
    }
  }
  @keyframes ec-move {
    from {
      offset-distance: 0%;
    }
    to {
      offset-distance: 100%;
    }
  }

  .ecf {
    animation: ec-dash var(--ecf-dur, 2s) linear infinite;
  }
  .ecf-dashes {
    stroke-dasharray: 10 10;
  }
  .ecf-dots {
    stroke-dasharray: 1 12;
    stroke-linecap: round;
  }
  .ecf-fluid {
    stroke-dasharray: 30 80;
    animation-name: ec-dash-fluid;
  }

  .ecf-dot {
    position: absolute;
    border-radius: 50%;
    offset-rotate: 0deg;
    animation: ec-move var(--ecf-dur, 2s) linear infinite;
    box-shadow: 0 0 6px currentColor;
  }
`,Ge="0.50",Ds="21/07/2026",Me=1;function dn(e,t){const{type:s,...i}=e;return{ec_template:!0,version:Me,card_version:Ge,name:t.trim()||"Mosaic Canvas Template",exported:new Date().toISOString(),config:i}}function hn(e){const t=JSON.stringify(e,null,2),s=new Blob([t],{type:"application/json"}),i=URL.createObjectURL(s),n=document.createElement("a");n.href=i,n.download=`${e.name.replace(/[^a-z0-9]+/gi,"_").toLowerCase()}.json`,document.body.appendChild(n),n.click(),document.body.removeChild(n),URL.revokeObjectURL(i)}function _n(e){let t;try{t=JSON.parse(e)}catch{return{template:null,error:"Invalid JSON — could not parse file."}}if(typeof t!="object"||t===null||!t.ec_template)return{template:null,error:"Not a valid Mosaic Canvas template file."};const s=t;return typeof s.version!="number"?{template:null,error:"Template is missing a version number."}:s.version>Me?{template:null,error:`Template schema v${s.version} is newer than this card supports (v${Me}). Update the card first.`}:{template:s,error:null}}function mn(e,t){return{type:t,...e.config}}var gn=Object.defineProperty,bn=Object.getOwnPropertyDescriptor,F=(e,t,s,i)=>{for(var n=i>1?void 0:i?bn(t,s):t,a=e.length-1,r;a>=0;a--)(r=e[a])&&(n=(i?r(t,s,n):r(n))||n);return i&&n&&gn(t,s,n),n};function j(e){return Math.round(e*10)/10}function R(e){return Math.round(e*1e4)/1e4}function vs(e,t,s,i,n){const a=(e.split(".")[1]??"sensor").replace(/_/g," "),r=t.replace(/_/g," "),l=["# Add to configuration.yaml","sensor:","  - platform: statistics",`    name: "${a} ${r}"`,`    entity_id: ${e}`,`    state_characteristic: ${t}`];s&&(l.push("    max_age:"),l.push(`      hours: ${s}`)),i&&l.push(`    sampling_size: ${i}`),t==="percentile"&&n&&l.push(`    percentile: ${n}`);const c=`${e.split(".")[1]??"sensor"}_${t}`;return l.push(""),l.push("# Then set the field entity to:"),l.push(`# sensor.${c}`),l.join(`
`)}const vn=[{value:"average_linear",label:"Average (linear)",group:"Averages"},{value:"average_step",label:"Average (step)",group:"Averages",binary:!0},{value:"average_timeless",label:"Average (timeless)",group:"Averages",binary:!0},{value:"mean",label:"Mean",group:"Averages",binary:!0},{value:"mean_circular",label:"Mean (circular)",group:"Averages"},{value:"median",label:"Median",group:"Averages"},{value:"value_max",label:"Value maximum",group:"Extremes"},{value:"value_min",label:"Value minimum",group:"Extremes"},{value:"distance_absolute",label:"Range (max − min)",group:"Extremes"},{value:"standard_deviation",label:"Standard deviation",group:"Spread"},{value:"variance",label:"Variance",group:"Spread"},{value:"noisiness",label:"Noisiness",group:"Spread"},{value:"percentile",label:"Percentile",group:"Spread"},{value:"distance_95_percent_of_values",label:"Distance 95% of values",group:"Spread"},{value:"distance_99_percent_of_values",label:"Distance 99% of values",group:"Spread"},{value:"change",label:"Change",group:"Change"},{value:"change_sample",label:"Change per sample",group:"Change"},{value:"change_second",label:"Change per second",group:"Change"},{value:"sum",label:"Sum",group:"Sums"},{value:"sum_differences",label:"Sum of differences",group:"Sums"},{value:"sum_differences_nonnegative",label:"Sum of differences (positive)",group:"Sums"},{value:"total",label:"Total",group:"Sums"},{value:"count",label:"Count (samples)",group:"Counts",binary:!0},{value:"count_on",label:"Count (on)",group:"Counts",binary:!0},{value:"count_off",label:"Count (off)",group:"Counts",binary:!0},{value:"datetime_newest",label:"Timestamp (newest)",group:"Timestamps"},{value:"datetime_oldest",label:"Timestamp (oldest)",group:"Timestamps",binary:!0},{value:"datetime_value_max",label:"Timestamp (at max)",group:"Timestamps"},{value:"datetime_value_min",label:"Timestamp (at min)",group:"Timestamps"}],Se=["top-left","top","top-right","left","center","right","bottom-left","bottom","bottom-right"],ne=["left","center","right"],fs=["value","label","icon","svg","blank","rule"],Ce={value:"Value",label:"Label",icon:"Icon",svg:"Element Library",graph:"Graph / Gauge",blank:"Blank",rule:"Horizontal Rule"},ys={value:"mdi:function-variant",label:"mdi:format-title",icon:"mdi:image",svg:"mdi:shape-outline",graph:"mdi:chart-line",blank:"mdi:crop-square-outline",rule:"mdi:minus"},Ne=[{value:"stat-line",label:"Statistics — Line"},{value:"bar",label:"Statistics — Bar"},{value:"bar-stacked",label:"Statistics — Bar (stacked)"},{value:"line",label:"History — Line (with unit)"},{value:"state-timeline",label:"History — State timeline"},{value:"gauge",label:"Arc Gauge"},{value:"gauge-needle",label:"Arc Gauge (Needle)"}],$s=(()=>{try{return new URL("./",import.meta.url).href}catch{return"/local/community/mosaic-canvas-card/"}})(),fn=[{type:"alarm-panel",name:"Alarm Panel"},{type:"button",name:"Button"},{type:"calendar",name:"Calendar"},{type:"entities",name:"Entities"},{type:"entity",name:"Entity"},{type:"entity-filter",name:"Entity Filter"},{type:"gauge",name:"Gauge"},{type:"glance",name:"Glance"},{type:"history-graph",name:"History Graph"},{type:"horizontal-stack",name:"Horizontal Stack"},{type:"humidifier",name:"Humidifier"},{type:"iframe",name:"iFrame"},{type:"light",name:"Light"},{type:"logbook",name:"Logbook"},{type:"map",name:"Map"},{type:"markdown",name:"Markdown"},{type:"media-control",name:"Media Control"},{type:"picture",name:"Picture"},{type:"picture-elements",name:"Picture Elements"},{type:"picture-entity",name:"Picture Entity"},{type:"picture-glance",name:"Picture Glance"},{type:"plant-status",name:"Plant Status"},{type:"sensor",name:"Sensor"},{type:"shopping-list",name:"Shopping List"},{type:"statistics-graph",name:"Statistics Graph"},{type:"thermostat",name:"Thermostat"},{type:"tile",name:"Tile"},{type:"todo-list",name:"To-do List"},{type:"vertical-stack",name:"Vertical Stack"},{type:"weather-forecast",name:"Weather Forecast"},{type:"webpage",name:"Webpage"}];function yn(e){try{const t=document.createElement("div");t.style.color=e,t.style.display="none",document.body.appendChild(t);const s=getComputedStyle(t).color;document.body.removeChild(t);const i=s.match(/\d+/g)?.map(Number);return!i||i.length<3?"#000000":"#"+i.slice(0,3).map(n=>n.toString(16).padStart(2,"0")).join("")}catch{return"#000000"}}let S=class extends bt{constructor(){super(...arguments),this._selCard=0,this._selField=-1,this._selCards=new Set,this._selEmbCards=new Set,this._selFlow=-1,this._showAddFlowInput=!1,this._newFlowName="",this._pendingFlowIdx=-1,this._showFlowCompleteModal=!1,this._selPoint=-1,this._selSeries=-1,this._selVirtual=-1,this._selVirtualInput=-1,this._selTrigger=-1,this._selZone=-1,this._selExtCard=0,this._selExtField=-1,this._templateName="",this._templateError="",this._previewBoxes={},this._previewExpanded=!1,this._barAtTop=localStorage.getItem("mc-expanded-bar-top")==="1",this._onWindowResize=()=>this._sizeExpandedCanvas(),this._pickerStyleScheduled=!1,this._pickerStyleRetries=0,this._copiedFields=null,this._copySourceIdx=-1,this._virtualClipboard=null,this._copiedField=null,this._copiedFieldSrc=null,this._dragSrc=null,this._cpOpenId=null,this._cpOpenAbove=!1,this._ggOpen=!1,this._ggTarget=null,this._wizStep=-1,this._wiz={cardType:"",source:"auto",sunEntity:"sun.sun",dayImg:"",nightImg:"",evCount:0,evImgs:[],bgCount:"single",bgSwitchMode:"sun",bgEntity:"",singleImg:""},this._wizardShown=!1,this._dragCard=-1,this._startX=0,this._startY=0,this._dragMembers=[],this._embDragMembers=[],this._dragPoint=-1,this._pStartX=0,this._pStartY=0,this._pStartPos={x:0,y:0},this._snapAxis=null,this._snapAnchor=null,this._dragZone=-1,this._zStartX=0,this._zStartY=0,this._zStartPos={x:0,y:0},this._resizeZone=-1,this._resizeCorner="br",this._zResizeStartBox={x:0,y:0,w:0,h:0},this._bgSelected=!1,this._bgMode=null,this._bgStartX=0,this._bgStartY=0,this._bgStart={L:0,T:0,baseW:0,baseH:0,totalW:0,totalH:0},this._selEmbCard=-1,this._dragEmbCard=-1,this._ecStartX=0,this._ecStartY=0,this._embEditorOpen=!1,this._embEditorYaml="",this._embNativeEditor=null,this._embEditorIdx=-1,this._embEditorConfig=null,this._embPickerOpen=!1,this._embPickerSearch="",this._embPickerTargetIdx=-1,this._navTab="cards",this._navPanel="",this._navPath=[],this._resetToWizard=()=>{window.confirm(`Reset all configuration and restart the setup wizard?

This will clear all cards, flows, zones, and background settings.`)&&(this._wiz={cardType:"",source:"auto",sunEntity:"sun.sun",dayImg:"",nightImg:"",evCount:0,evImgs:[],bgCount:"single",bgSwitchMode:"sun",bgEntity:"",singleImg:""},this._wizStep=0,this._emit({type:this._config.type,background:{},canvas:{},defaults:{font_family:"sans-serif",card:{background:"rgba(8,18,28,0.55)",border:!0,color:"#00d4ff",radius:10,padding:8},label:{font_size:13,color:"#cccccc"},value:{font_size:22,color:"#ffffff",font_weight:600}},cards:[]}))}}_navPush(e,t){this._navPath=[...this._navPath,{key:e,label:t}]}setConfig(e){let t=!1;const s=a=>{let r=!1;const l=a.map(c=>c.column==null?(t=!0,r=!0,{...c,column:1}):c);return r?l:a},i=(e.cards??[]).map(a=>{const r=s(a.fields);return r===a.fields?a:{...a,fields:r}}),n=(e.extended_cards??[]).map(a=>{const r=s(a.fields);return r===a.fields?a:{...a,fields:r}});if(t&&(e={...e,cards:i,...e.extended_cards?{extended_cards:n}:{}}),this._config=e,t&&this._emit(e),!this._wizardShown){this._wizardShown=!0;const a=!e.background?.images?.day&&!e.background?.images?.night,r=(e.cards??[]).length===0;a&&r&&(this._wizStep=0)}}_emit(e){this._config=e,this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:e},bubbles:!0,composed:!0}))}_finishWizard(){if(!this._config)return;const e=this._wiz;let t;if(e.cardType==="energy"){if(e.source!=="none"){t={source:e.source},e.source==="auto"&&(t.sun_entity=e.sunEntity||"sun.sun");const i={},n={};e.dayImg&&(i[0]=e.dayImg),e.nightImg&&e.source==="auto"&&(n[0]=e.nightImg);for(let a=0;a<e.evCount;a++){const r=e.evImgs[a];r?.day&&(i[String(a+1)]=r.day),r?.night&&e.source==="auto"&&(n[String(a+1)]=r.night)}t.images={},Object.keys(i).length>0&&(t.images.day=i),Object.keys(n).length>0&&(t.images.night=n)}}else if(e.bgCount==="single"&&e.singleImg)t={source:"day",images:{day:{0:e.singleImg}}};else if(e.bgCount==="multiple"){t=e.bgSwitchMode==="sun"?{source:"auto",sun_entity:e.sunEntity||"sun.sun"}:{source:"entity",mode_entity:e.bgEntity};const i={},n={};e.dayImg&&(i[0]=e.dayImg),e.nightImg&&(n[0]=e.nightImg),t.images={},Object.keys(i).length>0&&(t.images.day=i),Object.keys(n).length>0&&(t.images.night=n)}const s={...this._config};t&&(s.background=t),e.cardType==="energy"&&e.evCount>0&&(s.ev_count=e.evCount),this._wizStep=-1,this._emit(s)}_renderWizard(){const e=this._wizStep,t=this._wiz,s=n=>{this._wiz={...t,...n}},i=n=>{this._wizStep=n};return o`
      <div class="ec-wizard">
        ${e===0?o`
          <div class="ec-wiz-welcome">
            <div class="ec-wiz-icon">🎨</div>
            <h2 class="ec-wiz-title">Welcome to Mosaic Canvas Card</h2>
            <p class="ec-wiz-desc">A few quick questions will tailor the setup to your use case — or skip to jump straight into the editor.</p>
            <div class="ec-wiz-row ec-wiz-end">
              <button class="ec-wiz-btn-ghost" @click=${()=>this._finishWizard()}>Skip setup</button>
              <button class="ec-wiz-btn-primary" @click=${()=>i(1)}>Get started →</button>
            </div>
          </div>

        `:e===1?o`
          <h3 class="ec-wiz-heading">What will this card be used for?</h3>
          <p class="ec-wiz-desc">This determines what setup options you'll be asked about.</p>
          <div class="ec-wiz-type-grid">
            <button class="ec-wiz-type-btn${t.cardType==="energy"?" selected":""}"
              @click=${()=>s({cardType:"energy"})}>
              <span class="ec-wiz-type-icon">⚡</span>
              <span class="ec-wiz-type-title">Energy Dashboard</span>
              <span class="ec-wiz-type-desc">Solar, battery, grid flows with day/night switching and EV variants</span>
            </button>
            <button class="ec-wiz-type-btn${t.cardType==="general"?" selected":""}"
              @click=${()=>s({cardType:"general"})}>
              <span class="ec-wiz-type-icon">🗺️</span>
              <span class="ec-wiz-type-title">General Purpose</span>
              <span class="ec-wiz-type-desc">Any layout over a background image — floor plan, status board, custom display</span>
            </button>
          </div>
          <div class="ec-wiz-row ec-wiz-space">
            <button class="ec-wiz-btn-ghost" @click=${()=>i(0)}>← Back</button>
            <button class="ec-wiz-btn-primary" ?disabled=${!t.cardType}
              @click=${()=>i(t.cardType==="energy"?2:20)}>Next →</button>
          </div>

        `:e===2?o`
          <h3 class="ec-wiz-heading">Background</h3>
          <div class="ec-wiz-field">
            <label class="ec-wiz-label">Day/night switching</label>
            <select class="ec-wiz-select" .value=${t.source}
              @change=${n=>s({source:n.target.value})}>
              <option value="auto">Auto — follows sun entity</option>
              <option value="day">Day only — no switching</option>
              <option value="none">No background image</option>
            </select>
          </div>
          ${t.source==="auto"?o`
            <div class="ec-wiz-field">
              <label class="ec-wiz-label">Sun entity</label>
              <ha-entity-picker .hass=${this.hass} .value=${t.sunEntity} allow-custom-entity
                @value-changed=${n=>s({sunEntity:n.detail.value})}
              ></ha-entity-picker>
            </div>
          `:m}
          ${t.source!=="none"?o`
            <div class="ec-wiz-field">
              <label class="ec-wiz-label">Day image URL</label>
              <input class="ec-wiz-input" type="text" placeholder="/local/energy-day.jpg"
                .value=${t.dayImg} @input=${n=>s({dayImg:n.target.value})}/>
            </div>
          `:m}
          ${t.source==="auto"?o`
            <div class="ec-wiz-field">
              <label class="ec-wiz-label">Night image URL</label>
              <input class="ec-wiz-input" type="text" placeholder="/local/energy-night.jpg"
                .value=${t.nightImg} @input=${n=>s({nightImg:n.target.value})}/>
            </div>
          `:m}
          <div class="ec-wiz-row ec-wiz-space">
            <button class="ec-wiz-btn-ghost" @click=${()=>i(1)}>← Back</button>
            <button class="ec-wiz-btn-primary" @click=${()=>i(3)}>Next →</button>
          </div>

        `:e===3?o`
          <h3 class="ec-wiz-heading">EV Variants <span class="ec-wiz-optional">(optional)</span></h3>
          <p class="ec-wiz-desc">Show different backgrounds based on how many EVs are home charging.</p>
          <div class="ec-wiz-field">
            <label class="ec-wiz-label">EV charging slots (0 = no EV switching)</label>
            <input class="ec-wiz-input ec-wiz-input--short" type="number" min="0" max="3"
              .value=${String(t.evCount)}
              @input=${n=>{const a=Math.max(0,Math.min(3,parseInt(n.target.value)||0)),r=Array.from({length:a},(l,c)=>t.evImgs[c]??{day:"",night:""});s({evCount:a,evImgs:r})}}/>
          </div>
          ${t.evImgs.map((n,a)=>o`
            <div class="ec-wiz-ev-group">
              <div class="ec-wiz-ev-label">${a+1} EV${a>0?"s":""} charging</div>
              ${t.source!=="none"?o`
                <div class="ec-wiz-field">
                  <label class="ec-wiz-label">Day image</label>
                  <input class="ec-wiz-input" type="text" .placeholder=${`/local/energy-day-${a+1}ev.jpg`}
                    .value=${n.day}
                    @input=${r=>{const l=t.evImgs.map((c,p)=>p===a?{...c,day:r.target.value}:c);s({evImgs:l})}}/>
                </div>
              `:m}
              ${t.source==="auto"?o`
                <div class="ec-wiz-field">
                  <label class="ec-wiz-label">Night image</label>
                  <input class="ec-wiz-input" type="text" .placeholder=${`/local/energy-night-${a+1}ev.jpg`}
                    .value=${n.night}
                    @input=${r=>{const l=t.evImgs.map((c,p)=>p===a?{...c,night:r.target.value}:c);s({evImgs:l})}}/>
                </div>
              `:m}
            </div>
          `)}
          <div class="ec-wiz-row ec-wiz-space">
            <button class="ec-wiz-btn-ghost" @click=${()=>i(2)}>← Back</button>
            <button class="ec-wiz-btn-primary" @click=${()=>this._finishWizard()}>Finish &amp; open editor</button>
          </div>

        `:e===20?o`
          <h3 class="ec-wiz-heading">Background images</h3>
          <p class="ec-wiz-desc">Do you want a background image on this card?</p>
          <div class="ec-wiz-type-grid">
            <button class="ec-wiz-type-btn${t.bgCount==="none"?" selected":""}"
              @click=${()=>s({bgCount:"none"})}>
              <span class="ec-wiz-type-icon">⬜</span>
              <span class="ec-wiz-type-title">No background</span>
              <span class="ec-wiz-type-desc">Cards float over a plain or transparent background</span>
            </button>
            <button class="ec-wiz-type-btn${t.bgCount==="single"?" selected":""}"
              @click=${()=>s({bgCount:"single"})}>
              <span class="ec-wiz-type-icon">🖼️</span>
              <span class="ec-wiz-type-title">One image</span>
              <span class="ec-wiz-type-desc">A single static background image</span>
            </button>
            <button class="ec-wiz-type-btn${t.bgCount==="multiple"?" selected":""}"
              @click=${()=>s({bgCount:"multiple"})}>
              <span class="ec-wiz-type-icon">🔄</span>
              <span class="ec-wiz-type-title">Multiple images</span>
              <span class="ec-wiz-type-desc">Background changes based on time of day or an entity state</span>
            </button>
          </div>
          <div class="ec-wiz-row ec-wiz-space">
            <button class="ec-wiz-btn-ghost" @click=${()=>i(1)}>← Back</button>
            <button class="ec-wiz-btn-primary"
              @click=${()=>{t.bgCount==="none"?this._finishWizard():t.bgCount==="single"?i(21):i(22)}}>Next →</button>
          </div>

        `:e===21?o`
          <h3 class="ec-wiz-heading">Background image</h3>
          <div class="ec-wiz-field">
            <label class="ec-wiz-label">Image URL</label>
            <input class="ec-wiz-input" type="text" placeholder="/local/my-background.jpg"
              .value=${t.singleImg} @input=${n=>s({singleImg:n.target.value})}/>
          </div>
          <div class="ec-wiz-row ec-wiz-space">
            <button class="ec-wiz-btn-ghost" @click=${()=>i(20)}>← Back</button>
            <button class="ec-wiz-btn-primary" @click=${()=>this._finishWizard()}>Finish &amp; open editor</button>
          </div>

        `:e===22?o`
          <h3 class="ec-wiz-heading">Multiple backgrounds</h3>
          <div class="ec-wiz-field">
            <label class="ec-wiz-label">When should the image change?</label>
            <select class="ec-wiz-select" .value=${t.bgSwitchMode}
              @change=${n=>s({bgSwitchMode:n.target.value})}>
              <option value="sun">Time of day — follows the sun (day/night)</option>
              <option value="entity">Entity state — switches when an entity changes</option>
            </select>
          </div>
          ${t.bgSwitchMode==="sun"?o`
            <div class="ec-wiz-field">
              <label class="ec-wiz-label">Sun entity</label>
              <ha-entity-picker .hass=${this.hass} .value=${t.sunEntity} allow-custom-entity
                @value-changed=${n=>s({sunEntity:n.detail.value})}
              ></ha-entity-picker>
            </div>
          `:o`
            <div class="ec-wiz-field">
              <label class="ec-wiz-label">Trigger entity</label>
              <ha-entity-picker .hass=${this.hass} .value=${t.bgEntity} allow-custom-entity
                @value-changed=${n=>s({bgEntity:n.detail.value})}
              ></ha-entity-picker>
            </div>
            <p class="ec-wiz-desc" style="font-size:11px;margin-top:-4px;">Alternate image shows when entity state is "on", "night", or "true".</p>
          `}
          <div class="ec-wiz-field">
            <label class="ec-wiz-label">${t.bgSwitchMode==="sun"?"Day":"Main"} image URL</label>
            <input class="ec-wiz-input" type="text" placeholder="/local/background-main.jpg"
              .value=${t.dayImg} @input=${n=>s({dayImg:n.target.value})}/>
          </div>
          <div class="ec-wiz-field">
            <label class="ec-wiz-label">${t.bgSwitchMode==="sun"?"Night":"Alternate"} image URL</label>
            <input class="ec-wiz-input" type="text" placeholder="/local/background-alt.jpg"
              .value=${t.nightImg} @input=${n=>s({nightImg:n.target.value})}/>
          </div>
          <div class="ec-wiz-row ec-wiz-space">
            <button class="ec-wiz-btn-ghost" @click=${()=>i(20)}>← Back</button>
            <button class="ec-wiz-btn-primary" @click=${()=>this._finishWizard()}>Finish &amp; open editor</button>
          </div>

        `:m}
      </div>
    `}_updateCard(e,t){if(!this._config)return;const s=this._config.cards.map((i,n)=>{if(n!==e)return i;const a={...i,...t};for(const r of Object.keys(t))t[r]===void 0&&delete a[r];return a});this._emit({...this._config,cards:s})}_updateCardBox(e,t){if(!this._config)return;const s=this._config.cards[e];s&&this._updateCard(e,{box:{...s.box,...t}})}_updateField(e,t,s){if(!this._config)return;const i=this._config.cards[e];if(!i)return;const n=i.fields.map((a,r)=>r===t?{...a,...s}:a);this._updateCard(e,{fields:n})}_updateDefaults(e){this._config&&this._emit({...this._config,defaults:{...this._config.defaults,...e}})}_updateCanvas(e){this._config&&this._emit({...this._config,canvas:{...this._config.canvas,...e}})}_gridGeom(){const e=this._config?.canvas;if(e?.layout_mode!=="grid"||!e.grid)return null;const{totalW:t,totalH:s}=rt(this._config),i=Math.max(1,e.grid.columns||1),n=Math.max(1,e.grid.rows||1),a=e.grid.padding??0;return{cols:i,rows:n,padding:a,cellW:t/i,cellH:s/n,totalW:t,totalH:s}}_setLayoutMode(e){if(!this._config)return;const t={...this._config.canvas??{}};if(t.layout_mode=e,e==="grid"){t.grid||(t.grid={columns:10,rows:15,padding:0});const s=Math.max(1,t.grid.columns),i=Math.max(1,t.grid.rows),n=t.grid.padding??0,{totalW:a}=rt(this._config),r=a/s,l=this._config.cards.map(p=>{const u=this._previewBoxes[p.id],h=u?u.x+u.w/2:p.position.x,d=u?u.y+u.h/2:p.position.y,g=Math.min(s,Math.max(0,Math.round(h*s))),b=Math.min(i,Math.max(0,Math.round(d*i))),y=p.grid_span??Math.max(1,Math.min(s,Math.round((u?.w??0)*s)||1)),x=Math.max(8,y*r-n);return{...p,anchor:"center",grid_span:y,width:x,position:{x:R(g/s),y:R(b/i)}}}),c=this._embCards().map(p=>{const u=this._previewBoxes[p.id],h=u?u.x+u.w/2:p.position.x,d=u?u.y+u.h/2:p.position.y,g=Math.min(s,Math.max(0,Math.round(h*s))),b=Math.min(i,Math.max(0,Math.round(d*i))),y=p.grid_span??Math.max(1,Math.min(s,Math.round((u?.w??0)*s)||1)),x=Math.max(8,y*r-n);return{...p,anchor:"center",grid_span:y,width:x,position:{x:R(g/s),y:R(b/i)}}});this._emit({...this._config,canvas:t,cards:l,embedded_cards:c})}else this._emit({...this._config,canvas:t})}_renderGridOverlay(){const e=this._gridGeom();if(!e)return m;const{cols:t,rows:s}=e,i=[];for(let n=0;n<=t;n++)for(let a=0;a<=s;a++)i.push(o`<div class="ec-grid-dot" style="left:${n/t*100}%;top:${a/s*100}%;"></div>`);return o`<div class="ec-grid-overlay">${i}</div>`}_renderBgOverlay(){if(!this._config)return m;const e=rt(this._config),t=e.L/e.totalW*100,s=e.T/e.totalH*100,i=e.baseW/e.totalW*100,n=e.baseH/e.totalH*100;return o`
      <div class="ec-bg-ov${this._bgSelected?" selected":""}"
        style="left:${t}%;top:${s}%;width:${i}%;height:${n}%;"
        @pointerdown=${a=>this._onBgDown(a,"move")}
        title="Background image — drag to move, corners to resize">
        ${this._bgSelected?["tl","tr","bl","br"].map(a=>o`
          <div class="ec-bg-resize ec-bg-resize-${a}"
            @pointerdown=${r=>this._onBgDown(r,a)}></div>`):m}
      </div>`}_updateBackground(e){this._config&&this._emit({...this._config,background:{...this._config.background,...e}})}_flows(){return this._config?.flows??[]}_updateFlow(e,t){if(!this._config)return;const s=this._flows().map((i,n)=>n===e?{...i,...t}:i);this._emit({...this._config,flows:s})}_addFlow(){if(!this._config)return;const e={id:"flow-"+Date.now().toString(36),name:"Flow",style:"dashes",points:[{x:.4,y:.5},{x:.6,y:.5}]},t=[...this._flows(),e];this._selFlow=t.length-1,this._selPoint=-1,this._emit({...this._config,flows:t})}_addFlowFromExpanded(){if(!this._config)return;const e=this._newFlowName.trim()||"Flow",t={id:"flow-"+Date.now().toString(36),name:e,style:"dashes",points:[{x:.4,y:.5},{x:.6,y:.5}]},s=[...this._flows(),t];this._selFlow=s.length-1,this._pendingFlowIdx=s.length-1,this._selPoint=-1,this._showAddFlowInput=!1,this._newFlowName="",this._emit({...this._config,flows:s})}_collapseExpanded(){this._pendingFlowIdx>=0?this._showFlowCompleteModal=!0:this._previewExpanded=!1}_goToFlow(){const e=this._pendingFlowIdx;this._showFlowCompleteModal=!1,this._previewExpanded=!1,this._pendingFlowIdx=-1,this._selFlow=e;const t=this._flows()[e];this._navTab="elements",this._navPanel="flows",this._navPath=t?[{key:`flow:${e}`,label:t.name??t.id}]:[]}_removeFlow(e){if(!this._config)return;const t=this._flows().filter((s,i)=>i!==e);this._selFlow=Math.min(this._selFlow,Math.max(0,t.length-1)),t.length===0&&(this._selFlow=-1),this._emit({...this._config,flows:t})}_updateFlowPoint(e,t,s){if(!this._config)return;const i=this._flows().map((n,a)=>{if(a!==e)return n;const r=n.points.map((l,c)=>c===t?{...l,...s}:l);return{...n,points:r}});this._emit({...this._config,flows:i})}_setPointKind(e,t,s){if(!this._config)return;const i=this._flows(),n=i[e];if(!n)return;const a=n.points[t];if(!a)return;const{dx:r,dy:l}=a;let c;s==="card"?c={card:this._config.cards[0]?.id??"",side:"center",...r!=null?{dx:r}:{},...l!=null?{dy:l}:{}}:c={x:0,y:0,...r!=null?{dx:r}:{},...l!=null?{dy:l}:{}};const p=i.map((u,h)=>{if(h!==e)return u;const d=u.points.map((g,b)=>b===t?c:g);return{...u,points:d}});this._emit({...this._config,flows:p})}_addFlowPoint(e){if(!this._config)return;const t=this._flows().map((s,i)=>i!==e?s:{...s,points:[...s.points,{x:0,y:0}]});this._emit({...this._config,flows:t})}_onFlowLayerClick(e){if(e.target!==e.currentTarget||!this._config)return;const t=this._flows(),s=t[this._selFlow];if(!s)return;const i=e.currentTarget,n=R(e.offsetX/i.clientWidth),a=R(e.offsetY/i.clientHeight),r=[...s.points],l=this._selPoint>=0?this._selPoint:r.length-1;r.splice(l+1,0,{x:n,y:a});const c=t.map((p,u)=>u===this._selFlow?{...p,points:r}:p);this._selPoint=l+1,this._emit({...this._config,flows:c})}_removeFlowPoint(e,t){if(!this._config)return;const s=this._flows().map((i,n)=>{if(n!==e)return i;const a=i.points.filter((r,l)=>l!==t);return{...i,points:a}});this._emit({...this._config,flows:s})}_virtuals(){return this._config?.virtuals??[]}_addVirtual(){if(!this._config)return;const t={id:`v${Date.now()}`,name:"New virtual",op:"add",inputs:[]},s=[...this._virtuals(),t];this._selVirtual=s.length-1,this._emit({...this._config,virtuals:s})}_updateVirtual(e,t){if(!this._config)return;const s=this._virtuals().map((i,n)=>n===e?{...i,...t}:i);this._emit({...this._config,virtuals:s})}_removeVirtual(e){if(!this._config)return;const t=this._virtuals().filter((s,i)=>i!==e);this._selVirtual=Math.min(this._selVirtual,t.length-1),this._emit({...this._config,virtuals:t})}_addVirtualInput(e){if(!this._config)return;const t=[...this._virtuals()[e]?.inputs??"",""];this._updateVirtual(e,{inputs:t})}_updateVirtualInput(e,t,s){const i=[...this._virtuals()[e]?.inputs??[]];i[t]=s,this._updateVirtual(e,{inputs:i})}_removeVirtualInput(e,t){const s=(this._virtuals()[e]?.inputs??[]).filter((i,n)=>n!==t);this._updateVirtual(e,{inputs:s})}_copyVirtual(e){const t=this._virtuals()[e];t&&(this._virtualClipboard={...t})}_pasteVirtual(){if(!this._config||!this._virtualClipboard)return;const e={...this._virtualClipboard,id:`v${Date.now()}`},t=[...this._virtuals(),e];this._selVirtual=t.length-1,this._emit({...this._config,virtuals:t})}_zones(){return this._config?.zones??[]}_addZone(){if(!this._config)return;const e={id:"zone-"+Date.now().toString(36),name:"Zone",position:{x:.5,y:.5},anchor:"center",width:120,height:70},t=[...this._zones(),e];this._selZone=t.length-1,this._emit({...this._config,zones:t})}_updateZone(e,t){if(!this._config)return;const s=this._zones().map((i,n)=>n===e?{...i,...t}:i);this._emit({...this._config,zones:s})}_removeZone(e){if(!this._config)return;const t=this._zones().filter((s,i)=>i!==e);this._selZone=Math.min(this._selZone,t.length-1),t.length===0&&(this._selZone=-1),this._emit({...this._config,zones:t})}_onZoneDown(e,t){e.preventDefault(),e.stopPropagation(),this._bgSelected=!1,this._selZone=t,this._dragZone=t,e.target.setPointerCapture(e.pointerId),this._zRect=this.renderRoot.querySelector(".ec-canvas-area").getBoundingClientRect(),this._zStartX=e.clientX,this._zStartY=e.clientY,this._zStartPos={...this._zones()[t]?.position??{x:0,y:0}}}_onZoneMove(e){if(this._dragZone<0||!this._zRect||!this._config)return;const t=R(this._zStartPos.x+(e.clientX-this._zStartX)/this._zRect.width),s=R(this._zStartPos.y+(e.clientY-this._zStartY)/this._zRect.height);this._updateZone(this._dragZone,{position:{x:t,y:s}})}_onZoneUp(e){this._dragZone>=0&&e.target.releasePointerCapture(e.pointerId),this._dragZone=-1}_zoneBox(e){const[t,s]=ce[e.anchor??_("anchor")??"top-left"],{totalW:i,totalH:n}=rt(this._config);return{x:e.position.x*i-t*e.width,y:e.position.y*n-s*e.height,w:e.width,h:e.height}}_onZoneResizeDown(e,t,s){e.preventDefault(),e.stopPropagation();const i=this._zones()[t];i&&(this._selZone=t,this._resizeZone=t,this._resizeCorner=s,e.target.setPointerCapture(e.pointerId),this._zRect=this.renderRoot.querySelector(".ec-canvas-area").getBoundingClientRect(),this._zStartX=e.clientX,this._zStartY=e.clientY,this._zResizeStartBox=this._zoneBox(i))}_onZoneResizeMove(e){if(this._resizeZone<0||!this._zRect||!this._config)return;const t=this._zones()[this._resizeZone];if(!t)return;const{totalW:s,totalH:i}=rt(this._config),n=(e.clientX-this._zStartX)/this._zRect.width*s,a=(e.clientY-this._zStartY)/this._zRect.height*i,r=this._zResizeStartBox,l=10,c=this._resizeCorner.includes("l")?r.x+r.w:r.x,p=this._resizeCorner.includes("t")?r.y+r.h:r.y,u=this._resizeCorner.includes("l")?r.x:r.x+r.w,h=this._resizeCorner.includes("t")?r.y:r.y+r.h;let d=u+n-c,g=h+a-p;const b=d>=0?1:-1,y=g>=0?1:-1;d=Math.max(l,Math.abs(d))*b,g=Math.max(l,Math.abs(g))*y;const x=b>=0?c:c+d,f=y>=0?p:p+g,k=Math.abs(d),v=Math.abs(g),[w,$]=ce[t.anchor??_("anchor")??"top-left"],C={x:R((x+w*k)/s),y:R((f+$*v)/i)};this._updateZone(this._resizeZone,{width:j(k),height:j(v),position:C})}_onZoneResizeUp(e){this._resizeZone>=0&&e.target.releasePointerCapture(e.pointerId),this._resizeZone=-1}_onBgDown(e,t){e.preventDefault(),e.stopPropagation(),this._bgSelected=!0,this._bgMode=t,e.target.setPointerCapture(e.pointerId),this._bgRect=this.renderRoot.querySelector(".ec-canvas-area").getBoundingClientRect(),this._bgStartX=e.clientX,this._bgStartY=e.clientY;const s=rt(this._config);this._bgStart={L:s.L,T:s.T,baseW:s.baseW,baseH:s.baseH,totalW:s.totalW,totalH:s.totalH}}_onBgMove(e){if(!this._bgMode||!this._bgRect||!this._config)return;const t=this._bgStart,s=(e.clientX-this._bgStartX)/this._bgRect.width*t.totalW,i=(e.clientY-this._bgStartY)/this._bgRect.height*t.totalH,n=this._gridGeom(),a=(g,b)=>Math.round(g/b)*b,r=20;let l,c,p,u;if(this._bgMode==="move")p=t.baseW,u=t.baseH,l=Math.min(Math.max(0,t.L+s),t.totalW-p),c=Math.min(Math.max(0,t.T+i),t.totalH-u),n&&(l=Math.min(Math.max(0,a(l,n.cellW)),t.totalW-p),c=Math.min(Math.max(0,a(c,n.cellH)),t.totalH-u));else{const g=this._bgMode.includes("l"),b=this._bgMode.includes("t"),y=g?-s:s,x=b?-i:i;let f=Math.abs(y)/t.baseW>=Math.abs(x)/t.baseH?(t.baseW+y)/t.baseW:(t.baseH+x)/t.baseH;const k=g?t.L+t.baseW:t.totalW-t.L,v=b?t.T+t.baseH:t.totalH-t.T,w=Math.min(k/t.baseW,v/t.baseH),$=Math.max(r/t.baseW,r/t.baseH);f=Math.min(Math.max(f,$),w),p=t.baseW*f,u=t.baseH*f,l=g?t.L+t.baseW-p:t.L,c=b?t.T+t.baseH-u:t.T,n&&(p=Math.min(t.totalW,Math.max(n.cellW,a(p,n.cellW))),u=Math.min(t.totalH,p*(t.baseH/t.baseW)),l=g?t.L+t.baseW-p:t.L,c=b?t.T+t.baseH-u:t.T,l=Math.min(Math.max(0,a(l,n.cellW)),t.totalW-p),c=Math.min(Math.max(0,a(c,n.cellH)),t.totalH-u))}const h=t.totalW-p-l,d=t.totalH-u-c;this._updateCanvas({width:j(p),height:j(u),extend:{left:l>.5?j(l):void 0,top:c>.5?j(c):void 0,right:h>.5?j(h):void 0,bottom:d>.5?j(d):void 0}})}_onBgUp(e){this._bgMode&&e.target.releasePointerCapture(e.pointerId),this._bgMode=null}_embCards(){return this._config?.embedded_cards??[]}_addEmbCard(){if(!this._config)return;const e={id:"emb-"+Date.now().toString(36),name:"Embedded Card",position:{x:.5,y:.5},anchor:"center",width:200,card_config:{}},t=this._gridGeom();if(t){const{cols:i,rows:n,cellW:a,padding:r}=t,l=Math.round(i/2),c=Math.round(n/2),p=Math.max(1,Math.min(i,2));e.grid_span=p,e.width=Math.max(8,p*a-r),e.position={x:R(l/i),y:R(c/n)}}const s=[...this._embCards(),e];this._selEmbCard=s.length-1,this._emit({...this._config,embedded_cards:s})}_updateEmbCard(e,t){if(!this._config)return;const s=this._embCards().map((i,n)=>n===e?{...i,...t}:i);this._emit({...this._config,embedded_cards:s})}_removeEmbCard(e){if(!this._config)return;const t=this._embCards().filter((s,i)=>i!==e);this._selEmbCard=Math.min(this._selEmbCard,t.length-1),t.length===0&&(this._selEmbCard=-1),this._emit({...this._config,embedded_cards:t})}_onEmbCardDown(e,t){if(e.preventDefault(),e.stopPropagation(),this._bgSelected=!1,this._selEmbCard=t,e.shiftKey||e.ctrlKey||e.metaKey){const a=new Set(this._selEmbCards);a.has(t)?a.delete(t):a.add(t),this._selEmbCards=a;return}const s=this._embCards(),i=s[t]?.group,n=i?s.map((a,r)=>({ec:a,i:r})).filter(({ec:a})=>a.group===i).map(({i:a})=>a):[t];if(this._selEmbCards=new Set(n),this._dragEmbCard=t,e.target.setPointerCapture(e.pointerId),this._ecRect=this.renderRoot.querySelector(".ec-canvas-area").getBoundingClientRect(),this._ecStartX=e.clientX,this._ecStartY=e.clientY,this._embDragMembers=n.map(a=>({idx:a,start:{...s[a]?.position??{x:0,y:0}}})),i){const a=this._config?.cards??[],r=a.map((l,c)=>({c:l,i:c})).filter(({c:l})=>l.group===i).map(({i:l})=>l);this._selCards=new Set(r),this._dragCard=r[0]??-1,this._hostRect=this.renderRoot.querySelector(".ec-canvas-area").getBoundingClientRect(),this._startX=e.clientX,this._startY=e.clientY,this._dragMembers=r.map(l=>({idx:l,start:{...a[l]?.position??{x:0,y:0}}}))}else this._selCards=new Set,this._dragCard=-1,this._dragMembers=[]}_onEmbCardMove(e){if(this._dragEmbCard<0||!this._ecRect||!this._config)return;const t=(e.clientX-this._ecStartX)/this._ecRect.width,s=(e.clientY-this._ecStartY)/this._ecRect.height,i=this._embCards().map((a,r)=>{const l=this._embDragMembers.find(c=>c.idx===r);return l?{...a,position:{x:R(l.start.x+t),y:R(l.start.y+s)}}:a}),n=this._dragMembers.length>0?this._config.cards.map((a,r)=>{const l=this._dragMembers.find(c=>c.idx===r);return l?{...a,position:{x:R(l.start.x+t),y:R(l.start.y+s)}}:a}):this._config.cards;this._emit({...this._config,cards:n,embedded_cards:i})}_onEmbCardUp(e){this._dragEmbCard>=0&&e.target.releasePointerCapture(e.pointerId),this._dragEmbCard=-1}async _openEmbEditor(e){const t=this._embCards()[e];if(!t)return;this._embEditorIdx=e,this._embEditorYaml=JSON.stringify(t.card_config,null,2),this._embNativeEditor=null;const s=t.card_config,i=String(s?.type??"");if(i)try{const n=await window.loadCardHelpers?.();if(n?.createCardElement)try{n.createCardElement(s)}catch{}const a=i.startsWith("custom:")?i.slice(7):`hui-${i}-card`;await Promise.race([customElements.whenDefined(a),new Promise(p=>setTimeout(p,5e3))]);const r=customElements.get(a);let l={...s};if(r?.getStubConfig)try{const p=Object.keys(this.hass?.states??{}),u=await r.getStubConfig(this.hass,p,p);u&&typeof u=="object"&&(l={...u,...l})}catch{}if(this._embEditorConfig=l,await Promise.race([customElements.whenDefined("hui-card-element-editor"),new Promise(p=>setTimeout(p,3e3))]),customElements.get("hui-card-element-editor")){const p=document.createElement("hui-card-element-editor");p.hass=this.hass,p.value=l,p.addEventListener("config-changed",u=>{u.stopPropagation();const h=u.detail;h?.config&&this._embEditorIdx>=0&&this._updateEmbCard(this._embEditorIdx,{card_config:h.config})}),this._embNativeEditor=p}else{const p=r?.getConfigElement;if(p){const u=await p.call(r);if(u){try{u.setConfig?.(l)}catch{}u.hass=this.hass,u.addEventListener("config-changed",h=>{h.stopPropagation();const d=h.detail;d?.config&&this._embEditorIdx>=0&&this._updateEmbCard(this._embEditorIdx,{card_config:d.config})}),this._embNativeEditor=u}}}}catch(n){console.warn("[mc-editor] native editor unavailable:",n)}this._embEditorOpen=!0}_closeEmbEditor(){this._embEditorOpen=!1,this._embEditorIdx=-1,this._embNativeEditor=null,this._embEditorConfig=null}_saveEmbEditorYaml(){if(!(this._embEditorIdx<0))try{const e=JSON.parse(this._embEditorYaml);this._updateEmbCard(this._embEditorIdx,{card_config:e}),this._closeEmbEditor()}catch(e){alert("Invalid JSON: "+e.message)}}async _openEmbPicker(e){this._embPickerTargetIdx=e,this._embPickerSearch="",this._embPickerOpen=!0}async _pickEmbCardType(e){this._embPickerOpen=!1,this._embPickerSearch="";const t=this._embPickerTargetIdx;if(t<0)return;const i={...this._embCards()[t].card_config,type:e};this._updateEmbCard(t,{card_config:i}),await this._openEmbEditor(t)}_setBgImage(e,t,s){if(!this._config)return;const i=this._config.background??{},n={...i.images?.[e]??{}};s===""?delete n[t]:n[t]=s,this._updateBackground({images:{...i.images,[e]:n}})}_addCard(){if(!this._config)return;const e={id:"card-"+Date.now().toString(36),name:"Card",position:{x:.5,y:.5},anchor:"center",align:"center",fields:[]},t=this._gridGeom();if(t){const{cols:i,rows:n,cellW:a,padding:r}=t,l=Math.round(i/2),c=Math.round(n/2),p=Math.max(1,Math.min(i,2));e.grid_span=p,e.width=Math.max(8,p*a-r),e.position={x:R(l/i),y:R(c/n)}}const s=[...this._config.cards,e];this._selCard=s.length-1,this._selField=-1,this._emit({...this._config,cards:s})}_removeCard(e){if(!this._config)return;const t=this._config.cards.filter((s,i)=>i!==e);this._selCard=Math.min(this._selCard,Math.max(0,t.length-1)),this._selField=-1,this._emit({...this._config,cards:t})}_copyFields(e){const t=this._config?.cards[e];t&&(this._copiedFields=t.fields.map(s=>({...s})),this._copySourceIdx=e)}_pasteFields(e){if(!this._copiedFields||!this._config)return;const t=this._copiedFields.map(i=>({...i,id:"f-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,6)})),s=this._config.cards.map((i,n)=>n===e?{...i,fields:t}:i);this._emit({...this._config,cards:s}),this._copiedFields=null,this._copySourceIdx=-1}_copyField(e,t,s=!1){const n=(s?this._extCards():this._config?.cards??[])[e]?.fields[t];n&&(this._copiedField={...n},this._copiedFieldSrc={isExt:s,ci:e,fi:t})}_pasteField(e,t=!1){if(!this._copiedField||!this._config)return;const s={...this._copiedField,id:"f-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,6)};if(t){const i=this._extCards()[e];if(!i)return;this._selExtField=i.fields.length,this._updateExtCard(e,{fields:[...i.fields,s]})}else{const i=this._config.cards[e];if(!i)return;const n=[...i.fields,s],a=this._config.cards.map((r,l)=>l===e?{...r,fields:n}:r);this._selField=n.length-1,this._emit({...this._config,cards:a})}}_addField(e){if(!this._config)return;const t=this._config.cards[e];if(!t)return;const s={id:"f-"+Date.now().toString(36),type:"value",column:1},i=[...t.fields,s];this._selField=i.length-1,this._updateCard(e,{fields:i})}_removeField(e,t){if(!this._config)return;const s=this._config.cards[e];if(!s)return;const i=s.fields.filter((n,a)=>a!==t);this._selField>=i.length&&(this._selField=i.length-1),this._updateCard(e,{fields:i})}_extCards(){return this._config?.extended_cards??[]}_updateExtDefaults(e){this._config&&this._emit({...this._config,extended_card_defaults:{...this._config.extended_card_defaults,...e}})}_addExtCard(){if(!this._config)return;const e={id:"ext-"+Date.now().toString(36),name:"Popover Card",columns:2,fields:[]},t=[...this._extCards(),e];this._selExtCard=t.length-1,this._selExtField=-1,this._emit({...this._config,extended_cards:t})}_removeExtCard(e){if(!this._config)return;const t=this._extCards().filter((s,i)=>i!==e);this._selExtCard=Math.min(this._selExtCard,Math.max(0,t.length-1)),this._selExtField=-1,this._emit({...this._config,extended_cards:t})}_updateExtCard(e,t){if(!this._config)return;const s=this._extCards().map((i,n)=>n===e?{...i,...t}:i);this._emit({...this._config,extended_cards:s})}_updateExtCardBox(e,t){const s=this._extCards()[e];s&&this._updateExtCard(e,{box:{...s.box,...t}})}_addExtField(e){if(!this._config)return;const t=this._extCards()[e];if(!t)return;const s={id:"f-"+Date.now().toString(36),type:"value",column:1},i=[...t.fields,s];this._selExtField=i.length-1,this._updateExtCard(e,{fields:i})}_removeExtField(e,t){const s=this._extCards()[e];if(!s)return;const i=s.fields.filter((n,a)=>a!==t);this._selExtField>=i.length&&(this._selExtField=i.length-1),this._updateExtCard(e,{fields:i})}_stepNumInput(e,t){e.preventDefault();const i=e.currentTarget.closest(".ec-num-wrap")?.querySelector("input");if(i){try{t>0?i.stepUp():i.stepDown()}catch{const n=Number(i.step)||1,a=Number(i.value)||0;i.value=String(a+t*n)}i.dispatchEvent(new Event("change",{bubbles:!0}))}}_reorderArray(e,t,s,i){const n=[...e],[a]=n.splice(t,1),r=t<s?i?s-1:s:i?s:s+1;return n.splice(r,0,a),{arr:n,target:r}}_moveCard(e,t,s){if(!this._config)return;const i=[...this._config.cards],[n]=i.splice(e,1),a=e<t?s?t-1:t:s?t:t+1;i.splice(a,0,n),this._selCard=a,this._emit({...this._config,cards:i})}_moveExtCard(e,t,s){if(!this._config)return;const{arr:i,target:n}=this._reorderArray(this._extCards(),e,t,s);this._selExtCard=n,this._emit({...this._config,extended_cards:i})}_moveVirtual(e,t,s){if(!this._config)return;const{arr:i,target:n}=this._reorderArray(this._virtuals(),e,t,s);this._selVirtual=n,this._emit({...this._config,virtuals:i})}_moveZone(e,t,s){if(!this._config)return;const{arr:i,target:n}=this._reorderArray(this._zones(),e,t,s);this._selZone=n,this._emit({...this._config,zones:i})}_moveFlow(e,t,s){if(!this._config)return;const{arr:i,target:n}=this._reorderArray(this._flows(),e,t,s);this._selFlow=n,this._emit({...this._config,flows:i})}_moveEmbCard(e,t,s){if(!this._config)return;const{arr:i,target:n}=this._reorderArray(this._embCards(),e,t,s);this._selEmbCard=n,this._emit({...this._config,embedded_cards:i})}_movePoint(e,t,s,i){if(!this._config)return;const n=this._flows()[e];if(!n)return;const a=[...n.points],[r]=a.splice(t,1),l=t<s?i?s-1:s:i?s:s+1;a.splice(l,0,r),this._selPoint=l,this._updateFlow(e,{points:a})}_moveVirtualInput(e,t,s,i){if(!this._config)return;const n=this._virtuals()[e];if(!n)return;const a=[...n.inputs],[r]=a.splice(t,1),l=t<s?i?s-1:s:i?s:s+1;a.splice(l,0,r),this._updateVirtual(e,{inputs:a})}_moveTrigger(e,t,s,i){if(!this._config)return;const n=this._virtuals()[e];if(!n)return;const a=[...n.triggers??[]],[r]=a.splice(t,1),l=t<s?i?s-1:s:i?s:s+1;a.splice(l,0,r),this._selTrigger=l,this._updateVirtual(e,{triggers:a})}_moveGraphSeries(e,t,s,i,n){const a=this._config?.cards[e]?.fields[t];if(!a)return;const r=[...a.graph_series??[]],[l]=r.splice(s,1),c=s<i?n?i-1:i:n?i:i+1;r.splice(c,0,l),this._selSeries=c,this._updateField(e,t,{graph_series:r})}_moveExtGraphSeries(e,t,s,i,n){const a=this._extCards()[e]?.fields[t];if(!a)return;const r=[...a.graph_series??[]],[l]=r.splice(s,1),c=s<i?n?i-1:i:n?i:i+1;r.splice(c,0,l),this._selSeries=c,this._updateExtField(e,t,{graph_series:r})}_moveField(e,t,s,i){if(!this._config)return;const n=this._config.cards[e];if(!n)return;const a=[...n.fields],[r]=a.splice(t,1),l=t<s?i?s-1:s:i?s:s+1;a.splice(l,0,r),this._selField=l,this._updateCard(e,{fields:a})}_moveExtField(e,t,s,i){const n=this._extCards()[e];if(!n)return;const a=[...n.fields],[r]=a.splice(t,1),l=t<s?i?s-1:s:i?s:s+1;a.splice(l,0,r),this._selExtField=l,this._updateExtCard(e,{fields:a})}_onDragStart(e,t){this._dragSrc=t,e.dataTransfer.effectAllowed="move",e.dataTransfer.setData("text/plain",t)}_onDragOver(e){e.preventDefault(),e.dataTransfer.dropEffect="move";const t=e.currentTarget;t.classList.add("ec-drag-over");const s=t.getBoundingClientRect();t.dataset.dropPos=e.clientY<s.top+s.height/2?"before":"after"}_onDragLeave(e){e.currentTarget.classList.remove("ec-drag-over")}_onDragEnd(e){e.currentTarget.classList.remove("ec-dragging"),this.renderRoot.querySelectorAll(".ec-drag-over").forEach(t=>t.classList.remove("ec-drag-over")),this._dragSrc=null}_onDrop(e,t){e.preventDefault();const s=e.currentTarget;s.classList.remove("ec-drag-over");const i=e.dataTransfer?.getData("text/plain")??this._dragSrc;if(this._dragSrc=null,!i||i===t)return;const n=e.clientY<s.getBoundingClientRect().top+s.getBoundingClientRect().height/2,[a,...r]=i.split(":"),[l,...c]=t.split(":");if(a===l){if(a==="card")this._moveCard(Number(r[0]),Number(c[0]),n);else if(a==="field"){const[p,u]=r.map(Number),[h,d]=c.map(Number);if(p!==h)return;this._moveField(p,u,d,n)}else if(a==="extfield"){const[p,u]=r.map(Number),[h,d]=c.map(Number);if(p!==h)return;this._moveExtField(p,u,d,n)}else if(a==="extcard")this._moveExtCard(Number(r[0]),Number(c[0]),n);else if(a==="virt")this._moveVirtual(Number(r[0]),Number(c[0]),n);else if(a==="zone")this._moveZone(Number(r[0]),Number(c[0]),n);else if(a==="flow")this._moveFlow(Number(r[0]),Number(c[0]),n);else if(a==="emb")this._moveEmbCard(Number(r[0]),Number(c[0]),n);else if(a==="pt"){const[p,u]=r.map(Number),[h,d]=c.map(Number);if(p!==h)return;this._movePoint(p,u,d,n)}else if(a==="vin"){const[p,u]=r.map(Number),[h,d]=c.map(Number);if(p!==h)return;this._moveVirtualInput(p,u,d,n)}else if(a==="trig"){const[p,u]=r.map(Number),[h,d]=c.map(Number);if(p!==h)return;this._moveTrigger(p,u,d,n)}else if(a==="gs"){const[p,u,h]=r.map(Number),[d,g,b]=c.map(Number);if(p!==d||u!==g)return;this._moveGraphSeries(p,u,h,b,n)}else if(a==="egs"){const[p,u,h]=r.map(Number),[d,g,b]=c.map(Number);if(p!==d||u!==g)return;this._moveExtGraphSeries(p,u,h,b,n)}}}_updateExtField(e,t,s){const i=this._extCards()[e];if(!i)return;const n=i.fields.map((a,r)=>r===t?{...a,...s}:a);this._updateExtCard(e,{fields:n})}_alignCards(e){if(!this._config||this._selCards.size<2)return;const t=Array.from(this._selCards),s=this._config.cards,i=t.map(h=>({i:h,pos:{...s[h].position}})),n=i.map(h=>h.pos.x),a=i.map(h=>h.pos.y),r=Math.min(...n),l=Math.max(...n),c=Math.min(...a),p=Math.max(...a),u=s.map((h,d)=>{if(!this._selCards.has(d))return h;let{x:g,y:b}=h.position;return e==="left"&&(g=j(r)),e==="right"&&(g=j(l)),e==="centerH"&&(g=j((r+l)/2)),e==="top"&&(b=j(c)),e==="bottom"&&(b=j(p)),e==="middleV"&&(b=j((c+p)/2)),{...h,position:{x:g,y:b}}});this._emit({...this._config,cards:u})}_distribute(e){if(!this._config||this._selCards.size<2)return;const t=Array.from(this._selCards).sort((c,p)=>this._config.cards[c].position[e]-this._config.cards[p].position[e]),s=t.length,i=this._config.cards,n=i[t[0]].position[e],a=i[t[s-1]].position[e],r=s>1?(a-n)/(s-1):0,l=i.map((c,p)=>{const u=t.indexOf(p);if(u<0)return c;const h=j(n+r*u);return{...c,position:{...c.position,[e]:h}}});this._emit({...this._config,cards:l})}_distributeCanvas(e){if(!this._config||this._selCards.size<2)return;const t=Array.from(this._selCards).sort((a,r)=>this._config.cards[a].position[e]-this._config.cards[r].position[e]),s=t.length,n=this._config.cards.map((a,r)=>{const l=t.indexOf(r);if(l<0)return a;const c=R((l+1)/(s+1));return{...a,position:{...a.position,[e]:c}}});this._emit({...this._config,cards:n})}_alignGroupToCanvas(e){if(!this._config||this._selCards.size<1)return;const t=.5,s=Array.from(this._selCards),i=this._config.cards,n=s.map(c=>i[c].position[e]),a=(Math.min(...n)+Math.max(...n))/2,r=j(t-a),l=i.map((c,p)=>this._selCards.has(p)?{...c,position:{...c.position,[e]:j(c.position[e]+r)}}:c);this._emit({...this._config,cards:l})}_groupCards(){if(!this._config||this._selCards.size+this._selEmbCards.size<2)return;const e="g-"+Date.now().toString(36),t=this._config.cards.map((i,n)=>this._selCards.has(n)?{...i,group:e}:i),s=this._embCards().map((i,n)=>this._selEmbCards.has(n)?{...i,group:e}:i);this._emit({...this._config,cards:t,embedded_cards:s})}_ungroupCards(){if(!this._config)return;const e=this._config.cards.map((s,i)=>{if(!this._selCards.has(i))return s;const{group:n,...a}=s;return a}),t=this._embCards().map((s,i)=>{if(!this._selEmbCards.has(i))return s;const{group:n,...a}=s;return a});this._emit({...this._config,cards:e,embedded_cards:t})}_onCardDown(e,t){if(e.preventDefault(),this._bgSelected=!1,e.altKey){const a=this._config?.cards??[],r=this._previewBoxes,l=this.renderRoot.querySelector(".ec-canvas-area");if(l&&Object.keys(r).length>0){const c=l.getBoundingClientRect(),p=(e.clientX-c.left)/c.width,u=(e.clientY-c.top)/c.height,h=a.map((d,g)=>({idx:g,box:r[d.id]})).filter(d=>!!d.box&&p>=d.box.x&&p<=d.box.x+d.box.w&&u>=d.box.y&&u<=d.box.y+d.box.h).map(d=>d.idx).sort((d,g)=>d-g);if(h.length>0){const d=h.indexOf(this._selCard),g=d>=0?h[(d+1)%h.length]:h[0];this._selCard=g,this._selField=-1;const b=a[g]?.group;this._selCards=new Set(b?a.map((y,x)=>({c:y,idx:x})).filter(({c:y})=>y.group===b).map(({idx:y})=>y):[g])}}return}if(this._selCard=t,this._selField=-1,e.shiftKey||e.ctrlKey||e.metaKey){const a=new Set(this._selCards);a.has(t)?a.delete(t):a.add(t),this._selCards=a;return}const s=this._config?.cards??[],i=s[t]?.group,n=i?s.map((a,r)=>({c:a,idx:r})).filter(({c:a})=>a.group===i).map(({idx:a})=>a):[t];if(this._selCards=new Set(n),this._dragCard=t,e.target.setPointerCapture(e.pointerId),this._hostRect=this.renderRoot.querySelector(".ec-canvas-area").getBoundingClientRect(),this._startX=e.clientX,this._startY=e.clientY,this._dragMembers=n.map(a=>({idx:a,start:{...s[a]?.position??{x:0,y:0}}})),i){const a=this._embCards(),r=a.map((l,c)=>({ec:l,idx:c})).filter(({ec:l})=>l.group===i).map(({idx:l})=>l);this._selEmbCards=new Set(r),this._embDragMembers=r.map(l=>({idx:l,start:{...a[l]?.position??{x:0,y:0}}}))}else this._selEmbCards=new Set,this._embDragMembers=[]}_onCardMove(e){if(this._dragCard<0||!this._hostRect||!this._config)return;const t=(e.clientX-this._startX)/this._hostRect.width,s=(e.clientY-this._startY)/this._hostRect.height,i=this._config.cards.map((a,r)=>{const l=this._dragMembers.find(c=>c.idx===r);return l?{...a,position:{x:R(l.start.x+t),y:R(l.start.y+s)}}:a}),n=this._embDragMembers.length>0?this._embCards().map((a,r)=>{const l=this._embDragMembers.find(c=>c.idx===r);return l?{...a,position:{x:R(l.start.x+t),y:R(l.start.y+s)}}:a}):this._embCards();this._emit({...this._config,cards:i,embedded_cards:n})}_onCardUp(e){const t=this._gridGeom();if(t&&this._config&&(this._dragMembers.length>0||this._embDragMembers.length>0)){const{cols:s,rows:i}=t,n=this._config.cards,a=this._embCards(),r=[];for(const l of this._dragMembers){const c=n[l.idx];c&&r.push({kind:"card",idx:l.idx,box:this._previewBoxes[c.id],pos:c.position})}for(const l of this._embDragMembers){const c=a[l.idx];c&&r.push({kind:"emb",idx:l.idx,box:this._previewBoxes[c.id],pos:c.position})}if(r.length===1){const l=r[0],c=l.box?l.box.x+l.box.w/2:l.pos.x,p=l.box?l.box.y+l.box.h/2:l.pos.y,u=Math.min(s,Math.max(0,Math.round(c*s))),h=Math.min(i,Math.max(0,Math.round(p*i))),d={x:R(u/s),y:R(h/i)};if(l.kind==="card"){const g=n.map((b,y)=>y===l.idx?{...b,anchor:"center",position:d}:b);this._emit({...this._config,cards:g})}else{const g=a.map((b,y)=>y===l.idx?{...b,anchor:"center",position:d}:b);this._emit({...this._config,embedded_cards:g})}}else if(r.length>=2){let l=1/0,c=1/0,p=-1/0,u=-1/0;for(const f of r)f.box?(l=Math.min(l,f.box.x),c=Math.min(c,f.box.y),p=Math.max(p,f.box.x+f.box.w),u=Math.max(u,f.box.y+f.box.h)):(l=Math.min(l,f.pos.x),c=Math.min(c,f.pos.y),p=Math.max(p,f.pos.x),u=Math.max(u,f.pos.y));const h={x:(l+p)/2,y:(c+u)/2},d=Math.min(s,Math.max(0,Math.round(h.x*s))),g=Math.min(i,Math.max(0,Math.round(h.y*i))),b={x:d/s-h.x,y:g/i-h.y},y=n.map((f,k)=>this._dragMembers.some(v=>v.idx===k)?{...f,position:{x:R(f.position.x+b.x),y:R(f.position.y+b.y)}}:f),x=a.map((f,k)=>this._embDragMembers.some(v=>v.idx===k)?{...f,position:{x:R(f.position.x+b.x),y:R(f.position.y+b.y)}}:f);this._emit({...this._config,cards:y,embedded_cards:x})}}e.target.releasePointerCapture(e.pointerId),this._dragCard=-1}_onPointDown(e,t){if(e.preventDefault(),e.stopPropagation(),this._selPoint=t,!this._config)return;const s=this._flows()[this._selFlow];if(!s)return;const i=s.points[t];if(i){if(e.shiftKey){this._removeFlowPoint(this._selFlow,t),this._selPoint=-1;return}i.card==null&&(this._dragPoint=t,e.target.setPointerCapture(e.pointerId),this._pRect=this.renderRoot.querySelector(".ec-canvas-area").getBoundingClientRect(),this._pStartX=e.clientX,this._pStartY=e.clientY,this._pStartPos={x:i.x??0,y:i.y??0},this._snapAxis=null)}}_onPointMove(e){if(this._dragPoint<0||!this._pRect||!this._config)return;let t=R(this._pStartPos.x+(e.clientX-this._pStartX)/this._pRect.width),s=R(this._pStartPos.y+(e.clientY-this._pStartY)/this._pRect.height);const i=t,n=s;if(e.ctrlKey){const a=this._flows()[this._selFlow];if(a&&this._pRect){const r=this._config.cards,l=this._previewBoxes,c=this._dragPoint,p=c>0?a.points[c-1]:null,u=c<a.points.length-1?a.points[c+1]:null,h=p?Tt(p,r,l):null,d=u?Tt(u,r,l):null,g=this._pRect.width,b=this._pRect.height;if(h&&d){const y=Math.hypot((t-h.x)*g,(s-d.y)*b),x=Math.hypot((t-d.x)*g,(s-h.y)*b);y<=x?(t=h.x,s=d.y):(t=d.x,s=h.y)}else{const y=h??d;if(y){if(this._snapAxis===null){const x=e.clientX-this._pStartX,f=e.clientY-this._pStartY;Math.hypot(x,f)>4?this._snapAxis=Math.abs(x)>=Math.abs(f)?"y":"x":this._snapAxis=Math.abs(t-y.x)*g<Math.abs(s-y.y)*b?"x":"y"}this._snapAxis==="x"?t=y.x:s=y.y}}}}{let r=!1;t:for(const l of this._config.cards){const c=this._previewBoxes[l.id];if(c)for(const p of["top","right","bottom","left"]){let u,h;switch(p){case"top":u=c.x+c.w/2,h=c.y;break;case"right":u=c.x+c.w,h=c.y+c.h/2;break;case"bottom":u=c.x+c.w/2,h=c.y+c.h;break;case"left":u=c.x,h=c.y+c.h/2;break}if(Math.hypot((i-u)*this._pRect.width,(n-h)*this._pRect.height)<=24){t=u,s=h,this._snapAnchor={card:l.id,side:p},r=!0;break t}}}r||(this._snapAnchor=null)}this._updateFlowPoint(this._selFlow,this._dragPoint,{x:t,y:s})}_onPointUp(e){this._dragPoint>=0&&(e.target.releasePointerCapture(e.pointerId),this._snapAnchor&&this._updateFlowPoint(this._selFlow,this._dragPoint,{card:this._snapAnchor.card,side:this._snapAnchor.side,x:void 0,y:void 0})),this._dragPoint=-1,this._snapAnchor=null,this._snapAxis=null}_ptSegDist(e,t,s,i,n,a){const r=n-s,l=a-i,c=r*r+l*l,p=c===0?0:Math.max(0,Math.min(1,((e-s)*r+(t-i)*l)/c));return Math.hypot(e-s-p*r,t-i-p*l)}_onCanvasAreaClick(e){e.target.closest(".ec-bg-ov,.ec-bg-resize")||(this._bgSelected=!1);const t=this._flows();if(t.length===0||e.target.closest(".ec-handle,.ec-card-ov,.ec-emb-handle,.ec-emb-ov,.ec-zone-handle,.ec-flow-node,.ec-snap"))return;const i=e.currentTarget.getBoundingClientRect(),n=e.clientX-i.left,a=e.clientY-i.top,r=this._config?.cards??[],l=10;let c=-1,p=1/0;for(let u=0;u<t.length;u++){const h=t[u].points.map(d=>{const g=Tt(d,r,this._previewBoxes);return{x:g.x*i.width,y:g.y*i.height}});for(let d=0;d<h.length-1;d++){const g=this._ptSegDist(n,a,h[d].x,h[d].y,h[d+1].x,h[d+1].y);g<p&&(p=g,c=u)}}c>=0&&p<=l&&(this._selFlow=c,this._selPoint=-1)}_syncPreviewDialog(){const e=this.renderRoot?.querySelector("dialog.ec-preview");if(!e)return;const t=e.matches(":modal");this._previewExpanded&&!t?(e.open&&e.close(),e.showModal()):!this._previewExpanded&&(t||!e.open)&&(e.open&&e.close(),e.show())}_sizeExpandedCanvas(){const e=this.renderRoot?.querySelector(".ec-canvas-area");if(!e)return;if(!this._previewExpanded){e.style.width&&e.style.removeProperty("width");return}const t=this.renderRoot?.querySelector(".ec-preview");if(!t)return;this._previewRO||(this._previewRO=new ResizeObserver(()=>this._sizeExpandedCanvas()),this._previewRO.observe(t),window.addEventListener("resize",this._onWindowResize));const{totalW:s,totalH:i}=rt(this._config);if(!s||!i)return;const n=this.renderRoot?.querySelector(".ec-expanded-bottom-bar"),a=t.clientWidth,r=window.innerHeight-(n?.offsetHeight??0);if(a<=0||r<=0)return;const l=`${Math.floor(Math.min(a,r*s/i))}px`;e.style.width!==l&&(e.style.width=l)}disconnectedCallback(){super.disconnectedCallback(),this._previewRO?.disconnect(),this._previewRO=void 0,window.removeEventListener("resize",this._onWindowResize)}updated(){const e=this.renderRoot?.querySelectorAll("mosaic-canvas");if(this._config&&e?.forEach(t=>t.setConfig(this._config)),this._syncPreviewDialog(),this._sizeExpandedCanvas(),this._previewExpanded&&(this._showAddFlowInput?this.renderRoot?.querySelector(".ec-flow-name-input")?.focus():this.renderRoot?.querySelector(".ec-preview")?.focus()),this._embEditorOpen&&this._embNativeEditor){const t=this.renderRoot.querySelector("#emb-native-slot");if(t&&!t.contains(this._embNativeEditor)){t.innerHTML="",t.appendChild(this._embNativeEditor);const s=this._embEditorConfig??this._embCards()[this._embEditorIdx]?.card_config;if(s){const i=this._embNativeEditor;try{i.setConfig?.(s)}catch{}i.value=s}this._embNativeEditor.hass=this.hass}}this._pickerStyleRetries=0,this._styleEntityPickers()}_styleEntityPickers(){const e=this.renderRoot?.querySelectorAll("ha-entity-picker");if(!e||e.length===0)return;let t=!1;e.forEach(s=>{const n=s.shadowRoot?.querySelector("ha-generic-picker")?.shadowRoot?.querySelector("ha-picker-field")?.shadowRoot?.querySelector("ha-combo-box-item")?.shadowRoot;if(!n){t=!0;return}if(n.querySelector("style[data-mc-picker]"))return;const a=document.createElement("style");a.setAttribute("data-mc-picker",""),a.textContent=`
        :host { border-radius: 4px !important; }
        :host::after, :host::before { content: none !important; }
        #item > md-item { border-radius: 4px !important; color: var(--primary-color) !important; }
      `,n.appendChild(a)}),t&&!this._pickerStyleScheduled&&this._pickerStyleRetries<60&&(this._pickerStyleScheduled=!0,this._pickerStyleRetries++,requestAnimationFrame(()=>{this._pickerStyleScheduled=!1,this._styleEntityPickers()}))}_boxRows(e,t,s){return o`
      ${this._row("Background",this._colorPicker(`${e}-bg`,t.background,i=>s({background:i}),{onClear:()=>s({background:void 0,background_alpha:void 0})}))}

      ${this._row("Opacity",o`<div class="ec-opacity-row">
          <input type="range" min="0" max="1" step="0.01"
            .value=${String(t.background_alpha??_("box_background_alpha")??1)}
            @input=${i=>{const n=parseFloat(i.target.value);s({background_alpha:n})}}
          />
          <span class="ec-opacity-val">${Math.round((t.background_alpha??_("box_background_alpha")??1)*100)}%</span>
          <button class="ec-btn-clear" @click=${()=>s({background_alpha:void 0})} title="Clear">✕</button>
        </div>`)}

      ${this._row("Color",this._colorPicker(`${e}-col`,t.color,i=>s({color:i})))}

      ${this._row("Border",o`<input type="checkbox" .checked=${t.border??!1}
          @change=${i=>s({border:i.target.checked})}
        />`)}

      ${this._row("Border width (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0"
          .value=${t.border_width!=null?String(t.border_width):""}
          placeholder="1"
          @change=${i=>{const n=i.target.value;s({border_width:n===""?void 0:Number(n)})}}
        /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}

      ${this._row("Radius (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0"
          .value=${t.radius!=null?String(t.radius):""}
          placeholder="0"
          @change=${i=>{const n=i.target.value;s({radius:n===""?void 0:Number(n)})}}
        /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}

      ${this._row("Padding (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0"
          .value=${t.padding!=null?String(t.padding):""}
          placeholder="0"
          @change=${i=>{const n=i.target.value;s({padding:n===""?void 0:Number(n)})}}
        /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}

      ${this._row("Glow",o`<input type="checkbox" .checked=${t.glow??!1}
          @change=${i=>s({glow:i.target.checked})}
        />`)}

      ${this._row("Blur (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0"
          .value=${t.blur!=null?String(t.blur):""}
          placeholder="0"
          @change=${i=>{const n=i.target.value;s({blur:n===""?void 0:Number(n)})}}
        /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}
    `}_textRows(e,t,s){return o`
      ${this._row("Font size (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="6"
          .value=${t.font_size!=null?String(t.font_size):""}
          placeholder="inherit"
          @change=${i=>{const n=i.target.value;s({font_size:n===""?void 0:Number(n)})}}
        /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}

      ${this._row("Color",this._colorPicker(`${e}-col`,t.color,i=>s({color:i})))}

      ${this._row("Font weight",o`<select class="ec-select"
          .value=${t.font_weight!=null?String(t.font_weight):""}
          @change=${i=>{const n=i.target.value;s({font_weight:n===""?void 0:Number(n)})}}
        >
          <option value="" .selected=${t.font_weight==null}>(inherit)</option>
          <option value="400" .selected=${t.font_weight===400}>400 — Normal</option>
          <option value="600" .selected=${t.font_weight===600}>600 — Semi-bold</option>
          <option value="700" .selected=${t.font_weight===700}>700 — Bold</option>
        </select>`)}

      ${this._row("Font family",o`<input class="ec-input" type="text" .value=${t.font_family??""}
          placeholder="inherit"
          @change=${i=>{const n=i.target.value;s({font_family:n===""?void 0:n})}}
        />`)}

      ${this._row("Letter spacing (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number"
          .value=${t.letter_spacing!=null?String(t.letter_spacing):""}
          placeholder="0"
          @change=${i=>{const n=i.target.value;s({letter_spacing:n===""?void 0:Number(n)})}}
        /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}
    `}_renderAlignBar(){return o`
      <div class="ec-align-bar">
        <button class="ec-btn-align" @click=${()=>this._alignCards("left")} title="Align left edges">⇤ Left</button>
        <button class="ec-btn-align" @click=${()=>this._alignCards("centerH")} title="Center horizontally">↔ Center H</button>
        <button class="ec-btn-align" @click=${()=>this._alignCards("right")} title="Align right edges">⇥ Right</button>
        <button class="ec-btn-align" @click=${()=>this._alignCards("top")} title="Align top edges">⇡ Top</button>
        <button class="ec-btn-align" @click=${()=>this._alignCards("middleV")} title="Center vertically">↕ Middle V</button>
        <button class="ec-btn-align" @click=${()=>this._alignCards("bottom")} title="Align bottom edges">⇣ Bottom</button>
        <button class="ec-btn-align" @click=${()=>this._distribute("x")} title="Distribute horizontally within selection">⇔ Dist H (grp)</button>
        <button class="ec-btn-align" @click=${()=>this._distribute("y")} title="Distribute vertically within selection">⇕ Dist V (grp)</button>
        <button class="ec-btn-align" @click=${()=>this._distributeCanvas("x")} title="Distribute horizontally across full canvas">⇔ Dist H (canvas)</button>
        <button class="ec-btn-align" @click=${()=>this._distributeCanvas("y")} title="Distribute vertically across full canvas">⇕ Dist V (canvas)</button>
        <button class="ec-btn-align" @click=${()=>this._alignGroupToCanvas("x")} title="Center group horizontally on canvas">↔ Align H (canvas)</button>
        <button class="ec-btn-align" @click=${()=>this._alignGroupToCanvas("y")} title="Center group vertically on canvas">↕ Align V (canvas)</button>
        <button class="ec-btn-align" @click=${()=>this._groupCards()} title="Group selected cards — drag one to move all">Group</button>
        ${Array.from(this._selCards).some(e=>this._config?.cards[e]?.group)||Array.from(this._selEmbCards).some(e=>this._embCards()[e]?.group)?o`<button class="ec-btn-align" @click=${()=>this._ungroupCards()} title="Remove group from selected cards">Ungroup</button>`:m}
      </div>
    `}_quickNum(e,t,s,i){return o`<label class="ec-quick-field">
      <span>${e}</span>
      <span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number"
        min=${i?.min??""} max=${i?.max??""}
        placeholder=${i?.placeholder??""}
        .value=${t!=null?String(t):""}
        @change=${n=>s(n.target.value)}
      /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${n=>this._stepNumInput(n,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${n=>this._stepNumInput(n,1)}>+</button></span></span>
    </label>`}_renderCardQuickPanel(e){const t=this._config?.cards[e];if(!t)return m;const s=this._gridGeom();return o`
      <div class="ec-quick-panel">
        ${s?this._quickNum("Span",t.grid_span??1,i=>{const n=Math.max(1,Math.min(s.cols,Number(i)||1)),a=Math.max(8,n*s.cellW-s.padding);this._updateCard(e,{grid_span:n,width:a})},{min:1,max:s.cols}):m}
        ${this._quickNum("Width",t.width,i=>this._updateCard(e,{width:i===""?void 0:Number(i)}),{placeholder:"auto"})}
        ${this._quickNum("Field gap",t.field_gap,i=>this._updateCard(e,{field_gap:i===""?void 0:Number(i)}),{placeholder:"default"})}
        ${this._quickNum("Col gap",t.column_gap,i=>this._updateCard(e,{column_gap:i===""?void 0:Number(i)}),{placeholder:"default"})}
      </div>
    `}_renderEmbQuickPanel(e){const t=this._embCards()[e];if(!t)return m;const s=this._gridGeom();return o`
      <div class="ec-quick-panel">
        ${s?this._quickNum("Span",t.grid_span??1,i=>{const n=Math.max(1,Math.min(s.cols,Number(i)||1)),a=Math.max(8,n*s.cellW-s.padding);this._updateEmbCard(e,{grid_span:n,width:a})},{min:1,max:s.cols}):m}
        ${this._quickNum("Width",t.width,i=>this._updateEmbCard(e,{width:Number(i)}))}
        ${this._quickNum("Height",t.height,i=>this._updateEmbCard(e,{height:i===""?void 0:Number(i)}),{placeholder:"auto"})}
      </div>
    `}render(){if(!this._config)return m;if(this._wizStep>=0)return this._renderWizard();const{totalW:e,totalH:t}=rt(this._config),s=this._config.cards??[];return o`
      <div class="ec-version-bar">
        <span class="ec-version">Mosaic Canvas Card v${Ge} · build ${Ds}</span>
      </div>

      <!-- ── Live preview ── -->
      <dialog class="ec-preview${this._previewExpanded?" ec-preview--expanded":""}${this._previewExpanded&&this._barAtTop?" ec-bar-top":""}"
        @pointermove=${i=>{this._onCardMove(i),this._onPointMove(i),this._onZoneMove(i),this._onZoneResizeMove(i),this._onEmbCardMove(i),this._onBgMove(i)}}
        @pointerup=${i=>{this._onCardUp(i),this._onPointUp(i),this._onZoneUp(i),this._onZoneResizeUp(i),this._onEmbCardUp(i),this._onBgUp(i)}}
        @cancel=${i=>{i.preventDefault(),this._collapseExpanded()}}
        tabindex="-1"
      >
        ${this._previewExpanded?o`
        <div class="ec-canvas-area"
          @click=${i=>this._onCanvasAreaClick(i)}
        >
          <mosaic-canvas
            class="ec-preview-card"
            .hass=${this.hass}
            ?editor=${!0}
            @ec-boxes-changed=${i=>{this._previewBoxes=i.detail.boxes}}
          ></mosaic-canvas>
          ${this._renderGridOverlay()}
          <div class="ec-handles">
            ${this._renderBgOverlay()}
            ${s.map((i,n)=>{const a=`${n===this._selCard?" selected":""}${this._selCards.has(n)&&n!==this._selCard?" multi":""}${i.group?" grouped":""}`,r=this._previewBoxes[i.id];return r?o`
              <div
                class="ec-card-ov${a}"
                style="left:${r.x*100}%;top:${r.y*100}%;width:${r.w*100}%;height:${r.h*100}%;"
                @pointerdown=${l=>this._onCardDown(l,n)}
                title=${i.name??`Card ${n+1}`}
              ></div>`:o`
              <div
                class="ec-handle${a}"
                style="left:${i.position.x*100}%;top:${i.position.y*100}%;"
                @pointerdown=${l=>this._onCardDown(l,n)}
                title=${i.name??`Card ${n+1}`}
              ></div>`})}
            ${this._zones().map((i,n)=>{const a=this._zoneBox(i);return o`
              <div
                class="ec-zone-handle${n===this._selZone?" selected":""}"
                style="left:${a.x/e*100}%;top:${a.y/t*100}%;width:${a.w/e*100}%;height:${a.h/t*100}%;"
                @pointerdown=${r=>this._onZoneDown(r,n)}
                title=${i.name??`Zone ${n+1}`}
              >
                <span class="ec-zone-label">${i.name??`Zone ${n+1}`}</span>
                ${n===this._selZone?["tl","tr","bl","br"].map(r=>o`
                  <div
                    class="ec-zone-resize ec-zone-resize-${r}"
                    @pointerdown=${l=>this._onZoneResizeDown(l,n,r)}
                  ></div>`):m}
              </div>`})}
            ${this._embCards().map((i,n)=>{const a=`${n===this._selEmbCard?" selected":""}${this._selEmbCards.has(n)&&n!==this._selEmbCard?" multi":""}${i.group?" grouped":""}`,r=this._previewBoxes[i.id];return r?o`
              <div
                class="ec-emb-ov${a}"
                style="left:${r.x*100}%;top:${r.y*100}%;width:${r.w*100}%;height:${r.h*100}%;"
                @pointerdown=${l=>this._onEmbCardDown(l,n)}
                title=${i.name??`Embedded ${n+1}`}
              ></div>`:o`
              <div
                class="ec-emb-handle${a}"
                style="left:${i.position.x*100}%;top:${i.position.y*100}%;"
                @pointerdown=${l=>this._onEmbCardDown(l,n)}
                title=${i.name??`Embedded ${n+1}`}
              ></div>`})}
          </div>
          ${this._flows().length>0?o`
            <svg class="ec-flow-paths-overlay" viewBox="0 0 1 1" preserveAspectRatio="none">
              <defs>
                <filter id="ec-flow-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceGraphic" stdDeviation="0.003" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              ${this._flows().map((i,n)=>{const a=i.points.map(l=>Tt(l,s,this._previewBoxes)).map(l=>`${l.x},${l.y}`).join(" "),r=n===this._selFlow;return P`<polyline
                  points="${a}"
                  fill="none"
                  stroke="${r?"rgba(0,212,255,0.9)":"rgba(0,180,255,0.55)"}"
                  stroke-width="${r?3:2.5}"
                  stroke-dasharray="6 4"
                  vector-effect="non-scaling-stroke"
                  filter="url(#ec-flow-glow)"
                ></polyline>`})}
            </svg>
          `:m}
          ${this._selFlow>=0?(()=>{const i=this._flows()[this._selFlow];if(!i)return m;const n=["top","right","bottom","left"];return o`
              <div class="ec-flow-layer"
                @click=${a=>this._onFlowLayerClick(a)}
              >
                ${this._selPoint>=0?s.map(a=>n.map(r=>{const l=this._previewBoxes[a.id];if(!l)return m;let c,p;switch(r){case"top":c=l.x+l.w/2,p=l.y;break;case"right":c=l.x+l.w,p=l.y+l.h/2;break;case"bottom":c=l.x+l.w/2,p=l.y+l.h;break;case"left":c=l.x,p=l.y+l.h/2;break;default:c=l.x+l.w/2,p=l.y+l.h/2;break}return o`<div
                    class="ec-snap"
                    style="left:${c*100}%;top:${p*100}%;"
                    @click=${u=>{u.stopPropagation(),this._updateFlowPoint(this._selFlow,this._selPoint,{card:a.id,side:r,x:void 0,y:void 0})}}
                  ></div>`})):m}
                ${i.points.map((a,r)=>{const l=Tt(a,s,this._previewBoxes);return o`<div
                    class="ec-flow-node${r===this._selPoint?" selected":""}${a.card!=null?" anchored":" free"}"
                    style="left:${l.x*100}%;top:${l.y*100}%;"
                    @pointerdown=${c=>this._onPointDown(c,r)}
                  ></div>`})}
              </div>
            `})():m}
        </div>
        <div class="ec-expanded-bottom-bar">
            <div class="ec-bottom-bar-left">
              ${this._showAddFlowInput?o`
                <input class="ec-flow-name-input" type="text"
                  placeholder="Flow name"
                  .value=${this._newFlowName}
                  @input=${i=>{this._newFlowName=i.target.value}}
                  @keydown=${i=>{i.key==="Enter"&&this._addFlowFromExpanded(),i.key==="Escape"&&(i.preventDefault(),i.stopPropagation(),this._showAddFlowInput=!1,this._newFlowName="")}}
                >
                <button class="ec-btn-add" @click=${()=>this._addFlowFromExpanded()}>Add</button>
                <button class="ec-btn-remove" @click=${()=>{this._showAddFlowInput=!1,this._newFlowName=""}}>✕</button>
              `:o`
                <button class="ec-btn-add" @click=${()=>{this._showAddFlowInput=!0}}>+ Add Flow Line</button>
              `}
            </div>
            <div class="ec-bottom-bar-center">
              ${this._selCards.size+this._selEmbCards.size>=2?this._renderAlignBar():this._selCards.size===1&&this._selEmbCards.size===0?this._renderCardQuickPanel(Array.from(this._selCards)[0]):this._selEmbCards.size===1&&this._selCards.size===0?this._renderEmbQuickPanel(Array.from(this._selEmbCards)[0]):this._selFlow>=0?o`<span class="ec-hint-text">Flow selected — click card anchor points to connect endpoints</span>`:o`
                        <span class="ec-hint-text">Click on a flow to select it for editing or Add Flow to create a new one</span>
                        <span class="ec-hint-text">Click-drag a card to move it · Shift-click to multi-select · Alt-click to cycle stacked cards</span>
                      `}
            </div>
            ${this._selCards.size+this._selEmbCards.size>=2?o`
              <button class="ec-btn-done" title="Finish multi-card editing"
                @click=${()=>{this._selCards=new Set,this._selEmbCards=new Set}}>✓ Done</button>
            `:this._selCards.size===1&&this._selEmbCards.size===0||this._selEmbCards.size===1&&this._selCards.size===0?o`
              <button class="ec-btn-done" title="Finish card editing"
                @click=${()=>{this._selCards=new Set,this._selEmbCards=new Set,this._selCard=-1,this._selEmbCard=-1}}>✓ Done</button>
            `:this._selFlow>=0?o`
              <button class="ec-btn-done" title="Finish flow editing"
                @click=${()=>{this._selFlow=-1}}>✓ Done</button>
            `:m}
            ${this._previewExpanded?o`
              <button class="ec-side-close" title="Close Mosaic Editor Window" @click=${()=>this._collapseExpanded()}>Close Window</button>
            `:m}
          </div>
        `:o`
        <div class="ec-open-editor-wrap">
          <button class="ec-open-editor-btn" @click=${()=>{this._previewExpanded=!0}}>
            <ha-icon icon="mdi:arrow-expand-all"></ha-icon>
            Open Mosaic Editor Window
          </button>
        </div>
        `}
        ${this._renderGGModal()}
        ${this._renderEmbPickerModal()}
        ${this._renderEmbEditorModal()}
        ${this._renderFlowCompleteModal()}
      </dialog>

      ${this._previewExpanded?m:this._renderControls()}
    `}_navOpenPanel(e){this._navPanel=e,this._navPath=[]}_navBack(){this._navPath.length?this._navPath=this._navPath.slice(0,-1):this._navPanel=""}_navRow(e,t,s,i){return o`
      <button class="ec-nav-item" @click=${i}>
        <ha-icon class="ec-nav-item-icon" icon=${e}></ha-icon>
        <span class="ec-nav-item-text">
          <span class="ec-nav-item-label">${t}</span>
          ${s?o`<span class="ec-nav-item-hint">${s}</span>`:m}
        </span>
        <ha-icon class="ec-nav-item-chevron" icon="mdi:chevron-right"></ha-icon>
      </button>
    `}_navBtn(e,t,s,i){return o`
      <button class="ec-nav-card" @click=${()=>this._navPush(e,t)}>
        <ha-icon class="ec-nav-card-icon" icon=${i}></ha-icon>
        <span class="ec-nav-card-text">
          <span class="ec-nav-card-label">${t}</span>
          ${s?o`<span class="ec-nav-card-hint">${s}</span>`:m}
        </span>
        <ha-icon class="ec-nav-card-chevron" icon="mdi:chevron-right"></ha-icon>
      </button>
    `}_itemCard(e){const{dragKey:t,icon:s,label:i,sub:n,selected:a,multi:r,onClick:l,actions:c}=e;return o`
      <div
        class="ec-item-card${a?" selected":""}${r?" multi":""}${this._dragSrc===t?" ec-dragging":""}"
        draggable="true"
        @dragstart=${p=>this._onDragStart(p,t)}
        @dragover=${p=>this._onDragOver(p)}
        @dragleave=${p=>this._onDragLeave(p)}
        @drop=${p=>this._onDrop(p,t)}
        @dragend=${p=>this._onDragEnd(p)}
        @click=${l}
      >
        <span class="ec-drag-handle" title="Drag to reorder"></span>
        <ha-icon class="ec-item-card-icon" icon=${s}></ha-icon>
        <span class="ec-item-card-text">
          <span class="ec-item-card-label">${i}</span>
          ${n?o`<span class="ec-item-card-sub">${n}</span>`:m}
        </span>
        <span class="ec-item-card-actions">${c??m}</span>
        <ha-icon class="ec-item-card-chevron" icon="mdi:chevron-right"></ha-icon>
      </div>
    `}_renderBreadcrumb(){const e=[{label:S._TAB_LABEL[this._navTab],onClick:()=>{this._navPanel="",this._navPath=[]}}];return this._navPanel&&(e.push({label:S._PANEL_META[this._navPanel]?.title??this._navPanel,onClick:()=>{this._navPath=[]}}),this._navPath.forEach((t,s)=>e.push({label:t.label,onClick:()=>{this._navPath=this._navPath.slice(0,s+1)}}))),o`
      <div class="ec-breadcrumb">
        ${e.map((t,s)=>o`
          <button class="ec-crumb${s===e.length-1?" ec-crumb--active":""}" @click=${t.onClick}>${t.label}</button>
          ${s<e.length-1?o`<ha-icon class="ec-crumb-sep" icon="mdi:chevron-right"></ha-icon>`:m}
        `)}
      </div>
    `}_renderRibbonItems(){return this._navTab==="cards"?o`
        ${this._navRow("mdi:view-dashboard","Mosaic Card","Values, labels, icons & Element Library",()=>this._navOpenPanel("mosaic"))}
        ${this._navRow("mdi:picture-in-picture-bottom-right","Popover Cards","Shown on a trigger action",()=>this._navOpenPanel("popover"))}
        ${this._navRow("mdi:widgets","Embedded External Cards","Any native or custom HA card",()=>this._navOpenPanel("embedded"))}
      `:this._navTab==="elements"?o`
        ${this._navRow("mdi:chart-timeline-variant","Animated Flow Lines","Entity-driven CSS flows",()=>this._navOpenPanel("flows"))}
        ${this._navRow("mdi:gesture-tap-box","Clickable Zones","Bounded action areas",()=>this._navOpenPanel("zones"))}
        ${this._navRow("mdi:memory","Virtual Entities","Helper-like computed values",()=>this._navOpenPanel("virtuals"))}
      `:o`
      ${this._navRow("mdi:image-size-select-actual","Canvas","Background, aspect & placement mode",()=>this._navOpenPanel("canvas"))}
      ${this._navRow("mdi:palette","Global Defaults","Inherited element styling",()=>this._navOpenPanel("defaults"))}
      ${this._navRow("mdi:bookmark-multiple","Templates","Import & export layout",()=>this._navOpenPanel("templates"))}
    `}_renderRibbon(){return o`
      <div class="ec-nav-shell">
        <div class="ec-nav-rail">
          ${[{key:"cards",icon:"mdi:view-grid",label:"Cards"},{key:"elements",icon:"mdi:shape",label:"Elements"},{key:"settings",icon:"mdi:cog",label:"Settings"}].map(t=>o`
            <button class="ec-nav-tab${this._navTab===t.key?" active":""}"
              @click=${()=>{this._navTab=t.key,this._navPanel="",this._navPath=[]}}
            >
              <ha-icon icon=${t.icon}></ha-icon>
              <span>${t.label}</span>
            </button>
          `)}
        </div>
        <div class="ec-nav-list">${this._renderRibbonItems()}</div>
      </div>
    `}_renderPanelHost(){const e=S._PANEL_META[this._navPanel],t=this._navPath.length?this._navPath[this._navPath.length-1].label:e?.title??"";return o`
      <div class="ec-panel-header">
        <button class="ec-panel-back" @click=${()=>this._navBack()}>
          <ha-icon icon="mdi:arrow-left"></ha-icon> ${this._navPath.length?"Back":"Ribbon"}
        </button>
        <ha-icon class="ec-panel-header-icon" icon=${e?.icon??"mdi:tune"}></ha-icon>
        <span class="ec-panel-header-title">${t}</span>
        <div class="ec-panel-header-spacer"></div>
        <button class="ec-panel-done" @click=${()=>{this._navPanel="",this._navPath=[]}}>
          <ha-icon icon="mdi:check"></ha-icon> Done
        </button>
      </div>
      <div class="ec-panel-body">
        ${this._navPath.length===0&&e?.desc?o`<p class="ec-panel-desc">${e.desc}</p>`:m}
        ${this._renderPanelBody()}
      </div>
    `}_renderPanelBody(){switch(this._navPanel){case"mosaic":return this._renderMosaicPanel();case"popover":return this._renderPopoverPanel();case"embedded":return this._renderEmbeddedPanel();case"flows":return this._renderFlowsRibbonPanel();case"zones":return this._renderZonesRibbonPanel();case"virtuals":return this._renderVirtualsRibbonPanel();case"canvas":return this._renderCanvasRibbonPanel();case"defaults":return this._renderDefaultsRibbonPanel();case"templates":return this._renderTemplatesRibbonPanel();default:return o``}}_renderControls(){return o`
      <div class="ec-controls">
        ${this._renderBreadcrumb()}
        ${this._navPanel===""?this._renderRibbon():this._renderPanelHost()}
      </div>
    `}_renderMosaicPanel(){const e=this._config?.cards??[],t=this._navPath;if(t.length===0)return o`
        <div class="ec-section-header">
          <span></span>
          <button class="ec-btn-add" @click=${this._addCard}>+ Mosaic Card</button>
        </div>
        ${e.length===0?o`<p class="ec-empty">No mosaic cards yet — click "+ Mosaic Card" to add one.</p>`:e.map((a,r)=>this._itemCard({dragKey:`card:${r}`,icon:"mdi:view-dashboard",label:a.name??`Card ${r+1}`,sub:`${a.fields.length} field${a.fields.length===1?"":"s"}`,selected:r===this._selCard,multi:this._selCards.has(r),onClick:l=>{if(l.ctrlKey||l.metaKey){const c=new Set(this._selCards);c.has(r)?c.delete(r):c.add(r),this._selCards=c,this._selCard=r}else this._selCard=r,this._selField=-1,this._selCards=new Set([r]),this._navPush(`card:${r}`,a.name??`Card ${r+1}`)},actions:o`
                  ${this._copySourceIdx===r?o`<span class="ec-copy-badge">Copied</span>`:o`<button
                        class="ec-btn-copy"
                        @click=${l=>{l.stopPropagation(),this._copyFields(r)}}
                        title="Copy fields from this card"
                      >⎘</button>`}
                  ${this._copiedFields&&r!==this._copySourceIdx?o`<button
                        class="ec-btn-paste"
                        @click=${l=>{l.stopPropagation(),this._pasteFields(r)}}
                        title="Paste fields onto this card (replaces existing fields)"
                      >⎗</button>`:m}
                  <button
                    class="ec-btn-remove"
                    @click=${l=>{l.stopPropagation(),this._removeCard(r)}}
                    title="Remove card"
                  >✕</button>
                `}))}
      `;const s=this._selCard,i=e[s];if(!i)return o``;if(t.length===1)return o`
        ${this._cardSectionMenu()}
        ${this._renderFieldList(s,i)}
      `;const n=t[1].key;if(n.startsWith("field:")){const a=this._selField,r=i.fields[a];return r?t.length===4&&t[2].key==="fsec:series"&&t[3].key.startsWith("gs:")?this._fieldSecGraphSeriesItem(s,a,r,this._selSeries):t.length===3?this._fieldSection(s,a,r,t[2].key):this._renderFieldPanel(s,a,r):o``}return this._cardSection(s,i,n)}_cardSectionMenu(){return o`
      ${this._navBtn("sec:defaults","Card Defaults","Name, anchor, align, columns, gaps","mdi:tune")}
      ${this._navBtn("sec:style","Card Style","Transparent, background, border, glow","mdi:palette")}
      ${this._navBtn("sec:text","Text Styles","Value & label style","mdi:format-title")}
      ${this._navBtn("sec:visibility","Card Visibility","Show / hide by condition","mdi:eye-outline")}
      ${this._navBtn("sec:actions","Actions","Tap · hold · double tap","mdi:gesture-tap")}
      ${this._navBtn("sec:bg","Background Image","Image behind the card fields","mdi:image-outline")}
    `}_cardSection(e,t,s){switch(s){case"sec:defaults":return this._cardSecDefaults(e,t);case"sec:style":return this._cardSecStyle(e,t);case"sec:text":return this._cardSecText(e,t);case"sec:visibility":return this._cardSecVisibility(e,t);case"sec:actions":return this._cardSecActions(e,t);case"sec:bg":return this._cardSecBg(e,t);default:return o``}}_cardSecDefaults(e,t){return o`
      <div class="ec-section">
        ${this._row("Name",o`<input class="ec-input" type="text" .value=${t.name??""}
            @change=${s=>this._updateCard(e,{name:s.target.value})}
          />`)}

        ${this._gridGeom()?m:this._row("Anchor",o`<select class="ec-select"
            .value=${t.anchor??_("anchor")??"top-left"}
            @change=${s=>this._updateCard(e,{anchor:s.target.value})}
          >
            ${Se.map(s=>o`<option value=${s} .selected=${(t.anchor??_("anchor")??"top-left")===s}>${s}</option>`)}
          </select>`)}

        ${this._row("Align",o`<select class="ec-select"
            .value=${t.align??_("align")??"left"}
            @change=${s=>this._updateCard(e,{align:s.target.value})}
          >
            ${ne.map(s=>o`<option value=${s} .selected=${(t.align??_("align")??"left")===s}>${s}</option>`)}
          </select>`)}

        ${this._optRow("Columns","1–8 content columns",t.columns===void 0,o`<select class="ec-select"
            .value=${String(t.columns??_("card_columns")??1)}
            @change=${s=>{const i=Number(s.target.value);this._updateCard(e,{columns:i})}}
          >
            <option value="1" .selected=${(t.columns??_("card_columns")??1)===1}>1</option>
            <option value="2" .selected=${(t.columns??_("card_columns")??1)===2}>2</option>
            <option value="3" .selected=${(t.columns??_("card_columns")??1)===3}>3</option>
            <option value="4" .selected=${(t.columns??_("card_columns")??1)===4}>4</option>
            <option value="5" .selected=${(t.columns??_("card_columns")??1)===5}>5</option>
            <option value="6" .selected=${(t.columns??_("card_columns")??1)===6}>6</option>
            <option value="7" .selected=${(t.columns??_("card_columns")??1)===7}>7</option>
            <option value="8" .selected=${(t.columns??_("card_columns")??1)===8}>8</option>
          </select>`,s=>this._updateCard(e,{columns:s?void 0:t.columns??_("card_columns")??1}))}

        ${this._gridGeom()?this._row("Columns (span)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="1" max=${this._gridGeom().cols}
            .value=${String(t.grid_span??1)}
            @change=${s=>{const i=this._gridGeom();if(!i)return;const n=Math.max(1,Math.min(i.cols,Number(s.target.value)||1)),a=Math.max(8,n*i.cellW-i.padding);this._updateCard(e,{grid_span:n,width:a})}}
          /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>`):m}

        ${this._row("Width (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="20"
            .value=${t.width!=null?String(t.width):""}
            placeholder="auto"
            @change=${s=>{const i=s.target.value;this._updateCard(e,{width:i===""?void 0:Number(i)})}}
          /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>`)}

        ${this._optRow("Field gap (px)","Vertical space between fields",t.field_gap===void 0,o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0"
            .value=${String(t.field_gap??_("field_gap")??4)}
            @change=${s=>{const i=s.target.value;this._updateCard(e,{field_gap:i===""?void 0:Number(i)})}}
          /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>`,s=>this._updateCard(e,{field_gap:s?void 0:t.field_gap??_("field_gap")??4}))}

        ${this._optRow("Column gap (px)","Space between field columns",t.column_gap===void 0,o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0"
            .value=${String(t.column_gap??_("column_gap")??3)}
            @change=${s=>{const i=s.target.value;this._updateCard(e,{column_gap:i===""?void 0:Number(i)})}}
          /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>`,s=>this._updateCard(e,{column_gap:s?void 0:t.column_gap??_("column_gap")??3}))}

        ${this._row("Transparent",o`<input type="checkbox" .checked=${t.transparent??!1}
            @change=${s=>this._updateCard(e,{transparent:s.target.checked||void 0})}
          />`)}
      </div>
    `}_cardSecVisibility(e,t){return o`
      <div class="ec-section">
        ${this._row("Entity",o`<ha-entity-picker
            .hass=${this.hass}
            .value=${t.visible_when?.entity??""}
            allow-custom-entity
            @value-changed=${s=>{const i=s.detail.value;i?this._updateCard(e,{visible_when:{entity:i,operator:t.visible_when?.operator??"==",value:t.visible_when?.value??"on"}}):this._updateCard(e,{visible_when:void 0})}}
          ></ha-entity-picker>`)}
        ${t.visible_when?o`
          ${this._row("Operator",o`<select class="ec-select"
              .value=${t.visible_when.operator}
              @change=${s=>this._updateCard(e,{visible_when:{...t.visible_when,operator:s.target.value}})}
            >
              ${[["==","Equals"],["!=","Not Equal"],[">","Greater Than"],["<","Less Than"],[">=","Greater Than - Equal To"],["<=","Less Than - Equal To"]].map(([s,i])=>o`<option value=${s} .selected=${t.visible_when.operator===s}>${i}</option>`)}
            </select>`)}
          ${this._row("Value",o`<input class="ec-input" type="text" .value=${t.visible_when.value}
              placeholder="on / off / 100 / home …"
              @change=${s=>this._updateCard(e,{visible_when:{...t.visible_when,value:s.target.value}})}
            />`)}
        `:m}
      </div>
    `}_cardSecStyle(e,t){return o`
      <div class="ec-section">
        ${t.transparent?o`<p class="ec-hint">This card is Transparent (set in Card Defaults) — box style is hidden while transparent.</p>`:o`
        ${this._row("Use global card style",o`<input type="checkbox" .checked=${t.box===void 0}
            @change=${s=>{s.target.checked?this._updateCard(e,{box:void 0}):this._updateCard(e,{box:{}})}}
          />`)}
        ${t.box!==void 0?o`
          <div class="ec-subsection-title">Box style</div>
          ${this._boxRows(`c${e}`,t.box,s=>this._updateCardBox(e,s))}
        `:m}
        `}
      </div>
    `}_cardSecText(e,t){return o`
      <div class="ec-section">
        ${this._row("Use global value style",o`<input type="checkbox" .checked=${t.value_style===void 0}
            @change=${s=>{s.target.checked?this._updateCard(e,{value_style:void 0}):this._updateCard(e,{value_style:{}})}}
          />`)}
        ${t.value_style!==void 0?o`
          <div class="ec-subsection-title">Value text style</div>
          ${this._textRows(`c${e}-vs`,t.value_style,s=>this._updateCard(e,{value_style:{...t.value_style,...s}}))}
        `:m}

        ${this._row("Use global label style",o`<input type="checkbox" .checked=${t.label_style===void 0}
            @change=${s=>{s.target.checked?this._updateCard(e,{label_style:void 0}):this._updateCard(e,{label_style:{}})}}
          />`)}
        ${t.label_style!==void 0?o`
          <div class="ec-subsection-title">Label text style</div>
          ${this._textRows(`c${e}-ls`,t.label_style,s=>this._updateCard(e,{label_style:{...t.label_style,...s}}))}
        `:m}
      </div>
    `}_cardSecActions(e,t){return o`
      <div class="ec-section">
        ${this._actionRows({tap_action:t.tap_action,hold_action:t.hold_action,double_tap_action:t.double_tap_action},s=>this._updateCard(e,s))}
      </div>
    `}_cardSecBg(e,t){return o`
      <div class="ec-section">
            ${this._row("URL",o`<input class="ec-input" type="text"
                .value=${t.bg?.url??""}
                placeholder="/local/image.png or https://…"
                @change=${s=>{const i=s.target.value.trim();this._updateCard(e,{bg:i?{...t.bg,url:i}:void 0})}}
              />`)}
            ${t.bg?.url?o`
              ${this._row("Fit",o`<select class="ec-select"
                  .value=${t.bg.fit??"cover"}
                  @change=${s=>this._updateCard(e,{bg:{...t.bg,fit:s.target.value}})}
                >
                  <option value="cover"   .selected=${(t.bg.fit??"cover")==="cover"}>cover (fill &amp; crop)</option>
                  <option value="contain" .selected=${t.bg.fit==="contain"}>contain (letterbox)</option>
                  <option value="fill"    .selected=${t.bg.fit==="fill"}>fill (stretch)</option>
                  <option value="none"    .selected=${t.bg.fit==="none"}>none (natural size)</option>
                </select>`)}
              ${this._row("Opacity",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0" max="1" step="0.05"
                  .value=${String(t.bg.opacity??1)}
                  @change=${s=>{const i=parseFloat(s.target.value);this._updateCard(e,{bg:{...t.bg,opacity:isNaN(i)?void 0:Math.min(1,Math.max(0,i))}})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>`)}
              ${this._row("Width (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="1"
                  .value=${t.bg.width!=null?String(t.bg.width):""}
                  placeholder="fill card"
                  @change=${s=>{const i=s.target.value;this._updateCard(e,{bg:{...t.bg,width:i===""?void 0:Number(i)}})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>`)}
              ${this._row("Height (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="1"
                  .value=${t.bg.height!=null?String(t.bg.height):""}
                  placeholder="fill card"
                  @change=${s=>{const i=s.target.value;this._updateCard(e,{bg:{...t.bg,height:i===""?void 0:Number(i)}})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>`)}
              <div class="ec-subsection-title">Padding (px)</div>
              ${this._row("Top / Bottom",o`<div style="display:flex;gap:4px;">
                  <span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0" placeholder="Top"
                    .value=${t.bg.padding_top!=null?String(t.bg.padding_top):""}
                    @change=${s=>{const i=s.target.value;this._updateCard(e,{bg:{...t.bg,padding_top:i===""?void 0:Number(i)}})}}
                  /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>
                  <span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0" placeholder="Bottom"
                    .value=${t.bg.padding_bottom!=null?String(t.bg.padding_bottom):""}
                    @change=${s=>{const i=s.target.value;this._updateCard(e,{bg:{...t.bg,padding_bottom:i===""?void 0:Number(i)}})}}
                  /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>
                </div>`)}
              ${this._row("Left / Right",o`<div style="display:flex;gap:4px;">
                  <span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0" placeholder="Left"
                    .value=${t.bg.padding_left!=null?String(t.bg.padding_left):""}
                    @change=${s=>{const i=s.target.value;this._updateCard(e,{bg:{...t.bg,padding_left:i===""?void 0:Number(i)}})}}
                  /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>
                  <span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0" placeholder="Right"
                    .value=${t.bg.padding_right!=null?String(t.bg.padding_right):""}
                    @change=${s=>{const i=s.target.value;this._updateCard(e,{bg:{...t.bg,padding_right:i===""?void 0:Number(i)}})}}
                  /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>
                </div>`)}
            `:m}
      </div>
    `}_fieldName(e){return e.display_name??e.text??(e.entity?.startsWith("virtual:")?this._virtuals().find(t=>`virtual:${t.id}`===e.entity)?.name??e.entity:this.hass?.states[e.entity??""]?.attributes?.friendly_name??e.entity)??e.icon??"(untitled field)"}_fieldSub(e){const t=e.type==="graph"&&e.graph_type?e.graph_type:e.type==="svg"&&(e.shape||e.svg)?e.shape??e.svg.split("/").pop()?.replace(/\.svg$/i,"")??"":"";return`${e.column!=null?`C${e.column} · `:""}${Ce[e.type]}${t?" · "+t:""}`}_renderFieldList(e,t){const s=t.fields;return o`
      <div class="ec-section ec-section--fields">
        <div class="ec-section-header">
          <span class="ec-section-title">Fields</span>
          ${this._copiedField?o`<button class="ec-btn-paste"
            @click=${()=>this._pasteField(e)}
            title="Paste copied field onto this card">⎗ Field</button>`:m}
          <button class="ec-btn-add" @click=${()=>this._addField(e)}>+ Field</button>
        </div>
        ${s.length===0?o`<p class="ec-empty">No fields — click "+ Field".</p>`:s.map((i,n)=>this._itemCard({dragKey:`field:${e}:${n}`,icon:ys[i.type],label:this._fieldName(i),sub:this._fieldSub(i),selected:n===this._selField,onClick:()=>{this._selField=n,this._navPush(`field:${n}`,`Field ${n+1}`)},actions:o`
                  ${this._copiedFieldSrc?.isExt===!1&&this._copiedFieldSrc.ci===e&&this._copiedFieldSrc.fi===n?o`<span class="ec-copy-badge">Copied</span>`:o`<button class="ec-btn-copy"
                        @click=${a=>{a.stopPropagation(),this._copyField(e,n,!1)}}
                        title="Copy this field">⎘</button>`}
                  <button class="ec-btn-remove"
                    @click=${a=>{a.stopPropagation(),this._removeField(e,n)}}
                    title="Remove">✕</button>
                `}))}
      </div>
    `}_isTimeUntilVirtual(e){if(!e.entity?.startsWith("virtual:"))return!1;const t=e.entity.slice(8);return this._config?.virtuals?.find(s=>s.id===t)?.op==="time_until"}_displayUnit(e,t){if(t!==void 0)return t;if(!e||e.startsWith("virtual:")||!this.hass)return"";const s=this.hass.states[e];if(!s)return"";const i=s.attributes?.unit_of_measurement??"";if((s.attributes?.device_class??"")==="power"){const a=this._config?.defaults?.power_unit;return a==="W"||a==="kW"?a:"W or kW"}return i==="kWh"||i==="MWh"?"kWh or MWh":i}_isThermometerSvg(e){return!!e.svg?.toLowerCase().includes("thermometer")}_isHorizontalThermometerSvg(e){return!!e.svg?.toLowerCase().includes("thermometer-horizontal")}_isBatterySvg(e){return!!e.svg?.toLowerCase().includes("battery")}_isInverterSvg(e){return!!e.svg?.toLowerCase().includes("inverter")}_isGaugeSvg(e){return!!e.svg?.toLowerCase().includes("gauge")}_elementLabel(e){return e.type==="graph"?Ne.find(t=>t.value===e.graph_type)?.label??e.graph_type??"Graph":e.svg?(e.svg.split("/").pop()?.replace(/\.svg$/i,"")??"").replace(/[-_]/g," ").replace(/\b\w/g,s=>s.toUpperCase())||"SVG element":"None selected"}_renderTuLayoutBuilder(e,t){const s=e.time_until_layout??[],i=c=>t({time_until_layout:[...s,c]}),n=c=>{const p=s.filter((u,h)=>h!==c);t({time_until_layout:p.length?p:void 0})},a=(c,p)=>{const u=[...s],h=c+p;h<0||h>=u.length||([u[c],u[h]]=[u[h],u[c]],t({time_until_layout:u}))},r=(c,p)=>{const u=[...s];u[c]={...u[c],...p},t({time_until_layout:u})},l=c=>c.type==="label"?o`<span class="ec-tu-chip ec-tu-chip--label">⏱ Time Until Label</span>`:c.type==="value"?o`<span class="ec-tu-chip ec-tu-chip--value">⟨value⟩</span>`:c.type==="newline"?o`<span class="ec-tu-chip ec-tu-chip--newline">↵ New Line</span>`:m;return o`
      <div class="ec-subsection-title">Time Until Layout</div>
      ${s.length===0?o`<p class="ec-empty">No items — use the buttons below to build the layout.</p>`:s.map((c,p)=>o`
            <div class="ec-list-row">
              <button class="ec-btn-reorder" ?disabled=${p===0}
                @click=${()=>a(p,-1)} title="Move up">▲</button>
              <button class="ec-btn-reorder" ?disabled=${p===s.length-1}
                @click=${()=>a(p,1)} title="Move down">▼</button>
              <span class="ec-list-label" style="flex:1;min-width:0;">
                ${c.type==="text"?o`<input class="ec-input" type="text" .value=${c.text??""}
                      placeholder="enter text"
                      @input=${u=>r(p,{text:u.target.value})}
                      style="width:100%;box-sizing:border-box;" />`:l(c)}
              </span>
              <button class="ec-btn-remove" @click=${()=>n(p)} title="Remove">✕</button>
            </div>
          `)}
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px;">
        <button class="ec-btn-add" @click=${()=>i({type:"text",text:""})}>+ Text</button>
        <button class="ec-btn-add" @click=${()=>i({type:"label"})}>+ Label</button>
        <button class="ec-btn-add" @click=${()=>i({type:"newline"})}>↵ New Line</button>
        <button class="ec-btn-add" @click=${()=>i({type:"value"})}>+ Value</button>
      </div>
    `}_fieldHeader(e,t,s){return o`
        ${this._row("Type",o`<select class="ec-select"
            .value=${s.type==="graph"?"svg":s.type}
            @change=${i=>{const n=i.target.value;this._updateField(e,t,{type:n}),n==="svg"&&this._openGGPicker(e,t)}}
          >
            ${fs.map(i=>o`<option value=${i} .selected=${(s.type==="graph"?"svg":s.type)===i}>${Ce[i]}</option>`)}
          </select>`)}

        ${s.type==="svg"||s.type==="graph"?this._row("Element",o`<div style="display:flex;gap:8px;align-items:center;">
            <span class="ec-input" style="flex:1;min-width:0;opacity:0.85;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${this._elementLabel(s)}</span>
            <button class="ec-lib-browse-btn" style="flex:0 0 auto;white-space:nowrap;" @click=${()=>this._openGGPicker(e,t)}>Select SVG Element</button>
          </div>`):m}

        ${this._row("Display Name",o`<input class="ec-input" type="text"
            .value=${s.display_name??""}
            placeholder="Friendly name for the field list"
            @change=${i=>{const n=i.target.value.trim();this._updateField(e,t,{display_name:n===""?void 0:n})}}
          />`)}

        ${this._row("Column",o`<div style="display:flex;gap:4px;align-items:center">
            <span class="ec-num-wrap"><input class="ec-input ec-input-num-small" type="number" min="1" max="8"
              .value=${s.column!=null?String(s.column):""}
              placeholder="auto"
              title="Force this field into a specific column (1–8). Leave blank for auto flow."
              @change=${i=>{const n=i.target.value;this._updateField(e,t,{column:n===""?void 0:Number(n)})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>
            <span style="font-size:11px;opacity:0.6">Span end (Opt)</span>
            <span class="ec-num-wrap"><input class="ec-input ec-input-num-small" type="number" min="2" max="8"
              .value=${s.column_end!=null?String(s.column_end):""}
              placeholder="–"
              title="Span End Column (Opt) — last column this field occupies"
              @change=${i=>{const n=i.target.value;this._updateField(e,t,{column_end:n===""?void 0:Number(n)})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>
          </div>`)}
    `}_renderFieldPanel(e,t,s){return s.type==="blank"||s.type==="rule"?o`
        <div class="ec-section ec-section--fields">
          ${this._fieldHeader(e,t,s)}
          ${this._fieldSecBlankOrRule(e,t,s)}
        </div>
      `:o`
      <div class="ec-section ec-section--fields">
        ${this._fieldHeader(e,t,s)}
        ${this._fieldSectionMenu(s)}
      </div>
    `}_fieldSectionMenu(e){const t=[];return e.type==="value"?(t.push(this._navBtn("fsec:source","Value Source","Entity, virtual entity, time-until layout","mdi:database")),t.push(this._navBtn("fsec:label","Value Label","Optional label text & position","mdi:tag-text-outline"))):e.type==="icon"?t.push(this._navBtn("fsec:icon","Icon","mdi icon name","mdi:emoticon-outline")):e.type==="label"?t.push(this._navBtn("fsec:content","Content","Label text","mdi:format-text")):e.type==="svg"?(t.push(this._navBtn("fsec:source","Value Source","Entity, fill source","mdi:database")),this._isInverterSvg(e)||t.push(this._navBtn("fsec:range","Range","Min / max value","mdi:arrow-expand-vertical")),t.push(this._navBtn("fsec:colors","Colors","Fill direction, fill, gradient, svg colour","mdi:palette")),t.push(this._navBtn("fsec:size","Size","Height, width","mdi:resize")),this._isInverterSvg(e)||t.push(this._navBtn("fsec:thresholds","Color Thresholds","Value-driven fill colour overrides","mdi:format-color-fill")),this._isGaugeSvg(e)&&t.push(this._navBtn("fsec:gauge","Gauge Labels","Min/max labels, value display","mdi:speedometer")),this._isThermometerSvg(e)&&t.push(this._navBtn("fsec:thermo","Thermometer","Ticks, grid, temperature text","mdi:thermometer"))):e.type==="graph"&&(t.push(this._navBtn("fsec:graph","Graph Settings","Type, axes, legend, range, size","mdi:chart-bar")),t.push(this._navBtn("fsec:series","Series","Entities plotted on the graph","mdi:chart-line"))),(e.type==="value"||e.type==="icon")&&(t.push(this._navBtn("fsec:stats","HA Statistics","Advanced statistics integration","mdi:chart-box-outline")),t.push(this._navBtn("fsec:display","Display","Unit, decimals, hide below","mdi:eye-outline"))),t.push(this._navBtn("fsec:style","Text Style","Align & value/label text style","mdi:format-title")),t.push(this._navBtn("fsec:actions","Actions","Tap · hold · double tap","mdi:gesture-tap")),o`${t}`}_fieldSection(e,t,s,i){switch(i){case"fsec:source":return s.type==="svg"?this._fieldSecSvgSource(e,t,s):this._fieldSecValueSource(e,t,s);case"fsec:label":return this._fieldSecValueLabel(e,t,s);case"fsec:icon":return this._fieldSecIcon(e,t,s);case"fsec:content":return this._fieldSecLabelContent(e,t,s);case"fsec:range":return this._fieldSecSvgRange(e,t,s);case"fsec:colors":return this._fieldSecSvgColors(e,t,s);case"fsec:size":return this._fieldSecSvgSize(e,t,s);case"fsec:thresholds":return this._fieldSecSvgThresholds(e,t,s);case"fsec:gauge":return this._fieldSecSvgGauge(e,t,s);case"fsec:thermo":return this._fieldSecSvgThermo(e,t,s);case"fsec:graph":return this._fieldSecGraphSettings(e,t,s);case"fsec:series":return this._fieldSecGraphSeries(e,t,s);case"fsec:stats":return this._fieldSecStats(e,t,s);case"fsec:display":return this._fieldSecDisplay(e,t,s);case"fsec:style":return this._fieldSecStyle(e,t,s);case"fsec:actions":return this._fieldSecActions(e,t,s);default:return o``}}_fieldSecBlankOrRule(e,t,s){return s.type!=="blank"?o`<p class="ec-hint">Horizontal rule — no options.</p>`:o`
        ${this._row("Gap (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0"
            .value=${s.blank_gap!=null?String(s.blank_gap):""}
            placeholder="10"
            @change=${i=>{const n=i.target.value;this._updateField(e,t,{blank_gap:n===""?void 0:Number(n)})}}
          /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}
    `}_fieldSecValueSource(e,t,s){return o`
      <div class="ec-section">
          ${this._row("Entity",s.entity?.startsWith("virtual:")?o`<div style="display:flex;gap:4px;align-items:center;">
                  <span class="ec-input" style="flex:1;opacity:0.8;">
                    ${this._virtuals().find(i=>`virtual:${i.id}`===s.entity)?.name??s.entity}
                  </span>
                  <button class="ec-btn-clear"
                    @click=${()=>this._updateField(e,t,{entity:void 0})}
                    title="Switch to real entity">✕</button>
                </div>`:o`<ha-entity-picker
                  .hass=${this.hass}
                  .value=${s.entity??""}
                  allow-custom-entity
                  @value-changed=${i=>this._updateField(e,t,{entity:i.detail.value})}
                ></ha-entity-picker>`)}
          ${!s.entity?.startsWith("virtual:")&&this._virtuals().length>0?this._row("Virtual Entity",o`<select class="ec-select"
              .value=${""}
              @change=${i=>{const n=i.target.value;n&&this._updateField(e,t,{entity:n}),i.target.value=""}}
            >
              <option value="">(pick a virtual)</option>
              ${this._virtuals().map(i=>o`<option value=${"virtual:"+i.id}>${i.name}</option>`)}
            </select>`):m}
          ${this._isTimeUntilVirtual(s)?this._renderTuLayoutBuilder(s,i=>this._updateField(e,t,i)):m}
      </div>
    `}_fieldSecValueLabel(e,t,s){return o`
      <div class="ec-section">
          ${this._row("Value Label (Optional)",o`<input class="ec-input" type="text" .value=${s.label??""}
              placeholder="(optional)"
              @input=${i=>{const n=i.target.value;this._updateField(e,t,{label:n||void 0})}}
            />`)}
          ${s.label?this._row("Value Label position",o`<select class="ec-select"
              .value=${s.label_position??_("label_position")??"above"}
              @change=${i=>this._updateField(e,t,{label_position:i.target.value})}
            >
              <option value="above"  .selected=${(s.label_position??_("label_position")??"above")==="above"}>Above value</option>
              <option value="below"  .selected=${s.label_position==="below"}>Below value</option>
              <option value="left"   .selected=${s.label_position==="left"}>Left of value</option>
              <option value="right"  .selected=${s.label_position==="right"}>Right of value</option>
            </select>`):m}
      </div>
    `}_fieldSecLabelContent(e,t,s){return o`
      <div class="ec-section">
          ${this._row("Text",o`<input class="ec-input" type="text" .value=${s.text??""}
                @change=${i=>this._updateField(e,t,{text:i.target.value})}
              />`)}
      </div>
    `}_fieldSecIcon(e,t,s){return o`
      <div class="ec-section">
          ${this._row("Icon",o`<input class="ec-input" type="text" .value=${s.icon??""}
                placeholder="mdi:lightning-bolt"
                @change=${i=>this._updateField(e,t,{icon:i.target.value})}
              />`)}
      </div>
    `}_fieldSecSvgSource(e,t,s){return o`
      <div class="ec-section">

          ${!s.svg||this._isThermometerSvg(s)||this._isBatterySvg(s)||this._isInverterSvg(s)||this._isGaugeSvg(s)?this._row("Entity",o`<ha-entity-picker
              .hass=${this.hass} .value=${s.entity??""} allow-custom-entity
              @value-changed=${i=>this._updateField(e,t,{entity:i.detail.value||void 0})}
            />`):m}
          ${this._isBatterySvg(s)?this._row("Charging entity",o`<ha-entity-picker
              .hass=${this.hass} .value=${s.charging_entity??""} allow-custom-entity
              @value-changed=${i=>this._updateField(e,t,{charging_entity:i.detail.value||void 0})}
            />`):m}
          ${s.svg&&!this._isThermometerSvg(s)&&!this._isBatterySvg(s)&&!this._isInverterSvg(s)&&!this._isGaugeSvg(s)?o`
            <div class="ec-subsection-title" style="margin-top:6px">Tank fill source</div>
            ${this._row("% entity",o`<ha-entity-picker .hass=${this.hass} .value=${s.tank_pct_entity??""} allow-custom-entity
                @value-changed=${i=>this._updateField(e,t,{tank_pct_entity:i.detail.value||void 0})}
              />`)}
            ${this._row("Flow In/Out Entity",o`<ha-entity-picker .hass=${this.hass} .value=${s.tank_volume_entity??""} allow-custom-entity
                @value-changed=${i=>this._updateField(e,t,{tank_volume_entity:i.detail.value||void 0})}
              />`)}
            ${this._row("Capacity entity",o`<ha-entity-picker .hass=${this.hass} .value=${s.tank_capacity_entity??""} allow-custom-entity
                @value-changed=${i=>this._updateField(e,t,{tank_capacity_entity:i.detail.value||void 0})}
              />`)}
          `:m}
      </div>
    `}_fieldSecSvgRange(e,t,s){return o`
      <div class="ec-section">
            ${this._row("Min value",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number"
                .value=${s.min!=null?String(s.min):""} placeholder="0"
                @change=${i=>{const n=i.target.value;this._updateField(e,t,{min:n===""?void 0:Number(n)})}}
              /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}
            ${this._row("Max value",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number"
                .value=${s.max!=null?String(s.max):""} placeholder="100"
                @change=${i=>{const n=i.target.value;this._updateField(e,t,{max:n===""?void 0:Number(n)})}}
              /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}
      </div>
    `}_fieldSecSvgColors(e,t,s){return o`
      <div class="ec-section">
          ${s.svg&&!this._isInverterSvg(s)?this._row("Fill direction",o`<select class="ec-select"
              .value=${s.fill_direction??_("fill_direction")??"up"}
              @change=${i=>this._updateField(e,t,{fill_direction:i.target.value})}
            >
              <option value="up"    .selected=${(s.fill_direction??_("fill_direction")??"up")==="up"}>Up (liquid rising)</option>
              <option value="down"  .selected=${s.fill_direction==="down"}>Down</option>
              <option value="left"  .selected=${s.fill_direction==="left"}>Left</option>
              <option value="right" .selected=${s.fill_direction==="right"}>Right</option>
            </select>`):m}
          ${this._row(this._isInverterSvg(s)?"Line color":"Fill color",this._colorPicker(`c${e}-f${t}-fc`,s.fill_color,i=>this._updateField(e,t,{fill_color:i})))}
          ${this._isInverterSvg(s)?m:this._row("Top Graduated Color (Opt)",s.fill_color2?this._colorPicker(`c${e}-f${t}-fc2`,s.fill_color2,i=>this._updateField(e,t,{fill_color2:i}),{clearTitle:"Remove gradient",onClear:()=>this._updateField(e,t,{fill_color2:void 0})}):o`<button class="ec-lib-browse-btn" style="font-size:12px"
                  @click=${()=>this._updateField(e,t,{fill_color2:s.fill_color??"#7ce800"})}>+ Add gradient end</button>`)}
          ${s.svg&&!this._isThermometerSvg(s)&&!this._isBatterySvg(s)&&!this._isInverterSvg(s)&&!this._isGaugeSvg(s)?this._row("Tank color",this._colorPicker(`c${e}-f${t}-tkc`,s.tank_color,i=>this._updateField(e,t,{tank_color:i}),{clearTitle:"Remove (use SVG default)",onClear:()=>this._updateField(e,t,{tank_color:void 0})})):m}
      </div>
    `}_fieldSecSvgSize(e,t,s){return o`
      <div class="ec-section">
          ${this._row("Height (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="20"
              .value=${s.height!=null?String(s.height):""} placeholder="120"
              @change=${i=>{const n=i.target.value;this._updateField(e,t,{height:n===""?void 0:Number(n)})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}
          ${this._row("Width (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="10"
              .value=${s.width!=null?String(s.width):""} placeholder="auto"
              @change=${i=>{const n=i.target.value;this._updateField(e,t,{width:n===""?void 0:Number(n)})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}
      </div>
    `}_fieldSecSvgThresholds(e,t,s){return o`
      <div class="ec-section">
            <p style="font-size:12px;color:#4a8aaa;margin:0 0 6px;">
              Each threshold sets the fill color when the entity value ≥ its level.
            </p>
            ${(s.thresholds??[]).map((i,n)=>o`
              <div class="ec-row">
                <span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" style="width:70px"
                  .value=${String(i.value)}
                  @change=${a=>{const r=[...s.thresholds??[]];r[n]={...i,value:Number(a.target.value)},this._updateField(e,t,{thresholds:r})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${a=>this._stepNumInput(a,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${a=>this._stepNumInput(a,1)}>+</button></span></span>
                <div style="flex:1">
                  ${this._colorPicker(`c${e}-f${t}-t${n}`,i.color,a=>{const r=[...s.thresholds??[]];r[n]={...i,color:a??i.color},this._updateField(e,t,{thresholds:r})},{clearable:!1})}
                  <button class="ec-btn-remove"
                    @click=${()=>{const a=(s.thresholds??[]).filter((r,l)=>l!==n);this._updateField(e,t,{thresholds:a.length?a:void 0})}}
                    title="Remove">✕</button>
                </div>
              </div>
            `)}
            <button class="ec-btn-add" style="margin-top:4px;"
              @click=${()=>{const i=[...s.thresholds??[],{value:0,color:"#f44336"}];this._updateField(e,t,{thresholds:i})}}>+ Threshold</button>
      </div>
    `}_fieldSecSvgGauge(e,t,s){return o`
      <div class="ec-section">
            ${this._row("Min label",o`<input class="ec-input" type="text" .value=${s.gauge_min_label??""}
                placeholder="e.g. 0 kW"
                @change=${i=>{const n=i.target.value;this._updateField(e,t,{gauge_min_label:n||void 0})}}
              />`)}
            ${this._row("Max label",o`<input class="ec-input" type="text" .value=${s.gauge_max_label??""}
                placeholder="e.g. 5 kW"
                @change=${i=>{const n=i.target.value;this._updateField(e,t,{gauge_max_label:n||void 0})}}
              />`)}
            ${this._row("Show value",o`<label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
                <input type="checkbox" .checked=${s.gauge_show_value??!1}
                  @change=${i=>this._updateField(e,t,{gauge_show_value:i.target.checked||void 0})}
                />
                <span>Display current value in centre</span>
              </label>`)}
            ${this._row("Label size (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="6" max="48"
                .value=${s.gauge_label_size!=null?String(s.gauge_label_size):""}
                placeholder="11"
                @change=${i=>{const n=i.target.value;this._updateField(e,t,{gauge_label_size:n===""?void 0:Number(n)})}}
              /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}
            ${this._row("Label color",this._colorPicker(`c${e}-f${t}-glc`,s.gauge_label_color,i=>this._updateField(e,t,{gauge_label_color:i}),{clearTitle:"Reset to default"}))}
      </div>
    `}_fieldSecSvgThermo(e,t,s){return o`
      <div class="ec-section">
            ${this._row("Tick color",this._colorPicker(`c${e}-f${t}-ttc`,s.thermo_tick_color,i=>this._updateField(e,t,{thermo_tick_color:i||void 0}),{clearTitle:"Reset to default"}))}
            ${this._row("Tick position",o`<select class="ec-select"
                .value=${s.thermo_text_position??_("thermo_text_position")??"right"}
                @change=${i=>this._updateField(e,t,{thermo_text_position:i.target.value})}
              >
                ${["right","left","both"].map(i=>o`<option value=${i} .selected=${(s.thermo_text_position??_("thermo_text_position")??"right")===i}>${this._isHorizontalThermometerSvg(s)?{right:"Bottom",left:"Top",both:"Both"}[i]:i.charAt(0).toUpperCase()+i.slice(1)}</option>`)}
              </select>`)}
            ${this._row("Minor tick text",o`<input type="checkbox" class="ec-checkbox"
                .checked=${s.thermo_show_minor_tick_text??_("thermo_show_minor_tick_text")??!1}
                @change=${i=>this._updateField(e,t,{thermo_show_minor_tick_text:i.target.checked})} />`)}
            ${this._row("Tick font size",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="1" max="20" step="0.5"
                .value=${s.thermo_tick_font_size!=null?String(s.thermo_tick_font_size):""}
                placeholder="4"
                @change=${i=>{const n=i.target.value;this._updateField(e,t,{thermo_tick_font_size:n===""?void 0:Number(n)})}}
              /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}
            ${this._row("Major tick length",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0.5" max="20" step="0.5"
                .value=${s.thermo_major_tick_length!=null?String(s.thermo_major_tick_length):""}
                placeholder="auto (from SVG)"
                @change=${i=>{const n=i.target.value;this._updateField(e,t,{thermo_major_tick_length:n===""?void 0:Number(n)})}}
              /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}
            ${this._row("Major tick thickness",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0.1" max="5" step="0.05"
                .value=${s.thermo_major_tick_width!=null?String(s.thermo_major_tick_width):""}
                placeholder="auto (from SVG)"
                @change=${i=>{const n=i.target.value;this._updateField(e,t,{thermo_major_tick_width:n===""?void 0:Number(n)})}}
              /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}
            ${this._row("Minor tick length",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0.5" max="20" step="0.5"
                .value=${s.thermo_minor_tick_length!=null?String(s.thermo_minor_tick_length):""}
                placeholder="auto (from SVG)"
                @change=${i=>{const n=i.target.value;this._updateField(e,t,{thermo_minor_tick_length:n===""?void 0:Number(n)})}}
              /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}
            ${this._row("Minor tick thickness",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0.1" max="5" step="0.05"
                .value=${s.thermo_minor_tick_width!=null?String(s.thermo_minor_tick_width):""}
                placeholder="auto (from SVG)"
                @change=${i=>{const n=i.target.value;this._updateField(e,t,{thermo_minor_tick_width:n===""?void 0:Number(n)})}}
              /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}
            ${this._row("Grid line color",this._colorPicker(`c${e}-f${t}-tgc`,s.thermo_grid_color,i=>this._updateField(e,t,{thermo_grid_color:i||void 0}),{clearTitle:"Reset to default"}))}
            ${this._row("Above temperature transparency",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0" max="1" step="0.05"
                .value=${s.thermo_fill_opacity_above!=null?String(s.thermo_fill_opacity_above):""}
                placeholder="0.5"
                @change=${i=>{const n=i.target.value;this._updateField(e,t,{thermo_fill_opacity_above:n===""?void 0:Number(n)})}}
              /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}
            ${this._row("Decimals",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0" max="4" step="1"
                .value=${s.thermo_decimals!=null?String(s.thermo_decimals):""}
                placeholder="1"
                @change=${i=>{const n=i.target.value;this._updateField(e,t,{thermo_decimals:n===""?void 0:Number(n)})}}
              /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}
            ${this._row("Temperature value color",this._colorPicker(`c${e}-f${t}-ttc`,s.thermo_temp_color,i=>this._updateField(e,t,{thermo_temp_color:i||void 0}),{clearTitle:"Reset to default"}))}
            ${this._row("Temperature value size",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="4" max="30" step="0.5"
                .value=${s.thermo_temp_font_size!=null?String(s.thermo_temp_font_size):""}
                placeholder="10"
                @change=${i=>{const n=i.target.value;this._updateField(e,t,{thermo_temp_font_size:n===""?void 0:Number(n)})}}
              /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}
      </div>
    `}_fieldSecGraphSettings(e,t,s){return o`
      <div class="ec-section">

          ${this._row("Type",o`<select class="ec-select"
              .value=${s.graph_type??_("graph_type")??"bar"}
              @change=${i=>this._updateField(e,t,{graph_type:i.target.value})}
            >
              ${Ne.map(i=>o`<option value=${i.value} .selected=${(s.graph_type??_("graph_type")??"bar")===i.value}>${i.label}</option>`)}
            </select>`)}
          ${this._row("Show axes",o`<input type="checkbox" .checked=${s.graph_show_axes??_("graph_show_axes")??!0}
              @change=${i=>this._updateField(e,t,{graph_show_axes:i.target.checked||void 0})}
            />`)}
          ${this._row("Show legend",o`<input type="checkbox" .checked=${s.graph_show_legend??_("graph_show_legend")??!1}
              @change=${i=>this._updateField(e,t,{graph_show_legend:i.target.checked||void 0})}
            />`)}
          ${this._row("Min value",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number"
              .value=${s.graph_min!=null?String(s.graph_min):""} placeholder="auto"
              @change=${i=>{const n=i.target.value;this._updateField(e,t,{graph_min:n===""?void 0:Number(n)})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}
          ${this._row("Max value",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number"
              .value=${s.graph_max!=null?String(s.graph_max):""} placeholder="auto"
              @change=${i=>{const n=i.target.value;this._updateField(e,t,{graph_max:n===""?void 0:Number(n)})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}
          ${this._row("Width (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="60"
              .value=${s.width!=null?String(s.width):""} placeholder="auto"
              @change=${i=>{const n=i.target.value;this._updateField(e,t,{width:n===""?void 0:Number(n)})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}
          ${this._row("Height (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="40"
              .value=${s.height!=null?String(s.height):""} placeholder="auto"
              @change=${i=>{const n=i.target.value;this._updateField(e,t,{height:n===""?void 0:Number(n)})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}
          ${["line","area","state-timeline"].includes(s.graph_type??"")?this._row("History (hours)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="1" max="8760"
              .value=${s.graph_hours!=null?String(s.graph_hours):""} placeholder="24"
              title="How many hours of history to fetch for line/area/sparkline charts"
              @change=${i=>{const n=i.target.value;this._updateField(e,t,{graph_hours:n===""?void 0:Number(n)})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`):m}
          ${["line","area","state-timeline"].includes(s.graph_type??"")?o`
            ${this._row("Stroke width",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0.5" max="10" step="0.5"
                .value=${s.graph_stroke_width!=null?String(s.graph_stroke_width):""} placeholder="1.5"
                @change=${i=>{const n=i.target.value;this._updateField(e,t,{graph_stroke_width:n===""?void 0:Number(n)})}}
              /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}
            ${s.graph_type==="area"?this._row("Fill opacity",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0" max="1" step="0.05"
                .value=${s.graph_fill_opacity!=null?String(s.graph_fill_opacity):""} placeholder="0.2"
                @change=${i=>{const n=i.target.value;this._updateField(e,t,{graph_fill_opacity:n===""?void 0:Number(n)})}}
              /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`):m}
          `:m}
      </div>
    `}_fieldSecGraphSeries(e,t,s){return o`
      <div class="ec-section">
          <div class="ec-subsection-title">Series — drag to reorder</div>
          ${(s.graph_series??[]).length===0?o`<p class="ec-empty">No series — click "+ Series".</p>`:(s.graph_series??[]).map((i,n)=>this._itemCard({dragKey:`gs:${e}:${t}:${n}`,icon:"mdi:chart-line",label:i.label||i.entity||`Series ${n+1}`,sub:i.entity?`Series ${n+1}`:"No entity selected",selected:n===this._selSeries,onClick:()=>{this._selSeries=n,this._navPush(`gs:${n}`,i.label||i.entity||`Series ${n+1}`)},actions:o`
                  <button class="ec-btn-remove" title="Remove series"
                    @click=${a=>{a.stopPropagation();const r=(s.graph_series??[]).filter((l,c)=>c!==n);this._updateField(e,t,{graph_series:r.length?r:void 0})}}>✕</button>
                `}))}
          <button class="ec-btn-add" style="margin-top:6px;width:100%"
            @click=${()=>{const i=[...s.graph_series??[],{}];this._updateField(e,t,{graph_series:i})}}>+ Series</button>
      </div>
    `}_fieldSecGraphSeriesItem(e,t,s,i){const n=(s.graph_series??[])[i];return n?o`
      <div class="ec-section">
              ${this._row("Entity",o`<ha-entity-picker
                  .hass=${this.hass}
                  .value=${n.entity??""}
                  allow-custom-entity
                  @value-changed=${a=>{const r=[...s.graph_series??[]];r[i]={...r[i],entity:a.detail.value||void 0},this._updateField(e,t,{graph_series:r})}}
                ></ha-entity-picker>`)}
               ${this._row("Value Label (Optional)",o`<input class="ec-input" type="text" .value=${n.label??""}
                  placeholder="(from entity)"
                  @change=${a=>{const r=[...s.graph_series??[]],l=a.target.value;r[i]={...r[i],label:l||void 0},this._updateField(e,t,{graph_series:r})}}
                />`)}
              ${this._row("Color",this._colorPicker(`c${e}-f${t}-s${i}-col`,n.color,a=>{const r=[...s.graph_series??[]];r[i]={...r[i],color:a},this._updateField(e,t,{graph_series:r})},{clearTitle:"Reset to palette color"}))}
              ${this._row("Stat period",o`<select class="ec-select"
                  .value=${n.stat_period??""}
                  @change=${a=>{const r=[...s.graph_series??[]],l=a.target.value;r[i]={...r[i],stat_period:l||void 0},this._updateField(e,t,{graph_series:r})}}
                >
                  <option value="">Live state</option>
                  <optgroup label="Calendar">
                    <option value="today"       .selected=${n.stat_period==="today"}>Today</option>
                    <option value="yesterday"   .selected=${n.stat_period==="yesterday"}>Yesterday</option>
                    <option value="this_week"   .selected=${n.stat_period==="this_week"}>This week</option>
                    <option value="last_week"   .selected=${n.stat_period==="last_week"}>Last week</option>
                    <option value="this_month"  .selected=${n.stat_period==="this_month"}>This month</option>
                    <option value="last_month"  .selected=${n.stat_period==="last_month"}>Last month</option>
                    <option value="this_year"   .selected=${n.stat_period==="this_year"}>This year</option>
                    <option value="last_year"   .selected=${n.stat_period==="last_year"}>Last year</option>
                  </optgroup>
                  <optgroup label="Rolling window">
                    <option value="last_30_minutes" .selected=${n.stat_period==="last_30_minutes"}>Last 30 minutes</option>
                    <option value="last_hour"        .selected=${n.stat_period==="last_hour"}>Last hour</option>
                    <option value="last_n_minutes"   .selected=${n.stat_period==="last_n_minutes"}>Last N minutes</option>
                    <option value="last_n_hours"     .selected=${n.stat_period==="last_n_hours"}>Last N hours</option>
                    <option value="last_n_days"      .selected=${n.stat_period==="last_n_days"}>Last N days</option>
                    <option value="last_n_months"    .selected=${n.stat_period==="last_n_months"}>Last N months</option>
                  </optgroup>
                </select>`)}
              ${["last_n_minutes","last_n_hours","last_n_days","last_n_months"].includes(n.stat_period)?this._row(n.stat_period==="last_n_minutes"?"Number of minutes":n.stat_period==="last_n_hours"?"Number of hours":n.stat_period==="last_n_days"?"Number of days":"Number of months",o`<input type="number" class="ec-input" min="1" step="1"
                  .value=${String(n.stat_period_n??"")}
                  placeholder="e.g. 3"
                  @change=${a=>{const r=parseInt(a.target.value,10),l=[...s.graph_series??[]];l[i]={...l[i],stat_period_n:isNaN(r)||r<1?void 0:r},this._updateField(e,t,{graph_series:l})}}
                />`):m}
              ${n.stat_period?this._row("Stat type",o`<select class="ec-select"
                  .value=${n.stat_type??_("stat_type")??"sum"}
                  @change=${a=>{const r=[...s.graph_series??[]];r[i]={...r[i],stat_type:a.target.value},this._updateField(e,t,{graph_series:r})}}
                >
                  <option value="sum"        .selected=${(n.stat_type??_("stat_type")??"sum")==="sum"}>Sum (total)</option>
                  <option value="difference" .selected=${n.stat_type==="difference"}>Difference (end − start)</option>
                  <option value="mean"       .selected=${n.stat_type==="mean"}>Mean (average)</option>
                  <option value="max"        .selected=${n.stat_type==="max"}>Maximum</option>
                  <option value="min"        .selected=${n.stat_type==="min"}>Minimum</option>
                </select>`):m}
      </div>
    `:o``}_fieldSecStats(e,t,s){return o`
      <div class="ec-section">
          <div class="ec-subsection-title">HA Statistics integration</div>
          <p class="ec-hint">For advanced statistics (median, std dev, percentile, etc.) configure a Statistics integration sensor in HA and point the Entity field at it.</p>
          ${this._row("Period",o`<select class="ec-select"
              .value=${s.stat_period??""}
              @change=${i=>{const n=i.target.value,a=["last_n_minutes","last_n_hours","last_n_days","last_n_months"].includes(n);this._updateField(e,t,{stat_period:n||void 0,stat_period_n:a?s.stat_period_n??void 0:void 0,stat_period_start:n==="custom"?s.stat_period_start??void 0:void 0,stat_period_end:n==="custom"?s.stat_period_end??void 0:void 0})}}
            >
              <option value="">Live state (no stats)</option>
              <optgroup label="Calendar">
                <option value="today"      .selected=${s.stat_period==="today"}>Today</option>
                <option value="yesterday"  .selected=${s.stat_period==="yesterday"}>Yesterday</option>
                <option value="this_week"  .selected=${s.stat_period==="this_week"}>This week</option>
                <option value="last_week"  .selected=${s.stat_period==="last_week"}>Last week</option>
                <option value="this_month" .selected=${s.stat_period==="this_month"}>This month</option>
                <option value="last_month" .selected=${s.stat_period==="last_month"}>Last month</option>
                <option value="this_year"  .selected=${s.stat_period==="this_year"}>This year</option>
                <option value="last_year"  .selected=${s.stat_period==="last_year"}>Last year</option>
              </optgroup>
              <optgroup label="Rolling window">
                <option value="last_30_minutes" .selected=${s.stat_period==="last_30_minutes"}>Last 30 minutes</option>
                <option value="last_hour"        .selected=${s.stat_period==="last_hour"}>Last hour</option>
                <option value="last_n_minutes"   .selected=${s.stat_period==="last_n_minutes"}>Last N minutes</option>
                <option value="last_n_hours"     .selected=${s.stat_period==="last_n_hours"}>Last N hours</option>
                <option value="last_n_days"      .selected=${s.stat_period==="last_n_days"}>Last N days</option>
                <option value="last_n_months"    .selected=${s.stat_period==="last_n_months"}>Last N months</option>
              </optgroup>
              <optgroup label="Custom range">
                <option value="custom" .selected=${s.stat_period==="custom"}>Custom date/time range</option>
              </optgroup>
            </select>`)}
          ${["last_n_minutes","last_n_hours","last_n_days","last_n_months"].includes(s.stat_period)?this._row(s.stat_period==="last_n_minutes"?"Number of minutes":s.stat_period==="last_n_hours"?"Number of hours":s.stat_period==="last_n_days"?"Number of days":"Number of months",o`<input type="number" class="ec-input" min="1" step="1"
              .value=${String(s.stat_period_n??"")}
              placeholder="e.g. 3"
              @change=${i=>{const n=parseInt(i.target.value,10);this._updateField(e,t,{stat_period_n:isNaN(n)||n<1?void 0:n})}}
            />`):m}
          ${s.stat_period==="custom"?o`
            ${this._row("Start",o`<input type="datetime-local" class="ec-input"
              .value=${s.stat_period_start??""}
              @change=${i=>this._updateField(e,t,{stat_period_start:i.target.value||void 0})}
            />`)}
            ${this._row("End",o`<input type="datetime-local" class="ec-input"
              .value=${s.stat_period_end??""}
              @change=${i=>this._updateField(e,t,{stat_period_end:i.target.value||void 0})}
            />`)}
          `:m}
          ${s.stat_period?this._row("Stat type",o`<select class="ec-select"
              .value=${s.stat_type??_("stat_type")??"sum"}
              @change=${i=>this._updateField(e,t,{stat_type:i.target.value})}
            >
              <option value="sum"        .selected=${(s.stat_type??_("stat_type")??"sum")==="sum"}>Sum (total)</option>
              <option value="difference" .selected=${s.stat_type==="difference"}>Difference (end − start)</option>
              <option value="mean"       .selected=${s.stat_type==="mean"}>Mean (average)</option>
              <option value="max"        .selected=${s.stat_type==="max"}>Maximum</option>
              <option value="min"        .selected=${s.stat_type==="min"}>Minimum</option>
              <option value="count"      .selected=${s.stat_type==="count"}>Count (buckets)</option>
              <option value="range"      .selected=${s.stat_type==="range"}>Range (max − min)</option>
            </select>`):m}

          ${this._row("Adv statistics mode (opt)",o`<select class="ec-select"
              .value=${s.stat_characteristic??""}
              @change=${i=>{const n=i.target.value;this._updateField(e,t,{stat_characteristic:n||void 0})}}
            >
              <option value="">— none —</option>
              ${["Averages","Extremes","Spread","Change","Sums","Counts","Timestamps"].map(i=>o`
                <optgroup label="${i}">
                  ${vn.filter(n=>n.group===i).map(n=>o`
                    <option value=${n.value} .selected=${s.stat_characteristic===n.value}>
                      ${n.label}${n.binary?" ✦":""}
                    </option>`)}
                </optgroup>`)}
            </select>`)}
          <p class="ec-hint" style="margin-top:2px">✦ also valid for binary sensors</p>
          ${s.stat_characteristic==="percentile"?this._row("Percentile (1–99)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="1" max="99"
              .value=${s.stat_percentile!=null?String(s.stat_percentile):""} placeholder="50"
              @change=${i=>{const n=i.target.value;this._updateField(e,t,{stat_percentile:n===""?void 0:Number(n)})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`):m}
          ${this._row("Max age (hours)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="1"
              .value=${s.stat_max_age_hours!=null?String(s.stat_max_age_hours):""} placeholder="(none)"
              @change=${i=>{const n=i.target.value;this._updateField(e,t,{stat_max_age_hours:n===""?void 0:Number(n)})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}
          ${this._row("Sampling size",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="1"
              .value=${s.stat_sampling_size!=null?String(s.stat_sampling_size):""} placeholder="(none)"
              @change=${i=>{const n=i.target.value;this._updateField(e,t,{stat_sampling_size:n===""?void 0:Number(n)})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}
          ${s.stat_characteristic&&s.entity?o`
            <div class="ec-stat-yaml">
              <div class="ec-stat-yaml-header">
                <span>HA configuration.yaml</span>
                <button class="ec-btn-copy" title="Copy YAML"
                  @click=${()=>{const i=vs(s.entity,s.stat_characteristic,s.stat_max_age_hours,s.stat_sampling_size,s.stat_percentile);navigator.clipboard.writeText(i)}}>⎘ Copy</button>
              </div>
              <pre class="ec-stat-yaml-code">${vs(s.entity,s.stat_characteristic,s.stat_max_age_hours,s.stat_sampling_size,s.stat_percentile)}</pre>
            </div>
          `:m}
      </div>
    `}_fieldSecDisplay(e,t,s){return o`
      <div class="ec-section">
          <div class="ec-subsection-title">Display</div>
          ${this._row("Unit",o`<input class="ec-input" type="text" .value=${s.unit??""}
              placeholder="(from entity)"
              @change=${i=>this._updateField(e,t,{unit:i.target.value})}
            />`)}
          ${this._row("Decimals",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0" max="6"
              .value=${s.decimals!=null?String(s.decimals):""}
              placeholder="auto"
              @change=${i=>{const n=i.target.value;this._updateField(e,t,{decimals:n===""?void 0:Number(n)})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}
          ${this._row("Hide below",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0"
              .value=${s.hide_below!=null?String(s.hide_below):""}
              placeholder="(always show)"
              title="Suppress this field when the absolute value is below this threshold"
              @change=${i=>{const n=i.target.value;this._updateField(e,t,{hide_below:n===""?void 0:Number(n)})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}
          ${this._displayUnit(s.entity,s.unit)?o`<p class="ec-hint">Enter in ${this._displayUnit(s.entity,s.unit)}</p>`:m}
          ${s.entity?.startsWith("virtual:")&&!s.time_until_layout?.length?this._row("Show trigger label",o`<input type="checkbox"
              .checked=${s.show_time_until_label??!1}
              title="Prefix the value with the active trigger label (e.g. 'Reserve: 2h 10m')"
              @change=${i=>this._updateField(e,t,{show_time_until_label:i.target.checked||void 0})}
            />`):m}
      </div>
    `}_fieldSecStyle(e,t,s){return o`
      <div class="ec-section">
          ${this._row("Align",o`<select class="ec-select"
              .value=${s.align??_("align")??"left"}
              @change=${i=>this._updateField(e,t,{align:i.target.value})}
            >
              ${ne.map(i=>o`<option value=${i} .selected=${(s.align??_("align")??"left")===i}>${i}</option>`)}
            </select>`)}
          ${this._row("Use global text style",o`<input type="checkbox" .checked=${s.style===void 0}
              @change=${i=>{i.target.checked?this._updateField(e,t,{style:void 0}):this._updateField(e,t,{style:{}})}}
            />`)}
          ${s.style!==void 0?o`
            <div class="ec-subsection-title">Style overrides</div>
            ${this._textRows(`c${e}-f${t}-st`,s.style,i=>this._updateField(e,t,{style:{...s.style,...i}}))}
          `:m}
      </div>
    `}_fieldSecActions(e,t,s){return o`
      <div class="ec-section">
          <div class="ec-subsection-title">Actions</div>
          ${this._actionRows({tap_action:s.tap_action,hold_action:s.hold_action,double_tap_action:s.double_tap_action},i=>this._updateField(e,t,i))}
      </div>
    `}_renderDefaultsRibbonPanel(){const e=this._navPath;return e.length===0?this._defaultsSectionMenu():e[0].key==="sec:elements"?e.length===1?this._elemLibMenu():this._elemLibSection(e[1].key):this._defaultsSection(e[0].key)}_defaultsSectionMenu(){return o`
      ${this._navBtn("sec:card","Card Default","Default box style for cards","mdi:view-dashboard-outline")}
      ${this._navBtn("sec:value","Value Default","Default value text style","mdi:function-variant")}
      ${this._navBtn("sec:label","Label Default","Default label text style","mdi:format-title")}
      ${this._navBtn("sec:layout","Layout & Fonts","Fonts, gaps, columns, units","mdi:format-size")}
      ${this._navBtn("sec:elements","Element Library","Thermometer, battery, tank, inverter, gauge","mdi:palette-swatch-outline")}
      <div class="ec-wiz-reset-row">
        <button class="ec-wiz-btn-reset" @click=${this._resetToWizard}>⟳ Reset &amp; rerun setup wizard</button>
      </div>
    `}_defaultsSection(e){const t=this._config?.defaults??{};return e==="sec:card"?o`<div class="ec-section">${this._boxRows("d-card",t.card??{},s=>this._updateDefaults({card:{...t.card,...s}}))}</div>`:e==="sec:value"?o`<div class="ec-section">${this._textRows("d-value",t.value??{},s=>this._updateDefaults({value:{...t.value,...s}}))}</div>`:e==="sec:label"?o`<div class="ec-section">${this._textRows("d-label",t.label??{},s=>this._updateDefaults({label:{...t.label,...s}}))}</div>`:e==="sec:layout"?this._defaultsSecLayout():o``}_defaultsSecLayout(){const e=this._config?.defaults??{};return o`
      <div class="ec-section">
          ${this._row("Power unit",o`<select class="ec-select"
              .value=${e.power_unit??""}
              @change=${t=>{const s=t.target.value;this._updateDefaults({power_unit:s||void 0})}}
            >
              <option value=""   .selected=${!e.power_unit}>Auto (W / kW)</option>
              <option value="W"  .selected=${e.power_unit==="W"}>Always W</option>
              <option value="kW" .selected=${e.power_unit==="kW"}>Always kW</option>
            </select>`)}

          ${this._row("Stats refresh (min)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="1" max="60"
              .value=${e.stat_update_interval!=null?String(e.stat_update_interval):""}
              placeholder="5"
              @change=${t=>{const s=t.target.value;this._updateDefaults({stat_update_interval:s===""?void 0:Number(s)})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}

          ${this._row("Font family",o`<input class="ec-input" type="text" .value=${e.font_family??""}
              placeholder="inherit"
              @change=${t=>{const s=t.target.value;this._updateDefaults({font_family:s===""?void 0:s})}}
            />`)}

          ${this._row("Font family – monospace",o`<input class="ec-input" type="text" .value=${e.mono_font_family??""}
              placeholder="'Courier New', monospace"
              @change=${t=>{const s=t.target.value;this._updateDefaults({mono_font_family:s===""?void 0:s})}}
            />`)}
          <p class="ec-hint">Only used where a fixed-width font is required (e.g. numeric counters, timers).</p>

          ${this._row("Card columns",o`<select class="ec-select"
              .value=${String(e.card_columns??_("card_columns")??1)}
              @change=${t=>{const s=Number(t.target.value);this._updateDefaults({card_columns:s===1?void 0:s})}}
            >
              <option value="1" .selected=${(e.card_columns??1)===1}>1</option>
              <option value="2" .selected=${(e.card_columns??1)===2}>2</option>
              <option value="3" .selected=${(e.card_columns??1)===3}>3</option>
              <option value="4" .selected=${(e.card_columns??1)===4}>4</option>
              <option value="5" .selected=${(e.card_columns??1)===5}>5</option>
              <option value="6" .selected=${(e.card_columns??1)===6}>6</option>
              <option value="7" .selected=${(e.card_columns??1)===7}>7</option>
              <option value="8" .selected=${(e.card_columns??1)===8}>8</option>
            </select>`)}

          ${this._row("Field gap (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0"
              .value=${e.field_gap!=null?String(e.field_gap):""}
              placeholder="4"
              @change=${t=>{const s=t.target.value;this._updateDefaults({field_gap:s===""?void 0:Number(s)})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}
          ${this._row("Column gap (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0"
              .value=${e.column_gap!=null?String(e.column_gap):""}
              placeholder="3"
              @change=${t=>{const s=t.target.value;this._updateDefaults({column_gap:s===""?void 0:Number(s)})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}
      </div>
    `}_elemLibMenu(){return o`
      ${this._navBtn("el:thermo-v","Thermometer (Vertical)","Ticks, grid, fill, temperature text","mdi:thermometer")}
      ${this._navBtn("el:thermo-h","Thermometer (Horizontal)","Ticks, grid, fill, temperature text","mdi:thermometer")}
      ${this._navBtn("el:bat-h","Battery (Horizontal)","Fill & gradient","mdi:battery")}
      ${this._navBtn("el:bat-v","Battery (Vertical)","Fill & gradient","mdi:battery")}
      ${this._navBtn("el:tank-cyl","Tank (Cylinder)","Fill, direction, wall","mdi:barrel")}
      ${this._navBtn("el:tank-water","Tank - Water","Fill, direction, wall","mdi:water")}
      ${this._navBtn("el:tank-ferm","Tank - Fermenter","Fill, direction, wall","mdi:flask-outline")}
      ${this._navBtn("el:tank-cone","Tank - Cone","Fill, direction, wall","mdi:triangle-outline")}
      ${this._navBtn("el:inverter","Inverter","Line colour","mdi:sine-wave")}
      ${this._navBtn("el:gauge-arc","Gauge (Arc)","Needle, label colour & size","mdi:speedometer")}
    `}_elemLibSection(e){switch(e){case"el:thermo-v":return this._elemThermoV();case"el:thermo-h":return this._elemThermoH();case"el:bat-h":return this._elemBatH();case"el:bat-v":return this._elemBatV();case"el:tank-cyl":return this._elemTankCyl();case"el:tank-water":return this._elemTankWater();case"el:tank-ferm":return this._elemTankFerm();case"el:tank-cone":return this._elemTankCone();case"el:inverter":return this._elemInverter();case"el:gauge-arc":return this._elemGaugeArc();default:return o``}}_elemThermoV(){const e=this._config?.defaults??{};return o`
      <div class="ec-section">
              <div class="ec-subsection-title">…– ticks</div>
              ${this._row("Tick color",this._colorPicker("d-thermo-tc",e.thermo_tick_color,t=>this._updateDefaults({thermo_tick_color:t||void 0})))}
              ${this._row("Tick position",o`<select class="ec-select"
                  .value=${e.thermo_text_position??_("thermo_text_position")??"right"}
                  @change=${t=>this._updateDefaults({thermo_text_position:t.target.value})}
                >
                  ${["right","left","both"].map(t=>o`<option value=${t} .selected=${(e.thermo_text_position??_("thermo_text_position")??"right")===t}>${t.charAt(0).toUpperCase()+t.slice(1)}</option>`)}
                </select>`)}
              ${this._row("Minor tick text",o`<input type="checkbox" class="ec-checkbox"
                  .checked=${e.thermo_show_minor_tick_text??_("thermo_show_minor_tick_text")??!1}
                  @change=${t=>this._updateDefaults({thermo_show_minor_tick_text:t.target.checked})} />`)}
              ${this._row("Tick font size",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="1" max="20" step="0.5"
                  .value=${e.thermo_tick_font_size!=null?String(e.thermo_tick_font_size):""}
                  placeholder="4"
                  @change=${t=>{const s=t.target.value;this._updateDefaults({thermo_tick_font_size:s===""?void 0:Number(s)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}
              ${this._row("Major tick length",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0.5" max="20" step="0.5"
                  .value=${e.thermo_major_tick_length!=null?String(e.thermo_major_tick_length):""}
                  placeholder="auto (from SVG)"
                  @change=${t=>{const s=t.target.value;this._updateDefaults({thermo_major_tick_length:s===""?void 0:Number(s)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}
              ${this._row("Major tick thickness",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0.1" max="5" step="0.05"
                  .value=${e.thermo_major_tick_width!=null?String(e.thermo_major_tick_width):""}
                  placeholder="auto (from SVG)"
                  @change=${t=>{const s=t.target.value;this._updateDefaults({thermo_major_tick_width:s===""?void 0:Number(s)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}
              ${this._row("Minor tick length",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0.5" max="20" step="0.5"
                  .value=${e.thermo_minor_tick_length!=null?String(e.thermo_minor_tick_length):""}
                  placeholder="auto (from SVG)"
                  @change=${t=>{const s=t.target.value;this._updateDefaults({thermo_minor_tick_length:s===""?void 0:Number(s)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}
              ${this._row("Minor tick thickness",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0.1" max="5" step="0.05"
                  .value=${e.thermo_minor_tick_width!=null?String(e.thermo_minor_tick_width):""}
                  placeholder="auto (from SVG)"
                  @change=${t=>{const s=t.target.value;this._updateDefaults({thermo_minor_tick_width:s===""?void 0:Number(s)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}
              ${this._row("Grid line color",this._colorPicker("d-thermo-gc",e.thermo_grid_color,t=>this._updateDefaults({thermo_grid_color:t||void 0})))}
              <div class="ec-subsection-title">Fill &amp; temperature</div>
              ${this._row("Above temperature transparency",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0" max="1" step="0.05"
                  .value=${e.thermo_fill_opacity_above!=null?String(e.thermo_fill_opacity_above):""}
                  placeholder="0.5"
                  @change=${t=>{const s=t.target.value;this._updateDefaults({thermo_fill_opacity_above:s===""?void 0:Number(s)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}
              ${this._row("Decimals",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0" max="4" step="1"
                  .value=${e.thermo_decimals!=null?String(e.thermo_decimals):""}
                  placeholder="1"
                  @change=${t=>{const s=t.target.value;this._updateDefaults({thermo_decimals:s===""?void 0:Number(s)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}
              ${this._row("Temperature value color",this._colorPicker("d-thermo-ttc",e.thermo_temp_color,t=>this._updateDefaults({thermo_temp_color:t||void 0})))}
              ${this._row("Temperature value size",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="4" max="30" step="0.5"
                  .value=${e.thermo_temp_font_size!=null?String(e.thermo_temp_font_size):""}
                  placeholder="10"
                  @change=${t=>{const s=t.target.value;this._updateDefaults({thermo_temp_font_size:s===""?void 0:Number(s)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}
              ${this._row("Fill color",this._colorPicker("d-thermo-fc",e.thermo_fill_color,t=>this._updateDefaults({thermo_fill_color:t||void 0})))}
              ${this._row("Top Graduated Color (Opt)",e.thermo_fill_color2?o`${this._colorPicker("d-thermo-fc2",e.thermo_fill_color2,t=>this._updateDefaults({thermo_fill_color2:t||void 0}),{clearTitle:"Remove gradient",onClear:()=>this._updateDefaults({thermo_fill_color2:void 0})})}`:o`<button class="ec-lib-browse-btn" style="font-size:12px" @click=${()=>this._updateDefaults({thermo_fill_color2:e.thermo_fill_color??"#7ce800"})}>+ Add gradient end</button>`)}
      </div>
    `}_elemThermoH(){const e=this._config?.defaults??{};return o`
      <div class="ec-section">
              <div class="ec-subsection-title">…– ticks</div>
              ${this._row("Tick color",this._colorPicker("d-thermo-h-tc",e.thermo_tick_color,t=>this._updateDefaults({thermo_tick_color:t||void 0})))}
              ${this._row("Tick position",o`<select class="ec-select"
                  .value=${e.thermo_text_position??_("thermo_text_position")??"right"}
                  @change=${t=>this._updateDefaults({thermo_text_position:t.target.value})}
                >
                  ${["right","left","both"].map(t=>o`<option value=${t} .selected=${(e.thermo_text_position??_("thermo_text_position")??"right")===t}>${{right:"Bottom",left:"Top",both:"Both"}[t]}</option>`)}
                </select>`)}
              ${this._row("Minor tick text",o`<input type="checkbox" class="ec-checkbox"
                  .checked=${e.thermo_show_minor_tick_text??_("thermo_show_minor_tick_text")??!1}
                  @change=${t=>this._updateDefaults({thermo_show_minor_tick_text:t.target.checked})} />`)}
              ${this._row("Tick font size",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="1" max="20" step="0.5"
                  .value=${e.thermo_tick_font_size!=null?String(e.thermo_tick_font_size):""}
                  placeholder="4"
                  @change=${t=>{const s=t.target.value;this._updateDefaults({thermo_tick_font_size:s===""?void 0:Number(s)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}
              ${this._row("Major tick length",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0.5" max="20" step="0.5"
                  .value=${e.thermo_major_tick_length!=null?String(e.thermo_major_tick_length):""}
                  placeholder="auto (from SVG)"
                  @change=${t=>{const s=t.target.value;this._updateDefaults({thermo_major_tick_length:s===""?void 0:Number(s)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}
              ${this._row("Major tick thickness",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0.1" max="5" step="0.05"
                  .value=${e.thermo_major_tick_width!=null?String(e.thermo_major_tick_width):""}
                  placeholder="auto (from SVG)"
                  @change=${t=>{const s=t.target.value;this._updateDefaults({thermo_major_tick_width:s===""?void 0:Number(s)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}
              ${this._row("Minor tick length",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0.5" max="20" step="0.5"
                  .value=${e.thermo_minor_tick_length!=null?String(e.thermo_minor_tick_length):""}
                  placeholder="auto (from SVG)"
                  @change=${t=>{const s=t.target.value;this._updateDefaults({thermo_minor_tick_length:s===""?void 0:Number(s)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}
              ${this._row("Minor tick thickness",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0.1" max="5" step="0.05"
                  .value=${e.thermo_minor_tick_width!=null?String(e.thermo_minor_tick_width):""}
                  placeholder="auto (from SVG)"
                  @change=${t=>{const s=t.target.value;this._updateDefaults({thermo_minor_tick_width:s===""?void 0:Number(s)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}
              ${this._row("Grid line color",this._colorPicker("d-thermo-h-gc",e.thermo_grid_color,t=>this._updateDefaults({thermo_grid_color:t||void 0})))}
              <div class="ec-subsection-title">Fill &amp; temperature</div>
              ${this._row("Above temperature transparency",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0" max="1" step="0.05"
                  .value=${e.thermo_fill_opacity_above!=null?String(e.thermo_fill_opacity_above):""}
                  placeholder="0.5"
                  @change=${t=>{const s=t.target.value;this._updateDefaults({thermo_fill_opacity_above:s===""?void 0:Number(s)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}
              ${this._row("Decimals",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0" max="4" step="1"
                  .value=${e.thermo_decimals!=null?String(e.thermo_decimals):""}
                  placeholder="1"
                  @change=${t=>{const s=t.target.value;this._updateDefaults({thermo_decimals:s===""?void 0:Number(s)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}
              ${this._row("Temperature value color",this._colorPicker("d-thermo-h-ttc",e.thermo_temp_color,t=>this._updateDefaults({thermo_temp_color:t||void 0})))}
              ${this._row("Temperature value size",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="4" max="30" step="0.5"
                  .value=${e.thermo_temp_font_size!=null?String(e.thermo_temp_font_size):""}
                  placeholder="10"
                  @change=${t=>{const s=t.target.value;this._updateDefaults({thermo_temp_font_size:s===""?void 0:Number(s)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}
              ${this._row("Fill color",this._colorPicker("d-thermo-h-fc",e.thermo_h_fill_color,t=>this._updateDefaults({thermo_h_fill_color:t||void 0})))}
              ${this._row("Top Graduated Color (Opt)",e.thermo_h_fill_color2?o`${this._colorPicker("d-thermo-h-fc2",e.thermo_h_fill_color2,t=>this._updateDefaults({thermo_h_fill_color2:t||void 0}),{clearTitle:"Remove gradient",onClear:()=>this._updateDefaults({thermo_h_fill_color2:void 0})})}`:o`<button class="ec-lib-browse-btn" style="font-size:12px" @click=${()=>this._updateDefaults({thermo_h_fill_color2:e.thermo_h_fill_color??"#7ce800"})}>+ Add gradient end</button>`)}
      </div>
    `}_elemBatH(){const e=this._config?.defaults??{};return o`
      <div class="ec-section">
              ${this._row("Fill color",this._colorPicker("d-bh-fc",e.battery_h_fill_color,t=>this._updateDefaults({battery_h_fill_color:t||void 0})))}
              ${this._row("Top Graduated Color (Opt)",e.battery_h_fill_color2?o`${this._colorPicker("d-bh-fc2",e.battery_h_fill_color2,t=>this._updateDefaults({battery_h_fill_color2:t||void 0}),{clearTitle:"Remove gradient",onClear:()=>this._updateDefaults({battery_h_fill_color2:void 0})})}`:o`<button class="ec-lib-browse-btn" style="font-size:12px" @click=${()=>this._updateDefaults({battery_h_fill_color2:e.battery_h_fill_color??"#7ce800"})}>+ Add gradient end</button>`)}
      </div>
    `}_elemBatV(){const e=this._config?.defaults??{};return o`
      <div class="ec-section">
              ${this._row("Fill color",this._colorPicker("d-bv-fc",e.battery_v_fill_color,t=>this._updateDefaults({battery_v_fill_color:t||void 0})))}
              ${this._row("Top Graduated Color (Opt)",e.battery_v_fill_color2?o`${this._colorPicker("d-bv-fc2",e.battery_v_fill_color2,t=>this._updateDefaults({battery_v_fill_color2:t||void 0}),{clearTitle:"Remove gradient",onClear:()=>this._updateDefaults({battery_v_fill_color2:void 0})})}`:o`<button class="ec-lib-browse-btn" style="font-size:12px" @click=${()=>this._updateDefaults({battery_v_fill_color2:e.battery_v_fill_color??"#7ce800"})}>+ Add gradient end</button>`)}
      </div>
    `}_elemTankCyl(){const e=this._config?.defaults??{};return o`
      <div class="ec-section">
              ${this._row("Fill color",this._colorPicker("d-tc-fc",e.tank_cylinder_fill_color,t=>this._updateDefaults({tank_cylinder_fill_color:t||void 0})))}
              ${this._row("Top Graduated Color (Opt)",e.tank_cylinder_fill_color2?o`${this._colorPicker("d-tc-fc2",e.tank_cylinder_fill_color2,t=>this._updateDefaults({tank_cylinder_fill_color2:t||void 0}),{clearTitle:"Remove gradient",onClear:()=>this._updateDefaults({tank_cylinder_fill_color2:void 0})})}`:o`<button class="ec-lib-browse-btn" style="font-size:12px" @click=${()=>this._updateDefaults({tank_cylinder_fill_color2:e.tank_cylinder_fill_color??"#7ce800"})}>+ Add gradient end</button>`)}
              ${this._row("Fill direction",o`<select class="ec-select"
                  .value=${e.tank_cylinder_fill_direction??"up"}
                  @change=${t=>this._updateDefaults({tank_cylinder_fill_direction:t.target.value})}>
                  <option value="up">Up</option>
                  <option value="down">Down</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>`)}
              ${this._row("Tank wall color",e.tank_cylinder_tank_color?o`${this._colorPicker("d-tc-wc",e.tank_cylinder_tank_color,t=>this._updateDefaults({tank_cylinder_tank_color:t||void 0}),{clearTitle:"Remove (use SVG default)",onClear:()=>this._updateDefaults({tank_cylinder_tank_color:void 0})})}`:o`<button class="ec-lib-browse-btn" style="font-size:12px" @click=${()=>this._updateDefaults({tank_cylinder_tank_color:"#808080"})}>+ Set wall color</button>`)}
      </div>
    `}_elemTankWater(){const e=this._config?.defaults??{};return o`
      <div class="ec-section">
              ${this._row("Fill color",this._colorPicker("d-tw-fc",e.tank_water_fill_color,t=>this._updateDefaults({tank_water_fill_color:t||void 0})))}
              ${this._row("Top Graduated Color (Opt)",e.tank_water_fill_color2?o`${this._colorPicker("d-tw-fc2",e.tank_water_fill_color2,t=>this._updateDefaults({tank_water_fill_color2:t||void 0}),{clearTitle:"Remove gradient",onClear:()=>this._updateDefaults({tank_water_fill_color2:void 0})})}`:o`<button class="ec-lib-browse-btn" style="font-size:12px" @click=${()=>this._updateDefaults({tank_water_fill_color2:e.tank_water_fill_color??"#7ce800"})}>+ Add gradient end</button>`)}
              ${this._row("Fill direction",o`<select class="ec-select"
                  .value=${e.tank_water_fill_direction??"up"}
                  @change=${t=>this._updateDefaults({tank_water_fill_direction:t.target.value})}>
                  <option value="up">Up</option>
                  <option value="down">Down</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>`)}
              ${this._row("Tank wall color",e.tank_water_tank_color?o`${this._colorPicker("d-tw-wc",e.tank_water_tank_color,t=>this._updateDefaults({tank_water_tank_color:t||void 0}),{clearTitle:"Remove (use SVG default)",onClear:()=>this._updateDefaults({tank_water_tank_color:void 0})})}`:o`<button class="ec-lib-browse-btn" style="font-size:12px" @click=${()=>this._updateDefaults({tank_water_tank_color:"#808080"})}>+ Set wall color</button>`)}
      </div>
    `}_elemTankFerm(){const e=this._config?.defaults??{};return o`
      <div class="ec-section">
              ${this._row("Fill color",this._colorPicker("d-tf-fc",e.tank_fermenter_fill_color,t=>this._updateDefaults({tank_fermenter_fill_color:t||void 0})))}
              ${this._row("Top Graduated Color (Opt)",e.tank_fermenter_fill_color2?o`${this._colorPicker("d-tf-fc2",e.tank_fermenter_fill_color2,t=>this._updateDefaults({tank_fermenter_fill_color2:t||void 0}),{clearTitle:"Remove gradient",onClear:()=>this._updateDefaults({tank_fermenter_fill_color2:void 0})})}`:o`<button class="ec-lib-browse-btn" style="font-size:12px" @click=${()=>this._updateDefaults({tank_fermenter_fill_color2:e.tank_fermenter_fill_color??"#7ce800"})}>+ Add gradient end</button>`)}
              ${this._row("Fill direction",o`<select class="ec-select"
                  .value=${e.tank_fermenter_fill_direction??"up"}
                  @change=${t=>this._updateDefaults({tank_fermenter_fill_direction:t.target.value})}>
                  <option value="up">Up</option>
                  <option value="down">Down</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>`)}
              ${this._row("Tank wall color",e.tank_fermenter_tank_color?o`${this._colorPicker("d-tf-wc",e.tank_fermenter_tank_color,t=>this._updateDefaults({tank_fermenter_tank_color:t||void 0}),{clearTitle:"Remove (use SVG default)",onClear:()=>this._updateDefaults({tank_fermenter_tank_color:void 0})})}`:o`<button class="ec-lib-browse-btn" style="font-size:12px" @click=${()=>this._updateDefaults({tank_fermenter_tank_color:"#808080"})}>+ Set wall color</button>`)}
      </div>
    `}_elemTankCone(){const e=this._config?.defaults??{};return o`
      <div class="ec-section">
              ${this._row("Fill color",this._colorPicker("d-tn-fc",e.tank_cone_fill_color,t=>this._updateDefaults({tank_cone_fill_color:t||void 0})))}
              ${this._row("Top Graduated Color (Opt)",e.tank_cone_fill_color2?o`${this._colorPicker("d-tn-fc2",e.tank_cone_fill_color2,t=>this._updateDefaults({tank_cone_fill_color2:t||void 0}),{clearTitle:"Remove gradient",onClear:()=>this._updateDefaults({tank_cone_fill_color2:void 0})})}`:o`<button class="ec-lib-browse-btn" style="font-size:12px" @click=${()=>this._updateDefaults({tank_cone_fill_color2:e.tank_cone_fill_color??"#7ce800"})}>+ Add gradient end</button>`)}
              ${this._row("Fill direction",o`<select class="ec-select"
                  .value=${e.tank_cone_fill_direction??"up"}
                  @change=${t=>this._updateDefaults({tank_cone_fill_direction:t.target.value})}>
                  <option value="up">Up</option>
                  <option value="down">Down</option>
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>`)}
              ${this._row("Tank wall color",e.tank_cone_tank_color?o`${this._colorPicker("d-tn-wc",e.tank_cone_tank_color,t=>this._updateDefaults({tank_cone_tank_color:t||void 0}),{clearTitle:"Remove (use SVG default)",onClear:()=>this._updateDefaults({tank_cone_tank_color:void 0})})}`:o`<button class="ec-lib-browse-btn" style="font-size:12px" @click=${()=>this._updateDefaults({tank_cone_tank_color:"#808080"})}>+ Set wall color</button>`)}
      </div>
    `}_elemInverter(){const e=this._config?.defaults??{};return o`
      <div class="ec-section">
              ${this._row("Line color",this._colorPicker("d-inv-lc",e.inverter_line_color,t=>this._updateDefaults({inverter_line_color:t||void 0})))}
      </div>
    `}_elemGaugeArc(){const e=this._config?.defaults??{};return o`
      <div class="ec-section">
              ${this._row("Needle color",this._colorPicker("d-ga-nc",e.gauge_arc_needle_color,t=>this._updateDefaults({gauge_arc_needle_color:t||void 0})))}
              ${this._row("Label color",this._colorPicker("d-ga-lc",e.gauge_arc_label_color,t=>this._updateDefaults({gauge_arc_label_color:t||void 0})))}
              ${this._row("Label size",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="6" max="24" step="1"
                  .value=${e.gauge_arc_label_size!=null?String(e.gauge_arc_label_size):""}
                  placeholder="11"
                  @change=${t=>{const s=t.target.value;this._updateDefaults({gauge_arc_label_size:s===""?void 0:Number(s)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}
      </div>
    `}_renderPopoverPanel(){const e=this._navPath,t=this._extCards();if(e.length===0)return o`
        ${this._navBtn("defaults-global","Popover Card Defaults","Default columns, size, gaps & style for every popover card","mdi:tune")}
        <div class="ec-section-header">
          <span></span>
          <button class="ec-btn-add" @click=${this._addExtCard}>+ Popover Card</button>
        </div>
        ${t.length===0?o`<p class="ec-empty">No popover cards — click "+ Popover Card".</p>`:t.map((a,r)=>this._itemCard({dragKey:`extcard:${r}`,icon:"mdi:picture-in-picture-bottom-right",label:a.name??`Popover Card ${r+1}`,sub:`${a.fields.length} field${a.fields.length===1?"":"s"}`,selected:r===this._selExtCard,onClick:()=>{this._selExtCard=r,this._selExtField=-1,this._navPush(`card:${r}`,a.name??`Popover Card ${r+1}`)},actions:o`
                <button class="ec-btn-remove"
                  @click=${l=>{l.stopPropagation(),this._removeExtCard(r)}}
                  title="Remove">✕</button>
              `}))}
      `;if(e[0].key==="defaults-global")return this._popoverGlobalDefaults();const s=this._selExtCard,i=t[s];if(!i)return o``;if(e.length===1)return o`
        ${this._navBtn("sec:defaults","Card Defaults","Columns, width %, height %, gaps","mdi:tune")}
        ${this._navBtn("sec:style","Box Style","Background, border, glow, blur","mdi:palette")}
        ${this._navBtn("sec:text","Text Styles","Label & value style","mdi:format-title")}
        ${this._renderExtFieldList(s,i)}
      `;const n=e[1].key;if(n.startsWith("field:")){const a=this._selExtField,r=i.fields[a];return r?e.length===4&&e[2].key==="fsec:series"&&e[3].key.startsWith("egs:")?this._extFieldSecGraphSeriesItem(s,a,r,this._selSeries):e.length===3?this._extFieldSection(s,a,r,e[2].key):this._renderExtFieldPanel(s,a,r):o``}return this._popoverCardSection(s,i,n)}_popoverGlobalDefaults(){return this._config?o`
      <div class="ec-section">
              ${this._row("Columns (default)",o`<select class="ec-select"
                  .value=${String(this._config.extended_card_defaults?.columns??_("columns")??2)}
                  @change=${e=>this._updateExtDefaults({columns:Number(e.target.value)})}
                >
                  <option value="1">1</option>
                  <option value="2" .selected=${(this._config.extended_card_defaults?.columns??_("columns")??2)===2}>2</option>
                  <option value="3" .selected=${this._config.extended_card_defaults?.columns===3}>3</option>
                  <option value="4" .selected=${this._config.extended_card_defaults?.columns===4}>4</option>
                  <option value="5" .selected=${this._config.extended_card_defaults?.columns===5}>5</option>
                  <option value="6" .selected=${this._config.extended_card_defaults?.columns===6}>6</option>
                  <option value="7" .selected=${this._config.extended_card_defaults?.columns===7}>7</option>
                  <option value="8" .selected=${this._config.extended_card_defaults?.columns===8}>8</option>
                </select>`)}
              ${this._row("Width % (default)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="20" max="100"
                  .value=${this._config.extended_card_defaults?.width!=null?String(this._config.extended_card_defaults.width):""}
                  placeholder="70"
                  @change=${e=>{const t=e.target.value;this._updateExtDefaults({width:t===""?void 0:Number(t)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${e=>this._stepNumInput(e,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${e=>this._stepNumInput(e,1)}>+</button></span></span>`)}
              ${this._row("Height % (default)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="10" max="100"
                  .value=${this._config.extended_card_defaults?.height!=null?String(this._config.extended_card_defaults.height):""}
                  placeholder="auto"
                  @change=${e=>{const t=e.target.value;this._updateExtDefaults({height:t===""?void 0:Number(t)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${e=>this._stepNumInput(e,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${e=>this._stepNumInput(e,1)}>+</button></span></span>`)}
              ${this._row("Field gap (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0"
                  .value=${this._config.extended_card_defaults?.field_gap!=null?String(this._config.extended_card_defaults.field_gap):""}
                  placeholder="8"
                  @change=${e=>{const t=e.target.value;this._updateExtDefaults({field_gap:t===""?void 0:Number(t)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${e=>this._stepNumInput(e,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${e=>this._stepNumInput(e,1)}>+</button></span></span>`)}
              ${this._row("Column gap (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0"
                  .value=${this._config.extended_card_defaults?.column_gap!=null?String(this._config.extended_card_defaults.column_gap):""}
                  placeholder="(from global)"
                  @change=${e=>{const t=e.target.value;this._updateExtDefaults({column_gap:t===""?void 0:Number(t)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${e=>this._stepNumInput(e,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${e=>this._stepNumInput(e,1)}>+</button></span></span>`)}
              <div class="ec-subsection-title">Card default</div>
              ${this._boxRows("extd-card",this._config.extended_card_defaults?.card??{},e=>this._updateExtDefaults({card:{...this._config.extended_card_defaults?.card,...e}}))}
              <div class="ec-subsection-title">Label default</div>
              ${this._textRows("extd-lbl",this._config.extended_card_defaults?.label??{},e=>this._updateExtDefaults({label:{...this._config.extended_card_defaults?.label,...e}}))}
              <div class="ec-subsection-title">Value default</div>
              ${this._textRows("extd-val",this._config.extended_card_defaults?.value??{},e=>this._updateExtDefaults({value:{...this._config.extended_card_defaults?.value,...e}}))}
      </div>
    `:o``}_popoverCardSection(e,t,s){switch(s){case"sec:defaults":return this._popoverSecDefaults(e,t);case"sec:style":return this._popoverSecStyle(e,t);case"sec:text":return this._popoverSecText(e,t);default:return o``}}_popoverSecDefaults(e,t){return o`
      <div class="ec-section">
        ${this._row("Name",o`<input class="ec-input" type="text" .value=${t.name??""}
            @change=${s=>this._updateExtCard(e,{name:s.target.value})}
          />`)}

        ${this._row("Columns",o`<select class="ec-select"
            .value=${String(t.columns??_("columns")??2)}
            @change=${s=>this._updateExtCard(e,{columns:Number(s.target.value)})}
          >
            <option value="1">1</option>
            <option value="2" .selected=${(t.columns??_("columns")??2)===2}>2</option>
            <option value="3" .selected=${t.columns===3}>3</option>
            <option value="4" .selected=${t.columns===4}>4</option>
            <option value="5" .selected=${t.columns===5}>5</option>
            <option value="6" .selected=${t.columns===6}>6</option>
            <option value="7" .selected=${t.columns===7}>7</option>
            <option value="8" .selected=${t.columns===8}>8</option>
          </select>`)}

        ${this._row("Width %",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="20" max="100"
            .value=${t.width!=null?String(t.width):""}
            placeholder="(from defaults)"
            @change=${s=>{const i=s.target.value;this._updateExtCard(e,{width:i===""?void 0:Number(i)})}}
          /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>`)}

        ${this._row("Height %",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="10" max="100"
            .value=${t.height!=null?String(t.height):""}
            placeholder="auto"
            @change=${s=>{const i=s.target.value;this._updateExtCard(e,{height:i===""?void 0:Number(i)})}}
          /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>`)}

        ${this._row("Align",o`<select class="ec-select"
            .value=${t.align??_("align")??"left"}
            @change=${s=>this._updateExtCard(e,{align:s.target.value})}
          >
            ${ne.map(s=>o`<option value=${s} .selected=${(t.align??_("align")??"left")===s}>${s}</option>`)}
          </select>`)}

        ${this._row("Field gap (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0"
            .value=${t.field_gap!=null?String(t.field_gap):""}
            placeholder="(from defaults)"
            @change=${s=>{const i=s.target.value;this._updateExtCard(e,{field_gap:i===""?void 0:Number(i)})}}
          /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>`)}

        ${this._row("Column gap (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0"
            .value=${t.column_gap!=null?String(t.column_gap):""}
            placeholder="(from defaults)"
            @change=${s=>{const i=s.target.value;this._updateExtCard(e,{column_gap:i===""?void 0:Number(i)})}}
          /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>`)}
      </div>
    `}_popoverSecStyle(e,t){return o`
      <div class="ec-section">
        ${this._boxRows(`ext${e}`,t.box??{},s=>this._updateExtCardBox(e,s))}
      </div>
    `}_popoverSecText(e,t){return o`
      <div class="ec-section">
        <div class="ec-subsection-title">Label Default</div>
        ${this._textRows(`ext${e}-ls`,t.label_style??{},s=>this._updateExtCard(e,{label_style:{...t.label_style,...s}}))}

        <div class="ec-subsection-title">Value Default</div>
        ${this._textRows(`ext${e}-vs`,t.value_style??{},s=>this._updateExtCard(e,{value_style:{...t.value_style,...s}}))}
      </div>
    `}_renderExtFieldList(e,t){const s=t.fields;return o`
      <div class="ec-section ec-section--fields">
        <div class="ec-section-header">
          <span class="ec-section-title">Fields</span>
          ${this._copiedField?o`<button class="ec-btn-paste"
            @click=${()=>this._pasteField(e,!0)}
            title="Paste copied field onto this card">⎗ Field</button>`:m}
          <button class="ec-btn-add" @click=${()=>this._addExtField(e)}>+ Field</button>
        </div>
        ${s.length===0?o`<p class="ec-empty">No fields — click "+ Field".</p>`:s.map((i,n)=>this._itemCard({dragKey:`extfield:${e}:${n}`,icon:ys[i.type],label:this._fieldName(i),sub:this._fieldSub(i),selected:n===this._selExtField,onClick:()=>{this._selExtField=n,this._navPush(`field:${n}`,`Field ${n+1}`)},actions:o`
                ${this._copiedFieldSrc?.isExt===!0&&this._copiedFieldSrc.ci===e&&this._copiedFieldSrc.fi===n?o`<span class="ec-copy-badge">Copied</span>`:o`<button class="ec-btn-copy"
                      @click=${a=>{a.stopPropagation(),this._copyField(e,n,!0)}}
                      title="Copy this field">⎘</button>`}
                <button class="ec-btn-remove"
                  @click=${a=>{a.stopPropagation(),this._removeExtField(e,n)}}
                  title="Remove">✕</button>
              `}))}
      </div>
    `}_extFieldHeader(e,t,s){const i=n=>this._updateExtField(e,t,n);return o`
        <div class="ec-section-header">
          <span class="ec-section-title">Field ${t+1}</span>
        </div>

        ${this._row("Type",o`<select class="ec-select"
            .value=${s.type==="graph"?"svg":s.type}
            @change=${n=>{const a=n.target.value;i({type:a}),a==="svg"&&this._openGGPicker(e,t,!0)}}
          >
            ${fs.map(n=>o`<option value=${n} .selected=${(s.type==="graph"?"svg":s.type)===n}>${Ce[n]}</option>`)}
          </select>`)}

        ${s.type==="svg"||s.type==="graph"?this._row("Element",o`<div style="display:flex;gap:8px;align-items:center;">
            <span class="ec-input" style="flex:1;min-width:0;opacity:0.85;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${this._elementLabel(s)}</span>
            <button class="ec-lib-browse-btn" style="flex:0 0 auto;white-space:nowrap;" @click=${()=>this._openGGPicker(e,t,!0)}>⊞ Change type…</button>
          </div>`):m}

        ${this._row("Display Name",o`<input class="ec-input" type="text"
            .value=${s.display_name??""}
            placeholder="Friendly name for the field list"
            @change=${n=>{const a=n.target.value.trim();i({display_name:a===""?void 0:a})}}
          />`)}

        ${this._row("Column",o`<div style="display:flex;gap:4px;align-items:center">
            <span class="ec-num-wrap"><input class="ec-input ec-input-num-small" type="number" min="1" max="8"
              .value=${s.column!=null?String(s.column):""}
              placeholder="auto"
              title="Force this field into a specific column (1–8). Leave blank for auto flow."
              @change=${n=>{const a=n.target.value;i({column:a===""?void 0:Number(a)})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${n=>this._stepNumInput(n,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${n=>this._stepNumInput(n,1)}>+</button></span></span>
            <span style="font-size:11px;opacity:0.6">Span end (Opt)</span>
            <span class="ec-num-wrap"><input class="ec-input ec-input-num-small" type="number" min="2" max="8"
              .value=${s.column_end!=null?String(s.column_end):""}
              placeholder="–"
              title="Span End Column (Opt) — last column this field occupies"
              @change=${n=>{const a=n.target.value;i({column_end:a===""?void 0:Number(a)})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${n=>this._stepNumInput(n,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${n=>this._stepNumInput(n,1)}>+</button></span></span>
          </div>`)}
    `}_renderExtFieldPanel(e,t,s){return s.type==="blank"||s.type==="rule"?o`
        <div class="ec-section ec-section--fields">
          ${this._extFieldHeader(e,t,s)}
          ${this._extFieldSecBlankOrRule(e,t,s)}
        </div>
      `:o`
      <div class="ec-section ec-section--fields">
        ${this._extFieldHeader(e,t,s)}
        ${this._extFieldSectionMenu(s)}
      </div>
    `}_extFieldSectionMenu(e){const t=[];return e.type==="value"?(t.push(this._navBtn("fsec:source","Value Source","Entity, virtual entity, time-until layout","mdi:database")),t.push(this._navBtn("fsec:label","Value Label","Optional label text & position","mdi:tag-text-outline"))):e.type==="icon"?t.push(this._navBtn("fsec:icon","Icon","mdi icon name","mdi:emoticon-outline")):e.type==="label"?t.push(this._navBtn("fsec:content","Content","Label text","mdi:format-text")):e.type==="svg"?(t.push(this._navBtn("fsec:source","Value Source","Entity, tank fill source","mdi:database")),this._isInverterSvg(e)||t.push(this._navBtn("fsec:range","Range","Min / max value","mdi:arrow-expand-vertical")),t.push(this._navBtn("fsec:colors","Colors","Fill direction, fill, gradient, tank colour","mdi:palette")),t.push(this._navBtn("fsec:size","Size","Height, width","mdi:resize")),this._isInverterSvg(e)||t.push(this._navBtn("fsec:thresholds","Color Thresholds","Value-driven fill colour overrides","mdi:format-color-fill")),this._isGaugeSvg(e)&&t.push(this._navBtn("fsec:gauge","Gauge Labels","Min/max labels, value display","mdi:speedometer")),this._isThermometerSvg(e)&&t.push(this._navBtn("fsec:thermo","Thermometer","Ticks, grid, temperature text","mdi:thermometer"))):e.type==="graph"&&(t.push(this._navBtn("fsec:graph","Graph Settings","Type, axes, legend, range, size","mdi:chart-bar")),t.push(this._navBtn("fsec:series","Series","Entities plotted on the graph","mdi:chart-line"))),(e.type==="value"||e.type==="icon")&&(t.push(this._navBtn("fsec:stats","HA Statistics","Advanced statistics integration","mdi:chart-box-outline")),t.push(this._navBtn("fsec:display","Display","Unit, decimals, hide below","mdi:eye-outline"))),t.push(this._navBtn("fsec:style","Text Style","Align & value/label text style","mdi:format-title")),t.push(this._navBtn("fsec:actions","Actions","Tap · hold · double tap","mdi:gesture-tap")),o`${t}`}_extFieldSection(e,t,s,i){switch(i){case"fsec:source":return s.type==="svg"?this._extFieldSecSvgSource(e,t,s):this._extFieldSecValueSource(e,t,s);case"fsec:label":return this._extFieldSecValueLabel(e,t,s);case"fsec:icon":return this._extFieldSecIcon(e,t,s);case"fsec:content":return this._extFieldSecLabelContent(e,t,s);case"fsec:range":return this._extFieldSecSvgRange(e,t,s);case"fsec:colors":return this._extFieldSecSvgColors(e,t,s);case"fsec:size":return this._extFieldSecSvgSize(e,t,s);case"fsec:thresholds":return this._extFieldSecSvgThresholds(e,t,s);case"fsec:gauge":return this._extFieldSecSvgGauge(e,t,s);case"fsec:thermo":return this._extFieldSecSvgThermo(e,t,s);case"fsec:graph":return this._extFieldSecGraphSettings(e,t,s);case"fsec:series":return this._extFieldSecGraphSeries(e,t,s);case"fsec:stats":return this._extFieldSecStats(e,t,s);case"fsec:display":return this._extFieldSecDisplay(e,t,s);case"fsec:style":return this._extFieldSecStyle(e,t,s);case"fsec:actions":return this._extFieldSecActions(e,t,s);default:return o``}}_extFieldSecBlankOrRule(e,t,s){const i=n=>this._updateExtField(e,t,n);return s.type!=="blank"?o`<p class="ec-hint">Horizontal rule — no options.</p>`:o`
        ${this._row("Gap (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0"
            .value=${s.blank_gap!=null?String(s.blank_gap):""}
            placeholder="10"
            @change=${n=>{const a=n.target.value;i({blank_gap:a===""?void 0:Number(a)})}} /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${n=>this._stepNumInput(n,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${n=>this._stepNumInput(n,1)}>+</button></span></span>`)}
    `}_extFieldSecValueSource(e,t,s){const i=n=>this._updateExtField(e,t,n);return o`
      <div class="ec-section">
          ${this._row("Entity",s.entity?.startsWith("virtual:")?o`<div style="display:flex;gap:4px;align-items:center;">
                  <span class="ec-input" style="flex:1;opacity:0.8;">
                    ${this._virtuals().find(n=>`virtual:${n.id}`===s.entity)?.name??s.entity}
                  </span>
                  <button class="ec-btn-clear" @click=${()=>i({entity:void 0})} title="Switch to real entity">✕</button>
                </div>`:o`<ha-entity-picker
                  .hass=${this.hass} .value=${s.entity??""} allow-custom-entity
                  @value-changed=${n=>i({entity:n.detail.value})}
                ></ha-entity-picker>`)}
          ${!s.entity?.startsWith("virtual:")&&this._virtuals().length>0?this._row("Virtual Entity",o`<select class="ec-select" .value=${""} @change=${n=>{const a=n.target.value;a&&i({entity:a}),n.target.value=""}}>
              <option value="">(pick a virtual)</option>
              ${this._virtuals().map(n=>o`<option value=${"virtual:"+n.id}>${n.name}</option>`)}
            </select>`):m}
          ${this._isTimeUntilVirtual(s)?this._renderTuLayoutBuilder(s,i):m}
      </div>
    `}_extFieldSecValueLabel(e,t,s){const i=n=>this._updateExtField(e,t,n);return o`
      <div class="ec-section">
           ${this._row("Value Label (Optional)",o`<input class="ec-input" type="text" .value=${s.label??""}
              placeholder="(optional)"
              @input=${n=>{const a=n.target.value;i({label:a||void 0})}}
            />`)}
          ${s.label?o`
            ${this._row("Value Label position",o`<select class="ec-select"
                .value=${s.label_position??_("label_position")??"above"}
                @change=${n=>i({label_position:n.target.value})}
              >
                <option value="above"  .selected=${(s.label_position??_("label_position")??"above")==="above"}>Above value</option>
                <option value="below"  .selected=${s.label_position==="below"}>Below value</option>
                <option value="left"   .selected=${s.label_position==="left"}>Left of value</option>
                <option value="right"  .selected=${s.label_position==="right"}>Right of value</option>
              </select>`)}
            ${this._row("Label column",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="1" max="4"
                .value=${s.label_column!=null?String(s.label_column):""}
                placeholder="(same cell)"
                @change=${n=>{const a=n.target.value;i({label_column:a===""?void 0:Number(a)})}}
              /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${n=>this._stepNumInput(n,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${n=>this._stepNumInput(n,1)}>+</button></span></span>`)}
          `:m}
      </div>
    `}_extFieldSecLabelContent(e,t,s){const i=n=>this._updateExtField(e,t,n);return o`
      <div class="ec-section">
          ${this._row("Text",o`<input class="ec-input" type="text" .value=${s.text??""}
              @change=${n=>i({text:n.target.value})} />`)}
      </div>
    `}_extFieldSecIcon(e,t,s){const i=n=>this._updateExtField(e,t,n);return o`
      <div class="ec-section">
          ${this._row("Icon",o`<input class="ec-input" type="text" .value=${s.icon??""}
              placeholder="mdi:lightning-bolt"
              @change=${n=>i({icon:n.target.value})} />`)}
      </div>
    `}_extFieldSecSvgSource(e,t,s){const i=n=>this._updateExtField(e,t,n);return o`
      <div class="ec-section">

      ${!s.svg||this._isThermometerSvg(s)||this._isBatterySvg(s)?this._row("Entity",o`<ha-entity-picker .hass=${this.hass} .value=${s.entity??""} allow-custom-entity
              @value-changed=${n=>i({entity:n.detail.value||void 0})} />`):m}
          ${this._isBatterySvg(s)?this._row("Charging entity",o`<ha-entity-picker .hass=${this.hass} .value=${s.charging_entity??""} allow-custom-entity
              @value-changed=${n=>i({charging_entity:n.detail.value||void 0})} />`):m}
          ${s.svg&&!this._isThermometerSvg(s)&&!this._isBatterySvg(s)&&!this._isInverterSvg(s)&&!this._isGaugeSvg(s)?o`
            <div class="ec-subsection-title" style="margin-top:6px">Tank fill source</div>
            ${this._row("% entity",o`<ha-entity-picker .hass=${this.hass} .value=${s.tank_pct_entity??""} allow-custom-entity
                @value-changed=${n=>i({tank_pct_entity:n.detail.value||void 0})}
              />`)}
            ${this._row("Flow In/Out Entity",o`<ha-entity-picker .hass=${this.hass} .value=${s.tank_volume_entity??""} allow-custom-entity
                @value-changed=${n=>i({tank_volume_entity:n.detail.value||void 0})}
              />`)}
            ${this._row("Capacity entity",o`<ha-entity-picker .hass=${this.hass} .value=${s.tank_capacity_entity??""} allow-custom-entity
                @value-changed=${n=>i({tank_capacity_entity:n.detail.value||void 0})}
              />`)}
          `:m}
      </div>
    `}_extFieldSecSvgRange(e,t,s){const i=n=>this._updateExtField(e,t,n);return o`
      <div class="ec-section">
            ${this._row("Min value",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number"
                .value=${s.min!=null?String(s.min):""} placeholder="0"
                @change=${n=>{const a=n.target.value;i({min:a===""?void 0:Number(a)})}} /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${n=>this._stepNumInput(n,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${n=>this._stepNumInput(n,1)}>+</button></span></span>`)}
            ${this._row("Max value",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number"
                .value=${s.max!=null?String(s.max):""} placeholder="100"
                @change=${n=>{const a=n.target.value;i({max:a===""?void 0:Number(a)})}} /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${n=>this._stepNumInput(n,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${n=>this._stepNumInput(n,1)}>+</button></span></span>`)}
      </div>
    `}_extFieldSecSvgColors(e,t,s){const i=a=>this._updateExtField(e,t,a),n=`ext${e}-f${t}`;return o`
      <div class="ec-section">
          ${s.svg&&!this._isInverterSvg(s)?this._row("Fill direction",o`<select class="ec-select" .value=${s.fill_direction??_("fill_direction")??"up"}
              @change=${a=>i({fill_direction:a.target.value})}>
              <option value="up"    .selected=${(s.fill_direction??_("fill_direction")??"up")==="up"}>Up (liquid rising)</option>
              <option value="down"  .selected=${s.fill_direction==="down"}>Down</option>
              <option value="left"  .selected=${s.fill_direction==="left"}>Left</option>
              <option value="right" .selected=${s.fill_direction==="right"}>Right</option>
            </select>`):m}
          ${this._row(this._isInverterSvg(s)?"Line color":"Fill color",this._colorPicker(`${n}-fc`,s.fill_color,a=>i({fill_color:a})))}
          ${this._isInverterSvg(s)?m:this._row("Top Graduated Color (Opt)",s.fill_color2?this._colorPicker(`${n}-fc2`,s.fill_color2,a=>i({fill_color2:a}),{clearTitle:"Remove gradient",onClear:()=>i({fill_color2:void 0})}):o`<button class="ec-lib-browse-btn" style="font-size:12px"
                  @click=${()=>i({fill_color2:s.fill_color??"#7ce800"})}>+ Add gradient end</button>`)}
          ${s.svg&&!this._isThermometerSvg(s)&&!this._isBatterySvg(s)&&!this._isInverterSvg(s)&&!this._isGaugeSvg(s)?this._row("Tank color",this._colorPicker(`${n}-tkc`,s.tank_color,a=>i({tank_color:a}),{clearTitle:"Remove (use SVG default)",onClear:()=>i({tank_color:void 0})})):m}
      </div>
    `}_extFieldSecSvgSize(e,t,s){const i=n=>this._updateExtField(e,t,n);return o`
      <div class="ec-section">
          ${this._row("Height (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="20"
              .value=${s.height!=null?String(s.height):""} placeholder="120"
              @change=${n=>{const a=n.target.value;i({height:a===""?void 0:Number(a)})}} /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${n=>this._stepNumInput(n,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${n=>this._stepNumInput(n,1)}>+</button></span></span>`)}
          ${this._row("Width (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="10"
              .value=${s.width!=null?String(s.width):""} placeholder="auto"
              @change=${n=>{const a=n.target.value;i({width:a===""?void 0:Number(a)})}} /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${n=>this._stepNumInput(n,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${n=>this._stepNumInput(n,1)}>+</button></span></span>`)}
      </div>
    `}_extFieldSecSvgThresholds(e,t,s){const i=a=>this._updateExtField(e,t,a),n=`ext${e}-f${t}`;return o`
      <div class="ec-section">
            <p style="font-size:12px;color:#4a8aaa;margin:0 0 6px;">
              Each threshold sets the fill color when the entity value ≥ its level.
            </p>
            ${(s.thresholds??[]).map((a,r)=>o`
              <div class="ec-row">
                <span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" style="width:70px"
                  .value=${String(a.value)}
                  @change=${l=>{const c=[...s.thresholds??[]];c[r]={...a,value:Number(l.target.value)},i({thresholds:c})}} /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${l=>this._stepNumInput(l,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${l=>this._stepNumInput(l,1)}>+</button></span></span>
                <div style="flex:1">
                  ${this._colorPicker(`${n}-t${r}`,a.color,l=>{const c=[...s.thresholds??[]];c[r]={...a,color:l??a.color},i({thresholds:c})},{clearable:!1})}
                  <button class="ec-btn-remove"
                    @click=${()=>{const l=(s.thresholds??[]).filter((c,p)=>p!==r);i({thresholds:l.length?l:void 0})}}
                    title="Remove">✕</button>
                </div>
              </div>
            `)}
            <button class="ec-btn-add" style="margin-top:4px;"
              @click=${()=>{const a=[...s.thresholds??[],{value:0,color:"#f44336"}];i({thresholds:a})}}>+ Threshold</button>
      </div>
    `}_extFieldSecSvgGauge(e,t,s){const i=a=>this._updateExtField(e,t,a),n=`ext${e}-f${t}`;return o`
      <div class="ec-section">
            ${this._row("Min label",o`<input class="ec-input" type="text" .value=${s.gauge_min_label??""}
                placeholder="e.g. 0 kW"
                @change=${a=>{const r=a.target.value;i({gauge_min_label:r||void 0})}} />`)}
            ${this._row("Max label",o`<input class="ec-input" type="text" .value=${s.gauge_max_label??""}
                placeholder="e.g. 5 kW"
                @change=${a=>{const r=a.target.value;i({gauge_max_label:r||void 0})}} />`)}
            ${this._row("Show value",o`<label style="display:flex;align-items:center;gap:6px;cursor:pointer;">
                <input type="checkbox" .checked=${s.gauge_show_value??!1}
                  @change=${a=>i({gauge_show_value:a.target.checked||void 0})} />
                <span>Display current value in centre</span>
              </label>`)}
            ${this._row("Label size (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="6" max="48"
                .value=${s.gauge_label_size!=null?String(s.gauge_label_size):""} placeholder="11"
                @change=${a=>{const r=a.target.value;i({gauge_label_size:r===""?void 0:Number(r)})}} /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${a=>this._stepNumInput(a,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${a=>this._stepNumInput(a,1)}>+</button></span></span>`)}
            ${this._row("Label color",this._colorPicker(`${n}-glc`,s.gauge_label_color,a=>i({gauge_label_color:a}),{clearTitle:"Reset to default"}))}
      </div>
    `}_extFieldSecSvgThermo(e,t,s){const i=a=>this._updateExtField(e,t,a),n=`ext${e}-f${t}`;return o`
      <div class="ec-section">
            ${this._row("Tick color",this._colorPicker(`${n}-ttc`,s.thermo_tick_color,a=>i({thermo_tick_color:a||void 0}),{clearTitle:"Reset to default"}))}
            ${this._row("Tick position",o`<select class="ec-select"
                .value=${s.thermo_text_position??_("thermo_text_position")??"right"}
                @change=${a=>i({thermo_text_position:a.target.value})}
              >
                ${["right","left","both"].map(a=>o`<option value=${a} .selected=${(s.thermo_text_position??_("thermo_text_position")??"right")===a}>${this._isHorizontalThermometerSvg(s)?{right:"Bottom",left:"Top",both:"Both"}[a]:a.charAt(0).toUpperCase()+a.slice(1)}</option>`)}
              </select>`)}
            ${this._row("Minor tick text",o`<input type="checkbox" class="ec-checkbox"
                .checked=${s.thermo_show_minor_tick_text??_("thermo_show_minor_tick_text")??!1}
                @change=${a=>i({thermo_show_minor_tick_text:a.target.checked})} />`)}
            ${this._row("Tick font size",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="1" max="20" step="0.5"
                .value=${s.thermo_tick_font_size!=null?String(s.thermo_tick_font_size):""} placeholder="4"
                @change=${a=>{const r=a.target.value;i({thermo_tick_font_size:r===""?void 0:Number(r)})}} /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${a=>this._stepNumInput(a,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${a=>this._stepNumInput(a,1)}>+</button></span></span>`)}
            ${this._row("Major tick length",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0.5" max="20" step="0.5"
                .value=${s.thermo_major_tick_length!=null?String(s.thermo_major_tick_length):""} placeholder="auto (from SVG)"
                @change=${a=>{const r=a.target.value;i({thermo_major_tick_length:r===""?void 0:Number(r)})}} /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${a=>this._stepNumInput(a,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${a=>this._stepNumInput(a,1)}>+</button></span></span>`)}
            ${this._row("Major tick thickness",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0.1" max="5" step="0.05"
                .value=${s.thermo_major_tick_width!=null?String(s.thermo_major_tick_width):""} placeholder="auto (from SVG)"
                @change=${a=>{const r=a.target.value;i({thermo_major_tick_width:r===""?void 0:Number(r)})}} /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${a=>this._stepNumInput(a,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${a=>this._stepNumInput(a,1)}>+</button></span></span>`)}
            ${this._row("Minor tick length",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0.5" max="20" step="0.5"
                .value=${s.thermo_minor_tick_length!=null?String(s.thermo_minor_tick_length):""} placeholder="auto (from SVG)"
                @change=${a=>{const r=a.target.value;i({thermo_minor_tick_length:r===""?void 0:Number(r)})}} /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${a=>this._stepNumInput(a,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${a=>this._stepNumInput(a,1)}>+</button></span></span>`)}
            ${this._row("Minor tick thickness",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0.1" max="5" step="0.05"
                .value=${s.thermo_minor_tick_width!=null?String(s.thermo_minor_tick_width):""} placeholder="auto (from SVG)"
                @change=${a=>{const r=a.target.value;i({thermo_minor_tick_width:r===""?void 0:Number(r)})}} /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${a=>this._stepNumInput(a,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${a=>this._stepNumInput(a,1)}>+</button></span></span>`)}
            ${this._row("Grid line color",this._colorPicker(`${n}-tgc`,s.thermo_grid_color,a=>i({thermo_grid_color:a||void 0}),{clearTitle:"Reset to default"}))}
            ${this._row("Above temperature transparency",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0" max="1" step="0.05"
                .value=${s.thermo_fill_opacity_above!=null?String(s.thermo_fill_opacity_above):""} placeholder="0.5"
                @change=${a=>{const r=a.target.value;i({thermo_fill_opacity_above:r===""?void 0:Number(r)})}} /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${a=>this._stepNumInput(a,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${a=>this._stepNumInput(a,1)}>+</button></span></span>`)}
            ${this._row("Decimals",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0" max="4" step="1"
                .value=${s.thermo_decimals!=null?String(s.thermo_decimals):""} placeholder="1"
                @change=${a=>{const r=a.target.value;i({thermo_decimals:r===""?void 0:Number(r)})}} /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${a=>this._stepNumInput(a,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${a=>this._stepNumInput(a,1)}>+</button></span></span>`)}
            ${this._row("Temperature value color",this._colorPicker(`${n}-ttc`,s.thermo_temp_color,a=>i({thermo_temp_color:a||void 0}),{clearTitle:"Reset to default"}))}
            ${this._row("Temperature value size",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="4" max="30" step="0.5"
                .value=${s.thermo_temp_font_size!=null?String(s.thermo_temp_font_size):""} placeholder="10"
                @change=${a=>{const r=a.target.value;i({thermo_temp_font_size:r===""?void 0:Number(r)})}} /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${a=>this._stepNumInput(a,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${a=>this._stepNumInput(a,1)}>+</button></span></span>`)}
      </div>
    `}_extFieldSecGraphSettings(e,t,s){const i=n=>this._updateExtField(e,t,n);return o`
      <div class="ec-section">

          ${this._row("Type",o`<select class="ec-select" .value=${s.graph_type??_("graph_type")??"bar"}
              @change=${n=>i({graph_type:n.target.value})}>
              ${Ne.map(n=>o`<option value=${n.value} .selected=${(s.graph_type??_("graph_type")??"bar")===n.value}>${n.label}</option>`)}
            </select>`)}
          ${this._row("Show axes",o`<input type="checkbox" .checked=${s.graph_show_axes??_("graph_show_axes")??!0}
              @change=${n=>i({graph_show_axes:n.target.checked||void 0})} />`)}
          ${this._row("Show legend",o`<input type="checkbox" .checked=${s.graph_show_legend??_("graph_show_legend")??!1}
              @change=${n=>i({graph_show_legend:n.target.checked||void 0})} />`)}
          ${this._row("Min value",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number"
              .value=${s.graph_min!=null?String(s.graph_min):""} placeholder="auto"
              @change=${n=>{const a=n.target.value;i({graph_min:a===""?void 0:Number(a)})}} /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${n=>this._stepNumInput(n,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${n=>this._stepNumInput(n,1)}>+</button></span></span>`)}
          ${this._row("Max value",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number"
              .value=${s.graph_max!=null?String(s.graph_max):""} placeholder="auto"
              @change=${n=>{const a=n.target.value;i({graph_max:a===""?void 0:Number(a)})}} /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${n=>this._stepNumInput(n,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${n=>this._stepNumInput(n,1)}>+</button></span></span>`)}
          ${this._row("Width (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="60"
              .value=${s.width!=null?String(s.width):""} placeholder="auto"
              @change=${n=>{const a=n.target.value;i({width:a===""?void 0:Number(a)})}} /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${n=>this._stepNumInput(n,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${n=>this._stepNumInput(n,1)}>+</button></span></span>`)}
          ${this._row("Height (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="40"
              .value=${s.height!=null?String(s.height):""} placeholder="auto"
              @change=${n=>{const a=n.target.value;i({height:a===""?void 0:Number(a)})}} /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${n=>this._stepNumInput(n,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${n=>this._stepNumInput(n,1)}>+</button></span></span>`)}
          ${["line","area","state-timeline"].includes(s.graph_type??"")?o`
            ${this._row("History (hours)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="1" max="8760"
                .value=${s.graph_hours!=null?String(s.graph_hours):""} placeholder="24"
                @change=${n=>{const a=n.target.value;i({graph_hours:a===""?void 0:Number(a)})}} /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${n=>this._stepNumInput(n,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${n=>this._stepNumInput(n,1)}>+</button></span></span>`)}
            ${this._row("Stroke width",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0.5" max="10" step="0.5"
                .value=${s.graph_stroke_width!=null?String(s.graph_stroke_width):""} placeholder="1.5"
                @change=${n=>{const a=n.target.value;i({graph_stroke_width:a===""?void 0:Number(a)})}} /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${n=>this._stepNumInput(n,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${n=>this._stepNumInput(n,1)}>+</button></span></span>`)}
            ${s.graph_type==="area"?this._row("Fill opacity",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0" max="1" step="0.05"
                .value=${s.graph_fill_opacity!=null?String(s.graph_fill_opacity):""} placeholder="0.2"
                @change=${n=>{const a=n.target.value;i({graph_fill_opacity:a===""?void 0:Number(a)})}} /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${n=>this._stepNumInput(n,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${n=>this._stepNumInput(n,1)}>+</button></span></span>`):m}
          `:m}
      </div>
    `}_extFieldSecGraphSeries(e,t,s){const i=n=>this._updateExtField(e,t,n);return o`
      <div class="ec-section">
          <div class="ec-subsection-title">Series — drag to reorder</div>
          ${(s.graph_series??[]).length===0?o`<p class="ec-empty">No series — click "+ Series".</p>`:(s.graph_series??[]).map((n,a)=>this._itemCard({dragKey:`egs:${e}:${t}:${a}`,icon:"mdi:chart-line",label:n.label||n.entity||`Series ${a+1}`,sub:n.entity?`Series ${a+1}`:"No entity selected",selected:a===this._selSeries,onClick:()=>{this._selSeries=a,this._navPush(`egs:${a}`,n.label||n.entity||`Series ${a+1}`)},actions:o`
                  <button class="ec-btn-remove" title="Remove series"
                    @click=${r=>{r.stopPropagation();const l=(s.graph_series??[]).filter((c,p)=>p!==a);i({graph_series:l.length?l:void 0})}}>✕</button>
                `}))}
          <button class="ec-btn-add" style="margin-top:6px;width:100%"
            @click=${()=>i({graph_series:[...s.graph_series??[],{}]})}>+ Series</button>
      </div>
    `}_extFieldSecGraphSeriesItem(e,t,s,i){const n=l=>this._updateExtField(e,t,l),a=`ext${e}-f${t}`,r=(s.graph_series??[])[i];return r?o`
      <div class="ec-section">
              ${this._row("Entity",o`<ha-entity-picker .hass=${this.hass} .value=${r.entity??""} allow-custom-entity
                  @value-changed=${l=>{const c=[...s.graph_series??[]];c[i]={...c[i],entity:l.detail.value||void 0},n({graph_series:c})}}></ha-entity-picker>`)}
               ${this._row("Value Label (Optional)",o`<input class="ec-input" type="text" .value=${r.label??""} placeholder="(from entity)"
                  @change=${l=>{const c=[...s.graph_series??[]];c[i]={...c[i],label:l.target.value||void 0},n({graph_series:c})}} />`)}
              ${this._row("Color",this._colorPicker(`${a}-s${i}-col`,r.color,l=>{const c=[...s.graph_series??[]];c[i]={...c[i],color:l},n({graph_series:c})},{clearTitle:"Reset to palette color"}))}
              ${this._row("Stat period",o`<select class="ec-select" .value=${r.stat_period??""}
                  @change=${l=>{const c=[...s.graph_series??[]];c[i]={...c[i],stat_period:l.target.value||void 0},n({graph_series:c})}}>
                  <option value="">Live state</option>
                  <optgroup label="Calendar">
                    <option value="today"      .selected=${r.stat_period==="today"}>Today</option>
                    <option value="yesterday"  .selected=${r.stat_period==="yesterday"}>Yesterday</option>
                    <option value="this_week"  .selected=${r.stat_period==="this_week"}>This week</option>
                    <option value="last_week"  .selected=${r.stat_period==="last_week"}>Last week</option>
                    <option value="this_month" .selected=${r.stat_period==="this_month"}>This month</option>
                    <option value="last_month" .selected=${r.stat_period==="last_month"}>Last month</option>
                    <option value="this_year"  .selected=${r.stat_period==="this_year"}>This year</option>
                    <option value="last_year"  .selected=${r.stat_period==="last_year"}>Last year</option>
                  </optgroup>
                  <optgroup label="Rolling window">
                    <option value="last_30_minutes" .selected=${r.stat_period==="last_30_minutes"}>Last 30 min</option>
                    <option value="last_hour"       .selected=${r.stat_period==="last_hour"}>Last hour</option>
                    <option value="last_n_minutes"  .selected=${r.stat_period==="last_n_minutes"}>Last N minutes</option>
                    <option value="last_n_hours"    .selected=${r.stat_period==="last_n_hours"}>Last N hours</option>
                    <option value="last_n_days"     .selected=${r.stat_period==="last_n_days"}>Last N days</option>
                    <option value="last_n_months"   .selected=${r.stat_period==="last_n_months"}>Last N months</option>
                  </optgroup>
                </select>`)}
              ${["last_n_minutes","last_n_hours","last_n_days","last_n_months"].includes(r.stat_period)?this._row(r.stat_period==="last_n_minutes"?"Number of minutes":r.stat_period==="last_n_hours"?"Number of hours":r.stat_period==="last_n_days"?"Number of days":"Number of months",o`<input type="number" class="ec-input" min="1" step="1"
                  .value=${String(r.stat_period_n??"")} placeholder="e.g. 3"
                  @change=${l=>{const c=parseInt(l.target.value,10),p=[...s.graph_series??[]];p[i]={...p[i],stat_period_n:isNaN(c)||c<1?void 0:c},n({graph_series:p})}} />`):m}
              ${r.stat_period?this._row("Stat type",o`<select class="ec-select" .value=${r.stat_type??_("stat_type")??"sum"}
                  @change=${l=>{const c=[...s.graph_series??[]];c[i]={...c[i],stat_type:l.target.value},n({graph_series:c})}}>
                  <option value="sum"        .selected=${(r.stat_type??_("stat_type")??"sum")==="sum"}>Sum (total)</option>
                  <option value="difference" .selected=${r.stat_type==="difference"}>Difference</option>
                  <option value="mean"       .selected=${r.stat_type==="mean"}>Mean</option>
                  <option value="max"        .selected=${r.stat_type==="max"}>Maximum</option>
                  <option value="min"        .selected=${r.stat_type==="min"}>Minimum</option>
                </select>`):m}
      </div>
    `:o``}_extFieldSecStats(e,t,s){const i=n=>this._updateExtField(e,t,n);return o`
      <div class="ec-section">
          <div class="ec-subsection-title">HA Statistics integration</div>
          ${this._row("Period",o`<select class="ec-select" .value=${s.stat_period??""}
              @change=${n=>{const a=n.target.value,r=["last_n_minutes","last_n_hours","last_n_days","last_n_months"].includes(a);i({stat_period:a||void 0,stat_period_n:r?s.stat_period_n??void 0:void 0,stat_period_start:a==="custom"?s.stat_period_start??void 0:void 0,stat_period_end:a==="custom"?s.stat_period_end??void 0:void 0})}}>
              <option value="">Live state (no stats)</option>
              <optgroup label="Calendar">
                <option value="today"      .selected=${s.stat_period==="today"}>Today</option>
                <option value="yesterday"  .selected=${s.stat_period==="yesterday"}>Yesterday</option>
                <option value="this_week"  .selected=${s.stat_period==="this_week"}>This week</option>
                <option value="last_week"  .selected=${s.stat_period==="last_week"}>Last week</option>
                <option value="this_month" .selected=${s.stat_period==="this_month"}>This month</option>
                <option value="last_month" .selected=${s.stat_period==="last_month"}>Last month</option>
                <option value="this_year"  .selected=${s.stat_period==="this_year"}>This year</option>
                <option value="last_year"  .selected=${s.stat_period==="last_year"}>Last year</option>
              </optgroup>
              <optgroup label="Rolling window">
                <option value="last_30_minutes" .selected=${s.stat_period==="last_30_minutes"}>Last 30 minutes</option>
                <option value="last_hour"        .selected=${s.stat_period==="last_hour"}>Last hour</option>
                <option value="last_n_minutes"   .selected=${s.stat_period==="last_n_minutes"}>Last N minutes</option>
                <option value="last_n_hours"     .selected=${s.stat_period==="last_n_hours"}>Last N hours</option>
                <option value="last_n_days"      .selected=${s.stat_period==="last_n_days"}>Last N days</option>
                <option value="last_n_months"    .selected=${s.stat_period==="last_n_months"}>Last N months</option>
              </optgroup>
              <optgroup label="Custom range">
                <option value="custom" .selected=${s.stat_period==="custom"}>Custom date/time range</option>
              </optgroup>
            </select>`)}
          ${["last_n_minutes","last_n_hours","last_n_days","last_n_months"].includes(s.stat_period)?this._row(s.stat_period==="last_n_minutes"?"Number of minutes":s.stat_period==="last_n_hours"?"Number of hours":s.stat_period==="last_n_days"?"Number of days":"Number of months",o`<input type="number" class="ec-input" min="1" step="1"
              .value=${String(s.stat_period_n??"")} placeholder="e.g. 3"
              @change=${n=>{const a=parseInt(n.target.value,10);i({stat_period_n:isNaN(a)||a<1?void 0:a})}} />`):m}
          ${s.stat_period==="custom"?o`
            ${this._row("Start",o`<input type="datetime-local" class="ec-input" .value=${s.stat_period_start??""}
              @change=${n=>i({stat_period_start:n.target.value||void 0})} />`)}
            ${this._row("End",o`<input type="datetime-local" class="ec-input" .value=${s.stat_period_end??""}
              @change=${n=>i({stat_period_end:n.target.value||void 0})} />`)}
          `:m}
          ${s.stat_period?this._row("Stat type",o`<select class="ec-select" .value=${s.stat_type??_("stat_type")??"sum"}
              @change=${n=>i({stat_type:n.target.value})}>
              <option value="sum"        .selected=${(s.stat_type??_("stat_type")??"sum")==="sum"}>Sum (total)</option>
              <option value="difference" .selected=${s.stat_type==="difference"}>Difference</option>
              <option value="mean"       .selected=${s.stat_type==="mean"}>Mean</option>
              <option value="max"        .selected=${s.stat_type==="max"}>Maximum</option>
              <option value="min"        .selected=${s.stat_type==="min"}>Minimum</option>
              <option value="count"      .selected=${s.stat_type==="count"}>Count</option>
              <option value="range"      .selected=${s.stat_type==="range"}>Range</option>
            </select>`):m}
      </div>
    `}_extFieldSecDisplay(e,t,s){const i=n=>this._updateExtField(e,t,n);return o`
      <div class="ec-section">
          <div class="ec-subsection-title">Display</div>
          ${this._row("Unit",o`<input class="ec-input" type="text" .value=${s.unit??""} placeholder="(from entity)"
              @change=${n=>i({unit:n.target.value})} />`)}
          ${this._row("Decimals",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0" max="6"
              .value=${s.decimals!=null?String(s.decimals):""} placeholder="auto"
              @change=${n=>{const a=n.target.value;i({decimals:a===""?void 0:Number(a)})}} /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${n=>this._stepNumInput(n,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${n=>this._stepNumInput(n,1)}>+</button></span></span>`)}
          ${this._row("Hide below",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0"
              .value=${s.hide_below!=null?String(s.hide_below):""} placeholder="(always show)"
              @change=${n=>{const a=n.target.value;i({hide_below:a===""?void 0:Number(a)})}} /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${n=>this._stepNumInput(n,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${n=>this._stepNumInput(n,1)}>+</button></span></span>`)}
          ${this._displayUnit(s.entity,s.unit)?o`<p class="ec-hint">Enter in ${this._displayUnit(s.entity,s.unit)}</p>`:m}
          ${s.entity?.startsWith("virtual:")&&!s.time_until_layout?.length?this._row("Show trigger label",o`<input type="checkbox" .checked=${s.show_time_until_label??!1}
              @change=${n=>i({show_time_until_label:n.target.checked||void 0})} />`):m}
      </div>
    `}_extFieldSecStyle(e,t,s){const i=a=>this._updateExtField(e,t,a),n=`ext${e}-f${t}`;return o`
      <div class="ec-section">
          ${this._row("Align",o`<select class="ec-select" .value=${s.align??_("align")??"left"}
              @change=${a=>i({align:a.target.value})}>
              ${ne.map(a=>o`<option value=${a} .selected=${(s.align??_("align")??"left")===a}>${a}</option>`)}
            </select>`)}
          ${this._row("Use global text style",o`<input type="checkbox" .checked=${s.style===void 0}
              @change=${a=>{a.target.checked?i({style:void 0}):i({style:{}})}} />`)}
          ${s.style!==void 0?o`
            <div class="ec-subsection-title">Style overrides</div>
            ${this._textRows(`${n}-st`,s.style,a=>i({style:{...s.style,...a}}))}
          `:m}
      </div>
    `}_extFieldSecActions(e,t,s){const i=n=>this._updateExtField(e,t,n);return o`
      <div class="ec-section">
          <div class="ec-subsection-title">Actions</div>
          ${this._actionRows({tap_action:s.tap_action,hold_action:s.hold_action,double_tap_action:s.double_tap_action},n=>i(n))}
      </div>
    `}_renderCanvasRibbonPanel(){const e=this._navPath;return e.length===0?this._canvasSectionMenu():this._canvasSection(e[0].key)}_canvasSectionMenu(){return o`
      ${this._navBtn("sec:mode","Placement Mode","Precision or Grid","mdi:grid")}
      ${this._navBtn("sec:size","Canvas Size","Base size, fit & extend","mdi:aspect-ratio")}
      ${this._navBtn("sec:box","Canvas Box","Canvas background & border","mdi:image-frame")}
      ${this._navBtn("sec:bg","Background","Source, images & EV count","mdi:image-multiple")}
    `}_canvasSection(e){switch(e){case"sec:mode":return this._canvasSecMode();case"sec:size":return this._canvasSecSize();case"sec:box":return this._canvasSecBox();case"sec:bg":return o`<div class="ec-section">${this._renderBackgroundControls()}</div>`;default:return o``}}_canvasSecMode(){const e=this._config?.canvas??{},t=e.layout_mode==="grid";return o`
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

          ${e.layout_mode==="grid"?o`
            ${this._row("Grid columns",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="1"
                .value=${String(e.grid?.columns??10)}
                @change=${s=>{const i=Math.max(1,Number(s.target.value)||1);this._updateCanvas({grid:{...e.grid??{columns:10,rows:15},columns:i}})}}
              /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>`)}

            ${this._row("Grid rows",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="1"
                .value=${String(e.grid?.rows??15)}
                @change=${s=>{const i=Math.max(1,Number(s.target.value)||1);this._updateCanvas({grid:{...e.grid??{columns:10,rows:15},rows:i}})}}
              /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>`)}

            ${this._row("Card padding (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0"
                .value=${String(e.grid?.padding??0)}
                @change=${s=>{const i=Math.max(0,Number(s.target.value)||0);this._updateCanvas({grid:{...e.grid??{columns:10,rows:15},padding:i}})}}
              /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>`)}
          `:m}
      </div>
    `}_canvasSecSize(){const e=this._config?.canvas??{};return o`
      <div class="ec-section">
          ${this._row("Width (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="1"
              .value=${e.width!=null?String(e.width):""}
              placeholder="image width"
              @change=${t=>{const s=t.target.value;this._updateCanvas({width:s===""?void 0:Number(s)})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}

          ${this._row("Height (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="1"
              .value=${e.height!=null?String(e.height):""}
              placeholder="from aspect"
              @change=${t=>{const s=t.target.value;this._updateCanvas({height:s===""?void 0:Number(s)})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}

          ${this._row("Fit",o`<select class="ec-select"
              .value=${e.fit??_("background_fit")??"cover"}
              @change=${t=>this._updateCanvas({fit:t.target.value})}
            >
              <option value="cover" .selected=${(e.fit??_("background_fit")??"cover")==="cover"}>cover</option>
              <option value="contain" .selected=${e.fit==="contain"}>contain</option>
            </select>`)}

          <div class="ec-subsection-title">Extend (px)</div>

          ${this._row("Top",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0"
              .value=${e.extend?.top!=null?String(e.extend.top):""}
              placeholder="0"
              @change=${t=>{const s=t.target.value;this._updateCanvas({extend:{...e.extend,top:s===""?void 0:Number(s)}})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}

          ${this._row("Right",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0"
              .value=${e.extend?.right!=null?String(e.extend.right):""}
              placeholder="0"
              @change=${t=>{const s=t.target.value;this._updateCanvas({extend:{...e.extend,right:s===""?void 0:Number(s)}})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}

          ${this._row("Bottom",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0"
              .value=${e.extend?.bottom!=null?String(e.extend.bottom):""}
              placeholder="0"
              @change=${t=>{const s=t.target.value;this._updateCanvas({extend:{...e.extend,bottom:s===""?void 0:Number(s)}})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}

          ${this._row("Left",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0"
              .value=${e.extend?.left!=null?String(e.extend.left):""}
              placeholder="0"
              @change=${t=>{const s=t.target.value;this._updateCanvas({extend:{...e.extend,left:s===""?void 0:Number(s)}})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}
      </div>
    `}_canvasSecBox(){const e=this._config?.canvas??{};return o`
      <div class="ec-section">
          ${this._boxRows("cv",e.box??{},t=>this._updateCanvas({box:{...e.box,...t}}))}
      </div>
    `}_renderBackgroundControls(){if(!this._config)return o``;const e=this._config.background??{},t=e.source??"auto";return o`
          <div class="ec-subsection-title">Background</div>

          ${this._row("Source",o`<select class="ec-select"
              .value=${t}
              @change=${s=>this._updateBackground({source:s.target.value})}
            >
              <option value="auto" .selected=${t==="auto"}>auto (sun)</option>
              <option value="day" .selected=${t==="day"}>day</option>
              <option value="night" .selected=${t==="night"}>night</option>
              <option value="entity" .selected=${t==="entity"}>entity</option>
            </select>`)}

          ${t==="auto"||t===void 0?this._row("Sun entity",o`<ha-entity-picker
                  .hass=${this.hass}
                  .value=${e.sun_entity??""}
                  allow-custom-entity
                  @value-changed=${s=>this._updateBackground({sun_entity:s.detail.value})}
                ></ha-entity-picker>`):m}

          ${t==="entity"?this._row("Mode entity",o`<ha-entity-picker
                  .hass=${this.hass}
                  .value=${e.mode_entity??""}
                  allow-custom-entity
                  @value-changed=${s=>this._updateBackground({mode_entity:s.detail.value})}
                ></ha-entity-picker>`):m}

          ${this._row("Background fit",o`<select class="ec-select"
              .value=${e.fit??_("background_fit")??"cover"}
              @change=${s=>this._updateBackground({fit:s.target.value})}
            >
              <option value="cover" .selected=${(e.fit??_("background_fit")??"cover")==="cover"}>cover</option>
              <option value="contain" .selected=${e.fit==="contain"}>contain</option>
            </select>`)}

          ${this._row("EV count",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0"
              .value=${this._config.ev_count!=null?String(this._config.ev_count):""}
              placeholder="0"
              @change=${s=>{const i=s.target.value;this._emit({...this._config,ev_count:i===""?void 0:Number(i)})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>`)}

          <div class="ec-subsection-title">Images</div>
          <p class="ec-hint">One Day and one Night image per EV variant — raising EV count adds rows.</p>

          ${(()=>{const s=Math.max(0,this._config?.ev_count??0),i=Array.from({length:s+1},(n,a)=>String(a));return["day","night"].map(n=>o`
              <div class="ec-subsection-title ec-subsection-title--minor">${n}</div>
              ${i.map(a=>this._row(`${n} / ${a} EV`,o`<input class="ec-input" type="text"
                  .value=${e.images?.[n]?.[a]??""}
                  placeholder="https://…"
                  @change=${r=>this._setBgImage(n,a,r.target.value)}
                />`))}
            `)})()}
    `}_renderTemplatesRibbonPanel(){const e=this._navPath;return e.length===0?o`
        ${this._navBtn("sec:export","Export Template","Save the current layout as a file","mdi:download")}
        ${this._navBtn("sec:import","Import Template","Load a saved layout file","mdi:upload")}
      `:e[0].key==="sec:import"?this._templatesSecImport():this._templatesSecExport()}_templatesSecExport(){return this._config?o`
      <div class="ec-section">
          ${this._row("Name",o`<input class="ec-input" type="text"
              .value=${this._templateName}
              placeholder="My Energy Dashboard"
              @input=${e=>{this._templateName=e.target.value}}
            />`)}
          <button class="ec-btn-add" style="width:100%;margin-bottom:12px;"
            @click=${()=>{if(!this._config)return;const e=dn(this._config,this._templateName||"Energy Canvas Template");hn(e)}}
          >⬇ Download template</button>
      </div>
    `:o``}_templatesSecImport(){return this._config?o`
      <div class="ec-section">
          <p style="font-size:12px;color:#4a8aaa;margin:0 0 8px;">
            Importing will replace the entire card configuration.
          </p>
          <input type="file" accept=".json,application/json"
            style="display:none"
            id="ec-template-import"
            @change=${e=>{const t=e.target.files?.[0];if(!t||!this._config)return;const s=new FileReader;s.onload=i=>{const n=i.target?.result,{template:a,error:r}=_n(n);if(r||!a){this._templateError=r??"Unknown error.";return}window.confirm(`Import "${a.name}"?

This will replace your entire card configuration.`)&&(this._templateError="",this._emit(mn(a,this._config.type)))},s.readAsText(t),e.target.value=""}}
          />
          <button class="ec-btn-add" style="width:100%;"
            @click=${()=>{this.shadowRoot?.querySelector("#ec-template-import")?.click()}}
          >⬆ Import from file</button>
          ${this._templateError?o`<p style="color:#f44;font-size:12px;margin:6px 0 0;">${this._templateError}</p>`:m}
      </div>
    `:o``}_renderVirtualsRibbonPanel(){const e=this._navPath,t=this._virtuals();if(e.length===0)return o`
        <div class="ec-section-header">
          <span></span>
          <div style="display:flex;gap:4px;">
            ${this._virtualClipboard?o`<button class="ec-btn-add" @click=${this._pasteVirtual} title="Paste virtual">⎘ Paste</button>`:m}
            <button class="ec-btn-add" @click=${this._addVirtual}>+ Virtual</button>
          </div>
        </div>
        ${t.length===0?o`<p class="ec-empty">No virtuals — click "+ Virtual" to add one.</p>`:t.map((a,r)=>this._itemCard({dragKey:`virt:${r}`,icon:a.op==="time_until"?"mdi:progress-clock":"mdi:memory",label:a.name||a.id,sub:S._VIRTUAL_OPS.find(l=>l.value===a.op)?.label??a.op,selected:r===this._selVirtual,onClick:()=>{this._selVirtual=r,this._navPush(`virt:${r}`,a.name||a.id)},actions:o`
                <button class="ec-btn-remove"
                  @click=${l=>{l.stopPropagation(),this._copyVirtual(r)}}
                  title="Copy">⎘</button>
                <button class="ec-btn-remove"
                  @click=${l=>{l.stopPropagation(),this._removeVirtual(r)}}
                  title="Remove">✕</button>
              `}))}
      `;const s=this._selVirtual,i=t[s];if(!i)return o``;if(e.length===1)return o`
        ${this._navBtn("sec:defaults","Virtual Defaults","Name, operation, unit","mdi:tune")}
        ${i.op==="time_until"?o`
          ${this._navBtn("sec:tu","Time Until Settings","Mode, entities, capacity, labels","mdi:progress-clock")}
          ${this._navBtn("sec:trig","Extra Triggers","Up to 2 labelled thresholds","mdi:flag-outline")}
        `:o`
          <div class="ec-subsection-title">Inputs (in order) — drag to reorder</div>
          ${i.inputs.length===0?o`<p class="ec-empty">No inputs — click "+ Input".</p>`:i.inputs.map((a,r)=>this._itemCard({dragKey:`vin:${s}:${r}`,icon:"mdi:import",label:a||`Input ${r+1}`,sub:a?`Input ${r+1}`:"No entity selected",selected:r===this._selVirtualInput,onClick:()=>{this._selVirtualInput=r,this._navPush(`vin:${r}`,a||`Input ${r+1}`)},actions:o`
                  <button class="ec-btn-remove"
                    @click=${l=>{l.stopPropagation(),this._removeVirtualInput(s,r)}}
                    title="Remove input">✕</button>
                `}))}
          <button class="ec-btn-add" style="margin-top:4px;"
            @click=${()=>this._addVirtualInput(s)}>+ Input</button>
        `}
      `;const n=e[1].key;return n.startsWith("vin:")?this._virtualSecInput(s,this._selVirtualInput):e.length===3&&n==="sec:trig"&&e[2].key.startsWith("trig:")?this._virtualSecTriggerItem(s,this._selTrigger):this._virtualSection(s,i,n)}_virtualSecInput(e,t){const s=this._virtuals()[e],i=s?.inputs[t];return!s||i===void 0?o``:o`
      <div class="ec-section">
          ${this._row("Entity",o`<ha-entity-picker
              .hass=${this.hass}
              .value=${i}
              allow-custom-entity
              @value-changed=${n=>this._updateVirtualInput(e,t,n.detail.value)}
            ></ha-entity-picker>`)}
      </div>
    `}_virtualSection(e,t,s){return s==="sec:defaults"?this._virtualSecDefaults(e,t):s==="sec:tu"?this._virtualSecTu(e,t):s==="sec:trig"?this._virtualSecTrig(e,t):o``}_virtualSecDefaults(e,t){return o`
      <div class="ec-section">
              ${this._row("Name",o`<input class="ec-input" type="text" .value=${t.name}
                  @change=${s=>this._updateVirtual(e,{name:s.target.value})}
                />`)}

              ${this._row("Operation",o`<select class="ec-select"
                  .value=${t.op}
                  @change=${s=>this._updateVirtual(e,{op:s.target.value})}
                >
                  ${S._VIRTUAL_OPS.map(s=>o`<option value=${s.value} .selected=${t.op===s.value}>${s.label}</option>`)}
                </select>`)}

              ${t.op!=="time_until"?this._row("Unit override",o`<input class="ec-input" type="text" .value=${t.unit??""}
                  placeholder="(from inputs[0])"
                  @change=${s=>{const i=s.target.value;this._updateVirtual(e,{unit:i||void 0})}}
                />`):m}
      </div>
    `}_virtualSecTu(e,t){return o`
      <div class="ec-section">
                ${this._row("Mode",o`<select class="ec-select"
                    .value=${t.mode??_("virtual_mode")??"percent"}
                    @change=${s=>this._updateVirtual(e,{mode:s.target.value})}
                  >
                    <option value="percent"  .selected=${(t.mode??_("virtual_mode")??"percent")==="percent"}>% based</option>
                    <option value="absolute" .selected=${t.mode==="absolute"}>Absolute value</option>
                  </select>`)}

                ${this._row((t.mode??_("virtual_mode")??"percent")==="percent"?"% entity":"Current value entity",o`<ha-entity-picker
                    .hass=${this.hass}
                    .value=${t.value_entity??t.pct_entity??""}
                    allow-custom-entity
                    @value-changed=${s=>this._updateVirtual(e,{value_entity:s.detail.value||void 0})}
                  ></ha-entity-picker>`)}

                ${this._row("Rate entity",o`<ha-entity-picker
                    .hass=${this.hass}
                    .value=${t.rate_entity??t.power_entity??""}
                    allow-custom-entity
                    @value-changed=${s=>this._updateVirtual(e,{rate_entity:s.detail.value||void 0})}
                  ></ha-entity-picker>`)}

                ${this._row("Rate unit override",o`<input class="ec-input" type="text"
                    .value=${t.rate_unit_override??""}
                    placeholder="auto-detect from entity"
                    @change=${s=>{const i=s.target.value;this._updateVirtual(e,{rate_unit_override:i||void 0})}}
                  />`)}
                <p class="ec-hint">Auto-detected from the rate entity; only set this if auto-detection fails.</p>

                ${this._row("Recalc above (rate)",o`<input class="ec-input" type="number" step="any"
                    .value=${t.recalc_above!=null?String(t.recalc_above):""}
                    placeholder="e.g. 100"
                    @change=${s=>{const i=parseFloat(s.target.value);this._updateVirtual(e,{recalc_above:Number.isFinite(i)?i:void 0})}}
                  />`)}

                ${this._row("Recalc below (rate)",o`<input class="ec-input" type="number" step="any"
                    .value=${t.recalc_below!=null?String(t.recalc_below):""}
                    placeholder="e.g. -160"
                    @change=${s=>{const i=parseFloat(s.target.value);this._updateVirtual(e,{recalc_below:Number.isFinite(i)?i:void 0})}}
                  />`)}
                <p class="ec-hint">Only recompute Time Until when the raw rate reading is above and/or below these (signed, in the rate entity's units). Inside the band the last value is frozen. Leave blank to always recalculate.</p>

                ${this._row("Capacity entity",o`<ha-entity-picker
                    .hass=${this.hass}
                    .value=${t.capacity_entity??""}
                    allow-custom-entity
                    @value-changed=${s=>this._updateVirtual(e,{capacity_entity:s.detail.value||void 0})}
                  ></ha-entity-picker>`)}

                ${this._row(((t.mode??_("virtual_mode")??"percent")==="percent","Capacity (Manual)"),o`<input class="ec-input" type="number" min="0" step="0.1"
                    .value=${String(t.capacity??t.capacity_kwh??"")}
                    placeholder="e.g. 13.5"
                    @change=${s=>{const i=parseFloat(s.target.value);this._updateVirtual(e,{capacity:Number.isFinite(i)?i:void 0})}}
                  />`)}

                ${this._row("Maximum label",o`<input class="ec-input" type="text"
                    .value=${t.label_max??t.label_full??""}
                    placeholder="Full"
                    @change=${s=>{const i=s.target.value;this._updateVirtual(e,{label_max:i||void 0})}}
                  />`)}

                ${this._row("Minimum label",o`<input class="ec-input" type="text"
                    .value=${t.label_min??t.label_empty??""}
                    placeholder="Empty"
                    @change=${s=>{const i=s.target.value;this._updateVirtual(e,{label_min:i||void 0})}}
                  />`)}
      </div>
    `}_virtualSecTrig(e,t){return o`
      ${(t.triggers??[]).length===0?o`<p class="ec-empty">No extra triggers — click "+ Trigger".</p>`:(t.triggers??[]).map((s,i)=>this._itemCard({dragKey:`trig:${e}:${i}`,icon:"mdi:flag-outline",label:s.label||`Trigger ${i+1}`,sub:`${s.percent??s.value}${(t.mode??_("virtual_mode")??"percent")==="percent"?"%":""}`,selected:i===this._selTrigger,onClick:()=>{this._selTrigger=i,this._navPush(`trig:${i}`,s.label||`Trigger ${i+1}`)},actions:o`
              <button class="ec-btn-remove" title="Remove trigger"
                @click=${n=>{n.stopPropagation();const a=(t.triggers??[]).filter((r,l)=>l!==i);this._updateVirtual(e,{triggers:a.length?a:void 0})}}>✕</button>
            `}))}
      ${(t.triggers??[]).length<2?o`
        <button class="ec-btn-add" style="margin-top:6px"
          @click=${()=>{const s=[...t.triggers??[],{value:20,label:"Reserve"}];this._updateVirtual(e,{triggers:s})}}>+ Trigger</button>
      `:m}
      <p class="ec-hint" style="margin-top:10px">Auto-switches to the nearest trigger ahead in the current direction.</p>
    `}_virtualSecTriggerItem(e,t){const s=this._virtuals()[e],i=s?.triggers?.[t];return!s||!i?o``:o`
      <div class="ec-section">
          ${this._row((s.mode??_("virtual_mode")??"percent")==="percent"?"Percent":"Value",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number"
              step="${(s.mode??_("virtual_mode")??"percent")==="percent"?"1":"any"}"
              .value=${String(i.percent??i.value)}
              @change=${n=>{const a=parseFloat(n.target.value),r=[...s.triggers??[]];r[t]={...r[t],value:Number.isFinite(a)?a:i.value},this._updateVirtual(e,{triggers:r})}}
            /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${n=>this._stepNumInput(n,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${n=>this._stepNumInput(n,1)}>+</button></span></span>`)}
          ${this._row("Label",o`<input class="ec-input" type="text" .value=${i.label}
              placeholder="Label"
              @change=${n=>{const a=[...s.triggers??[]];a[t]={...a[t],label:n.target.value},this._updateVirtual(e,{triggers:a})}}
            />`)}
      </div>
    `}_renderZonesRibbonPanel(){const e=this._navPath,t=this._zones();if(e.length===0)return o`
        <p style="font-size:12px;color:#4a8aaa;margin:0 0 8px;">
          Invisible hotspot regions that trigger actions when tapped. Drag the dashed handles in the preview to reposition.
        </p>
        <div class="ec-section-header">
          <span></span>
          <button class="ec-btn-add" @click=${this._addZone}>+ Clickable Zone</button>
        </div>
        ${t.length===0?o`<p class="ec-empty">No clickable zones — click "+ Clickable Zone" to add one.</p>`:t.map((n,a)=>this._itemCard({dragKey:`zone:${a}`,icon:"mdi:gesture-tap-box",label:n.name??n.id,sub:`${n.width}×${n.height}px`,selected:a===this._selZone,onClick:()=>{this._selZone=a,this._navPush(`zone:${a}`,n.name??n.id)},actions:o`
                <button class="ec-btn-remove"
                  @click=${r=>{r.stopPropagation(),this._removeZone(a)}}
                  title="Remove">✕</button>
              `}))}
      `;const s=this._selZone,i=t[s];return i?e.length===1?o`
        ${this._navBtn("sec:defaults","Zone Defaults","Name, position, anchor, size, overlay","mdi:tune")}
        ${this._navBtn("sec:actions","Actions","Tap · hold · double tap","mdi:gesture-tap")}
      `:e[1].key==="sec:actions"?this._zoneSecActions(s,i):this._zoneSecDefaults(s,i):o``}_zoneSecDefaults(e,t){return o`
      <div class="ec-section">
              ${this._row("Name",o`<input class="ec-input" type="text" .value=${t.name??""}
                  @change=${s=>this._updateZone(e,{name:s.target.value||void 0})}
                />`)}

              ${this._row("X (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number"
                  .value=${String(t.position.x)}
                  @change=${s=>this._updateZone(e,{position:{...t.position,x:Number(s.target.value)}})}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>`)}

              ${this._row("Y (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number"
                  .value=${String(t.position.y)}
                  @change=${s=>this._updateZone(e,{position:{...t.position,y:Number(s.target.value)}})}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>`)}

              ${this._row("Anchor",o`<select class="ec-select"
                  .value=${t.anchor??_("anchor")??"top-left"}
                  @change=${s=>this._updateZone(e,{anchor:s.target.value})}
                >
                  ${Se.map(s=>o`<option value=${s} .selected=${(t.anchor??_("anchor")??"top-left")===s}>${s}</option>`)}
                </select>`)}

              ${this._row("Width (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="1"
                  .value=${String(t.width)}
                  @change=${s=>this._updateZone(e,{width:Math.max(1,Number(s.target.value))})}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>`)}

              ${this._row("Height (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="1"
                  .value=${String(t.height)}
                  @change=${s=>this._updateZone(e,{height:Math.max(1,Number(s.target.value))})}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>`)}

              ${this._row("Overlay color",o`<div class="ec-color-row">
                  <input class="ec-input" type="text" .value=${t.color??""}
                    placeholder="rgba(0,212,255,0.15)"
                    style="flex:1"
                    @change=${s=>{const i=s.target.value;this._updateZone(e,{color:i||void 0})}}
                  />
                  <button class="ec-btn-clear" @click=${()=>this._updateZone(e,{color:void 0})} title="Clear">✕</button>
                </div>`)}

              ${this._row("Radius (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0"
                  .value=${t.radius!=null?String(t.radius):""}
                  placeholder="0"
                  @change=${s=>{const i=s.target.value;this._updateZone(e,{radius:i===""?void 0:Number(i)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>`)}
      </div>
    `}_zoneSecActions(e,t){return o`
      <div class="ec-section">
        ${this._actionRows({tap_action:t.tap_action,hold_action:t.hold_action,double_tap_action:t.double_tap_action},s=>this._updateZone(e,s))}
      </div>
    `}_renderFlowsRibbonPanel(){const e=this._navPath,t=this._flows();if(e.length===0)return o`
        <div class="ec-section-header">
          <span></span>
          <button class="ec-btn-add" @click=${this._addFlow}>+ Flow Line</button>
        </div>
        ${t.length===0?o`<p class="ec-empty">No animated flow lines — click "+ Flow Line" to add one.</p>`:t.map((n,a)=>this._itemCard({dragKey:`flow:${a}`,icon:"mdi:chart-timeline-variant",label:n.name??n.id,sub:`${n.style??"dashes"}${n.entity?" · "+(n.entity.startsWith("virtual:")?this._virtuals().find(r=>`virtual:${r.id}`===n.entity)?.name??n.entity:n.entity):""}`,selected:a===this._selFlow,onClick:()=>{this._selFlow=a,this._selPoint=-1,this._navPush(`flow:${a}`,n.name??n.id)},actions:o`
                <button class="ec-btn-remove"
                  @click=${r=>{r.stopPropagation(),this._removeFlow(a)}}
                  title="Remove flow">✕</button>
              `}))}
      `;const s=t[this._selFlow];if(!s)return o``;if(e.length===1)return o`
        ${this._navBtn("sec:defaults","Flow Defaults","Name, entity, min display power, invert","mdi:tune")}
        ${this._navBtn("sec:speed","Speed","Slowest / fastest value → animation speed","mdi:speedometer")}
        ${this._navBtn("sec:style","Line Style","Style, colours, width, curve","mdi:brush-variant")}
        ${this._renderFlowPoints(s)}
      `;const i=e[1].key;if(i.startsWith("pt:"))return this._flowSecPoint(this._selFlow,this._selPoint);switch(i){case"sec:speed":return this._flowSecSpeed(s);case"sec:style":return this._flowSecStyle(s);default:return this._flowSecDefaults(s)}}_flowSecDefaults(e){return o`
      <div class="ec-section">
              ${this._row("Name",o`<input class="ec-input" type="text" .value=${e.name??""}
                  @change=${t=>this._updateFlow(this._selFlow,{name:t.target.value})}
                />`)}

              ${this._row("Entity",e.entity?.startsWith("virtual:")?o`<div style="display:flex;gap:4px;align-items:center;">
                      <span class="ec-input" style="flex:1;opacity:0.8;">
                        ${this._virtuals().find(t=>`virtual:${t.id}`===e.entity)?.name??e.entity}
                      </span>
                      <button class="ec-btn-clear"
                        @click=${()=>this._updateFlow(this._selFlow,{entity:void 0})}
                        title="Switch to real entity">✕</button>
                    </div>`:o`<ha-entity-picker
                      .hass=${this.hass}
                      .value=${e.entity??""}
                      allow-custom-entity
                      @value-changed=${t=>this._updateFlow(this._selFlow,{entity:t.detail.value})}
                    ></ha-entity-picker>`)}
              ${!e.entity?.startsWith("virtual:")&&this._virtuals().length>0?this._row("Virtual Entity",o`<select class="ec-select"
                  .value=${""}
                  @change=${t=>{const s=t.target.value;s&&this._updateFlow(this._selFlow,{entity:s}),t.target.value=""}}
                >
                  <option value="">(pick a virtual)</option>
                  ${this._virtuals().map(t=>o`<option value=${"virtual:"+t.id}>${t.name}</option>`)}
                </select>`):m}

              ${this._row(`Min display power (${this._config?.defaults?.power_unit??"W"})`,o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0" step="1"
                  .value=${e.min_power!=null?String(e.min_power):""}
                  placeholder="e.g. 5"
                  title="Hide flow when entity value is below this threshold — in your global power unit"
                  @change=${t=>{const s=t.target.value;this._updateFlow(this._selFlow,{min_power:s===""?void 0:Number(s)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}

              ${this._row("Invert direction",o`<input type="checkbox"
                  .checked=${e.invert??!1}
                  @change=${t=>{const s=t.target.checked;this._updateFlow(this._selFlow,{invert:s||void 0})}}
                />`)}
      </div>
    `}_flowSecSpeed(e){const t=e.speed_min_duration??_("flow_speed_min_duration")??5,s=e.speed_max_duration??_("flow_speed_max_duration")??1;return o`
      <div class="ec-section">
              ${this._row(`Slowest animation value (${this._config?.defaults?.power_unit??"W"})`,o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0"
                  .value=${e.speed_min_value!=null?String(e.speed_min_value):""}
                  placeholder="e.g. 100"
                  title="Entity value at which animation is slowest"
                  @change=${i=>{const n=i.target.value;this._updateFlow(this._selFlow,{speed_min_value:n===""?void 0:Number(n)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}

              ${this._row(`Fastest animation value (${this._config?.defaults?.power_unit??"W"})`,o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0"
                  .value=${e.speed_max_value!=null?String(e.speed_max_value):""}
                  placeholder="e.g. 5000"
                  title="Entity value at which animation is fastest"
                  @change=${i=>{const n=i.target.value;this._updateFlow(this._selFlow,{speed_max_value:n===""?void 0:Number(n)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}

              ${this._row("Speed",o`<div class="ec-dual-range">
                  <span class="ec-dual-range-label">Slowest</span>
                  <div class="ec-dual-range-track">
                    <input type="range" min="0.5" max="10" step="0.5"
                      .value=${String(t)}
                      style="direction:rtl"
                      @input=${i=>{const n=Number(i.target.value),a=e.speed_max_duration??_("flow_speed_max_duration")??1;this._updateFlow(this._selFlow,{speed_min_duration:Math.max(n,a)})}}
                    />
                    <input type="range" min="0.5" max="10" step="0.5"
                      .value=${String(s)}
                      style="direction:rtl"
                      @input=${i=>{const n=Number(i.target.value),a=e.speed_min_duration??_("flow_speed_min_duration")??5;this._updateFlow(this._selFlow,{speed_max_duration:Math.min(n,a)})}}
                    />
                  </div>
                  <span class="ec-dual-range-label">Fastest</span>
                </div>`)}

              ${this._row("Duration (s)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="0.1" step="0.1"
                  .value=${e.duration!=null?String(e.duration):""}
                  placeholder="2"
                  @change=${i=>{const n=i.target.value;this._updateFlow(this._selFlow,{duration:n===""?void 0:Number(n)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${i=>this._stepNumInput(i,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${i=>this._stepNumInput(i,1)}>+</button></span></span>`)}
      </div>
    `}_flowSecStyle(e){return o`
      <div class="ec-section">
              ${this._row("Style",o`<select class="ec-select"
                  .value=${e.style??_("flow_style")??"dashes"}
                  @change=${t=>this._updateFlow(this._selFlow,{style:t.target.value})}
                >
                  ${S._FLOW_STYLES.map(t=>o`<option value=${t} .selected=${(e.style??_("flow_style")??"dashes")===t}>${t}</option>`)}
                </select>`)}

              ${this._row("Forward color",this._colorPicker(`flow-${this._selFlow}-fwd`,e.forward_color??e.color,t=>this._updateFlow(this._selFlow,{forward_color:t})))}

              ${this._row("Reverse color",this._colorPicker(`flow-${this._selFlow}-rev`,e.reverse_color,t=>this._updateFlow(this._selFlow,{reverse_color:t})))}

              ${this._row("Width (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="1"
                  .value=${e.width!=null?String(e.width):""}
                  placeholder="3"
                  @change=${t=>{const s=t.target.value;this._updateFlow(this._selFlow,{width:s===""?void 0:Number(s)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}

              ${this._row("Particle count",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="1"
                  .value=${e.particle_count!=null?String(e.particle_count):""}
                  placeholder="6"
                  @change=${t=>{const s=t.target.value;this._updateFlow(this._selFlow,{particle_count:s===""?void 0:Number(s)})}}
                /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${t=>this._stepNumInput(t,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${t=>this._stepNumInput(t,1)}>+</button></span></span>`)}

              ${this._row("Curve",o`<select class="ec-select"
                  .value=${e.curve??_("flow_curve")??"straight"}
                  @change=${t=>this._updateFlow(this._selFlow,{curve:t.target.value})}
                >
                  <option value="straight" .selected=${(e.curve??_("flow_curve")??"straight")==="straight"}>straight</option>
                  <option value="rounded" .selected=${e.curve==="rounded"}>rounded</option>
                </select>`)}
      </div>
    `}_pointLabel(e,t){if(e.card!=null){const s=this._config?.cards.find(i=>i.id===e.card);return{label:`Point ${t+1}`,sub:`Card · ${s?.name??e.card} · ${e.side??"center"}`}}return{label:`Point ${t+1}`,sub:`Free · ${e.x??0}, ${e.y??0}`}}_renderFlowPoints(e){return o`
      <div class="ec-subsection-title">Points — drag to reorder</div>
      ${e.points.length===0?o`<p class="ec-empty">No points — click "+ Point".</p>`:e.points.map((t,s)=>{const{label:i,sub:n}=this._pointLabel(t,s);return this._itemCard({dragKey:`pt:${this._selFlow}:${s}`,icon:t.card!=null?"mdi:radio-button-on":"mdi:radio-button-off",label:i,sub:n,selected:s===this._selPoint,onClick:()=>{this._selPoint=s,this._navPush(`pt:${s}`,`Point ${s+1}`)},actions:o`
                <button class="ec-btn-remove"
                  @click=${a=>{a.stopPropagation(),this._removeFlowPoint(this._selFlow,s)}}
                  title="Remove">✕</button>
              `})})}
      <button class="ec-btn-add" style="margin-top:4px;"
        @click=${()=>this._addFlowPoint(this._selFlow)}>+ Point</button>
    `}_flowSecPoint(e,t){const s=this._flows()[e],i=s?.points[t];if(!s||!i)return o``;const n=i.card!=null?"card":"free";return o`
      <div class="ec-section">
                    ${this._row("Kind",o`<select class="ec-select"
                        .value=${n}
                        @change=${a=>this._setPointKind(e,t,a.target.value)}
                      >
                        <option value="free" .selected=${n==="free"}>Free (x/y)</option>
                        <option value="card" .selected=${n==="card"}>Card</option>
                      </select>`)}

                    ${n==="card"?o`
                      ${this._row("Card",o`<select class="ec-select"
                          .value=${i.card??""}
                          @change=${a=>this._updateFlowPoint(e,t,{card:a.target.value})}
                        >
                          ${this._config.cards.map(a=>o`
                            <option value=${a.id} .selected=${i.card===a.id}>${a.name??a.id}</option>
                          `)}
                        </select>`)}

                      ${this._row("Side",o`<select class="ec-select"
                          .value=${i.side??"center"}
                          @change=${a=>this._updateFlowPoint(e,t,{side:a.target.value})}
                        >
                          ${S._FLOW_SIDES.map(a=>o`<option value=${a} .selected=${(i.side??"center")===a}>${a}</option>`)}
                        </select>`)}
                    `:o`
                      ${this._row("X",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number"
                          .value=${String(i.x??0)}
                          @change=${a=>this._updateFlowPoint(e,t,{x:Number(a.target.value)})}
                        /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${a=>this._stepNumInput(a,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${a=>this._stepNumInput(a,1)}>+</button></span></span>`)}

                      ${this._row("Y",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number"
                          .value=${String(i.y??0)}
                          @change=${a=>this._updateFlowPoint(e,t,{y:Number(a.target.value)})}
                        /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${a=>this._stepNumInput(a,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${a=>this._stepNumInput(a,1)}>+</button></span></span>`)}
                    `}
      </div>
    `}_actionRows(e,t){const s=(i,n)=>{const a=e[i],r=a?.action??"none";return o`
        ${this._row(n,o`<select class="ec-select"
          .value=${r}
          @change=${l=>{const c=l.target.value;t(c==="none"?{[i]:void 0}:{[i]:{...a??{},action:c}})}}
        >
          <option value="none"           .selected=${r==="none"}>None</option>
          <option value="expand-card"   .selected=${r==="expand-card"}>Expand Card</option>
          <option value="open-extended" .selected=${r==="open-extended"}>Open Popover</option>
          <option value="more-info"     .selected=${r==="more-info"}>More Info</option>
          <option value="toggle"        .selected=${r==="toggle"}>Toggle</option>
          <option value="navigate"      .selected=${r==="navigate"}>Navigate</option>
          <option value="url"           .selected=${r==="url"}>Url</option>
          <option value="call-service"  .selected=${r==="call-service"}>Call-service</option>
          <option value="assist"        .selected=${r==="assist"}>Assist</option>
          <option value="fire-dom-event" .selected=${r==="fire-dom-event"}>Fire Dom Event</option>
        </select>`)}
        ${(r==="more-info"||r==="toggle")&&a?this._row("Entity",o`<ha-entity-picker
                .hass=${this.hass}
                .value=${a.entity??""}
                allow-custom-entity
                @value-changed=${l=>t({[i]:{...a,entity:l.detail.value||void 0}})}
              ></ha-entity-picker>`):m}
        ${r==="navigate"&&a?this._row("Path",o`<input class="ec-input" type="text" .value=${a.navigation_path??""}
                placeholder="/lovelace/0"
                @change=${l=>t({[i]:{...a,navigation_path:l.target.value}})}
              />`):m}
        ${r==="url"&&a?this._row("URL",o`<input class="ec-input" type="text" .value=${a.url_path??""}
                placeholder="https://…"
                @change=${l=>t({[i]:{...a,url_path:l.target.value}})}
              />`):m}
        ${r==="call-service"&&a?this._row("Service",o`<input class="ec-input" type="text" .value=${a.service??""}
                placeholder="domain.service"
                @change=${l=>t({[i]:{...a,service:l.target.value}})}
              />`):m}
        ${r==="open-extended"&&a?this._row("Popover card",o`<select class="ec-select"
                .value=${a.extended_card_id??""}
                @change=${l=>t({[i]:{...a,extended_card_id:l.target.value||void 0}})}
              >
                <option value="">(select)</option>
                ${(this._config?.extended_cards??[]).map(l=>o`
                  <option value=${l.id} .selected=${a.extended_card_id===l.id}>${l.name??l.id}</option>
                `)}
              </select>`):m}
      `};return o`
      ${s("tap_action","Tap")}
      ${s("hold_action","Hold")}
      ${s("double_tap_action","Double tap")}
    `}_openGGPicker(e,t,s=!1){this._ggTarget={ci:e,fi:t,isExtended:s},this._ggOpen=!0}_pickGG(e,t){if(!this._ggTarget)return;const{ci:s,fi:i,isExtended:n}=this._ggTarget,a={type:e,...t};n?this._updateExtField(s,i,a):this._updateField(s,i,a),this._ggOpen=!1,this._ggTarget=null}_renderEmbeddedPanel(){const e=this._navPath,t=this._embCards();if(e.length===0)return o`
        <p style="font-size:12px;color:#4a8aaa;margin:0 0 8px;">
          Embed any HA Lovelace card as a positioned canvas element. Drag the ◈ handles in the preview to reposition.
        </p>
        <div class="ec-section-header">
          <span></span>
          <button class="ec-btn-add" @click=${this._addEmbCard}>+ Embedded External Card</button>
        </div>
        ${t.length===0?o`<p class="ec-empty">No embedded external cards — click "+ Embedded External Card" to add one.</p>`:t.map((n,a)=>this._itemCard({dragKey:`emb:${a}`,icon:"mdi:widgets",label:n.name??n.id,sub:n.card_config?.type??"No card type set",selected:a===this._selEmbCard,onClick:()=>{this._selEmbCard=a,this._navPush(`emb:${a}`,n.name??n.id)},actions:o`
                <button class="ec-btn-remove"
                  @click=${r=>{r.stopPropagation(),this._removeEmbCard(a)}}
                  title="Remove">✕</button>
              `}))}
      `;const s=this._selEmbCard,i=t[s];if(!i)return o``;if(e.length===1)return o`
        ${this._navBtn("sec:config","Card Config","Pick card type & edit config","mdi:widgets")}
        ${this._navBtn("sec:pos","Position & Size","Anchor, width, span, height","mdi:arrow-expand-all")}
        ${this._navBtn("sec:appear","Appearance","Transparent background","mdi:palette")}
      `;switch(e[1].key){case"sec:pos":return this._embSecPos(s,i);case"sec:appear":return this._embSecAppear(s,i);default:return this._embSecConfig(s,i)}}_embSecConfig(e,t){return o`
      <div class="ec-section">
        ${this._row("Name",o`<input class="ec-input" type="text" .value=${t.name??""}
            @change=${s=>this._updateEmbCard(e,{name:s.target.value||void 0})}
          />`)}

        ${this._row("Card Type",o`<div style="display:flex;gap:6px;align-items:center;min-width:0;">
            <span style="flex:1;min-width:0;font-family:monospace;font-size:12px;color:#5aadcc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
              ${t.card_config?.type?String(t.card_config.type):o`<span style="color:#555;font-style:italic;">not set</span>`}
            </span>
            <button class="ec-btn-add" style="white-space:nowrap;padding:2px 8px;font-size:11px;"
              @click=${()=>this._openEmbPicker(e)}>Change…</button>
          </div>`)}

        <div style="margin-top:8px;display:flex;gap:6px;">
          <button class="ec-btn-add" style="flex:1;" @click=${()=>this._openEmbPicker(e)}>
            ${t.card_config?.type?"Change Type":"Pick Card Type"}
          </button>
          <button class="ec-btn-add" style="flex:1;" @click=${()=>void this._openEmbEditor(e)}>
            Edit Config…
          </button>
        </div>
      </div>
    `}_embSecPos(e,t){return o`
      <div class="ec-section">
        ${this._gridGeom()?m:this._row("Anchor",o`<select class="ec-select"
            .value=${t.anchor??_("anchor")??"top-left"}
            @change=${s=>this._updateEmbCard(e,{anchor:s.target.value})}
          >
            ${Se.map(s=>o`<option value=${s} .selected=${(t.anchor??_("anchor")??"top-left")===s}>${s}</option>`)}
          </select>`)}

        ${this._gridGeom()?this._row("Columns (span)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="1" max=${this._gridGeom().cols}
            .value=${String(t.grid_span??1)}
            @change=${s=>{const i=this._gridGeom();if(!i)return;const n=Math.max(1,Math.min(i.cols,Number(s.target.value)||1)),a=Math.max(8,n*i.cellW-i.padding);this._updateEmbCard(e,{grid_span:n,width:a})}}
          /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>`):m}

        ${this._row("Width (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="20"
            .value=${String(t.width)}
            @change=${s=>this._updateEmbCard(e,{width:Number(s.target.value)})}
          /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>`)}

        ${this._row("Height (px)",o`<span class="ec-num-wrap"><input class="ec-input ec-input-num" type="number" min="20"
            .value=${t.height!=null?String(t.height):""}
            placeholder="auto"
            @change=${s=>{const i=s.target.value;this._updateEmbCard(e,{height:i===""?void 0:Number(i)})}}
          /><span class="ec-num-steppers"><button type="button" class="ec-num-step" tabindex="-1" title="Decrease" @click=${s=>this._stepNumInput(s,-1)}>−</button><button type="button" class="ec-num-step" tabindex="-1" title="Increase" @click=${s=>this._stepNumInput(s,1)}>+</button></span></span>`)}
      </div>
    `}_embSecAppear(e,t){return o`
      <div class="ec-section">
        ${this._row("Transparent",o`<input type="checkbox" .checked=${t.transparent??!1}
            @change=${s=>this._updateEmbCard(e,{transparent:s.target.checked})}
          />`)}
      </div>
    `}_renderEmbEditorModal(){if(!this._embEditorOpen)return m;const e=!!this._embNativeEditor,t=this._embCards()[this._embEditorIdx],s=t?String(t.card_config?.type??""):"";return o`
      <div class="ec-lib-backdrop" @click=${this._closeEmbEditor}></div>
      <div class="ec-lib-modal" style="width:min(580px,94vw);">
        <div class="ec-lib-header">
          <span class="ec-lib-title">${s||"Embedded Card"} — Config</span>
          <div style="display:flex;align-items:center;gap:8px;">
            ${e?o`
              <button class="ec-btn-clear" style="font-size:11px;padding:3px 10px;border-radius:4px;"
                @click=${()=>{this._embNativeEditor=null}}>
                Use JSON
              </button>`:m}
            <button class="ec-btn-clear" @click=${this._closeEmbEditor}>✕</button>
          </div>
        </div>

        ${e?o`
          <div id="emb-native-slot"
            style="padding:12px 16px;max-height:62vh;overflow-y:auto;box-sizing:border-box;"
            @config-changed=${i=>i.stopPropagation()}
          ></div>
          <div style="display:flex;justify-content:flex-end;padding:0 16px 14px;">
            <button class="ec-btn-add" style="padding:6px 18px;" @click=${this._closeEmbEditor}>Done</button>
          </div>
        `:o`
          <div style="padding:12px 16px;">
            <p style="font-size:12px;color:#888;margin:0 0 8px;">
              JSON object — <code style="color:#5aadcc">"type"</code> plus card-specific properties.
              ${!e&&s?o`<span style="color:#c87aff;"> (no visual editor available for this card type)</span>`:m}
            </p>
            <textarea
              style="width:100%;box-sizing:border-box;min-height:220px;font-family:monospace;font-size:13px;background:#060e18;color:#c8d8e8;border:1px solid rgba(0,212,255,0.25);border-radius:6px;padding:10px;resize:vertical;outline:none;"
              .value=${this._embEditorYaml}
              @input=${i=>{this._embEditorYaml=i.target.value}}
              spellcheck="false"
            ></textarea>
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-end;padding:0 16px 14px;">
            <button class="ec-btn-clear" style="padding:6px 14px;border-radius:5px;" @click=${this._closeEmbEditor}>Cancel</button>
            <button class="ec-btn-add" style="padding:6px 16px;" @click=${this._saveEmbEditorYaml}>Save</button>
          </div>
        `}
      </div>
    `}_renderEmbPickerModal(){if(!this._embPickerOpen)return m;const e=window.customCards??[],t=fn.map(c=>({...c,source:"Built-in"})),s=e.map(c=>({type:c.type.startsWith("custom:")?c.type:`custom:${c.type}`,name:c.name??c.type,description:c.description,source:"Custom"})),i=new Set(t.map(c=>c.type)),n=[...t,...s.filter(c=>!i.has(c.type))],a=this._embPickerSearch.trim().toLowerCase(),r=a?n.filter(c=>c.name.toLowerCase().includes(a)||c.type.toLowerCase().includes(a)):n,l=n.some(c=>c.type===a||c.name.toLowerCase()===a);return o`
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
          ${r.map(c=>o`
            <div class="ec-list-row" style="cursor:pointer;padding:8px 10px;"
              @click=${()=>void this._pickEmbCardType(c.type)}>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;color:#c8d8e8;font-weight:500;">${c.name}</div>
                <div style="font-size:11px;color:#5aadcc;font-family:monospace;">${c.type}</div>
                ${c.description?o`<div style="font-size:11px;color:#666;margin-top:1px;">${c.description}</div>`:m}
              </div>
              <span style="font-size:10px;color:#375f78;padding-left:10px;white-space:nowrap;">${c.source}</span>
            </div>
          `)}
          ${a&&!l?o`
            <div class="ec-list-row" style="cursor:pointer;padding:8px 10px;border-top:1px solid rgba(255,255,255,0.06);margin-top:4px;"
              @click=${()=>void this._pickEmbCardType(a)}>
              <div style="flex:1;min-width:0;">
                <div style="font-size:13px;color:#c8d8e8;">Use "<strong>${a}</strong>"</div>
                <div style="font-size:11px;color:#666;">Enter type manually</div>
              </div>
            </div>
          `:m}
        </div>
      </div>
    `}_renderFlowCompleteModal(){if(!this._showFlowCompleteModal)return m;const e=this._flows()[this._pendingFlowIdx]?.name??"Flow";return o`
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
    `}_renderGGModal(){if(!this._ggOpen)return m;const e=r=>o`<img class="ec-lib-preview" src="${$s+r}" alt=""
      @error=${l=>{const c=l.target,p=document.createElement("div");p.className="ec-lib-thumb-placeholder",c.parentNode?.replaceChild(p,c)}} />`,t=[{value:15,color:"#ef4444"},{value:35,color:"#f59e0b"},{value:100,color:"#22c55e"}],s=[{label:"Thermometer",file:"thermometer.svg",fill_direction:"up",width:60,height:200},{label:"Thermometer (Horizontal)",file:"thermometer-horizontal.svg",fill_direction:"left",width:200,height:60},{label:"Arc Gauge",file:"gauge-arc.svg",fill_direction:"up",width:200,height:120},{label:"Battery (Vertical)",file:"battery-vertical.svg",fill_direction:"up",width:44,height:100,thresholds:t},{label:"Battery (Horizontal)",file:"battery-horizontal.svg",fill_direction:"left",width:100,height:44,thresholds:t},{label:"Tank (Cylinder)",file:"tank-cylinder.svg",fill_direction:"up",width:100,height:150},{label:"Tank - Water",file:"tank-water.svg",fill_direction:"up",width:80,height:95},{label:"Tank (Fermenter)",file:"tank-fermenter.svg",fill_direction:"up",width:60,height:165},{label:"Tank (Cone)",file:"tank-cone.svg",fill_direction:"up",width:80,height:150},{label:"Inverter",file:"inverter.svg",fill_direction:"up",width:100,height:100}],i=[{label:"Line",graph_type:"stat-line",thumb:"thumb_stat_line.webp"},{label:"Bar",graph_type:"bar",thumb:"thumb_stat_bar.webp"},{label:"Bar (Stacked)",graph_type:"bar-stacked",thumb:"thumb_statbar_stacked.webp"}],n=[{label:"With Unit (line)",graph_type:"line",thumb:"thumb_history_uom.webp"},{label:"No Unit (states)",graph_type:"state-timeline",thumb:"thumb_history_no_uom.webp"}],a=[{label:"Arc Gauge",graph_type:"gauge",thumb:"thumb_gauge_arc.webp"},{label:"Arc Gauge (Needle)",graph_type:"gauge-needle",thumb:"thumb_gauge_arc_needle.webp"}];return o`
      <div class="ec-lib-backdrop" @click=${()=>{this._ggOpen=!1}}></div>
      <div class="ec-lib-modal">
        <div class="ec-lib-header">
          <span class="ec-lib-title">Element Library</span>
          <button class="ec-btn-clear" @click=${()=>{this._ggOpen=!1}}>✕</button>
        </div>

        <div class="ec-lib-cat">SVG Elements</div>
        <div class="ec-lib-grid">
          ${s.map(r=>o`
            <button class="ec-lib-item" title="${r.label}"
              @click=${()=>this._pickGG("svg",{svg:$s+r.file,fill_direction:r.fill_direction,width:r.width,height:r.height,...r.thresholds?{thresholds:r.thresholds}:{}})}>
              ${e(r.file)}
              <span class="ec-lib-name">${r.label}</span>
            </button>
          `)}
        </div>

        <div class="ec-lib-cat">Statistics Graph</div>
        <div class="ec-lib-grid">
          ${i.map(r=>o`
            <button class="ec-lib-item" title="${r.label}"
              @click=${()=>this._pickGG("graph",{graph_type:r.graph_type})}>
              ${e(r.thumb)}
              <span class="ec-lib-name">${r.label}</span>
            </button>
          `)}
        </div>

        <div class="ec-lib-cat">History Graph</div>
        <div class="ec-lib-grid">
          ${n.map(r=>o`
            <button class="ec-lib-item" title="${r.label}"
              @click=${()=>this._pickGG("graph",{graph_type:r.graph_type})}>
              ${e(r.thumb)}
              <span class="ec-lib-name">${r.label}</span>
            </button>
          `)}
        </div>

        <div class="ec-lib-cat">Gauge</div>
        <div class="ec-lib-grid">
          ${a.map(r=>o`
            <button class="ec-lib-item" title="${r.label}"
              @click=${()=>this._pickGG("graph",{graph_type:r.graph_type})}>
              ${e(r.thumb)}
              <span class="ec-lib-name">${r.label}</span>
            </button>
          `)}
        </div>
      </div>
    `}_row(e,t){return o`
      <div class="ec-row">
        <label class="ec-label">${e}</label>
        <div class="ec-control">${t}</div>
      </div>
    `}_optRow(e,t,s,i,n){return o`
      <div class="ec-row">
        <label class="ec-label">${e}${t?o`<span class="ec-label-hint">${t}</span>`:m}</label>
        <div class="ec-control ec-opt-control">
          <label class="ec-opt-inherit">
            <input type="checkbox" .checked=${s} @change=${a=>n(a.target.checked)} />
            Inherit
          </label>
          <div class="ec-opt-target${s?" ec-opt-target--disabled":""}">${i}</div>
        </div>
      </div>
    `}_colorPicker(e,t,s,i){const n=t??"",a=this._cpOpenId===e,r=/^#[0-9a-fA-F]{6}$/.test(n)?n:n?yn(n):"#000000",l=n||"transparent",c=i?.clearable!==!1&&t!=null,p=["#ff0000","#ff4500","#ff8800","#ffff00","#00ff00","#00ff7f","#00ffff","#0000ff","#9400d3","#ff00ff","#ffffff","#00d4ff","#22c55e","#888888","#333333","#000000"],u=parseInt(r.slice(1,3),16),h=parseInt(r.slice(3,5),16),d=parseInt(r.slice(5,7),16),g=(b,y,x)=>`#${[b,y,x].map(f=>Math.max(0,Math.min(255,f)).toString(16).padStart(2,"0")).join("")}`;return o`
      <div class="ec-cp-wrap">
        <div class="ec-color-row">
          <button class="ec-color-swatch-btn" title="Open color picker"
            style="background:${l}"
            @click=${b=>{if(b.stopPropagation(),!a){const y=b.currentTarget.getBoundingClientRect();this._cpOpenAbove=window.innerHeight-y.bottom<340}this._cpOpenId=a?null:e}}
          ></button>
          <input type="text" class="ec-color-text"
            .value=${n}
            placeholder="#rrggbb · rgb() · name"
            @change=${b=>{const y=b.target.value.trim();s(y||void 0)}}
          />
          ${c?o`<button class="ec-btn-clear" title="${i?.clearTitle??"Clear"}"
            @click=${i?.onClear??(()=>s(void 0))}>✕</button>`:m}
        </div>
        ${a?o`
          <div class="ec-cp-backdrop" @click=${()=>{this._cpOpenId=null}}></div>
          <div class="ec-cp-popup${this._cpOpenAbove?" ec-cp-popup--above":""}" @click=${b=>b.stopPropagation()}>
            <hex-color-picker
              .color=${r}
              @color-changed=${b=>s(b.detail.value)}
            ></hex-color-picker>
            <div class="ec-cp-rgb">
              ${["R","G","B"].map((b,y)=>{const x=[u,h,d][y];return o`<label class="ec-cp-rgb-label">${b}
                  <input type="number" class="ec-cp-rgb-input" min="0" max="255"
                    .value=${String(x)}
                    @change=${f=>{const k=Number(f.target.value);s(g(y===0?k:u,y===1?k:h,y===2?k:d))}}
                  />
                </label>`})}
            </div>
            <div class="ec-cp-presets">
              ${p.map(b=>o`
                <button class="ec-cp-preset" style="background:${b}" title="${b}"
                  @click=${()=>{s(b),this._cpOpenId=null}}
                ></button>
              `)}
            </div>
          </div>
        `:m}
      </div>
    `}};S._TAB_LABEL={cards:"Cards",elements:"Elements",settings:"Settings"};S._PANEL_META={mosaic:{icon:"mdi:view-dashboard",title:"Mosaic Cards",desc:"Canvas cards holding value, label, icon, Element Library (SVG fills & graphs), blank and rule fields. Reorder fields to stack them; style per-card or inherit the global defaults."},popover:{icon:"mdi:picture-in-picture-bottom-right",title:"Popover Cards",desc:"Popup panels opened by an Open Popover action from a card, field or zone. Column-based layout with their own defaults."},embedded:{icon:"mdi:widgets",title:"Embedded External Cards",desc:"Embed any native or custom Home Assistant dashboard card directly onto the canvas."},flows:{icon:"mdi:chart-timeline-variant",title:"Animated Flow Lines",desc:"CSS-animated lines between canvas points. An entity value drives speed and direction; style is dashes, dots, fluid or particles."},zones:{icon:"mdi:gesture-tap-box",title:"Clickable Zones",desc:"Bounded clickable hotspots pinned to canvas coordinates, used to trigger tap / hold / double-tap actions."},virtuals:{icon:"mdi:memory",title:"Virtual Entities",desc:"Computed helper entities — add, subtract, mean, signed net or time-until — usable across every card without a HA helper."},canvas:{icon:"mdi:image-size-select-actual",title:"Canvas",desc:"Placement mode (Precision or Grid), base size, fit, extend margins, the canvas box and the background image set."},defaults:{icon:"mdi:palette",title:"Global Defaults",desc:"Default box, value and label styling plus fonts, gaps and element fill colours. Cards and fields inherit these unless overridden."},templates:{icon:"mdi:bookmark-multiple",title:"Templates",desc:"Save the current layout as a portable template, or import one to replace the configuration."}};S._VIRTUAL_OPS=[{value:"add",label:"Add (sum all)"},{value:"subtract",label:"Subtract (first − rest)"},{value:"mean",label:"Mean (average)"},{value:"signed_net",label:"Signed net (input[0] − input[1])"},{value:"time_until",label:"Time Until"}];S._FLOW_STYLES=["dashes","dots","fluid","particles"];S._FLOW_SIDES=["top","right","bottom","left","center"];S.styles=[Bt`
      :host {
        display: block;
        font-size: 16px;
        color: var(--primary-text-color);
      }
      .ec-version-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 8px 0;
      }
      .ec-version {
        font-size: 13px;
        color: var(--secondary-text-color);
        font-family: monospace;
      }
      .ec-expand-btn {
        font-size: 12px;
        padding: 3px 10px;
        border: 1px solid rgba(0,212,255,0.35);
        border-radius: 4px;
        background: rgba(0,212,255,0.06);
        color: #00c8f0;
        cursor: pointer;
        white-space: nowrap;
      }
      .ec-expand-btn:hover {
        background: rgba(0,212,255,0.14);
        border-color: rgba(0,212,255,0.65);
      }

      /* ── Onboarding wizard ── */
      .ec-wizard { padding: 24px; min-height: 280px; display: flex; flex-direction: column; }
      .ec-wiz-welcome { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 14px; padding: 16px 0; }
      .ec-wiz-icon { font-size: 48px; line-height: 1; }
      .ec-wiz-title { font-size: 20px; font-weight: 700; color: #00d4ff; margin: 0; }
      .ec-wiz-heading { font-size: 15px; font-weight: 600; color: #00d4ff; margin: 0 0 16px; }
      .ec-wiz-optional { font-size: 12px; font-weight: 400; color: #777; }
      .ec-wiz-desc { font-size: 13px; color: #aaa; margin: 0 0 16px; line-height: 1.5; }
      .ec-wiz-field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 14px; }
      .ec-wiz-label { font-size: 12px; color: #aaa; font-weight: 500; }
      .ec-wiz-input {
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 6px; color: #fff; font-size: 13px;
        padding: 7px 10px; width: 100%; box-sizing: border-box;
      }
      .ec-wiz-input:focus { outline: none; border-color: rgba(0,212,255,0.5); }
      .ec-wiz-input--short { width: 80px; }
      .ec-wiz-select {
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 6px; color: #fff; font-size: 13px;
        padding: 7px 10px; width: 100%; cursor: pointer;
      }
      .ec-wiz-select:focus { outline: none; border-color: rgba(0,212,255,0.5); }
      .ec-wiz-row { display: flex; gap: 10px; margin-top: 20px; }
      .ec-wiz-end { justify-content: flex-end; }
      .ec-wiz-space { justify-content: space-between; }
      .ec-wiz-btn-primary {
        background: rgba(0,212,255,0.15); border: 1px solid rgba(0,212,255,0.5);
        border-radius: 20px; color: #00d4ff; font-size: 13px; font-weight: 600;
        padding: 8px 20px; cursor: pointer; letter-spacing: 0.04em;
      }
      .ec-wiz-btn-primary:hover { background: rgba(0,212,255,0.25); box-shadow: 0 0 10px rgba(0,212,255,0.3); }
      .ec-wiz-btn-ghost {
        background: transparent; border: 1px solid rgba(255,255,255,0.2);
        border-radius: 20px; color: #888; font-size: 13px;
        padding: 8px 16px; cursor: pointer;
      }
      .ec-wiz-btn-ghost:hover { border-color: rgba(255,255,255,0.4); color: #ccc; }
      .ec-wiz-btn-primary:disabled { opacity: 0.4; cursor: default; pointer-events: none; }
      .ec-wiz-type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 4px 0 8px; }
      .ec-wiz-type-btn {
        display: flex; flex-direction: column; align-items: center; gap: 5px; text-align: center;
        padding: 16px 10px; border-radius: 10px; cursor: pointer;
        border: 2px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04);
        transition: border-color 0.15s, background 0.15s;
      }
      .ec-wiz-type-btn:hover { border-color: rgba(0,212,255,0.4); background: rgba(0,212,255,0.07); }
      .ec-wiz-type-btn.selected { border-color: #00d4ff; background: rgba(0,212,255,0.12); }
      .ec-wiz-type-icon { font-size: 26px; line-height: 1; }
      .ec-wiz-type-title { font-size: 13px; font-weight: 600; color: #fff; }
      .ec-wiz-type-desc { font-size: 11px; color: #888; line-height: 1.4; }
      .ec-wiz-ev-group {
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
        border-radius: 8px; padding: 12px; margin-bottom: 10px;
      }
      .ec-wiz-ev-label { font-size: 12px; font-weight: 600; color: #00d4ff; margin-bottom: 10px; }
      .ec-wiz-reset-row { margin-top: 18px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: flex-end; }
      .ec-wiz-btn-reset {
        background: var(--primary-color); 
        border: none;
        border-radius: 6px; 
        color: var (--primary-text-color); 
        font-size: 12px;
        padding: 5px 14px; cursor: pointer;
      }
      //.ec-wiz-btn-reset:hover { background: rgba(255,80,80,0.1); border-color: rgba(255,80,80,0.7); color: #ff6464; }

      /* ── Preview wrapper ── */
      /* .ec-preview is a native <dialog>: kept open (non-modal) inline when
         collapsed, promoted to the top layer via showModal() when expanded.
         Reset the UA dialog styles so the collapsed state lays out like the
         plain div it used to be. */
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
        background: #00a8e0;
        color: #fff;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.02em;
        cursor: pointer;
        box-shadow: 0 3px 10px rgba(0,168,224,0.35);
      }
      .ec-open-editor-btn:hover { background: #00bcf0; box-shadow: 0 5px 16px rgba(0,188,240,0.4); }
      .ec-open-editor-btn ha-icon { --mdc-icon-size: 20px; }

      /* ── Fullscreen expanded preview ── */
      .ec-preview--expanded {
        position: relative;
        inset: 0;
        z-index: 9999;
        background: #111;
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
        border-top: 1px solid rgba(0,212,255,0.18);
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
        color: var(--primary-text-color, rgba(0,212,255,0.45));
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
        color: var(--primary-text-color, rgba(0,212,255,0.6));
        white-space: nowrap;
      }
      .ec-quick-field input {
        width: 6em;
      }
      .ec-side-close {
        background: var(--primary-color);
        border: none;
        border-radius: 6px;
        color: var(--primary-text-color);
        font-size: 14px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
      }
      .ec-btn-done {
        background: var(--primary-color);
        border: none;
        border-radius: 6px;
        color: var(--primary-text-color);
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
        border-bottom: 1px solid rgba(0,212,255,0.18);
      }
      .ec-bar-top.ec-preview--expanded .ec-expanded-bottom-bar {
        order: -1;
      }
      .ec-canvas-tools-divider-v {
        width: 1px;
        height: 20px;
        background: rgba(0,212,255,0.2);
        flex-shrink: 0;
      }
      .ec-canvas-tools-divider {
        width: 100%;
        border: none;
        border-top: 1px solid rgba(0,212,255,0.15);
        margin: 8px 0 2px;
      }

      /* ── Grid-mode overlay ── */
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

      /* ── Preview handles ── */
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
        border: 2px solid var(--primary-color, #03a9f4);
        box-shadow: 0 0 4px var(--primary-color, #03a9f4);
      }
      .ec-handle.multi {
        width: 12px;
        height: 12px;
        background: transparent;
        border: 2px dashed var(--primary-color, #03a9f4);
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
        box-shadow: inset 0 0 0 2px var(--primary-color, #00d4ff);
      }
      .ec-card-ov.multi,
      .ec-emb-ov.multi {
        outline: 2px dashed var(--primary-color, #00d4ff);
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

      /* ── Controls chrome ── */
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
        border-top: 1px solid rgba(0,212,255,0.3);
      }
      .ec-section {
        border-bottom: 1px solid rgba(255,255,255,0.05);
        padding: 10px 14px;
      }
      .ec-section--fields {
        background: var(--secondary-background-color, rgba(0,180,220,0.07));
        min-height: 500px;
      }
      .ec-section:not(.ec-section--fields) + .ec-section--fields {
        margin-top: 8px;
        border-top: 1px solid rgba(0,212,255,0.18);
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
      .ec-tu-chip--label { background: rgba(0,212,255,0.12); color: #5aadcc; border: 1px solid rgba(0,212,255,0.28); }
      .ec-tu-chip--value { background: rgba(255,255,255,0.09); color: #dddddd; border: 1px solid rgba(255,255,255,0.18); }
      .ec-tu-chip--newline { background: rgba(255,200,0,0.09); color: #b89900; border: 1px solid rgba(255,200,0,0.22); }
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

      /* ── Ribbon navigation shell ── */
      .ec-breadcrumb {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 2px;
        padding: 8px 14px;
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
        font: 500 12px inherit;
        color: var(--secondary-text-color, #6b93a8);
      }
      .ec-crumb:hover {
        background: color-mix(in srgb, var(--primary-color, #03a9f4) 12%, transparent);
      }
      .ec-crumb--active { color: var(--primary-color, #00d4ff); }
      .ec-crumb-sep {
        --mdc-icon-size: 14px;
        color: var(--secondary-text-color, #567788);
        opacity: 0.7;
      }

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
      .ec-nav-tab:hover { background: color-mix(in srgb, var(--primary-color, #03a9f4) 8%, transparent); }
      .ec-nav-tab.active { color: var(--primary-color, #00d4ff); }
      .ec-nav-tab.active::before {
        content: '';
        position: absolute;
        left: 0; top: 6px; bottom: 6px;
        width: 3px;
        background: var(--primary-color, #00d4ff);
        border-radius: 0 3px 3px 0;
      }
      .ec-nav-list { flex: 1; min-width: 0; overflow-y: auto; padding: 4px 0; }

      .ec-nav-item {
        width: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 11px 14px;
        border: none;
        border-bottom: 1px solid rgba(255,255,255,0.05);
        background: transparent;
        cursor: pointer;
        text-align: left;
        color: inherit;
        font: inherit;
      }
      .ec-nav-item:hover { background: color-mix(in srgb, var(--primary-color, #03a9f4) 8%, transparent); }
      .ec-nav-item-icon { --mdc-icon-size: 20px; color: var(--primary-color, #4a8aaa); flex: 0 0 auto; }
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

      /* ── In-panel "Sections" nav cards (one level deeper than the flat ribbon item list) ── */
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
        background: color-mix(in srgb, var(--primary-color, #03a9f4) 8%, transparent);
        border-color: var(--primary-color, #03a9f4);
      }
      .ec-nav-card-icon { --mdc-icon-size: 20px; color: var(--primary-color, #4a8aaa); flex: 0 0 auto; }
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
      .ec-panel-back:hover { background: color-mix(in srgb, var(--primary-color, #03a9f4) 10%, transparent); }
      .ec-panel-back ha-icon { --mdc-icon-size: 18px; }
      .ec-panel-header-icon { --mdc-icon-size: 18px; color: var(--primary-color, #4a8aaa); }
      .ec-panel-header-title { font-size: 14px; font-weight: 600; color: var(--primary-text-color, #dceaf2); }
      .ec-panel-header-spacer { flex: 1; }
      .ec-panel-done {
        display: flex;
        align-items: center;
        gap: 4px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        padding: 6px 13px;
        font-size: 12.5px;
        font-weight: 600;
        background: var(--primary-color, #03a9f4);
        color: #fff;
      }
      .ec-panel-done ha-icon { --mdc-icon-size: 16px; }
      .ec-panel-body { flex: 1; min-height: 50vh; overflow-y: auto; padding: 10px 14px 16px; }
      .ec-panel-desc {
        font-size: 12px;
        line-height: 1.5;
        color: var(--secondary-text-color, #6b93a8);
        margin: 0 0 10px;
      }

      /* ── List rows ── */
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
        background: rgba(0,212,255,0.06);
        border-color: rgba(0,212,255,0.14);
      }
      .ec-list-row.selected {
        background: rgba(0,212,255,0.12);
        border-color: rgba(0,212,255,0.3);
      }
      .ec-list-row.multi {
        background: rgba(0,212,255,0.07);
        border: 1px dashed rgba(0,212,255,0.3);
      }
      .ec-list-label {
        flex: 1;
        font-size: 15px;
        color: var(--primary-text-color, #b8d4e0);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* ── Item cards (bordered, icon + label + sub + chevron; matches ribbon-redesign mock) ── */
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
      }
      .ec-item-card:hover {
        background: color-mix(in srgb, var(--primary-color, #03a9f4) 8%, transparent);
        border-color: var(--primary-color, rgba(0,212,255,0.3));
      }
      .ec-item-card.selected {
        background: color-mix(in srgb, var(--primary-color, #03a9f4) 14%, transparent);
        border-color: var(--primary-color, rgba(0,212,255,0.4));
      }
      .ec-item-card.multi {
        background: color-mix(in srgb, var(--primary-color, #03a9f4) 9%, transparent);
        border-style: dashed;
        border-color: var(--primary-color, rgba(0,212,255,0.4));
      }
      .ec-item-card.ec-dragging { opacity: 0.4; }
      .ec-item-card-icon { --mdc-icon-size: 20px; color: var(--primary-color, #4a8aaa); flex: 0 0 auto; }
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

      /* ── Form rows ── */
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
      .ec-label-hint { display: block; font-size: 10.5px; font-weight: 400; color: var(--secondary-text-color, #6b93a8); margin-top: 1px; }
      .ec-opt-control { display: flex; align-items: center; gap: 10px; }
      .ec-opt-inherit {
        display: flex;
        align-items: center;
        gap: 5px;
        font-size: 11px;
        color: #6b93a8;
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
        border-color: var(--primary-color, rgba(0,212,255,0.4));
        background: color-mix(in srgb, var(--primary-color, #03a9f4) 12%, transparent);
        color: var(--primary-color, #00d4ff);
      }
      ha-entity-picker { display: block; width: 100%; }
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
        background: var(--secondary-background-color, rgba(0,8,18,0.7));
        border: 1px solid var(--divider-color, rgba(0,212,255,0.18));
        border-radius: 6px;
        padding: 5px 8px;
        font-size: 15px;
        color: var(--primary-text-color, #c8e0ec);
        outline: none;
        transition: border-color 0.15s, box-shadow 0.15s;
        -webkit-appearance: none;
        appearance: none;
      }
      .ec-input:focus, .ec-select:focus {
        border-color: var(--primary-color, rgba(0,212,255,0.55));
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color, #03a9f4) 18%, transparent);
      }
      .ec-input-num { width: 6em; }

      /* Number stepper — mock's "Number fields: stepper style" control pattern. Wraps the
         existing editable input (unchanged) with +/- buttons that call its native
         stepUp()/stepDown(); direct typing still works. */
      .ec-num-wrap { display: inline-flex; align-items: center; gap: 3px; vertical-align: middle; }
      .ec-num-wrap .ec-input-num { width: 6em; }
      .ec-num-wrap .ec-input-num-small { width: 3em; }
      .ec-num-steppers { display: flex; gap: 2px; flex: 0 0 auto; }
      .ec-num-step {
        width: 20px;
        height: 24px;
        padding: 0;
        border: 1px solid var(--divider-color, rgba(0,212,255,0.2));
        border-radius: 5px;
        background: var(--primary-color, #03a9f4);
        color: var(--primary-text-color, #8fc8dc);
        font-size: 14px;
        line-height: 1;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      // .ec-num-step:hover { background: color-mix(in srgb, var(--primary-color, #03a9f4) 16%, transparent); border-color: var(--primary-color, rgba(0,212,255,0.45)); }
      // .ec-num-step:active { background: color-mix(in srgb, var(--primary-color, #03a9f4) 28%, transparent); }

      /* Select chevron — mock's "Select (chevron)" control pattern, per the ribbon-redesign
         README control-pattern spec. Pure CSS so every existing <select class="ec-select">
         picks it up with no markup changes. */
      .ec-select {
        padding-right: 26px;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b93a8' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 6px center;
        background-size: 16px;
      }

      /* Toggle switch — mock's "Switch/toggle" control pattern. Pure CSS restyle of every
         existing <input type="checkbox">; no markup or state-handling changes required. */
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
        background: #f5f8fa;
        box-shadow: 0 1px 3px rgba(0,0,0,0.4);
        transition: transform 0.15s, background 0.15s;
      }
      input[type="checkbox"]:checked {
        background: var(--primary-color, #03a9f4);
        border-color: var(--primary-color, #03a9f4);
      }
      input[type="checkbox"]:checked::before {
        transform: translateX(17px);
        background: #fff;
      }
      input[type="checkbox"]:focus-visible {
        box-shadow: 0 0 0 2px rgba(0,212,255,0.25);
      }

      /* ── Dual-range speed slider ── */
      .ec-dual-range { display: flex; align-items: center; gap: 8px; width: 100%; }
      .ec-dual-range-label { font-size: 11px; color: var(--secondary-text-color, #aaa); white-space: nowrap; }
      .ec-dual-range-track { position: relative; flex: 1; height: 22px; }
      .ec-dual-range-track input[type=range] {
        position: absolute; top: 3px; left: 0; width: 100%; margin: 0;
        -webkit-appearance: none; appearance: none;
        background: transparent; pointer-events: none; height: 16px;
      }
      .ec-dual-range-track input[type=range]::-webkit-slider-runnable-track {
        background: rgba(255,255,255,0.15); border-radius: 4px; height: 4px;
      }
      .ec-dual-range-track input[type=range]::-moz-range-track {
        background: rgba(255,255,255,0.15); border-radius: 4px; height: 4px;
      }
      .ec-dual-range-track input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none; appearance: none; pointer-events: all; cursor: pointer;
        width: 16px; height: 16px; border-radius: 50%;
        background: var(--primary-color, #00d4ff); border: 2px solid rgba(0,0,0,0.35);
        margin-top: -6px;
      }
      .ec-dual-range-track input[type=range]::-moz-range-thumb {
        pointer-events: all; cursor: pointer;
        width: 14px; height: 14px; border-radius: 50%;
        background: var(--primary-color, #00d4ff); border: 2px solid rgba(0,0,0,0.35);
      }

      /* ── Color picker ── */
      .ec-cp-wrap { position: relative; }
      .ec-color-row { display: flex; align-items: center; gap: 6px; }
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
        background-image: linear-gradient(45deg, #666 25%, transparent 25%),
          linear-gradient(-45deg, #666 25%, transparent 25%),
          linear-gradient(45deg, transparent 75%, #666 75%),
          linear-gradient(-45deg, transparent 75%, #666 75%);
        background-size: 8px 8px;
        background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
        background-color: #444;
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
        position: absolute;
        top: calc(100% + 4px);
        bottom: auto;
        left: 0;
        z-index: 9999;
        background: var(--card-background-color, #1a2332);
        border: 1px solid var(--divider-color, rgba(0,212,255,0.3));
        border-radius: 10px;
        padding: 10px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.6);
        width: 220px;
      }
      .ec-cp-popup--above { top: auto; bottom: calc(100% + 4px); }
      .ec-cp-popup hex-color-picker {
        width: 100%;
        --cp-border-radius: 6px;
        --cp-color-focus-color: rgba(0,212,255,0.5);
      }
      .ec-cp-rgb {
        display: flex;
        gap: 6px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(255,255,255,0.08);
      }
      .ec-cp-rgb-label {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        font-size: 10px;
        color: #aaa;
        gap: 3px;
      }
      .ec-cp-rgb-input {
        width: 100%;
        text-align: center;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.15);
        border-radius: 4px;
        color: #fff;
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
        border-top: 1px solid rgba(255,255,255,0.08);
      }
      .ec-cp-preset {
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: 1px solid rgba(255,255,255,0.25);
        cursor: pointer;
        padding: 0;
        transition: transform 0.1s, border-color 0.1s;
      }
      .ec-cp-preset:hover { transform: scale(1.25); border-color: rgba(255,255,255,0.7); }

      /* ── Buttons ── */
      .ec-flow-paths-overlay {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: visible;
        z-index: 2;
      }
      .ec-flow-name-input {
        font-size: 12px;
        padding: 3px 8px;
        border: 1px solid rgba(0,212,255,0.4);
        border-radius: 4px;
        background: rgba(0,0,0,0.3);
        color: #e0e0e0;
        width: 120px;
        outline: none;
      }
      .ec-flow-name-input:focus {
        border-color: rgba(0,212,255,0.8);
        box-shadow: 0 0 6px rgba(0,212,255,0.2);
      }
      .ec-align-section-divider {
        border: none;
        border-top: 1px solid rgba(255,255,255,0.08);
        margin: 6px 0 4px;
      }
      .ec-btn-add {
        display: flex;
        align-items: center;
        gap: 4px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        padding: 6px 13px;
        font-size: 12.5px;
        font-weight: 600;
        background: var(--primary-color, #03a9f4);
        color: #fff;

        // font-size: 13px;
        // font-weight: 600;
        // letter-spacing: 0.05em;
        // padding: 4px 12px;
        // border: 1px solid rgba(0,212,255,0.45);
        // border-radius: 20px;
        // background: rgba(0,212,255,0.06);
        // color: #00c8f0;
        // cursor: pointer;
        // transition: background 0.15s, box-shadow 0.15s, border-color 0.15s;
      }
      // .ec-btn-add:hover {
      //   background: rgba(0,212,255,0.14);
      //   border-color: rgba(0,212,255,0.7);
      //   box-shadow: 0 0 10px rgba(0,212,255,0.2);
      // }
      .ec-btn-remove {
        font-size: 13px;
        padding: 2px 6px;
        border: none;
        border-radius: 4px;
        background: transparent;
        color: rgba(255,80,80,0.6);
        cursor: pointer;
        line-height: 1;
        transition: color 0.12s, background 0.12s;
        }
      .ec-btn-remove:hover {
        background: rgba(255,80,80,0.12);
        color: #ff5050;
      }
      .ec-btn-copy, .ec-btn-paste {
        font-size: 14px;
        padding: 2px 5px;
        border: none;
        border-radius: 4px;
        background: transparent;
        cursor: pointer;
        line-height: 1;
        transition: color 0.12s, background 0.12s;
      }
      .ec-btn-copy { color: rgba(0,212,255,0.55); }
      .ec-btn-copy:hover { background: rgba(0,212,255,0.12); color: #00d4ff; }
      .ec-btn-paste { color: rgba(80,200,120,0.7); }
      .ec-btn-paste:hover { background: rgba(80,200,120,0.12); color: #50c878; }
      .ec-stat-yaml {
        margin: 6px 0 4px;
        border: 1px solid rgba(0,212,255,0.2);
        border-radius: 6px;
        overflow: hidden;
      }
      .ec-stat-yaml-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 4px 8px;
        background: rgba(0,212,255,0.08);
        font-size: 11px;
        color: rgba(255,255,255,0.5);
        font-weight: 600;
        letter-spacing: 0.04em;
      }
      .ec-stat-yaml-code {
        margin: 0;
        padding: 8px;
        font-size: 10px;
        font-family: 'Courier New', monospace;
        color: rgba(255,255,255,0.7);
        background: rgba(0,0,0,0.3);
        white-space: pre;
        overflow-x: auto;
        line-height: 1.5;
      }
      .ec-graph-series {
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 6px;
        padding: 6px 8px;
        margin-bottom: 6px;
      }
      .ec-graph-series-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 4px;
      }
      .ec-graph-series-actions {
        display: flex;
        align-items: center;
        gap: 2px;
      }
      .ec-btn-reorder {
        background: rgba(255,255,255,0.08);
        border: none;
        border-radius: 3px;
        color: rgba(255,255,255,0.6);
        cursor: pointer;
        font-size: 10px;
        line-height: 1;
        padding: 2px 5px;
      }
      .ec-btn-reorder:hover:not(:disabled) {
        background: rgba(255,255,255,0.16);
        color: #fff;
      }
      .ec-btn-reorder:disabled {
        opacity: 0.25;
        cursor: default;
      }
      .ec-graph-series-num {
        font-size: 11px;
        font-weight: 600;
        color: rgba(255,255,255,0.5);
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
      .ec-copy-badge {
        font-size: 10px;
        padding: 1px 5px;
        border-radius: 3px;
        background: rgba(0,212,255,0.15);
        color: #00d4ff;
        letter-spacing: 0.04em;
      }
      .ec-col-badge {
        font-size: 10px;
        padding: 1px 4px;
        border-radius: 3px;
        background: rgba(255,255,255,0.1);
        color: rgba(255,255,255,0.6);
        font-weight: 600;
        letter-spacing: 0.04em;
      }
      .ec-type-badge {
        font-size: 10px;
        padding: 1px 4px;
        border-radius: 3px;
        background: rgba(0,180,120,0.2);
        color: rgba(0,220,150,0.9);
        font-weight: 600;
        letter-spacing: 0.04em;
      }
      .ec-drag-handle {
        width: 14px;
        flex-shrink: 0;
        align-self: stretch;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 3px;
        padding: 2px 1px;
        cursor: grab;
        opacity: 0.35;
        border-radius: 3px;
        transition: opacity 0.12s;
      }
      .ec-drag-handle::before, .ec-drag-handle::after {
        content: '';
        height: 2px;
        background: currentColor;
        border-radius: 1px;
      }
      .ec-drag-handle:hover { opacity: 0.75; }
      .ec-list-row.ec-dragging { opacity: 0.3; }
      .ec-list-row.ec-drag-over {
        outline: 1px solid rgba(0,212,255,0.5);
        background: rgba(0,212,255,0.07);
        border-radius: 4px;
      }
      .ec-btn-reorder {
        font-size: 12px;
        padding: 2px 5px;
        border: 1px solid rgba(0,212,255,0.15);
        border-radius: 4px;
        background: transparent;
        color: #375f78;
        cursor: pointer;
        line-height: 1;
        transition: border-color 0.12s, color 0.12s;
      }
      .ec-btn-reorder:hover {
        border-color: rgba(0,212,255,0.45);
        color: #00c8f0;
      }
      .ec-btn-reorder:disabled { opacity: 0.2; cursor: default; }
      .ec-btn-clear {
        font-size: 13px;
        padding: 2px 6px;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 4px;
        background: transparent;
        color: #375f78;
        cursor: pointer;
        transition: border-color 0.12s, color 0.12s;
      }
      .ec-btn-clear:hover {
        border-color: rgba(0,212,255,0.3);
        color: #00c8f0;
      }

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
        background: var(--primary-color);
        color: var(--primary-text-color);
        cursor: pointer;
        white-space: nowrap;
      }
      .ec-empty {
        font-size: 14px;
        font-style: italic;
        color: #375f78;
        margin: 4px 0;
      }

      ha-entity-picker {
        display: block;
        width: 100%;
        border-radius: 4px;
        border: 1px solid;
        --md-sys-color-surface: var(--primary-color);
      }
      ha-entity-picker:hover {
        border-radius: 4px;
        border: 1px solid var(--primary-color);
      }

      /* ── Zone handles ── */
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
        border: 1px solid #1a2a36;
        border-radius: 2px;
        pointer-events: auto;
        z-index: 2;
      }
      .ec-zone-resize-tl { left: -5px; top: -5px; cursor: nwse-resize; }
      .ec-zone-resize-tr { right: -5px; top: -5px; cursor: nesw-resize; }
      .ec-zone-resize-bl { left: -5px; bottom: -5px; cursor: nesw-resize; }
      .ec-zone-resize-br { right: -5px; bottom: -5px; cursor: nwse-resize; }

      /* ── Background (canvas image) overlay ── */
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
        border: 1px solid #10222e;
        border-radius: 2px;
        pointer-events: auto;
        z-index: 3;
      }
      .ec-bg-resize-tl { left: -6px; top: -6px; cursor: nwse-resize; }
      .ec-bg-resize-tr { right: -6px; top: -6px; cursor: nesw-resize; }
      .ec-bg-resize-bl { left: -6px; bottom: -6px; cursor: nesw-resize; }
      .ec-bg-resize-br { right: -6px; bottom: -6px; cursor: nwse-resize; }

      /* ── Flow overlay ── */
      .ec-flow-layer {
        position: absolute;
        inset: 0;
        pointer-events: auto;
        cursor: crosshair;
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

      /* ── SVG library browser ── */
      .ec-lib-backdrop {
        position: fixed; inset: 0; z-index: 10100;
        background: rgba(4,8,14,0.72);
      }
      .ec-lib-modal {
        position: fixed; z-index: 10101;
        top: 50%; left: 50%; transform: translate(-50%, -50%);
        width: min(520px, 94vw); max-height: 80vh;
        background: rgba(10,18,28,0.97);
        border: 1px solid rgba(0,212,255,0.28);
        border-radius: 12px;
        overflow-y: auto;
        padding: 0 0 12px;
        box-shadow: 0 8px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,212,255,0.08);
      }
      .ec-lib-header {
        display: flex; align-items: center; justify-content: space-between;
        padding: 14px 16px 10px;
        border-bottom: 1px solid rgba(0,212,255,0.12);
        position: sticky; top: 0;
        background: rgba(10,18,28,0.98);
        z-index: 1;
      }
      .ec-lib-title {
        font-size: 15px; font-weight: 700; color: #00d4ff; letter-spacing: 0.03em;
      }
      .ec-lib-cat {
        font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
        color: #375f78; padding: 10px 16px 4px;
      }
      .ec-lib-grid {
        display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
        gap: 8px; padding: 4px 12px 0;
      }
      .ec-lib-item {
        display: flex; flex-direction: column; align-items: center; gap: 6px;
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
        border-radius: 8px; padding: 10px 6px 8px; cursor: pointer;
        transition: background 0.14s, border-color 0.14s, box-shadow 0.14s;
      }
      .ec-lib-item:hover {
        background: rgba(0,212,255,0.1);
        border-color: rgba(0,212,255,0.45);
        box-shadow: 0 0 12px rgba(0,212,255,0.18);
      }
      .ec-lib-preview {
        width: 52px; height: 52px; object-fit: contain;
      }
      .ec-lib-thumb-placeholder {
        width: 52px; height: 52px;
        background: rgba(0,212,255,0.06);
        border: 1px dashed rgba(0,212,255,0.2);
        border-radius: 4px;
      }
      .ec-lib-name {
        font-size: 10px; color: #7aacbf; text-align: center;
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
        background: var(--primary-color, #03a9f4);
        color: #fff;
      }
    `];F([st({attribute:!1})],S.prototype,"hass",2);F([E()],S.prototype,"_config",2);F([E()],S.prototype,"_selCard",2);F([E()],S.prototype,"_selField",2);F([E()],S.prototype,"_selCards",2);F([E()],S.prototype,"_selEmbCards",2);F([E()],S.prototype,"_selFlow",2);F([E()],S.prototype,"_showAddFlowInput",2);F([E()],S.prototype,"_newFlowName",2);F([E()],S.prototype,"_pendingFlowIdx",2);F([E()],S.prototype,"_showFlowCompleteModal",2);F([E()],S.prototype,"_selPoint",2);F([E()],S.prototype,"_selSeries",2);F([E()],S.prototype,"_selVirtual",2);F([E()],S.prototype,"_selVirtualInput",2);F([E()],S.prototype,"_selTrigger",2);F([E()],S.prototype,"_selZone",2);F([E()],S.prototype,"_selExtCard",2);F([E()],S.prototype,"_selExtField",2);F([E()],S.prototype,"_templateName",2);F([E()],S.prototype,"_templateError",2);F([E()],S.prototype,"_previewBoxes",2);F([E()],S.prototype,"_previewExpanded",2);F([E()],S.prototype,"_barAtTop",2);F([E()],S.prototype,"_copiedFields",2);F([E()],S.prototype,"_copySourceIdx",2);F([E()],S.prototype,"_virtualClipboard",2);F([E()],S.prototype,"_copiedField",2);F([E()],S.prototype,"_copiedFieldSrc",2);F([E()],S.prototype,"_dragSrc",2);F([E()],S.prototype,"_cpOpenId",2);F([E()],S.prototype,"_cpOpenAbove",2);F([E()],S.prototype,"_ggOpen",2);F([E()],S.prototype,"_wizStep",2);F([E()],S.prototype,"_wiz",2);F([E()],S.prototype,"_bgSelected",2);F([E()],S.prototype,"_selEmbCard",2);F([E()],S.prototype,"_embEditorOpen",2);F([E()],S.prototype,"_embEditorYaml",2);F([E()],S.prototype,"_embNativeEditor",2);F([E()],S.prototype,"_embPickerOpen",2);F([E()],S.prototype,"_embPickerSearch",2);F([E()],S.prototype,"_navTab",2);F([E()],S.prototype,"_navPanel",2);F([E()],S.prototype,"_navPath",2);S=F([he("mosaic-canvas-editor")],S);const $n="modulepreload",xn=function(e){return"/"+e},xs={},wn=function(t,s,i){let n=Promise.resolve();if(s&&s.length>0){let r=function(p){return Promise.all(p.map(u=>Promise.resolve(u).then(h=>({status:"fulfilled",value:h}),h=>({status:"rejected",reason:h}))))};document.getElementsByTagName("link");const l=document.querySelector("meta[property=csp-nonce]"),c=l?.nonce||l?.getAttribute("nonce");n=r(s.map(p=>{if(p=xn(p),p in xs)return;xs[p]=!0;const u=p.endsWith(".css"),h=u?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${p}"]${h}`))return;const d=document.createElement("link");if(d.rel=u?"stylesheet":$n,u||(d.as="script"),d.crossOrigin="",d.href=p,c&&d.setAttribute("nonce",c),document.head.appendChild(d),u)return new Promise((g,b)=>{d.addEventListener("load",g),d.addEventListener("error",()=>b(new Error(`Unable to preload CSS for ${p}`)))})}))}function a(r){const l=new Event("vite:preloadError",{cancelable:!0});if(l.payload=r,window.dispatchEvent(l),!l.defaultPrevented)throw r}return n.then(r=>{for(const l of r||[])l.status==="rejected"&&a(l.reason);return t().catch(a)})};var kn=Object.defineProperty,Sn=Object.getOwnPropertyDescriptor,vt=(e,t,s,i)=>{for(var n=i>1?void 0:i?Sn(t,s):t,a=e.length-1,r;a>=0;a--)(r=e[a])&&(n=(i?r(t,s,n):r(n))||n);return i&&n&&kn(t,s,n),n};const Ee=new Map;function Cn(e,t,s){return s<=t?0:Math.max(0,Math.min(100,(e-t)/(s-t)*100))}function Nn(e,t,s){if(!t?.length)return s;const i=[...t].sort((a,r)=>a.value-r.value);let n=s;for(const a of i)e>=a.value&&(n=a.color);return n}let Z=class extends bt{constructor(){super(...arguments),this.rawValue=0,this.entityUnit="",this._svgText="",this._shapesReady=!1,this._svgNatW=0,this._svgNatH=0}connectedCallback(){super.connectedCallback(),this._load()}updated(e){if(e.has("field")&&this._load(),this.field?.svg&&this._svgText){const t=this.renderRoot.querySelector(".fill");t&&(t.style.filter=""),this.field.svg?.toLowerCase().includes("thermometer")?this._applyThermometerFill():t?.querySelector("[data-needle]")?this._applyNeedleFill():this._svgKey==="inverter"?this._applyInverterFill():(this._applyExternalFill(),this._updateSvgLabels()),this._applyTankColor()}}async _load(){const e=this.field;e&&(e.svg?await this._fetchSvg(e.svg):e.shape&&await this._loadShapes())}async _fetchSvg(e){let t=Ee.get(e);if(!t){const i=fetch(e).then(n=>n.text()).catch(()=>"");Ee.set(e,i),t=i}const s=await t;if(typeof t!="string"&&Ee.set(e,s),this._svgText!==s){this._svgText=s;const i=s.match(/viewBox="[\d.\s-]*?([\d.]+)\s+([\d.]+)"/);i&&(this._svgNatW=parseFloat(i[1]),this._svgNatH=parseFloat(i[2]))}}async _loadShapes(){Z._shapesModule||(Z._shapesModule=await wn(()=>import("./mosaic-canvas-shapes.js"),[])),this._shapesReady||(this._shapesReady=!0)}get _pct(){return this.fillPct!=null?Math.max(0,Math.min(100,this.fillPct)):Cn(this.rawValue,this.field?.min??_("fill_min")??0,this.field?.max??_("fill_max")??100)}get _svgKey(){const e=this.field?.svg?.toLowerCase()??"";return e.includes("thermometer-horizontal")?"thermo_h":e.includes("thermometer")?"thermo":e.includes("battery-horizontal")?"battery_h":e.includes("battery-vertical")?"battery_v":e.includes("tank-cylinder")?"tank_cylinder":e.includes("tank-water")?"tank_water":e.includes("tank-fermenter")?"tank_fermenter":e.includes("tank-cone")?"tank_cone":e.includes("gauge-arc")?"gauge_arc":e.includes("inverter")?"inverter":null}get _color(){const e=this._svgKey,t=e?this.defaults?.[`${e}_fill_color`]:void 0;return Nn(this.rawValue,this.field?.thresholds,this.field?.fill_color??t??_("fill_color")??"#00d4ff")}get _fillColor2(){const e=this._svgKey,t=e?this.defaults?.[`${e}_fill_color2`]:void 0;return this.field?.fill_color2??t}get _w(){const e=this.field;if(!e)return 60;if(e.width!=null)return e.width;const t=this._h;return e.svg&&this._svgNatW&&this._svgNatH?Math.round(t*this._svgNatW/this._svgNatH):e.shape==="bar-h"?Math.round(t*4):Math.round(t*.5)}get _h(){const e=this.field;return e?e.height!=null?e.height:e.svg&&this._svgNatH?this._svgNatH:e.shape==="bar-h"?40:120:120}_applyExternalFill(){const e=this.field;if(!e)return;const t=this.renderRoot.querySelector(".fill");if(!t)return;const s=t.querySelector("svg");s&&(s.setAttribute("width","100%"),s.setAttribute("height","100%"));const i=e.fill_id,n=(i?t.querySelector(`#${CSS.escape(i)}`):null)??t.querySelector("[data-fill]")??t.querySelector("#fill");if(!n)return;const a=this._pct,r=e.fill_direction??_("fill_direction")??"up",l={up:`polygon(0% ${100-a}%, 100% ${100-a}%, 100% 100%, 0% 100%)`,down:`polygon(0% 0%, 100% 0%, 100% ${a}%, 0% ${a}%)`,left:`polygon(0% 0%, ${a}% 0%, ${a}% 100%, 0% 100%)`,right:`polygon(${100-a}% 0%, 100% 0%, 100% 100%, ${100-a}% 100%)`},c=n;c.style.transition||(c.style.transition="clip-path 0.6s ease"),c.style.clipPath=l[r]??l.up;const p=(e.thresholds?.length??0)>0,u=this._fillColor2,h=t.querySelector('[data-fill-stop="0"]'),d=t.querySelector('[data-fill-stop="1"]');if(!p&&u)if(h&&d){h.setAttribute("stop-color",this._color),d.setAttribute("stop-color",u);const g=h.closest("linearGradient,radialGradient");g?.id&&(c.style.fill=`url(#${g.id})`)}else this._applyInjectedGradient(s,c,this._color,u,r);else this._removeInjectedGradient(s),h&&h.setAttribute("stop-color",this._color),d&&d.setAttribute("stop-color",this._color),c.style.fill=this._color}_applyInjectedGradient(e,t,s,i,n){if(!e){t.style.fill=s;return}const a="_mc_fg";let r=e.querySelector("defs");r||(r=document.createElementNS("http://www.w3.org/2000/svg","defs"),e.insertBefore(r,e.firstChild));let l=r.querySelector(`#${a}`);if(!l){l=document.createElementNS("http://www.w3.org/2000/svg","linearGradient"),l.setAttribute("id",a),l.setAttribute("gradientUnits","objectBoundingBox");const b=document.createElementNS("http://www.w3.org/2000/svg","stop");b.setAttribute("offset","0%");const y=document.createElementNS("http://www.w3.org/2000/svg","stop");y.setAttribute("offset","100%"),l.appendChild(b),l.appendChild(y),r.appendChild(l)}const c={up:["0.5","1","0.5","0"],down:["0.5","0","0.5","1"],left:["0","0.5","1","0.5"],right:["1","0.5","0","0.5"]},[p,u,h,d]=c[n]??c.up;l.setAttribute("x1",p),l.setAttribute("y1",u),l.setAttribute("x2",h),l.setAttribute("y2",d);const g=l.querySelectorAll("stop");g[0].setAttribute("stop-color",s),g[1].setAttribute("stop-color",i),t.style.fill=`url(#${a})`}_removeInjectedGradient(e){e?.querySelector("#_mc_fg")?.remove()}_applyInverterFill(){const e=this.renderRoot.querySelector(".fill");if(!e)return;const t=e.querySelector("svg");if(!t)return;if(!t.getAttribute("viewBox")){const n=t.getAttribute("width"),a=t.getAttribute("height");n&&a&&t.setAttribute("viewBox",`0 0 ${parseFloat(n)} ${parseFloat(a)}`)}t.setAttribute("width","100%"),t.setAttribute("height","100%");const s=t.querySelector("#line");if(!s)return;const i=this.field?.fill_color??this.defaults?.inverter_line_color??_("inverter_line_color")??"#00d4ff";s.style.fill=i}_applyTankColor(){const e=this._svgKey,t=e?this.defaults?.[`${e}_tank_color`]:void 0,s=this.field?.tank_color??t;if(!s)return;const i=this.renderRoot.querySelector(".fill");if(!i)return;const n=i.querySelector("#tank"),a=i.querySelector("#tank-top");n&&(a?n.style.stroke=s:n.style.fill=s),a&&(a.style.fill=s)}_applyNeedleFill(){const e=this.renderRoot.querySelector(".fill");if(!e)return;const t=e.querySelector("[data-needle]");if(!t)return;const s=-90+this._pct*1.8;t.style.transition="transform 0.6s ease",t.style.transformBox="fill-box",t.style.transformOrigin="50% 100%",t.style.transform=`rotate(${s}deg)`;const i=t.querySelector("path");i&&(i.style.fill=this._color)}_updateSvgLabels(){const e=this.renderRoot.querySelector(".fill");if(!e)return;const t=this.field;if(!t)return;const s=this._svgKey,i=s?this.defaults?.[`${s}_label_color`]:void 0,n=s?this.defaults?.[`${s}_label_size`]:void 0,a=t.gauge_label_color??i??_("gauge_label_color")??"#cccccc",r=t.gauge_label_size??n??_("gauge_label_size")??11,l=e.querySelector("[data-min-label]"),c=e.querySelector("[data-max-label]"),p=e.querySelector("[data-value]");if(l&&(l.textContent=t.gauge_min_label??"",l.setAttribute("fill",a),l.setAttribute("font-size",String(r)),l.style.display=t.gauge_min_label?"":"none"),c&&(c.textContent=t.gauge_max_label??"",c.setAttribute("fill",a),c.setAttribute("font-size",String(r)),c.style.display=t.gauge_max_label?"":"none"),p)if(t.gauge_show_value){const u=t.decimals!=null?this.rawValue.toFixed(t.decimals):String(this.rawValue);p.textContent=t.unit?`${u} ${t.unit}`:u,p.setAttribute("fill",t.gauge_label_color??_("gauge_label_color")??"#cccccc"),p.setAttribute("font-size",String(Math.round(r*1.5))),p.style.display=""}else p.style.display="none"}_applyThermometerFill(){const e=this.renderRoot.querySelector(".fill");if(!e)return;const t=this.field;if(!t)return;const s=e.querySelector("svg");if(!s)return;s.setAttribute("width","100%"),s.setAttribute("height","100%");const i="http://www.w3.org/2000/svg",n=e.querySelector("#fill-area"),a=e.querySelector("#tick-major-right")??e.querySelector("#tick-major"),r=e.querySelector("#tick-minor-right")??e.querySelector("#tick-minor"),l=e.querySelector("#tick-text-right")??e.querySelector("#tick-text"),c=e.querySelector("#tick-major-left"),p=e.querySelector("#tick-minor-left"),u=e.querySelector("#tick-text-left"),h=e.querySelector("#fill"),d=e.querySelector("#outer"),g=e.querySelector("#temp"),b=e.querySelector("#degrees-c"),y=e.querySelector("#degrees-f");if(!n||!h)return;const x=n.x.baseVal.value,f=n.y.baseVal.value,k=n.width.baseVal.value,v=n.height.baseVal.value,w=t.min??_("fill_min")??0,$=t.max??_("fill_max")??100,C=$-w,N=this._svgKey==="thermo_h",z=t.fill_color??(N?this.defaults?.thermo_h_fill_color:this.defaults?.thermo_fill_color)??_(N?"thermo_h_fill_color":"thermo_fill_color")??_("fill_color")??"#00d4ff",M=C>0?Math.max(0,Math.min(1,(this.rawValue-w)/C)):0,H=f+v*(1-M),W=t.thermo_tick_color??this.defaults?.thermo_tick_color??_("thermo_tick_color")??"rgba(255,255,255,0.7)",T=t.thermo_tick_font_size??this.defaults?.thermo_tick_font_size??_("thermo_tick_font_size")??4,B=t.thermo_fill_opacity_above??this.defaults?.thermo_fill_opacity_above??_("thermo_fill_opacity_above")??.5,G=t.thermo_grid_color??this.defaults?.thermo_grid_color??_("thermo_grid_color")??"rgba(255,255,255,0.25)",I=t.thermo_minor_tick_width??this.defaults?.thermo_minor_tick_width??_("thermo_minor_tick_width")??.5,q=t.thermo_major_tick_width??this.defaults?.thermo_major_tick_width??_("thermo_major_tick_width")??.75,Y=t.thermo_temp_color??this.defaults?.thermo_temp_color??_("thermo_temp_color")??"#ffffff",K=t.thermo_temp_font_size??this.defaults?.thermo_temp_font_size??_("thermo_temp_font_size")??10,J=this.defaults?.font_family??"inherit",lt=this.defaults?.mono_font_family??_("mono_font_family")??"'Courier New', monospace";d&&(d.style.stroke="none");const O=D=>{D.style.fill=W,D.style.stroke="none",D.style.fontFamily=J,D.removeAttribute("fill");const A=D.querySelector("tspan");if(A){if(A.getAttribute("x")==="0"&&A.getAttribute("y")==="0"){const L=D.getAttribute("x"),V=D.getAttribute("y");L&&A.setAttribute("x",L),V&&A.setAttribute("y",V)}A.style.fill=W,A.style.stroke="none",A.style.fontFamily=J,A.removeAttribute("fill")}},ot=this.entityUnit.includes("F");if(b&&(b.style.display=ot?"none":"inline",ot||O(b)),y&&(y.style.display=ot?"inline":"none",ot&&O(y)),g){const D=t.thermo_decimals??this.defaults?.thermo_decimals??_("thermo_decimals")??t.decimals,A=D!=null?this.rawValue.toFixed(D):String(this.rawValue);g.style.fill=Y,g.style.stroke="none",g.style.fontFamily=lt,g.style.fontSize=`${K}px`,g.removeAttribute("fill");const L=g.querySelector("tspan");L?(L.textContent=A,L.style.fill=Y,L.style.stroke="none",L.style.fontFamily=lt,L.style.fontSize=`${K}px`,L.removeAttribute("fill")):g.textContent=A}e.querySelector("#thermo-clip-below")?.closest("clipPath")?.remove(),e.querySelector("#thermo-clip-above")?.closest("clipPath")?.remove(),e.querySelector("#thermo-fill-group")?.remove(),e.querySelector("#thermo-fill-below")?.remove(),e.querySelector("#thermo-fill-above")?.remove(),s.querySelector("#thermo-fill-gradient")?.remove();const _e=f+v+200,me=document.createElementNS(i,"clipPath");me.id="thermo-clip-below";const Lt=document.createElementNS(i,"rect");Lt.setAttribute("x","0"),Lt.setAttribute("width","100"),Lt.setAttribute("y",String(H)),Lt.setAttribute("height",String(Math.max(0,_e-H))),me.appendChild(Lt);const ge=document.createElementNS(i,"clipPath");ge.id="thermo-clip-above";const Wt=document.createElementNS(i,"rect");Wt.setAttribute("x","0"),Wt.setAttribute("width","100"),Wt.setAttribute("y","0"),Wt.setAttribute("height",String(Math.max(0,H))),ge.appendChild(Wt);let ft=s.querySelector("defs");ft||(ft=document.createElementNS(i,"defs"),s.prepend(ft)),ft.appendChild(me),ft.appendChild(ge);let Ht;const be=t.thresholds;if(be&&be.length>0){const D=[...be].sort((Q,X)=>Q.value-X.value),A=document.createElementNS(i,"linearGradient");A.id="thermo-fill-gradient",A.setAttribute("gradientUnits","userSpaceOnUse"),A.setAttribute("x1","0"),A.setAttribute("x2","0"),A.setAttribute("y1",String(f+v)),A.setAttribute("y2",String(f));const L=(Q,X)=>{const ht=document.createElementNS(i,"stop");ht.setAttribute("offset",String(Math.max(0,Math.min(1,Q)))),ht.setAttribute("stop-color",X),A.appendChild(ht)};let V=z;for(const Q of D){const X=C>0?(Q.value-w)/C:0;if(X<=0){V=Q.color;continue}if(X>=1)break;L(X,V),L(X,Q.color),V=Q.color}L(1,V),ft.appendChild(A),Ht="url(#thermo-fill-gradient)"}else if(this._fillColor2){const D=document.createElementNS(i,"linearGradient");D.id="thermo-fill-gradient",D.setAttribute("gradientUnits","userSpaceOnUse"),D.setAttribute("x1","0"),D.setAttribute("x2","0"),D.setAttribute("y1",String(f+v)),D.setAttribute("y2",String(f));const A=document.createElementNS(i,"stop");A.setAttribute("offset","0"),A.setAttribute("stop-color",z);const L=document.createElementNS(i,"stop");L.setAttribute("offset","1"),L.setAttribute("stop-color",this._fillColor2),D.appendChild(A),D.appendChild(L),ft.appendChild(D),Ht="url(#thermo-fill-gradient)"}else Ht=z;h.style.display="none";const yt=h.cloneNode(!0);yt.id="thermo-fill-below",yt.style.removeProperty("filter"),yt.style.display="",yt.style.fill=Ht,yt.style.opacity="1",yt.setAttribute("clip-path","url(#thermo-clip-below)");const $t=h.cloneNode(!0);$t.id="thermo-fill-above",$t.style.removeProperty("filter"),$t.style.display="",$t.style.fill=Ht,$t.style.opacity=String(B),$t.setAttribute("clip-path","url(#thermo-clip-above)");const Ot=document.createElementNS(i,"g");Ot.id="thermo-fill-group",Ot.setAttribute("filter","url(#filter47)"),Ot.appendChild(yt),Ot.appendChild($t),h.after(Ot),s.style.overflow="visible",e.querySelector("#thermo-ticks")?.remove();const Jt=t.thermo_text_position??this.defaults?.thermo_text_position??_("thermo_text_position")??"right",As=Jt==="right"||Jt==="both",Rs=Jt==="left"||Jt==="both",Ve=!!(a&&r&&l),je=!!(c&&p&&u);if(!Ve&&!je)return;const Bs=t.thermo_major_tick_length??this.defaults?.thermo_major_tick_length??_("thermo_major_tick_length"),Ls=t.thermo_minor_tick_length??this.defaults?.thermo_minor_tick_length??_("thermo_minor_tick_length"),Ws=t.thermo_show_minor_tick_text??this.defaults?.thermo_show_minor_tick_text??_("thermo_show_minor_tick_text")??!1,Qt=[1,2,5,10,20,25,50,100,200,250,500,1e3].find(D=>Math.ceil(C/D)<=5)??10,ve=Qt/2,xt=document.createElementNS(i,"g");xt.id="thermo-ticks";const Ue=D=>f+v*(1-(D-w)/C),Gt=[];if(As&&Ve&&Gt.push({tmEl:a,tnEl:r,ttEl:l,anchorEnd:!1}),Rs&&je&&Gt.push({tmEl:c,tnEl:p,ttEl:u,anchorEnd:!0}),Gt.length===0)return;const Hs=Math.ceil(w/ve),Os=Math.floor($/ve);for(const{tnEl:D,ttEl:A,anchorEnd:L}of Gt){const V=D.x.baseVal.value,Q=Ls??D.width.baseVal.value,X=A.x.baseVal.value,ht=A.width.baseVal.value;for(let wt=Hs;wt<=Os;wt++){if(wt%2===0)continue;const te=wt*ve,Mt=Ue(te),ct=document.createElementNS(i,"line");if(ct.setAttribute("x1",String(V)),ct.setAttribute("x2",String(V+Q)),ct.setAttribute("y1",String(Mt)),ct.setAttribute("y2",String(Mt)),ct.setAttribute("stroke",W),ct.setAttribute("stroke-width",String(I)),xt.appendChild(ct),Ws){const pt=L?X+ht:X,it=document.createElementNS(i,"text");it.setAttribute("x",String(pt)),it.setAttribute("y",String(Mt)),it.setAttribute("dominant-baseline","middle"),it.setAttribute("text-anchor",L?"end":"start"),it.setAttribute("font-size",String(T)),it.setAttribute("fill",W),it.style.fontFamily=J,it.textContent=String(te),xt.appendChild(it)}}}const Gs=Math.ceil(w/Qt),Vs=Math.floor($/Qt);for(let D=Gs;D<=Vs;D++){const A=D*Qt,L=Ue(A),V=document.createElementNS(i,"line");V.setAttribute("x1",String(x)),V.setAttribute("x2",String(x+k)),V.setAttribute("y1",String(L)),V.setAttribute("y2",String(L)),V.setAttribute("stroke",G),V.setAttribute("stroke-width",String(I)),xt.appendChild(V);for(const{tmEl:Q,ttEl:X,anchorEnd:ht}of Gt){const wt=Q.x.baseVal.value,te=Bs??Q.width.baseVal.value,Mt=X.x.baseVal.value,ct=X.width.baseVal.value,pt=document.createElementNS(i,"line");pt.setAttribute("x1",String(wt)),pt.setAttribute("x2",String(wt+te)),pt.setAttribute("y1",String(L)),pt.setAttribute("y2",String(L)),pt.setAttribute("stroke",W),pt.setAttribute("stroke-width",String(q)),xt.appendChild(pt);const it=ht?Mt+ct:Mt,ut=document.createElementNS(i,"text");ut.setAttribute("x",String(it)),ut.setAttribute("y",String(L)),ut.setAttribute("dominant-baseline","middle"),ut.setAttribute("text-anchor",ht?"end":"start"),ut.setAttribute("font-size",String(T)),ut.setAttribute("fill",W),ut.style.fontFamily=J,ut.textContent=String(A),xt.appendChild(ut)}}(a?.parentElement??c?.parentElement??s).appendChild(xt)}render(){const e=this.field;if(!e)return m;const t=this._w,s=this._h,i=o`<div class="fill" style="width:${t}px;height:${s}px;background:rgba(0,0,0,0.2);border-radius:4px;"></div>`;if(e.svg)return this._svgText?o`<div class="fill" style="width:${t}px;height:${s}px;overflow:hidden;"
        .innerHTML=${this._svgText}></div>`:i;if(e.shape){const n=Z._shapesModule;if(!n)return i;const a=n.SHAPES[e.shape];return a?o`<div class="fill"
        .innerHTML=${a({pct:this._pct,color:this._color,width:t,height:s})}
      ></div>`:m}return m}};Z._shapesModule=null;Z.styles=Bt`
    :host { display: block; line-height: 0; }
    .fill { display: inline-block; }
  `;vt([st({attribute:!1})],Z.prototype,"field",2);vt([st({attribute:!1})],Z.prototype,"defaults",2);vt([st({type:Number})],Z.prototype,"rawValue",2);vt([st({type:String})],Z.prototype,"entityUnit",2);vt([st({type:Number})],Z.prototype,"fillPct",2);vt([E()],Z.prototype,"_svgText",2);vt([E()],Z.prototype,"_shapesReady",2);Z=vt([he("mc-fill")],Z);var En=Object.defineProperty,In=Object.getOwnPropertyDescriptor,Kt=(e,t,s,i)=>{for(var n=i>1?void 0:i?In(t,s):t,a=e.length-1,r;a>=0;a--)(r=e[a])&&(n=(i?r(t,s,n):r(n))||n);return i&&n&&En(t,s,n),n};let Ft=class extends bt{constructor(){super(...arguments),this.transparent=!1,this._cardEl=null,this._lastType=""}render(){return o`<div id="slot"></div>`}updated(e){e.has("cardConfig")?this._rebuildCard():e.has("hass")&&this._cardEl&&(this._cardEl.hass=this.hass),e.has("transparent")&&this._cardEl&&this._applyTransparent()}_applyTransparent(){this._cardEl&&(this.transparent?(this._cardEl.style.setProperty("--ha-card-background","transparent"),this._cardEl.style.setProperty("--ha-card-box-shadow","none"),this._cardEl.style.setProperty("--ha-card-border-width","0px"),this._cardEl.style.setProperty("--ha-card-border-color","transparent")):(this._cardEl.style.removeProperty("--ha-card-background"),this._cardEl.style.removeProperty("--ha-card-box-shadow"),this._cardEl.style.removeProperty("--ha-card-border-width"),this._cardEl.style.removeProperty("--ha-card-border-color")))}async _rebuildCard(){await this.updateComplete;const e=this.cardConfig,t=this._slot;if(!t)return;if(!e?.type){t.innerHTML="",this._cardEl=null;return}const s=String(e.type);if(this._cardEl&&s===this._lastType){try{this._cardEl.setConfig(e)}catch{}this._cardEl.hass=this.hass,this._applyTransparent();return}try{const i=await window.loadCardHelpers?.();if(!i?.createCardElement)return;t.innerHTML="";const n=i.createCardElement(e);n.hass=this.hass,this._lastType=s,this._cardEl=n,t.appendChild(n),this._applyTransparent()}catch(i){console.error("[mc-embedded-card] failed to create card:",i)}}};Ft.styles=Bt`
    :host { display: block; }
    #slot { width: 100%; }
  `;Kt([st({attribute:!1})],Ft.prototype,"cardConfig",2);Kt([st({attribute:!1})],Ft.prototype,"hass",2);Kt([st({type:Boolean})],Ft.prototype,"transparent",2);Kt([mi("#slot")],Ft.prototype,"_slot",2);Ft=Kt([he("mc-embedded-card")],Ft);function zn(e){const{stat_period:t,stat_period_n:s,stat_period_start:i,stat_period_end:n}=e,a=new Date,r=new Date(a.getFullYear(),a.getMonth(),a.getDate()),l=new Date(r.getTime()-864e5),c=r.getDay(),p=c===0?6:c-1,u=new Date(r.getTime()-p*864e5),h=new Date(u.getTime()-7*864e5),d=new Date(a.getFullYear(),a.getMonth(),1),g=new Date(a.getFullYear(),a.getMonth()-1,1),b=new Date(a.getFullYear(),0,1),y=new Date(a.getFullYear()-1,0,1);switch(t){case"today":return{start:r,end:a,bucketPeriod:"day"};case"yesterday":return{start:l,end:r,bucketPeriod:"day"};case"this_week":return{start:u,end:a,bucketPeriod:"week"};case"last_week":return{start:h,end:u,bucketPeriod:"week"};case"this_month":return{start:d,end:a,bucketPeriod:"month"};case"last_month":return{start:g,end:d,bucketPeriod:"month"};case"this_year":return{start:b,end:a,bucketPeriod:"month"};case"last_year":return{start:y,end:b,bucketPeriod:"month"};case"last_30_minutes":return{start:new Date(a.getTime()-30*6e4),end:a,bucketPeriod:"hour"};case"last_hour":return{start:new Date(a.getTime()-36e5),end:a,bucketPeriod:"hour"};case"last_n_minutes":{const x=s??_("stat_period_minutes_n")??60;return{start:new Date(a.getTime()-x*6e4),end:a,bucketPeriod:"hour"}}case"last_n_hours":{const x=s??_("stat_period_hours_n")??1;return{start:new Date(a.getTime()-x*36e5),end:a,bucketPeriod:x<=48?"hour":"day"}}case"last_n_days":{const x=s??_("stat_period_days_n")??7;return{start:new Date(a.getTime()-x*864e5),end:a,bucketPeriod:x<=60?"day":"month"}}case"last_n_months":{const x=s??_("stat_period_months_n")??1;return{start:new Date(a.getFullYear(),a.getMonth()-x,a.getDate()),end:a,bucketPeriod:"month"}}case"custom":{if(!i||!n)return null;const x=new Date(i),f=new Date(n);if(isNaN(x.getTime())||isNaN(f.getTime())||f<=x)return null;const k=(f.getTime()-x.getTime())/864e5,v=k<=2?"hour":k<=60?"day":"month";return{start:x,end:f,bucketPeriod:v}}default:return null}}function Fn(e,t){return e.states[t]?.attributes?.unit_of_measurement??""}function ws(e){const t=[];for(const s of e.cards??[])for(const i of s.fields)i.type==="value"&&i.stat_period&&i.entity&&t.push({id:i.id,entity:i.entity,stat_period:i.stat_period,stat_type:i.stat_type,stat_period_n:i.stat_period_n,stat_period_start:i.stat_period_start,stat_period_end:i.stat_period_end}),i.type==="graph"&&i.graph_series&&i.graph_series.forEach((n,a)=>{n.entity&&n.stat_period&&t.push({id:`${i.id}:${a}`,entity:n.entity,stat_period:n.stat_period,stat_type:n.stat_type,stat_period_n:n.stat_period_n})});return t}async function Mn(e,t,s){const i=new Map(s);for(const n of t){const a=zn(n);if(!a)continue;const r=n.stat_type??_("stat_type")??"sum",l=r==="difference"?"hour":a.bucketPeriod;try{const c=await e.connection.sendMessagePromise({type:"recorder/statistics_during_period",start_time:a.start.toISOString(),end_time:a.end.toISOString(),statistic_ids:[n.entity],period:l,units:{},types:["sum","mean","state","max","min"]}),p=c&&c[n.entity]||[];if(!p.length){i.set(n.id,null);continue}let u;if(r==="sum")u=p.reduce((h,d)=>h+(d.sum??0),0);else if(r==="difference"){const h=p.filter(d=>d.state!==null&&d.state!==void 0&&Number.isFinite(Number(d.state)));if(h.length<2){i.set(n.id,null);continue}u=Number(h[h.length-1].state)-Number(h[0].state)}else if(r==="max"){const h=p.map(d=>d.max).filter(d=>d!=null&&Number.isFinite(d));if(!h.length){i.set(n.id,null);continue}u=Math.max(...h)}else if(r==="min"){const h=p.map(d=>d.min).filter(d=>d!=null&&Number.isFinite(d));if(!h.length){i.set(n.id,null);continue}u=Math.min(...h)}else if(r==="count")u=p.filter(h=>h.mean!==null&&h.mean!==void 0).length;else if(r==="range"){const h=p.map(g=>g.max).filter(g=>g!=null&&Number.isFinite(g)),d=p.map(g=>g.min).filter(g=>g!=null&&Number.isFinite(g));if(!h.length||!d.length){i.set(n.id,null);continue}u=Math.max(...h)-Math.min(...d)}else u=p.reduce((h,d)=>h+(d.mean??0),0)/p.length;i.set(n.id,{value:u,unit:Fn(e,n.entity)})}catch{}}return i}const Pn=["stat-line","line","area","state-timeline"];function ks(e){const t=[];for(const s of e.cards??[])for(const i of s.fields){if(i.type!=="graph"||!Pn.includes(i.graph_type??_("graph_type")??"bar"))continue;const n=i.graph_hours??_("graph_hours")??24;(i.graph_series??[]).forEach((a,r)=>{a.entity&&t.push({id:`${i.id}:${r}`,entity:a.entity,hours:n,stat_type:a.stat_type})})}return t}async function Tn(e,t,s){const i=new Map(s),n=e.connection;for(const a of t){const r=new Date,l=new Date(r.getTime()-a.hours*36e5);try{const p=(await n.sendMessagePromise({type:"recorder/statistics_during_period",start_time:l.toISOString(),end_time:r.toISOString(),statistic_ids:[a.entity],period:"hour",units:{},types:["mean","sum","state","max","min"]}))?.[a.entity]??[],u=a.stat_type??_("stat_type_history")??"mean",h=p.flatMap(d=>{const g=u==="sum"?d.sum:u==="max"?d.max:u==="min"?d.min:u==="mean"?d.mean:d.state,b=Number(g);return Number.isFinite(b)?[{t:new Date(d.start).getTime(),v:b}]:[]});i.set(a.id,h)}catch{}}return i}var Dn=Object.defineProperty,An=Object.getOwnPropertyDescriptor,at=(e,t,s,i)=>{for(var n=i>1?void 0:i?An(t,s):t,a=e.length-1,r;a>=0;a--)(r=e[a])&&(n=(i?r(t,s,n):r(n))||n);return i&&n&&Dn(t,s,n),n};console.info(`%c MOSAIC-CANVAS %c v${Ge} · build ${Ds} `,"color: white; background: #03a9f4; font-weight: 700;","color: #03a9f4; background: white; font-weight: 700;");let tt=class extends bt{constructor(){super(...arguments),this.editor=!1,this._cardBoxes={},this._statsMap=new Map,this._historyMap=new Map,this._expandedCardId=null,this._expandScale=1,this._openExtendedId=null,this._totalW=1e3,this._virtualsCache=new Map}static getConfigElement(){return document.createElement("mosaic-canvas-editor")}static getStubConfig(){return{background:{source:"auto",sun_entity:"sun.sun",images:{}},canvas:{},defaults:{font_family:"sans-serif",card:{background:"rgba(8,18,28,0.55)",border:!0,color:"#00d4ff",radius:10,padding:8},label:{font_size:13,color:"#cccccc"},value:{font_size:22,color:"#ffffff",font_weight:600}},cards:[]}}setConfig(e){if(!e)throw new Error("Invalid configuration");this._config=e}getCardSize(){return 5}get cardBoxes(){return this._cardBoxes}shouldUpdate(e){if(e.has("_config")||e.has("_imgNatural")||!e.has("hass"))return!0;const t=e.get("hass");if(!t||!this.hass)return!0;for(const s of this._referencedEntities())if(t.states[s]!==this.hass.states[s])return!0;return!1}_referencedEntities(){const e=new Set,t=this._config?.background;t?.sun_entity&&e.add(t.sun_entity),t?.mode_entity&&e.add(t.mode_entity);for(const s of this._config?.cards??[])for(const i of s.fields)i.entity&&e.add(i.entity);for(const s of this._config?.flows??[])s.entity&&e.add(s.entity);return[...e]}_recomputeScale(){const e=this.renderRoot?.querySelector(".ec-host");if(!e||this._totalW===0)return;const t=e.clientWidth/this._totalW;e.style.setProperty("--ec-scale",String(t))}firstUpdated(){const e=this.renderRoot?.querySelector(".ec-host");e&&(this._ro=new ResizeObserver(()=>{this._recomputeScale(),this._recomputeExpandScale()}),this._ro.observe(e),this._recomputeScale())}updated(e){this._recomputeScale(),this._measureCardBoxes(),this._recomputeExpandScale(),(e.has("_config")||e.has("hass")&&!e.get("hass"))&&this._restartStatPolling()}_recomputeExpandScale(){if(!this._expandedCardId){this._expandScale!==1&&(this._expandScale=1);return}const e=this.renderRoot?.querySelector(".ec-expand-panel"),t=this.renderRoot?.querySelector(".ec-expand-card-wrap");if(!e||!t)return;const s=t.offsetWidth,i=t.offsetHeight;if(!s||!i)return;const n=Math.min(e.clientWidth/s,e.clientHeight/i);Number.isFinite(n)&&n>0&&Math.abs(n-this._expandScale)>.01&&(this._expandScale=n)}_restartStatPolling(){if(this._statsPollTimer!==void 0&&(clearInterval(this._statsPollTimer),this._statsPollTimer=void 0),!this._config||!this.hass)return;if(ws(this._config).length>0){const s=async()=>{!this.hass||!this._config||(this._statsMap=await Mn(this.hass,ws(this._config),this._statsMap))};s();const i=Math.max(1,this._config.defaults?.stat_update_interval??_("stat_update_interval")??5)*6e4;this._statsPollTimer=setInterval(()=>void s(),i)}if(this._historyPollTimer!==void 0&&(clearInterval(this._historyPollTimer),this._historyPollTimer=void 0),ks(this._config).length>0){const s=async()=>{!this.hass||!this._config||(this._historyMap=await Tn(this.hass,ks(this._config),this._historyMap))};s(),this._historyPollTimer=setInterval(()=>void s(),5*6e4)}}_measureCardBoxes(){const e=this.renderRoot?.querySelectorAll(".ec-card[data-card-id]"),{totalW:t,totalH:s}=rt(this._config,this._imgNatural),i={};for(const a of e??[]){const r=a.getAttribute("data-card-id");if(!r)continue;const c=this._config?.cards.find(y=>y.id===r)?.anchor??"top-left",[p,u]=ce[c],h=a.offsetWidth,d=a.offsetHeight,g=a.offsetLeft-p*h,b=a.offsetTop-u*d;i[r]={x:g/t,y:b/s,w:h/t,h:d/s}}this.renderRoot?.querySelectorAll("mc-embedded-card[data-emb-id]")?.forEach(a=>{const r=a.getAttribute("data-emb-id");if(!r)return;const l=this._config?.embedded_cards?.find(b=>b.id===r),[c,p]=ce[l?.anchor??"top-left"],u=a.offsetWidth,h=a.offsetHeight,d=a.offsetLeft-c*u,g=a.offsetTop-p*h;i[r]={x:d/t,y:g/s,w:u/t,h:h/s}}),JSON.stringify(i)!==JSON.stringify(this._cardBoxes)&&(this._cardBoxes=i,this.dispatchEvent(new CustomEvent("ec-boxes-changed",{detail:{boxes:i}})))}connectedCallback(){super.connectedCallback(),Hi.then(()=>this.requestUpdate()),this._onKeyDown=e=>{if(e.key==="Escape"){if(this._openExtendedId!==null){this._openExtendedId=null;return}this._expandedCardId!==null&&(this._expandedCardId=null)}},window.addEventListener("keydown",this._onKeyDown)}disconnectedCallback(){this._onKeyDown&&(window.removeEventListener("keydown",this._onKeyDown),this._onKeyDown=void 0),super.disconnectedCallback(),this._ro?.disconnect(),this._ro=void 0,this._statsPollTimer!==void 0&&(clearInterval(this._statsPollTimer),this._statsPollTimer=void 0),this._historyPollTimer!==void 0&&(clearInterval(this._historyPollTimer),this._historyPollTimer=void 0)}render(){if(!this._config)return m;const e=rt(this._config,this._imgNatural),{baseW:t,baseH:s,L:i,T:n,totalW:a,totalH:r}=e;this._totalW=a;const l=this._config.canvas,c=this._config.defaults,p=this._config.cards??[],u=qi(this._config,this.hass),h=this._config.background?.fit??l?.fit??_("background_fit")??"cover",d=l?.box?pe(l.box):"",g=Ki(this._config.virtuals,this.hass,this._virtualsCache);this._virtualsCache=g;const b=($,C,N)=>{if(!this.hass)return;const z=N==="tap"?$.tap_action:N==="hold"?$.hold_action:$.double_tap_action;if(z?.action==="expand-card"&&"fields"in $){this._expandScale=1,this._expandedCardId=$.id;return}if(z?.action==="open-extended"&&z.extended_card_id){this._openExtendedId=z.extended_card_id;return}xi(this,this.hass,{...$,entity:C},N)},y=l?.tap_action&&l.tap_action.action!=="none",x=this._expandedCardId?p.find($=>$.id===this._expandedCardId):void 0,f=()=>{this._expandedCardId=null,this._expandScale=1},k=this._config.extended_cards??[],v=this._openExtendedId?k.find($=>$.id===this._openExtendedId):void 0,w=()=>{this._openExtendedId=null};return o`
      <ha-card>
        <div
          class="ec-host"
          style="position:relative; width:100%; aspect-ratio:${a}/${r}; overflow:hidden;"
        >
          <div
            class="ec-canvas"
            style="position:absolute; top:0; left:0; width:${a}px; height:${r}px; transform:scale(var(--ec-scale,1)); transform-origin:top left; ${d}${y?"cursor:pointer;":""}"
            @click=${y&&l?()=>b(l,l.tap_action.entity,"tap"):m}
          >
            ${u?o`<img
                  class="ec-bg"
                  src=${u}
                  @load=${$=>{const C=$.target;this._imgNatural={w:C.naturalWidth,h:C.naturalHeight}}}
                  style="position:absolute; left:${i}px; top:${n}px; width:${t}px; height:${s}px; object-fit:${h}; display:block;"
                  decoding="async"
                  alt=""
                />`:m}
            ${pn(this._config,e,this.hass,this._cardBoxes,c)}
            ${p.map($=>ms($,c,this.hass,g,this._statsMap,this._historyMap,b,!1,this.editor))}
            ${ln(this._config.zones,b)}
            ${(this._config.embedded_cards??[]).map($=>o`<mc-embedded-card
                data-emb-id="${$.id}"
                style="position:absolute;left:${$.position.x*100}%;top:${$.position.y*100}%;transform:${He[$.anchor??"top-left"]};width:${$.width}px;${$.height!=null?`height:${$.height}px;`:""}"
                .cardConfig=${$.card_config}
                .hass=${this.hass}
                ?transparent=${$.transparent??!1}
              ></mc-embedded-card>`)}
          </div>
          ${x?o`
            <div class="ec-expand-backdrop" @click=${f}>
              <div class="ec-expand-panel">
                <div class="ec-expand-card-wrap" style="transform:scale(${this._expandScale})" @click=${$=>$.stopPropagation()}>
                  ${ms(x,c,this.hass,g,this._statsMap,this._historyMap,b,!0)}
                </div>
                <button class="ec-expand-close" title="Collapse (Esc)" @click=${f}>✕</button>
              </div>
            </div>
          `:m}
          ${v?(()=>{const $=this._config.extended_card_defaults,C=v.width??$?.width??70,N=v.height??$?.height,z=`width:${C}%;${N!=null?`height:${N}%`:"max-height:85%"};overflow:auto;`;return o`
              <div class="ec-extended-backdrop" @click=${w}>
                <div class="ec-extended-panel" style=${z} @click=${M=>M.stopPropagation()}>
                  ${rn(v,$,c,this.hass,g,this._statsMap,this._historyMap,b)}
                  <button class="ec-ext-close" title="Close (Esc)" @click=${w}>✕</button>
                </div>
              </div>
            `})():m}
        </div>
      </ha-card>
    `}};tt.styles=[cn,un,Bt`
      :host {
        display: block;
      }
      ha-card {
        overflow: hidden;
      }
    `];at([st({attribute:!1})],tt.prototype,"hass",2);at([st({type:Boolean})],tt.prototype,"editor",2);at([E()],tt.prototype,"_config",2);at([E()],tt.prototype,"_imgNatural",2);at([E()],tt.prototype,"_cardBoxes",2);at([E()],tt.prototype,"_statsMap",2);at([E()],tt.prototype,"_historyMap",2);at([E()],tt.prototype,"_expandedCardId",2);at([E()],tt.prototype,"_expandScale",2);at([E()],tt.prototype,"_openExtendedId",2);tt=at([he("mosaic-canvas")],tt);const Pe=window;Pe.customCards=Pe.customCards||[];Pe.customCards.push({type:"mosaic-canvas",name:"Mosaic Canvas Card",description:"Place cards freely over a background image (day/night, EV variants, animated flows).",preview:!0});
