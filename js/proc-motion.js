/* v38n · Procedural motion for animations that have only one frame (or any clip you choose).
   Settings per clip (localStorage 'proc-motion-v1', pushed into js/game-settings.js): {type, amp, speed}
   Clip keys: monsters = their asset id (enemy-anim-<kind>-<view>-<pose>), hero/allies = tactics.<pose>.<dir>.
   Without a setting, a single-frame idle breathes and a single-frame walk bobs; multi-frame clips are left alone.
   Transforms are applied around the feet, so the shadow and the ground point never move. */
(function(root){'use strict';
const KEY='proc-motion-v1';
const TYPES={none:'ไม่ขยับ',breathe:'หายใจ (ยืด-ย่อ)',sway:'โยกตัว',float:'ลอยขึ้นลง',bob:'เด้งตามก้าว',wind:'ส่วนบนไหว (ลม)',pulse:'เต้นเป็นจังหวะ'};
let cache=null,stamp='';
function all(){try{const s=root.localStorage?.getItem(KEY)||'';if(s!==stamp){stamp=s;cache=s?JSON.parse(s):{}}}catch(e){cache={}}return cache||{}}
function set(key,cfg){const a={...all()};if(!cfg||cfg.type==='auto')delete a[key];else a[key]={type:cfg.type,amp:+cfg.amp||1,speed:+cfg.speed||1};try{root.localStorage.setItem(KEY,JSON.stringify(a))}catch(e){}stamp='';return a[key]||null}
const hash=s=>{let h=7;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h%1000/1000*6.283};
function defaultFor(info){if(!info||(info.frames||1)>1)return null;if(info.pose==='idle'||info.pose==='guard')return info.skipIdle?null:{type:'breathe',amp:info.pose==='guard'?.6:1,speed:1};if(info.pose==='walk')return{type:'bob',amp:1,speed:1};return null}
function config(key,info){const s=all()[key];return s?(s.type==='none'?null:s):defaultFor(info)}
// matrix [a,b,c,d,e,f] for ctx.transform, origin = feet, h = drawn sprite height in px
function matrix(cfg,time,h,id){const A=cfg.amp??1,w=(cfg.speed??1),ph=hash(id),T=time/1000;
 switch(cfg.type){
  case'breathe':{const s=Math.sin(T*2.6*w+ph);return[1-.008*A*s,0,0,1+.02*A*s,0,0]}
  case'sway':{const r=.035*A*Math.sin(T*2.1*w+ph),c=Math.cos(r),n=Math.sin(r);return[c,n,-n,c,0,0]}
  case'float':return[1,0,0,1,0,-h*.045*A*(1+Math.sin(T*2.2*w+ph))/2];
  case'bob':{const s=Math.sin(T*12*w+ph),r=.02*A*s;return[1,r*.5,-r,1-.012*A*Math.abs(s),0,-h*.03*A*Math.abs(s)]}
  case'wind':return[1,0,.05*A*Math.sin(T*1.7*w+ph)+.02*A*Math.sin(T*4.3*w+ph*2),1,0,0];
  case'pulse':{const s=Math.max(0,Math.sin(T*4*w+ph))**3;return[1+.03*A*s,0,0,1+.03*A*s,0,0]}}
 return null}
// apply at the current origin (already at the feet)
function apply(ctx,key,info,time,h,id){const cfg=config(key,info);if(!cfg)return false;const m=matrix(cfg,time,h,id);if(!m)return false;ctx.transform(...m);return true}
// apply around a ground point p
function applyAt(ctx,key,info,time,h,id,p){const cfg=config(key,info);if(!cfg)return false;const m=matrix(cfg,time,h,id);if(!m)return false;ctx.translate(p.x,p.y);ctx.transform(...m);ctx.translate(-p.x,-p.y);return true}
root.ProcMotion={KEY,TYPES,all,set,config,matrix,apply,applyAt,defaultFor,raw:key=>all()[key]||null};
})(globalThis);
