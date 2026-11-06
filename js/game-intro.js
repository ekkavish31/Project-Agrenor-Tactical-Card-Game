/* Illustrated opening. Timeline in milliseconds, paintings remain raster artwork. */
(()=>{'use strict';let active=false;
window.GameIntro={play(title){if(active||!title?.isConnected)return;
const release=()=>window.dispatchEvent(new Event('maker-intro-finished'));
if(matchMedia('(prefers-reduced-motion: reduce)').matches){release();return;}
active=true;const main=title.querySelector('.ts-main'),el=document.createElement('section');el.id='storyIntro';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','การเดินทางเริ่มต้น');
const img=(name,half)=>`background-image:url('assets/intro/story/${name}.png');${half===undefined?'':`background-size:auto 200%;background-repeat:no-repeat;background-position:center ${half?'bottom':'top'};`}`;
const shot=(id,name,half)=>`<div class="si-shot" id="${id}" style="${img(name,half)}"></div>`;
el.innerHTML=shot('si-house','paths-04',1)+shot('si-mother','mother')+shot('si-gift','gift-before')+shot('si-receive','gift-after')+`<div class="si-tunnel"></div>`+Array.from({length:7},(_,i)=>`<div class="si-window" data-path="${i}"><div class="si-paint" style="${img('paths-0'+(Math.floor(i/2)+1),i%2)}"></div></div>`).join('')+shot('si-return','gift-after')+shot('si-door','departure',0)+shot('si-open','departure',1)+`<div class="si-flash"></div><button class="si-skip">ข้าม Intro · Esc</button><span class="si-loading">กำลังเตรียมภาพ…</span><div class="si-progress"><i></i></div>`;
const clock=el.animate([],{duration:41000,fill:'both'});clock.pause();const animations=[clock];let raf=0,ended=false;
main.inert=true;title.classList.add('ag-playing');title.append(el);
function animate(selector,frames,delay,duration){const a=el.querySelector(selector).animate(frames,{delay,duration,fill:'both',easing:'ease-in-out'});a.pause();animations.push(a);}
function shotAnim(id,start,duration,zoom=1.05){animate(id,[{opacity:0,transform:'scale(1)'},{offset:.08,opacity:1},{offset:.9,opacity:1},{opacity:0,transform:`scale(${zoom})`}],start,duration);}
shotAnim('#si-house',0,3000);shotAnim('#si-mother',2500,4500);shotAnim('#si-gift',6500,2600);
animate('#si-receive',[{transform:'scale(1)',opacity:0},{offset:.12,opacity:1,transform:'scale(1.01)'},{offset:.65,opacity:1,transform:'scale(1.08)'},{opacity:0,transform:'scale(4.5)'}],8000,4500);
animate('.si-tunnel',[{opacity:0,transform:'scale(.8) rotate(-3deg)'},{offset:.05,opacity:1},{offset:.95,opacity:1},{opacity:0,transform:'scale(1.4) rotate(3deg)'}],11000,22500);
for(let i=0;i<7;i++){animate(`[data-path="${i}"]`,[{opacity:0,transform:'translate3d(-10%,4%,-800px) rotateY(-18deg) scale(.45)'},{offset:.18,opacity:1,transform:'translate3d(0,0,0) rotateY(0) scale(.97)'},{offset:.76,opacity:1,transform:'translate3d(0,0,0) rotateY(0) scale(1.02)'},{opacity:0,transform:'translate3d(40%,-3%,400px) rotateY(15deg) scale(1.4)'}],11500+i*3000,3300);}
shotAnim('#si-return',32500,3000,1.02);shotAnim('#si-door',35000,2800,1.05);shotAnim('#si-open',37200,2500,1.12);
animate('.si-flash',[{opacity:0},{offset:.45,opacity:1},{opacity:0}],38700,2300);
const finish=()=>{if(ended)return;ended=true;active=false;cancelAnimationFrame(raf);animations.forEach(a=>a.cancel());el.remove();main.inert=false;title.classList.remove('ag-playing');document.removeEventListener('visibilitychange',visibility);release();(main.querySelector('[data-act="continue"]:not([disabled])')||main.querySelector('[data-act="new"]'))?.focus({preventScroll:true});};
el.querySelector('.si-skip').onclick=finish;el.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();finish()}if(e.key==='Tab'){e.preventDefault();el.querySelector('button').focus()}});el.querySelector('button').focus();
function visibility(){if(document.hidden){animations.forEach(a=>a.pause());}else{animations.forEach(a=>{if(a.playState!=='finished')a.play()})}}document.addEventListener('visibilitychange',visibility);
function tick(){if(ended)return;const t=Number(animations[0]?.currentTime)||0;el.querySelector('.si-progress i').style.transform=`scaleX(${Math.min(1,t/41000)})`;if(t>=41000||!title.isConnected)finish();else raf=requestAnimationFrame(tick);}
const urls=['paths-01','paths-02','paths-03','paths-04','departure','mother','gift-before','gift-after'];
Promise.all(urls.map(n=>new Promise(resolve=>{const im=new Image();im.onload=im.onerror=resolve;im.src='assets/intro/story/'+n+'.png'}))).then(async()=>{await Promise.all(animations.map(a=>a.ready));if(ended)return;el.querySelector('.si-loading').remove();const origin=document.timeline.currentTime;animations.forEach(a=>{a.currentTime=0;a.play();a.startTime=origin});raf=requestAnimationFrame(tick);});
}};})();
