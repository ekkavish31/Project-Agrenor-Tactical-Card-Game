/* v97.43 · T1: the settlements of the valley as data (docs/TODO.md "T ที่อยู่ เมือง แฟคชั่น และการปกครอง").
   size: village · town · city  — decides the defence (village watch · town guard · city garrison with a general) and the land price.
   ruler: the faction that governs it (js/factions.js) — your standing with it changes prices there.
   goods: what is cheap there (made locally) and what is dear (brought in) — the base for trade runs later (T6 / L3).
   land: weekly rent for a plot inside the walls (T4) · outside the walls land is free but raided (T5).
   Fernvale is the home village; the other three are the towns placed on the world map by js/world-gen.js (TOWNS). */
(function (root) {
  'use strict';
  const SIZE = {
    village: { name: 'หมู่บ้าน', defence: 'ยามหมู่บ้าน', guards: 2, safety: .55 },
    town: { name: 'เมือง', defence: 'กองยามประจำเมือง', guards: 8, safety: .75 },
    city: { name: 'เมืองใหญ่', defence: 'กองทหารรักษาการณ์และแม่ทัพ', guards: 30, safety: .92 }
  };
  const GOODS = { food: 'เสบียง', potion: 'ยาฟื้นฟู', iron: 'แท่งเหล็ก', wood: 'ไม้', fish: 'ปลาเค็ม', salt: 'เกลือ', cloth: 'ผ้าทอ', herbs: 'สมุนไพร', fur: 'ขนสัตว์', ore: 'แร่' };
  const SETTLEMENTS = {
    fernvale: { name: 'หมู่บ้านเฟิร์นเวล', size: 'village', ruler: 'village', leader: 'ผู้ใหญ่บ้านโอเรน', land: 15, cheap: ['wood', 'herbs', 'food'], dear: ['salt', 'ore'],
      text: 'หมู่บ้านบ้านเกิดริมป่า มีโรงตีเหล็ก ตลาดเล็ก และสมาคมนักผจญภัย' },
    brookmere: { name: 'หมู่บ้านบรู๊คเมียร์', size: 'village', ruler: 'village', leader: 'ผู้ใหญ่บ้านแอนนา', land: 12, cheap: ['food', 'cloth'], dear: ['iron', 'potion'],
      text: 'หมู่บ้านเกษตรเล็ก ๆ ริมลำธาร ทุ่งดอกไม้ล้อมรอบ ผู้คนรู้จักเฟิร์นเวลดี' },
    haven: { name: 'ท่าเรือซอลต์เฮเวน', size: 'city', ruler: 'merchants', leader: 'สภาพ่อค้าแห่งท่าเรือ', land: 60, cheap: ['fish', 'salt', 'potion'], dear: ['wood', 'fur'],
      text: 'เมืองท่าเสียงดัง กลิ่นปลาเค็มและเกลือทะเล เรือสินค้าจอดเรียงเต็มท่า' },
    northgate: { name: 'ด่านหินเหนือ', size: 'town', ruler: 'garrison', leader: 'แม่ทัพเฝ้าด่าน', land: 30, cheap: ['iron', 'ore', 'fur'], dear: ['food', 'herbs'],
      text: 'ด่านหินบนช่องเขา ทหารเฝ้าทางขึ้นเหนือ นักเดินทางแวะพักก่อนข้ามเขา' }
  };
  const BASE = { food: 2.5, potion: 18, inn: 12 };
  /* local price of a good: cheap −25 % · dear +35 % · then your standing with the ruler (−5 % a step) */
  /* v97.54 · T6 phase 2: prices move week to week (seeded by town, good and week: ×0.8…×1.25) — the market news says where */
  const week = () => { try { return Math.floor(((root.WorldState?.game?.()?.day) || 1) / 7) } catch (e) { return 0 } };
  function swing(id, good, w = week()) { if (good === 'inn') return 1; let h = 0; for (const c of id + ':' + good + ':' + w) h = Math.imul(h ^ c.charCodeAt(0), 2654435761) >>> 0; h ^= h >>> 13; return .8 + ((h >>> 0) % 1000) / 1000 * .45 }
  function news(id) { const T = SETTLEMENTS[id]; if (!T) return ''; let best = null; for (const k of Object.keys(TRADE)) { const v = swing(id, k); if (!best || Math.abs(v - 1) > Math.abs(best[1] - 1)) best = [k, v] } return best && Math.abs(best[1] - 1) > .12 ? (best[1] > 1 ? '📈 ' + GOODS[best[0]] + 'ขาดตลาดที่' + T.name + ' ราคาสูงขึ้น' : '📉 ' + GOODS[best[0]] + 'ล้นตลาดที่' + T.name + ' ราคาตก') + ' (สัปดาห์นี้)' : '' }
  /* ---------- v97.56 · T8 governance lite: each settlement runs one policy for a month (seeded), or the one you petitioned for ----------
     tax_high prices ×1.1 · tax_low ×0.95 · trade sell ×1.1 and buy ×0.97 · safety thieves caught more (law) and fewer ambushes on the way in · festival inn half price.
     Petition (standing "นับถือ" 50+ with the ruler, 80 💰): choose next month's policy — stored in the game save (village.policy[id]). */
  const POLICIES = {
    tax_high: { name: 'ขึ้นภาษี', icon: '💰', text: 'ราคาของทุกอย่าง +10%' },
    tax_low: { name: 'ลดภาษี', icon: '🪙', text: 'ราคาของทุกอย่าง −5%' },
    trade: { name: 'ส่งเสริมการค้า', icon: '⚖', text: 'ขายสินค้าได้ราคาดีขึ้น 10% · ซื้อถูกลง 3%' },
    safety: { name: 'เข้มงวดความปลอดภัย', icon: '🛡', text: 'ลักของถูกจับง่ายขึ้น · โจรซุ่มแถวนี้น้อยลง' },
    festival: { name: 'เทศกาลประจำเมือง', icon: '🎉', text: 'โรงเตี๊ยมลดครึ่งราคา · ผู้คนคึกคัก' }
  };
  const month = () => { try { return Math.floor(((root.WorldState?.game?.()?.day) || 1) / 28) } catch (e) { return 0 } };
  function policy(id) {
    let o = null; try { o = root.WorldState?.game?.()?.village?.policy?.[id] } catch (e) { }
    if (o && o.month === month()) return o.id;
    const keys = Object.keys(POLICIES); let h = month() * 2654435761 >>> 0; for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 2246822507) >>> 0; return keys[h % keys.length];
  }
  function petition(id, pol) {
    const T = SETTLEMENTS[id], F = root.Factions, g = root.WorldState?.game?.(); if (!T || !POLICIES[pol] || !g) return 'ไม่มีนโยบายนี้';
    if ((F?.rep(T.ruler) || 0) < 50) return 'ต้องมีชื่อเสียง "นับถือ" (50) กับ' + (F?.FACTIONS[T.ruler]?.name || T.ruler);
    if ((g.village.coins || 0) < 80) return 'ค่าธรรมเนียมยื่นคำร้อง 80 💰';
    g.village.coins -= 80; (g.village.policy ||= {})[id] = { id: pol, month: month() }; try { root.WorldState.commit?.() } catch (e) { } return '';
  }
  function petitionPanel(id) {
    return new Promise(res => {
      const T = SETTLEMENTS[id]; if (!T) return res(); document.getElementById('stPet')?.remove(); const d = document.createElement('div'); d.id = 'stPet';
      d.style.cssText = 'position:fixed;inset:0;z-index:2150;display:grid;place-items:center;background:#05080dcc;font-family:VillageThai,"Noto Sans Thai",system-ui,sans-serif';
      const cur = policy(id), F = root.Factions, rep = F?.rep(T.ruler) || 0;
      d.innerHTML = `<div style="width:min(560px,94vw);padding:16px 18px;border-radius:16px;background:linear-gradient(#f3e6c6,#e2cfa2);color:#3a2a14;box-shadow:0 24px 60px #000c">
        <button data-x style="float:right;background:none;border:0;font-size:20px;cursor:pointer">✕</button><h2 style="margin:0 0 4px;font:800 21px Georgia,'Noto Sans Thai',serif">📜 ยื่นคำร้องต่อ${T.leader}</h2>
        <p style="margin:0 0 8px;font-size:13px;color:#6a5030">เลือกนโยบายของ${T.name}ไปจนจบเดือนนี้ · ต้องมีชื่อเสียง "นับถือ" (50) กับ${F?.FACTIONS[T.ruler]?.name || T.ruler} (ตอนนี้ ${rep}) · ค่าธรรมเนียม 80 💰</p><p class="msg" style="font-size:13px;margin:4px 0"></p>
        ${Object.entries(POLICIES).map(([k, P]) => `<button data-p="${k}" ${k === cur ? 'disabled' : ''} style="display:block;width:100%;text-align:left;margin:4px 0;padding:8px 10px;border-radius:9px;border:1px solid #7a4b06;background:${k === cur ? '#d8c8a0' : 'linear-gradient(#f0c560,#c9902e)'};color:#2a1a06;font:600 13px inherit;font-family:inherit;cursor:pointer">${P.icon} <b>${P.name}</b> — ${P.text}${k === cur ? ' (ตอนนี้)' : ''}</button>`).join('')}</div>`;
      document.body.append(d);
      d.onclick = e => { if (e.target === d || e.target.closest('[data-x]')) { d.remove(); return res() } const b = e.target.closest('[data-p]'); if (!b || b.disabled) return; const w = petition(id, b.dataset.p); if (w) d.querySelector('.msg').textContent = '✖ ' + w; else { d.remove(); res(b.dataset.p) } };
    });
  }
  const polMult = (id, good) => { const p = policy(id); return p === 'tax_high' ? 1.1 : p === 'tax_low' ? .95 : p === 'trade' ? .97 : p === 'festival' && good === 'inn' ? .5 : 1 };
  function price(id, good, base) {
    const T = SETTLEMENTS[id]; if (!T) return base; const F = root.Factions;
    const local = T.cheap.includes(good) ? .75 : T.dear.includes(good) ? 1.35 : 1;
    return Math.max(1, Math.round(base * local * swing(id, good) * polMult(id, good) * (F ? F.priceMult(T.ruler) : 1)));
  }
  const info = id => { const T = SETTLEMENTS[id]; return T && { ...T, id, sizeInfo: SIZE[T.size] } };
  function card(id) {
    const T = info(id); if (!T) return ''; const F = root.Factions, R = F?.FACTIONS[T.ruler], tier = F?.tier(T.ruler);
    const g = list => list.map(k => GOODS[k] || k).join(' · ');
    return `<div style="font-size:12.5px;line-height:1.7;margin:6px 0;padding:8px 10px;border-radius:10px;background:#0001">🏛 <b>${T.sizeInfo.name}</b> · ปกครองโดย ${R ? R.icon + ' ' + R.name : T.ruler} (${T.leader})${tier ? ` · ชื่อเสียงของคุณ: <b style="color:${tier[2]}">${tier[1]}</b>` : ''}<br>🛡 ${T.sizeInfo.defence} · ⬇ ของถูก: ${g(T.cheap)} · ⬆ ของแพง: ${g(T.dear)}<br>📜 นโยบายเดือนนี้: ${POLICIES[policy(id)].icon} <b>${POLICIES[policy(id)].name}</b> — ${POLICIES[policy(id)].text}<br>🏠 เช่าที่ในเมือง ${T.land} 💰/สัปดาห์ · นอกเมืองจับจองฟรีแต่เสี่ยงโดนบุก</div>`;
  }
  /* ---------- v97.44 · T6 lite: trade goods between towns ----------
     Buy where a good is made (cheap), sell where it is brought in (dear). Selling pays 80 % of the local price. Cargo lives in the world
     save (S.cargo) and is limited by the wagon (CARGO_MAX). A trade of 5+ units raises standing with the merchants. */
  const TRADE = { fish: 6, salt: 8, cloth: 10, iron: 6, fur: 12, ore: 7, herbs: 5, wood: 4 };
  const CARGO_MAX = 12, WAGON = [[150, 'เกวียนสองล้อ', 20], [300, 'เกวียนใหญ่ลากด้วยวัว', 30]], ESCORT = { cost: 30, days: 3 };
  const cargoMax = S => S.wagon ? WAGON[S.wagon - 1][2] : CARGO_MAX;
  function wagonUp(S) { const w = WAGON[S.wagon || 0]; if (!w || (S.gold || 0) < w[0]) return false; S.gold -= w[0]; S.wagon = (S.wagon || 0) + 1; return true }
  const escorted = S => (S.escortUntil || 0) >= (root.WorldState?.game?.()?.day || 1);
  function hireEscort(S) { if ((S.gold || 0) < ESCORT.cost) return false; S.gold -= ESCORT.cost; S.escortUntil = (root.WorldState?.game?.()?.day || 1) + ESCORT.days - 1; return true }
  /* T6 phase 2: losing a fight (or fleeing) on the road costs part of the cargo — little when escorted */
  function loseCargo(S, share) { const out = []; for (const k of Object.keys(S.cargo || {})) { const n = Math.ceil(S.cargo[k] * share); if (!n) continue; S.cargo[k] -= n; if (S.cargo[k] <= 0) delete S.cargo[k]; out.push(GOODS[k] + ' ' + n) } return out }
  const buyPrice = (id, k) => price(id, k, TRADE[k]);
  const sellPrice = (id, k) => { const T = SETTLEMENTS[id]; if (!T) return 0; const local = T.cheap.includes(k) ? .75 : T.dear.includes(k) ? 1.35 : 1; return Math.max(1, Math.floor(TRADE[k] * local * swing(id, k) * (policy(id) === 'trade' ? 1.1 : 1) * (1 + .05 * (root.Offices?.perk?.((() => { try { return root.WorldState?.world?.() } catch (e) { return null } })(), 'eye') || 0)) * .8)) };
  const load = S => Object.values(S.cargo || {}).reduce((a, n) => a + n, 0);
  function trade(id, S, k, n) {   /* n > 0 buy, n < 0 sell · returns the gold moved or 0 */
    S.cargo ||= {}; if (!TRADE[k] || !SETTLEMENTS[id]) return 0;
    if (n > 0) { n = Math.min(n, cargoMax(S) - load(S), Math.floor((S.gold || 0) / buyPrice(id, k))); if (n <= 0) return 0; const c = n * buyPrice(id, k); S.gold -= c; S.cargo[k] = (S.cargo[k] || 0) + n; if (n >= 5) root.Factions?.add('merchants', 1, 'ซื้อ' + GOODS[k] + 'ที่' + SETTLEMENTS[id].name); return -c }
    n = Math.min(-n, S.cargo[k] || 0); if (n <= 0) return 0; const g = n * sellPrice(id, k); S.gold += g; S.cargo[k] -= n; if (!S.cargo[k]) delete S.cargo[k]; if (n >= 5) root.Factions?.add('merchants', 1, 'ขาย' + GOODS[k] + 'ที่' + SETTLEMENTS[id].name); return g;
  }
  /* the market panel (one overlay, used by the world map's towns and Fernvale's market) — resolves when closed */
  function tradePanel(id, S, onChange) {
    return new Promise(res => {
      const T = SETTLEMENTS[id]; if (!T) return res(); document.getElementById('stTrade')?.remove();
      const d = document.createElement('div'); d.id = 'stTrade';
      d.style.cssText = 'position:fixed;inset:0;z-index:2100;display:grid;place-items:center;background:#05080dcc;font-family:VillageThai,"Noto Sans Thai",system-ui,sans-serif';
      const draw = () => {
        const rows = Object.keys(TRADE).map(k => { const have = S.cargo?.[k] || 0, tag = T.cheap.includes(k) ? '<span style="color:#3a7a2a">⬇ ถูก</span>' : T.dear.includes(k) ? '<span style="color:#a0442a">⬆ แพง</span>' : '';
          return `<tr><td>${GOODS[k]} ${tag}</td><td style="text-align:right">${buyPrice(id, k)}</td><td style="text-align:right">${sellPrice(id, k)}</td><td style="text-align:center">${have}</td>
            <td><button data-k="${k}" data-n="1">ซื้อ 1</button><button data-k="${k}" data-n="5">ซื้อ 5</button><button data-k="${k}" data-n="-1" ${have ? '' : 'disabled'}>ขาย 1</button><button data-k="${k}" data-n="-99" ${have ? '' : 'disabled'}>ขายหมด</button></td></tr>` }).join('');
        d.innerHTML = `<div style="width:min(760px,96vw);max-height:92vh;overflow:auto;padding:16px 18px;border-radius:16px;background:linear-gradient(#f3e6c6,#e2cfa2);color:#3a2a14;box-shadow:0 24px 60px #000c">
          <button data-x style="float:right;background:none;border:0;font-size:20px;cursor:pointer">✕</button><h2 style="margin:0 0 4px;font:800 22px Georgia,'Noto Sans Thai',serif">🛒 ตลาดสินค้า · ${T.name}</h2>
          <p style="margin:0 0 10px;font-size:13px;color:#6a5030">ซื้อของที่เมืองนี้ผลิตเอง แล้วไปขายเมืองที่ขาดแคลน · ขายได้ 80% ของราคาท้องถิ่น · 💰 ${S.gold} · เกวียน ${load(S)}/${cargoMax(S)}${escorted(S) ? ' · 🛡 มีคนคุ้มกันถึงวันที่ ' + S.escortUntil : ''}</p>${news(id) ? `<p style="margin:0 0 8px;font-size:13px;color:#7a3a10">${news(id)}</p>` : ''}
          <div style="margin:0 0 8px">${WAGON[S.wagon || 0] ? `<button data-w style="margin:2px;padding:5px 10px;border-radius:8px;border:1px solid #7a4b06;background:#e8d29a;font:600 12.5px inherit;font-family:inherit;cursor:pointer">🛒 ซื้อ${WAGON[S.wagon || 0][1]} (จุ ${WAGON[S.wagon || 0][2]}) ${WAGON[S.wagon || 0][0]}💰</button>` : ''}<button data-e style="margin:2px;padding:5px 10px;border-radius:8px;border:1px solid #7a4b06;background:#e8d29a;font:600 12.5px inherit;font-family:inherit;cursor:pointer">🛡 จ้างคุ้มกัน ${ESCORT.days} วัน ${ESCORT.cost}💰</button></div>
          <table style="width:100%;border-collapse:collapse;font-size:13.5px"><tr style="text-align:left;color:#7a6040"><th>สินค้า</th><th style="text-align:right">ซื้อ</th><th style="text-align:right">ขาย</th><th>มี</th><th></th></tr>${rows}</table></div>`;
        d.querySelectorAll('button[data-k]').forEach(b => { b.style.cssText = 'margin:2px;padding:4px 8px;border-radius:7px;border:1px solid #7a4b06;background:linear-gradient(#f0c560,#c9902e);color:#2a1a06;font:600 12px inherit;font-family:inherit;cursor:pointer'; if (b.disabled) b.style.opacity = .45 });
      };
      draw(); document.body.append(d);
      const close = () => { removeEventListener('keydown', key, true); d.remove(); res() }, key = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close() } };
      addEventListener('keydown', key, true);
      d.onclick = e => { if (e.target === d || e.target.closest('[data-x]')) return close(); if (e.target.closest('[data-w]')) { if (wagonUp(S)) { onChange?.(0); draw() } return } if (e.target.closest('[data-e]')) { if (hireEscort(S)) { onChange?.(0); draw() } return } const b = e.target.closest('button[data-k]'); if (!b || b.disabled) return; const g = trade(id, S, b.dataset.k, +b.dataset.n); if (g) { onChange?.(g); draw() } };
    });
  }
  root.Settlements = { POLICIES, policy, petition, petitionPanel, SIZE, GOODS, SETTLEMENTS, BASE, price, info, card, TRADE, CARGO_MAX, WAGON, ESCORT, cargoMax, wagonUp, escorted, hireEscort, loseCargo, swing, news, buyPrice, sellPrice, load, trade, tradePanel };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Settlements;
})(typeof window !== 'undefined' ? window : globalThis);
