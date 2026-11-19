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
    k = String(k); v = String(v);
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
  function seed(GS) {
    if (!GS || typeof GS !== 'object') return;
    const seen = seenMap(), first = nGet.call(LS, 'es-first-backup') == null;
    for (const [k, web] of Object.entries(GS)) {
      try {
        const cur = nGet.call(LS, k), base = nGet.call(LS, BASE + k);
        if (first && cur != null) backup(k, cur, 'before EditorStore');
        if (cur === null || cur === web) { nSet.call(LS, k, web); nSet.call(LS, BASE + k, web); seen[k] = hash(web); continue }
        /* the version this browser last took from the web: stored in full (new) · or known by its hash (old SEED) */
        let baseVal = base; if (baseVal == null && seen[k] && hash(cur) === seen[k]) baseVal = cur;
        if (baseVal === web) continue;                                      // the web did not change → the draft stays
        if (baseVal == null || baseVal === cur) {                           // no draft (or unknown) → take the web
          if (baseVal == null && seen[k] && hash(cur) !== seen[k]) {          // old browser copy that WAS edited, base unknown: keep it as a draft on top of the web
            const W = parse(web), C = parse(cur);
            if (isJ(web) && W !== undefined && C !== undefined) { backup(k, cur, 'load: merged onto newer push'); nSet.call(LS, k, JSON.stringify(apply(W, noDel(diff(W, C))))) }   /* no base known: keep everything of both (the draft wins where both differ, nothing is deleted) */
            nSet.call(LS, BASE + k, web); seen[k] = hash(web); continue;
          }
          backup(k, cur, 'load: newer push'); nSet.call(LS, k, web); nSet.call(LS, BASE + k, web); seen[k] = hash(web); continue;
        }
        /* both changed: the draft's own changes go onto the newer pushed value */
        const W = parse(web), B = parse(baseVal), C = parse(cur);
        backup(k, cur, 'load: both changed');
        if (isJ(web) && W !== undefined && B !== undefined && C !== undefined) nSet.call(LS, k, JSON.stringify(apply(W, diff(B, C))));
        nSet.call(LS, BASE + k, web); seen[k] = hash(web);
      } catch (e) { }
    }
    nSet.call(LS, SEEN, JSON.stringify(seen));
    if (first) nSet.call(LS, 'es-first-backup', String(Date.now()));
  }
  /* after a Cart push: what was pushed is the new base (so later pushes from elsewhere load again) */
  function markPushed(k, v) { if (v == null) return; const seen = seenMap(); nSet.call(LS, BASE + k, v); seen[k] = hash(v); nSet.call(LS, SEEN, JSON.stringify(seen)) }
  /* keys with edits that are not pushed yet */
  function drafts() { const GS = root.GAME_SETTINGS || {}, out = []; for (const k of Object.keys(GS)) { const cur = nGet.call(LS, k), base = nGet.call(LS, BASE + k); if (cur != null && base != null && cur !== base) out.push(k) } return out }

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
  root.EditorStore = { seed, markPushed, drafts, backups, restore, openBackups, merges: () => merges, _diff: diff, _apply: apply };
})(globalThis);
