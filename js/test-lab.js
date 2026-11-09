/* v98.287 · 🧪 Test lab (village editor only) — walk the hero around the piece you selected and SEE collision / in-front-behind / see-through, with the real renderer.
   Opened from "⋯ เพิ่มเติม → 🧪 ห้องทดสอบ". Buttons:
     · เดินรอบชิ้นที่เลือก  — the hero walks a loop 1.4 cells outside the piece's ORDER footprint (the same box the draw order uses) — you watch what covers whom
     · วางตัวละครหน้าชิ้น   — stands the hero just in front of it (still image check)
     · เส้นกรอบ             — ?depth=1 view: blue = order footprint of each part, green = walker feet, number = draw order
     · การบัง               — the global DepthStyle settings, live: tall/low look + the see-through amount
   It needs the walk test (▶ ทดสอบ): the lab turns it on by itself and leaves editing exactly as it was when you press "ปิด". */
(function () {
  'use strict';
  if (new URLSearchParams(location.search).get('edit') !== '1' || !location.pathname.endsWith('village-town.html')) return;
  const $ = s => document.querySelector(s);
  let box = null, we = false, lastKey = null;
  const AE = () => window.VillageAssetEdit, DS = () => window.DepthStyle;

  /* the selected piece: its footprint on the grid (the order box = sw/sh if set, else fw/fh, default .5) and its centre */
  function target() {
    const sel = AE()?.getSelection?.(); const k = (sel && sel.keys && sel.keys[0]) || lastKey; if (!k) return null; lastKey = k;
    const w = AE().itemWorld(k); if (!w) return null;
    const c = inv(w.x, w.y), ov = AE().get?.()?.edit?.[k] || {};
    const hw = (ov.sw ?? ov.fw ?? .5) / 2, hh = (ov.sh ?? ov.fh ?? .5) / 2;
    return { key: k, u: c.u, v: c.v, hw, hh };
  }
  function say(t) { const s = $('#labMsg'); if (s) s.textContent = t }
  function ensureWalk() { if (!testWalk) $('#townTestWalk')?.click() }
  function go(pts) { ensureWalk(); path = pts.map(p => ({ u: p.u, v: p.v })); destination = null }
  function ring(t, d) {
    const a = t.u - t.hw - d, b = t.u + t.hw + d, c = t.v - t.hh - d, e = t.v + t.hh + d, pts = [];
    const side = (u0, v0, u1, v1) => { const n = Math.max(1, Math.ceil(Math.hypot(u1 - u0, v1 - v0) / 1.2)); for (let i = 1; i <= n; i++) pts.push({ u: u0 + (u1 - u0) * i / n, v: v0 + (v1 - v0) * i / n }) };
    side(a, c, b, c); side(b, c, b, e); side(b, e, a, e); side(a, e, a, c);
    return pts;   /* the loop ignores the plot's walk rules on purpose: you watch the DRAW ORDER, even inside a fenced court */
  }
  function walkAround() {
    const t = target(); if (!t) return say('เลือกชิ้นใน “ของย่อย” ก่อน');
    const pts = ring(t, 1.4); if (pts.length < 4) return say('รอบชิ้นนี้เดินไม่ได้ (ถูกบล็อกหมด)');
    ensureWalk(); hero.u = pts.at(-1).u; hero.v = pts.at(-1).v; go([...pts, ...pts]); say('กำลังเดินวนรอบชิ้นที่เลือก… ดูว่าตอนไหนที่ชิ้นบังตัวละคร');
  }
  function standFront() {
    const t = target(); if (!t) return say('เลือกชิ้นใน “ของย่อย” ก่อน');
    ensureWalk(); path = []; hero.u = t.u; hero.v = t.v + t.hh + 1.2; focusHero?.(); say('ตัวละครยืนหน้าชิ้น (ด้านที่ v มาก) · คลิกพื้นเพื่อเดินเอง');
  }
  function opt(v, cur, l) { return `<option value="${v}"${cur === v ? ' selected' : ''}>${l}</option>` }
  function open() {
    if (box) { box.hidden = false; return } we = !!editing;
    box = document.createElement('div'); box.id = 'testLab';
    box.style.cssText = 'position:fixed;left:12px;bottom:64px;z-index:10040;width:262px;background:#1d3028f5;color:#f7e8c5;border:1px solid #a5b68a;border-radius:12px;padding:10px 12px;font:12.5px AgThai,system-ui,sans-serif;box-shadow:0 8px 28px #0007';
    const s = DS().get();
    box.innerHTML = `<b style="font-size:14px">🧪 ห้องทดสอบ</b><span id="labClose" style="float:right;cursor:pointer">✕ ปิด</span>
<div style="display:grid;gap:5px;margin:8px 0"><button id="labWalk">🚶 เดินรอบชิ้นที่เลือก</button><button id="labFront">📍 วางตัวละครหน้าชิ้น</button><button id="labStop">⏹ หยุดเดิน</button>
<label style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="labDbg" ${DS().debug() ? 'checked' : ''}> เส้นกรอบ (ฟ้า = กรอบเรียงลำดับ · เขียว = เท้าตัวละคร)</label></div>
<div style="border-top:1px solid #4d6656;padding-top:6px"><b>การบัง (ตั้งค่ากลางของเกม)</b>
<label style="display:block;margin:5px 0">ชิ้นสูงเมื่อบัง<select id="labTall" style="width:100%">${opt('both', s.tall, 'โปร่ง + เงาตัวละคร')}${opt('fade', s.tall, 'โปร่งอย่างเดียว')}${opt('silhouette', s.tall, 'เงาตัวละครอย่างเดียว')}${opt('solid', s.tall, 'ทึบ (บังจริง)')}</select></label>
<label style="display:block;margin:5px 0">ชิ้นเตี้ยเมื่อบัง<select id="labLow" style="width:100%">${opt('natural', s.low, 'ทึบตามจริง')}${opt('fade', s.low, 'โปร่งเหมือนชิ้นสูง')}</select></label>
<label style="display:block;margin:5px 0">ความโปร่ง <span id="labAV">${Math.round(s.alpha * 100)}%</span><input id="labAlpha" type="range" min="10" max="90" value="${Math.round(s.alpha * 100)}" style="width:100%"></label></div>
<p id="labMsg" style="margin:6px 0 0;color:#cfe0b0;min-height:1.2em"></p>`;
    document.body.append(box);
    box.querySelector('#labWalk').onclick = walkAround; box.querySelector('#labFront').onclick = standFront;
    box.querySelector('#labStop').onclick = () => { path = []; say('หยุดแล้ว') };
    box.querySelector('#labDbg').onchange = e => DS().debug(e.target.checked);
    box.querySelector('#labTall').onchange = e => DS().set({ tall: e.target.value });
    box.querySelector('#labLow').onchange = e => DS().set({ low: e.target.value });
    box.querySelector('#labAlpha').oninput = e => { const v = +e.target.value; box.querySelector('#labAV').textContent = v + '%'; DS().set({ alpha: v / 100 }) };
    box.querySelector('#labClose').onclick = close; say('เลือกชิ้นแล้วกด “เดินรอบชิ้นที่เลือก”');
  }
  function close() { if (!box) return; path = []; if (testWalk) $('#townTestWalk')?.click(); box.hidden = true; DS().debug(false); const c = box.querySelector('#labDbg'); if (c) c.checked = false }
  window.TestLab = { open, close };

  /* the menu entry: added to the "⋯ เพิ่มเติม" popup once the toolbar exists */
  let n = 0; const iv = setInterval(() => {
    const pop = document.querySelector('#townTools .morePop');
    if (pop && !pop.querySelector('#labBtn')) { const b = document.createElement('button'); b.id = 'labBtn'; b.type = 'button'; b.className = 'moreItem'; b.textContent = '🧪 ห้องทดสอบ'; b.onclick = open; pop.prepend(b); clearInterval(iv) }
    if (++n > 80) clearInterval(iv);
  }, 250);
})();
