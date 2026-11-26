/* v98.1083 · SHIFT-WALK — hold Shift on a map you can walk freely (village map · open places · rooms): the cursor is the walking feet and a click ONLY walks to that spot.
   Nothing else reacts: no talking to villagers, no place / door / exit, no quest object, no hover highlight or tip. Release Shift = everything is normal again.
   Mouse only (a touch screen has no Shift). Each page registers its own walker:  ShiftWalk.set({ canvas, ok: () => bool, walk: pointerEvent => void }).
   This file must load EARLY (right after js/game-cursor.js): its window-capture listeners run before the pages' own handlers and stop them for a Shift click. */
(function (root) {
  'use strict';
  if (root.ShiftWalk || typeof document === 'undefined') return;
  let cfg = null, held = false, down = null;
  const active = e => !!(cfg && cfg.canvas && e.target === cfg.canvas && e.shiftKey && (e.pointerType === undefined || e.pointerType === 'mouse' || e.pointerType === 'pen') && (!cfg.ok || cfg.ok()));
  const paint = on => { try { if (!cfg || !cfg.canvas) return; if (on) cfg.canvas.dataset.agc = 'walk'; else if (cfg.canvas.dataset.agc === 'walk') cfg.canvas.dataset.agc = ''; root.GameCursor?.refresh?.() } catch (e) { } };
  const quiet = () => { try { root.Interactables?.setHover?.(null); root.Interactables?.showTip?.(null) } catch (e) { } };
  addEventListener('keydown', e => { if (e.key === 'Shift' && !held) { held = true; if (!cfg?.ok || cfg.ok()) { paint(true); quiet() } } }, true);
  addEventListener('keyup', e => { if (e.key === 'Shift') { held = false; down = null; paint(false) } }, true);
  addEventListener('blur', () => { held = false; down = null; paint(false) });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { held = false; down = null; paint(false) } });
  addEventListener('pointermove', e => { if (e.buttons === 0 && active(e)) { e.stopImmediatePropagation(); cfg.canvas.dataset.agc = 'walk'; quiet() } }, true);
  addEventListener('pointerdown', e => { if (e.button === 0 && active(e)) { e.stopImmediatePropagation(); down = { x: e.clientX, y: e.clientY } } else down = null }, true);
  addEventListener('pointerup', e => {
    if (!down) return; const d = down; down = null; if (e.button !== 0 || !cfg || e.target !== cfg.canvas) return;
    e.stopImmediatePropagation(); if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return;
    try { cfg.walk(e) } catch (x) { console.warn('[shift-walk]', x) }
  }, true);
  addEventListener('click', e => { if (active(e)) e.stopImmediatePropagation() }, true);
  root.ShiftWalk = { set(c) { cfg = c; if (held) paint(true) }, held: () => held };
})(globalThis);
