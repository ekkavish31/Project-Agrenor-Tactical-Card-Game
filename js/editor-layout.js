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
      time = pick(extra, '[data-time]'), npc = q('#npcRoutesBtn'), add = q('#addPlaceBtn'), gshow = q('#gridShowBtn'), gmode = q('#gridModeBtn'), stack = q('#stackBtn');
    const groups = [
      ['เครื่องมือ', [...modes, ground]],
      ['กริด', [gshow, gmode, stack]],
      ['ฉาก', [...time, npc, add]],
      ['แก้ไข', [undo, redo]],
      ['ทดสอบ & ส่ง', [test, push, gh]]
    ];
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
@media(max-width:1250px){#townTools{flex-wrap:wrap}}`;
    document.head.append(st);
    tools.querySelectorAll(':scope > i').forEach(i => i.remove());
    for (const [name, btns] of groups) {
      const list = btns.filter(Boolean);
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
