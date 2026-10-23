// v09 Card Studio — designs every card on the silver frame + element orbs.
// • Opens from ✎ (the old numbers editor stays reachable from the top bar).
// • Left: live full-size card + hand-size card. Right: fields that fit on one screen; big groups open as side modals
//   that keep the card visible.
// • Layout = ZONES (boxes on the frame: position, direction, alignment, separator, plate colour)
//          + ITEMS (each piece of card info: which zone, order, same-line, alignment, size, colour, plate, text/symbol).
// • SYMBOLS replace words with pictures (built-in code icons or uploaded AI art), with a hover tip.
//   In any text: {atk} inserts a symbol; words listed on a symbol with "auto" on are replaced automatically.
// • Design-only data (localStorage 'card-studio-v1'); export JSON / JS / ZIP to make it permanent.
// • window.CardStudio.cardHTML(card, design, {mini}) + fit(el) + bindTips() are the renderer to reuse in the game.
(function(){
const KEY='card-studio-v1',FRAME='assets/cards/frame-silver.webp',RATIO=750/1101;
const ELEMENTS={fire:'ไฟ',water:'น้ำ',light:'แสง',dark:'มืด',wind:'ลม',ice:'น้ำแข็ง',earth:'ดิน',nature:'ธรรมชาติ',chaos:'โกลาหล',fusion:'ผสาน'};
const ELEMENT_COLOR={fire:'#e0582a',water:'#2f7fd6',light:'#e8b93a',dark:'#6a3aa8',wind:'#3fae8a',ice:'#9fd2ee',earth:'#9a6a3a',nature:'#5aa83a',chaos:'#b03ab8',fusion:'#d98ad6'};
const elementFile=k=>'assets/cards/elements/'+k+'.webp';
const FAMILIES={move:'เคลื่อนที่',action:'แอ็กชัน',consumable:'ของใช้',event:'เหตุการณ์',unit:'ตัวละคร',enemy:'ศัตรู',equip:'อุปกรณ์',goods:'ไอเทมทั่วไป',material:'วัตถุดิบ'};
const FAMILY_ICON={move:'➜',action:'⚔',consumable:'⚗',event:'✉',unit:'☺',enemy:'☠',equip:'⛨',goods:'◈',material:'▰'};
// card types that share one card structure (template = zones + items)
const GROUPS={play:{name:'การ์ดใช้งาน',families:['move','action','consumable','event']},unit:{name:'การ์ดยูนิต',families:['unit','enemy']},goods:{name:'การ์ดสิ่งของ',families:['equip','goods','material']}};
const GROUP_OF=Object.fromEntries(Object.entries(GROUPS).flatMap(([g,v])=>v.families.map(f=>[f,g])));
// card structures: ตัวละคร / มอนสเตอร์ / บอส แยกโครงกัน (บอส = ศัตรูระดับหัวหน้า)
const TEMPLATES={play:{name:'การ์ดใช้งาน',families:['move','action','consumable','event']},unit:{name:'การ์ดตัวละคร',families:['unit']},enemy:{name:'การ์ดมอนสเตอร์',families:['enemy']},boss:{name:'การ์ดบอส (ศัตรูระดับหัวหน้า)',families:['enemy']},goods:{name:'การ์ดสิ่งของ',families:['equip','goods','material']}};
const templateKey=c=>c?.family==='enemy'?(c.attr?.rank==='หัวหน้า'?'boss':'enemy'):GROUP_OF[c?.family]||'play';
const RANK_NAMES=['ทั่วไป','พิเศษ','รองหัวหน้า','หัวหน้า'];
// per-type fields: [path, label, 'num' | 'text' | [options]]
const FIELDS={
 move:[['type','ชนิด',['ก้าว','เดิน','วิ่ง','พิเศษ']],['attr.move','เดินได้ (ช่อง)','num'],['cost.energy','ϟ แรง','num']],
 action:[['type','ชนิด',['โจมตี','ท่าพิเศษ','เวท','ป้องกัน','ฟื้นฟู','สนับสนุน']],['attr.power','พลัง','num'],['cost.energy','ϟ แรง','num'],['range','↔ ระยะ','num'],['attr.target','เป้าหมาย',['ศัตรู','ตัวเอง','พวกเดียวกัน','พื้นที่']],['attr.shape','รูปแบบ',['เดี่ยว','แนวตรง','วงรอบ','ผลัก','ดึง']]],
 consumable:[['type','ชนิด',['ฟื้นฟู','เสริมพลัง','โจมตี','อื่นๆ']],['attr.use','ใช้ได้ที่',['ทุกที่','ต่อสู้','แผนที่']],['attr.hp','ฟื้น HP','num'],['attr.stamina','ฟื้นแรง','num'],['attr.power','ความเสียหาย','num'],['range','↔ ระยะ','num'],['attr.price','ราคา','num']],
 event:[['type','ชนิด',['สมบัติ','ต่อสู้','เควส','พักผ่อน','พ่อค้า','ลึกลับ']],['attr.area','พื้นที่',['ทุกที่','ป่า','เหมือง']],['cost.minutes','◷ นาที','num']],
 unit:[['type','บทบาท',['แนวหน้า','ยิงไกล','เวท','สนับสนุน']],['attr.weapon','อาวุธ','text'],['attr.hp','HP','num'],['attr.atk','โจมตี','num'],['attr.def','ป้องกัน','num'],['attr.move','เดิน','num'],['attr.speed','ความเร็ว','num'],['range','↔ ระยะ','num'],['attr.traits','ลักษณะ','text'],['attr.price','ค่าจ้าง','num']],
 enemy:[['attr.rank','ระดับ',RANK_NAMES],['type','พฤติกรรม',['ประชิด','ยิงไกล','รักษาระยะ','หัวหน้า']],['attr.area','พื้นที่',['ป่า','เหมือง','ทุกที่']],['attr.traits','ลักษณะ','text'],['attr.hp','HP','num'],['attr.atk','ประชิด','num'],['attr.ranged','ยิงไกล','num'],['range','↔ ระยะยิง','num'],['attr.move','เดิน','num'],['attr.speed','ความเร็ว','num'],['attr.title','ฉายา (บอส)','text'],['attr.drops','ของที่ดรอป','text']],
 equip:[['type','ช่องใส่',['อาวุธ','โล่','เกราะ','เครื่องประดับ']],['attr.atk','โจมตี','num'],['attr.def','ป้องกัน','num'],['range','↔ ระยะ','num'],['cost.energy','ϟ แรงต่อครั้ง','num'],['attr.price','ราคา','num']],
 goods:[['type','ใช้สำหรับ',['ขาย','เควส','สะสม','อื่นๆ']],['attr.price','ราคาขาย','num']],
 material:[['type','ชนิด',['โลหะ','เชื้อเพลิง','ไม้','อาหาร','แร่','อื่นๆ']],['attr.craft','ใช้ทำ','text'],['attr.price','ราคา','num']]};
const FAMILY_BG={move:'#2f5577',action:'#6b2630',consumable:'#2f6a55',event:'#4a3a6a',unit:'#3a5a7a',enemy:'#5a2626',equip:'#4b5258',goods:'#6a5a33',material:'#5d4a33'};
const DEFAULT_RARITIES=[{key:'common',name:'ธรรมดา',color:'#c9ccd2',strength:0},{key:'good',name:'ดี',color:'#c8783a',strength:.55},{key:'rare',name:'หายาก',color:'#3f8fd6',strength:.6},{key:'epic',name:'ยอดเยี่ยม',color:'#9a52d8',strength:.6},{key:'legend',name:'ตำนาน',color:'#e0a92a',strength:.7}];
// zones: % of the card (x,y,w,h); fs = base font in % of card width; dir row|col; justify start|center|end|between; valign start|center|end
const DEFAULT_ZONES={
 art:{label:'หน้าต่างภาพ',x:6,y:15.6,w:87.1,h:42.6},
 orb:{label:'มุมลูกแก้ว',x:-1.5,y:-1.2,w:19,h:12.9,fs:4,square:true,dir:'row',justify:'center',valign:'center'},
 title:{label:'แถบหัว · ชื่อ',x:18,y:5.6,w:52,h:7.6,fs:6.2,dir:'row',justify:'center',valign:'center'},
 cost:{label:'แถบหัว · ค่าใช้',x:69,y:6,w:22,h:7,fs:3.6,dir:'row',justify:'end',valign:'center',gap:1.2},
 level:{label:'ป้ายมุมภาพ',x:80,y:51.6,w:11,h:4.8,fs:3.6,dir:'row',justify:'center',valign:'center',bg:'#2b2116d9'},
 middle:{label:'แถบกลาง',x:8,y:60.8,w:84,h:5,fs:3.4,dir:'row',justify:'center',valign:'center',sep:' · '},
 text:{label:'กล่องผล',x:9,y:69.6,w:82,h:19.6,fs:4.4,dir:'col',justify:'center',valign:'start',gap:1},
 footer:{label:'แถบท้าย',x:9,y:91,w:82,h:4,fs:3.2,dir:'row',justify:'between',valign:'center'}};
// every piece of information a card can show
const lvOf=c=>Math.max(1,c.level||1);
const ITEMS={
 elementOrb:{label:'ลูกแก้วธาตุ (ภาพ)'},
 name:{label:'ชื่อการ์ด',get:c=>c.name},
 energy:{label:'แรงที่ใช้',get:c=>c.cost?.energy||'',pre:'ϟ',sym:'energy'},
 minutes:{label:'เวลาที่ใช้',get:c=>c.cost?.minutes||'',pre:'◷',sym:'time'},
 range:{label:'ระยะ',get:c=>c.range||'',pre:'↔',sym:'range'},
 level:{label:'เลเวล (Lv.)',get:c=>'Lv.'+lvOf(c)},
 elementName:{label:'ชื่อธาตุ',get:c=>ELEMENTS[c.element]||''},
 family:{label:'ชนิดการ์ด (เคลื่อนที่ แอ็กชัน …)',get:c=>FAMILIES[c.family]||''},
 type:{label:'ประเภท',get:c=>c.type},
 tags:{label:'แท็ก',get:c=>c.tags,split:true},
 mainValue:{label:'ค่าหลัก',get:c=>c.main?.value},
 mainLabel:{label:'คำอธิบายค่าหลัก',get:c=>c.main?.label,rich:true},
 effects:{label:'ผลของการ์ด (หลายบรรทัด)',lines:true,rich:true},
 condition:{label:'เงื่อนไข',get:c=>c.condition,rich:true},
 title:{label:'ฉายา (บอส)',get:c=>c.attr?.title||''},
 weapon:{label:'อาวุธ',get:c=>c.attr?.weapon||''},
 traitsText:{label:'ลักษณะ (บิน เท้าเบา…)',get:c=>c.attr?.traits||''},
 area:{label:'พื้นที่',get:c=>c.attr?.area?'⌖ '+c.attr.area:''},
 drops:{label:'ของที่ดรอป',get:c=>c.attr?.drops?'ดรอป: '+c.attr.drops:'',sym:'coin'},
 statLine:{label:'แถวค่าสถานะ (HP โจมตี ป้องกัน…)'},
 price:{label:'ราคา',get:c=>c.attr?.price||'',pre:'◉',sym:'coin'},
 rank:{label:'ระดับศัตรู',get:c=>{let r=c.attr?.rank||'';return r?({หัวหน้า:'♛ ',รองหัวหน้า:'♜ ',พิเศษ:'◆ '}[r]||'')+r:''}},
 rarity:{label:'ความหายาก'},
 levelGems:{label:'เม็ดเลเวล ◆◇'}};
// v19: custom items live in the template (it.custom = {label, kind:'text'|'field', text, field, pre})
function itemDef(k,it){if(ITEMS[k])return ITEMS[k];let x=it?.custom;if(!x)return null;
 return {label:x.label||'หัวข้อใหม่',custom:true,pre:x.pre||'',get:c=>x.kind==='field'?String(x.field||'').split('.').reduce((o,q)=>o?.[q],c)??'':(x.text||'')}}
const itLabel=(k,it)=>itemDef(k,it||(typeof store!=='undefined'&&store?tpl().items[k]:null))?.label||k;
const FIELD_CHOICES=()=>{let m=new Map([['name','ชื่อการ์ด'],['type','ประเภท/ชนิด'],['main.value','ค่าหลัก'],['main.label','คำอธิบายค่าหลัก'],['cost.energy','แรงที่ใช้'],['cost.minutes','เวลาที่ใช้'],['range','ระยะ'],['level','เลเวล'],['maxLevel','เลเวลสูงสุด'],['tags','แท็ก'],['condition','เงื่อนไข']]);
 for(let F of Object.values(FIELDS))for(let [p,l] of F)if(!m.has(p))m.set(p,String(l));for(let c of Object.values(store.cards))for(let k of Object.keys(c.stats||{}))m.set('stats.'+k,'ค่ากลไก: '+k);return [...m]};
const IT=o=>({zone:'',order:1,show:true,join:false,push:false,align:'',size:0,color:'',bg:'',bold:false,italic:false,mode:'text',sym:'',mini:false,...o});
const DEFAULT_ITEMS={
 elementOrb:IT({zone:'orb',order:1,mini:true}),
 name:IT({zone:'title',order:1,bold:true,color:'#2b1f12',mini:true}),
 energy:IT({zone:'cost',order:1,bold:true,color:'#fff1cf',bg:'#2b2116',mini:true}),
 minutes:IT({zone:'cost',order:2,bold:true,color:'#fff1cf',bg:'#43586b',mini:true}),
 level:IT({zone:'level',order:1,bold:true,color:'#fff4d2'}),
 elementName:IT({zone:'middle',order:1,bold:true,color:'#3a2c1b'}),
 family:IT({zone:'',show:false,mode:'icon',symMap:{'เคลื่อนที่':'move','แอ็กชัน':'atk','ของใช้':'heal','อุปกรณ์':'def','ของมีค่า':'coin'}}),
 type:IT({zone:'middle',order:3,bold:true,color:'#3a2c1b'}),
 tags:IT({zone:'middle',order:4,bold:true,color:'#3a2c1b'}),
 range:IT({zone:'middle',order:5,bold:true,color:'#3a2c1b'}),
 mainValue:IT({zone:'text',order:1,size:5.9,bold:true,color:'#7d2f14',mini:true}),
 mainLabel:IT({zone:'text',order:2,join:true,bold:true,color:'#7d2f14',mini:true}),
 effects:IT({zone:'text',order:3,color:'#33281b'}),
 condition:IT({zone:'text',order:4,size:3.6,italic:true,color:'#7b6a52',push:true}),
 rarity:IT({zone:'footer',order:1,bold:true,color:'#3a2c1b',mini:true}),
 levelGems:IT({zone:'footer',order:2,color:'',mini:true}),
 statLine:IT({zone:'',show:false,mode:'both',bold:true,color:'#3a2c1b'}),price:IT({zone:'',show:false,bold:true,color:'#fff1cf',bg:'#6a4a14'}),rank:IT({zone:'',show:false,bold:true,color:'#fff4d2'})};
function clone2(o){return JSON.parse(JSON.stringify(o))}
// unit cards (character / enemy): level in the header, rank badge on the art, stat chips on top of the text box
const ART_TAG={label:'ป้ายบนภาพ',x:8,y:16.8,w:50,h:4.6,fs:3.2,dir:'row',justify:'start',valign:'center',gap:.8};
const HIDE=IT({zone:'',show:false});
// การ์ดตัวละคร: Lv บนหัว · บทบาทบนภาพ · อาวุธ/ธาตุ/ลักษณะ · แถวค่าสถานะ · ความสามารถ · เม็ดเลเวล
const UNIT_ITEMS={...clone2(DEFAULT_ITEMS),energy:HIDE,minutes:HIDE,range:HIDE,mainValue:HIDE,mainLabel:HIDE,rank:HIDE,price:HIDE,
 level:IT({zone:'cost',order:1,bold:true,color:'#fff1cf',bg:'#2b2116',mini:true}),type:IT({zone:'artTag',order:1,bold:true,color:'#fff1cf',bg:'#2b2116d9',mini:true}),
 weapon:IT({zone:'middle',order:1,bold:true,color:'#3a2c1b'}),elementName:IT({zone:'middle',order:2,bold:true,color:'#3a2c1b'}),traitsText:IT({zone:'middle',order:3,bold:true,color:'#3a2c1b'}),tags:HIDE,
 statLine:IT({zone:'stats',order:1,mode:'both',bold:true,color:'#3a2c1b',mini:true}),effects:IT({zone:'text',order:2,color:'#33281b'}),condition:IT({zone:'text',order:3,size:3.1,italic:true,color:'#7b6a52',push:true})};
// การ์ดมอนสเตอร์: ระดับบนหัว · พื้นที่บนภาพ · พฤติกรรม/ลักษณะ/ธาตุ · ค่าสถานะ · พฤติกรรม · ของที่ดรอป
const ENEMY_ITEMS={...clone2(UNIT_ITEMS),level:HIDE,levelGems:HIDE,weapon:HIDE,
 rank:IT({zone:'cost',order:1,bold:true,color:'#fff1cf',bg:'#5a2626',mini:true}),area:IT({zone:'artTag',order:1,bold:true,color:'#fff1cf',bg:'#2b2116d9'}),type:IT({zone:'middle',order:1,bold:true,color:'#3a2c1b'}),
 condition:HIDE,drops:IT({zone:'text',order:3,size:3.3,italic:true,color:'#6a4a24',push:true,mode:'both'})};
// การ์ดบอส: ฉายาเป็นแถบแดงใต้ชื่อ · ♛ หัวหน้า · ท่าพิเศษหลายบรรทัด · เงื่อนไขชนะ · ของที่ดรอป
const BOSS_ITEMS={...clone2(ENEMY_ITEMS),rank:IT({zone:'cost',order:1,bold:true,color:'#2a1a05',bg:'#e0b040',mini:true}),title:IT({zone:'banner',order:1,bold:true,color:'#ffe9b0',mini:true}),
 name:IT({zone:'title',order:1,bold:true,color:'#4a0e0e',size:6.6,mini:true}),area:HIDE,type:HIDE,
 effects:IT({zone:'text',order:2,color:'#33281b',size:3.3}),condition:IT({zone:'text',order:3,size:3,bold:true,color:'#8a1a1a'}),drops:IT({zone:'text',order:4,size:2.9,italic:true,color:'#6a4a24',push:true,mode:'both'})};
const GOODS_ITEMS={...clone2(DEFAULT_ITEMS),energy:IT({zone:'',show:false}),minutes:IT({zone:'',show:false}),level:IT({zone:'',show:false}),
 price:IT({zone:'cost',order:1,bold:true,color:'#fff1cf',bg:'#6a4a14',mode:'both',mini:true}),
 statLine:IT({zone:'text',order:1,mode:'both',bold:true,color:'#3a2c1b',mini:true}),mainValue:IT({zone:'text',order:2,size:5.2,bold:true,color:'#7d2f14'}),mainLabel:IT({zone:'text',order:3,join:true,bold:true,color:'#7d2f14'}),
 effects:IT({zone:'text',order:4,color:'#33281b'}),condition:IT({zone:'text',order:5,size:3.4,italic:true,color:'#7b6a52',push:true})};
// v13 frames for unit cards: character = red-gold · enemies by rank: normal light green · elite light blue · miniboss shiny silver · boss shiny gold
const RANK_FRAME={'ทั่วไป':'assets/cards/frame-rank-normal.webp','พิเศษ':'assets/cards/frame-rank-elite.webp','รองหัวหน้า':'assets/cards/frame-rank-miniboss.webp','หัวหน้า':'assets/cards/frame-rank-boss.webp'};
function frameFor(c,tk){let f=tk==='unit'?'assets/cards/frame-unit.webp':tk==='boss'?RANK_FRAME['หัวหน้า']:tk==='enemy'?(RANK_FRAME[c.attr?.rank]||RANK_FRAME['ทั่วไป']):'';return f?f+'?v=19':''}
// zones fitted to the gold master frame (name bar · big art window · info box)
// v19 frame (top name banner · big art window · bottom parchment panel) — same shape for unit / enemy / boss, colour by rank
const FRAMED_ZONES=()=>({art:{label:'หน้าต่างภาพ',x:7.1,y:14.6,w:85.8,h:62.7},
 orb:{label:'มุมลูกแก้ว',x:-2.5,y:-2,w:17.5,h:11.9,fs:4,square:true,dir:'row',justify:'center',valign:'center'},
 title:{label:'แถบหัว · ชื่อ',x:15,y:5.3,w:52,h:6.4,fs:5.2,dir:'row',justify:'center',valign:'center'},
 cost:{label:'แถบหัว · Lv/ระดับ',x:66,y:6.1,w:24.5,h:4.8,fs:3.3,dir:'row',justify:'end',valign:'center',gap:1},
 artTag:{label:'ป้ายบนภาพ',x:10,y:16.6,w:56,h:4.6,fs:3.1,dir:'row',justify:'start',valign:'center',gap:.8},
 level:{label:'ป้ายมุมภาพ',x:78,y:16.6,w:12,h:4.6,fs:3.4,dir:'row',justify:'center',valign:'center',bg:'#2b2116d9'},
 middle:{label:'แถบลักษณะ (ขอบล่างภาพ)',x:10,y:71.4,w:80,h:4.4,fs:3.1,dir:'row',justify:'center',valign:'center',sep:' · ',bg:'#f4ead8e6'},
 stats:{label:'แถบค่าสถานะ',x:9,y:80.2,w:82,h:4.8,fs:3.5,dir:'row',justify:'center',valign:'center',gap:1.2},
 text:{label:'กล่องผล',x:10,y:85.1,w:80,h:5.6,fs:3.2,dir:'col',justify:'center',valign:'start',gap:.4},
 footer:{label:'แถบท้าย',x:12,y:90.7,w:76,h:2.2,fs:2.4,dir:'row',justify:'between',valign:'center'}});
const DEFAULT_TEMPLATES=()=>({play:{zones:clone2(DEFAULT_ZONES),items:clone2(DEFAULT_ITEMS)},unit:{zones:FRAMED_ZONES(),items:clone2(UNIT_ITEMS),framed:19},enemy:{zones:FRAMED_ZONES(),items:clone2(ENEMY_ITEMS),framed:19},boss:{zones:{...FRAMED_ZONES(),title:{...FRAMED_ZONES().title,fs:5.6},banner:{label:'แถบฉายา',x:8,y:66.6,w:84,h:4.4,fs:3.3,dir:'row',justify:'center',valign:'center',bg:'#7a1a1ae0'}},items:clone2(BOSS_ITEMS),framed:19},goods:{zones:clone2(DEFAULT_ZONES),items:clone2(GOODS_ITEMS)}});
const STAT_KEYS=[['speed','speed','ความเร็ว'],['hp','hp','HP'],['atk','atk','โจมตี'],['power','atk','พลัง'],['ranged','bow','ยิงไกล'],['def','def','ป้องกัน'],['move','move','เดิน'],['stamina','energy','ฟื้นแรง']];
// built-in symbols drawn in code (24×24); an uploaded image or file path overrides the drawing
const BUILTIN={
 atk:'<path d="M4 4l10.5 10.5M20 4L9.5 14.5" stroke="#3a3f45" stroke-width="4" stroke-linecap="round"/><path d="M4 4l10.5 10.5M20 4L9.5 14.5" stroke="#e8edf2" stroke-width="2.2" stroke-linecap="round"/><path d="M6.6 14.8l2.8 2.8M17.4 14.8l-2.8 2.8" stroke="#c9922e" stroke-width="2.6" stroke-linecap="round"/><path d="M7.4 17.6L4.6 20.4M16.6 17.6l2.8 2.8" stroke="#6a3e16" stroke-width="2.6" stroke-linecap="round"/>',
 def:'<path d="M12 2.5l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10v-6z" fill="#4f7fb8" stroke="#1f3550" stroke-width="1.4"/><path d="M12 5.2v13.6M6.8 10h10.4" stroke="#d6e6f6" stroke-width="1.4"/>',
 energy:'<path d="M13.5 2L5 13.5h6L9.5 22 19 9.5h-6z" fill="#f4c430" stroke="#7a5a10" stroke-width="1.2" stroke-linejoin="round"/>',
 time:'<circle cx="12" cy="12" r="9" fill="#5b7894" stroke="#1f3550" stroke-width="1.4"/><path d="M12 7v5.5l3.5 2" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>',
 range:'<path d="M3 12h18M3 12l4-4M3 12l4 4M21 12l-4-4M21 12l-4 4" stroke="#1f4a36" stroke-width="4" stroke-linecap="round" fill="none"/><path d="M3 12h18M3 12l4-4M3 12l4 4M21 12l-4-4M21 12l-4 4" stroke="#53c08e" stroke-width="2" stroke-linecap="round" fill="none"/>',
 heat:'<path d="M12 2c1 4 6 6 6 12a6 6 0 01-12 0c0-3 2-5 3-6 0 2 1 3 2 3-1-3 0-6 1-9z" fill="#e8642a" stroke="#7a2a10" stroke-width="1.2"/><path d="M12 13c1 2 3 3 3 5a3 3 0 01-6 0c0-1.5 1-2.5 3-5z" fill="#ffd04a"/>',
 speed:'<path d="M3 15h9M5 11h9M7 7h7" stroke="#3a7ab8" stroke-width="2" stroke-linecap="round"/><path d="M13 5l8 7-8 7z" fill="#5fa8e8" stroke="#1f4a70" stroke-width="1.2" stroke-linejoin="round"/>',
 bow:'<path d="M6 3c8 2 13 7 15 15" stroke="#6a4322" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M6 3L21 18" stroke="#ddd" stroke-width="1"/><path d="M4 20L16 8" stroke="#3a2a14" stroke-width="1.8" stroke-linecap="round"/><path d="M16 8l-4 .6 3.4 3.4z" fill="#9aa0a8" stroke="#3a3f45"/>',
 hp:'<path d="M12 20.5S3 15 3 8.8A4.6 4.6 0 0112 7a4.6 4.6 0 019 1.8c0 6.2-9 11.7-9 11.7z" fill="#d8434f" stroke="#6a1820" stroke-width="1.2"/><path d="M7.5 9a2.4 2.4 0 012.6-1.6" stroke="#ffd0d4" stroke-width="1.3" stroke-linecap="round"/>',
 heal:'<path d="M12 20.5S3 15 3 8.8A4.6 4.6 0 0112 7a4.6 4.6 0 019 1.8c0 6.2-9 11.7-9 11.7z" fill="#d8434f" stroke="#6a1820" stroke-width="1.2"/><path d="M12 10v6M9 13h6" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/>',
 move:'<path d="M8 3h5.5v8.2l5.8 2.8V18H5v-4.3l3-1.6z" fill="#8a5a32" stroke="#3a2412" stroke-width="1.2" stroke-linejoin="round"/><path d="M5 18h14.3v2.6H5z" fill="#3a2412"/>',
 magic:'<path d="M12 2l2.6 6.4L21 9l-5 4.3L17.5 20 12 16.5 6.5 20 8 13.3 3 9l6.4-.6z" fill="#b27ae8" stroke="#4a2470" stroke-width="1.2" stroke-linejoin="round"/>',
 coin:'<circle cx="12" cy="12" r="9" fill="#e6b53a" stroke="#7a5a10" stroke-width="1.4"/><circle cx="12" cy="12" r="5.4" fill="none" stroke="#fff3c0" stroke-width="1.4"/>',
 life:'<path d="M4.5 5.5h9.5v5H4.5z" fill="#9aa3ad" stroke="#3a3f45" stroke-width="1.2"/><path d="M11 10.5l8 9.5" stroke="#3a2412" stroke-width="3.6" stroke-linecap="round"/><path d="M11 10.5l8 9.5" stroke="#a8743f" stroke-width="2" stroke-linecap="round"/>'};
const SYM=(name,tip,words=[],auto=false,inline='icon+text')=>({name,tip,words,auto,inline,src:'',builtin:true});
const DEFAULT_SYMBOLS={
 atk:SYM('พลังโจมตี','ความเสียหายที่ทำต่อเป้าหมาย',['พลังโจมตี','ความเสียหาย'],true),
 def:SYM('ป้องกัน','ลดความเสียหายที่ได้รับ (DEF)',['DEF','ป้องกัน'],true),
 energy:SYM('แรง','Stamina ที่ใช้ในการเล่นการ์ด',['Stamina']),
 time:SYM('เวลา','เวลาในเกมที่ใช้ (นาที)'),
 range:SYM('ระยะ','ระยะที่ใช้ได้ (ช่อง)'),
 heat:SYM('ความร้อน','ความร้อนของโลหะ/เกราะ',['ความร้อน']),
 hp:SYM('HP','พลังชีวิต',['HP']),
 bow:SYM('ยิงไกล','พลังโจมตีระยะไกล'),
 speed:SYM('ความเร็ว','ยิ่งเร็วยิ่งได้คิวเล่นถี่ (ระบบ CT)'),
 heal:SYM('ฟื้นฟู','ฟื้น HP หรือ Stamina',['ฟื้น']),
 move:SYM('เคลื่อนที่','จำนวนช่องที่เดินได้',['ช่อง']),
 magic:SYM('เวทมนตร์','ความเสียหายเวท ไม่สนเกราะ',['เวท']),
 coin:SYM('เหรียญ','เงินในเกม',['เหรียญ']),
 life:SYM('งานคราฟต์/ชีวิต','ใช้ในการใช้ชีวิตในหมู่บ้าน',['งานคราฟต์'])};
// ---------- icon pack (assets/icons/pack) — pick these to stand in for words ----------
const ICON_PACK=[['atk','ดาบไขว้','พลังโจมตี'],['def','โล่','ป้องกัน'],['magic','หมวกเวท','เวทมนตร์'],['speed','รองเท้ามีปีก','ความเร็ว'],['hp','หัวใจ','HP'],['mp','หยดเลือด','MP / พลังเวท'],['power','ดาวแปดแฉก','พลังพิเศษ'],
 ['strength','กล้ามแขน','พละกำลัง'],['book','หนังสือ','ความรู้'],['eye','ดวงตา','การมองเห็น'],['target','เป้าเล็ง','ความแม่นยำ / เป้าหมาย'],['burst','ประกายแตก','คริติคอล'],['time','นาฬิกาทราย','เวลา'],['time-back','นาฬิกาทรายย้อน','รีเซ็ต / ย้อนเวลา'],
 ['heal','กากบาทรักษา','ฟื้นฟู'],['care','มือประคอง','ดูแล / ฟื้นฟูพวกเดียวกัน'],['skull','หัวกะโหลก','ล้ม / ความตาย'],['fire','ไฟ','ธาตุไฟ'],['water','น้ำ','ธาตุน้ำ'],['wind','ลม','ธาตุลม'],['earth','ภูเขา','ธาตุดิน'],
 ['ice','เกล็ดหิมะ','ธาตุน้ำแข็ง'],['nature','ใบไม้','ธาตุธรรมชาติ'],['light','ดวงอาทิตย์','ธาตุแสง'],['dark','จันทร์เสี้ยว','ธาตุมืด'],['chaos','วังวน','ธาตุโกลาหล'],['fusion','ประกายคู่','ธาตุผสาน'],['crown','มงกุฎ','หัวหน้า'],
 ['arrow','ลูกศร','ยิงไกล'],['bow-icon','ธนู','ธนู'],['axe','ขวาน','ขวาน'],['spear','หอก','หอก'],['hammer','ค้อน','ค้อน / งานคราฟต์'],['shuriken','ดาวกระจาย','อาวุธขว้าง'],['mace','กระบอง','กระบอง'],
 ['res-fire','โล่กันไฟ','ต้านไฟ'],['res-water','โล่กันน้ำ','ต้านน้ำ'],['res-ice','โล่กันน้ำแข็ง','ต้านน้ำแข็ง'],['res-thunder','โล่กันสายฟ้า','ต้านสายฟ้า'],['res-nature','โล่กันธรรมชาติ','ต้านธรรมชาติ'],['res-dark','โล่กันมืด','ต้านมืด'],['res-light','โล่กันแสง','ต้านแสง'],
 ['hp-up','HP เพิ่ม','HP เพิ่มขึ้น'],['mp-up','MP เพิ่ม','MP เพิ่มขึ้น'],['atk-up','โจมตีเพิ่ม','พลังโจมตีเพิ่มขึ้น'],['def-up','ป้องกันเพิ่ม','ป้องกันเพิ่มขึ้น'],['speed-up','ความเร็วเพิ่ม','ความเร็วเพิ่มขึ้น'],['power-up','พลังพิเศษเพิ่ม','พลังพิเศษเพิ่มขึ้น'],['refresh','หมุนเวียน','สับเปลี่ยน / จั่วใหม่'],
 ['hp-down','HP ลด','HP ลดลง'],['mp-down','MP ลด','MP ลดลง'],['atk-down','โจมตีลด','พลังโจมตีลดลง'],['def-down','ป้องกันลด','ป้องกันลดลง'],['speed-down','ความเร็วลด','ความเร็วลดลง'],['power-down','พลังพิเศษลด','พลังพิเศษลดลง'],['link','โซ่','เชื่อมโยง']];
const ICON_FILE={'bow-icon':'bow'};
const iconSrc=k=>'assets/icons/pack/'+(ICON_FILE[k]||k)+'.webp';
for(let [k,ic] of Object.entries({atk:'atk',def:'def',hp:'hp',speed:'speed',magic:'magic',heal:'heal',time:'time',bow:'bow-icon',heat:'fire',life:'hammer'}))if(DEFAULT_SYMBOLS[k])DEFAULT_SYMBOLS[k].src=iconSrc(ic);
for(let [k,label,tip] of ICON_PACK)if(!DEFAULT_SYMBOLS[k])DEFAULT_SYMBOLS[k]={...SYM(tip,''),src:iconSrc(k),builtin:false,pack:true};
const clone=o=>JSON.parse(JSON.stringify(o)),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>{let n=Number(v);return Number.isFinite(n)?n:0};
const asset=id=>{let e=(window.ASSET_MANIFEST?.assets||[]).find(a=>a.id===id);return e&&e.file&&['final','temp'].includes(e.status)?e.file:''};
function blank(id,family){return {id,family,ref:null,name:'การ์ดใหม่',element:'',rarity:'common',level:1,maxLevel:5,type:'',tags:'',cost:{energy:0,minutes:0},range:0,main:{value:'',label:''},effects:[''],condition:'',notes:'',attr:{},art:{src:'',x:0,y:0,scale:1,rot:0,flipX:false,fit:'cover'},stats:{}}}
// ---------------- seed from the current game data ----------------
// Upgrade only installed sprite artwork; uploaded/custom art keeps its identity and crop.
function upgradeUnitCardArt(c){if(c.id==='u-hero'&&Array.isArray(c.effects))c.effects=c.effects.map(t=>t==='ตัวเอก · หัวหน้าทีม ล้มแล้วแพ้ทั้งศึก'?'ตัวเอก · สลบแล้วช่วยฟื้นได้ภายใน 3 CT':t);if(c.family==='move'&&Array.isArray(c.effects))c.effects=c.effects.map(t=>t==='เลือกได้ 1 ใบต่อเทิร์น'?'ใบที่ 2 แลกสิทธิ์ต่อสู้ทั้งหมดของเทิร์น':t);
 const a=window.UNIT_CARD_ART?.[c.id];
 if(a&&!c.art?.data&&(!c.art?.src||a.legacy.includes(c.art.src))){
  c.art={...c.art,src:a.src,fit:'cover',x:0,y:0,scale:1,rot:0,flipX:false};
 }
 return c;
}
function gameCards(){let out=[],rk=n=>({'ธรรมดา':'common','ดี':'good','หายาก':'rare','ยอดเยี่ยม':'epic','ตำนาน':'legend'})[n]||n||'common';
 const mk=(id,family,o,attr={})=>{let k=blank(id,family);Object.assign(k,o);k.attr={...attr};k.rarity=rk(k.rarity);return k};
 const D=typeof defs!=='undefined'?defs:[],T=window.TacticsDecks,C=window.TacticsCore,AD=window.ADVENTURE_DATA;
 // move
 if(T){const MK={dash:['วิ่ง','wind'],creep:['ก้าว','dark'],step:['ก้าว','earth'],walk:['เดิน','wind'],run:['วิ่ง','wind'],sprint:['วิ่ง','fire']};
  for(let [id,m] of Object.entries(T.MOVE)){let k=mk('m-'+id,'move',{ref:id,name:m.name,element:(MK[id]||[])[1]||'wind',type:(MK[id]||[])[0]||'เดิน',cost:{energy:m.stamina||0,minutes:0},main:{value:'↦ '+m.move,label:'ช่อง'},effects:['ใบที่ 2 แลกสิทธิ์ต่อสู้ทั้งหมดของเทิร์น']},{move:m.move});k.art.src=asset('tactic-card-'+id);out.push(k)}
 // action (tactic combat deck + the 3 old forge-combat forms)
  const INFO={flame:['โจมตี','อาวุธ +4','ฟันด้วยเปลวไฟ','เผาหญ้าสูงได้ · แรง +4',4,'fire'],gust:['ท่าพิเศษ','7','ลมผลักถอย 1 ช่อง','ระยะ 3 · แรง 10',7,'wind'],mend:['ฟื้นฟู','+16','ฟื้น HP ตัวเอง','แรง 10',16,'nature'],quake:['ท่าพิเศษ','10','ทุบพื้นโดนศัตรูรอบตัว','แรง 16',10,'earth'],aimed:['โจมตี','อาวุธ +8','เล็งจุดตาย ธาตุแสง','แรง +8',8,'light'],frost:['ท่าเฉพาะตัว','13','เวทน้ำแข็ง ยิงไกล 4 ช่อง','แช่แข็งน้ำตื้น · การ์ดของลูน่า',13,'ice'],wall:['ท่าเฉพาะตัว','14','ตั้งโล่ + เพื่อนข้างตัวกัน 8','การ์ดของบรัม',14,'earth'],whirl:['ท่าเฉพาะตัว','อาวุธ −4','ฟันศัตรูรอบตัวทุกตัว','การ์ดของเคียร์',14,'wind'],twin:['ท่าเฉพาะตัว','2×55%','ฟันสองครั้งติดกัน','การ์ดของมิล',10,'nature'],attack:['โจมตี','อาวุธ','ความเสียหายตามอาวุธที่ถือ','ใช้แรงตามอาวุธ',0,'earth'],skill:['ท่าพิเศษ','+12','ความเสียหายเพิ่มจากอาวุธ','ใช้แรงเพิ่ม 10',12,'fire'],guard:['ป้องกัน','8 / 16','ลดความเสียหาย (มีโล่ 16)','ถึงเทิร์นถัดไป',8,'light'],rest:['ฟื้นฟู','+30','ฟื้นแรง','',30,'wind'],spell:['เวท','14','ความเสียหายเวท ยิงไกล 4 ช่อง','ใช้แรง 12',14,'fusion'],push:['ท่าพิเศษ','½','ผลักถอย 1 ช่อง','ชนสิ่งกีดขวาง +6 · ผลักลงโคลน/น้ำได้',6,'earth'],pull:['ท่าพิเศษ','6','ดึงเข้ามา 1 ช่อง','ระยะ 3 · ใช้แรง 8',6,'wind'],line:['โจมตี','อาวุธ −2','ทะลวงตรง 2 ช่อง','โดนตัวที่อยู่ข้างหลังด้วย',14,'fire']};
  for(let [id,m] of Object.entries(T.COMBAT)){let i=INFO[id]||['โจมตี','','','',0,'earth'],k=mk('a-'+id,'action',{ref:id,name:m.name,element:i[5],type:i[0],range:id==='spell'||id==='frost'?4:id==='pull'||id==='gust'?3:['attack','skill','push','line','whirl','twin','flame','quake','aimed'].includes(id)?1:0,cost:{energy:id==='spell'?12:0,minutes:0},main:{value:i[1],label:i[2]},effects:[i[3]]},{power:i[4],target:['guard','rest','wall','mend'].includes(id)?'ตัวเอง':'ศัตรู',shape:id==='push'?'ผลัก':id==='pull'?'ดึง':id==='line'?'แนวตรง':'เดี่ยว'});k.art.src=asset('tactic-card-'+id);out.push(k)}}
 if(typeof COMBAT_FORMS!=='undefined')COMBAT_FORMS.forEach((f,i)=>{let b=D[i]||{},k=mk('a-'+(f.image||'').replace(/^.*\/|\.\w+$/g,''),'action',{ref:'form'+i,name:f.name,element:['fire','earth','water'][i]||'fire',type:'ท่าพิเศษ',tags:f.tags||'',range:1,cost:{energy:b.energy||0,minutes:0},condition:f.condition||'',main:{value:String(b.attack||b.base||0),label:'ความเสียหาย'},effects:[f.core||''],notes:'ร่างต่อสู้เดิมของการ์ดคราฟต์ (เก็บไว้เป็นการ์ดแอ็กชัน)'},{power:b.attack||b.base||0,target:'ศัตรู',shape:'เดี่ยว'});k.art.src=f.image||'';out.push(k)});
 if(AD){// consumables
  for(let [id,x] of Object.entries(AD.CONSUMABLES)){let k=mk('c-'+id,'consumable',{ref:id,name:x.name,element:x.element,rarity:x.rarity,type:x.kind,range:x.range||0,maxLevel:1,main:{value:x.hp?'+'+x.hp:x.stamina?'+'+x.stamina:x.damage?String(x.damage):x.guard?'+'+x.guard:'',label:x.hp?'HP':x.stamina?'แรง':x.damage?'ความเสียหาย':x.guard?'เกราะ':''},effects:[x.text]},{use:x.use,hp:x.hp||0,stamina:x.stamina||0,power:x.damage||0,price:x.price});k.art.src=asset('item-'+id);out.push(k)}
  // event cards
  for(let [id,x] of Object.entries(AD.EVENT_CARDS)){let k=mk('ev-'+id,'event',{ref:id,name:x.name,element:x.element,rarity:x.rarity,type:x.kind,maxLevel:1,cost:{energy:0,minutes:x.minutes||0},effects:[x.text],condition:'ใช้แล้วการ์ดจะหายไป'},{area:x.area});k.art.src=asset('event-'+id);out.push(k)}
  // goods
  for(let [id,x] of Object.entries(AD.GOODS)){let k=mk('g-'+id,'goods',{ref:id,name:x.name,element:x.element,rarity:x.rarity,type:x.use,maxLevel:1,effects:[x.text]},{price:x.price});k.art.src=asset('item-'+id);out.push(k)}}
 // characters
 let hero=mk('u-hero','unit',{ref:'hero',name:(typeof heroName==='function'?heroName():'นักผจญภัย'),element:'fire',type:'แนวหน้า',range:1,effects:['ตัวเอก · สลบแล้วช่วยฟื้นได้ภายใน 3 CT','ใช้อาวุธตามที่สวมใส่']},{weapon:'ตามที่สวมใส่',hp:60,atk:0,def:0,move:0,speed:8,traits:'',price:0});hero.art.src='assets/adventurer-sword-idle.webp';out.push(hero);
 const CEL={luna:'fusion',bram:'earth',kier:'wind',mil:'water'},CT={luna:'เวท',bram:'แนวหน้า',kier:'แนวหน้า',mil:'แนวหน้า'};
 for(let [id,r] of Object.entries(window.Companions?.ROSTER||{})){let w=C?.WEAPONS?.[r.weapon]||{},k=mk('u-'+id,'unit',{ref:id,name:r.name,element:CEL[id]||'wind',type:CT[id]||'แนวหน้า',range:w.range||1,tags:r.role,maxLevel:10,effects:['สู้เองอัตโนมัติ · เลเวลละ +6 HP / +2 โจมตี']},{weapon:w.name||r.weapon,hp:r.hp,atk:w.damage||0,def:r.shield?8:0,move:4,speed:C?.WEAPON_SPEED?.[r.weapon]||7,traits:'',price:r.cost});k.art.src=asset('ally-'+id);out.push(k)}
 // enemies
 const EEL={dummy:'earth',straw:'earth',archer:'wind',captain:'fire',wolf:'dark',bandit:'earth',poacher:'wind',shadowWolf:'dark',alpha:'dark',treant:'nature',bat:'dark',kobold:'earth',slime:'water',foreman:'earth',golem:'earth',crystalKing:'fusion'};
 const RN={normal:'ทั่วไป',elite:'พิเศษ',miniboss:'รองหัวหน้า',boss:'หัวหน้า'},RR={normal:'common',elite:'good',miniboss:'rare',boss:'legend'},TRN={fly:'บิน',light:'เท้าเบา',heavy:'หนัก',amphib:'สะเทินน้ำ'};
 const AREA_GOODS={forest:'เขี้ยวหมาป่า · สมุนไพร',mine:'ปีกค้างคาว · เศษผลึก'};
 const BOSS={treant:{title:'ผู้ปกครองป่าตะวันออก',skills:['{atk} ฟาดกิ่งยักษ์ ประชิด 16','ยิงเมล็ดหนาม ระยะ 3 · ความเสียหาย 9','ยืนบนหญ้าสูงได้ธาตุธรรมชาติ +25%'],drops:'ตราประทับหัวหน้า · เหรียญโบราณ'},bogHydra:{title:'ผู้ครองบึงหมอก',skills:['{atk} งับพิษ ประชิด 17','พ่นน้ำพิษ ระยะ 3 · ความเสียหาย 10','ยืนในน้ำ/โคลนเดินได้ปกติ (สะเทินน้ำ)'],drops:'ตราประทับหัวหน้า · สมุนไพรหนองน้ำ'},coralGolem:{title:'ผู้พิทักษ์แหลมปะการัง',skills:['{atk} ทุบปะการัง ประชิด 18','ซัดคลื่น ระยะ 3 · ความเสียหาย 10','ธาตุน้ำ +25% บนน้ำตื้น'],drops:'ตราประทับหัวหน้า · ไข่มุกทะเล'},frostQueen:{title:'ราชินีแห่งยอดเขา',skills:['{atk} ฟาดคทาน้ำแข็ง ประชิด 17','หอกน้ำแข็ง ระยะ 4 · ความเสียหาย 13','ทำให้น้ำตื้นกลายเป็นน้ำแข็ง'],drops:'ตราประทับหัวหน้า · แก่นน้ำแข็ง'},voidKing:{title:'เจ้าแห่งซากวิหาร',skills:['{atk} กรงเล็บความว่าง ประชิด 19','ลูกไฟมืด ระยะ 4 · ความเสียหาย 12','โกลาหล: ความเสียหายสุ่ม ±25%'],drops:'ตราประทับหัวหน้า · อัญมณีวิญญาณ'},crystalKing:{title:'เจ้าแห่งเหมืองร้าง',skills:['{atk} ทุบผลึก ประชิด 18','ยิงเศษผลึก ระยะ 3 · ความเสียหาย 11','พื้นผลึกเสริมธาตุผสาน +25%'],drops:'ตราประทับหัวหน้า · เศษผลึกแร่'}};
 for(let [id,e] of Object.entries(C?.ENEMY_TYPES||{})){let rank=e.rank||(e.captain?'miniboss':'normal'),k=mk('en-'+id,'enemy',{ref:id,name:e.name,element:EEL[id]||e.element||'earth',rarity:RR[rank],type:e.captain?'หัวหน้า':e.keepAway?'รักษาระยะ':e.ranged>e.melee?'ยิงไกล':'ประชิด',range:e.rangedReach||1,maxLevel:1,effects:[e.captain?'ล้มตัวนี้แล้วลูกน้องจะแตกหนี':e.keepAway?'ถอยรักษาระยะแล้วยิง':'เข้าประชิดเป้าหมายที่ใกล้ที่สุด']},{rank:RN[rank],area:AD?.AREAS?.[e.area]?.name||'ทุกที่',hp:e.hp,atk:e.melee,ranged:e.ranged,move:e.move,speed:e.speed||6,traits:(e.traits||[]).map(x=>TRN[x]).join(' · '),drops:BOSS[id]?.drops||AREA_GOODS[e.area]||(AD?.AREAS?.[e.area]?.goods||[]).map(g=>AD.GOODS[g]?.name).join(' · '),title:BOSS[id]?.title||''});if(BOSS[id]){k.effects=BOSS[id].skills;k.condition='ล้มตัวนี้ ลูกน้องทั้งหมดจะแตกหนี'}if(C?.BOSS_SKILLS?.[id])k.effects=[...(k.effects||[]),'✦ ท่าพิเศษ: '+Object.values(C.BOSS_SKILLS[id]).map(x=>x.name).join(' · ')];k.art.src=e.art?asset(e.art):'';if(!k.art.src&&!e.draw)k.art.src=e.image||'';out.push(k)}
 // equipment
 let W=C?.WEAPONS||{};
 for(let id of ['sword','hammer','knife','spear','rapier','staff','bow','axe','tome'])if(W[id]){let w=W[id],k=mk('e-'+id,'equip',{ref:id,name:w.name,element:C.WEAPON_ELEMENT?.[id]||'fire',type:'อาวุธ',range:w.range,cost:{energy:w.stamina,minutes:0},main:{value:String(w.damage),label:'ความเสียหาย'},effects:[C.WEAPON_TRAITS?.[id]||'ใช้กับไพ่ โจมตี / ท่าพิเศษ']},{atk:w.damage,def:0,price:(typeof RECIPES!=='undefined'&&RECIPES[id]?.sell)||30});k.art.src=window.weaponImg?weaponImg(id):['sword','hammer'].includes(id)?'assets/'+id+'.webp':'';out.push(k)}
 out.push(mk('e-shield','equip',{ref:'shield',name:'โล่ไม้หุ้มเหล็ก',element:'light',type:'โล่',effects:['ไพ่ตั้งรับกันได้ 16 แทน 8']},{atk:0,def:8,price:24}));
 // materials
 const MEL={iron:'earth',coal:'fire',wood:'nature',food:'water'},MT={iron:'โลหะ',coal:'เชื้อเพลิง',wood:'ไม้',food:'อาหาร'},MC={iron:'ดาบ ค้อน',coal:'ดาบ ค้อน (เชื้อเพลิง)',wood:'ด้ามค้อน',food:'พักกินอาหาร'};
 if(typeof MATERIALS!=='undefined')for(let [id,m] of Object.entries(MATERIALS)){let k=mk('mt-'+id,'material',{ref:id,name:m.name,element:MEL[id]||'earth',type:MT[id]||'อื่นๆ',maxLevel:1,effects:['ใช้ทำ: '+(MC[id]||'-')]},{craft:MC[id]||'',price:m.price});k.art.src='assets/item-'+id+'.webp';out.push(k)}
 return out.map(upgradeUnitCardArt)}
// ---------------- store ----------------
let store=null,undo=[],redo=[],last='',mode='view',selZone='art',selItem='name',selKind='zone',curId=null;
const grp=c=>templateKey(c||cur());
const tpl=c=>store.templates[grp(c)];
// Retire the old Life/Combat display field, including saved/imported layouts.
function retireUsageField(d){
 for(let T of Object.values(d.templates||{})){
  const zone=T.items?.context?.zone;
  if(zone&&zone!=='art'&&T.zones?.[zone]&&!Object.entries(T.items).some(([k,it])=>k!=='context'&&it.show!==false&&it.zone===zone)){
   if(DEFAULT_ZONES[zone])T.zones[zone].hide=true;
   else delete T.zones[zone];
  }
  if(T.items)delete T.items.context;
 }
 for(let c of Array.isArray(d.cards)?d.cards:Object.values(d.cards||{}))delete c.context;
}
function migrate(){
 retireUsageField(store);
 // v19: no dot separator in the play-card middle bar (user request) — once; the field can still be set again
 if(!store.sepFix19&&store.templates?.play?.zones?.middle){let z=store.templates.play.zones.middle;if(String(z.sep||'').trim()==='·')z.sep='';store.sepFix19=true}
 if(store.version===1){let old=store.template||{},T=DEFAULT_TEMPLATES();store.frame=old.frame||FRAME;if(old.zones)T.play.zones=old.zones;if(old.items)T.play.items=old.items;store.templates=T;delete store.template;
  // life cards are gone; old seed ids were renamed (t-/c-/i- → a-/c-/mt-), so drop the old seeds and keep hand-made cards
  for(let [id,c] of Object.entries(store.cards)){if(c.family==='village'||/^(t|c|i|v)-/.test(id)&&c.family!=='custom'){delete store.cards[id];continue}if(c.family==='custom'||c.family==='combat'||c.family==='tactic')c.family='action';if(c.family==='item')c.family='material';c.attr||={}}
  store.version=2}
 store.frame||=FRAME;store.templates||=DEFAULT_TEMPLATES();let D=DEFAULT_TEMPLATES();
 // v13: unit / enemy / boss move to the new framed layout once (old layout of those 3 is replaced)
 for(let g of ['unit','enemy','boss']){let T0=store.templates[g];if(T0&&!T0.framed)store.templates[g]=D[g];else if(T0&&T0.framed<19){for(let [k,z] of Object.entries(D[g].zones))T0.zones[k]=clone(z);T0.framed=19}} // v19: new frame shape → zones move once (items and custom zones are kept)
 for(let [g,def] of Object.entries(D)){let T=store.templates[g]||=def;T.zones||={};T.items||={};
  for(let [k,z] of Object.entries(def.framed?def.zones:DEFAULT_ZONES))T.zones[k]={...clone(z),...(T.zones[k]||{})};
  for(let z of Object.values(T.zones))if(z.dir===undefined&&z!==T.zones.art){z.dir='row';z.justify??='center';z.valign??='center';z.fs??=4}
  for(let [k,it] of Object.entries(def.items))T.items[k]={...clone(it),...(T.items[k]||{})};
  for(let it of Object.values(T.items))if(it.zone&&!T.zones[it.zone])it.zone=''}
 {let h=store.cards['u-hero'];if(h&&/ช่าง|นักตีดาบ/.test(h.name||'')){h.name=(typeof heroName==='function'?heroName():'นักผจญภัย');if(h.art?.src==='assets/hero.webp')h.art.src='assets/adventurer-sword-idle.webp';h.effects=['ตัวเอก · สลบแล้วช่วยฟื้นได้ภายใน 3 CT','ใช้อาวุธตามที่สวมใส่']}}
 for(let c of Object.values(store.cards)){upgradeUnitCardArt(c);c.attr||={};if(!FAMILIES[c.family])c.family='action'}
 store.symbols||={};for(let [k,s] of Object.entries(DEFAULT_SYMBOLS)){let o=store.symbols[k];if(!o)store.symbols[k]=clone(s);else if(!o.src&&!o.data&&!o.useBuiltin&&s.src)o.src=s.src}}
// v19: card-design.js (window.CARD_DESIGN) is the permanent design; this browser's edits (localStorage) sit on top of it
function fromDesign(D){let cards={},order=[];for(let c of D.cards||[]){cards[c.id]=clone(c);order.push(c.id)}
 let symbols=Object.fromEntries(Object.entries(D.symbols||{}).map(([k,s2])=>{let o=clone(s2);delete o.svg;return [k,o]}));
 return {version:2,frame:D.frame||FRAME,templates:clone(D.templates),rarities:clone(D.rarities||DEFAULT_RARITIES),symbols,cards,order,sepFix19:true,fromDesign:D.exportedAt}}
function load(){try{store=JSON.parse(localStorage.getItem(KEY))}catch(e){store=null}
 if(!store&&window.CARD_DESIGN?.templates)store=fromDesign(window.CARD_DESIGN);
 if(!store||![1,2].includes(store.version))store={version:2,frame:FRAME,templates:DEFAULT_TEMPLATES(),rarities:clone(DEFAULT_RARITIES),cards:{},order:[]};
 migrate();for(let c of gameCards()){
  const old=store.cards[c.id];
  if(!old){store.cards[c.id]=c;store.order.push(c.id)}
  // v16: adopt newly installed art only for untouched empty defaults.
  // Preserve uploaded art, custom image paths and all card/gameplay edits.
  else if(c.art?.src&&!old.art?.data&&!old.art?.src){
    old.art={...c.art,...old.art,src:c.art.src};
  }
 }
 store.order=store.order.filter(id=>store.cards[id]);if(!store.cards[curId])curId=store.current&&store.cards[store.current]?store.current:store.order[0];last=JSON.stringify(store)}
function persist(){store.current=curId;try{localStorage.setItem(KEY,JSON.stringify(store));status('บันทึกอัตโนมัติแล้ว')}catch(e){status('⚠ พื้นที่เบราว์เซอร์เต็ม — ส่งออก ZIP แล้วลบภาพที่อัปโหลดออกบางส่วน')}}
function syncShared(){let src=tpl();for(let [g,T] of Object.entries(store.templates)){if(T===src)continue;
 for(let [k,it] of Object.entries(src.items))if(it.shared){let z=it.zone;if(z&&!T.zones[z]&&src.zones[z])T.zones[z]=clone(src.zones[z]);T.items[k]=clone(it)}else if(T.items[k]?.shared&&!it.shared)T.items[k].shared=false;
 for(let [k,z] of Object.entries(src.zones))if(z.shared)T.zones[k]=clone(z);else if(T.zones[k]?.shared)T.zones[k].shared=false}}
function commit(){syncShared();let now=JSON.stringify(store);if(now===last)return;undo.push(last);if(undo.length>80)undo.shift();redo=[];last=now;persist();topBar()}
function restore(json){store=JSON.parse(json);last=json;migrate();if(!store.cards[curId])curId=store.order[0];persist();renderAll();if(root.dataset.modal)modal(root.dataset.modal)}
const cur=()=>store.cards[curId];
// ---------------- renderer (reusable) ----------------
function symHTML(key,d,tip){if(key.startsWith('@el:')){let el=key.slice(4);return ELEMENTS[el]?`<span class="g-sym" data-tip="ธาตุ${ELEMENTS[el]}"><img src="${elementFile(el)}" alt=""></span>`:''}
 let s=d.symbols?.[key];if(!s)return '';if(!s.data&&!s.src&&!BUILTIN[key]&&s.fallback&&s.fallback!==key&&d.symbols[s.fallback])return symHTML(s.fallback,d,tip||(s.name+(s.tip?' — '+s.tip:'')));let src=s.data||s.src,body=src?`<img src="${esc(src)}" alt="" draggable="false">`:BUILTIN[key]?`<svg viewBox="0 0 24 24" fill="none">${BUILTIN[key]}</svg>`:esc(s.name.slice(0,1));
 return `<span class="g-sym" data-tip="${esc(tip||(s.name+(s.tip?' — '+s.tip:'')))}">${body}</span>`}
// text → html with {key} tokens and auto-replaced words
function rich(t,d){t=String(t??'');let pairs=[];for(let [k,s] of Object.entries(d.symbols||{}))if(s.auto)for(let w of s.words||[])if(w)pairs.push([w,k]);pairs.sort((a,b)=>b[0].length-a[0].length);
 let re=new RegExp('\\{([\\w-]+)\\}'+(pairs.length?'|('+pairs.map(p=>p[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')':''),'g'),out='',i=0;
 for(let m of t.matchAll(re)){out+=esc(t.slice(i,m.index));i=m.index+m[0].length;if(m[1]){out+=d.symbols?.[m[1]]?symHTML(m[1],d):esc(m[0])}else{let k=pairs.find(p=>p[0]===m[2])[1],s=d.symbols[k];out+=symHTML(k,d)+(s.inline==='icon'?'':esc(m[2]))}}
 return out+esc(t.slice(i))}
function matchSym(v,d){v=String(v).trim();if(!v)return '';let S=Object.entries(d.symbols||{});for(let [k,s] of S)if(s.name===v||(s.words||[]).includes(v)||k===v)return k;for(let [k,s] of S)if(s.name&&s.name.includes(v)&&v.length>=3)return k;return ''}
function itemHTML(k,it,c,d,z){let def=itemDef(k,it);if(!def)return '';let inner='',tip='',r=d.rarities.find(x=>x.key===c.rarity)||d.rarities[0];
 if(k==='elementOrb'){if(!c.element)return '';inner=`<img class="g-orbimg${z.square?' full':''}" src="${elementFile(c.element)}" alt="${ELEMENTS[c.element]}" draggable="false">`;tip='ธาตุ'+ELEMENTS[c.element]}
 else if(k==='rarity'){inner=`<i class="g-dot"></i>${it.mode==='icon'?'':esc(r.name)}`;tip='ความหายาก: '+r.name}
 else if(k==='levelGems'){let lv=lvOf(c),max=Math.max(lv,c.maxLevel||1);inner=`<span class="g-gems">${'◆'.repeat(lv)}${'◇'.repeat(max-lv)}</span>`;tip=`เลเวล ${lv}/${max}`}
 else if(k==='statLine'){let A=c.attr||{},list=STAT_KEYS.filter(([s])=>num(A[s])>0).map(([s,sym,lb])=>[sym,lb,A[s]]);if(c.range&&['unit','enemy','equip'].includes(c.family))list.push(['range','ระยะ',c.range]);if(!list.length)return '';inner=list.map(([sym,lb,v])=>`<span class="g-stat">${it.mode==='text'?esc(lb)+' ':symHTML(sym,d,lb+' '+v)}${esc(v)}</span>`).join('');tip=''}
 else if(def.lines){let ls=(c.effects||[]).filter(x=>String(x).trim());if(!ls.length)return '';inner=ls.map(l=>`<span class="g-ln">${rich(l,d)}</span>`).join('')}
 else{let v=def.get(c);if(v===''||v==null||v===0)return '';v=String(v);
  if(it.mode!=='text'){let mk=it.symMap?.[v],keys=mk&&d.symbols?.[mk]?[mk]:it.sym?[it.sym]:def.sym?[def.sym]:k==='elementName'?['@el:'+c.element]:[];
   if(keys.length){let icons=keys.map(s=>symHTML(s,d,def.label+': '+v)).join('');inner=it.mode==='icon'?icons:icons+' '+esc(v)}
   else{let parts=def.split?v.split(/\s*·\s*/):[v];inner=parts.map(p=>{let s=matchSym(p,d);return s?symHTML(s,d,def.label+': '+p)+(it.mode==='icon'?'':' '+esc(p)):esc(p)}).join(' · ')}}
  else inner=(def.pre?def.pre+' ':'')+(def.rich?rich(v,d):esc(v))}
 let col=z.dir==='col',fs=z.fs||4,st='';
 if(it.size)st+=`font-size:${(it.size/fs).toFixed(3)}em;`;if(it.color)st+=`color:${it.color};`;if(it.bg)st+=`background:${it.bg};`;if(it.bold)st+='font-weight:800;';if(it.italic)st+='font-style:italic;';
 if(it.align)st+=col?`text-align:${it.align};align-self:${{left:'flex-start',center:'center',right:'flex-end'}[it.align]};`:{left:'margin-right:auto;',center:'margin-inline:auto;',right:'margin-left:auto;'}[it.align];
 if(it.push)st+=col?'margin-top:auto;':'margin-left:auto;';
 return `<span class="g-it g-it-${k}${it.bg?' g-pill':''}${it.mini?' on-mini':''}" data-item="${k}"${tip?` data-tip="${esc(tip)}"`:''} style="${st}">${inner}</span>`}
function cardHTML(c,d,opt={}){upgradeUnitCardArt(c);retireUsageField(d);let TP=d.templates?.[templateKey(c)]||d.templates?.[GROUP_OF[c.family]||'play']||d.template,Z=TP.zones,I=TP.items||DEFAULT_ITEMS,r=d.rarities.find(x=>x.key===c.rarity)||d.rarities[0],a=c.art||{},src=a.data||a.src||opt.fallbackArt,tk=templateKey(c),rf=frameFor(c,tk)&&TP.framed?frameFor(c,tk):'',frame=rf||d.frame||d.template?.frame||FRAME;
 const box=(k,p)=>`left:${p.x}%;top:${p.y}%;width:${p.w}%;height:${p.square?p.w*RATIO:p.h}%;`;
 const J={start:'flex-start',center:'center',end:'flex-end',between:'space-between'},TA={start:'left',center:'center',end:'right',between:'center'};
 let zones=Object.entries(Z).filter(([k])=>k!=='art').map(([k,z])=>{let items=Object.entries(I).filter(([,it])=>it.show!==false&&it.zone===k&&(!opt.mini||it.mini)).sort((a,b)=>a[1].order-b[1].order),groups=[];
  for(let [ik,it] of items){let h=itemHTML(ik,it,c,d,z);if(!h)continue;if(it.join&&groups.length)groups.at(-1).push(h);else groups.push([h])}
  let col=z.dir==='col',body=groups.map(g=>g.length>1?`<span class="g-line">${g.join(' ')}</span>`:g[0]).join(z.sep?`<span class="g-sep">${esc(z.sep)}</span>`:'');
  let st=box(k,z)+`font-size:${z.fs||4}cqw;flex-direction:${col?'column':'row'};justify-content:${col?J[z.valign||'start']:J[z.justify||'center']};align-items:${col?'stretch':J[z.valign||'center']};text-align:${col?TA[z.justify||'center']:'center'};gap:${z.gap??.8}cqw;${z.bg?`background:${z.bg};border-radius:2cqw;`:''}`;
  let sel=opt.zones&&opt.sel===k;
  return `<div class="g-zone ${col?'gz-col':'gz-row'}${sel?' sel':''}${body?'':' g-empty'}" data-zone="${k}" ${z.hide?'data-hide':''} style="${st}">${body}${sel?'<span class="g-handle" data-handle></span>':''}</div>`}).join('');
 let img=src?`<img src="${esc(src)}" alt="" draggable="false" style="object-fit:${a.fit||(['enemy','unit'].includes(c.family)?'contain':'cover')};transform:translate(-50%,-50%) translate(${num(a.x)}%,${num(a.y)}%) rotate(${num(a.rot)}deg) scale(${(a.scale||1)*(a.flipX?-1:1)},${a.scale||1})">`:`<div class="g-noart">${c.element?`<img src="${elementFile(c.element)}" alt="">`:'✦'}</div>`;
 let style=`--g-tint:${r.color};--g-tint-a:${rf?0:r.strength};--g-bg:${FAMILY_BG[c.family]||'#444'};--g-accent:${ELEMENT_COLOR[c.element]||'#a98'};--g-gem:${r.strength?r.color:'#7d2f14'}`;
 return `<div class="gcard${opt.mini?' mini':''}${opt.zones?' edit-zones':''}${opt.art?' edit-art':''}${opt.items?' edit-items':''}" style="${style}" data-card="${esc(c.id)}">
 <div class="g-artbox${opt.sel==='art'&&opt.zones?' sel':''}" data-zone="art" style="${box('art',Z.art)}">${img}${opt.sel==='art'&&opt.zones?'<span class="g-handle" data-handle></span>':''}</div>
 <img class="g-frame" src="${esc(frame)}" alt="" draggable="false"><div class="g-tint" style="-webkit-mask-image:url('${esc(frame)}');mask-image:url('${esc(frame)}')"></div>${zones}</div>`}
// shrink text that does not fit its zone
function fit(root){root.querySelectorAll('.g-zone').forEach(el=>{if(!el.offsetParent||el.dataset.zone==='orb')return;let f=parseFloat(getComputedStyle(el).fontSize),n=0;while((el.scrollHeight>el.clientHeight+1||el.scrollWidth>el.clientWidth+1)&&f>4&&n++<45){f*=.93;el.style.fontSize=f+'px'}})}
// one floating tooltip for every [data-tip] (symbols, rarity, orb…) — usable in the game too
let tipEl=null;function bindTips(){if(tipEl)return;tipEl=document.createElement('div');tipEl.id='gTip';tipEl.hidden=true;document.body.appendChild(tipEl);
 document.addEventListener('pointerover',e=>{let t=e.target.closest?.('.gcard [data-tip]');if(!t||t.closest('.edit-items')){tipEl.hidden=true;return}let r=t.getBoundingClientRect();tipEl.textContent=t.dataset.tip;tipEl.hidden=false;let w=tipEl.offsetWidth;tipEl.style.left=Math.max(6,Math.min(innerWidth-w-6,r.left+r.width/2-w/2))+'px';tipEl.style.top=Math.max(6,r.top-tipEl.offsetHeight-6)+'px'});
 document.addEventListener('pointerdown',()=>{if(tipEl)tipEl.hidden=true})}
// ---------------- page ----------------
let root,$q=s=>root.querySelector(s);
function build(){root=document.createElement('section');root.id='cardStudio';root.hidden=true;root.innerHTML=`
<div class="cs-top"><h2>✎ โต๊ะออกแบบการ์ด</h2><button data-act="prev" title="ใบก่อนหน้า">◀</button><select id="csPick" aria-label="เลือกการ์ด"></select><button data-act="next" title="ใบถัดไป">▶</button>
<button data-act="new">＋ ใบใหม่</button><button data-act="dup">⧉ ทำสำเนา</button><button data-act="del">ลบ</button><button data-act="reseed" title="ดึงค่าจากเกมใหม่เฉพาะใบนี้">↺ ค่าจากเกม</button><button data-act="artBatch" title="ส่งรายการภาพการ์ดของแท็บนี้ไปทำชุดคำขอใน Asset Studio">🧩 ขอภาพทั้งแท็บ</button><button data-act="applyGame" title="ใช้ชื่อและตัวเลขจากโต๊ะนี้ในเกมจริง (รีโหลดเกมเพื่อเห็นผล) · ปิด = กลับเป็นค่าเดิม">▶ ทดลองในเกม</button>
<span class="sp"></span><button data-act="undo" title="ย้อนกลับ (Ctrl+Z)">↶</button><button data-act="redo" title="ทำซ้ำ (Ctrl+Y)">↷</button><button data-act="legacy" title="แก้ตัวเลขกลไกที่ใช้ในเกมตอนนี้">ตัวเลขกลไกเดิม</button><button class="primary" data-modal="export">⇩ ส่งออก / นำเข้า</button><button data-act="close">✕ ปิด</button></div>
<nav class="cs-tabs" id="csTabs"></nav><div class="cs-body"><section class="cs-stage"><div class="cs-tools"><button data-mode="view">ดู</button><button data-mode="art">✋ จัดภาพ</button><button data-mode="layout">🧩 จัดช่อง & หัวข้อ</button><span class="hint" id="csHint"></span></div>
<div class="cs-view"><div class="cs-big" id="csBig"></div><div class="cs-side"><small>ขนาดบนมือ</small><div class="cs-mini" id="csMini"></div><small id="csSize"></small></div></div><div class="cs-status" id="csStatus"></div></section>
<section class="cs-form" id="csForm"></section></div>
<div class="cs-modal" id="csModal" hidden><div class="cs-dialog"><div class="cs-mhead"><h3 id="csMTitle"></h3><button data-act="mclose">✕ ปิด</button></div><div class="cs-mbody" id="csMBody"></div></div></div>
<input type="file" id="csUpload" accept="image/*" hidden><input type="file" id="csSymUpload" accept="image/*" hidden><input type="file" id="csImport" accept=".json,.js,application/json" hidden><datalist id="csArtList"></datalist>`;
 document.body.appendChild(root);
 root.addEventListener('click',onClick);root.addEventListener('input',onInput);root.addEventListener('change',onChange);
 $q('#csUpload').addEventListener('change',upload);$q('#csSymUpload').addEventListener('change',symUpload);$q('#csImport').addEventListener('change',importFile);
 bindDrag();bindTips();new ResizeObserver(()=>{if(!root.hidden){fitAll();placeModal()}}).observe($q('#csBig'))}
function status(t){if(root)$q('#csStatus').textContent=t}
const HINT={view:'คลิกตรงไหนก็ได้บนการ์ดเพื่อจัดช่อง/หัวข้อนั้น · ชี้สัญลักษณ์เพื่อดูคำอธิบาย',layout:'คลิกหัวข้อ = เลือกหัวข้อ · คลิกซ้ำ = เลือกช่องที่หัวข้ออยู่ · ลากหัวข้อไปช่องอื่น · ลากช่องเพื่อย้าย มุมขวาล่างปรับขนาด · ลูกศร = ขยับช่องละเอียด',art:'ลากภาพเพื่อเลื่อน · ล้อเมาส์ = ซูม · Shift+ล้อ = หมุน',zones:'คลิกช่องเพื่อเลือก · ลากย้าย · ลากมุมขวาล่างปรับขนาด · ลูกศร = ขยับละเอียด · ใช้กับทุกการ์ด',items:'ลากหัวข้อไปวางในช่องอื่นหรือสลับลำดับ · คลิกหัวข้อเพื่อตั้งค่า (ขนาด สี จัดชิด สัญลักษณ์)'};
function topBar(){let f=cur().family,ids=store.order.filter(id=>store.cards[id].family===f);
 $q('#csPick').innerHTML=ids.map(id=>`<option value="${esc(id)}" ${id===curId?'selected':''}>${esc(store.cards[id].name)}</option>`).join('');
 $q('#csTabs').innerHTML=Object.entries(GROUPS).map(([g,G])=>`<span class="cs-tabgroup g-${g}"><small>${G.name}</small>${G.families.map(k=>`<button data-tab="${k}" class="${k===f?'on':''}">${FAMILY_ICON[k]} ${FAMILIES[k]} <i>${store.order.filter(id=>store.cards[id].family===k).length}</i></button>`).join('')}</span>`).join('');
 {let ab=$q('[data-act=applyGame]');ab.classList.toggle('on',!!store.applyToGame);ab.textContent=store.applyToGame?'▶ ทดลองในเกม: เปิด':'▶ ทดลองในเกม: ปิด'}$q('[data-act=undo]').disabled=!undo.length;$q('[data-act=redo]').disabled=!redo.length;$q('[data-act=reseed]').disabled=!gameCards().some(c=>c.id===curId);
 root.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('on',b.dataset.mode===mode));$q('#csHint').textContent=HINT[mode]}
function preview(){let c=cur(),T=tpl();if(!T.zones[selZone])selZone='art';if(!T.items[selItem])selItem='name';let L=mode==='layout';
 $q('#csBig').innerHTML=cardHTML(c,store,{zones:L,art:mode==='art',items:L,sel:L&&selKind==='zone'?selZone:null});$q('#csMini').innerHTML=cardHTML(c,store,{mini:true});
 if(L&&selKind==='item')$q(`#csBig [data-item="${selItem}"]`)?.classList.add('sel');fitAll();
 let z=T.zones[selZone],it=T.items[selItem];
 status(L&&selKind==='zone'?`ช่อง: ${z.label} · X ${num(z.x).toFixed(1)} Y ${num(z.y).toFixed(1)} กว้าง ${num(z.w).toFixed(1)} สูง ${num(z.square?z.w*RATIO:z.h).toFixed(1)} (% ของการ์ด)`:L?`หัวข้อ: ${itLabel(selItem)} → ${it.show!==false&&it.zone&&T.zones[it.zone]?T.zones[it.zone].label:'ไม่แสดง'} · ลำดับ ${it.order}`:`${FAMILIES[c.family]} · id: ${c.id} · ภาพ: ${c.art.data?'อัปโหลด → '+c.art.src:c.art.src||'ยังไม่มี (แสดงลูกแก้วแทน)'}`)}
function fitAll(){fit($q('#csBig'));fit($q('#csMini'));let r=$q('#csBig .gcard')?.getBoundingClientRect();if(r)$q('#csSize').textContent=`ตัวอย่างใหญ่ ${Math.round(r.width)}×${Math.round(r.height)} px`}
const f=(path,label,type='text',cls='',extra='')=>{let v=path.split('.').reduce((o,k)=>o?.[k],cur());return `<label class="${cls}">${label}<input data-f="${path}" type="${type}" value="${esc(v)}" ${extra}></label>`};
const sel=(path,label,opts,cls='')=>{let v=path.split('.').reduce((o,k)=>o?.[k],cur());return `<label class="${cls}">${label}<select data-f="${path}">${opts.map(([k,n])=>`<option value="${esc(k)}" ${String(k)===String(v)?'selected':''}>${esc(n)}</option>`).join('')}</select></label>`};
function typedField([path,label,kind]){let v=path.split('.').reduce((o,k)=>o?.[k],cur());if(Array.isArray(kind)){let list=kind.includes(v)||v===''||v==null?kind:[v,...kind];return `<label>${label}<select data-f="${path}">${list.map(o=>`<option ${String(o)===String(v)?'selected':''}>${esc(o)}</option>`).join('')}</select></label>`}return f(path,label,kind==='num'?'number':'text','',kind==='num'?'min=0':'')}
function form(){let c=cur(),lv=Array.from({length:Math.max(1,c.maxLevel)},(_,i)=>[i+1,'Lv.'+(i+1)]),F=FIELDS[c.family]||[],g=templateKey(c);
 $q('#csArtList').innerHTML=(window.ASSET_MANIFEST?.assets||[]).filter(a=>a.file&&['final','temp'].includes(a.status)&&!/^(frame-|tactics-hero|char-)/.test(a.id)).map(a=>`<option value="${esc(a.file)}">`).join('');
 $q('#csForm').innerHTML=`<div class="cs-group"><h3>${FAMILY_ICON[c.family]} การ์ด${FAMILIES[c.family]} <small>${esc(c.id)} · โครง: ${TEMPLATES[g].name}</small></h3><div class="cs-row">
 ${f('name','ชื่อการ์ด','text','w3','maxlength="40"')}${sel('level','เลเวล',lv)}
 ${sel('family','ย้ายประเภท',Object.entries(FAMILIES))}${sel('rarity','ความหายาก',store.rarities.map(r=>[r.key,r.name]))}${sel('maxLevel','เลเวลสูงสุด',[1,2,3,4,5,6,7,8,9,10].map(n=>[n,n]))}${f('tags','แท็ก (คั่น ·)','text')}</div>
 <label style="margin-top:5px">ธาตุ</label><div class="cs-elements"><button class="none ${c.element?'':'on'}" data-el="" title="ไม่มีธาตุ">—</button>${Object.entries(ELEMENTS).map(([k,n])=>`<button class="${c.element===k?'on':''}" data-el="${k}" title="${n}"><img src="${elementFile(k)}" alt="${n}"></button>`).join('')}</div></div>
 <div class="cs-group"><h3>ค่าเฉพาะ: ${FAMILIES[c.family]} <small>ใส่ {atk} {def} ฯลฯ ในข้อความเพื่อแทรกสัญลักษณ์</small></h3><div class="cs-row">
 ${F.map(typedField).join('')}
 ${['unit','enemy','boss'].includes(g)?'':`${f('main.value','ค่าหลัก','text','nr')}${f('main.label','คำอธิบายค่าหลัก','text','w3')}`}${f('effects.0',g==='boss'?'ท่าพิเศษ บรรทัด 1 (บรรทัดอื่นใน "ข้อความ")':['unit','enemy'].includes(g)?'ความสามารถ / พฤติกรรม':'ผลบรรทัด 1 (บรรทัดอื่นอยู่ใน "ข้อความ")','text','w4')}</div></div>
 <div class="cs-group"><h3>ภาพการ์ด <span class="cs-h3btns"><button data-act="flip" class="${c.art.flipX?'on':''}" title="กลับซ้าย–ขวา">⇋</button><select data-f="art.fit" title="การพอดีภาพ"><option value="cover" ${c.art.fit!=='contain'?'selected':''}>เต็มช่อง</option><option value="contain" ${c.art.fit==='contain'?'selected':''}>เห็นทั้งภาพ</option></select><button data-act="artReset" title="คืนตำแหน่งภาพ">↺</button>${c.art.data?'<button data-act="dropData" title="ลบภาพอัปโหลด">ลบภาพ</button>':''}</span></h3><div class="cs-row">
 <label class="w3">ไฟล์ภาพ (พิมพ์ path หรือเลือก)<input data-f="art.src" list="csArtList" value="${esc(c.art.src)}"></label><label>&nbsp;<button data-act="upload">⇧ อัปโหลด</button></label>
 ${f('art.x','เลื่อน X %','number','',"step=1")}${f('art.y','เลื่อน Y %','number','',"step=1")}${f('art.scale','ซูม','number','',"step=0.05 min=0.1")}${f('art.rot','หมุน °','number','',"step=1")}</div></div>
 <div class="cs-modal-btns">
 <button data-modal="text" title="ผลหลายบรรทัด · เงื่อนไข · โน้ต">✎ ข้อความ</button>
 <button data-modal="stats" title="ตัวเลขที่จะใช้เขียนโค้ด">⚙ ค่ากลไก</button>
 <button data-modal="layout" title="ช่องบนการ์ด + หัวข้อในแต่ละช่อง (เพิ่ม ลบ ย้าย จัดหน้าตา)">🧩 ช่อง & หัวข้อ</button>
 <button data-modal="symbols" title="ภาพสัญลักษณ์แทนคำ + คำอธิบาย">✦ สัญลักษณ์</button>
 <button data-modal="rarity" title="ย้อมกรอบเงินตามความหายาก">◆ สีกรอบ</button></div>`}
function renderAll(){topBar();form();preview()}
// ---------------- modals (docked right so the card stays visible) ----------------
const opts=(list,v)=>list.map(([k,n])=>`<option value="${esc(k)}" ${String(k)===String(v)?'selected':''}>${esc(n)}</option>`).join('');
const colorCell=(attr,v,clr)=>`<span class="cs-color"><input type="color" ${attr} value="${/^#[0-9a-f]{6}$/i.test(String(v).slice(0,7))?String(v).slice(0,7):'#000000'}" class="${v?'':'unset'}"><button data-act="clr" data-clr="${clr}" title="ไม่กำหนด">✕</button></span>`;
function symPrompt(k,s){return `Game UI icon for a fantasy card game: "${s.name}" (${s.tip||s.name}). Single bold readable symbol, centered, ornate silver-and-gold rim style matching an engraved silver card frame, rich colors, soft shading, no text, no letters, transparent background, square 256x256.`}
function placeModal(){if(!root||$q('#csModal').hidden)return;let c=$q('#csBig .gcard')?.getBoundingClientRect(),R=root.getBoundingClientRect();if(c)$q('.cs-dialog').style.width=Math.max(420,Math.min(1060,R.right-c.right-24))+'px'}
let modalBusy=false;
function modal(kind){if(modalBusy)return;{let ae=document.activeElement;if(ae&&root.querySelector('#csMBody')?.contains(ae)){modalBusy=true;try{ae.blur()}finally{modalBusy=false}}}if(kind==='items'||kind==='zones')kind='layout';let c=cur(),b=$q('#csMBody'),T=tpl(),t={text:'ข้อความบนการ์ด',stats:'ค่ากลไกของการ์ด',items:'หัวข้อบนการ์ด — '+TEMPLATES[grp()].name+' ('+TEMPLATES[grp()].families.map(x=>FAMILIES[x]).join(' · ')+')',symbols:'สัญลักษณ์แทนคำ',zones:'ช่องบนกรอบ — '+TEMPLATES[grp()].name+' ('+TEMPLATES[grp()].families.map(x=>FAMILIES[x]).join(' · ')+')',layout:'🧩 ช่อง & หัวข้อ — '+TEMPLATES[grp()].name+' ('+TEMPLATES[grp()].families.map(x=>FAMILIES[x]).join(' · ')+')',rarity:'สีกรอบตามความหายาก',export:'ส่งออก / นำเข้าข้อมูลการ์ด'}[kind];$q('#csMTitle').textContent=t;root.dataset.modal=kind;
 if(kind==='text')b.innerHTML=`<div class="cs-row">${f('main.value','ค่าหลัก (ตัวใหญ่)','text')}${f('main.label','คำอธิบายค่าหลัก','text','w3')}</div>
 <label>ผลของการ์ด — 1 บรรทัด = 1 ผล (แนะนำไม่เกิน 3) · พิมพ์ {atk} {def} {heat} … เพื่อแทรกสัญลักษณ์<textarea data-f="effects" data-lines rows="4">${esc((c.effects||[]).join('\n'))}</textarea></label>
 <label>เงื่อนไข (ตัวเล็ก ท้ายกล่อง)<input data-f="condition" value="${esc(c.condition)}"></label>
 <label>โน้ตออกแบบ (ไม่แสดงบนการ์ด · ส่งออกไปด้วย)<textarea data-f="notes" rows="4">${esc(c.notes)}</textarea></label>
 <div class="cs-row">${sel('maxLevel','เลเวลสูงสุด',[1,2,3,4,5,6,7,8,9,10].map(n=>[n,n]))}</div>
 <p class="small">สัญลักษณ์ที่ใช้ได้: ${Object.entries(store.symbols).map(([k,s])=>`${symHTML(k,store)}<code>{${k}}</code> ${esc(s.name)}`).join(' · ')}</p>`;
 if(kind==='stats')b.innerHTML=`<p class="small">ตัวเลขเหล่านี้เป็นข้อมูลออกแบบ จะถูกส่งออกพร้อมการ์ดเพื่อนำไปเขียนโค้ด — ไม่เปลี่ยนเกมทันที (ถ้าจะลองค่าในเกมตอนนี้ใช้ "ตัวเลขกลไกเดิม")</p>
 <table><tr><th>ชื่อค่า</th><th>ค่า</th><th></th></tr>${Object.entries(c.stats||{}).map(([k,v])=>`<tr><td>${esc(k)}</td><td><input data-stat="${esc(k)}" type="number" value="${esc(v)}" style="width:110px"></td><td><button data-act="statDel" data-k="${esc(k)}">ลบ</button></td></tr>`).join('')}</table>
 <div class="cs-row"><label class="w2">ชื่อค่าใหม่ (อังกฤษ)<input id="csStatKey" placeholder="เช่น damage"></label><label>ค่า<input id="csStatVal" type="number" value="0"></label><label>&nbsp;<button data-act="statAdd">＋ เพิ่ม</button></label></div>`;
 $q('.cs-dialog').classList.toggle('lo-big',kind==='layout');b.classList.toggle('lo-mode',kind==='layout');
 if(kind==='layout')b.innerHTML=layoutHTML();
 if(kind==='symbols'){let S=store.symbols;b.innerHTML=`<p class="small">ใช้แทนคำบนการ์ด + ชี้แล้วมีคำอธิบาย · ในข้อความพิมพ์ <code>{key}</code> เพื่อแทรก · ติ๊ก "แทนอัตโนมัติ" = คำในช่อง "คำที่แทน" ถูกเปลี่ยนเป็นสัญลักษณ์เอง · ภาพจาก AI: กด ⧉ prompt → เจนภาพพื้นโปร่ง → ⇧ อัปโหลด (ไม่มีภาพ = ใช้ไอคอนที่วาดด้วยโค้ด)</p>
  <table class="cs-syms"><tr><th></th><th>key</th><th>ชื่อ</th><th>คำอธิบาย (tip)</th><th>คำที่แทน (คั่นด้วย ,)</th><th>แทนอัตโนมัติ</th><th>แทนเป็น</th><th>ภาพ</th><th></th></tr>
  ${Object.entries(S).map(([k,s])=>{let p=a=>`data-sym-f="${k}.${a}"`;return `<tr><td class="cs-symprev">${symHTML(k,store)}</td><td><code>{${esc(k)}}</code></td><td><input ${p('name')} value="${esc(s.name)}"></td><td><input ${p('tip')} value="${esc(s.tip)}"></td><td><input ${p('words')} value="${esc((s.words||[]).join(', '))}"></td>
  <td><input type="checkbox" ${p('auto')} ${s.auto?'checked':''}></td><td><select ${p('inline')}>${opts([['icon+text','ภาพ+คำ'],['icon','ภาพแทนคำ']],s.inline)}</select></td>
  <td class="nowrap"><input ${p('src')} value="${esc(s.data?'(อัปโหลด) '+(s.src||''):s.src)}" placeholder="${BUILTIN[k]?'ไอคอนในตัว':'path ภาพ'}" ${s.data?'readonly':''} style="width:120px"><button data-act="iconPick" data-k="${k}" title="เลือกจากชุดไอคอน">🖼</button><button data-act="symUp" data-k="${k}" title="อัปโหลดภาพ">⇧</button>${s.data||s.src?`<button data-act="symClear" data-k="${k}" title="กลับไปใช้ไอคอนในตัว">↺</button>`:''}</td>
  <td class="nowrap"><button data-act="symPrompt" data-k="${k}" title="คัดลอก prompt สำหรับเจนภาพด้วย AI">⧉ prompt</button>${BUILTIN[k]?'':`<button data-act="symDel" data-k="${k}">ลบ</button>`}</td></tr>`}).join('')}</table>
  <div class="cs-row"><label>key ใหม่ (อังกฤษ)<input id="csSymKey" placeholder="เช่น poison"></label><label class="w2">ชื่อ<input id="csSymName" placeholder="เช่น พิษ"></label><label>&nbsp;<button data-act="symAdd">＋ เพิ่มสัญลักษณ์</button></label></div>`}
 if(kind==='rarity')b.innerHTML=store.rarities.map((r,i)=>`<div class="cs-swatch"><input data-rar="${i}.name" value="${esc(r.name)}"><label>ความเข้มการย้อม<input type="range" min="0" max="1" step="0.05" data-rar="${i}.strength" value="${r.strength}"></label><input type="color" data-rar="${i}.color" value="${r.color}"><span class="small">key: ${r.key}${i===0?' · 0 = เงินตามภาพต้นฉบับ':''}</span></div>`).join('')+`<p class="small">ลองเปลี่ยนความหายากของการ์ดที่เปิดอยู่เพื่อดูผลในตัวอย่าง</p><div><button data-act="rarReset">↺ คืนค่าเริ่มต้น</button></div>`;
 if(kind==='export'){let uploads=store.order.filter(id=>store.cards[id].art?.data).length,su=Object.values(store.symbols).filter(s=>s.data).length;b.innerHTML=`<p>ส่งออกการ์ด <b>${store.order.length}</b> ใบ + ช่อง + หัวข้อ + สัญลักษณ์ ${Object.keys(store.symbols).length} แบบ + สีความหายาก${uploads?` + ภาพการ์ด ${uploads} ภาพ`:''}${su?` + ภาพสัญลักษณ์ ${su} ภาพ`:''}</p>
 <div class="cs-expall"><div style="display:flex;gap:6px;flex-wrap:wrap"><button data-act="resetDesign" title="ทิ้งการแก้ในเบราว์เซอร์นี้ แล้วกลับไปใช้ card-design.js ของเกม">↺ กลับเป็นค่าถาวร (card-design.js)</button></div><button class="primary" data-act="expAll">⇩ ส่งออกการตั้งค่าทั้งหมด (ZIP)</button><span class="small">การ์ดทั้งหมด + ภาพ + ตัวเลขกลไกเดิม + จุดมือถืออาวุธ + ไอคอนเมนู + แผนที่/เส้นทางหมู่บ้าน + layout หน้าจอ — ไฟล์เดียว ส่งให้ Claude ทำเป็นค่าถาวร (ไม่รวมเซฟความคืบหน้าการเล่น)</span></div>
 <div style="display:flex;gap:6px;flex-wrap:wrap"><button data-act="expZip">⇩ ZIP เฉพาะการ์ด (json + js + ภาพ)</button><button data-act="expJson">⇩ card-design.json</button><button data-act="expJs">⇩ card-design.js</button><button data-act="copy">⧉ คัดลอก JSON</button><button data-act="import">⇧ นำเข้า JSON / JS</button></div>
 <p class="small">ZIP แตกไฟล์ที่โฟลเดอร์เกมได้เลย: <code>card-design.js</code> (window.CARD_DESIGN) + <code>assets/cards/art/*.webp</code> + <code>assets/cards/symbols/*.webp</code> — จากนั้นส่งไฟล์ให้ผมเขียนโค้ดใส่เกมแบบถาวร</p>
 <label>ตัวอย่างข้อมูลการ์ดที่เปิดอยู่</label><pre>${esc(JSON.stringify(exportCard(cur()),null,1))}</pre>`}
 root.classList.add('modal-open');$q('#csModal').hidden=false;if(kind==='layout')bindLayout();requestAnimationFrame(()=>{fitAll();placeModal()})}
function closeModal(){$q('#csModal').hidden=true;root.classList.remove('modal-open');delete root.dataset.modal;commit();form();requestAnimationFrame(fitAll)}
const refreshModal=()=>{if(root.dataset.modal){let b=$q('#csMBody'),sc=b.scrollTop,t=b.querySelector('.lo-tree')?.scrollTop,ins=b.querySelector('.lo-insp')?.scrollTop;modal(root.dataset.modal);b.scrollTop=sc;let T2=b.querySelector('.lo-tree'),I2=b.querySelector('.lo-insp');if(T2&&t!=null)T2.scrollTop=t;if(I2&&ins!=null)I2.scrollTop=ins}};
// ---------------- v19 layout panel: zones first, items inside zones, one inspector ----------------
const J_OPTS=[['start','ชิดซ้าย/บน'],['center','กลาง'],['end','ชิดขวา/ล่าง'],['between','กระจาย']],V_OPTS=[['start','บน'],['center','กลาง'],['end','ล่าง']];
const NO_SYM=['elementOrb','rarity','levelGems','effects','mainLabel','condition'];
const isDefaultZone=k=>!!(DEFAULT_ZONES[k]||DEFAULT_TEMPLATES()[grp()]?.zones?.[k]);
function zoneOrder(T){return Object.entries(T.zones).sort((a,b)=>(a[0]==='art'?-1:b[0]==='art'?1:0)||num(a[1].y)-num(b[1].y)||num(a[1].x)-num(b[1].x))}
function binItems(T){return Object.entries(T.items).filter(([k,it])=>it.show===false||!it.zone||!T.zones[it.zone])}
function previewValue(k,it){let d=itemDef(k,it);try{let v=d?.get?d.get(cur()):'';return v==null?'':String(v)}catch(e){return ''}}
const loRow=(label,ctrl,cls='')=>`<label class="${cls}">${label}${ctrl}</label>`;
function itemRow(k,it){let on=selKind==='item'&&selItem===k,d=itemDef(k,it);return `<li draggable="true" data-li="${k}" class="${on?'on':''}"><span class="lo-grip" title="ลากเพื่อย้าย">⋮⋮</span><button data-act="pickItem" data-k="${k}">${d?.custom?'✚ ':''}${esc(itLabel(k,it))}</button>${it.join?'<small title="ต่อบรรทัดเดียวกับหัวข้อก่อนหน้า">↩</small>':''}${it.shared?'<small title="ใช้ร่วมทุกประเภท">🔗</small>':''}</li>`}
function addOptions(T,zk){let hid=binItems(T),other=Object.entries(T.items).filter(([k,it])=>it.show!==false&&it.zone&&it.zone!==zk&&T.zones[it.zone]);
 return (hid.length?`<optgroup label="หัวข้อที่ซ่อนอยู่">${hid.map(([k,it])=>`<option value="item:${k}">${esc(itLabel(k,it))}</option>`).join('')}</optgroup>`:'')+
 (other.length?`<optgroup label="ย้ายมาจากช่องอื่น">${other.map(([k,it])=>`<option value="item:${k}">${esc(itLabel(k,it))} (จาก ${esc(T.zones[it.zone].label)})</option>`).join('')}</optgroup>`:'')+
 `<optgroup label="สร้างหัวข้อใหม่"><option value="new:text">✚ ข้อความตายตัว (เช่น "ATK")</option><option value="new:field">✚ ค่าจากข้อมูลการ์ด (เช่น HP พลัง)</option></optgroup>`}
function layoutHTML(){let T=tpl(),bin=binItems(T);
 const zoneBlock=([k,z])=>{let its=k==='art'?[]:zoneItems(k),on=selKind==='zone'&&selZone===k;
  return `<div class="lo-zone${on?' on':''}${z.hide?' off':''}" data-lz="${k}"><div class="lo-zh"><button data-act="pickZone" data-k="${k}" class="lo-name">${k==='art'?'🖼':'▦'} ${esc(z.label)}${z.hide?' <small>(ซ่อน)</small>':''}</button>${z.shared?'<small title="ใช้ร่วมทุกประเภท">🔗</small>':''}${k==='art'?'':`<button data-act="zoneHideT" data-k="${k}" title="${z.hide?'แสดงช่องนี้':'ซ่อนช่องนี้ (หัวข้อข้างในซ่อนตาม)'}">${z.hide?'🙈':'👁'}</button>`}</div>
  ${k==='art'?'<p class="small lo-note">ภาพหลักของการ์ด — จัดภาพด้วยโหมด ✋</p>':`<ul class="lo-items">${its.map(([ik,it])=>itemRow(ik,it)).join('')||'<li class="lo-empty">ยังไม่มีหัวข้อ — ลากมาวาง หรือเลือกด้านล่าง</li>'}</ul>
  <select class="lo-add" data-addto="${k}"><option value="">＋ เพิ่มหัวข้อในช่องนี้…</option>${addOptions(T,k)}</select>`}</div>`};
 return `<div class="lo-wrap"><div class="lo-tree"><h4>โครงการ์ด <small>ช่อง → หัวข้อ · ลาก ⋮⋮ เพื่อย้าย</small></h4>${zoneOrder(T).map(zoneBlock).join('')}
 <button data-act="zoneAdd" class="lo-addzone">＋ ช่องใหม่</button>
 <div class="lo-zone lo-bin" data-lz=""><div class="lo-zh"><b>🗃 หัวข้อที่ไม่แสดง (${bin.length})</b></div><ul class="lo-items">${bin.map(([ik,it])=>itemRow(ik,it)).join('')||'<li class="lo-empty">ว่าง — ลากหัวข้อมาวางที่นี่เพื่อซ่อน</li>'}</ul></div>
 <details class="lo-tools"><summary>⚙ เครื่องมือทั้งโครง</summary><div class="lo-btns"><button class="primary" data-act="applyShared">⇉ ใช้ค่าที่ติ๊ก 🔗 กับทุกประเภท</button><button data-act="copyAll" data-k="zones">คัดลอกช่องทั้งหมดไปทุกประเภท</button><button data-act="copyAll" data-k="items">คัดลอกหัวข้อทั้งหมดไปทุกประเภท</button><button data-act="zonesReset">↺ คืนค่าช่องเริ่มต้น</button><button data-act="itemsReset">↺ คืนค่าหัวข้อเริ่มต้น</button></div>
 <label class="lo-frame">ไฟล์กรอบ (การ์ดใช้งาน/ของ)<input data-tpl="frame" value="${esc(store.frame)}"></label></details></div>
 <div class="lo-insp">${selKind==='item'&&T.items[selItem]?itemInspector(T):zoneInspector(T)}</div></div>`}
function zoneInspector(T){let k=selZone,z=T.zones[k];if(!z)return '<p class="small">คลิกช่องหรือหัวข้อบนการ์ด หรือในรายการทางซ้าย</p>';
 let q=a=>`data-zone-f="${k}.${a}"`,n=(a,l,st='0.1')=>loRow(l,`<input type="number" step="${st}" ${q(a)} value="${z[a]??''}">`);
 return `<h4>▦ ช่อง: ${esc(z.label)} <small>${zoneItems(k).length} หัวข้อ</small></h4><div class="lo-form">
 ${loRow('ชื่อช่อง',`<input ${q('label')} value="${esc(z.label)}">`,'w2')}
 <div class="lo-sub">ตำแหน่ง & ขนาด <small>% ของการ์ด · ลากบนการ์ดได้ · ลูกศร = ขยับละเอียด</small></div>${n('x','X')}${n('y','Y')}${n('w','กว้าง')}${z.square?loRow('สูง','<input disabled value="อัตโนมัติ (สี่เหลี่ยม)">'):n('h','สูง')}
 ${k==='art'?'<p class="small w2">ช่องภาพหลัก — ลาก/ซูมภาพในโหมด ✋ จัดภาพ</p>':`<div class="lo-sub">การเรียงหัวข้อในช่อง</div>
 ${n('fs','ขนาดตัวอักษร')}${loRow('เรียง',`<select ${q('dir')}>${opts([['row','แนวนอน (ต่อกัน)'],['col','แนวตั้ง (ละบรรทัด)']],z.dir)}</select>`)}
 ${loRow('จัดแนวนอน',`<select ${q('justify')}>${opts(J_OPTS,z.justify)}</select>`)}${loRow('จัดแนวตั้ง',`<select ${q('valign')}>${opts(V_OPTS,z.valign)}</select>`)}
 ${loRow('ตัวคั่นระหว่างหัวข้อ',`<input ${q('sep')} value="${esc(z.sep||'')}" placeholder="ว่าง = ไม่มีตัวคั่น (ใส่ · ได้)">`)}${n('gap','ระยะห่าง')}
 ${loRow('สีพื้นช่อง',colorCell(q('bg'),z.bg,'zone:'+k))}${loRow('ซ่อนช่องนี้',`<input type="checkbox" data-zone-hide="${k}" ${z.hide?'checked':''}>`,'chk')}`}
 ${loRow('🔗 ใช้ร่วมทุกประเภทการ์ด',`<input type="checkbox" ${q('shared')} ${z.shared?'checked':''}>`,'chk w2')}</div>
 ${k==='art'?'':`<div class="lo-sub2">หัวข้อในช่องนี้</div><ul class="lo-items lo-inlist">${zoneItems(k).map(([ik,it])=>itemRow(ik,it)).join('')||'<li class="lo-empty">ยังไม่มี</li>'}</ul>
 <div class="lo-btns"><button data-act="loNew" data-k="${k}" data-kind="text">✚ ข้อความใหม่</button><button data-act="loNew" data-k="${k}" data-kind="field">✚ ค่าจากการ์ดใหม่</button>${isDefaultZone(k)?'':`<button class="danger" data-act="zoneDel" data-k="${k}">🗑 ลบช่อง</button>`}</div>`}`}
function itemInspector(T){let k=selItem,it=T.items[k],def=itemDef(k,it),p=a=>`data-item-f="${k}.${a}"`,cx=it.custom;
 let zl=[['','— ไม่แสดง (เก็บในกล่อง 🗃)'],...zoneOrder(T).filter(([z])=>z!=='art').map(([z,v])=>[z,v.label+(v.hide?' (ซ่อน)':'')])],sl=[['','อัตโนมัติ'],...Object.entries(store.symbols).map(([s,v])=>[s,v.name])];
 let pv=previewValue(k,it),where=it.show!==false&&it.zone&&T.zones[it.zone]?T.zones[it.zone].label:'ไม่แสดง';
 return `<h4>☰ หัวข้อ: ${esc(def?.label||k)} <small>→ ${esc(where)}</small></h4>
 ${cx?`<div class="lo-form lo-custom"><div class="lo-sub">หัวข้อที่สร้างเอง</div>${loRow('ชื่อหัวข้อ (เห็นเฉพาะใน Studio)',`<input data-cust="${k}.label" value="${esc(cx.label||'')}">`,'w2')}
  ${loRow('แสดงอะไร',`<select data-cust="${k}.kind">${opts([['text','ข้อความตายตัว'],['field','ค่าจากข้อมูลการ์ด']],cx.kind)}</select>`)}
  ${cx.kind==='field'?loRow('ค่าจาก (เลือกหรือพิมพ์)',`<input data-cust="${k}.field" list="csFieldList" value="${esc(cx.field||'')}" placeholder="เช่น attr.hp">`):loRow('ข้อความ',`<input data-cust="${k}.text" value="${esc(cx.text||'')}">`)}
  ${loRow('คำนำหน้า',`<input data-cust="${k}.pre" value="${esc(cx.pre||'')}" placeholder="เช่น HP">`)}
  <p class="small w2">${cx.kind==='field'?'ค่าว่างหรือ 0 จะไม่แสดง · ':''}การ์ดใบนี้แสดง: <b>${esc(pv)||'(ว่าง)'}</b></p></div>
  <datalist id="csFieldList">${FIELD_CHOICES().map(([v,l])=>`<option value="${esc(v)}">${esc(l)}</option>`).join('')}</datalist>`:`<p class="small">การ์ดใบนี้แสดง: <b>${esc(pv)||(def&&!def.get?'(ภาพ/สัญลักษณ์)':'(ว่าง — ใบนี้ไม่มีค่า)')}</b></p>`}
 <div class="lo-form"><div class="lo-sub">อยู่ที่ไหน</div>${loRow('ช่อง',`<select ${p('zone')}>${opts(zl,it.show===false?'':it.zone)}</select>`,'w2')}
 <div class="w2 lo-btns tight"><button data-act="itUp" data-k="${k}">▲ เลื่อนขึ้น</button><button data-act="itDown" data-k="${k}">▼ เลื่อนลง</button>${it.show!==false&&it.zone?`<button data-act="pickZone" data-k="${it.zone}">▦ ไปที่ช่องนี้</button>`:''}</div>
 ${loRow('ต่อบรรทัดเดียวกับหัวข้อก่อนหน้า',`<input type="checkbox" ${p('join')} ${it.join?'checked':''}>`,'chk w2')}
 ${loRow('ดันไปท้ายช่อง',`<input type="checkbox" ${p('push')} ${it.push?'checked':''}>`,'chk')}
 ${loRow('จัดชิด',`<select ${p('align')}>${opts([['','ตามช่อง'],['left','ซ้าย'],['center','กลาง'],['right','ขวา']],it.align)}</select>`)}
 <div class="lo-sub">หน้าตา</div>${loRow('ขนาด (% กว้างการ์ด)',`<input type="number" step="0.1" min="0" ${p('size')} value="${it.size||''}" placeholder="ตามช่อง">`)}
 ${loRow('แสดงเป็น',`<select ${p('mode')}>${opts([['text','ข้อความ'],['both','สัญลักษณ์+ข้อความ'],['icon','สัญลักษณ์อย่างเดียว']],it.mode)}</select>`)}
 ${loRow('สีตัวอักษร',colorCell(p('color'),it.color,k+'.color'))}${loRow('สีพื้น',colorCell(p('bg'),it.bg,k+'.bg'))}
 ${NO_SYM.includes(k)?'':loRow('สัญลักษณ์',`<select ${p('sym')}>${opts(sl,it.sym)}</select>`)}<span></span>${NO_SYM.includes(k)?'':symBox(k,it,def)}
 ${loRow('ตัวหนา',`<input type="checkbox" ${p('bold')} ${it.bold?'checked':''}>`,'chk')}${loRow('ตัวเอียง',`<input type="checkbox" ${p('italic')} ${it.italic?'checked':''}>`,'chk')}
 ${loRow('แสดงบนการ์ดขนาดมือ',`<input type="checkbox" ${p('mini')} ${it.mini?'checked':''}>`,'chk')}${loRow('🔗 ใช้ร่วมทุกประเภท',`<input type="checkbox" ${p('shared')} ${it.shared?'checked':''}>`,'chk')}</div>
 <div class="lo-btns">${it.show!==false&&it.zone?`<button data-act="itHide" data-k="${k}">🗃 ซ่อนหัวข้อนี้</button>`:''}${cx?`<button class="danger" data-act="itDel" data-k="${k}">🗑 ลบหัวข้อนี้</button>`:''}</div>`}

// v19: symbol images right inside the item inspector + one picture per value ("ภาพแทนคำ")
const VALUE_PATH={type:'type',rank:'attr.rank',area:'attr.area',weapon:'attr.weapon',traitsText:'attr.traits',elementName:''};
function valueChoices(k,it){if(k==='family')return TEMPLATES[grp()].families.map(f=>FAMILIES[f]);let path=it.custom?.kind==='field'?it.custom.field:VALUE_PATH[k];if(!path)return [];let fams=[cur().family],out=new Set();
 for(let f of fams)for(let [p2,,kind] of FIELDS[f]||[])if(p2===path&&Array.isArray(kind))kind.forEach(v=>v&&out.add(String(v)));
 for(let c of Object.values(store.cards))if(fams.includes(c.family)){let v=path.split('.').reduce((o,q)=>o?.[q],c);if(v!=null&&String(v).trim()&&String(v).length<=16)out.add(String(v).trim())}
 return [...out]}
const exactSym=v=>Object.entries(store.symbols).find(([k,s])=>s.name===v||(s.words||[]).includes(v))?.[0]||'';
function symRow(sk,label){let s=store.symbols[sk];if(!s)return '';let has=!!(s.data||s.src),fb=!has&&s.fallback&&store.symbols[s.fallback];
 return `<div class="lo-symrow"><span class="lo-symprev">${symHTML(sk,store)}</span><b>${esc(label)}</b><small>${has?'ภาพแล้ว':fb?'ยังไม่มีภาพ (ใช้ '+esc(store.symbols[s.fallback].name)+' ไปก่อน)':BUILTIN[sk]?'ไอคอนโค้ด':'ยังไม่มีภาพ'}</small>
 <span class="lo-symbtn"><button data-act="iconPick2" data-k="${sk}" title="เลือกจากชุดไอคอน">🖼</button><button data-act="symUp" data-k="${sk}" title="อัปโหลดภาพ">⇧</button><button data-act="symPrompt" data-k="${sk}" title="คัดลอก prompt ไปเจนภาพ">⧉</button>${has?`<button data-act="symClear" data-k="${sk}" title="เอาภาพออก">✕</button>`:''}</span></div>`}
function symBox(k,it,def){let vals=valueChoices(k,it),fixed=it.sym||def?.sym||'',map=it.symMap||{},sl=Object.entries(store.symbols).map(([s2,v])=>[s2,v.name]);
 let rows=fixed?symRow(fixed,(vals.length?'ค่าที่ไม่ได้เลือกภาพ ใช้: ':'ทุกการ์ดใช้: ')+(store.symbols[fixed]?.name||fixed)):'';
 if(vals.length)rows+=`<div class="lo-symsub">ภาพตามค่า <small>เลือกภาพให้แต่ละค่าได้ — การ์ดแต่ละใบใช้ภาพตามค่าของตัวเอง</small></div>`+vals.map(v=>{let mk=map[v]&&store.symbols[map[v]]?map[v]:'',auto=!mk&&!fixed?exactSym(v):'',sk=mk||auto;
  return `<div class="lo-valrow"><span class="lo-symprev">${sk?symHTML(sk,store):fixed?symHTML(fixed,store):'—'}</span><b>${esc(v)}</b><select data-symmap="${k}|${esc(v)}">${opts([['',fixed?'ใช้ภาพทั่วไป':auto?'อัตโนมัติ ('+store.symbols[auto].name+')':'— ไม่มีภาพ (แสดงเป็นคำ)'],...sl],mk)}</select>${sk?`<span class="lo-symbtn"><button data-act="iconPick2" data-k="${sk}" title="เปลี่ยนภาพของสัญลักษณ์ ${esc(store.symbols[sk].name)} (มีผลทุกที่ที่ใช้)">🖼</button><button data-act="symUp" data-k="${sk}" title="อัปโหลดภาพ">⇧</button><button data-act="symPrompt" data-k="${sk}" title="คัดลอก prompt">⧉</button></span>`:''}</div>`}).join('');
 let missing=vals.filter(v=>!map[v]&&!exactSym(v));
 return `<div class="lo-symbox w2"><div class="lo-symhead">ภาพสัญลักษณ์ ${it.mode==='text'?'<small>· ตอนนี้ "แสดงเป็น" = ข้อความ จึงยังไม่เห็นภาพบนการ์ด</small>':''}</div>${rows||'<p class="small">เลือกสัญลักษณ์ด้านบน หรือปล่อย "อัตโนมัติ" ให้หาภาพจากคำ</p>'}
 ${missing.length&&k!=='family'?`<button data-act="wordSyms" data-k="${k}">✚ สร้างสัญลักษณ์ใหม่ให้คำที่ยังไม่มี (${missing.join(' / ')})</button>`:''}</div>`}
function newCustomItem(zone,kind){let T=tpl(),i=1,k;do k='cx'+i++;while(Object.values(store.templates).some(X=>X.items?.[k]));
 T.items[k]=IT({custom:{label:kind==='text'?'ข้อความใหม่':'ค่าใหม่',kind,text:kind==='text'?'ข้อความ':'',field:kind==='field'?'attr.hp':'',pre:kind==='field'?'HP':''},bold:true,color:'#3a2c1b'});
 placeItem(k,zone);selItem=k;selKind='item';return k}
function bindLayout(){let b=$q('#csMBody');if(!b.querySelector('.lo-wrap'))return;let dragK=null;
 const clear=()=>b.querySelectorAll('.drop-before,.drop-after,.drop-in').forEach(x=>x.classList.remove('drop-before','drop-after','drop-in'));
 b.querySelectorAll('[data-li]').forEach(li=>{li.addEventListener('dragstart',e=>{dragK=li.dataset.li;e.dataTransfer.effectAllowed='move';e.dataTransfer.setData('text/plain',dragK);li.classList.add('dragging')});li.addEventListener('dragend',()=>{li.classList.remove('dragging');clear();dragK=null})});
 b.querySelectorAll('.lo-tree .lo-zone').forEach(zb=>{let zk=zb.dataset.lz;if(zk==='art')return;
  zb.addEventListener('dragover',e=>{if(!dragK)return;e.preventDefault();clear();let li=e.target.closest('[data-li]');if(li&&zb.contains(li)&&li.dataset.li!==dragK&&zk!==''){let r=li.getBoundingClientRect();li.classList.add(e.clientY>r.top+r.height/2?'drop-after':'drop-before')}else zb.classList.add('drop-in')});
  zb.addEventListener('dragleave',e=>{if(!zb.contains(e.relatedTarget))zb.classList.remove('drop-in')});
  zb.addEventListener('drop',e=>{if(!dragK)return;e.preventDefault();let k=dragK,T=tpl(),it=T.items[k],li=e.target.closest('[data-li]');dragK=null;clear();
   if(zk===''){let old=it.zone;it.show=false;if(old&&T.zones[old])renumber(old);status('ซ่อน "'+itLabel(k)+'" แล้ว')}
   else{let idx;if(li&&zb.contains(li)&&li.dataset.li!==k){let list=zoneItems(zk,k),i=list.findIndex(([x])=>x===li.dataset.li),r=li.getBoundingClientRect();idx=i+(e.clientY>r.top+r.height/2?1:0)}placeItem(k,zk,idx);status('ย้าย "'+itLabel(k)+'" ไปช่อง '+T.zones[zk].label)}
   selItem=k;selKind='item';commit();preview();refreshModal()})});
 requestAnimationFrame(()=>b.querySelector('.lo-tree .on')?.scrollIntoView({block:'nearest'}))}
function openLayout(){if(mode!=='layout'){mode='layout';topBar()}preview();if(root.dataset.modal==='layout')refreshModal();else modal('layout')}
// ---------------- export / import ----------------
function exportCard(c){let o=clone(c);delete o.context;if(o.art?.data){delete o.art.data;o.art.src=o.art.src||'assets/cards/art/'+o.id+'.webp'}o.effects=(o.effects||[]).filter(x=>String(x).trim());return o}
function exportSymbols(){return Object.fromEntries(Object.entries(store.symbols).map(([k,s])=>{let o=clone(s);if(o.data){delete o.data;o.src='assets/cards/symbols/'+k+'.webp'}if(!o.src&&BUILTIN[k])o.svg=`<svg viewBox="0 0 24 24" fill="none">${BUILTIN[k]}</svg>`;return [k,o]}))}
function design(){retireUsageField(store);return {format:'card-design',version:2,exportedAt:new Date().toISOString(),size:[750,1101],frame:store.frame,groups:GROUPS,templateInfo:TEMPLATES,templateRule:'enemy + attr.rank หัวหน้า → boss; enemy → enemy; อื่นๆ ตามกลุ่ม',fields:FIELDS,templates:store.templates,itemLabels:Object.fromEntries(Object.entries(ITEMS).map(([k,v])=>[k,v.label])),symbols:exportSymbols(),elements:Object.fromEntries(Object.entries(ELEMENTS).map(([k,n])=>[k,{name:n,orb:elementFile(k),color:ELEMENT_COLOR[k]}])),families:FAMILIES,rarities:store.rarities,cards:store.order.map(id=>exportCard(store.cards[id]))}}
const jsText=()=>'// Exported from the card studio — permanent card design data.\nwindow.CARD_DESIGN='+JSON.stringify(design(),null,1)+';\n';
// v19: every designer setting the game keeps in this browser (play saves excluded) → one ZIP for making it permanent
const SETTING_NAMES={'three-card-config-v2':'ตัวเลขกลไกเดิม (ค่าในเกม)','tactics-anchors-v1':'จุดมือถืออาวุธ / จุดยืนในสนามรบ','menu-icons-v1':'ไอคอนเมนู','everyday-village-map-v03':'แผนที่หมู่บ้าน','everyday-village-routes-v1':'เส้นทางเดินในหมู่บ้าน','three-card-routes-v1':'เส้นทางผจญภัย','everyday-layout-v1':'layout หน้าจอเกม'};
const IS_SETTING=k=>k in SETTING_NAMES||/^(three-card-|everyday-|tactics-|menu-icons)/.test(k)&&!/^three-card-(forge|config-v1$)/.test(k); // only this game's keys (file:// pages share one browser storage)
function exportAllFiles(){let files=[{name:'card-design.json',data:JSON.stringify(design(),null,1)},{name:'card-design.js',data:jsText()}];
 for(let id of store.order){let k=store.cards[id];if(k.art?.data)files.push({name:exportCard(k).art.src,data:dataBytes(k.art.data)})}
 for(let [k,s2] of Object.entries(store.symbols))if(s2.data)files.push({name:'assets/cards/symbols/'+k+'.webp',data:dataBytes(s2.data)});
 let keys={},list=[];for(let i=0;i<localStorage.length;i++){let k=localStorage.key(i);if(!IS_SETTING(k))continue;let raw=localStorage.getItem(k),v;try{v=JSON.parse(raw)}catch(e){v=raw}keys[k]=v;list.push(`- ${k}: ${SETTING_NAMES[k]||'(อื่น ๆ)'} · ${(raw.length/1024).toFixed(1)} KB`)}
 files.push({name:'game-settings.json',data:JSON.stringify({format:'project-a-settings',version:1,exportedAt:new Date().toISOString(),names:SETTING_NAMES,keys},null,1)});
 let missing=Object.keys(SETTING_NAMES).filter(k=>!(k in keys)).map(k=>`- ${SETTING_NAMES[k]}: ยังไม่เคยปรับ (ใช้ค่าเริ่มต้นของเกม)`);
 files.push({name:'EXPORT-README-TH.txt',data:`ส่งออกการตั้งค่าทั้งหมด · ${new Date().toLocaleString('th-TH')}\n\nการ์ด: ${store.order.length} ใบ · ภาพอัปโหลด ${files.filter(f=>/^assets\//.test(f.name)).length} ไฟล์ (card-design.json / .js)\n\nการตั้งค่าอื่นในเบราว์เซอร์ (game-settings.json):\n${list.join('\n')||'- (ไม่มี)'}\n${missing.length?'\n'+missing.join('\n')+'\n':''}\nไม่รวม: เซฟความคืบหน้าการเล่น · คิวขอภาพของ Asset Studio\nส่งไฟล์ ZIP นี้ให้ Claude เพื่อทำเป็นค่าถาวรของเกม\n`});
 return files}
function download(name,data,type){let a=document.createElement('a'),u=URL.createObjectURL(data instanceof Blob?data:new Blob([data],{type}));a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000)}
const CRC=(()=>{let t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(b){let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
function zip(files){let enc=new TextEncoder(),parts=[],central=[],off=0;for(let f of files){let name=enc.encode(f.name),data=typeof f.data==='string'?enc.encode(f.data):f.data,crc=crc32(data),h=new DataView(new ArrayBuffer(30));h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint32(14,crc,true);h.setUint32(18,data.length,true);h.setUint32(22,data.length,true);h.setUint16(26,name.length,true);parts.push(h,name,data);
  let c=new DataView(new ArrayBuffer(46));c.setUint32(0,0x02014b50,true);c.setUint16(4,20,true);c.setUint16(6,20,true);c.setUint16(8,0x0800,true);c.setUint32(16,crc,true);c.setUint32(20,data.length,true);c.setUint32(24,data.length,true);c.setUint16(28,name.length,true);c.setUint32(42,off,true);central.push(c,name);off+=30+name.length+data.length}
 let size=central.reduce((s,p)=>s+p.byteLength,0),e=new DataView(new ArrayBuffer(22));e.setUint32(0,0x06054b50,true);e.setUint16(8,files.length,true);e.setUint16(10,files.length,true);e.setUint32(12,size,true);e.setUint32(16,off,true);return new Blob([...parts,...central,e],{type:'application/zip'})}
const dataBytes=u=>{let s=atob(u.split(',')[1]),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);return b};
function importFile(e){let file=e.target.files[0];e.target.value='';if(!file)return;file.text().then(t=>{let d=JSON.parse(t.slice(t.indexOf('{'),t.lastIndexOf('}')+1));if(d.format!=='card-design'||!Array.isArray(d.cards))throw Error('ไม่ใช่ไฟล์ card-design');
  undo.push(last);if(d.templates)store.templates=d.templates;else if(d.template)store.templates.play={zones:d.template.zones,items:d.template.items||clone(DEFAULT_ITEMS)};store.frame=d.frame||d.template?.frame||store.frame;if(Array.isArray(d.rarities))store.rarities=d.rarities;
  if(d.symbols)for(let [k,s] of Object.entries(d.symbols)){let old=store.symbols[k];delete s.svg;if(old?.data&&s.src==='assets/cards/symbols/'+k+'.webp'){s.data=old.data}store.symbols[k]={...(DEFAULT_SYMBOLS[k]||SYM(k,'')),...s}}
  for(let c of d.cards){let old=store.cards[c.id];if(old?.art?.data&&c.art&&c.art.src===old.art.src)c.art.data=old.art.data;store.cards[c.id]={...blank(c.id,c.family||'action'),...c};if(!store.order.includes(c.id))store.order.push(c.id)}
  migrate();last=JSON.stringify(store);persist();closeModal();renderAll();status('นำเข้า '+d.cards.length+' ใบแล้ว')}).catch(err=>alert('นำเข้าไม่ได้: '+err.message))}
// ---------------- uploads (downscaled webp, kept in this browser until exported) ----------------
function shrink(file,max,done){let img=new Image(),u=URL.createObjectURL(file);img.onload=()=>{let k=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(u);done(c.toDataURL('image/webp',.9))};img.src=u}
function upload(e){let file=e.target.files[0];e.target.value='';if(!file)return;shrink(file,900,data=>{let card=cur();card.art.data=data;card.art.src='assets/cards/art/'+card.id+'.webp';Object.assign(card.art,{x:0,y:0,scale:1,rot:0});commit();form();preview()})}
let symTarget=null;function symUpload(e){let file=e.target.files[0];e.target.value='';if(!file||!symTarget)return;let k=symTarget;shrink(file,256,data=>{let s=store.symbols[k];s.data=data;s.src='assets/cards/symbols/'+k+'.webp';commit();preview();refreshModal()})}
// ---------------- items: order helpers ----------------
function zoneItems(z,except){return Object.entries(tpl().items).filter(([k,it])=>it.zone===z&&it.show!==false&&k!==except).sort((a,b)=>a[1].order-b[1].order)}
function renumber(z){zoneItems(z).forEach(([,it],i)=>it.order=i+1)}
function placeItem(key,zone,index){let it=tpl().items[key],old=it.zone;let list=zoneItems(zone,key);index=Math.max(0,Math.min(list.length,index??list.length));list.splice(index,0,[key,it]);it.zone=zone;it.show=true;list.forEach(([,x],i)=>x.order=i+1);if(old&&old!==zone)renumber(old)}
// ---------------- events ----------------
function setPath(obj,path,v){let ks=path.split('.'),o=obj;for(let i=0;i<ks.length-1;i++){o[ks[i]]??=/^\d+$/.test(ks[i+1])?[]:{};o=o[ks[i]]}o[ks.at(-1)]=v}
const val=t=>t.type==='checkbox'?t.checked:t.type==='number'?(t.value===''?0:num(t.value)):t.value;
function onInput(e){let t=e.target,c=cur();
 if(t.dataset.f){let v=t.type==='number'?num(t.value):t.value;if(t.dataset.lines!==undefined)v=t.value.split('\n');if(['level','maxLevel'].includes(t.dataset.f))v=num(t.value);setPath(c,t.dataset.f,v);if(t.dataset.f==='maxLevel')c.level=Math.min(c.level,c.maxLevel);preview();if(t.dataset.f==='name')topBar();return}
 if(t.dataset.stat!==undefined){c.stats[t.dataset.stat]=num(t.value);return}
 if(t.dataset.itemF){let [k,q]=t.dataset.itemF.split('.'),it=tpl().items[k];selItem=k;selKind='item';if(q==='zone'){if(!t.value){it.show=false;renumber(it.zone)}else placeItem(k,t.value)}else{it[q]=val(t);if(t.type==='color')t.classList.remove('unset')}preview();return}
 if(t.dataset.symF){let [k,q]=t.dataset.symF.split('.'),s=store.symbols[k];if(q==='words')s.words=t.value.split(',').map(x=>x.trim()).filter(Boolean);else if(q==='src'){if(!s.data)s.src=t.value.trim()}else s[q]=val(t);preview();let pv=t.closest('tr')?.querySelector('.cs-symprev');if(pv)pv.innerHTML=symHTML(k,store);return}
 if(t.dataset.zoneF){let [k,q]=t.dataset.zoneF.split('.');tpl().zones[k][q]=t.type==='checkbox'?t.checked:['sep','bg','dir','justify','valign','label'].includes(q)?t.value:num(t.value);if(t.type==='color')t.classList.remove('unset');selZone=k;preview();return}
 if(t.dataset.cust){let [k,q]=t.dataset.cust.split('.'),it=tpl().items[k];if(it?.custom){it.custom[q]=t.value;preview()}return}
 if(t.dataset.zoneHide){tpl().zones[t.dataset.zoneHide].hide=t.checked;preview();return}
 if(t.dataset.tpl){store[t.dataset.tpl]=t.value;preview();return}
 if(t.dataset.rar){let [i,q]=t.dataset.rar.split('.');store.rarities[i][q]=q==='strength'?num(t.value):t.value;preview()}}
function onChange(e){let t=e.target;if(t.id==='csPick'){curId=t.value;commit();renderAll();return}
 if(t.dataset.addto!==undefined){let zk=t.dataset.addto,v=t.value;if(!v)return;if(v.startsWith('item:')){let k=v.slice(5);placeItem(k,zk);selItem=k;selKind='item';status('ใส่ "'+itLabel(k)+'" ในช่อง '+tpl().zones[zk].label)}else newCustomItem(zk,v.slice(4));commit();preview();refreshModal();return}
 if(t.dataset.cust){commit();preview();refreshModal();return}
 if(t.dataset.symmap){let [k,v]=t.dataset.symmap.split('|'),it=tpl().items[k];it.symMap||={};if(t.value)it.symMap[v]=t.value;else delete it.symMap[v];selItem=k;selKind='item';commit();preview();refreshModal();return}
 if(t.dataset.f||t.dataset.stat!==undefined||t.dataset.itemF||t.dataset.symF||t.dataset.zoneF||t.dataset.zoneHide||t.dataset.tpl||t.dataset.rar){commit();if(['family','level','maxLevel','rarity'].includes(t.dataset.f))form();if(root.dataset.modal==='layout'&&(t.dataset.itemF||t.dataset.zoneF||t.dataset.zoneHide))refreshModal();else if(t.dataset.itemF?.endsWith('.zone'))refreshModal()}}
function newId(base){let i=1,id;do id=base+'-'+i++;while(store.cards[id]);return id}
function onClick(e){let b=e.target.closest('button');if(!b||!root.contains(b))return;let c=cur(),a=b.dataset.act,T=tpl();
 if(b.dataset.mode){mode=b.dataset.mode;topBar();preview();if(mode==='layout')openLayout();return}
 if(b.dataset.tab){let f=b.dataset.tab;store.lastOf||={};store.lastOf[c.family]=curId;let id=store.lastOf[f]&&store.cards[store.lastOf[f]]?.family===f?store.lastOf[f]:store.order.find(i=>store.cards[i].family===f);if(!id){id=newId(f);store.cards[id]=blank(id,f);store.order.push(id)}curId=id;let m=root.dataset.modal;commit();renderAll();if(m&&m!=='text'&&m!=='stats')modal(m);else if(m)closeModal();return}
 if(b.dataset.modal){modal(b.dataset.modal);return}
 if(b.dataset.el!==undefined){c.element=b.dataset.el;commit();form();preview();return}
 const go=d=>{let ids=store.order.filter(i=>store.cards[i].family===c.family),i=ids.indexOf(curId);curId=ids[(i+d+ids.length)%ids.length];commit();renderAll()};
 switch(a){case'close':close();break;case'prev':go(-1);break;case'next':go(1);break;case'mclose':closeModal();break;
  case'new':{let id=newId(c.family),k=blank(id,c.family);store.cards[id]=k;store.order.push(id);curId=id;commit();renderAll();break}
  case'dup':{let id=newId(c.id.replace(/-\d+$/,'')+'-copy'),k=clone(c);k.id=id;k.name=c.name+' (สำเนา)';if(k.art.data)k.art.src='assets/cards/art/'+id+'.webp';store.cards[id]=k;store.order.splice(store.order.indexOf(curId)+1,0,id);curId=id;commit();renderAll();break}
  case'del':if(store.order.length>1&&confirm('ลบการ์ด "'+c.name+'" ออกจากโต๊ะออกแบบ?'+(c.family!=='custom'?'\n(การ์ดจากเกมจะกลับมาใหม่ด้วยค่าเริ่มต้นเมื่อเปิดครั้งหน้า)':''))){let i=store.order.indexOf(curId);delete store.cards[curId];store.order.splice(i,1);curId=store.order[Math.max(0,i-1)];commit();renderAll()}break;
  case'reseed':{let g=gameCards().find(x=>x.id===curId);if(g&&confirm('ดึงค่าจากเกมใหม่ทับใบนี้? (ตำแหน่งภาพที่จัดไว้จะคงไว้)')){g.art={...g.art,...c.art,src:c.art.data?c.art.src:g.art.src};store.cards[curId]=g;commit();renderAll()}break}
  case'undo':if(undo.length){redo.push(last);restore(undo.pop())}break;case'redo':if(redo.length){undo.push(last);restore(redo.pop())}break;
  case'legacy':close();window.__baseOpenPanel?.('editor');break;
  case'artBatch':{const T=window.TacticsCore,aid=k=>({move:'tactic-card-'+k.ref,action:'tactic-card-'+k.ref,consumable:'item-'+k.ref,goods:'item-'+k.ref,material:'item-'+k.ref,event:'event-'+k.ref,unit:'ally-'+k.ref,enemy:T?.ENEMY_TYPES[k.ref]?.art})[k.family];let man=new Set((window.ASSET_MANIFEST?.assets||[]).filter(x=>x.status!=='final').map(x=>x.id)),ids=store.order.map(id=>store.cards[id]).filter(k=>k.family===c.family&&!k.art?.data).map(aid).filter(x=>x&&man.has(x));
   if(!ids.length){status('การ์ดแท็บนี้มีภาพจริงครบแล้ว หรือไม่มีรายการใน Asset Studio');break}sessionStorage.setItem('asset-batch-sel',JSON.stringify([...new Set(ids)]));
   if(window.parent!==window){window.parent.postMessage({editorTab:'assets',reload:true},'*');status('ส่ง '+ids.length+' ภาพไป Asset Studio แล้ว — กด 🧩 ชุดคำขอ')}else{window.open('asset-studio.html','_blank')}break}
  case'applyGame':store.applyToGame=!store.applyToGame;commit();topBar();status(store.applyToGame?'เปิดทดลองในเกมแล้ว — รีโหลดเกมเพื่อใช้ชื่อ/ตัวเลขจากโต๊ะนี้':'ปิดแล้ว — เกมกลับไปใช้ค่าเดิมหลังรีโหลด');break;
  case'upload':$q('#csUpload').click();break;case'import':$q('#csImport').click();break;
  case'flip':c.art.flipX=!c.art.flipX;commit();form();preview();break;
  case'artReset':Object.assign(c.art,{x:0,y:0,scale:1,rot:0,flipX:false});commit();form();preview();break;
  case'dropData':delete c.art.data;c.art.src='';commit();form();preview();break;
  case'statDel':delete c.stats[b.dataset.k];commit();modal('stats');break;
  case'statAdd':{let k=$q('#csStatKey').value.trim().replace(/[^\w]/g,'');if(k){c.stats[k]=num($q('#csStatVal').value);commit();modal('stats')}break}
  case'clr':{let [x,k2]=b.dataset.clr.split(':');if(x==='zone')T.zones[k2].bg='';else{let [k,q]=b.dataset.clr.split('.');T.items[k][q]=''}commit();preview();refreshModal();break}
  case'pickItem':selItem=b.dataset.k;selKind='item';openLayout();break;
  case'itUp':case'itDown':{let it=T.items[b.dataset.k];if(!it.zone||it.show===false)break;let list=zoneItems(it.zone),i=list.findIndex(([k])=>k===b.dataset.k),j=i+(a==='itUp'?-1:1);if(j<0||j>=list.length)break;[list[i],list[j]]=[list[j],list[i]];list.forEach(([,x],n)=>x.order=n+1);selItem=b.dataset.k;commit();preview();refreshModal();break}
  case'applyShared':syncShared();commit();status('นำค่าที่ติ๊ก 🔗 ไปใช้กับทุกประเภทการ์ดแล้ว');break;
  case'copyAll':if(confirm('คัดลอกการตั้งค่า'+(b.dataset.k==='items'?'หัวข้อ':'ช่อง')+'ทั้งตารางของ '+TEMPLATES[grp()].name+' ไปทับทุกประเภทการ์ด?')){for(let T2 of Object.values(store.templates))if(T2!==T){if(b.dataset.k==='items'){T2.items=clone(T.items);for(let it of Object.values(T2.items))if(it.zone&&!T2.zones[it.zone])T2.zones[it.zone]=clone(T.zones[it.zone])}else T2.zones=clone(T.zones)}commit();status('คัดลอกไปทุกประเภทแล้ว')}break;
  case'itemsReset':if(confirm('คืนค่าเริ่มต้นทุกหัวข้อ?')){T.items=DEFAULT_TEMPLATES()[grp()].items;commit();preview();refreshModal()}break;
  case'iconPick':{let k=b.dataset.k,g=$q('#csIconGrid');if(g){g.remove();if(g.dataset.k===k)break}g=document.createElement('div');g.id='csIconGrid';g.dataset.k=k;g.innerHTML=`<p class="small">เลือกไอคอนแทน "${esc(store.symbols[k].name)}"</p><div>${ICON_PACK.map(([ik,n,tip])=>`<button data-act="iconSet" data-k="${k}" data-icon="${ik}" title="${esc(n+' · '+tip)}"><img src="${iconSrc(ik)}" alt=""></button>`).join('')}</div>`;b.closest('tr').after(Object.assign(document.createElement('tr'),{innerHTML:'<td colspan="9"></td>'}));b.closest('tr').nextElementSibling.firstChild.appendChild(g);break}
  case'iconSet':{let s=store.symbols[b.dataset.k];delete s.data;s.src=iconSrc(b.dataset.icon);s.useBuiltin=false;commit();preview();refreshModal();break}
  case'symUp':symTarget=b.dataset.k;$q('#csSymUpload').click();break;
  case'symClear':{let s=store.symbols[b.dataset.k];delete s.data;s.src='';s.useBuiltin=true;commit();preview();refreshModal();break}
  case'symPrompt':{let k=b.dataset.k,p=symPrompt(k,store.symbols[k]);navigator.clipboard?.writeText(p).then(()=>status('คัดลอก prompt สัญลักษณ์ "'+store.symbols[k].name+'" แล้ว'),()=>prompt('คัดลอก prompt นี้',p));break}
  case'symDel':if(confirm('ลบสัญลักษณ์นี้?')){delete store.symbols[b.dataset.k];for(let it of Object.values(T.items))if(it.sym===b.dataset.k)it.sym='';commit();preview();refreshModal()}break;
  case'symAdd':{let k=$q('#csSymKey').value.trim().toLowerCase().replace(/[^\w-]/g,''),n=$q('#csSymName').value.trim();if(!k||store.symbols[k]){alert(k?'key นี้มีแล้ว':'ใส่ key เป็นภาษาอังกฤษ');break}store.symbols[k]={...SYM(n||k,''),builtin:false};commit();refreshModal();break}
  case'pickZone':selZone=b.dataset.k;selKind='zone';openLayout();break;
  case'zoneHideT':{let z=T.zones[b.dataset.k];z.hide=!z.hide;selZone=b.dataset.k;selKind='zone';commit();preview();refreshModal();break}
  case'iconPick2':{let k=b.dataset.k,row=b.closest('.lo-symrow,.lo-valrow'),g=$q('#csIconGrid');if(g){let same=g.dataset.k===k;g.remove();if(same)break}g=document.createElement('div');g.id='csIconGrid';g.className='lo-ig';g.dataset.k=k;g.innerHTML=`<p class="small">เลือกภาพแทน "${esc(store.symbols[k].name)}"</p><div>${ICON_PACK.map(([ik,n,tip])=>`<button data-act="iconSet" data-k="${k}" data-icon="${ik}" title="${esc(n+' · '+tip)}"><img src="${iconSrc(ik)}" alt=""></button>`).join('')}</div>`;row.after(g);break}
  case'wordSyms':{let k=b.dataset.k,it=T.items[k],fb=it.sym||itemDef(k,it)?.sym||'',lb=itLabel(k,it),n=0;
   it.symMap||={};for(let v of valueChoices(k,it)){if(it.symMap[v]||exactSym(v))continue;let i=1,sk;do sk='w'+i++;while(store.symbols[sk]);store.symbols[sk]={...SYM(v,lb+': '+v,[v],false,'icon'),builtin:false,fallback:fb};it.symMap[v]=sk;n++}
   if(it.mode==='text')it.mode='both';commit();preview();refreshModal();status('สร้างภาพแทนคำ '+n+' คำ — ใส่ภาพทีละคำด้วย 🖼 ⇧ ⧉');break}
  case'loNew':newCustomItem(b.dataset.k,b.dataset.kind);commit();preview();refreshModal();break;
  case'itHide':{let it=T.items[b.dataset.k],old=it.zone;it.show=false;if(old&&T.zones[old])renumber(old);commit();preview();refreshModal();break}
  case'itDel':{let k=b.dataset.k;if(confirm('ลบหัวข้อ "'+itLabel(k)+'" ออกจากการ์ด'+TEMPLATES[grp()].name+'?')){let old=T.items[k].zone;delete T.items[k];if(old&&T.zones[old])renumber(old);selKind='zone';selZone=old&&T.zones[old]?old:selZone;commit();preview();refreshModal()}break}
  case'zoneAdd':{let i=1,k;do k='z'+i++;while(T.zones[k]);T.zones[k]={label:'ช่องใหม่ '+(i-1),x:9,y:18,w:30,h:6,fs:3.6,dir:'row',justify:'center',valign:'center',bg:'#2b2116cc'};selZone=k;selKind='zone';commit();openLayout();break}
  case'zoneDel':{let k=b.dataset.k;if(confirm('ลบช่อง "'+T.zones[k].label+'"? หัวข้อในช่องนี้จะย้ายไปกล่อง 🗃 หัวข้อที่ไม่แสดง')){selKind='zone';for(let it of Object.values(T.items))if(it.zone===k){it.zone='';it.show=false}delete T.zones[k];selZone='art';commit();preview();refreshModal()}break}
  case'zonesReset':if(confirm('คืนตำแหน่งช่องทั้งหมดเป็นค่าเริ่มต้น? (ช่องที่เพิ่มเองจะหายไป)')){T.zones=clone(DEFAULT_TEMPLATES()[grp()].zones);for(let z of Object.values(T.zones))z.shared=false;for(let it of Object.values(T.items))if(it.zone&&!T.zones[it.zone]){it.zone='';it.show=false}commit();preview();refreshModal()}break;
  case'rarReset':store.rarities=clone(DEFAULT_RARITIES);commit();preview();modal('rarity');break;
  case'expJson':download('card-design.json',JSON.stringify(design(),null,1),'application/json');break;
  case'expJs':download('card-design.js',jsText(),'text/javascript');break;
  case'copy':navigator.clipboard?.writeText(JSON.stringify(design(),null,1)).then(()=>status('คัดลอก JSON แล้ว'),()=>status('คัดลอกไม่ได้ — ใช้ปุ่มดาวน์โหลดแทน'));break;
  case'resetDesign':if(!window.CARD_DESIGN){status('ยังไม่มี card-design.js ในโฟลเดอร์เกม');break}if(confirm('ทิ้งการแก้การ์ดทั้งหมดในเบราว์เซอร์นี้ แล้วกลับไปใช้ค่าถาวรของเกม (card-design.js '+new Date(window.CARD_DESIGN.exportedAt).toLocaleString('th-TH')+')?')){localStorage.removeItem(KEY);load();undo=[];redo=[];renderAll();closeModal();status('กลับเป็นค่าถาวรแล้ว')}break;
  case'expAll':{let files=exportAllFiles();download('project-a-settings-'+new Date().toISOString().slice(0,10)+'.zip',zip(files));status('ส่งออกการตั้งค่าทั้งหมดแล้ว ('+files.length+' ไฟล์)');break}
  case'expZip':{let files=[{name:'card-design.json',data:JSON.stringify(design(),null,1)},{name:'card-design.js',data:jsText()}];for(let id of store.order){let k=store.cards[id];if(k.art?.data)files.push({name:exportCard(k).art.src,data:dataBytes(k.art.data)})}for(let [k,s] of Object.entries(store.symbols))if(s.data)files.push({name:'assets/cards/symbols/'+k+'.webp',data:dataBytes(s.data)});download('card-design-'+new Date().toISOString().slice(0,10)+'.zip',zip(files));status('ส่งออก ZIP แล้ว ('+files.length+' ไฟล์)');break}}}
// drag on the big preview: art pan / zone move+resize / item move between zones
function bindDrag(){let big=$q('#csBig'),drag=null,ghost=null;
 big.addEventListener('click',e=>{if(mode!=='view')return;let it=e.target.closest('[data-item]'),z=e.target.closest('[data-zone]');if(!it&&!z)return;if(it){selItem=it.dataset.item;selKind='item'}else{selZone=z.dataset.zone;selKind='zone'}openLayout()});
 big.addEventListener('pointerdown',e=>{if(e.button!==0||mode==='view')return;let card=big.querySelector('.gcard');if(!card)return;let R=card.getBoundingClientRect(),c=cur();
  if(mode==='art'){let box=e.target.closest('.g-artbox');if(!box)return;let A=box.getBoundingClientRect();drag={kind:'art',x:e.clientX,y:e.clientY,w:A.width,h:A.height,start:{...c.art}}}
  else{let it=e.target.closest('[data-item]'),z=e.target.closest('[data-zone]');
   if(it&&z&&selKind==='item'&&selItem===it.dataset.item)it=null;
   let clickItem=null;if(it&&z&&selKind==='zone'&&z.dataset.zone===selZone){clickItem=it.dataset.item;it=null} // press inside the selected zone = drag the zone; a plain click selects the item // 2nd press on the selected item = its zone (zones fully covered by one item, e.g. the orb)
   if(it&&e.target.dataset.handle===undefined){selItem=it.dataset.item;selKind='item';drag={kind:'item',key:selItem,x:e.clientX,y:e.clientY,moved:false};big.querySelectorAll('.sel').forEach(x=>x.classList.remove('sel'));it.classList.add('sel')}
   else if(z){selZone=z.dataset.zone;selKind='zone';let p=tpl().zones[selZone];drag={kind:e.target.dataset.handle!==undefined?'size':'move',x:e.clientX,y:e.clientY,W:R.width,H:R.height,start:{...p},moved:false,clickItem};preview()}else return}
  big.setPointerCapture(e.pointerId);drag.id=e.pointerId;e.preventDefault()});
 big.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;let dx=e.clientX-drag.x,dy=e.clientY-drag.y,c=cur();
  if(drag.kind==='item'){if(!drag.moved&&Math.hypot(dx,dy)<5)return;drag.moved=true;if(!ghost){ghost=document.createElement('div');ghost.className='cs-ghost';ghost.textContent='☰ '+itLabel(drag.key);document.body.appendChild(ghost)}ghost.style.left=e.clientX+12+'px';ghost.style.top=e.clientY+12+'px';
   big.querySelectorAll('.drop').forEach(x=>x.classList.remove('drop'));let z=document.elementsFromPoint(e.clientX,e.clientY).find(x=>x.dataset?.zone&&x.dataset.zone!=='art'&&big.contains(x));z?.classList.add('drop');return}
  if(drag.kind==='art'){c.art.x=Math.round((drag.start.x+dx/drag.w*100)*10)/10;c.art.y=Math.round((drag.start.y+dy/drag.h*100)*10)/10}
  else{if(!drag.moved&&Math.hypot(dx,dy)<3)return;drag.moved=true;let p=tpl().zones[selZone],r=v=>Math.round(v*10)/10;if(drag.kind==='move'){p.x=r(drag.start.x+dx/drag.W*100);p.y=r(drag.start.y+dy/drag.H*100)}else{p.w=Math.max(3,r(drag.start.w+dx/drag.W*100));if(!p.square)p.h=Math.max(2,r(drag.start.h+dy/drag.H*100));else p.h=r(p.w*RATIO)}}
  preview()});
 const end=e=>{if(!drag)return;let d=drag;drag=null;ghost?.remove();ghost=null;
  if(d.kind==='item'){if(d.moved){let hits=document.elementsFromPoint(e.clientX,e.clientY).filter(x=>big.contains(x)),tgt=hits.find(x=>x.dataset?.item&&x.dataset.item!==d.key),zone=hits.find(x=>x.dataset?.zone&&x.dataset.zone!=='art');
    if(zone){let zk=zone.dataset.zone,z=tpl().zones[zk],idx;if(tgt&&zone.contains(tgt)){let list=zoneItems(zk,d.key),i=list.findIndex(([k])=>k===tgt.dataset.item),r=tgt.getBoundingClientRect(),after=z.dir==='col'?e.clientY>r.top+r.height/2:e.clientX>r.left+r.width/2;idx=i+(after?1:0)}placeItem(d.key,zk,idx);status('ย้าย "'+itLabel(d.key)+'" ไปช่อง '+z.label)}}
   commit();preview();if(root.dataset.modal==='layout')refreshModal();else modal('layout');return}
  if(d.kind==='move'&&!d.moved&&d.clickItem){selItem=d.clickItem;selKind='item';preview()}
  commit();form();if(d.kind!=='art'){if(root.dataset.modal==='layout')refreshModal();else modal('layout')}};
 for(let n of ['pointerup','pointercancel'])big.addEventListener(n,end);
 big.addEventListener('wheel',e=>{if(mode!=='art'||!e.target.closest('.g-artbox'))return;e.preventDefault();let a=cur().art;if(e.shiftKey)a.rot=Math.round(num(a.rot)+(e.deltaY>0?2:-2));else a.scale=Math.max(.1,Math.round((a.scale||1)*(e.deltaY>0?.95:1.05)*100)/100);preview();clearTimeout(bindDrag.t);bindDrag.t=setTimeout(()=>{commit();form()},350)},{passive:false})}
document.addEventListener('keydown',e=>{if(!root||root.hidden)return;let typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
 if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(!$q('#csModal').hidden)closeModal();else close();return}
 if((e.ctrlKey||e.metaKey)&&!typing&&['z','y'].includes(e.key.toLowerCase())){e.preventDefault();$q(`[data-act=${e.key.toLowerCase()==='z'&&!e.shiftKey?'undo':'redo'}]`).click();return}
 if(mode==='layout'&&selKind==='zone'&&!typing&&e.key.startsWith('Arrow')){e.preventDefault();let p=tpl().zones[selZone],s=e.shiftKey?1:.2;if(e.key==='ArrowLeft')p.x-=s;if(e.key==='ArrowRight')p.x+=s;if(e.key==='ArrowUp')p.y-=s;if(e.key==='ArrowDown')p.y+=s;p.x=Math.round(p.x*10)/10;p.y=Math.round(p.y*10)/10;preview();clearTimeout(bindDrag.k);bindDrag.k=setTimeout(()=>{commit();refreshModal()},400)}},true);
// ---------------- open / close ----------------
function open(){if(!root)build();load();undo=[];redo=[];if(typeof $==='function'&&$('panel')?.open)$('panel').close();root.hidden=false;document.body.classList.add('studio-open');renderAll()}
function close(){if(!root||root.hidden)return;commit();if(!$q('#csModal').hidden){$q('#csModal').hidden=true;root.classList.remove('modal-open');delete root.dataset.modal}root.hidden=true;document.body.classList.remove('studio-open')}
// ---------- try mode: apply the studio's names / numbers to the running game (turn off = defaults again) ----------
function applyToGame(){let raw;try{raw=JSON.parse(localStorage.getItem(KEY))}catch(e){}if(!raw?.applyToGame||!raw.cards)return 0;
 const C=window.TacticsCore,T=window.TacticsDecks,AD=window.ADVENTURE_DATA,v=(x,d)=>x===''||x==null||!Number.isFinite(+x)?d:+x;let n=0;
 for(let c of Object.values(raw.cards)){let a=c.attr||{},ref=c.ref;try{
  if(c.family==='move'&&T?.MOVE[ref]){let M=T.MOVE[ref];Object.assign(M,{name:c.name,move:v(a.move,M.move),stamina:v(c.cost?.energy,M.stamina)});n++}
  else if(c.family==='action'&&T?.COMBAT[ref]){T.COMBAT[ref].name=c.name;let R=C?.COMBAT_RULES;if(ref==='spell'&&R){R.spell.damage=v(a.power,R.spell.damage);R.spell.range=v(c.range,R.spell.range);R.spell.stamina=v(c.cost?.energy,R.spell.stamina)}if(ref==='skill'&&R)R.skill.bonus=v(a.power,R.skill.bonus);n++}
  else if(c.family==='enemy'&&C?.ENEMY_TYPES[ref]){let E=C.ENEMY_TYPES[ref];Object.assign(E,{name:c.name,hp:v(a.hp,E.hp),melee:v(a.atk,E.melee),ranged:v(a.ranged,E.ranged),rangedReach:v(c.range,E.rangedReach),move:v(a.move,E.move),speed:v(a.speed,E.speed),element:c.element||E.element});n++}
  else if(c.family==='equip'&&C?.WEAPONS[ref]){let W=C.WEAPONS[ref];Object.assign(W,{name:c.name,damage:v(a.atk,W.damage),range:v(c.range,W.range),stamina:v(c.cost?.energy,W.stamina)});n++}
  else if(c.family==='consumable'&&AD?.CONSUMABLES[ref]){let X=AD.CONSUMABLES[ref];Object.assign(X,{name:c.name,hp:v(a.hp,X.hp),stamina:v(a.stamina,X.stamina),price:v(a.price,X.price),text:(c.effects||[])[0]||X.text});if(X.damage)X.damage=v(a.power,X.damage);if(X.range)X.range=v(c.range,X.range);n++}
  else if(c.family==='goods'&&AD?.GOODS[ref]){let X=AD.GOODS[ref];Object.assign(X,{name:c.name,price:v(a.price,X.price)});n++}
  else if(c.family==='event'&&AD?.EVENT_CARDS[ref]){AD.EVENT_CARDS[ref].name=c.name;n++}
  else if(c.family==='material'&&typeof MATERIALS!=='undefined'&&MATERIALS[ref]){Object.assign(MATERIALS[ref],{name:c.name,price:v(a.price,MATERIALS[ref].price)});n++}
  else if(c.family==='unit'&&window.Companions?.ROSTER[ref]){let R=Companions.ROSTER[ref];Object.assign(R,{name:c.name,hp:v(a.hp,R.hp)});n++}
 }catch(e){}}return n}
const APPLIED=applyToGame();
window.addEventListener('load',()=>{if(APPLIED&&!window.EDITOR_MODE){let el=document.getElementById('saveStatus');if(el)el.insertAdjacentHTML('afterend',`<span class="try-badge" title="ปิดได้ที่ Editor → การ์ด → ปุ่ม ทดลองในเกม">▶ ทดลองค่าจากโต๊ะการ์ด (${APPLIED} ใบ)</span>`)}});
function cardById(id){if(!store)load();return store.cards[id]||null}
function renderCard(id,opt={}){let c=cardById(id);return c?cardHTML(c,store,opt):''}
window.CardStudio={exportFiles:()=>{if(!store)load();return exportAllFiles()},open,close,cardHTML,fit,bindTips,ELEMENTS,BUILTIN,cardById,renderCard,design:()=>{if(!store)load();return design()}};
if(typeof openPanel==='function'){const base=openPanel;window.__baseOpenPanel=base;openPanel=function(w){if(w==='editor'){if(typeof busy!=='undefined'&&busy)return;open();return}close();return base(w)}}
})();
