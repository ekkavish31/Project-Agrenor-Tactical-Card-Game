/* v98.474 · MAIN STORY framework (phase B · docs/lore/MAIN-STORY-CANON.md · docs/STORY-FINAL-DRAFT-TH.md §7 N1 + N2).
   ONE place that knows where the main story is, so every other system (shops, town events, factions, the world map, Mip, the mine) asks it instead of keeping its own flags.
   • stage    — where the story is: a list of milestones (STAGES), moved forward only. NOT a clock: nothing advances with the day count (Canon D: no countdown).
   • flags    — free booleans/numbers the later systems write (g.village.main.flags).
   • war      — 0…4 how loud the war with the northern kingdom is (Canon A1): 0 nothing · 1 rumours · 2 the front opens · 3 arms and prisoners · 4 the infected reach the front.
   • infection(g, settlementId) — 0…3 how strong the infection is around a place; a gradient from the mine (Canon A5: dense near the mine, thin far away).
   • signs(g) — the lines the world says about the war right now (for news boards, town events, villager talk).
   • reveal(g, key) — which factions / names may appear yet (Canon: the northern kingdom, the light wardens, the shadow hunters appear as the story opens them).
   Save: g.village.main = { stage:'intro', flags:{}, at:{stageId:day} } — created lazily, absent = the main story has not started (old saves load unchanged).
   Pure functions on the save object → tools/test-main-story.cjs. Nothing here draws anything. */
(function (root) {
  'use strict';
  const num = (x, d = 0) => Number.isFinite(+x) ? +x : d;
  /* spoiler = the level of docs/lore/MAIN-STORY-CANON.md S0…S3 this stage may show · war / inf = world variables while the story is here · log = chronicle id written on entering */
  const STAGES = [
    { id: 'intro', name: 'บทนำที่เฟิร์นเวล', spoiler: 0, war: 0, inf: 0 },
    { id: 'free', name: 'หลังบทนำ · เล่นอิสระ', spoiler: 0, war: 1, inf: 0, log: 'war.rumor' },
    { id: 'signs', name: 'สงครามเริ่มส่งเสียง', spoiler: 1, war: 2, inf: 1, log: 'war.signs' },
    { id: 'wake', name: 'ปลอกคอเริ่มโผล่', spoiler: 1, war: 2, inf: 1, log: 'mage.wake' },
    { id: 'release', name: 'การปลดปล่อย', spoiler: 2, war: 3, inf: 2, log: 'war.arms' },
    { id: 'chase', name: 'ตามรอย', spoiler: 2, war: 3, inf: 2 },
    { id: 'mine', name: 'เหมือง', spoiler: 3, war: 4, inf: 3, log: 'war.front' },
    { id: 'climax', name: 'ไคลแมกซ์', spoiler: 3, war: 4, inf: 3 },
    { id: 'end', name: 'หลังเรื่องหลัก', spoiler: 3, war: 0, inf: 0 }
  ];
  const IDX = Object.fromEntries(STAGES.map((d, i) => [d.id, i]));
  const WAR = ['ไม่มีข่าวสงคราม', 'ข่าวลือจากด่านเหนือ', 'แนวรบเปิดแล้ว', 'อาวุธใหม่และขบวนนักโทษ', 'ผู้ติดเชื้อหลุดถึงแนวรบ'];
  /* distance from the mine (the lower levels of Deepcairn · Canon A3): 0 = at the mine. level = clamp(stage.inf − distance, 0, 3) */
  const DIST = { deepcairn: 0, thornwatch: 1, fernvale: 1, willowshore: 2, lakenhold: 2, northgate: 2, brookmere: 3, haven: 3, vinehollow: 3 };
  /* what the world says, by war phase (each line only needs to be true from that phase on) */
  const SIGNS = [
    { war: 1, id: 'rumor', text: 'ผู้เดินทางพูดถึงการรบที่ด่านเหนือ แต่ยังไม่มีใครรู้เรื่องจริง' },
    { war: 2, id: 'tax', text: 'ภาษีขึ้น ราคาเหล็กและเกลือแพงขึ้น' },
    { war: 2, id: 'draft', text: 'ป้ายเรียกเกณฑ์ทหารติดอยู่ที่ลานกลางหมู่บ้าน' },
    { war: 2, id: 'refugee', text: 'ผู้อพยพจากแดนเหนือเริ่มมาถึง' },
    { war: 3, id: 'convoy', text: 'ขบวนนักโทษถูกพาผ่านถนนหลวง ไม่มีใครบอกว่าไปไหน' },
    { war: 3, id: 'arms', text: 'ทหารหลวงถืออาวุธเงาวับแปลกตา' },
    { war: 3, id: 'miners', text: 'คนงานเหมืองดีปแคร์นบอกว่าชั้นล่างปิด แต่ยังได้ยินเสียงขุด' },
    { war: 4, id: 'infected', text: 'มีข่าวสัตว์ผิดปกติโจมตีทั้งสองกองทัพ' }
  ];
  /* factions / names that appear only once the story has opened them */
  const REVEAL = { north: 2, light: 3, shadow: 3, supply: 4 };   // value = minimum war phase… for light/shadow/supply see reveal()

  const raw = g => g?.village?.main || null;
  function st(g) { const v = (g.village ||= {}); const m = (v.main ||= { stage: 'intro', flags: {}, at: {} }); m.flags ||= {}; m.at ||= {}; if (!(m.stage in IDX)) m.stage = 'intro'; return m }
  const index = g => { const m = raw(g); return m ? IDX[m.stage] ?? 0 : 0 };
  const stage = g => STAGES[index(g)];
  const is = (g, id) => stage(g).id === id;
  const atLeast = (g, id) => index(g) >= IDX[id];
  const flag = (g, k) => raw(g)?.flags?.[k];
  function set(g, k, v = true) { st(g).flags[k] = v; return v }
  const war = g => stage(g).war + (num(flag(g, 'warBoost')) | 0) > 4 ? 4 : stage(g).war + (num(flag(g, 'warBoost')) | 0);
  const warText = g => WAR[war(g)];
  function infection(g, settlementId) { const d = DIST[settlementId]; if (d == null) return 0; return Math.max(0, Math.min(3, stage(g).inf - d)) }
  const signs = g => SIGNS.filter(x => x.war <= war(g));
  /* may this name / faction appear yet? north = once the front opens · light / shadow = once the wardens' trail has begun (stage wake+) · supply = only after the clique is exposed (flag) */
  function reveal(g, key) {
    if (key === 'north') return war(g) >= 2;
    if (key === 'light' || key === 'shadow') return atLeast(g, 'wake') || !!flag(g, 'rangersSeen');
    if (key === 'supply') return !!flag(g, 'supplyExposed');
    return true;
  }
  function log(g, id) { try { root.Titles?.log?.(g, id) } catch (e) { } }
  function toast(m) { try { (root.StoryToast || root.parent?.StoryToast)?.(m, 'quest') } catch (e) { } }
  /* move forward to a stage (never backwards). Writes the chronicle line of every stage passed, once. returns true when it moved */
  function advanceTo(g, id, opt = {}) {
    if (!(id in IDX)) return false; const m = st(g), from = IDX[m.stage], to = IDX[id]; if (to <= from) return false;
    for (let i = from + 1; i <= to; i++) { const d = STAGES[i]; m.stage = d.id; m.at[d.id] = num(g.day, 1); if (d.log) log(g, d.log) }
    if (!opt.silent) toast('📰 ' + stage(g).name);
    return true;
  }
  /* called by the game every so often: the milestones that the game can tell by itself. Later phases add their own through advanceTo(). */
  function check(g) {
    if (!g?.village) return false; let moved = false;
    const intro = g.village.story?.mode === 'done';
    if (is(g, 'intro') && intro) moved = advanceTo(g, 'free', { silent: true }) || moved;
    if (is(g, 'free') && num(g.village.character?.level, 1) >= 5) moved = advanceTo(g, 'signs') || moved;
    return moved;
  }
  const api = { STAGES, WAR, DIST, SIGNS, state: st, stage, index, is, atLeast, flag, set, war, warText, infection, signs, reveal, advanceTo, check };
  root.MainStory = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
