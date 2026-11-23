// v98.975 · after a push only the pushed copy leaves the cart; what was added during the push stays.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const disk=new Map(),channels=[],dialogs=[];let failWrite=false;
class Channel{constructor(name){this.name=name;channels.push(this)}postMessage(data){for(const c of channels)if(c!==this&&c.name===this.name)queueMicrotask(()=>{c.onmessage?.({data});c.listener?.({data})})}addEventListener(_,fn){this.listener=fn}}
function element(tag){const children=new Map(),listeners={};return{tag,style:{},isConnected:false,open:false,setAttribute(){},querySelector(key){if(!children.has(key))children.set(key,element(key));return children.get(key)},addEventListener(key,fn){listeners[key]=fn},showModal(){this.open=true;dialogs.push(this)},close(){this.open=false;listeners.close?.({})},remove(){this.isConnected=false},focus(){this.focused=true},cancel(){listeners.cancel?.({preventDefault(){}})}}}
const doc={readyState:'loading',createElement:element,body:{append(e){e.isConnected=true}},getElementById(){return null}};
function sandbox(){const ctx={Blob,Map,Set,Date,Promise,console,queueMicrotask,document:doc,location:{pathname:'/editor.html'},BroadcastChannel:Channel,localStorage:{getItem:()=>null},setTimeout:()=>1,clearTimeout(){},addEventListener(){},indexedDB:{open(){const req={};queueMicrotask(()=>{req.result={close(){},transaction(_,mode){const writes=new Map(),tx={error:new Error('disk full'),objectStore(){return{put(v,k){writes.set(k,v)},get(k){const r={};queueMicrotask(()=>{r.result=disk.get(k);r.onsuccess?.()});return r}}}};if(mode==='readwrite')queueMicrotask(()=>{if(failWrite){tx.onabort?.();return}for(const[k,v]of writes)disk.set(k,v);tx.oncomplete?.()});return tx}};req.onsuccess?.()});return req}}};ctx.window=ctx;ctx.top=ctx;
 let src=fs.readFileSync('js/github-push.js','utf8').replace('const cartApi={','window.__cartTest={BUILD,cartClearPushed};const cartApi={');vm.runInNewContext(src,ctx);return ctx}
(async()=>{const a=sandbox();
 const blob=t=>new Blob([t]);
 // snapshot = what cartPush pushed
 const A=blob('A-v1'),M=blob('manifest-1');
 const s={staged:[['assets/a.webp',A],['data/asset-manifest.json',M]],files:[['x.js',blob('x1')]],meta:{keys:['k1'],log:[]}};
 const T0=Date.now()-1000;
 // cart right after the push: A unchanged, manifest changed by B (B added during push), B file new, x.js unchanged, new log + key
 disk.set('repo-staged',[['assets/a.webp',blob('A-v1')],['data/asset-manifest.json',blob('manifest-1+B')],['assets/b.webp',blob('B')]]);
 disk.set('cart-files',[['x.js',blob('x1')],['y.js',blob('y')]]);
 disk.set('cart-meta',{log:[{label:'old',at:T0-5},{label:'B',at:T0+500}],keys:['k1','k2']});
 disk.set('repo-staged-base',{text:'base'});
 await a.__cartTest.cartClearPushed(s,T0,new Set());
 const names=k=>disk.get(k).map(x=>x[0]).join(',');
 assert.equal(names('repo-staged'),'data/asset-manifest.json,assets/b.webp');
 assert.equal(names('cart-files'),'y.js');
 assert.deepEqual(disk.get('cart-meta').log.map(l=>l.label),['B']);
 assert.deepEqual(disk.get('cart-meta').keys,['k2']);
 assert.notEqual(disk.get('repo-staged-base'),null);
 // nothing added during the push → everything leaves, base reset
 disk.set('repo-staged',[['assets/a.webp',blob('A-v1')]]);disk.set('cart-files',[]);disk.set('cart-meta',{log:[{label:'A',at:T0-5}],keys:[]});
 await a.__cartTest.cartClearPushed({staged:[['assets/a.webp',A]],files:[],meta:{keys:[],log:[]}},T0,new Set());
 assert.equal(disk.get('repo-staged').length,0);assert.equal(disk.get('cart-meta').log.length,0);assert.equal(disk.get('repo-staged-base'),null);
 console.log('Cart after push: only the pushed copy is removed; work added during the push stays (2 cases)');
})().catch(e=>{console.error(e);process.exit(1)});
