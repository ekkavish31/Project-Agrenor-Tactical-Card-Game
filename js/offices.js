/* v97.55 · T7 public office by job, phase 1 (phase 2 v97.68: rank ladders, offices in Northgate and Saltharbour) (docs/TODO.md "T ที่อยู่ เมือง แฟคชั่น และการปกครอง").
   Each job can serve one body in the valley, from the mayor's house in Fernvale (ผู้ใหญ่บ้านโอเรน → 🏛 รับราชการ):
     warrior / guardian → village watch (village)      duty: win 2 battles a week
     ranger            → royal hunter (village)        duty: win 2 battles a week
     mage              → guild magus (guild)           duty: hand in 1 guild contract a week
     cleric            → temple warden (temple)        duty: pray at the temple on 2 days a week
     rogue             → merchants' eye (merchants)    duty: visit another town once a week
   Needs: that job at Lv.2+ and standing "เป็นมิตร" (20+) with the body. Two ranks: the second needs job Lv.4 and standing 50.
   Each finished week pays a salary (40 · 70) and +3 standing; a missed week is a warning, two in a row and you are dismissed.
   Counters it reads (all in the world save S): battles (won), guild.done, prays, townVisits. One office at a time: S.office. */
(function (root) {
  'use strict';
  /* v97.68 · T7 phase 2: every office is a ladder of ranks [title, job level, standing, weekly pay] and belongs to a town
     (Fernvale's are given out by the mayor, the others at the town's hall on the world map).
     Northgate garrison: private → squad leader → captain → vice-general → general (แม่ทัพ, job Lv.5 and standing 90).
     Saltharbour harbour office: clerk → inspector → harbour master, any job, duty = goods sold at a market. */
  const OFFICES = {
    watch: { name: 'ยามหมู่บ้าน', icon: '🛡', body: 'village', town: 'fernvale', jobs: ['warrior', 'guardian'], duty: 'battles', n: 2, dutyText: 'ชนะการต่อสู้ 2 ครั้งต่อสัปดาห์', ranks: [['ยามหมู่บ้าน', 2, 20, 40], ['หัวหน้ายาม', 4, 50, 70]] },
    hunter: { name: 'พรานหลวง', icon: '➶', body: 'village', town: 'fernvale', jobs: ['ranger'], duty: 'battles', n: 2, dutyText: 'ชนะการต่อสู้ 2 ครั้งต่อสัปดาห์', ranks: [['พรานหลวง', 2, 20, 40], ['หัวหน้าพรานหลวง', 4, 50, 70]] },
    magus: { name: 'นักเวทประจำสมาคม', icon: '✶', body: 'guild', town: 'fernvale', jobs: ['mage'], duty: 'contracts', n: 1, dutyText: 'ส่งงานกิลด์ 1 งานต่อสัปดาห์', ranks: [['นักเวทประจำสมาคม', 2, 20, 40], ['ที่ปรึกษาเวทของสมาคม', 4, 50, 70]] },
    warden: { name: 'ผู้ดูแลวิหาร', icon: '✚', body: 'temple', town: 'fernvale', jobs: ['cleric'], duty: 'prays', n: 2, dutyText: 'ภาวนาที่วิหาร 2 วันต่อสัปดาห์', ranks: [['ผู้ดูแลวิหาร', 2, 20, 40], ['นักบวชผู้ใหญ่', 4, 50, 70]] },
    eye: { name: 'สายข่าวพ่อค้า', icon: '☾', body: 'merchants', town: 'fernvale', jobs: ['rogue'], duty: 'townVisits', n: 1, dutyText: 'แวะเมืองอื่น 1 ครั้งต่อสัปดาห์', ranks: [['สายข่าวพ่อค้า', 2, 20, 40], ['หัวหน้าสายข่าว', 4, 50, 70]] },
    garrison: { name: 'ทหารด่านหินเหนือ', icon: '⚔', body: 'garrison', town: 'northgate', jobs: ['warrior', 'guardian', 'ranger'], duty: 'battles', n: 3, dutyText: 'ชนะการต่อสู้ 3 ครั้งต่อสัปดาห์', ranks: [['พลทหารด่าน', 2, 20, 50], ['นายกอง', 3, 40, 80], ['ผู้กองด่าน', 4, 60, 120], ['แม่ทัพรอง', 5, 75, 170], ['แม่ทัพ', 5, 90, 240]] },
    royal: { name: 'องครักษ์นครหลวง', icon: '👑', body: 'crown', town: 'lakenhold', jobs: ['warrior', 'guardian', 'ranger', 'mage', 'cleric'], duty: 'battles', n: 3, dutyText: 'ชนะการต่อสู้ 3 ครั้งต่อสัปดาห์', ranks: [['ยามนครหลวง', 2, 20, 60], ['นายร้อยองครักษ์', 3, 40, 100], ['นายพันองครักษ์', 4, 60, 160], ['แม่ทัพใหญ่แห่งอัลเดรน', 5, 90, 320]] },   /* v97.72 */
    harbor: { name: 'เจ้าหน้าที่ท่าเรือ', icon: '⚓', body: 'merchants', town: 'haven', jobs: null, duty: 'traded', n: 10, dutyText: 'ขายสินค้าในตลาด 10 ชิ้นต่อสัปดาห์', ranks: [['เสมียนท่าเรือ', 2, 20, 45], ['ผู้ตรวจสินค้า', 3, 45, 80], ['นายท่า', 4, 70, 130]] }
  };
  const title = (id, rank) => OFFICES[id]?.ranks[Math.max(0, Math.min(OFFICES[id].ranks.length, rank) - 1)]?.[0] || '';
  const PAY = [40, 70];   /* Fernvale's two-rank offices (kept for older callers) */
  /* v97.57 · what each office gives besides pay — it grows with the rank: watch — fewer ambushes near Fernvale · hunter — food after a win ·
     magus — guild contracts pay more · warden — prayer also mends the party · eye — goods sell for more
     v97.68 · garrison — fewer ambushes anywhere (−8 % a rank) and from vice-general up soldiers guard your wagon · harbor — the wagon carries 5 more a rank */
  const PERK = { watch: 'ถูกซุ่มโจมตีใกล้เฟิร์นเวลน้อยลง 20%', hunter: 'ได้เสบียง +1 ทุกครั้งที่ชนะการต่อสู้', magus: 'ค่าจ้างงานกิลด์ +15%', warden: 'ภาวนาแล้วเพื่อนในทีมฟื้น HP 30% ด้วย', eye: 'ขายสินค้าได้ราคาดีขึ้น 5%',
    garrison: 'ถูกซุ่มโจมตีทุกที่น้อยลง 8% · ขั้นแม่ทัพรองขึ้นไป ทหารคุ้มกันเกวียนให้ฟรี', royal: 'ของในนครหลวงถูกลง 3% · ไม่ต้องเสียภาษีผ่านเมือง', harbor: 'เกวียนบรรทุกได้เพิ่ม 5 ชิ้น' };
  const perk = (S, id) => S?.office?.id === id ? S.office.rank : 0;
  const game = () => { try { return root.WorldState?.game?.() } catch (e) { return null } };
  const today = () => game()?.day || 1;
  const counter = (S, k) => k === 'contracts' ? (S.guild?.done || 0) : (S[k] || 0);
  const townName = t => root.Settlements?.SETTLEMENTS?.[t]?.name || t;
  function why(S, id, rank = 1) {
    const O = OFFICES[id], g = game(), P = root.Progression, F = root.Factions; if (!O || !g || !P) return 'ไม่มีตำแหน่งนี้';
    const R = O.ranks[rank - 1]; if (!R) return 'ขั้นสูงสุดแล้ว';
    const job = P.jobsOf(g).job; if (O.jobs && !O.jobs.includes(job)) return 'ต้องเป็นอาชีพ ' + O.jobs.map(j => P.JOBS[j]?.name).join(' หรือ ');
    const lv = P.jobLevel(g, job), need = R[1]; if (lv < need) return 'ต้องเลเวลอาชีพ ' + need + ' (ตอนนี้ ' + lv + ')';
    const rep = F ? F.rep(O.body) : 0, needRep = R[2]; if (rep < needRep) return 'ต้องมีชื่อเสียงกับ' + (F?.FACTIONS[O.body]?.name || O.body) + ' ' + needRep + ' (ตอนนี้ ' + rep + ')';
    return '';
  }
  function take(S, id) { if (S.office || why(S, id)) return false; S.office = { id, rank: 1, since: today(), weekStart: today(), base: counter(S, OFFICES[id].duty), missed: 0 }; return true }
  function promote(S) { const o = S.office; if (!o || o.rank >= OFFICES[o.id].ranks.length || why(S, o.id, o.rank + 1)) return false; o.rank++; root.Factions?.add(OFFICES[o.id].body, 2, 'ได้เลื่อนเป็น' + title(o.id, o.rank)); return true }
  function resign(S) { S.office = null }
  const pay = (id, rank) => OFFICES[id].ranks[rank - 1][3];
  /* settle every whole week since weekStart: pay or warn; returns messages */
  function settle(S) {
    const o = S.office, out = []; if (!o) return out; const O = OFFICES[o.id];
    while (today() - o.weekStart >= 7) {
      const done = counter(S, O.duty) - o.base >= O.n, F = root.Factions;
      if (done) { const p = pay(o.id, o.rank); S.gold = (S.gold || 0) + p; o.missed = 0; F?.add(O.body, 3, 'ทำหน้าที่' + title(o.id, o.rank) + 'ครบสัปดาห์'); out.push(`${O.icon} เงินเดือน${title(o.id, o.rank)} +${p} 💰`) }
      else { o.missed++; F?.add(O.body, -4, 'ขาดหน้าที่' + O.name); out.push(`⚠ สัปดาห์นี้ทำหน้าที่${title(o.id, o.rank)}ไม่ครบ (${O.dutyText})`) }
      o.weekStart += 7; o.base = counter(S, O.duty);
      if (o.missed >= 2) { out.push(`📜 ถูกปลดจากตำแหน่ง${title(o.id, o.rank)} เพราะขาดหน้าที่สองสัปดาห์ติด`); S.office = null; break }
    }
    return out;
  }
  const progress = S => { const o = S.office; if (!o) return null; const O = OFFICES[o.id]; return { done: Math.min(O.n, counter(S, O.duty) - o.base), n: O.n, daysLeft: 7 - (today() - o.weekStart) } };
  /* the office panel — town: 'fernvale' (the mayor) or a world-map town's hall; lists that town's offices, and the one you hold wherever it is.
     Resolves when closed. */
  function panel(S, onChange, town = 'fernvale') {
    return new Promise(res => {
      document.getElementById('ofUI')?.remove(); const d = document.createElement('div'); d.id = 'ofUI';
      d.style.cssText = 'position:fixed;inset:0;z-index:2100;display:grid;place-items:center;background:#05080dcc;font-family:VillageThai,"Noto Sans Thai",system-ui,sans-serif';
      const btn = (a, l, dis, t) => `<button data-a="${a}" ${dis ? 'disabled' : ''} title="${t || ''}" style="margin:3px;padding:6px 11px;border-radius:8px;border:1px solid #7a4b06;background:linear-gradient(#f0c560,#c9902e);color:#2a1a06;font:600 13px inherit;font-family:inherit;cursor:pointer;${dis ? 'opacity:.45;cursor:default' : ''}">${l}</button>`;
      const ladder = id => OFFICES[id].ranks.map((R, i) => `<span style="white-space:nowrap;${S.office?.id === id && S.office.rank === i + 1 ? 'font-weight:800;color:#2a6a1a' : ''}">${R[0]} <small>(Lv.${R[1]} · ${R[2]} · ${R[3]}💰)</small></span>`).join(' → ');
      const draw = note => {
        const o = S.office, pr = progress(S), F = root.Factions;
        const cur = o ? (() => { const O = OFFICES[o.id], nx = o.rank < O.ranks.length, w2 = nx ? why(S, o.id, o.rank + 1) : ''; return `<div style="padding:10px;border-radius:12px;background:#eef6e0cc;border:2px solid #5a9a4a;margin:8px 0"><b>${O.icon} ${title(o.id, o.rank)}</b> <small>· ${townName(O.town)} · ตั้งแต่วันที่ ${o.since} · เงินเดือน ${pay(o.id, o.rank)} 💰/สัปดาห์</small><div style="font-size:13px">✦ สิทธิพิเศษ: ${PERK[o.id]}${O.ranks.length > 1 ? ' (แรงขึ้นตามขั้น · ตอนนี้ขั้น ' + o.rank + ')' : ''}</div><div style="font-size:13px">หน้าที่: ${O.dutyText} · สัปดาห์นี้ ${pr.done}/${pr.n} · เหลือ ${pr.daysLeft} วัน${o.missed ? ' · <b style="color:#a0442a">เตือนแล้ว ' + o.missed + ' ครั้ง</b>' : ''}</div><div style="font-size:12px;color:#5a4426;margin:3px 0">${ladder(o.id)}</div>${nx ? btn('up', '⬆ ขอเลื่อนเป็น' + title(o.id, o.rank + 1), !!w2 || O.town !== town, O.town !== town ? 'ขอเลื่อนขั้นได้ที่' + townName(O.town) : w2) + (O.town !== town ? ' <small>ขอเลื่อนขั้นได้ที่' + townName(O.town) + '</small>' : w2 ? ' <small style="color:#a0442a">' + w2 + '</small>' : '') : '<small>ขั้นสูงสุดแล้ว</small>'}${btn('quit', '✕ ลาออก')}</div>` })() : '';
        const here = Object.entries(OFFICES).filter(([, O]) => O.town === town);
        const rows = here.map(([id, O]) => { const w = why(S, id); return `<div style="padding:9px 10px;border-radius:12px;background:#fff8;border:2px solid #b08a4a44;margin:6px 0"><b>${O.icon} ${O.name}</b> <small style="color:#7a6040">· ${F?.FACTIONS[O.body]?.icon || ''} ${F?.FACTIONS[O.body]?.name || O.body} · ${O.dutyText} · ✦ ${PERK[id]}</small><div style="font-size:12px;color:#5a4426;margin:3px 0">${ladder(id)}</div>${S.office ? '' : btn('take:' + id, 'รับตำแหน่ง', !!w)} <small style="color:${w ? '#a0442a' : '#3a7a2a'}">${w || '✔ คุณสมบัติครบ'}</small></div>` }).join('') || '<p>ที่นี่ไม่มีตำแหน่งว่าง</p>';
        d.innerHTML = `<div style="width:min(680px,96vw);max-height:92vh;overflow:auto;padding:16px 18px;border-radius:16px;background:linear-gradient(#f3e6c6,#e2cfa2);color:#3a2a14;box-shadow:0 24px 60px #000c">
          <button data-x style="float:right;background:none;border:0;font-size:20px;cursor:pointer">✕</button><h2 style="margin:0 0 4px;font:800 22px Georgia,'Noto Sans Thai',serif"><img src="assets/icons/menu/castle.webp" alt="" style="width:30px;height:30px;vertical-align:middle;margin-right:6px">รับราชการ · ${townName(town)}</h2>
          <p style="margin:0 0 6px;font-size:13px;color:#6a5030">แต่ละขั้นต้องมีเลเวลอาชีพและชื่อเสียงกับหน่วยงานตามที่บอกในวงเล็บ (เลเวล · ชื่อเสียง · เงินเดือนต่อสัปดาห์) · ทำหน้าที่ครบสัปดาห์ได้เงินเดือนและชื่อเสียง · ขาดสองสัปดาห์ติดถูกปลด · รับได้ทีละตำแหน่ง</p>
          ${note ? `<p style="margin:6px 0;padding:6px 10px;border-radius:8px;background:#fff9;font-size:13px">${note}</p>` : ''}${cur}${rows}</div>`;
      };
      draw(settle(S).join('<br>')); document.body.append(d);
      root.Tips?.once('office', 'รับราชการ', ['แต่ละตำแหน่งต้องเป็นอาชีพที่กำหนด มีเลเวลอาชีพและชื่อเสียงกับหน่วยงานถึงเกณฑ์', 'ทำหน้าที่ครบในแต่ละสัปดาห์ได้เงินเดือนและชื่อเสียง · ขาดสองสัปดาห์ติดจะถูกปลด', 'ขอเลื่อนขั้นได้ที่เมืองของตำแหน่งนั้น · สิทธิพิเศษจะแรงขึ้นตามขั้น'], 'assets/icons/menu/castle.webp');   /* v97.89 */
      const close = () => { removeEventListener('keydown', key, true); d.remove(); res() }, key = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close() } };
      addEventListener('keydown', key, true);
      d.onclick = e => { if (e.target === d || e.target.closest('[data-x]')) return close(); const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; const [a, id] = b.dataset.a.split(':'); let note = '';
        if (a === 'take') note = take(S, id) ? '✔ รับตำแหน่ง' + title(id, 1) + 'แล้ว · เริ่มนับหน้าที่สัปดาห์แรกวันนี้' : why(S, id);
        else if (a === 'up') note = promote(S) ? '⬆ ได้เลื่อนเป็น' + title(S.office.id, S.office.rank) + 'แล้ว' : 'ยังเลื่อนไม่ได้';
        else if (a === 'quit') { if (b.dataset.sure) { resign(S); note = 'ลาออกแล้ว' } else { b.dataset.sure = 1; b.textContent = 'กดอีกครั้งเพื่อลาออก'; return } }
        onChange?.(); draw(note) };
    });
  }
  root.Offices = { OFFICES, PAY, PERK, perk, title, pay, why, take, promote, resign, settle, progress, panel };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Offices;
})(typeof window !== 'undefined' ? window : globalThis);
