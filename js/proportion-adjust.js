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
     v98.413: connected forward mesh replaces inverse iteration; sampling uses premultiplied alpha. */
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
  function protectArms(WT, W, H, points, labels) {
    if (!points) return WT;
    const dist = (x, y, A, B) => { const dx = B[0] - A[0], dy = B[1] - A[1], t = clamp(((x - A[0]) * dx + (y - A[1]) * dy) / (dx * dx + dy * dy || 1), 0, 1); return Math.hypot(x - A[0] - dx * t, y - A[1] - dy * t) };
    const eye = points.eyeL && points.eyeR ? [(points.eyeL[0] + points.eyeR[0]) / 2, (points.eyeL[1] + points.eyeR[1]) / 2] : null;
    const face = eye && points.chin ? Math.hypot(eye[0] - points.chin[0], eye[1] - points.chin[1]) : H * .08, radius = Math.max(5, face * .9);
    const headTop = eye && points.chin ? [2 * eye[0] - points.chin[0], 2 * eye[1] - points.chin[1]] : null;
    const chains = ['L', 'R'].flatMap(side => { const shoulder = points['sh' + side], wrist = points['wrist' + side], elbow = points['elbow' + side]; if (!shoulder || !wrist) return []; const prev = elbow || shoulder, len = Math.hypot(wrist[0] - prev[0], wrist[1] - prev[1]) || 1, end = [wrist[0] + (wrist[0] - prev[0]) / len * face * .7, wrist[1] + (wrist[1] - prev[1]) / len * face * .7]; return [[shoulder, ...(elbow ? [elbow] : []), wrist, end]] });
    if (!chains.length) return WT;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let da = Infinity, side = 0; for (let c = 0; c < chains.length; c++) for (let j = 1; j < chains[c].length; j++) { const dd = dist(x, y, chains[c][j - 1], chains[c][j]); if (dd < da) { da = dd; side = c } }
      if (da > radius * 1.8) continue;
      // Nearest anatomical chain wins when a raised hand is beside the face.
      if (headTop && dist(x, y, headTop, points.chin) / Math.max(1, face) < da / radius) continue;
      const a = 1 - ss(radius * 1.15, radius * 1.8, da), i = y * W + x;
      if (labels && a > .5) labels[i] = points.shL && points.wristL ? 4 + side : 5;
      WT[0][i] *= 1 - a; WT[2][i] *= 1 - a; WT[1][i] = 1 - WT[0][i] - WT[2][i];
    }
    return WT;
  }
  /* v98.413: labels in original image coordinates. Arms follow the torso. */
  const ZONES = [null, ['หัว', '#ec4899'], ['ลำตัว', '#3b82f6'], ['ส่วนล่าง / ขา', '#22c55e'], ['แขนซ้ายภาพ', '#f59e0b'], ['แขนขวาภาพ', '#a855f7']];
  function zoneWeights(d, W, H, seg, opt, height) {
    const arms = new Uint8Array(W * H), wt = protectArms(weightsOf(d, W, H, seg, opt.mode || 'band', Math.max(2, (opt.soft ?? .06) * height), Math.max(1, Math.round(opt.grow ?? 10))), W, H, opt.points, arms), edits = opt.zoneEdits;
    if (edits && edits.length === W * H) {
      for (let i = 0; i < edits.length; i++) if (edits[i] >= 1 && edits[i] <= 5) { const j = edits[i] === 1 ? 0 : edits[i] === 3 ? 2 : 1; for (let c = 0; c < 3; c++) wt[c][i] = c === j ? 1 : 0; arms[i] = edits[i] >= 4 ? edits[i] : 0 }
      const r = Math.max(1, Math.round(Math.min(W, H) * .006)); for (let c = 0; c < 3; c++) wt[c] = boxBlur(wt[c], W, H, r);
    }
    const labels = new Uint8Array(W * H);
    for (let i = 0; i < labels.length; i++) { const j = wt[0][i] >= wt[1][i] && wt[0][i] >= wt[2][i] ? 0 : wt[1][i] >= wt[2][i] ? 1 : 2; labels[i] = j === 1 && arms[i] ? arms[i] : j + 1 }
    return { weights: wt, labels };
  }
  function paintZone(edits, W, H, x0, y0, x1, y1, radius, label) {
    const dx = x1 - x0, dy = y1 - y0, len = dx * dx + dy * dy;
    for (let y = Math.max(0, Math.floor(Math.min(y0, y1) - radius)); y <= Math.min(H - 1, Math.ceil(Math.max(y0, y1) + radius)); y++) for (let x = Math.max(0, Math.floor(Math.min(x0, x1) - radius)); x <= Math.min(W - 1, Math.ceil(Math.max(x0, x1) + radius)); x++) { const t = len ? clamp(((x - x0) * dx + (y - y0) * dy) / len, 0, 1) : 0; if (Math.hypot(x - x0 - t * dx, y - y0 - t * dy) <= radius) edits[y * W + x] = label }
  }
  function zoneCanvas(res, after = false) {
    const c = document.createElement('canvas'), image = after ? res.canvas : res.src; c.width = image.width; c.height = image.height;
    const g = c.getContext('2d'), im = image.getContext('2d').getImageData(0, 0, c.width, c.height), out = g.createImageData(c.width, c.height), labels = after ? res.outputLabels : res.labels, rgb = ZONES.map(z => z && z[1].slice(1).match(/../g).map(v => parseInt(v, 16)));
    for (let i = 0; i < labels.length; i++) { const col = rgb[labels[i] || 1]; for (let k = 0; k < 3; k++) out.data[i * 4 + k] = col[k]; out.data[i * 4 + 3] = im.data[i * 4 + 3] * .55 } g.putImageData(out, 0, 0); return c;
  }
  /* v98.398 · where a point of the original picture (px, in the warp's own orientation) ends up after warp() — used to move the datum points with the picture */
  function mapPoint(res, x, y) { if (res.forward) return res.forward(x, y).slice(0, 2); const s = res.seg, t = res.T[y < s.head[1] ? 0 : y < s.torso[1] ? 1 : 2]; return [t.bx + (x - t.ax) * t.kx, t.by + (y - t.ay) * t.ky] }
  function warp(img, m, marks, scale, opt = {}) {
    const W = m.w, H = m.h, cv = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c };
    const src = cv(), sg = src.getContext('2d', { willReadFrequently: true }); if (opt.flip) { sg.translate(W, 0); sg.scale(-1, 1) } sg.drawImage(img, 0, 0); sg.setTransform(1, 0, 0, 1, 0, 0);
    const d = sg.getImageData(0, 0, W, H).data, seg = segments(m, marks), P = plan(seg, scale, opt), K = ['head', 'torso', 'legs'];
    /* v98.402 · kx/ky instead of one shared k, so scale.shoulder can widen/narrow the torso sideways without touching how tall it is */
    const zones = zoneWeights(d, W, H, seg, opt, m.H), WT = zones.weights;
    const T = K.map((k, j) => { let cx = centreX(d, W, seg[k][0], seg[k][1]); if (k === 'head' && opt.points) { let sx = 0, n = 0; for (let i = 0; i < W * H; i++) { const a = WT[j][i] * d[i * 4 + 3]; sx += (i % W) * a; n += a } if (n) cx = sx / n } return { kx: P.kx[k], ky: P.k[k], ax: cx, ay: seg[k][1], bx: cx, by: P[k][1] } });
    const fwd = (x, y) => { const xi = clamp(Math.round(x), 0, W - 1), yi = clamp(Math.round(y), 0, H - 1), i = yi * W + xi; let fx = 0, fy = 0, kkx = 0, kky = 0, ws = 0;
      for (let j = 0; j < 3; j++) { const w = WT[j][i]; if (!w) continue; const t = T[j]; fx += w * (t.bx + t.kx * (x - t.ax)); fy += w * (t.by + t.ky * (y - t.ay)); kkx += w * t.kx; kky += w * t.ky; ws += w }
      return ws ? [fx / ws, fy / ws, kkx / ws, kky / ws] : [x, y, 1, 1] };
    /* Connected forward mesh avoids inverse-iteration tears. Expand the output
       around all transformed opaque pixels, including hair and raised hands. */
    const step = 2, xs = [], ys = []; for (let x = 0; x < W - 1; x += step) xs.push(x); xs.push(W - 1); for (let y = 0; y < H - 1; y += step) ys.push(y); ys.push(H - 1);
    const vertices = ys.map(y => xs.map(x => { const p = fwd(x, y); return [p[0], p[1], x, y, Math.max(p[2], p[3])] }));
    let minX = 0, minY = 0, maxX = W - 1, maxY = H - 1; const padding = Math.ceil(Math.max(...Object.values(P.k), ...Object.values(P.kx)) * 3 + step);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 0) { const p = fwd(x, y); minX = Math.min(minX, Math.floor(p[0] - padding)); minY = Math.min(minY, Math.floor(p[1] - padding)); maxX = Math.max(maxX, Math.ceil(p[0] + padding)); maxY = Math.max(maxY, Math.ceil(p[1] + padding)) }
    const OW = maxX - minX + 1, OH = maxY - minY + 1; if (OW * OH > 32000000) throw new Error('ภาพหลังขยายใหญ่เกินไป กรุณาลดสเกล');
    const out = document.createElement('canvas'); out.width = OW; out.height = OH;
    const og = out.getContext('2d'), od = og.createImageData(OW, OH), o = od.data, KL = new Float32Array(OW * OH), outputLabels = new Uint8Array(OW * OH);
    const cr = t => { const a = Math.abs(t); return a < 1 ? 1.5 * a * a * a - 2.5 * a * a + 1 : a < 2 ? -.5 * a * a * a + 2.5 * a * a - 4 * a + 2 : 0 };
    const sample = (X, Y, x, y, kl) => {
      const x0 = Math.floor(x), y0 = Math.floor(y), ax = x - x0, ay = y - y0; let r = 0, g = 0, b = 0, a = 0; const cubic = kl > 1.02 && opt.cubic !== false, lo = cubic ? -1 : 0, hi = cubic ? 2 : 1;
      for (let j = lo; j <= hi; j++) { const yy = y0 + j, wy = cubic ? cr(j - ay) : j ? ay : 1 - ay; if (yy < 0 || yy >= H || !wy) continue; for (let k = lo; k <= hi; k++) { const xx = x0 + k, w = wy * (cubic ? cr(k - ax) : k ? ax : 1 - ax); if (xx < 0 || xx >= W || !w) continue; const i = (yy * W + xx) * 4, al = d[i + 3] / 255 * w; r += d[i] * al; g += d[i + 1] * al; b += d[i + 2] * al; a += al } }
      const i = (Y * OW + X) * 4; if (a <= .003 || a * 255 < o[i + 3]) return; o[i] = r / a; o[i + 1] = g / a; o[i + 2] = b / a; o[i + 3] = clamp(a * 255, 0, 255); KL[Y * OW + X] = kl; outputLabels[Y * OW + X] = zones.labels[clamp(Math.round(y), 0, H - 1) * W + clamp(Math.round(x), 0, W - 1)];
    };
    let folds = 0;
    const triangle = (a, b, c) => {
      const den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]); if (Math.abs(den) < 1e-8) return; if (den < 0 && [a, b, c].every(p => d[(p[3] * W + p[2]) * 4 + 3] > 40)) folds++;
      const x0 = Math.max(0, Math.ceil(Math.min(a[0], b[0], c[0]) - minX)), x1 = Math.min(OW - 1, Math.floor(Math.max(a[0], b[0], c[0]) - minX)), y0 = Math.max(0, Math.ceil(Math.min(a[1], b[1], c[1]) - minY)), y1 = Math.min(OH - 1, Math.floor(Math.max(a[1], b[1], c[1]) - minY));
      for (let Y = y0; Y <= y1; Y++) for (let X = x0; X <= x1; X++) { const u = ((b[1] - c[1]) * (X + minX - c[0]) + (c[0] - b[0]) * (Y + minY - c[1])) / den, v = ((c[1] - a[1]) * (X + minX - c[0]) + (a[0] - c[0]) * (Y + minY - c[1])) / den, w = 1 - u - v; if (u < -1e-7 || v < -1e-7 || w < -1e-7) continue; sample(X, Y, u * a[2] + v * b[2] + w * c[2], u * a[3] + v * b[3] + w * c[3], u * a[4] + v * b[4] + w * c[4]) }
    };
    for (let j = 1; j < ys.length; j++) for (let i = 1; i < xs.length; i++) { const a = vertices[j - 1][i - 1], b = vertices[j - 1][i], c = vertices[j][i], e = vertices[j][i - 1]; triangle(a, b, c); triangle(a, c, e) }
    /* SHARPEN: unsharp mask (3×3) · amount = opt.sharpen (manual 0…1.5) or 'auto' = (local growth − 1) × 1.6 (max .9) — only where the picture was enlarged */
    const man = typeof opt.sharpen === 'number' ? Math.max(0, Math.min(1.5, opt.sharpen)) : null;
    if (man !== 0) { const src2 = new Uint8ClampedArray(o);
      for (let Y = 1; Y < OH - 1; Y++) for (let X = 1; X < OW - 1; X++) { const p = Y * OW + X, i = p * 4; if (src2[i + 3] < 20) continue; const amt = man != null ? man : Math.min(.9, Math.max(0, (KL[p] - 1) * 1.6)); if (amt < .01) continue;
        for (let c = 0; c < 3; c++) { let sum = 0, n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const q = ((Y + dy) * OW + X + dx) * 4; if (src2[q + 3] < 20) continue; sum += src2[q + c]; n++ } const blur = n ? sum / n : src2[i + c]; o[i + c] = src2[i + c] + amt * (src2[i + c] - blur) } } }
    og.putImageData(od, 0, 0);
    return { canvas: out, plan: P, seg, weights: WT, labels: zones.labels, outputLabels, src, T, offset: [-minX, -minY], folds, forward: (x, y) => { const p = fwd(x, y); return [p[0] - minX, p[1] - minY, p[2], p[3]] } };
  }
  const api = { segments, plan, render, warp, weightsOf, protectArms, autoScale, mapPoint, zoneWeights, zoneCanvas, paintZone, ZONES };
  root.ProportionAdjust = api; if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
