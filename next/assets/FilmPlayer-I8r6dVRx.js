import{gt as e,mt as t,t as n}from"./jsx-runtime-CcPuEVVQ.js";import{c as r}from"./paths-C-FsCrus.js";import{t as i}from"./use-dict-Ccmshqnr.js";import{t as a}from"./controls-D6usAdUl.js";var o={MEDIA_PLAY_REQUEST:`mediaplayrequest`,MEDIA_PAUSE_REQUEST:`mediapauserequest`,MEDIA_MUTE_REQUEST:`mediamuterequest`,MEDIA_UNMUTE_REQUEST:`mediaunmuterequest`,MEDIA_LOOP_REQUEST:`medialooprequest`,MEDIA_VOLUME_REQUEST:`mediavolumerequest`,MEDIA_SEEK_REQUEST:`mediaseekrequest`,MEDIA_AIRPLAY_REQUEST:`mediaairplayrequest`,MEDIA_ENTER_FULLSCREEN_REQUEST:`mediaenterfullscreenrequest`,MEDIA_EXIT_FULLSCREEN_REQUEST:`mediaexitfullscreenrequest`,MEDIA_PREVIEW_REQUEST:`mediapreviewrequest`,MEDIA_ENTER_PIP_REQUEST:`mediaenterpiprequest`,MEDIA_EXIT_PIP_REQUEST:`mediaexitpiprequest`,MEDIA_ENTER_CAST_REQUEST:`mediaentercastrequest`,MEDIA_EXIT_CAST_REQUEST:`mediaexitcastrequest`,MEDIA_SHOW_TEXT_TRACKS_REQUEST:`mediashowtexttracksrequest`,MEDIA_HIDE_TEXT_TRACKS_REQUEST:`mediahidetexttracksrequest`,MEDIA_SHOW_SUBTITLES_REQUEST:`mediashowsubtitlesrequest`,MEDIA_DISABLE_SUBTITLES_REQUEST:`mediadisablesubtitlesrequest`,MEDIA_TOGGLE_SUBTITLES_REQUEST:`mediatogglesubtitlesrequest`,MEDIA_PLAYBACK_RATE_REQUEST:`mediaplaybackraterequest`,MEDIA_RENDITION_REQUEST:`mediarenditionrequest`,MEDIA_AUDIO_TRACK_REQUEST:`mediaaudiotrackrequest`,MEDIA_SEEK_TO_LIVE_REQUEST:`mediaseektoliverequest`,REGISTER_MEDIA_STATE_RECEIVER:`registermediastatereceiver`,UNREGISTER_MEDIA_STATE_RECEIVER:`unregistermediastatereceiver`},s={MEDIA_CHROME_ATTRIBUTES:`mediachromeattributes`,MEDIA_CONTROLLER:`mediacontroller`},c={MEDIA_AIRPLAY_UNAVAILABLE:`mediaAirplayUnavailable`,MEDIA_AUDIO_TRACK_ENABLED:`mediaAudioTrackEnabled`,MEDIA_AUDIO_TRACK_LIST:`mediaAudioTrackList`,MEDIA_AUDIO_TRACK_UNAVAILABLE:`mediaAudioTrackUnavailable`,MEDIA_BUFFERED:`mediaBuffered`,MEDIA_CAST_UNAVAILABLE:`mediaCastUnavailable`,MEDIA_CHAPTERS_CUES:`mediaChaptersCues`,MEDIA_CURRENT_TIME:`mediaCurrentTime`,MEDIA_DURATION:`mediaDuration`,MEDIA_ENDED:`mediaEnded`,MEDIA_ERROR:`mediaError`,MEDIA_ERROR_CODE:`mediaErrorCode`,MEDIA_ERROR_MESSAGE:`mediaErrorMessage`,MEDIA_FULLSCREEN_UNAVAILABLE:`mediaFullscreenUnavailable`,MEDIA_HAS_PLAYED:`mediaHasPlayed`,MEDIA_HEIGHT:`mediaHeight`,MEDIA_IS_AIRPLAYING:`mediaIsAirplaying`,MEDIA_IS_CASTING:`mediaIsCasting`,MEDIA_IS_FULLSCREEN:`mediaIsFullscreen`,MEDIA_IS_PIP:`mediaIsPip`,MEDIA_LOADING:`mediaLoading`,MEDIA_MUTED:`mediaMuted`,MEDIA_LOOP:`mediaLoop`,MEDIA_PAUSED:`mediaPaused`,MEDIA_PIP_UNAVAILABLE:`mediaPipUnavailable`,MEDIA_PLAYBACK_RATE:`mediaPlaybackRate`,MEDIA_PREVIEW_CHAPTER:`mediaPreviewChapter`,MEDIA_PREVIEW_COORDS:`mediaPreviewCoords`,MEDIA_PREVIEW_IMAGE:`mediaPreviewImage`,MEDIA_PREVIEW_TIME:`mediaPreviewTime`,MEDIA_RENDITION_LIST:`mediaRenditionList`,MEDIA_RENDITION_SELECTED:`mediaRenditionSelected`,MEDIA_RENDITION_UNAVAILABLE:`mediaRenditionUnavailable`,MEDIA_SEEKABLE:`mediaSeekable`,MEDIA_STREAM_TYPE:`mediaStreamType`,MEDIA_SUBTITLES_LIST:`mediaSubtitlesList`,MEDIA_SUBTITLES_SHOWING:`mediaSubtitlesShowing`,MEDIA_TARGET_LIVE_WINDOW:`mediaTargetLiveWindow`,MEDIA_TIME_IS_LIVE:`mediaTimeIsLive`,MEDIA_VOLUME:`mediaVolume`,MEDIA_VOLUME_LEVEL:`mediaVolumeLevel`,MEDIA_VOLUME_UNAVAILABLE:`mediaVolumeUnavailable`,MEDIA_LANG:`mediaLang`,MEDIA_WIDTH:`mediaWidth`},l=Object.entries(c),u=l.reduce((e,[t,n])=>(e[t]=n.toLowerCase(),e),{}),d=l.reduce((e,[t,n])=>(e[t]=n.toLowerCase(),e),{USER_INACTIVE_CHANGE:`userinactivechange`,BREAKPOINTS_CHANGE:`breakpointchange`,BREAKPOINTS_COMPUTED:`breakpointscomputed`});Object.entries(d).reduce((e,[t,n])=>{let r=u[t];return r&&(e[n]=r),e},{userinactivechange:`userinactive`});var f=Object.entries(u).reduce((e,[t,n])=>{let r=d[t];return r&&(e[n]=r),e},{userinactive:`userinactivechange`}),p={SUBTITLES:`subtitles`,CAPTIONS:`captions`,DESCRIPTIONS:`descriptions`,CHAPTERS:`chapters`,METADATA:`metadata`},m={DISABLED:`disabled`,HIDDEN:`hidden`,SHOWING:`showing`},h={MOUSE:`mouse`,PEN:`pen`,TOUCH:`touch`},g={UNAVAILABLE:`unavailable`,UNSUPPORTED:`unsupported`},_={LIVE:`live`,ON_DEMAND:`on-demand`,UNKNOWN:`unknown`},ee={INLINE:`inline`,FULLSCREEN:`fullscreen`,PICTURE_IN_PICTURE:`picture-in-picture`};function te(e){return e?.map(ne).join(` `)}function ne(e){if(e){let{id:t,width:n,height:r}=e;return[t,n,r].filter(e=>e!=null).join(`:`)}}function re(e){return e?.map(ie).join(` `)}function ie(e){if(e){let{id:t,kind:n,language:r,label:i}=e;return[t,n,r,i].filter(e=>e!=null).join(`:`)}}function ae(e){return typeof e==`number`&&!Number.isNaN(e)&&Number.isFinite(e)}var oe=e=>new Promise(t=>setTimeout(t,e)),se={"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#39;`};function ce(e){return String(e).replace(/[&<>"']/g,e=>se[e])}var v={en:{"Start airplay":`Start airplay`,"Stop airplay":`Stop airplay`,Audio:`Audio`,Captions:`Captions`,"Enable captions":`Enable captions`,"Disable captions":`Disable captions`,"Start casting":`Start casting`,"Stop casting":`Stop casting`,"Enter fullscreen mode":`Enter fullscreen mode`,"Exit fullscreen mode":`Exit fullscreen mode`,Mute:`Mute`,Unmute:`Unmute`,Loop:`Loop`,"Enter picture in picture mode":`Enter picture in picture mode`,"Exit picture in picture mode":`Exit picture in picture mode`,Play:`Play`,Pause:`Pause`,"Playback rate":`Playback rate`,"Playback rate {playbackRate}":`Playback rate {playbackRate}`,Quality:`Quality`,"Seek backward":`Seek backward`,"Seek forward":`Seek forward`,Settings:`Settings`,Auto:`Auto`,"audio player":`audio player`,"video player":`video player`,volume:`volume`,seek:`seek`,"closed captions":`closed captions`,"current playback rate":`current playback rate`,"playback time":`playback time`,"media loading":`media loading`,settings:`settings`,"audio tracks":`audio tracks`,quality:`quality`,play:`play`,pause:`pause`,mute:`mute`,unmute:`unmute`,"chapter: {chapterName}":`chapter: {chapterName}`,live:`live`,Off:`Off`,"start airplay":`start airplay`,"stop airplay":`stop airplay`,"start casting":`start casting`,"stop casting":`stop casting`,"enter fullscreen mode":`enter fullscreen mode`,"exit fullscreen mode":`exit fullscreen mode`,"enter picture in picture mode":`enter picture in picture mode`,"exit picture in picture mode":`exit picture in picture mode`,"seek to live":`seek to live`,"playing live":`playing live`,"seek back {seekOffset} seconds":`seek back {seekOffset} seconds`,"seek forward {seekOffset} seconds":`seek forward {seekOffset} seconds`,"Network Error":`Network Error`,"Decode Error":`Decode Error`,"Source Not Supported":`Source Not Supported`,"Encryption Error":`Encryption Error`,"A network error caused the media download to fail.":`A network error caused the media download to fail.`,"A media error caused playback to be aborted. The media could be corrupt or your browser does not support this format.":`A media error caused playback to be aborted. The media could be corrupt or your browser does not support this format.`,"An unsupported error occurred. The server or network failed, or your browser does not support this format.":`An unsupported error occurred. The server or network failed, or your browser does not support this format.`,"The media is encrypted and there are no keys to decrypt it.":`The media is encrypted and there are no keys to decrypt it.`,hour:`hour`,hours:`hours`,minute:`minute`,minutes:`minutes`,second:`second`,seconds:`seconds`,"{time} remaining":`{time} remaining`,"{currentTime} of {totalTime}":`{currentTime} of {totalTime}`,"video not loaded, unknown time.":`video not loaded, unknown time.`}},le=globalThis.navigator?.language||`en`,ue=e=>{le=e},de=(e,t)=>{v[e]=t},fe=e=>{let[t]=le.split(`-`);return v[le]?.[e]||v[t]?.[e]||v.en?.[e]||e},pe=()=>{let[e]=le.split(`-`);return v[le]?le:v[e]?e:`en`},y=(e,t={})=>fe(e).replace(/\{(\w+)\}/g,(e,n)=>n in t?String(t[n]):`{${n}}`),me=[{singular:`hour`,plural:`hours`},{singular:`minute`,plural:`minutes`},{singular:`second`,plural:`seconds`}],he=(e,t)=>`${e} ${y(e===1?me[t].singular:me[t].plural)}`,ge=e=>{if(!ae(e))return``;let t=Math.abs(e),n=t!==e,r=new Date(0,0,0,0,0,t,0),i=[r.getHours(),r.getMinutes(),r.getSeconds()].map((e,t)=>e&&he(e,t)).filter(e=>e).join(`, `);return n?y(`{time} remaining`,{time:i}):t===0?he(0,2):i};function _e(e,t){let n=!1;e<0&&(n=!0,e=0-e),e=e<0?0:e;let r=Math.floor(e%60),i=Math.floor(e/60%60),a=Math.floor(e/3600),o=Math.floor(t/60%60),s=Math.floor(t/3600);return(isNaN(e)||e===1/0)&&(a=i=r=`0`),a=a>0||s>0?a+`:`:``,i=((a||o>=10)&&i<10?`0`+i:i)+`:`,r=r<10?`0`+r:r,(n?`-`:``)+a+i+r}Object.freeze({length:0,start(e){let t=e>>>0;if(t>=this.length)throw new DOMException(`Failed to execute 'start' on 'TimeRanges': The index provided (${t}) is greater than or equal to the maximum bound (${this.length}).`);return 0},end(e){let t=e>>>0;if(t>=this.length)throw new DOMException(`Failed to execute 'end' on 'TimeRanges': The index provided (${t}) is greater than or equal to the maximum bound (${this.length}).`);return 0}});var ve=class{addEventListener(){}removeEventListener(){}dispatchEvent(){return!0}},ye=class extends ve{},be=class extends ye{constructor(){super(...arguments),this.role=null}},xe=class{observe(){}unobserve(){}disconnect(){}},Se={createElement:function(){return new Ce.HTMLElement},createElementNS:function(){return new Ce.HTMLElement},addEventListener(){},removeEventListener(){},dispatchEvent(e){return!1}},Ce={ResizeObserver:xe,document:Se,Node:ye,Element:be,HTMLElement:class extends be{constructor(){super(...arguments),this.innerHTML=``}get content(){return new Ce.DocumentFragment}},DocumentFragment:class extends ve{},customElements:{get:function(){},define:function(){},whenDefined:function(){}},localStorage:{getItem(e){return null},setItem(e,t){},removeItem(e){}},CustomEvent:function(){},getComputedStyle:function(){},navigator:{languages:[],get userAgent(){return``}},matchMedia(e){return{matches:!1,media:e}},DOMParser:class{parseFromString(e,t){return{body:{textContent:e}}}}},we=`global`in globalThis&&(globalThis==null?void 0:globalThis.global)===globalThis||typeof window>`u`||window.customElements===void 0,Te=Object.keys(Ce).every(e=>e in globalThis),b=we&&!Te?Ce:globalThis,x=we&&!Te?Se:globalThis.document,Ee=new WeakMap,De=e=>{let t=Ee.get(e);return t||Ee.set(e,t=new Set),t},Oe=new b.ResizeObserver(e=>{for(let t of e)for(let e of De(t.target))e(t)});function ke(e,t){De(e).add(t),Oe.observe(e)}function Ae(e,t){let n=De(e);n.delete(t),n.size||Oe.unobserve(e)}function je(e){let t={};for(let n of e)t[n.name]=n.value;return t}function Me(e){return Ne(e)??Re(e,`media-controller`)}function Ne(e){let{MEDIA_CONTROLLER:t}=s,n=e.getAttribute(t);if(n)return Be(e)?.getElementById(n)}var Pe=(e,t,n=`.value`)=>{let r=e.querySelector(n);r&&(r.textContent=t)},Fe=(e,t)=>{let n=`slot[name="${t}"]`,r=e.shadowRoot.querySelector(n);return r?r.children:[]},Ie=(e,t)=>Fe(e,t)[0],Le=(e,t)=>!e||!t?!1:e?.contains(t)?!0:Le(e,t.getRootNode().host),Re=(e,t)=>e?e.closest(t)||Re(e.getRootNode().host,t):null;function ze(e=document){let t=e?.activeElement;return t?ze(t.shadowRoot)??t:null}function Be(e){let t=(e?.getRootNode)?.call(e);return t instanceof ShadowRoot||t instanceof Document?t:null}function Ve(e,{depth:t=3,checkOpacity:n=!0,checkVisibilityCSS:r=!0}={}){if(e.checkVisibility)return e.checkVisibility({checkOpacity:n,checkVisibilityCSS:r});let i=e;for(;i&&t>0;){let e=getComputedStyle(i);if(n&&e.opacity===`0`||r&&e.visibility===`hidden`||e.display===`none`)return!1;i=i.parentElement,t--}return!0}function He(e,t,n,r){let i=r.x-n.x,a=r.y-n.y,o=i*i+a*a;if(o===0)return 0;let s=((e-n.x)*i+(t-n.y)*a)/o;return Math.max(0,Math.min(1,s))}function S(e,t){return Ue(e,e=>e===t)||We(e,t)}function Ue(e,t){let n;for(n of e.querySelectorAll(`style:not([media])`)??[]){let e;try{e=n.sheet?.cssRules}catch{continue}for(let n of e??[])if(t(n.selectorText))return n}}function We(e,t){let n=e.querySelectorAll(`style:not([media])`)??[],r=n?.[n.length-1];if(!r?.sheet)return console.warn(`Media Chrome: No style sheet found on style tag of`,e),{style:{setProperty:()=>{},removeProperty:()=>``,getPropertyValue:()=>``}};let i=r?.sheet.insertRule(`${t}{}`,r.sheet.cssRules.length);return r.sheet.cssRules?.[i]}function C(e,t,n=NaN){let r=e.getAttribute(t);return r==null?n:+r}function w(e,t,n){let r=+n;n==null||Number.isNaN(r)?e.hasAttribute(t)&&e.removeAttribute(t):C(e,t,void 0)!==r&&e.setAttribute(t,`${r}`)}function T(e,t){return e.hasAttribute(t)}function E(e,t,n){n==null?e.hasAttribute(t)&&e.removeAttribute(t):T(e,t)!=n&&e.toggleAttribute(t,n)}function D(e,t,n=null){return e.getAttribute(t)??n}function O(e,t,n){if(n==null){e.hasAttribute(t)&&e.removeAttribute(t);return}let r=`${n}`;D(e,t,void 0)!==r&&e.setAttribute(t,r)}var Ge=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},Ke=(e,t,n)=>(Ge(e,t,`read from private field`),n?n.call(e):t.get(e)),qe=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},Je=(e,t,n,r)=>(Ge(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),k;function Ye(e){return`
    <style>
      :host {
        display: var(--media-control-display, var(--media-gesture-receiver-display, inline-block));
        box-sizing: border-box;
      }
    </style>
  `}var Xe=class extends b.HTMLElement{constructor(){if(super(),qe(this,k,void 0),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=je(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}}static get observedAttributes(){return[s.MEDIA_CONTROLLER,u.MEDIA_PAUSED]}attributeChangedCallback(e,t,n){var r,i,a,o;e===s.MEDIA_CONTROLLER&&(t&&((i=(r=Ke(this,k))?.unassociateElement)==null||i.call(r,this),Je(this,k,null)),n&&this.isConnected&&(Je(this,k,this.getRootNode()?.getElementById(n)),(o=(a=Ke(this,k))?.associateElement)==null||o.call(a,this)))}connectedCallback(){var e,t;this.tabIndex=-1,this.setAttribute(`aria-hidden`,`true`),Je(this,k,Ze(this)),this.getAttribute(s.MEDIA_CONTROLLER)&&((t=(e=Ke(this,k))?.associateElement)==null||t.call(e,this)),Ke(this,k)&&(Ke(this,k).addEventListener(`pointerdown`,this),Ke(this,k).addEventListener(`click`,this),Ke(this,k).hasAttribute(`tabindex`)||(Ke(this,k).tabIndex=0))}disconnectedCallback(){var e,t,n,r;this.getAttribute(s.MEDIA_CONTROLLER)&&((t=(e=Ke(this,k))?.unassociateElement)==null||t.call(e,this)),(n=Ke(this,k))==null||n.removeEventListener(`pointerdown`,this),(r=Ke(this,k))==null||r.removeEventListener(`click`,this),Je(this,k,null)}handleEvent(e){let t=e.composedPath()?.[0];if([`video`,`media-controller`].includes(t?.localName)){if(e.type===`pointerdown`)this._pointerType=e.pointerType;else if(e.type===`click`){let{clientX:t,clientY:n}=e,{left:r,top:i,width:a,height:o}=this.getBoundingClientRect(),s=t-r,c=n-i;if(s<0||c<0||s>a||c>o||a===0&&o===0)return;let l=this._pointerType||`mouse`;if(this._pointerType=void 0,l===h.TOUCH){this.handleTap(e);return}if(l===h.MOUSE||l===h.PEN){this.handleMouseClick(e);return}}}}get mediaPaused(){return T(this,u.MEDIA_PAUSED)}set mediaPaused(e){E(this,u.MEDIA_PAUSED,e)}handleTap(e){}handleMouseClick(e){let t=this.mediaPaused?o.MEDIA_PLAY_REQUEST:o.MEDIA_PAUSE_REQUEST;this.dispatchEvent(new b.CustomEvent(t,{composed:!0,bubbles:!0}))}};k=new WeakMap,Xe.shadowRootOptions={mode:`open`},Xe.getTemplateHTML=Ye;function Ze(e){let t=e.getAttribute(s.MEDIA_CONTROLLER);return t?e.getRootNode()?.getElementById(t):Re(e,`media-controller`)}b.customElements.get(`media-gesture-receiver`)||b.customElements.define(`media-gesture-receiver`,Xe);var Qe=Xe,$e=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},A=(e,t,n)=>($e(e,t,`read from private field`),n?n.call(e):t.get(e)),j=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},et=(e,t,n,r)=>($e(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),tt=(e,t,n)=>($e(e,t,`access private method`),n),nt,rt,it,at,ot,st,ct,lt,ut,dt,ft,pt,mt,ht,gt,_t,vt,yt,bt,xt,M={AUDIO:`audio`,AUTOHIDE:`autohide`,BREAKPOINTS:`breakpoints`,GESTURES_DISABLED:`gesturesdisabled`,KEYBOARD_CONTROL:`keyboardcontrol`,NO_AUTOHIDE:`noautohide`,USER_INACTIVE:`userinactive`,AUTOHIDE_OVER_CONTROLS:`autohideovercontrols`};function St(e){return`
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

      :host(:not([${M.AUDIO}])) [part~=layer]:not([part~=media-layer]) {
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

      
      :host([${M.AUDIO}]) slot[name=media] {
        display: var(--media-slot-display, none);
      }

      
      :host([${M.AUDIO}]) [part~=layer][part~=gesture-layer] {
        height: 0;
        display: block;
      }

      
      :host(:not([${M.AUDIO}])[${M.GESTURES_DISABLED}]) ::slotted([slot=gestures-chrome]),
          :host(:not([${M.AUDIO}])[${M.GESTURES_DISABLED}]) media-gesture-receiver[slot=gestures-chrome] {
        display: none;
      }

      
      ::slotted(:not([slot=media]):not([slot=poster]):not(media-loading-indicator):not([role=dialog]):not([hidden])) {
        pointer-events: auto;
      }

      :host(:not([${M.AUDIO}])) *[part~=layer][part~=centered-layer] {
        align-items: center;
        justify-content: center;
      }

      :host(:not([${M.AUDIO}])) ::slotted(media-gesture-receiver[slot=gestures-chrome]),
      :host(:not([${M.AUDIO}])) media-gesture-receiver[slot=gestures-chrome] {
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

      
      :host(:not([${M.AUDIO}])) .spacer {
        flex-grow: 1;
      }

      
      :host(:-webkit-full-screen) {
        
        width: 100% !important;
        height: 100% !important;
      }

      
      ::slotted(:not([slot=media]):not([slot=poster]):not([${M.NO_AUTOHIDE}]):not([hidden]):not([role=dialog])) {
        opacity: 1;
        transition: var(--media-control-transition-in, opacity 0.25s);
      }

      
      :host([${M.USER_INACTIVE}]:not([${u.MEDIA_PAUSED}]):not([${u.MEDIA_IS_AIRPLAYING}]):not([${u.MEDIA_IS_CASTING}]):not([${M.AUDIO}])) ::slotted(:not([slot=media]):not([slot=poster]):not([${M.NO_AUTOHIDE}]):not([role=dialog])) {
        opacity: 0;
        transition: var(--media-control-transition-out, opacity 1s);
      }

      :host([${M.USER_INACTIVE}]:not([${M.NO_AUTOHIDE}]):not([${u.MEDIA_PAUSED}]):not([${u.MEDIA_IS_CASTING}]):not([${M.AUDIO}])) ::slotted([slot=media]) {
        cursor: none;
      }

      :host([${M.USER_INACTIVE}][${M.AUTOHIDE_OVER_CONTROLS}]:not([${M.NO_AUTOHIDE}]):not([${u.MEDIA_PAUSED}]):not([${u.MEDIA_IS_CASTING}]):not([${M.AUDIO}])) * {
        --media-cursor: none;
        cursor: none;
      }


      ::slotted(media-control-bar)  {
        align-self: stretch;
      }

      
      
      :host(:not([${M.AUDIO}])[${u.MEDIA_HAS_PLAYED}]) slot[name=poster],
      :host(:not([${M.AUDIO}])[${u.MEDIA_STREAM_TYPE}="${_.ON_DEMAND}"][${u.MEDIA_CURRENT_TIME}]:not([${u.MEDIA_CURRENT_TIME}="0"])) slot[name=poster] {
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
  `}var Ct=Object.values(u),wt=`sm:384 md:576 lg:768 xl:960`;function Tt(e){Et(e.target,e.contentRect.width)}function Et(e,t){if(!e.isConnected)return;let n=Dt(e.getAttribute(M.BREAKPOINTS)??wt),r=Ot(n,t),i=!1;if(Object.keys(n).forEach(t=>{r.includes(t)?e.hasAttribute(`breakpoint${t}`)||(e.setAttribute(`breakpoint${t}`,``),i=!0):e.hasAttribute(`breakpoint${t}`)&&(e.removeAttribute(`breakpoint${t}`),i=!0)}),i){let t=new CustomEvent(d.BREAKPOINTS_CHANGE,{detail:r});e.dispatchEvent(t)}e.breakpointsComputed||(e.breakpointsComputed=!0,e.dispatchEvent(new CustomEvent(d.BREAKPOINTS_COMPUTED,{bubbles:!0,composed:!0})))}function Dt(e){let t=e.split(/\s+/);return Object.fromEntries(t.map(e=>e.split(`:`)))}function Ot(e,t){return Object.keys(e).filter(n=>t>=parseInt(e[n]))}var kt=class extends b.HTMLElement{constructor(){if(super(),j(this,ut),j(this,ft),j(this,mt),j(this,gt),j(this,vt),j(this,nt,void 0),j(this,rt,0),j(this,it,null),j(this,at,null),j(this,ot,void 0),this.breakpointsComputed=!1,j(this,st,e=>{let t=this.media;for(let n of e){if(n.type!==`childList`)continue;let e=n.removedNodes;for(let r of e){if(r.slot!=`media`||n.target!=this)continue;let e=n.previousSibling&&n.previousSibling.previousElementSibling;if(!e||!t)this.mediaUnsetCallback(r);else{let t=e.slot!==`media`;for(;(e=e.previousSibling)!==null;)e.slot==`media`&&(t=!1);t&&this.mediaUnsetCallback(r)}}if(t)for(let e of n.addedNodes)e===t&&this.handleMediaUpdated(t)}}),j(this,ct,!1),j(this,lt,e=>{A(this,ct)||(setTimeout(()=>{Tt(e),et(this,ct,!1)},0),et(this,ct,!0))}),j(this,bt,void 0),j(this,xt,()=>{A(this,bt).assignedElements({flatten:!0}).length?this.handleMediaUpdated(this.media):A(this,it)&&this.mediaUnsetCallback(A(this,it))}),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=je(this.attributes),t=this.constructor.getTemplateHTML(e);this.shadowRoot.setHTMLUnsafe?this.shadowRoot.setHTMLUnsafe(t):this.shadowRoot.innerHTML=t}et(this,nt,new MutationObserver(A(this,st)))}static get observedAttributes(){return[M.AUTOHIDE,M.GESTURES_DISABLED].concat(Ct).filter(e=>![u.MEDIA_RENDITION_LIST,u.MEDIA_AUDIO_TRACK_LIST,u.MEDIA_CHAPTERS_CUES,u.MEDIA_WIDTH,u.MEDIA_HEIGHT,u.MEDIA_ERROR,u.MEDIA_ERROR_MESSAGE].includes(e))}attributeChangedCallback(e,t,n){e.toLowerCase()==M.AUTOHIDE&&(this.autohide=n)}get media(){let e=this.querySelector(`:scope > [slot=media]`);return e?.nodeName==`SLOT`&&(e=e.assignedElements({flatten:!0})[0]),e}async handleMediaUpdated(e){e&&(et(this,it,e),e.localName.includes(`-`)&&await b.customElements.whenDefined(e.localName),this.mediaSetCallback(e))}connectedCallback(){var e;A(this,nt).observe(this,{childList:!0,subtree:!0}),ke(this,A(this,lt));let t=this.getAttribute(M.AUDIO)==null?y(`video player`):y(`audio player`);this.setAttribute(`role`,`region`),this.setAttribute(`aria-label`,t),this.handleMediaUpdated(this.media),this.setAttribute(M.USER_INACTIVE,``),Et(this,this.getBoundingClientRect().width);let n=this.querySelector(`:scope > slot[slot=media]`);n&&(et(this,bt,n),A(this,bt).addEventListener(`slotchange`,A(this,xt))),this.addEventListener(`pointerdown`,this),this.addEventListener(`pointermove`,this),this.addEventListener(`pointerup`,this),this.addEventListener(`mouseleave`,this),this.addEventListener(`keyup`,this),(e=b.window)==null||e.addEventListener(`mouseup`,this)}disconnectedCallback(){var e;Ae(this,A(this,lt)),clearTimeout(A(this,at)),A(this,nt).disconnect(),this.media&&this.mediaUnsetCallback(this.media),(e=b.window)==null||e.removeEventListener(`mouseup`,this),this.removeEventListener(`pointerdown`,this),this.removeEventListener(`pointermove`,this),this.removeEventListener(`pointerup`,this),this.removeEventListener(`mouseleave`,this),this.removeEventListener(`keyup`,this),A(this,bt)&&(A(this,bt).removeEventListener(`slotchange`,A(this,xt)),et(this,bt,null)),et(this,ct,!1)}mediaSetCallback(e){}mediaUnsetCallback(e){et(this,it,null)}handleEvent(e){switch(e.type){case`pointerdown`:et(this,rt,e.timeStamp);break;case`pointermove`:tt(this,ut,dt).call(this,e);break;case`pointerup`:tt(this,ft,pt).call(this,e);break;case`mouseleave`:tt(this,mt,ht).call(this);break;case`mouseup`:this.removeAttribute(M.KEYBOARD_CONTROL);break;case`keyup`:tt(this,vt,yt).call(this),this.setAttribute(M.KEYBOARD_CONTROL,``)}}set autohide(e){let t=Number(e);et(this,ot,isNaN(t)?0:t)}get autohide(){return(A(this,ot)===void 0?2:A(this,ot)).toString()}get breakpoints(){return D(this,M.BREAKPOINTS)}set breakpoints(e){O(this,M.BREAKPOINTS,e)}get audio(){return T(this,M.AUDIO)}set audio(e){E(this,M.AUDIO,e)}get gesturesDisabled(){return T(this,M.GESTURES_DISABLED)}set gesturesDisabled(e){E(this,M.GESTURES_DISABLED,e)}get keyboardControl(){return T(this,M.KEYBOARD_CONTROL)}set keyboardControl(e){E(this,M.KEYBOARD_CONTROL,e)}get noAutohide(){return T(this,M.NO_AUTOHIDE)}set noAutohide(e){E(this,M.NO_AUTOHIDE,e)}get autohideOverControls(){return T(this,M.AUTOHIDE_OVER_CONTROLS)}set autohideOverControls(e){E(this,M.AUTOHIDE_OVER_CONTROLS,e)}get userInteractive(){return T(this,M.USER_INACTIVE)}set userInteractive(e){E(this,M.USER_INACTIVE,e)}};nt=new WeakMap,rt=new WeakMap,it=new WeakMap,at=new WeakMap,ot=new WeakMap,st=new WeakMap,ct=new WeakMap,lt=new WeakMap,ut=new WeakSet,dt=function(e){if(e.pointerType!==`mouse`&&e.timeStamp-A(this,rt)<250)return;tt(this,gt,_t).call(this),clearTimeout(A(this,at));let t=this.hasAttribute(M.AUTOHIDE_OVER_CONTROLS);([this,this.media].includes(e.target)||t)&&tt(this,vt,yt).call(this)},ft=new WeakSet,pt=function(e){if(e.pointerType===`touch`){let t=!this.hasAttribute(M.USER_INACTIVE);[this,this.media].includes(e.target)&&t?tt(this,mt,ht).call(this):tt(this,vt,yt).call(this)}else e.composedPath().some(e=>[`media-play-button`,`media-fullscreen-button`].includes(e?.localName))&&tt(this,vt,yt).call(this)},mt=new WeakSet,ht=function(){if(A(this,ot)<0||this.hasAttribute(M.USER_INACTIVE))return;this.setAttribute(M.USER_INACTIVE,``);let e=new b.CustomEvent(d.USER_INACTIVE_CHANGE,{composed:!0,bubbles:!0,detail:!0});this.dispatchEvent(e)},gt=new WeakSet,_t=function(){if(!this.hasAttribute(M.USER_INACTIVE))return;this.removeAttribute(M.USER_INACTIVE);let e=new b.CustomEvent(d.USER_INACTIVE_CHANGE,{composed:!0,bubbles:!0,detail:!1});this.dispatchEvent(e)},vt=new WeakSet,yt=function(){tt(this,gt,_t).call(this),clearTimeout(A(this,at));let e=parseInt(this.autohide);e<0||et(this,at,setTimeout(()=>{tt(this,mt,ht).call(this)},e*1e3))},bt=new WeakMap,xt=new WeakMap,kt.shadowRootOptions={mode:`open`},kt.getTemplateHTML=St,b.customElements.get(`media-container`)||b.customElements.define(`media-container`,kt);var At=kt,jt=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},Mt=(e,t,n)=>(jt(e,t,`read from private field`),n?n.call(e):t.get(e)),Nt=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},Pt=(e,t,n,r)=>(jt(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Ft=(e,t,n)=>(jt(e,t,`access private method`),n),It,Lt,Rt,zt,Bt,Vt,Ht,Ut,Wt,Gt,Kt,qt,Jt,Yt,Xt;function Zt(e){return`
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
  `}function Qt(e){return`
    <slot id="content"></slot>
  `}var $t={OPEN:`open`,ANCHOR:`anchor`},en=class extends b.HTMLElement{constructor(){super(),Nt(this,zt),Nt(this,Vt),Nt(this,Ut),Nt(this,Gt),Nt(this,qt),Nt(this,Yt),Nt(this,It,!1),Nt(this,Lt,null),Nt(this,Rt,null)}static get observedAttributes(){return[$t.OPEN,$t.ANCHOR]}get open(){return T(this,$t.OPEN)}set open(e){E(this,$t.OPEN,e)}handleEvent(e){switch(e.type){case`invoke`:Ft(this,Gt,Kt).call(this,e);break;case`focusout`:Ft(this,qt,Jt).call(this,e);break;case`keydown`:Ft(this,Yt,Xt).call(this,e)}}connectedCallback(){Ft(this,zt,Bt).call(this),this.role||=`dialog`,this.addEventListener(`invoke`,this),this.addEventListener(`focusout`,this),this.addEventListener(`keydown`,this)}disconnectedCallback(){this.removeEventListener(`invoke`,this),this.removeEventListener(`focusout`,this),this.removeEventListener(`keydown`,this)}attributeChangedCallback(e,t,n){Ft(this,zt,Bt).call(this),e===$t.OPEN&&n!==t&&(this.open?Ft(this,Vt,Ht).call(this):Ft(this,Ut,Wt).call(this))}focus(){Pt(this,Lt,ze());let e=!this.dispatchEvent(new Event(`focus`,{composed:!0,cancelable:!0})),t=!this.dispatchEvent(new Event(`focusin`,{composed:!0,bubbles:!0,cancelable:!0}));e||t||this.querySelector(`[autofocus], [tabindex]:not([tabindex="-1"]), [role="menu"]`)?.focus()}get keysUsed(){return[`Escape`,`Tab`]}};It=new WeakMap,Lt=new WeakMap,Rt=new WeakMap,zt=new WeakSet,Bt=function(){if(!Mt(this,It)&&(Pt(this,It,!0),!this.shadowRoot)){this.attachShadow(this.constructor.shadowRootOptions);let e=je(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e),queueMicrotask(()=>{let{style:e}=S(this.shadowRoot,`:host`);e.setProperty(`transition`,`display .15s, visibility .15s, opacity .15s ease-in, transform .15s ease-in`)})}},Vt=new WeakSet,Ht=function(){var e;(e=Mt(this,Rt))==null||e.setAttribute(`aria-expanded`,`true`),this.dispatchEvent(new Event(`open`,{composed:!0,bubbles:!0})),this.addEventListener(`transitionend`,()=>this.focus(),{once:!0})},Ut=new WeakSet,Wt=function(){var e;(e=Mt(this,Rt))==null||e.setAttribute(`aria-expanded`,`false`),this.dispatchEvent(new Event(`close`,{composed:!0,bubbles:!0}))},Gt=new WeakSet,Kt=function(e){Pt(this,Rt,e.relatedTarget),Le(this,e.relatedTarget)||(this.open=!this.open)},qt=new WeakSet,Jt=function(e){var t;Le(this,e.relatedTarget)||((t=Mt(this,Lt))==null||t.focus(),Mt(this,Rt)&&Mt(this,Rt)!==e.relatedTarget&&this.open&&(this.open=!1))},Yt=new WeakSet,Xt=function(e){var t,n,r,i,a;let{key:o,ctrlKey:s,altKey:c,metaKey:l}=e;s||c||l||this.keysUsed.includes(o)&&(e.preventDefault(),e.stopPropagation(),o===`Tab`?(e.shiftKey?(n=(t=this.previousElementSibling)?.focus)==null||n.call(t):(i=(r=this.nextElementSibling)?.focus)==null||i.call(r),this.blur()):o===`Escape`&&((a=Mt(this,Lt))==null||a.focus(),this.open=!1))},en.shadowRootOptions={mode:`open`},en.getTemplateHTML=Zt,en.getSlotTemplateHTML=Qt,b.customElements.get(`media-chrome-dialog`)||b.customElements.define(`media-chrome-dialog`,en);var tn=en,nn=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},rn=(e,t,n)=>(nn(e,t,`read from private field`),n?n.call(e):t.get(e)),an=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},on,sn,cn={HOTKEYS:`hotkeys`},ln=[{keys:[{key:` `,label:`Space`},{key:`k`}],description:`Toggle Playback`},{keys:[{key:`m`}],description:`Toggle mute`},{keys:[{key:`f`}],description:`Toggle fullscreen`},{keys:[{key:`c`}],description:`Toggle captions or subtitles, if available`},{keys:[{key:`p`}],description:`Toggle Picture in Picture`},{keys:[{key:`ArrowLeft`,label:`←`},{key:`j`}],description:`Seek back 10s`},{keys:[{key:`ArrowRight`,label:`→`},{key:`l`}],description:`Seek forward 10s`},{keys:[{key:`ArrowUp`,label:`↑`}],description:`Turn volume up`},{keys:[{key:`ArrowDown`,label:`↓`}],description:`Turn volume down`},{keys:[{key:`<`,label:`< (SHIFT+,)`}],description:`Decrease playback rate`},{keys:[{key:`>`,label:`> (SHIFT+.)`}],description:`Increase playback rate`},{keys:[{key:`shift+/`,label:`SHIFT+/`}],description:`Show keyboard shortcuts`}];function un(e){return e===` `?`nospace`:`no${e.toLowerCase()}`}function dn(e){let t=new Set(e?.split(/\s+/));return ln.map(({keys:e,description:n})=>({keys:e.filter(({key:e})=>!t.has(un(e))),description:n})).filter(({keys:e})=>e.length)}function fn(e){return`
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
      ${pn(e[cn.HOTKEYS])}
    </slot>
  `}function pn(e){return`
    <h2>Keyboard Shortcuts</h2>
    <table class="shortcuts-table">${dn(e).map(({keys:e,description:t})=>`
        <tr>
          <td>
            <div class="key-combo">${e.map(({key:e,label:t=e},n)=>n>0?`<span class="key-separator">or</span><span class="key">${t}</span>`:`<span class="key">${t}</span>`).join(``)}</div>
          </td>
          <td class="description">${t}</td>
        </tr>
      `).join(``)}</table>
  `}var mn=class extends en{constructor(){super(...arguments),an(this,on,e=>{if(!this.open)return;let t=this.shadowRoot?.querySelector(`#content`);if(!t)return;let n=e.composedPath(),r=n[0]===this||n.includes(this),i=n.includes(t);r&&!i&&(this.open=!1)}),an(this,sn,e=>{if(!this.open)return;let t=e.shiftKey&&(e.key===`/`||e.key===`?`);e.key!==`Escape`&&!t||e.ctrlKey||e.altKey||e.metaKey||(this.open=!1,e.preventDefault(),e.stopPropagation())})}static get observedAttributes(){return[...super.observedAttributes,cn.HOTKEYS]}get hotkeys(){return D(this,cn.HOTKEYS)??void 0}set hotkeys(e){O(this,cn.HOTKEYS,e)}connectedCallback(){super.connectedCallback(),this.open&&(this.addEventListener(`click`,rn(this,on)),document.addEventListener(`keydown`,rn(this,sn)))}disconnectedCallback(){this.removeEventListener(`click`,rn(this,on)),document.removeEventListener(`keydown`,rn(this,sn))}attributeChangedCallback(e,t,n){if(super.attributeChangedCallback(e,t,n),e===`open`)this.open?(this.addEventListener(`click`,rn(this,on)),document.addEventListener(`keydown`,rn(this,sn))):(this.removeEventListener(`click`,rn(this,on)),document.removeEventListener(`keydown`,rn(this,sn)));else if(e===cn.HOTKEYS&&n!==t){let e=this.shadowRoot?.querySelector(`#content`);e&&(e.innerHTML=pn(n))}}};on=new WeakMap,sn=new WeakMap,mn.getSlotTemplateHTML=fn,b.customElements.get(`media-keyboard-shortcuts-dialog`)||b.customElements.define(`media-keyboard-shortcuts-dialog`,mn);var hn=mn,gn=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},N=(e,t,n)=>(gn(e,t,`read from private field`),n?n.call(e):t.get(e)),_n=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},vn=(e,t,n,r)=>(gn(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),yn,bn,xn,Sn,Cn,wn,Tn=class{constructor(e,t,{defaultValue:n}={defaultValue:void 0}){_n(this,Cn),_n(this,yn,void 0),_n(this,bn,void 0),_n(this,xn,void 0),_n(this,Sn,new Set),vn(this,yn,e),vn(this,bn,t),vn(this,xn,new Set(n))}[Symbol.iterator](){return N(this,Cn,wn).values()}get length(){return N(this,Cn,wn).size}get value(){return[...N(this,Cn,wn)].join(` `)??``}set value(e){e!==this.value&&(vn(this,Sn,new Set),this.add(...e?.split(` `)??[]))}toString(){return this.value}item(e){return[...N(this,Cn,wn)][e]}values(){return N(this,Cn,wn).values()}forEach(e,t){N(this,Cn,wn).forEach(e,t)}add(...e){var t;e.forEach(e=>N(this,Sn).add(e)),this.value===``&&!N(this,yn)?.hasAttribute(`${N(this,bn)}`)||(t=N(this,yn))==null||t.setAttribute(`${N(this,bn)}`,`${this.value}`)}remove(...e){var t;e.forEach(e=>N(this,Sn).delete(e)),(t=N(this,yn))==null||t.setAttribute(`${N(this,bn)}`,`${this.value}`)}contains(e){return N(this,Cn,wn).has(e)}toggle(e,t){return t===void 0?this.contains(e)?(this.remove(e),!1):(this.add(e),!0):t?(this.add(e),!0):(this.remove(e),!1)}replace(e,t){return this.remove(e),this.add(t),e===t}};yn=new WeakMap,bn=new WeakMap,xn=new WeakMap,Sn=new WeakMap,Cn=new WeakSet,wn=function(){return N(this,Sn).size?N(this,Sn):N(this,xn)};var En=(e=``)=>e.split(/\s+/),Dn=(e=``)=>{let[t,n,r]=e.split(`:`),i=r?decodeURIComponent(r):void 0;return{kind:t===`cc`?p.CAPTIONS:p.SUBTITLES,language:n,label:i}},On=(e=``,t={})=>En(e).map(e=>{let n=Dn(e);return{...t,...n}}),kn=e=>e?Array.isArray(e)?e.map(e=>typeof e==`string`?Dn(e):e):typeof e==`string`?On(e):[e]:[],An=({kind:e,label:t,language:n}={kind:`subtitles`})=>t?`${e===`captions`?`cc`:`sb`}:${n}:${encodeURIComponent(t)}`:n,jn=(e=[])=>Array.prototype.map.call(e,An).join(` `),Mn=(e,t)=>n=>n[e]===t,Nn=e=>{let t=Object.entries(e).map(([e,t])=>Mn(e,t));return e=>t.every(t=>t(e))},Pn=(e,t=[],n=[])=>{let r=kn(n).map(Nn);Array.from(t).filter(e=>r.some(t=>t(e))).forEach(t=>{t.mode=e})},Fn=(e,t=()=>!0)=>{if(!e?.textTracks)return[];let n=typeof t==`function`?t:Nn(t);return Array.from(e.textTracks).filter(n)},In=e=>!!e.mediaSubtitlesShowing?.length||e.hasAttribute(u.MEDIA_SUBTITLES_SHOWING),Ln=e=>{let{media:t,fullscreenElement:n}=e;try{let e=n&&`requestFullscreen`in n?`requestFullscreen`:n&&`webkitRequestFullScreen`in n?`webkitRequestFullScreen`:void 0;if(e){let t=n[e]?.call(n);if(t instanceof Promise)return t.catch(()=>{})}else t?.webkitEnterFullscreen?t.webkitEnterFullscreen():t?.requestFullscreen&&t.requestFullscreen()}catch(e){console.error(e)}},Rn=`exitFullscreen`in x?`exitFullscreen`:`webkitExitFullscreen`in x?`webkitExitFullscreen`:`webkitCancelFullScreen`in x?`webkitCancelFullScreen`:void 0,zn=e=>{let{documentElement:t}=e;if(Rn){let e=(t?.[Rn])?.call(t);if(e instanceof Promise)return e.catch(()=>{})}},Bn=`fullscreenElement`in x?`fullscreenElement`:`webkitFullscreenElement`in x?`webkitFullscreenElement`:void 0,Vn=e=>{let{documentElement:t,media:n}=e,r=t?.[Bn];return!r&&`webkitDisplayingFullscreen`in n&&`webkitPresentationMode`in n&&n.webkitDisplayingFullscreen&&n.webkitPresentationMode===ee.FULLSCREEN?n:r},Hn=e=>{let{media:t,documentElement:n,fullscreenElement:r=t}=e;if(!t||!n)return!1;let i=Vn(e);if(!i)return!1;if(i===r||i===t)return!0;if(i.localName.includes(`-`)){let e=i.shadowRoot;if(!(Bn in e))return Le(i,r);for(;e?.[Bn];){if(e[Bn]===r)return!0;e=e[Bn]?.shadowRoot}}return!1},Un=`fullscreenEnabled`in x?`fullscreenEnabled`:`webkitFullscreenEnabled`in x?`webkitFullscreenEnabled`:void 0,Wn=e=>{let{documentElement:t,media:n}=e;return!!t?.[Un]||n&&`webkitSupportsFullscreen`in n},Gn,Kn=()=>{var e;return Gn||(Gn=((e=x)?.createElement)?.call(e,`video`),Gn)},qn=async(e=Kn())=>{if(!e)return!1;let t=e.volume;e.volume=t/2+.1;let n=new AbortController,r=await Promise.race([Jn(e,n.signal),Yn(e,t)]);return n.abort(),r},Jn=(e,t)=>new Promise(n=>{e.addEventListener(`volumechange`,()=>n(!0),{signal:t})}),Yn=async(e,t)=>{for(let n=0;n<10;n++){if(e.volume===t)return!1;await oe(10)}return e.volume!==t},Xn=/.*Version\/.*Safari\/.*/.test(b.navigator.userAgent),Zn=(e=Kn())=>b.matchMedia(`(display-mode: standalone)`).matches&&Xn?!1:typeof e?.requestPictureInPicture==`function`,Qn=(e=Kn())=>Wn({documentElement:x,media:e}),$n=Qn(),er=Zn(),tr=!!b.WebKitPlaybackTargetAvailabilityEvent,nr=!!b.chrome,rr=e=>Fn(e.media,e=>[p.SUBTITLES,p.CAPTIONS].includes(e.kind)).sort((e,t)=>e.kind>=t.kind?1:-1),ir=e=>Fn(e.media,e=>e.mode===m.SHOWING&&[p.SUBTITLES,p.CAPTIONS].includes(e.kind)),ar=(e,t)=>{let n=rr(e),r=ir(e),i=!!r.length;if(n.length){if(t===!1||i&&t!==!0)Pn(m.DISABLED,n,r);else if(t===!0||!i&&t!==!1){let t=n[0],{options:i}=e;if(!i?.noSubtitlesLangPref){let e=b.localStorage.getItem(`media-chrome-pref-subtitles-lang`),r=e?[e,...b.navigator.languages]:b.navigator.languages,i=n.filter(e=>r.some(t=>e.language.toLowerCase().startsWith(t.split(`-`)[0]))).sort((e,t)=>r.findIndex(t=>e.language.toLowerCase().startsWith(t.split(`-`)[0]))-r.findIndex(e=>t.language.toLowerCase().startsWith(e.split(`-`)[0])));i[0]&&(t=i[0])}let{language:a,label:o,kind:s}=t;Pn(m.DISABLED,n,r),Pn(m.SHOWING,n,[{language:a,label:o,kind:s}])}}},or=(e,t)=>e===t?!0:e==null||t==null||typeof e!=typeof t?!1:typeof e==`number`&&Number.isNaN(e)&&Number.isNaN(t)?!0:typeof e==`object`?Array.isArray(e)?sr(e,t):Object.entries(e).every(([e,n])=>e in t&&or(n,t[e])):!1,sr=(e,t)=>{let n=Array.isArray(e),r=Array.isArray(t);return n===r?n||r?e.length===t.length&&e.every((e,n)=>or(e,t[n])):!0:!1},cr=Object.values(_),lr,ur=qn().then(e=>(lr=e,lr)),dr=async(...e)=>{await Promise.all(e.filter(e=>e).map(async e=>{if(!(`localName`in e&&e instanceof b.HTMLElement))return;let t=e.localName;if(!t.includes(`-`))return;let n=b.customElements.get(t);n&&e instanceof n||(await b.customElements.whenDefined(t),b.customElements.upgrade(e))}))},fr=new b.DOMParser,pr=e=>e&&(fr.parseFromString(e,`text/html`).body.textContent||e),mr={mediaError:{get(e,t){let{media:n}=e;if(t?.type!==`playing`)return n?.error},mediaEvents:[`emptied`,`error`,`playing`]},mediaErrorCode:{get(e,t){let{media:n}=e;if(t?.type!==`playing`)return n?.error?.code},mediaEvents:[`emptied`,`error`,`playing`]},mediaErrorMessage:{get(e,t){let{media:n}=e;if(t?.type!==`playing`)return n?.error?.message??``},mediaEvents:[`emptied`,`error`,`playing`]},mediaWidth:{get(e){let{media:t}=e;return t?.videoWidth??0},mediaEvents:[`resize`]},mediaHeight:{get(e){let{media:t}=e;return t?.videoHeight??0},mediaEvents:[`resize`]},mediaPaused:{get(e){let{media:t}=e;return t?.paused??!0},set(e,t){var n;let{media:r}=t;r&&(e?r.pause():(n=r.play())==null||n.catch(()=>{}))},mediaEvents:[`play`,`playing`,`pause`,`emptied`]},mediaHasPlayed:{get(e,t){let{media:n}=e;return n?t?t.type===`playing`:!n.paused:!1},mediaEvents:[`playing`,`emptied`]},mediaEnded:{get(e){let{media:t}=e;return t?.ended??!1},mediaEvents:[`seeked`,`ended`,`emptied`]},mediaPlaybackRate:{get(e){let{media:t}=e;return t?.playbackRate??1},set(e,t){let{media:n}=t;n&&Number.isFinite(+e)&&(n.playbackRate=+e)},mediaEvents:[`ratechange`,`loadstart`]},mediaMuted:{get(e){let{media:t}=e;return t?.muted??!1},set(e,t){let{media:n,options:{noMutedPref:r}={}}=t;if(n){n.muted=e;try{let t=b.localStorage.getItem(`media-chrome-pref-muted`)!==null,i=n.hasAttribute(`muted`);if(r){t&&b.localStorage.removeItem(`media-chrome-pref-muted`);return}if(i&&!t)return;b.localStorage.setItem(`media-chrome-pref-muted`,e?`true`:`false`)}catch(e){console.debug(`Error setting muted pref`,e)}}},mediaEvents:[`volumechange`],stateOwnersUpdateHandlers:[(e,t)=>{let{options:{noMutedPref:n}}=t,{media:r}=t;if(!(!r||r.muted||n))try{let n=b.localStorage.getItem(`media-chrome-pref-muted`)===`true`;mr.mediaMuted.set(n,t),e(n)}catch(e){console.debug(`Error getting muted pref`,e)}}]},mediaLoop:{get(e){let{media:t}=e;return t?.loop},set(e,t){let{media:n}=t;n&&(n.loop=e)},mediaEvents:[`medialooprequest`]},mediaVolume:{get(e){let{media:t}=e;return t?.volume??1},set(e,t){let{media:n,options:{noVolumePref:r}={}}=t;if(n){try{e==null?b.localStorage.removeItem(`media-chrome-pref-volume`):!n.hasAttribute(`muted`)&&!r&&b.localStorage.setItem(`media-chrome-pref-volume`,e.toString())}catch(e){console.debug(`Error setting volume pref`,e)}Number.isFinite(+e)&&(n.volume=+e)}},mediaEvents:[`volumechange`],stateOwnersUpdateHandlers:[(e,t)=>{let{options:{noVolumePref:n}}=t;if(!n)try{let{media:n}=t;if(!n)return;let r=b.localStorage.getItem(`media-chrome-pref-volume`);if(r==null)return;mr.mediaVolume.set(+r,t),e(+r)}catch(e){console.debug(`Error getting volume pref`,e)}}]},mediaVolumeLevel:{get(e){let{media:t}=e;return t?.volume===void 0?`high`:t.muted||t.volume===0?`off`:t.volume<.5?`low`:t.volume<.75?`medium`:`high`},mediaEvents:[`volumechange`]},mediaCurrentTime:{get(e){let{media:t}=e;return t?.currentTime??0},set(e,t){let{media:n}=t;n&&ae(e)&&(n.currentTime=e)},mediaEvents:[`timeupdate`,`loadedmetadata`,`seeking`]},mediaDuration:{get(e){let{media:t,options:{defaultDuration:n}={}}=e;return n&&(!t||!t.duration||Number.isNaN(t.duration)||!Number.isFinite(t.duration))?n:Number.isFinite(t?.duration)?t.duration:NaN},mediaEvents:[`durationchange`,`loadedmetadata`,`emptied`]},mediaLoading:{get(e){let{media:t}=e;return t?.readyState<3},mediaEvents:[`waiting`,`playing`,`emptied`]},mediaSeekable:{get(e){let{media:t}=e;if(!t?.seekable?.length)return;let n=t.seekable.start(0),r=t.seekable.end(t.seekable.length-1);if(n||r)return[Number(n.toFixed(3)),Number(r.toFixed(3))]},mediaEvents:[`loadedmetadata`,`emptied`,`progress`,`seekablechange`]},mediaBuffered:{get(e){let{media:t}=e,n=t?.buffered??[];return Array.from(n).map((e,t)=>[Number(n.start(t).toFixed(3)),Number(n.end(t).toFixed(3))])},mediaEvents:[`progress`,`emptied`]},mediaStreamType:{get(e){let{media:t,options:{defaultStreamType:n}={}}=e,r=[_.LIVE,_.ON_DEMAND].includes(n)?n:void 0;if(!t)return r;let{streamType:i}=t;if(cr.includes(i))return i===_.UNKNOWN?r:i;let a=t.duration;return a===1/0?_.LIVE:Number.isFinite(a)?_.ON_DEMAND:r},mediaEvents:[`emptied`,`durationchange`,`loadedmetadata`,`streamtypechange`]},mediaTargetLiveWindow:{get(e){let{media:t}=e;if(!t)return NaN;let{targetLiveWindow:n}=t,r=mr.mediaStreamType.get(e);return(n==null||Number.isNaN(n))&&r===_.LIVE?0:n},mediaEvents:[`emptied`,`durationchange`,`loadedmetadata`,`streamtypechange`,`targetlivewindowchange`]},mediaTimeIsLive:{get(e){let{media:t,options:{liveEdgeOffset:n=10}={}}=e;if(!t)return!1;if(typeof t.liveEdgeStart==`number`)return!Number.isNaN(t.liveEdgeStart)&&t.currentTime>=t.liveEdgeStart;if(mr.mediaStreamType.get(e)!==_.LIVE)return!1;let r=t.seekable;if(!r)return!0;if(!r.length)return!1;let i=r.end(r.length-1)-n;return t.currentTime>=i},mediaEvents:[`playing`,`timeupdate`,`progress`,`waiting`,`emptied`]},mediaSubtitlesList:{get(e){return rr(e).map(({kind:e,label:t,language:n})=>({kind:e,label:t,language:n}))},mediaEvents:[`loadstart`],textTracksEvents:[`addtrack`,`removetrack`]},mediaSubtitlesShowing:{get(e){return ir(e).map(({kind:e,label:t,language:n})=>({kind:e,label:t,language:n}))},mediaEvents:[`loadstart`],textTracksEvents:[`addtrack`,`removetrack`,`change`],stateOwnersUpdateHandlers:[(e,t)=>{var n,r;let{media:i,options:a}=t;if(!i)return;let o=e=>{a.defaultSubtitles&&(!e||[p.CAPTIONS,p.SUBTITLES].includes(e?.track?.kind))&&ar(t,!0)};return i.addEventListener(`loadstart`,o),(n=i.textTracks)==null||n.addEventListener(`addtrack`,o),(r=i.textTracks)==null||r.addEventListener(`removetrack`,o),()=>{var e,t;i.removeEventListener(`loadstart`,o),(e=i.textTracks)==null||e.removeEventListener(`addtrack`,o),(t=i.textTracks)==null||t.removeEventListener(`removetrack`,o)}}]},mediaChaptersCues:{get(e){let{media:t}=e;if(!t)return[];let[n]=Fn(t,{kind:p.CHAPTERS});return Array.from(n?.cues??[]).map(({text:e,startTime:t,endTime:n})=>({text:pr(e),startTime:t,endTime:n}))},mediaEvents:[`loadstart`,`loadedmetadata`],textTracksEvents:[`addtrack`,`removetrack`,`change`],stateOwnersUpdateHandlers:[(e,t)=>{let{media:n}=t;if(!n)return;let r=n.querySelector(`track[kind="chapters"][default][src]`),i=n.shadowRoot?.querySelector(`:is(video,audio) > track[kind="chapters"][default][src]`);return r?.addEventListener(`load`,e),i?.addEventListener(`load`,e),()=>{r?.removeEventListener(`load`,e),i?.removeEventListener(`load`,e)}}]},mediaIsPip:{get(e){let{media:t,documentElement:n}=e;if(!t||!n||!n.pictureInPictureElement)return!1;if(n.pictureInPictureElement===t)return!0;if(n.pictureInPictureElement instanceof HTMLMediaElement)return t.localName?.includes(`-`)?Le(t,n.pictureInPictureElement):!1;if(n.pictureInPictureElement.localName.includes(`-`)){let e=n.pictureInPictureElement.shadowRoot;for(;e?.pictureInPictureElement;){if(e.pictureInPictureElement===t)return!0;e=e.pictureInPictureElement?.shadowRoot}}return!1},set(e,t){let{media:n}=t;if(n){if(e){if(!x.pictureInPictureEnabled){console.warn(`MediaChrome: Picture-in-picture is not enabled`);return}if(!n.requestPictureInPicture){console.warn(`MediaChrome: The current media does not support picture-in-picture`);return}let e=()=>{console.warn(`MediaChrome: The media is not ready for picture-in-picture. It must have a readyState > 0.`)};n.requestPictureInPicture().catch(t=>{if(t.code===11){if(!n.src){console.warn(`MediaChrome: The media is not ready for picture-in-picture. It must have a src set.`);return}if(n.readyState===0&&n.preload===`none`){let t=()=>{n.removeEventListener(`loadedmetadata`,r),n.preload=`none`},r=()=>{n.requestPictureInPicture().catch(e),t()};n.addEventListener(`loadedmetadata`,r),n.preload=`metadata`,setTimeout(()=>{n.readyState===0&&e(),t()},1e3)}else throw t}else throw t})}else x.pictureInPictureElement&&x.exitPictureInPicture()}},mediaEvents:[`enterpictureinpicture`,`leavepictureinpicture`]},mediaRenditionList:{get(e){let{media:t}=e;return[...t?.videoRenditions??[]].map(e=>({...e}))},mediaEvents:[`emptied`,`loadstart`],videoRenditionsEvents:[`addrendition`,`removerendition`]},mediaRenditionSelected:{get(e){let{media:t}=e;return t?.videoRenditions?.[t.videoRenditions?.selectedIndex]?.id},set(e,t){let{media:n}=t;if(!n?.videoRenditions){console.warn(`MediaController: Rendition selection not supported by this media.`);return}let r=e,i=Array.prototype.findIndex.call(n.videoRenditions,e=>e.id==r);n.videoRenditions.selectedIndex!=i&&(n.videoRenditions.selectedIndex=i)},mediaEvents:[`emptied`],videoRenditionsEvents:[`addrendition`,`removerendition`,`change`]},mediaAudioTrackList:{get(e){let{media:t}=e;return[...t?.audioTracks??[]]},mediaEvents:[`emptied`,`loadstart`],audioTracksEvents:[`addtrack`,`removetrack`]},mediaAudioTrackEnabled:{get(e){let{media:t}=e;return[...t?.audioTracks??[]].find(e=>e.enabled)?.id},set(e,t){let{media:n}=t;if(!n?.audioTracks){console.warn(`MediaChrome: Audio track selection not supported by this media.`);return}let r=e;for(let e of n.audioTracks)e.enabled=r==e.id},mediaEvents:[`emptied`],audioTracksEvents:[`addtrack`,`removetrack`,`change`]},mediaIsFullscreen:{get(e){return Hn(e)},set(e,t,n){var r;e?(Ln(t),n.detail&&!t.media?.inert&&((r=t.media)==null||r.focus())):zn(t)},rootEvents:[`fullscreenchange`,`webkitfullscreenchange`],mediaEvents:[`webkitbeginfullscreen`,`webkitendfullscreen`,`webkitpresentationmodechanged`]},mediaIsCasting:{get(e){let{media:t}=e;return!t?.remote||t.remote?.state===`disconnected`?!1:t.remote.state===`connected`},set(e,t){let{media:n}=t;n&&(e&&n.remote?.state!==`disconnected`||(e||n.remote?.state===`connected`)&&(typeof n.remote.prompt==`function`?n.remote.prompt().catch(()=>{}):console.warn(`MediaChrome: Casting is not supported in this environment`)))},remoteEvents:[`connect`,`connecting`,`disconnect`]},mediaIsAirplaying:{get(){return!1},set(e,t){let{media:n}=t;n&&(n.webkitShowPlaybackTargetPicker&&b.WebKitPlaybackTargetAvailabilityEvent?n.webkitShowPlaybackTargetPicker():console.error(`MediaChrome: received a request to select AirPlay but AirPlay is not supported in this environment`))},mediaEvents:[`webkitcurrentplaybacktargetiswirelesschanged`]},mediaFullscreenUnavailable:{get(e){let{media:t}=e;if(!$n||!Qn(t))return g.UNSUPPORTED}},mediaPipUnavailable:{get(e){let{media:t}=e;if(!er||!Zn(t))return g.UNSUPPORTED;if(t?.disablePictureInPicture)return g.UNAVAILABLE}},mediaVolumeUnavailable:{get(e){let{media:t}=e;if(lr===!1||t?.volume==null)return g.UNSUPPORTED},stateOwnersUpdateHandlers:[e=>{lr??ur.then(t=>e(t?void 0:g.UNSUPPORTED))}]},mediaCastUnavailable:{get(e,{availability:t=`not-available`}={}){let{media:n}=e;if(!nr||!n?.remote?.state)return g.UNSUPPORTED;if(t!=null&&t!==`available`)return g.UNAVAILABLE},stateOwnersUpdateHandlers:[(e,t)=>{var n;let{media:r}=t;if(r)return r.disableRemotePlayback||r.hasAttribute(`disableremoteplayback`)||(n=r?.remote)==null||n.watchAvailability(t=>{e({availability:t?`available`:`not-available`})}).catch(t=>{t.name===`NotSupportedError`?e({availability:null}):e({availability:`not-available`})}),()=>{var e;(e=r?.remote)==null||e.cancelWatchAvailability().catch(()=>{})}}]},mediaAirplayUnavailable:{get(e,t){if(!tr)return g.UNSUPPORTED;if(t?.availability===`not-available`)return g.UNAVAILABLE},mediaEvents:[`webkitplaybacktargetavailabilitychanged`],stateOwnersUpdateHandlers:[(e,t)=>{var n;let{media:r}=t;if(r)return r.disableRemotePlayback||r.hasAttribute(`disableremoteplayback`)||(n=r?.remote)==null||n.watchAvailability(t=>{e({availability:t?`available`:`not-available`})}).catch(t=>{t.name===`NotSupportedError`?e({availability:null}):e({availability:`not-available`})}),()=>{var e;(e=r?.remote)==null||e.cancelWatchAvailability().catch(()=>{})}}]},mediaRenditionUnavailable:{get(e){let{media:t}=e;if(!t?.videoRenditions)return g.UNSUPPORTED;if(!t.videoRenditions?.length)return g.UNAVAILABLE},mediaEvents:[`emptied`,`loadstart`],videoRenditionsEvents:[`addrendition`,`removerendition`]},mediaAudioTrackUnavailable:{get(e){let{media:t}=e;if(!t?.audioTracks)return g.UNSUPPORTED;if((t.audioTracks?.length??0)<=1)return g.UNAVAILABLE},mediaEvents:[`emptied`,`loadstart`],audioTracksEvents:[`addtrack`,`removetrack`]},mediaLang:{get(e){let{options:{mediaLang:t}={}}=e;return t??`en`}}},hr={[o.MEDIA_PREVIEW_REQUEST](e,t,{detail:n}){let{media:r}=t,i=n??void 0,a,o;if(r&&i!=null){let[e]=Fn(r,{kind:p.METADATA,label:`thumbnails`}),t=Array.prototype.find.call(e?.cues??[],(e,t,n)=>t===0?e.endTime>i:t===n.length-1?e.startTime<=i:e.startTime<=i&&e.endTime>i);if(t){let e=/'^(?:[a-z]+:)?\/\//i.test(t.text)?void 0:r?.querySelector(`track[label="thumbnails"]`)?.src,n=new URL(t.text,e);o=new URLSearchParams(n.hash).get(`#xywh`).split(`,`).map(e=>+e),a=n.href}}let s=e.mediaDuration.get(t),c=e.mediaChaptersCues.get(t).find((e,t,n)=>t===n.length-1&&s===e.endTime?e.startTime<=i&&e.endTime>=i:e.startTime<=i&&e.endTime>i)?.text;return n!=null&&c==null&&(c=``),{mediaPreviewTime:i,mediaPreviewImage:a,mediaPreviewCoords:o,mediaPreviewChapter:c}},[o.MEDIA_PAUSE_REQUEST](e,t){e.mediaPaused.set(!0,t)},[o.MEDIA_PLAY_REQUEST](e,t){let n=e.mediaStreamType.get(t)===_.LIVE,r=!t.options?.noAutoSeekToLive,i=e.mediaTargetLiveWindow.get(t)>0;if(n&&r&&!i){let n=e.mediaSeekable.get(t)?.[1];if(n){let r=n-(t.options?.seekToLiveOffset??0);e.mediaCurrentTime.set(r,t)}}e.mediaPaused.set(!1,t)},[o.MEDIA_PLAYBACK_RATE_REQUEST](e,t,{detail:n}){let r=n;e.mediaPlaybackRate.set(r,t)},[o.MEDIA_MUTE_REQUEST](e,t){e.mediaMuted.set(!0,t)},[o.MEDIA_UNMUTE_REQUEST](e,t){e.mediaVolume.get(t)||e.mediaVolume.set(.25,t),e.mediaMuted.set(!1,t)},[o.MEDIA_LOOP_REQUEST](e,t,{detail:n}){let r=!!n;return e.mediaLoop.set(r,t),{mediaLoop:r}},[o.MEDIA_VOLUME_REQUEST](e,t,{detail:n}){let r=n;r&&e.mediaMuted.get(t)&&e.mediaMuted.set(!1,t),e.mediaVolume.set(r,t)},[o.MEDIA_SEEK_REQUEST](e,t,{detail:n}){let r=n;e.mediaCurrentTime.set(r,t)},[o.MEDIA_SEEK_TO_LIVE_REQUEST](e,t){let n=e.mediaSeekable.get(t)?.[1];if(Number.isNaN(Number(n)))return;let r=n-(t.options?.seekToLiveOffset??0);e.mediaCurrentTime.set(r,t)},[o.MEDIA_SHOW_SUBTITLES_REQUEST](e,t,{detail:n}){let{options:r}=t,i=rr(t),a=kn(n),o=a[0]?.language;o&&!r.noSubtitlesLangPref&&b.localStorage.setItem(`media-chrome-pref-subtitles-lang`,o),Pn(m.SHOWING,i,a)},[o.MEDIA_DISABLE_SUBTITLES_REQUEST](e,t,{detail:n}){let r=rr(t),i=n??[];Pn(m.DISABLED,r,i)},[o.MEDIA_TOGGLE_SUBTITLES_REQUEST](e,t,{detail:n}){ar(t,n)},[o.MEDIA_RENDITION_REQUEST](e,t,{detail:n}){let r=n;e.mediaRenditionSelected.set(r,t)},[o.MEDIA_AUDIO_TRACK_REQUEST](e,t,{detail:n}){let r=n;e.mediaAudioTrackEnabled.set(r,t)},[o.MEDIA_ENTER_PIP_REQUEST](e,t){e.mediaIsFullscreen.get(t)&&e.mediaIsFullscreen.set(!1,t),e.mediaIsPip.set(!0,t)},[o.MEDIA_EXIT_PIP_REQUEST](e,t){e.mediaIsPip.set(!1,t)},[o.MEDIA_ENTER_FULLSCREEN_REQUEST](e,t,n){e.mediaIsPip.get(t)&&e.mediaIsPip.set(!1,t),e.mediaIsFullscreen.set(!0,t,n)},[o.MEDIA_EXIT_FULLSCREEN_REQUEST](e,t){e.mediaIsFullscreen.set(!1,t)},[o.MEDIA_ENTER_CAST_REQUEST](e,t){e.mediaIsFullscreen.get(t)&&e.mediaIsFullscreen.set(!1,t),e.mediaIsCasting.set(!0,t)},[o.MEDIA_EXIT_CAST_REQUEST](e,t){e.mediaIsCasting.set(!1,t)},[o.MEDIA_AIRPLAY_REQUEST](e,t){e.mediaIsAirplaying.set(!0,t)}},gr=({media:e,fullscreenElement:t,documentElement:n,stateMediator:r=mr,requestMap:i=hr,options:a={},monitorStateOwnersOnlyWithSubscriptions:o=!0})=>{let s=[],c={options:{...a}},l=Object.freeze({mediaPreviewTime:void 0,mediaPreviewImage:void 0,mediaPreviewCoords:void 0,mediaPreviewChapter:void 0}),u=e=>{e!=null&&(or(e,l)||(l=Object.freeze({...l,...e}),s.forEach(e=>e(l))))},d=()=>{let e=Object.entries(r).reduce((e,[t,{get:n}])=>(e[t]=n(c),e),{});u(e)},f={},p,m=async(e,t)=>{let n=!!p;if(p={...c,...p??{},...e},n)return;await dr(...Object.values(e));let i=s.length>0&&t===0&&o,a=c.media!==p.media,l=c.media?.textTracks!==p.media?.textTracks,m=c.media?.videoRenditions!==p.media?.videoRenditions,h=c.media?.audioTracks!==p.media?.audioTracks,g=c.media?.remote!==p.media?.remote,_=c.documentElement!==p.documentElement,ee=!!c.media&&(a||i),te=!!c.media?.textTracks&&(l||i),ne=!!c.media?.videoRenditions&&(m||i),re=!!c.media?.audioTracks&&(h||i),ie=!!c.media?.remote&&(g||i),ae=!!c.documentElement&&(_||i),oe=ee||te||ne||re||ie||ae,se=s.length===0&&t===1&&o,ce=!!p.media&&(a||se),v=!!p.media?.textTracks&&(l||se),le=!!p.media?.videoRenditions&&(m||se),ue=!!p.media?.audioTracks&&(h||se),de=!!p.media?.remote&&(g||se),fe=!!p.documentElement&&(_||se),pe=ce||v||le||ue||de||fe;oe||pe?(Object.entries(r).forEach(([e,{get:t,mediaEvents:n=[],textTracksEvents:r=[],videoRenditionsEvents:i=[],audioTracksEvents:a=[],remoteEvents:o=[],rootEvents:s=[],stateOwnersUpdateHandlers:l=[]}])=>{f[e]||(f[e]={});let d=n=>{let r=t(c,n);u({[e]:r})},m;m=f[e].mediaEvents,n.forEach(t=>{m&&ee&&(c.media.removeEventListener(t,m),f[e].mediaEvents=void 0),ce&&(p.media.addEventListener(t,d),f[e].mediaEvents=d)}),m=f[e].textTracksEvents,r.forEach(t=>{var n,r;m&&te&&((n=c.media.textTracks)==null||n.removeEventListener(t,m),f[e].textTracksEvents=void 0),v&&((r=p.media.textTracks)==null||r.addEventListener(t,d),f[e].textTracksEvents=d)}),m=f[e].videoRenditionsEvents,i.forEach(t=>{var n,r;m&&ne&&((n=c.media.videoRenditions)==null||n.removeEventListener(t,m),f[e].videoRenditionsEvents=void 0),le&&((r=p.media.videoRenditions)==null||r.addEventListener(t,d),f[e].videoRenditionsEvents=d)}),m=f[e].audioTracksEvents,a.forEach(t=>{var n,r;m&&re&&((n=c.media.audioTracks)==null||n.removeEventListener(t,m),f[e].audioTracksEvents=void 0),ue&&((r=p.media.audioTracks)==null||r.addEventListener(t,d),f[e].audioTracksEvents=d)}),m=f[e].remoteEvents,o.forEach(t=>{var n,r;m&&ie&&((n=c.media.remote)==null||n.removeEventListener(t,m),f[e].remoteEvents=void 0),de&&((r=p.media.remote)==null||r.addEventListener(t,d),f[e].remoteEvents=d)}),m=f[e].rootEvents,s.forEach(t=>{m&&ae&&(c.documentElement.removeEventListener(t,m),f[e].rootEvents=void 0),fe&&(p.documentElement.addEventListener(t,d),f[e].rootEvents=d)});let h=f[e].stateOwnersUpdateHandlers;if(h&&oe&&(Array.isArray(h)?h:[h]).forEach(e=>{typeof e==`function`&&e()}),pe){let t=l.map(e=>e(d,p)).filter(e=>typeof e==`function`);f[e].stateOwnersUpdateHandlers=t.length===1?t[0]:t}else oe&&(f[e].stateOwnersUpdateHandlers=void 0)}),Object.entries(p).forEach(([e,t])=>{c[e]=t}),d(),p=void 0):(Object.entries(p).forEach(([e,t])=>{c[e]=t}),d(),p=void 0)};return m({media:e,fullscreenElement:t,documentElement:n,options:a}),{dispatch(e){let{type:t,detail:n}=e;i[t]&&l.mediaErrorCode==null?u(i[t](r,c,e)):t===`mediaelementchangerequest`?m({media:n}):t===`fullscreenelementchangerequest`?m({fullscreenElement:n}):t===`documentelementchangerequest`?m({documentElement:n}):t===`optionschangerequest`&&(Object.entries(n??{}).forEach(([e,t])=>{c.options[e]=t}),d())},getState(){return l},subscribe(e){return m({},s.length+1),s.push(e),e(l),()=>{let t=s.indexOf(e);t>=0&&(m({},s.length-1),s.splice(t,1))}}}},_r=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},P=(e,t,n)=>(_r(e,t,`read from private field`),n?n.call(e):t.get(e)),F=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},vr=(e,t,n,r)=>(_r(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),yr=(e,t,n)=>(_r(e,t,`access private method`),n),br,xr,I,L,Sr,Cr,wr,Tr,Er,Dr,Or,kr,Ar,jr,Mr,Nr,Pr,Fr=[`ArrowLeft`,`ArrowRight`,`ArrowUp`,`ArrowDown`,`Enter`,` `,`f`,`m`,`k`,`c`,`l`,`j`,`>`,`<`,`p`],Ir=10,Lr=.025,Rr=.25,zr=.25,Br=2,R={DEFAULT_SUBTITLES:`defaultsubtitles`,DEFAULT_STREAM_TYPE:`defaultstreamtype`,DEFAULT_DURATION:`defaultduration`,FULLSCREEN_ELEMENT:`fullscreenelement`,HOTKEYS:`hotkeys`,KEYBOARD_BACKWARD_SEEK_OFFSET:`keyboardbackwardseekoffset`,KEYBOARD_FORWARD_SEEK_OFFSET:`keyboardforwardseekoffset`,KEYBOARD_DOWN_VOLUME_STEP:`keyboarddownvolumestep`,KEYBOARD_UP_VOLUME_STEP:`keyboardupvolumestep`,KEYS_USED:`keysused`,LANG:`lang`,LOOP:`loop`,LIVE_EDGE_OFFSET:`liveedgeoffset`,NO_AUTO_SEEK_TO_LIVE:`noautoseektolive`,NO_DEFAULT_STORE:`nodefaultstore`,NO_HOTKEYS:`nohotkeys`,NO_MUTED_PREF:`nomutedpref`,NO_SUBTITLES_LANG_PREF:`nosubtitleslangpref`,NO_VOLUME_PREF:`novolumepref`,SEEK_TO_LIVE_OFFSET:`seektoliveoffset`},Vr=class extends kt{constructor(){super(),F(this,Er),F(this,kr),F(this,jr),F(this,Nr),this.mediaStateReceivers=[],this.associatedElementSubscriptions=new Map,F(this,br,new Tn(this,R.HOTKEYS)),F(this,xr,void 0),F(this,I,void 0),F(this,L,null),F(this,Sr,void 0),F(this,Cr,void 0),F(this,wr,e=>{var t;(t=P(this,I))==null||t.dispatch(e)}),F(this,Tr,void 0),F(this,Or,e=>{let{key:t,shiftKey:n}=e;n&&(t===`/`||t===`?`)||Fr.includes(t)?this.keyboardShortcutHandler(e):this.removeEventListener(`keyup`,P(this,Or))}),this.associateElement(this);let e={};vr(this,Sr,t=>{Object.entries(t).forEach(([t,n])=>{if(t in e&&e[t]===n)return;this.propagateMediaState(t,n);let r=t.toLowerCase(),i=new b.CustomEvent(f[r],{composed:!0,detail:n});this.dispatchEvent(i)}),e=t})}static get observedAttributes(){return super.observedAttributes.concat(R.NO_HOTKEYS,R.HOTKEYS,R.DEFAULT_STREAM_TYPE,R.DEFAULT_SUBTITLES,R.DEFAULT_DURATION,R.NO_MUTED_PREF,R.NO_VOLUME_PREF,R.LANG,R.LOOP,R.LIVE_EDGE_OFFSET,R.SEEK_TO_LIVE_OFFSET,R.NO_AUTO_SEEK_TO_LIVE)}get mediaStore(){return P(this,I)}set mediaStore(e){var t;P(this,I)&&((t=P(this,Cr))==null||t.call(this),vr(this,Cr,void 0)),vr(this,I,e),!P(this,I)&&!this.hasAttribute(R.NO_DEFAULT_STORE)?yr(this,Er,Dr).call(this):vr(this,Cr,P(this,I)?.subscribe(P(this,Sr)))}get fullscreenElement(){return P(this,xr)??this}set fullscreenElement(e){var t;this.hasAttribute(R.FULLSCREEN_ELEMENT)&&this.removeAttribute(R.FULLSCREEN_ELEMENT),vr(this,xr,e),(t=P(this,I))==null||t.dispatch({type:`fullscreenelementchangerequest`,detail:this.fullscreenElement})}get defaultSubtitles(){return T(this,R.DEFAULT_SUBTITLES)}set defaultSubtitles(e){E(this,R.DEFAULT_SUBTITLES,e)}get defaultStreamType(){return D(this,R.DEFAULT_STREAM_TYPE)}set defaultStreamType(e){O(this,R.DEFAULT_STREAM_TYPE,e)}get defaultDuration(){return C(this,R.DEFAULT_DURATION)}set defaultDuration(e){w(this,R.DEFAULT_DURATION,e)}get noHotkeys(){return T(this,R.NO_HOTKEYS)}set noHotkeys(e){E(this,R.NO_HOTKEYS,e)}get keysUsed(){return D(this,R.KEYS_USED)}set keysUsed(e){O(this,R.KEYS_USED,e)}get liveEdgeOffset(){return C(this,R.LIVE_EDGE_OFFSET)}set liveEdgeOffset(e){w(this,R.LIVE_EDGE_OFFSET,e)}get noAutoSeekToLive(){return T(this,R.NO_AUTO_SEEK_TO_LIVE)}set noAutoSeekToLive(e){E(this,R.NO_AUTO_SEEK_TO_LIVE,e)}get noVolumePref(){return T(this,R.NO_VOLUME_PREF)}set noVolumePref(e){E(this,R.NO_VOLUME_PREF,e)}get noMutedPref(){return T(this,R.NO_MUTED_PREF)}set noMutedPref(e){E(this,R.NO_MUTED_PREF,e)}get noSubtitlesLangPref(){return T(this,R.NO_SUBTITLES_LANG_PREF)}set noSubtitlesLangPref(e){E(this,R.NO_SUBTITLES_LANG_PREF,e)}get noDefaultStore(){return T(this,R.NO_DEFAULT_STORE)}set noDefaultStore(e){E(this,R.NO_DEFAULT_STORE,e)}get resolvedLang(){return pe()}attributeChangedCallback(e,t,n){var r,i,a,s,c,l,u,d,f,p;if(super.attributeChangedCallback(e,t,n),e===R.NO_HOTKEYS)n!==t&&n===``?(this.hasAttribute(R.HOTKEYS)&&console.warn("Media Chrome: Both `hotkeys` and `nohotkeys` have been set. All hotkeys will be disabled."),this.disableHotkeys()):n!==t&&n===null&&this.enableHotkeys(),yr(this,jr,Mr).call(this);else if(e===R.HOTKEYS)P(this,br).value=n,yr(this,jr,Mr).call(this);else if(e===R.DEFAULT_SUBTITLES&&n!==t)(r=P(this,I))==null||r.dispatch({type:`optionschangerequest`,detail:{defaultSubtitles:this.hasAttribute(R.DEFAULT_SUBTITLES)}});else if(e===R.DEFAULT_STREAM_TYPE)(i=P(this,I))==null||i.dispatch({type:`optionschangerequest`,detail:{defaultStreamType:this.getAttribute(R.DEFAULT_STREAM_TYPE)??void 0}});else if(e===R.LIVE_EDGE_OFFSET&&n!==t)(a=P(this,I))==null||a.dispatch({type:`optionschangerequest`,detail:{liveEdgeOffset:this.hasAttribute(R.LIVE_EDGE_OFFSET)?+this.getAttribute(R.LIVE_EDGE_OFFSET):void 0,seekToLiveOffset:this.hasAttribute(R.SEEK_TO_LIVE_OFFSET)?+this.getAttribute(R.SEEK_TO_LIVE_OFFSET):this.hasAttribute(R.LIVE_EDGE_OFFSET)?+this.getAttribute(R.LIVE_EDGE_OFFSET):void 0}});else if(e===R.SEEK_TO_LIVE_OFFSET&&n!==t)(s=P(this,I))==null||s.dispatch({type:`optionschangerequest`,detail:{seekToLiveOffset:this.hasAttribute(R.SEEK_TO_LIVE_OFFSET)?+this.getAttribute(R.SEEK_TO_LIVE_OFFSET):this.hasAttribute(R.LIVE_EDGE_OFFSET)?+this.getAttribute(R.LIVE_EDGE_OFFSET):void 0}});else if(e===R.NO_AUTO_SEEK_TO_LIVE)(c=P(this,I))==null||c.dispatch({type:`optionschangerequest`,detail:{noAutoSeekToLive:this.hasAttribute(R.NO_AUTO_SEEK_TO_LIVE)}});else if(e===R.FULLSCREEN_ELEMENT){let e=n?this.getRootNode()?.getElementById(n):void 0;vr(this,xr,e),(l=P(this,I))==null||l.dispatch({type:`fullscreenelementchangerequest`,detail:this.fullscreenElement})}else e===R.LANG&&n!==t?(ue(n),(u=P(this,I))==null||u.dispatch({type:`optionschangerequest`,detail:{mediaLang:n}})):e===R.LOOP&&n!==t?(d=P(this,I))==null||d.dispatch({type:o.MEDIA_LOOP_REQUEST,detail:n!=null}):e===R.NO_VOLUME_PREF&&n!==t?(f=P(this,I))==null||f.dispatch({type:`optionschangerequest`,detail:{noVolumePref:this.hasAttribute(R.NO_VOLUME_PREF)}}):e===R.NO_MUTED_PREF&&n!==t&&((p=P(this,I))==null||p.dispatch({type:`optionschangerequest`,detail:{noMutedPref:this.hasAttribute(R.NO_MUTED_PREF)}}))}connectedCallback(){var e,t;this.associateElement(this),!P(this,I)&&!this.hasAttribute(R.NO_DEFAULT_STORE)&&yr(this,Er,Dr).call(this),(e=P(this,I))==null||e.dispatch({type:`documentelementchangerequest`,detail:x}),(t=P(this,I))==null||t.dispatch({type:`fullscreenelementchangerequest`,detail:this.fullscreenElement}),super.connectedCallback(),P(this,I)&&!P(this,Cr)&&vr(this,Cr,P(this,I)?.subscribe(P(this,Sr))),P(this,Tr)!==void 0&&P(this,I)&&this.media&&setTimeout(()=>{var e;this.media?.textTracks?.length&&((e=P(this,I))==null||e.dispatch({type:o.MEDIA_TOGGLE_SUBTITLES_REQUEST,detail:P(this,Tr)}))},0),this.hasAttribute(R.NO_HOTKEYS)?this.disableHotkeys():this.enableHotkeys()}disconnectedCallback(){var e,t,n,r,i;if((e=super.disconnectedCallback)==null||e.call(this),this.disableHotkeys(),P(this,I)){let e=P(this,I).getState();vr(this,Tr,!!e.mediaSubtitlesShowing?.length),(t=P(this,I))==null||t.dispatch({type:`fullscreenelementchangerequest`,detail:void 0}),(n=P(this,I))==null||n.dispatch({type:`documentelementchangerequest`,detail:void 0}),(r=P(this,I))==null||r.dispatch({type:o.MEDIA_TOGGLE_SUBTITLES_REQUEST,detail:!1})}P(this,Cr)&&((i=P(this,Cr))==null||i.call(this),vr(this,Cr,void 0)),this.unassociateElement(this),P(this,L)&&(P(this,L).remove(),vr(this,L,null))}mediaSetCallback(e){var t;super.mediaSetCallback(e),(t=P(this,I))==null||t.dispatch({type:`mediaelementchangerequest`,detail:e}),e.hasAttribute(`tabindex`)||(e.tabIndex=-1)}mediaUnsetCallback(e){var t;super.mediaUnsetCallback(e),(t=P(this,I))==null||t.dispatch({type:`mediaelementchangerequest`,detail:void 0})}propagateMediaState(e,t){Qr(this.mediaStateReceivers,e,t)}associateElement(e){if(!e)return;let{associatedElementSubscriptions:t}=this;if(t.has(e))return;let n=$r(e,this.registerMediaStateReceiver.bind(this),this.unregisterMediaStateReceiver.bind(this));Object.values(o).forEach(t=>{e.addEventListener(t,P(this,wr))}),t.set(e,n)}unassociateElement(e){if(!e)return;let{associatedElementSubscriptions:t}=this;t.has(e)&&(t.get(e)(),t.delete(e),Object.values(o).forEach(t=>{e.removeEventListener(t,P(this,wr))}))}registerMediaStateReceiver(e){if(!e)return;let t=this.mediaStateReceivers;t.indexOf(e)>-1||(t.push(e),P(this,I)&&Object.entries(P(this,I).getState()).forEach(([t,n])=>{Qr([e],t,n)}))}unregisterMediaStateReceiver(e){let t=this.mediaStateReceivers,n=t.indexOf(e);n<0||t.splice(n,1)}enableHotkeys(){this.addEventListener(`keydown`,yr(this,kr,Ar))}disableHotkeys(){this.removeEventListener(`keydown`,yr(this,kr,Ar)),this.removeEventListener(`keyup`,P(this,Or))}get hotkeys(){return P(this,br)}set hotkeys(e){O(this,R.HOTKEYS,e)}keyboardShortcutHandler(e){let t=e.target;if((t.getAttribute(R.KEYS_USED)?.split(` `)??t?.keysUsed??[]).map(e=>e===`Space`?` `:e).filter(Boolean).includes(e.key))return;let n,r,i;if(!P(this,br).contains(un(e.key))&&(!e.shiftKey||e.key!==`/`&&e.key!==`?`||!P(this,br).contains(`noshift+/`)))switch(e.key){case` `:case`k`:n=P(this,I).getState().mediaPaused?o.MEDIA_PLAY_REQUEST:o.MEDIA_PAUSE_REQUEST,this.dispatchEvent(new b.CustomEvent(n,{composed:!0,bubbles:!0}));break;case`m`:n=this.mediaStore.getState().mediaVolumeLevel===`off`?o.MEDIA_UNMUTE_REQUEST:o.MEDIA_MUTE_REQUEST,this.dispatchEvent(new b.CustomEvent(n,{composed:!0,bubbles:!0}));break;case`f`:n=this.mediaStore.getState().mediaIsFullscreen?o.MEDIA_EXIT_FULLSCREEN_REQUEST:o.MEDIA_ENTER_FULLSCREEN_REQUEST,this.dispatchEvent(new b.CustomEvent(n,{composed:!0,bubbles:!0}));break;case`c`:this.dispatchEvent(new b.CustomEvent(o.MEDIA_TOGGLE_SUBTITLES_REQUEST,{composed:!0,bubbles:!0}));break;case`ArrowLeft`:case`j`:{let e=this.hasAttribute(R.KEYBOARD_BACKWARD_SEEK_OFFSET)?+this.getAttribute(R.KEYBOARD_BACKWARD_SEEK_OFFSET):Ir;r=Math.max((this.mediaStore.getState().mediaCurrentTime??0)-e,0),i=new b.CustomEvent(o.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:r}),this.dispatchEvent(i);break}case`ArrowRight`:case`l`:{let e=this.hasAttribute(R.KEYBOARD_FORWARD_SEEK_OFFSET)?+this.getAttribute(R.KEYBOARD_FORWARD_SEEK_OFFSET):Ir;r=Math.max((this.mediaStore.getState().mediaCurrentTime??0)+e,0),i=new b.CustomEvent(o.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:r}),this.dispatchEvent(i);break}case`ArrowUp`:{let e=this.hasAttribute(R.KEYBOARD_UP_VOLUME_STEP)?+this.getAttribute(R.KEYBOARD_UP_VOLUME_STEP):Lr;r=Math.min((this.mediaStore.getState().mediaVolume??1)+e,1),i=new b.CustomEvent(o.MEDIA_VOLUME_REQUEST,{composed:!0,bubbles:!0,detail:r}),this.dispatchEvent(i);break}case`ArrowDown`:{let e=this.hasAttribute(R.KEYBOARD_DOWN_VOLUME_STEP)?+this.getAttribute(R.KEYBOARD_DOWN_VOLUME_STEP):Lr;r=Math.max((this.mediaStore.getState().mediaVolume??1)-e,0),i=new b.CustomEvent(o.MEDIA_VOLUME_REQUEST,{composed:!0,bubbles:!0,detail:r}),this.dispatchEvent(i);break}case`<`:{let e=this.mediaStore.getState().mediaPlaybackRate??1;r=Math.max(e-Rr,zr).toFixed(2),i=new b.CustomEvent(o.MEDIA_PLAYBACK_RATE_REQUEST,{composed:!0,bubbles:!0,detail:r}),this.dispatchEvent(i);break}case`>`:{let e=this.mediaStore.getState().mediaPlaybackRate??1;r=Math.min(e+Rr,Br).toFixed(2),i=new b.CustomEvent(o.MEDIA_PLAYBACK_RATE_REQUEST,{composed:!0,bubbles:!0,detail:r}),this.dispatchEvent(i);break}case`/`:case`?`:e.shiftKey&&yr(this,Nr,Pr).call(this);break;case`p`:n=this.mediaStore.getState().mediaIsPip?o.MEDIA_EXIT_PIP_REQUEST:o.MEDIA_ENTER_PIP_REQUEST,i=new b.CustomEvent(n,{composed:!0,bubbles:!0}),this.dispatchEvent(i)}}};br=new WeakMap,xr=new WeakMap,I=new WeakMap,L=new WeakMap,Sr=new WeakMap,Cr=new WeakMap,wr=new WeakMap,Tr=new WeakMap,Er=new WeakSet,Dr=function(){this.mediaStore=gr({media:this.media,fullscreenElement:this.fullscreenElement,options:{defaultSubtitles:this.hasAttribute(R.DEFAULT_SUBTITLES),defaultDuration:this.hasAttribute(R.DEFAULT_DURATION)?+this.getAttribute(R.DEFAULT_DURATION):void 0,defaultStreamType:this.getAttribute(R.DEFAULT_STREAM_TYPE)??void 0,liveEdgeOffset:this.hasAttribute(R.LIVE_EDGE_OFFSET)?+this.getAttribute(R.LIVE_EDGE_OFFSET):void 0,seekToLiveOffset:this.hasAttribute(R.SEEK_TO_LIVE_OFFSET)?+this.getAttribute(R.SEEK_TO_LIVE_OFFSET):this.hasAttribute(R.LIVE_EDGE_OFFSET)?+this.getAttribute(R.LIVE_EDGE_OFFSET):void 0,noAutoSeekToLive:this.hasAttribute(R.NO_AUTO_SEEK_TO_LIVE),noVolumePref:this.hasAttribute(R.NO_VOLUME_PREF),noMutedPref:this.hasAttribute(R.NO_MUTED_PREF),noSubtitlesLangPref:this.hasAttribute(R.NO_SUBTITLES_LANG_PREF)}})},Or=new WeakMap,kr=new WeakSet,Ar=function(e){let{metaKey:t,altKey:n,key:r,shiftKey:i}=e,a=i&&(r===`/`||r===`?`);if(a&&P(this,L)?.open||t||n||!a&&!Fr.includes(r)){this.removeEventListener(`keyup`,P(this,Or));return}let o=e.target,s=o instanceof HTMLElement&&(o.tagName.toLowerCase()===`media-volume-range`||o.tagName.toLowerCase()===`media-time-range`);[` `,`ArrowLeft`,`ArrowRight`,`ArrowUp`,`ArrowDown`].includes(r)&&!P(this,br).contains(un(r))&&!s&&e.preventDefault(),this.addEventListener(`keyup`,P(this,Or),{once:!0})},jr=new WeakSet,Mr=function(){P(this,L)&&(P(this,L).hotkeys=P(this,br).value||void 0,(this.noHotkeys||P(this,br).contains(`noshift+/`))&&(P(this,L).open=!1))},Nr=new WeakSet,Pr=function(){P(this,L)||(vr(this,L,x.createElement(`media-keyboard-shortcuts-dialog`)),yr(this,jr,Mr).call(this),this.appendChild(P(this,L))),P(this,L).open=!0};var Hr=Object.values(u),Ur=Object.values(c),Wr=e=>{var t;let{observedAttributes:n}=e.constructor;!n&&e.nodeName?.includes(`-`)&&(b.customElements.upgrade(e),{observedAttributes:n}=e.constructor);let r=((t=(e?.getAttribute)?.call(e,s.MEDIA_CHROME_ATTRIBUTES))?.split)?.call(t,/\s+/);return Array.isArray(n||r)?(n||r).filter(e=>Hr.includes(e)):[]},Gr=e=>(e.nodeName?.includes(`-`)&&b.customElements.get(e.nodeName?.toLowerCase())&&!(e instanceof b.customElements.get(e.nodeName.toLowerCase()))&&b.customElements.upgrade(e),Ur.some(t=>t in e)),Kr=e=>Gr(e)||!!Wr(e).length,qr=e=>(e?.join)?.call(e,`:`),Jr={[u.MEDIA_SUBTITLES_LIST]:jn,[u.MEDIA_SUBTITLES_SHOWING]:jn,[u.MEDIA_SEEKABLE]:qr,[u.MEDIA_BUFFERED]:e=>e?.map(qr).join(` `),[u.MEDIA_PREVIEW_COORDS]:e=>e?.join(` `),[u.MEDIA_RENDITION_LIST]:te,[u.MEDIA_AUDIO_TRACK_LIST]:re},Yr=async(e,t,n)=>{if(e.isConnected||await oe(0),typeof n==`boolean`||n==null)return E(e,t,n);if(typeof n==`number`)return w(e,t,n);if(typeof n==`string`)return O(e,t,n);if(Array.isArray(n)&&!n.length)return e.removeAttribute(t);let r=Jr[t]?.call(Jr,n)??n;return e.setAttribute(t,r)},Xr=e=>!!e.closest?.call(e,`*[slot="media"]`),Zr=(e,t)=>{if(Xr(e))return;let n=(e,t)=>{Kr(e)&&t(e);let{children:n=[]}=e??{},r=e?.shadowRoot?.children??[];[...n,...r].forEach(e=>Zr(e,t))},r=e?.nodeName.toLowerCase();r.includes(`-`)&&!Kr(e)?b.customElements.whenDefined(r).then(()=>{n(e,t)}):n(e,t)},Qr=(e,t,n)=>{e.forEach(e=>{if(t in e){e[t]=n;return}let r=Wr(e),i=t.toLowerCase();r.includes(i)&&Yr(e,i,n)})},$r=(e,t,n)=>{Zr(e,t);let r=e=>{t(e?.composedPath()[0]??e.target)},i=e=>{n(e?.composedPath()[0]??e.target)};e.addEventListener(o.REGISTER_MEDIA_STATE_RECEIVER,r),e.addEventListener(o.UNREGISTER_MEDIA_STATE_RECEIVER,i);let a=e=>{e.forEach(e=>{let{addedNodes:r=[],removedNodes:i=[],type:a,target:o,attributeName:c}=e;a===`childList`?(Array.prototype.forEach.call(r,e=>Zr(e,t)),Array.prototype.forEach.call(i,e=>Zr(e,n))):a===`attributes`&&c===s.MEDIA_CHROME_ATTRIBUTES&&(Kr(o)?t(o):n(o))})},c=[],l=e=>{let r=e.target;r.name!==`media`&&(c.forEach(e=>Zr(e,n)),c=[...r.assignedElements({flatten:!0})],c.forEach(e=>Zr(e,t)))};e.addEventListener(`slotchange`,l);let u=new MutationObserver(a);return u.observe(e,{childList:!0,attributes:!0,subtree:!0}),()=>{Zr(e,n),e.removeEventListener(`slotchange`,l),u.disconnect(),e.removeEventListener(o.REGISTER_MEDIA_STATE_RECEIVER,r),e.removeEventListener(o.UNREGISTER_MEDIA_STATE_RECEIVER,i)}};b.customElements.get(`media-controller`)||b.customElements.define(`media-controller`,Vr);var ei=Vr,ti={PLACEMENT:`placement`,BOUNDS:`bounds`};function ni(e){return`
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
  `}var ri=class extends b.HTMLElement{constructor(){if(super(),this.updateXOffset=()=>{if(!Ve(this,{checkOpacity:!1,checkVisibilityCSS:!1}))return;let e=this.placement;if(e===`left`||e===`right`){this.style.removeProperty(`--media-tooltip-offset-x`);return}let t=getComputedStyle(this),n=Re(this,`#`+this.bounds)??Me(this);if(!n)return;let{x:r,width:i}=n.getBoundingClientRect(),{x:a,width:o}=this.getBoundingClientRect(),s=a+o,c=r+i,l=t.getPropertyValue(`--media-tooltip-offset-x`),u=l?parseFloat(l.replace(`px`,``)):0,d=t.getPropertyValue(`--media-tooltip-container-margin`),f=d?parseFloat(d.replace(`px`,``)):0,p=a-r+u-f,m=s-c+u+f;p<0?this.style.setProperty(`--media-tooltip-offset-x`,`${p}px`):m>0?this.style.setProperty(`--media-tooltip-offset-x`,`${m}px`):this.style.removeProperty(`--media-tooltip-offset-x`)},!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=je(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}if(this.arrowEl=this.shadowRoot.querySelector(`#arrow`),Object.prototype.hasOwnProperty.call(this,`placement`)){let e=this.placement;delete this.placement,this.placement=e}}static get observedAttributes(){return[ti.PLACEMENT,ti.BOUNDS]}get placement(){return D(this,ti.PLACEMENT)}set placement(e){O(this,ti.PLACEMENT,e)}get bounds(){return D(this,ti.BOUNDS)}set bounds(e){O(this,ti.BOUNDS,e)}};ri.shadowRootOptions={mode:`open`},ri.getTemplateHTML=ni,b.customElements.get(`media-tooltip`)||b.customElements.define(`media-tooltip`,ri);var ii=ri,ai=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},z=(e,t,n)=>(ai(e,t,`read from private field`),n?n.call(e):t.get(e)),oi=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},si=(e,t,n,r)=>(ai(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),ci=(e,t,n)=>(ai(e,t,`access private method`),n),li,ui,di,fi,pi,mi,hi,gi,_i,vi={TOOLTIP_PLACEMENT:`tooltipplacement`,DISABLED:`disabled`,NO_TOOLTIP:`notooltip`};function yi(e,t={}){return`
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
        <template shadowrootmode="${ii.shadowRootOptions.mode}">
          ${ii.getTemplateHTML({})}
        </template>
        <slot name="tooltip-content">
          ${this.getTooltipContentHTML(e)}
        </slot>
      </media-tooltip>
    </slot>
  `}function bi(e,t){return`
    <slot></slot>
  `}function xi(){return``}var B=class extends b.HTMLElement{constructor(){if(super(),oi(this,di),oi(this,gi),oi(this,li,void 0),this.preventClick=!1,this.tooltipEl=null,oi(this,ui,e=>{this.preventClick||this.handleClick(e),setTimeout(z(this,pi),0)}),oi(this,pi,()=>{var e,t;(t=(e=this.tooltipEl)?.updateXOffset)==null||t.call(e)}),oi(this,mi,e=>{let{key:t}=e;this.keysUsed.includes(t)?this.preventClick||this.handleClick(e):this.removeEventListener(`keyup`,z(this,mi))}),oi(this,hi,e=>{let{metaKey:t,altKey:n,key:r}=e;t||n||!this.keysUsed.includes(r)?this.removeEventListener(`keyup`,z(this,mi)):this.addEventListener(`keyup`,z(this,mi),{once:!0})}),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=je(this.attributes),t=this.constructor.getTemplateHTML(e);this.shadowRoot.setHTMLUnsafe?this.shadowRoot.setHTMLUnsafe(t):this.shadowRoot.innerHTML=t}this.tooltipEl=this.shadowRoot.querySelector(`media-tooltip`)}static get observedAttributes(){return[`disabled`,vi.TOOLTIP_PLACEMENT,s.MEDIA_CONTROLLER,u.MEDIA_LANG]}enable(){this.addEventListener(`click`,z(this,ui)),this.addEventListener(`keydown`,z(this,hi)),this.tabIndex=0}disable(){this.removeEventListener(`click`,z(this,ui)),this.removeEventListener(`keydown`,z(this,hi)),this.removeEventListener(`keyup`,z(this,mi)),this.tabIndex=-1}attributeChangedCallback(e,t,n){var r,i,a,o;e===s.MEDIA_CONTROLLER?(t&&((i=(r=z(this,li))?.unassociateElement)==null||i.call(r,this),si(this,li,null)),n&&this.isConnected&&(si(this,li,this.getRootNode()?.getElementById(n)),(o=(a=z(this,li))?.associateElement)==null||o.call(a,this))):e===`disabled`&&n!==t?n==null?this.enable():this.disable():e===vi.TOOLTIP_PLACEMENT&&this.tooltipEl&&n!==t?this.tooltipEl.placement=n:e===u.MEDIA_LANG&&(this.shadowRoot.querySelector(`slot[name="tooltip-content"]`).innerHTML=this.constructor.getTooltipContentHTML()),ci(this,di,fi).call(this)&&z(this,pi).call(this)}connectedCallback(){var e,t;let{style:n}=S(this.shadowRoot,`:host`);n.setProperty(`display`,`var(--media-control-display, var(--${this.localName}-display, inline-flex))`),this.hasAttribute(`disabled`)?this.disable():this.enable(),this.setAttribute(`role`,`button`);let r=this.getAttribute(s.MEDIA_CONTROLLER);r&&(si(this,li,this.getRootNode()?.getElementById(r)),(t=(e=z(this,li))?.associateElement)==null||t.call(e,this)),b.customElements.whenDefined(`media-tooltip`).then(()=>ci(this,gi,_i).call(this))}disconnectedCallback(){var e,t;this.disable(),(t=(e=z(this,li))?.unassociateElement)==null||t.call(e,this),si(this,li,null),this.removeEventListener(`mouseenter`,z(this,pi)),this.removeEventListener(`focus`,z(this,pi)),this.removeEventListener(`click`,z(this,ui))}get keysUsed(){return[`Enter`,` `]}get tooltipPlacement(){return D(this,vi.TOOLTIP_PLACEMENT)}set tooltipPlacement(e){O(this,vi.TOOLTIP_PLACEMENT,e)}get mediaController(){return D(this,s.MEDIA_CONTROLLER)}set mediaController(e){O(this,s.MEDIA_CONTROLLER,e)}get disabled(){return T(this,vi.DISABLED)}set disabled(e){E(this,vi.DISABLED,e)}get noTooltip(){return T(this,vi.NO_TOOLTIP)}set noTooltip(e){E(this,vi.NO_TOOLTIP,e)}handleClick(e){}};li=new WeakMap,ui=new WeakMap,di=new WeakSet,fi=function(){try{return this.matches(`:hover, :focus-visible`)}catch{return this.matches(`:hover, :focus`)}},pi=new WeakMap,mi=new WeakMap,hi=new WeakMap,gi=new WeakSet,_i=function(){this.addEventListener(`mouseenter`,z(this,pi)),this.addEventListener(`focus`,z(this,pi)),this.addEventListener(`click`,z(this,ui));let e=this.tooltipPlacement;e&&this.tooltipEl&&(this.tooltipEl.placement=e)},B.shadowRootOptions={mode:`open`},B.getTemplateHTML=yi,B.getSlotTemplateHTML=bi,B.getTooltipContentHTML=xi,b.customElements.get(`media-chrome-button`)||b.customElements.define(`media-chrome-button`,B);var Si=B,Ci=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M22.13 3H3.87a.87.87 0 0 0-.87.87v13.26a.87.87 0 0 0 .87.87h3.4L9 16H5V5h16v11h-4l1.72 2h3.4a.87.87 0 0 0 .87-.87V3.87a.87.87 0 0 0-.86-.87Zm-8.75 11.44a.5.5 0 0 0-.76 0l-4.91 5.73a.5.5 0 0 0 .38.83h9.82a.501.501 0 0 0 .38-.83l-4.91-5.73Z"/>
</svg>
`;function wi(e){return`
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
      <slot name="enter">${Ci}</slot>
      <slot name="exit">${Ci}</slot>
    </slot>
  `}function Ti(){return`
    <slot name="tooltip-enter">${y(`start airplay`)}</slot>
    <slot name="tooltip-exit">${y(`stop airplay`)}</slot>
  `}var Ei=e=>{let t=e.mediaIsAirplaying?y(`stop airplay`):y(`start airplay`);e.setAttribute(`aria-label`,t)},Di=class extends B{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_IS_AIRPLAYING,u.MEDIA_AIRPLAY_UNAVAILABLE]}connectedCallback(){super.connectedCallback(),Ei(this)}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),e===u.MEDIA_IS_AIRPLAYING&&Ei(this)}get mediaIsAirplaying(){return T(this,u.MEDIA_IS_AIRPLAYING)}set mediaIsAirplaying(e){E(this,u.MEDIA_IS_AIRPLAYING,e)}get mediaAirplayUnavailable(){return D(this,u.MEDIA_AIRPLAY_UNAVAILABLE)}set mediaAirplayUnavailable(e){O(this,u.MEDIA_AIRPLAY_UNAVAILABLE,e)}handleClick(){let e=new b.CustomEvent(o.MEDIA_AIRPLAY_REQUEST,{composed:!0,bubbles:!0});this.dispatchEvent(e)}};Di.getSlotTemplateHTML=wi,Di.getTooltipContentHTML=Ti,b.customElements.get(`media-airplay-button`)||b.customElements.define(`media-airplay-button`,Di);var Oi=Di,ki=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M22.83 5.68a2.58 2.58 0 0 0-2.3-2.5c-3.62-.24-11.44-.24-15.06 0a2.58 2.58 0 0 0-2.3 2.5c-.23 4.21-.23 8.43 0 12.64a2.58 2.58 0 0 0 2.3 2.5c3.62.24 11.44.24 15.06 0a2.58 2.58 0 0 0 2.3-2.5c.23-4.21.23-8.43 0-12.64Zm-11.39 9.45a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.92 3.92 0 0 1 .92-2.77 3.18 3.18 0 0 1 2.43-1 2.94 2.94 0 0 1 2.13.78c.364.359.62.813.74 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.17 1.61 1.61 0 0 0-1.29.58 2.79 2.79 0 0 0-.5 1.89 3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.48 1.48 0 0 0 1-.37 2.1 2.1 0 0 0 .59-1.14l1.4.44a3.23 3.23 0 0 1-1.07 1.69Zm7.22 0a3.07 3.07 0 0 1-1.91.57 3.06 3.06 0 0 1-2.34-1 3.75 3.75 0 0 1-.92-2.67 3.88 3.88 0 0 1 .93-2.77 3.14 3.14 0 0 1 2.42-1 3 3 0 0 1 2.16.82 2.8 2.8 0 0 1 .73 1.31l-1.43.35a1.49 1.49 0 0 0-1.51-1.21 1.61 1.61 0 0 0-1.29.58A2.79 2.79 0 0 0 15 12a3 3 0 0 0 .49 1.93 1.61 1.61 0 0 0 1.27.58 1.44 1.44 0 0 0 1-.37 2.1 2.1 0 0 0 .6-1.15l1.4.44a3.17 3.17 0 0 1-1.1 1.7Z"/>
</svg>`,Ai=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M17.73 14.09a1.4 1.4 0 0 1-1 .37 1.579 1.579 0 0 1-1.27-.58A3 3 0 0 1 15 12a2.8 2.8 0 0 1 .5-1.85 1.63 1.63 0 0 1 1.29-.57 1.47 1.47 0 0 1 1.51 1.2l1.43-.34A2.89 2.89 0 0 0 19 9.07a3 3 0 0 0-2.14-.78 3.14 3.14 0 0 0-2.42 1 3.91 3.91 0 0 0-.93 2.78 3.74 3.74 0 0 0 .92 2.66 3.07 3.07 0 0 0 2.34 1 3.07 3.07 0 0 0 1.91-.57 3.17 3.17 0 0 0 1.07-1.74l-1.4-.45c-.083.43-.3.822-.62 1.12Zm-7.22 0a1.43 1.43 0 0 1-1 .37 1.58 1.58 0 0 1-1.27-.58A3 3 0 0 1 7.76 12a2.8 2.8 0 0 1 .5-1.85 1.63 1.63 0 0 1 1.29-.57 1.47 1.47 0 0 1 1.51 1.2l1.43-.34a2.81 2.81 0 0 0-.74-1.32 2.94 2.94 0 0 0-2.13-.78 3.18 3.18 0 0 0-2.43 1 4 4 0 0 0-.92 2.78 3.74 3.74 0 0 0 .92 2.66 3.07 3.07 0 0 0 2.34 1 3.07 3.07 0 0 0 1.91-.57 3.23 3.23 0 0 0 1.07-1.74l-1.4-.45a2.06 2.06 0 0 1-.6 1.07Zm12.32-8.41a2.59 2.59 0 0 0-2.3-2.51C18.72 3.05 15.86 3 13 3c-2.86 0-5.72.05-7.53.17a2.59 2.59 0 0 0-2.3 2.51c-.23 4.207-.23 8.423 0 12.63a2.57 2.57 0 0 0 2.3 2.5c1.81.13 4.67.19 7.53.19 2.86 0 5.72-.06 7.53-.19a2.57 2.57 0 0 0 2.3-2.5c.23-4.207.23-8.423 0-12.63Zm-1.49 12.53a1.11 1.11 0 0 1-.91 1.11c-1.67.11-4.45.18-7.43.18-2.98 0-5.76-.07-7.43-.18a1.11 1.11 0 0 1-.91-1.11c-.21-4.14-.21-8.29 0-12.43a1.11 1.11 0 0 1 .91-1.11C7.24 4.56 10 4.49 13 4.49s5.76.07 7.43.18a1.11 1.11 0 0 1 .91 1.11c.21 4.14.21 8.29 0 12.43Z"/>
</svg>`;function ji(e){return`
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
      <slot name="on">${ki}</slot>
      <slot name="off">${Ai}</slot>
    </slot>
  `}function Mi(){return`
    <slot name="tooltip-enable">${y(`Enable captions`)}</slot>
    <slot name="tooltip-disable">${y(`Disable captions`)}</slot>
  `}var Ni=e=>{e.setAttribute(`aria-checked`,In(e).toString())},Pi=class extends B{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_SUBTITLES_LIST,u.MEDIA_SUBTITLES_SHOWING]}connectedCallback(){super.connectedCallback(),this.setAttribute(`role`,`button`),this.setAttribute(`aria-label`,y(`closed captions`)),Ni(this)}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),e===u.MEDIA_SUBTITLES_SHOWING&&Ni(this)}get mediaSubtitlesList(){return Fi(this,u.MEDIA_SUBTITLES_LIST)}set mediaSubtitlesList(e){Ii(this,u.MEDIA_SUBTITLES_LIST,e)}get mediaSubtitlesShowing(){return Fi(this,u.MEDIA_SUBTITLES_SHOWING)}set mediaSubtitlesShowing(e){Ii(this,u.MEDIA_SUBTITLES_SHOWING,e)}handleClick(){this.dispatchEvent(new b.CustomEvent(o.MEDIA_TOGGLE_SUBTITLES_REQUEST,{composed:!0,bubbles:!0}))}};Pi.getSlotTemplateHTML=ji,Pi.getTooltipContentHTML=Mi;var Fi=(e,t)=>{let n=e.getAttribute(t);return n?On(n):[]},Ii=(e,t,n)=>{if(!n?.length){e.removeAttribute(t);return}let r=jn(n);e.getAttribute(t)!==r&&e.setAttribute(t,r)};b.customElements.get(`media-captions-button`)||b.customElements.define(`media-captions-button`,Pi);var Li=Pi,Ri=`<svg aria-hidden="true" viewBox="0 0 24 24"><g><path class="cast_caf_icon_arch0" d="M1,18 L1,21 L4,21 C4,19.3 2.66,18 1,18 L1,18 Z"/><path class="cast_caf_icon_arch1" d="M1,14 L1,16 C3.76,16 6,18.2 6,21 L8,21 C8,17.13 4.87,14 1,14 L1,14 Z"/><path class="cast_caf_icon_arch2" d="M1,10 L1,12 C5.97,12 10,16.0 10,21 L12,21 C12,14.92 7.07,10 1,10 L1,10 Z"/><path class="cast_caf_icon_box" d="M21,3 L3,3 C1.9,3 1,3.9 1,5 L1,8 L3,8 L3,5 L21,5 L21,19 L14,19 L14,21 L21,21 C22.1,21 23,20.1 23,19 L23,5 C23,3.9 22.1,3 21,3 L21,3 Z"/></g></svg>`,zi=`<svg aria-hidden="true" viewBox="0 0 24 24"><g><path class="cast_caf_icon_arch0" d="M1,18 L1,21 L4,21 C4,19.3 2.66,18 1,18 L1,18 Z"/><path class="cast_caf_icon_arch1" d="M1,14 L1,16 C3.76,16 6,18.2 6,21 L8,21 C8,17.13 4.87,14 1,14 L1,14 Z"/><path class="cast_caf_icon_arch2" d="M1,10 L1,12 C5.97,12 10,16.0 10,21 L12,21 C12,14.92 7.07,10 1,10 L1,10 Z"/><path class="cast_caf_icon_box" d="M21,3 L3,3 C1.9,3 1,3.9 1,5 L1,8 L3,8 L3,5 L21,5 L21,19 L14,19 L14,21 L21,21 C22.1,21 23,20.1 23,19 L23,5 C23,3.9 22.1,3 21,3 L21,3 Z"/><path class="cast_caf_icon_boxfill" d="M5,7 L5,8.63 C8,8.6 13.37,14 13.37,17 L19,17 L19,7 Z"/></g></svg>`;function Bi(e){return`
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
      <slot name="enter">${Ri}</slot>
      <slot name="exit">${zi}</slot>
    </slot>
  `}function Vi(){return`
    <slot name="tooltip-enter">${y(`Start casting`)}</slot>
    <slot name="tooltip-exit">${y(`Stop casting`)}</slot>
  `}var Hi=e=>{let t=e.mediaIsCasting?y(`stop casting`):y(`start casting`);e.setAttribute(`aria-label`,t)},Ui=class extends B{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_IS_CASTING,u.MEDIA_CAST_UNAVAILABLE]}connectedCallback(){super.connectedCallback(),Hi(this)}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),e===u.MEDIA_IS_CASTING&&Hi(this)}get mediaIsCasting(){return T(this,u.MEDIA_IS_CASTING)}set mediaIsCasting(e){E(this,u.MEDIA_IS_CASTING,e)}get mediaCastUnavailable(){return D(this,u.MEDIA_CAST_UNAVAILABLE)}set mediaCastUnavailable(e){O(this,u.MEDIA_CAST_UNAVAILABLE,e)}handleClick(){let e=this.mediaIsCasting?o.MEDIA_EXIT_CAST_REQUEST:o.MEDIA_ENTER_CAST_REQUEST;this.dispatchEvent(new b.CustomEvent(e,{composed:!0,bubbles:!0}))}};Ui.getSlotTemplateHTML=Bi,Ui.getTooltipContentHTML=Vi,b.customElements.get(`media-cast-button`)||b.customElements.define(`media-cast-button`,Ui);var Wi=Ui,Gi=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},V=(e,t,n)=>(Gi(e,t,`read from private field`),n?n.call(e):t.get(e)),H=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},Ki=(e,t,n,r)=>(Gi(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),qi=(e,t,n)=>(Gi(e,t,`access private method`),n),Ji,Yi,Xi,Zi,Qi,$i,ea,ta,na,ra,ia,aa,oa,sa,ca,la,ua,da,fa,pa,ma,ha,ga,_a,va;function ya(e){return`
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
  `}function ba(e){return``}var xa=class extends b.HTMLElement{constructor(){if(super(),H(this,ra),H(this,aa),H(this,sa),H(this,la),H(this,da),H(this,pa),H(this,ha),H(this,_a),H(this,Ji,void 0),H(this,Yi,void 0),H(this,Xi,void 0),H(this,Zi,void 0),H(this,Qi,{}),H(this,$i,[]),H(this,ea,()=>{if(this.range.matches(`:focus-visible`)){let{style:e}=S(this.shadowRoot,`:host`);e.setProperty(`--_focus-visible-box-shadow`,`var(--_focus-box-shadow)`)}}),H(this,ta,()=>{let{style:e}=S(this.shadowRoot,`:host`);e.removeProperty(`--_focus-visible-box-shadow`)}),H(this,na,()=>{let e=this.shadowRoot.querySelector(`#segments-clipping`);e&&e.parentNode.append(e)}),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=je(this.attributes),t=this.constructor.getTemplateHTML(e);this.shadowRoot.setHTMLUnsafe?this.shadowRoot.setHTMLUnsafe(t):this.shadowRoot.innerHTML=t}this.container=this.shadowRoot.querySelector(`#container`),Ki(this,Xi,this.shadowRoot.querySelector(`#startpoint`)),Ki(this,Zi,this.shadowRoot.querySelector(`#endpoint`)),this.range=this.shadowRoot.querySelector(`#range`),this.appearance=this.shadowRoot.querySelector(`#appearance`)}static get observedAttributes(){return[`disabled`,`aria-disabled`,s.MEDIA_CONTROLLER]}attributeChangedCallback(e,t,n){var r,i,a,o;e===s.MEDIA_CONTROLLER?(t&&((i=(r=V(this,Ji))?.unassociateElement)==null||i.call(r,this),Ki(this,Ji,null)),n&&this.isConnected&&(Ki(this,Ji,this.getRootNode()?.getElementById(n)),(o=(a=V(this,Ji))?.associateElement)==null||o.call(a,this))):(e===`disabled`||e===`aria-disabled`&&t!==n)&&(n==null?(this.range.removeAttribute(e),qi(this,aa,oa).call(this)):(this.range.setAttribute(e,n),qi(this,sa,ca).call(this)))}connectedCallback(){var e,t;let{style:n}=S(this.shadowRoot,`:host`);n.setProperty(`display`,`var(--media-control-display, var(--${this.localName}-display, inline-flex))`),V(this,Qi).pointer=S(this.shadowRoot,`#pointer`),V(this,Qi).progress=S(this.shadowRoot,`#progress`),V(this,Qi).thumb=S(this.shadowRoot,`#thumb, ::slotted([slot="thumb"])`),V(this,Qi).activeSegment=S(this.shadowRoot,`#segments-clipping rect:nth-child(0)`);let r=this.getAttribute(s.MEDIA_CONTROLLER);r&&(Ki(this,Ji,this.getRootNode()?.getElementById(r)),(t=(e=V(this,Ji))?.associateElement)==null||t.call(e,this)),this.updateBar(),this.shadowRoot.addEventListener(`focusin`,V(this,ea)),this.shadowRoot.addEventListener(`focusout`,V(this,ta)),qi(this,aa,oa).call(this),ke(this.container,V(this,na))}disconnectedCallback(){var e,t;qi(this,sa,ca).call(this),(t=(e=V(this,Ji))?.unassociateElement)==null||t.call(e,this),Ki(this,Ji,null),this.shadowRoot.removeEventListener(`focusin`,V(this,ea)),this.shadowRoot.removeEventListener(`focusout`,V(this,ta)),Ae(this.container,V(this,na))}updatePointerBar(e){var t;(t=V(this,Qi).pointer)==null||t.style.setProperty(`width`,`${this.getPointerRatio(e)*100}%`)}updateBar(){var e,t;let n=this.range.valueAsNumber*100;(e=V(this,Qi).progress)==null||e.style.setProperty(`width`,`${n}%`),(t=V(this,Qi).thumb)==null||t.style.setProperty(`left`,`${n}%`)}updateSegments(e){let t=this.shadowRoot.querySelector(`#segments-clipping`);if(t.textContent=``,this.container.classList.toggle(`segments`,!!e?.length),!e?.length)return;let n=[...new Set([+this.range.min,...e.flatMap(e=>[e.start,e.end]),+this.range.max])];Ki(this,$i,[...n]);let r=n.pop();for(let[e,i]of n.entries()){let[a,o]=[e===0,e===n.length-1],s=a?`calc(var(--segments-gap) / -1)`:`${i*100}%`,c=`calc(${((o?r:n[e+1])-i)*100}%${a||o?``:` - var(--segments-gap)`})`,l=x.createElementNS(`http://www.w3.org/2000/svg`,`rect`),u=We(this.shadowRoot,`#segments-clipping rect:nth-child(${e+1})`);u.style.setProperty(`x`,s),u.style.setProperty(`width`,c),t.append(l)}}getPointerRatio(e){return He(e.clientX,e.clientY,V(this,Xi).getBoundingClientRect(),V(this,Zi).getBoundingClientRect())}get dragging(){return this.hasAttribute(`dragging`)}handleEvent(e){switch(e.type){case`pointermove`:qi(this,_a,va).call(this,e);break;case`input`:this.updateBar();break;case`pointerenter`:qi(this,da,fa).call(this,e);break;case`pointerdown`:qi(this,la,ua).call(this,e);break;case`pointerup`:qi(this,pa,ma).call(this);break;case`pointerleave`:qi(this,ha,ga).call(this)}}get keysUsed(){return[`ArrowUp`,`ArrowRight`,`ArrowDown`,`ArrowLeft`]}};Ji=new WeakMap,Yi=new WeakMap,Xi=new WeakMap,Zi=new WeakMap,Qi=new WeakMap,$i=new WeakMap,ea=new WeakMap,ta=new WeakMap,na=new WeakMap,ra=new WeakSet,ia=function(e){let t=V(this,Qi).activeSegment;if(!t)return;let n=this.getPointerRatio(e),r=`#segments-clipping rect:nth-child(${V(this,$i).findIndex((e,t,r)=>{let i=r[t+1];return i!=null&&n>=e&&n<=i})+1})`;t.selectorText==r&&t.style.transform||(t.selectorText=r,t.style.setProperty(`transform`,`var(--media-range-segment-hover-transform, scaleY(2))`))},aa=new WeakSet,oa=function(){!this.hasAttribute(`disabled`)&&this.isConnected&&(this.addEventListener(`input`,this),this.addEventListener(`pointerdown`,this),this.addEventListener(`pointerenter`,this))},sa=new WeakSet,ca=function(){var e,t;this.removeEventListener(`input`,this),this.removeEventListener(`pointerdown`,this),this.removeEventListener(`pointerenter`,this),this.removeEventListener(`pointerleave`,this),(e=b.window)==null||e.removeEventListener(`pointerup`,this),(t=b.window)==null||t.removeEventListener(`pointermove`,this)},la=new WeakSet,ua=function(e){var t;Ki(this,Yi,e.composedPath().includes(this.range)),(t=b.window)==null||t.addEventListener(`pointerup`,this,{once:!0})},da=new WeakSet,fa=function(e){var t;e.pointerType!==`mouse`&&qi(this,la,ua).call(this,e),this.addEventListener(`pointerleave`,this,{once:!0}),(t=b.window)==null||t.addEventListener(`pointermove`,this)},pa=new WeakSet,ma=function(){var e;(e=b.window)==null||e.removeEventListener(`pointerup`,this),this.toggleAttribute(`dragging`,!1),this.range.disabled=this.hasAttribute(`disabled`)},ha=new WeakSet,ga=function(){var e,t;this.removeEventListener(`pointerleave`,this),(e=b.window)==null||e.removeEventListener(`pointermove`,this),this.toggleAttribute(`dragging`,!1),this.range.disabled=this.hasAttribute(`disabled`),(t=V(this,Qi).activeSegment)==null||t.style.removeProperty(`transform`)},_a=new WeakSet,va=function(e){(e.pointerType!==`pen`||e.buttons!==0)&&(this.toggleAttribute(`dragging`,e.buttons===1||e.pointerType!==`mouse`),this.updatePointerBar(e),qi(this,ra,ia).call(this,e),this.dragging&&(e.pointerType!==`mouse`||!V(this,Yi))&&(this.range.disabled=!0,this.range.valueAsNumber=this.getPointerRatio(e),this.range.dispatchEvent(new Event(`input`,{bubbles:!0,composed:!0}))))},xa.shadowRootOptions={mode:`open`},xa.getTemplateHTML=ya,xa.getContainerTemplateHTML=ba,b.customElements.get(`media-chrome-range`)||b.customElements.define(`media-chrome-range`,xa);var Sa=xa,Ca=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},wa=(e,t,n)=>(Ca(e,t,`read from private field`),n?n.call(e):t.get(e)),Ta=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},Ea=(e,t,n,r)=>(Ca(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Da;function Oa(e){return`
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
  `}var ka=class extends b.HTMLElement{constructor(){if(super(),Ta(this,Da,void 0),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=je(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}}static get observedAttributes(){return[s.MEDIA_CONTROLLER]}attributeChangedCallback(e,t,n){var r,i,a,o;e===s.MEDIA_CONTROLLER&&(t&&((i=(r=wa(this,Da))?.unassociateElement)==null||i.call(r,this),Ea(this,Da,null)),n&&this.isConnected&&(Ea(this,Da,this.getRootNode()?.getElementById(n)),(o=(a=wa(this,Da))?.associateElement)==null||o.call(a,this)))}connectedCallback(){var e,t;let n=this.getAttribute(s.MEDIA_CONTROLLER);n&&(Ea(this,Da,this.getRootNode()?.getElementById(n)),(t=(e=wa(this,Da))?.associateElement)==null||t.call(e,this))}disconnectedCallback(){var e,t;(t=(e=wa(this,Da))?.unassociateElement)==null||t.call(e,this),Ea(this,Da,null)}};Da=new WeakMap,ka.shadowRootOptions={mode:`open`},ka.getTemplateHTML=Oa,b.customElements.get(`media-control-bar`)||b.customElements.define(`media-control-bar`,ka);var Aa=ka,ja=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},Ma=(e,t,n)=>(ja(e,t,`read from private field`),n?n.call(e):t.get(e)),Na=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},Pa=(e,t,n,r)=>(ja(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Fa;function Ia(e,t={}){return`
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
  `}function La(e,t){return`
    <slot></slot>
  `}var Ra=class extends b.HTMLElement{constructor(){if(super(),Na(this,Fa,void 0),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=je(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}}static get observedAttributes(){return[s.MEDIA_CONTROLLER]}attributeChangedCallback(e,t,n){var r,i,a,o;e===s.MEDIA_CONTROLLER&&(t&&((i=(r=Ma(this,Fa))?.unassociateElement)==null||i.call(r,this),Pa(this,Fa,null)),n&&this.isConnected&&(Pa(this,Fa,this.getRootNode()?.getElementById(n)),(o=(a=Ma(this,Fa))?.associateElement)==null||o.call(a,this)))}connectedCallback(){var e,t;let{style:n}=S(this.shadowRoot,`:host`);n.setProperty(`display`,`var(--media-control-display, var(--${this.localName}-display, inline-flex))`);let r=this.getAttribute(s.MEDIA_CONTROLLER);r&&(Pa(this,Fa,this.getRootNode()?.getElementById(r)),(t=(e=Ma(this,Fa))?.associateElement)==null||t.call(e,this))}disconnectedCallback(){var e,t;(t=(e=Ma(this,Fa))?.unassociateElement)==null||t.call(e,this),Pa(this,Fa,null)}};Fa=new WeakMap,Ra.shadowRootOptions={mode:`open`},Ra.getTemplateHTML=Ia,Ra.getSlotTemplateHTML=La,b.customElements.get(`media-text-display`)||b.customElements.define(`media-text-display`,Ra);var za=Ra,Ba=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},Va=(e,t,n)=>(Ba(e,t,`read from private field`),n?n.call(e):t.get(e)),Ha=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},Ua=(e,t,n,r)=>(Ba(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Wa;function Ga(e,t){return`
    <slot>${_e(t.mediaDuration)}</slot>
  `}var Ka=class extends Ra{constructor(){super(),Ha(this,Wa,void 0),Ua(this,Wa,this.shadowRoot.querySelector(`slot`)),Va(this,Wa).textContent=_e(this.mediaDuration??0)}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_DURATION]}attributeChangedCallback(e,t,n){e===u.MEDIA_DURATION&&(Va(this,Wa).textContent=_e(+n)),super.attributeChangedCallback(e,t,n)}get mediaDuration(){return C(this,u.MEDIA_DURATION)}set mediaDuration(e){w(this,u.MEDIA_DURATION,e)}};Wa=new WeakMap,Ka.getSlotTemplateHTML=Ga,b.customElements.get(`media-duration-display`)||b.customElements.define(`media-duration-display`,Ka);var qa=Ka,Ja={2:y(`Network Error`),3:y(`Decode Error`),4:y(`Source Not Supported`),5:y(`Encryption Error`)},Ya={2:y(`A network error caused the media download to fail.`),3:y(`A media error caused playback to be aborted. The media could be corrupt or your browser does not support this format.`),4:y(`An unsupported error occurred. The server or network failed, or your browser does not support this format.`),5:y(`The media is encrypted and there are no keys to decrypt it.`)},Xa=e=>e.code===1?null:{title:Ja[e.code]??`Error ${e.code}`,message:Ya[e.code]??e.message},Za=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},Qa=(e,t,n)=>(Za(e,t,`read from private field`),n?n.call(e):t.get(e)),$a=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},eo=(e,t,n,r)=>(Za(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),to;function no(e){let t=+e.mediaerrorcode;return`
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
      ${io({code:t,message:e.mediaerrormessage})}
    </slot>
  `}function ro(e){return e.code&&Xa(e)!==null}function io(e){let{title:t,message:n}=Xa(e)??{},r=ce(e.code),i=``;return t&&(i+=`<slot name="error-${r}-title"><h3>${ce(t)}</h3></slot>`),n&&(i+=`<slot name="error-${r}-message"><p>${ce(n)}</p></slot>`),i}var ao=[u.MEDIA_ERROR_CODE,u.MEDIA_ERROR_MESSAGE],oo=class extends en{constructor(){super(...arguments),$a(this,to,null)}static get observedAttributes(){return[...super.observedAttributes,...ao]}formatErrorMessage(e){return this.constructor.formatErrorMessage(e)}attributeChangedCallback(e,t,n){if(super.attributeChangedCallback(e,t,n),!ao.includes(e))return;let r=this.mediaError??{code:this.mediaErrorCode,message:this.mediaErrorMessage};if(this.open=ro(r),this.open&&(this.shadowRoot.querySelector(`slot`).name=`error-${this.mediaErrorCode}`,this.shadowRoot.querySelector(`#content`).innerHTML=this.formatErrorMessage(r),!this.hasAttribute(`aria-label`))){let{title:e}=Xa(r);e&&this.setAttribute(`aria-label`,e)}}get mediaError(){return Qa(this,to)}set mediaError(e){eo(this,to,e)}get mediaErrorCode(){return C(this,`mediaerrorcode`)}set mediaErrorCode(e){w(this,`mediaerrorcode`,e)}get mediaErrorMessage(){return D(this,`mediaerrormessage`)}set mediaErrorMessage(e){O(this,`mediaerrormessage`,e)}};to=new WeakMap,oo.getSlotTemplateHTML=no,oo.formatErrorMessage=io,b.customElements.get(`media-error-dialog`)||b.customElements.define(`media-error-dialog`,oo);var so=oo,co=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},lo=(e,t,n)=>(co(e,t,`read from private field`),n?n.call(e):t.get(e)),uo=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},fo=(e,t,n,r)=>(co(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),po,mo=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M16 3v2.5h3.5V9H22V3h-6ZM4 9h2.5V5.5H10V3H4v6Zm15.5 9.5H16V21h6v-6h-2.5v3.5ZM6.5 15H4v6h6v-2.5H6.5V15Z"/>
</svg>`,ho=`<svg aria-hidden="true" viewBox="0 0 26 24">
  <path d="M18.5 6.5V3H16v6h6V6.5h-3.5ZM16 21h2.5v-3.5H22V15h-6v6ZM4 17.5h3.5V21H10v-6H4v2.5Zm3.5-11H4V9h6V3H7.5v3.5Z"/>
</svg>`;function go(e){return`
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
      <slot name="enter">${mo}</slot>
      <slot name="exit">${ho}</slot>
    </slot>
  `}function _o(){return`
    <slot name="tooltip-enter">${y(`Enter fullscreen mode`)}</slot>
    <slot name="tooltip-exit">${y(`Exit fullscreen mode`)}</slot>
  `}var vo=e=>{let t=e.mediaIsFullscreen?y(`exit fullscreen mode`):y(`enter fullscreen mode`);e.setAttribute(`aria-label`,t)},yo=class extends B{constructor(){super(...arguments),uo(this,po,null)}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_IS_FULLSCREEN,u.MEDIA_FULLSCREEN_UNAVAILABLE]}connectedCallback(){super.connectedCallback(),vo(this)}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),e===u.MEDIA_IS_FULLSCREEN&&vo(this)}get mediaFullscreenUnavailable(){return D(this,u.MEDIA_FULLSCREEN_UNAVAILABLE)}set mediaFullscreenUnavailable(e){O(this,u.MEDIA_FULLSCREEN_UNAVAILABLE,e)}get mediaIsFullscreen(){return T(this,u.MEDIA_IS_FULLSCREEN)}set mediaIsFullscreen(e){E(this,u.MEDIA_IS_FULLSCREEN,e)}handleClick(e){fo(this,po,e);let t=lo(this,po)instanceof PointerEvent,n=this.mediaIsFullscreen?new b.CustomEvent(o.MEDIA_EXIT_FULLSCREEN_REQUEST,{composed:!0,bubbles:!0}):new b.CustomEvent(o.MEDIA_ENTER_FULLSCREEN_REQUEST,{composed:!0,bubbles:!0,detail:t});this.dispatchEvent(n)}};po=new WeakMap,yo.getSlotTemplateHTML=go,yo.getTooltipContentHTML=_o,b.customElements.get(`media-fullscreen-button`)||b.customElements.define(`media-fullscreen-button`,yo);var bo=yo,{MEDIA_TIME_IS_LIVE:xo,MEDIA_PAUSED:So}=u,{MEDIA_SEEK_TO_LIVE_REQUEST:Co,MEDIA_PLAY_REQUEST:wo}=o,To=`<svg viewBox="0 0 6 12" aria-hidden="true"><circle cx="3" cy="6" r="2"></circle></svg>`;function Eo(e){return`
    <style>
      :host { --media-tooltip-display: none; }
      
      slot[name=indicator] > *,
      :host ::slotted([slot=indicator]) {
        
        min-width: auto;
        fill: var(--media-live-button-icon-color, rgb(140, 140, 140));
        color: var(--media-live-button-icon-color, rgb(140, 140, 140));
      }

      :host([${xo}]:not([${So}])) slot[name=indicator] > *,
      :host([${xo}]:not([${So}])) ::slotted([slot=indicator]) {
        fill: var(--media-live-button-indicator-color, rgb(255, 0, 0));
        color: var(--media-live-button-indicator-color, rgb(255, 0, 0));
      }

      :host([${xo}]:not([${So}])) {
        cursor: var(--media-cursor, not-allowed);
      }

      slot[name=text]{
        text-transform: uppercase;
      }

    </style>

    <slot name="indicator">${To}</slot>
    
    <slot name="spacer">&nbsp;</slot><slot name="text">${y(`live`)}</slot>
  `}var Do=e=>{let t=e.mediaPaused||!e.mediaTimeIsLive,n=y(t?`seek to live`:`playing live`);e.setAttribute(`aria-label`,n);let r=e.shadowRoot?.querySelector(`slot[name="text"]`);r&&(r.textContent=y(`live`)),t?e.removeAttribute(`aria-disabled`):e.setAttribute(`aria-disabled`,`true`)},Oo=class extends B{static get observedAttributes(){return[...super.observedAttributes,xo,So]}connectedCallback(){super.connectedCallback(),Do(this)}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),Do(this)}get mediaPaused(){return T(this,u.MEDIA_PAUSED)}set mediaPaused(e){E(this,u.MEDIA_PAUSED,e)}get mediaTimeIsLive(){return T(this,u.MEDIA_TIME_IS_LIVE)}set mediaTimeIsLive(e){E(this,u.MEDIA_TIME_IS_LIVE,e)}handleClick(){(this.mediaPaused||!this.mediaTimeIsLive)&&(this.dispatchEvent(new b.CustomEvent(Co,{composed:!0,bubbles:!0})),this.hasAttribute(So)&&this.dispatchEvent(new b.CustomEvent(wo,{composed:!0,bubbles:!0})))}};Oo.getSlotTemplateHTML=Eo,b.customElements.get(`media-live-button`)||b.customElements.define(`media-live-button`,Oo);var ko=Oo,Ao=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},jo=(e,t,n)=>(Ao(e,t,`read from private field`),n?n.call(e):t.get(e)),Mo=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},No=(e,t,n,r)=>(Ao(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Po,Fo,Io={LOADING_DELAY:`loadingdelay`,NO_AUTOHIDE:`noautohide`},Lo=500,Ro=`
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
`;function zo(e){return`
    <style>
      :host {
        display: var(--media-control-display, var(--media-loading-indicator-display, inline-block));
        vertical-align: middle;
        box-sizing: border-box;
        --_loading-indicator-delay: var(--media-loading-indicator-transition-delay, ${Lo}ms);
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

    <slot name="icon">${Ro}</slot>
    <div id="status" role="status" aria-live="polite">${y(`media loading`)}</div>
  `}var Bo=class extends b.HTMLElement{constructor(){if(super(),Mo(this,Po,void 0),Mo(this,Fo,Lo),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=je(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}}static get observedAttributes(){return[s.MEDIA_CONTROLLER,u.MEDIA_PAUSED,u.MEDIA_LOADING,Io.LOADING_DELAY]}attributeChangedCallback(e,t,n){var r,i,a,o;e===Io.LOADING_DELAY&&t!==n?this.loadingDelay=Number(n):e===s.MEDIA_CONTROLLER&&(t&&((i=(r=jo(this,Po))?.unassociateElement)==null||i.call(r,this),No(this,Po,null)),n&&this.isConnected&&(No(this,Po,this.getRootNode()?.getElementById(n)),(o=(a=jo(this,Po))?.associateElement)==null||o.call(a,this)))}connectedCallback(){var e,t;let n=this.getAttribute(s.MEDIA_CONTROLLER);n&&(No(this,Po,this.getRootNode()?.getElementById(n)),(t=(e=jo(this,Po))?.associateElement)==null||t.call(e,this))}disconnectedCallback(){var e,t;(t=(e=jo(this,Po))?.unassociateElement)==null||t.call(e,this),No(this,Po,null)}get loadingDelay(){return jo(this,Fo)}set loadingDelay(e){No(this,Fo,e);let{style:t}=S(this.shadowRoot,`:host`);t.setProperty(`--_loading-indicator-delay`,`var(--media-loading-indicator-transition-delay, ${e}ms)`)}get mediaPaused(){return T(this,u.MEDIA_PAUSED)}set mediaPaused(e){E(this,u.MEDIA_PAUSED,e)}get mediaLoading(){return T(this,u.MEDIA_LOADING)}set mediaLoading(e){E(this,u.MEDIA_LOADING,e)}get mediaController(){return D(this,s.MEDIA_CONTROLLER)}set mediaController(e){O(this,s.MEDIA_CONTROLLER,e)}get noAutohide(){return T(this,Io.NO_AUTOHIDE)}set noAutohide(e){E(this,Io.NO_AUTOHIDE,e)}};Po=new WeakMap,Fo=new WeakMap,Bo.shadowRootOptions={mode:`open`},Bo.getTemplateHTML=zo,b.customElements.get(`media-loading-indicator`)||b.customElements.define(`media-loading-indicator`,Bo);var Vo=Bo,Ho=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M16.5 12A4.5 4.5 0 0 0 14 8v2.18l2.45 2.45a4.22 4.22 0 0 0 .05-.63Zm2.5 0a6.84 6.84 0 0 1-.54 2.64L20 16.15A8.8 8.8 0 0 0 21 12a9 9 0 0 0-7-8.77v2.06A7 7 0 0 1 19 12ZM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25A6.92 6.92 0 0 1 14 18.7v2.06A9 9 0 0 0 17.69 19l2 2.05L21 19.73l-9-9L4.27 3ZM12 4 9.91 6.09 12 8.18V4Z"/>
</svg>`,Uo=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.47 4.47 0 0 0 2.5-4Z"/>
</svg>`,Wo=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.47 4.47 0 0 0 2.5-4ZM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54Z"/>
</svg>`;function Go(e){return`
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
      <slot name="off">${Ho}</slot>
      <slot name="low">${Uo}</slot>
      <slot name="medium">${Uo}</slot>
      <slot name="high">${Wo}</slot>
    </slot>
  `}function Ko(){return`
    <slot name="tooltip-mute">${y(`Mute`)}</slot>
    <slot name="tooltip-unmute">${y(`Unmute`)}</slot>
  `}var qo=e=>{let t=e.mediaVolumeLevel===`off`?y(`unmute`):y(`mute`);e.setAttribute(`aria-label`,t)},Jo=class extends B{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_VOLUME_LEVEL]}connectedCallback(){super.connectedCallback(),qo(this)}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),e===u.MEDIA_VOLUME_LEVEL&&qo(this)}get mediaVolumeLevel(){return D(this,u.MEDIA_VOLUME_LEVEL)}set mediaVolumeLevel(e){O(this,u.MEDIA_VOLUME_LEVEL,e)}handleClick(){let e=this.mediaVolumeLevel===`off`?o.MEDIA_UNMUTE_REQUEST:o.MEDIA_MUTE_REQUEST;this.dispatchEvent(new b.CustomEvent(e,{composed:!0,bubbles:!0}))}};Jo.getSlotTemplateHTML=Go,Jo.getTooltipContentHTML=Ko,b.customElements.get(`media-mute-button`)||b.customElements.define(`media-mute-button`,Jo);var Yo=Jo,Xo=`<svg aria-hidden="true" viewBox="0 0 28 24">
  <path d="M24 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h20a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1Zm-1 16H5V5h18v14Zm-3-8h-7v5h7v-5Z"/>
</svg>`;function Zo(e){return`
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
      <slot name="enter">${Xo}</slot>
      <slot name="exit">${Xo}</slot>
    </slot>
  `}function Qo(){return`
    <slot name="tooltip-enter">${y(`Enter picture in picture mode`)}</slot>
    <slot name="tooltip-exit">${y(`Exit picture in picture mode`)}</slot>
  `}var $o=e=>{let t=e.mediaIsPip?y(`exit picture in picture mode`):y(`enter picture in picture mode`);e.setAttribute(`aria-label`,t)},es=class extends B{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_IS_PIP,u.MEDIA_PIP_UNAVAILABLE]}connectedCallback(){super.connectedCallback(),$o(this)}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),e===u.MEDIA_IS_PIP&&$o(this)}get mediaPipUnavailable(){return D(this,u.MEDIA_PIP_UNAVAILABLE)}set mediaPipUnavailable(e){O(this,u.MEDIA_PIP_UNAVAILABLE,e)}get mediaIsPip(){return T(this,u.MEDIA_IS_PIP)}set mediaIsPip(e){E(this,u.MEDIA_IS_PIP,e)}handleClick(){let e=this.mediaIsPip?o.MEDIA_EXIT_PIP_REQUEST:o.MEDIA_ENTER_PIP_REQUEST;this.dispatchEvent(new b.CustomEvent(e,{composed:!0,bubbles:!0}))}};es.getSlotTemplateHTML=Zo,es.getTooltipContentHTML=Qo,b.customElements.get(`media-pip-button`)||b.customElements.define(`media-pip-button`,es);var ts=es,ns=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},rs=(e,t,n)=>(ns(e,t,`read from private field`),n?n.call(e):t.get(e)),is=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},as,os={RATES:`rates`},ss=[1,1.2,1.5,1.7,2];function cs(e){return Math.round(e*100)/100}function ls(e){return`
    <style>
      :host {
        min-width: 5ch;
        padding: var(--media-button-padding, var(--media-control-padding, 10px 5px));
      }
    </style>
    <slot name="icon">${e.mediaplaybackrate?cs(+e.mediaplaybackrate):1}x</slot>
  `}function us(){return y(`Playback rate`)}var ds=class extends B{constructor(){super(),is(this,as,new Tn(this,os.RATES,{defaultValue:ss})),this.container=this.shadowRoot.querySelector(`slot[name="icon"]`),this.container.innerHTML=`${cs(this.mediaPlaybackRate??1)}x`}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_PLAYBACK_RATE,os.RATES]}attributeChangedCallback(e,t,n){if(super.attributeChangedCallback(e,t,n),e===os.RATES&&(rs(this,as).value=n),e===u.MEDIA_PLAYBACK_RATE){let e=n?+n:NaN,t=cs(Number.isNaN(e)?1:e);this.container.innerHTML=`${t}x`,this.setAttribute(`aria-label`,y(`Playback rate {playbackRate}`,{playbackRate:t}))}}get rates(){return rs(this,as)}set rates(e){e?Array.isArray(e)?rs(this,as).value=e.join(` `):typeof e==`string`&&(rs(this,as).value=e):rs(this,as).value=``}get mediaPlaybackRate(){return C(this,u.MEDIA_PLAYBACK_RATE,1)}set mediaPlaybackRate(e){w(this,u.MEDIA_PLAYBACK_RATE,e)}handleClick(){let e=Array.from(rs(this,as).values(),e=>+e).sort((e,t)=>e-t),t=e.find(e=>e>this.mediaPlaybackRate)??e[0]??1,n=new b.CustomEvent(o.MEDIA_PLAYBACK_RATE_REQUEST,{composed:!0,bubbles:!0,detail:t});this.dispatchEvent(n)}};as=new WeakMap,ds.getSlotTemplateHTML=ls,ds.getTooltipContentHTML=us,b.customElements.get(`media-playback-rate-button`)||b.customElements.define(`media-playback-rate-button`,ds);var fs=ds,ps=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="m6 21 15-9L6 3v18Z"/>
</svg>`,ms=`<svg aria-hidden="true" viewBox="0 0 24 24">
  <path d="M6 20h4V4H6v16Zm8-16v16h4V4h-4Z"/>
</svg>`;function hs(e){return`
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
      <slot name="play">${ps}</slot>
      <slot name="pause">${ms}</slot>
    </slot>
  `}function gs(){return`
    <slot name="tooltip-play">${y(`Play`)}</slot>
    <slot name="tooltip-pause">${y(`Pause`)}</slot>
  `}var _s=e=>{let t=e.mediaPaused?y(`play`):y(`pause`);e.setAttribute(`aria-label`,t)},vs=class extends B{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_PAUSED,u.MEDIA_ENDED]}connectedCallback(){super.connectedCallback(),_s(this)}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),(e===u.MEDIA_PAUSED||e===u.MEDIA_LANG)&&_s(this)}get mediaPaused(){return T(this,u.MEDIA_PAUSED)}set mediaPaused(e){E(this,u.MEDIA_PAUSED,e)}handleClick(){let e=this.mediaPaused?o.MEDIA_PLAY_REQUEST:o.MEDIA_PAUSE_REQUEST;this.dispatchEvent(new b.CustomEvent(e,{composed:!0,bubbles:!0}))}};vs.getSlotTemplateHTML=hs,vs.getTooltipContentHTML=gs,b.customElements.get(`media-play-button`)||b.customElements.define(`media-play-button`,vs);var ys=vs,bs={PLACEHOLDER_SRC:`placeholdersrc`,SRC:`src`};function xs(e){return`
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
  `}var Ss=e=>{e.style.removeProperty(`background-image`)},Cs=(e,t)=>{e.style[`background-image`]=`url('${t}')`},ws=class extends b.HTMLElement{static get observedAttributes(){return[bs.PLACEHOLDER_SRC,bs.SRC]}constructor(){if(super(),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=je(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}this.image=this.shadowRoot.querySelector(`#image`)}attributeChangedCallback(e,t,n){e===bs.SRC&&(n==null?this.image.removeAttribute(bs.SRC):this.image.setAttribute(bs.SRC,n)),e===bs.PLACEHOLDER_SRC&&(n==null?Ss(this.image):Cs(this.image,n))}get placeholderSrc(){return D(this,bs.PLACEHOLDER_SRC)}set placeholderSrc(e){O(this,bs.SRC,e)}get src(){return D(this,bs.SRC)}set src(e){O(this,bs.SRC,e)}};ws.shadowRootOptions={mode:`open`},ws.getTemplateHTML=xs,b.customElements.get(`media-poster-image`)||b.customElements.define(`media-poster-image`,ws);var Ts=ws,Es=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},Ds=(e,t,n)=>(Es(e,t,`read from private field`),n?n.call(e):t.get(e)),Os=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},ks=(e,t,n,r)=>(Es(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),As,js=class extends Ra{constructor(){super(),Os(this,As,void 0),ks(this,As,this.shadowRoot.querySelector(`slot`))}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_PREVIEW_CHAPTER,u.MEDIA_LANG]}attributeChangedCallback(e,t,n){if(super.attributeChangedCallback(e,t,n),(e===u.MEDIA_PREVIEW_CHAPTER||e===u.MEDIA_LANG)&&n!==t&&n!=null){if(Ds(this,As).textContent=n,n!==``){let e=y(`chapter: {chapterName}`,{chapterName:n});this.setAttribute(`aria-valuetext`,e)}else this.removeAttribute(`aria-valuetext`)}}get mediaPreviewChapter(){return D(this,u.MEDIA_PREVIEW_CHAPTER)}set mediaPreviewChapter(e){O(this,u.MEDIA_PREVIEW_CHAPTER,e)}};As=new WeakMap,b.customElements.get(`media-preview-chapter-display`)||b.customElements.define(`media-preview-chapter-display`,js);var Ms=js,Ns=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},Ps=(e,t,n)=>(Ns(e,t,`read from private field`),n?n.call(e):t.get(e)),Fs=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},Is=(e,t,n,r)=>(Ns(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Ls;function Rs(e){return`
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
  `}var zs=class extends b.HTMLElement{constructor(){if(super(),Fs(this,Ls,void 0),!this.shadowRoot){this.attachShadow(this.constructor.shadowRootOptions);let e=je(this.attributes);this.shadowRoot.innerHTML=this.constructor.getTemplateHTML(e)}}static get observedAttributes(){return[s.MEDIA_CONTROLLER,u.MEDIA_PREVIEW_IMAGE,u.MEDIA_PREVIEW_COORDS]}connectedCallback(){var e,t;let n=this.getAttribute(s.MEDIA_CONTROLLER);n&&(Is(this,Ls,this.getRootNode()?.getElementById(n)),(t=(e=Ps(this,Ls))?.associateElement)==null||t.call(e,this))}disconnectedCallback(){var e,t;(t=(e=Ps(this,Ls))?.unassociateElement)==null||t.call(e,this),Is(this,Ls,null)}attributeChangedCallback(e,t,n){var r,i,a,o;[u.MEDIA_PREVIEW_IMAGE,u.MEDIA_PREVIEW_COORDS].includes(e)&&this.update(),e===s.MEDIA_CONTROLLER&&(t&&((i=(r=Ps(this,Ls))?.unassociateElement)==null||i.call(r,this),Is(this,Ls,null)),n&&this.isConnected&&(Is(this,Ls,this.getRootNode()?.getElementById(n)),(o=(a=Ps(this,Ls))?.associateElement)==null||o.call(a,this)))}get mediaPreviewImage(){return D(this,u.MEDIA_PREVIEW_IMAGE)}set mediaPreviewImage(e){O(this,u.MEDIA_PREVIEW_IMAGE,e)}get mediaPreviewCoords(){let e=this.getAttribute(u.MEDIA_PREVIEW_COORDS);if(e)return e.split(/\s+/).map(e=>+e)}set mediaPreviewCoords(e){e?this.setAttribute(u.MEDIA_PREVIEW_COORDS,e.join(` `)):this.removeAttribute(u.MEDIA_PREVIEW_COORDS)}update(){let e=this.mediaPreviewCoords,t=this.mediaPreviewImage;if(!(e&&t))return;let[n,r,i,a]=e,o=t.split(`#`)[0],s=getComputedStyle(this),{maxWidth:c,maxHeight:l,minWidth:u,minHeight:d}=s,f=s.getPropertyValue(`--media-preview-thumbnail-object-fit`).trim()||`contain`,p,m;if(f===`fill`){let e=parseInt(c)/i,t=parseInt(l)/a,n=parseInt(u)/i,r=parseInt(d)/a;p=e<1?e:Math.max(e,n),m=t<1?t:Math.max(t,r)}else{let e=Math.min(parseInt(c)/i,parseInt(l)/a),t=Math.max(parseInt(u)/i,parseInt(d)/a),n=e<1?e:t>1?t:1;p=n,m=n}let{style:h}=S(this.shadowRoot,`:host`),g=S(this.shadowRoot,`img`).style,_=this.shadowRoot.querySelector(`img`),ee=Math.min(p,m)<1?`min`:`max`;h.setProperty(`${ee}-width`,`initial`,`important`),h.setProperty(`${ee}-height`,`initial`,`important`),h.width=`${i*p}px`,h.height=`${a*m}px`;let te=()=>{g.width=`${this.imgWidth*p}px`,g.height=`${this.imgHeight*m}px`,g.display=`block`};_.src!==o&&(_.onload=()=>{this.imgWidth=_.naturalWidth,this.imgHeight=_.naturalHeight,te(),_.onload=null},_.src=o,te()),te(),g.transform=`translate(-${n*p}px, -${r*m}px)`}};Ls=new WeakMap,zs.shadowRootOptions={mode:`open`},zs.getTemplateHTML=Rs,b.customElements.get(`media-preview-thumbnail`)||b.customElements.define(`media-preview-thumbnail`,zs);var Bs=zs,Vs=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},Hs=(e,t,n)=>(Vs(e,t,`read from private field`),n?n.call(e):t.get(e)),Us=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},Ws=(e,t,n,r)=>(Vs(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Gs,Ks=class extends Ra{constructor(){super(),Us(this,Gs,void 0),Ws(this,Gs,this.shadowRoot.querySelector(`slot`)),Hs(this,Gs).textContent=_e(0)}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_PREVIEW_TIME]}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),e===u.MEDIA_PREVIEW_TIME&&n!=null&&(Hs(this,Gs).textContent=_e(parseFloat(n)))}get mediaPreviewTime(){return C(this,u.MEDIA_PREVIEW_TIME)}set mediaPreviewTime(e){w(this,u.MEDIA_PREVIEW_TIME,e)}};Gs=new WeakMap,b.customElements.get(`media-preview-time-display`)||b.customElements.define(`media-preview-time-display`,Ks);var qs=Ks,Js={SEEK_OFFSET:`seekoffset`},Ys=30,Xs=e=>`
  <svg aria-hidden="true" viewBox="0 0 20 24">
    <defs>
      <style>.text{font-size:8px;font-family:Arial-BoldMT, Arial;font-weight:700;}</style>
    </defs>
    <text class="text value" transform="translate(2.18 19.87)">${e}</text>
    <path d="M10 6V3L4.37 7 10 10.94V8a5.54 5.54 0 0 1 1.9 10.48v2.12A7.5 7.5 0 0 0 10 6Z"/>
  </svg>`;function Zs(e,t){return`
    <slot name="icon">${Xs(t.seekOffset)}</slot>
  `}var Qs=(e,t)=>{e.setAttribute(`aria-label`,y(`seek back {seekOffset} seconds`,{seekOffset:t}))};function $s(){return y(`Seek backward`)}var ec=0,tc=class extends B{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_CURRENT_TIME,Js.SEEK_OFFSET]}connectedCallback(){super.connectedCallback(),this.seekOffset=C(this,Js.SEEK_OFFSET,Ys)}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),Qs(this,this.seekOffset),e===Js.SEEK_OFFSET&&(this.seekOffset=C(this,Js.SEEK_OFFSET,Ys))}get seekOffset(){return C(this,Js.SEEK_OFFSET,Ys)}set seekOffset(e){w(this,Js.SEEK_OFFSET,e),this.setAttribute(`aria-label`,y(`seek back {seekOffset} seconds`,{seekOffset:this.seekOffset})),Pe(Ie(this,`icon`),this.seekOffset)}get mediaCurrentTime(){return C(this,u.MEDIA_CURRENT_TIME,ec)}set mediaCurrentTime(e){w(this,u.MEDIA_CURRENT_TIME,e)}handleClick(){let e=Math.max(this.mediaCurrentTime-this.seekOffset,0),t=new b.CustomEvent(o.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:e});this.dispatchEvent(t)}};tc.getSlotTemplateHTML=Zs,tc.getTooltipContentHTML=$s,b.customElements.get(`media-seek-backward-button`)||b.customElements.define(`media-seek-backward-button`,tc);var nc=tc,rc={SEEK_OFFSET:`seekoffset`},ic=30,ac=e=>`
  <svg aria-hidden="true" viewBox="0 0 20 24">
    <defs>
      <style>.text{font-size:8px;font-family:Arial-BoldMT, Arial;font-weight:700;}</style>
    </defs>
    <text class="text value" transform="translate(8.9 19.87)">${e}</text>
    <path d="M10 6V3l5.61 4L10 10.94V8a5.54 5.54 0 0 0-1.9 10.48v2.12A7.5 7.5 0 0 1 10 6Z"/>
  </svg>`;function oc(e,t){return`
    <slot name="icon">${ac(t.seekOffset)}</slot>
  `}var sc=(e,t)=>{e.setAttribute(`aria-label`,y(`seek forward {seekOffset} seconds`,{seekOffset:t}))};function cc(){return y(`Seek forward`)}var lc=0,uc=class extends B{static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_CURRENT_TIME,rc.SEEK_OFFSET]}connectedCallback(){super.connectedCallback(),this.seekOffset=C(this,rc.SEEK_OFFSET,ic)}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),sc(this,this.seekOffset),e===rc.SEEK_OFFSET&&(this.seekOffset=C(this,rc.SEEK_OFFSET,ic))}get seekOffset(){return C(this,rc.SEEK_OFFSET,ic)}set seekOffset(e){w(this,rc.SEEK_OFFSET,e),this.setAttribute(`aria-label`,y(`seek forward {seekOffset} seconds`,{seekOffset:this.seekOffset})),Pe(Ie(this,`icon`),this.seekOffset)}get mediaCurrentTime(){return C(this,u.MEDIA_CURRENT_TIME,lc)}set mediaCurrentTime(e){w(this,u.MEDIA_CURRENT_TIME,e)}handleClick(){let e=this.mediaCurrentTime+this.seekOffset,t=new b.CustomEvent(o.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:e});this.dispatchEvent(t)}};uc.getSlotTemplateHTML=oc,uc.getTooltipContentHTML=cc,b.customElements.get(`media-seek-forward-button`)||b.customElements.define(`media-seek-forward-button`,uc);var dc=uc,fc=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},U=(e,t,n)=>(fc(e,t,`read from private field`),n?n.call(e):t.get(e)),pc=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},mc=(e,t,n,r)=>(fc(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),hc=(e,t,n)=>(fc(e,t,`access private method`),n),gc,_c,vc,yc,bc,xc,Sc,Cc,wc,Tc,Ec,Dc={REMAINING:`remaining`,SHOW_DURATION:`showduration`,NO_TOGGLE:`notoggle`},Oc=[...Object.values(Dc),u.MEDIA_CURRENT_TIME,u.MEDIA_DURATION,u.MEDIA_SEEKABLE],kc=[`Enter`,` `],Ac=`&nbsp;/&nbsp;`,jc=(e,{timesSep:t=Ac}={})=>{let n=e.mediaCurrentTime??0,[,r]=e.mediaSeekable??[],i=0;Number.isFinite(e.mediaDuration)?i=e.mediaDuration:Number.isFinite(r)&&(i=r);let a=e.remaining?_e(0-(i-n)):_e(n);return e.showDuration?`${a}${t}${_e(i)}`:a},Mc=e=>{let t=e.mediaCurrentTime,[,n]=e.mediaSeekable??[],r=null;if(Number.isFinite(e.mediaDuration)?r=e.mediaDuration:Number.isFinite(n)&&(r=n),t==null||r===null){e.setAttribute(`aria-description`,y(`video not loaded, unknown time.`));return}let i=e.remaining?ge(0-(r-t)):ge(t);if(!e.showDuration){e.setAttribute(`aria-description`,i);return}let a=y(`{currentTime} of {totalTime}`,{currentTime:i,totalTime:ge(r)});e.setAttribute(`aria-description`,a)};function Nc(e,t){return`
    <slot>${jc(t)}</slot>
  `}var Pc=e=>{e.setAttribute(`aria-label`,y(`playback time`))},Fc=class extends Ra{constructor(){super(),pc(this,yc),pc(this,xc),pc(this,Cc),pc(this,Tc),pc(this,gc,void 0),pc(this,_c,null),pc(this,vc,e=>{let{metaKey:t,altKey:n,key:r}=e;t||n||!kc.includes(r)?this.removeEventListener(`keyup`,U(this,_c)):this.addEventListener(`keyup`,U(this,_c))}),mc(this,gc,this.shadowRoot.querySelector(`slot`)),U(this,gc).innerHTML=`${jc(this)}`}static get observedAttributes(){return[...super.observedAttributes,...Oc,`disabled`]}connectedCallback(){let{style:e}=S(this.shadowRoot,`:host(:hover:not([notoggle]))`);e.setProperty(`cursor`,`var(--media-cursor, pointer)`),e.setProperty(`background`,`var(--media-control-hover-background, rgba(50 50 70 / .7))`),this.setAttribute(`aria-label`,y(`playback time`)),hc(this,Cc,wc).call(this),super.connectedCallback()}toggleTimeDisplay(){this.noToggle||(this.hasAttribute(`remaining`)?this.removeAttribute(`remaining`):this.setAttribute(`remaining`,``))}disconnectedCallback(){this.disable(),hc(this,xc,Sc).call(this),super.disconnectedCallback()}attributeChangedCallback(e,t,n){Pc(this),Oc.includes(e)?this.update():e===`disabled`&&n!==t?n==null?hc(this,Cc,wc).call(this):hc(this,Tc,Ec).call(this):e===Dc.NO_TOGGLE&&n!==t&&(this.noToggle?hc(this,Tc,Ec).call(this):hc(this,Cc,wc).call(this)),super.attributeChangedCallback(e,t,n)}enable(){this.noToggle||(this.tabIndex=0)}disable(){this.tabIndex=-1}get remaining(){return T(this,Dc.REMAINING)}set remaining(e){E(this,Dc.REMAINING,e)}get showDuration(){return T(this,Dc.SHOW_DURATION)}set showDuration(e){E(this,Dc.SHOW_DURATION,e)}get noToggle(){return T(this,Dc.NO_TOGGLE)}set noToggle(e){E(this,Dc.NO_TOGGLE,e)}get mediaDuration(){return C(this,u.MEDIA_DURATION)}set mediaDuration(e){w(this,u.MEDIA_DURATION,e)}get mediaCurrentTime(){return C(this,u.MEDIA_CURRENT_TIME)}set mediaCurrentTime(e){w(this,u.MEDIA_CURRENT_TIME,e)}get mediaSeekable(){let e=this.getAttribute(u.MEDIA_SEEKABLE);if(e)return e.split(`:`).map(e=>+e)}set mediaSeekable(e){e==null?this.removeAttribute(u.MEDIA_SEEKABLE):this.setAttribute(u.MEDIA_SEEKABLE,e.join(`:`))}update(){let e=jc(this);Mc(this),e!==U(this,gc).innerHTML&&(U(this,gc).innerHTML=e)}};gc=new WeakMap,_c=new WeakMap,vc=new WeakMap,yc=new WeakSet,bc=function(){U(this,_c)||(mc(this,_c,e=>{let{key:t}=e;kc.includes(t)?this.toggleTimeDisplay():this.removeEventListener(`keyup`,U(this,_c))}),this.addEventListener(`keydown`,U(this,vc)),this.addEventListener(`click`,this.toggleTimeDisplay))},xc=new WeakSet,Sc=function(){U(this,_c)&&(this.removeEventListener(`keyup`,U(this,_c)),this.removeEventListener(`keydown`,U(this,vc)),this.removeEventListener(`click`,this.toggleTimeDisplay),mc(this,_c,null))},Cc=new WeakSet,wc=function(){!this.noToggle&&!this.hasAttribute(`disabled`)&&(this.setAttribute(`role`,`button`),this.enable(),hc(this,yc,bc).call(this))},Tc=new WeakSet,Ec=function(){this.removeAttribute(`role`),this.disable(),hc(this,xc,Sc).call(this)},Fc.getSlotTemplateHTML=Nc,b.customElements.get(`media-time-display`)||b.customElements.define(`media-time-display`,Fc);var Ic=Fc,Lc=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},W=(e,t,n)=>(Lc(e,t,`read from private field`),n?n.call(e):t.get(e)),Rc=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},G=(e,t,n,r)=>(Lc(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),zc=(e,t,n,r)=>({set _(r){G(e,t,r,n)},get _(){return W(e,t,r)}}),Bc,Vc,Hc,Uc,Wc,Gc,Kc,qc,Jc,Yc,Xc=class{constructor(e,t,n){Rc(this,Bc,void 0),Rc(this,Vc,void 0),Rc(this,Hc,void 0),Rc(this,Uc,void 0),Rc(this,Wc,void 0),Rc(this,Gc,void 0),Rc(this,Kc,void 0),Rc(this,qc,void 0),Rc(this,Jc,0),Rc(this,Yc,(e=performance.now())=>{G(this,Jc,requestAnimationFrame(W(this,Yc))),G(this,Uc,performance.now()-W(this,Hc));let t=1e3/this.fps;if(W(this,Uc)>t){G(this,Hc,e-W(this,Uc)%t);let n=1e3/((e-W(this,Vc))/++zc(this,Wc)._),r=(e-W(this,Gc))/1e3/this.duration,i=W(this,Kc)+r*this.playbackRate;i-W(this,Bc).valueAsNumber>0?G(this,qc,this.playbackRate/this.duration/n):(G(this,qc,.995*W(this,qc)),i=W(this,Bc).valueAsNumber+W(this,qc)),this.callback(i)}}),G(this,Bc,e),this.callback=t,this.fps=n}start(){W(this,Jc)===0&&(G(this,Hc,performance.now()),G(this,Vc,W(this,Hc)),G(this,Wc,0),W(this,Yc).call(this))}stop(){W(this,Jc)!==0&&(cancelAnimationFrame(W(this,Jc)),G(this,Jc,0))}update({start:e,duration:t,playbackRate:n}){let r=e-W(this,Bc).valueAsNumber,i=Math.abs(t-this.duration);(r>0||r<-.5/t||i>=.5)&&this.callback(e),G(this,Kc,e),G(this,Gc,performance.now()),this.duration=t,this.playbackRate=n}};Bc=new WeakMap,Vc=new WeakMap,Hc=new WeakMap,Uc=new WeakMap,Wc=new WeakMap,Gc=new WeakMap,Kc=new WeakMap,qc=new WeakMap,Jc=new WeakMap,Yc=new WeakMap;var Zc=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},K=(e,t,n)=>(Zc(e,t,`read from private field`),n?n.call(e):t.get(e)),q=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},J=(e,t,n,r)=>(Zc(e,t,`write to private field`),r?r.call(e,n):t.set(e,n),n),Y=(e,t,n)=>(Zc(e,t,`access private method`),n),Qc,$c,el,tl,nl,rl,il,al,ol,sl,cl,ll,ul,dl,fl,pl,ml,hl,gl,_l,vl,yl,bl,xl,Sl,Cl,wl=e=>{let t=e.range,n=ge(+Dl(e)),r=ge(+e.mediaSeekableEnd),i=n&&r?y(`{currentTime} of {totalTime}`,{currentTime:n,totalTime:r}):y(`video not loaded, unknown time.`);t.setAttribute(`aria-valuetext`,i)};function Tl(e){return`
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
          <template shadowrootmode="${Bs.shadowRootOptions.mode}">
            ${Bs.getTemplateHTML({})}
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
  `}var El=(e,t=e.mediaCurrentTime)=>{let n=Number.isFinite(e.mediaSeekableStart)?e.mediaSeekableStart:0,r=Number.isFinite(e.mediaDuration)?e.mediaDuration:e.mediaSeekableEnd;if(Number.isNaN(r))return 0;let i=(t-n)/(r-n);return Math.max(0,Math.min(i,1))},Dl=(e,t=e.range.valueAsNumber)=>{let n=Number.isFinite(e.mediaSeekableStart)?e.mediaSeekableStart:0,r=Number.isFinite(e.mediaDuration)?e.mediaDuration:e.mediaSeekableEnd;return Number.isNaN(r)?0:t*(r-n)+n},Ol=class extends xa{constructor(){super(),q(this,ll),q(this,fl),q(this,ml),q(this,gl),q(this,vl),q(this,bl),q(this,Sl),q(this,Qc,null),q(this,$c,void 0),q(this,el,void 0),q(this,tl,void 0),q(this,nl,void 0),q(this,rl,void 0),q(this,il,void 0),q(this,al,void 0),q(this,ol,void 0),q(this,sl,void 0),q(this,cl,()=>{Y(this,ll,ul).call(this)?K(this,$c).start():K(this,$c).stop()}),q(this,dl,e=>{this.dragging||(ae(e)&&(this.range.valueAsNumber=e),K(this,sl)||this.updateBar())}),this.shadowRoot.querySelector(`#track`).insertAdjacentHTML(`afterbegin`,`<div id="buffered" part="buffered"></div>`),J(this,el,this.shadowRoot.querySelectorAll(`[part~="box"]`)),J(this,nl,this.shadowRoot.querySelector(`[part~="preview-box"]`)),J(this,rl,this.shadowRoot.querySelector(`[part~="current-box"]`));let e=getComputedStyle(this);J(this,il,parseInt(e.getPropertyValue(`--media-box-padding-left`))),J(this,al,parseInt(e.getPropertyValue(`--media-box-padding-right`))),J(this,$c,new Xc(this.range,K(this,dl),60))}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_PAUSED,u.MEDIA_DURATION,u.MEDIA_SEEKABLE,u.MEDIA_CURRENT_TIME,u.MEDIA_PREVIEW_IMAGE,u.MEDIA_PREVIEW_TIME,u.MEDIA_PREVIEW_CHAPTER,u.MEDIA_BUFFERED,u.MEDIA_PLAYBACK_RATE,u.MEDIA_LOADING,u.MEDIA_ENDED]}connectedCallback(){var e;super.connectedCallback(),this.range.setAttribute(`aria-label`,y(`seek`)),K(this,cl).call(this),J(this,Qc,this.getRootNode()),(e=K(this,Qc))==null||e.addEventListener(`transitionstart`,this)}disconnectedCallback(){var e;super.disconnectedCallback(),K(this,$c).stop(),(e=K(this,Qc))==null||e.removeEventListener(`transitionstart`,this),J(this,Qc,null)}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),t!=n&&(e===u.MEDIA_CURRENT_TIME||e===u.MEDIA_PAUSED||e===u.MEDIA_ENDED||e===u.MEDIA_LOADING||e===u.MEDIA_DURATION||e===u.MEDIA_SEEKABLE?(K(this,$c).update({start:El(this),duration:this.mediaSeekableEnd-this.mediaSeekableStart,playbackRate:this.mediaPlaybackRate}),K(this,cl).call(this),wl(this)):e===u.MEDIA_BUFFERED&&this.updateBufferedBar(),(e===u.MEDIA_DURATION||e===u.MEDIA_SEEKABLE)&&(this.mediaChaptersCues=K(this,ol),this.updateBar()))}get mediaChaptersCues(){return K(this,ol)}set mediaChaptersCues(e){J(this,ol,e),this.updateSegments(K(this,ol)?.map(e=>({start:El(this,e.startTime),end:El(this,e.endTime)})))}get mediaPaused(){return T(this,u.MEDIA_PAUSED)}set mediaPaused(e){E(this,u.MEDIA_PAUSED,e)}get mediaLoading(){return T(this,u.MEDIA_LOADING)}set mediaLoading(e){E(this,u.MEDIA_LOADING,e)}get mediaDuration(){return C(this,u.MEDIA_DURATION)}set mediaDuration(e){w(this,u.MEDIA_DURATION,e)}get mediaCurrentTime(){return C(this,u.MEDIA_CURRENT_TIME)}set mediaCurrentTime(e){w(this,u.MEDIA_CURRENT_TIME,e)}get mediaPlaybackRate(){return C(this,u.MEDIA_PLAYBACK_RATE,1)}set mediaPlaybackRate(e){w(this,u.MEDIA_PLAYBACK_RATE,e)}get mediaBuffered(){let e=this.getAttribute(u.MEDIA_BUFFERED);return e?e.split(` `).map(e=>e.split(`:`).map(e=>+e)):[]}set mediaBuffered(e){if(!e){this.removeAttribute(u.MEDIA_BUFFERED);return}let t=e.map(e=>e.join(`:`)).join(` `);this.setAttribute(u.MEDIA_BUFFERED,t)}get mediaSeekable(){let e=this.getAttribute(u.MEDIA_SEEKABLE);if(e)return e.split(`:`).map(e=>+e)}set mediaSeekable(e){e==null?this.removeAttribute(u.MEDIA_SEEKABLE):this.setAttribute(u.MEDIA_SEEKABLE,e.join(`:`))}get mediaSeekableEnd(){let[,e=this.mediaDuration]=this.mediaSeekable??[];return e}get mediaSeekableStart(){let[e=0]=this.mediaSeekable??[];return e}get mediaPreviewImage(){return D(this,u.MEDIA_PREVIEW_IMAGE)}set mediaPreviewImage(e){O(this,u.MEDIA_PREVIEW_IMAGE,e)}get mediaPreviewTime(){return C(this,u.MEDIA_PREVIEW_TIME)}set mediaPreviewTime(e){w(this,u.MEDIA_PREVIEW_TIME,e)}get mediaEnded(){return T(this,u.MEDIA_ENDED)}set mediaEnded(e){E(this,u.MEDIA_ENDED,e)}updateBar(){super.updateBar(),this.updateBufferedBar(),this.updateCurrentBox()}updateBufferedBar(){let e=this.mediaBuffered;if(!e.length)return;let t;if(this.mediaEnded)t=1;else{let n=this.mediaCurrentTime,[,r=this.mediaSeekableStart]=e.find(([e,t])=>e<=n&&n<=t)??[];t=El(this,r)}let{style:n}=S(this.shadowRoot,`#buffered`);n.setProperty(`width`,`${t*100}%`)}updateCurrentBox(){if(!this.shadowRoot.querySelector(`slot[name="current"]`).assignedElements().length)return;let e=S(this.shadowRoot,`#current-rail`),t=S(this.shadowRoot,`[part~="current-box"]`),n=Y(this,fl,pl).call(this,K(this,rl)),r=Y(this,ml,hl).call(this,n,this.range.valueAsNumber),i=Y(this,gl,_l).call(this,n,this.range.valueAsNumber);e.style.transform=`translateX(${r})`,e.style.setProperty(`--_range-width`,`${n.range.width}`),t.style.setProperty(`--_box-shift`,`${i}`),t.style.setProperty(`--_box-width`,`${n.box.width}px`),t.style.setProperty(`visibility`,`initial`)}handleEvent(e){switch(super.handleEvent(e),e.type){case`input`:Y(this,Sl,Cl).call(this);break;case`pointermove`:Y(this,vl,yl).call(this,e);break;case`pointerup`:K(this,sl)&&J(this,sl,!1);break;case`pointerdown`:J(this,sl,!0);break;case`pointerleave`:Y(this,bl,xl).call(this,null);break;case`transitionstart`:Le(e.target,this)&&setTimeout(()=>K(this,cl).call(this),0)}}};Qc=new WeakMap,$c=new WeakMap,el=new WeakMap,tl=new WeakMap,nl=new WeakMap,rl=new WeakMap,il=new WeakMap,al=new WeakMap,ol=new WeakMap,sl=new WeakMap,cl=new WeakMap,ll=new WeakSet,ul=function(){return this.isConnected&&!this.mediaPaused&&!this.mediaLoading&&!this.mediaEnded&&this.mediaSeekableEnd>0&&Ve(this)},dl=new WeakMap,fl=new WeakSet,pl=function(e){let t=((this.getAttribute(`bounds`)?Re(this,`#${this.getAttribute(`bounds`)}`):this.parentElement)??this).getBoundingClientRect(),n=this.range.getBoundingClientRect(),r=e.offsetWidth;return{box:{width:r,min:-(n.left-t.left-r/2),max:t.right-n.left-r/2},bounds:t,range:n}},ml=new WeakSet,hl=function(e,t){let n=`${t*100}%`,{width:r,min:i,max:a}=e.box;if(!r)return n;if(Number.isNaN(i)||(n=`max(${`calc(1 / var(--_range-width) * 100 * ${i}% + var(--media-box-padding-left))`}, ${n})`),!Number.isNaN(a)){let e=`calc(1 / var(--_range-width) * 100 * ${a}% - var(--media-box-padding-right))`;n=`min(${n}, ${e})`}return n},gl=new WeakSet,_l=function(e,t){let{width:n,min:r,max:i}=e.box,a=t*e.range.width;if(a<r+K(this,il)){let t=e.range.left-e.bounds.left-K(this,il);return`${a-n/2+t}px`}if(a>i-K(this,al)){let t=e.bounds.right-e.range.right-K(this,al);return`${a+n/2-t-e.range.width}px`}return 0},vl=new WeakSet,yl=function(e){let t=[...K(this,el)].some(t=>e.composedPath().includes(t));if(!this.dragging&&(t||!e.composedPath().includes(this))){Y(this,bl,xl).call(this,null);return}let n=this.mediaSeekableEnd;if(!n)return;let r=S(this.shadowRoot,`#preview-rail`),i=S(this.shadowRoot,`[part~="preview-box"]`),a=Y(this,fl,pl).call(this,K(this,nl)),o=(e.clientX-a.range.left)/a.range.width;o=Math.max(0,Math.min(1,o));let s=Y(this,ml,hl).call(this,a,o),c=Y(this,gl,_l).call(this,a,o);r.style.transform=`translateX(${s})`,r.style.setProperty(`--_range-width`,`${a.range.width}`),i.style.setProperty(`--_box-shift`,`${c}`),i.style.setProperty(`--_box-width`,`${a.box.width}px`);let l=Math.round(K(this,tl))-Math.round(o*n);Math.abs(l)<1&&o>.01&&o<.99||(J(this,tl,o*n),Y(this,bl,xl).call(this,K(this,tl)))},bl=new WeakSet,xl=function(e){this.dispatchEvent(new b.CustomEvent(o.MEDIA_PREVIEW_REQUEST,{composed:!0,bubbles:!0,detail:e}))},Sl=new WeakSet,Cl=function(){K(this,$c).stop();let e=Dl(this);this.dispatchEvent(new b.CustomEvent(o.MEDIA_SEEK_REQUEST,{composed:!0,bubbles:!0,detail:e}))},Ol.shadowRootOptions={mode:`open`},Ol.getContainerTemplateHTML=Tl,b.customElements.get(`media-time-range`)||b.customElements.define(`media-time-range`,Ol);var kl=Ol,Al=(e,t,n)=>{if(!t.has(e))throw TypeError(`Cannot `+n)},jl=(e,t,n)=>(Al(e,t,`read from private field`),n?n.call(e):t.get(e)),Ml=(e,t,n)=>{if(t.has(e))throw TypeError(`Cannot add the same private member more than once`);t instanceof WeakSet?t.add(e):t.set(e,n)},Nl,Pl=1,Fl=e=>e.mediaMuted?0:e.mediaVolume,Il=e=>`${Math.round(e*100)}%`,Ll=class extends xa{constructor(){super(...arguments),Ml(this,Nl,()=>{let e=this.range.value,t=new b.CustomEvent(o.MEDIA_VOLUME_REQUEST,{composed:!0,bubbles:!0,detail:e});this.dispatchEvent(t)})}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_VOLUME,u.MEDIA_MUTED,u.MEDIA_VOLUME_UNAVAILABLE]}connectedCallback(){super.connectedCallback(),this.range.setAttribute(`aria-label`,y(`volume`)),this.range.addEventListener(`input`,jl(this,Nl))}disconnectedCallback(){this.range.removeEventListener(`input`,jl(this,Nl)),super.disconnectedCallback()}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),(e===u.MEDIA_VOLUME||e===u.MEDIA_MUTED)&&(this.range.valueAsNumber=Fl(this),this.range.setAttribute(`aria-valuetext`,Il(this.range.valueAsNumber)),this.updateBar())}get mediaVolume(){return C(this,u.MEDIA_VOLUME,Pl)}set mediaVolume(e){w(this,u.MEDIA_VOLUME,e)}get mediaMuted(){return T(this,u.MEDIA_MUTED)}set mediaMuted(e){E(this,u.MEDIA_MUTED,e)}get mediaVolumeUnavailable(){return D(this,u.MEDIA_VOLUME_UNAVAILABLE)}set mediaVolumeUnavailable(e){O(this,u.MEDIA_VOLUME_UNAVAILABLE,e)}};Nl=new WeakMap,b.customElements.get(`media-volume-range`)||b.customElements.define(`media-volume-range`,Ll);var Rl=Ll;function zl(e){return`
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
    `}function Bl(){return y(`Loop`)}var Vl=class extends B{constructor(){super(...arguments),this.container=null}static get observedAttributes(){return[...super.observedAttributes,u.MEDIA_LOOP]}connectedCallback(){super.connectedCallback(),this.container=this.shadowRoot?.querySelector(`#icon`)||null,this.container&&(this.container.textContent=y(`Loop`))}attributeChangedCallback(e,t,n){super.attributeChangedCallback(e,t,n),e===u.MEDIA_LOOP&&this.container&&this.setAttribute(`aria-checked`,this.mediaLoop?`true`:`false`)}get mediaLoop(){return T(this,u.MEDIA_LOOP)}set mediaLoop(e){E(this,u.MEDIA_LOOP,e)}handleClick(){let e=!this.mediaLoop,t=new b.CustomEvent(o.MEDIA_LOOP_REQUEST,{composed:!0,bubbles:!0,detail:e});this.dispatchEvent(t)}};Vl.getSlotTemplateHTML=zl,Vl.getTooltipContentHTML=Bl,b.customElements.get(`media-loop-button`)||b.customElements.define(`media-loop-button`,Vl);var Hl=Vl,X=e(t(),1),Ul=new Set([`style`,`children`,`ref`,`key`,`suppressContentEditableWarning`,`suppressHydrationWarning`,`dangerouslySetInnerHTML`]),Wl={className:`class`,htmlFor:`for`};function Gl(e){return e.toLowerCase()}function Kl(e){if(typeof e==`boolean`)return e?``:void 0;if(typeof e!=`function`&&!(typeof e==`object`&&e))return e}function Z({react:e,tagName:t,elementClass:n,events:r,displayName:i,defaultProps:a,toAttributeName:o=Gl,toAttributeValue:s=Kl}){let c=Number.parseInt(e.version)>=19,l=e.forwardRef((i,l)=>{let u=e.useRef(null),d=e.useRef(new Map),f={},p={},m={},h={};for(let[e,t]of Object.entries(i)){if(Ul.has(e)){m[e]=t;continue}let r=o(Wl[e]??e);if(n.prototype&&e in n.prototype&&!(e in(globalThis.HTMLElement?.prototype??{}))&&!n.observedAttributes?.some(e=>e===r)){h[e]=t;continue}if(e.startsWith(`on`)){f[e]=t;continue}let i=s(t);r&&i!=null&&(p[r]=String(i),c||(m[r]=i)),r&&c&&(m[r]=i===Kl(t)?t:i)}if(typeof window<`u`){for(let t in f){let n=f[t],i=t.endsWith(`Capture`),a=(r?.[t]??t.slice(2).toLowerCase()).slice(0,i?-7:void 0);e.useLayoutEffect(()=>{let e=u?.current;if(e&&typeof n==`function`)return e.addEventListener(a,n,i),()=>{e.removeEventListener(a,n,i)}},[u?.current,n])}e.useLayoutEffect(()=>{if(u.current===null)return;let e=new Map;for(let t in h)ql(u.current,t,h[t]),d.current.delete(t),e.set(t,h[t]);for(let[e,t]of d.current)ql(u.current,e,void 0);d.current=e})}if(typeof window>`u`&&n?.getTemplateHTML&&n?.shadowRootOptions){let{mode:t,delegatesFocus:r}=n.shadowRootOptions;m.children=[e.createElement(`template`,{shadowrootmode:t,shadowrootdelegatesfocus:r,dangerouslySetInnerHTML:{__html:n.getTemplateHTML(p,i)},key:`ce-la-react-ssr-template-shadow-root`}),m.children]}return e.createElement(t,{...a,...m,ref:e.useCallback(e=>{u.current=e,typeof l==`function`?l(e):l!==null&&(l.current=e)},[l])},m.children)});return l.displayName=i??n.name,l}function ql(e,t,n){e[t]=n,n==null&&t in(globalThis.HTMLElement?.prototype??{})&&e.removeAttribute(t)}function Q(e){if(typeof e==`boolean`)return e?``:void 0;if(typeof e!=`function`){if(Array.isArray(e)&&e.every(e=>typeof e==`string`||typeof e==`number`||typeof e==`boolean`))return e.join(` `);if(!(typeof e==`object`&&e))return e}}Z({tagName:`media-gesture-receiver`,elementClass:Qe,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-container`,elementClass:At,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-chrome-dialog`,elementClass:tn,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-keyboard-shortcuts-dialog`,elementClass:hn,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});var Jl=Z({tagName:`media-controller`,elementClass:ei,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});Z({tagName:`media-tooltip`,elementClass:ii,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-chrome-button`,elementClass:Si,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-airplay-button`,elementClass:Oi,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});var Yl=Z({tagName:`media-captions-button`,elementClass:Li,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});Z({tagName:`media-cast-button`,elementClass:Wi,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-chrome-range`,elementClass:Sa,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});var Xl=Z({tagName:`media-control-bar`,elementClass:Aa,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});Z({tagName:`media-text-display`,elementClass:za,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-duration-display`,elementClass:qa,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-error-dialog`,elementClass:so,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});var Zl=Z({tagName:`media-fullscreen-button`,elementClass:bo,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});Z({tagName:`media-live-button`,elementClass:ko,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});var Ql=Z({tagName:`media-loading-indicator`,elementClass:Vo,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),$l=Z({tagName:`media-mute-button`,elementClass:Yo,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});Z({tagName:`media-pip-button`,elementClass:ts,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-playback-rate-button`,elementClass:fs,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});var eu=Z({tagName:`media-play-button`,elementClass:ys,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});Z({tagName:`media-poster-image`,elementClass:Ts,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-preview-chapter-display`,elementClass:Ms,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-preview-thumbnail`,elementClass:Bs,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-preview-time-display`,elementClass:qs,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-seek-backward-button`,elementClass:nc,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-seek-forward-button`,elementClass:dc,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});var tu=Z({tagName:`media-time-display`,elementClass:Ic,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),nu=Z({tagName:`media-time-range`,elementClass:kl,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});Z({tagName:`media-volume-range`,elementClass:Rl,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}}),Z({tagName:`media-loop-button`,elementClass:Hl,react:X.default,toAttributeValue:Q,defaultProps:{suppressHydrationWarning:!0}});function ru(e){return{Play:e.play,play:e.play,Pause:e.pause,pause:e.pause,Captions:e.captions,"closed captions":e.captions,"Enable captions":e.enableCaptions,"Disable captions":e.disableCaptions,"Enter fullscreen mode":e.enterFullscreen,"enter fullscreen mode":e.enterFullscreen,"Exit fullscreen mode":e.exitFullscreen,"exit fullscreen mode":e.exitFullscreen,Mute:e.mute,mute:e.mute,Unmute:e.unmute,unmute:e.unmute,seek:e.seek,"video player":e.videoPlayer,"playback time":e.playbackTime,"media loading":e.loading,"{currentTime} of {totalTime}":e.timeOf,"{time} remaining":e.remaining,hour:e.hour,hours:e.hours,minute:e.minute,minutes:e.minutes,second:e.second,seconds:e.seconds,"Network Error":e.networkError,"Decode Error":e.decodeError,"Source Not Supported":e.notSupported,"A network error caused the media download to fail.":e.networkError,"A media error caused playback to be aborted. The media could be corrupt or your browser does not support this format.":e.decodeError,"An unsupported error occurred. The server or network failed, or your browser does not support this format.":e.notSupported,"video not loaded, unknown time.":e.notLoaded}}var $=n(),iu=e=>e;function au({film:e,title:t,lang:n,memoryKey:o,captions:s,onCaptions:c,onWatched:l,autoStart:u,savedAt:d,onPosition:f}){let{lang:p,dict:m}=i(),h=m.stories.film,g=(0,X.useId)().replace(/[^a-zA-Z0-9]/g,``),_=`film-frame-${g}`,ee=`film-ctrl-${g}`,te=(0,X.useRef)(null),[ne,re]=(0,X.useState)(!1),[ie,ae]=(0,X.useState)(null),[oe,se]=(0,X.useState)(0),ce=(0,X.useRef)(!1),v=(0,X.useRef)({savedAt:d,onPosition:f});v.current={savedAt:d,onPosition:f},de(p,ru(h.chrome)),(0,X.useEffect)(()=>{let t=null,n=!0,r=e.captionsUrl;return r?r.startsWith(`data:`)?(fetch(r).then(e=>e.blob()).then(e=>{n&&(t=URL.createObjectURL(new Blob([e],{type:`text/vtt`})),ae(t))},()=>n&&ae(null)),()=>{n=!1,t&&URL.revokeObjectURL(t)}):ae(r):ae(null)},[e.captionsUrl]),(0,X.useEffect)(()=>{let e=te.current;if(!e)return;let t=()=>{let t=0;try{t=Number(localStorage.getItem(o))||0}catch{}t||=v.current.savedAt??0,t>3&&Number.isFinite(e.duration)&&t<e.duration-3&&(e.currentTime=t)},n=0,r=-1,i=(t=!1)=>{let n=Math.floor(e.currentTime);!t&&Math.abs(n-r)<10||(r=n,v.current.onPosition?.(n))},a=()=>{if(!(Math.abs(e.currentTime-n)<2)){n=e.currentTime;try{localStorage.setItem(o,String(Math.floor(e.currentTime)))}catch{}i(),!ce.current&&Number.isFinite(e.duration)&&e.currentTime>e.duration*.9&&(ce.current=!0,l())}},s=()=>!e.ended&&i(!0),c=()=>{try{localStorage.removeItem(o)}catch{}v.current.onPosition?.(null),ce.current||(ce.current=!0,l())},u=()=>re(!0);return e.addEventListener(`loadedmetadata`,t),e.addEventListener(`timeupdate`,a),e.addEventListener(`ended`,c),e.addEventListener(`pause`,s),e.addEventListener(`error`,u),e.readyState>=1&&t(),()=>{e.removeEventListener(`loadedmetadata`,t),e.removeEventListener(`timeupdate`,a),e.removeEventListener(`ended`,c),e.removeEventListener(`pause`,s),e.removeEventListener(`error`,u)}},[o,l,oe]),(0,X.useEffect)(()=>{let e=te.current;if(!e)return;let t=()=>{let t=[...e.textTracks].find(e=>e.kind===`captions`||e.kind===`subtitles`);t&&t.mode!==`showing`&&s&&c(!1),t&&t.mode===`showing`&&!s&&c(!0)},n=()=>{let t=[...e.textTracks].find(e=>e.kind===`captions`||e.kind===`subtitles`);t&&(t.mode=s?`showing`:`disabled`)};return n(),e.textTracks.addEventListener(`addtrack`,n),e.textTracks.addEventListener(`change`,t),()=>{e.textTracks.removeEventListener(`addtrack`,n),e.textTracks.removeEventListener(`change`,t)}},[s,c,ie]),(0,X.useEffect)(()=>{u&&te.current?.play().catch(()=>{})},[u,oe]),(0,X.useEffect)(()=>{let e=()=>{document.fullscreenElement&&matchMedia(`(pointer: coarse)`).matches&&screen.orientation?.lock?.(`landscape`).catch(()=>{})};return document.addEventListener(`fullscreenchange`,e),()=>document.removeEventListener(`fullscreenchange`,e)},[]),(0,X.useEffect)(()=>{let e=document.getElementById(_);e?.querySelector(`media-captions-button`)?.setAttribute(`role`,`switch`),e?.querySelector(`media-time-display`)?.setAttribute(`role`,`timer`)},[_,ie]);let[le,ue]=(0,X.useState)(!0);return(0,X.useEffect)(()=>{let e=window.setTimeout(()=>ue(!1),500);return()=>clearTimeout(e)},[]),e.videoUrl?(0,$.jsxs)(`div`,{className:`film-wrap flex flex-col gap-2`,children:[(0,$.jsxs)(`div`,{id:_,className:`film-frame`,"data-entering":le||void 0,"data-testid":`film`,dir:r(p),children:[(0,$.jsxs)(Jl,{id:ee,lang:p,noAutohide:!0,gesturesDisabled:!0,"aria-label":h.label.replace(`{title}`,t),...iu({fullscreenelement:_}),children:[(0,$.jsx)(`video`,{ref:te,slot:`media`,src:e.videoUrl,poster:e.posterUrl??void 0,preload:`metadata`,playsInline:!0,crossOrigin:e.videoUrl.startsWith(`http`)&&!e.videoUrl.startsWith(location.origin)?`anonymous`:void 0,lang:n,"data-testid":`film-video`,children:ie&&(0,$.jsx)(`track`,{kind:`captions`,src:ie,srcLang:n,label:m.stories.film.chrome.captions,default:s})},oe),(0,$.jsx)(Ql,{slot:`centered-chrome`,noAutohide:!0}),(0,$.jsx)(eu,{slot:`centered-chrome`,className:`film-big-play`})]}),(0,$.jsx)(Xl,{className:`film-scrub`,...iu({mediacontroller:ee}),children:(0,$.jsx)(nu,{})}),(0,$.jsxs)(Xl,{...iu({mediacontroller:ee}),children:[(0,$.jsx)(eu,{}),(0,$.jsx)(nu,{className:`film-inline-range`}),(0,$.jsx)(tu,{showDuration:!0,dir:`ltr`,...iu({notoggle:``})}),(0,$.jsx)(`span`,{className:`flex-1`}),ie&&(0,$.jsx)(Yl,{"data-testid":`film-captions`}),(0,$.jsx)($l,{}),(0,$.jsx)(Zl,{})]})]}),ie&&(0,$.jsx)(`p`,{className:`text-sm text-ink-muted`,children:h.captionsNote}),ne&&(0,$.jsxs)(`div`,{role:`alert`,className:`flex flex-wrap items-center gap-3 rounded-control border-s-4 border border-red-800 bg-red-50 p-3 text-red-950`,children:[(0,$.jsx)(`span`,{children:h.error}),(0,$.jsx)(a,{variant:`secondary`,onClick:()=>{re(!1),se(e=>e+1)},children:m.account.errors.retry})]})]}):(0,$.jsx)(`p`,{className:`rounded-control border border-dashed border-ink-muted p-6 text-center text-ink-muted`,children:h.notReady})}export{au as default};