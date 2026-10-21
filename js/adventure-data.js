// v11 adventure data: items, event cards and branching area maps. Pure data (no UI).
// Elements (all cards carry one): fire water light dark wind ice earth nature chaos fusion
window.ADVENTURE_DATA=(function(){
// ---------- consumables: used on the area map (bag) or in battle (3 random from the bag each turn, use 1) ----------
const CONSUMABLES={
 potion:{name:'ยาฟื้นฟู',element:'water',rarity:'common',kind:'ฟื้นฟู',use:'ทุกที่',hp:25,stamina:0,price:20,text:'ฟื้น HP 25'},
 bigPotion:{name:'ยาฟื้นฟูชั้นดี',element:'nature',rarity:'good',kind:'ฟื้นฟู',use:'ทุกที่',hp:50,stamina:0,price:45,text:'ฟื้น HP 50'},
 tonic:{name:'ชาเรี่ยวแรง',element:'fire',rarity:'common',kind:'ฟื้นฟู',use:'ทุกที่',hp:0,stamina:40,price:15,text:'ฟื้นแรง 40'},
 bread:{name:'ขนมปังเดินทาง',element:'earth',rarity:'common',kind:'ฟื้นฟู',use:'ทุกที่',hp:10,stamina:20,price:8,text:'ฟื้น HP 10 และแรง 20'},
 firebomb:{name:'ระเบิดไฟ',element:'fire',rarity:'good',kind:'โจมตี',use:'ต่อสู้',damage:22,range:4,price:30,text:'ขว้างใส่ศัตรูในระยะ 4 ช่อง ความเสียหาย 22'},
 iceBomb:{name:'ระเบิดน้ำแข็ง',element:'ice',rarity:'good',kind:'โจมตี',use:'ต่อสู้',damage:18,range:4,price:32,text:'ขว้างใส่ศัตรูในระยะ 4 ช่อง ความเสียหาย 18 · น้ำตื้นกลายเป็นน้ำแข็ง'},
 elixir:{name:'น้ำอมฤต',element:'light',rarity:'rare',kind:'ฟื้นฟู',use:'ทุกที่',hp:80,stamina:50,price:90,text:'ฟื้น HP 80 และแรง 50'},
 energyDrink:{name:'น้ำผึ้งป่าเข้มข้น',element:'nature',rarity:'good',kind:'ฟื้นฟู',use:'ทุกที่',hp:0,stamina:70,price:26,text:'ฟื้นแรง 70'},
 mushroomSoup:{name:'ซุปเห็ดอุ่น ๆ',element:'earth',rarity:'common',kind:'ฟื้นฟู',use:'ทุกที่',hp:20,stamina:30,price:14,text:'ฟื้น HP 20 และแรง 30'},
 thunderJar:{name:'โถสายฟ้า',element:'wind',rarity:'good',kind:'โจมตี',use:'ต่อสู้',damage:20,range:4,price:30,text:'ปาใส่ศัตรูในระยะ 4 ช่อง ความเสียหาย 20'},
 holyWater:{name:'น้ำมนต์',element:'light',rarity:'good',kind:'โจมตี',use:'ต่อสู้',damage:24,range:3,price:34,text:'สาดใส่ศัตรูในระยะ 3 ช่อง ความเสียหาย 24 (ธาตุแสง)'},
 poisonDart:{name:'ลูกดอกพิษ',element:'nature',rarity:'common',kind:'โจมตี',use:'ต่อสู้',damage:14,range:5,price:16,text:'ยิงไกล 5 ช่อง ความเสียหาย 14'},
 stoneSkin:{name:'ยาผิวศิลา',element:'earth',rarity:'good',kind:'เสริมพลัง',use:'ต่อสู้',guard:30,price:36,text:'ได้เกราะกันความเสียหาย 30'},
 guardCharm:{name:'เครื่องรางคุ้มกัน',element:'light',rarity:'good',kind:'เสริมพลัง',use:'ต่อสู้',guard:20,price:28,text:'ได้เกราะกันความเสียหาย 20'}};
// ---------- goods: sell at the market or hand in for quests ----------
const GOODS={
 wolfFang:{name:'เขี้ยวหมาป่า',element:'dark',rarity:'common',use:'ขาย',price:12,text:'ของป่าที่พ่อค้ารับซื้อ'},
 herb:{name:'สมุนไพรป่า',element:'nature',rarity:'common',use:'ขาย',price:10,text:'ร้านยาในหมู่บ้านต้องการเสมอ'},
 oldCoin:{name:'เหรียญโบราณ',element:'light',rarity:'good',use:'สะสม',price:40,text:'เหรียญจากยุคก่อน มีราคาสำหรับนักสะสม'},
 batWing:{name:'ปีกค้างคาว',element:'dark',rarity:'common',use:'ขาย',price:8,text:'ใช้ปรุงยา'},
 crystalShard:{name:'เศษผลึกแร่',element:'fusion',rarity:'good',use:'ขาย',price:25,text:'ผลึกที่เปล่งแสงจากเหมืองลึก'},
 swampHerb:{name:'สมุนไพรหนองน้ำ',element:'nature',rarity:'common',use:'ขาย',price:14,text:'ใช้ทำยาถอนพิษ'},
 pearl:{name:'ไข่มุกทะเล',element:'water',rarity:'good',use:'ขาย',price:35,text:'ไข่มุกเม็ดงามจากชายฝั่ง'},
 driftwood:{name:'ไม้ทะเล',element:'wind',rarity:'common',use:'ขาย',price:9,text:'ไม้แห้งเค็มจากซากเรือ'},
 frostFur:{name:'ขนสัตว์หิมะ',element:'ice',rarity:'common',use:'ขาย',price:16,text:'ขนนุ่มกันหนาว ช่างตัดเสื้อชอบมาก'},
 iceCore:{name:'แก่นน้ำแข็ง',element:'ice',rarity:'good',use:'ขาย',price:32,text:'ผลึกเย็นเฉียบที่ไม่ละลาย'},
 boneCharm:{name:'เครื่องรางกระดูก',element:'dark',rarity:'common',use:'ขาย',price:13,text:'ของขลังจากซากวิหาร'},
 soulGem:{name:'อัญมณีวิญญาณ',element:'chaos',rarity:'good',use:'ขาย',price:38,text:'แสงสีม่วงวนอยู่ข้างใน'},
 relic:{name:'ตราประทับหัวหน้า',element:'chaos',rarity:'rare',use:'เควส',price:60,text:'หลักฐานการปราบหัวหน้าพื้นที่'}};
// ---------- event cards: use from the bag → a story modal with choices → card disappears ----------
const EVENT_CARDS={
 treasureMap:{name:'แผนที่สมบัติเก่า',element:'earth',rarity:'good',kind:'สมบัติ',area:'ทุกที่',minutes:20,text:'ตามรอยแผนที่ไปหาของที่ซ่อนไว้'},
 oldShrine:{name:'ศาลเจ้าร้าง',element:'light',rarity:'common',kind:'พักผ่อน',area:'ทุกที่',minutes:30,text:'สถานที่สงบสำหรับพักและอธิษฐาน'},
 merchant:{name:'นกหวีดพ่อค้าเร่',element:'wind',rarity:'common',kind:'พ่อค้า',area:'ทุกที่',minutes:10,text:'เรียกพ่อค้าเร่มาซื้อขายกลางทาง'},
 howl:{name:'เสียงหอนในความมืด',element:'dark',rarity:'good',kind:'ต่อสู้',area:'ป่า',minutes:10,text:'ตามเสียงไปเจอฝูงศัตรู — ชนะแล้วได้ของดี'},
 lostMiner:{name:'คนงานเหมืองหลงทาง',element:'earth',rarity:'common',kind:'เควส',area:'เหมือง',minutes:20,text:'ช่วยคนงานที่ติดอยู่ในอุโมงค์'},
 hotSpring:{name:'บ่อน้ำพุร้อน',element:'fire',rarity:'common',kind:'พักผ่อน',area:'ภูเขาหิมะ',minutes:30,text:'ไอน้ำอุ่นท่ามกลางหิมะ'},
 shipwreck:{name:'ซากเรือเกยตื้น',element:'water',rarity:'good',kind:'สมบัติ',area:'ชายฝั่ง',minutes:20,text:'เรือสินค้าแตกบนโขดหิน อาจมีของหลงเหลือ'},
 cursedIdol:{name:'รูปเคารพต้องสาป',element:'dark',rarity:'rare',kind:'ลึกลับ',area:'ซากวิหาร',minutes:10,text:'รูปปั้นที่จ้องมองกลับมา'},
 wanderingKnight:{name:'อัศวินพเนจร',element:'light',rarity:'good',kind:'ประลอง',area:'ทุกที่',minutes:20,text:'อัศวินท้าประลองฝีมือ'},
 fallenCart:{name:'เกวียนพลิกคว่ำ',element:'earth',rarity:'common',kind:'ช่วยเหลือ',area:'ทุกที่',minutes:20,text:'เกวียนขนแร่ล้มขวางทาง'},
 willowisp:{name:'แสงผีนำทาง',element:'light',rarity:'common',kind:'ลึกลับ',area:'บึง',minutes:20,text:'ดวงไฟลอยเรียกให้ตามไป'},
 strangeRune:{name:'อักษรรูนประหลาด',element:'chaos',rarity:'rare',kind:'ลึกลับ',area:'ทุกที่',minutes:10,text:'พลังที่ไม่รู้ว่าจะให้คุณหรือโทษ'}};
// ---------- area maps (x,y in % of the map; next = edges forward). types: start treasure event quest rest fight elite miniboss boss ----------
// v13: bigger map — 22 spots in 8 columns (start · 3 · 3 · 4 · 3 · 3 · 2 · camp · boss)
const GRAPH=[
 ['start',5,50,['a1','a2','a3']],
 ['a1',15,20,['b1','b2']],['a2',15,50,['b2']],['a3',15,80,['b2','b3']],
 ['b1',27,14,['c1','c2']],['b2',27,47,['c2','c3']],['b3',27,82,['c3','c4']],
 ['c1',39,24,['d1']],['c2',39,46,['d1','d2']],['c3',40,66,['d2','d3']],['c4',40,88,['d3']],
 ['d1',52,30,['e1','e2']],['d2',52,58,['e2']],['d3',53,82,['e2','e3']],
 ['e1',65,20,['f1']],['e2',65,52,['f1','f2']],['e3',66,80,['f2']],
 ['f1',77,34,['g1']],['f2',77,66,['g1']],
 ['g1',87,50,['boss']],['boss',95,50,[]]];
// fixed spots; the rest are shuffled from POOL every run
const FIXED={start:'start',d1:'miniboss',g1:'rest',boss:'boss'};
const POOL=['fight','fight','fight','fight','fight','fight','elite','elite','treasure','treasure','treasure','event','event','event','quest','rest','shop','mystery'];
const AREAS={
 forest:{name:'ป่าตะวันออก',tier:1,exit:'east',theme:'forest',element:'nature',sky:['#1d3a2a','#3e6b45'],
  intro:'ทางเดินเข้าป่าแยกเป็นหลายเส้น เสียงหมาป่าดังมาจากที่ลึก — ผ่านไปให้ถึงต้นไม้เฒ่าที่คลั่งกลางป่า',
  types:{start:'start',a1:'fight',a2:'treasure',b1:'event',b2:'fight',b3:'quest',c1:'rest',c2:'elite',c3:'treasure',d1:'miniboss',d2:'fight',e1:'treasure',e2:'event',f1:'rest',boss:'boss'},
  enemies:{normal:['wolf','bandit','poacher'],elite:['shadowWolf'],miniboss:'alpha',boss:'treant'},
  goods:['wolfFang','herb','oldCoin'],events:['howl','oldShrine','treasureMap','merchant','strangeRune']},
 mine:{name:'เหมืองร้างทางเหนือ',tier:1,exit:'north',theme:'mine',element:'earth',sky:['#120f0d','#3a2c20'],
  intro:'อุโมงค์เหมืองแตกออกเป็นหลายสาย ลึกสุดมีแสงผลึกเรืองรอง — ราชาโกเล็มผลึกเฝ้าอยู่ที่นั่น',
  types:{start:'start',a1:'treasure',a2:'fight',b1:'fight',b2:'event',b3:'quest',c1:'elite',c2:'rest',c3:'fight',d1:'miniboss',d2:'treasure',e1:'event',e2:'fight',f1:'rest',boss:'boss'},
  enemies:{normal:['bat','kobold','slime'],elite:['foreman'],miniboss:'golem',boss:'crystalKing'},
  goods:['batWing','crystalShard','oldCoin'],events:['lostMiner','treasureMap','oldShrine','merchant','strangeRune','fallenCart','wanderingKnight']},
 // v13 areas for the remaining village exits (variant themes reuse the forest / quarry looks with their own ground and weather)
 swamp:{name:'บึงหมอกตะวันตก',tier:2,exit:'west',theme:'swamp',element:'water',sky:['#1a2a22','#3a4a3a'],
  intro:'หมอกหนาลอยต่ำเหนือบึง ทางเดินจมโคลนครึ่งแข้ง — ไฮดราบึงพิษซ่อนตัวอยู่กลางหนองลึก',
  types:{start:'start',a1:'fight',a2:'event',b1:'treasure',b2:'quest',b3:'fight',c1:'fight',c2:'rest',c3:'event',d1:'miniboss',d2:'treasure',e1:'elite',e2:'fight',f1:'rest',boss:'boss'},
  enemies:{normal:['bogSlime','mireBat','bogHunter'],elite:['swampWitch'],miniboss:'mudTroll',boss:'bogHydra'},
  goods:['swampHerb','batWing','oldCoin'],events:['willowisp','oldShrine','treasureMap','merchant','strangeRune','wanderingKnight']},
 coast:{name:'ชายฝั่งหินผาตะวันออกเฉียงใต้',tier:2,exit:'southeast',theme:'coast',element:'water',sky:['#14304a','#3e7a9a'],
  intro:'คลื่นซัดโขดหินดังสนั่น เรือโจรสลัดจอดซ่อนในอ่าว — โกเล็มปะการังตื่นขึ้นที่ปลายแหลม',
  types:{start:'start',a1:'treasure',a2:'fight',b1:'fight',b2:'event',b3:'quest',c1:'elite',c2:'treasure',c3:'fight',d1:'miniboss',d2:'rest',e1:'event',e2:'fight',f1:'rest',boss:'boss'},
  enemies:{normal:['pirate','gull','seaSlime'],elite:['corsair'],miniboss:'captainHook',boss:'coralGolem'},
  goods:['pearl','driftwood','oldCoin'],events:['shipwreck','merchant','treasureMap','fallenCart','strangeRune','wanderingKnight']},
 frost:{name:'ช่องเขาหิมะตะวันออกเฉียงเหนือ',tier:3,exit:'northeast',theme:'frost',element:'ice',sky:['#4a5a70','#a8c0d8'],
  intro:'หิมะตกไม่หยุดบนทางขึ้นเขา ลมหนาวบาดผิว — ราชินีผลึกน้ำแข็งครองยอดเขาอยู่',
  types:{start:'start',a1:'fight',a2:'treasure',b1:'event',b2:'fight',b3:'quest',c1:'rest',c2:'elite',c3:'treasure',d1:'miniboss',d2:'fight',e1:'event',e2:'treasure',f1:'rest',boss:'boss'},
  enemies:{normal:['iceWolf','frostSlime','snowKobold'],elite:['frostWolf'],miniboss:'yeti',boss:'frostQueen'},
  goods:['frostFur','iceCore','oldCoin'],events:['hotSpring','oldShrine','merchant','treasureMap','strangeRune','wanderingKnight']},
 ruins:{name:'ซากวิหารตะวันตกเฉียงใต้',tier:3,exit:'southwest',theme:'ruins',element:'dark',sky:['#1e1628','#4a3a5a'],
  intro:'เสาหินพังกระจัดกระจาย แสงวิญญาณลอยวนในความเงียบ — ราชาแห่งความว่างเปล่ารออยู่ในห้องบูชาชั้นใน',
  types:{start:'start',a1:'event',a2:'fight',b1:'fight',b2:'treasure',b3:'quest',c1:'elite',c2:'event',c3:'fight',d1:'miniboss',d2:'treasure',e1:'fight',e2:'rest',f1:'rest',boss:'boss'},
  enemies:{normal:['skeleton','wisp','cultist'],elite:['ghostKnight'],miniboss:'gargoyle',boss:'voidKing'},
  goods:['boneCharm','soulGem','oldCoin'],events:['cursedIdol','oldShrine','strangeRune','treasureMap','merchant','wanderingKnight']}};
// v13 quests: each area offers several kinds — defeat the miniboss · defeat N enemies · bring N area goods
const QUESTS={
 forest:[{giver:'นายพรานเฒ่า',kind:'miniboss',text:'ปราบจ่าฝูงหมาป่า (♜ รองหัวหน้า)',ask:'จ่าฝูงหมาป่าตัวนั้นไล่กัดสัตว์ในป่าจนเกือบหมด',reward:{coins:50,items:['bigPotion','treasureMap']}},
  {giver:'หมอยาประจำหมู่บ้าน',kind:'collect',item:'herb',n:3,text:'เก็บสมุนไพรป่า 3 ชิ้น',ask:'ยาในร้านหมดแล้ว ช่วยเก็บสมุนไพรระหว่างทางให้หน่อย',reward:{coins:45,items:['bigPotion','tonic']}},
  {giver:'ยามป่า',kind:'kills',n:8,text:'กำจัดศัตรูในป่า 8 ตัว',ask:'โจรกับหมาป่าเยอะเกินไป ช่วยลดจำนวนมันลงที',reward:{coins:60,items:['guardCharm']}}],
 mine:[{giver:'หัวหน้าคนงานเหมือง',kind:'miniboss',text:'ทำลายโกเล็มหิน (♜ รองหัวหน้า)',ask:'โกเล็มหินขวางทางคนงานจนเข้าเหมืองไม่ได้',reward:{coins:50,items:['bigPotion','lostMiner']}},
  {giver:'ช่างอัญมณี',kind:'collect',item:'crystalShard',n:2,text:'หาเศษผลึกแร่ 2 ชิ้น',ask:'ข้าต้องการผลึกจากเหมืองลึกไปเจียระไน',reward:{coins:70,items:['iceBomb']}},
  {giver:'คนงานเหมือง',kind:'kills',n:8,text:'ไล่ศัตรูในเหมือง 8 ตัว',ask:'ค้างคาวกับโคโบลด์ทำให้พวกเราทำงานไม่ได้',reward:{coins:55,items:['firebomb']}}],
 swamp:[{giver:'คนเรือจ้าง',kind:'miniboss',text:'ปราบโทรลล์โคลน (♜ รองหัวหน้า)',ask:'โทรลล์ตัวนั้นพลิกเรือข้ามฟากจนไม่มีใครกล้าข้าม',reward:{coins:60,items:['bigPotion','willowisp']}},
  {giver:'หมอยาประจำหมู่บ้าน',kind:'collect',item:'swampHerb',n:3,text:'เก็บสมุนไพรหนองน้ำ 3 ชิ้น',ask:'ต้องการทำยาถอนพิษ ขาดแค่สมุนไพรจากบึง',reward:{coins:55,items:['bigPotion','tonic']}},
  {giver:'นักล่าบึง',kind:'kills',n:9,text:'กำจัดศัตรูในบึง 9 ตัว',ask:'สไลม์บึงแพร่พันธุ์เร็วเกินไป',reward:{coins:65,items:['guardCharm']}}],
 coast:[{giver:'ชาวประมง',kind:'miniboss',text:'ไล่กัปตันตะขอ (♜ รองหัวหน้า)',ask:'โจรสลัดยึดท่าเรือ เรือออกหาปลาไม่ได้มาหลายวัน',reward:{coins:65,items:['bigPotion','shipwreck']}},
  {giver:'พ่อค้าเครื่องประดับ',kind:'collect',item:'pearl',n:2,text:'หาไข่มุกทะเล 2 เม็ด',ask:'ลูกค้าสั่งสร้อยไข่มุกไว้ แต่ของยังไม่มา',reward:{coins:90,items:['tonic']}},
  {giver:'ยามท่าเรือ',kind:'kills',n:9,text:'กำจัดโจรสลัดและสัตว์ร้าย 9 ตัว',ask:'ช่วยทำให้ชายฝั่งปลอดภัยที',reward:{coins:65,items:['firebomb','guardCharm']}}],
 frost:[{giver:'นักปีนเขา',kind:'miniboss',text:'ล้มเยติ (♜ รองหัวหน้า)',ask:'เยติตัวนั้นถล่มที่พักของพวกเราพัง',reward:{coins:65,items:['bigPotion','hotSpring']}},
  {giver:'ช่างตัดเสื้อ',kind:'collect',item:'frostFur',n:3,text:'หาขนสัตว์หิมะ 3 ผืน',ask:'หน้าหนาวนี้ต้องตัดเสื้อกันหนาวให้ทั้งหมู่บ้าน',reward:{coins:70,items:['bread','tonic']}},
  {giver:'พรานภูเขา',kind:'kills',n:9,text:'ล่าสัตว์ร้ายบนเขา 9 ตัว',ask:'หมาป่าหิมะลงมากินแพะของชาวบ้าน',reward:{coins:65,items:['iceBomb']}}],
 ruins:[{giver:'นักบวชพเนจร',kind:'miniboss',text:'ทำลายการ์กอยล์ (♜ รองหัวหน้า)',ask:'การ์กอยล์ปกป้องห้องบูชาที่ถูกลัทธิมืดยึด',reward:{coins:70,items:['bigPotion','guardCharm']}},
  {giver:'นักโบราณคดี',kind:'collect',item:'soulGem',n:2,text:'หาอัญมณีวิญญาณ 2 เม็ด',ask:'ข้าอยากศึกษาพลังในอัญมณีจากวิหารนี้',reward:{coins:95,items:['strangeRune']}},
  {giver:'อัศวินแห่งวิหาร',kind:'kills',n:10,text:'ชำระวิหาร กำจัดศัตรู 10 ตัว',ask:'วิญญาณร้ายกับสาวกลัทธิยังวนเวียนอยู่',reward:{coins:75,items:['guardCharm','firebomb']}}]};
const NODE_TYPES={
 start:{name:'ทางเข้า',icon:'⌂',color:'#d8c9a0'},treasure:{name:'สมบัติ',icon:'◆',color:'#e6b53a'},event:{name:'เหตุการณ์',icon:'?',color:'#8fb7e0'},
 quest:{name:'เควส',icon:'!',color:'#f0d070'},shop:{name:'พ่อค้าเร่',icon:'⚖',color:'#d8a8e0'},mystery:{name:'ไม่ทราบ',icon:'❔',color:'#b0b0c8'},rest:{name:'จุดพัก',icon:'☾',color:'#9ed49a'},fight:{name:'ฝูงศัตรู',icon:'⚔',color:'#e08a6a'},
 elite:{name:'ศัตรูพิเศษ',icon:'✦',color:'#e36d4a'},miniboss:{name:'รองหัวหน้า',icon:'♜',color:'#d4483a'},boss:{name:'หัวหน้า',icon:'♛',color:'#b0222a'}};
return {CONSUMABLES,GOODS,EVENT_CARDS,GRAPH,FIXED,POOL,AREAS,NODE_TYPES,QUESTS};
})();
