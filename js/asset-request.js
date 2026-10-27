/* v91.5 · "🎨 เพิ่มภาพ Asset" — type a name + a short description, the app builds an image prompt that locks the game's style,
   2.5D camera and scale, copies it to the clipboard, and keeps a window open waiting for the generated picture.
   The picture can become a NEW asset or REPLACE one that already exists (same file name). Green background is keyed out,
   the picture is trimmed, then it is saved to GitHub (if a token is set) or downloaded. */
(function () {
  'use strict';
  if (new URLSearchParams(location.search).get('edit') !== '1' || !location.pathname.endsWith('village-town.html')) return;
  const $ = (s, r = document) => r.querySelector(s), esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* kind → footprint in grid cells (one cell = a 56×28 px diamond on screen), picture aspect and a scale sentence */
  const KINDS = {
    prop: { label: 'ของตกแต่งเล็ก (ถัง กล่อง ม้านั่ง)', cu: 1, cv: 1, asp: 1.1, fill: 'about 0.8 m to 1.2 m tall in the world, i.e. roughly the height of a knee-to-waist-high object next to the 1.7 m hero', screen: 120 },
    big: { label: 'ของใหญ่ (แผงตลาด บ่อ เกวียน)', cu: 2, cv: 2, asp: 1, fill: 'about 2 m to 3 m tall in the world, clearly bigger than the hero', screen: 220 },
    tree: { label: 'ต้นไม้ / พุ่มไม้', cu: 2, cv: 2, asp: 1.5, fill: 'a tree 4 m to 6 m tall (or a bush about 1 m tall), trunk base centred on the footprint', screen: 200 },
    fence: { label: 'ชิ้นรั้ว (ต่อเป็นแถว)', cu: 2, cv: .5, asp: .75, fill: 'a low segment about 1 m tall that tiles left-right with itself: both short ends must be cut vertically and look identical so copies line up with no visible seam', screen: 110 },
    building: { label: 'อาคาร / สถานที่', cu: 8, cv: 6, asp: .95, fill: 'a building whose ground footprint is the stated diamond, door about 2 m tall (the hero is 1.7 m)', screen: 520 }
  };
  const STYLE = 'Painterly cozy-medieval fantasy, anime-leaning, clean line work, cel-shaded with soft shading, warm amber light from the upper left, forest-green and brown palette, no neon colours. Same look as the existing village buildings and props.';
  const pxOf = (k, f = {}) => { const K = KINDS[k], base = Math.min(1536, Math.round(((f.cu ?? K.cu) + (f.cv ?? K.cv)) * 28 * 4 / 16) * 16); return { w: Math.max(256, base), h: Math.max(256, Math.round(Math.max(256, base) * K.asp / 16) * 16) } };

  function buildPrompt(f) {
    const K = KINDS[f.kind], px = pxOf(f.kind, f), cu = f.cu ?? K.cu, cv = f.cv ?? K.cv, name = f.name.trim() || '(name)', desc = f.desc.trim();
    return [
      `Create ONE game asset: "${name}"${desc ? ' — ' + desc : ''}${f.placeName ? ` (the building of the village place "${f.placeName}")` : ''}.`,
      `STYLE: ${STYLE}`,
      `CAMERA: 2.5D isometric 3/4 view, looking down at about 30°, the same camera as the game's buildings (a 2:1 dimetric tile: one ground cell is a diamond twice as wide as tall). The object stands on the ground; its footprint is a ${cu}×${cv} cell diamond. Ground lines run at about ±26.57° from horizontal (true 2:1 dimetric, never a steeper or flatter angle).`,
      `LIGHT: one key light from the upper left (warm amber, late-afternoon), soft cel-shaded shadows falling toward the lower right, a faint cool-green fill from the right; no glow or lens flare. Same direction and colour temperature as the rest of the village.`,
      f.facing ? `FACING: the main door and front of the building face the ${f.facing === 'SE' ? 'lower-right' : 'lower-left'} of the picture; the roof ridge runs along the other diagonal.` : '',
      `SCALE: ${K.fill}. The picture is shown in the game at about ${K.screen} px wide.`,
      `CANVAS: ${px.w}×${px.h} px. Solid pure green background #00FF00 (it will be removed), no ground plate, no cast-shadow plate, nothing cropped. Centre the object horizontally and let its base touch the bottom edge.`,
      `FORBIDDEN: text, logos, frames, borders, watermarks, people (unless asked), a second object.`,
      f.mode === 'replace' ? `REFERENCE: the attached image is the current version of this asset. Keep its role, proportions, camera and colours so it still fits the scene; redraw it cleaner/better${desc ? ' as described above' : ''}.` : `REFERENCE: attach 1–2 existing village images (e.g. a bench or a building) so the style matches.`
    ].filter(Boolean).join('\n');
  }

  const slug = t => t.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 30);
  const loadImg = src => new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(new Error('อ่านภาพไม่ได้')); i.src = src });

  /* key out a green background (only if the corners are green), then trim to the visible part */
  function process(img) {
    const MAXD = 1400, k = Math.min(1, MAXD / Math.max(img.naturalWidth, img.naturalHeight)), w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k),
      c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h), a = d.data, corner = (i, j) => { const o = (j * w + i) * 4; return a[o + 3] > 200 && a[o + 1] > 170 && a[o] < 110 && a[o + 2] < 110 };
    let keyed = false;
    if (corner(0, 0) && corner(w - 1, 0) && (corner(0, h - 1) || corner(w - 1, h - 1))) {
      keyed = true;
      for (let o = 0; o < a.length; o += 4) { const g = a[o + 1] - Math.max(a[o], a[o + 2]); if (g > 70) a[o + 3] = 0; else if (g > 25) { a[o + 3] = Math.round(a[o + 3] * (70 - g) / 45); a[o + 1] = Math.max(a[o], a[o + 2]) } }
      x.putImageData(d, 0, 0)
    }
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (a[(j * w + i) * 4 + 3] > 12) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j }
    if (x1 < x0) return { canvas: c, keyed, empty: true };
    const m = 2, X0 = Math.max(0, x0 - m), Y0 = Math.max(0, y0 - m), W = Math.min(w, x1 + m + 1) - X0, H = Math.min(h, y1 + m + 1) - Y0, o = document.createElement('canvas');
    o.width = W; o.height = H; o.getContext('2d').drawImage(c, X0, Y0, W, H, 0, 0, W, H);
    return { canvas: o, keyed, empty: false }
  }

  let win = null, result = null, ctx = null, applyCtx = null;
  /* open() = the generic asset window · open({preset:'building', place, placeName, current, cu, cv, facing}) = from the "เปลี่ยนภาพ" picker of a place */
  function open(opts) {
    ctx = opts && opts.preset ? opts : null;
    if (win) { win.style.display = 'block'; applyCtx && applyCtx(); return }
    const st = document.createElement('style');
    st.textContent = `#arWin{position:fixed;left:14px;top:96px;z-index:30;width:430px;max-height:calc(100dvh - 120px);overflow:auto;background:#172a23f2;color:#eef2dc;border:1px solid #6f8b5b;border-radius:12px;padding:12px 14px;box-shadow:0 10px 40px #0009;font:13px/1.45 system-ui,sans-serif}
#arWin h3{margin:0 0 6px;font-size:15px;color:#fff0c7;display:flex;justify-content:space-between;align-items:center}#arWin label{display:block;margin:7px 0 2px;color:#b9c9b0;font-size:12px}
#arWin input,#arWin select,#arWin textarea{width:100%;box-sizing:border-box;background:#0f1d18;color:#eef2dc;border:1px solid #4d6656;border-radius:7px;padding:6px 8px;font:inherit}#arWin textarea{height:150px;font-size:11.5px;line-height:1.35}
#arWin button{background:#2c4a3c;color:#eef2dc;border:1px solid #6f8b5b;border-radius:8px;padding:6px 10px;cursor:pointer;font:inherit}#arWin button.pri{background:#d9b66b;color:#2a2113;border-color:#d9b66b;font-weight:600}#arWin button:disabled{opacity:.45;cursor:default}
#arWin .row{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:6px 0}#arWin .row>*{flex:1}#arWin .seg button{flex:1}#arWin .seg button.on{background:#d9b66b;color:#2a2113}
#arDrop{border:2px dashed #6f8b5b;border-radius:10px;padding:14px;text-align:center;color:#b9c9b0;margin:8px 0;cursor:pointer}#arDrop.over{background:#2c4a3c}
#arPrev{background:conic-gradient(#3a4a42 25%,#2b3a33 0 50%,#3a4a42 0 75%,#2b3a33 0) 0 0/16px 16px;border-radius:8px;text-align:center;padding:6px;margin:6px 0}#arPrev img{max-width:100%;max-height:200px}
#arMsg{min-height:18px;color:#f2d98a;font-size:12px}`;
    document.head.append(st);
    win = document.createElement('div'); win.id = 'arWin';
    win.innerHTML = `<h3>🎨 เพิ่มภาพ Asset <button id="arX" title="ปิด" style="flex:0">✕</button></h3>
<div class="row seg"><button data-mode="new" class="on">✨ เป็น asset ใหม่</button><button data-mode="replace">♻ ทับของเดิม</button></div>
<div id="arTarget" hidden><label>เลือก asset ที่จะทับ</label><select id="arSel"></select></div>
<div id="arNameBox"><label>ชื่อ asset</label><input id="arName" placeholder="เช่น ถังไม้ใส่น้ำ / wooden water barrel"></div>
<label>คำอธิบายสั้นๆ</label><input id="arDesc" placeholder="เช่น ถังไม้มีห่วงเหล็ก มีน้ำเต็ม มีมอสนิดหน่อย">
<label id="arApplyBox" hidden style="display:flex;gap:6px;align-items:center"><input id="arApply" type="checkbox" checked style="width:auto"> ใช้ภาพนี้กับสถานที่นี้ทันที</label>
<div class="row"><div><label>ประเภท (กำหนดขนาด/สเกล)</label><select id="arKind">${Object.entries(KINDS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join('')}</select></div>
<div id="arIdBox"><label>รหัสไฟล์ (a-z 0-9 -)</label><input id="arId" placeholder="water-barrel"></div></div>
<label>prompt สำหรับ AI วาดภาพ</label><textarea id="arPrompt" readonly></textarea>
<div class="row"><button class="pri" id="arCopy">📋 คัดลอก prompt</button></div>
<div id="arDrop">⬇ รอรับภาพ — วางภาพ (Ctrl+V) · ลากไฟล์มาวาง · หรือคลิกเลือกไฟล์<input type="file" id="arFile" accept="image/*" hidden></div>
<div id="arPrev" hidden><img alt=""></div>
<div class="row"><button id="arSave" class="pri" disabled>💾 บันทึก</button></div><div id="arMsg"></div>`;
    document.body.append(win);
    const f = { mode: 'new', kind: 'prop', name: '', desc: '' }, q = s => $(s, win), msg = t => q('#arMsg').textContent = t || '';
    const decors = () => ctx?.preset === 'building' ? (window.VillageAssetEdit?.buildingList?.() || []) : (window.VillageAssetEdit?.decorList?.() || []);
    const fillSel = () => { q('#arSel').innerHTML = decors().map(d => `<option value="${d.id}">${esc(d.name)} · ${d.id}</option>`).join('') };
    fillSel();
    const refresh = () => {
      const rep = f.mode === 'replace';
      q('#arTarget').hidden = !rep; q('#arNameBox').hidden = rep; q('#arIdBox').hidden = rep;
      if (rep) { const d = decors().find(x => x.id === q('#arSel').value); f.name = d?.name || ''; }
      q('#arPrompt').value = buildPrompt(f); q('#arSave').disabled = !result || (!rep && !(q('#arId').value || slug(q('#arName').value)))
    };
    win.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => { f.mode = b.dataset.mode; win.querySelectorAll('[data-mode]').forEach(x => x.classList.toggle('on', x === b)); refresh() });
    q('#arName').oninput = () => { f.name = q('#arName').value; if (!q('#arId').dataset.t) q('#arId').value = slug(f.name); refresh() };
    q('#arId').oninput = () => { q('#arId').dataset.t = '1'; q('#arId').value = q('#arId').value.toLowerCase().replace(/[^a-z0-9-]/g, ''); refresh() };
    q('#arDesc').oninput = () => { f.desc = q('#arDesc').value; refresh() };
    q('#arKind').onchange = () => { f.kind = q('#arKind').value; refresh() };
    q('#arSel').onchange = refresh;
    q('#arCopy').onclick = async () => { try { await navigator.clipboard.writeText(q('#arPrompt').value); msg('คัดลอกแล้ว — เอาไปให้ AI วาดภาพ แล้วกลับมาวางภาพที่ช่องด้านล่าง') } catch (e) { q('#arPrompt').select(); document.execCommand('copy'); msg('คัดลอกแล้ว') } };
    q('#arX').onclick = () => { win.style.display = 'none' };
    const take = async file => {
      if (!file || !/^image\//.test(file.type)) return msg('ไม่ใช่ไฟล์ภาพ');
      try {
        const url = URL.createObjectURL(file), img = await loadImg(url), r = process(img); URL.revokeObjectURL(url);
        if (r.empty) return msg('ภาพว่างเปล่า (ไม่เหลือส่วนที่มองเห็น)');
        result = r; q('#arPrev').hidden = false; q('#arPrev img').src = r.canvas.toDataURL('image/png');
        msg((r.keyed ? 'ลบพื้นเขียวแล้ว · ' : 'ใช้พื้นโปร่งใสเดิม · ') + 'ตัดขอบเหลือ ' + r.canvas.width + '×' + r.canvas.height + ' px'); refresh()
      } catch (e) { msg(e.message) }
    };
    const drop = q('#arDrop'), file = q('#arFile');
    drop.onclick = () => file.click(); file.onchange = () => take(file.files[0]);
    drop.ondragover = e => { e.preventDefault(); drop.classList.add('over') }; drop.ondragleave = () => drop.classList.remove('over');
    drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); take(e.dataTransfer.files[0]) };
    document.addEventListener('paste', e => { if (win.style.display === 'none') return; const it = [...(e.clipboardData?.items || [])].find(i => /^image\//.test(i.type)); if (it) { e.preventDefault(); take(it.getAsFile()) } });
    q('#arSave').onclick = async () => {
      if (!result) return;
      const rep = f.mode === 'replace', id = rep ? q('#arSel').value : (q('#arId').value || slug(q('#arName').value)), name = rep ? f.name : (q('#arName').value.trim() || id);
      if (!/^[a-z0-9-]{2,40}$/.test(id)) return msg('รหัสไฟล์ต้องเป็น a-z 0-9 - (2–40 ตัว)');
      if (!rep && decors().some(d => d.id === id)) return msg('รหัสนี้มีอยู่แล้ว — เลือก "ทับของเดิม" หรือเปลี่ยนรหัส');
      const bld = ctx?.preset === 'building', VE = window.VillageAssetEdit;
      const blob = await new Promise(ok => result.canvas.toBlob(ok, 'image/png')), path = bld ? (rep ? (VE.buildingPath?.(id) || 'assets/village-town/' + id + '.png') : 'assets/village-town/buildings/' + id + '.png') : 'assets/village-town/decor/' + id + '.png', K = KINDS[f.kind];
      const im = await loadImg(URL.createObjectURL(blob));
      if (bld) VE.buildingReady(id, name, rep ? (decors().find(d => d.id === id)?.w || K.screen) : K.screen, im, { place: q('#arApply').checked ? ctx.place : null });
      else VE.assetReady(id, name, rep ? (decors().find(d => d.id === id)?.w || K.screen) : K.screen, im);
      msg('ใช้ในหมู่บ้านแล้ว · กำลังส่งไฟล์…');
      try {
        if (window.GitHubPush?.config().token) {
          const sha = await GitHubPush.commit('Village asset ' + (rep ? 'replaced' : 'added') + ': ' + id, async () => [{ path, content: blob }], m => msg(m));
          msg('⬆ push ภาพแล้ว (' + (sha || '') + ') · ' + (rep ? 'ทับ ' : 'เพิ่ม ') + path + (rep ? '' : ' · กด ⬆ push ที่แถบบนอีกครั้งเพื่อส่งการลงทะเบียน asset ในผัง'))
        } else {
          const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = id + '.png'; a.click();
          msg('ยังไม่ได้ตั้ง GitHub token → ดาวน์โหลด ' + id + '.png แล้ว · เอาไปไว้ที่ ' + path)
        }
      } catch (e) { msg('ใช้ในหมู่บ้านแล้ว แต่ส่งไฟล์ไม่สำเร็จ: ' + e.message) }
    };
    applyCtx = () => {
      const bld = ctx?.preset === 'building';
      Object.assign(f, { cu: bld ? ctx.cu : undefined, cv: bld ? ctx.cv : undefined, facing: bld ? ctx.facing : undefined, placeName: bld ? ctx.placeName : undefined });
      if (bld) { f.kind = 'building'; q('#arKind').value = 'building' }
      q('#arKind').disabled = bld; q('#arApplyBox').hidden = !bld;
      q('h3').firstChild.textContent = bld ? '🎨 เพิ่มภาพอาคาร · ' + (ctx.placeName || '') + ' ' : '🎨 เพิ่มภาพ Asset ';
      fillSel(); if (bld && ctx.current && [...q('#arSel').options].some(o => o.value === ctx.current)) q('#arSel').value = ctx.current;
      if (bld && f.mode === 'new' && !q('#arName').value) { q('#arName').value = (ctx.placeName || '') + ' (แบบใหม่)'; f.name = q('#arName').value }
      refresh()
    };
    applyCtx()
  }

  let tries = 0;
  const t = setInterval(() => {
    const add = $('#addPlaceBtn');
    if ((!add || !add.closest('#townTools')) && ++tries < 80) return;
    clearInterval(t);
    if (!add || $('#addAssetBtn')) return;
    const b = document.createElement('button'); b.id = 'addAssetBtn'; b.type = 'button';
    b.className = add.className; b.textContent = '🎨 เพิ่มภาพ Asset'; b.title = 'พิมพ์ชื่อ+คำอธิบาย → app ทำ prompt ให้ → เอาไปให้ AI วาด → วางภาพกลับมา';
    b.onclick = open; add.after(b)
  }, 150);
  window.AssetRequest = { buildPrompt, open, KINDS };
})();
