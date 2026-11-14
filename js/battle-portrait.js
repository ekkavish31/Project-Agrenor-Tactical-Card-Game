/* v98.494 · พอร์เทรตในฉากต่อสู้ (ตลอดเทิร์น) — ผู้ลงมือ + เป้าหมาย สีหน้าเปลี่ยนตามจังหวะแอคชั่น
   BattlePortrait.mood(u, t)        → 'idle'|'attack'|'hurt'|'guard'|'heal'|'down'|'win'  (อ่านจาก u.pose / u.moodUntil / hp)
   BattlePortrait.face(u, mood, o)  → { src, pos, size, kind:'real'|'still'|'code' }   (ใช้ภาพจริงถ้ามี · ไม่มีก็วาดด้วยโค้ดตามอาชีพ)
   BattlePortrait.jobOf(u)          → id อาชีพ (จาก u.look.icon / ตารางเพื่อนร่วมทาง)
   BattlePortrait.bust(spec, mood)  → data URL 128×128 (cache) — ใบหน้าครึ่งตัว + เครื่องประดับศีรษะประจำอาชีพ
   ภาพจริงที่มี: hero-<male|female>-<neutral|angry|calm|happy|sad|worry>.webp · hilda/lin/guard-<neutral|angry|happy|surprised>.webp
   ตัวที่มีแค่ภาพนิ่ง (เพื่อน/มอนสเตอร์) ใช้เอฟเฟกต์ CSS (สั่น · แดง · เรืองฟ้า · เรืองเขียว · เทา) แทนสีหน้า */
(function (root) {
  'use strict';
  const JOB_BY_ICON = { '✦': 'adventurer', '⚔': 'warrior', '➶': 'ranger', '✶': 'mage', '✚': 'cleric', '☾': 'rogue', '⛨': 'guardian' };
  const JOB_COL = { adventurer: '#8a9a6a', warrior: '#c8402e', ranger: '#3f8f3a', mage: '#7a4fd0', cleric: '#d8c06a', rogue: '#4a4f74', guardian: '#4f7fb0' };
  const JOB_ICON = { adventurer: '✦', warrior: '⚔', ranger: '➶', mage: '✶', cleric: '✚', rogue: '☾', guardian: '⛨' };
  /* เพื่อนร่วมทาง: อาชีพตามอาวุธที่ถืออยู่ในฉาก (ค้อน/ดาบ/มีด/คทา/ขวาน) — ไม่ใช่ข้อมูลเนื้อเรื่องใหม่ */
  const ALLY = {
    bram: { job: 'warrior', skin: '#c99a74', hair: '#8a4a2a', cloth: '#8a5a3a', beard: 1 },
    kier: { job: 'warrior', skin: '#d8b08c', hair: '#3a2a22', cloth: '#5a6a8a' },
    luna: { job: 'mage', skin: '#ecd0b4', hair: '#e8e0f0', cloth: '#6a4aa8', long: 1 },
    mil: { job: 'rogue', skin: '#d9b28e', hair: '#2a2230', cloth: '#3a4a5a' },
    sigrid: { job: 'warrior', skin: '#e8c9a8', hair: '#e8d28a', cloth: '#7a4a3a', long: 1 }
  };
  const REAL_SET = { hilda: 1, lin: 1, guard: 1 };
  const HERO_EXPR = { idle: 'neutral', attack: 'angry', hurt: 'worry', guard: 'calm', heal: 'happy', win: 'happy', down: 'sad' };
  const NPC_EXPR = { idle: 'neutral', attack: 'angry', hurt: 'surprised', guard: 'neutral', heal: 'happy', win: 'happy', down: 'surprised' };
  const LABEL = { idle: '', attack: 'ลงมือ!', hurt: 'เจ็บ!', guard: 'ตั้งรับ', heal: 'ฟื้นฟู', win: 'ชนะ', down: 'ล้ม' };
  const cache = {};
  const hash = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h };
  const SKINS = ['#e8c9a8', '#d9b08c', '#c99a74', '#b88a6a', '#f0d8b8'], HAIRS = ['#2e2a26', '#6a4a2a', '#a8742a', '#cfcfd6', '#8a3a2a', '#e8d28a'], CLOTHS = ['#6a7a5a', '#5a6a8a', '#8a6a4a', '#7a5a6a', '#4a6a6a'];

  function jobOf(u) {
    if (!u) return 'adventurer';
    const ic = u.look?.icon; if (ic && JOB_BY_ICON[ic]) return JOB_BY_ICON[ic];
    if (u.job && JOB_COL[u.job]) return u.job;
    return ALLY[u.key]?.job || (u.side === 'monster' ? null : 'adventurer');
  }
  function mood(u, t) {
    if (!u) return 'idle';
    if (u.hp <= 0) return 'down';
    if (u.mood && u.moodUntil > t) return u.mood;
    const p = u.pose;
    return p === 'windup' || p === 'strike' || p === 'cast' ? 'attack' : p === 'hit' ? 'hurt' : p === 'guard' ? 'guard' : 'idle';
  }
  function specFor(u) {
    const a = ALLY[u.key], h = hash(u.key || u.name || 'x');
    if (a) return { skin: a.skin, hair: a.hair, cloth: a.cloth, beard: a.beard, long: a.long, job: a.job };
    return { skin: SKINS[h % SKINS.length], hair: HAIRS[(h >> 3) % HAIRS.length], cloth: CLOTHS[(h >> 6) % CLOTHS.length], long: (h >> 9) & 1, beard: ((h >> 10) & 3) === 0, job: jobOf(u) || 'adventurer' };
  }
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath() };
  function bust(s, m) {
    const key = [s.skin, s.hair, s.cloth, s.job, s.long ? 1 : 0, s.beard ? 1 : 0, m].join('|');
    if (cache[key]) return cache[key];
    if (typeof document === 'undefined') return null;
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d'), jc = JOB_COL[s.job] || '#8a9a6a';
    const g = c.createRadialGradient(64, 54, 8, 64, 64, 96); g.addColorStop(0, '#34302c'); g.addColorStop(1, '#0c0b10'); c.fillStyle = g; c.fillRect(0, 0, 128, 128);
    c.fillStyle = jc; c.globalAlpha = .2; c.beginPath(); c.arc(64, 60, 58, 0, 7); c.fill(); c.globalAlpha = 1;
    if (s.long) { c.fillStyle = s.hair; rr(c, 30, 40, 68, 74, 24); c.fill() }
    c.fillStyle = s.cloth; c.beginPath(); c.moveTo(6, 128); c.quadraticCurveTo(10, 92, 44, 86); c.lineTo(84, 86); c.quadraticCurveTo(118, 92, 122, 128); c.closePath(); c.fill();
    c.fillStyle = jc; c.globalAlpha = .8; c.beginPath(); c.moveTo(50, 86); c.lineTo(64, 110); c.lineTo(78, 86); c.closePath(); c.fill(); c.globalAlpha = 1;
    if (s.job === 'warrior') { c.fillStyle = '#9aa0a8'; rr(c, 8, 90, 30, 12, 5); c.fill(); rr(c, 90, 90, 30, 12, 5); c.fill() }
    if (s.job === 'guardian') { c.fillStyle = '#aab6c4'; rr(c, 4, 88, 34, 20, 8); c.fill(); rr(c, 90, 88, 34, 20, 8); c.fill(); c.fillStyle = jc; c.beginPath(); c.arc(64, 112, 9, 0, 7); c.fill() }
    if (s.job === 'cleric') { c.fillStyle = '#fff7e0'; rr(c, 60, 98, 8, 26, 2); c.fill(); rr(c, 52, 106, 24, 8, 2); c.fill() }
    if (s.job === 'ranger') { c.strokeStyle = '#5a3a1a'; c.lineWidth = 5; c.beginPath(); c.moveTo(30, 128); c.lineTo(96, 88); c.stroke() }
    if (s.job === 'mage') { c.fillStyle = '#f4e6a8'; for (const [x, y] of [[40, 108], [88, 112], [64, 122]]) { c.beginPath(); c.arc(x, y, 2.4, 0, 7); c.fill() } }
    c.fillStyle = s.skin; c.fillRect(54, 72, 20, 18); c.beginPath(); c.ellipse(64, 54, 25, 29, 0, 0, 7); c.fill();
    c.fillStyle = s.hair; c.beginPath(); c.ellipse(64, 40, 27, 18, 0, Math.PI, 0); c.fill(); c.fillRect(38, 38, 7, s.long ? 40 : 14); c.fillRect(83, 38, 7, s.long ? 40 : 14);
    if (s.beard) { c.beginPath(); c.moveTo(42, 64); c.quadraticCurveTo(64, 100, 86, 64); c.quadraticCurveTo(64, 74, 42, 64); c.fill() }
    if (s.job === 'adventurer') { c.fillStyle = jc; c.fillRect(37, 36, 54, 7); c.fillStyle = '#e8e0c0'; c.fillRect(60, 36, 8, 7) }
    if (s.job === 'warrior') { c.fillStyle = '#9aa0a8'; c.beginPath(); c.ellipse(64, 40, 29, 21, 0, Math.PI, 0); c.fill(); c.fillRect(35, 38, 58, 7); c.fillRect(60, 38, 8, 22); c.fillStyle = jc; c.beginPath(); c.moveTo(64, 14); c.quadraticCurveTo(50, 4, 40, 22); c.quadraticCurveTo(54, 18, 64, 24); c.quadraticCurveTo(74, 18, 88, 22); c.quadraticCurveTo(78, 4, 64, 14); c.fill() }
    if (s.job === 'ranger') { c.fillStyle = jc; c.beginPath(); c.moveTo(24, 92); c.quadraticCurveTo(20, 20, 64, 16); c.quadraticCurveTo(108, 20, 104, 92); c.lineTo(92, 70); c.quadraticCurveTo(94, 34, 64, 32); c.quadraticCurveTo(34, 34, 36, 70); c.closePath(); c.fill(); c.fillStyle = '#e8d8a8'; c.beginPath(); c.moveTo(92, 26); c.quadraticCurveTo(112, 4, 118, 16); c.quadraticCurveTo(104, 16, 92, 34); c.fill() }
    if (s.job === 'mage') { c.fillStyle = jc; c.beginPath(); c.moveTo(24, 44); c.quadraticCurveTo(64, 30, 104, 44); c.lineTo(88, 38); c.quadraticCurveTo(80, 8, 70, -4); c.quadraticCurveTo(60, 12, 40, 38); c.closePath(); c.fill(); c.fillStyle = '#f4e6a8'; c.beginPath(); c.arc(64, 30, 4, 0, 7); c.fill() }
    if (s.job === 'cleric') { c.fillStyle = '#f4efe0'; c.beginPath(); c.moveTo(30, 82); c.quadraticCurveTo(24, 26, 64, 22); c.quadraticCurveTo(104, 26, 98, 82); c.lineTo(88, 62); c.quadraticCurveTo(90, 38, 64, 36); c.quadraticCurveTo(38, 38, 40, 62); c.closePath(); c.fill(); c.fillStyle = jc; c.fillRect(61, 24, 6, 16); c.fillRect(56, 29, 16, 5) }
    if (s.job === 'rogue') { c.fillStyle = jc; c.beginPath(); c.ellipse(64, 40, 29, 19, 0, Math.PI, 0); c.fill(); c.fillRect(35, 38, 58, 8); c.beginPath(); c.moveTo(92, 40); c.lineTo(112, 52); c.lineTo(90, 48); c.fill(); c.fillStyle = '#1c1c28'; c.beginPath(); c.moveTo(38, 64); c.quadraticCurveTo(64, 86, 90, 64); c.lineTo(90, 78); c.quadraticCurveTo(64, 94, 38, 78); c.closePath(); c.fill() }
    if (s.job === 'guardian') { c.fillStyle = '#aab6c4'; c.beginPath(); c.ellipse(64, 42, 31, 25, 0, Math.PI, 0); c.fill(); c.fillRect(33, 40, 62, 9); c.fillRect(33, 40, 9, 34); c.fillRect(86, 40, 9, 34); c.fillStyle = jc; c.fillRect(60, 18, 8, 26) }
    const eye = (x, y) => { c.beginPath(); c.ellipse(x, y, 3.4, 4.2, 0, 0, 7); c.fill() }, brow = (x1, y1, x2, y2) => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke() };
    const hairLine = s.hair === '#cfcfd6' || s.hair === '#e8e0f0' ? '#8a8a92' : s.hair;
    c.fillStyle = '#1d1a22'; c.strokeStyle = hairLine; c.lineWidth = 2.6; c.lineCap = 'round';
    const mouth = (d, w = 2) => { c.strokeStyle = '#6a3a2a'; c.lineWidth = w; c.beginPath(); c.moveTo(56, 70); d(); c.stroke() };
    if (m === 'attack') { eye(53, 57); eye(75, 57); brow(46, 46, 58, 52); brow(82, 46, 70, 52); c.fillStyle = '#4a1a1a'; c.beginPath(); c.ellipse(64, 71, 7, 5, 0, 0, 7); c.fill(); c.fillStyle = '#f4efe0'; c.fillRect(58, 67, 12, 2.5) }
    else if (m === 'hurt') { c.lineWidth = 3; c.strokeStyle = '#1d1a22'; c.beginPath(); c.moveTo(48, 52); c.lineTo(57, 57); c.lineTo(48, 62); c.moveTo(80, 52); c.lineTo(71, 57); c.lineTo(80, 62); c.stroke(); c.strokeStyle = hairLine; brow(46, 48, 58, 44); brow(82, 48, 70, 44); mouth(() => { c.lineTo(60, 73); c.lineTo(64, 69); c.lineTo(68, 73); c.lineTo(72, 70) }, 2.4); c.fillStyle = '#8fd0ff'; c.beginPath(); c.moveTo(92, 36); c.quadraticCurveTo(97, 46, 92, 50); c.quadraticCurveTo(87, 46, 92, 36); c.fill() }
    else if (m === 'guard') { c.strokeStyle = '#1d1a22'; c.lineWidth = 3; brow(47, 57, 59, 57); brow(69, 57, 81, 57); c.strokeStyle = hairLine; brow(46, 50, 58, 50); brow(70, 50, 82, 50); mouth(() => { c.lineTo(72, 70) }, 2.6); c.strokeStyle = '#9fd4ff'; c.lineWidth = 3; c.beginPath(); c.arc(64, 60, 56, -.6, .6); c.stroke(); c.beginPath(); c.arc(64, 60, 56, Math.PI - .6, Math.PI + .6); c.stroke() }
    else if (m === 'heal' || m === 'win') { c.strokeStyle = '#1d1a22'; c.lineWidth = 3; for (const x of [53, 75]) { c.beginPath(); c.arc(x, 58, 5, Math.PI * 1.1, Math.PI * 1.9); c.stroke() } c.strokeStyle = hairLine; brow(46, 47, 58, 47); brow(70, 47, 82, 47); mouth(() => { c.quadraticCurveTo(64, 80, 72, 70) }, 2.6); c.fillStyle = '#7fe08a'; for (const [x, y, r] of [[22, 34, 3], [106, 30, 2.5], [100, 56, 2]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill() } }
    else if (m === 'down') { c.strokeStyle = '#1d1a22'; c.lineWidth = 2.6; for (const x of [53, 75]) { c.beginPath(); c.moveTo(x - 4, 53); c.lineTo(x + 4, 61); c.moveTo(x + 4, 53); c.lineTo(x - 4, 61); c.stroke() } mouth(() => { c.lineTo(64, 74); c.lineTo(72, 70) }, 2) }
    else { eye(53, 57); eye(75, 57); brow(47, 49, 58, 48); brow(70, 48, 81, 49); mouth(() => { c.quadraticCurveTo(64, 73, 72, 70) }) }
    if (m === 'hurt') { c.fillStyle = '#ff3a2a33'; c.fillRect(0, 0, 128, 128) }
    const v = c.createRadialGradient(64, 64, 52, 64, 64, 92); v.addColorStop(0, '#0000'); v.addColorStop(1, '#000a'); c.fillStyle = v; c.fillRect(0, 0, 128, 128);
    return cache[key] = cv.toDataURL('image/png');
  }
  /* the picture for a fighter in a mood · o.look = 'male'|'female' (the hero's variant) · o.code = true → force the code-drawn job bust (preview) */
  function face(u, m, o = {}) {
    const j = jobOf(u), look = o.look === 'female' ? 'female' : 'male', other = look === 'female' ? 'male' : 'female';
    if (u.side === 'monster') {
      const mk = u.evoShow || u.kind;
      return o.monCode && root.CodeMonsters ? { src: root.CodeMonsters.icon(mk), pos: '50% 50%', size: '100%', kind: 'still' } : { src: `assets/cards/portraits/en-${mk}.webp`, pos: '50% 28%', size: '150%', kind: 'still' };
    }
    const isHero = u.id === 'hero', isSib = u.key === 'sib';
    if (!o.code && (isHero || isSib)) return { src: `assets/portraits/hero-${isSib ? other : look}-${HERO_EXPR[m] || 'neutral'}.webp`, pos: '50% 4%', size: '230%', kind: 'real' };
    if (!o.code && REAL_SET[u.key]) return { src: `assets/portraits/${u.key}-${NPC_EXPR[m] || 'neutral'}.webp`, pos: '50% 8%', size: '200%', kind: 'real' };
    if (!o.code && ['kier', 'bram', 'luna', 'mil'].includes(u.key)) return { src: `assets/cards/portraits/u-${u.key}.webp`, pos: '50% 22%', size: '165%', kind: 'still' };
    const spec = specFor(u); if (isHero || isSib) { spec.skin = '#e0b894'; spec.hair = '#4a3226'; spec.cloth = '#5a6a8a'; spec.job = j || 'adventurer' }
    const src = bust(spec, m);
    return src ? { src, pos: '50% 50%', size: '100%', kind: 'code' } : { src: `assets/village-town/npc/${u.key}/se-stand.webp`, pos: '50% 9%', size: '285%', kind: 'still' };
  }
  const api = { JOB_COL, JOB_ICON, JOB_BY_ICON, ALLY, LABEL, jobOf, mood, face, bust, specFor, MOODS: ['idle', 'attack', 'hurt', 'guard', 'heal', 'win', 'down'] };
  root.BattlePortrait = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
