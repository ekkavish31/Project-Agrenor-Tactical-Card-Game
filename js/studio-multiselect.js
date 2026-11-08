/* v98.127 · Animation grid: ☑ เลือกหลายช่อง — pick many cells (click a cell, a row title = the whole action, a column title = the whole direction),
   then: ✔ ยืนยันผ่าน · ↺ ยกเลิกยืนยัน (กลับเป็นรอตรวจ) · ✘ ต้องแก้ · ⚖ ปรับขนาด ±% · 🗑 ลบภาพ. Uses StudioUnifiedReview.setVerdictMany / deleteMany / batchScale. */
(function () {
  'use strict';
  const B = () => window.StudioBrowser, U = () => window.StudioUnifiedReview, grid = document.getElementById('grid');
  if (!grid) return;
  let on = false, busy = false; const picked = new Set();
  const st = document.createElement('style'); st.textContent = `
  #grid.ms-mode [data-clip-index]{cursor:copy}#grid [data-clip-index].ms-on{outline:3px solid #2f6fd0;outline-offset:-3px;position:relative}
  #grid [data-clip-index].ms-on::after{content:"✔";position:absolute;top:6px;left:8px;background:#2f6fd0;color:#fff;border-radius:6px;font:700 12px AgThai,system-ui;padding:1px 5px}
  #grid.ms-mode .anim-matrix th{cursor:pointer}#grid.ms-mode .anim-matrix th:hover{text-decoration:underline}
  .ms-bar[hidden]{display:none}.ms-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:6px 0;padding:6px 8px;border:1px solid #9db4dd;border-radius:10px;background:#eef3fb}
  .ms-bar b{margin-right:4px}.ms-bar button{font:inherit}.ms-bar .danger{color:#a8402f;border-color:#a8402f}.ms-bar small{color:#5a6a80}`;
  document.head.append(st);
  const cellClip = b => { const cv = b.querySelector('canvas'), e = (B().state.entries || []).find(x => x.canvas === cv); return e && e.clip };
  const cells = () => [...grid.querySelectorAll('[data-clip-index]')];
  const toast = m => { try { window.toast ? window.toast(m) : console.log(m) } catch (e) { } };
  function paint() {
    grid.classList.toggle('ms-mode', on);
    for (const b of cells()) { const c = cellClip(b); b.classList.toggle('ms-on', on && !!c && picked.has(c.id)) }
    const n = picked.size, bar = grid.querySelector('.ms-bar'), btn = grid.querySelector('#msToggle');
    if (btn) { btn.textContent = on ? '☑ เลือกหลายช่อง: เปิด' : '☐ เลือกหลายช่อง'; btn.setAttribute('aria-pressed', on) }
    if (bar) { bar.hidden = !on; bar.querySelector('.ms-n').textContent = n; bar.querySelectorAll('[data-act]').forEach(x => { x.disabled = !n || busy; x.hidden = !n }); const hint = bar.querySelector('small'); if (hint) hint.hidden = !!n }
  }
  function inject() {
    const ctl = grid.querySelector('.entity-controls'); if (!ctl || ctl.querySelector('#msToggle')) return paint();
    const t = document.createElement('button'); t.id = 'msToggle'; t.type = 'button'; t.title = 'เลือกหลายช่องเพื่อยืนยัน / ยกเลิก / ลบ พร้อมกัน'; ctl.prepend(t);
    t.onclick = () => { on = !on; if (!on) picked.clear(); paint() };
    const bar = document.createElement('div'); bar.className = 'ms-bar'; bar.hidden = true;
    bar.innerHTML = `<b>เลือกแล้ว <span class="ms-n">0</span> ชุด</b><button type="button" data-sel="all">ทั้งหมด</button><button type="button" data-sel="none">ล้าง</button>
      <button type="button" data-act="approved">✔ ยืนยันผ่าน</button><button type="button" data-act="unreviewed">↺ ยกเลิกยืนยัน</button><button type="button" data-act="needsfix">✘ ต้องแก้</button>
      <button type="button" data-act="scale">⚖ ปรับขนาด ±%</button><button type="button" data-act="delete" class="danger">🗑 ลบภาพ</button>
      <small>คลิกช่อง = เลือก/ไม่เลือก · คลิกชื่อท่า = ทั้งแถว · คลิกชื่อทิศ = ทั้งคอลัมน์</small>`;
    ctl.after(bar);
    bar.querySelector('[data-sel="all"]').onclick = () => { for (const b of cells()) { const c = cellClip(b); if (c && c.frames?.length) picked.add(c.id) } paint() };
    bar.querySelector('[data-sel="none"]').onclick = () => { picked.clear(); paint() };
    bar.querySelectorAll('[data-act]').forEach(x => x.onclick = () => run(x.dataset.act));
    paint();
  }
  async function run(act) {
    const ids = [...picked]; if (!ids.length || busy) return; busy = true; paint();
    try {
      if (act === 'delete') {
        if (!confirm('ลบภาพของ ' + ids.length + ' ชุดที่เลือก?\n· ชุดที่นำเข้าของตัวเอก → กลับเป็นภาพตั้งต้นของเกม\n· ชุดเดินของเพื่อน → เอาออก\n· ภาพเดี่ยว → ลบไฟล์ ช่องกลายเป็นช่องว่าง (เติมได้)\nยังไม่ขึ้นเกมจนกว่าจะ Push')) return;
        const r = await U().deleteMany(ids); picked.clear(); toast('ลบแล้ว ' + r.sets + ' ชุด · ' + r.files + ' ไฟล์' + (r.failed.length ? ' · ไม่สำเร็จ ' + r.failed.length + ': ' + r.failed[0] : ''));
      } else if (act === 'scale') {
        const v = Math.round(+prompt('ปรับขนาด ' + ids.length + ' ชุดที่เลือก (%, เช่น 5 หรือ -5)', '5') || 0); if (!v || Math.abs(v) > 50) return;
        const r = await U().batchScale(ids, v, (n, t) => toast('ปรับขนาด ' + n + '/' + t)); toast('ปรับขนาดแล้ว ' + r.done + ' ชุด' + (r.skipped ? ' · ข้าม ' + r.skipped : '') + (r.failed.length ? ' · ไม่สำเร็จ ' + r.failed.length : ''));
      } else { const n = await U().setVerdictMany(ids, act); toast((act === 'approved' ? 'ยืนยันผ่าน ' : act === 'needsfix' ? 'ทำเครื่องหมายต้องแก้ ' : 'กลับเป็นรอตรวจ ') + n + ' ชุด') }
    } catch (e) { alert('ทำไม่สำเร็จ: ' + e.message) } finally { busy = false; paint() }
  }
  /* capture phase: in multi-select mode a click picks instead of opening the editor */
  grid.addEventListener('click', ev => {
    if (!on) return; const cell = ev.target.closest('[data-clip-index]'), th = ev.target.closest('.anim-matrix th');
    if (cell) { ev.preventDefault(); ev.stopImmediatePropagation(); const c = cellClip(cell); if (!c || !c.frames?.length) return; picked.has(c.id) ? picked.delete(c.id) : picked.add(c.id); paint(); return }
    if (th) { ev.preventDefault(); ev.stopImmediatePropagation(); const tr = th.parentElement, table = th.closest('table'); let list;
      if (tr.parentElement.tagName === 'THEAD') { const col = [...tr.children].indexOf(th); if (col < 1) return; list = [...table.querySelectorAll('tbody tr')].map(r => r.children[col]).filter(Boolean).flatMap(td => [...td.querySelectorAll('[data-clip-index]')]) }
      else list = [...tr.querySelectorAll('[data-clip-index]')];
      const cs = list.map(cellClip).filter(c => c && c.frames?.length), all = cs.every(c => picked.has(c.id)); for (const c of cs) all ? picked.delete(c.id) : picked.add(c.id); paint() }
  }, true);
  new MutationObserver(() => { if (grid.querySelector('.entity-controls') && !grid.querySelector('#msToggle')) inject(); else paint() }).observe(grid, { childList: true });
  inject();
  window.StudioMultiSelect = { picked: () => [...picked], set: v => { on = !!v; paint() } };
})();
