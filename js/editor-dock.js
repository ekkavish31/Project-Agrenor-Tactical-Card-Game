/* v98.289 · village editor layout: one docked frame in the shape of an upside-down U — the toolbar across the top, and the right panel hanging from it (v98.290: the left rail was dropped — title, joystick, status stay floating over the map) — and the map in the middle (nothing floats over the map any more).
   The existing elements are MOVED / restyled (ids and handlers stay): #townTools (top), #assetEdit (right), header + #roadNav + #status . The map stage is inset, its own ResizeObserver refits the canvas.
   ?dock=0 turns it off. */
(function () {
  'use strict';
  const Q = new URLSearchParams(location.search);
  const PLACE = location.pathname.endsWith('village-place.html');
  if (Q.get('edit') !== '1' || !(location.pathname.endsWith('village-town.html') || PLACE) || Q.get('dock') === '0') return;
  const css = document.createElement('style');
  if (PLACE) css.textContent = `:root{--dt:80px;--dr:340px;--dockbg:#1b302af7}
body.edDock #world{position:fixed!important;left:0;top:var(--dt);width:calc(100vw - var(--dr))!important;height:calc(100dvh - var(--dt))!important}
body.edDock #placeTools{left:0!important;right:0!important;top:0!important;transform:none!important;width:auto!important;max-width:none!important;border-radius:0!important;border-width:0 0 1px 0!important;background:var(--dockbg)!important;box-shadow:0 4px 18px #0005!important;z-index:14;justify-content:center}
body.edDock #pbPanel{right:0!important;top:var(--dt)!important;bottom:0!important;max-height:none!important;width:var(--dr)!important;border-radius:0!important;border-width:0 0 0 1px!important;background:var(--dockbg)!important}
body.edDock #hud{top:calc(var(--dt) + 10px)!important}
body.edDock header{z-index:15!important;top:6px!important}
@media(max-width:1250px){body.edDock header{display:none!important}}`;
  else css.textContent = `:root{--dt:80px;--dl:0px;--dr:340px;--dockbg:#1b302af7;--dockline:#b9c48f66}
body.edDock #stage{inset:var(--dt) var(--dr) 0 var(--dl)!important}
body.edDock #townTools{left:0!important;right:0!important;top:0!important;transform:none!important;width:auto!important;max-width:none!important;border-radius:0!important;border-width:0 0 1px 0!important;background:var(--dockbg)!important;box-shadow:0 4px 18px #0005!important;z-index:14;justify-content:center}
body.edDock #assetEdit{right:0!important;top:var(--dt)!important;bottom:0!important;max-height:none!important;width:var(--dr)!important;border-radius:0!important;border-width:0 0 0 1px!important;background:var(--dockbg)!important;z-index:13}
body.edDock header{z-index:15!important;top:10px!important;left:16px!important}
body.edDock header h1{font-size:15px!important;line-height:1.2!important}
body.edDock #roadNav{bottom:14px!important;top:auto!important;left:14px!important}
body.edDock #layoutSync{left:14px!important;bottom:200px!important}
body.edDock #status{left:14px!important;bottom:206px!important;max-width:min(420px,calc(100vw - var(--dr) - 40px))!important}
body.edDock #layoutSync{bottom:14px!important;left:170px!important}
@media(max-width:1250px){body.edDock header{display:none!important}}`;
  document.head.append(css);
  let n = 0;
  const iv = setInterval(() => {
    if (PLACE) { const bar = document.getElementById('placeTools'), pn = document.getElementById('pbPanel'); if ((!bar || !pn) && ++n < 80) return; clearInterval(iv); if (!bar) return; document.body.classList.add('edDock'); const h = Math.round(bar.getBoundingClientRect().height); if (h > 40) document.documentElement.style.setProperty('--dt', h + 'px'); setTimeout(() => dispatchEvent(new Event('resize')), 50); return }
    const hd = document.querySelector('header'), nav = document.getElementById('roadNav'), st = document.getElementById('status'), bar = document.getElementById('townTools'), ae = document.getElementById('assetEdit');
    if ((!hd || !nav || !st || !bar || !ae) && ++n < 80) return;
    clearInterval(iv);
    document.body.classList.add('edDock');
    const h = Math.round(bar.getBoundingClientRect().height); if (h > 40) document.documentElement.style.setProperty('--dt', h + 'px');
  }, 150);
})();
