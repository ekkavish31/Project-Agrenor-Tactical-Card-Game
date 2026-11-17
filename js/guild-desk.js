/* v98.585 · GUILD DESK — what the counters of the Adventurers' Guild sub-map do (village-place.html, KIND 'guild').
   village-place.html sends a station action → js/village-town-bridge.js → runPlaceAction(id) → GuildDesk.run(id) here (main game page).
   The contract rules are the SAME as the guild room of js/interior.js (3 offers a day seeded by the day, one at a time, counted by S.kills on the world map) and use the
   same save fields (S.guild), so a contract taken in either place is the same contract.
     register  → the registrar: the card book (สมุดผนึก) and rank talk (story scene guildFirst, replayable)
     contracts → the contract officer: take / turn in / drop a guild contract
     bounty    → the bounty board (js/bounties.js, loaded on demand)
     cards     → the card counter: the card shop (js/card-sources.js renderShop)
   STAFF lists the guild's people by post (all unnamed for now — names are the owner's to give; drawn with code in the sub-map). */
(function (root) {
  'use strict';
  /* v98.586 · the staff, named and characterised by the owner's delegation (16 Nov 2026 · "กำหนดมาให้ได้เลย") — guild employees, not villagers of the roster */
  const STAFF = {
    registrar: { name: 'ฟรีดา', title: 'เจ้าหน้าที่ทะเบียน', age: 29, post: 'เคาน์เตอร์ทะเบียน', vendor: 'g1', trait: 'ละเอียด ใจเย็น จำหน้าทุกคนที่เคยลงทะเบียนได้ ชอบชาอุ่น ไม่ชอบสมุดยับ',
      lines: ['ลงทะเบียน ต่ออายุแรงก์ หรือสมุดผนึกมีปัญหา มาที่นี่ได้เลย', 'สมุดหายเมื่อไหร่มาแจ้งนะ อย่าปล่อยไว้ — แล้วก็อย่าพับมุมกระดาษ'] },
    officer: { name: 'แกเร็ธ', title: 'เจ้าหน้าที่จัดงาน', age: 46, post: 'โต๊ะงานกิลด์', vendor: 'g2', trait: 'อดีตนักผจญภัยแรงก์ C เข่าเจ็บจนต้องมานั่งโต๊ะ พูดตรง ห้าวแต่ใจดี',
      lines: ['งานวันนี้มีสามอย่าง เลือกเอาสักงาน รับได้ทีละงานนะ', 'ล้มให้ครบก่อนค่อยกลับมาส่งงาน ข้าไม่จ่ายครึ่งเดียว'] },
    appraiser: { name: 'ออสวิน', title: 'ผู้ประเมินการ์ด', age: 61, post: 'ตู้การ์ด', vendor: 'g3', trait: 'เคยทำงานในโรงผลิตการ์ดของหน่วยงานหลวง ดูออกว่าการ์ดใบไหนใครผลิต พูดช้า ชอบอธิบาย',
      lines: ['การ์ดทุกใบมีคนทำ ดูลายวงจรก็รู้ว่ามาจากโรงไหน', 'อยากได้การ์ดใหม่ ดูในตู้ได้เลย ราคาตามความหายาก'] },
    keeper: { name: 'ไนลา', title: 'ผู้ดูแลกระดานประกาศ', age: 24, post: 'กระดานประกาศจับ', vendor: 'g4', trait: 'ชอบข่าวลือ เขียนประกาศเองทุกใบ ตื่นเต้นทุกครั้งที่มีค่าหัวใหม่',
      lines: ['ค่าหัวเปลี่ยนทุกสัปดาห์ ใบนี้ข้าเพิ่งเขียนเมื่อเช้า!', 'ใบไหนถูกฉีกไปแล้วก็มีคนรับไปแล้วนะ'] }
  };
  const ACTIONS = { register: 'คุยกับเจ้าหน้าที่ทะเบียน', contracts: 'งานกิลด์', bounty: 'ประกาศจับ', cards: 'ตู้การ์ด' };
  const L = () => root.VillageLife, day = () => { try { return root.VillageClock.read().day } catch (e) { return 1 } };
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toast = m => { try { root.toast ? root.toast(m) : (document.getElementById('message') && (document.getElementById('message').textContent = m)) } catch (e) { } };

  /* ---------- contracts (same rules as js/interior.js) ---------- */
  function contract(S) {
    S.guild ||= {}; const d = day(), G = S.guild;
    if (G.day !== d) { let h = d * 2654435761 >>> 0; const r = () => (h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296;
      G.day = d; G.taken = false; G.offers = [['กวาดล้างสัตว์ร้ายรอบหมู่บ้าน', 3], ['คุ้มกันทางเกวียน', 5], ['ล่าค่าหัวกลุ่มโจรป่า', 7]].map(([t, n]) => { const k = n + Math.floor(r() * 3); return { label: t + ' (ล้ม ' + k + ' ตัว)', n: k, reward: 25 + k * 11 } }) }
    return G;
  }
  function take(S, i) { const G = contract(S), o = G.offers[i]; if (!o || G.taken || G.active) return ''; G.active = { ...o, base: S.kills || 0 }; G.taken = true; return '📜 รับงาน: ' + o.label }
  function turnin(S) {
    const G = contract(S), a = G.active; if (!a || (S.kills || 0) - a.base < a.n) return '';
    const FC = root.Factions; a.reward = Math.round(a.reward * (FC?.payMult?.('guild') ?? 1) * (1 + .15 * (root.Offices?.perk?.(S, 'magus') || 0)));
    S.gold += a.reward; FC?.add?.('guild', 6, 'ส่งงาน ' + a.label); root.Law?.service?.(S, 'fernvale'); FC?.add?.('village', 2, 'ช่วยกำจัดภัยรอบหมู่บ้าน'); G.done = (G.done || 0) + 1; G.active = null;
    return '✔ ส่งงานกิลด์ +' + a.reward + '💰';
  }
  function drop(S) { const G = contract(S); G.active = null; return 'ยกเลิกงานแล้ว' }

  /* ---------- the contract window ---------- */
  function openContracts() {
    const lib = L(); if (!lib?.save) return; let S = lib.save();
    document.getElementById('gdUI')?.remove(); const d = document.createElement('div'); d.id = 'gdUI';
    d.style.cssText = 'position:fixed;inset:0;z-index:2120;display:grid;place-items:center;background:#05080dcc;font-family:VillageThai,AgThai,system-ui,sans-serif';
    const btn = (a, l, dis) => `<button data-a="${a}" ${dis ? 'disabled title="' + esc(dis) + '"' : ''} style="display:block;width:100%;text-align:left;margin:5px 0;padding:9px 12px;border-radius:9px;border:1px solid #7a4b06;background:${dis ? '#d8c9a4' : 'linear-gradient(#f0c560,#c99a38)'};color:#3a2a14;font:600 14.5px inherit;cursor:${dis ? 'default' : 'pointer'}">${l}</button>`;
    const draw = note => {
      S = lib.save(); const G = contract(S), a = G.active, k = a ? Math.max(0, (S.kills || 0) - a.base) : 0, done = a && k >= a.n, st = STAFF.officer;
      d.innerHTML = `<div style="width:min(520px,94vw);max-height:90vh;overflow:auto;padding:16px 18px;border-radius:16px;background:linear-gradient(#f3e6c6,#e2cfa2);color:#3a2a14;box-shadow:0 24px 60px #000c;border:3px solid #7a5a2a">
        <button data-x style="float:right;background:none;border:0;font-size:20px;cursor:pointer">✕</button>
        <h2 style="margin:0 0 2px;font:800 21px AgThai,Georgia,serif">📜 งานกิลด์</h2>
        <p style="margin:0 0 10px;font-size:13px;color:#6a5030">${esc(st.name)} · ${esc(st.title)}: “${esc(st.lines[a ? 1 : 0])}”</p>
        ${a ? btn('turnin', done ? `✔ ส่งงาน ${esc(a.label)} · +${a.reward}💰` : `⏳ ${esc(a.label)} · ${k}/${a.n}`, done ? '' : 'ล้มศัตรูบนแผนที่โลกให้ครบก่อน') + (done ? '' : btn('drop', '✕ ยกเลิกงานนี้'))
          : G.offers.map((o, i) => btn('take:' + i, `📜 ${esc(o.label)} → ${o.reward}💰`, G.taken ? 'วันนี้รับงานไปแล้ว พรุ่งนี้มีงานใหม่' : '')).join('')}
        <p style="font-size:12px;color:#6a5030;margin:10px 0 0">งานใหม่ทุกวัน · รับได้ทีละงาน · นับจากศัตรูที่ล้มบนแผนที่โลก${G.done ? ' · ส่งงานสำเร็จแล้ว ' + G.done + ' ครั้ง' : ''}</p>${note ? `<p style="margin:8px 0 0;font-weight:700">${esc(note)}</p>` : ''}</div>`;
    };
    d.addEventListener('click', e => {
      if (e.target === d || e.target.closest('[data-x]')) { d.remove(); return }
      const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; const a = b.dataset.a; S = lib.save(); let m = '';
      if (a.startsWith('take:')) m = take(S, +a.slice(5)); else if (a === 'turnin') m = turnin(S); else if (a === 'drop') m = drop(S);
      lib.writeSave(S); try { root.render?.() } catch (x) { } draw(m); if (m) toast(m);
    });
    document.body.append(d); draw('');
  }
  /* ---------- bounty board (js/bounties.js is loaded only when it is needed) ---------- */
  function loadOnce(src, name) { return root[name] ? Promise.resolve(true) : new Promise(r => { const s = document.createElement('script'); s.src = src + '?v=' + (root.GAME_VERSION?.v || ''); s.onload = () => r(!!root[name]); s.onerror = () => r(false); document.head.append(s) }) }
  async function openBounty() {
    const ok = await loadOnce('js/bounties.js', 'Bounties'), lib = L(); if (!ok || !lib?.save) { toast('กระดานประกาศจับยังเปิดไม่ได้'); return }
    const S0 = lib.save(); root.Bounties.panel(S0, 'fernvale', () => { lib.writeSave(S0); try { root.render?.() } catch (e) { } });
  }
  /* ---------- the registrar ---------- */
  async function register() {
    try { if (await root.Story?.guildFirst?.()) return } catch (e) { }
    const st = STAFF.registrar, rank = 'F';
    const html = `<p><b>${esc(st.name)}</b> · ${esc(st.title)}: “${esc(st.lines[0])}”</p><p>แรงก์ของคุณ: <b>${rank}</b> · สมุดผนึกใช้งานได้ปกติ</p><p class="muted small">สมุดผนึกแปลงของที่ใส่ลงไปเป็นการ์ด · เปิดดูได้ที่ปุ่ม 📖 สมุดผนึก</p>
      <p><button onclick="window.Story?.play?.('guildFirst')">🔁 ฟังคำอธิบายเรื่องสมุดผนึกอีกครั้ง</button></p>`;
    if (typeof villageDialog === 'function') villageDialog('เคาน์เตอร์ทะเบียน', html);
  }
  function run(id) {
    if (id === 'register') return register();
    if (id === 'contracts') return openContracts();
    if (id === 'bounty') return openBounty();
    if (id === 'cards') { if (root.CardSources?.renderShop) return root.CardSources.renderShop(); toast('ตู้การ์ดยังไม่เปิด') }
  }
  /* the station list the main page shows for location 'guild' (js/station-actions.js) */
  const actions = () => [
    { id: 'register', name: ACTIONS.register, image: 'action-orders', kind: 'guild', cost: 'แรงก์ F', effect: 'สมุดผนึก · ทะเบียน' },
    { id: 'contracts', name: ACTIONS.contracts, image: 'action-orders', kind: 'guild', cost: 'งานละวัน', effect: 'รับ · ส่ง · ยกเลิกงาน' },
    { id: 'bounty', name: ACTIONS.bounty, image: 'action-orders', kind: 'guild', cost: 'ทุกสัปดาห์', effect: 'ค่าหัวมอนสเตอร์' },
    { id: 'cards', name: ACTIONS.cards, image: 'action-buy', kind: 'guild', cost: '◉', effect: 'ซื้อการ์ดใหม่' }
  ];
  root.GuildDesk = { STAFF, ACTIONS, contract, take, turnin, drop, run, actions, openContracts, openBounty, register };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.GuildDesk;
})(typeof window !== 'undefined' ? window : globalThis);
