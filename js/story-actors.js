/* v95.20 · Disgaea-style talking portraits for cutscenes (js/story-fx.js calls StoryActors.*).
   Two stands — left and right — show the people in the conversation from the waist up. The one speaking is lit, a little larger and bobs
   while the words come out; the other steps back into shadow. Each line picks a face (line.face or guessed from the text) and the moment
   gets its touches: an emote over the head (♪ 💢 ❗ 💧 💭 ✨), a glow or speed lines behind the speaker, a hop, a shake, a red or warm
   wash over the screen.
   Art: painted sets live in assets/portraits/<set>-<face>.webp (faces: neutral, happy, angry, surprised; missing faces fall back to
   neutral). Anyone without a painted set is drawn in code from their look (coat, hair, hat…) so every speaker has a bust today.
   Line fields: face:'happy'|'angry'|'surprised'|'sad'|'think'|'neutral' · emote:'💢' (or false) · mood:'warm'|'tense'|'shock'|'sad'|'calm'. */
(function (root) {
  'use strict';
  /* painted portrait sets: speaker → [set, faces] */
  const PAINTED = { hilda: ['hilda', ['neutral', 'happy', 'angry', 'surprised']] };
  /* looks for the code-drawn busts (same palette as the villagers in js/village-life.js) */
  const LOOK = {
    hero: { coat: '#4a5a7a', hair: '#3a2a1e', hat: 'none', cape: '#7a3a2a', eye: '#5a3a1a' },
    mom: { coat: '#8a4b5c', apron: '#efe2c8', hair: '#5a3a22', hat: 'scarf', hatCol: '#c9a07a', longHair: true, age: 47 },
    elder: { coat: '#56683a', hair: '#cfcfcf', beard: '#dcdcdc', cape: '#3a4a2a', age: 63 },
    pip: { coat: '#6f8f36', hair: '#8a5a2a', hat: 'cap', hatCol: '#4a6a2a', small: true },
    tom: { coat: '#7a5a3a', apron: '#a07a4a', hair: '#8a8a86', hat: 'cap', hatCol: '#5a4632', beard: '#9a9a96', age: 61 },
    grev: { coat: '#8a6a2a', hair: '#7a6a5a', hat: 'hat', hatCol: '#5a3a1a', beard: '#7a6a5a', cape: '#3a5a6a', age: 50 },
    guard: { coat: '#5a5a6a', hair: '#3a3a3a', hat: 'helm', hatCol: '#9a9aa8' },
    gus: { coat: '#4a3a2a', apron: '#6a4a2a', hair: '#1a1a1a', beard: '#2a2a2a', big: true },
    saf: { coat: '#4a7a5a', apron: '#c9d6b0', hair: '#6a6a6a', hat: 'hood', hatCol: '#3a5a44', beard: '#7a7a7a', age: 58 },
    hilda: { coat: '#b8742a', apron: '#e8e0d0', hair: '#e2c36a', hat: 'straw', hatCol: '#d9be7a', longHair: true },
    ally: { coat: '#6a4a8a', hair: '#2a1f16', cape: '#3a2a4a' },
    boss: { coat: '#4a3a2a', hair: '#2a1a12', hat: 'bandana', hatCol: '#7a2a2a', beard: '#2a1a12', scar: true, big: true, eye: '#8a1a1a' }
  };
  const EMO = { happy: '♪', angry: '💢', surprised: '❗', sad: '💧', think: '💭' };

  /* ---------- guess the face from the line ---------- */
  function faceOf(line) {
    if (line.face) return line.face;
    const t = String(line.text || '');
    if (/(ฮ่า|ดีเลย|เก่ง|ขอบใจ|เยี่ยม|ยินดี|สนุก|ใหญ่ที่สุด|ชนะ|ในที่สุด|ดีใจ|♪)/.test(t)) return 'happy';
    if (/(อะไรนะ|เอ๊ะ|หา\?|จริงเหรอ|จริงหรือ|!\?|\?!|ไม่จริง|ตายแล้ว|ระวัง!|หนี)/.test(t)) return 'surprised';
    if (/(อย่า|ไอ้|หยุด|โจร|บ้า|แค้น|กล้าดี|ชิ|ไสหัว|ฆ่า|เจ้ามันตัว)/.test(t)) return 'angry';
    if (/(เสียใจ|ขอโทษ|เศร้า|ร้องไห้|น่าสงสาร|คิดถึง)/.test(t)) return 'sad';
    if (/^(…|\.\.\.)|(…|\.\.\.)$|(หรือเปล่า|ไม่แน่ใจ|สงสัย)/.test(t)) return 'think';
    return /!/.test(t) ? 'happy' : 'neutral';
  }
  const moodOf = (line, face) => line.mood || ({ happy: 'warm', angry: 'tense', surprised: 'shock', sad: 'sad' }[face] || 'calm');

  /* ---------- code-drawn bust (300 x 420, faces left like the painted art) ---------- */
  function shade(hex, k) { const n = parseInt(hex.slice(1), 16), c = x => Math.max(0, Math.min(255, Math.round(x * k))); return `rgb(${c(n >> 16)},${c(n >> 8 & 255)},${c(n & 255)})` }
  function drawBust(c, L, face, mouth) {
    const g = c.getContext('2d'), W = c.width, H = c.height; g.clearRect(0, 0, W, H);
    const s = L.small ? .86 : L.big ? 1.08 : 1, cx = W * .5, top = H * (L.small ? .26 : .2), skin = L.skin || '#f0cfae', ink = '#2a1a14';
    g.save(); g.translate(cx, 0); g.scale(s, 1); g.translate(-cx, 0); g.lineJoin = 'round'; g.lineWidth = 3; g.strokeStyle = ink;
    const hr = 62, hy = top + hr * 1.15;
    /* cape / back hair */
    if (L.cape) { g.fillStyle = shade(L.cape, .9); g.beginPath(); g.moveTo(cx - 135, H); g.lineTo(cx - 95, hy + 95); g.lineTo(cx + 95, hy + 95); g.lineTo(cx + 135, H); g.closePath(); g.fill(); g.stroke() }
    if (L.longHair) { g.fillStyle = shade(L.hair, .85); g.beginPath(); g.moveTo(cx - 70, hy - 20); g.quadraticCurveTo(cx - 92, hy + 120, cx - 60, hy + 170); g.lineTo(cx + 64, hy + 170); g.quadraticCurveTo(cx + 92, hy + 110, cx + 70, hy - 20); g.closePath(); g.fill(); g.stroke() }
    /* body */
    const sy = hy + hr + 26, bw = L.big ? 128 : 112;
    const body = g.createLinearGradient(cx - bw, 0, cx + bw, 0); body.addColorStop(0, shade(L.coat, 1.12)); body.addColorStop(.6, L.coat); body.addColorStop(1, shade(L.coat, .72));
    g.fillStyle = body; g.beginPath(); g.moveTo(cx - bw - 10, H + 5); g.quadraticCurveTo(cx - bw - 6, sy + 10, cx - 40, sy - 6); g.lineTo(cx + 40, sy - 6); g.quadraticCurveTo(cx + bw + 6, sy + 10, cx + bw + 10, H + 5); g.closePath(); g.fill(); g.stroke();
    if (L.apron) { g.fillStyle = L.apron; g.beginPath(); g.moveTo(cx - 52, H + 5); g.lineTo(cx - 44, sy + 40); g.lineTo(cx + 44, sy + 40); g.lineTo(cx + 52, H + 5); g.closePath(); g.fill(); g.stroke(); g.beginPath(); g.moveTo(cx - 40, sy + 40); g.lineTo(cx - 30, sy - 4); g.moveTo(cx + 40, sy + 40); g.lineTo(cx + 30, sy - 4); g.stroke() }
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.moveTo(cx - 70, sy + 70); g.quadraticCurveTo(cx - 78, H - 40, cx - 66, H); g.moveTo(cx + 74, sy + 60); g.quadraticCurveTo(cx + 84, H - 50, cx + 76, H); g.stroke(); g.strokeStyle = ink;
    /* neck + head */
    g.fillStyle = shade(skin, .9); g.fillRect(cx - 18, hy + hr - 14, 36, 40); g.strokeRect(cx - 18, hy + hr - 14, 36, 40);
    g.fillStyle = skin; g.beginPath(); g.moveTo(cx - hr, hy - 10); g.quadraticCurveTo(cx - hr, hy + hr * .75, cx - 6, hy + hr + 6); g.quadraticCurveTo(cx + hr * .9, hy + hr * .6, cx + hr, hy - 10); g.quadraticCurveTo(cx, hy - hr * 1.2, cx - hr, hy - 10); g.fill(); g.stroke();
    g.fillStyle = shade(skin, .95); g.beginPath(); g.ellipse(cx + hr - 2, hy + 6, 10, 15, 0, 0, 7); g.fill(); g.stroke();
    /* face: eyes look a little to the left (toward the other speaker) */
    const ey = hy + 10, eo = 26, shut = face === 'happy', wide = face === 'surprised';
    for (const ex of [cx - eo - 8, cx + eo - 8]) {
      if (shut) { g.beginPath(); g.arc(ex, ey + 4, 11, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); continue }
      const eh = wide ? 17 : 14; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ex, ey, 11, eh, 0, 0, 7); g.fill(); g.stroke();
      g.fillStyle = L.eye || '#3a5a8a'; g.beginPath(); g.ellipse(ex - 3, ey + 2, wide ? 5 : 7, wide ? 7 : 10, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(ex - 5, ey - 3, 2.6, 0, 7); g.fill();
    }
    /* brows */
    g.lineWidth = 4; g.strokeStyle = shade(L.hair, .7);
    for (const [ex, sgn] of [[cx - eo - 8, 1], [cx + eo - 8, -1]]) { g.beginPath(); const tilt = face === 'angry' ? 7 * sgn : face === 'sad' ? -6 * sgn : face === 'surprised' ? 0 : 1; g.moveTo(ex - 13, ey - 20 - (face === 'surprised' ? 6 : 0) - tilt); g.lineTo(ex + 13, ey - 20 - (face === 'surprised' ? 6 : 0) + tilt); g.stroke() }
    g.lineWidth = 3; g.strokeStyle = ink;
    /* mouth */
    const my = hy + 42, mx = cx - 10; g.fillStyle = '#8a2a2a';
    if (face === 'surprised') { g.beginPath(); g.ellipse(mx, my + 2, 6, mouth ? 9 : 7, 0, 0, 7); g.fill(); g.stroke() }
    else if (mouth || face === 'angry') { g.beginPath(); g.moveTo(mx - 11, my - (face === 'happy' ? 2 : 0)); g.quadraticCurveTo(mx, my + (mouth ? 14 : 6) + (face === 'happy' ? 4 : 0), mx + 11, my - (face === 'happy' ? 2 : 0)); g.closePath(); g.fill(); g.stroke() }
    else { g.beginPath(); if (face === 'happy') g.arc(mx, my - 4, 9, .2, Math.PI - .2); else if (face === 'sad') g.arc(mx, my + 8, 8, Math.PI + .4, -.4); else { g.moveTo(mx - 8, my); g.lineTo(mx + 8, my) } g.stroke() }
    if (face === 'happy') { g.fillStyle = 'rgba(240,120,120,.35)'; for (const ex of [cx - eo - 14, cx + eo - 2]) { g.beginPath(); g.ellipse(ex, ey + 22, 9, 5, 0, 0, 7); g.fill() } }
    if (face === 'sad') { g.fillStyle = 'rgba(140,200,255,.85)'; g.beginPath(); g.ellipse(cx - eo - 4, ey + 22, 3, 6, 0, 0, 7); g.fill() }
    if (L.age > 55) { g.strokeStyle = 'rgba(80,50,30,.4)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(cx - eo - 22, ey + 14); g.lineTo(cx - eo - 14, ey + 18); g.moveTo(cx + eo + 6, ey + 14); g.lineTo(cx + eo - 2, ey + 18); g.stroke(); g.strokeStyle = ink; g.lineWidth = 3 }
    if (L.scar) { g.strokeStyle = '#8a3a2a'; g.beginPath(); g.moveTo(cx + 10, ey - 24); g.lineTo(cx + 30, ey + 20); g.stroke(); g.strokeStyle = ink }
    if (L.beard) { g.fillStyle = L.beard; g.beginPath(); g.moveTo(cx - hr + 8, hy + 18); g.quadraticCurveTo(cx - 40, hy + hr + 34, cx - 6, hy + hr + 30); g.quadraticCurveTo(cx + 38, hy + hr + 30, cx + hr - 10, hy + 18); g.quadraticCurveTo(cx, hy + 50, cx - hr + 8, hy + 18); g.fill(); g.stroke(); if (face !== 'neutral' || mouth) { g.fillStyle = '#5a2020'; g.beginPath(); g.ellipse(mx, my + 4, 8, mouth ? 6 : 3, 0, 0, 7); g.fill() } }
    /* front hair */
    g.fillStyle = L.hair; g.beginPath(); g.moveTo(cx - hr - 4, hy + 6); g.quadraticCurveTo(cx - hr - 6, hy - hr * 1.1, cx, hy - hr * 1.05); g.quadraticCurveTo(cx + hr + 8, hy - hr, cx + hr + 4, hy + 4);
    for (let k = 0; k < 6; k++) { const x = cx + hr - k * (2 * hr / 5), y = hy - 14 + (k % 2) * 16; g.lineTo(x - 10, y + 12); g.lineTo(x - 22, y - 6) } g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.ellipse(cx - 18, hy - hr * .72, 26, 6, -.2, 0, 7); g.fill();
    /* hats */
    const hc = L.hatCol || '#5a4632';
    if (L.hat === 'straw' || L.hat === 'hat') { g.fillStyle = hc; g.beginPath(); g.ellipse(cx + 6, hy - hr * .72, hr * 1.75, hr * .42, -.08, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(cx - hr * .8, hy - hr * .8); g.quadraticCurveTo(cx, hy - hr * 1.9, cx + hr * .9, hy - hr * .82); g.closePath(); g.fill(); g.stroke(); g.fillStyle = L.hat === 'straw' ? '#8a3a2a' : shade(hc, .6); g.fillRect(cx - hr * .82, hy - hr * .98, hr * 1.72, 12) }
    else if (L.hat === 'cap') { g.fillStyle = hc; g.beginPath(); g.ellipse(cx, hy - hr * .7, hr * 1.05, hr * .6, 0, Math.PI, 0); g.fill(); g.stroke(); g.beginPath(); g.ellipse(cx - hr * .8, hy - hr * .68, hr * .55, 10, -.15, 0, 7); g.fill(); g.stroke() }
    else if (L.hat === 'hood' || L.hat === 'scarf') { g.fillStyle = hc; g.beginPath(); g.moveTo(cx - hr - 14, hy + (L.hat === 'hood' ? 70 : 20)); g.quadraticCurveTo(cx - hr - 18, hy - hr * 1.35, cx + 4, hy - hr * 1.25); g.quadraticCurveTo(cx + hr + 22, hy - hr * 1.2, cx + hr + 14, hy + (L.hat === 'hood' ? 70 : 20)); g.lineTo(cx + hr - 6, hy + 4); g.quadraticCurveTo(cx, hy - hr * .95, cx - hr + 6, hy + 4); g.closePath(); g.fill(); g.stroke() }
    else if (L.hat === 'helm') { g.fillStyle = hc; g.beginPath(); g.ellipse(cx, hy - hr * .55, hr * 1.12, hr * .82, 0, Math.PI, 0); g.fill(); g.stroke(); g.fillStyle = shade(hc, .75); g.fillRect(cx - hr * 1.12, hy - hr * .6, hr * 2.24, 14); g.strokeRect(cx - hr * 1.12, hy - hr * .6, hr * 2.24, 14); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(cx - 20, hy - hr * 1.05, 20, 6, -.2, 0, 7); g.fill() }
    else if (L.hat === 'bandana') { g.fillStyle = hc; g.beginPath(); g.ellipse(cx, hy - hr * .62, hr * 1.04, hr * .5, 0, Math.PI, 0); g.fill(); g.stroke(); g.beginPath(); g.moveTo(cx + hr * .9, hy - hr * .6); g.lineTo(cx + hr * 1.5, hy - hr * .2); g.lineTo(cx + hr * 1.2, hy - hr * .7); g.fill(); g.stroke() }
    g.restore();
  }

  /* ---------- DOM ---------- */
  let box = null, stands = null, slots = { L: null, R: null }, recent = [], speakerSide = null, scene = null, typingFlap = null;
  const css = `
  .cs-actors{position:absolute;inset:0;z-index:3;pointer-events:none;overflow:hidden}
  .cs-actor{position:absolute;bottom:4vh;height:min(74vh,640px);width:min(44vw,460px);display:flex;align-items:flex-end;justify-content:center;transition:transform .45s cubic-bezier(.2,.9,.3,1.2),filter .35s,opacity .35s;opacity:0;filter:brightness(.45) saturate(.7)}
  .cs-actor.L{left:max(0px,calc(50% - 560px));transform:translateX(-60px) scale(.94);transform-origin:50% 100%}
  .cs-actor.R{right:max(0px,calc(50% - 560px));transform:translateX(60px) scale(.94);transform-origin:50% 100%}
  .cs-actor.in{opacity:1}.cs-actor.in.L,.cs-actor.in.R{transform:translateX(0) scale(.94)}
  .cs-actor.on{filter:none;z-index:2}.cs-actor.on.L,.cs-actor.on.R{transform:translateX(0) scale(1)}
  .cs-actor .art{position:relative;height:100%;width:100%;display:flex;align-items:flex-end;justify-content:center;animation:csBreath 3.6s ease-in-out infinite}
  .cs-actor.L .art>img,.cs-actor.L .art>canvas{transform:scaleX(-1)}
  .cs-actor .art>img,.cs-actor .art>canvas{max-height:100%;max-width:100%;object-fit:contain;filter:drop-shadow(0 0 2px rgba(0,0,0,.6)) drop-shadow(0 18px 28px rgba(0,0,0,.55))}
  .cs-actor .art>canvas{height:92%;width:auto}
  .cs-actor.talk .art{animation:csTalk .32s ease-in-out infinite alternate}
  @keyframes csBreath{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.008)}}
  @keyframes csTalk{from{transform:translateY(0)}to{transform:translateY(-4px)}}
  .cs-actor .glow{position:absolute;left:50%;bottom:28%;width:110%;aspect-ratio:1;transform:translate(-50%,50%);border-radius:50%;opacity:0;transition:opacity .4s;background:radial-gradient(circle,var(--gl,rgba(255,220,150,.45)),transparent 62%)}
  .cs-actor.on .glow{opacity:1}
  .cs-actor .lines{position:absolute;inset:-10% -20% 20%;opacity:0;background:repeating-conic-gradient(from 0deg at 50% 45%,rgba(255,255,255,.55) 0 1.2deg,transparent 1.2deg 9deg);-webkit-mask:radial-gradient(circle at 50% 45%,transparent 26%,#000 60%);mask:radial-gradient(circle at 50% 45%,transparent 26%,#000 60%)}
  .cs-actor.fx-shock .lines{animation:csLines .7s ease-out}
  @keyframes csLines{0%{opacity:.95;transform:scale(.9)}100%{opacity:0;transform:scale(1.15)}}
  .cs-actor.fx-hop .art{animation:csHop .5s cubic-bezier(.3,1.6,.5,1)}
  @keyframes csHop{0%{transform:translateY(0)}40%{transform:translateY(-26px)}100%{transform:translateY(0)}}
  .cs-actor.fx-jump .art{animation:csJump .45s ease-out}
  @keyframes csJump{0%{transform:translateY(0) scale(1)}25%{transform:translateY(-34px) scale(1.04)}100%{transform:translateY(0) scale(1)}}
  .cs-actor.fx-shake .art{animation:csShakeA .4s linear}
  @keyframes csShakeA{0%,100%{transform:translateX(0)}20%{transform:translateX(-9px)}40%{transform:translateX(8px)}60%{transform:translateX(-6px)}80%{transform:translateX(4px)}}
  .cs-actor.fx-sag .art{animation:csSag 1.2s ease-out forwards}
  @keyframes csSag{to{transform:translateY(10px) scale(.985)}}
  .cs-emote{position:absolute;top:6%;left:58%;font-size:clamp(34px,5.4vh,56px);line-height:1;filter:drop-shadow(0 3px 4px rgba(0,0,0,.6));animation:csEmote 1.6s ease-out forwards;font-family:"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif}
  .cs-actor.L .cs-emote{left:26%}
  @keyframes csEmote{0%{opacity:0;transform:translateY(16px) scale(.4)}18%{opacity:1;transform:translateY(-4px) scale(1.15)}30%{transform:translateY(0) scale(1)}80%{opacity:1}100%{opacity:0;transform:translateY(-14px)}}
  .cs-mood{position:absolute;inset:0;z-index:2;pointer-events:none;opacity:0;transition:opacity .6s ease}
  .cs-mood.tense{opacity:1;background:radial-gradient(ellipse at 50% 55%,transparent 45%,rgba(160,20,20,.38));animation:csPulse 1.6s ease-in-out infinite}
  .cs-mood.warm{opacity:1;background:radial-gradient(ellipse at 50% 70%,rgba(255,200,120,.16),transparent 65%)}
  .cs-mood.sad{opacity:1;background:linear-gradient(180deg,rgba(40,60,110,.28),rgba(10,20,50,.45));filter:saturate(.6)}
  .cs-mood.shock{opacity:1;background:radial-gradient(ellipse at 50% 50%,rgba(255,255,255,.12),transparent 60%)}
  @keyframes csPulse{0%,100%{opacity:.75}50%{opacity:1}}
  @media (max-width:760px){.cs-actor{height:58vh;width:52vw}}
  @media (prefers-reduced-motion:reduce){.cs-actor .art{animation:none!important}.cs-mood.tense{animation:none}}`;
  function build(el) {
    if (box && box.isConnected) return box;
    if (!document.getElementById('csActorCss')) { const st = document.createElement('style'); st.id = 'csActorCss'; st.textContent = css; document.head.append(st) }
    box = document.createElement('div'); box.className = 'cs-actors'; box.innerHTML = '<div class="cs-mood"></div><div class="cs-actor L"><div class="glow"></div><div class="lines"></div><div class="art"></div></div><div class="cs-actor R"><div class="glow"></div><div class="lines"></div><div class="art"></div></div>';
    const before = el.querySelector('.cs-box'); el.insertBefore(box, before);
    stands = { L: box.querySelector('.cs-actor.L'), R: box.querySelector('.cs-actor.R') };
    return box;
  }
  const lookOf = (who, sp) => sp?.look || LOOK[who] || { coat: sp?.color || '#5a5a6a', hair: '#3a2a1e' };
  function sideFor(who) {
    if (slots.L?.who === who) return 'L'; if (slots.R?.who === who) return 'R';
    if (who === 'hero') return 'L';
    if (!slots.R) return 'R'; if (!slots.L) return 'L';
    if (slots.L.who === 'hero') return 'R';
    return recent.lastIndexOf(slots.L.who) < recent.lastIndexOf(slots.R.who) ? 'L' : 'R';   // replace whoever spoke least recently
  }
  function setArt(side, who, sp, face) {
    const st = stands[side], art = st.querySelector('.art'), P = PAINTED[sp?.bust || who];
    let cur = slots[side];
    if (!cur || cur.who !== who) { art.innerHTML = ''; cur = slots[side] = { who, face: null, el: null, look: lookOf(who, sp) }; st.classList.remove('in'); void st.offsetWidth; requestAnimationFrame(() => st.classList.add('in')) }
    if (cur.face === face && cur.el) return cur;
    cur.face = face;
    if (P) {
      const f = P[1].includes(face) ? face : face === 'sad' || face === 'think' ? 'neutral' : 'neutral', src = 'assets/portraits/' + P[0] + '-' + f + '.webp';
      if (!cur.el || cur.el.tagName !== 'IMG') { art.innerHTML = ''; cur.el = new Image(); cur.el.alt = ''; art.append(cur.el) }
      cur.el.src = src;
    } else {
      if (!cur.el || cur.el.tagName !== 'CANVAS') { art.innerHTML = ''; cur.el = document.createElement('canvas'); cur.el.width = 300; cur.el.height = 420; art.append(cur.el) }
      drawBust(cur.el, cur.look, face, false);
    }
    return cur;
  }
  function emote(side, ch) { const st = stands[side]; st.querySelector('.cs-emote')?.remove(); if (!ch) return; const e = document.createElement('div'); e.className = 'cs-emote'; e.textContent = ch; st.append(e); setTimeout(() => e.remove(), 1700) }
  function fx(side, cls) { const st = stands[side]; st.classList.remove('fx-shock', 'fx-hop', 'fx-jump', 'fx-shake', 'fx-sag'); void st.offsetWidth; if (cls) for (const c of cls) st.classList.add(c) }

  /* ---------- API used by story-fx ---------- */
  function begin(el) { build(el); for (const s of ['L', 'R']) { stands[s].className = 'cs-actor ' + s; stands[s].querySelector('.art').innerHTML = ''; } slots = { L: null, R: null }; recent = []; box.querySelector('.cs-mood').className = 'cs-mood'; box.hidden = false }
  function end() { if (!box) return; talk(false); box.hidden = true; slots = { L: null, R: null } }
  /* a line: who (or none = narration), the resolved speaker {name, portrait, color, look, bust}; returns hints for the stage (shake) */
  function line(el, l, sp) {
    build(el); const mood = box.querySelector('.cs-mood');
    if (!l.who || l.who === 'narr') { for (const s of ['L', 'R']) stands[s].classList.remove('on', 'talk'); mood.className = 'cs-mood' + (l.mood ? ' ' + l.mood : ''); speakerSide = null; return {} }
    const face = faceOf(l), side = sideFor(l.who); recent.push(l.who);
    setArt(side, l.who, sp, face);
    for (const s of ['L', 'R']) stands[s].classList.toggle('on', s === side);
    stands[side].style.setProperty('--gl', { happy: 'rgba(255,214,140,.5)', angry: 'rgba(255,90,70,.45)', surprised: 'rgba(255,255,255,.5)', sad: 'rgba(120,170,255,.35)', think: 'rgba(200,180,255,.35)' }[face] || 'rgba(255,230,180,.32)');
    const m = moodOf(l, face); mood.className = 'cs-mood' + (m && m !== 'calm' ? ' ' + m : '');
    fx(side, face === 'surprised' ? ['fx-shock', 'fx-jump'] : face === 'angry' ? ['fx-shake'] : face === 'happy' && /!/.test(l.text || '') ? ['fx-hop'] : face === 'sad' ? ['fx-sag'] : null);
    emote(side, l.emote === false ? null : l.emote || (face !== 'neutral' && (face !== 'happy' || /!|♪|ฮ่า/.test(l.text || '')) ? EMO[face] : null));
    speakerSide = side;
    const strong = /!!|！！/.test(l.text || '') || face === 'angry' && /!/.test(l.text || '');
    return { shake: strong && !l.shake ? 'small' : null, flash: face === 'surprised' && !l.flash ? 'rgba(255,255,255,.35)' : null };
  }
  /* mouth flaps on the code-drawn busts while the words are coming out */
  function talk(on) {
    if (!stands) return; clearInterval(typingFlap); typingFlap = null;
    for (const s of ['L', 'R']) stands[s].classList.toggle('talk', !!on && s === speakerSide);
    const cur = speakerSide && slots[speakerSide];
    if (cur && cur.el?.tagName === 'CANVAS') {
      if (on) { let open = false; typingFlap = setInterval(() => { open = !open; drawBust(cur.el, cur.look, cur.face, open) }, 130) } else drawBust(cur.el, cur.look, cur.face, false);
    }
  }
  root.StoryActors = { begin, end, line, talk, faceOf, drawBust, PAINTED, LOOK };
})(typeof window !== 'undefined' ? window : globalThis);
