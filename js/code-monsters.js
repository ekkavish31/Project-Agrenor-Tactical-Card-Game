/* v98.331 · code-drawn battle units for the prologue tutorials (no pictures yet): the goat of Pip, the harvest pumpkin, the pumpkin boss and the crop pest.
   CodeMonsters.draw(g, kind, o) — g = the battle's 2D context, in world units; o = { x, y (feet), h (figure height), dir ('SE'|'SW'|'NE'|'NW'), t (ms), hp (0 = down), hit (ms since hit or null),
   walking, pose ('idle'|'attack'|'hit'|'down'), seed }.  CodeMonsters.has(kind).  Replace a unit with real art later: just add its assets/enemies/<img>.webp and remove `code: true` from the MON entry.
   Everything is drawn from the feet up, facing right when dir is SE/NE (the caller flips for SW/NW like a picture). */
(function (root) {
  'use strict';
  const KINDS = { goat: 1, pumpkin: 1, pumpkinBoss: 1, pest: 1 };
  const E = (g, x, y, rx, ry, fill, rot = 0) => { g.beginPath(); g.ellipse(x, y, Math.max(.01, rx), Math.max(.01, ry), rot, 0, Math.PI * 2); g.fillStyle = fill; g.fill() };
  const line = (g, x0, y0, x1, y1, col, w) => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.stroke() };
  const shade = (c, k) => { const n = parseInt(c.slice(1), 16), r = Math.min(255, Math.round((n >> 16) * k)), gg = Math.min(255, Math.round(((n >> 8) & 255) * k)), b = Math.min(255, Math.round((n & 255) * k)); return `rgb(${r},${gg},${b})` };
  /* a pumpkin body with ribs, drawn at (0,0 = feet) with width w, height h; squash = 0..1 (hit), glow = 0..1 */
  function pumpkinBody(g, w, h, squash, base, face, t) {
    const sy = 1 - .22 * squash, sx = 1 + .12 * squash, cy = -h * .5 * sy;
    g.save(); g.translate(0, cy); g.scale(sx, sy);
    for (const [dx, k] of [[-.32, .86], [.32, .86], [-.16, .95], [.16, .95], [0, 1]]) E(g, dx * w, 0, w * (.32 - Math.abs(dx) * .1), h * .46, shade(base, k));
    g.strokeStyle = shade(base, .62); g.lineWidth = Math.max(1, w * .02);
    for (const dx of [-.2, 0, .2]) { g.beginPath(); g.moveTo(dx * w, -h * .42); g.quadraticCurveTo(dx * w * 1.5, 0, dx * w, h * .42); g.stroke() }
    E(g, -w * .12, -h * .2, w * .12, h * .12, 'rgba(255,255,255,.22)', -.5);   // shine
    g.restore();
    // stem + leaf
    const ty = cy - h * .5 * sy;
    g.fillStyle = '#5b7f2e'; g.fillRect(-w * .05, ty - h * .1, w * .1, h * .13);
    E(g, w * .14, ty - h * .02, w * .16, h * .05, '#6aa13a', -.5);
    if (face) { // carved face for the boss
      const ey = cy - h * .06, glow = .55 + .25 * Math.sin(t * .006);
      g.fillStyle = `rgba(255,214,90,${glow})`;
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * w * .17, ey - h * .1); g.lineTo(s * w * .3, ey + h * .02); g.lineTo(s * w * .08, ey + h * .02); g.closePath(); g.fill() }
      g.beginPath(); g.moveTo(-w * .22, ey + h * .13); g.lineTo(-w * .12, ey + h * .08); g.lineTo(-w * .05, ey + h * .15); g.lineTo(w * .05, ey + h * .08); g.lineTo(w * .12, ey + h * .15); g.lineTo(w * .22, ey + h * .08); g.lineTo(w * .2, ey + h * .22); g.lineTo(-w * .2, ey + h * .22); g.closePath(); g.fill();
    }
  }
  function drawGoat(g, o) {
    const { h, t, walking, pose } = o, w = h * 1.15, bob = walking ? Math.abs(Math.sin(t * .012)) * h * .06 : Math.sin(t * .003 + (o.seed || 0)) * h * .01, lunge = pose === 'attack' ? Math.sin(Math.min(1, (o.hit ?? 0) / 260) * Math.PI) * h * .22 : 0;
    g.save(); g.translate(lunge, -bob);
    const leg = (x, ph) => { const sw = walking ? Math.sin(t * .014 + ph) * h * .1 : 0; line(g, x * w, -h * .34, x * w + sw, 0, '#d8d0bd', h * .07); line(g, x * w + sw, -h * .02, x * w + sw, 0, '#4a3a2a', h * .08) };
    leg(-.28, 0); leg(.28, 3.1); leg(-.12, 3.1); leg(.12, 0);
    E(g, 0, -h * .5, w * .38, h * .22, '#efe8d6');               // body
    E(g, -w * .08, -h * .42, w * .3, h * .12, '#d8d0bd');          // belly shade
    line(g, -w * .36, -h * .56, -w * .5, -h * .5 + Math.sin(t * .01) * h * .02, '#e6dfcb', h * .05);   // tail
    E(g, w * .38, -h * .72, w * .14, h * .12, '#efe8d6', .3);       // head
    E(g, w * .5, -h * .66, w * .07, h * .06, '#e0d6bf');            // muzzle
    line(g, w * .43, -h * .6, w * .45, -h * .5, '#efe8d6', h * .03);                 // beard
    line(g, w * .36, -h * .82, w * .31, -h * .97, '#8a7a5a', h * .045); line(g, w * .42, -h * .82, w * .45, -h * .96, '#8a7a5a', h * .045);   // horns
    E(g, w * .44, -h * .74, h * .018, h * .018, '#241a12');          // eye
    E(g, w * .3, -h * .76, w * .05, h * .04, '#d8d0bd', -.6);        // ear
    g.restore();
  }
  function drawPumpkin(g, o, boss) {
    const { h, t, walking, pose } = o, w = h * (boss ? 1.1 : 1.15), hit = o.hit != null && o.hit < 220 ? 1 - o.hit / 220 : 0, bob = boss && walking ? Math.abs(Math.sin(t * .01)) * h * .05 : 0;
    g.save(); g.translate(0, -bob);
    if (boss) {   // root legs + vine arms
      const sw = walking ? Math.sin(t * .012) * h * .08 : 0;
      for (const s of [-1, 1]) { line(g, s * w * .2, -h * .12, s * w * .24 + s * sw, 0, '#5b7f2e', h * .08); line(g, s * w * .34, -h * .42, s * w * .62, -h * (.3 + (pose === 'attack' ? .22 * Math.sin(Math.min(1, (o.hit ?? 0) / 300) * Math.PI) : .04)), '#5b7f2e', h * .06) }
      if (pose === 'attack' && o.vine) { // long vine lash toward the target
        g.beginPath(); g.moveTo(w * .3, -h * .4); g.bezierCurveTo(w * .8, -h * .7, w * 1.4, -h * .2, w * 1.9, -h * .35); g.strokeStyle = '#4d7a26'; g.lineWidth = h * .05; g.lineCap = 'round'; g.stroke() }
    }
    pumpkinBody(g, w, h * (boss ? .86 : .78), hit, boss ? '#d96a1c' : '#e8892a', boss, t);
    if (boss && o.evoFlash) { g.globalCompositeOperation = 'lighter'; E(g, 0, -h * .45, w * .6, h * .5, 'rgba(255,200,80,.25)'); g.globalCompositeOperation = 'source-over' }
    g.restore();
  }
  function drawPest(g, o) {
    const { h, t, walking } = o, w = h * 1.4, fl = Math.sin(t * .05) * .5, bob = Math.sin(t * .01 + (o.seed || 0)) * h * .08;
    g.save(); g.translate(0, -h * .5 - bob);
    for (const s of [-1, 0, 1]) { line(g, s * w * .18, h * .1, s * w * .3, h * .4, '#3a2a14', h * .06); line(g, s * w * .18, -h * .1, s * w * .3, -h * .35 * 0, '#3a2a14', h * .05) }
    E(g, 0, 0, w * .36, h * .3, '#7a8f2a');                                   // wing cases
    line(g, 0, -h * .28, 0, h * .28, '#4d5c18', h * .04);
    E(g, w * .34, -h * .04, w * .16, h * .16, '#4a3a1a');                      // head
    line(g, w * .42, -h * .14, w * .58, -h * .38 + fl * h * .05, '#2a1e0c', h * .035); line(g, w * .4, -h * .1, w * .6, -h * .22 - fl * h * .05, '#2a1e0c', h * .035);   // antennae
    E(g, -w * .08, -h * .22, w * .2, h * .08, 'rgba(255,255,255,.35)', -.3);   // shine
    if (walking) E(g, -w * .5, 0, w * .12, h * .05, 'rgba(190,230,160,.4)');
    g.restore();
  }
  function draw(g, kind, o) {
    if (!KINDS[kind]) return false;
    g.save(); g.translate(o.x, o.y);
    if (o.hp <= 0) { g.rotate(kind === 'pumpkin' ? 0 : Math.PI * .4); g.globalAlpha *= .6 }
    if (kind === 'goat') drawGoat(g, o); else if (kind === 'pumpkin') drawPumpkin(g, o, false); else if (kind === 'pumpkinBoss') drawPumpkin(g, o, true); else drawPest(g, o);
    g.restore(); return true;
  }
  /* the harvest the pumpkin pops into: a bouncing pumpkin that rests on the ground, drawn after the unit is down (feet at (x, y)) */
  function drawLoot(g, o) { const e = Math.max(0, o.t); const hop = e < 700 ? Math.abs(Math.sin(e / 700 * Math.PI * 2.2)) * (1 - e / 700) * o.h * .9 : 0; g.save(); g.translate(o.x, o.y - hop); pumpkinBody(g, o.h * .62, o.h * .5, 0, '#f09a32', false, 0); g.restore() }
  /* a small round icon for the turn queue / inspect card (cached data URL) */
  const ICONS = {};
  function icon(kind) {
    if (ICONS[kind]) return ICONS[kind];
    try { const c = document.createElement('canvas'); c.width = c.height = 96; const q = c.getContext('2d'); q.fillStyle = '#2c3a2f'; q.fillRect(0, 0, 96, 96);
      q.save(); q.translate(48, 86); draw(q, kind, { x: 0, y: 0, h: kind === 'goat' ? 64 : 62, dir: 'SE', t: 0, hp: 1, hit: null, walking: false, pose: 'idle', seed: 1 }); q.restore(); return ICONS[kind] = c.toDataURL('image/png') } catch (e) { return '' }
  }
  root.CodeMonsters = { draw, drawLoot, icon, has: k => !!KINDS[k], KINDS: Object.keys(KINDS) };
})(typeof window !== 'undefined' ? window : globalThis);
