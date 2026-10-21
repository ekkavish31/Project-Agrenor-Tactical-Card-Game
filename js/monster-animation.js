// Authored enemy animations; absent clips retain the original field sprite.
(function(){
 const states=new Map(),cache=new Map();let source=null,sourceLength=-1,index=new Map(),enabled=true,blocked=[];
 const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 function refresh(){let a=window.ASSET_MANIFEST?.assets||[];if(a!==source||a.length!==sourceLength){source=a;sourceLength=a.length;blocked=a.filter(x=>x.id.startsWith('enemy-anim-')&&x.status==='final'&&x.qaStatus==='needs-fix');index=new Map(a.filter(x=>x.id.startsWith('enemy-anim-')&&x.status==='final'&&x.qaStatus!=='needs-fix').map(x=>[x.id,x]))}}
 const viewOf=dir=>['NE','NW','N'].includes(dir)?'ne':'se';
 function resolve(kind,dir,pose){refresh();let native=index.get(`enemy-anim-${kind}-${String(dir).toLowerCase()}-${pose}`);if(native)return {entry:native,mirror:false};let a=index.get(`enemy-anim-${kind}-${viewOf(dir)}-${pose}`);return a?{entry:a,mirror:['SW','NW','W'].includes(dir)}:null}
 function entry(kind,dir,pose){return resolve(kind,dir,pose)?.entry}
 function trim(keep){let ready=[...cache.entries()].filter(([,e])=>e.ready),pixels=ready.reduce((s,[,e])=>s+e.image.naturalWidth*e.image.naturalHeight,0);ready.sort((a,b)=>a[1].used-b[1].used);while(ready.length>64||pixels>24*1024*1024){let i=ready.findIndex(([file])=>file!==keep);if(i<0)break;let [file,e]=ready.splice(i,1)[0];pixels-=e.image.naturalWidth*e.image.naturalHeight;cache.delete(file)}}
 function load(file){let e=cache.get(file);if(e){e.used=performance.now();return e}let im=new Image();e={image:im,ready:false,used:performance.now(),promise:null};e.promise=new Promise(resolve=>{im.onload=()=>{e.ready=true;trim(file);resolve(true)};im.onerror=()=>{e.failed=true;resolve(false)}});cache.set(file,e);im.src=file;return e}
 function frame(kind,dir,v,hp,now,id=kind){
  let pose=hp<=0?'down':v.guardUntil>now&&entry(kind,dir,'guard')?'guard':v.hitUntil>now?'hit':v.walking?'walk':v.pose||'idle';
  // Camera turns change the image, never the action clock.
  let key=`${kind}|${pose}`,s=states.get(id);if(!s||s.key!==key){s={key,since:now};states.set(id,s)}
  let resolved=resolve(kind,dir,pose),a=resolved?.entry;if(!a)return null;let e=load(a.file);if(!e.ready)return null;let im=e.image,an=a.animation||{},cols=an.columns||1,rows=an.rows||1,count=an.frames||cols*rows,times=an.timings||Array(count).fill(120),total=times.reduce((a,b)=>a+b,0),elapsed=Math.max(0,now-s.since)*(window.GAME_SPEED||1)*(pose==='idle'||pose==='down'?1:M.speed),t=an.loop?elapsed%total:Math.min(elapsed,total-1),i=0;
  while(i<count-1&&t>=times[i])t-=times[i++];if(!enabled||reduced())i=pose==='down'?count-1:0;
  let sourceFrame=an.indices?.[i]??i,r=an.regions?.[i]||[sourceFrame%cols*im.naturalWidth/cols,Math.floor(sourceFrame/cols)*im.naturalHeight/rows,im.naturalWidth/cols,im.naturalHeight/rows];return {image:im,sx:r[0],sy:r[1],sw:r[2],sh:r[3],flip:(resolved.mirror!==!!a.sourceFlip)!==!!an.frameFlips?.[i],clipId:a.id,nativeView:a.view,pivot:an.pivots?.[i]||a.pivot||[.5,.95],barHeight:a.barHeight||1,renderHeight:an.renderHeights?.[i]||a.renderHeight||1,pose,frame:i,frames:count};
 }
 function timing(kind,dir,pose){let a=entry(kind,dir,pose);if(!a)return null;let an=a.animation,k=pose==='idle'?1:1/M.speed;return {duration:an.timings.reduce((s,t)=>s+t,0)*k,impactMs:(an.impactMs??an.timings[0])*k,frames:an.frames}}
 function clips(kind){refresh();return [...index.values()].filter(a=>a.enemy===kind)}
 function preload(units,poses=['idle','walk']){for(let u of units||[])if(typeof u==='string'||!u.side||u.side==='enemy')for(let a of clips(typeof u==='string'?u:u.kind))if(poses.includes(a.pose))load(a.file)}
 async function prepare(kind){return Promise.all(clips(kind).map(a=>load(a.file).promise))}
 // v36: walk/attack clips play at 50% speed (FFT/Disgaea pacing); idle keeps its own rhythm
 const M={speed:.5};
 window.MonsterArt=M;Object.assign(M,{resolveClip:(kind,dir,pose)=>{let r=resolve(kind,dir,pose);return r?{id:r.entry.id,mirror:r.mirror,view:r.entry.view}:null},frame,timing,preload,prepare,reset:()=>states.clear(),setMotion:value=>enabled=!!value,blockedClips:()=>{refresh();return blocked.map(a=>({id:a.id,issues:a.qaIssueIds||[],file:a.file}))},diagnostics:()=>({images:cache.size,pixels:[...cache.values()].filter(e=>e.ready).reduce((s,e)=>s+e.image.naturalWidth*e.image.naturalHeight,0),clips:(refresh(),index.size),blockedClips:blocked.length})});
})();
