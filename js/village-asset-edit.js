/* v82 · Village Build Mode — click a place, then edit everything that belongs to it in one panel:
   building art (image, size, tilt, facing), outer frame (plot size, gate, border per side), sub-assets, entrance.
   Plus per-map characters (size of everyone / each one, swapped image). Map-level tools stay in the top bar.
   Edits are stored in the village layout (TownUX snapshot "assets"), so undo, export/import, reset and push include them.
   Layers (v87): edit[key].z = item layer, buildings[id].z = the building's layer — one integer scale per place (higher draws on top,
   equal → depth) · buildings[id].pz = layer of the whole place against other places (equal → depth).
   Data: edit[key] = {du,dv,s,r,f,z,layer(old px offset),kind,hide} · added[] = {id,owner,du,dv,kind} · buildings[id] = {sx,sy,kx,ky,dx,dy,art}
         frames[id] = {left,right,back,front,gate,sides:{back,left,right,front}} · cast = {all, hero:{s,img,back,flip}, npc:{s}, 'npc:<id>':{…}} */
(function() {
 'use strict';
 const STORE = 'project-a-village-editor-v67',
  UX = window.TownUX,
  copy = x => JSON.parse(JSON.stringify(x)),
  num = (v, a, b, d) => Math.max(a, Math.min(b, Number.isFinite(+v) ? +v : d));
 let courtDraw = false;
 let data = {
   edit: {},
   added: [],
   buildings: {},
   frames: {},
   cast: {}
  },
  place = null,
  frame = [],
  drag = null,
  ckPending = false,
  guides = true;
 const empty = () => ({
  edit: {},
  added: [],
  buildings: {},
  frames: {},
  cast: {}
 });

 function set(v) {
  data = empty();
  if (!v || typeof v !== 'object') window.TownPaint?.load(null);
  if (v && typeof v === 'object') {
   window.TownPaint?.load(v.ground || null);
   if (v.edit && typeof v.edit === 'object') data.edit = copy(v.edit);
   if (Array.isArray(v.added)) data.added = copy(v.added).filter(a => a && a.id && a.owner && a.kind);
   if (v.buildings && typeof v.buildings === 'object') data.buildings = copy(v.buildings);
   // Repair legacy values written by the old percentage bug (e.g. 100 instead of 1.00).
   for (const b of Object.values(data.buildings)) if (b && typeof b === 'object') for (const k of ['ix','iy']) if (Number.isFinite(b[k]) && b[k] > 2) b[k] = Math.max(.5, Math.min(2, b[k] / 100));
   if (v.frames && typeof v.frames === 'object') data.frames = copy(v.frames);
   if (v.cast && typeof v.cast === 'object') data.cast = copy(v.cast);
   else if (v.chars && typeof v.chars === 'object') // v81 files: plain numbers for hero / npc
    for (const k of ['hero', 'npc'])
     if (+v.chars[k] && +v.chars[k] !== 1) data.cast[k] = {
      s: +v.chars[k]
     }
  }
  if (typeof render === 'function' && panel) render()
 }

 function get() {
  const out = {};
  if (Object.keys(data.edit).length) out.edit = copy(data.edit);
  if (data.added.length) out.added = copy(data.added);
  if (Object.keys(data.buildings).length) out.buildings = copy(data.buildings);
  if (Object.keys(data.frames).length) out.frames = copy(data.frames);
  const gp = window.TownPaint?.save();
  if (gp) out.ground = gp;
  if (Object.keys(data.cast).length) {
   out.cast = copy(data.cast);
   const h = charScale('hero');
   if (h !== 1) out.chars = {
    hero: +h.toFixed(3)
   } // read by the sub-maps until they get their own character settings
  }
  return Object.keys(out).length ? out : undefined
 }

 /* ---------- what can be placed / swapped in ---------- */
 const KINDS = {};
 const kind = (id, label, group, draw) => KINDS[id] = {
  label,
  group,
  draw
 };
 const DECOR_W = {
  'fence-picket': ['รั้วไม้', 110],
  'stone-wall-low': ['กำแพงหินเตี้ย', 110],
  'hedge-row': ['แนวพุ่มไม้', 120],
  'flower-bed': ['แปลงดอกไม้', 118],
  'flower-box': ['กระบะดอกไม้', 90],
  'stepping-stones': ['หินทางเดิน', 130],
  'pond-lilies': ['บ่อบัว', 220],
  'bench': ['ม้านั่ง', 110],
  'market-stall-red': ['แผงตลาดแดง', 230],
  'market-stall-blue': ['แผงตลาดน้ำเงิน', 230],
  'banner-pole': ['เสาธง', 75],
  'woodpile': ['กองฟืน', 115],
  'signpost': ['ป้ายบอกทาง', 70],
  'well': ['บ่อน้ำ', 120],
  'cart': ['เกวียน', 150],
  'hay': ['กองฟาง', 95]
 };
 for (const [n, [label, w]] of Object.entries(DECOR_W)) kind('decor:' + n, label, 'ของประดับ', p => decor(n, p, w, false));
 ['รั้วหิน (ชุดเก่า)', 'รั้วไม้ (ชุดเก่า)', 'พุ่มไม้', 'กระถางต้นไม้', 'ของตั้งหน้าอาคาร', 'โต๊ะ/ถัง', 'ลังไม้', 'ต้นไม้'].forEach((label, i) => kind('prop:' + i, label, 'ของชุดเดิม', p => i === 7 ? propSprite(7, p, 110, 130) : i === 2 ? propSprite(2, {
  x: p.x,
  y: p.y + 6
 }, 78, 72) : i === 3 ? propSprite(3, {
  x: p.x,
  y: p.y + 6
 }, 64, 78) : propSprite(i, p, 92)));
 kind('bush', 'พุ่มไม้เล็ก', 'ต้นไม้/ดอกไม้', p => {
  if (bushSmall.naturalWidth) TownArt.draw(g, bushSmall, null, [p.x - 38, p.y - 70, 76, 75], project(hero.u, hero.v))
 });
 for (const i of [1, 2, 3]) kind('flowers:' + i, ['', 'ดอกไม้ชุด 1', 'ดอกไม้ชุด 2', 'สมุนไพร'][i], 'ต้นไม้/ดอกไม้', p => TownArt.detail(g, i, {
  x: p.x,
  y: p.y + 10
 }, 58));
 kind('lamp', 'โคมไฟถนน', 'ของประดับ', p => lamp(p));
 const GATES = {
   mine: 'เหมือง',
   frost: 'น้ำแข็ง',
   forest: 'ป่า',
   coast: 'ชายฝั่ง',
   ruins: 'ซากโบราณ',
   swamp: 'บึง'
  },
  gateImg = {};
 for (const [a, label] of Object.entries(GATES)) {
  const im = new Image();
  im.onload = () => gateImg[a] = im;
  im.src = 'assets/village-town/decor/gate-' + a + '.png';
  kind('gate:' + a, 'ประตู' + label, 'ประตูผจญภัย', p => {
   const m = gateImg[a];
   if (!m) return;
   const w = 300,
    h = w * m.naturalHeight / m.naturalWidth;
   TownArt.draw(g, m, null, [p.x - w / 2, p.y - h * .9 + 8, w, h], null)
  })
 }

 /* ---------- owners: a place (estate frame, mirrored when it faces SE), the plaza, or an exit gate ---------- */
 function ownerName(owner) {
  if (owner.startsWith('exit:')) return 'ประตู' + (Village25D.getExits()[+owner.slice(5)]?.name || '');
  return locations.find(o => o.id === owner)?.name || owner
 }

 function baseOf(owner) {
  if (owner.startsWith('exit:')) {
   const e = Village25D.getExits()[+owner.slice(5)];
   return e ? {
    u: e.u,
    v: e.v,
    mirror: false,
    cx: 0,
    front: 1.5
   } : null
  }
  const o = locations.find(x => x.id === owner);
  if (!o) return null;
  const e = estate(o),
   c = center(o);
  if (!e) return {
   u: c.u,
   v: c.v,
   mirror: false,
   cx: 0,
   front: 7.2
  };
  return {
   u: e.u,
   v: e.v,
   mirror: o.facing === 'SE',
   cx: project(c.u, c.v).x,
   front: e.front - 1
  }
 }
 const toScreen = (b, du, dv) => {
  const p = project(b.u + du, b.v + dv);
  return b.mirror ? {
   x: b.cx * 2 - p.x,
   y: p.y
  } : p
 };
 const screenDelta = (b, du, dv) => {
  const x = (du - dv) * 28;
  return {
   x: b?.mirror ? -x : x,
   y: (du + dv) * 14
  }
 };
 const canonDelta = (b, dx, dy) => {
  if (b?.mirror) dx = -dx;
  return {
   du: (dx / 28 + dy / 14) / 2,
   dv: (dy / 14 - dx / 28) / 2
  }
 };

 /* ---------- wrap each drawable with its edit (offset, scale, rotation, flip, swap, layer, hide) ---------- */
 function entry(key, owner, ax, ay, draw, src, label) {
  const ov = data.edit[key] || {},
   b = baseOf(owner),
   d = screenDelta(b, ov.du || 0, ov.dv || 0),
   E = {
    key,
    owner,
    ax,
    ay,
    x: ax + d.x,
    y: ay + d.y,
    ov,
    label,
    hidden: !!ov.hide,
    base: draw
   };
  frame.push(E);
  if (ov.hide) return null;
  const s = ov.s ?? 1,
   r = (ov.r || 0) * Math.PI / 180,
   f = !!ov.f,
   ix = ov.ix ?? 1, iy = ov.iy ?? 1,
   ia = (ix + iy) / 2, ib = (ix - iy) / 2, ic = (ix - iy) / 2, id = (ix + iy) / 2,
   k = ov.kind && KINDS[ov.kind] ? ov.kind : null,
   plain = !d.x && !d.y && s === 1 && !r && !f && ix === 1 && iy === 1 && !k;
  const inner = plain ? draw : gg => {
   g.save();
   g.translate(E.x, E.y);
   if (r) g.rotate(r);
   g.scale(f ? -s : s, s);
   g.transform(ia, ib, ic, id, 0, 0);
   g.translate(-ax, -ay);
   if (k) KINDS[k].draw({
    x: ax,
    y: ay
   });
   else draw(gg);
   g.restore()
  };
  const it = {
   x: E.x,
   y: E.y + (ov.layer || 0),
   z: ov.z || 0,
   place: loc(owner) ? owner : null,
   draw: gg => {
    if (lit(key, owner)) stamp('ring', inner);
    if (place && owner === place.id) stamp('hole', inner);
    inner(gg)
   }
  };
  if (src?.owner) {
   it.owner = src.owner;
   if (src.rel) it.rel = {
    u: src.rel.u + (ov.du || 0),
    v: src.rel.v + (ov.dv || 0)
   }
  }
  return it
 }

 function addedItems(gates) {
  const out = [];
  for (const a of data.added) {
   if (a.owner.startsWith('exit:') !== gates) continue;
   const b = baseOf(a.owner);
   if (!b || !KINDS[a.kind]) continue;
   const p = toScreen(b, a.du, a.dv),
    it = entry(a.id, a.owner, p.x, p.y, () => KINDS[a.kind].draw(p), null, KINDS[a.kind].label + ' (เพิ่มเอง)');
   if (it) out.push(it)
  }
  return out
 }
 // v81.4 · names come from what the item really is (estateObjects tags each item); NAME_KIND maps it to a placeable kind
 const NAMES = {
  'border:hedge': 'แนวพุ่มไม้',
  'border:flowers': 'แปลงดอกไม้ (ขอบ)',
  'border:planter': 'กระถาง (ขอบ)',
  'border:wood': 'รั้วไม้',
  'border:stone': 'กำแพงหิน',
  lamp: 'โคมไฟ',
  bushflower: 'พุ่มดอกไม้',
  pot: 'กระถาง',
  statue: 'ของตั้งหน้าอาคาร',
  table: 'โต๊ะ/ถัง',
  crate: 'ลังไม้',
  herb: 'สมุนไพร',
  'flower:1': 'ดอกไม้ชุด 1',
  'flower:2': 'ดอกไม้ชุด 2',
  bush: 'พุ่มไม้'
 };
 const NAME_KIND = {
  'border:hedge': 'decor:hedge-row',
  'border:flowers': 'decor:flower-bed',
  'border:planter': 'prop:3',
  'border:wood': 'decor:fence-picket',
  'border:stone': 'decor:stone-wall-low',
  lamp: 'lamp',
  bushflower: 'prop:2',
  pot: 'prop:3',
  statue: 'prop:4',
  table: 'prop:5',
  crate: 'prop:6',
  herb: 'flowers:3',
  'flower:1': 'flowers:1',
  'flower:2': 'flowers:2',
  bush: 'prop:2'
 };
 const nameLabel = n => !n ? null : NAMES[n] || (n.startsWith('decor:') ? DECOR_W[n.slice(6)]?.[0] || n.slice(6) : null);
 const nameKind = n => !n ? null : NAME_KIND[n] || (n.startsWith('decor:') && KINDS[n] ? n : null);
 const LABEL_HINT = [
  ['propSprite(7', 'ต้นไม้'],
  ['lamp(', 'โคมไฟ'],
  ["decor('bench'", 'ม้านั่ง'],
  ['drawBorder', 'รั้ว/แนวพุ่ม'],
  ['bush(', 'พุ่มไม้'],
  ['TownArt.detail', 'ดอกไม้'],
  ['propSprite(3', 'กระถาง'],
  ['propSprite(6', 'ลังไม้']
 ];
 const labelOf = fn => {
  const t = String(fn);
  for (const [k, l] of LABEL_HINT)
   if (t.includes(k)) return l;
  const m = t.match(/decor\('([\w-]+)'|dec\('([\w-]+)'/);
  return m ? (DECOR_W[m[1] || m[2]]?.[0] || 'ของประดับ') : 'ของประดับ'
 };
 const baseEstate = estateObjects;
 estateObjects = function() {
  frame = [];
  const list = baseEstate(),
   sq = locations.find(o => o.id === 'square'),
   out = [],
   seen = {};
  for (const it of list) {
   let owner, rel;
   if (it.owner && it.rel) {
    owner = it.owner.id;
    rel = it.rel
   } else if (sq && it.x != null) {
    const w = inv(it.x, it.y),
     c = center(sq);
    owner = 'square';
    rel = {
     u: w.u - c.u,
     v: w.v - c.v
    }
   } else {
    out.push(it);
    continue
   }
   let key = owner + ':' + rel.u.toFixed(1) + ',' + rel.v.toFixed(1);
   seen[key] = (seen[key] || 0) + 1;
   if (seen[key] > 1) key += '#' + seen[key];
   const e = entry(key, owner, it.x, it.y, it.draw, it, nameLabel(it.name) || labelOf(it.draw));
   frame[frame.length - 1].name = it.name || null;
   if (e) out.push(e)
  }
  return out.concat(addedItems(false))
 };
 const TM = window.TownMenu,
  baseGates = TM.gateObjects;
 TM.gateObjects = function() {
  const out = [];
  baseGates().forEach((it, i) => {
   const e = entry('exit:' + i, 'exit:' + i, it.x, it.y, it.draw, null, 'ประตู ' + (Village25D.getExits()[i]?.name || ''));
   if (e) out.push(e)
  });
  return out.concat(addedItems(true))
 };


 /* ---------- v82 highlight: hovered / selected things get a thin white ring; while a place is open the rest of the map dims ----------
    Each lit drawable is stamped into an off-screen silhouette during the frame; the overlay turns it into a ring / a hole in the veil. */
 const bufs = {};

 function buf(n) {
  const W = g.canvas.width,
   H = g.canvas.height;
  let b = bufs[n];
  if (!b) b = bufs[n] = {
   cv: document.createElement('canvas'),
   used: false
  };
  if (b.cv.width !== W || b.cv.height !== H) {
   b.cv.width = W;
   b.cv.height = H
  }
  return b
 }

 function stamp(n, inner) {
  const b = buf(n),
   o = b.cv.getContext('2d'),
   main = g;
  if (!b.used) {
   o.setTransform(1, 0, 0, 1, 0, 0);
   o.clearRect(0, 0, b.cv.width, b.cv.height);
   b.used = true
  }
  o.setTransform(main.getTransform());
  g = o;
  try {
   inner(o)
  } catch (e) {} finally {
   g = main
  }
 }
 let hoverKey = null,
  hoverOwner = null;
 const litOwner = () => hoverOwner || (typeof hovered !== 'undefined' ? hovered : null);
 const lit = (key, owner) => editing && !testWalk && (place ? hoverKey === key || inSel(key) : UX.getMode() === 'object' && litOwner() === owner);

 /* ---------- big building art: scale + shear (tilt) + offset around its footprint centre, and a swappable image ---------- */
 const anchorOf = o => {
  const a = center(o);
  return project(a.u, a.v)
 };
 const baseArtRect = artRect,
  baseHouseImage = houseImage,
  isHouse = o => o.id === 'home' || !!o.npc,
  as = (o, id, npc) => Object.assign(Object.create(o), {
   id,
   npc
  });
 artRect = function(o) {
  const a = data.buildings[o.id]?.art;
  return a && a !== o.id && artSpecs[a] ? baseArtRect(as(o, a, o.npc)) : baseArtRect(o)
 };
 houseImage = function(o) {
  const a = data.buildings[o.id]?.art;
  if (a && a !== o.id && (a === 'home' || /^npc\d+$/.test(a))) return baseHouseImage(as(o, a, a !== 'home'));
  return baseHouseImage(o)
 };
 const baseBuilding = building;

 function drawB(o) {
  const t = data.buildings[o.id];
  if (!t || !(t.sx != null || t.sy != null || t.kx || t.ky || t.ix != null || t.iy != null || t.dx || t.dy)) {
   baseBuilding(o);
   return
  }
  const p = anchorOf(o);
  g.save();
  g.translate(p.x + (t.dx || 0), p.y + (t.dy || 0));
  g.transform(t.sx ?? 1, t.ky || 0, t.kx || 0, t.sy ?? 1, 0, 0);
   const ix=t.ix??1,iy=t.iy??1;g.transform((ix+iy)/2,(ix-iy)/2,(ix-iy)/2,(ix+iy)/2,0,0);
   g.translate(-p.x, -p.y);
  baseBuilding(o);
  g.restore()
 }
 building = function(o) {
  drawB(o);
  if (!editing) return;
  if (lit('bld:' + o.id, o.id) || place?.id === o.id && place.tab === 'building') stamp('ring', () => drawB(o));
  if (place?.id === o.id) stamp('hole', () => drawB(o))
 };

 function transformRect(o, r) {
  const t = data.buildings[o.id];
  if (!t) return r;
  const p = anchorOf(o),
   sx = t.sx ?? 1,
   sy = t.sy ?? 1,
   x0 = p.x + (t.dx || 0) + (r.x - p.x) * sx,
   x1 = p.x + (t.dx || 0) + (r.x + r.w - p.x) * sx,
   y0 = p.y + (t.dy || 0) + (r.y - p.y) * sy;
  return {
   ...r,
   x: Math.min(x0, x1),
   y: y0,
   w: Math.abs(x1 - x0),
   h: r.h * sy
  }
 }

 /* ---------- outer frame of a place: plot size, gate width and the border of each side (stored in data.frames) ---------- */
 const baseEstateFn = estate;
 estate = function(o) {
  const e = baseEstateFn(o),
   f = e && data.frames[o.id];
  if (!f) return e;
  for (const k of ['left', 'right', 'back', 'front', 'gate'])
   if (Number.isFinite(f[k])) e[k] = f[k];
  return e
 };
 const SIDE_OF = ['back', 'left', 'right', 'front', 'front'],
  SIDES = {
   back: 'ด้านหลัง',
   left: 'ด้านซ้าย',
   right: 'ด้านขวา',
   front: 'ด้านหน้า (สองข้างประตู)'
  },
  BORDERS = {
   auto: 'ตามแบบเดิม',
   hedge: 'แนวพุ่มไม้',
   flowers: 'แปลงดอกไม้',
   planter: 'กระถาง',
   wood: 'รั้วไม้',
   stone: 'กำแพงหิน',
   none: 'ไม่มีขอบ'
  };
 const baseBorderStyle = borderStyle;
 borderStyle = function(o, si, k, n, front) {
  const s = data.frames[o.id]?.sides?.[SIDE_OF[si]];
  if (s && s !== 'auto') return s === 'none' ? null : s;
  return baseBorderStyle(o, si, k, n, front)
 };
 const loc = id => locations.find(o => o.id === id);
 const hasFrame = o => !!o && !!baseEstateFn(o);
 const mirrorX = (o, p) => o.facing === 'SE' ? {
  x: anchorOf(o).x * 2 - p.x,
  y: p.y
 } : p;
 const plotScreen = (o, a, b) => {
  const e = estate(o);
  return mirrorX(o, project(e.u + a, e.v + b))
 };

 /* ---------- characters on this map: size of everyone, of each character, and a swappable image ----------
    data.cast = {all, hero:{s,img,back,flip}, npc:{s}, 'npc:<id>':{s,img,back,flip}} */
 const CAST_ART = (() => {
  const M = window.ASSET_MANIFEST?.assets || [],
   files = new Set(M.map(a => a.file)),
   out = [],
   backOf = f => {
    const b = f.replace(/\.(\w+)$/, '-back.$1');
    return files.has(b) ? b : null
   };
  for (const a of M) {
   if (!a.file) continue;
   if (a.category === 'allies' && /^ally-[a-z]+$/.test(a.id)) out.push({
    id: a.file,
    label: a.name || a.id.slice(5),
    group: 'พวกพ้อง'
   });
   else if (a.category === 'characters' && !/faces/.test(a.id)) out.push({
    id: a.file,
    label: a.name || a.id.slice(5),
    group: 'ตัวละคร'
   });
   else if (a.category === 'enemies' && /^enemy-[a-z-]+$/.test(a.id) && !/-back$/.test(a.id)) out.push({
    id: a.file,
    back: backOf(a.file),
    label: a.name || a.id.slice(6),
    group: 'สัตว์ / ศัตรู'
   })
  }
  return out
 })();
 const imgCache = {},
  trimCache = new WeakMap();
 const img = src => {
  let m = imgCache[src];
  if (!m) {
   m = imgCache[src] = new Image();
   m.src = src
  }
  return m
 };

 function trim(m) { // opaque bounds as fractions of the image, measured once
  let t = trimCache.get(m);
  if (t) return t;
  t = {
   x0: 0,
   y0: 0,
   x1: 1,
   y1: 1
  };
  try {
   const S = 128,
    c = document.createElement('canvas');
   c.width = c.height = S;
   const q = c.getContext('2d');
   q.drawImage(m, 0, 0, S, S);
   const d = q.getImageData(0, 0, S, S).data;
   let x0 = S,
    y0 = S,
    x1 = -1,
    y1 = -1;
   for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++)
     if (d[(y * S + x) * 4 + 3] > 24) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y
     } if (x1 >= 0) t = {
    x0: x0 / S,
    y0: y0 / S,
    x1: (x1 + 1) / S,
    y1: (y1 + 1) / S
   }
  } catch (e) {}
  trimCache.set(m, t);
  return t
 }
 const castOf = k => {
  const c = data.cast[k];
  return c && typeof c === 'object' ? c : null
 };

 function charScale(k) {
  const all = +data.cast.all || 1;
  if (k === 'hero') return all * (castOf('hero')?.s ?? 1);
  if (k === 'npc') return all * (castOf('npc')?.s ?? 1);
  if (k.startsWith('npc:')) return all * (castOf(k)?.s ?? 1) * (castOf('npc')?.s ?? 1);
  return all
 }
 // draws the swapped image (feet on p, visible height ≈ h); returns false when the character keeps its own art
 function drawChar(k, gg, p, face, h) {
  const c = castOf(k);
  if (!c?.img) return false;
  const north = /^N/.test(face || ''),
   src = north && c.back ? c.back : c.img,
   m = img(src);
  if (!m.complete || !m.naturalWidth) return true;
  const t = trim(m),
   vis = (t.y1 - t.y0) * m.naturalHeight,
   sc = (k === 'hero' ? h * .78 : h) / Math.max(1, vis),
   w = m.naturalWidth * sc,
   H = m.naturalHeight * sc,
   flip = (/W$/.test(face || '') || face === 'S') !== !!c.flip;
  gg.save();
  gg.translate(p.x, p.y);
  if (flip) gg.scale(-1, 1);
  gg.drawImage(m, -w * (t.x0 + t.x1) / 2, -H * t.y1, w, H);
  gg.restore();
  return true
 }


 /* ---------- v82 · place mode ----------
    Map level: hover a place = white ring around the whole plot · click it (building, decoration or gate) = open the place.
    Inside a place everything belongs to it: building art, outer frame, sub-assets, entrance. The rest of the map dims and is locked.
    Every change shows at once (Ctrl+Z works); ✓ เสร็จ (Enter) keeps the place, ยกเลิก (Esc) puts the whole place back. */
 const inSel = k => !!place && place.keys.includes(k);

 function ovOf(key) {
  return data.edit[key] || (data.edit[key] = {})
 }

 function clean(key) {
  const o = data.edit[key];
  if (!o) return;
  for (const k of Object.keys(o))
   if (o[k] == null || o[k] === 0 && k !== 's' || k === 's' && o[k] === 1 || o[k] === false || o[k] === '') delete o[k];
  if (!Object.keys(o).length) delete data.edit[key]
 }

 function pickIn(p, owner, R = 22) {
  R /= scale * zoom;
  let best = null,
   bd = R;
  for (const e of frame) {
   if (owner && e.owner !== owner) continue;
   const d = Math.hypot(e.x - p.x, e.y - p.y);
   if (d < bd) {
    bd = d;
    best = e
   }
  }
  return best
 }

 function flashStatus(t) {
  const st = document.getElementById('status');
  if (st) st.textContent = t
 }

 function shake(msg) {
  panel.classList.remove('ae-shake');
  void panel.offsetWidth;
  panel.classList.add('ae-shake');
  flashStatus(msg || 'กำลังแก้ ' + ownerName(place.id) + ' · กด ✓ เสร็จ ก่อนไปแก้ที่อื่น')
 }

 function focusOn(x, y) {
  pan = {
   x: -(x - WORLD_W / 2) * scale * zoom,
   y: -(y - WORLD_H / 2) * scale * zoom
  }
 }

 function placeBounds(id) {
  let x0 = 1e9,
   y0 = 1e9,
   x1 = -1e9,
   y1 = -1e9;
  const add = (x, y) => {
   x0 = Math.min(x0, x);
   y0 = Math.min(y0, y);
   x1 = Math.max(x1, x);
   y1 = Math.max(y1, y)
  };
  const o = loc(id);
  if (o) {
   const r = UX.art(o);
   if (r) {
    add(r.x, r.y);
    add(r.x + r.w, r.y + r.h)
   }
   if (hasFrame(o)) {
    const e = estate(o);
    for (const [a, b] of [
      [e.left, e.back],
      [e.right, e.back],
      [e.right, e.front],
      [e.left, e.front]
     ]) {
     const p = plotScreen(o, a, b);
     add(p.x, p.y)
    }
   }
  }
  for (const e of frame)
   if (e.owner === id) add(e.x, e.y);
  if (x0 > x1) {
   const b = baseOf(id),
    p = b ? project(b.u, b.v) : {
     x: WORLD_W / 2,
     y: WORLD_H / 2
    };
   add(p.x - 150, p.y - 200);
   add(p.x + 150, p.y + 60)
  }
  return {
   x0,
   y0,
   x1,
   y1
  }
 }

 function focusPlace(id) {
  const b = placeBounds(id),
   side = Math.min(360, W * .4);
  zoom = Math.max(.5, Math.min(3, Math.min((W - side - 80) / ((b.x1 - b.x0) * scale), (H - 140) / ((b.y1 - b.y0) * scale))));
  focusOn((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2);
  pan.x -= side / 2;
  pan.y += 20
 }
 const snapOf = () => JSON.stringify(UX.snapshot());

 function enter(owner, key) {
  if (!editing || testWalk) return;
  if (place) {
   if (place.id === owner) {
    if (key) selectItem(key);
    return
   }
   shake();
   return
  }
  const o = loc(owner);
  if (!o && !owner.startsWith('exit:')) return;
  UX.setMode('place');
  place = {
   id: owner,
   tab: key || !o ? 'items' : 'building',
   keys: key ? [key] : [],
   before: snapOf(),
   mark: UX.undoMark()
  };
  if (o) selected = o.id;
  hoverOwner = null;
  focusPlace(owner);
  render();
  flashStatus('กำลังแก้ ' + ownerName(owner) + ' · ✓ เสร็จ (Enter) หรือ ยกเลิก (Esc)')
 }

 function leave(ok = true) {
  if (!place) return;
  const s = place;
  place = null;
  drag = null;
  courtDraw = false;
  if (!ok) {
   UX.apply(JSON.parse(s.before));
   UX.undoTrim(s.mark);
   flashStatus('ยกเลิกแล้ว · ' + ownerName(s.id) + ' กลับเป็นเหมือนก่อนเปิด')
  } else {
   for (const k of Object.keys(data.edit)) clean(k);
   UX.persist();
   if (snapOf() === s.before) UX.undoTrim(s.mark);
   flashStatus('บันทึก ' + ownerName(s.id) + ' แล้ว · กด ⬆ push เมื่อพร้อม')
  }
  hoverKey = hoverOwner = null;
  UX.setMode('object');
  render()
 }

 function selectItem(key, toggle) {
  if (!place) return;
  if (toggle) {
   const i = place.keys.indexOf(key);
   if (i < 0) place.keys.push(key);
   else place.keys.splice(i, 1)
  } else place.keys = [key];
  place.tab = 'items';
  render()
 }

 function resetPlace() {
  if (!place || !window.confirm('คืนค่าทั้งหมดของ ' + ownerName(place.id) + ' (อาคาร กรอบ ของย่อย ทางเข้า ป้าย)?')) return;
  UX.checkpoint();
  const id = place.id,
   mine = k => k === id || k.startsWith(id + ':') || data.added.some(a => a.id === k && a.owner === id);
  for (const k of Object.keys(data.edit))
   if (mine(k)) delete data.edit[k];
  data.added = data.added.filter(a => a.owner !== id);
  delete data.buildings[id];
  delete data.frames[id];
  const o = loc(id);
  if (o) {
   delete o.entry;
   delete o.label
  }
  place.keys = [];
  UX.refresh();
  UX.persist();
  render()
 }

 function moveKeys(keys, orig, dx, dy) {
  for (const k of keys) {
   const E = frame.find(e => e.key === k);
   if (!E) continue;
   const c = canonDelta(baseOf(E.owner), dx, dy),
    ov = ovOf(k),
    o = orig[k] || {
     du: 0,
     dv: 0
    };
   ov.du = +(o.du + c.du).toFixed(3);
   ov.dv = +(o.dv + c.dv).toFixed(3)
  }
 }
 const origOf = keys => Object.fromEntries(keys.map(k => [k, {
  du: data.edit[k]?.du || 0,
  dv: data.edit[k]?.dv || 0
 }]));

 function nudge(dx, dy) {
  if (!place) return;
  UX.checkpoint();
  if (place.keys.length) moveKeys(place.keys, origOf(place.keys), dx, dy);
  else if (loc(place.id)) {
   const t = data.buildings[place.id] || (data.buildings[place.id] = {});
   t.dx = (t.dx || 0) + dx;
   t.dy = (t.dy || 0) + dy
  }
  UX.persist()
 }

 function removeSelected() {
  if (!place?.keys.length) return;
  UX.checkpoint();
  for (const k of place.keys) {
   const a = data.added.find(x => x.id === k);
   if (a) {
    data.added = data.added.filter(x => x !== a);
    delete data.edit[k]
   } else ovOf(k).hide = true
  }
  place.keys = [];
  UX.persist();
  render()
 }

 /* ---------- v87 layers: integer − / + controls ---------- */
 const layerOf = id => ({ z: data.buildings[id]?.z || 0, pz: data.buildings[id]?.pz || 0 });
 const zRow = (id, label, v, hint) => `<div class="zrow" style="display:grid;grid-template-columns:1fr 34px 46px 34px;gap:4px;align-items:center;margin:6px 0"><span>${label}${hint?`<small style="display:block;color:#b9b49a;font-size:11px">${hint}</small>`:''}</span><button data-zid="${id}" data-zd="-1" title="ถอยไปข้างหลัง">−</button><b style="text-align:center;font-size:16px;color:#e5c06b">${v>0?'+':''}${v}</b><button data-zid="${id}" data-zd="1" title="ขึ้นมาข้างหน้า">+</button></div>`;
 function bindZ(id, fn) { panel.querySelectorAll(`[data-zid="${id}"]`).forEach(b => b.onclick = once(() => fn(+b.dataset.zd))) }
 /* ---------- v85 group tools: layer / size steps, duplicate, copy & paste between places ---------- */
 const GCLIP = 'project-a-village-group-clip-v1',
  clampN = (v, a, b) => Math.max(a, Math.min(b, v));
 function recordOf(k) {
  const E = frame.find(e => e.key === k);
  if (!E) return null;
  const ov = data.edit[k] || {},
   added = data.added.find(a => a.id === k),
   kind = ov.kind && KINDS[ov.kind] ? ov.kind : added ? added.kind : nameKind(E.name);
  if (!kind) return null;
  const b = baseOf(E.owner);
  if (!b) return null;
  const w = inv(b.mirror ? b.cx * 2 - E.x : E.x, E.y);
  return { kind, du: +(w.u - b.u).toFixed(3), dv: +(w.v - b.v).toFixed(3), s: ov.s, r: ov.r, f: ov.f, ix: ov.ix, iy: ov.iy, z: ov.z, layer: ov.layer }
 }
 function addRecords(recs, owner, off) {
  const ids = [];
  if (!baseOf(owner)) return ids;
  for (const r of recs) {
   const nid = 'add:' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
   data.added.push({ id: nid, owner, du: +(r.du + off).toFixed(3), dv: +(r.dv + off).toFixed(3), kind: r.kind });
   data.edit[nid] = { s: r.s, r: r.r, f: r.f, ix: r.ix, iy: r.iy, z: r.z, layer: r.layer };
   clean(nid);
   ids.push(nid)
  }
  return ids
 }
 function groupRecords() {
  const recs = (place?.keys || []).map(recordOf).filter(Boolean);
  if (!recs.length) flashStatus('เลือกของก่อน (ชิ้นที่มีภาพแบบเลือกได้เท่านั้นที่คัดลอกได้)');
  return recs
 }
 function dupGroup() {
  const recs = groupRecords();
  if (!recs.length) return;
  UX.checkpoint();
  place.keys = addRecords(recs, place.id, .8);
  UX.persist();
  render();
  flashStatus('ทำสำเนา ' + recs.length + ' ชิ้นแล้ว · ลากไปวางตำแหน่งใหม่ได้เลย')
 }
 function flipGroup() {
  if (!place?.keys.length) { flashStatus('เลือกวัตถุอย่างน้อย 1 ชิ้นก่อน'); return }
  const items = place.keys.map(key => frame.find(e => e.key === key)).filter(Boolean);
  if (!items.length) return;
  const centerX = items.reduce((sum, e) => sum + e.x, 0) / items.length;
  UX.checkpoint();
  for (const E of items) {
   const targetX = 2 * centerX - E.x,
    delta = canonDelta(baseOf(E.owner), targetX - E.x, 0),
    ov = ovOf(E.key);
   ov.du = +((ov.du || 0) + delta.du).toFixed(3);
   ov.dv = +((ov.dv || 0) + delta.dv).toFixed(3);
   ov.f = !ov.f;
   clean(E.key)
  }
  UX.persist();
  render();
  flashStatus('กลับซ้าย–ขวาทั้งชุดแล้ว · ' + items.length + ' ชิ้น')
 }
 function copyGroup() {
  const recs = groupRecords();
  if (!recs.length) return;
  try { localStorage.setItem(GCLIP, JSON.stringify({ from: place.id, recs })) } catch (e) {}
  flashStatus('คัดลอก ' + recs.length + ' ชิ้นแล้ว · เปิดสถานที่ไหนก็ได้แล้วกด วาง (Ctrl+V)');
  render()
 }
 const clip = () => { try { return JSON.parse(localStorage.getItem(GCLIP) || 'null') } catch (e) { return null } };
 function pasteGroup() {
  const c = clip();
  if (!place || !c?.recs?.length) { flashStatus('ยังไม่มีของที่คัดลอก'); return }
  UX.checkpoint();
  place.keys = addRecords(c.recs, place.id, c.from === place.id ? .8 : 0);
  UX.persist();
  render();
  flashStatus('วาง ' + place.keys.length + ' ชิ้นแล้ว (ตำแหน่งเทียบกับสถานที่เหมือนต้นฉบับ)')
 }
 function groupStep(what, dir) {
  if (!place?.keys.length) return;
  UX.checkpoint();
  for (const k of place.keys) {
   const ov = ovOf(k);
   if (what === 'layer') ov.z = clampN((ov.z || 0) + dir, -20, 20);
   else ov.s = +clampN((ov.s ?? 1) * (dir > 0 ? 1.1 : 1 / 1.1), .2, 4).toFixed(3);
   clean(k)
  }
  UX.persist();
  render()
 }
 const groupHtml = n => `<b class="sec">จัดการ${n > 1 ? 'ทั้งกลุ่ม' : ''}</b><div class="row"><button id="gUp" title="PageUp">＋ ชั้น (+1)</button><button id="gDown" title="PageDown">－ ชั้น (−1)</button><button id="gBig" title="+">＋ ใหญ่ขึ้น</button><button id="gSmall" title="-">－ เล็กลง</button></div>
  <div class="row"><button id="gDup">ทำสำเนา <small>Ctrl+D</small></button><button id="gFlip" title="กลับซ้าย–ขวาทั้งกลุ่ม">⇋ กลับซ้าย–ขวา</button><button id="gCopy">คัดลอก <small>Ctrl+C</small></button><button id="gPaste">วาง <small>Ctrl+V</small></button></div>`;
 function bindGroup() {
  act('#gUp', () => groupStep('layer', 1));
  act('#gDown', () => groupStep('layer', -1));
  act('#gBig', () => groupStep('size', 1));
  act('#gSmall', () => groupStep('size', -1));
  act('#gDup', dupGroup);
  act('#gFlip', flipGroup);
  act('#gCopy', copyGroup);
  act('#gPaste', pasteGroup)
 }

 /* ---------- characters mode ---------- */
 let selChar = null;
 const castList = () => [{
  k: 'hero',
  name: 'ตัวเอก'
 }, ...(window.TownNPC?.roster || []).map(n => ({
  k: 'npc:' + n.id,
  name: n.name,
  role: n.role
 }))];

 function charPos(k) {
  if (k === 'hero') return project(hero.u, hero.v);
  const n = window.TownNPC?.list?.()?.find(n => 'npc:' + n.id === k);
  return n ? project(n.u, n.v) : null
 }

 function pickChar(p) {
  let best = null,
   bd = 1e9;
  for (const c of castList()) {
   const q = charPos(c.k);
   if (!q) continue;
   const s = charScale(c.k);
   if (Math.abs(p.x - q.x) < 30 * s && p.y < q.y + 12 && p.y > q.y - 100 * s) {
    const d = Math.abs(p.x - q.x) + Math.abs(p.y - q.y + 40 * s);
    if (d < bd) {
     bd = d;
     best = c.k
    }
   }
  }
  return best
 }

 /* ---------- pointer ---------- */
 let press = null;
 const stageEl = document.getElementById('stage'),
  swallow = e => {
   e.stopPropagation();
   e.preventDefault()
  };
 const nearPx = (a, p, px) => Math.hypot(a.x - p.x, a.y - p.y) * scale * zoom < px;

 function corners(o) {
  const e = estate(o);
  return {
   lb: plotScreen(o, e.left, e.back),
   rb: plotScreen(o, e.right, e.back),
   rf: plotScreen(o, e.right, e.front),
   lf: plotScreen(o, e.left, e.front)
  }
 }
 stageEl.addEventListener('pointerdown', e => {
  if (!editing || testWalk || e.button !== 0 || e.target.closest('#assetEdit,#aePicker,#townTools')) return;
  const p = world(e),
   m = UX.getMode();
  if (m === 'chars') {
   const c = pickChar(p);
   if (c) {
    swallow(e);
    selChar = c;
    render()
   }
   return
  }
  if (!place) {
   if (m !== 'object' || UX.hitObject(p)) return; // buildings: town-ux drags (move) or clicks (open)
   const h = pickIn(p, null);
   if (h) {
    swallow(e);
    press = {
     id: e.pointerId,
     x: e.clientX,
     y: e.clientY,
     owner: h.owner,
     key: h.key
    }
   }
   return
  }
  const o = loc(place.id),
   start = (type, extra = {}) => {
    swallow(e);
    drag = {
     id: e.pointerId,
     type,
     p,
     moved: false,
     ...extra
    }
   };
  if (o && courtDraw && place.tab === 'entry' && o.id !== 'square') {
   const d0 = door(o);
   return start('court', { pts: [{ u: d0.u, v: d0.v }] })
  }
  if (o && hasFrame(o) && place.tab === 'frame') {
   const c = Object.entries(corners(o)).find(([, q]) => nearPx(q, p, 14));
   if (c) return start('corner', {
    which: c[0]
   })
  }
  if (o && o.id !== 'square') {
   const d = UX.entryOf(o);
   if (nearPx(project(d.u, d.v), p, 13)) {
    place.tab = 'entry';
    render();
    return start('entry')
   }
  }
  if (o) {
   const L = UX.labelPoint(o);
   if (Math.abs(p.x - L.x) < 70 && p.y > L.y + 8 && p.y < L.y + 40) return start('label', {
    dx: o.label?.dx || 0,
    dy: o.label?.dy || 0
   })
  }
  const h = pickIn(p, place.id);
  if (h) {
   if (e.shiftKey) {
    swallow(e);
    selectItem(h.key, true);
    return
   }
   if (!place.keys.includes(h.key)) selectItem(h.key);
   return start('items', {
    keys: [...place.keys],
    orig: origOf(place.keys)
   })
  }
  const b = UX.hitObject(p);
  if (o && b?.id === o.id) {
   place.keys = [];
   place.tab = 'building';
   render();
   const t = data.buildings[o.id] || {};
   return start('art', {
    dx: t.dx || 0,
    dy: t.dy || 0
   })
  }
  if (b || pickIn(p, null)) {
   swallow(e);
   shake()
  } // empty ground → camera pan as usual
 }, true);
 stageEl.addEventListener('pointermove', e => {
  if (!editing || drag || testWalk) return;
  const p = world(e);
  if (place) {
   hoverOwner = null;
   hoverKey = pickIn(p, place.id)?.key || null
  } else if (UX.getMode() === 'object') {
   hoverKey = null;
   hoverOwner = UX.hitObject(p) ? null : pickIn(p, null)?.owner || null
  } else hoverKey = hoverOwner = null
 });
 window.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id || !place) return;
  const p = world(e),
   dx = p.x - drag.p.x,
   dy = p.y - drag.p.y,
   o = loc(place.id);
  if (!drag.moved) {
   if (Math.hypot(dx, dy) * scale * zoom < 4) return;
   drag.moved = true;
   UX.checkpoint()
  }
  if (drag.type === 'court') {
   // rubber-band path on the tile axes: the live end follows the cursor along the current axis;
   // moving a whole tile sideways fixes a corner and turns — so a diagonal drag gives a clean L, not a staircase
   const w = inv(p.x, p.y), q = { u: Math.round(w.u), v: Math.round(w.v) }, P = drag.pts;
   let c = P.length > 1 ? P[P.length - 2] : P[0];
   if (P.length === 1) { if (Math.hypot(q.u - c.u, q.v - c.v) < 1) return; drag.axis = Math.abs(q.u - c.u) >= Math.abs(q.v - c.v) ? 'u' : 'v'; const g0 = drag.axis === 'u' ? { u: c.u, v: Math.round(c.v) } : { u: Math.round(c.u), v: c.v }; if (Math.hypot(g0.u - c.u, g0.v - c.v) > .05) P.push(g0); c = P[P.length - 1]; P.push({ ...c }) }
   const along = drag.axis === 'u' ? q.u - c.u : q.v - c.v, side = drag.axis === 'u' ? q.v - c.v : q.u - c.u;
   P[P.length - 1] = drag.axis === 'u' ? { u: c.u + along, v: c.v } : { u: c.u, v: c.v + along };
   if (Math.abs(side) >= 1.5 && Math.abs(along) >= 1 && P.length < 60) { drag.axis = drag.axis === 'u' ? 'v' : 'u'; P.push({ ...P[P.length - 1] }) }
   return
  }
  if (drag.type === 'items') moveKeys(drag.keys, drag.orig, dx, dy);
  else if (drag.type === 'art') {
   const t = data.buildings[o.id] || (data.buildings[o.id] = {});
   t.dx = Math.round(drag.dx + dx);
   t.dy = Math.round(drag.dy + dy)
  } else if (drag.type === 'entry') UX.setEntry(o, inv(p.x, p.y), e.shiftKey || !!o.entry?.deep);
  else if (drag.type === 'label') o.label = {
   dx: Math.round(drag.dx + dx),
   dy: Math.round(drag.dy + dy)
  };
  else if (drag.type === 'corner') {
   const e0 = estate(o),
    w = inv(p.x, p.y),
    q = canonical(o, w.u, w.v),
    a = +(q.u - e0.u).toFixed(1),
    b = +(q.v - e0.v).toFixed(1),
    f = data.frames[o.id] || (data.frames[o.id] = {});
   if (drag.which[0] === 'l') f.left = Math.min(a, -o.w - .4);
   else f.right = Math.max(a, o.w + .4);
   if (drag.which[1] === 'b') f.back = Math.min(b, -o.d - .4);
   else f.front = Math.max(b, o.d + 1.2);
   cacheSolids();
   terrainDirty = true
  }
 }, true);
 window.addEventListener('pointerup', e => {
  if (press && e.pointerId === press.id) {
   const s = press;
   press = null;
   if (Math.hypot(e.clientX - s.x, e.clientY - s.y) < 6) enter(s.owner, s.key);
   return
  }
  if (!drag || e.pointerId !== drag.id) return;
  const d = drag;
  drag = null;
  if (!d.moved) return;
  if (d.type === 'court') {
   const o = loc(place.id), a = center(o), pts = [];
   for (const q of d.pts) { const c = canonical(o, q.u, q.v), r = { du: +(c.u - a.u).toFixed(2), dv: +(c.v - a.v).toFixed(2) }, l = pts.at(-1); if (!l || l.du !== r.du || l.dv !== r.dv) pts.push(r) }
   // drop middle points of straight runs
   const slim = pts.filter((q, i) => { const a1 = pts[i - 1], b1 = pts[i + 1]; return !a1 || !b1 || !((a1.du === q.du && q.du === b1.du) || (a1.dv === q.dv && q.dv === b1.dv)) });
   courtDraw = false;
   if (slim.length >= 2) { o.court = { pts: slim }; flashStatus('วาดทางเข้าแล้ว · ถนนจะมาเชื่อมที่ปลายเส้น') } else flashStatus('เส้นสั้นเกินไป · ลองลากให้ยาวขึ้น');
   UX.refresh(); UX.persist(); render(); return
  }
  if (d.type === 'entry' || d.type === 'corner') UX.refresh();
  UX.persist();
  render()
 }, true);
 document.addEventListener('keydown', e => {
  if (!place || e.target.closest('input,select,textarea') || picker?.open) return;
  if (e.key === 'Enter') {
   e.preventDefault();
   leave(true);
   return
  }
  if (e.key === 'Escape') {
   e.preventDefault();
   if (place.keys.length) {
    place.keys = [];
    render()
   } else if (snapOf() === place.before || window.confirm('ยกเลิกการแก้ทั้งหมดของ ' + ownerName(place.id) + '?')) leave(false);
   return
  }
  if (e.key === 'Delete' || e.key === 'Backspace') {
   e.preventDefault();
   removeSelected();
   return
  }
  if (e.ctrlKey || e.metaKey) {
   const c = e.key.toLowerCase();
   if (c === 'c' && place.keys.length) { e.preventDefault(); copyGroup() }
   else if (c === 'v') { e.preventDefault(); pasteGroup() }
   else if (c === 'd' && place.keys.length) { e.preventDefault(); dupGroup() }
   return
  }
  if (place.keys.length && (e.key === 'PageUp' || e.key === 'PageDown')) { e.preventDefault(); groupStep('layer', e.key === 'PageUp' ? 1 : -1); return }
  if (place.keys.length && (e.key === '+' || e.key === '=' || e.key === '-')) { e.preventDefault(); groupStep('size', e.key === '-' ? -1 : 1); return }
  const k = {
   ArrowLeft: [-1, 0],
   ArrowRight: [1, 0],
   ArrowUp: [0, -1],
   ArrowDown: [0, 1]
  } [e.key];
  if (!k) return;
  e.preventDefault();
  const n = e.shiftKey ? 10 : 2;
  nudge(k[0] * n, k[1] * n)
 });

 const UPLOAD_KEY='project-a-uploaded-decor-v1';
 function readUploaded(){try{return JSON.parse(localStorage.getItem(UPLOAD_KEY)||'[]').filter(x=>x&&x.id&&x.dataUrl)}catch(e){return[]}}
 function registerUploaded(rec){const im=new Image();im.onload=()=>{if(typeof render==='function')render()};im.src=rec.dataUrl;kind('upload:'+rec.id,rec.name||'ภาพอัปโหลด','อัปโหลด',p=>{if(im.complete&&im.naturalWidth){const w=rec.width||140,h=rec.height||110;g.drawImage(im,p.x-w/2,p.y-h,w,h)}})}
 readUploaded().forEach(registerUploaded);
 /* ---------- discover all repository image assets for the map picker ---------- */
 const REPO_ASSET_CACHE = 'project-a-village-repo-assets-v1';
 let repoAssetLoadStarted = false;
 function assetGroup(path) {
  const p = path.toLowerCase();
  if (/\b(building|house|inn|guild|shop|market|temple|forge|healer|player-house)\b/.test(p)) return 'อาคารจากคลังเกม';
  if (/\b(tree|bush|flower|grass|plant|nature|forest|leaf|herb)\b/.test(p)) return 'ธรรมชาติจากคลังเกม';
  if (/\b(rock|stone|ore|crystal|mine|mountain)\b/.test(p)) return 'หิน/แร่จากคลังเกม';
  if (/\b(fence|wall|gate|road|path|floor|ground|tile|terrain)\b/.test(p)) return 'พื้น/ทาง/สิ่งก่อสร้าง';
  if (/\b(prop|decor|furniture|bench|barrel|crate|sign|lamp|cart|well|pond|fountain)\b/.test(p)) return 'ของตกแต่งจากคลังเกม';
  return 'Asset เกมอื่นๆ';
 }
 function registerRepoAsset(path) {
  if (!path || !/\.(png|webp|jpe?g)$/i.test(path) || !path.startsWith('assets/')) return;
  // Skip UI art, card faces, and sprite sheets: these are not standalone map objects.
  if (/(^|\/)(ui|icons?|cards?|portraits?|faces|animations?|spritesheets?)(\/|[-_])/i.test(path)) return;
  const id = 'repoasset:' + path;
  if (KINDS[id]) return;
  const file = new Image();
  file.onload = () => { thumbCache.clear(); if (typeof render === 'function') render(); };
  file.src = 'https://raw.githubusercontent.com/ekkavish31/Project-Agrenor-Tactical-Card-Game/main/' + path.split('/').map(encodeURIComponent).join('/');
  const name = path.split('/').pop().replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
  kind(id, name, assetGroup(path), p => {
   if (!file.complete || !file.naturalWidth) return;
   const w = 130, h = w * file.naturalHeight / file.naturalWidth;
   g.drawImage(file, p.x - w / 2, p.y - h, w, h);
  });
 }
 async function loadRepositoryAssets() {
  if (repoAssetLoadStarted) return;
  repoAssetLoadStarted = true;
  try {
   // Cache the discovered paths locally; images themselves remain served by the public repository.
   const saved = JSON.parse(localStorage.getItem(REPO_ASSET_CACHE) || '[]');
   if (Array.isArray(saved) && saved.length) saved.forEach(registerRepoAsset);
   const response = await fetch('https://api.github.com/repos/ekkavish31/Project-Agrenor-Tactical-Card-Game/git/trees/main?recursive=1', { headers: { Accept: 'application/vnd.github+json' } });
   if (!response.ok) throw new Error('GitHub asset list unavailable');
   const tree = await response.json();
   if (!Array.isArray(tree.tree)) throw new Error('Invalid GitHub asset list');
   const paths = tree.tree.filter(x => x.type === 'blob' && x.path.startsWith('assets/') && /\.(png|webp|jpe?g)$/i.test(x.path)).map(x => x.path);
   paths.forEach(registerRepoAsset);
   try { localStorage.setItem(REPO_ASSET_CACHE, JSON.stringify(paths)); } catch (_) {}
   thumbCache.clear();
   if (typeof render === 'function') render();
  } catch (_) {
   // Existing built-in assets and user-uploaded assets remain available offline.
  }
 }
 loadRepositoryAssets();
 /* ---------- thumbnails (rendered from the real draw code) ---------- */
 const thumbCache = new Map();

 function renderThumb(drawFn, ax, ay, w = 112, h = 92) {
  const big = document.createElement('canvas');
  big.width = big.height = 560;
  const q = big.getContext('2d'),
   main = g;
  g = q;
  try {
   q.translate(280 - ax, 520 - ay);
   drawFn()
  } catch (e) {} finally {
   g = main
  }
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const o = out.getContext('2d');
  let bx = 0,
   by = 0,
   bw = 560,
   bh = 560,
   any = true;
  try {
   const d = q.getImageData(0, 0, 560, 560).data;
   let x0 = 560,
    y0 = 560,
    x1 = -1,
    y1 = -1;
   for (let y = 0; y < 560; y += 2)
    for (let x = 0; x < 560; x += 2)
     if (d[(y * 560 + x) * 4 + 3] > 20) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y
     } if (x1 < 0) any = false;
   else {
    bx = x0;
    by = y0;
    bw = x1 - x0 + 2;
    bh = y1 - y0 + 2
   }
  } catch (e) {}
  if (any) {
   const sc = Math.min((w - 8) / bw, (h - 8) / bh, 1.2);
   o.drawImage(big, bx, by, bw, bh, (w - bw * sc) / 2, (h - bh * sc) / 2, bw * sc, bh * sc)
  }
  return any ? out : null
 }

 function kindThumb(id) {
  if (thumbCache.has(id)) return thumbCache.get(id);
  const c = renderThumb(() => KINDS[id].draw({
   x: 0,
   y: 0
  }), 0, 0);
  if (c) thumbCache.set(id, c);
  return c
 }

 function entryThumb(E) {
  const k = E.ov?.kind;
  if (k && KINDS[k]) return kindThumb(k);
  return renderThumb(() => E.base(g), E.ax, E.ay)
 }
 const miniCache = new Map();

 function miniThumb(E) {
  const sig = E.key + '|' + JSON.stringify(E.ov || {});
  if (miniCache.has(sig)) return cloneCv(miniCache.get(sig));
  const c = entryThumb(E);
  if (c) miniCache.set(sig, c);
  return c ? cloneCv(c) : null
 }

 function cloneCv(c) {
  const n = document.createElement('canvas');
  n.width = c.width;
  n.height = c.height;
  n.getContext('2d').drawImage(c, 0, 0);
  return n
 }

 function putThumb(slot, c) {
  slot.replaceChildren();
  if (c) {
   const im = document.createElement('canvas');
   im.width = c.width;
   im.height = c.height;
   im.getContext('2d').drawImage(c, 0, 0);
   slot.append(im)
  } else slot.textContent = '…'
 }

 /* ---------- picker: visual list of everything that can be placed ---------- */
 let picker = null;

 function openPicker(title, current, onPick) {
  if (!picker) {
   picker = document.createElement('dialog');
   picker.id = 'aePicker';
   document.body.append(picker)
  }
  const groups = [...new Set(Object.values(KINDS).map(k => k.group))];
  let tab = 'ทั้งหมด',
   q = '';
  const draw = () => {
   const list = Object.entries(KINDS).filter(([id, k]) => (tab === 'ทั้งหมด' || k.group === tab) && (!q || k.label.includes(q) || id.includes(q)));
   picker.innerHTML = `<div class="pk-head"><b>${title}</b><input type="search" placeholder="ค้นหา…" value="${q}"><button data-upload>＋ อัปโหลดภาพ</button><button data-github>↙ จาก GitHub</button><button data-x>ปิด (Esc)</button></div><div class="pk-tabs">${['ทั้งหมด',...groups].map(gr=>`<button data-tab="${gr}" class="${gr===tab?'on':''}">${gr}</button>`).join('')}</div><div class="grid">${list.map(([id,k])=>`<button data-id="${id}" class="${id===current?'cur':''}"><span class="th"></span><span>${k.label}</span><small>${k.group}</small></button>`).join('')||'<p>ไม่พบ</p>'}</div>`;
   picker.querySelectorAll('[data-id]').forEach(b => {
    const slot = b.querySelector('.th');
    putThumb(slot, kindThumb(b.dataset.id));
    if (!thumbCache.has(b.dataset.id)) setTimeout(() => {
     thumbCache.delete(b.dataset.id);
     putThumb(slot, kindThumb(b.dataset.id))
    }, 700);
    b.onclick = () => {
     picker.close();
     onPick(b.dataset.id)
    }
   });
   picker.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
    tab = b.dataset.tab;
    draw()
   });
   picker.querySelector('[data-upload]').onclick=()=>{const input=document.createElement('input');input.type='file';input.accept='image/*';input.onchange=()=>{const file=input.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{const im=new Image();im.onload=()=>{const max=512,sc=Math.min(1,max/im.naturalWidth,max/im.naturalHeight),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.naturalWidth*sc));c.height=Math.max(1,Math.round(im.naturalHeight*sc));c.getContext('2d').drawImage(im,0,0,c.width,c.height);let dataUrl;try{dataUrl=c.toDataURL('image/webp',.9)}catch(e){dataUrl=c.toDataURL('image/png')}const rec={id:'u'+Date.now().toString(36),name:file.name.replace(/\\.[^.]+$/,'').slice(0,48)||'ภาพอัปโหลด',dataUrl,width:Math.min(220,c.width),height:Math.min(180,c.height)};const all=readUploaded();all.push(rec);try{localStorage.setItem(UPLOAD_KEY,JSON.stringify(all))}catch(e){alert('ภาพใหญ่เกินพื้นที่เก็บในเบราว์เซอร์');return}registerUploaded(rec);thumbCache.clear();picker.close();onPick('upload:'+rec.id)};im.onerror=()=>alert('อ่านไฟล์ภาพไม่สำเร็จ');im.src=reader.result};reader.readAsDataURL(file)};input.click()};
   picker.querySelector('[data-github]').onclick=async()=>{let url=prompt('วาง URL ของไฟล์ภาพจาก GitHub (เปิดไฟล์ภาพ แล้วเลือก Raw URL ได้)');if(!url)return;url=url.trim();if(url.includes('github.com/')&&url.includes('/blob/'))url=url.replace('https://github.com/','https://raw.githubusercontent.com/').replace('/blob/','/');if(!/^https:\/\/(raw\.githubusercontent\.com|github\.com)\//i.test(url)){alert('ใช้ URL https ของ raw.githubusercontent.com หรือ github.com เท่านั้น');return}try{const res=await fetch(url);if(!res.ok)throw Error('ดาวน์โหลดไม่สำเร็จ ('+res.status+')');const blob=await res.blob();if(!/^image\//i.test(blob.type))throw Error('ลิงก์นี้ไม่ได้ชี้ไปยังไฟล์ภาพโดยตรง');if(blob.size>8*1024*1024)throw Error('ไฟล์ใหญ่เกิน 8 MB');const tmp=URL.createObjectURL(blob),im=new Image();im.onload=()=>{URL.revokeObjectURL(tmp);const max=512,sc=Math.min(1,max/im.naturalWidth,max/im.naturalHeight),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.naturalWidth*sc));c.height=Math.max(1,Math.round(im.naturalHeight*sc));c.getContext('2d').drawImage(im,0,0,c.width,c.height);let dataUrl;try{dataUrl=c.toDataURL('image/webp',.9)}catch(e){dataUrl=c.toDataURL('image/png')}const filename=decodeURIComponent(url.split('/').pop().split('?')[0]).replace(/\.[^.]+$/,'').slice(0,48)||'GitHub asset',rec={id:'u'+Date.now().toString(36),name:filename,dataUrl,width:Math.min(220,c.width),height:Math.min(180,c.height)};const all=readUploaded();all.push(rec);try{localStorage.setItem(UPLOAD_KEY,JSON.stringify(all))}catch(e){alert('พื้นที่เก็บภาพในเบราว์เซอร์ไม่พอ');return}registerUploaded(rec);thumbCache.clear();picker.close();onPick('upload:'+rec.id)};im.onerror=()=>{URL.revokeObjectURL(tmp);alert('เปิดไฟล์ภาพจาก GitHub ไม่สำเร็จ')};im.src=tmp}catch(err){alert('นำเข้าจาก GitHub ไม่สำเร็จ: '+err.message+'\\nตรวจว่าเป็นไฟล์ภาพสาธารณะและ URL เป็น Raw') }};
   picker.querySelector('[data-x]').onclick = () => picker.close();
   const s = picker.querySelector('input');
   s.oninput = () => {
    q = s.value.trim();
    const pos = s.selectionStart;
    draw();
    const n = picker.querySelector('input');
    n.focus();
    n.setSelectionRange(pos, pos)
   }
  };
  draw();
  picker.showModal();
  picker.querySelector('input').focus()
 }

 /* ---------- copy one place's decoration to other places ---------- */
 function copyTo(src, targets) {
  const b = baseOf(src);
  if (!b) return {
   copied: 0,
   skipped: 0
  };
  const items = [];
  let skipped = 0;
  for (const E of frame.filter(e => e.owner === src && !e.hidden)) {
   const ov = E.ov || {},
    add = data.added.find(a => a.id === E.key),
    kind = ov.kind && KINDS[ov.kind] ? ov.kind : add ? add.kind : nameKind(E.name);
   if (!kind) {
    skipped++;
    continue
   }
   const w = inv(b.mirror ? b.cx * 2 - E.x : E.x, E.y);
   items.push({
    kind,
    du: +(w.u - b.u).toFixed(3),
    dv: +(w.v - b.v).toFixed(3),
    ov: {
     s: ov.s,
     r: ov.r,
     f: ov.f,
     z: ov.z,
     layer: ov.layer
    }
   })
  }
  for (const t of targets) {
   if (t === src || !baseOf(t)) continue;
   for (const E of frame.filter(e => e.owner === t))
    if (!E.key.startsWith('add:')) ovOf(E.key).hide = true;
   const gone = data.added.filter(a => a.owner === t).map(a => a.id);
   data.added = data.added.filter(a => a.owner !== t);
   for (const id of gone) delete data.edit[id];
   for (const it of items) {
    const id = 'add:' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    data.added.push({
     id,
     owner: t,
     du: it.du,
     dv: it.dv,
     kind: it.kind
    });
    data.edit[id] = {
     ...it.ov
    };
    clean(id)
   }
  }
  return {
   copied: items.length,
   skipped
  }
 }

 function openCopy(src) {
  if (!picker) {
   picker = document.createElement('dialog');
   picker.id = 'aePicker';
   document.body.append(picker)
  }
  const places = locations.filter(o => o.id !== src && o.id !== 'square' && baseOf(o.id));
  picker.innerHTML = `<div class="pk-head"><b>คัดลอกการแต่งของ ${ownerName(src)} ไปที่…</b><button data-x>ปิด (Esc)</button></div><div class="pk-tabs"><button data-all="npc">บ้าน NPC ทั้งหมด</button><button data-all="none">ล้างที่เลือก</button></div>
 <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">${places.map(o=>`<label style="display:flex;gap:8px;align-items:center;background:#132621;border:1px solid #4d6656;border-radius:10px;padding:8px"><input type="checkbox" value="${o.id}"> ${o.name}</label>`).join('')}</div>
 <p style="padding:0 12px;color:#c9d2b8">ของเดิมของสถานที่ปลายทางจะถูกซ่อน แล้วใส่ของชุดเดียวกับต้นทางในตำแหน่งเดียวกัน (กลับด้านให้เองถ้าอาคารหันอีกทาง) · ย้อนกลับได้</p><div class="pk-tabs" style="justify-content:flex-end"><button id="cpGo" style="background:#4f7a3c">คัดลอก</button></div>`;
  picker.querySelector('[data-x]').onclick = () => picker.close();
  picker.querySelectorAll('[data-all]').forEach(b => b.onclick = () => picker.querySelectorAll('input[type=checkbox]').forEach(c => c.checked = b.dataset.all === 'npc' && c.value.startsWith('npc')));
  picker.querySelector('#cpGo').onclick = () => {
   const t = [...picker.querySelectorAll('input:checked')].map(c => c.value);
   if (!t.length) return;
   UX.checkpoint();
   const r = copyTo(src, t);
   UX.persist();
   picker.close();
   render();
   flashStatus('คัดลอก ' + r.copied + ' ชิ้นไป ' + t.length + ' แห่ง' + (r.skipped ? ' · ข้าม ' + r.skipped + ' ชิ้นที่ยังไม่มีภาพแบบเลือกได้' : '') + ' · กด ย้อนกลับ ได้')
  };
  picker.showModal()
 }

 /* ---------- picture list picker (building images, character images) ---------- */
 function openList(title, items, current, onPick, extra = '') {
  if (!picker) {
   picker = document.createElement('dialog');
   picker.id = 'aePicker';
   document.body.append(picker)
  }
  const groups = [...new Set(items.map(i => i.group))];
  let tab = 'ทั้งหมด';
  const draw = () => {
   const list = items.filter(i => tab === 'ทั้งหมด' || i.group === tab);
   picker.innerHTML = `<div class="pk-head"><b>${title}</b><button data-x>ปิด (Esc)</button></div>${groups.length>1?`<div class="pk-tabs">${['ทั้งหมด',...groups].map(gr=>`<button data-tab="${gr}" class="${gr===tab?'on':''}">${gr}</button>`).join('')}</div>`:''}<div class="grid">${list.map((it,i)=>`<button data-i="${items.indexOf(it)}" class="${it.id===current?'cur':''}"><span class="th"></span><span>${it.label}</span><small>${it.group||''}</small></button>`).join('')}</div>${extra}`;
   picker.querySelectorAll('[data-i]').forEach(b => {
    const it = items[+b.dataset.i],
     slot = b.querySelector('.th'),
     t = it.thumb?.();
    if (t instanceof HTMLCanvasElement) putThumb(slot, t);
    else if (it.src || t) {
     const im = document.createElement('img');
     im.src = it.src || t;
     im.style.cssText = 'max-width:104px;max-height:86px;object-fit:contain';
     slot.replaceChildren(im)
    } else slot.textContent = it.icon || '—';
    b.onclick = () => {
     picker.close();
     onPick(it)
    }
   });
   picker.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
    tab = b.dataset.tab;
    draw()
   });
   picker.querySelector('[data-x]').onclick = () => picker.close()
  };
  draw();
  picker.showModal()
 }

 function canvasOf(im) {
  if (!im) return null;
  if (im instanceof HTMLCanvasElement) return im;
  if (!im.complete || !im.naturalWidth) return null;
  const c = document.createElement('canvas'),
   sc = Math.min(104 / im.naturalWidth, 86 / im.naturalHeight);
  c.width = Math.max(1, Math.round(im.naturalWidth * sc));
  c.height = Math.max(1, Math.round(im.naturalHeight * sc));
  c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
  return c
 }

 function buildingChoices(o) {
  if (isHouse(o)) return [{
   id: 'home',
   label: 'บ้านของเรา',
   group: 'บ้าน'
  }, ...HOUSE_TONES.map((_, i) => ({
   id: 'npc' + i,
   label: 'บ้านแบบ ' + (i + 1),
   group: 'บ้าน'
  }))].map(it => ({
   ...it,
   thumb: () => canvasOf(baseHouseImage(as(o, it.id, it.id !== 'home')))
  }));
  return Object.keys(artSpecs).filter(id => images['building_' + id]).map(id => ({
   id,
   label: loc(id)?.name || id,
   group: 'อาคาร',
   thumb: () => canvasOf(images['building_' + id])
  }))
 }

 /* ---------- panel ---------- */
 const css = document.createElement('style');
 css.textContent = `#assetEdit{position:fixed;right:14px;top:78px;z-index:9;width:340px;max-height:calc(100dvh - 96px);display:flex;flex-direction:column;background:#1b302af7;color:#f3ead0;border:1px solid #b9c48f;border-radius:12px;font-size:12px;box-shadow:0 10px 30px #0006}#assetEdit[hidden]{display:none}
#assetEdit .head{padding:11px 12px 0}#assetEdit .body{overflow:auto;padding:10px 12px 12px;flex:1}#assetEdit h3{margin:0 0 3px;font-size:16px;color:#fff0c7}#assetEdit .sub{color:#c9d2b8;margin:0 0 8px;line-height:1.55}#assetEdit .chip{display:inline-block;background:#e5c06b;color:#1b302a;border-radius:20px;padding:1px 8px;font-size:11px;margin-left:6px;vertical-align:2px}
#assetEdit .tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:3px;margin:8px 0 0}#assetEdit .tabs button{padding:6px 2px;font-size:11px;border-radius:8px 8px 0 0;border-bottom:0;background:#132621}#assetEdit .tabs button.on{background:#e5c06b;color:#1b302a;border-color:#e5c06b}#assetEdit .tabs button:disabled{opacity:.35}
#assetEdit label{display:grid;grid-template-columns:96px 1fr 46px;gap:6px;align-items:center;margin:6px 0}#assetEdit label.chk{display:flex}#assetEdit label.sel{grid-template-columns:118px 1fr}#assetEdit input[type=range]{width:100%}#assetEdit select{width:100%;padding:5px;background:#132621;color:inherit;border:1px solid #7f9170;border-radius:6px}
#assetEdit .row{display:flex;gap:5px;flex-wrap:wrap;margin:7px 0}#assetEdit button{padding:6px 9px;font-size:12px}#assetEdit hr{border:0;border-top:1px solid #4d6656;margin:10px 0}#assetEdit output{text-align:right;font-variant-numeric:tabular-nums}#assetEdit b.sec{display:block;margin:4px 0 2px;color:#fff0c7}
#assetEdit .art{display:flex;gap:10px;align-items:center;background:#132621;border:1px solid #4d6656;border-radius:10px;padding:8px}#assetEdit .th{width:112px;height:92px;flex:none;display:grid;place-items:center;background:repeating-conic-gradient(#20372e 0 25%,#1a2f27 0 50%) 0 0/16px 16px;border-radius:8px}#assetEdit .th img,#assetEdit .th canvas{max-width:104px;max-height:86px}
#assetEdit .nudge{display:grid;grid-template-columns:repeat(3,34px);gap:3px}#assetEdit .nudge button{padding:4px 0}
#assetEdit .foot{display:flex;gap:6px;padding:10px 12px;border-top:1px solid #4d6656;background:#16281f;border-radius:0 0 12px 12px}#assetEdit .foot button{flex:1;padding:9px;font-size:13px}#assetEdit .foot .reset{flex:none;padding:9px 10px}#assetEdit .ok{background:#4f7a3c;border-color:#b8d39a}#assetEdit .cancel{background:#5b3a30;border-color:#c49a8a}
#assetEdit .items{display:grid;gap:3px;max-height:280px;overflow:auto}#assetEdit .items button{display:flex;align-items:center;gap:8px;text-align:left}#assetEdit .items button.on{border-color:#9ff3f5;background:#24443d}#assetEdit .mini{width:44px;height:36px;flex:none;display:grid;place-items:center;background:#132621;border-radius:6px;overflow:hidden}#assetEdit .mini canvas,#assetEdit .mini img{max-width:44px;max-height:36px}#assetEdit .items small{color:#c9d2b8}
#assetEdit .places{display:grid;grid-template-columns:1fr 1fr;gap:4px}#assetEdit .places button{text-align:left}
#assetEdit.ae-shake{animation:aeShake .35s}@keyframes aeShake{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
#aePicker{width:min(760px,94vw);max-height:86vh;padding:0;border:1px solid #b9c48f;border-radius:14px;background:#1b302a;color:#f3ead0;font:13px system-ui,"Noto Sans Thai",sans-serif}#aePicker::backdrop{background:#071c17aa}
#aePicker .pk-head{display:flex;gap:8px;align-items:center;padding:12px;border-bottom:1px solid #4d6656;position:static}#aePicker .pk-head b{flex:1;font-size:15px;color:#fff0c7}#aePicker button{width:auto!important;margin:0!important}#aePicker input{padding:6px 10px;border-radius:8px;border:1px solid #7f9170;background:#132621;color:inherit}
#aePicker .pk-tabs{display:flex;gap:4px;flex-wrap:wrap;padding:8px 12px}#aePicker .pk-tabs button.on{background:#e5c06b;color:#1b302a}#aePicker .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;padding:12px;overflow:auto;max-height:62vh}
#aePicker .grid button{display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px;border-radius:10px;background:#132621;border:1px solid #4d6656;color:inherit;cursor:pointer}#aePicker .grid button:hover{border-color:#e5c06b}#aePicker .grid button.cur{border-color:#9ff3f5;box-shadow:0 0 0 2px #9ff3f555}
#aePicker .th{width:112px;height:92px;display:grid;place-items:center;background:repeating-conic-gradient(#20372e 0 25%,#1a2f27 0 50%) 0 0/16px 16px;border-radius:8px}#aePicker small{color:#9fb19a;font-size:10px}#aePicker button{font:inherit;background:#233a2e;color:inherit;border:1px solid #7f9170;border-radius:8px;padding:6px 10px;cursor:pointer}
#townTools .gh{min-width:0!important}`;
 document.head.append(css);
 const panel = document.createElement('section');
 panel.id = 'assetEdit';
 panel.hidden = true;
 document.body.append(panel);
 const slider = (id, label, v, min, max, step, fmt = x => x) => `<label>${label}<input type="range" data-k="${id}" min="${min}" max="${max}" step="${step}" value="${v}"><output>${fmt(v)}</output></label>`;
 const pct = x => Math.round(x * 100) + '%',
  deg = x => (Math.atan(x) * 180 / Math.PI).toFixed(1) + '°',
  unit = x => (+x).toFixed(1);
 const FMT = {
  s: pct,
  r: x => x + '°',
  layer: x => (x > 0 ? '+' : '') + x,
  sx: pct,
  sy: pct,
  kx: deg,
  ky: deg,
  all: pct,
  npc: pct
 };
 const nudgeHtml = `<div class="row" style="align-items:center"><span>ขยับละเอียด</span><div class="nudge"><span></span><button data-n="0,-2">↑</button><span></span><button data-n="-2,0">←</button><button data-n="0,2">↓</button><button data-n="2,0">→</button></div><small class="sub" style="margin:0">หรือลากบนแผนที่ · ลูกศร (Shift เร็ว)</small></div>`;
 let sliding = false;
 // a slider gesture = one undo step; the value is written live, saved when released
 function bindSliders(write, done) {
  panel.querySelectorAll('input[type=range][data-k]').forEach(i => {
   i.oninput = () => {
    if (!sliding) {
     UX.checkpoint();
     sliding = true
    }
    write(i.dataset.k, +i.value, i);
    const f = i.dataset.f ? FMTX[i.dataset.f] : FMT[i.dataset.k];
    i.nextElementSibling.textContent = f ? f(+i.value) : i.value
   };
   i.onchange = () => {
    sliding = false;
    done?.(i.dataset.k);
    UX.persist()
   }
  })
 }
 const FMTX = {
  pct,
  unit
 };
 const act = (sel, fn) => {
  const b = panel.querySelector(sel);
  if (b) b.onclick = fn
 };
 const once = fn => () => {
  UX.checkpoint();
  fn();
  UX.persist();
  render()
 };

 function itemName(E, list) {
  const b = E.ov?.kind && KINDS[E.ov.kind] ? KINDS[E.ov.kind].label : E.label,
   same = list.filter(x => (x.ov?.kind && KINDS[x.ov.kind] ? KINDS[x.ov.kind].label : x.label) === b);
  return same.length > 1 ? b + ' ' + (same.indexOf(E) + 1) : b
 }

 function render() {
  panel.hidden = !editing || testWalk;
  if (panel.hidden) return;
  if (place) return renderPlace();
  const m = UX.getMode();
  if (m === 'chars') return renderChars();
  if (m === 'road' || m === 'draw') return renderRoads(m);
  renderMap()
 }

 function renderMap() {
  const gates = Village25D.getExits().map((x, i) => ['exit:' + i, 'ประตู' + (x.name || '')]);
  panel.innerHTML = `<div class="body"><h3>🗺 หมู่บ้าน</h3><p class="sub">ชี้สถานที่ = เห็นกรอบขาวทั้งแปลง · <b>คลิก</b> = เปิดแก้ในสถานที่นั้น · <b>ลาก</b> = ย้ายทั้งแปลง (ถนนตามไปเอง)</p>
  <b class="sec">สถานที่</b><div class="places">${locations.map(o=>`<button data-open="${o.id}">${o.num??''} ${o.name}</button>`).join('')}</div>
  <b class="sec" style="margin-top:8px">ประตูผจญภัย</b><div class="places">${gates.map(([k,n])=>`<button data-open="${k}">${n}</button>`).join('')}</div><hr>
  <b class="sec">ทั้งแผนที่</b>${slider('blend','รอยต่อพื้นนุ่ม',ROAD_BLEND,0,60,1,x=>x?x+'px':'คม')}
  <div class="row"><button data-click="grid">พื้นที่เดิน</button><button data-click="routes">เส้นทาง</button><button data-click="export">ส่งออกผัง</button><button data-click="import">นำเข้าผัง…</button><button data-click="reset">คืนผังเริ่มต้น</button></div>
  <div class="sub" id="aeConn">${document.getElementById('connection')?.innerHTML||''}</div></div>`;
  panel.querySelectorAll('[data-open]').forEach(b => {
   b.onmouseenter = () => hoverOwner = b.dataset.open;
   b.onmouseleave = () => hoverOwner = null;
   b.onclick = () => enter(b.dataset.open)
  });
  bindTools();
  const i = panel.querySelector('[data-k=blend]');
  i.oninput = () => i.nextElementSibling.textContent = +i.value ? i.value + 'px' : 'คม';
  i.onchange = () => setRoadBlend(i.value)
 }

 function bindTools() {
  panel.querySelectorAll('[data-click]').forEach(b => b.onclick = () => {
   document.getElementById(b.dataset.click)?.click();
   setTimeout(render, 50)
  })
 }

 function renderRoads(m) {
  const oldListScroll = panel.querySelector('.items')?.scrollTop || 0;
  const list = UX.roadList ? UX.roadList() : [], sel = UX.selectedRoad ? UX.selectedRoad() : -1, K = UX.ROAD_KINDS || {}, kindOpts = cur => Object.entries(K).map(([k, n]) => `<option value="${k}" ${cur===k?'selected':''}>${n}</option>`).join('');
  panel.innerHTML = `<div class="body"><h3>${m==='road'?'〰 ดัดถนน':'✏ วาดถนน'}</h3><p class="sub">${m==='road'?'เลือกชื่อถนนเพื่อไฮไลท์เส้นนั้นบนแผนที่ · ลากจุดสีทองเพื่อดัด · Delete = ลบเส้นที่เลือก':'ลากบนแผนที่เพื่อวาดถนนเส้นใหม่ (เข้ากริดอัตโนมัติ) แล้วต่อกับถนนเดิมหรือประตูสถานที่'} · ถนน = พื้นที่เดินได้ของตัวเอกและ NPC · ${UX.isManual?.()?'<b>ผังถนนแบบกำหนดเอง</b>':'ตอนนี้เป็นถนนอัตโนมัติ (แก้เส้นไหนก็จะเปลี่ยนเป็นแบบกำหนดเอง)'}</p>
  ${m==='draw'?`<label class="sel">ชนิดถนนที่จะวาด<select id="rDrawKind">${kindOpts(UX.drawKind?.())}</select></label>`:''}
  <b class="sec">ถนนทั้งหมด (${list.length})</b><div class="items" style="max-height:220px">${list.map(r=>`<div style="display:flex;gap:4px;align-items:center"><button data-road="${r.i}" title="เลือกเพื่อไฮไลท์บนแผนที่" style="flex:1;text-align:left;white-space:normal;line-height:1.3;${r.i===sel?'background:#e5c06b;color:#1b302a;outline:2px solid #fff4a8':''}">${r.label||((UX.ROAD_KINDS?.[r.kind]||r.kind)+' '+(r.i+1))}<small style="display:block;opacity:.75">${r.points} จุด · คลิกเพื่อไฮไลท์</small></button><select data-rk="${r.i}" title="ชนิดถนน" style="width:150px">${kindOpts(r.kind)}</select><button data-rdel="${r.i}" title="ลบเส้นนี้">✕</button></div>`).join('')||'<p class="sub">ยังไม่มีถนน · กด ✏ วาดถนน แล้วลากบนแผนที่</p>'}</div>
  <div class="row"><button data-click="townRoadDelete" ${sel<0?'disabled':''}>ลบถนนที่เลือก</button><button id="rClear">ลบถนนทั้งหมด (วาดเองใหม่)</button></div>
  <div class="row"><button data-click="townRoadReset">สร้างถนนอัตโนมัติใหม่</button></div><hr>
  ${slider('blend','รอยต่อพื้นนุ่ม',ROAD_BLEND,0,60,1,x=>x?x+'px':'คม')}<p class="sub">ความกว้างที่ลายพื้นต่างชนิดค่อย ๆ ผสมกัน (0 = ขอบคม)</p>
  <label class="sel">ทรงถนน<select id="rShape"><option value="square" ${ROAD_SHAPE==='square'?'selected':''}>เหลี่ยมตามกริด</option><option value="round" ${ROAD_SHAPE==='round'?'selected':''}>มน</option></select></label>
  <p class="sub">พื้นทางเข้าของแต่ละสถานที่: คลิกสถานที่ → แท็บทางเข้า</p></div>`;
  const roadItems = panel.querySelector('.items'); if (roadItems) roadItems.scrollTop = oldListScroll;
  bindTools();
  panel.querySelectorAll('[data-road]').forEach(b => b.onclick = () => { UX.selectRoad(+b.dataset.road); render() });
  panel.querySelectorAll('[data-rk]').forEach(s2 => s2.onchange = () => { UX.setRoadKind(+s2.dataset.rk, s2.value); render() });
  panel.querySelectorAll('[data-rdel]').forEach(b => b.onclick = () => { UX.deleteRoad(+b.dataset.rdel); render() });
  act('#rClear', () => { if (window.confirm('ลบถนนทั้งหมด แล้ววาดเองใหม่?\n(พื้นทางเข้าของแต่ละสถานที่ยังอยู่)')) { UX.clearRoads(); render() } });
  const dk = panel.querySelector('#rDrawKind'); if (dk) dk.onchange = () => UX.setDrawKind(dk.value);
  const sh = panel.querySelector('#rShape'); if (sh) sh.onchange = () => setRoadShape(sh.value);
  const i = panel.querySelector('[data-k=blend]');
  i.oninput = () => i.nextElementSibling.textContent = +i.value ? i.value + 'px' : 'คม';
  i.onchange = () => setRoadBlend(i.value)
 }


 function renderChars() {
  const list = castList();
  if (selChar && !list.some(c => c.k === selChar)) selChar = null;
  const thumbOf = c => castOf(c.k)?.img || (c.k === 'hero' && typeof TACTICS_SPRITES !== 'undefined' ? TACTICS_SPRITES.directions?.SE?.idle?.src || '' : '');
  let html = `<div class="body"><h3>👤 ตัวละครในหมู่บ้าน</h3><p class="sub">ค่าในหน้านี้ใช้เฉพาะแผนที่หมู่บ้าน · คลิกตัวละครบนแผนที่ (ตอนนี้หยุดยืนนิ่ง) หรือเลือกจากรายการ</p>
  ${slider('all','ทั้งแผนที่',+data.cast.all||1,.4,2.5,.05,pct)}${slider('npc','NPC ทุกตัว',castOf('npc')?.s??1,.4,2.5,.05,pct)}
  <div class="items">${list.map(c=>`<button data-c="${c.k}" class="${c.k===selChar?'on':''}"><span class="mini">${thumbOf(c)?`<img src="${thumbOf(c)}">`:'🧑'}</span><span style="flex:1">${c.name}${c.role?` <small>· ${c.role}</small>`:''}</span><small>${castOf(c.k)?.img?'เปลี่ยนภาพ':''}${castOf(c.k)?.s&&castOf(c.k).s!==1?' '+pct(castOf(c.k).s):''}</small></button>`).join('')}</div>`;
  if (selChar) {
   const c = castOf(selChar) || {},
    name = list.find(x => x.k === selChar).name,
    art = CAST_ART.find(a => a.id === c.img);
   html += `<hr><b class="sec">${name}</b><div class="art"><span class="th">${thumbOf({k:selChar})?`<img src="${thumbOf({k:selChar})}">`:'ภาพเดิม (วาดด้วยโค้ด)'}</span><div><div class="row" style="margin:0 0 6px"><button id="cSwap">เปลี่ยนภาพ…</button></div>${c.img?`<button id="cOrig">ใช้ภาพเดิม</button><p class="sub" style="margin:6px 0 0">${art?.label||''}</p>`:''}</div></div>
   ${slider('s','ขนาดตัวนี้',c.s??1,.3,3,.05,pct)}${c.img?`<label class="chk"><input type="checkbox" id="cFlip" ${c.flip?'checked':''}> กลับด้านภาพ</label>`:''}
   <div class="row"><button id="cReset">ค่าเริ่มต้นของตัวนี้</button></div>`
  }
  panel.innerHTML = html + '</div>';
  panel.querySelectorAll('[data-c]').forEach(b => b.onclick = () => {
   selChar = b.dataset.c;
   render()
  });
  const cs = k => data.cast[k] && typeof data.cast[k] === 'object' ? data.cast[k] : (data.cast[k] = {});
  bindSliders((k, v) => {
   if (k === 'all') data.cast.all = v;
   else if (k === 'npc') cs('npc').s = v;
   else cs(selChar).s = v
  }, () => {
   tidyCast();
   render()
  });
  act('#cSwap', () => openList('ภาพของ ' + list.find(x => x.k === selChar).name, CAST_ART, castOf(selChar)?.img, it => {
   UX.checkpoint();
   const c = cs(selChar);
   c.img = it.id;
   if (it.back) c.back = it.back;
   else delete c.back;
   UX.persist();
   render()
  }));
  act('#cOrig', once(() => {
   const c = cs(selChar);
   delete c.img;
   delete c.back;
   delete c.flip;
   tidyCast()
  }));
  act('#cReset', once(() => {
   delete data.cast[selChar];
   tidyCast()
  }));
  const f = panel.querySelector('#cFlip');
  if (f) f.onchange = once(() => {
   cs(selChar).flip = f.checked || undefined;
   tidyCast()
  })
 }

 function tidyCast() {
  if (data.cast.all === 1) delete data.cast.all;
  for (const [k, v] of Object.entries(data.cast)) {
   if (k === 'all' || !v || typeof v !== 'object') continue;
   for (const f of Object.keys(v))
    if (v[f] == null || f === 's' && v[f] === 1 || v[f] === false) delete v[f];
   if (!Object.keys(v).length) delete data.cast[k]
  }
 }

 function renderPlace() {
  const id = place.id,
   o = loc(id),
   framed = hasFrame(o),
   items = frame.filter(e => e.owner === id);
  if (!o && place.tab !== 'items') place.tab = 'items';
  if (place.tab === 'frame' && !framed || place.tab === 'entry' && (!o || o.id === 'square')) place.tab = 'building';
  place.keys = place.keys.filter(k => items.some(e => e.key === k));
  const tabs = [
   ['building', '🏠 อาคาร', !!o],
   ['frame', '🔲 กรอบนอก', framed],
   ['items', '🪴 ของย่อย ' + items.length, true],
   ['entry', '🚪 ทางเข้า', !!o && o.id !== 'square']
  ];
  const changed = snapOf() !== place.before;
  panel.innerHTML = `<div class="head"><h3>${ownerName(id)}<span class="chip">${changed?'แก้แล้ว':'กำลังแก้'}</span></h3><p class="sub" style="margin:0">ที่อื่นถูกล็อกไว้ · ✓ เสร็จ = เก็บทั้งสถานที่ · ยกเลิก = คืนทั้งสถานที่</p>
  <div class="tabs">${tabs.map(([t,l,on])=>`<button data-tab="${t}" class="${place.tab===t?'on':''}" ${on?'':'disabled'}>${l}</button>`).join('')}</div></div>
  <div class="body" id="peBody"></div>
  <div class="foot"><button class="reset" id="peReset" title="คืนค่าทั้งหมดของสถานที่นี้">⟲</button><button class="ok" id="peOk">✓ เสร็จ <small>Enter</small></button><button class="cancel" id="peCancel">ยกเลิก <small>Esc</small></button></div>`;
  panel.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
   place.tab = b.dataset.tab;
   if (b.dataset.tab !== 'items') place.keys = [];
   render()
  });
  act('#peOk', () => leave(true));
  act('#peCancel', () => leave(false));
  act('#peReset', resetPlace);
  const body = panel.querySelector('#peBody');
  ({
   building: tabBuilding,
   frame: tabFrame,
   items: tabItems,
   entry: tabEntry
  })[place.tab](body, o, items);
  panel.querySelectorAll('[data-n]').forEach(b => b.onclick = () => {
   const [x, y] = b.dataset.n.split(',').map(Number);
   nudge(x, y)
  })
 }

 function tabBuilding(body, o) {
  const t = data.buildings[o.id] || {},
   choices = o.id === 'square' ? [] : buildingChoices(o),
   cur = choices.find(c => c.id === (t.art || o.id)) || choices.find(c => c.id === (isHouse(o) ? (o.npc ? o.id : 'home') : o.id));
  body.innerHTML = `${choices.length?`<div class="art"><span class="th" id="bThumb"></span><div><div class="row" style="margin:0 0 6px"><button id="bSwap">เปลี่ยนภาพ…</button></div>${t.art&&t.art!==o.id?'<button id="bOrig">ใช้ภาพเดิม</button>':''}<p class="sub" style="margin:6px 0 0">${cur?.label||''}</p></div></div>`:''}
  ${o.id!=='square'?`<div class="row"><button id="bFacing">หันหน้า: ${o.facing==='SE'?'↘ SE':'↙ SW'} ⇄</button><button id="bFlip">${o.flipArt?'✓ ':''}พลิกภาพ ซ้าย↔ขวา</button></div>`:''}
  ${slider('sx','กว้าง',t.sx??1,.5,1.6,.01,FMT.sx)}${slider('sy','สูง',t.sy??1,.5,1.6,.01,FMT.sy)}${slider('ix','แกนเฉียง ↗↙ (%)',Math.round((t.ix??1)*100),50,200,1,v=>v+'%')}${slider('iy','แกนเฉียง ↖↘ (%)',Math.round((t.iy??1)*100),50,200,1,v=>v+'%')}${slider('kx','เอียงซ้าย-ขวา',t.kx||0,-.6,.6,.005,FMT.kx)}${slider('ky','ยกด้านข้าง',t.ky||0,-.6,.6,.005,FMT.ky)}${nudgeHtml}
  <b class="sec">ชั้น (layer)</b>${zRow('bz','ชั้นอาคาร',t.z||0,'เทียบกับของย่อยในสถานที่นี้ · ของย่อยที่เลขมากกว่าจะทับอาคาร')}${zRow('pz','ชั้นทั้งสถานที่',t.pz||0,'อาคาร+ของย่อยทั้งชุด เทียบกับสถานที่อื่น · 0 = ตามความลึก')}
  <label class="chk"><input type="checkbox" id="bGuides" ${guides?'checked':''}> แสดงเส้นช่วย 2:1 (ฟ้า = ฐานอาคาร)</label>
  <p class="sub">ป้ายชื่อ: ลากป้ายบนแผนที่ไปวางได้${o.label?' · <a href="#" id="bLabel" style="color:#9ff3f5">คืนตำแหน่งป้าย</a>':''}</p>
  <div class="row"><button id="bReset">คืนค่าอาคารนี้</button>${isHouse(o)?'<button id="bAll">ใช้ขนาด/มุมนี้กับบ้านทุกหลัง</button>':''}</div>`;
  const th = body.querySelector('#bThumb');
  if (th) {
   const c = cur?.thumb?.();
   putThumb(th, c);
   if (!c) setTimeout(() => putThumb(th, cur?.thumb?.()), 600)
  }
  act('#bSwap', () => openList('เปลี่ยนภาพ ' + o.name, choices, cur?.id, it => {
   UX.checkpoint();
   const b = data.buildings[o.id] || (data.buildings[o.id] = {});
   if (it.id === o.id || !o.npc && it.id === 'home' && o.id === 'home') delete b.art;
   else b.art = it.id;
   if (!Object.keys(b).length) delete data.buildings[o.id];
   UX.persist();
   render()
  }));
  const bset = (k, d) => { const b = data.buildings[o.id] || (data.buildings[o.id] = {}); b[k] = clampN((b[k] || 0) + d, -20, 20); if (!b[k]) delete b[k]; if (!Object.keys(b).length) delete data.buildings[o.id] };
  bindZ('bz', d => bset('z', d));
  bindZ('pz', d => bset('pz', d));
  act('#bOrig', once(() => {
   delete data.buildings[o.id].art;
   if (!Object.keys(data.buildings[o.id]).length) delete data.buildings[o.id]
  }));
  act('#bFacing', () => {
   selected = o.id;
   document.getElementById('facing').click();
   render()
  });
  act('#bFlip', () => {
   selected = o.id;
   document.getElementById('flipArt').click();
   render()
  });
  act('#bLabel', once(() => delete o.label));
  act('#bReset', once(() => {
   const a = data.buildings[o.id]?.art;
   delete data.buildings[o.id];
   if (a) data.buildings[o.id] = {
    art: a
   }
  }));
  act('#bAll', once(() => {
   const src = data.buildings[o.id] || {};
   for (const x of locations)
    if (isHouse(x) && x.id !== o.id) {
     const keep = data.buildings[x.id] || {},
      n = {};
     for (const k of ['sx', 'sy', 'ix', 'iy', 'kx', 'ky'])
      if (src[k] != null) n[k] = src[k];
     for (const k of ['dx', 'dy', 'art'])
      if (keep[k] != null) n[k] = keep[k];
     if (Object.keys(n).length) data.buildings[x.id] = n;
     else delete data.buildings[x.id]
    } flashStatus('ใช้ขนาด/มุมเดียวกันกับบ้านทุกหลังแล้ว · กด ย้อน ได้')
  }));
  body.querySelector('#bGuides').onchange = e => guides = e.target.checked;
  bindSliders((k, v) => {
   const b = data.buildings[o.id] || (data.buildings[o.id] = {});
   // ix/iy sliders display percentages; store a multiplier (1.00 = 100%), not 100.
   b[k] = (k === 'ix' || k === 'iy') ? v / 100 : v;
   if ((k === 'ix' || k === 'iy') && b[k] === 1) delete b[k];
  })
 }

 function tabFrame(body, o) {
  const e = estate(o),
   d = baseEstateFn(o),
   f = data.frames[o.id] || {},
   sides = f.sides || {};
  body.innerHTML = `<p class="sub">ลาก <b style="color:#7fe3ff">มุมสีฟ้า</b> บนแผนที่เพื่อขยาย/หดแปลง · พื้นลานหน้าทางเข้าและถนนจะตามให้เอง</p>
  ${slider('left','ขอบซ้าย',-e.left,o.w+.4,o.w+14,.1,unit).replace('data-k','data-f="unit" data-k')}${slider('right','ขอบขวา',e.right,o.w+.4,o.w+14,.1,unit).replace('data-k','data-f="unit" data-k')}
  ${slider('back','ขอบหลัง',-e.back,o.d+.4,o.d+12,.1,unit).replace('data-k','data-f="unit" data-k')}${slider('front','ขอบหน้า',e.front,o.d+1.2,o.d+16,.1,unit).replace('data-k','data-f="unit" data-k')}
  ${slider('gate','ช่องประตูกว้าง',(e.gate??2.8)*2,1.2,14,.1,unit).replace('data-k','data-f="unit" data-k')}<hr>
  <b class="sec">รั้วรอบอัตโนมัติ (ทุกด้าน เว้นช่องประตู)</b><div class="row" style="flex-wrap:wrap">${[['wood','🪵 รั้วไม้'],['stone','🧱 กำแพงหิน'],['hedge','🌳 พุ่มไม้'],['flowers','🌼 ดอกไม้'],['planter','🪴 กระถาง'],['none','ไม่มี'],['auto','ตามแบบเดิม']].map(([k,l])=>`<button data-fence="${k}">${l}</button>`).join('')}</div>
  <b class="sec">ขอบแต่ละด้าน</b>${Object.entries(SIDES).map(([s,l])=>`<label class="sel">${l}<select data-side="${s}">${Object.entries(BORDERS).map(([k,n])=>`<option value="${k}" ${(sides[s]||'auto')===k?'selected':''}>${n}</option>`).join('')}</select></label>`).join('')}
  <p class="sub">เปลี่ยนขนาด/ขอบแล้ว ของประดับเดิมบนแนวขอบจะถูกวางใหม่ตามแนวใหม่</p>
  <div class="row"><button id="fReset">คืนกรอบเดิม</button></div>`;
  const ff = () => data.frames[o.id] || (data.frames[o.id] = {});
  bindSliders((k, v) => {
   const F = ff();
   if (k === 'left') F.left = -v;
   else if (k === 'back') F.back = -v;
   else if (k === 'gate') F.gate = v / 2;
   else F[k] = v;
   cacheSolids();
   terrainDirty = true
  }, () => {
   tidyFrame(o.id, d);
   UX.refresh()
  });
  body.querySelectorAll('[data-side]').forEach(s => s.onchange = once(() => {
   const F = ff();
   F.sides = F.sides || {};
   if (s.value === 'auto') delete F.sides[s.dataset.side];
   else F.sides[s.dataset.side] = s.value;
   tidyFrame(o.id, d)
  }));
  body.querySelectorAll('[data-fence]').forEach(b => b.onclick = once(() => {
   const F = ff(), k = b.dataset.fence;
   if (k === 'auto') delete F.sides;
   else F.sides = { back: k, left: k, right: k, front: k };
   tidyFrame(o.id, d)
  }));
  act('#fReset', once(() => {
   delete data.frames[o.id];
   UX.refresh()
  }))
 }

 function tidyFrame(id, d) {
  const F = data.frames[id];
  if (!F) return;
  for (const k of ['left', 'right', 'back', 'front'])
   if (F[k] != null && Math.abs(F[k] - d[k]) < .05) delete F[k];
  if (F.gate != null && Math.abs(F.gate - 2.8) < .05) delete F.gate;
  if (F.sides && !Object.keys(F.sides).length) delete F.sides;
  if (!Object.keys(F).length) delete data.frames[id]
 }

 function tabItems(body, o, items) {
  const keys = place.keys;
  if (keys.length === 1) return itemEditor(body, keys[0], items);
  if (keys.length > 1) {
   const ents = keys.map(k => items.find(e => e.key === k)).filter(Boolean);
   body.innerHTML = `<b class="sec">เลือก ${ents.length} ชิ้น <span class="chip">กลุ่ม</span></b><p class="sub">Shift+คลิก = เพิ่ม/เอาออก · ลากชิ้นใดก็ได้ในกลุ่มเพื่อย้ายทั้งหมด</p>
   <div class="items">${ents.map(e=>`<button data-k="${e.key}"><span class="mini"></span><span style="flex:1">${itemName(e,items)}</span><b title="เอาออกจากกลุ่ม">✕</b></button>`).join('')}</div>${nudgeHtml}${groupHtml(ents.length)}
   <div class="row"><button id="gHide">ซ่อนทั้งหมด</button><button id="gShow">แสดงทั้งหมด</button><button id="gReset">คืนค่าทั้งหมด</button><button id="gDel">ลบ (Delete)</button><button id="gNone">เลิกเลือก</button></div>`;
   body.querySelectorAll('[data-k]').forEach(b => {
    const E = items.find(x => x.key === b.dataset.k),
     m = b.querySelector('.mini'),
     c = E && miniThumb(E);
    if (c) m.append(c);
    b.onmouseenter = () => hoverKey = b.dataset.k;
    b.onmouseleave = () => hoverKey = null;
    b.onclick = () => selectItem(b.dataset.k, true)
   });
   act('#gHide', once(() => keys.forEach(k => ovOf(k).hide = true)));
   act('#gShow', once(() => keys.forEach(k => delete ovOf(k).hide)));
   act('#gReset', once(() => keys.forEach(k => delete data.edit[k])));
   act('#gDel', removeSelected);
   bindGroup();
   act('#gNone', () => {
    place.keys = [];
    render()
   });
   return
  }
  body.innerHTML = `<p class="sub">คลิกชิ้นบนแผนที่ (จุดสีทอง) หรือในรายการ · Shift+คลิก = เลือกหลายชิ้น · จุดแดง = ชิ้นที่ซ่อนอยู่</p>
  <div class="row"><button id="iAdd" style="background:#4f7a3c;border-color:#b8d39a">＋ เพิ่มของ…</button>${o?'<button id="iCopy">คัดลอกการแต่งไปที่อื่น…</button>':''}<button id="iReset">คืนของย่อยทั้งหมด</button></div>
  <div class="row"><button id="iAll">เลือกทั้งหมด</button>${clip()?.recs?.length?`<button id="gPaste">วางที่คัดลอก (${clip().recs.length}) <small>Ctrl+V</small></button>`:''}</div>
  <div class="items">${items.map(e=>`<button data-key="${e.key}"><span class="mini"></span><span style="flex:1">${itemName(e,items)}</span><small>${e.hidden?'ซ่อนอยู่':e.key.startsWith('add:')?'เพิ่มเอง':Object.keys(e.ov||{}).length?'แก้แล้ว':''}</small></button>`).join('')||'<p class="sub">ยังไม่มีของในสถานที่นี้ · กด ＋ เพิ่มของ</p>'}</div>`;
  body.querySelectorAll('[data-key]').forEach(b => {
   const E = items.find(x => x.key === b.dataset.key),
    m = b.querySelector('.mini'),
    c = E && miniThumb(E);
   if (c) m.append(c);
   b.onmouseenter = () => hoverKey = b.dataset.key;
   b.onmouseleave = () => hoverKey = null;
   b.onclick = e => selectItem(b.dataset.key, e.shiftKey)
  });
  act('#iAdd', () => openPicker('เพิ่มของให้ ' + ownerName(place.id), '', k => {
   const base = baseOf(place.id);
   if (!base) return;
   UX.checkpoint();
   const nid = 'add:' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
   data.added.push({
    id: nid,
    owner: place.id,
    du: 0,
    dv: +base.front.toFixed(2),
    kind: k
   });
   UX.persist();
   place.keys = [nid];
   requestAnimationFrame(() => requestAnimationFrame(render));
   flashStatus('วางของใหม่หน้าสถานที่แล้ว · ลากไปวางตำแหน่งที่ต้องการ')
  }));
  act('#iCopy', () => openCopy(place.id));
  act('#gPaste', pasteGroup);
  act('#iAll', () => { place.keys = items.map(e => e.key); render() });
  act('#iReset', () => {
   if (!window.confirm('คืนของย่อยทั้งหมดของ ' + ownerName(place.id) + ' (รวมของที่เพิ่มเอง)?')) return;
   once(() => {
    const id = place.id;
    for (const k of Object.keys(data.edit))
     if (k === id || k.startsWith(id + ':') || data.added.some(a => a.id === k && a.owner === id)) delete data.edit[k];
    data.added = data.added.filter(a => a.owner !== id)
   })()
  })
 }

 function itemEditor(body, key, items) {
  const E = items.find(e => e.key === key),
   added = data.added.find(a => a.id === key),
   ov = data.edit[key] || {},
   label = ov.kind && KINDS[ov.kind] ? KINDS[ov.kind].label : E?.label || KINDS[added?.kind]?.label || 'ของประดับ';
  body.innerHTML = `<div class="row" style="margin-top:0"><button id="iBack">← ของย่อยทั้งหมด</button></div><b class="sec">${label}${ov.hide?' <span class="chip">ซ่อนอยู่</span>':''}</b>
  <div class="art"><span class="th" id="aeThumb"></span><div><div class="row" style="margin:0 0 6px"><button id="aeSwap">เปลี่ยนภาพ…</button></div>${ov.kind&&!added?'<button id="aeOrig">ใช้ภาพเดิม</button>':''}</div></div>
  ${nudgeHtml}${slider('s','ขนาด',ov.s??1,.3,2.5,.01,FMT.s)}${slider('ix','แกนเฉียง ↗↙ (%)',Math.round((ov.ix??1)*100),50,200,1,v=>v+'%')}${slider('iy','แกนเฉียง ↖↘ (%)',Math.round((ov.iy??1)*100),50,200,1,v=>v+'%')}${slider('r','หมุน',ov.r||0,-180,180,1,FMT.r)}<p class="sub">100% = เดิม · ปรับสองแกนเฉียงแยกกันตามระนาบ 2.5D</p>${zRow('iz','ชั้นของชิ้นนี้',ov.z||0,'ในสถานที่นี้ · อาคาร = '+layerOf(place.id).z)}
  <label class="chk"><input type="checkbox" id="aeFlip" ${ov.f?'checked':''}> กลับด้านซ้าย-ขวา</label>
  <div class="row">${added?'<button id="aeDel">ลบชิ้นนี้ (Delete)</button>':`<button id="aeHide">${ov.hide?'แสดงกลับ':'ซ่อนชิ้นนี้ (Delete)'}</button>`}<button id="aeDup">ทำสำเนา</button><button id="aeReset">คืนค่าเริ่มต้น</button></div>${groupHtml(1)}`;
  putThumb(body.querySelector('#aeThumb'), E ? entryThumb(E) : added ? kindThumb(added.kind) : null);
  act('#iBack', () => {
   place.keys = [];
   render()
  });
  act('#aeSwap', () => openPicker('เปลี่ยนภาพของชิ้นนี้', ov.kind || added?.kind || '', k => once(() => {
   if (added) added.kind = k;
   else ovOf(key).kind = k
  })()));
  act('#aeOrig', once(() => delete ovOf(key).kind));
  act('#aeHide', once(() => {
   if (ov.hide) delete ovOf(key).hide;
   else ovOf(key).hide = true
  }));
  act('#aeDel', removeSelected);
  act('#aeReset', once(() => delete data.edit[key]));
  act('#aeDup', () => {
   const kind = ov.kind && KINDS[ov.kind] ? ov.kind : added ? added.kind : nameKind(E?.name);
   if (!kind || !E) {
    flashStatus('ชิ้นนี้ยังทำสำเนาไม่ได้ (ไม่มีภาพแบบเลือกได้)');
    return
   }
   const b = baseOf(place.id),
    w = inv(b.mirror ? b.cx * 2 - E.x : E.x, E.y),
    nid = 'add:' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
   once(() => {
    data.added.push({
     id: nid,
     owner: place.id,
     du: +(w.u - b.u + .8).toFixed(3),
     dv: +(w.v - b.v + .8).toFixed(3),
     kind
    });
    data.edit[nid] = {
     s: ov.s,
     r: ov.r,
     f: ov.f,
     z: ov.z,
     layer: ov.layer
    };
    clean(nid);
    place.keys = [nid]
   })()
  });
  bindGroup();
  bindZ('iz', d => { const v = ovOf(key); v.z = clampN((v.z || 0) + d, -20, 20); clean(key) });
  body.querySelector('#aeFlip').onchange = e => once(() => ovOf(key).f = e.target.checked)();
  bindSliders((k, v) => {const ov=ovOf(key);if(k==='ix'||k==='iy')ov[k]=v/100;else ov[k]=v}, () => clean(key))
 }

 function tabEntry(body, o) {
  const deep = !!o.entry?.deep;
  body.innerHTML = `<p class="sub">ลาก <b style="color:#9ff3f5">หมุดฟ้า</b> บนแผนที่ไปวางที่ประตู · ตัวเอกเดินมาถึงจุดนี้แล้วเข้าใช้บริการ</p>
  <label class="chk"><input type="checkbox" id="eDeep" ${deep?'checked':''}> วางลึกเข้าไปในตัวอาคารได้ (ตัวเอกเดินทับภาพเข้าไป) · หรือกด Shift ขณะลาก</label>
  <div class="row"><button id="eReset">คืนจุดเข้าเดิม</button></div><hr>
  <b class="sec">พื้นทางเข้า (ลานหน้าสถานที่)</b>
  <p class="sub">ตอนนี้: <b>${o.court?.off?'ไม่มีพื้นทางเข้า':o.court?.pts?'วาดเอง ('+o.court.pts.length+' จุด)':'อัตโนมัติ (ลานหน้าประตู + ทางถึงถนน)'}</b></p>
  <div class="row"><button id="cDraw" class="${courtDraw?'on':''}" style="${courtDraw?'background:#e5c06b;color:#1b302a':''}">✏ ${courtDraw?'กำลังวาด… ลากจากประตูไปหาถนน':'วาดทางเข้าใหม่'}</button></div>
  <div class="row"><button id="cOff">ลบพื้นทางเข้า</button><button id="cAuto">กลับเป็นอัตโนมัติ</button></div>
  <p class="sub">วาดใหม่: กดปุ่ม แล้วลากบนแผนที่ เส้นเริ่มที่ประตูเสมอ ปลายเส้นคือจุดที่ถนนจะมาเชื่อม · ทางเข้าที่วาดเป็นพื้นเดินได้ ลายตามถนนที่มาเชื่อม · ลบ = ไม่มีลานปู (ตัวเอกยังเดินจากประตูถึงถนนได้)</p>`;
  body.querySelector('#eDeep').onchange = e => once(() => {
   const d = UX.entryOf(o);
   UX.setEntry(o, d, e.target.checked);
   if (!e.target.checked && o.entry) delete o.entry.deep;
   UX.refresh()
  })();
  act('#eReset', once(() => {
   delete o.entry;
   UX.refresh()
  }));
  act('#cDraw', () => { courtDraw = !courtDraw; flashStatus(courtDraw ? 'ลากบนแผนที่จากประตูไปหาถนน · ปล่อยเมาส์เพื่อจบเส้น' : 'ยกเลิกการวาดทางเข้า'); render() });
  act('#cOff', once(() => { courtDraw = false; o.court = { off: true }; UX.refresh() }));
  act('#cAuto', once(() => { courtDraw = false; delete o.court; UX.refresh() }))
 }

 /* ---------- overlay: veil + rings, then handles ---------- */
 const baseOverlay = UX.overlay;
 UX.overlay = function(gg, t) {
  baseOverlay(gg, t);
  try {
   if (editing && !testWalk) drawOverlay(gg)
  } finally {
   for (const b of Object.values(bufs)) b.used = false
  }
 };

 function screenLayer(gg, cv, alpha = 1) {
  gg.save();
  gg.setTransform(1, 0, 0, 1, 0, 0);
  gg.globalAlpha = alpha;
  gg.drawImage(cv, 0, 0);
  gg.restore()
 }

 function drawOverlay(gg) {
  const z = scale * zoom,
   o = place && loc(place.id);
  if (drag?.type === 'court' && drag.pts.length) {
   gg.save(); gg.strokeStyle = '#ffe9a8'; gg.lineWidth = 6 / z; gg.setLineDash([12 / z, 8 / z]); gg.lineJoin = 'round'; gg.beginPath();
   drag.pts.forEach((q, i) => { const s2 = project(q.u, q.v); gg[i ? 'lineTo' : 'moveTo'](s2.x, s2.y) }); gg.stroke(); gg.restore()
  } else if (o?.court?.pts && place.tab === 'entry') {
   const a = center(o); gg.save(); gg.fillStyle = '#ffe9a8';
   for (const q of o.court.pts) { const c = canonical(o, a.u + q.du, a.v + q.dv), s2 = project(c.u, c.v); gg.beginPath(); gg.arc(s2.x, s2.y, 5 / z, 0, 7); gg.fill() }
   gg.restore()
  }
  if (place) {
   stamp('hole', q => {
    if (o && hasFrame(o)) {
     const e = estate(o),
      pts = [
       [e.left - .6, e.back - .6],
       [e.right + .6, e.back - .6],
       [e.right + .6, e.front + 2.2],
       [e.left - .6, e.front + 2.2]
      ].map(([a, b]) => plotScreen(o, a, b));
     q.beginPath();
     pts.forEach((p, i) => q[i ? 'lineTo' : 'moveTo'](p.x, p.y));
     q.closePath();
     q.fill()
    } else {
     const b = baseOf(place.id),
      p = b ? project(b.u, b.v) : null;
     if (p) {
      q.beginPath();
      q.ellipse(p.x, p.y, 240, 120, 0, 0, Math.PI * 2);
      q.fill()
     }
    }
   });
   const V = buf('veil'),
    v = V.cv.getContext('2d');
   v.setTransform(1, 0, 0, 1, 0, 0);
   v.globalCompositeOperation = 'source-over';
   v.clearRect(0, 0, V.cv.width, V.cv.height);
   v.fillStyle = 'rgba(5,14,11,.6)';
   v.fillRect(0, 0, V.cv.width, V.cv.height);
   v.globalCompositeOperation = 'destination-out';
   v.drawImage(bufs.hole.cv, 0, 0);
   v.globalCompositeOperation = 'source-over';
   screenLayer(gg, V.cv)
  }
  if (bufs.ring?.used) {
   const R = bufs.ring.cv,
    O = buf('ringOut'),
    q = O.cv.getContext('2d'),
    d = Math.max(1.5, devicePixelRatio * 1.3);
   q.setTransform(1, 0, 0, 1, 0, 0);
   q.globalCompositeOperation = 'source-over';
   q.clearRect(0, 0, O.cv.width, O.cv.height);
   for (const [dx, dy] of [
     [d, 0],
     [-d, 0],
     [0, d],
     [0, -d],
     [d * .7, d * .7],
     [-d * .7, d * .7],
     [d * .7, -d * .7],
     [-d * .7, -d * .7]
    ]) q.drawImage(R, dx, dy);
   q.globalCompositeOperation = 'source-in';
   q.fillStyle = '#fff';
   q.fillRect(0, 0, O.cv.width, O.cv.height);
   q.globalCompositeOperation = 'destination-out';
   q.drawImage(R, 0, 0);
   q.globalCompositeOperation = 'source-over';
   screenLayer(gg, O.cv, .95)
  }
  if (UX.getMode() === 'chars' && selChar) {
   const p = charPos(selChar),
    s = charScale(selChar);
   if (p) {
    gg.save();
    gg.lineWidth = 2.5 / z;
    gg.strokeStyle = '#9ff3f5';
    gg.beginPath();
    gg.ellipse(p.x, p.y, 24 * s, 11 * s, 0, 0, Math.PI * 2);
    gg.stroke();
    gg.restore()
   }
  }
  if (!place) return;
  // item dots of this place
  for (const e of frame) {
   if (e.owner !== place.id) continue;
   const on = inSel(e.key);
   gg.save();
   gg.beginPath();
   gg.arc(e.x, e.y, (on ? 7 : hoverKey === e.key ? 6 : 4) / z, 0, Math.PI * 2);
   gg.fillStyle = e.hidden ? '#c9504a' : on ? '#9ff3f5' : e.key.startsWith('add:') ? '#a8e07a' : '#e5c06b';
   gg.globalAlpha = place.tab === 'items' || on ? 1 : .55;
   gg.fill();
   gg.lineWidth = 1.2 / z;
   gg.strokeStyle = '#1d2b24';
   gg.stroke();
   gg.restore()
  }
  if (!o) return;
  // entrance pin
  if (o.id !== 'square') {
   const d = UX.entryOf(o),
    p = project(d.u, d.v),
    big = place.tab === 'entry';
   gg.save();
   gg.fillStyle = '#9ff3f5';
   gg.strokeStyle = '#fff';
   gg.lineWidth = 2 / z;
   gg.beginPath();
   gg.arc(p.x, p.y, (big ? 9 : 6) / z, 0, Math.PI * 2);
   gg.fill();
   gg.stroke();
   if (big) {
    gg.font = `${12/z}px VillageThai,system-ui`;
    gg.textAlign = 'center';
    gg.fillStyle = '#fff';
    gg.fillText(o.entry?.deep ? 'ทางเข้า (ลึก)' : 'ทางเข้า', p.x, p.y - 14 / z)
   }
   gg.restore()
  }
  // outer frame handles
  if (place.tab === 'frame' && hasFrame(o)) {
   const c = corners(o),
    pts = [c.lb, c.rb, c.rf, c.lf],
    e = estate(o),
    g1 = plotScreen(o, -(e.gate ?? 2.8), e.front),
    g2 = plotScreen(o, e.gate ?? 2.8, e.front);
   gg.save();
   gg.setLineDash([8 / z, 6 / z]);
   gg.lineWidth = 2 / z;
   gg.strokeStyle = '#7fe3ff';
   gg.beginPath();
   pts.forEach((p, i) => gg[i ? 'lineTo' : 'moveTo'](p.x, p.y));
   gg.closePath();
   gg.stroke();
   gg.setLineDash([]);
   gg.strokeStyle = '#ffd36b';
   gg.lineWidth = 4 / z;
   gg.beginPath();
   gg.moveTo(g1.x, g1.y);
   gg.lineTo(g2.x, g2.y);
   gg.stroke();
   for (const p of pts) {
    gg.fillStyle = '#7fe3ff';
    gg.strokeStyle = '#fff';
    gg.lineWidth = 1.5 / z;
    gg.fillRect(p.x - 7 / z, p.y - 7 / z, 14 / z, 14 / z);
    gg.strokeRect(p.x - 7 / z, p.y - 7 / z, 14 / z, 14 / z)
   }
   gg.restore()
  }
  // building footprint + 2:1 guides
  if (place.tab === 'building' && guides && o.id !== 'square') {
   const a = center(o),
    c = project(a.u, a.v),
    pts = [
     [-o.w, -o.d],
     [o.w, -o.d],
     [o.w, o.d],
     [-o.w, o.d]
    ].map(([u, v]) => project(a.u + u, a.v + v));
   gg.save();
   gg.setLineDash([8 / z, 6 / z]);
   gg.lineWidth = 2 / z;
   gg.strokeStyle = '#7fe3ff';
   gg.beginPath();
   pts.forEach((p, i) => gg[i ? 'lineTo' : 'moveTo'](p.x, p.y));
   gg.closePath();
   gg.stroke();
   gg.globalAlpha = .6;
   for (const s of [-.5, .5])
    for (const p of [pts[0], pts[2]]) {
     gg.beginPath();
     gg.moveTo(p.x - 700, p.y - 700 * s);
     gg.lineTo(p.x + 700, p.y + 700 * s);
     gg.stroke()
    } gg.setLineDash([]);
   gg.globalAlpha = 1;
   gg.fillStyle = '#7fe3ff';
   gg.beginPath();
   gg.arc(c.x, c.y, 5 / z, 0, Math.PI * 2);
   gg.fill();
   gg.restore()
  }
 }

 // keep the panel in step with the map: mode switches, undo/redo, test walk
 let lastSig = '';
 (function tick() {
  if (place && testWalk) leave(true);
  const sig = [editing, testWalk, UX.getMode(), place?.id, place?.tab, place?.keys.join(), selChar, frame.length, JSON.stringify(data).length, UX.undoMark(), UX.selectedRoad?.(), UX.roadList?.().length, courtDraw].join('|');
  if (sig !== lastSig && !sliding && !picker?.open) {
   lastSig = sig;
   render()
  }
  requestAnimationFrame(tick)
 })();

 /* ---------- push the whole layout (roads, places, asset edits, frames, characters) as the game's default layout ---------- */
 if (window.GitHubPush) {
  const tools = document.getElementById('toolsPanel'),
   row = document.createElement('div');
  row.className = 'edit-row';
  row.style.marginTop = '6px';
  const push = document.createElement('button');
  push.textContent = '⬆ บันทึกผังขึ้นเกม (GitHub)';
  row.append(push);
  (document.getElementById('reset') || tools.lastChild).after(row);
  window.VillageLayoutPush = () => {
   if (place) leave(true);
   push.click()
  };
  push.onclick = async () => {
   if (!GitHubPush.config().token) {
    GitHubPush.openSettings();
    return
   }
   const st = document.getElementById('status');
   push.disabled = true;
   try {
    const snap = UX.snapshot(),
     body = '// Village default layout — saved from the in-game editor ' + new Date().toISOString() + '.\nwindow.VillageDefaultLayout=' + JSON.stringify(snap, null, 2) + ';\n';
    const sha = await GitHubPush.commit('Village layout from editor (' + Object.keys(snap.places).length + ' places' + (snap.assets ? ' + asset edits' : '') + ')', async head => {
     const files=[],old=await head.read('js/village-layout-v67.js');
     // v86: compare the layout itself (not the timestamp line) so an unchanged layout is not re-pushed
     if((old||'').replace(/^\/\/.*\n/,'')!==body.replace(/^\/\/.*\n/,''))files.push({path:'js/village-layout-v67.js',content:body});
     // everything else the village editor keeps outside the layout snapshot → js/game-settings.js
     const keys=[UPLOAD_KEY,'project-a-village-custom-places-v1','projectA.roadShape','projectA.roadBlend','project-a-npc-routes-v1'],vals={};
     for(const k of keys){const v=localStorage.getItem(k);if(v!==null)vals[k]=v}
     const text=await head.read('js/game-settings.js')||'',settings=GitHubPush.parseSettings(text)||{};
     if(Object.entries(vals).some(([k,v])=>settings[k]!==v)){Object.assign(settings,vals);files.push({path:'js/game-settings.js',content:GitHubPush.settingsFile(settings)})}
     return files
    }, m => st.textContent = m);
    st.textContent = sha ? '⬆ push ผังหมู่บ้านแล้ว · ' + sha : 'ไม่มีอะไรต้อง push'
   } catch (e) {
    st.textContent = 'push ไม่สำเร็จ: ' + e.message
   } finally {
    push.disabled = false
   }
  };
  const tb = document.getElementById('townTools');
  if (tb) {
   const s = GitHubPush.settingsButton();
   s.classList.add('gh');
   s.title = 'ตั้งค่า GitHub (token / repo)';
   s.innerHTML = '<b>⚙</b><span>GitHub</span>';
   tb.append(s)
  }
 }
 if (typeof EDIT_PAGE !== 'undefined' && EDIT_PAGE) {
  const tp = document.getElementById('toolsPanel');
  if (tp) tp.style.display = 'none'; // everything it held now lives in the top bar and the side panel
 }

 window.VillageAssetEdit = {
  charScale,
  drawChar,
  frozen: () => editing && !testWalk && UX.getMode() === 'chars',
  showActors: () => editing && !testWalk && UX.getMode() === 'chars',
  enter,
  leave: () => leave(true),
  placeId: () => place?.id || null,
  frameSig: () => JSON.stringify(data.frames),
  get,
  set,
  artRect: transformRect,
  layerOf,
  kinds: () => Object.keys(KINDS),
  getSelection: () => place ? {
   type: 'place',
   id: place.id,
   tab: place.tab,
   keys: [...place.keys]
  } : null
 };
 try {
  const s = JSON.parse(localStorage.getItem(STORE) || 'null');
  set(s ? s.assets : window.VillageDefaultLayout?.assets)
 } catch (e) {
  console.warn('Village assets:', e.message)
 }
})();
