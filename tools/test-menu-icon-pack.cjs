/* The menu artwork must stay distinct, decodable and wired to the existing menu handlers. */
const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),crypto=require('node:crypto');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const pack=JSON.parse(fs.readFileSync('data/menu-icon-pack.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('data/asset-manifest.json','utf8'));
const read=p=>fs.readFileSync(p,'utf8');
(async()=>{
 assert.equal(pack.icons.length,48);const hashes=new Set();
 for(const a of pack.icons){
  const bytes=fs.readFileSync(a.file);hashes.add(crypto.createHash('sha256').update(bytes).digest('hex'));
  const im=await loadImage(bytes);assert.equal(im.width,256);assert.equal(im.height,256);
  const cv=createCanvas(256,256),g=cv.getContext('2d');g.drawImage(im,0,0);const d=g.getImageData(0,0,256,256).data;
  let clear=0,solid=0;for(let i=3;i<d.length;i+=4){if(!d[i])clear++;if(d[i]>128)solid++;}
  assert.ok(clear>1000&&solid>20000,a.key+' must have transparency and visible art');
  assert.ok(manifest.assets.some(x=>x.file===a.file&&x.status==='final'),a.key+' registration');
 }
 assert.equal(hashes.size,48,'no duplicated artwork files');
 const css=read('css/opening-cinematic.css'),paths=[];
 for(const [act,key]of Object.entries({new:'new-game',continue:'continue',load:'load-game',options:'options',extra:'extras'})){
  const re=new RegExp('button\\[data-act="'+act+'"\\]\\{--ag-icon:url\\("([^"\\n]+)"\\)\\}');
  const m=css.match(re);assert.ok(m,act);assert.equal(m[1],'../assets/icons/menu/v2-'+key+'.webp');paths.push(m[1]);
 }
 assert.equal(new Set(paths).size,5);
 const hud=read('js/town-hud.js'),p=vm.runInNewContext('('+hud.match(/const PICS = (\{[^\n]+\});/)[1]+')');
 assert.notEqual(p.map,'v2-world-map');assert.notEqual(p.activity,p.quests);assert.notEqual(p.me,p.character);assert.notEqual(p.job,'v2-forge');
 for(const name of Object.values(p))assert.ok(fs.existsSync('assets/icons/menu/'+name+'.webp'));
 assert.ok(hud.includes("['hud-' + k]"),'custom HUD choices retain precedence');
 assert.ok(read('js/nav-icons.js').includes("return v||DEFAULT_PICS[id]"),'custom nav choices retain precedence');
 // Exercise the actual menu construction and click routing, without a browser or real saves.
 const source=read('js/console-ui.js'),start=source.indexOf('  function villageMenu()'),end=source.indexOf("  addEventListener('keydown'",start);
 const clicks=[],doc={head:{append(){}},body:{append(d){doc.current=d;}},current:null,
  getElementById:()=>null,querySelector:sel=>({click(){clicks.push(sel);}}),
  createElement:()=>({innerHTML:'',querySelector:()=>({focus(){}}),remove(){doc.current=null;}})};
 const ctx={document:doc,parent:{},window:{},farmHere:()=>null,slotMenu:m=>clicks.push('slot:'+m)};
 vm.runInNewContext(source.slice(start,end)+'\nthis.open=villageMenu;',ctx);
 ctx.open();assert.ok(doc.current.innerHTML.includes('v2-system-menu.webp'));
 const tap=i=>doc.current.onclick({target:{closest:()=>({dataset:{a:String(i)}})}});
 tap(0);assert.ok(doc.current.innerHTML.includes('v2-character.webp'));tap(0);assert.deepEqual(clicks,['[data-game="character"]']);
 ctx.open();tap(2);assert.ok(doc.current.innerHTML.includes('v2-save-game.webp'));tap(0);assert.deepEqual(clicks,['[data-game="character"]','slot:save']);
 console.log('PASS 48 unique transparent menu icons, five dedicated title actions, HUD distinctions, custom selections and unchanged menu click routes');
})().catch(e=>{console.error(e);process.exitCode=1;});
