/* v98.99 · walking speed of the hero and the villagers, edited in metres / second (map editor → "🚶 ความเร็วเดิน").
   The village moves things in ground cells (u,v); 1 cell ≈ 0.57 m (the village ruler of scale-lineup.html), so  m/s = cells/s × 0.57.
   Stored in localStorage 'walk-speed-v1' = {hero:{road,grass}, npcBase: m/s for EVERYONE (unset = each villager's own built-in speed), npcMul:{id: multiplier of that base}}; a missing value = the game's built-in speed. Pushed with the village editor. */
(function (root) {
  'use strict';
  const KEY = 'walk-speed-v1', M = 0.57, HERO = { road: 8.8, grass: 7.4 };   // built-in hero speed in cells/s (on road / paint path, and on grass)
  const load = () => { try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); return o && typeof o === 'object' ? o : {} } catch (e) { return {} } };
  let cfg = load();
  const ok = v => typeof v === 'number' && isFinite(v) && v > 0 && v < 60;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cfg)) } catch (e) { } root.dispatchEvent && root.dispatchEvent(new Event('walkspeed')) };
  const api = {
    KEY, M, HERO,
    /* cells per second used by the game */
    heroCells: onRoad => { const v = cfg.hero && cfg.hero[onRoad ? 'road' : 'grass']; return ok(v) ? v / M : HERO[onRoad ? 'road' : 'grass'] },
    npcCells: n => { const base = ok(cfg.npcBase) ? cfg.npcBase / M : n.speed, k = cfg.npcMul && cfg.npcMul[n.id]; return base * (ok(k) ? k : 1) },
    /* metres per second shown in the editor */
    heroMs: onRoad => api.heroCells(onRoad) * M,
    npcMs: n => api.npcCells(n) * M,
    setHero: (onRoad, ms) => { cfg.hero = cfg.hero || {}; if (ok(ms)) cfg.hero[onRoad ? 'road' : 'grass'] = +ms.toFixed(2); else delete cfg.hero[onRoad ? 'road' : 'grass']; save() },
    /* everyone: a distance per second (m/s) · one villager: a multiplier of that */
    setNpcBase: ms => { if (ok(ms)) cfg.npcBase = +ms.toFixed(2); else delete cfg.npcBase; save() },
    npcBase: () => ok(cfg.npcBase) ? cfg.npcBase : null,
    setNpcMul: (id, k) => { cfg.npcMul = cfg.npcMul || {}; if (ok(k) && Math.abs(k - 1) > 1e-9) cfg.npcMul[id] = +k.toFixed(2); else delete cfg.npcMul[id]; save() },
    npcMul: id => { const k = cfg.npcMul && cfg.npcMul[id]; return ok(k) ? k : 1 },
    reset: () => { cfg = {}; try { localStorage.removeItem(KEY) } catch (e) { } root.dispatchEvent && root.dispatchEvent(new Event('walkspeed')) },
    reload: () => { cfg = load() },
    raw: () => JSON.parse(JSON.stringify(cfg))
  };
  /* ---- walking direction → which walk animation (4 diagonal sets exist: NE SE SW NW) ----
     The heading is read in the village's own 8 directions (angle of (du−dv , du+dv): E 0° · SE 45° · S 90° · SW 135° · W 180° · NW 225° · N 270° · NE 315°).
     A straight heading (N S E W) takes the zone ±card° around its axis (card 22.5 = eight equal sectors, 0 = four quadrants), the rest is the diagonal in between.
     map: which animation each of the 8 headings uses (default: N→NE · S→SE · W→SW · E→SE). hys: degrees the old heading is kept past its edge, so the picture does not flicker on a boundary. */
  const ANG = { E: 0, SE: 45, S: 90, SW: 135, W: 180, NW: 225, N: 270, NE: 315 }, ORDER = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
  const DEF_DIR = { map: { N: 'NE', S: 'SE', W: 'SW', E: 'SE', NE: 'NE', SE: 'SE', SW: 'SW', NW: 'NW' }, card: 22.5, hys: 6 };
  const dcfg = () => { const d = cfg.dir || {}; return { map: { ...DEF_DIR.map, ...(d.map || {}) }, card: typeof d.card === 'number' ? Math.max(0, Math.min(45, d.card)) : DEF_DIR.card, hys: typeof d.hys === 'number' ? Math.max(0, Math.min(20, d.hys)) : DEF_DIR.hys } };
  const diff = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d };
  const centre = k => ANG[k], half = (k, card) => k.length === 1 ? card : 45 - card;
  function raw8(du, dv, prev) {
    const c = dcfg(), a = ((Math.atan2((du + dv) * 28, (du - dv) * 28) * 180 / Math.PI) % 360 + 360) % 360;
    if (prev && ANG[prev] != null && diff(a, centre(prev)) <= half(prev, c.card) + c.hys) return prev;
    let best = ORDER[0], bd = 1e9;
    for (const k of ORDER.filter(k => k.length === 1)) { const d = diff(a, centre(k)); if (d <= c.card && d < bd) { best = k; bd = d } }
    if (bd === 1e9) for (const k of ORDER.filter(k => k.length === 2)) { const d = diff(a, centre(k)); if (d < bd) { best = k; bd = d } }
    return best;
  }
  const animOf = r => dcfg().map[r] || 'SE';
  api.dir = {
    DEF: DEF_DIR, ORDER, ANG, config: dcfg, raw8, anim: animOf,
    /* hero / villager: remembers the raw heading on the object (o.raw8) and returns the animation direction */
    face: (o, du, dv) => { o.raw8 = raw8(du, dv, o.raw8); return animOf(o.raw8) },
    set: (patch) => { cfg.dir = { ...(cfg.dir || {}), ...patch }; if (patch.map) cfg.dir.map = { ...(cfg.dir.map || {}), ...patch.map }; save() },
    reset: () => { delete cfg.dir; save() }
  };
  root.WalkSpeed = api;
  root.addEventListener && root.addEventListener('storage', e => { if (e.key === KEY) cfg = load() });
})(window);
