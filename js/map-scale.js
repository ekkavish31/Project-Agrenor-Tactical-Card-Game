/* v98.139 · ONE character-size multiplier per MAP — for every character on that map at once (hero, allies, villagers, monsters).
   How big characters are compared with EACH OTHER is decided in Scale Lineup (js/character-scale-adjust-data.js) and is not touched here; this is only the scale of the whole cast
   against that map's buildings, ground and grid.
   v98.372 · FOUR groups, no per-map values any more: village (town + village) · world · battle (every battlefield) · inside (every place interior: sub-maps AND rooms).
   localStorage 'map-char-scale-v1' (pushed into js/game-settings.js by the editors) = { village: 0.9, world: 1, battle: 1, inside: 1 }
   MapScale.get(kind, id): the id is ignored for battle / place / interior (kept so old callers still work). Old per-biome / per-place values still apply until the group value is set, then they are dropped.
   A missing value = 1, except a sub-map ('place') with no value: it follows the village (so a new sub-map looks like the village). */
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
      if (kind === 'battle') { if (ok(d.battle)) return d.battle; const o = d.battle && typeof d.battle === 'object' ? d.battle : null; return o ? (ok(o[id]) ? o[id] : ok(o.grass) ? o.grass : 1) : 1 }
      if (kind === 'inside' || kind === 'place' || kind === 'interior') {
        if (ok(d.inside)) return d.inside;
        const o = d[kind] && typeof d[kind] === 'object' ? d[kind][id] : null;   /* old per-place / per-room value */
        if (ok(o)) return o;
        return kind === 'interior' || kind === 'inside' ? 1 : api.get('village');
      }
      return 1;
    },
    has(kind, id) { const d = read(); if (kind === 'village' || kind === 'world') return ok(d[kind]); if (kind === 'battle') return ok(d.battle); return ok(d.inside) },
    set(kind, id, v) {
      const d = JSON.parse(JSON.stringify(read()));
      if (kind === 'village' || kind === 'world') { if (ok(v)) d[kind] = +v.toFixed(3); else delete d[kind] }
      else if (kind === 'battle') { if (ok(v)) d.battle = +v.toFixed(3); else delete d.battle }
      else { if (ok(v)) d.inside = +v.toFixed(3); else delete d.inside; delete d.place; delete d.interior }   /* place / interior / inside = ONE group value (old per-place values are dropped) */
      try { root.localStorage.setItem(KEY, JSON.stringify(d)) } catch (e) { } stamp = null; try { root.dispatchEvent(new Event('mapscale')) } catch (e) { }
    },
    raw: () => JSON.parse(JSON.stringify(read())),
    reset() { try { root.localStorage.removeItem(KEY) } catch (e) { } stamp = null; try { root.dispatchEvent(new Event('mapscale')) } catch (e) { } }
  };
  root.MapScale = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
