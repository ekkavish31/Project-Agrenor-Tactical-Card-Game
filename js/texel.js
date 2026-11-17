/* v98.569 · TEXEL DENSITY — one rule for how every picture is shown, whatever its native resolution.
   Pictures in this game come in very different sizes (a villager is a 384-px canvas, a prop 90–680 px, a building up to 3500 px) and each is
   drawn at its own size, so the ratio  screen px ÷ picture px  differs a lot: heavy down-scales look thin and crunchy, small ones look soft.
   1) REPORT  — a sample of the draw calls (1 frame in 30) is recorded per picture file: ratio · picture px · drawn px · page.
                Stored in localStorage 'projectA.texelStats' (shared by every page of the game) → texel-report.html and the Asset Manager tooltip read it.
   2) NORMALISE — a picture that would be drawn at less than 1/1.5 of its size is first shrunk ONCE to the drawn size (cached, step by step:
                each step ≤ ½ with high-quality smoothing — one big browser shrink aliases) and given the SAME mild sharpening for the same amount of
                shrinking, so a 4× shrunk villager and a 3× shrunk prop end up with the same crispness and line weight. Small / enlarged pictures are untouched.
   Switch off:  ?texel=0  or  localStorage 'projectA.texelNorm' = '0'  or  TexelNorm.enable(false).
   API: TexelNorm.{enable(on), enabled(), stats(), clear(), flush(), info()} */
(function (root) {
  'use strict';
  if (root.TexelNorm || typeof CanvasRenderingContext2D === 'undefined') return;
  const KEY = 'projectA.texelStats', NORM_KEY = 'projectA.texelNorm';
  const ls = { get: k => { try { return localStorage.getItem(k) } catch (e) { return null } }, set: (k, v) => { try { localStorage.setItem(k, v) } catch (e) { } } };
  let on = !(/[?&]texel=0(&|$)/.test(location.search) || ls.get(NORM_KEY) === '0');
  const draw0 = CanvasRenderingContext2D.prototype.drawImage;
  const cache = new Map(), MAX_BYTES = 56 * 1024 * 1024; let bytes = 0, hits = 0, builds = 0, ids = new WeakMap(), idN = 0;
  const idOf = im => { let i = ids.get(im); if (!i) ids.set(im, i = ++idN); return i };
  const bucket = w => Math.max(16, Math.round(Math.pow(1.1, Math.ceil(Math.log(w) / Math.log(1.1)))));
  const srcKey = im => String(im.currentSrc || im.src || '').replace(/^[a-z]+:\/\/[^/]+\//i, '').replace(/[?#].*$/, '');

  /* ---------- the one sharpening rule: amount grows with how much the picture was shrunk ---------- */
  function sharpen(c, down) {
    const amt = Math.min(.55, .2 * Math.log2(down)); if (amt < .04) return;
    try {
      const g = c.getContext('2d', { willReadFrequently: true }), w = c.width, h = c.height; if (w < 4 || h < 4) return;
      const im = g.getImageData(0, 0, w, h), d = im.data, o = new Uint8ClampedArray(d);
      for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4, a = d[i + 3]; if (a < 24) continue;
        let sr = 0, sg = 0, sb = 0, sw = 0;
        for (const j of [i - 4, i + 4, i - w * 4, i + w * 4]) { const aj = d[j + 3]; if (!aj) continue; sr += d[j] * aj; sg += d[j + 1] * aj; sb += d[j + 2] * aj; sw += aj }
        if (!sw) continue; const br = sr / sw, bg = sg / sw, bb = sb / sw;
        o[i] = d[i] + amt * (d[i] - br); o[i + 1] = d[i + 1] + amt * (d[i + 1] - bg); o[i + 2] = d[i + 2] + amt * (d[i + 2] - bb);
      }
      im.data.set(o); g.putImageData(im, 0, 0);
    } catch (e) { /* tainted canvas: leave as is */ }
  }
  function shrunk(im, sx, sy, sw, sh, target) {
    const key = idOf(im) + '|' + sx + '|' + sy + '|' + sw + '|' + sh + '|' + target, hit = cache.get(key);
    if (hit) { cache.delete(key); cache.set(key, hit); hits++; return hit }
    const f = target / sw, tw = Math.max(1, Math.round(sw * f)), th = Math.max(1, Math.round(sh * f));
    let cw = sw, ch = sh, src = im, rx = sx, ry = sy, rw = sw, rh = sh, c = null;
    while (cw / 2 >= tw) {   /* each step at most ½ */
      const nw = Math.max(tw, Math.ceil(cw / 2)), nh = Math.max(1, Math.ceil(ch / 2)), n = document.createElement('canvas'); n.width = nw; n.height = nh;
      const g = n.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; draw0.call(g, src, rx, ry, rw, rh, 0, 0, nw, nh);
      src = n; rx = ry = 0; rw = nw; rh = nh; cw = nw; ch = nh; c = n;
    }
    if (!c || c.width !== tw || c.height !== th) { const n = document.createElement('canvas'); n.width = tw; n.height = th; const g = n.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; draw0.call(g, src, rx, ry, rw, rh, 0, 0, tw, th); c = n }
    sharpen(c, sw / tw); builds++;
    cache.set(key, c); bytes += c.width * c.height * 4;
    while (bytes > MAX_BYTES && cache.size > 8) { const k = cache.keys().next().value, v = cache.get(k); cache.delete(k); bytes -= v.width * v.height * 4 }
    return c;
  }

  /* ---------- sampling for the report ---------- */
  const seen = new Map(); let sampling = false, frame = 0, lastFlush = 0;
  function note(im, sw, dwCss) {
    const k = srcKey(im); if (!k || /^data:|^blob:/.test(k)) return; const r = dwCss / sw;
    let e = seen.get(k); if (!e) seen.set(k, e = { r, lo: r, hi: r, sw: Math.round(sw), dw: Math.round(dwCss), n: 0 });
    e.r = r; e.lo = Math.min(e.lo, r); e.hi = Math.max(e.hi, r); e.sw = Math.round(sw); e.dw = Math.round(dwCss); e.n++;
  }
  function flush() {
    if (!seen.size) return; let all = {}; try { all = JSON.parse(ls.get(KEY) || '{}') || {} } catch (e) { }
    const page = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '');
    for (const [k, e] of seen) all[k] = { r: +e.r.toFixed(3), lo: +e.lo.toFixed(3), hi: +e.hi.toFixed(3), sw: e.sw, dw: e.dw, n: (all[k]?.n || 0) + e.n, p: page, t: Date.now() };
    seen.clear(); const keys = Object.keys(all); if (keys.length > 5000) { keys.sort((a, b) => all[a].t - all[b].t).slice(0, keys.length - 5000).forEach(k => delete all[k]) }
    ls.set(KEY, JSON.stringify(all));
  }
  (function loop() { frame++; sampling = frame % 30 === 0 && !document.hidden; if (frame % 240 === 0) flush(); requestAnimationFrame(loop) })();
  addEventListener('pagehide', flush);

  CanvasRenderingContext2D.prototype.drawImage = function (im) {
    const n = arguments.length;
    if (n < 5 || !(im instanceof HTMLImageElement) || !im.naturalWidth) return draw0.apply(this, arguments);
    let sx = 0, sy = 0, sw = im.naturalWidth, sh = im.naturalHeight, dx, dy, dw, dh;
    if (n === 9) { sx = arguments[1]; sy = arguments[2]; sw = arguments[3]; sh = arguments[4]; dx = arguments[5]; dy = arguments[6]; dw = arguments[7]; dh = arguments[8] } else if (n === 5) { dx = arguments[1]; dy = arguments[2]; dw = arguments[3]; dh = arguments[4] } else return draw0.apply(this, arguments);
    if (!(sw >= 48) || !(Math.abs(dw) > 0)) return draw0.apply(this, arguments);
    const t = this.getTransform(), scale = Math.hypot(t.a, t.b), dev = Math.abs(dw) * scale;
    if (sampling) note(im, sw, dev / (root.devicePixelRatio || 1));
    if (!on || !this.imageSmoothingEnabled || dev < 6) return draw0.apply(this, arguments);
    const target = bucket(dev);
    if (sw < target * 1.5 || sw > 6000) return draw0.apply(this, arguments);
    const c = shrunk(im, sx, sy, sw, sh, target);
    return draw0.call(this, c, 0, 0, c.width, c.height, dx, dy, dw, dh);
  };

  root.TexelNorm = {
    enable(v) { on = !!v; ls.set(NORM_KEY, on ? '1' : '0'); cache.clear(); bytes = 0 },
    enabled: () => on, flush, clear() { ls.set(KEY, '{}'); seen.clear() },
    stats() { flush(); try { return JSON.parse(ls.get(KEY) || '{}') || {} } catch (e) { return {} } },
    info: () => ({ on, cached: cache.size, mb: +(bytes / 1048576).toFixed(1), hits, builds })
  };
})(globalThis);
