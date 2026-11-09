/* v98.20 · automatic render resolution for the village (a safety net for slow machines — a machine that holds ~20+ fps never changes anything).
   The village canvas is full-screen and drawn through several full-screen blend passes every frame. If frames stay clearly slow (under ~21 fps) for several
   seconds in a row, the canvas is drawn at a lower resolution (1 → .75 → .6 → .5 of the screen's pixel ratio) and the browser scales it up; when frames are
   comfortably fast again (over ~38 fps) it climbs back, one step at a time.
   v98.20 fixes (v98.13 lowered the picture on a fast PC): nothing is measured while the village is still opening or has just been repainted (first 6 s),
   a window that contains a hitch (one frame over 250 ms: tab switch, big task) is thrown away, two slow windows in a row are needed to drop,
   the step is NOT remembered between visits any more, and climbing back is quick.
   The editor (?edit=1), the embedded battle page and the speed check (?perf=1) keep full quality.
   Turn it off:  localStorage.setItem('projectA.autoRes','0')   ·  see what it did:  RENDER_LOG  (in the browser console) */
(function () {
  'use strict';
  if (/[?&](edit|perf)=1/.test(location.search)) return;   // ?perf=1 = the speed check: measure at full quality
  const BATTLE = /[?&]battle=1/.test(location.search);   // the embedded battle: the start step below, then it may only go DOWN (v98.78)
  try { if (window.parent !== window && /[?&]perf=1/.test(parent.location.search)) return } catch (e) { }
  try { localStorage.removeItem('projectA.renderStep') } catch (e) { }   // old versions remembered a step; forget it
  try { if (localStorage.getItem('projectA.autoRes') === '0') return } catch (e) { }
  /* v98.329 · a Retina / 4K screen (ratio 2–3) means 4–9× the pixels of an ordinary one for the same picture: the village drew a 4-million-pixel canvas through several full-screen passes
     (measured: 49 ms a frame at ratio 1, 198 ms at 2, 412 ms at 3) and only stepped down after ~15–25 s of stutter, every visit. Now: a computer draws at most 1.5× per screen pixel and starts at a
     step that keeps the canvas under ~2.6 million pixels (a tablet / phone keeps its own, lower, budget below). Still adaptive both ways afterwards. */
  const coarse0 = (() => { try { return matchMedia('(pointer:coarse)').matches } catch (e) { return false } })();
  const real = coarse0 ? (window.devicePixelRatio || 1) : Math.min(window.devicePixelRatio || 1, 1.5), STEPS = [1, .75, .6, .5, .4];   // v98.78: one more step down for very slow screens
  /* v98.77 · tablets / phones start at a resolution their screen can afford instead of 100 %: a 2× tablet screen means a 4–6 million pixel canvas that is
     redrawn through several full-screen passes every frame (measured: ~4 fps in a headless 1180×820 @2× page). Budget ≈ 1.2 million pixels (v98.78: was 1.8 — the user's tablet still stuttered for the ~25 s the automatic steps took to get there); computers keep 100 % as before. */
  const coarse = (() => { try { return matchMedia('(pointer:coarse)').matches } catch (e) { return false } })();
  const startStep = () => { const budget = coarse ? 1.2e6 : 2.6e6; const px = (innerWidth || screen.width || 1024) * (innerHeight || screen.height || 768); for (let i = 0; i < STEPS.length; i++) if (px * Math.pow(real * STEPS[i], 2) <= budget) return i; return STEPS.length - 1 };
  let step = startStep();
  document.addEventListener('DOMContentLoaded', () => { try { document.documentElement.classList.toggle('perf-lite', step >= 2) } catch (e) { } });
  try { Object.defineProperty(window, 'devicePixelRatio', { configurable: true, get: () => real * STEPS[step] }) } catch (e) { return }
  window.RENDER_STEP = () => step;
  /* v98.77 · at 60 % or lower the decorative HD-2D layers are switched off too (js/hd2d.js: bloom, blurred top/bottom bars, light rays, dust):
     each costs a full-screen blur or an animated layer every frame, which a slow screen cannot spare. They come back when the picture climbs back above 60 %. */
  const lite = () => document.documentElement.classList.toggle('perf-lite', step >= 2);
  try { const st = document.createElement('style'); st.textContent = '.perf-lite .hd2d .tilt,.perf-lite .hd2d i,.perf-lite .hd2d .rays{display:none!important}'; document.head.appendChild(st) } catch (e) { }
  window.RENDER_LOG = [];
  function set(n, why) {
    window.RENDER_LOG.push([Math.round(performance.now()), step, n, why]); step = n;
    lite();
    window.applyRenderScale?.();
    try { console.info('[ความละเอียดอัตโนมัติ] ขั้น ' + n + ' (' + Math.round(STEPS[n] * 100) + '%) · ' + why) } catch (e) { }
  }
  let last = 0, dts = [], coolUntil = 0, slow = 0, fast = 0, noClimb = [0, 0, 0, 0, 0];
  const reset = () => { dts = []; slow = 0; fast = 0 };
  document.addEventListener('visibilitychange', () => { reset(); coolUntil = performance.now() + 3000 });
  addEventListener('blur', reset); addEventListener('focus', () => { reset(); coolUntil = performance.now() + 3000 });
  function frame(t) {
    requestAnimationFrame(frame);
    const dt = t - last; last = t;
    if (document.hidden || dt <= 0) { reset(); return }
    const now = performance.now(), drawn = window.__townDrawnAt || 0;
    if (!drawn || now - drawn < 6000 || now < coolUntil) { dts = []; return }   // still opening / just repainted / just changed step
    /* v98.77 · the MEDIAN of 30 frames, not the average of 45 with a reset on any frame over 250 ms: a single hitch no longer counts (the median ignores it)
       but a machine that is slow on every frame now does (it used to throw all its samples away and never lower the picture) */
    dts.push(Math.min(dt, 1000)); if (dts.length < 30) return;
    const med = dts.slice().sort((a, b) => a - b)[15]; dts = [];
    if (med > 36 && step < STEPS.length - 1) {                           // under ~28 fps (v98.78: the target is 30 fps; was 21)
      fast = 0;
      if (med > 110 || ++slow >= 2) {                                    // under ~9 fps: lower at once · otherwise twice in a row
        const jump = med > 200 ? 2 : 1, to = Math.min(STEPS.length - 1, step + jump); slow = 0; noClimb[step] = now + 45000; set(to, 'ช้า ~' + Math.round(1000 / med) + ' fps'); coolUntil = now + (med > 110 ? 2000 : 4000)
      }
    } else if (med < 22 && step > 0 && !BATTLE) {   // in a fight the picture only ever goes down (no flicker from a step back up)                                   // over ~45 fps, twice in a row (v98.78: was 38 — a gap above the 28 fps floor so it does not bounce)
      slow = 0; if (++fast >= 2 && now > noClimb[step - 1]) { fast = 0; set(step - 1, 'เร็ว ~' + Math.round(1000 / med) + ' fps'); coolUntil = now + 4000 }
    } else { slow = 0; fast = 0 }
  }
  requestAnimationFrame(t => { last = t; requestAnimationFrame(frame) });
})();
