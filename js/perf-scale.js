/* v98.13 · automatic render resolution for the village (docs/UI-BRUSHUP.md is about buttons; this one is about speed).
   The village canvas is full-screen and drawn through several full-screen blend passes every frame. When frames stay slow the canvas is drawn at a
   lower resolution (steps 1 → .75 → .6 → .5 of the screen's own pixel ratio) and the browser scales it up; when frames are fast again it climbs back.
   A fast machine never leaves step 1. The editor (?edit=1) and the embedded battle page keep full quality.
   Turn it off:  localStorage.setItem('projectA.autoRes','0')  ·  the last step is remembered so the next visit starts at a speed that worked. */
(function () {
  'use strict';
  if (/[?&](edit|battle)=1/.test(location.search)) return;
  try { if (localStorage.getItem('projectA.autoRes') === '0') return } catch (e) { }
  const real = window.devicePixelRatio || 1, STEPS = [1, .75, .6, .5], KEY = 'projectA.renderStep';
  let step = 0; try { step = Math.max(0, Math.min(STEPS.length - 1, +localStorage.getItem(KEY) || 0)) } catch (e) { }
  try { Object.defineProperty(window, 'devicePixelRatio', { configurable: true, get: () => real * STEPS[step] }) } catch (e) { return }
  window.RENDER_STEP = () => step;
  function set(n) { step = n; try { localStorage.setItem(KEY, step) } catch (e) { } window.applyRenderScale?.() }
  let last = 0, dts = [], coolUntil = 0, noClimb = [0, 0, 0, 0];
  function frame(t) {
    requestAnimationFrame(frame);
    const dt = t - last; last = t;
    if (document.hidden || dt <= 0 || dt > 500) { dts = []; return }          // tab in the background / a long start-up task: not a speed sample
    dts.push(dt); if (dts.length < 36) return;
    const avg = dts.reduce((a, b) => a + b, 0) / dts.length; dts = [];
    const now = performance.now(); if (now < coolUntil || now < 4000) return;
    if (avg > 42 && step < STEPS.length - 1) { noClimb[step] = now + 90000; set(step + 1); coolUntil = now + 2500 }        // under ~24 fps: drop a step
    else if (avg < 21 && step > 0 && now > noClimb[step - 1]) { set(step - 1); coolUntil = now + 6000 }                     // over ~47 fps for a while: climb back
  }
  requestAnimationFrame(t => { last = t; requestAnimationFrame(frame) });
})();
