/* Raster spell playback: real decode, all cells, anchors, fallback and saved choices. */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm');
const { createCanvas, Image: NativeImage } = require('@napi-rs/canvas');
const src = fs.readFileSync('js/vfx-kit.js', 'utf8');
const kinds = ['ice', 'lightning', 'water', 'wind', 'earth', 'dark', 'heal', 'shield'];
function setup({ loading = false, reduced = false, search = '', values = {} } = {}) {
  const images = [], crops = [];
  class Picture extends NativeImage { constructor() { super(); images.push(this); } }
  class LoadingPicture { set src(v) { this._src = v; this.complete = false; this.naturalWidth = 0; } }
  const storage = { ...values };
  const c = { Image: loading ? LoadingPicture : Picture, URL, URLSearchParams,
    document: { currentScript: null, createElement() { const cv=createCanvas(1,1), q=cv.getContext('2d'), draw=q.drawImage.bind(q);q.drawImage=(...a)=>{crops.push(a);return draw(...a)};return cv } }, location: { search }, matchMedia: () => ({ matches: reduced }),
    localStorage: { getItem: k => storage[k] ?? null, setItem: (k, v) => { storage[k] = v; } } };
  vm.createContext(c); vm.runInContext(src, c); return { c, images, crops, kit: c.VfxKit };
}
(async () => {
  const { kit, images, crops } = setup();
  await Promise.all(images.map(im => im.decode()));
  const canvas = createCanvas(300, 300), ctx = canvas.getContext('2d');
  for (const kind of kinds) {
    assert.equal(kit.choiceOf(kind), ['ice', 'lightning'].includes(kind) ? 'drawnImpact' : 'drawnSequence');
    kit.setChoice(kind, 'painted8'); assert.ok(kit.uses(kind));
    assert.ok(kit.variants(kind).some(v => v[0] === 'painted8'));
    const file = 'assets/fx/anim/' + kind + '-cast.webp';
    const im = images.find(i => i.src === file); assert.ok(im, file);
    assert.ok(im.naturalWidth >= 1200 && im.naturalWidth === im.naturalHeight * 2, file);
    const cells = new Set();
    const probe = createCanvas(300,300).getContext('2d'), render = probe.drawImage.bind(probe);
    probe.drawImage = (...a) => {
      assert.ok(a.slice(1).every(Number.isFinite));
      const direct = a.length===9, dx=direct?a[5]:a[1], dy=direct?a[6]:a[2], w=direct?a[7]:a[3], h=direct?a[8]:a[4];
      if(direct){assert.ok(a[1]>=0&&a[2]>=0&&a[1]+a[3]<=im.naturalWidth&&a[2]+a[4]<=im.naturalHeight);cells.add(a[1]+','+a[2])}
      const m=probe.getTransform();assert.ok(Math.abs(m.a*(dx+w*.5)+m.c*(dy+h*.82)+m.e-150)<1e-5,'stable center');
      assert.ok(Math.abs(m.b*(dx+w*.5)+m.d*(dy+h*.82)+m.f-224.2)<1e-5,'stable feet anchor');
      return render(...a);
    };
    const cropStart=crops.length;
    for (let f = 0; f < 8; f++) {
      const t = f===7 ? .96 : f/7;
      assert.ok(kit.draw({ kind }, t, { x: 150, y: 220 }, null, probe, { w: 70 }));
      ctx.clearRect(0, 0, 300, 300);
      assert.ok(kit.draw({ kind }, t, { x: 150, y: 220 }, null, ctx, { w: 70 }));
      const pixels = ctx.getImageData(0, 0, 300, 300).data;
      assert.ok(pixels.some((v, i) => i % 4 === 3 && v > 8), kind + ' frame ' + f + ' must render');
    }
    for(const a of crops.slice(cropStart))if(a[0]===im){assert.ok(a[1]>=0&&a[2]>=0&&a[1]+a[3]<=im.naturalWidth&&a[2]+a[4]<=im.naturalHeight);cells.add(a[1]+','+a[2])}
    assert.equal(cells.size, 8, 'all eight keyframes contribute');
    ctx.clearRect(0, 0, 300, 300); kit.draw({ kind }, 1, { x: 150, y: 220 }, null, ctx, { w: 70 });
    assert.ok(ctx.getImageData(0, 0, 300, 300).data.every(v => v === 0), 'effect ends transparently');
    kit.setChoice(kind, 'old'); assert.equal(kit.choiceOf(kind), 'old');
    kit.setChoice(kind, 'new'); assert.equal(kit.choiceOf(kind), 'new');
  }
  const hybrid = setup();
  await Promise.all(hybrid.images.map(im => im.decode()));
  for (const kind of ['lightning', 'ice']) {
    const active = new Set();
    const probe = createCanvas(300, 350).getContext('2d');
    const paint = probe.drawImage.bind(probe);
    probe.drawImage = (...args) => {
      if (args[0].src === 'assets/fx/anim/twelve-strike.webp') active.add(args.slice(1, 3).join(','));
      return paint(...args);
    };
    for (let f = 0; f <= 60; f++)
      assert.ok(hybrid.kit.draw({ kind, seed: 17 }, f / 60, { x: 150, y: 285 }, null, probe, { w: 60 }));
    assert.equal(active.size, 12, kind + ' plays all twelve distinct painted cells');
  }
  const migrated = setup({ values: { 'vfx-kit-kinds': '{"sword":"old","lightning":"painted8"}', 'vfx-kit': '1' } }).kit;
  assert.equal(migrated.choiceOf('sword'), 'drawnSequence');
  assert.equal(migrated.choiceOf('lightning'), 'drawnImpact');
  migrated.setChoice('sword', 'old');
  assert.equal(migrated.choiceOf('sword'), 'old');
  migrated.resetChoices();
  assert.equal(migrated.choiceOf('sword'), 'drawnSequence');
  for (const [kind, color] of [['fire'], ['wind'], ['water'], ['earth'], ['dark'], ['shield'], ['heal', '#7fe0a0'], ['heal', '#ffe08a']]) {
    const offsets = new Set(), probe = createCanvas(300, 350).getContext('2d');
    const paint = probe.drawImage.bind(probe);
    probe.drawImage = (...args) => {
      if (/twelve-(?:elements|support)\.webp$/.test(args[0].src)) offsets.add(args.slice(1, 3).join(','));
      return paint(...args);
    };
    const e = { kind, color, seed: 17 };
    assert.equal(hybrid.kit.paintedState(e, 'drawnSequence'), 'ready');
    for (let f = 0; f < 60; f++)
      assert.ok(hybrid.kit.draw(e, f / 60, { x: 150, y: 285 }, null, probe, { w: 60 }));
    assert.equal(offsets.size, 12, kind + ' plays each new frame');
  }
  const pending = setup({ loading: true }).kit;
  assert.equal(pending.draw({ kind: 'ice' }, .4, { x: 10, y: 20 }, null, ctx, { w: 60 }), false, 'loading falls back');
  assert.equal(setup({ search: '?vfx=old' }).kit.choiceOf('ice'), 'old');
  assert.equal(setup({ search: '?vfx=new' }).kit.choiceOf('ice'), 'new');
  const rm = setup({ reduced: true }); await Promise.all(rm.images.map(im => im.decode()));
  const selected = [];
  const spy = { globalAlpha: 1, save() {}, restore() {}, translate() {}, drawImage(...a) { selected.push(a.slice(1, 5).join(',')); } };
  for (const t of [.1, .3, .8]) rm.kit.draw({ kind: 'ice', from: {} }, t, { x: 150, y: 220 }, { x: 10, y: 10 }, spy, { w: 70 });
  assert.equal(new Set(selected).size, 1, 'reduced motion holds one frame without travel');
  console.log('PASS painted spells: eight real WebP sheets / 64 frames; bounded cells, stable anchors, lifetime, fallback, preferences and reduced motion');
})().catch(e => { console.error(e); process.exitCode = 1; });
