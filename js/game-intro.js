/* Illustrated opening. Timeline in milliseconds, paintings remain raster artwork. */
(()=>{'use strict';let active=false;
window.GameIntro={play(title){if(active||!title?.isConnected)return;
const release=()=>window.dispatchEvent(new Event('maker-intro-finished'));
if(matchMedia('(prefers-reduced-motion: reduce)').matches){release();return;}
active=true;const main=title.querySelector('.ts-main'),el=document.createElement('section');el.id='storyIntro';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','การเดินทางเริ่มต้น');
const img=(name,half)=>`background-image:url('assets/intro/story/${name}.png');${half===undefined?'':`background-size:auto 200%;background-repeat:no-repeat;background-position:center ${half?'bottom':'top'};`}`;
const shot=(id,name,half)=>`<div class="si-shot" id="${id}" style="${img(name,half)}"></div>`;
el.innerHTML=shot('si-house','paths-04',1)+shot('si-mother','mother')+shot('si-gift','gift-before')+`<div class="si-tunnel"><div class="si-painted-world"></div></div>`+Array.from({length:7},(_,i)=>`<div class="si-window" data-path="${i}"><div class="si-paint" style="${img('paths-0'+(Math.floor(i/2)+1),i%2)}"></div></div>`).join('')+shot('si-return','gift-before')+shot('si-door','departure',0)+shot('si-open','departure',1)+`<div class="si-warp"></div><div class="si-decklight"></div><div class="si-flash"></div><button class="si-sound" aria-pressed="false">เสียง: ปิด</button><button class="si-skip">ข้าม Intro · Esc</button><span class="si-loading">กำลังเตรียมภาพ…</span><div class="si-progress"><i></i></div>`;
const clock=el.animate([],{duration:36300,fill:'both'});clock.pause();const animations=[clock];let raf=0,ended=false;
main.inert=true;title.classList.add('ag-playing');title.append(el);
function animate(selector,frames,delay,duration,easing='ease-in-out'){const a=el.querySelector(selector).animate(frames,{delay,duration,fill:'both',easing});a.pause();animations.push(a);}
function shotAnim(id,start,duration,zoom=1.05){animate(id,[{opacity:0,transform:'scale(1)'},{offset:.08,opacity:1},{offset:.9,opacity:1},{opacity:0,transform:`scale(${zoom})`}],start,duration);}
shotAnim('#si-house',0,3000);shotAnim('#si-mother',2500,4500);
animate('#si-gift',[{transform:'scale(1)',opacity:0},{offset:.12,opacity:1,transform:'scale(1.01)'},{offset:.65,opacity:1,transform:'scale(1.08)'},{opacity:0,transform:'scale(4.5)'}],6500,6000);
// Approved tunnel study compressed uniformly from 26 to 20 seconds.
const tunnelStart=10800, speed=20/26;
const tunnelTime=t=>tunnelStart+t*speed;
animate('.si-tunnel',[{opacity:0},{offset:.03,opacity:1},{offset:.88,opacity:1},{opacity:0}],tunnelStart,20000,'linear');
animate('.si-painted-world',[{transform:'scale(1)'},{offset:.88,transform:'scale(1.65)'},{transform:'scale(2.8)'}],tunnelStart,23000*speed,'linear');
const routes=[[-76,28,-5],[-39,42,4],[-80,-8,-3],[-41,15,3],[-71,40,-4],[-53,-3,1],[-55,27,-2]];
for(let i=0;i<7;i++){
 const [x,y,r]=routes[i];
 const pose=(dx,dy,scale,angle)=>`translate(-50%,-50%) translate(${dx}%,${dy}%) scale(${scale}) rotate(${angle}deg)`;
 animate(`[data-path="${i}"]`,[
 {opacity:0,transform:pose(0,0,.015,0)},
 {offset:.1,opacity:.8,transform:pose(x*.18,y*.18,.15,r)},
 {offset:.32,opacity:1,transform:pose(x,y,1,r),easing:'ease-out'},
 {offset:.78,opacity:1,transform:pose(x-2,y+1,1.025,r*.6),easing:'ease-in'},
 {opacity:0,transform:pose(x*1.8,y*1.8,1.6,r*2)}
 ],tunnelTime(600+i*3000),3400*speed,'linear');
}
animate('.si-warp',[{opacity:0},{offset:.4,opacity:1},{offset:.55,opacity:1},{opacity:0}],tunnelTime(22200),1200*speed,'linear');
animate('#si-return',[{opacity:0,transform:'scale(4.2)'},{offset:.08,opacity:1,transform:'scale(4.2)'},{offset:.8,opacity:1,transform:'scale(1.3)'},{opacity:1,transform:'scale(1.25)'}],tunnelTime(22700),3300*speed,'linear');
animate('.si-decklight',[{opacity:0,transform:'scale(.2)'},{offset:.35,opacity:.7},{opacity:0,transform:'scale(3)'}],10300,1800);
shotAnim('#si-door',30300,2800,1.05);shotAnim('#si-open',32500,2500,1.12);
animate('.si-flash',[{opacity:0,transform:'scale(.03)'},{offset:.45,opacity:1,transform:'scale(3.2)'},{offset:.65,opacity:1,transform:'scale(3.2)'},{opacity:0,transform:'scale(3.2)'}],34000,2300);
const finish=()=>{if(ended)return;ended=true;active=false;cancelAnimationFrame(raf);animations.forEach(a=>a.cancel());el.remove();soundContext?.close().catch(()=>{});main.inert=false;title.classList.remove('ag-playing');document.removeEventListener('visibilitychange',visibility);release();(main.querySelector('[data-act="continue"]:not([disabled])')||main.querySelector('[data-act="new"]'))?.focus({preventScroll:true});};
let soundContext=null,sound=false,lastCue=-1;
const soundButton=el.querySelector('.si-sound');
soundButton.onclick=async()=>{try{soundContext ||= new (window.AudioContext||window.webkitAudioContext)();sound=!sound;if(sound)await soundContext.resume();else await soundContext.suspend();soundButton.textContent='เสียง: '+(sound?'เปิด':'ปิด');soundButton.setAttribute('aria-pressed',String(sound));}catch{sound=false;soundButton.textContent='เสียงไม่พร้อม';}};
function cue(i){if(!sound||soundContext?.state!=='running')return;const t=soundContext.currentTime,osc=soundContext.createOscillator(),g=soundContext.createGain(),pan=soundContext.createStereoPanner();osc.type='sine';osc.frequency.setValueAtTime(i===6?82:220*Math.pow(2,i/12),t);osc.frequency.exponentialRampToValueAtTime(i===6?50:110,t+.6);pan.pan.setValueAtTime(i%2?.7:-.7,t);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.035,t+.08);g.gain.exponentialRampToValueAtTime(.0001,t+.8);osc.connect(g).connect(pan).connect(soundContext.destination);osc.start(t);osc.stop(t+.85);}
el.querySelector('.si-skip').onclick=finish;el.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();finish()}if(e.key==='Tab'){e.preventDefault();el.querySelector('.si-skip').focus()}});el.querySelector('.si-skip').focus();
function visibility(){if(document.hidden){animations.forEach(a=>a.pause());}else{animations.forEach(a=>{if(a.playState!=='finished')a.play()})}}document.addEventListener('visibilitychange',visibility);
function tick(){if(ended)return;const t=Number(animations[0]?.currentTime)||0;if(t>=35200)el.classList.add('si-menu-reveal');else el.classList.remove('si-menu-reveal');const which=t<tunnelTime(600)?-1:Math.min(6,Math.floor((t-tunnelTime(600))/(3000*speed)));if(which!==lastCue){lastCue=which;if(which>=0){cue(which);}}el.querySelector('.si-progress i').style.transform=`scaleX(${Math.min(1,t/36300)})`;if(t>=36300||!title.isConnected)finish();else raf=requestAnimationFrame(tick);}
const urls=['paths-01','paths-02','paths-03','paths-04','departure','mother','gift-before'];
urls.push('../studies/painted-tunnel');
Promise.all(urls.map(n=>new Promise(resolve=>{const im=new Image();im.onload=im.onerror=resolve;im.src='assets/intro/story/'+n+'.png'}))).then(async()=>{await Promise.all(animations.map(a=>a.ready));if(ended)return;el.querySelector('.si-loading').remove();const origin=document.timeline.currentTime;animations.forEach(a=>{a.currentTime=0;a.play();a.startTime=origin});raf=requestAnimationFrame(tick);});
}};})();
