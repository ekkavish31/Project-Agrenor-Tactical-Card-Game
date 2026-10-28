/* v93 · Code-drawn placeholder art for battle cards that have no picture yet.
   For every movement / combat card whose 'tactic-card-<id>' asset is missing, a picture is painted on a canvas
   (element-coloured background + light + a large icon) and registered in ASSET_MANIFEST with status 'temp'.
   The card frame, title bar and text boxes stay the real Card Studio templates; only the art window uses this.
   When real art is added to the manifest, it wins automatically (this script only fills gaps). */
(function(root){'use strict';
const M=root.ASSET_MANIFEST,T=root.TacticsDecks;if(!M?.assets||!T||typeof document==='undefined')return;
const has=id=>M.assets.some(a=>a.id===id&&a.file&&['final','temp'].includes(a.status));
// element palette: [deep, mid, glow]
const PAL={wind:['#12313f','#2f7f96','#c8f2ff'],dark:['#140c22','#4b2f78','#d2b4ff'],water:['#0c2a44','#1f6f9c','#a8e6ff'],light:['#3a2808','#9a7420','#fff0b8'],
 earth:['#2a1a0c','#7a5328','#ffd38a'],nature:['#0f2a16','#3f7a3a','#c8f5a0'],fire:['#2a0c06','#9a3a18','#ffc27a']};
const LOOK={thunder:['wind','bolt'],backstab:['dark','backstab'],dive:['wind','dive'],tide:['water','wave'],formation:['light','formation'],
 counter:['earth','counter'],evade:['wind','evade'],firstAid:['nature','aid'],ambush:['dark','eye'],
 // fallbacks for any other card that may lose its art
 attack:['earth','sword'],skill:['fire','burst'],guard:['light','shield'],rest:['nature','leaf'],push:['earth','burst'],step:['nature','boot'],walk:['wind','boot'],run:['wind','boot'],sprint:['fire','boot'],dash:['wind','boot'],creep:['dark','boot']};
const W=600,H=640,CY=.36;// same shape as the card's art window; the lower third sits under the card's middle bar, so the icon is centred higher
function rng(seed){let h=2166136261;for(const c of seed)h=Math.imul(h^c.charCodeAt(0),16777619);return()=>{h+=0x6D2B79F5;let t=Math.imul(h^h>>>15,1|h);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296}}
function backdrop(g,p,r){const[deep,mid,glow]=p;let gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,mid);gr.addColorStop(1,deep);g.fillStyle=gr;g.fillRect(0,0,W,H);
 // light pool behind the icon
 gr=g.createRadialGradient(W/2,H*CY,10,W/2,H*CY,W*.6);gr.addColorStop(0,glow+'cc');gr.addColorStop(.35,glow+'33');gr.addColorStop(1,'#0000');g.fillStyle=gr;g.fillRect(0,0,W,H);
 // rays
 g.save();g.translate(W/2,H*CY);g.globalCompositeOperation='screen';for(let i=0;i<18;i++){g.rotate(Math.PI*2/18);g.fillStyle=glow+(i%2?'14':'0c');g.beginPath();g.moveTo(0,0);g.lineTo(W,-26-r()*30);g.lineTo(W,26+r()*30);g.fill()}g.restore();
 // rune ring
 g.save();g.translate(W/2,H*CY);g.strokeStyle=glow+'55';g.lineWidth=3;g.beginPath();g.arc(0,0,160,0,Math.PI*2);g.stroke();g.lineWidth=1.5;g.setLineDash([6,10]);g.beginPath();g.arc(0,0,182,0,Math.PI*2);g.stroke();g.setLineDash([]);
 for(let i=0;i<12;i++){g.rotate(Math.PI/6);g.fillStyle=glow+'88';g.fillRect(-3,-170,6,12)}g.restore();
 // motes
 g.globalCompositeOperation='screen';for(let i=0;i<70;i++){const x=r()*W,y=r()*H,s=1+r()*4;const m=g.createRadialGradient(x,y,0,x,y,s*3);m.addColorStop(0,glow+'ee');m.addColorStop(1,'#0000');g.fillStyle=m;g.beginPath();g.arc(x,y,s*3,0,Math.PI*2);g.fill()}g.globalCompositeOperation='source-over';
 // vignette
 gr=g.createRadialGradient(W/2,H/2,W*.35,W/2,H/2,W*.85);gr.addColorStop(0,'#0000');gr.addColorStop(1,'#000a');g.fillStyle=gr;g.fillRect(0,0,W,H)}
// icon paths are drawn around (0,0) in a ~360 px box, then filled with a metal gradient + glow + dark outline
const ICON={
 bolt(g){g.moveTo(40,-180);g.lineTo(-90,20);g.lineTo(-5,20);g.lineTo(-50,180);g.lineTo(100,-40);g.lineTo(10,-40);g.closePath()},
 sword(g){g.moveTo(0,-180);g.lineTo(26,-140);g.lineTo(18,70);g.lineTo(80,70);g.lineTo(80,96);g.lineTo(16,96);g.lineTo(16,170);g.lineTo(-16,170);g.lineTo(-16,96);g.lineTo(-80,96);g.lineTo(-80,70);g.lineTo(-18,70);g.lineTo(-26,-140);g.closePath()},
 backstab(g){g.save();g.translate(40,0);g.rotate(.75);ICON.sword(g);g.restore();g.moveTo(-190,-150);g.quadraticCurveTo(-60,-60,-150,170);g.lineTo(-185,170);g.quadraticCurveTo(-110,-40,-200,-120);g.closePath()},
 dive(g){g.moveTo(-40,-180);g.lineTo(40,-180);g.lineTo(40,30);g.lineTo(110,30);g.lineTo(0,160);g.lineTo(-110,30);g.lineTo(-40,30);g.closePath();g.rect(-200,170,120,14);g.rect(80,170,120,14);g.rect(-170,140,50,10);g.rect(120,140,50,10)},
 wave(g){g.moveTo(-200,60);g.quadraticCurveTo(-160,-170,30,-160);g.quadraticCurveTo(150,-150,170,-60);g.quadraticCurveTo(90,-120,30,-80);g.quadraticCurveTo(-20,-40,40,0);g.quadraticCurveTo(110,30,200,0);g.lineTo(200,130);g.quadraticCurveTo(0,90,-200,130);g.closePath()},
 shield(g){g.moveTo(0,-170);g.quadraticCurveTo(120,-150,150,-110);g.quadraticCurveTo(150,60,0,175);g.quadraticCurveTo(-150,60,-150,-110);g.quadraticCurveTo(-120,-150,0,-170);g.closePath()},
 formation(g){const sh=(cx,cy,s)=>{g.moveTo(cx,cy-100*s);g.quadraticCurveTo(cx+70*s,cy-88*s,cx+88*s,cy-64*s);g.quadraticCurveTo(cx+88*s,cy+35*s,cx,cy+102*s);g.quadraticCurveTo(cx-88*s,cy+35*s,cx-88*s,cy-64*s);g.quadraticCurveTo(cx-70*s,cy-88*s,cx,cy-100*s);g.closePath()};sh(0,-60,1.05);sh(-115,80,.85);sh(115,80,.85)},
 counter(g){g.save();g.translate(-40,10);g.scale(.8,.8);ICON.shield(g);g.restore();g.moveTo(90,-150);g.quadraticCurveTo(220,-60,160,90);g.lineTo(200,100);g.lineTo(120,180);g.lineTo(100,70);g.lineTo(135,82);g.quadraticCurveTo(180,-50,70,-125);g.closePath()},
 evade(g){g.arc(40,-120,42,0,Math.PI*2);g.moveTo(0,-60);g.lineTo(80,-60);g.lineTo(100,40);g.lineTo(150,150);g.lineTo(110,165);g.lineTo(55,60);g.lineTo(20,170);g.lineTo(-25,160);g.lineTo(10,30);g.closePath();for(let i=0;i<3;i++)g.rect(-180+i*20,-40+i*60,110-i*20,12)},
 aid(g){g.rect(-40,-150,80,300);g.rect(-150,-40,300,80)},
 eye(g){g.moveTo(-180,0);g.quadraticCurveTo(0,-150,180,0);g.quadraticCurveTo(0,150,-180,0);g.closePath();for(let i=0;i<5;i++){const x=-160+i*80;g.moveTo(x,150);g.quadraticCurveTo(x+25,90,x+10,40);g.quadraticCurveTo(x+45,95,x+40,150);g.closePath()}},
 burst(g){for(let i=0;i<12;i++){const a=i/12*Math.PI*2,r=i%2?90:180;i?g.lineTo(Math.cos(a)*r,Math.sin(a)*r):g.moveTo(Math.cos(a)*r,Math.sin(a)*r)}g.closePath()},
 leaf(g){g.moveTo(0,-180);g.quadraticCurveTo(170,-40,0,180);g.quadraticCurveTo(-170,-40,0,-180);g.closePath()},
 boot(g){g.moveTo(-60,-170);g.lineTo(40,-170);g.lineTo(40,40);g.lineTo(150,90);g.lineTo(150,150);g.lineTo(-60,150);g.closePath()}};
// details drawn on top (pupil, cross on the shield …)
const EXTRA={eye(g,glow){g.fillStyle='#120a1e';g.beginPath();g.arc(0,0,58,0,Math.PI*2);g.fill();g.fillStyle=glow;g.beginPath();g.arc(0,0,22,0,Math.PI*2);g.fill()},
 aid(g,glow){g.strokeStyle='#ffffffaa';g.lineWidth=6;g.strokeRect(-30,-140,60,280);g.strokeRect(-140,-30,280,60)}};
function icon(g,kind,p){const[deep,mid,glow]=p;g.save();g.translate(W/2,H*CY);g.scale(.6,.6);
 g.beginPath();(ICON[kind]||ICON.burst)(g);
 g.shadowColor=glow;g.shadowBlur=70;g.fillStyle=glow;g.fill();g.shadowBlur=0;
 const metal=g.createLinearGradient(-180,-180,180,180);metal.addColorStop(0,'#fffdf6');metal.addColorStop(.5,glow);metal.addColorStop(1,mid);g.fillStyle=metal;g.fill();
 g.lineJoin='round';g.lineWidth=10;g.strokeStyle=deep+'ee';g.stroke();g.lineWidth=3;g.strokeStyle='#ffffffaa';g.stroke();
 EXTRA[kind]?.(g,glow);g.restore()}
function paint(id){const[el,kind]=LOOK[id]||['earth','burst'],p=PAL[el]||PAL.earth,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),r=rng(id);
 backdrop(g,p,r);icon(g,kind,p);
 // a soft sweep of light across the top
 const sw=g.createLinearGradient(0,0,W,H*.6);sw.addColorStop(0,'#ffffff22');sw.addColorStop(.5,'#0000');g.fillStyle=sw;g.fillRect(0,0,W,H);
 let url='';try{url=c.toDataURL('image/webp',.86)}catch{}if(!/^data:image\/webp/.test(url))url=c.toDataURL('image/png');return url}
const made=[];
for(const [group,prefix] of [[T.MOVE,'m'],[T.COMBAT,'a']])for(const id of Object.keys(group)){const key='tactic-card-'+id;if(has(key)||!LOOK[id])continue;
 try{const file=paint(id);M.assets=M.assets.filter(a=>a.id!==key);M.assets.push({id:key,file,status:'temp',category:'tactic-cards',subject:'ภาพชั่วคราววาดด้วยโค้ด',generated:true});made.push(id)}catch(e){console.warn('[code-card-art]',id,e)}}
root.CodeCardArt={made,paint};
})(globalThis);
