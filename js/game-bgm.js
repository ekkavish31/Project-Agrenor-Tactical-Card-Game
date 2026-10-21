/* Normalized scene playlists. Settings use the existing music volume control. */
(function(root){'use strict';
 const P=root.BattlePolish,base='assets/audio/bgm/',lists={home:['bgm-home-01.mp3'],village:['bgm-village-01.mp3'],forge:['bgm-forge-01.mp3','bgm-forge-02.mp3'],mine:['bgm-battle-mine-01.mp3'],frost:['bgm-battle-frost-01.mp3'],'frost-boss':['bgm-battle-frost-boss-01.mp3'],victory:['bgm-victory-01.mp3']};
 let unlocked=false,current=null,fade=[],generation=0,activeKey='none',lastTick=performance.now(),error='',indices={};
 function select(c){if(c.hidden)return 'none';if(c.title)return 'home';if(c.battle){const b=c.battle;if(b.outcome==='win'&&c.resultShown)return 'victory';if(b.outcome==='lose')return 'none';const m=b.map||{},snow=m.variant==='frost'||m.theme==='frost'||b.encounter?.area==='frost';if(snow){const boss=(b.units||[]).some(u=>u.side==='enemy'&&['miniboss','boss'].includes(root.TacticsCore?.ENEMY_TYPES[u.kind]?.rank));return boss?'frost-boss':'frost'}if(m.theme==='mine'||m.theme==='cave')return 'mine';return 'procedural'}if(c.adventure)return 'procedural';if(c.scene==='town'||c.scene==='market-interior')return 'village';return c.place==='forge'?'forge':c.place==='home'?'home':'village'}
 function context(){const layer=document.getElementById('tacticsLayer');return{hidden:document.hidden,title:!!root.TitleScreen?.active,battle:layer&&!layer.hidden?root.TacticsLab?.getState():null,resultShown:!document.getElementById('resultOverlay')?.hidden,adventure:root.Adventure?.state(),scene:root.VillageTown?.getScene(),place:document.body.dataset.place}}
 function remove(entry){entry.audio.pause();entry.audio.removeAttribute('src');entry.audio.load()}
 function start(key,index=indices[key]||0){const token=++generation;activeKey=key;if(current){fade.push(current);current=null}if(!lists[key]||!unlocked)return;
  const audio=new Audio(base+lists[key][index]);audio.preload='auto';audio.loop=lists[key].length===1&&key!=='victory';audio.volume=0;const entry=current={audio,key,index,gain:0,started:false};
  audio.onended=()=>{if(current!==entry||token!==generation||key==='victory')return;indices[key]=(index+1)%lists[key].length;start(key,indices[key])};audio.onerror=()=>{error='โหลดเพลงไม่ได้: '+lists[key][index]};
  audio.play().then(()=>{if(token!==generation){audio.pause();return}entry.started=true;error=''}).catch(e=>{if(token===generation){error=e.message;unlocked=false}});
 }
 function tick(){const now=performance.now(),dt=Math.min(.2,(now-lastTick)/1000);lastTick=now;const key=select(context());if(P)P.bgmManaged=key!=='procedural';if(key!==activeKey)start(key);else if(unlocked&&lists[key]&&!current)start(key);
  const volume=Math.max(0,Math.min(1,Number(P?.musicVolume)||0));if(current){current.gain=Math.min(1,current.gain+dt/1.1);current.audio.volume=volume*current.gain;if(!unlocked)current.audio.pause()}
  fade=fade.filter(e=>{e.gain=Math.max(0,e.gain-dt/.75);e.audio.volume=volume*e.gain;if(!e.gain){remove(e);return false}return true});
 }
 function unlock(){if(!unlocked){unlocked=true;if(current&&!current.started){remove(current);current=null}tick()}}
 document.addEventListener('pointerdown',unlock,{capture:true});document.addEventListener('keydown',unlock,{capture:true});
 root.addEventListener('message',e=>{const town=root.VillageTown;if(!town||![town.frame.contentWindow,town.marketFrame.contentWindow].includes(e.source))return;if(e.data?.type==='input')unlock()});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){generation++;if(current){remove(current);current=null}fade.forEach(remove);fade=[];activeKey='none'}else tick()});
 if(P){P.bgmManaged=true;const old=P.audioDiagnostics;P.audioDiagnostics=()=>({...old?.(),track:activeKey,file:current?.audio.src||null,playlistIndex:current?.index??0,playing:!!current&&!current.audio.paused,musicVolume:P.musicVolume,error})}
 root.GameBGM={select,refresh:tick,unlock,playlists:lists,diagnostics:()=>({key:activeKey,index:current?.index,playing:!!current&&!current.audio.paused,error}),nextForgeTrack:()=>{if(activeKey!=='forge')return;indices.forge=((current?.index||0)+1)%2;start('forge',indices.forge)}};
 setInterval(tick,100);tick();
})(globalThis);
