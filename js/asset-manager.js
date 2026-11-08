/* v98.260 · 📋 Asset Manager — replaces the old "Illust" tab and the "จัดการตัว / วัตถุ | คลังไฟล์ | ภาพที่เลิกใช้" selector.
   One table of EVERY picture file in the game: thumbnail · file · where it is used (plain Thai) · status.
   "where" = the Asset Studio slot (if any, from the manifest) + data/asset-usage.js (made by tools/scan-asset-usage.cjs: pages really opened + code that names the file).
   Select many → delete (uses the studio's deleteByPath, so versions/slots/manifest stay consistent; nothing is final until ⬆ Push). */
(function () {
  'use strict';
  const $ = id => document.getElementById(id), esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pane = $('managerPane'), tabBtn = $('managerTab'); if (!pane || !tabBtn) return;
  const PAGE = 150;
  let q = '', status = 'none', folder = 'all', shown = PAGE, picked = new Set(), rows = null;

  const twin = p => /\.png$/.test(p) ? p.replace(/\.png$/, '.webp') : /\.webp$/.test(p) ? p.replace(/\.webp$/, '.png') : p;
  const usageOf = p => { const U = window.ASSET_USAGE || {}, k = p.replace(/^assets\//, ''); return U[k] || U[twin(p).replace(/^assets\//, '')] || [] };

  function build() {
    const MF = typeof M !== 'undefined' ? M : window.ASSET_MANIFEST, list = new Map();
    const paths = new Set(Object.keys(window.ASSET_USAGE || {}).map(k => 'assets/' + k));
    try { if (typeof scanned !== 'undefined' && scanned) for (const p of scanned) paths.add(p) } catch (e) { }
    const slotBy = new Map();
    try { for (const a of MF.assets || []) { if (a.file) slotBy.set(a.file, a); for (const h of a.history || []) if (h.file && !slotBy.has(h.file)) slotBy.set(h.file, { id: a.id, old: true }) } } catch (e) { }
    for (const p of [...paths].sort()) {
      if (/^assets\/(audio|fonts|models|_versions)\//.test(p) && !/\.(png|webp|jpe?g|gif)$/i.test(p)) continue;
      if (!/\.(png|webp|jpe?g|gif)$/i.test(p)) continue;
      const u = usageOf(p), real = u.filter(x => x.startsWith('เห็นโหลดจริง')), code = u.filter(x => x.startsWith('เขียนไว้ใน')), guess = u.filter(x => x.startsWith('อาจใช้'));
      const slot = slotBy.get(p) || slotBy.get(twin(p));
      let st = real.length ? 'real' : code.length ? 'code' : guess.length ? 'guess' : 'none';
      if (/^assets\/_versions\//.test(p) || slot?.old) st = st === 'real' || st === 'code' ? st : 'old';
      const ws = [];
      if (slot && !slot.old) { let w = ''; try { w = typeof where === 'function' ? where(slot) : (slot.usedIn || '') } catch (e) { } ws.push('ช่องใน Asset Studio: ' + slot.id + (w ? ' (' + w + ')' : '')) }
      if (slot?.old) ws.push('ภาพเวอร์ชันเก่าของ ' + slot.id);
      ws.push(...real.map(x => x.replace('เห็นโหลดจริงตอน: ', 'เปิดแล้วเห็นโหลดจริงตอน ')), ...code.map(x => x.replace('เขียนไว้ใน: ', 'มีเขียนชื่อไว้ในส่วน ')), ...guess.map(x => x.replace('อาจใช้: ', 'อาจถูกใช้โดย ')));
      if (!ws.length) ws.push(slot ? '' : 'ไม่พบว่ามีส่วนไหนของเกมเรียกใช้');
      list.set(p, { p, st, where: ws.filter(Boolean), folder: p.split('/').slice(0, 2).join('/') });
    }
    return [...list.values()];
  }
  const LABEL = { real: ['ใช้อยู่ (เห็นจริง)', '#2f7d3a'], code: ['ใช้อยู่ (พบในโค้ด)', '#4b7a3a'], guess: ['อาจใช้', '#b0701a'], old: ['เวอร์ชันเก่า', '#8a7a52'], none: ['ไม่พบการใช้', '#a8402f'] };
  const view = () => rows.filter(r => (status === 'all' || (status === 'unused' ? ['none', 'old'].includes(r.st) : r.st === status || (status === 'used' && ['real', 'code'].includes(r.st)))) && (folder === 'all' || r.folder === folder) && (!q || (r.p + ' ' + r.where.join(' ')).toLowerCase().includes(q)));

  function draw() {
    if (!rows) rows = build();
    const all = rows, v = view(), cnt = k => all.filter(r => k === 'all' ? true : k === 'used' ? ['real', 'code'].includes(r.st) : k === 'unused' ? ['none', 'old'].includes(r.st) : r.st === k).length;
    const folders = [...new Set(all.map(r => r.folder))].sort();
    const chip = (k, n) => `<button class="mg-chip ${status === k ? 'on' : ''}" data-st="${k}">${n} <small>${cnt(k)}</small></button>`;
    pane.innerHTML = `<style>
 #managerPane{padding:10px 16px 60px;font-size:13px}.mg-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:8px;position:sticky;top:0;background:var(--panel);padding:6px 0;z-index:2}
 .mg-chip{border:1px solid var(--line);background:var(--panel);border-radius:14px;padding:4px 11px;cursor:pointer}.mg-chip.on{background:#c9a45a;color:#1d1608}.mg-chip small{opacity:.7}
 .mg-table{border-collapse:collapse;width:100%}.mg-table th{text-align:left;font-size:12px;color:var(--muted);border-bottom:1px solid var(--line);padding:4px 6px;position:sticky;top:46px;background:var(--panel)}
 .mg-table td{border-bottom:1px solid var(--line);padding:5px 6px;vertical-align:middle}.mg-table tr.on{background:#c9a45a22}.mg-th{width:64px;height:64px;background:repeating-conic-gradient(#e6e1d2 0 25%,#f4f1e8 0 50%) 0 0/12px 12px;display:flex;align-items:center;justify-content:center;border-radius:6px;overflow:hidden}
 .mg-th img{max-width:100%;max-height:100%}.mg-path{font-family:ui-monospace,monospace;font-size:11.5px;word-break:break-all}.mg-w{line-height:1.45}.mg-badge{display:inline-block;border-radius:10px;padding:1px 8px;color:#fff;font-size:11.5px;white-space:nowrap}
 .mg-del{background:#a8402f;color:#fff;border:0;border-radius:8px;padding:6px 12px;cursor:pointer}.mg-del:disabled{opacity:.4;cursor:default}</style>
 <div class="mg-bar"><input type="search" id="mgQ" placeholder="ค้นหาชื่อไฟล์ หรือคำอธิบายการใช้งาน" value="${esc(q)}" style="min-width:220px">
 ${chip('unused', 'ไม่พบการใช้ / เก่า')}${chip('guess', 'อาจใช้')}${chip('used', 'ใช้อยู่')}${chip('all', 'ทั้งหมด')}
 <select id="mgF"><option value="all">ทุกโฟลเดอร์</option>${folders.map(f => `<option ${f === folder ? 'selected' : ''}>${esc(f)}</option>`).join('')}</select>
 <span class="grow" style="flex:1"></span><button id="mgAll">เลือกทั้งหมดที่เห็น (${Math.min(v.length, shown)})</button><button id="mgNone">ล้างที่เลือก</button><button class="mg-del" id="mgDel" ${picked.size ? '' : 'disabled'}>ลบที่เลือก (${picked.size})</button></div>
 <p class="muted" style="margin:0 0 8px">ไม่พบการใช้ ≠ ลบได้แน่นอนเสมอ: ชื่อไฟล์ที่เกมประกอบเอง (เช่น ตัวละครแต่ละเฟรม) อาจไม่ถูกจับ · รายการ "อาจใช้" ให้ดูภาพก่อนลบ · ลบแล้วต้องกด ⬆ Push ที่แก้ ถึงจะลบบน GitHub · ${v.length} จาก ${all.length} ไฟล์</p>
 <table class="mg-table"><thead><tr><th></th><th>ภาพ</th><th>ไฟล์</th><th>ใช้ที่ไหน</th><th>สถานะ</th></tr></thead><tbody>${v.slice(0, shown).map(r => `<tr data-p="${esc(r.p)}" class="${picked.has(r.p) ? 'on' : ''}"><td><input type="checkbox" ${picked.has(r.p) ? 'checked' : ''}></td><td><div class="mg-th"><img data-p="${esc(r.p)}" alt=""></div></td><td class="mg-path">${esc(r.p.replace(/^assets\//, ''))}</td><td class="mg-w">${r.where.map(esc).join('<br>')}</td><td><span class="mg-badge" style="background:${LABEL[r.st][1]}">${LABEL[r.st][0]}</span></td></tr>`).join('')}</tbody></table>
 ${v.length > shown ? `<p><button id="mgMore">แสดงเพิ่ม (${v.length - shown} ที่เหลือ)</button></p>` : ''}`;
    try { hydrate(pane) } catch (e) { pane.querySelectorAll('img[data-p]').forEach(i => i.src = i.dataset.p) }
    pane.querySelectorAll('.mg-chip').forEach(b => b.onclick = () => { status = b.dataset.st; shown = PAGE; draw() });
    $('mgQ').oninput = e => { q = e.target.value.trim().toLowerCase(); shown = PAGE; clearTimeout(draw._t); draw._t = setTimeout(() => { draw(); const i = $('mgQ'); i.focus(); i.setSelectionRange(i.value.length, i.value.length) }, 250) };
    $('mgF').onchange = e => { folder = e.target.value; shown = PAGE; draw() };
    $('mgAll').onclick = () => { v.slice(0, shown).forEach(r => picked.add(r.p)); draw() };
    $('mgNone').onclick = () => { picked.clear(); draw() };
    if ($('mgMore')) $('mgMore').onclick = () => { shown += PAGE; draw() };
    pane.querySelectorAll('tbody tr').forEach(tr => { const p = tr.dataset.p, cb = tr.querySelector('input'); const t = () => { picked.has(p) ? picked.delete(p) : picked.add(p); tr.classList.toggle('on', picked.has(p)); cb.checked = picked.has(p); $('mgDel').disabled = !picked.size; $('mgDel').textContent = `ลบที่เลือก (${picked.size})` }; cb.onclick = e => { e.stopPropagation(); t() }; tr.onclick = t });
    $('mgDel').onclick = del;
  }
  async function del() {
    const list = [...picked], risky = list.filter(p => { const r = rows.find(x => x.p === p); return r && ['real', 'code'].includes(r.st) });
    if (!list.length) return;
    if (!confirm(`ลบ ${list.length} ไฟล์?` + (risky.length ? `\n\n⚠ ${risky.length} ไฟล์ในนี้ "ถูกใช้อยู่" (เกมเห็นโหลดจริงหรือมีโค้ดเขียนชื่อไว้) ลบแล้วภาพจะหาย` : '') + '\n\n' + list.slice(0, 15).join('\n') + (list.length > 15 ? '\n…' : '') + '\n\n(ต้องกด “Push ที่แก้” ถึงจะลบบน GitHub)')) return;
    let ok = 0; const fail = [];
    for (const p of list) { try { await deleteByPath(p); ok++; picked.delete(p); rows = rows.filter(r => r.p !== p) } catch (e) { fail.push(p + ' — ' + (e.message || e)) } }
    toast(`ลบแล้ว ${ok} ไฟล์ · รอกด “Push ที่แก้”`); if (fail.length) alert('ลบไม่สำเร็จ:\n' + fail.slice(0, 10).join('\n')); draw();
  }
  function open() { window.scrollTo(0, 0); try { wsFit() } catch (e) { } hideWorkshop(); document.body.classList.add('workshop-open'); try { dimLibTabs() } catch (e) { } rows = null; pane.style.display = 'block'; tabBtn.classList.add('on'); draw() }
  function close() { pane.style.display = 'none'; tabBtn.classList.remove('on') }
  tabBtn.addEventListener('click', () => { if (pane.style.display === 'block') { close(); hideWorkshop(); try { showLibTabs() } catch (e) { } } else open() });
  for (const id of ['workshopTab', 'lineupTab', 'animTab']) $(id)?.addEventListener('click', close, true);
  if (/[?&]tab=(manager|illust|library)/.test(location.search)) setTimeout(open, 600);
})();
