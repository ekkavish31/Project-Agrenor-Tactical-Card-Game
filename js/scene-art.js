/* v95.02 · Animated story scenes drawn in code (canvas), built to act out what the narration says — no scene images needed.
   SceneArt.create(canvas) → player { show(name, opts), stop(), size() } · crossfades between scenes.
   Scenes:
   • ancient  — "the world is older than anyone remembers": night, broken pillars on the surface, the camera sinks below ground
                past roots and rock layers to a buried rune gate that wakes; glyphs drift up through the earth like an old chant.
   • heirs · journey · realms (v95.05) — light in the chests of the ancient people rises and takes an element's colour; the lights wind
                across a storybook map (snow, cliffs, storm peaks, volcano, sea, forest, mesa, shadow vale, bright plain); tents grow into towns, then kingdoms.
   • Every night/dusk sky has the purple moon (lore) and no sunset sun.
   • fernvale — "a small village in the Navelmidia basin, near the big city": a river valley, Fernvale's houses with chimney smoke and
                a windmill, the big city on the horizon, a messenger bird flying from the city to the village.
   • festival — "three days to the harvest festival": dusk, bunting and lanterns lighting one by one, wheat and pumpkins, Elukhor resting high.
   • kin · kingdoms · forgotten · faith · deepwood · hearth · elukhor · homeMorning (v95.04 prologue + opening cutscene).
   Elukhor ("ดวงทอง") is a calm, familiar natural light — never drawn as an omen.
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
  /* the purple moon (lore) — every night sky has it; no sunset sun in dusk/night scenes */
  function moon(g, x, y, r, t = 0) {
    glow(g, x, y, r * 9, hsla(275, 70, 62), .32); glow(g, x, y, r * 3.2, hsla(280, 80, 78), .45);
    const gr = g.createRadialGradient(x - r * .3, y - r * .3, r * .1, x, y, r); gr.addColorStop(0, '#f2e6ff'); gr.addColorStop(.55, '#c8a2f2'); gr.addColorStop(1, '#8a5ac8');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.fillStyle = 'rgba(110,60,170,.35)'; for (const [dx, dy, k] of [[-.3, .1, .22], [.25, -.25, .15], [.2, .35, .18], [-.1, -.45, .1]]) { g.beginPath(); g.arc(x + dx * r, y + dy * r, k * r, 0, TAU); g.fill() }
  }
  const ELEMENTS = [ // Kaelam (js/elements.js): Elu light · Sylfae wind · Dephor water · Caelim lightning · Fren fire · Lutha plant · Yalm ice · Nytha night · Grat earth
    { h: 50, s: 95, l: 78, kind: 'spire' }, { h: 150, s: 60, l: 72, kind: 'tower' }, { h: 205, s: 85, l: 60, kind: 'dome' }, { h: 268, s: 85, l: 72, kind: 'spire' },
    { h: 16, s: 95, l: 58, kind: 'tower' }, { h: 105, s: 60, l: 52, kind: 'dome' }, { h: 192, s: 80, l: 82, kind: 'spire' }, { h: 250, s: 50, l: 48, kind: 'tower' }, { h: 32, s: 55, l: 48, kind: 'dome' }];

  /* ---------------- 1 · ancient ---------------- */
  function ancient(g, w, h, t, surface) {
    const cam = surface ? 0 : ease(t / 9) * h * .26, hz = surface ? h * .56 : h * .42 - cam;
    sky(g, w, h, [[0, '#04060f'], [.35, '#0b1430'], [.62, '#1b2748'], [1, '#1b2748']]);
    stars(g, w, h, t, 160, 11, Math.max(10, hz - 10));
    // moon
    moon(g, w * .78, h * .16 - cam * .4, h * .055, t);
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
    const gx = w * .5, gy = hz + h * .35, R = h * .16, wake = surface ? 0 : ease((t - 1.5) / 4), pulse = .55 + .25 * Math.sin(t * 2.2);
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
      if (t < 2.5 || surface) continue; const y = lerp(gy, -20, ph), x = sx + Math.sin(ph * 6 + drift) * 30, a = Math.sin(ph * Math.PI) * .85 * wake;
      g.strokeStyle = `hsla(${y < hz ? 200 : 44},80%,80%,${a})`; g.lineWidth = 1.2; rune(g, x, y, 4 + q() * 3, 300 + i); glow(g, x, y, 10, hsla(44, 90, 70), a * .3) }
    // surface: broken pillars, a fallen arch, dead trees (silhouettes)
    g.fillStyle = '#05070c'; ridge(g, w, h, hz + 6, 7, 3, '#05070c', hz + 14);
    for (const [fx, ph, br] of [[.1, 70, 1], [.16, 46, .6], [.6, 88, 1], [.66, 54, .4], [.9, 64, .8]]) { const x = w * fx, y = ridgeY(w, hz + 6, 7, 3, x); g.fillRect(x - 9, y - ph, 18, ph); g.fillRect(x - 13, y - ph - 6, 26, 7); if (br < 1) { g.beginPath(); g.moveTo(x - 9, y - ph); g.lineTo(x - 2, y - ph - 10); g.lineTo(x + 4, y - ph - 3); g.lineTo(x + 9, y - ph - 12); g.lineTo(x + 9, y - ph); g.fill() } }
    { const x = w * .4, y = ridgeY(w, hz + 6, 7, 3, x); g.fillRect(x - 60, y - 52, 14, 52); g.beginPath(); g.arc(x - 20, y - 52, 40, Math.PI, Math.PI * 1.55); g.lineTo(x - 20 + Math.cos(Math.PI * 1.55) * 26, y - 52 + Math.sin(Math.PI * 1.55) * 26); g.arc(x - 20, y - 52, 26, Math.PI * 1.55, Math.PI, true); g.fill(); g.save(); g.translate(x + 30, y - 6); g.rotate(-.12); g.fillRect(-40, -8, 80, 10); g.restore() }
    for (const fx of [.26, .78, .97]) { const x = w * fx, y = ridgeY(w, hz + 6, 7, 3, x); g.strokeStyle = '#05070c'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 60); g.moveTo(x, y - 36); g.lineTo(x - 18, y - 56); g.moveTo(x, y - 46); g.lineTo(x + 16, y - 70); g.stroke() }
  }

  /* ---------------- 2 · heirs — light shines in the chests of the ancient people, rises, takes the colour of an element ---------------- */
  function nightSky(g, w, h, t, seed) { sky(g, w, h, [[0, '#07061a'], [.45, '#18143a'], [.62, '#2c2448'], [1, '#2c2448']]); stars(g, w, h, t, 130, seed, h * .55) }
  function heirs(g, w, h, t) {
    nightSky(g, w, h, t, 41); moon(g, w * .84, h * .13, h * .045, t);
    const hz = h * .62; ridge(g, w, h, hz - h * .03, h * .03, 42, '#1a1430', hz + 10);
    g.fillStyle = '#0a0812'; g.fillRect(0, hz, w, h - hz);
    const n = 9, fig = h * .3;
    for (let i = 0; i < n; i++) {
      const e = ELEMENTS[i], x = w * (.1 + .8 * i / (n - 1)), y = hz + Math.abs(i - 4) * -h * .012 + h * .02, ph = i * .4;
      const cy = y - fig * .62, beat = .75 + .25 * Math.sin(t * 2.4 + ph), on = ease((t - .3 - i * .08) / 1.6);
      const rise = ease((t - 2.6 - i * .12) / 2.2), col = ease((t - 4.6 - i * .15) / 1.8);
      // robed silhouette with a hood, lit from the chest
      glow(g, x, cy, fig * .55, hsla(45, 80, 80), .18 * on * beat);
      g.fillStyle = '#07060c'; g.beginPath(); g.moveTo(x - fig * .16, y); g.lineTo(x - fig * .09, y - fig * .7); g.quadraticCurveTo(x, y - fig * .98, x + fig * .09, y - fig * .7); g.lineTo(x + fig * .16, y); g.closePath(); g.fill();
      g.strokeStyle = `rgba(255,230,180,${.25 * on})`; g.lineWidth = 1.5; g.stroke();
      // the light in the chest
      glow(g, x, cy, fig * .1, hsla(48, 100, 92), on * beat);
      // it rises and finds its colour
      if (rise > 0) {
        const ox = x + Math.sin(t * .8 + ph) * 4 * rise, oy = lerp(cy, y - fig * 1.25, rise) + Math.sin(t * 1.3 + ph) * 3, hh = lerp(48, e.h, col), ss = lerp(100, e.s, col), ll = lerp(92, e.l + 8, col);
        g.strokeStyle = `hsla(${hh},${ss}%,${ll}%,${.35 * rise})`; g.lineWidth = 2; g.beginPath(); g.moveTo(x, cy); g.quadraticCurveTo(x + Math.sin(t + i) * 10, (cy + oy) / 2, ox, oy); g.stroke();
        glow(g, ox, oy, fig * .2 * (1 + col * .4), hsla(hh, ss, ll), .55 + .3 * col); g.fillStyle = `hsl(${hh},${ss}%,${Math.min(96, ll + 15)}%)`; g.beginPath(); g.arc(ox, oy, 4 + col * 2, 0, TAU); g.fill();
      }
    }
  }

  /* ---------------- journey / realms — a storybook map: lights wind through the regions, then towns grow into kingdoms ---------------- */
  const REGIONS = [ // element index · destination on the map (0..1) · what the land looks like
    { e: 6, x: .16, y: .14, kind: 'snow' }, { e: 1, x: .36, y: .1, kind: 'cliffs' }, { e: 3, x: .6, y: .1, kind: 'storm' }, { e: 4, x: .84, y: .16, kind: 'volcano' },
    { e: 2, x: .9, y: .4, kind: 'sea' }, { e: 5, x: .72, y: .52, kind: 'forest' }, { e: 8, x: .3, y: .5, kind: 'mesa' }, { e: 7, x: .08, y: .4, kind: 'shadow' }, { e: 0, x: .52, y: .3, kind: 'plain' }];
  const ORIGIN = { x: .5, y: .64 };
  function mapXY(w, h, x, y) { return { x: w * (.04 + x * .92), y: h * (.06 + y * .62) } }
  function pathOf(i, w, h) {
    const R = REGIONS[i], A = mapXY(w, h, ORIGIN.x, ORIGIN.y), B = mapXY(w, h, R.x, R.y), r = rng(900 + i), pts = [], k = 2 + Math.floor(r() * 3), amp = (r() - .5) * .35 + .15 * (r() < .5 ? -1 : 1), ph = r() * TAU;
    const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L;
    for (let j = 0; j <= 70; j++) { const u = j / 70, wig = Math.sin(u * Math.PI * k + ph) * amp * L * .35 * Math.sin(u * Math.PI) + Math.sin(u * 23 + ph) * 6 * Math.sin(u * Math.PI); pts.push({ x: A.x + dx * u + nx * wig, y: A.y + dy * u + ny * wig }) }
    return pts;
  }
  function drawMap(g, w, h, t) {
    sky(g, w, h, [[0, '#0e1a2e'], [1, '#08101c']]);
    // sea shimmer
    g.strokeStyle = 'rgba(140,180,220,.12)'; g.lineWidth = 1.2; for (let j = 0; j < 22; j++) { const y = h * (.05 + j * .04), o = (t * 12 + j * 37) % 60; g.setLineDash([16, 30]); g.lineDashOffset = -o; g.beginPath(); g.moveTo(0, y); g.lineTo(w, y + 6); g.stroke() } g.setLineDash([]);
    // the land (one big painted continent)
    const c = mapXY(w, h, .5, .38), rx = w * .47, ry = h * .36, lr = rng(31);
    const land = []; for (let j = 0; j < 64; j++) { const a = j / 64 * TAU, k = 1 + Math.sin(a * 3 + 1) * .06 + Math.sin(a * 7 + 2) * .04 + (lr() - .5) * .04; land.push({ x: c.x + Math.cos(a) * rx * k, y: c.y + Math.sin(a) * ry * k }) }
    const path = () => { g.beginPath(); land.forEach((p, j) => g[j ? 'lineTo' : 'moveTo'](p.x, p.y)); g.closePath() };
    path(); g.fillStyle = '#4e5a38'; g.fill(); g.lineWidth = 6; g.strokeStyle = 'rgba(220,200,150,.25)'; g.stroke();
    g.save(); path(); g.clip();
    const pg = g.createRadialGradient(c.x, c.y, 10, c.x, c.y, rx); pg.addColorStop(0, '#6a7448'); pg.addColorStop(1, '#3e4a30'); g.fillStyle = pg; g.fillRect(0, 0, w, h);
    // a desert band and a mountain range in the middle of the land (the long way round)
    g.fillStyle = 'rgba(214,180,110,.55)'; g.beginPath(); g.ellipse(w * .62, h * .43, w * .12, h * .06, -.2, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(150,110,60,.5)'; g.lineWidth = 1.5; for (let j = 0; j < 6; j++) { const x = w * (.54 + j * .03), y = h * (.41 + (j % 2) * .02); g.beginPath(); g.arc(x, y + 6, 10, Math.PI * 1.15, Math.PI * 1.85); g.stroke() }
    for (let j = 0; j < 9; j++) { const x = w * (.32 + j * .035), y = h * (.36 - Math.sin(j / 8 * Math.PI) * .03), s = 14 + (j % 3) * 6; g.fillStyle = '#3a3428'; g.beginPath(); g.moveTo(x - s, y + s * .6); g.lineTo(x, y - s * .8); g.lineTo(x + s, y + s * .6); g.fill(); g.fillStyle = 'rgba(230,230,240,.7)'; g.beginPath(); g.moveTo(x - s * .3, y - s * .4); g.lineTo(x, y - s * .8); g.lineTo(x + s * .3, y - s * .4); g.fill() }
    // a river
    g.strokeStyle = 'rgba(110,170,220,.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(w * .46, h * .2); g.bezierCurveTo(w * .4, h * .32, w * .52, h * .44, w * .46, h * .7); g.stroke();
    g.restore();
    // regions
    REGIONS.forEach((R, i) => { const p = mapXY(w, h, R.x, R.y), e = ELEMENTS[R.e]; region(g, p.x, p.y, R.kind, t, e) });
    // the place they all set out from
    const o = mapXY(w, h, ORIGIN.x, ORIGIN.y); glow(g, o.x, o.y, 40, hsla(48, 100, 85), .7);
    for (let j = -2; j <= 2; j++) { g.fillStyle = '#2a2418'; g.fillRect(o.x + j * 9 - 2, o.y - 14 + Math.abs(j) * 3, 4, 14 - Math.abs(j) * 3) }
    // edge fog + vignette (storybook frame)
    const vg = g.createRadialGradient(w / 2, h * .4, h * .35, w / 2, h * .4, h * .95); vg.addColorStop(0, 'rgba(8,10,20,0)'); vg.addColorStop(1, 'rgba(8,10,20,.75)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
  }
  function region(g, x, y, kind, t, e) {
    g.save();
    if (kind === 'snow') for (let j = 0; j < 4; j++) { const s = 18 + j * 4, xx = x - 30 + j * 18; g.fillStyle = '#c8d4e4'; g.beginPath(); g.moveTo(xx - s, y + 14); g.lineTo(xx, y - s); g.lineTo(xx + s, y + 14); g.fill() }
    if (kind === 'cliffs') { g.fillStyle = '#7a8a7a'; g.fillRect(x - 30, y - 18, 22, 32); g.fillRect(x + 4, y - 26, 26, 40); g.strokeStyle = 'rgba(220,255,240,.5)'; g.lineWidth = 1.5; for (let j = 0; j < 3; j++) { g.beginPath(); g.arc(x - 10 + j * 14 + Math.sin(t + j) * 4, y - 34, 6, 0, Math.PI * 1.5); g.stroke() } }
    if (kind === 'storm') { g.fillStyle = '#4a4a5a'; for (let j = 0; j < 3; j++) { g.beginPath(); g.moveTo(x - 30 + j * 22, y + 14); g.lineTo(x - 18 + j * 22, y - 22); g.lineTo(x - 6 + j * 22, y + 14); g.fill() } cloud(g, x, y - 34, 10, 'rgba(70,70,90,.9)'); if (Math.sin(t * 3.1) > .85) { g.strokeStyle = '#e8d8ff'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y - 30); g.lineTo(x - 5, y - 18); g.lineTo(x + 3, y - 16); g.lineTo(x - 3, y - 4); g.stroke() } }
    if (kind === 'volcano') { g.fillStyle = '#4a2a20'; g.beginPath(); g.moveTo(x - 34, y + 14); g.lineTo(x - 8, y - 24); g.lineTo(x + 8, y - 24); g.lineTo(x + 34, y + 14); g.fill(); glow(g, x, y - 24, 22, hsla(16, 100, 55), .8); smoke(g, x, y - 26, t, .9, 2, [90, 70, 70]) }
    if (kind === 'sea') { g.strokeStyle = 'rgba(160,210,250,.8)'; g.lineWidth = 2; for (let j = 0; j < 3; j++) { g.beginPath(); for (let k = 0; k <= 8; k++) { const xx = x - 36 + k * 9, yy = y - 8 + j * 9 + Math.sin(t * 2 + k + j) * 2.5; g[k ? 'lineTo' : 'moveTo'](xx, yy) } g.stroke() } }
    if (kind === 'forest') for (let j = 0; j < 7; j++) { const xx = x - 32 + (j % 4) * 20 + (j > 3 ? 10 : 0), yy = y - 6 + (j > 3 ? 12 : 0); g.fillStyle = j % 2 ? '#2f5a2a' : '#3a6a30'; g.beginPath(); g.arc(xx, yy - 10, 11, 0, TAU); g.fill() }
    if (kind === 'mesa') { g.fillStyle = '#8a5a34'; g.fillRect(x - 34, y - 14, 26, 26); g.fillRect(x + 2, y - 22, 30, 34); g.fillStyle = '#a06a40'; g.fillRect(x - 34, y - 14, 26, 5); g.fillRect(x + 2, y - 22, 30, 5) }
    if (kind === 'shadow') { glow(g, x, y, 40, hsla(260, 50, 30), .9); g.fillStyle = '#1a1428'; g.beginPath(); g.ellipse(x, y, 34, 14, 0, 0, TAU); g.fill(); for (let j = 0; j < 4; j++) glow(g, x - 20 + j * 13, y - 4 + Math.sin(t + j) * 3, 4, hsla(270, 80, 75), .7) }
    if (kind === 'plain') { g.fillStyle = 'rgba(240,230,190,.85)'; for (let j = 0; j < 5; j++) g.fillRect(x - 24 + j * 12, y - 8 - (j % 2) * 6, 4, 14 + (j % 2) * 6); glow(g, x, y - 6, 30, hsla(50, 100, 85), .4) }
    g.restore();
  }
  function comet(g, pts, p, e, a = 1) {
    const n = Math.max(1, Math.floor(p * (pts.length - 1))), col = (l, al) => `hsla(${e.h},${e.s}%,${l}%,${al})`;
    g.setLineDash([3, 6]); g.strokeStyle = col(e.l, .45 * a); g.lineWidth = 2; g.beginPath(); for (let j = 0; j <= n; j++) g[j ? 'lineTo' : 'moveTo'](pts[j].x, pts[j].y); g.stroke(); g.setLineDash([]);
    for (let j = Math.max(0, n - 10); j <= n; j++) { const k = (j - (n - 10)) / 10; glow(g, pts[j].x, pts[j].y, 6 + k * 6, hsla(e.h, e.s, Math.min(95, e.l + 20)), .35 * k * a) }
    return pts[n];
  }
  function journey(g, w, h, t) {
    drawMap(g, w, h, t);
    REGIONS.forEach((R, i) => { const e = ELEMENTS[R.e], p = ease((t - .6 - i * .35) / 5), pts = pathOf(i, w, h); if (p <= 0) return; const head = comet(g, pts, p, e);
      glow(g, head.x, head.y, p >= 1 ? 26 + 6 * Math.sin(t * 3 + i) : 16, hsla(e.h, e.s, Math.min(95, e.l + 20)), 1) });
  }
  function realms(g, w, h, t) {
    drawMap(g, w, h, t + 20);
    const pos = REGIONS.map(R => mapXY(w, h, R.x, R.y));
    REGIONS.forEach((R, i) => comet(g, pathOf(i, w, h), 1, ELEMENTS[R.e], .35));
    // trade roads between kingdoms (later)
    const roads = ease((t - 6.5) / 2.5);
    if (roads > 0) { g.strokeStyle = `rgba(240,220,160,${.45 * roads})`; g.lineWidth = 1.6; g.setLineDash([5, 5]); const order = [7, 0, 1, 8, 2, 3, 4, 5, 6, 7]; for (let k = 0; k < order.length - 1; k++) { const a = pos[order[k]], b = pos[order[k + 1]]; g.beginPath(); g.moveTo(a.x, a.y + 16); g.lineTo(lerp(a.x, b.x, roads), lerp(a.y, b.y, roads) + 16); g.stroke(); if (roads >= 1) { const u = (t * .15 + k * .37) % 1; glow(g, lerp(a.x, b.x, u), lerp(a.y, b.y, u) + 16, 4, hsla(45, 90, 80), .9) } } g.setLineDash([]) }
    // each settlement grows: tents → village → walled town → kingdom
    REGIONS.forEach((R, i) => { const e = ELEMENTS[R.e], p = pos[i], age = t - i * .22; settlement(g, p.x, p.y + 18, age, e, t) });
  }
  function settlement(g, x, y, age, e, t) {
    const roof = `hsl(${e.h},${Math.min(70, e.s)}%,${Math.max(30, e.l - 18)}%)`, wall = '#d8c8a8';
    if (age < 0) return;
    if (age < 2.2) { for (let j = 0; j < 3; j++) { const xx = x - 14 + j * 14, s = ease(age - j * .3); if (s <= 0) continue; g.fillStyle = roof; g.beginPath(); g.moveTo(xx - 7 * s, y); g.lineTo(xx, y - 12 * s); g.lineTo(xx + 7 * s, y); g.fill() } smoke(g, x, y - 6, t, .5, e.h); return }
    const town = ease((age - 4) / 1.6), king = ease((age - 6.4) / 1.8);
    const n = 3 + Math.round(town * 3); for (let j = 0; j < n; j++) house(g, x - (n - 1) * 7 + j * 14, y + (j % 2) * 3, .5, { wall, roof, chimney: false, win: '#4a3a28' });
    if (town > 0) { g.strokeStyle = `rgba(200,180,140,${town})`; g.lineWidth = 2.5; g.beginPath(); g.ellipse(x, y - 2, 32 * town + 10, 12 * town + 4, 0, 0, TAU); g.stroke() }
    if (king > 0) { const H = 34 * king; g.fillStyle = '#c8b898'; g.fillRect(x - 8, y - 10 - H, 16, H); g.fillRect(x - 20, y - 6 - H * .6, 9, H * .6); g.fillRect(x + 11, y - 6 - H * .6, 9, H * .6);
      g.fillStyle = roof; for (const [cx, top, wdt] of [[x, y - 10 - H, 10], [x - 15.5, y - 6 - H * .6, 6], [x + 15.5, y - 6 - H * .6, 6]]) { g.beginPath(); g.moveTo(cx - wdt, top); g.lineTo(cx, top - wdt * 1.6); g.lineTo(cx + wdt, top); g.fill() }
      g.strokeStyle = '#3a3020'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y - 10 - H - 16); g.lineTo(x, y - 10 - H - 30); g.stroke(); g.fillStyle = `hsl(${e.h},${e.s}%,${e.l}%)`; g.beginPath(); g.moveTo(x, y - 10 - H - 30); g.quadraticCurveTo(x + 8, y - 10 - H - 28 + Math.sin(t * 4) * 2, x + 14, y - 10 - H - 26); g.lineTo(x, y - 10 - H - 22); g.fill();
      glow(g, x, y - 10 - H * .5, 46 * king, hsla(e.h, e.s, e.l), .3 * king) }
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
    const dusk = mode === 'festival', orbAt = mode === 'orb' ? -9 : 1e9, orbK = ease((t - orbAt) / 2.4), wind = 1, hz = h * .5;
    if (dusk) sky(g, w, h, [[0, '#120e2c'], [.35, '#2a2050'], [.52, '#4a3460'], [.6, '#5e4466'], [1, '#5e4466']]);
    else sky(g, w, h, [[0, '#3a4a7a'], [.3, '#a68aa8'], [.52, '#f4b48a'], [.6, '#ffd9a0'], [1, '#ffd9a0']]);
    if (dusk) stars(g, w, h, t, 60, 31, h * .3, .5 + orbK * .3);
    // sun
    if (dusk) moon(g, w * .72, lerp(h * .3, h * .16, ease(t / 8)), h * .05, t);
    else { const sy = lerp(hz + 20, hz - h * .1, ease(t / 10)); glow(g, w * .3, sy, h * .45, hsla(38, 100, 70), .55); g.fillStyle = '#ffe2a0'; g.beginPath(); g.arc(w * .3, sy, h * .045, 0, TAU); g.fill() }
    // the golden orb
    if (orbK > 0) {
      const ox = w * .74, oy = (dusk ? h * .16 : h * .22) + Math.sin(t * .5) * 2, R = h * .034 * orbK, pu = .75 + .25 * Math.sin(t * 2.6);
      glow(g, ox, oy, h * .42 * orbK, hsla(40, 100, 70), .4 * pu); glow(g, ox, oy + h * .3, w * .5, hsla(36, 100, 70), .12 * orbK);
      g.save(); g.translate(ox, oy); g.rotate(t * .12); g.strokeStyle = `hsla(48,100%,80%,${.25 * orbK})`; g.lineWidth = 1.5; for (let k = 0; k < 12; k++) { g.rotate(TAU / 12); g.beginPath(); g.moveTo(R * 1.6, 0); g.lineTo(R * (3 + (k % 3)), 0); g.stroke() } g.restore();
      glow(g, ox, oy, R * 2, hsla(50, 100, 92), 1); g.fillStyle = '#fff6d0'; g.beginPath(); g.arc(ox, oy, R * .8, 0, TAU); g.fill();
      const ph = (t * .35) % 1; g.strokeStyle = `hsla(46,100%,75%,${(1 - ph) * .4 * orbK})`; g.beginPath(); g.arc(ox, oy, R * (1.5 + ph * 7), 0, TAU); g.stroke();
      // songbirds circling in the warm light
      for (let i = 0; i < 5; i++) { const a = t * .4 + i * 1.3, x = ox - w * .12 + Math.cos(a) * w * .08 + i * 20, y = oy + h * .16 + Math.sin(a * 1.3) * h * .04, f = Math.sin(t * 11 + i) * 3; g.strokeStyle = dusk ? '#2a1a28' : '#4a3a40'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x - 6, y - f); g.lineTo(x, y); g.lineTo(x + 6, y - f); g.stroke() }
    }
    // hills + mist
    ridge(g, w, h, hz - h * .04, h * .05, 71, dusk ? '#3a2240' : '#7a6a8a'); ridge(g, w, h, hz + h * .02, h * .03, 72, dusk ? '#2a1a2c' : '#5f7a5a');
    if (!dusk) for (let k = 0; k < 5; k++) glow(g, ((k / 5 + t * .01) % 1.2 - .1) * w, hz + 8, w * .2, hsla(30, 40, 95), .35 * (1 - ease(t / 12)));
    // houses
    const hr = rng(19), base = hz + h * .1, sil = dusk ? '#22162a' : '#5a4a48', chims = [];
    for (let i = 0; i < 11; i++) { const x = w * (i / 10) + (hr() - .5) * 30, s = 1.6 + hr() * .9; const c = house(g, x, base + hr() * 14, s, { wall: sil, roof: dusk ? '#180f1e' : '#4a3438', shade: 'rgba(0,0,0,.12)', chimney: hr() < .6, roofDark: sil, door: dusk ? '#1a1018' : '#3a2a28', win: dusk || mode === 'dawn' ? `rgba(255,${190 + 30 * Math.sin(t * 7 + i)},110,${dusk ? .75 + .25 * Math.sin(t * 3 + i * 2) : .5})` : '#2a1e1e' }); if (c && hr() < .7) chims.push(c) }
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
      if (dusk) for (const u of [.25, .5, .75]) { const x = lerp(a, b, u) + Math.sin(t * 2 * wind + li) * 2 * wind, y = Y(u) + 22, on = clamp((t - .6 - li * .22) / .5), fl = .85 + .15 * Math.sin(t * 9 + li * 3); li++;
        g.strokeStyle = '#3a2a24'; g.beginPath(); g.moveTo(x, Y(u)); g.lineTo(x, y - 8); g.stroke();
        glow(g, x, y, 34, hsla(36, 100, 65), .55 * on * fl); g.fillStyle = on > 0 ? `hsl(${28 + 10 * on},90%,${30 + 30 * on * fl}%)` : '#4a2a20'; g.beginPath(); g.ellipse(x, y, 7, 9, 0, 0, TAU); g.fill() }
    }
    // wheat + pumpkins in front
    const wr = rng(23);
    for (let i = 0; i < 160; i++) { const x = wr() * w, l = h * (.1 + wr() * .1), sw = Math.sin(t * 1.8 * wind + x * .015) * 8 * wind, y0 = h + 4; g.strokeStyle = dusk ? `rgba(${120 + wr() * 40},${80 + wr() * 30},40,1)` : `rgba(${200 + wr() * 40},${160 + wr() * 30},80,1)`; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y0); g.quadraticCurveTo(x + sw * .4, y0 - l * .5, x + sw, y0 - l); g.stroke(); g.fillStyle = g.strokeStyle; g.beginPath(); g.ellipse(x + sw, y0 - l, 2.2, 6, sw * .03, 0, TAU); g.fill() }
    for (const [fx, s] of [[.12, 1.2], [.2, .8], [.82, 1.4], [.9, .9], [.7, .7]]) { const x = w * fx, y = h - 18 * s, R = 22 * s; for (const [dx, k] of [[-.55, .7], [.55, .7], [0, 1]]) { g.fillStyle = dusk ? '#b8521e' : '#e8782a'; g.beginPath(); g.ellipse(x + dx * R, y, R * .55 * k + R * .2, R * .62, 0, 0, TAU); g.fill() } g.strokeStyle = 'rgba(80,30,10,.45)'; g.lineWidth = 1.5; for (const dx of [-.5, 0, .5]) { g.beginPath(); g.ellipse(x + dx * R * .7, y, R * .2, R * .6, 0, 0, TAU); g.stroke() } g.fillStyle = '#4a5a22'; g.fillRect(x - 2, y - R * .7, 4, R * .3) }
    // vignette (darker as the orb rises)
    const vg = g.createRadialGradient(w / 2, h * .45, h * .3, w / 2, h * .45, h * .95); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.32)'); g.fillStyle = vg; g.fillRect(0, 0, w, h);
  }


  /* figure helper: a walking silhouette (x,y = feet) */
  function walker(g, x, y, s, t, col, o = {}) {
    const st = Math.sin(t * 6 + (o.ph || 0)), bob = Math.abs(st) * 1.5 * s;
    g.strokeStyle = col; g.fillStyle = col; g.lineCap = 'round'; g.lineWidth = 3 * s * (o.bulk || 1);
    g.beginPath(); g.moveTo(x, y - 14 * s - bob); g.lineTo(x + st * 5 * s, y); g.moveTo(x, y - 14 * s - bob); g.lineTo(x - st * 5 * s, y); g.stroke();
    g.lineWidth = 5 * s * (o.bulk || 1); g.beginPath(); g.moveTo(x, y - 14 * s - bob); g.lineTo(x + (o.lean || 0) * s, y - 30 * s * (o.tall || 1) - bob); g.stroke();
    g.beginPath(); g.arc(x + (o.lean || 0) * s, y - 35 * s * (o.tall || 1) - bob, 4.5 * s * (o.head || 1), 0, TAU); g.fill();
    if (o.ears) { g.beginPath(); g.moveTo(x - 3 * s, y - 38 * s * (o.tall || 1) - bob); g.lineTo(x - 6 * s, y - 46 * s * (o.tall || 1) - bob); g.lineTo(x, y - 39 * s * (o.tall || 1) - bob); g.fill() }
    if (o.horns) { g.lineWidth = 1.6 * s; g.beginPath(); g.arc(x + 4 * s, y - 40 * s * (o.tall || 1) - bob, 4 * s, Math.PI, Math.PI * 1.8); g.stroke() }
    if (o.staff) { g.lineWidth = 1.5 * s; g.beginPath(); g.moveTo(x + 7 * s, y); g.lineTo(x + 9 * s, y - 40 * s - bob); g.stroke() }
  }

  /* ---------------- kin · generations walk, bodies change with their element ---------------- */
  function kin(g, w, h, t) {
    sky(g, w, h, [[0, '#100e28'], [.45, '#262246'], [.62, '#3a3254'], [1, '#3a3254']]); stars(g, w, h, t, 70, 82, h * .4, .6);
    const hz = h * .46; ridge(g, w, h, hz - h * .05, h * .06, 81, '#3a2e48', hz + 20);
    const gr = g.createLinearGradient(0, hz, 0, h); gr.addColorStop(0, '#2a2030'); gr.addColorStop(1, '#0c0a10'); g.fillStyle = gr; g.fillRect(0, hz, w, h - hz);
    // the road
    g.fillStyle = 'rgba(200,170,130,.18)'; g.beginPath(); g.moveTo(0, hz + h * .17); g.lineTo(w, hz + h * .11); g.lineTo(w, hz + h * .17); g.lineTo(0, hz + h * .24); g.fill();
    // three bands of walkers, each shaped by an element, generations fade in and out
    const groups = [{ e: ELEMENTS[0], o: { tall: 1.25, head: .9 } }, { e: ELEMENTS[5], o: { ears: true, lean: 2 } }, { e: ELEMENTS[8], o: { bulk: 1.5, tall: .85, horns: true } }, { e: ELEMENTS[2], o: { tall: 1.1, staff: true } }];
    for (let k = 0; k < 14; k++) {
      const per = 16, ph = ((t * .9 + k * per / 14) % per) / per, x = lerp(-80, w + 80, ph), y = lerp(hz + h * .2, hz + h * .14, ph);
      const gen = clamp(ph * 1.4), grp = groups[k % groups.length], o = {}; for (const key in grp.o) o[key] = typeof grp.o[key] === 'number' ? lerp(1, grp.o[key], gen) : gen > .5 && grp.o[key];
      o.ph = k; const e = grp.e, col = `hsl(${e.h},${lerp(0, 40, gen)}%,${lerp(12, 20, gen)}%)`;
      glow(g, x, y - 50, 70, hsla(e.h, e.s, e.l), .3 * gen); walker(g, x, y, 2.2, t, col, o);
    }
    // generations ticking by: suns and moons arcing overhead
    for (let k = 0; k < 3; k++) { const ph = ((t * .12 + k / 3) % 1), x = lerp(-20, w + 20, ph), y = hz - Math.sin(ph * Math.PI) * h * .34; const day = k % 2 === 0; if (day) { glow(g, x, y, 50, hsla(45, 100, 80), .5); g.fillStyle = '#fff2c0'; g.beginPath(); g.arc(x, y, 9, 0, TAU); g.fill() } else moon(g, x, y, 10, t) }
  }

  /* ---------------- forgotten · a scholar with a lantern before a wall of unreadable script ---------------- */
  function forgotten(g, w, h, t) {
    sky(g, w, h, [[0, '#08070c'], [1, '#141018']]);
    // the wall
    g.fillStyle = '#1e1a1e'; g.fillRect(w * .12, h * .1, w * .76, h * .62);
    g.strokeStyle = 'rgba(0,0,0,.4)'; g.lineWidth = 2; for (let y = h * .1; y < h * .72; y += h * .08) { g.beginPath(); g.moveTo(w * .12, y); g.lineTo(w * .88, y); g.stroke() }
    const lx = w * .5 + Math.sin(t * .35) * w * .22, ly = h * .5, fl = .85 + .15 * Math.sin(t * 13) * Math.sin(t * 7);
    // carved script: visible only near the lantern, and it keeps shifting (no one can read it any more)
    const r = rng(51);
    for (let row = 0; row < 7; row++) for (let col = 0; col < 26; col++) {
      const x = w * .15 + col * w * .027, y = h * .16 + row * h * .075, d = Math.hypot(x - lx, (y - ly) * 1.3), a = clamp(1 - d / (w * .2)) * fl;
      if (a <= .02) { r(); continue } const sd = Math.floor(r() * 999) + Math.floor(t * .8 + col * .3) * 7;
      g.strokeStyle = `rgba(230,200,140,${a * .8})`; g.lineWidth = 1.3; rune(g, x, y, 6, sd);
    }
    // dust in the light
    for (let i = 0; i < 40; i++) { const q = rng(200 + i)(), x = lx + Math.sin(t * .3 + i) * 90 + (q - .5) * 120, y = ly - 40 + Math.cos(t * .23 + i * 1.7) * 70; g.fillStyle = `rgba(255,220,160,${.35 * fl * clamp(1 - Math.hypot(x - lx, y - ly) / 140)})`; g.fillRect(x, y, 1.5, 1.5) }
    glow(g, lx, ly, w * .24, hsla(38, 90, 60), .45 * fl);
    // floor, rubble, the scholar
    g.fillStyle = '#0a080a'; g.fillRect(0, h * .72, w, h * .28);
    for (const [fx, s] of [[.2, 18], [.27, 10], [.76, 22], [.83, 12]]) { g.beginPath(); g.ellipse(w * fx, h * .73, s * 1.6, s * .7, 0, Math.PI, 0); g.fill() }
    const sx = lx - 44, sy = h * .74; walker(g, sx, sy, 2.4, 0, '#050405', { lean: 5 }); g.strokeStyle = '#050405'; g.lineWidth = 5; g.beginPath(); g.moveTo(sx + 10, sy - 62); g.lineTo(lx - 4, ly + 4); g.stroke();
    g.fillStyle = `hsl(40,100%,${55 + 15 * fl}%)`; g.beginPath(); g.ellipse(lx, ly + 14, 6, 8, 0, 0, TAU); g.fill();
    // a scroll that unrolls and stays blank at the edges
    g.fillStyle = 'rgba(220,200,160,.75)'; g.fillRect(sx - 54, sy - 50, 30 + 12 * Math.sin(t * .5), 18);
  }

  /* ---------------- faith · prayers rise and gather into a presence ---------------- */
  function faith(g, w, h, t) {
    sky(g, w, h, [[0, '#06081a'], [.6, '#1a1a3a'], [1, '#221a30']]); stars(g, w, h, t, 120, 61, h * .6, .8); moon(g, w * .14, h * .14, h * .04, t);
    const hz = h * .66; ridge(g, w, h, hz, h * .06, 91, '#0c0a14');
    // temple on the hill
    const tx = w * .5, ty = ridgeY(w, hz, h * .06, 91, w * .5); g.fillStyle = '#0c0a14';
    g.fillRect(tx - 60, ty - 40, 120, 40); g.beginPath(); g.moveTo(tx - 72, ty - 40); g.lineTo(tx, ty - 78); g.lineTo(tx + 72, ty - 40); g.fill();
    for (let i = -2; i <= 2; i++) { g.fillStyle = '#ffcf7a'; g.globalAlpha = .6 + .3 * Math.sin(t * 2 + i); g.fillRect(tx + i * 22 - 3, ty - 30, 6, 12) } g.globalAlpha = 1;
    // the presence above (grows as prayers gather), opens its eyes at the end
    const P = { x: tx, y: h * .2 }, grow = ease((t - 2) / 7);
    glow(g, P.x, P.y + h * .05, h * .32 * grow, hsla(42, 80, 75), .35 * grow);
    if (grow > 0) { g.strokeStyle = `hsla(44,90%,85%,${.35 * grow})`; g.lineWidth = 1.5; g.beginPath(); g.ellipse(P.x, P.y + h * .1, w * .07 * grow, h * .16 * grow, 0, 0, TAU); g.stroke(); g.beginPath(); g.arc(P.x, P.y - h * .03 * grow, h * .035 * grow, 0, TAU); g.stroke();
      for (const sgn of [-1, 1]) { g.beginPath(); g.moveTo(P.x + sgn * w * .05 * grow, P.y + h * .04); g.quadraticCurveTo(P.x + sgn * w * .16 * grow, P.y - h * .02, P.x + sgn * w * .2 * grow, P.y + h * .12); g.stroke() } }
    const eyes = ease((t - 8) / 1.2); if (eyes > 0) for (const sgn of [-1, 1]) glow(g, P.x + sgn * h * .012, P.y - h * .035, 8, hsla(48, 100, 95), eyes);
    // prayer lights rising from the people around the temple
    for (let i = 0; i < 46; i++) { const q = rng(400 + i), sx = w * (.1 + q() * .8), per = 4 + q() * 3, ph = ((t + q() * per) % per) / per, sy = hz + h * .02 + q() * h * .1;
      const x = lerp(sx, P.x + (q() - .5) * w * .12, ease(ph)), y = lerp(sy, P.y + h * .08, ph) + Math.sin(ph * 9 + i) * 6; glow(g, x, y, 9, hsla(40 + q() * 20, 100, 75), Math.sin(ph * Math.PI) * .9) }
    // kneeling worshippers
    g.fillStyle = '#05040a'; g.fillRect(0, hz + h * .05, w, h); for (let i = 0; i < 18; i++) { const x = w * (.06 + i * .052), y = hz + h * .07; g.beginPath(); g.ellipse(x, y, 7, 10, 0, Math.PI, 0); g.fill(); g.beginPath(); g.arc(x, y - 13, 4, 0, TAU); g.fill() }
  }

  /* ---------------- deepwood · the endless forest to the east ---------------- */
  function deepwood(g, w, h, t) {
    const push = ease(t / 14);
    sky(g, w, h, [[0, '#0c1a1a'], [.5, '#244038'], [1, '#2a4a3a']]); g.globalAlpha = .55; moon(g, w * .2, h * .12, h * .04, t); g.globalAlpha = 1;
    // a far glimmer above the canopy (the city of light in the tales) — faint, maybe not there at all
    const cx = w * .68, cy = h * .2, seen = .5 + .5 * Math.sin(t * .6);
    glow(g, cx, cy, h * .18, hsla(170, 60, 80), .25 * seen); g.fillStyle = `rgba(220,255,240,${.35 * seen})`; for (let i = 0; i < 7; i++) { const x = cx - 30 + i * 10, hh = 10 + (i % 3) * 12 + (i === 3 ? 22 : 0); g.fillRect(x, cy + 20 - hh, 3, hh) }
    // layers of canopy, the camera slowly pushes in
    const layers = [['#1a3a30', .34, 11], ['#14302a', .44, 12], ['#0e2620', .56, 13], ['#081a16', .7, 14]];
    layers.forEach(([c, base, sd], i) => { const k = 1 + push * .08 * (i + 1), off = Math.sin(t * .1 + i) * 6; g.save(); g.translate(w / 2, h); g.scale(k, k); g.translate(-w / 2, -h);
      const r = rng(sd); g.fillStyle = c; g.fillRect(0, h * base + 20, w, h); for (let x = -40; x < w + 40; x += 22 + r() * 26) { const th = h * (.12 + r() * .14) * (1 + i * .15), y = h * base + 30; g.beginPath(); g.moveTo(x - 20 + off, y); g.lineTo(x + off, y - th); g.lineTo(x + 20 + off, y); g.fill(); g.beginPath(); g.arc(x + off, y - th * .55, 18 + i * 4, 0, TAU); g.fill() } g.restore() });
    // mist rolling between the layers
    for (let k = 0; k < 7; k++) glow(g, ((k / 7 + t * .012) % 1.2 - .1) * w, h * (.45 + (k % 3) * .1), w * .2, hsla(160, 20, 80), .2);
    // a few lights deep inside (eyes? lanterns?) and fireflies
    for (let i = 0; i < 5; i++) { const q = rng(500 + i), on = Math.sin(t * .7 + i * 2) > .6; if (on) glow(g, w * (.1 + q() * .8), h * (.6 + q() * .2), 6, hsla(q() < .5 ? 280 : 90, 80, 75), .8) }
    for (let i = 0; i < 30; i++) { const q = rng(600 + i), x = w * q() + Math.sin(t * .8 + i) * 20, y = h * (.5 + q() * .4) + Math.cos(t * .6 + i) * 10; glow(g, x, y, 5, hsla(80, 90, 70), .5 + .5 * Math.sin(t * 3 + i)) }
    // a lone traveller's trail stops at the forest's edge
    g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(0, h * .9, w, h * .1);
  }

  /* ---------------- hearth · tales by the fire in Fernvale ---------------- */
  function hearth(g, w, h, t) {
    sky(g, w, h, [[0, '#090c1e'], [.6, '#1e2034'], [1, '#1e2034']]); stars(g, w, h, t, 90, 71, h * .45, .8); moon(g, w * .82, h * .13, h * .05, t);
    const hz = h * .42, hr = rng(73);
    for (let i = 0; i < 6; i++) house(g, w * (i / 5) + (hr() - .5) * 30, hz + 10 + hr() * 10, 3.2, { wall: '#1a1624', roof: '#110e18', shade: 'rgba(0,0,0,.1)', chimney: true, roofDark: '#1a1624', door: '#100c14', win: `rgba(255,200,120,${.5 + .2 * Math.sin(t * 2 + i)})` });
    g.fillStyle = '#100c12'; g.fillRect(0, hz + 12, w, h);
    const fx = w * .5, fy = h * .58, fl = .85 + .15 * Math.sin(t * 17) * Math.sin(t * 5);
    glow(g, fx, fy - 10, h * .5, hsla(28, 100, 60), .5 * fl);
    // the flames
    g.save(); g.translate(fx, fy); g.scale(1.8, 1.8); g.translate(-fx, -fy);
    for (let k = 0; k < 5; k++) { const sw = Math.sin(t * 8 + k) * 4, hh = 34 + 10 * Math.sin(t * 11 + k * 2); g.fillStyle = `hsla(${20 + k * 8},100%,${55 + k * 6}%,.85)`; g.beginPath(); g.moveTo(fx - 16 + k * 4, fy); g.quadraticCurveTo(fx - 10 + k * 4 + sw, fy - hh * .6, fx - 6 + k * 3 + sw, fy - hh); g.quadraticCurveTo(fx - 2 + k * 3, fy - hh * .4, fx + 12 - k * 2, fy); g.fill() }
    g.strokeStyle = '#2a1a10'; g.lineWidth = 6; g.beginPath(); g.moveTo(fx - 22, fy + 4); g.lineTo(fx + 22, fy - 2); g.moveTo(fx - 20, fy - 2); g.lineTo(fx + 20, fy + 5); g.stroke(); g.restore();
    // sparks rise and briefly take shapes of the tales (a tower, a beast, a crown)
    const shapes = [[[0, -1], [0, 1], [-.4, 1], [.4, 1], [-.2, -.6], [.2, -.6]], [[-1, 0], [-.4, -.5], [.3, -.4], [1, -.8], [.6, .1], [-.2, .2], [-.6, .6]], [[-1, .4], [-.8, -.6], [-.4, .1], [0, -.8], [.4, .1], [.8, -.6], [1, .4]]];
    const shp = shapes[Math.floor(t / 4) % 3], form = Math.sin(((t % 4) / 4) * Math.PI);
    for (let i = 0; i < 34; i++) { const q = rng(700 + i), ph = ((t * .5 + q()) % 1), sx = fx + (q() - .5) * 30, x0 = sx + Math.sin(ph * 6 + i) * 18, y0 = fy - 30 - ph * h * .4, p = shp[i % shp.length], tx = fx + p[0] * 80, ty = h * .2 + p[1] * 50;
      const x = lerp(x0, tx, form * .85), y = lerp(y0, ty, form * .85); glow(g, x, y, 6, hsla(34, 100, 70), (1 - ph * .5) * .9) }
    // listeners around the fire, the storyteller gestures
    g.fillStyle = '#07050a';
    for (const [dx, s0] of [[-260, 1.2], [-170, 1], [170, 1.05], [260, 1.25], [-90, .85], [90, .9]]) { const s = s0 * 2, x = fx + dx, y = fy + 60; g.beginPath(); g.ellipse(x, y, 12 * s, 18 * s, 0, Math.PI, 0); g.fill(); g.beginPath(); g.arc(x, y - 24 * s, 7 * s, 0, TAU); g.fill() }
    { const x = fx + 350, y = fy + 60, arm = Math.sin(t * 2) * .5; g.beginPath(); g.ellipse(x, y, 28, 52, 0, Math.PI, 0); g.fill(); g.beginPath(); g.arc(x, y - 64, 16, 0, TAU); g.fill(); g.strokeStyle = '#07050a'; g.lineWidth = 9; g.beginPath(); g.moveTo(x - 12, y - 36); g.lineTo(x - 48, y - 70 - arm * 28); g.stroke() }
  }

  /* ---------------- elukhor · the golden light rests in the sky, then drifts to a new place ---------------- */
  function elukhor(g, w, h, t) {
    sky(g, w, h, [[0, '#4a8ac8'], [.45, '#9cc8e8'], [.62, '#f4e0b0'], [1, '#f4e0b0']]);
    // rest · drift · rest
    const spots = [[.28, .16], [.62, .12], [.8, .26]], per = 6, i = Math.floor(t / per) % spots.length, k = ease(clamp((t % per - 4) / 2)), a = spots[i], b = spots[(i + 1) % spots.length];
    const ox = w * lerp(a[0], b[0], k), oy = h * lerp(a[1], b[1], k) - Math.sin(k * Math.PI) * h * .04, pu = .85 + .15 * Math.sin(t * 1.6);
    glow(g, ox, oy, h * .7, hsla(42, 100, 80), .45 * pu);
    g.save(); g.translate(ox, oy); g.rotate(t * .06); for (let r = 0; r < 16; r++) { g.rotate(TAU / 16); const L = h * (.09 + (r % 2) * .05); const gr = g.createLinearGradient(0, 0, L, 0); gr.addColorStop(0, 'rgba(255,240,190,.55)'); gr.addColorStop(1, 'rgba(255,240,190,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(0, -3); g.lineTo(L, 0); g.lineTo(0, 3); g.fill() } g.restore();
    glow(g, ox, oy, h * .07, hsla(48, 100, 95), 1); g.fillStyle = '#fffbe6'; g.beginPath(); g.arc(ox, oy, h * .03, 0, TAU); g.fill();
    // warm light falls on the land under it
    ridge(g, w, h, h * .5, h * .04, 101, '#7aa860'); ridge(g, w, h, h * .58, h * .04, 102, '#68984e');
    glow(g, ox, h * .58, w * .3, hsla(48, 100, 80), .35);
    // farmers at work, a small fire shrine (Fren) with a flame offering
    g.save(); g.translate(0, -h * .12); const fr = rng(103); for (let j = 0; j < 7; j++) { const x = w * (.1 + j * .12) + fr() * 20, y = h * (.72 + fr() * .06), bend = Math.sin(t * 2 + j) * 3; g.fillStyle = '#3a3020'; g.beginPath(); g.arc(x + bend, y - 22, 4, 0, TAU); g.fill(); g.strokeStyle = '#3a3020'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + bend, y - 18); g.stroke(); g.strokeStyle = '#d8b860'; g.lineWidth = 2; for (let q = 0; q < 5; q++) { g.beginPath(); g.moveTo(x - 30 + q * 14, y + 6); g.lineTo(x - 30 + q * 14 + Math.sin(t * 1.5 + q) * 2, y - 12); g.stroke() } }
    const sx = w * .86, sy = h * .74; g.fillStyle = '#8a6a4a'; g.fillRect(sx - 14, sy - 26, 28, 26); g.beginPath(); g.moveTo(sx - 18, sy - 26); g.lineTo(sx, sy - 40); g.lineTo(sx + 18, sy - 26); g.fill();
    glow(g, sx, sy - 14, 22, hsla(24, 100, 60), .9); g.fillStyle = '#ffb050'; g.beginPath(); g.moveTo(sx - 4, sy - 8); g.quadraticCurveTo(sx + Math.sin(t * 9) * 2, sy - 20, sx + 4, sy - 8); g.fill();
    for (let j = 0; j < 2; j++) { const x = sx - 40 - j * 18, y = sy + 4; g.fillStyle = '#4a3a2a'; g.beginPath(); g.ellipse(x, y, 7, 10, 0, Math.PI, 0); g.fill(); g.beginPath(); g.arc(x + 2, y - 12, 4, 0, TAU); g.fill() } g.restore();
  }

  /* ---------------- homeMorning · inside the hero's house, sun through the window, father's knife on the wall ---------------- */
  function homeMorning(g, w, h, t) {
    g.fillStyle = '#3a2a1e'; g.fillRect(0, 0, w, h);
    // wall planks + floor
    for (let x = 0; x < w; x += 46) { g.fillStyle = (x / 46) % 2 ? '#43301f' : '#3d2c1d'; g.fillRect(x, 0, 46, h * .74) }
    g.fillStyle = '#2a1c12'; g.fillRect(0, h * .74, w, h * .26); g.strokeStyle = 'rgba(0,0,0,.3)'; for (let y = h * .78; y < h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke() }
    // window with dawn sky, sun rising in it
    const wx = w * .62, wy = h * .14, ww = w * .2, wh = h * .3, rise = ease(t / 10);
    const sk = g.createLinearGradient(0, wy, 0, wy + wh); sk.addColorStop(0, '#7a8ac0'); sk.addColorStop(1, '#ffc890'); g.fillStyle = sk; g.fillRect(wx, wy, ww, wh);
    glow(g, wx + ww * .6, lerp(wy + wh, wy + wh * .55, rise), wh * .5, hsla(40, 100, 80), .9);
    g.strokeStyle = '#2a1a10'; g.lineWidth = 6; g.strokeRect(wx, wy, ww, wh); g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.moveTo(wx, wy + wh / 2); g.lineTo(wx + ww, wy + wh / 2); g.stroke();
    // light beam with dust
    g.save(); g.globalCompositeOperation = 'lighter'; const bm = g.createLinearGradient(wx, wy, wx - w * .3, h); bm.addColorStop(0, `rgba(255,210,150,${.22 * rise + .06})`); bm.addColorStop(1, 'rgba(255,210,150,0)'); g.fillStyle = bm;
    g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx + ww, wy + wh); g.lineTo(wx + ww - w * .25, h); g.lineTo(wx - w * .38, h); g.closePath(); g.fill();
    for (let i = 0; i < 40; i++) { const q = rng(800 + i), x = wx - w * .25 + q() * w * .4 + Math.sin(t * .4 + i) * 10, y = wy + q() * h * .7 + Math.cos(t * .3 + i) * 8; g.fillStyle = `rgba(255,230,180,${.4 * rise})`; g.fillRect(x, y, 1.6, 1.6) } g.restore();
    // bed (the hero still under the blanket, breathing), table, door, the knife on the wall
    const bx = w * .1, by = h * .62; g.fillStyle = '#5a3a24'; g.fillRect(bx, by, w * .3, h * .14); g.fillStyle = '#8a5a4a'; g.fillRect(bx + 8, by - 12, w * .3 - 16, 20);
    const br = 1 + Math.sin(t * 1.6) * .04; g.fillStyle = '#6a7a9a'; g.beginPath(); g.ellipse(bx + w * .17, by - 6, w * .12, 18 * br, 0, Math.PI, 0); g.fill(); g.fillStyle = '#d8b090'; g.beginPath(); g.arc(bx + 26, by - 12, 11, 0, TAU); g.fill();
    if (Math.sin(t * .9) > .7) { g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '700 16px system-ui'; g.fillText('z', bx + 40, by - 34 - (t * 20 % 20)) }
    g.fillStyle = '#4a3020'; g.fillRect(w * .48, h * .58, w * .12, 8); g.fillRect(w * .49, h * .58, 6, h * .16); g.fillRect(w * .58, h * .58, 6, h * .16);
    g.fillStyle = '#c8b090'; g.beginPath(); g.arc(w * .52, h * .57, 7, 0, TAU); g.fill(); smoke(g, w * .52, h * .55, t, .5, 3, [240, 240, 240]);
    const dx = w * .86, dy = h * .3; g.fillStyle = '#2a1a10'; g.fillRect(dx, dy, w * .1, h * .44); g.fillStyle = '#c8a050'; g.beginPath(); g.arc(dx + 10, dy + h * .23, 3, 0, TAU); g.fill();
    // the knife
    const kx = w * .45, ky = h * .32, shine = clamp(Math.sin(t * .8 - 1.5)); g.save(); g.translate(kx, ky); g.rotate(-.5);
    g.fillStyle = '#5a3a20'; g.fillRect(-4, 0, 8, 26); g.fillStyle = '#7a6a50'; g.fillRect(-9, -3, 18, 4); g.fillStyle = '#b8bcc4'; g.beginPath(); g.moveTo(-4, -3); g.lineTo(0, -40); g.lineTo(4, -3); g.fill(); g.restore();
    glow(g, kx + 8, ky - 14, 30, hsla(45, 100, 85), .5 * shine);
  }

  const SCENES = { ruins: (g, w, h, t) => ancient(g, w, h, t, true), ancient, heirs, journey, realms, kin, forgotten, faith, deepwood, hearth, elukhor, homeMorning, fernvale, festival: (g, w, h, t) => village(g, w, h, t, 'festival'), dawn: (g, w, h, t) => village(g, w, h, t, 'dawn'), orb: (g, w, h, t) => village(g, w, h, t, 'orb') };

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
