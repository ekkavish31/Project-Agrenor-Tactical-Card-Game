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
  const NAV = '[role=tab],[data-tab],[data-m],[data-mode],[data-view],[data-entity],[data-sub],[data-cat],[data-group],[data-page],[data-f],.tabs>button,.tab,[role=tablist] button,#sheetSwitch button,#managerTab,#animTab,#lineupTab,#workshopTab';
  const ACTIVE = /(^|\s)(on|active|sel|selected|current|is-on|is-active)(\s|$)/;
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

  /* replay: nav clicks in the order they were made (each retried until its control exists), then the selects */
  function replay() {
    const p = load()[page]; if (!p) return; const todo = (p.order || Object.keys(p.nav || {})).filter(g => p.nav[g]), sel = Object.entries(p.sel || {}), t0 = Date.now(); let step = 0, stall = 0;
    const tick = () => {
      if (Date.now() - t0 > 14000 || step >= todo.length) { replaying = false; for (const [id, v] of sel) { const s = document.getElementById(id); if (s && s.value !== v && [...s.options].some(o => o.value === v)) { replaying = true; s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); replaying = false } } return }
      replaying = true; const d = p.nav[todo[step]], el = find(d);
      if (el) { if (!isOn(el)) { try { el.click() } catch (e) { } } step++; stall = 0; replaying = false; setTimeout(tick, 350) }
      else { replaying = false; if (++stall > 20) { step++; stall = 0 } setTimeout(tick, 400) }
    };
    tick();
  }
  const start = () => setTimeout(replay, 900);
  if (document.readyState === 'complete') start(); else root.addEventListener('load', start, { once: true });

  /* tell editor.html which URL this tool is on (it reopens that URL, e.g. ?place=market) */
  const post = () => { try { if (root.parent !== root) root.parent.postMessage({ editorUrl: LOC.href.replace(/([?&])build=[^&]*&?/, '$1').replace(/[?&]$/, ''), page: LOC.pathname.split('/').pop() }, '*') } catch (e) { } };
  let lastHref = ''; setInterval(() => { if (LOC.href !== lastHref) { lastHref = LOC.href; post() } }, 1500); post();
  root.EditorUiMemory = { page, clear: () => { const m = load(); delete m[page]; save(m) }, dump: () => load()[page] || null };
})(globalThis);
