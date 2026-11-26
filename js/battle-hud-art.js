/* Painted battle controls. Counts/state stay live DOM; rules and the card rows are untouched. */
(function (root) {
  'use strict';
  const BASE = 'assets/ui/battle-actions/', ICONS = {
    end: 'end-turn', undo: 'undo-move', auto: 'auto-play', stop: 'auto-stop',
    absorb: 'crystal-absorb', redraw: 'crystal-redraw', menu: 'menu', grid: 'grid'
  };
  const src = key => key === 'items' ? 'assets/icons/menu/v2-items.webp' : BASE + ICONS[key] + '.webp';
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const TIPS = { absorb: ['ดูดซับคริสตัล', 'ใช้คริสตัล 1 ก้อน → ฟื้นแรง +15'], redraw: ['หลอมคริสตัล', 'ใช้คริสตัล 1 ก้อน → สลับไพ่ใหม่ทั้งมือ (ทำได้ 1 ครั้งต่อเทิร์น)'] };
  /* one floating tip card for every [data-fbtip="หัวข้อ|คำอธิบาย"] — found by the pointer position (a disabled button gets no pointer events) */
  (function tipCard() {
    const doc = root.document; if (!doc || tipCard.on) return; tipCard.on = true; let el = null, cur = null;
    const css = '#fbTip{position:fixed;z-index:70;max-width:260px;padding:9px 13px;border-radius:10px;background:#14231ff8;border:1px solid #d2ac65;box-shadow:0 8px 22px #000b;color:#f5e6c4;font:13px/1.45 AgThai,system-ui,sans-serif;pointer-events:none;transform:translateX(-50%)}#fbTip b{display:block;color:#ffe2a8;font-size:14px;margin-bottom:2px}';
    const hide = () => { cur = null; if (el) el.style.display = 'none' };
    doc.addEventListener('pointermove', e => {
      let hit = null; for (const b of doc.querySelectorAll('[data-fbtip]')) { const r = b.getBoundingClientRect(); if (r.width && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) { hit = b; break } }
      if (!hit) { hide(); return }
      if (!el) { const st = doc.createElement('style'); st.textContent = css; doc.head.append(st); el = doc.createElement('div'); el.id = 'fbTip'; doc.body.append(el) }
      if (cur !== hit) { cur = hit; const [h, t] = hit.dataset.fbtip.split('|'); el.innerHTML = `<b>${esc(h)}</b>${esc(t || '')}` }
      el.style.display = 'block'; const r = hit.getBoundingClientRect(), w = el.offsetWidth;
      el.style.left = Math.max(w / 2 + 6, Math.min(root.innerWidth - w / 2 - 6, (r.left + r.right) / 2)) + 'px'; el.style.top = Math.max(6, r.top - el.offsetHeight - 10) + 'px';
    }, true);
    doc.addEventListener('pointerleave', hide); root.addEventListener('blur', hide);
  })();
  function skinButton(button, key, label, detail = '') {
    if (!button) return;
    button.classList.add('fb-art-button');
    if (button.dataset.hudArt !== key) {
      button.innerHTML = `<img class="fb-control-art" src="${src(key)}" alt="" draggable="false"><span class="fb-control-label"></span>`;
      button.dataset.hudArt = key;
    }
    const caption = button.querySelector('.fb-control-label');
    const tip = TIPS[key];   /* v98.1100 · the small second line (แรง +15 / สลับไพ่) moved into a floating tip card shown while the pointer is on the button */
    if (tip) { button.dataset.fbtip = tip.join('|'); button.removeAttribute('title') }
    const text = esc(label) + (detail && !tip ? `<small>${esc(detail)}</small>` : '');
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
