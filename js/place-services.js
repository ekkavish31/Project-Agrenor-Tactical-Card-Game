/* v98.1190 · PlaceServices — the rules of what a place SELLS / DOES for the player (TODO §45 step B): healer (treat the party · potions) · shop / market (potions · travel food · trade) · temple (prayer · offering) ·
   guild contracts / bounties · a household's goods (house) · "steal". Moved out of js/interior.js unchanged so the sub-map engine (village-place.html) can use the same rules.
   PlaceServices.create(E) → { services(), service(key), contract(), missing(), healCost(), PRICE, keeperIn(), HOUSE_SVC }
   + inn / healer panels: openWard() · rest(cost) · partyPanel()
   E = the host's accessors:  S (get / set the save snapshot) · L (VillageLife) · CLK (VillageClock) · KIND · OWNER · people (Map of the people in the room) · hud ({_html}) · hudSync() · talk(actor, line) · toast(text) · esc(text)
       · modalOpen / dlg (get / set) · close() · heroName() · MIND · wait(ms) · resetRoom() (the room's people are rebuilt) */
(function (root) {
  'use strict';
  function create(E) {
    const { L, CLK, KIND, OWNER, people, hud, hudSync, toast, esc, hero, VISIT, MIND, heroName, fill, faceOf, leave, farmDo, syncPeople, workPanel } = E;
    const VP = id => !!window.VillageProjects?.has(id);   /* v97.35 · R3 village projects: herb garden, granary, shrine */
    /* v97.41 · prices also follow your standing (js/factions.js): merchants for the shop and market, the village for the healer */
    const FC = () => window.Factions, standing = () => FC()?.priceMult(KIND === 'healer' ? 'village' : 'merchants') ?? 1;
    const PRICE = { get potion() { return Math.max(5, Math.round(((KIND === 'healer' ? 15 : 18) - (VP('herbs') ? 3 : 0)) * standing())) }, get food() { return Math.max(2, Math.round((VP('granary') ? 3 : 4) * standing())) } };
    const keeperIn = () => [...people.values()].some(a => !a.leaving && (OWNER ? a.id === OWNER : !a.p.benched && !L.inParty(E.S, a.id)));   /* somebody of the place is in (not one of your own party) */
    const missing = () => { E.S = L.save(); return Math.max(0, (E.S.maxHp || 60) - (E.S.hp ?? 60)) + [...E.S.party, ...E.S.bench].reduce((n, m) => n + Math.max(0, m.max - m.hp), 0) };
    const healCost = () => Math.max(3, Math.ceil(missing() / 4 * (VP('herbs') ? .6 : 1) * standing()));
    function services() {
      const B = (k, label, cost, why) => `<button data-svc="${k}" ${why || (cost && E.S.gold < cost) ? 'disabled' : ''} title="${esc(why || '')}">${label}${cost ? ' ' + cost + '💰' : ''}</button>`;
      const away = keeperIn() ? '' : 'เจ้าของไม่อยู่ตอนนี้';
      /* v97.52 · T3: with a case open in Fernvale the shops turn you away (pay at the guard Dork's house) */
      const LW = window.Law, lawWhy = LW && !LW.clean(E.S, 'fernvale') ? 'มีคดีค้าง — ไปจ่ายค่าปรับที่บ้านยามดอร์ก' : '', steal = LW && (KIND === 'shop' || KIND === 'market') ? B('steal', '🤫 ลักของ', 0, '') : '';
      if (lawWhy && ['healer', 'shop', 'market', 'guild'].includes(KIND)) return B('x', '⚖ ' + lawWhy, 0, lawWhy) + steal;
      if (KIND === 'healer') return B('heal', '✚ รักษาทั้งทีม', missing() ? healCost() : 0, away || (missing() ? '' : 'ทุกคนแข็งแรงดี')) + B('potion', '🧪 ซื้อยา', PRICE.potion, away);
      if (KIND === 'shop' || KIND === 'market') return B('potion', '🧪 ซื้อยา', PRICE.potion, away) + B('food', '🍞 เสบียง ×3', PRICE.food * 3, away) + (KIND === 'market' && window.Settlements ? B('trade', '🛒 ซื้อขายสินค้า', 0, away) : '') + steal;
      /* v97.40 · the guild's contracts and what each household offers */
      if (KIND === 'guild') { const c = contract(); if (away) return B('x', '📜 งานกิลด์', 0, 'ซิกริดไม่อยู่ที่เคาน์เตอร์ (8:00–17:00)');
        const bn = window.Bounties ? B('bounty', '☠ ประกาศจับ' + (window.Bounties.active(E.S).some(b => b.state === 'slain') ? ' · มีรางวัลรอรับ' : ''), 0) : '';   /* v97.73 · T3 */
        if (c.active) { const k = Math.max(0, (E.S.kills || 0) - c.active.base), done = k >= c.active.n; return bn + B('turnin', done ? `✔ ส่งงาน ${c.active.label} +${c.active.reward}💰` : `📜 ${c.active.label} ${k}/${c.active.n}`, 0, done ? '' : 'ล้มศัตรูบนแผนที่โลกให้ครบก่อน') + (done ? '' : B('drop', '✕ ยกเลิกงาน', 0)) }
        return bn + c.offers.map((o, i) => B('take:' + i, `📜 ${o.label} → ${o.reward}💰`, 0, c.taken ? 'วันนี้รับงานไปแล้ว พรุ่งนี้มีงานใหม่' : '')).join('') }
      if (KIND === 'house') { const H = HOUSE_SVC[OWNER]; if (H) return H.filter(([k]) => k !== 'payfine' || (window.Law && window.Law.owed(E.S, 'fernvale'))).map(([k, label, cost]) => B(k, k === 'payfine' ? label + ' ' + window.Law.owed(E.S, 'fernvale') + '💰' : label, cost, k === 'projects' || k === 'lessons' || k === 'safety' || (k === 'office' && !window.Offices) || (k === 'petition' && !window.Settlements) ? '' : k === 'payfine' ? (E.S.gold < window.Law.owed(E.S, 'fernvale') ? 'เงินไม่พอ' : away) : away)).join('') }
      if (KIND === 'temple') { const prayed = (E.S.prayDay || 0) === CLK.read().day; return B('pray', '🙏 ภาวนา', 0, prayed ? 'ภาวนาแล้ววันนี้ · พรุ่งนี้มาใหม่' : '') + B('offer', '🕯 ถวาย · น้ำมนต์', 25, away) }
      return '';
    }
    const HOUSE_SVC = { may: [['bread', '🍞 ขนมปัง ×3', 9]], hilda: [['veg', '🥕 ผักสด ×3', 9], ['contest', '🏆 ประกวดผลผลิต', 0]], bryn: [['flour', '🌾 แป้งและเสบียง ×3', 9]], joe: [['fish', '🐟 ปลาย่าง ×3', 9]],
      saf: [['potion', '🧪 ยาสมุนไพร', 14]], oren: [['projects', '🏗 พัฒนาหมู่บ้าน', 0], ['office', '🏛 รับราชการ', 0], ['petition', '📜 คำร้อง · 🪑 สภาหมู่บ้าน', 0]], mira: [['lessons', '📘 ทบทวนบทเรียน', 0]], dork: [['safety', '🛡 ถามเรื่องความปลอดภัย', 0], ['payfine', '⚖ จ่ายค่าปรับ / ล้างคดี', 0]] };
    /* guild contracts: 3 a day (seeded by the day), one taken at a time, counted by the foes the hero brings down on the world map (S.kills) */
    function contract() {
      E.S.guild ||= {}; const day = CLK.read().day, G = E.S.guild;
      if (G.day !== day) { let h = day * 2654435761 >>> 0; const r = () => (h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296;
        G.day = day; G.taken = false; G.offers = [['กวาดล้างสัตว์ร้ายรอบหมู่บ้าน', 3], ['คุ้มกันทางเกวียน', 5], ['ล่าค่าหัวกลุ่มโจรป่า', 7]].map(([t, n]) => { const k = n + Math.floor(r() * 3); return { label: t + ' (ล้ม ' + k + ' ตัว)', n: k, reward: 25 + k * 11 } }) }
      return G;
    }
    function service(k) {
      E.S = L.save(); const pay = c => { if (E.S.gold < c) { toast('เงินไม่พอ'); return false } E.S.gold -= c; return true };
      if (k.startsWith('take:')) { const G = contract(), o = G.offers[+k.slice(5)]; if (!o || G.taken || G.active) return; G.active = { ...o, base: E.S.kills || 0 }; G.taken = true; L.writeSave(E.S); toast('📜 รับงาน: ' + o.label) }
      else if (k === 'contest') { const S0 = E.S; window.Garden?.contestPanel(S0, () => { L.writeSave(S0); hud._html = ''; hudSync() }); return }   /* v97.81 · the harvest contest */
      else if (k === 'bounty') { const S0 = E.S; window.Bounties.panel(S0, 'fernvale', () => { L.writeSave(S0); hud._html = ''; hudSync() }); return }
      else if (k === 'turnin') { const G = contract(), a = G.active; if (!a || (E.S.kills || 0) - a.base < a.n) return; a.reward = Math.round(a.reward * (FC()?.payMult('guild') ?? 1) * (1 + .15 * (window.Offices?.perk(E.S, 'magus') || 0))); E.S.gold += a.reward; FC()?.add('guild', 6, 'ส่งงาน ' + a.label); window.Law?.service(E.S, 'fernvale'); FC()?.add('village', 2, 'ช่วยกำจัดภัยรอบหมู่บ้าน'); G.done = (G.done || 0) + 1; G.active = null; L.writeSave(E.S); toast('✔ ส่งงานกิลด์ +' + a.reward + '💰 (ทำสำเร็จแล้ว ' + G.done + ' งาน)') }
      else if (k === 'drop') { const G = contract(); G.active = null; L.writeSave(E.S); toast('ยกเลิกงานแล้ว') }
      else if (['bread', 'veg', 'flour', 'fish'].includes(k)) { if (!pay(9)) return; E.S.food = (E.S.food || 0) + 3; L.writeSave(E.S); toast({ bread: '🍞', veg: '🥕', flour: '🌾', fish: '🐟' }[k] + ' ได้เสบียง 3 ห่อ (มี ' + E.S.food + ')') }
      else if (k === 'steal') { const LW = window.Law; let job = ''; try { job = window.WorldState.game().village.character?.job || '' } catch (e) { }
        const r = LW.steal(E.S, 'fernvale', { rogue: job === 'rogue', unwatched: !keeperIn() });
        if (r.ok) { if (Math.random() < .5) { E.S.potions = (E.S.potions || 0) + 1; toast('🤫 หยิบยามาได้ 1 ขวด ไม่มีใครเห็น') } else { E.S.food = (E.S.food || 0) + 3; toast('🤫 หยิบเสบียงมาได้ 3 ห่อ ไม่มีใครเห็น') } L.writeSave(E.S) }
        else { L.writeSave(E.S); const S0 = E.S;   /* the HUD reloads S every tick — keep the object the arrest changes */
          LW.arrest(S0, 'fernvale', 'มีคนเห็นคุณหยิบของในร้าน ยามมาถึงพอดี').then(a => { if (a === 'jail') { try { window.WorldState.sleep({ relief: 0 }) } catch (e) { } toast('⛓ ติดคุกหนึ่งคืน · ออกมาตอนเช้า') } else if (a === 'run') toast('🚨 คุณหนีไปได้ แต่ถูกหมายจับในเฟิร์นเวลแล้ว'); else toast('💰 จ่ายค่าปรับแล้ว คดีจบ'); L.writeSave(S0); hud._html = ''; hudSync() }) }
      }
      else if (k === 'payfine') { if (window.Law.pay(E.S, 'fernvale')) { L.writeSave(E.S); toast('⚖ จ่ายค่าปรับแล้ว ล้างคดีเรียบร้อย') } else toast('เงินไม่พอ') }
      else if (k === 'trade') { const S0 = E.S; window.Settlements.tradePanel('fernvale', S0, () => { L.writeSave(S0); hud._html = ''; hudSync() }); return }   /* S0: the HUD reloads S every tick */
      else if (k === 'petition') { window.Settlements?.petitionPanel('fernvale').then(p => { if (p) toast('📜 เฟิร์นเวลเปลี่ยนนโยบายเป็น ' + window.Settlements.POLICIES[p].name); hud._html = ''; hudSync() }); return }
      else if (k === 'office') { if (!window.Offices) return; const S0 = E.S; window.Offices.panel(S0, () => { L.writeSave(S0); hud._html = ''; hudSync() }); return }   /* v97.55 · T7 */
      else if (k === 'projects') { try { (parent.VillageProjects || window.VillageProjects)?.open() } catch (e) { } }
      else if (k === 'lessons') { let ls = []; try { ls = parent.Story?.lessons?.() || [] } catch (e) { } const a = [...people.values()].find(x => x.id === 'mira'); if (a) talk(a, ls.length ? 'บทเรียนที่เจ้าเคยเรียน: ' + ls.map(x => x.title).filter(Boolean).join(' · ') + ' — อยากทวนเรื่องไหน เปิดสมุดหมู่บ้านดูได้เลยนะ' : 'ยังไม่มีบทเรียนให้ทวนเลย ออกไปลองของจริงก่อนสิ'); else toast('ครูมิราไม่อยู่บ้านตอนนี้') }
      else if (k === 'safety') { const VPj = window.VillageProjects; const w = VPj?.has('watch'), r = VPj?.has('road'); const a = [...people.values()].find(x => x.id === 'dork'); const line = (w ? 'หอเฝ้ายามตะวันออกช่วยได้มาก ข้ามองเห็นได้ไกลถึงแนวป่า' : 'รั้วตะวันออกยังโหว่ ถ้ามีหอเฝ้ายามสักหลังข้าจะนอนหลับขึ้น') + ' · ' + (r ? 'ถนนใหม่ทำให้พวกพ่อค้ามาบ่อยขึ้น' : 'ถนนออกหมู่บ้านยังพังอยู่ คาราวานบ่นกันทุกคน'); if (a) talk(a, line); else toast('🛡 ' + line) }
      else if (k === 'heal') { const c = healCost(); if (!missing() || !pay(c)) return; E.S.hp = E.S.maxHp || 60; for (const m of [...E.S.party, ...E.S.bench]) m.hp = m.max; L.writeSave(E.S); toast('✚ รักษาแล้ว · ทุกคน HP เต็ม (−' + c + '💰)') }
      else if (k === 'potion') { if (!pay(PRICE.potion)) return; E.S.potions = (E.S.potions || 0) + 1; L.writeSave(E.S); toast('🧪 ได้ยาฟื้นฟู 1 ขวด (มี ' + E.S.potions + ')') }
      else if (k === 'food') { if (!pay(PRICE.food * 3)) return; E.S.food = (E.S.food || 0) + 3; L.writeSave(E.S); toast('🍞 ได้เสบียง 3 ห่อ (มี ' + E.S.food + ')') }
      else if (k === 'pray') { const day = CLK.read().day; if ((E.S.prayDay || 0) === day) return; E.S.prayDay = day; E.S.prays = (E.S.prays || 0) + 1; { const wp = window.Offices?.perk(E.S, 'warden') || 0; if (wp) for (const m of [...E.S.party, ...E.S.bench]) m.hp = Math.min(m.max, m.hp + Math.round(m.max * .3 * wp)) } FC()?.add('temple', 1, 'ภาวนาที่วิหาร'); E.S.fatigue = (E.S.fatigue || 0) - 40; const k2 = VP('shrine') ? .5 : .3; E.S.hp = Math.min(E.S.maxHp || 60, (E.S.hp ?? 60) + Math.round((E.S.maxHp || 60) * k2)); L.writeSave(E.S); toast('🙏 ใจสงบลง · HP +' + Math.round(k2 * 100) + '%') }
      else if (k === 'offer') { if (!pay(25)) return; E.S.potions = (E.S.potions || 0) + 1 + (FC()?.rank('temple') >= 2 ? 1 : 0); FC()?.add('temple', 4, 'ถวายเงินบำรุงวิหาร'); L.writeSave(E.S); toast('🕯 ถวายแล้ว · ได้น้ำมนต์ (ยาฟื้นฟู) 1 ขวด') }
      hud._html = ''; hudSync();
    }

    /* v98.1196 · the inn's party panel + room rental and the healer's ward (moved unchanged from interior.js; DOM panels — the host gives the modal state / room refresh through E) */
    function openWard() {
      const I = window.Injury, g = window.WorldState?.game?.(); if (!I || !g) return toast('ระบบบาดเจ็บยังไม่พร้อม');
      E.close(); E.modalOpen = true; const TOWN = 'fernvale', q = I.quality(TOWN), v = g.village || {};
      const people = [{ id: 'hero', name: E.heroName() }, { id: 'sib', name: v.siblingName || (window.HeroVariant?.get?.() === 'female' ? 'พี่ชาย' : 'น้องสาว') }, ...[...(v.party || []), ...(v.bench || [])].filter(m => m.key !== 'sib').map(m => ({ id: m.key, name: m.name }))];
      const day = CLK.read().day, rows = people.filter(p => I.hurt(g, p.id) || I.of(g, p.id)).map(p => {
        const r = I.of(g, p.id), heavy = I.heavyParts(g, p.id).length > 0;
        return `<div style="display:flex;justify-content:space-between;gap:8px;align-items:center;margin:8px 0;padding:6px 8px;background:#fff7e3;border-radius:8px"><span><b>${esc(p.name)}</b> · ${esc(I.describe(g, p.id))}${r.bed ? ' · 🛏 นอนพักอยู่' : ''}</span><span>${heavy && !r.bed ? `<button data-a="admit" data-id="${p.id}">ฝากรักษา ${q.cost}💰/วัน</button>` : ''}${r.bed ? `<button data-a="out" data-id="${p.id}">รับกลับ</button>` : ''}${r.bed && r.visitDay !== day ? `<button data-a="visit" data-id="${p.id}">เยี่ยม</button>` : ''}</span></div>`;
      }).join('');
      const bg = document.createElement('div'); bg.className = 'in-dlg-bg';
      bg.innerHTML = `<div class="in-dlg" style="grid-template-columns:1fr"><div><h2>🏥 ห้องผู้ป่วย</h2><p>บาดเจ็บหนักหายได้เฉพาะที่นี่ · เตียงเมืองเล็ก ${q.cost}💰/วัน · ยิ่งนอนนาน โอกาสหายยิ่งสูงขึ้นทุกเช้า</p>${rows || '<p>ตอนนี้ไม่มีใครบาดเจ็บ 🙂</p>'}<div class="acts"><button class="ghost" data-a="x">ออก</button></div></div></div>`;
      document.body.append(bg); E.dlg = bg;
      bg.onclick = e => { const b = e.target.closest('[data-a]'); if (e.target === bg || b?.dataset.a === 'x') return E.close(); if (!b) return; const id = b.dataset.id;
        if (b.dataset.a === 'admit') { const r = I.admit(g, id, TOWN); toast(r.ok ? '🛏 รับเข้าพักฟื้นแล้ว · ' + r.cost + '💰/วัน' : r.why) }
        else if (b.dataset.a === 'out') { I.discharge(g, id); toast('รับกลับบ้านแล้ว') }
        else if (b.dataset.a === 'visit') { const r = I.visit(g, id, day); if (r.ok) { try { if (E.MIND && L.P[id]) { E.MIND.affect(id, r.rel); E.MIND.save() } } catch (e) { } toast('💛 เยี่ยมไข้ · ความสนิท +' + r.rel + ' · พรุ่งนี้หายง่ายขึ้นเล็กน้อย') } }
        try { window.WorldState.commit?.() } catch (e) { } E.close(); openWard() };
    }
    async function rest(cost) {
      E.S = L.save(); if (E.S.gold < cost) { toast('เงินไม่พอ'); return }
      E.S.gold -= cost; for (const p of [...E.S.party, ...E.S.bench]) p.hp = p.max; L.writeSave(E.S);
      document.body.style.transition = 'filter .6s'; document.body.style.filter = 'brightness(0)'; await E.wait(700);
      window.WorldState.sleep({ relief: cost ? 80 : 70 }); /* v94: same as sleeping at home (next morning 08:00) */ E.resetRoom(); document.body.style.filter = ''; toast('พักจนถึงเช้า · ทีมฟื้นเต็ม'); hudSync();
    }
    function partyPanel() {
      E.S = L.save(); const el = document.createElement('div'); el.className = 'in-party';
      const row = (m, where) => `<div class="slot" data-k="${m.key}" data-w="${where}"><span>${esc(m.name)}</span><small>${m.hp}/${m.max} · ${where === 'party' ? 'ออกเดินทาง →' : '← พาไปด้วย'}</small></div>`;
      el.innerHTML = `<div><h2 style="margin:0 0 6px;color:#5a2e10">👥 จัดทีม</h2><p style="margin:0 0 8px;font-size:13px">ออกเดินทางได้สูงสุด ${L.MAX_ACTIVE} คน (ไม่รวมฮีโร่) ที่เหลือพักที่โรงแรม · คลิกเพื่อสลับ</p>
        <div class="col"><div><b>ออกเดินทาง (${E.S.party.length}/${L.MAX_ACTIVE})</b>${E.S.party.map(m => row(m, 'party')).join('') || '<div style="font-size:12px">—</div>'}</div><div><b>พักที่โรงแรม</b>${E.S.bench.map(m => row(m, 'bench')).join('') || '<div style="font-size:12px">—</div>'}</div></div>
        <div style="text-align:right;margin-top:10px"><button class="ghost" id="inPClose" style="background:#4a3e2e;color:#fff;border:0;border-radius:8px;padding:6px 12px">ปิด</button></div></div>`;
      document.body.append(el); E.modalOpen = true;
      el.querySelectorAll('.slot').forEach(s => s.onclick = () => { E.S = L.save(); const k = s.dataset.k; if (k === 'sib') return; if (s.dataset.w === 'party') { const i = E.S.party.findIndex(m => m.key === k); E.S.bench.push(...E.S.party.splice(i, 1)) } else { if (E.S.party.length >= L.MAX_ACTIVE) { toast('ทีมเต็มแล้ว (' + L.MAX_ACTIVE + ' คน)'); return } const i = E.S.bench.findIndex(m => m.key === k); E.S.party.push(...E.S.bench.splice(i, 1)) } L.writeSave(E.S); el.remove(); E.modalOpen = false; E.resetRoom(); hudSync(); partyPanel() });
      el.querySelector('#inPClose').onclick = () => { el.remove(); E.modalOpen = false };
    }
    /* v98.1197 · the CONVERSATION: talk window, topics, gifts, recruiting (hire · drinks · visits · battles · duel · offering · boss …) and the hold-to-act ring — moved unchanged from interior.js */
    /* v97.30 · relationship tiers (Mind npc.aff −5…10) and gifts by what each person likes (p.likes) — once a day per person */
    const TIERS = [[-99, 'ไม่ไว้ใจ', '💢'], [-1, 'คนแปลกหน้า', '·'], [1, 'คนรู้จัก', '♡'], [3, 'คุ้นเคย', '♥'], [6, 'เพื่อน', '♥♥'], [9, 'เพื่อนรัก', '💛']];
    const tierOf = aff => TIERS.filter(t => aff >= t[0]).at(-1);
    const GIFTS = {
      gold: { name: '10 เหรียญ', icon: '💰', like: /เงิน|เหรียญ|กำไร|แวววาว/, has: () => E.S.gold >= 10, take: () => { E.S.gold -= 10 } },
      food: { name: 'เสบียง', icon: '🍞', like: /ขนมปัง|เนื้อ|สตู|อาหาร/, has: () => E.S.food > 0, take: () => { E.S.food -= 1 } },
      potion: { name: 'ยาสมุนไพร', icon: '🧪', like: /ชา|สมุนไพร|ราก|ยา/, has: () => E.S.potions > 0, take: () => { E.S.potions -= 1 } },
      iron: { name: 'แท่งเหล็ก', icon: '▰', like: /เหล็ก|ดาบ|โล่/, has: () => (mats().iron || 0) > 0, take: () => { mats().iron-- } },
      wood: { name: 'ไม้', icon: '▤', like: /ไม้/, has: () => (mats().wood || 0) > 0, take: () => { mats().wood-- } }
    };
    function mats() { try { return window.WorldState.game().village.materials || {} } catch (e) { return {} } }
    function giftPanel(a) {
      const p = a.p, n = MIND.npc(p.id), day = CLK.read().day;
      if (n.giftDay === day) { talk(a, 'วันนี้ให้ข้ามาแล้วนี่ ไว้วันหลังเถอะ ขอบใจนะ'); return }
      talk(a, 'ให้ของข้าหรือ? …'); const acts = E.dlg.querySelector('.acts');
      acts.innerHTML = Object.entries(GIFTS).map(([k, G]) => `<button data-a="gift:${k}" ${G.has() ? '' : 'disabled'}>${G.icon} ${G.name}</button>`).join('') + '<button class="ghost" data-a="talk">ย้อนกลับ</button>';
      acts.querySelectorAll('[data-a]').forEach(b => b.onclick = () => act(a, b.dataset.a));
    }
    function giveGift(a, k) {
      const p = a.p, G = GIFTS[k], n = MIND.npc(p.id), day = CLK.read().day; E.S = L.save(); if (!G || !G.has() || n.giftDay === day) return;
      const liked = G.like.test(p.likes || ''), before = tierOf(n.aff || 0); G.take(); L.writeSave(E.S); try { window.WorldState.commit?.() } catch (e) { }
      n.giftDay = day; MIND.affect(p.id, liked ? 2 : .5); MIND.save(); const after = tierOf(n.aff || 0); hud._html = ''; hudSync();
      talk(a, liked ? `${G.name}! เจ้ารู้ได้ไงว่าข้าชอบ … ขอบใจจริง ๆ` : 'ขอบใจนะ ข้าจะเก็บไว้ใช้');
      if (after !== before) toast(`${p.name} · ความสัมพันธ์: ${after[1]} ${after[2]}`); else if (liked) toast('💝 ' + p.name + ' ชอบของขวัญนี้มาก');
    }
    function talk(a, line) {
      E.close(); if (!line) { let quest = false; try { if (parent !== window) quest = !!parent.Story?.talked?.(a.p.id) } catch (e) { }
        if (quest) {   /* v98.664 · a quest step: the story scene plays, no talk window */
          /* v98.687 · in a visit house (just the door + the owner) there is nothing to do once the scene has played: the player was left on the empty door page. Leave when the scene ends (or at once if it never started) */
          if (VISIT) { const t0 = Date.now(); let started = false; const iv = setInterval(() => { let playing = false; try { playing = !!parent.Cutscene?.isPlaying?.() } catch (e) { } if (playing) started = true; if ((started && !playing) || (!started && Date.now() - t0 > 6000) || Date.now() - t0 > 90000) { clearInterval(iv); leave() } }, 400) }
          return
        }
      }
      E.modalOpen = true; E.talkingTo = a; E.S = L.save();
      const p = a.p, per = CLK.period(CLK.read().hour), lines = p.lines?.[per] || p.lines?.day || p.lines?.evening || ['…'];
      let said = null; if (!line && MIND && L.P[p.id]) { said = MIND.talk(p.id, { period: per, place: KIND, save: E.S }); L.writeSave(E.S); if (said.reward) setTimeout(() => toast('รางวัล: ' + [said.reward.gold ? '+' + said.reward.gold + ' 💰' : '', said.reward.potions ? 'ยา +' + said.reward.potions : ''].filter(Boolean).join(' · ')), 200) }
      const txt = line || (said ? fill(said.text) : fill(lines[Math.floor(Math.random() * lines.length)]));
      const ws = MIND?.wantState(p.id), jobs = MIND && L.P[p.id] && !(p.recruit && !L.inParty(E.S, p.id)) ? MIND.canWork(p.id, p.benched) : [], aff = MIND?.npc(p.id).aff || 0;
      const rec = p.recruit && !L.inParty(E.S, p.id) ? L.RECRUIT[p.id] : null;
      const bg = document.createElement('div'); bg.className = 'in-dlg-bg';
      bg.innerHTML = `<div class="in-dlg"><canvas width="220" height="260"></canvas><div><h2>${esc(p.name)} <small class="tier" title="ความสัมพันธ์ ${Math.round(aff * 10) / 10}/10">${tierOf(aff)[2]} ${tierOf(aff)[1]}</small></h2><div class="role">${esc(fill(p.role))}${p.age ? ' · อายุ ' + p.age : ''}${p.benched ? ' · พักอยู่กับทีม' : ''}</div>
        <p>${esc(txt)}</p>${ws?.asked && !ws.done ? `<div class="cond">🤝 คำขอ: ${esc(ws.def.hint)}</div>` : ''}${rec ? `<div class="cond">★ เงื่อนไขชวนเข้าทีม: <b>${esc(rec.label)}</b><br>${esc(rec.text)}${progressText(p.id, rec)}</div>` : ''}
        <div class="acts">${talkActs(p, jobs, rec)}</div></div></div>`;
      document.body.append(bg); E.dlg = bg;
      const pc = bg.querySelector('canvas').getContext('2d'); pc.scale(2, 2); VillagerDraw(pc, p.look || {}, 55, 122, performance.now(), { face: 'SE', scale: 1.15 });
      window.StoryActors?.drawTalkPortrait(bg.querySelector('canvas'), p.id, txt, () => E.dlg === bg);
      bg.querySelectorAll('[data-a]').forEach(b => b.onclick = () => act(a, b.dataset.a));
      bg.onclick = e => { if (e.target === bg) { E.close(); if (VISIT) leave() } };
      a.face = faceOf(hero.u - a.u, hero.v - a.v);
    }

    /* v98.21 · UI-BRUSHUP #4: at most 4 buttons — 💬 คุย (topics) · 🎁 ให้ของ · the ONE thing this person does (or 🛠 บริการ ▸ when several) · ลาก่อน.
       Chat topics and services open as a short choice list inside the conversation (with ย้อนกลับ), not as a long row of buttons. */
    function roleActs(p, jobs, rec) {
      return [rec && ['recruit', '★ ชวนเข้าทีม'], teachable(p.id) && ['teach', '📖 เรียนท่า'], jobs.length && ['work', '💼 จ้างทำงาน'], p.id === 'olwen' && rec && ['drink', '🍺 เลี้ยงเหล้า 10💰'], p.id === 'marta' && ['room', '🛏 เช่าห้อง 10💰']].filter(Boolean);
    }
    function talkActs(p, jobs, rec) {
      const roles = roleActs(p, jobs, rec), btn = ([k, n]) => `<button data-a="${k}">${n}</button>`;
      return '<button data-a="chat">💬 คุย</button>' + (MIND && L.P[p.id] ? '<button data-a="gift">🎁 ให้ของ</button>' : '')
        + (roles.length === 1 ? btn(roles[0]) : roles.length > 1 ? '<button data-a="service">🛠 บริการ ▸</button>' : '') + '<button class="ghost" data-a="bye">ลาก่อน</button>';
    }
    function choices(a, line, list) {
      talk(a, line); const acts = E.dlg.querySelector('.acts');
      acts.innerHTML = list.map(([k, n]) => `<button data-a="${k}">${n}</button>`).join('') + '<button class="ghost" data-a="talk">ย้อนกลับ</button>';
      acts.querySelectorAll('[data-a]').forEach(b => b.onclick = () => act(a, b.dataset.a));
    }
    /* v95.10 · trainers (js/card-sources.js in the game page) */
    function teachable(id) { try { return parent !== window && !!parent.CardSources?.teaches?.(id) } catch (e) { return false } }
    function progressText(id, rec) {
      const r = E.S.recruit?.[id] || {};
      if (rec.kind === 'visits') return `<br>คุยกันแล้ว ${(r.days || []).length}/${rec.need} วัน`;
      if (rec.kind === 'battles') return r.base != null ? `<br>ความคืบหน้า: ชนะแล้ว ${Math.min(rec.need, E.S.battles - r.base)}/${rec.need}` : '<br>(กด "ชวนเข้าทีม" เพื่อรับเควส)';
      if (rec.kind === 'drinks') return `<br>เลี้ยงแล้ว ${r.n || 0}/${rec.need}`;
      if (rec.kind === 'reputation') return `<br>พิชิตแล้ว ${Object.keys(E.S.done || {}).length}/1`;
      if (rec.kind === 'boss') return E.S.done?.[rec.dest] ? '<br>✔ ล้มจ่าฝูงแล้ว' : '';
      if (rec.kind === 'offering') return `<br>มี ${E.S.gold}💰 · ยา ${E.S.potions}`;
      return '';
    }
    function joinNow(a, msg) {
      E.S = L.save(); if (!L.join(E.S, a.id)) { talk(a, 'ข้าอยู่ในทีมเจ้าแล้วนี่'); return }
      L.writeSave(E.S); MIND?.emit('recruit:join', { who: a.id, witness: [...people.keys()] }); toast('★ ' + a.p.name + ' เข้าร่วมทีม!' + (E.S.party.some(x => x.key === a.id) ? '' : ' (พักที่โรงแรม — จัดทีมเพื่อพาไป)'));
      talk(a, msg); hudSync();
    }
    async function act(a, what) {
      const p = a.p; E.S = L.save(); const rec = L.RECRUIT[p.id], r = (E.S.recruit[p.id] ||= {}), hour = CLK.read().hour;
      if (what === 'bye') { E.close(); if (VISIT) leave(); return }
      if (what === 'teach') { E.close(); try { parent.CardSources?.teach?.(p.id) } catch (e) { } return }
      if (what === 'talk') { talk(a); return }
      if (what === 'chat') { choices(a, 'อยากคุยเรื่องอะไรดี?', [['talk', '💬 คุยเล่น'], ['about', '❔ เรื่องของเขา'], ...(MIND && L.P[p.id] ? [['ask', '❓ ถามข่าว…']] : []), ...(p.id === 'marta' ? [['rumor', '📜 ข่าวลือ']] : [])]); return }
      if (what === 'service') { choices(a, 'ให้ช่วยเรื่องอะไรดี?', roleActs(p, MIND && L.P[p.id] && !(p.recruit && !L.inParty(E.S, p.id)) ? MIND.canWork(p.id, p.benched) : [], p.recruit && !L.inParty(E.S, p.id) ? L.RECRUIT[p.id] : null)); return }
      if (what === 'ask') { talk(a, 'อยากรู้เรื่องอะไรล่ะ?'); const acts = E.dlg.querySelector('.acts'); acts.innerHTML = [['news', '📰 ข่าวล่าสุด'], ['people', '👥 คนในหมู่บ้าน'], ['road', '🧭 ทางข้างหน้า']].map(([k, n]) => `<button data-a="ask:${k}">${n}</button>`).join('') + '<button class="ghost" data-a="talk">ย้อนกลับ</button>'; acts.querySelectorAll('[data-a]').forEach(b => b.onclick = () => act(a, b.dataset.a)); return }
      if (what.startsWith('ask:')) { talk(a, fill(MIND.ask(p.id, what.slice(4)))); MIND.save(); return }
      if (what === 'gift') { giftPanel(a); return }
      if (what.startsWith('gift:')) { giveGift(a, what.slice(5)); return }
      if (what === 'about') { const ab = p.about?.length ? fill(p.about[Math.floor(Math.random() * p.about.length)]) : ''; talk(a, (p.trait ? '(' + fill(p.trait) + ') ' : '') + (ab || fill(p.story || '…')) + (L.originText?.(p) ? ' — ' + fill(L.originText(p)) : '')); return }
      if (what === 'rumor') { talk(a, 'ข่าวลือตอนนี้: ' + ['ถ้ำในป่าตะวันออกมีเสียงหอนทั้งคืน — พวกพรานไม่กล้าเข้าไป', 'คนงานเหมืองหนีออกมาบอกว่าหินในเหมืองลุกขึ้นเดิน', 'ระฆังวิหารเก่าในบึงหมอกดังเองทุกคืนข้างแรม', 'เกรเวนเล่าว่ามีคนกลับจากซากเมืองพร้อมผลึกแปลกประหลาด'][Math.floor(Math.random() * 4)] + ' (ไปที่ "ออกเดินทาง" เพื่อรับภารกิจ)'); return }
      if (what === 'room') { E.close(); rest(10); return }
      if (what === 'work') { workPanel(a); return }
      if (what.startsWith('job:')) { const k = what.slice(4), J = window.VillageLines.JOBS[k]; const r = MIND.startJob(p.id, k, E.S); if (!r.ok) { talk(a, r.why === 'gold' ? `ค่าจ้าง ${J.cost} เหรียญ … เจ้ายังมีไม่พอนะ` : 'ข้ายังทำงานเก่าไม่เสร็จเลย'); return } L.writeSave(E.S); E.close(); toast(`💼 ${p.name} ออกไป${J.name} · กลับราว ${J.hours} ชม.`); a.bubble = { txt: 'ไปล่ะ! เดี๋ยวกลับมาเล่าให้ฟัง', until: performance.now() + 2500 }; setTimeout(() => { syncPeople(false); hudSync() }, 300); return }
      if (what === 'drink') {
        if (!(hour >= 17 || hour < 4)) { talk(a, 'ตอนกลางวันข้ายังไม่ดื่ม… อย่างน้อยก็ไม่ดื่มต่อหน้าคนอื่น มาใหม่ตอนเย็นนะ'); return }
        const day = CLK.read().day; if (r.day === day) { talk(a, 'วันนี้เจ้าเลี้ยงข้าไปแล้ว … ฮึก … พรุ่งนี้ค่อยว่ากัน'); return }
        if (E.S.gold < 10) { talk(a, 'ไม่มีเงิน? งั้นก็ฟังข้าเล่าฟรี ๆ ไปก่อน'); return }
        E.S.gold -= 10; r.n = (r.n || 0) + 1; r.day = day; L.writeSave(E.S); hudSync();
        if (r.n >= rec.need) { joinNow(a, 'สามแก้วแล้ว! … ข้าจำไม่ได้ว่าสัญญาอะไรไว้ แต่ข้าไปกับเจ้าก็ได้ ไฟของข้ายังไม่ดับหรอก!'); return }
        talk(a, ['อ้า … องุ่นจากหุบใต้ เจ้ารู้ใจข้า', 'แก้วที่สองแล้ว … ข้าเริ่มชอบหน้าเจ้าแล้วสิ'][r.n - 1] || 'อีกแก้วสิ'); return;
      }
      if (what !== 'recruit' || !rec) return;
      if (rec.kind === 'hire') { if (E.S.gold < rec.cost) { talk(a, 'เงินยังไม่พอ ' + rec.cost + ' เหรียญ ไม่ต่อราคา'); return } E.S.gold -= rec.cost; L.writeSave(E.S); joinNow(a, rec.joinLine || 'ตกลง ขวานของข้าเป็นของเจ้าจนกว่างานจะจบ'); return }
      /* v94 recruit kinds: a friend just needs asking · "visits" = talk to them on N different days */
      if (rec.kind === 'friend') { joinNow(a, rec.joinLine || 'ไปด้วยกันสิ!'); return }
      if (rec.kind === 'visits') { const day = CLK.read().day; r.days ||= []; if (!r.days.includes(day)) r.days.push(day); L.writeSave(E.S); if (r.days.length >= rec.need) { joinNow(a, rec.joinLine || 'ตกลง ข้าจะไปกับเจ้า'); return } talk(a, (rec.waitLines || [])[r.days.length - 1] || 'มาคุยกันใหม่วันหลังนะ'); return }
      if (rec.kind === 'battles') { if (r.base == null) { r.base = E.S.battles || 0; L.writeSave(E.S); talk(a, 'จริงนะ! งั้นไปชนะศัตรูนอกหมู่บ้านให้ได้สามครั้ง แล้วกลับมาเล่าให้ข้าฟัง!'); return } const n = (E.S.battles || 0) - r.base; if (n >= rec.need) { joinNow(a, 'เจ้ารอดกลับมาได้จริง ๆ! ข้าไปด้วย ลูกธนูข้าจะไม่พลาดสักดอก!'); return } talk(a, `ยังหรอก ชนะไปแค่ ${Math.max(0, n)} ครั้งเอง อีก ${rec.need - Math.max(0, n)} ครั้งนะ!`); return }
      if (rec.kind === 'drinks') { talk(a, 'อยากให้ข้าไปด้วย? เลี้ยงเหล้าข้าก่อนสิ … สามแก้ว สามวัน'); return }
      if (rec.kind === 'reputation') { if (Object.keys(E.S.done || {}).length) { joinNow(a, 'เจ้าพิชิตที่นั่นได้จริง ๆ! อาจารย์พูดถูก ข้าจะตามเจ้าไป!'); return } talk(a, 'กลับมาพร้อมชัยชนะจากข่าวลือสักแห่งก่อนนะ แล้วข้าจะตามเจ้าไปทุกที่'); return }
      if (rec.kind === 'offering') { if (E.S.gold < rec.cost || E.S.potions < rec.potions) { talk(a, `ยังขาดอยู่ — ต้องการ ${rec.cost} เหรียญ และยาฟื้นฟู ${rec.potions} ขวด (มี ${E.S.gold}💰 · ยา ${E.S.potions})`); return } E.S.gold -= rec.cost; E.S.potions -= rec.potions; L.writeSave(E.S); joinNow(a, 'ขอบคุณที่ใจกว้าง ข้าจะเดินทางไปกับเจ้า และเยียวยาทุกคนในทีม'); return }
      if (rec.kind === 'boss') { if (E.S.done?.[rec.dest]) { joinNow(a, 'เจ้าล้มมันได้ … พ่อของเรนคงยิ้มอยู่ที่ไหนสักแห่ง ข้าจะไปกับเจ้า'); return } talk(a, 'จ่าฝูงยังอยู่ในถ้ำ ล้มมันก่อน แล้วค่อยมาคุยกับข้า'); return }
      if (rec.kind === 'duel') { if (!(hour >= 20 || hour < 4)) { talk(a, 'กลางวันข้าไม่ดวลกับใคร'); return } E.close(); duel(a); return }
    }
    /* a 1-vs-1 duel in the battle field (hero alone) */
    async function duel(a) {
      E.S = L.save(); E.modalOpen = true;
      const fr = document.createElement('iframe'); fr.id = 'inBattle';
      /* v98.1146 · the duel carries the hero's level / weapon / stats like every other fight (it did not) and opens under the encounter cut, like the quest fights */
      fr.src = window.BattleLauncher ? BattleLauncher.url('duel', { ms: 'bandit*1.5', hhp: E.S.hp || 60, hmax: E.S.maxHp || 60, title: 'ดวล · นาเดีย ·', raw: BattleLauncher.heroQuery(window.WorldState?.game?.()) }) : `battle-field.html?battle=1&embed=1&r=5&biome=grass&night=1&m=bandit&ms=${encodeURIComponent('bandit*1.5')}&party=&hhp=${E.S.hp || 60}&hmax=${E.S.maxHp || 60}&title=${encodeURIComponent('ดวล · นาเดีย ·')}`;
      if (window.BattleLauncher) await BattleLauncher.mount(fr); else { window.VictoryScreen?.fightUI?.(true); document.body.append(fr) }
      const res = await new Promise(r => { const on = e => { if (e.data?.type === 'agrenor-battle') { removeEventListener('message', on); r(e.data) } }; addEventListener('message', on) });
      /* v98.996 · a won duel: the Victory report over the scene first, the frame goes after Continue */
      if ((res.outcome === 'win' || res.outcome === 'lose') && window.VictoryScreen) { const fem = (() => { try { return window.HeroVariant?.get?.() === 'female' } catch (e) { return false } })(); await VictoryScreen.show({ defeat: res.outcome === 'lose', title: 'ดวล · นาเดีย', goal: res.goal, kills: res.kills || 0, turns: res.turns, stat: res.stat, members: [{ id: 'hero', name: heroName(), pic: fem ? 'hero-female' : 'hero-male', hp: res.hp, max: E.S.maxHp || 60, gain: 0 }] }) }
      fr.remove(); window.VictoryScreen?.fightUI?.(false); E.modalOpen = false;
      if (res.outcome === 'win' || res.outcome === 'lose') MIND?.emit(res.outcome === 'win' ? 'duel:win' : 'duel:lose', { who: a.id, witness: [...people.keys()] });
      if (res.outcome === 'win') joinNow(a, 'ฮึ … ไม่เลวนี่ ข้ายอมรับ ข้าจะตามเจ้าไป แต่อย่าคิดว่าข้าจะเชื่อฟังทุกเรื่องนะ');
      else talk(a, res.outcome === 'flee' ? 'หนีแล้วหรือ? น่าผิดหวัง' : 'แค่นี้เองหรือ? กลับไปฝึกมาใหม่เถอะ');
    }
    /* the same registry as the village (js/interactables.js): villagers in the room + the door. Hold the big button on a villager = choices. */
    /* hold the big button on a villager = a ring of what THIS person can do (the same actions as the talk panel's choice lists) */
    const ROLE_ICON = { recruit: 'v2-guild', teach: 'v2-skills', work: 'v2-market', drink: 'v2-items', room: 'v2-inn' }, optCache = new Map();
    function personOptions(a) {
      const c = optCache.get(a.id); if (c && performance.now() - c.t < 2000) return c.o;
      const p = a.p; E.S = L.save(); const rec = p.recruit && !L.inParty(E.S, p.id) ? L.RECRUIT[p.id] : null, jobs = MIND && L.P[p.id] && !(p.recruit && !L.inParty(E.S, p.id)) ? MIND.canWork(p.id, p.benched) : [];
      const o = [{ label: 'คุย', icon: 'party', run: () => talk(a) }];
      if (MIND && L.P[p.id]) o.push({ label: 'ถามข่าว', icon: 'quest', run: () => act(a, 'ask') }, { label: 'ให้ของ', icon: 'treasure', run: () => act(a, 'gift') });
      for (const [k, n] of roleActs(p, jobs, rec)) o.push({ label: n.replace(/^\E.S+\s/, '').replace(/ \d+💰/, ''), icon: ROLE_ICON[k] || 'quest', run: () => act(a, k) });
      optCache.set(a.id, { t: performance.now(), o: o.slice(0, 5) }); return o.slice(0, 5);
    }
    return { services, service, contract, missing, healCost, PRICE, keeperIn, HOUSE_SVC, openWard, rest, partyPanel, talk, act, duel, personOptions, tierOf, mats, joinNow };
  }
  root.PlaceServices = { create };
})(globalThis);
