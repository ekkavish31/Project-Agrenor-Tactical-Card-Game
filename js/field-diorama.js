/* v95.18 · Diorama terrain for the card battle fields (battle-field.html), in the spirit of FFT / Tactics Ogre / Triangle Strategy:
   the field is a floating block of land — textured tops (grass, dirt path, cobbles, snow, sand, moss), earth lips and rock cliffs with
   strata and light from the upper left, ambient shadow at the foot of every rise, grass that hangs over the edges, and a deep rock
   skirt under the whole field. Same projection and painter's order as js/terrain-height-art.js (28 x 14 half-diamond, 9 px per sub-level).
   v96.00: every cell is drawn from its four corner heights (ramps and stairs slope), per-cell materials (m.mat: 0 natural · 1 cobble · 2 wood ·
   3 brick · 4 stone slab), water cells (m.water) sit below the bank, cast shadows fall away from the light (upper left = −u),
   structures() stamps rivers with bridges and broken walls, landforms() can raise stone forts, and tile(m, i) returns one cell (walls + top)
   on its own canvas so the host can redraw it in front of units standing behind it (occlusion).
   Painted textures load from assets/terrain/diorama/<name>.webp; until a file exists the procedural texture stands in.
   FieldDiorama.paint(ctx, map, {biome, poi, pools(i)}) · tile(map, i) · sky(ctx, w, h, biome, night) · grade(ctx, w, h, biome, night) */
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
    wood(g, r, o) {   /* planks running along the texture x axis, with seams, nails and grain */
      g.fillStyle = o.base; g.fillRect(0, 0, S, S);
      for (let row = 0; row < 8; row++) { const y = row * 16, k = .82 + r() * .3; g.fillStyle = hex(o.base, k); g.fillRect(0, y + 1, S, 14); g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, y, S, 1.5);
        g.fillStyle = 'rgba(255,240,200,.12)'; g.fillRect(0, y + 2, S, 1.2); const cut = r() * S; g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(cut, y, 1.5, 16);
        for (let i = 0; i < 6; i++) { const x = r() * S; g.strokeStyle = 'rgba(40,24,10,.25)'; g.lineWidth = .8; g.beginPath(); g.moveTo(x, y + 4 + r() * 8); g.lineTo(x + 14 + r() * 20, y + 4 + r() * 8); g.stroke() }
        for (const x of [cut - 4, cut + 4]) { g.fillStyle = 'rgba(30,30,30,.6)'; g.fillRect(((x % S) + S) % S, y + 4, 1.6, 1.6); g.fillRect(((x % S) + S) % S, y + 11, 1.6, 1.6) } }
    },
    slab(g, r, o) {   /* large worn flagstones (fort tops, stairs) */
      g.fillStyle = o.mortar; g.fillRect(0, 0, S, S);
      for (let row = 0; row < 4; row++) for (let k = 0; k < 3; k++) { const x = k * 43 + (row % 2) * 21 + r() * 2, y = row * 32 + r() * 2, w = 38 + r() * 3;
        wrap(g, () => { g.fillStyle = hex(o.stone, .8 + r() * .28); g.fillRect(x, y, w, 29); g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(x + 1, y + 1, w - 2, 2); g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(x + 1, y + 26, w - 2, 3);
          if (r() < .5) { g.fillStyle = hex(o.moss || o.stone, 1, .35); g.beginPath(); g.ellipse(x + r() * w, y + r() * 29, 5 + r() * 5, 3, 0, 0, 7); g.fill() } }) }
    },
    brick(g, r, o) {
      g.fillStyle = o.mortar; g.fillRect(0, 0, S, S);
      for (let row = 0; row < 8; row++) for (let k = 0; k < 4; k++) { const x = k * 32 + (row % 2) * 16, y = row * 16; wrap(g, () => { g.fillStyle = hex(o.stone, .82 + r() * .3); g.fillRect(x + 1, y + 1, 30, 14); g.fillStyle = 'rgba(255,255,255,.1)'; g.fillRect(x + 2, y + 2, 28, 2) }) }
    }
  };
  function tex(kind, o, seed) { const k = kind + JSON.stringify(o); if (cache[k]) return cache[k]; const c = canvas(); TEX[kind](c.getContext('2d'), rng(seed || 7), o); return cache[k] = c }

  /* ---------- painted textures (assets/terrain/diorama, 256 px seamless, 2 cells per tile); the procedural ones stand in until they load ---------- */
  /* v96.05: planks, brick, slabs, water, mud, snow, sand, per-biome cliffs and the lip strips come from the terrain sets already in the repo;
     names not listed here live in assets/terrain/diorama/<name>.webp */
  const TEXFILE = { wood: 'terrain/ground/planks', brick: 'terrain/cliff/ruin-wall', slab: 'terrain/ground/slabs', water: 'terrain/ground/water-deep', swampw: 'terrain/ground/swamp',
    mud: 'terrain/ground/mud-wet', snowd: 'terrain/ground/snow-deep', sandc: 'terrain/ground/sand-coarse', cliff_snow: 'terrain/cliff/snow-rock', cliff_sand: 'terrain/cliff/sandstone', cliff_swamp: 'terrain/cliff/swamp-roots',
    lip_grass: 'terrain/lip/lip-grass', lip_moss: 'terrain/lip/lip-moss', lip_snow: 'terrain/lip/lip-snow', lip_sand: 'terrain/lip/lip-sand',
    bg_forest: 'scenes/area-forest', bg_coast: 'scenes/area-coast', bg_frost: 'scenes/area-frost', bg_mine: 'scenes/area-mine', bg_quarry: 'scenes/area-quarry', bg_ruins: 'scenes/area-ruins', bg_swamp: 'scenes/area-swamp' };
  const SRC = document.currentScript?.src || '', IMG = {}, CORE = ['grass', 'drygrass', 'dirt', 'cobble', 'snow', 'sand', 'cliff', 'earth'], WANT = CORE.concat(Object.keys(TEXFILE).filter(n => !n.startsWith('bg_')));
  const imgUrl = n => { const f = 'assets/' + (TEXFILE[n] || 'terrain/diorama/' + n) + '.webp'; return SRC ? new URL('../' + f, SRC).href : f };
  const want = n => { if (!IMG[n]) { const im = new Image(); im.src = imgUrl(n); IMG[n] = im } return IMG[n] };
  for (const n of WANT) want(n);
  const loaded = im => im && im.complete && im.naturalWidth > 0;
  const ready = () => Promise.all(WANT.map(n => IMG[n]).map(im => loaded(im) || im.complete ? 1 : new Promise(r => { im.onload = im.onerror = r }))).then(() => ['grass', 'cliff'].every(n => loaded(IMG[n])));
  /* which painted texture each slot uses per biome, and a colour wash on top of it */
  const PAINTED = {
    grass: { top: 'grass', path: 'dirt', lip: 'earth', cliff: 'cliff' },
    forest: { top: 'grass', path: 'dirt', lip: 'earth', cliff: 'cliff', wash: { top: 'rgba(15,40,15,.22)' } },
    hills: { top: 'drygrass', path: 'dirt', lip: 'earth', cliff: 'cliff', wash: { cliff: 'rgba(150,120,80,.18)' } },
    swamp: { top: 'grass', path: 'dirt', lip: 'earth', cliff: 'cliff', wash: { top: 'rgba(25,40,20,.38)', path: 'rgba(20,15,5,.35)' } },
    snow: { top: 'snow', path: 'dirt', lip: 'earth', cliff: 'cliff_snow', wash: { path: 'rgba(220,230,240,.45)', lip: 'rgba(200,215,235,.25)' }, hang: 'lip_snow' },
    sand: { top: 'sand', path: 'dirt', lip: 'earth', cliff: 'cliff_sand', wash: { path: 'rgba(230,200,140,.25)' }, hang: 'lip_sand' }
  };
  PAINTED.grass.hang = PAINTED.forest.hang = PAINTED.hills.hang = 'lip_grass'; PAINTED.swamp.hang = 'lip_moss'; PAINTED.swamp.cliff = 'cliff_swamp';
  delete PAINTED.swamp.wash.cliff;
  /* material slots (cobble, wood, brick, slab) share one painted file each across biomes */
  const MAT_SLOT = { 1: { top: 'cobble', wall: 'brick' }, 2: { top: 'wood', wall: 'wood' }, 3: { top: 'slab', wall: 'brick' }, 4: { top: 'slab', wall: 'brick' } };

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
    m.cobble = ['cobble', { mortar: '#5a5448', stone: '#a8a294' }]; m.wood = ['wood', { base: '#8a6440' }]; m.brick = ['brick', { mortar: '#4a453c', stone: '#9a9282' }];
    m.slab = ['slab', { mortar: '#4e4a42', stone: biome === 'sand' ? '#c8b48c' : biome === 'snow' ? '#b8c0c8' : '#a39d8e', moss: biome === 'snow' ? '#e8eef4' : '#6a7a42' }];
    return m;
  }

  /* ---------- geometry ---------- */
  const T = () => root.TerrainHeight, STEP = () => (T() ? T().STEP : 1), WATER = .8;   // water sits 0.8 sub-level below its bank
  const P = (m, u, v, z) => ({ x: OX + (u + m.origin.u - v - m.origin.v) * HW, y: OY + (u + m.origin.u + v + m.origin.v) * HH - z * PX() });
  const inside = (m, u, v) => u >= 0 && v >= 0 && u < m.w && v < m.h;
  /* drawn corner heights [NW, NE, SE, SW] of a local cell (water: the surface) */
  function cz(m, i) { const c = T() ? T().corners(m, i) : [m.levels[i], m.levels[i], m.levels[i], m.levels[i]]; return m.water && m.water[i] ? c.map(z => z - WATER) : c }
  function poly(g, pts) { g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y)); g.closePath() }
  /* pattern laid on the ground plane: 64 texture px = one cell */
  function groundPattern(g, img, z) { const k = (img.naturalWidth || img.width) / 2, p = g.createPattern(img, 'repeat'); p.setTransform(new DOMMatrix([HW / k, HH / k, -HW / k, HH / k, OX, OY - z * PX()])); return p }
  /* pattern on a wall running along +u (dir 1) or along +v (dir -1): one texture tile = 3 rule levels high (painted) or 32 px per rule level (procedural) */
  function wallPattern(g, img, dir) { const w = img.naturalWidth || img.width, k = w / 2, painted = !!img.naturalWidth, L = PX() * STEP(), p = g.createPattern(img, 'repeat'); p.setTransform(new DOMMatrix([dir * HW / k, HH / k, 0, painted ? L * 3 / w : L / 32, OX, OY])); return p }
  const hexA = (h, a) => hex(h, 1, a);

  /* everything a cell needs to paint, made once per map (textures, per-cell variation) */
  function prepare(m, o) {
    o = o || {};
    const mat = materials(o.biome, o.poi), PT = Object.assign({}, PAINTED[o.biome] || PAINTED.grass); if (o.poi === 'ruin') { PT.path = 'cobble'; PT.cliff = 'brick'; PT.wash = {} }
    const slot = (name, proc, seed) => loaded(IMG[name]) ? IMG[name] : tex(proc[0], proc[1], seed);
    const img = k => slot(PT[k], mat[k], k.length * 97), wash = k => (loaded(IMG[PT[k]]) && PT.wash?.[k]) || null;
    const r = rng(1234), ctx = { o, mat, hang: loaded(IMG[PT.hang]) ? IMG[PT.hang] : null, img, wash, top: img('top'), path: img('path'), lip: img('lip'), cliff: img('cliff'), vary: Array.from({ length: m.w * m.h }, () => r()), tiles: new Map(), pools: o.pools || (() => false) };
    ctx.matTop = { 1: slot('cobble', mat.cobble, 11), 2: slot('wood', mat.wood, 12), 3: slot('slab', mat.slab, 13), 4: slot('slab', mat.slab, 13) };
    ctx.matWall = { 1: slot('brick', mat.brick, 14), 2: slot('wood', mat.wood, 12), 3: slot('brick', mat.brick, 14), 4: slot('brick', mat.brick, 14) };
    return ctx;
  }
  const RAMP_LIGHT = [0, .08, -.1, -.03, .06];   // a slope that faces the light (upper left) is brighter

  function cell(g, m, i, C) {
    const u = i % m.w, v = (i - u) / m.w, lv = m.levels[i], c = cz(m, i), mt = m.mat ? m.mat[i] : 0, water = m.water && m.water[i], ST = STEP();
    const avg = (c[0] + c[1] + c[2] + c[3]) / 4;
    /* walls toward the viewer: +u (right face, in shade) and +v (left face, in light); corner pairs [own a, own b, neighbour a, neighbour b] */
    for (const [du, dv, A, B, NA, NB] of [[1, 0, 1, 2, 0, 3], [0, 1, 3, 2, 0, 1]]) {
      const edge = !inside(m, u + du, v + dv), j = (v + dv) * m.w + u + du, n = edge ? null : cz(m, j);
      const za = c[A], zb = c[B], na = edge ? BASE : n[NA], nb = edge ? BASE : n[NB];
      if (za <= na && zb <= nb) continue;
      const pa = du ? [u + 1, v] : [u, v + 1], pb = [u + 1, v + 1], la = Math.min(za, na), lb = Math.min(zb, nb), drop = Math.max(za - na, zb - nb);
      const pts = [P(m, pa[0], pa[1], za), P(m, pb[0], pb[1], zb), P(m, pb[0], pb[1], lb), P(m, pa[0], pa[1], la)];
      const cliff = edge || drop > ST, dir = du ? -1 : 1, built = mt && !water, wimg = built ? C.matWall[mt] : cliff ? C.cliff : C.lip;
      poly(g, pts); g.fillStyle = wallPattern(g, wimg, dir); g.fill(); const wsh = built ? null : C.wash(cliff ? 'cliff' : 'lip'); if (wsh) { g.fillStyle = wsh; g.fill() }
      /* light: left faces lit, right faces in shade; darker toward the foot (and fading into the dark under the island) */
      const top = Math.min(pts[0].y, pts[1].y), bot = Math.max(pts[2].y, pts[3].y), gr = g.createLinearGradient(0, top, 0, bot), side = du ? .38 : .1;
      gr.addColorStop(0, `rgba(0,0,0,${side})`); gr.addColorStop(1, `rgba(0,0,0,${edge ? .92 : side + .22})`);
      poly(g, pts); g.fillStyle = gr; g.fill();
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(pts[3].x, pts[3].y); g.lineTo(pts[2].x, pts[2].y); g.stroke();
      /* grass / moss / snow hanging over a natural lip: the painted lip strip when loaded, else code blades */
      if (!mt && !water && C.mat.hang && C.mat.top[0] !== 'dirt' && !(m.flat && m.flat[i])) {
        const H = C.hang;
        if (H) { const ex = pts[1].x - pts[0].x, ey = pts[1].y - pts[0].y, tw = H.naturalWidth / 3, ph = (du ? v : u) % 3, hh = 11;   // the strip repeats every 3 cells
          const pat = g.createPattern(H, 'repeat'); pat.setTransform(new DOMMatrix([ex / tw, ey / tw, 0, hh / H.naturalHeight, pts[0].x - ex * ph, pts[0].y - ey * ph]));
          g.save(); g.fillStyle = pat; g.globalAlpha = du ? .8 : 1; g.beginPath(); g.moveTo(pts[0].x, pts[0].y - 1); g.lineTo(pts[1].x, pts[1].y - 1); g.lineTo(pts[1].x, pts[1].y + hh); g.lineTo(pts[0].x, pts[0].y + hh); g.closePath(); g.fill(); g.restore() }
        else { g.fillStyle = hex(C.mat.hang, du ? .72 : .9); g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
          const k = 7; for (let s = 0; s <= k; s++) { const t = s / k, x = pts[0].x + (pts[1].x - pts[0].x) * t, y = pts[0].y + (pts[1].y - pts[0].y) * t; g.lineTo(x, y + 2 + ((s + u * 3 + v) % 3) * 1.6) }
          g.lineTo(pts[1].x, pts[1].y); g.closePath(); g.fill() }
      }
      /* wooden posts under a bridge / boardwalk */
      if (mt === 2) { g.fillStyle = 'rgba(40,26,12,.85)'; for (const t of [.15, .85]) { const x = pts[0].x + (pts[1].x - pts[0].x) * t, y = pts[0].y + (pts[1].y - pts[0].y) * t; g.fillRect(x - 2, y, 4, Math.max(6, (pts[3].y - pts[0].y) + 10)) } }
      /* rim light on the top edge */
      g.strokeStyle = du ? 'rgba(255,245,210,.18)' : 'rgba(255,245,210,.4)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(pts[0].x, pts[0].y); g.lineTo(pts[1].x, pts[1].y); g.stroke();
    }
    /* the top */
    const t4 = [P(m, u, v, c[0]), P(m, u + 1, v, c[1]), P(m, u + 1, v + 1, c[2]), P(m, u, v + 1, c[3])];
    if (water) {
      const swamp = C.o.biome === 'swamp', W = IMG[swamp ? 'swampw' : 'water'];
      if (loaded(W)) { poly(g, t4); g.fillStyle = groundPattern(g, W, avg); g.fill(); poly(g, t4); g.fillStyle = swamp ? 'rgba(20,40,30,.12)' : 'rgba(10,40,70,.1)'; g.fill() }
      else { const gr = g.createLinearGradient(t4[0].x, t4[0].y, t4[2].x, t4[2].y); gr.addColorStop(0, swamp ? '#34584a' : '#2a5a70'); gr.addColorStop(1, swamp ? '#4c7462' : '#3f7f92'); poly(g, t4); g.fillStyle = gr; g.fill() }
      g.strokeStyle = 'rgba(220,245,255,.28)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(t4[3].x, t4[3].y); g.lineTo(t4[0].x, t4[0].y); g.lineTo(t4[1].x, t4[1].y); g.stroke();
      return;
    }
    const isPath = m.flat && m.flat[i] && !mt, timg = mt ? C.matTop[mt] : isPath ? C.path : C.top;
    poly(g, t4); g.fillStyle = groundPattern(g, timg, avg); g.fill(); const tw = mt ? null : C.wash(isPath ? 'path' : 'top'); if (tw) { g.fillStyle = tw; g.fill() }
    /* stairs: step edges across the slope (dark riser + lit nose) */
    const rd = m.ramp ? m.ramp[i] : 0;
    if (rd && m.stair && m.stair[i]) {
      const lowE = { 1: [0, 3], 2: [1, 2], 3: [0, 1], 4: [3, 2] }[rd], highE = { 1: [1, 2], 2: [0, 3], 3: [3, 2], 4: [0, 1] }[rd];
      for (const s of [.25, .5, .75]) { const a = { x: t4[lowE[0]].x + (t4[highE[0]].x - t4[lowE[0]].x) * s, y: t4[lowE[0]].y + (t4[highE[0]].y - t4[lowE[0]].y) * s }, b = { x: t4[lowE[1]].x + (t4[highE[1]].x - t4[lowE[1]].x) * s, y: t4[lowE[1]].y + (t4[highE[1]].y - t4[lowE[1]].y) * s };
        g.strokeStyle = 'rgba(0,0,0,.42)'; g.lineWidth = 2; g.beginPath(); g.moveTo(a.x, a.y + 1.5); g.lineTo(b.x, b.y + 1.5); g.stroke(); g.strokeStyle = 'rgba(255,245,215,.32)'; g.lineWidth = 1; g.beginPath(); g.moveTo(a.x, a.y - .5); g.lineTo(b.x, b.y - .5); g.stroke() }
    }
    /* height light, slope light, a little cell-to-cell variation */
    const lift = avg / ST * .045 + (C.vary[i] - .5) * .05 + (RAMP_LIGHT[rd] || 0);
    poly(g, t4); g.fillStyle = lift >= 0 ? `rgba(255,248,220,${lift})` : `rgba(0,0,0,${-lift})`; g.fill();
    /* ambient shadow from higher ground right behind */
    for (const [du, dv, A, B, Cc, D] of [[-1, 0, 0, 3, 1, 2], [0, -1, 0, 1, 3, 2]]) {
      if (!inside(m, u + du, v + dv)) continue; const n = cz(m, (v + dv) * m.w + u + du), nl = Math.max(...n); if (nl <= avg + .5) continue;
      const from = { x: (t4[A].x + t4[B].x) / 2, y: (t4[A].y + t4[B].y) / 2 }, to = { x: (t4[Cc].x + t4[D].x) / 2, y: (t4[Cc].y + t4[D].y) / 2 };
      const gr = g.createLinearGradient(from.x, from.y, to.x, to.y); gr.addColorStop(0, `rgba(10,8,20,${Math.min(.6, .1 * (nl - avg) + .15)})`); gr.addColorStop(.8, 'rgba(10,8,20,0)');
      poly(g, t4); g.fillStyle = gr; g.fill();
    }
    /* cast shadow: the sun is up and to the left (−u); tall ground up to 4 cells that way shades this top */
    let shade = 0; for (let k = 1; k <= 4; k++) { if (!inside(m, u - k, v)) break; const hz = Math.max(...cz(m, v * m.w + u - k)); if (hz > avg + k * ST * .9) shade = Math.max(shade, Math.min(.34, .1 + (hz - avg - k * ST * .9) * .05)) }
    if (shade) { poly(g, t4); g.fillStyle = `rgba(12,10,30,${shade})`; g.fill() }
    if (C.pools(i)) { poly(g, t4); g.fillStyle = 'rgba(40,90,120,.6)'; g.fill() }
    /* fort tops: a lighter rim so walls read as built */
    if (mt === 3 || mt === 4) { g.strokeStyle = 'rgba(255,250,235,.35)'; g.lineWidth = 1.5; poly(g, t4); g.stroke() }
    /* bridge rails on the sides that face water or the void */
    if (mt === 2) for (const [du, dv, A, B] of [[1, 0, 1, 2], [-1, 0, 0, 3], [0, 1, 3, 2], [0, -1, 0, 1]]) {
      const out = !inside(m, u + du, v + dv) || (m.water && m.water[(v + dv) * m.w + u + du]); if (!out) continue;
      const a = t4[A], b = t4[B]; g.strokeStyle = '#4a2f18'; g.lineWidth = 2; g.beginPath(); g.moveTo(a.x, a.y - 9); g.lineTo(b.x, b.y - 9); g.stroke();
      g.fillStyle = '#5a3a1e'; for (const t of [.1, .5, .9]) { const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t; g.fillRect(x - 1.5, y - 11, 3, 11) }
    }
    /* tactical grid: a faint line so cells read clearly */
    poly(g, t4); g.strokeStyle = 'rgba(0,0,0,.1)'; g.lineWidth = 1; g.stroke();
  }

  function order(m) { const o = []; for (let v = 0; v < m.h; v++) for (let u = 0; u < m.w; u++) o.push(v * m.w + u); return o.sort((a, b) => ((a % m.w) + ((a / m.w) | 0)) - ((b % m.w) + ((b / m.w) | 0)) || (a % m.w) - (b % m.w)) }
  function paint(g, m, o) { const C = m._dio = prepare(m, o); for (const i of order(m)) cell(g, m, i, C) }
  /* one cell (its walls + top) on its own little canvas, for drawing in front of a unit that stands behind it */
  function tile(m, i) {
    const C = m._dio; if (!C) return null; if (C.tiles.has(i)) return C.tiles.get(i);
    const u = i % m.w, v = (i - u) / m.w, c = cz(m, i), lo = Math.min(BASE, ...c) - 1;
    const x0 = Math.floor(P(m, u, v + 1, 0).x) - 4, x1 = Math.ceil(P(m, u + 1, v, 0).x) + 4, y0 = Math.floor(P(m, u, v, Math.max(...c)).y) - 16, y1 = Math.ceil(P(m, u + 1, v + 1, lo).y) + 4;
    const cv = document.createElement('canvas'); cv.width = x1 - x0; cv.height = y1 - y0; const g = cv.getContext('2d'); g.translate(-x0, -y0); cell(g, m, i, C);
    const t = { canvas: cv, x: x0, y: y0, w: x1 - x0, h: y1 - y0, top: P(m, u, v, Math.max(...c)).y }; C.tiles.set(i, t); return t;
  }

  /* ground-plane pattern for the host's slow patches (mud / snow / sand) at height z (sub-levels); null until the picture has loaded */
  function pattern(g, name, z) { const im = IMG[name]; return loaded(im) ? groundPattern(g, im, z || 0) : null }
  /* the area's painted backdrop (assets/scenes), cover-fitted, softened and darkened so the floating field stays the focus */
  const BG = { forest: 'bg_forest', grass: 'bg_forest', hills: 'bg_quarry', swamp: 'bg_swamp', snow: 'bg_frost', sand: 'bg_coast' }, bgCache = {};
  function backdrop(g, w, h, biome, poi, night) {
    const n = poi === 'ruin' ? 'bg_ruins' : poi === 'mine' ? 'bg_mine' : BG[biome] || 'bg_forest', im = want(n); if (!loaded(im)) return false;
    const k = n + w + 'x' + h + night; let c = bgCache[k];
    if (!c) { c = document.createElement('canvas'); c.width = w; c.height = h; const q = c.getContext('2d'), sc = Math.max(w / im.naturalWidth, h / im.naturalHeight), iw = im.naturalWidth * sc, ih = im.naturalHeight * sc;
      q.filter = 'blur(5px) saturate(.9)'; q.drawImage(im, (w - iw) / 2, (h - ih) / 2, iw, ih); q.filter = 'none';
      const gr = q.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, night ? 'rgba(6,8,26,.78)' : 'rgba(8,12,22,.42)'); gr.addColorStop(1, night ? 'rgba(2,3,12,.9)' : 'rgba(4,6,14,.72)'); q.fillStyle = gr; q.fillRect(0, 0, w, h);
      for (const x in bgCache) if (x !== k) delete bgCache[x]; bgCache[k] = c }
    g.drawImage(c, 0, 0); return true;
  }
  /* backdrop behind the floating field */
  function sky(g, w, h, biome, night, poi) {
    if (backdrop(g, w, h, biome, poi, night ? 1 : 0)) return;
    const C = night ? ['#0d1428', '#05070f'] : { snow: ['#5c6f86', '#1c2430'], sand: ['#6a5a48', '#1e1812'], swamp: ['#2a3a34', '#0a100e'], hills: ['#4a5a6a', '#141a22'] }[biome] || ['#2f4a5e', '#0b121a'];
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, C[0]); gr.addColorStop(1, C[1]); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    const rg = g.createRadialGradient(w / 2, h * .45, 0, w / 2, h * .45, Math.max(w, h) * .6); rg.addColorStop(0, night ? 'rgba(120,110,200,.12)' : 'rgba(255,235,190,.14)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = rg; g.fillRect(0, 0, w, h);
  }
  /* screen-space colour grade over the whole battle: warm sun from the upper left, cool shade toward the lower right, per biome */
  const GRADE = { grass: ['255,214,150', '40,60,110'], forest: ['220,240,170', '20,50,40'], hills: ['255,200,140', '70,60,90'], swamp: ['200,230,170', '20,40,40'], snow: ['230,240,255', '60,80,130'], sand: ['255,200,120', '110,70,60'] };
  function grade(g, w, h, biome, night) {
    const [sun, shade] = GRADE[biome] || GRADE.grass; g.save(); g.globalCompositeOperation = 'soft-light';
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, `rgba(${night ? '120,130,220' : sun},.55)`); gr.addColorStop(.55, 'rgba(128,128,128,0)'); gr.addColorStop(1, `rgba(${shade},${night ? .7 : .5})`);
    g.fillStyle = gr; g.fillRect(0, 0, w, h); g.restore();
  }

  /* ---------- landforms stamped into a height map: plateaus with cliffs and a stair, so fights have real high ground ---------- */
  /* number of separate walkable areas (a pocket sealed off by trees already counts as one); a stamp may never add an area */
  function areas(m) {
    const n = m.w * m.h, W = T() ? T().STEP : 1, seen = new Uint8Array(n); let count = 0;
    for (let s = 0; s < n; s++) { if (seen[s] || m.blocked[s]) continue; count++; const q = [s]; seen[s] = 1;
      while (q.length) { const i = q.pop(), u = i % m.w, v = (i - u) / m.w; for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = u + du, b = v + dv; if (a < 0 || b < 0 || a >= m.w || b >= m.h) continue; const j = b * m.w + a; if (seen[j] || m.blocked[j] || Math.abs(m.levels[i] - m.levels[j]) > W) continue; seen[j] = 1; q.push(j) } } }
    return count;
  }
  const walkOK = (m, before = 1) => areas(m) <= before;
  function ensure(m) { const n = m.w * m.h; for (const k of ['ramp', 'stair', 'mat', 'water']) if (!m[k]) m[k] = new Uint8Array(n) }
  const rampTo = (du, dv) => du > 0 ? 1 : du < 0 ? 2 : dv > 0 ? 3 : 4;
  /* o: seed · keep(u,v) cells to leave alone · count · fort (0..1 share of plateaus built as stone forts with slab stairs) */
  function landforms(m, o) {
    ensure(m);
    const r = rng(o.seed || 99), keep = o.keep || (() => false), tries = o.count || 2, ST = STEP(), A0 = Math.max(1, areas(m)), snap = () => ['levels', 'blocked', 'ramp', 'stair', 'mat'].map(k => Uint8Array.from(m[k]));
    let made = 0;
    for (let k = 0; k < 40 && made < tries; k++) {
      const w = 3 + ((r() * 3) | 0), h = 3 + ((r() * 2) | 0), u0 = 1 + ((r() * (m.w - w - 2)) | 0), v0 = 1 + ((r() * (m.h - h - 2)) | 0);
      let bad = false, hi = 0; for (let v = v0; v < v0 + h && !bad; v++) for (let u = u0; u < u0 + w; u++) { const i = v * m.w + u; if (m.flat[i] || keep(u, v) || m.water[i]) { bad = true; break } hi = Math.max(hi, m.levels[i]) }
      if (bad) continue;
      const fort = r() < (o.fort || 0), top = Math.min(m.maxLevel, Math.max(2 * ST, hi + 2 * ST + (fort ? ST : 0))), save = snap();
      for (let v = v0; v < v0 + h; v++) for (let u = u0; u < u0 + w; u++) { const i = v * m.w + u; m.levels[i] = top; m.ramp[i] = 0; if (fort) m.mat[i] = 3 }
      /* a stair: walk out from the middle of one side; each step cell is a ramp one rule level lower than the last */
      const sides = [[0, 1], [1, 0], [0, -1], [-1, 0]], [su, sv] = sides[(r() * 4) | 0];
      let u = su > 0 ? u0 + w : su < 0 ? u0 - 1 : u0 + (w >> 1), v = sv > 0 ? v0 + h : sv < 0 ? v0 - 1 : v0 + (h >> 1), lvl = top - 1, stairs = [];
      while (u >= 0 && v >= 0 && u < m.w && v < m.h && lvl >= 1) { const i = v * m.w + u; if (m.flat[i] || m.water[i]) break; if (m.levels[i] >= lvl) break; m.levels[i] = lvl; m.blocked[i] = 0; m.ramp[i] = rampTo(-su, -sv); m.stair[i] = 1; m.mat[i] = fort ? 4 : 0; stairs.push(i); lvl -= ST; u += su; v += sv }
      if (!walkOK(m, A0)) { ['levels', 'blocked', 'ramp', 'stair', 'mat'].forEach((k, j) => m[k].set(save[j])); continue }
      m.stairs = (m.stairs || []).concat(stairs); made++;
    }
    return made;
  }
  /* rivers with bridges, and broken walls. Returns { clear: [i] (walkable now: drop any prop), block: [i] (water / wall: blocked, no prop) }.
     o: seed · keep(u,v) · biome · poi · pools(i) (pool cells become real water) */
  function structures(m, o) {
    ensure(m);
    const r = rng((o.seed || 7) ^ 0x7f4a7c15), keep = o.keep || (() => false), ST = STEP(), n = m.w * m.h, clear = new Set(), block = new Set(), A0 = Math.max(1, areas(m));
    const snap = () => ['levels', 'blocked', 'ramp', 'stair', 'mat', 'water'].map(k => Uint8Array.from(m[k])), undo = s => ['levels', 'blocked', 'ramp', 'stair', 'mat', 'water'].forEach((k, j) => m[k].set(s[j]));
    if (o.pools) for (let i = 0; i < n; i++) if (o.pools(i)) { m.water[i] = 1; m.blocked[i] = 1; m.ramp[i] = 0; block.add(i) }
    /* river across the field (along u or v), level 0, a bridge where the road crosses (or at the middle) */
    const riverP = o.poi ? 0 : { swamp: .8, grass: .45, forest: .4, hills: .2 }[o.biome] || 0;
    if (r() < riverP) for (let attempt = 0; attempt < 6; attempt++) {
      const s = snap(), along = r() < .5, mid = (along ? m.h : m.w) >> 1, row = mid + ((r() * 5) | 0) - 2, wide = r() < .5 ? 2 : 1, cells = [], L = along ? m.w : m.h;
      for (let k = 0; k < L; k++) for (let d = 0; d < wide; d++) { const u = along ? k : row + d, v = along ? row + d : k; if (inside(m, u, v) && !keep(u, v)) cells.push(v * m.w + u) }
      const pos = i => along ? i % m.w : (i / m.w) | 0, at = k => cells.filter(i => pos(i) === k);
      let bridges = cells.filter(i => m.flat[i]);
      if (!bridges.length || attempt >= 2) bridges = bridges.concat(at(L >> 1));          // later tries: more crossings
      if (attempt >= 3) bridges = bridges.concat(at(2 + ((r() * (L - 4)) | 0)), at(attempt % 2 ? 2 : L - 3));
      for (const i of cells) { m.ramp[i] = 0; m.stair[i] = 0; if (bridges.includes(i)) { m.levels[i] = Math.max(1, Math.min(ST, m.levels[i])); m.mat[i] = 2; m.blocked[i] = 0; m.water[i] = 0 } else { m.levels[i] = 0; m.water[i] = 1; m.blocked[i] = 1; m.mat[i] = 0 } }
      /* banks beside a bridge end come down to the deck so it can be walked on; stairs cut by the river lose their slope */
      for (const i of bridges) { const u = i % m.w, v = (i - u) / m.w; for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inside(m, u + du, v + dv)) continue; const j = (v + dv) * m.w + u + du; if (!m.water[j] && !bridges.includes(j) && Math.abs(m.levels[j] - m.levels[i]) > ST) { m.levels[j] = m.levels[i] + ST; m.ramp[j] = 0; m.stair[j] = 0; m.blocked[j] = 0 } } }
      if (walkOK(m, A0)) { cells.forEach(i => (m.water[i] ? block : clear).add(i)); for (const i of bridges) { const u = i % m.w, v = (i - u) / m.w; for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (inside(m, u + du, v + dv) && !m.water[(v + dv) * m.w + u + du]) clear.add((v + dv) * m.w + u + du) } break }
      undo(s);
    }
    /* broken walls: short brick runs, two to three rule levels tall, with gaps */
    const walls = Math.round((o.poi === 'ruin' ? 3 : { hills: 2, sand: 2, snow: 1 }[o.biome] ?? (r() < .3 ? 1 : 0)) * (o.scale || 1));
    for (let k = 0, made = 0; k < 30 && made < walls; k++) {
      const s = snap(), along = r() < .5, len = 3 + ((r() * 3) | 0), u0 = 1 + ((r() * (m.w - 2)) | 0), v0 = 1 + ((r() * (m.h - 2)) | 0), add = (2 + ((r() * 2) | 0)) * ST, run = [];
      for (let t = 0; t < len; t++) { const u = along ? u0 + t : u0, v = along ? v0 : v0 + t; if (!inside(m, u, v)) break; const i = v * m.w + u; if (keep(u, v) || m.flat[i] || m.water[i] || m.stair[i] || (m.mat[i] && m.mat[i] !== 3)) break; if (t && r() < .2) continue; run.push(i) }
      if (run.length < 2) continue;
      const base = Math.max(...run.map(i => m.levels[i])); for (const i of run) { m.levels[i] = Math.min(m.maxLevel, base + add); m.blocked[i] = 1; m.mat[i] = 3; m.ramp[i] = 0 }
      if (walkOK(m, A0)) { run.forEach(i => block.add(i)); made++ } else undo(s);
    }
    return { clear: [...clear], block: [...block] };
  }
  /* the same map turned by quarter turns (view space): cell (u,v) → (−v, u) per turn around the field centre; ramps turn with it */
  function rotate(m, turns) {
    turns = ((turns % 4) + 4) % 4; if (!turns) return m;
    const n = m.w * m.h, out = { ...m, levels: new Uint8Array(n), flat: new Uint8Array(n), blocked: new Uint8Array(n), ramp: new Uint8Array(n), stair: new Uint8Array(n), mat: new Uint8Array(n), water: new Uint8Array(n), _dio: null };
    const R = { 1: 3, 3: 2, 2: 4, 4: 1 };   // +u → +v → −u → −v
    for (let v = 0; v < m.h; v++) for (let u = 0; u < m.w; u++) {
      let a = u, b = v; for (let t = 0; t < turns; t++) { const na = m.w - 1 - b; b = a; a = na }
      const i = v * m.w + u, j = b * m.w + a; for (const k of ['levels', 'flat', 'blocked', 'stair', 'mat', 'water']) if (m[k]) out[k][j] = m[k][i];
      let d = m.ramp ? m.ramp[i] : 0; for (let t = 0; t < turns && d; t++) d = R[d]; out.ramp[j] = d;
    }
    return out;
  }

  root.FieldDiorama = { paint, tile, sky, grade, pattern, landforms, structures, rotate, materials, ready, walkOK, areas, BASE, WATER };
})(typeof globalThis !== 'undefined' ? globalThis : this);
