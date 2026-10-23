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
 estateObjects=function(){
  const key=locations.map(o=>[o.x,o.y,o.facing,o.flipArt].join(',')).join(';')+(window.VillageAssetEdit?.frameSig?.()||'');
  if(items&&main===roadMain&&lane===roadLane&&key===layout)return items;
  main=roadMain;lane=roadLane;layout=key;
  items=original().filter(o=>!o.owner||![[0,0],[-32,0],[32,0],[0,-16],[0,16]].some(([dx,dy])=>paved(o.x+dx,o.y+dy)));
  return items;
 };
 window.VillageFrontage={paved,stats:()=>({visible:estateObjects().length})};
})();
