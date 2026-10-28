// v93.05 height cards: dive · rockfall · perch · climb, and height effects on push (fall) and quake.
const assert=require('node:assert/strict');const D=require('../js/tactics-decks.js'),C=require('../js/tactics-core.js');let n=0;const test=(s,f)=>{f();n++;console.log('PASS',s)};
// a flat open field with the hero at (5,5), one enemy, and the given card in hand slot 0
function field(card,{heroH=0,foeAt=[6,5],foeH=0}={}){let s=C.create('h93','forest','training');for(let t of s.map.tiles)Object.assign(t,{h:0,kind:'grass',prop:null,blocked:false,obstacleHeight:0});
 for(let u of s.units)if(u.side==='enemy'&&u!==s.enemy)u.hp=0;let e=s.enemy;Object.assign(s.hero,{x:5,y:5,stamina:100,hp:s.hero.maxHp,guard:0});Object.assign(e,{x:foeAt[0],y:foeAt[1],hp:200,maxHp:200,guard:0,reaction:null});
 C.at(s.map,5,5).h=heroH;C.at(s.map,foeAt[0],foeAt[1]).h=foeH;s.phase='player';s.outcome=null;s.deck.combatUsed=0;s.deck.moveUsed=0;s.deck.combat.hand[0]={id:card,uid:card+'-t',used:false};s.rng=()=>.5;return s}
const hit=s=>{let e=s.enemy,b=e.hp,r=C.playCombat(s,0,e);return {r,dmg:b-e.hp}};
test('every new card is a real deck card with rules',()=>{for(const id of ['rockfall','perch','climb'])assert(D.COMBAT[id]&&C.COMBAT_RULES[id]&&C.cardInfo(field('attack'),id))});
test('dive: may strike 3 levels down (normal melee cannot)',()=>{let s=field('dive',{heroH:3});assert.equal(C.combatReason(s,0,s.enemy),'');s.deck.combat.hand[0]={id:'attack',uid:'a',used:false};assert.notEqual(C.combatReason(s,0,s.enemy),'')});
test('dive: hits harder the higher you are (+25% per level, capped at 3)',()=>{let lo=hit(field('dive',{heroH:1})).dmg,hi=hit(field('dive',{heroH:3})).dmg,flat=hit(field('dive')).dmg;assert(hi>lo&&lo>flat,`${flat} < ${lo} < ${hi}`)});
test('dive: cannot strike a target 2+ levels above',()=>{let s=field('dive',{foeH:2});assert.match(C.combatReason(s,0,s.enemy),/สูงกว่าเกินไป|ต่างระดับ/)});
test('rockfall: needs higher ground',()=>{let s=field('rockfall',{foeAt:[7,5]});assert.match(C.combatReason(s,0,s.enemy),/สูงกว่าเป้า/)});
test('rockfall: range 3, more damage per level, slows',()=>{let a=field('rockfall',{heroH:1,foeAt:[8,5]}),b=field('rockfall',{heroH:3,foeAt:[8,5]});let ra=hit(a),rb=hit(b);assert(ra.r.ok&&rb.r.ok);assert(rb.dmg>ra.dmg,`${ra.dmg} < ${rb.dmg}`);assert(b.enemy.statuses?.slow||a.enemy.statuses?.slow)});
test('perch: doubles the height bonus when striking down',()=>{let plain=field('attack',{heroH:1}),p=field('attack',{heroH:1});p.hero.perch=2;assert(hit(p).dmg>hit(plain).dmg)});
test('perch: played as a card gives guard and lasts until the end of the next turn',()=>{let s=field('perch');let r=C.playCombat(s,0,s.hero);assert(r.ok);assert.equal(s.hero.perch,2);assert(s.hero.guard>=6)});
test('climb: a 2-level step is walkable only with climb, and uphill costs no extra',()=>{let s=field('climb');C.at(s.map,5,4).h=2;let k=C.key(5,4);assert(!C.reachable(s.map,s.hero,4,[]).costs.has(k));assert(C.playCombat(s,0,s.hero).ok);let r=C.reachable(s.map,s.hero,4,[]);assert(r.costs.has(k));assert.equal(r.costs.get(k),1)});
test('push: a target shoved off a ledge takes fall damage',()=>{let flat=field('push',{foeAt:[6,5]}),edge=field('push',{foeAt:[6,5],foeH:2});C.at(edge.map,5,5).h=2;C.at(edge.map,7,5).h=0;let a=hit(flat),b=hit(edge);assert(b.dmg>a.dmg,`${a.dmg} < ${b.dmg}`);assert(b.r.notes.some(x=>/ตกลง/.test(x)))});
test('quake: enemies below you take ×1.5',()=>{let flat=field('quake'),low=field('quake',{heroH:1});assert(hit(low).dmg>hit(flat).dmg)});
console.log(n+' height card tests passed');
