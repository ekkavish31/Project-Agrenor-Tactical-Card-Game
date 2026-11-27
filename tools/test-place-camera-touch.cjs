/* v98.1182 · touch version of test-place-camera.cjs: drag with one finger = look around, release / cancel = back to the hero.
   Run: python3 -m http.server 8768 &  then  node tools/test-place-camera-touch.cjs */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch(),ctx=await b.newContext({viewport:{width:1000,height:600},hasTouch:true,isMobile:true}),p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8768/village-place.html?place=market');await p.waitForFunction(()=>document.elementFromPoint(500,300)?.tagName==='CANVAS',null,{timeout:25000});await p.waitForTimeout(900);
 const off=()=>p.evaluate(()=>{const q=project(hero.u,hero.v);const x=(q.x-1100)*scale*zoom+W/2+pan.x+cvLeft,y=(q.y-700)*scale*zoom+H/2+pan.y+cvTop;return Math.hypot(x-W/2,y-(H/2+H*.12))});
 const cdp=await ctx.newCDPSession(p),tp=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'||type==='touchCancel'?[]:[{x,y,id:1}]});
 let bad=0;const chk=(n,ok,v)=>{console.log(ok?'ok  ':'FAIL',n,v.toFixed(1));if(!ok)bad++};
 chk('start centred',await off()<3,await off());
 await tp('touchStart',500,300);for(let i=1;i<=8;i++)await tp('touchMove',500+i*25,300-i*10);await p.waitForTimeout(400);chk('held touch drag moves the view',await off()>100,await off());
 await tp('touchEnd');await p.waitForTimeout(900);chk('touch release → back',await off()<3,await off());
 await tp('touchStart',500,300);for(let i=1;i<=6;i++)await tp('touchMove',500-i*30,300+i*10);await tp('touchCancel');await p.waitForTimeout(900);chk('touch cancel → back',await off()<3,await off());
 if(errs.length){bad++;console.log('page errors',errs)}
 await b.close();console.log(bad?'FAIL':'PASS');process.exit(bad?1:0)})()
