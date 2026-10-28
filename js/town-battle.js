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
  const V = '92.14';
  const SLOW = ['mud', 'snow', 'sand'], COVER = ['moss', 'clover'], WATER = ['water', 'pond'];
  const COL = { normal: null, slow: 'rgba(170,110,40,.38)', cover: 'rgba(60,170,80,.38)', blocked: 'rgba(210,60,60,.32)' };
  const CW = 56, SIZE = +Q.get('size') || 1.5, UNIT = CW * SIZE;           // old camera.w ≙ one lattice cell, scaled once for the village
  const MON = {
    bandit: { name: 'โจรป่า', hp: 34, move: 3, atk: 8, scale: 1, fx: 'sword', img: 'bandit' },
    wolf: { name: 'หมาป่า', hp: 26, move: 4, atk: 7, scale: .9, fx: 'knife', img: 'wolf' },
    slime: { name: 'สไลม์แร่', hp: 40, move: 2, atk: 8, scale: .85, fx: 'blunt', img: 'slime' },
    kobold: { name: 'โคโบลด์ขุดแร่', hp: 30, move: 3, atk: 9, scale: .9, fx: 'blunt', img: 'kobold' },
    golem: { name: 'โกเล็มหิน', hp: 95, move: 2, atk: 15, scale: 1.3, fx: 'blunt', img: 'golem' },
    shadowWolf: { name: 'หมาป่าเงา', hp: 44, move: 5, atk: 11, scale: 1.05, fx: 'knife', img: 'shadow-wolf' }
  };
  const MK = MON[Q.get('m')] ? Q.get('m') : 'bandit', MT = MON[MK];
  const NIGHT = Q.get('night') === '1', ATKX = +Q.get('atk') || 1, HST = Q.get('hst') != null ? Math.max(0, Math.min(100, +Q.get('hst'))) : 100;
  const EMBED = Q.get('embed') === '1', TITLE = Q.get('title') || '', HHP = +Q.get('hhp') || 0, HMAX = +Q.get('hmax') || 60;
  const CINE = Q.get('cine') !== '0', OLDPOSE = Q.get('oldposes') === '1', HPX = +Q.get('hp') || 1.6;
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
    const want = { 'js/tactics-decks.js': 'TacticsDecks', 'js/flat-battle.js': 'FlatBattle', 'js/monster-animation.js': 'MonsterArt', 'js/battle-vfx.js': 'BattleVFX', 'js/battle-polish.js': 'BattlePolish', 'js/card-design.js': 'CARD_DESIGN', 'js/card-studio.js': 'CardStudio' };
    await Promise.all(Object.keys(want).filter(s => !window[want[s]]).map(loadScript));
    FB = window.FlatBattle; TD = window.TacticsDecks; ready = !!(FB && TD);
    window.MonsterArt?.preload?.([MK], ['idle', 'walk', 'windup', 'strike', 'hit', 'down']);
  }
  /* embedded (world map): a black veil until the arena is ready, then tell the parent */
  let veil0 = null;
  if (EMBED) { veil0 = document.createElement('div'); veil0.style.cssText = 'position:fixed;inset:0;z-index:100;background:#07080c;display:flex;align-items:center;justify-content:center;color:#ffe2a8;font:italic 800 22px system-ui,sans-serif;letter-spacing:3px;transition:opacity .4s'; veil0.textContent = 'PREPARING BATTLE…'; addEventListener('DOMContentLoaded', () => document.body.append(veil0)) }
  function arenaReady() { if (veil0) { veil0.style.opacity = '0'; setTimeout(() => veil0?.remove(), 450) } if (EMBED) try { parent.postMessage({ type: 'agrenor-battle-ready', warm: Q.get('warm') === '1' }, '*') } catch (e) { } }
  boot();

  /* ---------- arena ---------- */
  function build() {
    const sq = locations.find(o => o.id === 'square') || locations[0], c = center(sq);
    const r = +Q.get('r') || 5, cu = Math.floor(+Q.get('u') || c.u), cv = Math.floor(+Q.get('v') || c.v);
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
    const gap = Math.min(r - 1, 3), hs = spot(cu - gap, cv + gap), ms = spot(cu + gap, cv - gap);   // diagonal opposites ~6 cells apart: contact by turn 1–2
    st = FB.create({ bounds: b, kindAt: (u, v) => cells.get(u + ',' + v) || 'blocked', cards: true,
      hero: { ...hs, name: window.heroName?.() || 'ฮีโร่', maxHp: HMAX, hp: HHP ? Math.min(HMAX, HHP) : HMAX, stamina: HST }, monster: { ...ms, name: (TITLE ? TITLE + ' ' : '') + MT.name + (NIGHT && ATKX > 1 ? ' (ดุร้ายยามค่ำ)' : ''), hp: Math.round(MT.hp * HPX), maxHp: Math.round(MT.hp * HPX), atk: Math.round(MT.atk * ATKX), move: MT.move } });
    for (const u of st.units) { u.vu = u.u + .5; u.vv = u.v + .5; u.shown = u.hp; u.dir = 'SE'; u.pose = 'idle' }
    FB.hero(st).dir = dirTo(FB.hero(st), FB.monster(st)); FB.monster(st).dir = dirTo(FB.monster(st), FB.hero(st));
    st.arena = { cu, cv, r };
    texts = []; anims = []; effects = []; busy = false; discardMode = false; picked.clear(); seenUids.clear();
  }
  function refresh() { reachMap = st.turn === 'hero' && !st.acted && !st.outcome && st.mp > 0 ? FB.reach(st, FB.hero(st)) : null; hudSync(); handSync() }
  /* ---------- camera director ----------
     cam = world point at the screen centre + zoom. Normal: frame both fighters (shifted right/up so the HUD and the hand don't cover them).
     Cinematic: push in on attacker + target. Shake and roll kick are added on top. */
  const cam = { x: 0, y: 0, z: 1.05, set: false }, kick = { shake: 0, shakeT: 0, shakeDur: 1, roll: 0 };
  let cine = null, lastPre = 0, light = 0, ox = 120;            // light: 0 normal … 1 full spotlight
  function frameTarget() {
    if (cine) { const a = project(cine.a.vu, cine.a.vv), b = project(cine.b.vu, cine.b.vv); return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - UNIT * .75, z: cine.z } }
    const a = project(FB.hero(st).vu, FB.hero(st).vv), b = project(FB.monster(st).vu, FB.monster(st).vv), dx = Math.abs(a.x - b.x) + UNIT * 3, dy = Math.abs(a.y - b.y) + UNIT * 3;
    const narrow = W < 820, z = Math.max(narrow ? .45 : .75, Math.min(1.35, Math.min((W - (narrow ? 20 : 330)) / (dx * scale), (H - (narrow ? 330 : 240)) / (dy * scale))));
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - UNIT * .5, z };
  }
  function focusCamera(instant) {
    const now = performance.now(), dt = Math.min(.1, (now - lastPre) / 1000 || .016); lastPre = now;
    const tg = frameTarget(), k = instant || !cam.set ? 1 : 1 - Math.exp(-dt * (cine ? cine.speed : 3.5));
    cam.x += (tg.x - cam.x) * k; cam.y += (tg.y - cam.y) * k; cam.z += (tg.z - cam.z) * k; cam.set = true;
    zoom = cam.z;
    let sx = 0, sy = 0; if (kick.shake > 0) { const e = now - kick.shakeT, f = Math.max(0, 1 - e / kick.shakeDur); if (f <= 0) kick.shake = 0; else { sx = (Math.random() * 2 - 1) * kick.shake * f; sy = (Math.random() * 2 - 1) * kick.shake * f * .7 } }
    const narrow = W < 820; ox += ((cine ? cineOffset() : narrow ? 0 : 120) - ox) * k;
    pan = { x: -(cam.x - WORLD_W / 2) * scale * zoom + ox + sx, y: -(cam.y - WORLD_H / 2) * scale * zoom + (narrow ? 30 : -40) + sy };
    light += ((cine ? 1 : 0) - light) * Math.min(1, dt * 6);
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
    cine = { a, b, z: Math.min(2.1, (o.z || 1.75)), speed: 7 }; bars(true); hidePreview(); await wait(o.lead ?? 380);
    try { await run() } finally { await wait(o.tail ?? 220); cine = null; bars(false); userCam = false }
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
  #fbHud .bar{height:7px;background:#0006;border-radius:4px;overflow:hidden;margin:2px 0 6px;position:relative}#fbHud .bar i{display:block;height:100%;transition:width .35s}
  #fbHud .gem{display:inline-block;width:14px;height:14px;margin-right:3px;transform:rotate(45deg) scale(.8);border-radius:3px;background:#3b4c55;border:1px solid #8fb7c9}
  #fbHud .gem.on{background:radial-gradient(circle at 35% 35%,#e6fbff,#56c8f5 55%,#1b6b99);box-shadow:0 0 8px #6fd6ff}
  #fbHand{position:fixed;left:50%;bottom:8px;transform:translateX(-50%);z-index:41;display:flex;align-items:flex-end;gap:10px;padding:8px 12px 6px;border-radius:16px;background:linear-gradient(#0000,#0b1512cc 35%);max-width:calc(100vw - 16px);font:12px system-ui,"Noto Sans Thai",sans-serif;color:#f3e9c9}
  #fbHand .row{display:flex;gap:6px;align-items:flex-end}#fbHand .sep{width:1px;align-self:stretch;background:#ffffff33;margin:0 2px}
  #fbHand .lbl{position:absolute;left:0;right:0;top:-17px;text-align:center;font-size:11px;color:#cdbb8f;white-space:nowrap}
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
  function hudMake() {
    const d = document.createElement('div'); d.id = 'fbHud';
    d.innerHTML = `<b style="color:#f6d79b">⚔ สนามรบ · ไพ่</b><div id="fbTurn" style="margin:4px 0 6px;color:#bba57f"></div><div id="fbGems" style="margin:0 0 8px"></div><div id="fbUnits"></div>
      <div style="display:flex;gap:6px;margin:8px 0;flex-wrap:wrap"><button id="fbEnd">จบเทิร์น</button><button id="fbDis">♻ ทิ้งไพ่ฟื้นแรง</button>${EMBED ? '<button id="fbFlee">🏃 หนี</button><button id="fbBack" hidden>🗺 กลับแผนที่โลก</button>' : '<button id="fbNew">เริ่มใหม่</button>'}</div>
      <div id="fbLog" style="max-height:96px;overflow:auto;font-size:12px;color:#d8caa0"></div>
      <div class="help" style="margin-top:6px;font-size:11px;color:#9aa68a">ใช้ไพ่เดิน → คลิกช่องฟ้า · ใช้ไพ่สู้เมื่อศัตรูอยู่ในระยะ<br>คริสตัล 2 เม็ด/เทิร์น · ไพ่จั่วเติมตอนเริ่มเทิร์น<br>ช่อง: น้ำตาล เดินช้า · เขียว กำบัง −30% · แดง กีดขวาง</div>`;
    document.body.append(d); hud = d;
    d.querySelector('#fbEnd').onclick = () => endHeroTurn();
    d.querySelector('#fbDis').onclick = () => setDiscard(!discardMode);
    if (EMBED) { d.querySelector('#fbFlee').onclick = () => { if (!busy && st.turn === 'hero' && !st.outcome) report('flee') }; d.querySelector('#fbBack').onclick = () => report(st.outcome) }
    if (!EMBED) d.querySelector('#fbNew').onclick = () => { document.querySelectorAll('.fb-show,.fb-fly,#fbBar').forEach(e => e.remove()); build(); userCam = false; cam.set = false; startTurnShow(true) };
  }
  function hudSync() {
    if (!hud || !st) return;
    const h = FB.hero(st), m = FB.monster(st), bar = (v, max, col) => `<div class="bar"><i style="width:${Math.max(0, v / max * 100)}%;background:${col}"></i></div>`;
    hud.querySelector('#fbUnits').innerHTML =
      `<div>${esc(h.name)} <span style="float:right">${h.shown}/${h.maxHp}${h.guard ? ' <small style="color:#9cc8ff">🛡' + h.guard + '</small>' : ''}</span></div>${bar(h.shown, h.maxHp, '#6fd18a')}` +
      `<div><small style="color:#bba57f">แรง (stamina)</small> <span style="float:right">${h.stamina}/100</span></div>${bar(h.stamina, 100, '#e8c34a')}` +
      `<div>${esc(m.name)} <span style="float:right">${m.shown}/${m.maxHp}</span></div>${bar(m.shown, m.maxHp, '#e2705f')}`;
    hud.querySelector('#fbTurn').textContent = st.outcome ? (st.outcome === 'win' ? '🏆 ชนะ!' : '💀 แพ้…') : st.turn === 'hero' ? `เทิร์น ${st.turns} · ตาคุณ · แต้มเดิน ${st.mp}` : `เทิร์น ${st.turns} · ตา${m.name}…`;
    const left = FB.crystals(st), max = st.crystalMax;
    hud.querySelector('#fbGems').innerHTML = '<small style="color:#bba57f;margin-right:6px">คริสตัล</small>' + Array.from({ length: max }, (_, i) => `<span class="gem ${i < left ? 'on' : ''}"></span>`).join('');
    hud.querySelector('#fbEnd').disabled = busy || !!st.outcome || st.turn !== 'hero';
    hud.querySelector('#fbDis').disabled = busy || !!st.outcome || st.turn !== 'hero' || (!left && !discardMode);
    hud.querySelector('#fbDis').textContent = discardMode ? 'ยกเลิกการทิ้ง' : '♻ ทิ้งไพ่ฟื้นแรง';
    hud.querySelector('#fbLog').innerHTML = st.log.slice(-6).reverse().map(x => '<div>' + esc(x) + '</div>').join('');
  }

  /* ---------- hand ---------- */
  function handMake() {
    const d = document.createElement('div'); d.id = 'fbHand';
    d.innerHTML = `<div class="fb-pile draw" id="fbDraw"></div><div class="row" id="fbMove" style="position:relative"><span class="lbl">ไพ่เดิน</span></div><div class="sep"></div><div class="row" id="fbCombat" style="position:relative"><span class="lbl">ไพ่ต่อสู้</span></div><div class="fb-pile discard" id="fbDiscard"></div>`;
    document.body.append(d); hand = d;
    d.addEventListener('click', e => { const b = e.target.closest('.fb-card'); if (b) cardClick(b) });
    d.addEventListener('pointerover', e => { const b = e.target.closest('.fb-card'); if (b && !discardMode && !busy) preview(b) });
    d.addEventListener('pointerout', e => { const b = e.target.closest('.fb-card'); if (b && !b.contains(e.relatedTarget)) hidePreview() });
  }
  function cardEl(group, c, i) {
    const why = st.turn === 'hero' && !discardMode ? cardBlock(group, i) : '';
    return `<button class="fb-card ${why ? 'off' : ''} ${picked.has(c.uid) ? 'picked' : ''}" data-group="${group}" data-i="${i}" data-uid="${esc(c.uid)}" data-id="${esc(c.id)}" title="${esc(cardName(group, c.id) + ' — ' + cardLine(group, c.id) + (why ? ' · ' + why : ''))}"><div class="face">${faceHTML(group, c.id, true)}</div><span class="fb-tag"><b>${esc(cardName(group, c.id))}</b>${esc(cardLine(group, c.id))}</span></button>`;
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
    const a = screenOf(FB.hero(st)), b = screenOf(FB.monster(st)), mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - UNIT * k;
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
    if (group === 'combat') { const rr = FB.cardRule(id); rangeShow = rr && !rr.self ? rr.range : 0 }
    pv = document.createElement('div'); pv.className = 'fb-show';
    pv.innerHTML = `<div class="face">${faceHTML(group, id, false)}</div><div class="say"><b>${esc(cardName(group, id))}</b><br>${esc(cardLine(group, id))}${why && st.turn === 'hero' ? '<br><span style="color:#ff9a8a">' + esc(why) + '</span>' : ''}</div>`;
    document.body.append(pv); const s = sideSpot(210, 340); pv.style.left = s.x + 'px'; pv.style.top = s.y + 'px';
  }
  function hidePreview() { pv?.remove(); pv = null; rangeShow = 0 }
  let rangeShow = 0;
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
  async function startTurnShow(first) {
    refresh(); const fresh = (st.drawn || []).filter(u => !seenUids.has(u) || !first); st.drawn.forEach(u => seenUids.add(u));
    toast(first ? 'BATTLE START · DRAW' : `TURN ${st.turns} · DRAW ${fresh.length}`);
    if (fresh.length) { busy = true; hudSync(); await drawShow(fresh); busy = false; refresh() }
  }

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
    busy = true; hudSync();
    await heroAction(r);
    await show.done(); busy = false; refresh();
    if (st.outcome) finish();
  }
  async function heroAction(r) {
    const h = FB.hero(st), m = FB.monster(st);
    if (r.self) {
      h.pose = r.guard ? 'guard' : 'idle'; fx(r.fx, h, h, { color: r.heal ? '#7fe08a' : '#f4d36a' }); impact(h, r.fx, false); h.flashUntil = 0;
      await wait(260); if (r.heal) floatText(h, '+' + r.heal, '#7fe08a'); if (r.guard) floatText(h, 'GUARD ' + r.guard, '#9cc8ff'); if (r.restore) floatText(h, 'STAMINA +' + r.restore, '#ffe08a'); if (r.evade) floatText(h, 'EVADE READY', '#bfe8ff'); if (r.counter) floatText(h, 'COUNTER READY', '#ffd9a0'); if (r.ambush) floatText(h, 'AMBUSH ×1.6', '#d9b8ff');
      h.shown = h.hp; hudSync(); await wait(520); h.pose = 'idle'; return;
    }
    const kill = m.hp <= 0, heavy = r.big > 1 || r.hits.reduce((a, x) => a + x.damage, 0) >= 20;
    await cinematic(h, m, async () => {
      if (r.leap) { h.pose = 'windup'; await wait(160); await leapAnim(h, r.leap.to); shake(9, 260) }
      h.dir = dirTo(h, m); h.pose = 'windup'; if (cine) { cine.z += .18; cine.speed = 4 } await wait(heavy ? 420 : 280);
      h.pose = 'strike'; sfx('swing'); if (cine) cine.speed = 9; roll(dirSign(h, m) * (heavy ? 2.2 : 1.3)); lines(m, 220);
      const dur = fx(r.fx, m, h, { scale: r.big, color: r.fx === 'arcane' ? '#b49ae8' : '#7cc5db' });
      await wait(Math.min(320, dur * .45));
      for (const [n, x] of r.hits.entries()) {
        const last = n === r.hits.length - 1;
        const fin = kill && last; impact(m, r.fx, { big: heavy, crit: x.crit, kill: fin, from: h }); m.hitUntil = now() + 460;
        if (x.crit) banner('CRITICAL!', 'crit');
        if (fin) { hitStop(380); if (cine) cine.z = 2.3; shake(20, 600); m.deadAt = now() + 380 } else if (x.crit) { hitStop(210); shake(17, 460) } else { hitStop(heavy ? 140 : 100); shake(heavy ? 13 : 8, heavy ? 380 : 280) }
        floatText(m, '−' + x.damage, x.crit ? '#ffe14d' : heavy ? '#ffd27a' : '#ff9a8a', false, heavy || x.crit); if (x.notes.length) floatText(m, noteEn(x.notes), '#cfe4ff', true);
        m.shown = Math.max(m.hp, m.shown - x.damage); hudSync(); await wait(r.hits.length > 1 ? 300 : 220);
      }
      m.shown = m.hp; hudSync(); if (r.guard) floatText(h, 'GUARD ' + r.guard, '#9cc8ff', true);
      if (r.moved) { const from = { u: m.vu - .5, v: m.vv - .5 }; shake(6, 200); await walkAnim(m, [from, { u: m.u, v: m.v }], 5, true) }
      if (kill) { banner('DEFEATED!', 'win'); setTimeout(() => sfx('victory'), 400); await wait(1100) } else await wait(260); h.pose = 'idle';
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
    const mv = FB.move(st, to); if (!mv.ok) { flash(st.mp > 0 ? mv.reason : 'ใช้ไพ่เดินก่อน'); return }
    busy = true; hudSync(); await walkAnim(FB.hero(st), mv.path); busy = false; FB.hero(st).dir = FB.hero(st).dir; refresh();
  }
  async function monsterAttack(m, h, s) {
    m.dir = dirTo(m, h); const M = window.MonsterArt, tw = M?.timing?.(MK, m.dir, 'windup'), ts = M?.timing?.(MK, m.dir, 'strike');
    const kill = h.hp <= 0, guarded = s.notes.some(n => n.startsWith('ป้องกัน'));
    await cinematic(m, h, async () => {
      m.pose = 'windup'; if (cine) { cine.z += .15; cine.speed = 4 } await wait(Math.min(900, tw?.duration || 380));
      m.pose = 'strike'; sfx('swing'); if (cine) cine.speed = 9; roll(dirSign(m, h) * 1.5); lines(h, 200); await wait(Math.min(700, ts?.impactMs ?? 160));
      if (s.evaded) { const o = { u: h.vu, v: h.vv }, back = { u: h.vu + (h.vu - m.vu) * .35, v: h.vv + (h.vv - m.vv) * .35 }; h.vu = back.u; h.vv = back.v; fx('wind', h, m, {}); sfx('swing'); floatText(h, 'MISS', '#bfe8ff', false, true); await wait(420); h.vu = o.u; h.vv = o.v; m.pose = 'idle'; return }
      fx(guarded ? 'parry' : MT.fx, h, m, { color: '#ffb36a' }); impact(h, guarded ? 'parry' : MT.fx, { big: s.crit || s.damage >= 12, crit: s.crit, kill, from: m });
      if (s.crit) banner('CRITICAL!', 'crit'); if (s.damage && CINE) screenFlash('255,30,20', s.crit || kill ? .38 : .22, 320);
      h.pose = guarded ? 'guard' : 'hit'; if (kill) { hitStop(380); shake(20, 600) } else if (s.crit) { hitStop(200); shake(16, 440) } else { hitStop(s.damage ? 110 : 70); shake(s.damage ? 10 : 5, 300) }
      floatText(h, s.damage ? '−' + s.damage : 'BLOCKED', s.damage ? '#ff9a8a' : '#9cc8ff', false, s.damage >= 12); { const n = noteEn(s.notes); if (n) floatText(h, n, '#cfe4ff', true) } h.shown = h.hp; hudSync();
      await wait(Math.max(300, Math.min(900, (ts?.duration || 500) - (ts?.impactMs ?? 160))));
      if (s.counter) { h.pose = 'windup'; await wait(150); h.pose = 'strike'; sfx('swing'); fx('sword', m, h, {}); impact(m, 'sword', { from: h, big: true }); m.hitUntil = now() + 420; hitStop(120); shake(10, 300); floatText(m, '−' + s.counter, '#ffd27a', false, true); floatText(m, 'COUNTER', '#ffd9a0', true); m.shown = m.hp; hudSync(); if (m.hp <= 0) m.deadAt = now() + 300; await wait(420) }
      m.pose = 'idle'; if (h.hp > 0) h.pose = 'idle';
    }, { z: 1.7 });
  }
  async function endHeroTurn() {
    if (busy || st.turn !== 'hero' || st.outcome) return;
    setDiscard(false); FB.endTurn(st); busy = true; refresh(); await wait(350);
    const m = FB.monster(st), h = FB.hero(st), steps = FB.monsterTurn(st);
    for (const s of steps) {
      if (s.type === 'move') await walkAnim(m, s.path);
      else if (s.type === 'attack') await monsterAttack(m, h, s);
    }
    m.vu = m.u + .5; m.vv = m.v + .5; busy = false;
    if (st.outcome) { refresh(); finish(); return }
    await startTurnShow(false);
  }
  /* embedded in the world map: hand the result back (also automatically a moment after the end) */
  let reported = false;
  function report(outcome) { if (reported || !EMBED) return; reported = true; try { parent.postMessage({ type: 'agrenor-battle', outcome, hp: FB.hero(st).hp }, '*') } catch (e) { } }
  function finish() {
    if (EMBED) { const b = hud?.querySelector('#fbBack'); if (b) b.hidden = false; const f = hud?.querySelector('#fbFlee'); if (f) f.hidden = true; setTimeout(() => report(st.outcome), 3600) } hudSync(); handSync(); if (st.outcome === 'lose') { banner('DEFEAT…', 'win'); sfx('lose') } else if (!CINE) toast('VICTORY!') }
  function flash(msg) { texts.push({ u: FB.hero(st).vu, v: FB.hero(st).vv, txt: msg, col: '#f6d79b', t0: now(), small: true }) }
  function floatText(unit, txt, col, small, big) { texts.push({ u: unit.vu, v: unit.vv, txt, col, t0: now(), small, big, dx: (Math.random() - .5) * 18 }) }
  function walkAnim(unit, path, speed = 4.2, slide = false) { return new Promise(res => { anims.push({ unit, pts: path.slice(1), i: 0, res, speed, slide }) }) }

  function click(wp) {
    if (!st || busy || st.outcome || st.turn !== 'hero' || discardMode) return;
    const g = inv(wp.x, wp.y), to = { u: Math.floor(g.u), v: Math.floor(g.v) }, m = FB.monster(st);
    if (to.u === m.u && to.v === m.v) { flash('เลือกไพ่ต่อสู้เพื่อโจมตี'); return }
    heroMove(to);
  }

  /* ---------- effects (old BattleVFX images; code fallback = a ring) ---------- */
  function fx(kind, to, from, o = {}) {
    const dur = kind === 'heal' || kind === 'shield' ? 900 : 650;
    effects.push({ kind, seed: (Math.random() * 1e6) | 0, scale: o.scale || 1, color: o.color, to: { x: to.vu, y: to.vv }, from: from && from !== to ? { x: from.vu, y: from.vv } : null, start: now(), duration: dur });
    return dur;
  }
  function fxDraw(g, now) {
    effects = effects.filter(e => now < e.start + e.duration);
    for (const e of effects) {
      const t = Math.min(1, (now - e.start) / e.duration), p = project(e.to.x, e.to.y), a = e.from ? project(e.from.x, e.from.y) : p;
      g.save(); let ok = false; try { ok = window.BattleVFX?.draw(e, t, p, a, g, { w: UNIT, h: UNIT / 2 }) } catch (err) { ok = false }
      if (!ok) { g.globalAlpha = 1 - t; g.strokeStyle = e.color || '#ffd27a'; g.lineWidth = 4; g.beginPath(); g.ellipse(p.x, p.y - UNIT * .6, UNIT * (.3 + t * .6), UNIT * (.18 + t * .35), 0, 0, 7); g.stroke() }
      g.restore();
    }
  }

  /* ---------- drawing ---------- */
  function poly(g, u, v) { const a = project(u, v), b = project(u + 1, v), c = project(u + 1, v + 1), d = project(u, v + 1); g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.lineTo(c.x, c.y); g.lineTo(d.x, d.y); g.closePath() }
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
  function shadow(g, p, r) { g.fillStyle = '#0006'; g.beginPath(); g.ellipse(p.x, p.y, r, r * .45, 0, 0, 7); g.fill() }
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
  function drawHero(g, u, t) {
    const A = sprites(), p = project(u.vu, u.vv), f = heroFrame(u, t); if (!A || !f) return;
    const size = UNIT * 1.6, left = p.x - size * A.anchor[0], top = p.y - size * A.anchor[1], i = im(f.src);
    let ox = 0; if (u.pose === 'hit') ox = Math.sin(t * .07) * 3;
    const pm = poseMotion(u, t);
    shadow(g, p, UNIT * .26); g.save(); g.translate(ox, -(u.lift || 0)); if (u.hp <= 0) g.globalAlpha *= .6;
    g.translate(p.x + pm.dx, p.y + pm.dy); g.rotate(pm.rot); g.scale(pm.sx, pm.sy); g.translate(-p.x, -p.y);
    const sword = () => { if (u.weapon && A.equipment[u.weapon]) weapon(g, A.equipment[u.weapon], f.right, left, top, size, (f.rotation || 0) + pm.wpn) };
    if (f.rightBehind) sword();
    const body = () => { if (f.flipImage) { g.save(); g.translate(left + size / 2, 0); g.scale(-1, 1); g.drawImage(i, -size / 2, top, size, size); g.restore() } else g.drawImage(i, left, top, size, size) };
    if (i) { body(); if ((u.flashUntil || 0) > t) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .85; body(); body(); g.restore() } }
    if (!f.rightBehind) sword();
    g.restore();
    bar(g, p, top + size * .12, u.shown / u.maxHp, '#6fd18a');
  }
  /* monster: old MonsterArt clips (idle/walk/windup/strike/hit/down, SE/NE + mirror); static picture until the clip loads */
  function drawMonster(g, u, t) {
    const p = project(u.vu, u.vv), v = { walking: u.walking, hitUntil: u.hitUntil || 0, guardUntil: 0, pose: u.pose };
    const af = window.MonsterArt?.frame(MK, u.dir, v, u.hp, t, 'fb-' + MK);
    shadow(g, p, UNIT * .26 * MT.scale);
    if (af) {
      const h = UNIT * 1.6 * Math.max(.8, MT.scale) * (af.renderHeight || 1), w = h * af.sw / af.sh, pv = af.pivot || [.5, .95];
      g.save(); g.translate(p.x, p.y); if (af.flip) g.scale(-1, 1); if (u.hp <= 0) g.globalAlpha *= .55;
      g.drawImage(af.image, af.sx, af.sy, af.sw, af.sh, -w * pv[0], -h * pv[1], w, h);
      if ((u.flashUntil || 0) > t) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = .85; for (let k = 0; k < 2; k++) g.drawImage(af.image, af.sx, af.sy, af.sw, af.sh, -w * pv[0], -h * pv[1], w, h) }
      g.restore();
      bar(g, p, p.y - h * (af.barHeight || .85), u.shown / u.maxHp, '#e2705f'); return;
    }
    const back = ['NE', 'NW'].includes(u.dir), i = im('assets/enemies/' + MT.img + (back ? '-back' : '') + '.webp') || im('assets/enemies/' + MT.img + '.webp'); if (!i) return;
    const h = UNIT * 1.6 * MT.scale * .8, w = h * i.naturalWidth / i.naturalHeight;
    g.save(); g.translate(p.x + ((u.hitUntil || 0) > t ? Math.sin(t * .08) * 4 : 0), p.y); if (['SE', 'NE'].includes(u.dir)) g.scale(-1, 1); if (u.hp <= 0) { g.rotate(Math.PI * .4); g.globalAlpha = .5 }
    g.drawImage(i, -w / 2, -h, w, h); g.restore(); bar(g, p, p.y - h, u.shown / u.maxHp, '#e2705f');
  }
  function draw(g, t0) {
    if (!ready || typeof locations === 'undefined' || !locations.length) return;
    const t = now();
    if (!st) { build(); hudMake(); handMake(); cam.set = false; focusCamera(true); arenaReady(); if (Q.get('warm') !== '1') startTurnShow(true) }
    step(t);
    g.save();
    for (const [key, k] of cells) {
      const [u, v] = key.split(',').map(Number); poly(g, u, v);
      if (COL[k]) { g.fillStyle = COL[k]; g.fill() }
      g.lineWidth = 1; g.strokeStyle = k === 'blocked' ? 'rgba(255,120,120,.35)' : 'rgba(255,255,255,.22)'; g.stroke();
    }
    if (reachMap && !busy) for (const e of reachMap.values()) { if (e.cost === 0) continue; poly(g, e.u, e.v); g.fillStyle = 'rgba(70,150,255,.34)'; g.fill(); g.strokeStyle = 'rgba(150,200,255,.8)'; g.lineWidth = 1.5; g.stroke() }
    const m = FB.monster(st), h = FB.hero(st);
    /* hovering a combat card: its reach around the hero in red */
    if (rangeShow && !busy) for (const [key, k] of cells) { if (k === 'blocked') continue; const [u, v] = key.split(',').map(Number), d = Math.abs(u - h.u) + Math.abs(v - h.v); if (d < 1 || d > rangeShow) continue; poly(g, u, v); g.fillStyle = 'rgba(255,80,60,.26)'; g.fill(); g.strokeStyle = 'rgba(255,150,130,.7)'; g.lineWidth = 1.2; g.stroke() }
    if (!busy && st.turn === 'hero' && !st.outcome && st.deck.combat.hand.some((c, i) => !FB.combatBlock(st, i) && !FB.cardRule(c.id)?.self)) { poly(g, m.u, m.v); g.strokeStyle = '#ff5a4a'; g.lineWidth = 3; g.stroke() }
    poly(g, h.u, h.v); g.strokeStyle = '#6fd18a'; g.lineWidth = 2; g.stroke();
    g.restore();
    if (CINE) spotlight(g, [h, m]);
    glowDraw(g, t);
    /* a host page (battle-field.html) can hand in standing props so trees/rocks and units overlap by depth */
    const extras = window.TownBattleExtras?.() || [], order = [...[h, m].map(u => ({ unit: u, y: project(u.vu, u.vv).y })), ...extras].sort((a, b) => a.y - b.y);
    for (const it of order) {
      if (!it.unit) { it.draw(g, t); continue }
      const u = it.unit, o = kbOff(u, t); g.save(); g.translate(o.x, o.y);
      if (u.deadAt && t > u.deadAt) { const e = (t - u.deadAt) / 1400; g.globalAlpha = Math.max(0, 1 - e); if (e < 1 && Math.random() < .5) { const p = project(u.vu, u.vv); parts.push({ x: p.x + (Math.random() - .5) * UNIT * .8, y: p.y - Math.random() * UNIT * 1.3, vx: (Math.random() - .5) * 30, vy: -60 - Math.random() * 60, t0: t, life: 700, col: '255,220,180', spark: false, size: 2 + Math.random() * 2, float: true }) } }
      u === h ? drawHero(g, u, t) : drawMonster(g, u, t); g.restore();
    }
    fxDraw(g, t); partDraw(g, t);
    if (CINE) { speedDraw(g, t); atmosphere(g, t0); flashDraw(g) }
    texts = texts.filter(x => t - x.t0 < 1300);
    for (const x of texts) {
      const p = project(x.u, x.v), e = (t - x.t0), a = e / 1300, pop = x.small ? 1 : e < 140 ? 1 + .9 * (1 - e / 140) : 1 + .08 * Math.max(0, 1 - (e - 140) / 200);
      const base = x.small ? 14 : x.big ? 30 : 23, y = p.y - UNIT * 1.6 - (x.small ? 18 : 0) - Math.min(1, e / 260) * 26 - a * 18;
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
      gr.addColorStop(0, `rgba(${x.col},${.55 * a})`); gr.addColorStop(1, `rgba(${x.col},0)`); g.fillStyle = gr; g.beginPath(); g.ellipse(p.x, p.y - UNIT * .2, r, r * .55, 0, 0, 7); g.fill(); g.restore();
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
  window.TownBattle = { pre, active: () => ON, click, draw, state: () => st, cells: () => cells, hero: () => st && FB.hero(st), monster: () => st && FB.monster(st),
    act: { move: heroMove, end: endHeroTurn, card: (group, i) => { const b = hand?.querySelector(`.fb-card[data-group="${group}"][data-i="${i}"]`); return b ? cardClick(b) : null }, discard: setDiscard, confirmDiscard: doDiscard }, busy: () => busy };
})();
