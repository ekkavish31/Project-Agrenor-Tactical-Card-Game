/* Independent retained hands. Used cards enter discard; CT refills to 4 walk / 6 combat.
   v53 crystals: every turn has 3 action crystals shared by walking, combat cards and items; each kind max 2 per turn. */
(function(root){'use strict';
const MOVE={step:{name:'ก้าวระวัง',move:2,stamina:0},walk:{name:'เดินหน้า',move:4,stamina:0},run:{name:'วิ่ง',move:6,stamina:8},sprint:{name:'เร่งวิ่ง',move:8,stamina:16},dash:{name:'พุ่งตัว',move:5,stamina:4},creep:{name:'ย่องเงียบ',move:3,stamina:0}};
const COMBAT={thunder:{name:'อัสนีบาต'},attack:{name:'โจมตีด้วยอาวุธ'},skill:{name:'ท่าโจมตีหนัก'},guard:{name:'ตั้งรับ'},rest:{name:'ตั้งลมหายใจ'},spell:{name:'ลูกศรเวท'},push:{name:'ผลักกระแทก'},pull:{name:'ตะขอดึง'},line:{name:'แทงทะลวง'},frost:{name:'หอกน้ำแข็ง',owner:'luna'},wall:{name:'กำแพงโล่',owner:'bram'},whirl:{name:'ดาบหมุน',owner:'kier'},twin:{name:'สองคมต่อเนื่อง',owner:'mil'},flame:{name:'ฟันเพลิง'},gust:{name:'ลมกรรโชก'},mend:{name:'สมานแผล'},quake:{name:'ทุบธรณี'},aimed:{name:'เล็งจุดตาย'},backstab:{name:'แทงข้างหลัง'},dive:{name:'กระโจนฟาด'},tide:{name:'คลื่นซัด'},formation:{name:'จู่โจมประสาน'},counter:{name:'ท่าสวนกลับ',reaction:true},evade:{name:'ก้าวหลบ',reaction:true},firstAid:{name:'ยาฉุกเฉิน',reaction:true},ambush:{name:'ซุ่มโจมตี',reaction:true}};
const SIGNATURE={luna:'frost',bram:'wall',kier:'whirl',mil:'twin'};
function defaultFor(key){let d=JSON.parse(JSON.stringify(DEFAULT)),sig=SIGNATURE[key];if(sig){d.combat.attack-=4;d.combat[sig]=4}return d}
// a card that belongs to another character is not allowed in this deck
function allowed(id,key){let o=COMBAT[id]?.owner;return !o||o===key}
const DEFAULT={movement:{step:6,walk:10,run:8,sprint:6},combat:{attack:9,skill:8,guard:8,rest:8,spell:6,push:4,pull:3,line:3,backstab:2,dive:2,tide:1,formation:2,counter:1,evade:1,firstAid:1,ambush:1}};
function validate(config){if(!config||typeof config!=='object')throw Error('ข้อมูลสำรับไม่ถูกต้อง');let out={};for(let [group,pool,total]of [['movement',MOVE,30],['combat',COMBAT,60]]){let counts=config[group];if(!counts||Object.keys(counts).some(id=>!pool[id]))throw Error('มีไพ่ที่ไม่รู้จัก');let sum=0;out[group]={};for(let id of Object.keys(pool)){let n=counts[id]??0;if(!Number.isInteger(n)||n<0||n>total)throw Error('จำนวนไพ่ต้องเป็นจำนวนเต็ม 0–'+total);out[group][id]=n;sum+=n}if(sum!==total)throw Error((group==='movement'?'สำรับเคลื่อนที่':'สำรับต่อสู้')+' ต้องมี '+total+' ใบ (ตอนนี้ '+sum+')')}return out}
function shuffle(cards,rng){let a=[...cards];for(let i=a.length-1;i>0;i--){let j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function pile(counts,rng){let all=[];for(let [id,n]of Object.entries(counts))for(let i=0;i<n;i++)all.push({id,uid:id+'-'+i,used:false});return {draw:shuffle(all,rng),discard:[],hand:[],cycles:0}}
function event(d,type,group,cards){if(!cards.length)return;(d.cardEvents||=[]).push({type,group,cards:cards.map(c=>({...c})),seq:d.cardSeq=(d.cardSeq||0)+1});}
function draw(d,group,n,rng){let p=d[group],cards=[];while(p.hand.length<n){if(!p.draw.length){if(!p.discard.length)break;p.draw=shuffle(p.discard.map(c=>({...c,used:false})),rng);p.discard=[];p.cycles++;event(d,'shuffle',group,p.draw)}let c=p.draw.pop();c.used=false;p.hand.push(c);cards.push(c)}event(d,'draw',group,cards)}
const MOVE_HAND=4,CRYSTALS=3,PER_KIND=2;
// crystals left this turn and why an action kind is unavailable ('' = allowed)
function spent(d){return (d?.moveUsed||0)+(d?.combatUsed||0)+(d?.itemUsed||0)}
function crystals(d){return Math.max(0,CRYSTALS-spent(d))}
function actionBlock(d,kind){if(!d)return 'ยังไม่พร้อม';if(crystals(d)<=0)return 'คริสตัลหมดแล้วในเทิร์นนี้';let n=kind==='move'?d.moveUsed:kind==='item'?(d.itemUsed||0):d.combatUsed;if(n>=PER_KIND)return (kind==='move'?'เดิน':kind==='item'?'ใช้ไอเทม':'ใช้ไพ่ต่อสู้')+'ครบ '+PER_KIND+' ครั้งแล้วในเทิร์นนี้';return ''}
function consumeItem(d){if(actionBlock(d,'item'))return false;d.itemUsed=(d.itemUsed||0)+1;return true}
// v53 auto walk: the cards for a walk of `cost` tiles — the smallest single card that reaches, else the tightest pair.
// `lock` = hand indexes the player pinned (1 or 2). Returns {cards:[index…]} or null.
function walkPlan(d,hero,cost,lock=[]){let free=d.movement.hand.map((c,i)=>({i,def:MOVE[c.id],c})).filter(x=>!x.c.used&&x.def),okSt=list=>list.reduce((s,x)=>s+x.def.stamina,0)<=hero.stamina;
 const one=!actionBlock(d,'move'),two=one&&d.moveUsed===0&&crystals(d)>=2;let locked=lock.map(i=>free.find(x=>x.i===i)).filter(Boolean);
 if(locked.length){let sum=locked.reduce((s,x)=>s+x.def.move,0);if(locked.length===2&&!two||!one)return null;if(sum>=cost&&okSt(locked))return {cards:locked.map(x=>x.i)};if(locked.length===1&&two){let best=null;for(const y of free)if(y!==locked[0]&&locked[0].def.move+y.def.move>=cost&&okSt([locked[0],y])&&(!best||y.def.move<best.def.move))best=y;return best?{cards:[locked[0].i,best.i]}:null}return null}
 if(!one)return null;let singles=free.filter(x=>x.def.move>=cost&&okSt([x])).sort((a,b)=>a.def.move-b.def.move||a.def.stamina-b.def.stamina);if(singles.length)return {cards:[singles[0].i]};
 if(!two)return null;let best=null;for(let a=0;a<free.length;a++)for(let b=a+1;b<free.length;b++){let p=[free[a],free[b]],sum=p[0].def.move+p[1].def.move,st=p[0].def.stamina+p[1].def.stamina;if(sum<cost||!okSt(p))continue;if(!best||sum<best.sum||sum===best.sum&&st<best.st)best={sum,st,p}}
 return best?{cards:best.p.sort((a,b)=>b.def.move-a.def.move).map(x=>x.i)}:null}
// the reach to show: blue = best single card, yellow = best pair (respecting locks and stamina)
function walkRange(d,hero,lock=[]){let free=d.movement.hand.map((c,i)=>({i,def:MOVE[c.id],c})).filter(x=>!x.c.used&&x.def&&x.def.stamina<=hero.stamina),one=!actionBlock(d,'move'),two=one&&d.moveUsed===0&&crystals(d)>=2;if(!one||!free.length)return {blue:0,yellow:0};
 let locked=lock.map(i=>free.find(x=>x.i===i)).filter(Boolean);if(locked.length===2)return two?{blue:0,yellow:locked[0].def.move+locked[1].def.move,locked:true}:{blue:0,yellow:0};
 let first=locked[0]||free.slice().sort((a,b)=>b.def.move-a.def.move)[0],blue=first.def.move,yellow=0;
 if(two)for(const y of free)if(y!==first&&first.def.stamina+y.def.stamina<=hero.stamina)yellow=Math.max(yellow,blue+y.def.move);return {blue,yellow,locked:!!locked.length}}
function create(config,rng){let c=validate(config),d={movement:pile(c.movement,rng),combat:pile(c.combat,rng),moveUsed:0,combatUsed:0,itemUsed:0,moveLock:[],cardSeq:0,cardEvents:[]};draw(d,'movement',MOVE_HAND,rng);draw(d,'combat',6,rng);return d}
function commitMovement(d){let p=d.movement,used=p.hand.filter(c=>c.used);p.hand=p.hand.filter(c=>!c.used);p.discard.push(...used.map(c=>({...c,used:false})));event(d,'discard','movement',used);d.pendingMove=null;if(used.length&&!d._turnSwap)draw(d,'movement',MOVE_HAND,Math.random)}
function next(d,rng){d._turnSwap=true;commitMovement(d);d._turnSwap=false;for(let group of ['movement','combat']){let p=d[group],used=p.hand.filter(c=>c.used);p.hand=p.hand.filter(c=>!c.used);p.discard.push(...used.map(c=>({...c,used:false})));event(d,'discard',group,used);draw(d,group,group==='movement'?MOVE_HAND:6,rng)}d.moveUsed=0;d.combatUsed=0;d.itemUsed=0;d.doubleMove=false;d.pendingMove=null;d.moveLock=[]}
function selectMove(d,hero,index){let card=d.movement.hand[index];if(!card||card.used)return {ok:false,reason:'ใช้ไพ่ใบนี้ไปแล้ว'};let why=actionBlock(d,'move');if(why)return {ok:false,reason:why};let def=MOVE[card.id];if(hero.stamina<def.stamina)return {ok:false,reason:'แรงไม่พอสำหรับไพ่ใบนี้'};card.used=true;d.moveUsed++;hero.mp+=def.move;hero.stamina-=def.stamina;return {ok:true,card:def}}
function canCombat(d,index){let c=d.combat.hand[index];return !!c&&!c.used&&!actionBlock(d,'combat')}
function consumeCombat(d,index){if(!canCombat(d,index))return false;let c=d.combat.hand.splice(index,1)[0];d.combat.discard.push({...c,used:false});event(d,'discard','combat',[c]);commitMovement(d);d.combatUsed++;draw(d,'combat',6,Math.random);return true}// v73: a fresh card replaces the one just played
root.TacticsDecks={MOVE,COMBAT,DEFAULT,SIGNATURE,MOVE_HAND,CRYSTALS,PER_KIND,defaultFor,allowed,validate,shuffle,create,next,commitMovement,selectMove,canCombat,consumeCombat,consumeItem,spent,crystals,actionBlock,walkPlan,walkRange};if(typeof module!=='undefined'&&module.exports)module.exports=root.TacticsDecks;
})(typeof globalThis!=='undefined'?globalThis:this);
