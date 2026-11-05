/* v98.139 · ONE character-size multiplier per MAP — for every character on that map at once (hero, allies, villagers, monsters).
   How big characters are compared with EACH OTHER is decided in Scale Lineup (js/character-scale-adjust-data.js) and is not touched here; this is only the scale of the whole cast
   against that map's buildings, ground and grid.
   localStorage 'map-char-scale-v1' (pushed into js/game-settings.js by the editors) = { village: 0.9, world: 1, battle: { forest: 1, … }, place: { market: 1, … } }
   MapScale.get(kind, id): village → the village map · world → the world map · battle → a battle biome (forest grass hills swamp snow sand) · place → a sub-map (market forge home …).
   A missing value = 1, except a sub-map that has no value of its own: it follows the village (so a new sub-map looks like the village). */
(function (root) {
  'use strict';
  const KEY = 'map-char-scale-v1', ok = v => typeof v === 'number' && isFinite(v) && v >= 0.2 && v <= 4;
  let cache = null, stamp = null;
  const read = () => { let s = ''; try { s = root.localStorage.getItem(KEY) || '' } catch (e) { } if (s !== stamp) { stamp = s; try { cache = s ? JSON.parse(s) : {} } catch (e) { cache = {} } } return cache || {} };
  /* the village used to keep its own "ทั้งแผนที่" value in the layout (cast.all): that value is the starting point until a map value is saved */
  const legacyVillage = () => { try { const a = JSON.parse(root.localStorage.getItem('project-a-village-editor-v67') || 'null')?.assets || root.VillageDefaultLayout?.assets || {}; const v = +a.cast?.all; return ok(v) ? v : 1 } catch (e) { return 1 } };
  const api = {
    KEY,
    get(kind, id) {
      const d = read();
      if (kind === 'village') return ok(d.village) ? d.village : legacyVillage();
      if (kind === 'world') return ok(d.world) ? d.world : 1;
      const v = d[kind] && d[kind][id];
      if (ok(v)) return v;
      return kind === 'place' ? api.get('village') : 1;
    },
    has(kind, id) { const d = read(); return kind === 'village' || kind === 'world' ? ok(d[kind]) : !!(d[kind] && ok(d[kind][id])) },
    set(kind, id, v) {
      const d = JSON.parse(JSON.stringify(read()));
      if (kind === 'village' || kind === 'world') { if (ok(v)) d[kind] = +v.toFixed(3); else delete d[kind] }
      else { d[kind] = d[kind] || {}; if (ok(v)) d[kind][id] = +v.toFixed(3); else delete d[kind][id]; if (!Object.keys(d[kind]).length) delete d[kind] }
      try { root.localStorage.setItem(KEY, JSON.stringify(d)) } catch (e) { } stamp = null; try { root.dispatchEvent(new Event('mapscale')) } catch (e) { }
    },
    raw: () => JSON.parse(JSON.stringify(read())),
    reset() { try { root.localStorage.removeItem(KEY) } catch (e) { } stamp = null; try { root.dispatchEvent(new Event('mapscale')) } catch (e) { } }
  };
  root.MapScale = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
