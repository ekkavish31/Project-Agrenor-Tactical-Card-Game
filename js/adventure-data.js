// v11 adventure data: items, goods, event cards and area info (names, enemies, themes). Pure data (no UI).
// v94.02: the old branching area maps (GRAPH/FIXED/POOL/QUESTS/NODE_TYPES) were deleted with the old adventure — journeys use the world map.
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
return {CONSUMABLES,GOODS,EVENT_CARDS,AREAS};
})();
