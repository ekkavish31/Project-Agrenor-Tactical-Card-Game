// v98.446 · discard is awaited, atomic, and invalidates builders in other editor frames.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const disk=new Map(),channels=[],dialogs=[];let failWrite=false;
class Channel{constructor(name){this.name=name;channels.push(this)}postMessage(data){for(const c of channels)if(c!==this&&c.name===this.name)queueMicrotask(()=>{c.onmessage?.({data});c.listener?.({data})})}addEventListener(_,fn){this.listener=fn}}
function element(tag){const children=new Map(),listeners={};return{tag,style:{},isConnected:false,open:false,setAttribute(){},querySelector(key){if(!children.has(key))children.set(key,element(key));return children.get(key)},addEventListener(key,fn){listeners[key]=fn},showModal(){this.open=true;dialogs.push(this)},close(){this.open=false;listeners.close?.({})},remove(){this.isConnected=false},focus(){this.focused=true},cancel(){listeners.cancel?.({preventDefault(){}})}}}
const doc={readyState:'loading',createElement:element,body:{append(e){e.isConnected=true}},getElementById(){return null}};
function sandbox(){const ctx={Blob,Map,Set,Date,Promise,console,queueMicrotask,document:doc,location:{pathname:'/editor.html'},BroadcastChannel:Channel,localStorage:{getItem:()=>null},setTimeout:()=>1,clearTimeout(){},addEventListener(){},indexedDB:{open(){const req={};queueMicrotask(()=>{req.result={close(){},transaction(_,mode){const writes=new Map(),tx={error:new Error('disk full'),objectStore(){return{put(v,k){writes.set(k,v)},get(k){const r={};queueMicrotask(()=>{r.result=disk.get(k);r.onsuccess?.()});return r}}}};if(mode==='readwrite')queueMicrotask(()=>{if(failWrite){tx.onabort?.();return}for(const[k,v]of writes)disk.set(k,v);tx.oncomplete?.()});return tx}};req.onsuccess?.()});return req}}};ctx.window=ctx;ctx.top=ctx;
 let src=fs.readFileSync('js/github-push.js','utf8').replace('const cartApi={','window.__cartTest={BUILD,cartConfirmClear};const cartApi={');vm.runInNewContext(src,ctx);return ctx}
(async()=>{const a=sandbox(),b=sandbox();
 // A second native dialog is above the still-open cart. No game's confirm/replay is involved.
 const cart=element('dialog');cart.showModal();
 const cancel=a.__cartTest.cartConfirmClear(doc,'discard?'),box=dialogs.at(-1);assert.notEqual(box,cart);assert.equal(cart.open,true);assert.equal(box.open,true);box.querySelector('[data-cancel]').onclick();assert.equal(await cancel,false);assert.equal(cart.open,true);
 const escape=a.__cartTest.cartConfirmClear(doc,'discard?');dialogs.at(-1).cancel();assert.equal(await escape,false);
 const yes=a.__cartTest.cartConfirmClear(doc,'discard?');dialogs.at(-1).querySelector('[data-confirm]').onclick();assert.equal(await yes,true);
 const seed=()=>{disk.set('repo-staged',[['assets/draft.webp',new Blob(['image'])]]);disk.set('cart-files',[['test.js',new Blob(['draft'])]]);disk.set('cart-meta',{log:[{label:'edit'}],keys:['datum']});disk.set('repo-staged-base',{text:'old manifest'});a.__cartTest.BUILD.set('local',{fn(){}});b.__cartTest.BUILD.set('frame',{fn(){}})};seed();
 failWrite=true;await assert.rejects(a.GitHubPush.cart.clear(),/disk full/);assert.equal(disk.get('repo-staged').length,1);assert.equal(a.__cartTest.BUILD.size,1);assert.equal(b.__cartTest.BUILD.size,1);
 failWrite=false;await a.GitHubPush.cart.clear();await Promise.resolve();assert.equal((await a.GitHubPush.cart.summary()).n,0);assert.equal(disk.get('cart-meta').log.length,0);assert.equal(disk.get('repo-staged-base'),null);assert.equal(a.__cartTest.BUILD.size,0);assert.equal(b.__cartTest.BUILD.size,0);
 console.log('Cart clear: cancel / Escape / confirm, atomic failure, empty state, cross-frame builders passed');
})().catch(e=>{console.error(e);process.exit(1)});
