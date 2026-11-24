/* v93 · Starter kit for new games + card collection + card unlock reveal.
   • New game: small battle deck (TacticsDecks.STARTER), a card collection that matches it (s.village.cardPool),
     and the father's old knife equipped (weaker than the sword forged on day 2 of the intro).
   • StarterKit.unlock([{group:'combat',id:'quake',n:3},…],{title,text}) adds cards to the collection, puts them into
     the hero's deck while there is room, saves, and shows a reveal (real Card Studio frames).
   • Old saves (no cardPool) keep every card and their own decks — nothing here touches them.
   • Companions in a new game also start with a smaller deck (their signature card included). */
(function(root){'use strict';
const D=root.TacticsDecks,G=()=>typeof s!=='undefined'?s:null,V=()=>G()?.village;
const clone=o=>JSON.parse(JSON.stringify(o)),sum=o=>Object.values(o||{}).reduce((a,b)=>a+b,0);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const doSave=()=>{try{save()}catch{}},doRender=()=>{try{render()}catch{}};

// the father's knife: a real knife in battle, hidden from the forge recipe list (non-enumerable)
if(typeof RECIPES!=='undefined'&&!RECIPES.oldKnife)Object.defineProperty(RECIPES,'oldKnife',{value:{name:'มีดสั้นเก่าของพ่อ',kind:'knife',level:99,cost:{},sell:6,xp:0},enumerable:false});

function freshSave(){const g=G(),v=V();return !!v&&g.day<=1&&!g.wins&&(g.minutes||480)<=520&&!(g.inventory||[]).length&&!(v.companions||[]).length&&!v.adventure&&!v.tacticDecks}
/* v98.472 · a save that still holds the OLD untouched starter (nothing unlocked, deck = collection = the old starter) gets the balanced one */
const OLD_STARTER={movement:{step:4,walk:5,run:3},combat:{attack:7,guard:4,rest:3,push:2}},OLD_STARTER2={movement:{step:2,walk:7,run:3},combat:{attack:9,guard:4,rest:2,push:1}},same=(a,b)=>{try{for(const g of ['movement','combat']){const x=a?.[g]||{},y=b?.[g]||{},k=new Set([...Object.keys(x),...Object.keys(y)]);for(const i of k)if((x[i]||0)!==(y[i]||0))return false}return true}catch{return false}};
function migrate(){const v=V();if(!v||v.starterKit!==1||v.starterRev>=3)return;if((same(v.cardPool,OLD_STARTER)&&same(v.tacticDecks,OLD_STARTER))||(same(v.cardPool,OLD_STARTER2)&&same(v.tacticDecks,OLD_STARTER2))){v.cardPool=clone(D.STARTER);v.tacticDecks=clone(D.STARTER)}v.starterRev=3;doSave()}
function apply(){const g=G(),v=V();if(!v)return;if(v.starterKit){migrate();return}
 if(!freshSave()){v.starterKit='legacy';doSave();return}
 v.cardPool=clone(D.STARTER);v.tacticDecks=clone(D.STARTER);v.v38Cards=true;// v38 migration would add cards the hero does not own
 const knife={id:g.nextId++,kind:'knife',recipe:'oldKnife',quality:1};g.inventory.push(knife);g.equipped=knife.id;
 v.starterKit=1;v.starterRev=3;doSave()}

// companions: smaller default decks in new games (old saves keep the big ones)
const baseDefault=D.defaultFor;
D.defaultFor=function(key){if(!V()?.cardPool)return baseDefault(key);const d={movement:{step:2,walk:6,run:2},combat:{attack:8,guard:4,rest:2}},sig=D.SIGNATURE[key];   /* v98.472 · same balance as the hero's starter */if(sig)d.combat[sig]=3;return D.validate(d)};

/* ---------- unlock ---------- */
function unlock(list,opt={}){const v=V();if(!v)return Promise.resolve();const legacy=!v.cardPool;
 if(!legacy){v.cardPool.movement||={};v.cardPool.combat||={};
  let deck;try{deck=D.validate(v.tacticDecks||D.STARTER)}catch{deck=clone(D.STARTER)}
  for(const x of list){const P=v.cardPool[x.group];P[x.id]=(P[x.id]||0)+x.n;
   const room=D.SIZE[x.group].max-sum(deck[x.group]);const add=Math.min(room,x.n);if(add>0)deck[x.group][x.id]=(deck[x.group][x.id]||0)+add}
  try{v.tacticDecks=D.validate(deck)}catch{}}
 doSave();doRender();return reveal(list,opt,legacy)}
function reveal(list,opt,legacy){return new Promise(done=>{const el=document.createElement('div');el.className='ck-reveal';
 const cards=list.map((x,i)=>{const id=(x.group==='movement'?'m-':'a-')+x.id,html=root.CardStudio?.renderCard(id,{mini:false})||'';const name=(x.group==='movement'?D.MOVE:D.COMBAT)[x.id]?.name||x.id;
  return `<figure class="ck-card" style="--i:${i}"><div class="ck-face">${html||`<div class="ck-plain">${esc(name)}</div>`}</div><figcaption>${esc(name)} <b>×${x.n}</b></figcaption></figure>`}).join('');
 el.innerHTML=`<div class="ck-rays"></div><div class="ck-box"><small>${esc(opt.kicker||'การ์ดใหม่')}</small><h2>${esc(opt.title||'ได้รับการ์ดใหม่')}</h2><div class="ck-row">${cards}</div><p>${esc(opt.text||(legacy?'':'เพิ่มเข้าคอลเลกชันและใส่ในสำรับต่อสู้แล้ว · ปรับได้ที่ "สำรับ"'))}</p><button type="button">รับการ์ด</button></div>`;
 document.body.appendChild(el);root.CardStudio?.fit?.(el);requestAnimationFrame(()=>el.classList.add('on'));
 const close=()=>{el.classList.remove('on');el.classList.add('off');setTimeout(()=>{el.remove();done()},380)};
 el.querySelector('button').onclick=close;el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key==='Escape')close()});setTimeout(()=>el.querySelector('button')?.focus(),400)})}

/* v98.1019 · SIGNATURE cards (story unlocks): level 1 = Light (mid prologue) · level 2 = Heavy (end of prologue). Both siblings get them at the same moment:
   the sibling who LEADS gets his / her own card in the deck (brother: rush-in melee · sister: ranged special magic + status); the other one's card waits in the collection
   (it is used when that sibling leads) and is also the follower's commanded skill in battle (js/flat-battle.js ALLY_SKILL.sib, set from v.sigLevel). Names are provisional, not canon. */
const SIG={1:{M:'sigLightM',F:'sigLightF'},2:{M:'sigHeavyM',F:'sigHeavyF'}};
async function unlockSignature(level,opt={}){const v=V();if(!v)return;for(let l=(v.sigLevel||0)+1;l<=level;l++)await sigOne(l,opt)}   // a skipped Light is handed over before the Heavy
function sigOne(level,opt={}){const v=V();if(!v||(v.sigLevel||0)>=level)return Promise.resolve();
 const fem=/female/.test(root.HeroVariant?.get?.()||''),mine=SIG[level][fem?'F':'M'],other=SIG[level][fem?'M':'F'];v.sigLevel=level;
 if(v.cardPool){v.cardPool.combat||={};v.cardPool.combat[other]=(v.cardPool.combat[other]||0)+2}
 const light=level===1,name=D.COMBAT[mine]?.name||mine;
 return unlock([{group:'combat',id:mine,n:2}],{kicker:opt.catchUp?'ท่าประจำตัว (ของที่ควรได้ไปแล้ว)':(light?'ท่าประจำตัว':'ท่าประจำตัว · ขั้นสอง'),title:name,
  text:(fem?(light?'เวทพิเศษพุ่งไกลใส่เป้าเดี่ยว ทำให้อ่อนแรง':'เวทวงกว้างใส่เป้าและศัตรูรอบ ทำให้ชาทุกตัวที่โดน'):(light?'พุ่งเข้าประชิดแล้วฟันเป้าเดี่ยวหนักแน่น':'พุ่งเข้าประชิดแล้วฟันวงกว้าง โดนศัตรูรอบเป้า'))+' · ฟรีดาถอดแบบท่าให้ทั้งสองพี่น้องพร้อมกัน — อีกคนใช้เป็นท่าพิเศษตอนสั่งในการต่อสู้'})}
apply();setTimeout(apply,0);// the save is loaded by the time this runs; the second call covers a late village init
root.StarterKit={unlock,unlockSignature,apply,freshSave};
})(globalThis);
