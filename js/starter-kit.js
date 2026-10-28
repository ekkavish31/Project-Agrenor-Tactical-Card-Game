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
function apply(){const g=G(),v=V();if(!v||v.starterKit)return;
 if(!freshSave()){v.starterKit='legacy';doSave();return}
 v.cardPool=clone(D.STARTER);v.tacticDecks=clone(D.STARTER);v.v38Cards=true;// v38 migration would add cards the hero does not own
 const knife={id:g.nextId++,kind:'knife',recipe:'oldKnife',quality:1};g.inventory.push(knife);g.equipped=knife.id;
 v.starterKit=1;doSave()}

// companions: smaller default decks in new games (old saves keep the big ones)
const baseDefault=D.defaultFor;
D.defaultFor=function(key){if(!V()?.cardPool)return baseDefault(key);const d={movement:{step:3,walk:5,run:2},combat:{attack:7,guard:4,rest:3}},sig=D.SIGNATURE[key];if(sig)d.combat[sig]=3;return D.validate(d)};

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

apply();setTimeout(apply,0);// the save is loaded by the time this runs; the second call covers a late village init
root.StarterKit={unlock,apply,freshSave};
})(globalThis);
