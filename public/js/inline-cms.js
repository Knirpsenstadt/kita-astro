(function () {
  'use strict';

  const EDIT_SELECTOR = '[data-cms-editable][data-cms-key]';
  const TOOLBAR_ID = 'cms-inline-toolbar';
  const STYLE_ID = 'cms-inline-style';
  const state = {
    csrfToken: null,
    mode: 'published',
    pending: new Map(),
  };

  function textFromElement(element) {
    return (element.innerText || '').replace(/\u00a0/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  }

  function setStatus(text, tone) {
    const node = document.getElementById('cms-inline-status');
    if (!node) return;
    node.textContent = text;
    node.dataset.tone = tone || 'muted';
  }

  async function api(url, options) {
    const response = await fetch(url, options);
    const result = await response.json().catch(function () {
      return { error: 'Unerwartete Antwort.' };
    });
    if (!response.ok) {
      throw new Error(result.error || 'Anfrage fehlgeschlagen.');
    }
    return result;
  }

  async function saveField(key, value) {
    await api('/api/admin/content', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-cms-csrf': state.csrfToken || '',
      },
      body: JSON.stringify({ key: key, value: value }),
    });
  }

  async function publishDraft() {
    const result = await api('/api/admin/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-cms-csrf': state.csrfToken || '' },
    });
    return result;
  }

  async function setMode(mode) {
    await api('/api/admin/mode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cms-csrf': state.csrfToken || '',
      },
      body: JSON.stringify({ mode: mode }),
    });
  }

  function getToolbar() {
    return document.getElementById(TOOLBAR_ID);
  }

  function removeToolbar() {
    getToolbar()?.remove();
    document.body.classList.remove('cms-inline-active');
  }

  function setupEditableElement(element) {
    if (!(element instanceof HTMLElement) || element.dataset.cmsInlineBound === 'true') {
      return;
    }

    const key = element.dataset.cmsKey;
    if (!key) return;

    element.dataset.cmsInlineBound = 'true';
    element.setAttribute('contenteditable', 'true');
    element.setAttribute('spellcheck', 'false');
    element.classList.add('cms-inline-editable');
    element.dataset.originalValue = textFromElement(element);

    element.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        element.innerText = element.dataset.originalValue || '';
        element.blur();
      }
    });

    element.addEventListener('blur', async function () {
      const current = textFromElement(element);
      const original = element.dataset.originalValue || '';
      if (current === original) return;
      if (state.pending.has(key)) return;

      state.pending.set(key, true);
      element.classList.add('is-saving');
      setStatus('Speichere Entwurf ...', 'muted');

      try {
        await saveField(key, current);
        element.dataset.originalValue = current;
        element.classList.remove('is-saving');
        element.classList.add('is-saved');
        setTimeout(function () {
          element.classList.remove('is-saved');
        }, 1200);
        setStatus('Entwurf gespeichert.', 'success');
      } catch (error) {
        element.classList.remove('is-saving');
        element.classList.add('is-error');
        setTimeout(function () {
          element.classList.remove('is-error');
        }, 1600);
        element.innerText = original;
        setStatus(error.message, 'error');
      } finally {
        state.pending.delete(key);
      }
    });
  }

  function moveCaretToEnd(element) {
    if (!(element instanceof HTMLElement)) return;
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  function installEditableLinkGuard() {
    if (window.__cmsInlineLinkGuardInstalled) return;

    window.__cmsInlineLinkGuardInstalled = true;
    document.addEventListener(
      'click',
      function (event) {
        const target = event.target;
        if (!(target instanceof Element)) return;
        if (target.closest('.cms-inline-toolbar')) return;

        const link = target.closest('a[href]');
        if (!link) return;

        const hasEditableText = !!(link.matches(EDIT_SELECTOR) || link.querySelector(EDIT_SELECTOR));
        if (!hasEditableText) return;

        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        const editable = target.closest(EDIT_SELECTOR) || link.querySelector(EDIT_SELECTOR);
        if (editable instanceof HTMLElement) {
          editable.focus();
          moveCaretToEnd(editable);
        }

        setStatus('Link deaktiviert während Bearbeitung. Mit Cmd/Ctrl+Klick öffnen.', 'muted');
      },
      true
    );
  }

  function bindToolbarActions(root) {
    if (!(root instanceof HTMLElement) || root.dataset.cmsInlineBound === 'true') {
      return;
    }

    root.dataset.cmsInlineBound = 'true';

    root.querySelector('#cms-mode-draft')?.addEventListener('click', async function () {
      await setMode('draft');
      window.location.reload();
    });

    root.querySelector('#cms-mode-live')?.addEventListener('click', async function () {
      await setMode('published');
      window.location.reload();
    });

    root.querySelector('#cms-publish')?.addEventListener('click', async function () {
      setStatus('Publiziere ...', 'muted');
      try {
        await publishDraft();
        setStatus('Publiziert. Die Live-Ansicht wurde aktualisiert.', 'success');
        await setMode('published');
        setTimeout(function () {
          window.location.reload();
        }, 350);
      } catch (error) {
        setStatus(error.message, 'error');
      }
    });

    root.querySelector('#cms-logout')?.addEventListener('click', async function () {
      await fetch('/api/admin/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
      window.location.reload();
    });
  }

  function updateToolbarMode() {
    const modeNode = document.getElementById('cms-inline-mode');
    if (modeNode) {
      modeNode.textContent = state.mode === 'draft' ? 'Modus: Entwurfsvorschau' : 'Modus: Live';
    }
  }

  async function ensureToolbar() {
    const status = await api('/api/admin/status');
    if (!status.authenticated) {
      removeToolbar();
      return false;
    }

    state.csrfToken = status.csrfToken;
    state.mode = status.mode;

    let root = getToolbar();
    if (!root) {
      root = document.createElement('div');
      root.id = TOOLBAR_ID;
      root.className = 'cms-inline-toolbar';
      root.innerHTML =
        '<div class="cms-inline-toolbar__inner">' +
        '<span class="cms-inline-badge">Inline CMS</span>' +
        '<span class="cms-inline-mode" id="cms-inline-mode"></span>' +
        '<span class="cms-inline-status" id="cms-inline-status" data-tone="muted"></span>' +
        '<button type="button" id="cms-mode-draft">Entwurf</button>' +
        '<button type="button" id="cms-mode-live">Live</button>' +
        '<button type="button" id="cms-publish">Publizieren</button>' +
        '<a href="/admin">Admin</a>' +
        '<button type="button" id="cms-logout">Abmelden</button>' +
        '</div>';
      document.body.prepend(root);
    }

    document.body.classList.add('cms-inline-active');
    bindToolbarActions(root);
    updateToolbarMode();

    return true;
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent =
      '.cms-inline-toolbar{position:fixed;top:0;left:0;right:0;z-index:10000;background:#10231c;color:#fff;border-bottom:2px solid #2f855a;padding:.65rem 1rem;}' +
      '.cms-inline-toolbar__inner{display:flex;gap:.6rem;align-items:center;flex-wrap:wrap;max-width:1300px;margin:0 auto;}' +
      '.cms-inline-badge{background:#2f855a;border-radius:999px;padding:.2rem .7rem;font-weight:700;font-size:.78rem;}' +
      '.cms-inline-mode{font-weight:700;font-size:.82rem;opacity:.95;}' +
      '.cms-inline-status{font-size:.82rem;min-width:170px;}' +
      '.cms-inline-status[data-tone="success"]{color:#86efac;}' +
      '.cms-inline-status[data-tone="error"]{color:#fca5a5;}' +
      '.cms-inline-toolbar button,.cms-inline-toolbar a{border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;padding:.38rem .65rem;border-radius:8px;font-size:.8rem;text-decoration:none;cursor:pointer;}' +
      '.cms-inline-toolbar button:hover,.cms-inline-toolbar a:hover{background:rgba(255,255,255,.16);}' +
      '.cms-inline-active{padding-top:62px;}' +
      '.cms-inline-editable{outline:2px dashed rgba(47,133,90,.45);outline-offset:2px;border-radius:6px;transition:all .15s ease;}' +
      '.cms-inline-editable:hover{background:rgba(47,133,90,.08);}' +
      '.cms-inline-editable:focus{outline:2px solid #2f855a;background:rgba(47,133,90,.12);}' +
      '.cms-inline-editable.is-saving{outline-color:#d97706;}' +
      '.cms-inline-editable.is-saved{outline-color:#16a34a;}' +
      '.cms-inline-editable.is-error{outline-color:#dc2626;}' +
      '@media (max-width:900px){.cms-inline-status{display:none;}}';
    document.head.appendChild(style);
  }

  async function init() {
    try {
      const authenticated = await ensureToolbar();
      if (!authenticated) return;
    } catch {
      removeToolbar();
      return;
    }

    injectStyles();
    installEditableLinkGuard();
    document.querySelectorAll(EDIT_SELECTOR).forEach(setupEditableElement);
  }

  document.addEventListener('astro:page-load', init);
  init();
})();
