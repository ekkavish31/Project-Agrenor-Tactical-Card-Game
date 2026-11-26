/* v98.65 · reads window.CHARACTER_SCALE_ADJUST (js/character-scale-adjust-data.js) → CharScaleAdjust.factor(ctx, id) = the ⚖ Scale Lineup factor of that character (1 when nothing is set).
   v98.943 · ONE factor per character for every map (docs/TODO.md §35.0): the old per-scene per-character factor (`scene[ctx][id]`, all empty) is no longer read — a map's size is js/map-scale.js only. `ctx` is kept for the callers. */
(function (root) {
  'use strict';
  const num = v => (typeof v === 'number' && v > .2 && v < 3 ? v : 1);
  const clean = id => String(id || '').replace(/^npc:/, '');
  function factor(ctx, id, data) { const d = data || root.CHARACTER_SCALE_ADJUST || {}; let k = clean(id);
    /* v98.458 · the hero has one size adjustment per LOOK: male = `hero`, female = `hero-female` (the game asks for `hero`; the selected look decides which). A caller that passes its own data (scale-lineup) already works with the real keys. */
    if (k === 'hero' && !data) { try { if (root.HeroVariant?.get?.() === 'female') k = 'hero-female' } catch (e) { } } /* v98.943 · F2: a villager whose picture is ANOTHER sprite (dork → look.sprite 'guard') takes the factor set on that sprite in the Lineup when it has none of its own (it got 1 in the village = −22 %) */
    if (d.global?.[k] == null) { try { const sp = root.VillageLife?.P?.[k]?.look?.sprite; if (sp && sp !== k && d.global?.[sp] != null) k = sp } catch (e) { } }
    return num(d.global?.[k]) }
  /* v98.465 · an extra factor for ONE pose (windup · strike · guard · hit): a crouching pose must not be drawn as tall as the standing one (POSE_HEIGHT guide in js/proportion-datum.js). 1 when nothing is set. */
  /* v98.656 · dir (SW · SE · NE · NW): the 📐 เรียงท่า tool sets one size per pose × direction ('walk@SW', 'walk@NE'); SE uses SW and NW uses NE (mirror copies). Falls back to the per-pose value. */
  const BASE = { SW: 'SW', SE: 'SW', NE: 'NE', NW: 'NE' };
  const POSE_FALLBACK = { run: 'walk', pant: 'idle', graze: 'idle', bleat: 'idle', sleep: 'idle', happy: 'idle' };
  function poseFactor(id, pose, data, dir) { const d = data || root.CHARACTER_SCALE_ADJUST || {}; let k = clean(id);
    if (k === 'hero' && !data) { try { if (root.HeroVariant?.get?.() === 'female') k = 'hero-female' } catch (e) { } }
    const m = d.pose?.[k]; if (!m) return 1; const b = BASE[String(dir || '').toUpperCase()];
    /* v98.1133 · EXTRA poses the 📐 เรียงท่า tool has no row for (the goat's run / pant / graze / bleat / sleep / happy) take the size of the nearest listed pose — run → walk, the rest → idle — so one adjustment sizes the whole set */
    const pick = p => { if (b && m[p + '@' + b] != null) return m[p + '@' + b]; return m[p] };
    let v = pick(pose); if (v == null && POSE_FALLBACK[pose]) v = pick(POSE_FALLBACK[pose]); return num(v) }
  /* v98.944 · the size of the hero's STANDING / WALKING picture outside the battle (docs/TODO.md §35): the per-pose size set in 📐 เรียงท่า (walk@SW …) — the same value the battle uses.
     look = 'male' | 'female' of the picture being drawn (the follower is the OTHER look); omitted = the look the player has chosen. Only idle / walk exist outside the battle. */
  function heroPose(walking, dir, look) { const D = root.CHARACTER_SCALE_ADJUST; if (!D?.pose) return 1; let l = look; if (!l) { try { l = root.HeroVariant?.get?.() } catch (e) { } } return poseFactor(l === 'female' ? 'hero-female' : 'hero', walking ? 'walk' : 'idle', D, dir) }
  root.CharScaleAdjust = { factor, poseFactor, heroPose };
})(globalThis);
