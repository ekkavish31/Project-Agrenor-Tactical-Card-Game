/* v98.19 · Interactables — ONE registry of everything the hero can walk up to and use.
   A page registers a provider (a function returning the things currently in the world); every consumer reads the same list:
     • the big action button / E key / gamepad A   → Interactables.nearest(hero)        (js/touch-controls.js)
     • walk-into-it ("bump")                       → item.bump = true  (doors, villagers)
     • hold the button → radial choices            → item.options = [{label, icon, run}]
     • hover tooltip on the canvas                 → Interactables.at(screenPoint)
     • "what the current quest needs" highlight    → item.quest = true  (the A button shows ★)
   Item: { id, kind, u, v, r (reach, in world cells), label, icon, quest?, bump?, options?, run() , x?, y? (screen feet, for the tooltip) }
   `dist` is how far the hero stands from it; `Interactables.nearest()` already sorts quest items first, then by distance. */
(function (root) {
  'use strict';
  const providers = [];
  let tip = null, tipFor = null;
  function add(fn) { providers.push(fn); return () => { const i = providers.indexOf(fn); if (i >= 0) providers.splice(i, 1) } }
  function all() { const out = []; for (const p of providers) { try { for (const it of p() || []) out.push(it) } catch (e) { } } return out }
  /* hero = {u, v} in world cells */
  function near(hero, filter) {
    const out = [];
    for (const it of all()) {
      if (filter && !filter(it)) continue;
      const d = Math.hypot(it.u - hero.u, it.v - hero.v);
      if (d <= (it.r ?? 2.4)) out.push({ ...it, dist: d });
    }
    out.sort((a, b) => (!!b.quest - !!a.quest) || (a.dist - (a.pri || 0)) - (b.dist - (b.pri || 0)));
    return out;
  }
  const nearest = (hero, filter) => near(hero, filter)[0] || null;

  /* ---- hover tooltip: pages that know screen points give items x,y (feet) and call Interactables.hover(clientX, clientY, toWorldScreen) ---- */
  function at(px, py, rx = 34, ry = 60) {
    let best = null, bd = 1e9;
    for (const it of all()) {
      if (it.x == null) continue;
      const dx = Math.abs(px - it.x), dy = py - it.y;
      if (dx < rx && dy > -ry && dy < 18) { const d = dx + Math.abs(dy + ry / 2); if (d < bd) { bd = d; best = it } }
    }
    return best;
  }
  function showTip(it, cx, cy) {
    if (!it) { if (tip) tip.hidden = true; tipFor = null; return }
    if (!tip) {
      tip = document.createElement('div'); tip.id = 'ixTip';
      tip.style.cssText = 'position:fixed;z-index:24;pointer-events:none;padding:4px 10px;border-radius:999px;background:#16251eee;border:1px solid #d8b46a99;color:#fff3d2;font:700 13px VillageThai,system-ui,sans-serif;box-shadow:0 3px 10px #0008;white-space:nowrap';
      document.body.append(tip);
    }
    if (tipFor !== it.id) { tipFor = it.id; tip.textContent = (it.quest ? '★ ' : '') + (it.label || it.id) }
    tip.hidden = false; tip.style.left = Math.min(innerWidth - 8, cx + 14) + 'px'; tip.style.top = Math.max(4, cy - 34) + 'px';
  }
  root.Interactables = { add, all, near, nearest, at, showTip };
})(globalThis);
