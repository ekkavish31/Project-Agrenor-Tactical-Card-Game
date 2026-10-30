/* v97.41 · T2 phase 1: reputation with the factions around Fernvale (docs/TODO.md "T ที่อยู่ เมือง แฟคชั่น และการปกครอง").
   Each faction keeps a standing −100…100 in the save (s.village.rep[id]) with a short log of why it moved.
   Raised by: guild contracts (guild, village) · village projects (village) · order-board deliveries (merchants) · offerings and prayer (temple)
   · beating bandits near home (village). Effects so far: merchants' and the healer's prices, guild contract pay.
   The story's own factions (U6) are still pending — these are the local, neutral ones.
   Factions.add(id, delta, why) works on every page that loads js/world-state.js; open() (the panel) runs in the game page. */
(function (root) {
  'use strict';
  const FACTIONS = {
    village: { name: 'หมู่บ้านเฟิร์นเวล', icon: '🏡', col: '#5a9a4a', perk: 'หมอยารักษาถูกลง' },
    guild: { name: 'สมาคมนักผจญภัย', icon: '⚔', col: '#b0502e', perk: 'ค่าจ้างงานกิลด์สูงขึ้น' },
    merchants: { name: 'พ่อค้าแห่งหุบเขา', icon: '⚖', col: '#c9902e', perk: 'ของในร้านค้าและตลาดถูกลง' },
    temple: { name: 'วิหารธาตุ', icon: '⛩', col: '#7a6ac8', perk: 'ถวายได้น้ำมนต์มากขึ้น' }
  };
  const TIERS = [[-100, 'ศัตรู', '#a03a2a'], [-40, 'ไม่ไว้ใจ', '#c0702a'], [-10, 'กลาง ๆ', '#8a8a7a'], [20, 'เป็นมิตร', '#5a9a4a'], [50, 'นับถือ', '#3a8aa8'], [80, 'ยกย่อง', '#c9a02e']];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const game = () => (typeof s !== 'undefined' && s?.village ? s : root.WorldState?.game?.()) || null;
  const store = () => { const g = game(); if (!g?.village) return null; g.village.rep ||= {}; g.village.repLog ||= []; return g.village };
  const rep = id => store()?.rep[id] || 0;
  const tierIdx = n => TIERS.reduce((k, t, i) => n >= t[0] ? i : k, 0);
  const tier = id => TIERS[tierIdx(rep(id))];
  /* steps above "กลาง ๆ" (0 … 3) — what the perks scale with */
  const rank = id => Math.max(0, tierIdx(rep(id)) - 2);
  function add(id, d, why) {
    const V = store(); if (!V || !FACTIONS[id] || !d) return 0;
    const before = tierIdx(V.rep[id] || 0); V.rep[id] = Math.max(-100, Math.min(100, Math.round(((V.rep[id] || 0) + d) * 10) / 10));
    V.repLog.unshift({ id, d, why: why || '', day: game()?.day || 1 }); V.repLog.length = Math.min(V.repLog.length, 12);
    try { if (typeof save === 'function' && typeof s !== 'undefined') save(); else root.WorldState?.commit?.() } catch (e) { }
    const after = tierIdx(V.rep[id]); if (after !== before) try { (root.StoryToast || root.parent?.StoryToast)?.(`${FACTIONS[id].icon} ${FACTIONS[id].name}: ${TIERS[after][1]}`, 'quest') } catch (e) { }
    return V.rep[id];
  }
  /* perks */
  const priceMult = id => 1 - .05 * rank(id);          // −5 % a step (merchants: shop and market · village: healer)
  const payMult = id => 1 + .1 * rank(id);             // +10 % a step (guild contracts)
  function css() {
    if (document.getElementById('fcCss')) return; const st = document.createElement('style'); st.id = 'fcCss';
    st.textContent = `#fcUI{position:fixed;inset:0;z-index:2050;display:grid;place-items:center;background:#05080dcc;backdrop-filter:blur(3px);font-family:VillageThai,"Noto Sans Thai",system-ui,sans-serif}
    #fcUI .box{width:min(720px,96vw);max-height:92vh;overflow:auto;padding:18px 20px;border-radius:16px;background:linear-gradient(#f3e6c6,#e2cfa2);color:#3a2a14;box-shadow:0 24px 60px #000c}
    #fcUI h2{margin:0 0 4px;font:800 24px Georgia,"Noto Sans Thai",serif;color:#5a3a10}#fcUI .sub{margin:0 0 12px;color:#6a5030;font-size:13.5px}
    #fcUI .f{display:grid;grid-template-columns:40px 1fr 90px;gap:10px;align-items:center;padding:10px;border-radius:12px;background:#fff8;border:2px solid #b08a4a44;margin-bottom:8px}
    #fcUI .ic{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;font-size:20px;color:#fff;border:2px solid #1a140c}
    #fcUI .bar{height:10px;border-radius:6px;background:#0002;position:relative;overflow:hidden;margin-top:4px}#fcUI .bar i{position:absolute;top:0;bottom:0}#fcUI .bar b{position:absolute;left:50%;top:0;bottom:0;width:2px;background:#0005}
    #fcUI .t{font-weight:800;text-align:right}#fcUI small{color:#7a6040}#fcUI .log{font-size:12.5px;color:#5a4426;line-height:1.7;margin-top:10px}
    #fcUI .x{float:right;background:none;border:none;font-size:20px;cursor:pointer}`;
    document.head.append(st);
  }
  function open() {
    const V = store(); if (!V) return; css(); document.getElementById('fcUI')?.remove();
    const d = document.createElement('div'); d.id = 'fcUI';
    const row = ([id, F]) => { const n = rep(id), T = tier(id), w = Math.abs(n) / 2, left = n >= 0 ? 50 : 50 - w;
      return `<div class="f"><span class="ic" style="background:${F.col}">${F.icon}</span><div><b>${esc(F.name)}</b> <small>${n > 0 ? '+' : ''}${n}</small><div class="bar"><b></b><i style="left:${left}%;width:${w}%;background:${T[2]}"></i></div><small>${rank(id) ? '✦ ' + esc(F.perk) + ' (ขั้น ' + rank(id) + ')' : 'ถึงขั้น "เป็นมิตร" แล้วจะได้: ' + esc(F.perk)}</small></div><span class="t" style="color:${T[2]}">${T[1]}</span></div>` };
    d.innerHTML = `<div class="box"><button class="x" title="ปิด (Esc)">✕</button><h2>🏛 ชื่อเสียง</h2><p class="sub">ทำงานกิลด์ ส่งออร์เดอร์ สร้างหมู่บ้าน ถวายวิหาร และปราบโจร ชื่อเสียงจะเพิ่มขึ้น · ทุกขั้นได้ส่วนลดหรือค่าจ้างเพิ่ม</p>
      ${Object.entries(FACTIONS).map(row).join('')}
      <div class="log"><b>ล่าสุด</b><br>${V.repLog.length ? V.repLog.map(l => `วันที่ ${l.day} · ${FACTIONS[l.id]?.icon || ''} ${esc(FACTIONS[l.id]?.name || l.id)} ${l.d > 0 ? '+' : ''}${l.d} · ${esc(l.why)}`).join('<br>') : 'ยังไม่มี'}</div></div>`;
    document.body.append(d);
    const close = () => { removeEventListener('keydown', key, true); d.remove() }, key = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close() } };
    addEventListener('keydown', key, true); d.onclick = e => { if (e.target === d || e.target.closest('.x')) close() };
  }
  root.Factions = { FACTIONS, TIERS, rep, tier, rank, add, priceMult, payMult, open };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Factions;
})(typeof window !== 'undefined' ? window : globalThis);
