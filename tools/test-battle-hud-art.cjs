const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const root = path.join(__dirname, '..'), read = f => fs.readFileSync(path.join(root, f), 'utf8');
function element(id) {
  const classes = new Set();
  const e = { id, dataset: {}, attributes: {}, caption: { innerHTML: '' }, badge: { textContent: '0' },
    classList: { add: x => classes.add(x), contains: x => classes.has(x), toggle(x, on) { if (on) classes.add(x); else classes.delete(x) } },
    setAttribute(k, v) { this.attributes[k] = v }, querySelector(s) { return s === '.fb-control-label' ? this.caption : s === '.fb-pile-count' ? this.badge : null } };
  return e;
}
const handlers = {}, vars = {}, nodes = Object.fromEntries(['fbEnd', 'fbUndo', 'fbAuto', 'fbCrSt', 'fbCrDraw', 'gridBtn', 'fbMenu'].map(id => [id, element(id)]));
let observer, disconnected = false;
const ctx = { innerHeight: 800, document: { documentElement: { style: { setProperty(k, v) { vars[k] = v } } } },
  addEventListener(k, fn) { handlers[k] = fn }, removeEventListener(k) { delete handlers[k] },
  ResizeObserver: class { constructor(fn) { observer = fn } observe(e) { this.element = e } disconnect() { disconnected = true } } };
ctx.window = ctx; vm.createContext(ctx); vm.runInContext(read('js/battle-hud-art.js'), ctx); const A = ctx.BattleHudArt;
const actions = element('fbActions'); actions.querySelector = s => nodes[s.slice(1)]; A.mountControls(actions);
assert(actions.classList.contains('fb-art-controls'));
for (const n of Object.values(nodes)) { assert(n.classList.contains('fb-art-button')); assert(n.innerHTML.includes('assets/ui/battle-actions/')); }
const click = () => {}; nodes.fbAuto.onclick = click;
A.skinButton(nodes.fbAuto, 'stop', 'หยุด Auto'); assert(nodes.fbAuto.innerHTML.includes('auto-stop.webp')); assert.equal(nodes.fbAuto.onclick, click);
A.skinButton(nodes.fbAuto, 'auto', 'Auto'); assert(nodes.fbAuto.innerHTML.includes('auto-play.webp'));
for (const kind of ['draw', 'discard']) {
  const pile = element(kind === 'draw' ? 'fbDraw' : 'fbDiscard'); pile.innerHTML = A.pileHTML(kind); const html = pile.innerHTML;
  A.syncPile(pile, 18); assert.equal(pile.badge.textContent, '18'); assert.equal(pile.innerHTML, html, 'count updates must preserve the pile image');
  A.syncPile(pile, 0); assert(pile.classList.contains('empty')); assert(pile.attributes['aria-label'].includes('0 ใบ'));
  A.syncPile(pile, 3); assert(!pile.classList.contains('empty')); assert.equal(pile.badge.textContent, '3');
}
let top = 500; A.reserveHand({ getBoundingClientRect: () => ({ top }) }); assert.equal(vars['--fb-actions-bottom'], '324px');
top = 420; observer(); assert.equal(vars['--fb-actions-bottom'], '404px', 'card height changes keep all controls above the hand');
ctx.innerHeight = 480; top = 290; handlers.resize(); assert.equal(vars['--fb-actions-bottom'], '214px', 'short viewport recalculates the safe offset');
handlers.pagehide(); assert(disconnected); assert(!handlers.resize);
const source = read('js/town-battle.js'), grid = element('gridBtn');
const gctx = { document: { getElementById: () => grid }, localStorage: { setItem() {} } };
vm.runInNewContext('let GRID;\n' + source.match(/  function gridSet\(on\).*\n/)[0] + '\nthis.set=gridSet;', gctx);
gctx.set(false); assert.equal(grid.attributes['aria-pressed'], 'false'); assert(grid.title.includes('แสดง'));
gctx.set(true); assert.equal(grid.attributes['aria-pressed'], 'true'); assert(grid.title.includes('ซ่อน'));
assert(source.includes('<button id="gridBtn"'), 'grid belongs to the HUD action markup');
assert(!source.includes("gb.id = 'gridBtn'"), 'no second floating grid control');
assert(!source.includes('#gridBtn{position:fixed'), 'no fixed grid overlay over cards');
const manifest = JSON.parse(read('data/asset-manifest.json'));
for (const a of manifest.assets.filter(a => a.id.startsWith('ui-battle-'))) assert(fs.existsSync(path.join(root, a.file)), a.file);
console.log('PASS painted buttons/auto state, live pile counts, responsive hand clearance, cleanup and grid toggle placement');
