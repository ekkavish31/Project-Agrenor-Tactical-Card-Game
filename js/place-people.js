/* v94.02 · Villagers inside the 2.5D sub-maps (village-place.html: market, forge, home and editor-made places).
   Same roster and daily schedule as the village and the place interiors (js/village-life.js): whoever's schedule says "market" between
   9 and 15 stands in the market sub-map, the smith at the forge, the hero's mother at home. Travellers only on the days they are in Fernvale.
   Click a villager → a speech bubble from the village memory (js/village-mind.js). Drawing: js/villager-draw.js (code-drawn people).
   Hooks used by village-place.html: PlacePeople.objects(project, g, t, blocked) → depth-sorted draw objects · PlacePeople.click(worldPoint, project). */
(function (root) {
  'use strict';
  const Q = new URLSearchParams(location.search), L = () => root.VillageLife, CLK = () => root.VillageClock;
  const PLACE = Q.get('kind') || Q.get('place') || '';
  let people = [], lastSync = 0, bubble = null;
  const hash = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h };
  /* is p in this place now? */
  function here(p, day, hour, S) {
    const Lf = L(); if (!Lf || Lf.inParty(S, p.id)) return false; if (root.Mind?.away?.(p.id)) return false;
    if (!Lf.present(p, day, hour)) return false;
    let at = null; for (const [a, b, place] of p.sched || []) if (hour >= a && hour < b) { at = place; break }
    if (at === 'home' || at == null) at = p.home || null;
    if (PLACE === 'home') return at === 'home' || at === 'custom-mvqgnp43';
    return at === PLACE;
  }
  function sync(blocked) {
    const Lf = L(), C = CLK(); if (!Lf || !C) return; const n = C.read(), S = Lf.save();
    const want = Object.values(Lf.P).filter(p => here(p, n.day, n.hour, S)).slice(0, 8);
    people = want.map((p, i) => {
      const old = people.find(x => x.p.id === p.id); if (old) return old;
      // a stable free spot near the middle of the floor for each person
      let u = 0, v = 0; for (let k = 0; k < 40; k++) { const h = hash(p.id + k), a = (h % 360) / 57.3, r = 1.5 + (h % 7) * .6; u = Math.round(Math.cos(a) * r * 2) / 2; v = Math.round(Math.sin(a) * r * 2) / 2; if (!blocked?.(u, v)) break }
      return { p, u, v, face: ['SE', 'SW', 'NE', 'NW'][hash(p.id) % 4], phase: i * 1.7, goal: null, wait: 1 + (hash(p.id) % 5) };
    });
  }
  /* v94.03 · they move: stroll to a free spot or to a work station (stations from village-place.html: window.PLACE_STATIONS), pause, repeat */
  let lastT = 0;
  function walk(a, dt, blocked, hero) {
    if (bubble?.a === a && performance.now() < bubble.until) { if (hero) a.face = faceTo(hero.u - a.u, hero.v - a.v); return false }
    if (!a.goal) { a.wait -= dt; if (a.wait > 0) return false; const st = root.PLACE_STATIONS?.() || [], useSt = st.length && Math.random() < .45, s = useSt ? st[Math.floor(Math.random() * st.length)] : null;
      for (let k = 0; k < 12; k++) { const q = s ? { u: s.u + (Math.random() - .5) * 2, v: s.v + s.d + .8 + Math.random() } : { u: a.u + (Math.random() - .5) * 5, v: a.v + (Math.random() - .5) * 5 }; if (!blocked?.(q.u, q.v)) { a.goal = q; break } } a.wait = 3 + Math.random() * 6; if (!a.goal) return false }
    const du = a.goal.u - a.u, dv = a.goal.v - a.v, d = Math.hypot(du, dv), step = dt * 1.6;
    if (d <= step) { a.u = a.goal.u; a.v = a.goal.v; a.goal = null; return false }
    const nu = a.u + du / d * step, nv = a.v + dv / d * step; if (blocked?.(nu, nv)) { a.goal = null; return false }
    a.u = nu; a.v = nv; a.face = faceTo(du, dv); return true;
  }
  const faceTo = (du, dv) => { const dx = du - dv, dy = du + dv; return dy >= 0 ? (dx >= 0 ? 'SE' : 'SW') : (dx >= 0 ? 'NE' : 'NW') };
  function objects(project, g, t, blocked, hero) {
    if (!root.VillagerDraw || !L()) return [];
    const now = performance.now(); if (now > lastSync) { lastSync = now + 3000; sync(blocked) }
    const out = [], dt = Math.min(.1, (t - lastT) / 1000 || 0); lastT = t;
    for (const a of people) {
      const moving = walk(a, dt, blocked, hero), pt = project(a.u, a.v);
      out.push({ y: pt.y, draw: () => {
        g.fillStyle = 'rgba(20,30,20,.35)'; g.beginPath(); g.ellipse(pt.x, pt.y, 14, 6, 0, 0, 7); g.fill();
        root.VillagerDraw(g, a.p.look || {}, pt.x, pt.y, t, { walking: moving, face: a.face, phase: a.phase, scale: 1.05 });
        if (questNpc(a.p.id)) mark(g, pt, t);
        if (bubble?.a === a && now < bubble.until) say(g, pt, bubble.text);
      } });
    }
    return out;
  }
  /* v95.01 · gold ◆ over the villager the current intro quest wants you to talk to (js/story-quests.js) */
  let qT = null, qAt = 0;
  function questNpc(id) { const n = performance.now(); if (n > qAt) { qAt = n + 500; try { qT = parent !== window ? parent.Story?.questTargets?.() : null } catch (e) { qT = null } } return !!qT?.npc?.includes(id) }
  function mark(g, pt, t) { const y = pt.y - 128 - Math.sin(t * .006) * 5; g.save(); g.shadowColor = 'rgba(255,200,60,.9)'; g.shadowBlur = 14; g.beginPath(); g.moveTo(pt.x, y - 18); g.lineTo(pt.x + 11, y); g.lineTo(pt.x, y + 18); g.lineTo(pt.x - 11, y); g.closePath(); g.fillStyle = '#ffd34d'; g.fill(); g.shadowBlur = 0; g.lineWidth = 2; g.strokeStyle = '#5a3a0a'; g.stroke(); g.restore() }
  function say(g, pt, txt) {
    g.save(); g.font = '13px TownThai,VillageThai,system-ui'; const max = 230, words = [...txt], lines = []; let cur = '';
    for (const ch of words) { if (g.measureText(cur + ch).width > max) { lines.push(cur); cur = ch } else cur += ch } if (cur) lines.push(cur);
    const w = Math.min(max, Math.max(...lines.map(l => g.measureText(l).width))) + 18, h = lines.length * 17 + 12, x = pt.x - w / 2, y = pt.y - 120 - h;
    g.fillStyle = 'rgba(255,248,230,.96)'; g.strokeStyle = '#8a6a3a'; g.lineWidth = 1.5; g.beginPath(); g.roundRect(x, y, w, h, 9); g.fill(); g.stroke();
    g.fillStyle = '#3a2a14'; g.textAlign = 'left'; lines.forEach((l, i) => g.fillText(l, x + 9, y + 18 + i * 17)); g.restore();
  }
  /* world point → talk to the villager under it. Returns true when a villager took the click. */
  function click(wp, project) {
    for (const a of people) {
      const pt = project(a.u, a.v); if (Math.abs(wp.x - pt.x) > 22 || wp.y > pt.y + 8 || wp.y < pt.y - 100) continue;
      try{if(parent!==window)parent.Story?.talked?.(a.p.id)}catch(e){};
      const Lf = L(), C = CLK(), S = Lf.save(), per = C.period(C.read().hour);
      let text = ''; try { const r = root.Mind?.talk(a.p.id, { period: per, place: PLACE, save: S }); Lf.writeSave(S); text = r?.text || '' } catch (e) { }
      if (!text) { const ls = a.p.lines?.[per] || a.p.lines?.day || ['…']; text = ls[Math.floor(Math.random() * ls.length)] }
      const hero = root.WorldState?.heroName() || '';
      bubble = { a, text: a.p.name + ': ' + String(text).replace(/\{name\}/g, hero), until: performance.now() + 5200 };
      return true;
    }
    return false;
  }
  root.PlacePeople = { objects, click, list: () => people.map(a => a.p.id) };
})(globalThis);
