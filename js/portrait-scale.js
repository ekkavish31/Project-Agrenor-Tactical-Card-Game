/* v98.593 · dialogue-portrait height relative to a typical villager, taken from the ⚖ Scale Lineup numbers (village sprite height × the character's lineup factor ÷ the median of the cast, assets/village-town/npc + js/character-scale-adjust-data.js).
   Only the clearly smaller people are listed (children / small adults) — everybody else is drawn at full size. PortraitScale.k(id) → 0.8 … 1 */
(function (root) {
  'use strict';
  const K = { pip: .83, pim: .83, lin: .89, saf: .9, tess: .94 };
  root.PortraitScale = { K, k: id => K[String(id || '').replace(/^npc:/, '')] || 1 };
})(globalThis);
