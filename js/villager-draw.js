/* v97.37 · look.sprite draws a picture set instead of the code figure (see spriteDraw). v92.17 · Code-drawn people (no image needed): villagers, inn regulars and recruits. Shared by the place interiors and the battle
   (companions without their own picture). look = { coat, apron, hair, hat: none|cap|hood|scarf|straw|helm|bandana|hat, hatCol, skin,
   beard, cape, weapon: sword|axe|bow|staff|dagger|lute|mug|broom|hammer|book, small, tall }.
   VillagerDraw(g, look, x, y, t, { walking, face: SE|SW|NE|NW, scale, phase, act }) — feet at (x, y). */
(function (root) {
  'use strict';
  function weapon(g, w, s, sw, back) {
    if (!w) return;
    g.save(); g.translate(15 * s - sw, -33 * s);
    if (w === 'sword') { g.rotate(-.5); g.fillStyle = '#d8dde4'; g.fillRect(-1.5 * s, -34 * s, 3 * s, 32 * s); g.fillStyle = '#7a5a2a'; g.fillRect(-5 * s, -3 * s, 10 * s, 3 * s); g.fillRect(-1.5 * s, 0, 3 * s, 7 * s) }
    else if (w === 'axe') { g.rotate(-.4); g.fillStyle = '#6a4a2a'; g.fillRect(-1.5 * s, -30 * s, 3 * s, 36 * s); g.fillStyle = '#b8bec6'; g.beginPath(); g.moveTo(1 * s, -30 * s); g.quadraticCurveTo(14 * s, -26 * s, 12 * s, -14 * s); g.lineTo(1 * s, -18 * s); g.closePath(); g.fill() }
    else if (w === 'bow') { g.strokeStyle = '#7a5a2a'; g.lineWidth = 2.5 * s; g.beginPath(); g.arc(0, -10 * s, 18 * s, -1.2, 1.2); g.stroke(); g.strokeStyle = '#eee'; g.lineWidth = 1; g.beginPath(); g.moveTo(Math.cos(-1.2) * 18 * s, -10 * s + Math.sin(-1.2) * 18 * s); g.lineTo(Math.cos(1.2) * 18 * s, -10 * s + Math.sin(1.2) * 18 * s); g.stroke() }
    else if (w === 'staff') { g.fillStyle = '#6a4a2a'; g.fillRect(-1.5 * s, -44 * s, 3 * s, 54 * s); g.fillStyle = '#8fd0ff'; g.beginPath(); g.arc(0, -46 * s, 4.5 * s, 0, 7); g.fill() }
    else if (w === 'dagger') { g.rotate(.6); g.fillStyle = '#d8dde4'; g.fillRect(-1 * s, -14 * s, 2.5 * s, 13 * s); g.fillStyle = '#3a2a1a'; g.fillRect(-1 * s, -1 * s, 2.5 * s, 5 * s) }
    else if (w === 'hammer') { g.rotate(-.3); g.fillStyle = '#6a4a2a'; g.fillRect(-1.5 * s, -24 * s, 3 * s, 28 * s); g.fillStyle = '#8a8f96'; g.fillRect(-6 * s, -30 * s, 12 * s, 8 * s) }
    else if (w === 'mug') { g.fillStyle = '#b8864a'; g.fillRect(-4 * s, -9 * s, 8 * s, 10 * s); g.fillStyle = '#fff6d8'; g.fillRect(-4 * s, -10 * s, 8 * s, 3 * s); g.strokeStyle = '#8a6030'; g.lineWidth = 1.5 * s; g.beginPath(); g.arc(5 * s, -4 * s, 3 * s, -1.5, 1.5); g.stroke() }
    else if (w === 'broom') { g.rotate(.25); g.fillStyle = '#8a6a3a'; g.fillRect(-1.2 * s, -34 * s, 2.4 * s, 40 * s); g.fillStyle = '#d8b86a'; g.beginPath(); g.moveTo(-6 * s, 6 * s); g.lineTo(6 * s, 6 * s); g.lineTo(3 * s, -2 * s); g.lineTo(-3 * s, -2 * s); g.closePath(); g.fill() }
    else if (w === 'book') { g.fillStyle = '#7a2a2a'; g.fillRect(-6 * s, -8 * s, 11 * s, 8 * s); g.fillStyle = '#f2e6c8'; g.fillRect(-5 * s, -7 * s, 9 * s, 2 * s) }
    else if (w === 'lute') { g.translate(-15 * s, 4 * s); g.rotate(-.6); g.fillStyle = '#b07a3a'; g.beginPath(); g.ellipse(0, 0, 8 * s, 6 * s, 0, 0, 7); g.fill(); g.fillStyle = '#6a4a2a'; g.fillRect(6 * s, -1.5 * s, 16 * s, 3 * s); g.fillStyle = '#3a2a1a'; g.beginPath(); g.arc(0, 0, 2 * s, 0, 7); g.fill() }
    g.restore();
  }
  function fx(g, act, x, y, s, t, ph) {
    if (act === 'sleep') { g.save(); g.fillStyle = '#f2f2ff'; g.font = `700 ${12 * s}px system-ui`; const k = (t * .001 + ph) % 1; g.globalAlpha = 1 - k; g.fillText('z', x + 12 * s, y - 80 * s - k * 16); g.restore() }
    if (act === 'play') { g.save(); g.fillStyle = '#ffe9a0'; g.font = `700 ${13 * s}px system-ui`; for (let i = 0; i < 2; i++) { const k = (t * .0007 + ph + i * .5) % 1; g.globalAlpha = 1 - k; g.fillText('♪', x + (10 + i * 6) * s + Math.sin(k * 6) * 6, y - 70 * s - k * 30) } g.restore() }
  }
  /* v97.37 · picture-based people. look.sprite = 'bram' → assets/village-town/npc/bram/<se|sw|ne|nw>-<stand|walk1|walk2>.webp
     (384×384, feet at y=372, true 4 directions, no mirroring). Falls back to the code-drawn figure until the standing picture has loaded. */
  const SPR = {}, SPR_KEYS = ['stand', 'walk1', 'walk2'], SPR_DIRS = ['se', 'sw', 'ne', 'nw'];
  function sprites(name) {
    let S = SPR[name]; if (S) return S; S = SPR[name] = {};
    if (typeof Image === 'undefined') return S;
    for (const d of SPR_DIRS) for (const k of SPR_KEYS) { const im = new Image(); im.src = 'assets/village-town/npc/' + name + '/' + d + '-' + k + '.webp'; S[d + '-' + k] = im }
    return S;
  }
  const ready = im => im && im.complete && im.naturalWidth > 0;
  function spriteDraw(g, L, x, y, t, o) {
    const S = sprites(L.sprite), d = (o.face || 'SE').toLowerCase(), ph = o.phase || 0, act = o.act || '', walking = !!o.walking;
    const stand = S[d + '-stand']; if (!ready(stand)) return false;
    const s = (o.scale || 1) * (L.small ? .72 : 1) * (L.spriteScale || 1), k = s * 84 / 330;
    let im = stand;
    if (walking && act === '') { const p = t * .012 + ph, f = ((Math.round(p / (Math.PI / 2)) % 4) + 4) % 4, w = S[d + '-' + (f === 0 ? 'walk1' : f === 2 ? 'walk2' : 'stand')]; if (ready(w)) im = w }
    const bob = walking ? Math.abs(Math.sin(t * .012 + ph)) * 4 * s : act === 'play' ? Math.abs(Math.sin(t * .008 + ph)) * 2 * s : Math.sin(t * .002 + ph) * .8;
    g.save(); g.fillStyle = 'rgba(20,20,20,.32)'; g.beginPath(); g.ellipse(x, y, 15 * s, 6 * s, 0, 0, 7); g.fill(); g.restore();
    g.save(); g.translate(x, y - bob + (act === 'sit' ? 8 * s : 0)); g.drawImage(im, -192 * k, -372 * k, 384 * k, 384 * k); g.restore();
    fx(g, act, x, y, s, t, ph);
    return true;
  }
  function draw(g, L, x, y, t, o = {}) {
    if (L && L.sprite && spriteDraw(g, L, x, y, t, o)) return;
    const face = o.face || 'SE', back = face === 'NE' || face === 'NW', flip = face === 'SW' || face === 'NW', ph = o.phase || 0, walking = !!o.walking;
    const s = (o.scale || 1) * (L.small ? .72 : L.tall ? 1.1 : 1), act = o.act || '';
    const bob = walking ? Math.abs(Math.sin(t * .012 + ph)) * 4 * s : act === 'play' ? Math.abs(Math.sin(t * .008 + ph)) * 2 * s : Math.sin(t * .002 + ph) * .8;
    g.save(); g.fillStyle = 'rgba(20,20,20,.32)'; g.beginPath(); g.ellipse(x, y, 15 * s, 6 * s, 0, 0, 7); g.fill(); g.restore();
    g.save(); g.translate(x, y - bob); if (flip) g.scale(-1, 1);
    const skin = L.skin || '#ecc6a0';
    if (act === 'sit') g.translate(0, 8 * s);
    if (L.cape && !back) { g.fillStyle = L.cape; g.beginPath(); g.moveTo(-14 * s, -56 * s); g.lineTo(-18 * s, -14 * s); g.lineTo(-6 * s, -16 * s); g.closePath(); g.fill() }
    if (L.cape && back) { g.fillStyle = L.cape; g.beginPath(); g.moveTo(-14 * s, -58 * s); g.lineTo(14 * s, -58 * s); g.lineTo(17 * s, -14 * s); g.lineTo(-17 * s, -14 * s); g.closePath(); g.fill() }
    const step = walking ? Math.sin(t * .012 + ph) * 5 * s : 0;
    g.strokeStyle = L.legs || '#3a2a1e'; g.lineWidth = 5 * s; g.lineCap = 'round'; g.beginPath();
    if (act === 'sit') { g.moveTo(-5 * s, -22 * s); g.lineTo(4 * s, -16 * s); g.lineTo(4 * s, -4 * s); g.moveTo(5 * s, -22 * s); g.lineTo(13 * s, -16 * s); g.lineTo(13 * s, -4 * s) }
    else { g.moveTo(-5 * s, -22 * s); g.lineTo(-5 * s + step, -2 * s); g.moveTo(5 * s, -22 * s); g.lineTo(5 * s - step, -2 * s) }
    g.stroke();
    g.fillStyle = L.coat; g.beginPath(); g.moveTo(-14 * s, -20 * s); g.quadraticCurveTo(-16 * s, -50 * s, -9 * s, -58 * s); g.lineTo(9 * s, -58 * s); g.quadraticCurveTo(16 * s, -50 * s, 14 * s, -20 * s); g.closePath(); g.fill();
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.moveTo(3 * s, -58 * s); g.lineTo(9 * s, -58 * s); g.quadraticCurveTo(16 * s, -50 * s, 14 * s, -20 * s); g.lineTo(5 * s, -20 * s); g.closePath(); g.fill();
    if (L.belt) { g.fillStyle = L.belt; g.fillRect(-14 * s, -30 * s, 28 * s, 3.5 * s) }
    if (L.apron && !back) { g.fillStyle = L.apron; g.fillRect(-8 * s, -46 * s, 16 * s, 25 * s) }
    const arm = act === 'drink' ? -Math.abs(Math.sin(t * .003 + ph)) * 10 * s : act === 'work' ? Math.sin(t * .01 + ph) * 6 * s : walking ? Math.sin(t * .012 + ph + Math.PI) * 4 * s : 0;
    g.strokeStyle = L.coat; g.lineWidth = 5 * s; g.beginPath(); g.moveTo(-13 * s, -52 * s); g.lineTo(-15 * s - arm * .3, -34 * s); g.moveTo(13 * s, -52 * s); g.lineTo(15 * s - arm, -34 * s + arm); g.stroke();
    g.fillStyle = skin; g.beginPath(); g.arc(-15 * s - arm * .3, -33 * s, 3 * s, 0, 7); g.arc(15 * s - arm, -33 * s + arm, 3 * s, 0, 7); g.fill();
    if (!back) { g.save(); g.translate(-arm, arm); weapon(g, L.weapon, s, 0, back); g.restore() }
    g.fillStyle = skin; g.beginPath(); g.arc(0, -68 * s, 11 * s, 0, 7); g.fill();
    g.fillStyle = L.hair; g.beginPath(); g.arc(0, -70 * s, 11.5 * s, Math.PI * 1.02, back ? Math.PI * 2.98 : Math.PI * 1.98); g.fill(); if (back) { g.beginPath(); g.arc(0, -68 * s, 11 * s, 0, 7); g.fill() }
    if (L.longHair) { g.fillRect(-11 * s, -70 * s, 5 * s, 18 * s); if (back) g.fillRect(-11 * s, -70 * s, 22 * s, 20 * s) }
    if (!back) {
      const blink = (Math.floor((t + ph * 997) / 140) % 37) === 0;
      g.fillStyle = '#2a1a12'; if (!blink) { g.fillRect(2 * s, -69 * s, 2 * s, 2.5 * s); g.fillRect(7 * s, -69 * s, 2 * s, 2.5 * s) } else { g.fillRect(2 * s, -68 * s, 2 * s, .8 * s); g.fillRect(7 * s, -68 * s, 2 * s, .8 * s) }
      if (L.beard) { g.fillStyle = L.beard; g.beginPath(); g.moveTo(-4 * s, -64 * s); g.quadraticCurveTo(5 * s, -50 * s, 12 * s, -63 * s); g.lineTo(10 * s, -60 * s); g.closePath(); g.fill() }
      if (act === 'sleep') { g.fillStyle = '#2a1a12'; g.fillRect(2 * s, -68 * s, 7 * s, 1 * s) }
    }
    const hc = L.hatCol || L.hair; g.fillStyle = hc;
    if (L.hat === 'cap') { g.beginPath(); g.arc(0, -74 * s, 11 * s, Math.PI, 0); g.fill(); g.fillRect(-2 * s, -75 * s, 15 * s, 3 * s) }
    else if (L.hat === 'hood') { g.beginPath(); g.arc(0, -70 * s, 13.5 * s, Math.PI * .9, Math.PI * 2.1); g.lineTo(13 * s, -58 * s); g.lineTo(-13 * s, -58 * s); g.closePath(); g.fill(); if (!back) { g.fillStyle = skin; g.beginPath(); g.arc(2 * s, -67 * s, 8 * s, 0, 7); g.fill(); g.fillStyle = '#2a1a12'; g.fillRect(2 * s, -69 * s, 2 * s, 2.5 * s); g.fillRect(7 * s, -69 * s, 2 * s, 2.5 * s) } }
    else if (L.hat === 'scarf') { g.beginPath(); g.arc(0, -71 * s, 12 * s, Math.PI * 1.05, Math.PI * 1.95); g.lineTo(9 * s, -66 * s); g.lineTo(-9 * s, -66 * s); g.closePath(); g.fill() }
    else if (L.hat === 'straw') { g.beginPath(); g.ellipse(0, -76 * s, 19 * s, 5 * s, 0, 0, 7); g.fill(); g.beginPath(); g.arc(0, -77 * s, 9 * s, Math.PI, 0); g.fill() }
    else if (L.hat === 'helm') { g.beginPath(); g.arc(0, -71 * s, 12.5 * s, Math.PI, 0); g.fill(); g.fillRect(-12.5 * s, -72 * s, 25 * s, 4 * s) }
    else if (L.hat === 'bandana') { g.fillRect(-11.5 * s, -76 * s, 23 * s, 5 * s); g.beginPath(); g.moveTo(-11 * s, -73 * s); g.lineTo(-18 * s, -66 * s); g.lineTo(-13 * s, -70 * s); g.closePath(); g.fill() }
    else if (L.hat === 'hat') { g.beginPath(); g.ellipse(0, -77 * s, 16 * s, 4 * s, 0, 0, 7); g.fill(); g.beginPath(); g.moveTo(-8 * s, -77 * s); g.lineTo(-4 * s, -92 * s); g.lineTo(9 * s, -88 * s); g.lineTo(8 * s, -77 * s); g.closePath(); g.fill() }
    if (back) weapon(g, L.weapon, s, 0, back);
    g.restore();
    fx(g, act, x, y, s, t, ph);
  }
  root.VillagerDraw = draw;
})(globalThis);
