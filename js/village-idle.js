// v20: front-facing everyday poses in the current adventure outfit; no combat stance in town.
(function(){
 if(typeof HERO_ANIMATIONS==='undefined')return;
 const C=HERO_ANIMATIONS.clips,base='assets/characters/hero/village/';
 const f=(name,ms)=>({src:base+'idle-'+name+'.webp',ms});
 const neutral=ms=>f('neutral',ms);
 C['daily.idle']={label:'ยืนพักตามธรรมชาติ',loop:false,frames:[neutral(1800)]};
 for(const [key,pose,label] of [['look','look','มองรอบตัว'],['adjust','adjust','จัดผ้าคลุม'],['relax','stretch','คลายไหล่']]){
  C['daily.'+key]={label,loop:false,frames:[neutral(350),f(pose,1400),neutral(500)]};
 }
 for(const [key,label,ms] of [['yawn','หาวเบา ๆ',1600],['squat','นั่งยองพักขา',3200],['stretch-up','เหยียดแขนคลายเมื่อย',2000],['easy','ยืนสบาย ๆ',2600]]) C['daily.'+key]={label,loop:false,frames:[neutral(300),f(key,ms),neutral(450)]};
 window.VILLAGE_IDLE={version:21,clips:['daily.idle','daily.look','daily.adjust','daily.relax','daily.yawn','daily.squat','daily.stretch-up','daily.easy']};
})();
