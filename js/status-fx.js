/* v98.397 Status FX — what a status looks like ON the fighter (the icons above the head stay as they are).
   v98.407 · redrawn in the VFX Kit look (js/vfx-kit.js): layered additive light, soft glows, sparkles. Same calls, same rhythm.
   Everything is drawn in code on the battle clock, in puffs that come and go ("เป็นระยะ"), never a constant wall of particles:
     burn    three layers of flame licking up the body, embers, then a puff of smoke
     poison  glowing green bubbles rise along the body and pop, a bubbling puddle at the feet
     sleep   Z z z drifting up from the head in a soft violet haze, a few slow stars
     freeze  ice crystals round the feet, cold light, glittering frost
     shock   bolts with a halo jumping across the body, sparks
     weak    a dull violet haze sinking down, falling arrows, a fading ring
     silence a crossed-out speech mark by the head, with muffled ripples
     bind    vines wound round the legs, small leaves and thorns, a green glint
   A status that has just been applied also gets one burst ring.
   town-battle.js calls StatusFX.back(...) before the unit is drawn and StatusFX.front(...) after it. */
(function (root) {
  'use strict';
  const TAU = Math.PI * 2, clamp = v => Math.max(0, Math.min(1, v));
  const H = (a, b) => { let h = Math.imul((a | 0) * 2654435761 ^ (b | 0) * 40503, 2246822519) >>> 0; h = (h ^ h >>> 15) >>> 0; return (h % 10000) / 10000 };
  const COL = { burn: '255,140,50', poison: '120,230,90', sleep: '190,170,255', freeze: '150,220,255', shock: '255,235,110', weak: '170,120,220', silence: '210,210,225', bind: '120,200,80' };
  const seen = new WeakMap();   /* unit → { keys:Set, born:{kind:t} } so a new status gets its burst */
  function keys(u) { const k = Object.keys(u.sts || {}); if (u.stun) k.push('freeze'); if (u.slowed) k.push('shock'); return k }
  function track(u, t) { let s = seen.get(u); if (!s) seen.set(u, s = { keys: new Set(), born: {} }); const k = keys(u); for (const x of k) if (!s.keys.has(x)) s.born[x] = t; s.keys = new Set(k); return { k, born: s.born } }
  const seedOf = u => { const id = String(u.id || u.kind || ''); let n = 7; for (let i = 0; i < id.length; i++) n = n * 31 + id.charCodeAt(i) | 0; return Math.abs(n) % 9973 };
  /* a puff: n particles, each with its own life inside a cycle of `period` ms; fn(k 0..1, i, cycleNo) draws one */
  function puffs(t, seed, n, period, fn) { for (let i = 0; i < n; i++) { const ph = t / period + H(seed, i), c = Math.floor(ph), k = ph - c; fn(k, i, c) } }
  /* periodic envelope: quiet most of the time, a swell of `on` (0..1 of the cycle) every `period` ms */
  const swell = (t, period, on, off = 0) => { const k = (((t + off) % period) + period) % period / period; return k < on ? Math.sin(k / on * Math.PI) : 0 };
  const add = (g, f) => { g.save(); g.globalCompositeOperation = 'lighter'; try { f() } finally { g.restore() } };
  function glow(g, x, y, r, c, a) { if (r <= 0 || a <= 0) return; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(.4, `rgba(${c},${a * .42})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill() }
  function ground(g, x, y, rx, ry, c, a) { if (a <= 0) return; g.save(); g.translate(x, y); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore() }
  function star4(g, x, y, r, c, a, rot = 0) { if (a <= 0 || r <= 0) return; g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = `rgba(${c},${a})`; g.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * .16 : r, an = i / 8 * TAU; g.lineTo(Math.cos(an) * rr, Math.sin(an) * rr) } g.closePath(); g.fill(); g.restore() }
  function flame(g, x, y, w, h, lean, c, a) { if (a <= 0 || h <= 0) return; g.fillStyle = `rgba(${c},${a})`; g.beginPath(); g.moveTo(x - w / 2, y); g.bezierCurveTo(x - w * .75, y - h * .45, x - w * .15 + lean, y - h * .6, x + lean * 1.6, y - h); g.bezierCurveTo(x + w * .2 + lean, y - h * .55, x + w * .78, y - h * .4, x + w / 2, y); g.closePath(); g.fill() }
  function zap(g, s, c0, x0, y0, x1, y1, jit, w, c, al, tick) { if (al <= 0) return; const pts = [[x0, y0]], n = 5; for (let i = 1; i < n; i++) { const k = i / n; pts.push([x0 + (x1 - x0) * k + (H(s + c0 + i, tick) - .5) * jit, y0 + (y1 - y0) * k + (H(s + c0 + i + 40, tick) - .5) * jit]) } pts.push([x1, y1]);
    const path = () => { g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])) }; g.lineJoin = g.lineCap = 'round'; path(); g.strokeStyle = `rgba(${c},${al * .32})`; g.lineWidth = w * 4.5; g.stroke(); path(); g.strokeStyle = `rgba(${c},${al * .85})`; g.lineWidth = w * 1.8; g.stroke(); path(); g.strokeStyle = `rgba(255,255,255,${al})`; g.lineWidth = w * .7; g.stroke() }

  const FX = {
    burn: {
      back(g, x, y, h, t) { add(g, () => { ground(g, x, y, h * .62, h * .24, '255,130,40', .42 + .12 * Math.sin(t * .012)); ground(g, x, y, h * .3, h * .11, '255,220,130', .3) }) },
      front(g, x, y, h, t, s) {
        const sw = .6 + .4 * swell(t, 2600, .7, s * 13);   /* flames flare up, die down, flare again */
        puffs(t, s + 5, 4, 2400, (k, i, c) => { if (H(s + c, i + 40) < .3) return; const sx = x + (H(s + c, i + 7) - .5) * h * .3 + k * h * .14 * (H(s, i) - .4), sy = y - h * (.8 + .65 * k), r = h * (.07 + .14 * k), a = Math.sin(Math.min(1, k * 1.15) * Math.PI) * .36; const gr = g.createRadialGradient(sx, sy, 0, sx, sy, r); gr.addColorStop(0, `rgba(66,58,54,${a})`); gr.addColorStop(1, 'rgba(66,58,54,0)'); g.fillStyle = gr; g.beginPath(); g.arc(sx, sy, r, 0, TAU); g.fill() });
        add(g, () => { glow(g, x, y - h * .35, h * .6 * sw, '255,120,40', .22);
          for (let i = 0; i < 7; i++) { const fx = x + (H(s, i) - .5) * h * .56, fy = y - H(s, i + 9) * h * .5, fh = h * (.22 + .2 * H(s, i + 20)) * sw * (.8 + .2 * Math.sin(t * .02 + i * 2)), fl = Math.sin(t * .017 + i * 1.7) * h * .035;
            flame(g, fx, fy, h * .15, fh, fl, '235,70,20', .45); flame(g, fx, fy, h * .1, fh * .74, fl, '255,170,50', .7); flame(g, fx, fy, h * .05, fh * .42, fl, '255,245,200', .8) }
          puffs(t, s + 3, 10, 1150, (k, i, c) => { const ex = x + (H(s + c, i) - .5) * h * .6 + Math.sin(k * 6 + i) * h * .05, ey = y - h * (.15 + 1.05 * k); glow(g, ex, ey, h * .035 * (1 - k * .5), k < .5 ? '255,230,150' : '255,150,70', (1 - k) * .95) }) });
      }
    },
    poison: {
      back(g, x, y, h, t) { g.fillStyle = 'rgba(52,120,40,.5)'; g.beginPath(); g.ellipse(x, y + h * .01, h * .36 + Math.sin(t * .003) * h * .014, h * .13, 0, 0, TAU); g.fill();
        add(g, () => { ground(g, x, y, h * .46, h * .17, '110,230,80', .35); g.strokeStyle = 'rgba(190,255,150,.55)'; g.lineWidth = Math.max(1, h * .01); g.beginPath(); g.ellipse(x, y + h * .01, h * .36, h * .13, 0, 0, TAU); g.stroke();
          puffs(t, 5, 4, 1700, (k, i, c) => { const bx = x + (H(c, i) - .5) * h * .5, by = y + (H(c, i + 3) - .5) * h * .1, r = h * .03 * Math.sin(k * Math.PI); g.strokeStyle = `rgba(200,255,160,${.8 * (1 - k)})`; g.beginPath(); g.arc(bx, by, r, Math.PI, TAU); g.stroke() }) }) },
      front(g, x, y, h, t, s) {
        add(g, () => { const m = .35 + .65 * swell(t, 3400, .5, s * 7); glow(g, x, y - h * .5, h * .62, '110,220,80', .16 * m);
          /* bubbles leave the puddle in groups, wobble up along the body and pop near the head */
          puffs(t, s, 10, 2300, (k, i, c) => { const gate = swell(t - k * 2300, 3400, .62, s * 7 + i * 60); if (gate <= .05 && k < .9) return;
            const bx = x + (H(s + c, i) - .5) * h * .6 + Math.sin(k * 7 + i * 2.1) * h * .04, by = y - h * (.02 + 1.04 * k), r = h * (.024 + .036 * H(s + c, i + 11)) * (.6 + .4 * Math.min(1, k * 4));
            if (k > .88) { const p = (k - .88) / .12; g.strokeStyle = `rgba(200,255,160,${1 - p})`; g.lineWidth = Math.max(1, h * .009); for (let j = 0; j < 6; j++) { const a = j / 6 * TAU + i; g.beginPath(); g.moveTo(bx + Math.cos(a) * r * (1 + p), by + Math.sin(a) * r * (1 + p)); g.lineTo(bx + Math.cos(a) * r * (1.6 + p * 1.8), by + Math.sin(a) * r * (1.6 + p * 1.8)); g.stroke() } glow(g, bx, by, r * 2.2 * (1 - p), '190,255,150', .5 * (1 - p)); return }
            const a = Math.min(1, k * 5); glow(g, bx, by, r * 2.4, '120,230,90', .28 * a); g.fillStyle = `rgba(90,190,60,${a * .3})`; g.strokeStyle = `rgba(200,255,150,${a * .95})`; g.lineWidth = Math.max(1, h * .009); g.beginPath(); g.arc(bx, by, r, 0, TAU); g.fill(); g.stroke();
            g.fillStyle = `rgba(245,255,230,${a})`; g.beginPath(); g.arc(bx - r * .35, by - r * .35, r * .25, 0, TAU); g.fill() }) });
      }
    },
    sleep: {
      back(g, x, y, h, t) { add(g, () => ground(g, x, y, h * .45, h * .16, '150,130,240', .2 + .08 * Math.sin(t * .002))) },
      front(g, x, y, h, t, s) { add(g, () => { glow(g, x + h * .08, y - h * .95, h * .42, '170,150,255', .16 + .08 * Math.sin(t * .0025));
          puffs(t, s + 9, 4, 3600, (k, i, c) => star4(g, x + (H(s + c, i) - .5) * h * .9, y - h * (.5 + .7 * H(s + c, i + 4)) - h * .1 * k, h * .05 * Math.sin(k * Math.PI), '225,215,255', Math.sin(k * Math.PI) * .9, k * 2)) });
        g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
        puffs(t, s, 3, 2700, (k, i) => { const zx = x + h * (.2 + .24 * k) + Math.sin(k * 5 + i) * h * .03, zy = y - h * (1.0 + .52 * k), sz = h * (.11 + .14 * k), a = Math.sin(Math.min(1, k * 1.1) * Math.PI);
          g.globalAlpha = a; g.font = `900 ${sz.toFixed(1)}px system-ui,sans-serif`; g.save(); g.translate(zx, zy); g.rotate(-.18 + k * .3); g.shadowColor = 'rgba(190,170,255,.95)'; g.shadowBlur = sz * .7; g.lineWidth = Math.max(2, sz * .2); g.strokeStyle = '#2a1e55'; g.fillStyle = '#ece4ff'; g.strokeText('Z', 0, 0); g.fillText('Z', 0, 0); g.restore() });
        g.restore() }
    },
    freeze: {
      back(g, x, y, h, t) { g.fillStyle = 'rgba(120,195,245,.4)'; g.beginPath(); g.ellipse(x, y, h * .42, h * .16, 0, 0, TAU); g.fill(); add(g, () => { ground(g, x, y, h * .56, h * .21, '170,230,255', .4); g.strokeStyle = 'rgba(235,250,255,.8)'; g.lineWidth = Math.max(1, h * .012); g.beginPath(); g.ellipse(x, y, h * .42, h * .16, 0, 0, TAU); g.stroke() });
        crystals(g, x, y, h, 3, true) },
      front(g, x, y, h, t, s) { crystals(g, x, y, h, s, false);
        add(g, () => { glow(g, x, y - h * .4, h * .6, '150,215,255', .14 + .05 * Math.sin(t * .003));
          for (let i = 0; i < 5; i++) { const tw = Math.max(0, Math.sin(t * .005 + i * 1.9 + s)); star4(g, x + (H(s, i + 30) - .5) * h * .7, y - h * (.05 + .3 * H(s, i + 31)), h * .07 * tw, '245,252,255', tw, t * .001 + i) }
          puffs(t, s + 2, 7, 3000, (k, i, c) => { const fx = x + (H(s + c, i) - .5) * h * .8 + Math.sin(k * 5 + i) * h * .05, fy = y - h * (1.15 - 1.05 * k), a = Math.sin(k * Math.PI); star4(g, fx, fy, h * .045, '235,248,255', a * .9, k * 3 + i); glow(g, fx, fy, h * .05, '180,230,255', a * .35) }) }) }
    },
    shock: {
      back(g, x, y, h, t, s) { const k = swell(t, 900, .3, s * 31); add(g, () => ground(g, x, y, h * .45, h * .17, '255,235,120', .12 + .3 * k)) },
      front(g, x, y, h, t, s) { add(g, () => {
          for (let b = 0; b < 3; b++) { const period = 820 + b * 390, tt = t + b * 300 + s * 31, c = Math.floor(tt / period), k = (tt % period) / period; if (k > .3) continue;   /* a crackle, then nothing for a moment */
            const x0 = x + (H(s + c, b) - .5) * h * .5, y0 = y - h * (.15 + .75 * H(s + c, b + 5)), an = H(s + c, b + 9) * TAU, len = h * (.26 + .22 * H(s + c, b + 3)), x1 = x0 + Math.cos(an) * len, y1 = y0 + Math.sin(an) * len, a = 1 - k / .3;
            zap(g, s, c * 7 + b, x0, y0, x1, y1, h * .1, h * .014, '255,225,90', a, Math.floor(t / 45)); glow(g, x1, y1, h * .09, '255,250,200', a * .8); glow(g, x0, y0, h * .06, '255,240,150', a * .6);
            for (let j = 0; j < 4; j++) { const sa = H(s + c, b * 9 + j) * TAU, d = h * .16 * (k / .3); g.fillStyle = `rgba(255,250,200,${a})`; g.fillRect(x1 + Math.cos(sa) * d - 1, y1 + Math.sin(sa) * d - 1, 2, 2) } }
          glow(g, x, y - h * .5, h * .55, '255,235,120', .06 + .1 * swell(t, 900, .3, s * 31)) }) }
    },
    weak: {
      back(g, x, y, h, t) { add(g, () => { ground(g, x, y, h * .46, h * .17, '150,100,215', .3 + .08 * Math.sin(t * .004)); const k = (t % 2200) / 2200; g.strokeStyle = `rgba(190,150,240,${.6 * (1 - k)})`; g.lineWidth = Math.max(1.2, h * .012); g.beginPath(); g.ellipse(x, y, h * (.44 - .2 * k), h * (.16 - .07 * k), 0, 0, TAU); g.stroke() }) },
      front(g, x, y, h, t, s) { add(g, () => { const gr = g.createLinearGradient(0, y - h * 1.05, 0, y); gr.addColorStop(0, 'rgba(160,110,220,0)'); gr.addColorStop(.6, `rgba(160,110,220,${.16 + .05 * Math.sin(t * .003)})`); gr.addColorStop(1, 'rgba(160,110,220,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(x, y - h * .5, h * .34, h * .55, 0, 0, TAU); g.fill();
          puffs(t, s, 6, 1900, (k, i, c) => { const gate = swell(t - k * 1900, 3000, .6, s * 5); if (gate <= .05) return; const dx = x + (H(s + c, i) - .5) * h * .58, dy = y - h * (1.08 - .8 * k), a = Math.sin(k * Math.PI) * .9, w = h * .03;
            glow(g, dx, dy, w * 3, '170,120,230', a * .4); g.fillStyle = `rgba(205,170,250,${a})`; g.beginPath(); g.moveTo(dx - w, dy - w * 1.3); g.lineTo(dx + w, dy - w * 1.3); g.lineTo(dx, dy + w * 1.1); g.closePath(); g.fill(); const tr = g.createLinearGradient(0, dy - w * 4.5, 0, dy - w * 1.3); tr.addColorStop(0, 'rgba(205,170,250,0)'); tr.addColorStop(1, `rgba(205,170,250,${a})`); g.fillStyle = tr; g.fillRect(dx - w * .35, dy - w * 4.5, w * .7, w * 3.2) }) }) }
    },
    silence: {
      front(g, x, y, h, t) { const bx = x + h * .3, by = y - h * 1.0 + Math.sin(t * .004) * h * .015, r = h * .1;
        add(g, () => { glow(g, bx, by, r * 2.6, '200,200,230', .22 + .08 * Math.sin(t * .005)); for (let i = 0; i < 2; i++) { const k = ((t + i * 800) % 1600) / 1600; g.strokeStyle = `rgba(210,210,235,${.5 * (1 - k)})`; g.lineWidth = Math.max(1, h * .008); g.beginPath(); g.arc(x + h * .06, y - h * .86, h * (.06 + .12 * k), -.9, .5); g.stroke() } });
        g.save(); g.globalAlpha = .82 + .15 * Math.sin(t * .005);
        g.fillStyle = 'rgba(248,248,252,.95)'; g.strokeStyle = '#3a3a48'; g.lineWidth = Math.max(1.5, h * .014); g.beginPath(); g.ellipse(bx, by, r * 1.15, r * .85, 0, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.moveTo(bx - r * .6, by + r * .65); g.lineTo(bx - r * 1.0, by + r * 1.25); g.lineTo(bx - r * .15, by + r * .8); g.fill();
        g.fillStyle = '#3a3a48'; for (let i = -1; i <= 1; i++) { g.beginPath(); g.arc(bx + i * r * .45, by, r * .12, 0, TAU); g.fill() }
        g.shadowColor = 'rgba(255,90,90,.9)'; g.shadowBlur = r * .8; g.strokeStyle = '#e03a44'; g.lineWidth = Math.max(2, h * .026); g.lineCap = 'round'; g.beginPath(); g.moveTo(bx - r * .95, by - r * .7); g.lineTo(bx + r * .95, by + r * .7); g.stroke(); g.restore() }
    },
    bind: {
      back(g, x, y, h, t) { add(g, () => ground(g, x, y, h * .44, h * .16, '110,210,80', .25)); vine(g, x, y, h, t, true) },
      front(g, x, y, h, t, s) { vine(g, x, y, h, t, false); add(g, () => { for (let i = 0; i < 4; i++) { const tw = Math.max(0, Math.sin(t * .004 + i * 1.7 + s)); star4(g, x + (H(s, i + 5) - .5) * h * .5, y - h * (.08 + .42 * H(s, i + 6)), h * .05 * tw, '210,255,170', tw * .9, i) } }) }
    }
  };
  /* ice shards round the feet: the back half is drawn behind the fighter, the front half over the ankles */
  function crystals(g, x, y, h, s, back) { for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + .35, front = Math.sin(a) > 0; if (front === back) continue; const bx = x + Math.cos(a) * h * .31, by = y + Math.sin(a) * h * .115, sh = h * (.15 + .16 * H(3, i)) * (back ? .85 : 1), w = h * .05, lean = Math.cos(a) * h * .06;
      const gr = g.createLinearGradient(bx - w, by, bx + w + lean, by - sh); gr.addColorStop(0, back ? 'rgba(50,110,185,.9)' : 'rgba(85,155,228,.94)'); gr.addColorStop(.55, back ? 'rgba(110,180,235,.9)' : 'rgba(175,230,255,.96)'); gr.addColorStop(1, 'rgba(250,254,255,.98)'); g.fillStyle = gr; g.beginPath(); g.moveTo(bx - w, by); g.lineTo(bx - w * .4 + lean * .55, by - sh * .6); g.lineTo(bx + lean, by - sh); g.lineTo(bx + w * .55 + lean * .5, by - sh * .55); g.lineTo(bx + w, by); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(bx + lean, by - sh); g.lineTo(bx - w * .1, by); g.stroke() } }
  function vine(g, x, y, h, t, back) { g.save(); g.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const cy = y - h * (.1 + .16 * i), rx = h * (.24 - .02 * i) * (1 + .03 * Math.sin(t * .004 + i)), ry = h * .07, tilt = (i % 2 ? .22 : -.22), a0 = back ? Math.PI : 0, a1 = back ? TAU : Math.PI;
      g.strokeStyle = '#234a1b'; g.lineWidth = h * .055; g.beginPath(); g.ellipse(x, cy, rx, ry, tilt, a0, a1); g.stroke(); g.strokeStyle = '#5fa53e'; g.lineWidth = h * .034; g.beginPath(); g.ellipse(x, cy, rx, ry, tilt, a0, a1); g.stroke(); g.strokeStyle = 'rgba(190,240,140,.7)'; g.lineWidth = h * .01; g.beginPath(); g.ellipse(x, cy - h * .008, rx, ry, tilt, a0, a1); g.stroke();
      if (!back) for (let j = 0; j < 2; j++) { const an = .5 + j * 1.6 + i * .5, ct = Math.cos(tilt), st = Math.sin(tilt), ex = rx * Math.cos(an), ey = ry * Math.sin(an), lx = x + ex * ct - ey * st, ly = cy + ex * st + ey * ct;
          g.fillStyle = j ? '#7ec455' : '#a0dc6c'; g.beginPath(); g.ellipse(lx, ly - h * .028, h * .045, h * .02, -.7 + i + j, 0, TAU); g.fill(); g.fillStyle = '#3d2f1c'; g.beginPath(); g.moveTo(lx + h * .03, ly); g.lineTo(lx + h * .05, ly - h * .03); g.lineTo(lx + h * .045, ly + h * .008); g.closePath(); g.fill() } }
    g.restore() }
  /* one ring when a status lands */
  function burst(g, kind, x, y, h, e) { if (e < 0 || e > 620) return; const k = e / 620, c = COL[kind] || '255,255,255'; add(g, () => { glow(g, x, y - h * .45, h * .7 * (1 - k), c, .4 * (1 - k)); g.strokeStyle = `rgba(${c},${1 - k})`; g.lineWidth = h * .05 * (1 - k) + 1; g.beginPath(); g.ellipse(x, y - h * .45, h * (.15 + .5 * k), h * (.2 + .6 * k), 0, 0, TAU); g.stroke();
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, d = h * (.2 + .6 * k); star4(g, x + Math.cos(a) * d, y - h * .45 + Math.sin(a) * d * .9, h * .06 * (1 - k * .6), c, 1 - k, a) } }) }
  function run(layer, g, u, x, y, h, t) { if (!u || u.hp <= 0) return; const { k, born } = track(u, t); if (!k.length) return; const s = seedOf(u);
    for (const kind of k) { const f = FX[kind]; if (!f) continue; g.save(); try { f[layer]?.(g, x, y, h, t, s); if (layer === 'front' && born[kind] != null) burst(g, kind, x, y, h, t - born[kind]) } finally { g.restore() } } }
  root.StatusFX = { back: (g, u, x, y, h, t) => run('back', g, u, x, y, h, t), front: (g, u, x, y, h, t) => run('front', g, u, x, y, h, t), kinds: Object.keys(FX), draw(g, kind, x, y, h, t, seed = 1) { const f = FX[kind]; if (!f) return; g.save(); f.back?.(g, x, y, h, t, seed); g.restore(); g.save(); f.front?.(g, x, y, h, t, seed); g.restore() } };
})(globalThis);
