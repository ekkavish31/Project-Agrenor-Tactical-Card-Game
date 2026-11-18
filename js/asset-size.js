/* v98.576 · AssetSize — every picture remembers HOW BIG IT IS NEXT TO THE HERO (its own number, not a size preset of its category).

   ratio = width of the picture as placed ÷ the hero reference height on THAT map = BASE × the map's one size multiplier (v98.725: no Lineup factor; sub-map multiplier includes its grid ratio)
   So a house that is 7 heroes wide is 7 heroes wide on the village, in the market and in a sub-map, whatever that map's own hero size is.

   • the number lives under the key of the picture FILE (assets/…/x.webp) in localStorage 'asset-hero-ratio-v1' → ⬆ Push (js/game-settings.js GAME_SETTINGS) with the maps
   • a picture that has no number yet starts at its own pixel size (the old behaviour) — the first time somebody resizes it in an editor the number is stored
   • resizing a picture in an editor REPLACES its number (the latest size wins)
   • pictures already placed are never changed by this: it only decides the starting size of a NEW one

   AssetSize.key(src)                            → canonical file key ('assets/…') from a path / url
   AssetSize.get(src)                            → ratio | null
   AssetSize.startWidth(src, ctx, fallbackPx)    → width in map px for a new piece (ctx 'village' | 'place' | 'battle'), or fallbackPx when the picture has no number
   AssetSize.record(src, widthPx, ctx)           → store the ratio from a width that was just set (debounced write)
   AssetSize.setHero(ctx, fn)                    → optional override of the formula (not used since v98.725)
   AssetSize.all() · AssetSize.set(src, ratio) · AssetSize.heroPx(ctx) */
(function (root) {
  'use strict';
  const KEY = 'asset-hero-ratio-v1';
  /* v98.725 · ONE formula for every map: reference hero height = BASE px × that map's ONE size multiplier.
     The ⚖ Scale Lineup factor of the hero is NOT in it (a taller / shorter hero must not change the starting size of new pieces); the sub-map multiplier already holds its grid ratio (placeScale).
     REF_K = 0.96 is the lineup hero factor at the time the stored ratios were recorded, frozen so every stored ratio and every new piece keeps exactly the size it had. */
  const REF_K = 0.96, HERO_BASE = () => (root.CharSize?.VILLAGE_HERO_PX || 93.6) * REF_K;
  const heroFns = {
    village: () => HERO_BASE() * (root.MapScale ? MapScale.get('village') : 1),
    place: () => HERO_BASE() * (root.placeScale ? root.placeScale() : (root.MapScale ? MapScale.get('village') : 1) * 90 / 56),
    battle: () => 109 * (root.MapScale ? MapScale.get('battle', root.FIELD?.biome) : 1)
  };
  const read = () => { try { const o = JSON.parse(localStorage.getItem(KEY) || '{}'); return o && typeof o === 'object' ? o : {} } catch (e) { return {} } };
  let cache = null; const data = () => cache || (cache = read());
  addEventListener('storage', e => { if (e.key === KEY) cache = null });
  const key = src => { if (!src) return ''; let s = String(src).split('#')[0].split('?')[0]; try { if (/^https?:/.test(s)) s = new URL(s).pathname.replace(/^\//, '') } catch (e) { } return s.replace(/^\.\//, '').replace(/^\/+/, '') };
  const heroPx = ctx => { try { const h = (heroFns[ctx] || heroFns.village)(); return h > 10 ? h : 93.6 } catch (e) { return 93.6 } };
  const get = src => { const v = data()[key(src)]; return v > 0 ? v : null };
  function startWidth(src, ctx, fallback) { const r = get(src); return r ? Math.round(r * heroPx(ctx)) : fallback }
  let timer = 0, dirty = false;
  function flush() { clearTimeout(timer); timer = 0; if (!dirty) return; dirty = false; try { localStorage.setItem(KEY, JSON.stringify(data())); root.dispatchEvent(new CustomEvent('asset-size-change')) } catch (e) { } }
  function set(src, ratio) { const k = key(src); if (!k || !(ratio > 0.02 && ratio < 80)) return false; const r = +ratio.toFixed(4); if (data()[k] === r) return false; data()[k] = r; dirty = true; clearTimeout(timer); timer = setTimeout(flush, 500); return true }
  function record(src, widthPx, ctx) { const h = heroPx(ctx); if (!(widthPx > 0) || !(h > 0)) return false; return set(src, widthPx / h) }
  addEventListener('pagehide', flush); addEventListener('beforeunload', flush);
  root.AssetSize = { KEY, key, get, startWidth, record, set, flush, all: () => ({ ...data() }), clear(src) { const k = key(src); if (k in data()) { delete data()[k]; dirty = true; flush() } }, heroPx, setHero: (ctx, fn) => { heroFns[ctx] = fn } };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.AssetSize;
})(typeof window !== 'undefined' ? window : globalThis);
