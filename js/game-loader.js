/* v98.1110 · StdLoader — builds THE standard loading screen (css/game-loader.css) for every "preparing…" cover.
   StdLoader.make({title, step, absolute, id, progress}) → element (not yet in the page; append it yourself)
   StdLoader.progress(el, 0–1 | null) → set the bar (null = the sliding "working" bar) · StdLoader.step(el, text) → the small line under the bar
   StdLoader.hide(el) → fade out and remove · StdLoader.TIPS → the tip lines (also used by the main loading screen) */
(function (root) {
  'use strict';
  if (root.StdLoader) return;
  const TIPS = ['โจมตีจากด้านหลังศัตรูแรงกว่าด้านหน้า', 'ยืนบนที่สูงช่วยให้ตีแรงขึ้นและหลบได้ดีขึ้น', 'กด "รอ" แทนการเดินจะได้ CT คืนบางส่วน', 'อุปกรณ์ที่ดีต้องใช้วัตถุดิบจากพื้นที่ที่ยากขึ้น', 'นอนที่บ้านเพื่อฟื้นแรงและชีวิตเต็ม', 'ล็อกเป้าแล้วดูหน้าต่างทำนายผลก่อนโจมตี'];
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MIP = '<div class="mip-track" aria-hidden="true"><div class="mip-go"><div class="mip-flip"><div class="mip-run"><i></i></div><div class="mip-idle"><i></i></div></div></div></div>';
  function css() {   /* pages that did not link the stylesheets get them here */
    for (const h of ['css/mip-loader.css?v=v98.1035', 'css/game-loader.css?v=v98.1110']) { const name = h.split('/')[1].split('?')[0]; if ([...document.styleSheets].some(s => (s.href || '').includes(name)) || document.querySelector('link[href*="' + name + '"]')) continue; const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = h; (document.head || document.documentElement).appendChild(l) }
  }
  function make(o = {}) {
    css(); const el = document.createElement('div'); el.className = 'gl-std' + (o.absolute ? ' gl-abs' : ''); if (o.id) el.id = o.id; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
    el.innerHTML = '<div class="gl-box"><span class="gl-kicker">LOADING</span><h2 class="gl-title">' + esc(o.title || 'กำลังโหลด') + '</h2>' + MIP + '<div class="gl-bar ind"><i></i></div><div class="gl-meta"><span class="gl-step">' + esc(o.step || '') + '</span></div>'
      + '<p class="gl-tip"><img class="gl-note-icon" src="assets/icons/menu/v2-help.webp" width="40" height="40" alt=""><span class="gl-note-text">' + esc(TIPS[Math.floor(Math.random() * TIPS.length)]) + '</span></p><button type="button" class="gl-retry" hidden>ลองโหลดใหม่</button></div>';
    if (o.progress != null) progress(el, o.progress); return el;
  }
  function progress(el, f) { const b = el?.querySelector('.gl-bar'); if (!b) return; if (f == null) { b.classList.add('ind'); b.querySelector('i').style.width = ''; return } b.classList.remove('ind'); b.querySelector('i').style.width = Math.round(Math.max(0, Math.min(1, f)) * 100) + '%' }
  function step(el, text) { const s = el?.querySelector('.gl-step'); if (s) s.textContent = text || '' }
  function hide(el, ms = 380) { if (!el) return; el.classList.add('gl-out'); setTimeout(() => el.remove(), ms) }
  root.StdLoader = { make, progress, step, hide, TIPS };
})(globalThis);
