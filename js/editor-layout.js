/* v91.3 · Village editor toolbar, regrouped into labelled categories (one dock instead of two loose bars).
   Existing buttons are MOVED, not rebuilt, so every handler keeps working:
   เครื่องมือ (what you do with the mouse) · กริด (snap rules) · ฉาก (preview / add) · แก้ไข (undo/redo) · ทดสอบ & ส่ง (walk test, push) */
(function () {
  'use strict';
  if (new URLSearchParams(location.search).get('edit') !== '1' || !location.pathname.endsWith('village-town.html')) return;
  const q = (s, r = document) => r.querySelector(s);
  let tries = 0;
  const t = setInterval(() => {
    const tools = q('#townTools'), extra = q('#editorExtraBar');
    if ((!tools || !extra || !q('.gh', tools)) && ++tries < 60) return;
    clearInterval(t);
    if (!tools) return;
    build(tools, extra);
  }, 150);

  function build(tools, extra) {
    const pick = (root, sel) => root ? [...root.querySelectorAll(sel)] : [];
    const modes = pick(tools, '[data-mode]'), ground = pick(tools, 'button').find(b => /วาดพื้น/.test(b.textContent)),
      undo = q('[data-act=undo]', tools), redo = q('[data-act=redo]', tools), test = q('[data-act=test]', tools), push = q('[data-act=push]', tools), gh = q('.gh', tools),
      time = pick(extra, '[data-time]'), npc = q('#npcRoutesBtn'), walk = q('#walkSpeedBtn'), add = q('#addPlaceBtn'), worldb = q('#worldItemsBtn'), gshow = q('#gridShowBtn'), gmode = q('#gridModeBtn'), stack = q('#stackBtn'), addAsset = q('#addAssetBtn'), auto = q('#autoBtn'), fpf = q('#fpFloatBtn'), shp = q('#sharpBtn');
    const groups = [
      ['เครื่องมือ', [...modes, ground]],
      ['กริด', [gshow, gmode, stack]],
      ['ฉาก', [...time, add, 'MORE']],
      ['แก้ไข', [undo, redo]],
      ['ทดสอบ & ส่ง', [test, push, gh]]
    ];
    /* v98.287 · rarely used buttons live in one "⋯ เพิ่มเติม" menu (the buttons are MOVED, handlers stay) */
    function moreButton(items) {
      const wrap = document.createElement('span'), btn = document.createElement('button'), pop = document.createElement('div');
      wrap.className = 'moreWrap'; btn.innerHTML = '<b>⋯</b>เพิ่มเติม'; pop.className = 'morePop'; pop.hidden = true;
      for (const b of items) { b.classList.add('moreItem'); pop.append(b) }
      btn.onclick = e => { e.stopPropagation(); pop.hidden = !pop.hidden };
      document.addEventListener('pointerdown', e => { if (!wrap.contains(e.target)) pop.hidden = true }, true);
      pop.addEventListener('click', () => setTimeout(() => { pop.hidden = true }, 0));
      wrap.append(btn, pop);
      /* buttons other scripts add later (🎨 เพิ่มภาพ Asset, 🪄 ออโต้) are pulled in when they appear */
      let n = 0; const iv = setInterval(() => { for (const id of ['addAssetBtn', 'autoBtn']) { const b = document.getElementById(id); if (b && !pop.contains(b)) { b.classList.add('moreItem'); pop.append(b) } } if (++n > 60) clearInterval(iv) }, 250);
      return wrap;
    }
    const st = document.createElement('style');
    st.textContent = `#townTools{flex-wrap:nowrap;justify-content:center;max-width:calc(100vw - 24px);gap:0;padding:4px 6px 3px;align-items:stretch}
#townTools>i{display:none}
#townTools .grp{display:flex;flex-direction:column;align-items:stretch;padding:0 7px;border-left:1px solid #4d6656}
#townTools .grp:first-child{border-left:0}
#townTools .grp>.row{display:flex;gap:3px;flex:1;align-items:stretch}
#townTools .grp>small{font-size:9.5px;letter-spacing:.06em;color:#9fb19a;text-align:center;margin-top:2px;white-space:nowrap}
#townTools .grp button{min-width:44px;padding:4px 4px;font-size:10.5px;line-height:1.15;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;position:relative;border-radius:8px}
#townTools .grp button b{font-size:16px;line-height:1.1}
#townTools .grp button.compact{min-width:50px}
#editorExtraBar{display:none!important}
#townTools .moreWrap{position:relative;display:flex}
#townTools .morePop{position:absolute;top:100%;right:0;margin-top:6px;z-index:10030;display:flex;flex-direction:column;gap:3px;min-width:190px;padding:6px;background:#1d3028f5;border:1px solid #a5b68a;border-radius:9px;box-shadow:0 8px 24px #0006}
#townTools .morePop[hidden]{display:none}
#townTools .morePop .moreItem{flex-direction:row;justify-content:flex-start;gap:6px;min-width:0;padding:6px 9px;font-size:12px;white-space:nowrap}
@media(max-width:1250px){#townTools{flex-wrap:wrap}}`;
    document.head.append(st);
    tools.querySelectorAll(':scope > i').forEach(i => i.remove());
    for (const [name, btns] of groups) {
      const list = btns.map(b => b === 'MORE' ? moreButton([fpf, shp, npc, walk, addAsset, auto, worldb].filter(Boolean)) : b).filter(Boolean);
      if (!list.length) continue;
      const g = document.createElement('div'), row = document.createElement('div');
      g.className = 'grp'; row.className = 'row';
      for (const b of list) {
        // text-only buttons from the old extra bar: split the leading emoji into an icon line so they match the others
        if (!b.querySelector('b') && /^\S+\s/.test(b.textContent.trim()) && b.closest('#editorExtraBar')) {
          const m = b.textContent.trim().match(/^(\S+)\s+(.*)$/);
          if (m && /\p{Extended_Pictographic}|[▦⧉＋]/u.test(m[1])) { b.dataset.icon = m[1]; }
        }
        row.append(b);
      }
      const cap = document.createElement('small'); cap.textContent = name;
      g.append(row, cap); tools.append(g);
    }
    // old bar's labels change at runtime ("▦ กริด: ปิด"); keep them readable inside the narrower buttons
    tools.querySelectorAll('.grp button').forEach(b => { if (!b.querySelector('b')) b.classList.add('compact') });
    extra?.remove();
  }
})();
