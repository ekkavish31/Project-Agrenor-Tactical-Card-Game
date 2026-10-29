/* v97.06 · Extra life for the prologue / opening scenes drawn by js/scene-art.js: small objects with frame animation
   (birds and bats flapping, butterflies, sheep grazing, chickens pecking, a cat breathing by the fire, a sparrow hopping on the
   window sill…) and effects (aurora, shooting stars, ground fog, sky lanterns, water glints, sparks, dripping water, cloud shadows).
   Drawn after each scene and before its colour grade (SceneArt paint → SceneExtras[name](g, w, h, t)); the narration is unchanged.
   Everything is placed in screen fractions in the empty parts of each scene (sky, edges, foreground) so it never covers the story figures. */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const fract = v => v - Math.floor(v);
  function rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
  function glow(g, x, y, r, rgb, a) { if (r <= 0 || a <= 0) return; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},${a})`); gr.addColorStop(.4, `rgba(${rgb},${a * .4})`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill() }

  /* ---------- small actors (frame animation) ---------- */
  // a bird seen from afar: 4 wing frames (up, mid, down, mid)
  function bird(g, x, y, s, t, col, seed = 0) {
    const f = Math.floor(t * 9 + seed * 3) % 4, wing = [-1, -.35, .45, -.35][f] * s;
    g.strokeStyle = col; g.lineWidth = Math.max(1, s * .28); g.lineCap = 'round'; g.beginPath();
    g.moveTo(x - s * 1.1, y + wing); g.quadraticCurveTo(x - s * .45, y + wing * .2 - s * .15, x, y); g.quadraticCurveTo(x + s * .45, y + wing * .2 - s * .15, x + s * 1.1, y + wing); g.stroke();
  }
  function flock(g, w, h, t, o) {
    const n = o.n || 5, per = o.period || 26;
    for (let i = 0; i < n; i++) { const q = rng((o.seed || 1) * 97 + i), ph = fract(t / per + (o.offset || 0)), dir = o.dir || 1;
      const x = (dir > 0 ? -.1 + ph * 1.25 : 1.1 - ph * 1.25) * w - dir * (i % 3) * w * .025 - (i > 2 ? dir * w * .02 : 0), y = h * o.y + (i - n / 2) * h * .012 * (i % 2 ? 1 : -1) + Math.sin(t * .9 + i) * h * .008;
      bird(g, x + q() * 6, y, (o.size || 5) * (.8 + q() * .4), t, o.col || 'rgba(40,40,50,.75)', i) }
  }
  // a bat: 3 frames, jagged wings
  function bat(g, x, y, s, t, seed) {
    const f = Math.floor(t * 12 + seed) % 3, up = [-.9, 0, .7][f] * s;
    g.fillStyle = 'rgba(8,8,16,.9)'; g.beginPath(); g.moveTo(x, y);
    g.lineTo(x - s * .6, y + up * .5 - s * .2); g.lineTo(x - s * 1.4, y + up); g.lineTo(x - s * 1.05, y + up * .4 + s * .25); g.lineTo(x - s * .7, y + up * .3 + s * .35); g.lineTo(x - s * .3, y + s * .3);
    g.lineTo(x + s * .3, y + s * .3); g.lineTo(x + s * .7, y + up * .3 + s * .35); g.lineTo(x + s * 1.05, y + up * .4 + s * .25); g.lineTo(x + s * 1.4, y + up); g.lineTo(x + s * .6, y + up * .5 - s * .2);
    g.closePath(); g.fill(); g.beginPath(); g.arc(x, y + s * .1, s * .28, 0, TAU); g.fill();
  }
  function bats(g, w, h, t, o) {
    for (let i = 0; i < (o.n || 4); i++) { const q = rng(400 + i * 7 + (o.seed || 0)), per = 9 + q() * 6, ph = fract(t / per + q());
      const x = (q() < .5 ? ph : 1 - ph) * w * 1.2 - w * .1, y = h * (o.y + q() * o.dy) + Math.sin(ph * TAU * 3 + i) * h * .03;
      bat(g, x, y, (o.size || 6) * (.7 + q() * .5), t, i) }
  }
  // a butterfly: wings open/close (2 frames + in-between), wandering path
  function butterfly(g, x, y, s, t, hue, seed) {
    const open = Math.abs(Math.sin(t * 14 + seed * 2)), ww = s * (.25 + .75 * open);
    g.fillStyle = `hsla(${hue},80%,70%,.95)`;
    g.beginPath(); g.ellipse(x - ww * .55, y - s * .2, ww * .55, s * .55, -.4, 0, TAU); g.ellipse(x + ww * .55, y - s * .2, ww * .55, s * .55, .4, 0, TAU); g.fill();
    g.fillStyle = `hsla(${hue},70%,60%,.95)`; g.beginPath(); g.ellipse(x - ww * .4, y + s * .3, ww * .35, s * .35, .3, 0, TAU); g.ellipse(x + ww * .4, y + s * .3, ww * .35, s * .35, -.3, 0, TAU); g.fill();
    g.fillStyle = '#2a2018'; g.fillRect(x - .6, y - s * .5, 1.2, s);
  }
  function butterflies(g, w, h, t, o) {
    for (let i = 0; i < (o.n || 3); i++) { const q = rng(800 + i * 11 + (o.seed || 0)), cx = w * (o.x0 + q() * (o.x1 - o.x0)), cy = h * (o.y0 + q() * (o.y1 - o.y0));
      const x = cx + Math.sin(t * (.35 + q() * .2) + i * 2) * w * .06 + Math.sin(t * 1.3 + i) * 6, y = cy + Math.sin(t * (.5 + q() * .3) + i) * h * .04 + Math.sin(t * 3.1 + i * 4) * 3;
      butterfly(g, x, y, o.size || 4, t, o.hues ? o.hues[i % o.hues.length] : [45, 200, 330, 20][i % 4], i) }
  }
  // a sheep: body bob, head goes down to graze and back up (frame by phase)
  function sheep(g, x, y, s, t, seed, flip) {
    const ph = fract(t / 5 + seed * .37), down = ph < .55 ? clamp((ph - .05) * 6) * clamp((.55 - ph) * 6) : 0, chew = down > .5 ? Math.sin(t * 9) * .4 : 0;
    g.save(); g.translate(x, y); if (flip) g.scale(-1, 1); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(0, 6, 9, 2, 0, 0, TAU); g.fill();
    g.fillStyle = '#3a3030'; for (const lx of [-5, -2, 3, 6]) g.fillRect(lx, 1, 1.4, 5);
    g.fillStyle = '#f2efe6'; g.beginPath(); for (const [dx, dy, r] of [[-4, -1, 4], [0, -2.5, 4.5], [4, -1, 4], [0, 1, 4]]) { g.moveTo(dx + r, dy); g.arc(dx, dy, r, 0, TAU) } g.fill();
    g.fillStyle = '#3a3030'; g.beginPath(); g.ellipse(9, -2 + down * 5 + chew, 2.4, 2, .3 + down * .8, 0, TAU); g.fill();
    g.restore();
  }
  // a chicken: pecks (3 frames) and takes a step now and then
  function chicken(g, x, y, s, t, seed, flip) {
    const ph = fract(t * .8 + seed * .41), peck = ph < .3 ? [0, 1, 2, 1][Math.floor(ph / .3 * 4)] : 0, step = Math.floor(t * .8 + seed) % 6 === 0 ? Math.sin(fract(t * .8) * Math.PI) * 2 : 0;
    g.save(); g.translate(x + step * (flip ? -1 : 1), y); if (flip) g.scale(-1, 1); g.scale(s, s);
    g.fillStyle = '#d9a43a'; g.fillRect(-1, 0, 1, 3); g.fillRect(1.5, 0, 1, 3);
    g.fillStyle = '#f6f0e0'; g.beginPath(); g.ellipse(0, -2, 4, 3, -.2, 0, TAU); g.fill(); g.beginPath(); g.moveTo(-3, -3); g.lineTo(-6, -6); g.lineTo(-4, -1); g.fill();
    const hx = 3.5 + peck * .8, hy = -5 + peck * 2.6; g.beginPath(); g.arc(hx, hy, 1.9, 0, TAU); g.fill();
    g.fillStyle = '#d0402e'; g.fillRect(hx - .6, hy - 3, 1.4, 1.4); g.fillStyle = '#e8a030'; g.fillRect(hx + 1.6, hy - .4, 1.6, .9);
    g.restore();
  }
  // a cat curled up: breathing and a slow tail flick
  function cat(g, x, y, s, t) {
    const br = 1 + Math.sin(t * 1.6) * .04, flick = Math.sin(t * .7) > .85 ? Math.sin(t * 9) * .5 : 0;
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(0, 4, 16, 3, 0, 0, TAU); g.fill();
    g.fillStyle = '#4a3428'; g.beginPath(); g.ellipse(0, -2, 13, 6 * br, 0, Math.PI, 0); g.lineTo(13, 3); g.lineTo(-13, 3); g.fill();
    g.fillStyle = '#4a3428'; g.beginPath(); g.arc(11, -1, 4.5, 0, TAU); g.fill(); g.beginPath(); g.moveTo(9, -4); g.lineTo(10, -8.5); g.lineTo(12, -5); g.moveTo(12.5, -5); g.lineTo(15, -8); g.lineTo(15, -3); g.fill();
    g.strokeStyle = '#4a3428'; g.lineWidth = 2.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(-12, 2); g.quadraticCurveTo(-18, 2 - flick * 4, -14 + flick * 2, -4 - flick * 5); g.stroke();
    g.fillStyle = 'rgba(255,170,90,.35)'; g.beginPath(); g.ellipse(-2, -6 * br, 9, 1.5, 0, Math.PI, 0); g.fill();   // firelight on the back
    g.restore();
  }
  // a sparrow on a ledge: hops, pecks and turns
  function sparrow(g, x, y, s, t) {
    const ph = fract(t / 6), hop = ph > .5 && ph < .6 ? Math.sin((ph - .5) * 10 * Math.PI) * 5 : 0, dx = (ph > .55 ? 8 : 0) + (ph > .9 ? -8 * clamp((ph - .9) * 10) : 0);
    const peck = ph > .2 && ph < .3 ? Math.abs(Math.sin(t * 18)) * 2 : 0, flip = ph > .6 && ph < .9;
    g.save(); g.translate(x + dx, y - hop); if (flip) g.scale(-1, 1); g.scale(s, s);
    g.fillStyle = '#5a3e28'; g.beginPath(); g.ellipse(0, -3, 4, 3, -.3, 0, TAU); g.fill(); g.beginPath(); g.moveTo(-3, -3); g.lineTo(-7, -1); g.lineTo(-3, -1); g.fill();
    g.fillStyle = '#e6d4b8'; g.beginPath(); g.ellipse(1, -2, 2.5, 1.8, 0, 0, Math.PI); g.fill();
    g.fillStyle = '#5a3e28'; g.beginPath(); g.arc(3.5, -6 + peck, 2.2, 0, TAU); g.fill(); g.fillStyle = '#e8b040'; g.fillRect(5.3, -6 + peck, 1.6, .9);
    g.fillStyle = '#111'; g.fillRect(4, -6.8 + peck, .9, .9); g.strokeStyle = '#3a2a18'; g.lineWidth = .7; g.beginPath(); g.moveTo(-.5, 0); g.lineTo(-.5, 2); g.moveTo(1, 0); g.lineTo(1, 2); g.stroke();
    g.restore();
  }
  // an owl on a perch: blinks and turns its head
  function owl(g, x, y, s, t) {
    const blink = fract(t / 4.2) > .95, turn = Math.sin(t * .4) > .6 ? 1.6 : 0;
    g.save(); g.translate(x, y); g.scale(s, s);
    g.fillStyle = '#0a0a14'; g.beginPath(); g.ellipse(0, 0, 5, 7, 0, 0, TAU); g.fill(); g.beginPath(); g.arc(turn, -7, 4.2, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(turn - 4, -9); g.lineTo(turn - 4.5, -13); g.lineTo(turn - 1.5, -10); g.moveTo(turn + 4, -9); g.lineTo(turn + 4.5, -13); g.lineTo(turn + 1.5, -10); g.fill();
    if (!blink) { glow(g, turn - 1.7, -7.5, 3, '255,220,120', .9); glow(g, turn + 1.7, -7.5, 3, '255,220,120', .9); g.fillStyle = '#ffe7a0'; g.fillRect(turn - 2.3, -8, 1.3, 1.3); g.fillRect(turn + 1.1, -8, 1.3, 1.3) }
    g.restore();
  }

  /* ---------- effects ---------- */
  function shootingStar(g, w, h, t, o = {}) {
    const per = o.period || 7, ph = fract(t / per + (o.offset || 0)); if (ph > .12) return;
    const k = ph / .12, n = Math.floor(t / per + (o.offset || 0)), q = rng(900 + n), x0 = w * (.15 + q() * .6), y0 = h * (.04 + q() * (o.maxY || .2)), L = w * .16;
    const x = x0 + k * L, y = y0 + k * L * .35, a = Math.sin(k * Math.PI);
    const gr = g.createLinearGradient(x, y, x - L * .45, y - L * .16); gr.addColorStop(0, `rgba(255,250,235,${.9 * a})`); gr.addColorStop(1, 'rgba(255,250,235,0)');
    g.strokeStyle = gr; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y); g.lineTo(x - L * .45, y - L * .16); g.stroke(); glow(g, x, y, 6, '255,250,235', a * .8);
  }
  function fog(g, w, h, t, o) {
    g.save(); g.globalCompositeOperation = o.add ? 'lighter' : 'source-over';
    for (let i = 0; i < (o.n || 5); i++) { const q = rng(1200 + i + (o.seed || 0)), sp = (.6 + q()) * (o.speed || 8), x = ((q() * w + t * sp) % (w * 1.6)) - w * .3, y = h * (o.y + (q() - .5) * (o.dy || .06)), rx = w * (.18 + q() * .16), ry = h * (.025 + q() * .025);
      const gr = g.createRadialGradient(x, y, 0, x, y, rx); gr.addColorStop(0, `rgba(${o.rgb || '200,210,230'},${(o.a || .16) * (.7 + .3 * Math.sin(t * .3 + i))})`); gr.addColorStop(1, `rgba(${o.rgb || '200,210,230'},0)`);
      g.fillStyle = gr; g.save(); g.translate(x, y); g.scale(1, ry / rx); g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore() }
    g.restore();
  }
  function aurora(g, w, h, t) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let b = 0; b < 3; b++) { const hue = [150, 175, 285][b], base = h * (.12 + b * .06);
      for (let x = 0; x <= w; x += 6) { const u = x / w, y = base + Math.sin(u * 5 + t * .35 + b * 2) * h * .04 + Math.sin(u * 13 - t * .6 + b) * h * .012, a = .15 * (.5 + .5 * Math.sin(u * 9 + t * .8 + b * 1.7)) * Math.sin(u * Math.PI);
        const gr = g.createLinearGradient(0, y - h * .1, 0, y + h * .02); gr.addColorStop(0, `hsla(${hue},80%,60%,0)`); gr.addColorStop(.8, `hsla(${hue},85%,65%,${a})`); gr.addColorStop(1, `hsla(${hue},85%,70%,0)`);
        g.fillStyle = gr; g.fillRect(x, y - h * .1, 6, h * .12) } }
    g.restore();
  }
  function skyLanterns(g, w, h, t, o) {
    for (let i = 0; i < (o.n || 7); i++) { const q = rng(1500 + i), per = 16 + q() * 10, ph = fract(t / per + q()), x = w * (o.x0 + q() * (o.x1 - o.x0)) + Math.sin(t * .5 + i) * 8, y = h * o.y0 - ph * h * (o.rise || .6), s = (1 - ph * .55) * (o.size || 5), a = Math.sin(ph * Math.PI) * (.8 + .2 * Math.sin(t * 6 + i));
      glow(g, x, y, s * 5, '255,170,80', .35 * a); g.fillStyle = `rgba(255,190,110,${a})`; g.beginPath(); g.moveTo(x - s * .7, y - s); g.lineTo(x + s * .7, y - s); g.lineTo(x + s * .5, y + s * .6); g.lineTo(x - s * .5, y + s * .6); g.closePath(); g.fill();
      g.fillStyle = `rgba(255,240,190,${a})`; g.fillRect(x - s * .25, y + s * .2, s * .5, s * .35) }
  }
  function glints(g, w, h, t, o) {
    for (let i = 0; i < (o.n || 24); i++) { const q = rng(1700 + i + (o.seed || 0)), x = w * (o.x0 + q() * (o.x1 - o.x0)), y = h * (o.y0 + q() * (o.y1 - o.y0)), a = Math.max(0, Math.sin(t * (1.5 + q() * 2) + q() * TAU)) ** 6;
      if (a < .02) continue; g.fillStyle = `rgba(255,255,240,${a * .95})`; const s = 1.2 + q() * 1.6; g.fillRect(x - s * 2, y - .4, s * 4, .8); g.fillRect(x - .4, y - s, .8, s * 2); glow(g, x, y, s * 3, '255,255,230', a * .4) }
  }
  function sparksUp(g, x, y, t, o) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < (o.n || 16); i++) { const q = rng(2000 + i), per = 1.6 + q() * 1.6, ph = fract(t / per + q()), sx = x + (q() - .5) * (o.spread || 30) + Math.sin(ph * 8 + i) * 8 * ph, sy = y - ph * (o.rise || 90);
      glow(g, sx, sy, 3 + (1 - ph) * 2, o.rgb || '255,150,60', (1 - ph) * .9) }
    g.restore();
  }
  function drips(g, w, h, t, o) {
    for (const [fx, fy, fl, off] of o.spots) { const x = w * fx, y0 = h * fy, y1 = h * fl, per = 2.6, ph = fract(t / per + off);
      g.fillStyle = 'rgba(170,200,230,.7)';
      if (ph < .35) { const k = ph / .35; g.beginPath(); g.ellipse(x, y0 + 1.5 * k, 1.4 * k + .4, 2 * k + .5, 0, 0, TAU); g.fill() }
      else if (ph < .6) { const k = (ph - .35) / .25; g.beginPath(); g.ellipse(x, y0 + (y1 - y0) * k * k, 1.4, 2.6, 0, 0, TAU); g.fill() }
      else { const k = (ph - .6) / .4; g.strokeStyle = `rgba(170,200,230,${.6 * (1 - k)})`; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y1, 3 + k * 14, (3 + k * 14) * .25, 0, 0, TAU); g.stroke() } }
  }
  function leaves(g, w, h, t, o) {
    for (let i = 0; i < (o.n || 10); i++) { const q = rng(2300 + i + (o.seed || 0)), per = 9 + q() * 7, ph = fract(t / per + q()), x = w * (q() * 1.1 - .05) + Math.sin(ph * TAU * 2 + i) * w * .04 + ph * w * .12, y = -10 + ph * h * 1.05, r = ph * TAU * 3 + i;
      g.save(); g.translate(x, y); g.rotate(r); g.scale(1, Math.abs(Math.cos(r * .7)) * .8 + .2); g.fillStyle = o.cols[i % o.cols.length]; g.beginPath(); g.ellipse(0, 0, o.size || 4, (o.size || 4) * .45, 0, 0, TAU); g.fill(); g.restore() }
  }
  function cloudShadows(g, w, h, t, o) {
    for (let i = 0; i < 3; i++) { const q = rng(2600 + i), x = ((q() * w + t * (10 + q() * 8)) % (w * 1.8)) - w * .4, y = h * (o.y0 + q() * (o.y1 - o.y0)), rx = w * (.16 + q() * .1);
      const gr = g.createRadialGradient(x, y, 0, x, y, rx); gr.addColorStop(0, 'rgba(20,30,40,.13)'); gr.addColorStop(1, 'rgba(20,30,40,0)'); g.fillStyle = gr; g.save(); g.translate(x, y); g.scale(1, .3); g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore() }
  }
  // grass blades along the bottom edge, swaying in the wind (foreground framing)
  function grassEdge(g, w, h, t, o) {
    const q = rng(o.seed || 3100); g.lineCap = 'round';
    for (let i = 0; i < (o.n || 70); i++) { const x = q() * w, side = Math.min(x, w - x) / w, tall = (o.h || .1) * h * (.4 + q() * .6) * (o.edges ? (side < .22 ? 1 : .35) : 1), sw = Math.sin(t * 1.4 + x * .02) * tall * .18;
      g.strokeStyle = o.cols[i % o.cols.length]; g.lineWidth = 1.5 + q() * 1.5; g.beginPath(); g.moveTo(x, h + 2); g.quadraticCurveTo(x + sw * .4, h - tall * .5, x + sw, h - tall); g.stroke() }
  }
  // dark leafy branches hanging into the frame from the top corners (foreground parallax)
  function branches(g, w, h, t, o) {
    g.fillStyle = o.col || '#05080c';
    for (const side of [0, 1]) { const q = rng(3300 + side), sx = side ? w : 0, dir = side ? -1 : 1, sway = Math.sin(t * .8 + side * 2) * 4;
      g.strokeStyle = o.col || '#05080c'; g.lineWidth = 6; g.beginPath(); g.moveTo(sx, h * .02); g.quadraticCurveTo(sx + dir * w * .1, h * .06 + sway, sx + dir * w * .2, h * .02 + sway); g.stroke();
      for (let i = 0; i < 26; i++) { const u = q(), x = sx + dir * w * .2 * u, y = h * (.03 + Math.sin(u * Math.PI) * .03) + sway * u + q() * h * .05 * (1 - u * .5), s = 5 + q() * 6, sw2 = Math.sin(t * 1.6 + i) * .25;
        g.save(); g.translate(x, y); g.rotate(1.2 + q() * .8 + sw2); g.beginPath(); g.ellipse(s, 0, s, s * .38, 0, 0, TAU); g.fill(); g.restore() } }
  }
  function compass(g, x, y, r, t) {
    g.save(); g.translate(x, y); g.globalAlpha = .6; g.strokeStyle = 'rgba(90,60,30,.8)'; g.lineWidth = 1.2; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, r * .8, 0, TAU); g.stroke();
    g.rotate(Math.sin(t * .6) * .12);
    for (let i = 0; i < 8; i++) { const L = i % 2 ? r * .45 : r * .95; g.rotate(TAU / 8); g.fillStyle = i % 4 === 3 ? 'rgba(170,50,30,.9)' : i % 2 ? 'rgba(120,90,50,.8)' : 'rgba(60,40,20,.85)'; g.beginPath(); g.moveTo(0, -L); g.lineTo(r * .1, 0); g.lineTo(-r * .1, 0); g.fill() }
    g.restore();
  }
  function kite(g, x, y, s, t) {
    const sw = Math.sin(t * 1.3) * .2, kx = x + Math.sin(t * .7) * 10, ky = y + Math.sin(t * 1.1) * 6;
    g.save(); g.translate(kx, ky); g.rotate(sw); g.fillStyle = '#d24b3c'; g.beginPath(); g.moveTo(0, -s); g.lineTo(s * .7, 0); g.lineTo(0, s * 1.3); g.lineTo(-s * .7, 0); g.closePath(); g.fill();
    g.fillStyle = '#f2c84a'; g.beginPath(); g.moveTo(0, -s); g.lineTo(s * .7, 0); g.lineTo(0, 0); g.fill(); g.restore();
    g.strokeStyle = 'rgba(60,40,30,.5)'; g.lineWidth = 1; g.beginPath(); g.moveTo(kx, ky + s * 1.3);
    for (let k = 1; k <= 12; k++) g.lineTo(kx - k * 3, ky + s * 1.3 + k * 4 + Math.sin(t * 4 - k * .8) * 3); g.stroke();
    for (let k = 3; k <= 12; k += 3) { const bx = kx - k * 3, by = ky + s * 1.3 + k * 4 + Math.sin(t * 4 - k * .8) * 3; g.fillStyle = k % 6 ? '#3a7ac8' : '#f2c84a'; g.fillRect(bx - 2, by - 1, 4, 2) }
  }
  function curtain(g, x, y, cw, ch, t) {
    g.fillStyle = 'rgba(200,170,130,.55)'; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k <= 10; k++) { const u = k / 10; g.lineTo(x + cw + Math.sin(t * 1.4 + u * 4) * cw * .35 * u, y + ch * u) }
    g.lineTo(x, y + ch); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(150,120,90,.4)'; g.lineWidth = 1; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x + cw * k / 4, y); g.lineTo(x + cw * k / 4 + Math.sin(t * 1.4 + 3) * cw * .2, y + ch); g.stroke() }
  }
  function fishJump(g, w, h, t, o) {
    for (let i = 0; i < (o.n || 2); i++) { const q = rng(3600 + i), per = 5 + q() * 4, ph = fract(t / per + q() * 3), x = w * (o.x0 + q() * (o.x1 - o.x0)), y = h * o.y;
      if (ph < .25) { const k = ph / .25, fx = x + k * 18, fy = y - Math.sin(k * Math.PI) * 16; g.save(); g.translate(fx, fy); g.rotate(-Math.PI / 2 + k * Math.PI); g.fillStyle = '#c8d8e0'; g.beginPath(); g.ellipse(0, 0, 2, 5, 0, 0, TAU); g.fill(); g.restore() }
      for (const [k0, xx] of [[0, x], [.25, x + 18]]) { const k = (ph - k0) / .35; if (k < 0 || k > 1) continue; g.strokeStyle = `rgba(220,240,255,${.7 * (1 - k)})`; g.lineWidth = 1; g.beginPath(); g.ellipse(xx, y, 2 + k * 12, (2 + k * 12) * .3, 0, 0, TAU); g.stroke() } }
  }
  function lanternSwing(g, x, y, L, t) {
    const a = Math.sin(t * 1.1) * .18, lx = x + Math.sin(a) * L, ly = y + Math.cos(a) * L, fl = .85 + .15 * Math.sin(t * 13) * Math.sin(t * 7.3);
    glow(g, lx, ly, L * 1.6, '255,190,100', .35 * fl);
    g.strokeStyle = 'rgba(40,30,20,.9)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(lx, ly - 6); g.stroke();
    g.fillStyle = '#2a2018'; g.fillRect(lx - 5, ly - 7, 10, 2); g.fillRect(lx - 5, ly + 6, 10, 2);
    g.fillStyle = `rgba(255,${200 + 30 * fl | 0},120,${.9 * fl})`; g.fillRect(lx - 4, ly - 5, 8, 11);
    g.strokeStyle = '#2a2018'; g.beginPath(); g.moveTo(lx, ly - 5); g.lineTo(lx, ly + 6); g.stroke();
  }
  function smokeRibbon(g, x, y, t, seed, hgt) {
    g.strokeStyle = 'rgba(220,220,235,.18)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y);
    for (let k = 1; k <= 16; k++) { const u = k / 16; g.lineTo(x + Math.sin(u * 6 - t * 1.5 + seed) * 6 * u + u * 8, y - u * hgt) } g.stroke();
  }
  function spirits(g, x, y, R, t) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) { const a = t * (.4 + i * .05) + i * TAU / 6, rr = R * (1 + .15 * Math.sin(t * 1.3 + i)), sx = x + Math.cos(a) * rr, sy = y + Math.sin(a) * rr * .45;
      for (let k = 0; k < 6; k++) { const b = a - k * .06; glow(g, x + Math.cos(b) * rr, y + Math.sin(b) * rr * .45, 6 - k * .7, '255,215,120', .35 * (1 - k / 6)) }
      glow(g, sx, sy, 7, '255,235,170', .7) }
    g.restore();
  }
  function warmFlicker(g, w, h, t, x, y) {
    const f = .5 + .5 * Math.sin(t * 9) * Math.sin(t * 5.7 + 1);
    g.save(); g.globalCompositeOperation = 'lighter'; glow(g, x, y, Math.max(w, h) * .55, '255,140,60', .07 + .05 * f); g.restore();
  }

  /* ---------- per scene ---------- */
  const NIGHT_GRASS = ['#06080e', '#0a0d16', '#080a12'], DAY_GRASS = ['#4f7a34', '#5e8a3c', '#3f6a2c', '#6f9a48'], WARM_LEAVES = ['#c8763a', '#d8a040', '#a8502e', '#e0b858'];
  const X = {
    ruins(g, w, h, t) { shootingStar(g, w, h, t, { period: 6, maxY: .22 }); bats(g, w, h, t, { n: 4, y: .12, dy: .22, size: 6 }); owl(g, w * .155, h * .275, 1.1, t); fog(g, w, h, t, { y: .63, n: 6, a: .14, rgb: '160,150,210' }); grassEdge(g, w, h, t, { cols: NIGHT_GRASS, h: .08, edges: true, n: 60 }) },
    ancient(g, w, h, t) { spirits(g, w * .5, h * .53, h * .2, t); leaves(g, w, h, t, { n: 8, cols: ['rgba(150,120,90,.5)', 'rgba(120,100,80,.45)'], size: 1.6, seed: 9 }); fog(g, w, h, t, { y: .92, n: 4, a: .1, rgb: '200,170,120' }) },
    deepwood(g, w, h, t) { fog(g, w, h, t, { y: .64, n: 7, a: .2, rgb: '150,200,190', speed: 5 }); leaves(g, w, h, t, { n: 9, cols: ['#1e3a2a', '#2a4a30', '#183022'], size: 4 }); branches(g, w, h, t, { col: '#04070a' }); grassEdge(g, w, h, t, { cols: NIGHT_GRASS, h: .12, edges: true, n: 80 }) },
    crystals(g, w, h, t) { aurora(g, w, h, t); shootingStar(g, w, h, t, { period: 8, offset: .4, maxY: .14 }); fog(g, w, h, t, { y: .75, n: 6, a: .1, rgb: '170,160,240', add: true }) },
    journey(g, w, h, t) { compass(g, w * .93, h * .86, h * .07, t); flock(g, w, h, t, { y: .22, n: 4, size: 4, period: 20, col: 'rgba(60,40,30,.7)' }); cloudShadows(g, w, h, t, { y0: .3, y1: .8 }) },
    settle(g, w, h, t) { flock(g, w, h, t, { y: .2, n: 6, period: 24, col: 'rgba(60,60,70,.6)' }); sheep(g, w * .14, h * .79, 1.3, t, 1); sheep(g, w * .22, h * .83, 1.4, t, 2, true); sheep(g, w * .9, h * .8, 1.3, t, 3, true); butterflies(g, w, h, t, { n: 3, x0: .3, x1: .8, y0: .72, y1: .85 }); grassEdge(g, w, h, t, { cols: DAY_GRASS, h: .07, n: 90 }) },
    kin(g, w, h, t) { flock(g, w, h, t, { y: .16, n: 5, period: 28, dir: -1, col: 'rgba(60,60,70,.55)' }); butterflies(g, w, h, t, { n: 4, x0: .05, x1: .95, y0: .78, y1: .9, size: 3.5 }); cloudShadows(g, w, h, t, { y0: .7, y1: .9 }); grassEdge(g, w, h, t, { cols: DAY_GRASS, h: .08, n: 100 }) },
    towns(g, w, h, t) { flock(g, w, h, t, { y: .14, n: 6, period: 22, col: 'rgba(60,60,70,.6)' }); chicken(g, w * .05, h * .93, 1.5, t, 1); chicken(g, w * .1, h * .95, 1.4, t, 2, true); chicken(g, w * .95, h * .92, 1.5, t, 3, true); butterflies(g, w, h, t, { n: 3, x0: .2, x1: .9, y0: .84, y1: .94 }); cloudShadows(g, w, h, t, { y0: .78, y1: .95 }) },
    riverCity(g, w, h, t) { glints(g, w, h, t, { n: 30, x0: 0, x1: 1, y0: .49, y1: .55 }); fishJump(g, w, h, t, { x0: .1, x1: .9, y: .53, n: 3 }); flock(g, w, h, t, { y: .3, n: 4, size: 5, period: 18, dir: -1, col: 'rgba(250,250,245,.9)' }); butterflies(g, w, h, t, { n: 3, x0: .05, x1: .95, y0: .8, y1: .92 }) },
    dig(g, w, h, t) { lanternSwing(g, w * .12, 0, h * .22, t); drips(g, w, h, t, { spots: [[.3, .08, .82, 0], [.72, .12, .8, .45], [.88, .05, .86, .7]] }); fog(g, w, h, t, { y: .9, n: 4, a: .12, rgb: '160,150,140' }) },
    temple(g, w, h, t) { skyLanterns(g, w, h, t, { n: 8, x0: .05, x1: .95, y0: .7, rise: .65 }); shootingStar(g, w, h, t, { period: 9, offset: .2, maxY: .15 }); for (const [fx, i] of [[.36, 0], [.5, 1], [.64, 2]]) smokeRibbon(g, w * fx, h * .72, t, i, h * .18) },
    shrines(g, w, h, t) { warmFlicker(g, w, h, t, w * .42, h * .62); sparksUp(g, w * .44, h * .6, t, { n: 18, spread: w * .08, rise: h * .3 }); cat(g, w * .74, h * .87, 2.6, t) },
    journal(g, w, h, t) { fog(g, w, h, t, { y: .8, n: 8, a: .16, rgb: '120,110,170', speed: 6 }); bats(g, w, h, t, { n: 5, y: .1, dy: .2, size: 5, seed: 3 }); shootingStar(g, w, h, t, { period: 10, offset: .6, maxY: .12 }) },
    roadOut(g, w, h, t) { flock(g, w, h, t, { y: .18, n: 6, period: 25, dir: -1, col: 'rgba(60,60,70,.6)' }); butterflies(g, w, h, t, { n: 3, x0: .05, x1: .5, y0: .8, y1: .92 }); cloudShadows(g, w, h, t, { y0: .6, y1: .9 }); grassEdge(g, w, h, t, { cols: DAY_GRASS, h: .08, edges: true, n: 80 }) },
    fernvale(g, w, h, t) { kite(g, w * .28, h * .3, 9, t); sheep(g, w * .06, h * .78, 1.3, t, 4); sheep(g, w * .14, h * .82, 1.2, t, 5, true); glints(g, w, h, t, { n: 18, x0: .62, x1: .98, y0: .72, y1: .95, seed: 5 }); butterflies(g, w, h, t, { n: 3, x0: .05, x1: .35, y0: .82, y1: .93 }); leaves(g, w, h, t, { n: 7, cols: ['#f2b8c8', '#f8d8e0', '#ffffff'], size: 2.5, seed: 4 }) },
    dawn(g, w, h, t) { flock(g, w, h, t, { y: .17, n: 7, period: 22, col: 'rgba(50,40,50,.6)' }); fog(g, w, h, t, { y: .6, n: 6, a: .16, rgb: '255,230,210', add: true, speed: 6 }); butterflies(g, w, h, t, { n: 4, x0: .05, x1: .95, y0: .82, y1: .92, hues: [45, 30, 200, 55] }); glints(g, w, h, t, { n: 22, x0: 0, x1: 1, y0: .85, y1: .99, seed: 7 }) },
    orb(g, w, h, t) { fog(g, w, h, t, { y: .6, n: 6, a: .16, rgb: '255,230,200', add: true, speed: 6 }); butterflies(g, w, h, t, { n: 4, x0: .05, x1: .95, y0: .82, y1: .92, hues: [45, 30, 200, 55] }); glints(g, w, h, t, { n: 22, x0: 0, x1: 1, y0: .85, y1: .99, seed: 7 }) },
    homeMorning(g, w, h, t) { curtain(g, w * .825, h * .13, w * .05, h * .34, t); sparrow(g, w * .69, h * .455, 1.4, t); glints(g, w, h, t, { n: 10, x0: .5, x1: .8, y0: .45, y1: .9, seed: 11 }) }
  };
  X.treeline = X.deepwood;
  root.SceneExtras = X;
})(globalThis);
