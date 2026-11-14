/* v98.44 · ฉายา (Titles) — hidden-condition epithets that give small permanent bonuses.
   • 5 tiers: 1 สามัญ · 2 ชำนาญ · 3 เลื่องลือ · 4 ตำนาน · 5 ลับ (secret: not even listed until earned).
   • Conditions are NEVER shown to the player: a locked title shows "???" and its tier only. When earned it shows the line `story`.
   • Bonuses (equipped titles only, slots = 1 at Lv1 · 2 at Lv5 · 3 at Lv10 · 4 at Lv18): power · spell · crit · armor · hp · st · xp% · gold%.
     Harder title → bigger bonus. Totals are capped so a full set cannot break the card battles (CAP below).
   • Data: g.village.titles = { tally:{key:n}, earned:{id:{day}}, equipped:[id], streak, best }.
     Counters come from Titles.battle(g, info) (world-map fights) and Titles.note(g, key, n); the rest is read from the save when Titles.check(g) runs.
   Pure functions on the save object → tools/test-titles.cjs. */
(function (root) {
  'use strict';
  const TIERS = { 1: { name: 'สามัญ', col: '#a9855a', mark: '●' }, 2: { name: 'ชำนาญ', col: '#9aa7b3', mark: '◆' }, 3: { name: 'เลื่องลือ', col: '#e0b13c', mark: '★' }, 4: { name: 'ตำนาน', col: '#b06af0', mark: '✦' }, 5: { name: 'ลับ', col: '#ff6a5a', mark: '❖' } };
  const CAP = { power: 6, spell: 6, crit: .12, armor: 5, hp: 60, st: 40, xp: .25, gold: .25 };
  const LABEL = { power: 'การ์ดอาวุธ', spell: 'การ์ดธาตุ', crit: 'คริติคอล', armor: 'เกราะ', hp: 'HP สูงสุด', st: 'แรงสนามรบ', xp: 'EXP การต่อสู้', gold: 'เงินจากการต่อสู้' };
  const PCT = new Set(['crit', 'xp', 'gold']);

  /* c(g, T) → true when earned. T = tally. `lv` etc. are read from the save. */
  const num = (x, d = 0) => Number.isFinite(+x) ? +x : d;
  const V = g => g.village || {};
  const lvOf = g => num(V(g).character?.level, 1);
  const jobs = g => V(g).character?.jobs || {};
  const maxJob = g => Math.max(0, ...Object.values(jobs(g)).map(j => num(j?.lv)));
  const jobsAt = (g, n) => Object.values(jobs(g)).filter(j => num(j?.lv) >= n).length;
  const T = (id, name, tier, fx, story, cond) => ({ id, name, tier, fx, story, cond });
  /* ---------- v98.473 · CHRONICLE (บันทึกเหตุการณ์): the big moments of the main story, each written once. g.village.chronicle = [{ id, day, text }].
     Pure on the save object. Phase A of docs/lore/MAIN-STORY-CANON.md: only the ids the game already reaches are written today; the rest are ready for the later phases. */
  const CHRON = {
    'mip.seen': 'ในฝูงแพะของปิ๊บมีตัวหนึ่งที่ไม่ใช่แพะ — มันกลายเป็นจิ้งจอกตัวเล็กแล้ววิ่งหายเข้าป่า',
    'mip.joined': 'จิ้งจอกตัวเล็กกลับมาอยู่กับเรา โดยไม่มีใครรู้ว่ามันมาจากไหน',
    'mip.fed': 'ป้อนเศษของสัตว์ร้ายให้จิ้งจอก มันแปลงร่างตามสิ่งที่กินเข้าไป',
    'mip.released': 'ปล่อยวิญญาณที่ถูกกักอยู่ในตัวจิ้งจอก — ตัวมันเปลี่ยนไป',
    'mip.purified': 'จิ้งจอกกลับเป็นสัตว์ป่าบริสุทธิ์ ลืมทุกอย่าง แล้ววิ่งกลับป่าตะวันออก',
    'mip.sealed': 'จิ้งจอกหลับลงเป็นผลึกสงบ — ผนึกไว้ ไม่ตาย',
    'mine.closed': 'เหมืองถูกปิด การขุดหยุดลง',
    'mine.freed': 'ผู้ที่ถูกส่งลงเหมืองได้กลับขึ้นมา',
    'merchant.fair': 'ยามสงคราม ไม่โก่งราคาของจำเป็น',
    'end.peace': 'สองอาณาจักรหยุดรบ แม้เพียงชั่วคราว'
  };
  const chron = g => ((g.village ||= {}).chronicle ||= []);
  const has = (g, id) => chron(g).some(e => e.id === id);
  /* write a moment once · text optional (defaults to the line above) · returns true when it was new */
  function log(g, id, text) { if (!id || has(g, id)) return false; chron(g).push({ id, day: num(g.day, 1), text: String(text || CHRON[id] || id) }); try { check(g) } catch (e) { } return true }
  const chronicle = g => chron(g).slice();
  const LIST = [
    /* ── ระดับ 1 สามัญ ── */
    T('rookie', 'มือใหม่หัดดาบ', 1, { hp: 3 }, 'ชนะการต่อสู้ครั้งแรกนอกหมู่บ้าน', (g, t) => t.win >= 1),
    T('wolfbane', 'ผู้ไล่หมาป่า', 1, { hp: 4 }, 'ปราบหมาป่าไปห้าตัวแล้ว เสียงหอนเริ่มเบาลง', (g, t) => (t['foe:wolf'] || 0) >= 5),
    T('bandithunter', 'หนามยอกโจร', 1, { hp: 4 }, 'โจรป่าเริ่มเปลี่ยนเส้นทางเมื่อเห็นเงาคุณ', (g, t) => (t['foe:bandit'] || 0) >= 5),
    T('wayfarer', 'เท้าเปื้อนดิน', 1, { st: 6 }, 'เดินทางมาครบหนึ่งสัปดาห์', (g) => num(g.day) >= 8),
    T('survivor', 'รอดมาได้', 1, { hp: 5 }, 'ชนะทั้งที่เลือดเกือบหมดตัว', (g, t) => t.clutch >= 1),
    T('seasoned', 'ผ่านร้อนผ่านหนาว', 1, { st: 8 }, 'เติบโตจนเป็นนักเดินทางตัวจริง', (g) => lvOf(g) >= 5),
    T('pennywise', 'รู้ค่าเหรียญ', 1, { gold: .03 }, 'เก็บเหรียญได้ถึงห้าร้อย', (g) => num(V(g).coins) >= 500),
    /* ── ระดับ 2 ชำนาญ ── */
    T('veteran', 'ทหารผ่านศึก', 2, { power: 1 }, 'ผ่านสนามรบมายี่สิบห้าครั้ง', (g, t) => t.win >= 25),
    T('nightwalker', 'ผู้เดินราตรี', 2, { crit: .02 }, 'ความมืดไม่ใช่ปัญหาของคุณ', (g, t) => t.night >= 5),
    T('unscathed', 'ไร้รอยขีดข่วน', 2, { armor: 1 }, 'ชนะโดยไม่เสียเลือดสักหยด หลายต่อหลายครั้ง', (g, t) => t.flawless >= 3),
    T('closecall', 'ฉิวเฉียดความตาย', 2, { hp: 8 }, 'หวุดหวิดจนเพื่อนใจหาย — และทำซ้ำอีก', (g, t) => t.clutch >= 3),
    T('lonewolf', 'หมาป่าเดียวดาย', 2, { power: 1, crit: .01 }, 'ออกรบคนเดียวแล้วชนะมาได้', (g, t) => t.solo >= 5),
    T('packhunter', 'นักล่าฝูง', 2, { power: 1 }, 'ร้อยชีวิตแห่งป่าผ่านมือคุณ', (g, t) => t.kills >= 100),
    T('scholar', 'ผู้ใฝ่รู้', 2, { spell: 1, xp: .03 }, 'ฝึกฝนอาชีพจนชำนาญ', (g) => maxJob(g) >= 3),
    T('craftsman', 'ลูกมือเหล็กกล้า', 2, { xp: .05 }, 'ฝีมือช่างเริ่มเป็นที่ร่ำลือ', (g) => num(V(g).smith?.level, 1) >= 4),
    T('guardian', 'เพื่อนร่วมสาบาน', 2, { hp: 6, armor: 1 }, 'พาเพื่อนรอดมาทุกครั้ง', (g, t) => t.allySafe >= 10),
    /* ── ระดับ 3 เลื่องลือ ── */
    T('bosskiller', 'ผู้สยบเจ้าป่า', 3, { power: 2 }, 'เจ้าถิ่นสามตนล้มลงตรงหน้า', (g, t) => t.boss >= 3),
    T('streak10', 'ไร้พ่าย', 3, { crit: .03, armor: 1 }, 'ชนะติดต่อกันสิบครั้ง', (g, t) => t.best >= 10),
    T('eliteslayer', 'หนามยอกอก', 3, { power: 1, hp: 8 }, 'ยอดฝีมือสิบคนล้มเพราะคุณ', (g, t) => t.elite >= 10),
    T('shadowless', 'เงาไร้รอย', 3, { armor: 2 }, 'สิบครั้งที่ไม่มีใครแตะต้องตัวคุณได้', (g, t) => t.flawless >= 10),
    T('ironwill', 'จิตเหล็ก', 3, { hp: 14 }, 'ยืนหยัดจากปากเหว สิบครั้ง', (g, t) => t.clutch >= 10),
    T('grown', 'ผู้เติบโต', 3, { hp: 10, st: 10 }, 'ก้าวเข้าสู่ระดับสิบ', (g) => lvOf(g) >= 10),
    T('adept', 'ปรมาจารย์สายอาชีพ', 3, { spell: 2, xp: .05 }, 'เส้นทางอาชีพถึงขั้นสูงสุด', (g) => maxJob(g) >= 5),
    T('merchantking', 'เศรษฐีผู้ถ่อมตน', 3, { gold: .08 }, 'ทรัพย์สินพันเหรียญ แต่ยังใส่รองเท้าเดิม', (g) => num(V(g).coins) >= 1500),
    /* ── ระดับ 4 ตำนาน ── */
    T('legend', 'ตำนานแห่งเฟิร์น', 4, { power: 3, crit: .04 }, 'ชื่อของคุณถูกเล่าในโรงเตี๊ยมทุกหลัง', (g, t) => t.kills >= 500 && t.boss >= 10),
    T('undying', 'ผู้ไม่ล้ม', 4, { armor: 3, hp: 20 }, 'ชนะติดต่อกันยี่สิบห้าครั้ง', (g, t) => t.best >= 25),
    T('polymath', 'ร้อยศาสตร์', 4, { spell: 3, power: 2, xp: .06 }, 'เชี่ยวชาญหลายเส้นทางพร้อมกัน', (g) => jobsAt(g, 3) >= 4),
    T('bulwark', 'ป้อมปราการเดินได้', 4, { armor: 3, hp: 25 }, 'หนึ่งร้อยครั้งที่ไม่เสียเพื่อนแม้แต่คนเดียว', (g, t) => t.allySafe >= 100),
    /* ── ระดับ 5 ลับ ── */
    T('witness', 'ผู้เห็นการบิดเบี้ยว', 2, { crit: .02, spell: 1 }, 'เห็นสัตว์ร้ายวิวัฒน์ต่อหน้าต่อตา หลายครั้งจนไม่ตกใจแล้ว', (g, t) => (t.evolve || 0) >= 5),
    T('chaosHunter', 'นักล่าผู้ถูกโกลาหลมอง', 3, { power: 1, hp: 8 }, 'ล้มสัตว์ร้ายที่วิวัฒน์ไปสิบตัว', (g, t) => (t.evolveKill || 0) >= 10),
    T('gratChosen', 'ผู้ที่โกลาหลตอบรับ', 4, { spell: 3, crit: .03, armor: 1 }, 'แก่นโกลาหลสะสมจนผลึกในกายสั่นพ้อง', (g) => (g.village?.chaos?.total || 0) >= 15),
    T('stubborn', 'คนไม่ยอมแพ้', 5, { power: 1, hp: 10 }, 'ล้มมาแล้วนับครั้งไม่ถ้วน แต่ยังลุกขึ้นทุกครั้ง', (g, t) => t.lose >= 15 && t.win >= 15),
    T('phoenix', 'ฟื้นจากเถ้า', 5, { hp: 20, armor: 1, xp: .05 }, 'แพ้ติดกันสามครั้ง แล้วกลับมาชนะติดกันห้าครั้ง', (g, t) => !!t.phoenix),
    T('coward', 'ผู้หนีอย่างมีศิลป์', 5, { st: 15, armor: 1 }, 'หนีรอดมาสิบครั้ง — บางทีนั่นคือความฉลาด', (g, t) => t.flee >= 10),
    T('ancient', 'ผู้อยู่มานาน', 5, { hp: 15, st: 15 }, 'หนึ่งร้อยวันผ่านไปแล้ว', (g) => num(g.day) >= 100),
    /* ── เนื้อเรื่องหลัก (docs/lore/MAIN-STORY-CANON.md · v98.473) — ปลดจากบันทึกเหตุการณ์ (chronicle) ที่เรื่องหลักเขียนไว้ · ลับ ไม่ลงรายการจนกว่าจะได้ ── */
    T('foxseen', 'ผู้เห็นแพะที่เกินมา', 5, { st: 10 }, 'ในฝูงแพะของปิ๊บ มีตัวหนึ่งที่ไม่ใช่แพะ — และคุณเห็นมันเปลี่ยนร่าง', (g) => has(g, 'mip.seen')),
    T('foxfriend', 'เพื่อนของจิ้งจอก', 5, { hp: 8, st: 8 }, 'ได้เพื่อนตัวเล็กที่ไม่มีใครรู้ที่มา', (g) => has(g, 'mip.joined')),
    T('foxfeeder', 'ผู้ป้อนจิ้งจอก', 5, { spell: 1 }, 'ป้อนเศษของสัตว์ร้ายให้เพื่อนตัวเล็ก — และมันเปลี่ยนไปทุกครั้ง', (g) => has(g, 'mip.fed')),
    T('collarfree', 'ผู้ปลดปลอกคอ', 5, { power: 1, hp: 10 }, 'ปล่อยผู้ที่ถูกกักไว้ แม้รู้ว่าอาจต้องแลกด้วยบางสิ่ง', (g) => has(g, 'mip.released')),
    T('shadowcleanser', 'ผู้ชำระเงา', 5, { hp: 20, armor: 1, xp: .05 }, 'เรียกชื่อเดิมของมันกลับมา — มันลืมทุกอย่าง แต่กลับบ้านได้', (g) => has(g, 'mip.purified')),
    T('sleepkeeper', 'ผู้เฝ้าการหลับ', 5, { armor: 2, hp: 12 }, 'ผนึกเพื่อนให้หลับเพื่อโลกจะตื่นต่อไปได้', (g) => has(g, 'mip.sealed')),
    T('minecloser', 'ผู้ปิดเหมือง', 5, { power: 2, armor: 1 }, 'หยุดการขุดก่อนที่ความหิวจะโตกว่านี้', (g) => has(g, 'mine.closed')),
    T('chainbreaker', 'ผู้ปล่อยเชลย', 5, { hp: 15, st: 10 }, 'ผู้คนที่ถูกส่งลงเหมืองได้กลับขึ้นมาเพราะคุณ', (g) => has(g, 'mine.freed')),
    T('fairtrader', 'พ่อค้าผู้ไม่โก่งราคา', 5, { gold: .06 }, 'ยามสงคราม ไม่ขายของจำเป็นแพงกว่าที่ควร', (g) => has(g, 'merchant.fair')),
    T('peacemaker', 'ผู้ทำให้ปืนเงียบ', 5, { power: 2, spell: 2, hp: 20 }, 'ทำให้สองอาณาจักรหยุดรบ แม้เพียงชั่วคราว', (g) => has(g, 'end.peace')),
    T('chosen', 'ผู้ถูกเลือก', 5, { power: 2, spell: 2, crit: .03, armor: 2, hp: 20, st: 10, xp: .05 }, 'สะสมฉายาไว้มากพอจะทำให้โลกหันมามอง', (g, t, earned) => Object.keys(earned).length >= 20)
  ];
  const ICON = {"foxseen": "🦊", "foxfriend": "🦊", "foxfeeder": "🍖", "collarfree": "⛓", "shadowcleanser": "✨", "sleepkeeper": "💎", "minecloser": "⛏", "chainbreaker": "🔓", "fairtrader": "⚖", "peacemaker": "🕊", "rookie": "🗡", "wolfbane": "🐺", "bandithunter": "🏹", "wayfarer": "👣", "survivor": "🩹", "seasoned": "⛰", "pennywise": "🪙", "veteran": "🛡", "nightwalker": "🌙", "unscathed": "✨", "closecall": "⚡", "lonewolf": "🐾", "packhunter": "🏔", "scholar": "📖", "craftsman": "🔨", "guardian": "🤝", "bosskiller": "👑", "streak10": "🔥", "eliteslayer": "🥀", "shadowless": "🌫", "ironwill": "⛓", "grown": "🌳", "adept": "🔮", "merchantking": "💰", "legend": "🏆", "undying": "♾", "polymath": "☯", "bulwark": "🏰", "stubborn": "💢", "phoenix": "🔥", "coward": "🍃", "ancient": "⏳", "chosen": "👁", "witness": "👀", "chaosHunter": "✷", "gratChosen": "🌀"};
  const BY = Object.fromEntries(LIST.map(x => [x.id, x]));

  const st = g => { const v = (g.village ||= {}); const o = (v.titles ||= {}); o.tally ||= {}; o.earned ||= {}; o.equipped ||= []; return o };
  const slots = g => { const l = lvOf(g); return 1 + (l >= 5) + (l >= 10) + (l >= 18) };
  const tally = g => { const o = st(g); return { ...o.tally, best: o.best || 0 } };

  function note(g, key, n = 1) { const o = st(g); o.tally[key] = (o.tally[key] || 0) + n; return o.tally[key] }

  /* a finished fight on the world map.
     info = { outcome:'win'|'lose'|'flee', foe, boss, elite, night, kills, hp0, hp1, maxHp, party:int (companions who fought), allyDown:int } */
  function battle(g, info) {
    const o = st(g), i = info || {}; o.streak = o.streak || 0; o.lossRun = o.lossRun || 0;
    if (i.outcome === 'win') {
      note(g, 'win'); note(g, 'kills', num(i.kills));
      if (i.boss) note(g, 'boss'); if (i.elite) note(g, 'elite'); if (i.night) note(g, 'night');
      if (i.foe) note(g, 'foe:' + String(i.foe).replace(/\*.*$/, ''));
      if (num(i.hp1) >= num(i.hp0) && num(i.hp0) > 0) note(g, 'flawless');
      if (num(i.maxHp) > 0 && num(i.hp1) > 0 && num(i.hp1) <= num(i.maxHp) * .15) note(g, 'clutch');
      if (!i.party) note(g, 'solo'); else if (!i.allyDown) note(g, 'allySafe');
      o.streak++; o.best = Math.max(o.best || 0, o.streak);
      if (o.armed) { o.rec = (o.rec || 0) + 1; if (o.rec >= 5) o.tally.phoenix = 1 }
      o.lossRun = 0;
    } else {
      o.streak = 0;
      if (i.outcome === 'flee') note(g, 'flee');
      else { note(g, 'lose'); o.lossRun++; o.rec = 0; if (o.lossRun >= 3) o.armed = true }
    }
    return check(g);
  }

  /* looks at the save and awards everything whose (hidden) condition is now true. returns the new title objects */
  function check(g) {
    const o = st(g), t = tally(g), out = [];
    for (let pass = 0; pass < 2; pass++) for (const d of LIST) {
      if (o.earned[d.id]) continue;
      let ok = false; try { ok = !!d.cond(g, t, o.earned) } catch (e) { }
      if (ok) { o.earned[d.id] = { day: num(g.day, 1) }; out.push(d); if (o.equipped.length < slots(g)) o.equipped.push(d.id) }
    }
    if (out.length) { sync(g); try { root.Titles.onEarn?.(out, g) } catch (e) { } }
    return out;
  }
  function sync() { /* bonuses are read live by Progression.heroCombat */ }

  function equip(g, id) {
    const o = st(g); if (!o.earned[id] || o.equipped.includes(id)) return false;
    if (o.equipped.length >= slots(g)) return false; o.equipped.push(id); sync(g); return true;
  }
  function unequip(g, id) { const o = st(g), i = o.equipped.indexOf(id); if (i < 0) return false; o.equipped.splice(i, 1); sync(g); return true }
  function swap(g, outId, inId) { unequip(g, outId); return equip(g, inId) }

  /* summed bonuses of the equipped titles, capped */
  function mods(g) {
    const o = g?.village?.titles, m = {}; if (!o) return m;
    for (const id of o.equipped || []) { const d = BY[id]; if (!d || !o.earned?.[id]) continue; for (const [k, v] of Object.entries(d.fx)) m[k] = (m[k] || 0) + v }
    for (const k of Object.keys(m)) if (CAP[k] != null) m[k] = Math.min(CAP[k], m[k]);
    return m;
  }
  function fxText(fx) { return Object.entries(fx).map(([k, v]) => LABEL[k] + ' +' + (PCT.has(k) ? Math.round(v * 100) + '%' : v)).join(' · ') }

  /* what the UI may show. Locked titles reveal ONLY their tier; secret (tier 5) locked titles are not listed at all (just counted as "?"). */
  function view(g) {
    const o = st(g), rows = [];
    for (const d of LIST) {
      const got = o.earned[d.id];
      if (got) rows.push({ id: d.id, name: d.name, icon: ICON[d.id] || '✦', tier: d.tier, got: true, day: got.day, story: d.story, fx: fxText(d.fx), on: o.equipped.includes(d.id) });
      else if (d.tier < 5) rows.push({ id: d.id, tier: d.tier, got: false });
    }
    return { rows, secretLeft: LIST.filter(d => d.tier === 5 && !o.earned[d.id]).length, slots: slots(g), used: o.equipped.length, total: LIST.length, earned: Object.keys(o.earned).length };
  }
  const current = g => (st(g).equipped || []).map(id => BY[id]).filter(Boolean);

  /* ---------- the title CARD (pure HTML + CSS injected once; tier 3+ gets a holo shimmer, tier 5 a red flame frame) ---------- */
  const CSS = `.tcards{display:grid;grid-template-columns:repeat(auto-fill,minmax(138px,1fr));gap:12px;margin:8px 0 14px}
.tcard{--c:#a9855a;position:relative;aspect-ratio:5/7;border-radius:12px;padding:8px 8px 9px;display:flex;flex-direction:column;align-items:center;text-align:center;color:#fff3d8;cursor:default;border:0;font:inherit;
 background:linear-gradient(160deg,#2a2218,#15110b 70%);box-shadow:0 0 0 2px var(--c),0 0 0 4px #0008,0 6px 14px #0007;overflow:hidden;transition:transform .15s}
button.tcard{cursor:pointer}button.tcard:hover:not(:disabled){transform:translateY(-3px) rotate(-.6deg)}button.tcard:disabled{cursor:not-allowed;opacity:.8}
.tcard .tt{font-size:10px;letter-spacing:.08em;color:var(--c);font-weight:700}
.tcard .em{margin:6px 0 4px;width:62px;height:62px;border-radius:50%;display:grid;place-items:center;font-size:32px;background:radial-gradient(circle at 35% 30%,color-mix(in srgb,var(--c) 55%,#fff),var(--c) 60%,#000 140%);box-shadow:inset 0 0 0 2px #fff6,0 0 14px var(--c)}
.tcard b{font-size:13px;line-height:1.15;margin:2px 0}.tcard .fx{font-size:10.5px;color:#ffe6a8;margin-top:auto}.tcard .st{font-size:9.5px;opacity:.72;margin:3px 0;line-height:1.25}
.tcard .on{position:absolute;top:6px;right:-24px;transform:rotate(40deg);background:var(--c);color:#1a1208;font-size:9px;font-weight:800;padding:1px 26px}
.tcard.t3::after,.tcard.t4::after,.tcard.t5::after{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,transparent 30%,#ffffff38 48%,transparent 66%);background-size:250% 100%;animation:tcShine 3.2s linear infinite}
.tcard.t4{background:linear-gradient(160deg,#2b1745,#120a1f 70%)}.tcard.t5{background:linear-gradient(160deg,#4a1410,#1a0705 70%);animation:tcFlame 1.6s ease-in-out infinite alternate}
.tcard.lock{background:repeating-linear-gradient(45deg,#1b1812 0 8px,#211d15 8px 16px);filter:saturate(.5)}.tcard.lock .em{background:#2c261b;box-shadow:inset 0 0 0 2px #fff2;font-size:28px;opacity:.7}.tcard.lock b{opacity:.6}
@keyframes tcShine{to{background-position:-150% 0}}@keyframes tcFlame{to{box-shadow:0 0 0 2px var(--c),0 0 0 4px #0008,0 0 22px #ff4a2a99}}
.tcReveal{position:fixed;inset:0;z-index:99999;display:grid;place-items:center;background:#000b;opacity:0;transition:opacity .3s}.tcReveal.on{opacity:1}
.tcReveal .tcard{width:min(62vw,250px);transform:rotateY(90deg) scale(.7);animation:tcFlip .7s .15s cubic-bezier(.2,1.3,.4,1) forwards}.tcReveal p{color:#ffe6a8;text-align:center;margin:12px 0 0;font:600 14px AgThai,system-ui,sans-serif}
@keyframes tcFlip{to{transform:rotateY(0) scale(1)}}`;
  function css() { if (typeof document === 'undefined' || document.getElementById('tcardCss')) return; const e = document.createElement('style'); e.id = 'tcardCss'; e.textContent = CSS; document.head.append(e) }
  /* r = a row of Titles.view(). Locked rows show a blank card back — no name, no bonus. extra: {button, onclick} */
  function cardHtml(r, o = {}) {
    css(); const t = TIERS[r.tier], tag = o.onclick ? 'button' : 'div';
    if (!r.got) return `<${tag} class="tcard lock t${r.tier}" style="--c:${t.col}" disabled><span class="tt">${t.mark} ${t.name}</span><span class="em">?</span><b>«???»</b><span class="st">ยังไม่รู้ว่าทำอย่างไรจึงจะได้</span></${tag}>`;
    return `<${tag} class="tcard t${r.tier}" style="--c:${t.col}" ${o.onclick ? `onclick="${o.onclick}"` : ''} ${o.disabled ? 'disabled' : ''} title="${o.title || ''}">${r.on ? '<span class="on">ใส่อยู่</span>' : ''}<span class="tt">${t.mark} ${t.name}</span><span class="em">${r.icon}</span><b>«${r.name}»</b><span class="st">${r.story}</span><span class="fx">${r.fx}</span></${tag}>`;
  }
  /* full-screen "you got a title" reveal (tier 3+ from the caller's choice); tap to close */
  function reveal(d, g) {
    if (typeof document === 'undefined') return; css();
    const row = { id: d.id, name: d.name, icon: ICON[d.id] || '✦', tier: d.tier, got: true, story: d.story, fx: fxText(d.fx), on: false };
    const el = document.createElement('div'); el.className = 'tcReveal'; el.innerHTML = cardHtml(row) + `<p>🏅 ได้รับฉายาใหม่ · แตะเพื่อปิด</p>`;
    el.style.flexDirection = 'column'; el.style.display = 'flex'; el.style.alignItems = 'center'; el.style.justifyContent = 'center';
    el.onclick = () => { el.classList.remove('on'); setTimeout(() => el.remove(), 300) }; document.body.append(el); requestAnimationFrame(() => el.classList.add('on'));
    setTimeout(() => el.isConnected && el.onclick(), 6000);
  }
  const api = { log, has, chronicle, CHRON, cardHtml, reveal, css, TIERS, LIST, BY, CAP, LABEL, st, slots, note, battle, check, equip, unequip, swap, mods, view, current, fxText, onEarn: null };
  root.Titles = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
