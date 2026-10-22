/* Raster terrain, shared hero sampling, and sprite-aware character occlusion. */
(function(root){
 'use strict';
 const images=new Map(),masks=new WeakMap(),patterns=new WeakMap(),listeners=new Set();
 let motion=typeof TACTICS_SPRITES!=='undefined'?HeroMotion.snapshot(TACTICS_SPRITES):null,heroScreen=null,heroPainted=false;
 const files={grass:'grass.png',paving:'paving.png',soil:'soil.png',details:'meadow-details.png',pond:'garden-pond.png',materials:'market-materials.png',equipment:'market-equipment.png',orders:'market-orders.png',props:'props.png',fountain:'fountain.png'};
 function image(src){if(!images.has(src)){const im=new Image();im.onload=()=>listeners.forEach(f=>f());im.src=src;images.set(src,im)}return images.get(src)}
 function asset(id){return image('assets/village-town/'+(files[id]||id))}
 function pattern(g,id){const im=asset(id);if(!im.complete||!im.naturalWidth)return null;let cache=patterns.get(g);if(!cache)patterns.set(g,cache=new Map());if(!cache.has(id)){const c=document.createElement('canvas');c.width=c.height=id==='paving'?600:420;c.getContext('2d').drawImage(im,0,0,c.width,c.height);cache.set(id,g.createPattern(c,'repeat'))}return cache.get(id)}
 function mask(im){const pre=root.VillageAlpha?.get(im.src,im.naturalWidth,im.naturalHeight);if(pre)return pre;if(masks.has(im))return masks.get(im);let out=null;try{const c=document.createElement('canvas');c.width=256;c.height=Math.max(1,Math.round(256*im.naturalHeight/im.naturalWidth));const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0,c.width,c.height);out={w:c.width,h:c.height,data:g.getImageData(0,0,c.width,c.height).data}}catch{}masks.set(im,out);return out}
 function begin(g,p){heroPainted=false;heroScreen=new DOMPoint(p.x,p.y).matrixTransform(g.getTransform())}
 function draw(g,im,crop,rect,hero){if(!im?.complete||!im.naturalWidth)return;let alpha=1;const [x,y,w,h]=rect;
  if(heroPainted&&heroScreen&&hero){const p=heroScreen.matrixTransform(g.getTransform().inverse()),m=mask(im),src=crop||[0,0,im.naturalWidth,im.naturalHeight];if(p.y<y+h*.98){for(const lift of [12,30,48]){const px=p.x,py=p.y-lift;if(px<x||px>x+w||py<y||py>y+h)continue;let opaque=true;if(m){const sx=(src[0]+(px-x)/w*src[2])/im.naturalWidth,sy=(src[1]+(py-y)/h*src[3])/im.naturalHeight,ix=Math.floor(sx*m.w),iy=Math.floor(sy*m.h);opaque=(m.data[(iy*m.w+ix)*4+3]||0)>45}if(opaque){alpha=.42;break}}}}
  g.save();g.globalAlpha*=alpha;if(im._townHovered)outline(g,im,crop,rect,3);if(crop)g.drawImage(im,...crop,...rect);else g.drawImage(im,...rect);g.restore();return alpha;
 }
 function sprite(g,id,p,w,h,pivot=[.5,.92],fade=false){const im=asset(id);if(!im.complete||!im.naturalWidth)return;h=h||w*im.naturalHeight/im.naturalWidth;return draw(g,im,null,[p.x-w*pivot[0],p.y-h*pivot[1],w,h],fade?p:null)}
 function detail(g,index,p,w=40){const im=asset('details');if(!im.complete||!im.naturalWidth)return;const sw=im.naturalWidth/2,sh=im.naturalHeight/2;g.drawImage(im,index%2*sw,Math.floor(index/2)*sh,sw,sh,p.x-w/2,p.y-w*.7,w,w)}
 // d8 = exact 8-way facing; used as soon as frames for that direction exist (E/W/N/S come later), else the diagonal view d.
 function hero(g,p,d,time,walking,size=72,d8){if(!motion)return;if(d8&&motion.directions?.[d8])d=d8;const f=HeroMotion.frame(motion,d,time,walking);if(!f?.src)return;const im=image(f.src);if(!im.complete||!im.naturalWidth)return;const a=motion.anchor||[.5,.9375];g.save();g.translate(p.x,p.y);if(f.flipImage)g.scale(-1,1);outline(g,im,null,[-size*a[0],-size*a[1],size,size],1.6);g.drawImage(im,-size*a[0],-size*a[1],size,size);g.restore();heroPainted=true}
 const silhouettes=new WeakMap();
 function outline(g,im,crop,rect,radius=3){if(!im?.complete||!im.naturalWidth)return;let c=silhouettes.get(im);if(!c){c=document.createElement('canvas');c.width=Math.min(768,im.naturalWidth);c.height=Math.round(c.width*im.naturalHeight/im.naturalWidth);const q=c.getContext('2d');q.drawImage(im,0,0,c.width,c.height);q.globalCompositeOperation='source-in';q.fillStyle='#fff';q.fillRect(0,0,c.width,c.height);silhouettes.set(im,c)}g.save();g.globalAlpha*=.88;const src=crop?[crop[0]/im.naturalWidth*c.width,crop[1]/im.naturalHeight*c.height,crop[2]/im.naturalWidth*c.width,crop[3]/im.naturalHeight*c.height]:[0,0,c.width,c.height];for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1],[.7,.7],[-.7,.7],[.7,-.7],[-.7,-.7]])g.drawImage(c,...src,rect[0]+a*radius,rect[1]+b*radius,rect[2],rect[3]);g.restore()}
 function hit(im,x,y){if(x<0||x>1||y<0||y>1)return false;const m=mask(im);return !m||(m.data[(Math.min(m.h-1,Math.floor(y*m.h))*m.w+Math.min(m.w-1,Math.floor(x*m.w)))*4+3]||0)>35}
 function setMotion(data){if(!data?.directions)return;motion=data;for(const d of Object.values(data.directions)){if(d.idle?.src)image(d.idle.src);for(const f of d.walk||[])if(f.src)image(f.src)}}
 root.TownArt={image,asset,pattern,begin,draw,outline,hit,sprite,detail,hero,setMotion,onLoad:f=>listeners.add(f),getMotion:()=>motion};
 Object.keys(files).forEach(asset);if(motion)setMotion(motion);
})(globalThis);
