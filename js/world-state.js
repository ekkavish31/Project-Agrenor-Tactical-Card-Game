/* v94.00 · One world state for every page (index, village, place interiors, world map, battle field).
   The game save ('three-card-forge-v4', the global `s` of index.html) is the only owner of:
     • the clock        s.day + s.minutes (minutes of the day; past 20:00 is night, at 24:00 the day rolls over)
     • the wallet       s.village.coins
     • potions          s.village.bag.potion
     • food (rations)   s.village.materials.food
     • the hero         s.hp, s.fatigue, s.village.heroName, the hero deck s.village.tacticDecks
     • the party        s.village.party (travelling, max 4) · s.village.bench (resting at the inn) · s.village.recruit (progress) ·
                        s.village.battles / s.village.kills (fights won / monsters felled out in the world)
   Pages opened inside the game (iframes of index.html) work on the live `s` through window.GameHost and save through the game.
   A page opened on its own reads and writes the same save in localStorage (or a stand-in save when no game exists yet).
   The world map keeps only its own map data in 'agrenor-world-v1' (seed, fog, position, bosses beaten…); WorldState.bind(obj)
   gives such an object live (non-saved) properties gold/potions/hp/maxHp/party/bench/recruit/battles/fatigue/food/day/hour,
   so older code that reads S.gold or S.party keeps working against the one save.
   Time: "mixed" — WorldState.tick(seconds) lets the clock run while the hero is in the village (RATE game minutes per real second);
   actions and travel add their own minutes with advance(). */
(function (root) {
  'use strict';
  const KEY = 'three-card-forge-v4', STUB = 'agrenor-standalone-v1', WORLD = 'agrenor-world-v1';
  const RATE = 1;                        // game minutes per real second while walking around the village (a 12-hour day ≈ 12 real minutes)
  const DAY = 1440, LATE = 1200, MAX_ACTIVE = 4, MAX_HP = 60;
  const OLD_KEYS = ['agrenor-clock-v1'];

  /* ---------- where the save lives ---------- */
  // index.html: the game's own scripts share this global scope, so `s` and save() are reachable directly
  function local() { try { return typeof s !== 'undefined' && s && s.village ? { game: () => s, save: () => { try { save() } catch (e) { } }, heroName: () => { try { return heroName() } catch (e) { return '' } } } : null } catch (e) { return null } }
  function host() {
    const own = local(); if (own) return own;
    let w = root;
    for (let i = 0; i < 5; i++) {
      let p; try { p = w.parent } catch (e) { break }
      if (!p || p === w) break;
      try { if (p.GameHost && p.GameHost.game()) return p.GameHost } catch (e) { break }
      w = p;
    }
    return null;
  }
  let cache = null, cacheKey = '';
  function standalone() {
    if (cache) return cache;
    let raw = null; try { raw = localStorage.getItem(KEY) } catch (e) { }
    cacheKey = raw ? KEY : STUB;
    if (!raw) try { raw = localStorage.getItem(STUB) } catch (e) { }
    try { cache = JSON.parse(raw || 'null') } catch (e) { cache = null }
    if (!cache || !cache.village) cache = { day: 1, minutes: 480, hp: MAX_HP, fatigue: 0, stamina: 100, village: { coins: 80, materials: { food: 2 }, bag: { potion: 1 } } };
    return cache;
  }
  function game() { const h = host(); const g = h ? h.game() : standalone(); ensure(g); return g }
  let dirtyAt = 0;
  function commit() { const h = host(); if (h) { h.save(); return } try { localStorage.setItem(cacheKey || STUB, JSON.stringify(cache)) } catch (e) { } }
  const inGame = () => !!host();

  /* ---------- shape + one-time merge of the older separate saves ---------- */
  function ensure(g) {
    if (!g) return;
    const v = g.village ||= {};
    if (!Number.isFinite(g.day)) g.day = 1; if (!Number.isFinite(g.minutes)) g.minutes = 480;
    if (!Number.isFinite(g.hp)) g.hp = MAX_HP; if (!Number.isFinite(g.fatigue)) g.fatigue = 0;
    v.coins ??= 80; v.materials ||= {}; v.materials.food ??= 0; v.bag ||= {};
    v.party ||= []; v.bench ||= []; v.recruit ||= {}; v.battles ??= 0; v.kills ??= 0;
    if (!v.worldMerged) merge(g);
  }
  // before v94 the world map / inn kept their own gold, potions, party and clock; fold them into the game once
  function merge(g) {
    const v = g.village; v.worldMerged = 1;
    let w = null; try { w = JSON.parse(localStorage.getItem(WORLD) || 'null') } catch (e) { }
    if (w) {
      if (Number.isFinite(w.gold)) v.coins += Math.max(0, w.gold - 30);            // 30 was the world map's free start money
      if (Number.isFinite(w.potions)) v.bag.potion = (v.bag.potion || 0) + Math.max(0, w.potions - 1);
      const starters = ['bram', 'luna', 'kier'];                                    // the old default party become villagers (recruit them again)
      for (const p of w.party || []) if (!starters.includes(p.key) && !v.party.some(x => x.key === p.key)) v.party.push(p);
      for (const p of w.bench || []) if (!starters.includes(p.key) && !v.bench.some(x => x.key === p.key)) v.bench.push(p);
      Object.assign(v.recruit, w.recruit || {});
      v.battles = Math.max(v.battles, w.battles || 0);
      for (const k of ['gold', 'potions', 'party', 'bench', 'recruit', 'battles', 'hp', 'maxHp', 'day', 'hour', 'fatigue', 'food']) delete w[k];
      try { localStorage.setItem(WORLD, JSON.stringify(w)) } catch (e) { }
    }
    for (const k of OLD_KEYS) try { localStorage.removeItem(k) } catch (e) { }
  }

  /* ---------- clock ---------- */
  function now() { const g = game(); return { day: g.day, minutes: g.minutes, hour: g.minutes / 60 } }
  function normalize(g) { while (g.minutes >= DAY) { g.minutes -= DAY; g.day++ } if (g.minutes < 0) g.minutes = 0 }
  function advance(min) { const g = game(); g.minutes += Math.max(0, min); normalize(g); commit(); return now() }
  function setTime(day, minutes) { const g = game(); g.day = Math.max(1, day | 0); g.minutes = minutes; normalize(g); commit() }
  // run the clock while the hero is in the village; saved every few seconds, not every frame
  let acc = 0;
  function tick(dt) {
    if (!(dt > 0)) return; const g = game(); acc += Math.min(dt, .5) * RATE;
    if (acc < 1) return; const add = Math.floor(acc); acc -= add; const before = g.day; g.minutes += add; normalize(g);
    const t = performance.now(); if (t > dirtyAt || g.day !== before) { dirtyAt = t + 8000; commit() }
  }
  const label = h => { const m = Math.floor(h * 60 + 1e-6), hh = Math.floor(m / 60) % 24, mm = m % 60; return String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0') };
  const period = h => h >= 5 && h < 11 ? 'morning' : h >= 11 && h < 17 ? 'day' : h >= 17 && h < 21 ? 'evening' : 'night';

  /* sleep until morning (the inn, a bed in a place interior): same result as sleeping at home in the game */
  function sleep(o = {}) {
    const g = game(); if (g.minutes >= 480) g.day++; g.minutes = 480;
    g.fatigue = Math.max(0, (g.fatigue || 0) - (o.relief ?? 70)); g.hp = g.maxHp || MAX_HP; g.used = {};
    try { g.stamina = typeof cap === 'function' ? cap() : Math.max(g.stamina || 0, 100) } catch (e) { g.stamina = Math.max(g.stamina || 0, 100) }
    if (g.village?.work) g.village.work.heat = 0;
    commit(); return now();
  }

  /* ---------- wallet, items, hero ---------- */
  const coins = () => game().village.coins;
  function addCoins(n) { const v = game().village; v.coins = Math.max(0, (v.coins || 0) + Math.round(n)); commit(); return v.coins }
  function spendCoins(n) { const v = game().village; if ((v.coins || 0) < n) return false; v.coins -= n; commit(); return true }
  function heroName() { const h = host(); const n = h?.heroName?.(); if (n) return n; const g = game(); return (g.village.heroName && String(g.village.heroName).trim()) || 'นักผจญภัย' }
  function deck() { return game().village.tacticDecks || null }
  function unitDeck(key) { return game().village.unitDecks?.[key] || null }

  /* ---------- live fields for the older world-map / inn objects ---------- */
  function bind(o) {
    const G = () => game(), V = () => game().village;
    const def = (k, get, set) => Object.defineProperty(o, k, { configurable: true, enumerable: false, get, set });
    def('gold', () => V().coins, x => { V().coins = Math.max(0, Math.round(x)) });
    def('potions', () => V().bag.potion || 0, x => { if (x > 0) V().bag.potion = x; else delete V().bag.potion });
    def('food', () => V().materials.food || 0, x => { V().materials.food = Math.max(0, x) });
    def('hp', () => G().hp, x => { G().hp = Math.max(0, Math.round(x)) });
    def('maxHp', () => G().maxHp || MAX_HP, () => { });
    def('fatigue', () => G().fatigue || 0, x => { G().fatigue = Math.max(0, Math.min(100, Math.round(x))) });
    def('party', () => V().party, x => { V().party = x });
    def('bench', () => V().bench, x => { V().bench = x });
    def('recruit', () => V().recruit, x => { V().recruit = x });
    def('battles', () => V().battles, x => { V().battles = x });
    def('kills', () => V().kills, x => { V().kills = x });
    // the world map counts hours (e.g. 13.5); the game counts minutes
    def('day', () => G().day, x => { G().day = Math.max(1, Math.round(x)) });
    def('hour', () => G().minutes / 60, x => { G().minutes = Math.round(x * 60) });
    return o;
  }
  function world() { let w = null; try { w = JSON.parse(localStorage.getItem(WORLD) || 'null') } catch (e) { } return w }
  function writeWorld(w) { try { localStorage.setItem(WORLD, JSON.stringify(w)) } catch (e) { } commit() }

  /* v95.16 · leads: a destination is only known once someone in the game tells you (a villager's quest, the guild board, an event) — the world map never hands them out.
     Stored apart from the map save so the village can add one before the map exists: { destId: { src:'who told you', pick:1 = start walking there } } */
  const LEADS = 'agrenor-leads-v1';
  const leads = () => { try { return JSON.parse(localStorage.getItem(LEADS) || '{}') || {} } catch (e) { return {} } };
  function addLead(id, src, pick) { const L = leads(); L[id] = { ...(L[id] || {}), src: src || L[id]?.src || '', pick: pick ? 1 : (L[id]?.pick || 0) }; try { localStorage.setItem(LEADS, JSON.stringify(L)) } catch (e) { } }
  function clearPick(id) { const L = leads(); if (L[id]) { L[id].pick = 0; try { localStorage.setItem(LEADS, JSON.stringify(L)) } catch (e) { } } }
  const api = { leads, addLead, clearPick, KEY, WORLD, RATE, DAY, LATE, MAX_ACTIVE, MAX_HP, game, commit, inGame, now, advance, setTime, tick, sleep, label, period, coins, addCoins, spendCoins, heroName, deck, unitDeck, bind, world, writeWorld, flush: commit };
  root.WorldState = api;
  // index.html: offer the live save to the pages it opens in frames
  if (local()) root.GameHost = local();
  try { addEventListener('pagehide', () => { if (dirtyAt) commit() }) } catch (e) { }
})(globalThis);
