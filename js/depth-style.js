/* v98.146 · DEPTH + "being covered" rules of the village map (one principle for every place and every part).
   1. ORDER — every part has a footprint on the grid (กรอบพื้น: u0..u1 × v0..v1, set in the editor). A walker is in FRONT of a part when it stands beyond the part's front edge on either axis,
      BEHIND it when it stands before the back edge on either axis, otherwise (beside it / inside it) the nearer to the camera (u+v) wins. Parts keep their own layer order (z) among themselves.
   2. COVERED — only something that is IN FRONT of the walker by rule 1, really overlaps it on screen and is TALL is made see-through: tall = buildings, trees, banners, statues …;
      low things (fences, low walls, bushes, flowers, kerbs) just obey the order — their top may cover the feet, like in real life (setting: low things can fade too).
   3. LOOK of a covered walker — the cover becomes ~35 % opaque in a soft oval around the walker ("fade") AND the walker is drawn again on top as a ghost with a white outline ("silhouette"). Both on by default.
   Settings (localStorage 'depth-style-v1', pushed into js/game-settings.js): { tall: 'both' | 'fade' | 'silhouette' | 'solid', low: 'natural' | 'fade', alpha: 0.35 }   ·   debug view: DepthStyle.debug(true) / ?depth=1 */
(function (root) {
  'use strict';
  const KEY = 'depth-style-v1', DEF = { tall: 'both', low: 'natural', alpha: 0.35 };
  let cache = null, stamp = null, DEBUG = /[?&]depth=1/.test(root.location?.search || '');
  const read = () => { let s = ''; try { s = root.localStorage.getItem(KEY) || '' } catch (e) { } if (s !== stamp) { stamp = s; try { cache = { ...DEF, ...(s ? JSON.parse(s) : {}) } } catch (e) { cache = { ...DEF } } } return cache };
  const LOW = /รั้ว|กำแพง|ขอบ|พุ่ม|ดอกไม้|ดอก|หญ้า|ก้อนหิน|หินก้อน|กอ|ไม้เตี้ย|fence|wall|bush|hedge|flower|grass|curb|kerb|rock|stone|low/i;
  const isLow = it => it.tall === 'low' ? true : it.tall === 'tall' ? false : LOW.test(String(it.label || it.name || ''));
  /* is the walker in front of this part? (true → draw the part BEFORE the walker). fp = {u0,u1,v0,v1}; wu/wv = walker feet on the grid */
  function walkerInFront(fp, wu, wv) {
    if (fp.parts && fp.parts.length > 1) fp = nearestPart(fp, wu, wv);   /* v98.292 · a composite piece (fence of several parts, an L/U shape): judge against its NEAREST box */
    const fr = wu > fp.u1 || wv > fp.v1, bk = wu < fp.u0 || wv < fp.v0;
    if (fr && !bk) return true; if (bk && !fr) return false;
    return (wu + wv) > (fp.u0 + fp.u1 + fp.v0 + fp.v1) / 2;
  }
  const d0 = (fp, wu, wv) => Math.hypot(Math.max(fp.u0 - wu, 0, wu - fp.u1), Math.max(fp.v0 - wv, 0, wv - fp.v1));
  const nearestPart = (fp, wu, wv) => { let b = fp.parts[0], bd = Infinity; for (const p of fp.parts) { const d = d0(p, wu, wv); if (d < bd) { bd = d; b = p } } return b };
  const dist = (fp, wu, wv) => { if (fp.parts && fp.parts.length > 1) return d0(nearestPart(fp, wu, wv), wu, wv); return dist1(fp, wu, wv) };
  const dist1 = (fp, wu, wv) => { const du = Math.max(fp.u0 - wu, 0, wu - fp.u1), dv = Math.max(fp.v0 - wv, 0, wv - fp.v1); return Math.hypot(du, dv) };
  const api = {
    KEY, DEF, isLow, walkerInFront, dist,
    get: () => ({ ...read() }),
    set(patch) { const d = { ...read(), ...patch }; try { root.localStorage.setItem(KEY, JSON.stringify(d)) } catch (e) { } stamp = null; try { root.dispatchEvent(new Event('depthstyle')) } catch (e) { } },
    debug(v) { if (v === undefined) return DEBUG; DEBUG = !!v; return DEBUG },
    /* style for one covering part → 'solid' (no see-through) | 'fade' | 'silhouette' | 'both' */
    styleFor(it) { const s = read(); if (isLow(it)) return s.low === 'fade' ? (s.tall === 'solid' ? 'fade' : s.tall) : 'solid'; return s.tall },
    /* draw `part` over `walker` with the cover faded in a soft oval around the walker, then the ghost of the walker on top. g = main ctx; walker feet (wx, wy) in world px; h = walker height */
    coverDraw(g, part, walker, wx, wy, h, mode) {
      const a = read().alpha, fade = mode === 'fade' || mode === 'both', ghost = mode === 'silhouette' || mode === 'both', cx = wx, cy = wy - h * .5, rx = h * .48, ry = h * .62, BIG = 1e6;
      const oval = k => { g.moveTo(cx + rx * k, cy); g.ellipse(cx, cy, rx * k, ry * k, 0, 0, Math.PI * 2) };
      if (fade) {
        const rings = [[1.0, a], [1.35, a + (1 - a) * .38], [1.75, a + (1 - a) * .75]];
        g.save(); g.beginPath(); g.rect(-BIG, -BIG, BIG * 2, BIG * 2); oval(1.75); g.clip('evenodd'); part.draw(g); g.restore();   // outside every ring: untouched
        for (let i = rings.length - 1; i >= 0; i--) { g.save(); g.beginPath(); oval(rings[i][0]); if (i > 0) oval(rings[i - 1][0]); g.clip(i > 0 ? 'evenodd' : 'nonzero'); g.globalAlpha *= rings[i][1]; part.draw(g); g.restore() }
      } else part.draw(g);
      if (ghost) {
        g.save(); g.globalAlpha *= fade ? .62 : .8;
        try { if ('filter' in g) g.filter = 'drop-shadow(1.5px 0 0 #fff) drop-shadow(-1.5px 0 0 #fff) drop-shadow(0 1.5px 0 #fff) drop-shadow(0 -1.5px 0 #fff)' } catch (e) { }
        walker.draw(g); g.restore();
      }
    }
  };
  /* settings in the village tools panel (⚙ เครื่องมือ): how a covered walker looks + the debug view */
  function ui() {
    const panel = root.document && root.document.getElementById('toolsPanel'); if (!panel || panel.querySelector('#depthBox')) return;
    const s = read(), box = root.document.createElement('div'); box.id = 'depthBox'; box.style.cssText = 'display:grid;gap:6px;margin:10px 0;padding:9px;border:1px solid #536260;border-radius:8px';
    const opt = (v, t, cur) => `<option value="${v}"${v === cur ? ' selected' : ''}>${t}</option>`;
    box.innerHTML = `<strong style="font-size:12px">การบัง / ตัวละครโดนบัง</strong>
      <label>ของสูง (อาคาร ต้นไม้ ธง) <select id="dsTall">${opt('both', 'จางลง + เงาโครงร่างตัวละคร', s.tall)}${opt('fade', 'จางลงอย่างเดียว', s.tall)}${opt('silhouette', 'เงาโครงร่างอย่างเดียว', s.tall)}${opt('solid', 'ทึบ (ไม่โปร่ง)', s.tall)}</select></label>
      <label>ของเตี้ย (รั้ว กำแพงเตี้ย พุ่ม) <select id="dsLow">${opt('natural', 'บังตามธรรมชาติ (ไม่โปร่ง)', s.low)}${opt('fade', 'โปร่งด้วย', s.low)}</select></label>
      <label>ความทึบของที่บัง <input id="dsAlpha" type="range" min="10" max="80" step="5" value="${Math.round(s.alpha * 100)}"> <output>${Math.round(s.alpha * 100)}%</output></label>
      <button id="dsDebug">🧭 แสดงกรอบพื้น + ลำดับวาด</button><small>เก็บในเบราว์เซอร์ · ส่งขึ้นเกมพร้อมปุ่ม ⬆ Push ของ editor หมู่บ้าน</small>`;
    panel.append(box);
    box.querySelector('#dsTall').onchange = e => api.set({ tall: e.target.value }); box.querySelector('#dsLow').onchange = e => api.set({ low: e.target.value });
    box.querySelector('#dsAlpha').oninput = e => { api.set({ alpha: +e.target.value / 100 }); e.target.nextElementSibling.textContent = e.target.value + '%' };
    box.querySelector('#dsDebug').onclick = e => { e.target.textContent = api.debug(!api.debug()) ? '🧭 ซ่อนกรอบพื้น + ลำดับวาด' : '🧭 แสดงกรอบพื้น + ลำดับวาด' };
  }
  if (root.document) { root.document.addEventListener('DOMContentLoaded', ui); if (root.document.readyState !== 'loading') ui(); root.addEventListener('load', ui) }
  root.DepthStyle = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
