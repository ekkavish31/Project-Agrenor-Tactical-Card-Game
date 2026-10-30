// Grid battle ↔ village game.
// • Training (scarecrow at the forge): real HP / stamina / time, rewards character EXP (v93: legacy card copies retired).
// • Expedition (map exits, see expedition.js): companions join, real enemies, separate rewards:
//   coins + materials + character EXP + companion EXP. Defeat: carried home.
(function(){
const MIN_PER_TURN=5,FATIGUE_PER_TURN=2;
let session=null;
const layer=()=>document.getElementById('tacticsLayer'),$id=id=>document.getElementById(id);
function equippedWeapon(){let g=typeof gear==='function'?gear():null;return g&&TacticsCore.WEAPONS[g.kind]?g.kind:'unarmed'}
function syncBack(st){let h=st.leader||st.hero;s.hp=Math.max(0,Math.min(s.maxHp||60,h.hp));s.stamina=Math.max(0,Math.min(cap(),Math.round(h.stamina)));save()}
function clockText(){let left=1200-s.minutes;return `เวลา ${clock(s.minutes)} · เหลือ ${Math.floor(left/60)}:${String(left%60).padStart(2,'0')} ชม. · จบเทิร์นละ ${MIN_PER_TURN} นาที`}
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
function claimFieldDrops(st){let mats=s.village.materials;for(let d of st.drops||[])if(d.material&&!d.claimed&&(d.collected||st.outcome==='win')){mats[d.material]=(mats[d.material]||0)+d.amount;d.claimed=true}}
function expeditionRewards(st){let enc=st.encounter,kills=st.stats.kills,captain=st.objective==='captain',coins=30+kills*4+(captain?25:0)+rnd(0,15);
 let mats={iron:rnd(1,2)+(enc.theme==='quarry'?1:0),coal:rnd(0,2),wood:rnd(0,2)+(enc.theme==='forest'?1:0),food:rnd(0,1)},xp=50+kills*5;
 s.village.coins+=coins;for(let [k,n] of Object.entries(mats))s.village.materials[k]+=n;let lv0=s.village.character?.level;gainCharacterXP(xp);st.heroLevelUp=s.village.character?.level>lv0;
 let comp=window.Companions?.reward(st)||[];st.expReport=comp;
 st.rewardSummary={coins,xp,mats};return {coins,mats,xp,comp}}
function rewardHtml(r){let m=Object.entries(r.mats).filter(([,n])=>n>0).map(([k,n])=>MATERIALS[k].icon+' '+MATERIALS[k].name+' ×'+n).join(' · ');
 return `<div class="exp-reward"><p><b>◉ ${r.coins} เหรียญ</b></p><p>${m||'ไม่มีวัตถุดิบ'}</p><p>✦ EXP ตัวละคร +${r.xp}</p>${r.comp.length?'<h3>เพื่อนร่วมทีม</h3>'+r.comp.map(c=>`<p>${esc(c.name)} +${c.xp} EXP${c.levelUp?' · <b>เลเวลอัป! Lv.'+c.level+'</b>':''}</p>`).join(''):''}</div>`}
window.TACTICS_BRIDGE={
 visible:()=>!!layer()&&!layer().hidden,
 prepare(st){st.hero.hp=s.hp;st.hero.maxHp=s.maxHp||60;st.hero.stamina=Math.min(100,s.stamina);st.rewarded=false;if(st.environment)st.environment.minutes=s.minutes},
 deckConfig(){try{return s.village?.tacticDecks?TacticsDecks.validate(s.village.tacticDecks):null}catch(e){return null}},
 unitDecks(){let out={};for(let [k,v] of Object.entries(s.village?.unitDecks||{}))try{out[k]=TacticsDecks.validate(v)}catch(e){}return out},
 // Expedition → fixed encounter + recruited companions. Training → companions (if any) only matter in the test 5v10 mode.
 battleConfig(){let allies=window.Companions?.party()||[];if(session?.adventure)return window.Adventure?.battleConfig()||{};if(session?.expedition){let enc=TacticsCore.ENCOUNTERS[session.expedition];return {mode:'battle',theme:enc.theme,encounter:enc,allies}}return allies.length?{allies}:{}},
 finished(st){if(!session||st.rewarded)return;st.rewarded=true;claimFieldDrops(st);syncBack(st);let retry=$id('retryButton'),txt=$id('resultText');
  if(session.adventure){retry.hidden=true;$id('tacticsResultExit').textContent=st.outcome==='win'?'กลับแผนที่ผจญภัย':'ถูกพากลับหมู่บ้าน';window.Adventure?.battleEnd(st,session);txt.textContent+=st.outcome==='win'?' · ได้ของรางวัล (ดูเมื่อกลับแผนที่)':'';save();return}
  if(session.expedition){retry.hidden=true;$id('tacticsResultExit').textContent='กลับหมู่บ้าน';
   if(st.outcome==='win'){let r=expeditionRewards(st);session.summary={title:'สำรวจ'+st.encounter.name+'สำเร็จ',html:rewardHtml(r)};s.log='กลับจาก'+st.encounter.name+' · ได้ '+r.coins+' เหรียญและวัตถุดิบ';txt.textContent+=' · ได้รางวัล (ดูเมื่อกลับหมู่บ้าน)'}
   else{let lost=Math.floor(s.village.coins*.1);s.village.coins-=lost;session.defeat=true;s.log='พ่ายแพ้ที่'+st.encounter.name+' · ถูกพากลับบ้าน เสีย '+lost+' เหรียญ';txt.textContent+=' · ถูกพากลับบ้าน เสีย '+lost+' เหรียญ';session.summary={title:'พ่ายแพ้',html:`<p>เพื่อนพาคุณกลับบ้าน (ใช้เวลา 1 ชั่วโมง) · HP เหลือ 10 · เสีย ${lost} เหรียญ</p>`}}
   save();return}
  retry.hidden=false;$id('tacticsResultExit').textContent='กลับโรงตีเหล็ก';
  if(st.outcome==='win'){let xp=25;gainCharacterXP(xp);st.rewardSummary={...(st.rewardSummary||{}),xp};s.wins++;s.advanced=true;session.summary={title:'ฝึกสำเร็จ',html:'<p>ชนะหุ่นฟาง · ✦ EXP ตัวละคร +'+xp+'</p>'};s.log='ชนะหุ่นฟาง • EXP ตัวละคร +'+xp;txt.textContent+=' · EXP ตัวละคร +'+xp}
  else{s.log='หมดแรงระหว่างฝึก • กินอาหารหรือกลับบ้านนอนเพื่อฟื้น HP';txt.textContent+=' · HP หมด ต้องพักก่อนฝึกใหม่'}
  save();retry.disabled=s.hp<=0||s.minutes>=1180;retry.textContent=s.hp<=0?'HP หมด · ฝึกต่อไม่ได้':'ฝึกอีกรอบ (สนามใหม่)'}
};
// Each finished enemy turn costs game time and a little freshness.
const baseNextTurn=TacticsCore.nextTurn;
TacticsCore.onActor=(st,u)=>{if(st.phase==='player')window.BattleItems?.draw();window.FFTHud?.reset()};
TacticsCore.nextTurn=function(st){baseNextTurn(st);if(!session||!TACTICS_BRIDGE.visible())return;s.minutes=Math.min(1200,s.minutes+MIN_PER_TURN);s.fatigue=Math.min(100,s.fatigue+FATIGUE_PER_TURN);st.hero.stamina=Math.min(st.hero.stamina,cap());syncBack(st);$id('tacticsClock').textContent=clockText();
 if(s.minutes>=1200&&!st.outcome){st.outcome='lose';st.phase='done';s.log='หมดเวลา 20:00 ระหว่างการต่อสู้';setTimeout(()=>{alert('หมดเวลา 20:00 แล้ว จบการต่อสู้');closeTactical(true)},50)}};

function trainingBlock(){return s.village?.location!=='forge'?'ต้องอยู่โรงตีเหล็ก':s.hp<=0?'HP หมด กินอาหารหรือกลับบ้านนอนก่อน':s.minutes>=1180?'ใกล้ 20:00 แล้ว เวลาไม่พอฝึก':s.fatigue>=95?'ความสดชื่นต่ำเกินไป พักก่อน':''}
// opts.expedition = encounter key (east / north) — started from the village map.
function openTactical(opts={}){if(busy||devActive||session)return;if(!opts.expedition&&!opts.adventure){let why=trainingBlock();if(why){$('message').textContent='ยังฝึกไม่ได้: '+why;return}if(s.hp<25&&!confirm('HP เหลือ '+s.hp+'/60 เริ่มฝึกต่อหรือไม่?'))return}
 closeCardFocus?.();$('panel').open&&$('panel').close();
 session={rewards:[],startMinutes:s.minutes,expedition:opts.expedition||null,adventure:opts.adventure||null,returnTo:s.village.location};layer().hidden=false;layer().classList.add('fullbattle');document.body.classList.add('tactics-open');
 let lab=window.initTacticsLab();let training=!opts.expedition&&!opts.adventure;let menu=$id('trainingSettings');if(!menu){menu=document.createElement('details');menu.id='trainingSettings';menu.innerHTML='<summary>ตั้งค่าฝึก</summary><div class="training-options"><label>อาวุธ <select data-train="weapon"></select></label><label><input type="checkbox" data-train="shield"> โล่มือรอง</label><label>สนาม <select data-train="theme"></select></label><label>รูปแบบ <select data-train="mode"><option value="training">ฝึก 1 ต่อ 1</option><option value="battle">ทดสอบ 5 ต่อ 10</option></select></label><button data-train="random">สุ่มสนามใหม่</button></div>';document.querySelector('#tacticsLayer .top-actions').appendChild(menu);menu.querySelector('[data-train=weapon]').innerHTML=$id('weapon').innerHTML;menu.querySelector('[data-train=theme]').innerHTML=$id('theme').innerHTML;menu.addEventListener('change',e=>{if(lab.isLocked())return;let kind=e.target.dataset.train;if(kind==='weapon'){$id('weapon').value=e.target.value;$id('weapon').onchange()}else if(kind==='shield'){$id('shield').checked=e.target.checked;$id('shield').onchange()}else if(kind==='theme'){$id('theme').value=e.target.value;lab.reset()}else if(kind==='mode'){$id('fieldMode').value=e.target.value;lab.reset()}});menu.querySelector('[data-train=random]').onclick=()=>{if(!lab.isLocked())$id('randomButton').click()}}menu.hidden=!training;menu.open=false;menu.querySelector('[data-train=theme]').value=$id('theme').value;menu.querySelector('[data-train=mode]').value='training';
$id('seed').value=(opts.adventure?'ADV-':opts.expedition?'EXP-':'TRAIN-')+s.day+'-'+(s.wins+1)+'-'+Math.floor(Math.random()*9999);
 $id('fieldMode').value=opts.expedition?'battle':'training';
 $id('tacticsExit').textContent=opts.expedition?'← ถอยทัพ':'← ออกจากการฝึก';
 lab.setLoadout(equippedWeapon(),false);menu.querySelector('[data-train=weapon]').value=equippedWeapon();menu.querySelector('[data-train=shield]').checked=false;lab.reset();window.BattleItems?.draw();let sm=document.querySelector('#tacticsLayer .title small');if(sm)sm.textContent=opts.adventure?'ผจญภัย · '+(opts.adventure.type==='boss'?'ศึกหัวหน้า':opts.adventure.type==='miniboss'?'ศึกรองหัวหน้า':'การต่อสู้'):'EVERYDAY ARCANA · ฝึกกับหุ่นฟาง';$id('tacticsExit').textContent=opts.adventure?'← ถอย':$id('tacticsExit').textContent;requestAnimationFrame(()=>lab.size());$id('tacticsClock').textContent=clockText()}
function closeTactical(force){if(!session)return;let sess0=session;let lab=window.TacticsLab,st=lab?.getState();if(lab?.isLocked()&&!force)return;let exp=session.expedition;
 if(st&&!st.outcome){if(!force&&!confirm(sess0.adventure?'ถอยออกจากการต่อสู้? กลับไปที่แผนที่ จุดนี้ยังไม่ผ่าน':exp?'ถอยทัพกลับหมู่บ้าน? ไม่ได้รางวัล HP แรง และเวลาที่ใช้ไปไม่คืน':'ออกจากการฝึกตอนนี้? HP แรง และเวลาที่ใช้ไปไม่คืน และไม่ได้รางวัล'))return;claimFieldDrops(st);syncBack(st);s.log=exp?'ถอยทัพจาก'+TacticsCore.ENCOUNTERS[exp].name:'ออกจากการฝึกกลางคัน'}
 let sess=session;session=null;window.BattleCardFlow?.reset();layer().hidden=true;layer().classList.remove('fullbattle');document.body.classList.remove('tactics-open');
 if(sess.adventure){save();render();window.Adventure?.afterBattle(sess);return}
 if(exp){// walking back takes 30 minutes; a defeat means being carried home
  if(sess.defeat){s.village.location='home';s.hp=Math.max(s.hp,10);s.minutes=Math.min(1200,s.minutes+60)}else{s.minutes=Math.min(1200,s.minutes+30);s.village.location=sess.returnTo}}
 save();render();if(typeof applySceneLayout==='function')applySceneLayout(true);
 if(sess.summary)villageDialog(sess.summary.title,sess.summary.html);else if(sess.rewards.length)showReward(sess.rewards.includes('unlock')?'unlock':'win')}
$id('tacticsExit').addEventListener('click',()=>closeTactical());
$id('tacticsResultExit').addEventListener('click',()=>closeTactical());
$id('retryButton').addEventListener('click',e=>{let why=trainingBlock();if(why){e.stopImmediatePropagation();alert('ฝึกต่อไม่ได้: '+why);return}$id('seed').value='TRAIN-'+s.day+'-'+(s.wins+1)+'-'+Math.floor(Math.random()*9999)},true);
document.addEventListener('keydown',e=>{if(session&&e.key==='Escape'&&!$id('help').open&&!$id('anchorEditor')?.offsetParent&&window.TacticsLab?.getState().selected==='move'){closeTactical();e.preventDefault()}});
toggleTraining=function(){if(s.mode==='battle'){changeMode('forge');return}openTactical()};
const baseChangeMode=changeMode;changeMode=function(m){if(m==='battle'&&s.mode!=='battle')return openTactical();return baseChangeMode(m)};
// companion orders panel (only when companions fight)
const ORDERS=[['free','อิสระ','เลือกเป้าเอง'],['follow','ตามผู้เล่น','อยู่ห่างไม่เกิน 2 ช่อง'],['guard','คุ้มกัน','ยืนข้างผู้เล่น ตีตัวที่เข้าใกล้'],['focus','รุมเป้าเดียวกัน','ตีตัวที่ผู้เล่นโจมตีล่าสุด']];
function orderPanel(){let st=window.TacticsLab?.getState(),j=document.querySelector('#tacticsLayer .battle-journal');if(!st||!j)return;let has=st.units.some(u=>u.side==='ally'&&!u.controlled);let box=$id('allyOrders');
 if(!has){if(box)box.remove();return}if(!box){box=document.createElement('div');box.id='allyOrders';box.className='ally-orders';j.insertBefore(box,$id('endTurn'))}
 st.allyOrder||=s.village.allyOrder||'free';let ft=st.units.find(u=>u.id===st.lastTarget&&u.hp>0);
 box.innerHTML=`<b>คำสั่งเพื่อน</b><div>${ORDERS.map(([k,n,d])=>`<button data-order="${k}" class="${st.allyOrder===k?'on':''}" title="${d}">${n}</button>`).join('')}</div>${st.allyOrder==='focus'?`<small>เป้า: ${ft?ft.name:'ยังไม่ได้โจมตี (เลือกเองชั่วคราว)'}</small>`:''}`;
 box.onclick=e=>{let b=e.target.closest('[data-order]');if(!b)return;st.allyOrder=b.dataset.order;s.village.allyOrder=st.allyOrder;save();orderPanel()}}
const baseOpenT=openTactical;openTactical=function(o){baseOpenT(o);setTimeout(orderPanel,50)};
const nt2=TacticsCore.nextTurn;TacticsCore.nextTurn=function(st){nt2(st);setTimeout(orderPanel,30)};
document.addEventListener('click',e=>{if(e.target.closest?.('#tacticsLayer .tactics-hand, #battleCanvas'))setTimeout(orderPanel,60)});
window.openTactical=openTactical;window.closeTactical=closeTactical;
})();
// Keep the quest pill just under the location title (it used to cover long titles).
(function(){const fit=()=>{let w=document.getElementById('world'),t=document.getElementById('placeTitle');if(!w||!t)return;let top=t.getBoundingClientRect().bottom-w.getBoundingClientRect().top+6;if(top>10)w.style.setProperty('--quest-top',Math.round(top)+'px')};const base=render;render=function(){base();fit()};window.addEventListener('resize',fit);fit()})();
