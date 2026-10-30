/* v93.03 · place-interior.html?place=<id>&name=<name> — the inside of every place in Fernvale, drawn in code.
   • Rooms per kind (inn, healer, shop, market, temple, forge, house, home) with furniture built from iso boxes: counters, tables,
     stools, beds, shelves, fireplace, anvil, furnace, altar, pews, stalls, barrels, crates, rugs, lamps, a notice board …
   • People follow their own day (VillageLife.P[*].sched on the village clock): they walk in through the door, go to their spot
     (bar stool, table, stage, counter, altar, bed …), drink / play / work / pray / sleep, chat in bubbles, and walk out when it is time.
   • Click the floor to walk, click someone to talk: talk, ask about them, and — for recruits — the way to make them join
     (hire, quests, drinks, a duel, reputation, an offering, a boss). In the inn: rent a room, manage the party.
   • The door leads back to the village (village-town.html?from=<id>). */
(function () {
  'use strict';
  const Q = new URLSearchParams(location.search), L = window.VillageLife, CLK = window.VillageClock;
  const PLACE = Q.get('place') || 'inn', NAME = Q.get('name') || ({ inn: 'โรงแรมเขากวางทอง', healer: 'บ้านหมอยา', shop: 'ร้านค้า', market: 'ตลาด', temple: 'วิหาร', forge: 'โรงตีเหล็ก' }[PLACE] || 'สถานที่');
  const KIND = PLACE === 'farm' ? 'farm' : L.placeKind(PLACE, NAME), OWNER = L.HOUSE_OF[PLACE] || null;
  /* v97.82 · the farm sub-map (place-interior.html?place=farm&farm=<plot id>&back=<page>): a 🌾 farm plot of js/estates.js, drawn
     outdoors — soil beds that show each crop of js/garden.js as it grows, the pen with its animals, the barn and the tools you bought.
     Click a bed: plant (opens the seed list) · water · harvest · clear. Click the pen: pat them. The gate leads back to where you came from. */
  const FARM_ID = Q.get('farm') || '', farmPlot = SS => (SS.estates || []).find(p => p.id === FARM_ID) || null;
  const cv = document.getElementById('room'), g = cv.getContext('2d');
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  let W = 0, H = 0, dpr = 1, Z = 1, CX = 0, CY = 0, S = L.save();
  const heroName = () => window.WorldState?.heroName() || 'นักผจญภัย';   // v94: the name lives in the game save (s.village.heroName)
  const fill = txt => String(txt).replace(/\{name\}/g, heroName());
  const MIND = window.Mind || null;                                       // js/village-mind.js: memory, news, scenes, jobs, wants
  const CAP = { inn: 14, market: 10, temple: 9, square: 12 };             // how many people fit in a room at once

  /* ---------- iso ---------- */
  const HW = 34, HH = 17;
  const P = (u, v) => ({ x: (u - v) * HW, y: (u + v) * HH });
  const screen = (u, v) => { const p = P(u, v); return { x: p.x * Z + CX, y: p.y * Z + CY } };
  const toCell = (sx, sy) => { const x = (sx - CX) / Z, y = (sy - CY) / Z, a = x / HW, b = y / HH; return { u: (a + b) / 2, v: (b - a) / 2 } };

  /* ---------- rooms ---------- */
  function room() {
    const R = { W: 8, D: 7, floor: 'wood', wall: 'plaster', door: 5, items: [], spots: [], wallDeco: [], light: [] };
    const it = (k, u, v, w = 1, d = 1, o = {}) => R.items.push({ k, u, v, w, d, ...o });
    const sp = (tag, u, v, face = 'SE', act = 'stand') => R.spots.push({ tag, u, v, face, act });
    if (KIND === 'farm') {   /* v97.83 · laid out like the old farming games: the field in the middle, the cabin, the shipping bin, coop and barn with a yard, a pond, trees */
      const G = window.Garden && farmPlot(S) ? window.Garden.of(farmPlot(S)) : null, Gd = window.Garden;
      Object.assign(R, { W: 22, D: 17, door: 9, floor: 'grass', wall: 'fence' });
      const F = { u: 3, v: 7 }; R.field = F;
      for (let i = 0; i < (Gd?.FN || 70); i++) it('ftile', F.u + i % (Gd?.FW || 10), F.v + Math.floor(i / (Gd?.FW || 10)), 1, 1, { idx: i, walk: true, flat: true });
      for (let u = 1; u < 3; u++) it('path', u, R.door, 1, 1, { walk: true, flat: true });
      it('cabin', 2, 1, 3, 3, { h: 44 }); it('bin', 6, 4, 1, 1, { h: 18 });
      it('well', 7, 1); it('woodpile', 1, 4); it('cart', 7, 4); it('signpost', 1, R.door - 1);   /* v97.84 · village decor we already have */
      it('coop', 14, 1, 2, 2, { h: 34 }); it('barn', 17, 1, 3, 3, { h: 52 });
      const pu = 14, pv = 4, pw = 6, pd = G?.have.barn ? 5 : 4; R.pen = { u: pu + 1, v: pv + 1, w: pw - 1, d: pd - 1 };
      for (let u = pu; u <= pu + pw; u++) { it('fence', u, pv, 1, 1, { side: 'u' }); it('fence', u, pv + pd, 1, 1, { side: 'u' }) }
      for (let v = pv + 1; v < pv + pd; v++) { it('fence', pu, v, 1, 1, { side: 'v' }); it('fence', pu + pw, v, 1, 1, { side: 'v' }) }
      for (let u = pu + 1; u < pu + pw; u++) for (let v = pv + 1; v < pv + pd; v++) it('penfloor', u, v, 1, 1, { walk: false, flat: true });
      it('hay', pu + pw - 1, pv + 1, 1, 1, { onTop: true });
      it('pond', 16, 11, 4, 3, { flat: true });
      for (const [u, v] of [[1, 15], [3, 15], [6, 15], [9, 15], [12, 15], [20, 15], [21, 10], [21, 6], [1, 5], [13, 2], [8, 1], [11, 1]]) it('tree', u, v, 1, 1, { h: 0 });
      if (G?.have.scarecrow) it('scarecrow', 13, 10, 1, 1, { h: 0 });
      if (G?.have.compost) it('compost', 1, 12);
      if (G?.have.channel) it('trough', 3, 6, 10, 1, { h: 4, walk: true });
        } else if (KIND === 'inn') {
      Object.assign(R, { W: 13, D: 11, door: 8, floor: 'wood', wall: 'timber' });
      it('counter', 2, 2, 6, 1, { h: 30 }); it('barrel', 9, 1); it('barrel', 9, 2); it('keg', 1, 1);
      R.wallDeco.push({ k: 'shelf', side: 'back', a: 2, b: 7 }, { k: 'sword', side: 'left', a: 2.6 }, { k: 'board', side: 'left', a: 9.6 }, { k: 'window', side: 'back', a: 10.5 }, { k: 'window', side: 'left', a: 6 }, { k: 'antlers', side: 'back', a: 8.4 });
      it('hearth', 0, 2, 1, 2, { h: 16 }); R.light.push({ u: .6, v: 3, r: 4, col: '255,150,60', flicker: true });
      for (const [u, v] of [[4, 6], [8, 6], [5, 9], [9, 9]]) { it('table', u, v); sp('table', u - 1, v, 'SE', 'sit'); sp('table', u + 1, v, 'SW', 'sit'); sp('table', u, v - 1, 'SE', 'sit'); }
      for (const [u, v] of [[4, 6], [8, 6], [5, 9], [9, 9]]) for (const [du, dv] of [[-1, 0], [1, 0], [0, -1]]) it('stool', u + du, v + dv, 1, 1, { walk: true });
      it('stage', 11, 1, 2, 3, { h: 8, walk: true }); sp('stage', 11, 2, 'SW', 'play'); sp('stage', 12, 3, 'SW', 'stand');
      it('table', 12, 9); sp('corner', 12, 8, 'SW', 'sit'); it('stool', 12, 8, 1, 1, { walk: true });
      it('stairs', 6, 0, 2, 1, { h: 0 }); it('rug', 6, 5, 4, 3, { walk: true }); it('plant', 1, 9); it('crate', 10, 1);
      for (let u = 2; u < 8; u++) { sp('bar', u, 3, 'NE', 'drink'); it('stool', u, 3, 1, 1, { walk: true }) }
      sp('bar', 4, 1, 'SW', 'work'); sp('bar', 6, 1, 'SW', 'work');                                   // behind the counter (the innkeeper)
      sp('fire', 1, 3, 'SE', 'sit'); sp('fire', 1, 4, 'SE', 'sit'); sp('fire', 2, 4, 'NW', 'stand');
      R.light.push({ u: 5, v: 2.5, r: 3.5, col: '255,200,120' }, { u: 6.5, v: 7, r: 4.5, col: '255,190,110' }, { u: 11.5, v: 2, r: 2.5, col: '255,210,150' });
    } else if (KIND === 'healer') {
      Object.assign(R, { W: 9, D: 8, door: 5, floor: 'tile', wall: 'plaster' });
      it('counter', 2, 2, 4, 1, { h: 28 }); sp('counter', 3, 1, 'SW', 'work'); sp('visit', 3, 3, 'NE', 'stand'); sp('visit', 5, 3, 'NE', 'stand');
      it('bed', 7, 1, 2, 1); it('bed', 7, 4, 2, 1); sp('bed', 7, 2, 'SW', 'stand'); sp('bed', 6, 4, 'SE', 'stand');
      it('table', 4, 6); it('mortar', 4, 6, 1, 1, { onTop: true }); sp('table', 3, 6, 'SE', 'sit'); sp('table', 5, 6, 'SW', 'sit');
      R.wallDeco.push({ k: 'herbs', side: 'back', a: 1.5, b: 6 }, { k: 'window', side: 'left', a: 2.5 }, { k: 'window', side: 'back', a: 7.5 });
      it('plant', 1, 7); it('plant', 8, 7); it('jars', 1, 1); R.light.push({ u: 4, v: 4, r: 4, col: '230,255,220' });
    } else if (KIND === 'shop') {
      Object.assign(R, { W: 9, D: 8, door: 5, floor: 'wood', wall: 'plaster' });
      it('counter', 2, 3, 5, 1, { h: 28 }); sp('counter', 4, 2, 'SW', 'work'); for (const u of [3, 5, 6]) sp('browse', u, 4, 'NE', 'stand');
      it('shelfbox', 1, 1, 1, 1, { h: 60 }); it('shelfbox', 8, 1, 1, 1, { h: 60 }); it('crate', 7, 5); it('crate', 7, 6); it('barrel', 2, 6); it('barrel', 3, 7);
      R.wallDeco.push({ k: 'shelf', side: 'back', a: 2, b: 7 }, { k: 'window', side: 'left', a: 2.5 }); it('rug', 3, 5, 3, 2, { walk: true });
      R.light.push({ u: 4, v: 4, r: 4, col: '255,215,150' });
    } else if (KIND === 'market') {
      Object.assign(R, { W: 12, D: 10, door: 7, floor: 'stone', wall: 'timber' });
      for (const [u, v, col] of [[2, 2, '#b8463a'], [6, 2, '#3a6aa8'], [10, 2, '#4a8a3a'], [8, 6, '#c9a03a']]) { it('stall', u - 1, v, 2, 1, { col }); sp('stall', u, v - 1, 'SW', 'work'); sp('browse', u, v + 1, 'NE', 'stand') }
      it('crate', 1, 8); it('crate', 2, 8); it('barrel', 11, 8); it('basket', 4, 6); it('basket', 5, 6); sp('browse', 4, 7, 'NE', 'stand');
      R.wallDeco.push({ k: 'banner', side: 'back', a: 4 }, { k: 'banner', side: 'back', a: 8.5 }, { k: 'window', side: 'left', a: 3 });
      R.light.push({ u: 6, v: 5, r: 6, col: '255,230,170' });
    } else if (KIND === 'temple') {
      Object.assign(R, { W: 11, D: 11, door: 9, floor: 'stone', wall: 'stone' });
      it('altar', 4, 1, 3, 1, { h: 30 }); it('statue', 5, 0, 1, 1, { h: 0 }); sp('altar', 5, 2, 'NE', 'pray'); sp('altar', 4, 2, 'NE', 'pray');
      for (const v of [4, 6, 8]) { it('pew', 2, v, 3, 1); it('pew', 6, v, 3, 1); for (const u of [2, 3, 4, 6, 7, 8]) sp('pew', u, v + 1, 'NE', 'pray') }
      it('candles', 2, 1); it('candles', 8, 1); it('plant', 1, 10); it('plant', 10, 10); it('rug', 5, 3, 1, 7, { walk: true, col: '#7a2a2a' });
      R.wallDeco.push({ k: 'glass', side: 'back', a: 2.5 }, { k: 'glass', side: 'back', a: 8.5 }, { k: 'glass', side: 'left', a: 5 });
      R.light.push({ u: 5.5, v: 2, r: 4, col: '255,230,160', flicker: true }, { u: 5, v: 7, r: 5, col: '200,210,255' });
    } else if (KIND === 'forge') {
      Object.assign(R, { W: 10, D: 9, door: 6, floor: 'stone', wall: 'stone' });
      it('furnace', 1, 1, 2, 2, { h: 50 }); R.light.push({ u: 2.5, v: 2.5, r: 4.5, col: '255,120,40', flicker: true });
      it('anvil', 5, 4); sp('anvil', 5, 5, 'NE', 'work'); sp('anvil', 4, 4, 'SE', 'work'); it('quench', 7, 2); it('rack', 8, 1, 1, 1, { h: 50 });
      it('crate', 8, 7); it('barrel', 1, 7); sp('watch', 6, 6, 'NW', 'stand'); sp('watch', 3, 6, 'NE', 'stand');
      R.wallDeco.push({ k: 'tools', side: 'back', a: 4, b: 7 }, { k: 'window', side: 'left', a: 4 });
    } else if (KIND === 'guild') {   /* v97.40 · adventurers' guild: a counter, the contract board, tables for the parties, trophies */
      Object.assign(R, { W: 11, D: 9, door: 6, floor: 'wood', wall: 'timber' });
      it('counter', 2, 2, 4, 1, { h: 30 }); sp('counter', 3, 1, 'SW', 'work'); sp('visit', 4, 3, 'NE', 'stand');
      it('rack', 8, 1, 1, 1, { h: 50 }); it('rack', 9, 1, 1, 1, { h: 50 }); it('chest', 7, 1); sp('board', 9, 3, 'NE', 'stand'); sp('board', 8, 3, 'NE', 'stand');
      for (const [u, v] of [[3, 6], [7, 6]]) { it('table', u, v); it('stool', u - 1, v, 1, 1, { walk: true }); it('stool', u + 1, v, 1, 1, { walk: true }); sp('table', u - 1, v, 'SE', 'sit'); sp('table', u + 1, v, 'SW', 'sit') }
      it('barrel', 10, 7); it('crate', 10, 8); it('plant', 1, 8); it('rug', 4, 4, 3, 1, { walk: true, col: '#6a2a2a' });
      R.wallDeco.push({ k: 'board', side: 'back', a: 8.5 }, { k: 'banner', side: 'back', a: 1.4 }, { k: 'sword', side: 'back', a: 6.5 }, { k: 'antlers', side: 'left', a: 4 }, { k: 'window', side: 'left', a: 7 });
      it('hearth', 0, 2, 1, 2, { h: 16 }); R.light.push({ u: .6, v: 3, r: 4, col: '255,150,60', flicker: true }, { u: 6, v: 5, r: 5, col: '255,220,160' });
    } else {   /* house / player's home */
      Object.assign(R, { W: 8, D: 7, door: 5, floor: 'wood', wall: KIND === 'home' ? 'timber' : 'plaster' });
      it('bed', 6, 1, 2, 1); sp('bed', 6, 1, 'SE', 'sleep'); it('table', 3, 4); it('stool', 2, 4, 1, 1, { walk: true }); it('stool', 4, 4, 1, 1, { walk: true }); sp('table', 2, 4, 'SE', 'sit'); sp('table', 4, 4, 'SW', 'sit');
      it('chest', 7, 5); it('hearth', 0, 1, 1, 2, { h: 14 }); R.light.push({ u: .6, v: 2, r: 3.5, col: '255,150,60', flicker: true }); it('rug', 3, 3, 3, 3, { walk: true, col: '#6a4a8a' });
      R.wallDeco.push({ k: 'window', side: 'back', a: 3.5 }, { k: 'shelf', side: 'back', a: 1.2, b: 2.6 });
      const prof = { may: 'oven', tom: 'bench', ella: 'loom', berg: 'trophy', saf: 'herbs', joe: 'nets', mira: 'books', ken: 'logs', shep: 'wool', lin: 'books', oren: 'desk', gus: 'smith', dork: 'guard', hilda: 'farm', bryn: 'mill', kier: 'sword' }[OWNER];
      if (prof === 'oven') { it('oven', 1, 4, 1, 1, { h: 34 }); sp('work', 2, 5, 'NW', 'work'); R.light.push({ u: 1.5, v: 4.5, r: 2.5, col: '255,140,60', flicker: true }) }
      else if (prof === 'bench') { it('bench', 1, 5, 2, 1); sp('work', 2, 4, 'SW', 'work') }
      else if (prof === 'loom') { it('loom', 1, 5, 1, 1, { h: 40 }); sp('work', 2, 5, 'NW', 'work') }
      else if (prof === 'logs') { it('logs', 1, 5, 2, 1); sp('work', 3, 5, 'NW', 'work') }
      else if (prof === 'herbs') R.wallDeco.push({ k: 'herbs', side: 'left', a: 3.5, b: 6 });
      else if (prof === 'trophy') R.wallDeco.push({ k: 'antlers', side: 'left', a: 4 });
      else if (prof === 'books') { it('shelfbox', 1, 5, 1, 1, { h: 56 }); sp('work', 2, 5, 'NW', 'stand') }
      else if (prof === 'nets') { it('basket', 1, 5); R.wallDeco.push({ k: 'net', side: 'left', a: 4 }) }
      else if (prof === 'wool') { it('basket', 1, 5); it('basket', 2, 6) }
      /* v97.40 · the rest of the village keep their trade at home too (along the back wall, clear of the door) */
      else if (prof === 'desk') { it('table', 3, 1); it('shelfbox', 2, 1, 1, 1, { h: 56 }); sp('work', 3, 2, 'NE', 'sit'); R.wallDeco.push({ k: 'banner', side: 'back', a: 5.2 }, { k: 'board', side: 'left', a: 3 }) }
      else if (prof === 'smith') { it('anvil', 3, 1); it('rack', 2, 1, 1, 1, { h: 50 }); sp('work', 3, 2, 'NE', 'work'); R.wallDeco.push({ k: 'tools', side: 'back', a: 3.6, b: 5.4 }) }
      else if (prof === 'guard') { it('rack', 3, 1, 1, 1, { h: 50 }); it('chest', 4, 1); R.wallDeco.push({ k: 'sword', side: 'back', a: 5.2 }, { k: 'banner', side: 'left', a: 3 }) }
      else if (prof === 'farm') { it('basket', 2, 1); it('basket', 3, 1); it('crate', 4, 1); R.wallDeco.push({ k: 'tools', side: 'back', a: 4.6, b: 5.8 }) }
      else if (prof === 'mill') { it('barrel', 2, 1); it('crate', 3, 1); it('basket', 4, 1); it('mortar', 3, 1, 1, 1, { onTop: true }); sp('work', 3, 2, 'NE', 'work') }
      else if (prof === 'sword') { it('rack', 3, 1, 1, 1, { h: 50 }); R.wallDeco.push({ k: 'sword', side: 'back', a: 5 }) }
      sp('stand', 5, 3, 'SW', 'stand');
    }
    return R;
  }
  const R = room();
  const DOOR = { u: 0, v: R.door };                                         // the door cell is inside, next to the left wall
  const blocked = new Set();
  for (const i of R.items) if (!i.walk && !i.onTop) for (let u = i.u; u < i.u + i.w; u++) for (let v = i.v; v < i.v + i.d; v++) blocked.add(u + ',' + v);
  const inside = (u, v) => u >= 0 && v >= 0 && u < R.W && v < R.D;
  const free = (u, v) => inside(u, v) && !blocked.has(u + ',' + v);
  function pathTo(a, b) {
    const k = (u, v) => u + ',' + v, start = k(a.u, a.v), goal = k(b.u, b.v), prev = new Map([[start, null]]), q = [[a.u, a.v]];
    if (!free(b.u, b.v)) return null;
    while (q.length) { const [u, v] = q.shift(); if (k(u, v) === goal) break; for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nu = u + du, nv = v + dv, nk = k(nu, nv); if (prev.has(nk) || !free(nu, nv)) continue; prev.set(nk, k(u, v)); q.push([nu, nv]) } }
    if (!prev.has(goal)) return null; const out = []; for (let c = goal; c; c = prev.get(c)) { const [u, v] = c.split(',').map(Number); out.unshift({ u, v }) } return out;
  }

  /* ---------- people ---------- */
  const people = new Map();                                               // id → actor in the room
  const homeOf = p => p.home || Object.keys(L.HOUSE_OF).find(h => L.HOUSE_OF[h] === p.id) || null;
  function whereNow(p, hour) {
    for (const [a, b, at, tag] of p.sched || []) if (hour >= a && hour < b) return { at: at === 'home' ? homeOf(p) : at, tag };
    return { at: homeOf(p), tag: p.id === OWNER ? 'bed' : null };
  }
  const herePlace = at => at === PLACE || (at === KIND && ['inn', 'healer', 'shop', 'market', 'temple', 'forge', 'guild'].includes(KIND) && !L.HOUSE_OF[PLACE]);
  function benchHere(id) { return KIND === 'inn' && S.bench.some(b => b.key === id) }
  const taken = new Set();
  function claimSpot(tag) {
    const list = R.spots.filter(s => (!tag || s.tag === tag) && !taken.has(s.u + ',' + s.v));
    const s = list[Math.floor(Math.random() * list.length)] || R.spots.find(s => !taken.has(s.u + ',' + s.v));
    if (s) taken.add(s.u + ',' + s.v); return s || null;
  }
  function freeSpot(s) { if (s) taken.delete(s.u + ',' + s.v) }
  function addActor(p, tag, atDoor) {
    const s = claimSpot(tag); const a = { p, id: p.id, spot: s, u: atDoor ? DOOR.u : (s ? s.u : 3), v: atDoor ? DOOR.v : (s ? s.v : 3), vu: 0, vv: 0, path: [], face: s?.face || 'SE', act: atDoor ? '' : s?.act || 'stand', fade: atDoor ? 0 : 1, phase: Math.random() * 9, leaving: false, bubble: null };
    a.vu = a.u + .5; a.vv = a.v + .5; people.set(p.id, a);
    if (atDoor && s) { a.path = pathTo(a, s) || []; a.walking = true }
    return a;
  }
  /* companions resting in the inn (benched) also hang around as people */
  function benchPerson(b) { const p = L.P[b.key] || { id: b.key, name: b.name, role: 'เพื่อนร่วมทาง', look: { coat: '#5a6a8a', hair: '#3a2a1a', hat: 'none', weapon: 'sword' }, lines: { day: ['พักอยู่ที่โรงแรม พร้อมออกเดินทางเมื่อเจ้าเรียก'] } }; return { ...p, benched: true } }
  function syncPeople(first) {
    const hour = CLK.read().hour, want = new Map();
    const day = CLK.read().day;
    for (const p of Object.values(L.P)) { if (L.inParty(S, p.id) && !benchHere(p.id)) continue; if (MIND?.away(p.id)) continue; if (!L.inParty(S, p.id) && !L.present(p, day, hour)) continue; /* v94: travellers come and go */ const w = whereNow(p, hour); if (herePlace(w.at)) want.set(p.id, { p, tag: w.tag }) }
    if (KIND === 'inn') for (const b of S.bench) if (!want.has(b.key) && !MIND?.away(b.key)) want.set(b.key, { p: benchPerson(b), tag: 'table' });
    /* a full room: staff and people already inside stay, latecomers wait outside */
    const cap = Math.min(CAP[KIND] || 7, R.spots.length + 2);
    if (want.size > cap) { const keep = [...want.keys()].sort((a, b) => (b === OWNER || b === 'marta' ? 2 : people.has(b) ? 1 : 0) - (a === OWNER || a === 'marta' ? 2 : people.has(a) ? 1 : 0)); for (const id of keep.slice(cap)) want.delete(id) }
    for (const [id, w] of want) if (!people.has(id)) addActor(w.p, w.tag, !first);
    for (const [id, a] of people) if (!want.has(id) && !a.leaving && a !== talkingTo) { a.leaving = true; freeSpot(a.spot); a.spot = null; a.path = pathTo({ u: Math.round(a.vu - .5), v: Math.round(a.vv - .5) }, DOOR) || []; a.walking = true }
  }
  /* the hero */
  const hero = { u: DOOR.u, v: DOOR.v, vu: DOOR.u + .5, vv: DOOR.v + .5, path: [], face: 'SE', walking: false, then: null };
  const heroImgs = [1, 2, 3, 4].map(i => { const im = new Image(); im.src = `assets/tactics/imported/idle-se-mvkft9t1-gv5z/frame-0${i}.webp`; return im });
  const walkImgs = [1, 2, 3].map(i => { const im = new Image(); im.src = `assets/tactics/imported/walk-se-mvkaodo9-foiz/frame-0${i}.webp`; return im });

  function faceOf(du, dv) { return Math.abs(du) >= Math.abs(dv) ? (du > 0 ? 'SE' : 'NW') : (dv > 0 ? 'SW' : 'NE') }
  function stepActor(a, dt, speed) {
    if (!a.path.length) { a.walking = false; return }
    const t = a.path[0], tu = t.u + .5, tv = t.v + .5, du = tu - a.vu, dv = tv - a.vv, d = Math.hypot(du, dv), sp = dt * speed;
    if (d > .01) a.face = faceOf(du, dv);
    if (d <= sp) { a.vu = tu; a.vv = tv; a.u = t.u; a.v = t.v; a.path.shift(); if (!a.path.length) a.walking = false } else { a.vu += du / d * sp; a.vv += dv / d * sp; a.walking = true }
  }

  /* ---------- painting ---------- */
  const FLOOR = { grass: ['#6f9a4a', '#668f44', '#78a352'], wood: ['#8a6440', '#7c5a38', '#946c46'], stone: ['#8a8680', '#7e7a74', '#96928a'], tile: ['#c9c2b0', '#bdb6a4', '#d4ccba'] };
  const WALL = { fence: ['#8a6440', '#7a5634'], plaster: ['#e8dcc0', '#d9ccae'], timber: ['#e2d4b4', '#cbbd9c'], stone: ['#a8a296', '#968f84'] };
  const WALL_H = 120;
  function poly(pts, fillStyle, stroke) { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.closePath(); if (fillStyle) { g.fillStyle = fillStyle; g.fill() } if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1; g.stroke() } }
  const up = (p, h) => ({ x: p.x, y: p.y - h });
  /* an iso box: (u,v) back corner, w along u, d along v, height h */
  function box(u, v, w, d, h, top, side1, side2) {
    const a = P(u, v), b = P(u + w, v), c = P(u + w, v + d), e = P(u, v + d);
    poly([b, c, up(c, h), up(b, h)], side1); poly([e, c, up(c, h), up(e, h)], side2); poly([up(a, h), up(b, h), up(c, h), up(e, h)], top);
  }
  function drawFloor(t) {
    const pal = FLOOR[R.floor];
    for (let u = 0; u < R.W; u++) for (let v = 0; v < R.D; v++) {
      const a = P(u, v), b = P(u + 1, v), c = P(u + 1, v + 1), e = P(u, v + 1);
      poly([a, b, c, e], pal[(u * 7 + v * 3) % 3]);
      if (R.floor === 'wood') { g.strokeStyle = 'rgba(40,25,10,.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo((a.x + e.x) / 2, (a.y + e.y) / 2); g.lineTo((b.x + c.x) / 2, (b.y + c.y) / 2); g.stroke() }
      g.strokeStyle = R.floor === 'wood' ? 'rgba(40,25,10,.35)' : 'rgba(40,40,40,.22)'; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.lineTo(c.x, c.y); g.stroke();
    }
    /* door light spilling in */
    if (R.wall === 'fence') return;
    const dp = P(DOOR.u + .5, DOOR.v + .5), gr = g.createRadialGradient(dp.x - 20, dp.y, 4, dp.x, dp.y, 90), day = daylight();
    gr.addColorStop(0, `rgba(255,240,200,${.35 * day})`); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(dp.x, dp.y, 90, 45, 0, 0, 7); g.fill();
  }
  function drawWalls(t) {
    if (R.wall === 'fence') {   /* v97.82 · outdoors: a split-rail fence on the back and left edges, a gap for the gate */
      g.strokeStyle = '#6a4a2a'; g.lineWidth = 4;
      const rail = (a, b) => { for (const h of [12, 26]) { g.beginPath(); g.moveTo(a.x, a.y - h); g.lineTo(b.x, b.y - h); g.stroke() } };
      for (let u = 0; u < R.W; u++) { const a = P(u, 0), b = P(u + 1, 0); rail(a, b); g.fillStyle = '#5a3a1e'; g.fillRect(a.x - 2, a.y - 32, 4, 32) }
      for (let v = 0; v < R.D; v++) { if (v === DOOR.v) continue; const a = P(0, v), b = P(0, v + 1); rail(a, b); g.fillStyle = '#5a3a1e'; g.fillRect(a.x - 2, a.y - 32, 4, 32) }
      const gp = P(0, DOOR.v + .5); g.fillStyle = '#e8d8a8'; g.font = '700 12px system-ui,sans-serif'; g.textAlign = 'center'; g.fillText('ทางออก', gp.x - 26, gp.y - 8);
      return;
    }
    const pal = WALL[R.wall], day = daylight();
    /* back wall along v = 0 (u 0..W), left wall along u = 0 (v 0..D) */
    const o = P(0, 0), bR = P(R.W, 0), bL = P(0, R.D);
    poly([o, bR, up(bR, WALL_H), up(o, WALL_H)], pal[0]); poly([o, bL, up(bL, WALL_H), up(o, WALL_H)], pal[1]);
    if (R.wall === 'timber') { g.strokeStyle = '#5a3a1e'; g.lineWidth = 6; for (let u = 0; u <= R.W; u += 3) { const p = P(u, 0); g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x, p.y - WALL_H); g.stroke() } for (let v = 0; v <= R.D; v += 3) { const p = P(0, v); g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x, p.y - WALL_H); g.stroke() } g.beginPath(); g.moveTo(o.x, o.y - WALL_H * .55); g.lineTo(bR.x, bR.y - WALL_H * .55); g.moveTo(o.x, o.y - WALL_H * .55); g.lineTo(bL.x, bL.y - WALL_H * .55); g.stroke() }
    if (R.wall === 'stone') { g.strokeStyle = 'rgba(60,55,50,.35)'; g.lineWidth = 1; for (let k = 1; k < 8; k++) { const y = WALL_H * k / 8; g.beginPath(); g.moveTo(o.x, o.y - y); g.lineTo(bR.x, bR.y - y); g.moveTo(o.x, o.y - y); g.lineTo(bL.x, bL.y - y); g.stroke() } }
    /* skirting */
    g.strokeStyle = 'rgba(50,30,15,.6)'; g.lineWidth = 4; g.beginPath(); g.moveTo(bL.x, bL.y - 3); g.lineTo(o.x, o.y - 3); g.lineTo(bR.x, bR.y - 3); g.stroke();
    /* top rim */
    g.fillStyle = '#4a3220'; poly([up(bL, WALL_H), up(o, WALL_H), up(bR, WALL_H), up(bR, WALL_H + 8), up(o, WALL_H + 8), up(bL, WALL_H + 8)], '#4a3220');
    /* door in the left wall */
    { const a = P(0, DOOR.v), b = P(0, DOOR.v + 1), outside = day > .4 ? `rgba(200,225,255,${.5 + day * .4})` : 'rgba(30,40,80,.9)';
      poly([a, b, up(b, 78), up(a, 78)], outside); g.strokeStyle = '#4a2e18'; g.lineWidth = 5; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(a.x, a.y - 80); g.lineTo(b.x, b.y - 80); g.lineTo(b.x, b.y); g.stroke();
      g.fillStyle = '#6a4424'; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(a.x - 16, a.y - 6); g.lineTo(a.x - 16, a.y - 82); g.lineTo(a.x, a.y - 78); g.closePath(); g.fill() }
    for (const d of R.wallDeco) wallDeco(d, t, day);
  }
  /* a point on the wall: side 'back' runs along u at v=0, side 'left' along v at u=0 */
  const wallPt = (side, a, h) => { const p = side === 'back' ? P(a, 0) : P(0, a); return { x: p.x, y: p.y - h } };
  function wallQuad(side, a, b, h0, h1) { return [wallPt(side, a, h0), wallPt(side, b, h0), wallPt(side, b, h1), wallPt(side, a, h1)] }
  function wallDeco(d, t, day) {
    if (d.k === 'window' || d.k === 'glass') {
      const q = wallQuad(d.side, d.a - .6, d.a + .6, 40, 100), sky = day > .4 ? `rgba(180,215,255,${.55 + day * .4})` : 'rgba(30,40,90,.9)';
      poly(q, d.k === 'glass' ? (day > .4 ? '#c8a8ff' : '#3a2a6a') : sky); g.strokeStyle = '#4a2e18'; g.lineWidth = 3; g.beginPath(); q.forEach((p, i) => i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)); g.closePath(); g.stroke();
      const m1 = wallPt(d.side, d.a, 40), m2 = wallPt(d.side, d.a, 100); g.beginPath(); g.moveTo(m1.x, m1.y); g.lineTo(m2.x, m2.y); g.stroke();
      if (d.k === 'glass') { g.globalAlpha = .5; for (const [c, k] of [['#ff8a6a', .3], ['#6ac8ff', .6], ['#ffe06a', .45]]) { const p = wallPt(d.side, d.a - .3 + k * .6, 70); g.fillStyle = c; g.beginPath(); g.arc(p.x, p.y, 6, 0, 7); g.fill() } g.globalAlpha = 1 }
      if (day > .4) { const p = wallPt(d.side, d.a, 40), gr = g.createLinearGradient(p.x, p.y, p.x + (d.side === 'back' ? -40 : 40), p.y + 90); gr.addColorStop(0, `rgba(255,245,210,${.18 * day})`); gr.addColorStop(1, 'rgba(255,245,210,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(q[0].x, q[0].y); g.lineTo(q[1].x, q[1].y); g.lineTo(q[1].x + (d.side === 'back' ? -50 : 50), q[1].y + 110); g.lineTo(q[0].x + (d.side === 'back' ? -50 : 50), q[0].y + 110); g.closePath(); g.fill() }
    } else if (d.k === 'shelf' || d.k === 'herbs' || d.k === 'tools') {
      for (const h of [50, 80]) { const q = wallQuad(d.side, d.a, d.b, h, h + 5); poly(q, '#6a4424');
        for (let x = d.a + .2; x < d.b - .1; x += .35) { const p = wallPt(d.side, x, h + 5), col = d.k === 'herbs' ? ['#5a8a3a', '#8aa04a', '#a07a3a'][Math.floor(x * 7) % 3] : d.k === 'tools' ? '#7a7a80' : ['#3a6a4a', '#8a3a2a', '#c9a03a', '#4a4a8a'][Math.floor(x * 9) % 4];
          if (d.k === 'tools') { g.strokeStyle = col; g.lineWidth = 3; g.beginPath(); g.moveTo(p.x, p.y - 4); g.lineTo(p.x, p.y + 22); g.stroke() } else { g.fillStyle = col; g.fillRect(p.x - 3, p.y - 14, 6, 14); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(p.x - 2, p.y - 13, 2, 6) } } }
    } else if (d.k === 'sword') { const p = wallPt(d.side, d.a, 88); g.save(); g.translate(p.x, p.y); g.rotate(-.35); g.fillStyle = '#d8dde4'; g.fillRect(-46, -2, 80, 4); g.fillStyle = '#8a6a2a'; g.fillRect(30, -7, 4, 14); g.fillRect(34, -2, 14, 4); g.restore() }
    else if (d.k === 'board') { const q = wallQuad(d.side, d.a - .5, d.a + .5, 46, 92); poly(q, '#7a5230'); for (let i = 0; i < 4; i++) { const p = wallPt(d.side, d.a - .35 + (i % 2) * .4, 58 + Math.floor(i / 2) * 16); g.fillStyle = '#f2e6c8'; g.fillRect(p.x - 6, p.y - 10, 12, 12) } }
    else if (d.k === 'antlers') { const p = wallPt(d.side, d.a, 96); g.strokeStyle = '#d8c8a0'; g.lineWidth = 3; g.beginPath(); for (const s of [-1, 1]) { g.moveTo(p.x, p.y); g.lineTo(p.x + s * 18, p.y - 16); g.moveTo(p.x + s * 9, p.y - 8); g.lineTo(p.x + s * 8, p.y - 20); g.moveTo(p.x + s * 15, p.y - 13); g.lineTo(p.x + s * 22, p.y - 22) } g.stroke(); g.fillStyle = '#6a4424'; g.beginPath(); g.ellipse(p.x, p.y + 4, 8, 6, 0, 0, 7); g.fill() }
    else if (d.k === 'banner') { const p = wallPt(d.side, d.a, 108); g.fillStyle = '#8a2a2a'; g.beginPath(); g.moveTo(p.x - 12, p.y); g.lineTo(p.x + 12, p.y); g.lineTo(p.x + 12, p.y + 50); g.lineTo(p.x, p.y + 40); g.lineTo(p.x - 12, p.y + 50); g.closePath(); g.fill(); g.fillStyle = '#e0c060'; g.beginPath(); g.arc(p.x, p.y + 20, 5, 0, 7); g.fill() }
    else if (d.k === 'net') { const q = wallQuad(d.side, d.a - .6, d.a + .6, 40, 96); g.strokeStyle = 'rgba(200,190,150,.7)'; g.lineWidth = 1; for (let i = 0; i <= 6; i++) { const a = wallPt(d.side, d.a - .6 + i * .2, 40), b = wallPt(d.side, d.a - .6 + i * .2, 96); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke() } }
  }
  /* furniture */
  /* v97.84 · pictures we already have (village decor, the scarecrow, a house) stand in for the code-drawn farm pieces when loaded */
  const IMG = {}, img = src => { let im = IMG[src]; if (!im) { im = IMG[src] = new Image(); im.src = src } return im.complete && im.naturalWidth ? im : null };
  function pic(src, x, y, w) { const im = img(src); if (!im) return false; const h = w * im.naturalHeight / im.naturalWidth; g.drawImage(im, x - w / 2, y - h, w, h); return true }
  const DECOR = 'assets/village-town/decor/';
  /* v97.82 · the farm's own pieces */
  const CROP_COL = { lettuce: '#7ec850', carrot: '#4f9a3a', potato: '#5a8a3a', wheat: '#c9b04a', tomato: '#3f8a3a', strawberry: '#4a9a4a', pumpkin: '#4a8a3a', herb: '#3e9a5a', cabbage: '#6aa86a' };
  let farmCache = null, farmAt = 0;
  function farmG() { const now = performance.now(); if (!farmCache || now - farmAt > 500) { farmAt = now; const fp = farmPlot(S); farmCache = fp && window.Garden ? window.Garden.of(fp) : null } return farmCache }
  function drawFarmItem(i, t) {
    const c = P(i.u + .5, i.v + .5), G = farmG(), today = window.WorldState?.game?.()?.day || 1;
    if (i.k === 'ftile') {   /* ground of a field tile: overgrown grass, cleared grass, tilled soil (dark when wet) */
      const k = G?.ground?.[i.idx] || 'grass', p = G?.plots[i.idx], wet = p && (p.w === today || window.Garden?.rain(today) || G?.have.channel);
      const col = k === 'soil' ? (wet ? '#4a3220' : '#7a5634') : k === 'grass' ? ((i.u + i.v) % 2 ? '#7aa64e' : '#82ad55') : ((i.u + i.v) % 2 ? '#5f8a3a' : '#668f40');
      poly([P(i.u, i.v), P(i.u + 1, i.v), P(i.u + 1, i.v + 1), P(i.u, i.v + 1)], col);
      if (k === 'soil') { g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 1; for (let r = .25; r < 1; r += .25) { const a = P(i.u + .1, i.v + r), b = P(i.u + .9, i.v + r); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke() } }
      return;
    }
    if (i.k === 'fobj') {   /* what stands on a field tile: debris or a crop */
      const k = G?.ground?.[i.idx], p = G?.plots[i.idx], y = c.y;
      if (k === 'weed') { g.strokeStyle = '#3f6a2a'; g.lineWidth = 2; for (const [dx, h] of [[-8, 12], [-3, 16], [3, 14], [8, 10]]) { g.beginPath(); g.moveTo(c.x + dx, y); g.quadraticCurveTo(c.x + dx * 1.4, y - h * .6, c.x + dx * 1.8, y - h); g.stroke() } return }
      if (k === 'branch') { g.strokeStyle = '#6a4a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(c.x - 12, y - 2); g.lineTo(c.x + 10, y - 6); g.moveTo(c.x - 2, y - 4); g.lineTo(c.x + 2, y - 11); g.stroke(); return }
      if (k === 'rock') { g.fillStyle = '#8a8680'; g.beginPath(); g.ellipse(c.x, y - 6, 13, 9, 0, 0, 7); g.fill(); g.fillStyle = '#a8a49c'; g.beginPath(); g.ellipse(c.x - 3, y - 10, 6, 4, 0, 0, 7); g.fill(); return }
      if (k === 'stump') { g.fillStyle = '#6a4424'; g.fillRect(c.x - 10, y - 14, 20, 12); g.fillStyle = '#b08a5a'; g.beginPath(); g.ellipse(c.x, y - 14, 10, 5, 0, 0, 7); g.fill(); g.strokeStyle = '#8a6a3a'; g.beginPath(); g.ellipse(c.x, y - 14, 5, 2.5, 0, 0, 7); g.stroke(); return }
      if (!p) return; const C = window.Garden.CROPS[p.crop], wet = p.w === today || window.Garden.rain(today) || G?.have.channel;
      if (p.dead) { g.strokeStyle = '#7a5a2a'; g.lineWidth = 2; for (const dx of [-8, 0, 8]) { g.beginPath(); g.moveTo(c.x + dx, y); g.lineTo(c.x + dx + 4, y - 10); g.stroke() } return }
      const f = Math.min(1, p.g / C.days), sway = Math.sin(t * .002 + i.idx) * 1.5, col = CROP_COL[p.crop] || '#5a9a3a';
      if (p.ripe) { g.font = '24px system-ui,"Segoe UI Emoji","Apple Color Emoji",sans-serif'; g.textAlign = 'center'; g.fillStyle = 'rgba(255,230,120,.35)'; g.beginPath(); g.ellipse(c.x, y - 10, 16, 10, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.fillText(C.icon, c.x + sway, y - 2); return }
      const h = 5 + f * 20, leaves = f < .25 ? 2 : f < .6 ? 3 : 5;
      g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 2;
      for (let k2 = 0; k2 < leaves; k2++) { const a = (k2 / (leaves - 1 || 1) - .5) * 1.6, x2 = c.x + Math.sin(a) * h * .6 + sway, y2 = y - Math.cos(a) * h; g.beginPath(); g.moveTo(c.x, y); g.quadraticCurveTo(c.x + Math.sin(a) * h * .2, y - h * .5, x2, y2); g.stroke(); g.beginPath(); g.ellipse(x2, y2, 3 + f * 3, 2 + f * 2, a, 0, 7); g.fill() }
      if (!wet) { g.font = '10px system-ui,"Segoe UI Emoji",sans-serif'; g.fillStyle = '#9ad'; g.fillText('💧', c.x + 14, y - h - 2) }
      return;
    }
    if (i.k === 'path') { poly([P(i.u, i.v), P(i.u + 1, i.v), P(i.u + 1, i.v + 1), P(i.u, i.v + 1)], '#b89a6a'); return }
    if (i.k === 'pond' && pic(DECOR + 'pond-lilies.webp', P(i.u + i.w / 2, i.v + i.d / 2).x, P(i.u + i.w / 2, i.v + i.d / 2).y + i.d * 22, (i.w + i.d) * HW * 1.05)) return;
    if (i.k === 'pond') { const cc = P(i.u + i.w / 2, i.v + i.d / 2); g.fillStyle = '#5a8a3a'; g.beginPath(); g.ellipse(cc.x, cc.y, i.w * 30, i.d * 17, 0, 0, 7); g.fill(); g.fillStyle = '#4a7ab8'; g.beginPath(); g.ellipse(cc.x, cc.y, i.w * 26, i.d * 14, 0, 0, 7); g.fill(); g.fillStyle = `rgba(220,240,255,${.25 + Math.sin(t * .003) * .1})`; g.beginPath(); g.ellipse(cc.x - 20, cc.y - 6, 22, 5, 0, 0, 7); g.fill(); return }
    if (i.k === 'tree') { g.fillStyle = '#5a3a1e'; g.fillRect(c.x - 4, c.y - 30, 8, 30); g.fillStyle = '#3f7a32'; for (const [dx, dy, r] of [[0, -52, 22], [-14, -40, 16], [14, -40, 16]]) { g.beginPath(); g.arc(c.x + dx, c.y + dy, r, 0, 7); g.fill() } g.fillStyle = 'rgba(255,255,255,.08)'; g.beginPath(); g.arc(c.x - 6, c.y - 58, 10, 0, 7); g.fill(); return }
    if (i.k === 'cabin') { const f = P(i.u + i.w / 2, i.v + i.d / 2); if (pic('assets/village-town/buildings/house-02.webp', f.x, f.y + (i.w + i.d) * HH * .55, (i.w + i.d) * HW * 1.25)) { g.fillStyle = '#ffe9a8'; g.font = '700 11px system-ui,sans-serif'; g.textAlign = 'center'; g.fillText('กระท่อม', f.x, f.y - 150); return } }
    if (['well', 'woodpile', 'cart', 'signpost'].includes(i.k)) { pic(DECOR + i.k + '.webp', c.x, c.y + 8, { well: 46, woodpile: 54, cart: 60, signpost: 34 }[i.k]); return }
    if (i.k === 'cabin' || i.k === 'coop') { const red = i.k === 'coop'; box(i.u, i.v, i.w, i.d, i.h, red ? '#c9a060' : '#a8804a', red ? '#b08a50' : '#8a6438', red ? '#9a7642' : '#76542e'); const e = P(i.u, i.v + i.d), cc = P(i.u + i.w, i.v + i.d), bb = P(i.u + i.w, i.v); g.fillStyle = red ? '#8a3a2a' : '#6a3a2a'; g.beginPath(); g.moveTo(e.x, e.y - i.h); g.lineTo((e.x + bb.x) / 2, (e.y + bb.y) / 2 - i.h - 30); g.lineTo(cc.x, cc.y - i.h); g.closePath(); g.fill(); g.beginPath(); g.moveTo(cc.x, cc.y - i.h); g.lineTo((e.x + bb.x) / 2, (e.y + bb.y) / 2 - i.h - 30); g.lineTo(bb.x, bb.y - i.h); g.closePath(); g.fillStyle = red ? '#7a3224' : '#5a3224'; g.fill(); const m = P(i.u + i.w * .5, i.v + i.d); g.fillStyle = '#4a2e18'; g.fillRect(m.x - 7, m.y - 24, 14, 24); g.fillStyle = '#ffe9a8'; g.font = '700 11px system-ui,sans-serif'; g.textAlign = 'center'; g.fillText(red ? 'เล้าไก่' : 'กระท่อม', m.x, m.y - i.h - 36); return }
    if (i.k === 'bin') { box(i.u + .1, i.v + .1, .8, .8, i.h, '#a8804a', '#8a6438', '#76542e'); g.fillStyle = '#ffe9a8'; g.font = '700 10px system-ui,sans-serif'; g.textAlign = 'center'; g.fillText('กล่องส่งขาย', c.x, c.y - 30); const n = Object.values(G?.basket || {}).reduce((a, b) => a + b, 0); if (n) { g.font = '13px system-ui,"Segoe UI Emoji",sans-serif'; g.fillText('🧺' + n, c.x, c.y - 44) } return }
    if (i.k === 'fence') { const a = i.side === 'u' ? P(i.u, i.v + .5) : P(i.u + .5, i.v), b = i.side === 'u' ? P(i.u + 1, i.v + .5) : P(i.u + .5, i.v + 1); g.strokeStyle = '#7a5634'; g.lineWidth = 3.5; for (const h of [8, 18]) { g.beginPath(); g.moveTo(a.x, a.y - h); g.lineTo(b.x, b.y - h); g.stroke() } g.fillStyle = '#5a3a1e'; g.fillRect(a.x - 2, a.y - 24, 4, 24); return }
    if (i.k === 'penfloor') { poly([P(i.u, i.v), P(i.u + 1, i.v), P(i.u + 1, i.v + 1), P(i.u, i.v + 1)], (i.u + i.v) % 2 ? '#9a8a52' : '#a3925a'); return }
    if (i.k === 'hay' && pic(DECOR + 'hay.webp', c.x, c.y + 4, 44)) return;
    if (i.k === 'hay') { g.fillStyle = '#d8b84a'; g.beginPath(); g.ellipse(c.x, c.y - 8, 16, 9, 0, 0, 7); g.fill(); g.strokeStyle = '#a88a2a'; g.lineWidth = 1; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(c.x + k * 5, c.y - 14); g.lineTo(c.x + k * 6, c.y - 2); g.stroke() } return }
    if (i.k === 'barn') { box(i.u, i.v, i.w, i.d, i.h, '#9a3a2a', '#8a2e22', '#76261c'); const a = P(i.u, i.v), b = P(i.u + i.w, i.v), e = P(i.u, i.v + i.d), cc = P(i.u + i.w, i.v + i.d); g.fillStyle = '#5a3a2a'; g.beginPath(); g.moveTo(e.x, e.y - i.h); g.lineTo((e.x + cc.x) / 2, (e.y + cc.y) / 2 - i.h - 26); g.lineTo(cc.x, cc.y - i.h); g.closePath(); g.fill(); g.fillStyle = '#e8d8b8'; const m = P(i.u + i.w * .5, i.v + i.d); g.fillRect(m.x - 8, m.y - 26, 16, 26); g.fillStyle = '#ffe9a8'; g.font = '700 11px system-ui,sans-serif'; g.textAlign = 'center'; g.fillText('โรงนา', m.x, m.y - i.h - 34); return }
    if (i.k === 'scarecrow' && pic('assets/scarecrow.webp', c.x, c.y + 4, 40)) return;
    if (i.k === 'scarecrow') { g.strokeStyle = '#6a4a2a'; g.lineWidth = 3; g.beginPath(); g.moveTo(c.x, c.y); g.lineTo(c.x, c.y - 46); g.moveTo(c.x - 16, c.y - 34); g.lineTo(c.x + 16, c.y - 34); g.stroke(); g.fillStyle = '#c9a04a'; g.beginPath(); g.arc(c.x, c.y - 50, 7, 0, 7); g.fill(); g.fillStyle = '#5a3a2a'; g.fillRect(c.x - 10, c.y - 58, 20, 3); g.fillRect(c.x - 5, c.y - 66, 10, 8); g.fillStyle = '#8a4a3a'; g.fillRect(c.x - 7, c.y - 38, 14, 14); return }
    if (i.k === 'compost') { g.fillStyle = '#4a3420'; g.beginPath(); g.ellipse(c.x, c.y - 6, 18, 10, 0, Math.PI, 0); g.fill(); g.fillStyle = '#6a4a2a'; g.beginPath(); g.ellipse(c.x - 4, c.y - 10, 8, 5, 0, 0, 7); g.fill(); return }
    if (i.k === 'trough') { box(i.u, i.v + .3, i.w, .4, 6, '#5a8ac8', '#6a4a2a', '#5a3a1e'); g.fillStyle = `rgba(200,230,255,${.3 + Math.sin(t * .004) * .15})`; const a = P(i.u + .5, i.v + .5); g.fillRect(a.x - 4, a.y - 9, 30, 2); return }
  }
  /* the animals wander inside the pen */
  const herd = [];
  function syncHerd() {
    const G = farmG(); if (!G || !R.pen) return; const want = G.animals || [];
    while (herd.length > want.length) herd.pop();
    for (let k = 0; k < want.length; k++) { const a = want[k]; if (!herd[k]) herd[k] = { u: R.pen.u + Math.random() * R.pen.w, v: R.pen.v + Math.random() * R.pen.d, tu: 0, tv: 0, wait: Math.random() * 2 }; herd[k].a = a }
  }
  function stepHerd(dt) { for (const h of herd) { if ((h.wait -= dt) > 0) continue; const du = h.tu - h.u, dv = h.tv - h.v, d = Math.hypot(du, dv); if (d < .05 || !h.tu) { h.tu = R.pen.u + .3 + Math.random() * (R.pen.w - .6); h.tv = R.pen.v + .3 + Math.random() * (R.pen.d - .6); h.wait = 1 + Math.random() * 3; continue } const sp = dt * .6; h.u += du / d * Math.min(sp, d); h.v += dv / d * Math.min(sp, d) } }
  /* v97.85 · the animals drawn in code (emoji fonts are missing on some devices) — facing the way they walk */
  function drawAnimal(h, t) {
    const k = h.a.kind, p = P(h.u, h.v), hop = h.wait > 0 ? 0 : Math.abs(Math.sin(t * .01 + h.u)) * 2.5, dir = (h.tu || 0) - h.u >= 0 ? 1 : -1;
    g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.ellipse(p.x, p.y, k === 'chicken' ? 8 : 15, k === 'chicken' ? 3 : 5, 0, 0, 7); g.fill();
    g.save(); g.translate(p.x, p.y - hop); g.scale(dir, 1);
    const ell = (x, y, rx, ry, col) => { g.fillStyle = col; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill() };
    const legs = (xs, top, len, col) => { g.strokeStyle = col; g.lineWidth = 2; for (const x of xs) { g.beginPath(); g.moveTo(x, top); g.lineTo(x, top + len); g.stroke() } };
    if (k === 'chicken') { legs([-2, 2], -5, 5, '#d8a030'); ell(0, -10, 8, 6, '#f4f0e6'); ell(6, -16, 4, 4, '#f4f0e6'); g.fillStyle = '#d83a2a'; g.fillRect(5, -22, 3, 3); g.fillStyle = '#e8a020'; g.beginPath(); g.moveTo(10, -16); g.lineTo(13, -15); g.lineTo(10, -14); g.fill(); ell(-7, -12, 3, 4, '#e8e0d0') }
    else if (k === 'sheep') { legs([-7, -3, 4, 8], -8, 8, '#3a3230'); for (const [x, y] of [[-6, -14], [0, -17], [6, -14], [-2, -11], [4, -11]]) ell(x, y, 6, 5, '#f2efe8'); ell(12, -16, 4, 5, '#3a3230') }
    else if (k === 'goat') { legs([-7, -3, 4, 8], -8, 9, '#6a6058'); ell(0, -14, 11, 6, '#d8d0c4'); ell(12, -19, 4, 4, '#d8d0c4'); g.strokeStyle = '#6a5a4a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(11, -23); g.quadraticCurveTo(9, -29, 6, -28); g.stroke(); g.fillStyle = '#8a8070'; g.beginPath(); g.moveTo(13, -15); g.lineTo(14, -11); g.lineTo(12, -13); g.fill() }
    else { legs([-9, -5, 6, 10], -9, 9, '#3a3230'); ell(0, -16, 14, 8, '#f4f2ee'); ell(-5, -18, 4, 3, '#2a2422'); ell(5, -14, 3, 2.5, '#2a2422'); ell(15, -20, 5, 5, '#f4f2ee'); ell(18, -18, 3, 2.5, '#e8a8a0'); g.fillStyle = '#d8c8a8'; g.fillRect(12, -27, 2, 4); g.fillRect(16, -27, 2, 4) }
    g.restore();
    if (h.a.hungry) { g.fillStyle = '#c84a3a'; g.font = '700 12px system-ui,sans-serif'; g.textAlign = 'center'; g.fillText('!', p.x + 14, p.y - 30) }
  }
  function drawItem(i, t) {
    if (KIND === 'farm' && ['ftile', 'fobj', 'path', 'pond', 'tree', 'cabin', 'coop', 'bin', 'well', 'woodpile', 'cart', 'signpost', 'fence', 'penfloor', 'hay', 'barn', 'scarecrow', 'compost', 'trough'].includes(i.k)) return drawFarmItem(i, t);
    const c = P(i.u + i.w / 2, i.v + i.d / 2);
    switch (i.k) {
      case 'counter': box(i.u, i.v, i.w, i.d, i.h || 30, '#8a5a32', '#6a4424', '#5a3a1e'); { const a = P(i.u, i.v); for (let k = 0; k < i.w; k += 1.5) { const p = P(i.u + k + .7, i.v + .4); g.fillStyle = '#c9a060'; g.fillRect(p.x - 3, p.y - (i.h || 30) - 10, 6, 9) } } break;
      case 'table': box(i.u + .15, i.v + .15, .7, .7, 22, '#9a6a3a', '#6a4424', '#5a3a1e'); { const p = P(i.u + .5, i.v + .5); g.fillStyle = '#c9a060'; g.fillRect(p.x - 6, p.y - 32, 5, 8); g.fillStyle = '#e8e0c8'; g.beginPath(); g.ellipse(p.x + 6, p.y - 23, 5, 2.5, 0, 0, 7); g.fill() } break;
      case 'stool': { const p = P(i.u + .5, i.v + .5); g.fillStyle = '#5a3a1e'; g.fillRect(p.x - 2, p.y - 12, 4, 12); g.fillStyle = '#8a5a32'; g.beginPath(); g.ellipse(p.x, p.y - 13, 9, 4.5, 0, 0, 7); g.fill() } break;
      case 'barrel': case 'keg': { const p = P(i.u + .5, i.v + .5), h = i.k === 'keg' ? 30 : 38; g.fillStyle = '#7a4a24'; g.fillRect(p.x - 14, p.y - h, 28, h); g.beginPath(); g.ellipse(p.x, p.y, 14, 7, 0, 0, Math.PI); g.fill(); g.fillStyle = '#9a6234'; g.beginPath(); g.ellipse(p.x, p.y - h, 14, 7, 0, 0, 7); g.fill(); g.strokeStyle = '#3a2a1a'; g.lineWidth = 2; for (const y of [.25, .75]) { g.beginPath(); g.moveTo(p.x - 14, p.y - h * y); g.lineTo(p.x + 14, p.y - h * y); g.stroke() } if (i.k === 'keg') { g.fillStyle = '#c9a060'; g.fillRect(p.x + 10, p.y - 16, 8, 3) } } break;
      case 'crate': box(i.u + .1, i.v + .1, .8, .8, 30, '#a07a48', '#7a5a34', '#6a4a2a'); break;
      case 'shelfbox': box(i.u + .05, i.v + .05, .9, .9, i.h || 60, '#6a4424', '#5a3a1e', '#4a2e18'); { const p = P(i.u + 1, i.v + .5); for (let k = 0; k < 3; k++) { g.fillStyle = ['#8a3a2a', '#3a6a4a', '#c9a03a'][k]; g.fillRect(p.x - 18 + k * 6, p.y - 20 - k * 14, 5, 10) } } break;
      case 'hearth': { box(i.u, i.v, i.w, i.d, 16, '#7a7268', '#6a645c', '#5a554e'); const p = P(i.u + .5, i.v + i.d / 2), f = Math.sin(t * .02) * 2;
        g.fillStyle = '#2a1a12'; g.beginPath(); g.ellipse(p.x, p.y - 12, 14, 8, 0, 0, 7); g.fill();
        g.save(); g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 3; k++) { g.fillStyle = ['rgba(255,120,30,.8)', 'rgba(255,190,60,.7)', 'rgba(255,240,150,.6)'][k]; g.beginPath(); g.moveTo(p.x - 9 + k * 3, p.y - 12); g.quadraticCurveTo(p.x + f, p.y - 34 + k * 6 - Math.sin(t * .015 + k) * 4, p.x + 9 - k * 3, p.y - 12); g.fill() } g.restore();
        const a = P(i.u, i.v), b = P(i.u, i.v + i.d); g.fillStyle = '#8a8278'; poly([up(a, 16), up(b, 16), up(b, WALL_H), up(a, WALL_H)], '#8a8278') } break;
      case 'stage': box(i.u, i.v, i.w, i.d, i.h || 8, '#7a5230', '#5a3a1e', '#4a2e18'); break;
      case 'stairs': for (let k = 0; k < 5; k++) box(i.u + k * .3, i.v, .4, i.d, 10 + k * 14, '#7a5230', '#5a3a1e', '#4a2e18'); break;
      case 'rug': { const a = P(i.u, i.v), b = P(i.u + i.w, i.v), c2 = P(i.u + i.w, i.v + i.d), e = P(i.u, i.v + i.d); poly([a, b, c2, e], i.col || '#8a3a2a'); g.strokeStyle = '#e0c070'; g.lineWidth = 2; g.stroke(); } break;
      case 'plant': { const p = P(i.u + .5, i.v + .5); g.fillStyle = '#8a4a2a'; g.fillRect(p.x - 9, p.y - 14, 18, 14); for (const [dx, dy, r] of [[-6, -24, 8], [6, -26, 8], [0, -32, 9]]) { g.fillStyle = '#4a7a3a'; g.beginPath(); g.arc(p.x + dx + Math.sin(t * .001 + dx) * 1, p.y + dy, r, 0, 7); g.fill() } } break;
      case 'bed': box(i.u + .05, i.v + .1, i.w - .1, i.d - .2, 16, '#e8e0d0', '#7a5230', '#6a4424'); { const a = P(i.u + .25, i.v + .5); g.fillStyle = '#ffffff'; g.beginPath(); g.ellipse(a.x, a.y - 18, 10, 5, 0, 0, 7); g.fill(); const b = P(i.u + i.w * .65, i.v + .5); g.fillStyle = '#4a6a9a'; g.beginPath(); g.ellipse(b.x, b.y - 17, 22, 9, 0, 0, 7); g.fill() } break;
      case 'mortar': { const p = P(i.u + .5, i.v + .5); g.fillStyle = '#9a948a'; g.beginPath(); g.ellipse(p.x, p.y - 26, 6, 3, 0, 0, 7); g.fill(); g.fillRect(p.x - 5, p.y - 26, 10, 5) } break;
      case 'jars': { const p = P(i.u + .5, i.v + .5); for (let k = 0; k < 3; k++) { g.fillStyle = ['#7ac8a0', '#c87a7a', '#c8b87a'][k]; g.fillRect(p.x - 12 + k * 8, p.y - 18, 7, 14) } } break;
      case 'stall': { box(i.u + .05, i.v + .1, i.w - .1, i.d - .2, 26, '#9a6a3a', '#6a4424', '#5a3a1e'); const a = P(i.u, i.v), b = P(i.u + i.w, i.v), c2 = P(i.u + i.w, i.v + i.d), e = P(i.u, i.v + i.d), h = 70; poly([up(a, h), up(b, h), up(c2, h - 8), up(e, h - 8)], i.col); g.strokeStyle = '#5a3a1e'; g.lineWidth = 3; for (const p of [b, c2, e]) { g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x, p.y - h + 6); g.stroke() }
        const m = P(i.u + i.w / 2, i.v + .5); for (let k = 0; k < 4; k++) { g.fillStyle = ['#d9a040', '#7ab04a', '#c84a3a', '#e8d090'][k]; g.beginPath(); g.arc(m.x - 18 + k * 12, m.y - 30, 5, 0, 7); g.fill() } } break;
      case 'basket': { const p = P(i.u + .5, i.v + .5); g.fillStyle = '#b08a4a'; g.beginPath(); g.ellipse(p.x, p.y - 8, 14, 7, 0, 0, 7); g.fill(); g.fillStyle = '#c84a3a'; for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(p.x - 6 + k * 6, p.y - 12, 4, 0, 7); g.fill() } } break;
      case 'altar': box(i.u, i.v, i.w, i.d, i.h || 30, '#d8d0c0', '#b8b0a0', '#a8a090'); { const p = P(i.u + i.w / 2, i.v + .5); g.fillStyle = '#e0c060'; g.beginPath(); g.arc(p.x, p.y - 40, 7, 0, 7); g.fill() } break;
      case 'statue': { const p = P(i.u + .5, i.v + .5); g.fillStyle = '#c8c0b0'; g.fillRect(p.x - 8, p.y - 100, 16, 70); g.beginPath(); g.arc(p.x, p.y - 108, 9, 0, 7); g.fill(); g.fillStyle = '#b0a898'; g.beginPath(); g.moveTo(p.x - 18, p.y - 92); g.lineTo(p.x, p.y - 80); g.lineTo(p.x + 18, p.y - 92); g.lineTo(p.x, p.y - 74); g.closePath(); g.fill() } break;
      case 'pew': box(i.u + .05, i.v + .2, i.w - .1, .6, 16, '#7a5230', '#5a3a1e', '#4a2e18'); { const a = P(i.u + .05, i.v + .2), b = P(i.u + i.w - .05, i.v + .2); poly([up(a, 16), up(b, 16), up(b, 34), up(a, 34)], '#6a4424') } break;
      case 'candles': { const p = P(i.u + .5, i.v + .5); g.fillStyle = '#4a3a2a'; g.fillRect(p.x - 2, p.y - 40, 4, 40); for (const dx of [-8, 0, 8]) { g.fillStyle = '#f2ead8'; g.fillRect(p.x + dx - 2, p.y - 52, 4, 10); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,200,80,${.7 + Math.sin(t * .02 + dx) * .2})`; g.beginPath(); g.ellipse(p.x + dx, p.y - 56, 2.5, 5, 0, 0, 7); g.fill(); g.restore() } } break;
      case 'furnace': { box(i.u, i.v, i.w, i.d, i.h || 50, '#5a554e', '#6a645c', '#4a453e'); const p = P(i.u + i.w, i.v + i.d / 2 + .2); g.fillStyle = '#1a120c'; g.beginPath(); g.ellipse(p.x - 10, p.y - 18, 14, 10, 0, 0, 7); g.fill(); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = `rgba(255,${120 + Math.sin(t * .01) * 30},40,.85)`; g.beginPath(); g.ellipse(p.x - 10, p.y - 16, 10, 6, 0, 0, 7); g.fill(); g.restore();
        if (Math.random() < .2) sparks.push({ x: p.x - 10, y: p.y - 22, vx: (Math.random() - .3) * 40, vy: -40 - Math.random() * 40, t0: t }) } break;
      case 'anvil': { const p = P(i.u + .5, i.v + .5); g.fillStyle = '#6a4424'; g.fillRect(p.x - 8, p.y - 16, 16, 16); g.fillStyle = '#4a4a50'; g.beginPath(); g.moveTo(p.x - 18, p.y - 22); g.lineTo(p.x + 22, p.y - 24); g.lineTo(p.x + 12, p.y - 16); g.lineTo(p.x - 12, p.y - 16); g.closePath(); g.fill(); g.fillStyle = '#6a6a72'; g.fillRect(p.x - 18, p.y - 26, 36, 4) } break;
      case 'quench': { const p = P(i.u + .5, i.v + .5); g.fillStyle = '#6a4424'; g.fillRect(p.x - 16, p.y - 22, 32, 22); g.fillStyle = '#3a5a6a'; g.beginPath(); g.ellipse(p.x, p.y - 22, 16, 7, 0, 0, 7); g.fill() } break;
      case 'rack': { box(i.u + .1, i.v + .3, .8, .4, 6, '#6a4424', '#5a3a1e', '#4a2e18'); const p = P(i.u + .5, i.v + .5); for (let k = 0; k < 3; k++) { g.fillStyle = '#c8ccd2'; g.fillRect(p.x - 12 + k * 10, p.y - 56, 3, 50) } } break;
      case 'chest': box(i.u + .15, i.v + .2, .7, .6, 20, '#8a5a2a', '#6a4424', '#5a3a1e'); { const p = P(i.u + .5, i.v + .5); g.fillStyle = '#e0c060'; g.fillRect(p.x - 3, p.y - 16, 6, 5) } break;
      case 'oven': { box(i.u, i.v, i.w, i.d, i.h || 34, '#b8a890', '#a89878', '#988868'); const p = P(i.u + 1, i.v + .5); g.fillStyle = '#2a1a12'; g.beginPath(); g.arc(p.x - 6, p.y - 16, 8, Math.PI, 0); g.fill(); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(255,140,40,.6)'; g.beginPath(); g.arc(p.x - 6, p.y - 14, 5, Math.PI, 0); g.fill(); g.restore() } break;
      case 'bench': box(i.u + .05, i.v + .15, i.w - .1, i.d - .3, 26, '#a07a48', '#7a5a34', '#6a4a2a'); break;
      case 'loom': box(i.u + .1, i.v + .1, .8, .8, 8, '#7a5230', '#5a3a1e', '#4a2e18'); { const p = P(i.u + .5, i.v + .5); g.strokeStyle = '#5a3a1e'; g.lineWidth = 3; g.strokeRect(p.x - 16, p.y - 46, 32, 34); g.fillStyle = '#a0456a'; g.fillRect(p.x - 14, p.y - 40, 28, 22) } break;
      case 'logs': { for (let k = 0; k < 3; k++) { const p = P(i.u + .5 + k * .4, i.v + .5); g.fillStyle = '#7a5230'; g.beginPath(); g.ellipse(p.x, p.y - 8 - (k % 2) * 8, 16, 7, 0, 0, 7); g.fill(); g.fillStyle = '#c9a070'; g.beginPath(); g.ellipse(p.x + 14, p.y - 8 - (k % 2) * 8, 4, 6, 0, 0, 7); g.fill() } } break;
    }
  }
  let sparks = [];
  /* time of day: 1 = daylight, 0 = night */
  function daylight() { const h = CLK.read().hour; return h >= 7 && h < 17 ? 1 : h >= 17 && h < 20 ? (20 - h) / 3 : h >= 5 && h < 7 ? (h - 5) / 2 : 0 }

  /* ---------- frame ---------- */
  let last = 0, bubbleAt = 0, syncAt = 0, talkingTo = null, hoverId = null, sceneAt = 6000, scenePlaying = false;
  /* two or more villagers in the room talk to each other (written scenes first, then small chats) */
  async function playScene() {
    if (!MIND) return; const here = [...people.values()].filter(a => !a.leaving && !a.walking && a !== talkingTo && L.P[a.id]).map(a => a.id);
    if (here.length < 2) return; const sc = MIND.scene(here, { place: KIND, period: CLK.period(CLK.read().hour) }); if (!sc) return;
    scenePlaying = true;
    for (const [who, txt] of sc.lines) { const a = people.get(who); if (!a || a.leaving) break; const o = sc.lines.map(l => people.get(l[0])).find(x => x && x !== a); if (o) a.face = faceOf(o.u - a.u, o.v - a.v); a.bubble = { txt: fill(txt), until: performance.now() + 3400 }; await wait(3000) }
    scenePlaying = false;
  }
  function resize() { dpr = devicePixelRatio || 1; W = innerWidth; H = innerHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
    const w = (R.W + R.D) * HW, h = (R.W + R.D) * HH + WALL_H + 40; Z = Math.min(1.6, Math.max(.6, Math.min((W - (W < 760 ? 20 : 300)) / w, (H - 200) / h)));
    const c = P(R.W / 2, R.D / 2); CX = (W < 760 ? W / 2 : W / 2 + 120) - c.x * Z; CY = H / 2 + 20 - c.y * Z + WALL_H * Z * .35;
    if (KIND === 'farm') { Z = W < 760 ? .8 : 1.05; followCam(true) } }
  /* v97.83 · the farm is bigger than the screen: the camera follows the hero (snap on resize, glide otherwise) */
  function followCam(snap) { const p = P(hero.vu, hero.vv), tx = (W < 760 ? W / 2 : W / 2 + 120) - p.x * Z, ty = H / 2 + 30 - p.y * Z; if (snap) { CX = tx; CY = ty } else { CX += (tx - CX) * .08; CY += (ty - CY) * .08 } }
  addEventListener('resize', resize);
  function frame(t) {
    requestAnimationFrame(frame);
    const dt = Math.min(.1, (t - last) / 1000 || .016); last = t;
    if (!document.hidden && shown) window.WorldState?.tick(dt);   // v94: the one game clock keeps running indoors
    if (t > syncAt) { syncAt = t + 1000; syncPeople(false); hudSync() }
    if (KIND === 'farm') { if (t > (frame.herdAt || 0)) { frame.herdAt = t + 700; syncHerd() } stepHerd(dt); followCam(false) }
    stepActor(hero, dt, 3.6); if (!hero.path.length && hero.then) { const f = hero.then; hero.then = null; f() }
    for (const [id, a] of people) {
      stepActor(a, dt, 2.4);
      if (a.walking) a.act = ''; else if (a.spot && !a.leaving) { a.act = a.spot.act; a.face = a.spot.face }
      if (a.fade < 1 && !a.leaving) a.fade = Math.min(1, a.fade + dt * 2.5);
      if (a.leaving && !a.path.length) { a.fade -= dt * 3; if (a.fade <= 0) people.delete(id) }
      /* the innkeeper sometimes carries drinks to a table */
      if (a.id === 'marta' && !a.walking && !a.leaving && Math.random() < dt * .05) { const tbl = R.spots.filter(s => s.tag === 'table'); const s = tbl[Math.floor(Math.random() * tbl.length)]; const back = a.spot; if (s && back) { const near = [[0, 1], [1, 0], [0, -1], [-1, 0]].map(([du, dv]) => ({ u: s.u + du, v: s.v + dv })).find(c => free(c.u, c.v)); const p = near && pathTo({ u: a.u, v: a.v }, near); if (p) { a.path = p; a.walking = true; setTimeout(() => { if (people.get('marta') === a && !a.leaving) { a.path = pathTo({ u: a.u, v: a.v }, back) || []; } }, 5000) } } }
    }
    if (t > sceneAt && !scenePlaying) { sceneAt = t + 16000 + Math.random() * 14000; playScene(t) }
    if (t > bubbleAt && !scenePlaying) { bubbleAt = t + 3500 + Math.random() * 3000; const list = [...people.values()].filter(a => !a.walking && !a.leaving && a !== talkingTo); const a = list[Math.floor(Math.random() * list.length)]; if (a) { const per = CLK.period(CLK.read().hour); let txt = MIND && L.P[a.id] ? MIND.bubble(a.id, { period: per, place: KIND }) : ''; if (!txt) { const lines = a.p.lines?.[per] || a.p.lines?.day || a.p.lines?.evening || []; txt = lines.length ? lines[Math.floor(Math.random() * lines.length)] : '' } if (txt) a.bubble = { txt: fill(txt), until: t + 3600 } } }
    draw(t);
  }
  function draw(t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#120e0a'; g.fillRect(0, 0, cv.width, cv.height);
    g.setTransform(dpr * Z, 0, 0, dpr * Z, dpr * CX, dpr * CY);
    drawWalls(t); drawFloor(t);
    for (const i of R.items) if (i.k === 'rug' || i.flat) drawItem(i, t);
    /* depth sort: furniture by its front corner, people by their cell */
    const list = [];
    if (KIND === 'farm') { for (const h of herd) list.push({ y: h.u + h.v, f: () => drawAnimal(h, t) }); for (const i of R.items) if (i.k === 'ftile') list.push({ y: i.u + i.v + .9, f: () => drawFarmItem({ ...i, k: 'fobj' }, t) }) }
    for (const i of R.items) if (i.k !== 'rug' && !i.flat && !i.onTop) list.push({ y: i.u + i.w + i.v + i.d - 1 - (i.k === 'stool' ? .4 : 0), f: () => drawItem(i, t) });
    for (const i of R.items) if (i.onTop) list.push({ y: i.u + i.v + 1.05, f: () => drawItem(i, t) });
    for (const a of people.values()) list.push({ y: a.vu + a.vv, f: () => drawPerson(a, t) });
    list.push({ y: hero.vu + hero.vv, f: () => drawHero(t) });
    list.sort((a, b) => a.y - b.y); for (const x of list) x.f();
    /* lights + night */
    const day = daylight();
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const l of R.light) { const p = P(l.u, l.v), r = l.r * HW * (l.flicker ? 1 + Math.sin(t * .013 + l.u) * .04 : 1), gr = g.createRadialGradient(p.x, p.y - 20, 4, p.x, p.y - 20, r); gr.addColorStop(0, `rgba(${l.col},${.22 + (1 - day) * .22})`); gr.addColorStop(1, `rgba(${l.col},0)`); g.fillStyle = gr; g.beginPath(); g.ellipse(p.x, p.y - 20, r, r * .6, 0, 0, 7); g.fill() }
    g.restore();
    sparks = sparks.filter(s => t - s.t0 < 700); g.save(); g.globalCompositeOperation = 'lighter'; for (const s of sparks) { const e = (t - s.t0) / 1000; g.fillStyle = `rgba(255,190,80,${1 - e / .7})`; g.fillRect(s.x + s.vx * e, s.y + s.vy * e + 60 * e * e, 2, 2) } g.restore();
    if (day < 1) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = `rgba(15,20,55,${(1 - day) * .38})`; g.fillRect(0, 0, cv.width, cv.height) }
    /* speech bubbles on top, in screen space */
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    placed = []; for (const a of people.values()) if (a.bubble && t < a.bubble.until) bubble(a, a.bubble.txt);
    if (hoverId && people.get(hoverId)) { const a = people.get(hoverId), p = screen(a.vu, a.vv); label(a.p.name + ' · ' + fill(a.p.role), p.x, p.y - 100 * Z) }
  }
  /* v95.01 · the villager the current intro quest wants (js/story-quests.js) gets a gold ◆ */
  let qT = null, qAt = 0;
  function questNpc(id) { const n = performance.now(); if (n > qAt) { qAt = n + 500; try { qT = parent !== window ? parent.Story?.questTargets?.() : null } catch (e) { qT = null } } return !!qT?.npc?.includes(id) }
  function drawPerson(a, t) {
    const p = P(a.vu, a.vv); g.save(); g.globalAlpha = Math.max(0, Math.min(1, a.fade));
    VillagerDraw(g, a.p.look || {}, p.x, p.y, t, { walking: a.walking, face: a.face, phase: a.phase, act: a.act, scale: .95 });
    if (a.p.recruit && !L.inParty(S, a.id)) { g.font = '700 15px system-ui'; g.textAlign = 'center'; g.fillStyle = '#ffd25a'; g.strokeStyle = '#2a1a0a'; g.lineWidth = 3; const y = p.y - 98 + Math.sin(t * .004) * 3; g.strokeText('★', p.x, y); g.fillText('★', p.x, y) }
    if (questNpc(a.id)) { const y = p.y - 122 + Math.sin(t * .006) * 5; g.shadowColor = 'rgba(255,200,60,.9)'; g.shadowBlur = 14; g.beginPath(); g.moveTo(p.x, y - 18); g.lineTo(p.x + 11, y); g.lineTo(p.x, y + 18); g.lineTo(p.x - 11, y); g.closePath(); g.fillStyle = '#ffd34d'; g.fill(); g.shadowBlur = 0; g.lineWidth = 2; g.strokeStyle = '#5a3a0a'; g.stroke() }
    if (a.p.benched) { g.font = '700 12px system-ui'; g.textAlign = 'center'; g.fillStyle = '#9fe0b0'; g.fillText('ทีม', p.x, p.y - 96) }
    g.restore();
  }
  const LOOK = window.JobLook?.mine() || null;   /* v97.23 · J4: the job's outfit colour and aura indoors too */
  function drawHero(t) {
    const set = hero.walking ? walkImgs : heroImgs, im0 = set[Math.floor(t / (hero.walking ? 110 : 260)) % set.length], im = LOOK ? JobLook.pic(im0, im0.src, LOOK) : im0, s = 104, p = P(hero.vu, hero.vv);
    g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(p.x, p.y, 15, 6, 0, 0, 7); g.fill();
    if (LOOK) JobLook.aura(g, LOOK, { x: p.x, y: p.y + 3 }, s, t, false);
    if (im0.complete && im0.naturalWidth) { g.save(); g.translate(p.x, p.y + 3); if (hero.face === 'SW' || hero.face === 'NW') g.scale(-1, 1); g.drawImage(im, -s / 2, -s * .94, s, s); g.restore() }
    if (LOOK) JobLook.aura(g, LOOK, { x: p.x, y: p.y + 3 }, s, t, true);
  }
  function label(txt, x, y) { g.save(); g.font = '600 13px VillageThai,system-ui'; const w = g.measureText(txt).width + 14; g.fillStyle = 'rgba(20,14,8,.85)'; g.beginPath(); g.roundRect(x - w / 2, y - 18, w, 22, 8); g.fill(); g.fillStyle = '#ffe9b8'; g.textAlign = 'center'; g.fillText(txt, x, y - 3); g.restore() }
  function bubble(a, txt) {
    const p = screen(a.vu, a.vv); g.save(); g.font = '13px VillageThai,system-ui'; const maxW = 220, words = [...txt], lines = []; let cur = '';
    for (const ch of words) { if (g.measureText(cur + ch).width > maxW) { lines.push(cur); cur = ch } else cur += ch } if (cur) lines.push(cur);
    const w = Math.min(maxW, Math.max(...lines.map(l => g.measureText(l).width))) + 16, h = lines.length * 17 + 10; let x = Math.max(6, Math.min(W - w - 6, p.x - w / 2)), y = p.y - 100 * Z - h - 6;
    /* v94.03: bubbles drawn this frame never overlap — a later one moves up past the earlier ones (and stays on screen) */
    for (let k = 0; k < 8; k++) { const hit = placed.find(r => x < r.x + r.w + 4 && x + w + 4 > r.x && y < r.y + r.h + 4 && y + h + 4 > r.y); if (!hit) break; y = hit.y - h - 8 } y = Math.max(4, y); placed.push({ x, y, w, h });
    g.fillStyle = 'rgba(255,250,235,.95)'; g.strokeStyle = 'rgba(80,60,30,.6)'; g.lineWidth = 1.5; g.beginPath(); g.roundRect(x, y, w, h, 10); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(p.x - 6, y + h); g.lineTo(p.x, y + h + 8); g.lineTo(p.x + 6, y + h); g.fill();
    g.fillStyle = '#3a2a14'; g.textAlign = 'left'; lines.forEach((l, i) => g.fillText(l, x + 8, y + 18 + i * 17)); g.restore();
  }

  /* ---------- input ---------- */
  function personAt(sx, sy) { let best = null, bd = 1e9; for (const a of people.values()) { if (a.leaving) continue; const p = screen(a.vu, a.vv), dx = sx - p.x, dy = sy - (p.y - 40 * Z); if (Math.abs(dx) < 20 * Z && Math.abs(dy) < 48 * Z) { const d = Math.hypot(dx, dy); if (d < bd) { bd = d; best = a } } } return best }
  cv.addEventListener('pointermove', e => { const a = personAt(e.clientX, e.clientY); hoverId = a ? a.id : null; cv.style.cursor = a ? 'pointer' : 'default' });
  cv.addEventListener('pointerup', e => {
    if (modalOpen) return;
    const a = personAt(e.clientX, e.clientY);
    if (a) { walkNear(a, () => talk(a)); return }
    const c = toCell(e.clientX, e.clientY), cell = { u: Math.floor(c.u), v: Math.floor(c.v) };
    if (KIND === 'farm') {   /* v97.83 · the field, the cabin, the shipping bin and the yard */
      const tile = R.items.find(i => i.k === 'ftile' && i.u === cell.u && i.v === cell.v);
      if (tile) { walkNear({ u: tile.u, v: tile.v }, () => fieldAction(tile.idx)); return }
      const thing = R.items.find(i => ['cabin', 'bin', 'coop', 'barn'].includes(i.k) && cell.u >= i.u - 1 && cell.u <= i.u + i.w && cell.v >= i.v - 1 && cell.v <= i.v + i.d);
      if (thing?.k === 'cabin') { walkNear({ u: thing.u + 1, v: thing.v + thing.d }, cabinMenu); return }
      if (thing?.k === 'bin') { walkNear({ u: thing.u, v: thing.v }, shipAll); return }
      const pen = R.pen && cell.u >= R.pen.u - 1 && cell.u <= R.pen.u + R.pen.w && cell.v >= R.pen.v - 1 && cell.v <= R.pen.v + R.pen.d;
      if (pen || thing) { const edge = { u: R.pen.u - 2, v: R.pen.v + 1 }; walkTo(free(edge.u, edge.v) ? edge : { u: hero.u, v: hero.v }, () => penAction()); return }
    }
    const nearDoor = cell.u <= 0 && Math.abs(cell.v - DOOR.v) <= 1 || (cell.u < 0 && cell.v >= DOOR.v - 1 && cell.v <= DOOR.v + 1);
    if (nearDoor) { walkTo(DOOR, leave); return }
    if (free(cell.u, cell.v)) walkTo(cell);
  });
  function walkTo(c, then) { const p = pathTo({ u: hero.u, v: hero.v }, c); if (!p) return; hero.path = p.slice(1); hero.then = then || null; if (!hero.path.length && then) { hero.then = null; then() } }
  function walkNear(a, then) {
    const opts = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]].map(([du, dv]) => ({ u: a.u + du, v: a.v + dv })).filter(c => free(c.u, c.v) && ![...people.values()].some(o => o !== a && o.u === c.u && o.v === c.v));
    let best = null, bl = 1e9; for (const c of opts) { const p = pathTo({ u: hero.u, v: hero.v }, c); if (p && p.length < bl) { bl = p.length; best = c } }
    if (best) walkTo(best, () => { hero.face = faceOf(a.u - hero.u, a.v - hero.v); then() }); else then();
  }
  /* v94: inside the game (index.html → place frame) the game closes the interior; on its own page we walk back to the village page */
  const EMBED = Q.get('embed') === '1' && window.parent !== window;
  let shown = true;
  function leave() { if (KIND === 'farm') { location.href = /^[a-z0-9_-]+\.html$/i.test(Q.get('back') || '') ? Q.get('back') : 'world-map.html'; return } if (EMBED) { parent.postMessage({ source: 'project-a-place', type: 'leave' }, '*'); return } location.href = 'village-town.html?from=' + encodeURIComponent(PLACE) }
  if (EMBED) {
    addEventListener('message', e => { if (e.source !== parent || e.data?.source !== 'project-a-game') return; if (e.data.type === 'visibility') shown = !!e.data.visible });
    addEventListener('load', () => parent.postMessage({ source: 'project-a-place', type: 'ready' }, '*'));
  }

  /* ---------- UI ---------- */
  const css = document.createElement('style'); css.textContent = `
  #inHud{position:fixed;left:14px;top:14px;z-index:5;width:270px;background:linear-gradient(#2a2116f2,#1b150ef2);border:1px solid #c9a86a88;border-radius:12px;padding:10px 12px;box-shadow:0 8px 30px #000a;font-size:13px}
  #inHud h1{margin:0;font-size:17px;color:#ffe2a8}#inHud .sub{color:#bba57f;font-size:12px;margin:2px 0 8px}#inHud .row{display:flex;justify-content:space-between;margin:3px 0}
  #inHud button,.in-dlg button{background:#c9893a;color:#fff;border:0;border-radius:8px;padding:6px 10px;margin:2px 2px 0 0}#inHud button.ghost,.in-dlg button.ghost{background:#4a3e2e}.in-dlg button:disabled{opacity:.45;cursor:default}
  #inHud .who{margin-top:8px;max-height:210px;overflow:auto}#inHud .who div{padding:3px 6px;border-radius:6px;cursor:pointer;display:flex;justify-content:space-between;gap:6px}#inHud .who div:hover{background:#ffffff14}#inHud .who small{color:#bba57f}
  .in-dlg-bg{position:fixed;inset:0;z-index:20;display:flex;align-items:flex-end;justify-content:center;padding:16px;background:linear-gradient(#0000 40%,#000a)}
  .in-dlg{width:min(760px,100%);background:linear-gradient(#f3e6c6,#e2cfa2);color:#3a2a14;border-radius:14px;padding:14px 16px;display:grid;grid-template-columns:110px 1fr;gap:14px;box-shadow:0 20px 60px #000c,inset 0 0 0 2px #8a6a3a}
  .in-dlg canvas{width:110px;height:130px;background:radial-gradient(#fff6dc,#d9c08a);border-radius:10px;border:2px solid #8a6a3a}
  .in-dlg h2{margin:0;font-size:19px;color:#5a2e10}.in-dlg h2 .tier{font-size:12px;font-weight:600;color:#a0442a;background:#fff6;border-radius:999px;padding:1px 8px;margin-left:4px}.in-dlg .role{font-size:12px;color:#7a5a30}.in-dlg p{margin:8px 0;line-height:1.6;min-height:3em}.in-dlg .acts{display:flex;flex-wrap:wrap;gap:4px}
  .in-dlg .cond{font-size:12px;background:#fff7e3;border:1px dashed #b89a62;border-radius:8px;padding:6px 8px;margin:6px 0}
  .in-toast{position:fixed;left:50%;top:14%;transform:translateX(-50%);z-index:30;padding:9px 20px;border-radius:999px;background:#14100bee;color:#ffe2a8;font:700 16px VillageThai,system-ui;box-shadow:0 6px 20px #000a;animation:inT 2.2s forwards;pointer-events:none}
  @keyframes inT{0%{opacity:0;transform:translate(-50%,10px)}12%{opacity:1;transform:translate(-50%,0)}80%{opacity:1}100%{opacity:0}}
  .in-party{position:fixed;inset:0;z-index:25;background:#000a;display:flex;align-items:center;justify-content:center}.in-party>div{width:min(560px,94vw);background:linear-gradient(#f3e6c6,#e2cfa2);color:#3a2a14;border-radius:14px;padding:16px}
  .in-party .col{display:grid;grid-template-columns:1fr 1fr;gap:10px}.in-party .slot{background:#fff7e3;border:1px solid #b89a62;border-radius:8px;padding:6px 8px;margin:4px 0;cursor:pointer;display:flex;justify-content:space-between}.in-party .slot:hover{background:#ffe9b8}
  #inBattle{position:fixed;inset:0;z-index:40;border:0;width:100%;height:100%;background:#000}
  @media (max-width:760px){#inHud{width:200px;font-size:12px}.in-dlg{grid-template-columns:70px 1fr}.in-dlg canvas{width:70px;height:84px}}`;
  document.head.append(css);
  const hud = document.createElement('div'); hud.id = 'inHud'; document.body.append(hud);
  function hudSync() {
    S = L.save(); const back = MIND?.tick(S) || []; if (back.length) { L.writeSave(S); for (const b of back) toast(`💼 ${L.P[b.id]?.name || b.id} กลับจากงานแล้ว · ${b.gain}`) }
    const c = CLK.read(), icon = daylight() > .5 ? '☀' : '🌙';
    const here = [...people.values()].filter(a => !a.leaving);
    const html = `<h1>${esc(NAME)}</h1><div class="sub">Fernvale · ${window.WorldState?.season ? window.WorldState.season(c.day)[2] + ' ' : ''}วันที่ ${c.day} · ${icon} ${CLK.label(c.hour)}</div>
      <div class="row"><span>💰 ${S.gold}</span><span>🧪 ${S.potions}</span><span>ทีม ${S.party.length}/${L.MAX_ACTIVE}${S.bench.length ? ' (+' + S.bench.length + ')' : ''}</span></div>
      <div>${KIND === 'inn' ? '<button id="inParty">👥 จัดทีม</button><button id="inRoom">🛏 เช่าห้อง 10💰</button>' : ''}${KIND === 'home' ? '<button id="inSleep">🛏 นอนพัก</button>' : ''}${KIND === 'farm' ? (() => { const G = farmG(), b = G ? window.Garden.badge(G) : ''; const Gd = window.Garden, c = G ? Gd.fieldCount(G) : null; return '<div style="font-size:12px;margin:2px 0">🌱 เมล็ดในมือ <select id="fmSeed"><option value="">— เลือกตอนปลูก —</option>' + Object.entries(Gd.CROPS).filter(([k]) => Gd.canPlant(k)).map(([k, C]) => `<option value="${k}" ${k === seedPick ? 'selected' : ''}>${C.icon} ${C.name} ${C.seed}💰</option>`).join('') + '</select></div>' + (c ? `<div style="font-size:12px">แปลงไถแล้ว ${c.soil} · ปลูก ${c.planted} · ต้องถาง ${c.debris} · เหนื่อย ${S.fatigue}%</div>` : '') + '<button id="fmOpen">🌾 จัดการไร่' + b + '</button><button id="fmWater">💧 รดน้ำทุกแปลง</button><button id="fmHarvest">🧺 เก็บทุกแปลงที่สุก</button>' })() : ''}${services()}<button id="inOut" class="ghost">🚪 ออกไปข้างนอก</button></div>
      <div class="who">${here.length ? here.map(a => `<div data-id="${a.id}"><span>${a.p.recruit && !L.inParty(S, a.id) ? '★ ' : ''}${esc(a.p.name)}</span><small>${esc(a.p.benched ? 'พักกับทีม' : fill(a.p.role))}</small></div>`).join('') : '<small style="color:#bba57f">ไม่มีใครอยู่ตอนนี้</small>'}</div>
      <div style="margin-top:6px;font-size:11px;color:#9a8a6a">${KIND === 'farm' ? 'คลิกช่องในไร่ = ถาง → ไถ → ปลูก → รดน้ำ → เก็บ · กระท่อม = จัดการไร่ · กล่องส่งขาย = ขายของในตะกร้า · คอก = ลูบหัวสัตว์ · ประตูซ้าย = ออก' : 'คลิกพื้น = เดิน · คลิกคน = คุย · ★ = ชวนเข้าทีมได้ · ประตูซ้าย = ออก'}</div>`;
    if (html === hud._html) return; hud._html = html; hud.innerHTML = html;   // only rebuild when something changed (keeps clicks reliable)
    hud.querySelector('#inOut').onclick = () => walkTo(DOOR, leave);
    if (KIND === 'farm') {
      hud.querySelector('#fmOpen').onclick = () => openFarm();
      hud.querySelector('#fmSeed').onchange = e => { seedPick = e.target.value; hud._html = '' };
      hud.querySelector('#fmWater').onclick = () => toast('💧 รดน้ำ ' + (farmDo(G => window.Garden.waterAll(G)) || 0) + ' แปลง');
      hud.querySelector('#fmHarvest').onclick = () => toast('🧺 เก็บได้ ' + (farmDo(G => window.Garden.harvestAll(G)) || 0) + ' ผล');
    }
    hud.querySelector('#inParty') && (hud.querySelector('#inParty').onclick = partyPanel);
    hud.querySelector('#inRoom') && (hud.querySelector('#inRoom').onclick = () => rest(10));
    hud.querySelector('#inSleep') && (hud.querySelector('#inSleep').onclick = () => rest(0));
    hud.querySelectorAll('[data-svc]').forEach(b => b.onclick = () => service(b.dataset.svc));
    hud.querySelectorAll('.who [data-id]').forEach(e => e.onclick = () => { const a = people.get(e.dataset.id); if (a) walkNear(a, () => talk(a)) });
  }
  function workPanel(a) {
    const p = a.p, jobs = MIND.canWork(p.id, p.benched), JOBS = window.VillageLines.JOBS;
    talk(a, 'งานแบบไหนล่ะ? ข้าทำได้ ' + jobs.map(k => JOBS[k].name).join(', '));
    const acts = dlg?.querySelector('.acts'); if (!acts) return;
    acts.innerHTML = jobs.map(k => `<button data-a="job:${k}" ${S.gold < JOBS[k].cost ? 'disabled' : ''}>${esc(JOBS[k].name)} · ${JOBS[k].cost}💰 · ${JOBS[k].hours} ชม. → ${{ reveal: 'เปิดแผนที่', potions: 'ยา', food: 'เสบียง', gold: 'เงิน' }[JOBS[k].give]}</button>`).join('') + '<button class="ghost" data-a="talk">ย้อนกลับ</button>';
    acts.querySelectorAll('[data-a]').forEach(b => b.onclick = () => act(a, b.dataset.a));
  }
  let placed = [];
  /* v97.82 · farm actions — each one reloads the world save, changes the farm and writes it back */
  function farmDo(fn) { const S0 = L.save(), fp = farmPlot(S0); if (!fp || !window.Garden) return null; const G = window.Garden.of(fp), r = fn(G, S0); L.writeSave(S0); farmCache = null; hud._html = ''; hudSync(); return r }
  let seedPick = '';   /* the seed in hand (HUD); clicking tilled soil plants it */
  function fieldAction(i) {
    const today = window.WorldState?.game?.()?.day || 1;
    const msg = farmDo(G => { const Gd = window.Garden, k = G.ground[i], p = G.plots[i];
      if (Gd.DEBRIS[k]) { const D = Gd.DEBRIS[k], w = Gd.clearTile(G, i); return w || (D.verb + D.name + 'แล้ว' + (D.give ? ' · ได้' + (D.give[0] === 'wood' ? 'ไม้ ' : 'หิน ') + D.give[1] : '') + ' · เหนื่อย +' + D.fat) }
      if (k === 'grass') return Gd.till(G, i) || '⛏ ไถดินแล้ว พร้อมปลูก';
      if (!p) { if (seedPick && Gd.CROPS[seedPick]) return Gd.plant(G, i, seedPick) || Gd.CROPS[seedPick].icon + ' ปลูก' + Gd.CROPS[seedPick].name + 'แล้ว อย่าลืมรดน้ำ'; return 'seed' }
      if (p.dead) { Gd.clear(G, i); return '🥀 ถอนต้นที่ตายแล้ว' }
      if (p.ripe) return '🧺 เก็บ' + Gd.CROPS[p.crop].name + ' ได้ ' + Gd.harvest(G, i) + ' ผล';
      if (p.w !== today) { Gd.water(G, i); return '💧 รดน้ำ' + Gd.CROPS[p.crop].name + 'แล้ว' }
      return '🌿 ' + Gd.CROPS[p.crop].name + ' โตแล้ว ' + Math.floor(p.g) + '/' + Gd.CROPS[p.crop].days + ' วัน · วันนี้รดน้ำแล้ว' });
    if (msg === 'seed') return openFarm(i); if (msg) toast(msg);
  }
  if (KIND === 'farm') window.FarmScene = { go: (u, v) => walkTo({ u, v }), act: i => fieldAction(i), ship: () => shipAll(), pen: () => penAction(), seed: k => { seedPick = k }, screenOf: i => { const it = R.items.find(x => x.k === 'ftile' && x.idx === i); return it && screen(it.u + .5, it.v + .5) } };   /* for tests and tools */
  /* v97.84 · the cabin: the farm's book, or a bed to sleep off the day's clearing */
  function cabinMenu() {
    close(); modalOpen = true; const bg = document.createElement('div'); bg.className = 'in-dlg-bg';
    bg.innerHTML = `<div class="in-dlg" style="grid-template-columns:1fr"><div><h2>🏠 กระท่อม</h2><p>เครื่องมือแขวนอยู่ข้างผนัง สมุดจดงานไร่วางบนโต๊ะ และเตียงไม้เล็ก ๆ ตรงมุมห้อง · ความเหนื่อยตอนนี้ ${S.fatigue}%</p>
      <div class="acts"><button data-a="book">🌾 จัดการไร่</button><button data-a="sleep">🛏 นอนพักถึงเช้า</button><button class="ghost" data-a="x">ออก</button></div></div></div>`;
    document.body.append(bg); dlg = bg;
    bg.onclick = e => { const b = e.target.closest('[data-a]'); if (e.target === bg || b?.dataset.a === 'x') return close(); if (!b) return; close(); if (b.dataset.a === 'book') openFarm(); else rest(0) };
  }
  function shipAll() { const c = farmDo(G => window.Garden.sell(G)); toast(c ? '📦 ส่งขายผลผลิตในตะกร้า ได้ ' + c + ' 💰' : '📦 ตะกร้ายังว่าง · เก็บผักหรือผลผลิตจากคอกก่อน') }
  function penAction() { const n = farmDo(G => G.animals.length ? window.Garden.patAll(G) : -1); toast(n < 0 ? '🐾 คอกยังว่าง · ซื้อสัตว์ได้ที่ 🌾 จัดการไร่' : n ? '🤚 ลูบหัวสัตว์ ' + n + ' ตัว ดูอารมณ์ดีขึ้น' : '🐾 วันนี้ลูบหัวครบทุกตัวแล้ว') }
  function openFarm(pick) {
    const S0 = L.save(), fp = farmPlot(S0); if (!fp || !window.Garden) return; const G = window.Garden.of(fp), size0 = G.plots.length, barn0 = !!G.have.barn, have0 = JSON.stringify(G.have);
    modalOpen = true;
    window.Garden.open(G, { title: fp.name, pick, onChange: () => { L.writeSave(S0); farmCache = null; hud._html = ''; hudSync() }, onClose: () => { modalOpen = false; L.writeSave(S0); farmCache = null; if (G.plots.length !== size0 || !!G.have.barn !== barn0 || JSON.stringify(G.have) !== have0) location.reload() } });
  }
  function toast(t) { const d = document.createElement('div'); d.className = 'in-toast'; d.textContent = t; document.body.append(d); setTimeout(() => d.remove(), 2300) }
  async function rest(cost) {
    S = L.save(); if (S.gold < cost) { toast('เงินไม่พอ'); return }
    S.gold -= cost; for (const p of [...S.party, ...S.bench]) p.hp = p.max; L.writeSave(S);
    document.body.style.transition = 'filter .6s'; document.body.style.filter = 'brightness(0)'; await wait(700);
    window.WorldState.sleep({ relief: cost ? 80 : 70 }); people.clear(); /* v94: same as sleeping at home (next morning 08:00) */ taken.clear(); syncPeople(true); document.body.style.filter = ''; toast('พักจนถึงเช้า · ทีมฟื้นเต็ม'); hudSync();
  }

  /* ---------- v97.24 · B5: the place's own services (only while somebody of the place is in the room) ----------
     healer: treat the whole party (1 💰 per 4 HP missing) · buy potions · shop / market: potions, travel food · temple: a free prayer once a day
     (fatigue −40, hero HP +30 %) and an offering (+1 potion of holy water for 25 💰) */
  const VP = id => !!window.VillageProjects?.has(id);   /* v97.35 · R3 village projects: herb garden, granary, shrine */
  /* v97.41 · prices also follow your standing (js/factions.js): merchants for the shop and market, the village for the healer */
  const FC = () => window.Factions, standing = () => FC()?.priceMult(KIND === 'healer' ? 'village' : 'merchants') ?? 1;
  const PRICE = { get potion() { return Math.max(5, Math.round(((KIND === 'healer' ? 15 : 18) - (VP('herbs') ? 3 : 0)) * standing())) }, get food() { return Math.max(2, Math.round((VP('granary') ? 3 : 4) * standing())) } };
  const keeperIn = () => [...people.values()].some(a => !a.leaving && (OWNER ? a.id === OWNER : !a.p.benched && !L.inParty(S, a.id)));   /* somebody of the place is in (not one of your own party) */
  const missing = () => { S = L.save(); return Math.max(0, (S.maxHp || 60) - (S.hp ?? 60)) + [...S.party, ...S.bench].reduce((n, m) => n + Math.max(0, m.max - m.hp), 0) };
  const healCost = () => Math.max(3, Math.ceil(missing() / 4 * (VP('herbs') ? .6 : 1) * standing()));
  function services() {
    const B = (k, label, cost, why) => `<button data-svc="${k}" ${why || (cost && S.gold < cost) ? 'disabled' : ''} title="${esc(why || '')}">${label}${cost ? ' ' + cost + '💰' : ''}</button>`;
    const away = keeperIn() ? '' : 'เจ้าของไม่อยู่ตอนนี้';
    /* v97.52 · T3: with a case open in Fernvale the shops turn you away (pay at the guard Dork's house) */
    const LW = window.Law, lawWhy = LW && !LW.clean(S, 'fernvale') ? 'มีคดีค้าง — ไปจ่ายค่าปรับที่บ้านยามดอร์ก' : '', steal = LW && (KIND === 'shop' || KIND === 'market') ? B('steal', '🤫 ลักของ', 0, '') : '';
    if (lawWhy && ['healer', 'shop', 'market', 'guild'].includes(KIND)) return B('x', '⚖ ' + lawWhy, 0, lawWhy) + steal;
    if (KIND === 'healer') return B('heal', '✚ รักษาทั้งทีม', missing() ? healCost() : 0, away || (missing() ? '' : 'ทุกคนแข็งแรงดี')) + B('potion', '🧪 ซื้อยา', PRICE.potion, away);
    if (KIND === 'shop' || KIND === 'market') return B('potion', '🧪 ซื้อยา', PRICE.potion, away) + B('food', '🍞 เสบียง ×3', PRICE.food * 3, away) + (KIND === 'market' && window.Settlements ? B('trade', '🛒 ซื้อขายสินค้า', 0, away) : '') + steal;
    /* v97.40 · the guild's contracts and what each household offers */
    if (KIND === 'guild') { const c = contract(); if (away) return B('x', '📜 งานกิลด์', 0, 'ซิกริดไม่อยู่ที่เคาน์เตอร์ (8:00–17:00)');
      const bn = window.Bounties ? B('bounty', '☠ ประกาศจับ' + (window.Bounties.active(S).some(b => b.state === 'slain') ? ' · มีรางวัลรอรับ' : ''), 0) : '';   /* v97.73 · T3 */
      if (c.active) { const k = Math.max(0, (S.kills || 0) - c.active.base), done = k >= c.active.n; return bn + B('turnin', done ? `✔ ส่งงาน ${c.active.label} +${c.active.reward}💰` : `📜 ${c.active.label} ${k}/${c.active.n}`, 0, done ? '' : 'ล้มศัตรูบนแผนที่โลกให้ครบก่อน') + (done ? '' : B('drop', '✕ ยกเลิกงาน', 0)) }
      return bn + c.offers.map((o, i) => B('take:' + i, `📜 ${o.label} → ${o.reward}💰`, 0, c.taken ? 'วันนี้รับงานไปแล้ว พรุ่งนี้มีงานใหม่' : '')).join('') }
    if (KIND === 'house') { const H = HOUSE_SVC[OWNER]; if (H) return H.filter(([k]) => k !== 'payfine' || (window.Law && window.Law.owed(S, 'fernvale'))).map(([k, label, cost]) => B(k, k === 'payfine' ? label + ' ' + window.Law.owed(S, 'fernvale') + '💰' : label, cost, k === 'projects' || k === 'lessons' || k === 'safety' || (k === 'office' && !window.Offices) || (k === 'petition' && !window.Settlements) ? '' : k === 'payfine' ? (S.gold < window.Law.owed(S, 'fernvale') ? 'เงินไม่พอ' : away) : away)).join('') }
    if (KIND === 'temple') { const prayed = (S.prayDay || 0) === CLK.read().day; return B('pray', '🙏 ภาวนา', 0, prayed ? 'ภาวนาแล้ววันนี้ · พรุ่งนี้มาใหม่' : '') + B('offer', '🕯 ถวาย · น้ำมนต์', 25, away) }
    return '';
  }
  const HOUSE_SVC = { may: [['bread', '🍞 ขนมปัง ×3', 9]], hilda: [['veg', '🥕 ผักสด ×3', 9], ['contest', '🏆 ประกวดผลผลิต', 0]], bryn: [['flour', '🌾 แป้งและเสบียง ×3', 9]], joe: [['fish', '🐟 ปลาย่าง ×3', 9]],
    saf: [['potion', '🧪 ยาสมุนไพร', 14]], oren: [['projects', '🏗 พัฒนาหมู่บ้าน', 0], ['office', '🏛 รับราชการ', 0], ['petition', '📜 คำร้อง · 🪑 สภาหมู่บ้าน', 0]], mira: [['lessons', '📘 ทบทวนบทเรียน', 0]], dork: [['safety', '🛡 ถามเรื่องความปลอดภัย', 0], ['payfine', '⚖ จ่ายค่าปรับ / ล้างคดี', 0]] };
  /* guild contracts: 3 a day (seeded by the day), one taken at a time, counted by the foes the hero brings down on the world map (S.kills) */
  function contract() {
    S.guild ||= {}; const day = CLK.read().day, G = S.guild;
    if (G.day !== day) { let h = day * 2654435761 >>> 0; const r = () => (h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296;
      G.day = day; G.taken = false; G.offers = [['กวาดล้างสัตว์ร้ายรอบหมู่บ้าน', 3], ['คุ้มกันทางเกวียน', 5], ['ล่าค่าหัวกลุ่มโจรป่า', 7]].map(([t, n]) => { const k = n + Math.floor(r() * 3); return { label: t + ' (ล้ม ' + k + ' ตัว)', n: k, reward: 25 + k * 11 } }) }
    return G;
  }
  function service(k) {
    S = L.save(); const pay = c => { if (S.gold < c) { toast('เงินไม่พอ'); return false } S.gold -= c; return true };
    if (k.startsWith('take:')) { const G = contract(), o = G.offers[+k.slice(5)]; if (!o || G.taken || G.active) return; G.active = { ...o, base: S.kills || 0 }; G.taken = true; L.writeSave(S); toast('📜 รับงาน: ' + o.label) }
    else if (k === 'contest') { const S0 = S; window.Garden?.contestPanel(S0, () => { L.writeSave(S0); hud._html = ''; hudSync() }); return }   /* v97.81 · the harvest contest */
    else if (k === 'bounty') { const S0 = S; window.Bounties.panel(S0, 'fernvale', () => { L.writeSave(S0); hud._html = ''; hudSync() }); return }
    else if (k === 'turnin') { const G = contract(), a = G.active; if (!a || (S.kills || 0) - a.base < a.n) return; a.reward = Math.round(a.reward * (FC()?.payMult('guild') ?? 1) * (1 + .15 * (window.Offices?.perk(S, 'magus') || 0))); S.gold += a.reward; FC()?.add('guild', 6, 'ส่งงาน ' + a.label); window.Law?.service(S, 'fernvale'); FC()?.add('village', 2, 'ช่วยกำจัดภัยรอบหมู่บ้าน'); G.done = (G.done || 0) + 1; G.active = null; L.writeSave(S); toast('✔ ส่งงานกิลด์ +' + a.reward + '💰 (ทำสำเร็จแล้ว ' + G.done + ' งาน)') }
    else if (k === 'drop') { const G = contract(); G.active = null; L.writeSave(S); toast('ยกเลิกงานแล้ว') }
    else if (['bread', 'veg', 'flour', 'fish'].includes(k)) { if (!pay(9)) return; S.food = (S.food || 0) + 3; L.writeSave(S); toast({ bread: '🍞', veg: '🥕', flour: '🌾', fish: '🐟' }[k] + ' ได้เสบียง 3 ห่อ (มี ' + S.food + ')') }
    else if (k === 'steal') { const LW = window.Law; let job = ''; try { job = window.WorldState.game().village.character?.job || '' } catch (e) { }
      const r = LW.steal(S, 'fernvale', { rogue: job === 'rogue', unwatched: !keeperIn() });
      if (r.ok) { if (Math.random() < .5) { S.potions = (S.potions || 0) + 1; toast('🤫 หยิบยามาได้ 1 ขวด ไม่มีใครเห็น') } else { S.food = (S.food || 0) + 3; toast('🤫 หยิบเสบียงมาได้ 3 ห่อ ไม่มีใครเห็น') } L.writeSave(S) }
      else { L.writeSave(S); const S0 = S;   /* the HUD reloads S every tick — keep the object the arrest changes */
        LW.arrest(S0, 'fernvale', 'มีคนเห็นคุณหยิบของในร้าน ยามมาถึงพอดี').then(a => { if (a === 'jail') { try { window.WorldState.sleep({ relief: 0 }) } catch (e) { } toast('⛓ ติดคุกหนึ่งคืน · ออกมาตอนเช้า') } else if (a === 'run') toast('🚨 คุณหนีไปได้ แต่ถูกหมายจับในเฟิร์นเวลแล้ว'); else toast('💰 จ่ายค่าปรับแล้ว คดีจบ'); L.writeSave(S0); hud._html = ''; hudSync() }) }
    }
    else if (k === 'payfine') { if (window.Law.pay(S, 'fernvale')) { L.writeSave(S); toast('⚖ จ่ายค่าปรับแล้ว ล้างคดีเรียบร้อย') } else toast('เงินไม่พอ') }
    else if (k === 'trade') { const S0 = S; window.Settlements.tradePanel('fernvale', S0, () => { L.writeSave(S0); hud._html = ''; hudSync() }); return }   /* S0: the HUD reloads S every tick */
    else if (k === 'petition') { window.Settlements?.petitionPanel('fernvale').then(p => { if (p) toast('📜 เฟิร์นเวลเปลี่ยนนโยบายเป็น ' + window.Settlements.POLICIES[p].name); hud._html = ''; hudSync() }); return }
    else if (k === 'office') { if (!window.Offices) return; const S0 = S; window.Offices.panel(S0, () => { L.writeSave(S0); hud._html = ''; hudSync() }); return }   /* v97.55 · T7 */
    else if (k === 'projects') { try { (parent.VillageProjects || window.VillageProjects)?.open() } catch (e) { } }
    else if (k === 'lessons') { let ls = []; try { ls = parent.Story?.lessons?.() || [] } catch (e) { } const a = [...people.values()].find(x => x.id === 'mira'); if (a) talk(a, ls.length ? 'บทเรียนที่เจ้าเคยเรียน: ' + ls.map(x => x.title).filter(Boolean).join(' · ') + ' — อยากทวนเรื่องไหน เปิดสมุดหมู่บ้านดูได้เลยนะ' : 'ยังไม่มีบทเรียนให้ทวนเลย ออกไปลองของจริงก่อนสิ'); else toast('ครูมิราไม่อยู่บ้านตอนนี้') }
    else if (k === 'safety') { const VPj = window.VillageProjects; const w = VPj?.has('watch'), r = VPj?.has('road'); const a = [...people.values()].find(x => x.id === 'dork'); const line = (w ? 'หอเฝ้ายามตะวันออกช่วยได้มาก ข้ามองเห็นได้ไกลถึงแนวป่า' : 'รั้วตะวันออกยังโหว่ ถ้ามีหอเฝ้ายามสักหลังข้าจะนอนหลับขึ้น') + ' · ' + (r ? 'ถนนใหม่ทำให้พวกพ่อค้ามาบ่อยขึ้น' : 'ถนนออกหมู่บ้านยังพังอยู่ คาราวานบ่นกันทุกคน'); if (a) talk(a, line); else toast('🛡 ' + line) }
    else if (k === 'heal') { const c = healCost(); if (!missing() || !pay(c)) return; S.hp = S.maxHp || 60; for (const m of [...S.party, ...S.bench]) m.hp = m.max; L.writeSave(S); toast('✚ รักษาแล้ว · ทุกคน HP เต็ม (−' + c + '💰)') }
    else if (k === 'potion') { if (!pay(PRICE.potion)) return; S.potions = (S.potions || 0) + 1; L.writeSave(S); toast('🧪 ได้ยาฟื้นฟู 1 ขวด (มี ' + S.potions + ')') }
    else if (k === 'food') { if (!pay(PRICE.food * 3)) return; S.food = (S.food || 0) + 3; L.writeSave(S); toast('🍞 ได้เสบียง 3 ห่อ (มี ' + S.food + ')') }
    else if (k === 'pray') { const day = CLK.read().day; if ((S.prayDay || 0) === day) return; S.prayDay = day; S.prays = (S.prays || 0) + 1; { const wp = window.Offices?.perk(S, 'warden') || 0; if (wp) for (const m of [...S.party, ...S.bench]) m.hp = Math.min(m.max, m.hp + Math.round(m.max * .3 * wp)) } FC()?.add('temple', 1, 'ภาวนาที่วิหาร'); S.fatigue = (S.fatigue || 0) - 40; const k2 = VP('shrine') ? .5 : .3; S.hp = Math.min(S.maxHp || 60, (S.hp ?? 60) + Math.round((S.maxHp || 60) * k2)); L.writeSave(S); toast('🙏 ใจสงบลง · ความเหนื่อย −40 · HP +' + Math.round(k2 * 100) + '%') }
    else if (k === 'offer') { if (!pay(25)) return; S.potions = (S.potions || 0) + 1 + (FC()?.rank('temple') >= 2 ? 1 : 0); FC()?.add('temple', 4, 'ถวายเงินบำรุงวิหาร'); L.writeSave(S); toast('🕯 ถวายแล้ว · ได้น้ำมนต์ (ยาฟื้นฟู) 1 ขวด') }
    hud._html = ''; hudSync();
  }

  /* ---------- talking + recruiting ---------- */
  let modalOpen = false, dlg = null;
  function close() { dlg?.remove(); dlg = null; modalOpen = false; talkingTo = null }
  /* v97.30 · relationship tiers (Mind npc.aff −5…10) and gifts by what each person likes (p.likes) — once a day per person */
  const TIERS = [[-99, 'ไม่ไว้ใจ', '💢'], [-1, 'คนแปลกหน้า', '·'], [1, 'คนรู้จัก', '♡'], [3, 'คุ้นเคย', '♥'], [6, 'เพื่อน', '♥♥'], [9, 'เพื่อนรัก', '💛']];
  const tierOf = aff => TIERS.filter(t => aff >= t[0]).at(-1);
  const GIFTS = {
    gold: { name: '10 เหรียญ', icon: '💰', like: /เงิน|เหรียญ|กำไร|แวววาว/, has: () => S.gold >= 10, take: () => { S.gold -= 10 } },
    food: { name: 'เสบียง', icon: '🍞', like: /ขนมปัง|เนื้อ|สตู|อาหาร/, has: () => S.food > 0, take: () => { S.food -= 1 } },
    potion: { name: 'ยาสมุนไพร', icon: '🧪', like: /ชา|สมุนไพร|ราก|ยา/, has: () => S.potions > 0, take: () => { S.potions -= 1 } },
    iron: { name: 'แท่งเหล็ก', icon: '▰', like: /เหล็ก|ดาบ|โล่/, has: () => (mats().iron || 0) > 0, take: () => { mats().iron-- } },
    wood: { name: 'ไม้', icon: '▤', like: /ไม้/, has: () => (mats().wood || 0) > 0, take: () => { mats().wood-- } }
  };
  function mats() { try { return window.WorldState.game().village.materials || {} } catch (e) { return {} } }
  function giftPanel(a) {
    const p = a.p, n = MIND.npc(p.id), day = CLK.read().day;
    if (n.giftDay === day) { talk(a, 'วันนี้ให้ข้ามาแล้วนี่ ไว้วันหลังเถอะ ขอบใจนะ'); return }
    talk(a, 'ให้ของข้าหรือ? …'); const acts = dlg.querySelector('.acts');
    acts.innerHTML = Object.entries(GIFTS).map(([k, G]) => `<button data-a="gift:${k}" ${G.has() ? '' : 'disabled'}>${G.icon} ${G.name}</button>`).join('') + '<button class="ghost" data-a="talk">ย้อนกลับ</button>';
    acts.querySelectorAll('[data-a]').forEach(b => b.onclick = () => act(a, b.dataset.a));
  }
  function giveGift(a, k) {
    const p = a.p, G = GIFTS[k], n = MIND.npc(p.id), day = CLK.read().day; S = L.save(); if (!G || !G.has() || n.giftDay === day) return;
    const liked = G.like.test(p.likes || ''), before = tierOf(n.aff || 0); G.take(); L.writeSave(S); try { window.WorldState.commit?.() } catch (e) { }
    n.giftDay = day; MIND.affect(p.id, liked ? 2 : .5); MIND.save(); const after = tierOf(n.aff || 0); hud._html = ''; hudSync();
    talk(a, liked ? `${G.name}! เจ้ารู้ได้ไงว่าข้าชอบ … ขอบใจจริง ๆ` : 'ขอบใจนะ ข้าจะเก็บไว้ใช้');
    if (after !== before) toast(`${p.name} · ความสัมพันธ์: ${after[1]} ${after[2]}`); else if (liked) toast('💝 ' + p.name + ' ชอบของขวัญนี้มาก');
  }
  function talk(a, line) {
    close(); modalOpen = true; talkingTo = a; S = L.save(); if (!line) try{if(parent!==window)parent.Story?.talked?.(a.p.id)}catch(e){};
    const p = a.p, per = CLK.period(CLK.read().hour), lines = p.lines?.[per] || p.lines?.day || p.lines?.evening || ['…'];
    let said = null; if (!line && MIND && L.P[p.id]) { said = MIND.talk(p.id, { period: per, place: KIND, save: S }); L.writeSave(S); if (said.reward) setTimeout(() => toast('รางวัล: ' + [said.reward.gold ? '+' + said.reward.gold + ' 💰' : '', said.reward.potions ? 'ยา +' + said.reward.potions : ''].filter(Boolean).join(' · ')), 200) }
    const txt = line || (said ? fill(said.text) : fill(lines[Math.floor(Math.random() * lines.length)]));
    const ws = MIND?.wantState(p.id), jobs = MIND && L.P[p.id] && !(p.recruit && !L.inParty(S, p.id)) ? MIND.canWork(p.id, p.benched) : [], aff = MIND?.npc(p.id).aff || 0;
    const rec = p.recruit && !L.inParty(S, p.id) ? L.RECRUIT[p.id] : null;
    const bg = document.createElement('div'); bg.className = 'in-dlg-bg';
    bg.innerHTML = `<div class="in-dlg"><canvas width="220" height="260"></canvas><div><h2>${esc(p.name)} <small class="tier" title="ความสัมพันธ์ ${Math.round(aff * 10) / 10}/10">${tierOf(aff)[2]} ${tierOf(aff)[1]}</small></h2><div class="role">${esc(fill(p.role))}${p.age ? ' · อายุ ' + p.age : ''}${p.benched ? ' · พักอยู่กับทีม' : ''}</div>
      <p>${esc(txt)}</p>${ws?.asked && !ws.done ? `<div class="cond">🤝 คำขอ: ${esc(ws.def.hint)}</div>` : ''}${rec ? `<div class="cond">★ เงื่อนไขชวนเข้าทีม: <b>${esc(rec.label)}</b><br>${esc(rec.text)}${progressText(p.id, rec)}</div>` : ''}
      <div class="acts"><button data-a="talk">💬 คุยต่อ</button><button data-a="about">❔ เรื่องของเขา</button>${MIND && L.P[p.id] ? '<button data-a="ask">❓ ถามเรื่อง…</button><button data-a="gift">🎁 ให้ของ</button>' : ''}${jobs.length ? '<button data-a="work">💼 จ้างทำงาน</button>' : ''}${rec ? '<button data-a="recruit">★ ชวนเข้าทีม</button>' : ''}${teachable(p.id) ? '<button data-a="teach">📖 เรียนท่า</button>' : ''}${p.id === 'olwen' && rec ? '<button data-a="drink">🍺 เลี้ยงเหล้า 10💰</button>' : ''}${p.id === 'marta' ? '<button data-a="rumor">📜 ข่าวลือ</button><button data-a="room">🛏 เช่าห้อง 10💰</button>' : ''}<button class="ghost" data-a="bye">ลาก่อน</button></div></div></div>`;
    document.body.append(bg); dlg = bg;
    const pc = bg.querySelector('canvas').getContext('2d'); pc.scale(2, 2); VillagerDraw(pc, p.look || {}, 55, 122, performance.now(), { face: 'SE', scale: 1.15 });
    bg.querySelectorAll('[data-a]').forEach(b => b.onclick = () => act(a, b.dataset.a));
    bg.onclick = e => { if (e.target === bg) close() };
    a.face = faceOf(hero.u - a.u, hero.v - a.v);
  }
  /* v95.10 · trainers (js/card-sources.js in the game page) */
  function teachable(id) { try { return parent !== window && !!parent.CardSources?.teaches?.(id) } catch (e) { return false } }
  function progressText(id, rec) {
    const r = S.recruit?.[id] || {};
    if (rec.kind === 'visits') return `<br>คุยกันแล้ว ${(r.days || []).length}/${rec.need} วัน`;
    if (rec.kind === 'battles') return r.base != null ? `<br>ความคืบหน้า: ชนะแล้ว ${Math.min(rec.need, S.battles - r.base)}/${rec.need}` : '<br>(กด "ชวนเข้าทีม" เพื่อรับเควส)';
    if (rec.kind === 'drinks') return `<br>เลี้ยงแล้ว ${r.n || 0}/${rec.need}`;
    if (rec.kind === 'reputation') return `<br>พิชิตแล้ว ${Object.keys(S.done || {}).length}/1`;
    if (rec.kind === 'boss') return S.done?.[rec.dest] ? '<br>✔ ล้มจ่าฝูงแล้ว' : '';
    if (rec.kind === 'offering') return `<br>มี ${S.gold}💰 · ยา ${S.potions}`;
    return '';
  }
  function joinNow(a, msg) {
    S = L.save(); if (!L.join(S, a.id)) { talk(a, 'ข้าอยู่ในทีมเจ้าแล้วนี่'); return }
    L.writeSave(S); MIND?.emit('recruit:join', { who: a.id, witness: [...people.keys()] }); toast('★ ' + a.p.name + ' เข้าร่วมทีม!' + (S.party.some(x => x.key === a.id) ? '' : ' (พักที่โรงแรม — จัดทีมเพื่อพาไป)'));
    talk(a, msg); hudSync();
  }
  async function act(a, what) {
    const p = a.p; S = L.save(); const rec = L.RECRUIT[p.id], r = (S.recruit[p.id] ||= {}), hour = CLK.read().hour;
    if (what === 'bye') { close(); return }
    if (what === 'teach') { close(); try { parent.CardSources?.teach?.(p.id) } catch (e) { } return }
    if (what === 'talk') { talk(a); return }
    if (what === 'ask') { talk(a, 'อยากรู้เรื่องอะไรล่ะ?'); const acts = dlg.querySelector('.acts'); acts.innerHTML = [['news', '📰 ข่าวล่าสุด'], ['people', '👥 คนในหมู่บ้าน'], ['road', '🧭 ทางข้างหน้า']].map(([k, n]) => `<button data-a="ask:${k}">${n}</button>`).join('') + '<button class="ghost" data-a="talk">ย้อนกลับ</button>'; acts.querySelectorAll('[data-a]').forEach(b => b.onclick = () => act(a, b.dataset.a)); return }
    if (what.startsWith('ask:')) { talk(a, fill(MIND.ask(p.id, what.slice(4)))); MIND.save(); return }
    if (what === 'gift') { giftPanel(a); return }
    if (what.startsWith('gift:')) { giveGift(a, what.slice(5)); return }
    if (what === 'about') { const ab = p.about?.length ? fill(p.about[Math.floor(Math.random() * p.about.length)]) : ''; talk(a, (p.trait ? '(' + fill(p.trait) + ') ' : '') + (ab || fill(p.story || '…')) + (L.originText?.(p) ? ' — ' + fill(L.originText(p)) : '')); return }
    if (what === 'rumor') { talk(a, 'ข่าวลือตอนนี้: ' + ['ถ้ำในป่าตะวันออกมีเสียงหอนทั้งคืน — พวกพรานไม่กล้าเข้าไป', 'คนงานเหมืองหนีออกมาบอกว่าหินในเหมืองลุกขึ้นเดิน', 'ระฆังวิหารเก่าในบึงหมอกดังเองทุกคืนข้างแรม', 'เกรเวนเล่าว่ามีคนกลับจากซากเมืองพร้อมผลึกแปลกประหลาด'][Math.floor(Math.random() * 4)] + ' (ไปที่ "ออกเดินทาง" เพื่อรับภารกิจ)'); return }
    if (what === 'room') { close(); rest(10); return }
    if (what === 'work') { workPanel(a); return }
    if (what.startsWith('job:')) { const k = what.slice(4), J = window.VillageLines.JOBS[k]; const r = MIND.startJob(p.id, k, S); if (!r.ok) { talk(a, r.why === 'gold' ? `ค่าจ้าง ${J.cost} เหรียญ … เจ้ายังมีไม่พอนะ` : 'ข้ายังทำงานเก่าไม่เสร็จเลย'); return } L.writeSave(S); close(); toast(`💼 ${p.name} ออกไป${J.name} · กลับราว ${J.hours} ชม.`); a.bubble = { txt: 'ไปล่ะ! เดี๋ยวกลับมาเล่าให้ฟัง', until: performance.now() + 2500 }; setTimeout(() => { syncPeople(false); hudSync() }, 300); return }
    if (what === 'drink') {
      if (!(hour >= 17 || hour < 4)) { talk(a, 'ตอนกลางวันข้ายังไม่ดื่ม… อย่างน้อยก็ไม่ดื่มต่อหน้าคนอื่น มาใหม่ตอนเย็นนะ'); return }
      const day = CLK.read().day; if (r.day === day) { talk(a, 'วันนี้เจ้าเลี้ยงข้าไปแล้ว … ฮึก … พรุ่งนี้ค่อยว่ากัน'); return }
      if (S.gold < 10) { talk(a, 'ไม่มีเงิน? งั้นก็ฟังข้าเล่าฟรี ๆ ไปก่อน'); return }
      S.gold -= 10; r.n = (r.n || 0) + 1; r.day = day; L.writeSave(S); hudSync();
      if (r.n >= rec.need) { joinNow(a, 'สามแก้วแล้ว! … ข้าจำไม่ได้ว่าสัญญาอะไรไว้ แต่ข้าไปกับเจ้าก็ได้ ไฟของข้ายังไม่ดับหรอก!'); return }
      talk(a, ['อ้า … องุ่นจากหุบใต้ เจ้ารู้ใจข้า', 'แก้วที่สองแล้ว … ข้าเริ่มชอบหน้าเจ้าแล้วสิ'][r.n - 1] || 'อีกแก้วสิ'); return;
    }
    if (what !== 'recruit' || !rec) return;
    if (rec.kind === 'hire') { if (S.gold < rec.cost) { talk(a, 'เงินยังไม่พอ ' + rec.cost + ' เหรียญ ไม่ต่อราคา'); return } S.gold -= rec.cost; L.writeSave(S); joinNow(a, rec.joinLine || 'ตกลง ขวานของข้าเป็นของเจ้าจนกว่างานจะจบ'); return }
    /* v94 recruit kinds: a friend just needs asking · "visits" = talk to them on N different days */
    if (rec.kind === 'friend') { joinNow(a, rec.joinLine || 'ไปด้วยกันสิ!'); return }
    if (rec.kind === 'visits') { const day = CLK.read().day; r.days ||= []; if (!r.days.includes(day)) r.days.push(day); L.writeSave(S); if (r.days.length >= rec.need) { joinNow(a, rec.joinLine || 'ตกลง ข้าจะไปกับเจ้า'); return } talk(a, (rec.waitLines || [])[r.days.length - 1] || 'มาคุยกันใหม่วันหลังนะ'); return }
    if (rec.kind === 'battles') { if (r.base == null) { r.base = S.battles || 0; L.writeSave(S); talk(a, 'จริงนะ! งั้นไปชนะศัตรูนอกหมู่บ้านให้ได้สามครั้ง แล้วกลับมาเล่าให้ข้าฟัง!'); return } const n = (S.battles || 0) - r.base; if (n >= rec.need) { joinNow(a, 'เจ้ารอดกลับมาได้จริง ๆ! ข้าไปด้วย ลูกธนูข้าจะไม่พลาดสักดอก!'); return } talk(a, `ยังหรอก ชนะไปแค่ ${Math.max(0, n)} ครั้งเอง อีก ${rec.need - Math.max(0, n)} ครั้งนะ!`); return }
    if (rec.kind === 'drinks') { talk(a, 'อยากให้ข้าไปด้วย? เลี้ยงเหล้าข้าก่อนสิ … สามแก้ว สามวัน'); return }
    if (rec.kind === 'reputation') { if (Object.keys(S.done || {}).length) { joinNow(a, 'เจ้าพิชิตที่นั่นได้จริง ๆ! อาจารย์พูดถูก ข้าจะตามเจ้าไป!'); return } talk(a, 'กลับมาพร้อมชัยชนะจากข่าวลือสักแห่งก่อนนะ แล้วข้าจะตามเจ้าไปทุกที่'); return }
    if (rec.kind === 'offering') { if (S.gold < rec.cost || S.potions < rec.potions) { talk(a, `ยังขาดอยู่ — ต้องการ ${rec.cost} เหรียญ และยาฟื้นฟู ${rec.potions} ขวด (มี ${S.gold}💰 · ยา ${S.potions})`); return } S.gold -= rec.cost; S.potions -= rec.potions; L.writeSave(S); joinNow(a, 'ขอบคุณที่ใจกว้าง ข้าจะเดินทางไปกับเจ้า และเยียวยาทุกคนในทีม'); return }
    if (rec.kind === 'boss') { if (S.done?.[rec.dest]) { joinNow(a, 'เจ้าล้มมันได้ … พ่อของเรนคงยิ้มอยู่ที่ไหนสักแห่ง ข้าจะไปกับเจ้า'); return } talk(a, 'จ่าฝูงยังอยู่ในถ้ำ ล้มมันก่อน แล้วค่อยมาคุยกับข้า'); return }
    if (rec.kind === 'duel') { if (!(hour >= 20 || hour < 4)) { talk(a, 'กลางวันข้าไม่ดวลกับใคร'); return } close(); duel(a); return }
  }
  /* a 1-vs-1 duel in the battle field (hero alone) */
  async function duel(a) {
    S = L.save(); modalOpen = true;
    const fr = document.createElement('iframe'); fr.id = 'inBattle';
    fr.src = `battle-field.html?battle=1&embed=1&r=5&biome=grass&night=1&m=bandit&ms=${encodeURIComponent('bandit*1.5')}&party=&hhp=${S.hp || 60}&hmax=${S.maxHp || 60}&title=${encodeURIComponent('ดวล · นาเดีย ·')}`;
    document.body.append(fr);
    const res = await new Promise(r => { const on = e => { if (e.data?.type === 'agrenor-battle') { removeEventListener('message', on); r(e.data) } }; addEventListener('message', on) });
    fr.remove(); modalOpen = false;
    if (res.outcome === 'win' || res.outcome === 'lose') MIND?.emit(res.outcome === 'win' ? 'duel:win' : 'duel:lose', { who: a.id, witness: [...people.keys()] });
    if (res.outcome === 'win') joinNow(a, 'ฮึ … ไม่เลวนี่ ข้ายอมรับ ข้าจะตามเจ้าไป แต่อย่าคิดว่าข้าจะเชื่อฟังทุกเรื่องนะ');
    else talk(a, res.outcome === 'flee' ? 'หนีแล้วหรือ? น่าผิดหวัง' : 'แค่นี้เองหรือ? กลับไปฝึกมาใหม่เถอะ');
  }
  /* party: up to 4 travel, the rest rest at the inn */
  function partyPanel() {
    S = L.save(); const el = document.createElement('div'); el.className = 'in-party';
    const row = (m, where) => `<div class="slot" data-k="${m.key}" data-w="${where}"><span>${esc(m.name)}</span><small>${m.hp}/${m.max} · ${where === 'party' ? 'ออกเดินทาง →' : '← พาไปด้วย'}</small></div>`;
    el.innerHTML = `<div><h2 style="margin:0 0 6px;color:#5a2e10">👥 จัดทีม</h2><p style="margin:0 0 8px;font-size:13px">ออกเดินทางได้สูงสุด ${L.MAX_ACTIVE} คน (ไม่รวมฮีโร่) ที่เหลือพักที่โรงแรม · คลิกเพื่อสลับ</p>
      <div class="col"><div><b>ออกเดินทาง (${S.party.length}/${L.MAX_ACTIVE})</b>${S.party.map(m => row(m, 'party')).join('') || '<div style="font-size:12px">—</div>'}</div><div><b>พักที่โรงแรม</b>${S.bench.map(m => row(m, 'bench')).join('') || '<div style="font-size:12px">—</div>'}</div></div>
      <div style="text-align:right;margin-top:10px"><button class="ghost" id="inPClose" style="background:#4a3e2e;color:#fff;border:0;border-radius:8px;padding:6px 12px">ปิด</button></div></div>`;
    document.body.append(el); modalOpen = true;
    el.querySelectorAll('.slot').forEach(s => s.onclick = () => { S = L.save(); const k = s.dataset.k; if (s.dataset.w === 'party') { const i = S.party.findIndex(m => m.key === k); S.bench.push(...S.party.splice(i, 1)) } else { if (S.party.length >= L.MAX_ACTIVE) { toast('ทีมเต็มแล้ว (' + L.MAX_ACTIVE + ' คน)'); return } const i = S.bench.findIndex(m => m.key === k); S.party.push(...S.bench.splice(i, 1)) } L.writeSave(S); el.remove(); modalOpen = false; people.clear(); taken.clear(); syncPeople(true); hudSync(); partyPanel() });
    el.querySelector('#inPClose').onclick = () => { el.remove(); modalOpen = false };
  }
  addEventListener('keydown', e => { if (e.key === 'Escape') { close(); document.querySelector('.in-party')?.remove(); modalOpen = false } });

  /* ---------- start ---------- */
  if (KIND === 'farm') { const msgs = farmDo(G => window.Garden.tick(G)) || []; for (const m of msgs.slice(0, 3)) toast(m) }   /* v97.82 · the days you were away */
  resize(); syncPeople(true); hudSync(); requestAnimationFrame(frame);
  if (KIND === 'square') toast('ลานกลางหมู่บ้านเป็นที่โล่ง — กลับออกไปข้างนอกได้เลย');
  window.Interior = { people, hero, talk: id => { const a = people.get(id); if (a) talk(a) }, act: (id, w) => { const a = people.get(id); if (a) return act(a, w) }, room: R, kind: KIND, sync: () => { syncPeople(false); hudSync() } };
})();
