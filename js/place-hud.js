/* v98.1120 · the sub-map (village-place.html) uses the SAME top HUD as the village map: the status pill + the icon row (แผนที่ · วันนี้ · สมุดผนึก · ตัวเรา · ออกเดินทาง · เมนู).
   It is built by js/town-hud.js; this file only supplies what that script expects from the page: the row (#townGameMenu) with the hidden buttons it clicks, and the pill (#townGameHud).
   Load it BEFORE js/town-hud.js.  Extra here: a "กลับหมู่บ้าน" icon (a sub-map has to be left). Hidden in ?edit=1 (the editor keeps its own tools). */
(function (root) {
  'use strict';
  if (root.__placeHud || /[?&]edit=1/.test(location.search)) return; root.__placeHud = 1;
  const $ = id => document.getElementById(id);
  const toParent = (type, id) => { try { parent.postMessage({ source: 'project-a-town', type, id }, '*') } catch (e) { } };
  const W = () => { try { return parent.WorldState || root.WorldState } catch (e) { return root.WorldState } };
  const row = document.createElement('div'); row.id = 'townGameMenu'; row.className = 'town-icon-row';
  const stub = (tag, attrs, fn) => { const b = document.createElement(tag); if (tag === 'button') b.type = 'button'; for (const [k, v] of Object.entries(attrs || {})) b.setAttribute(k, v); b.onclick = fn; row.append(b); return b };
  for (const k of ['bag', 'character', 'deck', 'journal']) stub('button', { 'data-game': k }, () => toParent('menu', k));
  stub('button', { id: 'activities' }, () => toParent('menu', 'activities'));
  stub('button', { id: 'townMapBtn' }, () => $('fit')?.click());                      /* the sub-map's own "see everything" view */
  stub('button', { class: 'town-go' }, () => toParent('menu', 'adventure'));
  stub('button', { id: 'elChart' }, () => { try { (parent.ElementWheel || root.ElementWheel)?.showChart() } catch (e) { } });
  document.body.append(row);
  document.documentElement.classList.add('place-hud');
  const css = document.createElement('style'); css.textContent = '#placeToolbar,#hud{display:none!important}'; document.head.append(css);   /* the old toolbar + text pill (kept in the page: its handlers are still wired) */

  /* the status pill: same markup as the village page (clock · wallet · HP · stamina) */
  const hud = document.createElement('div'); hud.id = 'townGameHud';
  function pill() {
    const w = W(); if (!w) return; const g = w.game(), n = w.now(), night = n.minutes >= w.LATE || n.minutes < 300;
    if (hud.parentNode !== row) row.prepend(hud);
    const ic = (d, n2) => `<img src="assets/icons/${d}/${n2}.webp" alt="" draggable="false">`, gl = i => `<i class="hg" style="background-position:${i % 4 * 100 / 3}% ${Math.floor(i / 4) * 100 / 3}%"></i>`,
      num = v => `<span class="hn">${String(Math.max(0, Math.round(v))).split('').map(c => gl(+c)).join('')}</span>`, st = Math.round(g.stamina ?? 100), hp = Math.round(g.hp),
      hh = String(Math.floor(n.minutes / 60) % 24).padStart(2, '0'), mm = String(Math.floor(n.minutes % 60)).padStart(2, '0');
    const sig = [w.heroName(), n.day, night, n.minutes | 0, hp, st, w.coins()].join('|'); if (hud.dataset.sig === sig) return; hud.dataset.sig = sig;
    hud.innerHTML = `<span class="hb-name"><b></b></span><span class="hb-sep"></span><span class="hb-chip" title="วันที่ ${n.day}">${ic('menu', 'calendar')}${num(n.day)}</span><span class="hb-chip" title="เวลา ${w.label(n.hour)}">${ic('pack', night ? 'dark' : 'light')}<span class="hn">${gl(+hh[0])}${gl(+hh[1])}<em></em>${gl(+mm[0])}${gl(+mm[1])}</span></span><span class="hb-sep"></span><span class="hb-chip" title="ชีวิต">${gl(12)}${num(hp)}</span><span class="hb-chip" title="แรง (stamina)">${gl(13)}${num(st)}</span><span class="hb-chip" title="เหรียญ">${gl(14)}${num(w.coins())}</span>`;
    hud.querySelector('.hb-name b').textContent = w.heroName();
  }
  setInterval(() => { if (!document.hidden) pill() }, 1000); setTimeout(pill, 300);

  /* "กลับหมู่บ้าน": the same painted-medal icon as the others, first in the row after the pill (added once js/town-hud.js has built the row) */
  let tries = 0; const t = setInterval(() => {
    if (++tries > 40) { clearInterval(t); return }
    if (!row.querySelector('.hud-ico')) return; clearInterval(t);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'hud-ico'; b.dataset.hud = 'leave'; b.title = 'กลับหมู่บ้าน';
    b.innerHTML = '<span class="hud-medal has-img"><img src="assets/icons/menu/village.webp" alt="" draggable="false"></span><span class="hud-lbl">กลับหมู่บ้าน</span>';
    b.onclick = () => $('leave')?.click(); const first = row.querySelector('.hud-ico'); row.insertBefore(b, first);
  }, 100);
})(window);
