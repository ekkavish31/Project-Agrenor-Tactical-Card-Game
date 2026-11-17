/* v98.662 · HeadArrow — the "whose turn / who leads" marker above a character's head: the user's rigid 3D arrowhead (teal + gold), 96 frames spinning around its tip
   (assets/fx/head-arrow-teal.webp · 12 × 8 frames of 128 px · tip pivot (.5078, .8672) · 3.2 s per turn), bobbing up and down by 20 % of its OWN visible length
   (peak to peak · ±10 %). Used by the battle (js/town-battle.js: allies teal, enemies red) and the village map (js/town-art.js: the leading hero, always).
   HeadArrow.draw(g, x, y, size, t, opt) → true when drawn · (x, y) = the TIP of the arrow (the point just above the head) · size = drawn width of one 128 px frame
   opt = { foe: true → the red variant (only the teal pixels are re-coloured, the gold stays) · bob: false → no bobbing } · HeadArrow.length(size) = the visible length */
(function (root) {
  'use strict';
  const SRC = 'assets/fx/head-arrow-teal.webp', FR = 128, COLS = 12, N = 96, PX = .5078, PY = .8672, LEN = .836;
  let img = null, red = null;
  function atlas() { if (!img) { img = new Image(); img.decoding = 'async'; img.src = SRC } return img.complete && img.naturalWidth ? img : null }
  /* teal (and the green-ish fringe it makes against the gold) → red (≈ 355°), same saturation / lightness — the gold trim (hue ≈ 45°) is left alone */
  function makeRed(im) {
    const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height), a = d.data;
    for (let i = 0; i < a.length; i += 4) {
      if (!a[i + 3]) continue; const r = a[i] / 255, g = a[i + 1] / 255, b = a[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, dl = mx - mn; if (dl < .035) continue;
      const s = l > .5 ? dl / (2 - mx - mn) : dl / (mx + mn); let h = mx === r ? ((g - b) / dl) % 6 : mx === g ? (b - r) / dl + 2 : (r - g) / dl + 4; h = (h * 60 + 360) % 360;
      if (h > 235 || h < 30) continue; h = h < 68 ? 28 + (h - 30) * .3 : (355 + (h - 175) * .12 + 360) % 360;   /* everything between yellow-green and blue (the teal, its anti-aliased edge against the gold, the cyan glint) → red; the gold trim (hue 30–68, which reads yellow-green next to red) is pulled toward amber */
      const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q, f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p };
      a[i] = Math.round(f(h / 360 + 1 / 3) * 255); a[i + 1] = Math.round(f(h / 360) * 255); a[i + 2] = Math.round(f(h / 360 - 1 / 3) * 255);
    }
    x.putImageData(d, 0, 0); return c;
  }
  function draw(g, x, y, size, t, opt = {}) {
    const im = atlas(); if (!im || !(size > 0)) return false;
    let src = im; if (opt.foe) { if (!red) { try { red = makeRed(im) } catch (e) { red = im } } src = red }
    const len = size * LEN, bob = opt.bob === false ? 0 : Math.sin(t * .0022) * len * .1, f = Math.floor(t / (3200 / N)) % N;
    g.drawImage(src, (f % COLS) * FR, Math.floor(f / COLS) * FR, FR, FR, x - size * PX, y + bob - size * PY, size, size);
    return true;
  }
  root.HeadArrow = { draw, length: size => size * LEN, ready: () => !!atlas() };
})(globalThis);
