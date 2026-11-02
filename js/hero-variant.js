/* v98.70 · ตัวเอกเลือกได้ (Hero look variants) — load right AFTER js/tactics-sprites.js and BEFORE js/hero-motion.js / town-art.js.
   Every page reads TACTICS_SPRITES (battle, village, interiors, sub-maps), so replacing the idle picture here changes the hero everywhere at once.
   A variant may supply only some poses: here only the standing picture per direction. Until walk / action frames exist for it, that one picture
   is used for walking (the games bobs it) and for attack / guard / hit (battle already moves one still frame for those). To finish a variant later:
   add the frames to the variant below — no other code changes.
   The choice is kept in localStorage `projectA.heroVariant` (and copied to the save as village.heroVariant by the picker). */
(function (root) {
  'use strict';
  const KEY = 'projectA.heroVariant', DIRS = ['SW', 'SE', 'NW', 'NE'];
  const dir = (f, d) => `assets/characters/${f}/idle-${d.toLowerCase()}.webp`;
  const walkFrames = (f, d) => Array.from({ length: 12 }, (_, i) => `assets/characters/${f}/walk-${d}-${String(i + 1).padStart(2, '0')}.webp`);
  const VARIANTS = {
    /* v98.74 · male walk cycle: 12 frames facing SE and 12 facing NE (back view); SW / NW are the same frames mirrored */
    male: { name: 'นักผจญภัยชาย', sub: 'ผมสีเกาลัด · ผ้าคลุมเขียว (ตัวเริ่มต้น)', idle: Object.fromEntries(DIRS.map(d => [d, dir('hero-male', d)])),
      walk: { SE: { frames: walkFrames('hero-male', 'se'), ms: 75 }, SW: { mirrorOf: 'SE' }, NE: { frames: walkFrames('hero-male', 'ne'), ms: 75 }, NW: { mirrorOf: 'NE' } } },
    classic: { name: 'ตัวเดิม (เก็บไว้)', sub: 'ต้นแบบเก่าของเกม', preview: null, hidden: true },
    female: { name: 'นักผจญภัยหญิง', sub: 'ผมหางม้า · ผ้าคลุมเขียว', idle: Object.fromEntries(DIRS.map(d => [d, dir('hero-female', d)])),
      /* v98.72 · real walk cycle: 12 frames facing SW; SE is the same frames mirrored. NW / NE (back views) still use the standing picture until their sheets exist */
      walk: { SW: { frames: Array.from({ length: 12 }, (_, i) => `assets/characters/hero-female/walk-sw-${String(i + 1).padStart(2, '0')}.webp`), ms: 75 }, SE: { mirrorOf: 'SW' } } }
  };
  const DEFAULT = 'male';   /* v98.71 · the new male hero replaced the original art as the starting look; the old one stays as the hidden variant `classic` */
  const get = () => { try { const v = localStorage.getItem(KEY); return VARIANTS[v] ? v : DEFAULT } catch (e) { return DEFAULT } };
  const T = () => (typeof TACTICS_SPRITES !== 'undefined' ? TACTICS_SPRITES : null);
  const original = {};   // the untouched idle picture per direction (for the picker preview)
  function apply(id) {
    const t = T(), v = VARIANTS[id]; if (!t) return false;
    for (const d of DIRS) { const D = t.directions[d]; if (D?.idle && !original[d]) original[d] = D.idle.src }
    if (!v?.idle) return true;
    for (const d of DIRS) {
      const D = t.directions[d]; if (!D || !v.idle[d]) continue;
      const e = { ...D.idle, src: v.idle[d], flipImage: false, mirrored: false };
      D.idle = e; D.idleFrames = [e];
      const W = v.walk?.[d], WS = W?.mirrorOf ? v.walk[W.mirrorOf] : W;   /* a real walk cycle for this direction (or the mirror of another) */
      D.walk = WS ? WS.frames.map(src => ({ ...e, src, ms: WS.ms || 90, flipImage: !!W.mirrorOf })) : [{ ...e, ms: 150 }, { ...e, ms: 150 }];
      delete D['walk-left']; delete D['walk-right'];
      for (const p of ['windup', 'strike', 'guard', 'hit', 'down']) if (D[p]) D[p] = { ...D[p], src: v.idle[d], flipImage: false, mirrored: false };
    }
    return true;
  }
  function set(id) {
    if (!VARIANTS[id]) return false;
    try { localStorage.setItem(KEY, id) } catch (e) { }
    try { if (typeof s !== 'undefined' && s.village) s.village.heroVariant = id; if (typeof save === 'function') save() } catch (e) { }
    return true;
  }
  const previewOf = id => VARIANTS[id].idle?.SW || original.SW || (T() && T().directions.SW.idle.src);
  apply(get());
  root.HeroVariant = { VARIANTS, DEFAULT, get, set, apply, previewOf, DIRS };
})(globalThis);
