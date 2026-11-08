/* v98.276 · BG Editor, phase 1 — edit the REAL battle field in place (battle-field.html?edit=1&seed=…&biome=…).
   Same renderer, same textures, same height map as the game: what you see is what the fight uses. (docs/BG-EDITOR-CONCEPT-TH.md)
   • camera: wheel = zoom at the cursor · drag on empty ground (or right / middle button) = pan · the compass turns the view
   • click selects a fighter or a prop · drag moves it (snaps to cells, green = allowed, red = not) · R turns a fighter · D duplicates a prop · Del removes a prop · Esc unselects
   • palette: pick a prop kind, click a cell to put it there
   • Ctrl+Z / Ctrl+Y undo / redo · 💾 keeps the edits in this browser for THIS field (biome + seed + size + poi) and re-applies them on load
   Edits are an overlay of small operations on top of the seeded field (prop-move / prop-add / prop-del / unit), so a field is still fully described by seed + ops
   (phase 2: the same ops are written to a BG Asset file — js/bg-field.js). Nothing here changes the game when ?edit=1 is absent. */
(function () {
  'use strict';
  const Q = new URLSearchParams(location.search); if (Q.get('edit') !== '1') return;
  const key = (u, v) => u + ',' + v;
  document.documentElement.classList.add('fe-on');
  const style = document.createElement('style');
  style.textContent = `.fe-on [id^=fb],.fe-on .fb-show,.fe-on #fbBar{display:none!important}
#fePanel{position:fixed;left:50%;top:88px;transform:translateX(-50%);z-index:80;display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:center;max-width:96vw;padding:8px 10px;background:#241d15ee;border:1px solid #c9893a;border-radius:12px;font:13px AgThai,ProjectThai,system-ui,sans-serif;color:#f3e7cf;box-shadow:0 6px 24px #0008}
#fePanel button,#fePanel select{font:inherit;color:#f3e7cf;background:#3a2f22;border:1px solid #6a5434;border-radius:8px;padding:5px 10px;cursor:pointer}
#fePanel button:hover:not(:disabled){background:#4a3a28;border-color:#e0b050}#fePanel button:disabled{opacity:.4;cursor:default}
#fePanel .sep{width:1px;height:22px;background:#6a5434}#feInfo{min-width:150px;max-width:300px;color:#e6d3a9}#feHint{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:80;background:#241d15d0;border:1px solid #6a5434;border-radius:10px;padding:6px 12px;font:12px AgThai,ProjectThai,system-ui,sans-serif;color:#cdbb92;max-width:94vw;text-align:center}`;
  document.head.appendChild(style);

  /* ---------- the field's own data (shared core: js/bg-field.js) ---------- */
  const B = window.BgField, FH = () => window.FieldHeight, cellsMap = () => FIELD.cells, R = () => FIELD.R, stateOf = () => window.TownBattle?.state?.() || null;
  const { propAt, footprint, canPut, canStand } = B;
  const PROP_KINDS = () => [...(FIELD.MIX.props || []).map(k => [k, false]), ...(FIELD.MIX.bigProps || []).map(k => [k, true])].filter(([k], i, a) => a.findIndex(x => x[0] === k) === i);

  /* ---------- operations: undo / redo / save all run through BgField.run ---------- */
  const ops = [], undone = []; let dirty = false;
  const run = (o, inverse) => B.run(o, inverse);
  function commit(op) { run(op, false); ops.push(op); undone.length = 0; dirty = true; sync() }
  function undo() { const o = ops.pop(); if (!o) return; run(o, true); undone.push(o); dirty = true; selPick(null); sync() }
  function redo() { const o = undone.pop(); if (!o) return; run(o, false); ops.push(o); dirty = true; sync() }
  /* props edited before this page opened (a loaded BG Asset) are the first entries of the history */
  if (B.current?.ops) for (const o of B.current.ops) ops.push(o);

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
  /* ---------- BG Asset: save (draft in this browser + thumbnail), library, push ---------- */
  const slug = s => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  let curId = Q.get('bg') || '', curMeta = B.current ? { name: B.current.name, tags: B.current.tags, asked: 1 } : { name: '', tags: { kind: 'random', difficulty: 1, useInGame: false } };
  function thumb() {   // a small picture of the real field as it looks right now (webp data URL)
    try { const c = document.createElement('canvas'), w = 384, h = Math.round(w * cvs.height / cvs.width); c.width = w; c.height = h; c.getContext('2d').drawImage(cvs, 0, 0, w, h); return c.toDataURL('image/webp', .8) } catch (e) { return null }
  }
  function build() {
    return { format: 'bg-asset', v: 1, id: curId, name: curMeta.name, biome: FIELD.biome, r: +(Q.get('r') || 7), seed: +Q.get('seed'), poi: Q.get('poi') || '', night: FIELD.night ? 1 : 0, tags: curMeta.tags,
      gen: window.__bgGen, ops: ops.filter(o => o.t !== 'unit'), spawns: B.spawnsNow(), thumb: 'data/battlefields/' + curId + '.webp', savedAt: new Date().toISOString() };
  }
  function ask() {
    const name = prompt('ชื่อ BG Asset นี้ (ภาษาไทยได้)', curMeta.name || ''); if (!name) return false;
    let id = curId || slug(name) || ('bg-' + Q.get('seed')); id = prompt('รหัสไฟล์ (a-z 0-9 -) → data/battlefields/' + id + '.json', id); if (!id) return false;
    curId = slug(id); curMeta.name = name; if (!curMeta.asked) { curMeta.asked = 1; curMeta.tags.useInGame = confirm('ให้เกมสุ่มเลือกสนามนี้เอง (ในไบโอม ' + FIELD.biome + ') ตอนมีการต่อสู้ไหม?\n\nตกลง = ใช้ในเกม (ต้องส่งขึ้นเกมก่อน)\nยกเลิก = เก็บไว้ก่อน') } return !!curId;
  }
  function save() {
    if (!curId && !ask()) return; const a = build(); a.thumbData = thumb();
    if (!B.saveDraft(a)) return note('บันทึกไม่ได้ (พื้นที่เบราว์เซอร์เต็ม?)');
    dirty = false; const q = new URLSearchParams(location.search); q.set('bg', curId); history.replaceState(null, '', '?' + q.toString()); sync(); note('บันทึก BG Asset "' + curMeta.name + '" (' + curId + ') ในเบราว์เซอร์นี้แล้ว · กด ⬆ เพื่อส่งขึ้นเกม');
  }
  async function push() {
    const P = parent.GitHubPush; if (!P) return note('หน้านี้ไม่ได้อยู่ใน editor — เปิดผ่านแท็บ ⚔ สนามต่อสู้');
    if (dirty || !curId) save(); if (!curId) return; const a = build(), td = thumb(), meta = { id: curId, name: curMeta.name, biome: a.biome, tags: a.tags, thumb: a.thumb, seed: a.seed };
    if (!P.config().token) return P.openSettings(() => push());
    try {
      const blob = td ? await (await fetch(td)).blob() : null;
      const sha = await P.commit('BG Asset: ' + curMeta.name + ' (' + curId + ')', async head => {
        let idx = { format: 'bg-asset-index', v: 1, assets: [] }; try { const x = JSON.parse(await head.read('data/battlefields/index.json') || 'null'); if (x && Array.isArray(x.assets)) idx = x } catch (e) { }
        idx.assets = idx.assets.filter(x => x.id !== curId).concat([meta]).sort((p, q) => p.id < q.id ? -1 : 1);
        const files = [{ path: 'data/battlefields/' + curId + '.json', content: JSON.stringify(a, null, 1) + '\n' }, { path: 'data/battlefields/index.json', content: JSON.stringify(idx, null, 1) + '\n' }];
        if (blob) files.push({ path: 'data/battlefields/' + curId + '.webp', content: blob }); return files;
      }, m => note(m));
      note(sha ? 'ส่งขึ้น GitHub แล้ว · ' + sha : 'ไม่มีอะไรเปลี่ยน');
    } catch (e) { note('push ไม่สำเร็จ: ' + e.message) }
  }
  function openAsset(id) { const q = new URLSearchParams(location.search); if (id) q.set('bg', id); else { q.delete('bg'); q.set('seed', String(100000 + Math.floor(Math.random() * 900000))) } if (dirty && !confirm('มีการแก้ที่ยังไม่บันทึก ทิ้งแล้วเปิดอันอื่น?')) return; location.search = q.toString() }
  function reset() { if (!ops.length || !confirm('ล้างการแก้ทั้งหมดของสนามนี้ (' + ops.length + ' รายการ)?')) return; while (ops.length) run(ops.pop(), true); undone.length = 0; selPick(null); dirty = true; sync() }
  const load = () => 0;
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
<select id="feAdd" title="เลือกของ แล้วคลิกช่องบนสนาม"><option value="">＋ เพิ่มของ…</option></select><span class="sep"></span><button id="feUndo" title="Ctrl+Z">↶</button><button id="feRedo" title="Ctrl+Y">↷</button><button id="feSave" title="Ctrl+S">💾 บันทึก BG</button><button id="fePush" title="ส่งไฟล์ BG Asset + ภาพย่อ ขึ้น GitHub">⬆ ส่งขึ้นเกม</button><span class="sep"></span><select id="feLib" title="คลัง BG Asset"><option value="">📂 คลัง BG Asset…</option><option value="__new">＋ สนามใหม่ (สุ่ม)</option></select><button id="feReset">ล้างการแก้</button>`;
  document.body.appendChild(panel);
  const hint = document.createElement('div'); hint.id = 'feHint'; document.body.appendChild(hint);
  const $ = id => document.getElementById(id);
  for (const [k, big] of PROP_KINDS()) { const o = document.createElement('option'); o.value = k + '|' + (big ? 1 : 0); o.textContent = k + (big ? ' (2×2)' : ''); $('feAdd').appendChild(o) }
  $('feAdd').onchange = e => { const [k, b] = e.target.value.split('|'); adding = k ? { kind: k, big: b === '1' } : null; sync() };
  $('feTurn').onclick = turnUnit; $('feDup').onclick = dupProp; $('feDel').onclick = delSel; $('feUndo').onclick = undo; $('feRedo').onclick = redo; $('feSave').onclick = save; $('fePush').onclick = push; $('feReset').onclick = reset;
  { const ix = B.fetchIndex(); for (const a of ix) { const o = document.createElement('option'); o.value = a.id; o.textContent = (a.draft ? '✎ ' : '') + (a.name || a.id) + ' · ' + a.biome; $('feLib').appendChild(o) } $('feLib').value = curId && ix.some(a => a.id === curId) ? curId : ''; $('feLib').onchange = e => { const v = e.target.value; if (v) openAsset(v === '__new' ? '' : v) } }
  let noteT = 0, noteMsg = '';
  function note(m) { noteMsg = m; noteT = performance.now() + 4000; sync() }
  function sync() {
    const u = sel?.unit, p = sel?.prop;
    $('feInfo').textContent = adding ? 'โหมดวาง: ' + adding.kind + ' — คลิกช่องที่ต้องการ (Esc ยกเลิก)' : u ? 'ตัวละคร: ' + (u.name || u.key || u.kind || u.id) + ' · ช่อง ' + u.u + ',' + u.v + ' · ' + u.dir : p ? 'ของ: ' + p.kind + (p.big ? ' (2×2)' : '') + ' · ช่อง ' + p.u + ',' + p.v : 'ยังไม่ได้เลือก — คลิกตัวละครหรือของบนสนาม';
    $('feTurn').disabled = !u; $('feDup').disabled = !p; $('feDel').disabled = !p; $('feUndo').disabled = !ops.length; $('feRedo').disabled = !undone.length; $('feSave').textContent = dirty ? '💾 บันทึก BG ●' : '💾 บันทึก BG';
    hint.textContent = (performance.now() < noteT ? noteMsg + ' · ' : '') + 'ล้อเมาส์ = ซูม · ลากพื้นว่าง = เลื่อน · ลากของ/ตัวละคร = ย้าย · R หมุน · D ทำซ้ำ · Del ลบ · Ctrl+Z ย้อน · Ctrl+S บันทึก';
  }
  /* ---------- overlay drawn inside the world transform (called from field-host frame) ---------- */
  window.FieldEdit = {
    active: true, ops: () => ops.slice(), save, push, build,
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
  if (B.current) setTimeout(() => note('เปิด BG Asset "' + (B.current.name || B.current.id) + '" แล้ว' + (B.drift ? ' · ⚠ ตัวสร้างสนามเปลี่ยนไปตั้งแต่ตอนบันทึก หน้าตาอาจต่างจากเดิม' : '')), 1500);
  sync();
})();
