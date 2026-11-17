/* v98.397 Status FX — what a status looks like ON the fighter (the icons above the head stay as they are).
   Everything is drawn in code on the battle clock, in puffs that come and go ("เป็นระยะ"), never a constant wall of particles:
     burn    flames licking up the body, then a puff of smoke and embers
     poison  green bubbles rise along the body and pop, a small puddle at the feet
     sleep   Z z z drifting up from the head
     freeze  ice shards round the feet, cold mist, a few snowflakes
     shock   short lightning arcs jumping across the body
     weak    dull purple drops falling, a sagging ring
     silence a crossed-out speech mark by the head
     bind    vines wound round the legs
   A status that has just been applied also gets one burst ring.
   town-battle.js calls StatusFX.back(...) before the unit is drawn and StatusFX.front(...) after it. */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2, clamp = v => Math.max(0, Math.min(1, v));
  const H = (a, b) => { let h = Math.imul((a | 0) * 2654435761 ^ (b | 0) * 40503, 2246822519) >>> 0; h = (h ^ h >>> 15) >>> 0; return (h % 10000) / 10000 };
  const COL = { burn: '255,140,50', poison: '120,220,90', sleep: '190,170,255', freeze: '150,220,255', shock: '255,235,110', weak: '170,120,210', silence: '200,200,210', bind: '110,170,70' };
  const seen = new WeakMap();   /* unit → { keys:Set, born:{kind:t} } so a new status gets its burst */
  function keys(u) { const k = Object.keys(u.sts || {}); if (u.stun) k.push('freeze'); if (u.slowed) k.push('shock'); return k }
  function track(u, t) { let s = seen.get(u); if (!s) seen.set(u, s = { keys: new Set(), born: {} }); const k = keys(u); for (const x of k) if (!s.keys.has(x)) s.born[x] = t; s.keys = new Set(k); return { k, born: s.born } }
  const seedOf = u => { const id = String(u.id || u.kind || ''); let n = 7; for (let i = 0; i < id.length; i++) n = n * 31 + id.charCodeAt(i) | 0; return Math.abs(n) % 9973 };
  /* a puff: n particles, each with its own life inside a cycle of `period` ms; fn(k 0..1, i, cycleNo) draws one */
  function puffs(t, seed, n, period, fn) { for (let i = 0; i < n; i++) { const ph = t / period + H(seed, i) * 1, c = Math.floor(ph), k = ph - c; fn(k, i, c) } }
  /* periodic envelope: quiet most of the time, a swell of `on` (0..1 of the cycle) every `period` ms */
  const swell = (t, period, on, off = 0) => { const k = (((t + off) % period) + period) % period / period; return k < on ? Math.sin(k / on * Math.PI) : 0 };

  function flame(g, x, y, w, h, flick) {
    g.beginPath(); g.moveTo(x - w / 2, y); g.bezierCurveTo(x - w * .7, y - h * .45, x - w * .15 + flick, y - h * .6, x + flick * 1.6, y - h);
    g.bezierCurveTo(x + w * .2 + flick, y - h * .55, x + w * .75, y - h * .4, x + w / 2, y); g.closePath(); g.fill();
  }
  const FX = {
    burn: {
      back(g, x, y, h, t) { const a = .22 + .1 * Math.sin(t * .012); const gr = g.createRadialGradient(x, y, 0, x, y, h * .55); gr.addColorStop(0, `rgba(255,150,50,${a})`); gr.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, h * .55, h * .24, 0, 0, TAU); g.fill() },
      front(g, x, y, h, t, s) {
        const sw = .55 + .45 * swell(t, 2600, .7, s * 13);   /* flames flare up, die down, flare again */
        g.save(); g.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 5; i++) { const fx = x + (H(s, i) - .5) * h * .5, fy = y - H(s, i + 9) * h * .5, fh = h * (.2 + .16 * H(s, i + 20)) * sw * (.8 + .2 * Math.sin(t * .02 + i * 2)), fl = Math.sin(t * .017 + i * 1.7) * h * .03;
          g.fillStyle = 'rgba(255,90,20,.5)'; flame(g, fx, fy, h * .13, fh, fl); g.fillStyle = 'rgba(255,190,60,.7)'; flame(g, fx, fy, h * .08, fh * .68, fl); g.fillStyle = 'rgba(255,245,190,.75)'; flame(g, fx, fy, h * .04, fh * .36, fl) }
        puffs(t, s + 3, 7, 1100, (k, i, c) => { const ex = x + (H(s + c, i) - .5) * h * .55 + Math.sin(k * 6 + i) * h * .04, ey = y - h * (.15 + .95 * k), a = (1 - k) * .9, r = h * .016 * (1 - k * .5); g.fillStyle = `rgba(255,${190 - k * 90 | 0},70,${a})`; g.beginPath(); g.arc(ex, ey, r, 0, TAU); g.fill() });
        g.restore();
        /* smoke: a grey puff rolls off the top every so often */
        puffs(t, s + 5, 4, 2400, (k, i, c) => { if (H(s + c, i + 40) < .35) return; const sx = x + (H(s + c, i + 7) - .5) * h * .3 + k * h * .12 * (H(s, i) - .4), sy = y - h * (.75 + .6 * k), r = h * (.06 + .12 * k), a = Math.sin(Math.min(1, k * 1.15) * Math.PI) * .34;
          const gr = g.createRadialGradient(sx, sy, 0, sx, sy, r); gr.addColorStop(0, `rgba(70,62,58,${a})`); gr.addColorStop(1, 'rgba(70,62,58,0)'); g.fillStyle = gr; g.beginPath(); g.arc(sx, sy, r, 0, TAU); g.fill() });
      }
    },
    poison: {
      back(g, x, y, h, t) { g.fillStyle = 'rgba(70,150,50,.38)'; g.beginPath(); g.ellipse(x, y + h * .01, h * .34 + Math.sin(t * .003) * h * .012, h * .12, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(150,230,90,.3)'; g.beginPath(); g.ellipse(x - h * .06, y, h * .16, h * .05, 0, 0, TAU); g.fill() },
      front(g, x, y, h, t, s) {
        /* bubbles leave the puddle in groups, wobble up along the body and pop near the head */
        puffs(t, s, 9, 2300, (k, i, c) => { const gate = swell(t - k * 2300, 3400, .62, s * 7 + i * 60); if (gate <= .05 && k < .9) return;
          const bx = x + (H(s + c, i) - .5) * h * .58 + Math.sin(k * 7 + i * 2.1) * h * .035, by = y - h * (.02 + 1.02 * k), r = h * (.022 + .034 * H(s + c, i + 11)) * (.6 + .4 * Math.min(1, k * 4));
          if (k > .88) { const p = (k - .88) / .12; g.strokeStyle = `rgba(190,255,150,${1 - p})`; g.lineWidth = Math.max(1, h * .008); for (let j = 0; j < 5; j++) { const a = j / 5 * TAU + i; g.beginPath(); g.moveTo(bx + Math.cos(a) * r * (1 + p), by + Math.sin(a) * r * (1 + p)); g.lineTo(bx + Math.cos(a) * r * (1.5 + p * 1.6), by + Math.sin(a) * r * (1.5 + p * 1.6)); g.stroke() } return }
          const a = Math.min(1, k * 5) * .85; g.fillStyle = `rgba(110,200,70,${a * .45})`; g.strokeStyle = `rgba(190,255,140,${a})`; g.lineWidth = Math.max(1, h * .009); g.beginPath(); g.arc(bx, by, r, 0, TAU); g.fill(); g.stroke();
          g.fillStyle = `rgba(240,255,220,${a * .9})`; g.beginPath(); g.arc(bx - r * .35, by - r * .35, r * .24, 0, TAU); g.fill() });
        const m = swell(t, 3400, .5, s * 7); if (m > 0) { const gr = g.createRadialGradient(x, y - h * .5, 0, x, y - h * .5, h * .55); gr.addColorStop(0, `rgba(120,210,80,${.16 * m})`); gr.addColorStop(1, 'rgba(120,210,80,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y - h * .5, h * .55, 0, TAU); g.fill() }
      }
    },
    sleep: {
      front(g, x, y, h, t, s) { g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
        puffs(t, s, 3, 2700, (k, i) => { const zx = x + h * (.2 + .22 * k) + Math.sin(k * 5 + i) * h * .03, zy = y - h * (1.0 + .5 * k), sz = h * (.11 + .13 * k), a = Math.sin(Math.min(1, k * 1.1) * Math.PI);
          g.globalAlpha = a; g.font = `900 ${sz.toFixed(1)}px system-ui,sans-serif`; g.lineWidth = Math.max(2, sz * .22); g.strokeStyle = '#2a1e55'; g.fillStyle = '#d9ccff'; g.save(); g.translate(zx, zy); g.rotate(-.18 + k * .3); g.strokeText('Z', 0, 0); g.fillText('Z', 0, 0); g.restore() });
        g.restore() }
    },
    freeze: {
      back(g, x, y, h) { g.fillStyle = 'rgba(150,215,255,.34)'; g.beginPath(); g.ellipse(x, y, h * .4, h * .16, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(225,245,255,.7)'; g.lineWidth = Math.max(1, h * .01); g.stroke() },
      front(g, x, y, h, t, s) {
        for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + s, bx = x + Math.cos(a) * h * .3, by = y + Math.sin(a) * h * .11, sh = h * (.14 + .14 * H(s, i)), w = h * .045, lean = Math.cos(a) * h * .05; if (Math.sin(a) < -.2) continue;
          const gr = g.createLinearGradient(bx, by, bx, by - sh); gr.addColorStop(0, 'rgba(120,190,240,.85)'); gr.addColorStop(1, 'rgba(235,250,255,.95)'); g.fillStyle = gr; g.beginPath(); g.moveTo(bx - w, by); g.lineTo(bx + lean, by - sh); g.lineTo(bx + w, by); g.closePath(); g.fill();
          g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(bx + lean, by - sh); g.lineTo(bx - w * .2, by); g.stroke() }
        const tw = .5 + .5 * Math.sin(t * .006 + s); g.fillStyle = `rgba(255,255,255,${.5 + .5 * tw})`; g.beginPath(); g.arc(x + h * .22, y - h * .16, h * .012 * (1 + tw), 0, TAU); g.fill();
        g.strokeStyle = 'rgba(235,248,255,.9)'; g.lineWidth = Math.max(1, h * .008);
        puffs(t, s + 2, 5, 3000, (k, i, c) => { const fx = x + (H(s + c, i) - .5) * h * .7 + Math.sin(k * 5 + i) * h * .05, fy = y - h * (1.15 - 1.05 * k), r = h * .028, a = Math.sin(k * Math.PI); g.globalAlpha = a; for (let j = 0; j < 3; j++) { const an = j / 3 * Math.PI + k * 2; g.beginPath(); g.moveTo(fx - Math.cos(an) * r, fy - Math.sin(an) * r); g.lineTo(fx + Math.cos(an) * r, fy + Math.sin(an) * r); g.stroke() } g.globalAlpha = 1 });
      }
    },
    shock: {
      front(g, x, y, h, t, s) { g.save(); g.globalCompositeOperation = 'lighter'; g.lineJoin = 'round';
        for (let b = 0; b < 2; b++) { const period = 900 + b * 430, c = Math.floor((t + b * 300 + s * 31) / period), k = ((t + b * 300 + s * 31) % period) / period; if (k > .28) continue;   /* a crackle, then nothing for a moment */
          const x0 = x + (H(s + c, b) - .5) * h * .5, y0 = y - h * (.2 + .7 * H(s + c, b + 5)), an = H(s + c, b + 9) * TAU, len = h * (.22 + .2 * H(s + c, b + 3)); g.beginPath(); g.moveTo(x0, y0); let px = x0, py = y0;
          for (let j = 1; j <= 5; j++) { px = x0 + Math.cos(an) * len * j / 5 + (H(s + c + j, b + Math.floor(t / 45)) - .5) * h * .09; py = y0 + Math.sin(an) * len * j / 5 + (H(s + c + j, b + 77 + Math.floor(t / 45)) - .5) * h * .09; g.lineTo(px, py) }
          const a = 1 - k / .28; g.strokeStyle = `rgba(255,220,80,${.55 * a})`; g.lineWidth = h * .035; g.stroke(); g.strokeStyle = `rgba(255,255,230,${a})`; g.lineWidth = Math.max(1, h * .012); g.stroke();
          g.fillStyle = `rgba(255,250,200,${a})`; g.beginPath(); g.arc(px, py, h * .02, 0, TAU); g.fill() }
        g.restore() }
    },
    weak: {
      back(g, x, y, h, t) { g.strokeStyle = `rgba(150,100,200,${.35 + .15 * Math.sin(t * .004)})`; g.lineWidth = Math.max(1.5, h * .014); g.setLineDash([h * .05, h * .04]); g.beginPath(); g.ellipse(x, y, h * .36, h * .14, 0, 0, TAU); g.stroke(); g.setLineDash([]) },
      front(g, x, y, h, t, s) { puffs(t, s, 5, 1900, (k, i, c) => { const gate = swell(t - k * 1900, 3000, .6, s * 5); if (gate <= .05) return; const dx = x + (H(s + c, i) - .5) * h * .56, dy = y - h * (1.05 - .75 * k), a = Math.sin(k * Math.PI) * .8, w = h * .028;
          g.fillStyle = `rgba(150,105,205,${a})`; g.beginPath(); g.moveTo(dx - w, dy - w * 1.3); g.lineTo(dx + w, dy - w * 1.3); g.lineTo(dx, dy + w * 1.1); g.closePath(); g.fill(); g.fillRect(dx - w * .35, dy - w * 3.4, w * .7, w * 2.2) }) }
    },
    silence: {
      front(g, x, y, h, t) { const bx = x + h * .3, by = y - h * 1.0 + Math.sin(t * .004) * h * .015, r = h * .1; g.save(); g.globalAlpha = .7 + .25 * Math.sin(t * .005);
        g.fillStyle = 'rgba(245,245,250,.92)'; g.strokeStyle = '#3a3a48'; g.lineWidth = Math.max(1.5, h * .014); g.beginPath(); g.ellipse(bx, by, r * 1.15, r * .85, 0, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.moveTo(bx - r * .6, by + r * .65); g.lineTo(bx - r * 1.0, by + r * 1.25); g.lineTo(bx - r * .15, by + r * .8); g.fill();
        g.fillStyle = '#3a3a48'; for (let i = -1; i <= 1; i++) { g.beginPath(); g.arc(bx + i * r * .45, by, r * .12, 0, TAU); g.fill() }
        g.strokeStyle = '#d8323a'; g.lineWidth = Math.max(2, h * .024); g.lineCap = 'round'; g.beginPath(); g.moveTo(bx - r * .95, by - r * .7); g.lineTo(bx + r * .95, by + r * .7); g.stroke(); g.restore() }
    },
    bind: {
      back(g, x, y, h, t) { vine(g, x, y, h, t, true) },
      front(g, x, y, h, t) { vine(g, x, y, h, t, false) }
    }
  };
  function vine(g, x, y, h, t, back) { g.save(); g.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const cy = y - h * (.1 + .16 * i), rx = h * (.24 - .02 * i) * (1 + .03 * Math.sin(t * .004 + i)), ry = h * .07, tilt = (i % 2 ? .22 : -.22);
      g.strokeStyle = '#2f5a22'; g.lineWidth = h * .05; g.beginPath(); g.ellipse(x, cy, rx, ry, tilt, back ? Math.PI : 0, back ? TAU : Math.PI); g.stroke();
      g.strokeStyle = '#6fae48'; g.lineWidth = h * .026; g.beginPath(); g.ellipse(x, cy, rx, ry, tilt, back ? Math.PI : 0, back ? TAU : Math.PI); g.stroke();
      if (!back) { const lx = x + rx * Math.cos(.6 + i) , ly = cy + ry * Math.sin(.6 + i) + rx * Math.sin(tilt) * Math.cos(.6 + i); g.fillStyle = '#86c85a'; g.beginPath(); g.ellipse(lx, ly - h * .02, h * .04, h * .018, -.7 + i, 0, TAU); g.fill() } }
    g.restore() }
  /* one ring when a status lands */
  function burst(g, kind, x, y, h, e) { if (e < 0 || e > 620) return; const k = e / 620, c = COL[kind] || '255,255,255'; g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(${c},${1 - k})`; g.lineWidth = h * .05 * (1 - k) + 1; g.beginPath(); g.ellipse(x, y - h * .45, h * (.15 + .5 * k), h * (.2 + .6 * k), 0, 0, TAU); g.stroke();
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, d = h * (.2 + .6 * k); g.fillStyle = `rgba(${c},${1 - k})`; g.beginPath(); g.arc(x + Math.cos(a) * d, y - h * .45 + Math.sin(a) * d * .9, h * .022 * (1 - k * .6), 0, TAU); g.fill() } g.restore() }
  function run(layer, g, u, x, y, h, t) { if (!u || u.hp <= 0) return; const { k, born } = track(u, t); if (!k.length) return; const s = seedOf(u);
    for (const kind of k) { const f = FX[kind]; if (!f) continue; g.save(); try { f[layer]?.(g, x, y, h, t, s); if (layer === 'front' && born[kind] != null) burst(g, kind, x, y, h, t - born[kind]) } finally { g.restore() } } }
  root.StatusFX = { back: (g, u, x, y, h, t) => run('back', g, u, x, y, h, t), front: (g, u, x, y, h, t) => run('front', g, u, x, y, h, t), kinds: Object.keys(FX), draw(g, kind, x, y, h, t, seed = 1) { const f = FX[kind]; if (!f) return; g.save(); f.back?.(g, x, y, h, t, seed); g.restore(); g.save(); f.front?.(g, x, y, h, t, seed); g.restore() } };
})(globalThis);
