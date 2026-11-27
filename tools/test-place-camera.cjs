/* v98.1166 · regression for the sub-map camera: the hero must come back to the screen centre after ANY drag / lost pointer / blur / walk.
   Run: python3 -m http.server 8768 &  then  node tools/test-place-camera.cjs   (rule: docs/TODO.md · camera) */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),p=await b.newPage({viewport:{width:1280,height:720}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8768/'+(process.argv[2]||'village-place.html')+'?place=market');await p.waitForFunction(()=>document.elementFromPoint(640,360)?.tagName==='CANVAS',null,{timeout:20000});await p.waitForTimeout(800);
 const heroXY=()=>p.evaluate(()=>{const q=project(hero.u,hero.v);return {x:(q.x-1100)*scale*zoom+W/2+pan.x+cvLeft,y:(q.y-700)*scale*zoom+H/2+pan.y+cvTop,W,H}});
 const off=async()=>{const h=await heroXY();return Math.hypot(h.x-h.W/2,h.y-(h.H/2+h.H*.12))};
 let bad=0;const chk=(name,ok,extra='')=>{console.log(ok?'ok  ':'FAIL',name,extra);if(!ok)bad++};
 await p.waitForTimeout(600);chk('start centred',await off()<3,(await off()).toFixed(1));
 /* 1 · drag and HOLD: the view moves; release: springs back */
 await p.mouse.move(640,360);await p.mouse.down();await p.mouse.move(840,300,{steps:8});await p.waitForTimeout(500);
 const held=await off();chk('held drag moves the view',held>100,held.toFixed(0));
 await p.mouse.up();await p.waitForTimeout(900);chk('release → back to hero',await off()<3,(await off()).toFixed(1));
 /* 2 · pointerup lost entirely (watchdog) */
 await p.evaluate(()=>{drag={x:0,y:0,pan:{...pan},off:{x:0,y:0},moved:true,t:performance.now()-16000};dragOff={x:300,y:-200}});await p.waitForTimeout(1200);chk('lost pointerup (watchdog) → back',await off()<3,(await off()).toFixed(1));
 /* 3 · blur / visibility during a drag */
 await p.mouse.move(640,360);await p.mouse.down();await p.mouse.move(400,500,{steps:6});await p.evaluate(()=>dispatchEvent(new Event('blur')));await p.waitForTimeout(900);chk('blur mid-drag → back',await off()<3,(await off()).toFixed(1));await p.mouse.up();
 /* 4 · stale drag object left behind (not moved) never stops the follow */
 await p.evaluate(()=>{drag={x:0,y:0,pan:{...pan},off:{...dragOff},moved:false,t:0}});await p.evaluate(()=>{hero.u+=1.5;hero.v+=1});await p.waitForTimeout(900);chk('stale un-moved drag: still follows hero',await off()<3,(await off()).toFixed(1));
 /* 5 · hero walks: camera keeps him centred */
 await p.evaluate(()=>{drag=null;hero.u-=2;hero.v-=1.5});await p.waitForTimeout(900);chk('after a jump → centred',await off()<3,(await off()).toFixed(1));
 /* 6 · the shop-closed message */
 await p.mouse.move(640,360);await p.mouse.down();await p.mouse.move(900,200,{steps:6});await p.evaluate(()=>postMessage({source:'project-a-game',type:'visibility',visible:true},'*'));await p.waitForTimeout(700);chk('visibility msg during drag → back',await off()<3,(await off()).toFixed(1));await p.mouse.up();
 chk('no page errors',errs.length===0,errs.join('|'));
 await b.close();console.log(bad?'FAIL':'PASS');process.exit(bad?1:0)})()
