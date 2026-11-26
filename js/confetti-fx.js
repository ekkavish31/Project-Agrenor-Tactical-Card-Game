/* v98.1100 · ConfettiFX — the "new card" celebration: a soft glowing AURA behind the card + paper confetti drifting down (replaces the old striped sun-ray fan).
   ConfettiFX.html(n)  → markup for n confetti pieces (put it inside a position:absolute / fixed overlay; the pieces are pointer-events:none)
   The aura itself is the CSS class .cfx-aura (a pulsing radial glow). Reduced motion: no falling, only the still aura. */
(function (root) {
  'use strict';
  if (root.ConfettiFX) return;
  const COLORS = ['#ffd45e', '#ff7a6b', '#6fd3ff', '#9be37a', '#ffb3e6', '#fff1b8', '#c39bff', '#ff9f4a'];
  const css = `
.cfx-aura{position:absolute;left:50%;top:44%;width:min(120vmin,1100px);height:min(120vmin,1100px);margin:calc(min(120vmin,1100px)/-2) 0 0 calc(min(120vmin,1100px)/-2);border-radius:50%;pointer-events:none;
 background:radial-gradient(closest-side,#fff4c8c0 0,#ffdf8a88 22%,#ffc45a44 46%,#ff9f2a14 68%,#ff9f2a00 100%);mix-blend-mode:screen;animation:cfxPulse 3.4s ease-in-out infinite}
@keyframes cfxPulse{0%,100%{opacity:.78;transform:scale(.94)}50%{opacity:1;transform:scale(1.06)}}
.cfx-wrap{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.cfx-wrap i{position:absolute;top:-4vh;left:var(--x);width:var(--w);height:var(--h);background:var(--c);border-radius:1.5px;opacity:0;box-shadow:inset 0 0 0 1px #ffffff40;animation:cfxFall var(--d) var(--t) linear infinite}
@keyframes cfxFall{0%{opacity:0;transform:translate3d(0,0,0) rotate(var(--r0)) rotateX(0)}6%{opacity:1}50%{transform:translate3d(calc(var(--s) * -1),55vh,0) rotate(calc(var(--r0) + 220deg)) rotateX(180deg)}94%{opacity:1}100%{opacity:0;transform:translate3d(var(--s),112vh,0) rotate(calc(var(--r0) + 460deg)) rotateX(360deg)}}
@media(prefers-reduced-motion:reduce){.cfx-wrap{display:none}.cfx-aura{animation:none}}`;
  function inject() { if (document.getElementById('cfxCss')) return; const s = document.createElement('style'); s.id = 'cfxCss'; s.textContent = css; (document.head || document.documentElement).appendChild(s) }
  function html(n = 44) {
    inject(); let out = '';
    for (let i = 0; i < n; i++) {
      const w = 6 + Math.random() * 7, h = w * (1.4 + Math.random() * 1.2);
      out += `<i style="--x:${(Math.random() * 100).toFixed(1)}%;--w:${w.toFixed(1)}px;--h:${h.toFixed(1)}px;--c:${COLORS[i % COLORS.length]};--d:${(5 + Math.random() * 4).toFixed(2)}s;--t:${(-Math.random() * 9).toFixed(2)}s;--s:${Math.round(20 + Math.random() * 70)}px;--r0:${Math.round(Math.random() * 360)}deg"></i>`;
    }
    return `<div class="cfx-wrap" aria-hidden="true">${out}</div>`;
  }
  root.ConfettiFX = { html, inject };
})(globalThis);
