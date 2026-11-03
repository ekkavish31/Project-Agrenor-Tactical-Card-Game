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
  root.WalkSpeed = api;
  root.addEventListener && root.addEventListener('storage', e => { if (e.key === KEY) cfg = load() });
})(window);
