/* v98.65 · reads window.CHARACTER_SCALE_ADJUST (js/character-scale-adjust-data.js) → CharScaleAdjust.factor(ctx, id) = global × scene (1 when nothing is set). */
(function (root) {
  'use strict';
  const num = v => (typeof v === 'number' && v > .2 && v < 3 ? v : 1);
  const clean = id => String(id || '').replace(/^npc:/, '');
  function factor(ctx, id, data) { const d = data || root.CHARACTER_SCALE_ADJUST || {}; let k = clean(id);
    /* v98.458 · the hero has one size adjustment per LOOK: male = `hero`, female = `hero-female` (the game asks for `hero`; the selected look decides which). A caller that passes its own data (scale-lineup) already works with the real keys. */
    if (k === 'hero' && !data) { try { if (root.HeroVariant?.get?.() === 'female') k = 'hero-female' } catch (e) { } } return num(d.global?.[k]) * num(d.scene?.[ctx]?.[k]) }
  /* v98.465 · an extra factor for ONE pose (windup · strike · guard · hit): a crouching pose must not be drawn as tall as the standing one (POSE_HEIGHT guide in js/proportion-datum.js). 1 when nothing is set. */
  /* v98.656 · dir (SW · SE · NE · NW): the 📐 เรียงท่า tool sets one size per pose × direction ('walk@SW', 'walk@NE'); SE uses SW and NW uses NE (mirror copies). Falls back to the per-pose value. */
  const BASE = { SW: 'SW', SE: 'SW', NE: 'NE', NW: 'NE' };
  function poseFactor(id, pose, data, dir) { const d = data || root.CHARACTER_SCALE_ADJUST || {}; let k = clean(id);
    if (k === 'hero' && !data) { try { if (root.HeroVariant?.get?.() === 'female') k = 'hero-female' } catch (e) { } }
    const m = d.pose?.[k]; if (!m) return 1; const b = BASE[String(dir || '').toUpperCase()]; if (b && m[pose + '@' + b] != null) return num(m[pose + '@' + b]); return num(m[pose]) }
  root.CharScaleAdjust = { factor, poseFactor };
})(globalThis);
