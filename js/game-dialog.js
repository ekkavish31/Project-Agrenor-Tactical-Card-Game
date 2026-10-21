/* v36 game windows replace the browser's alert / confirm / prompt everywhere in the game.
   confirm() and prompt() keep their synchronous call sites: the first call opens the game window and
   answers "no"; when the player presses OK, the click (or key) that asked is replayed and the same
   question then answers "yes" (or returns the typed text). */
(function(){'use strict';
const native={alert:window.alert.bind(window),confirm:window.confirm.bind(window),prompt:window.prompt.bind(window)};
let last=null,approved=new Map(),open=null,queue=[];
const remember=e=>{if(e.isTrusted&&!e.target?.closest?.('#gameDialog'))last={type:e.type,target:e.target,key:e.key,code:e.code,time:performance.now()}};
document.addEventListener('click',remember,true);document.addEventListener('keydown',remember,true);document.addEventListener('change',remember,true);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function title(kind){return kind==='alert'?'แจ้งเตือน':kind==='prompt'?'กรอกข้อมูล':'ยืนยัน'}
function show(kind,msg,def,done){if(open){queue.push([kind,msg,def,done]);return}let el=document.createElement('div');el.id='gameDialog';el.className='game-dialog';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');
 el.innerHTML=`<div class="gd-box"><header>${title(kind)}</header><p>${esc(msg).replace(/\n/g,'<br>')}</p>${kind==='prompt'?`<input type="text" value="${esc(def||'')}">`:''}<footer>${kind==='alert'?'':'<button type="button" data-no>ยกเลิก</button>'}<button type="button" class="primary" data-ok>ตกลง</button></footer></div>`;
 document.body.appendChild(el);open=el;let input=el.querySelector('input'),finish=ok=>{el.remove();open=null;let v=kind==='prompt'?(ok?input.value:null):ok;done?.(v);let n=queue.shift();if(n)show(...n)};
 el.querySelector('[data-ok]').onclick=()=>finish(true);el.querySelector('[data-no]')?.addEventListener('click',()=>finish(false));
 el.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();e.preventDefault();finish(kind==='alert')}if(e.key==='Enter'){e.stopPropagation();e.preventDefault();finish(true)}});
 setTimeout(()=>(input||el.querySelector('[data-ok]')).focus(),20)}
function replay(ev){if(!ev||!ev.target?.isConnected)return false;if(ev.type==='click'){ev.target.click();return true}if(ev.type==='keydown'){ev.target.dispatchEvent(new KeyboardEvent('keydown',{key:ev.key,code:ev.code,bubbles:true,cancelable:true}));return true}if(ev.type==='change'){ev.target.dispatchEvent(new Event('change',{bubbles:true}));return true}return false}
function ask(kind,msg,def){msg=String(msg??'');if(approved.has(msg)){let v=approved.get(msg);return v}let ev=last&&performance.now()-last.time<1500?last:null;
 if(!ev)return kind==='prompt'?native.prompt(msg,def):native.confirm(msg);// nothing to replay: keep the browser window as a fallback
 let before=new Map(approved);show(kind,msg,def,v=>{if(kind==='confirm'&&!v||kind==='prompt'&&v==null)return;approved=new Map([...before,[msg,kind==='prompt'?v:true]]);try{replay(ev)}finally{setTimeout(()=>approved.clear(),0)}});return kind==='prompt'?null:false}
window.GameDialog={alert:(msg)=>new Promise(r=>show('alert',String(msg??''),'',()=>r())),confirm:(msg)=>new Promise(r=>show('confirm',String(msg??''),'',r)),prompt:(msg,def)=>new Promise(r=>show('prompt',String(msg??''),def,r)),native};
window.alert=msg=>{show('alert',String(msg??''),'',null)};
window.confirm=msg=>ask('confirm',msg);
window.prompt=(msg,def)=>ask('prompt',msg,def);
// styles live here so every page that loads this file gets the game window look
let css=document.createElement('style');css.textContent=`.game-dialog{position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;background:#0a1020a8;animation:gd-in .18s ease-out}
.gd-box{width:min(440px,calc(100vw - 32px));background:linear-gradient(#1d2a44,#121b2e);color:#f5e6c4;border:2px solid #d9b46b;border-radius:14px;box-shadow:0 0 0 4px #00000055,0 18px 50px #000c,inset 0 0 0 1px #ffe8a633;padding:14px 18px 14px;font:15px/1.55 system-ui,sans-serif}
.gd-box header{font:700 17px Georgia,serif;color:#ffe8a6;letter-spacing:.5px;border-bottom:1px solid #d9b46b55;padding-bottom:8px;margin-bottom:10px}
.gd-box p{margin:0 0 12px;white-space:normal}.gd-box input{width:100%;box-sizing:border-box;margin:0 0 12px;padding:8px 10px;border-radius:8px;border:1px solid #a88a58;background:#f7e8c5;color:#2a2318;font:inherit}
.gd-box footer{display:flex;justify-content:flex-end;gap:8px}.gd-box button{min-width:92px;padding:8px 14px;border-radius:9px;border:1px solid #a88a58;background:#f7e8c5;color:#2a2318;font:600 14px system-ui,sans-serif;cursor:pointer}
.gd-box button.primary{background:linear-gradient(#f0c560,#c9901f);border-color:#7a4b06;color:#2a1a05}.gd-box button:focus-visible{outline:3px solid #ffe8a6;outline-offset:2px}
@keyframes gd-in{from{opacity:0}to{opacity:1}}@media (prefers-reduced-motion:reduce){.game-dialog{animation:none}}`;document.head.appendChild(css);
})();
