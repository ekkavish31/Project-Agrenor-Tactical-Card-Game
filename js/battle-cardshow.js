/* v73 · "Card played" showcase — game-feel only, never changes rules.
   • Walking: each walk card used pops up full size (blue zone first, then the yellow-zone card) with a glow, a light sweep
     and sparks, then flies into its discard pile.
   • Attacks / skills / items: the card being played is shown full size while the unit strikes.
   • Hands refill right after every use (rules in TacticsDecks), and the existing card flow animates the draw.
   Sources: the card element is cloned from the hand / walk strip before the rules remove it. */
(function(root){'use strict';
const speed=()=>Math.max(.25,root.GAME_SPEED||1),reduced=()=>root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const css=document.createElement('style');css.textContent=`
.bcs-stage{position:fixed;inset:0;pointer-events:none;z-index:99990}
.bcs-card{position:absolute;left:50%;top:40%;width:210px;transform:translate(-50%,-50%);filter:drop-shadow(0 18px 30px rgba(0,0,0,.6));animation:bcsIn var(--in) cubic-bezier(.2,1.5,.4,1) both}
.bcs-card .bcs-face{position:relative;border-radius:14px;overflow:hidden;box-shadow:0 0 0 3px var(--tone),0 0 34px 6px var(--tone)}
.bcs-card .bcs-face .gcard{width:100%;filter:none}.bcs-card .bcs-face>*{pointer-events:none}
.bcs-card .bcs-face::after{content:'';position:absolute;inset:-40%;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.55) 50%,transparent 60%);transform:translateX(-70%);animation:bcsSweep var(--sweep) ease-out .12s both}
.bcs-card b.bcs-tag{position:absolute;left:50%;top:-30px;transform:translateX(-50%);white-space:nowrap;padding:3px 12px;border-radius:999px;background:var(--tone);color:#10161f;font:700 13px system-ui;box-shadow:0 4px 12px rgba(0,0,0,.4)}
.bcs-card.out{animation:bcsOut var(--out) cubic-bezier(.5,0,.75,0) forwards}
.bcs-ring{position:absolute;left:50%;top:40%;width:240px;height:240px;margin:-120px 0 0 -120px;border-radius:50%;border:3px solid var(--tone);opacity:0;animation:bcsRing var(--in) ease-out forwards}
.bcs-spark{position:absolute;left:50%;top:40%;width:7px;height:7px;margin:-3px;border-radius:50%;background:var(--tone);box-shadow:0 0 10px 3px var(--tone);animation:bcsSpark var(--life) ease-out forwards}
@keyframes bcsIn{0%{opacity:0;transform:translate(-50%,-30%) scale(.4) rotateY(80deg)}60%{opacity:1}100%{opacity:1;transform:translate(-50%,-50%) scale(1) rotateY(0)}}
@keyframes bcsOut{to{opacity:0;transform:translate(calc(-50% + var(--tx)),calc(-50% + var(--ty))) scale(.22) rotate(var(--rot))}}
@keyframes bcsSweep{to{transform:translateX(70%)}}
@keyframes bcsRing{0%{opacity:.9;transform:scale(.3)}100%{opacity:0;transform:scale(1.5)}}
@keyframes bcsSpark{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--dx),var(--dy)) scale(.3)}}`;
document.head.appendChild(css);
const TONE={blue:'#6fc3ff',yellow:'#ffd25a',red:'#ff7a5c',green:'#7fe08a',purple:'#c39bff'};
let stage=null,queue=Promise.resolve(),busyUntil=0;
function host(){if(!stage||!stage.isConnected){stage=document.createElement('div');stage.className='bcs-stage'}const h=document.fullscreenElement||document.body;if(stage.parentNode!==h)h.appendChild(stage);return stage}
function chime(tone){try{const P=root.BattlePolish;if(!P)return;P.sound(tone==='red'?'cast':tone==='green'?'heal':'magic',.28)}catch(e){}}
function sparks(st,tone,n=14){if(reduced())return;for(let k=0;k<n;k++){const a=Math.PI*2*k/n+Math.random()*.3,r=110+Math.random()*80,el=document.createElement('i');el.className='bcs-spark';el.style.cssText=`--tone:${TONE[tone]};--dx:${Math.cos(a)*r}px;--dy:${Math.sin(a)*r*.75}px;--life:${700/speed()}ms`;st.appendChild(el);setTimeout(()=>el.remove(),760/speed())}}
/* show one card; resolves when it has left (cards queue so a blue + yellow pair plays one after the other) */
// src: a full-card id ('a-attack', 'm-dash') rendered by Card Studio, or an element to clone
function full(id){const CS=root.CardStudio;return CS?.renderCard?.(id,{mini:false})||''}
function show(src,{tone='blue',tag='',pile=null,hold=700}={}){const html=typeof src==='string'?full(src):src?.outerHTML;if(!html)return Promise.resolve();
 const run=()=>new Promise(done=>{const st=host(),wrap=document.createElement('div'),inMs=(reduced()?60:420)/speed(),outMs=(reduced()?60:380)/speed();wrap.className='bcs-card';wrap.style.cssText=`--tone:${TONE[tone]};--in:${inMs}ms;--out:${outMs}ms;--sweep:${700/speed()}ms`;
  wrap.innerHTML=`${tag?`<b class="bcs-tag">${tag}</b>`:''}<div class="bcs-face">${html}</div>`;const ring=document.createElement('div');ring.className='bcs-ring';ring.style.cssText=`--tone:${TONE[tone]};--in:${inMs*1.6}ms`;st.appendChild(ring);st.appendChild(wrap);try{root.CardStudio?.fit?.(wrap.querySelector('.bcs-face'))}catch(e){}sparks(st,tone);chime(tone);
  setTimeout(()=>{const r=wrap.getBoundingClientRect(),p=pile&&document.querySelector(`[data-pile="${pile}"]`)?.getBoundingClientRect(),tx=p?p.left+p.width/2-(r.left+r.width/2):0,ty=p?p.top+p.height/2-(r.top+r.height/2):-160;wrap.style.setProperty('--tx',tx+'px');wrap.style.setProperty('--ty',ty+'px');wrap.style.setProperty('--rot',(tx>0?18:-18)+'deg');wrap.classList.add('out');
   setTimeout(()=>{wrap.remove();ring.remove();done()},outMs+30)},inMs+hold/speed())});
 // the next card may start while the previous one is flying out
 const p=queue.then(()=>{const start=run();return new Promise(r=>setTimeout(r,(reduced()?80:520)/speed())).then(()=>start)});queue=p.catch(()=>{});return p}
const handCard=i=>document.querySelector(`#tacticsHand .tactic-card.combat[data-index="${i}"]`)||document.querySelectorAll('#tacticsHand .tactic-card.combat')[i];
function install(){const D=root.TacticsDecks,J=root.BattleJuice;if(!D||!J||D._bcs)return!!D?._bcs;D._bcs=true;
 // attacks, skills, guards: the card in hand at that index, before the rules remove it
 const consume=D.consumeCombat;D.consumeCombat=function(d,index){const owner=root.TacticsLab?.getState?.()?.deck===d,c=d?.combat?.hand?.[index],el=owner&&c&&(full('a-'+c.id)?'a-'+c.id:handCard(index)?.cloneNode(true));const ok=consume.apply(this,arguments);
  if(ok&&el){const name=D.COMBAT?.[c?.id]?.name||'';show(el,{tone:['guard','wall','rest','mend'].includes(c?.id)?'blue':'red',tag:'ใช้การ์ด · '+name,pile:'combat-discard',hold:650})}return ok};
 if(D.consumeItem){const item=D.consumeItem;D.consumeItem=function(){const r=item.apply(this,arguments);const el=document.querySelector('#tacticsHand .item-card.bj-picked,#tacticsHand .item-card.selected,#tacticsHand .item-card[aria-pressed="true"]');if(el)show(el.cloneNode(true),{tone:'green',tag:'ใช้ไอเทม',hold:600});return r}}
 // walking: blue-zone card first, then the yellow-zone card
 const walk=J.walkCards;J.walkCards=function(cards,h){const strip=document.getElementById('v53Walk');(cards||[]).forEach((c,k)=>{const el=c.id&&full('m-'+c.id)?'m-'+c.id:strip?.querySelector(`.tactic-card[data-index="${c.index}"]`)?.cloneNode(true);if(el)show(el,{tone:k?'yellow':'blue',tag:(k?'โซนเหลือง · ':'โซนฟ้า · ')+(c.name||'การ์ดเดิน'),pile:'movement-discard',hold:420})});return walk.apply(this,arguments)};
 return true}
if(!install()){const t=setInterval(()=>{if(install())clearInterval(t)},300)}
root.BattleCardShow={show};
})(globalThis);
