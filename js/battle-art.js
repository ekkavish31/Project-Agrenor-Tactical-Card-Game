// v21 painted scenery and authored terrain frame sheets. Rules/highlights remain code.
(function(){
 const S=window.TacticsScenery;if(!S)return;
 const images=new Map();let manifestRef=null,manifestLength=-1,entries=new Map(),motion=true,viewIndex=0;
 function setMotion(on){motion=!!on&&!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches}
 function entry(id){let A=window.ASSET_MANIFEST?.assets||[];if(A!==manifestRef||A.length!==manifestLength){manifestRef=A;manifestLength=A.length;entries=new Map(A.map(a=>[a.id,a]))}let e=entries.get(id);return e?.status==='final'&&e.file?e:null}
 function bitmap(id){let e=entry(id);if(!e)return null;let it=images.get(e.file);if(!it){let im=new Image();it={image:im,ready:false};im.onload=()=>it.ready=true;im.onerror=()=>it.ready=false;images.set(e.file,it);im.src=e.file}return it.ready?{image:it.image,entry:e}:null}
 function sample(id,now,view=viewIndex){let a=bitmap(id);if(!a)return null;let e=a.entry,im=a.image,an=e.animation;if(e.directional){let d=e.directional,cols=d.columns||2,rows=d.rows||2,frame=((view%4)+4)%4,sw=im.naturalWidth/cols,sh=im.naturalHeight/rows,crop=d.crops?.[frame]||[0,0,sw,sh];return {...a,sx:(frame%cols)*sw+crop[0],sy:Math.floor(frame/cols)*sh+crop[1],sw:crop[2],sh:crop[3]}}if(!an)return {...a,sx:0,sy:0,sw:im.naturalWidth,sh:im.naturalHeight};let cols=an.columns||2,rows=an.rows||2,count=an.frames||cols*rows,frame=motion?Math.floor(now/(an.frameMs||180))%count:0,sw=im.naturalWidth/cols,sh=im.naturalHeight/rows;return {...a,sx:(frame%cols)*sw,sy:Math.floor(frame/cols)*sh,sw,sh}}
 function imageRect(g,a,x,y,w,h){g.drawImage(a.image,a.sx,a.sy,a.sw,a.sh,x,y,w,h)}
 const groundId=k=>'ground-'+(k==='crystal'?'crystal-floor':k);
 function terrain(g,t,p,W,H,now,turn=false){if(t.kind==='tallgrass')return false;let a=sample('ground-anim-'+t.kind,now)||sample(groundId(t.kind),now);if(!a)return false;
  g.save();g.beginPath();g.moveTo(p.x,p.y-H/2);g.lineTo(p.x+W/2,p.y);g.lineTo(p.x,p.y+H/2);g.lineTo(p.x-W/2,p.y);g.closePath();g.clip();
  g.transform(W/2,H/2,-W/2,H/2,p.x,p.y-H/2);if(turn){g.translate(1,0);g.rotate(Math.PI/2)}imageRect(g,a,0,0,1,1);g.restore();return true;
 }
 const HEIGHT={beam:1.5,crystal:.85,cart:.65,pine:1.95,standstone:1.1,log:.5,mossrock:.55,bush:.62,stalagmite:1.3,crates:.9,barrel:.6,orepile:.42};
 function propRect(type,p,W,now){let a=sample('prop-'+type+'-views',now)||sample('prop-'+type,now);if(!a)return null;let h=W*(HEIGHT[type]||1),w=h*a.sw/a.sh,pivot=a.entry.pivot||[.5,.95];return {a,x:p.x-w*pivot[0],y:p.y-h*pivot[1],w,h,bottom:p.y}}
 const alphaCache=new WeakMap();
 function opaqueAt(a,r,q){if(q.x<r.x||q.y<r.y||q.x>=r.x+r.w||q.y>=r.y+r.h)return false;let x=a.sx+(q.x-r.x)/r.w*a.sw,y=a.sy+(q.y-r.y)/r.h*a.sh,known=window.OcclusionMasks?.opaque(a.entry?.file||a.image.src,x,y);if(known!=null)return known;let mask=alphaCache.get(a.image);if(mask===undefined){try{let c=document.createElement('canvas'),scale=Math.min(1,256/Math.max(a.image.naturalWidth,a.image.naturalHeight));c.width=Math.max(1,Math.round(a.image.naturalWidth*scale));c.height=Math.max(1,Math.round(a.image.naturalHeight*scale));let g=c.getContext('2d',{willReadFrequently:true});g.drawImage(a.image,0,0,c.width,c.height);mask={w:c.width,h:c.height,alpha:g.getImageData(0,0,c.width,c.height).data}}catch(e){mask=null}alphaCache.set(a.image,mask)}if(!mask)return true;let px=Math.min(mask.w-1,Math.floor(x/a.image.naturalWidth*mask.w)),py=Math.min(mask.h-1,Math.floor(y/a.image.naturalHeight*mask.h));return mask.alpha[(py*mask.w+px)*4+3]>=48}
 // v37: a crisp ring around an occluder while it is faded, so the shape stays readable
 const rings=new Map();
 function ring(a){let key=(a.entry?.file||a.image.src)+'|'+[a.sx,a.sy,a.sw,a.sh].map(Math.round).join(',');let c=rings.get(key);if(c)return c;let s=Math.min(1,220/Math.max(a.sw,a.sh)),w=Math.max(4,Math.round(a.sw*s)),h=Math.max(4,Math.round(a.sh*s)),p=3;
  let sil=document.createElement('canvas');sil.width=w;sil.height=h;let g=sil.getContext('2d');g.drawImage(a.image,a.sx,a.sy,a.sw,a.sh,0,0,w,h);g.globalCompositeOperation='source-in';g.fillStyle='#fff3cf';g.fillRect(0,0,w,h);
  c=document.createElement('canvas');c.width=w+p*2;c.height=h+p*2;let o=c.getContext('2d');for(let k=0;k<12;k++){let an=k/12*Math.PI*2;o.drawImage(sil,p+Math.cos(an)*2.2,p+Math.sin(an)*2.2)}o.globalCompositeOperation='destination-out';o.drawImage(sil,p,p);
  let inner=document.createElement('canvas');inner.width=c.width;inner.height=c.height;let q=inner.getContext('2d');q.drawImage(c,0,0);q.globalCompositeOperation='source-in';q.fillStyle='#2a1d10';q.fillRect(0,0,c.width,c.height);
  let out=document.createElement('canvas');out.width=c.width+2;out.height=c.height+2;let z=out.getContext('2d');z.drawImage(inner,2,2);z.drawImage(c,0,0);out._pad=p/s;rings.set(key,out);if(rings.size>120)rings.delete(rings.keys().next().value);return out}
 function outline(g,a,x,y,w,h,alpha){if(alpha>=.95||!a?.image)return;let r;try{r=ring(a)}catch(e){return}let px=w/a.sw*r._pad,py=h/a.sh*r._pad;g.save();g.globalAlpha=Math.min(1,(1-alpha)*1.6);g.drawImage(r,x-px,y-py,w+px*2,h+py*2);g.restore()}
 const prop=S.prop;S.prop=function(g,type,p,W,alpha,now,t){let a=sample('prop-'+type+'-views',now)||sample('prop-'+type,now);if(!a)return prop(g,type,p,W,alpha,now,t);let h=W*(HEIGHT[type]||1),w=h*a.sw/a.sh,pivot=a.entry.pivot||[.5,.95];g.save();g.globalAlpha*=alpha;imageRect(g,a,p.x-w*pivot[0],p.y-h*pivot[1],w,h);g.restore();outline(g,a,p.x-w*pivot[0],p.y-h*pivot[1],w,h,alpha)};
 const decor=S.decor;S.decor=function(g,type,p,W,H,t){let a=sample('decor-'+type,performance.now());if(!a)return decor(g,type,p,W,H,t);let w=W*(type==='web'?.48:type==='fern'?.46:.36),h=w*a.sh/a.sw;imageRect(g,a,p.x-w/2,p.y-h*.82,w,h)};
 const grass=S.grassFront;S.grassFront=function(g,t,p,W,H,now){let a=sample('ground-anim-tallgrass',now)||sample('ground-tallgrass',now);if(!a)return grass(g,t,p,W,H,now);let w=W*.98,h=W*.57;imageRect(g,a,p.x-w/2,p.y-h+H*.18,w,h)};
 const detail=S.tileDetail;S.tileDetail=function(g,t,p,W,H,now){if(t.kind==='tallgrass'&&bitmap('ground-tallgrass')){S.grassFront(g,t,p,W,H,now);return}if(bitmap('ground-anim-'+t.kind)||bitmap(groundId(t.kind)))return;detail(g,t,p,W,H,now)};
 function preload(){for(let a of window.ASSET_MANIFEST?.assets||[])if(a.artRevision==='v21'&&a.status==='final')bitmap(a.id)}
 function largeRect(o,p,W,H,now){let view=(viewIndex+(o.orientation||0))%4,a=sample('large-'+o.type+'-views',now,view)||sample('large-'+o.type,now);if(!a)return null;let w=W*(o.w+o.h)*.5*(o.type==='ancient-tree'?1.5:1),h=w*a.sh/a.sw,bottom=p.y+H*(o.w+o.h-2)/4;return {a,x:p.x-w/2,y:bottom-h*.96,w,h,bottom}}
 function large(g,o,p,W,H,now,alpha=1){let r=largeRect(o,p,W,H,now);if(!r)return;g.save();g.globalAlpha*=alpha;imageRect(g,r.a,r.x,r.y,r.w,r.h);g.restore();outline(g,r.a,r.x,r.y,r.w,r.h,alpha)}

 window.BattleArt={outline,large,largeRect,propRect,opaqueAt,setView(n){viewIndex=((n%4)+4)%4},terrain,sample,preload,groundId,setMotion};setMotion(true);preload();
})();
