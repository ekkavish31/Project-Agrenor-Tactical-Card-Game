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
  const S = [mk(), mk(), mk(), mk(), mk()];   /* per strip: ¼-size blurred copy (with its fade already applied) + the ⅛ scratch */
  /* the whole job is done at ¼ / ⅛ size: copy the strip down, average it down again, bring it back up (smooth), fade it with a gradient — at that tiny size — and the
     final picture is ONE scaled drawImage per strip onto the canvas. No full-size scratch canvases (those were most of the cost). */
  function strip(cv, y, h, top, k) {
    const W = cv.width, w1 = Math.max(1, W >> 2), h1 = Math.max(1, h >> 2), w2 = Math.max(1, W >> 3), h2 = Math.max(1, h >> 3), a = S[k * 2], b = S[k * 2 + 1];
    if (a.width !== w1 || a.height !== h1) { a.width = w1; a.height = h1 } if (b.width !== w2 || b.height !== h2) { b.width = w2; b.height = h2 }
    const qa = a.getContext('2d'), qb = b.getContext('2d'); qa.imageSmoothingEnabled = qb.imageSmoothingEnabled = true; qa.imageSmoothingQuality = qb.imageSmoothingQuality = 'medium';
    qa.globalCompositeOperation = qb.globalCompositeOperation = 'copy';
    qa.drawImage(cv, 0, y, W, h, 0, 0, w1, h1); qb.drawImage(a, 0, 0, w1, h1, 0, 0, w2, h2); qa.drawImage(b, 0, 0, w2, h2, 0, 0, w1, h1);
    qa.globalCompositeOperation = 'destination-in';
    const gr = qa.createLinearGradient(0, 0, 0, h1); if (top) { gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.55, 'rgba(0,0,0,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)') } else { gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(.45, 'rgba(0,0,0,.6)'); gr.addColorStop(1, 'rgba(0,0,0,1)') }
    qa.fillStyle = gr; qa.fillRect(0, 0, w1, h1); qa.globalCompositeOperation = 'source-over';
    return a;
  }
  function apply(g, cv, o = {}) {
    if (!enabled || !g || !cv || cv.width < 320 || cv.height < 240) return;
    const H = cv.height, W = cv.width, th = Math.round(H * (o.top ?? .2)), bh = Math.round(H * (o.bottom ?? .17));
    try {
      const t = strip(cv, 0, th, true, 0), bt = strip(cv, H - bh, bh, false, 1);   /* both strips are read before either is drawn back */
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'low';
      g.drawImage(t, 0, 0, t.width, t.height, 0, 0, W, th); g.drawImage(bt, 0, 0, bt.width, bt.height, 0, H - bh, W, bh);
      g.restore();
    } catch (e) { try { g.restore() } catch (x) { } }
  }
  root.TiltShift = { apply, enabled: () => enabled, set(v) { enabled = !!v; try { const o = JSON.parse(localStorage.getItem(KEY) || '{}'); o.tiltShift = !!v; localStorage.setItem(KEY, JSON.stringify(o)) } catch (e) { } } };
})(typeof window !== 'undefined' ? window : globalThis);
