/* v98.397 NPC emote — the mood emoji and the speech bubble used when villagers talk WITHOUT the conversation screen
   (lines said aloud in town and indoors). One place so town (js/town-npcs.js) and rooms (js/interior.js) look the same.
     NpcEmote.pick(text)                     → an emoji that fits the line (keywords; falls back to ❗ ❓ 💭 💬)
     NpcEmote.idle({walking, period, near})  → an emoji for a villager who says nothing (hums, thinks, waves, yawns)
     NpcEmote.bubble(g, x, tipY, text, o)    → draws the bubble with its tail at (x, tipY); o = { emoji, name, k (1/screen scale), minX, maxX, placed[] }
     NpcEmote.pop(g, x, tipY, emoji, o)      → a small round emoji-only bubble; o = { k, age (ms) }
   The text size is fixed in SCREEN pixels (o.k undoes the map zoom) so it reads the same at any zoom. */
(function (root) {
  'use strict';
  const RULES = [
    [/ฮ่า|ฮะฮะ|555|ตลก|สนุก|ดีใจ|ยินดี|เยี่ยม|วิเศษ/, '😄'], [/ขอบใจ|ขอบคุณ|ขอบพระคุณ/, '😊'], [/รัก|คิดถึง|ที่รัก|หวานใจ/, '🥰'],
    [/กลัว|อันตราย|ระวัง|โจร|สัตว์ร้าย|ปีศาจ|หอน|ผี|น่าขนลุก/, '😨'], [/โกรธ|โมโห|บ้าเอ๊ย|รำคาญ|เหลืออด|ไอ้/, '😠'], [/เศร้า|เสียใจ|ร้องไห้|อาลัย|น่าสงสาร/, '😢'],
    [/เหนื่อย|ง่วง|เมื่อย|ปวด|หาว|นอนไม่/, '😩'], [/เหล้า|เบียร์|เอล|ดื่ม|แก้ว/, '🍺'], [/หิว|อร่อย|ขนม|ข้าว|ซุป|สตู|ขนมปัง|กิน/, '🍖'],
    [/เพลง|ร้อง|ดนตรี|พิณ|ขลุ่ย/, '🎵'], [/ฝน|หนาว|ร้อน|อากาศ|ลม|หิมะ|เมฆ/, '☁️'], [/เงิน|เหรียญ|ราคา|ขาย|ซื้อ|กำไร|ทอง/, '💰'],
    [/ตีเหล็ก|ค้อน|ซ่อม|สร้าง|งาน|เก็บเกี่ยว|ไร่|ไถ/, '🔨'], [/ได้ยินว่า|ข่าว|ลือ|เขาว่า/, '👂'], [/สวด|ภาวนา|วิหาร|เทพ|พร/, '🙏'], [/สวัสดี|อรุณสวัสดิ์|ราตรีสวัสดิ์|หวัดดี/, '👋']
  ];
  function pick(text) { const s = String(text || ''); for (const [re, e] of RULES) if (re.test(s)) return e; return /[?？]|ไหม|หรือเปล่า|เหรอ|หรือ$/.test(s) ? '❓' : /!|！/.test(s) ? '❗' : /…|\.\.\./.test(s) ? '💭' : '💬' }
  function idle(o = {}) { const L = o.near ? ['👋', '😊', '👋'] : o.walking ? ['🎵', '💭', '😊', '🎵'] : ['💭', '😌', '🤔', '🎵']; if (o.period === 'evening' || o.period === 'night') L.push('🥱', '🌙'); if (o.period === 'morning') L.push('☀️'); return L[Math.floor(Math.random() * L.length)] }
  const EMOJI = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif';
  function wrap(g, txt, maxW) { const lines = []; let cur = ''; for (const ch of [...String(txt)]) { if (ch === '\n') { lines.push(cur); cur = ''; continue } if (cur && g.measureText(cur + ch).width > maxW) { lines.push(cur); cur = ch.trim() ? ch : '' } else cur += ch } if (cur) lines.push(cur); return lines }
  function bubble(g, x, tipY, text, o = {}) {
    const k = o.k || 1, F = 18 * k, NF = 14 * k, LH = 26 * k, PAD = 13 * k, maxW = 300 * k, ER = o.emoji ? 19 * k : 0;
    g.save(); g.font = `600 ${F}px VillageThai,AgThai,system-ui,"Noto Sans Thai",sans-serif`;
    const lines = wrap(g, text, maxW), nameW = o.name ? (g.font = `800 ${NF}px VillageThai,AgThai,system-ui,sans-serif`, g.measureText(o.name).width) : 0; g.font = `600 ${F}px VillageThai,AgThai,system-ui,"Noto Sans Thai",sans-serif`;
    const w = Math.max(nameW, ...lines.map(l => g.measureText(l).width), 60 * k) + PAD * 2, h = lines.length * LH + PAD * 1.5 + (o.name ? NF + 5 * k : 0), tail = 11 * k;
    let bx = x - w / 2, by = tipY - tail - h; if (o.minX != null) bx = Math.max(o.minX + ER, bx); if (o.maxX != null) bx = Math.min(o.maxX - w, bx);
    if (o.placed) { for (let n = 0; n < 8; n++) { const hit = o.placed.find(r => bx < r.x + r.w + 4 * k && bx + w + 4 * k > r.x && by < r.y + r.h + 4 * k && by + h + 4 * k > r.y); if (!hit) break; by = hit.y - h - 10 * k } if (o.minY != null) by = Math.max(o.minY + ER, by); o.placed.push({ x: bx, y: by, w, h }) }
    g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 10 * k; g.shadowOffsetY = 3 * k;
    g.fillStyle = '#fffaeb'; g.strokeStyle = '#6b4a22'; g.lineWidth = 2.2 * k; g.beginPath(); g.roundRect(bx, by, w, h, 13 * k); g.fill(); g.shadowColor = 'transparent'; g.stroke();
    const tx = Math.max(bx + 16 * k, Math.min(bx + w - 16 * k, x)); g.beginPath(); g.moveTo(tx - 9 * k, by + h - 1 * k); g.lineTo(x, by + h + tail); g.lineTo(tx + 9 * k, by + h - 1 * k); g.closePath(); g.fill(); g.beginPath(); g.moveTo(tx - 9 * k, by + h); g.lineTo(x, by + h + tail); g.lineTo(tx + 9 * k, by + h); g.stroke();
    g.textAlign = 'left'; g.textBaseline = 'alphabetic'; let ty = by + PAD * .75;
    if (o.name) { g.font = `800 ${NF}px VillageThai,AgThai,system-ui,sans-serif`; g.fillStyle = '#9a4a14'; g.fillText(o.name, bx + PAD, ty + NF); ty += NF + 5 * k }
    g.font = `600 ${F}px VillageThai,AgThai,system-ui,"Noto Sans Thai",sans-serif`; g.fillStyle = '#2b1c0a'; lines.forEach((l, i) => g.fillText(l, bx + PAD, ty + LH * (i + .78)));
    if (o.emoji) badge(g, bx + 2 * k, by + 2 * k, ER, o.emoji, k);
    g.restore(); return { x: bx, y: by, w, h };
  }
  function badge(g, cx, cy, r, emoji, k) { g.save(); g.fillStyle = '#fff'; g.strokeStyle = '#6b4a22'; g.lineWidth = 2.2 * k; g.beginPath(); g.arc(cx, cy, r, 0, 7); g.fill(); g.stroke(); g.font = `${r * 1.25}px ${EMOJI}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#2b1c0a'; g.fillText(emoji, cx, cy + r * .08); g.restore() }
  function pop(g, x, tipY, emoji, o = {}) { const k = o.k || 1, age = o.age ?? 999, s = age < 220 ? .4 + .6 * (age / 220) + .25 * Math.sin(age / 220 * Math.PI) : 1, r = 20 * k * s, cy = tipY - 10 * k - r + Math.sin((age || 0) * .005) * 2 * k;
    g.save(); g.shadowColor = 'rgba(0,0,0,.3)'; g.shadowBlur = 8 * k; g.fillStyle = '#fffaeb'; g.beginPath(); g.moveTo(x - 6 * k, cy + r * .8); g.lineTo(x, tipY); g.lineTo(x + 6 * k, cy + r * .8); g.fill(); g.restore(); badge(g, x, cy, r, emoji, k) }
  root.NpcEmote = { pick, idle, bubble, pop, badge };
})(globalThis);
