/* Raster spell playback: real decode, all cells, anchors, fallback and saved choices. */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const { createCanvas, Image: NativeImage } = require('@napi-rs/canvas');
const src = fs.readFileSync('js/vfx-kit.js', 'utf8');
const kinds = ['ice', 'lightning', 'water', 'wind', 'earth', 'dark', 'heal', 'shield'];
function setup({ loading = false, reduced = false, search = '', values = {} } = {}) {
  const images = [];
  class Picture extends NativeImage { constructor() { super(); images.push(this); } }
  class LoadingPicture { set src(v) { this._src = v; this.complete = false; this.naturalWidth = 0; } }
  const storage = { ...values };
  const c = { Image: loading ? LoadingPicture : Picture, URL, URLSearchParams,
    document: { currentScript: null }, location: { search }, matchMedia: () => ({ matches: reduced }),
    localStorage: { getItem: k => storage[k] ?? null, setItem: (k, v) => { storage[k] = v; } } };
  vm.createContext(c); vm.runInContext(src, c); return { c, images, kit: c.VfxKit };
}
(async () => {
  const { kit, images } = setup();
  await Promise.all(images.map(im => im.decode()));
  const canvas = createCanvas(300, 300), ctx = canvas.getContext('2d');
  for (const kind of kinds) {
    assert.equal(kit.choiceOf(kind), 'painted8'); assert.ok(kit.uses(kind));
    assert.ok(kit.variants(kind).some(v => v[0] === 'painted8'));
    const file = 'assets/fx/anim/' + kind + '-cast.webp';
    const im = images.find(i => i.src === file); assert.ok(im, file);
    assert.ok(im.naturalWidth >= 1200 && im.naturalWidth === im.naturalHeight * 2, file);
    const cells = new Set();
    const probe = { globalAlpha: 1, save() {}, restore() {}, drawImage(...a) {
      assert.ok(a.slice(1).every(Number.isFinite));
      assert.ok(a[1] >= 0 && a[2] >= 0 && a[1] + a[3] <= im.naturalWidth && a[2] + a[4] <= im.naturalHeight);
      cells.add(a[1] + ',' + a[2]);
      assert.equal(a[5] + a[7] * .5, 150, 'stable center');
      assert.equal(a[6] + a[8] * .82, 224.2, 'stable feet anchor');
    } };
    for (let f = 0; f < 8; f++) {
      const t = (f + .5) / 8;
      assert.ok(kit.draw({ kind }, t, { x: 150, y: 220 }, null, probe, { w: 70 }));
      ctx.clearRect(0, 0, 300, 300);
      assert.ok(kit.draw({ kind }, t, { x: 150, y: 220 }, null, ctx, { w: 70 }));
      const pixels = ctx.getImageData(0, 0, 300, 300).data;
      assert.ok(pixels.some((v, i) => i % 4 === 3 && v > 8), kind + ' frame ' + f + ' must render');
    }
    assert.equal(cells.size, 8, 'all eight frames selected');
    ctx.clearRect(0, 0, 300, 300); kit.draw({ kind }, 1, { x: 150, y: 220 }, null, ctx, { w: 70 });
    assert.ok(ctx.getImageData(0, 0, 300, 300).data.every(v => v === 0), 'effect ends transparently');
    kit.setChoice(kind, 'old'); assert.equal(kit.choiceOf(kind), 'old');
    kit.setChoice(kind, 'new'); assert.equal(kit.choiceOf(kind), 'new');
  }
  const pending = setup({ loading: true }).kit;
  assert.equal(pending.draw({ kind: 'ice' }, .4, { x: 10, y: 20 }, null, ctx, { w: 60 }), false, 'loading falls back');
  assert.equal(setup({ search: '?vfx=old' }).kit.choiceOf('ice'), 'old');
  assert.equal(setup({ search: '?vfx=new' }).kit.choiceOf('ice'), 'new');
  const rm = setup({ reduced: true }); await Promise.all(rm.images.map(im => im.decode()));
  const selected = [];
  const spy = { globalAlpha: 1, save() {}, restore() {}, drawImage(...a) { selected.push(a.slice(1, 5).join(',')); } };
  for (const t of [.1, .3, .8]) rm.kit.draw({ kind: 'ice', from: {} }, t, { x: 150, y: 220 }, { x: 10, y: 10 }, spy, { w: 70 });
  assert.equal(new Set(selected).size, 1, 'reduced motion holds one frame without travel');
  console.log('PASS painted spells: eight real WebP sheets / 64 frames; bounded cells, stable anchors, lifetime, fallback, preferences and reduced motion');
})().catch(e => { console.error(e); process.exitCode = 1; });
