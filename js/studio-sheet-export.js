/* v98.633 · ส่งออกชีท (Asset Studio → Animation → ตัวละคร / NPC / มอนสเตอร์ / บอส → "⬇ ส่งออกชีท")
   The reverse of studio-sheet-import.js: one character → PNG sheets to take to an image generator and bring back with "🧩 นำเข้าชีท".
   The frames come from the SAME clip list the studio shows (StudioBrowser.state.model), so an edit already made in the studio is in the sheet.
   Sheets (one file each, chosen one by one — no bundle):
     • ท่าต่อสู้ 1  = ยืน · เตรียมโจมตี · โจมตี           SW 1 ใบ · NE 1 ใบ
     • ท่าเดิน     = ทุกเฟรมของท่าเดิน (ฮีโร่ 12 เฟรม)   SW 1 ใบ · NE 1 ใบ
     • ท่าต่อสู้ 2  = ป้องกัน · โดนโจมตี · ล้ม            SW 1 ใบ · NE 1 ใบ
     • NPC          = ยืน SW + NE รวมใบเดียว · เดิน SW / NE ถ้ามีหลายเฟรม
   A sheet with nothing to put in it is greyed out. Each frame keeps the size of its own cell (384 × 384 for people, 512 × 512 for monsters), a row per pose
   when any pose has several frames (otherwise one row), transparent background (or a flat colour — what many generators prefer). */
(function () {
  'use strict';
  const $ = id => document.getElementById(id), esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const B = () => window.StudioBrowser, toast = m => { try { window.toast ? window.toast(m) : console.log(m) } catch (e) { } };
  const POSE_NAME = { idle: 'ยืน', windup: 'เตรียมโจมตี', strike: 'โจมตี', guard: 'ป้องกัน', hit: 'โดนโจมตี', down: 'ล้ม', walk: 'เดิน' };
  /* kind → what goes in the sheet (poses in order) and which directions get their own file */
  const KINDS = [
    { id: 'actions', label: 'ท่าต่อสู้ 1', sub: 'ยืน · เตรียมโจมตี · โจมตี', poses: ['idle', 'windup', 'strike'], views: ['SW', 'NE'] },
    { id: 'walk', label: 'ท่าเดิน', sub: '2 ชีท: เฟรม 1-6 + 7-12 (3×2)', poses: ['walk'], views: ['SW', 'NE'], multi: true },
    { id: 'defense', label: 'ท่าต่อสู้ 2', sub: 'ป้องกัน · โดนโจมตี · ล้ม', poses: ['guard', 'hit', 'down'], views: ['SW', 'NE'] }
  ];
  const isMon = e => e && (e.group === 'monsters' || e.group === 'bosses'), isNpc = e => e && e.group === 'npcs', isPerson = e => e && e.group === 'characters';
  const entityNow = () => { const S = B()?.state; return S && S.model.find(e => e.id === S.entity) };
  const fileKey = e => String(e.id).replace(/^(enemy|ally|npc):/, (m, g) => (g === 'enemy' ? '' : g + '-')).replace(/[^\w.-]+/g, '_');
  /* the clip for pose × view: the one with the most frames (an ally also lists a one-frame "static" copy of the same slot) */
  function clipOf(e, pose, view) { let best = null; for (const c of e.clips || []) if (c.action === pose && c.view === view && c.frames?.length && (!best || c.frames.length > best.frames.length)) best = c; return best }

  /* one frame → its own canvas at its native size (crop for a cell of a strip, mirrored when the studio mirrors it) */
  async function frameCanvas(f) {
    const img = await B().loadImage(f.file); if (!img) return null;
    const crop = f.crop || [0, 0, img.naturalWidth, img.naturalHeight], W = Math.round(crop[2]), H = Math.round(crop[3]);
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    if (f.flip) { g.translate(W, 0); g.scale(-1, 1) } g.drawImage(img, ...crop, 0, 0, W, H); return c;
  }
  /* the pieces a kind needs for one view: [{pose, canvases[]}] — empty when the character has none of them */
  async function gather(e, kind, views) {
    const out = [];
    for (const v of views) for (const p of kind.poses) {
      const c = clipOf(e, p, v); if (!c) continue;
      if (kind.multi && c.frames.length < 2) continue;      /* a "walk" of one picture is not an animation to regenerate */
      const cvs = []; for (const f of c.frames) { const cv = await frameCanvas(f); if (cv) cvs.push(cv) }
      if (cvs.length) out.push({ pose: p, view: v, cvs });
    }
    return out;
  }
  /* what can be exported for this character right now (for the buttons) */
  function plan(e) {
    const sheets = [];
    const has = (p, v, min = 1) => (clipOf(e, p, v)?.frames.length || 0) >= min;
    if (isNpc(e)) {
      sheets.push({ id: 'stand', label: 'ยืน SW + NE', sub: 'รวมใบเดียว', ok: has('idle', 'SW') || has('idle', 'NE'), kind: { id: 'stand', poses: ['idle'], views: ['SW', 'NE'] }, views: ['SW', 'NE'] });
      for (const v of ['SW', 'NE']) sheets.push({ id: 'walk-' + v, label: 'เดิน ' + v, sub: 'ทุกเฟรม', ok: has('walk', v, 2), kind: KINDS[1], views: [v] });
      return sheets;
    }
    for (const k of KINDS) for (const v of k.views) sheets.push({ id: k.id + '-' + v, label: k.label + ' · ' + v, sub: k.sub, ok: k.poses.some(p => has(p, v, k.multi ? 2 : 1)), kind: k, views: [v] });
    return sheets;
  }
  /* lay the pieces out: a single row, or a row per pose when some pose has several frames */
  function compose(parts, bg, many, gridCols) {
    const cw = Math.max(...parts.flatMap(p => p.cvs.map(c => c.width))), ch = Math.max(...parts.flatMap(p => p.cvs.map(c => c.height)));
    let rows = many ? parts.map(p => p.cvs) : [parts.flatMap(p => p.cvs)];
    /* v98.823 · a walk sheet is laid out in a fixed number of columns (3 → 6 frames = 3 × 2), reading order left → right, top → bottom */
    if (gridCols) { const all = parts.flatMap(p => p.cvs); rows = []; for (let i = 0; i < all.length; i += gridCols) rows.push(all.slice(i, i + gridCols)) }
    const cols = Math.max(...rows.map(r => r.length)), o = document.createElement('canvas'); o.width = cols * cw; o.height = rows.length * ch; const g = o.getContext('2d');
    if (bg) { g.fillStyle = bg; g.fillRect(0, 0, o.width, o.height) }
    rows.forEach((r, y) => r.forEach((c, x) => g.drawImage(c, x * cw + Math.round((cw - c.width) / 2), y * ch + (ch - c.height))));
    return o;
  }
  const lookName = e => { try { return e.id === 'hero' ? '-' + (window.StudioVariants?.active || 'male') : '' } catch (x) { return '' } };
  async function exportSheet(e, sh, bg) {
    const parts = await gather(e, sh.kind, sh.views); if (!parts.length) return toast('ไม่มีภาพให้ส่งออก');
    const base = (e.id === 'hero' ? 'hero' : fileKey(e)) + lookName(e), save = async (cv, name) => { const blob = await new Promise(r => cv.toBlob(r, 'image/png')), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000) };
    /* v98.823 · a WALK of one direction → two sheets, frames 1–6 and 7–12 (more frames: 6 each), each 3 columns × 2 rows */
    if (sh.kind.id === 'walk') {
      const all = parts.flatMap(p => p.cvs), chunks = []; for (let i = 0; i < all.length; i += 6) chunks.push([i, all.slice(i, i + 6)]);
      const names = [], dims = []; for (const [i, fr] of chunks) { const cv = compose([{ cvs: fr }], bg, false, 3), name = `${base}_${sh.views[0].toLowerCase()}_walk_${i + 1}-${i + fr.length}.png`; await save(cv, name); names.push(name); dims.push(cv.width + '×' + cv.height); await new Promise(r => setTimeout(r, 350)) }
      toast('ส่งออก ' + chunks.length + ' ชีท (เดิน ' + all.length + ' เฟรม · ชีทละ ≤ 6 เฟรม · 3×2): ' + names.join(' · ')); return { names, dims, frames: all.length };
    }
    const many = parts.some(p => p.cvs.length > 1) && sh.kind.id !== 'stand', cv = compose(parts, bg, many), name = `${base}_${sh.kind.id === 'stand' ? 'stand-sw-ne' : sh.views[0].toLowerCase() + '_' + sh.kind.id}.png`;
    await save(cv, name);
    const note = parts.map(p => (POSE_NAME[p.pose] || p.pose) + (p.cvs.length > 1 ? ' ' + p.cvs.length + ' เฟรม' : '')).join(' · ');
    toast('ส่งออก ' + name + ' · ' + cv.width + '×' + cv.height + ' (' + note + ')'); return { name, w: cv.width, h: cv.height, parts: parts.map(p => [p.pose, p.view, p.cvs.length]) };
  }


  let dlg = null;
  function build() {
    if (dlg) return dlg; dlg = document.createElement('dialog'); dlg.id = 'sheetExport'; document.body.append(dlg);
    const s = document.createElement('style'); s.textContent = `#sheetExport{width:min(560px,94vw);border-radius:14px;border:1px solid #c8b77f;padding:14px 16px;background:#f7f5ee;color:#2a2418;font:13px AgThai,system-ui,"Noto Sans Thai",sans-serif}
    #sheetExport::backdrop{background:#14231cba}#sheetExport h2{margin:0 0 4px}#sheetExport .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0}
    #sheetExport .grid button{padding:9px 10px;border-radius:10px;border:1px solid #a06c27;background:#fffdf6;text-align:left;cursor:pointer;font:inherit}#sheetExport .grid button:hover:not(:disabled){background:#fbe9c6}
    #sheetExport .grid button:disabled{opacity:.38;cursor:not-allowed;filter:grayscale(1)}#sheetExport small{display:block;color:#6b6247}#sheetExport .row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:6px 0}`; document.head.append(s);
    return dlg;
  }
  function open() {
    const e = entityNow(); if (!e || !(isPerson(e) || isNpc(e) || isMon(e))) return toast('เลือกตัวละคร NPC มอนสเตอร์ หรือบอสก่อน');
    build(); const sheets = plan(e), hero = e.id === 'hero';
    dlg.innerHTML = `<h2>⬇ ส่งออกชีท</h2><div>ตัวละคร: <b>${esc(e.name)}</b>${hero ? ' · ลุคที่เปิดอยู่: <b>' + esc(window.StudioVariants?.active || 'male') + '</b>' : ''}</div>
      <small style="color:#6b6247">ส่งออกทีละใบ เป็น PNG ขนาดเฟรมเดิม (คนละ 384×384 · มอนสเตอร์ 512×512) แล้วนำไปเจนใหม่ → กลับมา "🧩 นำเข้าชีท" ได้ · ภาพที่แก้ใน Studio แล้วเข้าชีทตามที่เห็น${isMon(e) ? ' · มอนสเตอร์มีภาพจริงเฉพาะ SE/NE ส่วน SW/NW เกมพลิกให้ (ชีท SW = SE พลิก)' : ''}</small>
      <div class="grid">${sheets.map((s, i) => `<button data-i="${i}" ${s.ok ? '' : 'disabled title="ตัวละครนี้ยังไม่มีภาพของชีทนี้"'}><b>${esc(s.label)}</b><small>${esc(s.sub)}</small></button>`).join('')}</div>
      <div class="row"><label><input type="checkbox" id="seFlat"> พื้นหลังสีเรียบ (เขียว) แทนโปร่งใส</label></div><div id="seMsg" style="min-height:18px;color:#315d46"></div>
      <div class="row" style="justify-content:flex-end"><button id="seClose">ปิด</button></div>`;
    dlg.querySelector('#seClose').onclick = () => dlg.close();
    dlg.querySelectorAll('.grid button').forEach(b => b.onclick = async () => { b.disabled = true; try { const r = await exportSheet(e, sheets[+b.dataset.i], $('seFlat').checked ? '#6e966e' : null); $('seMsg').textContent = r ? '✓ ' + r.name + ' · ' + r.w + '×' + r.h : '' } catch (x) { $('seMsg').textContent = 'ส่งออกไม่สำเร็จ: ' + x.message; console.error(x) } finally { b.disabled = false } });
    dlg.showModal();
  }
  function inject() {
    const grid = $('grid'), ctl = grid && grid.querySelector('.entity-controls'); if (!ctl || ctl.querySelector('#shExpBtn')) return; const e = entityNow(); if (!e || !(isPerson(e) || isNpc(e) || isMon(e))) return;
    const b = document.createElement('button'); b.id = 'shExpBtn'; b.type = 'button'; b.textContent = '⬇ ส่งออกชีท'; b.title = 'ส่งออกภาพของตัวละครนี้เป็นชีท PNG (ท่าต่อสู้ · ท่าเดิน · ป้องกัน/โดน/ล้ม) เพื่อเอาไปเจนใหม่'; b.onclick = open;
    (ctl.querySelector('.tb-group[data-g=edit] .tb-items') || ctl).prepend(b);
  }
  window.StudioSheetExport = { open, plan, gather, compose, exportSheet, clipOf, _entity: () => entityNow()?.id };
  const g = $('grid'); if (g) { new MutationObserver(inject).observe(g, { childList: true }); inject() }
})();
