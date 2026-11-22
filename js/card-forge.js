/* v98.955 · CARD FORGE — depth for the cards you already have (docs/TODO.md §30):
   ★ STARS (max 6)  spare copies of a card merge into stars: ★2 needs 1 spare copy · ★3 1 · ★4 2 · ★5 2 · ★6 3 (9 in all).
        each ★ = +10 % to damage / guard / heal / restore (★6 = +50 %) · ★3 and ★6 make the card cost 2 less stamina · ★6 also +1 range on ranged cards (range ≥ 3)
   ELEMENT (imbue)  any card can take any of the 9 elements of the wheel (costs 6 shards; going back to the card's own element is free). Weapon cards follow the weapon unless imbued.
   MOD SLOT         one chip per card: ปลายยาว (range +1) · ประหยัดแรง (stamina −5) · คมกริบ (+3 damage) · ติดไฟ / ชโลมพิษ (50 % burn / poison on hit). Chips are found (boss · guild · bounty · farm) or made from shards (3 each).
   DISMANTLE        a spare copy → shards (common 1 · uncommon 2 · rare 3). Shards also buy a spare copy of a card you own (4).
   Everything is per card id and shared by the hero and the friends (their cards too). Combat cards only (movement cards have no stars).
   Save: s.village.cardUp = { dust, chips:{kind:n}, cards:{ id:{ s:1..6, el?:wheelId, mod?:kind, spare?:n (old saves with no cardPool only) } } } — nothing else changes; saves without it behave exactly as before.
   The battle (js/flat-battle.js applyForge) asks CardForge.derive(id, baseRule) when a battle is created. UI: a ★ button on each card of "จัดสำรับต่อสู้" (js/tactics-deckbuilder.js). */
(function (root) {
  'use strict';
  const MAX = 6, NEED = [1, 1, 2, 2, 3], IMBUE = 6, CHIP_COST = 3, COPY_COST = 4, STAR_K = .10;
  const MODS = {
    range: { name: 'ปลายยาว', icon: '↔', desc: 'ระยะ +1 (เฉพาะการ์ดที่โจมตีผู้อื่น)' },
    cheap: { name: 'ประหยัดแรง', icon: '⚡', desc: 'ใช้แรงน้อยลง 5 (ต่ำสุด 0)' },
    keen: { name: 'คมกริบ', icon: '✦', desc: 'ดาเมจ +3 (การ์ดที่ทำดาเมจ)' },
    burn: { name: 'ติดไฟ', icon: '🔥', desc: 'โอกาส 50% ติดสถานะไหม้เมื่อโดนเป้า', status: ['burn', .5] },
    poison: { name: 'ชโลมพิษ', icon: '☠', desc: 'โอกาส 50% ติดสถานะพิษเมื่อโดนเป้า', status: ['poison', .5] }
  };
  const WHEEL = ['light', 'wind', 'water', 'chaos', 'fire', 'nature', 'ice', 'dark', 'earth'];
  /* the element a card has on its own (same as CARD_EL in js/flat-battle.js; cards not listed follow the weapon) */
  const BASE_EL = { thunder: 'chaos', frost: 'ice', flame: 'fire', gust: 'wind', quake: 'earth', aimed: 'light', tide: 'water', push: 'earth', pull: 'wind', rockfall: 'earth', whirl: 'wind', chaosBolt: 'chaos', chaosRend: 'chaos', chaosWard: 'chaos' };
  const RARE = ['thunder', 'quake', 'backstab', 'dive', 'counter', 'ambush', 'rockfall', 'perch', 'cleave', 'snipe', 'shadowStep'], UNCOMMON = ['twin', 'whirl', 'flame', 'frost', 'spell', 'tide', 'formation', 'evade', 'firstAid', 'climb', 'volley', 'smite', 'bless', 'emberBurst'];
  const dustOf = id => RARE.includes(id) ? 3 : UNCOMMON.includes(id) ? 2 : 1;
  const G = () => { try { return root.WorldState?.game?.() || (typeof s !== 'undefined' ? s : null) } catch (e) { return typeof s !== 'undefined' ? s : null } };
  const V = () => G()?.village;
  const peekUp = () => V()?.cardUp || null;
  const up = () => { const v = V(); if (!v) return null; const u = (v.cardUp ||= {}); u.dust ||= 0; u.chips ||= {}; u.cards ||= {}; return u };
  const doSave = () => { try { if (typeof globalThis.save === 'function') globalThis.save() } catch (e) { } };
  const COMBAT = () => root.TacticsDecks?.COMBAT || {};
  const nameOf = id => COMBAT()[id]?.name || id;
  const toast = (h, k) => { try { root.StoryToast?.(h, k) } catch (e) { } };
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- reading ---------- */
  const starsOf = id => peekUp()?.cards?.[id]?.s || 1;
  const modOf = id => peekUp()?.cards?.[id]?.mod || null;
  const imbuedOf = id => peekUp()?.cards?.[id]?.el || null;
  const pool = () => V()?.cardPool || null;
  const owned = id => { const P = pool(); return P ? (P.combat?.[id] || 0) > 0 : !!COMBAT()[id] };
  /* spare copies: in a new save the collection count − 1 · in an old save (no collection) a counter on the card record */
  const spareOf = id => { const P = pool(); return P ? Math.max(0, (P.combat?.[id] || 0) - 1) : (peekUp()?.cards?.[id]?.spare || 0) };
  const needFor = id => starsOf(id) >= MAX ? 0 : NEED[starsOf(id) - 1];
  const dust = () => peekUp()?.dust || 0;
  const chips = () => peekUp()?.chips || {};

  /* ---------- the battle side: the rule of one card as the forge changed it ---------- */
  function derive(id, base) {
    const u = peekUp(), r = u?.cards?.[id]; if (!r || (!(r.s > 1) && !r.el && !r.mod)) return null;
    const out = JSON.parse(JSON.stringify(base)), s = Math.max(1, Math.min(MAX, r.s || 1)), k = 1 + STAR_K * (s - 1), res = {};
    if (s > 1) for (const f of ['dmg', 'guard', 'heal', 'restore', 'behind', 'perLevel', 'guardAfter']) if (typeof out[f] === 'number' && out[f] > 0) out[f] = Math.round(out[f] * k);
    if (s >= 3 && out.st > 0) out.st = Math.max(0, out.st - 2);
    if (s >= 6 && !out.self && out.range >= 3) out.range += 1;
    const m = MODS[r.mod];
    if (m) {
      if (r.mod === 'range' && !out.self && out.range) out.range += 1;
      if (r.mod === 'cheap' && out.st > 0) out.st = Math.max(0, out.st - 5);
      if (r.mod === 'keen' && out.dmg > 0) out.dmg += 3;
      if (m.status && !out.self && out.dmg > 0) res.status = m.status.slice();
    }
    if (r.el && WHEEL.includes(r.el)) res.el = r.el;
    res.rule = out; return res;
  }

  /* ---------- actions (all return { ok, msg }) ---------- */
  const fail = msg => ({ ok: false, msg });
  const done = msg => { doSave(); return { ok: true, msg } };
  const rec = id => { const u = up(); return (u.cards[id] ||= { s: 1 }) };
  function takeSpare(id, n) {
    const P = pool();
    if (P) { P.combat[id] = Math.max(1, (P.combat[id] || 0) - n); const d = V().tacticDecks?.combat; if (d && d[id] > P.combat[id]) d[id] = P.combat[id] }
    else { const r = rec(id); r.spare = Math.max(0, (r.spare || 0) - n) }
  }
  function giveCopy(id, n = 1) {   /* a copy of a card the hero owns */
    const P = pool(); if (P) { P.combat ||= {}; P.combat[id] = (P.combat[id] || 0) + n } else { const r = rec(id); r.spare = (r.spare || 0) + n }
  }
  function starUp(id) {
    if (!COMBAT()[id] || !owned(id)) return fail('ยังไม่มีการ์ดนี้');
    if (starsOf(id) >= MAX) return fail('ครบ ★' + MAX + ' แล้ว');
    const need = needFor(id); if (spareOf(id) < need) return fail('ใบซ้ำไม่พอ · ต้องใช้ ' + need + ' ใบ (มี ' + spareOf(id) + ')');
    takeSpare(id, need); rec(id).s = starsOf(id) + 1; return done(nameOf(id) + ' เป็น ★' + starsOf(id) + ' แล้ว');
  }
  function dismantle(id, n = 1) {
    if (!owned(id)) return fail('ยังไม่มีการ์ดนี้'); if (spareOf(id) < n) return fail('ไม่มีใบซ้ำให้แยก');
    takeSpare(id, n); up().dust += n * dustOf(id); return done('แยก ' + nameOf(id) + ' ×' + n + ' ได้ ' + n * dustOf(id) + ' เศษแก่น');
  }
  function synth(id) {
    if (!owned(id)) return fail('ยังไม่มีการ์ดนี้'); if (dust() < COPY_COST) return fail('เศษแก่นไม่พอ · ต้องใช้ ' + COPY_COST);
    up().dust -= COPY_COST; giveCopy(id, 1); return done('ใช้เศษแก่น ' + COPY_COST + ' แปลงเป็นใบซ้ำของ ' + nameOf(id));
  }
  function imbue(id, el) {
    if (!owned(id)) return fail('ยังไม่มีการ์ดนี้'); if (el !== 'reset' && !WHEEL.includes(el)) return fail('ธาตุนี้เลือกไม่ได้');
    const own = BASE_EL[id] || null;
    if (el === 'reset' || (own && el === own)) { if (peekUp()?.cards?.[id]) delete rec(id).el; return done('คืนธาตุเดิมของ ' + nameOf(id)) }
    if (imbuedOf(id) === el) return fail('ธาตุนี้อยู่แล้ว');
    if (dust() < IMBUE) return fail('เศษแก่นไม่พอ · ต้องใช้ ' + IMBUE); up().dust -= IMBUE; rec(id).el = el;
    return done(nameOf(id) + ' เปลี่ยนเป็นธาตุ ' + (root.ElementWheel?.info(el)?.th || el));
  }
  function craftChip(kind) {
    if (!MODS[kind]) return fail('ไม่มีชิปนี้'); if (dust() < CHIP_COST) return fail('เศษแก่นไม่พอ · ต้องใช้ ' + CHIP_COST);
    const u = up(); u.dust -= CHIP_COST; u.chips[kind] = (u.chips[kind] || 0) + 1; return done('ได้ชิป ' + MODS[kind].name);
  }
  function installMod(id, kind) {
    if (!owned(id)) return fail('ยังไม่มีการ์ดนี้'); if (!MODS[kind]) return fail('ไม่มีชิปนี้'); if (!(chips()[kind] > 0)) return fail('ไม่มีชิป ' + MODS[kind].name);
    const u = up(), r = rec(id); if (r.mod) u.chips[r.mod] = (u.chips[r.mod] || 0) + 1;   /* the old chip comes back */
    u.chips[kind]--; r.mod = kind; return done('ใส่ชิป ' + MODS[kind].name + ' ให้ ' + nameOf(id));
  }
  function removeMod(id) {
    const r = peekUp()?.cards?.[id]; if (!r?.mod) return fail('ไม่มีชิปในการ์ดนี้');
    const u = up(); u.chips[r.mod] = (u.chips[r.mod] || 0) + 1; delete rec(id).mod; return done('ถอดชิปคืนแล้ว');
  }
  /* rewards from the world: a source gives shards and / or a chip */
  const KINDS = Object.keys(MODS);
  function addDust(n) { up().dust += n }
  function addChip(kind) { const u = up(), k = kind || KINDS[Math.floor(Math.random() * KINDS.length)]; u.chips[k] = (u.chips[k] || 0) + 1; return k }
  function reward(src) {
    if (!V()) return null; const R = Math.random; let txt = '';
    if (src === 'boss') { const n = 3; addDust(n); const k = addChip(); txt = 'เศษแก่น +' + n + ' · ชิป ' + MODS[k].name }
    else if (src === 'bounty') { addDust(3); const k = addChip(); txt = 'เศษแก่น +3 · ชิป ' + MODS[k].name }
    else if (src === 'guild') { if (R() < .35) { if (R() < .5) { addDust(2); txt = 'เศษแก่น +2' } else { const k = addChip(); txt = 'ชิป ' + MODS[k].name } } }
    else if (src === 'farm') { if (R() < .5) { addDust(2); txt = 'เศษแก่น +2' } else { const k = addChip(); txt = 'ชิป ' + MODS[k].name } }
    if (txt) { doSave(); toast('◈ ' + esc(txt), 'good') } return txt || null;
  }
  const cost = { MAX, NEED, IMBUE, CHIP_COST, COPY_COST };

  /* ---------- UI (inside the "จัดสำรับต่อสู้" panel) ---------- */
  let back = null;
  const CSS = `.cf{display:grid;gap:10px}.cf h3{margin:4px 0 2px}.cf .cf-head{display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap}.cf .cf-pic{width:150px;flex:none}.cf .cf-stars{font-size:26px;letter-spacing:2px;color:#e8c34a;text-shadow:0 1px 0 #0008}.cf .cf-stars i{font-style:normal;color:#5a5240}
  .cf .cf-box{border:1px solid #b49a5a;border-radius:10px;padding:8px 10px;background:#fff6dcb8;color:#2a1d08}.cf .cf-row{display:flex;gap:6px;flex-wrap:wrap;align-items:center}.cf button{cursor:pointer}.cf .cf-el button.on{outline:2px solid #ffd86a}.cf .cf-msg{min-height:1.4em;color:#2e6a2a;font-weight:600}.cf .cf-msg.bad{color:#a02a1a}.cf small{color:#6a5530}.cf button:disabled{opacity:.45;cursor:default}
  .tdk-forge{margin-left:4px}`;
  function ensureCss() { if (document.getElementById('cfCss')) return; const st = document.createElement('style'); st.id = 'cfCss'; st.textContent = CSS; document.head.appendChild(st) }
  const starHtml = n => '★'.repeat(n) + '<i>' + '★'.repeat(MAX - n) + '</i>';
  function effectText(id) {
    const s = starsOf(id), k = (1 + STAR_K * (s - 1)).toFixed(2), parts = [];
    if (s > 1) parts.push('ดาเมจ/กัน/ฟื้น ×' + k);
    if (s >= 3) parts.push('ใช้แรง −2'); if (s >= 6) parts.push('ระยะไกล +1');
    return parts.join(' · ') || 'ยังไม่มีโบนัสดาว';
  }
  function elLabel(el) { const E = root.ElementWheel?.info(el); return E ? E.icon + ' ' + E.th : el }
  function open(id, backFn, msg, bad) {
    if (typeof villageDialog !== 'function') return; ensureCss(); if (backFn) back = backFn;
    const s = starsOf(id), need = needFor(id), sp = spareOf(id), u = peekUp() || { dust: 0, chips: {} }, own = BASE_EL[id] || null, cur = imbuedOf(id) || own, m = modOf(id), html = root.CardStudio?.renderCard?.('a-' + id, { mini: false }) || '';
    const chipRows = KINDS.map(k => `<button type="button" data-cf="mod:${k}" ${(u.chips?.[k] || 0) < 1 ? 'disabled' : ''} title="${esc(MODS[k].desc)}">${MODS[k].icon} ${MODS[k].name} ×${u.chips?.[k] || 0}${m === k ? ' (ใส่อยู่)' : ''}</button>`).join('');
    const craftRows = KINDS.map(k => `<button type="button" data-cf="craft:${k}" ${dust() < CHIP_COST ? 'disabled' : ''} title="${esc(MODS[k].desc)}">${MODS[k].icon} ${MODS[k].name}</button>`).join('');
    const elRows = WHEEL.map(e => `<button type="button" data-cf="el:${e}" class="${cur === e ? 'on' : ''}" ${cur === e ? '' : (e !== own && dust() < IMBUE ? 'disabled' : '')}>${elLabel(e)}${e === own ? ' (เดิม)' : ''}</button>`).join('');
    villageDialog('เสริมการ์ด · ' + nameOf(id), `<div class="cf"><div class="cf-head"><div class="cf-pic">${html}</div><div><div class="cf-stars">${starHtml(s)}</div><div>${esc(effectText(id))}</div>
      <p class="small">ธาตุ: ${cur ? elLabel(cur) : 'ตามอาวุธที่ถือ'}${m ? ' · ชิป: ' + MODS[m].icon + ' ' + MODS[m].name : ' · ยังไม่มีชิป'}</p><p class="small">เศษแก่น <b>◈ ${dust()}</b> · ใบซ้ำของการ์ดนี้ <b>${sp}</b></p></div></div>
      <div class="cf-box"><h3>★ รวมใบซ้ำ</h3>${s >= MAX ? '<p>ครบ ★' + MAX + ' แล้ว</p>' : `<p class="small">★${s + 1} ต้องใช้ใบซ้ำ ${need} ใบ</p><div class="cf-row"><button type="button" data-cf="star" ${sp < need ? 'disabled' : ''}>★ เสริมเป็น ★${s + 1}</button><button type="button" data-cf="synth" ${dust() < COPY_COST ? 'disabled' : ''}>แปลงเศษ ${COPY_COST} → ใบซ้ำ 1 ใบ</button></div>`}
        <div class="cf-row" style="margin-top:6px"><button type="button" data-cf="dis" ${sp < 1 ? 'disabled' : ''}>แยกใบซ้ำ 1 ใบ → เศษ ${dustOf(id)}</button></div></div>
      <div class="cf-box cf-el"><h3>ธาตุ <small>(เปลี่ยนใช้เศษ ${IMBUE} · คืนธาตุเดิมฟรี)</small></h3><div class="cf-row">${elRows}</div>${imbuedOf(id) ? '<div class="cf-row" style="margin-top:6px"><button type="button" data-cf="el:reset">คืนธาตุเดิม</button></div>' : ''}</div>
      <div class="cf-box"><h3>ชิปเสริม <small>(ใส่ได้ 1 ช่อง)</small></h3><div class="cf-row">${chipRows}${m ? '<button type="button" data-cf="unmod">ถอดชิปคืน</button>' : ''}</div><details style="margin-top:6px"><summary>สร้างชิปจากเศษ ${CHIP_COST}</summary><div class="cf-row">${craftRows}</div></details></div>
      <p class="cf-msg ${bad ? 'bad' : ''}">${esc(msg || '')}</p><div class="cf-row"><button type="button" data-cf="back" class="primary">← กลับไปจัดสำรับ</button></div></div>`);
    document.querySelectorAll('[data-cf]').forEach(b => b.onclick = () => {
      const [a, x] = b.dataset.cf.split(':'); let r;
      if (a === 'back') { try { back?.() } catch (e) { } return }
      if (a === 'star') r = starUp(id); else if (a === 'dis') r = dismantle(id, 1); else if (a === 'synth') r = synth(id); else if (a === 'el') r = imbue(id, x === 'reset' ? 'reset' : x);
      else if (a === 'mod') r = installMod(id, x); else if (a === 'unmod') r = removeMod(id); else if (a === 'craft') r = craftChip(x);
      if (r) open(id, null, r.msg, !r.ok);
    });
    try { root.CardStudio?.fit?.(document.getElementById('panelContent')) } catch (e) { }
  }
  /* a small "★n" tag + button for the deck list */
  const badge = id => { const s = starsOf(id), m = modOf(id), e = imbuedOf(id); return (s > 1 ? '<b class="cf-tag" style="color:#e8c34a"> ★' + s + '</b>' : '') + (e ? ' <small>' + (root.ElementWheel?.info(e)?.icon || '') + '</small>' : '') + (m ? ' <small>' + MODS[m].icon + '</small>' : '') };

  root.CardForge = { MODS, WHEEL, BASE_EL, MAX, cost, starsOf, modOf, imbuedOf, spareOf, needFor, dust, chips, owned, derive, starUp, dismantle, synth, imbue, craftChip, installMod, removeMod, giveCopy, addDust, addChip, reward, open, badge, effectText, dustOf };
})(globalThis);
