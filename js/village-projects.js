/* v97.35 · R3: village development — long-term gold sinks with lasting effects (docs/TODO.md R3).
   Each project is paid once (s.village.projects[id] = day built) and changes a rule somewhere else:
   road → fatigue on the world map ×0.8 · watch → ambush odds ×0.75, camp raids ×0.5 · herbs → healer cheaper (treatment −40 %, potions −3)
   · granary → travel food 3 💰 instead of 4 · drill → battle EXP +15 % · shrine → prayer heals +50 % instead of +30 %.
   VillageProjects.has(id) works on every page that loads js/world-state.js; open() (the board) runs in the game page (index.html),
   opened from the village menu (Esc → 🏗 พัฒนาหมู่บ้าน). Opens after the prologue. */
(function (root) {
  'use strict';
  const PROJECTS = {
    road: { name: 'ซ่อมถนนออกหมู่บ้าน', icon: '🛤', cost: 150, effect: 'เดินบนแผนที่โลกเหนื่อยน้อยลง 20%', who: 'ทอม' },
    granary: { name: 'ยุ้งฉางกลางหมู่บ้าน', icon: '🌾', cost: 120, effect: 'เสบียงในร้านค้าถูกลง (4 → 3 เหรียญ)', who: 'ป้าเมย์' },
    herbs: { name: 'สวนสมุนไพรของหมอยา', icon: '🌿', cost: 180, effect: 'ค่ารักษาที่หมอยา −40% · ยาถูกลง 3 เหรียญ', who: 'ซาฟ' },
    watch: { name: 'หอเฝ้ายามรั้วตะวันออก', icon: '🗼', cost: 250, effect: 'ถูกซุ่มโจมตีน้อยลง 25% · ค่ายถูกบุกน้อยลงครึ่งหนึ่ง', who: 'ยามดอร์ก' },
    drill: { name: 'ลานฝึกหลังโรงแรม', icon: '🎯', cost: 300, effect: 'EXP จากการต่อสู้ +15%', who: 'ซิกริด' },
    shrine: { name: 'บูรณะวิหารธาตุ', icon: '⛩', cost: 350, effect: 'ภาวนาที่วิหารฟื้น HP +50% (จาก 30%)', who: 'ซิสเตอร์ออร์ลา' }
  };
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const game = () => (typeof s !== 'undefined' && s?.village ? s : root.WorldState?.game?.()) || null;
  const has = id => { try { return !!game()?.village?.projects?.[id] } catch (e) { return false } };
  const why = g => g?.village?.story?.mode === 'active' ? 'เปิดหลังจบบทนำ' : '';
  function build(id) {
    const g = game(), P = PROJECTS[id]; if (!g || !P || has(id) || why(g) || (g.village.coins || 0) < P.cost) return false;
    g.village.coins -= P.cost; (g.village.projects ||= {})[id] = g.day || 1;
    try { save() } catch (e) { root.WorldState?.commit?.() }
    try { root.Mind?.emit?.('want:done', { who: 'may', result: P.name }) } catch (e) { }
    try { root.Factions?.add('village', 10, 'ลงขัน' + P.name) } catch (e) { }
    return true;
  }
  function css() {
    if (document.getElementById('vpCss')) return; const st = document.createElement('style'); st.id = 'vpCss';
    st.textContent = `#vpUI{position:fixed;inset:0;z-index:2050;display:grid;place-items:center;background:#05080dcc;backdrop-filter:blur(3px);font-family:VillageThai,"Noto Sans Thai",system-ui,sans-serif}
    #vpUI .box{width:min(860px,96vw);max-height:92vh;overflow:auto;padding:18px 20px;border-radius:16px;background:linear-gradient(#f3e6c6,#e2cfa2);color:#3a2a14;box-shadow:0 24px 60px #000c}
    #vpUI h2{margin:0 0 4px;font:800 24px Georgia,"Noto Sans Thai",serif;color:#5a3a10}#vpUI .sub{margin:0 0 14px;color:#6a5030;font-size:13.5px}
    #vpUI .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}
    #vpUI .p{display:flex;flex-direction:column;gap:6px;padding:12px;border-radius:12px;background:#fff8;border:2px solid #b08a4a55}#vpUI .p.done{border-color:#5a9a4a;background:#eef6e0cc}
    #vpUI .p b{font-size:16px}#vpUI .p small{color:#7a6040;font-size:12.5px}#vpUI .p .ef{font-size:13px;line-height:1.5}
    #vpUI button{padding:8px 12px;border-radius:9px;border:1px solid #7a4b06;background:linear-gradient(#f0c560,#c9902e);color:#2a1a06;font:700 13.5px inherit;font-family:inherit;cursor:pointer}
    #vpUI button:disabled{opacity:.55;cursor:default;background:#d8c8a0}#vpUI .x{float:right;background:none;border:none;font-size:20px;padding:0 4px}`;
    document.head.append(st);
  }
  function open() {
    const g = game(); if (!g) return; css(); document.getElementById('vpUI')?.remove();
    const lock = why(g), gold = g.village.coins || 0, d = document.createElement('div'); d.id = 'vpUI';
    const card = ([id, P]) => { const done = has(id); return `<div class="p ${done ? 'done' : ''}"><b>${P.icon} ${esc(P.name)}</b><small>ผู้ดูแล: ${esc(P.who)}${done ? ' · ✓ สร้างแล้ว (วันที่ ' + g.village.projects[id] + ')' : ''}</small><div class="ef">${esc(P.effect)}</div>
      ${done ? '' : `<button data-p="${id}" ${lock || gold < P.cost ? 'disabled' : ''}>${lock ? '🔒 ' + lock : 'ลงขัน ' + P.cost + ' 💰'}</button>`}</div>` };
    d.innerHTML = `<div class="box"><button class="x" title="ปิด (Esc)">✕</button><h2>🏗 พัฒนาหมู่บ้าน</h2><p class="sub">ลงขันสร้างของให้หมู่บ้าน ได้ผลถาวร · มีเงิน ${gold} 💰</p><div class="grid">${Object.entries(PROJECTS).map(card).join('')}</div></div>`;
    document.body.append(d);
    const close = () => { removeEventListener('keydown', key, true); d.remove() }, key = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close() } };
    addEventListener('keydown', key, true);
    d.onclick = e => { if (e.target === d || e.target.closest('.x')) return close(); const b = e.target.closest('[data-p]'); if (!b || b.disabled) return;
      if (build(b.dataset.p)) { root.StoryToast?.('🏗 ' + PROJECTS[b.dataset.p].name + ' สร้างเสร็จ! ' + PROJECTS[b.dataset.p].effect, 'quest'); try { render() } catch (er) { } open() } };
    d.querySelector('button:not(:disabled)')?.focus();
  }
  root.VillageProjects = { PROJECTS, has, build, open };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.VillageProjects;
})(typeof window !== 'undefined' ? window : globalThis);
