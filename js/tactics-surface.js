/* Visual geometry only: integer rule heights and movement costs are untouched. */
(function(root){'use strict';
const natural=new Set(['grass','tallgrass','path','snow','thinsnow','sand','ash']);
function at(m,x,y){if(x<0||y<0||x>=(m.width||m.size)||y>=(m.height||m.size))return null;return m.tiles[y*(m.width||m.size)+x]||null}
function eligible(t){return !!t&&natural.has(t.kind)&&!t.prop&&!t.objectId&&!t.blocked}
const caches=new WeakMap();
function corners(m,t,version=0){if(!eligible(t))return [t.h,t.h,t.h,t.h];let cache=caches.get(m);if(!cache||cache.version!==version){cache={version,tiles:new Map()};caches.set(m,cache)}let near=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){let n=at(m,t.x+dx,t.y+dy);near.push(n?`${n.h}/${n.kind}/${n.prop}/${n.objectId}/${n.blocked}`:'-')}let sig=near.join('|'),old=cache.tiles.get(t);if(old?.sig===sig)return old.value;let value=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx,sy])=>{let ns=[t,at(m,t.x+sx,t.y),at(m,t.x,t.y+sy),at(m,t.x+sx,t.y+sy)];if(ns.some(n=>!eligible(n)))return t.h;let hs=ns.map(n=>n.h);return Math.max(...hs)-Math.min(...hs)<=1?hs.reduce((a,b)=>a+b)/4:t.h});cache.tiles.set(t,{sig,value});return value}
function height(m,x,y,version=0){let t=at(m,Math.floor(x+.5),Math.floor(y+.5));if(!t)return 0;let c=corners(m,t,version),dx=x-t.x,dy=y-t.y,ax=Math.abs(dx),ay=Math.abs(dy);let edge;if(ay>=ax){let f=(dx+.5)/1,top=dy<0;edge=top?c[0]+(c[1]-c[0])*f:c[3]+(c[2]-c[3])*f;let k=ay*2;let u=ax/(ay||1);if(ay){let bx=dx/(2*ay),ff=bx+.5;edge=top?c[0]+(c[1]-c[0])*ff:c[3]+(c[2]-c[3])*ff}return t.h+(edge-t.h)*k}else{let f=dy/(2*ax)+.5;edge=dx<0?c[0]+(c[3]-c[0])*f:c[1]+(c[2]-c[1])*f;return t.h+(edge-t.h)*ax*2}}
function contains(p,x,y){let inside=false;for(let i=0,j=p.length-1;i<p.length;j=i++){let a=p[i],b=p[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside}return inside}
root.TacticsSurface={at,eligible,corners,height,contains};if(typeof module!=='undefined')module.exports=root.TacticsSurface;
})(globalThis);
