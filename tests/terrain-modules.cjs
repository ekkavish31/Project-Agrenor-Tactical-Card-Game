'use strict';
const assert=require('node:assert/strict');
require('../js/tactics-terraced-hill.js');
const M=require('../js/tactics-map-modules.js'),C=require('../js/tactics-core.js'),S=require('../js/tactics-surface.js');
const seen=new Set();
for(let i=0;i<100;i++){
 const seed='TERRAIN-QA-'+i,m=C.generate(seed,'modular-wilds','battle');
 assert.deepEqual(m,C.generate(seed,'modular-wilds','battle'),'same seed must reproduce geometry');
 for(const p of m.placements)seen.add(p.id);
 const r=C.reachable(m,{...m.start,traits:[]},10000,[]);
 for(const t of m.tiles){const k=C.key(t.x,t.y);assert.equal(r.costs.has(k),!t.blocked,'reachability '+k);for(const n of t.exits){const [x,y]=n.split(',').map(Number),b=C.at(m,x,y);assert(b.exits.includes(k));const mx=(x+t.x)/2,my=(y+t.y)/2,dx=(x-t.x)*1e-6,dy=(y-t.y)*1e-6;assert(Math.abs(S.height(m,mx-dx,my-dy)-S.height(m,mx+dx,my+dy))<.00001,'edge continuity');}}
 for(const spawn of [...m.spawns.allies,...m.spawns.enemies])assert(r.costs.has(C.key(spawn.x,spawn.y)));
 const rectangles=m.placements;for(let a=0;a<rectangles.length;a++)for(let b=a+1;b<rectangles.length;b++){let p=rectangles[a],q=rectangles[b];assert(p.x+p.size<=q.x||q.x+q.size<=p.x||p.y+p.size<=q.y||q.y+q.size<=p.y,'module overlap');}
}
assert.equal(seen.size,20,'every template exercised');
for(const theme of ['modular-wilds','terraced-hill','forest','quarry','mine','crag'])for(const mode of ['training','battle']){
 const state=C.create('NATIVE-QA',theme,mode);assert(state.hero);assert(state.units.length>=2);
 for(const u of state.units)assert(C.fits(state.map,u,u.x,u.y,[]),'valid spawn');
 if(state.map.authoredTerrain){const r=C.reachable(state.map,{...state.hero,traits:[]},10000,[]);for(const t of state.map.tiles)if(t.terrainLocked&&t.kind==='water')assert(t.blocked&&!r.costs.has(C.key(t.x,t.y)),'create must preserve water');for(const u of state.units)assert(r.costs.has(C.key(u.x,u.y)),'opponents reachable');}
}
const big=C.create('LARGE-QA','modular-wilds','battle',{encounter:{fixed:true,enemies:['captain'],objective:'captain'}});for(const u of big.units)assert(C.fits(big.map,u,u.x,u.y,[]));
console.log('PASS: 100 seeds, all 20 templates, deterministic geometry, non-overlap, all legal cells reachable, reciprocal continuous edges, spawn validity, water blocking, six themes / two modes, large-unit placement.');
