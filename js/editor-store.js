/* v98.858 · EDITOR STORE — one source of truth for the editors' data.
   The TRUTH is what was pushed (🛒 Cart → GitHub → js/game-settings.js). This browser only keeps DRAFTS (edits not pushed yet).
   It is loaded FIRST on every page and does three things for every JSON value kept in localStorage:
     1. NO MORE STALE OVERWRITES. Editors keep a whole value in memory (place-maps-v1, place-art-frames-v1, pose-sheet-v1, the village layout …)
        and write it back whole. When another tab / iframe saved meanwhile, that write used to wipe the other work silently.
        Now a write is MERGED: only what THIS page changed (diff between the version it read and the one it writes) is applied
        onto the newest stored value, item by item. Other pages' work stays.
     2. LOADING = the pushed data + your drafts. At load the pushed value (GAME_SETTINGS) is compared with the browser copy and the
        version both started from (es-base:<key>):  no draft → the pushed value is used · pushed value unchanged → the draft stays ·
        both changed → the draft's own changes are merged onto the pushed value. (Before: a browser copy that had ever been edited
        won for ever, so newer pushes never came back.)  After a Cart push the pushed value becomes the new base.
     3. BACKUPS. Before anything replaces a browser value (load, merge, restore) the old one is saved to IndexedDB 'editor-backups'
        (10 per key) and can be restored: EditorStore.openBackups().  On the first run every editor value is backed up once.
   API: EditorStore.seed(GAME_SETTINGS) (called by js/game-settings.js) · markPushed(key, value) (js/github-push.js) · drafts() → keys with
   unpushed changes · backups(key) · restore(key, i) · openBackups() */
(function (root) {
  'use strict';
  if (root.EditorStore) return;
  let LS; try { LS = root.localStorage; if (!LS) return } catch (e) { return }
  const P = Storage.prototype, nGet = P.getItem, nSet = P.setItem;
  const SEEN = 'project-a-settings-seen', BASE = 'es-base:';
  const hash = v => { let x = 2166136261; for (let i = 0; i < v.length; i++) x = Math.imul(x ^ v.charCodeAt(i), 16777619); return (x >>> 0).toString(36) };
  const isJ = s => typeof s === 'string' && s.length > 1 && (s[0] === '{' || s[0] === '[');
  const parse = s => { try { return JSON.parse(s) } catch (e) { return undefined } };
  const isObj = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  const clone = x => x === undefined ? undefined : JSON.parse(JSON.stringify(x));
  const internal = k => k === SEEN || k.startsWith(BASE);

  /* ---- deep diff / patch (objects key by key, arrays of the same length index by index, anything else replaced) ---- */
  const SAME = null;
  function diff(a, b) {
    if (a === b) return SAME;
    if (isObj(a) && isObj(b)) {
      const p = {}; let n = 0;
      for (const k of Object.keys(a)) if (!(k in b)) { p[k] = { $del: 1 }; n++ }
      for (const k of Object.keys(b)) { if (!(k in a)) { p[k] = { $set: b[k] }; n++ } else { const d = diff(a[k], b[k]); if (d) { p[k] = d; n++ } } }
      return n ? { $o: p } : SAME;
    }
    if (Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.length) {
      const p = {}; let n = 0;
      for (let i = 0; i < a.length; i++) { const d = diff(a[i], b[i]); if (d) { p[i] = d; n++ } }
      return n ? { $a: p, len: a.length } : SAME;
    }
    return JSON.stringify(a) === JSON.stringify(b) ? SAME : { $set: b };
  }
  const noDel = p => { if (!p) return p; if (p.$o) { const o = {}; for (const [k, s] of Object.entries(p.$o)) if (!s.$del) o[k] = noDel(s); return { $o: o } } if (p.$a) { const o = {}; for (const [i, s] of Object.entries(p.$a)) o[i] = noDel(s); return { $a: o, len: p.len } } return p };
  function size(p) { if (!p) return 0; if (p.$o) return Object.values(p.$o).reduce((s, x) => s + size(x), 0); if (p.$a) return Object.values(p.$a).reduce((s, x) => s + size(x), 0); return 1 }
  function apply(cur, p) {
    if (!p) return cur;
    if ('$set' in p) return clone(p.$set);
    if (p.$o) { const out = isObj(cur) ? { ...cur } : {}; for (const [k, s] of Object.entries(p.$o)) { if (s.$del) delete out[k]; else out[k] = apply(out[k], s) } return out }
    if (p.$a) { if (!Array.isArray(cur)) return cur; const out = cur.slice(); for (const [i, s] of Object.entries(p.$a)) if (+i < out.length) out[+i] = apply(out[+i], s); return out }
    return cur;
  }

  /* ---- backups (IndexedDB, async, 10 per key) ---- */
  let dbp = null;
  const db = () => dbp || (dbp = new Promise((res, rej) => { try { const r = indexedDB.open('editor-backups', 1); r.onupgradeneeded = () => r.result.createObjectStore('bk'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error) } catch (e) { rej(e) } }));
  const idbGet = async k => { try { const d = await db(); return await new Promise(r => { const q = d.transaction('bk').objectStore('bk').get(k); q.onsuccess = () => r(q.result || []); q.onerror = () => r([]) }) } catch (e) { return [] } };
  const idbPut = async (k, v) => { try { const d = await db(); await new Promise(r => { const t = d.transaction('bk', 'readwrite'); t.objectStore('bk').put(v, k); t.oncomplete = r; t.onerror = r }) } catch (e) { } };
  let chain = Promise.resolve();
  function backup(key, value, why) {
    if (value == null) return;
    chain = chain.then(async () => { const list = await idbGet(key); if (list.length && list[0].v === value) return; list.unshift({ t: Date.now(), why, page: location.pathname.split('/').pop(), v: value }); await idbPut(key, list.slice(0, 10)) });
    return chain;
  }

  /* ---- 1 · merged writes ---- */
  const seenBy = new Map();   /* key → the last few values THIS page read or wrote (its own view of the key) */
  const remember = (k, v) => { let h = seenBy.get(k); if (!h) seenBy.set(k, h = []); if (h[0] === v) return; const i = h.indexOf(v); if (i > 0) h.splice(i, 1); h.unshift(v); if (h.length > 4) h.length = 4 };
  let merges = 0;
  P.getItem = function (k) {
    const v = nGet.call(this, k);
    if (this === LS && v !== null && isJ(v) && !internal(String(k))) remember(String(k), v);
    return v;
  };
  P.setItem = function (k, v) {
    k = String(k); v = String(v); if (this === LS) noteUnknown(k);
    if (this !== LS || internal(k) || !isJ(v)) return nSet.call(this, k, v);
    const cur = nGet.call(LS, k), mine = seenBy.get(k);
    if (cur === null || cur === v || !mine || mine.includes(cur)) { nSet.call(LS, k, v); remember(k, v); return }
    /* someone else (another tab / iframe) changed this key after this page read it → apply only THIS page's changes onto theirs */
    const N = parse(v), C = parse(cur); if (N === undefined || C === undefined) { nSet.call(LS, k, v); remember(k, v); return }
    let best = null, bs = Infinity;
    for (const b of mine) { const B = parse(b); if (B === undefined) continue; const d = diff(B, N), s = size(d); if (s < bs) { bs = s; best = d } }
    remember(k, v);
    if (!best) return;   /* this page changed nothing → keep the newer stored value */
    backup(k, cur, 'merge');
    const out = JSON.stringify(apply(C, best)); nSet.call(LS, k, out); merges++;
    try { console.info('[EditorStore] merged ' + bs + ' change(s) of this page into the newer "' + k + '" (another tab/iframe saved it meanwhile)') } catch (e) { }
    try { root.dispatchEvent(new CustomEvent('editorstore:merged', { detail: { key: k } })) } catch (e) { }
  };

  /* ---- 2 · loading: pushed value + drafts ---- */
  const seenMap = () => { try { return JSON.parse(nGet.call(LS, SEEN) || '{}') || {} } catch (e) { return {} } };
  /* one key: the pushed value `web` + this browser's copy + the version both started from (es-base:<key>) */
  function seedKey(k, web, seen, first, firstRun) {
    const cur = nGet.call(LS, k), base = nGet.call(LS, BASE + k);
    if (first && cur != null) backup(k, cur, 'before EditorStore');
    if (cur === null) nSet.call(LS, k, web);
    if (cur === null || cur === web || same(cur, web)) { nSet.call(LS, BASE + k, web); seen[k] = hash(web); return 'web' }
    /* the version this browser last took from the web: stored in full (new) · or known by its hash (old SEED) */
    let baseVal = base; if (baseVal == null && seen[k] && hash(cur) === seen[k]) baseVal = cur;
    if (baseVal == null && firstRun) baseVal = firstRun(cur);            // a unit with its own older record (village layout: js/layout-sync.js)
    if (baseVal === web || (baseVal != null && same(baseVal, web))) return 'draft';   // the web did not change → the draft stays
    if (baseVal == null || baseVal === cur || same(baseVal, cur)) {      // no draft (or unknown) → take the web
      if (baseVal == null && (seen[k] ? hash(cur) !== seen[k] : !!firstRun)) {   // a copy that WAS edited, base unknown: keep it as a draft on top of the web
        const W = parse(web), C = parse(cur);
        if (isJ(web) && W !== undefined && C !== undefined) { backup(k, cur, 'load: merged onto newer push'); nSet.call(LS, k, JSON.stringify(apply(W, noDel(diff(W, C))))) }   /* no base known: keep everything of both (the draft wins where both differ, nothing is deleted) */
        nSet.call(LS, BASE + k, web); seen[k] = hash(web); return 'merged';
      }
      backup(k, cur, 'load: newer push'); nSet.call(LS, k, web); nSet.call(LS, BASE + k, web); seen[k] = hash(web); return 'web';
    }
    /* both changed: the draft's own changes go onto the newer pushed value */
    const W = parse(web), B = parse(baseVal), C = parse(cur);
    backup(k, cur, 'load: both changed');
    if (isJ(web) && W !== undefined && B !== undefined && C !== undefined) nSet.call(LS, k, JSON.stringify(apply(W, diff(B, C))));
    else nSet.call(LS, k, cur);
    nSet.call(LS, BASE + k, web); seen[k] = hash(web); return 'merged';
  }
  function seed(GS) {
    if (!GS || typeof GS !== 'object') return;
    const seen = seenMap(), first = nGet.call(LS, 'es-first-backup') == null;
    for (const [k, web] of Object.entries(GS)) { try { seedKey(k, web, seen, first) } catch (e) { } }
    nSet.call(LS, SEEN, JSON.stringify(seen));
    if (first) nSet.call(LS, 'es-first-backup', String(Date.now()));
  }
  /* v98.866 · the VILLAGE LAYOUT follows the same rule. Its pushed value is the file js/village-layout-v67.js (window.VillageDefaultLayout);
     the browser copy is localStorage 'project-a-village-editor-v67' (+ place positions 'project-a-village-main-v1', rebuilt from the layout).
     Before: a browser copy, once it existed, won over every later push for ever (only the sync pill's "use the web copy" button replaced it). */
  const LAYOUT = 'project-a-village-editor-v67', LAYOUT_POS = 'project-a-village-main-v1';
  const canon = v => JSON.stringify(v, (k, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(i => [i, x[i]])) : x);
  function seedLayout(v) {
    if (!v || typeof v !== 'object') return;
    try {
      const web = JSON.stringify(v), seen = seenMap(), before = nGet.call(LS, LAYOUT);
      /* first run: the sync pill remembers whether this copy was in step with the web when it last looked (then it holds no edits) */
      const firstRun = cur => { try { const L = (JSON.parse(nGet.call(LS, 'project-a-layout-sync-v1') || '{}') || {}).layout, h = hash(canon(JSON.parse(cur))); return L && L.loc === h && L.loc === L.rem ? cur : null } catch (e) { return null } };
      if (before === null) { nSet.call(LS, BASE + LAYOUT, web); seen[LAYOUT] = hash(web) }   /* nothing here: the page uses the file itself */
      else if (seedKey(LAYOUT, web, seen, false, firstRun) !== 'draft' && nGet.call(LS, LAYOUT) !== before) nSet.call(LS, LAYOUT_POS, '{}');   // positions come from the layout again
      nSet.call(LS, SEEN, JSON.stringify(seen));
    } catch (e) { }
  }
  /* after a Cart push: what was pushed is the new base (so later pushes from elsewhere load again) */
  function markPushed(k, v) { if (v == null) return; const seen = seenMap(); nSet.call(LS, BASE + k, v); seen[k] = hash(v); nSet.call(LS, SEEN, JSON.stringify(seen)) }
  /* v98.866 · called by js/github-push.js after EVERY successful commit with the files it wrote: the pushed settings and layout become the base */
  function afterPush(files) {
    for (const f of files || []) {
      if (f.remove || typeof f.content !== 'string') continue;
      try {
        if (f.path === 'js/game-settings.js') { const i = f.content.indexOf('window.GAME_SETTINGS='), a = f.content.indexOf('{', i), b = f.content.indexOf('\n};', a); if (i < 0 || a < 0 || b < 0) continue; for (const [k, v] of Object.entries(JSON.parse(f.content.slice(a, b + 2)))) markPushed(k, v) }
        if (f.path === 'js/village-layout-v67.js') { const i = f.content.indexOf('window.VillageDefaultLayout='), a = f.content.indexOf('{', i), b = f.content.lastIndexOf('};'); if (i < 0 || a < 0 || b < 0) continue; markPushed(LAYOUT, JSON.stringify(JSON.parse(f.content.slice(a, b + 1)))) }
      } catch (e) { }
    }
  }
  /* v98.866 · editor DATA kept in this browser that must follow the repo (pushed into js/game-settings.js by the Cart even when the page that edits it
     has no push button of its own). Preferences of one browser (zoom, open panels, filters, token) and game saves are NOT listed. */
  const SYNC = ['art-lights-v1', 'depth-style-v1', 'portrait-facing-v1', 'progress-review-v1', 'project-a-char-scale-v1', 'project-a-place-prefabs-v1', 'project-a-village-prefabs-v1',
    'set-piece-edits-v1', 'proportion-rulers-v1', 'proportion-datum-v1', 'proportion-done-v1', 'proportion-girth-v1', 'proportion-master-v1', 'proportion-standard-v1', 'proportion-templates-v1', 'scale-lineup-ok-v1',
    'pose-sheet.rulers', 'project-a-uploaded-decor-v1', 'project-a-village-asset-lib-v1', 'card-studio-v1',
    'battleground-v1', 'object-asset-preset-v1', 'storyMapPos', 'storyMapGeo', 'projectA.roadEdgeStyle', 'vfx-kit-kinds-v2', 'asset-batches-v1',
    'tactics-anchors-v1', 'project-a-ct-crops-v32', 'project-a-battle-polish', 'project-a-sfx-mix-v1', 'three-card-config-v2', 'three-card-routes-v1', 'everyday-layout-v1', 'everyday-village-map-v03', 'everyday-village-routes-v1'];
  const SYNC_PRE = ['proportion-zones-v1:'];   /* one key per picture */
  /* v98.881 · EVERY localStorage key the pages use has a class. Only 'sync' / 'layout' / 'manifest' data is editor work that must follow the repo;
     'device' = a preference of this browser (panels, zoom, sound, token, caches) · 'save' = the player's game save (per device by design, moved with
     the save backup) · 'own' = drafts with their own export / push button (battlefield editor). A key the page writes that is in NO list is recorded
     (EditorStore.unknown(), shown in the 🛒 Cart) — a new editor value that someone forgot to add to SYNC can then never stay on one computer unnoticed.
     tools/test-sot-keys.cjs fails when the code uses a key that is not classified here. */
  const DEVICE = ['projectA.resumeLast', 'battle-tab-sub', 'hud-tab-sub', 'visual-tab-sub', 'ur-tab', 'smMapW', 'battleground-recent-v1', 'gh-latest-v1', 'project-a-repo-tree-v1', 'project-a-gh-assets-v1',
    'pose-sheet.cart-sig', 'pose-sheet.hidden', 'pose-sheet.mode', 'pose-sheet.show', 'pose-sheet.zoom', 'pose-sheet.mirrorSync', 'pose-sheet.mirrorSync2', 'pose-sheet.revSync', 'pose-sheet.revSync2',
    'project-a-bgm-v24', 'project-a-sfx', 'project-a-field-grid', 'project-a-fp-float', 'project-a-fs', 'project-a-gart', 'project-a-gart-ring', 'project-a-grid-mode', 'project-a-grid-show',
    'project-a-ground-brush', 'project-a-lock-ratio', 'project-a-manager-mode', 'project-a-ramp', 'project-a-sharp', 'project-a-sharp-amt', 'project-a-place-clipboard-v1', 'project-a-layout-sync-v1',
    'projectA.autoRes', 'projectA.battleSnap', 'projectA.bump', 'projectA.csAuto', 'projectA.cursor', 'projectA.dev', 'projectA.editQuality', 'projectA.fbDuel', 'projectA.fbHudMin', 'projectA.fieldRot',
    'projectA.github', 'projectA.hd2d', 'projectA.mood', 'projectA.precached', 'projectA.renderStep', 'projectA.skipIntro', 'projectA.texelNorm', 'projectA.texelStats',
    'projectA.touchUI', 'projectA.resumeLast', 'projectA.wipShown', 'projectA.wmFight', 'projectA.worldScale', 'scale-lineup-filter-v1', 'scale-lineup-hidden-v1', 'scale-lineup-subfilter-v1', 'studio.dockH', 'studio.dockMin', 'studio.filesOpen',
    'editor-last-tab', 'editor-ui-memory-v1', 'editor-tab-url-v1', 'lineup.collapsed', 'pose-sheet-qa-vert-open', 'lineup.inspFolded', 'lineup.rtOpen', 'lineup.standU', 'lineup.vp', 'proc-motion-walk-reset-v98.640', 'project-a-village-group-clip-v1', 'project-a-village-repo-assets-v1'];
  const DEVICE_PRE = ['project-a-layout-backup-', 'pd-', 'proc-motion-walk-reset-'];
  const SAVE = ['three-card-forge-v4', 'three-card-forge-v2', 'three-card-forge-before-v8', 'three-card-forge-before-newgame', 'three-card-config-v1', 'agrenor-leads-v1', 'project-a-started-v1', 'project-a-newgame', 'agrenor-mind-v1', 'agrenor-secret-elements',
    'agrenor-world-v1', 'agrenor-clock-v1', 'agrenor-standalone-v1', 'projectA.resume', 'projectA.heroVariant'];
  const SAVE_PRE = ['projectA.slot.', 'projectA.run', 'projectA.tm'], OWN_PRE = ['bgAsset:', 'bgAssets:', 'projectA.scaleAdjustDraft', 'pose-sheet.scaleDraft'], MANIFEST = ['asset-animation-reviews-v1'];
  function classify(k) {
    k = String(k);
    if (internal(k) || k.startsWith('es-')) return 'internal';
    if (k === LAYOUT || k === LAYOUT_POS) return 'layout';
    if (SYNC.includes(k) || SYNC_PRE.some(p => k.startsWith(p)) || (root.GAME_SETTINGS && k in root.GAME_SETTINGS) || k in seenMap()) return 'sync';   /* seenMap = every pushed key this browser has loaded (pages without js/game-settings.js know them too) */
    if (MANIFEST.includes(k)) return 'manifest';
    if (DEVICE.includes(k) || DEVICE_PRE.some(p => k.startsWith(p))) return 'device';
    if (SAVE.includes(k) || SAVE_PRE.some(p => k.startsWith(p))) return 'save';
    if (OWN_PRE.some(p => k.startsWith(p))) return 'own';
    return 'unknown';
  }
  const UNK = 'es-unknown';
  function noteUnknown(k) { try { if (classify(k) !== 'unknown') return; const l = JSON.parse(nGet.call(LS, UNK) || '[]'); if (l.includes(k)) return; l.push(k); nSet.call(LS, UNK, JSON.stringify(l.slice(-50))); console.warn('[EditorStore] localStorage key "' + k + '" is not classified (sync / device / save) — add it to js/editor-store.js') } catch (e) { } }
  function unknown() { try { return (JSON.parse(nGet.call(LS, UNK) || '[]') || []).filter(k => classify(k) === 'unknown' && nGet.call(LS, k) != null) } catch (e) { return [] } }
  /* keep a copy of something that is about to be dropped (e.g. a stale snapshot file in the Cart) in the backups */
  function keep(key, value, why) { return backup(key, typeof value === 'string' ? value : JSON.stringify(value), why) }
  const BIG = 400 * 1024;   /* a value larger than this is not put into js/game-settings.js (every page loads that file) */
  function same(a, b) { if (a === b) return true; const A = parse(a), B = parse(b); return A !== undefined && B !== undefined && canon(A) === canon(B) }
  /* settings keys with edits that are not pushed yet: pushed keys whose copy differs from the base · listed data keys never pushed at all */
  function drafts(opt = {}) {
    const GS = root.GAME_SETTINGS || {}, out = [];
    const pre = []; try { for (let i = 0; i < LS.length; i++) { const k = LS.key(i); if (k && SYNC_PRE.some(p => k.startsWith(p))) pre.push(k) } } catch (e) { }
    for (const k of new Set([...Object.keys(GS), ...SYNC, ...pre])) {
      const cur = nGet.call(LS, k); if (cur == null || cur === '' || cur === '{}' || cur === '[]') continue;
      const base = nGet.call(LS, BASE + k) ?? GS[k];
      if (base != null && same(cur, base)) continue;
      if (!opt.all && cur.length > BIG) continue;
      out.push(k);
    }
    return out;
  }
  /* the village layout differs from what was pushed */
  function layoutDraft() { const cur = nGet.call(LS, LAYOUT); if (cur == null) return false; const base = nGet.call(LS, BASE + LAYOUT) ?? (root.VillageDefaultLayout ? JSON.stringify(root.VillageDefaultLayout) : null); return base != null && !same(cur, base) }
  /* throw this browser's draft away: back to the pushed value (the draft is backed up first) */
  async function discard(k) {
    const cur = nGet.call(LS, k); if (cur == null) return;
    const base = nGet.call(LS, BASE + k) ?? (k === LAYOUT ? (root.VillageDefaultLayout ? JSON.stringify(root.VillageDefaultLayout) : null) : (root.GAME_SETTINGS || {})[k]);
    await backup(k, cur, 'discard draft');
    if (base == null) LS.removeItem(k); else nSet.call(LS, k, base);   /* a key never pushed: removed (the page uses its defaults · the backup keeps it) */
    if (k === LAYOUT) nSet.call(LS, LAYOUT_POS, '{}');
  }
  const bigDrafts = () => drafts({ all: true }).filter(k => (nGet.call(LS, k) || '').length > BIG);

  /* ---- 3 · backups UI ---- */
  async function backups(k) { return idbGet(k) }
  async function restore(k, i) { const list = await idbGet(k), b = list[i]; if (!b) return false; await backup(k, nGet.call(LS, k), 'before restore'); nSet.call(LS, k, b.v); return true }
  async function openBackups() {
    const d = await db().catch(() => null); if (!d) return alert('เปิดที่เก็บสำรองไม่ได้');
    const keys = await new Promise(r => { const q = d.transaction('bk').objectStore('bk').getAllKeys(); q.onsuccess = () => r(q.result || []); q.onerror = () => r([]) });
    const dl = document.createElement('dialog'); dl.style.cssText = 'max-width:760px;width:94vw;max-height:84vh;overflow:auto;font:14px AgThai,system-ui,sans-serif;border-radius:12px;padding:16px';
    let html = '<h3 style="margin:0 0 6px">📦 สำรองข้อมูลเอดิเตอร์ (ในเบราว์เซอร์นี้)</h3><p style="margin:0 0 10px;color:#666">ก่อนทุกครั้งที่ค่าในเบราว์เซอร์ถูกแทน (โหลดค่าใหม่จาก push · รวมงานจากแท็บอื่น · กู้คืน) ค่าเดิมถูกเก็บไว้ที่นี่ ค่าละ 10 ชุดล่าสุด · กดกู้คืนแล้วโหลดหน้าใหม่</p>';
    for (const k of keys) { const list = await idbGet(k); html += `<details><summary><b>${k}</b> · ${list.length} ชุด</summary><table style="width:100%;border-collapse:collapse">${list.map((b, i) => `<tr><td>${new Date(b.t).toLocaleString('th-TH')}</td><td>${b.why || ''}</td><td>${b.page || ''}</td><td>${Math.round(b.v.length / 1024)} KB</td><td><button data-k="${k}" data-i="${i}">กู้คืน</button></td></tr>`).join('')}</table></details>` }
    if (!keys.length) html += '<p>ยังไม่มีข้อมูลสำรอง</p>';
    html += '<p style="text-align:right"><button data-x>ปิด</button></p>'; dl.innerHTML = html; document.body.append(dl); dl.showModal();
    dl.onclick = async e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.x != null) { dl.close(); dl.remove(); return } if (confirm('กู้คืน ' + b.dataset.k + ' ชุดนี้? (ค่าปัจจุบันจะถูกสำรองก่อน)')) { await restore(b.dataset.k, +b.dataset.i); location.reload() } };
  }
  /* the pushed settings are seeded the moment js/game-settings.js assigns them — even when that file was written by an older push page (its own old SEED then finds nothing to change) */
  try { let gs = root.GAME_SETTINGS; Object.defineProperty(root, 'GAME_SETTINGS', { configurable: true, enumerable: true, get: () => gs, set: v => { gs = v; seed(v) } }) } catch (e) { }
  try { let vl = root.VillageDefaultLayout; Object.defineProperty(root, 'VillageDefaultLayout', { configurable: true, enumerable: true, get: () => vl, set: v => { vl = v; seedLayout(v) } }) } catch (e) { }
  root.EditorStore = { seed, seedLayout, markPushed, afterPush, drafts, layoutDraft, discard, bigDrafts, classify, unknown, keep, SYNC, LAYOUT, backups, restore, openBackups, merges: () => merges, _diff: diff, _apply: apply };
})(globalThis);
