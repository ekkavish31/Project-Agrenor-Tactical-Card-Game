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
  const cache = new Map(), MAX_BYTES = 56 * 1024 * 1024; let bytes = 0, hits = 0, builds = 0, spent = 0, ids = new WeakMap(), idN = 0;
  const idOf = im => { let i = ids.get(im); if (!i) ids.set(im, i = ++idN); return i };
  const bucket = w => Math.max(16, Math.round(Math.pow(1.1, Math.ceil(Math.log(w) / Math.log(1.1)))));
  const srcKey = im => String(im.currentSrc || im.src || '').replace(/^[a-z]+:\/\/[^/]+\//i, '').replace(/[?#].*$/, '');

  /* v98.1073 · FPS: a new copy is no longer built INSIDE the frame that first needs it (one big picture = 100–200 ms → the jerk when a decoration walks into view;
     the old 4 ms budget was only checked before a build, so a single build could still take the whole frame). Builds are queued and done when the browser is idle:
     the shrink steps first, then the sharpening in row slices that stop when the idle time runs out. Until a copy is ready the picture is drawn as it is. */
  const jobs = new Map(); let pumping = false;
  const idleRun = f => (root.requestIdleCallback ? root.requestIdleCallback(f, { timeout: 800 }) : setTimeout(() => f(null), 16));
  const late = dl => !!(dl && dl.timeRemaining) && dl.timeRemaining() < 3;
  function finish(key, c) { jobs.delete(key); builds++; cache.set(key, c); bytes += c.width * c.height * 4;
    while (bytes > MAX_BYTES && cache.size > 8) { const k = cache.keys().next().value, v = cache.get(k); cache.delete(k); bytes -= v.width * v.height * 4 } }
  function prepare(j) {
    const { im, sx, sy, sw, sh, target } = j, f = target / sw, tw = Math.max(1, Math.round(sw * f)), th = Math.max(1, Math.round(sh * f));
    let cw = sw, ch = sh, src = im, rx = sx, ry = sy, rw = sw, rh = sh;
    while (cw / 2 >= tw) {   /* each step at most ½ */
      const nw = Math.max(tw, Math.ceil(cw / 2)), nh = Math.max(1, Math.ceil(ch / 2)), n = document.createElement('canvas'); n.width = nw; n.height = nh;
      const g = n.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; draw0.call(g, src, rx, ry, rw, rh, 0, 0, nw, nh);
      src = n; rx = ry = 0; rw = nw; rh = nh; cw = nw; ch = nh;
    }
    /* the final copy is a CPU-side canvas (willReadFrequently before the first draw): the sharpening reads its pixels back cheaply */
    const c = document.createElement('canvas'); c.width = tw; c.height = th; const g = c.getContext('2d', { willReadFrequently: true }); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; draw0.call(g, src, rx, ry, rw, rh, 0, 0, tw, th);
    j.c = c; j.amt = Math.min(.55, .2 * Math.log2(sw / tw));
    if (j.amt < .04 || tw < 4 || th < 4) return true;
    try { j.g = g; j.img = g.getImageData(0, 0, tw, th); j.d = j.img.data; j.o = new Uint8ClampedArray(j.d); j.y = 1 } catch (e) { return true }   /* tainted: keep it unsharpened */
    return false;
  }
  function sharpenRows(j, dl) {   /* the one sharpening rule (amount grows with how much the picture was shrunk), resumable */
    const { d, o, amt } = j, w = j.c.width, h = j.c.height;
    for (; j.y < h - 1; j.y++) {
      const y = j.y;
      for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4, a = d[i + 3]; if (a < 24) continue;
        let sr = 0, sg = 0, sb = 0, sw = 0, k, ak;
        k = i - 4; ak = d[k + 3]; if (ak) { sr += d[k] * ak; sg += d[k + 1] * ak; sb += d[k + 2] * ak; sw += ak }
        k = i + 4; ak = d[k + 3]; if (ak) { sr += d[k] * ak; sg += d[k + 1] * ak; sb += d[k + 2] * ak; sw += ak }
        k = i - w * 4; ak = d[k + 3]; if (ak) { sr += d[k] * ak; sg += d[k + 1] * ak; sb += d[k + 2] * ak; sw += ak }
        k = i + w * 4; ak = d[k + 3]; if (ak) { sr += d[k] * ak; sg += d[k + 1] * ak; sb += d[k + 2] * ak; sw += ak }
        if (!sw) continue; const br = sr / sw, bg = sg / sw, bb = sb / sw;
        o[i] = d[i] + amt * (d[i] - br); o[i + 1] = d[i + 1] + amt * (d[i + 1] - bg); o[i + 2] = d[i + 2] + amt * (d[i + 2] - bb);
      }
      if ((y & 7) === 0 && late(dl)) { j.y++; return false }
    }
    j.img.data.set(o); j.g.putImageData(j.img, 0, 0); return true;
  }
  function work(dl) {
    pumping = false; const t0 = performance.now();
    while (jobs.size) {
      const [key, j] = jobs.entries().next().value;
      try { if (!j.c) { if (prepare(j)) { finish(key, j.c); } } else if (sharpenRows(j, dl)) finish(key, j.c) } catch (e) { jobs.delete(key) }
      if (late(dl) || (!dl && performance.now() - t0 > 6)) break;
    }
    if (jobs.size) pump();
  }
  function pump() { if (!pumping && jobs.size) { pumping = true; idleRun(work) } }
  function shrunk(im, sx, sy, sw, sh, target) {
    const key = idOf(im) + '|' + sx + '|' + sy + '|' + sw + '|' + sh + '|' + target, hit = cache.get(key);
    if (hit) { cache.delete(key); cache.set(key, hit); hits++; return hit }
    if (!jobs.has(key) && jobs.size < 96) { jobs.set(key, { im, sx, sy, sw, sh, target }); pump() }
    return null;
  }

  /* ---------- sampling for the report ---------- */
  const seen = new Map(); let sampling = false, frame = 0, lastFlush = 0;
  function note(im, sw, dwCss) {
    const k = srcKey(im); if (!k || /^data:|^blob:/.test(k)) return; const r = dwCss / sw;
    let e = seen.get(k); if (!e) seen.set(k, e = { r, lo: r, hi: r, sw: Math.round(sw), dw: Math.round(dwCss), n: 0 });
    e.r = r; e.lo = Math.min(e.lo, r); e.hi = Math.max(e.hi, r); e.sw = Math.round(sw); e.dw = Math.round(dwCss); e.n++;
  }
  /* v98.1064 · FPS: the report used to be merged into localStorage every 240 frames (JSON.parse + stringify of up to 5000 rows ≈ 10–20 ms on the
     main thread → a dropped frame every ~4 s while walking). Now the stored table is read once, merged in memory, and written at most every 30 s,
     when the browser is idle (and on pagehide). */
  let table = null, dirty = false, lastWrite = 0;
  function merge() {
    if (!seen.size) return; if (!table) { try { table = JSON.parse(ls.get(KEY) || '{}') || {} } catch (e) { table = {} } }
    const page = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '');
    for (const [k, e] of seen) table[k] = { r: +e.r.toFixed(3), lo: +e.lo.toFixed(3), hi: +e.hi.toFixed(3), sw: e.sw, dw: e.dw, n: (table[k]?.n || 0) + e.n, p: page, t: Date.now() };
    seen.clear(); dirty = true;
  }
  function flush() {
    merge(); if (!dirty) return;
    try { const other = JSON.parse(ls.get(KEY) || '{}') || {}; for (const k in other) if (!table[k] || other[k].t > table[k].t) table[k] = other[k] } catch (e) { }   /* other pages of the game write the same table */
    const keys = Object.keys(table); if (keys.length > 5000) { keys.sort((a, b) => table[a].t - table[b].t).slice(0, keys.length - 5000).forEach(k => delete table[k]) }
    ls.set(KEY, JSON.stringify(table)); dirty = false; lastWrite = performance.now();
  }
  const idle = f => (root.requestIdleCallback ? root.requestIdleCallback(f, { timeout: 5000 }) : setTimeout(f, 0));
  let queued = false;
  (function loop() { frame++; spent = 0; sampling = frame % 30 === 0 && !document.hidden; if (frame % 240 === 0) { merge(); if (dirty && !queued && performance.now() - lastWrite > 30000) { queued = true; idle(() => { queued = false; flush() }) } } requestAnimationFrame(loop) })();
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
    const c = shrunk(im, sx, sy, sw, sh, target); if (!c) return draw0.apply(this, arguments);
    return draw0.call(this, c, 0, 0, c.width, c.height, dx, dy, dw, dh);
  };

  root.TexelNorm = {
    enable(v) { on = !!v; ls.set(NORM_KEY, on ? '1' : '0'); cache.clear(); jobs.clear(); bytes = 0 },
    enabled: () => on, flush, clear() { ls.set(KEY, '{}'); seen.clear(); table = {}; dirty = false },
    stats() { flush(); try { return JSON.parse(ls.get(KEY) || '{}') || {} } catch (e) { return {} } },
    info: () => ({ on, cached: cache.size, mb: +(bytes / 1048576).toFixed(1), hits, builds, queued: jobs.size })
  };
})(globalThis);
