/* v98.575 · Octopath-style tilt-shift, drawn INSIDE the canvas (no backdrop-filter, no ctx.filter): the top and the bottom of the picture are blurred, strongest at the edge,
   fading to sharp towards the middle, so the scene reads as a diorama.
   How (cheap, a few thousand pixels of work per frame): each strip is copied down to 1/8 size in two halving steps (a real box average), brought back up in two
   steps (smooth, no blocks), then faded in with a gradient. The old CSS backdrop-filter re-blurred the whole 1600×180 strip every frame (41 → 58 fps when it was hidden);
   this does not.   TiltShift.apply(ctx, canvas) · call it once per frame, after the scene and its lighting, before UI drawn on the canvas.
   Off:  HD2D option tiltShift (village ⚙ panel)  or  localStorage 'projectA.hd2d' = {"tiltShift":false} */
(function (root) {
  'use strict';
  const KEY = 'projectA.hd2d';
  const on = () => { try { const o = JSON.parse(localStorage.getItem(KEY) || '{}'); return o.tiltShift !== false } catch (e) { return true } };
  let enabled = on(); addEventListener('storage', e => { if (e.key === KEY) enabled = on() });
  const mk = () => document.createElement('canvas');
  const S = Array.from({ length: 10 }, mk);   /* per strip (×2): ½-size working copy · ¼ · ⅛ · mild layer · strong layer */
  /* v98.663 · PROGRESSIVE blur (Octopath-like) instead of one muddy ⅛-size copy:
       a mild layer (¼-size average, brought back up) fades in from the sharp middle, a strong layer (⅛-size average) joins only near the very edge,
       so the picture goes sharp → soft → blurred smoothly, with no dark vignette and no hard step. Both layers are composited on a ½-size result and drawn with ONE scaled drawImage per strip. */
  function strip(cv, y, h, top, k) {
    const W = cv.width, w1 = Math.max(2, W >> 1), h1 = Math.max(2, h >> 1), w2 = Math.max(1, W >> 2), h2 = Math.max(1, h >> 2), w3 = Math.max(1, W >> 3), h3 = Math.max(1, h >> 3);
    const [c1, c2, c3, mild, strong] = S.slice(k * 5, k * 5 + 5), fit = (c, w, h) => { if (c.width !== w || c.height !== h) { c.width = w; c.height = h } const q = c.getContext('2d'); q.imageSmoothingEnabled = true; q.imageSmoothingQuality = 'medium'; q.globalCompositeOperation = 'copy'; return q };
    const q1 = fit(c1, w1, h1), q2 = fit(c2, w2, h2), q3 = fit(c3, w3, h3), qm = fit(mild, w1, h1), qs = fit(strong, w1, h1);
    q1.drawImage(cv, 0, y, W, h, 0, 0, w1, h1); q2.drawImage(c1, 0, 0, w1, h1, 0, 0, w2, h2); q3.drawImage(c2, 0, 0, w2, h2, 0, 0, w3, h3);
    qm.drawImage(c2, 0, 0, w2, h2, 0, 0, w1, h1); qs.drawImage(c3, 0, 0, w3, h3, 0, 0, w1, h1);
    const ramp = (q, stops) => { q.globalCompositeOperation = 'destination-in'; const gr = q.createLinearGradient(0, 0, 0, h1); for (const [p, a] of stops) gr.addColorStop(top ? p : 1 - p, `rgba(0,0,0,${a})`); q.fillStyle = gr; q.fillRect(0, 0, w1, h1); q.globalCompositeOperation = 'source-over' };
    ramp(qm, [[0, 1], [.4, .8], [.8, .25], [1, 0]]); ramp(qs, [[0, 1], [.3, .6], [.65, 0], [1, 0]]);
    q1.globalCompositeOperation = 'copy'; q1.drawImage(mild, 0, 0); q1.globalCompositeOperation = 'source-over'; q1.drawImage(strong, 0, 0);   /* c1 now holds the finished strip (mild + strong layers) at ½ size */
    return c1;
  }
  /* The READ-BACK of the big canvas into the strip canvases is the expensive part, so the blurred strips are cached — but a cache is only invisible while the picture stands still:
     when the camera moves, an old strip lags behind the live scene and the blurred edge wobbles like jelly (v98.663). While the hero walks the strips are rebuilt EVERY frame
     (every 2nd frame only when the last rebuild was slow); standing still they are rebuilt every few frames. */
  let frame = 0, every = 3, cached = null, cKey = '';
  const moving = () => document.documentElement.classList.contains('hd2d-moving');
  function apply(g, cv, o = {}) {
    if (!enabled || !g || !cv || cv.width < 320 || cv.height < 240) return;
    const H = cv.height, W = cv.width, th = Math.round(H * (o.top ?? .2)), bh = Math.round(H * (o.bottom ?? .17));
    try {
      const key = W + 'x' + H + ':' + th + ':' + bh; let t, bt;
      const step = moving() ? (every > 4 ? 2 : 1) : every;
      if (cached && cKey === key && (++frame % step) !== 0) { t = cached[0]; bt = cached[1] }
      else { const t0 = performance.now(); t = strip(cv, 0, th, true, 0); bt = strip(cv, H - bh, bh, false, 1); cached = [t, bt]; cKey = key; const ms = performance.now() - t0; every = ms > 8 ? 8 : ms > 3 ? 5 : 3 }
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'low';
      g.drawImage(t, 0, 0, t.width, t.height, 0, 0, W, th); g.drawImage(bt, 0, 0, bt.width, bt.height, 0, H - bh, W, bh);
      g.restore();
    } catch (e) { try { g.restore() } catch (x) { } }
  }
  root.TiltShift = { apply, enabled: () => enabled, set(v) { enabled = !!v; try { const o = JSON.parse(localStorage.getItem(KEY) || '{}'); o.tiltShift = !!v; localStorage.setItem(KEY, JSON.stringify(o)) } catch (e) { } } };
})(typeof window !== 'undefined' ? window : globalThis);
