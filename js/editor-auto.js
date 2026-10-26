/* v91.7 · 🪄 Auto tools for the village editor (the "ออโต้" group in the toolbar):
   ก) roads to every entrance that has no road near it · ข) check the map (overlaps, closed/unreachable entrances, yellow cells)
   ง) copy fence + footprint size from one place to others · จ) snap every sub-asset to the current grid. */
(function () {
  'use strict';
  if (new URLSearchParams(location.search).get('edit') !== '1' || !location.pathname.endsWith('village-town.html')) return;
  const $ = (s, r = document) => r.querySelector(s), esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const UX = () => window.TownUX, places = () => locations.filter(o => o.id !== 'square');
  const nameOf = o => (o.name || o.id);

  /* ---------- ก) roads to entrances ---------- */
  function roadNear(p, max = 5) {              // is a road cell within max cells that can be reached in a straight line?
    let best = null;
    for (const c of roadCells.values()) { const d = Math.hypot(c.u - p.u, c.v - p.v); if (d <= max && (!best || d < best.d)) best = { c, d } }
    return best && (best.d <= 1.5 || clearSegment(p, best.c, blockedFree)) ? best : null
  }
  /* every point where the yellow walk area meets the footprint edge (not only the single gate cell) + the gate itself */
  function edgePts(o) {
    const out = [gate(o)], cells = o.court?.cells;
    if (cells?.length) {
      const fp = VillageFootprint.fpOf(o), a = center(o);
      for (const [iu, iv] of cells) if (iv + 1 >= 2 * fp.v1 || iv <= -2 * fp.v0 || iu <= -2 * fp.u0 || iu + 1 >= 2 * fp.u1) out.push(canonical(o, a.u + (iu + .5) / 2, a.v + (iv + .5) / 2))
    }
    return out
  }
  function paintedNear(p) {
    const P = window.TownPaint; if (!P) return false;
    for (let du = -1.5; du <= 1.5; du += .5) for (let dv = -1.5; dv <= 1.5; dv += .5) { const q = project(p.u + du, p.v + dv); if (P.walk(q.x, q.y) > 0) return true }
    return false
  }
  const connected = o => edgePts(o).some(p => roadNear(p) || paintedNear(p));
  function reachSet() {                       // every half-cell the hero can walk to (same rules as the game)
    const k = (u, v) => u + ',' + v, h = nearestUsing({ u: hero.u, v: hero.v }, blockedFree, 3), seen = new Set(), q = [];
    if (!h) return seen;
    seen.add(k(h.u, h.v)); q.push(h);
    for (let i = 0; i < q.length && i < 250000; i++) {
      const a = q[i];
      for (const [du, dv] of [[.5, 0], [-.5, 0], [0, .5], [0, -.5]]) { const n = { u: a.u + du, v: a.v + dv }, kk = k(n.u, n.v); if (!seen.has(kk) && !blockedFree(n.u, n.v)) { seen.add(kk); q.push(n) } }
    }
    return seen
  }
  const reaches = p => { const m = nearestUsing(p, blockedFree, 3); return !!m && reachSet.cache.has(m.u + ',' + m.v) };
  function lanePath(from, own) {
    const ownFp = own ? (() => { const f = VillageFootprint.fpOf(own), c = center(own); return (u, v) => { const q = canonical(own, u, v), a = q.u - c.u, b = q.v - c.v; return a > -f.u0 - .5 && a < f.u1 + .5 && b > -f.v0 - .5 && b < f.v1 + .5 } })() : () => false;                    // BFS over whole lattice cells to the nearest road cell
    const key = (u, v) => u + ',' + v, s0 = { u: Math.round(from.u), v: Math.round(from.v) }, prev = new Map([[key(s0.u, s0.v), null]]), q = [s0];
    for (let i = 0; i < q.length && i < 30000; i++) {
      const c = q[i];
      if (roadCells.has(cellKey(c.u, c.v)) && (!reachSet.cache || reachSet.cache.has(c.u + ',' + c.v) || reachSet.cache.has((c.u + .5) + ',' + c.v))) { const out = []; for (let n = c; n; n = prev.get(key(n.u, n.v))) out.unshift(n); return out }
      for (const [du, dv] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const n = { u: c.u + du, v: c.v + dv }, k = key(n.u, n.v);
        if (prev.has(k) || (blockedFree(n.u, n.v, true) && !ownFp(n.u, n.v))) continue;
        prev.set(k, c); q.push(n)
      }
    }
    return null
  }
  function autoRoads() {
    reachSet.cache = reachSet();
    const todo = [...places().map(o => ({ name: nameOf(o), p: gate(o), o })), ...exitDoors().map(e => ({ name: e.name, p: e }))].filter(x => x.o ? !(connected(x.o) && reaches(door(x.o))) : !reaches(x.p));
    if (!todo.length) return ['✔ ทุกทางเข้ามีถนนอยู่ใกล้แล้ว'];
    const log = [];
    UX().checkpoint();
    for (const x of todo) {
      const path = lanePath(x.p, x.o);
      if (path && path.length < 2) continue;
      if (!path) { log.push('✖ ' + x.name + ': หาทางต่อถนนไม่ได้ (ถูกล้อมไว้)'); continue }
      UX().addRoad(path.map(c => project(c.u, c.v)), 'lane');
      log.push('＋ ' + x.name + ': ต่อทางย่อย ' + path.length + ' ช่อง')
    }
    UX().persist();
    return log
  }

  /* ---------- ข) check ---------- */
  function check() {
    const FP = VillageFootprint, G = VillageGrid, rows = [], P = places();
    const rects = P.map(o => ({ o, r: FP.worldRect(o, center(o)) }));
    for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i], b = rects[j];
      if (G.overlaps(a.r, b.r)) rows.push({ id: a.o.id, t: '▭ กรอบฟ้า ' + nameOf(a.o) + ' ทับ ' + nameOf(b.o) })
    }
    for (const o of P) {
      const cells = o.court?.cells;
      if (cells?.length) {
        const fp = FP.fpOf(o), touch = cells.some(([iu, iv]) => iv <= -2 * fp.v0 || iv + 1 >= 2 * fp.v1 || iu <= -2 * fp.u0 || iu + 1 >= 2 * fp.u1);
        if (!touch) rows.push({ id: o.id, t: '🟨 ช่องเหลืองของ ' + nameOf(o) + ' ไม่แตะขอบกรอบ (ทางเข้าถูกปิด)' })
      }
      const d = door(o), a = findPath({ u: hero.u, v: hero.v }, d);
      if (!a.length) rows.push({ id: o.id, t: '🚪 เดินไปทางเข้า ' + nameOf(o) + ' ไม่ถึง' });
      if (!connected(o)) rows.push({ id: o.id, t: '🛣 ไม่มีถนนใกล้ทางเข้า ' + nameOf(o) + ' (ใช้ ก) เพื่อต่อให้)' })
    }
    for (const e of exitDoors()) if (!findPath({ u: hero.u, v: hero.v }, e).length) rows.push({ id: null, t: '🚪 ทางออก ' + e.name + ' เดินไปไม่ถึง' });
    return rows
  }

  /* ---------- ง) copy fence + footprint ---------- */
  function copyFence(src, targets, withFp) {
    const FN = VillageFence, cfg = FN.get() || { pieces: {}, places: {} }, s = cfg.places[src];
    UX().checkpoint();
    const sObj = locations.find(o => o.id === src);
    for (const t of targets) {
      if (s) cfg.places[t] = JSON.parse(JSON.stringify(s)); else delete cfg.places[t];
      if (withFp) { const to = locations.find(o => o.id === t); if (to) UX().setFootprint(to, sObj.fp ? { ...sObj.fp } : null) }
    }
    FN.set(cfg); cacheSolids(); terrainDirty = true; UX().refresh(); UX().persist()
  }

  /* ---------- UI ---------- */
  let win = null;
  function open() {
    if (win) { win.style.display = win.style.display === 'none' ? 'block' : 'none'; return }
    const st = document.createElement('style');
    st.textContent = `#auWin{position:fixed;left:14px;top:96px;z-index:30;width:400px;max-height:calc(100dvh - 120px);overflow:auto;background:#172a23f2;color:#eef2dc;border:1px solid #6f8b5b;border-radius:12px;padding:12px 14px;box-shadow:0 10px 40px #0009;font:13px/1.45 system-ui,sans-serif}
#auWin h3{margin:0 0 6px;font-size:15px;color:#fff0c7;display:flex;justify-content:space-between;align-items:center}#auWin button,#auWin select{background:#2c4a3c;color:#eef2dc;border:1px solid #6f8b5b;border-radius:8px;padding:6px 10px;cursor:pointer;font:inherit}
#auWin .tool{border:1px solid #3e5a4a;border-radius:9px;padding:8px;margin:8px 0}#auWin .tool b{display:block;color:#f2d98a}#auWin .tool small{display:block;color:#a9baa0;margin:2px 0 6px}#auWin .row{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
#auLog{white-space:pre-wrap;font-size:12px;color:#d6e2c8;min-height:20px}#auLog div{padding:2px 0;border-bottom:1px dashed #3e5a4a}#auLog button{padding:1px 7px;font-size:11px;margin-left:6px}`;
    document.head.append(st);
    win = document.createElement('div'); win.id = 'auWin';
    const opts = places().map(o => `<option value="${o.id}">${esc(nameOf(o))}</option>`).join('');
    win.innerHTML = `<h3>🪄 เครื่องมืออัตโนมัติ <button id="auX" title="ปิด">✕</button></h3>
<div class="tool"><b>ก) ต่อถนนไปหาทางเข้า</b><small>ทางเข้าสถานที่/ทางออกที่ไม่มีถนนอยู่ใกล้ จะถูกต่อทางย่อยเข้าถนนที่ใกล้ที่สุด (ย้อนกลับด้วย ↶ ได้)</small><button id="auRoad">ต่อถนนให้อัตโนมัติ</button></div>
<div class="tool"><b>ข) ตรวจแผนที่</b><small>กรอบฟ้าทับกัน · ช่องเหลืองไม่แตะขอบ · ทางเข้าเดินไม่ถึง · ไม่มีถนนใกล้ทางเข้า</small><button id="auCheck">ตรวจเลย</button></div>
<div class="tool"><b>ง) คัดลอกรั้ว / ขนาดกรอบ</b><small>เอาชุดรั้ว (4 ด้าน + ประตู) ของสถานที่หนึ่งไปใส่สถานที่อื่น</small>
<div class="row"><select id="auSrc">${opts}</select> → <select id="auDst" multiple size="4" style="min-width:140px">${opts}</select></div>
<label class="row" style="margin-top:6px"><input type="checkbox" id="auFp"> คัดลอกขนาดกรอบฟ้าด้วย</label><button id="auCopy">คัดลอก</button></div>
<div class="tool"><b>🗑 ลบรั้ว</b><small>ลบรั้วทุกด้านของสถานที่ที่เลือก (ใช้ปุ่ม Ctrl/Shift เลือกหลายที่) หรือทั้งแผนที่ · ย้อนกลับด้วย ↶ ได้</small><div class="row"><select id="auFenceDst" multiple size="3" style="min-width:140px">${opts}</select><button id="auFenceDel">ลบรั้วที่เลือก</button><button id="auFenceAll">ลบรั้วทั้งแผนที่</button></div></div>
<div class="tool"><b>จ) snap ของย่อยทั้งหมดเข้ากริด</b><small>จัดของย่อยทุกชิ้นทุกสถานที่ให้ตรงช่องกริดปัจจุบัน (กด Q สลับ 1×1 / 2×2 ก่อน)</small><button id="auSnap">snap ทั้งหมด</button></div>
<b>ผล</b><div id="auLog"></div>`;
    document.body.append(win);
    const log = rows => { $('#auLog', win).innerHTML = rows.map(r => typeof r === 'string' ? `<div>${esc(r)}</div>` : `<div>${esc(r.t)}${r.id ? `<button data-go="${r.id}">เปิดแก้</button>` : ''}</div>`).join('') || '<div>✔ ไม่พบปัญหา</div>'; win.querySelectorAll('[data-go]').forEach(b => b.onclick = () => VillageAssetEdit.enter(b.dataset.go)) };
    $('#auX', win).onclick = () => { win.style.display = 'none' };
    $('#auRoad', win).onclick = () => log(autoRoads());
    $('#auCheck', win).onclick = () => log(check());
    $('#auCopy', win).onclick = () => {
      const src = $('#auSrc', win).value, dst = [...$('#auDst', win).selectedOptions].map(o => o.value).filter(v => v !== src);
      if (!dst.length) return log(['เลือกสถานที่ปลายทางก่อน (กด Ctrl/Shift เพื่อเลือกหลายที่)']);
      copyFence(src, dst, $('#auFp', win).checked); log(['⧉ คัดลอกรั้ว' + ($('#auFp', win).checked ? '+กรอบ' : '') + ' จาก ' + src + ' ไป ' + dst.length + ' สถานที่แล้ว'])
    };
    const wipe = ids => { const FN = VillageFence, c = FN.get() || { pieces: {}, places: {} }; UX().checkpoint(); for (const id of ids) { c.places[id] = { ...(c.places[id] || {}), sides: { back: 'none', left: 'none', right: 'none', front: 'none' } } } FN.set(c); cacheSolids(); terrainDirty = true; UX().refresh(); UX().persist(); log(['🗑 ลบรั้วของ ' + ids.length + ' สถานที่แล้ว']) };
    $('#auFenceDel', win).onclick = () => { const ids = [...$('#auFenceDst', win).selectedOptions].map(o => o.value); ids.length ? wipe(ids) : log(['เลือกสถานที่ก่อน']) };
    $('#auFenceAll', win).onclick = () => { if (confirm('ลบรั้วทุกสถานที่ในแผนที่?')) wipe(places().map(o => o.id)) };
    $('#auSnap', win).onclick = () => {
      const n = VillageAssetEdit.resnapAll(true);
      if (!n) return log(['✔ ของย่อยทุกชิ้นตรงกริดอยู่แล้ว']);
      if (!confirm('จะขยับของย่อย ' + n + ' ชิ้นเข้ากริดปัจจุบัน — ต้องการต่อไหม? (ย้อนกลับด้วย ↶ ได้)')) return;
      VillageAssetEdit.resnapAll(false); log(['🧲 snap แล้ว ' + n + ' ชิ้น'])
    }
  }
  let tries = 0;
  const t = setInterval(() => {
    const add = $('#addAssetBtn');
    if ((!add || !add.closest('#townTools') || !window.VillageAssetEdit) && ++tries < 100) return;
    clearInterval(t);
    if (!add || $('#autoBtn')) return;
    const b = document.createElement('button'); b.id = 'autoBtn'; b.type = 'button'; b.className = add.className; b.textContent = '🪄 ออโต้'; b.title = 'เครื่องมืออัตโนมัติ: ต่อถนน · ตรวจแผนที่ · คัดลอกรั้ว · snap กริด';
    b.onclick = open; add.after(b)
  }, 150);
  window.EditorAuto = { autoRoads, check, copyFence };
})();
