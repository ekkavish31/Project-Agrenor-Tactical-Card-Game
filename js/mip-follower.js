/* v98.477 · MIP walks behind the hero in the village (main story phase C · docs/lore/MAIN-STORY-CANON.md A8/D): it does not take a party slot and the player cannot steer it.
   Same breadcrumb idea as js/hero-follower.js (it walks the path the lead walked, a few body lengths back, and waits when the lead stops), drawn with the
   existing run-cycle picture assets/ui/mip-sheet.webp (12 cells · faces LEFT) — no new picture; it darkens with MainStory.mip(g).dark (code tint, no extra file).
   API: MipFollower.objects(hero, dt, t, o) → [drawable] · o = { project, size, show, g? }   MipFollower.visible(game) → should it be drawn at all. */
(function (root) {
  'use strict';
  const GAP = 2.6;                         // body lengths behind the lead (a little further than the sibling: it is small)
  let trail = [], pos = null, moving = 0, flipRight = false, lastX = null, lastT = 0, img = null, tmp = null;
  const sheet = () => { if (!img && typeof Image !== 'undefined') { img = new Image(); img.src = 'assets/ui/mip-sheet.webp?v=2' } return img && img.complete && img.naturalWidth ? img : null };
  const game = () => { try { return root.WorldState?.game?.() || root.s || root.parent?.s || null } catch (e) { return null } };
  /* drawn only while it is a stable friend: joined, and not (yet) the mad / purified / sealed forms of the later story */
  function visible(g) { g = g || game(); const M = root.MainStory; if (!g || !M) return false; if (!M.flag(g, 'mipJoined')) return false; const m = M.mip?.(g); return !m || m.state === 'stable' || m.state === 'berserk' }
  function target(gap) {
    let need = gap;
    for (let i = trail.length - 1; i > 0; i--) { const a = trail[i], b = trail[i - 1], d = Math.hypot(a.u - b.u, a.v - b.v); if (d >= need) { const k = need / d; return { u: a.u + (b.u - a.u) * k, v: a.v + (b.v - a.v) * k } } need -= d }
    return trail[0];
  }
  function objects(hero, dt, t, o) {
    if (dt == null) { dt = Math.min(.08, Math.max(0, (t - (lastT || t)) / 1000)); lastT = t }
    if (!o.show) { trail = []; pos = null; return [] }
    const a0 = o.project(0, 0), a1 = o.project(1, 0), dpc = Math.max(1e-6, Math.hypot(a1.x - a0.x, a1.y - a0.y)), gap = o.size ? o.size * GAP * .5 / dpc : GAP, jump = 110 / dpc, minStep = 2 / dpc;
    const last = trail[trail.length - 1];
    if (!last || Math.hypot(hero.u - last.u, hero.v - last.v) > jump) { trail = [{ u: hero.u, v: hero.v }]; pos = null }
    else if (Math.hypot(hero.u - last.u, hero.v - last.v) >= minStep) trail.push({ u: hero.u, v: hero.v });
    let len = 0; for (let i = trail.length - 1; i > 0; i--) { len += Math.hypot(trail[i].u - trail[i - 1].u, trail[i].v - trail[i - 1].v); if (len > gap + 2) { trail = trail.slice(i - 1); break } }
    if (!pos) { const tg = trail.length > 1 ? target(gap) : { u: hero.u - 36 / dpc, v: hero.v + 14 / dpc }; pos = { u: tg.u, v: tg.v } }
    let plen = 0; for (let i = trail.length - 1; i > 0; i--) plen += Math.hypot(trail[i].u - trail[i - 1].u, trail[i].v - trail[i - 1].v);
    const tg = trail.length > 1 && plen >= gap ? target(gap) : pos, du = tg.u - pos.u, dv = tg.v - pos.v, k = Math.min(1, dt * 12);
    const nu = pos.u + du * k, nv = pos.v + dv * k, step = Math.hypot(nu - pos.u, nv - pos.v); pos.u = nu; pos.v = nv;
    moving = step / Math.max(dt, 1e-3) > .35 ? 1 : (moving > 0 ? moving - dt * 6 : 0);
    const p = o.project(pos.u, pos.v); if (lastX != null && Math.abs(p.x - lastX) > .4) flipRight = p.x > lastX; lastX = p.x;
    const px = Math.max(24, (o.size || 90) * .5), g0 = o.g;
    return [{ x: p.x, y: p.y, uv: pos.u + pos.v, mobile: true, follower: true, z: o.layer ? (o.layer(pos.u, pos.v) || 0) : 0, draw: () => draw(g0, p, t, px, moving > 0) }];
  }
  function draw(g, p, t, px, walking) {
    if (!g) return; const im = sheet(), M = root.MainStory, dark = Math.max(0, Math.min(1, (M?.mip?.(game())?.dark || 0) / 100));
    g.save(); g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(p.x, p.y, px * .32, px * .12, 0, 0, 7); g.fill();
    if (im) {
      const cell = im.naturalWidth / 12, f = walking ? Math.floor(t / 70) % 12 : 3, bob = walking ? 0 : Math.abs(Math.sin(t * .004)) * 1.5;
      g.translate(p.x, p.y - bob); if (flipRight) g.scale(-1, 1);
      if (dark > .02 && typeof document !== 'undefined') {   /* tint ONLY the fox's own pixels: paint it on a scratch canvas first, then stamp that */
        const S = Math.max(8, Math.round(px)); tmp ||= document.createElement('canvas'); if (tmp.width !== S || tmp.height !== S) { tmp.width = S; tmp.height = S } const c = tmp.getContext('2d'); c.clearRect(0, 0, S, S); c.globalCompositeOperation = 'source-over';
        c.drawImage(im, f * cell, 0, cell, im.naturalHeight, 0, 0, S, S); c.globalCompositeOperation = 'source-atop'; c.fillStyle = `rgba(18,10,40,${(dark * .8).toFixed(3)})`; c.fillRect(0, 0, S, S); c.globalCompositeOperation = 'source-over';
        g.drawImage(tmp, -px / 2, -px * .92, px, px);
      } else g.drawImage(im, f * cell, 0, cell, im.naturalHeight, -px / 2, -px * .92, px, px);
    } else { g.fillStyle = '#d8b99a'; g.beginPath(); g.ellipse(p.x, p.y - px * .3, px * .3, px * .22, 0, 0, 7); g.fill() }
    g.restore();
  }
  root.MipFollower = { objects, visible, reset() { trail = []; pos = null; lastX = null } };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.MipFollower;
})(typeof globalThis !== 'undefined' ? globalThis : this);
