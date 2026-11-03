/* v98.99 · map editor: "🚶 ความเร็วเดิน" — walking speed of the hero and of every villager in metres / second (1 cell ≈ 0.57 m). Saved in this browser at once (the game reads it live),
   ⬆ Push sends it with the village editor's settings. Needs js/walk-speed.js. */
(function () {
  'use strict';
  if (new URLSearchParams(location.search).get('edit') !== '1') return;
  const W = () => window.WalkSpeed, esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function open() {
    if (!W()) return alert('ระบบความเร็วเดินยังโหลดไม่เสร็จ');
    let d = document.getElementById('walkSpeedDialog');
    if (!d) { d = document.createElement('dialog'); d.id = 'walkSpeedDialog'; document.body.append(d) }
    const roster = (window.TownNPC && window.TownNPC.roster) || [], row = (id, label, ms, def) => `<label class="ws-row"><span>${esc(label)}</span><input type="number" min="0.05" max="30" step="0.05" data-id="${id}" value="${ms.toFixed(2)}"><small>ม./วิ</small><em data-cells="${id}">${(ms / W().M).toFixed(2)} ช่อง/วิ</em><button type="button" data-reset="${id}" title="กลับค่าเดิมของเกม (${def.toFixed(2)} ม./วิ)">↺</button></label>`;
    d.innerHTML = `<style>#walkSpeedDialog{max-width:640px;border-radius:14px;border:1px solid #c8b77f;padding:18px;font:13px system-ui,"Noto Sans Thai",sans-serif;background:#f7f2e2;color:#2a2418}#walkSpeedDialog .ws-row{display:grid;grid-template-columns:minmax(120px,1fr) 84px 36px 84px 28px;gap:8px;align-items:center;margin:4px 0}#walkSpeedDialog input{width:100%;padding:5px;border:1px solid #b8a870;border-radius:6px;background:#fffdf4}#walkSpeedDialog em{font-style:normal;opacity:.65;font-size:12px}#walkSpeedDialog button{font:inherit;padding:5px 10px;border-radius:7px;border:1px solid #8a6a2a;background:#e8c46a;cursor:pointer}#walkSpeedDialog p{color:#5a4d30}#walkSpeedDialog h3{margin:12px 0 4px}#walkSpeedDialog div[style*=flex]{display:flex!important}#walkSpeedDialog div[style*=flex] button{flex:0 0 auto}#walkSpeedDialog .ws-list{max-height:42vh;overflow:auto;padding-right:4px}</style>
      <h2>🚶 ความเร็วเดิน</h2><p>หน่วย <b>เมตร/วินาที</b> (1 ช่องพื้น ≈ 0.57 ม. · คนเดินปกติ ≈ 1.4 ม./วิ) · มีผลทันที · ปุ่ม ↺ = กลับค่าเดิมของเกม</p>
      <h3>ตัวเอก</h3>${row('hero:road', 'บนถนน / ทางทาสี', W().heroMs(true), W().HERO.road * W().M)}${row('hero:grass', 'บนพื้นหญ้า', W().heroMs(false), W().HERO.grass * W().M)}
      <h3>NPC ทุกคน</h3><label class="ws-row"><span>ความเร็วพื้นฐาน (ว่าง = ใช้ค่าเดิมของแต่ละคน)</span><input type="number" min="0.05" max="30" step="0.05" data-all value="${W().npcBase() == null ? '' : W().npcBase().toFixed(2)}" placeholder="เดิม"><small>ม./วิ</small><em></em><button type="button" data-reset="all">↺</button></label>
      <h3>NPC รายคน <small style="font-weight:400">(ตัวคูณของความเร็วพื้นฐาน)</small></h3><div class="ws-list">${roster.map(n => `<label class="ws-row"><span>${esc(n.name + (n.role ? ' · ' + n.role : ''))}</span><input type="number" min="0.1" max="5" step="0.05" data-mul="${esc(n.id)}" value="${W().npcMul(n.id).toFixed(2)}"><small>×</small><em data-ms="${esc(n.id)}">${W().npcMs(n).toFixed(2)} ม./วิ</em><button type="button" data-reset="mul:${esc(n.id)}" title="กลับเป็น ×1.00">↺</button></label>`).join('') || '<p>ยังไม่มี NPC</p>'}</div>
      <div style="display:flex;gap:8px;margin-top:14px;justify-content:flex-end;flex-wrap:wrap"><button type="button" id="wsAll">↺ คืนค่าเดิมทั้งหมด</button><button type="button" id="wsPush">⬆ Push</button><button type="button" id="wsClose">ปิด</button></div>`;
    const cells = (id, ms) => { const e = d.querySelector(`[data-cells="${id}"]`); if (e) e.textContent = (ms / W().M).toFixed(2) + ' ช่อง/วิ' };
    d.querySelectorAll('input[data-id]').forEach(i => i.oninput = () => {
      const id = i.dataset.id.split(':')[1], ms = parseFloat(i.value); if (!(ms > 0)) return;
      W().setHero(id === 'road', ms); cells(i.dataset.id, ms)
    });
    const refreshMs = () => roster.forEach(n => { const e = d.querySelector(`[data-ms="${n.id}"]`); if (e) e.textContent = W().npcMs(n).toFixed(2) + ' ม./วิ' });
    d.querySelector('input[data-all]').oninput = e => { W().setNpcBase(parseFloat(e.target.value)); refreshMs() };
    d.querySelectorAll('input[data-mul]').forEach(i => i.oninput = () => { const k = parseFloat(i.value); if (!(k > 0)) return; W().setNpcMul(i.dataset.mul, k); refreshMs() });
    d.querySelectorAll('[data-reset]').forEach(b => b.onclick = () => {
      const id = b.dataset.reset; if (id === 'all') W().setNpcBase(null); else { const [kind, k] = id.split(':'); if (kind === 'hero') W().setHero(k === 'road', null); else W().setNpcMul(k, 1) } open()
    });
    d.querySelector('#wsAll').onclick = () => { if (confirm('คืนความเร็วเดินทั้งหมดเป็นค่าเดิมของเกม?')) { W().reset(); open() } };
    d.querySelector('#wsClose').onclick = () => d.close();
    d.querySelector('#wsPush').onclick = async () => { if (!window.GitHubPush?.config().token) return GitHubPush?.openSettings(); try { const sha = await GitHubPush.pushSettings([W().KEY], 'ความเร็วเดิน'); alert(sha ? 'Push ความเร็วเดินแล้ว · ' + sha : 'ไม่มีอะไรต้อง Push') } catch (e) { alert('Push ไม่สำเร็จ: ' + e.message) } };
    if (!d.open) d.showModal();
  }
  window.WalkSpeedEditor = { open };
})();
