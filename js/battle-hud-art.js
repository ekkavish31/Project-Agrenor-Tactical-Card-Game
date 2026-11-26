/* Painted battle controls. Counts/state stay live DOM; rules and the card rows are untouched. */
(function (root) {
  'use strict';
  const BASE = 'assets/ui/battle-actions/', ICONS = {
    end: 'end-turn', undo: 'undo-move', auto: 'auto-play', stop: 'auto-stop',
    absorb: 'crystal-absorb', redraw: 'crystal-redraw', menu: 'menu', grid: 'grid'
  };
  const src = key => key === 'items' ? 'assets/icons/menu/v2-items.webp' : BASE + ICONS[key] + '.webp';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function skinButton(button, key, label, detail = '') {
    if (!button) return;
    button.classList.add('fb-art-button');
    if (button.dataset.hudArt !== key) {
      button.innerHTML = `<img class="fb-control-art" src="${src(key)}" alt="" draggable="false"><span class="fb-control-label"></span>`;
      button.dataset.hudArt = key;
    }
    const caption = button.querySelector('.fb-control-label');
    const text = esc(label) + (detail ? `<small>${esc(detail)}</small>` : '');
    if (caption.innerHTML !== text) caption.innerHTML = text;
    button.classList.toggle('fb-wide-control', key === 'absorb' || key === 'redraw');
  }
  function pileHTML(kind) {
    const label = kind === 'draw' ? 'กองจั่ว' : 'กองทิ้ง';
    return `<img class="fb-pile-art" src="${BASE + (kind === 'draw' ? 'draw-pile' : 'discard-pile')}.webp" alt="" draggable="false"><b class="fb-pile-count">0</b><small>${label}</small>`;
  }
  function syncPile(pile, count) {
    if (!pile) return;
    const n = Math.max(0, Number(count) || 0), badge = pile.querySelector('.fb-pile-count');
    if (badge && badge.textContent !== String(n)) badge.textContent = String(n);
    pile.classList.toggle('empty', n === 0);
    pile.setAttribute('aria-label', `${pile.id === 'fbDraw' ? 'กองจั่ว' : 'กองทิ้ง'} ${n} ใบ`);
  }
  function mountControls(actions) {
    if (!actions) return;
    actions.classList.add('fb-art-controls');
    const rows = [['fbEnd', 'end', 'จบเทิร์น'], ['fbUndo', 'undo', 'ย้อนเดิน'], ['fbAuto', 'auto', 'Auto'],
      ['fbCrSt', 'absorb', 'ดูดซับคริสตัล', 'แรง +15'], ['fbCrDraw', 'redraw', 'หลอมคริสตัล', 'สลับไพ่'],
      ['gridBtn', 'grid', 'กริด'], ['fbMenu', 'menu', 'เมนู']];
    for (const [id, key, label, detail] of rows) skinButton(actions.querySelector('#' + id), key, label, detail);
  }
  // Use the actual card-row top, including responsive sizes. The grid button belongs to this row too.
  function reserveHand(hand) {
    const place = () => {
      const top = hand.getBoundingClientRect().top;
      if (Number.isFinite(top)) root.document.documentElement.style.setProperty('--fb-actions-bottom', Math.max(12, Math.ceil(root.innerHeight - top + 24)) + 'px');
    };
    const observer = root.ResizeObserver ? new root.ResizeObserver(place) : null;
    observer?.observe(hand); root.addEventListener('resize', place);
    root.document.fonts?.ready?.then(place); place();
    root.addEventListener('pagehide', () => { observer?.disconnect(); root.removeEventListener('resize', place) }, { once: true });
  }
  root.BattleHudArt = { skinButton, pileHTML, syncPile, mountControls, reserveHand };
})(typeof window !== 'undefined' ? window : globalThis);
