// Canonical datum ratios, raised-arm protection, and actual preview→Cart flow.
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const store = {}; global.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = v }, removeItem: k => { delete store[k] } };
require('../js/proportion-zones.js');
const PD = require('../js/proportion-datum.js'), PA = require('../js/proportion-adjust.js'), PT = require('../js/proportion-tool.js');
const W = 220, H = 230, points = { eyeL: [100, 50], eyeR: [110, 50], chin: [105, 70], shL: [80, 90], shR: [130, 90], elbowL: [40, 60], wristL: [30, 20], elbowR: [150, 110], wristR: [155, 140], chest: [105, 100], crotch: [105, 140], kneeL: [90, 170], kneeR: [120, 170], footL: [90, 200], footR: [120, 200] };
const rec = { pts: { SW: Object.fromEntries(Object.entries(points).map(([k, p]) => [k, [p[0] / W, p[1] / H]])) } };
const metrics = PD.metrics(rec, 'SW', W, H), spans = PD.spans(rec, 'SW'), measured = PD.measure(rec, 'SW', W, H);
assert(Math.abs(measured.headFrac - spans.head) < 1e-12); assert.equal(measured.heads, metrics.heads); assert(Math.abs(spans.head + spans.torso + spans.legs - 1) < 1e-12);
const noArms = JSON.parse(JSON.stringify(rec)); for (const k of ['elbowL', 'elbowR', 'wristL', 'wristR']) delete noArms.pts.SW[k]; assert.deepEqual(PD.spans(noArms, 'SW'), spans, 'raised arm points never redefine head/body height');
assert(metrics.arms.L.total > 0); const mirrored = PD.pointsFor(rec, 'SE').pts; assert.deepEqual(mirrored.wristR, [1 - rec.pts.SW.wristL[0], rec.pts.SW.wristL[1]]); assert.deepEqual(mirrored.elbowR, [1 - rec.pts.SW.elbowL[0], rec.pts.SW.elbowL[1]]);
const m = { w: W, h: H, top: 10, H: 211, bottom: 220, x0: 20, x1: 169 }, marks = PD.marksFrom(rec, 'SW', m, H), seg = PA.segments(m, marks);
assert.equal(seg.top, 30); assert.equal(seg.bottom, 200); assert(Math.abs(PA.plan(seg, { head: 1, torso: 1, legs: 1 }).headFrac - spans.head) < 1e-12);
const weights = PA.protectArms(PA.weightsOf(new Uint8ClampedArray(W * H * 4), W, H, seg, 'band', 4, 2), W, H, points);
assert.equal(weights[0][20 * W + 30], 0); assert.equal(weights[1][20 * W + 30], 1, 'raised wrist belongs to torso/arm, not head');
const standard = { team: true, head: .22, torso: .44, legs: .34, tol: .04 }, right = { manual: true, head: .22, torso: .44, legs: .34 };
assert.equal(PT.verdict(right, standard, .44).level, 'ok'); assert.equal(PT.verdict(right, standard, .1).level, 'ok', 'median cannot change judgment');
assert.equal(PT.verdict({ manual: true, head: .44, torso: .3, legs: .26 }, standard, .44).level, 'bad'); assert.equal(PT.verdict(right, { team: true, missing: true }).level, 'pending');
console.log('PASS canonical ratios, arm mirroring/protection and standard-only judgment');
let native; try { native = require('@napi-rs/canvas') } catch (_) { console.log('SKIP optional native canvas preview checks'); process.exit(0) }
// Small DOM adapter runs the real inspectRatio() and real raster warp without a browser.
let nodes = [], byId = new Map(); const raf = new Map(); let rafId = 0; const messages = [];
function matches(e, selector) {
  selector = selector.trim(); if (selector.startsWith('#adjBox ')) selector = selector.slice(8);
  if (selector.startsWith('#')) return e.id === selector.slice(1);
  if (selector.startsWith('.')) return (e.attrs?.class || '').split(/\s+/).includes(selector.slice(1));
  const tag = selector.match(/^\w+/)?.[0]; if (tag && e.tag !== tag) return false;
  for (const m of selector.matchAll(/\[([^=\]]+)(?:=["']?([^\]"']+)["']?)?\]/g)) if (m[2] == null ? !(m[1] in (e.attrs || {})) : e.attrs?.[m[1]] !== m[2]) return false;
  return !selector.includes(':checked') || e.checked;
}
class Element {
  constructor(tag) { this.tag = tag; this.attrs = {}; this.dataset = {}; this.style = {}; this.value = ''; this._checked = false; this.isConnected = true }
  set checked(v) { if (v && this.attrs.name) nodes.filter(n => n !== this && n.attrs?.name === this.attrs.name).forEach(n => { n._checked = false }); this._checked = !!v }
  get checked() { return this._checked }
  set innerHTML(s) { this._html = s; if (this.id === 'insp') { nodes = [this]; byId = new Map([['insp', this]]) } for (const m of s.matchAll(/<([a-z]+)\b([^>]*)>/gi)) {
    const e = m[1] === 'canvas' ? Object.assign(native.createCanvas(1, 1), { tag: 'canvas', attrs: {}, dataset: {}, style: {}, isConnected: true }) : new Element(m[1]);
    for (const a of m[2].matchAll(/([\w-]+)(?:="([^"]*)")?/g)) { const [, k, v = ''] = a; e.attrs[k] = v; if (k === 'id') { e.id = v; byId.set(v, e) } if (k === 'value') e.value = v; if (k === 'checked') e.checked = true; if (k === 'width' || k === 'height') e[k] = +v; if (k.startsWith('data-')) e.dataset[k.slice(5)] = v }
    nodes.push(e);
  } }
  get innerHTML() { return this._html || '' }
  querySelectorAll(s) { return nodes.filter(e => s.split(',').some(x => matches(e, x))) }
  querySelector(s) { return this.querySelectorAll(s)[0] || null }
  addEventListener(k, fn) { this['on' + k] = fn }
}
const insp = new Element('aside'); insp.id = 'insp'; byId.set('insp', insp);
const document = { createElement: tag => tag === 'canvas' ? native.createCanvas(1, 1) : new Element(tag), getElementById: id => byId.get(id), querySelectorAll: s => nodes.filter(e => s.split(',').some(x => matches(e, x))), querySelector: s => document.querySelectorAll(s)[0] || null };
global.document = document;
const img = native.createCanvas(W, H), g = img.getContext('2d');
g.fillStyle = '#2255cc'; g.fillRect(85, 30, 40, 40); g.fillStyle = '#228844'; g.fillRect(75, 70, 60, 70); g.fillStyle = '#886622'; g.fillRect(75, 140, 20, 65); g.fillRect(115, 140, 20, 65); g.strokeStyle = '#ee2233'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(80, 90); g.lineTo(40, 60); g.lineTo(30, 20); g.stroke();
const beforePixels = Buffer.from(g.getImageData(0, 0, W, H).data), protectedWarp = PA.warp(img, m, marks, { head: 1.5, torso: 1, legs: 1 }, { points, mode: 'band', keepHeight: false, sharpen: 0 });
const wrist = PA.mapPoint(protectedWarp, ...points.wristL); assert(Math.abs(wrist[0] - points.wristL[0]) < 1e-4 && Math.abs(wrist[1] - points.wristL[1]) < 1e-4, 'head-only growth leaves raised wrist fixed');
assert(!Buffer.from(protectedWarp.canvas.getContext('2d').getImageData(0, 0, W, H).data).equals(beforePixels), 'the head actually changes in the draft');
assert(Buffer.from(g.getImageData(0, 0, W, H).data).equals(beforePixels), 'warp never mutates the source image');
PD.put('kier', 'windup', 0, rec); PD.setStd('front', { id: 'hero', name: 'Hero', pose: 'idle', dir: 'SW', spans: { head: .22, torso: .44, legs: .34 } });
let lastResult; const wrappedPA = { ...PA, warp(...args) { return lastResult = PA.warp(...args) } };
const c = { img, m, flip: false, file: 'synthetic-kier.png', label: 'windup SW', vp: { action: 'windup', view: 'SW', index: 0, sid: 'ally:kier', clips: [] } }, entry = { id: 'kier', name: 'Kier', ctx: { battle: c } };
const window = { ProportionZones: global.ProportionZones, ProportionDatum: PD, ProportionAdjust: wrappedPA, parent: { postMessage: x => messages.push(x) } };
const globals = { $: id => document.getElementById(id), window, document, ENTRIES: [entry], sel: 'kier', isW: () => false, ratioOf: () => ({ ...spans, heads: 1 / spans.head, datum: measured, manual: true, marks, headW: 40, shoulderW: 50, headToShoulder: .8 }), PT, visible: () => [entry], STDOBJ: () => standard, LV: { ok: ['ok', 'ok'], warn: ['warn', 'warn'], bad: ['bad', 'bad'], pending: ['warn', 'pending'] }, DOCK: true, vpOf: () => ({ pose: 'windup', dir: 'SW', frame: 0 }), verifiedMark: () => '', doneOf: () => '', mapText: x => x, COL: { chin: '#f00', hip: '#0f0', shoulder: '#00f' }, renderRatio() {}, openDatum() {}, OPPV: { SW: 'SE' }, ST: null, VP: { action: 'windup', view: 'SW' }, DONE: {}, doneKey: id => id + '|windup|SW', saveDone() {}, confirm: () => true, location: { origin: 'http://test.local' }, requestAnimationFrame: fn => { const id = ++rafId; raf.set(id, fn); return id }, cancelAnimationFrame: id => raf.delete(id) };
const source = fs.readFileSync(require('node:path').join(__dirname, '../scale-lineup.html'), 'utf8'), start = source.indexOf('function inspectRatio()'), end = source.indexOf('/* ================= 📍 Datum editor', start); vm.createContext(globals); vm.runInContext(source.slice(start, end) + '\ninspectRatio();', globals);
const $ = id => document.getElementById(id), flush = () => { for (let i = 0; raf.size && i < 10; i++) { const q = [...raf.values()]; raf.clear(); q.forEach(fn => fn()) } };
(async () => {
  assert.equal(messages.length, 0, 'opening and initial preview never write to Cart');
  const afterPoints = Object.fromEntries(Object.entries(rec.pts.SW).map(([key, [x,y]]) => { const p = PA.mapPoint(lastResult, x * W, y * H); return [key, [p[0] / W, p[1] / H]] })); const actualHead = PD.spans({pts:{SW:afterPoints}}, 'SW').head; assert(Math.abs(actualHead - .22) < .015, 'automatic fit must get near the actual standard head ratio, not inflate it to a hair/raised-hand ratio');
  const uiCanvas = $('pcv'), initialAfter = Buffer.from($('pcv').getContext('2d').getImageData($('pcv').width / 2, 0, $('pcv').width / 2, $('pcv').height).data), beforeLeft = Buffer.from(uiCanvas.getContext('2d').getImageData(0, 0, uiCanvas.width / 2, uiCanvas.height).data);
  const headInput = document.querySelectorAll('.adjVal').find(e => e.dataset.k === 'head'); headInput.value = '150'; headInput.oninput(); assert.equal($('adjApply').disabled, true, 'saving blocked while After is stale'); flush();
  assert.equal(messages.length, 0); assert.equal($('adjApply').disabled, false); assert(!Buffer.from(uiCanvas.getContext('2d').getImageData(uiCanvas.width / 2, 0, uiCanvas.width / 2, uiCanvas.height).data).equals(initialAfter), 'After actually changes on input before any save'); assert($('adjPreviewState').textContent.includes('ยังไม่เข้า Cart'));
  assert(Buffer.from(uiCanvas.getContext('2d').getImageData(0, 0, uiCanvas.width / 2, uiCanvas.height).data).equals(beforeLeft), 'Before stays byte-identical when parameters change');
  $('adjPreview').onclick(); assert.equal(messages.length, 0, 'explicit Preview never adds a Cart item');
  const z = $('zoneCanvas'); z.getBoundingClientRect = () => ({left:0,top:0,width:W,height:H}); z.setPointerCapture = () => {};
  $('zoneEdit').checked = true; $('zonePart').value = '1'; $('zoneSize').value = '20';
  z.onpointerdown({clientX:30,clientY:20,button:0,pointerId:1,preventDefault(){}}); z.onpointermove({clientX:35,clientY:25,preventDefault(){}}); z.onpointerup(); flush();
  assert.equal(lastResult.labels[20 * W + 30], 1); assert($('zoneState').textContent.includes('แก้ด้วยมือ')); assert(Object.keys(store).some(k => k.startsWith('proportion-zones-v1:')));
  $('zoneUndo').onclick(); flush(); assert.equal(lastResult.labels[20 * W + 30], 4);
  $('zoneShow').checked = false; $('zoneShow').onchange(); flush(); assert.equal(messages.length, 0);
  const expected = Buffer.from(lastResult.canvas.getContext('2d').getImageData(0, 0, W, H).data); await $('adjApply').onclick(); assert.equal(messages.length, 1);
  const decoded = await native.loadImage(messages[0].dataUrl), out = native.createCanvas(W, H); out.getContext('2d').drawImage(decoded, 0, 0); assert(Buffer.from(out.getContext('2d').getImageData(0, 0, W, H).data).equals(expected), 'Cart PNG is exactly the raster already previewed');
  console.log('PASS real raster: wrist protection, pristine Before, live After, preview isolation and exact preview→Cart PNG');
})().catch(e => { console.error(e); process.exit(1) });
