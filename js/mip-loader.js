/* v98.184 · helper for the shared "Mip" loading mascot (css/mip-loader.css). The component is CSS-only; this just builds the markup.
   MipLoader.html({size:'96px', width:'320px'}) → HTML string · MipLoader.mount(parent,opts) → element · MipLoader.still(el,true) → stop walking (done) */
(function (root) {
  'use strict';
  const html = (o = {}) => {
    const st = [o.size ? '--ms:' + o.size : '', o.width ? '--mw:' + o.width : '', o.style || ''].filter(Boolean).join(';');
    return '<div class="mip-track" aria-hidden="true"' + (st ? ' style="' + st + '"' : '') + '><div class="mip-go"><div class="mip-flip"><div class="mip-run"><i></i></div><div class="mip-idle"><i></i></div></div></div></div>';
  };
  const mount = (parent, o) => { const t = document.createElement('div'); t.innerHTML = html(o); const el = t.firstChild; parent.append(el); return el; };
  const still = (el, on = true) => { el?.classList.toggle('mip-still', !!on); };
  root.MipLoader = { html, mount, still };
})(globalThis);
