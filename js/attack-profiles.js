/* v98.1192 · ATTACK PROFILES — the same two pictures (windup → strike) must FEEL different for a slash and a thrust.
   A profile describes how the weapon travels between the two hand anchors (js/weapon-anchors.js), how fast, and what the body / camera / trail / sound do:
     slash  ฟัน   curved path (the hand swings out and round), slow wind-up then a fast accelerating snap, overshoot, wide crescent trail, camera roll
     thrust แทง   straight path along the blade, short tight coil, very fast drive, a hold at full reach, thin straight streak, camera kick
     smash  ฟาด   (axe / hammer) heavy overhead arc, long wind-up, hard hit, big shake
     jab    จิก   (knife) a quick short thrust
   Edited in Editor › 🗡 จุดจับอาวุธ (the profile section) · stored in localStorage 'project-a-motion-profiles-v1' (pushed like other editor values).
   AttackProfiles.kindOf(weaponKey) · get(kind) · set(kind, patch|null) · solve(P, a0, a1, e, fs) → the weapon anchor at ms e after the strike began ·
   body(P, e, fs) → { dx, rot, sx, sy } (px / radians / scale) · trailPts(history…) is drawn by js/town-battle.js */
(function (root) {
  'use strict';
  const KEY = 'project-a-motion-profiles-v1';
  const NAMES = { slash: 'ฟัน (slash)', thrust: 'แทง (thrust)', smash: 'ฟาดหนัก (smash)', jab: 'จิก (jab)' };
  const DEFAULTS = {
    slash:  { path: 'arc',  windMs: 200, strikeMs: 110, hold: 150, lunge: 18, lean: .17, squash: .05, bulge: .20, overshoot: .10, smear: 3, trail: 'arc',  roll: 1.4, shake: 0,  sfx: 'swing' },
    thrust: { path: 'line', windMs: 140, strikeMs: 70,  hold: 220, lunge: 30, lean: .05, squash: .07, bulge: 0,   overshoot: .05, smear: 2, trail: 'line', roll: .3,  shake: 5,  sfx: 'knife', pull: .10 },
    smash:  { path: 'arc',  windMs: 260, strikeMs: 130, hold: 260, lunge: 12, lean: .22, squash: .08, bulge: .24, overshoot: .05, smear: 3, trail: 'arc',  roll: 2.2, shake: 12, sfx: 'swing' },
    jab:    { path: 'line', windMs: 100, strikeMs: 55,  hold: 100, lunge: 22, lean: .04, squash: .05, bulge: 0,   overshoot: .04, smear: 2, trail: 'line', roll: .2,  shake: 3,  sfx: 'knife', pull: .08 }
  };
  const KIND_OF = { sword: 'slash', rapier: 'thrust', spear: 'thrust', knife: 'jab', oldKnife: 'jab', axe: 'smash', hammer: 'smash', staff: 'smash', tome: 'slash', bow: 'thrust' };
  const kindOf = wk => KIND_OF[wk] || 'slash';
  let cache = null, raw = null;
  const user = () => { let r = null; try { r = localStorage.getItem(KEY) } catch (e) { } if (r !== raw || !cache) { raw = r; try { cache = JSON.parse(r || '{}') || {} } catch (e) { cache = {} } } return cache };
  const get = kind => ({ ...(DEFAULTS[kind] || DEFAULTS.slash), ...(user()[kind] || {}) });
  function set(kind, patch) {
    const U = JSON.parse(JSON.stringify(user())); if (patch === null) delete U[kind]; else U[kind] = { ...(U[kind] || {}), ...patch };
    try { if (Object.keys(U).length) localStorage.setItem(KEY, JSON.stringify(U)); else localStorage.removeItem(KEY) } catch (e) { } raw = null;
  }
  const cl = x => Math.min(1, Math.max(0, x));
  /* the weapon anchor ms `e` after the strike picture appeared: starts exactly where the windup anchor is (continuity), ends on the strike anchor, then settles */
  function solve(P, a0, a1, e, fs = 1) {
    const t = cl(e / P.strikeMs), u = cl((e - P.strikeMs) / Math.max(1, P.hold)), over = P.overshoot * Math.sin(Math.PI * u) * (1 - u);
    let kp, ka;
    if (P.path === 'line') { kp = 1 - Math.pow(1 - t, 3); ka = cl(t / .35); ka = ka * ka * (3 - 2 * ka) }        /* thrust: the blade snaps to the aim, then the whole weapon DRIVES straight */
    else { kp = ka = t * t * (2 - t) }                                                                              /* slash: accelerates into the cut */
    kp += over; ka += over;
    const dx = a1.x - a0.x, dy = a1.y - a0.y; let x = a0.x + dx * kp, y = a0.y + dy * kp;
    if (P.path !== 'line' && P.bulge) {   /* the hand swings round: push the middle of the path FORWARD (toward the way the fighter faces) */
      let px = dy, py = -dx; if (px * fs < 0) { px = -px; py = -py } const len = Math.hypot(px, py) || 1, b = Math.sin(Math.PI * cl(kp)) * P.bulge * Math.hypot(dx, dy);
      x += px / len * b; y += py / len * b;
    }
    if (P.path === 'line' && P.pull && t < 1) {   /* the coil: pull back along the blade before the drive (first 25 % of the strike) */
      const r = (a0.a || 0) * Math.PI / 180, pb = P.pull * Math.sin(Math.PI * cl(t / .25)) * (t < .25 ? 1 : 0); x -= Math.sin(r) * pb; y += Math.cos(r) * pb;
    }
    return { x, y, a: a0.a + (a1.a - a0.a) * ka, h: (a0.h || a1.h) + ((a1.h || a0.h) - (a0.h || a1.h)) * kp, layer: a1.layer || a0.layer || 'under' };
  }
  const ease = x => 1 - Math.pow(1 - cl(x), 3);
  function body(P, e, fs) { const k = ease(e / P.strikeMs), d = 1 - ease((e - (P.strikeMs + P.hold)) / 320); return { dx: fs * P.lunge * k * d, rot: fs * P.lean * k * d, sx: 1 - P.squash * .6 * k * d, sy: 1 + P.squash * k * d } }
  root.AttackProfiles = { KEY, NAMES, DEFAULTS, KIND_OF, kindOf, get, set, user, solve, body };
})(globalThis);
