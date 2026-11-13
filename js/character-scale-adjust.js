/* v98.65 · reads window.CHARACTER_SCALE_ADJUST (js/character-scale-adjust-data.js) → CharScaleAdjust.factor(ctx, id) = global × scene (1 when nothing is set). */
(function (root) {
  'use strict';
  const num = v => (typeof v === 'number' && v > .2 && v < 3 ? v : 1);
  const clean = id => String(id || '').replace(/^npc:/, '');
  function factor(ctx, id, data) { const d = data || root.CHARACTER_SCALE_ADJUST || {}; let k = clean(id);
    /* v98.458 · the hero has one size adjustment per LOOK: male = `hero`, female = `hero-female` (the game asks for `hero`; the selected look decides which). A caller that passes its own data (scale-lineup) already works with the real keys. */
    if (k === 'hero' && !data) { try { if (root.HeroVariant?.get?.() === 'female') k = 'hero-female' } catch (e) { } } return num(d.global?.[k]) * num(d.scene?.[ctx]?.[k]) }
  root.CharScaleAdjust = { factor };
})(globalThis);
