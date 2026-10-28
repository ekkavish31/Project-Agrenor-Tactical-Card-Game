/* Version shown on the title screen.
   Major release: increment the main number (v80 → v81).
   Small patch (⬆ Push from an editor): increment the suffix counter (v81.13 → v81.14; treat it as a sequence, not a decimal).
   The commit message starts with the same version. Editor pushes bump the suffix automatically. */
window.GAME_VERSION={v:'v94.01',date:'2026-10-28',repo:'ekkavish31/Project-Agrenor-Tactical-Card-Game'};
/* v91.94 · asset cache (sw.js): reloads reuse the ~60 MB of map images; a new version fetches them once; Ctrl+F5 refreshes the stored copies */
try{if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol))navigator.serviceWorker.register('sw.js?v='+encodeURIComponent(window.GAME_VERSION.v)).catch(()=>{})}catch(e){}
