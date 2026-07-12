"use strict";var FeedbackWidget=(()=>{var c=Object.defineProperty;var p=Object.getOwnPropertyDescriptor;var h=Object.getOwnPropertyNames;var f=Object.prototype.hasOwnProperty;var u=(r,e)=>{for(var t in e)c(r,t,{get:e[t],enumerable:!0})},m=(r,e,t,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let o of h(e))!f.call(r,o)&&o!==t&&c(r,o,{get:()=>e[o],enumerable:!(i=p(e,o))||i.enumerable});return r};var g=r=>m(c({},"__esModule",{value:!0}),r);var w={};u(w,{FeedbackWidget:()=>b});var v={buttonLabel:"Feedback",backgroundColor:"#111827",textColor:"#ffffff",accentColor:"#2F6FED",font:'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',position:"right",widgetType:"default"},b=class{config;host;root;elements;state;showItemInForm;selectedSelector;selectedEl;hoverRafId;hostId;apiKey;endPoint;constructor(e=null,t={}){this.config={...v,...t},this.hostId=`feedback-widget-host-${Math.random().toString(36).substr(2,9)}`,this.state="idle",this.showItemInForm=!0,this.selectedSelector=null,this.selectedEl=null,this.hoverRafId=null,this.apiKey=e||"",this.endPoint="https://devx.today/v1/widget/ingest",this.initialize()}initialize(){this.createHostAndShadow(),this.injectStyles(),this.createMarkup(),this.cacheElements(),this.attachEventListeners()}createHostAndShadow(){this.host=document.createElement("div"),this.host.id=this.hostId,document.documentElement.appendChild(this.host),this.root=this.host.attachShadow({mode:"open"})}injectStyles(){let e=this.generateCSS(),t=document.createElement("style");t.textContent=e,this.root.appendChild(t)}generateCSS(){let{backgroundColor:e,textColor:t,accentColor:i,font:o,position:n}=this.config,a=this.hexToRgba(i,.22),l=this.hexToRgba(i,.15),s=n==="right"?"translateY(-50%) rotate(180deg)":"translateY(-50%)",d=n==="right"?"8px 0 0 8px":"0 8px 8px 0",x=n==="right"?"0":"auto",y=n==="left"?"0":"auto";return`
      :host { all: initial; }
      * { box-sizing: border-box; font-family: ${o}; }
      
      .fbw-tab {
        position: fixed;
        top: 50%;
        ${n==="right"?"right":"left"}: 0;
        transform: ${s};
        background: ${e};
        color: ${t};
        writing-mode: vertical-rl;
        text-orientation: mixed;
        padding: 14px 9px;
        border-radius: ${d};
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.03em;
        box-shadow: ${n==="right"?"-2px":"2px"} 0 10px rgba(0,0,0,0.18);
        z-index: 2147483000;
        border: none;
        user-select: none;
        transition: padding 0.12s ease, background 0.12s ease;
      }
      
      .fbw-tab:hover { padding-right: 13px; background: #1f2937; }
      .fbw-tab:focus-visible { outline: 2px solid ${i}; outline-offset: 2px; }
      
      .fbw-menu {
        position: fixed;
        top: 50%;
        right: ${n==="right"?"46px":"auto"};
        left: ${n==="left"?"46px":"auto"};
        transform: translateY(-50%);
        background: #fff;
        border-radius: 10px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.22);
        padding: 6px;
        min-width: 220px;
        z-index: 2147483001;
        display: none;
        border: 1px solid #e5e7eb;
      }
      
      .fbw-menu.fbw-open { display: block; }
      
      .fbw-menu button {
        display: block;
        width: 100%;
        text-align: left;
        background: none;
        border: none;
        padding: 10px 12px;
        font-size: 13.5px;
        color: #111827;
        border-radius: 6px;
        cursor: pointer;
      }
      
      .fbw-menu button:hover { background: #f3f4f6; }
      .fbw-menu button small { display: block; color: #6b7280; font-weight: 400; margin-top: 2px; font-size: 11.5px; }
      
      .fbw-banner {
        position: fixed;
        top: 18px;
        left: 50%;
        transform: translateX(-50%);
        background: ${e};
        color: ${t};
        padding: 10px 10px 10px 16px;
        border-radius: 999px;
        font-size: 13px;
        display: none;
        align-items: center;
        gap: 10px;
        z-index: 2147483002;
        box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      }
      
      .fbw-banner.fbw-open { display: flex; }
      
      .fbw-banner button {
        background: rgba(255,255,255,0.12);
        color: ${t};
        border: none;
        padding: 6px 12px;
        border-radius: 999px;
        font-size: 12px;
        cursor: pointer;
      }
      
      .fbw-banner button:hover { background: rgba(255,255,255,0.22); }
      
      .fbw-highlight {
        position: fixed;
        pointer-events: none;
        border: 2px solid ${i};
        box-shadow: 0 0 0 4px ${a};
        border-radius: 4px;
        z-index: 2147483000;
        display: none;
        transition: top 0.06s ease, left 0.06s ease, width 0.06s ease, height 0.06s ease;
      }
      
      .fbw-overlay {
        position: fixed;
        inset: 0;
        background: rgba(17,24,39,0.5);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 2147483003;
      }
      
      .fbw-overlay.fbw-open { display: flex; }
      
      .fbw-modal {
        background: #fff;
        border-radius: 14px;
        width: 420px;
        max-width: 92vw;
        max-height: 88vh;
        overflow-y: auto;
        padding: 22px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.35);
      }
      
      .fbw-modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
      .fbw-modal-head h2 { font-size: 16px; margin: 0; color: #111827; font-weight: 700; }
      .fbw-close { background: none; border: none; font-size: 18px; color: #6b7280; cursor: pointer; line-height: 1; padding: 4px; }
      .fbw-close:hover { color: #111827; }
      
      .fbw-field { margin-bottom: 14px; }
      .fbw-field label { display: block; font-size: 12.5px; font-weight: 600; color: #374151; margin-bottom: 5px; }
      
      .fbw-item-box {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 11.5px;
        color: #1f2937;
        background: #f3f4f6;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 8px 10px;
        word-break: break-all;
        max-height: 60px;
        overflow-y: auto;
      }
      
      .fbw-field textarea, .fbw-field input[type="email"], .fbw-field input[type="text"] {
        width: 100%;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        padding: 9px 10px;
        font-size: 13.5px;
        color: #111827;
        resize: vertical;
      }
      
      .fbw-field textarea:focus, .fbw-field input:focus {
        outline: none;
        border-color: ${i};
        box-shadow: 0 0 0 3px ${l};
      }
      
      .fbw-error { color: #dc2626; font-size: 12px; margin: -6px 0 12px; display: none; }
      .fbw-error.fbw-show { display: block; }
      
      .fbw-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }
      
      .fbw-btn {
        border: none;
        border-radius: 8px;
        padding: 9px 16px;
        font-size: 13.5px;
        font-weight: 600;
        cursor: pointer;
      }
      
      .fbw-btn-primary { background: ${i}; color: #fff; }
      .fbw-btn-primary:hover { filter: brightness(1.08); }
      .fbw-btn-ghost { background: none; color: #4b5563; }
      .fbw-btn-ghost:hover { background: #f3f4f6; }
      
      .fbw-toast {
        position: fixed;
        bottom: 22px;
        right: 22px;
        background: ${e};
        color: ${t};
        padding: 11px 16px;
        border-radius: 10px;
        font-size: 13px;
        z-index: 2147483004;
        box-shadow: 0 8px 24px rgba(0,0,0,0.3);
        opacity: 0;
        transform: translateY(6px);
        transition: opacity 0.18s ease, transform 0.18s ease;
        pointer-events: none;
      }
      
      .fbw-toast.fbw-show { opacity: 1; transform: translateY(0); }
      .fbw-hidden { display: none !important; }
    `}hexToRgba(e,t){let i=e.replace("#",""),o=i.length===3?i.split("").map(s=>s+s).join(""):i,n=parseInt(o.substring(0,2),16),a=parseInt(o.substring(2,4),16),l=parseInt(o.substring(4,6),16);return`rgba(${n},${a},${l},${t})`}createMarkup(){let e=document.createElement("div");e.innerHTML=this.getMarkup(),this.root.appendChild(e)}getMarkup(){let{buttonLabel:e,widgetType:t}=this.config;return t==="chatbot"?this.getChatbotMarkup(e):this.getDefaultMarkup(e)}getDefaultMarkup(e){return`
      <button class="fbw-tab" type="button" aria-haspopup="true" aria-expanded="false">${this.escapeHtml(e)}</button>
      <div class="fbw-menu" role="menu">
        <button type="button" data-action="pick-visible" role="menuitem">
          Feedback on this page<small>Select any element you have feedback on</small>
        </button>
        <button type="button" data-action="pick-hidden" role="menuitem">
          Quick feedback<small>General feedback on us</small>
        </button>
      </div>
      <div class="fbw-banner">
        <span>Click an element to select it &middot; Esc to cancel</span>
        <button type="button" data-action="cancel-pick">Cancel</button>
      </div>
      <div class="fbw-highlight"></div>
      <div class="fbw-overlay">
        <div class="fbw-modal" role="dialog" aria-modal="true" aria-labelledby="fbw-modal-title">
          <div class="fbw-modal-head">
            <h2 id="fbw-modal-title">Share feedback</h2>
            <button class="fbw-close" type="button" data-action="close-modal" aria-label="Close">&times;</button>
          </div>
          <form data-role="form">
            <div class="fbw-field" data-role="item-field">
              <label>Selected element</label>
              <div class="fbw-item-box" data-role="item-box"></div>
            </div>
            <div class="fbw-field">
              <label for="fbw-title">Title</label>
              <input id="fbw-title" data-role="title" type="text" placeholder="Brief summary of your feedback" required />
            </div>
            <div class="fbw-field">
              <label for="fbw-feedback">What's going on?</label>
              <textarea id="fbw-feedback" data-role="feedback" rows="4" placeholder="Tell us what you noticed..."></textarea>
            </div>
            <div class="fbw-field">
              <label for="fbw-email">Email</label>
              <input id="fbw-email" data-role="email" type="email" placeholder="you@example.com" required />
            </div>
            <div class="fbw-error" data-role="error"></div>
            <div class="fbw-actions">
              <button type="button" class="fbw-btn fbw-btn-ghost" data-action="close-modal">Cancel</button>
              <button type="submit" class="fbw-btn fbw-btn-primary">Submit</button>
            </div>
          </form>
        </div>
      </div>
      <div class="fbw-toast" data-role="toast"></div>
    `}getChatbotMarkup(e){return`
      <button class="fbw-tab" type="button" aria-haspopup="true" aria-expanded="false">${this.escapeHtml(e)}</button>
      <div class="fbw-menu" role="menu">
        <button type="button" data-action="pick-visible" role="menuitem">
          Feedback on this page<small>Select any element you have feedback on</small>
        </button>
        <button type="button" data-action="pick-hidden" role="menuitem">
          Quick feedback<small>General feedback on us</small>
        </button>
      </div>
      <div class="fbw-banner">
        <span>Click an element to select it &middot; Esc to cancel</span>
        <button type="button" data-action="cancel-pick">Cancel</button>
      </div>
      <div class="fbw-highlight"></div>
      <div class="fbw-overlay">
        <div class="fbw-modal" role="dialog" aria-modal="true" aria-labelledby="fbw-modal-title">
          <div class="fbw-modal-head">
            <h2 id="fbw-modal-title">Share feedback</h2>
            <button class="fbw-close" type="button" data-action="close-modal" aria-label="Close">&times;</button>
          </div>
          <form data-role="form">
            <div class="fbw-field" data-role="item-field">
              <label>Selected element</label>
              <div class="fbw-item-box" data-role="item-box"></div>
            </div>
            <div class="fbw-field">
              <label for="fbw-title">Title</label>
              <input id="fbw-title" data-role="title" type="text" placeholder="Brief summary of your feedback" required />
            </div>
            <div class="fbw-field">
              <label for="fbw-feedback">What's going on?</label>
              <textarea id="fbw-feedback" data-role="feedback" rows="4" placeholder="Tell us what you noticed..."></textarea>
            </div>
            <div class="fbw-field">
              <label for="fbw-email">Email</label>
              <input id="fbw-email" data-role="email" type="email" placeholder="you@example.com" required />
            </div>
            <div class="fbw-error" data-role="error"></div>
            <div class="fbw-actions">
              <button type="button" class="fbw-btn fbw-btn-ghost" data-action="close-modal">Cancel</button>
              <button type="submit" class="fbw-btn fbw-btn-primary">Submit</button>
            </div>
          </form>
        </div>
      </div>
      <div class="fbw-toast" data-role="toast"></div>
    `}escapeHtml(e){let t=document.createElement("div");return t.textContent=e,t.innerHTML}cacheElements(){this.elements={tab:this.root.querySelector(".fbw-tab"),menu:this.root.querySelector(".fbw-menu"),banner:this.root.querySelector(".fbw-banner"),highlight:this.root.querySelector(".fbw-highlight"),overlay:this.root.querySelector(".fbw-overlay"),modal:this.root.querySelector(".fbw-modal"),form:this.root.querySelector('[data-role="form"]'),itemField:this.root.querySelector('[data-role="item-field"]'),itemBox:this.root.querySelector('[data-role="item-box"]'),title:this.root.querySelector('[data-role="title"]'),feedback:this.root.querySelector('[data-role="feedback"]'),email:this.root.querySelector('[data-role="email"]'),error:this.root.querySelector('[data-role="error"]'),toast:this.root.querySelector('[data-role="toast"]')}}attachEventListeners(){this.elements.tab.addEventListener("click",()=>this.onTabClick()),this.elements.menu.addEventListener("click",e=>this.onMenuClick(e)),this.elements.banner.addEventListener("click",e=>this.onBannerClick(e)),this.elements.overlay.addEventListener("click",e=>this.onOverlayClick(e)),this.elements.form.addEventListener("submit",e=>this.onSubmit(e))}onTabClick(){this.state==="menu"?this.closeMenu():this.openMenu()}openMenu(){this.state="menu",this.elements.menu.classList.add("fbw-open"),this.elements.tab.setAttribute("aria-expanded","true"),document.addEventListener("click",this.onOutsideMenuClick,!0)}closeMenu(){this.state==="menu"&&(this.state="idle"),this.elements.menu.classList.remove("fbw-open"),this.elements.tab.setAttribute("aria-expanded","false"),document.removeEventListener("click",this.onOutsideMenuClick,!0)}onOutsideMenuClick=e=>{this.isInsideWidget(e.target)||this.closeMenu()};onMenuClick(e){let t=e.target.closest("button[data-action]");if(!t)return;let i=t.getAttribute("data-action");i==="pick-visible"&&this.startPicking(!0),i==="pick-hidden"&&(this.showItemInForm=!1,this.closeMenu(),this.openModal())}startPicking(e){this.showItemInForm=e,this.closeMenu(),this.state="picking",this.elements.banner.classList.add("fbw-open"),document.addEventListener("mousemove",this.onHoverMove,!0),document.addEventListener("click",this.onDocumentClickCapture,!0),document.addEventListener("keydown",this.onKeyDownCapture,!0),document.addEventListener("scroll",this.onScrollOrResize,!0),window.addEventListener("resize",this.onScrollOrResize,!0)}stopPicking(){this.elements.banner.classList.remove("fbw-open"),document.removeEventListener("mousemove",this.onHoverMove,!0),document.removeEventListener("scroll",this.onScrollOrResize,!0),window.removeEventListener("resize",this.onScrollOrResize,!0)}onBannerClick(e){e.target.closest('[data-action="cancel-pick"]')&&this.cancelAll()}onHoverMove=e=>{this.isInsideWidget(e.target)||(this.hoverRafId&&cancelAnimationFrame(this.hoverRafId),this.hoverRafId=requestAnimationFrame(()=>{this.positionHighlight(e.target)}))};positionHighlight(e){let t=e.getBoundingClientRect();this.elements.highlight.style.display="block",this.elements.highlight.style.top=`${t.top}px`,this.elements.highlight.style.left=`${t.left}px`,this.elements.highlight.style.width=`${t.width}px`,this.elements.highlight.style.height=`${t.height}px`}onScrollOrResize=()=>{this.selectedEl&&this.state==="review"&&this.positionHighlight(this.selectedEl)};onDocumentClickCapture=e=>{this.isInsideWidget(e.target)||(e.preventDefault(),e.stopPropagation(),typeof e.stopImmediatePropagation=="function"&&e.stopImmediatePropagation(),this.state==="picking"&&this.finalizeSelection(e.target))};onKeyDownCapture=e=>{e.key==="Escape"&&(e.preventDefault(),this.cancelAll())};finalizeSelection(e){this.selectedEl=e,this.selectedSelector=this.getUniqueSelector(e),this.stopPicking(),this.positionHighlight(e),this.openModal()}getUniqueSelector(e){if(!(e instanceof Element))return null;if(e.id){let o=`#${this.cssEscape(e.id)}`;if(this.safeQueryCount(o)===1)return o}let t=[],i=e;for(;i&&i.nodeType===1&&i!==document.documentElement;){let o=i.tagName.toLowerCase();if(i.id){o=`#${this.cssEscape(i.id)}`,t.unshift(o);break}let n=Array.from(i.classList).filter(s=>!!s);n.length&&(o+="."+n.map(this.cssEscape).join("."));let a=i.parentElement;if(a){let s=Array.from(a.children).filter(d=>d.tagName===i.tagName);if(s.length>1){let d=s.indexOf(i)+1;o+=`:nth-of-type(${d})`}}t.unshift(o);let l=t.join(" > ");if(this.safeQueryCount(l)===1)return l;i=a||null}return t.join(" > ")}cssEscape(e){return window.CSS&&window.CSS.escape?window.CSS.escape(e):String(e).replace(/([ #.;?%&,.+*~':"!^$[\]()=>|/])/g,"\\$1")}safeQueryCount(e){try{return document.querySelectorAll(e).length}catch{return-1}}openModal(){this.state="review",this.elements.error.classList.remove("fbw-show"),this.elements.form.reset(),this.showItemInForm?(this.elements.itemField.classList.remove("fbw-hidden"),this.elements.itemBox.textContent=this.selectedSelector||"(none)"):this.elements.itemField.classList.add("fbw-hidden"),this.elements.overlay.classList.add("fbw-open"),setTimeout(()=>this.elements.feedback.focus(),30)}closeModal(){this.elements.overlay.classList.remove("fbw-open")}cancelAll(){this.stopPicking(),this.closeModal(),this.elements.highlight.style.display="none",document.removeEventListener("click",this.onDocumentClickCapture,!0),document.removeEventListener("keydown",this.onKeyDownCapture,!0),this.selectedEl=null,this.selectedSelector=null,this.state="idle"}onOverlayClick(e){e.target.closest('[data-action="close-modal"]')&&this.cancelAll()}onSubmit(e){e.preventDefault();let t=this.elements.title.value.trim(),i=this.elements.feedback.value.trim(),o=this.elements.email.value.trim(),n=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(o);if(!t||!n){this.elements.error.textContent=t?"Please enter a valid email address.":"Please add a title before submitting.",this.elements.error.classList.add("fbw-show");return}let a={optionType:this.showItemInForm?"page_item_visible":"page_item_hidden",elementSelector:this.selectedSelector,pageUrl:window.location.href,pageTitle:document.title,title:t,feedback:i,email:o,submittedAt:new Date().toISOString()};this.submitFeedback(a)}prepareMessageBody(e){let t=e.email,i=e.title,o=e.feedback||"(No additional details provided)",n=e.pageTitle,a=`${o}

Page: ${n}
URL: ${e.pageUrl}
Selector: ${e.elementSelector}
Option: ${e.optionType}
Submitted: ${e.submittedAt}`;return{title:i,body:a,user_handle:t}}submitFeedback(e){if(window.dispatchEvent(new CustomEvent("feedbackwidget:submit",{detail:e})),this.apiKey){let t=this.prepareMessageBody(e);fetch(this.endPoint,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.apiKey}`},body:JSON.stringify(t)}).catch(()=>{})}this.cancelAll(),this.showToast("Thanks for the feedback!")}showToast(e){this.elements.toast.textContent=e,this.elements.toast.classList.add("fbw-show"),setTimeout(()=>this.elements.toast.classList.remove("fbw-show"),2400)}isInsideWidget(e){return e===this.host||this.host.contains(e)}open(e="visible"){this.startPicking(e==="visible")}close(){this.cancelAll()}destroy(){this.cancelAll(),this.host.remove()}};return g(w);})();
/*!
 * Feedback Capture Widget - TypeScript Implementation
 * Class-based, configurable widget with style isolation via Shadow DOM
 * Supports multiple widget types (default, chatbot) and positioning (left, right)
 */
