// v15: 9 craftable weapons (+ shield). Recipes join the forge list; images: assets/sword.webp, assets/hammer.webp, assets/weapons/<kind>.webp
// (placeholder icons until the generated art arrives — ids weapon-<kind> in Asset Studio)
(function(){
const ADD={
 knife:{name:'มีดสั้น',kind:'knife',level:1,cost:{iron:1,coal:1,wood:1},sell:22,xp:15},
 spear:{name:'หอก',kind:'spear',level:1,cost:{iron:2,coal:1,wood:2},sell:34,xp:20},
 bow:{name:'ธนู',kind:'bow',level:2,cost:{iron:1,wood:3},sell:40,xp:25},
 staff:{name:'ไม้เท้าเวท',kind:'staff',level:2,cost:{iron:1,coal:1,wood:3},sell:38,xp:25},
 axe:{name:'ขวาน',kind:'axe',level:2,cost:{iron:3,coal:1,wood:2},sell:46,xp:28},
 rapier:{name:'เรเปียร์',kind:'rapier',level:3,cost:{iron:3,coal:2},sell:60,xp:32},
 tome:{name:'คัมภีร์แสง',kind:'tome',level:3,cost:{iron:1,coal:2,wood:2},sell:55,xp:32}};
if(typeof RECIPES!=='undefined')for(let [k,r] of Object.entries(ADD))RECIPES[k]||=r;
window.weaponImg=k=>k==='sword'||k==='hammer'?'assets/'+k+'.webp':'assets/weapons/'+(k||'sword')+'.webp';
window.weaponName=x=>!x?'':(typeof RECIPES!=='undefined'&&RECIPES[x.recipe||x.kind]?.name)||{sword:'ดาบเหล็ก',hammer:'ค้อนเหล็ก'}[x.kind]||x.kind;
})();
