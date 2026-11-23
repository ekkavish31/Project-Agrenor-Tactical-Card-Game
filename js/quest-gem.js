/* v98.1017 · QuestGem — the painted gold quest crystal (assets/ui/quest-marker.webp, tip pointing down) floating just above the head of the villager the current quest wants you to talk to.
   Used by the sub-maps (js/place-people.js) and the rooms (js/interior.js); the village street uses the same picture through js/town-quest.js.
   QuestGem.draw(g, x, headY, t, o?) → true when the picture was drawn · headY = y of the top of that person's head (canvas px) · o.h = crystal height (default 46) · o.k = size multiplier
   Until the picture loads, nothing is drawn (the old flat code-drawn diamond is gone). */
(function (root) {
  'use strict';
  let img = null;
  const pic = () => { if (!img) { img = new Image(); img.onerror = () => { img.bad = true }; img.src = 'assets/ui/quest-marker.webp' } return img.complete && img.naturalWidth && !img.bad ? img : null };
  function draw(g, x, headY, t, o = {}) {
    const p = pic(); if (!p) return false;
    const k = o.k || 1, h = (o.h || 46) * k, w = h * p.naturalWidth / p.naturalHeight, bob = Math.sin(t * .006) * 4 * k, tip = headY - 6 * k - bob;   /* the tip hovers a little above the hair and bobs */
    g.save(); g.shadowColor = 'rgba(255,200,60,.9)'; g.shadowBlur = 14 * k; g.drawImage(p, x - w / 2, tip - h * .98, w, h); g.restore(); return true;
  }
  root.QuestGem = { draw, ready: () => !!pic() };
})(typeof window !== 'undefined' ? window : globalThis);
