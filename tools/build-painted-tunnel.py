from pathlib import Path
import base64
root=Path(__file__).resolve().parents[1]
uri=lambda p:'data:image/png;base64,'+base64.b64encode(p.read_bytes()).decode()
html='''<!doctype html><html lang="th"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Agrenor · Painted tunnel study</title><style>*{box-sizing:border-box}body{margin:0;background:#111923;color:#f1dfbd;font:14px system-ui}main{width:min(1280px,100%);margin:auto;padding:18px}h1{font-size:17px;font-weight:400}.stage{position:relative;aspect-ratio:16/9;overflow:hidden;background:#142d3c;perspective:1200px;border-radius:4px}.world,.near{position:absolute;inset:0;transform-origin:82% 33%;background:url('__BG__') center/cover}.near{inset:0;mask-image:linear-gradient(transparent 45%,#000 100%);pointer-events:none;z-index:3}.card{position:absolute;left:82%;top:33%;width:58%;height:auto;aspect-ratio:4/3;padding:4px;background:#b59b6c;box-shadow:0 18px 45px #06101dbb;opacity:0;transform-style:preserve-3d}.art{position:absolute;inset:4px;background-position:center top;background-size:auto 200%;background-repeat:no-repeat}.return{position:absolute;inset:0;background:url('__GIFT__') center/cover;transform-origin:50% 43%;opacity:0;z-index:4}.warp{position:absolute;inset:0;background:#fff8e9;opacity:0;z-index:5;pointer-events:none}.controls{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:15px}button{padding:10px 16px;border:1px solid #b89960;background:#202f3b;color:#f1dfbd;border-radius:4px;font:inherit;cursor:pointer}button:focus-visible{outline:2px solid #e6cc90;outline-offset:3px}input[type=range]{flex:1;min-width:150px;accent-color:#e1bf7c}label{white-space:nowrap}small{display:block;margin-top:12px;color:#adb8c2;line-height:1.6}.hidden{visibility:hidden}@media(max-width:600px){main{padding:8px}}.world:after{content:'';position:absolute;inset:0;background:inherit;filter:blur(5px);mask-image:linear-gradient(#000,transparent 29%,transparent 72%,#000);pointer-events:none}</style><main><h1>Painted tunnel · ทดลองภาพวาดและความลึก 20 วินาที</h1><div class="stage" role="img" aria-label="ภาพเจ็ดเส้นทางออกจากปลายอุโมงค์แสง แล้วกลับมาที่สำรับการ์ด"><div class="world"></div>__CARDS__<div class="near"></div><div class="return"></div><div class="warp"></div></div><div class="controls"><button id="play">เล่นซ้ำ</button><button id="pause">หยุด</button><input id="seek" aria-label="เวลา" type="range" min="0" max="20000" step="1" value="0"><span id="time">0.00 / 20.00</span></div><div class="controls"><label><input id="cards" type="checkbox" checked>แสดงภาพเจ็ดเส้นทาง</label><label><input id="depth" type="checkbox" checked>หมอกฉากหน้า</label></div><small>ภาพวาดเป็นพื้นฉากจริง การเคลื่อนกล้องและหมอกใช้ภาพเดียวกันซ้อนสองระยะผ่านหน้ากากนุ่ม ไม่มีเส้นรัศมีหรือเอฟเฟกต์บนตัวละคร · กดหยุด/เลื่อนเวลาเพื่อตรวจเฟรม</small><p id="status">กำลังเตรียมภาพ…</p></main><script>
const stage=document.querySelector('.stage'),tracks=[];const add=(sel,frames,delay,duration)=>{const a=stage.querySelector(sel).animate(frames,{delay:delay*20/26,duration:duration*20/26,fill:'both',easing:'linear'});a.pause();tracks.push(a)};
const clock=stage.animate([],{duration:20000,fill:'both'});clock.pause();tracks.push(clock);
add('.world',[{transform:'scale(1)'},{offset:.88,transform:'scale(1.65)'},{transform:'scale(2.8)'}],0,23000);
add('.near',[{transform:'scale(1.02)',opacity:.15},{offset:.88,transform:'scale(1.85)',opacity:.25},{transform:'scale(3)',opacity:0}],0,23000);
// All card centers start at the painted opening: 82% across, 33% down.
// Translation uses the card's dimensions, so the routes resize with the stage.
const routes=[[-76,28,-5],[-39,42,4],[-80,-8,-3],[-41,15,3],[-71,40,-4],[-53,-3,1],[-55,27,-2]];
routes.forEach(([x,y,r],i)=>{
 const pose=(dx,dy,scale,angle)=>`translate(-50%,-50%) translate(${dx}%,${dy}%) scale(${scale}) rotate(${angle}deg)`;
 add('.card-'+i,[
 {opacity:0,transform:pose(0,0,.015,0)},
 {offset:.1,opacity:.8,transform:pose(x*.18,y*.18,.15,r)},
 {offset:.32,opacity:1,transform:pose(x,y,1,r),easing:'ease-out'},
 {offset:.78,opacity:1,transform:pose(x-2,y+1,1.025,r*.6),easing:'ease-in'},
 {opacity:0,transform:pose(x*1.8,y*1.8,1.6,r*2)}
 ],600+i*3000,3400);
});
add('.warp',[{opacity:0},{offset:.4,opacity:1},{offset:.55,opacity:1},{opacity:0}],22200,1200);
add('.return',[{opacity:0,transform:'scale(4.2)'},{offset:.08,opacity:1,transform:'scale(4.2)'},{offset:.8,opacity:1,transform:'scale(1.3)'},{opacity:1,transform:'scale(1.25)'}],22700,3300);
let running=false;const stamp=document.querySelector('#time'),slider=document.querySelector('#seek');function sync(){const t=Math.min(20000,Number(clock.currentTime)||0);slider.value=t;stamp.textContent=(t/1000).toFixed(2)+' / 20.00';if(t>=20000){running=false;document.querySelector('#pause').textContent='เล่นต่อ'};requestAnimationFrame(sync)}function stop(){running=false;tracks.forEach(a=>a.pause());document.querySelector('#pause').textContent='เล่นต่อ'}function play(){running=true;const t=Number(clock.currentTime)||0,origin=document.timeline.currentTime-t;tracks.forEach(a=>{a.play();a.startTime=origin});document.querySelector('#pause').textContent='หยุด'}async function seek(t){stop();await Promise.all(tracks.map(a=>a.ready));tracks.forEach(a=>a.currentTime=t)}document.querySelector('#play').onclick=async()=>{await seek(0);play()};document.querySelector('#pause').onclick=()=>running?stop():play();slider.oninput=()=>seek(+slider.value);document.querySelector('#cards').onchange=e=>stage.querySelectorAll('.card').forEach(c=>c.classList.toggle('hidden',!e.target.checked));document.querySelector('#depth').onchange=e=>stage.querySelector('.near').classList.toggle('hidden',!e.target.checked);document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});Promise.all([...stage.querySelectorAll('.art,.world,.return')].map(el=>new Promise(r=>{const im=new Image();im.onload=im.onerror=r;im.src=getComputedStyle(el).backgroundImage.slice(5,-2)}))).then(async()=>{await Promise.all(tracks.map(a=>a.ready));document.querySelector('#status').textContent='พร้อม';if(matchMedia('(prefers-reduced-motion: reduce)').matches)seek(1500);else play();sync()});window.tunnelStudy={seek,get time(){return clock.currentTime}};
</script></html>'''
html=html.replace('__BG__',uri(root/'assets/intro/studies/painted-tunnel.png')).replace('__GIFT__',uri(root/'assets/intro/story/gift-before.png'))
for j in range(1,5):
    selectors=','.join(f'.card-{i} .art' for i in range(7) if i//2+1==j)
    html=html.replace('</style>', selectors+'{background-image:url('+uri(root/f'assets/intro/story/paths-0{j}.png')+');}</style>')
cards=[]
for i in range(7):
    paint=f'var(--path-{i//2+1})'
    half='bottom' if i%2 else 'top'
    cards.append(f'<div class="card card-{i}"><div class="art" style="background-position:center {half}"></div></div>')
html=html.replace('__CARDS__',''.join(cards))
(root/'dev/painted-tunnel-study.html').write_text(html)
print('Created self-contained study:',len(html),'bytes')
