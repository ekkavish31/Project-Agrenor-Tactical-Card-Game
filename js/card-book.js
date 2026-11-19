/* v98.665 · THE CARD BOOK (สมุดผนึก) — drawn on the painted open book (assets/ui/cardbook-open.webp, straightened with tools/deskew-book.py).
   Why: everything the hero carries is shown as a card; the spell that turns things into cards lives in the book the Adventurers' Guild gives at registration (docs/ITEM-CARDS-TH.md).
   It does not re-implement the bag: js/collection-v03.js + js/bag.js draw as before (so every button keeps working) and the cards are then laid into the book:
     • each paper page holds 3 × 2 = 6 cards → 12 cards per open spread; more cards go to the next spread
     • a page number in the bottom corner of each page; the spread counter (1/2) and the small ◀ ▶ arrows sit in the bottom-right corner
     • the tabs are red-and-gold bookmark ribbons hanging from the top edge of the book (icons from assets/icons/menu); the open one hangs further down
       ของใช้ = potion · อุปกรณ์ = battle (swords) · วัตถุดิบ = forge (hammer + anvil) · ทั่วไป = treasure (no coin-bag icon in the set yet) · เหตุการณ์ = mail
     • close = the gold X + "ปิดสมุด" ABOVE the book, top-right (the guided lesson points at it)
   The open tab and the open spread of every tab are remembered while the dialog is re-drawn (using a potion redraws it).  Data keys stay `bag` / `materials` / `inventory` — saves are untouched.
   Selectors used by the guided book lesson (js/story-quests.js BOOK_TOUR) stay valid: .cb-tabs button[data-t] · .cb-page[data-p] .card-thumb · .cb-page[data-p] .collection-grid */
(function () {
  'use strict';
  if (typeof renderBag !== 'function') return;
  const ICON = n => `assets/icons/menu/${n}.webp`;
  const TABS = [
    { id: 'use', icon: ICON('potion'), name: 'ของใช้', tip: 'ใช้แล้วหมดไป' },
    { id: 'gear', icon: ICON('battle'), name: 'อุปกรณ์', tip: 'สวมใส่ได้ 1 ใบ' },
    { id: 'mat', icon: ICON('forge'), name: 'วัตถุดิบ', tip: 'ใช้ผลิตที่โรงตีเหล็ก' },
    { id: 'goods', icon: ICON('treasure'), name: 'ทั่วไป', tip: 'ขายได้ที่ตลาด' },
    { id: 'event', icon: ICON('mail'), name: 'เหตุการณ์', tip: 'ใช้แล้วเกิดเรื่องราว' }
  ];
  const PER_PAGE = 6, PER_SPREAD = PER_PAGE * 2;
  let tab = 'use';
  const spreadOf = {};
  const kindOf = t => /^ของใช้ ·/.test(t) ? 'use' : /^การ์ดเหตุการณ์/.test(t) ? 'event' : /^ไอเทมทั่วไป/.test(t) ? 'goods' : /^วัตถุดิบและของใช้/.test(t) ? 'mat' : /^อุปกรณ์/.test(t) ? 'gear' : '';
  const prev = renderBag;
  renderBag = function () {
    prev();
    try { rebuild() } catch (e) { console.error('card-book', e) }
    try { window.Story?.bookFirst?.() } catch (e) { }   /* v98.589 · the first-time lesson (story scene bookFirst) */
  };
  const esc = s => String(s).replace(/[<>&"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
  function rebuild() {
    const host = document.getElementById('panelContent'); if (!host || host.querySelector('.card-book')) return;
    const items = {}, notes = {}; let msg = host.querySelector('#bagMsg');
    const kids = [...host.querySelectorAll(':scope > h3, :scope > .collection-grid, :scope > .bag-v11 > h3, :scope > .bag-v11 > .bag-item-grid')];
    let cur = '', found = false;
    for (const el of kids) {
      if (el.tagName === 'H3') { cur = kindOf(el.textContent.trim()); if (cur) notes[cur] = el.textContent.trim(); continue }
      if (!cur) continue; found = true;
      (items[cur] ||= []).push(...el.querySelectorAll(':scope > article, :scope > .bag-item-card'));
    }
    if (!found) return;
    /* v98.758 · the selling price (when a card has one) → a number + gold coin badge on the card's bottom-right corner; the text it is read from is hidden by the CSS */
    const priceOf = el => { const t = (el.querySelector('.gear-instance') || el.querySelector('button[data-sellg]') || el.querySelector('small.muted') || {}).textContent || ''; const m = t.match(/◉\s*([\d,]+)/); return m ? m[1] : null };
    for (const list of Object.values(items)) for (const el of list) { if (el.querySelector('.cb-price')) continue; const v = priceOf(el); if (v) el.insertAdjacentHTML('beforeend', `<span class="cb-price" title="ราคาขาย">${v}<i></i></span>`) }
    const count = id => (items[id] || []).length;
    const tabs = TABS.filter(t => t.id !== 'event' || count('event') > 0);
    if (!tabs.some(t => t.id === tab)) tab = tabs[0].id;
    const total = TABS.reduce((n, t) => n + count(t.id), 0);
    const book = document.createElement('div'); book.className = 'card-book cb-v2';
    book.innerHTML = `<nav class="cb-tabs" role="tablist">${tabs.map(t => `<button type="button" role="tab" data-t="${t.id}" title="${esc(t.name + ' · ' + t.tip)}"><img src="${t.icon}" alt="" draggable="false"><em>${count(t.id)}</em><b>${t.name}</b></button>`).join('')}</nav>
      <div class="cb-open">
        <button type="button" class="cb-close" aria-label="ปิดสมุด" title="ปิดสมุด" onclick="if(!(window.closeTopFirst&&window.closeTopFirst()))document.getElementById('panel').close()">ปิดสมุด</button>
        ${tabs.map(t => `<section class="cb-page" data-p="${t.id}" role="tabpanel" aria-label="${esc(notes[t.id] || t.name)}"><div class="cb-pg L collection-grid"></div><div class="cb-pg R collection-grid"></div><span class="cb-no L"></span><span class="cb-no R"></span></section>`).join('')}
        <div class="cb-nav"><button type="button" class="cb-prev" aria-label="หน้าก่อน">◀</button><span class="cb-count">1/1</span><button type="button" class="cb-next" aria-label="หน้าถัดไป">▶</button></div>
      </div>
      <p class="cb-foot">การ์ดที่ผนึกไว้ในสมุด ${total} ใบ · แตะการ์ดเพื่อดูขนาดเต็ม</p>`;
    const spreads = id => Math.max(1, Math.ceil(count(id) / PER_SPREAD));
    const lay = id => {   /* put the cards of the open spread on the two pages */
      const sec = book.querySelector(`.cb-page[data-p="${id}"]`), n = spreads(id); let k = Math.min(spreadOf[id] || 0, n - 1); spreadOf[id] = k;
      const list = items[id] || [], L = sec.querySelector('.cb-pg.L'), R = sec.querySelector('.cb-pg.R');
      L.replaceChildren(...list.slice(k * PER_SPREAD, k * PER_SPREAD + PER_PAGE)); R.replaceChildren(...list.slice(k * PER_SPREAD + PER_PAGE, (k + 1) * PER_SPREAD));
      if (!list.length) L.innerHTML = '<p class="cb-empty">ยังไม่มีการ์ดในหมวดนี้</p>';
      sec.querySelector('.cb-no.L').textContent = k * 2 + 1; sec.querySelector('.cb-no.R').textContent = k * 2 + 2;
      book.querySelector('.cb-count').textContent = `${k + 1}/${n}`;
      book.querySelector('.cb-prev').disabled = k <= 0; book.querySelector('.cb-next').disabled = k >= n - 1;
      book.querySelector('.cb-nav').classList.toggle('single', n < 2);
    };
    const show = id => {
      tab = id;
      book.querySelectorAll('.cb-tabs button').forEach(b => { const on = b.dataset.t === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', on) });
      book.querySelectorAll('.cb-page').forEach(p => p.hidden = p.dataset.p !== id);
      lay(id); try { window.CardStudio?.fit(book) } catch (e) { }
    };
    const turn = d => { const n = spreads(tab), k = (spreadOf[tab] || 0) + d; if (k < 0 || k >= n) return; spreadOf[tab] = k; show(tab); try { window.Sfx?.play?.('page') } catch (e) { } };
    book.querySelector('.cb-tabs').addEventListener('click', e => { const b = e.target.closest('button[data-t]'); if (b) show(b.dataset.t) });
    book.querySelector('.cb-prev').onclick = () => turn(-1); book.querySelector('.cb-next').onclick = () => turn(1);
    book.addEventListener('keydown', e => { if (e.key === 'ArrowLeft' && !e.target.closest('input,textarea')) turn(-1); if (e.key === 'ArrowRight' && !e.target.closest('input,textarea')) turn(1) });
    host.replaceChildren(book); if (msg) book.appendChild(msg); else book.insertAdjacentHTML('beforeend', '<p id="bagMsg" class="small" role="status"></p>');
    show(tab);
  }
})();
