/* v95.18 · Diorama terrain for the card battle fields (battle-field.html), in the spirit of FFT / Tactics Ogre / Triangle Strategy:
   the field is a floating block of land — textured tops (grass, dirt path, cobbles, snow, sand, moss), earth lips and rock cliffs with
   strata and light from the upper left, ambient shadow at the foot of every rise, grass that hangs over the edges, and a deep rock
   skirt under the whole field. Same projection and painter's order as js/terrain-height-art.js (28 x 14 half-diamond, 18 px per level).
   FieldDiorama.paint(ctx, map, {biome, poi, rnd, pools(i)}) · FieldDiorama.sky(ctx, w, h, biome, night) */
(function (root) {
  'use strict';
  const OX = 2240, OY = 1232, HW = 28, HH = 14, PX = () => (root.TerrainHeight ? root.TerrainHeight.LEVEL_PX : 18), BASE = -4;

  /* ---------- tiny seeded random ---------- */
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
  const hex = (h, k = 1, a = 1) => { const n = parseInt(h.slice(1), 16), c = x => Math.max(0, Math.min(255, Math.round(x * k))); return `rgba(${c(n >> 16)},${c(n >> 8 & 255)},${c(n & 255)},${a})` };

  /* ---------- procedural textures (128 px, tile seamlessly by wrapping every mark) ---------- */
  const S = 128, cache = {};
  function canvas() { const c = document.createElement('canvas'); c.width = c.height = S; return c }
  function wrap(g, fn) { for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) { g.save(); g.translate(dx, dy); fn(); g.restore() } }
  const TEX = {
    grass(g, r, o) {
      g.fillStyle = o.base; g.fillRect(0, 0, S, S);
      for (let i = 0; i < 60; i++) { const x = r() * S, y = r() * S, rr = 8 + r() * 18; wrap(g, () => { g.fillStyle = hex(o.base, r() < .5 ? .9 : 1.1, .35); g.beginPath(); g.ellipse(x, y, rr, rr * .6, 0, 0, 7); g.fill() }) }
      for (let i = 0; i < 520; i++) { const x = r() * S, y = r() * S, h = 2 + r() * 4, c = o.blades[(r() * o.blades.length) | 0]; wrap(g, () => { g.strokeStyle = c; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - .5) * 2, y - h); g.stroke() }) }
      for (let i = 0; i < (o.flowers || 0); i++) { const x = r() * S, y = r() * S, c = ['#f4e9a8', '#f2f2f2', '#e8a8c8', '#a8c8f0'][(r() * 4) | 0]; wrap(g, () => { g.fillStyle = c; g.fillRect(x, y, 1.6, 1.6) }) }
    },
    dirt(g, r, o) {
      g.fillStyle = o.base; g.fillRect(0, 0, S, S);
      for (let i = 0; i < 90; i++) { const x = r() * S, y = r() * S, rr = 4 + r() * 14; wrap(g, () => { g.fillStyle = hex(o.base, .85 + r() * .3, .35); g.beginPath(); g.ellipse(x, y, rr, rr * .7, r() * 3, 0, 7); g.fill() }) }
      for (let i = 0; i < 70; i++) { const x = r() * S, y = r() * S, rr = 1 + r() * 2.6; wrap(g, () => { g.fillStyle = hex(o.pebble, .8 + r() * .4); g.beginPath(); g.ellipse(x, y, rr, rr * .75, 0, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(x - rr * .4, y - rr * .5, rr * .6, rr * .4) }) }
    },
    cobble(g, r, o) {
      g.fillStyle = o.mortar; g.fillRect(0, 0, S, S);
      for (let row = 0; row < 8; row++) for (let k = 0; k < 6; k++) {
        const w = 18 + r() * 6, x = k * 22 + (row % 2) * 11 + r() * 2, y = row * 16 + r() * 2;
        wrap(g, () => { g.fillStyle = hex(o.stone, .82 + r() * .3); g.beginPath(); g.roundRect(x, y, w, 13, 4); g.fill(); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + 2, y + 1, w - 4, 2); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(x + 2, y + 11, w - 4, 2) })
      }
    },
    snow(g, r, o) {
      g.fillStyle = o.base; g.fillRect(0, 0, S, S);
      for (let i = 0; i < 70; i++) { const x = r() * S, y = r() * S, rr = 6 + r() * 16; wrap(g, () => { g.fillStyle = r() < .5 ? 'rgba(170,190,215,.18)' : 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(x, y, rr, rr * .5, 0, 0, 7); g.fill() }) }
      for (let i = 0; i < 160; i++) { const x = r() * S, y = r() * S; wrap(g, () => { g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(x, y, 1, 1) }) }
    },
    rock(g, r, o) {   /* cliff faces: stacked irregular slabs with cracks */
      g.fillStyle = o.base; g.fillRect(0, 0, S, S);
      for (let row = 0; row < 6; row++) for (let k = 0; k < 4; k++) {
        const x = k * 32 + (row % 2) * 16 + r() * 4, y = row * 22 + r() * 3, w = 26 + r() * 8, h = 16 + r() * 5;
        wrap(g, () => { g.fillStyle = hex(o.base, .8 + r() * .35); g.beginPath(); g.moveTo(x + 3, y); g.lineTo(x + w, y + 2); g.lineTo(x + w - 2, y + h); g.lineTo(x, y + h - 2); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.2; g.stroke(); g.fillStyle = 'rgba(255,255,255,.13)'; g.fillRect(x + 4, y + 2, w - 9, 2) })
      }
      for (let i = 0; i < 14; i++) { const x = r() * S, y = r() * S; wrap(g, () => { g.fillStyle = hex(o.moss || o.base, 1, .4); g.beginPath(); g.ellipse(x, y, 5 + r() * 6, 2 + r() * 2, 0, 0, 7); g.fill() }) }
    },
    earth(g, r, o) {   /* 1-level lips: soil strata, roots, embedded stones */
      g.fillStyle = o.base; g.fillRect(0, 0, S, S);
      for (let y = 0; y < S; y += 8 + ((y * 7) % 5)) { g.fillStyle = hex(o.base, .82 + ((y / 8) % 3) * .08, .8); g.fillRect(0, y, S, 3) }
      for (let i = 0; i < 26; i++) { const x = r() * S, y = r() * S, rr = 2 + r() * 4; wrap(g, () => { g.fillStyle = hex(o.stone, .8 + r() * .3); g.beginPath(); g.ellipse(x, y, rr, rr * .7, 0, 0, 7); g.fill() }) }
      for (let i = 0; i < 8; i++) { const x = r() * S, y = r() * S * .5; wrap(g, () => { g.strokeStyle = 'rgba(60,40,20,.55)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 6, y + 8, x + 2, y + 16); g.stroke() }) }
    },
    brick(g, r, o) {
      g.fillStyle = o.mortar; g.fillRect(0, 0, S, S);
      for (let row = 0; row < 8; row++) for (let k = 0; k < 4; k++) { const x = k * 32 + (row % 2) * 16, y = row * 16; wrap(g, () => { g.fillStyle = hex(o.stone, .82 + r() * .3); g.fillRect(x + 1, y + 1, 30, 14); g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(x + 2, y + 2, 28, 2) }) }
    }
  };
  function tex(kind, o, seed) { const k = kind + JSON.stringify(o); if (cache[k]) return cache[k]; const c = canvas(); TEX[kind](c.getContext('2d'), rng(seed || 7), o); return cache[k] = c }

  /* ---------- painted textures (assets/terrain/diorama, 256 px seamless, 2 cells per tile); the procedural ones stand in until they load ---------- */
  const SRC = document.currentScript?.src || '', IMG = {};
  for (const n of ['grass', 'drygrass', 'dirt', 'cobble', 'snow', 'sand', 'cliff', 'earth']) { const im = new Image(); im.src = SRC ? new URL('../assets/terrain/diorama/' + n + '.webp', SRC).href : 'assets/terrain/diorama/' + n + '.webp'; IMG[n] = im }
  const loaded = im => im && im.complete && im.naturalWidth > 0;
  const ready = () => Promise.all(Object.values(IMG).map(im => loaded(im) ? 1 : new Promise(r => { im.onload = im.onerror = r }))).then(() => Object.values(IMG).every(loaded));
  /* which painted texture each slot uses per biome, and a colour wash on top of it */
  const PAINTED = {
    grass: { top: 'grass', path: 'dirt', lip: 'earth', cliff: 'cliff' },
    forest: { top: 'grass', path: 'dirt', lip: 'earth', cliff: 'cliff', wash: { top: 'rgba(15,40,15,.22)' } },
    hills: { top: 'drygrass', path: 'dirt', lip: 'earth', cliff: 'cliff', wash: { cliff: 'rgba(150,120,80,.18)' } },
    swamp: { top: 'grass', path: 'dirt', lip: 'earth', cliff: 'cliff', wash: { top: 'rgba(25,40,20,.38)', path: 'rgba(20,15,5,.35)' } },
    snow: { top: 'snow', path: 'dirt', lip: 'earth', cliff: 'cliff', wash: { path: 'rgba(220,230,240,.45)', cliff: 'rgba(190,210,235,.35)', lip: 'rgba(200,215,235,.25)' } },
    sand: { top: 'sand', path: 'dirt', lip: 'earth', cliff: 'cliff', wash: { cliff: 'rgba(210,170,110,.3)', path: 'rgba(230,200,140,.25)' } }
  };

  /* ---------- materials per biome ---------- */
  function materials(biome, poi) {
    const M = {
      grass: { top: ['grass', { base: '#5f8f3c', blades: ['#79ad4c', '#4e7a30', '#8cc05a', '#6a9a40'], flowers: 26 }], path: ['dirt', { base: '#a08458', pebble: '#c8b48c' }], lip: ['earth', { base: '#7a5a38', stone: '#9a8a70' }], cliff: ['rock', { base: '#7d7a70', moss: '#5f7a3a' }], hang: '#5f8f3c' },
      forest: { top: ['grass', { base: '#45703a', blades: ['#5a8a42', '#355a2a', '#6c9a4a', '#3f6a32'], flowers: 6 }], path: ['dirt', { base: '#7a6040', pebble: '#a89070' }], lip: ['earth', { base: '#5f4428', stone: '#8a7a60' }], cliff: ['rock', { base: '#6a6a60', moss: '#4a6a32' }], hang: '#45703a' },
      hills: { top: ['grass', { base: '#8a8a4a', blades: ['#a6a25a', '#6f7038', '#b8b46a', '#7f8040'], flowers: 4 }], path: ['dirt', { base: '#b09a6a', pebble: '#d0c09a' }], lip: ['earth', { base: '#8a6a42', stone: '#a89a7a' }], cliff: ['rock', { base: '#a08e6e', moss: '#7a7a42' }], hang: '#8a8a4a' },
      swamp: { top: ['grass', { base: '#4a5e3a', blades: ['#5c7246', '#3a4a2e', '#6a7a48', '#47583a'], flowers: 2 }], path: ['dirt', { base: '#5a4a32', pebble: '#7a6a50' }], lip: ['earth', { base: '#4a3a26', stone: '#6a6050' }], cliff: ['rock', { base: '#5a5a50', moss: '#4a6a3a' }], hang: '#4a5e3a' },
      snow: { top: ['snow', { base: '#e8eef4' }], path: ['dirt', { base: '#b8bcc0', pebble: '#d8dce0' }], lip: ['earth', { base: '#7a6a5a', stone: '#a0a4a8' }], cliff: ['rock', { base: '#8a96a4', moss: '#dfe8f0' }], hang: '#f0f5f9' },
      sand: { top: ['dirt', { base: '#d8c08a', pebble: '#ead8aa' }], path: ['dirt', { base: '#c4a870', pebble: '#e0cca0' }], lip: ['earth', { base: '#b08a58', stone: '#d0b88a' }], cliff: ['rock', { base: '#b89a6a', moss: '#c8aa7a' }], hang: '#d8c08a' }
    }[biome] || null;
    const m = M || materials('grass');
    if (poi === 'ruin') { m.path = ['cobble', { mortar: '#5a5448', stone: '#a8a294' }]; m.cliff = ['brick', { mortar: '#4a453c', stone: '#8f897a' }] }
    if (poi === 'mine') { m.path = ['dirt', { base: '#6a5a48', pebble: '#8a7a68' }] }
    return m;
  }

  /* ---------- geometry ---------- */
  const P = (m, u, v, z) => ({ x: OX + (u + m.origin.u - v - m.origin.v) * HW, y: OY + (u + m.origin.u + v + m.origin.v) * HH - z * PX() });
  const L = (m, u, v) => (u < 0 || v < 0 || u >= m.w || v >= m.h) ? null : m.levels[v * m.w + u];
  function poly(g, pts) { g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)); g.closePath() }
  /* pattern laid on the ground plane: 64 texture px = one cell */
  function groundPattern(g, img, z) { const k = (img.naturalWidth || img.width) / 2, p = g.createPattern(img, 'repeat'); p.setTransform(new DOMMatrix([HW / k, HH / k, -HW / k, HH / k, OX, OY - z * PX()])); return p }
  /* pattern on a wall running along +u (dir 1) or along +v (dir -1): rows are heights (32 texture px = one level) */
  function wallPattern(g, img, dir) { const w = img.naturalWidth || img.width, k = w / 2, painted = !!img.naturalWidth, p = g.createPattern(img, 'repeat'); p.setTransform(new DOMMatrix([dir * HW / k, HH / k, 0, painted ? PX() * 3 / w : PX() / 32, OX, OY])); return p }

  function paint(g, m, o) {
    o = o || {};
    const mat = materials(o.biome, o.poi), r = rng(1234), pools = o.pools || (() => false);
    const PT = Object.assign({}, PAINTED[o.biome] || PAINTED.grass); if (o.poi === 'ruin') PT.path = 'cobble';
    const img = k => loaded(IMG[PT[k]]) ? IMG[PT[k]] : tex(mat[k][0], mat[k][1], k.length * 97), wash = k => (loaded(IMG[PT[k]]) && PT.wash?.[k]) || null;
    const topImg = img('top'), pathImg = img('path'), lipImg = img('lip'), cliffImg = img('cliff');
    const order = []; for (let v = 0; v < m.h; v++) for (let u = 0; u < m.w; u++) order.push([u, v]);
    order.sort((a, b) => (a[0] + a[1]) - (b[0] + b[1]) || a[0] - b[0]);
    const vary = Array.from({ length: m.w * m.h }, () => r());
    for (const [u, v] of order) {
      const i = v * m.w + u, lv = m.levels[i];
      /* walls toward the viewer: +u (right face, in shade) and +v (left face, in light) */
      for (const [du, dv] of [[1, 0], [0, 1]]) {
        const nl = L(m, u + du, v + dv), edge = nl == null, low = edge ? BASE : nl;
        if (lv <= low) continue;
        const a = du ? [1, 0] : [0, 1], b = [1, 1];
        const pts = [P(m, u + a[0], v + a[1], lv), P(m, u + b[0], v + b[1], lv), P(m, u + b[0], v + b[1], low), P(m, u + a[0], v + a[1], low)];
        const cliff = edge || lv - low >= 2, dir = du ? -1 : 1;
        poly(g, pts); g.fillStyle = wallPattern(g, cliff ? cliffImg : lipImg, dir); g.fill(); const wsh = wash(cliff ? 'cliff' : 'lip'); if (wsh) { g.fillStyle = wsh; g.fill() }
        /* light: left faces lit, right faces in shade; darker toward the foot (and fading into the dark under the island) */
        const top = Math.min(pts[0].y, pts[1].y), bot = Math.max(pts[2].y, pts[3].y), gr = g.createLinearGradient(0, top, 0, bot);
        const side = du ? .38 : .1;
        gr.addColorStop(0, `rgba(0,0,0,${side})`); gr.addColorStop(1, `rgba(0,0,0,${edge ? .92 : side + .22})`);
        poly(g, pts); g.fillStyle = gr; g.fill();
        g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(pts[3].x, pts[3].y); g.lineTo(pts[2].x, pts[2].y); g.stroke();
        /* grass / snow hanging over the lip */
        if (mat.hang && mat.top[0] !== 'dirt') {
          g.fillStyle = hex(mat.hang, du ? .72 : .9); g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
          const n = 7; for (let k = 0; k <= n; k++) { const t = k / n, x = pts[0].x + (pts[1].x - pts[0].x) * t, y = pts[0].y + (pts[1].y - pts[0].y) * t; g.lineTo(x, y + 2 + ((k + u * 3 + v) % 3) * 1.6) }
          g.lineTo(pts[1].x, pts[1].y); g.closePath(); g.fill();
        }
        /* rim light on the top edge */
        g.strokeStyle = du ? 'rgba(255,245,210,.18)' : 'rgba(255,245,210,.4)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(pts[0].x, pts[0].y); g.lineTo(pts[1].x, pts[1].y); g.stroke();
      }
      /* the top */
      const t4 = [P(m, u, v, lv), P(m, u + 1, v, lv), P(m, u + 1, v + 1, lv), P(m, u, v + 1, lv)];
      const isPath = m.flat && m.flat[i];
      poly(g, t4); g.fillStyle = groundPattern(g, isPath ? pathImg : topImg, lv); g.fill(); const tw = wash(isPath ? 'path' : 'top'); if (tw) { g.fillStyle = tw; g.fill() }
      if (isPath && mat.top[0] === 'grass') { /* soft grass border where the path meets grass */ }
      /* height light, a little cell-to-cell variation, then ambient shadow from higher ground behind */
      const lift = lv * .045 + (vary[i] - .5) * .05;
      poly(g, t4); g.fillStyle = lift >= 0 ? `rgba(255,248,220,${lift})` : `rgba(0,0,0,${-lift})`; g.fill();
      for (const [du, dv, A, B, C, D] of [[-1, 0, 0, 3, 1, 2], [0, -1, 0, 1, 3, 2]]) {
        const nl = L(m, u + du, v + dv); if (nl == null || nl <= lv) continue;
        const from = { x: (t4[A].x + t4[B].x) / 2, y: (t4[A].y + t4[B].y) / 2 }, to = { x: (t4[C].x + t4[D].x) / 2, y: (t4[C].y + t4[D].y) / 2 };
        const gr = g.createLinearGradient(from.x, from.y, to.x, to.y); gr.addColorStop(0, `rgba(10,8,20,${Math.min(.6, .2 * (nl - lv) + .15)})`); gr.addColorStop(.8, 'rgba(10,8,20,0)');
        poly(g, t4); g.fillStyle = gr; g.fill();
      }
      if (pools(i)) { poly(g, t4); g.fillStyle = 'rgba(40,90,120,.6)'; g.fill() }
      /* tactical grid: a faint line so cells read clearly */
      poly(g, t4); g.strokeStyle = 'rgba(0,0,0,.1)'; g.lineWidth = 1; g.stroke();
    }
  }

  /* backdrop behind the floating field */
  function sky(g, w, h, biome, night) {
    const C = night ? ['#0d1428', '#05070f'] : { snow: ['#5c6f86', '#1c2430'], sand: ['#6a5a48', '#1e1812'], swamp: ['#2a3a34', '#0a100e'], hills: ['#4a5a6a', '#141a22'] }[biome] || ['#2f4a5e', '#0b121a'];
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, C[0]); gr.addColorStop(1, C[1]); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const rg = g.createRadialGradient(w / 2, h * .45, 0, w / 2, h * .45, Math.max(w, h) * .6); rg.addColorStop(0, night ? 'rgba(120,110,200,.12)' : 'rgba(255,235,190,.14)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(0, 0, w, h);
  }

  /* ---------- landforms stamped into a height map: plateaus with cliffs and a stair, so fights have real high ground ---------- */
  function landforms(m, o) {
    const T = root.TerrainHeight, r = rng(o.seed || 99), n = m.w * m.h, keep = o.keep || (() => false), tries = o.count || 2;
    const walkOK = () => { // every walkable cell still connects
      let start = -1; for (let i = 0; i < n; i++) if (!m.blocked[i]) { start = i; break } if (start < 0) return true;
      const seen = new Uint8Array(n), q = [start]; seen[start] = 1;
      while (q.length) { const i = q.pop(), u = i % m.w, v = (i - u) / m.w; for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = u + du, b = v + dv; if (a < 0 || b < 0 || a >= m.w || b >= m.h) continue; const j = b * m.w + a; if (seen[j] || m.blocked[j] || Math.abs(m.levels[i] - m.levels[j]) > 1) continue; seen[j] = 1; q.push(j) } }
      for (let i = 0; i < n; i++) if (!m.blocked[i] && !seen[i]) return false; return true;
    };
    let made = 0;
    for (let k = 0; k < 40 && made < tries; k++) {
      const w = 3 + ((r() * 3) | 0), h = 3 + ((r() * 2) | 0), u0 = 1 + ((r() * (m.w - w - 2)) | 0), v0 = 1 + ((r() * (m.h - h - 2)) | 0);
      let bad = false, hi = 0; for (let v = v0; v < v0 + h && !bad; v++) for (let u = u0; u < u0 + w; u++) { const i = v * m.w + u; if (m.flat[i] || keep(u, v)) { bad = true; break } hi = Math.max(hi, m.levels[i]) }
      if (bad) continue;
      const top = Math.min(m.maxLevel, Math.max(2, hi + 2)), save = Uint8Array.from(m.levels), saveB = Uint8Array.from(m.blocked);
      for (let v = v0; v < v0 + h; v++) for (let u = u0; u < u0 + w; u++) m.levels[v * m.w + u] = top;
      /* a stair: walk out from the middle of one side, one level down per cell */
      const sides = [[0, 1], [1, 0], [0, -1], [-1, 0]], [su, sv] = sides[(r() * 4) | 0];
      let u = su > 0 ? u0 + w : su < 0 ? u0 - 1 : u0 + (w >> 1), v = sv > 0 ? v0 + h : sv < 0 ? v0 - 1 : v0 + (h >> 1), lvl = top - 1, stairs = [];
      while (u >= 0 && v >= 0 && u < m.w && v < m.h) { const i = v * m.w + u; if (m.flat[i]) break; if (m.levels[i] >= lvl) break; m.levels[i] = lvl; m.blocked[i] = 0; stairs.push(i); lvl--; if (lvl < 0) break; u += su; v += sv }
      if (!walkOK()) { m.levels.set(save); m.blocked.set(saveB); continue }
      m.stairs = (m.stairs || []).concat(stairs); made++;
    }
    return made;
  }

  root.FieldDiorama = { paint, sky, landforms, materials, ready, BASE };
})(typeof globalThis !== 'undefined' ? globalThis : this);
