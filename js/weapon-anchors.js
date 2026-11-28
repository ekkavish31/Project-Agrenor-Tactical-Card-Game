/* v98.1191 · WEAPON ANCHORS — where the hand holds the weapon in an attack picture (windup / strike / guard) of a character, per direction.
   The weapon is drawn UNDER the body (layer 'under': the fingers close over the grip) or over it, at that point and angle — instead of floating in front of the fighter.
   Edited in Editor › 🗡 จุดจับอาวุธ (weapon-anchor-tab.html) · stored in localStorage 'project-a-weapon-anchors-v1' (pushed like other editor values; see EditorStore.SYNC).
   An anchor = { x, y }  the grip centre, 0–1 of the picture's width / height (the picture as it is on disk, NOT mirrored)
              · a   angle in degrees, clockwise from "blade up" (0 = up · 90 = right · 123 = down-right)
              · h   weapon height as a fraction of the picture size (default = the weapon's own scale)
              · layer 'under' | 'over'  ·  off:true = no anchor (use the floating weapon).
   A direction with no anchor of its own uses the MIRROR of its counterpart (SE ↔ SW · NE ↔ NW): x → 1 − x, angle → −angle.
   WeaponAnchors.get(char, pose, dir) → anchor | null  ·  set(char, pose, dir, anchor | null)  ·  draw(g, img, def, anchor, size, x0, y0)  ·  defFor(weaponKey, spriteTable) */
(function (root) {
  'use strict';
  const KEY = 'project-a-weapon-anchors-v1', MIR = { SE: 'SW', SW: 'SE', NE: 'NW', NW: 'NE' };
  /* measured by eye on the 384 px frames (assets/tactics/<char>_<se|ne>_<windup|strike>.webp): the grip sits in the lead fist (kier's sword · mil's knife) · bram's hammer: over the shoulder (windup) / between the hands (strike) · luna's staff: the REAR hand, so its tip comes out just past the front fist; the angle follows the arm / the line between the hands. Fine-tune in Editor › 🗡 จุดจับอาวุธ — these are starting values, not final art. Bram / Luna / Mil frames are punching stances, so hammer / staff / knife fit only roughly until they get their own grip poses */
  const DEFAULTS = {'kier':{'windup':{'SE':{x:0.617,y:0.219,a:-24,h:0.53,layer:'under'},'NE':{x:0.638,y:0.185,a:-20,h:0.53,layer:'under'}},'strike':{'SE':{x:0.641,y:0.646,a:123,h:0.53,layer:'under'},'NE':{x:0.701,y:0.583,a:115,h:0.53,layer:'under'}}},'bram':{'windup':{'SE':{x:0.695,y:0.398,a:-30,h:0.62,layer:'under'},'NE':{x:0.711,y:0.378,a:-30,h:0.62,layer:'under'}},'strike':{'SE':{x:0.578,y:0.404,a:135,h:0.62,layer:'under'},'NE':{x:0.555,y:0.349,a:125,h:0.62,layer:'under'}}},'luna':{'windup':{'SE':{x:0.443,y:0.424,a:35,h:0.72,layer:'under'},'NE':{x:0.32,y:0.404,a:40,h:0.72,layer:'under'}},'strike':{'SE':{x:0.37,y:0.456,a:78,h:0.72,layer:'under'},'NE':{x:0.273,y:0.43,a:75,h:0.72,layer:'under'}}},'mil':{'windup':{'SE':{x:0.721,y:0.417,a:60,h:0.34,layer:'under'},'NE':{x:0.669,y:0.388,a:60,h:0.34,layer:'under'}},'strike':{'SE':{x:0.794,y:0.417,a:95,h:0.34,layer:'under'},'NE':{x:0.794,y:0.336,a:85,h:0.34,layer:'under'}}}};
  /* weapons the sprite table has no entry for use the loose pictures in assets/tactics (same numbers as js/town-battle.js WEXTRA) */
  const WEXTRA = { axe: { pivot: [.5, .9], size: [256, 768], scale: .62 }, knife: { pivot: [.5, .8], size: [256, 512], scale: .34 }, rapier: { pivot: [.5, .88], size: [256, 768], scale: .78 }, spear: { pivot: [.5, .72], size: [256, 1024], scale: 1.1 }, bow: { pivot: [.5, .5], size: [128, 320], scale: .6 }, tome: { pivot: [.5, .5], size: [160, 200], scale: .26 } };
  let cache = null, raw = null;
  const user = () => { let r = null; try { r = localStorage.getItem(KEY) } catch (e) { } if (r !== raw || !cache) { raw = r; try { cache = JSON.parse(r || '{}') || {} } catch (e) { cache = {} } } return cache };
  const find = (src, c, p, d) => src?.[c]?.[p]?.[d];
  function lookup(c, p, d) { const a = find(user(), c, p, d); return a !== undefined ? a : find(DEFAULTS, c, p, d) }
  function get(char, pose, dir) {
    const a = lookup(char, pose, dir); if (a) return a.off ? null : a;
    const m = lookup(char, pose, MIR[dir]); if (m && !m.off) return { ...m, x: 1 - m.x, a: -m.a, mirrored: true };
    return null;
  }
  /* what the editor shows: where the value comes from → 'user' | 'default' | 'mirror' | 'none' */
  function source(char, pose, dir) {
    if (find(user(), char, pose, dir) !== undefined) return find(user(), char, pose, dir).off ? 'off' : 'user';
    if (find(DEFAULTS, char, pose, dir)) return 'default';
    const m = lookup(char, pose, MIR[dir]); return m && !m.off ? 'mirror' : 'none';
  }
  function set(char, pose, dir, anchor) {
    const U = JSON.parse(JSON.stringify(user())); U[char] ||= {}; U[char][pose] ||= {};
    if (anchor === null) { delete U[char][pose][dir]; if (!Object.keys(U[char][pose]).length) delete U[char][pose]; if (!Object.keys(U[char]).length) delete U[char] } else U[char][pose][dir] = anchor;
    try { if (Object.keys(U).length) localStorage.setItem(KEY, JSON.stringify(U)); else localStorage.removeItem(KEY) } catch (e) { }
    raw = null; return true;
  }
  const defFor = (wk, A) => (A?.equipment?.[wk]) || (WEXTRA[wk] ? { src: `assets/tactics/${wk}.webp`, ...WEXTRA[wk] } : null);
  /* draw the weapon picture `img` (def = {pivot,size,scale}) held at `a` in a frame of `size` px whose top-left is (x0, y0) in the current canvas transform */
  function draw(g, img, def, a, size, x0, y0) {
    const h = size * (a.h || def.scale || .63), w = h * def.size[0] / def.size[1];
    g.save(); g.translate(x0 + a.x * size, y0 + a.y * size); g.rotate(a.a * Math.PI / 180); g.drawImage(img, -def.pivot[0] * w, -def.pivot[1] * h, w, h); g.restore();
  }
  root.WeaponAnchors = { KEY, MIR, DEFAULTS, WEXTRA, get, set, source, lookup, defFor, draw, user };
})(globalThis);
