/* v97.55 · T7 public office by job, phase 1 (docs/TODO.md "T ที่อยู่ เมือง แฟคชั่น และการปกครอง").
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
  const OFFICES = {
    watch: { name: 'ยามหมู่บ้าน', rank2: 'หัวหน้ายาม', icon: '🛡', body: 'village', jobs: ['warrior', 'guardian'], duty: 'battles', n: 2, dutyText: 'ชนะการต่อสู้ 2 ครั้งต่อสัปดาห์' },
    hunter: { name: 'พรานหลวง', rank2: 'หัวหน้าพรานหลวง', icon: '➶', body: 'village', jobs: ['ranger'], duty: 'battles', n: 2, dutyText: 'ชนะการต่อสู้ 2 ครั้งต่อสัปดาห์' },
    magus: { name: 'นักเวทประจำสมาคม', rank2: 'ที่ปรึกษาเวทของสมาคม', icon: '✶', body: 'guild', jobs: ['mage'], duty: 'contracts', n: 1, dutyText: 'ส่งงานกิลด์ 1 งานต่อสัปดาห์' },
    warden: { name: 'ผู้ดูแลวิหาร', rank2: 'นักบวชผู้ใหญ่', icon: '✚', body: 'temple', jobs: ['cleric'], duty: 'prays', n: 2, dutyText: 'ภาวนาที่วิหาร 2 วันต่อสัปดาห์' },
    eye: { name: 'สายข่าวพ่อค้า', rank2: 'หัวหน้าสายข่าว', icon: '☾', body: 'merchants', jobs: ['rogue'], duty: 'townVisits', n: 1, dutyText: 'แวะเมืองอื่น 1 ครั้งต่อสัปดาห์' }
  };
  const PAY = [40, 70];
  /* v97.57 · what each office gives besides pay (rank 2 doubles it): watch — fewer ambushes near Fernvale · hunter — food after a win ·
     magus — guild contracts pay more · warden — prayer also mends the party · eye — goods sell for more */
  const PERK = { watch: 'ถูกซุ่มโจมตีใกล้เฟิร์นเวลน้อยลง 20%', hunter: 'ได้เสบียง +1 ทุกครั้งที่ชนะการต่อสู้', magus: 'ค่าจ้างงานกิลด์ +15%', warden: 'ภาวนาแล้วเพื่อนในทีมฟื้น HP 30% ด้วย', eye: 'ขายสินค้าได้ราคาดีขึ้น 5%' };
  const perk = (S, id) => S?.office?.id === id ? S.office.rank : 0;
  const game = () => { try { return root.WorldState?.game?.() } catch (e) { return null } };
  const today = () => game()?.day || 1;
  const counter = (S, k) => k === 'contracts' ? (S.guild?.done || 0) : (S[k] || 0);
  function why(S, id, rank = 1) {
    const O = OFFICES[id], g = game(), P = root.Progression, F = root.Factions; if (!O || !g || !P) return 'ไม่มีตำแหน่งนี้';
    const job = P.jobsOf(g).job; if (!O.jobs.includes(job)) return 'ต้องเป็นอาชีพ ' + O.jobs.map(j => P.JOBS[j]?.name).join(' หรือ ');
    const lv = P.jobLevel(g, job), need = rank === 2 ? 4 : 2; if (lv < need) return 'ต้องเลเวลอาชีพ ' + need + ' (ตอนนี้ ' + lv + ')';
    const rep = F ? F.rep(O.body) : 0, needRep = rank === 2 ? 50 : 20; if (rep < needRep) return 'ต้องมีชื่อเสียงกับ' + (F?.FACTIONS[O.body]?.name || O.body) + ' ' + needRep + ' (ตอนนี้ ' + rep + ')';
    return '';
  }
  function take(S, id) { if (S.office || why(S, id)) return false; S.office = { id, rank: 1, since: today(), weekStart: today(), base: counter(S, OFFICES[id].duty), missed: 0 }; return true }
  function promote(S) { const o = S.office; if (!o || o.rank >= 2 || why(S, o.id, 2)) return false; o.rank = 2; return true }
  function resign(S) { S.office = null }
  /* settle every whole week since weekStart: pay or warn; returns messages */
  function settle(S) {
    const o = S.office, out = []; if (!o) return out; const O = OFFICES[o.id];
    while (today() - o.weekStart >= 7) {
      const done = counter(S, O.duty) - o.base >= O.n, F = root.Factions;
      if (done) { const pay = PAY[o.rank - 1]; S.gold = (S.gold || 0) + pay; o.missed = 0; F?.add(O.body, 3, 'ทำหน้าที่' + (o.rank === 2 ? O.rank2 : O.name) + 'ครบสัปดาห์'); out.push(`${O.icon} เงินเดือน${o.rank === 2 ? O.rank2 : O.name} +${pay} 💰`) }
      else { o.missed++; F?.add(O.body, -4, 'ขาดหน้าที่' + O.name); out.push(`⚠ สัปดาห์นี้ทำหน้าที่${O.name}ไม่ครบ (${O.dutyText})`) }
      o.weekStart += 7; o.base = counter(S, O.duty);
      if (o.missed >= 2) { out.push(`📜 ถูกปลดจากตำแหน่ง${O.name} เพราะขาดหน้าที่สองสัปดาห์ติด`); S.office = null; break }
    }
    return out;
  }
  const progress = S => { const o = S.office; if (!o) return null; const O = OFFICES[o.id]; return { done: Math.min(O.n, counter(S, O.duty) - o.base), n: O.n, daysLeft: 7 - (today() - o.weekStart) } };
  /* the office panel (Fernvale mayor) — resolves when closed */
  function panel(S, onChange) {
    return new Promise(res => {
      document.getElementById('ofUI')?.remove(); const d = document.createElement('div'); d.id = 'ofUI';
      d.style.cssText = 'position:fixed;inset:0;z-index:2100;display:grid;place-items:center;background:#05080dcc;font-family:VillageThai,"Noto Sans Thai",system-ui,sans-serif';
      const btn = (a, l, dis, t) => `<button data-a="${a}" ${dis ? 'disabled' : ''} title="${t || ''}" style="margin:3px;padding:6px 11px;border-radius:8px;border:1px solid #7a4b06;background:linear-gradient(#f0c560,#c9902e);color:#2a1a06;font:600 13px inherit;font-family:inherit;cursor:pointer;${dis ? 'opacity:.45;cursor:default' : ''}">${l}</button>`;
      const draw = note => {
        const o = S.office, pr = progress(S), F = root.Factions;
        const cur = o ? (() => { const O = OFFICES[o.id], w2 = why(S, o.id, 2); return `<div style="padding:10px;border-radius:12px;background:#eef6e0cc;border:2px solid #5a9a4a;margin:8px 0"><b>${O.icon} ${o.rank === 2 ? O.rank2 : O.name}</b> <small>· ตั้งแต่วันที่ ${o.since} · เงินเดือน ${PAY[o.rank - 1]} 💰/สัปดาห์</small><div style="font-size:13px">✦ สิทธิพิเศษ: ${PERK[o.id]}${o.rank === 2 ? ' (ขั้น 2 ได้สองเท่า)' : ''}</div><div style="font-size:13px">หน้าที่: ${O.dutyText} · สัปดาห์นี้ ${pr.done}/${pr.n} · เหลือ ${pr.daysLeft} วัน${o.missed ? ' · <b style="color:#a0442a">เตือนแล้ว ' + o.missed + ' ครั้ง</b>' : ''}</div>${o.rank < 2 ? btn('up', '⬆ ขอเลื่อนเป็น' + O.rank2, !!w2, w2) : ''}${btn('quit', '✕ ลาออก')}</div>` })() : '';
        const rows = Object.entries(OFFICES).map(([id, O]) => { const w = why(S, id); return `<div style="padding:9px 10px;border-radius:12px;background:#fff8;border:2px solid #b08a4a44;margin:6px 0"><b>${O.icon} ${O.name}</b> <small style="color:#7a6040">· ${F?.FACTIONS[O.body]?.icon || ''} ${F?.FACTIONS[O.body]?.name || O.body} · ${O.dutyText} · ${PAY[0]}→${PAY[1]} 💰/สัปดาห์ · ✦ ${PERK[id]}</small><br>${S.office ? '' : btn('take:' + id, 'รับตำแหน่ง', !!w)} <small style="color:${w ? '#a0442a' : '#3a7a2a'}">${w || '✔ คุณสมบัติครบ'}</small></div>` }).join('');
        d.innerHTML = `<div style="width:min(640px,96vw);max-height:92vh;overflow:auto;padding:16px 18px;border-radius:16px;background:linear-gradient(#f3e6c6,#e2cfa2);color:#3a2a14;box-shadow:0 24px 60px #000c">
          <button data-x style="float:right;background:none;border:0;font-size:20px;cursor:pointer">✕</button><h2 style="margin:0 0 4px;font:800 22px Georgia,'Noto Sans Thai',serif">🏛 รับราชการ</h2>
          <p style="margin:0 0 6px;font-size:13px;color:#6a5030">ตำแหน่งตามอาชีพ · ต้องเลเวลอาชีพ 2 และชื่อเสียง "เป็นมิตร" กับหน่วยงาน · ทำหน้าที่ครบสัปดาห์ได้เงินเดือนและชื่อเสียง · ขาดสองสัปดาห์ติดถูกปลด · ทำได้ทีละตำแหน่ง</p>
          ${note ? `<p style="margin:6px 0;padding:6px 10px;border-radius:8px;background:#fff9;font-size:13px">${note}</p>` : ''}${cur}${rows}</div>`;
      };
      draw(settle(S).join('<br>')); document.body.append(d);
      const close = () => { removeEventListener('keydown', key, true); d.remove(); res() }, key = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close() } };
      addEventListener('keydown', key, true);
      d.onclick = e => { if (e.target === d || e.target.closest('[data-x]')) return close(); const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; const [a, id] = b.dataset.a.split(':'); let note = '';
        if (a === 'take') note = take(S, id) ? '✔ รับตำแหน่ง' + OFFICES[id].name + 'แล้ว · เริ่มนับหน้าที่สัปดาห์แรกวันนี้' : why(S, id);
        else if (a === 'up') note = promote(S) ? '⬆ ได้เลื่อนตำแหน่งแล้ว' : 'ยังเลื่อนไม่ได้';
        else if (a === 'quit') { if (b.dataset.sure) { resign(S); note = 'ลาออกแล้ว' } else { b.dataset.sure = 1; b.textContent = 'กดอีกครั้งเพื่อลาออก'; return } }
        onChange?.(); draw(note) };
    });
  }
  root.Offices = { OFFICES, PAY, PERK, perk, why, take, promote, resign, settle, progress, panel };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Offices;
})(typeof window !== 'undefined' ? window : globalThis);
