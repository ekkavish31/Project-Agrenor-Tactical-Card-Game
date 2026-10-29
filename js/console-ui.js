/* v97.10 · Console feel for every page (index, village, world map, battle field):
   • UI sounds: a soft tick when the pointer or the focus moves onto a button, a click on press, a lower tone for close / cancel
     (code-synthesised, quiet; off with localStorage 'projectA.uiSfx' = '0' or reduced motion does not matter here).
   • Gamepad (Gamepad API): D-pad / left stick = arrow keys, A = Enter, B = Escape, X = Z (undo), Y = A (auto), LB / RB = Q / E (camera),
     Start = Escape (menu), Select = Tab. Only the page that has focus reads the pad, so frames never double a press.
   • Arrow-key menus: when a dialog / menu is open (or a button already has focus) the arrows move the focus to the nearest button
     in that direction and Enter presses it — the way a console menu works. The game's own arrow uses (facing, cutscenes) come first.
   • Village main menu: Esc in the village opens one menu with every toolbar action (journal, bag, character, deck, adventure, settings,
     activities, elements, fullscreen), so the icon row is not the only way in. */
(function () {
  'use strict';
  if (window.ConsoleUI) return;
  const store = { get: k => { try { return localStorage.getItem(k) } catch (e) { return null } } };

  /* ---------- UI sounds ---------- */
  let ac = null, lastTick = 0;
  function tone(freqs, vol, type = 'sine', len = .09) {
    if (store.get('projectA.uiSfx') === '0') return;
    try { ac ||= new (window.AudioContext || window.webkitAudioContext)(); if (ac.state === 'suspended') ac.resume();
      freqs.forEach((f, i) => { const o = ac.createOscillator(), g = ac.createGain(), t0 = ac.currentTime + i * .045; o.type = type; o.frequency.setValueAtTime(f, t0); o.frequency.exponentialRampToValueAtTime(f * 1.04, t0 + len);
        g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(vol, t0 + .008); g.gain.exponentialRampToValueAtTime(.0001, t0 + len); o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + len + .02) }) } catch (e) { }
  }
  const SFX = { move: () => { const n = performance.now(); if (n - lastTick < 45) return; lastTick = n; tone([1320], .012, 'sine', .05) }, ok: () => tone([660, 990], .03, 'triangle', .1), back: () => tone([520, 390], .026, 'triangle', .1) };
  const isBtn = el => el && el.closest?.('button:not(:disabled),[role=button],a[href],.fb-card,.ts-menu button');
  const isBack = el => /✕|ยกเลิก|ปิด|close|cancel|ไม่|ถอย|กลับ/i.test((el.textContent || el.title || '').slice(0, 24)) || el.classList?.contains('ghost') || el.classList?.contains('no');
  let hovered = null;
  addEventListener('pointerover', e => { const b = isBtn(e.target); if (b && b !== hovered) { hovered = b; SFX.move() } }, true);
  addEventListener('focusin', e => { const b = isBtn(e.target); if (b && b !== hovered) { hovered = b; SFX.move() } }, true);
  addEventListener('click', e => { const b = isBtn(e.target); if (b) (isBack(b) ? SFX.back : SFX.ok)() }, true);

  /* ---------- arrow-key / pad menus ---------- */
  const MODALS = '#fbPause .box,#fbFace,.wm-res,.wm-modal,dialog[open],.game-dialog,#cuMenu .box,#titleScreen .ts-extra:not([hidden]),#titleScreen .ts-name:not([hidden])';
  const visible = el => { const r = el.getBoundingClientRect(); return r.width > 2 && r.height > 2 && getComputedStyle(el).visibility !== 'hidden' };
  function scope() { const ms = [...document.querySelectorAll(MODALS)].filter(visible); return ms[ms.length - 1] || null }
  function buttonsIn(root) { return [...root.querySelectorAll('button:not(:disabled),a[href],input,[role=button],[tabindex]:not([tabindex="-1"])')].filter(visible) }
  function moveFocus(dir) {
    const sc = scope(), act = document.activeElement, inScope = act && act !== document.body && (!sc || sc.contains(act)) && isBtn(act);
    if (!sc && !inScope) return false;
    const list = buttonsIn(sc || document.body); if (!list.length) return false;
    if (!inScope) { list[0].focus({ preventScroll: true }); return true }
    const a = act.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2, D = { ArrowRight: [1, 0], ArrowLeft: [-1, 0], ArrowDown: [0, 1], ArrowUp: [0, -1] }[dir];
    let best = null, bs = 1e9;
    for (const b of list) { if (b === act) continue; const r = b.getBoundingClientRect(), dx = r.left + r.width / 2 - ax, dy = r.top + r.height / 2 - ay, along = dx * D[0] + dy * D[1]; if (along <= 4) continue;
      const side = Math.abs(dx * D[1] - dy * D[0]), s = along + side * 2.2; if (s < bs) { bs = s; best = b } }
    if (best) { best.focus({ preventScroll: false }); return true } return false;
  }
  addEventListener('keydown', e => {
    if (e.defaultPrevented || e.target.closest?.('input,textarea,select')) return;
    if (/^Arrow/.test(e.key) && moveFocus(e.key)) { e.preventDefault() }
  });
  const css = document.createElement('style');
  css.textContent = `:focus-visible{outline:2px solid #ffd25a!important;outline-offset:2px}
  #cuMenu{position:fixed;inset:0;z-index:70;display:grid;place-items:center;background:#05080dc4;backdrop-filter:blur(3px);font-family:VillageThai,"Noto Sans Thai",system-ui,sans-serif}
  #cuMenu .box{display:grid;grid-template-columns:repeat(2,minmax(150px,1fr));gap:8px;padding:18px;border-radius:14px;background:#14231ff7;border:1px solid #b9c48a77;box-shadow:0 16px 40px #000a;max-width:92vw}
  #cuMenu h2{grid-column:1/-1;margin:0 0 4px;color:#f3e9c9;font-size:18px}#cuMenu small{grid-column:1/-1;color:#cdbb92;font-size:12px}
  #cuMenu button{padding:11px 14px;border-radius:10px;border:1px solid #b9c48a66;background:#1b302a;color:#f3e9c9;font:600 14px inherit;font-family:inherit;text-align:left;cursor:pointer}#cuMenu button:hover,#cuMenu button:focus-visible{background:#2d4a40}`;
  document.head.append(css);

  /* ---------- village main menu (Esc) ---------- */
  function villageMenu() {
    const old = document.getElementById('cuMenu'); if (old) { old.remove(); return true }
    if (!document.querySelector('[data-game]')) return false;   // town-ux moves the toolbar buttons into its icon row (#townGameMenu)
    const pick = [...document.querySelectorAll('[data-game],#activities,#elChart,#fullscreen')].filter(b => b.style.display !== 'none' && !b.closest('#cuMenu'));
    const go = document.querySelector('.town-go');
    const label = b => b.id === 'elChart' ? '◈ ตารางธาตุ' : b.id === 'fullscreen' ? '⛶ เต็มจอ' : ((b.textContent || b.title || b.dataset.game).replace(/\s+/g, ' ').trim() || b.title || b.dataset.game);
    const d = document.createElement('div'); d.id = 'cuMenu';
    d.innerHTML = `<div class="box"><h2>เมนู</h2>${pick.map((b, i) => `<button data-i="${i}">${label(b)}</button>`).join('')}${go ? '<button data-go="1">🗺 ออกเดินทาง</button>' : ''}<button data-x="1">▶ กลับไปเล่น</button><small>ลูกศร/จอย เลือก · Enter ยืนยัน · Esc ปิด</small></div>`;
    document.body.append(d);
    d.onclick = e => { const b = e.target.closest('button'); if (e.target === d || b?.dataset.x) { d.remove(); return } if (!b) return; d.remove(); if (b.dataset.go) go.click(); else pick[+b.dataset.i]?.click() };
    d.querySelector('button')?.focus();
    return true;
  }
  addEventListener('keydown', e => {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    if (document.getElementById('cuMenu')) { document.getElementById('cuMenu').remove(); e.preventDefault(); return }
    if (window.TownBattle?.active?.() || document.querySelector('dialog[open],.game-dialog,.cs:not([hidden]),#titleScreen,.wm-modal-bg') || document.body.classList.contains('cs-open')) return;
    if (/village-town\.html/.test(location.pathname) && !/[?&](battle|edit)/.test(location.search) && villageMenu()) e.preventDefault();
  });

  /* ---------- gamepad ---------- */
  const PAD = { 0: 'Enter', 1: 'Escape', 2: 'z', 3: 'a', 4: 'q', 5: 'e', 8: 'Tab', 9: 'Escape', 12: 'ArrowUp', 13: 'ArrowDown', 14: 'ArrowLeft', 15: 'ArrowRight' };
  const held = {}, repeatAt = {};
  function press(key) {
    const t = document.activeElement && document.activeElement !== document.body ? document.activeElement : document;
    const ev = new KeyboardEvent('keydown', { key, code: key.length === 1 ? 'Key' + key.toUpperCase() : key, bubbles: true, cancelable: true });
    t.dispatchEvent(ev); t.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
    if (key === 'Enter' && !ev.defaultPrevented && isBtn(document.activeElement)) document.activeElement.click();
  }
  function poll() {
    requestAnimationFrame(poll);
    if (!navigator.getGamepads || !document.hasFocus()) return;
    const pads = [...navigator.getGamepads()].filter(Boolean); if (!pads.length) return;
    const p = pads[0], now = performance.now(), ax = p.axes[0] || 0, ay = p.axes[1] || 0;
    const state = {}; for (const i in PAD) state[i] = !!p.buttons[i]?.pressed;
    if (ax < -.55) state[14] = true; if (ax > .55) state[15] = true; if (ay < -.55) state[12] = true; if (ay > .55) state[13] = true;
    for (const i in PAD) { if (state[i] && !held[i]) { held[i] = true; repeatAt[i] = now + 380; press(PAD[i]) } else if (state[i] && i >= 12 && now > repeatAt[i]) { repeatAt[i] = now + 130; press(PAD[i]) } else if (!state[i]) held[i] = false }
  }
  addEventListener('gamepadconnected', () => { try { const d = document.createElement('div'); d.textContent = '🎮 เชื่อมต่อจอยแล้ว · A ยืนยัน · B ยกเลิก · Start เมนู'; d.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:90;padding:8px 16px;border-radius:999px;background:#14231ff2;color:#f3e9c9;border:1px solid #b9c48a88;font:600 13px system-ui,"Noto Sans Thai",sans-serif;pointer-events:none'; document.body.append(d); setTimeout(() => d.remove(), 3200) } catch (e) { } });
  requestAnimationFrame(poll);

  window.ConsoleUI = { sfx: SFX, moveFocus, villageMenu };
})();
