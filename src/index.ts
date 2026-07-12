/*!
 * Feedback Capture Widget - TypeScript Implementation
 * Class-based, configurable widget with style isolation via Shadow DOM
 * Supports multiple widget types (default, chatbot) and positioning (left, right)
 */

// ============================================================================
// Type Definitions
// ============================================================================

type WidgetPosition = 'left' | 'right';
type WidgetType = 'default' | 'chatbot';
type WidgetState = 'idle' | 'menu' | 'picking' | 'review';

interface FeedbackWidgetConfig {
    buttonLabel?: string;
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
    font?: string;
    position?: WidgetPosition;
    widgetType?: WidgetType;
}

interface FeedbackPayload {
    optionType: 'page_item_visible' | 'page_item_hidden';
    elementSelector: string | null;
    pageUrl: string;
    pageTitle: string;
    title: string;
    feedback: string;
    email: string;
    submittedAt: string;
}

interface FeedbackMessageBody {
    title: string;
    body: string;
    user_handle: string;
}

interface ElementRefs {
    tab: HTMLElement;
    menu: HTMLElement;
    banner: HTMLElement;
    highlight: HTMLElement;
    overlay: HTMLElement;
    modal: HTMLElement;
    form: HTMLFormElement;
    itemField: HTMLElement;
    itemBox: HTMLElement;
    title: HTMLInputElement;
    feedback: HTMLTextAreaElement;
    email: HTMLInputElement;
    error: HTMLElement;
    toast: HTMLElement;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<FeedbackWidgetConfig> = {
    buttonLabel: 'Feedback',
    backgroundColor: '#111827',
    textColor: '#ffffff',
    accentColor: '#2F6FED',
    font: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    position: 'right',
    widgetType: 'default'
};

// ============================================================================
// FeedbackWidget Class
// ============================================================================

class FeedbackWidget {
    private config: Required<FeedbackWidgetConfig>;
    private host!: HTMLElement;
    private root!: ShadowRoot;
    private elements!: ElementRefs;
    private state: WidgetState;
    private showItemInForm: boolean;
    private selectedSelector: string | null;
    private selectedEl: Element | null;
    private hoverRafId: number | null;
    private hostId: string;

    constructor(config: FeedbackWidgetConfig = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.hostId = `feedback-widget-host-${Math.random().toString(36).substr(2, 9)}`;
        this.state = 'idle';
        this.showItemInForm = true;
        this.selectedSelector = null;
        this.selectedEl = null;
        this.hoverRafId = null;

        this.initialize();
    }

    private initialize(): void {
        this.createHostAndShadow();
        this.injectStyles();
        this.createMarkup();
        this.cacheElements();
        this.attachEventListeners();
    }

    // -------------------------------------------------------------------------
    // Shadow DOM Setup
    // -------------------------------------------------------------------------

    private createHostAndShadow(): void {
        this.host = document.createElement('div');
        this.host.id = this.hostId;
        document.documentElement.appendChild(this.host);
        this.root = this.host.attachShadow({ mode: 'open' });
    }

    // -------------------------------------------------------------------------
    // CSS Generation (Dynamic based on config)
    // -------------------------------------------------------------------------

    private injectStyles(): void {
        const css = this.generateCSS();
        const styleEl = document.createElement('style');
        styleEl.textContent = css;
        this.root.appendChild(styleEl);
    }

    private generateCSS(): string {
        const { backgroundColor, textColor, accentColor, font, position } = this.config;
        const accentRgba = this.hexToRgba(accentColor, 0.22);
        const accentFocusRgba = this.hexToRgba(accentColor, 0.15);

        // Position-specific styles
        const tabTransform = position === 'right'
            ? 'translateY(-50%) rotate(180deg)'
            : 'translateY(-50%)';
        const tabBorderRadius = position === 'right'
            ? '8px 0 0 8px'
            : '0 8px 8px 0';
        const tabRight = position === 'right' ? '0' : 'auto';
        const tabLeft = position === 'left' ? '0' : 'auto';
        const menuRight = position === 'right' ? '46px' : 'auto';
        const menuLeft = position === 'left' ? '46px' : 'auto';

        return `
      :host { all: initial; }
      * { box-sizing: border-box; font-family: ${font}; }
      
      .fbw-tab {
        position: fixed;
        top: 50%;
        ${position === 'right' ? 'right' : 'left'}: 0;
        transform: ${tabTransform};
        background: ${backgroundColor};
        color: ${textColor};
        writing-mode: vertical-rl;
        text-orientation: mixed;
        padding: 14px 9px;
        border-radius: ${tabBorderRadius};
        cursor: pointer;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0.03em;
        box-shadow: ${position === 'right' ? '-2px' : '2px'} 0 10px rgba(0,0,0,0.18);
        z-index: 2147483000;
        border: none;
        user-select: none;
        transition: padding 0.12s ease, background 0.12s ease;
      }
      
      .fbw-tab:hover { padding-right: 13px; background: #1f2937; }
      .fbw-tab:focus-visible { outline: 2px solid ${accentColor}; outline-offset: 2px; }
      
      .fbw-menu {
        position: fixed;
        top: 50%;
        right: ${menuRight};
        left: ${menuLeft};
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
        background: ${backgroundColor};
        color: ${textColor};
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
        color: ${textColor};
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
        border: 2px solid ${accentColor};
        box-shadow: 0 0 0 4px ${accentRgba};
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
        border-color: ${accentColor};
        box-shadow: 0 0 0 3px ${accentFocusRgba};
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
      
      .fbw-btn-primary { background: ${accentColor}; color: #fff; }
      .fbw-btn-primary:hover { filter: brightness(1.08); }
      .fbw-btn-ghost { background: none; color: #4b5563; }
      .fbw-btn-ghost:hover { background: #f3f4f6; }
      
      .fbw-toast {
        position: fixed;
        bottom: 22px;
        right: 22px;
        background: ${backgroundColor};
        color: ${textColor};
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
    `;
    }

    private hexToRgba(hex: string, alpha: number): string {
        const h = hex.replace('#', '');
        const expanded = h.length === 3
            ? h.split('').map((c) => c + c).join('')
            : h;
        const r = parseInt(expanded.substring(0, 2), 16);
        const g = parseInt(expanded.substring(2, 4), 16);
        const b = parseInt(expanded.substring(4, 6), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    // -------------------------------------------------------------------------
    // Markup Creation
    // -------------------------------------------------------------------------

    private createMarkup(): void {
        const wrap = document.createElement('div');
        wrap.innerHTML = this.getMarkup();
        this.root.appendChild(wrap);
    }

    private getMarkup(): string {
        const { buttonLabel, widgetType } = this.config;

        if (widgetType === 'chatbot') {
            return this.getChatbotMarkup(buttonLabel);
        }

        return this.getDefaultMarkup(buttonLabel);
    }

    private getDefaultMarkup(buttonLabel: string): string {
        return `
      <button class="fbw-tab" type="button" aria-haspopup="true" aria-expanded="false">${this.escapeHtml(buttonLabel)}</button>
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
    `;
    }

    private getChatbotMarkup(buttonLabel: string): string {
        // Placeholder for chatbot interface - can be expanded later
        return `
      <button class="fbw-tab" type="button" aria-haspopup="true" aria-expanded="false">${this.escapeHtml(buttonLabel)}</button>
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
    `;
    }

    private escapeHtml(s: string): string {
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    // -------------------------------------------------------------------------
    // Element Caching
    // -------------------------------------------------------------------------

    private cacheElements(): void {
        this.elements = {
            tab: this.root.querySelector('.fbw-tab')!,
            menu: this.root.querySelector('.fbw-menu')!,
            banner: this.root.querySelector('.fbw-banner')!,
            highlight: this.root.querySelector('.fbw-highlight')!,
            overlay: this.root.querySelector('.fbw-overlay')!,
            modal: this.root.querySelector('.fbw-modal')!,
            form: this.root.querySelector('[data-role="form"]')!,
            itemField: this.root.querySelector('[data-role="item-field"]')!,
            itemBox: this.root.querySelector('[data-role="item-box"]')!,
            title: this.root.querySelector('[data-role="title"]')!,
            feedback: this.root.querySelector('[data-role="feedback"]')!,
            email: this.root.querySelector('[data-role="email"]')!,
            error: this.root.querySelector('[data-role="error"]')!,
            toast: this.root.querySelector('[data-role="toast"]')!
        };
    }

    // -------------------------------------------------------------------------
    // Event Listeners
    // -------------------------------------------------------------------------

    private attachEventListeners(): void {
        this.elements.tab.addEventListener('click', () => this.onTabClick());
        this.elements.menu.addEventListener('click', (e) => this.onMenuClick(e));
        this.elements.banner.addEventListener('click', (e) => this.onBannerClick(e));
        this.elements.overlay.addEventListener('click', (e) => this.onOverlayClick(e));
        this.elements.form.addEventListener('submit', (e) => this.onSubmit(e));
    }

    // -------------------------------------------------------------------------
    // Menu Handlers
    // -------------------------------------------------------------------------

    private onTabClick(): void {
        this.state === 'menu' ? this.closeMenu() : this.openMenu();
    }

    private openMenu(): void {
        this.state = 'menu';
        this.elements.menu.classList.add('fbw-open');
        this.elements.tab.setAttribute('aria-expanded', 'true');
        document.addEventListener('click', this.onOutsideMenuClick, true);
    }

    private closeMenu(): void {
        if (this.state === 'menu') this.state = 'idle';
        this.elements.menu.classList.remove('fbw-open');
        this.elements.tab.setAttribute('aria-expanded', 'false');
        document.removeEventListener('click', this.onOutsideMenuClick, true);
    }

    private onOutsideMenuClick = (e: Event): void => {
        if (!this.isInsideWidget(e.target as HTMLElement)) this.closeMenu();
    };

    private onMenuClick(e: Event): void {
        const btn = (e.target as HTMLElement).closest('button[data-action]');
        if (!btn) return;

        const action = btn.getAttribute('data-action');
        if (action === 'pick-visible') this.startPicking(true);
        if (action === 'pick-hidden') {
            this.showItemInForm = false;
            this.closeMenu();
            this.openModal();
        }
    }

    // -------------------------------------------------------------------------
    // Picking Mode
    // -------------------------------------------------------------------------

    private startPicking(showItem: boolean): void {
        this.showItemInForm = showItem;
        this.closeMenu();
        this.state = 'picking';
        this.elements.banner.classList.add('fbw-open');
        document.addEventListener('mousemove', this.onHoverMove, true);
        document.addEventListener('click', this.onDocumentClickCapture, true);
        document.addEventListener('keydown', this.onKeyDownCapture, true);
        document.addEventListener('scroll', this.onScrollOrResize, true);
        window.addEventListener('resize', this.onScrollOrResize, true);
    }

    private stopPicking(): void {
        this.elements.banner.classList.remove('fbw-open');
        document.removeEventListener('mousemove', this.onHoverMove, true);
        document.removeEventListener('scroll', this.onScrollOrResize, true);
        window.removeEventListener('resize', this.onScrollOrResize, true);
    }

    private onBannerClick(e: Event): void {
        if ((e.target as HTMLElement).closest('[data-action="cancel-pick"]')) {
            this.cancelAll();
        }
    }

    private onHoverMove = (e: MouseEvent): void => {
        if (this.isInsideWidget(e.target as HTMLElement)) return;
        if (this.hoverRafId) cancelAnimationFrame(this.hoverRafId);
        this.hoverRafId = requestAnimationFrame(() => {
            this.positionHighlight(e.target as Element);
        });
    };

    private positionHighlight(target: Element): void {
        const r = target.getBoundingClientRect();
        this.elements.highlight.style.display = 'block';
        this.elements.highlight.style.top = `${r.top}px`;
        this.elements.highlight.style.left = `${r.left}px`;
        this.elements.highlight.style.width = `${r.width}px`;
        this.elements.highlight.style.height = `${r.height}px`;
    }

    private onScrollOrResize = (): void => {
        if (this.selectedEl && this.state === 'review') {
            this.positionHighlight(this.selectedEl);
        }
    };

    private onDocumentClickCapture = (e: Event): void => {
        if (this.isInsideWidget(e.target as HTMLElement)) return;
        e.preventDefault();
        e.stopPropagation();
        if (typeof (e as any).stopImmediatePropagation === 'function') {
            (e as any).stopImmediatePropagation();
        }

        if (this.state === 'picking') {
            this.finalizeSelection(e.target as Element);
        }
    };

    private onKeyDownCapture = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') {
            e.preventDefault();
            this.cancelAll();
        }
    };

    private finalizeSelection(target: Element): void {
        this.selectedEl = target;
        this.selectedSelector = this.getUniqueSelector(target);
        this.stopPicking();
        this.positionHighlight(target);
        this.openModal();
    }

    // -------------------------------------------------------------------------
    // Unique Selector Generation
    // -------------------------------------------------------------------------

    private getUniqueSelector(node: Node): string | null {
        if (!(node instanceof Element)) return null;

        if (node.id) {
            const idSel = `#${this.cssEscape(node.id)}`;
            if (this.safeQueryCount(idSel) === 1) return idSel;
        }

        const parts: string[] = [];
        let current: Element | null = node;

        while (current && current.nodeType === 1 && current !== document.documentElement) {
            let part = current.tagName.toLowerCase();

            if (current.id) {
                part = `#${this.cssEscape(current.id)}`;
                parts.unshift(part);
                break;
            }

            const classes = Array.from(current.classList).filter((c) => !!c);
            if (classes.length) {
                part += '.' + classes.map(this.cssEscape).join('.');
            }

            const parent: Element | null = current.parentElement;
            if (parent) {
                const sameTagSiblings = Array.from(parent.children).filter(
                    (s: Element) => s.tagName === current!.tagName
                );
                if (sameTagSiblings.length > 1) {
                    const idx = sameTagSiblings.indexOf(current!) + 1;
                    part += `:nth-of-type(${idx})`;
                }
            }

            parts.unshift(part);

            const testSelector = parts.join(' > ');
            if (this.safeQueryCount(testSelector) === 1) return testSelector;

            current = parent || null;
        }

        return parts.join(' > ');
    }

    private cssEscape(str: string): string {
        if (window.CSS && (window.CSS as any).escape) {
            return (window.CSS as any).escape(str);
        }
        return String(str).replace(/([ #.;?%&,.+*~':"!^$[\]()=>|/])/g, '\\$1');
    }

    private safeQueryCount(selector: string): number {
        try {
            return document.querySelectorAll(selector).length;
        } catch (err) {
            return -1;
        }
    }

    // -------------------------------------------------------------------------
    // Modal Handlers
    // -------------------------------------------------------------------------

    private openModal(): void {
        this.state = 'review';
        this.elements.error.classList.remove('fbw-show');
        this.elements.form.reset();

        if (this.showItemInForm) {
            this.elements.itemField.classList.remove('fbw-hidden');
            this.elements.itemBox.textContent = this.selectedSelector || '(none)';
        } else {
            this.elements.itemField.classList.add('fbw-hidden');
        }

        this.elements.overlay.classList.add('fbw-open');
        setTimeout(() => this.elements.feedback.focus(), 30);
    }

    private closeModal(): void {
        this.elements.overlay.classList.remove('fbw-open');
    }

    private cancelAll(): void {
        this.stopPicking();
        this.closeModal();
        this.elements.highlight.style.display = 'none';
        document.removeEventListener('click', this.onDocumentClickCapture, true);
        document.removeEventListener('keydown', this.onKeyDownCapture, true);
        this.selectedEl = null;
        this.selectedSelector = null;
        this.state = 'idle';
    }

    private onOverlayClick(e: Event): void {
        const actionBtn = (e.target as HTMLElement).closest('[data-action="close-modal"]');
        if (actionBtn) this.cancelAll();
    }

    // -------------------------------------------------------------------------
    // Form Submission
    // -------------------------------------------------------------------------

    private onSubmit(e: Event): void {
        e.preventDefault();
        const title = this.elements.title.value.trim();
        const feedback = this.elements.feedback.value.trim();
        const email = this.elements.email.value.trim();
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!title || !emailOk) {
            this.elements.error.textContent = !title
                ? 'Please add a title before submitting.'
                : 'Please enter a valid email address.';
            this.elements.error.classList.add('fbw-show');
            return;
        }

        const payload: FeedbackPayload = {
            optionType: this.showItemInForm ? 'page_item_visible' : 'page_item_hidden',
            elementSelector: this.selectedSelector,
            pageUrl: window.location.href,
            pageTitle: document.title,
            title,
            feedback,
            email,
            submittedAt: new Date().toISOString()
        };

        this.submitFeedback(payload);
    }

    private prepareMessageBody(payload: FeedbackPayload): FeedbackMessageBody {
        const user_handle = payload.email;
        const feedbackTitle = payload.title;
        const feedbackBody = payload.feedback || '(No additional details provided)';
        const pageTitle = payload.pageTitle;
        const message = `${feedbackBody}\n\nPage: ${pageTitle}\nURL: ${payload.pageUrl}\nSelector: ${payload.elementSelector}\nOption: ${payload.optionType}\nSubmitted: ${payload.submittedAt}`;


        return {
            title: feedbackTitle,
            body: message,
            user_handle: user_handle
        };
    }

    private submitFeedback(payload: FeedbackPayload): void {
        const messageBody = this.prepareMessageBody(payload);
        window.dispatchEvent(new CustomEvent('feedbackwidget:submit', { detail: messageBody }));

        this.cancelAll();
        this.showToast('Thanks for the feedback!');
    }

    private showToast(message: string): void {
        this.elements.toast.textContent = message;
        this.elements.toast.classList.add('fbw-show');
        setTimeout(() => this.elements.toast.classList.remove('fbw-show'), 2400);
    }

    // -------------------------------------------------------------------------
    // Helper Methods
    // -------------------------------------------------------------------------

    private isInsideWidget(target: HTMLElement): boolean {
        return target === this.host || this.host.contains(target);
    }

    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------

    public open(mode: 'visible' | 'hidden' = 'visible'): void {
        this.startPicking(mode === 'visible');
    }

    public close(): void {
        this.cancelAll();
    }

    public destroy(): void {
        this.cancelAll();
        this.host.remove();
    }
}

// ============================================================================
// Export
// ============================================================================

export { FeedbackWidget };
export type { FeedbackWidgetConfig, FeedbackPayload, WidgetPosition, WidgetType };