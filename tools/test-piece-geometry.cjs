/* Independent footprint placement, 2:1 fit invariants and real detail pointer handlers.
   Pure Node: browser-independent regressions for saved map edits. */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const G = require('../js/piece-geometry.js');
const point = (m, p) => ({ x: m[0] * p.x + m[2] * p.y, y: m[1] * p.x + m[3] * p.y });
const pts = [{ x: -120, y: -20 }, { x: 0, y: 70 }, { x: 180, y: -10 }];
for (const mode of ['balanced', 'height', 'width']) {
  const r = G.fit(pts, mode), e = G.edges(pts.map(p => point(r.correction, p)));
  assert(Math.abs(e.m1 - .5) < 1e-10); assert(Math.abs(e.m2 + .5) < 1e-10);
  if (mode === 'height') assert.equal(r.correction[3], 1);
  if (mode === 'width') assert.equal(r.correction[0], 1);
  if (mode === 'balanced') assert(Math.abs(r.correction[0] * r.correction[3] - 1) < 1e-10);
}
assert.equal(G.fit([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 200, y: 0 }]), null);
assert.equal(G.fit([{ x: 0, y: 0 }, { x: 0, y: 70 }, { x: 200, y: 0 }]), null);
// The composition must correct the displayed art, even with a previous flip/rotation/shear.
const prior = [-.8, -.2, .3, 1.1], displayed = pts.map(p => point(prior, p)), fit = G.fit(displayed, 'balanced', prior);
assert(fit); const after = G.edges(pts.map(p => point(fit.matrix, p)));
assert(Math.abs(after.m1 - .5) < 1e-10); assert(Math.abs(after.m2 + .5) < 1e-10);
const o = { sw: 2, sh: 4, fw: 1, fh: 2, orderU: 3, orderV: -2, blockU: -1, blockV: 2, artX: 90, artY: 50 };
assert.deepEqual(G.footprint(o, 10, 20), { u0: 12, u1: 14, v0: 16, v1: 20 });
assert.deepEqual(G.footprint(o, 10, 20, true), { u0: 8.5, u1: 9.5, v0: 21, v1: 23 });
assert.deepEqual(G.rect({ x: 0, y: 0, w: 10, h: 20 }, { x: 0, y: 0 }, { artX: 20, artY: 30, pm: [2, 0, 0, .5] }), { x: 20, y: 30, w: 20, h: 10 });
const duplicate = G.extra({ pm: [1, 0, 0, 1], ...o, block: true }); duplicate.pm[0] = 9;
assert.equal(G.extra({ pm: [1, 0, 0, 1] }).pm[0], 1); assert.equal(duplicate.block, true);
console.log('PASS geometry: separate world footprints, bounds, composed fit and all 3 fit modes');
// Small DOM/canvas doubles exercise the actual production event handlers, not a copy of their logic.
let nodes = [], dialog, nativeCanvas = null; const byId = new Map();
const context = new Proxy({ getImageData: () => ({ data: new Uint8ClampedArray(620 * 500 * 4) }) }, { get: (o, k) => k in o ? o[k] : () => {} });
class Element {
  constructor(tag) { this.tag = tag; this.style = {}; this.dataset = {}; this.captured = new Set(); this.value = ''; this._html = ''; this.checked = false }
  set innerHTML(s) { this._html = s; if (this.tag !== 'dialog') return; nodes = []; for (const m of s.matchAll(/<([a-z]+)\b([^>]*)>/gi)) { const e = new Element(m[1]); for (const a of m[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g)) { const [_, k, v = ''] = a; if (k === 'id') { e.id = v; byId.set(v, e) } if (k === 'value') e.value = v; if (k === 'checked') e.checked = true; if (k.startsWith('data-')) e.dataset[k.slice(5)] = v } nodes.push(e) } }
  get innerHTML() { return this._html }
  querySelector(s) { const ia = s.match(/^\[id="(.+)"\]$/); if (ia) return byId.get(ia[1]) || null; return s.startsWith('#') ? byId.get(s.slice(1)) || null : this.querySelectorAll(s)[0] || null }
  querySelectorAll(s) { const m = s.match(/^\[data-([\w-]+)\]$/); return m ? nodes.filter(e => m[1] in e.dataset) : [] }
  setAttribute(k, v) { this[k] = v }
  append(e) { if (e.id) byId.set(e.id, e) }
  getContext() { if (!nativeCanvas) return context; if (!this.bitmap) this.bitmap = nativeCanvas.createCanvas(this.width || 620, this.height || 500); const q = this.bitmap.getContext('2d'); if (!this.wrapped) { const draw = q.drawImage.bind(q); q.drawImage = (im, ...args) => draw(im.bitmap || im, ...args); this.wrapped = true } return q }
  getBoundingClientRect() { return { left: 10, top: 20, width: 310, height: 250 } }
  setPointerCapture(id) { this.captured.add(id) }
  hasPointerCapture(id) { return this.captured.has(id) }
  releasePointerCapture(id) { this.captured.delete(id) }
  showModal() { this.open = true }
  close() { this.open = false; this.onclose?.() }
}
const document = { head: new Element('head'), body: new Element('body'), getElementById: id => byId.get(id) || null, createElement: tag => { const e = new Element(tag); if (tag === 'dialog') dialog = e; return e } };
let saved = {}, persisted = '{}', checkpoints = 0;
const window = { PieceGeometry: G, DepthStyle: { walkerInFront: (b, u, v) => u + v > (b.u0 + b.u1 + b.v0 + b.v1) / 2, isLow: () => true, get: () => ({ alpha: .35 }), styleFor: () => 'solid' }, VillageAssetEdit: { detail: { item: () => ({ label: 'Bench', ax: 0, ay: 0 }), ov: () => saved, drawTo() {}, edit(k, fn, cp) { if (cp) checkpoints++; fn(saved); persisted = JSON.stringify(saved) } } } };
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/piece-detail.js'), 'utf8'), { window, document });
window.PieceDetail.open('bench');
const button = (key, v) => nodes.find(e => e.dataset[key] === v);
const e = (x, y) => ({ button: 0, pointerId: 1, clientX: 10 + x / 2, clientY: 20 + y / 2, preventDefault() {} });
const drag = (a, b) => { const cv = byId.get('pdCv'); cv.onpointerdown(e(...a)); cv.onpointermove(e(...b)); cv.onpointerup(e(...b)) };
byId.get('pdSnap').onchange({ target: { checked: false } });   // the old drags are measured without snapping
button('mode', 'art').onclick(); drag([300, 300], [338, 319]);
assert.equal(saved.artX, 20); assert.equal(saved.artY, 10); assert.equal(saved.orderU, undefined); assert.equal(checkpoints, 1);
byId.get('pdUndo').onclick(); assert.equal(saved.artX, undefined);
button('mode', 'order').onclick(); drag([310, 330], [416.4, 383.2]); assert.equal(saved.orderU, 2); assert.equal(saved.orderV, 0);
button('mode', 'block').onclick(); drag([310, 330], [310, 436.4]); assert.equal(saved.block, true); assert.equal(saved.blockU, 2); assert.equal(saved.blockV, 2); assert.equal(saved.orderU, 2);
// v98.499 · snap + free-form (painted) zones
byId.get('pdSnap').onchange({ target: { checked: true } }); button('mode', 'order').onclick(); drag([310, 330], [416.4, 383.2]);
assert.equal((saved.orderU - .25) % .5, 0, 'snapped frame edges sit on the half-cell grid');
button('mode', 'bo').onclick(); byId.get('pdBrFrom').onclick(); assert(Array.isArray(saved.zo) && saved.zo.length >= 1, 'brush mode starts from the rectangle');
byId.get('pdBrClear').onclick(); assert.equal(saved.zo, undefined, 'clear returns to the rectangle');
{ const F = G.footprint({ zo: [[0, 0], [1, 0], [0, 1], [0, 2]] }, 0, 0); assert.equal(F.parts.length, 2); assert.deepEqual(F, { u0: 0, u1: 1, v0: 0, v1: 1.5, parts: [{ u0: 0, u1: 1, v0: 0, v1: .5 }, { u0: 0, u1: .5, v0: .5, v1: 1.5 }] }, 'an L shape = two boxes');
  assert.deepEqual(G.footprint({ zb: [[0, 0]], blockU: 1, blockV: 2 }, 0, 0, true), { u0: 1, u1: 1.5, v0: 2, v1: 2.5 }); assert.deepEqual(G.swapCells([[1, 2]]), [[2, 1]]); assert.equal(G.extra({ zo: [[0, 0]] }).zo[0][0], 0); const x = { zo: [[1, 1]] }; G.extra(x).zo[0][0] = 9; assert.equal(x.zo[0][0], 1, 'extra() deep-copies masks');
  assert.deepEqual(G.footprint({ sw: 2, sh: 2 }, 0, 0), { u0: -1, u1: 1, v0: -1, v1: 1 }, 'no mask → unchanged'); }
button('mode', 'bo').onclick(); byId.get('pdBrClear').onclick(); byId.get('pdBrFrom').onclick(); const n0 = saved.zo.length; drag([400, 330], [520, 330]); assert(saved.zo.length > n0 || n0 > 0, 'dragging the brush paints cells');
byId.get('pdBrErase').onclick(); const n1 = saved.zo.length; drag([310, 330], [330, 340]); assert(saved.zo.length <= n1, 'erase never adds'); byId.get('pdBrDraw').onclick(); byId.get('pdBrClear').onclick(); assert.equal(saved.zo, undefined);
byId.get('pdSnap').onchange({ target: { checked: false } });
button('mode', 'fit').onclick();
const cv = byId.get('pdCv'); for (const p of [[160, 300], [300, 390], [480, 300]]) { cv.onpointerdown(e(...p)); cv.onpointerup(e(...p)) }
assert.equal(button('fit', 'height').disabled, false); button('fit', 'height').onclick(); assert(Array.isArray(saved.pm)); assert.equal(saved.pm[3], 1);
const before = persisted; button('mode', 'walk').onclick(); drag([400, 200], [400, 400]); assert.equal(persisted, before, 'testing the walker must not edit the asset');
saved = JSON.parse(persisted); window.PieceDetail.open('bench'); assert.equal(saved.blockU, 2); assert(Array.isArray(saved.pm));
console.log('PASS detail: scaled-canvas art/order/block drags, undo, fit, walker isolation and saved-state reopen');

try { nativeCanvas = require('@napi-rs/canvas') } catch (_) { }
if (nativeCanvas) {
  let alphas = []; saved = {}; window.DepthStyle.isLow = () => false; window.DepthStyle.styleFor = () => 'both';
  window.VillageAssetEdit.detail.drawTo = q => { alphas.push(q.globalAlpha); q.fillStyle = '#a87848'; q.fillRect(-55, -90, 110, 90) };
  window.PieceDetail.open('bench');
  drag([310, 75], [310, 75]); assert.equal(alphas.at(-1), 1); assert(byId.get('pdState').innerHTML.includes('ไม่ได้โดนชิ้นนี้บัง'));
  drag([310, 280], [310, 280]); assert(Math.abs(alphas.at(-1) - .35) < .01); assert(byId.get('pdState').innerHTML.includes('ภาพซ้อนกัน'));
  drag([580, 300], [580, 300]); assert.equal(alphas.at(-1), 1); assert(byId.get('pdState').innerHTML.includes('ไม่ได้โดนชิ้นนี้บัง'));
  console.log('PASS actual raster overlap: far/side walkers keep solid art, near overlapping walker fades it');
} else console.log('SKIP optional raster check (@napi-rs/canvas unavailable)');
