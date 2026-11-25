import{gt as e,pt as t,t as n}from"./jsx-runtime-CibYmC2B.js";import{r}from"./config-D_2C9DEO.js";import{t as i}from"./use-dict-DQzIUG0C.js";import{t as a}from"./controls-CRTLiRlE.js";var o={MEDIA_PLAY_REQUEST:`mediaplayrequest`,MEDIA_PAUSE_REQUEST:`mediapauserequest`,MEDIA_MUTE_REQUEST:`mediamuterequest`,MEDIA_UNMUTE_REQUEST:`mediaunmuterequest`,MEDIA_LOOP_REQUEST:`medialooprequest`,MEDIA_VOLUME_REQUEST:`mediavolumerequest`,MEDIA_SEEK_REQUEST:`mediaseekrequest`,MEDIA_AIRPLAY_REQUEST:`mediaairplayrequest`,MEDIA_ENTER_FULLSCREEN_REQUEST:`mediaenterfullscreenrequest`,MEDIA_EXIT_FULLSCREEN_REQUEST:`mediaexitfullscreenrequest`,MEDIA_PREVIEW_REQUEST:`mediapreviewrequest`,MEDIA_ENTER_PIP_REQUEST:`mediaenterpiprequest`,MEDIA_EXIT_PIP_REQUEST:`mediaexitpiprequest`,MEDIA_ENTER_CAST_REQUEST:`mediaentercastrequest`,MEDIA_EXIT_CAST_REQUEST:`mediaexitcastrequest`,MEDIA_SHOW_TEXT_TRACKS_REQUEST:`mediashowtexttracksrequest`,MEDIA_HIDE_TEXT_TRACKS_REQUEST:`mediahidetexttracksrequest`,MEDIA_SHOW_SUBTITLES_REQUEST:`mediashowsubtitlesrequest`,MEDIA_DISABLE_SUBTITLES_REQUEST:`mediadisablesubtitlesrequest`,MEDIA_TOGGLE_SUBTITLES_REQUEST:`mediatogglesubtitlesrequest`,MEDIA_PLAYBACK_RATE_REQUEST:`mediaplaybackraterequest`,MEDIA_RENDITION_REQUEST:`mediarenditionrequest`,MEDIA_AUDIO_TRACK_REQUEST:`mediaaudiotrackrequest`,MEDIA_SEEK_TO_LIVE_REQUEST:`mediaseektoliverequest`,REGISTER_MEDIA_STATE_RECEIVER:`registermediastatereceiver`,UNREGISTER_MEDIA_STATE_RECEIVER:`unregistermediastatereceiver`},s={MEDIA_CHROME_ATTRIBUTES:`mediachromeattributes`,MEDIA_CONTROLLER:`mediacontroller`},c={MEDIA_AIRPLAY_UNAVAILABLE:`mediaAirplayUnavailable`,MEDIA_AUDIO_TRACK_ENABLED:`mediaAudioTrackEnabled`,MEDIA_AUDIO_TRACK_LIST:`mediaAudioTrackList`,MEDIA_AUDIO_TRACK_UNAVAILABLE:`mediaAudioTrackUnavailable`,MEDIA_BUFFERED:`mediaBuffered`,MEDIA_CAST_UNAVAILABLE:`mediaCastUnavailable`,MEDIA_CHAPTERS_CUES:`mediaChaptersCues`,MEDIA_CURRENT_TIME:`mediaCurrentTime`,MEDIA_DURATION:`mediaDuration`,MEDIA_ENDED:`mediaEnded`,MEDIA_ERROR:`mediaError`,MEDIA_ERROR_CODE:`mediaErrorCode`,MEDIA_ERROR_MESSAGE:`mediaErrorMessage`,MEDIA_FULLSCREEN_UNAVAILABLE:`mediaFullscreenUnavailable`,MEDIA_HAS_PLAYED:`mediaHasPlayed`,MEDIA_HEIGHT:`mediaHeight`,MEDIA_IS_AIRPLAYING:`mediaIsAirplaying`,MEDIA_IS_CASTING:`mediaIsCasting`,MEDIA_IS_FULLSCREEN:`mediaIsFullscreen`,MEDIA_IS_PIP:`mediaIsPip`,MEDIA_LOADING:`mediaLoading`,MEDIA_MUTED:`mediaMuted`,MEDIA_LOOP:`mediaLoop`,MEDIA_PAUSED:`mediaPaused`,MEDIA_PIP_UNAVAILABLE:`mediaPipUnavailable`,MEDIA_PLAYBACK_RATE:`mediaPlaybackRate`,MEDIA_PREVIEW_CHAPTER:`mediaPreviewChapter`,MEDIA_PREVIEW_COORDS:`mediaPreviewCoords`,MEDIA_PREVIEW_IMAGE:`mediaPreviewImage`,MEDIA_PREVIEW_TIME:`mediaPreviewTime`,MEDIA_RENDITION_LIST:`mediaRenditionList`,MEDIA_RENDITION_SELECTED:`mediaRenditionSelected`,MEDIA_RENDITION_UNAVAILABLE:`mediaRenditionUnavailable`,MEDIA_SEEKABLE:`mediaSeekable`,MEDIA_STREAM_TYPE:`mediaStreamType`,MEDIA_SUBTITLES_LIST:`mediaSubtitlesList`,MEDIA_SUBTITLES_SHOWING:`mediaSubtitlesShowing`,MEDIA_TARGET_LIVE_WINDOW:`mediaTargetLiveWindow`,MEDIA_TIME_IS_LIVE:`mediaTimeIsLive`,MEDIA_VOLUME:`mediaVolume`,MEDIA_VOLUME_LEVEL:`mediaVolumeLevel`,MEDIA_VOLUME_UNAVAILABLE:`mediaVolumeUnavailable`,MEDIA_LANG:`mediaLang`,MEDIA_WIDTH:`mediaWidth`},l=Object.entries(c),u=l.reduce((e,[t,n])=>(e[t]=n.toLowerCase(),e),{}),d=l.reduce((e,[t,n])=>(e[t]=n.toLowerCase(),e),{USER_INACTIVE_CHANGE:`userinactivechange`,BREAKPOINTS_CHANGE:`breakpointchange`,BREAKPOINTS_COMPUTED:`breakpointscomputed`});Object.entries(d).reduce((e,[t,n])=>{let r=u[t];return r&&(e[n]=r),e},{userinactivechange:`userinactive`});var f=Object.entries(u).reduce((e,[t,n])=>{let r=d[t];return r&&(e[n]=r),e},{userinactive:`userinactivechange`}),p={SUBTITLES:`subtitles`,CAPTIONS:`captions`,DESCRIPTIONS:`descriptions`,CHAPTERS:`chapters`,METADATA:`metadata`},m={DISABLED:`disabled`,HIDDEN:`hidden`,SHOWING:`showing`},h={MOUSE:`mouse`,PEN:`pen`,TOUCH:`touch`},g={UNAVAILABLE:`unavailable`,UNSUPPORTED:`unsupported`},_={LIVE:`live`,ON_DEMAND:`on-demand`,UNKNOWN:`unknown`},ee={INLINE:`inline`,FULLSCREEN:`fullscreen`,PICTURE_IN_PICTURE:`picture-in-picture`};function te(e){return e?.map(ne).join(` `)}function ne(e){if(e){let{id:t,width:n,height:r}=e;return[t,n,r].filter(e=>e!=null).join(`:`)}}function re(e){return e?.map(ie).join(` `)}function ie(e){if(e){let{id:t,kind:n,language:r,label:i}=e;return[t,n,r,i].filter(e=>e!=null).join(`:`)}}function ae(e){return typeof e==`number`&&!Number.isNaN(e)&&Number.isFinite(e)}var oe=e=>new Promise(t=>setTimeout(t,e)),se={"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`};function ce(e){return String(e).replace(/[&<>"']/g,e=>se[e])}var le={en:{"Start airplay":`Start airplay`,"Stop airplay":`Stop airplay`,Audio:`Audio`,Captions:`Captions`,"Enable captions":`Enable captions`,"Disable captions":`Disable captions`,"Start casting":`Start casting`,"Stop casting":`Stop casting`,"Enter fullscreen mode":`Enter fullscreen mode`,"Exit fullscreen mode":`Exit fullscreen mode`,Mute:`Mute`,Unmute:`Unmute`,Loop:`Loop`,"Enter picture in picture mode":`Enter picture in picture mode`,"Exit picture in picture mode":`Exit picture in picture mode`,Play:`Play`,Pause:`Pause`,"Playback rate":`Playback rate`,"Playback rate {playbackRate}":`Playback rate {playbackRate}`,Quality:`Quality`,"Seek backward":`Seek backward`,"Seek forward":`Seek forward`,Settings:`Settings`,Auto:`Auto`,"audio player":`audio player`,"video player":`video player`,volume:`volume`,seek:`seek`,"closed captions":`closed captions`,"current playback rate":`current playback rate`,"playback time":`playback time`,"media loading":`media loading`,settings:`settings`,"audio tracks":`audio tracks`,quality:`quality`,play:`play`,pause:`pause`,mute:`mute`,unmute:`unmute`,"chapter: {chapterName}":`chapter: {chapterName}`,live:`live`,Off:`Off`,"start airplay":`start airplay`,"stop airplay":`stop airplay`,"start casting":`start casting`,"stop casting":`stop casting`,"enter fullscreen mode":`enter fullscreen mode`,"exit fullscreen mode":`exit fullscreen mode`,"enter picture in picture mode":`enter picture in picture mode`,"exit picture in picture mode":`exit picture in picture mode`,"seek to live":`seek to live`,"playing live":`playing live`,"seek back {seekOffset} seconds":`seek back {seekOffset} seconds`,"seek forward {seekOffset} seconds":`seek forward {seekOffset} seconds`,"Network Error":`Network Error`,"Decode Error":`Decode Error`,"Source Not Supported":`Source Not Supported`,"Encryption Error":`Encryption Error`,"A network error caused the media download to fail.":`A network error caused the media download to fail.`,"A media error caused playback to be aborted. The media could be corrupt or your browser does not support this format.":`A media error caused playback to be aborted. The media could be corrupt or your browser does not support this format.`,"An unsupported error occurred. The server or network failed, or your browser does not support this format.":`An unsupported error occurred. The server or network failed, or your browser does not support this format.`,"The media is encrypted and there are no keys to decrypt it.":`The media is encrypted and there are no keys to decrypt it.`,hour:`hour`,hours:`hours`,minute:`minute`,minutes:`minutes`,second:`second`,seconds:`seconds`,"{time} remaining":`{time} remaining`,"{currentTime} of {totalTime}":`{currentTime} of {totalTime}`,"video not loaded, unknown time.":`video not loaded, unknown time.`}},ue=globalThis.navigator?.language||`en`,de=e=>{ue=e},fe=(e,t)=>{le[e]=t},pe=e=>{let[t]=ue.split(`-`);return le[ue]?.[e]||le[t]?.[e]||le.en?.[e]||e},me=()=>{let[e]=ue.split(`-`);return le[ue]?ue:le[e]?e:`en`},v=(e,t={})=>pe(e).replace(/\{(\w+)\}/g,(e,n)=>n in t?String(t[n]):`{${n}}`),he=[{singular:`hour`,plural:`hours`},{singular:`minute`,plural:`minutes`},{singular:`second`,plural:`seconds`}],ge=(e,t)=>`${e} ${v(e===1?he[t].singular:he[t].plural)}`,_e=e=>{if(!ae(e))return``;let t=Math.abs(e),n=t!==e,r=new Date(0,0,0,0,0,t,0),i=[r.getHours(),r.getMinutes(),r.getSeconds()].map((e,t)=>e&&ge(e,t)).filter(e=>e).join(`, `);return n?v(`{time} remaining`,{time:i}):t===0?ge(0,2):i};function ve(e,t){let n=!1;e<0&&(n=!0,e=0-e),e=e<0?0:e;let r=Math.floor(e%60),i=Math.floor(e/60%60),a=Math.floor(e/3600),o=Math.floor(t/60%60),s=Math.floor(t/3600);return(isNaN(e)||e===1/0)&&(a=i=r=`0`),a=a>0||s>0?a+`:`:``,i=((a||o>=10)&&i<10?`0`+i:i)+`:`,r=r<10?`0`+r:r,(n?`-`:``)+a+i+r}Object.freeze({length:0,start(e){let t=e>>>0;if(t>=this.length)throw new DOMException(`Failed to execute 'start' on 'TimeRanges': The index provided (${t}) is greater than or equal to the maximum bound (${this.length}).`);return 0},end(e){let t=e>>>0;if(t>=this.length)throw new DOMException(`Failed to execute 'end' on 'TimeRanges': The index provided (${t}) is greater than or equal to the maximum bound (${this.length}).`);return 0}});var ye=class{addEventListener(){}removeEventListener(){}dispatchEvent(){return!0}},be=class extends ye{},xe=class extends be{constructor(){super(...arguments),this.role=null}},Se=class{observe(){}unobserve(){}disconnect(){}},Ce={createElement:function(){return new we.HTMLElement},createElementNS:function(){return new we.HTMLElement},addEventListener(){},removeEventListener(){},dispatchEvent(e){return!1}},we={ResizeObserver:Se,document:Ce,Node:be,Element:xe,HTMLElement:class extends xe{constructor(){super(...arguments),this.innerHTML=``}get content(){return new we.DocumentFragment}},DocumentFragment:class extends ye{},customElements:{get:function(){},define:function(){},whenDefined:function(){}},localStorage:{getItem(e){return null},setItem(e,t){},removeItem(e){}},CustomEvent:function(){},getComputedStyle:function(){},navigator:{languages:[],get userAgent(){return``}},matchMedia(e){return{matches:!1,media:e}},DOMParser:class{parseFromString(e,t){return{body:{textContent:e}}}}},Te=`global`in globalThis&&(globalThis==null?void 0:globalThis.global)===globalThis||typeof window>`u`||window.customElements===void 0,Ee=Object.keys(we).every(e=>e in globalThis),y=Te&&!Ee?we:globalThis,b=Te&&!Ee?Ce:globalThis.document,De=new WeakMap,Oe=e=>{let t=De.get(e);return t||De.set(e,t=new Set),t},ke=new y.ResizeObserver(e=>{for(let t of e)for(let e of Oe(t.target))e(t)});function Ae(e,t){Oe(e).add(t),ke.observe(e)}function je(e,t){let n=Oe(e);n.delete(t),n.size||ke.unobserve(e)}function x(e){let t={};for(let n of e)t[n.name]=n.value;return t}function Me(e){return Ne(e)??Re(e,`media-controller`)}function Ne(e){let{MEDIA_CONTROLLER:t}=s,n=e.getAttribute(t);if(n)return Be(e)?.getElementById(n)}var Pe=(e,t,n=`.value`)=>{let r=e.querySelector(n);r&&(r.textContent=t)},Fe=(e,t)=>{let n=`slot[name="${t}"]`,r=e.shadowRoot.querySelector(n);return r?r.children:[]},Ie=(e,t)=>Fe(e,t)[0],Le=(e,t)=>!e||!t?!1:e?.contains(t)?!0:Le(e,t.getRootNode().host),Re=(e,t)=>e?e.closest(t)||Re(e.getRootNode().host,t):null;function ze(e=document){let t=e?.activeElement;return t?ze(t.shadowRoot)??t:null}function Be(e){let t=(e?.getRootNode)?.call(e);return t instanceof ShadowRoot||t instanceof Document?t:null}function Ve(e,{depth:t=3,checkOpacity:n=!0,checkVisibilityCSS:r=!0}={}){if(e.checkVisibility)return e.checkVisibility({checkOpacity:n,checkVisibilityCSS:r});let i=e;for(;i&&t>0;){let e=getComputedStyle(i);if(n&&e.opacity===`0`||r&&e.visibility===`hidden`||e.display===`none`)return!1;i=i.parentElement,t--}return!0}function He(e,t,n,r){let i=r.x-n.x,a=r.y-n.y,o=i*i+a*a;if(o===0)return 0;let s=((e-n.x)*i+(t-n.y)*a)/o;return Math.max(0,Math.min(1,s))}function S(e,t){return Ue(e,e=>e===t)||We(e,t)}function Ue(e,t){let n;for(n of e.querySelectorAll(`style:not([media])`)??[]){let e;try{e=n.sheet?.cssRules}catch{continue}for(let n of e??[])if(t(n.selectorText))return n}}function We(e,t){let n=e.querySelectorAll(`style:not([media])`)??[],r=n?.[n.length-1];if(!r?.sheet)return console.warn(`Media Chrome: No style sheet found on style tag of`,e),{style:{setProperty:()=>{},removeProperty:()=>``,getPropertyValue:()=>``}};let i=r?.sheet.insertRule(`${t}{}`,r.sheet.cssRules.length);return r.sheet.cssRules?.[i]}function C(e,t,n=NaN){let r=e.getAttribute(t);return r==null?n:+r}function w(e,t,n){let r=+n;n==null||Number.isNaN(r)?e.hasAttribute(t)&&e.removeAttribute(t):C(e,t,void 0)!==r&&e.setAttribute(t,`${r}`)}function T(e,t){return e.hasAttribute(t)}function E(e,t,n){n==null?e.hasAttribute(t)&&e.removeAttribute(t):T(e,t)!=n&&e.toggleAttribute(t,n)}function D(e,t,n=null){return e.getAttribute(t)??n}function O(e,t,n){if(n==null){e.hasAttribute(t)&&e.removeAttribute(t);return}let r=`${n}`;D(e,t,void 0)!==r&&e.setAttribute(t,r)}var Ge=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},Ke=(e,t,n)=>(Ge(e,t,`read from private field`),n?n.call(e):t.get(e)),qe=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},Je=(e,t,n,r)=>(Ge(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),k;function Ye(e){return`
    <style>
      :host {
        display: var(--media-control-display, var(--media-gesture-receiver-display, inline-block));
        box-sizing: border-box;
      }
    </style>
  `}var Xe=class extends y.HTMLElement{constructor(){if(super(),qe(this,k,void 0),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=x(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}}static get observedAttributes(){return[s.MEDIA_CONTROLLER,u.MEDIA_PAUSED]}attributeChangedCallback(e,t,n){var r,i,a,o;e===s.MEDIA_CONTROLLER&&(t&&((i=(r=Ke(this,k))?.unassociateElement)==null||i.call(r,this),Je(this,k,null)),n&&this.isConnected&&(Je(this,k,this.getRootNode()?.getElementById(n)),(o=(a=Ke(this,k))?.associateElement)==null||o.call(a,this)))}connectedCallback(){var e,t;this.tabIndex=-1,this.setAttribute(`aria-hidden`,`true`),Je(this,k,Ze(this)),this.getAttribute(s.MEDIA_CONTROLLER)&&((t=(e=Ke(this,k))?.associateElement)==null||t.call(e,this)),Ke(this,k)&&(Ke(this,k).addEventListener(`pointerdown`,this),Ke(this,k).addEventListener(`click`,this),Ke(this,k).hasAttribute(`tabindex`)||(Ke(this,k).tabIndex=0))}disconnectedCallback(){var e,t,n,r;this.getAttribute(s.MEDIA_CONTROLLER)&&((t=(e=Ke(this,k))?.unassociateElement)==null||t.call(e,this)),(n=Ke(this,k))==null||n.removeEventListener(`pointerdown`,this),(r=Ke(this,k))==null||r.removeEventListener(`click`,this),Je(this,k,null)}handleEvent(e){let t=e.composedPath()?.[0];if([`video`,`media-controller`].includes(t?.localName)){if(e.type===`pointerdown`)this._pointerType=e.pointerType;else if(e.type===`click`){let{clientX:t,clientY:n}=e,{left:r,top:i,width:a,height:o}=this.getBoundingClientRect(),s=t-r,c=n-i;if(s<0||c<0||s>a||c>o||a===0&&o===0)return;let l=this._pointerType||`mouse`;if(this._pointerType=void 0,l===h.TOUCH){this.handleTap(e);return}if(l===h.MOUSE||l===h.PEN){this.handleMouseClick(e);return}}}}get mediaPaused(){return T(this,u.MEDIA_PAUSED)}set mediaPaused(e){E(this,u.MEDIA_PAUSED,e)}handleTap(e){}handleMouseClick(e){let t=this.mediaPaused?o.MEDIA_PLAY_REQUEST:o.MEDIA_PAUSE_REQUEST;this.dispatchEvent(new y.CustomEvent(t,{composed:!0,bubbles:!0}))}};k=new WeakMap,Xe.shadowRootOptions={mode:`open`},Xe.getTemplateHTML=Ye;function Ze(e){let t=e.getAttribute(s.MEDIA_CONTROLLER);return t?e.getRootNode()?.getElementById(t):Re(e,`media-controller`)}y.customElements.get(`media-gesture-receiver`)||y.customElements.define(`media-gesture-receiver`,Xe);var Qe=Xe,$e=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},A=(e,t,n)=>($e(e,t,`read from private field`),n?n.call(e):t.get(e)),j=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},M=(e,t,n,r)=>($e(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),et=(e,t,n)=>($e(e,t,`access private method`),n),tt,nt,rt,it,at,ot,st,ct,lt,ut,dt,ft,pt,mt,ht,gt,_t,vt,yt,bt,N={AUDIO:`audio`,AUTOHIDE:`autohide`,BREAKPOINTS:`breakpoints`,GESTURES_DISABLED:`gesturesdisabled`,KEYBOARD_CONTROL:`keyboardcontrol`,NO_AUTOHIDE:`noautohide`,USER_INACTIVE:`userinactive`,AUTOHIDE_OVER_CONTROLS:`autohideovercontrols`};function xt(e){return`
    <style>
      
      :host([${u.MEDIA_IS_FULLSCREEN}]) ::slotted([slot=media]) {
        outline: none;
      }

      :host {
        box-sizing: border-box;
        position: relative;
        display: inline-block;
        line-height: 0;
        background-color: var(--media-background-color, #000);
        overflow: hidden;
      }

      :host(:not([${N.AUDIO}])) [part~=layer]:not([part~=media-layer]) {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        display: flex;
        flex-flow: column nowrap;
        align-items: start;
        pointer-events: none;
        background: none;
      }

      slot[name=media] {
        display: var(--media-slot-display, contents);
      }

      
      :host([${N.AUDIO}]) slot[name=media] {
        display: var(--media-slot-display, none);
      }

      
      :host([${N.AUDIO}]) [part~=layer][part~=gesture-layer] {
        height: 0;
        display: block;
      }

      
      :host(:not([${N.AUDIO}])[${N.GESTURES_DISABLED}]) ::slotted([slot=gestures-chrome]),
          :host(:not([${N.AUDIO}])[${N.GESTURES_DISABLED}]) media-gesture-receiver[slot=gestures-chrome] {
        display: none;
      }

      
      ::slotted(:not([slot=media]):not([slot=poster]):not(media-loading-indicator):not([role=dialog]):not([hidden])) {
        pointer-events: auto;
      }

      :host(:not([${N.AUDIO}])) *[part~=layer][part~=centered-layer] {
        align-items: center;
        justify-content: center;
      }

      :host(:not([${N.AUDIO}])) ::slotted(media-gesture-receiver[slot=gestures-chrome]),
      :host(:not([${N.AUDIO}])) media-gesture-receiver[slot=gestures-chrome] {
        align-self: stretch;
        flex-grow: 1;
      }

      slot[name=middle-chrome] {
        display: inline;
        flex-grow: 1;
        pointer-events: none;
        background: none;
      }

      
      ::slotted([slot=media]),
      ::slotted([slot=poster]) {
        width: 100%;
        height: 100%;
      }

      
      :host(:not([${N.AUDIO}])) .spacer {
        flex-grow: 1;
      }

      
      :host(:-webkit-full-screen) {
        
        width: 100% !important;
        height: 100% !important;
      }

      
      ::slotted(:not([slot=media]):not([slot=poster]):not([${N.NO_AUTOHIDE}]):not([hidden]):not([role=dialog])) {
        opacity: 1;
        transition: var(--media-control-transition-in, opacity 0.25s);
      }

      
      :host([${N.USER_INACTIVE}]:not([${u.MEDIA_PAUSED}]):not([${u.MEDIA_IS_AIRPLAYING}]):not([${u.MEDIA_IS_CASTING}]):not([${N.AUDIO}])) ::slotted(:not([slot=media]):not([slot=poster]):not([${N.NO_AUTOHIDE}]):not([role=dialog])) {
        opacity: 0;
        transition: var(--media-control-transition-out, opacity 1s);
      }

      :host([${N.USER_INACTIVE}]:not([${N.NO_AUTOHIDE}]):not([${u.MEDIA_PAUSED}]):not([${u.MEDIA_IS_CASTING}]):not([${N.AUDIO}])) ::slotted([slot=media]) {
        cursor: none;
      }

      :host([${N.USER_INACTIVE}][${N.AUTOHIDE_OVER_CONTROLS}]:not([${N.NO_AUTOHIDE}]):not([${u.MEDIA_PAUSED}]):not([${u.MEDIA_IS_CASTING}]):not([${N.AUDIO}])) * {
        --media-cursor: none;
        cursor: none;
      }


      ::slotted(media-control-bar)  {
        align-self: stretch;
      }

      
      
      :host(:not([${N.AUDIO}])[${u.MEDIA_HAS_PLAYED}]) slot[name=poster],
      :host(:not([${N.AUDIO}])[${u.MEDIA_STREAM_TYPE}="${_.ON_DEMAND}"][${u.MEDIA_CURRENT_TIME}]:not([${u.MEDIA_CURRENT_TIME}="0"])) slot[name=poster] {
        display: none;
      }

      ::slotted([role=dialog]) {
        width: 100%;
        height: 100%;
        align-self: center;
      }

      ::slotted([role=menu]) {
        align-self: end;
      }
    </style>

    <slot name="media" part="layer media-layer"></slot>
    <slot name="poster" part="layer poster-layer"></slot>
    <slot name="gestures-chrome" part="layer gesture-layer">
      <media-gesture-receiver slot="gestures-chrome">
        <template shadowrootmode="${Qe.shadowRootOptions.mode}">
          ${Qe.getTemplateHTML({})}
        </template>
      </media-gesture-receiver>
    </slot>
    <span part="layer vertical-layer">
      <slot name="top-chrome" part="top chrome"></slot>
      <slot name="middle-chrome" part="middle chrome"></slot>
      <slot name="centered-chrome" part="layer centered-layer center centered chrome"></slot>
      
      <slot part="bottom chrome"></slot>
    </span>
    <slot name="dialog" part="layer dialog-layer"></slot>
  `}var St=Object.values(u),Ct=`sm:384 md:576 lg:768 xl:960`;function wt(e){Tt(e.target,e.contentRect.width)}function Tt(e,t){if(!e.isConnected)return;let n=Et(e.getAttribute(N.BREAKPOINTS)??Ct),r=Dt(n,t),i=!1;if(Object.keys(n).forEach(t=>{r.includes(t)?e.hasAttribute(`breakpoint${t}`)||(e.setAttribute(`breakpoint${t}`,``),i=!0):e.hasAttribute(`breakpoint${t}`)&&(e.removeAttribute(`breakpoint${t}`),i=!0)}),i){let t=new CustomEvent(d.BREAKPOINTS_CHANGE,{detail:r});e.dispatchEvent(t)}e.breakpointsComputed||(e.breakpointsComputed=!0,e.dispatchEvent(new CustomEvent(d.BREAKPOINTS_COMPUTED,{bubbles:!0,composed:!0})))}function Et(e){let t=e.split(/\s+/);return Object.fromEntries(t.map(e=>e.split(`:`)))}function Dt(e,t){return Object.keys(e).filter(n=>t>=parseInt(e[n]))}var Ot=class extends y.HTMLElement{constructor(){if(super(),j(this,lt),j(this,dt),j(this,pt),j(this,ht),j(this,_t),j(this,tt,void 0),j(this,nt,0),j(this,rt,null),j(this,it,null),j(this,at,void 0),this.breakpointsComputed=!1,j(this,ot,e=>{let t=this.media;for(let n of e){if(n.type!==`childList`)continue;let e=n.removedNodes;for(let r of e){if(r.slot!=`media`||n.target!=this)continue;let e=n.previousSibling&&n.previousSibling.previousElementSibling;if(!e||!t)this.mediaUnsetCallback(r);else{let t=e.slot!==`media`;for(;(e=e.previousSibling)!==null;)e.slot==`media`&&(t=!1);t&&this.mediaUnsetCallback(r)}}if(t)for(let e of n.addedNodes)e===t&&this.handleMediaUpdated(t)}}),j(this,st,!1),j(this,ct,e=>{A(this,st)||(setTimeout(()=>{wt(e),M(this,st,!1)},0),M(this,st,!0))}),j(this,yt,void 0),j(this,bt,()=>{A(this,yt).assignedElements({flatten:!0}).length?this.handleMediaUpdated(this.media):A(this,rt)&&this.mediaUnsetCallback(A(this,rt))}),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=x(this.attributes),t=this.constructor.getTemplateHTML(e);this.shadowRoot.setHTMLUnsafe?this.shadowRoot.setHTMLUnsafe(t):this.shadowRoot.innerHTML=t}M(this,tt,new MutationObserver(A(this,ot)))}static get observedAttributes(){return[N.AUTOHIDE,N.GESTURES_DISABLED].concat(St).filter(e=>![u.MEDIA_RENDITION_LIST,u.MEDIA_AUDIO_TRACK_LIST,u.MEDIA_CHAPTERS_CUES,u.MEDIA_WIDTH,u.MEDIA_HEIGHT,u.MEDIA_ERROR,u.MEDIA_ERROR_MESSAGE].includes(e))}attributeChangedCallback(e,t,n){e.toLowerCase()==N.AUTOHIDE&&(this.autohide=n)}get media(){let e=this.querySelector(`:scope > [slot=media]`);return e?.nodeName==`SLOT`&&(e=e.assignedElements({flatten:!0})[0]),e}async handleMediaUpdated(e){e&&(M(this,rt,e),e.localName.includes(`-`)&&await y.customElements.whenDefined(e.localName),this.mediaSetCallback(e))}connectedCallback(){var e;A(this,tt).observe(this,{childList:!0,subtree:!0}),Ae(this,A(this,ct));let t=this.getAttribute(N.AUDIO)==null?v(`video player`):v(`audio player`);this.setAttribute(`role`,`region`),this.setAttribute(`aria-label`,t),this.handleMediaUpdated(this.media),this.setAttribute(N.USER_INACTIVE,``),Tt(this,this.getBoundingClientRect().width);let n=this.querySelector(`:scope > slot[slot=media]`);n&&(M(this,yt,n),A(this,yt).addEventListener(`slotchange`,A(this,bt))),this.addEventListener(`pointerdown`,this),this.addEventListener(`pointermove`,this),this.addEventListener(`pointerup`,this),this.addEventListener(`mouseleave`,this),this.addEventListener(`keyup`,this),(e=y.window)==null||e.addEventListener(`mouseup`,this)}disconnectedCallback(){var e;je(this,A(this,ct)),clearTimeout(A(this,it)),A(this,tt).disconnect(),this.media&&this.mediaUnsetCallback(this.media),(e=y.window)==null||e.removeEventListener(`mouseup`,this),this.removeEventListener(`pointerdown`,this),this.removeEventListener(`pointermove`,this),this.removeEventListener(`pointerup`,this),this.removeEventListener(`mouseleave`,this),this.removeEventListener(`keyup`,this),A(this,yt)&&(A(this,yt).removeEventListener(`slotchange`,A(this,bt)),M(this,yt,null)),M(this,st,!1)}mediaSetCallback(e){}mediaUnsetCallback(e){M(this,rt,null)}handleEvent(e){switch(e.type){case`pointerdown`:M(this,nt,e.timeStamp);break;case`pointermove`:et(this,lt,ut).call(this,e);break;case`pointerup`:et(this,dt,ft).call(this,e);break;case`mouseleave`:et(this,pt,mt).call(this);break;case`mouseup`:this.removeAttribute(N.KEYBOARD_CONTROL);break;case`keyup`:et(this,_t,vt).call(this),this.setAttribute(N.KEYBOARD_CONTROL,``)}}set autohide(e){let t=Number(e);M(this,at,isNaN(t)?0:t)}get autohide(){return(A(this,at)===void 0?2:A(this,at)).toString()}get breakpoints(){return D(this,N.BREAKPOINTS)}set breakpoints(e){O(this,N.BREAKPOINTS,e)}get audio(){return T(this,N.AUDIO)}set audio(e){E(this,N.AUDIO,e)}get gesturesDisabled(){return T(this,N.GESTURES_DISABLED)}set gesturesDisabled(e){E(this,N.GESTURES_DISABLED,e)}get keyboardControl(){return T(this,N.KEYBOARD_CONTROL)}set keyboardControl(e){E(this,N.KEYBOARD_CONTROL,e)}get noAutohide(){return T(this,N.NO_AUTOHIDE)}set noAutohide(e){E(this,N.NO_AUTOHIDE,e)}get autohideOverControls(){return T(this,N.AUTOHIDE_OVER_CONTROLS)}set autohideOverControls(e){E(this,N.AUTOHIDE_OVER_CONTROLS,e)}get userInteractive(){return T(this,N.USER_INACTIVE)}set userInteractive(e){E(this,N.USER_INACTIVE,e)}};tt=new WeakMap,nt=new WeakMap,rt=new WeakMap,it=new WeakMap,at=new WeakMap,ot=new WeakMap,st=new WeakMap,ct=new WeakMap,lt=new WeakSet,ut=function(e){if(e.pointerType!==`mouse`&&e.timeStamp-A(this,nt)<250)return;et(this,ht,gt).call(this),clearTimeout(A(this,it));let t=this.hasAttribute(N.AUTOHIDE_OVER_CONTROLS);([this,this.media].includes(e.target)||t)&&et(this,_t,vt).call(this)},dt=new WeakSet,ft=function(e){if(e.pointerType===`touch`){let t=!this.hasAttribute(N.USER_INACTIVE);[this,this.media].includes(e.target)&&t?et(this,pt,mt).call(this):et(this,_t,vt).call(this)}else e.composedPath().some(e=>[`media-play-button`,`media-fullscreen-button`].includes(e?.localName))&&et(this,_t,vt).call(this)},pt=new WeakSet,mt=function(){if(A(this,at)<0||this.hasAttribute(N.USER_INACTIVE))return;this.setAttribute(N.USER_INACTIVE,``);let e=new y.CustomEvent(d.USER_INACTIVE_CHANGE,{composed:!0,bubbles:!0,detail:!0});this.dispatchEvent(e)},ht=new WeakSet,gt=function(){if(!this.hasAttribute(N.USER_INACTIVE))return;this.removeAttribute(N.USER_INACTIVE);let e=new y.CustomEvent(d.USER_INACTIVE_CHANGE,{composed:!0,bubbles:!0,detail:!1});this.dispatchEvent(e)},_t=new WeakSet,vt=function(){et(this,ht,gt).call(this),clearTimeout(A(this,it));let e=parseInt(this.autohide);e<0||M(this,it,setTimeout(()=>{et(this,pt,mt).call(this)},e*1e3))},yt=new WeakMap,bt=new WeakMap,Ot.shadowRootOptions={mode:`open`},Ot.getTemplateHTML=xt,y.customElements.get(`media-container`)||y.customElements.define(`media-container`,Ot);var kt=Ot,At=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},jt=(e,t,n)=>(At(e,t,`read from private field`),n?n.call(e):t.get(e)),Mt=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},Nt=(e,t,n,r)=>(At(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Pt=(e,t,n)=>(At(e,t,`access private method`),n),Ft,It,Lt,Rt,zt,Bt,Vt,Ht,Ut,Wt,Gt,Kt,qt,Jt,Yt;function Xt(e){return`
    <style>
      :host {
        font: var(--media-font,
          var(--media-font-weight, normal)
          var(--media-font-size, 14px) /
          var(--media-text-content-height, var(--media-control-height, 24px))
          var(--media-font-family, helvetica neue, segoe ui, roboto, arial, sans-serif));
        color: var(--media-text-color, var(--media-primary-color, rgb(238 238 238)));
        display: var(--media-dialog-display, inline-flex);
        justify-content: center;
        align-items: center;
        
        transition-behavior: allow-discrete;
        visibility: hidden;
        opacity: 0;
        transform: translateY(2px) scale(.99);
        pointer-events: none;
      }

      :host([open]) {
        transition: display .2s, visibility 0s, opacity .2s ease-out, transform .15s ease-out;
        visibility: visible;
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }

      #content {
        display: flex;
        position: relative;
        box-sizing: border-box;
        width: min(320px, 100%);
        word-wrap: break-word;
        max-height: 100%;
        overflow: auto;
        text-align: center;
        line-height: 1.4;
      }
    </style>
    ${this.getSlotTemplateHTML(e)}
  `}function Zt(e){return`
    <slot id="content"></slot>
  `}var Qt={OPEN:`open`,ANCHOR:`anchor`},$t=class extends y.HTMLElement{constructor(){super(),Mt(this,Rt),Mt(this,Bt),Mt(this,Ht),Mt(this,Wt),Mt(this,Kt),Mt(this,Jt),Mt(this,Ft,!1),Mt(this,It,null),Mt(this,Lt,null)}static get observedAttributes(){return[Qt.OPEN,Qt.ANCHOR]}get open(){return T(this,Qt.OPEN)}set open(e){E(this,Qt.OPEN,e)}handleEvent(e){switch(e.type){case`invoke`:Pt(this,Wt,Gt).call(this,e);break;case`focusout`:Pt(this,Kt,qt).call(this,e);break;case`keydown`:Pt(this,Jt,Yt).call(this,e)}}connectedCallback(){Pt(this,Rt,zt).call(this),this.role||=`dialog`,this.addEventListener(`invoke`,this),this.addEventListener(`focusout`,this),this.addEventListener(`keydown`,this)}disconnectedCallback(){this.removeEventListener(`invoke`,this),this.removeEventListener(`focusout`,this),this.removeEventListener(`keydown`,this)}attributeChangedCallback(e,t,n){Pt(this,Rt,zt).call(this),e===Qt.OPEN&&n!==t&&(this.open?Pt(this,Bt,Vt).call(this):Pt(this,Ht,Ut).call(this))}focus(){Nt(this,It,ze());let e=!this.dispatchEvent(new Event(`focus`,{composed:!0,cancelable:!0})),t=!this.dispatchEvent(new Event(`focusin`,{composed:!0,bubbles:!0,cancelable:!0}));e||t||this.querySelector(`[autofocus], [tabindex]:not([tabindex="-1"]), [role="menu"]`)?.focus()}get keysUsed(){return[`Escape`,`Tab`]}};Ft=new WeakMap,It=new WeakMap,Lt=new WeakMap,Rt=new WeakSet,zt=function(){if(!jt(this,Ft)&&(Nt(this,Ft,!0),!this.shadowRoot)){this.attachShadow(this.constructor.shadowRootOptions);let e=x(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e),queueMicrotask(()=>{let{style:e}=S(this.shadowRoot,`:host`);e.setProperty(`transition`,`display .15s, visibility .15s, opacity .15s ease-in, transform .15s ease-in`)})}},Bt=new WeakSet,Vt=function(){var e;(e=jt(this,Lt))==null||e.setAttribute(`aria-expanded`,`true`),this.dispatchEvent(new Event(`open`,{composed:!0,bubbles:!0})),this.addEventListener(`transitionend`,()=>this.focus(),{once:!0})},Ht=new WeakSet,Ut=function(){var e;(e=jt(this,Lt))==null||e.setAttribute(`aria-expanded`,`false`),this.dispatchEvent(new Event(`close`,{composed:!0,bubbles:!0}))},Wt=new WeakSet,Gt=function(e){Nt(this,Lt,e.relatedTarget),Le(this,e.relatedTarget)||(this.open=!this.open)},Kt=new WeakSet,qt=function(e){var t;Le(this,e.relatedTarget)||((t=jt(this,It))==null||t.focus(),jt(this,Lt)&&jt(this,Lt)!==e.relatedTarget&&this.open&&(this.open=!1))},Jt=new WeakSet,Yt=function(e){var t,n,r,i,a;let{key:o,ctrlKey:s,altKey:c,metaKey:l}=e;s||c||l||this.keysUsed.includes(o)&&(e.preventDefault(),e.stopPropagation(),o===`Tab`?(e.shiftKey?(n=(t=this.previousElementSibling)?.focus)==null||n.call(t):(i=(r=this.nextElementSibling)?.focus)==null||i.call(r),this.blur()):o===`Escape`&&((a=jt(this,It))==null||a.focus(),this.open=!1))},$t.shadowRootOptions={mode:`open`},$t.getTemplateHTML=Xt,$t.getSlotTemplateHTML=Zt,y.customElements.get(`media-chrome-dialog`)||y.customElements.define(`media-chrome-dialog`,$t);var en=$t,tn=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},nn=(e,t,n)=>(tn(e,t,`read from private field`),n?n.call(e):t.get(e)),rn=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},an,on,sn={HOTKEYS:`hotkeys`},cn=[{keys:[{key:` `,label:`Space`},{key:`k`}],description:`Toggle Playback`},{keys:[{key:`m`}],description:`Toggle mute`},{keys:[{key:`f`}],description:`Toggle fullscreen`},{keys:[{key:`c`}],description:`Toggle captions or subtitles, if available`},{keys:[{key:`p`}],description:`Toggle Picture in Picture`},{keys:[{key:`ArrowLeft`,label:`←`},{key:`j`}],description:`Seek back 10s`},{keys:[{key:`ArrowRight`,label:`→`},{key:`l`}],description:`Seek forward 10s`},{keys:[{key:`ArrowUp`,label:`↑`}],description:`Turn volume up`},{keys:[{key:`ArrowDown`,label:`↓`}],description:`Turn volume down`},{keys:[{key:`<`,label:`< (SHIFT+,)`}],description:`Decrease playback rate`},{keys:[{key:`>`,label:`> (SHIFT+.)`}],description:`Increase playback rate`},{keys:[{key:`shift+/`,label:`SHIFT+/`}],description:`Show keyboard shortcuts`}];function ln(e){return e===` `?`nospace`:`no${e.toLowerCase()}`}function un(e){let t=new Set(e?.split(/\s+/));return cn.map(({keys:e,description:n})=>({keys:e.filter(({key:e})=>!t.has(ln(e))),description:n})).filter(({keys:e})=>e.length)}function dn(e){return`
    <style>
      :host {
        position: fixed;
        top: 0;
        left: 0;
        z-index: 9999;
        background: rgb(20 20 30 / .8);
        backdrop-filter: blur(10px);
      }

      #content {
        display: block;
        width: clamp(400px, 40vw, 700px);
        max-width: 90vw;
        text-align: left;
      }

      h2 {
        margin: 0 0 1.5rem 0;
        font-size: 1.5rem;
        font-weight: 500;
        text-align: center;
      }

      .shortcuts-table {
        width: 100%;
        border-collapse: collapse;
      }

      .shortcuts-table tr {
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .shortcuts-table tr:last-child {
        border-bottom: none;
      }

      .shortcuts-table td {
        padding: 0.75rem 0.5rem;
      }

      .shortcuts-table td:first-child {
        text-align: right;
        padding-right: 1rem;
        width: 40%;
        min-width: 120px;
      }

      .shortcuts-table td:last-child {
        padding-left: 1rem;
      }

      .key {
        display: inline-block;
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        padding: 0.25rem 0.5rem;
        font-family: 'Courier New', monospace;
        font-size: 0.9rem;
        font-weight: 500;
        min-width: 1.5rem;
        text-align: center;
        margin: 0 0.2rem;
      }

      .description {
        color: rgba(255, 255, 255, 0.9);
        font-size: 0.95rem;
      }

      .key-combo {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.3rem;
      }

      .key-separator {
        color: rgba(255, 255, 255, 0.5);
        font-size: 0.9rem;
      }
    </style>
    <slot id="content">
      ${fn(e[sn.HOTKEYS])}
    </slot>
  `}function fn(e){return`
    <h2>Keyboard Shortcuts</h2>
    <table class="shortcuts-table">${un(e).map(({keys:e,description:t})=>`
        <tr>
          <td>
            <div class="key-combo">${e.map(({key:e,label:t=e},n)=>n>0?`<span class="key-separator">or</span><span class="key">${t}</span>`:`<span class="key">${t}</span>`).join(``)}</div>
          </td>
          <td class="description">${t}</td>
        </tr>
      `).join(``)}</table>
  `}var pn=class extends $t{constructor(){super(...arguments),rn(this,an,e=>{if(!this.open)return;let t=this.shadowRoot?.querySelector(`#content`);if(!t)return;let n=e.composedPath(),r=n[0]===this||n.includes(this),i=n.includes(t);r&&!i&&(this.open=!1)}),rn(this,on,e=>{if(!this.open)return;let t=e.shiftKey&&(e.key===`/`||e.key===`?`);e.key!==`Escape`&&!t||e.ctrlKey||e.altKey||e.metaKey||(this.open=!1,e.preventDefault(),e.stopPropagation())})}static get observedAttributes(){return[...super.observedAttributes,sn.HOTKEYS]}get hotkeys(){return D(this,sn.HOTKEYS)??void 0}set hotkeys(e){O(this,sn.HOTKEYS,e)}connectedCallback(){super.connectedCallback(),this.open&&(this.addEventListener(`click`,nn(this,an)),document.addEventListener(`keydown`,nn(this,on)))}disconnectedCallback(){this.removeEventListener(`click`,nn(this,an)),document.removeEventListener(`keydown`,nn(this,on))}attributeChangedCallback(e,t,n){if(super.attributeChangedCallback(e,t,n),e===`open`)this.open?(this.addEventListener(`click`,nn(this,an)),document.addEventListener(`keydown`,nn(this,on))):(this.removeEventListener(`click`,nn(this,an)),document.removeEventListener(`keydown`,nn(this,on)));else if(e===sn.HOTKEYS&&n!==t){let e=this.shadowRoot?.querySelector(`#content`);e&&(e.innerHTML=fn(n))}}};an=new WeakMap,on=new WeakMap,pn.getSlotTemplateHTML=dn,y.customElements.get(`media-keyboard-shortcuts-dialog`)||y.customElements.define(`media-keyboard-shortcuts-dialog`,pn);var mn=pn,hn=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},P=(e,t,n)=>(hn(e,t,`read from private field`),n?n.call(e):t.get(e)),gn=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},_n=(e,t,n,r)=>(hn(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),vn,yn,bn,xn,Sn,Cn,wn=class{constructor(e,t,{defaultValue:n}={defaultValue:void 0}){gn(this,Sn),gn(this,vn,void 0),gn(this,yn,void 0),gn(this,bn,void 0),gn(this,xn,new Set),_n(this,vn,e),_n(this,yn,t),_n(this,bn,new Set(n))}[Symbol.iterator](){return P(this,Sn,Cn).values()}get length(){return P(this,Sn,Cn).size}get value(){return[...P(this,Sn,Cn)].join(` `)??``}set value(e){e!==this.value&&(_n(this,xn,new Set),this.add(...e?.split(` `)??[]))}toString(){return this.value}item(e){return[...P(this,Sn,Cn)][e]}values(){return P(this,Sn,Cn).values()}forEach(e,t){P(this,Sn,Cn).forEach(e,t)}add(...e){var t;e.forEach(e=>P(this,xn).add(e)),this.value===``&&!P(this,vn)?.hasAttribute(`${P(this,yn)}`)||(t=P(this,vn))==null||t.setAttribute(`${P(this,yn)}`,`${this.value}`)}remove(...e){var t;e.forEach(e=>P(this,xn).delete(e)),(t=P(this,vn))==null||t.setAttribute(`${P(this,yn)}`,`${this.value}`)}contains(e){return P(this,Sn,Cn).has(e)}toggle(e,t){return t===void 0?this.contains(e)?(this.remove(e),!1):(this.add(e),!0):t?(this.add(e),!0):(this.remove(e),!1)}replace(e,t){return this.remove(e),this.add(t),e===t}};vn=new WeakMap,yn=new WeakMap,bn=new WeakMap,xn=new WeakMap,Sn=new WeakSet,Cn=function(){return P(this,xn).size?P(this,xn):P(this,bn)};var Tn=(e=``)=>e.split(/\s+/),En=(e=``)=>{let[t,n,r]=e.split(`:`),i=r?decodeURIComponent(r):void 0;return{kind:t===`cc`?p.CAPTIONS:p.SUBTITLES,language:n,label:i}},Dn=(e=``,t={})=>Tn(e).map(e=>{let n=En(e);return{...t,...n}}),On=e=>e?Array.isArray(e)?e.map(e=>typeof e==`string`?En(e):e):typeof e==`string`?Dn(e):[e]:[],kn=({kind:e,label:t,language:n}={kind:`subtitles`})=>t?`${e===`captions`?`cc`:`sb`}:${n}:${encodeURIComponent(t)}`:n,An=(e=[])=>Array.prototype.map.call(e,kn).join(` `),jn=(e,t)=>n=>n[e]===t,Mn=e=>{let t=Object.entries(e).map(([e,t])=>jn(e,t));return e=>t.every(t=>t(e))},Nn=(e,t=[],n=[])=>{let r=On(n).map(Mn);Array.from(t).filter(e=>r.some(t=>t(e))).forEach(t=>{t.mode=e})},Pn=(e,t=()=>!0)=>{if(!e?.textTracks)return[];let n=typeof t==`function`?t:Mn(t);return Array.from(e.textTracks).filter(n)},Fn=e=>!!e.mediaSubtitlesShowing?.length||e.hasAttribute(u.MEDIA_SUBTITLES_SHOWING),In=e=>{let{media:t,fullscreenElement:n}=e;try{let e=n&&`requestFullscreen`in n?`requestFullscreen`:n&&`webkitRequestFullScreen`in n?`webkitRequestFullScreen`:void 0;if(e){let t=n[e]?.call(n);if(t instanceof Promise)return t.catch(()=>{})}else t?.webkitEnterFullscreen?t.webkitEnterFullscreen():t?.requestFullscreen&&t.requestFullscreen()}catch(e){console.error(e)}},Ln=`exitFullscreen`in b?`exitFullscreen`:`webkitExitFullscreen`in b?`webkitExitFullscreen`:`webkitCancelFullScreen`in b?`webkitCancelFullScreen`:void 0,Rn=e=>{let{documentElement:t}=e;if(Ln){let e=(t?.[Ln])?.call(t);if(e instanceof Promise)return e.catch(()=>{})}},zn=`fullscreenElement`in b?`fullscreenElement`:`webkitFullscreenElement`in b?`webkitFullscreenElement`:void 0,Bn=e=>{let{documentElement:t,media:n}=e,r=t?.[zn];return!r&&`webkitDisplayingFullscreen`in n&&`webkitPresentationMode`in n&&n.webkitDisplayingFullscreen&&n.webkitPresentationMode===ee.FULLSCREEN?n:r},Vn=e=>{let{media:t,documentElement:n,fullscreenElement:r=t}=e;if(!t||!n)return!1;let i=Bn(e);if(!i)return!1;if(i===r||i===t)return!0;if(i.localName.includes(`-`)){let e=i.shadowRoot;if(!(zn in e))return Le(i,r);for(;e?.[zn];){if(e[zn]===r)return!0;e=e[zn]?.shadowRoot}}return!1},Hn=`fullscreenEnabled`in b?`fullscreenEnabled`:`webkitFullscreenEnabled`in b?`webkitFullscreenEnabled`:void 0,Un=e=>{let{documentElement:t,media:n}=e;return!!t?.[Hn]||n&&`webkitSupportsFullscreen`in n},Wn,Gn=()=>{var e;return Wn||(Wn=((e=b)?.createElement)?.call(e,`video`),Wn)},Kn=async(e=Gn())=>{if(!e)return!1;let t=e.volume;e.volume=t/2+.1;let n=new AbortController,r=await Promise.race([qn(e,n.signal),Jn(e,t)]);return n.abort(),r},qn=(e,t)=>new Promise(n=>{e.addEventListener(`volumechange`,()=>n(!0),{signal:t})}),Jn=async(e,t)=>{for(let n=0;n<10;n++){if(e.volume===t)return!1;await oe(10)}return e.volume!==t},Yn=/.*Version\/.*Safari\/.*/.test(y.navigator.userAgent),Xn=(e=Gn())=>y.matchMedia(`(display-mode: standalone)`).matches&&Yn?!1:typeof e?.requestPictureInPicture==`function`,Zn=(e=Gn())=>Un({documentElement:b,media:e}),Qn=Zn(),$n=Xn(),er=!!y.WebKitPlaybackTargetAvailabilityEvent,tr=!!y.chrome,nr=e=>Pn(e.media,e=>[p.SUBTITLES,p.CAPTIONS].includes(e.kind)).sort((e,t)=>e.kind>=t.kind?1:-1),rr=e=>Pn(e.media,e=>e.mode===m.SHOWING&&[p.SUBTITLES,p.CAPTIONS].includes(e.kind)),ir=(e,t)=>{let n=nr(e),r=rr(e),i=!!r.length;if(n.length){if(t===!1||i&&t!==!0)Nn(m.DISABLED,n,r);else if(t===!0||!i&&t!==!1){let t=n[0],{options:i}=e;if(!i?.noSubtitlesLangPref){let e=y.localStorage.getItem(`media-chrome-pref-subtitles-lang`),r=e?[e,...y.navigator.languages]:y.navigator.languages,i=n.filter(e=>r.some(t=>e.language.toLowerCase().startsWith(t.split(`-`)[0]))).sort((e,t)=>r.findIndex(t=>e.language.toLowerCase().startsWith(t.split(`-`)[0]))-r.findIndex(e=>t.language.toLowerCase().startsWith(e.split(`-`)[0])));i[0]&&(t=i[0])}let{language:a,label:o,kind:s}=t;Nn(m.DISABLED,n,r),Nn(m.SHOWING,n,[{language:a,label:o,kind:s}])}}},ar=(e,t)=>e===t?!0:e==null||t==null||typeof e!=typeof t?!1:typeof e==`number`&&Number.isNaN(e)&&Number.isNaN(t)?!0:typeof e==`object`?Array.isArray(e)?or(e,t):Object.entries(e).every(([e,n])=>e in t&&ar(n,t[e])):!1,or=(e,t)=>{let n=Array.isArray(e),r=Array.isArray(t);return n===r?n||r?e.length===t.length&&e.every((e,n)=>ar(e,t[n])):!0:!1},sr=Object.values(_),cr,lr=Kn().then(e=>(cr=e,cr)),ur=async(...e)=>{await Promise.all(e.filter(e=>e).map(async e=>{if(!(`localName`in e&&e instanceof y.HTMLElement))return;let t=e.localName;if(!t.includes(`-`))return;let n=y.customElements.get(t);n&&e instanceof n||(await y.customElements.whenDefined(t),y.customElements.upgrade(e))}))},dr=new y.DOMParser,fr=e=>e&&(dr.parseFromString(e,`text/html`).body.textContent||e),pr={mediaError:{get(e,t){let{media:n}=e;if(t?.type!==`playing`)return n?.error},mediaEvents:[`emptied`,`error`,`playing`]},mediaErrorCode:{get(e,t){let{media:n}=e;if(t?.type!==`playing`)return n?.error?.code},mediaEvents:[`emptied`,`error`,`playing`]},mediaErrorMessage:{get(e,t){let{media:n}=e;if(t?.type!==`playing`)return n?.error?.message??``},mediaEvents:[`emptied`,`error`,`playing`]},mediaWidth:{get(e){let{media:t}=e;return t?.videoWidth??0},mediaEvents:[`resize`]},mediaHeight:{get(e){let{media:t}=e;return t?.videoHeight??0},mediaEvents:[`resize`]},mediaPaused:{get(e){let{media:t}=e;return t?.paused??!0},set(e,t){var n;let{media:r}=t;r&&(e?r.pause():(n=r.play())==null||n.catch(()=>{}))},mediaEvents:[`play`,`playing`,`pause`,`emptied`]},mediaHasPlayed:{get(e,t){let{media:n}=e;return n?t?t.type===`playing`:!n.paused:!1},mediaEvents:[`playing`,`emptied`]},mediaEnded:{get(e){let{media:t}=e;return t?.ended??!1},mediaEvents:[`seeked`,`ended`,`emptied`]},mediaPlaybackRate:{get(e){let{media:t}=e;return t?.playbackRate??1},set(e,t){let{media:n}=t;n&&Number.isFinite(+e)&&(n.playbackRate=+e)},mediaEvents:[`ratechange`,`loadstart`]},mediaMuted:{get(e){let{media:t}=e;return t?.muted??!1},set(e,t){let{media:n,options:{noMutedPref:r}={}}=t;if(n){n.muted=e;try{let t=y.localStorage.getItem(`media-chrome-pref-muted`)!==null,i=n.hasAttribute(`muted`);if(r){t&&y.localStorage.removeItem(`media-chrome-pref-muted`);return}if(i&&!t)return;y.localStorage.setItem(`media-chrome-pref-muted`,e?`true`:`false`)}catch(e){console.debug(`Error setting muted pref`,e)}}},mediaEvents:[`volumechange`],stateOwnersUpdateHandlers:[(e,t)=>{let{options:{noMutedPref:n}}=t,{media:r}=t;if(!(!r||r.muted||n))try{let n=y.localStorage.getItem(`media-chrome-pref-muted`)===`true`;pr.mediaMuted.set(n,t),e(n)}catch(e){console.debug(`Error getting muted pref`,e)}}]},mediaLoop:{get(e){let{media:t}=e;return t?.loop},set(e,t){let{media:n}=t;n&&(n.loop=e)},mediaEvents:[`medialooprequest`]},mediaVolume:{get(e){let{media:t}=e;return t?.volume??1},set(e,t){let{media:n,options:{noVolumePref:r}={}}=t;if(n){try{e==null?y.localStorage.removeItem(`media-chrome-pref-volume`):!n.hasAttribute(`muted`)&&!r&&y.localStorage.setItem(`media-chrome-pref-volume`,e.toString())}catch(e){console.debug(`Error setting volume pref`,e)}Number.isFinite(+e)&&(n.volume=+e)}},mediaEvents:[`volumechange`],stateOwnersUpdateHandlers:[(e,t)=>{let{options:{noVolumePref:n}}=t;if(!n)try{let{media:n}=t;if(!n)return;let r=y.localStorage.getItem(`media-chrome-pref-volume`);if(r==null)return;pr.mediaVolume.set(+r,t),e(+r)}catch(e){console.debug(`Error getting volume pref`,e)}}]},mediaVolumeLevel:{get(e){let{media:t}=e;return t?.volume===void 0?`high`:t.muted||t.volume===0?`off`:t.volume<.5?`low`:t.volume<.75?`medium`:`high`},mediaEvents:[`volumechange`]},mediaCurrentTime:{get(e){let{media:t}=e;return t?.currentTime??0},set(e,t){let{media:n}=t;n&&ae(e)&&(n.currentTime=e)},mediaEvents:[`timeupdate`,`loadedmetadata`,`seeking`]},mediaDuration:{get(e){let{media:t,options:{defaultDuration:n}={}}=e;return n&&(!t||!t.duration||Number.isNaN(t.duration)||!Number.isFinite(t.duration))?n:Number.isFinite(t?.duration)?t.duration:NaN},mediaEvents:[`durationchange`,`loadedmetadata`,`emptied`]},mediaLoading:{get(e){let{media:t}=e;return t?.readyState<3},mediaEvents:[`waiting`,`playing`,`emptied`]},mediaSeekable:{get(e){let{media:t}=e;if(!t?.seekable?.length)return;let n=t.seekable.start(0),r=t.seekable.end(t.seekable.length-1);if(n||r)return[Number(n.toFixed(3)),Number(r.toFixed(3))]},mediaEvents:[`loadedmetadata`,`emptied`,`progress`,`seekablechange`]},mediaBuffered:{get(e){let{media:t}=e,n=t?.buffered??[];return Array.from(n).map((e,t)=>[Number(n.start(t).toFixed(3)),Number(n.end(t).toFixed(3))])},mediaEvents:[`progress`,`emptied`]},mediaStreamType:{get(e){let{media:t,options:{defaultStreamType:n}={}}=e,r=[_.LIVE,_.ON_DEMAND].includes(n)?n:void 0;if(!t)return r;let{streamType:i}=t;if(sr.includes(i))return i===_.UNKNOWN?r:i;let a=t.duration;return a===1/0?_.LIVE:Number.isFinite(a)?_.ON_DEMAND:r},mediaEvents:[`emptied`,`durationchange`,`loadedmetadata`,`streamtypechange`]},mediaTargetLiveWindow:{get(e){let{media:t}=e;if(!t)return NaN;let{targetLiveWindow:n}=t,r=pr.mediaStreamType.get(e);return(n==null||Number.isNaN(n))&&r===_.LIVE?0:n},mediaEvents:[`emptied`,`durationchange`,`loadedmetadata`,`streamtypechange`,`targetlivewindowchange`]},mediaTimeIsLive:{get(e){let{media:t,options:{liveEdgeOffset:n=10}={}}=e;if(!t)return!1;if(typeof t.liveEdgeStart==`number`)return!Number.isNaN(t.liveEdgeStart)&&t.currentTime>=t.liveEdgeStart;if(pr.mediaStreamType.get(e)!==_.LIVE)return!1;let r=t.seekable;if(!r)return!0;if(!r.length)return!1;let i=r.end(r.length-1)-n;return t.currentTime>=i},mediaEvents:[`playing`,`timeupdate`,`progress`,`waiting`,`emptied`]},mediaSubtitlesList:{get(e){return nr(e).map(({kind:e,label:t,language:n})=>({kind:e,label:t,language:n}))},mediaEvents:[`loadstart`],textTracksEvents:[`addtrack`,`removetrack`]},mediaSubtitlesShowing:{get(e){return rr(e).map(({kind:e,label:t,language:n})=>({kind:e,label:t,language:n}))},mediaEvents:[`loadstart`],textTracksEvents:[`addtrack`,`removetrack`,`change`],stateOwnersUpdateHandlers:[(e,t)=>{var n,r;let{media:i,options:a}=t;if(!i)return;let o=e=>{a.defaultSubtitles&&(!e||[p.CAPTIONS,p.SUBTITLES].includes(e?.track?.kind))&&ir(t,!0)};return i.addEventListener(`loadstart`,o),(n=i.textTracks)==null||n.addEventListener(`addtrack`,o),(r=i.textTracks)==null||r.addEventListener(`removetrack`,o),()=>{var e,t;i.removeEventListener(`loadstart`,o),(e=i.textTracks)==null||e.removeEventListener(`addtrack`,o),(t=i.textTracks)==null||t.removeEventListener(`removetrack`,o)}}]},mediaChaptersCues:{get(e){let{media:t}=e;if(!t)return[];let[n]=Pn(t,{kind:p.CHAPTERS});return Array.from(n?.cues??[]).map(({text:e,startTime:t,endTime:n})=>({text:fr(e),startTime:t,endTime:n}))},mediaEvents:[`loadstart`,`loadedmetadata`],textTracksEvents:[`addtrack`,`removetrack`,`change`],stateOwnersUpdateHandlers:[(e,t)=>{let{media:n}=t;if(!n)return;let r=n.querySelector(`track[kind="chapters"][default][src]`),i=n.shadowRoot?.querySelector(`:is(video,audio) > track[kind="chapters"][default][src]`);return r?.addEventListener(`load`,e),i?.addEventListener(`load`,e),()=>{r?.removeEventListener(`load`,e),i?.removeEventListener(`load`,e)}}]},mediaIsPip:{get(e){let{media:t,documentElement:n}=e;if(!t||!n||!n.pictureInPictureElement)return!1;if(n.pictureInPictureElement===t)return!0;if(n.pictureInPictureElement instanceof HTMLMediaElement)return t.localName?.includes(`-`)?Le(t,n.pictureInPictureElement):!1;if(n.pictureInPictureElement.localName.includes(`-`)){let e=n.pictureInPictureElement.shadowRoot;for(;e?.pictureInPictureElement;){if(e.pictureInPictureElement===t)return!0;e=e.pictureInPictureElement?.shadowRoot}}return!1},set(e,t){let{media:n}=t;if(n){if(e){if(!b.pictureInPictureEnabled){console.warn(`MediaChrome: Picture-in-picture is not enabled`);return}if(!n.requestPictureInPicture){console.warn(`MediaChrome: The current media does not support picture-in-picture`);return}let e=()=>{console.warn(`MediaChrome: The media is not ready for picture-in-picture. It must have a readyState > 0.`)};n.requestPictureInPicture().catch(t=>{if(t.code===11){if(!n.src){console.warn(`MediaChrome: The media is not ready for picture-in-picture. It must have a src set.`);return}if(n.readyState===0&&n.preload===`none`){let t=()=>{n.removeEventListener(`loadedmetadata`,r),n.preload=`none`},r=()=>{n.requestPictureInPicture().catch(e),t()};n.addEventListener(`loadedmetadata`,r),n.preload=`metadata`,setTimeout(()=>{n.readyState===0&&e(),t()},1e3)}else throw t}else throw t})}else b.pictureInPictureElement&&b.exitPictureInPicture()}},mediaEvents:[`enterpictureinpicture`,`leavepictureinpicture`]},mediaRenditionList:{get(e){let{media:t}=e;return[...t?.videoRenditions??[]].map(e=>({...e}))},mediaEvents:[`emptied`,`loadstart`],videoRenditionsEvents:[`addrendition`,`removerendition`]},mediaRenditionSelected:{get(e){let{media:t}=e;return t?.videoRenditions?.[t.videoRenditions?.selectedIndex]?.id},set(e,t){let{media:n}=t;if(!n?.videoRenditions){console.warn(`MediaController: Rendition selection not supported by this media.`);return}let r=e,i=Array.prototype.findIndex.call(n.videoRenditions,e=>e.id==r);n.videoRenditions.selectedIndex!=i&&(n.videoRenditions.selectedIndex=i)},mediaEvents:[`emptied`],videoRenditionsEvents:[`addrendition`,`removerendition`,`change`]},mediaAudioTrackList:{get(e){let{media:t}=e;return[...t?.audioTracks??[]]},mediaEvents:[`emptied`,`loadstart`],audioTracksEvents:[`addtrack`,`removetrack`]},mediaAudioTrackEnabled:{get(e){let{media:t}=e;return[...t?.audioTracks??[]].find(e=>e.enabled)?.id},set(e,t){let{media:n}=t;if(!n?.audioTracks){console.warn(`MediaChrome: Audio track selection not supported by this media.`);return}let r=e;for(let e of n.audioTracks)e.enabled=r==e.id},mediaEvents:[`emptied`],audioTracksEvents:[`addtrack`,`removetrack`,`change`]},mediaIsFullscreen:{get(e){return Vn(e)},set(e,t,n){var r;e?(In(t),n.detail&&!t.media?.inert&&((r=t.media)==null||r.focus())):Rn(t)},rootEvents:[`fullscreenchange`,`webkitfullscreenchange`],mediaEvents:[`webkitbeginfullscreen`,`webkitendfullscreen`,`webkitpresentationmodechanged`]},mediaIsCasting:{get(e){let{media:t}=e;return!t?.remote||t.remote?.state===`disconnected`?!1:t.remote.state===`connected`},set(e,t){let{media:n}=t;n&&(e&&n.remote?.state!==`disconnected`||(e||n.remote?.state===`connected`)&&(typeof n.remote.prompt==`function`?n.remote.prompt().catch(()=>{}):console.warn(`MediaChrome: Casting is not supported in this environment`)))},remoteEvents:[`connect`,`connecting`,`disconnect`]},mediaIsAirplaying:{get(){return!1},set(e,t){let{media:n}=t;n&&(n.webkitShowPlaybackTargetPicker&&y.WebKitPlaybackTargetAvailabilityEvent?n.webkitShowPlaybackTargetPicker():console.error(`MediaChrome: received a request to select AirPlay but AirPlay is not supported in this environment`))},mediaEvents:[`webkitcurrentplaybacktargetiswirelesschanged`]},mediaFullscreenUnavailable:{get(e){let{media:t}=e;if(!Qn||!Zn(t))return g.UNSUPPORTED}},mediaPipUnavailable:{get(e){let{media:t}=e;if(!$n||!Xn(t))return g.UNSUPPORTED;if(t?.disablePictureInPicture)return g.UNAVAILABLE}},mediaVolumeUnavailable:{get(e){let{media:t}=e;if(cr===!1||t?.volume==null)return g.UNSUPPORTED},stateOwnersUpdateHandlers:[e=>{cr??lr.then(t=>e(t?void 0:g.UNSUPPORTED))}]},mediaCastUnavailable:{get(e,{availability:t=`not-available`}={}){let{media:n}=e;if(!tr||!n?.remote?.state)return g.UNSUPPORTED;if(t!=null&&t!==`available`)return g.UNAVAILABLE},stateOwnersUpdateHandlers:[(e,t)=>{var n;let{media:r}=t;if(r)return r.disableRemotePlayback||r.hasAttribute(`disableremoteplayback`)||(n=r?.remote)==null||n.watchAvailability(t=>{e({availability:t?`available`:`not-available`})}).catch(t=>{t.name===`NotSupportedError`?e({availability:null}):e({availability:`not-available`})}),()=>{var e;(e=r?.remote)==null||e.cancelWatchAvailability().catch(()=>{})}}]},mediaAirplayUnavailable:{get(e,t){if(!er)return g.UNSUPPORTED;if(t?.availability===`not-available`)return g.UNAVAILABLE},mediaEvents:[`webkitplaybacktargetavailabilitychanged`],stateOwnersUpdateHandlers:[(e,t)=>{var n;let{media:r}=t;if(r)return r.disableRemotePlayback||r.hasAttribute(`disableremoteplayback`)||(n=r?.remote)==null||n.watchAvailability(t=>{e({availability:t?`available`:`not-available`})}).catch(t=>{t.name===`NotSupportedError`?e({availability:null}):e({availability:`not-available`})}),()=>{var e;(e=r?.remote)==null||e.cancelWatchAvailability().catch(()=>{})}}]},mediaRenditionUnavailable:{get(e){let{media:t}=e;if(!t?.videoRenditions)return g.UNSUPPORTED;if(!t.videoRenditions?.length)return g.UNAVAILABLE},mediaEvents:[`emptied`,`loadstart`],videoRenditionsEvents:[`addrendition`,`removerendition`]},mediaAudioTrackUnavailable:{get(e){let{media:t}=e;if(!t?.audioTracks)return g.UNSUPPORTED;if((t.audioTracks?.length??0)<=1)return g.UNAVAILABLE},mediaEvents:[`emptied`,`loadstart`],audioTracksEvents:[`addtrack`,`removetrack`]},mediaLang:{get(e){let{options:{mediaLang:t}={}}=e;return t??`en`}}},mr={[o.MEDIA_PREVIEW_REQUEST](e,t,{detail:n}){let{media:r}=t,i=n??void 0,a,o;if(r&&i!=null){let[e]=Pn(r,{kind:p.METADATA,label:`thumbnails`}),t=Array.prototype.find.call(e?.cues??[],(e,t,n)=>t===0?e.endTime>i:t===n.length-1?e.startTime<=i:e.startTime<=i&&e.endTime>i);if(t){let e=/'^(?:[a-z]+:)?\/\//i.test(t.text)?void 0:r?.querySelector(`track[label="thumbnails"]`)?.src,n=new URL(t.text,e);o=new URLSearchParams(n.hash).get(`#xywh`).split(`,`).map(e=>+e),a=n.href}}let s=e.mediaDuration.get(t),c=e.mediaChaptersCues.get(t).find((e,t,n)=>t===n.length-1&&s===e.endTime?e.startTime<=i&&e.endTime>=i:e.startTime<=i&&e.endTime>i)?.text;return n!=null&&c==null&&(c=``),{mediaPreviewTime:i,mediaPreviewImage:a,mediaPreviewCoords:o,mediaPreviewChapter:c}},[o.MEDIA_PAUSE_REQUEST](e,t){e.mediaPaused.set(!0,t)},[o.MEDIA_PLAY_REQUEST](e,t){let n=e.mediaStreamType.get(t)===_.LIVE,r=!t.options?.noAutoSeekToLive,i=e.mediaTargetLiveWindow.get(t)>0;if(n&&r&&!i){let n=e.mediaSeekable.get(t)?.[1];if(n){let r=n-(t.options?.seekToLiveOffset??0);e.mediaCurrentTime.set(r,t)}}e.mediaPaused.set(!1,t)},[o.MEDIA_PLAYBACK_RATE_REQUEST](e,t,{detail:n}){let r=n;e.mediaPlaybackRate.set(r,t)},[o.MEDIA_MUTE_REQUEST](e,t){e.mediaMuted.set(!0,t)},[o.MEDIA_UNMUTE_REQUEST](e,t){e.mediaVolume.get(t)||e.mediaVolume.set(.25,t),e.mediaMuted.set(!1,t)},[o.MEDIA_LOOP_REQUEST](e,t,{detail:n}){let r=!!n;return e.mediaLoop.set(r,t),{mediaLoop:r}},[o.MEDIA_VOLUME_REQUEST](e,t,{detail:n}){let r=n;r&&e.mediaMuted.get(t)&&e.mediaMuted.set(!1,t),e.mediaVolume.set(r,t)},[o.MEDIA_SEEK_REQUEST](e,t,{detail:n}){let r=n;e.mediaCurrentTime.set(r,t)},[o.MEDIA_SEEK_TO_LIVE_REQUEST](e,t){let n=e.mediaSeekable.get(t)?.[1];if(Number.isNaN(Number(n)))return;let r=n-(t.options?.seekToLiveOffset??0);e.mediaCurrentTime.set(r,t)},[o.MEDIA_SHOW_SUBTITLES_REQUEST](e,t,{detail:n}){let{options:r}=t,i=nr(t),a=On(n),o=a[0]?.language;o&&!r.noSubtitlesLangPref&&y.localStorage.setItem(`media-chrome-pref-subtitles-lang`,o),Nn(m.SHOWING,i,a)},[o.MEDIA_DISABLE_SUBTITLES_REQUEST](e,t,{detail:n}){let r=nr(t),i=n??[];Nn(m.DISABLED,r,i)},[o.MEDIA_TOGGLE_SUBTITLES_REQUEST](e,t,{detail:n}){ir(t,n)},[o.MEDIA_RENDITION_REQUEST](e,t,{detail:n}){let r=n;e.mediaRenditionSelected.set(r,t)},[o.MEDIA_AUDIO_TRACK_REQUEST](e,t,{detail:n}){let r=n;e.mediaAudioTrackEnabled.set(r,t)},[o.MEDIA_ENTER_PIP_REQUEST](e,t){e.mediaIsFullscreen.get(t)&&e.mediaIsFullscreen.set(!1,t),e.mediaIsPip.set(!0,t)},[o.MEDIA_EXIT_PIP_REQUEST](e,t){e.mediaIsPip.set(!1,t)},[o.MEDIA_ENTER_FULLSCREEN_REQUEST](e,t,n){e.mediaIsPip.get(t)&&e.mediaIsPip.set(!1,t),e.mediaIsFullscreen.set(!0,t,n)},[o.MEDIA_EXIT_FULLSCREEN_REQUEST](e,t){e.mediaIsFullscreen.set(!1,t)},[o.MEDIA_ENTER_CAST_REQUEST](e,t){e.mediaIsFullscreen.get(t)&&e.mediaIsFullscreen.set(!1,t),e.mediaIsCasting.set(!0,t)},[o.MEDIA_EXIT_CAST_REQUEST](e,t){e.mediaIsCasting.set(!1,t)},[o.MEDIA_AIRPLAY_REQUEST](e,t){e.mediaIsAirplaying.set(!0,t)}},hr=({media:e,fullscreenElement:t,documentElement:n,stateMediator:r=pr,requestMap:i=mr,options:a={},monitorStateOwnersOnlyWithSubscriptions:o=!0})=>{let s=[],c={options:{...a}},l=Object.freeze({mediaPreviewTime:void 0,mediaPreviewImage:void 0,mediaPreviewCoords:void 0,mediaPreviewChapter:void 0}),u=e=>{e!=null&&(ar(e,l)||(l=Object.freeze({...l,...e}),s.forEach(e=>e(l))))},d=()=>{let e=Object.entries(r).reduce((e,[t,{get:n}])=>(e[t]=n(c),e),{});u(e)},f={},p,m=async(e,t)=>{let n=!!p;if(p={...c,...p??{},...e},n)return;await ur(...Object.values(e));let i=s.length>0&&t===0&&o,a=c.media!==p.media,l=c.media?.textTracks!==p.media?.textTracks,m=c.media?.videoRenditions!==p.media?.videoRenditions,h=c.media?.audioTracks!==p.media?.audioTracks,g=c.media?.remote!==p.media?.remote,_=c.documentElement!==p.documentElement,ee=!!c.media&&(a||i),te=!!c.media?.textTracks&&(l||i),ne=!!c.media?.videoRenditions&&(m||i),re=!!c.media?.audioTracks&&(h||i),ie=!!c.media?.remote&&(g||i),ae=!!c.documentElement&&(_||i),oe=ee||te||ne||re||ie||ae,se=s.length===0&&t===1&&o,ce=!!p.media&&(a||se),le=!!p.media?.textTracks&&(l||se),ue=!!p.media?.videoRenditions&&(m||se),de=!!p.media?.audioTracks&&(h||se),fe=!!p.media?.remote&&(g||se),pe=!!p.documentElement&&(_||se),me=ce||le||ue||de||fe||pe;oe||me?(Object.entries(r).forEach(([e,{get:t,mediaEvents:n=[],textTracksEvents:r=[],videoRenditionsEvents:i=[],audioTracksEvents:a=[],remoteEvents:o=[],rootEvents:s=[],stateOwnersUpdateHandlers:l=[]}])=>{f[e]||(f[e]={});let d=n=>{let r=t(c,n);u({[e]:r})},m;m=f[e].mediaEvents,n.forEach(t=>{m&&ee&&(c.media.removeEventListener(t,m),f[e].mediaEvents=void 0),ce&&(p.media.addEventListener(t,d),f[e].mediaEvents=d)}),m=f[e].textTracksEvents,r.forEach(t=>{var n,r;m&&te&&((n=c.media.textTracks)==null||n.removeEventListener(t,m),f[e].textTracksEvents=void 0),le&&((r=p.media.textTracks)==null||r.addEventListener(t,d),f[e].textTracksEvents=d)}),m=f[e].videoRenditionsEvents,i.forEach(t=>{var n,r;m&&ne&&((n=c.media.videoRenditions)==null||n.removeEventListener(t,m),f[e].videoRenditionsEvents=void 0),ue&&((r=p.media.videoRenditions)==null||r.addEventListener(t,d),f[e].videoRenditionsEvents=d)}),m=f[e].audioTracksEvents,a.forEach(t=>{var n,r;m&&re&&((n=c.media.audioTracks)==null||n.removeEventListener(t,m),f[e].audioTracksEvents=void 0),de&&((r=p.media.audioTracks)==null||r.addEventListener(t,d),f[e].audioTracksEvents=d)}),m=f[e].remoteEvents,o.forEach(t=>{var n,r;m&&ie&&((n=c.media.remote)==null||n.removeEventListener(t,m),f[e].remoteEvents=void 0),fe&&((r=p.media.remote)==null||r.addEventListener(t,d),f[e].remoteEvents=d)}),m=f[e].rootEvents,s.forEach(t=>{m&&ae&&(c.documentElement.removeEventListener(t,m),f[e].rootEvents=void 0),pe&&(p.documentElement.addEventListener(t,d),f[e].rootEvents=d)});let h=f[e].stateOwnersUpdateHandlers;if(h&&oe&&(Array.isArray(h)?h:[h]).forEach(e=>{typeof e==`function`&&e()}),me){let t=l.map(e=>e(d,p)).filter(e=>typeof e==`function`);f[e].stateOwnersUpdateHandlers=t.length===1?t[0]:t}else oe&&(f[e].stateOwnersUpdateHandlers=void 0)}),Object.entries(p).forEach(([e,t])=>{c[e]=t}),d(),p=void 0):(Object.entries(p).forEach(([e,t])=>{c[e]=t}),d(),p=void 0)};return m({media:e,fullscreenElement:t,documentElement:n,options:a}),{dispatch(e){let{type:t,detail:n}=e;i[t]&&l.mediaErrorCode==null?u(i[t](r,c,e)):t===`mediaelementchangerequest`?m({media:n}):t===`fullscreenelementchangerequest`?m({fullscreenElement:n}):t===`documentelementchangerequest`?m({documentElement:n}):t===`optionschangerequest`&&(Object.entries(n??{}).forEach(([e,t])=>{c.options[e]=t}),d())},getState(){return l},subscribe(e){return m({},s.length+1),s.push(e),e(l),()=>{let t=s.indexOf(e);t>=0&&(m({},s.length-1),s.splice(t,1))}}}},gr=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},F=(e,t,n)=>(gr(e,t,`read from private field`),n?n.call(e):t.get(e)),I=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},_r=(e,t,n,r)=>(gr(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),vr=(e,t,n)=>(gr(e,t,`access private method`),n),yr,br,L,R,xr,Sr,Cr,wr,Tr,Er,Dr,Or,kr,Ar,jr,Mr,Nr,Pr=[`ArrowLeft`,`ArrowRight`,`ArrowUp`,`ArrowDown`,`Enter`,` `,`f`,`m`,`k`,`c`,`l`,`j`,`>`,`<`,`p`],Fr=10,Ir=.025,Lr=.25,Rr=.25,zr=2,z={DEFAULT_SUBTITLES:`defaultsubtitles`,DEFAULT_STREAM_TYPE:`defaultstreamtype`,DEFAULT_DURATION:`defaultduration`,FULLSCREEN_ELEMENT:`fullscreenelement`,HOTKEYS:`hotkeys`,KEYBOARD_BACKWARD_SEEK_OFFSET:`keyboardbackwardseekoffset`,KEYBOARD_FORWARD_SEEK_OFFSET:`keyboardforwardseekoffset`,KEYBOARD_DOWN_VOLUME_STEP:`keyboarddownvolumestep`,KEYBOARD_UP_VOLUME_STEP:`keyboardupvolumestep`,KEYS_USED:`keysused`,LANG:`lang`,LOOP:`loop`,LIVE_EDGE_OFFSET:`liveedgeoffset`,NO_AUTO_SEEK_TO_LIVE:`noautoseektolive`,NO_DEFAULT_STORE:`nodefaultstore`,NO_HOTKEYS:`nohotkeys`,NO_MUTED_PREF:`nomutedpref`,NO_SUBTITLES_LANG_PREF:`nosubtitleslangpref`,NO_VOLUME_PREF:`novolumepref`,SEEK_TO_LIVE_OFFSET:`seektoliveoffset`},Br=class extends Ot{constructor(){super(),I(this,Tr),I(this,Or),I(this,Ar),I(this,Mr),this.mediaStateReceivers=[],this.associatedElementSubscriptions=new Map,I(this,yr,new wn(this,z.HOTKEYS)),I(this,br,void 0),I(this,L,void 0),I(this,R,null),I(this,xr,void 0),I(this,Sr,void 0),I(this,Cr,e=>{var t;(t=F(this,L))==null||t.dispatch(e)}),I(this,wr,void 0),I(this,Dr,e=>{let{key:t,shiftKey:n}=e;n&&(t===`/`||t===`?`)||Pr.includes(t)?this.keyboardShortcutHandler(e):this.removeEventListener(`keyup`,F(this,Dr))}),this.associateElement(this);let e={};_r(this,xr,t=>{Object.entries(t).forEach(([t,n])=>{if(t in e&&e[t]===n)return;this.propagateMediaState(t,n);let r=t.toLowerCase(),i=new y.CustomEvent(f[r],{composed:!0,detail:n});this.dispatchEvent(i)}),e=t})}static get observedAttributes(){return super.observedAttributes.concat(z.NO_HOTKEYS,z.HOTKEYS,z.DEFAULT_STREAM_TYPE,z.DEFAULT_SUBTITLES,z.DEFAULT_DURATION,z.NO_MUTED_PREF,z.NO_VOLUME_PREF,z.LANG,z.LOOP,z.LIVE_EDGE_OFFSET,z.SEEK_TO_LIVE_OFFSET,z.NO_AUTO_SEEK_TO_LIVE)}get mediaStore(){return F(this,L)}set mediaStore(e){var t;F(this,L)&&((t=F(this,Sr))==null||t.call(this),_r(this,Sr,void 0)),_r(this,L,e),!F(this,L)&&!this.hasAttribute(z.NO_DEFAULT_STORE)?vr(this,Tr,Er).call(this):_r(this,Sr,F(this,L)?.subscribe(F(this,xr)))}get fullscreenElement(){return F(this,br)??this}set fullscreenElement(e){var t;this.hasAttribute(z.FULLSCREEN_ELEMENT)&&this.removeAttribute(z.FULLSCREEN_ELEMENT),_r(this,br,e),(t=F(this,L))==null||t.dispatch({type:`fullscreenelementchangerequest`,detail:this.fullscreenElement})}get defaultSubtitles(){return T(this,z.DEFAULT_SUBTITLES)}set defaultSubtitles(e){E(this,z.DEFAULT_SUBTITLES,e)}get defaultStreamType(){return D(this,z.DEFAULT_STREAM_TYPE)}set defaultStreamType(e){O(this,z.DEFAULT_STREAM_TYPE,e)}get defaultDuration(){return C(this,z.DEFAULT_DURATION)}set defaultDuration(e){w(this,z.DEFAULT_DURATION,e)}get noHotkeys(){return T(this,z.NO_HOTKEYS)}set noHotkeys(e){E(this,z.NO_HOTKEYS,e)}get keysUsed(){return D(this,z.KEYS_USED)}set keysUsed(e){O(this,z.KEYS_USED,e)}get liveEdgeOffset(){return C(this,z.LIVE_EDGE_OFFSET)}set liveEdgeOffset(e){w(this,z.LIVE_EDGE_OFFSET,e)}get noAutoSeekToLive(){return T(this,z.NO_AUTO_SEEK_TO_LIVE)}set noAutoSeekToLive(e){E(this,z.NO_AUTO_SEEK_TO_LIVE,e)}get noVolumePref(){return T(this,z.NO_VOLUME_PREF)}set noVolumePref(e){E(this,z.NO_VOLUME_PREF,e)}get noMutedPref(){return T(this,z.NO_MUTED_PREF)}set noMutedPref(e){E(this,z.NO_MUTED_PREF,e)}get noSubtitlesLangPref(){return T(this,z.NO_SUBTITLES_LANG_PREF)}set noSubtitlesLangPref(e){E(this,z.NO_SUBTITLES_LANG_PREF,e)}get noDefaultStore(){return T(this,z.NO_DEFAULT_STORE)}set noDefaultStore(e){E(this,z.NO_DEFAULT_STORE,e)}get resolvedLang(){return me()}attributeChangedCallback(e,t,n){var r,i,a,s,c,l,u,d,f,p;if(super.attributeChangedCallback(e,t,n),e===z.NO_HOTKEYS)n!==t&&n===``?(this.hasAttribute(z.HOTKEYS)&&console.warn("Media Chrome: Both `hotkeys` and `nohotkeys` have been set. All hotkeys will be disabled."),this.disableHotkeys()):n!==t&&n===null&&this.enableHotkeys(),vr(this,Ar,jr).call(this);else if(e===z.HOTKEYS)F(this,yr).value=n,vr(this,Ar,jr).call(this);else if(e===z.DEFAULT_SUBTITLES&&n!==t)(r=F(this,L))==null||r.dispatch({type:`optionschangerequest`,detail:{defaultSubtitles:this.hasAttribute(z.DEFAULT_SUBTITLES)}});else if(e===z.DEFAULT_STREAM_TYPE)(i=F(this,L))==null||i.dispatch({type:`optionschangerequest`,detail:{defaultStreamType:this.getAttribute(z.DEFAULT_STREAM_TYPE)??void 0}});else if(e===z.LIVE_EDGE_OFFSET&&n!==t)(a=F(this,L))==null||a.dispatch({type:`optionschangerequest`,detail:{liveEdgeOffset:this.hasAttribute(z.LIVE_EDGE_OFFSET)?+this.getAttribute(z.LIVE_EDGE_OFFSET):void 0,seekToLiveOffset:this.hasAttribute(z.SEEK_TO_LIVE_OFFSET)?+this.getAttribute(z.SEEK_TO_LIVE_OFFSET):this.hasAttribute(z.LIVE_EDGE_OFFSET)?+this.getAttribute(z.LIVE_EDGE_OFFSET):void 0}});else if(e===z.SEEK_TO_LIVE_OFFSET&&n!==t)(s=F(this,L))==null||s.dispatch({type:`optionschangerequest`,detail:{seekToLiveOffset:this.hasAttribute(z.SEEK_TO_LIVE_OFFSET)?+this.getAttribute(z.SEEK_TO_LIVE_OFFSET):this.hasAttribute(z.LIVE_EDGE_OFFSET)?+this.getAttribute(z.LIVE_EDGE_OFFSET):void 0}});else if(e===z.NO_AUTO_SEEK_TO_LIVE)(c=F(this,L))==null||c.dispatch({type:`optionschangerequest`,detail:{noAutoSeekToLive:this.hasAttribute(z.NO_AUTO_SEEK_TO_LIVE)}});else if(e===z.FULLSCREEN_ELEMENT){let e=n?this.getRootNode()?.getElementById(n):void 0;_r(this,br,e),(l=F(this,L))==null||l.dispatch({type:`fullscreenelementchangerequest`,detail:this.fullscreenElement})}else e===z.LANG&&n!==t?(de(n),(u=F(this,L))==null||u.dispatch({type:`optionschangerequest`,detail:{mediaLang:n}})):e===z.LOOP&&n!==t?(d=F(this,L))==null||d.dispatch({type:o.MEDIA_LOOP_REQUEST,detail:n!=null}):e===z.NO_VOLUME_PREF&&n!==t?(f=F(this,L))==null||f.dispatch({type:`optionschangerequest`,detail:{noVolumePref:this.hasAttribute(z.NO_VOLUME_PREF)}}):e===z.NO_MUTED_PREF&&n!==t&&((p=F(this,L))==null||p.dispatch({type:`optionschangerequest`,detail:{noMutedPref:this.hasAttribute(z.NO_MUTED_PREF)}}))}connectedCallback(){var e,t;this.associateElement(this),!F(this,L)&&!this.hasAttribute(z.NO_DEFAULT_STORE)&&vr(this,Tr,Er).call(this),(e=F(this,L))==null||e.dispatch({type:`documentelementchangerequest`,detail:b}),(t=F(this,L))==null||t.dispatch({type:`fullscreenelementchangerequest`,detail:this.fullscreenElement}),super.connectedCallback(),F(this,L)&&!F(this,Sr)&&_r(this,Sr,F(this,L)?.subscribe(F(this,xr))),F(this,wr)!==void 0&&F(this,L)&&this.media&&setTimeout(()=>{var e;this.media?.textTracks?.length&&((e=F(this,L))==null||e.dispatch({type:o.MEDIA_TOGGLE_SUBTITLES_REQUEST,detail:F(this,wr)}))},0),this.hasAttribute(z.NO_HOTKEYS)?this.disableHotkeys():this.enableHotkeys()}disconnectedCallback(){var e,t,n,r,i;if((e=super.disconnectedCallback)==null||e.call(this),this.disableHotkeys(),F(this,L)){let e=F(this,L).getState();_r(this,wr,!!e.mediaSubtitlesShowing?.length),(t=F(this,L))==null||t.dispatch({type:`fullscreenelementchangerequest`,detail:void 0}),(n=F(this,L))==null||n.dispatch({type:`documentelementchangerequest`,detail:void 0}),(r=F(this,L))==null||r.dispatch({type:o.MEDIA_TOGGLE_SUBTITLES_REQUEST,detail:!1})}F(this,Sr)&&((i=F(this,Sr))==null||i.call(this),_r(this,Sr,void 0)),this.unassociateElement(this),F(this,R)&&(F(this,R).remove(),_r(this,R,null))}mediaSetCallback(e){var t;super.mediaSetCallback(e),(t=F(this,L))==null||t.dispatch({type:`mediaelementchangerequest`,detail:e}),e.hasAttribute(`tabindex`)||(e.tabIndex=-1)}mediaUnsetCallback(e){var t;super.mediaUnsetCallback(e),(t=F(this,L))==null||t.dispatch({type:`mediaelementchangerequest`,detail:void 0})}propagateMediaState(e,t){Zr(this.mediaStateReceivers,e,t)}associateElement(e){if(!e)return;let{associatedElementSubscriptions:t}=this;if(t.has(e))return;let n=Qr(e,this.registerMediaStateReceiver.bind(this),this.unregisterMediaStateReceiver.bind(this));Object.values(o).forEach(t=>{e.addEventListener(t,F(this,Cr))}),t.set(e,n)}unassociateElement(e){if(!e)return;let{associatedElementSubscriptions:t}=this;t.has(e)&&(t.get(e)(),t.delete(e),Object.values(o).forEach(t=>{e.removeEventListener(t,F(this,Cr))}))}registerMediaStateReceiver(e){if(!e)return;let t=this.mediaStateReceivers;t.indexOf(e)>-1||(t.push(e),F(this,L)&&Object.entries(F(this,L).getState()).forEach(([t,n])=>{Zr([e],t,n)}))}unregisterMediaStateReceiver(e){let t=this.mediaStateReceivers,n=t.indexOf(e);n<0||t.splice(n,1)}enableHotkeys(){this.addEventListener(`keydown`,vr(this,Or,kr))}disableHotkeys(){this.removeEventListener(`keydown`,vr(this,Or,kr)),this.removeEventListener(`keyup`,F(this,Dr))}get hotkeys(){return F(this,yr)}set hotkeys(e){O(this,z.HOTKEYS,e)}keyboardShortcutHandler(e){let t=e.target;if((t.getAttribute(z.KEYS_USED)?.split(` `)??t?.keysUsed??[]).map(e=>e===`Space`?` `:e).filter(Boolean).includes(e.key))return;let n,r,i;if(!F(this,yr).contains(ln(e.key))&&(!e.shiftKey||e.key!==`/`&&e.key!==`?`||!F(this,yr).contains(`noshift+/`)))switch(e.key){case` `:case`k`:n=F(this,L).getState().mediaPaused?o.MEDIA_PLAY_REQUEST:o.MEDIA_PAUSE_REQUEST,this.dispatchEvent(new y.CustomEvent(n,{composed:!0,bubbles:!0}));break;case`m`:n=this.mediaStore.getState().mediaVolumeLevel===`off`?o.MEDIA_UNMUTE_REQUEST:o.MEDIA_MUTE_REQUEST,this.dispatchEvent(new y.CustomEvent(n,{composed:!0,bubbles:!0}));break;case`f`:n=this.mediaStore.getState().mediaIsFullscreen?o.MEDIA_EXIT_FULLSCREEN_REQUEST:o.MEDIA_ENTER_FULLSCREEN_REQUEST,this.dispatchEvent(new y.CustomEvent(n,{composed:!0,bubbles:!0}));break;case`c`:this.dispatchEvent(new y.CustomEvent(o.MEDIA_TOGGLE_SUBTITLES_REQUEST,{composed:!0,bubbles:!0}));break;case`ArrowLeft`:case`j`:{let e=this.hasAttribute(z.KEYBOARD_BACKWARD_SEEK_OFFSET)?+this.getAttribute(z.KEYBOARD_BACKWARD_SEEK_OFFSET):Fr;r=Math.max((this.mediaStore.getState().mediaCurrentTime??0)-e,0),i=new y.CustomEvent(o.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:r}),this.dispatchEvent(i);break}case`ArrowRight`:case`l`:{let e=this.hasAttribute(z.KEYBOARD_FORWARD_SEEK_OFFSET)?+this.getAttribute(z.KEYBOARD_FORWARD_SEEK_OFFSET):Fr;r=Math.max((this.mediaStore.getState().mediaCurrentTime??0)+e,0),i=new y.CustomEvent(o.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:r}),this.dispatchEvent(i);break}case`ArrowUp`:{let e=this.hasAttribute(z.KEYBOARD_UP_VOLUME_STEP)?+this.getAttribute(z.KEYBOARD_UP_VOLUME_STEP):Ir;r=Math.min((this.mediaStore.getState().mediaVolume??1)+e,1),i=new y.CustomEvent(o.MEDIA_VOLUME_REQUEST,{composed:!0,bubbles:!0,detail:r}),this.dispatchEvent(i);break}case`ArrowDown`:{let e=this.hasAttribute(z.KEYBOARD_DOWN_VOLUME_STEP)?+this.getAttribute(z.KEYBOARD_DOWN_VOLUME_STEP):Ir;r=Math.max((this.mediaStore.getState().mediaVolume??1)-e,0),i=new y.CustomEvent(o.MEDIA_VOLUME_REQUEST,{composed:!0,bubbles:!0,detail:r}),this.dispatchEvent(i);break}case`<`:{let e=this.mediaStore.getState().mediaPlaybackRate??1;r=Math.max(e-Lr,Rr).toFixed(2),i=new y.CustomEvent(o.MEDIA_PLAYBACK_RATE_REQUEST,{composed:!0,bubbles:!0,detail:r}),this.dispatchEvent(i);break}case`>`:{let e=this.mediaStore.getState().mediaPlaybackRate??1;r=Math.min(e+Lr,zr).toFixed(2),i=new y.CustomEvent(o.MEDIA_PLAYBACK_RATE_REQUEST,{composed:!0,bubbles:!0,detail:r}),this.dispatchEvent(i);break}case`/`:case`?`:e.shiftKey&&vr(this,Mr,Nr).call(this);break;case`p`:n=this.mediaStore.getState().mediaIsPip?o.MEDIA_EXIT_PIP_REQUEST:o.MEDIA_ENTER_PIP_REQUEST,i=new y.CustomEvent(n,{composed:!0,bubbles:!0}),this.dispatchEvent(i)}}};yr=new WeakMap,br=new WeakMap,L=new WeakMap,R=new WeakMap,xr=new WeakMap,Sr=new WeakMap,Cr=new WeakMap,wr=new WeakMap,Tr=new WeakSet,Er=function(){this.mediaStore=hr({media:this.media,fullscreenElement:this.fullscreenElement,options:{defaultSubtitles:this.hasAttribute(z.DEFAULT_SUBTITLES),defaultDuration:this.hasAttribute(z.DEFAULT_DURATION)?+this.getAttribute(z.DEFAULT_DURATION):void 0,defaultStreamType:this.getAttribute(z.DEFAULT_STREAM_TYPE)??void 0,liveEdgeOffset:this.hasAttribute(z.LIVE_EDGE_OFFSET)?+this.getAttribute(z.LIVE_EDGE_OFFSET):void 0,seekToLiveOffset:this.hasAttribute(z.SEEK_TO_LIVE_OFFSET)?+this.getAttribute(z.SEEK_TO_LIVE_OFFSET):this.hasAttribute(z.LIVE_EDGE_OFFSET)?+this.getAttribute(z.LIVE_EDGE_OFFSET):void 0,noAutoSeekToLive:this.hasAttribute(z.NO_AUTO_SEEK_TO_LIVE),noVolumePref:this.hasAttribute(z.NO_VOLUME_PREF),noMutedPref:this.hasAttribute(z.NO_MUTED_PREF),noSubtitlesLangPref:this.hasAttribute(z.NO_SUBTITLES_LANG_PREF)}})},Dr=new WeakMap,Or=new WeakSet,kr=function(e){let{metaKey:t,altKey:n,key:r,shiftKey:i}=e,a=i&&(r===`/`||r===`?`);if(a&&F(this,R)?.open||t||n||!a&&!Pr.includes(r)){this.removeEventListener(`keyup`,F(this,Dr));return}let o=e.target,s=o instanceof HTMLElement&&(o.tagName.toLowerCase()===`media-volume-range`||o.tagName.toLowerCase()===`media-time-range`);[` `,`ArrowLeft`,`ArrowRight`,`ArrowUp`,`ArrowDown`].includes(r)&&!F(this,yr).contains(ln(r))&&!s&&e.preventDefault(),this.addEventListener(`keyup`,F(this,Dr),{once:!0})},Ar=new WeakSet,jr=function(){F(this,R)&&(F(this,R).hotkeys=F(this,yr).value||void 0,(this.noHotkeys||F(this,yr).contains(`noshift+/`))&&(F(this,R).open=!1))},Mr=new WeakSet,Nr=function(){F(this,R)||(_r(this,R,b.createElement(`media-keyboard-shortcuts-dialog`)),vr(this,Ar,jr).call(this),this.appendChild(F(this,R))),F(this,R).open=!0};var Vr=Object.values(u),Hr=Object.values(c),Ur=e=>{var t;let{observedAttributes:n}=e.constructor;!n&&e.nodeName?.includes(`-`)&&(y.customElements.upgrade(e),{observedAttributes:n}=e.constructor);let r=((t=(e?.getAttribute)?.call(e,s.MEDIA_CHROME_ATTRIBUTES))?.split)?.call(t,/\s+/);return Array.isArray(n||r)?(n||r).filter(e=>Vr.includes(e)):[]},Wr=e=>(e.nodeName?.includes(`-`)&&y.customElements.get(e.nodeName?.toLowerCase())&&!(e instanceof y.customElements.get(e.nodeName.toLowerCase()))&&y.customElements.upgrade(e),Hr.some(t=>t in e)),Gr=e=>Wr(e)||!!Ur(e).length,Kr=e=>(e?.join)?.call(e,`:`),qr={[u.MEDIA_SUBTITLES_LIST]:An,[u.MEDIA_SUBTITLES_SHOWING]:An,[u.MEDIA_SEEKABLE]:Kr,[u.MEDIA_BUFFERED]:e=>e?.map(Kr).join(` `),[u.MEDIA_PREVIEW_COORDS]:e=>e?.join(` `),[u.MEDIA_RENDITION_LIST]:te,[u.MEDIA_AUDIO_TRACK_LIST]:re},Jr=async(e,t,n)=>{if(e.isConnected||await oe(0),typeof n==`boolean`||n==null)return E(e,t,n);if(typeof n==`number`)return w(e,t,n);if(typeof n==`string`)return O(e,t,n);if(Array.isArray(n)&&!n.length)return e.removeAttribute(t);let r=qr[t]?.call(qr,n)??n;return e.setAttribute(t,r)},Yr=e=>!!e.closest?.call(e,`*[slot="media"]`),Xr=(e,t)=>{if(Yr(e))return;let n=(e,t)=>{Gr(e)&&t(e);let{children:n=[]}=e??{},r=e?.shadowRoot?.children??[];[...n,...r].forEach(e=>Xr(e,t))},r=e?.nodeName.toLowerCase();r.includes(`-`)&&!Gr(e)?y.customElements.whenDefined(r).then(()=>{n(e,t)}):n(e,t)},Zr=(e,t,n)=>{e.forEach(e=>{if(t in e){e[t]=n;return}let r=Ur(e),i=t.toLowerCase();r.includes(i)&&Jr(e,i,n)})},Qr=(e,t,n)=>{Xr(e,t);let r=e=>{t(e?.composedPath()[0]??e.target)},i=e=>{n(e?.composedPath()[0]??e.target)};e.addEventListener(o.REGISTER_MEDIA_STATE_RECEIVER,r),e.addEventListener(o.UNREGISTER_MEDIA_STATE_RECEIVER,i);let a=e=>{e.forEach(e=>{let{addedNodes:r=[],removedNodes:i=[],type:a,target:o,attributeName:c}=e;a===`childList`?(Array.prototype.forEach.call(r,e=>Xr(e,t)),Array.prototype.forEach.call(i,e=>Xr(e,n))):a===`attributes`&&c===s.MEDIA_CHROME_ATTRIBUTES&&(Gr(o)?t(o):n(o))})},c=[],l=e=>{let r=e.target;r.name!==`media`&&(c.forEach(e=>Xr(e,n)),c=[...r.assignedElements({flatten:!0})],c.forEach(e=>Xr(e,t)))};e.addEventListener(`slotchange`,l);let u=new MutationObserver(a);return u.observe(e,{childList:!0,attributes:!0,subtree:!0}),()=>{Xr(e,n),e.removeEventListener(`slotchange`,l),u.disconnect(),e.removeEventListener(o.REGISTER_MEDIA_STATE_RECEIVER,r),e.removeEventListener(o.UNREGISTER_MEDIA_STATE_RECEIVER,i)}};y.customElements.get(`media-controller`)||y.customElements.define(`media-controller`,Br);var $r=Br,ei={PLACEMENT:`placement`,BOUNDS:`bounds`};function ti(e){return`
    <style>
      :host {
        --_tooltip-background-color: var(--media-tooltip-background-color, var(--media-secondary-color, rgba(20, 20, 30, .7)));
        --_tooltip-background: var(--media-tooltip-background, var(--_tooltip-background-color));
        --_tooltip-arrow-half-width: calc(var(--media-tooltip-arrow-width, 12px) / 2);
        --_tooltip-arrow-height: var(--media-tooltip-arrow-height, 5px);
        --_tooltip-arrow-background: var(--media-tooltip-arrow-color, var(--_tooltip-background-color));
        position: relative;
        pointer-events: none;
        display: var(--media-tooltip-display, inline-flex);
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
        z-index: var(--media-tooltip-z-index, 1);
        background: var(--_tooltip-background);
        color: var(--media-text-color, var(--media-primary-color, rgb(238 238 238)));
        font: var(--media-font,
          var(--media-font-weight, 400)
          var(--media-font-size, 13px) /
          var(--media-text-content-height, var(--media-control-height, 18px))
          var(--media-font-family, helvetica neue, segoe ui, roboto, arial, sans-serif));
        padding: var(--media-tooltip-padding, .35em .7em);
        border: var(--media-tooltip-border, none);
        border-radius: var(--media-tooltip-border-radius, 5px);
        filter: var(--media-tooltip-filter, drop-shadow(0 0 4px rgba(0, 0, 0, .2)));
        white-space: var(--media-tooltip-white-space, nowrap);
      }

      :host([hidden]) {
        display: none;
      }

      img, svg {
        display: inline-block;
      }

      #arrow {
        position: absolute;
        width: 0px;
        height: 0px;
        border-style: solid;
        display: var(--media-tooltip-arrow-display, block);
      }

      :host(:not([placement])),
      :host([placement="top"]) {
        position: absolute;
        bottom: calc(100% + var(--media-tooltip-distance, 12px));
        left: 50%;
        transform: translate(calc(-50% - var(--media-tooltip-offset-x, 0px)), 0);
      }
      :host(:not([placement])) #arrow,
      :host([placement="top"]) #arrow {
        top: 100%;
        left: 50%;
        border-width: var(--_tooltip-arrow-height) var(--_tooltip-arrow-half-width) 0 var(--_tooltip-arrow-half-width);
        border-color: var(--_tooltip-arrow-background) transparent transparent transparent;
        transform: translate(calc(-50% + var(--media-tooltip-offset-x, 0px)), 0);
      }

      :host([placement="right"]) {
        position: absolute;
        left: calc(100% + var(--media-tooltip-distance, 12px));
        top: 50%;
        transform: translate(0, -50%);
      }
      :host([placement="right"]) #arrow {
        top: 50%;
        right: 100%;
        border-width: var(--_tooltip-arrow-half-width) var(--_tooltip-arrow-height) var(--_tooltip-arrow-half-width) 0;
        border-color: transparent var(--_tooltip-arrow-background) transparent transparent;
        transform: translate(0, -50%);
      }

      :host([placement="bottom"]) {
        position: absolute;
        top: calc(100% + var(--media-tooltip-distance, 12px));
        left: 50%;
        transform: translate(calc(-50% - var(--media-tooltip-offset-x, 0px)), 0);
      }
      :host([placement="bottom"]) #arrow {
        bottom: 100%;
        left: 50%;
        border-width: 0 var(--_tooltip-arrow-half-width) var(--_tooltip-arrow-height) var(--_tooltip-arrow-half-width);
        border-color: transparent transparent var(--_tooltip-arrow-background) transparent;
        transform: translate(calc(-50% + var(--media-tooltip-offset-x, 0px)), 0);
      }

      :host([placement="left"]) {
        position: absolute;
        right: calc(100% + var(--media-tooltip-distance, 12px));
        top: 50%;
        transform: translate(0, -50%);
      }
      :host([placement="left"]) #arrow {
        top: 50%;
        left: 100%;
        border-width: var(--_tooltip-arrow-half-width) 0 var(--_tooltip-arrow-half-width) var(--_tooltip-arrow-height);
        border-color: transparent transparent transparent var(--_tooltip-arrow-background);
        transform: translate(0, -50%);
      }
      
      :host([placement="none"]) #arrow {
        display: none;
      }
    </style>
    <slot></slot>
    <div id="arrow"></div>
  `}var ni=class extends y.HTMLElement{constructor(){if(super(),this.updateXOffset=()=>{if(!Ve(this,{checkOpacity:!1,checkVisibilityCSS:!1}))return;let e=this.placement;if(e===`left`||e===`right`){this.style.removeProperty(`--media-tooltip-offset-x`);return}let t=getComputedStyle(this),n=Re(this,`#`+this.bounds)??Me(this);if(!n)return;let{x:r,width:i}=n.getBoundingClientRect(),{x:a,width:o}=this.getBoundingClientRect(),s=a+o,c=r+i,l=t.getPropertyValue(`--media-tooltip-offset-x`),u=l?parseFloat(l.replace(`px`,``)):0,d=t.getPropertyValue(`--media-tooltip-container-margin`),f=d?parseFloat(d.replace(`px`,``)):0,p=a-r+u-f,m=s-c+u+f;p<0?this.style.setProperty(`--media-tooltip-offset-x`,`${p}px`):m>0?this.style.setProperty(`--media-tooltip-offset-x`,`${m}px`):this.style.removeProperty(`--media-tooltip-offset-x`)},!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=x(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}if(this.arrowEl=this.shadowRoot.querySelector(`#arrow`),Object.prototype.hasOwnProperty.call(this,`placement`)){let e=this.placement;delete this.placement,this.placement=e}}static get observedAttributes(){return[ei.PLACEMENT,ei.BOUNDS]}get placement(){return D(this,ei.PLACEMENT)}set placement(e){O(this,ei.PLACEMENT,e)}get bounds(){return D(this,ei.BOUNDS)}set bounds(e){O(this,ei.BOUNDS,e)}};ni.shadowRootOptions={mode:`open`},ni.getTemplateHTML=ti,y.customElements.get(`media-tooltip`)||y.customElements.define(`media-tooltip`,ni);var ri=ni,ii=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},B=(e,t,n)=>(ii(e,t,`read from private field`),n?n.call(e):t.get(e)),ai=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},oi=(e,t,n,r)=>(ii(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),si=(e,t,n)=>(ii(e,t,`access private method`),n),ci,li,ui,di,fi,pi,mi,hi,gi,_i={TOOLTIP_PLACEMENT:`tooltipplacement`,DISABLED:`disabled`,NO_TOOLTIP:`notooltip`};function vi(e,t={}){return`
    <style>
      :host {
        position: relative;
        font: var(--media-font,
          var(--media-font-weight, bold)
          var(--media-font-size, 14px) /
          var(--media-text-content-height, var(--media-control-height, 24px))
          var(--media-font-family, helvetica neue, segoe ui, roboto, arial, sans-serif));
        color: var(--media-text-color, var(--media-primary-color, rgb(238 238 238)));
        background: var(--media-control-background, var(--media-secondary-color, rgb(20 20 30 / .7)));
        padding: var(--media-button-padding, var(--media-control-padding, 10px));
        justify-content: var(--media-button-justify-content, center);
        display: inline-flex;
        align-items: center;
        vertical-align: middle;
        box-sizing: border-box;
        transition: background .15s linear;
        pointer-events: auto;
        cursor: var(--media-cursor, pointer);
        -webkit-tap-highlight-color: transparent;
      }

      
      :host(:focus-visible) {
        box-shadow: var(--media-focus-box-shadow, inset 0 0 0 2px rgb(27 127 204 / .9));
        outline: 0;
      }
      
      :host(:where(:focus)) {
        box-shadow: none;
        outline: 0;
      }

      :host(:hover) {
        background: var(--media-control-hover-background, rgba(50 50 70 / .7));
      }

      slot[name="icon"] {
        display: inline-flex;
        align-items: center;
      }

      svg, img, ::slotted(svg), ::slotted(img) {
        width: var(--media-button-icon-width);
        height: var(--media-button-icon-height, var(--media-control-height, 24px));
        transform: var(--media-button-icon-transform);
        transition: var(--media-button-icon-transition);
        fill: var(--media-icon-color, var(--media-primary-color, rgb(238 238 238)));
        vertical-align: middle;
        max-width: 100%;
        max-height: 100%;
        min-width: 100%;
      }

      media-tooltip {
        
        max-width: 0;
        overflow-x: clip;
        opacity: 0;
        transition: opacity .3s, max-width 0s 9s;
      }

      :host(:hover) media-tooltip,
      :host(:focus-visible) media-tooltip {
        max-width: 100vw;
        opacity: 1;
        transition: opacity .3s;
      }

      :host([notooltip]) slot[name="tooltip"] {
        display: none;
      }
    </style>

    ${this.getSlotTemplateHTML(e,t)}

    <slot name="tooltip">
      <media-tooltip part="tooltip" aria-hidden="true">
        <template shadowrootmode="${ri.shadowRootOptions.mode}">
          ${ri.getTemplateHTML({})}
        </template>
        <slot name="tooltip-content">
          ${this.getTooltipContentHTML(e)}
        </slot>
      </media-tooltip>
    </slot>
  `}function yi(e,t){return`
    <slot></slot>
  `}function bi(){return``}var V=class extends y.HTMLElement{constructor(){if(super(),ai(this,ui),ai(this,hi),ai(this,ci,void 0),this.preventClick=!1,this.tooltipEl=null,ai(this,li,e=>{this.preventClick||this.handleClick(e),setTimeout(B(this,fi),0)}),ai(this,fi,()=>{var e,t;(t=(e=this.tooltipEl)?.updateXOffset)==null||t.call(e)}),ai(this,pi,e=>{let{key:t}=e;this.keysUsed.includes(t)?this.preventClick||this.handleClick(e):this.removeEventListener(`keyup`,B(this,pi))}),ai(this,mi,e=>{let{metaKey:t,altKey:n,key:r}=e;t||n||!this.keysUsed.includes(r)?this.removeEventListener(`keyup`,B(this,pi)):this.addEventListener(`keyup`,B(this,pi),{once:!0})}),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=x(this.attributes),t=this.constructor.getTemplateHTML(e);this.shadowRoot.setHTMLUnsafe?this.shadowRoot.setHTMLUnsafe(t):this.shadowRoot.innerHTML=t}this.tooltipEl=this.shadowRoot.querySelector(`media-tooltip`)}static get observedAttributes(){return[`disabled`,_i.TOOLTIP_PLACEMENT,s.MEDIA_CONTROLLER,u.MEDIA_LANG]}enable(){this.addEventListener(`click`,B(this,li)),this.addEventListener(`keydown`,B(this,mi)),this.tabIndex=0}disable(){this.removeEventListener(`click`,B(this,li)),this.removeEventListener(`keydown`,B(this,mi)),this.removeEventListener(`keyup`,B(this,pi)),this.tabIndex=-1}attributeChangedCallback(e,t,n){var r,i,a,o;e===s.MEDIA_CONTROLLER?(t&&((i=(r=B(this,ci))?.unassociateElement)==null||i.call(r,this),oi(this,ci,null)),n&&this.isConnected&&(oi(this,ci,this.getRootNode()?.getElementById(n)),(o=(a=B(this,ci))?.associateElement)==null||o.call(a,this))):e===`disabled`&&n!==t?n==null?this.enable():this.disable():e===_i.TOOLTIP_PLACEMENT&&this.tooltipEl&&n!==t?this.tooltipEl.placement=n:e===u.MEDIA_LANG&&(this.shadowRoot.querySelector(`slot[name="tooltip-content"]`).innerHTML=this.constructor.getTooltipContentHTML()),si(this,ui,di).call(this)&&B(this,fi).call(this)}connectedCallback(){var e,t;let{style:n}=S(this.shadowRoot,`:host`);n.setProperty(`display`,`var(--media-control-display, var(--${this.localName}-display, inline-flex))`),this.hasAttribute(`disabled`)?this.disable():this.enable(),this.setAttribute(`role`,`button`);let r=this.getAttribute(s.MEDIA_CONTROLLER);r&&(oi(this,ci,this.getRootNode()?.getElementById(r)),(t=(e=B(this,ci))?.associateElement)==null||t.call(e,this)),y.customElements.whenDefined(`media-tooltip`).then(()=>si(this,hi,gi).call(this))}disconnectedCallback(){var e,t;this.disable(),(t=(e=B(this,ci))?.unassociateElement)==null||t.call(e,this),oi(this,ci,null),this.removeEventListener(`mouseenter`,B(this,fi)),this.removeEventListener(`focus`,B(this,fi)),this.removeEventListener(`click`,B(this,li))}get keysUsed(){return[`Enter`,` `]}get tooltipPlacement(){return D(this,_i.TOOLTIP_PLACEMENT)}set tooltipPlacement(e){O(this,_i.TOOLTIP_PLACEMENT,e)}get mediaController(){return D(this,s.MEDIA_CONTROLLER)}set mediaController(e){O(this,s.MEDIA_CONTROLLER,e)}get disabled(){return T(this,_i.DISABLED)}set disabled(e){E(this,_i.DISABLED,e)}get noTooltip(){return T(this,_i.NO_TOOLTIP)}set noTooltip(e){E(this,_i.NO_TOOLTIP,e)}handleClick(e){}};ci=new WeakMap,li=new WeakMap,ui=new WeakSet,di=function(){try{return this.matches(`:hover, :focus-visible`)}catch{return this.matches(`:hover, :focus`)}},fi=new WeakMap,pi=new WeakMap,mi=new WeakMap,hi=new WeakSet,gi=function(){this.addEventListener(`mouseenter`,B(this,fi)),this.addEventListener(`focus`,B(this,fi)),this.addEventListener(`click`,B(this,li));let e=this.tooltipPlacement;e&&this.tooltipEl&&(this.tooltipEl.placement=e)},V.shadowRootOptions={mode:`open`},V.getTemplateHTML=vi,V.getSlotTemplateHTML=yi,V.getTooltipContentHTML=bi,y.customElements.get(`media-chrome-button`)||y.customElements.define(`media-chrome-button`,V);var xi=V,Si=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M22.13 3H3.87a.87.87 0 0 0-.87.87v13.26a.87.87 0 0 0 .87.87h3.4L9 16H5V5h16v11h-4l1.72 2h3.4a.87.87 0 0 0 .87-.87V3.87a.87.87 0 0 0-.86-.87Zm-8.75 11.44a.5.5 0 0 0-.76 0l-4.91 5.73a.5.5 0 0 0 .38.83h9.82a.501.501 0 0 0 .38-.83l-4.91-5.73Z"/>
</svg>
`;function Ci(e){return`
    <style>
      :host([${u.MEDIA_IS_AIRPLAYING}]) slot[name=icon] slot:not([name=exit]) {
        display: none !important;
      }

      
      :host(:not([${u.MEDIA_IS_AIRPLAYING}])) slot[name=icon] slot:not([name=enter]) {
        display: none !important;
      }

      :host([${u.MEDIA_IS_AIRPLAYING}]) slot[name=tooltip-enter],
      :host(:not([${u.MEDIA_IS_AIRPLAYING}])) slot[name=tooltip-exit] {
        display: none;
      }
    </style>

    <slot name="icon">
      <slot name="enter">${Si}</slot>
      <slot name="exit">${Si}</slot>
    </slot>
  `}function wi(){return`
    <slot name="tooltip-enter">${v(`start airplay`)}</slot>
    <slot name="tooltip-exit">${v(`stop airplay`)}</slot>
  `}var Ti=e=>{let t=e.mediaIsAirplaying?v(`stop airplay`):v(`start airplay`);e.setAttribute(`aria-label`,t)},Ei=class extends V{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_IS_AIRPLAYING,u.MEDIA_AIRPLAY_UNAVAILABLE]}connectedCallback(){super.connectedCallback(),Ti(this)}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),e===u.MEDIA_IS_AIRPLAYING&&Ti(this)}get mediaIsAirplaying(){return T(this,u.MEDIA_IS_AIRPLAYING)}set mediaIsAirplaying(e){E(this,u.MEDIA_IS_AIRPLAYING,e)}get mediaAirplayUnavailable(){return D(this,u.MEDIA_AIRPLAY_UNAVAILABLE)}set mediaAirplayUnavailable(e){O(this,u.MEDIA_AIRPLAY_UNAVAILABLE,e)}handleClick(){let e=new y.CustomEvent(o.MEDIA_AIRPLAY_REQUEST,{composed:!0,bubbles:!0});this.dispatchEvent(e)}};Ei.getSlotTemplateHTML=Ci,Ei.getTooltipContentHTML=wi,y.customElements.get(`media-airplay-button`)||y.customElements.define(`media-airplay-button`,Ei);var Di=Ei,Oi=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M22.83 5.68a2.58 2.58 0 0 0-2.3-2.5c-3.62-.24-11.44-.24-15.06 0a2.58 2.58 0 0 0-2.3 2.5c-.23 4.21-.23 8.43 0 12.64a2.58 2.58 0 0 0 2.3 2.5c3.62.24 11.44.24 15.06 0a2.58 2.58 0 0 0 2.3-2.5c.23-4.21.23-8.43 0-12.64Zm-11.39 9.45a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.92 3.92 0 0 1 .92-2.77 3.18 3.18 0 0 1 2.43-1 2.94 2.94 0 0 1 2.13.78c.364.359.62.813.74 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.17 1.61 1.61 0 0 0-1.29.58 2.79 2.79 0 0 0-.5 1.89 3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.48 1.48 0 0 0 1-.37 2.1 2.1 0 0 0 .59-1.14l1.4.44a3.23 3.23 0 0 1-1.07 1.69Zm7.22 0a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.88 3.88 0 0 1 .93-2.77 3.14 3.14 0 0 1 2.42-1 3 3 0 0 1 2.16.82 2.8 2.8 0 0 1 .73 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.21 1.61 1.61 0 0 0-1.29.58A2.79 2.79 0 0 0 15 12a3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.44 1.44 0 0 0 1-.37 2.1 2.1 0 0 0 .6-1.15l1.4.44a3.17 3.17 0 0 1-1.1 1.7Z"/>
</svg>`,ki=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M17.73 14.09a1.4 1.4 0 0 1-1 .37 1.579 1.579 0 0 1-1.27-.58A3 3 0 0 1 15 12a2.8 2.8 0 0 1 .5-1.85 1.63 1.63 0 0 1 1.29-.57 1.47 1.47 0 0 1 1.51 1.2l1.43-.34A2.89 2.89 0 0 0 19 9.07a3 3 0 0 0-2.14-.78 3.14 3.14 0 0 0-2.42 1 3.91 3.91 0 0 0-.93 2.78 3.74 3.74 0 0 0 .92 2.66 3.07 3.07 0 0 0 2.34 1 3.07 3.07 0 0 0 1.91-.57 3.17 3.17 0 0 0 1.07-1.74l-1.4-.45c-.083.43-.3.822-.62 1.12Zm-7.22 0a1.43 1.43 0 0 1-1 .37 1.58 1.58 0 0 1-1.27-.58A3 3 0 0 1 7.76 12a2.8 2.8 0 0 1 .5-1.85 1.63 1.63 0 0 1 1.29-.57 1.47 1.47 0 0 1 1.51 1.2l1.43-.34a2.81 2.81 0 0 0-.74-1.32 2.94 2.94 0 0 0-2.13-.78 3.18 3.18 0 0 0-2.43 1 4 4 0 0 0-.92 2.78 3.74 3.74 0 0 0 .92 2.66 3.07 3.07 0 0 0 2.34 1 3.07 3.07 0 0 0 1.91-.57 3.23 3.23 0 0 0 1.07-1.74l-1.4-.45a2.06 2.06 0 0 1-.6 1.07Zm12.32-8.41a2.59 2.59 0 0 0-2.3-2.51C18.72 3.05 15.86 3 13 3c-2.86 0-5.72.05-7.53.17a2.59 2.59 0 0 0-2.3 2.51c-.23 4.207-.23 8.423 0 12.63a2.57 2.57 0 0 0 2.3 2.5c1.81.13 4.67.19 7.53.19 2.86 0 5.72-.06 7.53-.19a2.57 2.57 0 0 0 2.3-2.5c.23-4.207.23-8.423 0-12.63Zm-1.49 12.53a1.11 1.11 0 0 1-.91 1.11c-1.67.11-4.45.18-7.43.18-2.98 0-5.76-.07-7.43-.18a1.11 1.11 0 0 1-.91-1.11c-.21-4.14-.21-8.29 0-12.43a1.11 1.11 0 0 1 .91-1.11C7.24 4.56 10 4.49 13 4.49s5.76.07 7.43.18a1.11 1.11 0 0 1 .91 1.11c.21 4.14.21 8.29 0 12.43Z"/>
</svg>`;function Ai(e){return`
    <style>
      :host([aria-checked="true"]) slot[name=off] {
        display: none !important;
      }

      
      :host(:not([aria-checked="true"])) slot[name=on] {
        display: none !important;
      }

      :host([aria-checked="true"]) slot[name=tooltip-enable],
      :host(:not([aria-checked="true"])) slot[name=tooltip-disable] {
        display: none;
      }
    </style>

    <slot name="icon">
      <slot name="on">${Oi}</slot>
      <slot name="off">${ki}</slot>
    </slot>
  `}function ji(){return`
    <slot name="tooltip-enable">${v(`Enable captions`)}</slot>
    <slot name="tooltip-disable">${v(`Disable captions`)}</slot>
  `}var Mi=e=>{e.setAttribute(`aria-checked`,Fn(e).toString())},Ni=class extends V{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_SUBTITLES_LIST,u.MEDIA_SUBTITLES_SHOWING]}connectedCallback(){super.connectedCallback(),this.setAttribute(`role`,`button`),this.setAttribute(`aria-label`,v(`closed captions`)),Mi(this)}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),e===u.MEDIA_SUBTITLES_SHOWING&&Mi(this)}get mediaSubtitlesList(){return Pi(this,u.MEDIA_SUBTITLES_LIST)}set mediaSubtitlesList(e){Fi(this,u.MEDIA_SUBTITLES_LIST,e)}get mediaSubtitlesShowing(){return Pi(this,u.MEDIA_SUBTITLES_SHOWING)}set mediaSubtitlesShowing(e){Fi(this,u.MEDIA_SUBTITLES_SHOWING,e)}handleClick(){this.dispatchEvent(new y.CustomEvent(o.MEDIA_TOGGLE_SUBTITLES_REQUEST,{composed:!0,bubbles:!0}))}};Ni.getSlotTemplateHTML=Ai,Ni.getTooltipContentHTML=ji;var Pi=(e,t)=>{let n=e.getAttribute(t);return n?Dn(n):[]},Fi=(e,t,n)=>{if(!n?.length){e.removeAttribute(t);return}let r=An(n);e.getAttribute(t)!==r&&e.setAttribute(t,r)};y.customElements.get(`media-captions-button`)||y.customElements.define(`media-captions-button`,Ni);var Ii=Ni,Li=`<svg aria-hidden="true" viewBox="0 0 24 24"><g><path class="cast_caf_icon_arch0" d="M1,18 L1,21 L4,21 C4,19.3 2.66,18 1,18 L1,18 Z"/><path class="cast_caf_icon_arch1" d="M1,14 L1,16 C3.76,16 6,18.2 6,21 L8,21 C8,17.13 4.87,14 1,14 L1,14 Z"/><path class="cast_caf_icon_arch2" d="M1,10 L1,12 C5.97,12 10,16.0 10,21 L12,21 C12,14.92 7.07,10 1,10 L1,10 Z"/><path class="cast_caf_icon_box" d="M21,3 L3,3 C1.9,3 1,3.9 1,5 L1,8 L3,8 L3,5 L21,5 L21,19 L14,19 L14,21 L21,21 C22.1,21 23,20.1 23,19 L23,5 C23,3.9 22.1,3 21,3 L21,3 Z"/></g></svg>`,Ri=`<svg aria-hidden="true" viewBox="0 0 24 24"><g><path class="cast_caf_icon_arch0" d="M1,18 L1,21 L4,21 C4,19.3 2.66,18 1,18 L1,18 Z"/><path class="cast_caf_icon_arch1" d="M1,14 L1,16 C3.76,16 6,18.2 6,21 L8,21 C8,17.13 4.87,14 1,14 L1,14 Z"/><path class="cast_caf_icon_arch2" d="M1,10 L1,12 C5.97,12 10,16.0 10,21 L12,21 C12,14.92 7.07,10 1,10 L1,10 Z"/><path class="cast_caf_icon_box" d="M21,3 L3,3 C1.9,3 1,3.9 1,5 L1,8 L3,8 L3,5 L21,5 L21,19 L14,19 L14,21 L21,21 C22.1,21 23,20.1 23,19 L23,5 C23,3.9 22.1,3 21,3 L21,3 Z"/><path class="cast_caf_icon_boxfill" d="M5,7 L5,8.63 C8,8.6 13.37,14 13.37,17 L19,17 L19,7 Z"/></g></svg>`;function zi(e){return`
    <style>
      :host([${u.MEDIA_IS_CASTING}]) slot[name=icon] slot:not([name=exit]) {
        display: none !important;
      }

      
      :host(:not([${u.MEDIA_IS_CASTING}])) slot[name=icon] slot:not([name=enter]) {
        display: none !important;
      }

      :host([${u.MEDIA_IS_CASTING}]) slot[name=tooltip-enter],
      :host(:not([${u.MEDIA_IS_CASTING}])) slot[name=tooltip-exit] {
        display: none;
      }
    </style>

    <slot name="icon">
      <slot name="enter">${Li}</slot>
      <slot name="exit">${Ri}</slot>
    </slot>
  `}function Bi(){return`
    <slot name="tooltip-enter">${v(`Start casting`)}</slot>
    <slot name="tooltip-exit">${v(`Stop casting`)}</slot>
  `}var Vi=e=>{let t=e.mediaIsCasting?v(`stop casting`):v(`start casting`);e.setAttribute(`aria-label`,t)},Hi=class extends V{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_IS_CASTING,u.MEDIA_CAST_UNAVAILABLE]}connectedCallback(){super.connectedCallback(),Vi(this)}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),e===u.MEDIA_IS_CASTING&&Vi(this)}get mediaIsCasting(){return T(this,u.MEDIA_IS_CASTING)}set mediaIsCasting(e){E(this,u.MEDIA_IS_CASTING,e)}get mediaCastUnavailable(){return D(this,u.MEDIA_CAST_UNAVAILABLE)}set mediaCastUnavailable(e){O(this,u.MEDIA_CAST_UNAVAILABLE,e)}handleClick(){let e=this.mediaIsCasting?o.MEDIA_EXIT_CAST_REQUEST:o.MEDIA_ENTER_CAST_REQUEST;this.dispatchEvent(new y.CustomEvent(e,{composed:!0,bubbles:!0}))}};Hi.getSlotTemplateHTML=zi,Hi.getTooltipContentHTML=Bi,y.customElements.get(`media-cast-button`)||y.customElements.define(`media-cast-button`,Hi);var Ui=Hi,Wi=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},H=(e,t,n)=>(Wi(e,t,`read from private field`),n?n.call(e):t.get(e)),U=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},Gi=(e,t,n,r)=>(Wi(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Ki=(e,t,n)=>(Wi(e,t,`access private method`),n),qi,Ji,Yi,Xi,Zi,Qi,$i,ea,ta,na,ra,ia,aa,oa,sa,ca,la,ua,da,fa,pa,ma,ha,ga,_a;function va(e){return`
    <style>
      :host {
        --_focus-box-shadow: var(--media-focus-box-shadow, inset 0 0 0 2px rgb(27 127 204 / .9));
        --_media-range-padding: var(--media-range-padding, var(--media-control-padding, 10px));

        box-shadow: var(--_focus-visible-box-shadow, none);
        background: var(--media-control-background, var(--media-secondary-color, rgb(20 20 30 / .7)));
        height: calc(var(--media-control-height, 24px) + 2 * var(--_media-range-padding));
        display: inline-flex;
        align-items: center;
        
        vertical-align: middle;
        box-sizing: border-box;
        position: relative;
        width: 100px;
        transition: background .15s linear;
        cursor: var(--media-cursor, pointer);
        pointer-events: auto;
        touch-action: none; 
      }

      
      input[type=range]:focus {
        outline: 0;
      }
      input[type=range]:focus::-webkit-slider-runnable-track {
        outline: 0;
      }

      :host(:hover) {
        background: var(--media-control-hover-background, rgb(50 50 70 / .7));
      }

      #leftgap {
        padding-left: var(--media-range-padding-left, var(--_media-range-padding));
      }

      #rightgap {
        padding-right: var(--media-range-padding-right, var(--_media-range-padding));
      }

      #startpoint,
      #endpoint {
        position: absolute;
      }

      #endpoint {
        right: 0;
      }

      #container {
        
        width: var(--media-range-track-width, 100%);
        transform: translate(var(--media-range-track-translate-x, 0px), var(--media-range-track-translate-y, 0px));
        position: relative;
        height: 100%;
        display: flex;
        align-items: center;
        min-width: 40px;
      }

      #range {
        
        display: var(--media-time-range-hover-display, block);
        bottom: var(--media-time-range-hover-bottom, 0);
        height: var(--media-time-range-hover-height, max(100% , 25px));
        width: 100%;
        position: absolute;
        cursor: var(--media-cursor, pointer);

        -webkit-appearance: none; 
        -webkit-tap-highlight-color: transparent;
        background: transparent; 
        margin: 0;
        z-index: 1;
      }

      @media (hover: hover) {
        #range {
          bottom: var(--media-time-range-hover-bottom, 0);
          height: var(--media-time-range-hover-height, max(100%, 20px));
        }
      }

      
      
      #range::-webkit-slider-thumb {
        -webkit-appearance: none;
        background: transparent;
        width: .1px;
        height: .1px;
      }

      
      #range::-moz-range-thumb {
        background: transparent;
        border: transparent;
        width: .1px;
        height: .1px;
      }

      #appearance {
        height: var(--media-range-track-height, 4px);
        display: flex;
        flex-direction: column;
        justify-content: center;
        width: 100%;
        position: absolute;
        
        will-change: transform;
      }

      #track {
        background: var(--media-range-track-background, rgb(255 255 255 / .2));
        border-radius: var(--media-range-track-border-radius, 1px);
        border: var(--media-range-track-border, none);
        outline: var(--media-range-track-outline);
        outline-offset: var(--media-range-track-outline-offset);
        backdrop-filter: var(--media-range-track-backdrop-filter);
        -webkit-backdrop-filter: var(--media-range-track-backdrop-filter);
        box-shadow: var(--media-range-track-box-shadow, none);
        position: absolute;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      #progress,
      #pointer {
        position: absolute;
        height: 100%;
        will-change: width;
      }

      #progress {
        background: var(--media-range-bar-color, var(--media-primary-color, rgb(238 238 238)));
        transition: var(--media-range-track-transition);
      }

      #pointer {
        background: var(--media-range-track-pointer-background);
        border-right: var(--media-range-track-pointer-border-right);
        transition: visibility .25s, opacity .25s;
        visibility: hidden;
        opacity: 0;
      }

      @media (hover: hover) {
        :host(:hover) #pointer {
          transition: visibility .5s, opacity .5s;
          visibility: visible;
          opacity: 1;
        }
      }

      #thumb,
      ::slotted([slot=thumb]) {
        width: var(--media-range-thumb-width, 10px);
        height: var(--media-range-thumb-height, 10px);
        transition: var(--media-range-thumb-transition);
        transform: var(--media-range-thumb-transform, none);
        opacity: var(--media-range-thumb-opacity, 1);
        translate: -50%;
        position: absolute;
        left: 0;
        cursor: var(--media-cursor, pointer);
      }

      #thumb {
        border-radius: var(--media-range-thumb-border-radius, 10px);
        background: var(--media-range-thumb-background, var(--media-primary-color, rgb(238 238 238)));
        box-shadow: var(--media-range-thumb-box-shadow, 1px 1px 1px transparent);
        border: var(--media-range-thumb-border, none);
      }

      :host([disabled]) #thumb {
        background-color: #777;
      }

      .segments #appearance {
        height: var(--media-range-segment-hover-height, 7px);
      }

      #track {
        clip-path: url(#segments-clipping);
      }

      #segments {
        --segments-gap: var(--media-range-segments-gap, 2px);
        position: absolute;
        width: 100%;
        height: 100%;
      }

      #segments-clipping {
        transform: translateX(calc(var(--segments-gap) / 2));
      }

      #segments-clipping:empty {
        display: none;
      }

      #segments-clipping rect {
        height: var(--media-range-track-height, 4px);
        y: calc((var(--media-range-segment-hover-height, 7px) - var(--media-range-track-height, 4px)) / 2);
        transition: var(--media-range-segment-transition, transform .1s ease-in-out);
        transform: var(--media-range-segment-transform, scaleY(1));
        transform-origin: center;
      }

      /* Visible label for accessibility - positioned off-screen but technically visible (Firefox requires visible labels) */
      #range-label {
        position: absolute;
        left: -10000px;
        background: var(--media-control-background, var(--media-secondary-color, rgb(20 20 30 / .7)));
        pointer-events: none;
      }
    </style>
    <div id="leftgap"></div>
    <div id="container">
      <div id="startpoint"></div>
      <div id="endpoint"></div>
      <div id="appearance">
        <div id="track" part="track">
          <div id="pointer"></div>
          <div id="progress" part="progress"></div>
        </div>
        <slot name="thumb">
          <div id="thumb" part="thumb"></div>
        </slot>
        <svg id="segments" aria-hidden="true"><clipPath id="segments-clipping"></clipPath></svg>
      </div>
        <input id="range" type="range" min="0" max="1" step="any" value="0">
        <label for="range" id="range-label"></label>

      ${this.getContainerTemplateHTML(e)}
    </div>
    <div id="rightgap"></div>
  `}function ya(e){return``}var ba=class extends y.HTMLElement{constructor(){if(super(),U(this,na),U(this,ia),U(this,oa),U(this,ca),U(this,ua),U(this,fa),U(this,ma),U(this,ga),U(this,qi,void 0),U(this,Ji,void 0),U(this,Yi,void 0),U(this,Xi,void 0),U(this,Zi,{}),U(this,Qi,[]),U(this,$i,()=>{if(this.range.matches(`:focus-visible`)){let{style:e}=S(this.shadowRoot,`:host`);e.setProperty(`--_focus-visible-box-shadow`,`var(--_focus-box-shadow)`)}}),U(this,ea,()=>{let{style:e}=S(this.shadowRoot,`:host`);e.removeProperty(`--_focus-visible-box-shadow`)}),U(this,ta,()=>{let e=this.shadowRoot.querySelector(`#segments-clipping`);e&&e.parentNode.append(e)}),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=x(this.attributes),t=this.constructor.getTemplateHTML(e);this.shadowRoot.setHTMLUnsafe?this.shadowRoot.setHTMLUnsafe(t):this.shadowRoot.innerHTML=t}this.container=this.shadowRoot.querySelector(`#container`),Gi(this,Yi,this.shadowRoot.querySelector(`#startpoint`)),Gi(this,Xi,this.shadowRoot.querySelector(`#endpoint`)),this.range=this.shadowRoot.querySelector(`#range`),this.appearance=this.shadowRoot.querySelector(`#appearance`)}static get observedAttributes(){return[`disabled`,`aria-disabled`,s.MEDIA_CONTROLLER]}attributeChangedCallback(e,t,n){var r,i,a,o;e===s.MEDIA_CONTROLLER?(t&&((i=(r=H(this,qi))?.unassociateElement)==null||i.call(r,this),Gi(this,qi,null)),n&&this.isConnected&&(Gi(this,qi,this.getRootNode()?.getElementById(n)),(o=(a=H(this,qi))?.associateElement)==null||o.call(a,this))):(e===`disabled`||e===`aria-disabled`&&t!==n)&&(n==null?(this.range.removeAttribute(e),Ki(this,ia,aa).call(this)):(this.range.setAttribute(e,n),Ki(this,oa,sa).call(this)))}connectedCallback(){var e,t;let{style:n}=S(this.shadowRoot,`:host`);n.setProperty(`display`,`var(--media-control-display, var(--${this.localName}-display, inline-flex))`),H(this,Zi).pointer=S(this.shadowRoot,`#pointer`),H(this,Zi).progress=S(this.shadowRoot,`#progress`),H(this,Zi).thumb=S(this.shadowRoot,`#thumb, ::slotted([slot="thumb"])`),H(this,Zi).activeSegment=S(this.shadowRoot,`#segments-clipping rect:nth-child(0)`);let r=this.getAttribute(s.MEDIA_CONTROLLER);r&&(Gi(this,qi,this.getRootNode()?.getElementById(r)),(t=(e=H(this,qi))?.associateElement)==null||t.call(e,this)),this.updateBar(),this.shadowRoot.addEventListener(`focusin`,H(this,$i)),this.shadowRoot.addEventListener(`focusout`,H(this,ea)),Ki(this,ia,aa).call(this),Ae(this.container,H(this,ta))}disconnectedCallback(){var e,t;Ki(this,oa,sa).call(this),(t=(e=H(this,qi))?.unassociateElement)==null||t.call(e,this),Gi(this,qi,null),this.shadowRoot.removeEventListener(`focusin`,H(this,$i)),this.shadowRoot.removeEventListener(`focusout`,H(this,ea)),je(this.container,H(this,ta))}updatePointerBar(e){var t;(t=H(this,Zi).pointer)==null||t.style.setProperty(`width`,`${this.getPointerRatio(e)*100}%`)}updateBar(){var e,t;let n=this.range.valueAsNumber*100;(e=H(this,Zi).progress)==null||e.style.setProperty(`width`,`${n}%`),(t=H(this,Zi).thumb)==null||t.style.setProperty(`left`,`${n}%`)}updateSegments(e){let t=this.shadowRoot.querySelector(`#segments-clipping`);if(t.textContent=``,this.container.classList.toggle(`segments`,!!e?.length),!e?.length)return;let n=[...new Set([+this.range.min,...e.flatMap(e=>[e.start,e.end]),+this.range.max])];Gi(this,Qi,[...n]);let r=n.pop();for(let[e,i]of n.entries()){let[a,o]=[e===0,e===n.length-1],s=a?`calc(var(--segments-gap) / -1)`:`${i*100}%`,c=`calc(${((o?r:n[e+1])-i)*100}%${a||o?``:` - var(--segments-gap)`})`,l=b.createElementNS(`http://www.w3.org/2000/svg`,`rect`),u=We(this.shadowRoot,`#segments-clipping rect:nth-child(${e+1})`);u.style.setProperty(`x`,s),u.style.setProperty(`width`,c),t.append(l)}}getPointerRatio(e){return He(e.clientX,e.clientY,H(this,Yi).getBoundingClientRect(),H(this,Xi).getBoundingClientRect())}get dragging(){return this.hasAttribute(`dragging`)}handleEvent(e){switch(e.type){case`pointermove`:Ki(this,ga,_a).call(this,e);break;case`input`:this.updateBar();break;case`pointerenter`:Ki(this,ua,da).call(this,e);break;case`pointerdown`:Ki(this,ca,la).call(this,e);break;case`pointerup`:Ki(this,fa,pa).call(this);break;case`pointerleave`:Ki(this,ma,ha).call(this)}}get keysUsed(){return[`ArrowUp`,`ArrowRight`,`ArrowDown`,`ArrowLeft`]}};qi=new WeakMap,Ji=new WeakMap,Yi=new WeakMap,Xi=new WeakMap,Zi=new WeakMap,Qi=new WeakMap,$i=new WeakMap,ea=new WeakMap,ta=new WeakMap,na=new WeakSet,ra=function(e){let t=H(this,Zi).activeSegment;if(!t)return;let n=this.getPointerRatio(e),r=`#segments-clipping rect:nth-child(${H(this,Qi).findIndex((e,t,r)=>{let i=r[t+1];return i!=null&&n>=e&&n<=i})+1})`;t.selectorText==r&&t.style.transform||(t.selectorText=r,t.style.setProperty(`transform`,`var(--media-range-segment-hover-transform, scaleY(2))`))},ia=new WeakSet,aa=function(){!this.hasAttribute(`disabled`)&&this.isConnected&&(this.addEventListener(`input`,this),this.addEventListener(`pointerdown`,this),this.addEventListener(`pointerenter`,this))},oa=new WeakSet,sa=function(){var e,t;this.removeEventListener(`input`,this),this.removeEventListener(`pointerdown`,this),this.removeEventListener(`pointerenter`,this),this.removeEventListener(`pointerleave`,this),(e=y.window)==null||e.removeEventListener(`pointerup`,this),(t=y.window)==null||t.removeEventListener(`pointermove`,this)},ca=new WeakSet,la=function(e){var t;Gi(this,Ji,e.composedPath().includes(this.range)),(t=y.window)==null||t.addEventListener(`pointerup`,this,{once:!0})},ua=new WeakSet,da=function(e){var t;e.pointerType!==`mouse`&&Ki(this,ca,la).call(this,e),this.addEventListener(`pointerleave`,this,{once:!0}),(t=y.window)==null||t.addEventListener(`pointermove`,this)},fa=new WeakSet,pa=function(){var e;(e=y.window)==null||e.removeEventListener(`pointerup`,this),this.toggleAttribute(`dragging`,!1),this.range.disabled=this.hasAttribute(`disabled`)},ma=new WeakSet,ha=function(){var e,t;this.removeEventListener(`pointerleave`,this),(e=y.window)==null||e.removeEventListener(`pointermove`,this),this.toggleAttribute(`dragging`,!1),this.range.disabled=this.hasAttribute(`disabled`),(t=H(this,Zi).activeSegment)==null||t.style.removeProperty(`transform`)},ga=new WeakSet,_a=function(e){(e.pointerType!==`pen`||e.buttons!==0)&&(this.toggleAttribute(`dragging`,e.buttons===1||e.pointerType!==`mouse`),this.updatePointerBar(e),Ki(this,na,ra).call(this,e),this.dragging&&(e.pointerType!==`mouse`||!H(this,Ji))&&(this.range.disabled=!0,this.range.valueAsNumber=this.getPointerRatio(e),this.range.dispatchEvent(new Event(`input`,{bubbles:!0,composed:!0}))))},ba.shadowRootOptions={mode:`open`},ba.getTemplateHTML=va,ba.getContainerTemplateHTML=ya,y.customElements.get(`media-chrome-range`)||y.customElements.define(`media-chrome-range`,ba);var xa=ba,Sa=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},Ca=(e,t,n)=>(Sa(e,t,`read from private field`),n?n.call(e):t.get(e)),wa=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},Ta=(e,t,n,r)=>(Sa(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Ea;function Da(e){return`
    <style>
      :host {
        
        box-sizing: border-box;
        display: var(--media-control-display, var(--media-control-bar-display, inline-flex));
        color: var(--media-text-color, var(--media-primary-color, rgb(238 238 238)));
        --media-loading-indicator-icon-height: 44px;
      }

      ::slotted(media-time-range),
      ::slotted(media-volume-range) {
        min-height: 100%;
      }

      ::slotted(media-time-range),
      ::slotted(media-clip-selector) {
        flex-grow: 1;
      }

      ::slotted([role="menu"]) {
        position: absolute;
      }
    </style>

    <slot></slot>
  `}var Oa=class extends y.HTMLElement{constructor(){if(super(),wa(this,Ea,void 0),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=x(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}}static get observedAttributes(){return[s.MEDIA_CONTROLLER]}attributeChangedCallback(e,t,n){var r,i,a,o;e===s.MEDIA_CONTROLLER&&(t&&((i=(r=Ca(this,Ea))?.unassociateElement)==null||i.call(r,this),Ta(this,Ea,null)),n&&this.isConnected&&(Ta(this,Ea,this.getRootNode()?.getElementById(n)),(o=(a=Ca(this,Ea))?.associateElement)==null||o.call(a,this)))}connectedCallback(){var e,t;let n=this.getAttribute(s.MEDIA_CONTROLLER);n&&(Ta(this,Ea,this.getRootNode()?.getElementById(n)),(t=(e=Ca(this,Ea))?.associateElement)==null||t.call(e,this))}disconnectedCallback(){var e,t;(t=(e=Ca(this,Ea))?.unassociateElement)==null||t.call(e,this),Ta(this,Ea,null)}};Ea=new WeakMap,Oa.shadowRootOptions={mode:`open`},Oa.getTemplateHTML=Da,y.customElements.get(`media-control-bar`)||y.customElements.define(`media-control-bar`,Oa);var ka=Oa,Aa=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},ja=(e,t,n)=>(Aa(e,t,`read from private field`),n?n.call(e):t.get(e)),Ma=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},Na=(e,t,n,r)=>(Aa(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Pa;function Fa(e,t={}){return`
    <style>
      :host {
        font: var(--media-font,
          var(--media-font-weight, normal)
          var(--media-font-size, 14px) /
          var(--media-text-content-height, var(--media-control-height, 24px))
          var(--media-font-family, helvetica neue, segoe ui, roboto, arial, sans-serif));
        color: var(--media-text-color, var(--media-primary-color, rgb(238 238 238)));
        background: var(--media-text-background, var(--media-control-background, var(--media-secondary-color, rgb(20 20 30 / .7))));
        padding: var(--media-control-padding, 10px);
        display: inline-flex;
        justify-content: center;
        align-items: center;
        vertical-align: middle;
        box-sizing: border-box;
        text-align: center;
        pointer-events: auto;
      }

      
      :host(:focus-visible) {
        box-shadow: var(--media-focus-box-shadow, inset 0 0 0 2px rgb(27 127 204 / .9));
        outline: 0;
      }

      
      :host(:where(:focus)) {
        box-shadow: none;
        outline: 0;
      }
    </style>

    ${this.getSlotTemplateHTML(e,t)}
  `}function Ia(e,t){return`
    <slot></slot>
  `}var La=class extends y.HTMLElement{constructor(){if(super(),Ma(this,Pa,void 0),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=x(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}}static get observedAttributes(){return[s.MEDIA_CONTROLLER]}attributeChangedCallback(e,t,n){var r,i,a,o;e===s.MEDIA_CONTROLLER&&(t&&((i=(r=ja(this,Pa))?.unassociateElement)==null||i.call(r,this),Na(this,Pa,null)),n&&this.isConnected&&(Na(this,Pa,this.getRootNode()?.getElementById(n)),(o=(a=ja(this,Pa))?.associateElement)==null||o.call(a,this)))}connectedCallback(){var e,t;let{style:n}=S(this.shadowRoot,`:host`);n.setProperty(`display`,`var(--media-control-display, var(--${this.localName}-display, inline-flex))`);let r=this.getAttribute(s.MEDIA_CONTROLLER);r&&(Na(this,Pa,this.getRootNode()?.getElementById(r)),(t=(e=ja(this,Pa))?.associateElement)==null||t.call(e,this))}disconnectedCallback(){var e,t;(t=(e=ja(this,Pa))?.unassociateElement)==null||t.call(e,this),Na(this,Pa,null)}};Pa=new WeakMap,La.shadowRootOptions={mode:`open`},La.getTemplateHTML=Fa,La.getSlotTemplateHTML=Ia,y.customElements.get(`media-text-display`)||y.customElements.define(`media-text-display`,La);var Ra=La,za=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},Ba=(e,t,n)=>(za(e,t,`read from private field`),n?n.call(e):t.get(e)),Va=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},Ha=(e,t,n,r)=>(za(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Ua;function Wa(e,t){return`
    <slot>${ve(t.mediaDuration)}</slot>
  `}var Ga=class extends La{constructor(){super(),Va(this,Ua,void 0),Ha(this,Ua,this.shadowRoot.querySelector(`slot`)),Ba(this,Ua).textContent=ve(this.mediaDuration??0)}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_DURATION]}attributeChangedCallback(e,t,n){e===u.MEDIA_DURATION&&(Ba(this,Ua).textContent=ve(+n)),super.attributeChangedCallback(e,t,n)}get mediaDuration(){return C(this,u.MEDIA_DURATION)}set mediaDuration(e){w(this,u.MEDIA_DURATION,e)}};Ua=new WeakMap,Ga.getSlotTemplateHTML=Wa,y.customElements.get(`media-duration-display`)||y.customElements.define(`media-duration-display`,Ga);var Ka=Ga,qa={2:v(`Network Error`),3:v(`Decode Error`),4:v(`Source Not Supported`),5:v(`Encryption Error`)},Ja={2:v(`A network error caused the media download to fail.`),3:v(`A media error caused playback to be aborted. The media could be corrupt or your browser does not support this format.`),4:v(`An unsupported error occurred. The server or network failed, or your browser does not support this format.`),5:v(`The media is encrypted and there are no keys to decrypt it.`)},Ya=e=>e.code===1?null:{title:qa[e.code]??`Error ${e.code}`,message:Ja[e.code]??e.message},Xa=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},Za=(e,t,n)=>(Xa(e,t,`read from private field`),n?n.call(e):t.get(e)),Qa=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},$a=(e,t,n,r)=>(Xa(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),eo;function to(e){let t=+e.mediaerrorcode;return`
    <style>
      :host {
        background: rgb(20 20 30 / .8);
      }

      #content {
        display: block;
        padding: 1.2em 1.5em;
      }

      h3,
      p {
        margin-block: 0 .3em;
      }
    </style>
    <slot name="error-${t}" id="content">
      ${ro({code:t,message:e.mediaerrormessage})}
    </slot>
  `}function no(e){return e.code&&Ya(e)!==null}function ro(e){let{title:t,message:n}=Ya(e)??{},r=ce(e.code),i=``;return t&&(i+=`<slot name="error-${r}-title"><h3>${ce(t)}</h3></slot>`),n&&(i+=`<slot name="error-${r}-message"><p>${ce(n)}</p></slot>`),i}var io=[u.MEDIA_ERROR_CODE,u.MEDIA_ERROR_MESSAGE],ao=class extends $t{constructor(){super(...arguments),Qa(this,eo,null)}static get observedAttributes(){return[...super.observedAttributes,...io]}formatErrorMessage(e){return this.constructor.formatErrorMessage(e)}attributeChangedCallback(e,t,n){if(super.attributeChangedCallback(e,t,n),!io.includes(e))return;let r=this.mediaError??{code:this.mediaErrorCode,message:this.mediaErrorMessage};if(this.open=no(r),this.open&&(this.shadowRoot.querySelector(`slot`).name=`error-${this.mediaErrorCode}`,this.shadowRoot.querySelector(`#content`).innerHTML=this.formatErrorMessage(r),!this.hasAttribute(`aria-label`))){let{title:e}=Ya(r);e&&this.setAttribute(`aria-label`,e)}}get mediaError(){return Za(this,eo)}set mediaError(e){$a(this,eo,e)}get mediaErrorCode(){return C(this,`mediaerrorcode`)}set mediaErrorCode(e){w(this,`mediaerrorcode`,e)}get mediaErrorMessage(){return D(this,`mediaerrormessage`)}set mediaErrorMessage(e){O(this,`mediaerrormessage`,e)}};eo=new WeakMap,ao.getSlotTemplateHTML=to,ao.formatErrorMessage=ro,y.customElements.get(`media-error-dialog`)||y.customElements.define(`media-error-dialog`,ao);var oo=ao,so=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},co=(e,t,n)=>(so(e,t,`read from private field`),n?n.call(e):t.get(e)),lo=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},uo=(e,t,n,r)=>(so(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),fo,po=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M16 3v2.5h3.5V9H22V3h-6ZM4 9h2.5V5.5H10V3H4v6Zm15.5 9.5H16V21h6v-6h-2.5v3.5ZM6.5 15H4v6h6v-2.5H6.5V15Z"/>
</svg>`,mo=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M18.5 6.5V3H16v6h6V6.5h-3.5ZM16 21h2.5v-3.5H22V15h-6v6ZM4 17.5h3.5V21H10v-6H4v2.5Zm3.5-11H4V9h6V3H7.5v3.5Z"/>
</svg>`;function ho(e){return`
    <style>
      :host([${u.MEDIA_IS_FULLSCREEN}]) slot[name=icon] slot:not([name=exit]) {
        display: none !important;
      }

      
      :host(:not([${u.MEDIA_IS_FULLSCREEN}])) slot[name=icon] slot:not([name=enter]) {
        display: none !important;
      }

      :host([${u.MEDIA_IS_FULLSCREEN}]) slot[name=tooltip-enter],
      :host(:not([${u.MEDIA_IS_FULLSCREEN}])) slot[name=tooltip-exit] {
        display: none;
      }
    </style>

    <slot name="icon">
      <slot name="enter">${po}</slot>
      <slot name="exit">${mo}</slot>
    </slot>
  `}function go(){return`
    <slot name="tooltip-enter">${v(`Enter fullscreen mode`)}</slot>
    <slot name="tooltip-exit">${v(`Exit fullscreen mode`)}</slot>
  `}var _o=e=>{let t=e.mediaIsFullscreen?v(`exit fullscreen mode`):v(`enter fullscreen mode`);e.setAttribute(`aria-label`,t)},vo=class extends V{constructor(){super(...arguments),lo(this,fo,null)}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_IS_FULLSCREEN,u.MEDIA_FULLSCREEN_UNAVAILABLE]}connectedCallback(){super.connectedCallback(),_o(this)}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),e===u.MEDIA_IS_FULLSCREEN&&_o(this)}get mediaFullscreenUnavailable(){return D(this,u.MEDIA_FULLSCREEN_UNAVAILABLE)}set mediaFullscreenUnavailable(e){O(this,u.MEDIA_FULLSCREEN_UNAVAILABLE,e)}get mediaIsFullscreen(){return T(this,u.MEDIA_IS_FULLSCREEN)}set mediaIsFullscreen(e){E(this,u.MEDIA_IS_FULLSCREEN,e)}handleClick(e){uo(this,fo,e);let t=co(this,fo)instanceof PointerEvent,n=this.mediaIsFullscreen?new y.CustomEvent(o.MEDIA_EXIT_FULLSCREEN_REQUEST,{composed:!0,bubbles:!0}):new y.CustomEvent(o.MEDIA_ENTER_FULLSCREEN_REQUEST,{composed:!0,bubbles:!0,detail:t});this.dispatchEvent(n)}};fo=new WeakMap,vo.getSlotTemplateHTML=ho,vo.getTooltipContentHTML=go,y.customElements.get(`media-fullscreen-button`)||y.customElements.define(`media-fullscreen-button`,vo);var yo=vo,{MEDIA_TIME_IS_LIVE:bo,MEDIA_PAUSED:xo}=u,{MEDIA_SEEK_TO_LIVE_REQUEST:So,MEDIA_PLAY_REQUEST:Co}=o,wo=`<svg viewBox="0 0 6 12" aria-hidden="true"><circle cx="3" cy="6" r="2"></circle></svg>`;function To(e){return`
    <style>
      :host { --media-tooltip-display: none; }
      
      slot[name=indicator] > *,
      :host ::slotted([slot=indicator]) {
        
        min-width: auto;
        fill: var(--media-live-button-icon-color, rgb(140, 140, 140));
        color: var(--media-live-button-icon-color, rgb(140, 140, 140));
      }

      :host([${bo}]:not([${xo}])) slot[name=indicator] > *,
      :host([${bo}]:not([${xo}])) ::slotted([slot=indicator]) {
        fill: var(--media-live-button-indicator-color, rgb(255, 0, 0));
        color: var(--media-live-button-indicator-color, rgb(255, 0, 0));
      }

      :host([${bo}]:not([${xo}])) {
        cursor: var(--media-cursor, not-allowed);
      }

      slot[name=text]{
        text-transform: uppercase;
      }

    </style>

    <slot name="indicator">${wo}</slot>
    
    <slot name="spacer">&nbsp;</slot><slot name="text">${v(`live`)}</slot>
  `}var Eo=e=>{let t=e.mediaPaused||!e.mediaTimeIsLive,n=v(t?`seek to live`:`playing live`);e.setAttribute(`aria-label`,n);let r=e.shadowRoot?.querySelector(`slot[name="text"]`);r&&(r.textContent=v(`live`)),t?e.removeAttribute(`aria-disabled`):e.setAttribute(`aria-disabled`,`true`)},Do=class extends V{static get observedAttributes(){return[...super.observedAttributes,bo,xo]}connectedCallback(){super.connectedCallback(),Eo(this)}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),Eo(this)}get mediaPaused(){return T(this,u.MEDIA_PAUSED)}set mediaPaused(e){E(this,u.MEDIA_PAUSED,e)}get mediaTimeIsLive(){return T(this,u.MEDIA_TIME_IS_LIVE)}set mediaTimeIsLive(e){E(this,u.MEDIA_TIME_IS_LIVE,e)}handleClick(){(this.mediaPaused||!this.mediaTimeIsLive)&&(this.dispatchEvent(new y.CustomEvent(So,{composed:!0,bubbles:!0})),this.hasAttribute(xo)&&this.dispatchEvent(new y.CustomEvent(Co,{composed:!0,bubbles:!0})))}};Do.getSlotTemplateHTML=To,y.customElements.get(`media-live-button`)||y.customElements.define(`media-live-button`,Do);var Oo=Do,ko=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},Ao=(e,t,n)=>(ko(e,t,`read from private field`),n?n.call(e):t.get(e)),jo=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},Mo=(e,t,n,r)=>(ko(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),No,Po,Fo={LOADING_DELAY:`loadingdelay`,NO_AUTOHIDE:`noautohide`},Io=500,Lo=`
<svg aria-hidden="true" viewBox="0 0 100 100">
  <path d="M73,50c0-12.7-10.3-23-23-23S27,37.3,27,50 M30.9,50c0-10.5,8.5-19.1,19.1-19.1S69.1,39.5,69.1,50">
    <animateTransform
       attributeName="transform"
       attributeType="XML"
       type="rotate"
       dur="1s"
       from="0 50 50"
       to="360 50 50"
       repeatCount="indefinite" />
  </path>
</svg>
`;function Ro(e){return`
    <style>
      :host {
        display: var(--media-control-display, var(--media-loading-indicator-display, inline-block));
        vertical-align: middle;
        box-sizing: border-box;
        --_loading-indicator-delay: var(--media-loading-indicator-transition-delay, ${Io}ms);
      }

      #status {
        color: rgba(0,0,0,0);
        width: 0px;
        height: 0px;
      }

      :host slot[name=icon] > *,
      :host ::slotted([slot=icon]) {
        opacity: var(--media-loading-indicator-opacity, 0);
        transition: opacity 0.15s;
      }

      :host([${u.MEDIA_LOADING}]:not([${u.MEDIA_PAUSED}])) slot[name=icon] > *,
      :host([${u.MEDIA_LOADING}]:not([${u.MEDIA_PAUSED}])) ::slotted([slot=icon]) {
        opacity: var(--media-loading-indicator-opacity, 1);
        transition: opacity 0.15s var(--_loading-indicator-delay);
      }

      :host #status {
        visibility: var(--media-loading-indicator-opacity, hidden);
        transition: visibility 0.15s;
      }

      :host([${u.MEDIA_LOADING}]:not([${u.MEDIA_PAUSED}])) #status {
        visibility: var(--media-loading-indicator-opacity, visible);
        transition: visibility 0.15s var(--_loading-indicator-delay);
      }

      svg, img, ::slotted(svg), ::slotted(img) {
        width: var(--media-loading-indicator-icon-width);
        height: var(--media-loading-indicator-icon-height, 100px);
        fill: var(--media-icon-color, var(--media-primary-color, rgb(238 238 238)));
        vertical-align: middle;
      }
    </style>

    <slot name="icon">${Lo}</slot>
    <div id="status" role="status" aria-live="polite">${v(`media loading`)}</div>
  `}var zo=class extends y.HTMLElement{constructor(){if(super(),jo(this,No,void 0),jo(this,Po,Io),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=x(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}}static get observedAttributes(){return[s.MEDIA_CONTROLLER,u.MEDIA_PAUSED,u.MEDIA_LOADING,Fo.LOADING_DELAY]}attributeChangedCallback(e,t,n){var r,i,a,o;e===Fo.LOADING_DELAY&&t!==n?this.loadingDelay=Number(n):e===s.MEDIA_CONTROLLER&&(t&&((i=(r=Ao(this,No))?.unassociateElement)==null||i.call(r,this),Mo(this,No,null)),n&&this.isConnected&&(Mo(this,No,this.getRootNode()?.getElementById(n)),(o=(a=Ao(this,No))?.associateElement)==null||o.call(a,this)))}connectedCallback(){var e,t;let n=this.getAttribute(s.MEDIA_CONTROLLER);n&&(Mo(this,No,this.getRootNode()?.getElementById(n)),(t=(e=Ao(this,No))?.associateElement)==null||t.call(e,this))}disconnectedCallback(){var e,t;(t=(e=Ao(this,No))?.unassociateElement)==null||t.call(e,this),Mo(this,No,null)}get loadingDelay(){return Ao(this,Po)}set loadingDelay(e){Mo(this,Po,e);let{style:t}=S(this.shadowRoot,`:host`);t.setProperty(`--_loading-indicator-delay`,`var(--media-loading-indicator-transition-delay, ${e}ms)`)}get mediaPaused(){return T(this,u.MEDIA_PAUSED)}set mediaPaused(e){E(this,u.MEDIA_PAUSED,e)}get mediaLoading(){return T(this,u.MEDIA_LOADING)}set mediaLoading(e){E(this,u.MEDIA_LOADING,e)}get mediaController(){return D(this,s.MEDIA_CONTROLLER)}set mediaController(e){O(this,s.MEDIA_CONTROLLER,e)}get noAutohide(){return T(this,Fo.NO_AUTOHIDE)}set noAutohide(e){E(this,Fo.NO_AUTOHIDE,e)}};No=new WeakMap,Po=new WeakMap,zo.shadowRootOptions={mode:`open`},zo.getTemplateHTML=Ro,y.customElements.get(`media-loading-indicator`)||y.customElements.define(`media-loading-indicator`,zo);var Bo=zo,Vo=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M16.5 12A4.5 4.5 0 0 0 14 8v2.18l2.45 2.45a4.22 4.22 0 0 0 .05-.63Zm2.5 0a6.84 6.84 0 0 1-.54 2.64L20 16.15A8.8 8.8 0 0 0 21 12a9 9 0 0 0-7-8.77v2.06A7 7 0 0 1 19 12ZM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25A6.92 6.92 0 0 1 14 18.7v2.06A9 9 0 0 0 17.69 19l2 2.05L21 19.73l-9-9L4.27 3ZM12 4 9.91 6.09 12 8.18V4Z"/>
</svg>`,Ho=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.47 4.47 0 0 0 2.5-4Z"/>
</svg>`,Uo=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.47 4.47 0 0 0 2.5-4ZM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54Z"/>
</svg>`;function Wo(e){return`
    <style>
      :host(:not([${u.MEDIA_VOLUME_LEVEL}])) slot[name=icon] slot:not([name=high]),
      :host([${u.MEDIA_VOLUME_LEVEL}=high]) slot[name=icon] slot:not([name=high]) {
        display: none !important;
      }

      :host([${u.MEDIA_VOLUME_LEVEL}=off]) slot[name=icon] slot:not([name=off]) {
        display: none !important;
      }

      :host([${u.MEDIA_VOLUME_LEVEL}=low]) slot[name=icon] slot:not([name=low]) {
        display: none !important;
      }

      :host([${u.MEDIA_VOLUME_LEVEL}=medium]) slot[name=icon] slot:not([name=medium]) {
        display: none !important;
      }

      :host(:not([${u.MEDIA_VOLUME_LEVEL}=off])) slot[name=tooltip-unmute],
      :host([${u.MEDIA_VOLUME_LEVEL}=off]) slot[name=tooltip-mute] {
        display: none;
      }
    </style>

    <slot name="icon">
      <slot name="off">${Vo}</slot>
      <slot name="low">${Ho}</slot>
      <slot name="medium">${Ho}</slot>
      <slot name="high">${Uo}</slot>
    </slot>
  `}function Go(){return`
    <slot name="tooltip-mute">${v(`Mute`)}</slot>
    <slot name="tooltip-unmute">${v(`Unmute`)}</slot>
  `}var Ko=e=>{let t=e.mediaVolumeLevel===`off`?v(`unmute`):v(`mute`);e.setAttribute(`aria-label`,t)},qo=class extends V{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_VOLUME_LEVEL]}connectedCallback(){super.connectedCallback(),Ko(this)}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),e===u.MEDIA_VOLUME_LEVEL&&Ko(this)}get mediaVolumeLevel(){return D(this,u.MEDIA_VOLUME_LEVEL)}set mediaVolumeLevel(e){O(this,u.MEDIA_VOLUME_LEVEL,e)}handleClick(){let e=this.mediaVolumeLevel===`off`?o.MEDIA_UNMUTE_REQUEST:o.MEDIA_MUTE_REQUEST;this.dispatchEvent(new y.CustomEvent(e,{composed:!0,bubbles:!0}))}};qo.getSlotTemplateHTML=Wo,qo.getTooltipContentHTML=Go,y.customElements.get(`media-mute-button`)||y.customElements.define(`media-mute-button`,qo);var Jo=qo,Yo=`<svg aria-hidden="true" viewBox="0 0 28 24">
  <path d="M24 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h20a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1Zm-1 16H5V5h18v14Zm-3-8h-7v5h7v-5Z"/>
</svg>`;function Xo(e){return`
    <style>
      :host([${u.MEDIA_IS_PIP}]) slot[name=icon] slot:not([name=exit]) {
        display: none !important;
      }

      :host(:not([${u.MEDIA_IS_PIP}])) slot[name=icon] slot:not([name=enter]) {
        display: none !important;
      }

      :host([${u.MEDIA_IS_PIP}]) slot[name=tooltip-enter],
      :host(:not([${u.MEDIA_IS_PIP}])) slot[name=tooltip-exit] {
        display: none;
      }
    </style>

    <slot name="icon">
      <slot name="enter">${Yo}</slot>
      <slot name="exit">${Yo}</slot>
    </slot>
  `}function Zo(){return`
    <slot name="tooltip-enter">${v(`Enter picture in picture mode`)}</slot>
    <slot name="tooltip-exit">${v(`Exit picture in picture mode`)}</slot>
  `}var Qo=e=>{let t=e.mediaIsPip?v(`exit picture in picture mode`):v(`enter picture in picture mode`);e.setAttribute(`aria-label`,t)},$o=class extends V{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_IS_PIP,u.MEDIA_PIP_UNAVAILABLE]}connectedCallback(){super.connectedCallback(),Qo(this)}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),e===u.MEDIA_IS_PIP&&Qo(this)}get mediaPipUnavailable(){return D(this,u.MEDIA_PIP_UNAVAILABLE)}set mediaPipUnavailable(e){O(this,u.MEDIA_PIP_UNAVAILABLE,e)}get mediaIsPip(){return T(this,u.MEDIA_IS_PIP)}set mediaIsPip(e){E(this,u.MEDIA_IS_PIP,e)}handleClick(){let e=this.mediaIsPip?o.MEDIA_EXIT_PIP_REQUEST:o.MEDIA_ENTER_PIP_REQUEST;this.dispatchEvent(new y.CustomEvent(e,{composed:!0,bubbles:!0}))}};$o.getSlotTemplateHTML=Xo,$o.getTooltipContentHTML=Zo,y.customElements.get(`media-pip-button`)||y.customElements.define(`media-pip-button`,$o);var es=$o,ts=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},ns=(e,t,n)=>(ts(e,t,`read from private field`),n?n.call(e):t.get(e)),rs=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},is,as={RATES:`rates`},os=[1,1.2,1.5,1.7,2];function ss(e){return Math.round(e*100)/100}function cs(e){return`
    <style>
      :host {
        min-width: 5ch;
        padding: var(--media-button-padding, var(--media-control-padding, 10px 5px));
      }
    </style>
    <slot name="icon">${e.mediaplaybackrate?ss(+e.mediaplaybackrate):1}x</slot>
  `}function ls(){return v(`Playback rate`)}var us=class extends V{constructor(){super(),rs(this,is,new wn(this,as.RATES,{defaultValue:os})),this.container=this.shadowRoot.querySelector(`slot[name="icon"]`),this.container.innerHTML=`${ss(this.mediaPlaybackRate??1)}x`}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_PLAYBACK_RATE,as.RATES]}attributeChangedCallback(e,t,n){if(super.attributeChangedCallback(e,t,n),e===as.RATES&&(ns(this,is).value=n),e===u.MEDIA_PLAYBACK_RATE){let e=n?+n:NaN,t=ss(Number.isNaN(e)?1:e);this.container.innerHTML=`${t}x`,this.setAttribute(`aria-label`,v(`Playback rate {playbackRate}`,{playbackRate:t}))}}get rates(){return ns(this,is)}set rates(e){e?Array.isArray(e)?ns(this,is).value=e.join(` `):typeof e==`string`&&(ns(this,is).value=e):ns(this,is).value=``}get mediaPlaybackRate(){return C(this,u.MEDIA_PLAYBACK_RATE,1)}set mediaPlaybackRate(e){w(this,u.MEDIA_PLAYBACK_RATE,e)}handleClick(){let e=Array.from(ns(this,is).values(),e=>+e).sort((e,t)=>e-t),t=e.find(e=>e>this.mediaPlaybackRate)??e[0]??1,n=new y.CustomEvent(o.MEDIA_PLAYBACK_RATE_REQUEST,{composed:!0,bubbles:!0,detail:t});this.dispatchEvent(n)}};is=new WeakMap,us.getSlotTemplateHTML=cs,us.getTooltipContentHTML=ls,y.customElements.get(`media-playback-rate-button`)||y.customElements.define(`media-playback-rate-button`,us);var ds=us,fs=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="m6 21 15-9L6 3v18Z"/>
</svg>`,ps=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M6 20h4V4H6v16Zm8-16v16h4V4h-4Z"/>
</svg>`;function ms(e){return`
    <style>
      :host([${u.MEDIA_PAUSED}]) slot[name=pause],
      :host(:not([${u.MEDIA_PAUSED}])) slot[name=play] {
        display: none !important;
      }

      :host([${u.MEDIA_PAUSED}]) slot[name=tooltip-pause],
      :host(:not([${u.MEDIA_PAUSED}])) slot[name=tooltip-play] {
        display: none;
      }
    </style>

    <slot name="icon">
      <slot name="play">${fs}</slot>
      <slot name="pause">${ps}</slot>
    </slot>
  `}function hs(){return`
    <slot name="tooltip-play">${v(`Play`)}</slot>
    <slot name="tooltip-pause">${v(`Pause`)}</slot>
  `}var gs=e=>{let t=e.mediaPaused?v(`play`):v(`pause`);e.setAttribute(`aria-label`,t)},_s=class extends V{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_PAUSED,u.MEDIA_ENDED]}connectedCallback(){super.connectedCallback(),gs(this)}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),(e===u.MEDIA_PAUSED||e===u.MEDIA_LANG)&&gs(this)}get mediaPaused(){return T(this,u.MEDIA_PAUSED)}set mediaPaused(e){E(this,u.MEDIA_PAUSED,e)}handleClick(){let e=this.mediaPaused?o.MEDIA_PLAY_REQUEST:o.MEDIA_PAUSE_REQUEST;this.dispatchEvent(new y.CustomEvent(e,{composed:!0,bubbles:!0}))}};_s.getSlotTemplateHTML=ms,_s.getTooltipContentHTML=hs,y.customElements.get(`media-play-button`)||y.customElements.define(`media-play-button`,_s);var vs=_s,ys={PLACEHOLDER_SRC:`placeholdersrc`,SRC:`src`};function bs(e){return`
    <style>
      :host {
        pointer-events: none;
        display: var(--media-poster-image-display, inline-block);
        box-sizing: border-box;
      }

      img {
        max-width: 100%;
        max-height: 100%;
        min-width: 100%;
        min-height: 100%;
        background-repeat: no-repeat;
        background-position: var(--media-poster-image-background-position, var(--media-object-position, center));
        background-size: var(--media-poster-image-background-size, var(--media-object-fit, contain));
        object-fit: var(--media-object-fit, contain);
        object-position: var(--media-object-position, center);
      }
    </style>

    <img part="poster img" aria-hidden="true" id="image"/>
  `}var xs=e=>{e.style.removeProperty(`background-image`)},Ss=(e,t)=>{e.style[`background-image`]=`url('${t}')`},Cs=class extends y.HTMLElement{static get observedAttributes(){return[ys.PLACEHOLDER_SRC,ys.SRC]}constructor(){if(super(),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=x(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}this.image=this.shadowRoot.querySelector(`#image`)}attributeChangedCallback(e,t,n){e===ys.SRC&&(n==null?this.image.removeAttribute(ys.SRC):this.image.setAttribute(ys.SRC,n)),e===ys.PLACEHOLDER_SRC&&(n==null?xs(this.image):Ss(this.image,n))}get placeholderSrc(){return D(this,ys.PLACEHOLDER_SRC)}set placeholderSrc(e){O(this,ys.SRC,e)}get src(){return D(this,ys.SRC)}set src(e){O(this,ys.SRC,e)}};Cs.shadowRootOptions={mode:`open`},Cs.getTemplateHTML=bs,y.customElements.get(`media-poster-image`)||y.customElements.define(`media-poster-image`,Cs);var ws=Cs,Ts=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},Es=(e,t,n)=>(Ts(e,t,`read from private field`),n?n.call(e):t.get(e)),Ds=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},Os=(e,t,n,r)=>(Ts(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),ks,As=class extends La{constructor(){super(),Ds(this,ks,void 0),Os(this,ks,this.shadowRoot.querySelector(`slot`))}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_PREVIEW_CHAPTER,u.MEDIA_LANG]}attributeChangedCallback(e,t,n){if(super.attributeChangedCallback(e,t,n),(e===u.MEDIA_PREVIEW_CHAPTER||e===u.MEDIA_LANG)&&n!==t&&n!=null){if(Es(this,ks).textContent=n,n!==``){let e=v(`chapter: {chapterName}`,{chapterName:n});this.setAttribute(`aria-valuetext`,e)}else this.removeAttribute(`aria-valuetext`)}}get mediaPreviewChapter(){return D(this,u.MEDIA_PREVIEW_CHAPTER)}set mediaPreviewChapter(e){O(this,u.MEDIA_PREVIEW_CHAPTER,e)}};ks=new WeakMap,y.customElements.get(`media-preview-chapter-display`)||y.customElements.define(`media-preview-chapter-display`,As);var js=As,Ms=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},Ns=(e,t,n)=>(Ms(e,t,`read from private field`),n?n.call(e):t.get(e)),Ps=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},Fs=(e,t,n,r)=>(Ms(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Is;function Ls(e){return`
    <style>
      :host {
        box-sizing: border-box;
        display: var(--media-control-display, var(--media-preview-thumbnail-display, inline-block));
        overflow: hidden;
      }

      img {
        display: none;
        position: relative;
      }
    </style>
    <img crossorigin loading="eager" decoding="async">
  `}var Rs=class extends y.HTMLElement{constructor(){if(super(),Ps(this,Is,void 0),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=x(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}}static get observedAttributes(){return[s.MEDIA_CONTROLLER,u.MEDIA_PREVIEW_IMAGE,u.MEDIA_PREVIEW_COORDS]}connectedCallback(){var e,t;let n=this.getAttribute(s.MEDIA_CONTROLLER);n&&(Fs(this,Is,this.getRootNode()?.getElementById(n)),(t=(e=Ns(this,Is))?.associateElement)==null||t.call(e,this))}disconnectedCallback(){var e,t;(t=(e=Ns(this,Is))?.unassociateElement)==null||t.call(e,this),Fs(this,Is,null)}attributeChangedCallback(e,t,n){var r,i,a,o;[u.MEDIA_PREVIEW_IMAGE,u.MEDIA_PREVIEW_COORDS].includes(e)&&this.update(),e===s.MEDIA_CONTROLLER&&(t&&((i=(r=Ns(this,Is))?.unassociateElement)==null||i.call(r,this),Fs(this,Is,null)),n&&this.isConnected&&(Fs(this,Is,this.getRootNode()?.getElementById(n)),(o=(a=Ns(this,Is))?.associateElement)==null||o.call(a,this)))}get mediaPreviewImage(){return D(this,u.MEDIA_PREVIEW_IMAGE)}set mediaPreviewImage(e){O(this,u.MEDIA_PREVIEW_IMAGE,e)}get mediaPreviewCoords(){let e=this.getAttribute(u.MEDIA_PREVIEW_COORDS);if(e)return e.split(/\s+/).map(e=>+e)}set mediaPreviewCoords(e){e?this.setAttribute(u.MEDIA_PREVIEW_COORDS,e.join(` `)):this.removeAttribute(u.MEDIA_PREVIEW_COORDS)}update(){let e=this.mediaPreviewCoords,t=this.mediaPreviewImage;if(!(e&&t))return;let[n,r,i,a]=e,o=t.split(`#`)[0],s=getComputedStyle(this),{maxWidth:c,maxHeight:l,minWidth:u,minHeight:d}=s,f=s.getPropertyValue(`--media-preview-thumbnail-object-fit`).trim()||`contain`,p,m;if(f===`fill`){let e=parseInt(c)/i,t=parseInt(l)/a,n=parseInt(u)/i,r=parseInt(d)/a;p=e<1?e:Math.max(e,n),m=t<1?t:Math.max(t,r)}else{let e=Math.min(parseInt(c)/i,parseInt(l)/a),t=Math.max(parseInt(u)/i,parseInt(d)/a),n=e<1?e:t>1?t:1;p=n,m=n}let{style:h}=S(this.shadowRoot,`:host`),g=S(this.shadowRoot,`img`).style,_=this.shadowRoot.querySelector(`img`),ee=Math.min(p,m)<1?`min`:`max`;h.setProperty(`${ee}-width`,`initial`,`important`),h.setProperty(`${ee}-height`,`initial`,`important`),h.width=`${i*p}px`,h.height=`${a*m}px`;let te=()=>{g.width=`${this.imgWidth*p}px`,g.height=`${this.imgHeight*m}px`,g.display=`block`};_.src!==o&&(_.onload=()=>{this.imgWidth=_.naturalWidth,this.imgHeight=_.naturalHeight,te(),_.onload=null},_.src=o,te()),te(),g.transform=`translate(-${n*p}px, -${r*m}px)`}};Is=new WeakMap,Rs.shadowRootOptions={mode:`open`},Rs.getTemplateHTML=Ls,y.customElements.get(`media-preview-thumbnail`)||y.customElements.define(`media-preview-thumbnail`,Rs);var zs=Rs,Bs=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},Vs=(e,t,n)=>(Bs(e,t,`read from private field`),n?n.call(e):t.get(e)),Hs=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},Us=(e,t,n,r)=>(Bs(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Ws,Gs=class extends La{constructor(){super(),Hs(this,Ws,void 0),Us(this,Ws,this.shadowRoot.querySelector(`slot`)),Vs(this,Ws).textContent=ve(0)}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_PREVIEW_TIME]}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),e===u.MEDIA_PREVIEW_TIME&&n!=null&&(Vs(this,Ws).textContent=ve(parseFloat(n)))}get mediaPreviewTime(){return C(this,u.MEDIA_PREVIEW_TIME)}set mediaPreviewTime(e){w(this,u.MEDIA_PREVIEW_TIME,e)}};Ws=new WeakMap,y.customElements.get(`media-preview-time-display`)||y.customElements.define(`media-preview-time-display`,Gs);var Ks=Gs,qs={SEEK_OFFSET:`seekoffset`},Js=30,Ys=e=>`
  <svg aria-hidden="true" viewBox="0 0 20 24">
    <defs>
      <style>.text{font-size:8px;font-family:Arial-BoldMT, Arial;font-weight:700;}</style>
    </defs>
    <text class="text value" transform="translate(2.18 19.87)">${e}</text>
    <path d="M10 6V3L4.37 7 10 10.94V8a5.54 5.54 0 0 1 1.9 10.48v2.12A7.5 7.5 0 0 0 10 6Z"/>
  </svg>`;function Xs(e,t){return`
    <slot name="icon">${Ys(t.seekOffset)}</slot>
  `}var Zs=(e,t)=>{e.setAttribute(`aria-label`,v(`seek back {seekOffset} seconds`,{seekOffset:t}))};function Qs(){return v(`Seek backward`)}var $s=0,ec=class extends V{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_CURRENT_TIME,qs.SEEK_OFFSET]}connectedCallback(){super.connectedCallback(),this.seekOffset=C(this,qs.SEEK_OFFSET,Js)}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),Zs(this,this.seekOffset),e===qs.SEEK_OFFSET&&(this.seekOffset=C(this,qs.SEEK_OFFSET,Js))}get seekOffset(){return C(this,qs.SEEK_OFFSET,Js)}set seekOffset(e){w(this,qs.SEEK_OFFSET,e),this.setAttribute(`aria-label`,v(`seek back {seekOffset} seconds`,{seekOffset:this.seekOffset})),Pe(Ie(this,`icon`),this.seekOffset)}get mediaCurrentTime(){return C(this,u.MEDIA_CURRENT_TIME,$s)}set mediaCurrentTime(e){w(this,u.MEDIA_CURRENT_TIME,e)}handleClick(){let e=Math.max(this.mediaCurrentTime-this.seekOffset,0),t=new y.CustomEvent(o.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:e});this.dispatchEvent(t)}};ec.getSlotTemplateHTML=Xs,ec.getTooltipContentHTML=Qs,y.customElements.get(`media-seek-backward-button`)||y.customElements.define(`media-seek-backward-button`,ec);var tc=ec,nc={SEEK_OFFSET:`seekoffset`},rc=30,ic=e=>`
  <svg aria-hidden="true" viewBox="0 0 20 24">
    <defs>
      <style>.text{font-size:8px;font-family:Arial-BoldMT, Arial;font-weight:700;}</style>
    </defs>
    <text class="text value" transform="translate(8.9 19.87)">${e}</text>
    <path d="M10 6V3l5.61 4L10 10.94V8a5.54 5.54 0 0 0-1.9 10.48v2.12A7.5 7.5 0 0 1 10 6Z"/>
  </svg>`;function ac(e,t){return`
    <slot name="icon">${ic(t.seekOffset)}</slot>
  `}var oc=(e,t)=>{e.setAttribute(`aria-label`,v(`seek forward {seekOffset} seconds`,{seekOffset:t}))};function sc(){return v(`Seek forward`)}var cc=0,lc=class extends V{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_CURRENT_TIME,nc.SEEK_OFFSET]}connectedCallback(){super.connectedCallback(),this.seekOffset=C(this,nc.SEEK_OFFSET,rc)}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),oc(this,this.seekOffset),e===nc.SEEK_OFFSET&&(this.seekOffset=C(this,nc.SEEK_OFFSET,rc))}get seekOffset(){return C(this,nc.SEEK_OFFSET,rc)}set seekOffset(e){w(this,nc.SEEK_OFFSET,e),this.setAttribute(`aria-label`,v(`seek forward {seekOffset} seconds`,{seekOffset:this.seekOffset})),Pe(Ie(this,`icon`),this.seekOffset)}get mediaCurrentTime(){return C(this,u.MEDIA_CURRENT_TIME,cc)}set mediaCurrentTime(e){w(this,u.MEDIA_CURRENT_TIME,e)}handleClick(){let e=this.mediaCurrentTime+this.seekOffset,t=new y.CustomEvent(o.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:e});this.dispatchEvent(t)}};lc.getSlotTemplateHTML=ac,lc.getTooltipContentHTML=sc,y.customElements.get(`media-seek-forward-button`)||y.customElements.define(`media-seek-forward-button`,lc);var uc=lc,dc=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},fc=(e,t,n)=>(dc(e,t,`read from private field`),n?n.call(e):t.get(e)),pc=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},mc=(e,t,n,r)=>(dc(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),hc=(e,t,n)=>(dc(e,t,`access private method`),n),gc,_c,vc,yc,bc,xc,Sc,Cc,wc,Tc,Ec,Dc={REMAINING:`remaining`,SHOW_DURATION:`showduration`,NO_TOGGLE:`notoggle`},Oc=[...Object.values(Dc),u.MEDIA_CURRENT_TIME,u.MEDIA_DURATION,u.MEDIA_SEEKABLE],kc=[`Enter`,` `],Ac=`&nbsp;/&nbsp;`,jc=(e,{timesSep:t=Ac}={})=>{let n=e.mediaCurrentTime??0,[,r]=e.mediaSeekable??[],i=0;Number.isFinite(e.mediaDuration)?i=e.mediaDuration:Number.isFinite(r)&&(i=r);let a=e.remaining?ve(0-(i-n)):ve(n);return e.showDuration?`${a}${t}${ve(i)}`:a},Mc=e=>{let t=e.mediaCurrentTime,[,n]=e.mediaSeekable??[],r=null;if(Number.isFinite(e.mediaDuration)?r=e.mediaDuration:Number.isFinite(n)&&(r=n),t==null||r===null){e.setAttribute(`aria-description`,v(`video not loaded, unknown time.`));return}let i=e.remaining?_e(0-(r-t)):_e(t);if(!e.showDuration){e.setAttribute(`aria-description`,i);return}let a=v(`{currentTime} of {totalTime}`,{currentTime:i,totalTime:_e(r)});e.setAttribute(`aria-description`,a)};function Nc(e,t){return`
    <slot>${jc(t)}</slot>
  `}var Pc=e=>{e.setAttribute(`aria-label`,v(`playback time`))},Fc=class extends La{constructor(){super(),pc(this,yc),pc(this,xc),pc(this,Cc),pc(this,Tc),pc(this,gc,void 0),pc(this,_c,null),pc(this,vc,e=>{let{metaKey:t,altKey:n,key:r}=e;t||n||!kc.includes(r)?this.removeEventListener(`keyup`,fc(this,_c)):this.addEventListener(`keyup`,fc(this,_c))}),mc(this,gc,this.shadowRoot.querySelector(`slot`)),fc(this,gc).innerHTML=`${jc(this)}`}static get observedAttributes(){return[...super.observedAttributes,...Oc,`disabled`]}connectedCallback(){let{style:e}=S(this.shadowRoot,`:host(:hover:not([notoggle]))`);e.setProperty(`cursor`,`var(--media-cursor, pointer)`),e.setProperty(`background`,`var(--media-control-hover-background, rgba(50 50 70 / .7))`),this.setAttribute(`aria-label`,v(`playback time`)),hc(this,Cc,wc).call(this),super.connectedCallback()}toggleTimeDisplay(){this.noToggle||(this.hasAttribute(`remaining`)?this.removeAttribute(`remaining`):this.setAttribute(`remaining`,``))}disconnectedCallback(){this.disable(),hc(this,xc,Sc).call(this),super.disconnectedCallback()}attributeChangedCallback(e,t,n){Pc(this),Oc.includes(e)?this.update():e===`disabled`&&n!==t?n==null?hc(this,Cc,wc).call(this):hc(this,Tc,Ec).call(this):e===Dc.NO_TOGGLE&&n!==t&&(this.noToggle?hc(this,Tc,Ec).call(this):hc(this,Cc,wc).call(this)),super.attributeChangedCallback(e,t,n)}enable(){this.noToggle||(this.tabIndex=0)}disable(){this.tabIndex=-1}get remaining(){return T(this,Dc.REMAINING)}set remaining(e){E(this,Dc.REMAINING,e)}get showDuration(){return T(this,Dc.SHOW_DURATION)}set showDuration(e){E(this,Dc.SHOW_DURATION,e)}get noToggle(){return T(this,Dc.NO_TOGGLE)}set noToggle(e){E(this,Dc.NO_TOGGLE,e)}get mediaDuration(){return C(this,u.MEDIA_DURATION)}set mediaDuration(e){w(this,u.MEDIA_DURATION,e)}get mediaCurrentTime(){return C(this,u.MEDIA_CURRENT_TIME)}set mediaCurrentTime(e){w(this,u.MEDIA_CURRENT_TIME,e)}get mediaSeekable(){let e=this.getAttribute(u.MEDIA_SEEKABLE);if(e)return e.split(`:`).map(e=>+e)}set mediaSeekable(e){e==null?this.removeAttribute(u.MEDIA_SEEKABLE):this.setAttribute(u.MEDIA_SEEKABLE,e.join(`:`))}update(){let e=jc(this);Mc(this),e!==fc(this,gc).innerHTML&&(fc(this,gc).innerHTML=e)}};gc=new WeakMap,_c=new WeakMap,vc=new WeakMap,yc=new WeakSet,bc=function(){fc(this,_c)||(mc(this,_c,e=>{let{key:t}=e;kc.includes(t)?this.toggleTimeDisplay():this.removeEventListener(`keyup`,fc(this,_c))}),this.addEventListener(`keydown`,fc(this,vc)),this.addEventListener(`click`,this.toggleTimeDisplay))},xc=new WeakSet,Sc=function(){fc(this,_c)&&(this.removeEventListener(`keyup`,fc(this,_c)),this.removeEventListener(`keydown`,fc(this,vc)),this.removeEventListener(`click`,this.toggleTimeDisplay),mc(this,_c,null))},Cc=new WeakSet,wc=function(){!this.noToggle&&!this.hasAttribute(`disabled`)&&(this.setAttribute(`role`,`button`),this.enable(),hc(this,yc,bc).call(this))},Tc=new WeakSet,Ec=function(){this.removeAttribute(`role`),this.disable(),hc(this,xc,Sc).call(this)},Fc.getSlotTemplateHTML=Nc,y.customElements.get(`media-time-display`)||y.customElements.define(`media-time-display`,Fc);var Ic=Fc,Lc=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},W=(e,t,n)=>(Lc(e,t,`read from private field`),n?n.call(e):t.get(e)),Rc=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},G=(e,t,n,r)=>(Lc(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),zc=(e,t,n,r)=>({set _(r){G(e,t,r,n)},get _(){return W(e,t,r)}}),Bc,Vc,Hc,Uc,Wc,Gc,Kc,qc,Jc,Yc,Xc=class{constructor(e,t,n){Rc(this,Bc,void 0),Rc(this,Vc,void 0),Rc(this,Hc,void 0),Rc(this,Uc,void 0),Rc(this,Wc,void 0),Rc(this,Gc,void 0),Rc(this,Kc,void 0),Rc(this,qc,void 0),Rc(this,Jc,0),Rc(this,Yc,(e=performance.now())=>{G(this,Jc,requestAnimationFrame(W(this,Yc))),G(this,Uc,performance.now()-W(this,Hc));let t=1e3/this.fps;if(W(this,Uc)>t){G(this,Hc,e-W(this,Uc)%t);let n=1e3/((e-W(this,Vc))/++zc(this,Wc)._),r=(e-W(this,Gc))/1e3/this.duration,i=W(this,Kc)+r*this.playbackRate;i-W(this,Bc).valueAsNumber>0?G(this,qc,this.playbackRate/this.duration/n):(G(this,qc,.995*W(this,qc)),i=W(this,Bc).valueAsNumber+W(this,qc)),this.callback(i)}}),G(this,Bc,e),this.callback=t,this.fps=n}start(){W(this,Jc)===0&&(G(this,Hc,performance.now()),G(this,Vc,W(this,Hc)),G(this,Wc,0),W(this,Yc).call(this))}stop(){W(this,Jc)!==0&&(cancelAnimationFrame(W(this,Jc)),G(this,Jc,0))}update({start:e,duration:t,playbackRate:n}){let r=e-W(this,Bc).valueAsNumber,i=Math.abs(t-this.duration);(r>0||r<-.5/t||i>=.5)&&this.callback(e),G(this,Kc,e),G(this,Gc,performance.now()),this.duration=t,this.playbackRate=n}};Bc=new WeakMap,Vc=new WeakMap,Hc=new WeakMap,Uc=new WeakMap,Wc=new WeakMap,Gc=new WeakMap,Kc=new WeakMap,qc=new WeakMap,Jc=new WeakMap,Yc=new WeakMap;var Zc=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},K=(e,t,n)=>(Zc(e,t,`read from private field`),n?n.call(e):t.get(e)),q=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},J=(e,t,n,r)=>(Zc(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Y=(e,t,n)=>(Zc(e,t,`access private method`),n),Qc,$c,el,tl,nl,rl,il,al,ol,sl,cl,ll,ul,dl,fl,pl,ml,hl,gl,_l,vl,yl,bl,xl,Sl,Cl,wl=e=>{let t=e.range,n=_e(+Dl(e)),r=_e(+e.mediaSeekableEnd),i=n&&r?v(`{currentTime} of {totalTime}`,{currentTime:n,totalTime:r}):v(`video not loaded, unknown time.`);t.setAttribute(`aria-valuetext`,i)};function Tl(e){return`
    <style>
      :host {
        --media-box-border-radius: 4px;
        --media-box-padding-left: 10px;
        --media-box-padding-right: 10px;
        --media-preview-border-radius: var(--media-box-border-radius);
        --media-box-arrow-offset: var(--media-box-border-radius);
        --_control-background: var(--media-control-background, var(--media-secondary-color, rgb(20 20 30 / .7)));
        --_preview-background: var(--media-preview-background, var(--_control-background));

        
        contain: layout;
      }

      #buffered {
        background: var(--media-time-range-buffered-color, rgb(255 255 255 / .4));
        position: absolute;
        height: 100%;
        will-change: width;
      }

      #preview-rail,
      #current-rail {
        width: 100%;
        position: absolute;
        left: 0;
        bottom: 100%;
        pointer-events: none;
        will-change: transform;
      }

      [part~="box"] {
        width: min-content;
        
        position: absolute;
        bottom: 100%;
        flex-direction: column;
        align-items: center;
        transform: translateX(-50%);
      }

      [part~="current-box"] {
        display: var(--media-current-box-display, var(--media-box-display, flex));
        margin: var(--media-current-box-margin, var(--media-box-margin, 0 0 5px));
        visibility: hidden;
      }

      [part~="preview-box"] {
        display: var(--media-preview-box-display, var(--media-box-display, flex));
        margin: var(--media-preview-box-margin, var(--media-box-margin, 0 0 5px));
        transition-property: var(--media-preview-transition-property, visibility, opacity);
        transition-duration: var(--media-preview-transition-duration-out, .25s);
        transition-delay: var(--media-preview-transition-delay-out, 0s);
        visibility: hidden;
        opacity: 0;
      }

      :host(:is([${u.MEDIA_PREVIEW_IMAGE}], [${u.MEDIA_PREVIEW_TIME}])[dragging]) [part~="preview-box"] {
        transition-duration: var(--media-preview-transition-duration-in, .5s);
        transition-delay: var(--media-preview-transition-delay-in, .25s);
        visibility: visible;
        opacity: 1;
      }

      @media (hover: hover) {
        :host(:is([${u.MEDIA_PREVIEW_IMAGE}], [${u.MEDIA_PREVIEW_TIME}]):hover) [part~="preview-box"] {
          transition-duration: var(--media-preview-transition-duration-in, .5s);
          transition-delay: var(--media-preview-transition-delay-in, .25s);
          visibility: visible;
          opacity: 1;
        }
      }

      media-preview-thumbnail,
      ::slotted(media-preview-thumbnail) {
        visibility: hidden;
        
        transition: visibility 0s .25s;
        transition-delay: calc(var(--media-preview-transition-delay-out, 0s) + var(--media-preview-transition-duration-out, .25s));
        background: var(--media-preview-thumbnail-background, var(--_preview-background));
        box-shadow: var(--media-preview-thumbnail-box-shadow, 0 0 4px rgb(0 0 0 / .2));
        max-width: var(--media-preview-thumbnail-max-width, 180px);
        max-height: var(--media-preview-thumbnail-max-height, 160px);
        min-width: var(--media-preview-thumbnail-min-width, 120px);
        min-height: var(--media-preview-thumbnail-min-height, 80px);
        border: var(--media-preview-thumbnail-border);
        border-radius: var(--media-preview-thumbnail-border-radius,
          var(--media-preview-border-radius) var(--media-preview-border-radius) 0 0);
      }

      :host([${u.MEDIA_PREVIEW_IMAGE}][dragging]) media-preview-thumbnail,
      :host([${u.MEDIA_PREVIEW_IMAGE}][dragging]) ::slotted(media-preview-thumbnail) {
        transition-delay: var(--media-preview-transition-delay-in, .25s);
        visibility: visible;
      }

      @media (hover: hover) {
        :host([${u.MEDIA_PREVIEW_IMAGE}]:hover) media-preview-thumbnail,
        :host([${u.MEDIA_PREVIEW_IMAGE}]:hover) ::slotted(media-preview-thumbnail) {
          transition-delay: var(--media-preview-transition-delay-in, .25s);
          visibility: visible;
        }

        :host([${u.MEDIA_PREVIEW_TIME}]:hover) {
          --media-time-range-hover-display: block;
        }
      }

      media-preview-chapter-display,
      ::slotted(media-preview-chapter-display) {
        font-size: var(--media-font-size, 13px);
        line-height: 17px;
        min-width: 0;
        visibility: hidden;
        
        transition: min-width 0s, border-radius 0s, margin 0s, padding 0s, visibility 0s;
        transition-delay: calc(var(--media-preview-transition-delay-out, 0s) + var(--media-preview-transition-duration-out, .25s));
        background: var(--media-preview-chapter-background, var(--_preview-background));
        border-radius: var(--media-preview-chapter-border-radius,
          var(--media-preview-border-radius) var(--media-preview-border-radius)
          var(--media-preview-border-radius) var(--media-preview-border-radius));
        padding: var(--media-preview-chapter-padding, 3.5px 9px);
        margin: var(--media-preview-chapter-margin, 0 0 5px);
        text-shadow: var(--media-preview-chapter-text-shadow, 0 0 4px rgb(0 0 0 / .75));
      }

      :host([${u.MEDIA_PREVIEW_IMAGE}]) media-preview-chapter-display,
      :host([${u.MEDIA_PREVIEW_IMAGE}]) ::slotted(media-preview-chapter-display) {
        transition-delay: var(--media-preview-transition-delay-in, .25s);
        border-radius: var(--media-preview-chapter-border-radius, 0);
        padding: var(--media-preview-chapter-padding, 3.5px 9px 0);
        margin: var(--media-preview-chapter-margin, 0);
        min-width: 100%;
      }

      media-preview-chapter-display[${u.MEDIA_PREVIEW_CHAPTER}],
      ::slotted(media-preview-chapter-display[${u.MEDIA_PREVIEW_CHAPTER}]) {
        visibility: visible;
      }

      media-preview-chapter-display:not([aria-valuetext]),
      ::slotted(media-preview-chapter-display:not([aria-valuetext])) {
        display: none;
      }

      media-preview-time-display,
      ::slotted(media-preview-time-display),
      media-time-display,
      ::slotted(media-time-display) {
        font-size: var(--media-font-size, 13px);
        line-height: 17px;
        min-width: 0;
        
        transition: min-width 0s, border-radius 0s;
        transition-delay: calc(var(--media-preview-transition-delay-out, 0s) + var(--media-preview-transition-duration-out, .25s));
        background: var(--media-preview-time-background, var(--_preview-background));
        border-radius: var(--media-preview-time-border-radius,
          var(--media-preview-border-radius) var(--media-preview-border-radius)
          var(--media-preview-border-radius) var(--media-preview-border-radius));
        padding: var(--media-preview-time-padding, 3.5px 9px);
        margin: var(--media-preview-time-margin, 0);
        text-shadow: var(--media-preview-time-text-shadow, 0 0 4px rgb(0 0 0 / .75));
        transform: translateX(min(
          max(calc(50% - var(--_box-width) / 2),
          calc(var(--_box-shift, 0))),
          calc(var(--_box-width) / 2 - 50%)
        ));
      }

      :host([${u.MEDIA_PREVIEW_IMAGE}]) media-preview-time-display,
      :host([${u.MEDIA_PREVIEW_IMAGE}]) ::slotted(media-preview-time-display) {
        transition-delay: var(--media-preview-transition-delay-in, .25s);
        border-radius: var(--media-preview-time-border-radius,
          0 0 var(--media-preview-border-radius) var(--media-preview-border-radius));
        min-width: 100%;
      }

      :host([${u.MEDIA_PREVIEW_TIME}]:hover) {
        --media-time-range-hover-display: block;
      }

      [part~="arrow"],
      ::slotted([part~="arrow"]) {
        display: var(--media-box-arrow-display, inline-block);
        transform: translateX(min(
          max(calc(50% - var(--_box-width) / 2 + var(--media-box-arrow-offset)),
          calc(var(--_box-shift, 0))),
          calc(var(--_box-width) / 2 - 50% - var(--media-box-arrow-offset))
        ));
        
        border-color: transparent;
        border-top-color: var(--media-box-arrow-background, var(--_control-background));
        border-width: var(--media-box-arrow-border-width,
          var(--media-box-arrow-height, 5px) var(--media-box-arrow-width, 6px) 0);
        border-style: solid;
        justify-content: center;
        height: 0;
      }
    </style>
    <div id="preview-rail">
      <slot name="preview" part="box preview-box">
        <media-preview-thumbnail>
          <template shadowrootmode="${zs.shadowRootOptions.mode}">
            ${zs.getTemplateHTML({})}
          </template>
        </media-preview-thumbnail>
        <media-preview-chapter-display></media-preview-chapter-display>
        <media-preview-time-display></media-preview-time-display>
        <slot name="preview-arrow"><div part="arrow"></div></slot>
      </slot>
    </div>
    <div id="current-rail">
      <slot name="current" part="box current-box">
        
      </slot>
    </div>
  `}var El=(e,t=e.mediaCurrentTime)=>{let n=Number.isFinite(e.mediaSeekableStart)?e.mediaSeekableStart:0,r=Number.isFinite(e.mediaDuration)?e.mediaDuration:e.mediaSeekableEnd;if(Number.isNaN(r))return 0;let i=(t-n)/(r-n);return Math.max(0,Math.min(i,1))},Dl=(e,t=e.range.valueAsNumber)=>{let n=Number.isFinite(e.mediaSeekableStart)?e.mediaSeekableStart:0,r=Number.isFinite(e.mediaDuration)?e.mediaDuration:e.mediaSeekableEnd;return Number.isNaN(r)?0:t*(r-n)+n},Ol=class extends ba{constructor(){super(),q(this,ll),q(this,fl),q(this,ml),q(this,gl),q(this,vl),q(this,bl),q(this,Sl),q(this,Qc,null),q(this,$c,void 0),q(this,el,void 0),q(this,tl,void 0),q(this,nl,void 0),q(this,rl,void 0),q(this,il,void 0),q(this,al,void 0),q(this,ol,void 0),q(this,sl,void 0),q(this,cl,()=>{Y(this,ll,ul).call(this)?K(this,$c).start():K(this,$c).stop()}),q(this,dl,e=>{this.dragging||(ae(e)&&(this.range.valueAsNumber=e),K(this,sl)||this.updateBar())}),this.shadowRoot.querySelector(`#track`).insertAdjacentHTML(`afterbegin`,`<div id="buffered" part="buffered"></div>`),J(this,el,this.shadowRoot.querySelectorAll(`[part~="box"]`)),J(this,nl,this.shadowRoot.querySelector(`[part~="preview-box"]`)),J(this,rl,this.shadowRoot.querySelector(`[part~="current-box"]`));let e=getComputedStyle(this);J(this,il,parseInt(e.getPropertyValue(`--media-box-padding-left`))),J(this,al,parseInt(e.getPropertyValue(`--media-box-padding-right`))),J(this,$c,new Xc(this.range,K(this,dl),60))}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_PAUSED,u.MEDIA_DURATION,u.MEDIA_SEEKABLE,u.MEDIA_CURRENT_TIME,u.MEDIA_PREVIEW_IMAGE,u.MEDIA_PREVIEW_TIME,u.MEDIA_PREVIEW_CHAPTER,u.MEDIA_BUFFERED,u.MEDIA_PLAYBACK_RATE,u.MEDIA_LOADING,u.MEDIA_ENDED]}connectedCallback(){var e;super.connectedCallback(),this.range.setAttribute(`aria-label`,v(`seek`)),K(this,cl).call(this),J(this,Qc,this.getRootNode()),(e=K(this,Qc))==null||e.addEventListener(`transitionstart`,this)}disconnectedCallback(){var e;super.disconnectedCallback(),K(this,$c).stop(),(e=K(this,Qc))==null||e.removeEventListener(`transitionstart`,this),J(this,Qc,null)}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),t!=n&&(e===u.MEDIA_CURRENT_TIME||e===u.MEDIA_PAUSED||e===u.MEDIA_ENDED||e===u.MEDIA_LOADING||e===u.MEDIA_DURATION||e===u.MEDIA_SEEKABLE?(K(this,$c).update({start:El(this),duration:this.mediaSeekableEnd-this.mediaSeekableStart,playbackRate:this.mediaPlaybackRate}),K(this,cl).call(this),wl(this)):e===u.MEDIA_BUFFERED&&this.updateBufferedBar(),(e===u.MEDIA_DURATION||e===u.MEDIA_SEEKABLE)&&(this.mediaChaptersCues=K(this,ol),this.updateBar()))}get mediaChaptersCues(){return K(this,ol)}set mediaChaptersCues(e){J(this,ol,e),this.updateSegments(K(this,ol)?.map(e=>({start:El(this,e.startTime),end:El(this,e.endTime)})))}get mediaPaused(){return T(this,u.MEDIA_PAUSED)}set mediaPaused(e){E(this,u.MEDIA_PAUSED,e)}get mediaLoading(){return T(this,u.MEDIA_LOADING)}set mediaLoading(e){E(this,u.MEDIA_LOADING,e)}get mediaDuration(){return C(this,u.MEDIA_DURATION)}set mediaDuration(e){w(this,u.MEDIA_DURATION,e)}get mediaCurrentTime(){return C(this,u.MEDIA_CURRENT_TIME)}set mediaCurrentTime(e){w(this,u.MEDIA_CURRENT_TIME,e)}get mediaPlaybackRate(){return C(this,u.MEDIA_PLAYBACK_RATE,1)}set mediaPlaybackRate(e){w(this,u.MEDIA_PLAYBACK_RATE,e)}get mediaBuffered(){let e=this.getAttribute(u.MEDIA_BUFFERED);return e?e.split(` `).map(e=>e.split(`:`).map(e=>+e)):[]}set mediaBuffered(e){if(!e){this.removeAttribute(u.MEDIA_BUFFERED);return}let t=e.map(e=>e.join(`:`)).join(` `);this.setAttribute(u.MEDIA_BUFFERED,t)}get mediaSeekable(){let e=this.getAttribute(u.MEDIA_SEEKABLE);if(e)return e.split(`:`).map(e=>+e)}set mediaSeekable(e){e==null?this.removeAttribute(u.MEDIA_SEEKABLE):this.setAttribute(u.MEDIA_SEEKABLE,e.join(`:`))}get mediaSeekableEnd(){let[,e=this.mediaDuration]=this.mediaSeekable??[];return e}get mediaSeekableStart(){let[e=0]=this.mediaSeekable??[];return e}get mediaPreviewImage(){return D(this,u.MEDIA_PREVIEW_IMAGE)}set mediaPreviewImage(e){O(this,u.MEDIA_PREVIEW_IMAGE,e)}get mediaPreviewTime(){return C(this,u.MEDIA_PREVIEW_TIME)}set mediaPreviewTime(e){w(this,u.MEDIA_PREVIEW_TIME,e)}get mediaEnded(){return T(this,u.MEDIA_ENDED)}set mediaEnded(e){E(this,u.MEDIA_ENDED,e)}updateBar(){super.updateBar(),this.updateBufferedBar(),this.updateCurrentBox()}updateBufferedBar(){let e=this.mediaBuffered;if(!e.length)return;let t;if(this.mediaEnded)t=1;else{let n=this.mediaCurrentTime,[,r=this.mediaSeekableStart]=e.find(([e,t])=>e<=n&&n<=t)??[];t=El(this,r)}let{style:n}=S(this.shadowRoot,`#buffered`);n.setProperty(`width`,`${t*100}%`)}updateCurrentBox(){if(!this.shadowRoot.querySelector(`slot[name="current"]`).assignedElements().length)return;let e=S(this.shadowRoot,`#current-rail`),t=S(this.shadowRoot,`[part~="current-box"]`),n=Y(this,fl,pl).call(this,K(this,rl)),r=Y(this,ml,hl).call(this,n,this.range.valueAsNumber),i=Y(this,gl,_l).call(this,n,this.range.valueAsNumber);e.style.transform=`translateX(${r})`,e.style.setProperty(`--_range-width`,`${n.range.width}`),t.style.setProperty(`--_box-shift`,`${i}`),t.style.setProperty(`--_box-width`,`${n.box.width}px`),t.style.setProperty(`visibility`,`initial`)}handleEvent(e){switch(super.handleEvent(e),e.type){case`input`:Y(this,Sl,Cl).call(this);break;case`pointermove`:Y(this,vl,yl).call(this,e);break;case`pointerup`:K(this,sl)&&J(this,sl,!1);break;case`pointerdown`:J(this,sl,!0);break;case`pointerleave`:Y(this,bl,xl).call(this,null);break;case`transitionstart`:Le(e.target,this)&&setTimeout(()=>K(this,cl).call(this),0)}}};Qc=new WeakMap,$c=new WeakMap,el=new WeakMap,tl=new WeakMap,nl=new WeakMap,rl=new WeakMap,il=new WeakMap,al=new WeakMap,ol=new WeakMap,sl=new WeakMap,cl=new WeakMap,ll=new WeakSet,ul=function(){return this.isConnected&&!this.mediaPaused&&!this.mediaLoading&&!this.mediaEnded&&this.mediaSeekableEnd>0&&Ve(this)},dl=new WeakMap,fl=new WeakSet,pl=function(e){let t=((this.getAttribute(`bounds`)?Re(this,`#${this.getAttribute(`bounds`)}`):this.parentElement)??this).getBoundingClientRect(),n=this.range.getBoundingClientRect(),r=e.offsetWidth;return{box:{width:r,min:-(n.left-t.left-r/2),max:t.right-n.left-r/2},bounds:t,range:n}},ml=new WeakSet,hl=function(e,t){let n=`${t*100}%`,{width:r,min:i,max:a}=e.box;if(!r)return n;if(Number.isNaN(i)||(n=`max(${`calc(1 / var(--_range-width) * 100 * ${i}% + var(--media-box-padding-left))`}, ${n})`),!Number.isNaN(a)){let e=`calc(1 / var(--_range-width) * 100 * ${a}% - var(--media-box-padding-right))`;n=`min(${n}, ${e})`}return n},gl=new WeakSet,_l=function(e,t){let{width:n,min:r,max:i}=e.box,a=t*e.range.width;if(a<r+K(this,il)){let t=e.range.left-e.bounds.left-K(this,il);return`${a-n/2+t}px`}if(a>i-K(this,al)){let t=e.bounds.right-e.range.right-K(this,al);return`${a+n/2-t-e.range.width}px`}return 0},vl=new WeakSet,yl=function(e){let t=[...K(this,el)].some(t=>e.composedPath().includes(t));if(!this.dragging&&(t||!e.composedPath().includes(this))){Y(this,bl,xl).call(this,null);return}let n=this.mediaSeekableEnd;if(!n)return;let r=S(this.shadowRoot,`#preview-rail`),i=S(this.shadowRoot,`[part~="preview-box"]`),a=Y(this,fl,pl).call(this,K(this,nl)),o=(e.clientX-a.range.left)/a.range.width;o=Math.max(0,Math.min(1,o));let s=Y(this,ml,hl).call(this,a,o),c=Y(this,gl,_l).call(this,a,o);r.style.transform=`translateX(${s})`,r.style.setProperty(`--_range-width`,`${a.range.width}`),i.style.setProperty(`--_box-shift`,`${c}`),i.style.setProperty(`--_box-width`,`${a.box.width}px`);let l=Math.round(K(this,tl))-Math.round(o*n);Math.abs(l)<1&&o>.01&&o<.99||(J(this,tl,o*n),Y(this,bl,xl).call(this,K(this,tl)))},bl=new WeakSet,xl=function(e){this.dispatchEvent(new y.CustomEvent(o.MEDIA_PREVIEW_REQUEST,{composed:!0,bubbles:!0,detail:e}))},Sl=new WeakSet,Cl=function(){K(this,$c).stop();let e=Dl(this);this.dispatchEvent(new y.CustomEvent(o.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:e}))},Ol.shadowRootOptions={mode:`open`},Ol.getContainerTemplateHTML=Tl,y.customElements.get(`media-time-range`)||y.customElements.define(`media-time-range`,Ol);var kl=Ol,Al=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},jl=(e,t,n)=>(Al(e,t,`read from private field`),n?n.call(e):t.get(e)),Ml=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},Nl,Pl=1,Fl=e=>e.mediaMuted?0:e.mediaVolume,Il=e=>`${Math.round(e*100)}%`,Ll=class extends ba{constructor(){super(...arguments),Ml(this,Nl,()=>{let e=this.range.value,t=new y.CustomEvent(o.MEDIA_VOLUME_REQUEST,{composed:!0,bubbles:!0,detail:e});this.dispatchEvent(t)})}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_VOLUME,u.MEDIA_MUTED,u.MEDIA_VOLUME_UNAVAILABLE]}connectedCallback(){super.connectedCallback(),this.range.setAttribute(`aria-label`,v(`volume`)),this.range.addEventListener(`input`,jl(this,Nl))}disconnectedCallback(){this.range.removeEventListener(`input`,jl(this,Nl)),super.disconnectedCallback()}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),(e===u.MEDIA_VOLUME||e===u.MEDIA_MUTED)&&(this.range.valueAsNumber=Fl(this),this.range.setAttribute(`aria-valuetext`,Il(this.range.valueAsNumber)),this.updateBar())}get mediaVolume(){return C(this,u.MEDIA_VOLUME,Pl)}set mediaVolume(e){w(this,u.MEDIA_VOLUME,e)}get mediaMuted(){return T(this,u.MEDIA_MUTED)}set mediaMuted(e){E(this,u.MEDIA_MUTED,e)}get mediaVolumeUnavailable(){return D(this,u.MEDIA_VOLUME_UNAVAILABLE)}set mediaVolumeUnavailable(e){O(this,u.MEDIA_VOLUME_UNAVAILABLE,e)}};Nl=new WeakMap,y.customElements.get(`media-volume-range`)||y.customElements.define(`media-volume-range`,Ll);var Rl=Ll;function zl(e){return`
      <style>
        :host {
          min-width: 4ch;
          padding: var(--media-button-padding, var(--media-control-padding, 10px 5px));
          width: 100%;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 1rem;
          font-weight: var(--media-button-font-weight, normal);
        }

        #checked-indicator {
          display: none;
        }

        :host([${u.MEDIA_LOOP}]) #checked-indicator {
          display: block;
        }
      </style>
      
      <span id="icon">
     </span>

      <div id="checked-indicator">
        <svg aria-hidden="true" viewBox="0 1 24 24" part="checked-indicator indicator">
          <path d="m10 15.17 9.193-9.191 1.414 1.414-10.606 10.606-6.364-6.364 1.414-1.414 4.95 4.95Z"/>
        </svg>
      </div>
    `}function Bl(){return v(`Loop`)}var Vl=class extends V{constructor(){super(...arguments),this.container=null}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_LOOP]}connectedCallback(){super.connectedCallback(),this.container=this.shadowRoot?.querySelector(`#icon`)||null,this.container&&(this.container.textContent=v(`Loop`))}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),e===u.MEDIA_LOOP&&this.container&&this.setAttribute(`aria-checked`,this.mediaLoop?`true`:`false`)}get mediaLoop(){return T(this,u.MEDIA_LOOP)}set mediaLoop(e){E(this,u.MEDIA_LOOP,e)}handleClick(){let e=!this.mediaLoop,t=new y.CustomEvent(o.MEDIA_LOOP_REQUEST,{composed:!0,bubbles:!0,detail:e});this.dispatchEvent(t)}};Vl.getSlotTemplateHTML=zl,Vl.getTooltipContentHTML=Bl,y.customElements.get(`media-loop-button`)||y.customElements.define(`media-loop-button`,Vl);var Hl=Vl,X=e(t(),1),Ul=new Set([`style`,`children`,`ref`,`key`,`suppressContentEditableWarning`,`suppressHydrationWarning`,`dangerouslySetInnerHTML`]),Wl={className:`class`,htmlFor:`for`};function Gl(e){return e.toLowerCase()}function Kl(e){if(typeof e==`boolean`)return e?``:void 0;if(typeof e!=`function`&&!(typeof e==`object`&&e))return e}function Z({react:e,tagName:t,elementClass:n,events:r,displayName:i,defaultProps:a,toAttributeName:o=Gl,toAttributeValue:s=Kl}){let c=Number.parseInt(e.version)>=19,l=e.forwardRef((i,l)=>{let u=e.useRef(null),d=e.useRef(new Map),f={},p={},m={},h={};for(let[e,t]of Object.entries(i)){if(Ul.has(e)){m[e]=t;continue}let r=o(Wl[e]??e);if(n.prototype&&e in n.prototype&&!(e in(globalThis.HTMLElement?.prototype??{}))&&!n.observedAttributes?.some(e=>e===r)){h[e]=t;continue}if(e.startsWith(`on`)){f[e]=t;continue}let i=s(t);r&&i!=null&&(p[r]=String(i),c||(m[r]=i)),r&&c&&(m[r]=i===Kl(t)?t:i)}if(typeof window<`u`){for(let t in f){let n=f[t],i=t.endsWith(`Capture`),a=(r?.[t]??t.slice(2).toLowerCase()).slice(0,i?-7:void 0);e.useLayoutEffect(()=>{let e=u?.current;if(e&&typeof n==`function`)return e.addEventListener(a,n,i),()=>{e.removeEventListener(a,n,i)}},[u?.current,n])}e.useLayoutEffect(()=>{if(u.current===null)return;let e=new Map;for(let t in h)ql(u.current,t,h[t]),d.current.delete(t),e.set(t,h[t]);for(let[e,t]of d.current)ql(u.current,e,void 0);d.current=e})}if(typeof window>`u`&&n?.getTemplateHTML&&n?.shadowRootOptions){let{mode:t,delegatesFocus:r}=n.shadowRootOptions;m.children=[e.createElement(`template`,{shadowrootmode:t,shadowrootdelegatesfocus:r,dangerouslySetInnerHTML:{__html:n.getTemplateHTML(p,i)},key:`ce-la-react-ssr-template-shadow-root`}),m.children]}return e.createElement(t,{...a,...m,ref:e.useCallback(e=>{u.current=e,typeof l==`function`?l(e):l!==null&&(l.current=e)},[l])},m.children)});return l.displayName=i??n.name,l}function ql(e,t,n){e[t]=n,n==null&&t in(globalThis.HTMLElement?.prototype??{})&&e.removeAttribute(t)}function Q(e){if(typeof e==`boolean`)return e?``:void 0;if(typeof e!=`function`){if(Array.isArray(e)&&e.every(e=>typeof e==`string`||typeof e==`number`||typeof e==`boolean`))return e.join(` `);if(!(typeof e==`object`&&e))return e}}Z({tagName:`media-gesture-receiver`,elementClass:Qe,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-container`,elementClass:kt,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-chrome-dialog`,elementClass:en,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-keyboard-shortcuts-dialog`,elementClass:mn,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});var Jl=Z({tagName:`media-controller`,elementClass:$r,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});Z({tagName:`media-tooltip`,elementClass:ri,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-chrome-button`,elementClass:xi,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-airplay-button`,elementClass:Di,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});var Yl=Z({tagName:`media-captions-button`,elementClass:Ii,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});Z({tagName:`media-cast-button`,elementClass:Ui,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-chrome-range`,elementClass:xa,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});var Xl=Z({tagName:`media-control-bar`,elementClass:ka,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});Z({tagName:`media-text-display`,elementClass:Ra,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-duration-display`,elementClass:Ka,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-error-dialog`,elementClass:oo,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});var Zl=Z({tagName:`media-fullscreen-button`,elementClass:yo,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});Z({tagName:`media-live-button`,elementClass:Oo,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});var Ql=Z({tagName:`media-loading-indicator`,elementClass:Bo,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),$l=Z({tagName:`media-mute-button`,elementClass:Jo,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});Z({tagName:`media-pip-button`,elementClass:es,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-playback-rate-button`,elementClass:ds,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});var eu=Z({tagName:`media-play-button`,elementClass:vs,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});Z({tagName:`media-poster-image`,elementClass:ws,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-preview-chapter-display`,elementClass:js,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-preview-thumbnail`,elementClass:zs,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-preview-time-display`,elementClass:Ks,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-seek-backward-button`,elementClass:tc,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-seek-forward-button`,elementClass:uc,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});var tu=Z({tagName:`media-time-display`,elementClass:Ic,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),nu=Z({tagName:`media-time-range`,elementClass:kl,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});Z({tagName:`media-volume-range`,elementClass:Rl,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-loop-button`,elementClass:Hl,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});function ru(e){return{Play:e.play,play:e.play,Pause:e.pause,pause:e.pause,Captions:e.captions,"closed captions":e.captions,"Enable captions":e.enableCaptions,"Disable captions":e.disableCaptions,"Enter fullscreen mode":e.enterFullscreen,"enter fullscreen mode":e.enterFullscreen,"Exit fullscreen mode":e.exitFullscreen,"exit fullscreen mode":e.exitFullscreen,Mute:e.mute,mute:e.mute,Unmute:e.unmute,unmute:e.unmute,seek:e.seek,"video player":e.videoPlayer,"playback time":e.playbackTime,"media loading":e.loading,"{currentTime} of {totalTime}":e.timeOf,"{time} remaining":e.remaining,hour:e.hour,hours:e.hours,minute:e.minute,minutes:e.minutes,second:e.second,seconds:e.seconds,"Network Error":e.networkError,"Decode Error":e.decodeError,"Source Not Supported":e.notSupported,"A network error caused the media download to fail.":e.networkError,"A media error caused playback to be aborted. The media could be corrupt or your browser does not support this format.":e.decodeError,"An unsupported error occurred. The server or network failed, or your browser does not support this format.":e.notSupported,"video not loaded, unknown time.":e.notLoaded}}var $=n(),iu=e=>e;function au({film:e,title:t,lang:n,memoryKey:o,captions:s,onCaptions:c,onWatched:l,autoStart:u}){let{lang:d,dict:f}=i(),p=f.stories.film,m=(0,X.useId)().replace(/[^a-zA-Z0-9]/g,``),h=`film-frame-${m}`,g=`film-ctrl-${m}`,_=(0,X.useRef)(null),[ee,te]=(0,X.useState)(!1),[ne,re]=(0,X.useState)(null),[ie,ae]=(0,X.useState)(0),oe=(0,X.useRef)(!1);fe(d,ru(p.chrome)),(0,X.useEffect)(()=>{let t=null,n=!0,r=e.captionsUrl;return r?r.startsWith(`data:`)?(fetch(r).then(e=>e.blob()).then(e=>{n&&(t=URL.createObjectURL(new Blob([e],{type:`text/vtt`})),re(t))},()=>n&&re(null)),()=>{n=!1,t&&URL.revokeObjectURL(t)}):re(r):re(null)},[e.captionsUrl]),(0,X.useEffect)(()=>{let e=_.current;if(!e)return;let t=()=>{let t=0;try{t=Number(localStorage.getItem(o))||0}catch{}t>3&&Number.isFinite(e.duration)&&t<e.duration-3&&(e.currentTime=t)},n=0,r=()=>{if(!(Math.abs(e.currentTime-n)<2)){n=e.currentTime;try{localStorage.setItem(o,String(Math.floor(e.currentTime)))}catch{}!oe.current&&Number.isFinite(e.duration)&&e.currentTime>e.duration*.9&&(oe.current=!0,l())}},i=()=>{try{localStorage.removeItem(o)}catch{}oe.current||(oe.current=!0,l())},a=()=>te(!0);return e.addEventListener(`loadedmetadata`,t),e.addEventListener(`timeupdate`,r),e.addEventListener(`ended`,i),e.addEventListener(`error`,a),e.readyState>=1&&t(),()=>{e.removeEventListener(`loadedmetadata`,t),e.removeEventListener(`timeupdate`,r),e.removeEventListener(`ended`,i),e.removeEventListener(`error`,a)}},[o,l,ie]),(0,X.useEffect)(()=>{let e=_.current;if(!e)return;let t=()=>{let t=[...e.textTracks].find(e=>e.kind===`captions`||e.kind===`subtitles`);t&&t.mode!==`showing`&&s&&c(!1),t&&t.mode===`showing`&&!s&&c(!0)},n=()=>{let t=[...e.textTracks].find(e=>e.kind===`captions`||e.kind===`subtitles`);t&&(t.mode=s?`showing`:`disabled`)};return n(),e.textTracks.addEventListener(`addtrack`,n),e.textTracks.addEventListener(`change`,t),()=>{e.textTracks.removeEventListener(`addtrack`,n),e.textTracks.removeEventListener(`change`,t)}},[s,c,ne]),(0,X.useEffect)(()=>{u&&_.current?.play().catch(()=>{})},[u,ie]),(0,X.useEffect)(()=>{let e=()=>{document.fullscreenElement&&matchMedia(`(pointer: coarse)`).matches&&screen.orientation?.lock?.(`landscape`).catch(()=>{})};return document.addEventListener(`fullscreenchange`,e),()=>document.removeEventListener(`fullscreenchange`,e)},[]);let[se,ce]=(0,X.useState)(!0);return(0,X.useEffect)(()=>{let e=window.setTimeout(()=>ce(!1),500);return()=>clearTimeout(e)},[]),e.videoUrl?(0,$.jsxs)(`div`,{className:`flex flex-col gap-2`,children:[(0,$.jsxs)(`div`,{id:h,className:`film-frame`,"data-entering":se||void 0,"data-testid":`film`,dir:r(d),children:[(0,$.jsxs)(Jl,{id:g,lang:d,noAutohide:!0,gesturesDisabled:!0,"aria-label":p.label.replace(`{title}`,t),...iu({fullscreenelement:h}),children:[(0,$.jsx)(`video`,{ref:_,slot:`media`,src:e.videoUrl,poster:e.posterUrl??void 0,preload:`metadata`,playsInline:!0,crossOrigin:e.videoUrl.startsWith(`http`)&&!e.videoUrl.startsWith(location.origin)?`anonymous`:void 0,lang:n,"data-testid":`film-video`,children:ne&&(0,$.jsx)(`track`,{kind:`captions`,src:ne,srcLang:n,label:f.stories.film.chrome.captions,default:s})},ie),(0,$.jsx)(Ql,{slot:`centered-chrome`,noAutohide:!0}),(0,$.jsx)(eu,{slot:`centered-chrome`,className:`film-big-play`})]}),(0,$.jsx)(Xl,{className:`film-scrub`,...iu({mediacontroller:g}),children:(0,$.jsx)(nu,{})}),(0,$.jsxs)(Xl,{...iu({mediacontroller:g}),children:[(0,$.jsx)(eu,{}),(0,$.jsx)(tu,{showDuration:!0,dir:`ltr`}),(0,$.jsx)(`span`,{className:`flex-1`}),ne&&(0,$.jsx)(Yl,{"data-testid":`film-captions`}),(0,$.jsx)($l,{}),(0,$.jsx)(Zl,{})]})]}),ne&&(0,$.jsx)(`p`,{className:`text-sm text-ink-muted`,children:p.captionsNote}),ee&&(0,$.jsxs)(`div`,{role:`alert`,className:`flex flex-wrap items-center gap-3 rounded-control border-s-4 border border-red-800 bg-red-50 p-3 text-red-950`,children:[(0,$.jsx)(`span`,{children:p.error}),(0,$.jsx)(a,{variant:`secondary`,onClick:()=>{te(!1),ae(e=>e+1)},children:f.account.errors.retry})]})]}):(0,$.jsx)(`p`,{className:`rounded-control border border-dashed border-ink-muted p-6 text-center text-ink-muted`,children:p.notReady})}export{au as default};