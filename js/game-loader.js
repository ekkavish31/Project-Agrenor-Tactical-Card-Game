/* v98.1110 · StdLoader — builds THE standard loading screen (css/game-loader.css) for every "preparing…" cover.
   StdLoader.make({title, step, absolute, id, progress}) → element (not yet in the page; append it yourself)
   StdLoader.progress(el, 0–1 | null) → set the bar (null = the sliding "working" bar) · StdLoader.step(el, text) → the small line under the bar
   StdLoader.hide(el) → fade out and remove · StdLoader.TIPS → the tip lines (also used by the main loading screen) */
(function (root) {
  'use strict';
  if (root.StdLoader) return;
  const TIPS = ['โจมตีจากด้านหลังศัตรูแรงกว่าด้านหน้า', 'ยืนบนที่สูงช่วยให้ตีแรงขึ้นและหลบได้ดีขึ้น', 'กด "รอ" แทนการเดินจะได้ CT คืนบางส่วน', 'อุปกรณ์ที่ดีต้องใช้วัตถุดิบจากพื้นที่ที่ยากขึ้น', 'นอนที่บ้านเพื่อฟื้นแรงและชีวิตเต็ม', 'ล็อกเป้าแล้วดูหน้าต่างทำนายผลก่อนโจมตี'];
  const LORE = [
 [0,'เฟิร์นเวลอยู่ในที่ราบลุ่มแม่น้ำ ผู้คนแถบนี้ผูกพันกับธาตุดินและน้ำมาหลายชั่วอายุคน'],
 [0,'ทางเหนือคือดินแดนหิมะหนาว ทางใต้คือแดนไฟและภูเขาไฟ ส่วนทางตะวันตกไกลคือหมู่เกาะกลางทะเล'],
 [0,'ชาวบ้านเรียกแสงสีทองบนฟ้าว่า "ดวงทอง" มันลอยค้างอยู่ที่หนึ่งนาน ๆ แล้วค่อยย้ายไปที่อื่น ไม่ใช่ลางร้าย'],
 [0,'ป่าใหญ่ทางตะวันออกดูไม่มีที่สิ้นสุด แผนที่วาดไว้แค่ชายขอบ นักผจญภัยน้อยคนนักจะกลับออกมา'],
 [0,'คนส่วนใหญ่เกิดมาพร้อมแก่นธาตุดิน น้ำ หรือลม ธาตุอื่นมีอยู่จริงแต่พบได้ยาก'],
 [0,'ลูกไม่จำเป็นต้องได้ธาตุเดียวกับพ่อแม่ ธาตุของแต่ละคนเป็นของเขาเอง'],
 [0,'เผ่าพันธุ์อื่นมีอยู่จริง แต่คนส่วนใหญ่ไม่เคยพบ จะเจอก็ตามเมืองท่า เมืองชายแดน และเส้นทางค้าขาย'],
 [0,'การ์ดเวทคือแผ่นผนึกที่จารวงจรเวทไว้ ผู้ถือส่งพลังของตนเข้าไป วงจรจะจัดรูปพลังให้กลายเป็นเวท'],
 [0,'การ์ดไม่ใช่บ่อพลังไร้ขีดจำกัด ใครอัดพลังเกินที่วงจรรับไหว วงจรจะไหม้จนใช้ไม่ได้อีก'],
 [0,'การ์ดชั่วคราวใช้ได้ครั้งเดียวแล้วสลายไป จึงแรงกว่าการ์ดทั่วไป แต่ก็มีขีดจำกัดเหมือนกัน'],
 [0,'ใช้การ์ดต่างธาตุได้ โดยไม่ทำให้แก่นธาตุของตัวเองเปลี่ยน แต่จะได้แค่ผลพื้นฐานของการ์ดนั้น'],
 [0,'ตามที่สอนกันในอาณาจักรมนุษย์ จอมเวทผู้ยิ่งใหญ่คนหนึ่งเป็นผู้คิดค้นการ์ดเวทขึ้นมา'],
 [0,'อาณาจักรใหญ่ ๆ รับซื้อฝีมือเวทจากผู้ใช้เวท แล้วถอดแบบไปทำเป็นการ์ดจำหน่ายเป็นรายได้'],
 [1,'ข่าวจากด่านหินทางเหนือบอกว่าสงครามยืดเยื้อ และฝั่งเราเป็นฝ่ายเสียเปรียบ'],
 [1,'มีข่าวลือว่าราชสำนักเร่งขุดแร่พลังงานชนิดหนึ่งเพื่อใช้ในสงคราม']
];
  /* the spoiler level of the player's story: a line is shown only once the story has reached it (the main game page owns the save; frames ask their parent) */
  function loreLevel() { for (const w of [root, root.parent]) { try { const g = w.s || w.WorldState?.game?.(), m = w.MainStory?.stage?.(g); if (Number.isFinite(m?.spoiler)) return m.spoiler } catch (e) { } } return 0 }
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MIP = '<div class="mip-track" aria-hidden="true"><div class="mip-go"><div class="mip-flip"><div class="mip-run"><i></i></div><div class="mip-idle"><i></i></div></div></div></div>';
  function css() {   /* pages that did not link the stylesheets get them here */
    for (const h of ['css/mip-loader.css?v=v98.1160', 'css/game-loader.css?v=v98.1117']) { const name = h.split('/')[1].split('?')[0]; if ([...document.styleSheets].some(s => (s.href || '').includes(name)) || document.querySelector('link[href*="' + name + '"]')) continue; const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = h; (document.head || document.documentElement).appendChild(l) }
  }
  function make(o = {}) {
    css(); const el = document.createElement('div'); el.className = 'gl-std' + (o.absolute ? ' gl-abs' : ''); if (o.id) el.id = o.id; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
    el.innerHTML = '<div class="gl-box"><span class="gl-kicker">LOADING</span><h2 class="gl-title">' + esc(o.title || 'กำลังโหลด') + '</h2>' + MIP + '<div class="gl-bar ind"><i></i></div><div class="gl-meta"><span class="gl-step">' + esc(o.step || '') + '</span><b class="gl-pct" hidden></b></div>'
      + '<p class="gl-tip"><img class="gl-note-icon" src="assets/icons/menu/v2-help.webp" width="40" height="40" alt=""><span class="gl-note-text">' + esc(TIPS[Math.floor(Math.random() * TIPS.length)]) + '</span></p><p class="gl-lore"><img class="gl-note-icon" src="assets/icons/menu/v2-journal.webp" width="40" height="40" alt=""><span class="gl-note-text"></span></p><button type="button" class="gl-retry" hidden>ลองโหลดใหม่</button></div>';
    const lo = el.querySelector('.gl-lore'), tx = pick(LORE.filter(x => x[0] <= loreLevel()).map(x => x[1])); lo.querySelector('.gl-note-text').textContent = tx || ''; lo.hidden = !tx;
    if (o.progress != null) progress(el, o.progress); rotate(el); return el;
  }
  function progress(el, f) { const b = el?.querySelector('.gl-bar'); if (!b) return; if (f == null) { root.MipLoader?.still(el,false); b.classList.add('ind'); b.querySelector('i').style.width = ''; return } b.classList.remove('ind'); const pc = Math.round(Math.max(0, Math.min(1, f)) * 100); b.querySelector('i').style.width = pc + '%'; const pe = el.querySelector('.gl-pct'); if (pe) { pe.hidden = false; pe.textContent = pc + '%' } if(f>=1)return finish(el);if(pc===0)root.MipLoader?.still(el,false) }
  function step(el, text) { const s = el?.querySelector('.gl-step'); if (s) s.textContent = text || '' }
  /* TIPS and LORE change while the screen waits: every line is shown once (shuffled) before any repeats, each held long enough to read (~85 ms per character, at least 6 s);
     the text fades out / in. rotate(el, {level}) → stop(); it also stops by itself when the element leaves the page. */
  const deck = list => { let d = []; return () => { if (!d.length) { d = list().slice(); for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]] } } return d.pop() } };
  function pick(list) { return list.length ? list[Math.floor(Math.random() * list.length)] : '' }
  function rotate(el, o = {}) {
    if (!el || el._glRot) return el?._glRot; const level = o.level || loreLevel;
    const nextTip = deck(() => TIPS), nextLore = deck(() => LORE.filter(x => x[0] <= level()).map(x => x[1]));
    let timer = 0, stopped = false;
    const set = (sel, text) => { const n = el.querySelector(sel + ' .gl-note-text'); if (!n || !text) return; n.style.transition = 'opacity .35s'; n.style.opacity = 0; setTimeout(() => { n.textContent = text; n.style.opacity = 1 }, 360) };
    const tick = () => { if (stopped || !el.isConnected) { stopped = true; return }
      if (!el.hidden && !el.classList.contains('gl-gate')) { const cur = sel => el.querySelector(sel + ' .gl-note-text')?.textContent; let t = nextTip(); if (t === cur('.gl-tip')) t = nextTip() || t; let l = nextLore(); if (l === cur('.gl-lore')) l = nextLore() || l; const lo = el.querySelector('.gl-lore'); set('.gl-tip', t); if (l) { set('.gl-lore', l); if (lo) lo.hidden = false } timer = setTimeout(tick, Math.max(6000, 85 * Math.max((t || '').length, (l || '').length))) }
      else timer = setTimeout(tick, 1000) };
    timer = setTimeout(tick, 6500);
    const stop = () => { stopped = true; clearTimeout(timer) }; el._glRot = stop; return stop;
  }
  function finish(el) { return root.MipLoader?.still(el,true)||Promise.resolve(false) }
  async function hide(el, ms = 380) { if (!el) return; await finish(el); if(!el.isConnected)return; await new Promise(r=>setTimeout(r,350));el.classList.add('gl-out'); setTimeout(() => el.remove(), ms) }
  root.StdLoader = { make, progress, step, finish, hide, rotate, TIPS, LORE, loreLevel };
})(globalThis);
