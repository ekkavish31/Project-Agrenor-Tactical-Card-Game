// v12 deck builder: every character has its own two decks (movement 30 / action 60).
// • Pick the hero or a hired companion at the top — each is saved separately
//   (hero: s.village.tacticDecks, companions: s.village.unitDecks[key]).
// • Card pictures + details, a ratio bar per deck, and presets (built-in + your own saved sets).
(function(){
const D=TacticsDecks;
let draft=null,who='hero',msg='';
const info={thunder:'สายฟ้า 14 · ระยะ 4 · แรง 14 · ร่าย 1 CT · ฝน +20%',dash:'เดิน 5 · แรง 4',creep:'เดิน 3 · ไม่ใช้แรง',flame:'อาวุธ +4 ธาตุไฟ · แรง +4',gust:'ลม 7 ระยะ 3 + ผลัก',mend:'ฟื้น HP 16 · แรง 10',quake:'ทุบรอบตัว 10 ธาตุดิน',aimed:'อาวุธ +8 ธาตุแสง · แรง +8',frost:'เวทน้ำแข็ง 13 · ไกล 4 · แช่แข็งน้ำ (ลูน่า)',wall:'กัน 14 + เพื่อนข้างตัวกัน 8 (บรัม)',whirl:'ฟันรอบตัว อาวุธ −4 (เคียร์)',twin:'ฟัน 2 ครั้ง ครั้งละ 55% (มิล)',step:'เดิน 2 ช่อง',walk:'เดิน 4 ช่อง',run:'เดิน 6 · แรง 8',sprint:'เดิน 8 · แรง 16',attack:'ความเสียหายตามอาวุธ',skill:'อาวุธ +12 · แรง +10',guard:'กัน 8 (มีโล่ 16)',rest:'ฟื้นแรง 30',spell:'พลัง 14 · ระยะ 4 · แรง 12',push:'ผลักถอย 1 ช่อง · ชน +6',pull:'ระยะ 3 · ดึงเข้ามา 1 ช่อง',line:'ทะลวงโดน 2 ช่องเป็นแนว'};
const COLORS={thunder:'#709cca',step:'#7fae8a',walk:'#5f9f93',run:'#4f86a6',sprint:'#4a6aa8',attack:'#c9764a',skill:'#b8473a',guard:'#5f84a2',rest:'#7fa45a',spell:'#7a5ab0',push:'#a0784a',pull:'#4a8a9a',line:'#c0603a',frost:'#4a8ac0',wall:'#6a86a2',whirl:'#8aa04a',twin:'#b0505a',flame:'#d0502a',gust:'#5aa08a',mend:'#5aa060',quake:'#8a7040',aimed:'#c0a040',dash:'#5a80b0',creep:'#6a9a80'};
const clone=o=>JSON.parse(JSON.stringify(o)),sum=o=>Object.values(o).reduce((a,b)=>a+b,0);
const BUILTIN={
 'สมดุล (เริ่มต้น)':D.DEFAULT,
 'เน้นประชิด':{movement:{step:4,walk:10,run:10,sprint:6},combat:{attack:22,skill:12,guard:6,rest:8,spell:0,push:6,pull:2,line:4}},
 'เน้นเวท':{movement:{step:10,walk:12,run:6,sprint:2},combat:{attack:6,skill:2,guard:8,rest:16,spell:16,thunder:6,push:2,pull:4,line:0}},
 'เน้นตั้งรับ':{movement:{step:12,walk:10,run:6,sprint:2},combat:{attack:14,skill:4,guard:20,rest:14,spell:2,push:4,pull:2,line:0}},
 'ควบคุมพื้นที่':{movement:{step:6,walk:12,run:8,sprint:4},combat:{attack:12,skill:4,guard:8,rest:10,spell:6,push:10,pull:8,line:2}}};
function chars(){let list=[{key:'hero',name:'ตัวเอก (คุณ)',weapon:'ตามที่สวมใส่'}];for(let c of (s.village.companions||[])){let r=window.Companions?.ROSTER[c.key];if(r)list.push({key:c.key,name:r.name+' Lv.'+(c.level||1),weapon:TacticsCore.WEAPONS[r.weapon]?.name||r.weapon})}return list}
function stored(k){let v=k==='hero'?s.village.tacticDecks:(s.village.unitDecks||{})[k];try{return D.validate(v||(k==='hero'?D.DEFAULT:D.defaultFor(k)))}catch(e){return clone(D.validate(k==='hero'?D.DEFAULT:D.defaultFor(k)))}}
function cardPic(group,id){let sid=(group==='movement'?'m-':'a-')+id;return window.CardStudio?.renderCard(sid,{mini:true})||`<span class="tdk-dot" style="background:${COLORS[id]}"></span>`}
function ratio(group){let d=draft[group],tot=group==='movement'?30:60;return `<div class="tdk-ratio" title="สัดส่วนในสำรับ">${Object.entries(d).filter(([,n])=>n>0).map(([id,n])=>`<i style="width:${n/tot*100}%;background:${COLORS[id]}" title="${(group==='movement'?D.MOVE:D.COMBAT)[id].name} ${n}"></i>`).join('')}</div>`}
function row(group,id){let n=draft[group][id],total=group==='movement'?30:60,full=sum(draft[group])>=total,def=(group==='movement'?D.MOVE:D.COMBAT)[id];
 return `<div class="tdk-card ${n?'':'zero'}"><div class="tdk-pic">${cardPic(group,id)}</div><b>${def.name}</b><small>${info[id]||''}</small><div class="tdk-count"><button onclick="tdeckAdd('${group}','${id}',-1)" ${n<1?'disabled':''}>−</button><b>${n}</b><button onclick="tdeckAdd('${group}','${id}',1)" ${full?'disabled':''}>+</button></div></div>`}
function presets(){return {...BUILTIN,...(s.village.deckPresets||{})}}
function renderTacticDeck(){if(!draft)draft=stored(who);let mv=sum(draft.movement),cb=sum(draft.combat),ok=mv===30&&cb===60,P=presets();
 villageDialog('จัดสำรับต่อสู้',`<div class="tdk-top"><label>ตัวละคร <select onchange="tdeckWho(this.value)">${chars().map(c=>`<option value="${c.key}" ${c.key===who?'selected':''}>${c.name} · ${c.weapon}</option>`).join('')}</select></label>
 <label>ชุดสำรับ <select id="tdkPreset">${Object.keys(P).map(n=>`<option>${n}</option>`).join('')}</select></label>${elButton('ใช้ชุดนี้','tdeckPreset()')}${elButton('บันทึกเป็นชุดใหม่','tdeckSavePreset()')}</div>
 <p class="muted small">แต่ละตัวมีสำรับของตัวเอง · เคลื่อนที่ 30 ใบ (จั่ว 3 ใช้ 1) · แอ็กชัน 60 ใบ (จั่ว 6 ใช้ 2) · ถึงคิวใครก็จั่วจากสำรับของคนนั้น</p>
 <section class="tdk-sec"><h3>เคลื่อนที่ <span class="${mv===30?'ok':'bad'}">${mv}/30</span></h3>${ratio('movement')}<div class="tdk-grid">${Object.keys(D.MOVE).map(id=>row('movement',id)).join('')}</div></section>
 <section class="tdk-sec"><h3>แอ็กชัน <span class="${cb===60?'ok':'bad'}">${cb}/60</span></h3>${ratio('combat')}<div class="tdk-grid">${Object.keys(D.COMBAT).filter(id=>!D.allowed||D.allowed(id,who)).map(id=>row('combat',id)).join('')}</div></section>
 <p id="tdeckStatus" class="small">${msg||(ok?'พร้อมบันทึก':'ต้องครบ 30 และ 60 ใบพอดีจึงบันทึกได้')}</p>
 <div class="choice-grid">${elButton('บันทึกสำรับของตัวนี้','tdeckSave()',!ok,'primary')}${elButton('คืนค่าเริ่มต้น','tdeckReset()')}${elButton('← กลับโต๊ะจัดสำรับ',"tdeckClose();openPanel('deck')")}</div>`);msg='';window.CardStudio?.fit($('panelContent'))}
window.tdeckWho=k=>{who=k;draft=null;renderTacticDeck()};
window.tdeckAdd=(g,id,d)=>{let total=g==='movement'?30:60,cur=draft[g][id],room=total-sum(draft[g]);d=d>0?Math.min(d,room):Math.max(d,-cur);draft[g][id]=cur+d;renderTacticDeck()};
window.tdeckPreset=()=>{let n=$('tdkPreset').value;try{draft=clone(D.validate(presets()[n]));msg='โหลดชุด "'+n+'" แล้ว — กดบันทึกเพื่อใช้กับตัวนี้'}catch(e){msg=e.message}renderTacticDeck()};
window.tdeckSavePreset=()=>{try{D.validate(draft)}catch(e){msg='ต้องครบ 30/60 ก่อนบันทึกเป็นชุด';return renderTacticDeck()}let n=prompt('ตั้งชื่อชุดสำรับ');if(!n)return;s.village.deckPresets||={};s.village.deckPresets[n.slice(0,30)]=clone(draft);save();msg='บันทึกชุด "'+n+'" แล้ว';renderTacticDeck()};
window.tdeckSave=()=>{try{let v=D.validate(draft);if(who==='hero')s.village.tacticDecks=v;else{s.village.unitDecks||={};s.village.unitDecks[who]=v}save();msg='✓ บันทึกสำรับของ '+(chars().find(c=>c.key===who)?.name||who)+' แล้ว ใช้ในการต่อสู้ครั้งถัดไป'}catch(e){msg=e.message}renderTacticDeck()};
window.tdeckReset=()=>{draft=clone(D.validate(D.DEFAULT));renderTacticDeck()};
window.tdeckClose=()=>{draft=null};
const baseOpen=openPanel;openPanel=function(which){if(which==='tdeck'){if(busy)return;draft=null;renderTacticDeck();return}return baseOpen(which)};
const baseDeck=renderDeck;renderDeck=function(){baseDeck();let n=chars().length;$('panelContent').insertAdjacentHTML('afterbegin',`<div class="tdeck-entry"><div><b>สำรับต่อสู้</b><small>${n} ตัวละคร · แต่ละตัวมีสำรับเคลื่อนที่ 30 + แอ็กชัน 60 ของตัวเอง</small></div>${elButton('จัดสำรับ',"openPanel('tdeck')")}</div>`)};
window.renderTacticDeck=renderTacticDeck;
})();
