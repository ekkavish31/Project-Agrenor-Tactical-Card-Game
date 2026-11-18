/* v98.736 · LIGHT POINTS THAT TRAVEL WITH THE PICTURE (ART LIGHTS). A picture can carry one or more light points — a street lamp's flame, a lantern hanging on a stall. Wherever that picture is placed
   (village, sub-maps) the point lights the scene when the clock says evening / night (js/day-light.js, the same soft pools as the village street lamps).
   ArtLights.get(art) → [{ x, y, r, k }]   x, y = place on the picture (0..1 of its width / height, as drawn, before any flip) · r = radius in HERO heights (the map's reference hero, so it keeps its size next to people) · k = brightness 0.2..2
   A picture with no saved list uses the built-in default (the street lamp post has its flame light); an explicit EMPTY list = "no light" (so a default can be switched off).
   Stored in localStorage 'art-lights-v1' = { artId: [points] } → ⬆ Push with the maps.  API: get · has · set · clear · all · DEFAULTS */
(function (root) {
  'use strict';
  const KEY = 'art-lights-v1';
  const DEFAULTS = { 'decor:lamp-post': [{ x: .5, y: .22, r: 1.9, k: 1 }] };
  let store = null;
  const load = () => { if (store) return store; try { store = JSON.parse(localStorage.getItem(KEY) || '{}') || {} } catch (e) { store = {} } return store };
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(load())) } catch (e) { } try { root.dispatchEvent(new Event('art-lights')) } catch (e) { } };
  const clean = p => ({ x: Math.max(0, Math.min(1, +(+p.x).toFixed(4))), y: Math.max(0, Math.min(1, +(+p.y).toFixed(4))), r: Math.max(.2, Math.min(8, +(+p.r || 1.5).toFixed(2))), k: Math.max(.2, Math.min(2, +(+(p.k ?? 1)).toFixed(2))) });
  const own = art => Array.isArray(load()[art]) ? load()[art] : null;
  const get = art => art ? (own(art) || DEFAULTS[art] || []) : [];
  const has = art => !!(art && (own(art) ? own(art).length : DEFAULTS[art]));
  function set(art, list) { if (!art) return; load()[art] = (list || []).map(clean); persist() }
  const clear = art => { if (art && load()[art]) { delete load()[art]; persist() } };   /* back to the built-in default */
  root.ArtLights = { KEY, DEFAULTS, get, has, set, clear, isOwn: art => !!own(art), all: () => ({ ...load() }), reload: () => { store = null } };
  addEventListener('storage', e => { if (e.key === KEY) store = null });
})(typeof window !== 'undefined' ? window : globalThis);
