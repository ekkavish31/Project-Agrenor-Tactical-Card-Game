/* v98.573 · BattleTalk — a conversation window that opens ON TOP of a running battle (Disgaea style): the field stays visible behind it,
   the speaker's portrait stands beside a wide text box, the line is typed with the shared old-RPG voice (js/dialogue-fx.js).

   BattleTalk.play(lines, opt) → Promise (resolves when the player has read / skipped it all)
     lines : [{ who:'hero'|'pip'|'helga'|…|null, text, emo:'neutral|happy|angry|worry|sad', name?, side:'L'|'R'?, tag? }]
             who = null → narration (no portrait, centred box)
     The hero stands on the left, everybody else on the right (override with side). Unknown ids show a name plate + icon only.
   Click / Space / Enter = next (first press completes the typing) · Esc or "ข้าม ▸▸" = skip the rest · the battle waits meanwhile.
   BattleTalk.name(who) · BattleTalk.portrait(who, emo) → image path or null · BattleTalk.busy() */
(function (root) {
  'use strict';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const PLAIN = new Set('pip oren hilda lin guard grev gus tom may marta mira saf mil luna bram kier orla ren nadia sigrid mom'.split(' '));
  const STORY = new Set('corvin helga darren mierris lorrik serrien irene vik'.split(' '));
  const ALIAS = { elder: 'oren' };
  const NAMES = { elder: 'ผู้ใหญ่บ้านโอเรน', mip: 'Mip', unknown: '???', goat: 'แพะ', murk: 'สัตว์รอยหมอง', mom: 'แม่' };
  const ICONS = { goat: '🐐', murk: '🐺', unknown: '❔', boss: '👁' };
  const MOODS = { neutral: 'neutral', happy: 'happy', angry: 'angry', worry: 'worry', sad: 'worry', surprised: 'worry', calm: 'neutral' };
  const heroName = () => { try { return (root.WorldState?.heroName?.() || root.s?.village?.heroName) || 'นักผจญภัย' } catch (e) { return 'นักผจญภัย' } };
  const female = () => { try { return /female/.test(root.HeroVariant?.get?.() || '') } catch (e) { return false } };
  const fill = t => String(t ?? '').replace(/\{hero\}/g, heroName());

  function name(who) {
    if (!who) return '';
    if (who === 'hero') return heroName();
    const S = root.STORY_DATA?.SPEAKERS?.[who], n = S && (typeof S.name === 'function' ? S.name() : S.name);
    return String(NAMES[who] || n || who).split(' · ')[0];
  }
  /* the painted bust, or null (then the plate shows an icon) */
  function portrait(who, emo = 'neutral') {
    if (!who) return null; who = ALIAS[who] || who; const m = MOODS[emo] || 'neutral';
    if (who === 'hero') { const g = female() ? 'female' : 'male', e = ({ neutral: 'neutral', happy: 'happy', angry: 'angry', worry: 'worry', sad: 'sad', calm: 'calm' })[emo] || 'neutral'; return `assets/portraits/hero-${g}-${e}.webp` }
    if (who === 'boss') return 'assets/cards/portraits/en-bandit.webp';
    if (who === 'mip') return 'mip'; if (who === 'sib') return female() ? 'assets/portraits/hero-male-' + m + '.webp' : 'assets/portraits/hero-female-' + m + '.webp';
    if (STORY.has(who)) return `assets/portraits/story/${who}-${m}.webp`;
    if (PLAIN.has(who)) return `assets/portraits/${who}-${m === 'worry' && /^(hilda|lin|guard)$/.test(who) ? 'surprised' : m}.webp`;   /* hilda · lin · guard have 'surprised' in place of 'worry' */
    return null;
  }

  let el = null, running = null, T = null;
  function css() {
    if (document.getElementById('btCss')) return; const s = document.createElement('style'); s.id = 'btCss';
    s.textContent = `#btTalk{position:fixed;inset:0;z-index:2500;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;font-family:AgThai,system-ui,sans-serif;user-select:none;-webkit-user-select:none;cursor:pointer;background:linear-gradient(to top,#04060cd8 0,#04060c66 34%,#04060c00 62%);animation:btIn .22s ease-out}
#btTalk.out{animation:btOut .2s ease-in forwards}@keyframes btIn{from{opacity:0}to{opacity:1}}@keyframes btOut{to{opacity:0}}
#btTalk .bt-row{position:relative;width:min(1040px,100vw);height:min(46vh,430px);pointer-events:none}
#btTalk .bt-pic{position:absolute;bottom:-2px;height:100%;aspect-ratio:1/1;display:flex;align-items:flex-end;justify-content:center;transition:filter .2s,opacity .2s,transform .28s cubic-bezier(.2,.9,.3,1.2)}
#btTalk .bt-pic.L{left:1%;transform:translateX(0)}#btTalk .bt-pic.R{right:1%;transform:translateX(0)}
#btTalk .bt-pic.in.L{animation:btL .3s cubic-bezier(.2,.9,.3,1.1)}#btTalk .bt-pic.in.R{animation:btR .3s cubic-bezier(.2,.9,.3,1.1)}
@keyframes btL{from{transform:translateX(-60px);opacity:0}}@keyframes btR{from{transform:translateX(60px);opacity:0}}
#btTalk .bt-pic img,#btTalk .bt-pic .bt-sprite{max-width:100%;max-height:100%;object-fit:contain;object-position:bottom;filter:drop-shadow(0 8px 14px #000c);-webkit-mask-image:linear-gradient(to bottom,#000 84%,#0000 100%);mask-image:linear-gradient(to bottom,#000 84%,#0000 100%)}
#btTalk .bt-pic .bt-sprite{width:70%;aspect-ratio:1/1;background:url(assets/ui/mip-sheet.webp?v=2) 0 50%/1200% 100% no-repeat}
#btTalk .bt-pic .bt-icon{font-size:min(18vh,150px);filter:drop-shadow(0 6px 10px #000c);margin-bottom:10%}
#btTalk .bt-pic.dim{filter:brightness(.45) saturate(.6);transform:scale(.95)}
#btTalk .bt-pic.R.shake img,#btTalk .bt-pic.L.shake img{animation:btShake .3s}@keyframes btShake{25%{transform:translateX(-8px)}75%{transform:translateX(8px)}}
#btTalk .bt-box{position:relative;width:min(980px,calc(100vw - 24px));min-height:128px;margin:0 0 14px;padding:26px 28px 16px;box-sizing:border-box;border-radius:14px;background:linear-gradient(#1b2438f2,#0e1424f2);border:2px solid #d9b46b;box-shadow:0 0 0 3px #0008,0 14px 40px #000b,inset 0 0 0 1px #ffe8a633;color:#f6ead0;pointer-events:auto}
#btTalk .bt-name{position:absolute;top:-17px;left:26px;padding:3px 20px;border-radius:9px;background:linear-gradient(#e3bb68,#b98a34);color:#2a1d08;font:700 17px/1.4 AgThai,system-ui,sans-serif;box-shadow:0 3px 8px #0009;border:1.5px solid #fff3c4aa}
#btTalk .bt-name.R{left:auto;right:26px}#btTalk .bt-name:empty{display:none}
#btTalk .bt-text{font:19px/1.65 AgThai,system-ui,sans-serif;min-height:3.3em;white-space:pre-wrap}
#btTalk .bt-narr .bt-text{text-align:center;font-style:italic;color:#e8dcc0}
#btTalk .bt-next{position:absolute;right:16px;bottom:8px;font-size:15px;color:#ffd98a;animation:btBob 1s ease-in-out infinite;opacity:0}#btTalk.more .bt-next{opacity:1}
@keyframes btBob{50%{transform:translateY(4px)}}
#btTalk .bt-skip{position:absolute;top:12px;right:14px;padding:5px 14px;border-radius:9px;border:1.5px solid #b49a5a;background:#1b1624dd;color:#ffe2a8;font:600 14px AgThai,system-ui,sans-serif;cursor:pointer;pointer-events:auto}
#btTalk .bt-skip:hover{background:#2c2440}
@media(max-width:700px){#btTalk .bt-row{height:34vh}#btTalk .bt-text{font-size:16.5px}}`;
    document.head.append(s);
  }

  function play(lines, opt = {}) {
    lines = (lines || []).filter(l => l && l.text); if (!lines.length) return Promise.resolve();
    if (running) return running.then(() => play(lines, opt));
    css();
    running = new Promise(resolve => {
      el = document.createElement('div'); el.id = 'btTalk';
      el.innerHTML = '<button type="button" class="bt-skip">ข้าม ▸▸</button><div class="bt-row"></div><div class="bt-box"><div class="bt-name"></div><div class="bt-text"></div><div class="bt-next">▼</div></div>';
      document.body.append(el);
      const row = el.querySelector('.bt-row'), box = el.querySelector('.bt-box'), nm = el.querySelector('.bt-name'), tx = el.querySelector('.bt-text');
      const slots = {}; let i = -1, done = false, typing = false;
      const pics = new Map();   /* who → element */
      const sideOf = (l, w) => l.side || (w === 'hero' ? 'L' : 'R');
      function showPic(l) {
        for (const [, p] of pics) p.classList.add('dim');
        if (!l.who) return;
        const w = l.who, side = sideOf(l, w); let p = pics.get(w + side);
        if (slots[side] && slots[side] !== p) { slots[side].remove(); for (const [k, v] of pics) if (v === slots[side]) pics.delete(k) }
        if (!p) {
          p = document.createElement('div'); p.className = 'bt-pic ' + side + ' in'; pics.set(w + side, p); slots[side] = p; row.append(p);
        }
        const src = portrait(w, l.emo);
        if (src === 'mip') p.innerHTML = '<div class="bt-sprite"></div>';
        else if (src) { const im = new Image(); im.alt = ''; im.draggable = false; im.onerror = () => { if (!im.dataset.fb) { im.dataset.fb = 1; im.src = src.replace(/-[a-z]+\.webp$/, '-neutral.webp') } else if (!im.dataset.fb2) { im.dataset.fb2 = 1; im.src = src.replace(/-[a-z]+\.webp$/, '-surprised.webp') } else im.remove() }; im.src = src; p.replaceChildren(im) }
        else p.innerHTML = '<span class="bt-icon">' + (ICONS[w] || '💬') + '</span>';
        p.classList.remove('dim'); if (l.shake) { p.classList.remove('shake'); void p.offsetWidth; p.classList.add('shake') }
        setTimeout(() => p.classList.remove('in'), 340);
      }
      function end() {
        if (done) return; done = true; T?.stop(); T = null; document.removeEventListener('keydown', key, true); el.classList.add('out');
        const e = el; el = null; setTimeout(() => { e.remove(); running = null; resolve() }, 200);
      }
      function show() {
        const l = lines[i], text = fill(l.text); box.classList.toggle('bt-narr', !l.who); showPic(l);
        nm.textContent = l.who ? (l.name || name(l.who)) : (l.name || ''); nm.classList.toggle('R', l.who && sideOf(l, l.who) === 'R'); el.classList.remove('more'); typing = true;
        if (root.DialogueFX) {
          T?.stop(); tx.textContent = '';
          T = root.DialogueFX.create(tx, { maxLines: 3, voice: l.who || null, onPageStart: () => { typing = true; el?.classList.remove('more') }, onPageDone: () => { typing = false; el?.classList.add('more') } });
          T.load([text]); T.start();
        } else { tx.textContent = text; typing = false; el.classList.add('more') }
        try { opt.onLine?.(l, i) } catch (e) { }
      }
      function next() {
        if (done) return;
        if (T && typing && T.finish()) return;              /* 1st press completes the page */
        if (T && T.hasMore()) { T.nextPage(); return }        /* long line → next page */
        i++; if (i >= lines.length) return end(); show();
      }
      const key = e => { if (!el) return; if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); end() } else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); next() } else if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) e.stopPropagation() };
      document.addEventListener('keydown', key, true);
      el.addEventListener('click', e => { if (e.target.closest('.bt-skip')) { e.stopPropagation(); end(); return } next() });
      next();
    });
    return running;
  }
  /* conversations for the story fights that are not set-pieces, keyed by the ?tut= id (set-pieces carry their own in js/set-pieces.js: sc.talk)
     keys: start · half (enemy side at half) · win · lose · each is a lines array */
  const scripts = {
    pumpkin: {
      start: [{ who: 'hilda', emo: 'worry', text: 'ระวังนะ! พวกศัตรูพืชซุกอยู่ใต้ใบ — ส่วนลูกที่สุกแล้ว พอล้มมันจะกลายเป็นฟักทองให้เก็บเลย' }, { who: 'hero', emo: 'angry', text: 'รับทราบ พี่ฮิลดา! ข้าจัดการเอง' }],
      half: [{ who: 'hilda', emo: 'happy', text: 'ดีมาก! อีกนิดเดียว อย่าให้มันเหยียบแปลงข้านะ!' }],
      win: [{ who: 'hilda', emo: 'happy', text: 'เก่งจริง ๆ! เก็บลูกที่สุกไปได้เลย ส่วนลูกประกวดข้าจะดูแลเองอีกที' }], lose: [{ who: 'hilda', emo: 'worry', text: 'พอก่อน ๆ! เดี๋ยวค่อยมาใหม่ก็ได้ ฟักทองไม่หนีไปไหนหรอก' }]
    },
    cave: {
      start: [{ who: 'hero', emo: 'worry', text: 'ข้างหน้าเงียบเกินไป… มีอะไรซุ่มอยู่แน่ ๆ' }],
      win: [{ who: 'hero', emo: 'happy', text: 'รอดแล้ว! เดินต่อไปทางเหมืองเก่าได้' }]
    },
    raid: {
      start: [{ who: 'guard', emo: 'angry', text: 'โจรป่า! ทุกคนหลบเข้ามาหลังข้า — {hero} อยู่ใกล้ ๆ ไว้ อย่าห่างกัน!' }, { who: 'boss', emo: 'angry', text: 'ฮ่า! ของมีค่าในหมู่บ้านนี้ ข้าจะเอาไปให้หมด!' }, { who: 'hero', emo: 'angry', text: 'ไม่ให้แตะต้องงานเทศกาลเด็ดขาด!' }],
      half: [{ who: 'guard', emo: 'happy', text: 'ดีมาก! พวกมันเริ่มแตกแถวแล้ว กดต่อไป!' }]
    },
    expedition: {
      start: [{ who: 'hero', emo: 'neutral', text: 'ค่ายโจรอยู่ข้างหน้า… ต้องล้มพวกมันให้หมด เพื่อให้เฟิร์นเวลปลอดภัย' }],
      win: [{ who: 'hero', emo: 'happy', text: 'พวกมันเงียบแล้ว — ไปดูข้างในค่ายกัน' }]
    }
  };
  root.BattleTalk = { play, name, portrait, scripts, busy: () => !!running };
})(typeof window !== 'undefined' ? window : globalThis);
