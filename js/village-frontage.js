/* Keep assembled garden props off paved streets and doorway approaches.
   Test ground footprints, not sprite silhouettes: tall plants may naturally
   overhang a road, but their roots and containers must stay on the plot. */
(function(){'use strict';
 const original=estateObjects,probe=document.createElement('canvas').getContext('2d');
 let main=null,lane=null,items=null,layout='';
 function paved(x,y){
  if(roadHit(x,y,16))return true;
  if([plazaPath,junctionPath].some(p=>p&&probe.isPointInPath(p,x,y*2)))return true;
  return locations.some(o=>estate(o)&&probe.isPointInPath(courtPath(o),x,y*2));
 }
 // Shop thresholds use the same door-to-gate path that actors follow.
 const shops = {
  forge: { stones: ['#82786c','#a39989'], props: [['anvil',72],['ingots',52]] },
  market: { stones: ['#b49971','#ccaf84'], props: [['fruit-crate',68],['basket',48]] },
  inn: { stones: ['#aa9076','#c8b397'], props: [['pack-rack',75],['mead-cask',55]] }
 };
 function ground(ctx) {
  for (const o of locations) {
   const style = shops[o.id];
   if (!style || o.court?.off) continue;
   const path = courtWalk(o);
   ctx.save();
   ctx.scale(1,.5);
   ctx.clip(courtPath(o));
   let next = .24, index = 0;
   for (let i=1; i<path.length; i++) {
    const a=path[i-1], b=path[i], du=b.u-a.u, dv=b.v-a.v, length=Math.hypot(du,dv);
    if (!length) continue;
    const u=du/length, v=dv/length;
    for (;next<length;next+=.77) {
     const x=a.u+next*u, y=a.v+next*v;
     // Paired worn pavers break up the seam without painting over grass.
     for (const side of [-1,1]) {
      const cu=x-side*v*.25, cv=y+side*u*.25;
      ctx.beginPath();
      for (const [j,[f,w]] of [[-.21,-.21],[.22,-.19],[.20,.21],[-.19,.22]].entries()) {
       const p=project(cu+u*f-v*w,cv+v*f+u*w);
       if(j) ctx.lineTo(p.x,p.y*2); else ctx.moveTo(p.x,p.y*2);
      }
      ctx.closePath(); ctx.fillStyle=style.stones[index++%2]; ctx.fill();
      ctx.strokeStyle='rgba(69,53,39,.38)'; ctx.lineWidth=1.2; ctx.stroke();
     }
    }
    next-=length;
   }
   ctx.restore();
  }
 }
 function shopObjects(o) {
  if (!shops[o.id] || o.court?.off) return [];
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
      draw(){const im=pieceImg('assets/interior/'+name+'.webp');if(!im)return;
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
  const key=locations.map(o=>[o.x,o.y,o.facing,o.flipArt].join(',')).join(';')+(window.VillageAssetEdit?.frameSig?.()||'')+JSON.stringify(window.VillageFence?.get()||0)+locations.map(o=>(o.court?.cells?.length||0)+':'+(o.entry?o.entry.du+','+o.entry.dv:'')).join(';'); // v91.23: fence settings, walk cells and entrances also invalidate the cached list
  if(items&&main===roadMain&&lane===roadLane&&key===layout)return items;
  main=roadMain;lane=roadLane;layout=key;
  items=original().filter(o=>!o.owner||![[0,0],[-32,0],[32,0],[0,-16],[0,16]].some(([dx,dy])=>paved(o.x+dx,o.y+dy)));
  for(const o of locations) items.push(...shopObjects(o));
  return items;
 };
 window.VillageFrontage={paved,ground,stats:()=>({visible:estateObjects().length})};
})();
