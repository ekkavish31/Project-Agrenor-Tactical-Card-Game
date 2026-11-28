/* v98.1187 · CrowdSep — SOFT COLLISION between characters (docs/TODO.md §44).
   Villagers, the goats, the hero and the follower used to walk straight through each other (movement only asked "is this cell blocked?", never "is somebody
   standing here?") — two people on the same spot drew on top of each other and the scene looked flat. Every character now has a body (a circle on the ground,
   radius in village cells) and the walking ones are pushed apart whenever two bodies overlap.

   run(dt, {movers, pins, blocked})
     movers  [{id, u, v, r?, kind?, set(u,v)}]  characters that may be pushed (villagers, goats)
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
  /* a stable pseudo-random direction for two bodies that sit on exactly the same spot (so they split in a reproducible way) */
  function hashDir(a, b) { let h = 2166136261; for (const c of String(a) + '|' + String(b)) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; const an = (h % 6283) / 1000; return [Math.cos(an), Math.sin(an)] }
  function run(dt, ctx) {
    if (!on || !ctx) return; dt = Math.min(.1, Math.max(0, dt || 0)); if (!dt) return;
    const movers = ctx.movers || [], pins = ctx.pins || [], blocked = ctx.blocked || (() => false);
    last = [...movers, ...pins]; stat.frames++;
    const cap = MAX_SPEED * dt / PASSES; let pairs = 0;
    for (let pass = 0; pass < PASSES; pass++) {
      for (let i = 0; i < movers.length; i++) {
        const a = movers[i], ra = rad(a);
        /* against the pinned ones (the other body does not move: this one yields all of it) and against the other movers (each yields half) */
        for (let j = 0; j < pins.length + movers.length; j++) {
          const isPin = j < pins.length, b = isPin ? pins[j] : movers[j - pins.length];
          if (b === a || (!isPin && j - pins.length <= i)) continue;   /* each mover pair once */
          let dx = a.u - b.u, dy = a.v - b.v, d = Math.hypot(dx, dy); const min = ra + rad(b);
          if (d >= min) continue;
          if (pass === 0) pairs++;
          if (d < 1e-4) { const h = hashDir(a.id, b.id); dx = h[0]; dy = h[1]; d = 1e-4 } else { dx /= d; dy /= d }
          const push = Math.min(cap, (min - d) * (isPin ? .9 : .5)), mine = push, theirs = isPin ? 0 : push;
          move(a, dx * mine, dy * mine, blocked); if (!isPin) move(b, -dx * theirs, -dy * theirs, blocked);
        }
      }
    }
    if (pairs || stat.pairsNow) stat.pairsNow = pairs
  }
  /* move a body by (du,dv) unless the cell would be blocked — then try each axis on its own, else stay */
  function move(b, du, dv, blocked) {
    const u = b.u + du, v = b.v + dv;
    if (!blocked(u, v)) { b.u = u; b.v = v; b.set && b.set(u, v); return }
    if (du && !blocked(b.u + du, b.v)) { b.u += du; b.set && b.set(b.u, b.v); return }
    if (dv && !blocked(b.u, b.v + dv)) { b.v += dv; b.set && b.set(b.u, b.v) }
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
