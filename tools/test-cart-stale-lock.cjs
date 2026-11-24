// v98.1035 · a push killed mid-way must not keep Cart 1 locked: dead marker (no heartbeat) is ignored, live one is honoured, unlock clears it.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const disk=new Map();
function element(){return new Proxy(function(){},{get:(t,k)=>k==='style'?{}:k==='querySelector'||k==='querySelectorAll'?()=>element():k==='then'?undefined:element(),apply:()=>element(),set:()=>true})}
const doc={readyState:'loading',createElement:element,body:{append(){}},getElementById(){return null},addEventListener(){}};
const ctx={Blob,Map,Set,Date,Promise,console,queueMicrotask,document:doc,location:{pathname:'/editor.html'},BroadcastChannel:class{postMessage(){}},localStorage:{getItem:()=>null},setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},addEventListener(){},indexedDB:null,fetch:async()=>({ok:false})};
ctx.window=ctx;
// in-memory idb stand-in
let src=fs.readFileSync('js/github-push.js','utf8').replace(/const idbGet=async k=>\{.*\n/,'const idbGet=async k=>window.__disk.get(k);\n').replace(/const idbSet=async\([^)]*\)=>\{.*\n|const idbSet=async[^\n]*\n/,'const idbSet=async(k,v)=>{window.__disk.set(k,v)};\n').replace('const cartApi={','window.__t={pushMarker,cartUnlock};const cartApi={');
ctx.__disk=disk;vm.runInNewContext(src,ctx);
(async()=>{const T=ctx.__t,now=Date.now();
 disk.set('cart-push',null);assert.equal(await T.pushMarker(),null);
 disk.set('cart-push',{at:now-1000,beat:now-1000,files:[]});assert.ok(await T.pushMarker(),'live push (fresh beat) keeps the lock');
 disk.set('cart-push',{at:now-10*60e3,beat:now-200e3,files:[]});assert.equal(await T.pushMarker(),null,'beat older than 150 s = dead push');
 disk.set('cart-push',{at:now-60e3,files:[]});assert.ok(await T.pushMarker(),'old-format marker < 3 min still honoured');
 disk.set('cart-push',{at:now-5*60e3,files:[]});assert.equal(await T.pushMarker(),null,'old-format marker > 3 min = stale');
 disk.set('cart-push',{at:now-1000,beat:now-1000,files:[]});await T.cartUnlock();assert.equal(await T.pushMarker(),null,'manual unlock clears the marker');
 console.log('cart stale lock: all passed')})().catch(e=>{console.error(e);process.exit(1)});
