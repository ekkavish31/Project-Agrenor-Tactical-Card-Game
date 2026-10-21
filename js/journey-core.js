// Package v01: transactions shared by manual controls and automatic work.
function freshness(){return Math.max(0,Math.min(100,100-s.fatigue))}
function freshnessState(){let n=freshness();return n>=80?0:n>=60?1:n>=40?2:n>=20?3:4}
function cancelSmithWork(){let v=s.village,w=v.work;if(s.mode==='battle'||v.location!=='forge'||!w.started)return {ok:false,reason:'ไม่มีชิ้นงานให้ยกเลิก'};let iron=RECIPES[w.recipe].cost.iron||0;v.materials.iron+=iron;v.work={recipe:w.recipe,heat:0,shape:0,started:false};s.log='ยกเลิกงาน • คืนแท่งเหล็ก '+iron+' • ไม่คืนถ่านและไม้';save();return {ok:true,iron}}
function autoSmithStep(){if(s.mode==='battle'||s.village.location!=='forge')return {ok:false,reason:'ต้องอยู่โรงตีเหล็กนอกการต่อสู้'};let w=s.village.work,r=RECIPES[w.recipe];if(!w.started&&Object.entries(r.cost).some(([k,n])=>s.village.materials[k]<n))return {ok:false,reason:'วัตถุดิบไม่พอ • ยังไม่เริ่มงาน'};let i=w.shape>=100?2:w.heat<40?0:1;let [energy,minutes,fatigue]=[[6,15,3],[8,20,4],[4,10,2]][i];if(s.minutes+minutes>1200)return {ok:false,reason:'เวลาไม่พอ • เก็บชิ้นงานค้างไว้'};
if(s.fatigue+fatigue>100){if(s.village.materials.food<1)return {ok:false,reason:'ความสดชื่นไม่พอและเสบียงหมด • เก็บชิ้นงานไว้'};return {...restAtPlace('meal'),action:'meal'}}
if(s.stamina<energy)return {...restAtPlace('short'),action:'short'};
return {...smithAction(i),action:i};}
function bagStacks(){return Object.entries(MATERIALS).filter(([k])=>s.village.materials[k]>0).map(([k,m])=>({key:k,name:m.name,count:s.village.materials[k],image:'assets/item-'+k+'.webp'}))}
