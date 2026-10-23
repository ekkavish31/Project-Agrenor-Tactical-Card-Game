/* v65 · Villagers who walk around the village and talk.
   • Each villager lives in one of the NPC houses and walks a daily loop between the places that fit their trade,
     pausing at each stop. They walk on the same roads as the hero and stop to face him while talking.
   • Click a villager → dialogue box (portrait, name, trade, lines; ▶ next / Esc). Lines depend on the time of day,
     the hero's name and the world: the six roads out of the village and what waits at the end of each.
   • Art: assets/village-town/npc/<id>.png (front 3/4 view, facing lower-right) and optional <id>-back.png.
     Until a file exists the villager is drawn in code (clothes colour + hat/apron/hood per trade).
   Everything here is presentation — no game rules or saves change. */
(function(root){'use strict';
const V=()=>root.Village25D;
const ROSTER=[
 {id:'may',name:'ป้าเมย์',role:'คนทำขนมปัง',home:'npc0',stops:['market','square','inn'],look:{coat:'#c98a4b',apron:'#f1e6cc',hair:'#6b4426',hat:'scarf',hatCol:'#e8d6b0'},
  lines:{morning:['อรุณสวัสดิ์ {name}! ขนมปังเพิ่งออกจากเตา ยังอุ่นอยู่เลย','ก่อนออกเดินทางไกล อย่าลืมพกเสบียงติดตัวนะ ท้องว่างสู้ใครไม่ได้หรอก'],day:['ตลาดวันนี้คึกคักจัง พ่อค้าจากชายฝั่งเอาปลาเค็มมาขายด้วย','ได้ยินว่าเจ้าไปฝึกที่โรงตีเหล็กบ่อย ๆ … ระวังกล้ามขึ้นจนใส่เสื้อไม่ได้นะ'],evening:['ตะวันจะตกแล้ว รีบกลับบ้านเถอะ กลางคืนหมาป่าจากป่าตะวันออกชอบเดินมาใกล้รั้ว']}},
 {id:'tom',name:'ลุงทอม',role:'ช่างไม้',home:'npc1',stops:['forge','inn','square'],look:{coat:'#7a5a3a',apron:'#a07a4a',hair:'#8a8a86',hat:'cap',hatCol:'#5a4632'},
  lines:{morning:['ประตูทางตะวันออกโยกเยกอีกแล้ว … ลุงต้องไปซ่อมก่อนพวกหมาป่าจะมาลองดัน'],day:['ไม้ที่ดีที่สุดอยู่ในป่าตะวันออก แต่ลึกเข้าไปมีต้นไม้เฒ่าที่ขยับได้ … ลุงไม่ไปแถวนั้นหรอก','ถ้าจะสู้ ยึดที่สูงไว้ก่อน — ฟันจากข้างบนแรงกว่าฟันขึ้นไปเยอะ ลุงเห็นมากับตา'],evening:['ลุงจะแวะโรงแรมดื่มสักแก้ว เจ้ายังเด็กเกินไปสำหรับเหล้าของที่นั่นนะ']}},
 {id:'lin',name:'คุณยายลิน',role:'คนเฒ่าเล่านิทาน',home:'npc2',speed:.55,stops:['temple','square'],look:{coat:'#6f6a8f',apron:null,hair:'#e6e2da',hat:'hood',hatCol:'#57506f'},
  lines:{morning:['ยายตื่นเช้ากว่าไก่ทุกวัน … มาเถอะ นั่งฟังนิทานสักเรื่องไหม'],day:['นานมาแล้ว แผ่นดินนี้เคยเป็นของเผ่าพันธุ์โบราณ พวกเขาสร้างวิหารใหญ่ไว้ทางตะวันตกเฉียงใต้ แล้วก็หายไปหมด','ซากวิหารพวกนั้นยังมีแสงวิญญาณลอยวนอยู่ … บางคนว่ามีบางอย่างรออยู่ข้างใน'],evening:['เด็กสมัยนี้อยากออกไปดูโลกกันหมด … ยายไม่ห้ามหรอก แค่กลับมาเล่าให้ยายฟังด้วยก็พอ']}},
 {id:'brothers',name:'เคน',role:'คนตัดไม้',home:'npc3',stops:['east','forge','market'],look:{coat:'#4f6b3a',apron:'#7a5a3a',hair:'#3a2a1a',hat:'none'},
  lines:{morning:['วันนี้ข้ากับน้องจะไปตัดไม้ริมป่า … ถ้าได้ยินเสียงหอนก็ช่วยวิ่งมาด้วยนะ'],day:['ป่าตะวันออกมีหมาป่าเป็นฝูง ตัวจ่าฝูงตัวใหญ่ผิดปกติ','ได้ขวานใหม่จากโรงตีเหล็กมา คมจนตัดลมได้ ฮ่า ๆ'],evening:['ข้าว่าป่าช่วงนี้แปลก ๆ ต้นไม้บางต้นเหมือนมันหันตามเรา…']}},
 {id:'berg',name:'นายพรานเบิร์ก',role:'นายพราน',home:'npc4',stops:['north','northeast','guild'],look:{coat:'#5b4a32',apron:null,hair:'#2a1f16',hat:'hood',hatCol:'#3f5232'},
  lines:{morning:['ทางเหนือมีเหมืองร้าง ลึกลงไปมีแสงผลึก … สัตว์ไม่ยอมเข้าใกล้ ข้าก็ไม่เข้า'],day:['ช่องเขาหิมะตะวันออกเฉียงเหนือหนาวจนลมบาดผิว ถ้าจะไปเตรียมของอุ่น ๆ ให้พร้อม','อย่ายืนให้ศัตรูล้อมหลัง — โดนตีข้างหลังเจ็บกว่าข้างหน้าเยอะ'],evening:['คืนนี้ข้าจะเฝ้าทางเหนือ ได้ยินเสียงอะไรจากเหมืองจะบอกเจ้า']}},
 {id:'mira',name:'ครูมิรา',role:'ครูประจำหมู่บ้าน',home:'npc5',stops:['guild','square','temple'],look:{coat:'#3f5a8a',apron:null,hair:'#a8522e',hat:'none'},
  lines:{morning:['{name} มาเรียนเรื่องธาตุกับครูไหม? ไฟชนะลม ลมชนะดิน ดินชนะสายฟ้า … จำไว้ใช้ตอนสู้'],day:['สมาคมนักผจญภัยยังไม่เปิดรับ แต่ครูได้ยินว่าจะเปิดเร็ว ๆ นี้','ฝนตกทำให้สายฟ้าแรงขึ้น แต่ไฟอ่อนลง สภาพอากาศเปลี่ยนการต่อสู้ได้นะ'],evening:['เด็ก ๆ กลับบ้านกันหมดแล้ว … ครูชอบช่วงเวลานี้ที่สุด']}},
 {id:'joe',name:'โจ',role:'ชาวประมง',home:'npc6',stops:['southeast','market'],look:{coat:'#2f6a8a',apron:null,hair:'#3a2a1a',hat:'cap',hatCol:'#c9b27a'},
  lines:{morning:['คลื่นที่ชายฝั่งตะวันออกเฉียงใต้แรงขึ้นทุกวัน … เรือโจรสลัดก็มาจอดในอ่าวบ่อยขึ้น'],day:['ปลาเค็มล็อตใหม่ไปขายที่ตลาดแล้ว ถ้าจะไปชายฝั่ง ซื้อติดไว้กินระหว่างทางสิ','ที่ปลายแหลมมีโขดหินปะการังที่ … ขยับได้ ข้าเห็นกับตา!'],evening:['ทะเลตอนพระอาทิตย์ตกสวยที่สุด แต่ไม่มีใครอยากอยู่ที่นั่นตอนมืด']}},
 {id:'shep',name:'ปิแอร์',role:'คนเลี้ยงแกะ',home:'npc7',stops:['west','square'],look:{coat:'#8a8a5a',apron:null,hair:'#c9a46a',hat:'straw',hatCol:'#d9be7a'},
  lines:{morning:['แกะของข้าหายไปตัวหนึ่ง วิ่งไปทางบึงหมอกตะวันตก … ข้าไม่กล้าตามไป'],day:['บึงตะวันตกโคลนลึกครึ่งแข้ง เดินช้าจะโดนรุมนะ','คนว่ากลางบึงมีงูหลายหัวอาศัยอยู่ … แกะของข้าคงไม่รอดแล้ว'],evening:['ฟางพอสำหรับหน้าหนาวแล้ว ปีนี้คงไม่ลำบาก']}},
 {id:'ella',name:'เอลลา',role:'ช่างทอผ้า',home:'npc8',stops:['market','shop','home'],look:{coat:'#a0456a',apron:'#e8d6c0',hair:'#2a1a12',hat:'scarf',hatCol:'#7a3a5a'},
  lines:{morning:['เสื้อเจ้าขาดตรงไหล่อีกแล้ว! มานี่ เดี๋ยวพี่ปะให้'],day:['ผ้าลายคลื่นนี้ทอตามธงของชาวชายฝั่ง สวยไหม?','ถ้าหาเส้นใยแปลก ๆ จากการผจญภัยได้ เอามาให้พี่บ้างนะ'],evening:['ตาพี่เริ่มล้าแล้ว พรุ่งนี้ค่อยทอต่อ']}},
 {id:'herb',name:'หมอยาซาฟ',role:'หมอยาสมุนไพร',home:'npc9',stops:['healer','west','temple'],look:{coat:'#4a7a5a',apron:'#c9d6b0',hair:'#6a6a6a',hat:'hood',hatCol:'#3a5a44'},
  lines:{morning:['ไปเก็บสมุนไพรริมบึงมา … ถ้าเจ็บหนัก กลับไปนอนพักที่บ้านก่อน อย่าฝืน'],day:['สถานพยาบาลยังไม่พร้อมเปิด ยาหลายตัวยังขาดอยู่','สมุนไพรจากป่าใช้ทำยาได้ ถ้าเจอก็เก็บกลับมานะ'],evening:['ยามค่ำ สมุนไพรบางชนิดเรืองแสงได้ … อย่าไปเด็ดเล่นล่ะ']}},
 {id:'pim',name:'พิม',role:'เด็กในหมู่บ้าน',home:'npc5',speed:1.35,stops:['square','market','square','inn'],pause:[1.5,3],small:true,look:{coat:'#d97a3a',apron:null,hair:'#5a3a1a',hat:'none'},
  lines:{morning:['พี่ {name}! โตขึ้นหนูจะเป็นนักผจญภัยเหมือนพี่!'],day:['พี่เคยสู้กับหมาป่าไหม? ตัวใหญ่เท่าบ้านหรือเปล่า?','ครูมิราบอกว่าห้ามไปเล่นแถวประตูหมู่บ้าน … แต่หนูแอบไปบ่อย ๆ'],evening:['แม่เรียกกลับบ้านแล้ว! พรุ่งนี้เล่นกันใหม่นะพี่']}},
 {id:'guard',name:'ยามรอน',role:'ยามประตูตะวันออก',home:'east',fixed:true,stops:[],look:{coat:'#5a5a6a',apron:null,hair:'#3a3a3a',hat:'helm',hatCol:'#9a9aa8'},
  lines:{morning:['ประตูตะวันออกเปิดแล้ว ถ้าจะออกไป ข้าแค่ขอให้กลับมาครบสามสิบสองนะ'],day:['ทางออกแต่ละทางมีอันตรายต่างกัน — ป่า เหมือง บึง ชายฝั่ง หิมะ ซากวิหาร เลือกให้ดีล่ะ','ถ้าเรี่ยวแรงต่ำ อย่าเพิ่งออกไป พักให้เต็มก่อน'],evening:['เลยหกโมงเย็นแล้ว ข้าไม่แนะนำให้ออกไปตอนนี้']}}];
const EXIT_IDX={north:0,northeast:1,east:2,southeast:3,southwest:4,west:5};

/* ---------- art: drop-in sprites, otherwise a code-drawn villager ---------- */
// only files listed here are requested (no 404 noise); add an id (and id+'-back') when its sprite lands in assets/village-town/npc/
const NPC_ART=[];
const art={};for(const n of ROSTER){for(const k of ['','-back']){if(!NPC_ART.includes(n.id+k))continue;const im=new Image();im.onload=()=>{art[n.id+k]=im};im.src='assets/village-town/npc/'+n.id+k+'.png'}}
function drawVillager(g,n,p,t,walking,face){const sc=(n.small?.72:1)*(window.VillageAssetEdit?.charScale?.('npc:'+n.id)||1),h=88*sc,bob=walking?Math.abs(Math.sin(t*.012+n.phase))*4*sc:Math.sin(t*.002+n.phase)*.8,back=face==='NE'||face==='NW',flip=face==='SW'||face==='NW';
 g.fillStyle='rgba(20,30,20,.38)';g.beginPath();g.ellipse(p.x,p.y,15*sc,6*sc,0,0,Math.PI*2);g.fill();
 if(root.VillageAssetEdit?.drawChar?.('npc:'+n.id,g,{x:p.x,y:p.y-bob},face,h))return;const im=art[n.id+(back?'-back':'')]||art[n.id];if(im){const w=h*im.naturalWidth/im.naturalHeight*1.15;g.save();g.translate(p.x,p.y-bob);if(flip)g.scale(-1,1);root.TownArt.draw(g,im,null,[-w/2,-h*1.15,w,h*1.15],null);g.restore();return}
 const L=n.look,s=sc;g.save();g.translate(p.x,p.y-bob);if(flip)g.scale(-1,1);
 const step=walking?Math.sin(t*.012+n.phase)*5*s:0;g.strokeStyle='#3a2a1e';g.lineWidth=5*s;g.lineCap='round';g.beginPath();g.moveTo(-5*s,-22*s);g.lineTo(-5*s+step,-2*s);g.moveTo(5*s,-22*s);g.lineTo(5*s-step,-2*s);g.stroke();
 // body
 g.fillStyle=L.coat;g.beginPath();g.moveTo(-14*s,-20*s);g.quadraticCurveTo(-16*s,-50*s,-9*s,-58*s);g.lineTo(9*s,-58*s);g.quadraticCurveTo(16*s,-50*s,14*s,-20*s);g.closePath();g.fill();
 g.fillStyle='rgba(0,0,0,.18)';g.beginPath();g.moveTo(3*s,-58*s);g.lineTo(9*s,-58*s);g.quadraticCurveTo(16*s,-50*s,14*s,-20*s);g.lineTo(5*s,-20*s);g.closePath();g.fill();
 if(L.apron&&!back){g.fillStyle=L.apron;g.fillRect(-8*s,-46*s,16*s,25*s)}
 g.strokeStyle=L.coat;g.lineWidth=5*s;const sw=walking?Math.sin(t*.012+n.phase+Math.PI)*4*s:0;g.beginPath();g.moveTo(-13*s,-52*s);g.lineTo(-15*s+sw,-34*s);g.moveTo(13*s,-52*s);g.lineTo(15*s-sw,-34*s);g.stroke();
 g.fillStyle='#e8c09a';g.beginPath();g.arc(-15*s+sw,-33*s,3*s,0,Math.PI*2);g.arc(15*s-sw,-33*s,3*s,0,Math.PI*2);g.fill();
 // head
 g.fillStyle='#ecc6a0';g.beginPath();g.arc(0,-68*s,11*s,0,Math.PI*2);g.fill();g.fillStyle=L.hair;g.beginPath();g.arc(0,-70*s,11.5*s,Math.PI*1.02,back?Math.PI*2.98:Math.PI*1.98);g.fill();if(back){g.beginPath();g.arc(0,-68*s,11*s,0,Math.PI*2);g.fill()}
 if(!back){g.fillStyle='#2a1a12';g.fillRect(2*s,-69*s,2*s,2.5*s);g.fillRect(7*s,-69*s,2*s,2.5*s)}
 const hc=L.hatCol;g.fillStyle=hc||L.hair;if(L.hat==='cap'){g.beginPath();g.arc(0,-74*s,11*s,Math.PI,0);g.fill();g.fillRect(-2*s,-75*s,15*s,3*s)}
 else if(L.hat==='hood'){g.beginPath();g.arc(0,-70*s,13.5*s,Math.PI*.9,Math.PI*2.1);g.lineTo(13*s,-58*s);g.lineTo(-13*s,-58*s);g.closePath();g.fill();g.fillStyle='#ecc6a0';if(!back){g.beginPath();g.arc(2*s,-67*s,8*s,0,Math.PI*2);g.fill();g.fillStyle='#2a1a12';g.fillRect(2*s,-69*s,2*s,2.5*s);g.fillRect(7*s,-69*s,2*s,2.5*s)}}
 else if(L.hat==='scarf'){g.beginPath();g.arc(0,-71*s,12*s,Math.PI*1.05,Math.PI*1.95);g.lineTo(9*s,-66*s);g.lineTo(-9*s,-66*s);g.closePath();g.fill()}
 else if(L.hat==='straw'){g.beginPath();g.ellipse(0,-76*s,19*s,5*s,0,0,Math.PI*2);g.fill();g.beginPath();g.arc(0,-77*s,9*s,Math.PI,0);g.fill()}
 else if(L.hat==='helm'){g.beginPath();g.arc(0,-71*s,12.5*s,Math.PI,0);g.fill();g.fillRect(-12.5*s,-72*s,25*s,4*s)}
 g.restore()}

/* ---------- movement ---------- */
let npcs=null,last=0,talking=null,hover=null;
function target(stop){const v=V();if(stop in EXIT_IDX){const e=v.getExits()[EXIT_IDX[stop]];return e?{u:e.u,v:e.v}:null}const o=v.getLocations().find(o=>o.id===stop);return o?v.door(o):null}
function init(){const v=V();if(!v)return false;npcs=ROSTER.map((n,i)=>{let start;if(n.fixed){const e=v.getExits()[EXIT_IDX[n.home]];start={u:e.u-1.5,v:e.v+1.5};const s=snap(start);if(s)start=s}else start=target(n.home)||target('square');return {...n,u:start.u,v:start.v,path:[],wait:1+i*.6,stop:-1,face:'SE',phase:i*1.7,speed:(n.speed||1)*1.9}});return true}
function snap(p){const v=V();for(let r=0;r<=6;r+=.5)for(let a=0;a<8;a++){const q={u:p.u+Math.cos(a/8*Math.PI*2)*r,v:p.v+Math.sin(a/8*Math.PI*2)*r};if(!v.blocked(q.u,q.v))return q}return null}
function update(dt){if(!npcs&&!init())return;const v=V(),h=v.getHero();
 for(const n of npcs){if(n===talking){const du=h.u-n.u,dv=h.v-n.v;n.face=faceOf(du,dv);continue}
  if(n.path.length){const b=n.path[0],du=b.u-n.u,dv=b.v-n.v,len=Math.hypot(du,dv),st=dt*n.speed;n.face=faceOf(du,dv);if(len<=st){n.u=b.u;n.v=b.v;n.path.shift();if(!n.path.length)n.wait=n.pause?n.pause[0]+Math.random()*(n.pause[1]-n.pause[0]):3+Math.random()*5}else{n.u+=du/len*st;n.v+=dv/len*st}continue}
  if(n.fixed||!n.stops.length)continue;n.wait-=dt;if(n.wait>0)continue;
  const seq=[...n.stops,n.home];n.stop=(n.stop+1)%seq.length;const tgt=target(seq[n.stop]);if(!tgt){n.wait=4;continue}
  // stand near, not exactly on, the door so villagers do not pile up
  const off={u:tgt.u+(Math.random()-.5)*2.4,v:tgt.v+(Math.random()-.5)*2.4},goal=v.blocked(off.u,off.v)?tgt:off;
  n.path=v.findPath({u:n.u,v:n.v},goal);if(!n.path.length)n.wait=5}}
function faceOf(du,dv){const x=(du-dv)*28,y=(du+dv)*14;return y>=0?(x>=0?'SE':'SW'):(x>=0?'NE':'NW')}
function objects(t){const dt=Math.min(.1,(t-last)/1000||0);last=t;if(root.VillageAssetEdit?.frozen?.()){if(!npcs)init()}else update(dt);if(!npcs)return[];const v=V();
 return npcs.map(n=>{const p=v.project(n.u,n.v);return {x:p.x,y:p.y,npc:n,draw:g=>{drawVillager(g,n,p,t,n.path.length>0&&n!==talking,n.face);if(hover===n||talking===n)tag(g,n,p)}}})}
function tag(g,n,p){const top=p.y-(n.small?72:100);g.font='bold 15px VillageThai,system-ui';g.textAlign='center';const text=n.name+' · '+n.role,w=g.measureText(text).width+20;g.fillStyle='rgba(32,56,45,.92)';g.fillRect(p.x-w/2,top-24,w,24);g.fillStyle='#fff0c7';g.fillText(text,p.x,top-7)}

/* ---------- picking + dialogue ---------- */
function at(e){if(!npcs)return null;const w=root.world?.(e);if(!w)return null;const v=V();let best=null,bd=1e9;for(const n of npcs){const p=v.project(n.u,n.v),h=n.small?70:96;if(w.x>p.x-22&&w.x<p.x+22&&w.y>p.y-h&&w.y<p.y+6){const d=Math.abs(w.y-p.y);if(d<bd){bd=d;best=n}}}return best}
const box=document.createElement('section');box.id='npcTalk';box.hidden=true;box.innerHTML='<canvas width="120" height="140"></canvas><div><b></b><small></small><p></p><footer><button type="button" data-next>▶ ถัดไป</button><button type="button" data-close>ปิด · Esc</button></footer></div>';document.body.appendChild(box);
const css=document.createElement('style');css.textContent=`#npcTalk{position:fixed;z-index:20;left:50%;bottom:26px;transform:translateX(-50%);width:min(680px,calc(100vw - 32px));display:flex;gap:16px;align-items:stretch;padding:14px 18px;border-radius:14px;background:linear-gradient(#1d2a44f5,#121b2ef5);border:2px solid #d9b46b;box-shadow:0 14px 40px #000b;color:#f5e6c4;animation:npcIn .2s ease-out}#npcTalk[hidden]{display:none}#npcTalk canvas{width:96px;height:112px;flex:none;border-radius:10px;background:radial-gradient(#3a5a44,#1c2c22)}#npcTalk div{flex:1;display:flex;flex-direction:column}#npcTalk b{font-size:18px;color:#ffe8a6}#npcTalk small{color:#c9bb98;font-size:12px}#npcTalk p{margin:8px 0 10px;font-size:16px;line-height:1.65;min-height:3.3em}#npcTalk footer{display:flex;gap:8px;justify-content:flex-end;margin-top:auto}#npcTalk button{padding:6px 14px;border-radius:9px;border:1px solid #a88a58;background:#0d1424;color:#f5e6c4;cursor:pointer}#npcTalk button[data-next]{background:linear-gradient(#f0c560,#c9901f);color:#2a1a05;border-color:#7a4b06;font-weight:700}@keyframes npcIn{from{opacity:0;transform:translate(-50%,10px)}}`;document.head.appendChild(css);
let lines=[],li=0,typing=null;
function period(){const m=root.gameState?.minutes??600;return m<12*60?'morning':m<17*60?'day':'evening'}
function talk(n){talking=n;n.path=[];const name=root.gameState?.name||'นักผจญภัย',L=n.lines,p=period();lines=[...(L[p]||[]),...(p!=='day'?L.day.slice(0,1):[])].map(s=>s.replace(/\{name\}/g,name));li=0;
 box.querySelector('b').textContent=n.name;box.querySelector('small').textContent=n.role;box.hidden=false;const c=box.querySelector('canvas'),q=c.getContext('2d');q.clearRect(0,0,120,140);q.save();q.scale(1.25,1.25);drawVillager(q,{...n,small:false},{x:48,y:108},0,false,'SE');q.restore();show()}
function show(){const p=box.querySelector('p'),s=[...(lines[li]||'')];clearInterval(typing);let i=0;p.textContent='';typing=setInterval(()=>{i+=2;p.textContent=s.slice(0,i).join('');if(i>=s.length){clearInterval(typing);typing=null}},22);box.querySelector('[data-next]').textContent=li<lines.length-1?'▶ ถัดไป':'✓ จบ'}
function next(){if(typing){clearInterval(typing);typing=null;box.querySelector('p').textContent=lines[li];return}if(li<lines.length-1){li++;show()}else close()}
function close(){box.hidden=true;clearInterval(typing);typing=null;if(talking)talking.wait=1.5;talking=null}
box.querySelector('[data-next]').onclick=next;box.querySelector('[data-close]').onclick=close;
document.addEventListener('keydown',e=>{if(box.hidden)return;if(e.key==='Escape'){e.stopImmediatePropagation();close()}else if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopImmediatePropagation();next()}},true);
// clicks on a villager are taken before the town's own walk/enter handling
let downOn=null;
root.addEventListener('pointerdown',e=>{if(e.button!==0||e.target.id!=='world'||V()?.isEditing?.())return;downOn=at(e);if(downOn)e.stopPropagation()},true);
root.addEventListener('pointerup',e=>{if(!downOn)return;const n=at(e)===downOn?downOn:null;downOn=null;e.stopPropagation();if(n)talk(n)},true);
root.addEventListener('pointermove',e=>{if(e.target.id!=='world')return;const n=at(e);if(n!==hover){hover=n;if(n)e.target.style.cursor='pointer'}},true);
root.TownNPC={objects,talk:id=>{const n=npcs?.find(n=>n.id===id);if(n)talk(n)},list:()=>npcs?.map(n=>({id:n.id,u:n.u,v:n.v,walking:n.path.length>0})),roster:ROSTER};
})(globalThis);
