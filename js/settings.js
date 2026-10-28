// v15: Settings (⚙ in the top menu) + first-time tips.
// • difficulty easy/normal/hard (enemy HP and damage) · battle animation speed · tips on/off · rename hero · replay tips
// • tips show once each the first time you see the village, a battle, the adventure map and the deck builder
(function(){
const DEF={difficulty:'normal',speed:1,tips:true};
function S(){if(typeof s==='undefined'||!s.village)return {...DEF};s.village.settings||={...DEF};for(let k in DEF)s.village.settings[k]??=DEF[k];return s.village.settings}
function apply(){let c=S();window.GAME_DIFFICULTY=c.difficulty;window.GAME_SPEED=c.speed||1}
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
window.openSettings=function(){let c=S(),D=window.TacticsCore?.DIFFICULTY||{};
 villageDialog('ตั้งค่า',`<div class="settings-box">
 <label>ชื่อตัวเอก <span><b>${esc(window.heroName?.()||'')}</b> <button onclick="HeroIdentity.askHeroName(false);openSettings()">เปลี่ยนชื่อ</button></span></label>
 <label>ความยาก <select onchange="GameSettings.set('difficulty',this.value)">${['easy','normal','hard'].map(k=>`<option value="${k}" ${c.difficulty===k?'selected':''}>${D[k]?.name||k}${k==='easy'?' · ศัตรู HP/แรง −20%':k==='hard'?' · ศัตรู HP +25% แรง +20%':''}</option>`).join('')}</select></label>
 <label>ความเร็วแอนิเมชันต่อสู้ <select onchange="GameSettings.set('speed',+this.value)">${[[.75,'ช้า'],[1,'ปกติ'],[1.5,'เร็ว'],[2.2,'เร็วมาก']].map(([v,n])=>`<option value="${v}" ${c.speed==v?'selected':''}>${n}</option>`).join('')}</select></label>
 <label>เสียงเอฟเฟกต์ <input type="range" min="0" max="1" step=".05" value="${window.BattlePolish?.volume??.65}" oninput="BattlePolish.set('volume',+this.value)"></label>
 <label>เพลงพื้นหลัง <input type="range" min="0" max="1" step=".05" value="${window.BattlePolish?.musicVolume??.3}" oninput="BattlePolish.set('musicVolume',+this.value)"></label>
 <label>คำแนะนำครั้งแรก <span><input type="checkbox" ${c.tips?'checked':''} onchange="GameSettings.set('tips',this.checked)"> แสดง <button onclick="GameSettings.resetTips()">ดูคำแนะนำอีกครั้ง</button></span></label>
 <p class="muted small">ความยากมีผลกับการต่อสู้ครั้งถัดไป · เสียงและเพลงเริ่มหลังคลิกหรือกดปุ่มครั้งแรก · สำรอง/นำเข้าเซฟอยู่ท้ายหน้าเกม</p></div>`)};
const TIPS={
 village:['ยินดีต้อนรับสู่หมู่บ้าน','เดินทางด้วยปุ่ม <b>แผนที่</b> · โรงตีเหล็กใช้คราฟต์อาวุธ 9 ชนิด · ตลาดซื้อขายและจ้างเพื่อนร่วมทาง · ทางออกรอบหมู่บ้านพาไปผจญภัย (★ = ความยาก)'],
 battle:['การต่อสู้','คิวด้านซ้ายคือลำดับตามความเร็ว · ถึงตาตัวไหนใช้การ์ดของตัวนั้น: <b>เคลื่อนที่ได้ 2 ใบ</b> แต่ใบที่สองต้องยังไม่ใช้แอ็กชันและแลกสิทธิ์ต่อสู้ทั้งหมด · เดินแล้วเลือกทิศหัน · <b>แอ็กชันปกติ 2 ใบ</b> ชี้ศัตรูเพื่อดูความเสียหายล่วงหน้า · เวทที่กำหนดรอ CT และหลบวงร่ายได้ · สลบ 3 CT ยืนติดแล้วคลิกเพื่อช่วยฟื้น · ไอเทมสุ่ม 3 ใช้ 1 · Enter/Space = จบเทิร์น · ปุ่ม Auto ให้ AI เล่นแทน · พื้นและความสูงมีผล ชี้ช่องเพื่อดู'],
 adventure:['แผนที่ผจญภัย','เลือกจุดที่เรืองแสงเพื่อเดินต่อ ทุกครั้งจุดจะสุ่มใหม่ · ⚔ ศัตรู ◆ สมบัติ ? เหตุการณ์ ! เควส ☾ จุดพัก ⚖ พ่อค้า ❔ ลึกลับ · ปลายทางคือหัวหน้าพื้นที่ · ใช้ยาจากกระเป๋าได้ระหว่างทาง'],
 deck:['จัดสำรับ','แต่ละตัวละครมีสำรับของตัวเอง: เคลื่อนที่ 10–30 ใบ แอ็กชัน 14–60 ใบ · ลองชุดสำเร็จรูปก่อนแล้วค่อยปรับ · เพื่อนแต่ละคนมีการ์ดเฉพาะตัว']};
function tip(k){let c=S();if(!c.tips||typeof s==='undefined'||!s.village||/[?&]editor=/.test(location.search)||navigator.webdriver)return;let seen=s.village.tipsSeen||={};if(seen[k])return;seen[k]=1;save();
 let T=TIPS[k],el=document.createElement('div');el.className='game-tip';el.innerHTML=`<div><h4>💡 ${T[0]}</h4><p>${T[1]}</p><button>เข้าใจแล้ว</button></div>`;el.querySelector('button').onclick=()=>el.remove();document.body.appendChild(el)}
window.GameSettings={get:S,set(k,v){S()[k]=v;apply();save()},resetTips(){if(s.village)s.village.tipsSeen={};S().tips=true;save();tip('village')},tip,apply};
apply();
// hooks
if(typeof openTactical==='function'){const b=openTactical;openTactical=function(...a){let r=b.apply(this,a);setTimeout(()=>{if(document.getElementById('tacticsLayer')?.classList.contains('fullbattle'))tip('battle')},800);return r}}
if(window.Adventure?.enter){const b=Adventure.enter;Adventure.enter=function(...a){let r=b.apply(this,a);setTimeout(()=>tip('adventure'),600);return r}}
if(typeof openPanel==='function'){const b=openPanel;openPanel=function(w){let r=b.apply(this,arguments);if(w==='tdeck')setTimeout(()=>tip('deck'),300);return r}}
window.addEventListener('load',()=>setTimeout(()=>{if(s?.village?.heroName)tip('village')},1500));
})();
