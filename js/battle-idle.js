// Six cached breathing frames derived at runtime from the field sprite. Feet stay planted.
// Separate from the authored monster walk/action production queue.
(function(){
 let motion=!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const ids=new WeakMap(),cache=new Map();let serial=0;
 function eligible(u,v,now){return motion&&u.hp>0&&!u.fled&&!v.walking&&(!v.pose||v.pose==='idle')&&!(v.hitUntil>now)}
 function frames(image){let id=ids.get(image);if(!id){id=++serial;ids.set(image,id)}let old=cache.get(id);if(old){cache.delete(id);cache.set(id,old);return old}
  let iw=image.naturalWidth||image.width,ih=image.naturalHeight||image.height;if(!iw||!ih)return null;let scale=Math.min(1,256/Math.max(iw,ih)),w=Math.ceil(iw*scale),h=Math.ceil(ih*scale),out=[];
  for(let f=0;f<8;f++){let c=document.createElement('canvas');c.width=w;c.height=h;let g=c.getContext('2d'),phase=f/8*Math.PI*2,breath=(1-Math.cos(phase))/2,sway=Math.sin(phase);g.imageSmoothingEnabled=true;
   // Horizontal bands deform chest/head very slightly, blending to zero at the boots.
   for(let y=0;y<h;y+=2){let sh=Math.min(2,h-y),z=(y+sh/2)/h,weight=Math.max(0,1-z/.91),chest=Math.exp(-Math.pow((z-.43)/.22,2)),wide=1+.024*breath*chest,dx=1.05*sway*weight*weight,dw=w*wide,lift=-1.4*breath*weight;
    g.drawImage(image,0,y/scale,iw,sh/scale,(w-dw)/2+dx,y+lift,dw,sh+.6)}out.push(c)}
  cache.set(id,out);while(cache.size>24)cache.delete(cache.keys().next().value);return out
 }
 // v35: atlas sub-rectangles (monster idle clips) get the same breathing, cropped once and cached
 const crops=new Map();function frameRect(image,sx,sy,sw,sh,u,v,now){if(!image||!eligible(u,v,now))return null;let id=ids.get(image);if(!id){id=++serial;ids.set(image,id)}let k=id+':'+[sx,sy,sw,sh].map(Math.round).join(',');let c=crops.get(k);if(!c){c=document.createElement('canvas');c.width=Math.max(1,Math.round(sw));c.height=Math.max(1,Math.round(sh));c.getContext('2d').drawImage(image,sx,sy,sw,sh,0,0,c.width,c.height);crops.set(k,c);if(crops.size>160)crops.delete(crops.keys().next().value)}return frame(c,u,v,now)}
 function frame(image,u,v,now){if(!image||!eligible(u,v,now))return image;let a=frames(image);if(!a)return image;let hash=0;for(let c of String(u.id||u.kind||''))hash=(hash*31+c.charCodeAt(0))>>>0;return a[Math.floor((now+hash%2300)/300)%a.length]}
 window.BattleIdle={frame,eligible,lift(u,v,now,unitWidth){return eligible(u,v,now)&&(u.traits||[]).includes('fly')?-unitWidth*(.035+.025*Math.sin(now/650+String(u.id).length)):0},setMotion(on){motion=!!on&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches},clear(){cache.clear()},frameCount:8,frameRect};
})();
