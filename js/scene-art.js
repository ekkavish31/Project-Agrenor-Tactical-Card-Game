/* v95.02 · Animated story scenes drawn in code (canvas), built to act out what the narration says — no scene images needed.
   SceneArt.create(canvas) → player { show(name, opts), stop(), size() } · crossfades between scenes.
   Scenes:
   • ancient  — "the world is older than anyone remembers": night, broken pillars on the surface, the camera sinks below ground
                past roots and rock layers to a buried rune gate that wakes; glyphs drift up through the earth like an old chant.
   • elements — "their heirs split along the elements, built kingdoms, forgot": one light splits into nine element streams,
                cities rise where each stream lands, then the streams fade and mist rolls over (forgetting).
   • fernvale — "a small village in the Navelmidia basin, near the big city": a river valley, Fernvale's houses with chimney smoke and
                a windmill, the big city on the horizon, a messenger bird flying from the city to the village.
   • festival — "three days to the harvest festival … this year will be different": dusk, bunting and lanterns lighting one by one,
                wheat and pumpkins; then the golden orb appears in the sky, the wind rises and crows fly off.
   • dawn / orb — Fernvale at sunrise (the opening cutscene); 'orb' adds the golden orb hanging over the horizon.
   Used by js/title-screen.js (New Game prologue, PROLOGUE[].art) and js/story-fx.js (scene/line `art:`). */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const ease = k => { k = clamp(k); return k * k * (3 - 2 * k) };
  function rng(seed) { let a = seed >>> 0 || 1; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
  function sky(g, w, h, stops) { const gr = g.createLinearGradient(0, 0, 0, h); for (const [k, c] of stops) gr.addColorStop(k, c); g.fillStyle = gr; g.fillRect(0, 0, w, h) }
  function glow(g, x, y, r, col, a = 1) { if (r <= 0 || a <= 0) return; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col(a)); gr.addColorStop(.35, col(a * .45)); gr.addColorStop(1, col(0)); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill() }
  const hsla = (hh, s, l) => a => `hsla(${hh},${s}%,${l}%,${a})`;
  /* a ridge line across the screen: y(x) from layered sines */
  function ridge(g, w, h, base, amp, seed, color, bottom = h) {
    const r = rng(seed), f = [r() * 3 + 1.5, r() * 7 + 4, r() * 15 + 9], p = [r() * TAU, r() * TAU, r() * TAU];
    g.fillStyle = color; g.beginPath(); g.moveTo(0, bottom);
    for (let x = 0; x <= w + 8; x += 8) { const u = x / w; g.lineTo(x, base - amp * (Math.sin(u * f[0] + p[0]) * .55 + Math.sin(u * f[1] + p[1]) * .3 + Math.sin(u * f[2] + p[2]) * .15)) }
    g.lineTo(w, bottom); g.closePath(); g.fill();
  }
  function ridgeY(w, base, amp, seed, x) { const r = rng(seed), f = [r() * 3 + 1.5, r() * 7 + 4, r() * 15 + 9], p = [r() * TAU, r() * TAU, r() * TAU], u = x / w; return base - amp * (Math.sin(u * f[0] + p[0]) * .55 + Math.sin(u * f[1] + p[1]) * .3 + Math.sin(u * f[2] + p[2]) * .15) }
  function stars(g, w, h, t, n, seed, maxY, a0 = 1) {
    const r = rng(seed); for (let i = 0; i < n; i++) { const x = r() * w, y = r() * maxY, s = r() * 1.4 + .3, tw = r() * TAU, a = (.35 + .65 * (.5 + .5 * Math.sin(t * (1 + r() * 2) + tw))) * a0; g.fillStyle = `rgba(235,240,255,${a})`; g.fillRect(x, y, s, s) }
  }
  function cloud(g, x, y, s, col) { g.fillStyle = col; g.beginPath(); for (const [dx, dy, r] of [[0, 0, 1], [.9, .15, .75], [-.9, .2, .7], [.4, -.35, .7], [-.35, -.3, .6], [1.6, .3, .5], [-1.6, .3, .5]]) { g.moveTo(x + dx * s + r * s, y + dy * s); g.arc(x + dx * s, y + dy * s, r * s, 0, TAU) } g.fill() }
  function smoke(g, x, y, t, s, seed, col = [220, 220, 225]) {
    for (let k = 0; k < 7; k++) { const ph = (t * .22 + k / 7 + seed * .13) % 1, yy = y - ph * 70 * s, xx = x + Math.sin(ph * 5 + seed + t * .6) * 9 * s * ph + ph * 14 * s, r = (3 + ph * 11) * s;
      g.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${.32 * (1 - ph) * Math.min(1, ph * 6)})`; g.beginPath(); g.arc(xx, yy, r, 0, TAU); g.fill() }
  }
  function house(g, x, y, s, o) { // x,y = bottom centre
    const ww = 26 * s * (o.wide || 1), wh = 18 * s, rh = 14 * s;
    g.fillStyle = o.wall; g.fillRect(x - ww / 2, y - wh, ww, wh);
    g.fillStyle = o.shade || 'rgba(0,0,0,.18)'; g.fillRect(x + ww * .12, y - wh, ww * .38, wh);
    g.fillStyle = o.roof; g.beginPath(); g.moveTo(x - ww / 2 - 3 * s, y - wh + 1); g.lineTo(x, y - wh - rh); g.lineTo(x + ww / 2 + 3 * s, y - wh + 1); g.closePath(); g.fill();
    if (o.chimney) { g.fillStyle = o.roofDark || '#5a3a2a'; g.fillRect(x + ww * .2, y - wh - rh * .85, 4 * s, 9 * s) }
    g.fillStyle = o.win || '#3a2a1a'; g.fillRect(x - ww * .32, y - wh * .68, 5 * s, 5 * s); g.fillRect(x + ww * .14, y - wh * .68, 5 * s, 5 * s);
    g.fillStyle = o.door || '#4a2e1a'; g.fillRect(x - 3 * s, y - 9 * s, 6 * s, 9 * s);
    return { cx: x + ww * .2 + 2 * s, cy: y - wh - rh * .85 };
  }
  function rune(g, x, y, s, seed) { const r = rng(seed); g.beginPath(); const n = 2 + Math.floor(r() * 3); g.moveTo(x, y - s); g.lineTo(x, y + s); for (let i = 0; i < n; i++) { const a = (r() - .5) * 2, b = (r() - .5) * 2; g.moveTo(x, y + (r() - .5) * s * 1.4); g.lineTo(x + a * s * .9, y + b * s * .9) } g.stroke() }
  const ELEMENTS = [ // Kaelam (js/elements.js): Elu light · Sylfae wind · Dephor water · Caelim lightning · Fren fire · Lutha plant · Yalm ice · Nytha night · Grat earth
    { h: 50, s: 95, l: 78, kind: 'spire' }, { h: 150, s: 60, l: 72, kind: 'tower' }, { h: 205, s: 85, l: 60, kind: 'dome' }, { h: 268, s: 85, l: 72, kind: 'spire' },
    { h: 16, s: 95, l: 58, kind: 'tower' }, { h: 105, s: 60, l: 52, kind: 'dome' }, { h: 192, s: 80, l: 82, kind: 'spire' }, { h: 250, s: 50, l: 48, kind: 'tower' }, { h: 32, s: 55, l: 48, kind: 'dome' }];

  /* ---------------- 1 · ancient ---------------- */
  function ancient(g, w, h, t) {
    const cam = ease(t / 9) * h * .26, hz = h * .42 - cam;
    sky(g, w, h, [[0, '#04060f'], [.35, '#0b1430'], [.62, '#1b2748'], [1, '#1b2748']]);
    stars(g, w, h, t, 160, 11, Math.max(10, hz - 10));
    // moon
    const mx = w * .8, my = h * .14 - cam * .4; glow(g, mx, my, h * .12, hsla(210, 60, 85), .25); g.fillStyle = '#e8eef8'; g.beginPath(); g.arc(mx, my, h * .028, 0, TAU); g.fill(); g.fillStyle = '#0b1430'; g.beginPath(); g.arc(mx + h * .012, my - h * .006, h * .025, 0, TAU); g.fill();
    // earth layers
    const bands = ['#16100c', '#1d1510', '#140f0b', '#100c09', '#0c0907'];
    bands.forEach((c, i) => ridge(g, w, h + cam, hz + 6 + i * h * .16, 10 + i * 4, 30 + i, c, h + 10));
    // roots
    g.strokeStyle = 'rgba(70,50,32,.8)'; g.lineCap = 'round';
    const r = rng(5);
    for (let i = 0; i < 9; i++) { const x = r() * w, y = hz + 4, len = h * (.12 + r() * .2); g.lineWidth = 2 + r() * 2; g.beginPath(); g.moveTo(x, y); g.bezierCurveTo(x + (r() - .5) * 60, y + len * .4, x + (r() - .5) * 90, y + len * .7, x + (r() - .5) * 120, y + len); g.stroke() }
    // buried statues / columns (faint outlines)
    g.strokeStyle = 'rgba(200,170,110,.18)'; g.lineWidth = 1.5;
    for (const [fx, fy, sw, sh] of [[.18, .3, 26, 70], [.82, .36, 30, 60], [.3, .58, 18, 44], [.7, .62, 22, 50]]) { const x = w * fx, y = hz + h * fy; g.strokeRect(x - sw / 2, y - sh / 2, sw, sh); g.beginPath(); g.arc(x, y - sh / 2 - 8, 9, 0, TAU); g.stroke() }
    // the gate
    const gx = w * .5, gy = hz + h * .35, R = h * .16, wake = ease((t - 1.5) / 4), pulse = .55 + .25 * Math.sin(t * 2.2);
    glow(g, gx, gy, R * 2.2, hsla(44, 90, 60), .22 * wake * pulse);
    g.save(); g.lineCap = 'round';
    const draw = (lw, a) => {
      g.lineWidth = lw; g.strokeStyle = `hsla(44,90%,${62 + 18 * pulse}%,${a})`;
      for (const k of [1, .78, .5]) { const len = TAU * R * k; g.setLineDash([len * wake, len]); g.beginPath(); g.arc(gx, gy, R * k, -Math.PI / 2, TAU - Math.PI / 2); g.stroke() }
      g.setLineDash([]);
      for (let i = 0; i < 9; i++) { const a0 = i / 9 * TAU - Math.PI / 2, pr = clamp(wake * 9 - i); if (pr <= 0) continue; g.beginPath(); g.moveTo(gx + Math.cos(a0) * R * .5, gy + Math.sin(a0) * R * .5); g.lineTo(gx + Math.cos(a0) * R * lerp(.5, 1, pr), gy + Math.sin(a0) * R * lerp(.5, 1, pr)); g.stroke() }
      g.beginPath(); for (let i = 0; i < 3; i++) { const a0 = i / 3 * TAU - Math.PI / 2 + t * .15; g[i ? 'lineTo' : 'moveTo'](gx + Math.cos(a0) * R * .42, gy + Math.sin(a0) * R * .42) } g.closePath(); g.stroke();
    };
    draw(7, .12 * wake); draw(2, .85 * wake);
    // glyphs on the ring
    g.lineWidth = 1.4; g.strokeStyle = `hsla(44,95%,80%,${.8 * wake})`;
    for (let i = 0; i < 18; i++) { const a0 = i / 18 * TAU + .17; if (clamp(wake * 18 - i) <= 0) continue; rune(g, gx + Math.cos(a0) * R * .64, gy + Math.sin(a0) * R * .64, 5, 100 + i) }
    g.restore();
    // chant rings
    for (let k = 0; k < 3; k++) { const ph = ((t - 2) / 3.2 + k / 3) % 1; if (t < 2 || ph < 0) continue; g.strokeStyle = `hsla(44,90%,70%,${(1 - ph) * .28 * wake})`; g.lineWidth = 1.5; g.beginPath(); g.ellipse(gx, gy, R * (1 + ph * 2.4), R * (1 + ph * 2.4) * .55, 0, 0, TAU); g.stroke() }
    // glyphs rising through the earth like an old chant
    const q = rng(77);
    for (let i = 0; i < 26; i++) { const per = 6 + q() * 4, off = q() * per, ph = ((t - 2.5 + off) % per) / per, sx = gx + (q() - .5) * R * 1.6, drift = q() * TAU;
      if (t < 2.5) continue; const y = lerp(gy, -20, ph), x = sx + Math.sin(ph * 6 + drift) * 30, a = Math.sin(ph * Math.PI) * .85 * wake;
      g.strokeStyle = `hsla(${y < hz ? 200 : 44},80%,80%,${a})`; g.lineWidth = 1.2; rune(g, x, y, 4 + q() * 3, 300 + i); glow(g, x, y, 10, hsla(44, 90, 70), a * .3) }
    // surface: broken pillars, a fallen arch, dead trees (silhouettes)
    g.fillStyle = '#05070c'; ridge(g, w, h, hz + 6, 7, 3, '#05070c', hz + 14);
    for (const [fx, ph, br] of [[.1, 70, 1], [.16, 46, .6], [.6, 88, 1], [.66, 54, .4], [.9, 64, .8]]) { const x = w * fx, y = ridgeY(w, hz + 6, 7, 3, x); g.fillRect(x - 9, y - ph, 18, ph); g.fillRect(x - 13, y - ph - 6, 26, 7); if (br < 1) { g.beginPath(); g.moveTo(x - 9, y - ph); g.lineTo(x - 2, y - ph - 10); g.lineTo(x + 4, y - ph - 3); g.lineTo(x + 9, y - ph - 12); g.lineTo(x + 9, y - ph); g.fill() } }
    { const x = w * .4, y = ridgeY(w, hz + 6, 7, 3, x); g.fillRect(x - 60, y - 52, 14, 52); g.beginPath(); g.arc(x - 20, y - 52, 40, Math.PI, Math.PI * 1.55); g.lineTo(x - 20 + Math.cos(Math.PI * 1.55) * 26, y - 52 + Math.sin(Math.PI * 1.55) * 26); g.arc(x - 20, y - 52, 26, Math.PI * 1.55, Math.PI, true); g.fill(); g.save(); g.translate(x + 30, y - 6); g.rotate(-.12); g.fillRect(-40, -8, 80, 10); g.restore() }
    for (const fx of [.26, .78, .97]) { const x = w * fx, y = ridgeY(w, hz + 6, 7, 3, x); g.strokeStyle = '#05070c'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 60); g.moveTo(x, y - 36); g.lineTo(x - 18, y - 56); g.moveTo(x, y - 46); g.lineTo(x + 16, y - 70); g.stroke() }
  }

  /* ---------------- 2 · elements ---------------- */
  function elements(g, w, h, t) {
    const hz = h * .64, C = { x: w * .5, y: h * .24 }, fade = ease((t - 7) / 3);
    sky(g, w, h, [[0, '#0d0b22'], [.45, '#2b2347'], [.64, '#7a4a52'], [.66, '#7a4a52'], [1, '#1a1220']]);
    stars(g, w, h, t, 70, 21, hz * .6, .7);
    ridge(g, w, h, hz - h * .05, h * .05, 41, '#2a2036', hz + 30);
    // core light
    const grow = ease(t / 1.6), pulse = .8 + .2 * Math.sin(t * 3), coreA = lerp(1, .25, fade);
    glow(g, C.x, C.y, h * .32 * grow, hsla(45, 100, 80), .5 * pulse * coreA);
    glow(g, C.x, C.y, h * .07 * grow, hsla(50, 100, 95), 1 * coreA);
    // nine streams
    const ends = ELEMENTS.map((e, i) => ({ x: w * (.07 + .86 * i / 8), y: hz - 2 }));
    ELEMENTS.forEach((e, i) => {
      const E = ends[i], cx = lerp(C.x, E.x, .55) + (E.x - C.x) * .25, cy = C.y - h * .1 + Math.abs(E.x - C.x) / w * h * .2, p = ease((t - 1.6 - Math.abs(i - 4) * .18) / 2.2);
      if (p <= 0) return; const pts = []; for (let k = 0; k <= 40 * p; k++) { const u = k / 40; pts.push({ x: (1 - u) * (1 - u) * C.x + 2 * (1 - u) * u * cx + u * u * E.x, y: (1 - u) * (1 - u) * C.y + 2 * (1 - u) * u * cy + u * u * E.y }) }
      const a = lerp(1, .12, fade), col = `hsla(${e.h},${e.s}%,${e.l}%,`;
      for (const [lw, aa] of [[10, .12], [4, .35], [1.6, .95]]) { g.strokeStyle = col + a * aa + ')'; g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); pts.forEach((q, k) => g[k ? 'lineTo' : 'moveTo'](q.x, q.y)); g.stroke() }
      for (let k = 0; k < 4; k++) { const u = ((t * .35 + k / 4 + i * .07) % 1) * p, x = (1 - u) * (1 - u) * C.x + 2 * (1 - u) * u * cx + u * u * E.x, y = (1 - u) * (1 - u) * C.y + 2 * (1 - u) * u * cy + u * u * E.y; glow(g, x, y, 7, hsla(e.h, e.s, 85), a) }
      if (p >= 1) glow(g, E.x, E.y, 26, hsla(e.h, e.s, e.l), a * .6);
    });
    // cities rise where each stream lands
    const r = rng(8);
    ELEMENTS.forEach((e, i) => {
      const E = ends[i], up = ease((t - 3.4 - Math.abs(i - 4) * .15) / 1.8); if (up <= 0) return;
      const n = 3 + Math.floor(r() * 3), lit = lerp(1, .35, fade);
      for (let k = 0; k < n; k++) {
        const bx = E.x + (k - (n - 1) / 2) * 13, bh = (18 + r() * 34) * up * (k === Math.floor(n / 2) ? 1.5 : 1), bw = 10 + r() * 5;
        g.fillStyle = '#140e1c'; g.fillRect(bx - bw / 2, E.y - bh, bw, bh);
        if (e.kind === 'dome' && k === Math.floor(n / 2)) { g.beginPath(); g.arc(bx, E.y - bh, bw * .7, Math.PI, 0); g.fill() }
        if (e.kind === 'spire') { g.beginPath(); g.moveTo(bx - bw / 2, E.y - bh); g.lineTo(bx, E.y - bh - 14 * up); g.lineTo(bx + bw / 2, E.y - bh); g.fill() }
        if (e.kind === 'tower') g.fillRect(bx - bw / 2 - 2, E.y - bh - 3, bw + 4, 3);
        g.fillStyle = `hsla(${e.h},${e.s}%,70%,${.8 * lit * up})`; for (let yy = E.y - bh + 6; yy < E.y - 4; yy += 8) if (r() < .55) g.fillRect(bx - 2, yy, 3, 3);
      }
    });
    // foreground plain
    const gr = g.createLinearGradient(0, hz, 0, h); gr.addColorStop(0, '#1a1424'); gr.addColorStop(1, '#07050a'); g.fillStyle = gr; g.fillRect(0, hz, w, h - hz);
    // the mist of forgetting
    if (fade > 0) for (let k = 0; k < 6; k++) { const x = ((k / 6 + t * .015) % 1.3 - .15) * w; glow(g, x, hz - 10, w * .22, hsla(260, 20, 70), .22 * fade) }
  }

  /* ---------------- 3 · fernvale ---------------- */
  function fernvale(g, w, h, t) {
    const z = 1 + .1 * ease(t / 12), fx = w * .34, fy = h * .54;
    g.save(); g.translate(fx, fy); g.scale(z, z); g.translate(-fx, -fy);
    sky(g, w, h, [[0, '#5f97c9'], [.42, '#a9cbe0'], [.52, '#f2dcae'], [1, '#f2dcae']]);
    glow(g, w * .86, h * .1, h * .5, hsla(42, 100, 85), .5);
    for (let i = 0; i < 6; i++) { const x = ((i * .23 + t * .006 * (1 + i % 3)) % 1.3 - .15) * w, y = h * (.08 + (i % 3) * .07); cloud(g, x, y, 18 + (i % 3) * 6, 'rgba(255,255,255,.75)') }
    ridge(g, w, h, h * .46, h * .06, 61, '#8ea3bd');
    // the big city on the horizon
    const cx = w * .8, cy = ridgeY(w, h * .46, h * .06, 61, w * .8) + 4, r = rng(4);
    g.fillStyle = '#7c8aa3'; g.fillRect(cx - 80, cy - 14, 160, 14);
    for (let i = 0; i < 14; i++) { const x = cx - 74 + i * 11 + r() * 4, th = 16 + r() * 34; g.fillRect(x, cy - 14 - th, 8, th); if (r() < .5) { g.beginPath(); g.moveTo(x - 1, cy - 14 - th); g.lineTo(x + 4, cy - 26 - th); g.lineTo(x + 9, cy - 14 - th); g.fill() } }
    g.fillRect(cx - 6, cy - 84, 12, 70); g.beginPath(); g.moveTo(cx - 8, cy - 84); g.lineTo(cx, cy - 104); g.lineTo(cx + 8, cy - 84); g.fill();
    g.strokeStyle = '#7c8aa3'; g.lineWidth = 1; g.beginPath(); g.moveTo(cx, cy - 104); g.lineTo(cx, cy - 116); g.stroke();
    g.fillStyle = '#c0504a'; g.beginPath(); g.moveTo(cx, cy - 116); g.quadraticCurveTo(cx + 7, cy - 116 + Math.sin(t * 4) * 2, cx + 13, cy - 113 + Math.sin(t * 4 + 1) * 2); g.lineTo(cx, cy - 110); g.fill();
    glow(g, cx, cy - 30, 120, hsla(40, 60, 90), .25);
    // hills
    ridge(g, w, h, h * .52, h * .05, 62, '#86ad62'); ridge(g, w, h, h * .62, h * .06, 63, '#6f9a4e');
    // river
    const P = u => ({ x: lerp(w * .02, w * 1.05, u) + Math.sin(u * 7.5) * w * .07, y: lerp(h * .5, h * 1.02, u * u * .9 + u * .1) });
    for (let k = 0; k <= 80; k++) { const u = k / 80, p = P(u); g.fillStyle = '#4f93c6'; g.beginPath(); g.ellipse(p.x, p.y, 3 + u * 42, 1.5 + u * 12, 0, 0, TAU); g.fill() }
    g.strokeStyle = 'rgba(230,245,255,.7)'; g.lineWidth = 1.5; g.setLineDash([6, 22]); g.lineDashOffset = -t * 40; g.beginPath(); for (let k = 0; k <= 80; k++) { const p = P(k / 80); g[k ? 'lineTo' : 'moveTo'](p.x, p.y) } g.stroke(); g.setLineDash([]);
    // fields
    const fr = rng(9), cols = ['#d4bb62', '#a6c65e', '#c2a252', '#93b850'];
    for (let i = 0; i < 9; i++) { const x = w * (.12 + fr() * .34), y = h * (.6 + fr() * .08), fw = 50 + fr() * 50, fh = 14 + fr() * 10; g.fillStyle = cols[i % 4]; g.beginPath(); g.moveTo(x, y); g.lineTo(x + fw, y - 6); g.lineTo(x + fw + 10, y + fh - 6); g.lineTo(x + 10, y + fh); g.fill(); g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 1; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x + k * 2.5, y + k * fh / 4); g.lineTo(x + fw + k * 2.5, y - 6 + k * fh / 4); g.stroke() } }
    // Fernvale
    const vx = w * .33, vy = h * .55, hr = rng(12), chims = [];
    const spots = [[-70, -8], [-38, -16], [-4, -10], [30, -18], [62, -6], [-56, 14], [-14, 10], [24, 14], [70, 18], [6, 30]];
    for (const [dx, dy] of spots.sort((a, b) => a[1] - b[1])) { const c = house(g, vx + dx, vy + dy, .9 + hr() * .25, { wall: hr() < .5 ? '#ecdcb4' : '#dcc89c', roof: hr() < .5 ? '#a4472e' : '#7d5a3a', chimney: hr() < .6, win: '#4a3a28', wide: .9 + hr() * .5 }); if (hr() < .6) chims.push(c) }
    chims.slice(0, 5).forEach((c, i) => smoke(g, c.cx, c.cy, t, .8, i));
    // windmill
    { const x = vx + 104, y = vy - 6; g.fillStyle = '#d8c8a0'; g.beginPath(); g.moveTo(x - 7, y); g.lineTo(x - 4, y - 34); g.lineTo(x + 4, y - 34); g.lineTo(x + 7, y); g.fill(); g.strokeStyle = '#6a4a2a'; g.lineWidth = 2.2; for (let k = 0; k < 4; k++) { const a = t * 1.2 + k * TAU / 4; g.beginPath(); g.moveTo(x, y - 34); g.lineTo(x + Math.cos(a) * 22, y - 34 + Math.sin(a) * 22); g.stroke() } }
    // tree on the square
    g.fillStyle = '#4f7a36'; g.beginPath(); g.arc(vx + 8, vy - 34, 12, 0, TAU); g.fill();
    // messenger bird: city → village
    { const per = 7, ph = (t % per) / per, x = lerp(cx - 30, vx + 20, ph), y = lerp(cy - 60, vy - 70, ph) - Math.sin(ph * Math.PI) * h * .12, f = Math.sin(t * 14) * 5; g.strokeStyle = '#2a2a30'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(x - 8, y - f); g.quadraticCurveTo(x - 3, y - 2, x, y); g.quadraticCurveTo(x + 3, y - 2, x + 8, y - f); g.stroke() }
    g.restore();
    // grass edge in front (outside the zoom)
    const gr = rng(14); g.strokeStyle = '#4c7a34'; g.lineWidth = 2;
    for (let i = 0; i < 90; i++) { const x = gr() * w, l = 14 + gr() * 22, sw = Math.sin(t * 1.6 + x * .02) * 5; g.beginPath(); g.moveTo(x, h + 2); g.quadraticCurveTo(x + sw * .5, h - l * .5, x + sw, h - l); g.stroke() }
  }

  /* ---------------- 4 · festival / dawn / orb ---------------- */
  function village(g, w, h, t, mode) {
    const dusk = mode === 'festival', orbAt = mode === 'orb' ? 0 : dusk ? 3.6 : 1e9, orbK = ease((t - orbAt) / 2.4), wind = 1 + orbK * 1.4, hz = h * .5;
    if (dusk) sky(g, w, h, [[0, '#1c1238'], [.35, '#5a2c52'], [.55, '#d0683e'], [.62, '#f0a050'], [1, '#f0a050']]);
    else sky(g, w, h, [[0, '#3a4a7a'], [.3, '#a68aa8'], [.52, '#f4b48a'], [.6, '#ffd9a0'], [1, '#ffd9a0']]);
    if (dusk) stars(g, w, h, t, 60, 31, h * .3, .5 + orbK * .3);
    // sun
    const sy = dusk ? hz + 10 : lerp(hz + 20, hz - h * .1, ease(t / 10)); glow(g, w * .3, sy, h * .45, hsla(dusk ? 20 : 38, 100, 70), .55); g.fillStyle = dusk ? '#ffb070' : '#ffe2a0'; g.beginPath(); g.arc(w * .3, sy, h * .045, 0, TAU); g.fill();
    // the golden orb
    if (orbK > 0) {
      const ox = w * .74, oy = h * .2 + Math.sin(t * .7) * 3, R = h * .034 * orbK, pu = .75 + .25 * Math.sin(t * 2.6);
      glow(g, ox, oy, h * .3 * orbK, hsla(46, 100, 70), .35 * pu);
      g.save(); g.translate(ox, oy); g.rotate(t * .12); g.strokeStyle = `hsla(48,100%,80%,${.25 * orbK})`; g.lineWidth = 1.5; for (let k = 0; k < 12; k++) { g.rotate(TAU / 12); g.beginPath(); g.moveTo(R * 1.6, 0); g.lineTo(R * (3 + (k % 3)), 0); g.stroke() } g.restore();
      glow(g, ox, oy, R * 2, hsla(50, 100, 92), 1); g.fillStyle = '#fff6d0'; g.beginPath(); g.arc(ox, oy, R * .8, 0, TAU); g.fill();
      const ph = (t * .35) % 1; g.strokeStyle = `hsla(46,100%,75%,${(1 - ph) * .4 * orbK})`; g.beginPath(); g.arc(ox, oy, R * (1.5 + ph * 7), 0, TAU); g.stroke();
      // crows leave
      for (let i = 0; i < 7; i++) { const st = orbAt + 1 + i * .25, k = clamp((t - st) / 6); if (k <= 0 || k >= 1) continue; const x = lerp(w * .62 + i * 14, -40 - i * 30, k), y = lerp(h * .44 - i * 8, h * .12 + i * 12, k), f = Math.sin(t * 13 + i) * 4; g.strokeStyle = '#1a1018'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x - 7, y - f); g.lineTo(x, y); g.lineTo(x + 7, y - f); g.stroke() }
    }
    // hills + mist
    ridge(g, w, h, hz - h * .04, h * .05, 71, dusk ? '#3a2240' : '#7a6a8a'); ridge(g, w, h, hz + h * .02, h * .03, 72, dusk ? '#2a1a2c' : '#5f7a5a');
    if (!dusk) for (let k = 0; k < 5; k++) glow(g, ((k / 5 + t * .01) % 1.2 - .1) * w, hz + 8, w * .2, hsla(30, 40, 95), .35 * (1 - ease(t / 12)));
    // houses
    const hr = rng(19), base = hz + h * .1, sil = dusk ? '#22162a' : '#5a4a48', chims = [];
    for (let i = 0; i < 11; i++) { const x = w * (i / 10) + (hr() - .5) * 30, s = 1.6 + hr() * .9; const c = house(g, x, base + hr() * 14, s, { wall: sil, roof: dusk ? '#180f1e' : '#4a3438', shade: 'rgba(0,0,0,.12)', chimney: hr() < .6, roofDark: sil, door: dusk ? '#1a1018' : '#3a2a28', win: dusk || mode === 'dawn' ? `rgba(255,${190 + 30 * Math.sin(t * 7 + i)},110,${dusk ? .75 + .25 * Math.sin(t * (3 + orbK * 6) + i * 2) : .5})` : '#2a1e1e' }); if (c && hr() < .7) chims.push(c) }
    chims.forEach((c, i) => smoke(g, c.cx, c.cy, t, 1.3, i, dusk ? [120, 100, 120] : [235, 225, 230]));
    // bunting + lanterns (festival dressing)
    const poleX = [0, .2, .4, .6, .8, 1].map(k => w * k), py = hz + h * .02;
    g.strokeStyle = '#2a1a1a'; g.lineWidth = 3; for (const x of poleX) { g.beginPath(); g.moveTo(x, base + 30); g.lineTo(x, py); g.stroke() }
    const flagCol = ['#d8483a', '#f0c050', '#3f8ad0', '#5aa84a', '#f0f0e0'];
    let li = 0;
    for (let s = 0; s < poleX.length - 1; s++) {
      const a = poleX[s], b = poleX[s + 1], sag = 26 + Math.sin(t * 1.3 * wind + s) * 3 * wind;
      const Y = u => py + Math.sin(u * Math.PI) * sag;
      g.strokeStyle = '#3a2a24'; g.lineWidth = 1.2; g.beginPath(); for (let k = 0; k <= 20; k++) { const u = k / 20; g[k ? 'lineTo' : 'moveTo'](lerp(a, b, u), Y(u)) } g.stroke();
      for (let k = 1; k < 10; k++) { const u = k / 10, x = lerp(a, b, u), y = Y(u), fl = Math.sin(t * 5 * wind + k + s * 3) * 3 * wind; g.fillStyle = flagCol[(k + s) % 5]; g.globalAlpha = dusk ? .75 : .9; g.beginPath(); g.moveTo(x - 6, y); g.lineTo(x + 6, y); g.lineTo(x + fl, y + 14); g.fill(); g.globalAlpha = 1 }
      if (dusk) for (const u of [.25, .5, .75]) { const x = lerp(a, b, u) + Math.sin(t * 2 * wind + li) * 2 * wind, y = Y(u) + 22, on = clamp((t - .6 - li * .22) / .5), fl = .8 + .2 * Math.sin(t * (9 + orbK * 10) + li * 3); li++;
        g.strokeStyle = '#3a2a24'; g.beginPath(); g.moveTo(x, Y(u)); g.lineTo(x, y - 8); g.stroke();
        glow(g, x, y, 34, hsla(36, 100, 65), .55 * on * fl); g.fillStyle = on > 0 ? `hsl(${28 + 10 * on},90%,${30 + 30 * on * fl}%)` : '#4a2a20'; g.beginPath(); g.ellipse(x, y, 7, 9, 0, 0, TAU); g.fill() }
    }
    // wheat + pumpkins in front
    const wr = rng(23);
    for (let i = 0; i < 160; i++) { const x = wr() * w, l = h * (.1 + wr() * .1), sw = Math.sin(t * 1.8 * wind + x * .015) * 8 * wind, y0 = h + 4; g.strokeStyle = dusk ? `rgba(${120 + wr() * 40},${80 + wr() * 30},40,1)` : `rgba(${200 + wr() * 40},${160 + wr() * 30},80,1)`; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y0); g.quadraticCurveTo(x + sw * .4, y0 - l * .5, x + sw, y0 - l); g.stroke(); g.fillStyle = g.strokeStyle; g.beginPath(); g.ellipse(x + sw, y0 - l, 2.2, 6, sw * .03, 0, TAU); g.fill() }
    for (const [fx, s] of [[.12, 1.2], [.2, .8], [.82, 1.4], [.9, .9], [.7, .7]]) { const x = w * fx, y = h - 18 * s, R = 22 * s; for (const [dx, k] of [[-.55, .7], [.55, .7], [0, 1]]) { g.fillStyle = dusk ? '#b8521e' : '#e8782a'; g.beginPath(); g.ellipse(x + dx * R, y, R * .55 * k + R * .2, R * .62, 0, 0, TAU); g.fill() } g.strokeStyle = 'rgba(80,30,10,.45)'; g.lineWidth = 1.5; for (const dx of [-.5, 0, .5]) { g.beginPath(); g.ellipse(x + dx * R * .7, y, R * .2, R * .6, 0, 0, TAU); g.stroke() } g.fillStyle = '#4a5a22'; g.fillRect(x - 2, y - R * .7, 4, R * .3) }
    // vignette (darker as the orb rises)
    const vg = g.createRadialGradient(w / 2, h * .45, h * .3, w / 2, h * .45, h * .95); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${.35 + orbK * .25})`); g.fillStyle = vg; g.fillRect(0, 0, w, h);
  }

  const SCENES = { ancient, elements, fernvale, festival: (g, w, h, t) => village(g, w, h, t, 'festival'), dawn: (g, w, h, t) => village(g, w, h, t, 'dawn'), orb: (g, w, h, t) => village(g, w, h, t, 'orb') };

  function create(canvas, opt = {}) {
    const g = canvas.getContext('2d'), buf = document.createElement('canvas'), bg = buf.getContext('2d');
    const reduced = () => opt.reduced ?? root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let cur = null, prev = null, raf = 0, w = 0, h = 0, d = 1;
    function size() { const r = canvas.getBoundingClientRect(); d = Math.min(2, root.devicePixelRatio || 1); w = Math.max(1, r.width); h = Math.max(1, r.height); canvas.width = buf.width = Math.round(w * d); canvas.height = buf.height = Math.round(h * d) }
    function paint(ctx, sc, now) { const t = reduced() ? 9 : (now - sc.start) / 1000; ctx.setTransform(d, 0, 0, d, 0, 0); ctx.globalAlpha = 1; try { SCENES[sc.name](ctx, w, h, t) } catch (e) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h) } }
    function frame(now) {
      raf = requestAnimationFrame(frame); if (!cur) return;
      const r = canvas.getBoundingClientRect(); if (Math.abs(r.width - w) > 1 || Math.abs(r.height - h) > 1) size();
      const k = prev ? clamp((now - cur.start) / 1200) : 1;
      if (prev && k < 1) { paint(g, prev, now); bg.setTransform(1, 0, 0, 1, 0, 0); bg.clearRect(0, 0, buf.width, buf.height); paint(bg, cur, now); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = ease(k); g.drawImage(buf, 0, 0); g.globalAlpha = 1 }
      else { prev = null; paint(g, cur, now) }
    }
    return {
      show(name, o = {}) { if (!SCENES[name]) return false; if (cur?.name === name && o.at == null) return true; if (!w) size(); const now = performance.now(); prev = o.at != null ? null : cur; cur = { name, start: now - (o.at || 0) * 1000 }; if (!raf) raf = requestAnimationFrame(frame); return true },
      stop() { cancelAnimationFrame(raf); raf = 0; cur = prev = null; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, canvas.width, canvas.height) },
      size, get scene() { return cur?.name || null }
    };
  }
  /* draw every scene once off screen so the first real frame does not pay for it (title-screen loader) */
  function warm() { return new Promise(r => { const c = document.createElement('canvas'); c.width = 480; c.height = 270; const g = c.getContext('2d'); const names = Object.keys(SCENES); let i = 0;
    const step = () => { if (i >= names.length) return r(true); try { SCENES[names[i]](g, 480, 270, 6) } catch (e) { } i++; requestAnimationFrame(step) }; step() }) }
  root.SceneArt = { create, warm, scenes: Object.keys(SCENES), has: n => !!SCENES[n] };
})(globalThis);
