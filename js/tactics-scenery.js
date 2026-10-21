// v11 battle scenery + code-drawn monsters (temporary art until real images exist).
// • background(ctx,w,h,theme,t)   — full-canvas backdrop per area (forest / mine / quarry)
// • prop(ctx,type,p,w,alpha,t)    — mine props: beam (support frame + lantern), crystal, cart
// • monster(ctx,T,u,p,h,dir,t)    — draws a monster standing at p (feet), h = height in px,
//   dir = screen direction (SE/SW face the camera → front view, NE/NW → back view; E-facing is mirrored)
(function(){
const R=(s=>()=>(s=(s*16807)%2147483647)/2147483647);
function rand(seed){let r=R(seed);return r}
let cache={};
function layer(w,h,theme,draw){let k=theme+w+'x'+h;if(cache[k])return cache[k];let c=document.createElement('canvas');c.width=Math.max(1,w);c.height=Math.max(1,h);draw(c.getContext('2d'),w,h);cache={[k]:c,...Object.fromEntries(Object.entries(cache).slice(0,6))};return c}
// ---------- backgrounds ----------
function forestBg(g,w,h){let r=rand(7);
 let sky=g.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#2c4a3a');sky.addColorStop(.45,'#4f7a52');sky.addColorStop(1,'#1c2e22');g.fillStyle=sky;g.fillRect(0,0,w,h);
 // light shafts
 for(let i=0;i<5;i++){let x=w*(.1+.2*i+r()*.08);let gr=g.createLinearGradient(x,0,x+w*.12,h*.8);gr.addColorStop(0,'#fff6c833');gr.addColorStop(1,'#fff6c800');g.fillStyle=gr;g.beginPath();g.moveTo(x,0);g.lineTo(x+w*.05,0);g.lineTo(x+w*.2,h*.85);g.lineTo(x+w*.1,h*.85);g.fill()}
 // three layers of tree silhouettes
 [['#22402e',.42,.9],['#1a3325',.55,1.1],['#11231a',.7,1.35]].forEach(([col,base,sc])=>{g.fillStyle=col;for(let x=-40;x<w+40;x+=34*sc+r()*30){let th=h*(.18+r()*.2)*sc,y=h*base;g.beginPath();g.moveTo(x,y);g.lineTo(x+18*sc,y-th);g.lineTo(x+36*sc,y);g.fill();g.fillRect(x+15*sc,y-4,6*sc,h)}});
 // ground fog + bushes at the edges
 let fog=g.createLinearGradient(0,h*.55,0,h);fog.addColorStop(0,'#cfe3c400');fog.addColorStop(1,'#0c1a1199');g.fillStyle=fog;g.fillRect(0,h*.55,w,h*.45);
 g.fillStyle='#0d1c13';for(let x=0;x<w;x+=26){let s=18+r()*30;g.beginPath();g.arc(x,h+4,s,Math.PI,0);g.fill()}}
function mineBg(g,w,h){let r=rand(11);
 let bg=g.createRadialGradient(w/2,h*.48,h*.1,w/2,h*.5,Math.max(w,h)*.75);bg.addColorStop(0,'#4a3826');bg.addColorStop(.55,'#22180f');bg.addColorStop(1,'#0b0806');g.fillStyle=bg;g.fillRect(0,0,w,h);
 // rock strata lines
 g.strokeStyle='#ffffff0d';g.lineWidth=2;for(let i=0;i<14;i++){let y=r()*h;g.beginPath();g.moveTo(0,y);for(let x=0;x<=w;x+=40)g.lineTo(x,y+Math.sin(x*.01+i)*10+(r()-.5)*6);g.stroke()}
 // jagged ceiling + floor rocks
 const jag=(y0,dir,col)=>{g.fillStyle=col;g.beginPath();g.moveTo(0,y0);for(let x=0;x<=w+30;x+=22+r()*26)g.lineTo(x,y0+dir*(20+r()*h*.12));g.lineTo(w,y0);g.closePath();g.fill()};
 jag(0,1,'#120c08');jag(h,-1,'#0e0906');
 // wooden support frames on both sides
 for(let side of [0,1]){let x=side?w-70:22;g.fillStyle='#5a3a1e';g.fillRect(x,h*.08,14,h*.84);g.fillRect(x+34,h*.08,14,h*.84);g.fillStyle='#6e4826';g.fillRect(x-8,h*.08,64,16);g.strokeStyle='#2a1a0c';g.lineWidth=2;g.strokeRect(x,h*.08,14,h*.84);g.strokeRect(x+34,h*.08,14,h*.84)}
 // embedded crystals
 for(let i=0;i<9;i++){let x=r()*w,y=r()<.5?r()*h*.18+8:h-r()*h*.15-8,s=6+r()*10;g.fillStyle=['#8a6be0aa','#5fb0e8aa','#c070e0aa'][i%3];g.beginPath();g.moveTo(x,y-s);g.lineTo(x+s*.45,y);g.lineTo(x,y+s*.4);g.lineTo(x-s*.45,y);g.fill()}}
function quarryBg(g,w,h){let sky=g.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#9cb6c9');sky.addColorStop(.5,'#d8cfb8');sky.addColorStop(1,'#8f8676');g.fillStyle=sky;g.fillRect(0,0,w,h);let r=rand(3);g.fillStyle='#a49a86';g.beginPath();g.moveTo(0,h*.45);for(let x=0;x<=w;x+=40)g.lineTo(x,h*(.3+r()*.15));g.lineTo(w,h);g.lineTo(0,h);g.fill()}
// v13 area variants reuse a base backdrop with their own colour wash + weather
const VARIANT={swamp:{base:'forest',wash:'#2a3a2a',a:.42,fog:'#c8d8c0'},coast:{base:'quarry',wash:'#2f6a8a',a:.32,spray:true},frost:{base:'quarry',wash:'#bcd8f0',a:.38,snow:true},ruins:{base:'quarry',wash:'#3a2a4a',a:.42,wisps:true}};
// v15: a generated area backdrop (Asset Studio id scene-area-<area>, status final/temp) replaces the code-drawn one
const BG_IMG={};function areaImage(theme){let id='scene-area-'+theme,e=(window.ASSET_MANIFEST?.assets||[]).find(a=>a.id===id&&a.file&&['final','temp'].includes(a.status));if(!e)return null;let im=BG_IMG[id];if(!im){im=BG_IMG[id]=new Image();im.src=e.file}return im.complete&&im.naturalWidth?im:null}
function background(ctx,w,h,theme,t){let AI=areaImage(theme);if(AI){let k=Math.max(w/AI.naturalWidth,h/AI.naturalHeight),dw=AI.naturalWidth*k,dh=AI.naturalHeight*k;ctx.drawImage(AI,(w-dw)/2,(h-dh)/2,dw,dh);let V0=VARIANT[theme];if(V0?.snow){ctx.fillStyle='#ffffffcc';for(let i=0;i<60;i++){let x=(i*97+Math.sin(t*.0007+i)*30)%w,y=(i*53+t*.03*(1+i%3))%h;ctx.beginPath();ctx.arc(x,y,1+i%2,0,7);ctx.fill()}}return}
 let V=VARIANT[theme];if(V){background(ctx,w,h,V.base,t);ctx.save();ctx.globalAlpha=V.a;ctx.fillStyle=V.wash;ctx.fillRect(0,0,w,h);ctx.restore();
  if(V.fog){for(let i=0;i<5;i++){let y=h*(.25+i*.15),x=(t*.015*(i%2?1:-1)+i*300)%(w+400)-200,g=ctx.createRadialGradient(x,y,10,x,y,260);g.addColorStop(0,V.fog+'44');g.addColorStop(1,V.fog+'00');ctx.fillStyle=g;ctx.fillRect(x-270,y-270,540,540)}}
  if(V.snow){ctx.fillStyle='#ffffffcc';for(let i=0;i<60;i++){let x=(i*97+Math.sin(t*.0007+i)*30)%w,y=(i*53+t*.03*(1+i%3))%h;ctx.beginPath();ctx.arc(x,y,1+i%2,0,7);ctx.fill()}}
  if(V.spray){ctx.strokeStyle='#e8f6ff55';ctx.lineWidth=2;for(let i=0;i<6;i++){let y=h-30-i*14+Math.sin(t*.002+i)*5;ctx.beginPath();for(let x=0;x<=w;x+=24)ctx.lineTo(x,y+Math.sin(x*.03+t*.003+i)*4);ctx.stroke()}}
  if(V.wisps){for(let i=0;i<10;i++){let x=(i*173+Math.sin(t*.0009+i)*60)%w,y=(i*91+Math.cos(t*.0011+i)*40)%h,g=ctx.createRadialGradient(x,y,1,x,y,14);g.addColorStop(0,'#c9a8ffcc');g.addColorStop(1,'#c9a8ff00');ctx.fillStyle=g;ctx.fillRect(x-14,y-14,28,28)}}
  return}let base=layer(Math.round(w),Math.round(h),theme,(g,W,H)=>(theme==='mine'?mineBg:theme==='quarry'?quarryBg:forestBg)(g,W,H));ctx.drawImage(base,0,0,w,h);
 if(theme==='mine'){// flickering lanterns on the support frames
  for(let [x,y] of [[29+18,h*.22],[w-63+18,h*.22],[29+18,h*.62],[w-63+18,h*.62]]){let f=.8+Math.sin(t*.008+x)*.12+Math.sin(t*.021+y)*.06,gl=ctx.createRadialGradient(x,y,2,x,y,120*f);gl.addColorStop(0,'#ffcf7a88');gl.addColorStop(1,'#ffcf7a00');ctx.fillStyle=gl;ctx.fillRect(x-130,y-130,260,260);ctx.fillStyle='#ffe2a0';ctx.beginPath();ctx.arc(x,y,4,0,7);ctx.fill()}
  ctx.fillStyle='#0006';let vg=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.35,w/2,h/2,Math.max(w,h)*.7);vg.addColorStop(0,'#0000');vg.addColorStop(1,'#000a');ctx.fillStyle=vg;ctx.fillRect(0,0,w,h)}
 else if(theme==='forest'){// drifting motes
  ctx.fillStyle='#fff7c866';for(let i=0;i<18;i++){let x=(i*137+t*.01*(1+i%3))%w,y=(i*89+Math.sin(t*.001+i)*20)%h;ctx.beginPath();ctx.arc(x,y,1.4,0,7);ctx.fill()}}}
// tile colours per theme (top palette + left/right side)
const TILE={mine:{cave:['#5a4a3a','#62513f','#544536'],rail:['#4e4032','#57483a'],side:['#3a2e22','#2e241a','#4a3c2c','#2a2016']}};
// ---------- mine props ----------
const PROPS=['beam','crystal','cart','pine','standstone','log','mossrock','bush','stalagmite','crates','barrel','orepile'];
function prop(ctx,type,p,w,alpha,t,tile){ctx.save();ctx.globalAlpha=alpha;if(!['beam','crystal','cart'].includes(type)){prop2(ctx,type,p,w,tile||{x:0,y:0});ctx.restore();return}
 if(type==='beam'){let H=w*1.45,x0=p.x-w*.28,x1=p.x+w*.28;ctx.fillStyle='#6a4322';ctx.strokeStyle='#2a1a0c';ctx.lineWidth=1.5;
  for(let x of [x0,x1]){ctx.fillRect(x-w*.05,p.y-H,w*.1,H);ctx.strokeRect(x-w*.05,p.y-H,w*.1,H)}ctx.fillStyle='#7d5129';ctx.fillRect(x0-w*.1,p.y-H-w*.08,x1-x0+w*.2,w*.12);ctx.strokeRect(x0-w*.1,p.y-H-w*.08,x1-x0+w*.2,w*.12);
  let f=.85+Math.sin(t*.01+p.x)*.15,lx=p.x,ly=p.y-H+w*.18,gl=ctx.createRadialGradient(lx,ly,1,lx,ly,w*.9*f);gl.addColorStop(0,'#ffcf7a99');gl.addColorStop(1,'#ffcf7a00');ctx.fillStyle=gl;ctx.beginPath();ctx.arc(lx,ly,w*.9,0,7);ctx.fill();ctx.fillStyle='#ffe6a8';ctx.fillRect(lx-w*.04,ly-w*.05,w*.08,w*.1);ctx.strokeStyle='#3a2a14';ctx.strokeRect(lx-w*.04,ly-w*.05,w*.08,w*.1)}
 else if(type==='crystal'){let cols=[['#7a5ad8','#c4b0ff'],['#3e8fd0','#b4e4ff'],['#a24ad0','#f0b8ff']];[[-.14,.5,.07],[.02,.75,.09],[.16,.45,.06]].forEach(([dx,hh,ww],i)=>{let [c1,c2]=cols[i%3],x=p.x+dx*w,top=p.y-hh*w;let gr=ctx.createLinearGradient(x-ww*w,top,x+ww*w,p.y);gr.addColorStop(0,c2);gr.addColorStop(1,c1);ctx.fillStyle=gr;ctx.strokeStyle='#2a1a48';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x+ww*w,p.y-hh*w*.55);ctx.lineTo(x+ww*w*.7,p.y);ctx.lineTo(x-ww*w*.7,p.y);ctx.lineTo(x-ww*w,p.y-hh*w*.55);ctx.closePath();ctx.fill();ctx.stroke()});
  let gl=ctx.createRadialGradient(p.x,p.y-w*.35,1,p.x,p.y-w*.35,w*.6);gl.addColorStop(0,'#b49aff55');gl.addColorStop(1,'#b49aff00');ctx.fillStyle=gl;ctx.fillRect(p.x-w*.6,p.y-w,w*1.2,w*1.1)}
 else if(type==='cart'){let cw=w*.5,ch=w*.28,y=p.y-w*.12;ctx.fillStyle='#4a4f55';ctx.strokeStyle='#1e2226';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(p.x-cw/2,y-ch);ctx.lineTo(p.x+cw/2,y-ch);ctx.lineTo(p.x+cw*.4,y);ctx.lineTo(p.x-cw*.4,y);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#8a6a4a';for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(p.x-cw*.3+i*cw*.15,y-ch-w*.03,w*.06,0,7);ctx.fill()}ctx.fillStyle='#d0a040';ctx.beginPath();ctx.arc(p.x+cw*.05,y-ch-w*.06,w*.04,0,7);ctx.fill();
  ctx.fillStyle='#22262a';for(let dx of [-.28,.28]){ctx.beginPath();ctx.arc(p.x+dx*cw,y+w*.02,w*.06,0,7);ctx.fill()}}
 ctx.restore()}
// rails on a mine path tile: two steel lines with wooden sleepers, aligned to the neighbouring rail tiles
function rail(ctx,p,ax,w){let L=Math.hypot(ax.x,ax.y)||1,px={x:-ax.y/L*w*.11,y:ax.x/L*w*.055};ctx.save();ctx.strokeStyle='#5a3a1e';ctx.lineWidth=Math.max(2,w*.05);
 for(let i=-1;i<=1;i++){let cx=p.x+ax.x*i*.6,cy=p.y+ax.y*i*.6;ctx.beginPath();ctx.moveTo(cx-px.x*1.6,cy-px.y*1.6);ctx.lineTo(cx+px.x*1.6,cy+px.y*1.6);ctx.stroke()}
 ctx.strokeStyle='#9aa0a8';ctx.lineWidth=Math.max(1.2,w*.025);for(let s of [-1,1]){ctx.beginPath();ctx.moveTo(p.x-ax.x+px.x*s,p.y-ax.y+px.y*s);ctx.lineTo(p.x+ax.x+px.x*s,p.y+ax.y+px.y*s);ctx.stroke()}ctx.restore()}
// ---------- v11b ground types, decorations, more props ----------
const PAL={tallgrass:['#7e9a52','#86a35a','#7a9550'],mud:['#5a4330','#614a35'],shallow:['#5f9fb8','#6aa9c0'],sand:['#d8c08a','#e0c995','#d2b981'],rubble:['#8a8478','#958f82'],crystal:['#5a4a7a','#62528a'],ice:['#bfe3f2','#cdeaf6'],ash:['#3a3532','#433d39'],snow:['#eef4f8','#e4edf3','#f4f8fb'],...TILE.mine};
function hash(x,y,k=0){let n=Math.sin(x*127.1+y*311.7+k*74.7)*43758.5453;return n-Math.floor(n)}
function inDiamond(p,W,H,u,v){return {x:p.x+(u-v)*W*.5,y:p.y+(u+v-1)*H*.5}}// u,v in 0..1 across the tile
function tileDetail(ctx,t,p,W,H,clk){let k=t.kind;ctx.save();
 if(k==='tallgrass')grassBlades(ctx,t,p,W,H,clk,false);
 else if(k==='mud'){ctx.fillStyle='#3e2c1e66';for(let i=0;i<3;i++){let q=inDiamond(p,W,H,hash(t.x,t.y,i),hash(t.x,t.y,i+5));ctx.beginPath();ctx.ellipse(q.x,q.y,W*.07,H*.06,0,0,7);ctx.fill()}ctx.fillStyle='#ffffff22';let b=inDiamond(p,W,H,.4,.5);ctx.beginPath();ctx.ellipse(b.x,b.y,W*.12,H*.05,-.3,0,7);ctx.fill();let bb=(clk*.001+hash(t.x,t.y))%1;if(bb<.5){ctx.strokeStyle='#8a6a4a88';ctx.beginPath();ctx.arc(p.x+W*.08,p.y,W*.025*(1+bb*2),0,7);ctx.stroke()}}
 else if(k==='shallow'){ctx.strokeStyle='#e8f6ff88';ctx.lineWidth=1;for(let i=0;i<2;i++){let ph=(clk*.0006+hash(t.x,t.y,i))%1;ctx.globalAlpha=1-ph;ctx.beginPath();ctx.ellipse(p.x+(hash(t.x,t.y,i+2)-.5)*W*.3,p.y+(hash(t.x,t.y,i+3)-.5)*H*.3,W*(.06+ph*.14),H*(.05+ph*.1),0,0,7);ctx.stroke()}}
 else if(k==='snow'){ctx.fillStyle='#ffffffcc';for(let i=0;i<5;i++){let q=inDiamond(p,W,H,hash(t.x,t.y,i),hash(t.x,t.y,i+9));ctx.beginPath();ctx.arc(q.x,q.y,1.6,0,7);ctx.fill()}ctx.fillStyle='#a8c0d855';for(let i=0;i<3;i++){let q=inDiamond(p,W,H,hash(t.x,t.y,i+3),hash(t.x,t.y,i+5));ctx.fillRect(q.x,q.y,2,1)}}
 else if(k==='sand'){ctx.fillStyle='#a88a5a88';for(let i=0;i<7;i++){let q=inDiamond(p,W,H,hash(t.x,t.y,i),hash(t.x,t.y,i+9));ctx.fillRect(q.x,q.y,1.5,1.5)}ctx.strokeStyle='#b8996655';ctx.beginPath();ctx.moveTo(p.x-W*.2,p.y);ctx.quadraticCurveTo(p.x,p.y-H*.12,p.x+W*.2,p.y);ctx.stroke()}
 else if(k==='rubble'){for(let i=0;i<6;i++){let q=inDiamond(p,W,H,.15+hash(t.x,t.y,i)*.7,.15+hash(t.x,t.y,i+4)*.7),r=W*(.025+hash(t.x,t.y,i+8)*.035);ctx.fillStyle=i%2?'#6e685e':'#a8a294';ctx.strokeStyle='#3e3a34';ctx.beginPath();ctx.ellipse(q.x,q.y,r,r*.7,0,0,7);ctx.fill();ctx.stroke()}}
 else if(k==='crystal'){let f=.6+Math.sin(clk*.003+t.x)*.25;ctx.strokeStyle=`rgba(200,160,255,${f})`;ctx.lineWidth=1.4;ctx.beginPath();let a=inDiamond(p,W,H,.2,.3),b=inDiamond(p,W,H,.5,.55),c=inDiamond(p,W,H,.8,.4),d=inDiamond(p,W,H,.45,.85);ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.moveTo(b.x,b.y);ctx.lineTo(d.x,d.y);ctx.stroke()}
 else if(k==='ice'){ctx.strokeStyle='#ffffffcc';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(p.x-W*.18,p.y+H*.05);ctx.lineTo(p.x-W*.05,p.y-H*.12);ctx.moveTo(p.x+W*.02,p.y+H*.12);ctx.lineTo(p.x+W*.16,p.y-H*.04);ctx.stroke()}
 else if(k==='ash'){for(let i=0;i<4;i++){let q=inDiamond(p,W,H,hash(t.x,t.y,i),hash(t.x,t.y,i+3)),f=Math.sin(clk*.004+i+t.x)*.5+.5;ctx.fillStyle=`rgba(255,${120+f*80},40,${.3+f*.5})`;ctx.fillRect(q.x,q.y,2,2)}ctx.fillStyle='#ffffff10';ctx.beginPath();ctx.ellipse(p.x,p.y-H*.1-(clk*.01%10),W*.08,H*.15,0,0,7);ctx.fill()}
 ctx.restore()}
function grassBlades(ctx,t,p,W,H,clk,front){let n=front?7:9,sway=Math.sin(clk*.002+t.x*.7+t.y)*W*.025;ctx.save();ctx.lineCap='round';
 for(let i=0;i<n;i++){let u=hash(t.x,t.y,i+(front?20:0)),v=front?.55+hash(t.x,t.y,i+40)*.45:hash(t.x,t.y,i+40)*.55,q=inDiamond(p,W,H,u,v),h=W*(.28+hash(t.x,t.y,i+60)*.18)*(front?1.15:1);ctx.strokeStyle=i%3?'#5f7e36':'#86a84a';ctx.lineWidth=Math.max(1.5,W*.03);ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.quadraticCurveTo(q.x+sway*.5,q.y-h*.6,q.x+sway+(u-.5)*W*.12,q.y-h);ctx.stroke()}ctx.restore()}
function grassFront(ctx,t,p,W,H,clk){grassBlades(ctx,t,p,W,H,clk,true)}
// the water/mud surface line drawn over a sunk unit
function waterline(ctx,g,W,kind,clk){ctx.save();let mud=kind==='mud';ctx.fillStyle=mud?'#5a4330dd':'#5f9fb8bb';ctx.beginPath();ctx.ellipse(g.x,g.y,W*.32,W*.1,0,0,7);ctx.fill();ctx.strokeStyle=mud?'#8a6a4a':'#e8f6ff';ctx.lineWidth=1.4;let ph=(clk*.0012)%1;ctx.globalAlpha=1-ph;ctx.beginPath();ctx.ellipse(g.x,g.y,W*(.2+ph*.18),W*(.06+ph*.05),0,0,7);ctx.stroke();ctx.restore()}
function decor(ctx,type,p,W,H,t){let s=W/60;ctx.save();ctx.translate(p.x+(hash(t.x,t.y,7)-.5)*W*.25,p.y+(hash(t.x,t.y,8)-.5)*H*.25);
 const dot=(x,y,r,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(x*s,y*s,r*s,0,7);ctx.fill()};
 if(type==='flowers'){for(let i=0;i<4;i++){let x=(hash(t.x,t.y,i)-.5)*16,y=(hash(t.x,t.y,i+3)-.5)*8;ctx.strokeStyle='#4a6a2a';ctx.lineWidth=s;ctx.beginPath();ctx.moveTo(x*s,y*s);ctx.lineTo(x*s,(y-6)*s);ctx.stroke();dot(x,y-7,2.2,['#f0d040','#e86a8a','#f4f4ff','#a070e0'][i%4])}}
 else if(type==='mushrooms'){for(let [x,y,r] of [[-4,0,4],[3,2,3],[6,-2,2.4]]){ctx.fillStyle='#efe3c8';ctx.fillRect((x-1)*s,(y-r)*s,2*s,r*s);ctx.fillStyle='#c0402a';ctx.beginPath();ctx.ellipse(x*s,(y-r)*s,r*1.3*s,r*.8*s,0,Math.PI,0);ctx.fill();dot(x-1,y-r-1,.7,'#fff')}}
 else if(type==='fern'){ctx.strokeStyle='#3e7a3a';ctx.lineWidth=1.4*s;for(let a=-1;a<=1;a+=.5){ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(a*6*s,-8*s,a*12*s,-6*s);ctx.stroke()}}
 else if(type==='leaves'){for(let i=0;i<5;i++)dot((hash(t.x,t.y,i)-.5)*20,(hash(t.x,t.y,i+5)-.5)*10,2,['#c8782a','#b05a20','#d8a040'][i%3])}
 else if(type==='bones'){ctx.strokeStyle='#e8e0cc';ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo(-6*s,2*s);ctx.lineTo(5*s,-2*s);ctx.stroke();dot(-6,2,1.8,'#e8e0cc');dot(5,-2,1.8,'#e8e0cc');dot(8,3,3,'#ddd4c0');dot(7.2,2.6,.8,'#3a3028')}
 else if(type==='pebbles'){for(let i=0;i<5;i++)dot((hash(t.x,t.y,i)-.5)*18,(hash(t.x,t.y,i+5)-.5)*8,1.6+hash(t.x,t.y,i+9)*1.6,i%2?'#6e665c':'#9a9284')}
 else if(type==='tools'){ctx.strokeStyle='#6a4322';ctx.lineWidth=2*s;ctx.beginPath();ctx.moveTo(-8*s,2*s);ctx.lineTo(6*s,-3*s);ctx.stroke();ctx.strokeStyle='#9aa0a8';ctx.beginPath();ctx.moveTo(4*s,-7*s);ctx.quadraticCurveTo(7*s,-3*s,9*s,1*s);ctx.stroke()}
 else if(type==='lamp'){let f=.7+Math.sin(performance.now()*.008+t.x)*.2,g=ctx.createRadialGradient(0,-5*s,1,0,-5*s,16*s);g.addColorStop(0,`rgba(255,207,122,${.5*f})`);g.addColorStop(1,'rgba(255,207,122,0)');ctx.fillStyle=g;ctx.fillRect(-16*s,-21*s,32*s,32*s);ctx.fillStyle='#3a2a14';ctx.fillRect(-3*s,-2*s,6*s,3*s);ctx.fillStyle='#ffe6a8';ctx.fillRect(-2*s,-8*s,4*s,6*s)}
 else if(type==='web'){ctx.strokeStyle='#ffffff66';ctx.lineWidth=.8;for(let a=0;a<6;a++){ctx.beginPath();ctx.moveTo(0,-4*s);ctx.lineTo(Math.cos(a)*10*s,-4*s+Math.sin(a)*5*s);ctx.stroke()}ctx.beginPath();ctx.ellipse(0,-4*s,6*s,3*s,0,0,7);ctx.stroke()}
 ctx.restore()}
function prop2(ctx,type,p,w,t){let s=w/60;const poly=(pts,fill,stroke='#1e140a')=>{ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(p.x+x*s,p.y+y*s):ctx.moveTo(p.x+x*s,p.y+y*s));ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=1.3;ctx.stroke()};
 if(type==='pine'){ctx.fillStyle='#5a3a1e';ctx.fillRect(p.x-3*s,p.y-16*s,6*s,16*s);for(let [y,wd,c] of [[-16,26,'#2a5a36'],[-40,21,'#2f6a3e'],[-62,15,'#3a7a48'],[-80,9,'#448a52']])poly([[-wd,y],[0,y-34],[wd,y]],c,'#173a22');return}
 if(type==='standstone'){poly([[-11,0],[-13,-48],[-4,-62],[9,-56],[12,0]],'#8a8a84','#3a3a36');ctx.strokeStyle='#6fd0a088';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(p.x-3*s,p.y-44*s);ctx.lineTo(p.x+3*s,p.y-30*s);ctx.lineTo(p.x-2*s,p.y-18*s);ctx.stroke();ctx.fillStyle='#5a8a3a';ctx.beginPath();ctx.ellipse(p.x-6*s,p.y-6*s,8*s,4*s,0,0,7);ctx.fill();return}
 if(type==='log'){ctx.fillStyle='#6a4626';ctx.strokeStyle='#2a1a0c';ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(p.x,p.y-7*s,24*s,8*s,-.35,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#c8a070';ctx.beginPath();ctx.ellipse(p.x+21*s,p.y-15*s,5*s,7*s,-.35,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#5a8a3a';ctx.beginPath();ctx.ellipse(p.x-6*s,p.y-12*s,7*s,3*s,0,0,7);ctx.fill();return}
 if(type==='mossrock'){poly([[-20,0],[-16,-18],[-2,-26],[16,-20],[20,0]],'#7a7a72','#34342e');ctx.fillStyle='#5f8a3a';ctx.beginPath();ctx.ellipse(p.x-4*s,p.y-22*s,13*s,6*s,0,0,7);ctx.fill();return}
 if(type==='bush'){for(let [x,y,r,c] of [[-10,-10,11,'#2f6a3a'],[8,-12,12,'#3a7a44'],[0,-20,12,'#448a4c'],[-2,-8,10,'#356e3e']]){ctx.fillStyle=c;ctx.strokeStyle='#173a22';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(p.x+x*s,p.y+y*s,r*s,0,7);ctx.fill();ctx.stroke()}for(let i=0;i<4;i++){ctx.fillStyle='#d03a3a';ctx.beginPath();ctx.arc(p.x+(hash(t.x,t.y,i)-.5)*30*s,p.y-(8+hash(t.x,t.y,i+3)*16)*s,1.8*s,0,7);ctx.fill()}return}
 if(type==='stalagmite'){poly([[-14,0],[-4,-70],[2,-74],[14,0]],'#6a5a4a','#2a2018');poly([[10,0],[16,-34],[22,0]],'#7a6a58','#2a2018');ctx.strokeStyle='#ffffff22';ctx.beginPath();ctx.moveTo(p.x-2*s,p.y-60*s);ctx.lineTo(p.x-6*s,p.y-10*s);ctx.stroke();return}
 if(type==='crates'){const box=(x,y,sz,c)=>{poly([[x-sz,y],[x+sz,y],[x+sz,y-sz*1.6],[x-sz,y-sz*1.6]],c,'#2a1a0c');ctx.strokeStyle='#4a2e14';ctx.beginPath();ctx.moveTo(p.x+(x-sz)*s,p.y+y*s);ctx.lineTo(p.x+(x+sz)*s,p.y+(y-sz*1.6)*s);ctx.stroke()};box(-8,0,10,'#9a6a3a');box(10,-2,8,'#8a5a2e');box(-2,-16,8,'#a8743e');return}
 if(type==='barrel'){ctx.fillStyle='#7a4a24';ctx.strokeStyle='#2a1a0c';ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(p.x,p.y-14*s,11*s,15*s,0,0,7);ctx.fill();ctx.stroke();ctx.strokeStyle='#4a4f55';ctx.lineWidth=2*s;for(let y of [-22,-6]){ctx.beginPath();ctx.ellipse(p.x,p.y+y*s,10.5*s,2.5*s,0,0,Math.PI);ctx.stroke()}ctx.fillStyle='#c0402a';ctx.font=`bold ${9*s}px sans-serif`;ctx.textAlign='center';ctx.fillText('✹',p.x,p.y-10*s);return}
 if(type==='orepile'){for(let i=0;i<9;i++){let x=(hash(t.x,t.y,i)-.5)*30,y=-hash(t.x,t.y,i+4)*14,r=4+hash(t.x,t.y,i+8)*4;ctx.fillStyle=i%4===0?'#d0a040':i%3===0?'#8a6be0':'#6e665c';ctx.strokeStyle='#2a2420';ctx.lineWidth=1;ctx.beginPath();ctx.arc(p.x+x*s,p.y+y*s,r*s,0,7);ctx.fill();ctx.stroke()}return}}

// ---------- monsters ----------
function eye(g,x,y,r,col='#1a1208'){g.fillStyle='#fff8';g.beginPath();g.arc(x,y,r*1.4,0,7);g.fill();g.fillStyle=col;g.beginPath();g.arc(x,y,r,0,7);g.fill()}
function ell(g,x,y,rx,ry,fill,stroke='#1a120a',lw=1.5){g.beginPath();g.ellipse(x,y,Math.abs(rx),Math.abs(ry),0,0,7);g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke()}}
function wolf(g,h,back,t,o){let s=h/100,body=o.dark?'#2a2630':o.alpha?'#c8ccd2':'#7d7a76',belly=o.dark?'#3c3644':o.alpha?'#eef0f2':'#a8a39c',bob=Math.sin(t*.01)*1.5*s;
 g.save();g.translate(0,bob);
 // legs
 g.fillStyle=body;for(let x of [-22,-12,14,24])g.fillRect(x*s,-24*s,6*s,24*s);
 // tail
 g.strokeStyle=body;g.lineWidth=7*s;g.lineCap='round';g.beginPath();g.moveTo(26*s,-40*s);g.quadraticCurveTo(44*s,-52*s+Math.sin(t*.012)*4*s,40*s,-30*s);g.stroke();
 ell(g,2*s,-36*s,30*s,15*s,body);ell(g,0,-30*s,22*s,7*s,belly,null);
 if(o.alpha){g.fillStyle='#e8eaee';g.beginPath();g.moveTo(-22*s,-50*s);for(let i=0;i<6;i++)g.lineTo((-22+i*6)*s,(-56+(i%2)*8)*s);g.lineTo(6*s,-44*s);g.fill()}
 if(back){// back view: head turned away, ears visible, no face
  ell(g,-22*s,-50*s,12*s,11*s,body);g.fillStyle=body;g.beginPath();g.moveTo(-30*s,-56*s);g.lineTo(-26*s,-70*s);g.lineTo(-22*s,-57*s);g.moveTo(-20*s,-57*s);g.lineTo(-15*s,-70*s);g.lineTo(-13*s,-55*s);g.fill()}
 else{ell(g,-26*s,-48*s,13*s,12*s,body);g.fillStyle=body;g.beginPath();g.moveTo(-38*s,-46*s);g.lineTo(-50*s,-40*s);g.lineTo(-36*s,-38*s);g.fill();g.fillStyle='#1a1208';g.beginPath();g.arc(-49*s,-41*s,2.2*s,0,7);g.fill();
  g.fillStyle=body;g.beginPath();g.moveTo(-32*s,-56*s);g.lineTo(-30*s,-70*s);g.lineTo(-24*s,-57*s);g.moveTo(-22*s,-58*s);g.lineTo(-17*s,-70*s);g.lineTo(-15*s,-55*s);g.fill();
  eye(g,-31*s,-50*s,2.2*s,o.dark?'#ff3020':o.alpha?'#3080ff':'#e0a020')}
 g.restore()}
function humanoid(g,h,back,t,o){let s=h/100,bob=Math.sin(t*.008)*1.2*s;g.save();g.translate(0,bob);
 g.fillStyle=o.pants;g.fillRect(-11*s,-34*s,9*s,34*s);g.fillRect(2*s,-34*s,9*s,34*s);g.fillStyle='#2a1a0c';g.fillRect(-12*s,-4*s,11*s,4*s);g.fillRect(1*s,-4*s,11*s,4*s);
 g.fillStyle=o.cloth;g.strokeStyle='#1a120a';g.lineWidth=1.5;g.beginPath();g.moveTo(-17*s,-70*s);g.lineTo(17*s,-70*s);g.lineTo(20*s,-30*s);g.lineTo(-20*s,-30*s);g.closePath();g.fill();g.stroke();
 g.fillStyle=o.belt||'#4a2e14';g.fillRect(-19*s,-40*s,38*s,5*s);
 // weapon arm (behind body in back view)
 const weapon=()=>{g.save();g.translate(18*s,-55*s);g.rotate(o.bow?0:-.5+Math.sin(t*.006)*.05);if(o.bow){g.strokeStyle='#6a4322';g.lineWidth=3*s;g.beginPath();g.arc(4*s,0,22*s,-1.2,1.2);g.stroke();g.strokeStyle='#ddd';g.lineWidth=1;g.beginPath();g.moveTo(11*s,-20*s);g.lineTo(11*s,20*s);g.stroke()}else if(o.pick){g.fillStyle='#6a4322';g.fillRect(-2*s,-30*s,4*s,34*s);g.fillStyle='#8a9098';g.beginPath();g.moveTo(-14*s,-30*s);g.quadraticCurveTo(0,-38*s,14*s,-30*s);g.lineTo(0,-32*s);g.fill()}else{g.fillStyle='#c8cdd2';g.fillRect(-2*s,-32*s,4*s,30*s);g.fillStyle='#6a4322';g.fillRect(-6*s,-4*s,12*s,4*s)}g.restore()};
 if(back)weapon();
 g.fillStyle=o.skin;ell(g,0,-80*s,12*s,12*s,o.hood?o.hood:o.skin);
 if(!back){if(o.hood){g.fillStyle=o.skin;ell(g,0,-78*s,8*s,8*s,o.skin,null)}eye(g,-4*s,-79*s,1.8*s,o.eyes||'#1a1208');eye(g,4*s,-79*s,1.8*s,o.eyes||'#1a1208');if(o.mask){g.fillStyle=o.mask;g.fillRect(-9*s,-76*s,18*s,6*s)}}
 if(o.helmet){g.fillStyle=o.helmet;g.beginPath();g.arc(0,-84*s,13*s,Math.PI,0);g.fill();g.strokeStyle='#1a120a';g.stroke();if(!back){g.fillStyle='#ffe6a0';g.beginPath();g.arc(0,-92*s,3.5*s,0,7);g.fill();let gl=g.createRadialGradient(0,-92*s,1,0,-92*s,18*s);gl.addColorStop(0,'#ffe6a088');gl.addColorStop(1,'#ffe6a000');g.fillStyle=gl;g.fillRect(-20*s,-112*s,40*s,40*s)}}
 if(!back)weapon();g.restore()}
function treant(g,h,back,t){let s=h/100,sw=Math.sin(t*.004)*2*s;g.fillStyle='#4a3420';g.strokeStyle='#1e140a';g.lineWidth=2;
 g.beginPath();g.moveTo(-22*s,0);g.quadraticCurveTo(-16*s,-40*s,-18*s,-70*s);g.lineTo(18*s,-70*s);g.quadraticCurveTo(16*s,-40*s,22*s,0);g.closePath();g.fill();g.stroke();
 for(let [x,dir] of [[-18,-1],[18,1]]){g.lineWidth=7*s;g.strokeStyle='#4a3420';g.beginPath();g.moveTo(x*s,-55*s);g.quadraticCurveTo((x+dir*18)*s,(-60)*s+sw,(x+dir*26)*s,-36*s+sw);g.stroke()}
 g.fillStyle='#2f5a2a';for(let [x,y,r] of [[-18,-82,20],[14,-86,22],[0,-100,22],[-28,-70,14],[28,-70,14]]){g.beginPath();g.arc(x*s,y*s+sw*.5,r*s,0,7);g.fill()}g.fillStyle='#3f7a35';for(let [x,y,r] of [[-8,-96,12],[18,-90,10]]){g.beginPath();g.arc(x*s,y*s,r*s,0,7);g.fill()}
 g.strokeStyle='#2a1c10';g.lineWidth=1.5;for(let i=0;i<4;i++){g.beginPath();g.moveTo((-12+i*8)*s,-8*s);g.lineTo((-10+i*7)*s,-60*s);g.stroke()}
 if(!back){g.fillStyle='#1a0e06';g.beginPath();g.ellipse(-7*s,-50*s,4*s,3*s,0,0,7);g.ellipse(7*s,-50*s,4*s,3*s,0,0,7);g.fill();g.fillStyle='#ff9a30';g.beginPath();g.arc(-7*s,-50*s,1.8*s,0,7);g.arc(7*s,-50*s,1.8*s,0,7);g.fill();g.fillStyle='#1a0e06';g.beginPath();g.ellipse(0,-36*s,8*s,4*s,0,0,7);g.fill()}}
function bat(g,h,back,t){let s=h/100,fl=Math.sin(t*.03)*14*s,y=-60*s+Math.sin(t*.01)*4*s;g.fillStyle='#3a2a3a';g.strokeStyle='#120a12';g.lineWidth=1.2;
 for(let d of [-1,1]){g.beginPath();g.moveTo(0,y);g.quadraticCurveTo(d*24*s,y-24*s-fl,d*44*s,y-6*s-fl);g.quadraticCurveTo(d*30*s,y+2*s,d*22*s,y+10*s);g.quadraticCurveTo(d*12*s,y+2*s,0,y+8*s);g.fill();g.stroke()}
 ell(g,0,y,10*s,13*s,'#4a3448','#120a12');g.fillStyle='#4a3448';g.beginPath();g.moveTo(-7*s,y-10*s);g.lineTo(-9*s,y-22*s);g.lineTo(-2*s,y-12*s);g.moveTo(7*s,y-10*s);g.lineTo(9*s,y-22*s);g.lineTo(2*s,y-12*s);g.fill();
 if(!back){eye(g,-4*s,y-4*s,2*s,'#ff4040');eye(g,4*s,y-4*s,2*s,'#ff4040');g.fillStyle='#fff';g.beginPath();g.moveTo(-3*s,y+4*s);g.lineTo(-2*s,y+8*s);g.lineTo(-1*s,y+4*s);g.moveTo(1*s,y+4*s);g.lineTo(2*s,y+8*s);g.lineTo(3*s,y+4*s);g.fill()}
 g.fillStyle='#0004';g.beginPath();g.ellipse(0,0,14*s,4*s,0,0,7);g.fill()}
function slime(g,h,back,t){let s=h/100,sq=1+Math.sin(t*.008)*.06;g.save();g.scale(1/sq,sq);let gr=g.createRadialGradient(-8*s,-40*s,4*s,0,-24*s,40*s);gr.addColorStop(0,'#b8f0d0');gr.addColorStop(1,'#3a9a78');g.fillStyle=gr;g.strokeStyle='#1a4a38';g.lineWidth=2;
 g.beginPath();g.moveTo(-34*s,0);g.quadraticCurveTo(-36*s,-50*s,0,-56*s);g.quadraticCurveTo(36*s,-50*s,34*s,0);g.closePath();g.fill();g.stroke();
 g.fillStyle='#8a6be0';for(let [x,y] of [[-14,-20],[12,-30],[4,-12]]){g.beginPath();g.moveTo(x*s,(y-6)*s);g.lineTo((x+4)*s,y*s);g.lineTo(x*s,(y+4)*s);g.lineTo((x-4)*s,y*s);g.fill()}
 if(!back){eye(g,-10*s,-34*s,3*s);eye(g,10*s,-34*s,3*s);g.strokeStyle='#1a4a38';g.beginPath();g.arc(0,-26*s,6*s,.2,Math.PI-.2);g.stroke()}else{g.fillStyle='#ffffff55';g.beginPath();g.ellipse(-10*s,-40*s,8*s,4*s,-.5,0,7);g.fill()}g.restore()}
function golem(g,h,back,t,o){let s=h/100,c1=o.crystal?'#6a5a8a':'#7a7268',c2=o.crystal?'#8a78b0':'#958c80',glow=o.crystal?'#c07aff':'#ffb040';
 const block=(x,y,w,hh,c=c1)=>{g.fillStyle=c;g.strokeStyle='#221c18';g.lineWidth=2;g.fillRect(x*s,y*s,w*s,hh*s);g.strokeRect(x*s,y*s,w*s,hh*s)};
 block(-22,-26,16,26);block(6,-26,16,26);block(-28,-72,56,48,c2);block(-42,-68,14,40);block(28,-68,14,40);block(-46,-30,20,14);block(26,-30,20,14);
 block(-14,-94,28,24);
 if(o.crystal)for(let [x,hh] of [[-10,22],[0,30],[10,22]]){g.fillStyle='#d0a8ff';g.strokeStyle='#4a2a70';g.beginPath();g.moveTo((x-4)*s,-94*s);g.lineTo(x*s,(-94-hh)*s);g.lineTo((x+4)*s,-94*s);g.fill();g.stroke()}
 if(!back){let f=.7+Math.sin(t*.006)*.3;g.fillStyle=glow;g.globalAlpha=f;g.fillRect(-8*s,-86*s,5*s,4*s);g.fillRect(3*s,-86*s,5*s,4*s);g.beginPath();g.arc(0,-50*s,7*s,0,7);g.fill();g.globalAlpha=1}
 else{g.strokeStyle='#221c18';g.lineWidth=1.5;g.beginPath();g.moveTo(-20*s,-60*s);g.lineTo(20*s,-40*s);g.moveTo(-10*s,-70*s);g.lineTo(-14*s,-30*s);g.stroke()}}
const LOOK={
 wolf:(g,h,b,t,u,T)=>wolf(g,h,b,t,{dark:T.dark}),alpha:(g,h,b,t)=>wolf(g,h,b,t,{alpha:true}),
 bandit:(g,h,b,t)=>humanoid(g,h,b,t,{pants:'#3a3028',cloth:'#6a4a2a',skin:'#d8a878',hood:'#3a2a1a',mask:'#2a1a10'}),
 poacher:(g,h,b,t)=>humanoid(g,h,b,t,{pants:'#2a3a22',cloth:'#3e5a32',skin:'#d0a070',hood:'#2a3a1e',bow:true}),
 kobold:(g,h,b,t,u,T)=>humanoid(g,h,b,t,{pants:'#5a3a1e',cloth:T.chief?'#8a2a1a':'#7a5a2a',skin:'#d07a3a',helmet:T.chief?'#c8a030':'#8a7a5a',pick:true,eyes:'#ffdf40'}),
 treant:(g,h,b,t)=>treant(g,h,b,t),bat:(g,h,b,t)=>bat(g,h,b,t),slime:(g,h,b,t)=>slime(g,h,b,t),
 golem:(g,h,b,t)=>golem(g,h,b,t,{}),crystal:(g,h,b,t)=>golem(g,h,b,t,{crystal:true})};
function monster(ctx,T,u,p,h,dir,t){if(T.filter&&!ctx._mf){ctx.save();ctx.filter=T.filter;ctx._mf=1;try{return monster(ctx,T,u,p,h,dir,t)}finally{ctx._mf=0;ctx.restore()}}let f=LOOK[T.draw];if(!f)return false;let back=dir==='NE'||dir==='NW',mirror=dir==='SE'||dir==='NE';
 ctx.save();ctx.translate(p.x,p.y);if(mirror)ctx.scale(-1,1);if(u.hp<=0){ctx.rotate(Math.PI*.42);ctx.globalAlpha=.5}f(ctx,h,back,t+(u.id?.length||0)*300,u,T);ctx.restore();return true}
window.TacticsScenery={VARIANT,background,prop,PROPS,rail,TILE,PAL,tileDetail,grassFront,waterline,decor,monster,LOOK};
})();
