/* v98.380 · Proportion ADJUST (⚖ Scale Lineup → 📐 สัดส่วน → 🛠 ปรับสัดส่วน): re-proportion a character picture by cutting it at the chin and the crotch
   into HEAD · TORSO · LEGS, scaling each part on its own (about its own centre line) and stacking them again with the feet on the same row.
   Pure canvas functions (no DOM beyond canvas creation) so they can be tested in node with a canvas stub.

   segments(m, marks)  → rows of each part in the picture   { head:[y0,y1), torso:[y0,y1), legs:[y0,y1) }   (m = silhouette box {top,bottom,H}, marks = {chin, hip} as fractions of the silhouette height)
   plan(seg, scale, opt) → the new heights / offsets without touching pixels (used for the dashed preview lines and the numbers)
   render(img, m, marks, scale, opt) → a NEW canvas the same size as the picture: parts scaled, seams feathered, feet kept on the same row
   autoScale(seg, sel, target)       → one common factor for the selected parts that makes HEAD ÷ HEIGHT = target (0.25 = 25 %)

   scale = { head, torso, legs } (1 = unchanged) · opt = { keepHeight: true → afterwards the whole figure is scaled back to the original silhouette height (the game's size stays the same), feather: seam blend in px } */
(function (root) {
  'use strict';
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function segments(m, marks) {
    const H = m.H, y0 = m.top, c = Math.round(y0 + clamp(marks.chin, .04, .9) * H), h = Math.round(y0 + clamp(marks.hip, .2, .95) * H), y1 = m.top + H;
    const chin = clamp(c, y0 + 2, y1 - 6), hip = clamp(h, chin + 2, y1 - 2);
    return { head: [y0, chin], torso: [chin, hip], legs: [hip, y1], top: y0, bottom: y1 };
  }
  function plan(seg, scale, opt = {}) {
    const hh = seg.head[1] - seg.head[0], ht = seg.torso[1] - seg.torso[0], hl = seg.legs[1] - seg.legs[0], H0 = hh + ht + hl;
    const nh = hh * (scale.head ?? 1), nt = ht * (scale.torso ?? 1), nl = hl * (scale.legs ?? 1), Hn = nh + nt + nl;
    const g = opt.keepHeight === false ? 1 : H0 / Hn;                    // whole-figure factor that restores the original height
    const H1 = Hn * g, bottom = seg.bottom, top = bottom - H1;
    const out = { g, H0, H1, head: [top, top + nh * g], torso: [top + nh * g, top + (nh + nt) * g], legs: [top + (nh + nt) * g, bottom], k: { head: (scale.head ?? 1) * g, torso: (scale.torso ?? 1) * g, legs: (scale.legs ?? 1) * g } };
    out.headFrac = (nh * g) / H1; out.torsoFrac = (nt * g) / H1; out.legsFrac = (nl * g) / H1;
    return out;
  }
  /* centre of the opaque pixels of rows [a,b) — the line a part is scaled about, so a leaning head stays where the artist put it */
  function centreX(d, w, a, b) { let s = 0, n = 0; for (let y = Math.max(0, Math.floor(a)); y < Math.min(b, Math.floor(b)); y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) { s += x; n++ } return n ? s / n : w / 2 }
  function render(img, m, marks, scale, opt = {}) {
    const W = m.w, Ht = m.h, mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = Ht; return c };
    const src = mk(); const sg = src.getContext('2d', { willReadFrequently: true }); if (opt.flip) { sg.translate(W, 0); sg.scale(-1, 1) } sg.drawImage(img, 0, 0); if (opt.flip) sg.setTransform(1, 0, 0, 1, 0, 0);
    const d = sg.getImageData(0, 0, W, Ht).data, seg = segments(m, marks), P = plan(seg, scale, opt), out = mk(), g = out.getContext('2d'), feather = opt.feather ?? 6;
    g.imageSmoothingQuality = 'high';
    /* a part drawn with `feather` extra rows at the edge that touches its lower neighbour, fading out — hides the seam */
    const part = (a, b, k, na, nb, fadeTop, fadeBot) => {
      const ex0 = fadeTop ? feather : 0, ex1 = fadeBot ? feather : 0, sy0 = Math.max(0, a - ex0), sy1 = Math.min(Ht, b + ex1), sh = sy1 - sy0; if (sh <= 0) return;
      const cx = centreX(d, W, a, b), t = mk(), tg = t.getContext('2d'); tg.drawImage(src, 0, sy0, W, sh, 0, 0, W, sh);
      if (fadeTop || fadeBot) { tg.globalCompositeOperation = 'destination-in'; const gr = tg.createLinearGradient(0, 0, 0, sh), f0 = ex0 / sh, f1 = 1 - ex1 / sh; gr.addColorStop(0, fadeTop ? 'rgba(0,0,0,0)' : '#000'); gr.addColorStop(f0 || 0, '#000'); gr.addColorStop(f1, '#000'); gr.addColorStop(1, fadeBot ? 'rgba(0,0,0,0)' : '#000'); tg.fillStyle = gr; tg.fillRect(0, 0, W, sh) }
      const dh = sh * k, dw = W * k, dy = na - (a - sy0) * k, dx = cx - cx * k; g.drawImage(t, 0, 0, W, sh, dx, dy, dw, dh);
    };
    part(seg.legs[0], seg.legs[1], P.k.legs, P.legs[0], P.legs[1], true, false);
    part(seg.torso[0], seg.torso[1], P.k.torso, P.torso[0], P.torso[1], true, true);
    part(seg.head[0], seg.head[1], P.k.head, P.head[0], P.head[1], false, true);
    return { canvas: out, plan: P, seg };
  }
  /* factor x (applied to every selected part) so that headFrac hits `target`. sel = { head, torso, legs } booleans. keepHeight does not matter: only proportions count. */
  function autoScale(seg, sel, target) {
    const h = { head: seg.head[1] - seg.head[0], torso: seg.torso[1] - seg.torso[0], legs: seg.legs[1] - seg.legs[0] };
    const fixed = Object.keys(h).filter(k => !sel[k]).reduce((s, k) => s + h[k], 0), moving = Object.keys(h).filter(k => sel[k]).reduce((s, k) => s + h[k], 0);
    if (!moving) return { head: 1, torso: 1, legs: 1, note: 'ยังไม่ได้เลือกส่วนที่จะปรับ' };
    const T = clamp(target, .1, .6), out = { head: 1, torso: 1, legs: 1, note: '' };
    if (sel.head && (sel.torso || sel.legs)) {   // head AND body selected: head by x, body by 1 (a head-vs-body target)
      const body = (sel.torso ? h.torso : 0) + (sel.legs ? h.legs : 0), rest = fixed;
      const x = T * (body + rest) / ((1 - T) * h.head); out.head = clamp(x, .5, 2); if (sel.torso) out.torso = 1; if (sel.legs) out.legs = 1; out.note = 'ปรับหัวอย่างเดียว (ลำตัว/ขาคงเดิม)'; return out;
    }
    let x;   // one common factor on the selected parts
    if (sel.head) x = T * fixed / ((1 - T) * h.head);          // head only
    else x = (h.head / T - fixed) / moving;                      // body parts only (head is part of `fixed`): head ÷ total = T
    x = clamp(x, .5, 2); for (const k of Object.keys(h)) if (sel[k]) out[k] = x; return out;
  }
  const api = { segments, plan, render, autoScale };
  root.ProportionAdjust = api; if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
