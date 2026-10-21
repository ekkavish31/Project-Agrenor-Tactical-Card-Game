// v13: prints the game's data tables as JSON for tools/build-asset-manifest.py (node tools/dump-game-data.js)
global.window=global;process.chdir(__dirname+'/..');
require('./../js/tactics-decks.js');const C=require('./../js/tactics-core.js');require('./../js/adventure-data.js');
const AD=global.ADVENTURE_DATA,D=global.TacticsDecks;
const pick=(o,f)=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,f(v)]));
console.log(JSON.stringify({
 enemies:pick(C.ENEMY_TYPES,e=>({name:e.name,art:e.art,area:e.area,rank:e.rank||'normal',draw:e.draw||''})),
 consumables:pick(AD.CONSUMABLES,x=>({name:x.name,text:x.text})),goods:pick(AD.GOODS,x=>({name:x.name,text:x.text})),
 events:pick(AD.EVENT_CARDS,x=>({name:x.name,text:x.text})),areas:pick(AD.AREAS,a=>({name:a.name,theme:a.theme})),
 move:pick(D.MOVE,m=>({name:m.name})),combat:pick(D.COMBAT,m=>({name:m.name,owner:m.owner||''})),terrain:pick(C.TERRAIN,t=>({name:t.name}))}));
