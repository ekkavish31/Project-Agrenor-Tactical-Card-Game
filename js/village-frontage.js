/* Keep assembled garden props off paved streets and doorway approaches.
   Test ground footprints, not sprite silhouettes: tall plants may naturally
   overhang a road, but their roots and containers must stay on the plot. */
(function(){'use strict';
 const original=estateObjects,probe=document.createElement('canvas').getContext('2d');
 let main=null,lane=null,items=null,layout='';
 function paved(x,y){
  if(roadHit(x,y,16))return true;
  if([plazaPath,junctionPath].some(p=>p&&probe.isPointInPath(p,x,y*2)))return true;
  return false;   /* v98.836 · no courtyard paving any more */
 }
 // Shop thresholds use the same door-to-gate path that actors follow.
 const shops = {
  forge: { stones: ['#82786c','#a39989'], props: [['anvil',72],['ingots',52]] },
  market: { stones: ['#b49971','#ccaf84'], props: [['fruit-crate',68],['basket',48]] },
  inn: { stones: ['#aa9076','#c8b397'], props: [['pack-rack',75],['mead-cask',55]] }
 };
 /* v98.836 · the shop threshold stones followed the courtyard path — gone with the courtyard */
 function ground(ctx) { }
 function shopObjects(o) {
  if (!shops[o.id]) return [];
  const c=center(o), worldGate=gate(o), se=o.facing==='SE';
  const gu=se?worldGate.v-c.v:worldGate.u-c.u, gv=se?worldGate.u-c.u:worldGate.v-c.v;
  const fp=window.VillageFootprint?.fpOf(o), result=[];
  for (const [slot,[name,width]] of shops[o.id].props.entries()) {
   const side=slot===0?-1:1;
   // Search shoulders inside the shop plot. A wide/custom court may leave only one usable side.
   const shoulders=[side,-side];
   search: for(const direction of shoulders) for(const back of [.45,1.35,2.25]) {
    let placed=false;
    for(let offset=1.65;offset<=8;offset+=.65) {
     const u=gu+direction*offset,v=gv-back;
     if(fp && (u< -fp.u0+.6||u>fp.u1-.6||v< -fp.v0+.6||v>fp.v1-.6)) continue;
     const point=canonical(o,c.u+u,c.v+v),p=project(point.u,point.v);
     if(result.some(other => Math.hypot(p.x-other.x,(p.y-other.y)*2)<width)) continue;
     const onPath=([dx,dy])=>{const q=inv(p.x+dx,p.y+dy);return roadAt(q.u,q.v)};
     if([[0,0],[-width*.44,0],[width*.44,0],[0,-12],[0,12]].some(onPath)) continue;
     if(paved(p.x,p.y)) continue;
     result.push({owner:o,rel:{u,v},frontageKey:o.id+':front:'+name,name:'decor:'+name,x:p.x,y:p.y,
      draw(){const im=pieceImg('assets/interior/'+name+'.webp',true);if(!im)return;
       const h=width*im.naturalHeight/im.naturalWidth;
       TownArt.draw(g,im,null,[p.x-width/2,p.y-h*.94,width,h],project(hero.u,hero.v));}});
     placed=true;break;
    }
    if(placed)break search;
   }
  }
  return result;
 }
 estateObjects=function(){
  const key=locations.map(o=>[o.x,o.y,o.facing,o.flipArt].join(',')).join(';')+(window.VillageAssetEdit?.frameSig?.()||'')+JSON.stringify(window.VillageFence?.get()||0)+locations.map(o=>('0')+':'+(o.entry?o.entry.du+','+o.entry.dv:'')).join(';'); // v91.23: fence settings, walk cells and entrances also invalidate the cached list
  if(items&&main===roadMain&&lane===roadLane&&key===layout)return items;
  main=roadMain;lane=roadLane;layout=key;
  items=original().filter(o=>!o.owner||![[0,0],[-32,0],[32,0],[0,-16],[0,16]].some(([dx,dy])=>paved(o.x+dx,o.y+dy)));
  for(const o of locations) items.push(...shopObjects(o));
  return items;
 };
 window.VillageFrontage={paved,ground,stats:()=>({visible:estateObjects().length})};
})();
