/* v98.118 · Proportion tool (⚖ Scale Lineup → 📐 สัดส่วน): measures HEAD : BODY of a character picture so the whole cast can be checked to be the same semi-SD ratio.
   Pure functions (no DOM): the page gives the alpha channel of a picture, this file finds the three lines that matter and the ratios between them.

     chin     = bottom of the head (fraction of the silhouette height, from the top)
     shoulder = where the shoulders are widest
     hip      = the crotch (where the two legs meet) — torso above it, legs below

   Auto-estimate reads only the silhouette (row widths + how many separate runs a row has), so it is a good first guess; the page lets you drag the lines.
   Standard (docs/PROMPTS-CAST-RESTYLE-SD.md): 2.7–3 heads tall → head ≈ 38 % of the height, head wider than the shoulders (≈ 1.3×). */
(function (root) {
  'use strict';
  const KEY = 'proportion-marks-v1';
  const STD = { head: 0.38, tol: 0.04, minHeadShoulder: 1.0, castTol: 0.03 };

  /* per row: left / right edge, number of separate runs (gaps ≥ 2 px split runs) */
  function rows(d, w, top, bottom) {
    const out = [];
    for (let y = top; y <= bottom; y++) {
      let l = -1, r = -1, runs = 0, gap = 99;
      for (let x = 0; x < w; x++) {
        if (d[(y * w + x) * 4 + 3] > 40) { if (l < 0) l = x; r = x; if (gap >= 2) runs++; gap = 0 } else gap++;
      }
      out.push({ l, r, runs, width: l < 0 ? 0 : r - l + 1 });
    }
    return out;
  }
  const smooth = (a, k = 2) => a.map((_, i) => { let s = 0, n = 0; for (let j = Math.max(0, i - k); j <= Math.min(a.length - 1, i + k); j++) { s += a[j]; n++ } return s / n });

  /* the face: the first band of light skin-coloured pixels in the upper half. Its lowest row ≈ the chin (a short neck is included). null when the face is not skin-coloured (beard, mask, hood). */
  function faceBand(d, w, top, H) {
    const lim = Math.floor(H * 0.62), cnt = new Array(lim).fill(0);
    /* only look inside the column of the head (the width of the top 20 %), so bare arms / hands beside the body are not mistaken for the face */
    let hl = w, hr = -1; for (let i = 0; i < Math.floor(H * 0.2); i++) { const y = top + i; for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) { if (x < hl) hl = x; if (x > hr) hr = x } }
    if (hr < 0) return null; const pad = Math.round((hr - hl) * 0.06), xa = Math.max(0, hl - pad), xb = Math.min(w - 1, hr + pad), cap = Math.round((hr - hl + 1) * 1.0);
    for (let i = 0; i < lim; i++) { const y = top + i; for (let x = xa; x <= xb; x++) { const k = (y * w + x) * 4; if (d[k + 3] < 200) continue; const r = d[k], g = d[k + 1], b = d[k + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), lum = 0.3 * r + 0.59 * g + 0.11 * b;
        const sat = (mx - mn) / mx; if (r >= g && g >= b && r > 150 && lum > 140 && lum < 238 && (r - g) >= 22 && (g - b) >= 12 && sat >= 0.22 && sat <= 0.55) cnt[i]++ } }
    const sm = smooth(cnt, 2); let peak = 0, pv = 0; for (let i = 0; i < lim; i++) if (sm[i] > pv) { pv = sm[i]; peak = i }
    if (pv < 12) return null;
    /* the first strong peak from the top is the face (hands are lower and smaller) */
    let first = peak; for (let i = 0; i < lim; i++) if (sm[i] > pv * 0.6) { first = i; break }
    let lo = first, hi = first, gap = 0;
    for (let i = first; i >= 0; i--) { if (sm[i] > pv * 0.12) { lo = i; gap = 0 } else if (++gap > 4) break }
    gap = 0; for (let i = first; i < lim; i++) { if (sm[i] > pv * 0.12) { hi = i; gap = 0 } else if (++gap > 4) break }
    return { top: lo, bottom: Math.min(hi, cap), peak: first };
  }

  /* the three lines (fractions of H, 0 = top of head, 1 = soles) estimated from the silhouette (+ skin colour for the chin) */
  function estimate(alpha, m) {
    const R = rows(alpha.d, alpha.w, m.top, m.bottom), H = R.length, W = smooth(R.map(r => r.width));
    let peak = 0, pv = -1; for (let i = 0; i < Math.floor(H * 0.42); i++) if (W[i] > pv) { pv = W[i]; peak = i }
    const headW = pv;
    /* chin: the narrowing under the head (neck / chin) right before the shoulders widen again */
    let chin = -1, mi = peak, mv = pv; const lim = Math.floor(H * 0.62);
    for (let i = peak; i < lim; i++) {
      if (W[i] < mv) { mv = W[i]; mi = i }
      if (mv < headW * 0.97 && W[i] > mv + headW * 0.08) { chin = mi; break }
    }
    let confChin = chin >= 0, viaFace = false;
    { const fb = faceBand(alpha.d, alpha.w, m.top, H); if (fb && fb.bottom > H * 0.12 && fb.bottom < H * 0.5) { chin = fb.bottom; confChin = true; viaFace = true } }
    if (chin < 0) { for (let i = peak; i < lim; i++) if (W[i] <= headW * 0.72) { chin = i; break } }
    if (chin < 0) { chin = Math.round(H * STD.head); confChin = false }
    chin = Math.min(Math.max(chin, Math.round(H * 0.14)), Math.round(H * 0.56));
    /* shoulder: widest row shortly under the chin */
    let sh = chin, sv = -1; for (let i = chin; i < Math.min(H - 1, chin + Math.round(H * 0.18)); i++) if (W[i] > sv) { sv = W[i]; sh = i }
    /* hip: from the soles up, rows with two separate runs are the legs; the first single-run row above them is the crotch */
    let hip = -1, seenTwo = false, single = 0;
    for (let i = H - 3; i > Math.round(H * 0.45); i--) {
      if (R[i].runs >= 2) { seenTwo = true; single = 0 } else if (seenTwo) { single++; if (single >= 3) { hip = i + 3; break } }
    }
    const confHip = hip >= 0; if (hip < 0) hip = Math.round(H * 0.64);
    hip = Math.min(Math.max(hip, chin + Math.round(H * 0.1)), Math.round(H * 0.8));
    return { chin: chin / H, shoulder: sh / H, hip: hip / H, conf: { chin: confChin, hip: confHip, face: viaFace } };
  }

  /* widths measured at the marked lines + all ratios. `marks` = {chin, shoulder, hip} fractions; when missing they are estimated. */
  function analyze(alpha, m, marks) {
    const auto = !marks, mk = marks || estimate(alpha, m), R = rows(alpha.d, alpha.w, m.top, m.bottom), H = R.length;
    const yc = Math.min(H - 1, Math.max(1, Math.round(mk.chin * H))), ys = Math.min(H - 1, Math.max(0, Math.round(mk.shoulder * H)));
    let headW = 0; for (let i = 0; i <= yc; i++) headW = Math.max(headW, R[i].width);
    let shoulderW = 0; for (let i = Math.max(0, ys - 1); i <= Math.min(H - 1, ys + 1); i++) shoulderW = Math.max(shoulderW, R[i].width);
    const head = mk.chin, torso = mk.hip - mk.chin, legs = 1 - mk.hip;
    return {
      marks: { chin: mk.chin, shoulder: mk.shoulder, hip: mk.hip }, auto, conf: mk.conf || null, H, headW, shoulderW,
      head, heads: head > 0 ? 1 / head : 0, torso, legs, headToShoulder: shoulderW ? headW / shoulderW : 0, headWOverH: H ? headW / H : 0
    };
  }

  /* ok / warn / bad against the standard and (optional) the median head fraction of the cast */
  function verdict(r, std, med) {
    std = Object.assign({}, STD, std || {}); const notes = []; let level = 'ok'; const up = l => { if (l === 'bad' || (l === 'warn' && level === 'ok')) level = l };
    const d = r.head - std.head;
    if (Math.abs(d) > std.tol * 2) { up('bad'); notes.push(d < 0 ? 'หัวเล็กเกินไป (' + (r.head * 100).toFixed(0) + '% ของตัว)' : 'หัวโตเกินไป (' + (r.head * 100).toFixed(0) + '% ของตัว)') }
    else if (Math.abs(d) > std.tol) { up('warn'); notes.push(d < 0 ? 'หัวค่อนข้างเล็ก' : 'หัวค่อนข้างโต') }
    if (r.headToShoulder && r.headToShoulder < std.minHeadShoulder) { up('warn'); notes.push('หัวแคบกว่าช่วงไหล่+แขน (' + r.headToShoulder.toFixed(2) + '×) — กึ่ง SD หัวควรกว้างกว่า') }
    if (med != null && Math.abs(r.head - med) > std.castTol) { up('warn'); notes.push('ต่างจากค่ากลางของทีม ' + (((r.head - med) * 100) > 0 ? '+' : '') + ((r.head - med) * 100).toFixed(0) + ' จุด') }
    return { level, notes };
  }
  const median = a => { const s = a.filter(x => isFinite(x)).sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null };

  const store = {
    KEY,
    load() { try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); return o && typeof o === 'object' ? o : {} } catch (e) { return {} } },
    save(o) { try { localStorage.setItem(KEY, JSON.stringify(o)) } catch (e) { } }
  };
  root.ProportionTool = { STD, estimate, analyze, verdict, median, store, rows };
  if (typeof module === 'object' && module.exports) module.exports = root.ProportionTool;
})(typeof window !== 'undefined' ? window : globalThis);
