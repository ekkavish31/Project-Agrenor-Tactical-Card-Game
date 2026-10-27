/* Pure entity index for Asset Studio. No game state or files are changed. */
(function(root){
 'use strict';
 root.STUDIO_ENEMIES={
  "straw": {
    "name": "ทหารฟาง",
    "art": "enemy-straw-soldier",
    "rank": "normal"
  },
  "archer": {
    "name": "พลธนูฟาง",
    "art": "enemy-straw-archer",
    "rank": "normal"
  },
  "captain": {
    "name": "หัวหน้าหุ่นฟาง",
    "art": "enemy-straw-captain",
    "rank": "miniboss"
  },
  "wolf": {
    "name": "หมาป่า",
    "art": "enemy-wolf",
    "rank": "normal"
  },
  "bandit": {
    "name": "โจรป่า",
    "art": "enemy-bandit",
    "rank": "normal"
  },
  "poacher": {
    "name": "นักล่าเถื่อน",
    "art": "enemy-poacher",
    "rank": "normal"
  },
  "shadowWolf": {
    "name": "หมาป่าเงา",
    "art": "enemy-shadow-wolf",
    "rank": "elite"
  },
  "alpha": {
    "name": "จ่าฝูงหมาป่า",
    "art": "enemy-alpha",
    "rank": "miniboss"
  },
  "treant": {
    "name": "พฤกษาเฒ่าคลั่ง",
    "art": "enemy-treant",
    "rank": "boss"
  },
  "bat": {
    "name": "ค้างคาวถ้ำ",
    "art": "enemy-bat",
    "rank": "normal"
  },
  "kobold": {
    "name": "โคโบลด์ขุดแร่",
    "art": "enemy-kobold",
    "rank": "normal"
  },
  "slime": {
    "name": "สไลม์แร่",
    "art": "enemy-slime",
    "rank": "normal"
  },
  "foreman": {
    "name": "หัวหน้าคนงานโคโบลด์",
    "art": "enemy-kobold-foreman",
    "rank": "elite"
  },
  "golem": {
    "name": "โกเล็มหิน",
    "art": "enemy-golem",
    "rank": "miniboss"
  },
  "crystalKing": {
    "name": "ราชาโกเล็มผลึก",
    "art": "enemy-crystal-king",
    "rank": "boss"
  },
  "bogSlime": {
    "name": "สไลม์บึง",
    "art": "enemy-bog-slime",
    "rank": "normal"
  },
  "mireBat": {
    "name": "ค้างคาวหมอก",
    "art": "enemy-mire-bat",
    "rank": "normal"
  },
  "bogHunter": {
    "name": "พรานบึง",
    "art": "enemy-bog-hunter",
    "rank": "normal"
  },
  "swampWitch": {
    "name": "แม่มดหนองน้ำ",
    "art": "enemy-swamp-witch",
    "rank": "elite"
  },
  "mudTroll": {
    "name": "โทรลล์โคลน",
    "art": "enemy-mud-troll",
    "rank": "miniboss"
  },
  "bogHydra": {
    "name": "ไฮดราบึงพิษ",
    "art": "enemy-bog-hydra",
    "rank": "boss"
  },
  "pirate": {
    "name": "โจรสลัด",
    "art": "enemy-pirate",
    "rank": "normal"
  },
  "gull": {
    "name": "นกนางนวลยักษ์",
    "art": "enemy-gull",
    "rank": "normal"
  },
  "seaSlime": {
    "name": "สไลม์ทะเล",
    "art": "enemy-sea-slime",
    "rank": "normal"
  },
  "corsair": {
    "name": "มือปืนสลัด",
    "art": "enemy-corsair",
    "rank": "elite"
  },
  "captainHook": {
    "name": "กัปตันตะขอ",
    "art": "enemy-pirate-captain",
    "rank": "miniboss"
  },
  "coralGolem": {
    "name": "โกเล็มปะการัง",
    "art": "enemy-coral-golem",
    "rank": "boss"
  },
  "iceWolf": {
    "name": "หมาป่าหิมะ",
    "art": "enemy-ice-wolf",
    "rank": "normal"
  },
  "frostSlime": {
    "name": "สไลม์เยือกแข็ง",
    "art": "enemy-frost-slime",
    "rank": "normal"
  },
  "snowKobold": {
    "name": "โคโบลด์หิมะ",
    "art": "enemy-snow-kobold",
    "rank": "normal"
  },
  "frostWolf": {
    "name": "จ่าฝูงน้ำแข็ง",
    "art": "enemy-frost-wolf",
    "rank": "elite"
  },
  "yeti": {
    "name": "เยติ",
    "art": "enemy-yeti",
    "rank": "miniboss"
  },
  "frostQueen": {
    "name": "ราชินีผลึกน้ำแข็ง",
    "art": "enemy-frost-queen",
    "rank": "boss"
  },
  "skeleton": {
    "name": "โครงกระดูกทหาร",
    "art": "enemy-skeleton",
    "rank": "normal"
  },
  "wisp": {
    "name": "ดวงวิญญาณ",
    "art": "enemy-wisp",
    "rank": "normal"
  },
  "cultist": {
    "name": "สาวกลัทธิมืด",
    "art": "enemy-cultist",
    "rank": "normal"
  },
  "ghostKnight": {
    "name": "อัศวินวิญญาณ",
    "art": "enemy-ghost-knight",
    "rank": "elite"
  },
  "gargoyle": {
    "name": "การ์กอยล์",
    "art": "enemy-gargoyle",
    "rank": "miniboss"
  },
  "voidKing": {
    "name": "ราชาแห่งความว่างเปล่า",
    "art": "enemy-void-king",
    "rank": "boss"
  }
};
 const groups={illust:'Illust',objects:'Objects',characters:'ตัวละคร',monsters:'มอนสเตอร์',bosses:'มินิบอส / บอส'};
 const aliases={'straw-soldier':'straw','straw-archer':'archer','straw-captain':'captain','kobold-foreman':'foreman','pirate-captain':'captainHook'};
 const camel=s=>s.replace(/-([a-z])/g,(_,c)=>c.toUpperCase());
 function enemyMetadata(source){
  let out={};
  // Extract only declarative fields; never execute scripts from a selected game.
  for(let line of source.split('\n')){
   let id=line.match(/^\s*(\w+):\{name:['"]([^'"]+)['"]/),art=line.match(/\bart:['"]([^'"]+)['"]/);
   if(!id||!art)continue;
   out[id[1]]={name:id[2],art:art[1],rank:line.match(/\brank:['"]([^'"]+)['"]/)?.[1]||'normal'};
  }
  return out;
 }
 function jsonAssignment(source,name){
  let at=source.indexOf(name),eq=source.indexOf('=',at);
  if(at<0||eq<0)throw new Error('ไม่พบ '+name);
  let start=source.indexOf('{',eq),depth=0,quoted=false,escape=false;
  if(start<0)throw new Error('ไม่พบ object ของ '+name);
  for(let i=start;i<source.length;i++){let c=source[i];if(quoted){if(escape)escape=false;else if(c==='\\')escape=true;else if(c==='"')quoted=false;continue}if(c==='"'){quoted=true;continue}if(c==='{')depth++;else if(c==='}'&&!--depth)return JSON.parse(source.slice(start,i+1))}
  throw new Error('ข้อมูล '+name+' ไม่ครบ');
 }
 function owner(a,meta={}){
  if(a.studioOwner&&groups[a.studioOwner.group])return {...a.studioOwner};
  let id=a.id||'',cat=a.category||'',key=null;
  if(a.enemy)key=a.enemy;
  else if(id.startsWith('card-en-'))key=id.slice(8);
  else if(cat==='enemies'){
   let base=id.replace(/-back$/,'');
   key=Object.keys(meta).find(k=>meta[k].art===base)||aliases[base.slice(6)]||camel(base.replace(/^enemy-/,''));
  }else if(/^char-scarecrow/.test(id))key='dummy';
  if(key){let m=meta[key]||{};return {id:'enemy:'+key,name:m.name||key,group:['miniboss','boss'].includes(m.rank)?'bosses':'monsters',rank:m.rank||'normal'}}
  let ally=id.match(/^(?:ally-|card-u-)([a-z]+)$/)||id.match(/^tactics-(luna|bram|kier|mil)-/);
  if(ally)return {id:'ally:'+ally[1],name:ally[1][0].toUpperCase()+ally[1].slice(1),group:'characters'};
  if(['hero-frames','tactics-hero','village-idle','characters'].includes(cat)||id==='card-hero')return {id:'hero',name:'ตัวหลัก · Hero',group:'characters'};
  if(['scenes','village-map'].includes(cat))return {id:'illust:'+id,name:a.studioName||id,group:'illust'}; // v91.37: big scene / cutscene pictures
  let base=id.replace(/-views$/,'').replace(/^ground-anim-/,'ground-');
  return {id:'object:'+base,name:a.studioName||base,group:'objects'};
 }
 function staticClip(a){
  let d=a.view||a.id.match(/-(se|sw|ne|nw|s|n|e|w)-/i)?.[1]?.toUpperCase()||'—';
  let action=a.pose||a.id.match(/-(idle|windup|strike|guard|hit|down)$/)?.[1]||'ภาพนิ่ง';
  let f={assetId:a.id,file:a.file,cell:0,crop:null,ms:a.ms||1000,flip:!!a.sourceFlip,pivot:a.pivot||a.anchor||[.5,.95],renderHeight:a.renderHeight||1,revision:a.artRevision||'',size:a.size||[384,384]};
  return {id:'static:'+a.id,canonical:a.id,action,view:d,loop:true,kind:'static',frames:[f]};
 }
 function build(manifest,clips,meta={}){
  const assets=manifest.assets||[],active=assets.filter(a=>a.status!=='unused'),byId=new Map(active.map(a=>[a.id,a])),entities=new Map();
  for(let a of active){let o=owner(a,meta);if(!entities.has(o.id))entities.set(o.id,{...o,assets:[],clips:[]});entities.get(o.id).assets.push(a)}
  let used=new Set();
  for(let c of clips){let a=c.frames.map(f=>byId.get(f.assetId)).find(Boolean);if(!a)continue;let e=entities.get(owner(a,meta).id);if(!e)continue;
   // Objects own individual sheets; do not put all animated ground under one entry.
   let cc={...c,entity:e.id,label:e.name};e.clips.push(cc);c.frames.forEach(f=>used.add(f.assetId));
  }
  for(let e of entities.values())for(let a of e.assets){if(used.has(a.id)||!a.file)continue;if(e.id==='hero'&&/(?:walk|run)/i.test([a.id,a.clip,a.pose].join(' ')))continue;e.clips.push({...staticClip(a),entity:e.id,label:e.name})}
  return [...entities.values()].sort((a,b)=>a.name.localeCompare(b.name,'th',{numeric:true}));
 }
 root.StudioCatalog={groups,owner,build,enemyMetadata,jsonAssignment};
 if(typeof module==='object'&&module.exports)module.exports=root.StudioCatalog;
})(globalThis);
