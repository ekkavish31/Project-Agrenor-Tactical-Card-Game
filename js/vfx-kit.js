/* v98.405 VFX Kit — battle effects drawn entirely in code (soft glowing fantasy): layered additive light, particles, shapes that move every frame.
   Same call as BattleVFX.draw(e, t, p, a, g, camera):  e = { kind, seed, scale, color, tier }, t = 0..1, p = target feet, a = attacker feet, camera.w = one cell.
   Kinds: sword knife blunt spear rapier arrow shield parry · fire ice lightning wind water earth holy dark arcane heal · impact (tier light/heavy/critical/finisher) · death
   Painted variants are the default. The editor can still select the original stamps or the code-only variants.
   Preview of everything, old next to new: vfx-kit-preview.html */
(function (root) {
  'use strict';
  const SRC = (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) || '';   /* v98.621 · where this script lives, to find assets/fx/anim */
  function artURL(path) {
    if (!SRC) return path;
    const url = new URL('../' + path, SRC);
    const version = new URL(SRC).searchParams.get('v');
    if (version) url.searchParams.set('v', version);
    return url.href;
  }
  const TAU = Math.PI * 2, clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), lerp = (a, b, k) => a + (b - a) * k;
  const eo = t => 1 - Math.pow(1 - clamp(t), 3), seg = (t, a, b) => clamp((t - a) / (b - a)), bell = t => Math.sin(clamp(t) * Math.PI);
  const back = t => { t = clamp(t); return 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2) };
  const R = (e, i) => { let h = Math.imul(((e.seed || 1) * 2654435761) ^ (i * 40503), 2246822519) >>> 0; h = (h ^ h >>> 15) >>> 0; return (h % 10000) / 10000 };
  const chest = (p, cw) => p.y - cw * .65;
  const C = { white: '255,255,255', steel: '210,230,255', gold: '255,225,140', fire: '255,130,40', fireHi: '255,225,130', ice: '150,220,255', iceHi: '235,250,255', bolt: '170,190,255', boltHi: '255,250,210', wind: '160,250,205', water: '80,170,255', waterHi: '200,235,255', earth: '190,150,95', holy: '255,236,165', dark: '160,90,235', darkHi: '225,170,255', arcane: '190,130,255', heal: '130,250,170', blood: '255,120,90' };

  /* ---------- drawing bricks ---------- */
  const add = (g, f) => { g.save(); g.globalCompositeOperation = 'lighter'; try { f() } finally { g.restore() } };
  function glow(g, x, y, r, c, a) { if (r <= 0 || a <= 0) return; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(.4, `rgba(${c},${a * .42})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill() }
  function ring(g, x, y, rx, ry, w, c, a) { if (a <= 0 || rx <= 0) return; g.strokeStyle = `rgba(${c},${a})`; g.lineWidth = Math.max(.5, w); g.beginPath(); g.ellipse(x, y, rx, Math.max(.1, ry), 0, 0, TAU); g.stroke() }
  function star4(g, x, y, r, c, a, rot = 0) { if (a <= 0 || r <= 0) return; g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = `rgba(${c},${a})`; g.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * .16 : r, an = i / 8 * TAU; g.lineTo(Math.cos(an) * rr, Math.sin(an) * rr) } g.closePath(); g.fill(); g.restore() }
  /* streaks flying out of a point (k 0..1), slowing down, pulled by gravity */
  function sparks(g, e, n, x, y, spread, size, k, c, o = {}) { g.lineCap = 'round'; for (let i = 0; i < n; i++) { const an = (o.a0 ?? 0) + R(e, i + (o.s || 0)) * (o.arc ?? TAU), d = spread * (.35 + .65 * R(e, i + 50 + (o.s || 0))) * eo(k), px = x + Math.cos(an) * d, py = y + Math.sin(an) * d * (o.sy ?? .85) + (o.grav || 0) * k * k, al = (1 - k) * (o.alpha ?? 1); if (al <= 0) continue;
      g.strokeStyle = `rgba(${c},${al})`; g.lineWidth = Math.max(.6, size * (1 - k * .6)); g.beginPath(); g.moveTo(px, py); g.lineTo(px - Math.cos(an) * size * 3.2 * (1 - k), py - Math.sin(an) * size * 3.2 * (1 - k)); g.stroke() } }
  /* a slash: an arc that is fat in the middle and sharp at both ends */
  function crescent(g, cx, cy, r, a0, a1, w, c1, c2, al) { if (al <= 0) return; const n = 20; g.beginPath(); for (let i = 0; i <= n; i++) { const k = i / n, an = lerp(a0, a1, k), rr = r + w * Math.sin(k * Math.PI); g.lineTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr) } for (let i = n; i >= 0; i--) { const k = i / n, an = lerp(a0, a1, k), rr = r - w * .22 * Math.sin(k * Math.PI); g.lineTo(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr) } g.closePath();
    const gr = g.createRadialGradient(cx, cy, Math.max(0, r - w * .3), cx, cy, r + w); gr.addColorStop(0, `rgba(${c2},0)`); gr.addColorStop(.3, `rgba(${c1},${al})`); gr.addColorStop(1, `rgba(${c2},${al * .15})`); g.fillStyle = gr; g.fill() }
  /* a jagged bolt with a soft halo; `tick` re-rolls the shape so it flickers */
  function bolt(g, e, x0, y0, x1, y1, jit, s, w, c, al, tick = 0) { if (al <= 0) return []; const pts = [[x0, y0]], n = 9; for (let i = 1; i < n; i++) { const k = i / n; pts.push([lerp(x0, x1, k) + (R(e, s + i + tick * 7) - .5) * jit, lerp(y0, y1, k) + (R(e, s + i + 40 + tick * 7) - .5) * jit * .4]) } pts.push([x1, y1]);
    const path = () => { g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])) }; g.lineJoin = g.lineCap = 'round';
    path(); g.strokeStyle = `rgba(${c},${al * .3})`; g.lineWidth = w * 4.5; g.stroke(); path(); g.strokeStyle = `rgba(${c},${al * .8})`; g.lineWidth = w * 1.8; g.stroke(); path(); g.strokeStyle = `rgba(255,255,255,${al})`; g.lineWidth = w * .7; g.stroke(); return pts }
  function flame(g, x, y, w, h, lean, c, a) { if (a <= 0 || h <= 0) return; g.fillStyle = `rgba(${c},${a})`; g.beginPath(); g.moveTo(x - w / 2, y); g.bezierCurveTo(x - w * .75, y - h * .45, x - w * .15 + lean, y - h * .6, x + lean * 1.6, y - h); g.bezierCurveTo(x + w * .2 + lean, y - h * .55, x + w * .78, y - h * .4, x + w / 2, y); g.closePath(); g.fill() }
  const puff = (g, x, y, r, c, a) => { if (a <= 0) return; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill() };
  /* A straight streak from the caster to the target. Returns the impact progress 0..1, or -1 while it flies. */
  function fly(g, e, t, a, p, cw, split, c, hi, size) { if (!a || Math.abs(a.x - p.x) + Math.abs(a.y - p.y) < 4) return clamp(t); if (t >= split) return (t - split) / (1 - split);
    const k = t / split, ay = a.y - cw * .75, py = chest(p, cw);
    const tail = Math.max(0, k - .26);
    const x = lerp(a.x, p.x, k), y = lerp(ay, py, k);
    const tx = lerp(a.x, p.x, tail), ty = lerp(ay, py, tail);
    add(g, () => {
      if (k > 0) {
        const trail = g.createLinearGradient(tx, ty, x, y);
        trail.addColorStop(0, `rgba(${c},0)`);
        trail.addColorStop(.65, `rgba(${c},.65)`);
        trail.addColorStop(1, `rgba(${hi},.95)`);
        g.strokeStyle = trail;
        g.lineCap = 'round';
        g.lineWidth = size * .72;
        g.beginPath(); g.moveTo(tx, ty); g.lineTo(x, y); g.stroke();
      }
      glow(g, x, y, size, hi, .8);
    });
    return -1;
  }

  /* ---------- the effects ---------- */
  const FX = {
    sword(g, e, t, p, a, cw) { const W = cw * (e.scale || 1), dir = a.x <= p.x ? -1 : 1,   /* v98.594 · the crescent faced the opposite side (it opened away from the attacker) → mirrored */ cy = chest(p, cw), sw = eo(seg(t, 0, .34)), al = 1 - seg(t, .32, .8), a0 = dir > 0 ? Math.PI + 2.3 : -2.3, a1 = a0 - dir * 2.5 * sw;
      add(g, () => { crescent(g, p.x + dir * W * .25, cy + W * .1, W * .78, a0, a1, W * .2, C.white, C.steel, al); crescent(g, p.x + dir * W * .25, cy + W * .1, W * .7, a0, a1, W * .42, C.steel, C.gold, al * .45);
        const hx = p.x, k = seg(t, .22, 1); glow(g, hx, cy, W * .85 * bell(seg(t, .16, .55)), C.white, .55); if (k > 0) { sparks(g, e, 10, hx, cy, W * .95, W * .035, k, C.gold, { a0: dir > 0 ? -1.2 : Math.PI - 1.2, arc: 2.4, grav: W * .25 }); star4(g, hx, cy, W * .55 * (1 - k), C.white, 1 - k, k) } }); return true },
    knife(g, e, t, p, a, cw) { const W = cw * (e.scale || 1), cy = chest(p, cw);
      add(g, () => { for (let i = 0; i < 2; i++) { const tt = seg(t, i * .2, i * .2 + .5); if (!tt) continue; const an = (i ? .9 : -.9) + (R(e, i) - .5) * .3, len = W * .95, sw = eo(seg(tt, 0, .45)), al = 1 - seg(tt, .4, 1), cx = Math.cos(an), sy = Math.sin(an);
          g.lineCap = 'round'; for (const [w, c, o] of [[W * .11, C.steel, .35], [W * .045, C.white, 1]]) { g.strokeStyle = `rgba(${c},${al * o})`; g.lineWidth = w; g.beginPath(); g.moveTo(p.x - cx * len * .5, cy - sy * len * .5); g.lineTo(p.x - cx * len * .5 + cx * len * sw, cy - sy * len * .5 + sy * len * sw); g.stroke() } }
        const k = seg(t, .3, 1); sparks(g, e, 8, p.x, cy, W * .7, W * .028, k, C.steel, { grav: W * .2 }); star4(g, p.x, cy, W * .5 * bell(seg(t, .15, .7)), C.white, .9, t * 2) }); return true },
    blunt(g, e, t, p, a, cw) { const W = cw * (e.scale || 1), cy = chest(p, cw), k = eo(t);
      for (let i = 0; i < 6; i++) { const an = Math.PI + R(e, i) * Math.PI, d = W * .85 * eo(seg(t, .08, 1)); puff(g, p.x + Math.cos(an) * d, p.y - W * .08 - W * .3 * seg(t, .08, 1) * R(e, i + 9), W * (.22 + .3 * t), '150,135,115', .5 * (1 - t)) }
      add(g, () => { glow(g, p.x, cy, W * 1.1 * bell(seg(t, 0, .4)), C.white, .7); ring(g, p.x, p.y, W * (.3 + 1.25 * k), W * (.12 + .5 * k), W * .09 * (1 - t), C.gold, 1 - t); ring(g, p.x, p.y, W * (.2 + .9 * k), W * (.08 + .36 * k), W * .04 * (1 - t), C.white, (1 - t) * .8);
        sparks(g, e, 9, p.x, p.y - W * .1, W * .9, W * .04, seg(t, .05, .9), '230,200,150', { a0: Math.PI, arc: Math.PI, grav: W * .5 }) }); return true },
    spear(g, e, t, p, a, cw) { return thrust(g, e, t, p, a, cw, 1.15, C.steel) },
    rapier(g, e, t, p, a, cw) { return thrust(g, e, t, p, a, cw, .8, C.gold) },
    arrow(g, e, t, p, a, cw) { const W = cw * (e.scale || 1), ay = a.y - cw * .75, py = chest(p, cw), fl = seg(t, 0, .82), x = a.x + (p.x - a.x) * fl, y = ay + (py - ay) * fl, an = Math.atan2(py - ay, p.x - a.x);
      if (fl < 1) { g.save(); g.translate(x, y); g.rotate(an); add(g, () => { const gr = g.createLinearGradient(-W * 1.1, 0, 0, 0); gr.addColorStop(0, 'rgba(255,240,200,0)'); gr.addColorStop(1, 'rgba(255,240,200,.75)'); g.strokeStyle = gr; g.lineWidth = W * .05; g.beginPath(); g.moveTo(-W * 1.1, 0); g.lineTo(0, 0); g.stroke() });
        g.strokeStyle = '#6b4a2a'; g.lineWidth = W * .035; g.beginPath(); g.moveTo(-W * .5, 0); g.lineTo(W * .1, 0); g.stroke(); g.fillStyle = '#e8eef5'; g.beginPath(); g.moveTo(W * .2, 0); g.lineTo(W * .06, -W * .05); g.lineTo(W * .06, W * .05); g.closePath(); g.fill(); g.fillStyle = '#c9553a'; g.beginPath(); g.moveTo(-W * .5, 0); g.lineTo(-W * .62, -W * .06); g.lineTo(-W * .42, 0); g.lineTo(-W * .62, W * .06); g.closePath(); g.fill(); g.restore() }
      const k = seg(t, .82, 1); if (k > 0) add(g, () => { glow(g, p.x, py, W * .6 * (1 - k), C.white, .8); sparks(g, e, 7, p.x, py, W * .55, W * .03, k, C.gold, { grav: W * .2 }); ring(g, p.x, py, W * .5 * k, W * .5 * k, W * .03, C.white, 1 - k) }); return true },
    shield(g, e, t, p, a, cw) { const W = cw * (e.scale || 1), an = Math.atan2(a.y - p.y, a.x - p.x), cx = p.x + Math.cos(an) * cw * .2, cy = chest(p, cw), s = back(seg(t, 0, .25)), al = 1 - seg(t, .5, 1), rx = W * .62 * s, ry = W * .82 * s;
      add(g, () => { const gr = g.createRadialGradient(cx, cy, rx * .2, cx, cy, ry); gr.addColorStop(0, `rgba(${C.steel},0)`); gr.addColorStop(.75, `rgba(${C.steel},${.16 * al})`); gr.addColorStop(1, `rgba(${C.white},${.7 * al})`); g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.fill();
        g.save(); g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, TAU); g.clip(); g.strokeStyle = `rgba(${C.white},${.28 * al})`; g.lineWidth = 1; const hs = W * .17; for (let r = -5; r <= 5; r++) for (let q = -4; q <= 4; q++) { const hx = cx + q * hs * 1.5, hy = cy + (r + (q & 1) * .5) * hs * 1.73 * .58; g.beginPath(); for (let i = 0; i < 6; i++) { const aa = i / 6 * TAU; g.lineTo(hx + Math.cos(aa) * hs * .5, hy + Math.sin(aa) * hs * .5) } g.closePath(); g.stroke() }
        const sw = seg(t, .1, .6), gy = cy - ry + sw * ry * 2, gg = g.createLinearGradient(0, gy - W * .2, 0, gy + W * .2); gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(.5, `rgba(255,255,255,${.55 * al})`); gg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gg; g.fillRect(cx - rx, gy - W * .2, rx * 2, W * .4); g.restore();
        ring(g, cx, cy, rx * (1 + .35 * seg(t, 0, .5)), ry * (1 + .35 * seg(t, 0, .5)), W * .03, C.steel, 1 - seg(t, 0, .5)) }); return true },
    parry(g, e, t, p, a, cw) { const W = cw * (e.scale || 1), cy = chest(p, cw) - cw * .1, k = seg(t, .05, 1);
      add(g, () => { glow(g, p.x, cy, W * .9 * bell(seg(t, 0, .45)), C.white, .85); star4(g, p.x, cy, W * 1.05 * back(seg(t, 0, .2)) * (1 - seg(t, .3, .9)), C.white, 1 - seg(t, .3, .9), .78); star4(g, p.x, cy, W * .7 * (1 - seg(t, .2, .8)), C.gold, 1 - seg(t, .2, .8), 0);
        ring(g, p.x, cy, W * .9 * eo(t), W * .9 * eo(t), W * .05 * (1 - t), C.gold, 1 - t); sparks(g, e, 14, p.x, cy, W * 1.15, W * .035, k, C.gold, { grav: W * .35 }) }); return true },
    fire(g, e, t, p, a, cw) { const W = cw * (e.scale || 1), k = fly(g, e, t, a, p, cw, .42, C.fire, C.fireHi, W * .34); if (k < 0) return true; const up = back(seg(k, 0, .28)), al = 1 - seg(k, .62, 1), die = 1 - .55 * seg(k, .5, 1);
      for (let i = 0; i < 6; i++) { const kk = seg(k, .2 + i * .07, 1); puff(g, p.x + (R(e, i + 30) - .5) * W * .7 + Math.sin(kk * 3 + i) * W * .1, p.y - W * (1.1 + 1.2 * kk), W * (.3 + .5 * kk), '60,50,48', .42 * bell(kk)) }
      add(g, () => { glow(g, p.x, p.y - W * .35, W * 1.9 * up, C.fire, .55 * al); glow(g, p.x, p.y - W * .2, W * 1.0 * up, C.fireHi, .5 * al);
        const b = seg(k, 0, .45); ring(g, p.x, p.y, W * (.3 + 1.3 * eo(b)), W * (.11 + .47 * eo(b)), W * .1 * (1 - b), C.fireHi, 1 - b); glow(g, p.x, p.y - W * .4, W * 1.5 * bell(seg(k, 0, .3)), C.white, .7);
        /* three rows of tongues: deep red behind, orange, then the bright core — each one sways on its own */
        for (const [n, wd, ht, c, o, row] of [[9, .46, 1.75, '235,70,20', .5, 0], [7, .36, 1.45, C.fire, .62, 1], [5, .26, 1.1, C.fireHi, .8, 2], [3, .14, .7, C.white, .85, 3]]) for (let i = 0; i < n; i++) { const u = n > 1 ? i / (n - 1) - .5 : 0, fx = p.x + u * W * (1.25 - row * .2) + (R(e, i + row * 11) - .5) * W * .08, fall = 1 - Math.abs(u) * 1.1, h = W * ht * (.6 + .4 * R(e, i + row * 7 + 5)) * up * fall * die * (.86 + .14 * Math.sin(k * 26 + i * 2.3 + row)), lean = Math.sin(k * 17 + i * 1.9 + row * 1.3) * W * .09 + u * W * .25; flame(g, fx, p.y + W * .04, W * wd, h, lean, c, o * al) }
        for (let i = 0; i < 22; i++) { const kk = seg(k, R(e, i + 60) * .45, 1); if (!kk) continue; const x = p.x + (R(e, i + 70) - .5) * W * 1.3 + Math.sin(kk * 7 + i) * W * .08, y = p.y - W * (.2 + 2.3 * kk * (.6 + .4 * R(e, i + 80))); glow(g, x, y, W * .075 * (1 - kk * .5), i % 3 ? C.fireHi : C.white, 1 - kk) } }); return true },
    ice(g, e, t, p, a, cw) { const W = cw * (e.scale || 1), k = fly(g, e, t, a, p, cw, .4, C.ice, C.iceHi, W * .3); if (k < 0) return true; const al = 1 - seg(k, .7, 1);
      add(g, () => { glow(g, p.x, p.y - W * .5, W * 1.7 * bell(seg(k, 0, .9)), C.ice, .4); const gr = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, W * 1.25); gr.addColorStop(0, `rgba(${C.iceHi},${.5 * al})`); gr.addColorStop(1, `rgba(${C.ice},0)`); g.save(); g.translate(p.x, p.y); g.scale(1, .36); g.translate(-p.x, -p.y); g.fillStyle = gr; g.beginPath(); g.arc(p.x, p.y, W * 1.25 * eo(seg(k, 0, .4)), 0, TAU); g.fill(); g.restore() });
      /* crystals shoot up one after another from the middle outwards: a dark back row, then the bright front row */
      g.save(); g.globalAlpha = al; for (const [n, ht, wd, dk, row] of [[9, 1.25, .13, 1, 0], [7, 1.75, .17, 0, 1]]) for (let i = 0; i < n; i++) { const u = i / (n - 1) - .5, up = back(seg(k, Math.abs(u) * .22, Math.abs(u) * .22 + .26)), off = u * W * (1.45 - row * .25), h = W * ht * (.55 + .45 * R(e, i + row * 13)) * up * (1 - Math.abs(u) * .75), w = W * wd, lean = off * .42, bx = p.x + off, by = p.y + W * .05 - row * W * .02; if (h <= 0) continue;
        const gr = g.createLinearGradient(bx - w, by, bx + w + lean, by - h); gr.addColorStop(0, dk ? 'rgba(40,95,170,.92)' : 'rgba(80,150,225,.95)'); gr.addColorStop(.55, dk ? 'rgba(95,165,225,.92)' : 'rgba(170,228,255,.96)'); gr.addColorStop(1, 'rgba(250,254,255,.98)'); g.fillStyle = gr; g.beginPath(); g.moveTo(bx - w, by); g.lineTo(bx - w * .45 + lean * .55, by - h * .62); g.lineTo(bx + lean, by - h); g.lineTo(bx + w * .55 + lean * .5, by - h * .55); g.lineTo(bx + w, by); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(bx - w * .45 + lean * .55, by - h * .62); g.lineTo(bx + lean, by - h); g.lineTo(bx - w * .05 + lean * .3, by - h * .3); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1; g.beginPath(); g.moveTo(bx + lean, by - h); g.lineTo(bx - w * .05, by); g.stroke() } g.restore();
      add(g, () => { const b = seg(k, 0, .5); ring(g, p.x, p.y, W * (.3 + 1.2 * eo(b)), W * (.11 + .43 * eo(b)), W * .08 * (1 - b), C.iceHi, 1 - b); glow(g, p.x, p.y - W * .6, W * 1.2 * bell(seg(k, 0, .3)), C.white, .65);
        for (let i = 0; i < 18; i++) { const kk = seg(k, .12 + R(e, i + 80) * .35, 1), an = -Math.PI * R(e, i + 90), d = W * (.5 + 1.0 * R(e, i + 95)) * eo(kk); if (!kk) continue; star4(g, p.x + Math.cos(an) * d, p.y - W * .5 + Math.sin(an) * d * .9 + W * .5 * kk * kk, W * (.09 + .08 * R(e, i)) * (1 - kk * .6), i % 3 ? C.iceHi : C.white, 1 - kk, kk * 4 + i) } }); return true },
    lightning(g, e, t, p, a, cw) { const W = cw * (e.scale || 1), tick = Math.floor(t * 26), top = p.y - W * 4.4, cy = chest(p, cw);
      /* two strikes: the main one and an echo; each holds bright for a moment, then flickers out */
      const strike = (t0, x0, s, w) => { const tt = seg(t, t0, t0 + .5); if (tt <= 0 || tt >= 1) return 0; const fl = (tt < .3 ? 1 : 1 - seg(tt, .3, 1)) * (tick % 2 && tt > .2 ? .6 : 1);
        const pts = bolt(g, e, x0, top, p.x + (s ? (R(e, s) - .5) * W * .3 : 0), p.y - W * .08, W * .7, 10 + s, W * w, C.bolt, fl, Math.floor(tick / 2)); for (const [i, q0] of [[2, 20], [4, 31], [5, 44], [7, 57]]) { const q = pts[i]; if (q) bolt(g, e, q[0], q[1], q[0] + (R(e, q0 + s) - .5) * W * 1.7, q[1] + W * (.45 + .7 * R(e, q0 + 1 + s)), W * .35, q0 + s, W * w * .45, C.bolt, fl * .75, Math.floor(tick / 2)) } return fl };
      add(g, () => { if (t < .3) { g.fillStyle = `rgba(200,210,255,${.16 * (1 - t / .3)})`; g.fillRect(0, 0, g.canvas.width, g.canvas.height) }
        const f1 = strike(0, p.x + (R(e, 3) - .5) * W * 1.0, 0, .085), f2 = strike(.3, p.x + (R(e, 4) - .5) * W * 1.6, 60, .06), fl = Math.max(f1, f2);
        glow(g, p.x, p.y - W * .3, W * 1.9 * (.35 + .65 * fl), C.bolt, .55 * fl); glow(g, p.x, p.y - W * .15, W * .9 * fl, C.white, .9 * fl);
        for (let i = 0; i < 2; i++) { const b = seg(t, i * .3, i * .3 + .55); ring(g, p.x, p.y, W * (.25 + 1.35 * eo(b)), W * (.1 + .5 * eo(b)), W * .08 * (1 - b), i ? C.bolt : C.boltHi, (1 - b) * (b > 0 ? 1 : 0)) }
        const k = seg(t, .08, 1); for (let i = 0; i < 9; i++) { if ((tick + i) % 3) continue; const an = R(e, i + 60 + tick) * TAU, r0 = W * (.2 + .65 * R(e, i + 70 + tick)), x0 = p.x + Math.cos(an) * r0, y0 = cy + Math.sin(an) * r0 * .8; bolt(g, e, x0, y0, x0 + (R(e, i + tick) - .5) * W * .6, y0 + (R(e, i + tick + 9) - .5) * W * .6, W * .16, i * 5 + 100, W * .022, C.boltHi, (1 - k) * .95, tick) }
        sparks(g, e, 16, p.x, p.y - W * .1, W * 1.3, W * .035, k, C.boltHi, { a0: Math.PI, arc: Math.PI, grav: W * .4 }) }); return true },
    wind(g, e, t, p, a, cw) { const W = cw * (e.scale || 1), k = fly(g, e, t, a, p, cw, .34, C.wind, C.white, W * .24); if (k < 0) return true; const al = 1 - seg(k, .6, 1), grow = eo(seg(k, 0, .35));
      /* a small whirlwind: rings stacked from the ground up, wider toward the top, each spinning at its own phase; back halves first, then the front */
      const N = 11, part = front => add(g, () => { g.lineCap = 'round'; for (let i = 0; i < N; i++) { const u = i / (N - 1), y = p.y - W * 1.75 * u * grow, r = W * (.2 + .62 * u) * grow, sway = Math.sin(k * 9 + u * 4) * W * .1 * u, a0 = k * 15 + i * .9, len = 1.9 + .8 * Math.sin(i * 1.7), s0 = front ? 0 : Math.PI;
          for (const [w, c, o] of [[W * .11, C.wind, .26], [W * .045, i % 2 ? C.white : C.wind, .8]]) { g.strokeStyle = `rgba(${c},${o * al * (front ? 1 : .5)})`; g.lineWidth = w * (1 - u * .35); g.beginPath(); g.ellipse(p.x + sway, y, r, r * .3, 0, s0 + (a0 % Math.PI), s0 + (a0 % Math.PI) + Math.min(len, Math.PI - (a0 % Math.PI))); g.stroke() } } });
      part(false); add(g, () => { glow(g, p.x, p.y - W * .8, W * 1.5 * grow, C.wind, .3 * al); const b = seg(k, 0, .5); ring(g, p.x, p.y, W * (.3 + 1.1 * eo(b)), W * (.11 + .4 * eo(b)), W * .06 * (1 - b), C.white, 1 - b) }); part(true);
      for (let i = 0; i < 12; i++) { const an = R(e, i) * TAU + k * 9, u = (R(e, i + 9) + k * .7) % 1, r = W * (.25 + .7 * u) * grow; g.save(); g.translate(p.x + Math.cos(an) * r, p.y - W * 1.75 * u * grow + Math.sin(an) * r * .3); g.rotate(an * 2); g.globalAlpha = al; g.fillStyle = i % 2 ? '#7fd06a' : '#c5ee9a'; g.beginPath(); g.ellipse(0, 0, W * .085, W * .035, 0, 0, TAU); g.fill(); g.restore() } return true },
    water(g, e, t, p, a, cw) { const W = cw * (e.scale || 1), k = fly(g, e, t, a, p, cw, .42, C.water, C.waterHi, W * .28); if (k < 0) return true; const up = bell(seg(k, 0, .75)), al = 1 - seg(k, .6, 1);
      add(g, () => { const h = W * 1.5 * up, gr = g.createLinearGradient(0, p.y, 0, p.y - h); gr.addColorStop(0, `rgba(${C.water},${.75 * al})`); gr.addColorStop(.7, `rgba(${C.waterHi},${.6 * al})`); gr.addColorStop(1, `rgba(${C.white},0)`); g.fillStyle = gr; g.beginPath(); g.moveTo(p.x - W * .34, p.y); g.quadraticCurveTo(p.x - W * .12, p.y - h * .55, p.x - W * .2, p.y - h); g.quadraticCurveTo(p.x, p.y - h * 1.12, p.x + W * .2, p.y - h); g.quadraticCurveTo(p.x + W * .12, p.y - h * .55, p.x + W * .34, p.y); g.closePath(); g.fill();
        for (let i = 0; i < 3; i++) { const kk = seg(k, i * .14, 1); ring(g, p.x, p.y, W * (.2 + 1.1 * eo(kk)), W * (.07 + .4 * eo(kk)), W * .04 * (1 - kk), i ? C.water : C.waterHi, (1 - kk) * .9) }
        for (let i = 0; i < 12; i++) { const an = -Math.PI * (.15 + .7 * R(e, i)), v = W * (1 + .8 * R(e, i + 20)), kk = seg(k, .08, 1), x = p.x + Math.cos(an) * v * kk * .9, y = p.y - W * .2 + Math.sin(an) * v * kk + W * 1.5 * kk * kk; glow(g, x, y, W * .07 * (1 - kk * .4), C.waterHi, 1 - kk) } }); return true },
    earth(g, e, t, p, a, cw) { const W = cw * (e.scale || 1), al = 1 - seg(t, .72, 1);
      for (let i = 0; i < 9; i++) { const an = Math.PI + R(e, i + 30) * Math.PI, d = W * 1.25 * eo(seg(t, .06, 1)); puff(g, p.x + Math.cos(an) * d, p.y - W * .1 - W * .45 * t * R(e, i + 3), W * (.3 + .5 * t), '150,128,100', .55 * (1 - t)) }
      add(g, () => { glow(g, p.x, p.y - W * .2, W * 1.3 * bell(seg(t, 0, .35)), C.gold, .55) });
      /* rock spikes burst out from the middle outwards; a darker back row gives depth */
      g.save(); g.globalAlpha = al; for (const [n, ht, wd, dk, row] of [[8, 1.0, .2, 1, 0], [6, 1.5, .25, 0, 1]]) for (let i = 0; i < n; i++) { const u = i / (n - 1) - .5, up = back(seg(t, Math.abs(u) * .2, Math.abs(u) * .2 + .24)), off = u * W * (1.6 - row * .3), h = W * ht * (.55 + .45 * R(e, i + row * 13)) * up * (1 - Math.abs(u) * .7), w = W * wd, lean = off * .4, bx = p.x + off, by = p.y + W * .06 - row * W * .02; if (h <= 0) continue;
        const gr = g.createLinearGradient(bx - w, 0, bx + w, 0); gr.addColorStop(0, dk ? '#3b2f24' : '#6a5540'); gr.addColorStop(.42, dk ? '#7a6449' : '#c2a577'); gr.addColorStop(1, dk ? '#261e17' : '#43352a'); g.fillStyle = gr; g.beginPath(); g.moveTo(bx - w, by); g.lineTo(bx - w * .55 + lean * .5, by - h * .58); g.lineTo(bx + lean, by - h); g.lineTo(bx + w * .6 + lean * .45, by - h * .5); g.lineTo(bx + w, by); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,235,190,.28)'; g.beginPath(); g.moveTo(bx - w * .55 + lean * .5, by - h * .58); g.lineTo(bx + lean, by - h); g.lineTo(bx - w * .1 + lean * .3, by - h * .25); g.closePath(); g.fill() } g.restore();
      for (let i = 0; i < 16; i++) { const k = seg(t, .08, 1), an = -Math.PI * (.12 + .76 * R(e, i + 50)), v = W * (1.0 + 1.1 * R(e, i + 60)), x = p.x + Math.cos(an) * v * k, y = p.y - W * .3 + Math.sin(an) * v * k + W * 2.1 * k * k, s = W * (.035 + .05 * R(e, i + 65)); g.save(); g.translate(x, y); g.rotate(k * 8 + i); g.fillStyle = `rgba(${i % 2 ? '150,120,85' : '95,78,58'},${1 - k})`; g.fillRect(-s, -s, s * 2, s * 2); g.restore() }
      add(g, () => { for (let i = 0; i < 2; i++) { const b = seg(t, i * .12, .75 + i * .12); ring(g, p.x, p.y, W * (.3 + 1.35 * eo(b)), W * (.11 + .48 * eo(b)), W * .09 * (1 - b), i ? C.earth : C.gold, (1 - b) * .9) } }); return true },
    holy(g, e, t, p, a, cw) { const W = cw * (e.scale || 1), al = bell(seg(t, 0, 1)) * (t < .15 ? t / .15 : 1), cy = chest(p, cw), bw = W * (.2 + .55 * eo(seg(t, 0, .3)));
      add(g, () => { const top = p.y - W * 4, gr = g.createLinearGradient(p.x - bw, 0, p.x + bw, 0); gr.addColorStop(0, `rgba(${C.holy},0)`); gr.addColorStop(.5, `rgba(${C.white},${.75 * al})`); gr.addColorStop(1, `rgba(${C.holy},0)`); g.fillStyle = gr; g.fillRect(p.x - bw, top, bw * 2, p.y - top);
        const g2 = g.createLinearGradient(p.x - bw * 2, 0, p.x + bw * 2, 0); g2.addColorStop(0, `rgba(${C.holy},0)`); g2.addColorStop(.5, `rgba(${C.holy},${.3 * al})`); g2.addColorStop(1, `rgba(${C.holy},0)`); g.fillStyle = g2; g.fillRect(p.x - bw * 2, top, bw * 4, p.y - top);
        glow(g, p.x, p.y, W * 1.2, C.holy, .5 * al); for (let i = 0; i < 2; i++) { const kk = seg(t, .1 + i * .2, .8 + i * .2), y = p.y - W * 1.9 * (1 - eo(kk)); ring(g, p.x, y, W * .55, W * .18, W * .04, C.holy, bell(kk) * .9) }
        ring(g, p.x, p.y, W * (.3 + .9 * eo(t)), W * (.11 + .33 * eo(t)), W * .05 * (1 - t), C.white, 1 - t);
        for (let i = 0; i < 12; i++) { const kk = seg(t, R(e, i) * .4, 1); if (!kk) continue; star4(g, p.x + (R(e, i + 9) - .5) * W * 1.2, p.y - W * (.1 + 1.7 * kk), W * .13 * bell(kk), i % 3 ? C.holy : C.white, bell(kk), kk * 2 + i) } }); return true },
    dark(g, e, t, p, a, cw) { const W = cw * (e.scale || 1), k = fly(g, e, t, a, p, cw, .42, C.dark, C.darkHi, W * .26); if (k < 0) return true; const cy = chest(p, cw), s = back(seg(k, 0, .35)) * (1 - seg(k, .7, 1)), r = W * .62 * s;
      if (r > 0) { const gr = g.createRadialGradient(p.x, cy, 0, p.x, cy, r); gr.addColorStop(0, 'rgba(8,2,20,.95)'); gr.addColorStop(.7, 'rgba(40,10,80,.85)'); gr.addColorStop(1, 'rgba(90,40,160,0)'); g.fillStyle = gr; g.beginPath(); g.arc(p.x, cy, r, 0, TAU); g.fill() }
      add(g, () => { ring(g, p.x, cy, r * .98, r * .98, W * .05, C.darkHi, .8 * (1 - seg(k, .6, 1))); glow(g, p.x, cy, r * 1.9, C.dark, .35 * (1 - seg(k, .6, 1)));
        g.lineCap = 'round'; for (let i = 0; i < 7; i++) { const an = i / 7 * TAU + k * 2.2, r1 = r * (1.9 - .7 * k); g.strokeStyle = `rgba(${C.dark},${.6 * (1 - seg(k, .55, 1))})`; g.lineWidth = W * .035; g.beginPath(); g.moveTo(p.x + Math.cos(an) * r * .9, cy + Math.sin(an) * r * .9); g.quadraticCurveTo(p.x + Math.cos(an + .9) * r1 * .8, cy + Math.sin(an + .9) * r1 * .8, p.x + Math.cos(an + 1.5) * r1, cy + Math.sin(an + 1.5) * r1); g.stroke() }
        for (let i = 0; i < 12; i++) { const kk = seg(k, R(e, i) * .35, .9), an = R(e, i + 9) * TAU, d = W * 1.2 * (1 - eo(kk)); if (kk > 0 && kk < 1) glow(g, p.x + Math.cos(an) * d, cy + Math.sin(an) * d * .8, W * .05, C.darkHi, bell(kk)) }
        const b = seg(k, .7, 1); if (b > 0) { ring(g, p.x, cy, W * 1.1 * eo(b), W * 1.1 * eo(b), W * .05 * (1 - b), C.darkHi, 1 - b); sparks(g, e, 10, p.x, cy, W, W * .03, b, C.darkHi) } }); return true },
    arcane(g, e, t, p, a, cw) { const W = cw * (e.scale || 1), k = fly(g, e, t, a, p, cw, .5, C.arcane, C.white, W * .26); if (k < 0) return true; const cy = chest(p, cw), s = back(seg(k, 0, .3)), al = 1 - seg(k, .6, 1), r = W * .72 * s;
      add(g, () => { g.save(); g.translate(p.x, cy); g.scale(1, .92); g.rotate(k * 2.4); g.strokeStyle = `rgba(${C.arcane},${.9 * al})`; g.lineWidth = W * .028; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, r * .78, 0, TAU); g.stroke();
        for (let i = 0; i < 12; i++) { const an = i / 12 * TAU; g.beginPath(); g.moveTo(Math.cos(an) * r * .8, Math.sin(an) * r * .8); g.lineTo(Math.cos(an) * r * .98, Math.sin(an) * r * .98); g.stroke() }
        g.rotate(-k * 5); g.strokeStyle = `rgba(${C.white},${.8 * al})`; g.lineWidth = W * .02; for (let j = 0; j < 2; j++) { g.beginPath(); for (let i = 0; i < 3; i++) { const an = i / 3 * TAU + j * Math.PI; g.lineTo(Math.cos(an) * r * .74, Math.sin(an) * r * .74) } g.closePath(); g.stroke() } g.restore();
        glow(g, p.x, cy, W * 1.0 * bell(seg(k, 0, .6)), C.arcane, .5); star4(g, p.x, cy, W * .8 * bell(seg(k, .1, .7)), C.white, .9, -k * 3);
        const b = seg(k, .35, 1); for (let i = 0; i < 12; i++) { const an = R(e, i) * TAU; star4(g, p.x + Math.cos(an) * W * 1.0 * eo(b), cy + Math.sin(an) * W * .8 * eo(b), W * .09 * (1 - b), i % 2 ? C.arcane : C.white, 1 - b, b * 4 + i) } }); return true },
    heal(g, e, t, p, a, cw) { const W = cw * (e.scale || 1), gold = /^#f|^#e/i.test(e.color || ''), c = gold ? C.holy : C.heal, al = bell(t) * (t < .12 ? t / .12 : 1);
      add(g, () => { const h = W * 2, gr = g.createLinearGradient(0, p.y, 0, p.y - h); gr.addColorStop(0, `rgba(${c},${.45 * al})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.beginPath(); g.ellipse(p.x, p.y - h / 2, W * .5, h / 2, 0, 0, TAU); g.fill();
        ring(g, p.x, p.y, W * .62, W * .22, W * .045, c, .9 * al); ring(g, p.x, p.y, W * (.62 + .5 * eo(t)), W * (.22 + .18 * eo(t)), W * .025, C.white, (1 - t) * .7); glow(g, p.x, p.y, W * .9, c, .35 * al);
        for (let i = 0; i < 10; i++) { const kk = seg(t, R(e, i) * .45, 1); if (!kk) continue; const x = p.x + (R(e, i + 9) - .5) * W * 1.0 + Math.sin(kk * 5 + i) * W * .06, y = p.y - W * (.1 + 1.7 * kk), s = W * (.07 + .05 * R(e, i + 20)), aa = bell(kk);
          if (i % 3) { g.fillStyle = `rgba(${c},${aa})`; g.fillRect(x - s * .3, y - s, s * .6, s * 2); g.fillRect(x - s, y - s * .3, s * 2, s * .6) } else star4(g, x, y, s * 1.6, C.white, aa, kk * 3) } }); return true },
    /* the hit itself, in four weights */
    impact(g, e, t, p, a, cw) { const T = { light: [.8, 6, C.white, 0], heavy: [1.05, 10, C.gold, 0], critical: [1.3, 14, C.gold, 8], finisher: [1.65, 20, C.blood, 12] }[e.tier] || [.8, 6, C.white, 0], W = cw * T[0] * (e.scale || 1), cy = chest(p, cw), dir = a && a.x > p.x ? -1 : 1;
      add(g, () => { glow(g, p.x, cy, W * .95 * bell(seg(t, 0, .5)), C.white, .8); star4(g, p.x, cy, W * .9 * back(seg(t, 0, .18)) * (1 - seg(t, .25, .85)), C.white, 1 - seg(t, .25, .85), .3 * dir); if (T[3]) star4(g, p.x, cy, W * .6 * (1 - seg(t, .15, .7)), T[2], 1 - seg(t, .15, .7), .3 * dir + .78);
        ring(g, p.x, cy, W * .85 * eo(t), W * .85 * eo(t), W * .06 * (1 - t), T[2], 1 - t); if (e.tier === 'finisher') ring(g, p.x, cy, W * 1.25 * eo(seg(t, .12, 1)), W * 1.25 * eo(seg(t, .12, 1)), W * .04 * (1 - t), C.white, 1 - seg(t, .12, 1));
        for (let i = 0; i < T[3]; i++) { const an = i / T[3] * TAU + R(e, i) * .3, r0 = W * (.35 + .25 * eo(t)), r1 = W * (.75 + .6 * eo(t)); g.strokeStyle = `rgba(${C.white},${(1 - t) * .8})`; g.lineWidth = W * .025; g.beginPath(); g.moveTo(p.x + Math.cos(an) * r0, cy + Math.sin(an) * r0); g.lineTo(p.x + Math.cos(an) * r1, cy + Math.sin(an) * r1); g.stroke() }
        sparks(g, e, T[1], p.x, cy, W * 1.0, W * .035, seg(t, .05, 1), T[2], { a0: dir > 0 ? -1.3 : Math.PI - 1.3, arc: 2.6, grav: W * .3 }) }); return true },
    /* a fallen fighter: light leaves the body upward */
    death(g, e, t, p, a, cw) { const W = cw * (e.scale || 1), cy = chest(p, cw);
      add(g, () => { glow(g, p.x, cy, W * .9 * bell(seg(t, 0, .6)), C.steel, .45); ring(g, p.x, p.y, W * (.3 + .8 * eo(t)), W * (.11 + .3 * eo(t)), W * .04 * (1 - t), C.steel, 1 - t);
        for (let i = 0; i < 16; i++) { const kk = seg(t, R(e, i) * .5, 1); if (!kk) continue; const x = p.x + (R(e, i + 9) - .5) * W * .8 + Math.sin(kk * 6 + i) * W * .08, y = p.y - W * (.1 + .9 * R(e, i + 20)) - W * 1.3 * kk; glow(g, x, y, W * .07 * (1 - kk * .5), i % 3 ? C.steel : C.white, bell(kk)) }
        const kk = seg(t, .15, 1), y = cy - W * 1.4 * eo(kk); glow(g, p.x, y, W * .28 * (1 - kk * .4), C.white, bell(kk) * .9); star4(g, p.x, y, W * .3 * bell(kk), C.white, bell(kk), kk) }); return true }
  };
  function thrust(g, e, t, p, a, cw, len, c) { const W = cw * (e.scale || 1), ay = chest(a, cw), py = chest(p, cw), an = Math.atan2(py - ay, p.x - a.x) || 0, k = eo(seg(t, 0, .3)), al = 1 - seg(t, .35, .85), L = W * 1.9 * len;
    g.save(); g.translate(p.x, py); g.rotate(an); add(g, () => { for (const [w, cc, o] of [[W * .2, c, .35], [W * .09, C.white, .95]]) { const gr = g.createLinearGradient(-L, 0, W * .25, 0); gr.addColorStop(0, `rgba(${cc},0)`); gr.addColorStop(.75, `rgba(${cc},${o * al})`); gr.addColorStop(1, `rgba(${C.white},${al})`); g.fillStyle = gr; g.beginPath(); g.moveTo(-L * k, -w * .5); g.lineTo(W * .3 * k, 0); g.lineTo(-L * k, w * .5); g.closePath(); g.fill() } }); g.restore();
    add(g, () => { const kk = seg(t, .22, 1); glow(g, p.x, py, W * .7 * bell(seg(t, .15, .6)), C.white, .7); ring(g, p.x, py, W * .7 * eo(kk), W * .7 * eo(kk), W * .04 * (1 - kk), c, 1 - kk); star4(g, p.x, py, W * .6 * (1 - kk), C.white, 1 - kk, an); sparks(g, e, 9, p.x, py, W * .9, W * .03, kk, c, { a0: an - .9, arc: 1.8, grav: W * .2 }) }); return true }

  // Version the selection map so drafts from before the painted rollout
  // cannot mask the new defaults. Selections made in this map still win.
  const KEY = 'vfx-kit-kinds-v2', nameOf = k => k === 'impactCore' ? 'impact' : k;
  let mode; try { mode = new URLSearchParams(root.location?.search || '').get('vfx') } catch (_) { }
  let cache = null, cacheAt = 0;
  const choices = () => {
    const now = Date.now();
    if (cache && now - cacheAt < 1500) return cache;
    cacheAt = now;
    try { cache = JSON.parse(root.localStorage?.getItem(KEY) || '{}') || {} } catch (_) { cache = {} }
    return cache;
  };
  /* v98.594 · each effect has a LIST of looks: 'old' (the painted picture) · 'new' (this kit) · any extra look added later with VfxKit.addVariant(kind, id, label, fn) — the editor shows them all and the game uses the one chosen. */
  const EXTRA = {};
  const variants = k => { k = nameOf(k); return [['old', 'เดิม (ภาพวาดแปะ)'], ['new', 'ใหม่ (วาดด้วยโค้ด)'], ...Object.entries(EXTRA[k] || {}).map(([id, v]) => [id, v.label])] };
  const addVariant = (k, id, label, fn) => { k = nameOf(k); if (!id || id === 'old' || id === 'new' || typeof fn !== 'function') return false; (EXTRA[k] = EXTRA[k] || {})[id] = { label: label || id, fn }; return true };
  root.addEventListener?.('storage', e => { if (e.key === KEY || e.key === null) cache = null; });
  const defaultChoice = kind => {
    const looks = EXTRA[nameOf(kind)];
    return ['drawnImpact', 'drawnSequence', 'painted8', 'atlas', 'paintedLight'].find(id => looks?.[id]) || 'old';
  };
  const choiceOf = kind => {
    const k = nameOf(kind);
    if (mode === 'old' || mode === '0') return 'old';
    if (mode === 'new' || mode === '1') return FX[k] ? 'new' : 'old';
    const saved = choices()[k];
    if (saved === 'old' || (saved === 'new' && FX[k]) || EXTRA[k]?.[saved]) return saved;
    return defaultChoice(k);
  };
  const resetChoices = () => {
    try { root.localStorage.setItem(KEY, '{}'); cache = null } catch (_) { }
  };
  const uses = k => { k = nameOf(k); if (!FX[k] && !EXTRA[k]) return false; return choiceOf(k) !== 'old' };
  const setChoice = (k, v) => { try { const c = JSON.parse(root.localStorage.getItem(KEY) || '{}') || {}; c[nameOf(k)] = (v === 'new' || (v && v !== 'old')) ? String(v) : 'old'; root.localStorage.setItem(KEY, JSON.stringify(c)); cache = null } catch (_) { } };
  const enabled = () => Object.keys(FX).some(uses);
  function draw(e, t, p, a, g, camera, variant) { const k = nameOf(e.kind), id = variant || choiceOf(k), f = (id !== 'old' && id !== 'new' && EXTRA[k]?.[id]?.fn) || FX[k]; if (!f) return false; g.save(); try { return !!f(g, e, clamp(t), p, a || p, camera.w) } catch (err) { return false } finally { g.restore() } }
  root.VfxKit = { KEY, draw, has: k => !!FX[nameOf(k)], resetChoices, kinds: Object.keys(FX), uses, setChoice, choiceOf, variants, addVariant, enabled, setEnabled: v => { for (const k of Object.keys(FX)) setChoice(k, v ? 'new' : 'old') } };

  /* v98.621 · FIRE — hand-painted frame animation (two 4×4 sheets, 16 frames each: assets/fx/anim/fire-ball.webp = the flying fireball, fire-impact.webp = the burst that grows, burns and fades into smoke).
     Added as an extra look of 'fire' (id 'atlas'); the editor lists it next to 'old' and 'new', and the game plays it when it is the chosen one. Frames cross-fade, so it stays smooth at any frame rate. */
  const ANIM = {
    ball: { file: 'fire-ball', cw: 276, ch: 195, ax: .83, ay: .54 },      /* head of the fireball (bright core) is at the right; tail streams left */
    hit: { file: 'fire-impact', cw: 282, ch: 270, ax: .5, ay: .98 }      /* anchored at the ground under the target */
  };
  const animImg = {};
  function animSheet(n) { const d = ANIM[n]; let im = animImg[n]; if (!im) { im = animImg[n] = new Image(); im.decoding = 'async'; im.src = artURL('assets/fx/anim/' + d.file + '.webp') } return im.complete && im.naturalWidth ? im : null }
  animSheet('ball'); animSheet('hit');
  /* Interpolate premultiplied RGBA on one reusable cell-sized surface. Drawing
     weighted frames source-over directly would darken the midpoint / pop at cuts.
     Source sheets and fixed anchors stay unchanged. No frame-sized cache grows. */
  let blendSurface = null, blendContext = null;
  function blendedCell(g, im, cols, rows, phase, w, h, ax, ay, alpha = 1, loop = false) {
    const count = cols * rows, u = loop ? ((phase % 1) + 1) % 1 * count : clamp(phase) * (count - 1);
    const i = Math.floor(u), mix = u - i, j = loop ? (i + 1) % count : Math.min(count - 1, i + 1);
    const fw = im.naturalWidth / cols, fh = im.naturalHeight / rows;
    const crop = (q, frame, dw, dh) => q.drawImage(im, frame % cols * fw, Math.floor(frame / cols) * fh, fw, fh, 0, 0, dw, dh);
    g.save();
    try {
      g.globalAlpha *= alpha;
      if (mix < .0001 || i === j) {
        g.drawImage(im, i % cols * fw, Math.floor(i / cols) * fh, fw, fh, -w * ax, -h * ay, w, h);return true;
      }
      if (!blendSurface) { blendSurface = root.document?.createElement?.('canvas'); blendContext = blendSurface?.getContext?.('2d') }
      if (!blendContext) { g.drawImage(im, i % cols * fw, Math.floor(i / cols) * fh, fw, fh, -w * ax, -h * ay, w, h);return true }
      const limit = root.BattlePolish?.quality === 'low' ? 192 : 384;
      const bw = Math.max(1, Math.min(limit, Math.ceil(fw))), bh = Math.max(1, Math.round(bw * fh / fw));
      if (blendSurface.width !== bw || blendSurface.height !== bh) { blendSurface.width = bw;blendSurface.height = bh }
      const q = blendContext;q.clearRect(0, 0, bw, bh);q.globalCompositeOperation = 'source-over';q.globalAlpha = 1 - mix;crop(q, i, bw, bh);
      q.globalCompositeOperation = 'lighter';q.globalAlpha = mix;crop(q, j, bw, bh);
      q.globalAlpha = 1;q.globalCompositeOperation = 'source-over';
      g.drawImage(blendSurface, -w * ax, -h * ay, w, h);return true;
    } finally { g.restore() }
  }
  /* draw one frame (0..15) centred on its anchor point (0,0) of the current transform, w = drawn width */
  function animFrame(g, n, f, w, alpha) { const d = ANIM[n], im = animSheet(n); if (!im || alpha <= 0) return false; f = Math.max(0, Math.min(15, f | 0)); const h = w * d.ch / d.cw;
    g.save(); g.globalAlpha *= alpha; g.drawImage(im, (f % 4) * d.cw, Math.floor(f / 4) * d.ch, d.cw, d.ch, -w * d.ax, -h * d.ay, w, h); g.restore(); return true }
  /* cross-fade between neighbouring frames: u = 0..1 over the whole sheet */
  function animPlay(g, n, u, w, alpha = 1, loop = false) {
    const im = animSheet(n), d = ANIM[n];if (!im || alpha <= 0) return false;
    return blendedCell(g, im, 4, 4, u, w, w * d.ch / d.cw, d.ax, d.ay, alpha, loop);
  }
  /* single painted pieces: the fire-streak (spark) and the smoke wisp */
  function fireAtlas(g, e, t, p, a, cw) {
    const W = cw * (e.scale || 1), split = .46, far = a && (Math.abs(a.x - p.x) + Math.abs(a.y - p.y)) >= 4;
    if (!animSheet('ball') || !animSheet('hit')) return false;
    if (e.reducedMotion || root.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { g.save();g.translate(p.x,p.y+cw*.12);animFrame(g,'hit',5,W*2.5,.65*(1-t));g.restore();return true }
    if (far && t < split) {   /* The illustrated fire streak faces the target throughout travel. */
      const k = t / split, ay = a.y - cw * .75, py = chest(p, cw);
      const x = lerp(a.x, p.x, k), y = lerp(ay, py, k);
      const an = Math.atan2(py - ay, p.x - a.x);
      const grow = .5 + .5 * eo(seg(k, 0, .25));
      groundLight(g, x, lerp(a.y, p.y, k), W * 1.28, C.fire, grow * .56);
      add(g, () => glow(g, x, y, W * .42, C.fire, grow * .45));
      g.save(); g.translate(x, y); g.rotate(an); g.scale(1.22, Math.cos(an) < 0 ? -.76 : .76); animPlay(g, 'ball', k * 1.6, W * .95 * grow, 1, true); g.restore();
      return true }
    const k = far ? (t - split) / (1 - split) : t;   /* impact: 16 frames — flames rise, burn, turn to smoke */
    paintedLight('fire', g, e, k, p, W, false);
    const phase = k < .38 ? lerp(0, 7 / 15, k / .38) : lerp(7 / 15, 1, (k - .38) / .62);
    g.save();
    g.translate(p.x, p.y + cw * .12);
    animPlay(g, 'hit', phase, W * lerp(2.28, 2.58, eo(k)), 1 - seg(k, .88, 1));
    g.restore();
    paintedLight('fire', g, e, k, p, W, true);
    return true }
  if (root.VfxKit && root.VfxKit.addVariant) root.VfxKit.addVariant('fire', 'atlas', 'ภาพวาดเคลื่อนไหว (อะนิเมชันไฟ)', fireAtlas);

  /* v98.1162 · PROTOTYPE · FIRE "layered" — the painted fireball / impact sheets are only the PEAK of the effect; this look wraps them with the layers that make it belong to the scene
     (docs/TODO.md §42 proposal): windup at the caster → fireball + a trail of cooling embers → impact with a ground shock-ring + a scorch mark that stays → embers that fly, fall, bounce and settle.
     Everything is code on top of the same two sheets (no new art); every layer is deterministic per effect (R(e,i)) and the decorative ones are fewer on quality 'low'.
     Pick it in the VFX editor / vfx-kit-preview.html: 'ไฟ · หลายชั้น (ต้นแบบ)'. */
  function fireLayered(g, e, t, p, a, cw) {
    if (!animSheet('ball') || !animSheet('hit')) return false;
    const reduced = e.reducedMotion || root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return fireAtlas(g, e, t, p, a, cw);
    const W = cw * (e.scale || 1), low = root.BattlePolish?.quality === 'low', far = !!a && (Math.abs(a.x - p.x) + Math.abs(a.y - p.y)) >= 4;
    const t0 = far ? .12 : 0, mySplit = far ? t0 + .46 * (1 - t0) : 0, ti = far ? seg(t, mySplit, 1) : t, ground = p.y + cw * .08;
    const ellipse = (x, y, r, fn) => { g.save(); g.translate(x, y); g.scale(1, .5); fn(r); g.restore() };   /* 2:1 ground perspective */
    /* 1 · windup: light gathers at the caster, embers are drawn in, a ring on the ground closes */
    if (far && t < t0 + .05) {
      const k = seg(t, 0, t0), out = 1 - seg(t, t0, t0 + .05), cy = a.y - cw * .65;
      add(g, () => {
        glow(g, a.x, cy, W * (.18 + .3 * k), C.fireHi, .55 * k * out);
        glow(g, a.x, cy, W * (.4 + .35 * k), C.fire, .35 * k * out);
        const n = low ? 4 : 9;
        for (let i = 0; i < n; i++) { const an = R(e, i + 300) * TAU, d = W * .75 * (1 - k) * (.6 + .4 * R(e, i + 320)); glow(g, a.x + Math.cos(an) * d, cy + Math.sin(an) * d * .6, W * .035, C.fireHi, .8 * out) }
        ellipse(a.x, a.y + cw * .08, W * (.85 - .45 * k), r => { g.strokeStyle = `rgba(${C.fire},${.5 * k * out})`; g.lineWidth = W * .035; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke() });
      });
    }
    /* 2 · back layers on the ground: shock ring + scorch mark (the mark stays until the end of the effect, fading last) */
    if (ti > 0) {
      const ring = seg(ti, 0, .5), mark = seg(ti, 0, .12) * (1 - seg(ti, .72, 1)), heat = 1 - seg(ti, .08, .65);
      ellipse(p.x, ground, W * .8, r => {
        const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, `rgba(22,12,8,${.5 * mark})`); gr.addColorStop(.6, `rgba(30,16,10,${.32 * mark})`); gr.addColorStop(1, 'rgba(30,16,10,0)');
        g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill();
      });
      add(g, () => {
        ellipse(p.x, ground, W * .55, r => { const gr = g.createRadialGradient(0, 0, 0, 0, 0, r); gr.addColorStop(0, `rgba(${C.fireHi},${.55 * heat})`); gr.addColorStop(.5, `rgba(${C.fire},${.3 * heat})`); gr.addColorStop(1, `rgba(${C.fire},0)`); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.fill() });
        if (ring < 1) ellipse(p.x, ground, W * (.3 + 1.25 * eo(ring)), r => { g.strokeStyle = `rgba(${C.fireHi},${.75 * (1 - ring)})`; g.lineWidth = W * .05 * (1 - ring) + 1; g.beginPath(); g.arc(0, 0, r, 0, TAU); g.stroke() });
      });
    }
    /* 3 · the painted fireball + impact (existing sheets), remapped to start after the windup */
    if (!far || t >= t0) fireAtlas(g, e, far ? seg(t, t0, 1) : t, p, a, cw);
    /* 4 · trail: embers shed along the flight, each cools (yellow → red), drifts up and fades on its own clock */
    if (far && t > t0) {
      const n = low ? 6 : 14, py = chest(p, cw), ay = a.y - cw * .75;
      add(g, () => {
        for (let i = 0; i < n; i++) {
          const at = t0 + (mySplit - t0) * (.05 + .9 * R(e, i + 400)), age = (t - at) / .26; if (age < 0 || age > 1) continue;
          const f = (at - t0) / (mySplit - t0), x = lerp(a.x, p.x, f) + (R(e, i + 420) - .5) * W * .12, y = lerp(ay, py, f) - age * W * .28 + (R(e, i + 440) - .5) * W * .1;
          glow(g, x, y, W * .05 * (1 - age * .5), age < .45 ? C.fireHi : C.fire, .85 * (1 - age));
        }
      });
    }
    /* 5 · debris embers: thrown up from the impact, fall under gravity, bounce once on the ground, cool and go out */
    if (ti > 0) {
      const n = low ? 5 : 12;
      add(g, () => {
        for (let i = 0; i < n; i++) {
          const life = .55 + .35 * R(e, i + 500), s = ti / life; if (s <= 0 || s >= 1) continue;
          const vx = (R(e, i + 520) - .5) * W * 1.5, vy = W * (.55 + .7 * R(e, i + 540)), gr = W * 2.4, sd = s * 1.15;
          let y = p.y - cw * .15 - vy * sd + .5 * gr * sd * sd; const x = p.x + vx * sd;
          if (y > ground) { y = ground - (y - ground) * .35; if (y > ground) y = ground }   /* one soft bounce, then it lies there */
          const cool = seg(s, .35, 1);
          glow(g, x, y, W * .04 * (1 - s * .4), cool < .5 ? C.fireHi : C.fire, .9 * (1 - seg(s, .6, 1)));
        }
      });
    }
    return true;
  }
  if (root.VfxKit && root.VfxKit.addVariant) root.VfxKit.addVariant('fire', 'layered', 'ไฟ · หลายชั้น (ต้นแบบ)', fireLayered);

  /* Painted spell animation. Fixed 4×2 cells share a feet anchor; never trim frames
     independently, which would make a growing effect jump. Existing explicit VFX
     choices still win. A missing/loading sheet returns false to BattleVFX's old art. */
  const SPELLS = {
    ice: { size: 2.7, flight: true }, lightning: { size: 3.1 },
    water: { size: 2.7, flight: true }, wind: { size: 2.7, flight: true },
    earth: { size: 2.8 }, dark: { size: 2.6, flight: true },
    heal: { size: 2.7 }, shield: { size: 2.6 }
  }, spellImages = {};
  function spellImage(kind) {
    if (!spellImages[kind] && typeof Image !== 'undefined') {
      const im = new Image(); im.decoding = 'async';
      im.src = artURL('assets/fx/anim/' + kind + '-cast.webp');
      spellImages[kind] = im;
    }
    const im = spellImages[kind]; return im && im.complete && im.naturalWidth > 0 && im.naturalHeight > 0 ? im : null;
  }
  /* Per-effect deterministic particles: birth, drift and decay use the same
     normalized battle clock, including hit stop and battle-speed changes. */
  // All motion is sampled from the battle clock. Each particle keeps its own
  // birth, lifetime and trajectory across hit stop, replay and camera changes.
  const LIGHT = {
    fire:[C.fire,'ember','burst',1], ice:[C.ice,'snowflake','burst',.72],
    lightning:[C.bolt,'sparkle','burst',1], wind:[C.wind,'leaf','orbit',.45],
    water:[C.water,'splash','burst',.62], earth:[C.earth,'dust','burst',.36],
    dark:[C.dark,'mote','orbit',.61], heal:[C.heal,'heal','rise',.65],
    shield:[C.gold,'sparkle','rise',.66], holy:[C.holy,'sparkle','rise',.78],
    arcane:[C.arcane,'mote','orbit',.69], sword:[C.steel,'sparkle','burst',.48],
    knife:[C.steel,'sparkle','burst',.4], blunt:[C.earth,'dust','burst',.38],
    spear:[C.steel,'sparkle','burst',.42], rapier:[C.steel,'sparkle','burst',.4],
    arrow:[C.steel,'sparkle','burst',.32], parry:[C.gold,'sparkle','burst',.72],
    impact:[C.gold,'sparkle','burst',.68], death:[C.steel,'mote','rise',.37]
  };

  function groundLight(g, x, y, radius, color, alpha) {
    g.save();
    g.globalCompositeOperation = 'screen';
    g.translate(x, y);
    g.scale(1, .36);
    glow(g, 0, 0, radius, color, alpha);
    g.restore();
  }

  function paintedLight(kind, g, e, k, p, W, front) {
    if (k <= 0 || k >= 1) return;
    const [baseColor, art, motion, power] = LIGHT[kind];
    const color = kind === 'heal' && /^#[ef]/i.test(e.color || '') ? C.gold : baseColor;
    const low = root.BattlePolish?.quality === 'low';
    const rise = motion === 'rise', orbit = motion === 'orbit';
    const flash = seg(k, 0, .09) * Math.pow(1 - k, rise ? 1.1 : 2.8);
    if (!front) {
      groundLight(g, p.x, p.y, W * (1.1 + k * .75), color, flash * power * .82);
      add(g, () => glow(g, p.x, p.y - W * .44, W * (.65 + k * .42), color, flash * power * .4));
    }
    const count = low ? 3 : kind === 'fire' ? 17 : 10;
    const dusty = art === 'dust' || art === 'leaf';
    g.save();
    g.lineCap = 'round';
    for (let i = 0; i < count; i++) {
      const n = front ? i + 101 : i;
      const birth = R(e, n + 170) * (rise ? .47 : .2);
      const life = .35 + R(e, n + 240) * .52;
      const age = (k - birth) / life;
      if (age <= 0 || age >= 1) continue;
      const angle = R(e, n + 210) * Math.PI + (front ? 0 : Math.PI);
      const speed = .6 + R(e, n + 260) * 1.15;
      const lift = .55 + R(e, n + 285) * 1.15;
      const at = age => {
        const direction = angle + (orbit ? age * 3.2 : 0);
        const travel = W * speed * (rise ? .23 + age * .22 : .11 + age);
        return [
          p.x + Math.cos(direction) * travel,
          p.y + Math.sin(direction) * travel * .32 - W *
            (rise ? .07 + lift * age : .27 + lift * age - (orbit ? .15 : 1.1) * age * age)
        ];
      };
      const [x, y] = at(age), [px, py] = at(Math.max(0, age - .075));
      const alpha = seg(age, 0, .12) * (1 - age) * (1 - seg(k, .84, 1)) * (front ? .94 : .54);
      const size = W * (.06 + R(e, n + 310) * .1) * (1 - age * .44);
      if (!dusty) add(g, () => {
        if (!low) glow(g, x, y, size * .85, color, alpha * .78);
        if (rise) return;
        g.strokeStyle = `rgba(${color},${alpha * .85})`;
        g.lineWidth = Math.max(.65, size * .15);
        g.beginPath(); g.moveTo(px, py); g.lineTo(x, y); g.stroke();
      });
      root.BattleVFX?.stamp(g, 'particle/' + art, x, y, dusty ? size * 2.2 : size, {
        alpha, rot: Math.atan2(y - py, x - px), blend: dusty ? 'source-over' : 'lighter'
      });
    }
    g.restore();
  }

  function spellAtlas(kind, g, e, t, p, a, cw) {
    const im = spellImage(kind), spec = SPELLS[kind]; if (!im) return false;
    const rm = !!(e.reducedMotion || root.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    const W = cw * (e.scale || 1), size = W * spec.size;
    let k = t, x = p.x, y = p.y + cw * .06, drawSize = size;
    const far = spec.flight && e.from && a && Math.hypot(a.x - p.x, a.y - p.y) > 4;
    if (far && !rm) {
      const split = .28;
      if (t < split) {
        const f = t / split; x = lerp(a.x, p.x, f);
        y = lerp(a.y - cw * .65, p.y - cw * .65, f);
        drawSize *= .35; k = 0;
      } else k = (t - split) / (1 - split);
    }
    const flying = far && t < .28;
    if (!rm && flying) {
      groundLight(g, x, lerp(a.y, p.y, t / .28), W * .83, LIGHT[kind][0], .27);
      add(g, () => glow(g, x, y, W * .39, LIGHT[kind][0], .3));
    } else if (!rm) paintedLight(kind, g, e, k, p, W, false);
    const alpha = rm ? .65 * (1 - t) : 1 - seg(k, .82, 1);
    if (alpha <= 0) return true;
    g.save();
    try {
      g.globalCompositeOperation = 'source-over';
      g.translate(x, y);
      if (!rm && flying) {
        g.rotate(Math.atan2(p.y - a.y, p.x - a.x));
        g.scale(1.45, .65);
      }
      blendedCell(g, im, 4, 2, rm ? 3/7 : k, drawSize, drawSize, .5, !rm && flying ? .5 : .82, alpha);
    } finally { g.restore(); }
    if (!rm && !flying) paintedLight(kind, g, e, k, p, W, true);
    return true;
  }
  for (const kind of Object.keys(SPELLS)) {
    spellImage(kind);
    root.VfxKit.addVariant(kind, 'painted8', 'ภาพวาด 2D + แสงและอนุภาค', (g, e, t, p, a, cw) => spellAtlas(kind, g, e, t, p, a, cw));
  }

  function floorImpact(kind, g, hit, p, W) {
    if (hit <= 0 || hit >= 1) return;
    const color = LIGHT[kind][0];
    const envelope = seg(hit, 0, .055) * (1 - hit) ** 2;
    const radius = W * (.22 + eo(hit) * (kind === 'water' || kind === 'blunt' ? 1.6 : 1.12));
    add(g, () => {
      glow(g, p.x, p.y - W * .12, W * .54, color, envelope * .64);
      ring(g, p.x, p.y, radius, radius * .38, W * .019, color, envelope * .57);
      if (kind === 'water') ring(g, p.x, p.y, radius * .72, radius * .26, W * .013, color, envelope * .42);
    });
  }

  function aftermath(kind, g, e, hit, p, W) {
    if (hit <= .34 || hit >= 1) return;
    const low = root.BattlePolish?.quality === 'low';
    if (kind === 'lightning') {
      add(g, () => {
        for (let i = 0; i < (low ? 2 : 4); i++) {
          const k = seg(hit, .39 + i * .12, .51 + i * .14);
          if (!k || k === 1) continue;
          const dir = i % 2 ? -1 : 1, x = p.x + dir * W * (.15 + R(e, i + 711) * .42);
          const y = p.y - W * (.09 + R(e, i + 720) * .44);
          bolt(g, e, x, y, x + dir * W * .35, y - W * .15, W * .12, 730 + i * 3,
            W * .012, C.boltHi, bell(k) * .63);
        }
      });
      return;
    }
    const residue = { fire: 'smoke', earth: 'dust', blunt: 'dust', ice: 'mist', water: 'splash', wind: 'leaf', dark: 'mote' }[kind];
    if (!residue) return;
    for (let i = 0; i < (low ? 2 : 5); i++) {
      const k = seg(hit, .35 + .05 * i, .78 + .052 * i);
      if (!k || k === 1) continue;
      const drift = (R(e, i + 771) - .5) * W * (.55 + k * .65);
      const rise = W * (kind === 'fire' ? .68 : .28) * eo(k);
      root.BattleVFX?.stamp?.(g, 'particle/' + residue, p.x + drift, p.y - W * .12 - rise,
        W * (.17 + k * (kind === 'fire' ? .53 : .28)), {
          alpha: bell(k) * .54, rot: drift / W, blend: 'source-over'
        });
    }
  }

  const DRAWN = {
    lightning: { size: 3.7, anchor: .941, cuts: [0, .08, .16, .24, .33, .45, .58, .72, .88], contact: .24 },
    ice: { size: 2.85, anchor: .815, cuts: [0, .09, .18, .29, .44, .58, .72, .86, 1], contact: .29 }
  };

  function drawnImpact(kind, im, g, e, t, p, a, cw) {
    const extended = sequenceReady(kind, true);
    if (!extended && (!im.complete || !im.naturalWidth || !im.naturalHeight)) return spellAtlas(kind, g, e, t, p, a, cw);
    const spec = DRAWN[kind], W = cw * (e.scale || 1), size = W * spec.size;
    const still = e.reducedMotion || root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const low = root.BattlePolish?.quality === 'low';
    const color = LIGHT[kind][0], thunder = kind === 'lightning';
    const distant = !thunder && !still && e.from && Math.hypot(a.x - p.x, a.y - p.y) > 4;
    const k = distant ? fly(g, e, t, a, p, cw, .24, color, C.iceHi, W * .24) : t;
    if (k < 0) return true;
    const hit = seg(k, spec.contact, 1);
    if (!still && hit > 0) {
      paintedLight(kind, g, e, hit, p, W, false);
      add(g, () => {
        const count = low ? 1 : 3;
        for (let i = 0; i < count; i++) {
          const wave = seg(hit, i * .055, .68 + i * .1);
          const radius = W * (.24 + (1.28 + i * .24) * eo(wave));
          ring(g, p.x, p.y, radius, radius * .38, W * .018, color,
            seg(wave, 0, .08) * (1 - wave) ** 2 * (.76 - i * .14));
        }
      });
    }
    if (extended && k < 1) {
      const frame = still ? 6 : phaseFrame(k, spec.contact, 5);
      sequenceFrame(g, kind, frame, p.x, p.y, size, still ? .65 * (1 - t) : 1 - seg(k, .75, .94), 0, spec.anchor);
    } else if (!extended) {
      const cell = still ? 4 : spec.cuts.findIndex(end => k < end) - 1;
      if (cell >= 0 && k < 1) {
        const w = im.naturalWidth / 4, h = im.naturalHeight / 2;
        g.save();
        g.globalCompositeOperation = 'screen';
        g.globalAlpha *= still ? .65 * (1 - t) : 1 - seg(k, spec.cuts[7], spec.cuts[8]);
        g.drawImage(im, (cell % 4) * w, Math.floor(cell / 4) * h, w, h,
          p.x - size * .5, p.y - size * spec.anchor, size, size);
        g.restore();
      }
    }
    if (!still && thunder && k >= .18 && k < .58) {
      const strength = bell(seg(k, .18, .58)) * .57, top = p.y - size * .86;
      add(g, () => {
        const points = bolt(g, e, p.x - size * .13, top, p.x, p.y, W * .35, 470, W * .026, color, strength);
        if (low || !points.length) return;
        for (const i of [3, 5]) {
          const [x, y] = points[i], dir = i === 3 ? -1 : 1;
          bolt(g, e, x, y, x + W * .32 * dir, y + W * .38, W * .12, 480 + i, W * .012, color, strength * .52);
        }
      });
    }
    if (!still && hit > 0) {
      paintedLight(kind, g, e, hit, p, W, true);
      aftermath(kind, g, e, hit, p, W);
    }
    return true;
  }

  const drawnImages = {};
  if (typeof Image !== 'undefined') for (const kind of Object.keys(DRAWN)) {
    const im = new Image();
    im.decoding = 'async';
    drawnImages[kind] = im;
    const path = 'assets/fx/anim/' + kind + '-drawn.webp';
    im.src = artURL(path);
    addVariant(kind, 'drawnImpact', 'ภาพวาด 12 เฟรม + แสงปะทะ',
      (g, e, t, p, a, cw) => drawnImpact(kind, im, g, e, t, p, a, cw));
  }

  // Each atlas row is an independently illustrated four-pose sequence.
  const SEQUENCE_GROUPS = {
    blade: ['sword', 'knife', 'blunt', 'spear'],
    weapon: ['rapier', 'arrow', 'parry', 'arcane'],
    holy: ['holy', 'death', 'burn', 'poison'],
    status: ['sleep', 'freeze', 'shock', 'weak'],
    hit: ['light', 'heavy', 'critical', 'finisher'],
    bind: ['silence', 'bind'],
    elements: ['wind', 'water', 'earth', 'dark'],
    support: ['heal', 'healGold', 'shield', 'fire']
  };
  const sequences = {}, expanded = {};
  const liveImage = im => !!(im?.complete && im.naturalWidth && im.naturalHeight);
  function loadSequenceImage(path) {
    const im = new Image();
    im.decoding = 'async';
    im.src = artURL(path);
    return im;
  }
  if (typeof Image !== 'undefined') for (const [group, kinds] of Object.entries(SEQUENCE_GROUPS)) {
    const extension = group === 'elements' || group === 'support' ? '.png' : '.webp';
    const im = loadSequenceImage('assets/fx/anim/sequence-' + group + extension);
    const more = loadSequenceImage('assets/fx/anim/twelve-' + group + '.webp');
    kinds.forEach((kind, row) => {
      sequences[kind] = { im, row, rows: kinds.length, columns: 4 };
      expanded[kind] = { im: more, row, rows: kinds.length, columns: 12 };
    });
  }
  if (typeof Image !== 'undefined') {
    const water = loadSequenceImage('assets/fx/anim/twelve-water.webp');
    expanded.water = { im: water, row: 0, rows: 1, columns: 12 };
    const im = loadSequenceImage('assets/fx/anim/twelve-strike.webp');
    ['lightning', 'ice'].forEach((kind, row) => { expanded[kind] = { im, row, rows: 2, columns: 12 }; });
  }

  function sequenceReady(kind, requireExpanded = false) {
    return liveImage(expanded[kind]?.im) || (!requireExpanded && liveImage(sequences[kind]?.im));
  }
  const sequenceLength = kind => sequenceReady(kind, true) ? 12 : 4;
  const phaseFrame = (t, contact, anticipation) => t < contact
    ? Math.min(anticipation - 1, Math.floor(t / contact * anticipation))
    : Math.min(11, anticipation + Math.floor(seg(t, contact, 1) * (12 - anticipation)));

  function sequenceFrame(g, kind, cell, x, y, size, alpha, angle = 0, anchor = .5) {
    if (!sequenceReady(kind)) return false;
    const { im, row, rows, columns } = sequenceReady(kind, true) ? expanded[kind] : sequences[kind];
    const w = im.naturalWidth / columns, h = im.naturalHeight / rows;
    g.save();
    g.translate(x, y);
    if (angle) {
      g.rotate(angle);
      if (Math.cos(angle) < 0) g.scale(1, -1);
    }
    g.globalCompositeOperation = 'screen';
    g.globalAlpha *= clamp(alpha);
    g.drawImage(im, cell * w, row * h, w, h, -size * .5, -size * anchor, size, size);
    g.restore();
    return true;
  }
  root.VfxKit.sequenceFrame = sequenceFrame;
  root.VfxKit.sequenceLength = sequenceLength;

  const ACTION_SEQUENCES = {
    sword: 2.1, knife: 1.8, blunt: 2.3, spear: 1.9, rapier: 1.8,
    arrow: 1.45, parry: 1.7, arcane: 1.95, holy: 2.45, death: 2.2, impact: 1.45,
    wind: 2.45, water: 2.65, earth: 2.55, dark: 2.45, heal: 2.5, shield: 2.5, fire: 2.65
  };
  const IMPACT_SIZE = { light: .8, heavy: 1, critical: 1.12, finisher: 1.28 };

  const GROUND_ANCHOR = {
    blunt: .64, holy: .76, death: .76, wind: .88, water: .88, earth: .88, dark: .87,
    heal: .84, shield: .78, fire: .78
  };
  const SPELL_TRAVEL = { wind: .28, water: .28, dark: .28, fire: .42 };
  const sequenceArt = (kind, e) => kind === 'impact' ? (IMPACT_SIZE[e.tier] ? e.tier : 'light')
    : kind === 'heal' && /^#[ef]/i.test(e.color || '') ? 'healGold' : kind;
  function paintedState(e, variant) {
    const kind = nameOf(e.kind);
    const art = variant === 'drawnSequence' ? sequenceArt(kind, e) : kind;
    const im = variant === 'drawnSequence' || variant === 'drawnImpact' ? expanded[art]?.im : null;
    if (!im) return null;
    if (!im.complete) return 'loading';
    return im.naturalWidth && im.naturalHeight ? 'ready' : 'missing';
  }
  root.VfxKit.paintedState = paintedState;

  function actionSequence(kind, g, e, t, p, a, cw) {
    const battle = root.BattleVFX;
    const art = sequenceArt(kind, e);
    const fallback = kind === 'impact' ? { ...e, kind: 'impactCore' } : e;
    if (kind === 'impact' && !battle?.impactEnabled()) return false;
    if (!sequenceReady(art)) {
      if (kind === 'fire' && fireAtlas(g, e, t, p, a, cw)) return true;
      if (SPELLS[kind] && spellAtlas(kind, g, e, t, p, a, cw)) return true;
      return battle?.drawOld(fallback, t, p, a, g, { w: cw }) || false;
    }
    if (t >= 1) return true;
    const W = cw * (e.scale || 1), size = W * ACTION_SEQUENCES[kind] * (IMPACT_SIZE[art] || 1);
    const still = e.reducedMotion || root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const startY = a.y - cw * .75, targetY = chest(p, cw);
    const direction = Math.atan2(targetY - startY, p.x - a.x);
    const travel = !still && e.from && Math.hypot(p.x - a.x, p.y - a.y) > 4;
    const flightSplit = travel ? SPELL_TRAVEL[kind] : 0;
    if (flightSplit && t < flightSplit) {
      const f = t / flightSplit, x = lerp(a.x, p.x, f), y = lerp(startY, targetY, f);
      groundLight(g, x, lerp(a.y, p.y, f), W * .86, LIGHT[kind][0], .31);
      if (kind === 'fire' && animSheet('ball')) {
        g.save();
        g.translate(x, y);
        g.rotate(direction);
        animPlay(g, 'ball', f * 1.6, W * .96, 1, true);
        g.restore();
      } else {
        fly(g, e, t, a, p, cw, flightSplit, LIGHT[kind][0], C.white, W * .27);
      }
      return true;
    }
    const expandedArt = sequenceLength(art) === 12;
    const split = travel ? ({ arrow: .72, arcane: .36 }[kind] || 0) : 0;
    if (t < split) {
      const k = t / split, x = lerp(a.x, p.x, k);
      groundLight(g, x, lerp(a.y, p.y, k), W * .7, LIGHT[kind][0], .27);
      return sequenceFrame(g, art, expandedArt ? Math.min(3, Math.floor(k * 4)) : Math.min(1, Math.floor(k * 2)), x,
        lerp(startY, targetY, k), size * .72, 1, direction);
    }
    const k = seg(t, flightSplit || split, 1);
    const groundAnchor = GROUND_ANCHOR[kind];
    const aimed = ['sword', 'knife', 'spear', 'rapier', 'arrow'].includes(kind);
    const contact = split ? 0 : .23;
    const frame = expandedArt ? (still ? 4 : phaseFrame(k, contact, 4))
      : still ? 1 : split ? (k < .38 ? 2 : 3) : k < .13 ? 0 : k < .32 ? 1 : k < .58 ? 2 : 3;
    const strength = still ? .65 * (1 - t) : 1 - seg(k, .7, 1);
    const hit = seg(k, expandedArt ? contact : split ? 0 : .13, 1);
    if (!still) {
      paintedLight(kind, g, e, hit, p, W, false);
      floorImpact(kind, g, hit, p, W);
    }
    sequenceFrame(g, art, frame, p.x, groundAnchor ? p.y : targetY,
      size, strength, aimed ? direction : 0, groundAnchor || .5);
    if (!still) {
      paintedLight(kind, g, e, hit, p, W, true);
      aftermath(kind, g, e, hit, p, W);
    }
    return true;
  }
  for (const kind of Object.keys(ACTION_SEQUENCES)) {
    addVariant(kind, 'drawnSequence', 'ภาพวาด 12 เฟรม + แสงและอนุภาค',
      (g, e, t, p, a, cw) => actionSequence(kind, g, e, t, p, a, cw));
  }

  // Effects with a single illustrated stamp still move continuously through
  // BattleVFX's existing transform curves. The same light is used in preview.
  const STAMP_TIMING = { arrow: .88, spear: .42, rapier: .24, arcane: .62 };
  for (const kind of Object.keys(LIGHT)) {
    if (EXTRA[kind]?.atlas || EXTRA[kind]?.painted8) continue;
    addVariant(kind, 'paintedLight', 'ภาพวาด 2D + แสงและอนุภาค', (g, e, t, p, a, cw) => {
      const battle = root.BattleVFX;
      if (!battle || (kind === 'impact' && !battle.impactEnabled())) return false;
      const still = e.reducedMotion || root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const W = cw * (e.scale || 1);
      const distant = e.from && Math.hypot(p.x - a.x, p.y - a.y) >= 4;
      const delay = distant ? STAMP_TIMING[kind] || 0 : 0;
      const k = seg(t, delay, 1);
      if (!still) {
        if (delay && t < delay) {
          const f = t / delay;
          groundLight(g, lerp(a.x, p.x, f), lerp(a.y, p.y, f), W * .65, LIGHT[kind][0], .21 * bell(f));
        } else paintedLight(kind, g, e, k, p, W, false);
      }
      const effect = kind === 'impact' ? { ...e, kind: 'impactCore' } : e;
      const ok = battle.drawOld(effect, t, p, a, g, { w: cw });
      if (ok && !still) paintedLight(kind, g, e, k, p, W, true);
      return ok;
    });
  }

})(globalThis);
