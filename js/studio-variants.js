/* v98.76 · Asset Studio edits one hero look at a time (ตัวเดิม · ชาย · หญิง).
   The studio's editors read and write the top level of the manifest (studioWalks, studioPoses, …). To give each look its own set without
   touching those editors, the top level always holds the look that is open; the others wait in M.heroVariants[id].
   Whenever the manifest is written out (disk, GitHub push, ZIP), canonical() puts it back in the game's shape:
     top level = the original hero (exactly as before), heroVariants.male / .female = the edits of those looks (js/hero-variant.js reads them). */
(function (root) {
  'use strict';
  const KEYS = ['studioWalks', 'studioWalkMirrors', 'studioWalkHistory', 'studioPoses', 'studioPoseMirrors', 'studioPoseHistory'];
  const LOOKS = [['classic', 'ตัวเดิม'], ['male', 'ชาย'], ['female', 'หญิง']];
  let active = 'classic';
  const pick = M => Object.fromEntries(KEYS.filter(k => M[k] && Object.keys(M[k]).length).map(k => [k, M[k]]));
  const hasData = b => b && Object.keys(b).length > 0;
  function load(M, id) { for (const k of KEYS) delete M[k]; const b = M.heroVariants?.[id]; if (b) { Object.assign(M, b); delete M.heroVariants[id] } }
  function switchTo(M, id) {
    if (!LOOKS.some(l => l[0] === id) || id === active) return false;
    M.heroVariants ||= {}; M.heroVariants[active] = pick(M); load(M, id); active = id; return true;
  }
  /* A copy of the manifest in the game's shape. Does not change M. */
  function canonical(M) {
    if (!M || (active === 'classic' && !M.heroVariants)) return M;
    const out = { ...M }, store = { ...(M.heroVariants || {}) };
    if (active !== 'classic') { store[active] = pick(M); for (const k of KEYS) delete out[k]; Object.assign(out, store.classic || {}) }
    delete store.classic;
    for (const id of Object.keys(store)) if (!hasData(store[id])) delete store[id];
    if (Object.keys(store).length) out.heroVariants = store; else delete out.heroVariants;
    return out;
  }
  /* After a manifest is (re)loaded from disk it is in the game's shape again → the original hero is open. */
  const reset = () => { active = 'classic' };
  root.StudioVariants = { LOOKS, KEYS, get active() { return active }, switchTo, canonical, reset };
})(globalThis);
