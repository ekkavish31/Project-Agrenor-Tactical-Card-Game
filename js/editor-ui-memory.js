/* v98.938 · EDITOR UI MEMORY — after a reload (any kind) every editor tool opens on the SAME sub-page it was on: its tabs / sub-tabs / mode switches, the chosen character or category, the chosen <select> values.
   How: while you work, a click on a "navigation" control (a tab, a mode switch, a character chip …) is remembered by a stable path in the page; after the page has loaded the remembered clicks are replayed in order (retrying
   until the control exists — sub-tabs appear only after the tab above them was opened). Controls that are already on are not clicked again. Plain buttons that DO things (save, delete, push …) are never recorded.
   The page URL (e.g. ?place=market) is remembered by editor.html through the 'editor-url' message this file posts.
   Storage: localStorage 'editor-ui-memory-v1' = { <page>: { nav: {<group>: descriptor}, sel: {<select id>: value} } } (device-only, not pushed).
   Loaded by every editor tool page; it does nothing in the game itself (only with ?edit=1 / ?editor=… or inside editor.html, or on the tool-only pages). */
(function (root) {
  'use strict';
  const KEY = 'editor-ui-memory-v1', LOC = root.location;
  const page = (LOC.pathname.split('/').pop() || 'index.html') + '|' + ['place', 'kind', 'editor'].map(k => new URLSearchParams(LOC.search).get(k) ? k + '=' + new URLSearchParams(LOC.search).get(k) : '').filter(Boolean).join('&');
  const TOOL_ONLY = /^(asset-studio|battle-tab|visual-tab|hud-tab|progress|story-map|scale-lineup|object-asset-studio|set-piece-editor|vfx-kit-preview|vfx-preview|fx-code-preview|portrait-facing|texel-report|tree-motion-demo|battleground)\.html$/;
  const inEditor = (() => { try { return /editor\.html$/.test(root.top.location.pathname) } catch (e) { return false } })();
  const Q = new URLSearchParams(LOC.search);
  if (!(TOOL_ONLY.test(LOC.pathname.split('/').pop()) || Q.get('edit') === '1' || Q.has('editor') || inEditor)) return;
  const NAV = '[role=tab],[data-tab],[data-m],[data-mode],[data-view],[data-entity],[data-sub],[data-cat],[data-group],[data-page],[data-f],.tabs>button,.tab,[role=tablist] button,#sheetSwitch button,nav>button[data-id],#stages>button,#mode>button,#managerTab,#animTab,#lineupTab,#workshopTab';
  const ACTIVE = /(^|\s)(on|active|sel|selected|current|cur|is-on|is-active)(\s|$)/;
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {} } catch (e) { return {} } };
  const save = o => { try { localStorage.setItem(KEY, JSON.stringify(o)) } catch (e) { } };
  let replaying = false;

  /* a stable path: id when there is one, else tag + class + nth-of-type up the tree (max 5 levels) */
  const seg = e => e.id && !/\d{4,}/.test(e.id) ? '#' + CSS.escape(e.id) : e.tagName.toLowerCase() + (e.parentElement ? ':nth-child(' + (Array.prototype.indexOf.call(e.parentElement.children, e) + 1) + ')' : '');
  const pathOf = e => { const out = []; for (let n = e, i = 0; n && n.nodeType === 1 && n !== document.body && i < 6; n = n.parentElement, i++) { out.unshift(seg(n)); if (n.id && !/\d{4,}/.test(n.id)) break } return out.join('>') };
  const describe = e => { const d = { path: pathOf(e), text: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40), data: {} }; for (const a of e.attributes) if (/^data-/.test(a.name) && a.value.length < 80) d.data[a.name] = a.value; if (e.id && !/\d{4,}/.test(e.id)) d.id = e.id; return d };
  const groupOf = e => e.parentElement ? pathOf(e.parentElement) : '';
  const find = d => {
    try { if (d.id) { const x = document.getElementById(d.id); if (x) return x } } catch (e) { }
    const ds = Object.entries(d.data || {});
    if (ds.length) { const sel = NAV.split(',').map(s => s + ds.map(([k, v]) => '[' + k + '="' + CSS.escape(v).replace(/\\/g, '\\\\') + '"]').join('')).join(','); try { const l = document.querySelectorAll(sel); if (l.length) return l[0] } catch (e) { } try { const l = [...document.querySelectorAll('*')].filter(x => ds.every(([k, v]) => x.getAttribute(k) === v)); if (l.length) return l[0] } catch (e) { } }
    try { const x = document.querySelector(d.path); if (x && (x.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) === d.text) return x } catch (e) { }
    return null;
  };
  const isOn = e => e.getAttribute('aria-selected') === 'true' || e.getAttribute('aria-pressed') === 'true' || ACTIVE.test(e.className && e.className.baseVal === undefined ? String(e.className) : '') || (e.tagName === 'BUTTON' && e.disabled);

  document.addEventListener('click', ev => {
    if (replaying || !ev.isTrusted) return;
    const el = ev.target.closest && ev.target.closest(NAV); if (!el || el.disabled) return;
    const m = load(), p = m[page] || (m[page] = { nav: {}, sel: {}, order: [] }), g = groupOf(el);
    p.nav[g] = describe(el); p.order = (p.order || []).filter(x => x !== g); p.order.push(g); save(m);
  }, true);
  document.addEventListener('change', ev => {
    if (replaying || !ev.isTrusted) return; const el = ev.target; if (!el || el.tagName !== 'SELECT' || !el.id || /\d{4,}/.test(el.id)) return;
    const m = load(), p = m[page] || (m[page] = { nav: {}, sel: {}, order: [] }); p.sel = p.sel || {}; p.sel[el.id] = el.value; save(m);
  }, true);

  /* replay: the remembered controls are checked again and again for up to 40 s (every 0.5 s), in the order they were made, until the page has settled and the user touches something themselves.
     A page often builds its tabs LATE or sets its own default tab AFTER our first click (data loads slowly on the real site) — so a control that was on after our click and has gone off is clicked again (max 4 times each). A control with no visible "on" state is clicked once. */
  let touched = false; for (const t of ['pointerdown', 'keydown']) document.addEventListener(t, e => { if (e.isTrusted && !replaying) touched = true }, true);
  function toast(t) { try { const d = document.createElement('div'); d.textContent = t; d.style.cssText = 'position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:2147483000;background:#1f2a22e6;color:#d8f0d8;border:1px solid #5a8a62;border-radius:999px;padding:5px 14px;font:600 12px system-ui,sans-serif;pointer-events:none;transition:opacity .5s'; document.body.append(d); setTimeout(() => { d.style.opacity = 0 }, 2600); setTimeout(() => d.remove(), 3200) } catch (e) { } }
  /* v98.945 · NO FLASH OF THE DEFAULT PAGE: when this page has something to restore, it is hidden (visibility only — scripts and layout run normally) from the moment this file runs until the first restoring pass is done (or 6 s at most), then shown already on the remembered sub-page. This file is loaded in <head> for that reason. */
  let covered = false;
  const cover = on => { try { const h = document.documentElement; if (on) { if (!document.getElementById('eumCover')) { const st = document.createElement('style'); st.id = 'eumCover'; st.textContent = 'html.eum-wait{visibility:hidden!important}'; (document.head || h).appendChild(st) } h.classList.add('eum-wait'); covered = true } else { h.classList.remove('eum-wait'); covered = false } } catch (e) { } };
  { const m0 = load()[page]; if (m0 && Object.keys(m0.nav || {}).length && !/[?&]nocover\b/.test(LOC.search)) { cover(true); setTimeout(() => cover(false), 6000) } }
  function replay() {
    const p = load()[page]; if (!p) return; const todo = (p.order || Object.keys(p.nav || {})).filter(g => p.nav[g]), sel = Object.entries(p.sel || {}), t0 = Date.now(), st = todo.map(() => ({ clicks: 0, wasOn: false })); let calm = 0, did = [];
    const tick = () => {
      if (touched || Date.now() - t0 > 40000) { cover(false); replaying = false; if (did.length) toast('↩ คืนหน้าเดิม: ' + did.join(' › ')); return }
      let acted = false, missing = 0;
      for (let i = 0; i < todo.length && !acted; i++) {
        const d = p.nav[todo[i]], el = find(d), S = st[i];
        if (!el) { missing++; break }                       /* later controls only exist after this one — wait */
        if (isOn(el)) { S.wasOn = true; continue }
        const hasState = !!el.parentElement && [...el.parentElement.children].some(isOn);   /* the group shows an 'on' control → this kind of control has a visible state, so a click that did not take (handler not bound yet) is retried */
        if (S.clicks === 0 || ((S.wasOn || hasState) && S.clicks < 4)) { replaying = true; try { el.click() } catch (e) { } S.clicks++; replaying = false; acted = true; if (!did.includes(d.text)) did.push(d.text); if (isOn(el)) S.wasOn = true }
      }
      for (const [id, v] of sel) { const s2 = document.getElementById(id); if (s2 && s2.value !== v && [...s2.options].some(o => o.value === v) && !(st.sel ||= {})[id]) { st.sel[id] = 1; replaying = true; s2.value = v; s2.dispatchEvent(new Event('change', { bubbles: true })); replaying = false; acted = true } }
      calm = acted || missing ? 0 : calm + 1;
      if (covered && calm >= 3) cover(false);   /* everything remembered is on, and stayed on for a moment: show the page */
      if (calm >= 24) { replaying = false; if (did.length) toast('↩ คืนหน้าเดิม: ' + did.join(' › ')); return }   /* 12 s with nothing to do = settled */
      setTimeout(tick, Date.now() - t0 < 8000 ? (acted ? 200 : 150) : 500);
    };
    tick();
  }
  /* start as soon as the page structure exists (not after 'load'): the tabs of most tools are plain HTML, the rest are polled for */
  if (document.readyState !== 'loading') replay(); else document.addEventListener('DOMContentLoaded', replay, { once: true });

  /* tell editor.html which URL this tool is on (it reopens that URL, e.g. ?place=market) */
  const post = () => { try { if (root.parent !== root) root.parent.postMessage({ editorUrl: LOC.href.replace(/([?&])build=[^&]*&?/, '$1').replace(/[?&]$/, ''), page: LOC.pathname.split('/').pop() }, '*') } catch (e) { } };
  let lastHref = ''; setInterval(() => { if (LOC.href !== lastHref) { lastHref = LOC.href; post() } }, 1500); post();
  root.EditorUiMemory = { page, clear: () => { const m = load(); delete m[page]; save(m) }, dump: () => load()[page] || null };
})(globalThis);
