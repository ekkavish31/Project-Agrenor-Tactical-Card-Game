/* v98.563 · FRAMES THAT TRAVEL WITH THE PICTURE (ART FRAMES). The order frame (กรอบฟ้า · who is in front of / behind a piece) and the block frame (กรอบแดง · collision) belong to a PICTURE, not to one spot on one map.
   Three layers — the first that applies wins:
     1. a piece with its OWN frame (o.fo, or old explicit sw/sh/orderU/orderV/zo/cmp fields) keeps exactly that ("แก้เฉพาะชิ้นนี้")
     2. the picture's saved template  ArtFrames.get(artId) (localStorage 'place-art-frames-v1' → ⬆ Push with the maps) — edited in 🔍 แก้ละเอียด → "บันทึกลงภาพนี้ (ทุกแมพ)"
     3. an automatic frame from the picture's width on the ground (a square of c cells is ≈ 90·c px wide, min 0.5)
   A template is stored at scale 1 · not flipped, with the width it was saved at (ref); a piece scales it by its own width × size, and swaps u/v when it is flipped. Masks (zo / zb) are used as drawn.
   API: ArtFrames.{effective(o), isOwn(o), get(art), has(art), saveFrom(o), clear(art), useTemplate(o), materialize(o), FIELDS, all()} */
(function (root) {
  'use strict';
  const KEY = 'place-art-frames-v1', FIELDS = ['sw', 'sh', 'orderU', 'orderV', 'zo', 'zb', 'fw', 'fh', 'block', 'blockU', 'blockV'];
  const OWN_HINT = ['sw', 'sh', 'orderU', 'orderV', 'zo', 'cmp'];
  let store = null, PA = null;
  const load = () => { if (store) return store; try { store = JSON.parse(localStorage.getItem(KEY) || '{}') || {} } catch (e) { store = {} } return store };
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(load())) } catch (e) { } try { root.dispatchEvent(new Event('art-frames')) } catch (e) { } };
  const nominal = art => { if (!PA) PA = Object.fromEntries((root.PLACEABLE_ART?.items || []).map(i => [i.sub, i])); return PA[art]?.sw || (String(art).startsWith('vt:') ? 400 : 110) };
  const wOf = o => (o.width || nominal(o.art)) * (o.s || 1);
  const swapCells = a => root.PieceGeometry ? root.PieceGeometry.swapCells(a) : a;
  const auto = o => { const w = nominal(o.art), c = Math.max(.5, Math.min(4, Math.round(w / 90 * .8 * 2) / 2)); return { sw: c, sh: c, ref: w, auto: true } };
  const get = art => load()[art] || null, has = art => !!load()[art];
  const isOwn = o => !!o.fo || OWN_HINT.some(k => o[k] != null && o[k] !== false && !(Array.isArray(o[k]) && !o[k].length));
  /* template → the numbers of this piece (size scale · flip) */
  function derive(tpl, o) {
    const k = wOf(o) / (tpl.ref || nominal(o.art)), f = !!o.f, out = {};
    const num = (a, b) => { if (tpl[a] != null) out[f ? b : a] = +(tpl[a] * k).toFixed(3) };
    num('sw', 'sh'); num('sh', 'sw'); num('fw', 'fh'); num('fh', 'fw'); num('orderU', 'orderV'); num('orderV', 'orderU'); num('blockU', 'blockV'); num('blockV', 'blockU');
    if (tpl.zo) out.zo = f ? swapCells(tpl.zo) : tpl.zo; if (tpl.zb) out.zb = f ? swapCells(tpl.zb) : tpl.zb; if (tpl.block) out.block = true;
    return out;
  }
  const effective = o => { if (!o || isOwn(o)) return o; const t = get(o.art) || auto(o); return { ...o, ...derive(t, o) } };
  function saveFrom(o) {   // the piece's CURRENT frame (own or inherited) becomes the picture's template
    const e = effective(o), k = Math.round(wOf(o) * 100) / 100, f = !!o.f, t = { ref: k }, un = (a, b) => { if (e[a] != null) t[f ? b : a] = +e[a].toFixed(3) };
    un('sw', 'sh'); un('sh', 'sw'); un('fw', 'fh'); un('fh', 'fw'); un('orderU', 'orderV'); un('orderV', 'orderU'); un('blockU', 'blockV'); un('blockV', 'blockU');
    if (e.zo) t.zo = f ? swapCells(e.zo) : e.zo; if (e.zb) t.zb = f ? swapCells(e.zb) : e.zb; if (e.block) t.block = true;
    for (const x of Object.keys(t)) if (t[x] == null) delete t[x];
    load()[o.art] = t; persist(); return t;
  }
  const clear = art => { delete load()[art]; persist() };
  const strip = o => { for (const k of [...FIELDS, 'fo']) delete o[k]; return o };
  const useTemplate = o => strip(o);
  const materialize = o => { const e = effective(o); for (const k of FIELDS) if (e[k] != null) o[k] = e[k]; return o };
  root.ArtFrames = { KEY, FIELDS, get, has, effective, isOwn, saveFrom, clear, useTemplate, materialize, strip, auto, all: () => ({ ...load() }), reload: () => { store = null } };
})(typeof window !== 'undefined' ? window : globalThis);
