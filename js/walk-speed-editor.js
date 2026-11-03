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
    d.innerHTML = `<style>#walkSpeedDialog{max-width:640px;border-radius:14px;border:1px solid #c8b77f;padding:18px;font:13px system-ui,"Noto Sans Thai",sans-serif;background:#f7f2e2;color:#2a2418}#walkSpeedDialog .ws-row{display:grid;grid-template-columns:minmax(120px,1fr) 84px 36px 84px 28px;gap:8px;align-items:center;margin:4px 0}#walkSpeedDialog input{width:100%;padding:5px;border:1px solid #b8a870;border-radius:6px;background:#fffdf4}#walkSpeedDialog em{font-style:normal;opacity:.65;font-size:12px}#walkSpeedDialog button{font:inherit;padding:5px 10px;border-radius:7px;border:1px solid #8a6a2a;background:#e8c46a;cursor:pointer}#walkSpeedDialog p{color:#5a4d30}#walkSpeedDialog h3{margin:12px 0 4px}#walkSpeedDialog div[style*=flex]{display:flex!important}#walkSpeedDialog div[style*=flex] button{flex:0 0 auto}#walkSpeedDialog .ws-dir{display:flex;gap:14px;align-items:center;flex-wrap:wrap;margin:6px 0}#walkSpeedDialog .ws-dirgrid{display:grid;grid-template-columns:repeat(4,auto);gap:6px 12px}#walkSpeedDialog .ws-dirgrid select{padding:3px}#walkSpeedDialog .ws-list{max-height:42vh;overflow:auto;padding-right:4px}</style>
      <h2>🚶 ความเร็วเดิน</h2><p>หน่วย <b>เมตร/วินาที</b> (1 ช่องพื้น ≈ 0.57 ม. · คนเดินปกติ ≈ 1.4 ม./วิ) · มีผลทันที · ปุ่ม ↺ = กลับค่าเดิมของเกม</p>
      <h3>ตัวเอก</h3>${row('hero:road', 'บนถนน / ทางทาสี', W().heroMs(true), W().HERO.road * W().M)}${row('hero:grass', 'บนพื้นหญ้า', W().heroMs(false), W().HERO.grass * W().M)}
      <h3>NPC ทุกคน</h3><label class="ws-row"><span>ความเร็วพื้นฐาน (ว่าง = ใช้ค่าเดิมของแต่ละคน)</span><input type="number" min="0.05" max="30" step="0.05" data-all value="${W().npcBase() == null ? '' : W().npcBase().toFixed(2)}" placeholder="เดิม"><small>ม./วิ</small><em></em><button type="button" data-reset="all">↺</button></label>
      <h3>NPC รายคน <small style="font-weight:400">(ตัวคูณของความเร็วพื้นฐาน)</small></h3><div class="ws-list">${roster.map(n => `<label class="ws-row"><span>${esc(n.name + (n.role ? ' · ' + n.role : ''))}</span><input type="number" min="0.1" max="5" step="0.05" data-mul="${esc(n.id)}" value="${W().npcMul(n.id).toFixed(2)}"><small>×</small><em data-ms="${esc(n.id)}">${W().npcMs(n).toFixed(2)} ม./วิ</em><button type="button" data-reset="mul:${esc(n.id)}" title="กลับเป็น ×1.00">↺</button></label>`).join('') || '<p>ยังไม่มี NPC</p>'}</div>
      <h3>ทิศการเดิน → อนิเมชันที่ใช้</h3><p>มีอนิเมชันเดิน 4 ชุด (NE SE SW NW) · เดินตรงทิศ N S E W เลือกว่าจะใช้ชุดไหน · ถ้าเดินเฉียงไม่ตรง 45° ใช้ "ช่วงทิศตรง" ตัดสิน</p>
      <div class="ws-dir"><canvas id="wsCompass" width="150" height="150" style="flex:none;width:150px;height:150px;max-width:150px"></canvas><div class="ws-dirgrid">${W().dir.ORDER.map(k => `<label>${k}<select data-dir="${k}">${['NE', 'SE', 'SW', 'NW'].map(v => `<option${W().dir.config().map[k] === v ? ' selected' : ''}>${v}</option>`).join('')}</select></label>`).join('')}</div></div>
      <label class="ws-row"><span>ช่วงทิศตรง N S E W (± องศา) · 22.5 = แบ่ง 8 ส่วนเท่ากัน · 0 = แบ่ง 4 ส่วน</span><input type="number" min="0" max="45" step="0.5" data-card value="${W().dir.config().card}"><small>°</small><em></em><button type="button" data-reset="card">↺</button></label>
      <label class="ws-row"><span>กันภาพสลับรัวตรงรอยต่อ (hysteresis ± องศา)</span><input type="number" min="0" max="20" step="0.5" data-hys value="${W().dir.config().hys}"><small>°</small><em></em><button type="button" data-reset="hys">↺</button></label>
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
      const id = b.dataset.reset; if (id === 'card' || id === 'hys') { W().dir.set({ [id]: W().dir.DEF[id] }); return open() } if (id === 'all') W().setNpcBase(null); else { const [kind, k] = id.split(':'); if (kind === 'hero') W().setHero(k === 'road', null); else W().setNpcMul(k, 1) } open()
    });
    /* compass: the screen is split into the sectors that really apply (colour = animation used) */
    const COL = { NE: '#5fa8d3', SE: '#e8b64a', SW: '#7bc47f', NW: '#c77dba' }, drawCompass = () => {
      const c = d.querySelector('#wsCompass'), g = c.getContext('2d'), cfg = W().dir.config(); g.clearRect(0, 0, 150, 150);
      for (let deg = 0; deg < 360; deg += 1) { const a = deg * Math.PI / 180, x = Math.cos(a), y = Math.sin(a), du = (x / 28 + y / 28) / 2, dv = (y / 28 - x / 28) / 2, r = W().dir.raw8(du, dv, null); g.beginPath(); g.moveTo(75, 75); g.arc(75, 75, 68, a - 0.5 * Math.PI / 180 - 0.01, a + 0.5 * Math.PI / 180 + 0.01); g.closePath(); g.fillStyle = COL[cfg.map[r]]; g.fill() }
      g.fillStyle = '#000a'; g.font = 'bold 10px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (const k of W().dir.ORDER) { const a = W().dir.ANG[k] * Math.PI / 180; g.fillText(k, 75 + Math.cos(a) * 58, 75 + Math.sin(a) * 58) }
      g.strokeStyle = '#0006'; g.beginPath(); g.arc(75, 75, 68, 0, 7); g.stroke()
    };
    drawCompass();
    d.querySelectorAll('select[data-dir]').forEach(s => s.onchange = () => { W().dir.set({ map: { [s.dataset.dir]: s.value } }); drawCompass() });
    d.querySelector('input[data-card]').oninput = e => { const v = parseFloat(e.target.value); if (v >= 0) { W().dir.set({ card: v }); drawCompass() } };
    d.querySelector('input[data-hys]').oninput = e => { const v = parseFloat(e.target.value); if (v >= 0) W().dir.set({ hys: v }) };
    d.querySelector('#wsAll').onclick = () => { if (confirm('คืนความเร็วเดินและทิศเดินทั้งหมดเป็นค่าเดิม?')) { W().reset(); open() } };
    d.querySelector('#wsClose').onclick = () => d.close();
    d.querySelector('#wsPush').onclick = async () => { if (!window.GitHubPush?.config().token) return GitHubPush?.openSettings(); try { const sha = await GitHubPush.pushSettings([W().KEY], 'ความเร็วเดิน'); alert(sha ? 'Push ความเร็วเดินแล้ว · ' + sha : 'ไม่มีอะไรต้อง Push') } catch (e) { alert('Push ไม่สำเร็จ: ' + e.message) } };
    if (!d.open) d.showModal();
  }
  window.WalkSpeedEditor = { open };
})();
