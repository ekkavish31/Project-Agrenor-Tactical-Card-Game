/* v98.1190 · PlaceServices — the rules of what a place SELLS / DOES for the player (TODO §45 step B): healer (treat the party · potions) · shop / market (potions · travel food · trade) · temple (prayer · offering) ·
   guild contracts / bounties · a household's goods (house) · "steal". Moved out of js/interior.js unchanged so the sub-map engine (village-place.html) can use the same rules.
   PlaceServices.create(E) → { services(), service(key), contract(), missing(), healCost(), PRICE, keeperIn(), HOUSE_SVC }
   + inn / healer panels: openWard() · rest(cost) · partyPanel()
   E = the host's accessors:  S (get / set the save snapshot) · L (VillageLife) · CLK (VillageClock) · KIND · OWNER · people (Map of the people in the room) · hud ({_html}) · hudSync() · talk(actor, line) · toast(text) · esc(text)
       · modalOpen / dlg (get / set) · close() · heroName() · MIND · wait(ms) · resetRoom() (the room's people are rebuilt) */
(function (root) {
  'use strict';
  function create(E) {
    const { L, CLK, KIND, OWNER, people, hud, hudSync, talk, toast, esc } = E;
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
    return { services, service, contract, missing, healCost, PRICE, keeperIn, HOUSE_SVC, openWard, rest, partyPanel };
  }
  root.PlaceServices = { create };
})(globalThis);
