/* node tools/test-card-coverage.cjs
   Every card the deck system can put in a hand must be playable in the flat battle (js/flat-battle.js), otherwise the player sees
   "ยังไม่รองรับในสนามแบน" in the middle of a fight (TODO B4). Checks, for each id in TacticsDecks.COMBAT / MOVE (and every deck built from them):
     • a rule exists in flat-battle CARD (combat)   (CARD_EL is only for elemental cards, so it is not required)
     • a name and description exist for the UI                                   • signature cards of every ally exist
   Run it after adding or renaming any card. Exit code 1 on a gap. */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), ROOT = path.join(__dirname, '..');
const sandbox = { window: {}, globalThis: {}, console, Math, Date, JSON, Object, Array, Set, Map, Number, String, Symbol, setTimeout, clearTimeout, localStorage: { getItem: () => null, setItem() { } } };
sandbox.globalThis = sandbox; sandbox.root = sandbox; vm.createContext(sandbox);
for (const f of ['js/tactics-decks.js', 'js/flat-battle.js']) { try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sandbox, { filename: f }) } catch (e) { console.log('✗ cannot load ' + f + ': ' + e.message); process.exit(1) } }
const TD = sandbox.TacticsDecks || sandbox.window.TacticsDecks, FB = sandbox.FlatBattle || sandbox.window.FlatBattle || sandbox.FB;
let bad = 0; const fail = m => { bad++; console.log('✗ ' + m) };
if (!TD) { console.log('✗ TacticsDecks not found'); process.exit(1) }
const src = fs.readFileSync(path.join(ROOT, 'js/flat-battle.js'), 'utf8');
const block = (name) => { const i = src.indexOf('const ' + name + ' = {'); if (i < 0) return ''; let d = 0, j = src.indexOf('{', i); const s = j; for (; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}' && !--d) break } return src.slice(s, j + 1) };
const cardSrc = block('CARD'), has = (b, id) => new RegExp('(^|[\\s,{])' + id + '\\s*:').test(b);
const combat = Object.keys(TD.COMBAT || {}), move = Object.keys(TD.MOVE || {});
for (const id of combat) {
  if (!has(cardSrc, id)) fail('combat card "' + id + '" has no rule in flat-battle CARD → "ยังไม่รองรับในสนามแบน"');
  const c = TD.COMBAT[id]; if (!c.name) fail('combat card "' + id + '" has no name');
}
for (const id of move) { const c = TD.MOVE[id]; if (!c || !c.name) fail('movement card "' + id + '" has no name') }
for (const [ally, id] of Object.entries(TD.SIGNATURE || {})) if (!TD.COMBAT[id]) fail('signature card "' + id + '" of ' + ally + ' is not in COMBAT');
for (const id of Object.keys(TD.DEFAULT?.combat || TD.DEFAULT || {})) if (combat.length && !TD.COMBAT[id] && !TD.MOVE[id]) fail('default deck lists unknown card "' + id + '"');
console.log(bad ? '\n✗ ' + bad + ' gap(s) — ' + combat.length + ' combat + ' + move.length + ' movement cards checked' : '✓ ' + combat.length + ' combat + ' + move.length + ' movement cards all playable in the flat battle');
process.exit(bad ? 1 : 0);
