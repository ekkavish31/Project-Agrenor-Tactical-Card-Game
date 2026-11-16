/* v98.584 · THE CARD BOOK (สมุดผนึก) — the old bag dialog, now a book with tabs.
   Why: everything the hero carries is shown as a card; the spell that turns things into cards lives in the book the Adventurers' Guild gives at registration (docs/ITEM-CARDS-TH.md).
   It does not re-implement the bag: it lets js/collection-v03.js + js/bag.js draw as before (so every button keeps working) and then re-arranges the result into a book:
     ของใช้ (consumables) · อุปกรณ์ (gear) · วัตถุดิบ (materials) · ทั่วไป (goods to sell) · เหตุการณ์ (event cards, only when there are some)
   The open tab is remembered while the dialog is re-drawn (using a potion redraws it).  Data keys stay `bag` / `materials` / `inventory` — saves are untouched. */
(function () {
  'use strict';
  if (typeof renderBag !== 'function') return;
  const TABS = [
    { id: 'use', icon: '⚗', name: 'ของใช้', tip: 'ใช้แล้วหมดไป' },
    { id: 'gear', icon: '⚔', name: 'อุปกรณ์', tip: 'สวมใส่ได้ 1 ใบ' },
    { id: 'mat', icon: '⛏', name: 'วัตถุดิบ', tip: 'ใช้ผลิตที่โรงตีเหล็ก' },
    { id: 'goods', icon: '◈', name: 'ทั่วไป', tip: 'ขายได้ที่ตลาด' },
    { id: 'event', icon: '✉', name: 'เหตุการณ์', tip: 'ใช้แล้วเกิดเรื่องราว' }
  ];
  let tab = 'use';
  const kindOf = t => /^ของใช้ ·/.test(t) ? 'use' : /^การ์ดเหตุการณ์/.test(t) ? 'event' : /^ไอเทมทั่วไป/.test(t) ? 'goods' : /^วัตถุดิบและของใช้/.test(t) ? 'mat' : /^อุปกรณ์/.test(t) ? 'gear' : '';
  const prev = renderBag;
  renderBag = function () {
    prev();
    try { rebuild() } catch (e) { console.error('card-book', e) }
    try { window.Story?.bookFirst?.() } catch (e) { }   /* v98.589 · the first-time lesson (story scene bookFirst) */
  };
  function rebuild() {
    const host = document.getElementById('panelContent'); if (!host || host.querySelector('.card-book')) return;
    const pages = {}, notes = {}; let lead = null, msg = host.querySelector('#bagMsg');
    const kids = [...host.querySelectorAll(':scope > h3, :scope > .collection-grid, :scope > p, :scope > .bag-v11 > h3, :scope > .bag-v11 > .bag-item-grid')];
    let cur = '';
    for (const el of kids) {
      if (el.tagName === 'H3') { cur = kindOf(el.textContent.trim()); notes[cur] = el.textContent.trim(); continue }
      if (el.tagName === 'P') { if (!el.id) lead = lead || el; continue }
      if (cur) (pages[cur] ||= []).push(el);
    }
    if (!Object.keys(pages).length) return;
    const count = id => (pages[id] || []).reduce((n, g) => n + g.querySelectorAll('article,.bag-item-card').length, 0);
    const tabs = TABS.filter(t => t.id !== 'event' || count('event') > 0);
    if (!tabs.some(t => t.id === tab)) tab = tabs[0].id;
    const total = TABS.reduce((n, t) => n + count(t.id), 0);
    const book = document.createElement('div'); book.className = 'card-book';
    book.innerHTML = `<header class="cb-cover"><small>การ์ดที่ผนึกไว้ในสมุด ${total} ใบ · แตะการ์ดเพื่อดูขนาดเต็ม</small></header>
      <nav class="cb-tabs" role="tablist">${tabs.map(t => `<button type="button" role="tab" data-t="${t.id}" title="${t.tip}"><i>${t.icon}</i><b>${t.name}</b><em>${count(t.id)}</em></button>`).join('')}</nav>
      <div class="cb-leaf">${tabs.map(t => `<section class="cb-page" data-p="${t.id}" role="tabpanel"><p class="cb-sub">${(notes[t.id] || t.name).replace(/[<>&]/g, '')}</p></section>`).join('')}</div>`;
    for (const t of tabs) { const sec = book.querySelector(`[data-p="${t.id}"]`); for (const g of pages[t.id] || []) sec.appendChild(g); if (!count(t.id)) sec.insertAdjacentHTML('beforeend', '<p class="cb-empty">ยังไม่มีการ์ดในหมวดนี้</p>') }
    const show = id => { tab = id; book.querySelectorAll('.cb-tabs button').forEach(b => { const on = b.dataset.t === id; b.classList.toggle('on', on); b.setAttribute('aria-selected', on) }); book.querySelectorAll('.cb-page').forEach(p => p.hidden = p.dataset.p !== id); try { window.CardStudio?.fit(book) } catch (e) { } };
    book.querySelector('.cb-tabs').addEventListener('click', e => { const b = e.target.closest('button[data-t]'); if (b) show(b.dataset.t) });
    host.replaceChildren(book); if (msg) book.appendChild(msg); else book.insertAdjacentHTML('beforeend', '<p id="bagMsg" class="small" role="status"></p>');
    show(tab);
  }
})();
