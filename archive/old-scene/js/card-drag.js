// Playing a card is committed only on release inside the scene.
let playDrag=null,ignoreCardClickUntil=0;
function cardDropAllowed(x,y){
  const r=$('world').getBoundingClientRect();
  return x>=r.left&&x<=r.left+r.width&&y>=r.top&&y<=r.top+r.height;
}
document.addEventListener('pointerdown',e=>{
  const face=e.target.closest('#hand .card-front');
  if(!face||busy||devActive||e.button!==0||e.isPrimary===false||playDrag)return;
  const shell=face.closest('.card-shell'),i=Number(shell.dataset.cardIndex);
  if(!owned(i)||flipped.has(i))return;
  playDrag={id:e.pointerId,i,shell,x:e.clientX,y:e.clientY,active:false};
  face.setPointerCapture(e.pointerId);
});
document.addEventListener('pointermove',e=>{
  const d=playDrag;if(!d||e.pointerId!==d.id)return;
  if(!d.active&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<10)return;
  e.preventDefault();
  if(!d.active){
    d.active=true;selectCard(d.i,false);
    const r=d.shell.getBoundingClientRect();d.w=r.width;d.h=r.height;
    d.ghost=document.createElement('div');d.ghost.className='flying-card drag-card';
    d.ghost.innerHTML=cardMarkup(d.i,false);
    Object.assign(d.ghost.style,{width:d.w+'px',height:d.h+'px'});
    document.body.appendChild(d.ghost);applyCardLayouts(d.ghost);
    d.shell.classList.add('drag-origin');document.body.classList.add('playing-drag');
  }
  Object.assign(d.ghost.style,{left:(e.clientX-d.w/2)+'px',top:(e.clientY-d.h*.65)+'px'});
  const inside=cardDropAllowed(e.clientX,e.clientY),reason=blocked(d.i);
  $('world').classList.toggle('card-drop-ready',inside&&!reason);
  $('world').classList.toggle('card-drop-blocked',inside&&!!reason);
  $('message').textContent=reason||(inside?'ปล่อยเพื่อใช้ '+defs[d.i].name:'ลากเข้าฉากแล้วปล่อยเพื่อใช้ · ปล่อยนอกฉากเพื่อยกเลิก');
},{passive:false});
function endPlayDrag(e,cancel=false){
  const d=playDrag;if(!d||e.pointerId!==d.id)return;playDrag=null;
  if(!d.active)return;
  ignoreCardClickUntil=Date.now()+400;
  const source=d.ghost.getBoundingClientRect();
  d.shell.classList.remove('drag-origin');document.body.classList.remove('playing-drag');
  $('world').classList.remove('card-drop-ready','card-drop-blocked');
  const reason=blocked(d.i),play=!cancel&&cardDropAllowed(e.clientX,e.clientY)&&!reason;
  if(play){d.ghost.remove();useCard(d.i,source);}
  else{
    const home=d.shell.getBoundingClientRect();
    animate(d.ghost,[{transform:'translate(0,0)',opacity:1},{transform:`translate(${home.left-source.left}px,${home.top-source.top}px)`,opacity:0}],{duration:240,easing:'ease-out'}).finally(()=>d.ghost.remove());
    $('message').textContent=reason||'ยกเลิกการใช้ไพ่ — ไม่เสียแรงและเวลา';
  }
}
document.addEventListener('pointerup',e=>endPlayDrag(e));
document.addEventListener('pointercancel',e=>endPlayDrag(e,true));
document.addEventListener('lostpointercapture',e=>endPlayDrag(e,true));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&playDrag){endPlayDrag({pointerId:playDrag.id},true);e.preventDefault();}},true);
window.addEventListener('blur',()=>{if(playDrag)endPlayDrag({pointerId:playDrag.id},true)});
document.addEventListener('click',e=>{if(Date.now()<ignoreCardClickUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
document.addEventListener('dragstart',e=>{if(e.target.closest('#hand'))e.preventDefault();});
