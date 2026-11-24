/* v98.996 · VictoryScreen — ONE victory report for every battle (story fights · world map · training · duel), shown OVER THE BATTLE SCENE (the fight's iframe stays under it until Continue).

   VictoryScreen.show(data, opt) → Promise (resolves when the player presses Continue — the host removes the battle frame AFTER that)
     data = { title, goal, kills, turns, gold, loot:[text], job?, members:[…], stat? }
       members[i] = { id:'hero'|partyKey, name, pic:'hero-female'|'hero-male'|key, hp, max, gain, lv0, lv1, xp0, xp1, needFn(lv), upNote? }
                    (without lv0/xp0/xp1/needFn the EXP bar is a plain "gain" bar — the older story fights only know the EXP)
       stat = what town-battle.js counted: { turns, secs, dealt{id}, taken{id}, kills{id}, crit, adv, dis, flank, high, cards:[[name,n]], items, healed{id}, maxHit{dmg,by} }
   Page 1 (front): VICTORY! · scene · goal · kills/gold/loot · every fighter (portrait with the NORMAL face · Lv · EXP bar · HP) · level-up flashes.
   Page 2 (flip with "ดูรายละเอียดการต่อสู้"): star of the fight · damage dealt / taken / kills per fighter · elements, flank, high ground, crits · cards used.
   Buttons only: a click on the backdrop never closes (it just finishes the animation). Enter / Space = Continue · ← → = flip the page.
   VictoryScreen.fightUI(on) — hides the quest tracker (#storyTracker) of the TOP window for as long as a fight / its report is open. */
(function (root) {
  'use strict';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const top = (() => { try { return root.top && root.top.document ? root.top : root } catch (e) { return root } })();

  /* ---- quest tracker hidden while fighting (it belongs to the top window, a battle may be opened from a frame inside it) ---- */
  function fightUI(on) {
    try {
      const d = top.document;
      if (!d.getElementById('vsFightCss')) { const s = d.createElement('style'); s.id = 'vsFightCss'; s.textContent = 'body.vs-fighting #storyTracker{display:none!important}'; d.head.append(s) }
      d.body.classList.toggle('vs-fighting', !!on);
    } catch (e) { }
  }

  const CSS = `
#vsv{position:fixed;inset:0;z-index:3000;display:grid;place-items:center;overflow:hidden;font-family:VillageThai,"Noto Sans Thai",AgThai,system-ui,sans-serif;color:#f3e6c4;
  background:radial-gradient(ellipse at 50% 40%,#101a2299 0,#05080ccc 62%,#020305ee 100%);animation:vsIn .45s ease both;-webkit-user-select:none;user-select:none}
#vsv .rays{position:absolute;left:50%;top:34%;width:190vmax;height:190vmax;margin:-95vmax 0 0 -95vmax;background:repeating-conic-gradient(from 0deg,#ffd77a1f 0 5deg,#0000 5deg 16deg);-webkit-mask:radial-gradient(circle,#000 0,#0000 52%);mask:radial-gradient(circle,#000 0,#0000 52%);animation:vsSpin 80s linear infinite;pointer-events:none}
#vsv canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
#vsv .book{position:relative;width:min(640px,94vw);max-height:92vh;perspective:1400px}
#vsv .pg{position:relative;padding:20px 24px 18px;border-radius:18px;background:linear-gradient(180deg,#14212bf2,#0b1219f5);border:2px solid #c9a35a;
  box-shadow:0 0 0 3px #0009,0 26px 70px #000d,inset 0 0 0 1px #ffe6a844,inset 0 0 60px #ffcf6a12;transform-origin:50% 50%;transition:transform .34s cubic-bezier(.5,0,.3,1),opacity .34s}
#vsv .pg::before,#vsv .pg::after{content:"";position:absolute;width:30px;height:30px;border:2px solid #ffd77a;pointer-events:none;opacity:.85}
#vsv .pg::before{left:7px;top:7px;border-right:0;border-bottom:0;border-radius:10px 0 0 0}#vsv .pg::after{right:7px;bottom:7px;border-left:0;border-top:0;border-radius:0 0 10px 0}
#vsv .pg.out{transform:rotateY(90deg);opacity:0}#vsv .pg[hidden]{display:none}
#vsv .crest{height:3px;margin:0 auto 8px;width:0;background:linear-gradient(90deg,#0000,#ffd77a,#0000);animation:vsLine .9s .1s ease-out forwards}
#vsv h2{margin:0;display:flex;justify-content:center;gap:.04em;font:900 clamp(38px,9vw,66px)/1 AgThai,Georgia,serif;letter-spacing:.1em;color:#ffd77a;text-shadow:0 3px 0 #7a4a0e,0 0 28px #ffb52e,0 0 64px #ff9a1f77;text-align:center}
#vsv h2 span{display:inline-block;opacity:0;transform:translateY(30px) scale(1.7);animation:vsLetter .5s cubic-bezier(.2,1.5,.4,1) forwards}
#vsv .sub{margin:8px 0 2px;text-align:center;font-size:16px;color:#e9d9b0;opacity:0;animation:vsFade .5s .9s forwards}
#vsv .goal{margin:2px auto 10px;text-align:center;font-size:13.5px;color:#9fe0b0;opacity:0;animation:vsFade .5s 1s forwards}
#vsv .chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:0 0 12px}
#vsv .chips span{padding:4px 12px;border-radius:999px;background:#0008;border:1px solid #ffd77a55;color:#ffd77a;font-size:13.5px;opacity:0;animation:vsPop .4s cubic-bezier(.2,1.6,.4,1) forwards}
#vsv .cards{display:grid;gap:8px}
#vsv .card{display:grid;grid-template-columns:62px 1fr;gap:11px;align-items:center;padding:8px 12px 8px 8px;border-radius:13px;background:linear-gradient(100deg,#2b2a1bdd,#171b1fdd);border:1px solid #ffd77a44;opacity:0;transform:translateX(-26px);animation:vsCard .45s cubic-bezier(.2,1.2,.4,1) forwards}
#vsv .face{width:62px;height:62px;border-radius:11px;overflow:hidden;border:2px solid #ffd77a;background:#2a3140;display:grid;place-items:center;font:900 24px AgThai,sans-serif;color:#ffd77a}
#vsv .face img{width:100%;height:100%;object-fit:cover;object-position:50% 12%}
#vsv .nm{display:flex;justify-content:space-between;align-items:baseline;gap:8px;font-weight:800;font-size:16.5px;color:#fff1cf}
#vsv .nm .lv{font-size:12.5px;color:#cdb98a;font-weight:700;margin-left:6px;font-variant-numeric:tabular-nums}#vsv .nm .lv.up{color:#ff9d52;animation:vsPop .5s cubic-bezier(.2,1.8,.4,1)}
#vsv .nm .xp{color:#ffd77a;font-variant-numeric:tabular-nums;font-size:14.5px}
#vsv .bar{height:9px;margin-top:5px;border-radius:6px;background:#0009;overflow:hidden}#vsv .bar i{display:block;height:100%;width:0;border-radius:6px;background:linear-gradient(90deg,#ffb52e,#ffe08a);box-shadow:0 0 9px #ffc94e}
#vsv .hp{display:flex;align-items:center;gap:8px;margin-top:4px;font-size:12px;color:#cfc29c}#vsv .hp .hb{flex:1;height:5px;border-radius:4px;background:#0009;overflow:hidden}#vsv .hp .hb i{display:block;height:100%;background:linear-gradient(90deg,#5fd07a,#a8f0a0)}#vsv .hp b{color:#a8e6a0;font-weight:700}
#vsv .up-note{grid-column:1/-1;margin-top:2px;color:#ff9d52;font-weight:800;font-size:12.5px;animation:vsPop .5s both}
#vsv .job{margin-top:8px;padding:7px 12px;border-radius:11px;background:#ffffff0c;border:1px dashed #ffd77a44;font-size:13px;display:flex;align-items:center;gap:10px}#vsv .job .bar{flex:1;margin:0}
#vsv .btns{display:flex;gap:10px;justify-content:flex-end;align-items:center;margin-top:14px;opacity:0;animation:vsFade .4s forwards;animation-delay:var(--d,2.2s)}
#vsv .ic{width:20px;height:20px;vertical-align:-5px;margin-right:5px;object-fit:contain;filter:drop-shadow(0 1px 1px #000a)}#vsv .tile .ic{width:30px;height:30px;display:block;margin:0 auto 2px}#vsv .k .ic{width:16px;height:16px;vertical-align:-3px}
/* picture buttons: the battle button images, 9-sliced (same family as the quest window) */
#vsv button{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:42px;padding:0 20px;border:8px solid transparent;border-image:url(assets/ui/battle-btn.webp) 14 fill/8px stretch;color:#fff3d2;font:700 15px/1 VillageThai,"Noto Sans Thai",AgThai,sans-serif;text-shadow:0 1px 0 #000a;transition:transform .12s,filter .12s}
#vsv button:hover{filter:brightness(1.15);transform:translateY(-1px)}#vsv button:active{transform:translateY(1px)}#vsv button:focus-visible{outline:2px solid #ffd77a;outline-offset:2px}
#vsv .b1{border-image-source:url(assets/ui/battle-btn-hot.webp);color:#2a1a05;text-shadow:none;min-width:150px;font-size:16px}
#vsv .b1::after{content:"";width:0;height:0;border-left:8px solid currentColor;border-top:6px solid transparent;border-bottom:6px solid transparent}
#vsv .b2[data-a=back]::before{content:"";width:0;height:0;border-right:8px solid currentColor;border-top:6px solid transparent;border-bottom:6px solid transparent}
#vsv .b1[disabled]{filter:grayscale(.6) brightness(.7);cursor:default;transform:none}
#vsv .ex{display:inline-block;position:relative;width:14px;height:14px;margin-left:8px;vertical-align:-2px}#vsv .ex::before,#vsv .ex::after{content:"";position:absolute;left:6px;top:-1px;width:3px;height:16px;background:#ff9a8a;border-radius:2px;transform:rotate(45deg)}#vsv .ex::after{transform:rotate(-45deg)}
/* defeat: the same report in a cold, dark-red mood */
#vsv.vs-defeat{background:radial-gradient(ellipse at 50% 40%,#2a0f12aa 0,#07050aee 62%,#030204f2 100%)}#vsv.vs-defeat .rays{background:repeating-conic-gradient(from 0deg,#ff6a5a14 0 4deg,#0000 4deg 20deg)}
#vsv.vs-defeat .pg{background:linear-gradient(180deg,#1e1518f2,#0d0a0cf5);border-color:#9a5a55}#vsv.vs-defeat .pg::before,#vsv.vs-defeat .pg::after{border-color:#d98a80}
#vsv.vs-defeat h2{color:#ffb0a0;text-shadow:0 3px 0 #5a1810,0 0 26px #ff5a3c,0 0 60px #c8281c77;letter-spacing:.12em}#vsv.vs-defeat .crest{background:linear-gradient(90deg,#0000,#ff8a7a,#0000)}
#vsv.vs-defeat .chips span{color:#ffb0a0;border-color:#ff8a7a55}#vsv.vs-defeat .goal{color:#ffb0a0}#vsv.vs-defeat .bar{display:none}
#vsv.vs-defeat .rp h3{color:#ffb0a0;text-shadow:0 0 18px #ff5a3c66}
#vsv .chk{display:inline-block;width:7px;height:12px;margin-left:6px;border-right:3px solid #9fe0b0;border-bottom:3px solid #9fe0b0;transform:rotate(40deg) translate(-2px,-2px)}
#vsv .hint{margin-right:auto;font-size:11.5px;color:#9aa6a0}
/* page 2 — report */
#vsv .rp h3{margin:0 0 8px;text-align:center;font:900 24px AgThai,Georgia,serif;letter-spacing:.08em;color:#ffd77a;text-shadow:0 0 18px #ffb52e66}
#vsv .mvp{display:grid;grid-template-columns:64px 1fr;gap:12px;align-items:center;padding:9px 12px;margin-bottom:10px;border-radius:13px;background:linear-gradient(100deg,#3a2f17ee,#1a1d22ee);border:1px solid #ffd77a88;box-shadow:inset 0 0 24px #ffd77a14}
#vsv .mvp small{display:block;color:#ffd77a;letter-spacing:.14em;font-size:11.5px}#vsv .mvp b{font-size:18px;color:#fff1cf}#vsv .mvp p{margin:2px 0 0;font-size:12.5px;color:#cfc29c}
#vsv .tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:10px}
#vsv .tile{padding:7px 4px;text-align:center;border-radius:10px;background:#ffffff0d;border:1px solid #ffffff1a}#vsv .tile b{display:block;font-size:19px;color:#ffe08a;font-variant-numeric:tabular-nums}#vsv .tile span{font-size:11.5px;color:#b9c2c4}
#vsv .rows{display:grid;gap:7px;margin-bottom:10px}
#vsv .row{display:grid;grid-template-columns:78px 1fr;gap:9px;align-items:center;font-size:13px}#vsv .row .n{font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#vsv .row .b{display:grid;gap:3px}#vsv .row .b div{display:flex;align-items:center;gap:6px;font-size:11.5px;color:#cfd6d6}#vsv .row .b em{flex:0 0 52px;font-style:normal;text-align:right;font-variant-numeric:tabular-nums}
#vsv .row .b i{display:block;height:7px;border-radius:5px;min-width:3px;width:0;transition:width .8s cubic-bezier(.2,.8,.2,1)}#vsv .row .b .d i{background:linear-gradient(90deg,#ffb52e,#ffe08a)}#vsv .row .b .t i{background:linear-gradient(90deg,#d8584a,#ff9a8a)}
#vsv .row .k{font-size:12px;color:#ffd77a}
#vsv .cardsUsed{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 4px}#vsv .cardsUsed span{padding:3px 10px;border-radius:8px;background:#ffffff10;border:1px solid #ffffff22;font-size:12.5px}#vsv .cardsUsed b{color:#ffe08a}
#vsv .lg{display:inline-block;width:18px;height:7px;border-radius:4px;margin:0 5px 0 8px;vertical-align:1px}#vsv .lg.d{background:linear-gradient(90deg,#ffb52e,#ffe08a)}#vsv .lg.t{background:linear-gradient(90deg,#d8584a,#ff9a8a)}#vsv .lbl{margin:6px 0 4px;font-size:12px;letter-spacing:.1em;color:#9fb3b8}
#vsv.skip *{animation-delay:0s!important;animation-duration:.01s!important}
@keyframes vsIn{from{opacity:0}}@keyframes vsSpin{to{transform:rotate(360deg)}}@keyframes vsLine{to{width:min(440px,72vw)}}
@keyframes vsLetter{to{opacity:1;transform:none}}@keyframes vsFade{to{opacity:1}}@keyframes vsCard{to{opacity:1;transform:none}}@keyframes vsPop{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:none}}
@media (max-width:560px){#vsv .tiles{grid-template-columns:repeat(2,1fr)}#vsv .pg{padding:16px 14px}}
@media (prefers-reduced-motion:reduce){#vsv,#vsv *{animation-duration:.01s!important;animation-delay:0s!important;transition-duration:.01s!important}}`;

  const portrait = m => 'assets/portraits/' + (m.pic || m.id || 'hero-male') + '-neutral.webp';   /* v98.996 · the NORMAL face (not happy) */
  const num = n => Math.round(+n || 0).toLocaleString('en-US');
  /* v98.997 · pictures instead of emoji: the game's own icon sets (assets/icons/pack · assets/icons/menu) */
  const ic = (f, c = '') => `<img class="ic ${c}" alt="" draggable="false" src="assets/icons/${f}.webp">`;

  function show(d, opt = {}) {
    return new Promise(done => {
      fightUI(true);
      const doc = document;
      if (!doc.getElementById('vsvCss')) { const c = doc.createElement('style'); c.id = 'vsvCss'; c.textContent = CSS; doc.head.append(c) }
      doc.getElementById('vsv')?.remove();
      const members = (d.members || []).filter(Boolean), S = d.stat || null, id = m => m.id ?? m.key ?? m.name;
      const el = doc.createElement('div'); el.id = 'vsv'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', d.defeat ? 'พ่ายแพ้' : 'ชัยชนะ'); if (d.defeat) el.classList.add('vs-defeat');
      const word = (d.defeat ? 'DEFEAT' : 'VICTORY!').split('').map((c, i) => `<span style="animation-delay:${.2 + i * .08}s">${c}</span>`).join('');
      const t0 = 1.35, step = .36;
      const chips = [d.kills ? [ic('pack/skull'), 'ล้มศัตรู ' + d.kills + ' ตัว'] : null, d.turns || S?.turns ? [ic('pack/refresh'), (d.turns || S.turns) + ' เทิร์น'] : null, d.gold ? [ic('menu/treasure'), '+' + d.gold + ' เหรียญ'] : null, ...(d.loot || []).map(x => [ic('menu/bag'), x]), ...(d.notes || []).map(x => [ic('pack/def'), x])].filter(Boolean);
      const card = (m, i) => `<div class="card" data-i="${i}" style="animation-delay:${t0 + i * step}s"><div class="face"><img alt="" src="${esc(portrait(m))}" onerror="if(!this.dataset.f){this.dataset.f=1;this.src='assets/cards/portraits/u-${esc(m.pic && !/^hero-/.test(m.pic) ? m.pic : 'hero')}.webp'}else this.remove()"><span>${esc((m.name || '?')[0])}</span></div>
        <div><div class="nm"><span>${esc(m.name)}<span class="lv">${m.lv0 != null ? 'Lv.' + m.lv0 : ''}</span></span><span class="xp" data-g="${m.gain || 0}">${m.gain ? 'EXP +0' : ''}</span></div><div class="bar"><i></i></div>
        <div class="hp"><span>HP</span><div class="hb"><i style="width:${m.max ? Math.max(0, Math.min(100, m.hp / m.max * 100)) : 0}%"></i></div><b>${num(m.hp)}/${num(m.max)}</b></div></div></div>`;
      const job = d.job ? `<div class="job"><b>${esc((d.job.icon || '') + ' ' + (d.job.name || ''))}</b><span class="lv${d.job.ups?.length ? ' up' : ''}">Lv.${d.job.lv}</span><div class="bar"><i style="width:${d.job.lv >= d.job.max ? 100 : Math.min(100, d.job.jp / d.job.need * 100)}%;background:${esc(d.job.col || '#ffd77a')}"></i></div><span>${d.job.ups?.length ? 'อาชีพเลเวลอัป!' : 'แต้มอาชีพ'}</span></div>` : '';
      const btnD = t0 + members.length * step + .9;
      el.innerHTML = `<div class="rays"></div><canvas></canvas><div class="book">
        <section class="pg fr"><div class="crest"></div><h2>${word}</h2>
          <div class="sub">${esc(String(d.title || (d.defeat ? 'พ่ายแพ้' : 'ชนะการต่อสู้')).replace(/\s*·\s*$/, ''))}</div>${d.goal ? `<div class="goal">${ic('pack/crown')}เป้าหมาย: ${esc(d.goal)}${d.defeat ? '<i class="ex"></i>' : '<i class="chk"></i>'}</div>` : ''}
          <div class="chips">${chips.map(([i0, x], i) => `<span style="animation-delay:${1.05 + i * .1}s">${i0}${esc(x)}</span>`).join('')}</div>
          <div class="cards">${members.map(card).join('')}</div>${job}
          <div class="btns" style="--d:${btnD}s">${S ? '<button class="b2" data-a="more" type="button">ดูรายละเอียดการต่อสู้</button>' : ''}<button class="b1" data-a="go" type="button" disabled>Continue</button></div></section>
        <section class="pg rp" hidden>${S ? report(d, members, S) : ''}</section></div>`;
      document.body.append(el);
      try { root.Sfx?.play?.(d.defeat ? 'lose' : 'victory') } catch (e) { } if (!d.defeat) try { root.GameBGM?.force?.('victory') } catch (e) { }
      /* gold sparks */
      const cv = el.querySelector('canvas'), g = cv.getContext('2d'); let raf = 0, W = 0, H = 0; const P = Array.from({ length: 64 }, () => ({ x: Math.random(), y: Math.random(), s: .4 + Math.random() * 1.3, v: .0004 + Math.random() * .0011, p: Math.random() * 6 }));
      const fit = () => { W = cv.width = innerWidth; H = cv.height = innerHeight }; fit(); addEventListener('resize', fit);
      const frame = t => { g.clearRect(0, 0, W, H); for (const q of P) { q.y -= q.v * 16; if (q.y < -.05) { q.y = 1.05; q.x = Math.random() } const a = .3 + .45 * Math.sin(t / 500 + q.p); g.fillStyle = `rgba(255,${200 + ((q.p * 20) | 0)},110,${Math.max(0, a)})`; g.beginPath(); g.arc(q.x * W + Math.sin(t / 900 + q.p) * 14, q.y * H, q.s * 2.1, 0, 7); g.fill() } raf = requestAnimationFrame(frame) }; raf = requestAnimationFrame(frame);

      /* EXP bars (with level-ups when the host knows the levels) */
      const timers = []; let skipped = false, closed = false, ready = false, page = 'fr';
      const sleep = ms => new Promise(r => timers.push(setTimeout(r, skipped ? 0 : ms)));
      const barOf = c => c.querySelector('.bar i'), xpOf = c => c.querySelector('.xp'), lvOf = c => c.querySelector('.lv');
      function setFinal(c, m) {
        const need = m.needFn || null, lv = m.lv1 ?? m.lv0, b = barOf(c);
        b.style.transition = 'none'; b.style.width = (need && m.xp1 != null ? Math.min(100, m.xp1 / need(lv) * 100) : (m.gain ? Math.min(100, 30 + m.gain) : 0)) + '%';
        const x = xpOf(c); if (+x.dataset.g) x.textContent = 'EXP +' + x.dataset.g; if (m.lv1 != null) { lvOf(c).textContent = 'Lv.' + m.lv1; if (m.lv1 > m.lv0) lvOf(c).classList.add('up') }
        if (m.lv1 > m.lv0 && !c.querySelector('.up-note')) c.querySelector('div:last-child').insertAdjacentHTML('beforeend', `<div class="up-note">LEVEL UP! → Lv.${m.lv1}${m.upNote ? ' · ' + esc(m.upNote) : ''}</div>`);
      }
      (async () => {
        await sleep(t0 * 1000 + 200);
        for (const [i, m] of members.entries()) {
          if (skipped) break; const c = el.querySelector(`.card[data-i="${i}"]`); if (!c) continue; const b = barOf(c), x = xpOf(c), n = +x.dataset.g, need = m.needFn;
          if (n) { const t1 = performance.now(); const tick = now => { if (skipped) return; const k = Math.min(1, (now - t1) / 900); x.textContent = 'EXP +' + Math.round(n * k); if (k < 1) requestAnimationFrame(tick) }; requestAnimationFrame(tick) }
          if (need && m.xp0 != null && m.xp1 != null && m.lv0 != null && m.lv1 != null) {
            b.style.transition = 'none'; b.style.width = Math.min(100, m.xp0 / need(m.lv0) * 100) + '%'; void b.offsetWidth; b.style.transition = 'width .55s ease';
            let lv = m.lv0;
            while (lv < m.lv1 && !skipped) { b.style.width = '100%'; await sleep(600); lv++; lvOf(c).textContent = 'Lv.' + lv; lvOf(c).classList.remove('up'); void lvOf(c).offsetWidth; lvOf(c).classList.add('up'); try { root.Sfx?.play?.('level-up') } catch (e) { }
              if (!c.querySelector('.up-note')) c.querySelector('div:last-child').insertAdjacentHTML('beforeend', `<div class="up-note">LEVEL UP! → Lv.${m.lv1}${m.upNote ? ' · ' + esc(m.upNote) : ''}</div>`);
              b.style.transition = 'none'; b.style.width = '0%'; void b.offsetWidth; b.style.transition = 'width .55s ease' }
            if (!skipped) { b.style.width = Math.min(100, m.xp1 / need(m.lv1) * 100) + '%'; await sleep(420) }
          } else { b.style.transition = 'width 1s cubic-bezier(.2,.8,.2,1)'; b.style.width = (m.gain ? Math.min(100, 30 + m.gain) : 0) + '%'; await sleep(420) }
        }
        finishAll();
      })();
      function finishAll() { skipped = true; el.classList.add('skip'); members.forEach((m, i) => { const c = el.querySelector(`.card[data-i="${i}"]`); if (c) setFinal(c, m) }); ready = true; const go = el.querySelector('.b1'); if (go) go.disabled = false }
      timers.push(setTimeout(() => { const go = el.querySelector('.b1'); if (go && !skipped && !go.disabled) { /* never lock the player out: the button opens even if the animation is still running */ go.disabled = false } }, (btnD + .6) * 1000));

      /* page flip */
      function flip(to) {
        if (!S || to === page) return; const a = el.querySelector(page === 'fr' ? '.fr' : '.rp'), b = el.querySelector(to === 'fr' ? '.fr' : '.rp'); a.classList.add('out');
        setTimeout(() => { a.hidden = true; a.classList.remove('out'); b.hidden = false; b.classList.add('out'); void b.offsetWidth; b.classList.remove('out'); page = to; if (to === 'rp') el.querySelectorAll('.rp .row i[data-w]').forEach(i => { i.style.width = i.dataset.w + '%' }) }, 340);
      }
      function close() {
        if (closed) return; closed = true; removeEventListener('keydown', key, true); removeEventListener('resize', fit); cancelAnimationFrame(raf); timers.forEach(clearTimeout); try { root.GameBGM?.force?.(null) } catch (e) { }
        el.style.transition = 'opacity .35s'; el.style.opacity = '0'; setTimeout(() => { el.remove(); if (opt.keepFight !== true) fightUI(false); done() }, 340);
      }
      el.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) { if (!skipped) finishAll(); return }   /* a click on the backdrop only finishes the animation */
        if (b.dataset.a === 'go') { if (!b.disabled) close() } else if (b.dataset.a === 'more') flip('rp'); else if (b.dataset.a === 'back') flip('fr');
      });
      const key = e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); if (!skipped) { finishAll(); return } if (ready) close() }
        else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); e.stopPropagation(); if (skipped || ready) flip('rp') }
        else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); e.stopPropagation(); flip('fr') }
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation() }
      };
      addEventListener('keydown', key, true);
    });
  }

  /* ---- page 2: the report ---- */
  function report(d, members, S) {
    const idOf = m => m.id ?? m.key ?? m.name, nameOf = id => members.find(m => idOf(m) === id)?.name || (id === 'hero' ? 'ตัวเอก' : id);
    const ids = members.map(idOf), dealt = S.dealt || {}, taken = S.taken || {}, kills = S.kills || {}, healed = S.healed || {};
    const mx = Math.max(1, ...ids.map(i => dealt[i] || 0), ...ids.map(i => taken[i] || 0));
    const score = i => (dealt[i] || 0) + (kills[i] || 0) * 15 + (healed[i] || 0) * .8;
    const best = ids.slice().sort((a, b) => score(b) - score(a))[0], bm = members.find(m => idOf(m) === best);
    const topKill = ids.reduce((a, i) => (kills[i] || 0) > (kills[a] || 0) ? i : a, ids[0]);
    const why = !bm ? '' : (kills[best] && kills[best] === Math.max(...ids.map(i => kills[i] || 0)) ? `ล้มศัตรูมากที่สุด ${kills[best]} ตัว · ` : '') + 'ทำดาเมจรวม ' + num(dealt[best] || 0) + (S.maxHit && S.maxHit.by === best ? ` · แรงสุด ${num(S.maxHit.dmg)}` : '');
    const total = ids.reduce((a, i) => a + (dealt[i] || 0), 0);
    const mini = [['pack/atk', total, 'ดาเมจรวมที่ทำ'], ['pack/burst', S.maxHit?.dmg || 0, 'ท่าที่แรงที่สุด'], ['pack/power', S.crit || 0, 'คริติคอล'], ['pack/refresh', S.turns ?? d.turns ?? 0, 'เทิร์นที่ใช้'],
      ['pack/fire', S.adv || 0, 'ได้เปรียบธาตุ'], ['pack/def', S.dis || 0, 'เสียเปรียบธาตุ'], ['pack/shuriken', S.flank || 0, 'โจมตีข้าง/หลัง'], ['pack/arrow', S.high || 0, 'โจมตีจากที่สูง'],
      ['pack/nature', S.dotFoe || 0, 'ดาเมจพิษ/ไฟลุกที่ทำศัตรู'], ['pack/skull', S.dotUs || 0, 'ดาเมจพิษ/ไฟลุกที่เราโดน'], ['pack/heal', Object.values(S.healed || {}).reduce((a, x) => a + x, 0), 'ฟื้นฟูรวมทั้งทีม'], ['menu/potion', S.items || 0, 'ครั้งที่ใช้ไอเทม']];
    return `<h3>รายงานการต่อสู้</h3>
      ${bm ? `<div class="mvp"><div class="face" style="width:64px;height:64px;border-radius:12px;overflow:hidden;border:2px solid #ffd77a;background:#2a3140;display:grid;place-items:center"><img alt="" style="width:100%;height:100%;object-fit:cover;object-position:50% 12%" src="${esc(portrait(bm))}" onerror="this.remove()"></div><div><small>ดาวเด่นของการต่อสู้</small><b>${esc(bm.name)}</b><p>${esc(why)}</p></div></div>` : ''}
      <div class="tiles">${mini.map(([i0, v, t]) => `<div class="tile">${ic(i0)}<b>${num(v)}</b><span>${t}</span></div>`).join('')}</div>
      <div class="lbl">แยกตามคน<span class="lg d"></span>ดาเมจที่ทำ  <span class="lg t"></span>ดาเมจที่รับ</div>
      <div class="rows">${ids.map(i => `<div class="row"><div class="n">${esc(nameOf(i))}</div><div class="b"><div class="d"><em>${num(dealt[i] || 0)}</em><i data-w="${Math.round((dealt[i] || 0) / mx * 100)}"></i></div><div class="t"><em>${num(taken[i] || 0)}</em><i data-w="${Math.round((taken[i] || 0) / mx * 100)}"></i></div>${kills[i] || healed[i] ? `<div class="k">${kills[i] ? ic('pack/skull') + 'ล้มศัตรู ' + kills[i] + ' ตัว' : ''}${kills[i] && healed[i] ? ' · ' : ''}${healed[i] ? ic('pack/heal') + 'ฟื้นให้ ' + num(healed[i]) : ''}</div>` : ''}</div></div>`).join('')}</div>
      ${(S.cards || []).length ? `<div class="lbl">การ์ดที่ใช้บ่อย</div><div class="cardsUsed">${S.cards.slice(0, 5).map(([n, c]) => `<span>${esc(n)} <b>×${c}</b></span>`).join('')}</div>` : ''}
      <div class="btns" style="--d:.2s"><button class="b2" data-a="back" type="button">กลับ</button><button class="b1" data-a="go" type="button">Continue</button></div>`;
  }

  /* ---- helpers for the hosts: snapshot the levels before the EXP is paid, read them after ---- */
  const needHero = lv => (root.Progression?.heroNeed || (l => 60 + 40 * l))(lv), needAlly = lv => (root.Progression?.allyNeed || (l => l * 80))(lv);
  function snap(g) {
    const v = g?.village || {}, c = v.character || {}, out = { hero: { lv: c.level || 1, xp: c.xp || 0 }, allies: {} };
    for (const p of v.party || []) out.allies[p.key] = { lv: p.level || 1, xp: p.xp || 0 };
    return out;
  }
  /* members = hero + the party after the fight; `before` = snap() taken before the EXP was paid; `gain` = hero EXP (allies get 80 %) */
  function members(g, before, gain, opt = {}) {
    const v = g?.village || {}, c = v.character || {}, female = (() => { try { return root.HeroVariant?.get?.() === 'female' } catch (e) { return false } })(), look = female ? 'hero-female' : 'hero-male', other = female ? 'hero-male' : 'hero-female';
    const heroName = (() => { try { return root.WorldState?.heroName?.() || v.heroName || 'ตัวเอก' } catch (e) { return 'ตัวเอก' } })(), fought = opt.fought;
    const list = [{ id: 'hero', name: heroName, pic: look, hp: g?.hp ?? 0, max: g?.maxHp ?? 0, gain, lv0: before?.hero.lv, lv1: c.level || 1, xp0: before?.hero.xp, xp1: c.xp || 0, needFn: needHero }];
    for (const p of v.party || []) { if (fought && !fought.includes(p.key)) continue; const b = before?.allies?.[p.key];
      list.push({ id: p.key, name: p.name || p.key, pic: p.key === 'sib' ? other : p.key, hp: p.hp, max: p.max, gain: Math.round(gain * .8), lv0: b?.lv, lv1: p.level || 1, xp0: b?.xp, xp1: p.xp || 0, needFn: needAlly }) }
    return list;
  }
  root.VictoryScreen = { show, fightUI, snap, members };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.VictoryScreen;
})(typeof window !== 'undefined' ? window : globalThis);
