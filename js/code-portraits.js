/* v98.486 · ภาพหน้าตัวละครแบบวาดด้วยโค้ด (placeholder จนกว่าผู้ใช้เจนภาพจริง) — ไม่มีไฟล์ภาพใหม่
   CodePortraits.get(id) → data URL (PNG 128×128, cache) · CodePortraits.has(id) · CodePortraits.IDS
   เมื่อมีภาพจริง: ใส่ไฟล์แล้วให้ตัวละครนั้นชี้ src จริงใน js/story-map-data.js (CAST) / StoryCast — ภาพโค้ดเลิกถูกใช้เอง
   สไตล์: ครึ่งตัว หน้าเรียบ สีเฉพาะตัวละคร สัญลักษณ์ประจำตัว (เช่น ผู้เฝ้าแสง = ลายแสงบนไหล่ · นักล่าเงา = ผ้าคลุมเงา) อ่านออกแม้เล็ก 42px ในกรอบ CT */
(function (root) {
  'use strict';
  /* skin · hair · hairStyle · cloth · accent · extra[] */
  const SPEC = {
    corvin: { skin: '#d9b08c', hair: '#4a4a52', style: 'short', cloth: '#5a2f2f', accent: '#d8b46a', extra: ['mustache', 'epaulet', 'scar'], bg: '#2b1c22' },
    helga: { skin: '#e8c9a8', hair: '#cfcfd6', style: 'hood', cloth: '#6a7a90', accent: '#e7eef7', extra: ['ember'], bg: '#1c2433' },
    darren: { skin: '#cfa27c', hair: '#2e2e34', style: 'helm', cloth: '#7a8088', accent: '#9fb0c4', extra: ['plume'], bg: '#20252b' },
    mierris: { skin: '#f0d8b8', hair: '#f4e7a8', style: 'long', cloth: '#e6d79a', accent: '#fff4b8', extra: ['sunmark', 'pointed'], bg: '#3a3420' },
    lorrik: { skin: '#b79a86', hair: '#241d33', style: 'hood', cloth: '#2c2540', accent: '#8a6ad8', extra: ['shadowveil', 'pointed'], bg: '#14101f' },
    serrien: { skin: '#e6dccb', hair: '#bfc8e8', style: 'long', cloth: '#3a3f7a', accent: '#a8c4ff', extra: ['ghost', 'beard'], bg: '#171a38' },
    irene: { skin: '#e3bf9d', hair: '#7a4a2a', style: 'bun', cloth: '#d8e6d4', accent: '#7fbf8a', extra: ['crosscap'], bg: '#1d2e24' },
    vik: { skin: '#c9a283', hair: '#1f1a16', style: 'hood', cloth: '#4a3a2a', accent: '#d8a33a', extra: ['mask', 'coin'], bg: '#241c14' }
  };
  const cache = {};
  const rr = (c, x, y, w, h, r) => { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath() };
  function draw(id) {
    const s = SPEC[id]; if (!s || typeof document === 'undefined') return null;
    const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d'), has = k => s.extra.includes(k);
    const g = c.createRadialGradient(64, 54, 8, 64, 64, 96); g.addColorStop(0, s.bg); g.addColorStop(1, '#0b0a10'); c.fillStyle = g; c.fillRect(0, 0, 128, 128);
    if (has('ghost')) { c.fillStyle = '#a8c4ff22'; c.beginPath(); c.arc(64, 60, 56, 0, 7); c.fill() }
    if (has('shadowveil')) { c.fillStyle = '#8a6ad833'; c.beginPath(); c.ellipse(64, 120, 62, 40, 0, 0, 7); c.fill() }
    /* shoulders / clothing */
    c.fillStyle = s.cloth; c.beginPath(); c.moveTo(6, 128); c.quadraticCurveTo(10, 92, 44, 86); c.lineTo(84, 86); c.quadraticCurveTo(118, 92, 122, 128); c.closePath(); c.fill();
    c.fillStyle = s.accent; c.globalAlpha = .55; c.beginPath(); c.moveTo(52, 86); c.lineTo(64, 106); c.lineTo(76, 86); c.closePath(); c.fill(); c.globalAlpha = 1;
    if (has('epaulet')) { c.fillStyle = s.accent; rr(c, 10, 92, 26, 8, 3); c.fill(); rr(c, 92, 92, 26, 8, 3); c.fill() }
    if (has('sunmark')) { c.strokeStyle = s.accent; c.lineWidth = 3; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; c.beginPath(); c.moveTo(24 + Math.cos(a) * 5, 108 + Math.sin(a) * 5); c.lineTo(24 + Math.cos(a) * 11, 108 + Math.sin(a) * 11); c.stroke() } c.beginPath(); c.arc(24, 108, 4, 0, 7); c.stroke() }
    if (has('crosscap')) { c.fillStyle = '#fff'; rr(c, 58, 96, 12, 28, 2); c.fill(); rr(c, 50, 104, 28, 10, 2); c.fill(); c.fillStyle = s.accent; rr(c, 61, 99, 6, 22, 1); c.fill(); rr(c, 53, 107, 22, 4, 1); c.fill() }
    if (has('coin')) { c.fillStyle = s.accent; c.beginPath(); c.arc(98, 112, 7, 0, 7); c.fill(); c.fillStyle = '#7a5a1a'; c.fillRect(96, 108, 4, 8) }
    /* neck + back hair */
    if (s.style === 'long') { c.fillStyle = s.hair; rr(c, 30, 40, 68, 70, 24); c.fill() }
    c.fillStyle = s.skin; c.fillRect(54, 72, 20, 20);
    /* head */
    c.fillStyle = s.skin; c.beginPath(); c.ellipse(64, 54, 25, 29, 0, 0, 7); c.fill();
    if (has('pointed')) { c.beginPath(); c.moveTo(39, 52); c.lineTo(28, 44); c.lineTo(40, 60); c.fill(); c.beginPath(); c.moveTo(89, 52); c.lineTo(100, 44); c.lineTo(88, 60); c.fill() }
    /* hair / headgear */
    c.fillStyle = s.hair;
    if (s.style === 'short') { c.beginPath(); c.ellipse(64, 40, 27, 18, 0, Math.PI, 0); c.fill(); c.fillRect(38, 38, 7, 14); c.fillRect(83, 38, 7, 14) }
    if (s.style === 'long') { c.beginPath(); c.ellipse(64, 38, 28, 19, 0, Math.PI, 0); c.fill(); c.fillRect(36, 38, 8, 40); c.fillRect(84, 38, 8, 40) }
    if (s.style === 'bun') { c.beginPath(); c.ellipse(64, 40, 27, 18, 0, Math.PI, 0); c.fill(); c.beginPath(); c.arc(64, 20, 10, 0, 7); c.fill() }
    if (s.style === 'hood') { c.fillStyle = s.cloth; c.beginPath(); c.moveTo(26, 96); c.quadraticCurveTo(22, 24, 64, 18); c.quadraticCurveTo(106, 24, 102, 96); c.lineTo(90, 70); c.quadraticCurveTo(92, 36, 64, 34); c.quadraticCurveTo(36, 36, 38, 70); c.closePath(); c.fill();
      c.fillStyle = s.hair; if (id === 'helga') { c.beginPath(); c.ellipse(64, 42, 22, 10, 0, Math.PI, 0); c.fill() } }
    if (s.style === 'helm') { c.fillStyle = s.cloth; c.beginPath(); c.ellipse(64, 42, 30, 24, 0, Math.PI, 0); c.fill(); c.fillRect(34, 42, 60, 10); c.fillStyle = '#0b0a10'; c.fillRect(48, 50, 32, 5); c.fillStyle = s.accent; c.fillRect(60, 18, 8, 12) }
    if (has('plume')) { c.fillStyle = '#c24a3a'; c.beginPath(); c.ellipse(64, 16, 6, 12, 0, 0, 7); c.fill() }
    /* face */
    if (s.style !== 'helm') {
      c.fillStyle = '#1d1a22'; c.beginPath(); c.ellipse(53, 56, 3.2, 4, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(75, 56, 3.2, 4, 0, 0, 7); c.fill();
      if (has('ghost') || has('sunmark') || has('ember')) { c.fillStyle = s.accent; c.beginPath(); c.arc(54, 55, 1.3, 0, 7); c.fill(); c.beginPath(); c.arc(76, 55, 1.3, 0, 7); c.fill() }
      c.strokeStyle = '#6a4a3a'; c.lineWidth = 2; c.beginPath(); c.moveTo(56, 70); c.quadraticCurveTo(64, 74, 72, 70); c.stroke();
      c.strokeStyle = s.hair; c.lineWidth = 2.5; c.beginPath(); c.moveTo(47, 48); c.lineTo(58, 49); c.moveTo(70, 49); c.lineTo(81, 48); c.stroke();
    } else { c.fillStyle = s.accent; c.globalAlpha = .6; c.fillRect(50, 51, 6, 3); c.fillRect(72, 51, 6, 3); c.globalAlpha = 1 }
    if (has('mustache')) { c.fillStyle = s.hair; c.beginPath(); c.moveTo(64, 65); c.quadraticCurveTo(50, 62, 46, 70); c.quadraticCurveTo(58, 68, 64, 68); c.quadraticCurveTo(70, 68, 82, 70); c.quadraticCurveTo(78, 62, 64, 65); c.fill() }
    if (has('beard')) { c.fillStyle = s.hair; c.beginPath(); c.moveTo(42, 66); c.quadraticCurveTo(64, 104, 86, 66); c.quadraticCurveTo(64, 78, 42, 66); c.fill() }
    if (has('scar')) { c.strokeStyle = '#9a5a4a'; c.lineWidth = 2; c.beginPath(); c.moveTo(80, 44); c.lineTo(70, 64); c.stroke() }
    if (has('mask')) { c.fillStyle = '#2a211a'; c.beginPath(); c.moveTo(38, 62); c.quadraticCurveTo(64, 84, 90, 62); c.lineTo(90, 82); c.quadraticCurveTo(64, 94, 38, 82); c.closePath(); c.fill() }
    if (has('ember')) { c.fillStyle = '#ffb347'; for (const [x, y, r] of [[22, 30, 3], [108, 26, 2.5], [100, 44, 2]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill() } }
    /* frame vignette */
    const v = c.createRadialGradient(64, 64, 52, 64, 64, 92); v.addColorStop(0, '#0000'); v.addColorStop(1, '#000a'); c.fillStyle = v; c.fillRect(0, 0, 128, 128);
    return cv.toDataURL('image/png');
  }
  const api = { IDS: Object.keys(SPEC), SPEC, has: id => !!SPEC[id], get(id) { if (!SPEC[id]) return null; return cache[id] || (cache[id] = draw(id)) } };
  root.CodePortraits = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
