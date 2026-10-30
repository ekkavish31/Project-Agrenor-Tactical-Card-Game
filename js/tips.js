/* v97.89 · C10 first-time tips for the newer systems (farm, bounties, town hall, offices, contest …).
   Tips.once(key, title, lines[, icon]) shows a small card the first time a player meets something, then never again.
   It respects the existing setting "tips" (s.village.settings.tips, js/settings.js) and remembers what was seen in the game save
   (village.tipsSeen[key]). The card does not block: it sits at the bottom of the screen until "เข้าใจแล้ว". */
(function (root) {
  'use strict';
  const game = () => { try { return (typeof s !== 'undefined' && s?.village ? s : root.WorldState?.game?.()) || null } catch (e) { return null } };
  const commit = () => { try { if (typeof save === 'function' && typeof s !== 'undefined') save(); else root.WorldState?.commit?.() } catch (e) { } };
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const on = () => game()?.village?.settings?.tips !== false;
  const seen = key => !!game()?.village?.tipsSeen?.[key];
  function mark(key) { const g = game(); if (!g?.village) return; (g.village.tipsSeen ||= {})[key] = 1; commit() }
  function once(key, title, lines, icon) {
    if (typeof document === 'undefined' || !on() || seen(key)) return false; mark(key);
    document.getElementById('tipCard')?.remove(); const d = document.createElement('div'); d.id = 'tipCard';
    d.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:2400;width:min(560px,94vw);padding:12px 14px;border-radius:14px;background:linear-gradient(#fff8e2,#f1dfb2);color:#3a2a14;box-shadow:0 14px 40px #000a;border:2px solid #c9a050;font-family:VillageThai,"Noto Sans Thai",system-ui,sans-serif;animation:tipIn .25s ease-out';
    d.innerHTML = `<style>@keyframes tipIn{from{opacity:0;transform:translate(-50%,16px)}to{opacity:1;transform:translate(-50%,0)}}</style><div style="display:flex;gap:10px;align-items:flex-start">${icon ? `<img src="${esc(icon)}" alt="" style="width:44px;height:44px;flex:none">` : '<span style="font-size:28px">💡</span>'}<div style="flex:1"><b style="font-size:15px">${esc(title)}</b><ul style="margin:4px 0 6px 18px;padding:0;font-size:13px;line-height:1.55">${lines.map(l => `<li>${esc(l)}</li>`).join('')}</ul><div style="text-align:right"><button style="padding:5px 14px;border-radius:8px;border:1px solid #7a4b06;background:linear-gradient(#f0c560,#c9902e);font:700 13px inherit;font-family:inherit;cursor:pointer">เข้าใจแล้ว</button> <small style="color:#8a7050">ปิดคำแนะนำทั้งหมดได้ในตั้งค่า</small></div></div></div>`;
    d.querySelector('button').onclick = () => d.remove(); document.body.append(d); return true;
  }
  const reset = () => { const g = game(); if (g?.village) { g.village.tipsSeen = {}; commit() } };
  root.Tips = { once, seen, reset };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.Tips;
})(typeof window !== 'undefined' ? window : globalThis);
