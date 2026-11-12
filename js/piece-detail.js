/* v98.408 · Detailed piece editor: independent drag modes for art/order/block,
   Studio-style three-point 2:1 base fit, and a walker using the real depth rule.
   All edits go through the map's existing save/checkpoint bridge. */
(function () {
  'use strict';
  const Z = 1.9, CW = 620, CH = 500, CX = 310, CY = 330, S = 28 * Z, T = 14 * Z;
  let dlg = null, key = null, cv = null, gesture = null, mode = 'walk', points = [], undo = [], walker = { u: 0, v: 1.6 };
  const D = () => window.PlaceBuild?.detail || window.VillageAssetEdit?.detail, DS = () => window.DepthStyle, G = () => window.PieceGeometry;
  const P = (u, v) => ({ x: CX + (u - v) * S, y: CY + (u + v) * T });
  const inv = (x, y) => { const a = (x - CX) / S, b = (y - CY) / T; return { u: (a + b) / 2, v: (b - a) / 2 } };
  const caps = () => D()?.caps || {}, el = id => dlg.querySelector('#' + id), copy = o => JSON.parse(JSON.stringify(o));
  const limit = (v, n = 12) => Math.max(-n, Math.min(n, v)), round = v => Math.round(v * 100) / 100;
  function edit(fn, checkpoint = true) {
    if (checkpoint) { undo.push(copy(D().ov(key))); if (undo.length > 60) undo.shift() }
    D().edit(key, fn, checkpoint); paint(); readouts();
  }
  function poly(q, b, fill, line) {
    const pts = [[b.u0, b.v0], [b.u1, b.v0], [b.u1, b.v1], [b.u0, b.v1]].map(([u, v]) => P(u, v));
    q.beginPath(); pts.forEach((p, i) => q[i ? 'lineTo' : 'moveTo'](p.x, p.y)); q.closePath(); q.fillStyle = fill; q.fill(); q.strokeStyle = line; q.lineWidth = 2; q.stroke();
  }
  function drawWalker(q, ghost, shadow = true) {
    const p = P(walker.u, walker.v); q.save(); q.globalAlpha = ghost ? .7 : 1;
    if (shadow) { q.fillStyle = '#0006'; q.beginPath(); q.ellipse(p.x, p.y, 17, 7, 0, 0, 7); q.fill() }
    q.fillStyle = ghost ? '#fff' : '#3c6fb0'; q.strokeStyle = ghost ? '#fff' : '#142840'; q.lineWidth = 2;
    q.beginPath(); q.roundRect(p.x - 11, p.y - 60, 22, 52, 9); q.fill(); if (!ghost) q.stroke();
    q.fillStyle = ghost ? '#fff' : '#f0c9a0'; q.beginPath(); q.arc(p.x, p.y - 68, 9, 0, 7); q.fill(); if (!ghost) q.stroke(); q.restore();
  }
  function drawPiece(q, E, ov, alpha = 1) { q.save(); q.globalAlpha = alpha; q.translate(CX, CY); q.scale(Z, Z); D().drawTo(q, E, ov); q.restore() }
  function overlaps(E, ov) {
    const c = document.createElement('canvas'); c.width = CW; c.height = CH; const q = c.getContext('2d', { willReadFrequently: true });
    try { const actor = document.createElement('canvas'); actor.width = CW; actor.height = CH; drawWalker(actor.getContext('2d'), false, false); drawPiece(q, E, ov); q.globalCompositeOperation = 'destination-in'; q.drawImage(actor, 0, 0); const d = q.getImageData(0, 0, CW, CH).data; for (let i = 3; i < d.length; i += 4) if (d[i] > 100) return true; return false } catch (_) { return true }
  }
  const hints = {
    walk: 'ลากบนภาพเพื่อย้ายคนทดสอบหน้า/หลัง (ย้ายเข้ากรอบแดงได้เพื่อทดสอบ)',
    art: 'ลากบนภาพเพื่อเลื่อนเฉพาะภาพ Asset เทียบกับฐาน · กรอบทั้งสองอยู่ที่เดิม',
    order: 'ลากเพื่อย้ายกรอบฟ้า · วางให้ครอบฐานที่แตะพื้น ใช้ตัดสินหน้า/หลัง',
    block: 'ลากเพื่อย้ายกรอบแดง · วางเฉพาะส่วนที่ไม่ให้คนเดินทะลุ',
    fit: 'จิ้ม ① ซ้าย ② มุมหน้าสุด ③ ขวา ของฐานเดียวกัน · ลากจุดเพื่อแก้ · คลิกจุดเดิมเพื่อลบ'
  };
  function paint() {
    const E = D().item(key); if (!E || !cv) return;
    const ov = D().ov(key), q = cv.getContext('2d'), b = G().footprint(ov), block = G().footprint(ov, 0, 0, true), ds = DS();
    q.clearRect(0, 0, CW, CH); q.fillStyle = '#26382d'; q.fillRect(0, 0, CW, CH); q.strokeStyle = '#ffffff1f'; q.lineWidth = 1;
    for (let i = -6; i <= 6; i++) { let a = P(i, -6), c = P(i, 6); q.beginPath(); q.moveTo(a.x, a.y); q.lineTo(c.x, c.y); q.stroke(); a = P(-6, i); c = P(6, i); q.beginPath(); q.moveTo(a.x, a.y); q.lineTo(c.x, c.y); q.stroke() }
    if (ov.block) poly(q, block, '#e0504040', '#e05040'); poly(q, b, '#3c82ff2e', '#3c82ff');
    const front = ds.walkerInFront(b, walker.u, walker.v), low = ds.isLow({ label: E.label, tall: ov.tall }), set = ds.get(), hit = !front && overlaps(E, ov);
    const style = ds.styleFor({ label: E.label, tall: ov.tall });
    if (front) { drawPiece(q, E, ov); drawWalker(q, false) }
    else { drawWalker(q, false); drawPiece(q, E, ov, hit && (style === 'both' || style === 'fade') ? set.alpha : 1); if (hit && (style === 'both' || style === 'silhouette')) drawWalker(q, true) }
    // Selected frame remains visible over the artwork while it is being positioned.
    if (mode === 'order') poly(q, b, '#3c82ff18', '#83b5ff'); if (mode === 'block' && ov.block) poly(q, block, '#e0504018', '#ff9a8b');
    q.fillStyle = '#ffe9a8'; q.beginPath(); q.arc(CX, CY, 4, 0, 7); q.fill();
    if (mode === 'fit') drawPoints(q);
    q.font = '12px AgThai,system-ui,sans-serif'; q.fillStyle = '#f7e8c5'; q.fillText('● จุดยึดชิ้นงาน · ' + ({ walk: 'ลากคนทดสอบ', art: 'ลากภาพ Asset', order: 'ลากกรอบฟ้า', block: 'ลากกรอบแดง', fit: 'วัดฐาน 3 จุด' }[mode]), 10, CH - 10);
    const inside = ov.block && walker.u > block.u0 && walker.u < block.u1 && walker.v > block.v0 && walker.v < block.v1;
    el('pdState').innerHTML = `คนอยู่ <b>${front ? 'หน้า' : 'หลัง'}</b>ชิ้นนี้${hit ? ' · ภาพซ้อนกัน' : ' · ไม่ได้โดนชิ้นนี้บัง'} · ชิ้นนี้นับเป็น <b>${low ? 'เตี้ย' : 'สูง'}</b>${ov.tall ? ' (ตั้งเอง)' : ' (จากชื่อ)'}${inside ? '<br>🟥 เท้าคนอยู่ในกรอบห้ามเดิน (ในเกมจะเดินเข้าตรงนี้ไม่ได้)' : ''}`;
    if (el('pdDragHint')) el('pdDragHint').textContent = hints[mode]; fitReadouts();
  }
  function drawPoints(q) {
    const E = G().edges(points); q.save(); q.lineWidth = 2;
    if (E) { q.strokeStyle = '#ff7181'; q.beginPath(); q.moveTo(E.L.x, E.L.y); q.lineTo(E.M.x, E.M.y); q.lineTo(E.R.x, E.R.y); q.stroke(); q.setLineDash([8, 6]); q.strokeStyle = '#79e7a2'; q.beginPath(); q.moveTo(E.M.x - 260, E.M.y - 130); q.lineTo(E.M.x, E.M.y); q.lineTo(E.M.x + 260, E.M.y - 130); q.stroke(); q.setLineDash([]) }
    points.forEach((p, i) => { q.fillStyle = '#fff'; q.strokeStyle = '#e04763'; q.beginPath(); q.arc(p.x, p.y, 7, 0, 7); q.fill(); q.stroke(); q.fillStyle = '#fff'; q.font = 'bold 15px sans-serif'; q.fillText(String(i + 1), p.x + 10, p.y - 10) }); q.restore();
  }
  function fitReadouts() {
    if (!el('pdFitMsg')) return; const E = G().edges(points);
    el('pdFitMsg').textContent = E ? `ซ้าย ${E.a1.toFixed(1)}° · ขวา ${E.a2.toFixed(1)}° → เป้า 26.57° ทั้งสองด้าน${E.ok ? '' : ' · จุดฐานไม่ถูกต้อง ลองวัดใหม่'}` : (points.length < 3 ? ['① คลิกมุมซ้ายของฐาน', '② คลิกมุมหน้าสุดของฐาน', '③ คลิกมุมขวาของฐาน'][points.length] : 'จุดชิดกันเกินไป ลองวัดใหม่');
    dlg.querySelectorAll('[data-fit]').forEach(b => b.disabled = !E?.ok);
  }
  function readouts() {
    if (!dlg) return; const o = D().ov(key);
    for (const f of ['sw', 'sh', 'fw', 'fh']) { const e = el('pd_' + f + 'V'); if (e) e.textContent = f === 'sw' ? (o.sw ?? o.fw ?? .5) : f === 'sh' ? (o.sh ?? o.fh ?? .5) : (o[f] ?? .5) }
    el('pdUndo').disabled = !undo.length;
    el('pdOffsets').textContent = `ภาพ X ${round(o.artX || 0)} / Y ${round(o.artY || 0)} · ฟ้า ${round(o.orderU || 0)}, ${round(o.orderV || 0)} · แดง ${round(o.blockU || 0)}, ${round(o.blockV || 0)}`;
  }
  function html(E, ov) {
    const row = (id, label, v, mn, mx, st, fmt) => `<label class="pdr"><span>${label}</span><input type="range" id="${id}" min="${mn}" max="${mx}" step="${st}" value="${v}"><b id="${id}V">${fmt(v)}</b></label>`;
    const step = (f, label, cur) => `<div class="pdr"><span>${label} <b id="pd_${f}V">${cur}</b></span><span><button data-st="${f},-0.5">−</button><button data-st="${f},0.5">+</button></span></div>`;
    return `<div class="pdhead"><b>🔍 ${E.label || 'ชิ้นส่วน'}</b><div><button id="pdUndo">↶ ย้อน</button> <button id="pdClose">✓ ปิด</button></div></div>
<div class="pdbody"><div class="pdview"><div class="pdtools">${[['walk', '👤 ทดสอบคน'], ['art', '✋ ย้ายภาพ'], ['order', '🟦 ย้ายกรอบฟ้า'], ...(caps().block === false ? [] : [['block', '🟥 ย้ายกรอบแดง']]), ['fit', '📐 ฐาน 3 จุด']].map(([k, n]) => `<button data-mode="${k}" aria-pressed="${mode === k}">${n}</button>`).join('')}</div><p id="pdDragHint" class="pdhint"></p><canvas id="pdCv" width="${CW}" height="${CH}"></canvas><small id="pdOffsets"></small></div><div class="pdside">
<details class="pdhelp" open><summary>วิธีตั้งให้บังตัวละครถูก</summary><ol><li>เลือก “ย้ายภาพ” จัดภาพเทียบฐาน</li><li>เลือก “ย้ายกรอบฟ้า” วางครอบฐานที่แตะพื้น แล้วปรับกว้าง/ลึก</li><li>กรอบแดง = ส่วนที่ห้ามเดิน วางและปรับแยกจากกรอบฟ้าได้</li><li>เลือก “ทดสอบคน” ลากคนไปหลังพนัก/หน้าขา ดูว่าใครบังใคร</li></ol><small>กรอบฟ้าตัดสินหน้า/หลัง · สูง/เตี้ยกำหนดวิธีแสดงเมื่อถูกบัง<br>ปิดแล้วกด ✓ เสร็จที่แผงเดิม · ⬆ Push เพื่อใช้ทุกเครื่อง</small></details>
<h4>รูปร่าง</h4>${row('pdS', 'ขนาด', Math.round((ov.s ?? 1) * 100), 30, 250, 1, v => v + '%')}${caps().rot === false ? '' : row('pdR', 'หมุน', ov.r || 0, -180, 180, 1, v => v + '°')}${caps().slant === false ? '' : row('pdIx', 'เฉียง ↗↙', Math.round((ov.ix ?? 1) * 100), 50, 200, 1, v => v + '%') + row('pdIy', 'เฉียง ↖↘', Math.round((ov.iy ?? 1) * 100), 50, 200, 1, v => v + '%')}
<label class="pdc"><input type="checkbox" id="pdF" ${ov.f ? 'checked' : ''}> กลับด้านซ้าย-ขวา</label><button id="pdArtReset">คืนตำแหน่งภาพ</button>
<section id="pdFitPanel" ${mode === 'fit' ? '' : 'hidden'}><h4>📐 ปรับมุมฐานแบบ Studio</h4><p class="pdhint">เลือกมุมฐานเดียวกัน ซ้าย → หน้าสุด → ขวา ไม่เลือกยอดพนักหรือจุดต่างระดับ</p><p id="pdFitMsg"></p><div class="pdtools"><button data-fit="balanced">ปรับ 2:1 (สมดุล)</button><button data-fit="height">รักษาความสูง</button><button data-fit="width">รักษาความกว้าง</button><button id="pdFitClear">วัดใหม่</button><button id="pdFitReset">คืนค่ามุมฐาน</button></div></section>
<h4>กรอบพื้น</h4>${step('sw', '🟦 เรียงลำดับ กว้าง', ov.sw ?? ov.fw ?? .5)}${step('sh', '🟦 เรียงลำดับ ลึก', ov.sh ?? ov.fh ?? .5)}<button id="pdOrderReset">คืนตำแหน่งกรอบฟ้า</button> <button id="pdSzReset">ฟ้า = กรอบแดง</button>
${caps().block === false ? '' : `<label class="pdc"><input type="checkbox" id="pdB" ${ov.block ? 'checked' : ''}> 🟥 บล็อกเดิน</label>${step('fw', '🟥 บล็อก กว้าง', ov.fw ?? .5)}${step('fh', '🟥 บล็อก ลึก', ov.fh ?? .5)}<button id="pdBlockReset">คืนตำแหน่งกรอบแดง</button>`}${caps().note ? `<p class="pdst">${caps().note}</p>` : ''}
<h4>การบัง</h4><label class="pdc">ความสูง <select id="pdT"><option value="">อัตโนมัติ (จากชื่อ)</option><option value="tall"${ov.tall === 'tall' ? ' selected' : ''}>สูง</option><option value="low"${ov.tall === 'low' ? ' selected' : ''}>เตี้ย</option></select></label><p id="pdState" class="pdst"></p></div></div>`;
  }
  function css() {
    if (document.getElementById('pdCss')) return; const s = document.createElement('style'); s.id = 'pdCss';
    s.textContent = `#pieceDetail{width:min(1020px,96vw);box-sizing:border-box;border:1px solid #a5b68a;border-radius:14px;background:#1b2a23;color:#f1e6c4;padding:0;font:13px AgThai,system-ui,sans-serif;max-width:96vw;max-height:94vh;overflow:auto}#pieceDetail::backdrop{background:#0008}#pieceDetail [hidden]{display:none!important}.pdhead{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid #4d6656}.pdbody{display:flex;align-items:flex-start;gap:14px;padding:12px 14px;flex-wrap:wrap}.pdview{width:620px;max-width:100%;flex:1 1 480px;position:sticky;top:0}#pdCv{width:100%!important;height:auto!important;aspect-ratio:620/500;display:block;border-radius:10px;border:1px solid #4d6656;box-sizing:border-box;touch-action:none;cursor:grab}.pdside{width:280px;flex:1 1 260px}.pdhead b{font-size:15px}#pieceDetail button{width:auto!important}#pieceDetail input[type=range]{width:100%}#pieceDetail label{display:grid}#pieceDetail label.pdc{display:flex}.pdside h4{margin:12px 0 4px;color:#f4dc9f;font-size:13px}.pdr{display:grid;grid-template-columns:78px 1fr 48px;gap:6px;align-items:center;margin:5px 0}.pdr:has(button){grid-template-columns:1fr auto}.pdc{display:flex;gap:6px;align-items:center;margin:6px 0}#pieceDetail button{background:#2c4437;color:#f1e6c4;border:1px solid #6f8b5b;border-radius:7px;padding:5px 8px;cursor:pointer}#pieceDetail button:disabled{opacity:.45;cursor:default}#pieceDetail button[aria-pressed=true]{background:#e6c77e;color:#221b0d;border-color:#ffe1a2}.pdst,.pdhelp,#pdFitPanel{margin:10px 0 0;padding:8px;background:#0003;border-radius:8px;line-height:1.5}.pdhelp ol{padding-left:22px;margin:6px 0}.pdtools{display:flex;gap:5px;flex-wrap:wrap}.pdhint{font-size:12px;line-height:1.5;margin:6px 0;min-height:36px}#pdOffsets{display:block;opacity:.8;margin-top:5px}@media(max-width:760px){.pdview{position:static}}`;
    document.head.append(s);
  }
  function open(k) {
    const d = D(); if (!d || !G() || !DS()) return; const E = d.item(k); if (!E) return;
    key = k; css(); walker = { u: 0, v: 1.6 }; points = []; undo = []; mode = 'walk'; gesture = null;
    if (!dlg) { dlg = document.createElement('dialog'); dlg.id = 'pieceDetail'; document.body.append(dlg) }
    build(); if (!dlg.open) dlg.showModal();
  }
  function setMode(m) {
    gesture = null; mode = m; if (m === 'block' && !D().ov(key).block) { edit(o => { o.block = true }); if (el('pdB')) el('pdB').checked = true }
    dlg.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === m)); el('pdFitPanel').hidden = m !== 'fit'; cv.style.cursor = m === 'fit' ? 'crosshair' : 'grab'; paint();
  }
  function build() {
    const E = D().item(key), ov = D().ov(key); dlg.innerHTML = html(E, ov); cv = el('pdCv');
    const rng = (id, fn, fmt) => { const e = el(id); if (!e) return; let checkpoint = true; e.onpointerdown = () => { checkpoint = true }; e.onkeydown = () => { checkpoint = true }; e.oninput = () => { points = []; el(id + 'V').textContent = fmt(+e.value); edit(o => fn(o, +e.value), checkpoint); checkpoint = false } };
    rng('pdS', (o, v) => { o.s = v / 100 }, v => v + '%'); rng('pdR', (o, v) => { o.r = v }, v => v + '°'); rng('pdIx', (o, v) => { o.ix = v / 100 }, v => v + '%'); rng('pdIy', (o, v) => { o.iy = v / 100 }, v => v + '%');
    el('pdF').onchange = e => { points = []; edit(o => { o.f = e.target.checked }) };
    if (el('pdB')) el('pdB').onchange = e => edit(o => { o.block = e.target.checked });
    el('pdT').onchange = e => edit(o => { o.tall = e.target.value });
    dlg.querySelectorAll('[data-st]').forEach(b => b.onclick = () => { const [f, d] = b.dataset.st.split(','); edit(o => { const base = f === 'sw' ? (o.sw ?? o.fw ?? .5) : f === 'sh' ? (o.sh ?? o.fh ?? .5) : (o[f] ?? .5); o[f] = Math.max(.5, Math.min(12, base + +d)) }) });
    el('pdSzReset').onclick = () => { edit(o => { o.sw = o.fw ?? .5; o.sh = o.fh ?? .5; o.orderU = o.blockU || 0; o.orderV = o.blockV || 0 }); build() };
    el('pdArtReset').onclick = () => { points = []; edit(o => { delete o.artX; delete o.artY }) };
    el('pdOrderReset').onclick = () => edit(o => { delete o.orderU; delete o.orderV });
    if (el('pdBlockReset')) el('pdBlockReset').onclick = () => edit(o => { delete o.blockU; delete o.blockV });
    el('pdUndo').onclick = () => { const prev = undo.pop(); if (!prev) return; D().edit(key, o => { Object.keys(o).forEach(k => delete o[k]); Object.assign(o, prev) }, true); points = []; build() };
    el('pdClose').onclick = () => dlg.close(); dlg.onclose = () => { gesture = null };
    dlg.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => setMode(b.dataset.mode));
    el('pdFitClear').onclick = () => { points = []; paint() }; el('pdFitReset').onclick = () => { points = []; edit(o => { delete o.pm }) };
    dlg.querySelectorAll('[data-fit]').forEach(b => b.onclick = () => { const result = G().fit(points, b.dataset.fit, G().matrix(D().ov(key))); if (!result) return; points = []; edit(o => { o.pm = result.matrix }); setMode('walk') });
    const at = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * CW / r.width, y: (e.clientY - r.top) * CH / r.height } };
    const moveWalker = p => { const w = inv(p.x, p.y); walker = { u: limit(w.u, 5.5), v: limit(w.v, 5.5) }; paint() };
    cv.onpointerdown = e => {
      if (e.button !== 0) return; e.preventDefault(); const p = at(e); cv.setPointerCapture(e.pointerId);
      if (mode === 'fit') { const i = points.findIndex(q => Math.hypot(q.x - p.x, q.y - p.y) <= 12); if (i >= 0) gesture = { kind: 'point', i, start: p, moved: false }; else if (points.length < 3) { points.push(p); paint() } return }
      gesture = { kind: mode, start: p, before: copy(D().ov(key)), moved: false }; if (mode === 'walk') moveWalker(p);
    };
    cv.onpointermove = e => {
      if (!gesture) return; const p = at(e), d = gesture, dx = p.x - d.start.x, dy = p.y - d.start.y;
      if (d.kind === 'walk') { moveWalker(p); return } if (!d.moved && Math.hypot(dx, dy) < 4) return;
      if (d.kind === 'point') { d.moved = true; points[d.i] = p; paint(); return }
      const first = !d.moved; d.moved = true; const a = inv(d.start.x, d.start.y), b = inv(p.x, p.y), before = d.before; points = [];
      edit(o => {
        if (d.kind === 'art') { o.artX = round(limit((before.artX || 0) + dx / Z, 600)); o.artY = round(limit((before.artY || 0) + dy / Z, 600)) }
        else { const prefix = d.kind === 'order' ? 'order' : 'block'; o[prefix + 'U'] = round(limit((before[prefix + 'U'] || 0) + b.u - a.u)); o[prefix + 'V'] = round(limit((before[prefix + 'V'] || 0) + b.v - a.v)); if (d.kind === 'order') { o.sw = before.sw ?? before.fw ?? .5; o.sh = before.sh ?? before.fh ?? .5 } }
      }, first);
    };
    const finish = (e, cancelled) => { const d = gesture; gesture = null; if (!cancelled && d?.kind === 'point' && !d.moved) { points.splice(d.i, 1); paint() } if (cv.hasPointerCapture(e.pointerId)) cv.releasePointerCapture(e.pointerId) };
    cv.onpointerup = e => finish(e, false); cv.onpointercancel = e => finish(e, true); cv.onlostpointercapture = () => { gesture = null };
    paint(); readouts();
  }
  window.PieceDetail = { open };
})();
