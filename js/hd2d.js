/* v72 · HD-2D look (Octopath-style) laid over a game canvas — no new art needed.
   • tilt-shift: top and bottom of the view are softly blurred (CSS backdrop-filter, GPU) so the scene reads as a diorama
   • bloom: bright pixels glow (a ¼-size blurred copy added back with 'screen'); village canvas + battle canvas
   • light rays: slow diagonal sun shafts from the top-left; dust: a few motes drifting in the light
   • battle vignette (the village grade already has one)
   Settings: localStorage 'projectA.hd2d' = {tilt,bloom,rays,dust}; toggles in the village ⚙ panel and battle settings.
   HD2D.attach(canvas,{battle}) adds the overlay right after the canvas; HD2D.bloom(ctx,canvas) runs at the end of a frame. */
(function(root){'use strict';
const KEY='projectA.hd2d',DEF={tilt:true,bloom:true,rays:true,dust:true};
let opt={...DEF};try{Object.assign(opt,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
const overlays=new Set();
const css=document.createElement('style');css.textContent=`
.hd2d{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.hd2d .tilt{position:absolute;left:0;right:0;-webkit-backdrop-filter:blur(var(--b,3px));backdrop-filter:blur(var(--b,3px))}
.hd2d .tilt.top{top:0;height:30%;-webkit-mask-image:linear-gradient(#000 0%,rgba(0,0,0,.6) 45%,transparent 100%);mask-image:linear-gradient(#000 0%,rgba(0,0,0,.6) 45%,transparent 100%)}
.hd2d .tilt.bottom{bottom:0;height:24%;-webkit-mask-image:linear-gradient(transparent 0%,rgba(0,0,0,.6) 55%,#000 100%);mask-image:linear-gradient(transparent 0%,rgba(0,0,0,.6) 55%,#000 100%)}
.hd2d .rays{position:absolute;inset:-20%;mix-blend-mode:screen;opacity:.5;background:repeating-linear-gradient(115deg,rgba(255,226,168,0) 0 70px,rgba(255,226,168,.10) 110px,rgba(255,226,168,0) 170px,rgba(255,226,168,0) 260px);
 -webkit-mask-image:radial-gradient(ellipse 70% 60% at 18% 8%,#000,transparent 75%);mask-image:radial-gradient(ellipse 70% 60% at 18% 8%,#000,transparent 75%);animation:hd2dRays 14s ease-in-out infinite alternate}
@keyframes hd2dRays{from{transform:translateX(-30px);opacity:.38}to{transform:translateX(30px);opacity:.58}}
.hd2d .vig{position:absolute;inset:0;background:radial-gradient(ellipse 75% 70% at 50% 48%,transparent 55%,rgba(12,10,8,.5) 100%)}
.hd2d i{position:absolute;width:3px;height:3px;border-radius:50%;background:#fff3cf;box-shadow:0 0 6px 2px rgba(255,236,180,.55);opacity:0;animation:hd2dMote linear infinite}
@keyframes hd2dMote{0%{opacity:0;transform:translate(0,0)}15%{opacity:.8}85%{opacity:.6}100%{opacity:0;transform:translate(60px,-90px)}}
.hd2dOpts{display:flex;flex-wrap:wrap;gap:4px 10px;font-size:13px;margin:4px 0 8px}.hd2dOpts b{width:100%;font-weight:600}.hd2dOpts label{display:flex;gap:4px;align-items:center}`;
document.head.appendChild(css);
function build(el,battle){el.innerHTML='';if(opt.rays&&!battle)el.insertAdjacentHTML('beforeend','<div class="rays"></div>');if(battle)el.insertAdjacentHTML('beforeend','<div class="vig"></div>');
 if(opt.tilt&&!battle)el.insertAdjacentHTML('beforeend',`<div class="tilt top" style="--b:${battle?2.5:3.5}px"></div><div class="tilt bottom" style="--b:${battle?2:3}px"></div>`);
 if(opt.dust)for(let k=0;k<22;k++){const m=document.createElement('i');m.style.left=(Math.random()*70)+'%';m.style.top=(15+Math.random()*75)+'%';m.style.animationDuration=(9+Math.random()*10)+'s';m.style.animationDelay=(-Math.random()*18)+'s';m.style.transform=`scale(${.6+Math.random()*.8})`;el.appendChild(m)}}
function attach(canvas,o={}){if(!canvas||canvas._hd2dOverlay)return;canvas._hd2dOverlay=true;const el=document.createElement('div');el.className='hd2d';el.dataset.battle=o.battle?'1':'';canvas.after(el);overlays.add(el);build(el,o.battle);return el}
// bloom: ¼-size copy, keep only bright parts, blur, add back with 'screen'
let small=null;
let bloomAt=0,bloomCost=0,bloomFor=null;
function bloom(ctx,canvas,strength=.32,force=false){if(!opt.bloom||!canvas.width)return;const w=Math.max(1,canvas.width>>2),h=Math.max(1,canvas.height>>2);if(!small){small=document.createElement('canvas')}const resized=small.width!==w||small.height!==h;if(resized){small.width=w;small.height=h}
 /* v98.13 · the glow is a soft blur: rebuild it at most every max(140 ms, 6× its own cost), and just re-draw the last one in between */
 const now=performance.now();if(force||resized||canvas!==bloomFor||!bloomAt||now-bloomAt>Math.max(140,bloomCost*6)){bloomFor=canvas;const q=small.getContext('2d');q.globalCompositeOperation='copy';q.filter='brightness(.75) contrast(2.6) saturate(1.2) blur(2px)';q.drawImage(canvas,0,0,w,h);q.filter='none';q.globalCompositeOperation='source-over';bloomAt=performance.now();bloomCost=bloomAt-now}

 ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='screen';ctx.globalAlpha=strength;ctx.imageSmoothingEnabled=true;ctx.drawImage(small,0,0,canvas.width,canvas.height);ctx.restore()}
function set(k,v){opt[k]=!!v;try{localStorage.setItem(KEY,JSON.stringify(opt))}catch(e){}overlays.forEach(el=>build(el,el.dataset.battle==='1'));document.querySelectorAll('.hd2dOpts input').forEach(i=>i.checked=!!opt[i.dataset.k])}
function controls(){const d=document.createElement('div');d.className='hd2dOpts';d.innerHTML='<b>สไตล์ HD-2D</b>'+[['tilt','เบลอบน-ล่าง'],['bloom','แสงฟุ้ง'],['rays','ลำแสง'],['dust','ฝุ่นในแสง']].map(([k,t])=>`<label><input type="checkbox" data-k="${k}" ${opt[k]?'checked':''}>${t}</label>`).join('');d.onchange=e=>{const i=e.target.closest('input');if(i)set(i.dataset.k,i.checked)};return d}
root.addEventListener('storage',e=>{if(e.key===KEY){try{opt={...DEF,...JSON.parse(e.newValue||'{}')}}catch(x){}overlays.forEach(el=>build(el,el.dataset.battle==='1'))}});
// battle: overlay on #battleCanvas and toggles in the battle settings dialog
// battle bloom: runs right after a frame the battle actually drew (its clearRect marks the frame)
function gradeBattle(ctx,c){const k=root.GameMood?root.GameMood.level():.6;if(!k)return;const W=c.width,H=c.height,mix=(a)=>`rgb(${a.map(x=>Math.round(255-(255-x)*k)).join(',')})`;ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='multiply';let gr=ctx.createLinearGradient(0,0,W,H);gr.addColorStop(0,mix([255,242,222]));gr.addColorStop(1,mix([196,186,190]));ctx.fillStyle=gr;ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='soft-light';ctx.fillStyle=`rgba(255,170,96,${.16*k})`;ctx.fillRect(0,0,W,H);ctx.restore()}
function hookBattle(c){if(c._hd2d)return;c._hd2d=true;attach(c,{battle:true});const ctx=c.getContext('2d'),clear=ctx.clearRect.bind(ctx);let fresh=false;ctx.clearRect=(...a)=>{fresh=true;return clear(...a)};
 const loop=()=>{if(fresh&&document.body.contains(c)&&c.offsetParent){fresh=false;try{gradeBattle(ctx,c);bloom(ctx,c,.26,true)}catch(e){}}requestAnimationFrame(loop)};requestAnimationFrame(loop)}
new MutationObserver(()=>{const c=document.getElementById('battleCanvas');if(c&&!c._hd2d)hookBattle(c);const b=document.querySelector('select[data-setting="backdrop"]'),l=b?.closest('label');if(l?.parentNode&&!l.parentNode.querySelector('.hd2dOpts'))l.parentNode.appendChild(controls())}).observe(document.documentElement,{childList:true,subtree:true});
root.HD2D={attach,bloom,set,controls,options:()=>({...opt})};
})(globalThis);
