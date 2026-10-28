// v94.02 · Companions for the training battle (TacticsCore) and the card / deck screens.
// The party is the one village party (s.village.party — recruited in the inn, js/world-state.js); the old market hire, the village-map exits
// and the area expeditions were deleted. Level and XP still grow from training fights and stay on the party member.
(function(){
const ROSTER={
 luna:{name:'ลูน่า',role:'นักเวท · ไม้เท้า ยิงไกล 4 ช่อง',weapon:'staff',shield:false,hp:44,cost:60},
 bram:{name:'บรัม',role:'นักรบค้อน · ค้อนและโล่',weapon:'hammer',shield:true,hp:54,cost:55},
 kier:{name:'เคียร์',role:'นักดาบ · ดาบเหล็ก',weapon:'sword',shield:false,hp:48,cost:50},
 mil:{name:'มิล',role:'นักดาบรุ่นน้อง · ดาบเหล็ก',weapon:'sword',shield:false,hp:42,cost:40}};
const MAX_LV=10,xpNeed=lv=>lv*80;
function list(){if(!Array.isArray(s.village.party))s.village.party=[];return s.village.party.filter(c=>ROSTER[c.key]||FALLBACK[c.key])}
// recruits who joined in the inn but have no old training-battle sprite: fight as a sword/axe/bow fighter
const FALLBACK={sigrid:{name:'ซิกริด',role:'ทหารรับจ้าง',weapon:'axe',shield:false,hp:60},ren:{name:'เรน',role:'นักธนู',weapon:'bow',shield:false,hp:40},olwen:{name:'โอลเวน',role:'จอมเวท',weapon:'staff',shield:false,hp:36},nadia:{name:'นาเดีย',role:'นักย่องเบา',weapon:'knife',shield:false,hp:42},orla:{name:'ซิสเตอร์ออร์ลา',role:'นักบวช',weapon:'tome',shield:false,hp:40},berg:{name:'นายพรานเบิร์ก',role:'นายพราน',weapon:'bow',shield:false,hp:50}};
// v13: companions can carry a weapon you forged (moved out of your bag while equipped)
const CAN_EQUIP={luna:['staff','tome'],bram:['hammer','axe','sword'],kier:['sword','rapier','spear','axe'],mil:['sword','knife','rapier','bow']};
function gearBonus(g){return g?g.quality*2+(g.recipe==='tempered'?3:0):0}
function gearName(g){return g?(typeof RECIPES!=='undefined'&&RECIPES[g.recipe||g.kind]?.name||g.kind)+' ★'+g.quality:''}
function stats(c){let r=ROSTER[c.key]||FALLBACK[c.key],lv=c.level||1,g=c.gear&&(CAN_EQUIP[c.key]||[]).includes(c.gear.kind)?c.gear:null;return {key:c.key,name:r.name,weapon:g?g.kind:r.weapon,shield:r.shield,maxHp:r.hp+(lv-1)*6,bonus:(lv-1)*2+gearBonus(g),level:lv,gear:g?gearName(g):''}}
window.Companions={ROSTER,CAN_EQUIP,gearName,
 party(){return list().slice(0,4).map(stats)},
 reward(st){let out=[];for(let c of list().slice(0,4)){let r=ROSTER[c.key]||FALLBACK[c.key],u=st.units.find(x=>x.key===c.key),xp=u&&u.hp>0?50:35,before=c.level||1;c.xp=(c.xp||0)+xp;c.level=before;while(c.level<MAX_LV&&c.xp>=xpNeed(c.level)){c.xp-=xpNeed(c.level);c.level++}out.push({name:r.name,xp,level:c.level,levelUp:c.level>before})}save();return out}};
})();
