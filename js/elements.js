/* v94.02 · The 9 Kaelam elements of Agrenor + 2 secret elements. Matchups follow what each element does to the other (not a simple cycle):
     attack ×1.3 when the attack's element is STRONG against the target's element · ×0.7 when the target's element is strong against it · else ×1.0
   Game ids stay the keys (cards, weapons, terrain, monsters keep working):
     light = Elu · wind = Sylfae · water = Dephor · lightning = Caelim · fire = Fren · nature = Lutha · ice = Yalm · dark = Nytha · earth = Grat
   Secret elements: no. 10 chaos (โกลาหล) ×1.2 against every wheel element · no. 11 fusion (ผสาน) ×1.1 against every wheel element and takes ×0.9
   from them. Their names show as "???" until the player has seen them (reveal(id)).
   ElementWheel.showChart() opens the element chart (used by the battle HUD and the village toolbar). */
(function (root) {
  'use strict';
  const WHEEL = ['light', 'wind', 'water', 'lightning', 'fire', 'nature', 'ice', 'dark', 'earth'];
  const KAELAM = {
    light: { k: 'Elu', th: 'แสง', col: '#f6e08a', icon: '☀' }, wind: { k: 'Sylfae', th: 'ลม', col: '#a8e6c8', icon: '🌀' }, water: { k: 'Dephor', th: 'น้ำ', col: '#6fb2ec', icon: '💧' },
    lightning: { k: 'Caelim', th: 'สายฟ้า', col: '#c9a8ff', icon: '⚡' }, fire: { k: 'Fren', th: 'ไฟ', col: '#ff8a5a', icon: '🔥' }, nature: { k: 'Lutha', th: 'พฤกษา', col: '#8fd06a', icon: '🌿' },
    ice: { k: 'Yalm', th: 'น้ำแข็ง', col: '#bfe8ff', icon: '❄' }, dark: { k: 'Nytha', th: 'ราตรี', col: '#a88ad8', icon: '🌑' }, earth: { k: 'Grat', th: 'ผืนดิน', col: '#c9a46a', icon: '⛰' }
  };
  /* strong against (with the reason, shown in the chart and the tips) */
  const STRONG = {
    fire: { nature: 'เผาพืชพรรณ', ice: 'หลอมน้ำแข็ง' },
    water: { fire: 'ดับไฟ', earth: 'กัดเซาะผืนดิน' },
    earth: { lightning: 'ดูดซับสายฟ้าลงดิน', fire: 'กลบไฟให้มอด' },
    lightning: { water: 'ไฟฟ้าวิ่งผ่านน้ำ', wind: 'ฉีกกระแสลม' },
    nature: { water: 'รากดูดซับน้ำ', earth: 'รากชอนไชแผ่นดิน' },
    wind: { nature: 'พัดพืชให้ล้ม', lightning: 'กระจายเมฆพายุ' },
    ice: { wind: 'ทำให้ลมนิ่งเย็นจัด', water: 'แช่แข็งน้ำ' },
    light: { dark: 'แสงขับไล่ความมืด', ice: 'แดดละลายน้ำแข็ง' },
    dark: { light: 'ความมืดกลืนแสง', nature: 'ราตรีทำให้พืชเหี่ยว' }
  };
  const SECRET = { chaos: { k: '???', th: 'โกลาหล', no: 10, col: '#ff6a9a', icon: '✷', secret: true, hit: 1.2, take: 1 }, fusion: { k: '???', th: 'ผสาน', no: 11, col: '#f0f0ff', icon: '✦', secret: true, hit: 1.1, take: .9 } };
  const BEAT = 1.3, LOSE = 0.7;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let seen = {}; try { seen = JSON.parse(localStorage.getItem('agrenor-secret-elements') || '{}') } catch (e) { }
  function reveal(id) { if (!SECRET[id] || seen[id]) return; seen[id] = 1; try { localStorage.setItem('agrenor-secret-elements', JSON.stringify(seen)) } catch (e) { } }
  const strong = (a, t) => !!STRONG[a]?.[t];
  /* damage multiplier of an attack of element `a` on a target of element `t` */
  function mult(a, t) {
    if (!a || !t) return 1;
    if (SECRET[a]) return WHEEL.includes(t) ? SECRET[a].hit : 1;
    if (SECRET[t]) return WHEEL.includes(a) ? SECRET[t].take : 1;
    if (strong(a, t)) return BEAT; if (strong(t, a)) return LOSE; return 1;
  }
  const percent = (a, t) => Math.round((mult(a, t) - 1) * 100);   // for the old battle (TacticsCore.affinity): +30 / −30 / 0
  function info(id) { return KAELAM[id] || SECRET[id] || null }
  function name(id, short) { const E = info(id); if (!E) return id || ''; if (E.secret) return seen[id] ? 'ธาตุลับที่ ' + E.no + '·' + E.th : 'ธาตุลับที่ ' + E.no + ' ???'; return short ? E.k : E.k + ' (' + E.th + ')' }
  /* a short battle note: "Fren ชนะ Lutha ×1.3" / "Fren แพ้ Dephor ×0.7" or '' when neutral */
  function note(a, t) { const m = mult(a, t); if (m === 1) return ''; return name(a, true) + (m > 1 ? ' ชนะ ' : ' แพ้ ') + name(t, true) + ' ×' + m }
  /* tip for the card about to be played: {cls:'adv'|'dis'|'', text} */
  function tip(a, t) {
    if (!a) return { cls: '', text: '' };
    const m = mult(a, t), E = info(a); if (!t || m === 1) return { cls: '', text: (E?.icon || '') + ' ' + name(a, true) + ' · ปกติ' };
    const why = strong(a, t) ? STRONG[a][t] : strong(t, a) ? STRONG[t][a] : 'ธาตุลับ';
    return { cls: m > 1 ? 'adv' : 'dis', text: (m > 1 ? '▲ ได้เปรียบ ' : '▼ เสียเปรียบ ') + name(a, true) + ' → ' + name(t, true) + ' ×' + m + ' (' + why + ')' };
  }
  const beats = e => Object.keys(STRONG[e] || {}), weakTo = e => WHEEL.filter(o => strong(o, e));
  /* ---------- the chart ---------- */
  function chartHTML() {
    const cell = id => { const E = KAELAM[id]; return `<span class="ew-el" style="--c:${E.col}">${E.icon} <b>${E.k}</b> <small>${E.th}</small></span>` };
    const rows = WHEEL.map(id => `<tr><td>${cell(id)}</td><td>${beats(id).map(o => `${cell(o)}<i>${esc(STRONG[id][o])}</i>`).join('')}</td><td>${weakTo(id).map(cell).join('')}</td></tr>`).join('');
    const sec = Object.entries(SECRET).map(([id, E]) => `<tr><td><span class="ew-el" style="--c:${E.col}">${E.icon} <b>${seen[id] ? E.th : '???'}</b> <small>ธาตุลับที่ ${E.no}</small></span></td><td colspan="2">${seen[id] ? (id === 'chaos' ? 'แรงขึ้น ×1.2 กับทุกธาตุ' : 'แรงขึ้น ×1.1 กับทุกธาตุ และรับความเสียหายจากทุกธาตุ ×0.9') : 'ยังไม่ค้นพบ'}</td></tr>`).join('');
    return `<h2>ตารางธาตุ Kaelam</h2><p class="ew-sub">โจมตีด้วยธาตุที่ <b>ชนะทาง</b> แรงขึ้น ×1.3 · ตีธาตุที่ <b>แพ้ทาง</b> เหลือ ×0.7 · ธาตุของการ์ดดูได้ตอนเลือกการ์ด · ธาตุของศัตรูอยู่ข้างชื่อ</p>
      <table class="ew-t"><thead><tr><th>ธาตุ</th><th>ชนะทาง (×1.3)</th><th>แพ้ทาง (×0.7)</th></tr></thead><tbody>${rows}${sec}</tbody></table>`;
  }
  function css(doc) {
    if (doc.getElementById('ewCss')) return; const st = doc.createElement('style'); st.id = 'ewCss';
    st.textContent = `.ew-bg{position:fixed;inset:0;z-index:2000;background:#000b;display:flex;align-items:center;justify-content:center;font:14px VillageThai,system-ui,sans-serif}
      .ew-box{max-width:min(760px,96vw);max-height:92vh;overflow:auto;background:#1b1510f5;color:#f3e9c9;border:1px solid #c9a86a88;border-radius:14px;padding:16px 18px;box-shadow:0 12px 40px #000c}
      .ew-box h2{margin:0 0 4px;color:#ffe2a8;font-size:20px}.ew-sub{margin:0 0 10px;font-size:12px;color:#cdbb92}.ew-t{width:100%;border-collapse:collapse}.ew-t th{font-size:12px;color:#bba57f;text-align:left;padding:4px}
      .ew-t td{padding:5px 4px;border-top:1px solid #ffffff14;vertical-align:top}.ew-el{display:inline-block;margin:2px 6px 2px 0;padding:2px 8px;border-radius:999px;background:color-mix(in srgb,var(--c) 22%,transparent);border:1px solid var(--c);white-space:nowrap}
      .ew-el small{opacity:.75}.ew-t i{display:block;font-size:11px;color:#a8977a;margin:0 0 4px 4px;font-style:normal}.ew-close{margin-top:10px;float:right;padding:10px 20px;border-radius:9px;border:1px solid #c9a86a;background:#3a2c1c;color:#ffe2a8;font:inherit;cursor:pointer}`;
    doc.head.append(st);
  }
  function showChart(doc = document) {
    css(doc); doc.querySelector('.ew-bg')?.remove();
    const bg = doc.createElement('div'); bg.className = 'ew-bg'; bg.innerHTML = `<div class="ew-box">${chartHTML()}<button class="ew-close" type="button">ปิด</button></div>`;
    bg.onclick = e => { if (e.target === bg || e.target.classList.contains('ew-close')) bg.remove() };
    doc.body.append(bg);
  }
  const api = { WHEEL, KAELAM, SECRET, STRONG, BEAT, LOSE, mult, percent, info, name, note, tip, beats, weakTo, reveal, chartHTML, showChart, isSecret: id => !!SECRET[id] };
  root.ElementWheel = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
