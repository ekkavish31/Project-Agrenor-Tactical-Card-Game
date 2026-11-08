/* v98.276 · BG Editor, phase 1 — edit the REAL battle field in place (battle-field.html?edit=1&seed=…&biome=…).
   Same renderer, same textures, same height map as the game: what you see is what the fight uses. (docs/BG-EDITOR-CONCEPT-TH.md)
   • camera: wheel = zoom at the cursor · drag on empty ground (or right / middle button) = pan · the compass turns the view
   • click selects a fighter or a prop · drag moves it (snaps to cells, green = allowed, red = not) · R turns a fighter · D duplicates a prop · Del removes a prop · Esc unselects
   • palette: pick a prop kind, click a cell to put it there
   • Ctrl+Z / Ctrl+Y undo / redo · 💾 keeps the edits in this browser for THIS field (biome + seed + size + poi) and re-applies them on load
   Edits are an overlay of small operations on top of the seeded field (prop-move / prop-add / prop-del / unit), so a field is still fully described by seed + ops
   (phase 2 turns this into a BG Asset file). Nothing here changes the game when ?edit=1 is absent. */
(function () {
  'use strict';
  const Q = new URLSearchParams(location.search); if (Q.get('edit') !== '1') return;
  const key = (u, v) => u + ',' + v, STORE = () => 'fieldEdit:' + [Q.get('biome') || 'grass', Q.get('seed'), Q.get('r') || 7, Q.get('poi') || ''].join(':');
  document.documentElement.classList.add('fe-on');
  const style = document.createElement('style');
  style.textContent = `.fe-on [id^=fb],.fe-on .fb-show,.fe-on #fbBar{display:none!important}
#fePanel{position:fixed;left:50%;top:88px;transform:translateX(-50%);z-index:80;display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;max-width:96vw;padding:8px 10px;background:#241d15ee;border:1px solid #c9893a;border-radius:12px;font:13px AgThai,ProjectThai,system-ui,sans-serif;color:#f3e7cf;box-shadow:0 6px 24px #0008}
#fePanel button,#fePanel select{font:inherit;color:#f3e7cf;background:#3a2f22;border:1px solid #6a5434;border-radius:8px;padding:5px 10px;cursor:pointer}
#fePanel button:hover:not(:disabled){background:#4a3a28;border-color:#e0b050}#fePanel button:disabled{opacity:.4;cursor:default}
#fePanel .sep{width:1px;height:22px;background:#6a5434}#feInfo{min-width:150px;max-width:300px;color:#e6d3a9}#feHint{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:80;background:#241d15d0;border:1px solid #6a5434;border-radius:10px;padding:6px 12px;font:12px AgThai,ProjectThai,system-ui,sans-serif;color:#cdbb92;max-width:94vw;text-align:center}`;
  document.head.appendChild(style);

  /* ---------- the field's own data ---------- */
  const cellsMap = () => FIELD.cells, FH = () => window.FieldHeight, R = () => FIELD.R;
  const stateOf = () => window.TownBattle?.state?.() || null;
  const idx = (u, v) => { const F = FH(); return (v + F.R) * F.n + u + F.R };
  const water = (u, v) => { const F = FH(); return !!(F && F.map.water && F.map.water[idx(u, v)]) };
  const special = (u, v) => { const F = FH(); if (!F) return false; const i = idx(u, v), M = F.map; return !!(M.water?.[i] || M.stair?.[i] || M.ramp?.[i] || M.mat?.[i]) };
  const levelAt = (u, v) => FH() ? FH().sub(u, v) : 0;
  const unitAt = (u, v, but) => (stateOf()?.units || []).find(x => x.hp > 0 && x !== but && x.u === u && x.v === v);
  const PROP_KINDS = () => [...(FIELD.MIX.props || []).map(k => [k, false]), ...(FIELD.MIX.bigProps || []).map(k => [k, true])].filter(([k], i, a) => a.findIndex(x => x[0] === k) === i);

  /* a prop on the field: small = one cell with .prop · big (2×2) = four cells sharing c.big.id, anchor = the smallest-u/v cell */
  function propAt(u, v) {
    const c = cellsMap().get(key(u, v)); if (!c) return null;
    if (c.big) { for (const x of cellsMap().values()) if (x.big && x.big.id === c.big.id && x.big.anchor) return { kind: x.big.kind, big: true, u: x.u, v: x.v, seed: x.seed, id: x.big.id }; return null }
    return c.prop && c.k === 'blocked' ? { kind: c.prop, big: false, u: c.u, v: c.v, seed: c.seed } : null;
  }
  const footprint = p => p.big ? [[p.u, p.v], [p.u + 1, p.v], [p.u, p.v + 1], [p.u + 1, p.v + 1]] : [[p.u, p.v]];
  let nextBig = 9000;
  function putProp(p) {
    const cs = footprint(p).map(([u, v]) => cellsMap().get(key(u, v)));
    if (p.big) { const id = ++nextBig; cs.forEach((c, i) => { c.k = 'blocked'; c.big = { id, anchor: i === 0, kind: p.kind }; c.prop = i === 0 ? p.kind : null; c.seed = p.seed }) }
    else { cs[0].k = 'blocked'; cs[0].prop = p.kind; cs[0].seed = p.seed }
    FH()?.map && (cs.forEach(c => { FH().map.blocked && (FH().map.blocked[idx(c.u, c.v)] = 1) }));
  }
  function clearProp(p) {
    for (const [u, v] of footprint(p)) { const c = cellsMap().get(key(u, v)); if (!c) continue; c.k = 'normal'; c.prop = null; c.big = null; FH()?.map?.blocked && (FH().map.blocked[idx(u, v)] = 0) }
  }
  /* may this prop stand with its anchor at (u,v)?  (`self` = the cells it already occupies) */
  function canPut(p, u, v, self) {
    const mine = new Set(self ? footprint(self).map(([a, b]) => key(a, b)) : []), q = { ...p, u, v }; let lv = null;
    for (const [a, b] of footprint(q)) {
      const c = cellsMap().get(key(a, b)); if (!c || Math.abs(a) > R() || Math.abs(b) > R()) return false;
      if (!mine.has(key(a, b)) && (c.k === 'blocked' || c.big)) return false;
      if (unitAt(a, b)) return false; if (special(a, b)) return false;
      if (p.big) { const l = levelAt(a, b); if (lv == null) lv = l; else if (l !== lv) return false }
    }
    return true;
  }
  function canStand(u, v, unit) {
    const c = cellsMap().get(key(u, v)); return !!c && c.k !== 'blocked' && !c.big && !water(u, v) && !unitAt(u, v, unit) && Math.abs(u) <= R() && Math.abs(v) <= R();
  }

  /* ---------- operations (apply / invert) so undo, redo and saving share one path ---------- */
  const ops = [], undone = []; let dirty = false;
  function run(op, inverse) {
    const o = inverse ? inv(op) : op;
    if (o.t === 'prop-move') { const p = { kind: o.kind, big: o.big, seed: o.seed, u: o.from[0], v: o.from[1] }; clearProp(p); putProp({ ...p, u: o.to[0], v: o.to[1] }) }
    else if (o.t === 'prop-del') clearProp({ kind: o.kind, big: o.big, u: o.at[0], v: o.at[1] });
    else if (o.t === 'prop-add') putProp({ kind: o.kind, big: o.big, seed: o.seed, u: o.at[0], v: o.at[1] });
    else if (o.t === 'unit') { const x = (stateOf()?.units || []).find(y => y.id === o.id); if (x) { x.u = o.to.u; x.v = o.to.v; x.vu = o.to.u + .5; x.vv = o.to.v + .5; x.dir = o.to.dir; x.walking = false } }
    window.__feDirtyGround?.();
  }
  const inv = o => o.t === 'prop-move' ? { ...o, from: o.to, to: o.from } : o.t === 'prop-del' ? { ...o, t: 'prop-add', at: o.at } : o.t === 'prop-add' ? { ...o, t: 'prop-del' } : { ...o, from: o.to, to: o.from };
  function commit(op) { run(op, false); ops.push(op); undone.length = 0; dirty = true; sync() }
  function undo() { const o = ops.pop(); if (!o) return; run(o, true); undone.push(o); dirty = true; selPick(null); sync() }
  function redo() { const o = undone.pop(); if (!o) return; run(o, false); ops.push(o); dirty = true; sync() }

  /* ---------- selection / hit test ---------- */
  let sel = null, drag = null, adding = null, hover = null;
  const selPick = s => { sel = s; sync() };
  const screenOf = (u, v) => project(u, v);
  function pick(w) {
    const st = stateOf(); let best = null;
    for (const u of st?.units || []) { if (u.hp <= 0) continue; const p = screenOf(u.vu ?? u.u + .5, u.vv ?? u.v + .5), dx = w.x - p.x, dy = w.y - p.y; if (Math.abs(dx) < 30 * FK && dy > -96 * FK && dy < 14 * FK) { const d = Math.hypot(dx, dy + 40); if (!best || d < best.d) best = { d, s: { type: 'unit', unit: u } } } }
    if (best) return best.s;
    for (const c of cellsMap().values()) {
      if (!c.prop || (c.big && !c.big.anchor)) continue; const big = !!c.big, p = screenOf(c.u + (big ? 1 : .5), c.v + (big ? 1 : .5)), b = propBox(c.prop, c.seed, big);
      if (w.x >= p.x - b.w / 2 && w.x <= p.x + b.w / 2 && w.y >= p.y - b.h && w.y <= p.y + 6) { const d = -(c.u + c.v); if (!best || d < best.d) best = { d, s: { type: 'prop', prop: propAt(c.u, c.v) } } }
    }
    return best ? best.s : null;
  }
  const cellOf = w => { const F = FH(); const c = F ? F.hit(w.x, w.y) : null; return c && cellsMap().has(key(c.u, c.v)) ? c : null };

  /* ---------- pointer ---------- */
  const cvs = document.getElementById('world');
  const w2 = e => world(e);
  cvs.addEventListener('wheel', e => {
    e.preventDefault(); const before = world(e), f = Math.exp(-e.deltaY * .0012), nz = Math.max(.45, Math.min(3.5, zoom * f)); if (nz === zoom) return;
    zoom = nz; const after = world(e); pan.x += (after.x - before.x) * scale * zoom; pan.y += (after.y - before.y) * scale * zoom;
  }, { passive: false });
  cvs.addEventListener('contextmenu', e => e.preventDefault());
  cvs.addEventListener('pointerdown', e => {
    cvs.setPointerCapture?.(e.pointerId); window.TownBattle && cvs.dispatchEvent(new WheelEvent('wheel', { deltaY: 0 }));   // userCam = true: the battle camera stops following units
    const w = w2(e);
    if (e.button === 1 || e.button === 2) { drag = { kind: 'pan', x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }; return }
    if (e.button !== 0) return;
    if (adding) { const c = cellOf(w); if (c) { const big = adding.big, p = { kind: adding.kind, big, seed: Math.random(), u: c.u, v: c.v }; if (canPut(p, c.u, c.v)) { commit({ t: 'prop-add', kind: p.kind, big, seed: p.seed, at: [c.u, c.v] }); selPick({ type: 'prop', prop: propAt(c.u, c.v) }) } } return }
    const s = pick(w);
    if (s) { selPick(s); drag = s.type === 'unit' ? { kind: 'unit', unit: s.unit, from: { u: s.unit.u, v: s.unit.v, dir: s.unit.dir }, to: null, moved: false } : { kind: 'prop', prop: s.prop, to: null, moved: false } }
    else { selPick(null); drag = { kind: 'pan', x: e.clientX, y: e.clientY, px: pan.x, py: pan.y } }
  });
  cvs.addEventListener('pointermove', e => {
    const w = w2(e); hover = cellOf(w);
    if (!drag) return;
    if (drag.kind === 'pan') { pan.x = drag.px + (e.clientX - drag.x); pan.y = drag.py + (e.clientY - drag.y); return }
    const c = hover; if (!c) { drag.to = null; return }
    drag.moved = true;
    if (drag.kind === 'unit') drag.to = { u: c.u, v: c.v, ok: canStand(c.u, c.v, drag.unit) };
    else { const p = drag.prop, off = p.big ? 0 : 0; drag.to = { u: c.u - off, v: c.v - off, ok: canPut(p, c.u, c.v, p) } }
  });
  cvs.addEventListener('pointerup', e => {
    const d = drag; drag = null; if (!d || d.kind === 'pan' || !d.moved || !d.to || !d.to.ok) return;
    if (d.kind === 'unit') { if (d.to.u !== d.from.u || d.to.v !== d.from.v) commit({ t: 'unit', id: d.unit.id, from: d.from, to: { u: d.to.u, v: d.to.v, dir: d.from.dir } }) }
    else if (d.to.u !== d.prop.u || d.to.v !== d.prop.v) { const p = d.prop; commit({ t: 'prop-move', kind: p.kind, big: p.big, seed: p.seed, from: [p.u, p.v], to: [d.to.u, d.to.v] }); selPick({ type: 'prop', prop: propAt(d.to.u, d.to.v) }) }
  });

  /* ---------- actions ---------- */
  const DIRS = ['SE', 'SW', 'NW', 'NE'];
  function turnUnit() { const u = sel?.unit; if (!u) return; const n = DIRS[(DIRS.indexOf(u.dir) + 1) % 4]; commit({ t: 'unit', id: u.id, from: { u: u.u, v: u.v, dir: u.dir }, to: { u: u.u, v: u.v, dir: n } }) }
  function dupProp() {
    const p = sel?.prop; if (!p) return; const R0 = R();
    for (let r = (p.big ? 2 : 1); r < 8; r++) for (let du = -r; du <= r; du++) for (let dv = -r; dv <= r; dv++) { if (Math.max(Math.abs(du), Math.abs(dv)) !== r) continue; const u = p.u + du, v = p.v + dv; if (Math.abs(u) > R0 || Math.abs(v) > R0) continue; if (canPut(p, u, v)) { const q = { ...p, seed: Math.random() }; commit({ t: 'prop-add', kind: q.kind, big: q.big, seed: q.seed, at: [u, v] }); selPick({ type: 'prop', prop: propAt(u, v) }); return } }
  }
  function delSel() { const p = sel?.prop; if (!p) return; commit({ t: 'prop-del', kind: p.kind, big: p.big, seed: p.seed, at: [p.u, p.v] }); selPick(null) }
  function save() { try { localStorage.setItem(STORE(), JSON.stringify({ v: 1, ops })); dirty = false; sync(); note('บันทึกแล้ว ' + ops.length + ' การแก้ (เก็บในเบราว์เซอร์นี้ สำหรับสนาม seed ' + Q.get('seed') + ')') } catch (e) { note('บันทึกไม่ได้: ' + e.message) } }
  function reset() { if (!ops.length || !confirm('ล้างการแก้ทั้งหมดของสนามนี้ (' + ops.length + ' รายการ)?')) return; while (ops.length) run(ops.pop(), true); undone.length = 0; try { localStorage.removeItem(STORE()) } catch (e) { } selPick(null); dirty = false; sync() }
  function load() {
    let d = null; try { d = JSON.parse(localStorage.getItem(STORE()) || 'null') } catch (e) { } if (!d || !Array.isArray(d.ops)) return 0;
    for (const o of d.ops) { try { run(o, false); ops.push(o) } catch (e) { console.warn('fieldEdit: skipped', o, e) } } return ops.length;
  }
  window.addEventListener('keydown', e => {
    if (/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo() }
    else if ((e.ctrlKey || e.metaKey) && k === 'y') { e.preventDefault(); redo() }
    else if ((e.ctrlKey || e.metaKey) && k === 's') { e.preventDefault(); save() }
    else if (k === 'r' && sel?.unit) turnUnit(); else if (k === 'd' && sel?.prop) dupProp();
    else if (k === 'delete' || k === 'backspace') { e.preventDefault(); delSel() } else if (k === 'escape') { adding = null; selPick(null) }
  }, true);

  /* ---------- panel ---------- */
  const panel = document.createElement('div'); panel.id = 'fePanel';
  panel.innerHTML = `<span id="feInfo"></span><span class="sep"></span><button id="feTurn" title="R">↻ หมุนทิศ</button><button id="feDup" title="D">⧉ ทำซ้ำ</button><button id="feDel" title="Del">🗑 ลบ</button><span class="sep"></span>
<select id="feAdd" title="เลือกของ แล้วคลิกช่องบนสนาม"><option value="">＋ เพิ่มของ…</option></select><span class="sep"></span><button id="feUndo" title="Ctrl+Z">↶</button><button id="feRedo" title="Ctrl+Y">↷</button><button id="feSave" title="Ctrl+S">💾 บันทึก</button><button id="feReset">ล้างการแก้</button>`;
  document.body.appendChild(panel);
  const hint = document.createElement('div'); hint.id = 'feHint'; document.body.appendChild(hint);
  const $ = id => document.getElementById(id);
  for (const [k, big] of PROP_KINDS()) { const o = document.createElement('option'); o.value = k + '|' + (big ? 1 : 0); o.textContent = k + (big ? ' (2×2)' : ''); $('feAdd').appendChild(o) }
  $('feAdd').onchange = e => { const [k, b] = e.target.value.split('|'); adding = k ? { kind: k, big: b === '1' } : null; sync() };
  $('feTurn').onclick = turnUnit; $('feDup').onclick = dupProp; $('feDel').onclick = delSel; $('feUndo').onclick = undo; $('feRedo').onclick = redo; $('feSave').onclick = save; $('feReset').onclick = reset;
  let noteT = 0, noteMsg = '';
  function note(m) { noteMsg = m; noteT = performance.now() + 4000; sync() }
  function sync() {
    const u = sel?.unit, p = sel?.prop;
    $('feInfo').textContent = adding ? 'โหมดวาง: ' + adding.kind + ' — คลิกช่องที่ต้องการ (Esc ยกเลิก)' : u ? 'ตัวละคร: ' + (u.name || u.key || u.kind || u.id) + ' · ช่อง ' + u.u + ',' + u.v + ' · ' + u.dir : p ? 'ของ: ' + p.kind + (p.big ? ' (2×2)' : '') + ' · ช่อง ' + p.u + ',' + p.v : 'ยังไม่ได้เลือก — คลิกตัวละครหรือของบนสนาม';
    $('feTurn').disabled = !u; $('feDup').disabled = !p; $('feDel').disabled = !p; $('feUndo').disabled = !ops.length; $('feRedo').disabled = !undone.length; $('feSave').textContent = dirty ? '💾 บันทึก ●' : '💾 บันทึก';
    hint.textContent = (performance.now() < noteT ? noteMsg + ' · ' : '') + 'ล้อเมาส์ = ซูม · ลากพื้นว่าง = เลื่อน · ลากของ/ตัวละคร = ย้าย · R หมุน · D ทำซ้ำ · Del ลบ · Ctrl+Z ย้อน · Ctrl+S บันทึก';
  }
  /* ---------- overlay drawn inside the world transform (called from field-host frame) ---------- */
  window.FieldEdit = {
    active: true, ops: () => ops.slice(), save, load,
    draw(g, t) {
      const ring = (u, v, big, col, fill) => { const cs = big ? [[u, v], [u + 2, v], [u + 2, v + 2], [u, v + 2]] : [[u, v], [u + 1, v], [u + 1, v + 1], [u, v + 1]]; g.beginPath(); cs.forEach(([a, b], i) => { const q = project(a, b); i ? g.lineTo(q.x, q.y) : g.moveTo(q.x, q.y) }); g.closePath(); if (fill) { g.fillStyle = fill; g.fill() } g.strokeStyle = col; g.lineWidth = 3; g.stroke() };
      g.save();
      if (hover && !drag) ring(hover.u, hover.v, false, 'rgba(255,255,255,.55)');
      if (sel?.unit) ring(sel.unit.u, sel.unit.v, false, '#ffd34d', 'rgba(255,211,77,.18)');
      if (sel?.prop) ring(sel.prop.u, sel.prop.v, sel.prop.big, '#ffd34d', 'rgba(255,211,77,.18)');
      if (drag?.to) { const big = drag.kind === 'prop' && drag.prop.big; ring(drag.to.u, drag.to.v, big, drag.to.ok ? '#6fe08a' : '#ff6a5a', drag.to.ok ? 'rgba(111,224,138,.28)' : 'rgba(255,106,90,.28)') }
      else if (adding && hover) { const p = { kind: adding.kind, big: adding.big }, ok = canPut(p, hover.u, hover.v); ring(hover.u, hover.v, adding.big, ok ? '#6fe08a' : '#ff6a5a', ok ? 'rgba(111,224,138,.25)' : 'rgba(255,106,90,.25)') }
      g.restore();
    }
  };
  /* once the battle is built (units exist) put the saved edits back */
  let tries = 0; const wait = setInterval(() => { if (stateOf() || ++tries > 120) { clearInterval(wait); const n = load(); if (n) note('โหลดการแก้ที่บันทึกไว้ ' + n + ' รายการ'); sync() } }, 100);
  sync();
})();
