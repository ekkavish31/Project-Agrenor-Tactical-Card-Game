/* v97.18 · job board (docs/TODO.md "อาชีพและอาวุธ"): every job with its colour and emblem, stats, passive, the two cards it teaches,
   job level and points, and what opens it. Opened from the village menu (Esc → ⚔ อาชีพ) or JobsUI.open(). Rules: js/progression.js. */
(function () {
  'use strict';
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const MODN = { power: 'การ์ดอาวุธ', spell: 'การ์ดธาตุ', armor: 'เกราะ', hp: 'HP', crit: 'คริติคอล' };
  function modText(m) { return Object.entries(m || {}).map(([k, v]) => `${MODN[k] || k} ${v > 0 ? '+' : '−'}${k === 'crit' ? Math.round(Math.abs(v) * 100) + '%' : Math.abs(v)}`).join(' · ') || 'ไม่มี' }
  function css() {
    if (document.getElementById('jobsCss')) return; const s = document.createElement('style'); s.id = 'jobsCss';
    s.textContent = `#jobsUI{position:fixed;inset:0;z-index:2050;display:grid;place-items:center;background:#05080dcc;backdrop-filter:blur(3px);font-family:VillageThai,"Noto Sans Thai",system-ui,sans-serif}
    #jobsUI .box{width:min(980px,96vw);max-height:92vh;overflow:auto;padding:18px 20px;border-radius:16px;background:linear-gradient(#f3e6c6,#e2cfa2);color:#3a2a14;box-shadow:0 24px 60px #000c}
    #jobsUI h2{margin:0 0 4px;font:800 24px Georgia,"Noto Sans Thai",serif;color:#5a3a10}#jobsUI .js{margin:0 0 14px;color:#6a5030;font-size:13.5px}
    #jobsUI .jg{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:10px}
    #jobsUI .jb{display:flex;flex-direction:column;gap:6px;padding:12px;border-radius:12px;background:#fff8;border:2px solid #b08a4a55;min-width:0}
    #jobsUI .jb.cur{border-color:var(--c);box-shadow:0 0 0 2px var(--c) inset}#jobsUI .jb.lock{opacity:.6}
    #jobsUI .jh{display:flex;gap:10px;align-items:center}#jobsUI .je{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:var(--c);color:#fff8e8;font:700 19px system-ui,"Segoe UI Symbol",sans-serif;border:2px solid #1a140c;flex:none}
    #jobsUI .jh b{font-size:17px}#jobsUI .jh small{display:block;color:#7a6040;font-size:12.5px}
    #jobsUI .jr{font-size:13px;line-height:1.5}#jobsUI .jr i{font-style:normal;color:#7a6040}
    #jobsUI .jx{height:8px;border-radius:5px;background:#0002;overflow:hidden}#jobsUI .jx span{display:block;height:100%;background:var(--c)}
    #jobsUI button{padding:8px 12px;border-radius:9px;border:1px solid #7a4b06;background:linear-gradient(#f0c560,#c9902e);color:#2a1a06;font:700 13.5px inherit;font-family:inherit;cursor:pointer}
    #jobsUI button:disabled{opacity:.55;cursor:default;background:#d8c8a0}#jobsUI .x{float:right;background:none;border:none;font-size:20px;padding:0 4px}`;
    document.head.append(s);
  }
  function open() {
    const P = window.Progression, g = typeof s !== 'undefined' ? s : window.WorldState?.game?.(); if (!P || !g) return;
    css(); document.getElementById('jobsUI')?.remove();
    const D = window.TacticsDecks?.COMBAT || {}, c = P.jobsOf(g), d = document.createElement('div'); d.id = 'jobsUI';
    const card = id => { const J = P.JOBS[id], lv = P.jobLevel(g, id), jp = c.jobs[id]?.jp || 0, why = P.jobWhy(g, id), cur = c.job === id, max = lv >= P.JOB_MAX;
      return `<div class="jb ${cur ? 'cur' : ''} ${why ? 'lock' : ''}" style="--c:${J.col}"><div class="jh"><span class="je">${J.icon}</span><div><b>${esc(J.name)}</b>${id === 'adventurer' ? '' : ` <small>Lv.${lv}${max ? ' (สูงสุด)' : ` · ${jp}/${P.jobNeed(lv)}`}</small>`}<small>${esc(J.desc)}</small></div></div>
        ${id === 'adventurer' ? '' : `<div class="jx"><span style="width:${max ? 100 : Math.min(100, jp / P.jobNeed(lv) * 100)}%"></span></div>`}
        <div class="jr"><i>ค่าสเตตัส:</i> ${esc(modText(J.mods))}</div><div class="jr"><i>ติดตัว:</i> ${esc(J.passive)}</div>
        ${J.cards.length ? `<div class="jr"><i>สอนการ์ด:</i> ${J.cards.map((k, n) => `${esc(D[k]?.name || k)} (Lv.${n ? 4 : 2})`).join(' · ')}</div>` : ''}
        <button data-job="${id}" ${cur || why ? 'disabled' : ''}>${cur ? '✓ อาชีพปัจจุบัน' : why ? '🔒 ' + esc(why) : 'เปลี่ยนเป็น' + esc(J.name)}</button></div>` };
    d.innerHTML = `<div class="box"><button class="x" title="ปิด (Esc)">✕</button><h2>⚔ อาชีพ</h2><p class="js">อาวุธใช้ได้ทุกอาชีพ · ชนะการต่อสู้ได้แต้มอาชีพ · การ์ดที่เรียนจากอาชีพติดตัวไปแม้เปลี่ยนอาชีพ · ชุดเปลี่ยนสีตามอาชีพ</p><div class="jg">${Object.keys(P.JOBS).map(card).join('')}</div></div>`;
    document.body.append(d);
    const close = () => { removeEventListener('keydown', key, true); d.remove() }, key = e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close() } };
    addEventListener('keydown', key, true);
    d.onclick = e => { if (e.target === d || e.target.closest('.x')) return close(); const b = e.target.closest('[data-job]'); if (!b || b.disabled) return;
      if (P.setJob(g, b.dataset.job)) { try { save() } catch (er) { window.WorldState?.commit?.() } window.StoryToast?.('เปลี่ยนอาชีพเป็น ' + P.JOBS[b.dataset.job].icon + ' ' + P.JOBS[b.dataset.job].name, 'quest'); open() } };
    d.querySelector('button:not(:disabled)')?.focus();
  }
  window.JobsUI = { open };
})();
