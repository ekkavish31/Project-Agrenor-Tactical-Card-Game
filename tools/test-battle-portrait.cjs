/* node tools/test-battle-portrait.cjs — พอร์เทรตในฉากต่อสู้: อารมณ์ตามท่า · เลือกภาพจริง/โค้ด · อาชีพ */
global.window = global; const BP = require('../js/battle-portrait.js'); const fs = require('fs'), path = require('path');
let ok = 0, bad = 0; const t = (n, c) => { if (c) ok++; else { bad++; console.log('FAIL', n) } };
const hero = { id: 'hero', side: 'hero', hp: 30, maxHp: 60, pose: 'idle', look: { icon: '⚔' } };
t('idle → idle', BP.mood(hero, 0) === 'idle');
for (const [p, m] of [['windup', 'attack'], ['strike', 'attack'], ['cast', 'attack'], ['hit', 'hurt'], ['guard', 'guard']]) { hero.pose = p; t(p + ' → ' + m, BP.mood(hero, 0) === m) }
hero.pose = 'idle'; hero.mood = 'heal'; hero.moodUntil = 100; t('mood override live', BP.mood(hero, 50) === 'heal'); t('mood override expires', BP.mood(hero, 150) === 'idle');
hero.hp = 0; t('hp 0 → down', BP.mood(hero, 0) === 'down'); hero.hp = 30;
t('jobOf icon', BP.jobOf(hero) === 'warrior' && BP.jobOf({ look: { icon: '✶' } }) === 'mage' && BP.jobOf({ look: { icon: '⛨' } }) === 'guardian');
t('jobOf ally by weapon', BP.jobOf({ key: 'luna', side: 'hero' }) === 'mage' && BP.jobOf({ key: 'mil', side: 'hero' }) === 'rogue');
t('jobOf monster none', BP.jobOf({ side: 'monster', kind: 'goblin' }) === null);
t('jobOf recruit default', BP.jobOf({ key: 'someone', side: 'hero' }) === 'adventurer');
const exists = f => fs.existsSync(path.join(__dirname, '..', f));
/* every real picture the face() map can point at must exist */
for (const look of ['male', 'female']) for (const m of BP.MOODS) { const f = BP.face({ id: 'hero', side: 'hero', key: 'hero' }, m, { look }); t('hero real ' + look + ' ' + m, f.kind === 'real' && exists(f.src)) }
for (const k of ['hilda', 'lin', 'guard']) for (const m of BP.MOODS) { const f = BP.face({ key: k, side: 'hero' }, m, {}); t(k + ' real ' + m, f.kind === 'real' && exists(f.src)) }
for (const k of ['kier', 'bram', 'luna', 'mil']) { const f = BP.face({ key: k, side: 'hero' }, 'idle', {}); t(k + ' still', f.kind === 'still' && exists(f.src)) }
t('monster uses en-portrait', BP.face({ side: 'monster', kind: 'goblin' }, 'idle', {}).src === 'assets/cards/portraits/en-goblin.webp');
/* no DOM in node: a recruit falls back to the standing picture (browser draws the code bust) */
t('recruit fallback without canvas', BP.face({ key: 'zed', side: 'hero' }, 'idle', {}).kind === 'still');
t('specFor deterministic', JSON.stringify(BP.specFor({ key: 'zed' })) === JSON.stringify(BP.specFor({ key: 'zed' })));
t('every mood has a label slot', BP.MOODS.every(m => m in BP.LABEL));
t('7 job colours', Object.keys(BP.JOB_COL).length === 7 && Object.keys(BP.JOB_ICON).length === 7);
console.log(ok + ' ok' + (bad ? ', ' + bad + ' FAILED' : '')); process.exit(bad ? 1 : 0);
