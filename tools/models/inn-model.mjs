/* v98.134 · Low-poly 3D model of the inn "The Golden Antler" (โรงแรมเขากวางทอง), modelled after the decorated inn in the village.
   Units = metres, Y up, the front (entrance) faces +Z (toward the game camera, which looks from the south-east).
   buildInn(THREE) → THREE.Group. Used by tools/models/build-glb.mjs (writes assets/models/inn.glb) and by model-viewer.html.
   Every part is named (Blender keeps the names). Night lights = materials named "glow-*" (emissive) + lights named "lamp-*". */
export function buildInn(THREE) {
  const root = new THREE.Group(); root.name = 'inn';
  const M = {};
  const mat = (name, color, o = {}) => M[name] || (M[name] = Object.assign(new THREE.MeshStandardMaterial({ color, roughness: .85, metalness: 0, flatShading: true, ...o }), { name }));
  const C = {
    plaster: mat('plaster', 0xe9dcc0), timber: mat('timber', 0x5a3a20), stone: mat('stone', 0xb9ad98), stoneDark: mat('stone-dark', 0x8e8473),
    roof: mat('roof-tiles', 0xb4462e), roofDark: mat('roof-ridge', 0x7d2c1d), wood: mat('wood', 0x8a5a32), woodLight: mat('wood-light', 0xa8763f),
    door: mat('door', 0x6b4022), iron: mat('iron', 0x2b2b2e, { roughness: .6, metalness: .4 }), cobble: mat('cobble', 0x8c8478), paving: mat('paving', 0xc9ab7c),
    leaf: mat('leaf', 0x4f7d34), leafLight: mat('leaf-light', 0x6e9a3e), flowerR: mat('flower-red', 0xc8423a), flowerW: mat('flower-white', 0xf1ead6),
    shutter: mat('shutter', 0x4d6b3c), awnRed: mat('awning-red', 0xc4473a), awnWhite: mat('awning-white', 0xf1e6cf), gold: mat('gold', 0xc9a04a, { metalness: .5, roughness: .45 }),
    window: mat('glow-window', 0xffc76a, { emissive: 0xffa53a, emissiveIntensity: .25 }), lantern: mat('glow-lantern', 0xffd88a, { emissive: 0xffb04a, emissiveIntensity: .35 })
  };
  const add = (mesh, parent = root) => (parent.add(mesh), mesh);
  function box(name, w, h, d, m, x, y, z, parent) { const g = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); g.name = name; g.position.set(x, y + h / 2, z); g.castShadow = g.receiveShadow = true; return add(g, parent) }
  function cyl(name, r1, r2, h, m, x, y, z, seg = 8, parent) { const g = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), m); g.name = name; g.position.set(x, y + h / 2, z); g.castShadow = true; return add(g, parent) }
  function cone(name, r, h, m, x, y, z, seg = 7, parent) { const g = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), m); g.name = name; g.position.set(x, y + h / 2, z); g.castShadow = true; return add(g, parent) }
  function blob(name, r, m, x, y, z, parent) { const g = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), m); g.name = name; g.position.set(x, y, z); g.castShadow = true; return add(g, parent) }
  /* a gable roof: ridge along X (axis 'x') or along Z (axis 'z'); w × d footprint incl. overhang, h = rise */
  function gable(name, w, d, h, x, y, z, axis = 'x', parent) {
    const a = axis === 'x', L = a ? w : d, S = a ? d : w, s = new THREE.Shape();
    s.moveTo(-S / 2, 0); s.lineTo(S / 2, 0); s.lineTo(0, h); s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: L, bevelEnabled: false }); geo.translate(0, 0, -L / 2); if (a) geo.rotateY(Math.PI / 2);
    const g = new THREE.Mesh(geo, C.roof); g.name = name; g.position.set(x, y, z); g.castShadow = g.receiveShadow = true; add(g, parent);
    const ridge = box(name + '-ridge', a ? L + .1 : .22, .18, a ? .22 : L + .1, C.roofDark, x, y + h - .09, z, parent);
    return g;
  }
  /* a window: glowing pane, timber frame, cross bar, optional shutters; on a wall facing +Z (face 'z') or +X (face 'x') */
  function win(name, x, y, z, w = .8, h = 1.1, face = 'z', shutters = false, parent) {
    const t = .06, gr = new THREE.Group(); gr.name = name; gr.position.set(x, y, z); if (face === 'x') gr.rotation.y = Math.PI / 2; add(gr, parent);
    box('pane', w, h, .05, C.window, 0, 0, 0, gr);
    box('frame-top', w + .16, .1, .1, C.timber, 0, h, .02, gr); box('frame-sill', w + .24, .1, .16, C.timber, 0, -.08, .04, gr);
    box('frame-l', .08, h, .1, C.timber, -w / 2 - .04, 0, .02, gr); box('frame-r', .08, h, .1, C.timber, w / 2 + .04, 0, .02, gr);
    box('mullion', t, h, .07, C.timber, 0, 0, .03, gr); box('transom', w, t, .07, C.timber, 0, h * .55, .03, gr);
    if (shutters) { box('shutter-l', w * .5, h, .06, C.shutter, -w * .78, 0, .05, gr); box('shutter-r', w * .5, h, .06, C.shutter, w * .78, 0, .05, gr) }
    return gr;
  }
  function lantern(name, x, y, z, parent) { const g = new THREE.Group(); g.name = name; g.position.set(x, y, z); add(g, parent);
    box('cage', .26, .34, .26, C.lantern, 0, 0, 0, g); box('cap', .34, .08, .34, C.iron, 0, .34, 0, g); cone('top', .2, .16, C.iron, 0, .42, 0, 4, g);
    const L = new THREE.PointLight(0xffb45a, 0, 6, 2); L.name = 'lamp-' + name; L.position.set(0, .17, 0); g.add(L); return g }
  function vine(name, x, y, z, n = 5, spread = .5, parent) { for (let i = 0; i < n; i++) { const a = i * 2.4; blob(name + '-' + i, .22 + (i % 3) * .05, i % 2 ? C.leaf : C.leafLight, x + Math.sin(a) * spread, y + i * .32, z + Math.cos(a) * .12, parent); if (i % 2 === 0) blob(name + '-fl' + i, .07, i % 4 ? C.flowerW : C.flowerR, x + Math.sin(a) * spread + .12, y + i * .32 + .12, z + .2, parent) } }
  function barrel(name, x, z, h = .9, parent) { const g = cyl(name, .32, .28, h, C.wood, x, 0, z, 10, parent); cyl(name + '-hoop1', .335, .335, .05, C.iron, x, h * .2, z, 10, parent); cyl(name + '-hoop2', .335, .335, .05, C.iron, x, h * .75, z, 10, parent); return g }
  function shrubPot(name, x, z, parent) { cyl(name + '-tub', .34, .3, .5, C.wood, x, 0, z, 10, parent); cone(name + '-tree', .38, 1.1, C.leaf, x, .45, z, 7, parent); blob(name + '-fl', .06, C.flowerR, x + .15, .9, z + .25, parent) }
  function table(name, x, z, rot = 0, parent) { const g = new THREE.Group(); g.name = name; g.position.set(x, 0, z); g.rotation.y = rot; add(g, parent);
    box('top', 1.6, .08, .8, C.woodLight, 0, .72, 0, g); for (const sx of [-.65, .65]) box('leg' + sx, .1, .72, .7, C.wood, sx, 0, 0, g);
    for (const sz of [-.65, .65]) { box('bench' + sz, 1.6, .06, .3, C.woodLight, 0, .42, sz, g); for (const sx of [-.6, .6]) box('bleg', .08, .42, .25, C.wood, sx, 0, sz, g) } return g }

  /* ---------- ground: cobbled yard, paved street edge ---------- */
  box('yard-cobbles', 22, .1, 16, C.cobble, 1, -.1, 1);
  box('street-paving', 26, .06, 4, C.paving, 1, -.1, 11);

  /* ---------- main hall: stone ground floor, timber-framed upper floor, steep roof ---------- */
  const MAIN = new THREE.Group(); MAIN.name = 'main-hall'; add(MAIN);
  const W = 9, D = 7, H1 = 3.2, H2 = 2.8;
  box('ground-floor', W, H1, D, C.stone, 0, 0, 0, MAIN);
  box('upper-floor', W + .3, H2, D + .3, C.plaster, 0, H1, 0, MAIN);
  box('floor-beam', W + .45, .25, D + .45, C.timber, 0, H1 - .05, 0, MAIN);
  for (const x of [-4.6, -2.3, 0, 2.3, 4.6]) box('post-' + x, .2, H2, .2, C.timber, x, H1, D / 2 + .17, MAIN);
  for (const z of [-3.6, 0, 3.6]) box('post-side-' + z, .2, H2, .2, C.timber, W / 2 + .17, H1, z, MAIN);
  box('rail-mid', W + .3, .16, .2, C.timber, 0, H1 + 1.25, D / 2 + .17, MAIN);
  box('rail-mid-side', .2, .16, D + .3, C.timber, W / 2 + .17, H1 + 1.25, 0, MAIN);
  for (const [x, s] of [[-3.45, 1], [3.45, -1]]) { const b = box('brace', .14, 1.6, .14, C.timber, x, H1 + .1, D / 2 + .2, MAIN); b.rotation.z = .55 * s }
  gable('main-roof', W + 1.2, D + 1.4, 3.6, 0, H1 + H2, 0, 'x', MAIN);
  // dormers
  for (const x of [-2.3, 2.3]) { const d = new THREE.Group(); d.name = 'dormer'; d.position.set(x, H1 + H2 + .2, 2.4); MAIN.add(d);
    box('dormer-wall', 1.4, 1.3, 1.6, C.plaster, 0, 0, 0, d); gable('dormer-roof', 1.8, 2.2, .9, 0, 1.3, .05, 'z', d); win('dormer-window', 0, .3, .82, .6, .7, 'z', false, d) }
  // chimney
  box('chimney', .9, 3.2, .9, C.stone, -3, H1 + H2 + 1.2, -1.2, MAIN); box('chimney-cap', 1.1, .18, 1.1, C.stoneDark, -3, H1 + H2 + 4.4, -1.2, MAIN);
  // ground-floor windows (front + side) and upper windows with shutters
  for (const x of [-3.2, 3.2]) win('window-front-' + x, x, 1.1, D / 2 + .03, .9, 1.2, 'z', false, MAIN);
  for (const x of [-3.4, -1.15, 1.15, 3.4]) win('window-upper-' + x, x, H1 + .6, D / 2 + .19, .8, 1.15, 'z', true, MAIN);
  for (const z of [-1.8, 1.8]) { win('window-side-' + z, W / 2 + .03, 1.1, z, .9, 1.2, 'x', false, MAIN); win('window-side-up-' + z, W / 2 + .19, H1 + .6, z, .8, 1.15, 'x', true, MAIN) }
  // arched entrance, double door, steps
  const ENT = new THREE.Group(); ENT.name = 'entrance'; ENT.position.set(0, 0, D / 2); MAIN.add(ENT);
  box('door-surround', 2.4, 2.9, .3, C.stoneDark, 0, 0, .05, ENT);
  box('door', 1.8, 2.4, .1, C.door, 0, .2, .22, ENT); box('door-split', .06, 2.4, .12, C.timber, 0, .2, .24, ENT);
  { const sh = new THREE.Shape(); sh.absarc(0, 0, .9, 0, Math.PI, false); sh.closePath(); const arch = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: .1, bevelEnabled: false }), C.door); arch.name = 'door-arch'; arch.position.set(0, 2.6, .17); ENT.add(arch);
    const ring = new THREE.Shape(); ring.absarc(0, 0, 1.2, 0, Math.PI, false); ring.closePath(); const st = new THREE.Mesh(new THREE.ExtrudeGeometry(ring, { depth: .3, bevelEnabled: false }), C.stoneDark); st.name = 'arch-stones'; st.position.set(0, 2.9, -.1); ENT.add(st) }
  for (const x of [-.3, .3]) box('door-ring', .12, .12, .05, C.iron, x, 1.3, .3, ENT);
  for (let i = 0; i < 3; i++) box('step-' + i, 3 - i * .3, .18, 1.6 - i * .45, C.stone, 0, .18 * i, .9 + (1.6 - i * .45) / 2 - .3, ENT);
  // hanging sign: iron bracket + barrel sign
  box('sign-bracket', .08, .08, 1.6, C.iron, -1.6, 3.1, .9, ENT); box('sign-board', .9, .9, .08, C.door, -1.6, 2.15, 1.5, ENT); cyl('sign-barrel', .25, .25, .5, C.gold, -1.6, 2.35, 1.55, 10, ENT).rotation.z = Math.PI / 2;
  // lantern posts and wall lanterns
  for (const x of [-1.9, 1.9]) { box('lamp-post', .32, .9, .32, C.wood, x, 0, 2.5, ENT); lantern('lantern-post-' + x, x, .95, 2.5, ENT) }
  for (const x of [-1.45, 1.45]) lantern('lantern-wall-' + x, x, 2.2, .35, ENT);
  for (const x of [-2.7, 2.7]) shrubPot('door-shrub-' + x, x, 1.6, ENT);
  // balcony over the entrance with flower boxes
  const BAL = new THREE.Group(); BAL.name = 'balcony'; BAL.position.set(0, H1, D / 2 + .3); MAIN.add(BAL);
  box('balcony-floor', 3.4, .14, 1.1, C.wood, 0, 0, .55, BAL);
  for (let i = 0; i <= 10; i++) box('baluster', .06, .8, .06, C.wood, -1.6 + i * .32, .14, 1.05, BAL);
  box('balcony-rail', 3.4, .08, .1, C.wood, 0, .9, 1.05, BAL);
  for (const x of [-1.1, 0, 1.1]) { box('flowerbox', .8, .22, .25, C.wood, x, .95, 1.15, BAL); for (let k = 0; k < 3; k++) blob('flowers', .14, k % 2 ? C.flowerR : C.leafLight, x - .25 + k * .25, 1.25, 1.15, BAL) }
  vine('vine-entrance-l', -1.4, .3, D / 2 + .25, 7, .25, MAIN); vine('vine-entrance-r', 1.4, .3, D / 2 + .25, 7, .25, MAIN);

  /* ---------- left: covered terrace with tables ---------- */
  const TER = new THREE.Group(); TER.name = 'terrace'; TER.position.set(-7.6, 0, 1.2); add(TER);
  box('terrace-deck', 5.6, .16, 6.2, C.stoneDark, 0, 0, 0, TER);
  for (const [x, z] of [[-2.6, -2.9], [2.6, -2.9], [-2.6, 2.9], [2.6, 2.9], [0, 2.9]]) box('terrace-post', .22, 2.7, .22, C.wood, x, .16, z, TER);
  box('terrace-beam-front', 5.6, .2, .24, C.wood, 0, 2.8, 2.9, TER); box('terrace-beam-back', 5.6, .2, .24, C.wood, 0, 2.8, -2.9, TER);
  const shed = new THREE.Mesh(new THREE.BoxGeometry(6.4, .14, 7), C.roof); shed.name = 'terrace-roof'; shed.position.set(0, 3.25, 0); shed.rotation.x = -.18; shed.castShadow = true; TER.add(shed);
  table('terrace-table-1', -1.2, .9, Math.PI / 2, TER); table('terrace-table-2', 1.2, -1.1, Math.PI / 2, TER);
  for (const [x, z] of [[-1.2, .9], [1.2, -1.1]]) { cyl('mug', .07, .07, .14, C.woodLight, x - .2, .8, z, 6, TER); lantern('table-lantern-' + x, x + .25, .8, z, TER) }
  for (const x of [-2.6, 0, 2.6]) { lantern('terrace-lantern-' + x, x, 2.35, 2.9, TER); vine('terrace-vine-' + x, x, .3, 3.05, 7, .18, TER) }
  barrel('terrace-barrel', -2.2, -2.4, .9, TER);

  /* ---------- right wing: lower annex with a striped market awning (the drinks counter) ---------- */
  const WING = new THREE.Group(); WING.name = 'east-wing'; WING.position.set(7.2, 0, -.6); add(WING);
  box('wing-walls', 5, 2.8, 5.6, C.plaster, 0, 0, 0, WING); box('wing-base', 5.1, .7, 5.7, C.stone, 0, 0, 0, WING);
  for (const x of [-2.5, 0, 2.5]) box('wing-post', .18, 2.8, .18, C.timber, x, 0, 2.86, WING);
  gable('wing-roof', 5.8, 6.6, 2.4, 0, 2.8, 0, 'x', WING);
  win('wing-window', 1.4, 1.2, 2.83, .9, 1, 'z', true, WING);
  box('counter', 3.2, 1.05, .8, C.wood, -.6, 0, 3.4, WING); box('counter-top', 3.4, .08, .95, C.woodLight, -.6, 1.05, 3.4, WING);
  for (let i = 0; i < 3; i++) cyl('counter-keg', .2, .2, .38, C.wood, -1.6 + i * .9, 1.13, 3.4, 8, WING);
  for (let i = 0; i < 8; i++) { const s = box('awning-stripe', .42, .06, 1.7, i % 2 ? C.awnWhite : C.awnRed, -2.05 + i * .42, 2.35, 3.55, WING); s.rotation.x = .38 }
  for (const x of [-2.1, .9]) box('awning-post', .1, 2.4, .1, C.wood, x, 0, 4.25, WING);
  lantern('wing-lantern', 1.5, 2.1, 3, WING);
  vine('wing-vine', 2.3, .2, 3.05, 8, .22, WING);
  box('wing-balcony', 5, .14, 1, C.wood, 0, 2.8, 3.2, WING);

  /* ---------- yard props: picnic tables, woodpile, crates, barrels ---------- */
  table('yard-table-1', 6.4, 6.2, -.2); table('yard-table-2', 9.4, 4.2, -.2);
  const WP = new THREE.Group(); WP.name = 'woodpile'; WP.position.set(3.9, 0, 5.4); add(WP);
  for (let r = 0; r < 3; r++) for (let i = 0; i < 4 - r; i++) { const l = cyl('log', .17, .17, 1.1, C.woodLight, -.5 + i * .36 + r * .18, .17 + r * .3, 0, 7, WP); l.rotation.x = Math.PI / 2; l.position.y = .17 + r * .3 }
  for (const [x, z, s] of [[5.2, 3.1, .7], [5.9, 3.3, .6], [5.5, 3.2, .5]]) box('crate', s, s, s, C.woodLight, x, z === 3.2 ? .6 : 0, z);
  barrel('yard-barrel-1', 9.8, 2.6); barrel('yard-barrel-2', 10.4, 2.9, .75);

  /* ---------- fence: stone posts + black iron railings around the yard front ---------- */
  const FN = new THREE.Group(); FN.name = 'fence'; add(FN);
  const run = (x0, z0, x1, z1, gapFrom, gapTo) => { const n = Math.round(Math.hypot(x1 - x0, z1 - z0) / 2); for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, z = z0 + (z1 - z0) * t; if (gapFrom != null && t > gapFrom && t < gapTo) continue;
      box('fence-post', .32, 1.1, .32, C.awnWhite, x, 0, z, FN); cone('fence-post-cap', .24, .3, C.awnWhite, x, 1.1, z, 4, FN);
      if (i < n && !(gapFrom != null && (i + 1) / n > gapFrom && (i + 1) / n < gapTo)) { const mx = x + (x1 - x0) / n / 2, mz = z + (z1 - z0) / n / 2, len = Math.hypot(x1 - x0, z1 - z0) / n, ang = Math.atan2(z1 - z0, x1 - x0);
        const low = box('fence-wall', len, .35, .26, C.stone, mx, 0, mz, FN); low.rotation.y = -ang; for (const h of [.55, .95]) { const r = box('fence-rail', len, .04, .04, C.iron, mx, h, mz, FN); r.rotation.y = -ang }
        for (let k = 1; k < 6; k++) { const bx = x + (x1 - x0) / n * k / 6, bz = z + (z1 - z0) / n * k / 6; box('fence-bar', .03, .65, .03, C.iron, bx, .35, bz, FN) } } } };
  run(-10.6, -3, -10.6, 8.5); run(-10.6, 8.5, 11.5, 8.5, .44, .56);

  return root;
}
