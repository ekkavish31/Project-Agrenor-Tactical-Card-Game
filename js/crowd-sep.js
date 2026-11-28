/* v98.1187 · CrowdSep — SOFT COLLISION between characters (docs/TODO.md §44).
   Villagers, the goats, the hero and the follower used to walk straight through each other (movement only asked "is this cell blocked?", never "is somebody
   standing here?") — two people on the same spot drew on top of each other and the scene looked flat. Every character now has a body (a circle on the ground,
   radius in village cells) and the walking ones are pushed apart whenever two bodies overlap.

   run(dt, {movers, pins, blocked})
     movers  [{id, u, v, r?, kind?, w?, group?, set(u,v)}]  characters that may be pushed (villagers, goats, the hero with w≈.35) · w = how much of an overlap it gives way (default 1) · same `group` = never push each other (the party)
     pins    [{id, u, v, r?, kind?}]            characters that never move for this (the hero, the follower, somebody who is talking) — everybody else steps around them
     blocked (u,v) → true when the cell is a wall / building / tree: a push never moves anybody into one
   free(u, v, r, ignoreId) → true when no body from the last run() is within r+their radius of the point (to pick a place to stand)
   R   the body radius table (cells · 1 cell ≈ 31 px) — change a number here and every map follows · CrowdSep.set({adult:.5, …})
   stats() → {pairsNow, frames} · debugDraw(g, project) draws the circles (turn on:  CrowdSep.debug(true)  in the console, or localStorage projectA.crowdDebug = 1)
   Off switch (for testing): localStorage projectA.crowd = 0 */
(function (root) {
  'use strict';
  const R = { adult: .42, small: .3, hero: .4, follower: .38, goat: .36, mip: .28 };
  const MAX_SPEED = 2.6;            /* cells per second a push may move somebody (a gentle shuffle, never a jump) */
  const PASSES = 2;                 /* relaxation passes per frame */
  let on = true, dbg = false, last = [], stat = { pairsNow: 0, frames: 0 };
  try { on = localStorage.getItem('projectA.crowd') !== '0'; dbg = localStorage.getItem('projectA.crowdDebug') === '1' } catch (e) { }
  const rad = b => b.r || R[b.kind] || R.adult;
  /* how much of an overlap this body gives way: pinned = 0 · default 1 · the hero uses ~.35 (villagers step aside more than the player is pushed) */
  const wOf = b => b.pin ? 0 : (b.w == null ? 1 : b.w);
  /* a stable pseudo-random direction for two bodies that sit on exactly the same spot (so they split in a reproducible way) */
  function hashDir(a, b) { let h = 2166136261; for (const c of String(a) + '|' + String(b)) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; const an = (h % 6283) / 1000; return [Math.cos(an), Math.sin(an)] }
  function run(dt, ctx) {
    if (!on || !ctx) return; dt = Math.min(.1, Math.max(0, dt || 0)); if (!dt) return;
    const movers = ctx.movers || [], pins = ctx.pins || [], blocked = ctx.blocked || (() => false);
    last = [...movers, ...pins]; stat.frames++;
    const cap = MAX_SPEED * dt / PASSES; let pairs = 0;
    const all = [...pins, ...movers];
    for (let pass = 0; pass < PASSES; pass++) {
      for (let i = 0; i < all.length; i++) {
        const a = all[i], ra = rad(a);
        for (let j = i + 1; j < all.length; j++) {
          const b = all[j]; if (a.group && a.group === b.group) continue;   /* the party (hero · follower · Mip) never pushes itself */
          const wa = wOf(a), wb = wOf(b), tot = wa + wb; if (tot <= 0) continue;   /* two pinned bodies: nobody can move */
          let dx = a.u - b.u, dy = a.v - b.v, d = Math.hypot(dx, dy); const min = ra + rad(b);
          if (d >= min) continue;
          if (pass === 0) pairs++;
          if (d < 1e-4) { const h = hashDir(a.id, b.id); dx = h[0]; dy = h[1]; d = 1e-4 } else { dx /= d; dy /= d }
          const push = (min - d) * .9, mw = Math.max(wa, wb), pa = Math.min(cap * wa / mw, push * wa / tot), pb = Math.min(cap * wb / mw, push * wb / tot);   /* the cap scales with the share, so a lighter body (the hero) always moves less than a heavier one even while the overlap is big */
          if (pa) move(a, dx * pa, dy * pa, blocked); if (pb) move(b, -dx * pb, -dy * pb, blocked);
        }
      }
    }
    if (pairs || stat.pairsNow) stat.pairsNow = pairs
  }
  /* move a body by (du,dv) unless the cell would be blocked — then try each axis on its own, else stay.
     v98.1189 · a body that ALREADY stands on a "blocked" spot (the village's blocked() is also true on unpainted ground around a doorway / a spawn point) may still shuffle sideways there:
     the rule is "never move from walkable ground into a blocked cell", not "never move while blocked" (otherwise nobody standing on such a spot could be pushed at all). */
  function move(b, du, dv, blocked) {
    const was = blocked(b.u, b.v), ok = (u, v) => was || !blocked(u, v);
    const u = b.u + du, v = b.v + dv;
    if (ok(u, v)) { b.u = u; b.v = v; b.set && b.set(u, v); return }
    if (du && ok(b.u + du, b.v)) { b.u += du; b.set && b.set(b.u, b.v); return }
    if (dv && ok(b.u, b.v + dv)) { b.v += dv; b.set && b.set(b.u, b.v) }
  }
  function free(u, v, r, ignoreId) {
    r = r || R.adult; for (const b of last) { if (ignoreId != null && b.id === ignoreId) continue; if (Math.hypot(b.u - u, b.v - v) < r + rad(b)) return false } return true
  }
  function debugDraw(g, project) {
    if (!dbg) return; g.save(); g.lineWidth = 1.5;
    for (const b of last) { const p = project(b.u, b.v), p2 = project(b.u + rad(b), b.v), rx = Math.hypot(p2.x - p.x, p2.y - p.y) * 1.2; g.strokeStyle = b.pin || b.kind === 'hero' ? '#6cf' : '#fd6'; g.beginPath(); g.ellipse(p.x, p.y, rx, rx * .5, 0, 0, 7); g.stroke() }
    g.restore()
  }
  root.CrowdSep = {
    run, free, debugDraw, R,
    set(o) { Object.assign(R, o || {}) },
    stats: () => ({ ...stat, bodies: last.length }),
    enable(v) { on = !!v; try { localStorage.setItem('projectA.crowd', on ? '1' : '0') } catch (e) { } },
    isOn: () => on,
    debug(v) { dbg = !!v; try { localStorage.setItem('projectA.crowdDebug', dbg ? '1' : '0') } catch (e) { } }
  };
})(globalThis);
