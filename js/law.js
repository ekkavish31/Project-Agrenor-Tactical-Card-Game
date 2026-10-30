/* v97.52 · T3 law and punishment, phase 1 (docs/TODO.md "T ที่อยู่ เมือง แฟคชั่น และการปกครอง").
   Each settlement keeps a case file on you (S.law[id] = { heat, fine, wanted, last }):
     heat   0…5  how hard the guards look for you (falls by 1 every 7 days)
     fine   gold owed
     wanted true once you resisted or ran — guards stop you at the gate, shops turn you away
   Crimes so far: stealing from a shop or market stall (js/interior.js — more likely to work for a rogue, or when nobody is minding it).
   Caught: pay the fine · or spend a night in the cells (a day passes, fatigue up) · or run (wanted, heat +2, standing −15).
   Clearing a case: pay at the guard (Dork's house in Fernvale, the gate in other towns) · finishing guild contracts lowers heat.
   Standing with the ruler of the place (js/factions.js) drops with every crime caught. */
(function (root) {
  'use strict';
  const RULER = id => root.Settlements?.SETTLEMENTS?.[id]?.ruler || 'village';
  const NAME = id => root.Settlements?.SETTLEMENTS?.[id]?.name || id;
  const day = () => { try { return root.WorldState?.game?.()?.day || 1 } catch (e) { return 1 } };
  const file = (S, id) => { S.law ||= {}; const f = S.law[id] ||= { heat: 0, fine: 0, wanted: false, last: day() }; const d = day(); if (d - f.last >= 7) { f.heat = Math.max(0, f.heat - Math.floor((d - f.last) / 7)); f.last = d } return f };
  const clean = (S, id) => { const f = file(S, id); return !f.fine && !f.wanted };
  const stealChance = (opts = {}) => Math.min(.92, (opts.rogue ? .72 : .42) + (opts.unwatched ? .2 : 0) - (opts.heat || 0) * .06 - (opts.safety ? .15 : 0));   /* v97.56 · a town on a safety drive catches more thieves */
  /* a theft attempt: returns { ok } or { caught, fine } (the caller then offers pay / cells / run) */
  function steal(S, id, opts = {}) {
    const f = file(S, id), r = opts.rng || Math.random;
    if (r() < stealChance({ ...opts, heat: f.heat, safety: root.Settlements?.policy?.(id) === 'safety' })) return { ok: true };
    f.heat = Math.min(5, f.heat + 1); f.fine += 20 + 10 * f.heat; f.last = day();
    root.Factions?.add(RULER(id), -8, 'ถูกจับได้ว่าขโมยของที่' + NAME(id));
    return { caught: true, fine: f.fine };
  }
  function pay(S, id) { const f = file(S, id), c = f.fine + (f.wanted ? 30 : 0); if ((S.gold || 0) < c) return false; S.gold -= c; f.fine = 0; f.wanted = false; return true }
  function jail(S, id) { const f = file(S, id); f.fine = 0; f.wanted = false; f.heat = Math.max(0, f.heat - 1); S.fatigue = Math.min(100, (S.fatigue || 0) + 30); return true }   /* the caller passes a day */
  function run(S, id) { const f = file(S, id); f.wanted = true; f.heat = Math.min(5, f.heat + 2); root.Factions?.add(RULER(id), -15, 'หนีการจับกุมที่' + NAME(id)) }
  function service(S, id) { const f = file(S, id); if (f.heat) f.heat--; return f.heat }   /* good deeds (guild contracts) */
  const owed = (S, id) => { const f = file(S, id); return f.fine + (f.wanted ? 30 : 0) };
  function status(S, id) { const f = file(S, id); return !f.fine && !f.wanted && !f.heat ? '' : (f.wanted ? '🚨 ถูกหมายจับ · ' : '') + (f.fine ? 'ค่าปรับค้าง ' + f.fine + ' 💰 · ' : '') + 'ความเพ่งเล็ง ' + '●'.repeat(f.heat) + '○'.repeat(5 - f.heat) }
  /* the arrest choice (one overlay; resolves 'pay' | 'jail' | 'run') */
  function arrest(S, id, text) {
    return new Promise(res => {
      document.getElementById('lawUI')?.remove(); const d = document.createElement('div'); d.id = 'lawUI'; const c = owed(S, id);
      d.style.cssText = 'position:fixed;inset:0;z-index:2200;display:grid;place-items:center;background:#05080dd9;font-family:VillageThai,"Noto Sans Thai",system-ui,sans-serif';
      const b = (a, l, dis) => `<button data-a="${a}" ${dis ? 'disabled' : ''} style="margin:4px;padding:8px 14px;border-radius:9px;border:1px solid #7a4b06;background:linear-gradient(#f0c560,#c9902e);color:#2a1a06;font:700 13.5px inherit;font-family:inherit;cursor:pointer;${dis ? 'opacity:.45' : ''}">${l}</button>`;
      d.innerHTML = `<div style="width:min(520px,94vw);padding:18px 20px;border-radius:16px;background:linear-gradient(#f3e6c6,#e2cfa2);color:#3a2a14;box-shadow:0 24px 60px #000c">
        <h2 style="margin:0 0 6px;font:800 22px Georgia,'Noto Sans Thai',serif">🛡 ยามจับได้!</h2><p style="margin:0 0 10px;font-size:14px;line-height:1.6">${text || ''}</p>
        <p style="margin:0 0 10px;font-size:13px;color:#6a5030">ค่าปรับ ${c} 💰 · มี ${S.gold || 0} 💰</p>
        ${b('pay', '💰 จ่ายค่าปรับ ' + c, (S.gold || 0) < c)}${b('jail', '⛓ ยอมติดคุก 1 คืน')}${b('run', '🏃 หนี (ถูกหมายจับ)')}</div>`;
      document.body.append(d);
      d.onclick = e => { const x = e.target.closest('[data-a]'); if (!x || x.disabled) return; const a = x.dataset.a;
        if (a === 'pay' && !pay(S, id)) return; if (a === 'jail') jail(S, id); if (a === 'run') run(S, id); d.remove(); res(a) };
    });
  }
  root.Law = { file, clean, steal, stealChance, pay, jail, run, service, owed, status, arrest };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Law;
})(typeof window !== 'undefined' ? window : globalThis);
