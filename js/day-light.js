/* v98.473 · DAY / NIGHT LIGHT for the village map.
   One light map per frame, laid over the scene with `multiply`:
     • ambient colour follows the clock (WorldState minutes): soft peach morning → plain day → golden evening → violet dusk → purple moonlight at night
     • light sources (street lamps …) are added while the scene is drawn (DayLight.add) and painted into the light map as SOFT pools:
       a wide ellipse on the ground (isometric, flattened) + a small halo round the flame, both with a smooth bell-shaped fall-off
       (many gradient stops), a gentle flicker, and a faint warm bloom added on top — no hard-edged geometric circles.
   Preview any time: ?tod=1260 (minutes after midnight) in the URL, or DayLight.preview(1260) / DayLight.preview(null) in the console. */
(function (root) {
  'use strict';
  const KEYS = [   /* minute, ambient rgb, darkness 0..1 (how strongly the ambient multiplies the scene), lamps 0..1 */
    [0, [70, 58, 142], .74, 1],
    [270, [70, 58, 142], .74, 1],
    [345, [190, 150, 190], .40, .7],    /* first light: lilac */
    [420, [255, 206, 178], .20, .15],   /* morning: soft peach */
    [540, [255, 236, 214], .07, 0],
    [660, [255, 255, 255], 0, 0],       /* day */
    [930, [255, 255, 255], 0, 0],
    [1020, [255, 196, 128], .20, 0],    /* evening: golden */
    [1110, [214, 128, 120], .36, .45],  /* sunset */
    [1170, [128, 92, 160], .52, .9],    /* dusk: violet */
    [1230, [70, 58, 142], .74, 1],      /* night: purple moonlight */
    [1440, [70, 58, 142], .74, 1]
  ];
  const lerp = (a, b, k) => a + (b - a) * k, ease = k => k * k * (3 - 2 * k);
  let lights = [], lm = null, lg = null, previewMin = null;
  try { const q = new URLSearchParams(location.search).get('tod'); if (q != null && q !== '') previewMin = ((+q % 1440) + 1440) % 1440 } catch (e) { }
  function minutes() { if (previewMin != null) return previewMin; try { const n = root.WorldState?.now?.(); if (n && isFinite(n.minutes)) return ((n.minutes % 1440) + 1440) % 1440 } catch (e) { } return 600 }
  function state(m = minutes()) {
    let i = 0; while (i < KEYS.length - 2 && m >= KEYS[i + 1][0]) i++;
    const A = KEYS[i], B = KEYS[i + 1], k = ease(Math.max(0, Math.min(1, (m - A[0]) / ((B[0] - A[0]) || 1))));
    return { m, rgb: A[1].map((v, j) => Math.round(lerp(v, B[1][j], k))), dark: lerp(A[2], B[2], k), lamps: lerp(A[3], B[3], k) };
  }
  /* a light source at world position (x, y = the flame), ground = where its pool lies (default: 95 px below the flame) */
  function add(x, y, o = {}) { lights.push({ x, y, gy: o.groundY ?? y + 95, r: o.r || 150, col: o.col || [255, 196, 120], k: o.k ?? 1, seed: o.seed ?? (x * 7.13 + y * 3.7) }) }
  function begin() { lights = [] }
  /* the bell-shaped fall-off: alpha(t) = a·exp(-3.2·t²), written as gradient stops */
  function soft(g, x, y, r, rgb, a, flat) {
    g.save(); g.translate(x, y); if (flat) g.scale(1, flat);
    const gr = g.createRadialGradient(0, 0, 0, 0, 0, r);
    for (let i = 0; i <= 10; i++) { const t = i / 10, v = a * Math.exp(-3.2 * t * t) * (1 - t * t * .15); gr.addColorStop(t, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${i === 10 ? 0 : v.toFixed(4)})`) }
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.fill(); g.restore();
  }
  /* called with the WORLD transform active, after the scene and before the colour grade */
  let T0 = null;
  /* capture() right after the scene (world transform active); render() after the colour grade so the night stays violet (the grade warms everything) */
  function capture(g) { T0 = g.getTransform() }
  function render(g, cv) {
    const S = state(); if (S.dark <= .005) { lights = []; return }
    const W = cv.width, H = cv.height, T = T0 || g.getTransform(), t = performance.now();
    if (!lm) { lm = document.createElement('canvas'); lg = lm.getContext('2d') } if (lm.width !== W || lm.height !== H) { lm.width = W; lm.height = H }
    /* 1. ambient: white blended towards the clock colour by `dark` */
    const amb = S.rgb.map(v => Math.round(255 - (255 - v) * S.dark));
    lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalCompositeOperation = 'source-over'; lg.fillStyle = `rgb(${amb.join(',')})`; lg.fillRect(0, 0, W, H);
    /* moonlight: a little brighter towards the top of the screen at night (the moon is up there) */
    if (S.lamps > .3) { const gr = lg.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, `rgba(190,170,255,${.16 * S.dark})`); gr.addColorStop(1, 'rgba(190,170,255,0)'); lg.globalCompositeOperation = 'lighter'; lg.fillStyle = gr; lg.fillRect(0, 0, W, H) }
    /* 2. lamps: soft warm pools carved into the light map (in world space) */
    if (S.lamps > .01 && lights.length) {
      lg.setTransform(T); lg.globalCompositeOperation = 'lighter';
      for (const L of lights) {
        const fl = .9 + .06 * Math.sin(t * .0031 + L.seed) + .04 * Math.sin(t * .0113 + L.seed * 2.1), a = S.lamps * L.k * fl, c = L.col;
        soft(lg, L.x, L.gy, L.r * 1.3, c, .3 * a, .5);           /* pool on the ground (flattened = isometric) */
        soft(lg, L.x, (L.y + L.gy) / 2, L.r * .75, c, .16 * a, .8); /* the air round the post */
        soft(lg, L.x, L.y, L.r * .22, [255, 226, 180], .28 * a);    /* the flame's halo */
      }
    }
    /* 3. lay it over the scene */
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'multiply'; g.drawImage(lm, 0, 0);
    /* 4. a faint warm bloom on top so the lamps glow instead of only "not being dark" */
    if (S.lamps > .01 && lights.length) { g.setTransform(T); g.globalCompositeOperation = 'screen'; for (const L of lights) { const fl = .9 + .08 * Math.sin(t * .0031 + L.seed); soft(g, L.x, L.y, L.r * .3, [255, 190, 110], .06 * S.lamps * L.k * fl); soft(g, L.x, L.gy, L.r, [255, 170, 90], .035 * S.lamps * L.k * fl, .5) } }
    g.restore(); lights = [];
  }
  root.DayLight = { add, begin, capture, render, count: () => lights.length, state, minutes, preview: m => { previewMin = m == null ? null : ((+m % 1440) + 1440) % 1440 }, active: () => state().dark > .005, lampsOn: () => state().lamps > .01 };
})(globalThis);
