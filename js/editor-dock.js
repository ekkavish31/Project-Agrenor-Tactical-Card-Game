/* v98.289 · village editor layout: one docked frame in the shape of an upside-down U — the toolbar across the top, a left rail and the right panel hanging from it — and the map in the middle (nothing floats over the map any more).
   The existing elements are MOVED / restyled (ids and handlers stay): #townTools (top), #assetEdit (right), header + #roadNav + #status (left rail, #edLeft). The map stage is inset, its own ResizeObserver refits the canvas.
   ?dock=0 turns it off. */
(function () {
  'use strict';
  const Q = new URLSearchParams(location.search);
  if (Q.get('edit') !== '1' || !location.pathname.endsWith('village-town.html') || Q.get('dock') === '0') return;
  const css = document.createElement('style');
  css.textContent = `:root{--dt:80px;--dl:176px;--dr:340px;--dockbg:#1b302af7;--dockline:#b9c48f66}
body.edDock #stage{inset:var(--dt) var(--dr) 0 var(--dl)!important}
body.edDock #townTools{left:0!important;right:0!important;top:0!important;transform:none!important;width:auto!important;max-width:none!important;border-radius:0!important;border-width:0 0 1px 0!important;background:var(--dockbg)!important;box-shadow:0 4px 18px #0005!important;z-index:14;justify-content:center}
body.edDock #assetEdit{right:0!important;top:var(--dt)!important;bottom:0!important;max-height:none!important;width:var(--dr)!important;border-radius:0!important;border-width:0 0 0 1px!important;background:var(--dockbg)!important;z-index:13}
#edLeft{position:fixed;left:0;top:var(--dt);bottom:0;width:var(--dl);z-index:13;display:flex;flex-direction:column;gap:10px;align-items:center;padding:12px 8px;background:var(--dockbg);border-right:1px solid var(--dockline);box-sizing:border-box;overflow:auto}
#edLeft header{position:static!important;width:100%;margin:0;padding:0 2px 8px;border-bottom:1px solid var(--dockline)}
#edLeft header *{max-width:100%}
#edLeft header h1{font-size:15px!important;line-height:1.25!important}
#edLeft #roadNav{position:static!important;margin:0!important}
#edLeft #layoutSync{position:static!important;margin:0!important;align-self:flex-start}
#edLeft #status{position:static!important;max-width:100%!important;width:100%;box-sizing:border-box;margin-top:auto;pointer-events:auto}`;
  document.head.append(css);
  let n = 0;
  const iv = setInterval(() => {
    const hd = document.querySelector('header'), nav = document.getElementById('roadNav'), st = document.getElementById('status'), bar = document.getElementById('townTools'), ae = document.getElementById('assetEdit');
    if ((!hd || !nav || !st || !bar || !ae) && ++n < 80) return;
    clearInterval(iv);
    const left = document.createElement('div'); left.id = 'edLeft';
    for (const e of [hd, nav, st]) if (e) left.append(e);
    document.body.append(left); document.body.classList.add('edDock');
    let m = 0; const iv2 = setInterval(() => { const p = document.getElementById('layoutSync'); if (p && p.parentNode !== left) { left.insertBefore(p, st); clearInterval(iv2) } if (++m > 60) clearInterval(iv2) }, 250);
    const h = Math.round(bar.getBoundingClientRect().height); if (h > 40) document.documentElement.style.setProperty('--dt', h + 'px');
  }, 150);
})();
