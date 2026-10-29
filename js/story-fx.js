/* v93 · Cutscene player + light effects for story scenes.
   Cutscene.play(scene) → Promise (resolves when the scene ends or is skipped).
   scene = {bg, pan:'in'|'out'|'left'|'right', tint:'dawn'|'day'|'dusk'|'night'|'cave'|'warm',
            fx:['motes','rays','orb','embers','lanterns','fireflies','crystals','stars','mist','dust','leaves'],
            card:{kicker,title} (chapter card shown first), lines:[{who,text,fx,bg,tint,shake,flash,burst}]}
   Speakers come from Cutscene.speakers[who] = {name, portrait?, color?}. Text may use {hero}.
   Everything is drawn in code (canvas particles + CSS light layers); backgrounds reuse existing scene art. */
(function(root){'use strict';
const reduced=()=>root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const heroName=()=>{try{return (typeof s!=='undefined'&&s.village?.heroName)||'นักผจญภัย'}catch{return 'นักผจญภัย'}};
const fill=t=>String(t??'').replace(/\{hero\}/g,heroName());
const wait=ms=>new Promise(r=>setTimeout(r,ms));

/* ---------------- particles ---------------- */
const KINDS={
 motes:    {n:46,make:(w,h)=>({x:Math.random()*w,y:Math.random()*h,r:1+Math.random()*2.4,vx:(Math.random()-.5)*.15,vy:-.08-Math.random()*.22,a:.25+Math.random()*.55,hue:44,tw:Math.random()*6})},
 embers:   {n:60,make:(w,h)=>({x:Math.random()*w,y:h+Math.random()*h*.3,r:.8+Math.random()*2.2,vx:(Math.random()-.5)*.6,vy:-.6-Math.random()*1.4,a:.6+Math.random()*.4,hue:22+Math.random()*16,tw:Math.random()*6,life:1})},
 lanterns: {n:22,make:(w,h)=>({x:Math.random()*w,y:h*.15+Math.random()*h*.7,r:8+Math.random()*22,vx:(Math.random()-.5)*.12,vy:-.05-Math.random()*.1,a:.12+Math.random()*.22,hue:34+Math.random()*12,tw:Math.random()*6,soft:true})},
 fireflies:{n:28,make:(w,h)=>({x:Math.random()*w,y:h*.35+Math.random()*h*.6,r:1.4+Math.random()*1.6,vx:(Math.random()-.5)*.5,vy:(Math.random()-.5)*.4,a:.8,hue:78,tw:Math.random()*6,blink:true})},
 crystals: {n:40,make:(w,h)=>({x:Math.random()*w,y:Math.random()*h,r:1+Math.random()*2.6,vx:(Math.random()-.5)*.1,vy:-.05-Math.random()*.15,a:.4+Math.random()*.5,hue:275+Math.random()*30,tw:Math.random()*6,blink:true,star:true})},
 stars:    {n:70,make:(w,h)=>({x:Math.random()*w,y:Math.random()*h*.45,r:.5+Math.random()*1.3,vx:0,vy:0,a:.3+Math.random()*.7,hue:220,tw:Math.random()*6,blink:true,sat:20})},
 dust:     {n:30,make:(w,h)=>({x:Math.random()*w,y:h*.55+Math.random()*h*.45,r:2+Math.random()*5,vx:.15+Math.random()*.35,vy:-.05-Math.random()*.1,a:.12+Math.random()*.18,hue:36,tw:0,soft:true,sat:25})},
 leaves:   {n:16,make:(w,h)=>({x:Math.random()*w,y:-20-Math.random()*h,r:4+Math.random()*4,vx:.3+Math.random()*.6,vy:.5+Math.random()*.7,a:.85,hue:85+Math.random()*40,tw:Math.random()*6,leaf:true,rot:Math.random()*6})}};
class Particles{
 constructor(canvas){this.c=canvas;this.g=canvas.getContext('2d');this.list=[];this.bursts=[];this.kinds=new Set();this.raf=0;this.t=0}
 size(){const d=Math.min(2,root.devicePixelRatio||1),r=this.c.getBoundingClientRect();this.w=r.width;this.h=r.height;this.c.width=Math.round(r.width*d);this.c.height=Math.round(r.height*d);this.g.setTransform(d,0,0,d,0,0)}
 set(kinds){const want=new Set((kinds||[]).filter(k=>KINDS[k]));for(const k of [...this.kinds])if(!want.has(k)){this.list=this.list.filter(p=>p.kind!==k);this.kinds.delete(k)}
  for(const k of want)if(!this.kinds.has(k)){this.kinds.add(k);const K=KINDS[k],n=reduced()?Math.ceil(K.n/3):K.n;for(let i=0;i<n;i++)this.list.push({...K.make(this.w||1280,this.h||720),kind:k})}}
 burst(x,y,opt={}){const n=reduced()?20:opt.n||90,hue=opt.hue??40;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,sp=(opt.speed||6)*(.35+Math.random());this.bursts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-(opt.lift||0),r:1.2+Math.random()*3,a:1,hue:hue+(Math.random()-.5)*20,decay:.012+Math.random()*.02,grav:opt.grav??.04})}}
 start(){if(this.raf)return;const step=()=>{this.raf=requestAnimationFrame(step);this.draw()};this.raf=requestAnimationFrame(step)}
 stop(){cancelAnimationFrame(this.raf);this.raf=0;this.list=[];this.bursts=[];this.kinds.clear();this.g.clearRect(0,0,this.w||0,this.h||0)}
 draw(){const g=this.g,w=this.w,h=this.h;if(!w)return;this.t+=1/60;g.clearRect(0,0,w,h);g.globalCompositeOperation='lighter';
  for(const p of this.list){p.x+=p.vx;p.y+=p.vy;if(p.leaf){p.x+=Math.sin(this.t*2+p.tw)*.6;p.rot+=.03}
   if(p.blink&&!p.star)p.vx+=(Math.random()-.5)*.05,p.vy+=(Math.random()-.5)*.05,p.vx*=.98,p.vy*=.98;
   if(p.y<-40){p.y=h+20;p.x=Math.random()*w}if(p.y>h+40){p.y=-20;p.x=Math.random()*w}if(p.x<-40)p.x=w+20;if(p.x>w+40)p.x=-20;
   let a=p.a*(p.blink?.45+.55*Math.sin(this.t*3+p.tw*2):(.75+.25*Math.sin(this.t*1.5+p.tw)));if(p.kind==='embers')a*=Math.max(0,Math.min(1,p.y/h*1.4));
   if(p.leaf){g.globalCompositeOperation='source-over';g.save();g.translate(p.x,p.y);g.rotate(p.rot);g.fillStyle=`hsla(${p.hue},55%,42%,${a})`;g.beginPath();g.ellipse(0,0,p.r,p.r*.45,0,0,Math.PI*2);g.fill();g.restore();g.globalCompositeOperation='lighter';continue}
   const R=p.soft?p.r:p.r*4,gr=g.createRadialGradient(p.x,p.y,0,p.x,p.y,R);const sat=p.sat??90;
   gr.addColorStop(0,`hsla(${p.hue},${sat}%,${p.soft?70:82}%,${a})`);gr.addColorStop(p.soft?.6:.25,`hsla(${p.hue},${sat}%,60%,${a*(p.soft?.35:.5)})`);gr.addColorStop(1,`hsla(${p.hue},${sat}%,50%,0)`);
   g.fillStyle=gr;g.beginPath();g.arc(p.x,p.y,R,0,Math.PI*2);g.fill();
   if(p.star){g.strokeStyle=`hsla(${p.hue},90%,85%,${a*.7})`;g.lineWidth=.7;g.beginPath();g.moveTo(p.x-R*.9,p.y);g.lineTo(p.x+R*.9,p.y);g.moveTo(p.x,p.y-R*.9);g.lineTo(p.x,p.y+R*.9);g.stroke()}}
  for(let i=this.bursts.length-1;i>=0;i--){const b=this.bursts[i];b.x+=b.vx;b.y+=b.vy;b.vx*=.965;b.vy=b.vy*.965+b.grav;b.a-=b.decay;if(b.a<=0){this.bursts.splice(i,1);continue}
   const R=b.r*4,gr=g.createRadialGradient(b.x,b.y,0,b.x,b.y,R);gr.addColorStop(0,`hsla(${b.hue},95%,85%,${b.a})`);gr.addColorStop(.3,`hsla(${b.hue},95%,60%,${b.a*.5})`);gr.addColorStop(1,`hsla(${b.hue},95%,50%,0)`);g.fillStyle=gr;g.beginPath();g.arc(b.x,b.y,R,0,Math.PI*2);g.fill()}
  g.globalCompositeOperation='source-over'}}

/* ---------------- DOM ---------------- */
let el=null,parts=null,playing=null;
function build(){if(el)return el;el=document.createElement('div');el.id='cutscene';el.className='cs';el.hidden=true;el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','ฉากเนื้อเรื่อง');
 el.innerHTML=`<div class="cs-stage"><div class="cs-bg"></div><div class="cs-bg cs-bg-next"></div><canvas class="cs-art" hidden></canvas><div class="cs-tint"></div><div class="cs-rays"></div><div class="cs-orb"><i></i></div><div class="cs-mist"></div><canvas class="cs-canvas"></canvas><div class="cs-vignette"></div><div class="cs-flash"></div><div class="cs-ring"></div></div>
 <div class="cs-bar cs-top"></div><div class="cs-bar cs-bottom"></div>
 <div class="cs-card" hidden><small></small><h2></h2></div>
 <div class="cs-box" hidden><div class="cs-portrait"></div><div class="cs-talk"><b class="cs-name"></b><p class="cs-text"></p></div><span class="cs-next" aria-hidden="true">▼</span></div>
 <button type="button" class="cs-skip">ข้ามฉาก ▸▸</button>`;
 document.body.appendChild(el);parts=new Particles(el.querySelector('.cs-canvas'));root.addEventListener('resize',()=>{if(!el.hidden)parts.size()});return el}
const $=sel=>el.querySelector(sel);
/* v95.02 · scene/line `art:'dawn'|'orb'|…` → an animated scene drawn in code (js/scene-art.js) instead of a background image */
let art=null;
function setArt(name){const c=$('.cs-art');if(!name||!root.SceneArt?.has(name)){if(!c.hidden){c.hidden=true;art?.stop()}return false}c.hidden=false;art||=root.SceneArt.create(c);art.size();art.show(name);return true}
function setBg(src,pan,instant){const a=$('.cs-bg:not(.cs-bg-next)'),b=$('.cs-bg-next');if(!src)return;const cur=a.dataset.src;if(cur===src&&!pan)return;
 if(instant||!cur){a.style.backgroundImage=`url("${src}")`;a.dataset.src=src;a.className='cs-bg'+(pan&&!reduced()?' cs-pan-'+pan:'');return}
 b.style.backgroundImage=`url("${src}")`;b.dataset.src=src;b.className='cs-bg cs-bg-next cs-show'+(pan&&!reduced()?' cs-pan-'+pan:'');
 setTimeout(()=>{a.style.backgroundImage=b.style.backgroundImage;a.dataset.src=src;a.className='cs-bg'+(pan&&!reduced()?' cs-pan-'+pan:'');b.className='cs-bg cs-bg-next'},reduced()?0:900)}
function setLook(o){if(o.tint!=null)$('.cs-stage').dataset.tint=o.tint||'';const fx=o.fx||[];$('.cs-stage').classList.toggle('fx-rays',fx.includes('rays'));$('.cs-stage').classList.toggle('fx-orb',fx.includes('orb'));$('.cs-stage').classList.toggle('fx-mist',fx.includes('mist'));parts.set(fx)}
function shake(strong){if(reduced())return;const st=$('.cs-stage');st.classList.remove('cs-shake','cs-shake-big');void st.offsetWidth;st.classList.add(strong?'cs-shake-big':'cs-shake')}
function flash(color){const f=$('.cs-flash');f.style.background=color||'#fff';f.classList.remove('on');void f.offsetWidth;f.classList.add('on')}
function burst(opt={}){const r=el.getBoundingClientRect(),x=(opt.x??.5)*r.width,y=(opt.y??.45)*r.height;parts.burst(x,y,opt);if(opt.ring!==false){const ring=$('.cs-ring');ring.style.left=x+'px';ring.style.top=y+'px';ring.style.setProperty('--ring',opt.ringColor||'rgba(255,214,140,.9)');ring.classList.remove('on');void ring.offsetWidth;ring.classList.add('on')}}

/* ---------------- text ---------------- */
let typing=null,full='';
const SEG=(()=>{try{return new Intl.Segmenter('th',{granularity:'word'})}catch{return null}})();
function speaker(who){const S=Cutscene.speakers[who]||{};const name=typeof S.name==='function'?S.name():S.name;return {name:name??(who==='hero'?heroName():who||''),portrait:typeof S.portrait==='function'?S.portrait():S.portrait,color:S.color||'#6b5a3a'}}
function showLine(line){const box=$('.cs-box'),sp=speaker(line.who);box.hidden=false;box.classList.toggle('cs-narr',!line.who);
 $('.cs-name').textContent=line.who?sp.name:'';const pt=$('.cs-portrait');pt.hidden=!line.who;
 if(line.who){if(sp.portrait)pt.innerHTML=`<img src="${esc(sp.portrait)}" alt="">`;else{pt.innerHTML=`<span>${esc([...sp.name][0]||'?')}</span>`;pt.style.setProperty('--pc',sp.color)}}
 box.classList.remove('cs-in');void box.offsetWidth;box.classList.add('cs-in');
 full=fill(line.text);const t=$('.cs-text');clearTimeout(typing);typing=null;if(reduced()){t.textContent=full;return}
 /* v95.05: word by word (Thai word breaks), never letter by letter */
 /* v95.07: fast inside a phrase, a beat at each space, longer after … ? ! and line breaks */
 const words=SEG?[...SEG.segment(full)].map(x=>x.segment):full.split(/(\s+)/);let i=0;t.textContent='';
 const gap=w=>/\n/.test(w)?600:/^\s+$/.test(w)?320:Math.min(150,45+[...w].length*12)+(/(…|\.\.\.)$/.test(w)?500:/[?!]$/.test(w)?380:0);
 const step=()=>{i++;t.textContent=words.slice(0,i).join('');if(i>=words.length){typing=null;return}typing=setTimeout(step,gap(words[i-1]))};typing=setTimeout(step,60)}
function finishTyping(){if(!typing)return false;clearTimeout(typing);typing=null;$('.cs-text').textContent=full;return true}

/* ---------------- play ---------------- */
async function showCard(card){const c=$('.cs-card');c.querySelector('small').textContent=fill(card.kicker||'');c.querySelector('h2').textContent=fill(card.title||'');c.hidden=false;c.classList.remove('cs-in');void c.offsetWidth;c.classList.add('cs-in');await wait(reduced()?900:2300);c.classList.add('cs-out');await wait(reduced()?0:500);c.hidden=true;c.classList.remove('cs-out')}
function applyLine(line){if(line.art)setArt(line.art);else if(line.bg){setArt(null);setBg(line.bg,line.pan)}if(line.tint!=null||line.fx)setLook({tint:line.tint,fx:line.fx??[...parts.kinds]});if(line.flash)flash(line.flash===true?null:line.flash);if(line.shake)shake(line.shake==='big');if(line.burst)burst(line.burst===true?{}:line.burst)}
function play(scene){if(!scene)return Promise.resolve();if(playing)return playing.then(()=>play(scene));
 build();playing=new Promise(async resolve=>{
  const lines=scene.lines||[];let i=-1,done=false,busy=false;
  el.hidden=false;document.body.classList.add('cs-open');parts.size();parts.start();
  setArt(scene.art);setBg(scene.bg,scene.pan,true);setLook({tint:scene.tint||'',fx:scene.fx||[]});$('.cs-box').hidden=true;
  requestAnimationFrame(()=>el.classList.add('cs-live'));
  const end=async()=>{if(done)return;done=true;finishTyping();el.classList.remove('cs-live');el.classList.add('cs-leaving');await wait(reduced()?0:520);el.hidden=true;el.classList.remove('cs-leaving');parts.stop();setArt(null);document.body.classList.remove('cs-open');$('.cs-box').hidden=true;
   const st=$('.cs-stage');st.dataset.tint='';st.className='cs-stage';el.querySelectorAll('.cs-bg').forEach(b=>{b.dataset.src='';b.style.backgroundImage=''});
   el.onclick=null;document.removeEventListener('keydown',key,true);playing=null;resolve()};
  const next=async()=>{if(done||busy)return;if(finishTyping())return;i++;if(i>=lines.length)return end();const line=lines[i];applyLine(line);
   if(line.wait){busy=true;$('.cs-box').hidden=true;await wait(reduced()?150:line.wait);busy=false;if(!line.text)return next()}
   if(line.text)showLine(line);else next()};
  const key=e=>{if(el.hidden)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();next()}else if(e.key==='Escape'){e.preventDefault();e.stopPropagation();end()}};
  el.onclick=e=>{if(e.target.closest('.cs-skip')){end();return}next()};document.addEventListener('keydown',key,true);
  $('.cs-skip').focus?.({preventScroll:true});
  await wait(reduced()?0:450);if(scene.card){busy=true;await showCard(scene.card);busy=false}
  next()});
 return playing}
const Cutscene={play,speakers:{},isPlaying:()=>!!playing,flash:(c)=>{build();flash(c)},burst:(o)=>{build();burst(o)}};
root.Cutscene=Cutscene;

/* ---------------- small floating toast for quest feedback (used outside cutscenes) ---------------- */
root.StoryToast=function(html,kind=''){let host=document.getElementById('storyToasts');if(!host){host=document.createElement('div');host.id='storyToasts';document.body.appendChild(host)}
 const t=document.createElement('div');t.className='st-toast '+kind;t.innerHTML=html;host.appendChild(t);setTimeout(()=>t.classList.add('out'),2600);setTimeout(()=>t.remove(),3200)};
})(globalThis);
