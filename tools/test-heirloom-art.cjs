// Identity must survive inventory -> battle profile -> held/carried rendering without changing knife rules.
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm'), assert = require('node:assert/strict');
const ROOT = path.join(__dirname, '..'), read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
function context(saved) {
  const c = { console, setTimeout() {}, clearTimeout() {}, RECIPES: {}, localStorage: { getItem: k => k === 'card-studio-v1' ? saved || null : null, setItem() {} }, document: { addEventListener() {}, querySelectorAll: () => [] }, addEventListener() {} };
  c.window = c; vm.createContext(c);
  for (const f of ['js/asset-manifest.js', 'js/weapons.js', 'js/tactics-decks.js', 'js/tactics-core.js', 'js/adventure-data.js', 'js/card-design.js', 'js/card-studio.js']) vm.runInContext(read(f), c, { filename: f });
  return c;
}
const c = context(), old = { id: 1, kind: 'knife', recipe: 'oldKnife', quality: 1 }, normal = { id: 2, kind: 'knife', recipe: 'knife', quality: 1 };
assert.equal(c.weaponImg(old), 'assets/weapons/oldKnife.webp');
assert.equal(c.weaponImg(normal), 'assets/weapons/knife.webp');
assert.equal(c.CardStudio.cardById('oldKnife').art.src, c.weaponImg(old));
assert.equal(c.CardStudio.cardById('e-knife').art.src, c.weaponImg(normal));
assert(c.CardStudio.renderCard('oldKnife').includes('assets/weapons/oldKnife.webp'));
assert(c.CardStudio.renderCard('c-momWater').includes('assets/cards/item/momWater-glass.webp'));
const design = c.CardStudio.design(), raw = { ...design, version: 2, cards: Object.fromEntries(design.cards.map(x => [x.id, x])), order: design.cards.map(x => x.id) };
raw.cards['c-momWater'].art.src = 'assets/cards/item/momWater.webp';
assert.equal(context(JSON.stringify(raw)).CardStudio.cardById('c-momWater').art.src, 'assets/cards/item/momWater-glass.webp');
raw.cards['c-momWater'].art.src = 'assets/custom-water.webp';
assert.equal(context(JSON.stringify(raw)).CardStudio.cardById('c-momWater').art.src, 'assets/custom-water.webp');
raw.cards['c-momWater'].art.src = 'assets/cards/item/momWater.webp'; raw.cards['c-momWater'].art.data = 'data:image/png;base64,custom';
assert.equal(context(JSON.stringify(raw)).CardStudio.cardById('c-momWater').art.data, raw.cards['c-momWater'].art.data);
const P = require('../js/progression.js'), g = { hp: 60, inventory: [old, normal], equipped: 1, village: { character: { level: 1, xp: 0, points: 0, stats: {} } } };
const hero = P.battleHero(g); assert.equal(hero.weapon, 'knife'); assert.equal(hero.weaponArt, 'oldKnife');
const param = JSON.parse(new URLSearchParams(P.battleParam(g)).get('hero')); assert.equal(param.weaponArt, 'oldKnife');
g.equipped = 2; const other = P.battleHero(g); assert.equal(other.weapon, 'knife'); assert.equal(other.weaponArt, null);
g.equipped = null; assert.equal(P.battleHero(g).weaponArt, null);
vm.runInContext(read('js/tactics-sprites.js'), c);
const A = vm.runInContext('TACTICS_SPRITES', c), source = read('js/town-battle.js');
vm.runInContext(source.match(/const WEXTRA = .*?;/)[0] + '\n' + source.match(/const weaponDef = .*?};/)[0] + '\nthis.resolveWeapon=weaponDef;', c);
for (const dir of ['SW', 'SE', 'NW', 'NE']) {
  const u = { ...hero, dir };
  assert.equal(c.resolveWeapon(A, u.weapon, u).src, 'assets/tactics/oldKnife.webp');
  assert.equal(c.resolveWeapon(A, u.weapon, u, true).src, 'assets/tactics/oldKnife-sheathed.webp');
  assert.equal(c.resolveWeapon(A, 'knife', { ...other, dir }).src, 'assets/tactics/knife.webp');
}
assert.equal(c.resolveWeapon(A, 'sword', { weaponArt: 'oldKnife' }).src, A.equipment.sword.src);
for (const k of ['oldKnife', 'oldKnife-sheathed']) {
  const def = A.equipment[k]; assert(fs.existsSync(path.join(ROOT, def.src)));
  assert(def.pivot.every(n => n > 0 && n < 1)); assert.equal(def.scale, .34);
}
console.log('PASS heirloom card + water migration/custom art + equip/swap profile + four-direction held/carried identity');
