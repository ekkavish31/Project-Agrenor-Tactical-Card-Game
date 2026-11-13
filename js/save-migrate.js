// v15: save upgrades — every save carries s.schema; each step below runs once, in order, when an older save loads.
// Add a new step (with the next number) whenever a version changes the shape of the save.
(function(){
if(typeof s==='undefined'||!s)return;
const STEPS=[
 [13,s=>{let a=s.village?.adventure;if(a&&a.types&&!a.types.g1){s.village.adventure=null;s.log='แผนที่ผจญภัยเปลี่ยนเป็นแบบใหม่ (22 จุด) การสำรวจที่ค้างอยู่จึงจบลง ของที่ได้ระหว่างทางยังอยู่ในกระเป๋า'}}],
 [14,s=>{s.village&&(s.village.companions||[]).forEach(c=>{if(c.gear&&!c.gear.kind)c.gear=null})}],
 [15,s=>{s.village&&(s.village.settings||={difficulty:'normal',speed:1,tips:true});s.village&&(s.village.tipsSeen||={})}],
 /* v98.441 · the in-page training battle of the old button scene is gone (training runs in its own battle page): a save that was left inside it goes back to the forge */
 [16,s=>{if(s.mode==='battle'){const p=s.parkedWork;s.mode='forge';s.done=false;if(p)Object.assign(s,{heat:p.heat||0,shape:p.shape||0,round:p.round||1,done:!!p.done,lastItem:p.lastItem??null});delete s.parkedWork}}]];
const LATEST=STEPS.at(-1)[0];let from=s.schema||12,ran=[];
for(let [n,fn] of STEPS)if(from<n){try{fn(s);ran.push(n)}catch(e){console.warn('save step',n,e)}}
if(from<LATEST){s.schema=LATEST;try{save()}catch(e){}}
window.SaveSchema={LATEST,ran};
})();
