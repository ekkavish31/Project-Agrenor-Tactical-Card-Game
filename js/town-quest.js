/* v95.01 · Intro quests you walk through in the village (village-town.html).
   • Gold ◆ marker over the place / villager / village exit the current quest needs, and an arrow at the screen edge when it is off screen.
     A villager inside a building → the marker sits on that building (their place comes from the daily schedule in js/village-life.js).
   • Quest objects in the street that you walk to: goats that run away from you (catch them when they stop to rest), planks,
     the pumpkin plot, the broken market stall, the contest stand. Click one → the hero walks there; touching it uses it.
   • Reads the quest from the game page (parent.Story.questTargets()) and reports back (parent.Story.questEvent()).
   Uses the village page's own globals (hero, path, destination, findPath, blocked, project, locations, door, exitDoors …).
   Nothing here runs in the battle view or the editor. */
(function (root) {
  'use strict';
  const Q = new URLSearchParams(location.search);
  if (Q.has('battle') || Q.get('edit') === '1') return;
  const story = () => { try { return root.parent !== root ? root.parent.Story : null } catch (e) { return null } };
  const life = () => { try { return root.VillageLife || root.parent?.VillageLife } catch (e) { return null } };
  const objs = new Map();               // spot key → [{key,kind,u,v,i,...}]
  let T = null, lastPoll = 0, lastT = 0, chaseAt = 0, pending = null, floats = [], down = null;
  const ICON = { goat: '🐐', plank: '🪵', plot: '🌱', stall: '🛠️', pumpkin: '🎃' };

  /* ---------- helpers ---------- */
  const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0 };
  function rng(seed) { let a = seed || 1; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
  const loc = id => locations.find(o => o.id === id || o.action === id);
  const free = (u, v) => { try { return !blocked(u, v) } catch (e) { return false } };
  const dist = (a, b) => Math.hypot(a.u - b.u, a.v - b.v);
  const K = () => 1 / Math.max(.35, scale * zoom);
  function status(t) { try { $('status').textContent = t } catch (e) { } }
  function float(text, u, v) { floats.push({ text, u, v, t0: performance.now() }) }

  /* where a villager is now (hour from the one game clock) */
  function npcPlace(id) {
    const L = life(), p = L?.P?.[id]; if (!p) return null;
    let h = 12; try { h = root.WorldState ? root.WorldState.now().hour : (gameState?.minutes || 720) / 60 } catch (e) { }
    let at = null; for (const [a, b, pl] of p.sched || []) if (h >= a && h < b) { at = pl; break }
    if (!at || at === 'home') at = L.homeOf ? L.homeOf(p) : p.home;
    return at;
  }
  function placePoint(o) {
    const lp = root.TownUX?.labelPoint?.(o); const x = lp ? lp.x : o.x * MX, y = (lp ? lp.y : o.y * MY);
    return { x, y: y - 70 };
  }
  function exitTarget() {
    const ds = typeof exitDoors === 'function' ? exitDoors() : []; let best = -1, bd = 1e9;
    ds.forEach((d, i) => { const k = dist(hero, d); if (k < bd) { bd = k; best = i } });
    if (best < 0) return null; const d = ds[best], map = { north: 0, northeast: 1, east: 2, southeast: 3, southwest: 4, west: 5 };
    const a = (gameState?.exits || []).find(e => map[e.exit] === best);
    return { door: d, id: a ? 'exit:' + a.id : null, name: a?.name || d.name };
  }

  /* ---------- quest objects ---------- */
  function spawn(sp) {
    let list = objs.get(sp.key) || [];
    if (list.length > sp.n) list = list.slice(0, sp.n);
    const r = rng(hash(sp.key + ':' + (sp.seed || 0))), near = [].concat(sp.near || 'square'), spread = sp.spread || 5;
    let i = 0;
    while (list.length < sp.n && i < 40) {
      const o = loc(near[(list.length + i) % near.length]) || locations[0]; i++;
      if (!o) break; const base = door(o); let spot = null;
      for (let k = 0; k < 60 && !spot; k++) {
        const u = base.u + (r() - .5) * 2 * spread, v = base.v + (r() - .5) * 2 * spread;
        if (free(u, v) && list.every(x => dist(x, { u, v }) > 2.2) && dist(hero, { u, v }) > (sp.flee ? 4 : 1.5)) spot = { u, v };
      }
      if (!spot) { const n = typeof nearest === 'function' ? nearest(base) : base; spot = n ? { u: n.u, v: n.v } : null }
      if (spot) list.push({ key: sp.key, kind: sp.kind, label: sp.label || '', flee: !!sp.flee, u: spot.u, v: spot.v, i: list.length, mode: 'idle', t: 0, phase: r() * 6, cool: 0 });
    }
    objs.set(sp.key, list); return list;
  }
  function poll(now, force) {
    if (!force && now - lastPoll < 400) return; lastPoll = now;
    try { T = story()?.questTargets?.() || null } catch (e) { T = null }
    const keys = new Set((T?.spots || []).map(s => s.key));
    for (const k of [...objs.keys()]) if (!keys.has(k)) objs.delete(k);
    for (const sp of T?.spots || []) spawn(sp);
    if (pending && !objs.get(pending.key)?.includes(pending)) pending = null;
  }
  function fleeStep(o, dt) {
    const d = dist(hero, o);
    if (o.mode === 'rest') { o.t -= dt; if (o.t <= 0) o.mode = 'idle'; return }
    if (o.mode === 'idle') { if (d < 3.4) { o.mode = 'run'; o.t = 1.3 + Math.random() * 1.2; o.turn = 0 } else return }
    o.t -= dt; o.turn -= dt;
    if (o.turn <= 0 || !o.dir) {
      o.turn = .3; let best = null, bs = -1e9;
      for (let k = 0; k < 12; k++) {
        const a = k / 12 * Math.PI * 2 + Math.random() * .3, du = Math.cos(a), dv = Math.sin(a), u = o.u + du * 1.2, v = o.v + dv * 1.2;
        if (!free(u, v)) continue; const sc = Math.hypot(u - hero.u, v - hero.v) + Math.random() * .6;
        if (sc > bs) { bs = sc; best = { du, dv } }
      }
      o.dir = best;
    }
    if (o.dir) { const sp = 4.6, u = o.u + o.dir.du * sp * dt, v = o.v + o.dir.dv * sp * dt; if (free(u, v)) { o.u = u; o.v = v } else o.dir = null }
    if (o.t <= 0) { o.mode = 'rest'; o.t = 2 + Math.random() * 1.2; o.dir = null }
  }
  function use(o) {
    if (o.busy || o.cool > 0) return; o.busy = true;
    let r = null; try { r = story()?.questEvent?.({ key: o.key, kind: o.kind, i: o.i }) } catch (e) { r = null }
    Promise.resolve(r).then(res => {
      o.busy = false; if (res?.msg) { status(res.msg); float(res.msg, o.u, o.v) }
      if (res?.consume) { const l = objs.get(o.key); if (l) objs.set(o.key, l.filter(x => x !== o)); if (pending === o) pending = null }
      else o.cool = 3;
      lastPoll = 0;
    }).catch(() => { o.busy = false; o.cool = 3 });
  }
  function update(dt, now) {
    poll(now);
    for (const list of objs.values()) for (const o of list) {
      o.cool = Math.max(0, o.cool - dt);
      if (o.flee) fleeStep(o, dt);
      const reach = o.flee ? 1.05 : 1.35;
      if (dist(hero, o) < reach && (o.flee || pending === o || !path.length)) use(o);
    }
    // chasing a goat: follow it as it moves
    if (pending?.flee && now > chaseAt) { chaseAt = now + 450; const p = findPath(hero, { u: pending.u, v: pending.v }); if (p.length) path = p }
  }

  /* ---------- drawing ---------- */
  function marker(gx, x, y, t, label, k) {
    const b = Math.sin(t * .006) * 6 * k, s = 13 * k; y -= b;
    gx.save(); gx.shadowColor = 'rgba(255,200,60,.9)'; gx.shadowBlur = 16 * k;
    gx.beginPath(); gx.moveTo(x, y - s * 1.6); gx.lineTo(x + s, y); gx.lineTo(x, y + s * 1.6); gx.lineTo(x - s, y); gx.closePath();
    gx.fillStyle = '#ffd34d'; gx.fill(); gx.shadowBlur = 0; gx.lineWidth = 2.5 * k; gx.strokeStyle = '#5a3a0a'; gx.stroke();
    if (label) { gx.font = `700 ${13 * k}px VillageThai,system-ui`; gx.textAlign = 'center'; const w = gx.measureText(label).width + 16 * k;
      gx.fillStyle = 'rgba(36,30,14,.88)'; gx.beginPath(); gx.roundRect(x - w / 2, y - s * 1.6 - 28 * k, w, 22 * k, 7 * k); gx.fill();
      gx.fillStyle = '#ffe9a8'; gx.fillText(label, x, y - s * 1.6 - 12 * k) }
    gx.restore();
  }
  function targets() {
    const out = []; if (!T) return out;
    for (const id of T.place || []) { const o = loc(id); if (o) { const p = placePoint(o); out.push({ ...p, label: T.label || o.name, o }) } }
    for (const id of T.npc || []) {
      const n = root.TownNPC?.list?.()?.find(x => x.id === id), name = life()?.P?.[id]?.name || id;
      if (n && !n.inside && !n.hidden) { const p = project(n.u, n.v); out.push({ x: p.x, y: p.y - 125, label: name, npc: n }); continue }
      const pl = npcPlace(id), o = pl && loc(pl);
      if (o) { const p = placePoint(o); out.push({ ...p, label: name + ' · ใน' + o.name, o }) }
    }
    if (T.exit) { const e = exitTarget(); if (e) { const p = project(e.door.u, e.door.v); out.push({ x: p.x, y: p.y - 60, label: 'ทางออก ' + e.name, exit: e }) } }
    for (const list of objs.values()) if (list[0] && T.spots?.find(s => s.key === list[0].key)?.mark) for (const o of list) { const p = project(o.u, o.v); out.push({ x: p.x, y: p.y - 70, label: o.label, spot: o }) }
    return out;
  }
  function drawObj(gx, o, t, k) {
    const p = project(o.u, o.v), hop = o.flee ? (o.mode === 'run' ? Math.abs(Math.sin(t * .02 + o.phase)) * 8 : o.mode === 'idle' ? Math.abs(Math.sin(t * .004 + o.phase)) * 2 : 0) : Math.sin(t * .003 + o.phase) * 2;
    gx.save();
    gx.fillStyle = 'rgba(20,30,20,.35)'; gx.beginPath(); gx.ellipse(p.x, p.y, 16, 7, 0, 0, 7); gx.fill();
    if (o.kind === 'plot') { gx.fillStyle = '#6a4a2a'; gx.beginPath(); gx.ellipse(p.x, p.y, 30, 14, 0, 0, 7); gx.fill(); gx.strokeStyle = '#4a3218'; gx.lineWidth = 2; gx.stroke() }
    if (!o.flee || pending === o) { gx.strokeStyle = 'rgba(255,214,90,' + (.45 + Math.sin(t * .006) * .3) + ')'; gx.lineWidth = 2.5; gx.beginPath(); gx.ellipse(p.x, p.y, 24, 11, 0, 0, 7); gx.stroke() }
    gx.font = '34px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; gx.textAlign = 'center';
    gx.translate(p.x, p.y - 6 - hop); if (o.flee && o.dir && o.dir.du - o.dir.dv > 0) gx.scale(-1, 1);
    gx.fillText(ICON[o.kind] || '❔', 0, 0); gx.restore();
    if (o.flee && o.mode === 'rest') { gx.save(); gx.font = `700 ${12}px system-ui`; gx.fillStyle = '#e8f4ff'; gx.textAlign = 'center'; gx.fillText('หอบ…', p.x, p.y - 46); gx.restore() }
  }
  function edgeArrows(gx, list) {
    gx.save(); gx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    for (const m of list) {
      const sx = (m.x - WORLD_W / 2) * scale * zoom + W / 2 + pan.x, sy = (m.y - WORLD_H / 2) * scale * zoom + H / 2 + pan.y;
      if (sx > 30 && sx < W - 30 && sy > 70 && sy < H - 30) continue;
      const cx = W / 2, cy = H / 2, dx = sx - cx, dy = sy - cy, f = Math.min((W / 2 - 46) / Math.abs(dx || 1e-6), (H / 2 - 56) / Math.abs(dy || 1e-6)), x = cx + dx * f, y = cy + dy * f, a = Math.atan2(dy, dx);
      gx.save(); gx.translate(x, y); gx.rotate(a); gx.fillStyle = '#ffd34d'; gx.strokeStyle = '#5a3a0a'; gx.lineWidth = 2;
      gx.beginPath(); gx.moveTo(18, 0); gx.lineTo(-10, -12); gx.lineTo(-4, 0); gx.lineTo(-10, 12); gx.closePath(); gx.fill(); gx.stroke(); gx.restore();
      if (m.label) { gx.font = '700 12px VillageThai,system-ui'; gx.textAlign = 'center'; const tx = x - Math.cos(a) * 30, ty = y - Math.sin(a) * 24 + 4, w = gx.measureText(m.label).width + 12;
        gx.fillStyle = 'rgba(36,30,14,.85)'; gx.fillRect(tx - w / 2, ty - 13, w, 18); gx.fillStyle = '#ffe9a8'; gx.fillText(m.label, tx, ty) }
    }
    gx.restore();
  }
  function draw(gx, t) {
    if (editing || root.TownBattle?.active?.()) return;
    const dt = Math.min(.1, (t - lastT) / 1000 || 0); lastT = t; update(dt, performance.now());
    if (!T) return;
    const k = Math.min(2.2, K());
    for (const list of objs.values()) for (const o of list) drawObj(gx, o, t, k);
    const ms = targets(); for (const m of ms) if (!m.spot || !m.spot.flee) marker(gx, m.x, m.y, t, m.label, k);
    const now = performance.now(); floats = floats.filter(f => now - f.t0 < 1800);
    for (const f of floats) { const p = project(f.u, f.v), e = (now - f.t0) / 1800; gx.save(); gx.globalAlpha = 1 - e; gx.font = `700 ${14 * k}px VillageThai,system-ui`; gx.textAlign = 'center'; gx.lineWidth = 3 * k; gx.strokeStyle = '#2a1a0a'; gx.fillStyle = '#ffe28a'; gx.strokeText(f.text, p.x, p.y - 60 - e * 40); gx.fillText(f.text, p.x, p.y - 60 - e * 40); gx.restore() }
    const goats = [...objs.values()].flat().filter(o => o.flee);
    edgeArrows(gx, [...ms, ...goats.slice(0, 1).map(o => { const p = project(o.u, o.v); return { x: p.x, y: p.y, label: ICON[o.kind] + ' ' + goats.length } })]);
  }

  /* ---------- clicking a quest object walks to it ---------- */
  function hit(e) {
    let w; try { w = world(e) } catch (x) { return null }
    let best = null, bd = 1e9;
    for (const list of objs.values()) for (const o of list) { const p = project(o.u, o.v), dx = Math.abs(w.x - p.x), dy = w.y - p.y; if (dx < 30 && dy < 14 && dy > -56) { const d = dx + Math.abs(dy + 20); if (d < bd) { bd = d; best = o } } }
    return best;
  }
  root.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY } }, true);
  root.addEventListener('pointerup', e => {
    if (!down || editing || !T || e.target?.closest?.('button,dialog,input,select,textarea,a,label,[role=dialog]')) { down = null; return }
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6; down = null; if (moved) return;
    const o = hit(e); if (!o) return;
    e.stopImmediatePropagation(); try { drag = null } catch (x) { }
    pending = o; destination = null; path = findPath(hero, { u: o.u, v: o.v });
    status(path.length ? 'กำลังเดินไป' + (o.label || (o.kind === 'goat' ? 'จับแพะ' : 'เก็บของ')) : dist(hero, o) < 1.4 ? '' : 'เดินไปตรงนั้นไม่ได้');
    if (!path.length && dist(hero, o) < 1.4) use(o);
  }, true);

  /* ---------- guide button (tracker "📍 นำทาง"): walk to the nearest thing the quest needs ---------- */
  function guide() {
    poll(performance.now(), true); if (!T) return false;
    const spots = [...objs.values()].flat().sort((a, b) => dist(hero, a) - dist(hero, b));
    if (spots[0]) { pending = spots[0]; destination = null; path = findPath(hero, { u: spots[0].u, v: spots[0].v }); status('กำลังเดินไปหาเป้าหมาย'); return true }
    const ms = targets().filter(m => m.o || m.npc || m.exit);
    const m = ms[0]; if (!m) return false;
    if (m.npc) { destination = null; path = findPath(hero, { u: m.npc.u, v: m.npc.v }); status('กำลังเดินไปหา ' + m.label + ' · คลิกที่ตัวเพื่อคุย'); return true }
    if (m.exit) { if (m.exit.id) destination = { id: m.exit.id, name: m.exit.name }; path = findPath(hero, m.exit.door); status('กำลังเดินไปทางออก ' + m.exit.name); return true }
    if (m.o) { travel(m.o); return true }
    return false;
  }
  root.TownQuest = { draw, guide, targets: () => T, objects: () => [...objs.values()].flat() };
})(globalThis);
