/* v98.291 · 🔍 Detailed window for ONE piece of a place (village editor) — a small cut of the asset studio inside the map editor.
   Opened with "🔍 แก้ละเอียด…" in the piece panel. The piece is shown big on an iso grid, with
     · the ORDER footprint (blue) and the WALK-BLOCK footprint (red, only when ▦ is on)
     · a walker you drag around it: the window says whether the walker is IN FRONT of / BEHIND the piece by the real rule (DepthStyle.walkerInFront) and draws him in that order,
       and a tall piece in front of him turns see-through (DepthStyle alpha) exactly like in the game
   Every control writes the same edit data as the side panel (live on the map, undo works); the window only adds room and the walker test.
   API: PieceDetail.open(key)   ·   needs VillageAssetEdit.detail (js/village-asset-edit.js) */
(function () {
  'use strict';
  const Z = 1.9, CW = 620, CH = 500, CX = 310, CY = 330, S = 28 * Z, T = 14 * Z;
  let dlg = null, key = null, walker = { u: 0, v: 1.6 }, cv = null, drag = false;
  const D = () => window.VillageAssetEdit?.detail, DS = () => window.DepthStyle;
  const P = (u, v) => ({ x: CX + (u - v) * S, y: CY + (u + v) * T });
  const inv = (x, y) => { const a = (x - CX) / S, b = (y - CY) / T; return { u: (a + b) / 2, v: (b - a) / 2 } };

  function boxes(ov) {
    const sw = ov.sw ?? ov.fw ?? .5, sh = ov.sh ?? ov.fh ?? .5;
    return { order: { u0: -sw / 2, u1: sw / 2, v0: -sh / 2, v1: sh / 2 }, block: { u0: -(ov.fw ?? .5) / 2, u1: (ov.fw ?? .5) / 2, v0: -(ov.fh ?? .5) / 2, v1: (ov.fh ?? .5) / 2 } };
  }
  function poly(q, b, fill, line) {
    const pts = [[b.u0, b.v0], [b.u1, b.v0], [b.u1, b.v1], [b.u0, b.v1]].map(([u, v]) => P(u, v));
    q.beginPath(); pts.forEach((p, i) => i ? q.lineTo(p.x, p.y) : q.moveTo(p.x, p.y)); q.closePath();
    q.fillStyle = fill; q.fill(); q.strokeStyle = line; q.lineWidth = 2; q.stroke();
  }
  function drawWalker(q, ghost) {
    const p = P(walker.u, walker.v);
    q.save(); q.globalAlpha = ghost ? .7 : 1;
    q.fillStyle = '#0006'; q.beginPath(); q.ellipse(p.x, p.y, 17, 7, 0, 0, 7); q.fill();
    q.fillStyle = ghost ? '#fff' : '#3c6fb0'; q.strokeStyle = ghost ? '#fff' : '#142840'; q.lineWidth = 2;
    q.beginPath(); q.roundRect(p.x - 11, p.y - 60, 22, 52, 9); q.fill(); if (!ghost) q.stroke();
    q.fillStyle = ghost ? '#fff' : '#f0c9a0'; q.beginPath(); q.arc(p.x, p.y - 68, 9, 0, 7); q.fill(); if (!ghost) q.stroke();
    q.restore();
  }
  function drawPiece(q, E, ov, alpha) {
    q.save(); q.globalAlpha = alpha; q.translate(CX, CY); q.scale(Z, Z); D().drawTo(q, E, ov); q.restore();
  }
  function paint() {
    const E = D().item(key); if (!E || !cv) return; const ov = D().ov(key), q = cv.getContext('2d'), b = boxes(ov), ds = DS();
    q.clearRect(0, 0, CW, CH); q.fillStyle = '#26382d'; q.fillRect(0, 0, CW, CH);
    q.strokeStyle = '#ffffff1f'; q.lineWidth = 1;
    for (let i = -6; i <= 6; i++) { let a = P(i, -6), c = P(i, 6); q.beginPath(); q.moveTo(a.x, a.y); q.lineTo(c.x, c.y); q.stroke(); a = P(-6, i); c = P(6, i); q.beginPath(); q.moveTo(a.x, a.y); q.lineTo(c.x, c.y); q.stroke() }
    if (ov.block) poly(q, b.block, '#e0504040', '#e05040');
    poly(q, b.order, '#3c82ff2e', '#3c82ff');
    const front = ds.walkerInFront(b.order, walker.u, walker.v), low = ds.isLow({ label: E.label, tall: ov.tall }), set = ds.get();
    if (front) { drawPiece(q, E, ov, 1); drawWalker(q, false) }                   /* the walker is nearer: he is drawn after the piece */
    else if (low) { drawWalker(q, false); drawPiece(q, E, ov, 1) }                /* low piece behind-covering: solid, may cover his feet */
    else { drawWalker(q, false); drawPiece(q, E, ov, set.tall === 'solid' ? 1 : set.alpha); if (set.tall === 'both' || set.tall === 'silhouette') drawWalker(q, true) }
    q.fillStyle = '#ffe9a8'; q.beginPath(); q.arc(CX, CY, 4, 0, 7); q.fill();                 /* the anchor (centre of the footprint) */
    q.font = '12px AgThai,system-ui,sans-serif'; q.fillStyle = '#f7e8c5';
    q.fillText('● จุดยึด · ลากตัวละครเพื่อทดสอบ', 10, CH - 10);
    const st = dlg.querySelector('#pdState'); if (st) st.innerHTML = `ตัวละครอยู่ <b>${front ? 'หน้า' : 'หลัง'}</b>ชิ้นนี้ → ${front ? 'ตัวละครถูกวาดทับชิ้น' : (low ? 'ชิ้นเตี้ย: บังเท้าตามจริง' : 'ชิ้นสูง: ' + ({ both: 'โปร่ง + เงาตัวละคร', fade: 'โปร่ง', silhouette: 'เงาตัวละคร', solid: 'ทึบ' }[set.tall]))} · ชิ้นนี้นับเป็น <b>${low ? 'เตี้ย' : 'สูง'}</b>${ov.tall ? ' (ตั้งเอง)' : ' (เดาจากชื่อ)'}`;
  }
  const pct = v => Math.round(v * 100);
  function html(E, ov) {
    const row = (id, label, v, mn, mx, st, fmt) => `<label class="pdr"><span>${label}</span><input type="range" id="${id}" min="${mn}" max="${mx}" step="${st}" value="${v}"><b id="${id}V">${fmt(v)}</b></label>`;
    const step = (f, label, cur) => `<div class="pdr"><span>${label} <b id="pd_${f}V">${cur}</b></span><span><button data-st="${f},-0.5">−</button><button data-st="${f},0.5">+</button></span></div>`;
    const sw = ov.sw ?? ov.fw ?? .5, sh = ov.sh ?? ov.fh ?? .5;
    return `<div class="pdhead"><b>🔍 ${E.label || 'ชิ้นส่วน'}</b><button id="pdClose">✕ ปิด</button></div>
<div class="pdbody"><canvas id="pdCv" width="${CW}" height="${CH}"></canvas><div class="pdside">
<h4>รูปร่าง</h4>${row('pdS', 'ขนาด', pct(ov.s ?? 1), 30, 250, 1, v => v + '%')}${row('pdR', 'หมุน', ov.r || 0, -180, 180, 1, v => v + '°')}${row('pdIx', 'เฉียง ↗↙', pct(ov.ix ?? 1), 50, 200, 1, v => v + '%')}${row('pdIy', 'เฉียง ↖↘', pct(ov.iy ?? 1), 50, 200, 1, v => v + '%')}
<label class="pdc"><input type="checkbox" id="pdF" ${ov.f ? 'checked' : ''}> กลับด้านซ้าย-ขวา</label>
<h4>กรอบพื้น</h4>${step('sw', '🟦 เรียงลำดับ กว้าง', sw)}${step('sh', '🟦 เรียงลำดับ ลึก', sh)}${(ov.sw != null || ov.sh != null) ? '<button id="pdSzReset">= กรอบบล็อกเดิน</button>' : ''}
<label class="pdc"><input type="checkbox" id="pdB" ${ov.block ? 'checked' : ''}> 🟥 บล็อกเดิน (ใช้กรอบด้านล่าง)</label>${step('fw', '🟥 บล็อก กว้าง', ov.fw ?? .5)}${step('fh', '🟥 บล็อก ลึก', ov.fh ?? .5)}
<h4>การบัง</h4><label class="pdc">ความสูง <select id="pdT"><option value="">อัตโนมัติ (จากชื่อ)</option><option value="tall"${ov.tall === 'tall' ? ' selected' : ''}>สูง</option><option value="low"${ov.tall === 'low' ? ' selected' : ''}>เตี้ย</option></select></label>
<p id="pdState" class="pdst"></p></div></div>`;
  }
  function css() {
    if (document.getElementById('pdCss')) return; const s = document.createElement('style'); s.id = 'pdCss';
    s.textContent = `#pieceDetail{width:min(960px,96vw);box-sizing:border-box;border:1px solid #a5b68a;border-radius:14px;background:#1b2a23;color:#f1e6c4;padding:0;font:13px AgThai,system-ui,sans-serif;max-width:96vw}
#pieceDetail::backdrop{background:#0008}.pdhead{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid #4d6656}
.pdbody{display:flex;align-items:flex-start;gap:14px;padding:12px 14px;flex-wrap:wrap}#pdCv{width:620px!important;height:500px!important;flex:none;border-radius:10px;border:1px solid #4d6656;touch-action:none;cursor:grab;max-width:100%}
.pdside{width:270px;flex:1 1 250px}.pdhead b{font-size:15px}#pieceDetail button{width:auto!important}#pieceDetail input[type=range]{width:100%}#pieceDetail label{display:grid}#pieceDetail label.pdc{display:flex}.pdside h4{margin:12px 0 4px;color:#f4dc9f;font-size:13px}.pdr{display:grid;grid-template-columns:78px 1fr 48px;gap:6px;align-items:center;margin:5px 0}
.pdr:has(button){grid-template-columns:1fr auto}.pdc{display:flex;gap:6px;align-items:center;margin:6px 0}.pdside button,#pdClose{background:#2c4437;color:#f1e6c4;border:1px solid #6f8b5b;border-radius:7px;padding:4px 9px;cursor:pointer}
.pdst{margin:10px 0 0;padding:8px;background:#0003;border-radius:8px;line-height:1.5}`;
    document.head.append(s);
  }
  function open(k) {
    const d = D(); if (!d) return; const E = d.item(k); if (!E) return; key = k; css(); walker = { u: 0, v: 1.6 };
    if (!dlg) { dlg = document.createElement('dialog'); dlg.id = 'pieceDetail'; document.body.append(dlg) }
    build(); if (!dlg.open) dlg.showModal();
  }
  function build() {
    const E = D().item(key), ov = D().ov(key); dlg.innerHTML = html(E, ov); cv = dlg.querySelector('#pdCv');
    const ed = (fn, cp) => { D().edit(key, fn, cp); paint(); readouts() };
    const readouts = () => { const o = D().ov(key); for (const f of ['sw', 'sh', 'fw', 'fh']) { const e = dlg.querySelector('#pd_' + f + 'V'); if (e) e.textContent = f === 'sw' ? (o.sw ?? o.fw ?? .5) : f === 'sh' ? (o.sh ?? o.fh ?? .5) : (o[f] ?? .5) } };
    const rng = (id, fn, fmt) => { const e = dlg.querySelector('#' + id), v = dlg.querySelector('#' + id + 'V'); e.onpointerdown = () => D().edit(key, () => { }, true); e.oninput = () => { v.textContent = fmt(+e.value); ed(o => fn(o, +e.value)) } };
    rng('pdS', (o, v) => { o.s = v / 100 }, v => v + '%'); rng('pdR', (o, v) => { o.r = v }, v => v + '°');
    rng('pdIx', (o, v) => { o.ix = v / 100 }, v => v + '%'); rng('pdIy', (o, v) => { o.iy = v / 100 }, v => v + '%');
    dlg.querySelector('#pdF').onchange = e => ed(o => { if (e.target.checked) o.f = true; else delete o.f }, true);
    dlg.querySelector('#pdB').onchange = e => ed(o => { if (e.target.checked) o.block = true; else delete o.block }, true);
    dlg.querySelector('#pdT').onchange = e => ed(o => { if (e.target.value) o.tall = e.target.value; else delete o.tall }, true);
    dlg.querySelectorAll('[data-st]').forEach(b => b.onclick = () => { const [f, d] = b.dataset.st.split(','); ed(o => { const base = f === 'sw' ? (o.sw ?? o.fw ?? .5) : f === 'sh' ? (o.sh ?? o.fh ?? .5) : (o[f] ?? .5); const v = Math.max(.5, Math.min(12, base + +d)); if ((f === 'fw' || f === 'fh') && v === .5) delete o[f]; else o[f] = v }, true) });
    dlg.querySelector('#pdSzReset')?.addEventListener('click', () => { ed(o => { delete o.sw; delete o.sh }, true); build() });
    dlg.querySelector('#pdClose').onclick = () => dlg.close();
    const at = e => { const r = cv.getBoundingClientRect(), p = inv((e.clientX - r.left) * CW / r.width, (e.clientY - r.top) * CH / r.height); walker = { u: Math.max(-5.5, Math.min(5.5, p.u)), v: Math.max(-5.5, Math.min(5.5, p.v)) } };
    cv.onpointerdown = e => { drag = true; cv.setPointerCapture(e.pointerId); at(e); paint() }; cv.onpointermove = e => { if (drag) { at(e); paint() } }; cv.onpointerup = () => { drag = false };
    paint();
  }
  window.PieceDetail = { open };
})();
