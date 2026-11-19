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
  /* v98.838 · ONE picture = ONE template in every editor: the village map names its decor pictures 'v:decor:<name>', the sub-maps 'decor:<name>' — same picture, so both ids share the same template (a frame / ticks saved in either appear in the other) */
  const norm = a => typeof a === 'string' && a.startsWith('v:decor:') ? a.slice(2) : a;
  let migrated = false;
  /* once: review ticks (🟦 🟥 📐) that were ticked piece by piece in the sub-maps (before the ticks travelled with the picture) → the picture's template, when the template has none yet and that piece follows it */
  function migrateTicks() {
    if (migrated) return; migrated = true;
    try {
      const maps = JSON.parse(localStorage.getItem('place-maps-v1') || '{}'); let ch = false;
      for (const m of Object.values(maps || {})) for (const p of (m && m.props) || []) {
        if (!p || !p.chk || !Object.keys(p.chk).length || !p.art) continue;
        const tp = store[norm(p.art)]; if (!tp || tp.chk || isOwn(p)) continue;
        tp.chk = { ...p.chk }; ch = true
      }
      if (ch) localStorage.setItem(KEY, JSON.stringify(store))
    } catch (e) { }
  }
  const load = () => { if (store) return store; try { store = JSON.parse(localStorage.getItem(KEY) || '{}') || {} } catch (e) { store = {} } migrateTicks(); return store };
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(load())) } catch (e) { } try { root.dispatchEvent(new Event('art-frames')) } catch (e) { } };
  const nominal = art => { if (!PA) PA = Object.fromEntries((root.PLACEABLE_ART?.items || []).map(i => [i.sub, i])); return PA[art]?.sw || (String(art).startsWith('vt:') ? 400 : 110) };
  const wRaw = o => (o.width || nominal(o.art)) * (o.s || 1);
  /* v98.727 · a piece with a template: its width in the SAME units the template was saved in. A page can set a hook (setWidthHook) — the sub-map does, because a loose prop WITHOUT a width is drawn 110 wide while the catalogue says e.g. 35 (lamp); the old numbers were saved that way, so an explicit width w must count as w × catalogue ÷ 110, else a lamp placed later (width 55 / 35) got frames 2–3× too big */
  let widthHook = null;
  const wOf = o => { if (widthHook) { try { const h = widthHook(o); if (h > 0) return h } catch (e) { } } return wRaw(o) };
  const swapCells = a => root.PieceGeometry ? root.PieceGeometry.swapCells(a) : a;
  const auto = o => { const w = nominal(o.art), c = Math.max(.5, Math.min(4, Math.round(w / 90 * .8 * 2) / 2)); return { sw: c, sh: c, ref: w, auto: true } };
  const get = art => load()[norm(art)] || null, has = art => !!load()[norm(art)];
  const isOwn = o => !!o.fo || OWN_HINT.some(k => o[k] != null && o[k] !== false && !(Array.isArray(o[k]) && !o[k].length));
  /* template → the numbers of this piece (size scale · flip) */
  function derive(tpl, o) {
    const k = (tpl.auto ? wRaw(o) : wOf(o)) / (tpl.ref || nominal(o.art)), f = !!o.f, out = {};
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
    /* v98.832 · the 3 review ticks (กรอบฟ้า · กรอบแดง · สัดส่วน) travel with the picture too: the piece's own ticks become the template's; with none of its own, the template keeps the ticks it already had */
    const own = o.chk && Object.keys(o.chk).length ? o.chk : (load()[norm(o.art)] || {}).chk; if (own && Object.keys(own).length) t.chk = { ...own };
    load()[norm(o.art)] = t; persist(); return t;
  }
  /* the ticks a piece shows: its own (a piece that was ticked by hand) · else — when it follows the picture's frame (own = isOwn) — the picture's saved ticks */
  const chkOf = (o, own) => { if (!o) return {}; if (o.chk && Object.keys(o.chk).length) return o.chk; if (own != null ? own : isOwn(o)) return {}; const t = get(o.art); return (t && t.chk) || {} };
  const clear = art => { delete load()[norm(art)]; persist() };
  const strip = o => { for (const k of [...FIELDS, 'fo']) delete o[k]; return o };
  const useTemplate = o => strip(o);
  const materialize = o => { const e = effective(o); for (const k of FIELDS) if (e[k] != null) o[k] = e[k]; return o };
  root.ArtFrames = { setWidthHook: fn => { widthHook = fn }, nominal, KEY, FIELDS, get, has, effective, isOwn, chkOf, saveFrom, clear, useTemplate, materialize, strip, auto, all: () => ({ ...load() }), reload: () => { store = null } };
})(typeof window !== 'undefined' ? window : globalThis);
