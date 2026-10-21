/* Authored terrain modules. All heights, textures and legal edges share this data. */
(function(root){'use strict';
const catalog={
 hill:[{id:'terrace',name:'เนินลานขั้น',shape:0},{id:'ridge',name:'สันเขายาว',shape:1},{id:'horseshoe',name:'เนินเว้า',shape:2},{id:'mesa',name:'เนินยอดกว้าง',shape:3}],
 forest:[{id:'grove',name:'ป่าโปร่ง',trees:[[3,3],[4,4],[8,3],[9,4],[3,8],[8,9]]},{id:'clearing',name:'ป่าล้อมลาน',trees:[[3,3],[5,2],[8,3],[10,5],[9,9],[6,10],[3,9],[2,6]]},{id:'twin',name:'ป่าสองกลุ่ม',trees:[[2,3],[3,4],[4,2],[3,6],[8,7],[9,9],[10,7],[8,10]]},{id:'woodland',name:'ป่าริมทาง',trees:[[2,2],[4,3],[8,2],[10,3],[2,9],[4,10],[8,9],[10,10]]}],
 water:[{id:'pond',name:'บ่อน้ำ',shape:0},{id:'oxbow',name:'บึงโค้ง',shape:1},{id:'island',name:'บึงเกาะกลาง',shape:2},{id:'twin-pools',name:'บึงคู่',shape:3}],
 meadow:[{id:'grassland',name:'ทุ่งหญ้า',shape:0},{id:'stone-field',name:'ลานหิน',shape:1},{id:'flower-meadow',name:'ทุ่งดอกไม้',shape:2},{id:'earth-clearing',name:'ลานดิน',shape:3}],
 ruins:[{id:'gate',name:'ประตูพัง',pillars:[[0,1],[4,1]]},{id:'court',name:'ลานเสา',pillars:[[0,0],[4,0],[0,4],[4,4]]},{id:'wall',name:'กำแพงขาด',pillars:[[0,0],[1,0],[3,0],[4,0]]},{id:'shrine',name:'แท่นหินเก่า',pillars:[[0,2],[4,2],[0,0],[4,4]]}]
};
const edges=[[1,0,[1,2],[0,3]],[-1,0,[0,3],[1,2]],[0,1,[3,2],[0,1]],[0,-1,[0,1],[3,2]]],key=(x,y)=>x+','+y;
// stepRule 'height' (generated maps): neighbours connect when the rule heights differ by ≤1, like the core rules; hand-made chunks also need matching edge corners.
function connect(map){const at=(x,y)=>x<0||y<0||x>=map.width||y>=map.height?null:map.tiles[y*map.width+x],loose=map.stepRule==='height';for(const t of map.tiles){t.exits=[];if(t.blocked)continue;for(const [dx,dy,a,b]of edges){const n=at(t.x+dx,t.y+dy);if(n&&!n.blocked&&!n.void&&Math.abs(t.h-n.h)<=1&&(loose||a.every((j,i)=>Math.abs(t.surfaceCorners[j]-n.surfaceCorners[b[i]])<.001)))t.exits.push(key(n.x,n.y));}}}
function validate(map){const byKey=new Map(map.tiles.map(t=>[key(t.x,t.y),t])),seen=new Set(),queue=[key(map.start.x,map.start.y)];for(let i=0;i<queue.length;i++){const k=queue[i];if(seen.has(k))continue;seen.add(k);for(const n of byKey.get(k)?.exits||[])if(!seen.has(n))queue.push(n)}const unreachable=map.tiles.filter(t=>!t.blocked&&!seen.has(key(t.x,t.y)));return {ok:!unreachable.length,walkable:seen.size,unreachable:unreachable.map(t=>key(t.x,t.y))};}
function create(seed='MODULES-01',mode='training',clearance=[1,1]){
 const rng=root.TacticsCore.random(String(seed)+'|modules-v1'),width=35,tiles=[],placements=[];
 for(let y=0;y<width;y++)for(let x=0;x<width;x++)tiles.push({x,y,h:0,kind:'grass',prop:null,blocked:false,variation:rng(),surfaceCorners:[0,0,0,0]});
 const at=(x,y)=>tiles[y*width+x],slots=[[2,2],[20,2],[2,20],[20,20]];
 // Shuffle large regions, not individual tiles. Three-cell corridors remain reserved.
 for(let i=slots.length-1;i>0;i--){let j=Math.floor(rng()*(i+1));[slots[i],slots[j]]=[slots[j],slots[i]]}
 function stamp(category,origin,size){const def=catalog[category][Math.floor(rng()*catalog[category].length)],rotation=Math.floor(rng()*4),id=category+'/'+def.id;placements.push({id,category,name:def.name,x:origin[0],y:origin[1],size,rotation});
 function set(x,y,h=0,kind='grass',extra={}){let c=extra.surfaceCorners||[h,h,h,h];for(let i=0;i<rotation;i++){[x,y]=[size-1-y,x];c=[c[3],c[0],c[1],c[2]]}Object.assign(at(origin[0]+x,origin[1]+y),{h,kind,moduleId:id,...extra,surfaceCorners:c});}
 if(category==='hill'){
  for(let y=2;y<=10;y++)for(let x=2;x<=10;x++){
   let outer=def.shape===1?(x>=3&&x<=8):def.shape===2?!(x>8&&y>7):def.shape===3?true:!(Math.abs(x-6)+Math.abs(y-6)>7);
   if(!outer)continue;let summit=x>=4&&x<=(def.shape===1?7:8)&&y>=3&&y<=6;set(x,y,summit?4:2);
  }
  // South entrance: two broad ramps separated by a two-cell landing.
  for(let x=5;x<=6;x++){for(let y=11;y<=12;y++)set(x,y,0,'path',{route:true});for(let y=9;y<=10;y++){let lo=10-y;set(x,y,Math.round(lo+.5),'path',{route:true,ramp:'ramp',surfaceCorners:[lo+1,lo+1,lo,lo]})}set(x,8,2,'path',{route:true});set(x,7,2,'path',{route:true});for(let y=5;y<=6;y++){let lo=2+6-y;set(x,y,Math.round(lo+.5),'path',{route:true,ramp:'ramp',surfaceCorners:[lo+1,lo+1,lo,lo]})}set(x,4,4,'path',{route:true});}
  // A second entrance on the west connects the outer terrace for flanking.
  for(let y=7;y<=8;y++){set(0,y,0,'path',{route:true});for(let x=1;x<=2;x++)set(x,y,x,'path',{route:true,ramp:'steps',surfaceCorners:[x-1,x,x,x-1]});set(3,y,2,'path',{route:true});set(4,y,2,'path',{route:true});}
 }else if(category==='forest'){
  for(let y=1;y<12;y++)for(let x=1;x<12;x++)if(def.trees.some(([a,b])=>Math.hypot(x-a,y-b)<2.4))set(x,y,0,'tallgrass');
  for(const [x,y]of def.trees)set(x,y,0,'grass',{prop:'tree',blocked:true,obstacleHeight:2});
 }else if(category==='water'){
  for(let y=2;y<=10;y++)for(let x=2;x<=10;x++){let d=Math.hypot((x-6)/1.15,y-6),wet=def.shape===0?d<3.8:def.shape===1?d<4.4&&!(x>5&&y<6):def.shape===2?d<4.5&&d>1.5:Math.hypot(x-4,y-4)<2.7||Math.hypot(x-8,y-8)<2.7;if(wet)set(x,y,0,'water',{blocked:true,terrainLocked:true});}
  // Every water template contains a continuous east-west causeway; islands are reachable.
  for(let x=1;x<12;x++)for(let y=6;y<=7;y++)set(x,y,0,'stone',{route:true,bridge:true,blocked:false,terrainLocked:true});
 }else if(category==='meadow'){
  for(let y=2;y<=10;y++)for(let x=2;x<=10;x++){let d=Math.hypot(x-6,(y-6)*1.2);if(d<4.5)set(x,y,0,def.shape===1?'stone':def.shape===3?'path':'tallgrass',{flowers:def.shape===2&&((x+y)%3===0)});}
  if(def.shape===1)for(const [x,y]of [[3,4],[8,3],[9,8]])set(x,y,0,'stone',{prop:'rock',blocked:true});
 }else{for(let y=0;y<size;y++)for(let x=0;x<size;x++)set(x,y,0,'stone');for(const [x,y]of def.pillars)set(x,y,0,'stone',{prop:'pillar',blocked:true,obstacleHeight:2});}
 }
 ['hill','forest','water','meadow'].forEach((c,i)=>stamp(c,slots[i],13));stamp('ruins',[15,15],5);
 for(const t of tiles)if(!t.moduleId&&(Math.abs(t.x-17)<=1||Math.abs(t.y-17)<=1)){t.kind='path';t.route=true}
 const allies=[{x:17,y:32},{x:16,y:32},{x:18,y:32},{x:16,y:31},{x:18,y:31}],enemies=Array.from({length:10},(_,i)=>({x:15+i%5,y:1+Math.floor(i/5)}));
 const map={size:width,width,height:width,tiles,objects:[],seed:String(seed),theme:'forest',variant:'modular-wilds',authoredTerrain:true,mode,clearance:[...clearance],placements,start:allies[0],enemy:enemies[0],spawns:{allies,enemies},generatorVersion:1};
 connect(map);cliffSkin(map,seed);map.validation=validate(map);if(!map.validation.ok)throw Error('Invalid terrain modules: '+map.validation.unreachable.join(';'));return map;
}
// FFT cliff skin (v51): on authored terrain, a tile at the foot of a drop of 2+ levels becomes an unwalkable
// rock face whose top tilts from the upper lip down to the ground (corner = tallest walkable tile touching that vertex).
// Ramps, routes, bridges, water, spawns and their neighbours are left alone; anything that would cut a tile off is reverted.
// Lip props (bushes / mossy rocks) are placed the same way. Rule heights of walkable tiles never change.
function cliffSkin(map,seed){const W=map.width,H=map.height,at=(x,y)=>x<0||y<0||x>=W||y>=H?null:map.tiles[y*W+x],N4=[[1,0],[-1,0],[0,1],[0,-1]],OFF=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]];
 const spawn=new Set([...(map.spawns?.allies||[]),...(map.spawns?.enemies||[])].map(p=>key(p.x,p.y)));
 const keep=t=>!t||t.void||t.route||t.ramp||t.bridge||t.terrainLocked||t.kind==='water'||spawn.has(key(t.x,t.y));
 connect(map);const before=new Set(validate(map).unreachable);// tiles already cut off (islands) are not this pass's doing
 const ok=()=>{connect(map);const v=validate(map),lost=v.unreachable.filter(k=>!before.has(k));return {ok:!lost.length,unreachable:lost}},saved=new Map(),save=t=>{if(!saved.has(t))saved.set(t,{h:t.h,blocked:t.blocked,cliff:t.cliff,prop:t.prop,obstacleHeight:t.obstacleHeight,surfaceCorners:t.surfaceCorners})},restore=t=>{Object.assign(t,saved.get(t));if(!t.cliff)delete t.cliff;if(t.prop==null)t.prop=null};
 // generated maps (stepRule 'height') keep their own layout: only cliffs the generator made get the skin — no new faces, no lip props (large bosses need their 2-wide routes)
 const generated=map.stepRule==='height';
 let cliffs=generated?[]:map.tiles.filter(t=>!keep(t)&&!t.blocked&&!t.prop&&N4.some(([dx,dy])=>{const n=at(t.x+dx,t.y+dy);return n&&!n.void&&!n.cliff&&n.h>=t.h+2})&&!N4.some(([dx,dy])=>{const n=at(t.x+dx,t.y+dy);return n&&(n.route||n.ramp||n.bridge)}));
 const skin=()=>{const cornerOf=(n,vx,vy)=>n.surfaceCorners[OFF.findIndex(([ox,oy])=>Math.abs(n.x+ox-vx)<.01&&Math.abs(n.y+oy-vy)<.01)];
  for(const t of cliffs){t.surfaceCorners=OFF.map(([ox,oy])=>{const vx=t.x+ox,vy=t.y+oy;let best=saved.get(t).h;for(const[dx,dy]of[[0,0],[ox*2,0],[0,oy*2],[ox*2,oy*2]]){const n=at(t.x+dx,t.y+dy);if(n&&!n.void&&!n.cliff)best=Math.max(best,cornerOf(n,vx,vy))}return best});t.h=Math.max(...t.surfaceCorners)}};
 for(const t of cliffs){save(t);Object.assign(t,{cliff:true,blocked:true,obstacleHeight:-1})}
 // cliff tiles a generator already made (rock crag) get the same inclined skin, starting from the ground they stand on
 const made=map.tiles.filter(t=>t.cliff&&!cliffs.includes(t)&&!t.void);for(const t of made){const low=N4.map(([dx,dy])=>at(t.x+dx,t.y+dy)).filter(n=>n&&!n.void&&!n.cliff).map(n=>n.h);save(t);saved.get(t).h=low.length?Math.min(...low):t.h}
 // revert faces that would isolate a walkable tile (rare: narrow ledges)
 for(let pass=0;pass<6;pass++){const v=ok();if(v.ok)break;const lost=new Set(v.unreachable);const back=cliffs.filter(t=>N4.some(([dx,dy])=>lost.has(key(t.x+dx,t.y+dy))));if(!back.length)break;for(const t of back)restore(t);cliffs=cliffs.filter(t=>!back.includes(t))}
 cliffs.push(...made);skin();
 let r=[...String(seed)].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,7)%2147483646+1;const rnd=()=>(r=r*16807%2147483647)/2147483647;
 if(!generated)for(const t of map.tiles){if(keep(t)||t.blocked||t.prop||t.cliff||t.h===0||!N4.some(([dx,dy])=>at(t.x+dx,t.y+dy)?.cliff)||N4.some(([dx,dy])=>{const n=at(t.x+dx,t.y+dy);return n&&(n.route||n.ramp)}))continue;if(rnd()>=.16)continue;
  save(t);Object.assign(t,{prop:rnd()<.55?'bush':'mossrock',blocked:true,obstacleHeight:1});if(!ok().ok)restore(t)}
 connect(map);return cliffs.length}
root.TacticsMapModules={catalog,create,connect,validate,cliffSkin};if(typeof module!=='undefined')module.exports=root.TacticsMapModules;
})(globalThis);
