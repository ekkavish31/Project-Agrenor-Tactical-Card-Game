/* v94.06 · F2 ความก้าวหน้าและอุปกรณ์ — shared by index.html (the game) and world-map.html / battle-field.html (iframes).
   v95.00 · balance pass: the hero's growth now counts in card battles (js/flat-battle.js reads power / spell / crit / armor / stMax).
   • Hero level (s.village.character.level/xp, need = 60 + 40 × level → Lv2 100, Lv5 ≈ 600 total, Lv10 2,340 total):
     each level gives HP max +4 (s.maxHp), stamina max +5 (s.maxStamina), +2 stat points. Cards unlock at set levels
     (LEVEL_CARDS — the height cards come first) — queued in s.village.levelUnlocks and revealed through StarterKit.unlock.
   • Stats count in battle as well as at the forge: กำลัง +1 damage on weapon cards · ความรู้ +1 on element cards ·
     ความประณีต +2 % critical · ความอึด +4 battle stamina. Level: +1 weapon damage every 2 levels, armour +1 every 3 levels.
   • Companions (s.village.party[i].level/xp, need = level × 80): HP max +4 and ATK +1 per level.
   • Gear stars ★1–★3: from craft quality (q3+ ★2, q5 ★3) or the recipe's own tier (zone recipes need zone drops).
     Weapon bonus on weapon cards = kind base + (quality − 1) + (★ − 1) × 2.
   • Battle XP (world map): 15 + danger × 25, elite +20, boss 80, +3 per kill; companions who fought get 80%.
   Pure functions on the save object → tests in tools/test-progression.cjs. */
(function (root) {
  'use strict';
  const BASE_HP = 60, HP_PER = 4, BASE_ST = 100, ST_PER = 5, BASE_ATK = 12, BASE_DEF = 3, ALLY_HP_PER = 4;
  const LEVEL_CARDS = {
    2: [{ group: 'combat', id: 'climb', n: 1 }],
    3: [{ group: 'combat', id: 'rockfall', n: 1 }],
    4: [{ group: 'combat', id: 'perch', n: 1 }, { group: 'combat', id: 'evade', n: 1 }],
    5: [{ group: 'combat', id: 'aimed', n: 1 }],
    6: [{ group: 'combat', id: 'whirl', n: 1 }, { group: 'combat', id: 'firstAid', n: 1 }],
    7: [{ group: 'combat', id: 'dive', n: 1 }],
    8: [{ group: 'combat', id: 'backstab', n: 1 }],
    9: [{ group: 'combat', id: 'tide', n: 1 }],
    10: [{ group: 'combat', id: 'twin', n: 1 }, { group: 'combat', id: 'wall', n: 1 }]
  };
  /* weapon base ATK by kind (the father's knife is the weakest) */
  const KIND_ATK = { knife: 0, hammer: 1, sword: 2, axe: 2, bow: 1, staff: 1 };
  /* zone recipes: added to the forge's RECIPES by the game page; `goods` are bag items (world-map drops) */
  const ZONE_RECIPES = {
    fangBlade: { name: 'ดาบเขี้ยวหมาป่า', kind: 'sword', level: 2, cost: { iron: 2, coal: 1, wood: 1 }, goods: { wolfFang: 2 }, sell: 70, xp: 30, star: 2, zone: 'ป่า · ทุ่งหญ้า (หมาป่า)' },
    crystalHammer: { name: 'ค้อนผลึกแร่', kind: 'hammer', level: 3, cost: { iron: 3, coal: 2 }, goods: { crystalShard: 2 }, sell: 95, xp: 40, star: 2, zone: 'เนินเขา · บึง (โคโบลด์ สไลม์ โกเล็ม)' },
    frostBlade: { name: 'ดาบน้ำค้างแข็ง', kind: 'sword', level: 4, cost: { iron: 3, coal: 2, wood: 1 }, goods: { frostFur: 1, pearl: 1 }, sell: 130, xp: 55, star: 3, zone: 'ทุ่งหิมะ + หาดทราย' }
  };

  const ch = g => { const v = g.village ||= {}; const c = v.character ||= { level: 1, xp: 0, points: 0, stats: {} }; c.level ||= 1; c.xp ||= 0; c.points ??= 0; return c };
  const heroLevel = g => ch(g).level;
  const heroMaxHp = lv => BASE_HP + HP_PER * (Math.max(1, lv) - 1);
  const heroMaxStamina = lv => BASE_ST + ST_PER * (Math.max(1, lv) - 1);
  const heroNeed = lv => 60 + 40 * lv;
  const allyNeed = lv => lv * 80;

  /* make s.maxHp / s.maxStamina match the level (old saves) */
  function sync(g) { const lv = heroLevel(g); g.maxHp = heroMaxHp(lv); g.maxStamina = heroMaxStamina(lv); if (Number.isFinite(g.hp) && g.hp > g.maxHp) g.hp = g.maxHp; return g }

  /* add hero XP; returns the levels reached (e.g. [3, 4]) — HP/stamina grow and heal by the gain, cards are queued */
  function gainHero(g, xp) {
    const c = ch(g), ups = []; c.xp += Math.max(0, Math.round(xp || 0));
    while (c.xp >= heroNeed(c.level)) { c.xp -= heroNeed(c.level); c.level++; c.points += 2; ups.push(c.level) }
    if (ups.length) {
      const before = g.maxHp || heroMaxHp(c.level - ups.length);
      sync(g);
      g.hp = Math.min(g.maxHp, (Number.isFinite(g.hp) ? g.hp : before) + (g.maxHp - before));
      const q = g.village.levelUnlocks ||= [];
      for (const lv of ups) if (LEVEL_CARDS[lv]) q.push({ level: lv, cards: LEVEL_CARDS[lv] });
    }
    return ups;
  }
  /* companion member object from the party list {key,name,hp,max,…}; returns levels reached */
  function gainAlly(m, xp) {
    m.level ||= 1; m.xp ||= 0; m.xp += Math.max(0, Math.round(xp || 0)); const ups = [];
    while (m.xp >= allyNeed(m.level)) { m.xp -= allyNeed(m.level); m.level++; m.max = (m.max || 40) + ALLY_HP_PER; m.hp = (m.hp || 0) + ALLY_HP_PER; ups.push(m.level) }
    return ups;
  }
  const allyAtk = m => Math.max(0, (m?.level || 1) - 1);

  /* ---------- gear ---------- */
  /* inside a frame (world map) the forge recipes live on the game page */
  function hostRecipes() { try { let w = root; for (let i = 0; i < 4 && w.parent && w.parent !== w; i++) { w = w.parent; if (w.Progression?.recipes) return w.Progression.recipes } } catch (e) { } return null }
  function recipeOf(item, recipes) { const R = recipes || api.recipes || hostRecipes() || {}; return R[item?.recipe] || R[item?.kind] || ZONE_RECIPES[item?.recipe] || null }
  function stars(item, recipes) {
    if (!item) return 0; const q = item.quality || 1, r = recipeOf(item, recipes);
    return Math.min(3, Math.max(r?.star || 1, q >= 5 ? 3 : q >= 3 ? 2 : 1));
  }
  const starText = (item, recipes) => '★'.repeat(stars(item, recipes));
  function weaponAtk(item, recipes) { if (!item) return 0; return (KIND_ATK[item.kind] ?? 1) + ((item.quality || 1) - 1) + (stars(item, recipes) - 1) }
  function equipped(g) { return (g.inventory || []).find(x => x.id === g.equipped) || null }
  const stat = (g, k) => Math.max(0, ch(g).stats?.[k] || 0);
  /* what the card battle uses (js/flat-battle.js): bonus damage on weapon cards / element cards, crit chance, armour, stamina cap */
  function heroCombat(g, recipes) {
    const lv = heroLevel(g), w = equipped(g), wb = weaponAtk(w, recipes);
    const power = wb + Math.floor((lv - 1) / 3) + Math.floor(stat(g, 'strength') / 2), spell = Math.floor(stat(g, 'knowledge') / 2) + Math.floor((lv - 1) / 3);
    const armor = Math.floor((lv - 1) / 3), stMax = (g.maxStamina || heroMaxStamina(lv)) + 4 * stat(g, 'endurance');
    return { power, spell, crit: Math.min(.25, .02 * stat(g, 'precision')), armor, stMax, level: lv, weapon: wb, atk: BASE_ATK + power, def: BASE_DEF + armor };
  }
  /* the hero as sent into a battle frame: combat profile + the stamina to start with (tired heroes start lower) */
  function battleHero(g, recipes) {
    const c = heroCombat(g, recipes);
    return { power: c.power, spell: c.spell, crit: c.crit, armor: c.armor, stMax: c.stMax, st: Math.max(20, Math.round(c.stMax - (g.fatigue || 0) * .6)) };
  }
  const battleParam = (g, recipes) => 'hero=' + encodeURIComponent(JSON.stringify(battleHero(g, recipes)));
  /* missing materials for a recipe (materials in v.materials, goods in v.bag) — '' when enough */
  function recipeMissing(v, r) {
    const out = [], GN = root.ADVENTURE_DATA?.GOODS || {}, MN = api.materials || {};
    for (const [k, n] of Object.entries(r.cost || {})) if ((v.materials?.[k] || 0) < n) out.push((MN[k]?.name || k) + ' ' + n);
    for (const [k, n] of Object.entries(r.goods || {})) if ((v.bag?.[k] || 0) < n) out.push((GN[k]?.name || k) + ' ' + n);
    return out.join(' · ');
  }
  function spendRecipe(v, r) {
    for (const [k, n] of Object.entries(r.cost || {})) v.materials[k] = (v.materials[k] || 0) - n;
    const b = v.bag ||= {}; for (const [k, n] of Object.entries(r.goods || {})) { b[k] = (b[k] || 0) - n; if (b[k] <= 0) delete b[k] }
  }
  /* small summary for the character panel */
  function statsHtml(g) {
    const lv = heroLevel(g), c = heroCombat(g, api.recipes), next = Object.keys(LEVEL_CARDS).map(Number).find(n => n > lv), w = equipped(g);
    const D = root.TacticsDecks?.COMBAT || {}, nm = x => D[x.id]?.name || x.id;
    return `<p class="small">♥ HP สูงสุด <b>${heroMaxHp(lv)}</b> · ϟ แรงในสนามรบ <b>${c.stMax}</b> · ⚔ การ์ดอาวุธ <b>+${c.power}</b> · ✧ การ์ดธาตุ <b>+${c.spell}</b> · ⛨ เกราะ <b>${c.armor}</b> · คริติคอล <b>${Math.round(15 + c.crit * 100)}%</b><br>${w ? 'อาวุธ ' + starText(w, api.recipes) + ' +' + c.weapon : 'ไม่มีอาวุธ'}${next ? ' · Lv.' + next + ' ได้การ์ด ' + LEVEL_CARDS[next].map(nm).join(', ') : ''}</p>`;
  }
  /* v95.00 · monsters keep up a little with the hero (danger still decides most): HP +7 % and hits +5 % per hero level above 3 */
  const foeScale = lv => { const k = Math.max(0, lv - 3); return { hp: 1 + .07 * k, atk: 1 + .05 * k } };   /* from Lv4 on: early levels feel the growth */
  function battleXp(o = {}) { return Math.round(o.boss ? 80 : 15 + (o.dang || 0) * 25 + (o.elite ? 20 : 0)) + 3 * (o.kills || 0) }

  const api = { BASE_HP, HP_PER, BASE_ST, ST_PER, LEVEL_CARDS, KIND_ATK, ZONE_RECIPES, heroLevel, heroMaxHp, heroMaxStamina, heroNeed, allyNeed, sync, gainHero, gainAlly, allyAtk, stars, starText, weaponAtk, equipped, heroCombat, battleHero, battleParam, foeScale, recipeMissing, spendRecipe, battleXp, statsHtml };
  root.Progression = api;
  if (typeof module !== 'undefined' && module.exports) { module.exports = api; return }

  /* =================== the game page (index.html): recipes, XP hook, card reveals =================== */
  if (typeof document === 'undefined' || typeof s === 'undefined' || typeof RECIPES === 'undefined') return;
  for (const [k, r] of Object.entries(ZONE_RECIPES)) if (!RECIPES[k]) RECIPES[k] = r;
  api.recipes = RECIPES; if (typeof MATERIALS !== 'undefined') api.materials = MATERIALS;
  sync(s);
  if (typeof gainCharacterXP === 'function') gainCharacterXP = function (n) { const ups = gainHero(s, n); if (ups.length) { try { s.log = 'เลเวลอัป! Lv.' + ups[ups.length - 1] + ' · HP สูงสุด ' + s.maxHp } catch (e) { } } return ups };
  function busyNow() {
    if (document.querySelector('.ck-reveal') || root.Cutscene?.isPlaying?.() || root.TitleScreen?.active) return true;
    try { if (root.VillageTown?.frame?.contentDocument?.getElementById('wmBattle')) return true } catch (e) { }
    return !!document.getElementById('storyBattle');
  }
  let showing = false;
  setInterval(() => {
    const q = s?.village?.levelUnlocks; if (showing || !q?.length || busyNow() || !root.StarterKit?.unlock) return;
    const next = q.shift(); showing = true; try { save() } catch (e) { }
    Promise.resolve(root.StarterKit.unlock(next.cards, { kicker: 'เลเวลอัป · Lv.' + next.level, title: 'การ์ดใหม่จากประสบการณ์', text: 'HP สูงสุด ' + heroMaxHp(next.level) + ' · แรงสูงสุด ' + heroMaxStamina(next.level) })).finally(() => { showing = false });
  }, 1500);
})(typeof globalThis !== 'undefined' ? globalThis : this);
