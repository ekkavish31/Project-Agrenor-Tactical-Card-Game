// v15: the village uses the hero's own (adventure) outfit — the old blacksmith-apron clips are no longer used.
// Character art standard (every lead): idle · walk · work (one neutral hands-forward pose shared by every station) · rest · meal · sleep.
// The crafting look comes from the station effects (furnace fire, anvil sparks, quench steam), not from per-character animations.
(function(){
if(typeof HERO_ANIMATIONS==='undefined')return;const C=HERO_ANIMATIONS.clips;
const MAP={'daily.walk':'unarmed.walk','daily.forge':'adventure.cast','daily.smelt':'adventure.cast','daily.quench':'adventure.cast',
 'daily.meal':'adventure.meal','daily.rest':'adventure.rest','daily.sleep':'adventure.sleep',
 'daily.stretch':'daily.relax','daily.yawn':'daily.look','daily.wipe':'daily.adjust'};
const clone=o=>JSON.parse(JSON.stringify(o));
for(let [dst,src] of Object.entries(MAP)){let S=C[src];if(!S)continue;let D=C[dst]||{},had=(D.frames||[]).some(f=>f.event);let c=clone(S);c.loop=D.loop??S.loop;if(D.label)c.label=D.label;
 if(had&&!c.frames.some(f=>f.event))c.frames[Math.floor(c.frames.length/2)].event='impact';C[dst]=c}
window.VILLAGE_OUTFIT={MAP};
const first=C['daily.idle']?.frames?.[0]?.src;
const fix=()=>{document.querySelectorAll('img[src="assets/hero.webp"]').forEach(im=>im.src=first)};
if(first){document.addEventListener('DOMContentLoaded',fix);setInterval(fix,1000)}
})();
