/* v98.55 · Editor sync pill — "is this computer's editor data the one on the web?"  (replaces the old yellow "!" of editor-deploy-status.js)
   Why: the editors keep their own copy in the browser (localStorage) and that copy WINS over what was pushed to GitHub. Ctrl+F5 never clears it,
   so after editing on another computer the old data stayed.
   Two units are compared with the LIVE files on the web (fetched without cache every minute and on tab focus):
     • ผังหมู่บ้าน  — localStorage `project-a-village-editor-v67` (+ positions) vs js/village-layout-v67.js
     • ค่าตั้งค่า    — every key listed in js/game-settings.js (menu icons, NPC routes, places, place maps, card layout, motion…) vs the browser's copy
   One pill (bottom-left) shows the worst state: ✓ in sync · ⬇ the web is newer (no unpushed edits here → safe) · ⚠ edits here not pushed yet ·
   ❗ both changed. Click → per-unit list; "use the web copy" first backs this computer's copy up (3 kept) and can be undone.
   Nothing is ever replaced without a click. Runs in editor.html and in a stand-alone village map editor (?edit=1); not twice (an iframe defers to its parent). */
(function (root) {
  'use strict';
  const inEditor = /editor\.html$/.test(location.pathname), standalone = /[?&]edit=1/.test(location.search);
  if (!inEditor && !standalone) return;
  try { if (root.top !== root && root.top.LayoutSync) return } catch (e) { }
  const STORE = 'project-a-village-editor-v67', POS = 'project-a-village-main-v1', BASE = 'project-a-layout-sync-v1', BK = 'project-a-layout-backup-';
  const ls = { get: k => { try { return localStorage.getItem(k) } catch (e) { return null } }, set: (k, v) => { try { localStorage.setItem(k, v) } catch (e) { } }, del: k => { try { localStorage.removeItem(k) } catch (e) { } } };
  const canon = v => JSON.stringify(v, (k, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(i => [i, x[i]])) : x);
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h >>> 0).toString(36) };
  const grab = (t, name) => { try { const i = t.indexOf(name + '='), a = t.indexOf('{', i), b = t.lastIndexOf('};'); return i < 0 || a < 0 || b < 0 ? null : JSON.parse(t.slice(a, b + 1)) } catch (e) { return null } };
  const fetchText = async f => { const r = await fetch(new URL(f, location.href).href + '?cb=' + Date.now(), { cache: 'no-store' }); if (!r.ok) throw Error(r.status); return r.text() };
  const worse = ['ok', 'newer', 'unpushed', 'both'], listeners = [];
  const notify = () => listeners.forEach(f => { try { f() } catch (e) { } });
  const units = {
    layout: { name: 'ผังหมู่บ้าน', st: null, keys: [STORE, POS], local: null, rem: null, L: null, R: null, take: null },
    settings: { name: 'ค่าตั้งค่า (ไอคอน เส้นทาง NPC สถานที่ แผนที่ย่อย ฯลฯ)', st: null, keys: [], local: null, rem: null, L: null, R: null, take: null }
  };
  let pill, dlg;

  async function check() {
    try {
      const [lt, gt] = await Promise.all([fetchText('js/village-layout-v67.js'), fetchText('js/game-settings.js')]);
      const lay = grab(lt, 'window.VillageDefaultLayout'), set = grab(gt, 'window.GAME_SETTINGS');
      if (lay) { const u = units.layout, raw = ls.get(STORE); u.R = hash(canon(lay)); try { u.L = raw == null ? null : hash(canon(JSON.parse(raw))) } catch (e) { u.L = 'bad' } u.same = u.L == null || u.L === u.R }
      if (set) { const u = units.settings, ks = Object.keys(set).filter(k => k !== POS); u.keys = ks; u.remote = set; u.R = hash(ks.map(k => set[k]).join('\u0001')); u.L = hash(ks.map(k => ls.get(k) ?? set[k]).join('\u0001')); u.same = u.L === u.R }
    } catch (e) { return }
    let B = {}; try { B = JSON.parse(ls.get(BASE) || '{}') || {} } catch (e) { }
    if (B.rem) B = { layout: B, settings: null }; // v98.54 stored only the layout baseline
    for (const [id, u] of Object.entries(units)) {
      if (u.R == null) { u.st = null; continue }
      const b = B[id];
      if (u.same) { B[id] = { rem: u.R, loc: u.L ?? u.R }; u.st = 'ok' }
      else { const moved = !b || b.rem !== u.R, edited = !b || b.loc !== u.L; u.st = moved && edited ? 'both' : moved ? 'newer' : 'unpushed' }
    }
    ls.set(BASE, JSON.stringify(B)); draw();
  }
  const overall = () => Object.values(units).reduce((a, u) => u.st && worse.indexOf(u.st) > worse.indexOf(a) ? u.st : a, 'ok');
  const TXT = { ok: ['✓ ตรงกับบนเว็บ', '#2f7d3a'], newer: ['⬇ มีข้อมูลใหม่บนเว็บ', '#2a6fb0'], unpushed: ['⚠ มีงานในเครื่องที่ยังไม่ push', '#b0701a'], both: ['❗ เครื่องนี้และเว็บต่างกัน', '#a8402f'] };
  function draw() {
    notify();
    if (inEditor) return;   /* v98.96 · inside editor.html the state is shown on the top-bar ⬆ รอ Push button instead */
    if (!pill) {
      pill = document.createElement('button'); pill.id = 'layoutSync'; pill.type = 'button';
      pill.style.cssText = 'position:fixed;left:10px;bottom:56px;z-index:60;font:700 12px system-ui,sans-serif;color:#fff;border:0;border-radius:999px;padding:5px 12px;cursor:pointer;box-shadow:0 2px 8px #0006';
      pill.onclick = open; document.body.append(pill);
    }
    const s = overall(), [t, c] = TXT[s]; pill.textContent = t; pill.style.background = c; pill.style.opacity = s === 'ok' ? '.55' : '1';
    pill.title = 'เทียบข้อมูลที่แก้ในเครื่องนี้กับที่ push ไว้บนเว็บ · คลิกเพื่อดูรายละเอียด';
  }
  const backups = () => { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(BK)) out.push(k) } } catch (e) { } return out.sort() };
  const keysOf = id => id === 'layout' ? units.layout.keys : units.settings.keys;
  function backup(id) {
    const m = Object.fromEntries(keysOf(id).map(k => [k, ls.get(k)])); const k = BK + Date.now(); ls.set(k, JSON.stringify({ unit: id, keys: m }));
    for (const old of backups().slice(0, -3)) ls.del(old); return k;
  }
  function takeWeb(id) {
    backup(id); const u = units[id];
    if (id === 'layout') { ls.del(STORE); ls.del(POS) }
    else for (const k of u.keys) if (ls.get(k) != null && ls.get(k) !== u.remote[k]) ls.set(k, u.remote[k]);   /* keys the browser never touched already follow the web */
    const B = JSON.parse(ls.get(BASE) || '{}'); delete B[id]; ls.set(BASE, JSON.stringify(B)); location.reload();
  }
  function restore() {
    const k = backups().pop(); if (!k) return; let b; try { b = JSON.parse(ls.get(k)) } catch (e) { return }
    for (const [key, v] of Object.entries(b.keys || {})) if (v == null) ls.del(key); else ls.set(key, v);
    const B = JSON.parse(ls.get(BASE) || '{}'); delete B[b.unit]; ls.set(BASE, JSON.stringify(B)); ls.del(k); location.reload();
  }
  const MSG = {
    ok: 'ตรงกับที่ push ไว้บนเว็บ',
    newer: 'บนเว็บมีข้อมูลใหม่กว่า (มีคน push จากเครื่องอื่น) · เครื่องนี้ไม่มีงานค้าง → ดึงมาใช้ได้ปลอดภัย',
    unpushed: 'เครื่องนี้มีการแก้ที่ยังไม่ push · เว็บยังเป็นของเดิม → กด ⬆ push ก่อนเปลี่ยนเครื่อง ไม่งั้นเครื่องอื่นจะไม่เห็น',
    both: 'ทั้งเครื่องนี้และเว็บเปลี่ยนไม่เหมือนกัน (หรือไม่รู้ว่าอันไหนใหม่กว่า) · ถ้าดึงจากเว็บ งานที่ยังไม่ push ในเครื่องนี้จะถูกแทนที่ (สำรองให้ก่อน กู้คืนได้)'
  };
  function open() {
    if (!dlg) { dlg = document.createElement('dialog'); dlg.style.cssText = 'max-width:460px;border:1px solid #b9ae93;border-radius:10px;padding:16px;background:#fffdf6;color:#2a2418;font:14px system-ui,sans-serif'; document.body.append(dlg) }
    const hasBk = backups().length;
    dlg.innerHTML = `<b>ข้อมูลในเครื่องนี้ vs เว็บ</b>` + Object.entries(units).filter(([, u]) => u.st).map(([id, u]) => `<div style="margin:12px 0;padding:8px 10px;border-left:4px solid ${TXT[u.st][1]};background:#0000000a"><b>${u.name}</b> · ${TXT[u.st][0]}<div style="margin:4px 0 6px;font-size:13px">${MSG[u.st]}</div>${u.st !== 'ok' ? `<button data-take="${id}" style="padding:5px 10px">⬇ ใช้ของเว็บ (สำรองก่อน)</button>` : ''}</div>`).join('')
      + `<div style="display:flex;gap:8px;flex-wrap:wrap">${hasBk ? '<button id="lsRestore" style="padding:6px 12px">↩ กู้คืนชุดสำรองล่าสุด</button>' : ''}<button id="lsClose" style="padding:6px 12px">ปิด</button></div><p style="color:#7a6e55;font-size:12px;margin:10px 0 0">สำรองไว้ ${hasBk} ชุด (เก็บ 3 ชุดล่าสุด) · ตรวจทุก 1 นาทีและเมื่อกลับมาที่แท็บนี้ · เว็บอาจช้ากว่า GitHub 1–2 นาทีหลัง push</p>`;
    dlg.querySelector('#lsClose').onclick = () => dlg.close(); dlg.querySelector('#lsRestore')?.addEventListener('click', restore);
    dlg.querySelectorAll('[data-take]').forEach(b => b.onclick = () => takeWeb(b.dataset.take));
    dlg.showModal();
  }
  const go = () => { setTimeout(check, 3500); setInterval(check, 60000); addEventListener('focus', check); document.addEventListener('visibilitychange', () => { if (!document.hidden) check() }) };
  document.body ? go() : addEventListener('DOMContentLoaded', go);
  /* what the top-bar button shows: units with edits not pushed yet (unpushed / both) and units where the web is newer */
  const pending = () => Object.values(units).filter(u => u.st === 'unpushed' || u.st === 'both').length;
  const newer = () => Object.values(units).filter(u => u.st === 'newer' || u.st === 'both').length;
  const describe = () => Object.values(units).filter(u => u.st && u.st !== 'ok').map(u => u.name + ': ' + TXT[u.st][0]);
  root.LayoutSync = { check, state: () => overall(), units: () => units, backup, takeWeb, restore, open, pending, newer, describe, refresh: draw, onChange: f => listeners.push(f) };
})(globalThis);
