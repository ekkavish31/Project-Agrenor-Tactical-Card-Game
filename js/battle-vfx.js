/* v84 Battle VFX — AI-painted effect stamps (assets/fx/skill) and particles (assets/fx/particle).
   Images are colour on transparent (cut from black sheets). Code only moves, scales, rotates and fades them.
   tactics-ui.js asks BattleVFX.draw(...) first and falls back to its code-drawn effect when an image is not loaded yet. */
(function(root){'use strict';
const SRC=document.currentScript?.src||'',url=f=>SRC?new URL('../assets/fx/'+f+'.webp',SRC).href:'assets/fx/'+f+'.webp',imgs={};
function I(n){let im=imgs[n];if(!im){im=new Image();im.decoding='async';im.src=url(n);imgs[n]=im}return im.complete&&im.naturalWidth?im:null}
const SKILL=['slash','thrust','cross','shockwave','spear','arrow','shield','parry','fire','ice','lightning','wind','water','earth','holy','dark'],PART=['rain','snowflake','snowball','glow','mist','dust','smoke','star','ember','leaf','sparkle','mote','splash','hit','heal','poison'];
SKILL.forEach(n=>I('skill/'+n));PART.forEach(n=>I('particle/'+n));
const clamp=v=>Math.max(0,Math.min(1,v)),pop=(t,k)=>clamp(t/k),fade=(t,s)=>t<s?1:clamp(1-(t-s)/(1-s)),back=t=>1+2.2*Math.pow(t-1,3)+1.2*Math.pow(t-1,2); // overshoot ease-out
// stamp: draw one image centred on (x,y) — ax/ay move the anchor (0..1 of the image), sx/sy stretch, blend defaults to additive light
function stamp(g,n,x,y,size,o={}){const im=I(n);if(!im||size<=0)return false;const a=(o.alpha??1);if(a<=0)return true;g.save();g.globalAlpha*=a;g.globalCompositeOperation=o.blend||'lighter';g.translate(x,y);if(o.rot)g.rotate(o.rot);g.scale((o.flip?-1:1)*(o.sx||1),o.sy||1);g.drawImage(im,-size*(o.ax??.5),-size*(o.ay??.5),size,size);g.restore();return true}
const R=(e,i)=>{let h=Math.imul((e.seed||1)*2654435761^i*40503,2246822519)>>>0;return (h%10000)/10000};
function burst(g,e,n,x,y,spread,size,t,name='hit'){for(let i=0;i<n;i++){const an=R(e,i)*Math.PI*2,d=spread*(.35+.65*R(e,i+50))*t;stamp(g,'particle/'+name,x+Math.cos(an)*d,y+Math.sin(an)*d*.7,size*(1-t*.6),{alpha:1-t,rot:an})}}
// projectile travel (glow mote along an arc) shared by spells; returns the impact progress 0..1 or -1 while still flying
function travel(g,e,t,a,p,cw,split,name,size,lift=.45){if(!e.from||(Math.abs(a.x-p.x)+Math.abs(a.y-p.y))<4)return clamp(t);if(t>=split)return (t-split)/(1-split);const k=t/split,ay=a.y-cw*.75,py=p.y-cw*.6;
 for(let i=5;i>=0;i--){const kk=Math.max(0,k-i*.035),x=a.x+(p.x-a.x)*kk,y=ay+(py-ay)*kk-Math.sin(kk*Math.PI)*cw*lift;stamp(g,'particle/'+(i?'glow':name),x,y,size*(i?1-i*.13:1),{alpha:i?.55-i*.08:1,rot:k*8})}return -1}
const chest=(p,cw)=>p.y-cw*.65;
const KIND={
 sword(g,e,t,p,a,cw){const W=cw*(e.scale||1),dir=a.x<=p.x?1:-1,s=back(pop(t,.32));if(!stamp(g,'skill/slash',p.x,chest(p,cw),W*2.1*(.7+.3*s),{flip:dir<0,rot:dir*(-.25+.35*pop(t,.3)),alpha:fade(t,.45)}))return false;if(t>.12&&t<.6)stamp(g,'particle/hit',p.x,chest(p,cw),W*1.1*(1-pop(t-.12,.48)),{alpha:1-pop(t-.12,.48)});return true},
 knife(g,e,t,p,a,cw){const W=cw*(e.scale||1);for(let k=0;k<2;k++){const tt=clamp((t-k*.28)*2);if(!tt)continue;if(!stamp(g,'skill/cross',p.x+(k?W*.18:-W*.1),chest(p,cw)+(k?W*.12:-W*.06),W*(k?1.05:1.35)*back(pop(tt,.35)),{rot:(R(e,k)-.5)*.6,alpha:fade(tt,.4)}))return false}burst(g,e,6,p.x,chest(p,cw),W*.7,W*.25,pop(t,1),'star');return true},
 blunt(g,e,t,p,a,cw){const W=cw*(e.scale||1);if(!stamp(g,'skill/shockwave',p.x,p.y-cw*.05,W*(1+1.6*pop(t,.6)),{sy:.5,alpha:fade(t,.35)}))return false;if(t<.45)stamp(g,'particle/hit',p.x,chest(p,cw),W*1.3*(1-t/.45),{alpha:1-t/.45});
  for(let i=0;i<5;i++){const k=clamp((t-.1)/.9),an=Math.PI+R(e,i)*Math.PI;stamp(g,'particle/dust',p.x+Math.cos(an)*W*.8*k,p.y-cw*.1-W*.35*k,W*(.45+.4*k),{blend:'source-over',alpha:.7*(1-k)})}return true},
 spear(g,e,t,p,a,cw){const W=cw*(e.scale||1),ay=chest(a,cw),py=chest(p,cw),an=Math.atan2(py-ay,p.x-a.x),tt=clamp(t*2.2),x=a.x+(p.x-a.x)*(.35+.65*tt),y=ay+(py-ay)*(.35+.65*tt);
  if(!stamp(g,'skill/spear',x,y,W*1.9,{rot:an,ax:.86,alpha:fade(t,.55)}))return false;if(t>.42)burst(g,e,8,p.x,py,W*1.1,W*.32,(t-.42)/.58,'star');return true},
 rapier(g,e,t,p,a,cw){const W=cw*(e.scale||1),ay=chest(a,cw)-cw*.05,py=chest(p,cw)-cw*.05,an=Math.atan2(py-ay,p.x-a.x),tt=clamp(t*3);
  if(!stamp(g,'skill/thrust',p.x,py,W*1.9,{rot:an,ax:.9,sx:.4+.6*tt,alpha:fade(t,.4)}))return false;if(t>.28){const k=(t-.28)/.72;stamp(g,'particle/star',p.x,py,W*1.2*Math.sin(k*Math.PI),{rot:k})}return true},
 arrow(g,e,t,p,a,cw){const W=cw*(e.scale||1),ay=a.y-cw*.75,py=chest(p,cw),arc=cw*.35,x=a.x+(p.x-a.x)*t,y=ay+(py-ay)*t-Math.sin(t*Math.PI)*arc,an=Math.atan2((py-ay)-Math.cos(t*Math.PI)*arc*Math.PI,p.x-a.x);
  if(!stamp(g,'skill/arrow',x,y,W*1.5,{rot:an,ax:.85}))return false;if(t>.9)stamp(g,'particle/hit',p.x,py,W*.9,{alpha:(1-t)*10});return true},
 shield(g,e,t,p,a,cw){const W=cw*(e.scale||1),an=Math.atan2(a.y-p.y,a.x-p.x),s=back(pop(t,.25));return stamp(g,'skill/shield',p.x+Math.cos(an)*cw*.22,chest(p,cw),W*1.7*(.75+.25*s),{alpha:.85*fade(t,.45),rot:Math.sin(t*3)*.05})},
 parry(g,e,t,p,a,cw){const W=cw*(e.scale||1);if(!stamp(g,'skill/parry',p.x,chest(p,cw)-cw*.1,W*1.7*back(pop(t,.18)),{rot:R(e,1)*.8-.4+t*.3,alpha:fade(t,.38)}))return false;burst(g,e,10,p.x,chest(p,cw),W*1.2,W*.3,t,'star');return true},
 fire(g,e,t,p,a,cw){const W=cw*(e.scale||1),k=travel(g,e,t,a,p,cw,.55,'ember',W*.7,.5);if(k<0)return !!I('particle/ember');return stamp(g,'skill/fire',p.x,p.y+cw*.1,W*2.3*(.55+.55*back(pop(k,.45))),{ay:.8,alpha:fade(k,.35)})},
 ice(g,e,t,p,a,cw){const W=cw*(e.scale||1),k=travel(g,e,t,a,p,cw,.5,'mote',W*.6,.3);if(k<0)return !!I('particle/mote');if(!stamp(g,'skill/ice',p.x,p.y+cw*.12,W*2*back(pop(k,.3)),{ay:.85,sy:pop(k,.3),alpha:fade(k,.55)}))return false;if(k>.25)burst(g,e,7,p.x,chest(p,cw),W,W*.28,(k-.25)/.75,'snowflake');return true},
 lightning(g,e,t,p,a,cw){const W=cw*(e.scale||1),fl=t<.15?1:clamp(1-(t-.15)*1.4)*(Math.floor(t*30)%2?.55:1);if(!stamp(g,'skill/lightning',p.x,p.y+cw*.1,W*3,{ay:.92,sx:.75,alpha:fl}))return false;
  if(t<.3){g.save();g.globalAlpha=.22*(1-t/.3);g.fillStyle='#fff';g.fillRect(0,0,g.canvas.width,g.canvas.height);g.restore()}burst(g,e,8,p.x,p.y-cw*.1,W*.9,W*.3,clamp(t*2),'sparkle');return true},
 heal(g,e,t,p,a,cw){const W=cw*(e.scale||1);if(!I('particle/heal'))return false;const gold=/^#f|^#e/i.test(e.color||'');stamp(g,gold?'skill/holy':'particle/glow',p.x,p.y+cw*.1,W*(gold?1.8:1.6),{ay:gold?.85:.5,alpha:.55*fade(t,.4)});
  for(let i=0;i<6;i++){const k=clamp(t*1.2-i*.07),x=p.x+(R(e,i)-.5)*W*.9,y=p.y-cw*(.15+k*1.25);stamp(g,'particle/'+(gold?'sparkle':'heal'),x,y,W*(.32+.12*R(e,i+9)),{alpha:Math.sin(k*Math.PI)})}return true},
 arcane(g,e,t,p,a,cw){const W=cw*(e.scale||1),k=travel(g,e,t,a,p,cw,.62,'mote',W*.55,.45);if(k<0)return !!I('particle/mote');if(!stamp(g,'particle/sparkle',p.x,chest(p,cw),W*1.6*(.5+k),{alpha:1-k,rot:k}))return false;stamp(g,'particle/star',p.x,chest(p,cw),W*1.2*(1-k*.5),{alpha:1-k});return true},
 wind(g,e,t,p,a,cw){const W=cw*(e.scale||1),k=travel(g,e,t,a,p,cw,.4,'leaf',W*.45,.3);if(k<0)return !!I('particle/leaf');if(!stamp(g,'skill/wind',p.x,chest(p,cw),W*2*(.7+.3*pop(k,.3)),{rot:-k*1.4,alpha:fade(k,.5)}))return false;for(let i=0;i<5;i++){const an=R(e,i)*6+k*5;stamp(g,'particle/leaf',p.x+Math.cos(an)*W*.8*k,chest(p,cw)+Math.sin(an)*W*.4*k,W*.3,{blend:'source-over',rot:an,alpha:1-k})}return true},
 water(g,e,t,p,a,cw){const W=cw*(e.scale||1),k=travel(g,e,t,a,p,cw,.45,'mote',W*.55,.4);if(k<0)return !!I('particle/mote');if(!stamp(g,'skill/water',p.x,p.y+cw*.1,W*2*back(pop(k,.3)),{ay:.85,alpha:fade(k,.45)}))return false;stamp(g,'particle/splash',p.x,p.y,W*(1+k),{sy:.55,alpha:1-k});return true},
 earth(g,e,t,p,a,cw){const W=cw*(e.scale||1),s=back(pop(t,.3));if(!stamp(g,'skill/earth',p.x,p.y+cw*.15,W*2.1,{ay:.88,sy:s,alpha:fade(t,.6),blend:'source-over'}))return false;stamp(g,'skill/shockwave',p.x,p.y,W*(1+t),{sy:.45,alpha:.6*(1-t)});return true},
 holy(g,e,t,p,a,cw){const W=cw*(e.scale||1);if(!stamp(g,'skill/holy',p.x,p.y+cw*.15,W*2.2,{ay:.88,sx:.6+.4*pop(t,.25),alpha:fade(t,.5)}))return false;burst(g,e,8,p.x,chest(p,cw),W,W*.3,t,'sparkle');return true},
 dark(g,e,t,p,a,cw){const W=cw*(e.scale||1),k=travel(g,e,t,a,p,cw,.45,'mote',W*.5,.4);if(k<0)return !!I('particle/mote');return stamp(g,'skill/dark',p.x,chest(p,cw),W*1.9*(.6+.4*back(pop(k,.35))),{rot:k*2,alpha:fade(k,.5),blend:'source-over'})}};
function draw(e,t,p,a,g,camera){const f=KIND[e.kind];if(!f)return false;try{return !!f(g,e,t,p,a||p,camera.w)}catch(err){return false}}
// ---------- weather: sprites instead of dots. Returns false (code fallback) until the images are loaded. ----------
function weather(g,r,now,kind,low){const W=r.width,H=r.height;
 if(kind==='rain'){if(!I('particle/rain'))return false;const n=low?24:60;for(let i=0;i<n;i++){const x=(i*117.31+now*.13)%W,y=(i*83.7+now*.5)%H;stamp(g,'particle/rain',x,y,26+(i%3)*6,{alpha:.45,blend:'source-over'})}return true}
 if(kind==='snow'){if(!I('particle/snowflake'))return false;const n=low?14:36;for(let i=0;i<n;i++){const x=(i*117.31+now*.012+Math.sin(now*.0009+i)*18)%W,y=(i*83.7+now*.035*(1+i%3*.3))%H;stamp(g,'particle/'+(i%3?'snowball':'snowflake'),x,y,i%3?7+(i%4)*2:14,{alpha:.75,blend:'source-over',rot:now*.0006*(i%2?1:-1)})}return true}
 if(kind==='embers'){if(!I('particle/ember'))return false;const n=low?10:26;for(let i=0;i<n;i++){const x=(i*117.31+now*.02+Math.sin(now*.001+i)*14)%W,y=H-((i*83.7+now*.03)%H);stamp(g,'particle/ember',x,y,12+(i%3)*5,{alpha:.55+.35*Math.sin(now*.004+i),rot:-1.2})}return true}
 if(kind==='mist'){if(!I('particle/mist'))return false;const n=low?3:7;for(let i=0;i<n;i++){const s=W*(.35+.15*(i%3)),x=((i*331+now*.008*(1+i%2))%(W+s))-s/2,y=H*(.25+.6*((i*0.37)%1));stamp(g,'particle/mist',x,y,s,{alpha:.16,blend:'source-over',sy:.55})}return true}
 if(kind==='breeze'){if(!I('particle/leaf'))return false;const n=low?6:14;for(let i=0;i<n;i++){const x=(i*117.31+now*.05)%W,y=(i*83.7+now*.02+Math.sin(now*.002+i)*20)%H;stamp(g,'particle/leaf',x,y,12+(i%3)*3,{alpha:.55,blend:'source-over',rot:now*.002+i})}return true}
 return false}
root.BattleVFX={draw,weather,stamp,ready:()=>SKILL.every(n=>I('skill/'+n))};
})(globalThis);
