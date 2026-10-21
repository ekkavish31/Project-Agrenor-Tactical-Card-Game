/* Match village camera stabilization in the market, with an explicit overview. */
(function(){'use strict';let follow=true,cam=null;
function spring(v,velocity,target,dt){const w=18,x=v-target,e=Math.exp(-w*dt),k=velocity+w*x;return{value:target+(x+k*dt)*e,velocity:(velocity-w*k*dt)*e}}
focus=function(){const p=project(hero.u,hero.v);pan={x:-(p.x-1100)*scale*zoom,y:80*.4375*scale*zoom-(p.y-700)*scale*zoom};cam={...pan,vx:0,vy:0};follow=true};
const fit=$('fit').onclick;$('fit').onclick=()=>{fit();follow=false;cam=null};$('focus').onclick=focus;
function update(dt){if(drag?.moved)return;if(path.length)follow=true;if(!follow)return;const p=project(hero.u,hero.v),tx=-(p.x-1100)*scale*zoom,ty=80*.4375*scale*zoom-(p.y-700)*scale*zoom;if(!cam||Math.hypot(pan.x-cam.x,pan.y-cam.y)>4)cam={...pan,vx:0,vy:0};const x=spring(cam.x,cam.vx,tx,dt),y=spring(cam.y,cam.vy,ty,dt);cam={x:x.value,y:y.value,vx:x.velocity,vy:y.velocity};if(path.length&&Math.hypot(cam.x-tx,cam.y-ty)<160){cam.x=tx+Math.max(-20,Math.min(20,cam.x-tx));cam.y=ty+Math.max(-20,Math.min(20,cam.y-ty))}pan={x:cam.x,y:cam.y}}
window.MarketCamera={update,getState:()=>({follow,cam})};focus();})();
