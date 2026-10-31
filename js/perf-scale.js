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
  if (/[?&](edit|battle|perf)=1/.test(location.search)) return;   // ?perf=1 = the speed check: measure at full quality
  try { if (window.parent !== window && /[?&]perf=1/.test(parent.location.search)) return } catch (e) { }
  try { localStorage.removeItem('projectA.renderStep') } catch (e) { }   // old versions remembered a step; forget it
  try { if (localStorage.getItem('projectA.autoRes') === '0') return } catch (e) { }
  const real = window.devicePixelRatio || 1, STEPS = [1, .75, .6, .5];
  let step = 0;
  try { Object.defineProperty(window, 'devicePixelRatio', { configurable: true, get: () => real * STEPS[step] }) } catch (e) { return }
  window.RENDER_STEP = () => step;
  window.RENDER_LOG = [];
  function set(n, why) {
    window.RENDER_LOG.push([Math.round(performance.now()), step, n, why]); step = n;
    window.applyRenderScale?.();
    try { console.info('[ความละเอียดอัตโนมัติ] ขั้น ' + n + ' (' + Math.round(STEPS[n] * 100) + '%) · ' + why) } catch (e) { }
  }
  let last = 0, dts = [], coolUntil = 0, slow = 0, fast = 0, noClimb = [0, 0, 0, 0];
  const reset = () => { dts = []; slow = 0; fast = 0 };
  document.addEventListener('visibilitychange', () => { reset(); coolUntil = performance.now() + 3000 });
  addEventListener('blur', reset); addEventListener('focus', () => { reset(); coolUntil = performance.now() + 3000 });
  function frame(t) {
    requestAnimationFrame(frame);
    const dt = t - last; last = t;
    if (document.hidden || dt <= 0) { reset(); return }
    if (dt > 250) { reset(); return }                                    // a hitch (tab switch, big task): this stretch tells nothing about speed
    const now = performance.now(), drawn = window.__townDrawnAt || 0;
    if (!drawn || now - drawn < 6000 || now < coolUntil) { dts = []; return }   // still opening / just repainted / just changed step
    dts.push(dt); if (dts.length < 45) return;
    const avg = dts.reduce((a, b) => a + b, 0) / dts.length; dts = [];
    if (avg > 48 && step < STEPS.length - 1) {                           // under ~21 fps, twice in a row
      fast = 0; if (++slow >= 2) { slow = 0; noClimb[step] = now + 45000; set(step + 1, 'ช้า ~' + Math.round(1000 / avg) + ' fps'); coolUntil = now + 4000 }
    } else if (avg < 26 && step > 0) {                                   // over ~38 fps, twice in a row
      slow = 0; if (++fast >= 2 && now > noClimb[step - 1]) { fast = 0; set(step - 1, 'เร็ว ~' + Math.round(1000 / avg) + ' fps'); coolUntil = now + 4000 }
    } else { slow = 0; fast = 0 }
  }
  requestAnimationFrame(t => { last = t; requestAnimationFrame(frame) });
})();
