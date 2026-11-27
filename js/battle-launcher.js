/* v98.1146 · BattleLauncher — the ONE place that opens a card battle in a frame over the current page (TODO §42 A/B).
   Before, five entry points (story quests, camp raid, world-map fights, the inn duel, the training ground) each did it their own way: only the quest fights had the
   encounter cut + waited for the arena, the duel / training frames popped in empty, and the duel forgot the hero's level / weapon.
   BattleLauncher.cut() → {open(), drop()}   the zoom + black bars ("ENCOUNTER!") that hide the page while the arena loads behind them
   BattleLauncher.ready(frame) → Promise       resolves when the frame says 'agrenor-battle-ready' (or after 20 s)
   BattleLauncher.heroQuery(g) → '&lv=…'       level / weapon / stats of the hero (Progression.battleParam), '' when unavailable
   BattleLauncher.mount(frame, {id}) → Promise append the frame under the encounter cut and open it when the arena is ready (frames of fights that had no cover before) */
(function (root) {
  'use strict';
  if (root.BattleLauncher) return;
  function cut(){
   if(!document.getElementById('qbCutCss')){const c=document.createElement('style');c.id='qbCutCss';c.textContent=`#qbCut{position:fixed;inset:0;z-index:960;pointer-events:all;overflow:hidden}#qbCut i{position:absolute;left:-12%;width:124%;height:10.2%;background:#05070b;transform:translateX(-112%) skewX(-18deg);transition:transform .42s cubic-bezier(.7,0,.25,1)}#qbCut i:nth-child(even){transform:translateX(112%) skewX(-18deg)}#qbCut.on i{transform:translateX(0) skewX(-18deg)}#qbCut.out i{transform:translateX(-112%) skewX(-18deg);transition-duration:.5s}#qbCut.out i:nth-child(even){transform:translateX(112%) skewX(-18deg)}#qbCut b{position:absolute;inset:0;background:radial-gradient(circle,#fff 0,#fff0 62%);opacity:0;transition:opacity .22s}#qbCut.flash b{opacity:.85}#qbCut u{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(2.4);opacity:0;font:italic 900 56px AgThai,system-ui,sans-serif;letter-spacing:.14em;color:#fff3b0;text-decoration:none;text-shadow:0 0 22px #ff6a1f;transition:all .35s .3s cubic-bezier(.2,1.5,.4,1)}#qbCut.on u{opacity:1;transform:translate(-50%,-50%) scale(1)}#qbCut.out u{opacity:0;transition:opacity .2s}.qb-zoom{transition:transform .5s cubic-bezier(.5,0,.9,.4),filter .5s!important;transform:scale(1.28)!important;filter:blur(5px) brightness(1.3)!important}`;document.head.append(c)}
   const el=document.createElement('div');el.id='qbCut';el.innerHTML='<b></b>'+Array.from({length:10},(_,k)=>`<i style="top:${k*10}%"></i>`).join('')+'<u>ENCOUNTER!</u>';document.body.append(el);
   const town=document.getElementById('villageTownLayer');town?.classList.add('qb-zoom');
   requestAnimationFrame(()=>requestAnimationFrame(()=>{el.classList.add('flash');setTimeout(()=>{el.classList.remove('flash');el.classList.add('on')},120)}));
   const t0=performance.now();
   return {open:()=>new Promise(res=>{const wait=Math.max(0,1050-(performance.now()-t0));setTimeout(()=>{town?.classList.remove('qb-zoom');el.classList.add('out');setTimeout(()=>{el.remove();res()},560)},wait)}),drop:()=>{town?.classList.remove('qb-zoom');el.remove()}}}
  function battleReady(fr){return new Promise(res=>{const on=e=>{if(e.source===fr.contentWindow&&e.data?.type==='agrenor-battle-ready'){removeEventListener('message',on);res()}};addEventListener('message',on);setTimeout(res,20000)})}
  function heroQuery(g) { try { return root.Progression && g ? '&' + root.Progression.battleParam(g, root.Progression.recipes) : '' } catch (e) { return '' } }
  async function mount(fr, o) {
    o = o || {}; const c = cut(); try { root.VictoryScreen?.fightUI?.(true) } catch (e) { }
    document.body.appendChild(fr); await battleReady(fr); await c.open(); return fr;
  }
  root.BattleLauncher = { cut: cut, ready: battleReady, heroQuery, mount };
})(globalThis);
