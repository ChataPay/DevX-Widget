/*!
 * Feedback Capture Widget
 * Drop-in, dependency-free widget: a side tab that opens two feedback flows.
 *   1. "Feedback on this page"  -> pick an element, item selector shown in form
 *   2. "Quick feedback"         -> pick an element, item selector hidden in form
 * Both flows freeze the host page (preventDefault on all outside interactions)
 * while an element is being picked and while the modal is open.
 *
 * Usage:
 *   <script src="feedback-widget.js"></script>
 *   <script>
 *     window.FeedbackWidgetConfig = {
 *       endpoint: 'https://your-api.example.com/feedback', // optional
 *       buttonLabel: 'Feedback',                            // optional
 *       accentColor: '#2F6FED'                               // optional
 *     };
 *   </script>
 *
 * Listen for submissions from anywhere on the page:
 *   window.addEventListener('feedbackwidget:submit', (e) => console.log(e.detail));
 */
(function () {
  'use strict';

  if (window.__feedbackWidgetLoaded) return;
  window.__feedbackWidgetLoaded = true;

  var config = window.FeedbackWidgetConfig || {};
  var ENDPOINT = config.endpoint || null;
  var BUTTON_LABEL = config.buttonLabel || 'Feedback';
  var ACCENT = config.accentColor || '#2F6FED';

  // ---------------------------------------------------------------------
  // Host + Shadow root (style isolation from the page we're embedded in)
  // ---------------------------------------------------------------------
  var host = document.createElement('div');
  host.id = 'feedback-widget-host';
  document.documentElement.appendChild(host);
  var root = host.attachShadow({ mode: 'open' });

  var css = ''
    + ':host { all: initial; }'
    + '* { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }'
    + '.fbw-tab {'
    + '  position: fixed; top: 50%; right: 0; transform: translateY(-50%);'
    + '  background: #111827; color: #fff; writing-mode: vertical-rl; text-orientation: mixed;'
    + '  transform: translateY(-50%) rotate(180deg);'
    + '  padding: 14px 9px; border-radius: 8px 0 0 8px; cursor: pointer;'
    + '  font-size: 13px; font-weight: 600; letter-spacing: 0.03em;'
    + '  box-shadow: -2px 0 10px rgba(0,0,0,0.18); z-index: 2147483000;'
    + '  border: none; user-select: none; transition: padding 0.12s ease, background 0.12s ease;'
    + '}'
    + '.fbw-tab:hover { padding-right: 13px; background: #1f2937; }'
    + '.fbw-tab:focus-visible { outline: 2px solid ' + ACCENT + '; outline-offset: 2px; }'
    + '.fbw-menu {'
    + '  position: fixed; top: 50%; right: 46px; transform: translateY(-50%);'
    + '  background: #fff; border-radius: 10px; box-shadow: 0 8px 30px rgba(0,0,0,0.22);'
    + '  padding: 6px; min-width: 220px; z-index: 2147483001; display: none;'
    + '  border: 1px solid #e5e7eb;'
    + '}'
    + '.fbw-menu.fbw-open { display: block; }'
    + '.fbw-menu button {'
    + '  display: block; width: 100%; text-align: left; background: none; border: none;'
    + '  padding: 10px 12px; font-size: 13.5px; color: #111827; border-radius: 6px; cursor: pointer;'
    + '}'
    + '.fbw-menu button:hover { background: #f3f4f6; }'
    + '.fbw-menu button small { display: block; color: #6b7280; font-weight: 400; margin-top: 2px; font-size: 11.5px; }'
    + '.fbw-banner {'
    + '  position: fixed; top: 18px; left: 50%; transform: translateX(-50%);'
    + '  background: #111827; color: #fff; padding: 10px 10px 10px 16px; border-radius: 999px;'
    + '  font-size: 13px; display: none; align-items: center; gap: 10px; z-index: 2147483002;'
    + '  box-shadow: 0 8px 24px rgba(0,0,0,0.25);'
    + '}'
    + '.fbw-banner.fbw-open { display: flex; }'
    + '.fbw-banner button {'
    + '  background: rgba(255,255,255,0.12); color: #fff; border: none; padding: 6px 12px;'
    + '  border-radius: 999px; font-size: 12px; cursor: pointer;'
    + '}'
    + '.fbw-banner button:hover { background: rgba(255,255,255,0.22); }'
    + '.fbw-highlight {'
    + '  position: fixed; pointer-events: none; border: 2px solid ' + ACCENT + ';'
    + '  box-shadow: 0 0 0 4px ' + hexToRgba(ACCENT, 0.22) + '; border-radius: 4px;'
    + '  z-index: 2147483000; display: none; transition: top 0.06s ease, left 0.06s ease, width 0.06s ease, height 0.06s ease;'
    + '}'
    + '.fbw-overlay {'
    + '  position: fixed; inset: 0; background: rgba(17,24,39,0.5);'
    + '  display: none; align-items: center; justify-content: center; z-index: 2147483003;'
    + '}'
    + '.fbw-overlay.fbw-open { display: flex; }'
    + '.fbw-modal {'
    + '  background: #fff; border-radius: 14px; width: 420px; max-width: 92vw;'
    + '  max-height: 88vh; overflow-y: auto; padding: 22px; box-shadow: 0 20px 60px rgba(0,0,0,0.35);'
    + '}'
    + '.fbw-modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }'
    + '.fbw-modal-head h2 { font-size: 16px; margin: 0; color: #111827; font-weight: 700; }'
    + '.fbw-close { background: none; border: none; font-size: 18px; color: #6b7280; cursor: pointer; line-height: 1; padding: 4px; }'
    + '.fbw-close:hover { color: #111827; }'
    + '.fbw-field { margin-bottom: 14px; }'
    + '.fbw-field label { display: block; font-size: 12.5px; font-weight: 600; color: #374151; margin-bottom: 5px; }'
    + '.fbw-item-box {'
    + '  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; color: #1f2937;'
    + '  background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 10px;'
    + '  word-break: break-all; max-height: 60px; overflow-y: auto;'
    + '}'
    + '.fbw-field textarea, .fbw-field input[type="email"] {'
    + '  width: 100%; border: 1px solid #d1d5db; border-radius: 8px; padding: 9px 10px; font-size: 13.5px;'
    + '  color: #111827; resize: vertical;'
    + '}'
    + '.fbw-field textarea:focus, .fbw-field input:focus { outline: none; border-color: ' + ACCENT + '; box-shadow: 0 0 0 3px ' + hexToRgba(ACCENT, 0.15) + '; }'
    + '.fbw-error { color: #dc2626; font-size: 12px; margin: -6px 0 12px; display: none; }'
    + '.fbw-error.fbw-show { display: block; }'
    + '.fbw-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 4px; }'
    + '.fbw-btn { border: none; border-radius: 8px; padding: 9px 16px; font-size: 13.5px; font-weight: 600; cursor: pointer; }'
    + '.fbw-btn-primary { background: ' + ACCENT + '; color: #fff; }'
    + '.fbw-btn-primary:hover { filter: brightness(1.08); }'
    + '.fbw-btn-ghost { background: none; color: #4b5563; }'
    + '.fbw-btn-ghost:hover { background: #f3f4f6; }'
    + '.fbw-toast {'
    + '  position: fixed; bottom: 22px; right: 22px; background: #111827; color: #fff;'
    + '  padding: 11px 16px; border-radius: 10px; font-size: 13px; z-index: 2147483004;'
    + '  box-shadow: 0 8px 24px rgba(0,0,0,0.3); opacity: 0; transform: translateY(6px);'
    + '  transition: opacity 0.18s ease, transform 0.18s ease; pointer-events: none;'
    + '}'
    + '.fbw-toast.fbw-show { opacity: 1; transform: translateY(0); }'
    + '.fbw-hidden { display: none !important; }';

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  root.appendChild(styleEl);

  function hexToRgba(hex, alpha) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var r = parseInt(h.substring(0, 2), 16);
    var g = parseInt(h.substring(2, 4), 16);
    var b = parseInt(h.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  // ---------------------------------------------------------------------
  // Markup
  // ---------------------------------------------------------------------
  var wrap = document.createElement('div');
  wrap.innerHTML = ''
    + '<button class="fbw-tab" type="button" aria-haspopup="true" aria-expanded="false">' + escapeHtml(BUTTON_LABEL) + '</button>'
    + '<div class="fbw-menu" role="menu">'
    + '  <button type="button" data-action="pick-visible" role="menuitem">'
    + '    Feedback on this page<small>Select any element you have feedback on</small>'
    + '  </button>'
    + '  <button type="button" data-action="pick-hidden" role="menuitem">'
    + '    Quick feedback<small>General feedback on us</small>'
    + '  </button>'
    + '</div>'
    + '<div class="fbw-banner">'
    + '  <span>Click an element to select it &middot; Esc to cancel</span>'
    + '  <button type="button" data-action="cancel-pick">Cancel</button>'
    + '</div>'
    + '<div class="fbw-highlight"></div>'
    + '<div class="fbw-overlay">'
    + '  <div class="fbw-modal" role="dialog" aria-modal="true" aria-labelledby="fbw-modal-title">'
    + '    <div class="fbw-modal-head">'
    + '      <h2 id="fbw-modal-title">Share feedback</h2>'
    + '      <button class="fbw-close" type="button" data-action="close-modal" aria-label="Close">&times;</button>'
    + '    </div>'
    + '    <form data-role="form">'
    + '      <div class="fbw-field" data-role="item-field">'
    + '        <label>Selected element</label>'
    + '        <div class="fbw-item-box" data-role="item-box"></div>'
    + '      </div>'
    + '      <div class="fbw-field">'
    + '        <label for="fbw-feedback">What\'s going on?</label>'
    + '        <textarea id="fbw-feedback" data-role="feedback" rows="4" placeholder="Tell us what you noticed..." required></textarea>'
    + '      </div>'
    + '      <div class="fbw-field">'
    + '        <label for="fbw-email">Email</label>'
    + '        <input id="fbw-email" data-role="email" type="email" placeholder="you@example.com" required />'
    + '      </div>'
    + '      <div class="fbw-error" data-role="error"></div>'
    + '      <div class="fbw-actions">'
    + '        <button type="button" class="fbw-btn fbw-btn-ghost" data-action="close-modal">Cancel</button>'
    + '        <button type="submit" class="fbw-btn fbw-btn-primary">Submit</button>'
    + '      </div>'
    + '    </form>'
    + '  </div>'
    + '</div>'
    + '<div class="fbw-toast" data-role="toast"></div>';
  root.appendChild(wrap);

  function escapeHtml(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // ---------------------------------------------------------------------
  // Element refs
  // ---------------------------------------------------------------------
  var el = {
    tab: root.querySelector('.fbw-tab'),
    menu: root.querySelector('.fbw-menu'),
    banner: root.querySelector('.fbw-banner'),
    highlight: root.querySelector('.fbw-highlight'),
    overlay: root.querySelector('.fbw-overlay'),
    modal: root.querySelector('.fbw-modal'),
    form: root.querySelector('[data-role="form"]'),
    itemField: root.querySelector('[data-role="item-field"]'),
    itemBox: root.querySelector('[data-role="item-box"]'),
    feedback: root.querySelector('[data-role="feedback"]'),
    email: root.querySelector('[data-role="email"]'),
    error: root.querySelector('[data-role="error"]'),
    toast: root.querySelector('[data-role="toast"]')
  };

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
  var STATE = { IDLE: 'idle', MENU: 'menu', PICKING: 'picking', REVIEW: 'review' };
  var state = STATE.IDLE;
  var showItemInForm = true;
  var selectedSelector = null;
  var selectedEl = null;
  var hoverRafId = null;

  function isInsideWidget(target) {
    return target === host || host.contains(target);
  }

  // ---------------------------------------------------------------------
  // Menu
  // ---------------------------------------------------------------------
  el.tab.addEventListener('click', function () {
    state === STATE.MENU ? closeMenu() : openMenu();
  });

  function openMenu() {
    state = STATE.MENU;
    el.menu.classList.add('fbw-open');
    el.tab.setAttribute('aria-expanded', 'true');
    document.addEventListener('click', onOutsideMenuClick, true);
  }
  function closeMenu() {
    if (state === STATE.MENU) state = STATE.IDLE;
    el.menu.classList.remove('fbw-open');
    el.tab.setAttribute('aria-expanded', 'false');
    document.removeEventListener('click', onOutsideMenuClick, true);
  }
  function onOutsideMenuClick(e) {
    if (!isInsideWidget(e.target)) closeMenu();
  }

  el.menu.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'pick-visible') startPicking(true);
    if (btn.dataset.action === 'pick-hidden') {
      showItemInForm = false;
      closeMenu();
      openModal();
    }
  });

  // ---------------------------------------------------------------------
  // Picking mode (freezes the page, tracks hover, captures selection)
  // ---------------------------------------------------------------------
  function startPicking(showItem) {
    showItemInForm = showItem;
    closeMenu();
    state = STATE.PICKING;
    el.banner.classList.add('fbw-open');
    document.addEventListener('mousemove', onHoverMove, true);
    document.addEventListener('click', onDocumentClickCapture, true);
    document.addEventListener('keydown', onKeyDownCapture, true);
    document.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize, true);
  }

  function stopPicking() {
    el.banner.classList.remove('fbw-open');
    document.removeEventListener('mousemove', onHoverMove, true);
    document.removeEventListener('scroll', onScrollOrResize, true);
    window.removeEventListener('resize', onScrollOrResize, true);
  }

  el.banner.addEventListener('click', function (e) {
    if (e.target.closest('[data-action="cancel-pick"]')) cancelAll();
  });

  function onHoverMove(e) {
    if (isInsideWidget(e.target)) return;
    if (hoverRafId) cancelAnimationFrame(hoverRafId);
    hoverRafId = requestAnimationFrame(function () {
      positionHighlight(e.target);
    });
  }

  function positionHighlight(target) {
    var r = target.getBoundingClientRect();
    el.highlight.style.display = 'block';
    el.highlight.style.top = r.top + 'px';
    el.highlight.style.left = r.left + 'px';
    el.highlight.style.width = r.width + 'px';
    el.highlight.style.height = r.height + 'px';
  }

  function onScrollOrResize() {
    if (selectedEl && state === STATE.REVIEW) positionHighlight(selectedEl);
  }

  function onDocumentClickCapture(e) {
    if (isInsideWidget(e.target)) return; // let widget UI work normally
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();

    if (state === STATE.PICKING) {
      finalizeSelection(e.target);
    }
    // if state === STATE.REVIEW, the outside click is simply swallowed (page stays frozen)
  }

  function onKeyDownCapture(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelAll();
    }
  }

  function finalizeSelection(target) {
    selectedEl = target;
    selectedSelector = getUniqueSelector(target);
    stopPicking();
    positionHighlight(target);
    openModal();
  }

  // ---------------------------------------------------------------------
  // Unique selector generation
  // ---------------------------------------------------------------------
  function getUniqueSelector(node) {
    if (!(node instanceof Element)) return null;

    if (node.id) {
      var idSel = '#' + cssEscape(node.id);
      if (safeQueryCount(idSel) === 1) return idSel;
    }

    var parts = [];
    var current = node;

    while (current && current.nodeType === 1 && current !== document.documentElement) {
      var part = current.tagName.toLowerCase();

      if (current.id) {
        part = '#' + cssEscape(current.id);
        parts.unshift(part);
        break;
      }

      var classes = Array.prototype.filter.call(current.classList, function (c) { return !!c; });
      if (classes.length) {
        part += '.' + classes.map(cssEscape).join('.');
      }

      var parent = current.parentElement;
      if (parent) {
        var sameTagSiblings = Array.prototype.filter.call(parent.children, function (s) {
          return s.tagName === current.tagName;
        });
        if (sameTagSiblings.length > 1) {
          var idx = sameTagSiblings.indexOf(current) + 1;
          part += ':nth-of-type(' + idx + ')';
        }
      }

      parts.unshift(part);

      var testSelector = parts.join(' > ');
      if (safeQueryCount(testSelector) === 1) return testSelector;

      current = parent;
    }

    return parts.join(' > ');
  }

  function cssEscape(str) {
    if (window.CSS && window.CSS.escape) return window.CSS.escape(str);
    return String(str).replace(/([ #.;?%&,.+*~':"!^$[\]()=>|/])/g, '\\$1');
  }

  function safeQueryCount(selector) {
    try {
      return document.querySelectorAll(selector).length;
    } catch (err) {
      return -1;
    }
  }

  // ---------------------------------------------------------------------
  // Modal (page stays frozen while this is open)
  // ---------------------------------------------------------------------
  function openModal() {
    state = STATE.REVIEW;
    el.error.classList.remove('fbw-show');
    el.form.reset();

    if (showItemInForm) {
      el.itemField.classList.remove('fbw-hidden');
      el.itemBox.textContent = selectedSelector || '(none)';
    } else {
      el.itemField.classList.add('fbw-hidden');
    }

    el.overlay.classList.add('fbw-open');
    setTimeout(function () { el.feedback.focus(); }, 30);
  }

  function closeModal() {
    el.overlay.classList.remove('fbw-open');
  }

  function cancelAll() {
    stopPicking();
    closeModal();
    el.highlight.style.display = 'none';
    document.removeEventListener('click', onDocumentClickCapture, true);
    document.removeEventListener('keydown', onKeyDownCapture, true);
    selectedEl = null;
    selectedSelector = null;
    state = STATE.IDLE;
  }

  el.overlay.addEventListener('click', function (e) {
    var actionBtn = e.target.closest('[data-action="close-modal"]');
    if (actionBtn) cancelAll();
  });

  // ---------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------
  el.form.addEventListener('submit', function (e) {
    e.preventDefault();
    var feedback = el.feedback.value.trim();
    var email = el.email.value.trim();
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!feedback || !emailOk) {
      el.error.textContent = !feedback
        ? 'Please add some feedback before submitting.'
        : 'Please enter a valid email address.';
      el.error.classList.add('fbw-show');
      return;
    }

    var payload = {
      optionType: showItemInForm ? 'page_item_visible' : 'page_item_hidden',
      elementSelector: selectedSelector,
      pageUrl: window.location.href,
      pageTitle: document.title,
      feedback: feedback,
      email: email,
      submittedAt: new Date().toISOString()
    };

    submitFeedback(payload);
  });

  function submitFeedback(payload) {
    window.dispatchEvent(new CustomEvent('feedbackwidget:submit', { detail: payload }));

    if (ENDPOINT) {
      fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(function () { /* swallow network errors, UX already confirmed below */ });
    }

    cancelAll();
    showToast('Thanks for the feedback!');
  }

  function showToast(message) {
    el.toast.textContent = message;
    el.toast.classList.add('fbw-show');
    setTimeout(function () { el.toast.classList.remove('fbw-show'); }, 2400);
  }

  // ---------------------------------------------------------------------
  // Minimal public API
  // ---------------------------------------------------------------------
  window.FeedbackWidget = {
    open: function (mode) { startPicking(mode !== 'hidden'); },
    close: cancelAll
  };
})();
