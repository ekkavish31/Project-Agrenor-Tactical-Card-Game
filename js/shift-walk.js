/* v98.1083 · SHIFT-WALK — hold Shift on a map you can walk freely (village map · open places · rooms): the cursor is the walking feet and a click ONLY walks to that spot.
   Nothing else reacts: no talking to villagers, no place / door / exit, no quest object, no hover highlight or tip. Release Shift = everything is normal again.
   Mouse only (a touch screen has no Shift). Each page registers its own walker:  ShiftWalk.set({ canvas, ok: () => bool, walk: pointerEvent => void }).
   This file must load EARLY (right after js/game-cursor.js): its window-capture listeners run before the pages' own handlers and stop them for a Shift click. */
(function (root) {
  'use strict';
  if (root.ShiftWalk || typeof document === 'undefined') return;
  let cfg = null, held = false, down = null, locked = null;   /* locked = { deny } while a lesson forces walking only (v98.1115): every click on the map walks; everything else is refused */
  const active = e => !!(cfg && cfg.canvas && e.target === cfg.canvas && (e.shiftKey || (locked && locked.click)) && (e.pointerType === undefined || e.pointerType === 'mouse' || e.pointerType === 'pen') && (!cfg.ok || cfg.ok()));
  const paint = on => { try { if (!cfg || !cfg.canvas) return; if (on) cfg.canvas.dataset.agc = 'walk'; else if (cfg.canvas.dataset.agc === 'walk') cfg.canvas.dataset.agc = ''; root.GameCursor?.refresh?.() } catch (e) { } };
  const quiet = () => { try { root.Interactables?.setHover?.(null); root.Interactables?.showTip?.(null) } catch (e) { } };
  const deny = () => { try { locked && locked.deny && locked.deny() } catch (e) { } };
  /* locked: only W A S D / arrows (and Shift) work · every other key and every click outside the map canvas is refused */
  addEventListener('keydown', e => { if (!locked || e.target?.closest?.('input,textarea')) return; if (locked.keys && /^(w|a|s|d|arrowup|arrowdown|arrowleft|arrowright|shift)$/i.test(e.key)) return; e.preventDefault(); e.stopImmediatePropagation(); deny() }, true);
  for (const t of ['pointerdown', 'pointerup', 'click', 'dblclick', 'contextmenu']) addEventListener(t, e => { if (!locked || !cfg || (e.target === cfg.canvas && locked.click) || e.target === document.documentElement) return; e.preventDefault(); e.stopImmediatePropagation(); if (t === 'pointerdown') deny() }, true);
  addEventListener('keydown', e => { if (e.key === 'Shift' && !held) { held = true; if (!cfg?.ok || cfg.ok()) { paint(true); quiet() } } }, true);
  addEventListener('keyup', e => { if (e.key === 'Shift') { held = false; down = null; paint(false) } }, true);
  addEventListener('blur', () => { held = false; down = null; paint(false) });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { held = false; down = null; paint(false) } });
  addEventListener('pointermove', e => { if (e.buttons === 0 && active(e)) { e.stopImmediatePropagation(); cfg.canvas.dataset.agc = 'walk'; quiet() } }, true);
  addEventListener('pointerdown', e => { if (e.button === 0 && active(e)) { e.stopImmediatePropagation(); down = { x: e.clientX, y: e.clientY } } else down = null }, true);
  addEventListener('pointerup', e => {
    if (!down) return; const d = down; down = null; if (e.button !== 0 || !cfg || e.target !== cfg.canvas) return;
    e.stopImmediatePropagation(); if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return;
    try { cfg.walk(e); locked && locked.onWalk && locked.onWalk(e) } catch (x) { console.warn('[shift-walk]', x) }
  }, true);
  addEventListener('click', e => { if (active(e)) e.stopImmediatePropagation() }, true);
  root.ShiftWalk = { set(c) { cfg = c; if (held || locked) paint(true) }, held: () => held, /* opts: { click: ground clicks walk (default true) · keys: W A S D / arrows allowed (default true) · onWalk: called after each ground click walk } — everything else is refused */
    lock(on, denyFn, opts) { const o = opts || {}; locked = on ? { deny: denyFn, click: o.click !== false, keys: o.keys !== false, onWalk: o.onWalk } : null; paint(!!(on && locked.click) || held); if (on) quiet() }, locked: () => !!locked };
})(globalThis);
