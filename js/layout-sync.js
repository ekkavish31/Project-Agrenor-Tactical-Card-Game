/* v98.54 · Map-editor layout sync — "is this computer's village layout the one on the web?"
   Why: the editor keeps its own copy of the layout in the browser (localStorage `project-a-village-editor-v67`) and that copy WINS over the pushed
   default (js/village-layout-v67.js). Ctrl+F5 never clears it, so after editing on another computer the old layout stayed.
   What it does (map editor page only, ?edit=1): fetches the live village-layout-v67.js (no cache) every minute and on tab focus, compares it with the
   local copy and shows a small pill:
     ✓ in sync · ⬇ the web has a newer layout (this computer has no unpushed edits → safe to take it) · ⚠ this computer has edits not pushed yet ·
     ❗ both changed (taking the web copy loses this computer's edits).
   "Take the web layout" first copies the local layout to a backup (3 kept) and can be undone from the same panel. Nothing is ever replaced without a click. */
(function (root) {
  'use strict';
  if (!/[?&]edit=1/.test(location.search)) return;
  const STORE = 'project-a-village-editor-v67', EXTRA = ['project-a-village-main-v1'], BASE = 'project-a-layout-sync-v1', BK = 'project-a-layout-backup-';
  const ls = { get: k => { try { return localStorage.getItem(k) } catch (e) { return null } }, set: (k, v) => { try { localStorage.setItem(k, v) } catch (e) { } }, del: k => { try { localStorage.removeItem(k) } catch (e) { } } };
  const canon = v => JSON.stringify(v, (k, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(i => [i, x[i]])) : x);
  const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h >>> 0).toString(36) };
  const parse = t => { try { const i = t.indexOf('window.VillageDefaultLayout='), a = t.indexOf('{', i), b = t.lastIndexOf('};'); return i < 0 || a < 0 || b < 0 ? null : JSON.parse(t.slice(a, b + 1)) } catch (e) { return null } };
  const localHash = () => { const r = ls.get(STORE); if (r == null) return null; try { return hash(canon(JSON.parse(r))) } catch (e) { return 'bad' } };
  let R = null, state = null, pill, dlg;

  async function check() {
    try {
      const res = await fetch(new URL('js/village-layout-v67.js', location.href).href + '?cb=' + Date.now(), { cache: 'no-store' }); if (!res.ok) return;
      const lay = parse(await res.text()); if (!lay) return; R = hash(canon(lay));
    } catch (e) { return }
    const L = localHash();
    let B = null; try { B = JSON.parse(ls.get(BASE) || 'null') } catch (e) { }
    if (L == null || L === R) { ls.set(BASE, JSON.stringify({ rem: R, loc: L ?? R })); state = 'ok' }
    else {
      const remoteMoved = !B || B.rem !== R, localEdited = !B || B.loc !== L;
      state = remoteMoved && localEdited ? 'both' : remoteMoved ? 'newer' : 'unpushed';
    }
    draw();
  }
  const TXT = { ok: ['✓ ตรงกับบนเว็บ', '#2f7d3a'], newer: ['⬇ มีผังใหม่บนเว็บ', '#2a6fb0'], unpushed: ['⚠ มีงานในเครื่องที่ยังไม่ push', '#b0701a'], both: ['❗ เครื่องนี้และเว็บต่างกัน', '#a8402f'] };
  function draw() {
    if (!pill) {
      pill = document.createElement('button'); pill.id = 'layoutSync'; pill.type = 'button';
      pill.style.cssText = 'position:fixed;left:10px;bottom:56px;z-index:60;font:700 12px system-ui,sans-serif;color:#fff;border:0;border-radius:999px;padding:5px 12px;cursor:pointer;box-shadow:0 2px 8px #0006;opacity:.92';
      pill.onclick = open; document.body.append(pill);
    }
    const [t, c] = TXT[state]; pill.textContent = t; pill.style.background = c; pill.title = 'เทียบผังหมู่บ้านในเครื่องนี้กับที่ push ไว้บนเว็บ · คลิกเพื่อดูรายละเอียด';
    pill.style.opacity = state === 'ok' ? '.55' : '1';
  }
  const backups = () => { const out = []; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k.startsWith(BK)) out.push(k) } } catch (e) { } return out.sort() };
  function backup() {
    const raw = ls.get(STORE); if (raw == null) return null;
    const k = BK + Date.now(); ls.set(k, JSON.stringify({ [STORE]: raw, extra: Object.fromEntries(EXTRA.map(e => [e, ls.get(e)])) }));
    for (const old of backups().slice(0, -3)) ls.del(old); return k;
  }
  function takeWeb() { backup(); ls.del(STORE); for (const e of EXTRA) ls.del(e); ls.del(BASE); location.reload() }
  function restore() {
    const k = backups().pop(); if (!k) return; let b; try { b = JSON.parse(ls.get(k)) } catch (e) { return }
    ls.set(STORE, b[STORE]); for (const [e, v] of Object.entries(b.extra || {})) if (v != null) ls.set(e, v); ls.del(BASE); location.reload()
  }
  function open() {
    if (!dlg) { dlg = document.createElement('dialog'); dlg.style.cssText = 'max-width:420px;border:1px solid #b9ae93;border-radius:10px;padding:16px;background:#fffdf6;color:#2a2418;font:14px system-ui,sans-serif'; document.body.append(dlg) }
    const MSG = {
      ok: 'ผังหมู่บ้านในเครื่องนี้ตรงกับที่ push ไว้บนเว็บ',
      newer: 'บนเว็บมีผังใหม่กว่า (มีคน push จากเครื่องอื่น) · เครื่องนี้ไม่มีงานที่ยังไม่ push → ดึงมาใช้ได้ปลอดภัย',
      unpushed: 'เครื่องนี้มีการแก้ผังที่ยังไม่ได้ push · เว็บยังเป็นผังเดิม → กด ⬆ push ในตัวแก้ไขก่อนเปลี่ยนเครื่อง ไม่งั้นเครื่องอื่นจะไม่เห็น',
      both: 'ทั้งเครื่องนี้และเว็บมีการเปลี่ยนแปลงที่ต่างกัน (หรือไม่รู้ว่าอันไหนใหม่กว่า) · ถ้าดึงผังจากเว็บ งานที่ยังไม่ push ในเครื่องนี้จะถูกแทนที่ (แต่สำรองไว้ให้ก่อน กู้คืนได้)'
    };
    const hasBk = backups().length, canTake = state !== 'ok';
    dlg.innerHTML = `<b>ผังหมู่บ้าน · เครื่องนี้ vs เว็บ</b><p style="margin:10px 0">${MSG[state]}</p><div style="display:flex;gap:8px;flex-wrap:wrap">`
      + (canTake ? `<button id="lsTake" style="padding:6px 12px">⬇ ใช้ผังจากเว็บ (สำรองของเครื่องนี้ก่อน)</button>` : '')
      + (hasBk ? `<button id="lsRestore" style="padding:6px 12px">↩ กู้คืนชุดสำรองล่าสุด</button>` : '')
      + `<button id="lsClose" style="padding:6px 12px">ปิด</button></div><p style="color:#7a6e55;font-size:12px;margin:10px 0 0">สำรองไว้ ${hasBk} ชุด (เก็บ 3 ชุดล่าสุด) · ตรวจทุก 1 นาทีและเมื่อกลับมาที่แท็บนี้ · เว็บอาจช้ากว่า GitHub 1–2 นาทีหลัง push</p>`;
    dlg.querySelector('#lsClose').onclick = () => dlg.close();
    dlg.querySelector('#lsTake')?.addEventListener('click', takeWeb); dlg.querySelector('#lsRestore')?.addEventListener('click', restore);
    dlg.showModal();
  }
  setTimeout(check, 3500); setInterval(check, 60000);
  addEventListener('focus', check); document.addEventListener('visibilitychange', () => { if (!document.hidden) check() });
  root.LayoutSync = { check, state: () => state, backup, takeWeb, restore, localHash, remoteHash: () => R };
})(globalThis);
