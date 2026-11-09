/* v98.305 · CODE-DRAWN battle ground art — same calls as js/ground-art.js (the picture sets) plus the turn crystal, drawn smoothly from time t (no frame stepping, no sheets):
     GroundArtCode.crystal(g, cx, cy, ph, t, kind)   hovering HEXAGONAL crystal (pointed top and bottom, six facets) that turns slowly · kind 'ally' (gold) | 'foe' (silver) | 'view' (grey) · ph = its height in px
     GroundArtCode.ring(g, foe, x, y, w, t, style)   ring under a fighter: gold bezel + neon line + studs · green = team, red = foe
     GroundArtCode.frame(g, name, x, y, w, h, t)     the rhombus frame of a cell: gold bezel + neon line + corner studs · green red yellow blue grey orange
     GroundArtCode.corners(g, x, y, w, h, t)         glowing corner chevrons that breathe in and out
   style 1 = a light running round the line · style 2 = orbiting beads.  Preview + choose: fx-code-preview.html. */
(function (root) {
  'use strict';
  const COL = { green: [70, 224, 120], red: [240, 76, 70], yellow: [255, 214, 70], blue: [74, 170, 255], grey: [186, 190, 196], orange: [255, 136, 50] };
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`, mix = (c, k) => c.map(v => Math.round(v + (255 - v) * k)), dark = (c, k) => c.map(v => Math.round(v * (1 - k)));
  const KIND = { ally: { base: [238, 176, 50], glow: [255, 208, 100] }, foe: { base: [150, 172, 214], glow: [190, 214, 255] }, view: { base: [140, 148, 158], glow: [215, 220, 228] } };
  const GOLD = ['#fff6c4', '#f0c24e', '#b9801f', '#6d4310'];
  const goldGrad = (g, x0, y0, x1, y1) => { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, GOLD[0]); gr.addColorStop(.35, GOLD[1]); gr.addColorStop(.7, GOLD[2]); gr.addColorStop(1, GOLD[3]); return gr };
  const bloom = (g, x, y, r, c, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgba(c, a)); gr.addColorStop(.45, rgba(c, a * .35)); gr.addColorStop(1, rgba(c, 0)); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill() };
  function stud(g, x, y, s, t, ph) {                                              /* a small gold diamond stud with a glint */
    g.save(); g.translate(x, y); g.beginPath(); g.moveTo(0, -s); g.lineTo(s * .72, 0); g.lineTo(0, s); g.lineTo(-s * .72, 0); g.closePath();
    g.fillStyle = goldGrad(g, -s, -s, s, s); g.fill(); g.strokeStyle = 'rgba(70,40,8,.9)'; g.lineWidth = Math.max(.8, s * .16); g.stroke();
    g.beginPath(); g.moveTo(0, -s * .8); g.lineTo(s * .42, 0); g.lineTo(0, -s * .1); g.lineTo(-s * .42, 0); g.closePath(); g.fillStyle = 'rgba(255,250,215,.55)'; g.fill();
    const gl = Math.max(0, Math.sin(t * .004 + ph)); if (gl > .3) { g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,255,255,${gl * .8})`; g.lineWidth = 1; g.beginPath(); g.moveTo(-s * 1.5, 0); g.lineTo(s * 1.5, 0); g.moveTo(0, -s * 1.5); g.lineTo(0, s * 1.5); g.stroke() }
    g.restore();
  }

  function crystal(g, cx, cy, ph, t, kind = 'ally') {
    const K = KIND[kind] || KIND.ally, r = ph * .175, a0 = t * .0013, tilt = .22, N = 6, yTop = cy - ph * .5, yS1 = cy - ph * .2, yS2 = cy + ph * .16, yBot = cy + ph * .5;
    const ring = yy => Array.from({ length: N }, (_, k) => { const a = a0 + k * Math.PI * 2 / N; return { x: cx + Math.cos(a) * r, y: yy + Math.sin(a) * r * tilt, z: Math.sin(a), a } });
    const R1 = ring(yS1), R2 = ring(yS2);
    g.save();
    /* big soft bloom behind + a thin ground-less halo */
    g.globalCompositeOperation = 'lighter'; bloom(g, cx, cy, ph * .95, K.glow, .5 + .1 * Math.sin(t * .004)); bloom(g, cx, cy, ph * .4, mix(K.glow, .5), .5); g.globalCompositeOperation = 'source-over';
    const faces = [];
    for (let k = 0; k < N; k++) {
      const A = R1[k], B = R1[(k + 1) % N], C = R2[(k + 1) % N], D = R2[k], z = (A.z + B.z) / 2, na = (A.a + B.a) / 2;
      faces.push({ pts: [[cx, yTop], [A.x, A.y], [B.x, B.y]], z, na, part: 'top' }, { pts: [[A.x, A.y], [B.x, B.y], [C.x, C.y], [D.x, D.y]], z, na, part: 'body' }, { pts: [[D.x, D.y], [C.x, C.y], [cx, yBot]], z, na, part: 'bot' });
    }
    faces.sort((p, q) => p.z - q.z);
    for (const f of faces) {
      const back = f.z < 0, lit = .5 + .5 * Math.cos(f.na - 2.5), p = f.pts, ys = p.map(q => q[1]), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const hiC = mix(K.base, f.part === 'top' ? .55 * lit + .15 : .3 * lit), loC = dark(K.base, (f.part === 'bot' ? .5 : .32) - .12 * lit);
      const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, rgba(hiC, 1)); gr.addColorStop(.55, rgba(mix(K.base, .1 * lit), 1)); gr.addColorStop(1, rgba(loC, 1));
      g.globalAlpha = back ? .5 : 1; g.fillStyle = gr; g.beginPath(); g.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1]); g.closePath(); g.fill();
      if (!back) {                                                                  /* glassy streak + crisp edges */
        const xs = p.map(q => q[0]), xa = Math.min(...xs), xb = Math.max(...xs); g.save(); g.beginPath(); g.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1]); g.closePath(); g.clip();
        const sh = g.createLinearGradient(xa, y0, xb, y1); sh.addColorStop(0, `rgba(255,255,255,${.1 + .38 * lit})`); sh.addColorStop(.5, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,.18)'); g.globalCompositeOperation = 'lighter'; g.fillStyle = sh; g.fillRect(xa - 2, y0 - 2, xb - xa + 4, y1 - y0 + 4); g.restore();
        g.strokeStyle = rgba(mix(K.base, .75), .3 + .5 * lit); g.lineWidth = Math.max(.7, ph * .012); g.stroke();
      } else { g.strokeStyle = rgba(dark(K.base, .4), .5); g.lineWidth = .8; g.stroke() }
      g.globalAlpha = 1;
    }
    /* inner light (the crystal glows from inside) */
    g.globalCompositeOperation = 'lighter'; bloom(g, cx, cy - ph * .02, ph * .22, [255, 240, 200], .4 + .12 * Math.sin(t * .005));
    /* the bright rim along the lit edge of the cap + twinkles */
    const hi = R1.reduce((p, q) => q.z > p.z ? q : p, R1[0]); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = Math.max(1, ph * .016); g.beginPath(); g.moveTo(cx, yTop + ph * .02); g.lineTo(hi.x, hi.y); g.lineTo(R2[R1.indexOf(hi)].x, R2[R1.indexOf(hi)].y); g.stroke();
    for (let k = 0; k < 3; k++) { const tw = Math.max(0, Math.sin(t * .0055 + k * 2.1)); if (tw < .5) continue; const sx = cx + Math.cos(k * 2.4 + 1) * r * 1.1, sy = cy + Math.sin(k * 1.9) * ph * .32, s = ph * .07 * tw; g.strokeStyle = `rgba(255,255,255,${tw})`; g.lineWidth = 1.3; g.beginPath(); g.moveTo(sx - s, sy); g.lineTo(sx + s, sy); g.moveTo(sx, sy - s * 1.3); g.lineTo(sx, sy + s * 1.3); g.stroke() }
    g.restore();
  }

  function ring(g, foe, x, y, w, t, style = 1) {
    const c = foe ? COL.red : COL.green, p = .5 + .5 * Math.sin(t * .004), rx = w * .5, ry = rx * .56;
    g.save(); g.translate(x, y);
    /* ground: dark rim + coloured light pooled on the grass */
    let gr = g.createRadialGradient(0, 0, ry * .2, 0, 0, rx * 1.05); gr.addColorStop(0, rgba(c, .05)); gr.addColorStop(.75, rgba(c, .16 + .06 * p)); gr.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = gr; g.beginPath(); g.ellipse(0, 0, rx * 1.05, ry * 1.05, 0, 0, 7); g.fill();
    g.globalCompositeOperation = 'lighter'; for (const [k, a] of [[.16, .14], [.09, .22], [.045, .4]]) { g.strokeStyle = rgba(c, a + .08 * p); g.lineWidth = w * k; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, 7); g.stroke() }
    g.globalCompositeOperation = 'source-over';
    /* gold bezel: dark under-line, bright gold, then the neon line inside */
    g.strokeStyle = 'rgba(40,24,6,.85)'; g.lineWidth = w * .038; g.beginPath(); g.ellipse(0, w * .006, rx, ry, 0, 0, 7); g.stroke();
    g.strokeStyle = goldGrad(g, -rx, -ry, rx, ry); g.lineWidth = w * .018; g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, 7); g.stroke();
    g.strokeStyle = rgba(mix(c, .25), 1); g.lineWidth = w * .02; g.beginPath(); g.ellipse(0, 0, rx * .925, ry * .925, 0, 0, 7); g.stroke();
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = rgba(c, .9); g.lineWidth = w * .03; g.beginPath(); g.ellipse(0, 0, rx * .93, ry * .93, 0, 0, 7); g.stroke(); g.globalCompositeOperation = 'source-over';
    if (style === 2) { g.globalCompositeOperation = 'lighter'; for (let k = 0; k < 4; k++) { const a = t * .0022 + k * Math.PI / 2, bx = Math.cos(a) * rx * .93, by = Math.sin(a) * ry * .93, s = w * .03; bloom(g, bx, by, s * 2.8, mix(c, .5), .95); g.fillStyle = '#fff'; g.beginPath(); g.arc(bx, by, s * .55, 0, 7); g.fill() } g.globalCompositeOperation = 'source-over' }
    else { g.globalCompositeOperation = 'lighter'; const a = t * .0026; for (let k = 0; k < 22; k++) { const aa = a - k * .075, al = (1 - k / 22); g.fillStyle = `rgba(255,255,255,${al * .9})`; g.beginPath(); g.arc(Math.cos(aa) * rx * .93, Math.sin(aa) * ry * .93, w * .017 * (1 - k / 30), 0, 7); g.fill() } bloom(g, Math.cos(a) * rx * .93, Math.sin(a) * ry * .93, w * .06, mix(c, .5), .8); g.globalCompositeOperation = 'source-over' }
    for (const [sx, sy, ph] of [[-rx, 0, 0], [rx, 0, 1.6], [0, -ry, 3.1], [0, ry, 4.7]]) stud(g, sx, sy, w * .036, t, ph);
    g.restore();
  }

  function frame(g, name, x, y, w, h, t = 0) {
    const c = COL[name]; if (!c) return false; const p = .5 + .5 * Math.sin(t * .0045 + (COL[name][0] % 7)), ix = w * .475, iy = h * .475;
    const path = k => { g.beginPath(); g.moveTo(x, y - iy * k); g.lineTo(x + ix * k, y); g.lineTo(x, y + iy * k); g.lineTo(x - ix * k, y); g.closePath() };
    g.save(); g.lineJoin = 'round';
    const gr = g.createRadialGradient(x, y, h * .05, x, y, w * .5); gr.addColorStop(0, rgba(c, .1)); gr.addColorStop(.7, rgba(c, .24 + .06 * p)); gr.addColorStop(1, rgba(c, .42 + .08 * p)); path(1); g.fillStyle = gr; g.fill();
    g.globalCompositeOperation = 'lighter'; for (const [k, a] of [[.1, .12], [.055, .22]]) { g.strokeStyle = rgba(c, a + .08 * p); g.lineWidth = Math.max(3, w * k); path(1); g.stroke() }
    g.globalCompositeOperation = 'source-over';
    g.strokeStyle = 'rgba(40,24,6,.8)'; g.lineWidth = Math.max(3, w * .036); path(1.012); g.stroke();
    g.strokeStyle = goldGrad(g, x - ix, y - iy, x + ix, y + iy); g.lineWidth = Math.max(1.6, w * .017); path(1); g.stroke();
    g.strokeStyle = rgba(mix(c, .2), 1); g.lineWidth = Math.max(1.6, w * .026); path(.9); g.stroke();
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = rgba(c, .85); g.lineWidth = Math.max(3, w * .04); path(.9); g.stroke(); g.globalCompositeOperation = 'source-over';
    for (const [sx, sy] of [[0, -iy], [ix, 0], [0, iy], [-ix, 0]]) stud(g, x + sx, y + sy, Math.max(3, w * .045), t, sx + sy);
    g.restore(); return true;
  }

  function corners(g, x, y, w, h, t = 0) {
    const e = .5 + .5 * Math.sin(t * .006), ix = w * .5 + w * .02 * e, iy = h * .5 + h * .02 * e, L = w * .15, pts = [[x, y - iy], [x + ix, y], [x, y + iy], [x - ix, y]];
    g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.globalCompositeOperation = 'lighter';
    const dirs = [[[-1, .5], [1, .5]], [[-1, -.5], [-1, .5]], [[-1, -.5], [1, -.5]], [[1, -.5], [1, .5]]];
    pts.forEach(([px, py], i) => { const [a, b] = dirs[i]; for (const [wd, al] of [[Math.max(5, w * .07), .14], [Math.max(3, w * .04), .3], [Math.max(1.4, w * .016), 1]]) { g.strokeStyle = `rgba(255,236,160,${al * (.7 + .3 * e)})`; g.lineWidth = wd; g.beginPath(); g.moveTo(px + a[0] * L * .7, py + a[1] * L * .35); g.lineTo(px, py); g.lineTo(px + b[0] * L * .7, py + b[1] * L * .35); g.stroke() } });
    g.restore();
  }
  root.GroundArtCode = { crystal, ring, frame, corners, COL: Object.keys(COL) };
})(typeof window !== 'undefined' ? window : globalThis);
