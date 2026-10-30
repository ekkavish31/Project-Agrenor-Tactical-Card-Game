/* v97.73 · T3 bounties (docs/TODO.md "T ที่อยู่ เมือง แฟคชั่น และการปกครอง" · also the first step of L1 "นักผจญภัย").
   Two boards: the adventurers' guild in Fernvale (the guild room, js/interior.js) and the guild headquarters in Lakenhold
   (a service on the town card, js/town-services.js). Each board posts 3 bounties a week (seeded by board and week).
   Take up to 2 at once, 10 days each. A bounty gets its place on the world map when the map next loads (place() — the board pages
   have no map): a free hex 5–9 (tier 1) · 9–14 (tier 2) · 14–20 (tier 3) hexes from Fernvale, its foe chosen by the land there.
   Beat it there (tier 3 fights like a boss) → "slain" → claim the reward at either board: gold, standing with the guild and with whoever
   posted it (village · crown), and the guards look at you a little less (Law heat −1 in the posting town). A bounty left past its days
   fails (guild standing −2). Everything lives in the world save: S.bounties = [{ id, name, tier, reward, board, until, state, c, r, foe }]. */
(function (root) {
  'use strict';
  const TIERS = [null, { name: 'ค่าหัวเล็ก', min: 5, max: 9, pay: [60, 90] }, { name: 'ค่าหัวกลาง', min: 9, max: 14, pay: [110, 160] }, { name: 'ค่าหัวใหญ่', min: 14, max: 20, pay: [200, 280] }];
  const WHO = [
    ['โจรเคราแดง', 'หัวหน้าโจรที่ดักปล้นเกวียนบนถนน', 'bandit'], ['ไวเปอร์มือไว', 'โจรวิ่งราวที่หนีจากคุกนครหลวง', 'bandit'], ['พี่น้องตระกูลแกรนต์', 'โจรสองพี่น้องที่ปล้นหมู่บ้านชายป่า', 'bandit'],
    ['หมาป่าตาเดียว', 'หมาป่าตัวใหญ่ที่ลากแกะไปทุกคืน', 'wolf'], ['เขี้ยวเงิน', 'จ่าฝูงหมาป่าขนสีเงิน', 'wolf'],
    ['โกเบลินเจ้าเล่ห์', 'หัวหน้าโคโบลด์ที่ขโมยเครื่องมือเหมือง', 'kobold'], ['ราชาค้างคาว', 'ค้างคาวยักษ์ที่ทำรังในซากหอคอย', 'bat'], ['เมือกกลืนเกวียน', 'เมือกตัวมหึมาที่ขวางทางในหนองน้ำ', 'slime']
  ];
  const day = () => { try { return root.WorldState?.game?.()?.day || 1 } catch (e) { return 1 } };
  const week = () => Math.floor(day() / 7);
  const hash = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; h ^= h >>> 13; return h >>> 0 };
  const BOARD = { fernvale: { name: 'กระดานประกาศสมาคม เฟิร์นเวล', poster: 'village' }, lakenhold: { name: 'สำนักใหญ่สมาคมนักผจญภัย นครหลวง', poster: 'crown' } };
  const list = S => (S.bounties ||= []);
  /* this week's three posters on a board (the ones you already took are marked) */
  function offers(S, board) {
    const w = week(), out = [];
    for (let i = 0; i < 3; i++) {
      const h = hash(board + ':' + w + ':' + i), who = WHO[h % WHO.length], tier = board === 'lakenhold' ? 2 + (h >>> 8) % 2 : 1 + (h >>> 8) % 2, T = TIERS[tier];
      const id = board + '-' + w + '-' + i, reward = T.pay[0] + ((h >>> 12) % (T.pay[1] - T.pay[0] + 1));
      out.push({ id, name: who[0], text: who[1], kind: who[2], tier, reward, board, taken: list(S).some(b => b.id === id) });
    }
    return out;
  }
  const active = S => list(S).filter(b => b.state === 'open' || b.state === 'slain');
  function why(S, o) { if (o.taken) return 'รับไปแล้ว'; if (list(S).filter(b => b.state === 'open').length >= 2) return 'รับได้ทีละ 2 ใบ'; return '' }
  function take(S, o) { if (why(S, o)) return false; list(S).push({ id: o.id, name: o.name, text: o.text, kind: o.kind, tier: o.tier, reward: o.reward, board: o.board, until: day() + 10, state: 'open' }); return true }
  /* fail the old ones · returns lines */
  function expire(S) { const out = []; for (const b of list(S)) if (b.state === 'open' && day() > b.until) { b.state = 'failed'; root.Factions?.add('guild', -2, 'ปล่อยค่าหัว' + b.name + 'หลุดมือ'); out.push('📜 ค่าหัว ' + b.name + ' หมดเวลาแล้ว') } S.bounties = list(S).filter(b => b.state !== 'failed' && b.state !== 'paid' || day() - b.until < 14); return out }
  /* world map: give each open bounty a hex · w = world, G = WorldGen */
  function place(S, w, G) {
    for (const b of list(S)) {
      if (b.state !== 'open' || b.c != null) continue; const T = TIERS[b.tier], h = hash(b.id);
      const cands = Object.values(w.tiles).filter(t => G.BIOME[t.biome].pass && !t.poi && !t.road && !t.enc && G.dist(t, w.home) >= T.min && G.dist(t, w.home) <= T.max && !list(S).some(x => x !== b && x.c === t.c && x.r === t.r));
      if (!cands.length) continue; const t = cands[h % cands.length], foes = G.FOES[t.biome] || ['bandit'];
      b.c = t.c; b.r = t.r; b.foe = foes.includes(b.kind) ? b.kind : foes[(h >>> 5) % foes.length];
      (S.known ||= {})[t.c + ',' + t.r] = 1;   /* the poster comes with a sketch of where it was last seen */
    }
  }
  const at = (S, c, r) => list(S).find(b => b.state === 'open' && b.c === c && b.r === r) || null;
  function slain(S, b) { b.state = 'slain'; return '☠ ปราบ ' + b.name + ' แล้ว · กลับไปรับรางวัลที่กระดานประกาศของสมาคม' }
  function claim(S, board) {
    const out = [];
    for (const b of list(S)) {
      if (b.state !== 'slain') continue; b.state = 'paid'; S.gold = (S.gold || 0) + b.reward; const F = root.Factions;
      F?.add('guild', 2 + b.tier, 'ปราบ' + b.name); F?.add(BOARD[b.board]?.poster || 'village', 2, 'ปราบ' + b.name);
      const f = root.Law?.file(S, b.board); if (f?.heat) f.heat--;
      S.bountiesDone = (S.bountiesDone || 0) + 1; out.push('💰 รับค่าหัว ' + b.name + ' ' + b.reward + ' 💰');
    }
    return out;
  }
  /* the board overlay — resolves when closed */
  function panel(S, board, onChange) {
    return new Promise(res => {
      document.getElementById('bnUI')?.remove(); const d = document.createElement('div'); d.id = 'bnUI';
      d.style.cssText = 'position:fixed;inset:0;z-index:2120;display:grid;place-items:center;background:#05080dcc;font-family:VillageThai,"Noto Sans Thai",system-ui,sans-serif';
      const btn = (a, l, dis) => `<button data-a="${a}" ${dis ? 'disabled' : ''} style="margin:3px 0;padding:6px 11px;border-radius:8px;border:1px solid #7a4b06;background:linear-gradient(#f0c560,#c9902e);color:#2a1a06;font:600 13px inherit;font-family:inherit;cursor:pointer;${dis ? 'opacity:.45;cursor:default' : ''}">${l}</button>`;
      const stars = n => '☠'.repeat(n);
      const draw = note => {
        const mine = active(S), off = offers(S, board), slainN = mine.filter(b => b.state === 'slain').length;
        d.innerHTML = `<div style="width:min(660px,96vw);max-height:92vh;overflow:auto;padding:16px 18px;border-radius:16px;background:linear-gradient(#f3e6c6,#e2cfa2);color:#3a2a14;box-shadow:0 24px 60px #000c">
          <button data-x style="float:right;background:none;border:0;font-size:20px;cursor:pointer">✕</button><h2 style="margin:0 0 4px;font:800 22px Georgia,'Noto Sans Thai',serif">📜 ${BOARD[board]?.name || 'กระดานประกาศ'}</h2>
          <p style="margin:0 0 6px;font-size:13px;color:#6a5030">ประกาศใหม่ทุกสัปดาห์ · รับได้ทีละ 2 ใบ ใบละ 10 วัน · เป้าหมายปรากฏบนแผนที่โลก (☠) · ปราบแล้วกลับมารับรางวัลที่กระดานไหนก็ได้ · ปราบไปแล้ว ${S.bountiesDone || 0} ราย</p>
          ${note ? `<p style="margin:6px 0;padding:6px 10px;border-radius:8px;background:#fff9;font-size:13px">${note}</p>` : ''}
          ${mine.length ? `<h3 style="margin:8px 0 4px;font-size:15px">ที่รับไว้</h3>${mine.map(b => `<div style="padding:8px 10px;border-radius:10px;background:${b.state === 'slain' ? '#eef6e0cc' : '#fff8'};border:2px solid ${b.state === 'slain' ? '#5a9a4a' : '#b08a4a44'};margin:4px 0;font-size:13px"><b>${stars(b.tier)} ${b.name}</b> · ${b.reward} 💰 · ${b.state === 'slain' ? '✔ ปราบแล้ว รอรับรางวัล' : 'เหลือ ' + Math.max(0, b.until - day()) + ' วัน' + (b.c == null ? ' · ตำแหน่งจะขึ้นบนแผนที่โลก' : '')}</div>`).join('')}${slainN ? btn('claim', '💰 รับรางวัล ' + slainN + ' ใบ') : ''}` : ''}
          <h3 style="margin:10px 0 4px;font-size:15px">ประกาศสัปดาห์นี้</h3>
          ${off.map(o => { const w = why(S, o); return `<div style="padding:9px 10px;border-radius:12px;background:#fff8;border:2px solid #b08a4a44;margin:5px 0"><b>${stars(o.tier)} ${o.name}</b> <small style="color:#7a6040">· ${TIERS[o.tier].name} · ${o.reward} 💰</small><br><small>${o.text}</small><br>${btn('take:' + o.id, 'รับประกาศ', !!w)} <small style="color:#a0442a">${w}</small></div>` }).join('')}</div>`;
      };
      draw(expire(S).join('<br>')); document.body.append(d);
      const close = () => { removeEventListener('keydown', key, true); d.remove(); res() }, key = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close() } };
      addEventListener('keydown', key, true);
      d.onclick = e => { if (e.target === d || e.target.closest('[data-x]')) return close(); const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; const [a, id] = b.dataset.a.split(':'); let note = '';
        if (a === 'take') { const o = offers(S, board).find(x => x.id === id); note = o && take(S, o) ? '✔ รับประกาศ ' + o.name + ' แล้ว · ออกไปแผนที่โลกเพื่อดูตำแหน่ง' : (o ? why(S, o) : '') }
        else if (a === 'claim') note = claim(S, board).join('<br>');
        onChange?.(); draw(note) };
    });
  }
  root.Bounties = { TIERS, WHO, BOARD, offers, active, why, take, expire, place, at, slain, claim, panel };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Bounties;
})(typeof window !== 'undefined' ? window : globalThis);
