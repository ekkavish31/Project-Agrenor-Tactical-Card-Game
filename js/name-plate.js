/* v98.606 · NamePlate — ONE name-plate look for everything drawn on a canvas (villager names, station names in the sub-maps):
   dark wood-brown plate, thin gold double border with small diamonds at both ends, the name in bright cream with a dark outline, an optional small gold line underneath,
   and a little pointer to the thing it names.
   NamePlate.draw(g, name, x, y, { sub, size = 17, dir = 'up' | 'down' })   x,y = the point the plate names (for 'up' the plate sits ABOVE y, for 'down' BELOW y) */
(function (root) {
  'use strict';
  function draw(g, name, x, y, o = {}) {
    const size = o.size || 17, sub = o.sub ? String(o.sub) : '', down = o.dir === 'down', f = (px, b) => (b ? 'bold ' : '') + px + 'px TownThai,VillageThai,system-ui,sans-serif';
    g.save(); g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
    g.font = f(size, true); const nw = g.measureText(name).width; g.font = f(Math.round(size * .76), false); const sw = sub ? g.measureText(sub).width : 0;
    const pad = Math.round(size * .9), w = Math.max(nw, sw) + pad * 2, h = Math.round(size * (sub ? 2.55 : 1.65)), px = x - w / 2, py = down ? y + 8 : y - h - 8;
    g.shadowColor = 'rgba(0,0,0,.55)'; g.shadowBlur = 8; g.shadowOffsetY = 3;
    const gr = g.createLinearGradient(0, py, 0, py + h); gr.addColorStop(0, '#3b2a1b'); gr.addColorStop(1, '#1c130c'); g.fillStyle = gr;
    g.beginPath(); g.roundRect(px, py, w, h, 8); g.fill(); g.shadowColor = 'transparent';
    g.beginPath(); if (down) { g.moveTo(x - 7, py + .5); g.lineTo(x, py - 7); g.lineTo(x + 7, py + .5) } else { g.moveTo(x - 7, py + h - .5); g.lineTo(x, py + h + 7); g.lineTo(x + 7, py + h - .5) } g.closePath(); g.fill();
    g.strokeStyle = '#d8b46a'; g.lineWidth = 1.6; g.beginPath(); g.roundRect(px + .5, py + .5, w - 1, h - 1, 8); g.stroke();
    g.strokeStyle = 'rgba(216,180,106,.38)'; g.lineWidth = 1; g.beginPath(); g.roundRect(px + 3.5, py + 3.5, w - 7, h - 7, 5); g.stroke();
    g.fillStyle = '#e8c46e'; for (const dx of [-1, 1]) { const cx = x + dx * (w / 2 - 8), cy = py + h / 2; g.beginPath(); g.moveTo(cx, cy - 4); g.lineTo(cx + 4, cy); g.lineTo(cx, cy + 4); g.lineTo(cx - 4, cy); g.closePath(); g.fill() }
    const ny = py + (sub ? size * 1.15 : size * 1.18); g.font = f(size, true); g.lineWidth = 3; g.strokeStyle = 'rgba(10,6,3,.85)'; g.strokeText(name, x, ny); g.fillStyle = '#fff3d2'; g.fillText(name, x, ny);
    if (sub) { const sy = py + h - size * .52; g.font = f(Math.round(size * .76), false); g.lineWidth = 2.4; g.strokeText(sub, x, sy); g.fillStyle = '#e8c98a'; g.fillText(sub, x, sy) }
    g.restore();
  }
  root.NamePlate = { draw };
})(typeof window !== 'undefined' ? window : globalThis);
