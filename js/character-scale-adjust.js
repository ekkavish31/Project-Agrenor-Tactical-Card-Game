/* v98.65 · reads window.CHARACTER_SCALE_ADJUST (js/character-scale-adjust-data.js) → CharScaleAdjust.factor(ctx, id) = global × scene (1 when nothing is set). */
(function (root) {
  'use strict';
  const num = v => (typeof v === 'number' && v > .2 && v < 3 ? v : 1);
  const clean = id => String(id || '').replace(/^npc:/, '');
  function factor(ctx, id, data) { const d = data || root.CHARACTER_SCALE_ADJUST || {}, k = clean(id); return num(d.global?.[k]) * num(d.scene?.[ctx]?.[k]) }
  root.CharScaleAdjust = { factor };
})(globalThis);
