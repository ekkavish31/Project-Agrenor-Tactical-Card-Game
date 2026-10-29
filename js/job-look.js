/* v97.23 · J4: the job's look on the hero picture, shared by the battle (js/town-battle.js), the world map and the rooms (js/interior.js).
   pic(img, src, look) → the same picture with the outfit in the job's colour (cached per picture and job)
   aura(g, look, p, size, t, front) → code-drawn aura around the feet point p (draw once behind with front=false, once in front)
   mine() → the current job's look from the save (null for the adventurer) · see docs/TODO.md "อาชีพและอาวุธ" */
(function (root) {
  /* outfit: the cloth pixels (the old green cloak, or the dull dark brown between shoulders and boots of the current outfit) take the job's hue / saturation / lightness — skin and hair stay */
  const jobPics = new Map();
  function pic(img, src, L) {
    if (!L || L.hue == null || !img || !img.complete || !img.naturalWidth) return img;
    const k = src + '|' + L.hue + ',' + L.sat + ',' + L.light; let c = jobPics.get(k); if (c) return c;
    c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
    let d; try { d = x.getImageData(0, 0, c.width, c.height) } catch (e) { jobPics.set(k, img); return img }
    const q = d.data, H2 = L.hue / 360, hue2rgb = (p, q2, t2) => { t2 = (t2 + 1) % 1; return t2 < 1 / 6 ? p + (q2 - p) * 6 * t2 : t2 < .5 ? q2 : t2 < 2 / 3 ? p + (q2 - p) * (2 / 3 - t2) * 6 : p };
    for (let n = 0; n < q.length; n += 4) { if (q[n + 3] < 10) continue; const r = q[n] / 255, gg = q[n + 1] / 255, b = q[n + 2] / 255, mx = Math.max(r, gg, b), mn = Math.min(r, gg, b), l = (mx + mn) / 2, dd = mx - mn; if (dd < .02) continue;
      const s = l > .5 ? dd / (2 - mx - mn) : dd / (mx + mn); let h = mx === r ? ((gg - b) / dd + (gg < b ? 6 : 0)) : mx === gg ? (b - r) / dd + 2 : (r - gg) / dd + 4; h *= 60;
      /* the current outfit is all dull brown: its cloth is the dark, low-saturation brown between the shoulders and the boots (skin is lighter, the head is above) */
      const yy = (n / 4 / c.width | 0) / c.height, cloth = (h >= 42 && h <= 100 && s <= .62 && l >= .05 && l <= .7) || (h <= 40 && s < .5 && l >= .07 && l <= .46 && yy > .37 && yy < .86);
      if (!cloth) continue;
      const s2 = Math.min(1, L.sat * (.75 + s)), l2 = Math.max(.03, Math.min(.92, l * (1.15 + L.light * 1.6) + L.light * .22)), q2 = l2 < .5 ? l2 * (1 + s2) : l2 + s2 - l2 * s2, p2 = 2 * l2 - q2;
      q[n] = hue2rgb(p2, q2, H2 + 1 / 3) * 255; q[n + 1] = hue2rgb(p2, q2, H2) * 255; q[n + 2] = hue2rgb(p2, q2, H2 - 1 / 3) * 255 }
    x.putImageData(d, 0, 0); jobPics.set(k, c); return c;
  }
  function aura(g, L, p, size, t, front) {
    if (!L?.aura) return; const T = t / 1000, cx = p.x, cy = p.y - size * .32;
    g.save(); g.globalCompositeOperation = L.aura === 'shadow' ? 'source-over' : 'lighter';
    const dot = (x, y, r, col, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill() };
    for (let k = 0; k < 6; k++) { const ph = (T * .5 + k / 6) % 1, ang = k / 6 * 6.283 + T * (L.aura === 'spark' ? 1.4 : .6), inFront = Math.sin(ang) > 0; if (inFront !== front) continue;
      const ox = Math.cos(ang) * size * .26, oy = Math.sin(ang) * size * .08;
      if (L.aura === 'ember') dot(cx + ox * .8, p.y - ph * size * .7, 4.5 * (1 - ph) + 1, '255,140,60', .75 * (1 - ph));
      else if (L.aura === 'leaf') { g.fillStyle = `rgba(120,200,90,${.65 * (1 - ph)})`; g.save(); g.translate(cx + ox, cy + oy - ph * size * .2); g.rotate(ang * 2); g.beginPath(); g.ellipse(0, 0, 4, 1.8, 0, 0, 7); g.fill(); g.restore() }
      else if (L.aura === 'spark') { dot(cx + ox, cy + oy - Math.sin(T * 2 + k) * 6, 5, '190,150,255', .8); }
      else if (L.aura === 'halo' && k === 0 && !front) { dot(cx, p.y - size * .78, size * .2, '255,230,150', .32 + .1 * Math.sin(T * 2)); g.strokeStyle = `rgba(255,236,170,${.55 + .2 * Math.sin(T * 3)})`; g.lineWidth = 2; g.beginPath(); g.ellipse(cx, p.y - size * .86, size * .12, size * .035, 0, 0, 7); g.stroke() }
      else if (L.aura === 'shadow') { g.fillStyle = `rgba(20,16,40,${.35 * (1 - ph)})`; g.beginPath(); g.ellipse(cx + ox, p.y - ph * size * .35, 6 + ph * 6, 3 + ph * 3, 0, 0, 7); g.fill() }
      else if (L.aura === 'shield' && k < 3 && front) { g.strokeStyle = `rgba(150,200,255,${.28 + .18 * Math.sin(T * 2.4 + k)})`; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, size * (.3 + k * .03), -2.4, -.7); g.stroke() } }
    g.restore();
  }
  function mine() {
    try { const P = root.Progression, g = root.WorldState?.game(); if (!P || !g) return null; const j = P.jobCombat(g); return j.look ? { ...j.look, icon: j.icon, col: j.col } : null } catch (e) { return null } }
  root.JobLook = { pic, aura, mine };
})(typeof window !== 'undefined' ? window : globalThis);
