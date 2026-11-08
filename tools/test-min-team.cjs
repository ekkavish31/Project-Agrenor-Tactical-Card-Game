/* node tools/test-min-team.cjs
   "Minimum team of two" (brother + sister from the first minute) must work in every system that lists party members.
   Checks the logic that can be checked without a browser:
     • every member the party can hold (hero, sibling, recruits, original companions) has a Companions.info() entry (deck builder, rewards, XP)
     • every one of them gets a valid deck from TacticsDecks.defaultFor()
     • the sibling has battle stats in js/village-life.js (ALLY_STATS) and a ready party entry in js/world-state.js
     • the deck builder lists the party through Companions.info (not ROSTER only — that hid the sibling before v98.274)
   Exit code 1 on a gap. */
'use strict';
const fs = require('fs'), path = require('path'), ROOT = path.join(__dirname, '..'), read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
global.window = global; global.s = { village: { party: [] } };
require('../js/tactics-decks.js'); require('../js/companions.js');
let bad = 0; const fail = m => { bad++; console.log('✗ ' + m) }, ok = m => console.log('✓ ' + m);
const KEYS = ['sib', 'luna', 'bram', 'kier', 'mil', 'sigrid', 'ren', 'nadia', 'orla', 'olwen'];
for (const k of KEYS) {
  const info = window.Companions.info(k); if (!info) { fail(k + ': no Companions.info (not listed in the deck builder / XP rewards)'); continue }
  try { const d = window.TacticsDecks.defaultFor(k), v = window.TacticsDecks.validate(d); if (v && v.ok === false) fail(k + ': default deck invalid ' + JSON.stringify(v.errors || v).slice(0, 80)) } catch (e) { fail(k + ': defaultFor threw ' + e.message) }
}
if (!bad) ok(KEYS.length + ' party members: info + valid default deck');
const vl = read('js/village-life.js');
/sib:\s*\{[\s\S]{0,260}?hp:\s*\d+/.test(vl) ? ok('sibling has battle stats in village-life.js') : fail('sibling has no battle stats (ALLY_STATS.sib)');
/Companions\?\.info\(c\.key\)/.test(read('js/tactics-deckbuilder.js')) ? ok('deck builder lists party via Companions.info') : fail('deck builder uses ROSTER only — recruits/sibling are missing');
/sib/.test(read('js/world-state.js')) ? ok('world-state knows the sibling (party seed)') : fail('world-state has no sibling party entry');
console.log(bad ? '\n✗ ' + bad + ' gap(s)' : '\n✓ minimum-team checks passed'); process.exit(bad ? 1 : 0);
