/* v98.297 · SOUND EFFECTS from Kenney's free packs (CC0 — assets/audio/sfx/kenney/LICENSE.txt). The game used procedural beeps; these are real recordings.
   Sfx.play('ui-click')             one random variant of a catalog name (variants are files name-1.mp3 … name-N.mp3, see V below)
   Sfx.battle(kind, strength)       the battle's sound kinds (slash, swing, hammer, block, step …) → returns true when a recording played (else the caller uses its own synth)
   Sfx.walk(dt, moving, surface)    footsteps while a character walks (grass | stone | wood | snow | carpet)
   Auto: every press of a button / link / select / checkbox plays a click (back / confirm / toggle by its text), dialogs open + close, gold changes (coins).
   Opt out: data-nosfx on an element · ?sfx=0 · localStorage project-a-sfx = {"ui":false}.  Volume = the game's effect volume (BattlePolish.volume, 0–1).
   Needs one tap / key first (browsers keep the audio locked until then). Files are converted by tools/build-sfx.py. */
(function (root) {
  'use strict';
  const BASE = 'assets/audio/sfx/kenney/';
  /* name → number of variants */
  const V = { 'ui-click': 3, 'ui-tick': 2, 'ui-back': 2, 'ui-close': 2, 'ui-open': 2, 'ui-toggle': 2, 'ui-select': 3, 'ui-confirm': 3, 'ui-error': 2, 'ui-scroll': 2, 'ui-drop': 2, 'ui-pluck': 2, 'ui-question': 1, 'ui-bong': 1, 'ui-maximize': 2, 'ui-minimize': 2, 'ui-hover': 2, 'ui-mouseclick': 1, 'ui-switch': 2,
    coins: 2, 'door-open': 2, 'door-close': 2, 'book-open': 1, 'book-close': 1, 'book-flip': 2, cloth: 2, latch: 2, creak: 2, pot: 2, leather: 2, chop: 1, knife: 2, 'draw-knife': 2, belt: 2,
    'step-grass': 4, 'step-wood': 4, 'step-stone': 4, 'step-snow': 4, 'step-carpet': 4,
    'hit-metal-light': 3, 'hit-metal': 2, 'hit-metal-heavy': 2, 'hit-punch': 3, 'hit-punch-heavy': 2, 'hit-wood': 2, 'hit-wood-heavy': 2, 'hit-plate': 2, 'hit-plate-heavy': 1, 'hit-soft': 2, 'hit-generic': 2, 'hit-glass': 2, 'hit-bell': 1, 'hit-mining': 2, 'hit-tin': 1,
    'mg-cast': 3, 'mg-magic': 3, 'mg-heal': 3, 'mg-lightning': 3, 'mg-fire': 3, 'mg-earth': 3, 'mg-boom': 2, 'mg-slime': 2, 'mg-shield': 2, 'mg-debuff': 3, 'mg-buff': 3,
    'level-up': 2, 'item-get': 2, notify: 2, defeat: 2, victory: 3, 'quest-done': 2, fanfare: 2 };
  /* loudness per family (the files are normalised to the same level, UI should sit under the game) */
  const GAIN = { ui: .5, step: .42, hit: .8, coins: .55, door: .6, book: .6, mg: .7, level: .7, item: .6, notify: .5, defeat: .7, victory: .75, quest: .7, fanfare: .7 };
  const gainOf = n => GAIN[n.split('-')[0]] ?? .6;
  /* the battle's own sound kinds → catalog names (v98.298: magic / elements / victory / defeat now have recordings too; a kind that is not listed keeps the old synth) */
  const BATTLE = { slash: ['hit-metal', 'hit-metal-light'], swing: ['draw-knife', 'knife'], knife: ['knife'], spear: ['hit-metal-light'], rapier: ['hit-metal-light'], sword: ['hit-metal'], hammer: ['hit-wood-heavy', 'hit-plate-heavy'], blunt: ['hit-wood-heavy'], axe: ['hit-wood-heavy', 'chop'], unarmed: ['hit-punch'], bow: ['hit-generic'], block: ['hit-plate'], critical: ['hit-metal-heavy', 'hit-punch-heavy'], miss: ['cloth'], down: ['hit-soft'], step: ['step-stone'],
    cast: ['mg-cast'], magic: ['mg-magic'], fusion: ['mg-magic'], staff: ['mg-cast'], tome: ['book-flip'], heal: ['mg-heal'], lightning: ['mg-lightning'], fire: ['mg-fire'], earth: ['mg-earth'], ice: ['hit-glass', 'mg-shield'], shield: ['mg-shield'], buff: ['mg-buff'], debuff: ['mg-debuff'], boom: ['mg-boom'], slime: ['mg-slime'], victory: ['victory'], lose: ['defeat'] };
  const Q = new URLSearchParams(location.search);
  let ac = null, off = Q.get('sfx') === '0' || Q.get('edit') === '1';
  const cfg = (() => { try { return JSON.parse(localStorage.getItem('project-a-sfx') || '{}') } catch (e) { return {} } })();
  const buf = {}, pend = {};
  const vol = () => { const v = root.BattlePolish?.volume; if (Number.isFinite(v)) return v; try { const p = JSON.parse(localStorage.getItem('project-a-battle-polish') || '{}'); if (Number.isFinite(p.volume)) return p.volume } catch (e) { } return .65 };
  function ctx() { if (!ac) { const A = root.AudioContext || root.webkitAudioContext; if (!A) return null; try { ac = new A() } catch (e) { return null } } if (ac.state === 'suspended') ac.resume().catch(() => { }); return ac }
  const file = (n, i) => BASE + n + (V[n] > 1 ? '-' + i : '') + '.mp3';
  function load(n, i) {
    const f = file(n, i); if (buf[f]) return Promise.resolve(buf[f]); if (pend[f]) return pend[f];
    return pend[f] = fetch(f).then(r => r.ok ? r.arrayBuffer() : Promise.reject()).then(b => new Promise((ok, no) => { const a = ctx(); if (!a) return no(); a.decodeAudioData(b, ok, no) })).then(b => (buf[f] = b)).catch(() => { delete pend[f]; return null });
  }
  const ready = (n, i) => !!buf[file(n, i)];
  /* play one variant · o = { vol (0–1 on top of the family gain), rate (pitch) } · returns true if it started now */
  function play(n, o = {}) {
    if (off || !V[n]) return false; const v = vol(); if (!v) return false; const a = ctx(); if (!a || a.state !== 'running') return false;
    const i = 1 + Math.floor(Math.random() * V[n]), b = buf[file(n, i)];
    if (!b) { load(n, i); return false }          /* first time: it loads for the NEXT press */
    const s = a.createBufferSource(), g = a.createGain(); s.buffer = b; s.playbackRate.value = (o.rate || 1) * (.96 + Math.random() * .08); g.gain.value = Math.min(1, v * gainOf(n) * (o.vol ?? 1)); s.connect(g); g.connect(a.destination); s.start(); return true;
  }
  /* the battle's own kinds: true = a recording played */
  function battle(kind, strength = .6) { const L = BATTLE[kind]; if (!L || off) return false; return play(L[Math.floor(Math.random() * L.length)], { vol: .55 + strength * .6 }) }
  let stepT = 0, stepI = 0;
  function walk(dt, moving, surface = 'grass', every = .36) { if (!moving) { stepT = every * .6; return } stepT += dt; if (stepT >= every) { stepT = 0; stepI++; play('step-' + surface, { vol: .8 + (stepI % 2) * .1 }) } }
  function preload(list) { for (const n of list) if (V[n]) for (let i = 1; i <= V[n]; i++) load(n, i) }
  const api = root.Sfx = { V, play, battle, walk, preload, has: n => !!V[n], ready, set(p) { Object.assign(cfg, p); try { localStorage.setItem('project-a-sfx', JSON.stringify(cfg)) } catch (e) { } }, off: v => { off = !!v } };

  /* ---- automatic UI sounds ---- */
  const HIT = 'button,[role=button],a[href],summary,select,input[type=checkbox],input[type=radio],.btn,label.chk,[data-a],[data-act]';
  const BACK = /^\s*(✕|✖|×|x\b|ปิด|ออก|ยกเลิก|กลับ|←|ย้อน|back|close|cancel)/i, OK = /^\s*(✓|✔|เสร็จ|ตกลง|ยืนยัน|บันทึก|ซื้อ|ขาย|ใช้|รับ|เริ่ม|เล่น|ok\b|confirm|save|buy)/i;
  let last = 0;
  function onPress(e) {
    if (cfg.ui === false || off) return; const t = e.target.closest?.(HIT); if (!t || t.closest('[data-nosfx]') || t.disabled || t.getAttribute('aria-disabled') === 'true') return;
    const now = performance.now(); if (now - last < 60) return; last = now;
    ctx(); const txt = ((t.textContent || '') + ' ' + (t.getAttribute('aria-label') || '') + ' ' + (t.title || '')).trim();
    let n = 'ui-click';
    if (t.matches('input[type=checkbox],input[type=radio]') || t.matches('label.chk')) n = 'ui-toggle';
    else if (t.matches('select')) n = 'ui-tick';
    else if (BACK.test(txt) || t.matches('[data-x],.x,.close')) n = 'ui-back';
    else if (OK.test(txt)) n = 'ui-confirm';
    else if (t.closest('.hand,.card,[data-card],#hand')) n = 'ui-select';
    play(n);
  }
  document.addEventListener('pointerdown', onPress, true);
  document.addEventListener('pointerdown', function first() { document.removeEventListener('pointerdown', first, true); ctx(); preload(['ui-click', 'ui-back', 'ui-confirm', 'ui-toggle', 'ui-tick', 'ui-select', 'ui-open', 'ui-close', 'coins', 'step-grass', 'step-stone']) }, true);
  /* dialogs (<dialog>.showModal / .close) */
  try {
    const P = root.HTMLDialogElement?.prototype;
    if (P && !P.__sfx) { P.__sfx = 1; const sm = P.showModal, cl = P.close;
      P.showModal = function () { if (!this.hasAttribute('data-nosfx')) play('ui-open'); return sm.apply(this, arguments) };
      P.close = function () { if (this.open && !this.hasAttribute('data-nosfx')) play('ui-close'); return cl.apply(this, arguments) } }
  } catch (e) { }
})(typeof window !== 'undefined' ? window : globalThis);
