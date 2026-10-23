/* One hero walk definition, sampled identically by battle, towns and legacy movement. */
(function(root){
 'use strict';
 const sample=(frames,time)=>root.StudioWalks.frame(frames,time);
 function sequence(t,d){const p=t.directions[d]||t.directions.SE;return p.walk?.length?p.walk:[p['walk-left'],p['walk-right']].filter(Boolean).map(f=>({...f,ms:150}));}
 function frame(t,d,time,walking){const p=t.directions[d]||t.directions.SE;return walking?sample(sequence(t,d),time):p.idleFrames?.length?sample(p.idleFrames,time):p.idle||t.directions.SE.idle;}
 function snapshot(t){return {size:t.size,anchor:t.anchor,directions:Object.fromEntries(Object.entries(t.directions).map(([d,p])=>[d,{idle:p.idle,...(p.idleFrames?.length?{idleFrames:p.idleFrames}:{}),walk:sequence(t,d)}]))};}
 function aliases(t,h){if(!h?.clips)return;for(const key of Object.keys(h.clips))if(/(?:^|\.)(?:walk|run)(?:\.|$)/.test(key)){const old=h.clips[key];Object.defineProperty(h.clips,key,{configurable:true,enumerable:true,get:()=>({...old,label:'เดิน',loop:true,anchor:t.anchor,canvas:t.size,frames:sequence(t,'E' in t.directions?'E':'SE')})});}}
 root.HeroMotion={frame,sequence,snapshot,aliases};
 if(typeof TACTICS_SPRITES!=='undefined')aliases(TACTICS_SPRITES,typeof HERO_ANIMATIONS!=='undefined'?HERO_ANIMATIONS:null);
})(globalThis);
