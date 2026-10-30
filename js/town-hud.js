/* v98.4 · Village HUD: 4 icons + menu (docs/UI-BRUSHUP.md · button budget)
   🧭 แผนที่ · 📋 วันนี้ · 👤 ตัวเรา · 🗺 ออกเดินทาง · ☰ เมนู (= Esc)
   One drawn icon set (SVG medallions) replaces the mixed photos / emoji. The old buttons stay in the page, hidden, and the new ones
   click them, so every system keeps its own handler. */
(function () {
  'use strict';
  const row = document.getElementById('townGameMenu');
  if (!row || row.dataset.hud) return;
  row.dataset.hud = '1';
  const $ = id => document.getElementById(id);
  const store = document.createElement('div'); store.id = 'townHudStore'; store.hidden = true; document.body.append(store);
  for (const el of [...row.children]) store.append(el);
  if ($('elChart')) store.append($('elChart'));
  // the places list (top left) is the same job as the town map: the map is the one way in, outside the editor
  const editPage = /[?&]edit=1/.test(location.search);
  if (!editPage && $('menuBtn')) $('menuBtn').style.display = 'none';

  const S = 'fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';
  const G = { // 48×48 glyphs, one line style
    map: `<circle cx="24" cy="24" r="15" ${S}/><path d="M24 12l4.5 12H19.5z" fill="#e8c46a" stroke="#e8c46a" stroke-width="1.5" stroke-linejoin="round"/><path d="M24 36l-4.5-12h9z" fill="currentColor"/><circle cx="24" cy="24" r="2.2" fill="#1d3128"/>`,
    today: `<rect x="12" y="10" width="24" height="30" rx="3" ${S}/><path d="M19 10v-2h10v2" ${S}/><path d="M17 20l2.5 2.5L24 18M17 30l2.5 2.5L24 28" ${S} stroke="#e8c46a"/><path d="M27 21h4M27 31h4" ${S}/>`,
    me: `<circle cx="24" cy="17" r="7" ${S}/><path d="M10 39c1.5-8 7-12 14-12s12.5 4 14 12" ${S}/><path d="M30 33l3 3 5-6" ${S} stroke="#e8c46a"/>`,
    go: `<path d="M22 40V8" ${S}/><path d="M22 12h13l4 4-4 4H22z" ${S}/><path d="M22 24H11l-4 4 4 4h11" ${S} stroke="#e8c46a"/>`,
    menu: `<path d="M14 17h20M14 24h20M14 31h20" ${S}/>`,
    character: `<circle cx="24" cy="16" r="7" ${S}/><path d="M11 40c1.5-8 6.5-12 13-12s11.5 4 13 12" ${S}/>`,
    bag: `<path d="M15 18h18l3 20H12z" ${S}/><path d="M19 18c0-6 2.5-9 5-9s5 3 5 9" ${S}/><path d="M18 26h12" ${S}/>`,
    deck: `<rect x="10" y="13" width="17" height="24" rx="3" ${S}/><path d="M22 11l15 4-6 23" ${S}/>`,
    job: `<path d="M12 36L34 14M34 14l2-4-4 2M14 30l4 4" ${S}/><path d="M36 36L14 14M14 14l-2-4 4 2M34 30l-4 4" ${S}/>`,
    element: `<path d="M24 8l12 16-12 16-12-16z" ${S}/><path d="M24 8v32M12 24h24" ${S}/>`,
    activity: `<circle cx="24" cy="24" r="14" ${S}/><circle cx="24" cy="24" r="7" ${S}/><circle cx="24" cy="24" r="1.8" fill="currentColor"/>`,
    journal: `<path d="M12 10h20a4 4 0 0 1 4 4v24H16a4 4 0 0 1-4-4z" ${S}/><path d="M12 34a4 4 0 0 1 4-4h20M19 17h11M19 23h8" ${S}/>`,
    farm: `<path d="M24 40V22" ${S}/><path d="M24 26c-8 0-11-5-11-11 7 0 11 4 11 11zM24 22c0-7 4-11 11-11 0 6-3 11-11 11" ${S}/><path d="M12 40h24" ${S}/>`
  };
  const svg = k => `<svg viewBox="0 0 48 48" aria-hidden="true">${G[k]}</svg>`;
  const click = sel => { const b = typeof sel === 'string' ? store.querySelector(sel) || document.querySelector(sel) : sel; if (b) b.click(); return !!b };
  function farmHere() { try { return ((parent.WorldState || window.WorldState)?.world()?.estates || []).find(p => p.at === 'town:fernvale' && p.kind === 'farm') || null } catch (e) { return null } }
  const call = (name, fn = 'open') => { try { (parent[name] || window[name])?.[fn]?.() } catch (e) { } };

  const MENUS = {
    today: () => [
      ['activity', 'กิจกรรมวันนี้', () => click('#activities')],
      ['journal', 'สมุดหมู่บ้าน', () => click('[data-game="journal"]')],
      ...(farmHere() ? [['farm', 'ไร่ของเรา', () => { const f = farmHere(); location.href = 'place-interior.html?place=farm&farm=' + encodeURIComponent(f.id) + '&name=' + encodeURIComponent('ไร่ · ' + f.name) + '&back=village-town.html' }]] : [])
    ],
    me: () => [
      ['character', 'ตัวละคร', () => click('[data-game="character"]')],
      ['bag', 'กระเป๋า', () => click('[data-game="bag"]')],
      ['deck', 'สำรับ', () => click('[data-game="deck"]')],
      ['job', 'อาชีพ', () => call('JobsUI')],
      ['element', 'ตารางธาตุ', () => click('#elChart')]
    ]
  };
  const ICONS = [
    ['map', 'แผนที่', 'แผนที่เมือง · คลิกหมุดเพื่อเดินไป (M)', () => click('#townMapBtn')],
    ['today', 'วันนี้', 'กิจกรรม · สมุดหมู่บ้าน · ไร่', 'today'],
    ['me', 'ตัวเรา', 'ตัวละคร · กระเป๋า · สำรับ · อาชีพ · ธาตุ', 'me'],
    ...(store.querySelector('.town-go') ? [['go', 'ออกเดินทาง', 'ไปแผนที่โลก · หรือเดินไปที่ประตูหมู่บ้าน', () => click('.town-go')]] : [])
  ];
  const pop = document.createElement('div'); pop.className = 'hud-pop'; pop.hidden = true; document.body.append(pop);
  let popFor = null;
  function closePop() { pop.hidden = true; popFor?.setAttribute('aria-expanded', 'false'); popFor = null }
  function openPop(btn, key) {
    if (popFor === btn) { closePop(); return }
    closePop(); popFor = btn; btn.setAttribute('aria-expanded', 'true');
    pop.innerHTML = ''; for (const [ico, label, fn] of MENUS[key]()) { const b = document.createElement('button'); b.type = 'button'; b.innerHTML = svg(ico) + '<span></span>'; b.lastChild.textContent = label; b.onclick = () => { closePop(); fn() }; pop.append(b) }
    pop.hidden = false; const r = btn.getBoundingClientRect(), w = pop.offsetWidth;
    pop.style.top = (r.bottom + 8) + 'px'; pop.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)) + 'px';
    pop.querySelector('button')?.focus();
  }
  for (const [key, label, title, act] of ICONS) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'hud-ico'; b.dataset.hud = key; b.title = title;
    b.innerHTML = `<span class="hud-medal">${svg(key)}</span><span class="hud-lbl">${label}</span>`;
    if (typeof act === 'string') { b.setAttribute('aria-haspopup', 'true'); b.setAttribute('aria-expanded', 'false'); b.onclick = () => openPop(b, act) } else b.onclick = () => { closePop(); act() };
    row.append(b);
  }
  { const b = document.createElement('button'); b.type = 'button'; b.className = 'hud-ico hud-small'; b.title = 'เมนู · บันทึก โหลด ตั้งค่า (Esc)'; b.innerHTML = `<span class="hud-medal">${svg('menu')}</span><span class="hud-lbl">เมนู</span>`;
    b.onclick = () => { closePop(); dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })) }; row.append(b) }
  addEventListener('pointerdown', e => { if (!pop.hidden && !e.target.closest('.hud-pop,.hud-ico')) closePop() }, true);
  addEventListener('keydown', e => { if (e.key === 'Escape' && !pop.hidden) { closePop(); e.preventDefault(); e.stopImmediatePropagation() } }, true);

  const css = document.createElement('style'); css.textContent = `
  .town-icon-row{gap:14px!important;top:12px!important;right:14px!important;align-items:flex-start}
  .town-icon-row>.hud-ico{width:84px;min-height:0;display:flex;flex-direction:column;align-items:center;gap:5px;padding:0;border:0;background:none;cursor:pointer;color:#f6e7bf;transition:transform .15s;text-shadow:none}
  .hud-medal{position:relative;display:grid;place-items:center;width:64px;height:64px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#4a6b52,#24392e 62%,#16251e);box-shadow:0 0 0 3px #d8b46a,0 0 0 5px #3a2a14,0 6px 14px #000a,inset 0 2px 0 #ffffff26,inset 0 -6px 12px #0006}
  .hud-medal::after{content:"";position:absolute;inset:5px;border-radius:50%;border:1px solid #f1dca059}
  .hud-medal svg{width:38px;height:38px}
  .hud-lbl{padding:2px 9px;border-radius:999px;background:#16251ee6;border:1px solid #d8b46a80;color:#fff3d2;font:700 12px VillageThai,system-ui,sans-serif;white-space:nowrap;box-shadow:0 2px 6px #0007}
  .town-icon-row>.hud-ico:hover{transform:translateY(-3px)}.town-icon-row>.hud-ico:hover .hud-medal,.town-icon-row>.hud-ico[aria-expanded=true] .hud-medal{box-shadow:0 0 0 3px #f3d48a,0 0 0 5px #3a2a14,0 0 18px #f3d48a99,0 6px 14px #000a,inset 0 2px 0 #ffffff26}
  .town-icon-row>.hud-ico:focus-visible{outline:2px dashed #fff3d2;outline-offset:4px;border-radius:12px}
  .town-icon-row>.hud-small{width:56px}.hud-small .hud-medal{width:46px;height:46px;margin-top:9px}.hud-small .hud-medal svg{width:28px;height:28px}
  .hud-pop[hidden]{display:none!important}
  .hud-pop{position:fixed;z-index:30;display:flex;flex-direction:column;gap:4px;min-width:190px;padding:8px;border-radius:14px;background:#1b2b24f5;border:1px solid #d8b46a99;box-shadow:0 14px 34px #000a}
  .hud-pop button{display:flex;align-items:center;gap:10px;padding:8px 12px;border:0;border-radius:9px;background:none;color:#f6e7bf;font:600 14px VillageThai,system-ui,sans-serif;text-align:left;cursor:pointer}
  .hud-pop button:hover,.hud-pop button:focus-visible{background:#2f4a3e;outline:none}.hud-pop svg{width:24px;height:24px;flex:none;color:#e8c46a}
  @media (max-width:900px){.town-icon-row{gap:6px!important;top:8px!important;right:8px!important}.town-icon-row>.hud-ico{width:58px}.hud-medal{width:46px;height:46px}.hud-medal svg{width:28px;height:28px}.hud-lbl{font-size:10px;padding:1px 6px}.town-icon-row>.hud-small{width:44px}.hud-small .hud-medal{width:36px;height:36px;margin-top:5px}}`;
  document.head.append(css);
})();
