/* v95.00 · Training ground on the same card battle as the world map (js/flat-battle.js via town-battle).
   Before this the scarecrow training used the old tactics engine (tactics-core / tactics-ui), so what the player practised was
   not how real fights work. Now: three scarecrows that never hit back, your deck, your companions, heights of the village square.
   • Costs 30 minutes and a little freshness; needs to be at the forge (trainingBlock in js/tactics-bridge.js).
   • Gives hero XP through js/progression.js — 6 per scarecrow, at most 36 a day (so training helps early but cannot replace
     adventure); companions who trained get 80 %.
   The old engine is still loaded for the archived expedition/adventure paths only (TODO C3). */
(function (root) {
  'use strict';
  if (typeof s === 'undefined' || typeof openTactical !== 'function') return;
  const XP_EACH = 6, XP_DAY = 36, MINUTES = 30, FATIGUE = 6;
  const baseOpen = openTactical;
  function toast(msg) { try { root.PlayerShop?.toast?.(msg) } catch (e) { } try { $('message').textContent = msg } catch (e) { } }
  function open() {
    if (document.getElementById('trainBattle')) return;
    const why = typeof trainingBlock === 'function' ? trainingBlock() : '';
    if (why) { toast('ยังฝึกไม่ได้: ' + why); return }
    const g = s, v = s.village;
    const party = (v.party || []).filter(p => p.hp > 0).map(p => p.key + ':' + p.hp + ':' + p.max + ':' + (p.order || 'charge') + ':' + (p.level || 1)).join(',');
    const heroQ = root.Progression ? '&' + Progression.battleParam(g, Progression.recipes) : '';
    const fr = document.createElement('iframe'); fr.id = 'trainBattle'; fr.title = 'ลานฝึกหุ่นฟาง';
    fr.style.cssText = 'position:fixed;inset:0;z-index:950;width:100%;height:100%;border:0;background:#07080c';
    fr.src = 'village-town.html?battle=1&embed=1&r=5&ms=' + encodeURIComponent('dummy*1,dummy*1,dummy*1') + '&party=' + encodeURIComponent(party) + '&hhp=' + (g.hp || 60) + '&hmax=' + (g.maxHp || 60) + heroQ + '&title=' + encodeURIComponent('ลานฝึก ·');
    try { if ($('panel').open) $('panel').close() } catch (e) { }
    const done = e => {
      if (e.source !== fr.contentWindow || e.data?.type !== 'agrenor-battle') return;
      removeEventListener('message', done); fr.remove();
      const r = e.data; g.minutes = Math.min(1200, (g.minutes || 0) + MINUTES); g.fatigue = Math.min(100, (g.fatigue || 0) + FATIGUE);
      for (const x of r.party || []) { const p = (v.party || []).find(q => q.key === x.key); if (p && x.order) p.order = x.order }
      const day = g.day, T = v.training ||= {}; if (T.day !== day) { T.day = day; T.xp = 0 }
      const xp = Math.max(0, Math.min(XP_DAY - T.xp, XP_EACH * (r.kills || 0))); T.xp += xp;
      let msg = 'ฝึกเสร็จ · ใช้เวลา ' + MINUTES + ' นาที';
      if (xp > 0) { const ups = gainCharacterXP(xp) || []; for (const p of v.party || []) if ((r.party || []).some(x => x.key === p.key)) root.Progression?.gainAlly(p, Math.round(xp * .8)); msg += ' · EXP +' + xp + (Array.isArray(ups) && ups.length ? ' · เลเวลอัป Lv.' + ups[ups.length - 1] : '') }
      else if (r.outcome === 'win') msg += ' · วันนี้ได้ EXP จากการฝึกครบแล้ว (' + XP_DAY + ')';
      try { save() } catch (e) { } try { render() } catch (e) { } toast(msg);
    };
    addEventListener('message', done); document.body.appendChild(fr);
  }
  /* training only — the archived expedition / adventure calls keep the old engine */
  openTactical = function (opts = {}) { if (opts.expedition || opts.adventure) return baseOpen.apply(this, arguments); open() };
  root.TrainingFlat = { open, XP_EACH, XP_DAY };
})(typeof globalThis !== 'undefined' ? globalThis : this);
