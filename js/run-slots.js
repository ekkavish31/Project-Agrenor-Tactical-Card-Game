/* v98.906 · RUN SLOTS — 5 runs (playthroughs), each with its own auto save and its own manual saves.
   • The game keeps writing its usual keys (the WORKING COPY: three-card-forge-v4, world, mind, clock …). That is the active run.
   • Choosing a run happens on the title screen (New Game → pick a slot · Load → pick a run, then its auto save or one of its manual saves).
     From then on the active run is AUTO SAVED: a copy of every progress key goes to 'projectA.run.N' (every few seconds when something changed, and when the page is hidden / closed).
   • Manual saves (the 💾 / 📂 menu in game) belong to the active run: 'projectA.run.N.m.1..3'. They never mix between runs.
   • Switching run = copy that run's data over the working keys, then reload the page (js/title-screen.js reads the save right after this file, so every frame sees the same save).
   Keys: 'projectA.runs' (registry) · 'projectA.run.N' (auto) · 'projectA.run.N.m.I' (manual). All are 'save' keys for js/editor-store.js.
   Must load BEFORE js/title-screen.js and js/core.js. */
(function (root) {
  'use strict';
  const N = 5, MANUAL = 3, REG = 'projectA.runs', PENDING = 'projectA.pendingRun', HOME = 'projectA.startHome', RESUME = 'projectA.resume';
  const FORGE = 'three-card-forge-v4';
  const AUTO_KEYS = [FORGE, 'project-a-started-v1', 'agrenor-world-v1', 'agrenor-mind-v1', 'agrenor-clock-v1', 'agrenor-standalone-v1', RESUME];
  const MANUAL_KEYS = AUTO_KEYS.filter(k => k !== RESUME);
  const ls = { get: k => { try { return localStorage.getItem(k) } catch (e) { return null } }, set: (k, v) => { try { localStorage.setItem(k, v); return true } catch (e) { warning = 'บันทึกไม่ได้ (พื้นที่เบราว์เซอร์เต็ม) · ลบ Run ที่ไม่ใช้หรือเซฟเก่าก่อน'; return false } }, del: k => { try { localStorage.removeItem(k) } catch (e) { } } };
  const json = k => { try { return JSON.parse(ls.get(k) || 'null') } catch (e) { return null } };
  const runKey = n => 'projectA.run.' + n, manKey = (n, i) => 'projectA.run.' + n + '.m.' + i;
  let warning = '';
  /* ---------- v98.1080 · TIME MACHINE (dev) — an automatic checkpoint at every story step, rewind to any of them ----------
     'projectA.tm' = [{id, run, t, step, title, text, old?}] · 'projectA.tm.<id>' = {data:{…progress keys…}} · at most TM_MAX per run (oldest dropped).
     A rewind first keeps the CURRENT line as a checkpoint (old:true "สายเดิม") so nothing is lost, then loads the chosen one and starts at home. */
  const TM_KEY = 'projectA.tm', TM_PRE = 'projectA.tm.', TM_PENDING = 'projectA.pendingTm', TM_MAX = 20;
  const tmList = () => { const l = json(TM_KEY); return Array.isArray(l) ? l : [] };
  const tmPut = l => ls.set(TM_KEY, JSON.stringify(l));
  const tmDev = () => { try { return localStorage.getItem('projectA.dev') === '1' || !!JSON.parse(localStorage.getItem('projectA.github') || '{}').token } catch (e) { return false } };
  function tmSnap(extra) {
    const g = json(FORGE); if (!hasProgress(g)) return null;
    const run = reg().active || 0; let list = tmList(); const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
    if (extra.step && !extra.old) { for (const e of list.filter(x => x.run === run && !x.old && x.step === extra.step)) { ls.del(TM_PRE + e.id) } list = list.filter(x => !(x.run === run && !x.old && x.step === extra.step)) }   /* the same step again: keep only the latest */
    const entry = { id, run, t: Date.now(), text: summary(g), ...extra };
    let ok = ls.set(TM_PRE + id, JSON.stringify({ data: copyOut(MANUAL_KEYS) })), guard = 0;
    while (!ok && list.length && guard++ < 6) { const o = list.shift(); ls.del(TM_PRE + o.id); ok = ls.set(TM_PRE + id, JSON.stringify({ data: copyOut(MANUAL_KEYS) })) }   /* browser storage full: drop the oldest and retry */
    if (!ok) return null;
    list.push(entry);
    const mine = list.filter(x => x.run === run); while (mine.length > TM_MAX) { const o = mine.shift(); ls.del(TM_PRE + o.id); list = list.filter(x => x.id !== o.id) }
    tmPut(list); return entry;
  }

  function summary(g) { if (!g) return 'ว่าง'; const v = g.village || {}, h = Math.floor((g.minutes || 480) / 60), m = (g.minutes || 480) % 60; return `${v.heroName || 'นักผจญภัย'} · Lv.${v.character?.level || 1} · วันที่ ${g.day || 1} · ${h}:${String(m).padStart(2, '0')}` }
  const hasProgress = g => !!g && !!(ls.get('project-a-started-v1') || g.village?.heroName || g.day > 1 || g.inventory?.length || g.wins);
  function reg() { const r = json(REG); return r && typeof r === 'object' && r.runs ? r : { v: 1, active: 0, runs: {} } }
  function putReg(r) { ls.set(REG, JSON.stringify(r)) }
  const copyOut = keys => { const d = {}; for (const k of keys) d[k] = ls.get(k); return d };
  const copyIn = (data, keys) => { for (const k of keys) { const v = data ? data[k] : null; if (v == null) ls.del(k); else ls.set(k, v) } };

  /* ---------- boot: migrate once · apply a pending run switch ---------- */
  function boot() {
    let r = reg(), changed = false;
    /* first time with this system: whatever is in the working copy becomes Run 1 (and the old three manual slots become its manual saves) */
    if (!r.active && !Object.keys(r.runs).length) {
      const g = json(FORGE);
      if (hasProgress(g)) {
        r.active = 1; r.runs[1] = { at: Date.now(), text: summary(g), created: Date.now() };
        ls.set(runKey(1), JSON.stringify({ at: Date.now(), text: summary(g), data: copyOut(AUTO_KEYS) }));
        for (let i = 1; i <= MANUAL; i++) { const o = json('projectA.slot.' + i); if (o?.data) { ls.set(manKey(1, i), JSON.stringify(o)); ls.del('projectA.slot.' + i) } }
        changed = true;
      }
    }
    let p = null; try { p = JSON.parse(sessionStorage.getItem(PENDING) || 'null'); sessionStorage.removeItem(PENDING) } catch (e) { }
    if (p && p.n >= 1 && p.n <= N) {
      const o = p.kind === 'manual' ? json(manKey(p.n, p.i)) : json(runKey(p.n));
      if (o?.data) {
        if (p.kind === 'manual') { copyIn(o.data, MANUAL_KEYS); ls.del(RESUME); try { sessionStorage.setItem(HOME, '1') } catch (e) { } }
        else copyIn(o.data, AUTO_KEYS);
        r.active = p.n; if (!r.runs[p.n]) r.runs[p.n] = { created: Date.now() }; changed = true;
        try { sessionStorage.removeItem('project-a-newgame') } catch (e) { }
      }
    }
    /* v98.1080 · TIME MACHINE: a pending rewind (set by RunSlots.tm.rewind) copies that checkpoint over the working keys and starts at home, like loading a manual save */
    let q = null; try { q = sessionStorage.getItem(TM_PENDING); sessionStorage.removeItem(TM_PENDING) } catch (e) { }
    if (q) { const e = tmList().find(x => x.id === q), o = e && json(TM_PRE + q);
      if (o?.data) { copyIn(o.data, MANUAL_KEYS); ls.del(RESUME); try { sessionStorage.setItem(HOME, '1'); sessionStorage.removeItem('project-a-newgame') } catch (er) { } if (e.run) { r.active = e.run; if (!r.runs[e.run]) r.runs[e.run] = { created: Date.now() }; changed = true } } }
    if (changed) putReg(r);
  }

  /* ---------- auto save: working copy → the active run ---------- */
  let last = '';
  function mirror(force) {
    const r = reg(); if (!r.active) return false;
    const g = json(FORGE); if (!hasProgress(g)) return false;     /* nothing to keep (new game just cleared, or before the first save) */
    const data = copyOut(AUTO_KEYS), sig = AUTO_KEYS.map(k => (data[k] || '').length + ':' + (data[k] || '').slice(-40)).join('|');
    if (!force && sig === last) return true; last = sig;
    const now = Date.now(); r.runs[r.active] = { ...(r.runs[r.active] || { created: now }), at: now, text: summary(g) };
    const ok = ls.set(runKey(r.active), JSON.stringify({ at: now, text: summary(g), data }));
    if (ok) putReg(r); return ok;
  }
  /* ---------- manual saves of the active run ---------- */
  function hostSave() { try { let w = root; for (let i = 0; i < 4; i++) { if (typeof w.save === 'function' && w.s && w.s.village) { w.save(); return } if (w.parent === w) break; w = w.parent } } catch (e) { } }
  const api = {
    N, MANUAL, keys: () => AUTO_KEYS.slice(), warning: () => warning,
    active: () => reg().active || 0,
    /* the five runs for the title screen: { n, empty, text, at, active, manual:[{i,empty,text,at}×3] } */
    list() { const r = reg(); return Array.from({ length: N }, (_, k) => { const n = k + 1, d = r.runs[n], o = json(runKey(n)); const empty = !o?.data;
      return { n, empty, active: r.active === n, text: empty ? 'ว่าง' : (o.text || d?.text || ''), at: empty ? 0 : (o.at || d?.at || 0),
        manual: Array.from({ length: MANUAL }, (_, j) => { const m = json(manKey(n, j + 1)); return { i: j + 1, empty: !m?.data, text: m?.data ? m.text : 'ว่าง', at: m?.at || 0 } }) } }) },
    anyRun: () => api.list().some(x => !x.empty),
    /* New Game in slot n: the current run is kept, slot n is emptied (its manual saves too) and becomes the active run. The caller then clears the working keys. */
    beginNew(n) { mirror(true); const r = reg(); ls.del(runKey(n)); for (let i = 1; i <= MANUAL; i++) ls.del(manKey(n, i)); r.active = n; r.runs[n] = { created: Date.now(), at: Date.now(), text: 'เกมใหม่' }; putReg(r); last = ''; return true },
    /* load run n (auto save) / one of its manual saves: remember the choice and reload — boot() above applies it before the game reads anything */
    load(n, kind = 'auto', i = 0) { const o = kind === 'manual' ? json(manKey(n, i)) : json(runKey(n)); if (!o?.data) return false; mirror(true);
      try { sessionStorage.setItem(PENDING, JSON.stringify({ n, kind, i })) } catch (e) { return false } try { top.location.reload() } catch (e) { location.reload() } return true },
    mirror,
    manual: {
      info: i => { const n = reg().active; return n ? json(manKey(n, i)) : null },
      save(i) { let n = reg().active; if (!n) { const free = api.list().find(x => x.empty); n = free ? free.n : 1; const r = reg(); r.active = n; r.runs[n] = { created: Date.now() }; putReg(r) }
        hostSave(); const g = json(FORGE); if (!g) return false; const now = Date.now(); const ok = ls.set(manKey(n, i), JSON.stringify({ at: now, text: summary(g), data: copyOut(MANUAL_KEYS) })); mirror(true); return ok },
      load(i) { const n = reg().active; return n ? api.load(n, 'manual', i) : false }
    },
    summary
  };

  /* ---------- picker dialog (title screen) ----------
     ui('new', n => …)  : choose which of the 5 runs the new game goes into (an occupied run needs a second click to be replaced)
     ui('load')         : every run with its auto save and manual saves; a click loads it (the page reloads) */
  api.ui = function (mode, cb) {
    document.getElementById('runSlotsUI')?.remove();
    const d = document.createElement('div'); d.id = 'runSlotsUI';
    d.style.cssText = 'position:fixed;inset:0;z-index:2100;display:flex;align-items:center;justify-content:center;background:#000a;font:15px/1.5 AgThai,system-ui,Tahoma,sans-serif';
    const when = t => t ? new Date(t).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '';
    const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    /* v98.1088 · pick a slot (it turns into a paper card, dark ink) and then press the Start button: nothing happens on the slot click itself */
    const css = 'display:block;width:100%;text-align:left;margin:4px 0;padding:8px 12px;border-radius:9px;border:2px solid #b9c48a77;background:#1d2f29;color:#f5e6c4;font:inherit;cursor:pointer';
    const rows = api.list().map(r => {
      if (mode === 'new') return `<button class="rs-slot" style="${css}" aria-pressed="false" data-n="${r.n}" data-full="${r.empty ? '' : '1'}"><b>Run ${r.n}</b>${r.active ? ' · กำลังเล่น' : ''} · ${esc(r.empty ? 'ว่าง' : r.text)}<br><small data-hint>${r.empty ? 'เริ่มเกมใหม่ที่ช่องนี้' : 'มีเซฟอยู่แล้ว · เริ่มใหม่จะแทนที่ (เซฟมือของ Run นี้ถูกลบด้วย)'}</small></button>`;
      if (r.empty) return '';
      return `<div style="margin:8px 0;padding:6px;border:1px solid #b9c48a44;border-radius:10px"><b>Run ${r.n}</b>${r.active ? ' · กำลังเล่น' : ''}`
        + `<button class="rs-slot" style="${css}" aria-pressed="false" data-n="${r.n}" data-kind="auto">เซฟอัตโนมัติ · ${esc(r.text)}<br><small>${when(r.at)}</small></button>`
        + r.manual.filter(m => !m.empty).map(m => `<button class="rs-slot" style="${css}" aria-pressed="false" data-n="${r.n}" data-kind="manual" data-i="${m.i}">💾 เซฟมือ ${m.i} · ${esc(m.text)}<br><small>${when(m.at)}</small></button>`).join('') + '</div>';
    }).join('');
    d.innerHTML = `<style>#runSlotsUI .rs-slot small{color:#cdbb92}#runSlotsUI .rs-slot:hover{border-color:#ffd88a}#runSlotsUI .rs-slot[aria-pressed=true]{background:#f2e7ca!important;color:#3e2a18!important;border-color:#c9901f!important;box-shadow:0 0 0 2px #ffd97866}#runSlotsUI .rs-slot[aria-pressed=true] small{color:#705737}#runSlotsUI .rs-go{display:block;width:100%;margin:10px 0 4px;padding:11px;border-radius:10px;border:1px solid #7a4b06;background:linear-gradient(#f0c560,#c9901f);color:#2a1a05;font:700 17px inherit;cursor:pointer}#runSlotsUI .rs-go:disabled{cursor:not-allowed;background:#4a4f4c;border-color:#333;color:#aaa}</style>`
      + `<div style="width:min(520px,calc(100vw - 24px));max-height:calc(100dvh - 40px);overflow:auto;padding:18px;border-radius:14px;background:#14231ff7;border:1px solid #b9c48a77;color:#f5e6c4"><h2 style="margin:0 0 8px">${mode === 'new' ? 'เริ่มเกมใหม่ · เลือกช่อง Run' : '📂 โหลดเกม · เลือก Run'}</h2>${rows || '<p>ยังไม่มีเซฟ</p>'}`
      + `<p class="rs-note" style="margin:8px 0 0;min-height:1.4em;font-size:13px;color:#f0b97a">เลือกช่องก่อน แล้วกดปุ่มด้านล่าง</p>`
      + `<button class="rs-go" type="button" disabled>${mode === 'new' ? 'Start · เริ่มเกม' : 'Start · โหลด'}</button><button style="${css};text-align:center" data-x="1">ปิด</button></div>`;
    document.body.append(d);
    let sel = null; const go = d.querySelector('.rs-go'), note = d.querySelector('.rs-note');
    const pick = b => { sel = b; d.querySelectorAll('.rs-slot').forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false')); go.disabled = false;
      note.textContent = mode === 'new' && b.dataset.full ? '⚠ Run นี้มีเซฟอยู่ · กด Start จะเริ่มใหม่ทับ' : 'พร้อมแล้ว · กด Start'; note.style.color = mode === 'new' && b.dataset.full ? '#ffb48a' : '#a8e6a0' };
    const start = () => { if (!sel) return; const n = +sel.dataset.n; d.remove(); if (mode === 'new') cb && cb(n); else api.load(n, sel.dataset.kind || 'auto', +sel.dataset.i || 0) };
    d.onclick = e => {
      const b = e.target.closest('button'); if (e.target === d || b?.dataset.x) { d.remove(); return }
      if (b === go) { start(); return } if (b?.classList.contains('rs-slot')) pick(b);
    };
    d.addEventListener('keydown', e => { if (e.key === 'Escape') d.remove(); else if (e.key === 'Enter' && sel && !e.target.closest?.('.rs-slot')) { e.preventDefault(); start() } });
    d.querySelector('button')?.focus();
  };
  api.tm = {
    dev: tmDev,
    /* called by js/story-quests.js each time the story moves to a new step */
    mark() { try { const S = root.Story, st = S?.state?.(); if (!st || st.mode === 'off' || st.mode === 'offer') return null; const x = S.steps?.[st.i]; return tmSnap({ step: st.mode === 'done' ? 'end' : (x?.id || 'step' + st.i), title: st.mode === 'done' ? 'จบเรื่องหลักช่วงนี้' : (x?.title || '') }) } catch (e) { return null } },
    list: () => { const act = reg().active || 0; return tmList().filter(x => x.run === act || !x.run).sort((a, b) => b.t - a.t) },   /* run 0 = taken before any Run slot existed: shown for whatever run is active */
    rewind(id) { const e = tmList().find(x => x.id === id); if (!e || !json(TM_PRE + id)?.data) return false; mirror(true); tmSnap({ old: true, step: e.step, title: 'สายเดิม · ก่อนย้อนไป "' + (e.title || e.step) + '"' });
      try { sessionStorage.setItem(TM_PENDING, id) } catch (er) { return false } try { top.location.reload() } catch (er) { location.reload() } return true },
    remove(id) { ls.del(TM_PRE + id); tmPut(tmList().filter(x => x.id !== id)) },
    ui() {
      document.getElementById('runSlotsTm')?.remove();
      const d = document.createElement('div'); d.id = 'runSlotsTm'; d.style.cssText = 'position:fixed;inset:0;z-index:2100;display:flex;align-items:center;justify-content:center;background:#000a;font:15px/1.5 AgThai,system-ui,Tahoma,sans-serif';
      const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
      const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'เมื่อกี้' : m < 60 ? m + ' นาทีก่อน' : m < 1440 ? Math.round(m / 60) + ' ชม.ก่อน' : Math.round(m / 1440) + ' วันก่อน' };
      const css = 'display:block;width:100%;text-align:left;margin:4px 0;padding:8px 12px;border-radius:9px;border:1px solid #b9c48a77;background:#1d2f29;color:#f5e6c4;font:inherit;cursor:pointer';
      const rows = api.tm.list().map(e => `<button style="${css}${e.old ? ';border-style:dashed' : ''}" data-id="${e.id}"><b>${e.old ? '↩ ' : '⏪ '}${esc(e.old ? e.title : 'ก่อน: ' + (e.title || e.step))}</b><br><small data-hint style="color:#cdbb92">${esc(e.text)} · ${ago(e.t)}</small></button>`).join('');
      d.innerHTML = `<div style="width:min(540px,calc(100vw - 24px));max-height:calc(100dvh - 40px);overflow:auto;padding:18px;border-radius:14px;background:#14231ff7;border:1px solid #b9c48a77;color:#f5e6c4"><h2 style="margin:0 0 4px">⏪ ย้อนโปรเกรส (dev)</h2><p style="margin:0 0 8px;color:#cdbb92;font-size:13px">เช็กพอยต์อัตโนมัติทุกครั้งที่เควสขยับไปขั้นใหม่ (เก็บ ${TM_MAX} ล่าสุดต่อ Run) · ย้อนแล้วสายที่เล่นอยู่ถูกเก็บเป็น "↩ สายเดิม" ย้อนกลับมาได้ · เริ่มที่บ้านหลังโหลด</p>${rows || '<p>ยังไม่มีเช็กพอยต์ — เล่นต่อจนเควสขยับขั้นแล้วจะมาเอง</p>'}<button style="${css};text-align:center" data-x="1">ปิด</button></div>`;
      document.body.append(d);
      d.onclick = e => { const b = e.target.closest('button'); if (e.target === d || b?.dataset.x) { d.remove(); return } if (!b?.dataset.id) return;
        if (!b.dataset.sure) { b.dataset.sure = 1; b.querySelector('[data-hint]').textContent = 'กดอีกครั้งเพื่อยืนยัน · เกมจะโหลดใหม่ที่จุดนี้'; return } d.remove(); api.tm.rewind(b.dataset.id) };
      d.addEventListener('keydown', e => { if (e.key === 'Escape') d.remove() }); d.querySelector('button')?.focus();
    }
  };
  root.RunSlots = api;

  boot();
  if (!(new URLSearchParams(location.search).has('editor')) && root.top === root) {
    const tick = () => { try { mirror(false) } catch (e) { } };
    setInterval(tick, 6000);
    for (const ev of ['pagehide', 'beforeunload']) addEventListener(ev, () => { try { mirror(true) } catch (e) { } });
    document.addEventListener('visibilitychange', () => { if (document.hidden) tick() });
  }
})(globalThis);
