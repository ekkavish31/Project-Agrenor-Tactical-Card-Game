/* Illustrated opening. Timeline in milliseconds, paintings remain raster artwork. */
(()=>{'use strict';let active=false;
window.GameIntro={play(title){if(active||!title?.isConnected)return;
const release=()=>window.dispatchEvent(new Event('maker-intro-finished'));
if(matchMedia('(prefers-reduced-motion: reduce)').matches){release();return;}
active=true;const main=title.querySelector('.ts-main'),el=document.createElement('section');el.id='storyIntro';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','การเดินทางเริ่มต้น');
const img=(name,half)=>`background-image:url('assets/intro/story/${name}.png');${half===undefined?'':`background-size:auto 200%;background-repeat:no-repeat;background-position:center ${half?'bottom':'top'};`}`;
const shot=(id,name,half)=>`<div class="si-shot" id="${id}" style="${img(name,half)}"></div>`;
el.innerHTML=shot('si-house','paths-04',1)+shot('si-mother','mother')+shot('si-gift','gift-before')+shot('si-receive','gift-after')+`<div class="si-tunnel"><div class="si-vanishing"></div><div class="si-stream"></div><div class="si-fog"></div>${Array.from({length:12},(_,j)=>`<div class="si-depth" data-depth="${j}" style="--lane:${j%2?-1:1};${img('paths-0'+(j%4+1),j%2)}"></div>`).join('')}${Array.from({length:18},(_,j)=>`<i class="si-spark" data-spark="${j}" style="left:${(j*37)%100}%;top:${(j*23)%100}%"></i>`).join('')}</div>`+Array.from({length:7},(_,i)=>`<div class="si-window" data-path="${i}"><div class="si-paint" style="${img('paths-0'+(Math.floor(i/2)+1),i%2)}"></div></div>`).join('')+Array.from({length:7},(_,i)=>`<div class="si-return-card" data-return="${i}" style="${img('paths-0'+(Math.floor(i/2)+1),i%2)}"></div>`).join('')+shot('si-return','gift-after')+shot('si-door','departure',0)+shot('si-open','departure',1)+`<div class="si-decklight"></div><div class="si-flash"></div><button class="si-sound" aria-pressed="false">เสียง: ปิด</button><button class="si-skip">ข้าม Intro · Esc</button><span class="si-loading">กำลังเตรียมภาพ…</span><div class="si-progress"><i></i></div>`;
const clock=el.animate([],{duration:41000,fill:'both'});clock.pause();const animations=[clock];let raf=0,ended=false;
main.inert=true;title.classList.add('ag-playing');title.append(el);
function animate(selector,frames,delay,duration){const a=el.querySelector(selector).animate(frames,{delay,duration,fill:'both',easing:'ease-in-out'});a.pause();animations.push(a);}
function shotAnim(id,start,duration,zoom=1.05){animate(id,[{opacity:0,transform:'scale(1)'},{offset:.08,opacity:1},{offset:.9,opacity:1},{opacity:0,transform:`scale(${zoom})`}],start,duration);}
shotAnim('#si-house',0,3000);shotAnim('#si-mother',2500,4500);shotAnim('#si-gift',6500,2600);
animate('#si-receive',[{transform:'scale(1)',opacity:0},{offset:.12,opacity:1,transform:'scale(1.01)'},{offset:.65,opacity:1,transform:'scale(1.08)'},{opacity:0,transform:'scale(4.5)'}],8000,4500);
animate('.si-tunnel',[{opacity:0},{offset:.04,opacity:1},{offset:.94,opacity:1},{opacity:0}],10800,23300);
animate('.si-stream',[{transform:'translate(-4%,2%) scale(.8) rotate(-8deg)'},{transform:'translate(5%,-3%) scale(1.4) rotate(9deg)'}],10800,23300);
animate('.si-fog',[{transform:'translate(-8%,4%) scale(1)'},{transform:'translate(8%,-4%) scale(1.25)'}],10800,23300);
for(let j=0;j<12;j++){const side=j%2?1:-1,x=side*(28+(j%3)*14),y=(j%4-1.5)*19;animate(`[data-depth="${j}"]`,[{opacity:0,transform:`translate3d(${side*8}vw,${y*.2}vh,-1300px) rotateY(${side*40}deg) scale(.15)`},{offset:.2,opacity:.38},{offset:.75,opacity:.55},{opacity:0,transform:`translate3d(${x}vw,${y}vh,350px) rotateY(${side*-35}deg) scale(.9)`}],11000+j*1450,5500);}
for(let j=0;j<18;j++)animate(`[data-spark="${j}"]`,[{opacity:0,transform:'scale(.2)'},{offset:.25,opacity:.75},{opacity:0,transform:`translate(${(j%2?1:-1)*240}px,${(j%3-1)*180}px) scale(1.4)`}],11000+(j%7)*2800,2900);
const routes=[
 ['translate3d(-55%,35%,-700px) rotateY(-30deg) rotateZ(-9deg)','translate3d(-5%,5%,0) rotateY(-3deg) rotateZ(-2deg)','translate3d(65%,-12%,450px) rotateY(24deg) rotateZ(6deg)'],
 ['translate3d(58%,-8%,-1100px) rotateY(38deg) rotateZ(7deg)','translate3d(5%,-3%,0) rotateY(3deg) rotateZ(1deg)','translate3d(-70%,12%,420px) rotateY(-25deg) rotateZ(-7deg)'],
 ['translate3d(0,-65%,-1000px) rotateX(24deg)','translate3d(0,-5%,0) rotateX(0deg)','translate3d(-20%,55%,450px) rotateX(-15deg)'],
 ['translate3d(-80%,5%,-500px) rotateY(-65deg)','translate3d(-3%,2%,0) rotateY(-4deg)','translate3d(75%,0,500px) rotateY(30deg)'],
 ['translate3d(35%,35%,-1500px) rotateY(25deg) rotateZ(-5deg)','translate3d(4%,4%,0) rotateY(2deg)','translate3d(-45%,-25%,400px) rotateY(-18deg)'],
 ['translate3d(0,-5%,-1100px) scale(.6)','translate3d(0,0,0) scale(1.02)','translate3d(0,0,150px) scale(1.25)'],
 ['translate3d(0,0,-1800px) scale(.3)','translate3d(0,0,0) scale(1.04)','translate3d(0,0,-1900px) scale(.05)']
];
const colors=['#c89a43','#e3a463','#9c80c9','#b05640','#377e9f','#ffdf9b','#bd5636'];
for(let i=0;i<7;i++){const node=el.querySelector(`[data-path="${i}"]`);node.style.setProperty('--scene-glow',colors[i]);animate(`[data-path="${i}"]`,[{opacity:0,transform:routes[i][0],filter:'brightness(.55)'},{offset:.2,opacity:1,transform:routes[i][1],filter:'brightness(1)'},{offset:.74,opacity:1,transform:routes[i][1]+' scale(1.025)',filter:'brightness(1)'},{opacity:0,transform:routes[i][2],filter:'brightness(.8)'}],11500+i*3000,3300);}
animate('.si-decklight',[{opacity:0,transform:'scale(.2)'},{offset:.35,opacity:.7},{opacity:0,transform:'scale(3)'}],10300,1800);
for(let i=0;i<7;i++)animate(`[data-return="${i}"]`,[{opacity:0,transform:`translate(${(i-3)*14}vw,${(i%3-1)*22}vh) rotate(${(i-3)*11}deg) scale(.9)`},{offset:.18,opacity:.75},{offset:.8,opacity:.8},{opacity:0,transform:'translate(0,0) rotate(0deg) scale(.06)'}],31900+i*90,1700);
shotAnim('#si-return',32800,2700,1.02);shotAnim('#si-door',35000,2800,1.05);shotAnim('#si-open',37200,2500,1.12);
animate('.si-flash',[{opacity:0},{offset:.45,opacity:1},{opacity:0}],38700,2300);
const finish=()=>{if(ended)return;ended=true;active=false;cancelAnimationFrame(raf);animations.forEach(a=>a.cancel());el.remove();soundContext?.close().catch(()=>{});main.inert=false;title.classList.remove('ag-playing');document.removeEventListener('visibilitychange',visibility);release();(main.querySelector('[data-act="continue"]:not([disabled])')||main.querySelector('[data-act="new"]'))?.focus({preventScroll:true});};
let soundContext=null,sound=false,lastCue=-1;
const soundButton=el.querySelector('.si-sound');
soundButton.onclick=async()=>{try{soundContext ||= new (window.AudioContext||window.webkitAudioContext)();sound=!sound;if(sound)await soundContext.resume();else await soundContext.suspend();soundButton.textContent='เสียง: '+(sound?'เปิด':'ปิด');soundButton.setAttribute('aria-pressed',String(sound));}catch{sound=false;soundButton.textContent='เสียงไม่พร้อม';}};
function cue(i){if(!sound||soundContext?.state!=='running')return;const t=soundContext.currentTime,osc=soundContext.createOscillator(),g=soundContext.createGain(),pan=soundContext.createStereoPanner();osc.type='sine';osc.frequency.setValueAtTime(i===6?82:220*Math.pow(2,i/12),t);osc.frequency.exponentialRampToValueAtTime(i===6?50:110,t+.6);pan.pan.setValueAtTime(i%2?.7:-.7,t);g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.035,t+.08);g.gain.exponentialRampToValueAtTime(.0001,t+.8);osc.connect(g).connect(pan).connect(soundContext.destination);osc.start(t);osc.stop(t+.85);}
el.querySelector('.si-skip').onclick=finish;el.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();finish()}if(e.key==='Tab'){e.preventDefault();el.querySelector('.si-skip').focus()}});el.querySelector('.si-skip').focus();
function visibility(){if(document.hidden){animations.forEach(a=>a.pause());}else{animations.forEach(a=>{if(a.playState!=='finished')a.play()})}}document.addEventListener('visibilitychange',visibility);
function tick(){if(ended)return;const t=Number(animations[0]?.currentTime)||0;const which=t<11500?-1:Math.min(6,Math.floor((t-11500)/3000));if(which!==lastCue){lastCue=which;if(which>=0){el.style.setProperty('--tunnel-tint',colors[which]);cue(which);}}el.querySelector('.si-progress i').style.transform=`scaleX(${Math.min(1,t/41000)})`;if(t>=41000||!title.isConnected)finish();else raf=requestAnimationFrame(tick);}
const urls=['paths-01','paths-02','paths-03','paths-04','departure','mother','gift-before','gift-after'];
Promise.all(urls.map(n=>new Promise(resolve=>{const im=new Image();im.onload=im.onerror=resolve;im.src='assets/intro/story/'+n+'.png'}))).then(async()=>{await Promise.all(animations.map(a=>a.ready));if(ended)return;el.querySelector('.si-loading').remove();const origin=document.timeline.currentTime;animations.forEach(a=>{a.currentTime=0;a.play();a.startTime=origin});raf=requestAnimationFrame(tick);});
}};})();
