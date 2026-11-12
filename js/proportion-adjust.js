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
    const H = m.H, top = m.top, y0 = Math.round(top + (marks.headTop ?? 0) * H), c = Math.round(top + clamp(marks.chin, .04, .9) * H), h = Math.round(top + clamp(marks.hip, .2, .95) * H), y1 = Math.round(top + (marks.ankle ?? 1) * H);
    const chin = clamp(c, y0 + 2, y1 - 6), hip = clamp(h, chin + 2, y1 - 2);
    return { head: [y0, chin], torso: [chin, hip], legs: [hip, y1], top: y0, bottom: y1 };
  }
  function plan(seg, scale, opt = {}) {
    const hh = seg.head[1] - seg.head[0], ht = seg.torso[1] - seg.torso[0], hl = seg.legs[1] - seg.legs[0], H0 = hh + ht + hl;
    const nh = hh * (scale.head ?? 1), nt = ht * (scale.torso ?? 1), nl = hl * (scale.legs ?? 1), Hn = nh + nt + nl;
    const g = opt.keepHeight === false ? 1 : H0 / Hn;                    // whole-figure factor that restores the original height
    const H1 = Hn * g, bottom = seg.bottom, top = bottom - H1;
    const out = { g, H0, H1, head: [top, top + nh * g], torso: [top + nh * g, top + (nh + nt) * g], legs: [top + (nh + nt) * g, bottom], k: { head: (scale.head ?? 1) * g, torso: (scale.torso ?? 1) * g, legs: (scale.legs ?? 1) * g } };
    /* v98.402 · shoulder width (scale.shoulder) widens/narrows the TORSO band sideways only — independent of how much it stretches vertically.
       Left out (or equal to scale.torso), the torso stays exactly as wide as before: a uniform scale, same as every other part. */
    out.kx = { head: out.k.head, torso: (scale.shoulder ?? scale.torso ?? 1) * g, legs: out.k.legs };
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

  /* v98.385 · SEAMLESS re-proportioning: ONE continuous warp of the picture instead of three cut-and-stacked layers (no gaps, no stepped seams).
     Each part (head · torso · legs) has a similarity transform (scale about the bottom of the part on its own centre line, moved to where the plan stacks it).
     Every pixel blends those transforms by soft weights, so at the chin / waist the image bends smoothly from one scale to the next.
       mode 'band'  → weights follow the cut lines with a soft transition (opt.soft = transition half-width, fraction of the height)
       mode 'shape' → weights follow the SHAPE of each part (its own opaque pixels, grown/blurred by opt.grow px): the head scales as the head outline,
                      a cape or weapon next to it follows the part it touches
     The inverse map is solved per output pixel by a few Newton-like steps (smooth field → converges), then sampled bilinearly (premultiplied alpha). */
  function boxBlur(a, w, h, r) { if (r < 1) return a; const t = new Float32Array(a.length), o = new Float32Array(a.length);
    for (let y = 0; y < h; y++) { let s = 0; const row = y * w; for (let x = -r; x <= r; x++) s += a[row + Math.min(w - 1, Math.max(0, x))]; for (let x = 0; x < w; x++) { t[row + x] = s / (2 * r + 1); s += a[row + Math.min(w - 1, x + r + 1)] - a[row + Math.max(0, x - r)] } }
    for (let x = 0; x < w; x++) { let s = 0; for (let y = -r; y <= r; y++) s += t[Math.min(h - 1, Math.max(0, y)) * w + x]; for (let y = 0; y < h; y++) { o[y * w + x] = s / (2 * r + 1); s += t[Math.min(h - 1, y + r + 1) * w + x] - t[Math.max(0, y - r) * w + x] } }
    return o }
  const ss = (a, b, x) => { const t = clamp((x - a) / ((b - a) || 1), 0, 1); return t * t * (3 - 2 * t) };
  function weightsOf(d, W, H, seg, mode, soft, grow) {
    const N = W * H, wh = new Float32Array(N), wt = new Float32Array(N), wl = new Float32Array(N), chin = seg.head[1], hip = seg.torso[1];
    for (let y = 0; y < H; y++) { const h = 1 - ss(chin - soft, chin + soft, y), l = ss(hip - soft, hip + soft, y), t = Math.max(0, 1 - h - l); for (let x = 0; x < W; x++) { const i = y * W + x; wh[i] = h; wt[i] = t; wl[i] = l } }
    if (mode !== 'shape') return [wh, wt, wl];
    /* the shape of each part: its opaque pixels in its own rows, grown and softened so the weights fade out around the outline */
    const mk = (a, b) => { const o = new Float32Array(N); for (let y = Math.max(0, a); y < Math.min(H, b); y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 40) o[y * W + x] = 1; return boxBlur(boxBlur(o, W, H, grow), W, H, Math.max(1, grow >> 1)) };
    const mh = mk(seg.head[0], seg.head[1]), mt = mk(seg.torso[0], seg.torso[1]), ml = mk(seg.legs[0], seg.legs[1]);
    for (let i = 0; i < N; i++) { const s0 = mh[i] + mt[i] + ml[i]; if (s0 < 1e-3) continue; const k = Math.min(1, s0 * 3), h = mh[i] / s0, t = mt[i] / s0, l = ml[i] / s0;   // near any part: its shape decides; far away: the band
      wh[i] = wh[i] * (1 - k) + h * k; wt[i] = wt[i] * (1 - k) + t * k; wl[i] = wl[i] * (1 - k) + l * k }
    return [wh, wt, wl];
  }
  /* v98.411 · Arms follow the torso through shoulder→elbow→wrist, even above
     the chin. No hand positions are guessed when datum is missing. */
  function protectArms(WT, W, H, points) {
    if (!points) return WT;
    const dist = (x, y, A, B) => { const dx = B[0] - A[0], dy = B[1] - A[1], t = clamp(((x - A[0]) * dx + (y - A[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1); return Math.hypot(x - A[0] - dx * t, y - A[1] - dy * t) };
    const eye = points.eyeL && points.eyeR ? [(points.eyeL[0] + points.eyeR[0]) / 2, (points.eyeL[1] + points.eyeR[1]) / 2] : null;
    const face = eye && points.chin ? Math.hypot(eye[0] - points.chin[0], eye[1] - points.chin[1]) : H * .08, radius = Math.max(4, face * .55);
    const headTop = eye && points.chin ? [2 * eye[0] - points.chin[0], 2 * eye[1] - points.chin[1]] : null;
    const chains = ['L', 'R'].flatMap(side => { const shoulder = points['sh' + side], wrist = points['wrist' + side], elbow = points['elbow' + side]; if (!shoulder || !wrist) return []; const prev = elbow || shoulder, len = Math.hypot(wrist[0] - prev[0], wrist[1] - prev[1]) || 1, end = [wrist[0] + (wrist[0] - prev[0]) / len * face * .7, wrist[1] + (wrist[1] - prev[1]) / len * face * .7]; return [[shoulder, ...(elbow ? [elbow] : []), wrist, end]] });
    if (!chains.length) return WT;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let da = Infinity; for (const chain of chains) for (let j = 1; j < chain.length; j++) da = Math.min(da, dist(x, y, chain[j - 1], chain[j]));
      if (da > radius * 1.6) continue;
      // Nearest anatomical chain wins when a raised hand is beside the face.
      if (headTop && dist(x, y, headTop, points.chin) / Math.max(1, face) < da / radius) continue;
      const a = 1 - ss(radius * .75, radius * 1.6, da), i = y * W + x;
      WT[0][i] *= 1 - a; WT[2][i] *= 1 - a; WT[1][i] = 1 - WT[0][i] - WT[2][i];
    }
    return WT;
  }
  /* v98.398 · where a point of the original picture (px, in the warp's own orientation) ends up after warp() — used to move the datum points with the picture */
  function mapPoint(res, x, y) { if (res.forward) return res.forward(x, y).slice(0, 2); const s = res.seg, t = res.T[y < s.head[1] ? 0 : y < s.torso[1] ? 1 : 2]; return [t.bx + (x - t.ax) * t.kx, t.by + (y - t.ay) * t.ky] }
  function warp(img, m, marks, scale, opt = {}) {
    const W = m.w, H = m.h, cv = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c };
    const src = cv(), sg = src.getContext('2d', { willReadFrequently: true }); if (opt.flip) { sg.translate(W, 0); sg.scale(-1, 1) } sg.drawImage(img, 0, 0); sg.setTransform(1, 0, 0, 1, 0, 0);
    const d = sg.getImageData(0, 0, W, H).data, seg = segments(m, marks), P = plan(seg, scale, opt), K = ['head', 'torso', 'legs'];
    /* v98.402 · kx/ky instead of one shared k, so scale.shoulder can widen/narrow the torso sideways without touching how tall it is */
    const WT = protectArms(weightsOf(d, W, H, seg, opt.mode || 'band', Math.max(2, (opt.soft ?? .06) * m.H), Math.max(1, Math.round(opt.grow ?? 10))), W, H, opt.points);
    const T = K.map((k, j) => { let cx = centreX(d, W, seg[k][0], seg[k][1]); if (k === 'head' && opt.points) { let sx = 0, n = 0; for (let i = 0; i < W * H; i++) { const a = WT[j][i] * d[i * 4 + 3]; sx += (i % W) * a; n += a } if (n) cx = sx / n } return { kx: P.kx[k], ky: P.k[k], ax: cx, ay: seg[k][1], bx: cx, by: P[k][1] } });
    const fwd = (x, y) => { const xi = clamp(Math.round(x), 0, W - 1), yi = clamp(Math.round(y), 0, H - 1), i = yi * W + xi; let fx = 0, fy = 0, kkx = 0, kky = 0, ws = 0;
      for (let j = 0; j < 3; j++) { const w = WT[j][i]; if (!w) continue; const t = T[j]; fx += w * (t.bx + t.kx * (x - t.ax)); fy += w * (t.by + t.ky * (y - t.ay)); kkx += w * t.kx; kky += w * t.ky; ws += w }
      return ws ? [fx / ws, fy / ws, kkx / ws, kky / ws] : [x, y, 1, 1] };
    const out = cv(), og = out.getContext('2d'), od = og.createImageData(W, H), o = od.data, KL = new Float32Array(W * H);
    const bL = P.head[1], bT = P.torso[1];
    /* v98.395 · UPSCALE quality: where a part is ENLARGED the picture is sampled bicubic (Catmull-Rom) instead of bilinear, then sharpened by how much it grew */
    const cr = t => { const a = Math.abs(t); return a < 1 ? 1.5 * a * a * a - 2.5 * a * a + 1 : a < 2 ? -.5 * a * a * a + 2.5 * a * a - 4 * a + 2 : 0 };
    for (let Y = 0; Y < H; Y++) for (let X = 0; X < W; X++) {
      const t = T[Y < bL ? 0 : Y < bT ? 1 : 2]; let x = t.ax + (X - t.bx) / t.kx, y = t.ay + (Y - t.by) / t.ky, klx = t.kx, kly = t.ky;   // first guess: that part's own inverse
      for (let it = 0; it < 6; it++) { const [fx, fy, kkx, kky] = fwd(x, y); x += (X - fx) / kkx; y += (Y - fy) / kky; klx = kkx; kly = kky }
      const kl = Math.max(klx, kly);   // either axis growing is enough reason to upscale carefully and sharpen
      if (x < -1 || y < -1 || x > W || y > H) continue;
      const x0 = Math.floor(x), y0 = Math.floor(y), ax = x - x0, ay = y - y0; let r = 0, g = 0, b = 0, a = 0;
      if (kl > 1.02 && opt.cubic !== false) {   /* bicubic, premultiplied alpha */
        for (let j = -1; j <= 2; j++) { const wy = cr(j - ay), yy = y0 + j; if (!wy || yy < 0 || yy >= H) continue; for (let i2 = -1; i2 <= 2; i2++) { const w = cr(i2 - ax) * wy, xx = x0 + i2; if (!w || xx < 0 || xx >= W) continue; const i = (yy * W + xx) * 4, al = d[i + 3] / 255 * w; r += d[i] * al; g += d[i + 1] * al; b += d[i + 2] * al; a += al } }
      } else for (const [dx, dy, w] of [[0, 0, (1 - ax) * (1 - ay)], [1, 0, ax * (1 - ay)], [0, 1, (1 - ax) * ay], [1, 1, ax * ay]]) { const xx = x0 + dx, yy = y0 + dy; if (xx < 0 || yy < 0 || xx >= W || yy >= H || !w) continue; const i = (yy * W + xx) * 4, al = d[i + 3] / 255 * w; r += d[i] * al; g += d[i + 1] * al; b += d[i + 2] * al; a += al }   /* bilinear */
      if (a <= .003) continue; const i = (Y * W + X) * 4; o[i] = r / a; o[i + 1] = g / a; o[i + 2] = b / a; o[i + 3] = Math.max(0, Math.min(255, a * 255)); KL[Y * W + X] = kl;
    }
    /* SHARPEN: unsharp mask (3×3) · amount = opt.sharpen (manual 0…1.5) or 'auto' = (local growth − 1) × 1.6 (max .9) — only where the picture was enlarged */
    const man = typeof opt.sharpen === 'number' ? Math.max(0, Math.min(1.5, opt.sharpen)) : null;
    if (man !== 0) { const src2 = new Uint8ClampedArray(o);
      for (let Y = 1; Y < H - 1; Y++) for (let X = 1; X < W - 1; X++) { const p = Y * W + X, i = p * 4; if (src2[i + 3] < 20) continue; const amt = man != null ? man : Math.min(.9, Math.max(0, (KL[p] - 1) * 1.6)); if (amt < .01) continue;
        for (let c = 0; c < 3; c++) { let sum = 0, n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const q = ((Y + dy) * W + X + dx) * 4; if (src2[q + 3] < 20) continue; sum += src2[q + c]; n++ } const blur = n ? sum / n : src2[i + c]; o[i + c] = src2[i + c] + amt * (src2[i + c] - blur) } } }
    og.putImageData(od, 0, 0);
    return { canvas: out, plan: P, seg, weights: WT, src, T, forward: fwd };
  }
  const api = { segments, plan, render, warp, weightsOf, protectArms, autoScale, mapPoint };
  root.ProportionAdjust = api; if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
