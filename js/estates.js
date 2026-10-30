/* v97.49 · T4 land and buildings + T5 raids, phase 1 (docs/TODO.md "T ที่อยู่ เมือง แฟคชั่น และการปกครอง").
   A plot is either inside a town (rented by the week at the town's land price — js/settlements.js) or claimed for free on open land
   on the world map. On a plot you build one thing:
     🏠 house  — sleep there free (HP and fatigue back, like an inn)
     🏪 branch shop — sells on its own every day (more in bigger towns, little out in the wild); takings pile up to 7 days
     🌾 farm   — food every day, piles up to 14
   Town plots: rent runs out after the paid weeks; two weeks unpaid and the town takes the plot back (standing with its ruler −5).
   Open land: no rent, but beasts and bandits raid it — each day 12 % (fence: −40 % per level, two levels). A raid takes what was stored
   and damages the building; at 0 it is ruined. Arriving while raiders are there starts a defend battle (the world map runs it).
   v97.77 · a farm can only go where there is farmland: a village that has some (Settlements.SETTLEMENTS[id].farmland) or open land.
   It keeps vegetable plots (js/garden.js, plot.garden) tended from this panel; raiders on open land trample half the crops.
   Everything lives in the world save: S.estates = [{ id, at, name, kind, hp, fence, paidTo, last, gold, food, day0 }]. */
(function (root) {
  'use strict';
  const KINDS = {
    house: { name: 'บ้านพัก', icon: '🏠', cost: 120, desc: 'นอนพักฟรี · HP และความเหนื่อยหายหมด' },
    shop: { name: 'ร้านสาขา', icon: '🏪', cost: 200, desc: 'ขายของเองทุกวัน · เก็บเงินได้สูงสุด 7 วัน' },
    farm: { name: 'ไร่และคอกสัตว์', icon: '🌾', cost: 150, desc: 'ได้เสบียงทุกวัน · เก็บได้สูงสุด 14 ห่อ' }
  };
  const MAX_PLOTS = 4, RAID = .12, FENCE_COST = [60, 120], GUARD = { cost: 40, days: 7 }, SHOP_DAY = { village: 6, town: 10, city: 16, wild: 3 };
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const townOf = at => at.startsWith('town:') ? at.slice(5) : null;
  const T = id => root.Settlements?.SETTLEMENTS?.[id];
  const list = S => (S.estates ||= []);
  const at = (S, where) => list(S).filter(p => p.at === where);
  const rentOf = p => { const t = T(townOf(p.at)); return t ? t.land : 0 };
  const sizeOf = p => townOf(p.at) ? (T(townOf(p.at))?.size || 'village') : 'wild';
  const rng = seed => { let h = seed >>> 0; return () => (h = Math.imul(h ^ (h >>> 15), 2246822507) + 0x9e3779b9 >>> 0) / 4294967296 };
  /* claim open land / rent in a town */
  function claim(S, where, name) {
    if (list(S).length >= MAX_PLOTS) return { ok: false, why: 'มีที่ดินครบ ' + MAX_PLOTS + ' แปลงแล้ว' };
    if (!townOf(where) && at(S, where).length) return { ok: false, why: 'ตรงนี้มีที่ดินของคุณอยู่แล้ว' };
    const town = townOf(where), rent = town ? T(town)?.land || 0 : 0;
    if (town && (S.gold || 0) < rent) return { ok: false, why: 'ต้องจ่ายค่าเช่าสัปดาห์แรก ' + rent + ' 💰' };
    if (town) S.gold -= rent;
    const p = { id: 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + list(S).length, at: where, name: name || (town ? T(town)?.name : 'ที่ดินกลางป่า'), kind: null, hp: 100, fence: 0, paidTo: (S.day || 1) + (town ? 7 : 0), last: S.day || 1, gold: 0, food: 0, day0: S.day || 1 };
    list(S).push(p); return { ok: true, plot: p };
  }
  /* v97.77 · farmland: open land always · in a town only where the settlement has fields */
  const farmWhy = at => { const t = townOf(at); return !t || T(t)?.farmland ? '' : (T(t)?.name || 'ที่นี่') + 'ไม่มีที่ให้ทำไร่ · ลองหมู่บ้านที่มีทุ่งนา หรือที่ดินนอกเมือง' };
  function build(S, id, kind) {
    const p = list(S).find(x => x.id === id), K = KINDS[kind]; if (!p || !K || p.kind) return { ok: false, why: 'สร้างไม่ได้' };
    if (kind === 'farm' && farmWhy(p.at)) return { ok: false, why: farmWhy(p.at) };
    if ((S.gold || 0) < K.cost) return { ok: false, why: 'ต้องใช้ ' + K.cost + ' 💰' };
    S.gold -= K.cost; p.kind = kind; p.hp = 100; p.last = S.day || 1; return { ok: true };
  }
  function payRent(S, id) { const p = list(S).find(x => x.id === id), r = p && rentOf(p); if (!r || (S.gold || 0) < r) return false; S.gold -= r; p.paidTo = Math.max(p.paidTo, S.day || 1) + 7; return true }
  function fence(S, id) { const p = list(S).find(x => x.id === id); if (!p || townOf(p.at) || p.fence >= 2) return false; const c = FENCE_COST[p.fence]; if ((S.gold || 0) < c) return false; S.gold -= c; p.fence++; return true }
  function hireGuard(S, id) { const p = list(S).find(x => x.id === id); if (!p || townOf(p.at) || (S.gold || 0) < GUARD.cost) return false; S.gold -= GUARD.cost; p.guardTo = Math.max(p.guardTo || 0, S.day || 1) + GUARD.days; return true }
  function abandon(S, id) { S.estates = list(S).filter(x => x.id !== id) }
  /* bring a plot up to today: production, rent, raids — returns what happened (strings) */
  function tick(S, p) {
    const today = S.day || 1, out = [];
    if (p.last >= today) return out;
    const days = today - p.last, r = rng([...p.id].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261) ^ (p.last * 104729))   /* each plot rolls its own days */, F = root.Factions;
    for (let d = 0; d < days; d++) {
      if (p.kind === 'shop') p.gold = Math.min(SHOP_DAY[sizeOf(p)] * 7, p.gold + SHOP_DAY[sizeOf(p)]);
      if (p.kind === 'farm') p.food = Math.min(14, p.food + 2);
      const guarded = (p.guardTo || 0) >= p.last + d + 1;   /* v97.57 · a hired guard keeps most raiders away */
      if (!townOf(p.at) && p.kind && r() < RAID * (1 - .4 * p.fence) * (guarded ? .35 : 1)) {
        const lost = [p.gold ? p.gold + '💰' : '', p.food ? p.food + ' เสบียง' : ''].filter(Boolean).join(' และ ');
        p.gold = 0; p.food = 0; p.hp = Math.max(0, p.hp - 35);
        const trod = p.garden && root.Garden ? root.Garden.trample(p.garden, r) : 0;   /* v97.77 */
        const gone = p.garden && root.Garden ? root.Garden.steal(p.garden, r) : null;   /* v97.81 · and maybe an animal */
        out.push(`⚠ ${KINDS[p.kind]?.name || 'ที่ดิน'}ที่${p.name}ถูกบุก${lost ? ' เสีย ' + lost : ''}${trod ? ' · ผักถูกเหยียบเสียหาย ' + trod + ' แปลง' : ''}${gone ? ' · ' + gone.name + 'ถูกต้อนหายไป' : ''} (สภาพ ${p.hp}%)`);
        if (!p.hp) { out.push(`💥 ${KINDS[p.kind].name}ที่${p.name}พังเสียหายทั้งหลัง`); p.kind = null; p.hp = 100 }
      }
    }
    p.last = today;
    const town = townOf(p.at);
    if (town && today > p.paidTo + 14) { abandon(S, p.id); out.push(`🏛 ${T(town)?.name || town} ยึดที่ดินคืน เพราะค้างค่าเช่าเกินสองสัปดาห์`); F?.add(T(town)?.ruler, -5, 'ค้างค่าเช่าที่ดิน') }
    return out;
  }
  function tickAll(S) { return list(S).slice().flatMap(p => tick(S, p)) }
  function collect(S, id) { const p = list(S).find(x => x.id === id); if (!p) return null; const g = p.gold, f = p.food; S.gold = (S.gold || 0) + g; S.food = (S.food || 0) + f; p.gold = 0; p.food = 0; return { gold: g, food: f } }
  /* raiders on the spot when you arrive at your plot out in the wild (rolled once per visit day) */
  function raidNow(S, p) { if (townOf(p.at) || !p.kind || p.raidDay === S.day) return false; p.raidDay = S.day; return Math.random() < RAID * 1.5 * ((p.guardTo || 0) >= S.day ? .35 : 1) * (1 - .4 * p.fence) }
  /* the panel: everything you own here, and what you can do. resolves with an action for the caller ('sleep') or null */
  function panel(S, where, label, onChange) {
    return new Promise(res => {
      document.getElementById('esUI')?.remove(); const d = document.createElement('div'); d.id = 'esUI';
      d.style.cssText = 'position:fixed;inset:0;z-index:2100;display:grid;place-items:center;background:#05080dcc;font-family:VillageThai,"Noto Sans Thai",system-ui,sans-serif';
      const btn = (a, l, dis) => `<button data-a="${a}" ${dis ? 'disabled' : ''} style="margin:3px;padding:6px 11px;border-radius:8px;border:1px solid #7a4b06;background:linear-gradient(#f0c560,#c9902e);color:#2a1a06;font:600 13px inherit;font-family:inherit;cursor:pointer;${dis ? 'opacity:.45;cursor:default' : ''}">${l}</button>`;
      const draw = (note = '') => {
        const town = townOf(where), mine = at(S, where), rent = town ? T(town)?.land || 0 : 0;
        const rows = mine.map(p => { const K = KINDS[p.kind]; const left = town ? p.paidTo - (S.day || 1) : null;
          return `<div style="padding:10px;border-radius:12px;background:#fff8;border:2px solid #b08a4a44;margin:8px 0"><b>${K ? K.icon + ' ' + K.name : '🟫 ที่ว่าง'}</b> <small style="color:#7a6040">· ${town ? (left >= 0 ? 'จ่ายค่าเช่าถึงอีก ' + left + ' วัน' : '<b style="color:#a0442a">ค้างค่าเช่า ' + (-left) + ' วัน</b>') : 'ที่ดินกลางป่า · รั้ว ' + p.fence + '/2'}${p.kind ? ' · สภาพ ' + p.hp + '%' : ''}</small>
            ${p.kind === 'shop' ? `<div style="font-size:13px">เงินในร้าน ${p.gold} 💰 (วันละ ${SHOP_DAY[sizeOf(p)]})</div>` : ''}${p.kind === 'farm' ? `<div style="font-size:13px">เสบียงในยุ้ง ${p.food} ห่อ (วันละ 2)</div>${root.Garden ? btn('garden:' + p.id, '🌱 แปลงผักและคอกสัตว์' + root.Garden.badge(root.Garden.of(p))) : ''}` : ''}
            <div>${p.kind ? '' : Object.entries(KINDS).map(([k, K]) => { const no = k === 'farm' ? farmWhy(p.at) : ''; return btn('build:' + p.id + ':' + k, K.icon + ' สร้าง' + K.name + ' ' + K.cost + '💰' + (no ? ' (ไม่มีที่ทำไร่)' : ''), S.gold < K.cost || !!no) }).join('')}
            ${p.kind === 'house' ? btn('sleep:' + p.id, '🛏 นอนพัก (ฟรี)') : ''}${p.gold || p.food ? btn('collect:' + p.id, '📦 เก็บของ') : ''}
            ${!town && p.kind ? btn('guard:' + p.id, (p.guardTo || 0) >= (S.day || 1) ? '🛡 มียามถึงวันที่ ' + p.guardTo + ' · ต่อ 7 วัน ' + GUARD.cost + '💰' : '🛡 จ้างยามเฝ้า 7 วัน ' + GUARD.cost + '💰', S.gold < GUARD.cost) : ''}${town ? btn('rent:' + p.id, '💰 จ่ายค่าเช่าอีก 7 วัน ' + rent + '💰', S.gold < rent) : p.fence < 2 ? btn('fence:' + p.id, '🪵 สร้างรั้วระดับ ' + (p.fence + 1) + ' ' + FENCE_COST[p.fence] + '💰', S.gold < FENCE_COST[p.fence]) : ''}
            ${btn('drop:' + p.id, '✕ ทิ้งที่ดิน')}</div>
            ${p.kind ? `<small style="color:#7a6040">${esc(KINDS[p.kind].desc)}</small>` : ''}</div>` }).join('');
        d.innerHTML = `<div style="width:min(640px,96vw);max-height:92vh;overflow:auto;padding:16px 18px;border-radius:16px;background:linear-gradient(#f3e6c6,#e2cfa2);color:#3a2a14;box-shadow:0 24px 60px #000c">
          <button data-x style="float:right;background:none;border:0;font-size:20px;cursor:pointer">✕</button><h2 style="margin:0 0 4px;font:800 22px Georgia,'Noto Sans Thai',serif">🏡 ที่ดิน · ${esc(label)}</h2>
          <p style="margin:0 0 6px;font-size:13px;color:#6a5030">${town ? 'เช่าที่ในเมือง สัปดาห์ละ ' + rent + ' 💰 · ค้างเกินสองสัปดาห์ เมืองยึดคืน · ปลอดภัยจากการบุก' : 'จับจองฟรี ไม่มีค่าเช่า · แต่สัตว์ร้ายและโจรป่าบุกได้ทุกวัน สร้างรั้วลดโอกาส'} · มีที่ดิน ${list(S).length}/${MAX_PLOTS} แปลง · 💰 ${S.gold}</p>
          ${note ? `<p style="margin:6px 0;padding:6px 10px;border-radius:8px;background:#fff9;font-size:13px">${note}</p>` : ''}
          ${rows || '<p style="font-size:13px">ยังไม่มีที่ดินที่นี่</p>'}
          <div>${btn('claim', town ? '📜 เช่าที่ดินแปลงใหม่ ' + rent + '💰' : '🚩 จับจองที่ดินตรงนี้', list(S).length >= MAX_PLOTS || (town && S.gold < rent) || (!town && mine.length > 0))}</div></div>`;   /* open land: one plot per tile */
      };
      draw(); document.body.append(d);
      const close = r => { removeEventListener('keydown', key, true); d.remove(); res(r || null) }, key = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close() } };
      addEventListener('keydown', key, true);
      d.onclick = e => {
        if (e.target === d || e.target.closest('[data-x]')) return close();
        const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; const [a, id, k] = b.dataset.a.split(':'); let note = '';
        if (a === 'claim') { const r = claim(S, where, label); note = r.ok ? '✔ ได้ที่ดินแปลงใหม่แล้ว' : r.why }
        else if (a === 'build') { const r = build(S, id, k); note = r.ok ? '✔ สร้าง' + KINDS[k].name + 'เสร็จ' : r.why; if (r.ok) root.Factions?.add(townOf(where) ? T(townOf(where))?.ruler : 'village', 2, 'สร้าง' + KINDS[k].name) }
        else if (a === 'rent') note = payRent(S, id) ? '✔ จ่ายค่าเช่าแล้ว' : 'เงินไม่พอ';
        else if (a === 'guard') note = hireGuard(S, id) ? '✔ จ้างยามแล้ว โอกาสถูกบุกเหลือราวหนึ่งในสาม' : 'เงินไม่พอ';
        else if (a === 'fence') note = fence(S, id) ? '✔ สร้างรั้วแล้ว โอกาสถูกบุกลดลง' : 'เงินไม่พอ';
        else if (a === 'collect') { const r = collect(S, id); note = '📦 ได้ ' + [r.gold ? r.gold + ' 💰' : '', r.food ? r.food + ' เสบียง' : ''].filter(Boolean).join(' · ') }
        else if (a === 'drop') { if (b.dataset.sure) { abandon(S, id); note = 'ทิ้งที่ดินแล้ว' } else { b.dataset.sure = 1; b.textContent = 'กดอีกครั้งเพื่อยืนยัน'; return } }
        else if (a === 'sleep') return close('sleep');
        else if (a === 'garden') { const p = list(S).find(x => x.id === id); if (p && root.Garden) root.Garden.open(root.Garden.of(p), { title: p.name, onChange, onClose: () => draw() }); return }
        onChange?.(); draw(note);
      };
    });
  }
  root.Estates = { farmWhy, GUARD, hireGuard, KINDS, MAX_PLOTS, SHOP_DAY, FENCE_COST, list, at, claim, build, payRent, fence, abandon, tick, tickAll, collect, raidNow, panel };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Estates;
})(typeof window !== 'undefined' ? window : globalThis);
