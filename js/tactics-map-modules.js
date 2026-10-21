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
function connect(map){const at=(x,y)=>x<0||y<0||x>=map.width||y>=map.height?null:map.tiles[y*map.width+x];for(const t of map.tiles){t.exits=[];if(t.blocked)continue;for(const [dx,dy,a,b]of edges){const n=at(t.x+dx,t.y+dy);if(n&&!n.blocked&&Math.abs(t.h-n.h)<=1&&a.every((j,i)=>Math.abs(t.surfaceCorners[j]-n.surfaceCorners[b[i]])<.001))t.exits.push(key(n.x,n.y));}}}
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
 connect(map);map.validation=validate(map);if(!map.validation.ok)throw Error('Invalid terrain modules: '+map.validation.unreachable.join(';'));return map;
}
root.TacticsMapModules={catalog,create,connect,validate};if(typeof module!=='undefined')module.exports=root.TacticsMapModules;
})(globalThis);
