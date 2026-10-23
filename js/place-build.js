/* v82.1 · Build Mode for the sub-maps (market / forge / home) — same flow as the village editor.
   Map level: hover a work station = white ring around it and its decorations · click = open it · drag = move it (decorations follow).
   A station holds everything about it: picture, base (footprint), service point + name + actions, its own decorations.
   The room (floor, walls, exit and loose decorations) is a place of its own: click a loose decoration or the exit, or "🏠 พื้น/ห้อง".
   Inside a place the rest dims and is locked; changes show at once (Ctrl+Z works); ✓ เสร็จ keeps it, ยกเลิก restores it.
   Characters: the hero's size / picture on this map (or "ตามหมู่บ้าน"). Data lives in M (localStorage 'place-maps-v1') → ⬆ push. */
// hero picture swap (used in play and in the editor)
const PB_ART = (() => {
 /* ---------- hero picture on this map ---------- */
 const imgs = {},
  trims = new WeakMap();
 const img = src => imgs[src] || (imgs[src] = Object.assign(new Image(), {
  src
 }));

 function trim(m) {
  let t = trims.get(m);
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
  trims.set(m, t);
  return t
 }

 function drawHero(gg, p, face, size, c) {
  if (!c?.img) return false;
  const src = /^N/.test(face || '') && c.back ? c.back : c.img,
   m = img(src);
  if (!m.complete || !m.naturalWidth) return true;
  const t = trim(m),
   sc = size * .78 / Math.max(1, (t.y1 - t.y0) * m.naturalHeight),
   w = m.naturalWidth * sc,
   h = m.naturalHeight * sc,
   flip = (/W$/.test(face || '')) !== !!c.flip;
  gg.save();
  gg.translate(p.x, p.y);
  if (flip) gg.scale(-1, 1);
  gg.drawImage(m, -w * (t.x0 + t.x1) / 2, -h * t.y1, w, h);
  gg.restore();
  return true
 }
 return {
  drawHero
 }
})();
(function() {
 'use strict';
 if (Q.get('edit') !== '1') return;
 const MAPS = [
  ['market', 'ตลาด'],
  ['forge', 'โรงตีเหล็ก'],
  ['home', 'บ้านของเรา']
 ];
 let tool = 'select',
  place = null, // {type:'station', id, tab, sel:[prop i]} | {type:'room', tab, sel:[]}
  hover = null, // {type:'station', i} | {type:'prop', i} | {type:'exit'}
  hoverProp = null,
  grab = null,
  press = null,
  sliding = false,
  undoS = [],
  redoS = [];
 const snap = () => JSON.stringify(M);

 function checkpoint() {
  undoS.push(snap());
  if (undoS.length > 60) undoS.shift();
  redoS = []
 }

 function restore(json) {
  M = JSON.parse(json);
  dirty = true;
  persist();
  shortcuts();
  if (place?.type === 'station' && !stOf(place.id)) place = null;
  if (place) place.sel = place.sel.filter(i => M.props[i]);
  render()
 }

 function doUndo() {
  if (!undoS.length) return;
  redoS.push(snap());
  restore(undoS.pop())
 }

 function doRedo() {
  if (!redoS.length) return;
  undoS.push(snap());
  restore(redoS.pop())
 }
 const save = () => {
  persist();
  shortcuts()
 };
 const stOf = id => M.stations.find(s => s.id === id);
 const stIndex = id => M.stations.findIndex(s => s.id === id);
 const ownProps = id => M.props.map((p, i) => [p, i]).filter(([p]) => (p.owner || null) === id);
 const propName = o => (ART_LIST.find(([a]) => a === o.art) || [, o.art.replace(/^\w+:/, '')])[1];
 const q4 = x => Math.round(x * 4) / 4;
 const z = () => scale * zoom;
 const near = (a, p, px) => Math.hypot(a.x - p.x, a.y - p.y) * z() < px;
 const status = t => $('status').textContent = t;

 /* ---------- silhouettes → white ring + dimmed veil (same technique as the village editor) ---------- */
 const bufs = {};

 function buf(n) {
  const Wd = g.canvas.width,
   Hd = g.canvas.height;
  let b = bufs[n];
  if (!b) b = bufs[n] = {
   cv: document.createElement('canvas'),
   used: false
  };
  if (b.cv.width !== Wd || b.cv.height !== Hd) {
   b.cv.width = Wd;
   b.cv.height = Hd
  }
  return b
 }

 function stamp(n, inner, op) {
  const b = buf(n),
   o = b.cv.getContext('2d'),
   main = g;
  if (!b.used) {
   o.setTransform(1, 0, 0, 1, 0, 0);
   o.globalCompositeOperation = 'source-over';
   o.clearRect(0, 0, b.cv.width, b.cv.height);
   b.used = true
  }
  o.setTransform(main.getTransform());
  o.globalCompositeOperation = op || 'source-over';
  g = o;
  try {
   inner(o)
  } catch (e) {} finally {
   g = main;
   o.globalCompositeOperation = 'source-over'
  }
 }
 let cutLater = [];
 const live = () => editing && !!place || editing && tool === 'select';

 function litTag(t) {
  if (!editing) return false;
  if (place) {
   if (t.type === 'prop') return place.sel.includes(t.i) || hoverProp === t.i;
   return place.type === 'station' && place.tab === 'art' && M.stations[t.i]?.id === place.id
  }
  if (tool !== 'select' || !hover) return false;
  if (hover.type === 'station') {
   const id = M.stations[hover.i]?.id;
   return t.type === 'station' ? t.i === hover.i : (M.props[t.i]?.owner || null) === id && !!id
  }
  return hover.type === 'prop' && t.type === 'prop' && t.i === hover.i
 }

 function inPlace(t) {
  if (!place) return false;
  if (place.type === 'station') return t.type === 'station' ? M.stations[t.i]?.id === place.id : M.props[t.i]?.owner === place.id;
  return t.type === 'prop' && !M.props[t.i]?.owner
 }

 function drawObj(o) {
  o.draw();
  if (!o.tag || !live()) return;
  if (litTag(o.tag)) stamp('ring', o.draw);
  if (inPlace(o.tag)) stamp('hole', o.draw);
  else if (place?.type === 'room') cutLater.push(o.draw) // the room is lit as a whole; things that are not part of it get cut back out
 }

 function screen(gg, c, a = 1) {
  gg.save();
  gg.setTransform(1, 0, 0, 1, 0, 0);
  gg.globalAlpha = a;
  gg.drawImage(c, 0, 0);
  gg.restore()
 }
 const poly = (q, pts) => {
  q.beginPath();
  pts.forEach((p, i) => q[i ? 'lineTo' : 'moveTo'](p.x, p.y));
  q.closePath()
 };

 function floorPts(extra = 0) {
  const F = M.floor;
  return [
   [-F.w - extra, -F.d - extra],
   [F.w + extra, -F.d - extra],
   [F.w + extra, F.d + 1 + extra],
   [-F.w - extra, F.d + 1 + extra]
  ].map(([u, v]) => project(u, v))
 }

 function basePts(s, extra = 0) {
  return [
   [-s.w - extra, -s.d - extra],
   [s.w + extra, -s.d - extra],
   [s.w + extra, s.d + extra],
   [-s.w - extra, s.d + extra]
  ].map(([a, b]) => project(s.u + a, s.v + b))
 }

 function overlay(gg) {
  try {
   if (editing) drawOverlay(gg)
  } finally {
   for (const b of Object.values(bufs)) b.used = false;
   cutLater = []
  }
 }

 function drawOverlay(gg) {
  const Z = z();
  if (place) {
   if (place.type === 'room') {
    stamp('hole', q => {
     poly(q, floorPts(.3));
     q.fill();
     if (M.floor.walls) {
      const p = floorPts(.3);
      q.beginPath();
      q.moveTo(p[3].x, p[3].y);
      q.lineTo(p[0].x, p[0].y);
      q.lineTo(p[1].x, p[1].y);
      q.lineTo(p[1].x, p[1].y - 140);
      q.lineTo(p[0].x, p[0].y - 140);
      q.lineTo(p[3].x, p[3].y - 140);
      q.closePath();
      q.fill()
     }
    });
    for (const d of cutLater) stamp('hole', d, 'destination-out')
   } else {
    const s = stOf(place.id);
    if (s) stamp('hole', q => {
     poly(q, basePts(s, .4));
     q.fill();
     const d = project(door(s).u, door(s).v);
     q.beginPath();
     q.ellipse(d.x, d.y, 34, 20, 0, 0, 7);
     q.fill()
    })
   }
   const V = buf('veil'),
    v = V.cv.getContext('2d');
   v.setTransform(1, 0, 0, 1, 0, 0);
   v.globalCompositeOperation = 'source-over';
   v.clearRect(0, 0, V.cv.width, V.cv.height);
   v.fillStyle = 'rgba(5,14,11,.6)';
   v.fillRect(0, 0, V.cv.width, V.cv.height);
   if (bufs.hole?.used) {
    v.globalCompositeOperation = 'destination-out';
    v.drawImage(bufs.hole.cv, 0, 0);
    v.globalCompositeOperation = 'source-over'
   }
   screen(gg, V.cv)
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
   screen(gg, O.cv, .95)
  }
  const pin = (p, col, r, label) => {
   gg.save();
   gg.fillStyle = col;
   gg.strokeStyle = '#fff';
   gg.lineWidth = 2 / Z;
   gg.beginPath();
   gg.arc(p.x, p.y, r / Z, 0, 7);
   gg.fill();
   gg.stroke();
   if (label) {
    gg.font = `${12/Z}px TownThai,system-ui`;
    gg.textAlign = 'center';
    gg.fillStyle = '#fff';
    gg.fillText(label, p.x, p.y - (r + 6) / Z)
   }
   gg.restore()
  };
  const handles = (pts, col) => {
   gg.save();
   gg.setLineDash([8 / Z, 6 / Z]);
   gg.lineWidth = 2 / Z;
   gg.strokeStyle = col;
   poly(gg, pts);
   gg.stroke();
   gg.setLineDash([]);
   for (const p of pts) {
    gg.fillStyle = col;
    gg.strokeStyle = '#fff';
    gg.lineWidth = 1.5 / Z;
    gg.fillRect(p.x - 7 / Z, p.y - 7 / Z, 14 / Z, 14 / Z);
    gg.strokeRect(p.x - 7 / Z, p.y - 7 / Z, 14 / Z, 14 / Z)
   }
   gg.restore()
  };
  if (tool === 'chars') {
   const p = project(hero.u, hero.v),
    s = heroCast().s || 1;
   gg.save();
   gg.lineWidth = 2.5 / Z;
   gg.strokeStyle = '#9ff3f5';
   gg.beginPath();
   gg.ellipse(p.x, p.y, 22 * s, 10 * s, 0, 0, 7);
   gg.stroke();
   gg.restore();
   return
  }
  const ex = project(M.exit.u, M.exit.v);
  if (!place) {
   pin(ex, '#e8a04a', 6);
   return
  }
  if (place.type === 'station') {
   const s = stOf(place.id);
   if (!s) return;
   const d = project(door(s).u, door(s).v);
   pin(d, '#9ff3f5', place.tab === 'door' ? 9 : 6, place.tab === 'door' ? 'จุดใช้งาน' : '');
   if (place.tab === 'base') handles(basePts(s), '#7fe3ff')
  } else {
   pin(ex, '#e8a04a', place.tab === 'exit' ? 9 : 6, place.tab === 'exit' ? 'ทางออก' : '');
   if (place.tab === 'floor') handles(floorPts(), '#7fe3ff')
  }
  for (const i of place.sel) {
   const o = M.props[i];
   if (!o) continue;
   const p = project(o.u, o.v);
   pin(p, '#9ff3f5', 4)
  }
 }

 const CAST_ART = (() => {
  const A = window.ASSET_MANIFEST?.assets || [],
   files = new Set(A.map(a => a.file)),
   out = [],
   backOf = f => {
    const b = f.replace(/\.(\w+)$/, '-back.$1');
    return files.has(b) ? b : null
   };
  for (const a of A) {
   if (!a.file) continue;
   if (a.category === 'allies' && /^ally-[a-z]+$/.test(a.id)) out.push({
    id: a.file,
    label: a.id.slice(5),
    group: 'พวกพ้อง'
   });
   else if (a.category === 'characters' && !/faces/.test(a.id)) out.push({
    id: a.file,
    label: a.id.slice(5),
    group: 'ตัวละคร'
   });
   else if (a.category === 'enemies' && /^enemy-[a-z-]+$/.test(a.id) && !/-back$/.test(a.id)) out.push({
    id: a.file,
    back: backOf(a.file),
    label: a.id.slice(6),
    group: 'สัตว์ / ศัตรู'
   })
  }
  return out
 })();

 /* ---------- enter / leave ---------- */
 function focusOn(pts) {
  let x0 = 1e9,
   y0 = 1e9,
   x1 = -1e9,
   y1 = -1e9;
  for (const p of pts) {
   x0 = Math.min(x0, p.x);
   y0 = Math.min(y0, p.y);
   x1 = Math.max(x1, p.x);
   y1 = Math.max(y1, p.y)
  }
  const side = Math.min(360, W * .4);
  zoom = Math.max(.35, Math.min(2.2, Math.min((W - side - 80) / Math.max(60, x1 - x0) / scale, (H - 160) / Math.max(60, y1 - y0) / scale)));
  pan = {
   x: -((x0 + x1) / 2 - 1100) * z() - side / 2,
   y: -((y0 + y1) / 2 - 700) * z() + 20
  }
 }

 function stationPts(s) {
  const r = artRect(s.art, s.u, s.v, s.width || 120, s.s || 1);
  return [...basePts(s, .5), {
   x: r.x,
   y: r.y
  }, {
   x: r.x + r.w,
   y: r.y + r.h
  }, project(door(s).u, door(s).v), ...ownProps(s.id).map(([o]) => project(o.u, o.v))]
 }

 function enter(p) {
  if (!editing || place) return;
  place = {
   tab: p.type === 'station' ? 'art' : 'props',
   sel: [],
   ...p,
   before: snap(),
   mark: undoS.length
  };
  hover = null;
  hidePick();
  if (p.type === 'station') {
   const s = stOf(p.id);
   if (s) focusOn(stationPts(s))
  } else focusOn(floorPts());
  render();
  status('กำลังแก้ ' + placeName() + ' · ✓ เสร็จ (Enter) หรือ ยกเลิก (Esc)')
 }

 function leave(ok = true) {
  if (!place) return;
  const p = place;
  place = null;
  grab = null;
  if (!ok) {
   M = JSON.parse(p.before);
   dirty = true;
   undoS.length = Math.min(undoS.length, p.mark);
   redoS = [];
   status('ยกเลิกแล้ว · คืนค่าเหมือนก่อนเปิด')
  } else {
   if (snap() === p.before) undoS.length = Math.min(undoS.length, p.mark);
   status('บันทึกแล้ว · กด ⬆ push เมื่อพร้อม')
  }
  save();
  render()
 }
 const placeName = () => !place ? '' : place.type === 'room' ? 'พื้น / ห้อง' : stOf(place.id)?.name || 'จุดทำงาน';

 function shake() {
  panel.classList.remove('pb-shake');
  void panel.offsetWidth;
  panel.classList.add('pb-shake');
  status('กำลังแก้ ' + placeName() + ' · กด ✓ เสร็จ ก่อนไปแก้ที่อื่น')
 }

 /* ---------- pointer (runs before the play handlers on the canvas) ---------- */
 function topHit(p) {
  for (let k = hits.length - 1; k >= 0; k--) {
   const h = hits[k],
    r = h.r;
   if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) return h
  }
  return null
 }

 function cornerAt(pts, p) {
  return pts.findIndex(q => near(q, p, 14))
 }

 function moveSet(st) { // a station and the decorations it owns
  return {
   st,
   props: ownProps(st.id).map(([o]) => o),
   orig: [st, ...ownProps(st.id).map(([o]) => o)].map(o => ({
    u: o.u,
    v: o.v
   }))
  }
 }
 addEventListener('pointerdown', e => {
  if (e.target !== cv || !editing || e.button !== 0) return;
  const p = world(e),
   q = inv(p.x, p.y),
   take = (g0, extra = {}) => {
    e.stopPropagation();
    e.preventDefault();
    grab = {
     id: e.pointerId,
     start: q,
     moved: false,
     ...g0,
     ...extra
    }
   };
  if (tool === 'chars') return;
  if (!place) {
   const ex = project(M.exit.u, M.exit.v);
   if (near(ex, p, 12)) return take({
    kind: 'press',
    open: {
     type: 'room',
     tab: 'exit'
    }
   }, {
    x: e.clientX,
    y: e.clientY
   });
   const h = topHit(p);
   if (!h) return;
   if (h.type === 'station') {
    const s = M.stations[h.i];
    return take({
     kind: 'station',
     open: {
      type: 'station',
      id: s.id
     },
     set: moveSet(s)
    }, {
     x: e.clientX,
     y: e.clientY
    })
   }
   const o = M.props[h.i],
    open = o.owner && stOf(o.owner) ? {
     type: 'station',
     id: o.owner,
     tab: 'props',
     sel: [h.i]
    } : {
     type: 'room',
     tab: 'props',
     sel: [h.i]
    };
   return take({
    kind: 'props',
    open,
    keys: [h.i],
    orig: [{
     u: o.u,
     v: o.v
    }]
   }, {
    x: e.clientX,
    y: e.clientY
   })
  }
  // inside a place
  if (place.type === 'station') {
   const s = stOf(place.id);
   if (!s) return;
   if (place.tab === 'base') {
    const c = cornerAt(basePts(s), p);
    if (c >= 0) return take({
     kind: 'base',
     c
    })
   }
   if (near(project(door(s).u, door(s).v), p, 13)) {
    if (place.tab !== 'door') {
     place.tab = 'door';
     render()
    }
    return take({
     kind: 'door',
     orig: {
      ...s.door
     }
    })
   }
  } else {
   if (place.tab === 'floor') {
    const c = cornerAt(floorPts(), p);
    if (c >= 0) return take({
     kind: 'floor',
     c
    })
   }
   if (near(project(M.exit.u, M.exit.v), p, 13)) {
    if (place.tab !== 'exit') {
     place.tab = 'exit';
     render()
    }
    return take({
     kind: 'exit',
     orig: {
      ...M.exit
     }
    })
   }
  }
  const h = topHit(p);
  if (h?.type === 'prop' && inPlace(h)) {
   if (e.shiftKey) {
    e.stopPropagation();
    e.preventDefault();
    const k = place.sel.indexOf(h.i);
    if (k < 0) place.sel.push(h.i);
    else place.sel.splice(k, 1);
    place.tab = 'props';
    render();
    return
   }
   if (!place.sel.includes(h.i)) place.sel = [h.i];
   if (place.tab !== 'props') place.tab = 'props';
   render();
   return take({
    kind: 'props',
    keys: [...place.sel],
    orig: place.sel.map(i => ({
     u: M.props[i].u,
     v: M.props[i].v
    }))
   })
  }
  if (h?.type === 'station' && place.type === 'station' && M.stations[h.i]?.id === place.id) {
   place.sel = [];
   place.tab = 'art';
   render();
   return take({
    kind: 'station',
    set: moveSet(M.stations[h.i])
   })
  }
  if (h) {
   e.stopPropagation();
   e.preventDefault();
   shake()
  } // empty floor → camera pan (play handler)
 }, true);
 addEventListener('pointermove', e => {
  if (!editing || e.target !== cv && !grab) return;
  const p = world(e);
  if (!grab) {
   const h = topHit(p);
   if (place) {
    hover = null;
    hoverProp = h?.type === 'prop' && inPlace(h) ? h.i : null
   } else {
    hoverProp = null;
    hover = tool === 'select' ? h && {
     type: h.type,
     i: h.i
    } : null
   }
   cv.style.cursor = (place ? hoverProp != null : !!hover) ? 'pointer' : 'grab';
   return
  }
  if (e.pointerId !== grab.id) return;
  if (!grab.moved) {
   if (grab.x != null ? Math.hypot(e.clientX - grab.x, e.clientY - grab.y) < 5 : false) return;
   if (grab.kind === 'press') return;
   grab.moved = true;
   checkpoint()
  }
  const q = inv(p.x, p.y),
   du = q4(q.u - grab.start.u),
   dv = q4(q.v - grab.start.v);
  if (grab.kind === 'station') {
   [grab.set.st, ...grab.set.props].forEach((o, k) => {
    o.u = grab.set.orig[k].u + du;
    o.v = grab.set.orig[k].v + dv
   })
  } else if (grab.kind === 'props') grab.keys.forEach((i, k) => {
   if (M.props[i]) {
    M.props[i].u = grab.orig[k].u + du;
    M.props[i].v = grab.orig[k].v + dv
   }
  });
  else if (grab.kind === 'door') {
   const s = stOf(place.id);
   s.door = {
    du: grab.orig.du + du,
    dv: grab.orig.dv + dv
   }
  } else if (grab.kind === 'exit') M.exit = {
   u: grab.orig.u + du,
   v: grab.orig.v + dv
  };
  else if (grab.kind === 'base') {
   const s = stOf(place.id);
   s.w = Math.max(.3, Math.min(5, Math.round(Math.abs(q.u - s.u) * 10) / 10));
   s.d = Math.max(.3, Math.min(5, Math.round(Math.abs(q.v - s.v) * 10) / 10))
  } else if (grab.kind === 'floor') {
   const F = M.floor;
   F.w = Math.max(3, Math.min(16, Math.round(Math.abs(q.u) * 2) / 2));
   F.d = Math.max(3, Math.min(16, Math.round((grab.c >= 2 ? Math.abs(q.v - 1) : Math.abs(q.v)) * 2) / 2));
   dirty = true
  }
 }, true);
 addEventListener('pointerup', e => {
  if (!grab || e.pointerId !== grab.id) return;
  const g0 = grab;
  grab = null;
  if (!g0.moved) {
   if (g0.open) enter(g0.open);
   return
  }
  save();
  render()
 }, true);

 /* ---------- keys ---------- */
 addEventListener('keydown', e => {
  if (!editing && !(e.key === 't' || e.key === 'T')) return;
  if (e.target.closest?.('input,select,textarea') || document.querySelector('dialog[open]')) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
   e.preventDefault();
   e.shiftKey ? doRedo() : doUndo();
   return
  }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (place) {
   if (e.key === 'Enter') {
    e.preventDefault();
    leave(true);
    return
   }
   if (e.key === 'Escape') {
    e.preventDefault();
    if (place.sel.length) {
     place.sel = [];
     render()
    } else if (snap() === place.before || confirm('ยกเลิกการแก้ทั้งหมดของ ' + placeName() + '?')) leave(false);
    return
   }
   if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    delProps();
    return
   }
   const k = {
    ArrowLeft: [-.25, .25],
    ArrowRight: [.25, -.25],
    ArrowUp: [-.25, -.25],
    ArrowDown: [.25, .25]
   } [e.key];
   if (k) {
    e.preventDefault();
    const n = e.shiftKey ? 4 : 1;
    checkpoint();
    const list = place.sel.length ? place.sel.map(i => M.props[i]) : place.type === 'station' ? (() => {
     const s = stOf(place.id);
     return [s, ...ownProps(s.id).map(([o]) => o)]
    })() : [];
    for (const o of list)
     if (o) {
      o.u += k[0] * n;
      o.v += k[1] * n
     } save();
    return
   }
  }
  if (e.key === '1') setTool('select');
  else if (e.key === '2') setTool('chars');
  else if (e.key === 't' || e.key === 'T') toggleTest()
 });

 function setTool(t) {
  if (!editing) toggleTest();
  if (place) leave(true);
  tool = t;
  render()
 }

 function toggleTest() {
  if (place) leave(true);
  editing = !editing;
  path = [];
  target = null;
  hidePick();
  if (!editing) {
   hero.u = M.exit.u;
   hero.v = M.exit.v - .6;
   status('ทดสอบเดิน · คลิกจุดทำงานเพื่อเดินไปใช้ (ในหน้านี้จะไม่ทำงานจริง)')
  } else status('โหมดแก้ไข');
  render()
 }

 function delProps() {
  if (!place?.sel.length) return;
  checkpoint();
  const kill = new Set(place.sel);
  M.props = M.props.filter((_, i) => !kill.has(i));
  place.sel = [];
  save();
  render()
 }

 /* ---------- top bar ---------- */
 const bar = document.createElement('div');
 bar.id = 'placeTools';
 bar.innerHTML = `<select id="pbMap" title="เลือกแผนที่ย่อย">${MAPS.map(([k,l])=>`<option value="${k}" ${k===PLACE?'selected':''}>${l}</option>`).join('')}</select><i></i>
 <button data-t="select"><b>👆</b><span>เลือก / ย้าย</span><kbd>1</kbd></button><button data-t="chars"><b>👤</b><span>ตัวละคร</span><kbd>2</kbd></button><i></i>
 <button data-a="undo"><b>↶</b><span>ย้อน</span></button><button data-a="redo"><b>↷</b><span>ทำซ้ำ</span></button><button data-a="fit"><b>⤢</b><span>ดูทั้งหมด</span></button><i></i>
 <button data-a="test"><b>▶</b><span>ทดสอบ</span><kbd>T</kbd></button><button data-a="push" class="pp"><b>⬆</b><span>push</span></button>`;
 document.body.append(bar);
 if (window.GitHubPush) {
  const s = GitHubPush.settingsButton();
  s.innerHTML = '<b>⚙</b><span>GitHub</span>';
  s.title = 'ตั้งค่า GitHub (token / repo)';
  bar.append(s)
 }
 bar.querySelector('#pbMap').onchange = e => {
  if (place) leave(true);
  persist();
  location.search = '?edit=1&place=' + e.target.value
 };
 bar.onclick = e => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.t) setTool(b.dataset.t);
  else if (b.dataset.a === 'undo') doUndo();
  else if (b.dataset.a === 'redo') doRedo();
  else if (b.dataset.a === 'fit') fitView();
  else if (b.dataset.a === 'test') toggleTest();
  else if (b.dataset.a === 'push') pushMaps()
 };
 async function pushMaps() {
  if (place) leave(true);
  persist();
  if (!GitHubPush.config().token) {
   GitHubPush.openSettings();
   return
  }
  try {
   const sha = await GitHubPush.pushSettings([KEY], 'แผนที่ย่อย', [], status);
   status(sha ? '⬆ push แผนที่ย่อยแล้ว · ' + sha : 'ไม่มีค่าที่ต้อง push')
  } catch (err) {
   status('push ไม่สำเร็จ: ' + err.message)
  }
 }

 /* ---------- side panel ---------- */
 const css = document.createElement('style');
 css.textContent = `#edit{display:none!important}
#placeTools{position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:9;display:flex;gap:4px;align-items:stretch;background:#1b302af2;border:1px solid #b9c48f;border-radius:12px;padding:5px;box-shadow:0 8px 24px #0006}#placeTools button{display:flex;flex-direction:column;align-items:center;gap:1px;min-width:60px;padding:5px 6px;font-size:11px;position:relative;border-radius:8px}#placeTools b{font-size:17px;line-height:1.1}#placeTools kbd{position:absolute;right:3px;top:2px;font-size:9px;color:#9fb19a;font-family:inherit}#placeTools .on{background:#e5c06b;color:#1b302a;border-color:#e5c06b}#placeTools i{width:1px;background:#4d6656;margin:2px 3px}#placeTools .pp{background:#c9893a;color:#fff;border-color:#8a5a20}#placeTools select{padding:4px 8px;border-radius:8px;background:#132621;color:#f3ead0;border:1px solid #7f9170;font:inherit}
#pbPanel{position:fixed;right:14px;top:78px;z-index:9;width:340px;max-height:calc(100dvh - 96px);display:flex;flex-direction:column;background:#1b302af7;color:#f3ead0;border:1px solid #b9c48f;border-radius:12px;font-size:12px;box-shadow:0 10px 30px #0006}#pbPanel[hidden]{display:none}
#pbPanel .head{padding:11px 12px 0}#pbPanel .body{overflow:auto;padding:10px 12px 12px;flex:1}#pbPanel h3{margin:0 0 3px;font-size:16px;color:#fff0c7}#pbPanel .sub{color:#c9d2b8;margin:0 0 8px;line-height:1.55}#pbPanel .chip{display:inline-block;background:#e5c06b;color:#1b302a;border-radius:20px;padding:1px 8px;font-size:11px;margin-left:6px;vertical-align:2px}
#pbPanel .tabs{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:3px;margin:8px 0 0}#pbPanel .tabs button{padding:6px 2px;font-size:11px;border-radius:8px 8px 0 0;background:#132621}#pbPanel .tabs button.on{background:#e5c06b;color:#1b302a;border-color:#e5c06b}
#pbPanel label{display:grid;grid-template-columns:96px 1fr 46px;gap:6px;align-items:center;margin:6px 0}#pbPanel label.two{grid-template-columns:96px 1fr}#pbPanel label.chk{display:flex;gap:6px}#pbPanel input[type=range]{width:100%}#pbPanel select,#pbPanel input[type=text]{width:100%;padding:5px;background:#132621;color:inherit;border:1px solid #7f9170;border-radius:6px;font:inherit}
#pbPanel .row{display:flex;gap:5px;flex-wrap:wrap;margin:7px 0}#pbPanel button{padding:6px 9px;font-size:12px}#pbPanel hr{border:0;border-top:1px solid #4d6656;margin:10px 0}#pbPanel output{text-align:right}#pbPanel b.sec{display:block;margin:4px 0 2px;color:#fff0c7}
#pbPanel .art{display:flex;gap:10px;align-items:center;background:#132621;border:1px solid #4d6656;border-radius:10px;padding:8px}#pbPanel .th{width:112px;height:92px;flex:none;display:grid;place-items:center;background:repeating-conic-gradient(#20372e 0 25%,#1a2f27 0 50%) 0 0/16px 16px;border-radius:8px}#pbPanel .th img{max-width:104px;max-height:86px}#pbPanel canvas{width:auto;height:auto}
#pbPanel .foot{display:flex;gap:6px;padding:10px 12px;border-top:1px solid #4d6656;background:#16281f;border-radius:0 0 12px 12px}#pbPanel .foot button{flex:1;padding:9px;font-size:13px}#pbPanel .foot .reset{flex:none}#pbPanel .ok{background:#4f7a3c;border-color:#b8d39a}#pbPanel .cancel{background:#5b3a30;border-color:#c49a8a}
#pbPanel .items{display:grid;gap:3px;max-height:280px;overflow:auto}#pbPanel .items button{display:flex;align-items:center;gap:8px;text-align:left}#pbPanel .items button.on{border-color:#9ff3f5;background:#24443d}#pbPanel .mini{width:44px;height:36px;flex:none;display:grid;place-items:center;background:#132621;border-radius:6px;overflow:hidden}#pbPanel .mini canvas,#pbPanel .mini img{max-width:44px!important;max-height:36px!important}#pbPanel .items small{color:#c9d2b8}
#pbPanel .acts{display:grid;grid-template-columns:1fr 1fr;gap:2px 8px}#pbPanel .acts label{display:flex;gap:5px;margin:2px 0}
#pbPanel.pb-shake{animation:pbShake .35s}@keyframes pbShake{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
#pbPick{width:min(760px,94vw);max-height:86vh;padding:0;border:1px solid #b9c48f;border-radius:14px;background:#1b302a;color:#f3ead0}#pbPick::backdrop{background:#071c17aa}#pbPick .pk-head{display:flex;gap:8px;align-items:center;padding:12px;border-bottom:1px solid #4d6656}#pbPick .pk-head b{flex:1;font-size:15px;color:#fff0c7}#pbPick .pk-tabs{display:flex;gap:4px;flex-wrap:wrap;padding:8px 12px}#pbPick .pk-tabs .on{background:#e5c06b;color:#1b302a}#pbPick .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;padding:12px;overflow:auto;max-height:60vh}#pbPick .grid button{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px;background:#132621}#pbPick .grid .cur{border-color:#9ff3f5}#pbPick .th{width:112px;height:92px;display:grid;place-items:center;background:repeating-conic-gradient(#20372e 0 25%,#1a2f27 0 50%) 0 0/16px 16px;border-radius:8px}#pbPick img{max-width:104px;max-height:86px}`;
 document.head.append(css);
 const panel = document.createElement('section');
 panel.id = 'pbPanel';
 document.body.append(panel);
 const pct = x => Math.round(x * 100) + '%',
  one = x => (+x).toFixed(1);
 const sl = (k, l, v, a, b, st, f = x => x) => `<label>${l}<input type="range" data-k="${k}" data-f="${f===pct?'pct':f===one?'one':''}" min="${a}" max="${b}" step="${st}" value="${v}"><output>${f(v)}</output></label>`;
 const act = (sel, fn) => {
  const b = panel.querySelector(sel);
  if (b) b.onclick = fn
 };
 const once = fn => () => {
  checkpoint();
  fn();
  dirty = true;
  save();
  render()
 };

 function sliders(write, done) {
  panel.querySelectorAll('input[type=range][data-k]').forEach(i => {
   i.oninput = () => {
    if (!sliding) {
     checkpoint();
     sliding = true
    }
    write(i.dataset.k, +i.value);
    const f = i.dataset.f === 'pct' ? pct : i.dataset.f === 'one' ? one : x => x;
    i.nextElementSibling.textContent = f(+i.value)
   };
   i.onchange = () => {
    sliding = false;
    done?.(i.dataset.k);
    save()
   }
  })
 }

 function thumbInto(slot, a, w) {
  if (slot) putThumb(slot, a, w)
 }

 function render() {
  bar.querySelectorAll('[data-t]').forEach(b => b.classList.toggle('on', editing && b.dataset.t === tool));
  bar.querySelector('[data-a=test]').classList.toggle('on', !editing);
  $('shortcuts').style.display = editing ? 'none' : '';
  panel.hidden = !editing;
  if (!editing) return;
  if (place) return renderPlace();
  if (tool === 'chars') return renderChars();
  renderMap()
 }

 function renderMap() {
  const loose = M.props.filter(o => !o.owner).length;
  panel.innerHTML = `<div class="body"><h3>🗺 ${M.name}</h3><p class="sub">ชี้จุดทำงาน = เห็นกรอบขาว · <b>คลิก</b> = เปิดแก้ทุกอย่างของจุดนั้น · <b>ลาก</b> = ย้ายทั้งจุด (ของประดับของจุดตามไปด้วย)</p>
  <b class="sec">จุดทำงาน</b><div class="items">${M.stations.map((s,i)=>`<button data-st="${s.id}"><span class="mini"></span><span style="flex:1">${s.name}</span><small>${s.actions.map(a=>ACTIONS[a]).join(', ')}</small></button>`).join('')}</div>
  <div class="row"><button id="mRoom">🏠 พื้น / ห้อง · ทางออก · ของประดับทั่วไป (${loose})</button><button id="mAdd" style="background:#4f7a3c;border-color:#b8d39a">＋ จุดทำงานใหม่…</button></div><hr>
  <div class="row"><button id="mReset">คืนแผนที่นี้เป็นค่าเริ่มต้น</button></div></div>`;
  panel.querySelectorAll('[data-st]').forEach(b => {
   const s = stOf(b.dataset.st);
   thumbInto(b.querySelector('.mini'), s.art, s.width || 120);
   b.onmouseenter = () => hover = {
    type: 'station',
    i: stIndex(s.id)
   };
   b.onmouseleave = () => hover = null;
   b.onclick = () => enter({
    type: 'station',
    id: s.id
   })
  });
  act('#mRoom', () => enter({
   type: 'room',
   tab: 'floor'
  }));
  act('#mAdd', () => openArtPicker('ภาพของจุดทำงานใหม่', '', a => {
   checkpoint();
   const id = 'st' + Date.now().toString(36);
   M.stations.push({
    id,
    name: 'จุดทำงานใหม่',
    actions: [Object.keys(ACTIONS)[0]],
    u: 0,
    v: 0,
    w: .8,
    d: .8,
    door: {
     du: 0,
     dv: 1.6
    },
    art: a,
    width: a.startsWith('vt:') ? 400 : 120
   });
   save();
   enter({
    type: 'station',
    id,
    tab: 'door'
   })
  }));
  act('#mReset', () => {
   if (!confirm('คืนแผนที่ ' + M.name + ' เป็นค่าเริ่มต้นทั้งหมด?')) return;
   once(() => {
    const cast = M.cast;
    M = copy(DEFAULTS[PLACE]);
    if (cast) M.cast = cast
   })()
  })
 }

 function renderChars() {
  const own = M.cast?.hero,
   c = heroCast(),
   heroSrc = c.img || (typeof TACTICS_SPRITES !== 'undefined' ? TACTICS_SPRITES.directions?.SE?.idle?.src : '');
  panel.innerHTML = `<div class="body"><h3>👤 ตัวละครใน${M.name}</h3><p class="sub">ค่าในหน้านี้ใช้เฉพาะแผนที่นี้ · ถ้าติ๊ก "ตามหมู่บ้าน" จะใช้ขนาดและภาพเดียวกับหมู่บ้าน</p>
  <b class="sec">ตัวเอก</b><div class="art"><span class="th">${heroSrc?`<img src="${heroSrc}">`:''}</span><div><label class="chk"><input type="checkbox" id="cFollow" ${own?'':'checked'}> ตามหมู่บ้าน</label>${own?`<div class="row"><button id="cSwap">เปลี่ยนภาพ…</button>${own.img?'<button id="cOrig">ใช้ภาพเดิม</button>':''}</div>`:''}</div></div>
  ${own?`${sl('s','ขนาด',own.s??1,.3,3,.05,pct)}${own.img?`<label class="chk"><input type="checkbox" id="cFlip" ${own.flip?'checked':''}> กลับด้านภาพ</label>`:''}`:`<p class="sub">ตอนนี้: ขนาด ${pct(c.s||1)}${c.img?' · ภาพจากหมู่บ้าน':''}</p>`}</div>`;
  panel.querySelector('#cFollow').onchange = e => once(() => {
   if (e.target.checked) {
    if (M.cast) delete M.cast.hero;
    if (M.cast && !Object.keys(M.cast).length) delete M.cast
   } else {
    M.cast = M.cast || {};
    M.cast.hero = {
     s: +(VILLAGE_HERO.s || 1).toFixed(2),
     ...(VILLAGE_HERO.img ? {
      img: VILLAGE_HERO.img,
      back: VILLAGE_HERO.back,
      flip: VILLAGE_HERO.flip
     } : {})
    }
   }
  })();
  sliders((k, v) => M.cast.hero[k] = v);
  act('#cSwap', () => openList('ภาพตัวเอกใน' + M.name, CAST_ART, own?.img, it => once(() => {
   M.cast.hero.img = it.id;
   if (it.back) M.cast.hero.back = it.back;
   else delete M.cast.hero.back
  })()));
  act('#cOrig', once(() => {
   delete M.cast.hero.img;
   delete M.cast.hero.back;
   delete M.cast.hero.flip
  }));
  const f = panel.querySelector('#cFlip');
  if (f) f.onchange = once(() => M.cast.hero.flip = f.checked || undefined)
 }

 function openList(title, items, cur, onPick) {
  let d = document.getElementById('pbPick');
  if (!d) {
   d = document.createElement('dialog');
   d.id = 'pbPick';
   document.body.append(d)
  }
  const groups = [...new Set(items.map(i => i.group))];
  let tab = 'ทั้งหมด';
  const draw = () => {
   d.innerHTML = `<div class="pk-head"><b>${title}</b><button data-x>ปิด (Esc)</button></div><div class="pk-tabs">${['ทั้งหมด',...groups].map(x=>`<button data-tab="${x}" class="${x===tab?'on':''}">${x}</button>`).join('')}</div><div class="grid">${items.map((it,i)=>tab==='ทั้งหมด'||it.group===tab?`<button data-i="${i}" class="${it.id===cur?'cur':''}"><span class="th"><img src="${it.id}"></span><span>${it.label}</span></button>`:'').join('')}</div>`;
   d.querySelectorAll('[data-i]').forEach(b => b.onclick = () => {
    d.close();
    onPick(items[+b.dataset.i])
   });
   d.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
    tab = b.dataset.tab;
    draw()
   });
   d.querySelector('[data-x]').onclick = () => d.close()
  };
  draw();
  d.showModal()
 }

 function renderPlace() {
  const st = place.type === 'station',
   s = st ? stOf(place.id) : null;
  if (st && !s) {
   place = null;
   return render()
  }
  const props = st ? ownProps(s.id) : ownProps(null);
  place.sel = place.sel.filter(i => props.some(([, k]) => k === i));
  const tabs = st ? [
   ['art', '🖼 ภาพ'],
   ['base', '🔲 ฐาน'],
   ['door', '🚪 จุดใช้งาน'],
   ['props', '🪴 ของประดับ ' + props.length]
  ] : [
   ['floor', '🔲 พื้น / ผนัง'],
   ['props', '🪴 ของประดับ ' + props.length],
   ['exit', '🚪 ทางออก']
  ];
  if (!tabs.some(([t]) => t === place.tab)) place.tab = tabs[0][0];
  panel.innerHTML = `<div class="head"><h3>${placeName()}<span class="chip">${snap()!==place.before?'แก้แล้ว':'กำลังแก้'}</span></h3><p class="sub" style="margin:0">ที่อื่นถูกล็อกไว้ · ✓ เสร็จ = เก็บ · ยกเลิก = คืนทั้งหมดของ${st?'จุดนี้':'ห้องนี้'}</p>
  <div class="tabs">${tabs.map(([t,l])=>`<button data-tab="${t}" class="${place.tab===t?'on':''}">${l}</button>`).join('')}</div></div><div class="body" id="pbBody"></div>
  <div class="foot"><button class="reset" id="pReset" title="คืนค่าเริ่มต้นของ${st?'จุดนี้':'ห้องนี้'}">⟲</button><button class="ok" id="pOk">✓ เสร็จ <small>Enter</small></button><button class="cancel" id="pCancel">ยกเลิก <small>Esc</small></button></div>`;
  panel.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
   place.tab = b.dataset.tab;
   if (place.tab !== 'props') place.sel = [];
   render()
  });
  act('#pOk', () => leave(true));
  act('#pCancel', () => leave(false));
  act('#pReset', () => {
   if (!confirm('คืนค่าเริ่มต้นของ ' + placeName() + '?')) return;
   once(() => resetPlace(s))()
  });
  const body = panel.querySelector('#pbBody');
  if (place.tab === 'props') return tabProps(body, props, st ? s.id : null);
  if (st) ({
   art: tabArt,
   base: tabBase,
   door: tabDoor
  })[place.tab](body, s);
  else ({
   floor: tabFloor,
   exit: tabExit
  })[place.tab](body)
 }

 function resetPlace(s) {
  const D = DEFAULTS[PLACE];
  if (s) {
   const d = D.stations.find(x => x.id === s.id);
   if (d) Object.assign(s, copy(d));
   else {
    s.w = s.d = .8;
    s.door = {
     du: 0,
     dv: 1.6
    };
    s.s = 1;
    delete s.f
   }
  } else {
   M.floor = copy(D.floor);
   M.exit = copy(D.exit);
   M.name = D.name;
   M.sub = D.sub;
   M.props = [...M.props.filter(o => o.owner), ...copy(D.props)];
   place.sel = []
  }
 }

 function tabArt(body, s) {
  body.innerHTML = `<div class="art"><span class="th" id="aTh"></span><div><button id="aSwap">เปลี่ยนภาพ…</button><p class="sub" style="margin:6px 0 0">${propName(s)}</p></div></div>
  ${sl('width','ความกว้างภาพ',s.width||120,30,700,5)}${sl('s','ขนาด',s.s||1,.3,2.5,.05,pct)}
  <label class="chk"><input type="checkbox" id="aFlip" ${s.f?'checked':''}> กลับด้านภาพ</label>
  <p class="sub">ลากตัวจุดบนแผนที่เพื่อย้าย (ของประดับของจุดนี้ตามไปด้วย) · ลูกศร = ขยับทีละ ¼ ช่อง</p>
  <hr><div class="row"><button id="aDel">ลบจุดทำงานนี้</button></div>`;
  thumbInto(body.querySelector('#aTh'), s.art, s.width || 120);
  act('#aSwap', () => openArtPicker('เปลี่ยนภาพ ' + s.name, s.art, a => once(() => s.art = a)()));
  body.querySelector('#aFlip').onchange = e => once(() => s.f = e.target.checked || undefined)();
  act('#aDel', () => {
   if (M.stations.length <= 1) {
    status('ต้องมีจุดทำงานอย่างน้อย 1 จุด');
    return
   }
   if (!confirm('ลบ ' + s.name + ' และของประดับของจุดนี้?')) return;
   checkpoint();
   M.stations = M.stations.filter(x => x !== s);
   M.props = M.props.filter(o => o.owner !== s.id);
   place = null;
   save();
   render()
  });
  sliders((k, v) => s[k] = v)
 }

 function tabBase(body, s) {
  body.innerHTML = `<p class="sub">ฐาน = พื้นที่ที่เดินทะลุไม่ได้ · ลาก <b style="color:#7fe3ff">มุมสีฟ้า</b> บนแผนที่ หรือปรับที่นี่</p>${sl('w','กว้างฐาน',s.w,.3,5,.1,one)}${sl('d','ลึกฐาน',s.d,.3,5,.1,one)}`;
  sliders((k, v) => s[k] = v)
 }

 function tabDoor(body, s) {
  body.innerHTML = `<label class="two">ชื่อ<input type="text" id="dName" value="${s.name}"></label>
  <b class="sec">กิจกรรมที่จุดนี้</b><div class="acts">${Object.entries(ACTIONS).map(([id,l])=>`<label><input type="checkbox" data-act="${id}" ${s.actions.includes(id)?'checked':''}> ${l}</label>`).join('')}</div>
  <p class="sub">ลาก <b style="color:#9ff3f5">หมุดฟ้า</b> = จุดที่ตัวเอกยืนใช้งาน (วางลึกเข้าไปในภาพได้)</p><div class="row"><button id="dReset">คืนจุดใช้งานหน้าฐาน</button></div>`;
  body.querySelector('#dName').onchange = e => once(() => s.name = e.target.value.trim() || s.name)();
  body.querySelectorAll('[data-act]').forEach(c => c.onchange = once(() => {
   const on = [...body.querySelectorAll('[data-act]:checked')].map(x => x.dataset.act);
   s.actions = on.length ? on : [c.dataset.act]
  }));
  act('#dReset', once(() => s.door = {
   du: 0,
   dv: +(s.d + .8).toFixed(2)
  }))
 }

 function tabFloor(body) {
  const F = M.floor;
  body.innerHTML = `<label class="two">ชื่อแผนที่<input type="text" id="fName" value="${M.name}"></label><label class="two">คำอธิบาย<input type="text" id="fSub" value="${M.sub||''}"></label>
  <p class="sub">ลาก <b style="color:#7fe3ff">มุมสีฟ้า</b> บนแผนที่เพื่อขยาย/หดพื้น</p>${sl('fw','กว้างพื้น',F.w,3,16,.5)}${sl('fd','ลึกพื้น',F.d,3,16,.5)}
  <label class="two">ลายพื้น<select id="fTex">${[['paving','ดินอัด'],['soil','ดิน'],['grass','หญ้า'],['ground/cobble.png','หินก้อน'],['ground/plaza-slabs.png','แผ่นหิน'],['plank','พื้นไม้']].map(([k,l])=>`<option value="${k}" ${F.tex===k?'selected':''}>${l}</option>`).join('')}</select></label>
  <label class="chk"><input type="checkbox" id="fWalls" ${F.walls?'checked':''}> ผนังด้านหลัง (ในอาคาร)</label>`;
  body.querySelector('#fName').onchange = e => once(() => M.name = e.target.value.trim() || M.name)();
  body.querySelector('#fSub').onchange = e => once(() => M.sub = e.target.value.trim())();
  body.querySelector('#fTex').onchange = e => once(() => F.tex = e.target.value)();
  body.querySelector('#fWalls').onchange = e => once(() => F.walls = e.target.checked)();
  sliders((k, v) => {
   F[k === 'fw' ? 'w' : 'd'] = v;
   dirty = true
  })
 }

 function tabExit(body) {
  body.innerHTML = `<p class="sub">ลาก <b style="color:#e8a04a">หมุดส้ม</b> ไปวางที่ทางออก · ตัวเอกเริ่มที่นี่เมื่อเข้าแผนที่ และเดินมาที่นี่เพื่อกลับหมู่บ้าน</p><div class="row"><button id="xReset">คืนทางออกเดิม</button></div>`;
  act('#xReset', once(() => M.exit = copy(DEFAULTS[PLACE].exit)))
 }

 function tabProps(body, props, owner) {
  const sel = place.sel;
  if (sel.length === 1) {
   const i = sel[0],
    o = M.props[i];
   body.innerHTML = `<div class="row" style="margin-top:0"><button id="pBack">← ของประดับทั้งหมด</button></div><b class="sec">${propName(o)}</b>
   <div class="art"><span class="th" id="pTh"></span><div><button id="pSwap">เปลี่ยนภาพ…</button></div></div>
   ${sl('width','ความกว้างภาพ',o.width||110,30,700,5)}${sl('s','ขนาด',o.s||1,.3,2.5,.05,pct)}
   <label class="chk"><input type="checkbox" id="pFlip" ${o.f?'checked':''}> กลับด้าน</label>
   <div class="row"><button id="pDup">ทำสำเนา</button><button id="pDel">ลบ (Delete)</button></div><p class="sub">ลากบนแผนที่เพื่อย้าย · ลูกศร = ขยับทีละ ¼ ช่อง</p>`;
   thumbInto(body.querySelector('#pTh'), o.art, o.width || 110);
   act('#pBack', () => {
    place.sel = [];
    render()
   });
   act('#pSwap', () => openArtPicker('เปลี่ยนภาพ', o.art, a => once(() => o.art = a)()));
   body.querySelector('#pFlip').onchange = e => once(() => o.f = e.target.checked || undefined)();
   act('#pDup', once(() => {
    M.props.push({
     ...copy(o),
     u: o.u + .75,
     v: o.v + .75
    });
    place.sel = [M.props.length - 1]
   }));
   act('#pDel', delProps);
   sliders((k, v) => o[k] = v);
   return
  }
  body.innerHTML = `<p class="sub">คลิกชิ้นบนแผนที่หรือในรายการ · Shift+คลิก = เลือกหลายชิ้น${sel.length>1?` · <b>เลือก ${sel.length} ชิ้น</b> ลากชิ้นใดก็ได้เพื่อย้ายทั้งกลุ่ม`:''}</p>
  <div class="row"><button id="pAdd" style="background:#4f7a3c;border-color:#b8d39a">＋ เพิ่มของประดับ…</button>${sel.length>1?'<button id="pDelAll">ลบที่เลือก</button><button id="pNone">เลิกเลือก</button>':''}</div>
  <div class="items">${props.map(([o,i])=>`<button data-i="${i}" class="${sel.includes(i)?'on':''}"><span class="mini"></span><span style="flex:1">${propName(o)}</span></button>`).join('')||'<p class="sub">ยังไม่มีของประดับ</p>'}</div>`;
  body.querySelectorAll('[data-i]').forEach(b => {
   const i = +b.dataset.i;
   thumbInto(b.querySelector('.mini'), M.props[i].art, M.props[i].width || 110);
   b.onmouseenter = () => hoverProp = i;
   b.onmouseleave = () => hoverProp = null;
   b.onclick = e => {
    if (e.shiftKey) {
     const k = sel.indexOf(i);
     if (k < 0) sel.push(i);
     else sel.splice(k, 1)
    } else place.sel = [i];
    render()
   }
  });
  act('#pDelAll', delProps);
  act('#pNone', () => {
   place.sel = [];
   render()
  });
  act('#pAdd', () => openArtPicker('เพิ่มของประดับ', '', a => once(() => {
   const s = owner && stOf(owner),
    at = s ? {
     u: s.u + s.w + .8,
     v: s.v + s.d + .4
    } : {
     u: 1,
     v: 1
    };
   M.props.push({
    art: a,
    u: q4(at.u),
    v: q4(at.v),
    s: 1,
    ...(owner ? {
     owner
    } : {})
   });
   place.sel = [M.props.length - 1];
   status('วางของใหม่แล้ว · ลากไปวางตำแหน่งที่ต้องการ')
  })()))
 }

 // keep the panel in step (undo, test toggle…)
 let sig = '';
 (function tick() {
  const n = [editing, tool, place?.type, place?.id, place?.tab, place?.sel.join(), undoS.length, redoS.length, M.stations.length, M.props.length].join('|');
  if (n !== sig && !sliding && !document.querySelector('dialog[open]') && !panel.contains(document.activeElement)) {
   sig = n;
   render()
  }
  requestAnimationFrame(tick)
 })();

 window.PlaceBuild = {
  drawObj,
  overlay,
  drawHero: PB_ART.drawHero,
  render,
  enter,
  leave: () => leave(true),
  state: () => ({
   tool,
   editing,
   place: place && {
    type: place.type,
    id: place.id,
    tab: place.tab,
    sel: [...place.sel]
   }
  })
 };
 setTimeout(() => {
  fitView();
  render()
 }, 0)
})();
// outside the editor page the draw hooks still exist but do nothing special
window.PlaceBuild = window.PlaceBuild || {
 drawObj: o => o.draw(),
 overlay: () => {},
 drawHero: PB_ART.drawHero,
 render: () => {}
};
