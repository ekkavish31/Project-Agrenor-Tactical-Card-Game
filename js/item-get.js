/* v98.1024 · ITEM GET — the "you received …" scene for things that go into the card book (สมุดผนึก).
   ItemGet.show([{ key:'mayBread', n:4 }, …], { kicker?, title?, text?, from? }) → Promise (resolves when the player closes it)
     key = the bag / materials key of the item (js/adventure-data.js CONSUMABLES · GOODS · EVENT_CARDS, or a material such as iron) — the card is found by CardStudio ('c-' · 'g-' · 'ev-' · 'mt-' + key)
   The card rises out of golden light and turns face-up, sparks fall around it, then its name · count · kind · the short story of the thing (js/card-lore.js) · the one-line rule are shown;
   several items are shown one after another (◀ ▶ dots) — Enter / Space / click = next / close, Esc = close. On close the card flies to the book button (🎒 สมุดผนึก) when it is on screen.
   This only SHOWS the reward — the caller has already put the items in the bag (so a failure here can never lose an item). Does nothing when run twice at once (queued). */
(function (root) {
  'use strict';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const PREFIX = ['c-', 'g-', 'ev-', 'mt-', 'e-'];
  let queue = Promise.resolve();

  function cardIdOf(key) { const C = root.CardStudio; if (!C?.cardById) return null; for (const p of PREFIX) if (C.cardById(p + key)) return p + key; return null }
  function info(key) {
    const AD = root.ADVENTURE_DATA || {}, id = cardIdOf(key), d = AD.CONSUMABLES?.[key] || AD.GOODS?.[key] || AD.EVENT_CARDS?.[key] || {};
    const card = id && root.CardStudio.cardById(id), lore = id && root.CardLore?.get?.(id);
    const name = card?.name || d.name || key, kind = (id && root.CardLore?.kindLine?.(id, card)) || d.kind || '';
    const rule = lore?.use || (d.text || '').split(' · ')[0] || '';
    const desc = lore?.desc || d.text || '';
    return { key, id, name, kind, desc, rule, note: lore?.note || '', html: id ? root.CardStudio.renderCard(id, { mini: false }) : '', icon: d.icon || '🎁' };
  }

  function css() {
    if (document.getElementById('igCss')) return; const s = document.createElement('style'); s.id = 'igCss';
    s.textContent = `
#itemGet{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 46%,#2a2012f2 0,#0b0a10f5 70%);opacity:0;transition:opacity .35s;font-family:AgThai,VillageThai,system-ui,sans-serif;color:#f6ead0;user-select:none;-webkit-user-select:none;cursor:pointer}
#itemGet.on{opacity:1}#itemGet.off{opacity:0;transition:opacity .45s}
#itemGet .ig-rays{position:absolute;left:50%;top:44%;width:150vmax;height:150vmax;margin:-75vmax 0 0 -75vmax;background:repeating-conic-gradient(from 0deg,#ffd98a22 0 6deg,#0000 6deg 18deg);-webkit-mask:radial-gradient(circle,#000 0,#0000 46%);mask:radial-gradient(circle,#000 0,#0000 46%);animation:igSpin 38s linear infinite;pointer-events:none}
@keyframes igSpin{to{transform:rotate(360deg)}}
#itemGet .ig-box{position:relative;display:flex;gap:min(4vw,44px);align-items:center;max-width:min(980px,94vw);max-height:92vh;padding:10px}
#itemGet .ig-card{position:relative;flex:none;width:min(300px,38vw);perspective:900px;filter:drop-shadow(0 0 28px #ffcf6a88)}
#itemGet .ig-card .ig-in{transform:translateY(120px) rotateY(180deg) scale(.7);opacity:0;transition:transform .9s cubic-bezier(.2,1.1,.3,1),opacity .5s}
#itemGet.go .ig-card .ig-in{transform:none;opacity:1}
#itemGet .ig-card .ig-plain{aspect-ratio:750/1101;display:grid;place-items:center;font-size:84px;border-radius:14px;background:linear-gradient(#3a2e18,#1b160c);border:3px solid #d9b46b}
#itemGet .ig-shine{position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,#0000 38%,#fffa 50%,#0000 62%) 160% 0/260% 100% no-repeat;border-radius:14px;mix-blend-mode:screen}
#itemGet.go .ig-shine{animation:igShine 1.1s .75s ease-out 1}
@keyframes igShine{to{background-position:-60% 0}}
#itemGet .ig-cnt{position:absolute;right:-14px;top:-14px;min-width:54px;padding:4px 12px;border-radius:999px;background:linear-gradient(#ffd77a,#d89a2b);color:#2a1a04;font:800 24px/1.1 AgThai,system-ui,sans-serif;text-align:center;border:2px solid #fff3c4;box-shadow:0 4px 12px #000a;opacity:0;transform:scale(.4);transition:.4s 1s cubic-bezier(.2,1.5,.4,1)}
#itemGet.go .ig-cnt{opacity:1;transform:scale(1)}
#itemGet .ig-info{flex:1;min-width:0;max-width:430px;opacity:0;transform:translateX(24px);transition:.55s .7s}
#itemGet.go .ig-info{opacity:1;transform:none}
#itemGet small.ig-k{display:block;color:#ffd98a;letter-spacing:.5px;font-size:14px}
#itemGet h2{margin:2px 0 4px;font:800 clamp(24px,4.2vw,36px)/1.15 AgThai,Georgia,serif;color:#fff4d4;text-shadow:0 2px 10px #000b}
#itemGet .ig-type{display:inline-block;margin-bottom:10px;padding:2px 12px;border-radius:999px;background:#ffffff14;border:1px solid #ffd98a66;color:#f3dca6;font-size:14px}
#itemGet .ig-desc{font-size:clamp(15px,1.9vw,18px);line-height:1.7;color:#f1e6c8}
#itemGet .ig-note{margin-top:8px;font-style:italic;color:#d8c48f;font-size:15px}
#itemGet .ig-rule{margin-top:12px;padding:8px 12px;border-left:3px solid #ffd98a;background:#00000040;border-radius:0 8px 8px 0;font-size:15px;color:#ffe9b0}
#itemGet .ig-from{margin-top:10px;font-size:14px;color:#c9b98a}
#itemGet .ig-bar{margin-top:16px;display:flex;align-items:center;gap:14px}
#itemGet .ig-btn{font:700 17px AgThai,system-ui,sans-serif;padding:9px 26px;border-radius:12px;border:2px solid #fff0b8;background:linear-gradient(#e7bd5a,#b98524);color:#2a1a04;cursor:pointer;box-shadow:0 4px 14px #000a}
#itemGet .ig-btn:hover{filter:brightness(1.1)}
#itemGet .ig-dots{display:flex;gap:7px}#itemGet .ig-dots i{width:9px;height:9px;border-radius:50%;background:#fff4;transition:.2s}#itemGet .ig-dots i.on{background:#ffd98a;transform:scale(1.35)}
#itemGet .ig-spark{position:absolute;left:50%;top:44%;width:7px;height:7px;border-radius:50%;background:#ffe9a8;box-shadow:0 0 10px 3px #ffcf6a;pointer-events:none;opacity:0;animation:igSpark var(--d,1.8s) var(--t,0s) ease-out infinite}
@keyframes igSpark{0%{opacity:0;transform:translate(0,0) scale(.4)}12%{opacity:1}100%{opacity:0;transform:translate(var(--x),var(--y)) scale(1)}}
#itemGet.fly .ig-card{transition:transform .7s cubic-bezier(.5,0,.8,.4),opacity .7s;transform:translate(var(--fx,30vw),var(--fy,30vh)) scale(.12);opacity:0}
#itemGet.fly .ig-info{opacity:0;transition:.25s}
@media(max-width:760px){#itemGet .ig-box{flex-direction:column;overflow:auto;gap:14px}#itemGet .ig-card{width:min(210px,52vw)}#itemGet .ig-info{max-width:92vw;text-align:center}#itemGet .ig-bar{justify-content:center}}
@media(prefers-reduced-motion:reduce){#itemGet .ig-rays,#itemGet .ig-spark{animation:none}#itemGet .ig-card .ig-in{transition:none}}`;
    document.head.append(s);
  }

  function run(list, opt) {
    const items = (list || []).filter(x => x && x.key && (x.n || 1) > 0).map(x => ({ ...info(x.key), n: x.n || 1 }));
    if (!items.length || !document.body) return Promise.resolve();
    css();
    return new Promise(resolve => {
      const el = document.createElement('div'); el.id = 'itemGet'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'ได้รับไอเทม');
      const sparks = Array.from({ length: 22 }, (_, i) => { const a = Math.random() * 6.283, r = 90 + Math.random() * 190; return `<i class="ig-spark" style="--x:${Math.round(Math.cos(a) * r)}px;--y:${Math.round(Math.sin(a) * r - 40)}px;--t:${(Math.random() * 1.6).toFixed(2)}s;--d:${(1.4 + Math.random() * 1.2).toFixed(2)}s"></i>` }).join('');
      el.innerHTML = `<div class="ig-rays"></div>${sparks}<div class="ig-box"><div class="ig-card"><div class="ig-in"></div><div class="ig-shine"></div><b class="ig-cnt"></b></div><div class="ig-info"></div></div>`;
      document.body.append(el);
      const box = el.querySelector('.ig-box'), cardEl = el.querySelector('.ig-in'), cnt = el.querySelector('.ig-cnt'), inf = el.querySelector('.ig-info');
      let i = 0, closing = false;
      const paint = () => {
        const it = items[i], last = i === items.length - 1;
        el.classList.remove('go'); void el.offsetWidth;
        cardEl.innerHTML = it.html || `<div class="ig-plain">${esc(it.icon)}</div>`; try { root.CardStudio?.fit?.(cardEl) } catch (e) { }
        cnt.textContent = '×' + it.n; cnt.style.display = it.n > 1 ? '' : 'none';
        inf.innerHTML = `<small class="ig-k">${esc(opt.kicker || 'ได้รับไอเทม')}</small><h2>${esc(it.name)}</h2>${it.kind ? `<span class="ig-type">${esc(it.kind)}</span>` : ''}`
          + `<div class="ig-desc">${esc(it.desc)}</div>${it.note ? `<div class="ig-note">“${esc(it.note)}”</div>` : ''}${it.rule ? `<div class="ig-rule">${esc(it.rule)}</div>` : ''}`
          + `${opt.from || opt.text ? `<div class="ig-from">${esc(opt.text || opt.from)}</div>` : ''}`
          + `<div class="ig-bar"><button type="button" class="ig-btn">${last ? 'เก็บเข้าสมุดผนึก' : 'ต่อไป ▶'}</button>${items.length > 1 ? `<span class="ig-dots">${items.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</span>` : ''}</div>`;
        try { root.Sfx?.play?.(last ? 'ui-confirm' : 'ui-click') } catch (e) { }
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('go')));
        inf.querySelector('.ig-btn').onclick = ev => { ev.stopPropagation(); next() };
      };
      const finish = () => { document.removeEventListener('keydown', key, true); el.remove(); resolve() };
      const close = () => {
        if (closing) return; closing = true;
        const btn = document.querySelector('#bagBtn,[data-menu="bag"],#openBook,button[aria-label="สมุดผนึก"]'), r = btn?.getBoundingClientRect(), c = el.querySelector('.ig-card').getBoundingClientRect();
        if (r && r.width) { el.style.setProperty('--fx', Math.round(r.left + r.width / 2 - (c.left + c.width / 2)) + 'px'); el.style.setProperty('--fy', Math.round(r.top + r.height / 2 - (c.top + c.height / 2)) + 'px'); el.classList.add('fly'); setTimeout(() => { el.classList.add('off'); setTimeout(finish, 450) }, 650) }
        else { el.classList.remove('on'); el.classList.add('off'); setTimeout(finish, 460) }
      };
      const next = () => { if (closing) return; if (i < items.length - 1) { i++; paint() } else close() };
      const key = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close() } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); next() } };
      document.addEventListener('keydown', key, true);
      el.addEventListener('click', next);
      requestAnimationFrame(() => { el.classList.add('on'); paint() });
    });
  }

  /* queued: two rewards in a row never stack on screen */
  function show(list, opt = {}) { const p = queue.then(() => run(list, opt)).catch(() => { }); queue = p; return p }
  root.ItemGet = { show, info };
})(globalThis);
