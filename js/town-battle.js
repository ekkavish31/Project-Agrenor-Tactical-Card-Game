/* v92.09 · ?battle=1 — flat-grid card battle (phase 2) drawn on top of the village map. Hero vs one monster.
   Map: a square of lattice cells around the plaza (?u=&v=&r= to move/resize). Terrain comes from the map itself:
   buildings/fences/outside = กีดขวาง (blocked, via blockedBase); painted ground: water/pond = กีดขวาง, mud/snow/sand = เดินช้า, moss/clover = กำบัง.
   Cards: the old deck (TacticsDecks contents) and the old card faces (CardStudio). Rules in flat-battle.js: 2 crystals a turn, hands refill when
   the hero's turn starts, discard several cards for stamina (1 crystal).
   Old art reused: hero poses per direction (TACTICS_SPRITES + HeroMotion + equipment anchors), monster clips (MonsterArt), skill VFX (BattleVFX).
   Sizes follow the old formulas (body = cell × 1.6, monster × its scale × clip renderHeight) times one global factor SIZE (?size=). ?m=wolf|slime|kobold|golem
   v92.09 cinematics (Fire Emblem / HD-2D feel, all code-drawn, no new images): camera director (frames both units, pushes in on attacks),
   letterbox bars, spotlight that dims the scene around the two fighters, hit stop, screen shake, camera roll kick, white hit flash,
   impact light pools, warm light rays + dust motes, popping damage numbers, slow-motion finishing blow. ?cine=0 turns the cinematics off.
   v92.11: hero attack poses = the new idle frame moved in code (the old windup/strike/hit/guard pictures are a different outfit; ?oldposes=1 brings
   them back) · procedural battle sounds (BattlePolish) · smaller arena (r 5), fighters start closer, monster HP ×1.6 (?hp=). */
(function () {
  'use strict';
  const Q = new URLSearchParams(location.search), ON = Q.get('battle') === '1';
  if (!ON) {
    window.TownBattle = { active: () => false };
    /* v92.12: the way out of the village — a button to the world map (not in the editor) */
    /* (v92.13: the way to the world map is now an icon in the town's top-right icon row — town-ux.js) */
    return;
  }
  const V = '97.26';
  const SLOW = ['mud', 'snow', 'sand'], COVER = ['moss', 'clover'], WATER = ['water', 'pond'];
  const COL = { normal: null, slow: 'rgba(170,110,40,.38)', cover: 'rgba(60,170,80,.38)', blocked: 'rgba(210,60,60,.32)' };
  const CW = 56, SIZE = +Q.get('size') || 1.5, UNIT = CW * SIZE;           // old camera.w ≙ one lattice cell, scaled once for the village
  const MON = {
    bandit: { name: 'โจรป่า', hp: 34, iq: 2, move: 3, atk: 8, scale: 1, fx: 'sword', img: 'bandit', shove: true , el: 'earth' },
    wolf: { name: 'หมาป่า', hp: 26, iq: 1, move: 4, atk: 7, scale: .9, fx: 'knife', img: 'wolf' , el: 'wind' },
    slime: { name: 'สไลม์แร่', hp: 40, iq: 0, move: 2, atk: 8, scale: .85, fx: 'blunt', img: 'slime' , el: 'water' },
    kobold: { name: 'โคโบลด์ขุดแร่', hp: 30, iq: 1, move: 3, atk: 9, scale: .9, fx: 'blunt', img: 'kobold' , el: 'earth' },
    golem: { name: 'โกเล็มหิน', hp: 95, iq: 0, move: 2, atk: 15, scale: 1.3, fx: 'blunt', img: 'golem', shove: true , el: 'earth' },
    bat: { name: 'ค้างคาวถ้ำ', hp: 22, iq: 1, move: 5, atk: 7, scale: .8, fx: 'knife', img: 'bat', fly: true, el: 'dark' },
    gull: { name: 'นกนางนวลยักษ์', hp: 26, iq: 0, move: 5, atk: 8, scale: .9, fx: 'wind', img: 'gull', fly: true, el: 'wind' },
    /* v95.25 · the snow heights of Dhai-Nor'Qrad */
    frostWolf: { name: 'หมาป่าน้ำแข็ง', hp: 34, iq: 1, move: 4, atk: 9, scale: .95, fx: 'ice', img: 'frost-wolf', el: 'ice' },
    snowKobold: { name: 'โคโบลด์หิมะ', hp: 32, iq: 1, move: 3, atk: 10, scale: .9, fx: 'blunt', img: 'snow-kobold', el: 'ice' },
    yeti: { name: 'เยติ', hp: 70, iq: 1, move: 3, atk: 13, scale: 1.2, fx: 'blunt', img: 'yeti', shove: true, el: 'ice' },
    frostQueen: { name: 'ราชินีน้ำแข็ง', hp: 120, iq: 3, move: 3, atk: 16, scale: 1.25, fx: 'ice', img: 'frost-queen', range: 3, el: 'ice' },
    shadowWolf: { name: 'หมาป่าเงา', hp: 44, iq: 2, move: 5, atk: 11, scale: 1.05, fx: 'knife', img: 'shadow-wolf' , el: 'dark' },
    /* v95.00: the training-ground scarecrow (does not move or hit back) */
    dummy: { name: 'หุ่นฟาง', hp: 40, iq: 0, move: 0, atk: 0, scale: 1, fx: 'blunt', img: '../scarecrow', passive: true, el: 'earth' }
  };
  const MK = MON[Q.get('m')] ? Q.get('m') : 'bandit', MT = MON[MK];
  const NIGHT = Q.get('night') === '1', ATKX = +Q.get('atk') || 1, HST = Q.get('hst') != null ? Math.max(0, Math.min(100, +Q.get('hst'))) : 100;
  const EMBED = Q.get('embed') === '1', TITLE = Q.get('title') || '', HHP = +Q.get('hhp') || 0, HMAX = +Q.get('hmax') || 60, HPRO = (() => { try { return JSON.parse(Q.get('hero') || 'null') || {} } catch (e) { return {} } })();   /* v95.00: js/progression.js battleHero() — power, spell, crit, armor, stMax, st */
  const CINE = Q.get('cine') !== '0', OLDPOSE = Q.get('oldposes') === '1', HPX = +Q.get('hp') || 1.6;
  /* v92.15 melee: companions (old roster, old pictures assets/tactics/<key>_<se|ne>_<pose>.webp) and monster groups
     ?party=bram:54:54,luna:44:44 (key:hp:max) · ?ms=wolf*1.5,wolf*1.5,bandit*1.4 (kind*hp multiplier) */
  const ALLY = {
    bram: { name: 'บรัม', hp: 54, atk: 12, move: 4, range: 1, fx: 'blunt', def: 2 },
    luna: { name: 'ลูน่า', hp: 44, atk: 11, move: 3, range: 4, fx: 'arcane' },
    kier: { name: 'เคียร์', hp: 48, atk: 13, move: 4, range: 1, fx: 'sword' },
    mil: { name: 'มิล', hp: 42, atk: 10, move: 5, range: 1, fx: 'knife' }
  };
  /* v92.17: recruits from the village (village-life.js, loaded by battle-field.html) */
  for (const [k, v] of Object.entries(window.VillageLife?.ALLY_STATS || {})) if (!ALLY[k]) ALLY[k] = v;
  const ALLY_ART = ['bram', 'luna', 'kier', 'mil'];
  const PARTY = (Q.get('party') ?? (EMBED ? '' : 'bram,luna')).split(',').filter(Boolean).map(x => { const [key, hp, max, order, lv, ctl] = x.split(':'); return ALLY[key] ? { key, hp: +hp || ALLY[key].hp, max: +max || ALLY[key].hp, order: order || 'charge', level: Math.max(1, +lv || 1), control: ctl === '1' || Q.get('ctl') === '1' } : null }).filter(Boolean);
  const GROUP = (Q.get('ms') || (EMBED ? MK : [MK, MK, 'bandit'].join(','))).split(',').filter(Boolean).map(x => { const [kind, mult] = x.split('*'); return MON[kind] ? { kind, mult: +mult || HPX } : null }).filter(Boolean);
  let FB = null, TD = null, ready = false, userCam = false, st = null, cells = null, busy = false, reachMap = null;
  let texts = [], anims = [], effects = [], hud = null, hand = null, discardMode = false, picked = new Set(), seenUids = new Set();
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const imgs = new Map(); function im(src) { let i = imgs.get(src); if (!i) { i = new Image(); i.src = src; imgs.set(src, i) } return i.complete && i.naturalWidth ? i : null }

  /* ---------- loading (only on ?battle=1, so the plain village stays light) ---------- */
  /* all battle scripts are requested at once; async=false keeps their execution order */
  function loadScript(src) { return new Promise(res => { const s = document.createElement('script'); s.src = src + '?v=' + V; s.async = false; s.onload = () => res(true); s.onerror = () => res(false); document.head.append(s) }) }
  function loadCss(href) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href + '?v=' + V; document.head.append(l) }
  async function boot() {
    loadCss('css/card-studio.css');
    const want = { 'js/elements.js': 'ElementWheel', 'js/tactics-decks.js': 'TacticsDecks', 'js/flat-battle.js': 'FlatBattle', 'js/monster-animation.js': 'MonsterArt', 'js/battle-vfx.js': 'BattleVFX', 'js/battle-polish.js': 'BattlePolish', 'js/card-design.js': 'CARD_DESIGN', 'js/card-studio.js': 'CardStudio', 'js/job-look.js': 'JobLook' };
    await Promise.all(Object.keys(want).filter(s => !window[want[s]]).map(loadScript));
    FB = window.FlatBattle; TD = window.TacticsDecks; ready = !!(FB && TD);
    window.MonsterArt?.preload?.([...new Set(GROUP.map(g => g.kind))], ['idle', 'walk', 'windup', 'strike', 'hit', 'down']);
  }
  /* embedded (world map): a black veil until the arena is ready, then tell the parent */
  let veil0 = null;
  if (EMBED) { veil0 = document.createElement('div'); veil0.style.cssText = 'position:fixed;inset:0;z-index:100;background:#07080c;display:flex;align-items:center;justify-content:center;color:#ffe2a8;font:italic 800 22px system-ui,sans-serif;letter-spacing:3px;transition:opacity .4s'; veil0.textContent = 'PREPARING BATTLE…'; addEventListener('DOMContentLoaded', () => document.body.append(veil0)) }
  function arenaReady() { if (veil0) { veil0.style.opacity = '0'; setTimeout(() => veil0?.remove(), 450) } if (EMBED) try { parent.postMessage({ type: 'agrenor-battle-ready', warm: Q.get('warm') === '1' }, '*') } catch (e) { } }
  boot();

  /* ---------- arena ---------- */
  function build() {
    const sq = locations.find(o => o.id === 'square') || locations[0], c = center(sq);
    const r = window.FieldR || +Q.get('r') || (GROUP.length + PARTY.length > 2 ? 7 : 5), cu = Math.floor(+Q.get('u') || c.u), cv = Math.floor(+Q.get('v') || c.v);
    const b = { u0: cu - r, v0: cv - r, u1: cu + r, v1: cv + r }, list = [];
    for (let u = b.u0; u <= b.u1; u++) for (let v = b.v0; v <= b.v1; v++) list.push({ u, v, p: project(u + .5, v + .5) });
    const mats = window.TownPaint?.matsAt ? TownPaint.matsAt(list.map(c => c.p)) : list.map(() => null);
    cells = new Map();
    list.forEach((c, i) => {
      const m = mats[i]; let k = 'normal';
      if (blockedBase(c.u + .5, c.v + .5)) k = 'blocked';
      else if (WATER.includes(m)) k = 'blocked';
      else if (SLOW.includes(m)) k = 'slow';
      else if (COVER.includes(m)) k = 'cover';
      cells.set(c.u + ',' + c.v, k);
    });
    const spot = (cu0, cv0) => { let best = null, bd = 1e9; for (const [key, k] of cells) { if (k === 'blocked') continue; const [u, v] = key.split(',').map(Number), d = Math.hypot(u - cu0, v - cv0); if (d < bd) { bd = d; best = { u, v } } } return best };
    const gap = window.FieldGap || (r >= 7 ? 4 : Math.min(r - 1, 3)), hs = spot(cu - gap, cv + gap), ms = spot(cu + gap, cv - gap);   // diagonal opposites: contact by turn 1–2
    /* the rest of each side gathers on the free cells nearest its leader */
    const taken = new Set([hs.u + ',' + hs.v, ms.u + ',' + ms.v]);
    /* v97.01: units gather around their leader but never packed shoulder to shoulder: each keeps at least one free cell from every other unit
       (spacing 2 by king-move distance); only when the area is too tight does it fall back to 1, then 0 */
    const near = (o) => {
      const pts = [...taken].map(k => k.split(',').map(Number)); let best = null;
      for (let sp = 2; sp >= 0 && !best; sp--) { let bd = 1e9;
        for (const [key, k] of cells) { if (k === 'blocked' || taken.has(key)) continue; const [u, v] = key.split(',').map(Number); if (pts.some(([a, b]) => Math.max(Math.abs(u - a), Math.abs(v - b)) < sp)) continue;
          const d = Math.hypot(u - o.u, v - o.v) + Math.random() * .6; if (d < bd) { bd = d; best = { u, v } } } }
      if (best) taken.add(best.u + ',' + best.v); return best };
    const allies = PARTY.map(p => ({ ...near(hs), key: p.key, kind: 'ally', name: ALLY[p.key].name, hp: Math.max(0, Math.min(p.max, p.hp)), maxHp: p.max, atk: ALLY[p.key].atk + (p.level - 1), level: p.level, def: ALLY[p.key].def || 0, armor: ALLY[p.key].def || 0, move: ALLY[p.key].move, range: ALLY[p.key].range, fx: ALLY[p.key].fx, healer: !!ALLY[p.key].healer, order: p.order, control: !!p.control, el: { blunt: 'earth', arcane: 'fusion', sword: 'fire', knife: 'wind', arrow: 'wind', fire: 'fire', holy: 'light' }[ALLY[p.key].fx] || 'earth' })).filter(a => a.hp > 0 && a.u != null);
    const mons = GROUP.map((g, i) => { const T = MON[g.kind], at = i ? near(ms) : ms; if (!at) return null; const boss = i === 0 && TITLE.startsWith('บอส'); return { ...at, variant: boss ? null : NIGHT && ATKX > 1 ? 'fierce' : i === 0 && TITLE.startsWith('ยอดฝีมือ') ? 'elite' : null, kind: g.kind, name: (i === 0 && TITLE ? TITLE + ' ' : '') + T.name + (NIGHT && ATKX > 1 ? ' (ดุร้าย)' : ''), hp: Math.round(T.hp * g.mult), maxHp: Math.round(T.hp * g.mult), atk: Math.round(T.atk * ATKX * (boss ? 1.15 : 1)), move: T.move, boss, iq: Math.min(3, (T.iq || 0) + (boss ? 1 : 0)), shove: !!T.shove, el: T.el, fly: !!T.fly, passive: !!T.passive } }).filter(Boolean);
    /* v97.22: battle objective from the world map (?obj=survive:5 | escape | defend:4 | leader) */
    const objective = (() => { const [type, n] = (Q.get('obj') || '').split(':');
      if (type === 'survive') return { type, turns: Math.max(2, +n || 5) };
      if (type === 'leader' && mons.length > 1) { const L = mons[0]; L.leader = true; L.hp = L.maxHp = Math.round(L.maxHp * 1.3); if (!/หัวหน้า/.test(L.name)) L.name = 'หัวหน้า' + L.name; return { type } }
      if (type === 'defend') { const at = near(hs); return at ? { type, turns: Math.max(2, +n || 4), cells: [at] } : null }
      if (type === 'escape') { /* exits sit in one of the two side corners, across the hero–monster axis, so the hero must run past the fight */
        const corners = [{ u: b.u1, v: b.v1 }, { u: b.u0, v: b.v0 }], k = corners[Math.random() < .5 ? 0 : 1], out = [];
        for (const [key, kd] of cells) { if (kd === 'blocked' || taken.has(key)) continue; const [u, v] = key.split(',').map(Number); if ((u === b.u0 || u === b.u1 || v === b.v0 || v === b.v1) && Math.max(Math.abs(u - k.u), Math.abs(v - k.v)) <= 2) out.push({ u, v }) }
        return out.length ? { type, cells: out } : null }
      return null })();
    /* v94: the hero fights with the deck built at home (s.village.tacticDecks — the starter deck in a new game), not the full test deck */
    let deckConfig = TD.DEFAULT; try { const own = window.WorldState?.deck(); if (own) deckConfig = TD.validate(own) } catch (e) { }
    st = FB.create({ bounds: b, kindAt: (u, v) => cells.get(u + ',' + v) || 'blocked', levelAt: window.FieldHeight ? (u, v) => FieldHeight.level(u, v) : null, deckConfig, cards: true, ct: true,
      hero: { ...hs, el: (() => { try { return window.WorldState?.game().village.story?.element || 'fire' } catch (e) { return 'fire' } })(), name: window.WorldState?.heroName() || 'ฮีโร่', maxHp: HMAX + (HPRO.hpMod || 0), hp: Math.min(HMAX + (HPRO.hpMod || 0), (HHP || HMAX) + Math.max(0, HPRO.hpMod || 0)), ...Object.fromEntries(['rangePlus', 'meleePlus', 'spellMult', 'supportMult', 'flankPlus', 'guardPlus'].filter(k => HPRO[k]).map(k => [k, HPRO[k]])), job: HPRO.job || 'adventurer', look: HPRO.look || null, stamina: Number.isFinite(HPRO.st) ? HPRO.st : HST, stMax: HPRO.stMax || 100, power: HPRO.power || 0, spell: HPRO.spell || 0, crit: HPRO.crit || 0, armor: HPRO.armor || 0 }, allies, monsters: mons, objective });
    /* v97 CT: speed by unit (hero 8 · companions by key · monsters 5 + move) and a random head start for everyone but the hero */
    const SPD = { bram: 6, luna: 7, kier: 8, mil: 9 };
    for (const u of st.units) { if (u.id === 'hero') continue; u.speed = u.side === 'monster' ? Math.max(5, Math.min(10, Math.round(5 + (u.move || 3)))) : SPD[u.key] || 8; u.ct = u.side === 'monster' ? Math.floor(Math.random() * u.speed * 5) : 55 + Math.floor(Math.random() * 40) }
    for (const u of st.units) { u.vu = u.u + .5; u.vv = u.v + .5; u.shown = u.hp; u.dir = 'SE'; u.pose = 'idle'; if (u.side === 'monster') u.dir = dirTo(u, FB.hero(st)); else u.dir = dirTo(u, FB.monster(st)); u.face = u.dir }
    /* v97.08 · same-named enemies get a number (โจรป่า 1, โจรป่า 2 …) so the queue, the list and the log tell them apart */
    { const n = {}, k = {}; for (const u of FB.monsters(st)) n[u.name] = (n[u.name] || 0) + 1; for (const u of FB.monsters(st)) if (n[u.name] > 1) { k[u.name] = (k[u.name] || 0) + 1; u.label = u.name + ' ' + k[u.name] } for (const u of FB.monsters(st)) if (u.label) { u.name = u.label; delete u.label } }
    pend = null; walks = [];
    st.arena = { cu, cv, r };
    texts = []; anims = []; effects = []; busy = false; discardMode = false; picked.clear(); seenUids.clear();
  }
  function refresh() { if (TUT && !coachState.t0 && st) coachState.t0 = st.turns || 1; setTimeout(coach, 0); reachMap = (st.turn === 'hero' || st.turn === 'ally') && !st.acted && !st.outcome && st.mp > 0 ? FB.reach(st, FB.actor(st)) : null; allyBar(); hudSync(); handSync() }
  /* ---------- camera director ----------
     cam = world point at the screen centre + zoom. Normal: frame both fighters (shifted right/up so the HUD and the hand don't cover them).
     Cinematic: push in on attacker + target. Shake and roll kick are added on top. */
  const cam = { x: 0, y: 0, z: 1.05, set: false }, kick = { shake: 0, shakeT: 0, shakeDur: 1, roll: 0 };
  let cine = null, lastPre = 0, light = 0, ox = 120;            // light: 0 normal … 1 full spotlight
  function frameTarget() {
    if (cine) { const a = project(cine.a.vu, cine.a.vv), b = project(cine.b.vu, cine.b.vv); return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - UNIT * .75, z: cine.z } }
    const pts = st.units.filter(u => u.hp > 0 || u.side === 'hero').map(u => project(u.vu, u.vv)), xs = pts.map(p => p.x), ys = pts.map(p => p.y);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), dx = x1 - x0 + UNIT * 3, dy = y1 - y0 + UNIT * 3;
    const narrow = W < 820, z = Math.max(narrow ? .4 : .6, Math.min(1.35, Math.min((W - (narrow ? 20 : 330)) / (dx * scale), (H - (narrow ? 330 : 240)) / (dy * scale))));
    return { x: (x0 + x1) / 2, y: (y0 + y1) / 2 - UNIT * .5, z };
  }
  function focusCamera(instant) {
    const now = performance.now(), dt = Math.min(.1, (now - lastPre) / 1000 || .016); lastPre = now;
    const tg = frameTarget(), k = instant || !cam.set ? 1 : 1 - Math.exp(-dt * (cine ? cine.speed : 3.5));
    cam.x += (tg.x - cam.x) * k; cam.y += (tg.y - cam.y) * k; cam.z += (tg.z - cam.z) * k; cam.set = true;
    zoom = cam.z;
    let sx = 0, sy = 0; if (kick.shake > 0) { const e = now - kick.shakeT, f = Math.max(0, 1 - e / kick.shakeDur); if (f <= 0) kick.shake = 0; else { sx = (Math.random() * 2 - 1) * kick.shake * f; sy = (Math.random() * 2 - 1) * kick.shake * f * .7 } }
    const narrow = W < 820; ox += ((cine ? cineOffset() : narrow ? 0 : 120) - ox) * k;
    pan = { x: -(cam.x - WORLD_W / 2) * scale * zoom + ox + sx, y: -(cam.y - WORLD_H / 2) * scale * zoom + (narrow ? 30 : -40) + sy };
    light += ((cine ? (cine.soft ? .4 : 1) : 0) - light) * Math.min(1, dt * 6);
    kick.roll *= Math.exp(-dt * 7); cv.style.transform = Math.abs(kick.roll) > .02 ? `rotate(${kick.roll.toFixed(3)}deg) scale(${(1 + Math.abs(kick.roll) * .03).toFixed(4)})` : '';
  }
  const CARD_W = 210;
  function cardX() { return W < 820 ? 12 : Math.max(12, Math.round(W / 3 - CARD_W / 2)) }
  /* screen x offset during a cut-scene: push the pair right until it clears the card (but keep it on screen) */
  function cineOffset() {
    if (W < 820) return 0;
    const a = project(cine.a.vu, cine.a.vv), b = project(cine.b.vu, cine.b.vv), k = scale * zoom, half = Math.abs(a.x - b.x) * k / 2 + UNIT * .9 * k;
    const need = cardX() + CARD_W + 28 + half - W / 2;
    return Math.max(120, Math.min(need, W / 2 - half - 12));
  }
  /* procedural battle audio from the old system (BattlePolish: synthesized + the recorded slash) */
  const SFXK = { sword: 'slash', knife: 'knife', spear: 'spear', rapier: 'rapier', blunt: 'hammer', fire: 'magic', ice: 'ice', lightning: 'lightning', arcane: 'magic', wind: 'magic', earth: 'earth', heal: 'heal', shield: 'block', parry: 'block' };
  function sfx(kind, s = .6) {
    const P = window.BattlePolish; if (!P) return;
    try { if (kind === 'slash') P.sample('slash', s); else if (kind === 'swing') P.swing('sword'); else if (kind === 'step') P.footstep('stone'); else if (kind === 'victory') P.victory(true); else if (kind === 'lose') P.victory(false); else P.sound(kind, s) } catch (e) { }
  }
  function hitSound(fx, o = {}) { sfx(SFXK[fx] || 'sword', o.big ? .85 : .6); if (o.crit || o.kill) { sfx('critical', .8); sfx('hammer', .55) } else if (o.big) sfx('hammer', .35) }
  function shake(px, ms) { if (!CINE) return; kick.shake = Math.max(kick.shake, px); kick.shakeT = performance.now(); kick.shakeDur = ms }
  function roll(deg) { if (CINE) kick.roll += deg }
  /* game clock: freezes during hit stop so poses, clips and effects hold for a beat */
  let lag = 0, stopFrom = 0, stopTo = 0;
  function now() { const t = performance.now(); return t < stopTo ? stopFrom - lag : t - lag }
  function hitStop(ms) { if (!CINE) return; const t = performance.now(); if (t < stopTo) return; stopFrom = t; stopTo = t + ms; lag += ms }
  function bars(on) {
    let top = document.getElementById('fbLbTop'), bot = document.getElementById('fbLbBot');
    if (!top) { for (const id of ['fbLbTop', 'fbLbBot']) { const d = document.createElement('div'); d.id = id; d.className = 'fb-lb'; document.body.append(d) } top = document.getElementById('fbLbTop'); bot = document.getElementById('fbLbBot') }
    top.classList.toggle('on', on); bot.classList.toggle('on', on); document.body.classList.toggle('fb-cine', on);
  }
  /* run an action as a short cut-scene: bars in, push in on the pair, play, ease back out */
  async function cinematic(a, b, run, o = {}) {
    if (!CINE) return run();
    cine = { a, b, z: Math.min(2.1, (o.z || 1.75)), speed: 7, soft: o.bars === false }; if (o.bars !== false) bars(true); hidePreview(); await wait(o.lead ?? 380);
    try { await run() } finally { await wait(o.tail ?? 220); cine = null; if (o.bars !== false) bars(false); userCam = false }
  }
  /* lattice → screen direction: +u = SE, +v = SW, −u = NW, −v = NE */
  function dirTo(a, b) { const du = b.u - a.u, dv = b.v - a.v; return Math.abs(du) >= Math.abs(dv) ? (du >= 0 ? 'SE' : 'NW') : (dv > 0 ? 'SW' : 'NE') }
  function screenOf(unit) { const p = project(unit.vu, unit.vv), r = cv.getBoundingClientRect(); return { x: r.left + (p.x - WORLD_W / 2) * scale * zoom + W / 2 + pan.x, y: r.top + (p.y - WORLD_H / 2) * scale * zoom + H / 2 + pan.y } }

  /* ---------- styles ---------- */
  const css = document.createElement('style'); css.textContent = `
  #status,#help,#credit,.toolbar,#menuBtn,.town-icon-row,#townPreview{display:none!important}
  ${EMBED ? '.floatBtn,#townTools,#hudTop,.town-hud,.townux-top{display:none!important}' : ''}
  #fbHud{position:fixed;left:14px;top:14px;z-index:40;width:260px;background:#1b302af2;border:1px solid #b9c48a66;border-radius:12px;padding:10px 12px;color:#f3e9c9;font:13px system-ui,"Noto Sans Thai",sans-serif;box-shadow:0 8px 30px #0008}
  #fbHud button{font:inherit;background:#c9893a;color:#fff;border:0;border-radius:7px;padding:6px 9px;cursor:pointer}#fbHud button:disabled{opacity:.4;cursor:default}
  #fbQueue{position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:38;display:flex;gap:4px;align-items:center;pointer-events:none;font:11px system-ui,"Noto Sans Thai",sans-serif;color:#f3e9c9}
  #fbQueue .qc{position:relative;width:54px;padding:3px 2px 6px;text-align:center;border-radius:8px;background:#14231fdd;border:1px solid #b9c48a55;overflow:hidden}#fbQueue .qc .ic{display:block;font-size:16px;line-height:18px}#fbQueue .qc b{display:block;font-weight:600;white-space:nowrap;overflow:hidden}
  #fbQueue .qc i{position:absolute;left:0;bottom:0;height:3px;background:#6fd18a}#fbQueue .qc.foe{border-color:#e2705f88}#fbQueue .qc.foe i{background:#e2705f}#fbQueue .qc.ally{border-color:#8fd0b0aa}
  #fbQueue .qc.on{width:66px;border:2px solid #ffd25a;background:#2a3a1fee;transform:scale(1.05)}#fbQueue .arr{color:#ffd25a;font-size:18px;margin:0 2px}
  #fbHud #fbAuto.on{background:#2f8a5a}
  #fbHud .bar{height:7px;background:#0006;border-radius:4px;overflow:hidden;margin:2px 0 6px;position:relative}#fbHud .bar i{display:block;height:100%;transition:width .35s}
  #fbHud .arow{margin:3px 0 5px}#fbHud .arow.down{opacity:.45}#fbHud .ord{display:flex;gap:3px;margin-top:2px}#fbHud .ord button{padding:2px 6px;font-size:12px;background:#33463e;border-radius:6px}#fbHud .ord button.on{background:#5d8a6e;box-shadow:inset 0 0 0 1px #bfe8c8}#fbHud .ord button.sk{flex:1;background:#6b4e9a;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #fbHud .grp{margin:6px 0 2px;color:#bba57f;font-size:11px;border-top:1px solid #ffffff1a;padding-top:4px}#fbHud .grp small{opacity:.7}
  #fbHud .mini{position:relative;display:flex;justify-content:space-between;font-size:11.5px;padding:2px 5px 4px;margin:2px 0;border-radius:6px;background:#0003;cursor:default;overflow:hidden}#fbHud .mini i{position:absolute;left:0;bottom:0;height:3px}#fbHud .mini.down{opacity:.4}#fbHud .mini.tgt{outline:2px solid #ffd25a}#fbHud .mini[data-id^=monster]{cursor:pointer}
  #fbHud{max-height:calc(100vh - 210px);overflow:auto}
  #fbHud .gem{display:inline-block;width:14px;height:14px;margin-right:3px;transform:rotate(45deg) scale(.8);border-radius:3px;background:#3b4c55;border:1px solid #8fb7c9}
  #fbHud .gem.on{background:radial-gradient(circle at 35% 35%,#e6fbff,#56c8f5 55%,#1b6b99);box-shadow:0 0 8px #6fd6ff}
  #fbHand{position:fixed;left:50%;bottom:8px;transform:translateX(-50%);z-index:41;display:flex;align-items:flex-end;gap:10px;padding:8px 12px 6px;border-radius:16px;background:linear-gradient(#0000,#0b1512cc 35%);max-width:calc(100vw - 16px);font:12px system-ui,"Noto Sans Thai",sans-serif;color:#f3e9c9}
  #fbHand .row{display:flex;gap:6px;align-items:flex-end}#fbHand .sep{width:1px;align-self:stretch;background:#ffffff33;margin:0 2px}
  #fbHand .lbl{position:absolute;left:0;right:0;top:-17px;text-align:center;font-size:11px;color:#cdbb8f;white-space:nowrap}
  .fb-el{position:absolute;z-index:3;top:-8px;right:-6px;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font:800 13px system-ui;box-shadow:0 2px 6px #000a}.fb-el.adv{background:#3fbf6a;color:#fff}.fb-el.dis{background:#c9503f;color:#fff}
  .fb-card{position:relative;width:84px;padding:0;border:0;background:none;cursor:pointer;transition:transform .16s,filter .16s;border-radius:9px}
  .fb-card .face{width:84px;aspect-ratio:750/1101;border-radius:8px;overflow:hidden;box-shadow:0 4px 10px #0008;background:#2a2a2a}
  .fb-card .face .gcard{width:100%}.fb-card .face>.fb-fallback{display:flex;flex-direction:column;height:100%;align-items:center;justify-content:center;color:#fff;font-size:11px}
  .fb-card .fb-tag{position:absolute;z-index:3;left:3px;right:3px;bottom:3px;padding:2px 3px;border-radius:5px;background:#101a17e6;color:#f6e7c1;font-size:10.5px;line-height:1.25;text-align:center}
  .fb-card .fb-tag b{display:block;font-size:11px;color:#fff}
  .fb-card:hover{transform:translateY(-10px)}
  .fb-card.off{filter:grayscale(.75) brightness(.7)}.fb-card.off:hover{transform:translateY(-4px)}
  .fb-card.new .face{box-shadow:0 0 0 2px #ffe08a,0 0 16px 4px #ffd25a}
  .fb-card.new::after{content:'ใหม่';position:absolute;top:-8px;right:-6px;background:#ffd25a;color:#2a1c00;font:700 10px system-ui;padding:1px 6px;border-radius:999px;box-shadow:0 2px 6px #0007}
  .fb-card.picked{transform:translateY(-14px)}.fb-card.picked .face{box-shadow:0 0 0 3px #ff6a55,0 0 14px #ff6a55}
  .fb-card.picked::before{content:'✕';position:absolute;z-index:2;top:30%;left:50%;transform:translateX(-50%);font:700 30px system-ui;color:#ff6a55;text-shadow:0 2px 6px #000}
  #fbHand.discarding .fb-card:not(.picked){filter:none}
  .fb-pile{position:relative;width:56px;height:82px;border-radius:8px;background:repeating-linear-gradient(45deg,#3c2b4a,#3c2b4a 6px,#46335a 6px,#46335a 12px);border:2px solid #c7a96a;box-shadow:3px 3px 0 #2a2131,6px 6px 0 #1e1824;display:flex;align-items:center;justify-content:center;flex-direction:column;font-weight:700;color:#f6e7c1;text-shadow:0 1px 2px #000}
  .fb-pile.discard{background:#2a2622;border-style:dashed;box-shadow:none}.fb-pile small{font-weight:400;font-size:10px;opacity:.85}
  #fbBar{position:fixed;left:50%;bottom:190px;transform:translateX(-50%);z-index:42;background:#2b1712f2;border:1px solid #ff8a6a88;border-radius:10px;padding:8px 12px;color:#ffe9dc;font:13px system-ui,"Noto Sans Thai",sans-serif;display:flex;gap:8px;align-items:center;box-shadow:0 6px 20px #0008}
  #fbBar button{font:inherit;border:0;border-radius:7px;padding:6px 10px;cursor:pointer;background:#d25a3c;color:#fff}#fbBar button.ghost{background:#5a4a44}#fbBar button:disabled{opacity:.45}
  .fb-show{position:fixed;z-index:43;width:210px;pointer-events:none;filter:drop-shadow(0 16px 26px rgba(0,0,0,.6));transition:opacity .2s}
  .fb-show .face{position:relative;border-radius:14px;overflow:hidden}.fb-show .face .gcard{width:100%}
  .fb-show.play{animation:fbIn .42s cubic-bezier(.2,1.5,.4,1) both}.fb-show.play .face{box-shadow:0 0 0 3px var(--tone),0 0 30px 6px var(--tone)}
  .fb-show.play .face::after{content:'';position:absolute;inset:-40%;background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.55) 50%,transparent 60%);transform:translateX(-70%);animation:fbSweep .7s ease-out .12s both}
  .fb-show .say{margin-top:6px;padding:5px 9px;border-radius:8px;background:#101a17ee;color:#f6e7c1;font:12px system-ui,"Noto Sans Thai",sans-serif;text-align:center}
  .fb-show .say b{color:#ffd25a}
  .fb-show.out{animation:fbOut .45s cubic-bezier(.5,0,.75,0) forwards}
  @keyframes fbIn{0%{opacity:0;transform:translateY(30px) scale(.45) rotateY(80deg)}60%{opacity:1}100%{opacity:1;transform:none}}
  @keyframes fbOut{to{opacity:0;transform:translate(var(--tx),var(--ty)) scale(.25) rotate(var(--rot))}}
  @keyframes fbSweep{to{transform:translateX(70%)}}
  .fb-fly{position:fixed;z-index:44;pointer-events:none;width:84px;transition:transform .45s cubic-bezier(.3,.8,.3,1),opacity .45s}
  .fb-fly .face{width:84px;aspect-ratio:750/1101;border-radius:8px;overflow:hidden}.fb-fly .face .gcard{width:100%}
  .fb-toast{position:fixed;left:50%;top:22%;transform:translateX(-50%);z-index:45;padding:8px 18px;border-radius:999px;background:#101a17ee;color:#ffe9a8;font:700 16px system-ui,"Noto Sans Thai",sans-serif;box-shadow:0 6px 20px #0008;animation:fbToast 1.6s ease forwards;pointer-events:none}
  @keyframes fbToast{0%{opacity:0;transform:translate(-50%,10px)}15%{opacity:1;transform:translate(-50%,0)}80%{opacity:1}100%{opacity:0}}
  .fb-lb{position:fixed;left:0;right:0;height:0;background:#000;z-index:39;transition:height .32s cubic-bezier(.3,.8,.3,1);pointer-events:none}
  #fbLbTop{top:0}#fbLbBot{bottom:0}.fb-lb.on{height:9vh}
  body.fb-cine #fbHand{transform:translate(-50%,40px);opacity:.35}body.fb-cine #fbHud{opacity:.35}
  #fbHand,#fbHud{transition:transform .3s,opacity .3s}
  #world{transform-origin:50% 50%;transition:none}
  .fb-banner{position:fixed;left:50%;top:30%;z-index:46;pointer-events:none;transform:translate(-50%,-50%)}
  .fb-banner span{display:block;font:italic 900 64px/1 system-ui,"Noto Sans Thai",sans-serif;letter-spacing:2px;color:#fff3b0;-webkit-text-stroke:3px #5a1a00;text-shadow:0 0 18px #ff9a2a,0 6px 0 #7a2400,0 10px 24px #000a;animation:fbBan 1.1s cubic-bezier(.2,1.4,.4,1) forwards}
  .fb-banner.crit span{color:#ffe14d;transform:skewX(-12deg)}
  .fb-banner.win span{font:italic 900 76px/1.1 system-ui,"Noto Sans Thai",sans-serif;letter-spacing:0;-webkit-text-stroke:0;color:#ffe9a8;text-shadow:0 0 22px #ff9a2a,0 4px 0 #7a2400,0 0 3px #5a1a00,0 10px 26px #000c;animation:fbBanWin 2.6s ease forwards}
  @keyframes fbBan{0%{opacity:0;transform:translateX(-120px) skewX(-18deg) scale(1.6)}18%{opacity:1;transform:translateX(0) skewX(-12deg) scale(1)}75%{opacity:1;transform:translateX(12px) skewX(-12deg)}100%{opacity:0;transform:translateX(160px) skewX(-18deg) scale(.9)}}
  @keyframes fbBanWin{0%{opacity:0;transform:scale(2.4)}12%{opacity:1;transform:scale(1);filter:none}85%{opacity:1}100%{opacity:0;transform:scale(1.05)}}
  @media (max-width:820px){.fb-banner span{font-size:40px}.fb-banner.win span{font-size:48px}}
  .fb-card.auto{transform:translateY(-12px)}.fb-card.auto .face{box-shadow:0 0 0 3px #ffd25a,0 0 18px 4px #ffd25a}
  #fbIntro{position:fixed;left:50%;top:38%;transform:translate(-50%,-50%);z-index:48;display:flex;flex-direction:column;align-items:center;gap:6px;padding:16px 34px;pointer-events:none;color:#f6ecd6;text-align:center;font-family:VillageThai,"Noto Sans Thai",system-ui,sans-serif;animation:fbIntroIn .5s cubic-bezier(.2,1.3,.4,1) both;background:linear-gradient(90deg,transparent,#0b1410e0 18%,#0b1410e0 82%,transparent);min-width:min(620px,92vw)}
  #fbIntro small{letter-spacing:.3em;color:#cdbb92;font-size:12px}#fbIntro b{font:900 34px/1.15 Georgia,"Noto Sans Thai",serif;color:#ffe2a8;text-shadow:0 2px 0 #000,0 0 22px #ffb34a88}#fbIntro span{font-size:14px;color:#e9dcbc}
  #fbIntro.out{animation:fbIntroOut .5s ease both}@keyframes fbIntroIn{from{opacity:0;transform:translate(-50%,-50%) scale(1.3)}}@keyframes fbIntroOut{to{opacity:0;transform:translate(-50%,-60%)}}
  #fbAlly{position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:45;display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:center;max-width:94vw;padding:10px 14px;border-radius:14px;background:#14231ff2;border:1px solid #ffd25a88;color:#f3e9c9;font:13px system-ui,"Noto Sans Thai",sans-serif;box-shadow:0 10px 26px #000a}
  #fbAlly b{font-size:16px;color:#ffe2a8}#fbAlly small{color:#cdbb92}#fbAlly button{padding:8px 12px;border-radius:10px;border:1px solid #b9c48a66;background:#1b302a;color:#f3e9c9;font:600 13px inherit;font-family:inherit;cursor:pointer}#fbAlly button:disabled{opacity:.45;cursor:default}#fbAlly button.ok{background:#c9893a;border-color:#ffe2a8}
  body.fb-ally #fbHand{opacity:.25;pointer-events:none;transform:translate(-50%,60px)}
  #fbCoach{position:fixed;left:50%;top:104px;transform:translateX(-50%);z-index:46;display:flex;gap:10px;align-items:center;max-width:min(760px,94vw);padding:9px 12px 9px 16px;border-radius:12px;background:linear-gradient(#f3e6c6,#e2cfa2);color:#3a2a14;border:2px solid #b08a4a;box-shadow:0 10px 26px #0009;font:14px system-ui,"Noto Sans Thai",sans-serif}
  #fbCoach.on{animation:fbCoachIn .35s ease both}@keyframes fbCoachIn{from{opacity:0;transform:translate(-50%,-10px)}}#fbCoach small{white-space:nowrap;color:#8a6a3a;font-weight:700}#fbCoach span{flex:1;min-width:0;line-height:1.5}
  #fbCoach button{padding:6px 12px;border-radius:9px;border:1px solid #7a4b06;background:linear-gradient(#f0c560,#c9902e);color:#2a1a06;font:700 13px inherit;font-family:inherit;cursor:pointer;white-space:nowrap}#fbCoach button.x{background:none;border:none;padding:4px 6px;color:#8a6a3a}
  #fbHint{position:fixed;left:50%;top:64px;transform:translate(-50%,-8px);z-index:46;padding:7px 14px;border-radius:999px;background:#14231ff2;border:1px solid #ffd25a88;color:#ffe9b0;font:600 13px system-ui,"Noto Sans Thai",sans-serif;opacity:0;pointer-events:none;transition:opacity .2s,transform .2s;white-space:nowrap;max-width:94vw;overflow:hidden;text-overflow:ellipsis}#fbHint.on{opacity:1;transform:translate(-50%,0)}
  #fbFace{position:fixed;inset:0;z-index:47;pointer-events:none}#fbFace .tip{position:fixed;left:50%;top:64px;transform:translateX(-50%);padding:7px 16px;border-radius:999px;background:#14231ff2;border:1px solid #b9c48a88;color:#f3e9c9;font:600 14px system-ui,"Noto Sans Thai",sans-serif}#fbFace .tip small{color:#cdbb92;font-weight:400;margin-left:6px}
  #fbFace [data-f]{position:fixed;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;border:2px solid #f3e9c9aa;background:#1b302ae6;color:#f3e9c9;font:22px system-ui;cursor:pointer;pointer-events:auto;display:grid;place-items:center;box-shadow:0 4px 12px #0008;transition:transform .12s,background .12s}
  #fbFace [data-f] span{display:inline-block}#fbFace [data-f].on{background:#c9893a;border-color:#ffe2a8;transform:scale(1.15)}#fbFace [data-f]:hover{transform:scale(1.2)}
  #fbFace .bar{position:fixed;left:50%;bottom:150px;transform:translateX(-50%);display:flex;gap:8px;pointer-events:auto}#fbFace .bar button{padding:8px 16px;border-radius:10px;border:1px solid #b9c48a88;background:#1b302af2;color:#f3e9c9;font:600 14px system-ui,"Noto Sans Thai",sans-serif;cursor:pointer}#fbFace .bar .ok{background:#c9893a;border-color:#ffe2a8}#fbFace .bar small{opacity:.7;font-weight:400}
  #fbPause{position:fixed;inset:0;z-index:60;display:grid;place-items:center;background:#05080dcc;backdrop-filter:blur(3px)}#fbPause .box{display:flex;flex-direction:column;gap:8px;min-width:280px;max-width:92vw;padding:18px;border-radius:14px;background:#14231ff7;border:1px solid #b9c48a77;color:#f3e9c9;font:14px system-ui,"Noto Sans Thai",sans-serif;box-shadow:0 16px 40px #000a}
  #fbPause b{font-size:18px}#fbPause small{color:#cdbb92}#fbPause button{padding:9px 14px;border-radius:10px;border:1px solid #b9c48a66;background:#1b302a;color:#f3e9c9;font:inherit;text-align:left;cursor:pointer}#fbPause button:hover:not(:disabled){background:#2d4a40}#fbPause button.warn{border-color:#e2705f88;color:#ffc2b4}#fbPause button:disabled{opacity:.45}#fbPause .keys{font-size:12.5px;line-height:1.7;color:#d8caa0;padding:6px 4px}
  @media (max-width:820px){#fbHud{width:200px;padding:7px 9px;font-size:12px}#fbHud .help{display:none}#fbHand{overflow-x:auto;justify-content:flex-start}.fb-card,.fb-card .face,.fb-fly,.fb-fly .face{width:58px}.fb-pile{width:40px;height:58px}#fbHand{gap:5px;padding:6px}.fb-card .fb-tag{font-size:9px}#fbBar{bottom:130px}}`;
  document.head.append(css);

  /* ---------- card faces (old CardStudio design) ---------- */
  const cardKey = (group, id) => (group === 'movement' ? 'm-' : 'a-') + id;
  /* cards that have no picture yet borrow a close one */
  const ART_SUB = { backstab: 'twin', dive: 'dash', tide: 'gust', formation: 'skill', counter: 'guard', evade: 'creep', firstAid: 'mend', ambush: 'creep', thunder: 'spell' };
  function faceHTML(group, id, mini) {
    const html = window.CardStudio?.renderCard(cardKey(group, id), { mini, fallbackArt: 'assets/cards/tactic-' + (ART_SUB[id] || id) + '.webp' });
    if (html) return html;
    const name = group === 'movement' ? TD.MOVE[id]?.name : TD.COMBAT[id]?.name;
    return `<div class="fb-fallback"><img src="assets/cards/tactic-${ART_SUB[id] || id}.webp" alt="" style="width:100%;height:60%;object-fit:cover"><b>${esc(name || id)}</b></div>`;
  }
  function cardName(group, id) { return group === 'movement' ? TD.MOVE[id]?.name : TD.COMBAT[id]?.name }
  function cardLine(group, id) {
    if (group === 'movement') { const m = TD.MOVE[id]; return 'เดิน ' + m.move + (m.stamina ? ' · แรง ' + m.stamina : '') }
    const r = FB.cardRule(id); if (!r) return 'ยังไม่รองรับ';
    const stc = r.st ? ' · แรง ' + r.st : '';
    if (r.self) return (r.guard ? 'ป้องกัน ' + r.guard : r.heal ? 'ฟื้น HP ' + r.heal : r.evade ? 'หลบการตีครั้งถัดไป' : r.counter ? 'สวนกลับ 12 เมื่อโดนตี' : r.ambush ? 'ตีครั้งถัดไป ×1.6' : 'ฟื้นแรง ' + r.restore) + stc;
    return 'พลัง ' + r.dmg + (r.hits ? '×' + r.hits : '') + ' · ระยะ ' + r.range + (r.behind ? ' · หลัง +' + r.behind : '') + (r.leap ? ' · กระโจน' : '') + (r.guardAfter ? ' · กัน ' + r.guardAfter : '') + stc;
  }
  function cardBlock(group, i) {
    if (busy) return 'รอสักครู่'; if (st.outcome) return 'จบการต่อสู้แล้ว'; if (st.turn !== 'hero') return 'ไม่ใช่ตาคุณ';
    if (!FB.crystals(st)) return 'คริสตัลหมดแล้วในเทิร์นนี้';
    if (group === 'movement') { const c = st.deck.movement.hand[i], m = TD.MOVE[c.id]; if (st.acted) return 'โจมตีแล้ว เดินต่อไม่ได้'; if (FB.hero(st).stamina < m.stamina) return 'แรงไม่พอ (ต้อง ' + m.stamina + ')'; return '' }
    return FB.combatBlock(st, i);
  }

  /* ---------- HUD ---------- */
  /* v97.22 · win/lose line for the HUD, the opening banner and the pause menu */
  const goalLine = () => 'ชนะ: ' + FB.objText(st) + ' · แพ้: ' + FB.hero(st).name + ' ล้ม' + (st.obj?.type === 'defend' ? ' หรือศัตรูยืนบนจุดสีทอง' : '');
  const turnGoal = () => st.obj?.turns ? '/' + st.obj.turns : '';
  function hudMake() {
    const d = document.createElement('div'); d.id = 'fbHud';
    d.innerHTML = `<b style="color:#f6d79b">⚔ สนามรบ · ไพ่</b><div id="fbGoal" style="margin:4px 0 0;color:#ffd98a;font-size:12px"></div><div id="fbTurn" style="margin:2px 0 6px;color:#bba57f"></div><div id="fbGems" style="margin:0 0 8px"></div><div id="fbUnits"></div>
      <div style="display:flex;gap:6px;margin:8px 0;flex-wrap:wrap"><button id="fbEnd" title="Space">จบเทิร์น</button><button id="fbUndo" title="ย้อนการเดินก่อนโจมตี (Z)">↶ ย้อนเดิน</button><button id="fbAuto" title="ให้ AI เล่นแทนฮีโร่ (A · กดอีกครั้งเพื่อหยุด)">⚡ Auto</button><button id="fbDis">♻ ทิ้งไพ่ฟื้นแรง</button><button id="fbMenu" title="เมนู (Esc)">☰</button>${EMBED ? '<button id="fbBack" hidden>🗺 กลับแผนที่โลก</button>' : ''}</div>
      <div id="fbLog" style="max-height:96px;overflow:auto;font-size:12px;color:#d8caa0"></div>
      <div class="help" style="margin-top:6px;font-size:11px;color:#9aa68a">คลิกศัตรู = ดูการ์ดที่ดีที่สุด · คลิกซ้ำ = โจมตี<br>คลิกช่อง = เดิน (ใช้ไพ่เดินให้เอง) · Z ย้อนเดิน<br>จบเทิร์นแล้วเลือกทิศหันหน้า · ด้านหลังโดน ×1.2</div>`;
    document.body.append(d); hud = d;
    d.querySelector('#fbEnd').onclick = () => endHeroTurn();
    d.querySelector('#fbAuto').onclick = () => setAuto(!auto);
    const q = document.createElement('div'); q.id = 'fbQueue'; document.body.append(q);
    d.querySelector('#fbDis').onclick = () => setDiscard(!discardMode);
    d.querySelector('#fbUndo').onclick = () => undoWalk();
    d.querySelector('#fbMenu').onclick = () => pauseMenu();
    if (EMBED) d.querySelector('#fbBack').onclick = () => report(st.outcome);
  }
  function hudSync() {
    if (!hud || !st) return;
    const h = FB.hero(st), m = FB.monster(st), bar = (v, max, col) => `<div class="bar"><i style="width:${Math.max(0, v / max * 100)}%;background:${col}"></i></div>`;
    const allyRow = u => { const sk = FB.ALLY_SKILL[u.key], why = FB.skillBlock(st, u), o = u.order || 'charge';
      return `<div class="arow ${u.hp <= 0 ? 'down' : ''}"><div class="mini" data-id="${u.id}"><span>${esc(u.name)}${u.guard ? ' <small style="color:#9cc8ff">🛡' + u.guard + '</small>' : ''}${u.stun ? ' ❄' : ''}</span><b>${u.hp > 0 ? u.shown + '/' + u.maxHp : 'ล้ม'}</b><i style="width:${Math.max(0, u.shown / u.maxHp * 100)}%;background:#7fc8a0"></i></div>` +
        (u.hp > 0 ? `<div class="ord">${u.control ? `<button data-ctl="${u.id}" class="${u.autoCtl ? '' : 'on'}" title="${u.autoCtl ? 'AI เล่นคนนี้ · คลิกเพื่อสั่งเองในตาของเขา' : 'สั่งเองในตาของเขา · คลิกเพื่อให้ AI เล่น'}">${u.autoCtl ? '🤖' : '🎮'}</button>` : ''}${[['charge', '⚔', 'บุก: เข้าหาศัตรูที่ใกล้สุด/เป้าที่เล็ง'], ['follow', '👣', 'ตาม: อยู่ใกล้ฮีโร่ ตีเฉพาะศัตรูที่เข้ามาใกล้'], ['guard', '🛡', 'ตั้งรับ: ไม่ขยับ ป้องกัน +6']].map(([k, ic, tt]) => `<button data-ally="${u.id}" data-order="${k}" class="${o === k ? 'on' : ''}" title="${tt}">${ic}</button>`).join('')}${sk ? `<button class="sk" data-skill="${u.id}" ${why || busy ? 'disabled' : ''} title="${esc(sk.name + (why ? ' — ' + why : ''))}">✦ ${esc(sk.name)}${u.cd ? ' (' + u.cd + ')' : ''}</button>` : ''}</div>` : '') + '</div>' };
    const lvb = u => window.FieldHeight && FB.lv(st, u.u, u.v) ? ` <small style="color:#cfe4ff">▲${FB.lv(st, u.u, u.v)}</small>` : '';
    const elb = u => { const W = window.ElementWheel, E = W?.info(u.el); return E ? ` <small class="fb-elb" style="color:${E.col}" title="${esc(W.name(u.el))}">${E.icon}${esc(W.name(u.el, true))}</small>` : '' };
    const IQN = ['ดุร้าย · พุ่งใส่ตัวใกล้สุด', 'เจ้าเล่ห์ · ล่าตัวอ่อนแอ จบตัวที่ใกล้ตาย', 'ชำนาญยุทธวิธี · เล็งตัวซัพพอต หลบกลางวงล้อม ถอยหนีตอนใกล้ตาย', 'จอมวางแผน · ใช้ตัวบังพวกอ่อนแอ ถอยไปฟื้นตัว'];
    const mini = (u, col) => `<div class="mini ${u.hp <= 0 ? 'down' : ''} ${st.target === u.id ? 'tgt' : ''}" data-id="${u.id}" title="${u.side === 'monster' ? esc(IQN[u.iq | 0]) : ''}"><span>${esc(u.name)}${elb(u)}${lvb(u)}</span><b>${u.hp > 0 ? u.shown + '/' + u.maxHp : 'ล้ม'}</b><i style="width:${Math.max(0, u.shown / u.maxHp * 100)}%;background:${col}"></i></div>`;
    hud.querySelector('#fbUnits').innerHTML =
      `<div>${esc(h.name)}${Object.keys(h.sts || {}).map(k => ` <span title="${esc(FB.STATUS[k].name)} ${h.sts[k]} เทิร์น">${FB.STATUS[k].icon}</span>`).join('')} <span style="float:right">${h.shown}/${h.maxHp}${h.guard ? ' <small style="color:#9cc8ff">🛡' + h.guard + '</small>' : ''}</span></div>${bar(h.shown, h.maxHp, '#6fd18a')}` +
      `<div><small style="color:#bba57f">แรง (stamina)</small> <span style="float:right">${h.stamina}/100</span></div>${bar(h.stamina, 100, '#e8c34a')}` +
      (FB.allies(st).length ? '<div class="grp">ทีม <small>(สั่งการ · ท่าพิเศษใช้ 1 คริสตัล)</small></div>' + FB.allies(st).map(u => allyRow(u)).join('') : '') +
      '<div class="grp">ศัตรู <small>(คลิกเพื่อเล็งเป้า)</small></div>' + FB.monsters(st).map(u => mini(u, '#e2705f')).join('');
    hud.querySelectorAll('#fbUnits [data-order]').forEach(e => e.onclick = () => { if (busy) return; FB.setOrder(st, e.dataset.ally, e.dataset.order); floatText(st.units.find(u => u.id === e.dataset.ally), { charge: 'CHARGE!', follow: 'FOLLOW', guard: 'HOLD' }[e.dataset.order], '#bfe8ff', true); hudSync() });
    hud.querySelectorAll('#fbUnits [data-skill]').forEach(e => e.onclick = () => allySkillAct(e.dataset.skill));
    hud.querySelectorAll('#fbUnits [data-ctl]').forEach(e => e.onclick = () => { const u = st.units.find(x => x.id === e.dataset.ctl); if (!u) return; u.autoCtl = !u.autoCtl; floatText(u, u.autoCtl ? 'AI' : 'MANUAL', '#bfe8ff', true); hudSync() });
    hud.querySelectorAll('#fbUnits .mini[data-id^="monster"]').forEach(e => e.onclick = () => { if (st.turn === 'hero' && !busy) { FB.setTarget(st, e.dataset.id); hudSync(); handSync() } });
    hud.querySelector('#fbTurn').textContent = st.outcome ? (st.outcome === 'win' ? '🏆 ชนะ!' : '💀 แพ้…') : st.turn === 'hero' ? `เทิร์น ${st.turns}${turnGoal()} · ตาคุณ · แต้มเดิน ${st.mp}` : st.turn === 'ally' && st.cur ? `เทิร์น ${st.turns}${turnGoal()} · ตาของ ${st.cur.name} · เดิน ${st.mp}` : `เทิร์น ${st.turns}${turnGoal()} · ตาศัตรู…`;
    hud.querySelector('#fbTurn').title = goalLine(); hud.querySelector('#fbGoal').textContent = '🎯 ' + FB.objText(st);
    const left = FB.crystals(st), max = st.crystalMax;
    hud.querySelector('#fbGems').innerHTML = '<small style="color:#bba57f;margin-right:6px">คริสตัล</small>' + Array.from({ length: max }, (_, i) => `<span class="gem ${i < left ? 'on' : ''}"></span>`).join('');
    hud.querySelector('#fbEnd').disabled = busy || !!st.outcome || st.turn !== 'hero' || auto;
    hud.querySelector('#fbUndo').disabled = busy || !!st.outcome || st.turn !== 'hero' || st.acted || !walks.length;
    { const a = hud.querySelector('#fbAuto'); a.classList.toggle('on', auto); a.textContent = auto ? '⏸ หยุด Auto' : '⚡ Auto' }
    queueSync();
    hud.querySelector('#fbDis').disabled = busy || !!st.outcome || st.turn !== 'hero' || (!left && !discardMode);
    hud.querySelector('#fbDis').textContent = discardMode ? 'ยกเลิกการทิ้ง' : '♻ ทิ้งไพ่ฟื้นแรง';
    hud.querySelector('#fbLog').innerHTML = st.log.slice(-6).reverse().map(x => '<div>' + esc(x) + '</div>').join('');
  }

  /* v97 · FFT turn queue (top centre): who acts next, the acting unit highlighted, with its HP */
  function queueSync() {
    const q = document.getElementById('fbQueue'); if (!q || !st) return;
    if (st.outcome) { q.innerHTML = ''; return }
    const list = FB.queue(st, 9), act = actUnit && actUnit.hp > 0 ? actUnit : list[0], rest = list.filter(u => u !== act).slice(0, 8), chip = (u, on) => {
      const E = window.ElementWheel?.info(u.el), pct = Math.max(0, Math.min(100, u.hp / u.maxHp * 100)), side = u.side === 'monster' ? 'foe' : u === FB.hero(st) ? 'hero' : 'ally';
      return `<div class="qc ${side} ${on ? 'on' : ''}" title="${esc(u.name)} · ${u.hp}/${u.maxHp}"><span class="ic">${E ? E.icon : esc((u.name || '?')[0])}</span><b>${esc((() => { const m = u.name.match(/^(.*?)\s(\d+)$/), base = m ? m[1] : u.name, n = m ? ' ' + m[2] : ''; return (base.length > 5 ? base.slice(0, 4) + '…' : base) + n })())}</b><i style="width:${pct}%"></i></div>` };
    q.innerHTML = chip(act, true) + '<span class="arr">›</span>' + rest.map(u => chip(u, false)).join('');
  }
  /* ---------- hand ---------- */
  function handMake() {
    const d = document.createElement('div'); d.id = 'fbHand';
    d.innerHTML = `<div class="fb-pile draw" id="fbDraw"></div><div class="row" id="fbMove" style="position:relative"><span class="lbl">ไพ่เดิน</span></div><div class="sep"></div><div class="row" id="fbCombat" style="position:relative"><span class="lbl">ไพ่ต่อสู้</span></div><div class="fb-pile discard" id="fbDiscard"></div>`;
    document.body.append(d); hand = d;
    /* v94.02 touch: the first tap shows the card (range, element tip), a second tap on the same card plays it */
    let armed = null; const touchy = () => window.Touch?.lastPointer?.() === 'touch';
    d.addEventListener('click', e => { const b = e.target.closest('.fb-card'); if (!b) return; if (touchy() && !discardMode && armed !== b.dataset.uid) { armed = b.dataset.uid; preview(b); return } armed = null; cardClick(b) });
    d.addEventListener('pointerover', e => { if (touchy()) return; const b = e.target.closest('.fb-card'); if (b && !discardMode && !busy) preview(b) });
    d.addEventListener('pointerout', e => { if (touchy()) return; const b = e.target.closest('.fb-card'); if (b && !b.contains(e.relatedTarget)) hidePreview() });
    addEventListener('pointerdown', e => { if (touchy() && armed && !e.target.closest?.('.fb-card')) { armed = null; hidePreview() } }, true);
  }
  /* v94.02 · element tip: the card's element against the target it would hit (Kaelam chart: js/elements.js) */
  function elTip(group, id) {
    const W = window.ElementWheel; if (!W || group !== 'combat') return null; const r = FB.cardRule(id); if (!r || r.self) return null;
    const el = FB.CARD_EL[id] || FB.WEAPON_EL[FB.hero(st).weapon] || 'earth', tg = FB.pickTarget(st, r) || st.units.find(u => u.id === st.target) || FB.monster(st);
    return W.tip(el, tg?.el);
  }
  function cardEl(group, c, i) {
    const why = st.turn === 'hero' && !discardMode ? cardBlock(group, i) : '';
    return `<button class="fb-card ${why ? 'off' : ''} ${picked.has(c.uid) ? 'picked' : ''}" data-group="${group}" data-i="${i}" data-uid="${esc(c.uid)}" data-id="${esc(c.id)}" title="${esc(cardName(group, c.id) + ' — ' + cardLine(group, c.id) + (elTip(group, c.id)?.text ? ' · ' + elTip(group, c.id).text : '') + (why ? ' · ' + why : ''))}">${(() => { const e = elTip(group, c.id); return e?.cls ? `<span class="fb-el ${e.cls}">${e.cls === 'adv' ? '▲' : '▼'}</span>` : '' })()}<div class="face">${faceHTML(group, c.id, true)}</div><span class="fb-tag"><b>${esc(cardName(group, c.id))}</b>${esc(cardLine(group, c.id))}</span></button>`;
  }
  function handSync() {
    if (!hand || !st) return;
    const d = st.deck, row = (id, group) => { const r = hand.querySelector(id), lbl = r.querySelector('.lbl'); r.innerHTML = ''; r.append(lbl); r.insertAdjacentHTML('beforeend', d[group].hand.map((c, i) => cardEl(group, c, i)).join('')) };
    row('#fbMove', 'movement'); row('#fbCombat', 'combat');
    hand.querySelector('#fbDraw').innerHTML = `${d.movement.draw.length + d.combat.draw.length}<small>กองจั่ว</small>`;
    hand.querySelector('#fbDiscard').innerHTML = `${d.movement.discard.length + d.combat.discard.length}<small>กองทิ้ง</small>`;
    hand.classList.toggle('discarding', discardMode);
    barSync();
  }

  /* ---------- full card beside the action (never over the hero or the monster) ---------- */
  /* search the screen for the spot nearest the fight that covers neither unit, the HUD nor the hand */
  function sideSpot(w, h) {
    const vw = innerWidth, vh = innerHeight, k = scale * zoom, avoid = [];
    for (const u of st.units) { const s = screenOf(u), half = UNIT * .75 * k, tall = UNIT * 1.9 * k; avoid.push({ x0: s.x - half, x1: s.x + half, y0: s.y - tall, y1: s.y + UNIT * .3 * k, w: 40 }) }
    if (hud) { const r = hud.getBoundingClientRect(); avoid.push({ x0: r.left, x1: r.right, y0: r.top, y1: r.bottom, w: 3 }) }
    if (hand) { const r = hand.getBoundingClientRect(); avoid.push({ x0: r.left, x1: r.right, y0: r.top - 8, y1: r.bottom, w: 3 }) }
    const a = screenOf(FB.hero(st)), b = screenOf(FB.foe(st, FB.hero(st))), mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - UNIT * k;
    let best = null;
    for (let y = 60; y <= Math.max(60, vh - h - 10); y += 24) for (let x = 12; x <= Math.max(12, vw - w - 12); x += 24) {
      let c = 0; for (const r of avoid) { const ox = Math.max(0, Math.min(x + w, r.x1) - Math.max(x, r.x0)), oy = Math.max(0, Math.min(y + h, r.y1) - Math.max(y, r.y0)); c += ox * oy * r.w }
      c += Math.hypot(x + w / 2 - mx, y + h / 2 - my) * 20;
      if (!best || c < best.c) best = { x, y, c };
    }
    return best || { x: vw - w - 12, y: 70 };
  }
  let pv = null;
  function preview(b) {
    hidePreview(); const group = b.dataset.group, id = b.dataset.id, why = cardBlock(group, +b.dataset.i);
    dmgShow = null; if (group === 'combat' && !why) { const d = FB.preview(st, +b.dataset.i); if (d && !d.self) dmgShow = d }
    if (group === 'combat') { const rr = FB.cardRule(id); rangeShow = rr && !rr.self ? rr.range + (rr.range > 1 ? FB.hero(st).rangePlus || 0 : 0) : 0; pushShow = null;
      /* v94.02 · push / pull forecast: where the target lands and how far it falls */
      if (rr && (rr.push || rr.pull) && window.FieldHeight) { const h = FB.hero(st), tg = FB.pickTarget(st, rr); if (tg) { const dir = rr.push ? 1 : -1, du = tg.u - h.u, dv = tg.v - h.v, su = Math.abs(du) >= Math.abs(dv) ? Math.sign(du) : 0, sv = su ? 0 : Math.sign(dv), nu = tg.u + su * dir, nv = tg.v + sv * dir, drop = FB.lv(st, tg.u, tg.v) - FB.lv(st, nu, nv), free = cells.get(nu + ',' + nv) && cells.get(nu + ',' + nv) !== 'blocked' && !st.units.some(x => x.hp > 0 && x.u === nu && x.v === nv) && drop >= -1; pushShow = free ? { u: nu, v: nv, drop, dmg: drop >= 2 ? 5 * drop : 0 } : { u: nu, v: nv, stuck: true } } } }
    pv = document.createElement('div'); pv.className = 'fb-show';
    pv.innerHTML = `<div class="face">${faceHTML(group, id, false)}</div><div class="say"><b>${esc(cardName(group, id))}</b><br>${esc(cardLine(group, id))}${dmgShow ? `<br><b style="color:${dmgShow.kill ? '#ffe14d' : '#ffd0a0'}">≈ −${dmgShow.total}${dmgShow.kill ? ' · ล้ม!' : ''}</b> <small>${esc(dmgShow.target.name)}${dmgShow.notes.length ? ' · ' + esc(dmgShow.notes.join(', ')) : ''}</small>` : ''}${(() => { const e = elTip(group, id); return e?.text ? `<br><span style="color:${e.cls === 'adv' ? '#7fe08a' : e.cls === 'dis' ? '#ff9a8a' : '#cdbb92'}">${esc(e.text)}</span>` : '' })()}${why && st.turn === 'hero' ? '<br><span style="color:#ff9a8a">' + esc(why) + '</span>' : ''}</div>`;
    document.body.append(pv); const s = sideSpot(210, 340); pv.style.left = s.x + 'px'; pv.style.top = s.y + 'px';
  }
  function hidePreview() { pv?.remove(); pv = null; rangeShow = 0; pushShow = null; dmgShow = null }
  let rangeShow = 0, pushShow = null, dmgShow = null;
  const TONE = { movement: '#6fc3ff', attack: '#ff7a5c', self: '#7fe08a', magic: '#c39bff' };
  /* the played card pops up full size beside the fight, stays while the action plays, then flies into the discard pile */
  function showPlay(group, id, text, fromEl) {
    hidePreview();
    const r = FB.cardRule(id), tone = group === 'movement' ? TONE.movement : r?.self ? TONE.self : r?.range > 1 ? TONE.magic : TONE.attack;
    const el = document.createElement('div'); el.className = 'fb-show play'; el.style.setProperty('--tone', tone);
    el.innerHTML = `<div class="face">${faceHTML(group, id, false)}</div><div class="say"><b>${esc(cardName(group, id))}</b>${text ? '<br>' + esc(text) : ''}</div>`;
    document.body.append(el);
    /* a combat card plays as a cut-scene: the card stands at about one third from the left and the camera keeps the pair to its right */
    const s = CINE && group === 'combat' && !r?.self ? { x: cardX(), y: Math.max(70, H / 2 - 190) } : sideSpot(210, 340); el.style.left = s.x + 'px'; el.style.top = s.y + 'px';
    if (fromEl) fromEl.style.visibility = 'hidden';
    return { el, done: async () => { const pile = hand.querySelector('#fbDiscard').getBoundingClientRect(), me = el.getBoundingClientRect(); el.style.setProperty('--tx', (pile.left + pile.width / 2 - me.left - me.width / 2) + 'px'); el.style.setProperty('--ty', (pile.top + pile.height / 2 - me.top - me.height / 2) + 'px'); el.style.setProperty('--rot', (Math.random() * 30 - 15) + 'deg'); el.classList.remove('play'); el.classList.add('out'); await wait(460); el.remove() } };
  }
  /* small copies of hand cards flying somewhere (discard pile) */
  async function flyTo(els, target) {
    const t = target.getBoundingClientRect(), list = [];
    for (const e of els) { const r = e.getBoundingClientRect(), f = document.createElement('div'); f.className = 'fb-fly'; f.innerHTML = e.querySelector('.face').outerHTML; f.style.left = r.left + 'px'; f.style.top = r.top + 'px'; document.body.append(f); e.style.visibility = 'hidden'; list.push({ f, dx: t.left + t.width / 2 - r.left - r.width / 2, dy: t.top + t.height / 2 - r.top - r.height / 2 }) }
    await wait(20); list.forEach((x, i) => setTimeout(() => { x.f.style.transform = `translate(${x.dx}px,${x.dy}px) scale(.55) rotate(${(i % 2 ? 1 : -1) * 12}deg)`; x.f.style.opacity = '.2' }, i * 70));
    await wait(470 + list.length * 70); list.forEach(x => x.f.remove());
  }
  /* new cards come off the draw pile into their slots, one after another, and glow as "ใหม่" */
  async function drawShow(uids) {
    const pile = hand.querySelector('#fbDraw').getBoundingClientRect(), els = uids.map(u => hand.querySelector(`.fb-card[data-uid="${CSS.escape(u)}"]`)).filter(Boolean);
    els.forEach(e => { const r = e.getBoundingClientRect(); e.style.transition = 'none'; e.style.transform = `translate(${pile.left - r.left}px,${pile.top - r.top}px) scale(.6) rotateY(90deg)`; e.style.opacity = '0'; e.classList.add('new') });
    await wait(30);
    for (const e of els) { e.style.transition = 'transform .42s cubic-bezier(.2,1.3,.4,1),opacity .3s'; e.style.transform = ''; e.style.opacity = ''; await wait(110) }
    await wait(450); els.forEach(e => { e.style.transition = '' });
    setTimeout(() => els.forEach(e => e.classList.remove('new')), 2200);
  }
  function toast(t) { const d = document.createElement('div'); d.className = 'fb-toast'; d.textContent = t; document.body.append(d); setTimeout(() => d.remove(), 1700) }
  /* v97.12 · battle opening (B13, first part): the field's name and the win / lose rule come in, the camera looks at the enemy leader,
     then back to the party. Skipped when the arena is only warming up and with reduced motion (CINE off). */
  async function battleIntro() {
    const d = document.createElement('div'); d.id = 'fbIntro';
    d.innerHTML = `<small>${esc(({ forest: 'ป่า', grass: 'ทุ่งหญ้า', hills: 'เนินเขา', swamp: 'บึง', snow: 'ทุ่งหิมะ', sand: 'หาดทราย' })[Q.get('biome')] || 'สนามรบ')}${Q.get('night') === '1' ? ' · กลางคืน' : ''}</small><b>${esc(TITLE || FB.monster(st)?.name || 'การต่อสู้')}</b><span>${esc(goalLine())}</span>`;
    document.body.append(d); sfx('cast', .3);
    const m = FB.monsters(st).find(u => u.hp > 0); if (m) await cinematic(m, m, () => wait(1900), { z: 1.45, lead: 260, tail: 160 }); else await wait(2000);
    /* v97.22 · show where the exits / the banner are before the first turn */
    const gc = st.obj?.cells; if (gc?.length) { const at = { vu: gc.reduce((a, c) => a + c.u, 0) / gc.length + .5, vv: gc.reduce((a, c) => a + c.v, 0) / gc.length + .5 }; d.querySelector('b').textContent = st.obj.type === 'escape' ? 'ทางออก' : 'จุดที่ต้องป้องกัน'; await cinematic(at, at, () => wait(1500), { z: 1.3, lead: 260, tail: 160 }) }
    d.classList.add('out'); setTimeout(() => d.remove(), 600);
  }
  async function startTurnShow(first) {
    walks = []; pend = null;
    if (first && CINE && Q.get('warm') !== '1' && !st.introDone) { st.introDone = true; busy = true; hudSync(); try { await battleIntro() } finally { busy = false } }
    refresh(); const fresh = (st.drawn || []).filter(u => !seenUids.has(u) || !first); st.drawn.forEach(u => seenUids.add(u));
    toast(first ? 'BATTLE START · DRAW' : `TURN ${st.turns} · DRAW ${fresh.length}`);
    if (fresh.length) { busy = true; hudSync(); await drawShow(fresh); busy = false; refresh() }
    if (auto) autoTurn();
  }
  /* v97 Auto: the planner in flat-battle picks each step, the normal handlers animate it */
  async function autoTurn() {
    if (autoRun) return; autoRun = true;
    try {
      for (let i = 0; i < 14 && auto && !busy && st.turn === 'hero' && !st.outcome; i++) {
        const p = FB.autoPlan(st); if (p.type === 'end') break; await wait(380); if (!auto || busy) break;
        if (p.type === 'walk') await heroMove(p.to);
        else { const b = hand?.querySelector(`.fb-card[data-group="${p.type === 'combat' ? 'combat' : 'movement'}"][data-i="${p.index}"]`); if (!b) break; await cardClick(b) }
        await wait(200);
      }
    } finally { autoRun = false }
    if (auto && !busy && st.turn === 'hero' && !st.outcome) await endHeroTurn();
  }
  function setAuto(on) { auto = on; hudSync(); if (on && !busy && st.turn === 'hero' && !st.outcome) autoTurn() }

  /* ---------- discard for stamina ---------- */
  function setDiscard(on) { discardMode = on && !busy && st.turn === 'hero' && !st.outcome && (FB.crystals(st) > 0); picked.clear(); hidePreview(); refresh() }
  function barSync() {
    let bar = document.getElementById('fbBar');
    if (!discardMode) { bar?.remove(); return }
    if (!bar) { bar = document.createElement('div'); bar.id = 'fbBar'; document.body.append(bar) }
    const n = picked.size;
    bar.innerHTML = `<span>เลือกไพ่ที่จะทิ้ง <b>${n}</b> ใบ → แรง +${n * FB.STAMINA_PER_DISCARD} (ใช้ 1 คริสตัล)</span><button id="fbDisOk" ${n ? '' : 'disabled'}>ทิ้ง</button><button class="ghost" id="fbDisNo">ยกเลิก</button>`;
    bar.querySelector('#fbDisOk').onclick = () => doDiscard(); bar.querySelector('#fbDisNo').onclick = () => setDiscard(false);
  }
  async function doDiscard() {
    const picks = [...hand.querySelectorAll('.fb-card.picked')].map(e => ({ group: e.dataset.group, uid: e.dataset.uid, el: e }));
    if (!picks.length) return;
    busy = true; hudSync();
    await flyTo(picks.map(p => p.el), hand.querySelector('#fbDiscard'));
    const r = FB.discardForStamina(st, picks.map(p => ({ group: p.group, uid: p.uid })));
    if (r.ok) floatText(FB.hero(st), 'STAMINA +' + r.stamina, '#ffe08a'); else toast(r.reason);
    discardMode = false; picked.clear(); busy = false; refresh();
  }

  /* ---------- playing cards ---------- */
  async function cardClick(b) {
    if (!st || st.turn !== 'hero') return;
    if (discardMode) { const u = b.dataset.uid; picked.has(u) ? picked.delete(u) : picked.add(u); b.classList.toggle('picked'); barSync(); return }
    const group = b.dataset.group, i = +b.dataset.i, id = b.dataset.id, why = cardBlock(group, i);
    if (why) { flash(why); return }
    if (group === 'movement') {
      const show = showPlay(group, id, cardLine(group, id), b), r = FB.playMove(st, i);
      if (!r.ok) { show.el.remove(); b.style.visibility = ''; flash(r.reason); return }
      busy = true; hudSync(); FB.hero(st).pose = 'idle'; sfx('cast', .35); floatText(FB.hero(st), 'MOVE +' + r.move, '#9fd4ff', true);
      await wait(650); await show.done(); busy = false; refresh(); return;
    }
    const show = showPlay(group, id, cardLine(group, id), b), r = FB.playCombat(st, i);
    if (!r.ok) { show.el.remove(); b.style.visibility = ''; flash(r.reason); return }
    busy = true; hudSync(); if (!r.self) walks = []; pend = null; markAuto();
    await heroAction(r);
    await show.done(); busy = false; refresh();
    if (st.outcome) finish();
  }
  async function heroAction(r) {
    const h = FB.hero(st), m = r.target || FB.monster(st);
    if (r.self) {
      h.pose = r.guard ? 'guard' : 'idle'; fx(r.fx, h, h, { color: r.heal ? '#7fe08a' : '#f4d36a' }); if (r.card === 'climb') fx('climbUp', h); if (r.card === 'perch') fx('perchFlag', h); impact(h, r.fx, false); h.flashUntil = 0;
      await wait(260); if (r.heal) floatText(h, '+' + r.heal, '#7fe08a'); if (r.guard) floatText(h, 'GUARD ' + r.guard, '#9cc8ff'); if (r.restore) floatText(h, 'STAMINA +' + r.restore, '#ffe08a'); if (r.evade) floatText(h, 'EVADE READY', '#bfe8ff'); if (r.counter) floatText(h, 'COUNTER READY', '#ffd9a0'); if (r.ambush) floatText(h, 'AMBUSH ×1.6', '#d9b8ff');
      h.shown = h.hp; hudSync(); await wait(520); h.pose = 'idle'; return;
    }
    const last = !FB.monsters(st).some(u => u.hp > 0), kill = last, heavy = r.big > 1 || r.hits.reduce((a, x) => a + x.damage, 0) >= 20;
    await cinematic(h, m, async () => {
      if (r.leap) { const from = { vu: h.vu, vv: h.vv }; h.pose = 'windup'; await wait(160); await leapAnim(h, r.leap.to); fx('diveTrail', m, from); shake(9, 260) }
      h.dir = dirTo(h, m); h.pose = 'windup'; if (cine) { cine.z += .18; cine.speed = 4 } await wait(heavy ? 420 : 280);
      h.pose = 'strike'; sfx('swing'); if (cine) cine.speed = 9; roll(dirSign(h, m) * (heavy ? 2.2 : 1.3)); lines(m, 220);
      const dur = r.card === 'rockfall' ? (fx('rockfall', m), 700) : fx(r.fx, m, h, { scale: r.big, color: r.fx === 'arcane' ? '#b49ae8' : '#7cc5db' });
      await wait(Math.min(320, dur * .45));
      for (const [n, x] of r.hits.entries()) {
        const tu = x.target || m, lastHit = n === r.hits.length - 1, fin = kill && lastHit, down = tu.hp <= 0 && !r.hits.slice(n + 1).some(y => y.target === tu);
        if (x.splash) fx(r.fx, tu, h, { scale: .8 });
        impact(tu, r.fx, { big: heavy, crit: x.crit, kill: fin || down, from: h }); tu.hitUntil = now() + 460;
        if (x.crit) banner('CRITICAL!', 'crit');
        if (fin) { hitStop(380); if (cine) cine.z = 2.3; shake(20, 600) } else if (down) { hitStop(240); shake(14, 420) } else if (x.crit) { hitStop(210); shake(17, 460) } else { hitStop(heavy ? 140 : 100); shake(heavy ? 13 : 8, heavy ? 380 : 280) }
        if (down) tu.deadAt = now() + 380;
        floatText(tu, '−' + x.damage, x.crit ? '#ffe14d' : heavy ? '#ffd27a' : '#ff9a8a', false, heavy || x.crit); if (x.notes.length) floatText(tu, noteEn(x.notes), '#cfe4ff', true);
        tu.shown = Math.max(tu.hp, tu.shown - x.damage); hudSync(); await wait(r.hits.length > 1 ? 260 : 220);
      }
      for (const x of r.hits) (x.target || m).shown = (x.target || m).hp; hudSync(); if (r.guard) floatText(h, 'GUARD ' + r.guard, '#9cc8ff', true);
      if (r.moved) { const from = { u: m.vu - .5, v: m.vv - .5 }; shake(6, 200); await walkAnim(m, [from, { u: m.u, v: m.v }], 5, true) }
      if (r.status) floatText(r.status.unit, (FB.STATUS[r.status.kind]?.icon || '') + ' ' + (FB.STATUS[r.status.kind]?.name || ''), '#ffe08a', true);
      if (r.fall) { shake(12, 380); fx('fallDust', m); floatText(m, 'FALL −' + r.fall.damage, '#ffb08a', false, true); m.shown = m.hp; hudSync() }
      if (kill) { banner('VICTORY!', 'win'); setTimeout(() => sfx('victory'), 400); await wait(1100) } else await wait(260); h.pose = 'idle';
    }, { z: heavy ? 1.95 : 1.75 });
  }
  /* effect text is English; the log keeps the Thai notes */
  function noteEn(notes) { return notes.map(n => n === 'คริติคอล' ? '' : n.startsWith('กำบัง') ? 'COVER −30%' : n.startsWith('ป้องกัน') ? 'GUARD ' + n.replace(/[^0-9−-]/g, '') : n).filter(Boolean).join(' · ') }
  /* dive: an arc through the air to the cell next to the target */
  function leapAnim(u, to) {
    return new Promise(res => { const f = { u: u.vu, v: u.vv }, t1 = { u: to.u + .5, v: to.v + .5 }, t0 = performance.now(), dur = 380; u.dir = dirTo({ u: f.u, v: f.v }, { u: t1.u, v: t1.v });
      const tick = () => { const e = Math.min(1, (performance.now() - t0) / dur); u.vu = f.u + (t1.u - f.u) * e; u.vv = f.v + (t1.v - f.v) * e; u.lift = Math.sin(e * Math.PI) * 46; if (e < 1) requestAnimationFrame(tick); else { u.lift = 0; res() } }; tick() });
  }
  const dirSign = (a, b) => (project(b.vu, b.vv).x >= project(a.vu, a.vv).x ? 1 : -1);
  /* hit: white flash on the sprite + a light pool on the ground at the target */
  const FXCOL = { fire: '255,140,60', ice: '150,220,255', lightning: '190,210,255', arcane: '200,160,255', heal: '140,255,160', shield: '170,210,255', wind: '200,255,220', earth: '230,190,120', parry: '255,240,190' };
  /* one hit landing: sprite flash, light pool, spark burst, knock-back, zoom punch, speed lines, white frame on big hits */
  function impact(u, kind, o = {}) {
    if (typeof o === 'boolean') o = { big: o };
    const big = o.big || o.crit || o.kill, col = FXCOL[kind] || '255,230,170';
    u.flashUntil = now() + (big ? 190 : 120);
    glows.push({ u: u.vu, v: u.vv, col, r: UNIT * (big ? 1.8 : 1.2), t0: now(), dur: big ? 620 : 420 });
    if (o.sound !== false) hitSound(kind, { big, crit: o.crit, kill: o.kill });
    if (kind === 'heal' || kind === 'shield' && !o.from) return;
    burst(u, col, big ? 30 : 16, o.from, big);
    if (o.from) knock(u, o.from, big ? 16 : 9);
    if (!CINE) return;
    zoomPunch(big ? .24 : .12); lines(u, big ? 460 : 280);
    if (big) screenFlash('255,255,255', o.crit || o.kill ? .6 : .35, 150);
  }
  let glows = [], parts = [], speed = [], flashes = [];
  function burst(u, col, n, from, big) {
    const p = project(u.vu, u.vv), cy = p.y - UNIT * .75, base = from ? Math.atan2(cy - project(from.vu, from.vv).y + UNIT * .75, p.x - project(from.vu, from.vv).x) : -Math.PI / 2;
    for (let i = 0; i < n; i++) {
      const spark = i % 3 !== 2, an = base + (Math.random() - .5) * (spark ? 1.9 : 2.6), sp = (spark ? 420 : 220) * (.5 + Math.random()) * (big ? 1.35 : 1);
      parts.push({ x: p.x, y: cy, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - (spark ? 40 : 160), t0: now(), life: spark ? 260 + Math.random() * 200 : 520 + Math.random() * 300, col: spark ? '255,245,215' : col, spark, size: spark ? 2 + Math.random() * 1.5 : 2.5 + Math.random() * 3 });
    }
  }
  function knock(u, from, px) { const a = project(from.vu, from.vv), b = project(u.vu, u.vv), d = Math.hypot(b.x - a.x, b.y - a.y) || 1; u.kb = { x: (b.x - a.x) / d * px, y: (b.y - a.y) / d * px * .6, t0: now() } }
  function kbOff(u, t) { const k = u.kb; if (!k) return { x: 0, y: 0 }; const e = (t - k.t0) / 300; if (e >= 1) { u.kb = null; return { x: 0, y: 0 } } const f = e < .2 ? e / .2 : 1 - (e - .2) / .8; return { x: k.x * f, y: k.y * f } }
  function zoomPunch(a) { cam.z += a }
  function lines(u, ms) { speed.push({ u, t0: now(), dur: ms }) }
  function screenFlash(col, a, ms) { flashes.push({ col, a, t0: performance.now(), dur: ms }) }
  function banner(text, cls = '') { if (!CINE && cls !== 'win') return; const d = document.createElement('div'); d.className = 'fb-banner ' + cls; d.innerHTML = `<span>${esc(text)}</span>`; document.body.append(d); setTimeout(() => d.remove(), cls === 'win' ? 2600 : 1100) }
  async function heroMove(to) {
    const h0 = FB.actor(st), from = { u: h0.u, v: h0.v }, face = h0.face, dir = h0.dir;
    const mv = FB.move(st, to); if (!mv.ok) { flash(st.mp > 0 ? mv.reason : 'ใช้ไพ่เดินก่อน'); return }
    walks.push({ from, face, dir, cost: mv.cost }); coachState.moved = true;
    busy = true; hudSync(); await walkAnim(h0, mv.path); busy = false; refresh();
  }
  /* any AI attack (monster on hero/companion, companion on monster). Full cut-scene when the hero is hit, on crits, knock-outs and bosses;
     a quick push-in without bars otherwise so a big fight keeps moving */
  async function unitAttack(a, t, s) {
    a.dir = dirTo(a, t); const M = window.MonsterArt, isMon = a.side === 'monster', fxk = isMon ? (MON[a.kind]?.fx || 'sword') : (a.fx || 'sword');
    const tw = isMon ? M?.timing?.(a.kind, a.dir, 'windup') : null, ts = isMon ? M?.timing?.(a.kind, a.dir, 'strike') : null;
    const isHero = t === FB.hero(st), down = t.hp <= 0, guarded = s.notes.some(n => n.startsWith('ป้องกัน')), full = isHero || s.crit || down || a.boss;
    await cinematic(a, t, async () => {
      a.pose = 'windup'; if (cine) { cine.z += .12; cine.speed = 4 } await wait(isMon ? Math.min(full ? 900 : 520, tw?.duration || 380) : (full ? 300 : 200));
      a.pose = 'strike'; sfx('swing'); if (cine) cine.speed = 9; if (full) { roll(dirSign(a, t) * 1.4); lines(t, 200) } await wait(isMon ? Math.min(600, ts?.impactMs ?? 160) : 110);
      if (s.evaded) { const o = { u: t.vu, v: t.vv }; t.vu += (t.vu - a.vu) * .35; t.vv += (t.vv - a.vv) * .35; fx('wind', t, a, {}); sfx('swing'); floatText(t, 'MISS', '#bfe8ff', false, true); await wait(420); t.vu = o.u; t.vv = o.v; a.pose = 'idle'; return }
      fx(guarded ? 'parry' : fxk, t, a, { color: isMon ? '#ffb36a' : '#9fd4ff' }); impact(t, guarded ? 'parry' : fxk, { big: s.crit || s.damage >= 12, crit: s.crit, kill: down && (isHero || !FB.monsters(st).some(u => u.hp > 0)), from: a });
      if (s.crit) banner('CRITICAL!', 'crit'); if (isHero && s.damage && CINE) screenFlash('255,30,20', s.crit || down ? .38 : .22, 320);
      t.pose = guarded ? 'guard' : 'hit'; t.hitUntil = now() + 420;
      if (down) { hitStop(isHero ? 380 : 240); shake(isHero ? 20 : 13, 500); if (t.side === 'monster') t.deadAt = now() + 380 } else if (s.crit) { hitStop(200); shake(16, 440) } else { hitStop(s.damage ? (full ? 110 : 80) : 60); shake(s.damage ? (full ? 10 : 6) : 4, 260) }
      floatText(t, s.damage ? '−' + s.damage : 'BLOCKED', s.damage ? (isMon ? '#ff9a8a' : '#ffe0a0') : '#9cc8ff', false, s.damage >= 12); { const n = noteEn(s.notes); if (n) floatText(t, n, '#cfe4ff', true) }
      if (down && t.side === 'hero' && !isHero) floatText(t, 'DOWN', '#ff8a7a', true);
      t.shown = t.hp; hudSync();
      await wait(full ? Math.max(300, Math.min(900, (ts?.duration || 500) - (ts?.impactMs ?? 160))) : 260);
      if (s.counter) { t.pose = 'windup'; await wait(150); t.pose = 'strike'; sfx('swing'); fx('sword', a, t, {}); impact(a, 'sword', { from: t, big: true }); a.hitUntil = now() + 420; hitStop(120); shake(10, 300); floatText(a, '−' + s.counter, '#ffd27a', false, true); floatText(a, 'COUNTER', '#ffd9a0', true); a.shown = a.hp; hudSync(); if (a.hp <= 0) a.deadAt = now() + 300; await wait(420) }
      if (s.fall) { shake(12, 380); await walkAnim(t, [s.fall.from, { u: t.u, v: t.v }], 6, true); fx('fallDust', t); floatText(t, 'FALL −' + s.fall.damage, '#ff9a8a', false, true); t.shown = t.hp; hudSync() }   /* v94: knocked off a ledge */
      a.pose = 'idle'; if (t.hp > 0) t.pose = 'idle';
    }, full ? { z: 1.7 } : { z: 1.4, bars: false, lead: 170, tail: 90 });
  }
  /* companion signature skill, ordered by the player */
  async function allySkillAct(id) {
    if (busy || !st || st.turn !== 'hero') return;
    const r = FB.allySkill(st, id); if (!r.ok) { flash(r.reason); return }
    busy = true; hudSync(); handSync(); await playSkill(r);
    busy = false; refresh(); if (st.outcome) finish();
  }
  /* the signature-skill cut-scene (ordered from the hero's turn for a crystal, or on a controlled companion's own turn) */
  async function playSkill(r) {
    const a = r.ally; sfx('cast', .5); toast(a.name + ' · ' + r.name);
    if (r.heals) {
      await cinematic(a, a, async () => { a.pose = 'guard'; await wait(200); for (const x of r.heals) { fx('heal', x.unit, x.unit, { color: '#7fe08a' }); impact(x.unit, 'heal', false); x.unit.flashUntil = 0; floatText(x.unit, '+' + x.heal, '#7fe08a'); x.unit.shown = x.unit.hp; hudSync(); await wait(140) } await wait(500); a.pose = 'idle' }, { z: 1.4, bars: false, lead: 220, tail: 120 });
    } else if (r.shielded.length) {
      await cinematic(a, a, async () => { a.pose = 'guard'; await wait(200); for (const x of r.shielded) { fx('shield', x.unit, x.unit, {}); impact(x.unit, 'shield', false); floatText(x.unit, 'GUARD ' + x.guard, '#9cc8ff', true); await wait(140) } shake(6, 220); await wait(500); a.pose = 'idle' }, { z: 1.5, bars: false, lead: 220, tail: 120 });
    } else {
      const t = r.target, last = !FB.monsters(st).some(u => u.hp > 0);
      await cinematic(a, t, async () => {
        a.dir = dirTo(a, t); a.pose = 'windup'; if (cine) { cine.z += .15; cine.speed = 4 } await wait(300); a.pose = 'strike'; sfx('swing'); if (cine) cine.speed = 9; roll(dirSign(a, t) * 1.6); lines(t, 220);
        fx(r.fx, t, a, { scale: 1.2, color: '#9fd4ff' }); await wait(200);
        for (const [n, x] of r.hits.entries()) {
          const tu = x.target, down = tu.hp <= 0 && !r.hits.slice(n + 1).some(y => y.target === tu);
          if (tu !== t) fx(r.fx, tu, a, {}); impact(tu, r.fx, { big: true, crit: x.crit, kill: down && last, from: a }); tu.hitUntil = now() + 440;
          if (x.crit) banner('CRITICAL!', 'crit'); if (down) { tu.deadAt = now() + 380; hitStop(240); shake(14, 420) } else { hitStop(120); shake(10, 320) }
          floatText(tu, '−' + x.damage, x.crit ? '#ffe14d' : '#ffe0a0', false, true); tu.shown = Math.max(tu.hp, tu.shown - x.damage); hudSync(); await wait(r.hits.length > 1 ? 240 : 200);
        }
        if (r.moved && t.hp > 0) { const from = { u: t.vu - .5, v: t.vv - .5 }; shake(6, 200); await walkAnim(t, [from, { u: t.u, v: t.v }], 5, true) }
        if (r.stun && r.stun.hp > 0) { floatText(r.stun, 'FROZEN', '#bfe8ff', true); glows.push({ u: r.stun.vu, v: r.stun.vv, col: '150,220,255', r: UNIT * 1.4, t0: now(), dur: 700 }) }
        for (const x of r.hits) x.target.shown = x.target.hp; hudSync();
        if (last) { banner('VICTORY!', 'win'); setTimeout(() => sfx('victory'), 400); await wait(1100) } else await wait(300); a.pose = 'idle';
      }, { z: 1.75 });
    }
  }
  let actUnit = null, auto = false, autoRun = false;
  async function playSteps(steps) {
    for (const s of steps) {
      if (st.outcome && s.type !== 'attack') continue;
      if (s.type === 'control') continue;
      if (s.type === 'turn') { actUnit = s.unit; hudSync(); if (s.unit !== FB.hero(st)) await wait(260); continue }
      if (s.type === 'move') await walkAnim(s.unit, s.path);
      else if (s.type === 'attack') await unitAttack(s.unit, s.target, s);
      else if (s.type === 'stun') { floatText(s.unit, 'FROZEN — SKIP', '#bfe8ff', true); await wait(420) }
      else if (s.type === 'dot') { const S = FB.STATUS[s.kind] || {}; s.unit.hitUntil = now() + 300; floatText(s.unit, (S.icon || '') + ' −' + s.damage, s.kind === 'burn' ? '#ffb070' : '#b6e07a'); s.unit.shown = s.unit.hp; hudSync(); if (s.unit.hp <= 0) s.unit.deadAt = now() + 300; await wait(420) }
      else if (s.type === 'phase') { actUnit = s.unit; banner('ENRAGED!', 'crit'); screenFlash('255,90,58', .35, 420); shake(16, 520); floatText(s.unit, 'คลั่ง! ATK ↑', '#ff8a6a', false, true); glows.push({ u: s.unit.vu, v: s.unit.vv, col: '255,90,60', r: UNIT * 1.8, t0: now(), dur: 900 }); await wait(800) }
      else if (s.type === 'charge') { floatText(s.unit, '⚠ กำลังรวบรวมพลัง', '#ffd25a', false, true); glows.push({ u: s.unit.vu, v: s.unit.vv, col: '255,210,90', r: UNIT * 1.5, t0: now(), dur: 1100 }); hint('⚠ ' + s.unit.name + ' จะใช้ท่าใหญ่ในตาหน้า · กระจายตัว หรือถอยออกจากระยะ'); await wait(700) }
      else if (s.type === 'bossSkill') { const a = s.unit, tg = s.hits[0]?.target || a; banner(s.name, 'crit');
        await cinematic(a, tg, async () => { a.pose = 'windup'; await wait(320); a.pose = 'strike'; sfx('swing'); shake(18, 520); screenFlash(s.fx === 'ice' ? '191,232,255' : '255,207,138', .3, 300);
          for (const h of s.hits) { fx(s.fx === 'ice' ? 'ice' : 'earth', h.target, a, { scale: 1.2 }); impact(h.target, s.fx === 'ice' ? 'ice' : 'blunt', { big: true, from: a }); h.target.hitUntil = now() + 440; floatText(h.target, '−' + h.damage, '#ffd27a', false, true); h.target.shown = h.target.hp; if (h.target.hp <= 0) h.target.deadAt = now() + 380; hudSync(); await wait(180) }
          await wait(380); a.pose = 'idle' }, { z: 1.5 }) }
      else if (s.type === 'sleep') { floatText(s.unit, '💤 SLEEP — SKIP', '#c8c0ff', true); await wait(420) }
      else if (s.type === 'heal') { s.unit.pose = 'strike'; fx('heal', s.target, s.unit, { color: '#7fe08a' }); impact(s.target, 'heal', false); s.target.flashUntil = 0; floatText(s.target, '+' + s.heal, '#7fe08a'); s.target.shown = s.target.hp; hudSync(); await wait(650); s.unit.pose = 'idle' }
      else if (s.type === 'hold') { s.unit.pose = 'guard'; setTimeout(() => { if (s.unit.pose === 'guard') s.unit.pose = 'idle' }, 700) }
    }
    for (const u of st.units) { u.vu = u.u + .5; u.vv = u.v + .5; if (u.face && u.hp > 0) u.dir = u.face }   /* v97.14: a unit that turned at the end (clever monsters) shows it */
  }
  async function endHeroTurn() {
    if (busy || st.turn !== 'hero' || st.outcome || facing) return;
    pend = null; markAuto(); hidePreview();
    if (auto) faceNearest(FB.hero(st)); else if (!(await pickFacing())) return;
    walks = []; setDiscard(false); busy = true; refresh();
    if (st.ct) { const r = FB.endTurnCT(st); await playSteps(r.steps); actUnit = null; busy = false; if (st.outcome) { refresh(); finish(); return } await afterAI(); return }
    const allySteps = FB.alliesTurn(st);
    if (allySteps.length) { toast('PARTY PHASE'); await wait(400); await playSteps(allySteps) }
    if (st.outcome) { busy = false; refresh(); finish(); return }
    FB.endTurn(st); refresh(); toast('ENEMY PHASE'); await wait(550);
    await playSteps(FB.monsterTurn(st));
    busy = false;
    if (st.outcome) { refresh(); finish(); return }
    await startTurnShow(false);
  }
  /* embedded in the world map: hand the result back (also automatically a moment after the end) */
  let reported = false;
  function report(outcome) { if (reported || !EMBED) return; reported = true; try { parent.postMessage({ type: 'agrenor-battle', outcome, hp: FB.hero(st).hp, kills: FB.monsters(st).filter(m => m.hp <= 0).length, party: FB.allies(st).map(a => ({ key: a.key, hp: a.hp, order: a.order || 'charge' })) }, '*') } catch (e) { } }
  function finish() {
    if (EMBED) { const b = hud?.querySelector('#fbBack'); if (b) b.hidden = false; const f = hud?.querySelector('#fbFlee'); if (f) f.hidden = true; setTimeout(() => report(st.outcome), 3600) } hudSync(); handSync(); if (st.outcome === 'lose') { banner('DEFEAT…', 'win'); sfx('lose') } else if (!CINE) toast('VICTORY!') }
  function flash(msg) { texts.push({ u: FB.hero(st).vu, v: FB.hero(st).vv, txt: msg, col: '#f6d79b', t0: now(), small: true }) }
  function floatText(unit, txt, col, small, big) { const t = now(), stack = texts.filter(x => x.unit === unit && t - x.t0 < 450).length; texts.push({ unit, u: unit.vu, v: unit.vv, txt, col, t0: t, small, big, dx: (Math.random() - .5) * 18, dy: -stack * 22 }) }   // texts on the same unit stack upward
  function walkAnim(unit, path, speed = 4.2, slide = false) { return new Promise(res => { anims.push({ unit, pts: path.slice(1), i: 0, res, speed, slide }) }) }

  /* ---------- v97.16 · battle coach for the prologue's fights (?tut=cave|raid|expedition): one tip at a time at the top of the screen;
     a tip with a check moves on by itself when the player has done it, the others have "ถัดไป". ---------- */
  const TUT = Q.get('tut'), coachState = { i: 0, moved: false, t0: 0 };
  const COACH = {
    cave: [
      { t: 'แถบบนสุดคือคิวเทิร์น · กรอบทองคือตัวที่ได้เล่นตอนนี้ — ตอนนี้ตาคุณ' },
      { t: 'คลิกช่องว่างเพื่อเดิน (เกมเลือกไพ่เดินให้เอง) · เดินพลาดกด Z หรือ ↶ ย้อนเดิน', done: () => coachState.moved },
      { t: 'คลิกศัตรู 1 ครั้ง ดูการ์ดที่ดีที่สุดกับดาเมจ · คลิกซ้ำเพื่อโจมตี (ยังไม่ถึงระยะ เกมพาเดินเข้าไปให้)', done: () => st.acted },
      { t: 'กด จบเทิร์น (Space) แล้วเลือกทิศหันหน้า — หันเข้าหาศัตรู เพราะโดนตีจากด้านหลังแรงขึ้น ×1.2', done: () => st.turns > coachState.t0 },
      { t: 'ลูกศรใต้ตัวบอกทิศที่แต่ละตัวหัน · อ้อมไปตีศัตรูจากด้านหลังได้ ×1.2 · ล้มศัตรูให้หมดเพื่อชนะ' }],
    raid: [
      { t: 'ตัวเลข ▲ บนช่องคือความสูง · ยืนสูงกว่าเป้าตีแรงขึ้น · ชี้ช่องดูความสูงและชนิดพื้นที่มุมขวาบน' },
      { t: 'ไอคอนข้างชื่อศัตรูคือธาตุ · ธาตุชนะทาง ×1.3 แพ้ทาง ×0.7 · Esc → ◈ ตารางธาตุ' },
      { t: 'เพื่อนที่แผงซ้าย: ⚔ บุก · 👣 ตาม · 🛡 ยึด · ✦ ท่าพิเศษใช้ 1 คริสตัล' },
      { t: 'การ์ดตอบโต้/ก้าวหลบ ใช้ก่อนจบเทิร์น แล้วจะทำงานเองตอนศัตรูตีเข้ามา' }],
    expedition: [
      { t: 'แรงหมด? กด ♻ ทิ้งไพ่ฟื้นแรง เลือกไพ่ที่ไม่ใช้ แลกเป็นแรง (ใช้ 1 คริสตัล)' },
      { t: 'หญ้าสูง/มอสคือกำบัง โดนตี −30% · ถอยไปยืนตอนเลือดน้อย' },
      { t: 'การ์ดปีนป่าย กระโจน หินถล่ม ใช้ความสูงให้ได้เปรียบ · ผลักศัตรูตกผาเสีย HP เพิ่ม' }]
  };
  function coach() {
    const list = TUT && COACH[TUT]; let d = document.getElementById('fbCoach');
    if (!list || !st || st.outcome || coachState.i >= list.length) { d?.remove(); return }
    const c = list[coachState.i]; if (c.done && c.done()) { coachState.i++; sfx('cast', .25); return coach() }
    if (!d) { d = document.createElement('div'); d.id = 'fbCoach'; document.body.append(d); d.onclick = e => { const a = e.target.closest('[data-c]')?.dataset.c; if (a === 'next') { coachState.i++; coach() } else if (a === 'close') { coachState.i = 1e9; coach() } } }
    const html = `<small>📘 บทเรียน ${coachState.i + 1}/${list.length}</small><span>${esc(c.t)}</span>${c.done ? '' : '<button data-c="next">ถัดไป ▸</button>'}<button data-c="close" class="x" title="ปิดบทเรียน">✕</button>`;
    if (d.dataset.k !== TUT + coachState.i) { d.dataset.k = TUT + coachState.i; d.innerHTML = html; d.classList.remove('on'); void d.offsetWidth; d.classList.add('on') }
  }
  /* ---------- v97.15 · controlled companions (B14): on an unlocked companion's CT turn the battle waits for the player.
     Click a cell = walk (its own move points) · click an enemy = show the hit (≈ damage, walking in if needed), click again = do it ·
     ✦ = its signature skill (no crystal, usual cooldown) · 🤖 = let the AI play this one (also for later turns, until switched back) ·
     Space / ⏭ = end the turn and pick its facing. ---------- */
  let pendAlly = null;
  async function afterAI() { if (st.outcome) { refresh(); finish(); return } if (st.turn === 'ally') return enterAlly(); await startTurnShow(false) }
  function enterAlly() { walks = []; pendAlly = null; pend = null; markAuto(); const u = st.cur; actUnit = u; document.body.classList.add('fb-ally'); hint('ตาของ ' + u.name + ' · คลิกช่องเพื่อเดิน · คลิกศัตรูเพื่อตี · Space จบเทิร์น'); floatText(u, 'YOUR MOVE', '#ffe08a', true); sfx('cast', .3); refresh() }
  function allyBar() {
    let d = document.getElementById('fbAlly'); const on = st && st.turn === 'ally' && !st.outcome && st.cur;
    if (!on) { d?.remove(); document.body.classList.remove('fb-ally'); return }
    if (!d) { d = document.createElement('div'); d.id = 'fbAlly'; document.body.append(d); d.onclick = e => { const a = e.target.closest('[data-a]')?.dataset.a; if (!a || busy) return; if (a === 'end') endAllyTurn(); else if (a === 'undo') undoWalk(); else if (a === 'skill') allySkillCtl(); else if (a === 'auto') allyAutoCtl() } }
    const u = st.cur, sk = FB.ALLY_SKILL[u.key];
    d.innerHTML = `<b>${esc(u.name)}</b><small>Lv.${u.level || 1} · เดิน ${st.mp} · ระยะ ${u.range}${st.acted ? ' · ทำแล้ว' : ''}</small>
      ${sk ? `<button data-a="skill" ${st.acted || u.cd ? 'disabled' : ''} title="${esc(sk.name)}">✦ ${esc(sk.name)}${u.cd ? ' (' + u.cd + ')' : ''}</button>` : ''}
      <button data-a="undo" ${st.acted || !walks.length ? 'disabled' : ''}>↶ ย้อนเดิน</button><button data-a="auto" title="ให้ AI เล่นคนนี้แทน (สลับกลับได้ที่แผงซ้าย)">🤖 AI เล่นแทน</button><button data-a="end" class="ok">⏭ จบเทิร์น <small>Space</small></button>`;
  }
  function allyClick(wp) {
    const g = inv(wp.x, wp.y), to = { u: Math.floor(g.u), v: Math.floor(g.v) };
    const m = FB.monsters(st).find(u => u.hp > 0 && ((u.u === to.u && u.v === to.v) || (() => { const p = project(u.vu, u.vv); return Math.abs(wp.x - p.x) < 30 && wp.y < p.y + 6 && wp.y > p.y - UNIT * 1.5 })()));
    if (m) return allyEnemy(m);
    pendAlly = null; heroMove(to);
  }
  async function allyEnemy(m) {
    if (pendAlly && pendAlly.id === m.id) { const p = pendAlly; pendAlly = null; if (p.to) { await heroMove(p.to); const u = st.cur; if (u.u !== p.to.u || u.v !== p.to.v) return }
      const u = st.cur, r = FB.allyHit(st, m.id); if (!r.ok) { flash(r.reason); return } walks = []; busy = true; hudSync(); await unitAttack(u, m, r); busy = false; refresh(); if (st.outcome) finish(); return }
    FB.setTarget(st, m.id); const p = FB.allyPlan(st, m.id); if (p.reason) { pendAlly = null; flash(p.reason); return }
    pendAlly = { id: m.id, ...p }; floatText(m, '≈ −' + p.est + (p.kill ? ' ☠' : ''), p.kill ? '#ffe14d' : '#ffd0a0', true); hint((p.to ? 'เดินเข้าไปแล้วตี' : 'ตี') + ' ' + m.name + ' · คลิกอีกครั้งเพื่อยืนยัน'); hudSync();
  }
  async function allySkillCtl() { const u = st.cur, r = FB.allySkillNow(st); if (!r.ok) { flash(r.reason); return } walks = []; busy = true; hudSync(); await playSkill(r); busy = false; refresh(); if (st.outcome) finish() }
  async function allyAutoCtl() { const u = st.cur; u.autoCtl = true; busy = true; const s = FB.allyAuto(st); await playSteps(s); busy = false; await finishAlly(false) }
  async function endAllyTurn() { if (busy || st.turn !== 'ally' || facing) return; if (!(await pickFacing(st.cur))) return; await finishAlly(true) }
  async function finishAlly() { pendAlly = null; walks = []; busy = true; document.body.classList.remove('fb-ally'); const r = FB.endAllyTurn(st); refresh(); await playSteps(r.steps); actUnit = null; busy = false; await afterAI() }
  /* ---------- v97.08 · pause menu (Esc / ☰): restart, flee, element chart, controls — kept off the main HUD so they can't be hit by mistake ---------- */
  let pauseEl = null;
  function pauseMenu() {
    if (pauseEl) { pauseEl.remove(); pauseEl = null; return }
    if (!st || facing) return;
    const d = document.createElement('div'); d.id = 'fbPause'; pauseEl = d;
    const canAct = !busy && st.turn === 'hero' && !st.outcome;
    d.innerHTML = `<div class="box"><b>หยุดเกม</b><small>${esc(goalLine())}</small>
      <button data-a="resume">▶ เล่นต่อ</button><button data-a="el">◈ ตารางธาตุ</button><button data-a="keys">⌨ ปุ่มควบคุม</button>
      ${EMBED ? `<button data-a="flee" class="warn" ${canAct ? '' : 'disabled'}>🏃 หนีจากการต่อสู้</button>` : `<button data-a="new" class="warn">⟲ เริ่มการต่อสู้ใหม่</button>`}
      <div class="keys" hidden>คลิกศัตรู · Tab = เลือกเป้าและดูการ์ดที่ดีที่สุด<br>คลิกซ้ำ · Enter = โจมตีตามที่แสดง<br>คลิกช่อง = เดิน (ใช้ไพ่เดินให้เอง)<br>1–9 = ใช้ไพ่ต่อสู้ใบนั้น · Z / Backspace = ย้อนเดิน<br>Space = จบเทิร์น แล้วเลือกทิศด้วยลูกศร · A = Auto<br>Q / E = หมุนกล้อง · Esc = เมนูนี้</div></div>`;
    document.body.append(d);
    d.onclick = e => { const a = e.target.closest('[data-a]')?.dataset.a; if (e.target === d) a || pauseMenu(); if (!a) return;
      if (a === 'resume') pauseMenu(); else if (a === 'el') { pauseMenu(); window.ElementWheel?.showChart() } else if (a === 'keys') d.querySelector('.keys').hidden = !d.querySelector('.keys').hidden;
      else if (a === 'flee') { const b = e.target.closest('button'); if (b.dataset.sure) { pauseMenu(); if (!busy && st.turn === 'hero' && !st.outcome) report('flee') } else { b.dataset.sure = 1; b.textContent = 'กดอีกครั้งเพื่อหนี' } }
      else if (a === 'new') { const b = e.target.closest('button'); if (b.dataset.sure) { pauseMenu(); document.querySelectorAll('.fb-show,.fb-fly,#fbBar').forEach(x => x.remove()); build(); userCam = false; cam.set = false; startTurnShow(true) } else { b.dataset.sure = 1; b.textContent = 'กดอีกครั้งเพื่อเริ่มใหม่' } } };
  }
  addEventListener('keydown', e => {
    if (!ON || !st || facing || e.target.closest?.('input,textarea') || e.repeat) return;
    if (e.key === 'Escape') { if (pauseEl) pauseMenu(); else if (pend) { pend = null; markAuto() } else if (!document.querySelector('dialog[open]')) pauseMenu(); return }
    if (pauseEl || busy || st.outcome) return;
    const k = e.key.toLowerCase();
    if (st.turn === 'ally') { if (k === ' ') { e.preventDefault(); endAllyTurn() } else if (k === 'z' || k === 'backspace') { e.preventDefault(); undoWalk() } else if (k === 'enter' && pendAlly) { e.preventDefault(); const m = st.units.find(u => u.id === pendAlly.id); if (m) allyEnemy(m) } else if (k === 'tab') { e.preventDefault(); const ms = FB.monsters(st).filter(m => m.hp > 0); const i = ms.findIndex(m => m.id === pendAlly?.id); pendAlly = null; if (ms.length) allyEnemy(ms[(i + 1) % ms.length]) } return }
    if (st.turn !== 'hero') return;
    if (k === ' ') { e.preventDefault(); endHeroTurn() }
    else if (k === 'z' || k === 'backspace') { e.preventDefault(); undoWalk() }
    else if (k === 'a') setAuto(!auto)
    else if (k === 'tab') { e.preventDefault(); const ms = FB.monsters(st).filter(m => m.hp > 0); if (!ms.length) return; const i = ms.findIndex(m => m.id === (pend?.id || st.target)); pend = null; onEnemy(ms[(i + (e.shiftKey ? ms.length - 1 : 1)) % ms.length]) }
    else if (k === 'enter' && pend) { e.preventDefault(); const m = st.units.find(u => u.id === pend.id); if (m) onEnemy(m) }
    else if (/^[1-9]$/.test(k)) { const b = hand?.querySelectorAll('#fbCombat .fb-card')[+k - 1]; if (b) cardClick(b) }
  });
  function click(wp) {
    if (st && st.turn === 'ally' && !busy && !st.outcome && !facing) return allyClick(wp);
    if (!st || busy || st.outcome || st.turn !== 'hero' || discardMode || facing) return;
    const g = inv(wp.x, wp.y), to = { u: Math.floor(g.u), v: Math.floor(g.v) };
    const m = FB.monsters(st).find(u => u.hp > 0 && ((u.u === to.u && u.v === to.v) || (() => { const p = project(u.vu, u.vv); return Math.abs(wp.x - p.x) < 30 && wp.y < p.y + 6 && wp.y > p.y - UNIT * 1.5 })()));
    if (m) { onEnemy(m); return }
    pend = null; markAuto(); walkTo(to);
  }
  /* ---------- v97.08 · one-click play: the game picks the card ----------
     click an enemy: it becomes the target and the best card for it shows (gold); click it again to play — walking next to it first
     (with a move card if needed) when no card reaches it from here. Click a cell: walk there, playing the smallest move card that reaches it.
     Cards can still be played by hand as before. */
  let pend = null, walks = [], facing = null;
  const handBtn = (group, uid) => hand?.querySelector(`.fb-card[data-group="${group}"][data-uid="${uid}"]`);
  function markAuto() { hand?.querySelectorAll('.fb-card.auto').forEach(e => e.classList.remove('auto')); if (!pend) return; handBtn('combat', pend.combatUid)?.classList.add('auto'); if (pend.moveUid) handBtn('movement', pend.moveUid)?.classList.add('auto') }
  async function onEnemy(m) {
    if (pend && pend.id === m.id) { const p = pend; pend = null; markAuto(); await runAttackPlan(p); return }
    FB.setTarget(st, m.id); sfx('cast', .25); hudSync(); handSync();
    const p = FB.autoAttack(st, m.id);
    if (p.reason) { pend = null; markAuto(); floatText(m, 'TARGET', '#ffd25a', true); flash(p.reason); return }
    const c = st.deck.combat.hand[p.index], mc = p.moveCard != null ? st.deck.movement.hand[p.moveCard] : null, name = cardName('combat', c.id);
    pend = { id: m.id, to: p.to || null, combatUid: c.uid, moveUid: mc?.uid || null, total: p.pv.total, kill: p.pv.kill }; markAuto();
    floatText(m, '≈ −' + p.pv.total + (p.pv.kill ? ' ☠' : ''), p.pv.kill ? '#ffe14d' : '#ffd0a0', true);
    hint((p.to ? 'เดินเข้าไปแล้วใช้ ' : 'ใช้ ') + name + (mc ? ' (+ ' + cardName('movement', mc.id) + ')' : '') + ' · คลิกศัตรูอีกครั้งเพื่อโจมตี');
  }
  async function runAttackPlan(p) {
    if (p.moveUid) { const b = handBtn('movement', p.moveUid); if (!b) return; await cardClick(b) }
    if (p.to) { await heroMove(p.to); const h = FB.hero(st); if (h.u !== p.to.u || h.v !== p.to.v) return }
    FB.setTarget(st, p.id); const b = handBtn('combat', p.combatUid); if (b) await cardClick(b);
  }
  async function walkTo(to) {
    const p = FB.autoWalk(st, to); if (p.reason) { flash(p.reason); return }
    if (p.moveCard != null) { const b = handBtn('movement', st.deck.movement.hand[p.moveCard].uid); if (!b) return; await cardClick(b) }
    await heroMove(to);
  }
  function hint(text) { let d = document.getElementById('fbHint'); if (!d) { d = document.createElement('div'); d.id = 'fbHint'; document.body.append(d) } d.textContent = text; d.classList.remove('on'); void d.offsetWidth; d.classList.add('on'); clearTimeout(hint.t); hint.t = setTimeout(() => d.classList.remove('on'), 4200) }
  /* ---------- v97.08 · undo a walk until the hero acts ---------- */
  function undoWalk() {
    if (busy || !st || (st.turn !== 'hero' && st.turn !== 'ally') || st.outcome) return;
    if (st.acted || !walks.length) { flash(st.acted ? 'โจมตีแล้ว ย้อนการเดินไม่ได้' : 'ยังไม่ได้เดิน'); return }
    const w = walks.pop(), h = FB.actor(st); h.u = w.from.u; h.v = w.from.v; h.vu = h.u + .5; h.vv = h.v + .5; h.face = w.face; h.dir = w.dir; st.mp += w.cost;
    pend = null; sfx('cast', .2); floatText(h, 'UNDO', '#bfe8ff', true); refresh();
  }
  /* ---------- v97.08 · FFT end of turn: pick where the hero faces (hits from behind ×1.2, from the side ×1.1) ---------- */
  const FACES = [['SE', 1, 0], ['SW', 0, 1], ['NW', -1, 0], ['NE', 0, -1]];
  function faceNearest(u) { let best = null, bd = 1e9; for (const o of FB.opponents(st, u)) { const d = FB.dist(u, o); if (d < bd) { bd = d; best = o } } if (best) { u.face = u.dir = FB.faceOf(u, best) } }
  function pickFacing(unit) {
    return new Promise(res => {
      const h = unit || FB.hero(st), f0 = h.face, d0 = h.dir, c = screenOf(h), box = document.createElement('div'); box.id = 'fbFace';
      const btns = FACES.map(([f, du, dv]) => { const p = screenOf({ vu: h.vu + du * .95, vv: h.vv + dv * .95 }); return { f, x: p.x, y: p.y, ang: Math.atan2(p.y - c.y, p.x - c.x) } });
      box.innerHTML = `<div class="tip">หันหน้าไปทางไหน? <small>ศัตรูตีจากด้านหลัง ×1.2 · ด้านข้าง ×1.1</small></div>` +
        btns.map(b => `<button data-f="${b.f}" style="left:${b.x}px;top:${b.y}px" title="หันไปทางนี้แล้วจบเทิร์น"><span style="transform:rotate(${(b.ang * 180 / Math.PI).toFixed(0)}deg)">➜</span></button>`).join('') +
        `<div class="bar"><button class="ok">✓ จบเทิร์น <small>Enter</small></button><button class="no">ยกเลิก <small>Esc</small></button></div>`;
      document.body.append(box); facing = box;
      const set = f => { h.face = f; h.dir = f; box.querySelectorAll('[data-f]').forEach(b => b.classList.toggle('on', b.dataset.f === f)) };
      const done = ok => { removeEventListener('keydown', key, true); box.remove(); facing = null; if (!ok) { h.face = f0; h.dir = d0 } else sfx('cast', .3); res(ok) };
      const key = e => { const A = { ArrowRight: 0, ArrowDown: Math.PI / 2, ArrowLeft: Math.PI, ArrowUp: -Math.PI / 2 }[e.key];
        if (A != null) { e.preventDefault(); e.stopPropagation(); let best = null, bd = 9; for (const b of btns) { const d = Math.abs(Math.atan2(Math.sin(b.ang - A), Math.cos(b.ang - A))); if (d < bd) { bd = d; best = b } } set(best.f); return }
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); done(true) } else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); done(false) } };
      addEventListener('keydown', key, true);
      box.querySelectorAll('[data-f]').forEach(b => { b.onmouseenter = () => set(b.dataset.f); b.onclick = () => { set(b.dataset.f); done(true) } });
      box.querySelector('.ok').onclick = () => done(true); box.querySelector('.no').onclick = () => done(false);
      set(h.face || h.dir);
    });
  }

  /* ---------- effects (old BattleVFX images; code fallback = a ring) ---------- */
  function fx(kind, to, from, o = {}) {
    const dur = kind === 'heal' || kind === 'shield' ? 900 : 650;
    effects.push({ kind, seed: (Math.random() * 1e6) | 0, scale: o.scale || 1, color: o.color, to: { x: to.vu, y: to.vv }, from: from && from !== to ? { x: from.vu, y: from.vv } : null, start: now(), duration: dur });
    return dur;
  }
  /* v94.03 · code-drawn effects for the height cards: rocks raining down, climb chevrons, the perch banner, landing dust, the dive streak */
  const HEIGHT_FX = {
    rockfall(g, e, t, p) { const R = n => ((e.seed * (n + 1) * 9301 + 49297) % 233280) / 233280; for (let i = 0; i < 6; i++) { const d = Math.max(0, Math.min(1, t * 1.6 - i * .1)), x = p.x + (R(i) - .5) * UNIT * .9, y0 = p.y - UNIT * 3.2, y = y0 + (p.y - UNIT * .3 - y0) * d * d, s = 6 + R(i + 9) * 9; g.globalAlpha = d >= 1 ? Math.max(0, 1 - (t - .6) * 3) : 1; g.fillStyle = i % 2 ? '#8a7f70' : '#6d6458'; g.beginPath(); g.moveTo(x - s, y); g.lineTo(x - s * .3, y - s); g.lineTo(x + s, y - s * .4); g.lineTo(x + s * .6, y + s * .5); g.closePath(); g.fill() } if (t > .55) { const k = (t - .55) / .45; g.globalAlpha = 1 - k; g.fillStyle = 'rgba(170,150,120,.7)'; g.beginPath(); g.ellipse(p.x, p.y, Math.max(0, UNIT * (.4 + k * .8)), Math.max(0, UNIT * (.18 + k * .3)), 0, 0, 7); g.fill() } },
    climbUp(g, e, t, p) { g.strokeStyle = '#bfffd0'; g.lineWidth = 4; g.lineCap = 'round'; for (let i = 0; i < 3; i++) { const k = (t * 1.5 + i * .3) % 1, y = p.y - UNIT * (.3 + k * 1.6); g.globalAlpha = 1 - k; g.beginPath(); g.moveTo(p.x - 14, y + 8); g.lineTo(p.x, y - 4); g.lineTo(p.x + 14, y + 8); g.stroke() } },
    perchFlag(g, e, t, p) { g.globalAlpha = 1 - t; g.strokeStyle = '#ffd25a'; g.lineWidth = 3; g.beginPath(); g.ellipse(p.x, p.y, Math.max(0, UNIT * (.3 + t * .6)), Math.max(0, UNIT * (.14 + t * .28)), 0, 0, 7); g.stroke(); g.fillStyle = '#ffd25a'; g.fillRect(p.x + 18, p.y - UNIT * 1.6, 3, UNIT * 1.1); g.beginPath(); g.moveTo(p.x + 21, p.y - UNIT * 1.6); g.lineTo(p.x + 46, p.y - UNIT * 1.45 + Math.sin(t * 20) * 3); g.lineTo(p.x + 21, p.y - UNIT * 1.3); g.fill() },
    fallDust(g, e, t, p) { for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28, r = UNIT * (.2 + t * .9); g.globalAlpha = (1 - t) * .8; g.fillStyle = '#b8a888'; g.beginPath(); g.arc(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r * .45 - t * 10, 5 + t * 6, 0, 7); g.fill() } },
    diveTrail(g, e, t, p, a) { g.globalAlpha = 1 - t; const gr = g.createLinearGradient(a.x, a.y - UNIT, p.x, p.y - UNIT * .5); gr.addColorStop(0, 'rgba(255,240,180,0)'); gr.addColorStop(1, 'rgba(255,220,120,.9)'); g.strokeStyle = gr; g.lineWidth = 10 * (1 - t) + 2; g.beginPath(); g.moveTo(a.x, a.y - UNIT * 1.4); g.quadraticCurveTo((a.x + p.x) / 2, Math.min(a.y, p.y) - UNIT * 2.4, p.x, p.y - UNIT * .5); g.stroke() }
  };
  function fxDraw(g, now) {
    effects = effects.filter(e => now < e.start + e.duration);
    for (const e of effects) {
      const t = Math.min(1, (now - e.start) / e.duration), p = project(e.to.x, e.to.y), a = e.from ? project(e.from.x, e.from.y) : p;
      g.save(); let ok = HEIGHT_FX[e.kind] ? (HEIGHT_FX[e.kind](g, e, t, p, a), true) : false; if (!ok) try { ok = window.BattleVFX?.draw(e, t, p, a, g, { w: UNIT, h: UNIT / 2 }) } catch (err) { ok = false }
      if (!ok) { g.globalAlpha = 1 - t; g.strokeStyle = e.color || '#ffd27a'; g.lineWidth = 4; g.beginPath(); g.ellipse(p.x, p.y - UNIT * .6, Math.max(0, UNIT * (.3 + t * .6)), Math.max(0, UNIT * (.18 + t * .35)), 0, 0, 7); g.stroke() }
      g.restore();
    }
  }

  /* ---------- drawing ---------- */
  /* v94: a cell outline sits on its own raised top (battle-field heights); the village has none */
  function poly(g, u, v) { if (window.FieldCellPoly) return FieldCellPoly(g, u, v); const L = window.FieldHeight ? FieldHeight.lift(u, v) : 0, F = window.projectFlat || project, P = (x, y) => { const q = F(x, y); return { x: q.x, y: q.y - L } }, a = P(u, v), b = P(u + 1, v), c = P(u + 1, v + 1), d = P(u, v + 1); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.lineTo(c.x, c.y); g.lineTo(d.x, d.y); g.closePath() }
  let last = 0;
  function step(t) {
    const dt = Math.min(.1, Math.max(0, t - last) / 1000 || 0); last = t;
    for (const u of st.units) u.walking = false;
    for (let k = anims.length - 1; k >= 0; k--) {
      const a = anims[k], u = a.unit, tgt = a.pts[a.i];
      if (!tgt) { anims.splice(k, 1); a.res(); continue }
      const tu = tgt.u + .5, tv = tgt.v + .5, du = tu - u.vu, dv = tv - u.vv, len = Math.hypot(du, dv), sp = dt * a.speed;
      if (!a.slide) { u.walking = true; if (len > .01) u.dir = Math.abs(du) >= Math.abs(dv) ? (du > 0 ? 'SE' : 'NW') : (dv > 0 ? 'SW' : 'NE') }
      if (len <= sp) { u.vu = tu; u.vv = tv; a.i++; if (!a.slide) sfx('step', .3) } else { u.vu += du / len * sp; u.vv += dv / len * sp }
    }
  }
  function shadow(g, p, r) { g.fillStyle = '#0006'; g.beginPath(); g.ellipse(p.x, p.y, Math.max(0, r), Math.max(0, r * .45), 0, 0, 7); g.fill() }
  function bar(g, p, top, frac, col) { const bw = 46, bx = p.x - bw / 2, by = top - 8; g.fillStyle = '#000a'; g.fillRect(bx - 1, by - 1, bw + 2, 7); g.fillStyle = col; g.fillRect(bx, by, bw * Math.max(0, frac), 5) }
  /* hero: the old TACTICS_SPRITES poses (idle/walk/windup/strike/guard/hit/down) per direction, weapon drawn at the pose's hand anchor */
  /* TACTICS_SPRITES is a top-level const (not a window property) */
  function sprites() { return typeof TACTICS_SPRITES !== 'undefined' ? TACTICS_SPRITES : null }
  function heroFrame(u, t) {
    const A = sprites(); if (!A) return null;
    const set = A.directions[u.dir] || A.directions.SE, name = u.hp <= 0 ? 'down' : u.walking ? 'walk' : u.pose || 'idle';
    if (name === 'walk') return window.HeroMotion?.frame(A, u.dir, t, true) || set.idle;
    if (name === 'idle') return window.HeroMotion?.frame(A, u.dir, t, false) || set.idle;
    if (!OLDPOSE) return set.idleFrames?.[0] || set.idle;                 // action poses: still frame of the new outfit, moved by poseMotion()
    const fr = set[name + 'Frames']; if (fr?.length) return name === 'down' ? fr.at(-1) : (window.StudioWalks?.frame(fr, t) || fr[0]);
    return set[name] || set.idle;
  }
  /* procedural action poses (code instead of pictures): lean back on windup, lunge + sword arc on strike, recoil on hit, crouch on guard, fall on down */
  function poseMotion(u, t) {
    const name = u.hp <= 0 ? 'down' : u.walking ? 'walk' : u.pose || 'idle';
    if (u._lp !== name) { u._lp = name; u._pt = t }
    const e = t - (u._pt || t), fs = ['SE', 'NE'].includes(u.dir) ? 1 : -1, ease = x => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3), m = { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, wpn: 0 };
    if (OLDPOSE) return m;
    if (name === 'windup') { const k = ease(e / 200); Object.assign(m, { dx: -fs * 7 * k, rot: -fs * .15 * k, sx: 1 + .03 * k, sy: 1 - .05 * k, wpn: -fs * 75 * k }) }
    else if (name === 'strike') { const k = ease(e / 90), d = 1 - ease((e - 220) / 320); Object.assign(m, { dx: fs * 18 * k * d, dy: -2 * k * d, rot: fs * .17 * k * d, sx: 1 - .03 * k * d, sy: 1 + .05 * k * d, wpn: fs * (-75 + 170 * k) * d }) }
    else if (name === 'hit') { const k = Math.exp(-e / 170); Object.assign(m, { dx: -fs * 9 * k, rot: -fs * .13 * k, sy: 1 - .04 * k }) }
    else if (name === 'guard') { const k = ease(e / 130); Object.assign(m, { dx: -fs * 3 * k, sx: 1 + .04 * k, sy: 1 - .08 * k, wpn: -fs * 40 * k }) }
    else if (name === 'down') { const k = ease(e / 450); Object.assign(m, { rot: -fs * 1.3 * k, dy: 2 * k }) }
    return m;
  }
  function weapon(g, def, hand, left, top, size, angle) {
    const i = im(def.src); if (!i) return;
    const h = size * (def.scale || .63), w = h * def.size[0] / def.size[1];
    g.save(); g.translate(left + hand[0] * size, top + hand[1] * size); g.rotate(angle * Math.PI / 180); g.drawImage(i, -def.pivot[0] * w, -def.pivot[1] * h, w, h); g.restore();
  }
  /* v97.01: weapons the sprite sheet has no hand anchor for (axe, bow, knife, rapier, spear, tome) use the loose pictures in assets/tactics */
  const WEXTRA = { axe: { pivot: [.5, .9], size: [256, 768], scale: .62 }, knife: { pivot: [.5, .8], size: [256, 512], scale: .34 }, rapier: { pivot: [.5, .88], size: [256, 768], scale: .78 }, spear: { pivot: [.5, .72], size: [256, 1024], scale: 1.1 }, bow: { pivot: [.5, .5], size: [128, 320], scale: .6 }, tome: { pivot: [.5, .5], size: [160, 200], scale: .26 } };
  const weaponDef = (A, k) => A.equipment[k] || (WEXTRA[k] ? { src: `assets/tactics/${k}.webp`, ...WEXTRA[k] } : null);
  /* ---------- v97.18 · the job's look on the same hero picture (docs/TODO.md "อาชีพและอาวุธ") ----------
     outfit: the cloth pixels (the old green cloak, or the dull dark brown between shoulders and boots of the current outfit) take the job's hue / saturation / lightness — skin and hair stay;
     done once per picture and job, then cached · aura: code-drawn, behind and around the hero · emblem: the job sign next to the HP bar */
  const jobPic = (img, src, L) => window.JobLook ? JobLook.pic(img, src, L) : img;
  const jobAura = (g, u, p, size, t, front) => { if (u.hp > 0) window.JobLook?.aura(g, u.look, p, size, t, front) };
  function jobEmblem(g, u, p, top) {
    const L = u.look; if (!L?.icon) return; const x = p.x - 32, y = top - 7;
    g.save(); g.fillStyle = L.col || '#888'; g.strokeStyle = '#1a140c'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 8.5, 0, 7); g.fill(); g.stroke();
    g.fillStyle = '#fff8e8'; g.font = '700 11px system-ui,"Segoe UI Symbol",sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(L.icon, x, y + .5); g.restore();
  }
  function drawHero(g, u, t) {
    const A = sprites(), p = project(u.vu, u.vv), f = heroFrame(u, t); if (!A || !f) return;
    const size = UNIT * 1.6, left = p.x - size * A.anchor[0], top = p.y - size * A.anchor[1], i = jobPic(im(f.src), f.src, u.look);
    let ox = 0; if (u.pose === 'hit') ox = Math.sin(t * .07) * 3;
    const pm = poseMotion(u, t);
    shadow(g, p, UNIT * .26); g.save(); g.translate(ox, -(u.lift || 0)); if (u.hp <= 0) g.globalAlpha *= .6;
    g.translate(p.x + pm.dx, p.y + pm.dy); g.rotate(pm.rot); g.scale(pm.sx, pm.sy); g.translate(-p.x, -p.y);
    const sword = () => { if (u.weapon && weaponDef(A, u.weapon)) weapon(g, weaponDef(A, u.weapon), f.right, left, top, size, (f.rotation || 0) + pm.wpn) };
    /* v97.01: standing ready or walking, the weapon is carried on the back (behind the body when facing the camera, over it when facing away); drawn in the hand only for actions */
    const carried = u.hp > 0 && (u.walking || !u.pose || u.pose === 'idle'), W = u.weapon && weaponDef(A, u.weapon);
    const onBack = () => { if (!W) return; const away = ['NE', 'NW'].includes(u.dir), side = ['SE', 'NE'].includes(u.dir) ? -1 : 1, i2 = im(W.src); if (!i2) return;
      const h = size * (W.scale || .63) * .9, w = h * W.size[0] / W.size[1];
      const tipUp = ['spear', 'staff', 'bow'].includes(u.weapon), flatBack = u.weapon === 'tome';   // blades, hammers: point / edge down · spears (and staves): point up
      g.save(); g.translate(left + size * (.5 + side * (['knife', 'tome', 'bow'].includes(u.weapon) ? .2 : .06)), top + size * (flatBack ? .62 : u.weapon === 'knife' ? .52 : tipUp ? .56 : .38)); g.rotate(flatBack ? 0 : (side * (away ? 38 : -38) + (tipUp ? 0 : 180)) * Math.PI / 180); g.drawImage(i2, -W.pivot[0] * w, -W.pivot[1] * h, w, h); g.restore() };
    jobAura(g, u, p, size, t, false);
    if (carried) { if (!['NE', 'NW'].includes(u.dir)) onBack() }
    else if (f.rightBehind) sword();
    const body = () => { if (f.flipImage) { g.save(); g.translate(left + size / 2, 0); g.scale(-1, 1); g.drawImage(i, -size / 2, top, size, size); g.restore() } else g.drawImage(i, left, top, size, size) };
    if (i) { body(); if ((u.flashUntil || 0) > t) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .85; body(); body(); g.restore() } }
    if (carried) { if (['NE', 'NW'].includes(u.dir)) onBack() }
    else if (!f.rightBehind) sword();
    jobAura(g, u, p, size, t, true);
    g.restore();
    bar(g, p, top + size * .12, u.shown / u.maxHp, '#6fd18a'); jobEmblem(g, u, p, top + size * .12);
  }
  /* monster: old MonsterArt clips (idle/walk/windup/strike/hit/down, SE/NE + mirror); static picture until the clip loads */
  /* companions: the old per-character pictures (<key>_<se|ne>_<idle|windup|strike|hit|guard|down>.webp), SW/NW mirrored, moved with poseMotion */
  function drawAlly(g, u, t) {
    const p = project(u.vu, u.vv), back = ['NE', 'NW'].includes(u.dir), flip = ['SW', 'NW'].includes(u.dir), pose = u.hp <= 0 ? 'down' : u.walking ? 'idle' : (['windup', 'strike', 'hit', 'guard'].includes(u.pose) ? u.pose : 'idle');
    if (!ALLY_ART.includes(u.key) && window.VillagerDraw) { const look = window.VillageLife?.P?.[u.key]?.look || { coat: '#5a6a8a', hair: '#3a2a1a', weapon: 'sword' }, pm = poseMotion(u, t);
      g.save(); if (u.hp <= 0) g.globalAlpha *= .5; g.translate(pm.dx * .6, pm.dy - (u.lift || 0)); VillagerDraw(g, look, p.x, p.y, t, { walking: u.walking, face: u.dir, scale: UNIT / 56 * .78, act: u.hp <= 0 ? 'sleep' : u.pose === 'strike' ? 'work' : '' });
      if ((u.flashUntil || 0) > t) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = .5; VillagerDraw(g, look, p.x, p.y, t, { face: u.dir, scale: UNIT / 56 * .78 }) } g.restore(); if (u.hp > 0) bar(g, p, p.y - UNIT * 1.25, u.shown / u.maxHp, '#7fc8a0'); return }
    const i = im(`assets/tactics/${u.key}_${back ? 'ne' : 'se'}_${pose}.webp`) || im(`assets/tactics/${u.key}_se_idle.webp`); shadow(g, p, UNIT * .24);
    if (!i) return; const size = UNIT * 1.45, pm = poseMotion(u, t);
    g.save(); g.translate(p.x + pm.dx * .6, p.y + pm.dy - (u.walking ? Math.abs(Math.sin(t * .02)) * 3 : 0) - (u.lift || 0)); g.rotate(pm.rot * .5); if (flip) g.scale(-1, 1); if (u.hp <= 0) g.globalAlpha *= .5;
    g.drawImage(i, -size / 2, -size * .94, size, size);
    if ((u.flashUntil || 0) > t) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = .85; g.drawImage(i, -size / 2, -size * .94, size, size); g.drawImage(i, -size / 2, -size * .94, size, size) }
    g.restore(); if (u.hp > 0) bar(g, p, p.y - size * .8, u.shown / u.maxHp, '#7fc8a0');
  }
  function frozenMark(g, u, t) { if (!u.stun || u.hp <= 0) return; const p = project(u.vu, u.vv); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = 'rgba(140,210,255,.28)'; g.beginPath(); g.ellipse(p.x, p.y, UNIT * .38, UNIT * .16, 0, 0, 7); g.fill(); g.strokeStyle = 'rgba(200,240,255,.8)'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + t * .0005, x = p.x + Math.cos(a) * UNIT * .3, y = p.y + Math.sin(a) * UNIT * .12; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 4, y - 14 - (i % 3) * 5); g.stroke() } g.restore(); g.save(); g.font = '18px system-ui'; g.textAlign = 'center'; g.fillText('❄', p.x, p.y - UNIT * 1.7); g.restore() }
  function drawMonster(g, u, t) {
    const p0 = project(u.vu, u.vv), v = { walking: u.walking, hitUntil: u.hitUntil || 0, guardUntil: 0, pose: u.pose };
    const T = MON[u.kind] || MT, kind = MON[u.kind] ? u.kind : MK, bs = u.boss ? 1.25 : 1;
    const af = window.MonsterArt?.frame(kind, u.dir, v, u.hp, t, 'fb-' + u.id);
    /* v97.26 · B3: fliers hover half a cell up and bob; their shadow stays on the ground, smaller as they rise */
    const lift = (u.fly || T.fly) && u.hp > 0 ? UNIT * (.42 + .07 * Math.sin(t * .005 + (u.id.length * 1.7))) : 0, p = { x: p0.x, y: p0.y - lift };
    shadow(g, p0, UNIT * .26 * T.scale * bs * (lift ? .7 - lift / UNIT * .3 : 1));
    if (af) {
      const h = UNIT * 1.6 * Math.max(.8, T.scale) * bs * (af.renderHeight || 1), w = h * af.sw / af.sh, pv = af.pivot || [.5, .95];
      g.save(); g.translate(p.x, p.y); if (af.flip) g.scale(-1, 1); if (u.hp <= 0) g.globalAlpha *= .55;
      const ai = u.variant || u.leader ? window.JobLook?.tint(af.image, JobLook.VARIANT[u.variant || 'elite']) || af.image : af.image;   /* v97.26 · J6 */
      g.drawImage(ai, af.sx, af.sy, af.sw, af.sh, -w * pv[0], -h * pv[1], w, h);
      if ((u.flashUntil || 0) > t) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = .85; for (let k = 0; k < 2; k++) g.drawImage(af.image, af.sx, af.sy, af.sw, af.sh, -w * pv[0], -h * pv[1], w, h) }
      g.restore();
      bar(g, p, p.y - h * (af.barHeight || .85), u.shown / u.maxHp, '#e2705f'); return;
    }
    const back = ['NE', 'NW'].includes(u.dir), i = im('assets/enemies/' + T.img + (back ? '-back' : '') + '.webp') || im('assets/enemies/' + T.img + '.webp'); if (!i) return;
    const h = UNIT * 1.6 * T.scale * bs * .8, w = h * i.naturalWidth / i.naturalHeight;
    g.save(); g.translate(p.x + ((u.hitUntil || 0) > t ? Math.sin(t * .08) * 4 : 0), p.y); if (['SE', 'NE'].includes(u.dir)) g.scale(-1, 1); if (u.hp <= 0) { g.rotate(Math.PI * .4); g.globalAlpha = .5 }
    g.drawImage(u.variant || u.leader ? window.JobLook?.tint(i, JobLook.VARIANT[u.variant || 'elite']) || i : i, -w / 2, -h, w, h); g.restore(); bar(g, p, p.y - h, u.shown / u.maxHp, '#e2705f');
  }
  function draw(g, t0) {
    if (!ready || typeof locations === 'undefined' || !locations.length) return;
    const t = now();
    if (!st) { build(); hudMake(); handMake(); cam.set = false; focusCamera(true); arenaReady(); if (Q.get('warm') !== '1') startTurnShow(true) }
    step(t);
    g.save();
    for (const [key, k] of cells) {
      const [u, v] = key.split(',').map(Number); poly(g, u, v);
      const col = window.FieldCellTint ? FieldCellTint(u, v, k, COL[k]) : COL[k]; if (col) { g.fillStyle = col; g.fill() }
      g.lineWidth = 1; g.strokeStyle = k === 'blocked' ? 'rgba(255,120,120,.35)' : 'rgba(255,255,255,.22)'; g.stroke();
    }
    if (reachMap && !busy) for (const e of reachMap.values()) { if (e.cost === 0) continue; poly(g, e.u, e.v); g.fillStyle = 'rgba(70,150,255,.34)'; g.fill(); g.strokeStyle = 'rgba(150,200,255,.8)'; g.lineWidth = 1.5; g.stroke() }
    /* v97.22 · objective cells: green exits (escape) · a gold banner cell (defend) */
    if (st.obj?.cells) for (const c of st.obj.cells) { const esc_ = st.obj.type === 'escape', pul = .5 + .5 * Math.sin(t * .005); poly(g, c.u, c.v); g.fillStyle = esc_ ? `rgba(80,230,120,${.22 + .18 * pul})` : `rgba(255,200,60,${.25 + .2 * pul})`; g.fill(); g.strokeStyle = esc_ ? '#7dffa0' : '#ffd25a'; g.lineWidth = 2.5; g.stroke();
      const p = project(c.u + .5, c.v + .5); g.font = '16px system-ui,"Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.fillText(esc_ ? '⇲' : '🚩', p.x, p.y + 5 - 3 * pul) }
    /* v94.02 · height of every cell you can reach (1–3; 0 = ground) */
    if (reachMap && !busy && window.FieldHeight) { g.font = '700 11px system-ui'; g.textAlign = 'center'; for (const e of reachMap.values()) { const L = FB.lv(st, e.u, e.v); if (!L) continue; const p = project(e.u + .5, e.v + .5); g.fillStyle = 'rgba(10,20,40,.75)'; g.beginPath(); g.arc(p.x, p.y, 8, 0, 7); g.fill(); g.fillStyle = '#cfe4ff'; g.fillText('▲' + L, p.x, p.y + 4) } }
    if (pushShow && !busy) { poly(g, pushShow.u, pushShow.v); g.fillStyle = pushShow.stuck ? 'rgba(160,160,160,.35)' : pushShow.dmg ? 'rgba(255,60,40,.45)' : 'rgba(255,200,80,.35)'; g.fill(); const p = project(pushShow.u + .5, pushShow.v + .5); g.font = '800 13px system-ui'; g.textAlign = 'center'; g.fillStyle = '#000a'; g.fillRect(p.x - 48, p.y - 30, 96, 18); g.fillStyle = pushShow.dmg ? '#ffb0a0' : '#ffe2a8'; g.fillText(pushShow.stuck ? 'ผลักไม่ได้' : pushShow.dmg ? 'ตก ' + pushShow.drop + ' ระดับ −' + pushShow.dmg : 'ไม่ตก', p.x, p.y - 17) }
    const h = FB.hero(st), tg = st.target && st.units.find(u => u.id === st.target && u.hp > 0);
    /* hovering a combat card: its reach around the hero in red */
    if (dmgShow && !busy && dmgShow.target.hp > 0) { const q = project(dmgShow.target.vu, dmgShow.target.vv), txt = '−' + dmgShow.total + (dmgShow.kill ? ' ☠' : ''); g.save(); g.font = '900 24px system-ui,"Noto Sans Thai",sans-serif'; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = 6; g.strokeStyle = '#1a0d08e6'; g.fillStyle = dmgShow.kill ? '#ffe14d' : '#ffd0a0'; const y = q.y - UNIT * 1.75 - 4 * Math.sin(now() * .006); g.strokeText(txt, q.x, y); g.fillText(txt, q.x, y); g.restore() }
    if (rangeShow && !busy) for (const [key, k] of cells) { if (k === 'blocked') continue; const [u, v] = key.split(',').map(Number), d = Math.abs(u - h.u) + Math.abs(v - h.v); if (d < 1 || d > rangeShow) continue; poly(g, u, v); g.fillStyle = 'rgba(255,80,60,.26)'; g.fill(); g.strokeStyle = 'rgba(255,150,130,.7)'; g.lineWidth = 1.2; g.stroke() }
    /* enemies some playable card can reach: red; the chosen target: gold */
    if (!busy && st.turn === 'hero' && !st.outcome) { const reachR = Math.max(0, ...st.deck.combat.hand.map((c, i) => !FB.combatBlock(st, i) && !FB.cardRule(c.id)?.self ? FB.cardRule(c.id).range + (FB.cardRule(c.id).range > 1 ? h.rangePlus || 0 : 0) : 0)); for (const mm of FB.monsters(st)) if (mm.hp > 0 && reachR && FB.dist(h, mm) <= reachR) { poly(g, mm.u, mm.v); g.strokeStyle = '#ff5a4a'; g.lineWidth = 3; g.stroke() } }
    if (tg) { poly(g, tg.u, tg.v); g.strokeStyle = '#ffd25a'; g.lineWidth = 3.5; g.setLineDash([6, 4]); g.lineDashOffset = -t * .02; g.stroke(); g.setLineDash([]) }
    for (const a of FB.allies(st)) if (a.hp > 0) { poly(g, a.u, a.v); g.strokeStyle = 'rgba(127,200,160,.7)'; g.lineWidth = 1.5; g.stroke() }
    poly(g, h.u, h.v); g.strokeStyle = '#6fd18a'; g.lineWidth = 2; g.stroke();
    /* v97.08 · where everyone faces: a small wedge on the ground in front of each unit (hits from behind ×1.2, side ×1.1) */
    for (const u of st.units) { const F = u.hp > 0 && FB.FACE_V[u.face]; if (!F) continue; const [fu, fv] = F, P = (a, b) => project(u.vu + fu * a - fv * b, u.vv + fv * a + fu * b), tip = P(.62, 0), l = P(.34, .17), r = P(.34, -.17);
      g.beginPath(); g.moveTo(tip.x, tip.y); g.lineTo(l.x, l.y); g.lineTo(r.x, r.y); g.closePath(); g.fillStyle = u.side === 'monster' ? 'rgba(255,120,95,.85)' : u === h ? 'rgba(130,230,150,.9)' : 'rgba(150,215,190,.8)'; g.fill(); g.strokeStyle = 'rgba(0,0,0,.55)'; g.lineWidth = 1; g.stroke() }
    if (st.turn === 'ally' && st.cur && st.cur.hp > 0) { poly(g, st.cur.u, st.cur.v); g.strokeStyle = '#ffd25a'; g.lineWidth = 3; g.stroke() }
    if (pendAlly?.to && !busy) { poly(g, pendAlly.to.u, pendAlly.to.v); g.fillStyle = 'rgba(255,210,90,.28)'; g.fill(); g.strokeStyle = '#ffd25a'; g.lineWidth = 2.5; g.setLineDash([5, 4]); g.lineDashOffset = -t * .02; g.stroke(); g.setLineDash([]) }
    if (pend?.to && !busy) { poly(g, pend.to.u, pend.to.v); g.fillStyle = 'rgba(255,210,90,.28)'; g.fill(); g.strokeStyle = '#ffd25a'; g.lineWidth = 2.5; g.setLineDash([5, 4]); g.lineDashOffset = -t * .02; g.stroke(); g.setLineDash([]) }
    g.restore();
    if (CINE) spotlight(g, cine ? [cine.a, cine.b] : st.units.filter(u => u.hp > 0));
    glowDraw(g, t);
    /* a host page (battle-field.html) can hand in standing props so trees/rocks and units overlap by depth */
    /* v96: a host with view depth (battle-field.html) sorts by depth so cells in front of a unit can be drawn over it */
    const extras = window.TownBattleExtras?.() || [], DEP = window.FieldDepth, order = [...st.units.map(u => ({ unit: u, y: project(u.vu, u.vv).y, d: DEP ? DEP(u.vu, u.vv) : 0 })), ...extras].sort(DEP ? (a, b) => (a.d ?? 0) - (b.d ?? 0) : (a, b) => a.y - b.y);
    const drawUnit = u => { const ld = u.dir; if (window.viewDir) u.dir = viewDir(ld); try { u === h ? drawHero(g, u, t) : u.side === 'hero' ? drawAlly(g, u, t) : (drawMonster(g, u, t), frozenMark(g, u, t)) } finally { u.dir = ld } };
    for (const it of order) {
      if (!it.unit) { it.draw(g, t); continue }
      const u = it.unit, o = kbOff(u, t); g.save(); g.translate(o.x, o.y);
      if (u.deadAt && t > u.deadAt) { const e = (t - u.deadAt) / 1400; g.globalAlpha = Math.max(0, 1 - e); if (e < 1 && Math.random() < .5) { const p = project(u.vu, u.vv); parts.push({ x: p.x + (Math.random() - .5) * UNIT * .8, y: p.y - Math.random() * UNIT * 1.3, vx: (Math.random() - .5) * 30, vy: -60 - Math.random() * 60, t0: t, life: 700, col: '255,220,180', spark: false, size: 2 + Math.random() * 2, float: true }) } }
      drawUnit(u); g.restore();
    }
    /* v96: units hidden behind higher ground show through as a ghost in normal colours (Tactics Ogre / Triangle Strategy style) */
    for (const u of st.units) if (u._occ && u.hp > 0) { const o = kbOff(u, t); g.save(); g.translate(o.x, o.y); g.globalAlpha = .78; drawUnit(u); g.restore() }
    /* v97.19 · status icons above the head (sleep, burn, poison, silence, weak, frozen, slowed) */
    g.save(); g.font = '15px system-ui,"Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center';
    for (const u of st.units) { if (u.hp <= 0) continue; const ic = [u.leader ? '👑' : '', ...Object.keys(u.sts || {}).map(k => FB.STATUS[k]?.icon), u.stun ? '❄' : '', u.slowed ? '⚡' : ''].filter(Boolean); if (!ic.length) continue;
      const q = project(u.vu, u.vv), y = q.y - UNIT * 1.95 + Math.sin(t * .004) * 2, w = ic.length * 18 + 6; g.fillStyle = 'rgba(10,14,20,.7)'; g.beginPath(); g.roundRect?.(q.x - w / 2, y - 14, w, 20, 9); g.fill(); ic.forEach((x, k) => g.fillText(x, q.x - w / 2 + 12 + k * 18, y + 1)) }
    g.restore();
    fxDraw(g, t); partDraw(g, t);
    if (CINE) { speedDraw(g, t); atmosphere(g, t0); flashDraw(g) }
    texts = texts.filter(x => t - x.t0 < 1300);
    for (const x of texts) {
      const p = project(x.u, x.v), e = (t - x.t0), a = e / 1300, pop = x.small ? 1 : e < 140 ? 1 + .9 * (1 - e / 140) : 1 + .08 * Math.max(0, 1 - (e - 140) / 200);
      const base = x.small ? 14 : x.big ? 30 : 23, y = p.y - UNIT * 1.6 - (x.small ? 18 : 0) + (x.dy || 0) - Math.min(1, e / 260) * 26 - a * 18;
      g.save(); g.globalAlpha = a < .7 ? 1 : 1 - (a - .7) / .3; g.font = `900 ${Math.round(base * pop)}px system-ui,"Noto Sans Thai",sans-serif`; g.textAlign = 'center'; g.lineJoin = 'round'; g.lineWidth = x.small ? 4 : 6; g.strokeStyle = '#1a0d08e6'; g.fillStyle = x.col; g.strokeText(x.txt, p.x + (x.dx || 0), y); g.fillText(x.txt, p.x + (x.dx || 0), y); g.restore();
    }
  }
  /* ---------- HD-2D light (code-drawn) ----------
     spotlight: a dark veil in screen space with soft holes over the fighters; always a light vignette, deep during cut-scenes */
  let veil = null;
  function spotlight(g, units) {
    const dpr = devicePixelRatio || 1, w = Math.round(W * dpr), h = Math.round(H * dpr);
    if (!veil) veil = document.createElement('canvas'); if (veil.width !== w || veil.height !== h) { veil.width = w; veil.height = h }
    const v = veil.getContext('2d'), k = scale * zoom * dpr, base = .1 + light * .42 + (NIGHT ? .38 : 0);
    v.globalCompositeOperation = 'source-over'; v.clearRect(0, 0, w, h);
    const vg = v.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .35, w / 2, h / 2, Math.max(w, h) * .75); vg.addColorStop(0, NIGHT ? `rgba(8,14,48,${base * .8})` : `rgba(10,12,28,${base * .6})`); vg.addColorStop(1, NIGHT ? `rgba(4,6,24,${Math.min(.92, base + .25)})` : `rgba(6,6,16,${base + .2})`);
    v.fillStyle = vg; v.fillRect(0, 0, w, h);
    v.globalCompositeOperation = 'destination-out';
    for (const u of units) {
      const p = project(u.vu, u.vv), x = ((p.x - WORLD_W / 2) * scale * zoom + W / 2 + pan.x) * dpr, y = ((p.y - UNIT * .7 - WORLD_H / 2) * scale * zoom + H / 2 + pan.y) * dpr, r = UNIT * 1.9 * k;
      const hg = v.createRadialGradient(x, y, r * .15, x, y, r); hg.addColorStop(0, `rgba(0,0,0,${.35 + light * .65})`); hg.addColorStop(1, 'rgba(0,0,0,0)');
      v.fillStyle = hg; v.beginPath(); v.arc(x, y, r, 0, 7); v.fill();
    }
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(veil, 0, 0); g.restore();
  }
  function glowDraw(g, t) {
    glows = glows.filter(x => t - x.t0 < x.dur);
    for (const x of glows) {
      const p = project(x.u, x.v), a = 1 - (t - x.t0) / x.dur, r = x.r * (.7 + .5 * (1 - a));
      g.save(); g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(p.x, p.y - UNIT * .2, 0, p.x, p.y - UNIT * .2, r);
      gr.addColorStop(0, `rgba(${x.col},${.55 * a})`); gr.addColorStop(1, `rgba(${x.col},0)`); g.fillStyle = gr; g.beginPath(); g.ellipse(p.x, p.y - UNIT * .2, Math.max(0, r), Math.max(0, r * .55), 0, 0, 7); g.fill(); g.restore();
    }
  }
  function partDraw(g, t) {
    parts = parts.filter(p => t - p.t0 < p.life);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const p of parts) {
      const e = (t - p.t0) / 1000, a = 1 - (t - p.t0) / p.life, x = p.x + p.vx * e, y = p.y + p.vy * e + (p.float ? 0 : 520 * e * e);
      if (p.spark) { const vx = p.vx, vy = p.vy + 1040 * e, l = Math.hypot(vx, vy) || 1, len = 10 + 18 * a; g.strokeStyle = `rgba(${p.col},${a})`; g.lineWidth = p.size; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x - vx / l * len, y - vy / l * len); g.stroke() }
      else { g.fillStyle = `rgba(${p.col},${a * .9})`; g.beginPath(); g.arc(x, y, p.size * (.6 + .4 * a), 0, 7); g.fill() }
    }
    g.restore();
  }
  /* anime impact lines converging on the one being hit (screen space) */
  function speedDraw(g, t) {
    speed = speed.filter(s => t - s.t0 < s.dur); if (!speed.length) return;
    g.save(); g.setTransform(devicePixelRatio || 1, 0, 0, devicePixelRatio || 1, 0, 0);
    for (const s of speed) {
      const a = 1 - (t - s.t0) / s.dur, p = project(s.u.vu, s.u.vv), cx = (p.x - WORLD_W / 2) * scale * zoom + W / 2 + pan.x, cy = (p.y - UNIT * .75 - WORLD_H / 2) * scale * zoom + H / 2 + pan.y, R = Math.hypot(W, H);
      const r0 = 110 + (1 - a) * 60; g.fillStyle = `rgba(255,255,255,${.5 * a})`;
      for (let i = 0; i < 40; i++) { const an = (i / 40) * Math.PI * 2 + ((i * 7919) % 13) * .03, w = .006 + ((i * 31) % 7) * .002, r1 = r0 + ((i * 53) % 9) * 14; g.beginPath(); g.moveTo(cx + Math.cos(an) * r1, cy + Math.sin(an) * r1); g.lineTo(cx + Math.cos(an - w) * R, cy + Math.sin(an - w) * R); g.lineTo(cx + Math.cos(an + w) * R, cy + Math.sin(an + w) * R); g.closePath(); g.fill() }
    }
    g.restore();
  }
  function flashDraw(g) {
    const t = performance.now(); flashes = flashes.filter(f => t - f.t0 < f.dur); if (!flashes.length) return;
    g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
    for (const f of flashes) { const a = f.a * (1 - (t - f.t0) / f.dur); if (f.col === '255,255,255') { g.fillStyle = `rgba(255,255,255,${a})`; g.fillRect(0, 0, g.canvas.width, g.canvas.height) } else { const w = g.canvas.width, h = g.canvas.height, gr = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .3, w / 2, h / 2, Math.max(w, h) * .7); gr.addColorStop(0, `rgba(${f.col},0)`); gr.addColorStop(1, `rgba(${f.col},${a * 1.6})`); g.fillStyle = gr; g.fillRect(0, 0, w, h) } }
    g.restore();
  }
  /* warm light shafts from the upper left + dust motes drifting through them (Octopath-style air) */
  function atmosphere(g, t) {
    g.save(); g.setTransform(devicePixelRatio || 1, 0, 0, devicePixelRatio || 1, 0, 0); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      const x = W * (.08 + i * .22) + Math.sin(t * .00012 + i * 1.7) * 40, w = 60 + i * 26, a = (.035 + .02 * Math.sin(t * .0004 + i)) * (1 - light * .5);
      const gr = g.createLinearGradient(x, 0, x + H * .5, H); gr.addColorStop(0, `rgba(255,225,160,${a})`); gr.addColorStop(.7, `rgba(255,210,140,${a * .4})`); gr.addColorStop(1, 'rgba(255,210,140,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(x, -10); g.lineTo(x + w, -10); g.lineTo(x + w + H * .55, H); g.lineTo(x + H * .55, H); g.closePath(); g.fill();
    }
    for (let i = 0; i < 26; i++) {
      const sp = .006 + (i % 5) * .002, x = (i * 137.5 + t * sp * 3) % (W + 40) - 20, y = (i * 89.3 + Math.sin(t * .0006 + i) * 30 + t * sp) % H, r = 1 + (i % 3) * .7;
      g.fillStyle = `rgba(255,236,190,${.18 + .14 * Math.sin(t * .002 + i)})`; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    g.restore();
  }
  /* the page's own pointerup is replaced by TownUX, so the battle listens for a plain click itself (no drag = click) */
  { let down = null; cv.addEventListener('pointerdown', e => { if (e.button === 0) down = { x: e.clientX, y: e.clientY } }, true);
    cv.addEventListener('pointerup', e => { if (e.button !== 0 || !down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5; down = null; if (moved) userCam = true; else click(world(e)) }, true);
    cv.addEventListener('wheel', () => { userCam = true }, true) }
  /* runs before the frame's camera transform: TownUX re-centres on the village hero every frame, so the arena has to win after it */
  function pre() { if (st && (!userCam || cine)) focusCamera(); else if (kick.roll) { kick.roll = 0; cv.style.transform = '' } }
  window.TownBattle = { pre, active: () => ON, click, draw, state: () => st, reach: () => (busy ? null : reachMap), cells: () => cells, hero: () => st && FB.hero(st), monster: () => st && FB.monster(st), target: id => st && FB.setTarget(st, id),
    act: { undo: undoWalk, attackPlan: id => st && FB.autoAttack(st, id), skill: allySkillAct, order: (id, o) => { FB.setOrder(st, id, o); hudSync() }, move: heroMove, end: endHeroTurn, card: (group, i) => { const b = hand?.querySelector(`.fb-card[data-group="${group}"][data-i="${i}"]`); return b ? cardClick(b) : null }, discard: setDiscard, confirmDiscard: doDiscard }, busy: () => busy };
})();
