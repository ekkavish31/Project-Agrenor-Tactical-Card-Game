/* v98.442 · USER-DRAWN RULERS (ไม้บรรทัดลากเอง) — measure a part on the BASE (ตัวต้น) and on the TARGET, compare, then adjust.
   A ruler = a name + two points dragged on the picture (fractions of the picture). Its size is stored as a RATIO to a body unit that does not
   change with the picture size: the face (eye midpoint → chin) for body parts, the datum height (eyes → feet) for the head width.
   So the base stores its numbers once; the target is compared with them without loading the base picture.
   Store: localStorage 'proportion-rulers-v1' = { [character]: { "pose|dir": { [rulerKey]: { a:[x,y], b:[x,y], len, unit, ratio, at } } } }
   Pure functions (ratio / compare / plan / level) are tested by tools/test-proportion-rulers.cjs. */
(function (root) {
  'use strict';
  const KEY = 'proportion-rulers-v1';
  /* emoji instead of words (compact UI) · part = which adjust slider the ruler feeds · unit = what it is divided by */
  const PRESETS = [
    { k: 'height', e: '📏', n: 'ความสูง (หัว→เท้า)', part: null, unit: 'face' },
    { k: 'head', e: '🗣️', n: 'ความกว้างหัว', part: 'head', unit: 'height' },
    { k: 'torso', e: '🧍', n: 'ลำตัว (ไหล่→ขาหนีบ)', part: 'torso', unit: 'face' },
    { k: 'legs', e: '🦵', n: 'ขา (ขาหนีบ→เท้า)', part: 'legs', unit: 'face' },
    { k: 'thigh', e: '🍗', n: 'ต้นขา', part: 'legs', unit: 'face' },
    { k: 'shin', e: '🥾', n: 'แข้ง', part: 'legs', unit: 'face' },
    { k: 'shoulder', e: '↔️', n: 'ความกว้างไหล่', part: null, unit: 'face' },
  ];
  const byKey = k => PRESETS.find(p => p.k === k);
  const dist = (a, b, w, h) => Math.hypot((a[0] - b[0]) * w, (a[1] - b[1]) * h);
  /* ratio of a ruler = its length ÷ the unit (both in picture pixels) · null when the unit is unknown */
  const ratio = (len, unit) => len > 0 && unit > 0 ? len / unit : null;
  /* a ruler record from two dragged points */
  function make(k, a, b, w, h, unit) { const len = dist(a, b, w, h); return { a: [+a[0], +a[1]], b: [+b[0], +b[1]], len, unit: unit || null, ratio: ratio(len, unit), at: Date.now() } }
  const rkey = (pose, dir) => pose + '|' + dir;
  const all = () => { try { return JSON.parse(root.localStorage.getItem(KEY) || '{}') || {} } catch (e) { return {} } };
  const saveAll = d => { try { root.localStorage.setItem(KEY, JSON.stringify(d)) } catch (e) { } };
  const list = (id, pose, dir) => all()[id]?.[rkey(pose, dir)] || {};
  function put(id, pose, dir, k, rec) { const d = all(); ((d[id] ||= {})[rkey(pose, dir)] ||= {})[k] = rec; saveAll(d) }
  function remove(id, pose, dir, k) { const d = all(), g = d[id]?.[rkey(pose, dir)]; if (!g) return; delete g[k]; if (!Object.keys(g).length) delete d[id][rkey(pose, dir)]; if (!Object.keys(d[id]).length) delete d[id]; saveAll(d) }
  /* target ÷ base: > 1 → the target's part is longer than the base's → shrink by 1/q; so the SCALE to apply to the target is ref ÷ own */
  const scaleOf = (own, ref) => own?.ratio && ref?.ratio ? ref.ratio / own.ratio : null;
  /* ×1.30 text (what to multiply the target by) */
  const fmt = q => q == null ? '—' : '×' + q.toFixed(2);
  /* colour class by how far from 1 */
  const level = q => q == null ? 'none' : Math.abs(q - 1) <= .05 ? 'ok' : Math.abs(q - 1) <= .12 ? 'warn' : 'bad';
  const clamp = (q, lo = .5, hi = 2) => Math.max(lo, Math.min(hi, q));
  /* all compared rulers → { rows:[{k,q,level}], parts:{head,torso,legs} } · parts = mean scale of the rulers feeding that part (rulers with no part are only shown) */
  function plan(ownMap, refMap) {
    const rows = [], sum = {}, n = {};
    for (const p of PRESETS) { const q = scaleOf(ownMap?.[p.k], refMap?.[p.k]); if (q == null) continue; rows.push({ k: p.k, q, level: level(q) }); if (p.part) { sum[p.part] = (sum[p.part] || 0) + q; n[p.part] = (n[p.part] || 0) + 1 } }
    const parts = {}; for (const k of Object.keys(sum)) parts[k] = clamp(sum[k] / n[k]);
    return { rows, parts };
  }
  /* drag-swap of two animation cells (Asset Studio): the rulers belong to the picture, so the two sets trade places */
  function swap(id, poseA, dirA, poseB, dirB) { const d = all(), g = d[id] || {}, ka = rkey(poseA, dirA), kb = rkey(poseB, dirB), a = g[ka], b = g[kb]; if (!a && !b) return; if (b) g[ka] = b; else delete g[ka]; if (a) g[kb] = a; else delete g[kb]; if (Object.keys(g).length) d[id] = g; else delete d[id]; saveAll(d) }
  const api = { KEY, swap, PRESETS, byKey, dist, ratio, make, list, put, remove, all, saveAll, scaleOf, fmt, level, clamp, plan };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ProportionRulers = api;
})(typeof window !== 'undefined' ? window : globalThis);
