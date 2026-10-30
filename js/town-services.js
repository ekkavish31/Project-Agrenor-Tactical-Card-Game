/* v97.72 · what each new settlement of the Kingdom of Aldren is known for (docs/PROPOSAL-SETTLEMENTS.md · js/settlements.js).
   Buttons on the world-map town card: list(S, id) → [{ key, label, cost, disabled, title }] · run(S, id, key, ctx) → { lines, goto? }.
   ctx (from js/world-map.js) = { passTime(h), healParty(f), reveal(radius), game(), rng }.
     Willowshore  ⛵ ferry to the capital (and back from Lakenhold)       Deepcairn ⛏ a shift in the mine: pay, ore, sometimes a crystal
     Thornwatch   🧭 a hunter maps the country around · 🔥 tales of the great forest by the fire
     Vinehollow   ♨ the hot spring: full rest in two hours
     Lakenhold    🗼 the mages' tower (job lesson) · 🏛 the museum buys crystals for study · ⛩ the great temple's blessing
   Once-a-day services remember the day in S.svc[id:key]. */
(function (root) {
  'use strict';
  const ST = () => root.Settlements, F = () => root.Factions;
  const day = () => { try { return root.WorldState?.game?.()?.day || 1 } catch (e) { return 1 } };
  const used = (S, id, k) => (S.svc?.[id + ':' + k] || 0) === day(), use = (S, id, k) => { (S.svc ||= {})[id + ':' + k] = day() };
  /* the capital opens when the prologue is over (the villagers' "เส้นทางไปเมืองใหญ่ยังไม่เปิด") — or when the story is switched off */
  function capitalOpen() { try { const st = root.WorldState?.game?.()?.village?.story; return !st || st.mode === 'done' || st.mode === 'off' } catch (e) { return true } }
  const FOREST_TALES = [
    'นายพรานเฒ่าเล่าว่าเคยเห็นแสงลอยเหนือเรือนยอดไม้ลึกเข้าไปในป่า แต่ไม่มีใครตามไปถึง',
    '"เข้าไปเกินสามวันเดิน เข็มทิศจะเริ่มหมุนเอง" — คนในค่ายพูดเหมือนกันทุกคน',
    'มีคนพบหินสลักลายเส้นแปลก ๆ ใต้รากไม้ใหญ่ นักโบราณคดีจากนครหลวงรับซื้อไปหมด',
    'ว่ากันว่าในป่ามีผู้คนอาศัยอยู่ แต่พวกเขาไม่ต้อนรับคนนอก',
    'ทีมสำรวจที่ออกไปเมื่อฤดูก่อนกลับมาไม่ครบ คนที่รอดไม่ยอมเล่าว่าเจออะไร'
  ];
  const SVC = {
    willowshore: [{ key: 'ferry', label: '⛵ เรือข้ามฟากไปนครหลวง', cost: 10, why: () => capitalOpen() ? '' : 'เรือยังไม่รับคนไปนครหลวง' }],
    lakenhold: [
      { key: 'bounty', label: '📜 สำนักใหญ่สมาคม · ประกาศจับ', cost: 0 },   /* v97.73 · T3 */
      { key: 'tower', label: '🗼 หอคอยเวท · เรียนพิเศษ', cost: 40, daily: true },
      { key: 'museum', label: '🏛 พิพิธภัณฑ์ · ขายผลึก', cost: 0, why: S => (S.cargo?.crystal ? '' : 'ไม่มีผลึกในเกวียน') },
      { key: 'blessing', label: '⛩ มหาวิหาร · รับพร', cost: 15, daily: true },
      { key: 'ferry', label: '⛵ เรือข้ามฟากไปวิลโลว์ชอร์', cost: 10 }
    ],
    deepcairn: [{ key: 'mine', label: '⛏ ทำงานในเหมือง 4 ชั่วโมง', cost: 0, daily: true }],
    thornwatch: [{ key: 'guide', label: '🧭 จ้างพรานนำทางสำรวจ', cost: 20, daily: true }, { key: 'tales', label: '🔥 ฟังเรื่องป่าใหญ่', cost: 0 }],
    vinehollow: [{ key: 'spring', label: '♨ แช่บ่อน้ำร้อน', cost: 8 }]
  };
  function list(S, id) {
    return (SVC[id] || []).map(o => { const w = (o.why?.(S) || '') || (o.daily && used(S, id, o.key) ? 'วันนี้ใช้ไปแล้ว' : '') || (o.cost && (S.gold || 0) < o.cost ? 'เงินไม่พอ' : '');
      return { key: o.key, label: o.label + (o.cost ? ' · ' + o.cost + ' 💰' : ''), disabled: !!w, title: w } });
  }
  function run(S, id, key, ctx = {}) {
    const o = (SVC[id] || []).find(x => x.key === key); if (!o) return { lines: [] };
    const w = list(S, id).find(x => x.key === key); if (w.disabled) return { lines: [w.title] };
    if (o.cost) S.gold -= o.cost; if (o.daily) use(S, id, key);
    const r = ctx.rng || Math.random, out = [];
    if (key === 'bounty') return { lines: [], panel: 'bounty' };
    if (key === 'ferry') { ctx.passTime?.(3); return { lines: ['⛵ ล่องเรือข้ามทะเลสาบสามชั่วโมง ลมเย็นสบาย'], goto: id === 'willowshore' ? 'lakenhold' : 'willowshore' } }
    if (key === 'mine') {
      ctx.passTime?.(4); S.fatigue = Math.min(100, (S.fatigue || 0) + 20); S.gold += 12; out.push('⛏ ทำงานกะหนึ่ง ได้ค่าแรง 12 💰 · เหนื่อย +20');
      const room = () => (ST()?.cargoMax(S) || 12) - (ST()?.load(S) || 0); S.cargo ||= {};
      const ore = Math.min(2, Math.max(0, room())); if (ore) { S.cargo.ore = (S.cargo.ore || 0) + ore; out.push('🪨 หัวหน้าเหมืองแบ่งแร่ให้ ' + ore + ' ก้อน (ใส่เกวียน)') }
      if (r() < .3 && room() > 0) { S.cargo.crystal = (S.cargo.crystal || 0) + 1; out.push('💎 ขุดเจอผลึกเรืองแสงเล็ก ๆ หนึ่งก้อน') }
      F()?.add('crown', 1, 'ช่วยงานเหมืองดีปแคร์น'); return { lines: out };
    }
    if (key === 'guide') { ctx.passTime?.(3); ctx.reveal?.(6); F()?.add('guild', 1, 'สำรวจรอบธอร์นวอตช์'); return { lines: ['🧭 พรานพาเดินสำรวจสามชั่วโมง แผนที่รอบค่ายเปิดกว้างขึ้น'] } }
    if (key === 'tales') return { lines: ['🔥 ' + FOREST_TALES[Math.floor(r() * FOREST_TALES.length)]] };
    if (key === 'spring') { ctx.passTime?.(2); S.hp = S.maxHp; S.fatigue = 0; ctx.healParty?.(1); return { lines: ['♨ แช่บ่อน้ำร้อนสองชั่วโมง หายเหนื่อยทั้งทีม · HP เต็ม'] } }
    if (key === 'tower') {
      const P = root.Progression, g = ctx.game?.(); if (!P || !g) return { lines: ['หอคอยปิด'] };
      const res = P.gainJob(g, 20); out.push('🗼 อาจารย์ในหอคอยสอนพิเศษหนึ่งบท · แต้มอาชีพ +20'); if (res.ups?.length) out.push('⬆ อาชีพเลเวล ' + res.ups[res.ups.length - 1] + '!');
      ctx.passTime?.(2); return { lines: out };
    }
    if (key === 'museum') { const n = S.cargo.crystal, p = Math.round((ST()?.sellPrice('lakenhold', 'crystal') || 20) * 1.3); S.gold += n * p; delete S.cargo.crystal; S.traded = (S.traded || 0) + n; F()?.add('crown', 1, 'ส่งผลึกให้พิพิธภัณฑ์'); return { lines: ['🏛 นักโบราณคดีรับซื้อผลึก ' + n + ' ก้อน ก้อนละ ' + p + ' 💰 เพื่อนำไปศึกษา'] } }
    if (key === 'blessing') { ctx.healParty?.(1); S.hp = S.maxHp; F()?.add('temple', 1, 'รับพรที่มหาวิหารนครหลวง'); return { lines: ['⛩ นักบวชสวดใต้วงแสงสามวง ทั้งทีมรู้สึกสดชื่น · HP เต็ม'] } }
    return { lines: out };
  }
  root.TownServices = { SVC, list, run, capitalOpen, FOREST_TALES };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.TownServices;
})(typeof window !== 'undefined' ? window : globalThis);
