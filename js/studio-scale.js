/* v97.67 · Asset Studio · ⚖ scale check + helpers for the frame editor (standards: js/character-scale.js) */
(function (root) {
  'use strict';
  const KEY = 'project-a-char-scale-v1', DIRS = ['SW', 'NW', 'NE', 'SE'], POSES = ['idle', 'walk', 'windup', 'strike', 'guard', 'hit', 'down'];
  const cfg = () => root.CHARACTER_SCALE || { characters: {}, tolerance: .06, drawSize: CharSize.DRAW };
  const over = () => { try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} } };
  function standard(ch, ctx, dir) {
    const o = over()?.[ch]?.[ctx]?.[dir]; if (o) return { v: o, src: 'ตั้งเองในเครื่อง' };
    const b = cfg().characters?.[ch]?.[ctx]?.[dir]; return b ? { v: b, src: 'ค่ามาตรฐาน' } : null;
  }
  function setStandard(ch, ctx, dir, v) { const o = over(); ((o[ch] ||= {})[ctx] ||= {})[dir] = Math.round(v); localStorage.setItem(KEY, JSON.stringify(o)) }
  function measure(src) {
    const w = src.width || src.naturalWidth, h = src.height || src.naturalHeight, c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(src, 0, 0); const d = g.getImageData(0, 0, w, h).data;
    const rowHas = y => { for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) return true; return false };
    let y0 = -1, y1 = -1; for (let y = 0; y < h; y++) if (rowHas(y)) { y0 = y; break } if (y0 < 0) return null; for (let y = h - 1; y >= 0; y--) if (rowHas(y)) { y1 = y; break }
    const H = y1 - y0 + 1; let lo = w, hi = -1;
    for (let y = y0; y < y0 + Math.max(1, Math.floor(H * .2)); y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) { if (x < lo) lo = x; if (x > hi) hi = x }
    return { head: hi - lo + 1, height: H, w, h, top: y0, bottom: y1 + 1 };
  }
  function whoIs(entity) {
    const id = typeof entity === 'string' ? entity : entity?.id || ''; if (/^hero/.test(id)) return { ch: 'hero', ctx: 'battle', name: 'ตัวหลัก · Hero' };
    const m = /^ally:([a-z]+)/.exec(id); return m ? { ch: m[1], ctx: 'battle', name: m[1][0].toUpperCase() + m[1].slice(1) } : null;
  }
  const load = file => root.StudioBrowser?.loadImage ? root.StudioBrowser.loadImage(file) : new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = file });
  /* every picture of a character, grouped by context / pose / direction */
  function collect(ch) {
    const out = [], rt = root.StudioBrowser?.getRuntime?.().tactics;
    if (ch === 'hero') {
      const sets = {}; for (const dir of DIRS) { const D = rt?.directions?.[dir]; if (!D) continue; for (const pose of POSES) {
        const ff = pose === 'walk' ? (D.walk?.length ? D.walk : [D['walk-left'], D['walk-right']].filter(Boolean)) : (D[pose + 'Frames']?.length ? D[pose + 'Frames'] : [D[pose]]).filter(Boolean);
        if (ff.length) (sets[pose] ||= {})[dir] = ff.map(f => ({ src: f.src, flip: !!f.flipImage })) } }
      out.push({ ctx: 'battle', label: 'สนามรบ / ในเมือง (ภาพฮีโร่ชุดเดียวกัน)', sets });
    } else {
      const b = {}; for (const dir of DIRS) for (const pose of POSES) if (pose !== 'walk') (b[pose] ||= {})[dir] = [{ src: `assets/tactics/${ch}_${dir.toLowerCase()}_${pose}.webp`, flip: false }];
      out.push({ ctx: 'battle', label: 'สนามรบ', sets: b });
      const v = {}; for (const dir of DIRS) { (v.stand ||= {})[dir] = [{ src: `assets/village-town/npc/${ch}/${dir.toLowerCase()}-stand.webp`, flip: false }]; (v.walk ||= {})[dir] = [1, 2, 3, 4].map(n => ({ src: `assets/village-town/npc/${ch}/${dir.toLowerCase()}-walk${n}.webp`, flip: false })) }
      out.push({ ctx: 'village', label: 'หมู่บ้าน / ห้องภายใน', sets: v });
    }
    return out;
  }
  /* v98.265 · the first frame of the standing clip is the reference (it is the picture ⚖ Scale Lineup measures); every other clip of the same character and direction is scaled so its first frame has the same HEAD width.
     (head width, not height; only WALK clips — in windup / strike / hit / down the top of the silhouette is a raised arm or a lying body, not the head, so a head measure there is wrong) — uses the studio's own batchScale, so each clip is saved as a normal revision and can be restored. */
  async function alignToIdle(who, out) {
    const U = root.StudioUnifiedReview; if (!U?.allClips) { out.textContent = 'ยังไม่พร้อม'; return }
    const id = who.ch === 'hero' ? 'hero' : 'ally:' + who.ch, clips = U.allClips().filter(c => (c.entity === id || (id === 'hero' && /^runtime:hero:/.test(c.id))) && c.frames?.length && !c.frames[0].crop), headOf = async c => { const im = await load(c.frames[0].file); const m = im && measure(im); return m && m.head };
    const plan = []; for (const view of DIRS) { const ref = clips.find(c => c.view === view && c.action === 'idle'); if (!ref) continue; const rh = await headOf(ref); if (!rh) continue;
      for (const c of clips) { if (c === ref || c.view !== view || c.action !== 'walk') continue; const h = await headOf(c); if (!h) continue; const pct = Math.round((rh / h - 1) * 100); if (Math.abs(pct) >= 2 && Math.abs(pct) <= 50) plan.push({ c, pct }) } }
    if (!plan.length) { out.textContent = 'ทุกท่าหัวเท่าท่ายืนอยู่แล้ว (ต่างไม่ถึง 2%)'; return }
    if (!confirm('ปรับสเกล ' + plan.length + ' ชุดท่าเดิน ให้หัวเท่าท่ายืน?\n\n' + plan.slice(0, 12).map(x => x.c.action + ' ' + x.c.view + ' ' + (x.pct > 0 ? '+' : '') + x.pct + '%').join('\n') + (plan.length > 12 ? '\n…' : '') + '\n\nบันทึกทีละชุด กู้ชุดก่อนหน้าได้')) return;
    let done = 0; for (const { c, pct } of plan) { try { out.textContent = 'กำลังปรับ ' + (++done) + '/' + plan.length + ' · ' + c.action + ' ' + c.view; await U.batchScale([c.id], pct) } catch (e) { out.textContent = 'หยุดที่ ' + c.action + ' ' + c.view + ': ' + e.message; return } }
    out.textContent = 'ปรับแล้ว ' + plan.length + ' ชุดท่า · เปิด ⚖ ตรวจสเกลใหม่เพื่อดูผล';
  }
  /* v98.270 · a one-line warning under the character's name in the Animation tab: feet not at the standard row (CharSize.FEET_Y) in a standing picture, or a clip whose first frame has a head more than 5 % off the standing picture (same direction). Silent when everything is fine. */
  async function quickCheck(e) {
    const clips = (e?.clips || []).filter(c => c.frames?.length && !c.frames[0].crop && DIRS.includes(c.view) && !c.frames[0].flip), cache = new Map(), first = async c => { const f = c.frames[0].file; if (!cache.has(f)) cache.set(f, load(f).then(im => im && measure(im))); return cache.get(f) };
    const feet = [], head = []; for (const view of DIRS) { const idle = clips.find(c => c.view === view && c.action === 'idle'); if (!idle) continue; const mi = await first(idle); if (!mi) continue;
      if (Math.abs(mi.bottom - CharSize.FEET_Y) > 3) feet.push(view + ' ' + (CharSize.FEET_Y - mi.bottom > 0 ? '+' : '') + (CharSize.FEET_Y - mi.bottom) + 'px');
      for (const c of clips) { if (c === idle || c.view !== view || c.action !== 'walk') continue; const m = await first(c); if (m && Math.abs(m.head / mi.head - 1) > .05) head.push(c.action + ' ' + view + ' ' + Math.round((m.head / mi.head - 1) * 100) + '%') } }
    const out = []; if (feet.length) out.push('เท้าไม่ตรงมาตรฐาน (ต้องเลื่อน): ' + feet.join(', ')); if (head.length) out.push('หัวต่างจากท่ายืน >5%: ' + head.slice(0, 6).join(', ') + (head.length > 6 ? ' …' : '')); return out.join(' · ');
  }
  async function openReport(entity) {
    const who = whoIs(entity); const dlg = document.getElementById('scaleReport') || (() => { const d = document.createElement('dialog'); d.id = 'scaleReport'; d.style.cssText = 'max-width:min(1100px,96vw);width:96vw;border:1px solid #b9ae93;border-radius:10px;padding:16px;background:#fffdf6;color:#233'; document.body.appendChild(d); return d })();
    if (!who) { dlg.innerHTML = '<h3>⚖ ตรวจสเกล</h3><p>ตอนนี้ตรวจได้เฉพาะตัวหลักและเพื่อนร่วมทีม (มอนสเตอร์ยังไม่รองรับ)</p><button onclick="this.closest(\'dialog\').close()">ปิด</button>'; dlg.showModal(); return }
    dlg.innerHTML = `<h3>⚖ ตรวจสเกล · ${who.name}</h3><p id="scProg">กำลังวัด…</p><div id="scBody"></div><div class="row" style="margin-top:10px;display:flex;gap:8px"><button id="scCopy">คัดลอก JSON ที่ตั้งเองในเครื่อง</button><button id="scAlign" title="เทียบความกว้างหัวของเฟรมแรกของท่าเดิน กับเฟรมแรกของท่ายืน (ทิศเดียวกัน) แล้วปรับสเกลชุดท่าเดินให้เท่ากัน">⚖ จัดหัวท่าเดินให้เท่าท่ายืน</button><button onclick="this.closest('dialog').close()">ปิด</button></div>`;
    if (!dlg.open) dlg.showModal(); const T = cfg().tolerance || .06; let html = '', n = 0, total = 0; const groups = collect(who.ch);
    for (const g of groups) for (const pose in g.sets) for (const dir in g.sets[pose]) total += g.sets[pose][dir].length;
    let idleH = {};
    for (const g of groups) {
      let rows = ''; const stdRow = DIRS.map(d => { const s = standard(who.ch, g.ctx, d); return `<td title="${s ? s.src : ''}">${s ? s.v + ' px' : '—'}</td>` }).join('');
      for (const pose in g.sets) {
        let cells = '';
        for (const dir of DIRS) {
          const files = g.sets[pose][dir]; if (!files) { cells += '<td style="color:#999">—</td>'; continue }
          const std = standard(who.ch, g.ctx, dir), ms = []; for (const fo of files) { const f = fo.src || fo; const im = await load(f); n++; document.getElementById('scProg').textContent = `กำลังวัด… ${n}/${total}`; if (!im) continue; const m = measure(im); if (m) ms.push(m) }
          if (!ms.length) { cells += '<td style="color:#999">ไม่มีไฟล์</td>'; continue }
          if (pose === 'idle' || pose === 'stand') idleH[dir] = idleH[dir] || ms[0].height;
          const heads = ms.map(m => m.head), lo = Math.min(...heads), hi = Math.max(...heads);
          if (!std) { cells += `<td title="ยังไม่มีมาตรฐาน">${lo === hi ? lo : lo + '–' + hi} px</td>`; continue }
          const rl = lo / std.v, rh = hi / std.v, worst = Math.max(Math.abs(rl - 1), Math.abs(rh - 1)), col = worst <= T ? '#d9efd2' : worst <= 2 * T ? '#fbe9b8' : '#f4c7bf';
          cells += `<td style="background:${col}" title="หัว ${heads.join(', ')} px · มาตรฐาน ${std.v} px">${Math.round(rl * 100)}${rl === rh ? '' : '–' + Math.round(rh * 100)}%</td>`;
        }
        rows += `<tr><th style="text-align:left">${pose}</th>${cells}</tr>`;
      }
      html += `<h4>${g.label}</h4><table style="border-collapse:collapse;width:100%;text-align:center" border="1" cellpadding="4"><thead><tr><th>ท่า / ทิศ</th>${DIRS.map(d => `<th>${d}</th>`).join('')}</tr><tr style="background:#eef0e6"><th style="text-align:left">มาตรฐานหัว</th>${stdRow}</tr></thead><tbody>${rows}</tbody></table>`;
    }
    let heroH = null; if (who.ch !== 'hero') { try { const f = (root.StudioBrowser.getRuntime().tactics?.directions?.SW?.idleFrames?.[0] || root.StudioBrowser.getRuntime().tactics?.directions?.SW?.idle)?.src, im = f && await load(f), m = im && measure(im); heroH = m && m.height } catch { } }
    const ds = cfg().drawSize || CharSize.DRAW, mine = idleH.SW || idleH.SE;
    const rel = who.ch !== 'hero' && heroH && mine ? `<p><b>ความสูงตัวบนจอ (ท่ายืน) เทียบฮีโร่:</b> ${Math.round(mine / 384 * ds.ally / (heroH / 384 * ds.hero) * 100)}% <small>(คำนวณจากภาพยืนทิศ SW × ขนาดที่เกมวาด · ปรับค่าสัมพัทธ์ได้ที่ js/character-scale.js)</small></p>` : '';
    document.getElementById('scProg').innerHTML = `วัดแล้ว ${n} ภาพ · <span style="background:#d9efd2;padding:0 6px">ตรงมาตรฐาน ±${Math.round(T * 100)}%</span> <span style="background:#fbe9b8;padding:0 6px">เบี่ยง ≤${Math.round(2 * T * 100)}%</span> <span style="background:#f4c7bf;padding:0 6px">เบี่ยงมาก</span> · ตัวเลข = หัวกว้างเทียบมาตรฐาน`;
    document.getElementById('scBody').innerHTML = html + rel;
    document.getElementById('scAlign').onclick = () => alignToIdle(who, document.getElementById('scProg'));
    document.getElementById('scCopy').onclick = async () => { const t = JSON.stringify(over(), null, 1); try { await navigator.clipboard.writeText(t) } catch { } document.getElementById('scProg').textContent = 'คัดลอกแล้ว (' + t.length + ' ตัวอักษร) ส่งให้ผมเพื่อใส่ใน js/character-scale.js ได้' };
  }
  root.StudioScale = { quickCheck, measure, standard, setStandard, whoIs, openReport, collect };
})(globalThis);
