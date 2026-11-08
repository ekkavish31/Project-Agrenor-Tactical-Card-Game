/* v53 · Battle ceremony ("juice") for the crystal turn.
   Visual + sound only — never changes rules. Everything scales with the battle speed (GAME_SPEED)
   and collapses to almost nothing under prefers-reduced-motion.
   • BattleCrystals: 3 gems over the acting unit — pop in one by one at turn start, shatter when spent.
   • BattleJuice.ripple / rippleAlpha: the walk range washes outward from the unit like a wave.
   • walkCards: the walk card(s) used fly from the strip into the unit and burst.
   • fanOpen / cardPick: cards deal into the fan, the picked card lifts and glows.
   • impact: any unit losing HP gets a flash, spark ring and a short screen shake (bigger for heavy hits);
     healing gets a green rise. Watched from unit HP, so every attack path is covered. */
(function(root){'use strict';
const reduced=()=>root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const speed=()=>Math.max(1,root.GAME_SPEED||1);
const lab=()=>root.TacticsLab,D=()=>root.TacticsDecks,C=()=>root.TacticsCore;
const host=()=>document.fullscreenElement||document.body;

/* ---------- tiny synth (own context, follows the battle volume) ---------- */
let ac=null;
function audio(){try{if(!ac)ac=new (root.AudioContext||root.webkitAudioContext)();if(ac.state==='suspended')ac.resume();return ac.state==='running'?ac:null}catch{return null}}
function tone(freq,dur,type='sine',gain=.12,slide=1,delay=0){const a=audio(),v=root.BattlePolish?.volume??.6;if(!a||!v)return;const t=a.currentTime+delay,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(Math.max(40,freq*slide),t+dur);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain*v,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(a.destination);o.start(t);o.stop(t+dur+.02)}
function noise(dur,freq=2400,gain=.1,delay=0){const a=audio(),v=root.BattlePolish?.volume??.6;if(!a||!v)return;const t=a.currentTime+delay,b=a.createBuffer(1,Math.ceil(a.sampleRate*dur),a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=b;f.type='bandpass';f.frequency.value=freq;f.Q.value=1.4;g.gain.value=gain*v;s.connect(f).connect(g).connect(a.destination);s.start(t)}
const SFX={
 gem:i=>tone(1046*Math.pow(1.26,i),.16,'triangle',.09,1.02),
 shatter:()=>{noise(.18,5200,.12);tone(1900,.12,'triangle',.05,.6);tone(2600,.09,'sine',.04,.7,.03)},
 whoosh:()=>noise(.22,1400,.09),
 pick:()=>{tone(660,.07,'square',.04,1.5);tone(990,.09,'triangle',.05,1.1,.04)},
 deal:i=>noise(.06,3200,.035,i*.035),
 thud:big=>{tone(big?70:110,big?.28:.16,'sine',big?.32:.2,.5);noise(big?.16:.09,big?700:1200,big?.16:.1)},
 heal:()=>{tone(784,.18,'sine',.06,1.2);tone(1175,.22,'sine',.05,1.15,.06)}};

/* ---------- screen helpers ---------- */
function unitScreen(u){const L=lab();if(!L?.unitPoint||!L.canvas)return null;const p=L.unitPoint(u),r=L.canvas.getBoundingClientRect(),w=L.camera?.()?.w||40;return {x:p.x+r.left,y:p.y+r.top,w}}
function particle(x,y,cls,style={},life=600){const el=document.createElement('i');el.className='bj-p '+cls;Object.assign(el.style,{left:x+'px',top:y+'px'},style);host().appendChild(el);setTimeout(()=>el.remove(),life/speed()+60);return el}
function burst(x,y,n,cls,spread=46,life=520){if(reduced())return;for(let k=0;k<n;k++){const a=Math.PI*2*k/n+Math.random()*.4,r=spread*(.55+Math.random()*.6);particle(x,y,cls,{'--dx':Math.cos(a)*r+'px','--dy':Math.sin(a)*r*.7+'px','--life':life/speed()+'ms'},life)}}

/* ---------- crystals ---------- */
let gemEl=null,gemOwner=null,gemCount=-1,gemTurn=null;
const BattleCrystals={
 show(el,deck,unit){if(!el)return;gemEl=el;const n=deck&&D()?D().crystals(deck):(unit?3:0),key=unit?unit.id+':'+(lab()?.getState()?.turn??'')+':'+(deck?.cardSeq??''):null;
  el.hidden=!deck;if(!deck){gemCount=-1;return}
  const fresh=unit!==gemOwner||n>gemCount;// new unit, or a new turn refilled the crystals
  const gems=[...el.children];
  if(fresh){gemOwner=unit;gems.forEach((g,i)=>{g.className=i<n?'':'spent';if(i<n&&!reduced()){g.classList.add('pop');g.style.animationDelay=(i*110/speed())+'ms';setTimeout(()=>SFX.gem(i),i*110/speed())}});if(n>0)BattleJuice.ripple()}
  else if(n<gemCount){for(let i=n;i<gemCount;i++)shatter(gems[i])}
  el.setAttribute('aria-label','คริสตัลคำสั่งเหลือ '+n+' เม็ด');el.dataset.left=n;gemCount=n},
 spend(){/* rules already took the crystal; the next show() call sees the drop and shatters it */}};
function shatter(g){if(!g||g.classList.contains('spent'))return;const r=g.getBoundingClientRect();g.classList.remove('pop');g.classList.add('break');SFX.shatter();burst(r.left+r.width/2,r.top+r.height/2,9,'bj-shard',34,420);setTimeout(()=>{g.classList.remove('break');g.classList.add('spent')},240/speed())}

/* ---------- walk range wave ---------- */
let rippleAt=0;
const BattleJuice={
 ripple(){rippleAt=performance.now()},
 // 0..1 opacity for a range tile: the wave travels outward ~45 ms per tile
 rippleAlpha(t,h){if(reduced()||!rippleAt)return 1;const age=performance.now()-rippleAt,dist=Math.abs(t.x-h.x)+Math.abs(t.y-h.y),at=dist*45/speed();if(age>at+260)return 1;if(age<at)return 0;return Math.min(1,(age-at)/160*speed())},
 walkCards(cards,h){const strip=document.getElementById('v53Walk'),to=unitScreen(h);if(!strip||!to||!cards?.length)return;SFX.whoosh();
  cards.forEach((c,k)=>{const src=strip.querySelector(`.tactic-card[data-index="${c.index}"]`)?.getBoundingClientRect();if(!src)return;const el=document.createElement('div');el.className='bj-flycard';el.textContent=c.name;Object.assign(el.style,{left:src.left+'px',top:src.top+'px',width:src.width+'px',height:src.height+'px'});host().appendChild(el);
   const dur=(reduced()?1:420)/speed();el.animate([{transform:'translate(0,0) scale(1) rotate(0)',opacity:1},{transform:`translate(${to.x-src.left-src.width/2}px,${to.y-to.w*1.2-src.top-src.height/2}px) scale(.35) rotate(${k?14:-14}deg)`,opacity:.9}],{duration:dur,delay:k*90/speed(),easing:'cubic-bezier(.5,0,.4,1)',fill:'forwards'}).onfinish=()=>{el.remove();burst(to.x,to.y-to.w*1.2,8,k?'bj-spark-y':'bj-spark-b',30,380)}})},
 fanOpen(hand){if(reduced()||!hand)return;[...hand.querySelectorAll('.tactic-card.combat,.item-card')].forEach((c,i)=>{c.style.setProperty('--deal',(i*40/speed())+'ms');c.classList.remove('bj-deal');void c.offsetWidth;c.classList.add('bj-deal');if(i<6)SFX.deal(i)})},
 cardPick(i){SFX.pick();const c=document.querySelector(`#tacticsHand .tactic-card.combat[data-index="${i}"]`);if(c&&!reduced()){c.classList.remove('bj-picked');void c.offsetWidth;c.classList.add('bj-picked')}},
 impact};

/* ---------- impacts, watched from HP ---------- */
let lastHp=new Map(),lastState=null;
function impact(u,amount){const p=unitScreen(u);if(!p)return;const big=amount>=Math.max(12,(u.maxHp||40)*.25);
 if(amount>0){SFX.thud(big);if(big)hitstop(90);const y=p.y-p.w*.9;particle(p.x,y,'bj-flash'+(big?' big':''),{'--life':(big?320:220)/speed()+'ms'},big?340:240);burst(p.x,y,big?14:8,'bj-spark',big?62:40,big?520:380);
  if(root.BattlePolish?.shake!==false&&!reduced()){const cv=lab()?.canvas,m=big?7:3.5;cv?.animate([{transform:'translate(0,0)'},{transform:`translate(${m}px,${-m*.6}px)`},{transform:`translate(${-m*.8}px,${m*.5}px)`},{transform:`translate(${m*.4}px,0)`},{transform:'translate(0,0)'}],{duration:(big?260:170)/speed(),easing:'ease-out'})}}
 else{SFX.heal();burst(p.x,p.y-p.w*.6,10,'bj-heal',30,700)}}
// turn start: a name banner slides in for the player's units (enemies keep their quick flow)
let turnKey=null;
function banner(u){if(reduced())return;const layer=document.getElementById('tacticsLayer');if(!layer)return;const el=document.createElement('div');el.className='bj-turn';el.innerHTML=`<small>TURN</small><b></b><span>◆ ◆ ◆</span>`;el.querySelector('b').textContent=u.name;layer.appendChild(el);tone(523,.12,'triangle',.06);tone(784,.16,'triangle',.06,1,.08);setTimeout(()=>el.remove(),1300/speed())}
// hitstop: freeze the battle for a few frames on a heavy blow
function hitstop(ms){const L=lab();if(reduced()||!L?.freeze)return;try{L.freeze(ms/speed())}catch{}}
function watch(){requestAnimationFrame(watch);const st=lab()?.getState?.(),layer=document.getElementById('tacticsLayer');if(!st||layer?.hidden){lastHp.clear();lastState=null;turnKey=null;return}
 if(st.phase==='player'&&!lab().isLocked?.()){const k=st.hero?.id+':'+st.turn+':'+(st.deck?.cardSeq??0);if(turnKey?.split(':')[0]+':'+turnKey?.split(':')[1]!==st.hero?.id+':'+st.turn){turnKey=k;banner(st.hero)}}
 if(st!==lastState){lastState=st;lastHp=new Map(st.units.map(u=>[u.id,u.hp]));return}
 for(const u of st.units){const before=lastHp.get(u.id);if(before!=null&&u.hp!==before&&!u.removed){impact(u,before-u.hp)}lastHp.set(u.id,u.hp)}
 // walk strip: show which card(s) the hovered tile will spend
 const strip=document.getElementById('v53Walk'),pp=lab()?.pathPreview?.(),d=st.deck;if(strip&&d&&D()){const plan=pp&&st.hero.mp<=0?D().walkPlan(d,st.hero,pp.cost,d.moveLock||[]):null,use=new Set(plan?.cards||[]);strip.querySelectorAll('.tactic-card').forEach(c=>c.classList.toggle('bj-will',use.has(+c.dataset.index)));
  let tip=strip.querySelector('.bj-tip');if(!tip){tip=document.createElement('div');tip.className='bj-tip';strip.appendChild(tip)}const names=plan?plan.cards.map(i=>D().MOVE[d.movement.hand[i]?.id]):[],stam=names.reduce((a,m)=>a+(m?.stamina||0),0);tip.textContent=plan?'ใช้ '+names.map(m=>m?.name).join(' + ')+' · '+plan.cards.length+' คริสตัล'+(stam?' · แรง −'+stam:''):'';tip.hidden=!plan}}
requestAnimationFrame(watch);
root.BattleCrystals=BattleCrystals;root.BattleJuice=BattleJuice;
})(globalThis);
