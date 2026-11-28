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
  const DEFAULTS = {'kier':{'windup':{'SE':{x:0.617,y:0.219,a:-24,h:0.53,layer:'under'},'NE':{x:0.638,y:0.185,a:-20,h:0.53,layer:'under'}},'strike':{'SE':{x:0.641,y:0.646,a:123,h:0.53,layer:'under'},'NE':{x:0.701,y:0.583,a:115,h:0.53,layer:'under'}}},'bram':{'windup':{'SE':{x:0.695,y:0.398,a:-30,h:0.62,layer:'under'},'NE':{x:0.711,y:0.378,a:-30,h:0.62,layer:'under'}},'strike':{'SE':{x:0.578,y:0.404,a:135,h:0.62,layer:'under'},'NE':{x:0.555,y:0.349,a:125,h:0.62,layer:'under'}}},'luna':{'windup':{'SE':{x:0.443,y:0.424,a:35,h:0.72,layer:'under'},'NE':{x:0.32,y:0.404,a:40,h:0.72,layer:'under'}},'strike':{'SE':{x:0.37,y:0.456,a:78,h:0.72,layer:'under'},'NE':{x:0.273,y:0.43,a:75,h:0.72,layer:'under'}}},'mil':{'windup':{'SE':{x:0.721,y:0.417,a:60,h:0.34,layer:'under'},'NE':{x:0.669,y:0.388,a:60,h:0.34,layer:'under'}},'strike':{'SE':{x:0.794,y:0.417,a:95,h:0.34,layer:'under'},'NE':{x:0.794,y:0.336,a:85,h:0.34,layer:'under'}}},'hero-male':{'windup':{'SE':{x:0.667,y:0.385,a:30,layer:'under'},'NE':{x:0.646,y:0.357,a:30,layer:'under'}},'strike':{'SE':{x:0.815,y:0.385,a:100,layer:'under'},'NE':{x:0.794,y:0.294,a:100,layer:'under'}}},'hero-female':{'windup':{'SE':{x:0.672,y:0.365,a:30,layer:'under'},'NE':{x:0.646,y:0.378,a:30,layer:'under'}},'strike':{'SE':{x:0.805,y:0.354,a:100,layer:'under'},'NE':{x:0.836,y:0.315,a:100,layer:'under'}}}};
  /* weapons the sprite table has no entry for use the loose pictures in assets/tactics (same numbers as js/town-battle.js WEXTRA) */
  const WEXTRA = { axe: { pivot: [.5, .9], size: [256, 768], scale: .62 }, knife: { pivot: [.5, .8], size: [256, 512], scale: .34 }, rapier: { pivot: [.5, .88], size: [256, 768], scale: .78 }, spear: { pivot: [.5, .72], size: [256, 1024], scale: 1.1 }, bow: { pivot: [.5, .5], size: [128, 320], scale: .6 }, tome: { pivot: [.5, .5], size: [160, 200], scale: .26 }, log: { pivot: [.5, .86], size: [160, 512], scale: .5 } };
  let cache = null, raw = null;
  const user = () => { let r = null; try { r = localStorage.getItem(KEY) } catch (e) { } if (r !== raw || !cache) { raw = r; try { cache = JSON.parse(r || '{}') || {} } catch (e) { cache = {} } } return cache };
  const find = (src, c, p, d) => src?.[c]?.[p]?.[d];
  function lookup(c, p, d) { const a = find(user(), c, p, d); return a !== undefined ? a : find(DEFAULTS, c, p, d) }
  function get(char, pose, dir) {
    const a = lookup(char, pose, dir); if (a) return a.off ? null : a;
    const m = lookup(char, pose, MIR[dir]); if (m && !m.off) return { ...m, x: m.rel ? -m.x : 1 - m.x, a: -m.a, mirrored: true };
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
  /* ---------- STOWED weapon (standing / walking): carried on the BACK, following the body frame by frame ----------
     The anchor is BODY-RELATIVE: it is stored as an offset from the figure's landmarks measured on the picture that is being drawn — the torso's centre line (cx), the top of the head (top) and the figure's height (H):
       x = cx + rx·H · y = top + ry·H   (so the weapon bobs and sways with every walk frame without one click per frame)
     Layer by direction: facing the camera (SE / SW) the weapon goes UNDER the body (it looks like it is on the back, only what sticks out shows) · facing away (NE / NW) it goes OVER the body.
     Pose key in the store: 'stow:<weapon>' (per character + direction; SW / NW use the mirror of SE / NE).  */
  const LM = new WeakMap();
  function landmarks(img) {
    if (!img) return { cx: .5, top: .15, H: .75 }; let r = LM.get(img); if (r) return r;
    r = { cx: .5, top: .15, H: .75 };
    try {
      const N = 96, c = document.createElement('canvas'); c.width = c.height = N; const q = c.getContext('2d', { willReadFrequently: true }); q.drawImage(img, 0, 0, N, N); const d = q.getImageData(0, 0, N, N).data;
      let y0 = N, y1 = -1; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (d[(y * N + x) * 4 + 3] > 40) { if (y < y0) y0 = y; if (y > y1) y1 = y }
      if (y1 > y0 + 8) { const H = y1 - y0 + 1; let sx = 0, n = 0; for (let y = Math.round(y0 + H * .30); y < Math.round(y0 + H * .62); y++) for (let x = 0; x < N; x++) if (d[(y * N + x) * 4 + 3] > 40) { sx += x; n++ } r = { cx: n ? (sx / n + .5) / N : .5, top: y0 / N, H: H / N } }
    } catch (e) { }
    if (img.complete !== false) LM.set(img, r); return r;
  }
  function stowDefault(wk, dir, def) {
    const away = dir === 'NE' || dir === 'NW', side = (dir === 'SE' || dir === 'NE') ? -1 : 1, tipUp = ['spear', 'staff', 'bow'].includes(wk), flat = wk === 'tome', knife = wk === 'knife' || wk === 'oldKnife', h = (def?.scale || .63) * .9;
    if (!away) {   /* facing the camera: the weapon is slung on the BACK — its grip sits behind the torso (hidden by the body, which is drawn on top) and only the part that sticks out past the shoulder shows */
      if (flat) return { rel: 1, x: side * .13, y: .5, a: side * 8, h };
      if (knife) return { rel: 1, x: side * .02, y: .52, a: side * 55, h };
      if (tipUp) return { rel: 1, x: side * .08, y: .5, a: side * 12, h };
      return { rel: 1, x: side * .05, y: .46, a: side * 30, h };
    }
    return { rel: 1, x: side * (['knife', 'oldKnife', 'tome', 'bow'].includes(wk) ? .27 : .1), y: flat ? .56 : knife ? .43 : tipUp ? .48 : .24, a: flat ? 0 : side * 38 + (tipUp ? 0 : 180) + 0, h };   /* facing away: over the back, as before */
  }
  /* the body-relative anchor (user value → else the default for the weapon class) */
  function stowRel(char, wk, dir, def) { const u = get(char, 'stow:' + wk, dir); return u ? { ...u, rel: 1 } : stowDefault(wk, dir, def) }
  /* the anchor in picture coordinates for THIS picture `img` · flipped = the picture is drawn mirrored (its landmarks mirror too) */
  function stow(char, wk, dir, def, img, flipped) {
    const a = stowRel(char, wk, dir, def), lm = landmarks(img), cx = flipped ? 1 - lm.cx : lm.cx, away = dir === 'NE' || dir === 'NW';
    return { x: cx + a.x * lm.H, y: lm.top + a.y * lm.H, a: a.a, h: a.h, layer: a.layer || (away ? 'over' : 'under') };
  }
  /* ---------- the HERO (and the sibling that follows) in the village · sub-maps · rooms: the same stowed weapon, drawn from the frame the page draws ----------
     heroStow({ im, f, d, size, a, follower, look }) → { layer, draw(g) } | null · call: if (st && st.layer !== 'over') st.draw(g); …draw the body…; if (st && st.layer === 'over') st.draw(g)
     (inside the page's own transform: translate(p) [+ scale(-1,1) when f.flipImage]; the body is drawn at (−size·a[0], −size·a[1], size, size)) */
  const WIMG = {}, wimg = src => WIMG[src] || (WIMG[src] = Object.assign(new Image(), { src }));
  function heroWeapon(follower) {
    try { const w = (root.parent && root.parent.WorldState) || root.WorldState, g = w?.game?.(); if (!g) return null;
      if (follower) { const k = g.village?.sibGear?.kind || 'log'; return { wk: k, art: null } }
      const it = (g.inventory || []).find(x => x.id === g.equipped); return it && it.kind ? { wk: it.kind, art: it.recipe === 'oldKnife' ? 'oldKnife' : null } : null } catch (e) { return null }
  }
  function heroStow(o) {
    try {
      const dd = o.f?.flipImage ? MIR[o.d] : o.d; if (!['SE', 'SW', 'NE', 'NW'].includes(dd) || !o.im) return null;
      const k = heroWeapon(!!o.follower); if (!k) return null; const A = typeof TACTICS_SPRITES !== 'undefined' ? TACTICS_SPRITES : null;
      const key = k.wk === 'knife' && k.art === 'oldKnife' ? 'oldKnife-sheathed' : k.wk, def = defFor(key, A) || defFor(k.wk, A); if (!def) return null;
      const wi = wimg(def.src); if (!wi.complete || !wi.naturalWidth) return null;
      const look = o.look || (root.HeroVariant?.get?.() || 'male'), an = stow('hero-' + look, k.wk, dd, def, o.im, false);
      return { layer: an.layer, draw: g => draw(g, wi, def, an, o.size, -o.size * o.a[0], -o.size * o.a[1]) };
    } catch (e) { return null }
  }
  root.WeaponAnchors = { heroStow, heroWeapon, landmarks, stowRel, stowDefault, stow, KEY, MIR, DEFAULTS, WEXTRA, get, set, source, lookup, defFor, draw, user };
})(globalThis);
