// v07: companions and expeditions.
// • Companions are hired at the market ("หาเพื่อนร่วมทาง"), level up from expeditions (max Lv.10)
//   and fight automatically in the grid battle. Saved in s.village.companions.
// • Expeditions start from village-map exits: ทางตะวันออก → ป่าตะวันออก (ล้มศัตรูทั้งหมด),
//   ทางเหนือ → เหมืองหินร้าง (ล้มหัวหน้า). 30 minutes to walk out, 30 back.
(function(){
const ROSTER={
 luna:{name:'ลูน่า',role:'นักเวท · ไม้เท้า ยิงไกล 4 ช่อง',weapon:'staff',shield:false,hp:44,cost:60},
 bram:{name:'บรัม',role:'นักรบค้อน · ค้อนและโล่',weapon:'hammer',shield:true,hp:54,cost:55},
 kier:{name:'เคียร์',role:'นักดาบ · ดาบเหล็ก',weapon:'sword',shield:false,hp:48,cost:50},
 mil:{name:'มิล',role:'นักดาบรุ่นน้อง · ดาบเหล็ก',weapon:'sword',shield:false,hp:42,cost:40}};
const MAX_LV=10,xpNeed=lv=>lv*80;
function list(){if(!Array.isArray(s.village.companions))s.village.companions=[];return s.village.companions}
// v13: companions can carry a weapon you forged (moved out of your bag while equipped)
const CAN_EQUIP={luna:['staff','tome'],bram:['hammer','axe','sword'],kier:['sword','rapier','spear','axe'],mil:['sword','knife','rapier','bow']};
function gearBonus(g){return g?g.quality*2+(g.recipe==='tempered'?3:0):0}
function gearName(g){return g?(typeof RECIPES!=='undefined'&&RECIPES[g.recipe||g.kind]?.name||g.kind)+' ★'+g.quality:''}
function stats(c){let r=ROSTER[c.key],lv=c.level||1,g=c.gear&&(CAN_EQUIP[c.key]||[]).includes(c.gear.kind)?c.gear:null;return {key:c.key,name:r.name,weapon:g?g.kind:r.weapon,shield:r.shield,maxHp:r.hp+(lv-1)*6,bonus:(lv-1)*2+gearBonus(g),level:lv,gear:g?gearName(g):''}}
window.equipCompanion=(k,id)=>{let c=list().find(x=>x.key===k),j=s.inventory.findIndex(x=>x.id===id);if(!c||j<0||s.equipped===id||!(CAN_EQUIP[k]||[]).includes(s.inventory[j].kind))return;if(c.gear)s.inventory.push(c.gear);c.gear=s.inventory.splice(j,1)[0];s.log=ROSTER[k].name+' ถือ '+gearName(c.gear)+' แล้ว';save();render();renderRecruit()};
window.unequipCompanion=k=>{let c=list().find(x=>x.key===k);if(!c?.gear)return;s.inventory.push(c.gear);c.gear=null;save();render();renderRecruit()};
function gearBox(k,c){let sig=window.TacticsDecks?.SIGNATURE?.[k],sn=sig?'<p class="small">การ์ดเฉพาะตัว: <b>'+TacticsDecks.COMBAT[sig].name+'</b></p>':'';return sn+gearBox2(k,c)}
function gearBox2(k,c){let can=CAN_EQUIP[k]||[];if(!can.length)return '<p class="small muted">ใช้ไม้เท้าเวทของตัวเอง (ถืออาวุธคราฟต์ไม่ได้)</p>';let opts=s.inventory.filter(x=>can.includes(x.kind)&&x.id!==s.equipped);
 return `<div class="comp-gear"><p class="small">อาวุธ: <b>${c.gear?gearName(c.gear)+' (+'+gearBonus(c.gear)+')':'อาวุธประจำตัว'}</b>${c.gear?` <button class="mini-btn" onclick="unequipCompanion('${k}')">ถอด</button>`:''}</p>${opts.length?`<select onchange="if(this.value)equipCompanion('${k}',+this.value)"><option value="">ให้ถืออาวุธที่ตีเอง…</option>${opts.map(x=>`<option value="${x.id}">${gearName(x)} · +${gearBonus(x)}</option>`).join('')}</select>`:'<p class="small muted">ยังไม่มีดาบ/ค้อนในกระเป๋าให้ถือ</p>'}</div>`}
window.Companions={ROSTER,CAN_EQUIP,gearName,
 party(){return list().slice(0,4).map(stats)},
 reward(st){let out=[];for(let c of list().slice(0,4)){let u=st.units.find(x=>x.key===c.key),xp=u&&u.hp>0?50:35,before=c.level||1;c.xp=(c.xp||0)+xp;c.level=before;while(c.level<MAX_LV&&c.xp>=xpNeed(c.level)){c.xp-=xpNeed(c.level);c.level++}out.push({name:ROSTER[c.key].name,xp,level:c.level,levelUp:c.level>before})}save();return out}};
// ---------- market: hire / party ----------
function renderRecruit(){let v=s.village,have=list();villageDialog('หาเพื่อนร่วมทาง',`<p class="muted small">จ้างครั้งเดียว อยู่ด้วยถาวร • ร่วมการออกสำรวจได้สูงสุด 4 คน (สู้เองอัตโนมัติ) • ได้ EXP เมื่อออกสำรวจ เลเวลละ +6 HP / +2 พลังโจมตี</p><div class="currency-banner">◉ <strong>${v.coins} เหรียญ</strong></div>
 <div class="comp-grid">${Object.entries(ROSTER).map(([k,r])=>{let c=have.find(x=>x.key===k),st=c&&stats(c),art=(window.ASSET_MANIFEST?.assets||[]).find(a=>a.id==='ally-'+k&&['final','temp'].includes(a.status));
  return `<div class="comp-card ${c?'hired':''}">${art?`<img src="${art.file}" alt="">`:`<div class="comp-face">${r.name[0]}</div>`}<h3>${r.name}${c?` <small>Lv.${st.level}</small>`:''}</h3><p>${r.role}</p><p class="small">HP ${c?st.maxHp:r.hp}${c?` · โจมตี +${st.bonus} · EXP ${c.xp||0}/${xpNeed(st.level)}`:''}</p>${c?gearBox(k,c)+'<span class="order-seal">✓ ร่วมทีม</span>':elButton('จ้าง · ◉ '+r.cost,`hireCompanion('${k}')`,v.coins<r.cost||v.location!=='market')}</div>`}).join('')}</div>
 <p class="muted small">ภาพเพื่อนรายตัวใส่ได้ผ่าน Asset Studio (ally-luna / ally-bram / ally-kier / ally-mil)</p>`)}
window.hireCompanion=k=>{let r=ROSTER[k];if(!r||list().some(c=>c.key===k)||s.village.coins<r.cost||s.village.location!=='market')return;s.village.coins-=r.cost;list().push({key:k,level:1,xp:0});s.log=r.name+' เข้าร่วมทีมแล้ว';save();render();renderRecruit()};
const baseOpen=openPanel;openPanel=function(w){if(w==='recruit'){if(busy)return;renderRecruit();return}return baseOpen(w)};
const basePlace=placeActions;placeActions=function(){let a=basePlace();if(s.village.location==='market')a.push({id:'recruit',name:'หาเพื่อนร่วมทาง',image:'action-orders',kind:'panel',value:'recruit',cost:list().length+'/4 คน',effect:'จ้างเพื่อนออกสำรวจ'});return a};
// ---------- map exits → expeditions ----------
// v13: every village exit leads to an area (tier 1: forest / mine · tier 2: swamp / coast · tier 3: frost / ruins)
const AREA_OF={};for(let [k,A] of Object.entries(window.ADVENTURE_DATA?.AREAS||{}))if(A.exit)AREA_OF[A.exit]=k;
for(let [node,area] of Object.entries(AREA_OF)){let n=VILLAGE_NODES[node],A=window.ADVENTURE_DATA.AREAS[area];if(!n)continue;n.expedition=node;n.name=A.name+' · '+'★'.repeat(A.tier||1);n.live=true}
function expeditionBlock(){return s.mode==='battle'?'จบการฝึกก่อน':s.hp<20?'HP ต่ำกว่า 20 พักก่อนออกสำรวจ':s.minutes>1080?'เลย 18:00 แล้ว อันตรายเกินไป':s.fatigue>=85?'ความสดชื่นต่ำเกินไป':''}
async function startExpedition(node){let why=expeditionBlock();if(why){$('mapStatus').textContent='ออกสำรวจไม่ได้: '+why;return}
 let area=AREA_OF[node],AA=window.ADVENTURE_DATA.AREAS[area],party=Companions.party();if(!confirm(`ออกสำรวจ${AA.name}?\n\nแผนที่แตกกิ่งหลายเส้นทาง ปลายทางคือหัวหน้าพื้นที่\nทีม: คุณ${party.length?' + '+party.map(p=>p.name+' Lv.'+p.level).join(', '):' (ยังไม่มีเพื่อน — จ้างได้ที่ตลาด)'}\nเดินทางไป 30 นาที · เดินแต่ละจุด 10 นาที · กลับ 30 นาที\nแพ้: ถูกพากลับบ้าน เสีย 10% ของเหรียญ`))return;
 busy=true;stopIdle();let player=new FramePlayer($('mapRunner'));$('mapStatus').textContent='กำลังมุ่งหน้าไป'+AA.name;
 try{player.play('adventure.run',{loop:true});await runMapTo(mapPoint(node))}finally{player.stop();busy=false}
 s.minutes=Math.min(1200,s.minutes+30);save();$('panel').close();window.Adventure.enter(area)}
const baseChoose=chooseMapNode;chooseMapNode=function(k){if(VILLAGE_NODES[k]?.expedition&&!mapEditing){if(busy||mapDestination)return;return startExpedition(k)}return baseChoose(k)};
})();
