/* v98.946 · Painted conversation backgrounds and transparent village atlases.
   Draws authored pixels only; the previous shapes remain load-failure fallbacks.
   Atlas regions are trimmed once by alpha, keeping transparent padding out of scale/feet measurements. */
(function (root) {
  'use strict';
  const BASE = 'assets/generated-village/';
  const BG = { innHall: 'inn', guildHall: 'guild', temple: 'temple', hearth: 'healer', hildaFarm: 'farm', houseDoor: 'door' };
  const PORTRAITS = { clerk: BASE + 'clerk.png', vera: BASE + 'vera.png', boss: BASE + 'boss.png' };
  const VENDORS = ['m1', 'm2', 'm3', 'f1', 'f2', 'f3', 'g1', 'g2', 'g3', 'g4'];
  const PROPS = ['weed', 'branch', 'rock', 'stump', 'fence', 'bin', 'plank', 'oldmap', 'chicken', 'sheep', 'cow', 'traveller'];
  const images = new Map(), regions = new Map();
  function image(src) {
    if (!images.has(src) && typeof Image !== 'undefined') {
      const im = new Image(); im.src = src; images.set(src, im);
    }
    return images.get(src);
  }
  const ready = im => !!(im && im.complete && im.naturalWidth);
  function background(name) { return BG[name] ? BASE + BG[name] + '.png' : null; }
  function scene(s) { const bg = background(s && s.art); return bg ? { ...s, art: null, bg } : s; }
  function preload(srcs) {
    return Promise.race([Promise.all([...new Set(srcs)].filter(Boolean).map(src => {
      const im = image(src); if (!im || im.complete) return Promise.resolve();
      return new Promise(resolve => { im.addEventListener('load', resolve, { once: true }); im.addEventListener('error', resolve, { once: true }); });
    })), new Promise(resolve => setTimeout(resolve, 6000))]);
  }
  function cell(name) {
    const vi = VENDORS.indexOf(name), pi = PROPS.indexOf(name);
    const i = vi >= 0 ? vi : pi; if (i < 0) return null;
    const cols = vi >= 0 ? 5 : 4, rows = vi >= 0 ? 2 : 3;
    const src = BASE + (vi >= 0 ? 'vendors' : 'farmprops') + '.png', im = image(src);
    if (!ready(im)) return null;
    if (regions.has(name)) return { image: im, ...regions.get(name) };
    const x = Math.round(i % cols * im.naturalWidth / cols), y = Math.round(Math.floor(i / cols) * im.naturalHeight / rows);
    const w = Math.round((i % cols + 1) * im.naturalWidth / cols) - x;
    const h = Math.round((Math.floor(i / cols) + 1) * im.naturalHeight / rows) - y;
    let r = { x, y, w, h };
    if (typeof document !== 'undefined') try {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, x, y, w, h, 0, 0, w, h);
      const a = g.getImageData(0, 0, w, h).data; let lx = w, ly = h, rx = -1, ry = -1;
      for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) if (a[(yy * w + xx) * 4 + 3] > 24) {
        lx = Math.min(lx, xx); ly = Math.min(ly, yy); rx = Math.max(rx, xx); ry = Math.max(ry, yy);
      }
      if (rx >= lx) r = { x: x + lx, y: y + ly, w: rx - lx + 1, h: ry - ly + 1 };
    } catch (e) { /* unavailable pixel access: use the safe equal-size atlas cell */ }
    regions.set(name, r); return { image: im, ...r };
  }
  function draw(g, name, x, y, width, options = {}) {
    const r = cell(name); if (!r) return false;
    const k = options.height ? options.height / r.h : width / r.w, w = r.w * k, h = r.h * k;
    g.save(); g.translate(x, y); if (options.flip) g.scale(-1, 1);
    g.drawImage(r.image, r.x, r.y, r.w, r.h, -w / 2, -h, w, h); g.restore(); return true;
  }
  /* Request atlases early so page loading gates can observe them. */
  if (typeof document !== 'undefined') { image(BASE + 'vendors.png'); image(BASE + 'farmprops.png'); if (typeof location !== 'undefined' && /place-interior/.test(location.pathname)) image(BASE + 'door.png'); }
  root.VillagePaintedArt = { BASE, BG, PORTRAITS, VENDORS, PROPS, background, scene, preload, image, cell, draw };
})(typeof window !== 'undefined' ? window : globalThis);
