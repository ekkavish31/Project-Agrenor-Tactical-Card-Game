/* Pure tactical rules (v06): several units per side, two decks for the hero, AI companions and enemies.
   No village save or DOM access — the bridge (tactics-bridge.js) moves results into the game. */
(function(root){
'use strict';
const SIZE=19;
const WEAPONS={sword:{name:'ดาบเหล็ก',range:1,damage:18,stamina:12},hammer:{name:'ค้อนเหล็ก',range:1,damage:24,stamina:18},staff:{name:'ไม้เท้าเวท',range:4,damage:15,stamina:14},unarmed:{name:'มือเปล่า',range:1,damage:10,stamina:6},knife:{name:'มีดสั้น',range:1,damage:12,stamina:7},spear:{name:'หอก',range:2,damage:16,stamina:12},rapier:{name:'เรเปียร์',range:1,damage:15,stamina:9},bow:{name:'ธนู',range:5,damage:13,stamina:10},axe:{name:'ขวาน',range:1,damage:20,stamina:14},tome:{name:'คัมภีร์แสง',range:3,damage:9,stamina:8}};
// v15 weapon traits (shown in the deck builder / forge) — every weapon plays differently on the grid
const WEAPON_TRAITS={sword:'สมดุล ไม่มีจุดอ่อน',hammer:'ทำลายเกราะของเป้าหมาย',spear:'ระยะ 2 · แทงข้ามช่องได้',rapier:'เร็ว · โดนตีประชิดมีโอกาสสวนกลับ 35%',knife:'ตีจากด้านหลังศัตรู +50%',staff:'เวทระยะ 4 · ไม่โดนลดจากที่กำบัง',bow:'ระยะ 5 · ยืนที่สูงได้โบนัสสองเท่า · ศัตรูประชิดแล้วแรงลดครึ่ง',axe:'ฟันกวาด โดนศัตรูข้างเป้าอีกตัว (50%) · ฟันหญ้าสูงโล่ง',tome:'การ์ดท่าหนักกลายเป็นรักษาเพื่อนระยะ 3',unarmed:'เร็ว แรงน้อย'};
// Combat card rules. "attack"/"skill" follow the held weapon; "spell" is a ranged bolt for any weapon.
// ---------- v11b: elements, terrain, traits ----------
const ELEMENT_NAMES={fire:'ไฟ',water:'น้ำ',light:'แสง',dark:'มืด',wind:'ลม',ice:'น้ำแข็ง',earth:'ดิน',nature:'ธรรมชาติ',chaos:'โกลาหล',fusion:'ผสาน',lightning:'สายฟ้า'};
// Prototype combat affinities, not a claim about Agrenor canon. Unknown/chaos/fusion stay neutral.
const ELEMENT_AFFINITY={fire:{weak:['water','earth'],resist:['fire','ice']},water:{weak:['lightning','nature'],resist:['water','fire']},earth:{weak:['water','nature'],resist:['earth','lightning']},wind:{weak:['ice'],resist:['wind','earth']},ice:{weak:['fire','earth'],resist:['ice','water']},nature:{weak:['fire','wind'],resist:['nature','water']},light:{weak:['dark'],resist:['light']},dark:{weak:['light'],resist:['dark']},lightning:{weak:['earth'],resist:['lightning','wind']}};
function affinity(target,element){let natural=target.element||WEAPON_ELEMENT[target.weapon],rule=ELEMENT_AFFINITY[natural];return rule?.weak.includes(element)?20:rule?.resist.includes(element)?-15:0}

const WEAPON_ELEMENT={bow:'wind',axe:'earth',tome:'light',sword:'fire',hammer:'earth',staff:'fusion',unarmed:'earth',knife:'wind',spear:'wind',rapier:'water'};
// cost = move points to enter · hide = share of the body hidden · def = flat damage change · boost/weak/resist = element ±25%
const TERRAIN={
 grass:{name:'หญ้า',cost:1},path:{name:'ทางดิน',cost:1},stairs:{name:'บันไดหิน',cost:1,note:'ทางขึ้นเนินหิน'},stone:{name:'พื้นหิน',cost:1,boost:['earth']},cave:{name:'พื้นถ้ำ',cost:1,boost:['earth']},rail:{name:'รางรถแร่',cost:1},
 tallgrass:{name:'หญ้าสูง',cost:2,hide:.34,def:2,rangedCover:true,boost:['nature'],weak:['fire'],light:true,note:'ป้องกัน +2 · ยิงไกลเข้ามา −25% · ไฟแรงขึ้นและเผาหญ้า'},
 mud:{name:'บ่อโคลน',cost:4,hide:.5,sink:.42,def:-2,slow:1,boost:['earth','water'],heavyStop:true,wet:true,note:'ป้องกัน −2 · เทิร์นถัดไปเดิน −1'},
 shallow:{name:'น้ำตื้น',cost:3,hide:.48,sink:.34,boost:['water'],resist:['fire'],heavyStop:true,wet:true,note:'ไฟ −25% · น้ำแข็งทำให้กลายเป็นพื้นน้ำแข็ง'},
 sand:{name:'ทราย',cost:2,def:-1,boost:['wind','earth'],light:true,note:'ป้องกัน −1'},
 rubble:{name:'กองกรวด',cost:2,def:1,heavyDef:2,boost:['earth'],note:'ป้องกัน +1 (ตัวหนัก +2)'},
 crystal:{name:'พื้นผลึก',cost:1,boost:['fusion'],chaos:true,note:'โกลาหลสุ่ม ±25%'},
 ice:{name:'พื้นน้ำแข็ง',cost:1,def:-2,boost:['ice'],slide:true,note:'ป้องกัน −2 · ลื่นไถลอีก 1 ช่อง · ไฟละลาย'},
 ash:{name:'เถ้าไหม้',cost:1,boost:['fire']},
 thinsnow:{name:'หิมะบาง',cost:1,boost:['ice'],weak:['fire'],note:'เดินได้ปกติ · ธาตุน้ำแข็งแรงขึ้น'},
 snow:{name:'หิมะหนา',cost:2,boost:['ice'],weak:['fire'],light:true,note:'เดิน 2 แต้ม (เท้าเบา 1) · ธาตุน้ำแข็งแรงขึ้น · ไฟเพิ่มขึ้นและละลายหิมะ'},
 water:{name:'แม่น้ำ',cost:5,hide:.55,sink:.5,def:-3,slow:1,resist:['fire'],boost:['water'],heavyStop:true,wet:true,note:'ลุยได้แต่ช้ามาก (ค่าเดิน 5) · ป้องกัน −3 · เทิร์นถัดไปเดิน −1'}};
const TRAITS={fly:'บิน',light:'เท้าเบา',heavy:'หนัก',amphib:'สะเทินน้ำ'};
const LOW_PROPS=['rock','stump','log','mossrock','bush','crystal','cart','crates','barrel','orepile'];
const PROP_H={tree:2.6,pine:2.6,pillar:2,beam:2,stalagmite:2,standstone:1.8,rock:1,stump:.6,log:.8,mossrock:1,bush:1,crystal:1,cart:1,crates:1.2,barrel:1,orepile:.9};
const has=(u,k)=>!!u&&(u.traits||[]).includes(k);
const terrainOf=(map,x,y)=>TERRAIN[at(map,x,y)?.kind]||TERRAIN.grass;
function stepCost(u,tile){let T=TERRAIN[tile.kind]||TERRAIN.grass;if(has(u,'fly'))return 1;if(has(u,'amphib')&&T.wet)return 1;if(has(u,'light')&&T.light)return 1;if(has(u,'heavy')&&T.heavyStop)return 'stop';return T.cost}
const COMBAT_RULES={attack:{target:'enemy'},skill:{target:'enemy',bonus:12,extraStamina:10},spell:{target:'enemy',range:4,damage:14,stamina:12,magic:true},guard:{target:'self'},rest:{target:'self'},push:{target:'enemy'},pull:{target:'enemy'},line:{target:'enemy'},frost:{target:'enemy'},wall:{target:'self'},whirl:{target:'enemy'},twin:{target:'enemy'},flame:{target:'enemy'},gust:{target:'enemy'},mend:{target:'self'},quake:{target:'enemy'},aimed:{target:'enemy'},thunder:{target:'enemy'},backstab:{target:'enemy'},dive:{target:'enemy'},tide:{target:'enemy'},formation:{target:'enemy'},counter:{target:'self'},evade:{target:'self'},firstAid:{target:'self'},ambush:{target:'self'}};
const ENEMY_TYPES={
 dummy:{name:'หุ่นไล่กาฝึกซ้อม',hp:110,move:3,melee:13,ranged:9,rangedReach:3,image:'assets/scarecrow.webp',scale:1},
 straw:{name:'ทหารฟาง',hp:30,move:3,melee:7,ranged:4,rangedReach:3,image:'assets/scarecrow.webp',scale:.82,art:'enemy-straw-soldier'},
 archer:{name:'พลธนูฟาง',hp:22,move:3,melee:4,ranged:8,rangedReach:4,keepAway:true,image:'assets/scarecrow.webp',scale:.78,tint:'#4d7fb0',art:'enemy-straw-archer'},
 captain:{name:'หัวหน้าหุ่นฟาง',hp:70,move:3,melee:13,ranged:0,rangedReach:0,image:'assets/scarecrow.webp',scale:1.08,tint:'#b5402f',art:'enemy-straw-captain',captain:true,rank:'miniboss'},
 // v11 area monsters — drawn in code (tactics-scenery.js) until real art exists; art id = enemy-<key>
 wolf:{name:'หมาป่า',hp:26,move:4,melee:7,ranged:0,rangedReach:0,draw:'wolf',scale:.9,art:'enemy-wolf',area:'forest',rank:'normal'},
 bandit:{name:'โจรป่า',hp:34,move:3,melee:8,ranged:0,rangedReach:0,draw:'bandit',scale:1,art:'enemy-bandit',area:'forest',rank:'normal'},
 poacher:{name:'นักล่าเถื่อน',hp:24,move:3,melee:4,ranged:8,rangedReach:4,keepAway:true,draw:'poacher',scale:1,art:'enemy-poacher',area:'forest',rank:'normal'},
 shadowWolf:{name:'หมาป่าเงา',hp:44,move:5,melee:11,ranged:0,rangedReach:0,draw:'wolf',dark:true,scale:1.05,art:'enemy-shadow-wolf',area:'forest',rank:'elite'},
 alpha:{name:'จ่าฝูงหมาป่า',hp:72,move:4,melee:13,ranged:0,rangedReach:0,draw:'alpha',scale:1.2,art:'enemy-alpha',area:'forest',rank:'miniboss',captain:true},
 treant:{name:'พฤกษาเฒ่าคลั่ง',hp:140,move:2,melee:16,ranged:9,rangedReach:3,draw:'treant',scale:1.55,art:'enemy-treant',area:'forest',rank:'boss',captain:true},
 bat:{name:'ค้างคาวถ้ำ',hp:18,move:5,melee:6,ranged:0,rangedReach:0,draw:'bat',scale:.8,art:'enemy-bat',area:'mine',rank:'normal'},
 kobold:{name:'โคโบลด์ขุดแร่',hp:30,move:3,melee:9,ranged:5,rangedReach:3,draw:'kobold',scale:.9,art:'enemy-kobold',area:'mine',rank:'normal'},
 slime:{name:'สไลม์แร่',hp:40,move:2,melee:8,ranged:0,rangedReach:0,draw:'slime',scale:.85,art:'enemy-slime',area:'mine',rank:'normal'},
 foreman:{name:'หัวหน้าคนงานโคโบลด์',hp:50,move:3,melee:11,ranged:7,rangedReach:3,draw:'kobold',chief:true,scale:1.05,art:'enemy-kobold-foreman',area:'mine',rank:'elite'},
 golem:{name:'โกเล็มหิน',hp:95,move:2,melee:15,ranged:0,rangedReach:0,draw:'golem',scale:1.3,art:'enemy-golem',area:'mine',rank:'miniboss',captain:true},
 crystalKing:{name:'ราชาโกเล็มผลึก',hp:170,move:2,melee:18,ranged:11,rangedReach:3,draw:'crystal',scale:1.6,art:'enemy-crystal-king',area:'mine',rank:'boss',captain:true},
 // v13 new areas — recoloured code looks (filter) until enemy-<key> art exists
 bogSlime:{name:'สไลม์บึง',hp:38,move:2,melee:8,ranged:0,rangedReach:0,draw:'slime',filter:'hue-rotate(70deg) saturate(.8) brightness(.85)',scale:.85,art:'enemy-bog-slime',area:'swamp',rank:'normal'},
 mireBat:{name:'ค้างคาวหมอก',hp:18,move:5,melee:6,ranged:0,rangedReach:0,draw:'bat',filter:'hue-rotate(90deg) brightness(1.1)',scale:.8,art:'enemy-mire-bat',area:'swamp',rank:'normal'},
 bogHunter:{name:'พรานบึง',hp:26,move:3,melee:5,ranged:9,rangedReach:4,keepAway:true,draw:'poacher',filter:'hue-rotate(60deg) brightness(.85)',scale:1,art:'enemy-bog-hunter',area:'swamp',rank:'normal'},
 swampWitch:{name:'แม่มดหนองน้ำ',hp:46,move:3,melee:7,ranged:12,rangedReach:4,keepAway:true,draw:'bandit',filter:'hue-rotate(220deg) saturate(1.3)',scale:1.05,art:'enemy-swamp-witch',area:'swamp',rank:'elite'},
 mudTroll:{name:'โทรลล์โคลน',hp:90,move:2,melee:16,ranged:0,rangedReach:0,draw:'golem',filter:'sepia(.6) hue-rotate(40deg) brightness(.8)',scale:1.3,art:'enemy-mud-troll',area:'swamp',rank:'miniboss',captain:true},
 bogHydra:{name:'ไฮดราบึงพิษ',hp:140,move:2,melee:15,ranged:10,rangedReach:3,draw:'treant',filter:'hue-rotate(120deg) saturate(1.4) brightness(.8)',scale:1.55,art:'enemy-bog-hydra',area:'swamp',rank:'boss',captain:true},
 pirate:{name:'โจรสลัด',hp:34,move:3,melee:9,ranged:0,rangedReach:0,draw:'bandit',filter:'hue-rotate(180deg)',scale:1,art:'enemy-pirate',area:'coast',rank:'normal'},
 gull:{name:'นกนางนวลยักษ์',hp:20,move:5,melee:7,ranged:0,rangedReach:0,draw:'bat',filter:'grayscale(1) brightness(1.7)',scale:.85,art:'enemy-gull',area:'coast',rank:'normal'},
 seaSlime:{name:'สไลม์ทะเล',hp:40,move:2,melee:8,ranged:0,rangedReach:0,draw:'slime',filter:'hue-rotate(160deg) saturate(1.3)',scale:.85,art:'enemy-sea-slime',area:'coast',rank:'normal'},
 corsair:{name:'มือปืนสลัด',hp:44,move:3,melee:6,ranged:12,rangedReach:4,keepAway:true,draw:'poacher',filter:'hue-rotate(190deg) saturate(1.2)',scale:1.05,art:'enemy-corsair',area:'coast',rank:'elite'},
 captainHook:{name:'กัปตันตะขอ',hp:85,move:3,melee:15,ranged:6,rangedReach:3,draw:'bandit',chief:true,filter:'hue-rotate(320deg) saturate(1.4)',scale:1.25,art:'enemy-pirate-captain',area:'coast',rank:'miniboss',captain:true},
 coralGolem:{name:'โกเล็มปะการัง',hp:155,move:2,melee:18,ranged:10,rangedReach:3,draw:'golem',filter:'hue-rotate(300deg) saturate(1.8) brightness(1.1)',scale:1.55,art:'enemy-coral-golem',area:'coast',rank:'boss',captain:true},
 iceWolf:{name:'หมาป่าหิมะ',hp:28,move:4,melee:9,ranged:0,rangedReach:0,draw:'wolf',filter:'grayscale(.7) brightness(1.6) hue-rotate(180deg)',scale:.9,art:'enemy-ice-wolf',area:'frost',rank:'normal'},
 frostSlime:{name:'สไลม์เยือกแข็ง',hp:40,move:2,melee:8,ranged:0,rangedReach:0,draw:'slime',filter:'hue-rotate(200deg) brightness(1.4)',scale:.85,art:'enemy-frost-slime',area:'frost',rank:'normal'},
 snowKobold:{name:'โคโบลด์หิมะ',hp:30,move:3,melee:8,ranged:7,rangedReach:3,draw:'kobold',filter:'brightness(1.5) hue-rotate(170deg)',scale:.9,art:'enemy-snow-kobold',area:'frost',rank:'normal'},
 frostWolf:{name:'จ่าฝูงน้ำแข็ง',hp:50,move:5,melee:12,ranged:0,rangedReach:0,draw:'wolf',dark:true,filter:'hue-rotate(190deg) brightness(1.4)',scale:1.05,art:'enemy-frost-wolf',area:'frost',rank:'elite'},
 yeti:{name:'เยติ',hp:92,move:2,melee:15,ranged:0,rangedReach:0,draw:'golem',filter:'grayscale(1) brightness(1.9)',scale:1.35,art:'enemy-yeti',area:'frost',rank:'miniboss',captain:true},
 frostQueen:{name:'ราชินีผลึกน้ำแข็ง',hp:145,move:2,melee:15,ranged:11,rangedReach:4,draw:'crystal',filter:'hue-rotate(160deg) brightness(1.3)',scale:1.6,art:'enemy-frost-queen',area:'frost',rank:'boss',captain:true},
 skeleton:{name:'โครงกระดูกทหาร',hp:30,move:3,melee:10,ranged:0,rangedReach:0,draw:'bandit',filter:'grayscale(1) brightness(1.5)',scale:1,art:'enemy-skeleton',area:'ruins',rank:'normal'},
 wisp:{name:'ดวงวิญญาณ',hp:20,move:5,melee:5,ranged:7,rangedReach:3,draw:'bat',filter:'hue-rotate(250deg) brightness(1.6) saturate(2)',scale:.75,art:'enemy-wisp',area:'ruins',rank:'normal'},
 cultist:{name:'สาวกลัทธิมืด',hp:26,move:3,melee:5,ranged:10,rangedReach:4,keepAway:true,draw:'poacher',filter:'hue-rotate(250deg) brightness(.75)',scale:1,art:'enemy-cultist',area:'ruins',rank:'normal'},
 ghostKnight:{name:'อัศวินวิญญาณ',hp:58,move:4,melee:14,ranged:0,rangedReach:0,draw:'bandit',chief:true,filter:'hue-rotate(230deg) brightness(1.3) opacity(.85)',scale:1.15,art:'enemy-ghost-knight',area:'ruins',rank:'elite'},
 gargoyle:{name:'การ์กอยล์',hp:85,move:3,melee:14,ranged:0,rangedReach:0,draw:'golem',filter:'grayscale(.6) brightness(.8) hue-rotate(250deg)',scale:1.25,art:'enemy-gargoyle',area:'ruins',rank:'miniboss',captain:true},
 voidKing:{name:'ราชาแห่งความว่างเปล่า',hp:145,move:2,melee:16,ranged:11,rangedReach:4,draw:'crystal',filter:'hue-rotate(240deg) brightness(.7) saturate(1.6)',scale:1.6,art:'enemy-void-king',area:'ruins',rank:'boss',captain:true}};
// a living unit's natural facing: toward the nearest opponent (FFT-style), used while waiting and after moving
const EN_EL={dummy:'earth',straw:'earth',archer:'wind',captain:'fire',wolf:'dark',bandit:'earth',poacher:'wind',shadowWolf:'dark',alpha:'dark',treant:'nature',bat:'dark',kobold:'earth',slime:'water',foreman:'earth',golem:'earth',crystalKing:'fusion',bogSlime:'water',mireBat:'dark',bogHunter:'nature',swampWitch:'chaos',mudTroll:'earth',bogHydra:'nature',pirate:'water',gull:'wind',seaSlime:'water',corsair:'fire',captainHook:'water',coralGolem:'water',iceWolf:'ice',frostSlime:'ice',snowKobold:'ice',frostWolf:'ice',yeti:'ice',frostQueen:'ice',skeleton:'dark',wisp:'light',cultist:'dark',ghostKnight:'dark',gargoyle:'earth',voidKing:'chaos'};
const EN_SP={dummy:5,straw:6,archer:7,captain:6,wolf:9,bandit:7,poacher:8,shadowWolf:10,alpha:9,treant:4,bat:10,kobold:7,slime:5,foreman:7,golem:4,crystalKing:5,bogSlime:5,mireBat:10,bogHunter:8,swampWitch:7,mudTroll:4,bogHydra:4,pirate:7,gull:10,seaSlime:5,corsair:8,captainHook:7,coralGolem:4,iceWolf:9,frostSlime:5,snowKobold:7,frostWolf:10,yeti:5,frostQueen:5,skeleton:6,wisp:10,cultist:7,ghostKnight:8,gargoyle:6,voidKing:5};
const WEAPON_SPEED={bow:8,axe:6,tome:7,sword:8,hammer:6,staff:7,unarmed:8,knife:9,spear:7,rapier:9};
const EN_TR={bat:['fly'],wolf:['light'],shadowWolf:['light'],alpha:['light'],poacher:['light'],golem:['heavy'],crystalKing:['heavy'],treant:['heavy'],slime:['amphib'],bogSlime:['amphib'],mireBat:['fly'],gull:['fly'],wisp:['fly'],gargoyle:['fly','heavy'],seaSlime:['amphib'],mudTroll:['amphib','heavy'],bogHydra:['amphib','heavy'],coralGolem:['amphib','heavy'],iceWolf:['light'],frostWolf:['light'],yeti:['heavy'],frostQueen:['heavy'],bogHunter:['amphib'],pirate:['amphib'],ghostKnight:['light']};
const LARGE_FOOTPRINTS={treant:[3,3],crystalKing:[3,3],coralGolem:[3,3],bogHydra:[3,2],alpha:[2,3],golem:[2,3],mudTroll:[2,3]};for(let [kind,T] of Object.entries(ENEMY_TYPES))if(['boss','miniboss'].includes(T.rank)){T.footprint=LARGE_FOOTPRINTS[kind]||[2,2];T.scale=Math.max(1.65,T.scale*1.3)*Math.sqrt(T.footprint[0]*T.footprint[1])/2}
for(let [k,T] of Object.entries(ENEMY_TYPES)){T.element||=EN_EL[k]||'earth';T.traits||=EN_TR[k]||[];T.speed||=EN_SP[k]||6}
function faceFoes(st,only){for(let u of st.units){if(!alive(u)||u.controlled||only&&u.side!==only)continue;let foes=living(st,u.side==='ally'?'enemy':'ally');if(!foes.length)continue;let f=foes.reduce((a,b)=>dist(u,a)<=dist(u,b)?a:b);u.facing=facing(u,f)}}
// Expedition encounters: which enemies stand in the enemy zone and how the fight is won.
const ENCOUNTERS={
 east:{name:'ป่าตะวันออก',theme:'forest',objective:'rout',enemies:['straw','straw','archer','straw','archer','straw','straw','archer','straw','straw']},
 north:{name:'เหมืองหินร้างทางเหนือ',theme:'quarry',objective:'captain',enemies:['captain','straw','archer','straw','archer','straw','straw','archer','straw','straw']}};
const OBJECTIVES={rout:'ล้มศัตรูทั้งหมด',captain:'ล้มหัวหน้าหุ่นฟาง (ลูกน้องจะแตกหนี)',leader:'ล้มหัวหน้ากลุ่ม (ลูกน้องจะแตกหนี)'};
const RANKS={normal:'ทั่วไป',elite:'พิเศษ',miniboss:'รองหัวหน้า',boss:'หัวหน้า'};
const ALLY_LOADOUTS=[{name:'ลูน่า',weapon:'staff'},{name:'บรัม',weapon:'hammer'},{name:'เคียร์',weapon:'sword'},{name:'มิล',weapon:'sword'}];
function random(seed){let h=2166136261;for(let c of String(seed))h=Math.imul(h^c.charCodeAt(0),16777619);return ()=>{h+=0x6D2B79F5;let t=Math.imul(h^h>>>15,1|h);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296}}
const key=(x,y)=>x+','+y;
function dimensions(u){let f=u?.footprint;return [Math.max(1,Math.min(5,Math.floor(f?.[0]||1))),Math.max(1,Math.min(5,Math.floor(f?.[1]||1)))]}
function cells(u,x=u.x,y=u.y){let [w,h]=dimensions(u),a=[];for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++)a.push({x:x+dx,y:y+dy});return a}
function center(u){let [w,h]=dimensions(u);return {x:u.x+(w-1)/2,y:u.y+(h-1)/2}}
function covers(u,x,y){let [w,h]=dimensions(u);return x>=u.x&&y>=u.y&&x<u.x+w&&y<u.y+h}
function overlaps(a,b){let [aw,ah]=dimensions(a),[bw,bh]=dimensions(b);return a.x<b.x+bw&&a.x+aw>b.x&&a.y<b.y+bh&&a.y+ah>b.y}
function dist(a,b){let [aw,ah]=dimensions(a),[bw,bh]=dimensions(b);return Math.max(0,a.x-b.x-bw+1,b.x-a.x-aw+1)+Math.max(0,a.y-b.y-bh+1,b.y-a.y-ah+1)}
function contactPairs(a,b){let out=[];for(let x of cells(a))for(let y of cells(b))out.push({a:x,b:y,d:Math.abs(x.x-y.x)+Math.abs(x.y-y.y)});return out.sort((x,y)=>x.d-y.d)}
function fits(map,u,x,y,occupied=[]){let tiles=cells(u,x,y).map(c=>at(map,c.x,c.y));if(tiles.some(t=>!t||t.blocked))return false;if(Math.max(...tiles.map(t=>t.h))-Math.min(...tiles.map(t=>t.h))>1)return false;if(map.authoredTerrain){let footprint=new Set(tiles.map(t=>key(t.x,t.y)));for(let t of tiles)for(let [dx,dy] of [[1,0],[0,1]]){let k=key(t.x+dx,t.y+dy);if(footprint.has(k)&&!t.exits?.includes(k))return false}}return !occupied.some(o=>overlaps({...u,x,y},o))}

function at(map,x,y){return x>=0&&y>=0&&x<(map.width||map.size)&&y<(map.height||map.size)?map.tiles[y*(map.width||map.size)+x]:null}
const MODES={training:{size:19,width:18,height:19,label:'ฝึก 1 ต่อ 1'},battle:{size:24,width:23,height:24,label:'สนามรบ 5 ต่อ 10'}};
const TALL={tree:1,pillar:1};
// v52: one terrain renderer for every battle. Generated maps are converted to the authored format (per-corner heights,
// exits by the ≤1 step rule, FFT cliff skin) and drawn by TacticsHillArt like the hand-made chunks. Rule heights are unchanged.
// v54: about one battle in four is fought at night (by seed, so a seed always looks the same). Visual only — rules are unchanged.
const NIGHT_CHANCE=.25;
function generate(seed='FOREST-01',theme='forest',mode='training',clearance=[1,1]){const raw=generateRaw(seed,theme,mode,clearance);if(!raw.authoredTerrain&&raw.style!=='fft')stampGround(raw,seed,theme,mode,clearance);const map=raw.authoredTerrain||raw.style==='fft'?raw:toAuthored(raw,seed),A=groundSettings()?.areas?.[groundArea(theme,mode)];map.night=random(String(seed)+'|night')()<(Number.isFinite(A?.night)?A.night:NIGHT_CHANCE);return map}
// v38k · Battleground Editor chunks (localStorage 'battleground-v1', defaults in js/game-settings.js): hand-made terrain pieces
// stamped onto the random base map of their area. A stamp that would cut a spawn off, or sit on one, is undone and retried elsewhere.
function groundSettings(){try{const s=root.localStorage?.getItem('battleground-v1');return s?JSON.parse(s):null}catch(e){return null}}
const groundArea=(theme,mode)=>mode==='training'?'training':theme;
const GROUND_BLOCK={tree:2,rock:1,pillar:2,crystal:1,cart:1,log:1,bush:1,mossrock:1};
function stampGround(map,seed,theme,mode,clearance=[1,1]){const G=groundSettings();if(!G||!Array.isArray(G.chunks))return;const area=groundArea(theme,mode),A=G.areas?.[area]||{},rng=random(String(seed)+'|ground');
 let forced=null;try{if(root.EDITOR_MODE==='battle'){const id=root.localStorage.getItem('battleground-try');forced=G.chunks.find(c=>c.id===id)||null}}catch(e){}
 if(!forced&&(clearance[0]>1||clearance[1]>1))return;// big bosses need 2-wide routes the stamp can't promise
 const pool=forced?[forced]:G.chunks.filter(c=>(c.areas||[]).includes(area)&&c.cells?.length);if(!pool.length||!forced&&rng()>=(Number.isFinite(A.chance)?A.chance:.5))return;
 let r=rng()*pool.reduce((n,c)=>n+(c.weight||1),0),ch=pool[0];for(const c of pool){r-=c.weight||1;if(r<0){ch=c;break}}
 let w=ch.w,h=ch.h,grid=ch.cells.slice(),customSpawns=(ch.spawns||[]).map(s=>({...s}));for(let k=Math.floor(rng()*4);k>0;k--){const g2=[];for(let y=0;y<w;y++)for(let x=0;x<h;x++)g2.push(grid[(h-1-x)*w+y]);grid=g2;customSpawns=customSpawns.map(s=>({...s,x:h-1-s.y,y:s.x}));[w,h]=[h,w]}
 const W=map.width||map.size,H=map.height||map.size;if(w>W-2||h>H-2)return;let spawns=[...map.spawns.allies,...map.spawns.enemies];const near=new Set(spawns.map(p=>p.x+','+p.y));
 const ok=()=>{const start=at(map,spawns[0].x,spawns[0].y),seen=new Set([start]),q=[start];while(q.length){const t=q.pop();for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const n=at(map,t.x+dx,t.y+dy);if(n&&!seen.has(n)&&!n.blocked&&Math.abs(n.h-t.h)<=1){seen.add(n);q.push(n)}}}return spawns.every(p=>seen.has(at(map,p.x,p.y)))};
 const spots=[];for(let oy=1;oy<=H-h-1;oy++)for(let ox=1;ox<=W-w-1;ox++){let clash=false;for(let y=-1;y<=h&&!clash;y++)for(let x=-1;x<=w;x++)if(near.has((ox+x)+','+(oy+y))){clash=true;break}if(!clash)spots.push([ox,oy])}
 for(let i=spots.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[spots[i],spots[j]]=[spots[j],spots[i]]}
 for(const[ox,oy]of spots.slice(0,30)){
  let base=Infinity;for(let y=0;y<h;y++)for(let x=0;x<w;x++)base=Math.min(base,at(map,ox+x,oy+y).h);const saved=[];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const c=grid[y*w+x];if(!c)continue;const t=at(map,ox+x,oy+y);saved.push([t,{h:t.h,kind:t.kind,prop:t.prop,blocked:t.blocked,obstacleHeight:t.obstacleHeight,collision:t.collision,occlusion:t.occlusion,occlusionOpacity:t.occlusionOpacity,submerge:t.submerge,submergeEnabled:t.submergeEnabled}]);
   t.h=base+(c.h||0);if(c.k)t.kind=c.k;t.prop=c.p||null;t.collision=c.collision||(t.prop?'solid':'passable');t.occlusion=c.occlusion||'mask';t.occlusionOpacity=Math.max(0,Math.min(1,Number.isFinite(c.occlusionOpacity)?c.occlusionOpacity:.55));t.submerge=Number.isFinite(c.submerge)?Math.max(0,Math.min(1,c.submerge)):.5;t.submergeEnabled=!!c.submergeEnabled||t.collision==='wading';t.blocked=!!t.prop&&t.collision!=='passable';if(t.blocked)t.obstacleHeight=GROUND_BLOCK[c.p]||1;else delete t.obstacleHeight;t.groundChunk=ch.id}
  const oldAllies=map.spawns.allies,oldEnemies=map.spawns.enemies,oldSpawns=spawns;if(customSpawns.some(s=>s.team==='allies')&&customSpawns.some(s=>s.team==='enemies')){const allies=customSpawns.filter(s=>s.team==='allies').map(s=>at(map,ox+s.x,oy+s.y)).filter(Boolean),enemies=customSpawns.filter(s=>s.team==='enemies').map(s=>at(map,ox+s.x,oy+s.y)).filter(Boolean);if(allies.length&&enemies.length){map.spawns.allies=allies;map.spawns.enemies=enemies;spawns=[...allies,...enemies]}}
  if(ok()){map.groundChunk={id:ch.id,name:ch.name,x:ox,y:oy,w,h};return}
  map.spawns.allies=oldAllies;map.spawns.enemies=oldEnemies;spawns=oldSpawns;for(const[t,o]of saved){Object.assign(t,o);if(o.obstacleHeight==null)delete t.obstacleHeight;for(const k of ['collision','occlusion','occlusionOpacity','submerge','submergeEnabled'])if(o[k]==null)delete t[k];delete t.groundChunk}}}
function toAuthored(map,seed){const S=root.TacticsSurface||(typeof require==='function'?require('./tactics-surface.js'):null),M=root.TacticsMapModules||(typeof require==='function'?require('./tactics-map-modules.js'):null);if(!S||!M)return map;
 map.width=map.width||map.size;map.height=map.height||map.size;// every tile is flat at its own height: no auto-ramps (they left seams between equal-height tiles); steps of 1 show as rock faces, cliffs get the FFT skin
 map.tiles.forEach(t=>{t.surfaceCorners=[t.h,t.h,t.h,t.h]});
 for(const t of map.tiles)if(t.kind==='rail'){const r=(dx,dy)=>at(map,t.x+dx,t.y+dy)?.kind==='rail';if((r(0,1)||r(0,-1))&&!(r(1,0)||r(-1,0)))t.railAxis='y'}
 map.stepRule='height';M.cliffSkin(map,seed);for(const t of map.tiles)delete t.exits;
 // drawn by the hill renderer, but movement keeps the core's own rules (authoredTerrain adds strict exit rules for large bosses)
 map.hillArt=true;return map}
function generateRaw(seed='FOREST-01',theme='forest',mode='training',clearance=[1,1]){
 if(theme==='fft-forest'){const F=root.TacticsFFTTerrain||(typeof require==='function'?require('./tactics-fft-terrain.js'):null);if(F)return F.create(seed,mode)}
 if(theme==='modular-wilds'&&root.TacticsMapModules)return root.TacticsMapModules.create(seed,mode,clearance);
 if(theme==='terraced-hill'&&root.TacticsTerracedHill)return root.TacticsTerracedHill.create(seed,mode);
 const VARIANTS={swamp:'forest',coast:'quarry',frost:'quarry',ruins:'quarry',crag:'forest'};let variant=VARIANTS[theme]?theme:null;if(variant)theme=VARIANTS[theme];theme=['quarry','mine'].includes(theme)?theme:'forest';mode=MODES[mode]?mode:'training';
 let rng=random(seed+'|'+mode),size=MODES[mode].width,height=MODES[mode].height,c=Math.floor(size/2),tiles=[],ri=(a,b)=>a+Math.floor(rng()*(b-a+1));
 // 1. Terrain: a few soft hills, then smooth so neighbours differ by at most 1 (every slope is walkable).
 let hills=Array.from({length:ri(2,4)},()=>({x:ri(1,size-2),y:ri(1,size-2),r:ri(3,6),h:ri(1,3)}));
 let H=(x,y)=>{let v=0;for(let k of hills){let d=Math.hypot(x-k.x,y-k.y);v=Math.max(v,k.h*Math.max(0,1-d/k.r))}return Math.round(v+(rng()-.5)*.35)};
 for(let y=0;y<height;y++)for(let x=0;x<size;x++)tiles.push({x,y,h:Math.max(0,Math.min(3,H(x,y))),kind:theme==='quarry'?'stone':theme==='mine'?'cave':'grass',prop:null,variation:rng(),blocked:false});
 let map={clearance:[...clearance],size:Math.max(size,height),width:size,height,objects:[],seed:String(seed).slice(0,64),theme,variant,mode,tiles,spawns:{allies:[],enemies:[]}};
 let smooth=()=>{let changed=true;while(changed){changed=false;for(let t of tiles)for(let [dx,dy]of [[1,0],[0,1],[-1,0],[0,-1]]){let n=at(map,t.x+dx,t.y+dy);if(n&&t.h-n.h>1){t.h--;changed=true}}}};
 // 2. Spawn zones (flattened, kept clear).
 let zone=(cx,cy,n)=>{let cells=[];for(let r=0;cells.length<n&&r<6;r++)for(let y=cy-r;y<=cy+r;y++)for(let x=cx-r;x<=cx+r;x++){if(Math.max(Math.abs(x-cx),Math.abs(y-cy))!==r)continue;let t=at(map,x,y);if(t&&x>0&&y>0&&x<size-1&&y<height-1&&cells.length<n&&!cells.includes(t))cells.push(t)}return cells};
 if(mode==='training'){let a=at(map,c-1,c+1),b=at(map,c+1,c-1);map.spawns.allies=[a];map.spawns.enemies=[b]}
 else{map.spawns.allies=zone(3,size-4,5);
  // enemies spread over their own half (far corner side), never next to the party; the farthest cell (leader) comes first
  let ally={x:3,y:size-4},cand=tiles.filter(q=>q.x>0&&q.y>0&&q.x<size-1&&q.y<height-1&&(q.x-q.y)>=size*.25&&Math.max(Math.abs(q.x-ally.x),Math.abs(q.y-ally.y))>=size*.55),picked=[];
  for(let gap of [3,2,1]){let pool=[...cand].sort(()=>rng()-.5);for(let q of pool){if(picked.length>=10)break;if(picked.includes(q))continue;if(picked.every(o=>Math.max(Math.abs(o.x-q.x),Math.abs(o.y-q.y))>=gap))picked.push(q)}if(picked.length>=10)break}
  picked.sort((p1,p2)=>Math.hypot(p2.x-ally.x,p2.y-ally.y)-Math.hypot(p1.x-ally.x,p1.y-ally.y));map.spawns.enemies=picked}
 let spawnCells=[...map.spawns.allies,...map.spawns.enemies],keep=new Set();
 let level=spawnCells.length?Math.round(spawnCells.reduce((s,t)=>s+t.h,0)/spawnCells.length):0;
 for(let s of spawnCells)for(let t of tiles)if(Math.max(Math.abs(t.x-s.x),Math.abs(t.y-s.y))<=(mode==='training'?2:1)){keep.add(t);if(mode==='training')t.h=Math.min(t.h,1)}
 for(let s of spawnCells)s.h=mode==='training'?Math.min(s.h,1):s.h;
 smooth();
 // 3. Lanes between the sides: two winding paths that stay clear.
 let reserveWide=t=>{if(!t)return;for(let dx=0;dx<clearance[0];dx++)for(let dy=0;dy<clearance[1];dy++){let n=at(map,t.x+dx,t.y+dy);if(n)keep.add(n)}};
 let lane=(from,to,wiggle)=>{let x=from.x,y=from.y;reserveWide(at(map,x,y));let guard=0;while((x!==to.x||y!==to.y)&&guard++<400){let dx=Math.sign(to.x-x),dy=Math.sign(to.y-y);if(dx&&(!dy||rng()<.5+wiggle))x+=dx;else y+=dy;let t=at(map,x,y);reserveWide(t);t.kind=map.theme==='mine'?'rail':'path'}};
 let A=map.spawns.allies[0],E=map.spawns.enemies[0];lane(A,E,0);if(mode==='battle'){lane(map.spawns.allies.at(-1),map.spawns.enemies.at(-1),.3);lane(at(map,2,c),at(map,size-3,c),0);}
 for(let s of spawnCells)if(s.kind!=='rail')s.kind=map.theme==='mine'?'cave':'path';

 // 3a. Rock crag (v52 stamp): an organic tiered hill — curved terraces, sheer faces, winding dirt paths, rocks and bushes along lips and feet.
 // Heights: ring 0 · stair 1 · terrace 2 · stair 3 · summit 4. A step of 2+ is a cliff (no walking, no melee across it).
 const CRAG_OLD=['..........','...agga...','..raaaam..','.agaabbaa.','spppt'+'bbba.','.agapbRpps','..appppp..','...paam...','...s......'];
 const cragLegend={'.':[0,'grass'],a:[2,'grass'],g:[2,'tallgrass'],p:[2,'path'],b:[4,'stone'],s:[1,'stairs'],t:[3,'stairs'],r:[2,'grass','rock'],m:[2,'grass','mossrock'],R:[4,'stone','rock']};
 const N4=[[1,0],[-1,0],[0,1],[0,-1]];
 // Hand-authored mountain (v54), modelled on the painted reference: summit plateau (6), a wide shelf (3) below it, cliffs on every drop,
 // a 2-wide dirt ramp up the east side (3→6) and another from the ground up the west side (0→3). '#' cliff, digit height, b/p/r props, ',' ground path.
 const CRAG_MAP=['..............','.############.','.#6666666666#.','.#6666p66666#.','.#66666666b6#.','.#6666b66666#.','.#6666666666#.','.#########55#.','.#3333333344#.','.#3333333333#.','.#33b3333p33#.','.#3333333333#.','.#22#########.','.#11..........','..,,..........'];
 function buildCrag(cr){let W=14,H=CRAG_MAP.length,g=[],rampTiles=new Set(['1','2','4','5']);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){let ch=CRAG_MAP[y][x],t={x,y,h:0,kind:'grass',prop:null,path:false,cliff:false,inR:ch!=='.'};
   if(t.inR){if(ch==='#'){t.cliff=true;t.h=(y<=1?6:y===7?5:y===12?3:3)}else if(ch===','){t.kind='path'}else if(/\d/.test(ch)){t.h=+ch;if(rampTiles.has(ch)&&x>=2&&(x<=3||x>=10)){t.kind='path';t.path=true}}
    else{t.h=y<7?6:3;t.prop={b:'bush',p:'pine',r:'rock'}[ch]}}
   g.push(t)}
  // cliff tiles take the height of the walkable tile they hug so the inclined skin starts at the lip
  for(let t of g)if(t.cliff){let hs=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>g[(t.y+dy)*W+t.x+dx]).filter(n=>n&&n.inR&&!n.cliff).map(n=>n.h);t.h=hs.length?Math.max(...hs):3}
  // scatter: bushes and mossy rocks along lips and a few tufts of dirt; never on ramps
  for(let t of g){if(!t.inR||t.cliff||t.path||t.prop||t.h===0)continue;let lip=[[1,0],[0,1],[-1,0],[0,-1]].some(([dx,dy])=>g[(t.y+dy)*W+t.x+dx]?.cliff);if(lip&&cr()<.3)t.prop=cr()<.5?'bush':'mossrock';else if(cr()<.05)t.prop=cr()<.6?'bush':'mossrock'}
  for(let t of g)if(t.inR&&!t.cliff&&!t.path&&t.kind==='grass'&&cr()<.06)t.kind='path';
  return {W,H,g}}
 if((mode==='battle'||variant==='crag')&&theme==='forest'&&(variant==='crag'||random(seed+'|crag')()<.45)){
  let crng=random(seed+'|crag-shape'),built=null;for(let k=0;k<30&&!built;k++)built=buildCrag(crng);
  let fw=built?built.W:10,fh=built?built.H:9,pos=random(seed+'|crag-pos'),spots=[];
  for(let ox=1;ox+fw<=size-1;ox++)for(let oy=1;oy+fh<=height-1;oy++){let ok=true;
   for(let dy=0;dy<fh&&ok;dy++)for(let dx=0;dx<fw&&ok;dx++){if(!at(map,ox+dx,oy+dy))ok=false}
   if(ok&&spawnCells.every(sc=>{let dx=sc.x-ox,dy=sc.y-oy;if(dx<0||dy<0||dx>=fw||dy>=fh)return true;return built?!built.g[dy*fw+dx].inR:false}))spots.push([ox,oy])}
  if(spots.length){let [ox,oy]=spots[Math.floor(pos()*spots.length)],stamped=new Set();
   for(let dy=0;dy<fh;dy++)for(let dx=0;dx<fw;dx++){let t0=at(map,ox+dx,oy+dy),h0,kind,prop,cliffT=false;if(built){let b=built.g[dy*fw+dx];if(!b.inR)continue;h0=b.h;kind=b.kind;prop=b.prop;cliffT=b.cliff}else[h0,kind,prop]=cragLegend[CRAG_OLD[dy][dx]];
    t0.h=h0;t0.kind=kind;t0.prop=prop||null;t0.blocked=!!prop||!!cliffT;t0.stamp='crag';if(cliffT){t0.cliff=true;t0.obstacleHeight=-1}if(prop)t0.obstacleHeight=PROP_H[prop];keep.add(t0);stamped.add(t0)}
   for(let t0 of tiles)if(!stamped.has(t0)&&t0.x>=ox-1&&t0.x<ox+fw+2&&t0.y>=oy-2&&t0.y<oy+fh+2)t0.h=Math.min(t0.h,1);
   for(let changed=true;changed;){changed=false;for(let t0 of tiles){if(stamped.has(t0))continue;for(let [dx,dy] of N4){let n0=at(map,t0.x+dx,t0.y+dy);if(n0&&t0.h-n0.h>1){t0.h--;changed=true}}}}
   map.crag={x:ox,y:oy,w:fw,h:fh}}}
 // 4. Props: frame trees on the border, a few clustered groves inside, hard cap on density.
 let interior=tiles.filter(t=>t.x>0&&t.y>0&&t.x<size-1&&t.y<height-1),cap=Math.round(interior.length*(mode==='battle'?.11:.09)),placed=0;
 // 3b. Ground types (walkable, with effects) in patches; spawn cells and lanes stay normal ground.
 let base=t0=>['grass','stone','cave'].includes(t0.kind),paintable=t0=>t0&&base(t0)&&!keep.has(t0)&&!spawnCells.some(s=>Math.max(Math.abs(s.x-t0.x),Math.abs(s.y-t0.y))<=1);
 let blob=(kind,cx,cy,r,ch=.85)=>{for(let q of tiles)if(Math.hypot(q.x-cx,q.y-cy)<=r+.3&&paintable(q)&&rng()<ch)q.kind=kind};
 let big=mode==='battle',n=k=>big?k:Math.ceil(k/2);
 if(theme==='forest'){for(let i=0;i<n(5);i++)blob('tallgrass',ri(1,size-2),ri(1,size-2),ri(1,2));
  // a stream across the field (walkable shallow water) with mud on its banks
  let horiz=rng()<.5,pos=ri(Math.floor(size*.35),Math.floor(size*.65));for(let i=0;i<size;i++){let x=horiz?i:pos,y=horiz?pos:i;pos+=rng()<.3?(rng()<.5?-1:1):0;pos=Math.max(2,Math.min(size-3,pos));let q=at(map,x,y);if(q&&q.kind!=='water'&&!spawnCells.includes(q)){q.kind='shallow';for(let [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){let m=at(map,q.x+dx,q.y+dy);if(m&&paintable(m)&&rng()<.18)m.kind='mud'}}}
  for(let i=0;i<n(2);i++)blob('mud',ri(1,size-2),ri(1,size-2),1,.7)}
 else if(theme==='mine'){for(let i=0;i<n(4);i++)blob('rubble',ri(1,size-2),ri(1,size-2),ri(1,2),.7);for(let i=0;i<n(3);i++)blob(rng()<.5?'mud':'shallow',ri(1,size-2),ri(1,size-2),1,.8);
  blob('sand',3,size-4,3,.55);if(big)blob('crystal',size-4,3,3,.7);else blob('crystal',ri(2,size-3),ri(2,size-3),1,.8)}
 else{for(let i=0;i<n(3);i++)blob('rubble',ri(1,size-2),ri(1,size-2),ri(1,2),.7);blob('sand',ri(2,size-3),ri(2,size-3),2,.7)}
 // v13 variants repaint the ground of their base theme
 if(variant==='swamp'){for(let i=0;i<n(6);i++)blob(rng()<.55?'mud':'shallow',ri(1,size-2),ri(1,size-2),ri(1,2),.8);for(let i=0;i<n(3);i++)blob('tallgrass',ri(1,size-2),ri(1,size-2),2,.7)}
 else if(variant==='coast'){let edge=rng()<.5;for(let q of tiles){let d=edge?q.x:q.y;if(d>=size-2&&paintable(q))q.kind=d===size-1&&rng()<.6?'water':'shallow';else if(d>=size-5&&paintable(q)&&rng()<.75)q.kind='sand'}for(let q of tiles)if(q.kind==='water')q.blocked=true;for(let i=0;i<n(2);i++)blob('rubble',ri(1,size-2),ri(1,size-2),1,.7)}
 else if(variant==='frost'){for(let i=0;i<n(5);i++)blob('ice',ri(1,size-2),ri(1,size-2),ri(1,2),.8);for(let i=0;i<n(2);i++)blob('shallow',ri(1,size-2),ri(1,size-2),1,.7);for(let q of tiles)if(q.kind==='stone'&&paintable(q)&&rng()<.45)q.kind='snow'}
 else if(variant==='ruins'){for(let i=0;i<n(4);i++)blob('rubble',ri(1,size-2),ri(1,size-2),ri(1,2),.8);for(let i=0;i<n(2);i++)blob('ash',ri(1,size-2),ri(1,size-2),1,.8);blob('crystal',ri(2,size-3),ri(2,size-3),1,.8)}
 const TALLS={forest:['tree','tree','pine','pine','standstone'],mine:['beam','beam','stalagmite','stalagmite'],quarry:['pillar','pillar','stalagmite']}[theme],LOWS={forest:['rock','stump','log','mossrock','bush','bush'],mine:['rock','crystal','cart','crates','barrel','orepile'],quarry:['rock','rock','stump','crates']}[theme],DECOR={forest:['flowers','mushrooms','fern','leaves','bones'],mine:['pebbles','tools','lamp','web','bones'],quarry:['pebbles','pebbles','bones']}[theme];
 const VP={swamp:[['tree','pine','tree'],['log','stump','bush','mossrock'],['mushrooms','fern','leaves']],coast:[['pine','standstone','pillar'],['rock','crates','barrel','log'],['pebbles','bones']],frost:[['pine','stalagmite','standstone'],['rock','crystal','log'],['pebbles','bones']],ruins:[['pillar','pillar','standstone'],['rock','crates','mossrock','stump'],['pebbles','bones','web']]}[variant];if(VP){TALLS.splice(0,TALLS.length,...VP[0]);LOWS.splice(0,LOWS.length,...VP[1]);DECOR.splice(0,DECOR.length,...VP[2])}
 let tallType=TALLS[0],lowTypes=LOWS,pickTall=()=>TALLS[ri(0,TALLS.length-1)],pickLow=()=>LOWS[ri(0,LOWS.length-1)];

 // Multi-cell objects are atomic: one visual, a full occupied footprint, consistent height and line of sight.
 const LARGE={
 'ancient-tree':{w:3,h:3,prop:'tree',height:3.8},
 'fallen-trunk':{w:4,h:1,prop:'log',height:1.2},
 'rock-outcrop':{w:3,h:2,prop:'rock',height:2.2},
 'ruined-wall':{w:4,h:1,prop:'pillar',height:2.8},
 'mine-wagon':{w:3,h:2,prop:'cart',height:1.6},
 'crystal-cluster':{w:2,h:2,prop:'crystal',height:2.2}};
 let largePool=({swamp:['ancient-tree','fallen-trunk','rock-outcrop'],coast:['rock-outcrop','ruined-wall','mine-wagon'],frost:['rock-outcrop','crystal-cluster','fallen-trunk'],ruins:['ruined-wall','rock-outcrop','crystal-cluster']}[variant]||{forest:['ancient-tree','fallen-trunk','rock-outcrop'],mine:['mine-wagon','crystal-cluster','rock-outcrop'],quarry:['rock-outcrop','ruined-wall','mine-wagon']}[theme]);
 function gapSafe(cells){if(clearance[0]===1&&clearance[1]===1)return true;let loX=Math.min(...cells.map(t=>t.x)),hiX=Math.max(...cells.map(t=>t.x)),loY=Math.min(...cells.map(t=>t.y)),hiY=Math.max(...cells.map(t=>t.y));for(let q of tiles)if(q.prop){let gx=q.x<loX?loX-q.x-1:q.x>hiX?q.x-hiX-1:-1,gy=q.y<loY?loY-q.y-1:q.y>hiY?q.y-hiY-1:-1;if(gy===-1&&gx>0&&gx<clearance[0]||gx===-1&&gy>0&&gy<clearance[1])return false}return true}
 function placeLarge(type){let d=LARGE[type];for(let trial=0;trial<160;trial++){let rotate=rng()<.5,w=rotate?d.h:d.w,h=rotate?d.w:d.h,x=ri(1,size-w-1),y=ri(1,height-h-1),cells=[];for(let dy=0;dy<h;dy++)for(let dx=0;dx<w;dx++)cells.push(at(map,x+dx,y+dy));
  if(!gapSafe(cells)||cells.some(t=>!t||t.blocked||t.prop||keep.has(t)||['water','shallow','mud','rail','path'].includes(t.kind)||spawnCells.some(a=>Math.max(Math.abs(a.x-t.x),Math.abs(a.y-t.y))<2)))continue;
  if(Math.max(...cells.map(t=>t.h))-Math.min(...cells.map(t=>t.h))>1)continue;
  // Do not level a cliff: all cells share the lowest existing height and remain within a walkable step of neighbours.
  let ground=Math.min(...cells.map(t=>t.h));if(cells.some(t=>[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{let n=at(map,t.x+dx,t.y+dy);return n&&!cells.includes(n)&&Math.abs(n.h-ground)>1})))continue;
  let o={id:'large-'+map.objects.length,type,x,y,w,h,orientation:d.w===d.h?0:rotate?0:1,ground,prop:d.prop,obstacleHeight:d.height};map.objects.push(o);
  for(let t of cells){t.h=ground;t.prop=d.prop;t.blocked=true;t.objectId=o.id;t.obstacleHeight=d.height}placed+=cells.length;return true}return false}
 for(let i=0;i<(mode==='battle'?6:3);i++)placeLarge(largePool[i%largePool.length]);
 function removeObstacle(t){if(t.objectId){let id=t.objectId;for(let q of tiles)if(q.objectId===id){q.prop=null;q.blocked=false;delete q.objectId;delete q.obstacleHeight}map.objects=map.objects.filter(o=>o.id!==id)}else{t.prop=null;t.blocked=false}}
 let put=(t,type)=>{if(!t||t.prop||keep.has(t)||!gapSafe([t])||['water','shallow','mud'].includes(t.kind))return false;t.prop=type;t.blocked=true;return true};
 for(let t of tiles){let border=t.x===0||t.y===0||t.x===size-1||t.y===height-1;if(border&&rng()<.3)put(t,rng()<.75?pickTall():pickLow())}
 if(theme==='forest'){let p=at(map,ri(1,3),ri(1,3));for(let k=0;k<ri(2,4);k++){if(p&&!keep.has(p)&&!p.prop&&p.h===0){p.kind='water';p.blocked=true}p=at(map,p.x+ri(0,1),p.y+ri(0,1))}}
 let groves=Math.max(2,Math.round(interior.length/45));
 for(let g=0;g<groves&&placed<cap;g++){let t=interior[Math.floor(rng()*interior.length)],n=ri(2,4);for(let k=0;k<n&&placed<cap&&t;k++){if(put(t,rng()<.5?pickTall():pickLow()))placed++;let d=[[1,0],[0,1],[-1,0],[0,-1]][ri(0,3)];t=at(map,t.x+d[0],t.y+d[1]);if(t&&(t.x===0||t.y===0||t.x===size-1||t.y===height-1))t=null}}
 while(placed<cap*.8){let t=interior[Math.floor(rng()*interior.length)];if(put(t,pickLow()))placed++;else if(rng()<.02)break}
 // 4b. Decorations: walkable, no effect — flowers, mushrooms, pebbles…
 for(let q of tiles)if(!q.prop&&!q.blocked&&['grass','cave','stone','path','sand','rubble'].includes(q.kind)&&!spawnCells.includes(q)&&rng()<(q.kind==='path'?.03:.1))q.decor=DECOR[ri(0,DECOR.length-1)];
 // 5. Connectivity: every open cell must be reachable from the ally spawn; open up props until it is.
 for(let guard=0;guard<200;guard++){let seen=new Set([key(A.x,A.y)]),q=[A];while(q.length){let t=q.pop();for(let [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){let n=at(map,t.x+dx,t.y+dy);if(n&&!n.blocked&&Math.abs(n.h-t.h)<=1&&!seen.has(key(n.x,n.y))){seen.add(key(n.x,n.y));q.push(n)}}}
  let lost=tiles.filter(t=>!t.blocked&&!seen.has(key(t.x,t.y)));if(!lost.length)break;
  let door=tiles.find(t=>t.prop&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{let n=at(map,t.x+dx,t.y+dy);return n&&seen.has(key(n.x,n.y))})&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{let n=at(map,t.x+dx,t.y+dy);return n&&lost.includes(n)}));
  if(door){removeObstacle(door)}else{for(let t of lost){t.blocked=true;t.kind=t.kind==='water'?'water':t.kind}break}}
 map.start={x:A.x,y:A.y};map.enemy={x:E.x,y:E.y};
 return map}
function reachable(map,unit,budget,occupied=[]){if(statusHas(unit,'root')||statusHas(unit,'freeze'))budget=0;let here0=at(map,unit.x,unit.y),T0=TERRAIN[here0?.kind]||{};if(T0.slow&&!has(unit,'fly')&&!has(unit,'amphib'))budget=Math.max(0,budget-T0.slow);
 let start=key(unit.x,unit.y),costs=new Map([[start,0]]),parents=new Map(),queue=[{x:unit.x,y:unit.y,cost:0}];while(queue.length){queue.sort((a,b)=>a.cost-b.cost);let cur=queue.shift();if(cur.cost!==costs.get(key(cur.x,cur.y)))continue;for(let [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){let next=at(map,cur.x+dx,cur.y+dy),here=at(map,cur.x,cur.y);if(!next||!fits(map,unit,next.x,next.y,occupied)||Math.abs(next.h-here.h)>1||cells(unit,cur.x,cur.y).some(p=>{let a=at(map,p.x,p.y);return a?.exits&&!a.exits.includes(key(p.x+dx,p.y+dy))}))continue;let up=Math.max(0,next.h-here.h),steps=cells(unit,next.x,next.y).map(p=>stepCost(unit,at(map,p.x,p.y))),sc=steps.includes('stop')?'stop':Math.max(...steps),cost=sc==='stop'?(cur.cost+1+up<=budget?budget:Infinity):cur.cost+sc+up,k=key(next.x,next.y);if(cost<=budget&&cost<(costs.get(k)??Infinity)){costs.set(k,cost);parents.set(k,key(cur.x,cur.y));queue.push({x:next.x,y:next.y,cost})}}}if(occupied.noStop)for(let d of occupied.noStop)for(let c of cells(d)){let k=key(c.x,c.y);if(k!==start)costs.delete(k)}return {costs,parents}}
function pathTo(reach,to){let k=key(to.x,to.y);if(!reach.costs.has(k))return null;let out=[];while(k){let [x,y]=k.split(',').map(Number);out.push({x,y});k=reach.parents.get(k)}return out.reverse()}
function lineOfSight(map,a,b){return contactPairs(a,b).some(p=>lineOfSightPoint(map,p.a,p.b))}
function lineOfSightPoint(map,a,b){let length=Math.max(Math.abs(b.x-a.x),Math.abs(b.y-a.y))*3,ha=at(map,a.x,a.y).h+1.2,hb=at(map,b.x,b.y).h+1.2;for(let i=1;i<length;i++){let t=i/length,x=Math.round(a.x+(b.x-a.x)*t),y=Math.round(a.y+(b.y-a.y)*t);if(x===a.x&&y===a.y||x===b.x&&y===b.y)continue;let tile=at(map,x,y);if(!tile)return false;let obstruction=tile.h+(tile.obstacleHeight??PROP_H[tile.prop]??0);if(obstruction>ha+(hb-ha)*t)return false}return true}

const alive=u=>!!u&&u.hp>0&&!u.removed;
const living=(st,side)=>st.units.filter(u=>u.side===side&&alive(u));
const others=(st,u)=>st.units.filter(o=>o!==u&&alive(o));
const unitAt=(st,x,y)=>st.units.find(u=>alive(u)&&covers(u,x,y))||null;
const WEATHER={breeze:{name:'ฟ้าโปร่ง',icon:'☀'},rain:{name:'ฝน',icon:'☂'},snow:{name:'หิมะ',icon:'❄'},mist:{name:'หมอก',icon:'≋'},embers:{name:'ประกายไฟ',icon:'✧'}};
// Weather holds 6–8 rounds before it may change (it used to flip every 3–4).
function initEnvironment(st,minutes=540){st.environmentRng=random(st.map.seed+'|weather');let list=weatherPool(st).slice(),r=st.environmentRng,first=list.includes(st.weather)?st.weather:list[Math.floor(r()*list.length)],rest=list.filter(w=>w!==first),pair=[first,rest.length?rest[Math.floor(r()*rest.length)]:first];
 st.weather=first;st.environment={minutes,pair,nextChange:6+Math.floor(r()*3),wetRounds:0,snowRounds:0,forecast:null,changes:0};planWeather(st)}
// v52: each area has a weather list; every battle draws exactly two from it (by seed) and only alternates between those.
const AREA_WEATHER={mine:['embers','mist'],swamp:['rain','mist','breeze'],frost:['snow','breeze','mist'],ruins:['mist','breeze','embers'],coast:['breeze','rain','mist'],quarry:['breeze','rain','mist'],forest:['breeze','rain','mist']};
function weatherPool(st){if(st.environment?.pair)return st.environment.pair;let area=st.map.variant||st.map.theme;return AREA_WEATHER[area]||AREA_WEATHER.forest}
function planWeather(st){let pool=weatherPool(st).filter(w=>w!==st.weather);st.environment.forecast=pool.length?pool[Math.floor(st.environmentRng()*pool.length)]:st.weather}
function weatherInfo(st){let e=st.environment;return {current:st.weather,...(WEATHER[st.weather]||WEATHER.breeze),next:e?.forecast||st.weather,inRounds:Math.max(0,(e?.nextChange||0)-st.turn),minutes:e?.minutes??540}}
function lightInfo(st){let minutes=st.environment?.minutes??540,phase=Math.max(0,Math.min(1,(minutes-360)/720)),elevation=Math.max(0,Math.sin(phase*Math.PI)),cave=st.map.theme==='mine',dark=cave?.18:Math.max(0,1-elevation);return {minutes,elevation,dark,sunX:Math.cos(phase*Math.PI),sunY:.4,phase:cave?'ใต้ดิน':minutes<420||minutes>=1080?'กลางคืน':minutes<600?'เช้า':minutes<900?'กลางวัน':'เย็น'}}
function tickEnvironment(st){if(!st.environment)initEnvironment(st);let env=st.environment;env.minutes=Math.min(1200,env.minutes+5);if(st.turn>=env.nextChange){let old=st.weather;st.weather=env.forecast;env.nextChange=st.turn+6+Math.floor(st.environmentRng()*3);planWeather(st);if(old!==st.weather){env.changes++;(st.events||=[]).push({type:'weather',from:old,weather:st.weather})}}
 env.wetRounds=st.weather==='rain'?env.wetRounds+1:0;env.snowRounds=st.weather==='snow'?env.snowRounds+1:0;
 let eligible=st.map.tiles.filter(t=>!t.blocked&&!t.prop&&!t.objectId),changed=[];
 if(env.wetRounds>=2||env.snowRounds>=2){let candidates=eligible.filter(t=>!t.weatherBaseKind&&(st.weather==='rain'?['grass','path'].includes(t.kind):['grass','path','shallow'].includes(t.kind)));for(let i=0;i<2&&candidates.length;i++){let n=Math.floor(st.environmentRng()*candidates.length),t=candidates.splice(n,1)[0];t.weatherBaseKind=t.kind;t.kind=st.weather==='rain'?'mud':t.kind==='shallow'?'ice':'snow';changed.push({x:t.x,y:t.y,kind:t.kind})}}
 else if(['breeze','mist'].includes(st.weather)){for(let t of eligible.filter(t=>t.weatherBaseKind).slice(0,2)){if(['mud','ice','snow'].includes(t.kind)){t.kind=t.weatherBaseKind;changed.push({x:t.x,y:t.y,kind:t.kind})}delete t.weatherBaseKind}}
 if(changed.length){st.terrainVersion=(st.terrainVersion||0)+1;(st.events||=[]).push({type:'weatherTerrain',tiles:changed})}}
// v38c: keep each area's ground believable — no desert sand on a snowfield; patches instead of a per-tile mosaic
function themeCohesion(map,seed){let v=map.variant||map.theme,h=0;for(let c of seed)h=(h*31+c.charCodeAt(0))>>>0;let s1=h%97/9,s2=h%89/8,s3=h%83/7,patch=(x,y)=>(Math.sin(x*.55+s1)+Math.sin(y*.5+s2)+Math.sin((x+y)*.33+s3))/3;
 for(let q of map.tiles){let n=patch(q.x,q.y);
  if(v==='frost'){if(q.kind==='sand'||q.kind==='path')q.kind='thinsnow';else if(q.kind==='stone')q.kind=n>.42?'snow':n>-.45?'thinsnow':'stone';else if(q.kind==='snow')q.kind=n>.2?'snow':'thinsnow';else if(q.kind==='shallow')q.kind='ice'}
  else if(v==='ruins'){if(q.kind==='sand')q.kind=n>0?'rubble':'stone'}
  else if(map.theme==='mine'){if(q.kind==='sand')q.kind='rubble'}
  else if(v==='coast'){if(q.kind==='rubble'&&n<0)q.kind='stone'}}}
function create(seed,theme,mode,opts={}){
 let kinds=opts.encounter?.enemies||[],big=kinds.map(k=>ENEMY_TYPES[k]?.footprint).filter(Boolean);if(opts.encounter?.objective==='captain')big.push(ENEMY_TYPES.captain.footprint);let clearance=[Math.max(1,...big.map(f=>f[0])),Math.max(1,...big.map(f=>f[1]))],map=generate(seed,theme,mode,clearance),_w=map.tiles.forEach(q=>{if(q.kind==='water'&&!q.prop&&!q.terrainLocked)q.blocked=false}),_c=themeCohesion(map,String(seed)),_g=bigProps(map),rng=random(String(seed)+'|deck'),units=[],D=root.TacticsDecks;
 let A=map.spawns.allies,E=map.spawns.enemies;
 let hero={id:'hero',side:'ally',kind:'hero',name:typeof root.heroName==='function'?root.heroName():'นักผจญภัย',x:A[0].x,y:A[0].y,hp:opts.hp??60,maxHp:60,stamina:opts.stamina??100,mp:0,guard:0,facing:'NE',weapon:opts.weapon||'sword',shield:!!opts.shield,controlled:true};
 units.push(hero);
 let party=opts.allies??(map.mode==='battle'?ALLY_LOADOUTS.map((a,i)=>({key:'test'+i,name:a.name,weapon:a.weapon,shield:i===1,maxHp:48,bonus:0})):[]);
 if(map.mode==='battle')party.slice(0,4).forEach((a,i)=>{let s=A[i+1];units.push({id:'ally'+i,key:a.key,side:'ally',kind:'ally',name:a.name,x:s.x,y:s.y,hp:a.maxHp,maxHp:a.maxHp,stamina:100,mp:0,guard:0,facing:'NE',weapon:a.weapon,shield:!!a.shield,bonus:a.bonus||0,level:a.level||1,controlled:!opts.autoAllies,auto:!!a.auto,speed:WEAPON_SPEED[a.weapon]||7})});
 let enc=opts.encounter,types=map.mode!=='battle'?['dummy']:enc?.fixed?enc.enemies.slice(0,10):enc?enc.enemies.slice(0,Math.min(10,Math.max(4,Math.round(4+party.length*1.5)+(enc.objective==='captain'?1:0)))):E.map(()=>'straw');
 if(enc&&enc.objective==='captain'&&!enc.fixed&&!types.includes('captain'))types[0]='captain';
 E.slice(0,types.length).forEach((s,i)=>{let T=ENEMY_TYPES[types[i]],HP=Math.round(T.hp*diff().hp);units.push({id:'enemy'+i,side:'enemy',kind:types[i],name:T.name+(types.length>1?' '+(i+1):''),x:s.x,y:s.y,hp:HP,maxHp:HP,guard:0,facing:'SW',traits:[...(T.traits||[])],element:T.element,footprint:T.footprint?[...T.footprint]:[1,1]})});
 let st={weather:map.variant==='swamp'?'rain':map.variant==='frost'?'snow':map.theme==='mine'?'embers':'breeze',events:[],drops:[],map,units,hero,round:map.mode==='battle'?0:1,enemy:units.find(u=>u.side==='enemy'),objective:enc?enc.objective:'rout',encounter:enc||null,turn:1,phase:'player',selected:'move',outcome:null,combatUsed:0,log:'เลือกไพ่เคลื่อนที่ 1 ใบเพื่อเดิน หรือใช้ไพ่ต่อสู้ได้ 2 ใบ',rng,stats:{damageDealt:0,damageTaken:0,kills:0}};
 st.deck=D?D.create(opts.deck||D.DEFAULT,rng):null;hero.deck=st.deck;hero.speed=hero.speed||8;st.leader=hero;
 // FFT-style queue: every unit has a speed and a CT gauge; each controlled unit has its own two decks
 for(let u of units){u.speed||=u.side==='enemy'?ENEMY_TYPES[u.kind]?.speed||6:8;u.ct=Math.floor(rng()*u.speed*4);if(u.side==='ally'&&u!==hero&&u.controlled&&D)u.deck=D.create(opts.decks?.[u.key]||(D.defaultFor?D.defaultFor(u.key):D.DEFAULT),rng)}
 if(map.mode==='battle'){st.active=null;st.phase='queue'}else{hero.ct=100;st.active=hero}
 placeLargeUnits(st);initEnvironment(st,opts.minutes??540);faceFoes(st);
 return st}
// v73: trees, big rocks and rune stones take a 2x2 footprint (drawn twice as big) when there is room and no route is cut
function bigProps(map){const BIG=['tree','pine','standstone','mossrock','rock','stalagmite'],spawn=new Set([...(map.spawns?.allies||[]),...(map.spawns?.enemies||[])].map(p=>p.x+','+p.y)),N4=[[1,0],[-1,0],[0,1],[0,-1]];map.objects||=[];
 const start=map.spawns?.allies?.[0]&&at(map,map.spawns.allies[0].x,map.spawns.allies[0].y);if(!start)return;
 const reach=()=>{const s=new Set([start]),q=[start];while(q.length){const c=q.pop();for(const[dx,dy]of N4){const n=at(map,c.x+dx,c.y+dy);if(n&&!s.has(n)&&!n.blocked&&!n.void&&Math.abs((n.h||0)-(c.h||0))<=1){s.add(n);q.push(n)}}}return s};
 let base=reach(),n=0;
 for(const t of map.tiles.filter(t=>BIG.includes(t.prop)&&!t.objectId)){
  for(const[ox,oy]of[[0,0],[-1,0],[0,-1],[-1,-1]]){const x0=t.x+ox,y0=t.y+oy,cells=[[0,0],[1,0],[0,1],[1,1]].map(([dx,dy])=>at(map,x0+dx,y0+dy));
   if(cells.some(c=>!c||c.objectId||c.void)||cells.some(c=>c!==t&&(c.blocked||c.prop||c.route||c.ramp||spawn.has(c.x+','+c.y)||['water','shallow','path','rail','mud'].includes(c.kind)||(c.h||0)!==(t.h||0))))continue;
   const others=cells.filter(c=>c!==t);others.forEach(c=>c.blocked=true);const r=reach(),lost=[...base].filter(c=>!others.includes(c)&&!r.has(c)).length;if(lost){others.forEach(c=>c.blocked=false);continue}
   const o={id:'big-'+(n++),type:'prop2',x:x0,y:y0,w:2,h:2,orientation:0,ground:t.h||0,prop:t.prop,obstacleHeight:t.obstacleHeight||2};map.objects.push(o);
   for(const c of cells){c.prop=t.prop;c.blocked=true;c.objectId=o.id;c.obstacleHeight=o.obstacleHeight}base=r;break}}}
function clearMapCell(map,t){if(t.objectId){let id=t.objectId;for(let q of map.tiles)if(q.objectId===id){q.blocked=false;q.prop=null;delete q.objectId;delete q.obstacleHeight}map.objects=map.objects.filter(o=>o.id!==id)}t.blocked=false;t.prop=null;delete t.obstacleHeight;if(TERRAIN[t.kind]?.cost>=99)t.kind=map.theme==='mine'?'cave':'path'}
function placeLargeUnits(st){let large=st.units.filter(u=>dimensions(u).some(n=>n>1));for(let u of large){let occupied=st.units.filter(o=>o!==u&&alive(o)),candidates=st.map.tiles.filter(t=>fits(st.map,u,t.x,t.y,occupied)).sort((a,b)=>Math.abs(a.x-u.x)+Math.abs(a.y-u.y)-Math.abs(b.x-u.x)-Math.abs(b.y-u.y));let spot=candidates[0];if(!spot){let [w,h]=dimensions(u);spot={x:Math.min(u.x,(st.map.width||st.map.size)-w),y:Math.min(u.y,(st.map.height||st.map.size)-h)};for(let c of cells(u,spot.x,spot.y)){let t=at(st.map,c.x,c.y);clearMapCell(st.map,t);t.h=at(st.map,spot.x,spot.y).h}}
 u.x=spot.x;u.y=spot.y;
 // Keep the existing open route, widen it to the configured body size and level this route only.
 let reach=reachable(st.map,{x:u.x,y:u.y,traits:[]},2000,[]),path=pathTo(reach,st.leader),ground=at(st.map,u.x,u.y).h;
 if(path)for(let q of path)for(let c of cells(u,q.x,q.y)){let t=at(st.map,c.x,c.y);if(t){clearMapCell(st.map,t);t.h=ground}}
 for(let other of occupied)if(overlaps(u,other)){let free=st.map.tiles.find(t=>fits(st.map,other,t.x,t.y,st.units.filter(o=>o!==other&&alive(o))));if(free){other.x=free.x;other.y=free.y}}
 }return st}
// Compatibility getters used by older UI code.
function weaponInfo(u){let w=WEAPONS[u.weapon]||WEAPONS.unarmed;return u.bonus?{...w,damage:w.damage+u.bonus}:w}
function targetOf(st,id,u=st.hero){let r=COMBAT_RULES[id];if(!r)return 'self';if(id==='skill'&&u?.weapon==='tome')return 'ally';return r.target}
function cardInfo(st,id,u=st.hero){if(['backstab','dive','tide','formation'].includes(id)){let w=weaponInfo(u),P=POS_CARDS[id];return {range:w.range,damage:w.damage+P.bonus,stamina:w.stamina+P.stamina,positional:P.need}}if(REACTIONS[id])return {stamina:REACTIONS[id].stamina,reaction:id};if(id==='skill'&&u?.weapon==='tome'){let w=weaponInfo(u);return {range:3,heal:18+(u.bonus||0),stamina:12,element:'light'}}let w=weaponInfo(u),r=COMBAT_RULES[id];if(!r)return null;if(id==='spell')return {range:r.range,damage:r.damage,stamina:r.stamina,magic:true};if(id==='attack')return {range:w.range,damage:w.damage,stamina:w.stamina};if(id==='skill')return {range:w.range,damage:w.damage+r.bonus,stamina:w.stamina+r.extraStamina};if(id==='push')return {range:1,damage:Math.max(6,Math.round(w.damage*.5)),stamina:8,push:1};if(id==='pull')return {range:3,damage:6,stamina:8,pull:1};if(id==='line')return {range:1,damage:Math.max(4,w.damage-2),stamina:12,line:2};if(id==='flame')return {range:w.range,damage:w.damage+4,stamina:w.stamina+4,element:'fire'};if(id==='gust')return {range:3,damage:7,stamina:10,push:1,element:'wind'};if(id==='mend')return {heal:16,stamina:10};if(id==='quake')return {range:1,damage:10,stamina:16,whirl:1,element:'earth'};if(id==='aimed')return {range:w.range,damage:w.damage+8,stamina:w.stamina+8,element:'light'};if(id==='thunder')return {range:4,damage:14,stamina:14,magic:true,element:'lightning'};if(id==='frost')return {range:4,damage:13,stamina:12,magic:true,element:'ice'};if(id==='wall')return {guard:14,stamina:6,wall:8};if(id==='whirl')return {range:1,damage:Math.max(6,w.damage-4),stamina:14,whirl:1,element:'wind'};if(id==='twin')return {range:1,damage:Math.max(5,Math.round(w.damage*.55)),stamina:12,twin:1};if(id==='guard')return {guard:u.shield?16:8,stamina:0};if(id==='rest')return {restore:30,stamina:0};return null}
function heightBonus(map,a,b){let p=contactPairs(a,b)[0];return Math.max(-4,Math.min(4,(at(map,p.a.x,p.a.y).h-at(map,p.b.x,p.b.y).h)*4))}
function canHit(st,a,b,range){if(dist(a,b)>range)return 'เป้าหมายอยู่นอกระยะ';let pairs=contactPairs(a,b).filter(p=>p.d<=range);if(range===1)pairs=pairs.filter(p=>Math.abs(at(st.map,p.a.x,p.a.y).h-at(st.map,p.b.x,p.b.y).h)<=1);if(!pairs.length)return 'ต่างระดับเกินระยะประชิด';return pairs.some(p=>lineOfSightPoint(st.map,p.a,p.b))?'':'มีพื้นที่หรือวัตถุขวางแนวโจมตี'}
// Why the hero cannot play combat card #index on target right now ('' = allowed).
function combatReason(st,index,target){if(st.phase!=='player'||st.outcome)return 'ยังไม่ใช่ตาของคุณ';let card=st.deck?.combat.hand[index];if(!card)return 'ไม่มีไพ่ใบนี้';if(card.used)return 'ใช้ไพ่ใบนี้ไปแล้ว';if(st.hero.casting)return 'กำลังร่าย';{let why=root.TacticsDecks.actionBlock(st.deck,'combat');if(why)return why}let h=st.hero,info=cardInfo(st,card.id);if(h.stamina<info.stamina)return 'แรงไม่พอ ('+info.stamina+')';let tg=targetOf(st,card.id,h);if(tg==='ally'){if(!target||target.side!==h.side||!alive(target))return 'เลือกเพื่อน (หรือตัวเอง) เป็นเป้าหมาย';if(dist(h,target)>info.range)return 'เป้าหมายอยู่นอกระยะ';return ''}let rule=COMBAT_RULES[card.id];if(rule.target==='enemy'){if(!target||target.side!=='enemy'||!alive(target))return 'เลือกศัตรูเป็นเป้าหมาย';return canHit(st,h,target,info.range)}return ''}
function coverBonus(st,a,b){if(dist(a,b)<=1)return 0;let pair=contactPairs(a,b)[0];a=pair.a;b=pair.b;let dx=Math.sign(a.x-b.x),dy=Math.sign(a.y-b.y),c=Math.abs(a.x-b.x)>=Math.abs(a.y-b.y)?at(st.map,b.x+dx,b.y):at(st.map,b.x,b.y+dy);return c&&LOW_PROPS.includes(c.prop)?2:0}
function terrainMods(st,a,b,element,ranged){let contact=contactPairs(a,b)[0],ta=terrainOf(st.map,contact.a.x,contact.a.y),tt=has(b,'fly')?TERRAIN.grass:terrainOf(st.map,contact.b.x,contact.b.y),pct=0,notes=[],E=ELEMENT_NAMES[element]||'';
 if(element&&!has(a,'fly')&&ta.boost?.includes(element)){pct+=25;notes.push(`${E}+25% (${ta.name})`)}
 if(element&&tt.weak?.includes(element)){pct+=25;notes.push(`${tt.name}แพ้${E} +25%`)}
 if(element&&(tt.resist?.includes(element)||!has(a,'fly')&&ta.resist?.includes(element))){pct-=25;notes.push(`${E} −25% (น้ำ)`)}
 if(element==='chaos'&&(ta.chaos||tt.chaos)){let up=st.rng()<.5;pct+=up?25:-25;notes.push('ผลึกโกลาหล '+(up?'+25%':'−25%'))}
 if(ranged&&tt.rangedCover){pct-=25;notes.push('ยิงเข้าหญ้าสูง −25%')}
 let af=affinity(b,element);if(af){pct+=af;notes.push((af>0?'แพ้':'ต้าน')+'ธาตุ'+E+' '+(af>0?'+':'')+af+'%')}if(element==='lightning'&&tt.wet){pct+=15;notes.push('เป้าหมายยืนในน้ำ/โคลน สายฟ้า +15%')}
 if(st.weather==='rain'&&['fusion','water','fire','lightning'].includes(element)){let v=element==='fire'?-20:20;pct+=v;notes.push('ฝน '+(v>0?'+':'')+v+'%')}let def=(tt.def||0)+(has(b,'heavy')&&tt.heavyDef?tt.heavyDef:0),cv=coverBonus(st,a,b);if(def)notes.push(`${tt.name} ${def>0?'ป้องกัน +':'ป้องกัน '}${def}`);if(cv)notes.push('หลบหลังที่กำบัง +2');
 if(pct>50||pct< -50)notes.push('ผลรวมธาตุ/พื้น/อากาศจำกัด '+(pct>0?'+':'−')+'50%');return {pct:Math.max(-50,Math.min(50,pct)),def:def+cv,notes}}
// fire burns tall grass (and may spread), ice freezes shallow water, fire melts ice
function changeTerrain(st,t,element){if(!t||!element)return '';let msg='';
 if(element==='fire'){if(t.kind==='tallgrass'){t.kind='ash';msg='หญ้าลุกไหม้!';for(let [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){let n=at(st.map,t.x+dx,t.y+dy);if(n&&n.kind==='tallgrass'&&st.rng()<.5)n.kind='ash'}}else if(t.kind==='ice'){t.kind='shallow';msg='น้ำแข็งละลาย'}else if(t.kind==='snow'){t.kind='mud';msg='หิมะละลายเป็นโคลน'}}
 else if(element==='ice'&&t.kind==='shallow'){t.kind='ice';msg='น้ำกลายเป็นน้ำแข็ง!'}
 if(msg)st.terrainVersion=(st.terrainVersion||0)+1;return msg}
const OPP={NE:'SW',SW:'NE',NW:'SE',SE:'NW'};
function weaponMods(st,a,b,opt,notes){let k=1,w=opt.weapon;if(w==='knife'&&b.facing&&facing(b,a)===OPP[b.facing]){k*=1.5;notes.push('ลอบตีด้านหลัง +50%')}if(w==='bow'&&dist(a,b)<=1){k*=.5;notes.push('ประชิดตัว ธนู −50%')}return k}
// v15 difficulty (Settings): easy / normal / hard scale enemy HP and enemy damage
const DIFFICULTY={easy:{hp:.8,dmg:.8,name:'ง่าย'},normal:{hp:1,dmg:1,name:'ปกติ'},hard:{hp:1.25,dmg:1.2,name:'ยาก'}};
function diff(){return DIFFICULTY[root.GAME_DIFFICULTY]||DIFFICULTY.normal}
// v29 status durations count the affected unit's own CT turns.
const STATUS={poison:{name:'พิษ',icon:'☠',color:'#a9d368',turns:3,pct:.06},burn:{name:'ไหม้',icon:'♨',color:'#ffad66',turns:2,pct:.05},freeze:{name:'แช่แข็ง',icon:'❄',color:'#a6e6ff',turns:1},root:{name:'ติดราก',icon:'♧',color:'#a5d58c',turns:2},slow:{name:'ช้า',icon:'⌛',color:'#d6b5fa',turns:2}};
const statusHas=(u,id)=>!!u?.statuses?.[id]?.turns;
function speedOf(u){return Math.max(1,Math.round((u.speed||6)*(statusHas(u,'slow')?.7:1)))}
function applyStatus(st,u,id,source,turns=STATUS[id]?.turns){if(!alive(u)||!STATUS[id]||!turns)return false;u.statuses||={};let old=u.statuses[id];u.statuses[id]={turns:Math.max(turns,old?.turns||0),source:source?.id||old?.source};if(id==='freeze'){delete u.casting;delete u.statuses.burn}if(id==='burn')delete u.statuses.freeze;(st.events||=[]).push({type:'status',target:u,status:id});return true}
function finishStatuses(u){for(let [id,v] of Object.entries(u.statuses||{}))if(--v.turns<=0)delete u.statuses[id]}
function statusTick(st,u){for(let [id,v] of Object.entries(u.statuses||{})){let def=STATUS[id];if(!def?.pct)continue;let damage=Math.min(u.hp,Math.max(1,Math.round(u.maxHp*def.pct))),src=st.units.find(x=>x.id===v.source)||{id:'environment',name:'สภาพสนาม',side:u.side==='ally'?'enemy':'ally',x:u.x,y:u.y};u.hp-=damage;if(src.side==='ally')st.stats.damageDealt+=damage;else st.stats.damageTaken+=damage;let by=st.stats.byUnit||={},a=by[src.id]||={name:src.name,dealt:0,taken:0,kills:0},b=by[u.id]||={name:u.name,dealt:0,taken:0,kills:0};a.dealt+=damage;b.taken+=damage;if(!u.hp&&!u.downCount){if(u.side==='enemy')st.stats.kills++;a.kills++}(st.events||=[]).push({type:'hit',attacker:src,target:u,damage,blocked:0,notes:[def.name],periodic:true});if(!u.hp){down(st,u);checkOutcome(st);return}}}
function inflictHitStatus(st,a,b,opt,damage,notes){if(!damage||!alive(b))return;if(opt.element==='fire'&&statusHas(b,'freeze')){delete b.statuses.freeze;notes.push('ไฟละลายน้ำแข็ง')}let id=opt.status,chance=opt.statusChance??1;if(!id){if(opt.element==='nature'){id='poison';chance=.35}else if(opt.element==='fire'){id='burn';chance=.25}else if(opt.element==='ice'){id='slow';chance=.4}}if(id&&st.rng()<chance&&applyStatus(st,b,id,a,opt.statusTurns)){notes.push(STATUS[id].name+' '+b.statuses[id].turns+' CT')}}
function chances(st,a,b){let direction=facing(b,a),rear=direction===OPP[b.facing],front=direction===b.facing;return {hit:rear?98:front?78:90,crit:rear?20:front?8:12,angle:rear?'ด้านหลัง':front?'ด้านหน้า':'ด้านข้าง'}}
function down(st,u){if(u.hp>0||u.removed||u.downTurns!=null)return;u.downTurns=u.side==='enemy'?1:3;u.ct=0;u.downCount=(u.downCount||0)+1;u.guard=0;u.statuses={};delete u.casting;(st.events||=[]).push({type:'down',target:u})}
function revive(st,a,b){if(st.outcome||st.phase!=='player'||a!==st.hero||!alive(a)||!b||b.side!==a.side||b.removed||b.hp>0||b.downTurns==null||dist(a,b)>1)return {ok:false,reason:'ต้องยืนติดเพื่อนที่สลบ'};if(unitAt(st,b.x,b.y))return {ok:false,reason:'มีผู้ยืนทับตำแหน่งนี้อยู่'};if(root.TacticsDecks.actionBlock(st.deck,'combat')||a.stamina<15)return {ok:false,reason:'ต้องเหลือคริสตัล/สิทธิ์ต่อสู้ และแรง 15'};a.stamina-=15;st.deck.combatUsed++;a._acted=true;b.hp=Math.max(1,Math.round(b.maxHp*.25));b.ct=0;delete b.downTurns;(st.events||=[]).push({type:'revive',target:b});return {ok:true}}
function expire(st,u){u.removed=true;delete u.casting;if(u.side==='enemy'){let material=st.map.theme==='forest'?'wood':'iron';(st.drops||=[]).push({x:u.x,y:u.y,type:'bag',material,amount:1,source:u.id,sourceName:u.name,collected:true,auto:true})}else{(st.drops||=[]).push({x:u.x,y:u.y,type:'crystal',source:u.id,collected:false})}(st.events||=[]).push({type:'expire',target:u})}
function collect(st,u){for(let d of st.drops||[])if(!d.collected&&d.x===u.x&&d.y===u.y&&(u.side==='ally'||d.type==='crystal')){d.collected=true;if(d.type==='crystal'){u.hp=Math.min(u.maxHp,u.hp+Math.round(u.maxHp*.25));if(u.stamina!=null)u.stamina=Math.min(100,u.stamina+20)}(st.events||=[]).push({type:'loot',target:u,drop:d})}}
// v37: ranged casts fire immediately and the caster recovers afterwards (next turn comes later)
const RECOVER_CT=40;
function scheduleCast(st,u,target,damage,opt,name,radius=0){let aim=contactPairs(u,target)[0].b,cast={x:aim.x,y:aim.y,damage,opt,name,radius};(st.events||=[]).push({type:'release',target:u,name,cast});let main=null,notes=[];for(let f of [...living(st,u.side==='ally'?'enemy':'ally')])if(dist(f,cast)<=radius){let r=applyDamage(st,u,f,damage,opt);if(f===target||!main)main=r;if(f!==target)notes.push(f.name+' −'+r.damage)}u.recover={name,ct:RECOVER_CT};checkOutcome(st);let r=main||{damage:0,blocked:0,miss:true,notes:[]};r.notes=[name,...(r.notes||[]),...notes,'ชาร์จหลังร่าย · CT −'+RECOVER_CT];return r}
function scheduleCastOld(st,u,target,damage,opt,name,radius=0){let aim=contactPairs(u,target)[0].b;u.casting={x:aim.x,y:aim.y,damage,opt,name,radius,remaining:1};(st.events||=[]).push({type:'cast',target:u,name});return {ok:true,charging:true,damage:0,notes:['ร่าย '+name+' · ออกผลเมื่อ CT ถัดไป'],blocked:0}}
function resolveCast(st,u){let c=u.casting;if(!c)return;delete u.casting;(st.events||=[]).push({type:'release',target:u,name:c.name,cast:c});for(let t of [...living(st,u.side==='ally'?'enemy':'ally')])if(dist(t,c)<=c.radius)applyDamage(st,u,t,c.damage,c.opt);checkOutcome(st)}
function applyDamage(st,attacker,target,base,opt={}){let r=applyDamageCore(st,attacker,target,base,opt);afterHit(st,attacker,target,r,opt);return r}
function comboBonus(st,a){let c=st.combo;return c&&c.side===a.side?Math.min(5,c.count):0}
function afterHit(st,a,t,r,opt){if(!r)return;if(r.damage>0&&!opt.reflex){let c=st.combo;if(c&&c.side===a.side)c.count++;else st.combo={side:a.side,count:1};if(st.combo.count>=2)(st.events||=[]).push({type:'combo',target:t,count:st.combo.count})}
 if(alive(t)&&t.reaction?.id==='firstAid'&&t.hp<t.maxHp*.35){t.hp=Math.min(t.maxHp,t.hp+18);reveal(st,t,'firstAid',{heal:18})}
 if(alive(t)&&alive(a)&&t.reaction?.id==='counter'&&!opt.ranged&&!opt.reflex&&dist(a,t)<=1&&a.side!==t.side){reveal(st,t,'counter');let w=t.side==='ally'?weaponInfo(t):null,d=Math.round((w?w.damage:(ENEMY_TYPES[t.kind]?.melee||8))*.8),c=applyDamage(st,t,a,d,{element:t.side==='ally'?WEAPON_ELEMENT[t.weapon]:t.element,weapon:t.side==='ally'?t.weapon:'',reflex:true});r.notes=[...(r.notes||[]),t.name+' สวนกลับ −'+c.damage]}
 // Disgaea-style team attack: an ally standing next to the target may join a melee hit
 if(opt.team&&r.damage>0&&alive(t)&&!opt.reflex)for(let o of st.units){if(o===a||o.side!==a.side||!alive(o)||dist(o,t)>1||!alive(t))continue;if(st.rng()<.4){let w=o.side==='ally'?weaponInfo(o):null,d=Math.max(3,Math.round((w?w.damage:(ENEMY_TYPES[o.kind]?.melee||6))*.5)),x=applyDamage(st,o,t,d,{element:o.side==='ally'?WEAPON_ELEMENT[o.weapon]:o.element,weapon:o.side==='ally'?o.weapon:'',reflex:true});(st.events||=[]).push({type:'teamAttack',unit:o,target:t,damage:x.damage});r.notes=[...(r.notes||[]),o.name+' ร่วมโจมตี −'+x.damage]}}}
function applyDamageCore(st,attacker,target,base,opt={}){if(!alive(target))return {damage:0,blocked:0,notes:[]};if(target.reaction?.id==='evade'&&attacker.side!==target.side){reveal(st,target,'evade');let r={damage:0,blocked:0,miss:true,notes:['ก้าวหลบ!']};(st.events||=[]).push({type:'hit',attacker,target,...r});return r}let cb=comboBonus(st,attacker);if(cb&&!opt.reflex)base*=1+.1*cb;let chance=chances(st,attacker,target);if(st.rng()*100>=chance.hit){let r={damage:0,blocked:0,miss:true,notes:['หลบ!']};(st.events||=[]).push({type:'hit',attacker,target,...r});return r}let critical=st.rng()*100<chance.crit;if(critical)base*=1.5;let unarmed=attacker.side==='ally'&&(!attacker.weapon||attacker.weapon==='unarmed');if(attacker.side==='enemy')base=base*diff().dmg;let hb=heightBonus(st.map,attacker,target)*(opt.weapon==='bow'?2:1),m=terrainMods(st,attacker,target,opt.element,opt.ranged),wk=weaponMods(st,attacker,target,opt,m.notes),raw=Math.max(1,Math.round((Math.round((base+hb)*(1+m.pct/100)*wk)-m.def)*(unarmed ? .5 : 1))),brk=opt.weapon==='hammer'&&target.guard>0,blocked=brk?0:Math.min(target.guard||0,raw),dmg=raw-blocked;if(brk){target.guard=0;m.notes.push('ค้อนทำลายเกราะ')}if(blocked)target.guard=0;target.hp=Math.max(0,target.hp-dmg);if(attacker.side==='ally')st.stats.damageDealt+=dmg;else st.stats.damageTaken+=dmg;let BU=st.stats.byUnit||={};let bu=BU[attacker.id]||={name:attacker.name,dealt:0,taken:0,kills:0};bu.dealt+=dmg;let bt=BU[target.id]||={name:target.name,dealt:0,taken:0,kills:0};bt.taken+=dmg;if(!target.hp&&!target.downCount&&target.side!==attacker.side)bu.kills++;if(!target.hp&&!target.downCount&&target.side==='enemy')st.stats.kills++;let tmsg=changeTerrain(st,at(st.map,target.x,target.y),opt.element);if(tmsg)m.notes.push(tmsg);inflictHitStatus(st,attacker,target,opt,dmg,m.notes);down(st,target);if(target.casting&&dmg>=Math.max(10,target.maxHp*.2)){delete target.casting;m.notes.push('ขัดจังหวะร่าย!')}let result={damage:dmg,blocked,raw,heightBonus:hb,killed:!target.hp,critical,element:opt.element||'',notes:m.notes};(st.events||=[]).push({type:'hit',attacker,target,...result});checkOutcome(st);return result}
// damage preview for the info panel (no side effects; chaos crystal shown as 0)
function cardOpts(st,id){let info=cardInfo(st,id),h=st.hero;if(['spell','frost','quake','thunder'].includes(id))return {element:info.element||'fusion',ranged:true,weapon:'',status:id==='frost'?'freeze':id==='quake'?'slow':undefined,cast:true};let weaponHit=!['spell','frost','gust','mend','thunder'].includes(id);return {element:id==='spell'?'fusion':id==='push'?'earth':id==='pull'?'wind':info.element?info.element:WEAPON_ELEMENT[h.weapon]||'earth',ranged:info.range>1&&!(weaponHit&&h.weapon==='staff'),weapon:weaponHit?h.weapon:'',status:id==='flame'?'burn':undefined}}
// v35: one preview shared by hover, HUD and confirm — mirrors playCombat options exactly.
// ---------- v38 positional cards: strong when the board condition is met, weaker when it is not ----------
const POS_CARDS={backstab:{name:'แทงข้างหลัง',bonus:2,stamina:4,need:'อยู่ด้านหลังเป้า ×1.6 (ไม่ใช่ ×0.8)'},dive:{name:'กระโจนฟาด',bonus:0,stamina:8,need:'สูงกว่าเป้า: +20%/ระดับ (ระดับเดียวกัน ×0.85)'},tide:{name:'คลื่นซัด',bonus:2,stamina:6,need:'ยืนในน้ำ/โคลน ×1.5 (บนบก ×0.85)'},formation:{name:'จู่โจมประสาน',bonus:0,stamina:6,need:'มีเพื่อนติดตัวผู้ตี ×1.35 (ไม่มี ×0.8)'}};
const FACE_VEC={SE:[1,0],SW:[0,1],NW:[-1,0],NE:[0,-1]};
function isBehind(a,b){let f=FACE_VEC[b.facing]||[0,0],rx=center(a).x-center(b).x,ry=center(a).y-center(b).y;return rx*f[0]+ry*f[1]<0}
function posMult(st,a,b,id){if(!POS_CARDS[id])return 1;if(id==='backstab')return isBehind(a,b)?1.6:.8;if(id==='dive'){let d=(at(st.map,a.x,a.y)?.h||0)-(at(st.map,b.x,b.y)?.h||0);return d>0?1+.2*d:.85}if(id==='tide')return TERRAIN[at(st.map,a.x,a.y)?.kind]?.wet?1.5:.85;if(id==='formation')return st.units.some(o=>o!==a&&o.side===a.side&&alive(o)&&dist(o,a)<=1)?1.35:.8;return 1}
// ---------- v38 reactions: set face-down, flip when their trigger happens ----------
const REACTIONS={counter:{name:'ท่าสวนกลับ',stamina:6,text:'โดนตีระยะประชิด → สวนกลับ 80%'},evade:{name:'ก้าวหลบ',stamina:6,text:'การโจมตีครั้งต่อไปพลาดแน่นอน'},firstAid:{name:'ยาฉุกเฉิน',stamina:4,text:'HP ต่ำกว่า 35% → ฟื้น 18'},ambush:{name:'ซุ่มโจมตี',stamina:8,text:'ศัตรูหยุดข้างตัว → ฟาด 12 + ติดราก'}};
function reveal(st,u,id,extra){(st.events||=[]).push({type:'reaction',target:u,name:REACTIONS[id].name,id,...extra});delete u.reaction}
// ---------- v38 cast timing: quick (weaker, no recovery) · heavy (fires now, CT −40) · channel (charge first, stronger and wider) ----------
const CAST_MODES={quick:{name:'เร็ว',mult:.7,note:'แรง ×0.7 · ไม่ต้องชาร์จ'},heavy:{name:'หนัก',mult:1,note:'ออกผลทันที · ชาร์จหลังร่าย CT −40'},channel:{name:'ร่ายยาว',mult:1.35,note:'ชาร์จก่อน 1 CT · แรง ×1.35 · วงกว้างขึ้น 1 · เป้าหนีได้'}};
function previewCard(st,index,target){let card=st.deck?.combat.hand[index];if(!card||!target)return null;let info=cardInfo(st,card.id);if(!info?.damage)return null;let o=cardOpts(st,card.id),mul=posMult(st,st.hero,target,card.id)*(o.cast?CAST_MODES[st.castMode||'heavy'].mult:1),base=Math.round(info.damage*mul),p=previewDamage(st,st.hero,target,base,o),c=previewDamage(st,st.hero,target,base*1.5,o);if(mul!==1)p.notes=[...p.notes,(POS_CARDS[card.id]?POS_CARDS[card.id].name:CAST_MODES[st.castMode||'heavy'].name)+' ×'+mul.toFixed(2)];return {...p,critDamage:c.damage,hpBefore:target.hp,hpAfter:Math.max(0,target.hp-p.damage),hpAfterCrit:Math.max(0,target.hp-c.damage),cast:!!o.cast,element:o.element,reason:combatReason(st,index,target)}}
function previewDamage(st,a,b,base,opt={}){let hb=heightBonus(st.map,a,b)*(opt.weapon==='bow'?2:1),save=st.rng,m;try{st.rng=()=>.5;m=terrainMods(st,a,b,opt.element==='chaos'?'':opt.element,opt.ranged)}finally{st.rng=save}let wk=weaponMods(st,a,b,opt,m.notes);if(a.side==='enemy')base*=diff().dmg;let unarmed=a.side==='ally'&&(!a.weapon||a.weapon==='unarmed');if(unarmed)m.notes.push('ไม่มีอาวุธ ×50%');let status=opt.status||(opt.element==='nature'?'poison':opt.element==='fire'?'burn':opt.element==='ice'?'slow':null);if(status)m.notes.push(STATUS[status].name+' '+(opt.status?'100':opt.element==='nature'?'35':opt.element==='fire'?'25':'40')+'%');let raw=Math.max(1,Math.round((Math.round((base+hb)*(1+m.pct/100)*wk)-m.def)*(unarmed ? .5 : 1))),guard=opt.weapon==='hammer'?0:b.guard||0;return {damage:Math.max(0,raw-Math.min(guard,raw)),raw,pct:m.pct,notes:m.notes,heightBonus:hb,...chances(st,a,b)}}
function checkOutcome(st){if(st.outcome)return;for(let u of st.units)down(st,u);let capt=(st.objective==='captain'||st.objective==='leader')&&st.units.find(u=>u.side==='enemy'&&ENEMY_TYPES[u.kind]?.captain);if(!living(st,'ally').length){st.outcome='lose';st.phase='done'}else if(!living(st,'enemy').length||capt&&!alive(capt)){st.outcome='win';st.phase='done';if(capt)st.units.forEach(u=>{if(u.side==='enemy'&&alive(u))u.fled=true})}}
function playCombat(st,index,target){let why=combatReason(st,index,target);if(why)return {ok:false,reason:why};let card=st.deck.combat.hand[index],h=st.hero,info=cardInfo(st,card.id);root.TacticsDecks.consumeCombat(st.deck,index);h.stamina-=info.stamina;if(card.id==='guard'){h.guard=info.guard;return {ok:true,card:card.id}}if(info.heal&&target&&target.side===h.side){let b=target.hp;target.hp=Math.min(target.maxHp,target.hp+info.heal);return {ok:true,card:card.id,heal:target.hp-b,damage:0,notes:['รักษา '+target.name+' +'+(target.hp-b)]}}if(card.id==='mend'){let b=h.hp;h.hp=Math.min(h.maxHp,h.hp+info.heal);return {ok:true,card:card.id,notes:['ฟื้น HP +'+(h.hp-b)]}}if(card.id==='wall'){h.guard=info.guard;let n=0;for(let a of st.units)if(a!==h&&a.side===h.side&&alive(a)&&dist(a,h)<=1){a.guard=Math.max(a.guard||0,info.wall);n++}return {ok:true,card:card.id,notes:n?['คุ้มกันเพื่อนข้างตัว '+n+' คน']:[]}}if(card.id==='rest'){h.stamina=Math.min(100,h.stamina+info.restore);return {ok:true,card:card.id}}if(REACTIONS[card.id]){h.reaction={id:card.id,turns:2};h._acted=true;return {ok:true,card:card.id,notes:['คว่ำการ์ด '+REACTIONS[card.id].name]}}h._acted=true;if(st.deck)st.deck.pendingMove=null;h.facing=facing(h,target);st.lastTarget=target.id;if(['spell','frost','quake','thunder'].includes(card.id)){let m=st.castMode||'heavy',M=CAST_MODES[m],dmg=Math.round(info.damage*M.mult),opt={element:info.element||'fusion',ranged:true,status:card.id==='frost'?'freeze':card.id==='quake'?'slow':undefined},nm=root.TacticsDecks.COMBAT[card.id].name,rad=card.id==='quake'?1:0;if(m==='channel')return scheduleCastOld(st,h,target,dmg,opt,nm,rad+1);let r=scheduleCast(st,h,target,dmg,opt,nm,rad);if(m==='quick'){delete h.recover;r.notes=r.notes.filter(x=>!/ชาร์จหลังร่าย/.test(x));r.notes.push('ร่ายเร็ว ×0.7')}return r}
 if(false)return scheduleCast(st,h,target,info.damage,{element:info.element||'fusion',ranged:true,status:card.id==='frost'?'freeze':card.id==='quake'?'slow':undefined},root.TacticsDecks.COMBAT[card.id].name,card.id==='quake'?1:0);let weaponHit=!['spell','frost','gust','mend','thunder'].includes(card.id);let el=card.id==='spell'?'fusion':card.id==='push'?'earth':card.id==='pull'?'wind':info.element?info.element:WEAPON_ELEMENT[h.weapon]||'earth',r=applyDamage(st,h,target,Math.round(info.damage*posMult(st,h,target,card.id)),{element:el,team:true,ranged:info.range>1&&!(weaponHit&&h.weapon==='staff'),weapon:weaponHit?h.weapon:'',status:card.id==='flame'?'burn':undefined});
 if(!r.miss&&alive(target)&&(info.push||info.pull)){let k=knock(st,h,target,info.push?1:-1);if(k)r.notes.push(k)}
 if(weaponHit&&h.weapon==='axe'){let t0=at(st.map,target.x,target.y);if(t0?.kind==='tallgrass'){t0.kind='grass';st.terrainVersion=(st.terrainVersion||0)+1;r.notes.push('ฟันหญ้าโล่ง')}let b=living(st,'enemy').find(e=>e!==target&&dist(e,target)===1&&dist(e,h)<=2);if(b){let r2=applyDamage(st,h,b,Math.round(info.damage*.5),{element:el});r.second||={id:b.id,damage:r2.damage};r.notes.push('ฟันกวาดโดน '+b.name+' −'+r2.damage)}}
 if(info.twin&&alive(target)){let r2=applyDamage(st,h,target,info.damage,{element:el});r.second={id:target.id,damage:r2.damage};r.notes.push('ฟันซ้ำ −'+r2.damage)}
 if(info.whirl){for(let b of living(st,'enemy'))if(b!==target&&dist(b,h)===1){let r2=applyDamage(st,h,b,info.damage,{element:el});r.second||={id:b.id,damage:r2.damage};r.notes.push('หมุนโดน '+b.name+' −'+r2.damage)}}
 if(info.line){let dx=Math.sign(target.x-h.x),dy=Math.sign(target.y-h.y),b=unitAt(st,target.x+dx,target.y+dy);if(b&&b!==target&&b.side==='enemy'&&alive(b)){let r2=applyDamage(st,h,b,info.damage,{element:el});r.second={id:b.id,damage:r2.damage};r.notes.push('ทะลวงโดน '+b.name+' −'+r2.damage)}}return {ok:true,card:card.id,...r}}
function playMove(st,index){if(st.phase!=='player'||st.outcome||st.hero.casting||!alive(st.hero))return {ok:false,reason:'ยังเดินไม่ได้'};if(statusHas(st.hero,'root'))return {ok:false,reason:'ติดราก ยังใช้ไพ่เดินไม่ได้'};let d=st.deck,h=st.hero,p=d.pendingMove;
 // v38d: a move card that has not been walked with yet can be swapped for another one at no cost
 if(p&&p.index!==index&&h.mp===p.def.move&&d.movement.hand[p.index]?.used){let c=d.movement.hand[p.index];c.used=false;d.moveUsed--;if(d.doubleMove){d.doubleMove=false;d.combatUsed=p.combatBefore}h.mp-=p.def.move;h.stamina+=p.def.stamina;d.pendingMove=null}
 if(p&&p.index===index)return {ok:false,reason:'ใช้ไพ่ใบนี้อยู่แล้ว · คลิกช่องสีฟ้าเพื่อเดิน'};let cb=d.combatUsed,r=root.TacticsDecks.selectMove(d,h,index);if(r.ok)d.pendingMove={index,def:r.card,combatBefore:cb,swapped:!!p};return r}
function blockersFor(st,u){let o=others(st,u);o.noStop=st.units.filter(x=>x!==u&&!x.removed&&!alive(x));return o}
// push (dir 1) or pull (dir -1) a unit one tile along the attacker→target axis; a blocked push hits for 6
function knock(st,src,t,dir){if(dimensions(t).some(n=>n>1))return 'ร่างใหญ่ต้านการผลัก/ดึง';let dx=t.x-src.x,dy=t.y-src.y;if(Math.abs(dx)>=Math.abs(dy)){dx=Math.sign(dx);dy=0}else{dy=Math.sign(dy);dx=0}dx*=dir;dy*=dir;let from=at(st.map,t.x,t.y),to=at(st.map,t.x+dx,t.y+dy);
 if(!to||to.blocked||to.h-from.h>1||unitAt(st,to.x,to.y)||(dir<0&&to.x===src.x&&to.y===src.y)){if(dir>0){let damage=Math.min(6,t.hp);t.hp-=damage;if(src.side==='ally')st.stats.damageDealt+=damage;else st.stats.damageTaken+=damage;let B=st.stats.byUnit||={},b=B[src.id]||={name:src.name,dealt:0,taken:0,kills:0};b.dealt+=damage;if(!t.hp&&!t.downCount){b.kills++;if(t.side==='enemy')st.stats.kills++}down(st,t);(st.events||=[]).push({type:'hit',attacker:src,target:t,damage,blocked:0,periodic:true,notes:['ชนสิ่งกีดขวาง']});checkOutcome(st);return 'ชนสิ่งกีดขวาง −'+damage}return 'ดึงไม่มา (ทางติด)'}
 t.x=to.x;t.y=to.y;let s=slide(st,t,from);return (dir>0?'ผลักถอย 1 ช่อง':'ดึงเข้ามา 1 ช่อง')+(TERRAIN[at(st.map,t.x,t.y).kind]?.hide?' ลง'+TERRAIN[at(st.map,t.x,t.y).kind].name:'')+(s?' · ลื่นต่อ':'')}
function slide(st,u,from){if(dimensions(u).some(n=>n>1))return null;let t=at(st.map,u.x,u.y);if(!t||!TERRAIN[t.kind]?.slide||has(u,'fly'))return null;let nx=u.x+Math.sign(u.x-from.x),ny=u.y+Math.sign(u.y-from.y),n=at(st.map,nx,ny);if(!n||n.blocked||Math.abs(n.h-t.h)>1||unitAt(st,nx,ny))return null;u.x=nx;u.y=ny;return {x:nx,y:ny}}
// v53: click a tile → the smallest walk card that reaches it is used (or the tightest pair for a yellow tile), then walk.
function walkReach(st,lock){let d=st.deck,h=st.hero;if(!d)return null;let r=root.TacticsDecks.walkRange(d,h,lock||d.moveLock||[]),max=Math.max(r.blue,r.yellow);return {...r,reach:max?reachable(st.map,h,max,blockersFor(st,h)):null}}
function autoMove(st,to,lock){if(st.phase!=='player'||st.outcome||st.hero.casting||!alive(st.hero))return {ok:false,reason:'ยังเดินไม่ได้'};let h=st.hero,d=st.deck;if(statusHas(h,'root'))return {ok:false,reason:'ติดราก เดินไม่ได้จนกว่าสถานะหมด'};
 if(h.mp>0)return move(st,to);let w=walkReach(st,lock),k=key(to.x,to.y);if(!w?.reach||!w.reach.costs.has(k)||(to.x===h.x&&to.y===h.y))return {ok:false,reason:root.TacticsDecks.actionBlock(d,'move')||'ช่องนี้เดินไปไม่ถึง'};
 let cost=w.reach.costs.get(k),plan=root.TacticsDecks.walkPlan(d,h,cost,lock||d.moveLock||[]);if(!plan)return {ok:false,reason:'ไม่มีไพ่เดินที่ไปถึงช่องนี้'};
 let used=[];for(const i of plan.cards){let r=root.TacticsDecks.selectMove(d,h,i);if(!r.ok){return {ok:false,reason:r.reason}}used.push({index:i,...r.card})}
 d.moveLock=[];let r=move(st,to);return r.ok?{...r,cards:used,yellow:used.length>1}:r}
function move(st,to){if(st.phase!=='player'||st.outcome||st.hero.casting||!alive(st.hero))return {ok:false,reason:'ยังเดินไม่ได้'};let h=st.hero;if(statusHas(h,'root'))return {ok:false,reason:'ติดราก เดินไม่ได้จนกว่าสถานะหมด'};if(h.mp<=0)return {ok:false,reason:'เลือกไพ่เคลื่อนที่ก่อนเดิน'};let reach=reachable(st.map,h,h.mp,blockersFor(st,h)),path=pathTo(reach,to);if(!path||path.length<2)return {ok:false,reason:'ช่องนี้เดินไปไม่ถึงหรือเป็นช่องปัจจุบัน'};let cost=reach.costs.get(key(to.x,to.y));h.x=to.x;h.y=to.y;h.mp=0;h._moved=true;if(st.deck)root.TacticsDecks.commitMovement(st.deck);// v53: leftover walking power is dropped — one walk = one crystal (two for a yellow walk)
 collect(st,h);h.facing=facing(path.at(-2),path.at(-1));let slid=slide(st,h,path.at(-2));collect(st,h);return {ok:true,path:slid?[...path,slid]:path,cost,slid:!!slid}}
// AI: move toward the closest opponent and hit it if possible. Returns a step list for animation.
// v37 monster tactics: each enemy plays to its strengths instead of always charging the nearest target
const ROLE_NAMES={kiter:'ยิงไกล · รักษาระยะ ถอยเมื่อโดนประชิด',pack:'ล่าเป็นฝูง · รุมเป้าเดียวกัน',hunter:'นักล่า · เล็งตัวอ่อนแอ อ้อมไปด้านหลัง',bruiser:'แนวหน้า · ยืนคุ้มกันหัวหน้า',skirmisher:'ป่วนแนว · ประชิดได้ ยิงได้',soldier:'ทหาร · เข้าปะทะตรง ๆ',boss:'บอส · ใช้สกิลพื้นที่',leader:'หัวหน้า · สั่งการจากแนวหลัง'};
function enemyRole(kind){let T=ENEMY_TYPES[kind]||{};if(T.keepAway)return 'kiter';if(T.rank==='boss')return 'boss';if(/wolf|alpha/i.test(kind))return 'pack';if(T.move<=2||T.hp>=80&&!T.captain)return 'bruiser';if(T.captain||T.chief)return 'leader';if(T.move>=5||(T.traits||[]).includes('fly'))return 'hunter';if(T.ranged>0)return 'skirmisher';return 'soldier'}
const FACE_V={SE:[1,0],SW:[0,1],NW:[-1,0],NE:[0,-1]};
function roleScore(st,u,T,spot,f,d,hit,shoot,cost,foes){let role=enemyRole(u.kind),s=0,tile=at(st.map,spot.x,spot.y)||{h:0},dmin=Math.min(...foes.map(o=>dist(spot,o))),fv=FACE_V[f.facing]||[0,0],rx=spot.x-f.x,ry=spot.y-f.y,behind=rx*fv[0]+ry*fv[1]<0,weak=f.hp/f.maxHp,ranged=f.weapon&&['bow','staff','tome'].includes(f.weapon),allies=living(st,'enemy').filter(o=>o!==u),lowHp=u.hp<u.maxHp*.25&&!['boss','miniboss'].includes(T.rank),kill=hit&&f.hp<=(T.melee||0);
 if(lowHp&&!kill)return -dmin*14+(hit?40:0);                      // badly hurt: back away unless it can finish someone
 if(role==='kiter')return (dmin<=1?40:0)+Math.max(0,3-dmin)*10-tile.h*3-(behind&&shoot?2:0);
 if(role==='hunter')return weak*22+(ranged?-8:0)+(hit&&behind?-7:0);
 if(role==='pack'){let mates=allies.filter(o=>dist(o,f)<=1).length;return -mates*4+weak*8+(hit&&behind?-4:0)}
 if(role==='bruiser'||role==='leader'){let lead=allies.find(o=>ENEMY_TYPES[o.kind]?.captain||ENEMY_TYPES[o.kind]?.rank==='boss'),back=allies.filter(o=>ENEMY_TYPES[o.kind]?.keepAway);if(role==='leader')return (hit?0:6)+Math.max(0,2-dmin)*6+(back.length?0:-2);return d*1.5+(lead?Math.max(0,dist(spot,lead)-3)*3:0)+(back.length?Math.min(...back.map(b=>dist(spot,b)))*.8:0)}
 if(role==='skirmisher')return (hit?0:(shoot?-30:0))-tile.h*2+(hit&&behind?-3:0);
 return hit&&behind?-3:0}
function aiPlan(st,u){let foes=living(st,u.side==='ally'?'enemy':'ally');if(!foes.length||!alive(u))return null;let T=u.side==='enemy'?ENEMY_TYPES[u.kind]:null,w=T?null:weaponInfo(u),budget=T?T.move:4,range=T?1:w.range;
 let reach=reachable(st.map,u,budget,blockersFor(st,u)),best=null;
 let keep=T&&T.keepAway,order=u.side==='ally'?(st.allyOrder||'free'):'free',hero=st.leader||st.hero;
 // companion orders: focus = the hero's last target · follow = stay within 2 of the hero · guard = stay next to the hero, hit what threatens it
 if(order==='focus'){let ft=st.units.find(x=>x.id===st.lastTarget&&alive(x));if(ft)foes=[ft]}
 if(order==='guard'&&alive(hero)){let near=foes.filter(f=>dist(f,hero)<=3);if(near.length)foes=near}
 const leash=spot=>!alive(hero)?0:order==='follow'?Math.max(0,dist(spot,hero)-2)*40:order==='guard'?Math.max(0,dist(spot,hero)-1)*60:0;
 for(let k of reach.costs.keys()){let [x,y]=k.split(',').map(Number),spot={x,y,footprint:u.footprint},lp=leash(spot);for(let f of foes){let d=dist(spot,f),hit=keep?false:!canHit(st,spot,f,range),shoot=keep&&d>=2&&d<=T.rangedReach&&lineOfSight(st.map,spot,f),score=keep?(shoot?0:100)+Math.abs(d-3)*3+reach.costs.get(k)*.1:(hit?0:100)+d*2+reach.costs.get(k)*.1+(f.hp/f.maxHp)*3;score+=lp;if(T)score+=roleScore(st,u,T,spot,f,d,hit,shoot,reach.costs.get(k),foes);if(!best||score<best.score)best={score,spot,f,hit}}}
 if(!best)return null;
 // Greedy Manhattan movement can stop at a U-shaped wall. Find a legal detour when it would wait without a shot.
 let canShoot=T&&T.ranged>0&&dist(best.spot,best.f)<=T.rangedReach&&lineOfSight(st.map,best.spot,best.f);
 if(best.spot.x===u.x&&best.spot.y===u.y&&!best.hit&&!canShoot&&!statusHas(u,'root')&&!statusHas(u,'freeze')){
  let traveller={...u,traits:(u.traits||[]).filter(x=>x!=='heavy')},all=reachable(st.map,traveller,2000,blockersFor(st,u)),goal=null,gr=T&&T.ranged>0?Math.max(range,T.rangedReach):range;
  for(let [k,cost]of all.costs){if(!cost)continue;let [x,y]=k.split(',').map(Number),spot={x,y,footprint:u.footprint};for(let f of foes)if(!canHit(st,spot,f,gr)&&(!keep||dist(spot,f)>=2)){let score=cost+leash(spot);if(!goal||score<goal.score)goal={spot,f,score}}}
  if(goal){let route=pathTo(all,goal.spot),step=[...route].reverse().find(p=>reach.costs.has(key(p.x,p.y)));if(step){best={spot:{...step,footprint:u.footprint},f:goal.f,hit:!keep&&!canHit(st,{...step,footprint:u.footprint},goal.f,range)}}}
 }
 let path=pathTo(reach,best.spot)||[{x:u.x,y:u.y}];let attack=null;
 if(best.hit)attack={target:best.f,damage:T?T.melee:w.damage,kind:range===1?'melee':'ranged',element:T?T.element:WEAPON_ELEMENT[u.weapon]||'earth',ranged:range>1};
 else if(T){let near=foes.filter(f=>dist(best.spot,f)<=T.rangedReach&&lineOfSight(st.map,best.spot,f)).sort((a,b)=>dist(best.spot,a)-dist(best.spot,b))[0];if(near)attack={target:near,damage:T.ranged,kind:'straw',element:T.element,ranged:true}}
 return {unit:u,path,attack}}
// v15 boss skills: summon once (HP below a threshold) · heal once · every 3rd turn a special area attack around the target
const BOSS_SKILLS={
 treant:{aoe:{name:'รากหนามพันธนาการ',dmg:8,el:'nature'},summon:{name:'เรียกฝูงหมาป่า',kind:'wolf',n:1,at:.5}},
 crystalKing:{aoe:{name:'ฝนเศษผลึก',dmg:11,el:'fusion'},guard:{name:'เกราะผลึก',val:18,at:.5}},
 bogHydra:{aoe:{name:'พ่นพิษหนองน้ำ',dmg:10,el:'nature'},heal:{name:'งอกหัวใหม่',pct:.2,at:.4}},
 coralGolem:{aoe:{name:'ซัดคลื่นยักษ์',dmg:11,el:'water'},guard:{name:'เปลือกปะการัง',val:20,at:.5}},
 frostQueen:{aoe:{name:'พายุหิมะ',dmg:8,el:'ice'},summon:{name:'เรียกหมาป่าหิมะ',kind:'iceWolf',n:1,at:.5}},
 voidKing:{aoe:{name:'ระเบิดความว่างเปล่า',dmg:9,el:'chaos'},summon:{name:'เรียกดวงวิญญาณ',kind:'wisp',n:2,at:.5},heal:{name:'ดูดกลืนแสง',pct:.15,at:.3}},
 alpha:{summon:{name:'หอนเรียกฝูง',kind:'wolf',n:1,at:.4}},golem:{guard:{name:'ผิวหิน',val:14,at:.5}},mudTroll:{heal:{name:'ฟื้นตัวในโคลน',pct:.2,at:.4}},
 captainHook:{summon:{name:'เรียกลูกเรือ',kind:'pirate',n:2,at:.5}},yeti:{aoe:{name:'กระทืบหิมะ',dmg:9,el:'ice'}},gargoyle:{guard:{name:'ร่างศิลา',val:16,at:.5}}};
function spawnEnemy(st,kind,near){let T=ENEMY_TYPES[kind];if(!T)return null;let blockers=st.units.filter(alive);let spot=null;
 for(let r=1;r<=3&&!spot;r++)for(let dx=-r;dx<=r&&!spot;dx++)for(let dy=-r;dy<=r&&!spot;dy++){let t=at(st.map,near.x+dx,near.y+dy);if(t&&!t.blocked&&!t.prop&&(TERRAIN[t.kind]?.cost||1)<50&&fits(st.map,{footprint:T.footprint},t.x,t.y,blockers))spot=t}
 if(!spot)return null;let HP=Math.round(T.hp*diff().hp),u={id:'summon'+(st.units.length+1),side:'enemy',kind,name:T.name,x:spot.x,y:spot.y,hp:HP,maxHp:HP,guard:0,facing:'SW',traits:[...(T.traits||[])],element:T.element,footprint:T.footprint?[...T.footprint]:[1,1],speed:T.speed||6,ct:0,summoned:true};st.units.push(u);return u}
function bossSkill(st,u,plan){let S=BOSS_SKILLS[u.kind];if(!S)return null;u.turnsActed=(u.turnsActed||0)+1;let notes=[],rituals=[],used=u.used||={};
 if(S.summon&&!used.summon&&u.hp<=u.maxHp*S.summon.at){used.summon=1;let summoned=[];for(let i=0;i<S.summon.n;i++){let v=spawnEnemy(st,S.summon.kind,u);if(v)summoned.push(v.id)}if(summoned.length){notes.push('✦ '+S.summon.name+' ('+summoned.length+' ตัว)');rituals.push({kind:'summon',name:S.summon.name,units:summoned})}}
 if(S.heal&&!used.heal&&u.hp<=u.maxHp*S.heal.at){used.heal=1;let b=u.hp;u.hp=Math.min(u.maxHp,u.hp+Math.round(u.maxHp*S.heal.pct));notes.push('✦ '+S.heal.name+' +'+(u.hp-b));rituals.push({kind:'heal',name:S.heal.name,amount:u.hp-b})}
 if(S.guard&&!used.guard&&u.hp<=u.maxHp*S.guard.at){used.guard=1;u.guard=Math.max(u.guard||0,S.guard.val);notes.push('✦ '+S.guard.name+' (เกราะ '+S.guard.val+')');rituals.push({kind:'guard',name:S.guard.name,amount:S.guard.val})}
 let aoe=null;if(S.aoe&&u.turnsActed%3===0&&(u.intent||plan.attack&&alive(plan.attack.target))){aoe=S.aoe}return {notes,aoe,rituals}}
function previewBossRituals(u){let S=BOSS_SKILLS[u.kind],used=u.used||{};if(!S||!alive(u))return [];return ['summon','heal','guard'].filter(k=>S[k]&&!used[k]&&u.hp<=u.maxHp*S[k].at).map(kind=>({kind,name:S[kind].name}))}
function prepareBoss(st,u,plan){if(plan.bossPrepared)return plan.boss;plan.bossPrepared=true;plan.boss=u.side==='enemy'?bossSkill(st,u,plan):null;if(plan.boss?.rituals?.some(r=>r.kind==='summon')&&plan.path.some(p=>!fits(st.map,u,p.x,p.y,others(st,u)))){let fresh=aiPlan(st,u);if(fresh){plan.path=fresh.path;plan.attack=fresh.attack}}return plan.boss}
function allySignature(st,u,plan){let sig=root.TacticsDecks?.SIGNATURE?.[u.key];if(!sig||u.side!=='ally'||!u.auto&&u.controlled)return null;u.sigTick=(u.sigTick||0)+1;if(u.sigTick%3)return null;
 let t=plan.attack?.target,w=weaponInfo(u);
 if(sig==='wall'&&u.hp<u.maxHp*.7){u.guard=14;let n=0;for(let a of st.units)if(a!==u&&a.side===u.side&&alive(a)&&dist(a,u)<=1){a.guard=Math.max(a.guard||0,8);n++}return {damage:0,notes:['✦ กำแพงโล่'+(n?' คุ้มกัน '+n+' คน':'')],skill:'wall'}}
 if(!t||!alive(t))return null;
 if(sig==='frost'&&dist(u,t)<=4)return scheduleCast(st,u,t,13,{element:'ice',ranged:true,status:'freeze'},'หอกน้ำแข็ง',0)
 if(sig==='twin'&&dist(u,t)===1){let d=Math.max(5,Math.round(w.damage*.55)),r=applyDamage(st,u,t,d,{element:WEAPON_ELEMENT[u.weapon],weapon:u.weapon});if(alive(t)){let r2=applyDamage(st,u,t,d,{element:WEAPON_ELEMENT[u.weapon]});r.damage+=r2.damage;r.killed=r2.killed}r.notes.unshift('✦ สองคมต่อเนื่อง');return r}
 if(sig==='whirl'&&dist(u,t)===1){let d=Math.max(6,w.damage-4),r=applyDamage(st,u,t,d,{element:'wind'});for(let b of living(st,'enemy'))if(b!==t&&dist(b,u)===1){let r2=applyDamage(st,u,b,d,{element:'wind'});r.notes.push('หมุนโดน '+b.name+' −'+r2.damage)}r.notes.unshift('✦ ดาบหมุน');return r}
 return null}
function aiResolve(st,plan){let u=plan.unit;if(st.combo&&st.combo.side!==u.side)st.combo=null;let bs=prepareBoss(st,u,plan),end=plan.path.at(-1);if(plan.path.length>1)u._moved=true;let r0=aiResolveCore(st,plan,u,bs,end);if(r0&&(r0.damage||r0.charging||r0.miss))u._acted=true;ambushCheck(st,u);bossIntent(st,u);return r0}
function ambushCheck(st,u){if(!alive(u))return;for(let a of st.units)if(a.side!==u.side&&alive(a)&&a.reaction?.id==='ambush'&&dist(a,u)<=1){reveal(st,a,'ambush');applyDamage(st,a,u,12,{element:a.side==='ally'?WEAPON_ELEMENT[a.weapon]:a.element,reflex:true});if(alive(u))applyStatus(st,u,'root',1);break}}
function bossIntent(st,u){let S=BOSS_SKILLS[u.kind];if(!S?.aoe||!alive(u)||u.side!=='enemy')return;if((u.turnsActed||0)%3===2){let foes=living(st,'ally');if(!foes.length)return;let f=foes.reduce((a,b)=>dist(u,a)<=dist(u,b)?a:b);u.intent={x:f.x,y:f.y,radius:1,name:S.aoe.name}}}
function aiResolveCore(st,plan,u,bs,end){if(end){if(plan.path.length>1)u.facing=facing(plan.path.at(-2),end);u.x=end.x;u.y=end.y;if(plan.path.length>1)slide(st,u,plan.path.at(-2))}if(bs?.aoe&&u.intent){let it=u.intent;delete u.intent;u.facing=facing(u,it);return scheduleCast(st,u,it,Math.max(bs.aoe.dmg,plan.attack?.damage||0),{element:bs.aoe.el,ranged:true,status:{treant:'root',bogHydra:'poison',frostQueen:'freeze',yeti:'slow'}[u.kind]},bs.aoe.name,1)}if(!plan.attack||!alive(plan.attack.target)||st.outcome){let foes=living(st,u.side==='ally'?'enemy':'ally');if(foes.length){let f=foes.reduce((a,b)=>dist(u,a)<=dist(u,b)?a:b);u.facing=facing(u,f)}return bs?.rituals?.length?{damage:0,notes:bs.notes,rituals:bs.rituals}:null}collect(st,u);u.facing=facing(u,plan.attack.target);let t=plan.attack.target,sg=u.side==='ally'?allySignature(st,u,plan):null;if(sg){if(bs?.notes?.length)sg.notes.unshift(...bs.notes);return sg}
 if(bs?.aoe)return scheduleCast(st,u,t,Math.max(bs.aoe.dmg,plan.attack.damage),{element:bs.aoe.el,ranged:true,status:{treant:'root',bogHydra:'poison',frostQueen:'freeze',yeti:'slow'}[u.kind]},bs.aoe.name,1);let r=bs?.aoe?applyDamage(st,u,t,Math.max(bs.aoe.dmg,plan.attack.damage),{element:bs.aoe.el,ranged:plan.attack.ranged}):applyDamage(st,u,t,plan.attack.damage,{element:plan.attack.element,ranged:plan.attack.ranged,weapon:u.side==='ally'?u.weapon:'',team:!plan.attack.ranged});
 if(bs?.aoe){r.notes.unshift('✦ '+bs.aoe.name);for(let f of living(st,u.side==='enemy'?'ally':'enemy'))if(f!==t&&dist(f,t)<=1){let r2=applyDamage(st,u,f,bs.aoe.dmg,{element:bs.aoe.el});r.notes.push(f.name+' −'+r2.damage)}}if(bs?.notes?.length)r.notes.unshift(...bs.notes);
 if(t.weapon==='rapier'&&alive(t)&&alive(u)&&dist(t,u)===1&&!plan.attack.ranged&&st.rng()<.35){let c=applyDamage(st,t,u,Math.round(weaponInfo(t).damage*.6),{element:WEAPON_ELEMENT.rapier,weapon:'rapier'});r.notes.push(t.name+' สวนกลับ −'+c.damage)}return r}
// Order of a full round after the player ends the turn.
function sideOrder(st,side){return living(st,side).filter(u=>!u.controlled)}
function nextTurn(st){if(st.outcome)return;st.turn++;tickEnvironment(st);for(let u of st.units)if(alive(u)&&has(u,'amphib')&&terrainOf(st.map,u.x,u.y).wet)u.hp=Math.min(u.maxHp,u.hp+3);faceFoes(st,'enemy')}
// ---------- CT turn queue ----------
const actors=st=>st.units.filter(u=>!u.removed&&!u.fled&&(alive(u)||u.downTurns>0));
function tickTo(units){let n=0;while(!units.some(u=>u.ct>=100)&&n++<1000)for(let u of units)u.ct+=u.speed;return units.filter(u=>u.ct>=100).sort((a,b)=>b.ct-a.ct||((a.u?.side||a.side)==='ally'?0:1)-((b.u?.side||b.side)==='ally'?0:1)||b.speed-a.speed||String(a.u?.id||a.id).localeCompare(String(b.u?.id||b.id)))[0]}
// preview the next n actors without changing the battle
function queue(st,n=10){let sim=actors(st).map(u=>({u,ct:u.ct,speed:speedOf(u),statuses:Object.fromEntries(Object.entries(u.statuses||{}).map(([k,v])=>[k,v.turns])),down:u.downTurns})),out=[];const finish=x=>{for(let k of Object.keys(x.statuses))if(--x.statuses[k]<=0)delete x.statuses[k];x.speed=Math.max(1,Math.round((x.u.speed||6)*(x.statuses.slow?.7:1)));x.ct=Math.max(0,x.ct-100)};if(st.active&&alive(st.active)){out.push(st.active);let a=sim.find(x=>x.u===st.active);if(a)finish(a)}while(out.length<n&&sim.length){let x=tickTo(sim);if(!x)break;out.push(x.u);if(x.down!=null&&--x.down<=0)sim=sim.filter(y=>y!==x);else finish(x)}return out}
// end the current actor's turn and pick the next one. Controlled actors become st.hero (with their own deck).
function advance(st){if(st.outcome)return null;if(st.active){let A=st.active;if(A.deck)root.TacticsDecks.commitMovement(A.deck);finishStatuses(A);let back=!A._moved&&!A._acted?40:!A._moved||!A._acted?20:0;A.lastWait=back;A.ct=Math.max(0,A.ct-100)+back-(A.recover?.ct||0);delete A.recover;delete A._moved;delete A._acted;if(A.reaction&&--A.reaction.turns<=0)delete A.reaction}
 let list=actors(st);if(!list.length)return null;let ref=list.map(u=>({u,ct:u.ct,speed:speedOf(u)}));let x=tickTo(ref);for(let r of ref)r.u.ct=r.ct;if(!x)return null;let u=x.u;st.active=u;let timekeeper=st.leader&&!st.leader.removed?st.leader:living(st,'ally')[0];if(u===timekeeper){st.round=(st.round||0)+1;if(st.round>1)root.TacticsCore.nextTurn(st);if(st.outcome)return null}
 if(!alive(u)){u.downTurns--;if(u.downTurns<=0)expire(st,u);return advance(st)}
 statusTick(st,u);if(st.outcome)return null;if(!alive(u))return advance(st);if(statusHas(u,'freeze')){(st.events||=[]).push({type:'frozenTurn',target:u});return advance(st)}
 if(u.casting){resolveCast(st,u);if(st.outcome)return null;return advance(st)}

 
 if(u.side==='ally'&&u.controlled&&!u.auto&&u.deck){st.hero=u;st.deck=u.deck;if(u.started)root.TacticsDecks.next(u.deck,st.rng);u.started=true;u.mp=0;if(u.turns++)u.stamina=Math.min(100,(u.stamina??100)+15);else u.turns=1;st.phase='player';st.selected='move'}
 else{st.phase='ai'}
 if(root.TacticsCore.onActor)try{root.TacticsCore.onActor(st,u)}catch(e){}
 return u}
function facing(a,b){a=center(a);b=center(b);let dx=b.x-a.x,dy=b.y-a.y;if(Math.abs(dx)===Math.abs(dy)&&dx!==0)return dy>0?'SW':dx>0?'SE':'NW';if(Math.abs(dx)>Math.abs(dy))return dx>=0?'SE':'NW';return dy>=0?'SW':'NE'}
root.TacticsCore={dimensions,cells,center,covers,overlaps,fits,contactPairs,placeLargeUnits,ELEMENT_AFFINITY,affinity,WEATHER,initEnvironment,tickEnvironment,weatherInfo,lightInfo,previewBossRituals,prepareBoss,STATUS,statusHas,speedOf,applyStatus,statusTick,finishStatuses,chances,revive,collect,down,expire,resolveCast,BOSS_SKILLS,DIFFICULTY,WEAPON_TRAITS,targetOf,TERRAIN,TRAITS,ELEMENT_NAMES,WEAPON_ELEMENT,PROP_H,LOW_PROPS,terrainOf,terrainMods,hit:applyDamage,SIZE,MODES,TALL,WEAPONS,COMBAT_RULES,ENEMY_TYPES,ENCOUNTERS,OBJECTIVES,RANKS,random,key,dist,at,generate,reachable,pathTo,lineOfSight,create,weaponInfo,cardInfo,combatReason,playCombat,playMove,autoMove,walkReach,move,aiPlan,aiResolve,sideOrder,living,unitAt,alive,nextTurn,facing,faceFoes,checkOutcome,queue,advance,previewDamage,WEAPON_SPEED,canHit,cardOpts,previewCard,blockersFor,enemyRole,ROLE_NAMES,POS_CARDS,REACTIONS,CAST_MODES,posMult,isBehind};
if(typeof module!=='undefined'&&module.exports)module.exports=root.TacticsCore;
})(typeof globalThis!=='undefined'?globalThis:this);
