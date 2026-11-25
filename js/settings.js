// v15: Settings (⚙ in the top menu) + first-time tips.
// • battle animation speed (no difficulty setting — removed v98.785) · tips on/off · rename hero · replay tips
// • tips show once each the first time you see the village, a battle, the adventure map and the deck builder
(function(){
const DEF={speed:1,tips:true};
const settingArt=k=>`<img src="assets/icons/menu/v2-${k}.webp" alt="" width="28" height="28" style="object-fit:contain;vertical-align:middle;margin-right:8px">`;
function S(){if(typeof s==='undefined'||!s.village)return {...DEF};s.village.settings||={...DEF};for(let k in DEF)s.village.settings[k]??=DEF[k];return s.village.settings}
function apply(){let c=S();window.GAME_SPEED=c.speed||1}
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
window.openSettings=function(){let c=S();
 villageDialog('ตั้งค่า',`<div class="settings-box">
 <label><span>${settingArt('character')}ชื่อตัวเอก</span> <span><b>${esc(window.heroName?.()||'')}</b> <button onclick="HeroIdentity.askHeroName(false);openSettings()">เปลี่ยนชื่อ</button></span></label>
 <label><span>${settingArt('skills')}ความเร็วแอนิเมชันต่อสู้</span> <select onchange="GameSettings.set('speed',+this.value)">${[[.75,'ช้า'],[1,'ปกติ'],[1.5,'เร็ว'],[2.2,'เร็วมาก']].map(([v,n])=>`<option value="${v}" ${c.speed==v?'selected':''}>${n}</option>`).join('')}</select></label>
 <label><span>${settingArt('controls')}ปุ่มควบคุมบนจอ (จอยสติ๊ก + ปุ่มคุย)</span> <select onchange="try{localStorage.setItem('projectA.touchUI',this.value)}catch(e){}">${(()=>{let m='auto';try{m=localStorage.getItem('projectA.touchUI')||'auto'}catch(e){}return [['auto','อัตโนมัติ (แสดงบนจอสัมผัส)'],['on','แสดงเสมอ'],['off','ซ่อน']].map(([v,n])=>`<option value="${v}" ${m===v?'selected':''}>${n}</option>`).join('')})()}</select></label>
 <label><span>${settingArt('audio')}เสียงเอฟเฟกต์</span> <input type="range" min="0" max="1" step=".05" value="${window.BattlePolish?.volume??.65}" oninput="BattlePolish.set('volume',+this.value)"></label>
 <label><span>${settingArt('audio')}เพลงพื้นหลัง</span> <input type="range" min="0" max="1" step=".05" value="${window.BattlePolish?.musicVolume??.24}" oninput="BattlePolish.set('musicVolume',+this.value)"></label>
 <label><span>${settingArt('help')}คำแนะนำครั้งแรก</span> <span><input type="checkbox" ${c.tips?'checked':''} onchange="GameSettings.set('tips',this.checked)"> แสดง <button onclick="GameSettings.resetTips()">ดูคำแนะนำอีกครั้ง</button></span></label>
 <label><span>${settingArt('graphics')}ลดความละเอียดอัตโนมัติเมื่อกระตุก (ภาพจะเบาลงเมื่อเครื่องช้า · ปกติปิดไว้)</span> <span><input type="checkbox" ${(()=>{try{return localStorage.getItem('projectA.autoRes')==='1'?'checked':''}catch(e){return ''}})()} onchange="try{localStorage.setItem('projectA.autoRes',this.checked?'1':'0')}catch(e){};GameSettings&&alert('มีผลเมื่อโหลดหน้าใหม่')"> เปิด</span></label>
 <label><span>${settingArt('graphics')}วัดประสิทธิภาพ (fps)</span> <span><button onclick="GameSettings.perf()">📊 วัดประสิทธิภาพ</button></span></label>
 <p class="muted small">เดินด้วยจอยสติ๊กหรือแป้น W A S D / ลูกศร · ปุ่มใหญ่ (E หรือ Space) = คุย / เข้าประตู / ออก · เสียงและเพลงเริ่มหลังคลิกหรือกดปุ่มครั้งแรก · สำรอง/นำเข้าเซฟอยู่ท้ายหน้าเกม</p></div>`)};
const TIPS={
 village:['ยินดีต้อนรับสู่หมู่บ้าน','เดินทางด้วยปุ่ม <b>แผนที่</b> · โรงตีเหล็กใช้คราฟต์อาวุธ 9 ชนิด · ตลาดซื้อขายและจ้างเพื่อนร่วมทาง · ทางออกรอบหมู่บ้านพาไปผจญภัย (★ = ความยาก)'],
 battle:['การต่อสู้','คิวด้านซ้ายคือลำดับตามความเร็ว · ถึงตาตัวไหนใช้การ์ดของตัวนั้น: <b>เคลื่อนที่ได้ 2 ใบ</b> แต่ใบที่สองต้องยังไม่ใช้แอ็กชันและแลกสิทธิ์ต่อสู้ทั้งหมด · เดินแล้วเลือกทิศหัน · <b>แอ็กชันปกติ 2 ใบ</b> ชี้ศัตรูเพื่อดูความเสียหายล่วงหน้า · เวทที่กำหนดรอ CT และหลบวงร่ายได้ · สลบ 3 CT ยืนติดแล้วคลิกเพื่อช่วยฟื้น · ไอเทมสุ่ม 3 ใช้ 1 · Enter/Space = จบเทิร์น · ปุ่ม Auto ให้ AI เล่นแทน · พื้นและความสูงมีผล ชี้ช่องเพื่อดู'],
 adventure:['แผนที่ผจญภัย','เลือกจุดที่เรืองแสงเพื่อเดินต่อ ทุกครั้งจุดจะสุ่มใหม่ · ⚔ ศัตรู ◆ สมบัติ ? เหตุการณ์ ! เควส ☾ จุดพัก ⚖ พ่อค้า ❔ ลึกลับ · ปลายทางคือหัวหน้าพื้นที่ · ใช้ยาจากสมุดผนึกได้ระหว่างทาง'],
 deck:['จัดสำรับ','แต่ละตัวละครมีสำรับของตัวเอง: เคลื่อนที่ 10–30 ใบ แอ็กชัน 14–60 ใบ · ลองชุดสำเร็จรูปก่อนแล้วค่อยปรับ · เพื่อนแต่ละคนมีการ์ดเฉพาะตัว']};
function tip(k){let c=S();if(!c.tips||typeof s==='undefined'||!s.village||/[?&]editor=/.test(location.search)||navigator.webdriver)return;let seen=s.village.tipsSeen||={};if(seen[k])return;seen[k]=1;save();
 let T=TIPS[k],el=document.createElement('div');el.className='game-tip';el.innerHTML=`<div><h4>💡 ${T[0]}</h4><p>${T[1]}</p><button>เข้าใจแล้ว</button></div>`;el.querySelector('button').onclick=()=>el.remove();document.body.appendChild(el)}
/* v98.98 · measure how the game runs on THIS device (fps, stutter, cost of each draw step) and copy the report — the village runs in a frame, so ask the visible frame to measure itself */
function perf(){document.querySelector('dialog[open]')?.close?.();document.getElementById('villageDialog')?.remove?.();
 let t=null;for(const f of document.querySelectorAll('iframe')){try{if(f.contentWindow.SpeedCheck&&f.offsetParent!==null&&f.getBoundingClientRect().width>200)t=f.contentWindow}catch(e){}}
 (t||window).SpeedCheck?.start()}
window.GameSettings={perf,get:S,set(k,v){S()[k]=v;apply();save()},resetTips(){if(s.village)s.village.tipsSeen={};S().tips=true;save();tip('village')},tip,apply};
apply();
// hooks
if(typeof openTactical==='function'){const b=openTactical;openTactical=function(...a){let r=b.apply(this,a);setTimeout(()=>{if(document.getElementById('tacticsLayer')?.classList.contains('fullbattle'))tip('battle')},800);return r}}
if(window.Adventure?.enter){const b=Adventure.enter;Adventure.enter=function(...a){let r=b.apply(this,a);setTimeout(()=>tip('adventure'),600);return r}}
if(typeof openPanel==='function'){const b=openPanel;openPanel=function(w){let r=b.apply(this,arguments);if(w==='tdeck')setTimeout(()=>tip('deck'),300);return r}}
window.addEventListener('load',()=>setTimeout(()=>{if(s?.village?.heroName)tip('village')},1500));
})();
