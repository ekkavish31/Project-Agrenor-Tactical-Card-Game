/* v98.225 · the hero you did NOT choose walks behind you everywhere in the village (male ↔ female). It follows the exact path the lead walked
   (a breadcrumb trail, GAP cells behind), faces the way it moves, and uses the other look's own walk frames (HeroVariant.defaultsTo on a copy of the sprite table).
   API: HeroFollower.objects(hero, dt, t, o) → [drawable] for the village's depth-sorted list.   o = {project, ellipse, face(du,dv,prevDir), size, show}  */
(function (root) {
  'use strict';
  const GAP = 3.0, MAXJUMP = 3.5;
  let trail = [], pos = null, dir = 'SE', motion = null, motionFor = '', moving = 0;
  const other = () => { try { return root.HeroVariant?.get?.() === 'female' ? 'male' : 'female' } catch (e) { return 'female' } };
  function build() {
    const id = other(); if (motion && motionFor === id) return motion;
    motion = root.HeroVariant?.motionFor?.(id) || null; motionFor = id;
    return motion;
  }
  function target(gap) {         // the point `gap` cells back along the trail (the last trail point is the lead itself)
    let need = gap;
    for (let i = trail.length - 1; i > 0; i--) {
      const a = trail[i], b = trail[i - 1], d = Math.hypot(a.u - b.u, a.v - b.v);
      if (d >= need) { const k = need / d; return { u: a.u + (b.u - a.u) * k, v: a.v + (b.v - a.v) * k } }
      need -= d;
    }
    return trail[0];
  }
  let lastT = 0;
  function objects(hero, dt, t, o) {
    if (dt == null) { dt = Math.min(.08, Math.max(0, (t - (lastT || t)) / 1000)); lastT = t }   /* pages without their own dt (interior) */
    if (!o.show) { trail = []; pos = null; return [] }
    const a0 = o.project(0, 0), a1 = o.project(1, 0), dpc = Math.max(1e-6, Math.hypot(a1.x - a0.x, a1.y - a0.y)), gap = o.size ? o.size * .5 / dpc : GAP * .5, jump = 110 / dpc, minStep = 2 / dpc;   // dpc = screen px per map unit   // one body length behind, whatever the page's map scale
    const last = trail[trail.length - 1];
    if (!last || Math.hypot(hero.u - last.u, hero.v - last.v) > jump) { trail = [{ u: hero.u, v: hero.v }]; pos = null }
    else if (Math.hypot(hero.u - last.u, hero.v - last.v) >= minStep) trail.push({ u: hero.u, v: hero.v });
    let len = 0; for (let i = trail.length - 1; i > 0; i--) { len += Math.hypot(trail[i].u - trail[i - 1].u, trail[i].v - trail[i - 1].v); if (len > gap + 2) { trail = trail.slice(i - 1); break } }
    if (!pos) { const tg = trail.length > 1 ? target(gap) : { u: hero.u - 22 / dpc, v: hero.v - 22 / dpc }; pos = { u: tg.u, v: tg.v } }
    const tg = trail.length > 1 ? target(gap) : pos, du = tg.u - pos.u, dv = tg.v - pos.v, dist = Math.hypot(du, dv), k = Math.min(1, dt * 14);
    const nu = pos.u + du * k, nv = pos.v + dv * k, step = Math.hypot(nu - pos.u, nv - pos.v);
    if (step > 1e-4) dir = o.face(nu - pos.u, nv - pos.v, dir);
    pos.u = nu; pos.v = nv;
    moving = step / Math.max(dt, 1e-3) > .35 ? 1 : (moving > 0 ? moving - dt * 6 : 0);   // short grace so it does not flicker between walk and idle
    const m = build(); if (!m || (!root.TownArt && !o.drawFn)) return [];
    const p = o.project(pos.u, pos.v);
    return [{ x: p.x, y: p.y, uv: pos.u + pos.v, mobile: true, z: 0, draw: () => { if (o.drawFn) return o.drawFn(p, dir, moving > 0, m); o.ellipse(p.x, p.y, 16.9 * o.scale, 7.8 * o.scale, '#182b2877'); root.TownArt.hero(o.g, p, dir, t, moving > 0, o.size, dir, m) } }];
  }
  root.HeroFollower = { objects, reset() { trail = []; pos = null } };
})(globalThis);
