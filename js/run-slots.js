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
  root.RunSlots = api;

  boot();
  if (!(new URLSearchParams(location.search).has('editor')) && root.top === root) {
    const tick = () => { try { mirror(false) } catch (e) { } };
    setInterval(tick, 6000);
    for (const ev of ['pagehide', 'beforeunload']) addEventListener(ev, () => { try { mirror(true) } catch (e) { } });
    document.addEventListener('visibilitychange', () => { if (document.hidden) tick() });
  }
})(globalThis);
