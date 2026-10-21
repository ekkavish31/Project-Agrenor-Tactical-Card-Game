/* v56 · Battle opening ceremony.
   The area's painted background is shown clear and full-screen with the area name, a line of narration and
   battle facts (foes, boss, weather, time of day), then it blurs and fades away to reveal the battlefield
   in front of the softened backdrop. Click / Enter / Space skips. Follows battle speed and reduced-motion. */
(function(root){'use strict';
const C=()=>root.TacticsCore;
const reduced=()=>root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const speed=()=>Math.max(1,root.GAME_SPEED||1);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const NAMES={forest:'ลานฝึกริมป่า',quarry:'เหมืองหินร้าง',mine:'เหมืองร้าง',swamp:'บึงหมอก',coast:'ชายฝั่งหินผา',frost:'ช่องเขาหิมะ',ruins:'ซากวิหาร',crag:'ผาหินใหญ่','fft-forest':'ป่าเนินผา','terraced-hill':'เนินหินลานขั้นบันได','modular-wilds':'ป่าผสม'};
const LINES={forest:'ลมเย็นพัดผ่านยอดไม้ ใบไม้แห้งกรอบแกรบใต้ฝีเท้า',quarry:'ฝุ่นหินลอยคละคลุ้ง เสียงก้อนกรวดร่วงดังมาจากที่สูง',mine:'อุโมงค์มืดสนิท มีเพียงแสงผลึกเรืองรองนำทาง',swamp:'หมอกหนาลอยต่ำ น้ำโคลนสูงครึ่งแข้ง',coast:'คลื่นซัดโขดหิน กลิ่นเกลือลอยมากับลม',frost:'หิมะโปรยไม่หยุด ลมหนาวบาดผิว',ruins:'เสาหินพังทลาย เงียบจนได้ยินเสียงหัวใจตัวเอง',crag:'หน้าผาสูงชัน ใครยึดที่สูงได้ก่อนย่อมได้เปรียบ','fft-forest':'เนินผาซ้อนชั้นท่ามกลางป่า ทางขึ้นมีไม่กี่ทาง'};
function sceneSrc(area){const list=root.ASSET_MANIFEST?.assets||[],pick=id=>list.find(a=>a.id==='scene-area-'+id)?.file;return pick(area)||pick(root.TacticsScenery?.VARIANT?.[area]?.base)||pick('forest')}
function facts(st){const Cc=C(),foes=Cc.living(st,'enemy'),boss=foes.find(u=>['boss','miniboss'].includes(Cc.ENEMY_TYPES[u.kind]?.rank)),w=Cc.weatherInfo?.(st),night=root.BattleNight?.active(st);
 return [['⚔','ศัตรู '+foes.length],boss?['☠',boss.name]:null,w?[w.icon,w.name+(w.next&&w.next!==w.current?' → '+(Cc.WEATHER[w.next]?.name||''):'')]:null,[night?'☾':'☀',night?'กลางคืน':'กลางวัน'],st.map.night?null:null].filter(Boolean)}
let running=null;
const BattleIntro={
 async play(st){const layer=document.getElementById('tacticsLayer');if(!st||!layer||!layer.classList.contains('fullbattle')||layer.hidden)return;
  if(running){running.skip();await wait(30)}
  const area=st.encounter?.area||st.map.variant||(st.map.theme==='forest'&&st.map.style==='fft'?'fft-forest':st.map.theme),A=root.ADVENTURE_DATA?.AREAS?.[st.encounter?.area],
   name=st.encounter?.name||A?.name||NAMES[area]||NAMES[st.map.theme]||'สนามรบ',line=A?.intro||LINES[area]||LINES[st.map.theme]||'',src=sceneSrc(area)||sceneSrc(st.map.theme);
  const el=document.createElement('div');el.className='bi';el.setAttribute('role','dialog');el.setAttribute('aria-label','เริ่มการต่อสู้ · '+name);
  el.innerHTML=`<div class="bi-img"></div><div class="bi-bar top"></div><div class="bi-bar bottom"></div><div class="bi-text"><small>${st.encounter?'EXPEDITION':'BATTLE'}</small><h2></h2><p></p><ul></ul></div><button type="button" class="bi-skip">ข้าม ▸</button>`;
  el.querySelector('.bi-img').style.backgroundImage=src?`url("${src}")`:'';el.querySelector('h2').textContent=name;el.querySelector('ul').innerHTML=facts(st).map(([i,t])=>`<li><i>${esc(i)}</i>${esc(t)}</li>`).join('');
  layer.appendChild(el);let done=false,skip;const skipped=new Promise(r=>skip=r),end=()=>{done=true;skip()};running={skip:end};
  el.addEventListener('click',end);const key=e=>{if(['Enter',' ','Escape'].includes(e.key)){e.preventDefault();e.stopPropagation();end()}};document.addEventListener('keydown',key,true);
  const k=reduced()?.25:1/speed(),step=ms=>Promise.race([wait(ms*k),skipped]);
  try{
   tone(196,.5,.05);tone(294,.6,.04,.12);
   await step(60);el.classList.add('in');
   // narration types in
   const p=el.querySelector('p'),chars=[...line];if(reduced())p.textContent=line;else for(let i=0;i<=chars.length&&!done;i+=2){p.textContent=chars.slice(0,i).join('');await step(28)}p.textContent=line;
   el.classList.add('facts');await step(1500);
   // blur away to the battlefield
   el.classList.add('out');tone(392,.35,.035);await Promise.race([wait(650*k),wait(reduced()?0:650/speed())]);
  }finally{document.removeEventListener('keydown',key,true);el.remove();running=null}}};
// soft sting through the battle synth (follows battle volume)
let ac=null;function tone(f,dur,g,delay=0){try{if(!ac)ac=new (root.AudioContext||root.webkitAudioContext)();if(ac.state!=='running')return;const v=root.BattlePolish?.volume??.6;if(!v)return;const t=ac.currentTime+delay,o=ac.createOscillator(),gn=ac.createGain();o.type='triangle';o.frequency.value=f;gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(g*v,t+.05);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(gn).connect(ac.destination);o.start(t);o.stop(t+dur+.05)}catch{}}
root.BattleIntro=BattleIntro;
})(globalThis);
