/* v98.751 · PLAY GUARD — while PLAYING, the browser must not get in the way: no text highlight (so no Edge / Chrome "copy · search · Copilot" bubble over the dialogue), no right-click menu, no long-press callout.
   Not active in the editors: ?edit=1 / ?studio=… pages, and any game page shown inside editor.html (the creator still selects and copies there).
   Typing fields (input · textarea · select · contenteditable) and anything marked class="pg-select" stay selectable. Include it in the <head> of every play page. */
(function () {
  'use strict';
  try {
    const q = new URLSearchParams(location.search);
    if (q.get('edit') === '1' || q.has('studio')) return;
    try { if (top !== window && /editor\.html/.test(top.location.pathname)) return } catch (e) { }
    const OK = 'input,textarea,select,[contenteditable="true"],[contenteditable=""],.pg-select';
    const st = document.createElement('style'); st.id = 'playGuardCss';
    st.textContent = 'html.pg-on,html.pg-on *{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}'
      + 'html.pg-on input,html.pg-on textarea,html.pg-on [contenteditable="true"],html.pg-on .pg-select,html.pg-on .pg-select *{-webkit-user-select:text;user-select:text}';
    (document.head || document.documentElement).appendChild(st);
    document.documentElement.classList.add('pg-on');
    const okTarget = t => { const e = t && t.nodeType === 1 ? t : t && t.parentElement; return !!(e && e.closest && e.closest(OK)) };
    addEventListener('selectstart', e => { if (!okTarget(e.target)) e.preventDefault() }, true);   /* the highlight itself (also stops a double-click select) */
    addEventListener('contextmenu', e => { if (!okTarget(e.target)) e.preventDefault() }, true);   /* the right-click menu */
  } catch (e) { }
})();
