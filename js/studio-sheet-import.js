/* v98.144 · นำเข้าชีทหลายช่อง (Asset Studio → Animation → ตัวละคร → "🧩 นำเข้าชีท")
   One picture holding many poses (stand · windup · strike · guard · hit · down … or a walk cycle) → cut it up → send each piece to its own slot of the selected character, in one go.
   1. choose a sheet (file / paste)  2. cut: equal grid · grid that finds the empty gaps · by pieces of the picture (auto)   (+ remove a flat background colour)
   3. each piece gets a target: ท่า × ทิศ (several pieces to ONE target = the frames of that set, in reading order) + "↔ ใส่ทิศตรงข้ามกลับด้านด้วย"
      shortcut: "ลำดับท่ามาตรฐาน" fills ยืน → เตรียมโจมตี → โจมตี → ป้องกัน → โดนโจมตี → ตาย (or with เดิน first) in reading order for one direction
   4. นำเข้า: a character with one picture per slot (Kier …) → that slot's picture is replaced (the old one archived, history kept) · missing slots are created ·
      walk sets → studioAllyWalks · the hero (the open look) → its saved poses / walk sets. Sizes are normalised like every other import (384 × 384, feet at y 360), one common scale for the whole sheet. */
/* v98.363 · the same tool now works on MONSTERS and BOSSES (Asset Studio → Animation → มอนสเตอร์ / บอส): the pieces become the frames of the slots
   enemy-anim-<kind>-<se|ne>-<pose> (cells of 512×512 in a row, feet at 0.95, ONE scale for the whole sheet) — SW / NW are mirrored by the game, so only SE and NE exist. */
(function () {
  'use strict';
  const SIZE = 384, FEET = 360, BOX_W = 368, BOX_H = 346;
  const ACTIONS = [['idle', 'ยืน / หายใจ'], ['walk', 'เดิน'], ['windup', 'เตรียมโจมตี'], ['strike', 'โจมตี'], ['guard', 'ป้องกัน'], ['hit', 'โดนโจมตี'], ['down', 'ตาย / ล้ม']];
  const MON_ACTIONS = [['idle', 'ยืน / หายใจ'], ['walk', 'เดิน'], ['windup', 'เตรียมโจมตี'], ['strike', 'โจมตี'], ['hit', 'โดนโจมตี'], ['down', 'ล้ม / ตาย'], ['cast', 'ใช้ท่าพิเศษ / ยิงไกล'], ['loot', 'ของที่ทิ้ง'], ['run', 'วิ่ง'], ['pant', 'หอบ'], ['graze', 'กินหญ้า'], ['bleat', 'ร้อง'], ['sleep', 'นอน'], ['happy', 'ดีใจ']];
  const MON_TIMING = { idle: [650, 'loop'], walk: [130, 'loop'], windup: [250, ''], strike: [135, ''], hit: [400, ''], down: [300, ''], cast: [250, ''], loot: [1000, 'loop'], run: [90, 'loop'], pant: [500, 'loop'], graze: [450, 'loop'], bleat: [350, ''], sleep: [900, 'loop'], happy: [200, ''] };
  const isMon = e => !!e && (e.group === 'monsters' || e.group === 'bosses'), monKind = e => String(e.id).replace(/^enemy:/, '');
  const VIEWS = ['SW', 'SE', 'NW', 'NE'], MON_VIEWS = ['SE', 'NE'], OPP = { SW: 'SE', SE: 'SW', NW: 'NE', NE: 'NW' };
  const PRESETS = { std: ['idle', 'windup', 'strike', 'guard', 'hit', 'down'], walk: ['walk', 'idle', 'windup', 'strike', 'guard', 'hit', 'down'], mon4: ['windup', 'strike', 'hit', 'down'], mon6: ['idle', 'walk', 'windup', 'strike', 'hit', 'down'] };
  const $ = id => document.getElementById(id), esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const B = () => window.StudioBrowser, toast = m => { try { window.toast ? window.toast(m) : console.log(m) } catch (e) { } };

  /* ---------------- pure image helpers (also used by the test) ---------------- */
  function loadBlob(file) { return new Promise((res, rej) => { const u = URL.createObjectURL(file), im = new Image(); im.onload = () => { URL.revokeObjectURL(u); res(im) }; im.onerror = () => { URL.revokeObjectURL(u); rej(new Error('อ่านภาพไม่ได้')) }; im.src = u }) }
  function toCanvas(im) { const c = document.createElement('canvas'); c.width = im.naturalWidth || im.width; c.height = im.naturalHeight || im.height; c.getContext('2d', { willReadFrequently: true }).drawImage(im, 0, 0); return c }
  /* flat background → transparent: flood fill from the border over pixels close to the corner colour; skipped when the picture already has transparent corners */
  function removeBackground(cv, tol = 40) {
    const W = cv.width, H = cv.height, g = cv.getContext('2d', { willReadFrequently: true }), im = g.getImageData(0, 0, W, H), d = im.data, px = (x, y) => (y * W + x) * 4;
    const corners = [[0, 0], [W - 1, 0], [0, H - 1], [W - 1, H - 1]].map(([x, y]) => px(x, y));
    if (corners.some(i => d[i + 3] < 128)) return false;
    const c0 = corners[0], ref = [d[c0], d[c0 + 1], d[c0 + 2]], same = corners.every(i => Math.abs(d[i] - ref[0]) + Math.abs(d[i + 1] - ref[1]) + Math.abs(d[i + 2] - ref[2]) < tol * 2);
    if (!same) return false;
    const near = i => Math.max(Math.abs(d[i] - ref[0]), Math.abs(d[i + 1] - ref[1]), Math.abs(d[i + 2] - ref[2])) <= tol, seen = new Uint8Array(W * H), st = [];
    const push = (x, y) => { const k = y * W + x; if (!seen[k] && near(k * 4)) { seen[k] = 1; st.push(k) } };
    for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1) } for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y) }
    while (st.length) { const k = st.pop(), x = k % W, y = (k / W) | 0; if (x > 0) push(x - 1, y); if (x < W - 1) push(x + 1, y); if (y > 0) push(x, y - 1); if (y < H - 1) push(x, y + 1) }
    let n = 0; for (let k = 0; k < W * H; k++) if (seen[k]) { d[k * 4 + 3] = 0; n++ }
    /* one-pixel rim: opaque pixels touching the cleared area that still look like the background colour */
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const k = y * W + x; if (seen[k] || d[k * 4 + 3] === 0) continue; if ((seen[k - 1] || seen[k + 1] || seen[k - W] || seen[k + W]) && Math.max(Math.abs(d[k * 4] - ref[0]), Math.abs(d[k * 4 + 1] - ref[1]), Math.abs(d[k * 4 + 2] - ref[2])) <= tol * 1.6) d[k * 4 + 3] = 0 }
    g.putImageData(im, 0, 0); return n > 0;
  }
  const alphaProfile = (cv, x0, y0, x1, y1, axis) => { const w = x1 - x0, h = y1 - y0, d = cv.getContext('2d', { willReadFrequently: true }).getImageData(x0, y0, w, h).data, out = new Float32Array(axis === 'x' ? w : h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 32) out[axis === 'x' ? x : y]++; return out };
  /* grid cuts: equal, or each border moved to the emptiest line near its nominal place */
  function gridRects(cv, cols, rows, smart) {
    const W = cv.width, H = cv.height, cut = (len, n, prof) => { const o = [0]; for (let k = 1; k < n; k++) { const e = k * len / n; if (!smart) { o.push(Math.round(e)); continue } const range = len / n * .22; let best = Math.round(e), sc = Infinity; for (let i = Math.max(2, Math.floor(e - range)); i < Math.min(len - 2, e + range); i++) { const v = (prof[i - 1] + prof[i] + prof[i + 1]) / 3 + Math.abs(i - e) / len * .05; if (v < sc) { sc = v; best = i } } o.push(best) } o.push(len); return o };
    const xs = cut(W, cols, smart ? alphaProfile(cv, 0, 0, W, H, 'x') : null), ys = cut(H, rows, smart ? alphaProfile(cv, 0, 0, W, H, 'y') : null), out = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) out.push({ x: xs[c], y: ys[r], w: xs[c + 1] - xs[c], h: ys[r + 1] - ys[r] }); return out;
  }
  /* pieces of the picture: connected parts (grown a little so a hand / cape tip stays with its body), reading order (rows by vertical overlap, then left → right) */
  function blobRects(cv) {
    const W = cv.width, H = cv.height, sc = Math.min(1, 900 / Math.max(W, H)), w = Math.max(1, Math.round(W * sc)), h = Math.max(1, Math.round(H * sc)), s = document.createElement('canvas'); s.width = w; s.height = h; s.getContext('2d').drawImage(cv, 0, 0, w, h);
    const d = s.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data, m = new Uint8Array(w * h); for (let k = 0; k < w * h; k++) m[k] = d[k * 4 + 3] > 32 ? 1 : 0;
    const R = Math.max(2, Math.round(Math.min(w, h) * .012)), g2 = new Uint8Array(w * h);   // dilation by a box of radius R (separable)
    const tmp = new Uint8Array(w * h); for (let y = 0; y < h; y++) { let last = -1e9; for (let x = 0; x < w; x++) { if (m[y * w + x]) last = x; if (x - last <= R) tmp[y * w + x] = 1 } last = 1e9; for (let x = w - 1; x >= 0; x--) { if (m[y * w + x]) last = x; if (last - x <= R) tmp[y * w + x] = 1 } }
    for (let x = 0; x < w; x++) { let last = -1e9; for (let y = 0; y < h; y++) { if (tmp[y * w + x]) last = y; if (y - last <= R) g2[y * w + x] = 1 } last = 1e9; for (let y = h - 1; y >= 0; y--) { if (tmp[y * w + x]) last = y; if (last - y <= R) g2[y * w + x] = 1 } }
    const lab = new Int32Array(w * h), boxes = []; for (let k0 = 0; k0 < w * h; k0++) { if (!g2[k0] || lab[k0]) continue; const id = boxes.length + 1, st = [k0]; lab[k0] = id; let x0 = w, y0 = h, x1 = 0, y1 = 0, n = 0;
      while (st.length) { const k = st.pop(), x = k % w, y = (k / w) | 0; if (m[k]) { n++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y } for (const q of [k - 1, k + 1, k - w, k + w]) if (q >= 0 && q < w * h && g2[q] && !lab[q] && (Math.abs((q % w) - x) <= 1)) { lab[q] = id; st.push(q) } }
      if (n) boxes.push({ x0, y0, x1, y1, n }) }
    const big = Math.max(0, ...boxes.map(b => b.n)), keep = boxes.filter(b => b.n >= big * .02), P = 2 / sc;
    const rects = keep.map(b => ({ x: Math.max(0, Math.floor(b.x0 / sc - P)), y: Math.max(0, Math.floor(b.y0 / sc - P)), w: 0, h: 0, x1: Math.min(W, Math.ceil((b.x1 + 1) / sc + P)), y1: Math.min(H, Math.ceil((b.y1 + 1) / sc + P)) })); rects.forEach(r => { r.w = r.x1 - r.x; r.h = r.y1 - r.y });
    const rows = []; for (const r of rects.sort((a, b) => a.y - b.y)) { const row = rows.find(q => Math.min(q.y1, r.y1) - Math.max(q.y, r.y) > Math.min(q.y1 - q.y, r.y1 - r.y) * .5); if (row) { row.items.push(r); row.y = Math.min(row.y, r.y); row.y1 = Math.max(row.y1, r.y1) } else rows.push({ y: r.y, y1: r.y1, items: [r] }) }
    return rows.sort((a, b) => a.y - b.y).flatMap(r => r.items.sort((a, b) => a.x - b.x));
  }
  /* crop a rect, keep only what is inside (the cut may carry a bit of the neighbour: the biggest connected part + parts touching its box) and trim to the pixels */
  function cropTrim(cv, r) {
    const c = document.createElement('canvas'); c.width = Math.max(1, r.w); c.height = Math.max(1, r.h); const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(cv, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
    const d = g.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1; for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 32) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
    if (x1 < 0) return null; const t = document.createElement('canvas'); t.width = x1 - x0 + 1; t.height = y1 - y0 + 1; t.getContext('2d').drawImage(c, x0, y0, t.width, t.height, 0, 0, t.width, t.height); return t;
  }
  /* put a trimmed piece on the 384 canvas: scale k, feet on y 360; centred on its box, or on its head (top 30 %) for walk frames so the cycle does not slide */
  function place(trim, k, headCentre) {
    const w = Math.max(1, Math.round(trim.width * k)), h = Math.max(1, Math.round(trim.height * k)), o = document.createElement('canvas'); o.width = o.height = SIZE; const g = o.getContext('2d'); g.imageSmoothingQuality = 'high';
    const s = document.createElement('canvas'); s.width = w; s.height = h; const q = s.getContext('2d'); q.imageSmoothingQuality = 'high'; q.drawImage(trim, 0, 0, w, h);
    let cx = w / 2; if (headCentre) { const d = q.getImageData(0, 0, w, Math.max(2, Math.floor(h * .3))).data; let a = w, b = -1; for (let y = 0; y < Math.max(2, Math.floor(h * .3)); y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) { if (x < a) a = x; if (x > b) b = x } if (b >= 0) cx = (a + b) / 2 }
    g.drawImage(s, Math.round(SIZE / 2 - cx), FEET - h); return o;
  }
  const flipped = cv => { const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; const g = o.getContext('2d'); g.translate(cv.width, 0); g.scale(-1, 1); g.drawImage(cv, 0, 0); return o };

  /* ---------------- state + UI ---------------- */
  let sheet = null, cells = [], dlg = null, busy = false;   // cells: [{rect, trim, target:'idle|SW'|'', mirror:false}]
  let monMode = false;
  const actsNow = () => monMode ? MON_ACTIONS : ACTIONS, viewsNow = () => monMode ? MON_VIEWS : VIEWS;
  const entityNow = () => { const S = B()?.state; return S && S.model.find(e => e.id === S.entity) };
  const slotsOf = e => { const rows = ACTIONS.map(a => a[0]); return rows.flatMap(a => VIEWS.map(v => a + '|' + v)) };
  const slotLabel = k => { const [a, v] = k.split('|'); return (actsNow().find(x => x[0] === a)?.[1] || a) + ' · ' + v };
  function css() {
    if ($('shImpCss')) return; const s = document.createElement('style'); s.id = 'shImpCss'; s.textContent = `
    #sheetImport{width:min(1200px,96vw);max-height:94vh;overflow:auto;border-radius:14px;border:1px solid #c8b77f;padding:14px 16px;background:#f7f5ee;color:#2a2418;font:13px AgThai,system-ui,"Noto Sans Thai",sans-serif}
    #sheetImport::backdrop{background:#14231cba}#sheetImport h2{margin:0 0 4px}#sheetImport .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:6px 0}
    #sheetImport button,#sheetImport select,#sheetImport input{font:inherit}#sheetImport input[type=number]{width:58px}
    #shPrev{max-width:100%;border:1px solid #b8a870;border-radius:8px;background:repeating-conic-gradient(#e8e2d0 0 25%,#fffdf6 0 50%) 0/16px 16px;display:block}
    #shCells{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:8px}
    .shc{border:1px solid #cdbf93;border-radius:10px;padding:6px;background:#fffdf6;font-size:12px}.shc.on{border-color:#2f6fd0;background:#eef4ff}.shc canvas{width:100%;height:120px;object-fit:contain;background:repeating-conic-gradient(#e8e2d0 0 25%,#fffdf6 0 50%) 0/12px 12px;border-radius:6px;display:block}
    .shc select{width:100%;margin-top:4px}.shc label{display:flex;gap:4px;align-items:center;margin-top:3px}#sheetImport .msg{min-height:18px;color:#315d46;margin:6px 0}`; document.head.append(s);
  }
  function build() {
    css(); if (dlg) return dlg; dlg = document.createElement('dialog'); dlg.id = 'sheetImport'; document.body.append(dlg);
    dlg.innerHTML = `<h2>🧩 นำเข้าชีทหลายช่อง</h2><p id="shWho" style="margin:0 0 6px"></p>
     <div class="row"><input type="file" id="shFile" accept="image/*"><span style="color:#6b6247">หรือวางภาพ (Ctrl+V) / ลากไฟล์มาวางที่หน้าต่างนี้</span></div>
     <div class="row" id="shCut" hidden>
      <label>วิธีตัด <select id="shMode"><option value="grid">ตารางเท่าๆ กัน</option><option value="smart" selected>ตารางหาร่องว่างอัตโนมัติ</option><option value="blob">ตามชิ้นภาพ (อัตโนมัติ)</option></select></label>
      <label>คอลัมน์ <input type="number" id="shCols" min="1" max="12" value="3"></label><label>แถว <input type="number" id="shRows" min="1" max="12" value="2"></label>
      <label><input type="checkbox" id="shBg" checked> ลบพื้นหลังสีเรียบ</label><label>ความไว <input type="number" id="shTol" min="5" max="120" value="40"></label>
      <button id="shRecut">ตัดใหม่</button></div>
     <div id="shInfo" style="color:#6b6247"></div><canvas id="shPrev" hidden></canvas>
     <div class="row" id="shAssign" hidden><b>ใส่ช่อง:</b>
      <label>ลำดับท่ามาตรฐาน <select id="shPreset"><option value="std">ยืน → เตรียมโจมตี → โจมตี → ป้องกัน → โดนโจมตี → ตาย</option><option value="walk">เดิน → ยืน → เตรียมโจมตี → โจมตี → ป้องกัน → โดนโจมตี → ตาย</option></select></label>
      <label>ทิศ <select id="shView"></select></label><button id="shFill">เติมตามลำดับ</button>
      <label><input type="checkbox" id="shMirrorAll"> ↔ ใส่ทิศตรงข้ามกลับด้านทุกช่อง</label>
      <label>ms/เฟรม (ชุดเดิน/หลายเฟรม) <input type="number" id="shMs" min="20" max="2000" value="100"></label>
      <label title="ทุกช่องใช้สเกลเดียว (เท้าอยู่ล่างกลาง)"><input type="checkbox" id="shCommon" checked> สเกลเดียวทั้งชีท</label><button id="shClear">ล้างการเลือก</button></div>
     <div id="shCells"></div><div class="msg" id="shMsg"></div>
     <div class="row" style="justify-content:flex-end"><button id="shApply" disabled style="background:#c9893a;border:1px solid #a06c27;color:#fff;padding:6px 14px;border-radius:8px">นำเข้า</button><button id="shClose">ปิด</button></div>`;
    $('shClose').onclick = () => dlg.close(); $('shFile').onchange = e => e.target.files[0] && openFile(e.target.files[0]); $('shRecut').onclick = recut; $('shMode').onchange = () => { $('shCols').disabled = $('shRows').disabled = $('shMode').value === 'blob' };
    $('shFill').onclick = fill; $('shClear').onclick = () => { cells.forEach(c => { c.target = ''; c.mirror = false }); drawCells() }; $('shApply').onclick = apply;
    $('shMirrorAll').onchange = () => { const m = $('shMirrorAll').checked; cells.forEach(c => { if (c.target) c.mirror = m }); drawCells() };
    dlg.addEventListener('paste', e => { const f = [...(e.clipboardData?.files || [])].find(f => f.type.startsWith('image/')); if (f) openFile(f) });
    dlg.addEventListener('dragover', e => e.preventDefault()); dlg.addEventListener('drop', e => { e.preventDefault(); const f = [...(e.dataTransfer?.files || [])].find(f => f.type.startsWith('image/')); if (f) openFile(f) });
    return dlg;
  }
  const msg = t => { $('shMsg').textContent = t };
  async function openFile(file) { try { const im = await loadBlob(file); sheet = { cv: toCanvas(im), name: file.name }; $('shCut').hidden = false; recut() } catch (e) { msg(e.message) } }
  function recut() {
    if (!sheet) return; const src = toCanvas(sheet.cv), mode = $('shMode').value; let bgDone = false;
    if ($('shBg').checked) bgDone = removeBackground(src, +$('shTol').value || 40);
    sheet.work = src; const rects = mode === 'blob' ? blobRects(src) : gridRects(src, Math.max(1, +$('shCols').value | 0), Math.max(1, +$('shRows').value | 0), mode === 'smart');
    cells = rects.map(r => ({ rect: r, trim: cropTrim(src, r), target: '', mirror: false })).filter(c => c.trim);
    $('shInfo').textContent = `${sheet.name} · ${src.width}×${src.height} · ${cells.length} ช่อง${bgDone ? ' · ลบพื้นหลังแล้ว' : ''}`;
    const pv = $('shPrev'); pv.hidden = false; const k = Math.min(1, 1100 / src.width, 340 / src.height); pv.width = Math.round(src.width * k); pv.height = Math.round(src.height * k); const g = pv.getContext('2d'); g.clearRect(0, 0, pv.width, pv.height); g.drawImage(src, 0, 0, pv.width, pv.height);
    g.lineWidth = 2; g.font = 'bold 14px AgThai,system-ui'; cells.forEach((c, i) => { g.strokeStyle = '#2f6fd0'; g.strokeRect(c.rect.x * k, c.rect.y * k, c.rect.w * k, c.rect.h * k); g.fillStyle = '#2f6fd0'; g.fillText(String(i + 1), c.rect.x * k + 4, c.rect.y * k + 16) });
    $('shAssign').hidden = false; drawCells(); msg(cells.length ? '' : 'ตัดไม่ได้ชิ้นไหนเลย — ลองเปลี่ยนวิธีตัดหรือปิด "ลบพื้นหลัง"');
  }
  function fill() { const view = $('shView').value, seq = PRESETS[$('shPreset').value], m = $('shMirrorAll').checked; cells.forEach(c => { c.target = ''; c.mirror = false }); cells.slice(0, seq.length).forEach((c, i) => { c.target = seq[i] + '|' + view; c.mirror = m }); drawCells() }
  function drawCells() {
    const box = $('shCells'), opts = '<option value="">— ไม่นำเข้า —</option>' + actsNow().map(([a, n]) => `<optgroup label="${n}">${viewsNow().map(v => `<option value="${a}|${v}">${n} · ${v}</option>`).join('')}</optgroup>`).join('');
    box.innerHTML = cells.map((c, i) => `<div class="shc${c.target ? ' on' : ''}" data-i="${i}"><b>ช่อง ${i + 1}</b> <small>${c.trim.width}×${c.trim.height}</small><canvas></canvas><select data-t>${opts}</select><label><input type="checkbox" data-m ${c.mirror ? 'checked' : ''}${c.target ? '' : ' disabled'}> ↔ ทิศตรงข้ามด้วย</label></div>`).join('');
    box.querySelectorAll('.shc').forEach(el => { const i = +el.dataset.i, c = cells[i], cv = el.querySelector('canvas'); cv.width = 240; cv.height = 240; const k = Math.min(230 / c.trim.width, 230 / c.trim.height); cv.getContext('2d').drawImage(c.trim, (240 - c.trim.width * k) / 2, 235 - c.trim.height * k, c.trim.width * k, c.trim.height * k);
      const sel = el.querySelector('[data-t]'); sel.value = c.target; sel.onchange = () => { c.target = sel.value; if (!c.target) c.mirror = false; drawCells() }; el.querySelector('[data-m]').onchange = e => { c.mirror = e.target.checked } });
    const n = cells.filter(c => c.target).length; $('shApply').disabled = !n || busy; $('shApply').textContent = n ? `นำเข้า ${n} ช่อง` : 'นำเข้า';
  }

  /* ---------------- writing ---------------- */
  const stamp = () => Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  async function apply() {
    if (busy) return; const e = entityNow(); if (!e) return msg('เลือกตัวละครก่อน');
    if (typeof dir === 'undefined' || !dir) return msg('ต้องเชื่อม GitHub / โฟลเดอร์เกมก่อน (ปุ่มด้านบน)');
    const chosen = cells.filter(c => c.target); if (!chosen.length) return; busy = true; $('shApply').disabled = true;
    try {
      /* one scale for the whole sheet (the tallest / widest piece fills the box) */
      if (monMode) { await applyMonster(e, chosen); return }
      const common = $('shCommon').checked, all = common ? cells : null, kAll = common ? Math.min(BOX_W / Math.max(...all.map(c => c.trim.width)), BOX_H / Math.max(...all.map(c => c.trim.height))) : null;
      const kOf = c => kAll ?? Math.min(BOX_W / c.trim.width, BOX_H / c.trim.height), ms = Math.max(20, +$('shMs').value || 100);
      /* group: slot → pieces in reading order; mirrored pieces also feed the opposite slot */
      const groups = new Map(), add = (slot, canvas) => { if (!groups.has(slot)) groups.set(slot, []); groups.get(slot).push(canvas) };
      for (const c of chosen) { const [a, v] = c.target.split('|'), walkLike = a === 'walk'; const cv = place(c.trim, kOf(c), walkLike || chosen.filter(x => x.target === c.target).length > 1); add(c.target, cv); if (c.mirror) add(a + '|' + OPP[v], flipped(cv)) }
      const out = []; const st = stamp();
      for (const [slot, frames] of groups) { const [a, v] = slot.split('|'); out.push(e.id === 'hero' ? await writeHero(a, v, frames, ms, st) : await writeAlly(e, a, v, frames, ms, st)) }
      try { window.StudioVariants?.syncStatuses?.(M) } catch (x) { }
      await saveManifest(); B().invalidate(); msg('นำเข้าแล้ว ' + groups.size + ' ช่อง: ' + out.join(' · ') + ' — กด Push เพื่อส่งขึ้นเกม'); toast('นำเข้าชีท ' + groups.size + ' ช่อง');
    } catch (err) { msg('นำเข้าไม่สำเร็จ: ' + err.message); console.error(err) } finally { busy = false; drawCells() }
  }
  const png = cv => new Promise((res, rej) => cv.toBlob(b => b ? res(b) : rej(new Error('สร้าง PNG ไม่ได้')), 'image/png'));
  async function newFrames(prefix, frames, st, meta) { const assets = [], cfg = { version: 1, canvas: [SIZE, SIZE], anchor: [.5, .9375], loop: true, createdAt: new Date().toISOString(), frames: [] };
    for (let i = 0; i < frames.length; i++) { const path = `assets/tactics/imported/${prefix}-${st}/frame-${String(i + 1).padStart(2, '0')}.png`; await queue(async () => writeFile(path, await png(frames[i])));
      const id = `${meta.idPrefix}-${st}-${i + 1}`, a = { id, file: path, category: meta.category, status: 'final', size: [SIZE, SIZE], transparent: true, view: meta.view, pose: meta.pose, frame: i + 1, frames: frames.length, ms: meta.ms, pivot: [.5, .9375], artRevision: st, ...meta.extra }; assets.push(a); cfg.frames.push({ assetId: id, src: path, ms: meta.ms }) }
    M.assets.push(...assets); return cfg }
  async function writeHero(action, view, frames, ms, st) {
    const walk = action === 'walk', d = view.toLowerCase(), meta = { idPrefix: `studio-hero-${d}-${action}`, category: 'tactics-hero', view, pose: action, ms: walk ? ms : 120, extra: { [walk ? 'studioImportedWalk' : 'studioImportedPose']: true, studioOwner: { id: 'hero', name: 'ตัวหลัก · Hero', group: 'characters' } } };
    const cfg = await newFrames(`${action}-${d}`, frames, st, meta);
    if (!frames.length) return '';
    if (walk) { M.studioWalks ||= {}; M.studioWalks[view] = cfg; if (M.studioWalkMirrors) { delete M.studioWalkMirrors[view]; for (const k of Object.keys(M.studioWalkMirrors)) if (M.studioWalkMirrors[k] === view && k !== OPP[view]) { /* keep links that point at this set */ } } }
    else { M.studioPoses ||= {}; M.studioPoses[action] ||= {}; M.studioPoses[action][view] = cfg; M.studioPoseMirrors ||= {}; M.studioPoseMirrors[action] ||= {}; delete M.studioPoseMirrors[action][view] }
    return 'ตัวหลัก ' + slotLabel(action + '|' + view) + ' ' + frames.length + ' เฟรม';
  }
  async function writeAlly(e, action, view, frames, ms, st) {
    const k = e.id.replace(/^ally:/, ''), d = view.toLowerCase();
    if (action === 'walk' || frames.length > 1) {   // a frame set: the ally walk sets
      if (action !== 'walk') throw new Error(slotLabel(action + '|' + view) + ': ชุดหลายเฟรมใช้ได้กับท่าเดินเท่านั้น (ท่าอื่นของเพื่อนมี 1 ภาพต่อทิศ)');
      const meta = { idPrefix: `studio-ally-${k}-${d}-walk`, category: 'allies', view, pose: 'walk', ms, extra: { studioAllyWalk: true, studioOwner: { id: e.id, name: k[0].toUpperCase() + k.slice(1), group: 'characters' } } };
      const cfg = await newFrames(`ally-${k}-walk-${d}`, frames, st, meta); M.studioAllyWalks ||= {}; M.studioAllyWalks[k] ||= {}; M.studioAllyWalks[k][view] = cfg; return k + ' เดิน ' + view + ' ' + frames.length + ' เฟรม';
    }
    /* one picture: the character's own slot for that pose × direction (created when it does not exist, with the game's file name) */
    const id = `tactics-${k}-${d}-${action}`; let a = byId(id);
    if (!a) { a = { id, file: `assets/tactics/${k}_${d}_${action}.webp`, category: 'allies', status: 'missing', size: [SIZE, SIZE], transparent: true, view, pose: action, studioOwner: { id: e.id, name: k[0].toUpperCase() + k.slice(1), group: 'characters' } }; M.assets.push(a) }
    await applyToSlot(a, { canvas: frames[0] }, { status: 'final', stamp: st, note: 'นำเข้าชีท' }); return k + ' ' + slotLabel(action + '|' + view);
  }

  /* ---------------- monsters / bosses ---------------- */
  const MSZ = 512, MFEET = Math.round(512 * .95);
  /* a piece on the 512 cell: scale k, hoof line on 0.95, centred on the body (opaque pixels), kept inside the cell */
  function placeMon(trim, k) {
    const w = Math.max(1, Math.round(trim.width * k)), h = Math.max(1, Math.round(trim.height * k)), o = document.createElement('canvas'); o.width = o.height = MSZ; const g = o.getContext('2d'); g.imageSmoothingQuality = 'high';
    const s = document.createElement('canvas'); s.width = w; s.height = h; const q = s.getContext('2d', { willReadFrequently: true }); q.imageSmoothingQuality = 'high'; q.drawImage(trim, 0, 0, w, h);
    const d = q.getImageData(0, 0, w, h).data; let sx = 0, n = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 200) { sx += x; n++ }
    const cx = n ? sx / n : w / 2; let x = Math.round(MSZ / 2 - cx); x = Math.max(2, Math.min(MSZ - w - 2, x)); g.drawImage(s, x, Math.max(0, MFEET - h)); return o;
  }
  const webp = cv => new Promise((res, rej) => cv.toBlob(b => b ? res(b) : rej(new Error('สร้าง WebP ไม่ได้')), 'image/webp', .92));
  async function applyMonster(e, chosen) {
    const kind = monKind(e), st = stamp(), ms = Math.max(20, +$('shMs').value || 0);
    /* ONE scale for the whole sheet so the animal keeps its size from pose to pose (the common-scale box is the 512 cell minus a margin) */
    const k = Math.min(488 / Math.max(...cells.map(c => c.trim.width)), 470 / Math.max(...cells.map(c => c.trim.height)));
    const groups = new Map(); for (const c of chosen) { if (!groups.has(c.target)) groups.set(c.target, []); groups.get(c.target).push(placeMon(c.trim, k)) }
    const out = [];
    for (const [slot, frames] of groups) {
      const [pose, view] = slot.split('|'), v = view.toLowerCase(), id = `enemy-anim-${kind}-${v}-${pose}`, n = frames.length, def = MON_TIMING[pose] || [200, ''];
      let a = byId(id); const file = `assets/enemies/animations/${kind}/${v}-${pose}.webp`;
      if (!a) { a = { id, subject: `${e.name} · ${slotLabel(slot)}`, file, category: 'enemy-animations', status: 'missing', enemy: kind, pose, view, transparent: true, pivot: [.5, .95], barHeight: .64, usedIn: 'สนามต่อสู้' }; M.assets.push(a) }
      const sheetCv = document.createElement('canvas'); sheetCv.width = MSZ * n; sheetCv.height = MSZ; const g = sheetCv.getContext('2d'); frames.forEach((f, i) => g.drawImage(f, i * MSZ, 0));
      const per = n > 1 && ms ? ms : def[0], old = a.animation || {}, timings = Array.from({ length: n }, (_, i) => old.timings?.length === n ? old.timings[i] : per);
      a.size = [MSZ * n, MSZ]; a.frameSize = [MSZ, MSZ]; a.animation = { columns: n, rows: 1, frames: n, timings, loop: old.loop ?? def[1] === 'loop', ...(old.impactMs != null ? { impactMs: old.impactMs } : {}) };
      a.file = a.file || file; delete a.note;
      await applyToSlot(a, { canvas: sheetCv }, { status: 'final', stamp: st, note: 'นำเข้าชีท' }); out.push(slotLabel(slot) + ' ' + n + ' เฟรม');
    }
    await saveManifest(); B().invalidate(); msg('นำเข้าแล้ว ' + groups.size + ' ช่อง: ' + out.join(' · ') + ' — กด Push เพื่อส่งขึ้นเกม'); toast('นำเข้าชีท ' + groups.size + ' ช่อง');
  }

  /* ---------------- hook into the grid ---------------- */
  function open() {
    const e = entityNow(); if (!e || (e.group !== 'characters' && !isMon(e))) return toast('เลือกตัวละคร มอนสเตอร์ หรือบอสก่อน');
    monMode = isMon(e); build();
    $('shPreset').innerHTML = monMode ? '<option value="mon4">เตรียมโจมตี → โจมตี → โดนโจมตี → ล้ม (4 ท่า เช่นชีทแพะ)</option><option value="mon6">ยืน → เดิน → เตรียมโจมตี → โจมตี → โดนโจมตี → ล้ม</option>' : '<option value="std">ยืน → เตรียมโจมตี → โจมตี → ป้องกัน → โดนโจมตี → ตาย</option><option value="walk">เดิน → ยืน → เตรียมโจมตี → โจมตี → ป้องกัน → โดนโจมตี → ตาย</option>';
    $('shView').innerHTML = viewsNow().map(v => `<option>${v}</option>`).join(''); $('shMirrorAll').parentElement.hidden = monMode; $('shMirrorAll').checked = false;
    $('shWho').innerHTML = monMode ? 'นำเข้าให้: <b>' + esc(e.name) + '</b> · ทิศ <b>SE</b> (หันหน้า) และ <b>NE</b> (หันหลัง) · SW/NW เกมพลิกให้เอง · ชิ้นหลายชิ้นที่เลือกปลายทางเดียวกัน = เฟรมของท่านั้นตามลำดับการอ่าน · เฟรม 512×512 เท้าที่ 0.95 สเกลเดียวทั้งชีท' : 'นำเข้าให้: <b>' + esc(e.name) + '</b>' + (e.id === 'hero' ? ' (รูปลักษณ์ที่เปิดอยู่)' : '') + ' · ชีทเดียวมีได้หลายท่า/หลายทิศ — แต่ละช่องเลือกปลายทางเองได้'; sheet = null; cells = []; $('shCut').hidden = $('shAssign').hidden = true; $('shPrev').hidden = true; $('shInfo').textContent = ''; $('shCells').innerHTML = ''; msg(''); $('shFile').value = ''; $('shApply').disabled = true; $('shApply').textContent = 'นำเข้า'; dlg.showModal();
  }
  function inject() { const grid = $('grid'), ctl = grid && grid.querySelector('.entity-controls'); if (!ctl || ctl.querySelector('#shImpBtn')) return; const e = entityNow(); if (!e || (e.group !== 'characters' && !isMon(e))) return; const b = document.createElement('button'); b.id = 'shImpBtn'; b.type = 'button'; b.textContent = '🧩 นำเข้าชีท'; b.title = 'ตัดชีทเดียวเป็นหลายช่อง แล้วนำเข้าหลายท่า/หลายทิศพร้อมกัน'; b.onclick = open; ctl.prepend(b) }
  window.StudioSheetImport = { _mon: () => monMode, _entity: () => entityNow()?.id, open, removeBackground, gridRects, blobRects, cropTrim, place, placeMon, _cells: () => cells, _state: () => ({ sheet }) };
  const g = $('grid'); if (g) { new MutationObserver(inject).observe(g, { childList: true }); inject() }
})();
