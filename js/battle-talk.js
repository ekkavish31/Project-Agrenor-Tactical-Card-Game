/* v98.573 · BattleTalk — a conversation window that opens ON TOP of a running battle (Disgaea style): the field stays visible behind it,
   the speaker's portrait stands beside a wide text box, the line is typed with the shared old-RPG voice (js/dialogue-fx.js).

   BattleTalk.play(lines, opt) → Promise (resolves when the player has read / skipped it all)
     lines : [{ who:'hero'|'pip'|'helga'|…|null, text, emo:'neutral|happy|angry|worry|sad', name?, side:'L'|'R'?, tag? }]
             who = null → narration (no portrait, centred box)
     The hero stands on the left, everybody else on the right (override with side). Unknown ids show a name plate + icon only.
   Click / Space / Enter = next (first press completes the typing) · Esc or "ข้าม ▸▸" = skip the rest · the battle waits meanwhile.
   BOSS SPEAKERS (v98.1021): who:'b:<kind>' (e.g. 'b:wolf', 'b:frostQueen') = a boss in its own plate. Its picture is assets/portraits/boss-<kind>-<neutral|angry|worry|happy>.webp when that file exists (probed once; until then the plate shows the boss icon).
     Bosses do not speak in words (their lines are sounds / actions in brackets, written only from what the player can see — no new lore). BattleTalk.bosses[kind] = { start, half, win, lose } is used by town-battle for the world-map boss fights that have no scene of their own.
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
  /* v98.1021 · boss speakers: who = 'b:<kind>' */
  const BOSS_ID = { treant: ['พฤกษาเฒ่าคลั่ง', '🌳'], crystalKing: ['ราชาโกเล็มผลึก', '💎'], bogHydra: ['ไฮดราบึงพิษ', '🐍'], coralGolem: ['โกเล็มปะการัง', '🪸'], voidKing: ['ราชาแห่งความว่างเปล่า', '👑'], wolf: ['จ่าฝูงหมาป่า', '🐺'], golem: ['โกเล็มหิน', '🗿'], slime: ['สไลม์ยักษ์', '🟢'], frostQueen: ['ราชินีน้ำแข็งแห่งศาลหิมะ', '❄'], bandit: ['หัวหน้าโจร', '🗡'], kobold: ['หัวหน้าโคโบลด์', '⛏'], hunger: ['ก้อนหิว', '🩸'], byrexael: ['มังกรดำจ้าววิญญาณ', '🐉'], pumpkinBoss: ['บอสฟักทอง', '🎃'] };
  const bossKind = who => /^b:/.test(who || '') ? String(who).slice(2) : null;
  const bossSrc = (who, emo) => `assets/portraits/boss-${bossKind(who)}-${({ angry: 'angry', worry: 'worry', sad: 'worry', surprised: 'worry', happy: 'happy' })[emo] || 'neutral'}.webp`;
  const PAINTED_BOSSES = new Set(["treant", "crystalKing", "bogHydra", "coralGolem", "frostQueen", "pumpkinBoss", "voidKing", "hunger", "byrexael", "wolf", "golem", "slime", "bandit", "kobold"]);
  const bossOk = new Map();   /* src → true/false, filled by the probe in play() */
  const heroName = () => { try { return (root.WorldState?.heroName?.() || root.s?.village?.heroName) || 'นักผจญภัย' } catch (e) { return 'นักผจญภัย' } };
  const female = () => { try { return /female/.test(root.HeroVariant?.get?.() || '') } catch (e) { return false } };
  /* v98.953 · {sib} the other hero · {callhero} / {callsib} how the sibling calls the lead / how the lead calls the sibling (same as js/story-fx.js) */
  /* v98.995 · the other hero is the elder BROTHER when you lead the sister, the younger SISTER when you lead the brother — so the fallback is never a bare 'น้อง' (it was shown over the brother) */
  const sibRel = () => female() ? 'พี่ชาย' : 'น้องสาว';
  const sibName = () => { try { return (root.WorldState?.game?.()?.village?.siblingName || root.s?.village?.siblingName) || sibRel() } catch (e) { return sibRel() } };
  const fill = t => String(t ?? '').replace(/\{hero\}/g, heroName()).replace(/\{sib\}/g, sibName()).replace(/\{callhero\}/g, female() ? heroName() : 'พี่' + heroName()).replace(/\{callsib\}/g, female() ? 'พี่' + sibName() : sibName());

  function name(who) {
    if (!who) return '';
    if (who === 'hero') return heroName();
    if (who === 'sib') return sibName();   /* v98.995 · STORY_DATA.SPEAKERS.sib reads the bare `s`, which does not exist inside the battle iframe → it always showed 'น้อง' */
    if (bossKind(who)) return BOSS_ID[bossKind(who)]?.[0] || 'บอส';
    const S = root.STORY_DATA?.SPEAKERS?.[who], n = S && (typeof S.name === 'function' ? S.name() : S.name);
    return String(NAMES[who] || n || who).split(' · ')[0];
  }
  /* the painted bust, or null (then the plate shows an icon) */
  function portrait(who, emo = 'neutral') {
    if (!who) return null; who = ALIAS[who] || who; const m = MOODS[emo] || 'neutral';
    if (who === 'hero') { const g = female() ? 'female' : 'male', e = ({ neutral: 'neutral', happy: 'happy', angry: 'angry', worry: 'worry', sad: 'sad', calm: 'calm' })[emo] || 'neutral'; return `assets/portraits/hero-${g}-${e}.webp` }
    if (bossKind(who)) { const src = bossSrc(who, emo); return PAINTED_BOSSES.has(bossKind(who)) || bossOk.get(src) === true ? src : null }
    if (who === 'boss') return 'assets/cards/portraits/en-bandit.webp';
    if (who === 'mip') return 'mip'; if (who === 'sib') return female() ? 'assets/portraits/hero-male-' + m + '.webp' : 'assets/portraits/hero-female-' + m + '.webp';
    if (STORY.has(who)) return `assets/portraits/story/${who}-${m}.webp`;
    if (PLAIN.has(who)) return `assets/portraits/${who}-${m === 'worry' && /^(hilda|lin|guard)$/.test(who) ? 'surprised' : (who === 'mom' && m === 'neutral' ? 'calm' : m)}.webp`;   /* v98.655 · mom has no 'neutral' picture: her neutral = calm */   /* hilda · lin · guard have 'surprised' in place of 'worry' */
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
#btTalk .bt-pic .bt-sprite{width:70%;aspect-ratio:1/1;background:url(assets/ui/mip-sheet.webp?v=2) 27.2727% 50%/1200% 100% no-repeat}
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
    /* v98.621 · every portrait of this conversation is decoded first (it used to be requested when the person first spoke → an empty stand for a moment) */
    const probe = Promise.all([...new Set((lines || []).filter(l => bossKind(l.who) && !PAINTED_BOSSES.has(bossKind(l.who))).map(l => bossSrc(l.who, l.emo)))].filter(src => !bossOk.has(src)).map(src => new Promise(r => { const im = new Image(); im.onload = () => { bossOk.set(src, true); r() }; im.onerror = () => { bossOk.set(src, false); r() }; im.src = src })));   /* v98.1021 · is the boss picture there yet? (they are being generated) */
    const pre = Promise.race([probe.then(() => Promise.all([...new Set((lines || []).map(l => l.who && portrait(l.who, l.emo)).filter(x => x && x !== 'mip'))].map(src => { const im = new Image(); im.src = src; return im.decode ? im.decode().catch(() => { }) : Promise.resolve() }))), new Promise(r => setTimeout(r, 1200))]);
    running = pre.then(() => new Promise(resolve => {
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
        else if (src) { const im = new Image(); im.alt = ''; im.draggable = false; im.onerror = () => { if (!im.dataset.fb) { im.dataset.fb = 1; im.src = src.replace(/-[a-z]+\.webp$/, /portraits\/mom-/.test(src) ? '-calm.webp' : '-neutral.webp') } else if (!im.dataset.fb2) { im.dataset.fb2 = 1; im.src = src.replace(/-[a-z]+\.webp$/, '-surprised.webp') } else im.remove() }; im.src = src; if (window.PortraitFacing ? PortraitFacing.flip(src, side) : ((w === 'mom' ? 'right' : 'left') === (side === 'L' ? 'left' : 'right'))) im.style.transform = 'scaleX(-1)'; /* v98.593 · portraits face the other speaker (painted facing left by default) */ const pk = window.PortraitScale ? PortraitScale.k(w) : 1; if (pk < 1) im.style.maxHeight = Math.round(100 * pk) + '%'; p.replaceChildren(im) }
        else p.innerHTML = '<span class="bt-icon">' + (bossKind(w) ? (BOSS_ID[bossKind(w)]?.[1] || '👁') : (ICONS[w] || '💬')) + '</span>';
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
    }));
    return running;
  }
  /* conversations for the story fights that are not set-pieces, keyed by the ?tut= id (set-pieces carry their own in js/set-pieces.js: sc.talk)
     keys: start · half (enemy side at half) · win · lose · each is a lines array */
  /* v98.659 · every line is a TALK between people on the field (one thing said, one answer), in each speaker's own voice — rules are taught by the Coach panel, not by the characters reading them out */
  const scripts = {
    pumpkin: {
      start: [{ who: 'hilda', emo: 'worry', text: 'ระวังนะ! พวกศัตรูพืชซุกอยู่ใต้ใบ' }, { who: 'sib', emo:'neutral', text: 'ตัวไหนฟักทองสุก ตัวไหนด้วงล่ะ' }, { who: 'hilda', emo: 'neutral', text: 'ลูกที่สุกแล้ว พอล้มมันจะกลายเป็นฟักทองให้เก็บเลย' }, { who: 'hilda', emo: 'happy', text: 'ข้าให้ยืมไพ่ธาตุสองใบ ติดมือทุกเทิร์น' }, { who: 'hero', emo: 'neutral', text: 'สองใบไหนบ้าง' }, { who: 'hilda', emo: 'neutral', text: '💧 คลื่นน้ำ น้ำชนะดิน เอาไว้ตีฟักทอง ส่วน ⚡ อัสนีบาต ชนะลม เอาไว้ตีด้วงกินใบ' }, { who: 'sib', emo: 'neutral', text: 'ถ้าจะตีด้วง ต้องทำยังไง' }, { who: 'hilda', emo: 'neutral', text: 'คลิกตัวมันก่อน แล้วค่อยเลือกไพ่' }, { who: 'sib', emo: 'happy', text: 'พี่ฮิลดาเคยสู้ด้วงด้วยไพ่เองด้วยเหรอ' }, { who: 'hilda', emo: 'happy', text: 'ข้าใช้จอบ ไพ่ข้าแค่ยืมเขามาให้พวกเจ้า — อย่าบอกใครนะว่าข้าตีด้วงพลาดไปสามรอบ' }, { who: 'hero', emo: 'neutral', text: 'ลูกศรที่มุมไพ่คืออะไร' }, { who: 'hilda', emo: 'happy', text: 'เขียว ▲ คือได้เปรียบ แดง ▼ คือเสียเปรียบ ดูมันเปลี่ยนตามตัวที่เจ้าเลือก' }, { who: 'hero', emo:'happy', text: 'รับทราบ พี่ฮิลดา! ข้าจัดการเอง' }],
      half: [{ who: 'hilda', emo: 'happy', text: 'ดีมาก! อีกนิดเดียว อย่าให้มันเหยียบแปลงข้านะ!' }, { who: 'hero', emo:'happy', text: 'ไม่มีทาง! เหลืออีกไม่กี่ตัวแล้ว' }],
      win: [{ who: 'hilda', emo: 'happy', text: 'เก่งจริง ๆ! เก็บลูกที่สุกไปได้เลย' }, { who: 'sib', emo:'neutral', text: 'แล้วลูกประกวดล่ะ' }, { who: 'hilda', emo: 'neutral', text: 'ข้าจะดูแลเองอีกที' }, { who: 'hilda', emo: 'happy', text: 'เจ้าใหญ่ไม่ชอบให้ใครแตะ ยกเว้นข้า … กับพวกเจ้าก็พอได้' }],
      lose: [{ who: 'hilda', emo: 'worry', text: 'พอก่อน ๆ! เดี๋ยวค่อยมาใหม่ก็ได้ ฟักทองไม่หนีไปไหนหรอก' }, { who: 'hero', emo: 'worry', text: 'ขอโทษ พี่ฮิลดา เดี๋ยวข้ากลับมาใหม่' }]
    },
    cave: {
      start: [{ who: 'hero', emo: 'worry', text: 'ข้างหน้าเงียบเกินไป… มีอะไรซุ่มอยู่แน่ ๆ' }, { who: 'sib', emo: 'worry', text: 'ข้าได้ยินเสียงปีก… ค้างคาวแน่เลย' }, { who: 'hero', emo: 'neutral', text: 'ลุงทอมบอกว่า "แค่ปากอุโมงค์ชั้นแรก" … ข้าว่าลุงไม่ได้มาเองหลายปีแล้ว' }, { who: 'hero', emo: 'neutral', text: 'จำที่ยามดอร์กบอกไว้นะ ยืนที่สูงกว่าตีได้แรงกว่า' }, { who: 'sib', emo: 'neutral', text: 'แล้วก็ระวังอย่าตกผา ข้าจำได้' }],
      half: [{ who: 'sib', emo: 'worry', text: 'พวกมันยังไม่หมดนะ' }, { who: 'hero', emo: 'angry', text: 'อีกนิดเดียว! ไม่ให้ใครมาขวางผลึกของลุงทอม' }],
      win: [{ who: 'hero', emo: 'happy', text: 'รอดแล้ว! เดินต่อไปทางเหมืองเก่าได้' }, { who: 'sib', emo: 'happy', text: 'ผลึกต้องอยู่แถวนี้ ไปหากัน' }, { who: 'hero', emo: 'worry', text: 'ค้างคาวตัวเมื่อกี้ทำขี้ใส่ไหล่ข้า … อย่าเล่าให้ใครฟังนะ' }, { who: 'sib', emo: 'happy', text: 'ทั้งตลาดจะรู้ภายในเย็นนี้' }],
      lose: [{ who: 'sib', emo: 'worry', text: '{callhero}… ถอยก่อนเถอะ' }, { who: 'hero', emo: 'worry', text: 'ยังไม่ยอมแพ้หรอก แต่ต้องกลับไปตั้งหลักก่อน' }]
    },
    raid: {
      start: [{ who: 'guard', emo: 'angry', text: 'โจรป่า! ทุกคนหลบเข้ามาหลังข้า' }, { who: 'boss', emo: 'angry', text: 'ฮ่า! ของมีค่าในหมู่บ้านนี้ ข้าจะเอาไปให้หมด!' }, { who: 'guard', emo: 'angry', text: 'ยี่สิบปีข้าไม่เคยปล่อยใครผ่านประตูนี้โดยไม่ขออนุญาต คืนนี้ก็เหมือนกัน!' }, { who: 'hero', emo: 'angry', text: 'ไม่ให้แตะต้องงานเทศกาลเด็ดขาด!' }, { who: 'guard', emo:'worry', text: '{hero} อยู่ใกล้ ๆ ไว้ อย่าห่างกัน!' }, { who: 'sib', emo: 'worry', text: 'ฝูงหมาป่าตามมาด้วย ระวังโดนล้อมนะ' }],
      half: [{ who: 'guard', emo: 'happy', text: 'ดีมาก! พวกมันเริ่มแตกแถวแล้ว กดต่อไป!' }, { who: 'boss', emo: 'angry', text: 'อย่าถอย! แค่ยามกับเด็กเองนะ!' }, { who: 'hero', emo: 'angry', text: 'เด็กหรือไม่เด็ก ก็ไม่ยอมให้ผ่านไปหรอก!' }],
      win: [{ who: 'guard', emo: 'happy', text: 'พวกมันหนีแล้ว! ปากดีแต่ขาไวใช้ได้' }, { who: 'hero', emo: 'happy', text: 'เทศกาลปลอดภัยแล้ว' }, { who: 'guard', emo:'happy', text: 'ขอบใจนะ สองคน — ข้าเองก็ซ่อนไม่อยู่ว่าเหนื่อยเหมือนกัน' }, { who: 'guard', emo: 'happy', text: 'คืนนี้ข้าจะจดลงสมุดว่า "โจรมาหนึ่งครั้ง กลับไปหนึ่งครั้ง" … บรรทัดที่ข้าชอบที่สุดในรอบปี' }],
      lose: [{ who: 'guard', emo: 'worry', text: 'ถอยมาข้างหลังข้า! เดี๋ยวข้ารับไว้เอง' }, { who: 'hero', emo: 'worry', text: 'ข้ายังสู้ไหว…' }, { who: 'guard', emo: 'angry', text: 'ไหวหรือไม่ไหวก็ถอย! ข้าสั่ง' }]
    },
    expedition: {
      start: [{ who: 'hero', emo: 'neutral', text: 'ค่ายโจรอยู่ข้างหน้า… ต้องล้มพวกมันให้หมด เพื่อให้เฟิร์นเวลปลอดภัย' }, { who: 'kier', emo: 'neutral', text: 'พวกมันน่าจะมีมากกว่าที่เห็น ระวังรอบตัวไว้' }, { who: 'kier', emo: 'happy', text: 'นี่แหละการเดินทางจริงครั้งแรกของเรา … ดาบไม้ตอนเด็กไม่เคยมีกลิ่นควันค่ายโจรแบบนี้' }, { who: 'sib', emo: 'neutral', text: 'ข้าอยู่ข้างหลังเจ้า ไปกัน' }],
      half: [{ who: 'kier', emo: 'neutral', text: 'ยังไม่จบ ตั้งหลักให้ดีก่อนบุกต่อ' }, { who: 'hero', emo:'neutral', text: 'ข้ายังไหว! อีกนิดเดียว' }],
      win: [{ who: 'hero', emo: 'happy', text: 'พวกมันเงียบแล้ว — ไปดูข้างในค่ายกัน' }, { who: 'sib', emo: 'neutral', text: 'ระวังนะ อาจมีของตกอยู่ตามพื้น' }, { who: 'kier', emo: 'neutral', text: 'ข้าเฝ้าทางออกให้ รีบดูแล้วกลับกัน' }, { who: 'kier', emo: 'happy', text: 'กลับไปเล่าให้ใครฟังต้องบอกว่าข้าล้มได้มากกว่านะ {hero}' }],
      lose: [{ who: 'kier', emo: 'worry', text: 'ถอย! เราเสียเปรียบแล้ว' }, { who: 'hero', emo: 'worry', text: '…ได้ ถอยไปตั้งหลักก่อน' }]
    }
  };
  /* v98.1021 · BOSS ENCOUNTERS of the world-map dungeons (js/world-gen.js DESTS) and bandit chiefs — used when the fight has no scene / ?tut= script of its own (js/town-battle.js scriptOf).
     PROPOSAL, NOT CANON (docs/PROPOSAL-BOSS-ENCOUNTERS-TH.md): written only from what the player can see and from the rumours in js/world-gen.js; the boss makes sounds / acts in [brackets], never speaks words and has no
     origin story here. The two heroes react in their own voices ({callhero} = how the sibling calls the lead). Keys: start · half · win · lose. */
  const B = (kind, text, emo) => ({ who: 'b:' + kind, emo: emo || 'angry', text });
  const bosses = {
    wolf: {
      start: [{ who: null, text: 'ถ้ำลึกกลางป่า — ได้กลิ่นสัตว์ฉุนจัดและได้ยินเสียงหอนก้องมาจากด้านใน ตามที่พรานเล่าไว้ไม่มีผิด' }, { who: 'sib', emo: 'worry', text: '{callhero}… รอยเท้าเต็มพื้นไปหมด ตัวที่ใหญ่สุดอยู่ข้างใน' }, B('wolf', '[ ขู่คำรามต่ำ ๆ — ฝูงขยับเข้าล้อมช้า ๆ ]'), { who: 'hero', emo: 'neutral', text: 'อย่าแยกกัน แล้วระวังข้างหลัง' }],
      half: [B('wolf', '[ หอนยาวจนผนังถ้ำสะเทือน ]'), { who: 'sib', emo: 'worry', text: 'มันเรียกพวกมาเพิ่มหรือเปล่า!' }],
      win: [{ who: null, text: 'เสียงหอนขาดหาย ถ้ำเงียบลงในที่สุด' }, { who: 'sib', emo: 'happy', text: 'ผ่านไปแล้ว… ไปบอกพรานได้ว่าเสียงนั้นไม่มีอีกแล้ว' }],
      lose: [{ who: 'sib', emo: 'worry', text: 'ถอยก่อน! ในถ้ำมันได้เปรียบเรา' }]
    },
    golem: {
      start: [{ who: null, text: 'ในเหมืองร้าง ก้อนหินก้อนหนึ่งขยับ — คนงานที่หนีออกมาพูดจริง หินที่นี่ลุกขึ้นเดินได้' }, { who: 'hero', emo: 'worry', text: 'ตัวใหญ่กว่าที่เล่า' }, B('golem', '[ เสียงหินครูดกันก้องเหมือง — ดวงตาเรืองแสงเปิดขึ้นช้า ๆ ]'), { who: 'sib', emo: 'neutral', text: 'มันช้า แต่ถ้าโดนทีคงไม่ไหว อย่ายืนให้มันถึงตัว' }],
      half: [B('golem', '[ รอยร้าวขยายกว้าง เศษหินร่วงกราว ]'), { who: 'sib', emo: 'neutral', text: 'ตรงรอยร้าวนั่น! ซ้ำตรงนั้น' }],
      win: [{ who: null, text: 'ก้อนหินทรุดลงเป็นกองนิ่งสนิท' }, { who: 'hero', emo: 'neutral', text: 'หยุดแล้ว… ไม่รู้ว่าอะไรทำให้มันตื่น' }],
      lose: [{ who: 'sib', emo: 'worry', text: 'ถอยออกจากเหมือง! เกิดอะไรขึ้นข้างบนเรายังไม่รู้' }]
    },
    slime: {
      start: [{ who: null, text: 'หมอกในบึงหนาจนมองไม่เห็นเท้า ระฆังวิหารเก่าดังขึ้นเองหนึ่งครั้ง แล้วพื้นตรงหน้าก็ยุบลง' }, { who: 'sib', emo: 'worry', text: 'อะไรอยู่ใต้น้ำนั่น… ใหญ่มาก' }, B('slime', '[ ก้อนเหนียวใสผุดขึ้นมาจากบึง — สั่นระลอก ]'), { who: 'hero', emo: 'neutral', text: 'ระวังพื้น อย่ายืนใกล้น้ำ' }],
      half: [B('slime', '[ แตกตัวเป็นก้อนเล็กกระเด็นไปรอบ ๆ ]'), { who: 'sib', emo: 'worry', text: 'มันยังรวมตัวกลับได้ — จัดการก้อนใหญ่ก่อน' }],
      win: [{ who: null, text: 'ก้อนเหนียวละลายหายลงบึง ระฆังเงียบลงเหมือนไม่เคยดัง' }, { who: 'sib', emo: 'neutral', text: 'ระฆังไม่ดังแล้วนะ… แต่แล้วมันดังเองได้ยังไงกันนะ' }],
      lose: [{ who: 'hero', emo: 'worry', text: 'ถอยขึ้นฝั่ง! ตรงนี้เราสู้ยาก' }]
    },
    frostQueen: {
      start: [{ who: null, text: 'บนยอดหิมะ ปากถ้ำที่มีลมเย็นเยียบพัดออกมา ข้างในมีเสาหินสลักลาย และบางอย่างยืนอยู่ท่ามกลางเสาเหล่านั้น' }, { who: 'sib', emo: 'worry', text: '{callhero}… ลมหายใจเราเป็นไอขาวหมดแล้ว ตัวมันยังไม่ขยับด้วยซ้ำ' }, B('frostQueen', '[ น้ำแข็งแตกเป็นเสียงกริ๊ง — มันหันมามองทางพวกเรา ]', 'neutral'), { who: 'hero', emo: 'neutral', text: 'อย่าอยู่ห่าง มันตีไกลได้ — ยิ่งอยู่ห่างยิ่งอันตราย' }],
      half: [B('frostQueen', '[ เสาน้ำแข็งงอกขึ้นรอบตัว ลมหนาวรุนแรงขึ้น ]'), { who: 'sib', emo: 'worry', text: 'หนาวจนมือชา… ต้องรีบจบ!' }],
      win: [{ who: null, text: 'น้ำแข็งแตกออกเป็นเสี่ยง ลมในถ้ำค่อย ๆ อุ่นขึ้น' }, { who: 'hero', emo: 'neutral', text: 'ไม่รู้ว่าศาลนี้เป็นของใคร … แต่เราผ่านมาได้แล้ว' }],
      lose: [{ who: 'sib', emo: 'worry', text: 'ถอยออกจากถ้ำ! ก่อนเราจะแข็งไปกว่านี้' }]
    },
    bandit: {
      start: [{ who: null, text: 'หัวหน้าโจรยืนกางแขนขวางทาง ลูกน้องกระจายตามที่สูงรอบ ๆ' }, { who: 'hero', emo: 'neutral', text: 'วางของแล้วหลบไป เราไม่อยากสู้' }, B('bandit', '[ หัวเราะแค่นในลำคอ — ชักอาวุธออกมา ]'), { who: 'sib', emo: 'worry', text: 'มันไม่ฟังหรอก {callhero}' }],
      half: [B('bandit', '[ เสียงตะโกนสั่งลูกน้องให้ล้อมเข้ามา ]'), { who: 'sib', emo: 'neutral', text: 'ยืนให้หลังชิดกำแพงไว้ จะได้ไม่โดนล้อม' }],
      win: [{ who: null, text: 'หัวหน้าโจรทรุดลง ลูกน้องที่เหลือถอยหนีเข้าป่า' }, { who: 'hero', emo: 'neutral', text: 'เก็บของคืนเจ้าของแล้วไปกันต่อ' }],
      lose: [{ who: 'sib', emo: 'worry', text: 'ถอยก่อน! พวกมันเยอะเกิน' }]
    },
    kobold: {
      start: [{ who: null, text: 'เสียงเคาะหินดังถี่ ๆ ในอุโมงค์ — หัวหน้าโคโบลด์ยืนอยู่หน้ากองแร่ ลูกน้องถือพลั่วถือจอบล้อมไว้' }, { who: 'sib', emo: 'neutral', text: 'พวกมันหวงแร่กองนี้แน่ ๆ' }, B('kobold', '[ เห่าสั้น ๆ — ลูกน้องชูพลั่วขึ้นพร้อมกัน ]'), { who: 'hero', emo: 'neutral', text: 'ล้มหัวหน้าก่อน ที่เหลือจะแตก' }],
      half: [B('kobold', '[ ตะโกนเสียงแหลม — อีกกลุ่มวิ่งออกมาจากอุโมงค์ ]'), { who: 'sib', emo: 'worry', text: 'มีอีกกลุ่ม! ระวังด้านข้าง' }],
      win: [{ who: null, text: 'หัวหน้าโคโบลด์ล้มลง พลั่วจอบกระจัดกระจายเต็มพื้น' }, { who: 'sib', emo: 'happy', text: 'เสียงเคาะหยุดแล้ว เหมืองเงียบสักที' }],
      lose: [{ who: 'hero', emo: 'worry', text: 'ถอย! อุโมงค์แคบเกินไปสำหรับเรา' }]
    }
  };
  root.BattleTalk = { play, name, portrait, scripts, bosses, busy: () => !!running };
})(typeof window !== 'undefined' ? window : globalThis);
