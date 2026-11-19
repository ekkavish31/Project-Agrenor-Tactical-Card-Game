/* v98.844 · EDITOR SPEED (village map editor only: village-town.html?edit=1 — the game and every other page are untouched).
   1) "ความคมภาพ" (a small selector in the editor bar): the editor canvas is drawn at a LOWER pixel ratio than the screen has —
        คม = 1.0 · สมดุล = 0.85 · ลื่น = 0.75  (never above the real screen ratio; a 150 % Windows screen used to draw 2.25× the pixels of a 100 % one).
      Saved in localStorage 'projectA.editQuality'. The browser scales the picture up, so the editor looks slightly softer at สมดุล / ลื่น.
      Done by replacing window.devicePixelRatio for this page (so every drawing routine, the texel rule and the overlay outlines agree) and re-sizing the canvas.
   2) HD-2D glow / light rays / dust / tilt-shift are OFF while editing (they were ~12 % of every frame). The game keeps them. Keep them in the editor with  ?hd2d=1 .
   API: EditPerf.{quality(), set('sharp'|'balanced'|'smooth'), real} */
(function () {
  'use strict';
  const Q = new URLSearchParams(location.search);
  if (Q.get('edit') !== '1' || !/village-town\.html$/.test(location.pathname)) return;
  const real = window.devicePixelRatio || 1, LEVELS = { sharp: 1, balanced: .85, smooth: .75 }, NAMES = { sharp: 'คม', balanced: 'สมดุล', smooth: 'ลื่น' }, KEY = 'projectA.editQuality';
  let q = 'sharp'; try { const v = localStorage.getItem(KEY); if (LEVELS[v]) q = v } catch (e) { }
  const eff = () => Math.min(real, LEVELS[q]);
  try { Object.defineProperty(window, 'devicePixelRatio', { configurable: true, get: eff }) } catch (e) { return }
  const apply = () => { try { window.applyRenderScale?.() } catch (e) { } try { terrainDirty = true } catch (e) { } };
  function set(v) { if (!LEVELS[v]) return; q = v; try { localStorage.setItem(KEY, v) } catch (e) { } apply(); const s = document.getElementById('editQualitySel'); if (s) s.value = v }
  window.EditPerf = { quality: () => q, set, real };
  /* HD-2D off in the editor */
  if (Q.get('hd2d') !== '1') {
    const st = document.createElement('style'); st.textContent = '.hd2d,.hd2d *{display:none!important}'; document.head.appendChild(st);
    const off = () => { try { if (window.HD2D) window.HD2D.bloom = () => { } } catch (e) { } }; off(); addEventListener('load', off);
  }
  /* the selector, as its own little group at the end of the editor bar */
  let tries = 0; const t = setInterval(() => {
    const tools = document.getElementById('townTools');
    if ((!tools || !tools.querySelector('.grp')) && ++tries < 80) return; clearInterval(t); if (!tools) return;
    const g = document.createElement('div'), row = document.createElement('div'), cap = document.createElement('small'), sel = document.createElement('select');
    g.className = 'grp'; row.className = 'row'; cap.textContent = 'ความคมภาพ';
    sel.id = 'editQualitySel'; sel.title = 'ความละเอียดที่วาดในตัวแก้ไข (เกมจริงไม่เปลี่ยน): คม = ละเอียดสุด · ลื่น = กระตุกน้อยสุด (ภาพนุ่มลง)'; sel.style.cssText = 'font:inherit;font-size:11px;padding:2px 4px;border-radius:6px;background:#24382f;color:#f3ead0;border:1px solid #4d6656;align-self:center;min-width:64px';
    for (const k of Object.keys(LEVELS)) { const o = document.createElement('option'); o.value = k; o.textContent = NAMES[k] + (real < LEVELS[k] && k === 'sharp' ? '' : ' · ' + Math.round(Math.min(real, LEVELS[k]) * 100) + '%'); sel.append(o) }
    sel.value = q; sel.onchange = () => set(sel.value); row.append(sel); g.append(row, cap); tools.append(g);
  }, 150);
  /* the page was opened with a lower ratio than the canvas was first sized for → size it again once the page has built its canvas */
  addEventListener('load', () => setTimeout(apply, 60));
})();
