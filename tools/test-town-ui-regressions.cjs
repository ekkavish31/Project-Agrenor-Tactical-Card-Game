/* Runtime regressions: scene loading, host navigation and grounded ready poses. */
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=p=>fs.readFileSync(require('node:path').join(__dirname,'..',p),'utf8');
class El{
 constructor(tag){this.tagName=tag;this.style={};this.children=[];this.selectors={};this.hidden=false;this.contentWindow={messages:[],postMessage(m){this.messages.push(m)},focus(){}}}
 appendChild(n){this.children.push(n);return n}append(n){this.appendChild(n)}setAttribute(k,v){this[k]=v}getAttribute(k){return this[k]}remove(){this.removed=true}querySelector(k){return this.selectors[k]??=new El(k)}
}
function dom(){const doc={head:new El('head'),body:new El('body'),documentElement:new El('html'),readyState:'complete',addEventListener(){},querySelector(){return null},createElement:t=>new El(t)};return doc}
async function gate(){
 let now=0;const timers=[];const pictures=[];
 class Img{constructor(){this.complete=false;this.naturalWidth=0;this.src='';pictures.push(this)}decode(){return new Promise(r=>this.release=r)}}
 const document=dom(),ctx={document,Image:Img,location:{search:'',reload(){}},performance:{now:()=>now},Event:class{},dispatchEvent(){},setTimeout(fn,ms){timers.push({fn,at:now+ms})}};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(src('js/img-gate.js'),ctx);
 const veil=document.documentElement.children.find(x=>x.id==='imgGateVeil');const extra=new ctx.Image();extra.src='slow-map.webp';
 async function advance(ms){const to=now+ms;for(;;){timers.sort((a,b)=>a.at-b.at);if(!timers.length||timers[0].at>to)break;const t=timers.shift();now=t.at;t.fn();await Promise.resolve();await Promise.resolve()}now=to}
 ctx.SceneLoad.painted();await advance(16000);
 assert.equal(ctx.__imgGateOpen,true,'slow network must not reveal an empty scene after 7 seconds');assert.equal(veil.querySelector('button').hidden,false,'retry remains available');
 for(const im of pictures){im.complete=true;im.naturalWidth=128}
 await advance(450);assert.equal(ctx.__imgGateOpen,true,'downloaded but undecoded pictures must stay covered');
 for(const im of pictures)im.release();await advance(500);await ctx.SceneLoad.done;
 assert.equal(ctx.__imgGateOpen,false);assert.equal(veil.removed,true);assert.equal(ctx.Image,Img,'restore the native Image constructor');
 // Fast assets still wait for a genuine painted frame.
 let time=0;const d=dom(),queue=[];class Fast{constructor(){this.complete=true;this.naturalWidth=128}decode(){return Promise.resolve()}}
 const fast={document:d,Image:Fast,location:{search:''},performance:{now:()=>time},Event:class{},dispatchEvent(){},setTimeout:f=>queue.push(f)};fast.window=fast;vm.createContext(fast);vm.runInContext(src('js/img-gate.js'),fast);
 for(let n=0;n<15;n++){time+=90;queue.shift()();await Promise.resolve();await Promise.resolve()}
 assert.equal(fast.__imgGateOpen,true,'all images loaded without a paint must not reveal green canvas');fast.SceneLoad.painted();
 for(let n=0;n<5&&queue.length;n++){time+=90;queue.shift()();await Promise.resolve();await Promise.resolve()}
 assert.equal(fast.__imgGateOpen,false);
}
function bridge(){
 const handlers={},document=dom(),panel={open:false},layer={hidden:true},ctx={document,location:{href:'https://example.test/index.html'},GAME_VERSION:{v:'v98.test'},s:{mode:'village',village:{location:'market'},day:1,minutes:480,hp:60,stamina:100},$:id=>id==='panel'?panel:layer,busy:false,devActive:false,heroName:()=> 'Hero',placeActions:()=>[],HeroMotion:{snapshot:()=>({directions:{}})},TACTICS_SPRITES:{},ADVENTURE_DATA:{AREAS:{}},render(){},renderMap(){},villageTravel(){},addEventListener:(k,f)=>(handlers[k]??=[]).push(f),MutationObserver:class{observe(){}},setInterval(){},setTimeout(){},clearTimeout(){},localStorage:{getItem:()=>null}};
 ctx.window=ctx;vm.createContext(ctx);vm.runInContext(src('js/village-town-bridge.js'),ctx);const api=ctx.VillageTown,cover=api.host.children.find(x=>x.className==='scene-transit');
 const message=(source,data)=>handlers.message.forEach(f=>f({source,data}));message(api.frame.contentWindow,{source:'project-a-town',type:'ready'});
 api.enterPlace('market');assert.equal(cover.hidden,false,'cover appears before the child has loaded');
 message(api.marketFrame.contentWindow,{source:'project-a-place',type:'ready',place:'old-room'});assert.equal(cover.hidden,false,'late ready from another map is ignored');
 message(api.marketFrame.contentWindow,{source:'project-a-place',type:'ready',place:'market'});assert.equal(cover.hidden,true);
 api.open();assert.equal(api.marketFrame.hidden,true);assert.equal(api.frame.hidden,false);const messages=api.frame.contentWindow.messages;assert.ok(messages.some(m=>m.type==='return'));assert.equal(messages.at(-1).type,'focus');
 api.enterPlace('forge');assert.equal(cover.hidden,false,'a second location gets a fresh loader');api.open();assert.equal(cover.hidden,true,'leaving while loading removes its cover');
}
function camera(){
 const s=src('js/town-ux.js'),start=s.indexOf('focusHero=function()'),end=s.indexOf("$('flipArt').onclick",start),events={},ctx={editing:false,pointer:{moved:true},spaceDown:true,contDown:{},follow:false,cam:{vx:90},prevFoot:{x:1,y:2},cameraButton:{hidden:false},hero:{u:2,v:3},project:(u,v)=>({x:u*30,y:v*15}),WORLD_W:4480,WORLD_H:2520,scale:1,zoom:2,CharSize:{VILLAGE_HERO_PX:94},parent:{},cv:{addEventListener:(k,f)=>events[k]=f},addEventListener:(k,f)=>events[k]=f};
 vm.createContext(ctx);vm.runInContext(s.slice(start,end),ctx);
 events.message({source:{},data:{source:'project-a-game',type:'focus'}});assert.equal(ctx.follow,false,'foreign frames cannot move the camera');
 events.message({source:ctx.parent,data:{source:'project-a-game',type:'visibility',visible:true}});assert.equal(ctx.follow,true);assert.equal(ctx.pointer,null);assert.equal(ctx.spaceDown,false);assert.equal(ctx.contDown,null);assert.equal(ctx.cam.vx,0);assert.equal(ctx.cameraButton.hidden,true);
 ctx.follow=false;events.lostpointercapture();assert.equal(ctx.follow,true,'lost capture cannot leave following disabled');
 ctx.editing=true;ctx.follow=false;events.message({source:ctx.parent,data:{source:'project-a-game',type:'return'}});assert.equal(ctx.follow,false,'editor camera remains under editor control');
}
function poses(){
 const s=src('js/town-battle.js'),start=s.indexOf('  function readyMotion('),end=s.indexOf('\n  function poseMotion(',start),ctx={};vm.createContext(ctx);vm.runInContext(s.slice(start,end)+';this.pose=readyMotion',ctx);
 for(const dir of ['SW','SE','NE','NW'])for(const t of [0,200,600,1234,9999])for(const still of [false,true]){const p=ctx.pose({id:'hero',dir},t,still);assert.equal(p.dx,0);assert.equal(p.dy,0);assert.equal(p.rot,0);assert.equal(p.sy,1);assert.equal(p.sx,1)}
 const sets={};sets.window=sets;vm.createContext(sets);vm.runInContext(src('js/set-pieces.js'),sets);const goat=sets.SetPieces.get('goatStreet');for(const path of ['reveal','soft'])assert.ok(goat.talk[path].some(l=>l.who==='mip'&&l.text),'Mip speaks and gets a portrait in '+path);
}
(async()=>{await gate();bridge();camera();poses();console.log('PASS town UI: slow/decoded/painted loading, retries, return navigation, grounded ready poses and both Mip reveals')})().catch(e=>{console.error(e);process.exit(1)});
