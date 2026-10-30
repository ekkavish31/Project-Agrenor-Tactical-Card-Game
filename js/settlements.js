/* v97.43 · T1: the settlements of the valley as data (docs/TODO.md "T ที่อยู่ เมือง แฟคชั่น และการปกครอง").
   size: village · town · city  — decides the defence (village watch · town guard · city garrison with a general) and the land price.
   ruler: the faction that governs it (js/factions.js) — your standing with it changes prices there.
   goods: what is cheap there (made locally) and what is dear (brought in) — the base for trade runs later (T6 / L3).
   land: weekly rent for a plot inside the walls (T4) · outside the walls land is free but raided (T5).
   farmland: the village has fields to rent for a farm (v97.77 · the user: farming only where a place has land for it, or outside towns).
   Fernvale is the home village; the other three are the towns placed on the world map by js/world-gen.js (TOWNS). */
(function (root) {
  'use strict';
  const SIZE = {
    village: { name: 'หมู่บ้าน', defence: 'ยามหมู่บ้าน', guards: 2, safety: .55 },
    town: { name: 'เมือง', defence: 'กองยามประจำเมือง', guards: 8, safety: .75 },
    city: { name: 'เมืองใหญ่', defence: 'กองทหารรักษาการณ์และแม่ทัพ', guards: 30, safety: .92 }
  };
  const GOODS = { food: 'เสบียง', potion: 'ยาฟื้นฟู', iron: 'แท่งเหล็ก', wood: 'ไม้', fish: 'ปลาเค็ม', salt: 'เกลือ', cloth: 'ผ้าทอ', herbs: 'สมุนไพร', fur: 'ขนสัตว์', ore: 'แร่', dye: 'ผ้าย้อมสี', crystal: 'ผลึก', wine: 'ไวน์' };
  const SETTLEMENTS = {
    fernvale: { name: 'หมู่บ้านเฟิร์นเวล', size: 'village', farmland: true, ruler: 'village', leader: 'ผู้ใหญ่บ้านโอเรน', land: 15, cheap: ['wood', 'herbs', 'food'], dear: ['salt', 'ore'],
      text: 'หมู่บ้านบ้านเกิดริมป่า มีโรงตีเหล็ก ตลาดเล็ก และสมาคมนักผจญภัย' },
    brookmere: { name: 'หมู่บ้านบรู๊คเมียร์', size: 'village', farmland: true, ruler: 'village', leader: 'ผู้ใหญ่บ้านแอนนา', land: 12, cheap: ['food', 'cloth'], dear: ['iron', 'potion'],
      text: 'หมู่บ้านเกษตรเล็ก ๆ ริมลำธาร ทุ่งดอกไม้ล้อมรอบ ผู้คนรู้จักเฟิร์นเวลดี' },
    haven: { name: 'ท่าเรือซอลต์เฮเวน', size: 'city', ruler: 'merchants', leader: 'สภาพ่อค้าแห่งท่าเรือ', land: 60, cheap: ['fish', 'salt', 'potion'], dear: ['wood', 'fur'],
      text: 'เมืองท่าเสียงดัง กลิ่นปลาเค็มและเกลือทะเล เรือสินค้าจอดเรียงเต็มท่า' },
    northgate: { name: 'ด่านหินเหนือ', size: 'town', ruler: 'garrison', leader: 'แม่ทัพเฝ้าด่าน', land: 30, cheap: ['iron', 'ore', 'fur'], dear: ['food', 'herbs'],
      text: 'ด่านหินบนช่องเขา ทหารเฝ้าทางขึ้นเหนือ นักเดินทางแวะพักก่อนข้ามเขา' },
    /* v97.72 · the Kingdom of Aldren (docs/PROPOSAL-SETTLEMENTS.md): its royal capital on the lake, and four villages around the plain.
       Lakenhold is the "เมืองใหญ่" the villagers talk about — closed until the prologue is over (js/world-map.js). */
    lakenhold: { name: 'นครหลวงลาเคนฮอลด์', size: 'city', ruler: 'crown', leader: 'เจ้าเมืองผู้ปกครองแทนพระราชา', land: 80, cheap: ['dye', 'cloth', 'potion'], dear: ['food', 'wood', 'fur', 'crystal'],
      text: 'นครหลวงแห่งราชอาณาจักรอัลเดรน ริมทะเลสาบ กำแพงสูง สะพานหิน หอคอยเวท พิพิธภัณฑ์ และตลาดที่ใหญ่ที่สุดในที่ราบ', capital: true },
    willowshore: { name: 'หมู่บ้านวิลโลว์ชอร์', size: 'village', farmland: true, ruler: 'crown', leader: 'ผู้ใหญ่บ้านมาร์ติน', land: 12, cheap: ['fish', 'cloth', 'food'], dear: ['iron', 'wood'],
      text: 'หมู่บ้านชาวประมงใต้ต้นหลิว เรือพายจอดเรียงริมทะเลสาบ มีเรือข้ามฟากไปนครหลวง' },
    deepcairn: { name: 'หมู่บ้านดีปแคร์น', size: 'village', ruler: 'crown', leader: 'หัวหน้าคนงานเหมืองโบดิล', land: 10, cheap: ['ore', 'crystal', 'iron'], dear: ['food', 'herbs', 'wine'],
      text: 'หมู่บ้านคนงานเหมืองบนลานหิน เสียงค้อนดังทั้งวัน ปากเหมืองเรืองแสงจาง ๆ ตอนกลางคืน' },
    thornwatch: { name: 'ธอร์นวอตช์', size: 'village', ruler: 'guild', leader: 'ผู้ดูแลค่ายของสมาคม', land: 8, cheap: ['fur', 'herbs', 'wood'], dear: ['salt', 'potion', 'cloth'],
      text: 'ค่ายรั้วไม้ที่ปากช่องเขาตะวันออก จุดพักสุดท้ายของนายพรานและนักสำรวจก่อนเข้าป่าใหญ่' },
    vinehollow: { name: 'หมู่บ้านไวน์ฮอลโลว์', size: 'village', farmland: true, ruler: 'temple', leader: 'นักบวชผู้ดูแลศาลเจ้า', land: 12, cheap: ['wine', 'food'], dear: ['fish', 'cloth'],
      text: 'หมู่บ้านไร่องุ่นบนดินแดงทางใต้ มีบ่อน้ำร้อนข้างศาลเจ้าเก่า ไอน้ำลอยขึ้นทุกเช้า' }
  };
  /* v97.72 · people you meet in the new places: [name, role, lines] (lines may use {name} for the hero) */
  const LOCALS = {
    lakenhold: [['อาจารย์ซีลัส', 'นักเวทแห่งหอคอย', ['มิรายังสอนเด็ก ๆ อยู่ที่เฟิร์นเวลหรือ? บอกนางด้วยว่าหอคอยยังเก็บห้องทดลองของนางไว้… ห้องที่ไหม้ไปครึ่งหนึ่งนั่นแหละ', 'เวทไม่ใช่ของเล่น แต่ก็ไม่ใช่ของต้องห้าม หอคอยรับคนที่อยากเรียนจริงเสมอ']],
      ['ท่านหญิงโอเดตต์', 'นักโบราณคดีของพิพิธภัณฑ์', ['ผลึกเรืองแสงพวกนั้น … ไม่มีใครรู้ว่ามันเรืองเพราะอะไร ถ้าเจออีกเอามาให้ข้าดูก่อนใคร', 'จารึกที่พบในป่าตะวันออกใช้ตัวอักษรที่ไม่มีใครอ่านออก แต่ลายเส้นบางเส้นซ้ำกันอย่างจงใจ']],
      ['จ่าฮาโรลด์', 'ทหารหน้าประตูเมือง', ['คนจากเฟิร์นเวลรึ? หมู่บ้านเล็กแต่ส่งของดีมาเสมอ ผ่านไปได้', 'ในเมืองหลวงอย่าเดินเข้าย่านริมน้ำตอนกลางคืนคนเดียว']]],
    willowshore: [['ป้ากรีตา', 'แม่ค้าปลา ญาติของโจ', ['เจ้ารู้จักโจหรือ? เด็กคนนั้นออกไปตกปลาที่เฟิร์นเวลแล้วไม่ยอมกลับมาเลย', 'ปลาทะเลสาบหวานกว่าปลาทะเล ไม่เชื่อลองชิมดู']],
      ['ลุงเฟอร์กัส', 'คนพายเรือข้ามฟาก', ['ข้ามไปนครหลวงสามชั่วโมง ถ้าลมดีก็เร็วกว่านั้น', 'บางคืนกลางทะเลสาบมีแสงสะท้อนขึ้นมาจากใต้น้ำ ข้าไม่เคยพายเข้าไปใกล้']]],
    deepcairn: [['โบดิล', 'หัวหน้าคนงานเหมือง', ['ขาดคนงานทุกวัน ถ้าอยากได้เงินจริงก็มาจับพลั่ว', 'ชั้นล่างของเหมืองเราปิดไว้แล้ว ไม่ใช่เพราะแร่หมด']],
      ['เทลมา', 'ช่างเจียผลึก', ['ผลึกที่นี่ราคาขึ้นทุกเดือน พ่อค้าจากนครหลวงมากว้านซื้อไม่หยุด', 'ผลึกบางก้อนอุ่นเหมือนมีชีวิต … ข้าไม่ชอบจับนาน ๆ']]],
    thornwatch: [['เรนัลด์', 'ผู้ดูแลค่ายของสมาคม', ['เกินรั้วนี้ไปคือป่าใหญ่ทางตะวันออก ลงชื่อไว้ก่อนออก จะได้รู้ว่าใครไม่กลับมา', 'สมาคมจ่ายดีสำหรับแผนที่ชายป่า แต่ไม่มีใครจ่ายให้ศพ']],
      ['ไอวี', 'นายพรานหญิง', ['รอยเท้าสัตว์ในป่าลึกใหญ่กว่าที่ควรจะเป็น', 'ข้าตามกวางเข้าไปสองวัน วันที่สามรู้สึกว่ามีอะไรตามข้าอยู่ เลยกลับ']]],
    vinehollow: [['นักบวชเบเนดิกต์', 'ผู้ดูแลศาลเจ้า', ['บ่อน้ำร้อนนี้อุ่นมาตั้งแต่ก่อนมีหมู่บ้าน ชาวบ้านเชื่อว่าเป็นพรจากใต้พิภพ', 'ทางใต้ไกลออกไปคือแดนภูเขาไฟ อย่าเดินทางไปโดยไม่มีน้ำติดตัว']],
      ['ซาบีน', 'เจ้าของไร่องุ่น', ['ไวน์ปีนี้หวานกว่าทุกปี ดินแดงตรงนี้ปลูกอะไรก็งาม', 'พ่อค้าจากนครหลวงชอบไวน์เรา แต่ต่อราคาเก่งเหลือเกิน']]]
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
  /* v97.68 · T8 phase 2: a seat on Fernvale's council (standing 60 with the village and 3 village projects built).
     A councillor sets Fernvale's policy free of charge and takes a weekly share of the village chest — the policy decides how much,
     and how the villagers feel about it (high tax pays most but costs standing). Stored in the game save: village.council. */
  const COUNCIL_PAY = { tax_high: 45, tax_low: 10, trade: 30, safety: 20, festival: 15 };
  const COUNCIL_REP = { tax_high: -3, tax_low: 3, trade: 1, safety: 1, festival: 3 };
  const gm = () => { try { return root.WorldState?.game?.() } catch (e) { return null } };
  const councillor = () => !!gm()?.village?.council;
  function councilWhy() {
    const g = gm(), F = root.Factions, VP = root.VillageProjects; if (!g) return 'ยังไม่ได้เริ่มเกม'; if (g.village.council) return 'เป็นสมาชิกสภาอยู่แล้ว';
    const rep = F?.rep('village') || 0; if (rep < 60) return 'ต้องมีชื่อเสียงกับหมู่บ้านเฟิร์นเวล 60 (ตอนนี้ ' + rep + ')';
    const built = VP ? Object.keys(VP.PROJECTS).filter(k => VP.has(k)).length : 0; if (built < 3) return 'ต้องช่วยสร้างโครงการพัฒนาหมู่บ้าน 3 อย่าง (ตอนนี้ ' + built + ')';
    return '';
  }
  function joinCouncil() { if (councilWhy()) return false; const g = gm(); g.village.council = { since: g.day || 1, week: g.day || 1 }; try { root.WorldState.commit?.() } catch (e) { } return true }
  function councilSettle() {
    const g = gm(), c = g?.village?.council, out = []; if (!c) return out;
    while ((g.day || 1) - c.week >= 7) { const p = policy('fernvale'); g.village.coins = (g.village.coins || 0) + COUNCIL_PAY[p]; root.Factions?.add('village', COUNCIL_REP[p], 'นโยบาย' + POLICIES[p].name + 'ของสภา'); out.push(`🪑 ส่วนแบ่งจากสภาหมู่บ้าน +${COUNCIL_PAY[p]} 💰 · ชาวบ้าน${COUNCIL_REP[p] < 0 ? 'บ่นเรื่อง' : 'ชอบ'}${POLICIES[p].name}`); c.week += 7 }
    if (out.length) try { root.WorldState.commit?.() } catch (e) { } return out;
  }
  function petition(id, pol) {
    const T = SETTLEMENTS[id], F = root.Factions, g = root.WorldState?.game?.(); if (!T || !POLICIES[pol] || !g) return 'ไม่มีนโยบายนี้';
    if (id === 'fernvale' && g.village.council) { (g.village.policy ||= {})[id] = { id: pol, month: month() }; try { root.WorldState.commit?.() } catch (e) { } return '' }   /* the council decides */
    if ((F?.rep(T.ruler) || 0) < 50) return 'ต้องมีชื่อเสียง "นับถือ" (50) กับ' + (F?.FACTIONS[T.ruler]?.name || T.ruler);
    if ((g.village.coins || 0) < 80) return 'ค่าธรรมเนียมยื่นคำร้อง 80 💰';
    g.village.coins -= 80; (g.village.policy ||= {})[id] = { id: pol, month: month() }; try { root.WorldState.commit?.() } catch (e) { } return '';
  }
  function petitionPanel(id) {
    return new Promise(res => {
      const T = SETTLEMENTS[id]; if (!T) return res(); document.getElementById('stPet')?.remove(); const d = document.createElement('div'); d.id = 'stPet';
      d.style.cssText = 'position:fixed;inset:0;z-index:2150;display:grid;place-items:center;background:#05080dcc;font-family:VillageThai,"Noto Sans Thai",system-ui,sans-serif';
      const draw = msg => {
      const cur = policy(id), F = root.Factions, rep = F?.rep(T.ruler) || 0, home = id === 'fernvale', seat = home && councillor(), cw = home && !seat ? councilWhy() : '';
      const share = k => seat ? ` <small>· ส่วนแบ่ง ${COUNCIL_PAY[k]} 💰/สัปดาห์ · ชาวบ้าน ${COUNCIL_REP[k] > 0 ? '+' : ''}${COUNCIL_REP[k]}</small>` : '';
      d.innerHTML = `<div style="width:min(580px,94vw);max-height:92vh;overflow:auto;padding:16px 18px;border-radius:16px;background:linear-gradient(#f3e6c6,#e2cfa2);color:#3a2a14;box-shadow:0 24px 60px #000c">
        <button data-x style="float:right;background:none;border:0;font-size:20px;cursor:pointer">✕</button><h2 style="margin:0 0 4px;font:800 21px Georgia,'Noto Sans Thai',serif">${seat ? '🪑 สภาหมู่บ้านเฟิร์นเวล' : '📜 ยื่นคำร้องต่อ' + T.leader}</h2>
        <p style="margin:0 0 8px;font-size:13px;color:#6a5030">${seat ? 'คุณเป็นสมาชิกสภา · เลือกนโยบายของเดือนนี้ได้ฟรี · ได้ส่วนแบ่งทุกสัปดาห์ตามนโยบาย' : `เลือกนโยบายของ${T.name}ไปจนจบเดือนนี้ · ต้องมีชื่อเสียง "นับถือ" (50) กับ${F?.FACTIONS[T.ruler]?.name || T.ruler} (ตอนนี้ ${rep}) · ค่าธรรมเนียม 80 💰`}</p><p class="msg" style="font-size:13px;margin:4px 0">${msg || ''}</p>
        ${Object.entries(POLICIES).map(([k, P]) => `<button data-p="${k}" ${k === cur ? 'disabled' : ''} style="display:block;width:100%;text-align:left;margin:4px 0;padding:8px 10px;border-radius:9px;border:1px solid #7a4b06;background:${k === cur ? '#d8c8a0' : 'linear-gradient(#f0c560,#c9902e)'};color:#2a1a06;font:600 13px inherit;font-family:inherit;cursor:pointer">${P.icon} <b>${P.name}</b> — ${P.text}${k === cur ? ' (ตอนนี้)' : ''}${share(k)}</button>`).join('')}
        ${home && !seat ? `<div style="margin-top:10px;padding:9px 10px;border-radius:10px;background:#fff8;font-size:13px"><b>🪑 เข้าสภาหมู่บ้าน</b> — ตั้งนโยบายเฟิร์นเวลได้เองฟรี และได้ส่วนแบ่งรายสัปดาห์ · ต้องมีชื่อเสียงกับหมู่บ้าน 60 และช่วยสร้างโครงการพัฒนาหมู่บ้าน 3 อย่าง<br><button data-join ${cw ? 'disabled' : ''} style="margin-top:6px;padding:6px 11px;border-radius:8px;border:1px solid #7a4b06;background:linear-gradient(#f0c560,#c9902e);font:600 13px inherit;font-family:inherit;cursor:pointer;${cw ? 'opacity:.45' : ''}">🪑 ขอเข้าสภา</button> <small style="color:${cw ? '#a0442a' : '#3a7a2a'}">${cw || '✔ คุณสมบัติครบ'}</small></div>` : ''}</div>`;
      };
      draw(id === 'fernvale' ? councilSettle().join('<br>') : ''); document.body.append(d);
      d.onclick = e => { if (e.target === d || e.target.closest('[data-x]')) { d.remove(); return res() } if (e.target.closest('[data-join]')) { if (joinCouncil()) { root.Factions?.add('village', 2, 'ได้รับเลือกเข้าสภาหมู่บ้าน'); draw('🪑 ยินดีด้วย คุณได้เป็นสมาชิกสภาหมู่บ้านเฟิร์นเวลแล้ว') } return } const b = e.target.closest('[data-p]'); if (!b || b.disabled) return; const w = petition(id, b.dataset.p); if (w) d.querySelector('.msg').textContent = '✖ ' + w; else { d.remove(); res(b.dataset.p) } };
    });
  }
  const polMult = (id, good) => { const p = policy(id); return p === 'tax_high' ? 1.1 : p === 'tax_low' ? .95 : p === 'trade' ? .97 : p === 'festival' && good === 'inn' ? .5 : 1 };
  function price(id, good, base) {
    const T = SETTLEMENTS[id]; if (!T) return base; const F = root.Factions;
    const local = T.cheap.includes(good) ? .75 : T.dear.includes(good) ? 1.35 : 1;
    return Math.max(1, Math.round(base * local * swing(id, good) * polMult(id, good) * (F ? F.priceMult(T.ruler) : 1) * (T.capital ? 1 - .03 * (root.Offices?.perk?.(wsave(), 'royal') || 0) : 1)));
  }
  const wsave = () => { try { return root.WorldState?.world?.() } catch (e) { return null } };   /* v97.72 · the royal guard's discount reads the world save */
  const info = id => { const T = SETTLEMENTS[id]; return T && { ...T, id, sizeInfo: SIZE[T.size] } };
  function card(id) {
    const T = info(id); if (!T) return ''; const F = root.Factions, R = F?.FACTIONS[T.ruler], tier = F?.tier(T.ruler);
    const g = list => list.map(k => GOODS[k] || k).join(' · ');
    return `<div style="font-size:12.5px;line-height:1.7;margin:6px 0;padding:8px 10px;border-radius:10px;background:#0001">🏛 <b>${T.sizeInfo.name}</b> · ปกครองโดย ${R ? R.icon + ' ' + R.name : T.ruler} (${T.leader})${tier ? ` · ชื่อเสียงของคุณ: <b style="color:${tier[2]}">${tier[1]}</b>` : ''}<br>🛡 ${T.sizeInfo.defence} · ⬇ ของถูก: ${g(T.cheap)} · ⬆ ของแพง: ${g(T.dear)}<br>📜 นโยบายเดือนนี้: ${POLICIES[policy(id)].icon} <b>${POLICIES[policy(id)].name}</b> — ${POLICIES[policy(id)].text}<br>🏠 เช่าที่ในเมือง ${T.land} 💰/สัปดาห์ · นอกเมืองจับจองฟรีแต่เสี่ยงโดนบุก</div>`;
  }
  /* ---------- v97.44 · T6 lite: trade goods between towns ----------
     Buy where a good is made (cheap), sell where it is brought in (dear). Selling pays 80 % of the local price. Cargo lives in the world
     save (S.cargo) and is limited by the wagon (CARGO_MAX). A trade of 5+ units raises standing with the merchants. */
  const TRADE = { fish: 6, salt: 8, cloth: 10, iron: 6, fur: 12, ore: 7, herbs: 5, wood: 4, dye: 14, crystal: 20, wine: 11 };   /* v97.72 · dye, crystal, wine */
  const CARGO_MAX = 12, WAGON = [[150, 'เกวียนสองล้อ', 20], [300, 'เกวียนใหญ่ลากด้วยวัว', 30]], ESCORT = { cost: 30, days: 3 };
  const cargoMax = S => (S.wagon ? WAGON[S.wagon - 1][2] : CARGO_MAX) + 5 * (root.Offices?.perk?.(S, 'harbor') || 0);   /* v97.68 · harbour office */
  function wagonUp(S) { const w = WAGON[S.wagon || 0]; if (!w || (S.gold || 0) < w[0]) return false; S.gold -= w[0]; S.wagon = (S.wagon || 0) + 1; return true }
  const escorted = S => (S.escortUntil || 0) >= (root.WorldState?.game?.()?.day || 1) || (root.Offices?.perk?.(S, 'garrison') || 0) >= 4;   /* v97.68 · a vice-general's soldiers ride along */
  function hireEscort(S) { if ((S.gold || 0) < ESCORT.cost) return false; S.gold -= ESCORT.cost; S.escortUntil = (root.WorldState?.game?.()?.day || 1) + ESCORT.days - 1; return true }
  /* T6 phase 2: losing a fight (or fleeing) on the road costs part of the cargo — little when escorted */
  function loseCargo(S, share) { const out = []; for (const k of Object.keys(S.cargo || {})) { const n = Math.ceil(S.cargo[k] * share); if (!n) continue; S.cargo[k] -= n; if (S.cargo[k] <= 0) delete S.cargo[k]; out.push(GOODS[k] + ' ' + n) } return out }
  const buyPrice = (id, k) => price(id, k, TRADE[k]);
  const sellPrice = (id, k) => { const T = SETTLEMENTS[id]; if (!T) return 0; const local = T.cheap.includes(k) ? .75 : T.dear.includes(k) ? 1.35 : 1; return Math.max(1, Math.floor(TRADE[k] * local * swing(id, k) * (policy(id) === 'trade' ? 1.1 : 1) * (1 + .05 * (root.Offices?.perk?.((() => { try { return root.WorldState?.world?.() } catch (e) { return null } })(), 'eye') || 0)) * .8)) };
  const load = S => Object.values(S.cargo || {}).reduce((a, n) => a + n, 0);
  function trade(id, S, k, n) {   /* n > 0 buy, n < 0 sell · returns the gold moved or 0 */
    S.cargo ||= {}; if (!TRADE[k] || !SETTLEMENTS[id]) return 0;
    if (n > 0) { n = Math.min(n, cargoMax(S) - load(S), Math.floor((S.gold || 0) / buyPrice(id, k))); if (n <= 0) return 0; const c = n * buyPrice(id, k); S.gold -= c; S.cargo[k] = (S.cargo[k] || 0) + n; if (n >= 5) root.Factions?.add('merchants', 1, 'ซื้อ' + GOODS[k] + 'ที่' + SETTLEMENTS[id].name); return -c }
    n = Math.min(-n, S.cargo[k] || 0); if (n <= 0) return 0; const g = n * sellPrice(id, k); S.gold += g; S.traded = (S.traded || 0) + n; S.cargo[k] -= n; if (!S.cargo[k]) delete S.cargo[k]; if (n >= 5) root.Factions?.add('merchants', 1, 'ขาย' + GOODS[k] + 'ที่' + SETTLEMENTS[id].name); return g;
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
  root.Settlements = { LOCALS, POLICIES, policy, petition, petitionPanel, COUNCIL_PAY, COUNCIL_REP, councillor, councilWhy, joinCouncil, councilSettle, SIZE, GOODS, SETTLEMENTS, BASE, price, info, card, TRADE, CARGO_MAX, WAGON, ESCORT, cargoMax, wagonUp, escorted, hireEscort, loseCargo, swing, news, buyPrice, sellPrice, load, trade, tradePanel };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Settlements;
})(typeof window !== 'undefined' ? window : globalThis);
