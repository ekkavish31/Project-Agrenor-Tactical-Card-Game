/* v98.277 · BG Asset core for battle-field.html — shared by the game (play ?bg=<id>) and the editor (js/field-edit.js).
   A BG Asset (data/battlefields/<id>.json) describes ONE battle field on top of the seeded generator:
     { format:'bg-asset', v:1, id, name, biome, r, seed, poi, night, tags:{kind,difficulty,useInGame}, gen:'<fingerprint of the generated field before edits>',
       ops:[prop-move | prop-add | prop-del …], spawns:{ally:[{u,v,dir}], enemy:[{u,v,dir}]}, thumb, savedAt }
   biome + seed + r + poi + night rebuild the SAME base field (deterministic); ops change its props; spawns place the fighters (i-th ally / i-th enemy).
   `gen` lets the loader notice when the generator itself changed since the asset was saved (the asset would then look different).
   Where an asset comes from: this browser's drafts (localStorage 'bgAsset:<id>') first, then data/battlefields/<id>.json. See docs/BG-EDITOR-CONCEPT-TH.md. */
(function (root) {
  'use strict';
  const key = (u, v) => u + ',' + v, cells = () => FIELD.cells, FH = () => root.FieldHeight, Rr = () => FIELD.R;
  const stateOf = () => root.TownBattle?.state?.() || null;
  const idx = (u, v) => { const F = FH(); return (v + F.R) * F.n + u + F.R };
  const special = (u, v) => { const F = FH(); if (!F) return false; const i = idx(u, v), M = F.map; return !!(M.water?.[i] || M.stair?.[i] || M.ramp?.[i] || M.mat?.[i]) };
  const levelAt = (u, v) => FH() ? FH().sub(u, v) : 0;
  const unitAt = (u, v, but) => (stateOf()?.units || []).find(x => x.hp > 0 && x !== but && x.u === u && x.v === v);

  /* ---------- props ---------- */
  function propAt(u, v) {
    const c = cells().get(key(u, v)); if (!c) return null;
    if (c.big) { for (const x of cells().values()) if (x.big && x.big.id === c.big.id && x.big.anchor) return { kind: x.big.kind, big: true, u: x.u, v: x.v, seed: x.seed, id: x.big.id }; return null }
    return c.prop && c.k === 'blocked' ? { kind: c.prop, big: false, u: c.u, v: c.v, seed: c.seed } : null;
  }
  const footprint = p => p.big ? [[p.u, p.v], [p.u + 1, p.v], [p.u, p.v + 1], [p.u + 1, p.v + 1]] : [[p.u, p.v]];
  let nextBig = 9000;
  function putProp(p) {
    const cs = footprint(p).map(([u, v]) => cells().get(key(u, v))); if (cs.some(c => !c)) return false;
    if (p.big) { const id = ++nextBig; cs.forEach((c, i) => { c.k = 'blocked'; c.big = { id, anchor: i === 0, kind: p.kind }; c.prop = i === 0 ? p.kind : null; c.seed = p.seed }) }
    else { cs[0].k = 'blocked'; cs[0].prop = p.kind; cs[0].seed = p.seed }
    const F = FH(); if (F?.map?.blocked) cs.forEach(c => { F.map.blocked[idx(c.u, c.v)] = 1 });
    return true;
  }
  function clearProp(p) {
    for (const [u, v] of footprint(p)) { const c = cells().get(key(u, v)); if (!c) continue; c.k = 'normal'; c.prop = null; c.big = null; const F = FH(); if (F?.map?.blocked) F.map.blocked[idx(u, v)] = 0 }
  }
  function canPut(p, u, v, self) {
    const mine = new Set(self ? footprint(self).map(([a, b]) => key(a, b)) : []), q = { ...p, u, v }; let lv = null;
    for (const [a, b] of footprint(q)) {
      const c = cells().get(key(a, b)); if (!c || Math.abs(a) > Rr() || Math.abs(b) > Rr()) return false;
      if (!mine.has(key(a, b)) && (c.k === 'blocked' || c.big)) return false;
      if (unitAt(a, b) || special(a, b)) return false;
      if (p.big) { const l = levelAt(a, b); if (lv == null) lv = l; else if (l !== lv) return false }
    }
    return true;
  }
  function canStand(u, v, unit) { const c = cells().get(key(u, v)); return !!c && c.k !== 'blocked' && !c.big && !(FH()?.map?.water?.[idx(u, v)]) && !unitAt(u, v, unit) && Math.abs(u) <= Rr() && Math.abs(v) <= Rr() }

  /* ---------- operations ---------- */
  const invert = o => o.t === 'prop-move' ? { ...o, from: o.to, to: o.from } : o.t === 'prop-del' ? { ...o, t: 'prop-add' } : o.t === 'prop-add' ? { ...o, t: 'prop-del' } : { ...o, from: o.to, to: o.from };
  function run(op, inverse) {
    const o = inverse ? invert(op) : op;
    if (o.t === 'prop-move') { const p = { kind: o.kind, big: o.big, seed: o.seed, u: o.from[0], v: o.from[1] }; clearProp(p); putProp({ ...p, u: o.to[0], v: o.to[1] }) }
    else if (o.t === 'prop-del') clearProp({ kind: o.kind, big: o.big, u: o.at[0], v: o.at[1] });
    else if (o.t === 'prop-add') putProp({ kind: o.kind, big: o.big, seed: o.seed, u: o.at[0], v: o.at[1] });
    else if (o.t === 'unit') { const x = (stateOf()?.units || []).find(y => y.id === o.id); if (x) { x.u = o.to.u; x.v = o.to.v; x.vu = o.to.u + .5; x.vv = o.to.v + .5; x.dir = o.to.dir; x.walking = false } }
    root.__feDirtyGround?.();
  }

  /* ---------- fingerprint of the generated field (cells + heights), taken BEFORE any asset op ---------- */
  function fingerprint() {
    let h = 2166136261 >>> 0; const mix = s => { for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0 };
    const list = [...cells().values()].sort((a, b) => a.u - b.u || a.v - b.v);
    for (const c of list) mix(c.u + ',' + c.v + c.k + (c.prop || '') + (c.big ? c.big.kind + (c.big.anchor ? 'A' : '') : ''));
    const F = FH(); if (F?.map?.levels) { const L = F.map.levels; for (let i = 0; i < L.length; i++) mix(String(L[i])); for (const k of ['water', 'ramp', 'stair', 'mat']) if (F.map[k]) for (let i = 0; i < F.map[k].length; i++) mix(F.map[k][i] ? '1' : '0') }
    return h.toString(16).padStart(8, '0');
  }

  /* ---------- spawns ---------- */
  const sides = () => { const us = stateOf()?.units || []; return { ally: us.filter(u => u.side === 'hero'), enemy: us.filter(u => u.side === 'monster') } };
  function spawnsNow() { const s = sides(), f = u => ({ u: u.u, v: u.v, dir: u.dir }); return { ally: s.ally.map(f), enemy: s.enemy.map(f) } }
  function placeSpawns(sp) {
    if (!sp) return; const s = sides();
    for (const side of ['ally', 'enemy']) (sp[side] || []).forEach((p, i) => { const u = s[side][i]; if (!u) return; if (!canStand(p.u, p.v, u)) return; run({ t: 'unit', id: u.id, from: { u: u.u, v: u.v, dir: u.dir }, to: { u: p.u, v: p.v, dir: p.dir || u.dir } }, false) });
  }

  /* ---------- assets: drafts in this browser, then the files ---------- */
  const LS = 'bgAsset:', LSI = 'bgAssets:index';
  const draftIds = () => { try { return JSON.parse(localStorage.getItem(LSI) || '[]') } catch (e) { return [] } };
  function saveDraft(a) { try { localStorage.setItem(LS + a.id, JSON.stringify(a)); const l = draftIds().filter(x => x !== a.id); l.push(a.id); localStorage.setItem(LSI, JSON.stringify(l)); return true } catch (e) { return false } }
  function getDraft(id) { try { return JSON.parse(localStorage.getItem(LS + id) || 'null') } catch (e) { return null } }
  function readSync(path) { try { const x = new XMLHttpRequest(); x.open('GET', path, false); x.send(); return x.status === 200 ? JSON.parse(x.responseText) : null } catch (e) { return null } }
  const fetchAsset = id => getDraft(id) || readSync('data/battlefields/' + encodeURIComponent(id) + '.json');
  const fetchIndex = () => { const f = readSync('data/battlefields/index.json'); const files = (f && f.assets) || []; const dr = draftIds().map(getDraft).filter(Boolean).map(a => ({ id: a.id, name: a.name, biome: a.biome, tags: a.tags, draft: true, thumb: a.thumbData || null })); const ids = new Set(dr.map(x => x.id)); return [...dr, ...files.filter(x => !ids.has(x.id))] };

  /* the asset that this page was opened with (applied by the loader below once the battle exists) */
  let current = null, applied = false, drift = false;
  function use(asset) { current = asset; return asset }
  function applyBase(asset) {   // props: needs only the field (sync)
    if (!asset) return; drift = !!(asset.gen && asset.gen !== root.__bgGen);
    for (const o of asset.ops || []) { try { run(o, false) } catch (e) { console.warn('bg-asset: skipped', o, e) } }
  }
  function applyUnits(asset) { if (asset && !applied) { applied = true; placeSpawns(asset.spawns) } }

  root.BgField = { key, propAt, footprint, putProp, clearProp, canPut, canStand, run, invert, fingerprint, spawnsNow, placeSpawns, saveDraft, getDraft, draftIds, fetchAsset, fetchIndex, use, get current() { return current }, get drift() { return drift }, applyBase, applyUnits };
  /* take the fingerprint right now (the base field exists, no op has run), then apply the asset this page was opened with */
  root.__bgGen = fingerprint();
  const id = new URLSearchParams(location.search).get('bg');
  if (id) { const a = fetchAsset(id); if (a) { use(a); applyBase(a); let tries = 0; const w = setInterval(() => { if (stateOf() || ++tries > 150) { clearInterval(w); applyUnits(a) } }, 100) } else console.warn('bg-asset: "' + id + '" not found') }
})(globalThis);
