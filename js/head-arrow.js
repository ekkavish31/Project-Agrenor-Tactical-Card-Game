/* v98.690 · HeadArrow — the "whose turn / who leads" marker above a character's head: a rigid 3D arrowhead, 96 frames spinning around its tip, bobbing up and down by 20 % of its OWN visible length
   (peak to peak · ±10 %). Used by the battle (js/town-battle.js: allies / enemies) and the village map (js/town-art.js: the leading hero, always).
   THREE STYLES (Editor › Visual › HUD › ลูกศรชี้ saves the choice in localStorage 'projectA.visual' → {arrow}):
     'new'     (default) the artist's gold arrow (assets/fx/head-arrow-gold-new.webp) for the lead / allies and the red one (…red-new.webp) for enemies · 12 × 8 frames of 128 px · apex pivot · 4 s per turn
     'oldGold' the earlier teal arrow recoloured to gold (code), enemies red    ·   'oldTeal' the original teal / gold arrow, enemies red (code recolour)
   HeadArrow.draw(g, x, y, size, t, opt) → true when drawn · (x, y) = the TIP of the arrow (the point just above the head) · size = drawn width of one frame
   opt = { foe: true → the red variant · bob: false → no bobbing · style: 'new'|'oldGold'|'oldTeal' → force a style (the editor preview) } · HeadArrow.length(size) = the visible length · HeadArrow.style() / HeadArrow.styles = the choices */
(function (root) {
  'use strict';
  const FR = 128, COLS = 12, N = 96;
  const TEAL = 'assets/fx/head-arrow-teal.webp';
  const STYLES = {
    new: { name: 'ใหม่ · ทอง / แดง (3D)', ally: 'assets/fx/head-arrow-gold-new.webp', foe: 'assets/fx/head-arrow-red-new.webp', k: .8, wk: 1, px: .5039, py: .8672, len: .8125, loop: 4000 },
    oldGold: { name: 'เดิม · ทองย้อมสี (เล็ก เรียว)', ally: TEAL, recolor: 'gold', foe: TEAL, foeRecolor: 'red', k: .8, wk: .8, px: .5078, py: .8672, len: .836, loop: 3200 },
    oldTeal: { name: 'เดิมดั้งเดิม · เขียวมิ้นต์', ally: TEAL, foe: TEAL, foeRecolor: 'red', k: 1, wk: 1, px: .5078, py: .8672, len: .836, loop: 3200 }
  };
  const style = () => { let v; try { v = (JSON.parse(localStorage.getItem('projectA.visual')) || {}).arrow } catch (e) { } return STYLES[v] ? v : 'new' };
  const imgs = {}, made = {};
  const load = src => { let e = imgs[src]; if (!e) { e = imgs[src] = new Image(); e.decoding = 'async'; e.src = src } return e.complete && e.naturalWidth ? e : null };
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
  /* v98.684 · the player's / allies' arrow is all GOLD: the teal body becomes gold (same lightness/saturation pattern, so the facets still read) and the old gold trim is pushed a little deeper (amber, darker) so body and trim stay apart */
  function makeGold(im) {
    const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height), a = d.data;
    for (let i = 0; i < a.length; i += 4) {
      if (!a[i + 3]) continue; const r = a[i] / 255, g = a[i + 1] / 255, b = a[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, dl = mx - mn; if (dl < .035) continue;
      let s = l > .5 ? dl / (2 - mx - mn) : dl / (mx + mn), h = mx === r ? ((g - b) / dl) % 6 : mx === g ? (b - r) / dl + 2 : (r - g) / dl + 4; h = (h * 60 + 360) % 360; let nl = l;
      if (h >= 75 && h <= 240) { h = 46; s = Math.min(1, s * .9 + .22); nl = Math.min(.95, l * .97 + .05) }   /* teal body → gold */
      else if (h >= 20 && h < 75) { h = 34; s = Math.min(1, s * 1.05); nl = l * .92 }   /* old trim → deeper amber */
      else continue;
      const q = nl < .5 ? nl * (1 + s) : nl + s - nl * s, p = 2 * nl - q, f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p };
      a[i] = Math.round(f(h / 360 + 1 / 3) * 255); a[i + 1] = Math.round(f(h / 360) * 255); a[i + 2] = Math.round(f(h / 360 - 1 / 3) * 255);
    }
    x.putImageData(d, 0, 0); return c;
  }
  /* v98.699 · the new gold / red arrows are made more vivid (saturation ×1.7, a little brighter) and get a white aura baked in — same look as the gold cursor. Done once per sheet on a canvas. */
  function vivid(im, foe) {
    const k = im.src + '|vivid'; if (made[k]) return made[k];
    try {
      const W = im.naturalWidth, Hh = im.naturalHeight, c = document.createElement('canvas'); c.width = W; c.height = Hh; const q = c.getContext('2d');
      q.filter = foe ? 'saturate(1.35) brightness(1.08)' : 'saturate(1.7) brightness(1.14) contrast(1.06)';
      /* the aura: the silhouette blurred in white, under the frame (drawn per 128 px cell so cells never bleed into each other) */
      const g = document.createElement('canvas'); g.width = W; g.height = Hh; const gq = g.getContext('2d');
      for (let f = 0; f < N; f++) {
        const cx = (f % COLS) * FR, cy = Math.floor(f / COLS) * FR;
        gq.save(); gq.beginPath(); gq.rect(cx, cy, FR, FR); gq.clip();
        gq.filter = 'brightness(0) invert(1) blur(5px)'; gq.globalAlpha = .95; gq.drawImage(im, cx, cy, FR, FR, cx, cy, FR, FR); gq.drawImage(im, cx, cy, FR, FR, cx, cy, FR, FR);
        gq.filter = 'brightness(0) invert(1) blur(1.6px)'; gq.globalAlpha = 1; gq.drawImage(im, cx, cy, FR, FR, cx, cy, FR, FR);
        gq.restore();
      }
      q.filter = 'none'; q.drawImage(g, 0, 0); q.filter = foe ? 'saturate(1.35) brightness(1.08)' : 'saturate(1.7) brightness(1.14) contrast(1.06)'; q.drawImage(im, 0, 0);
      return made[k] = c;
    } catch (e) { return made[k] = im }
  }
  function sheet(st, foe) {
    const src = foe ? st.foe : st.ally, how = foe ? st.foeRecolor : st.recolor, im = load(src); if (!im) return null;
    if (!how) return vivid(im, foe);
    const k = src + '|' + how; if (!made[k]) { try { made[k] = how === 'red' ? makeRed(im) : makeGold(im) } catch (e) { made[k] = im } } return made[k];
  }
  function draw(g, x, y, size, t, opt = {}) {
    const st = STYLES[opt.style] || STYLES[style()], src = sheet(st, !!opt.foe); if (!src || !(size > 0)) return false;
    /* overall size and (for the old gold style) extra slimness are per style */
    const dw = size * st.k * st.wk, dh = size * st.k, len = dh * st.len, bob = opt.bob === false ? 0 : Math.sin(t * .0022) * len * .1, f = Math.floor(t / (st.loop / N)) % N;
    g.drawImage(src, (f % COLS) * FR, Math.floor(f / COLS) * FR, FR, FR, x - dw * st.px, y + bob - dh * st.py, dw, dh);
    return true;
  }
  root.HeadArrow = { draw, length: size => { const st = STYLES[style()]; return size * st.k * st.len }, ready: () => !!load(STYLES[style()].ally), style, styles: STYLES };
})(globalThis);
