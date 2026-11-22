/* v98.947 · real Chromium decodes all exported portraits and six event illustrations. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),ids=['bryn','ella','joe','ken','finn','berg','shep','pim','tess','ash','pell','hugo'];
const server=http.createServer((req,res)=>{
 if(req.url==='/probe')return res.end('<!doctype html><body><script src="/js/webp-redirect.js"></script><script src="/js/story-actors.js"></script><script src="/js/battle-portrait.js"></script>');
 const f=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]));if(!f.startsWith(root+path.sep)||!fs.existsSync(f)){res.statusCode=404;return res.end();}
 res.setHeader('Content-Type',f.endsWith('.js')?'application/javascript':f.endsWith('.webp')?'image/webp':f.endsWith('.png')?'image/png':'application/octet-stream');fs.createReadStream(f).pipe(res);
});
(async()=>{let browser;try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));browser=await chromium.launch();const page=await browser.newPage(),errors=[],missing=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
 await page.goto('http://127.0.0.1:'+server.address().port+'/probe');
 const result=await page.evaluate(async ids=>{
  const faces=ids.flatMap(id=>['neutral','happy','angry','worry'].map(m=>StoryActors.facePic(id,{},m)));
  const files=[...faces,...['games','toll','collect','caravan','patrol','thief'].map(id=>'assets/generated-village/events/'+id+'.png')];
  const sizes=await Promise.all(files.map(async src=>{const im=new Image();im.src=src;await im.decode();const cv=document.createElement('canvas');cv.width=im.naturalWidth;cv.height=im.naturalHeight;const g=cv.getContext('2d');g.drawImage(im,0,0);const d=g.getImageData(0,0,cv.width,cv.height).data;let clear=0,solid=0;for(let i=3;i<d.length;i+=4){if(d[i]===0)clear++;if(d[i]>128)solid++;}return{src,w:cv.width,h:cv.height,clear,solid};}));
  await StoryActors.preload(ids.flatMap(who=>[{who,face:'happy'},{who,face:'angry'},{who,face:'sad'}]));
  const stage=document.createElement('div');document.body.append(stage);StoryActors.begin(stage);StoryActors.line(stage,{who:ids[0],face:'angry',text:'test'},{bust:ids[0]});
  const portrait=stage.querySelector('.art img');await portrait.decode();
  return{sizes,stageSrc:portrait.getAttribute('src')};
 },ids);
 assert.equal(result.sizes.length,54);
 for(const f of result.sizes){assert.ok(f.w>=350&&f.h>=500,f.src);assert.ok(f.solid>20000,f.src);if(f.src.includes('/portraits/'))assert.ok(f.clear>1000,f.src+' true transparency');}
 assert.equal(result.stageSrc,'assets/portraits/bryn-angry.webp');assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
 console.log('PASS Chromium: 48 transparent portraits and six town event images decode; StoryActors stage renders authored mood; zero missing files');
 }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1});
