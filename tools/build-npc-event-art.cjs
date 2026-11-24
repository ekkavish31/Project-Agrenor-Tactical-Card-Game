/* v98.947 · export authored expression sheets to four static WebP files.
   One common crop per character preserves relative head/shoulder size across moods. */
const fs=require('node:fs'), path=require('node:path'), vm=require('node:vm');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const IDS=['bryn','ella','joe','ken','finn','berg','shep','pim','tess','ash','pell','hugo'];
const MOODS=['neutral','happy','angry','worry'], EVENTS=['games','toll','collect','caravan','patrol','thief'];
async function build(){
 const file='data/asset-manifest.json', M=JSON.parse(fs.readFileSync(file,'utf8'));
 const add=a=>{const i=M.assets.findIndex(x=>x.file===a.file);if(i<0)M.assets.push(a);else M.assets[i]={...M.assets[i],...a};};
 for(const id of IDS){
  const source='assets/generated-village/portrait-sources/'+id+'.png', im=await loadImage(source);
  const cells=[];let left=Infinity,top=Infinity,right=0,bottom=0;
  for(let i=0;i<4;i++){
   const x=Math.round(i*im.width/4),w=Math.round((i+1)*im.width/4)-x;
   const cv=createCanvas(w,im.height),g=cv.getContext('2d');g.drawImage(im,x,0,w,im.height,0,0,w,im.height);
   const d=g.getImageData(0,0,w,im.height).data;let n=0;
   for(let y=0;y<im.height;y++)for(let xx=0;xx<w;xx++)if(d[(y*w+xx)*4+3]>20){n++;left=Math.min(left,xx);right=Math.max(right,xx+1);top=Math.min(top,y);bottom=Math.max(bottom,y+1);}
   if(n<10000)throw Error(id+' empty expression '+i);cells.push(cv);
  }
  left=Math.max(0,left-4);top=Math.max(0,top-4);right=Math.min(Math.min(...cells.map(c=>c.width)),right+4);bottom=Math.min(im.height,bottom+4);
  const w=right-left,h=bottom-top;
  add({id:'npc-'+id+'-portrait-source',file:source,category:'characters',status:'final',transparent:true,size:[im.width,im.height],atlas:{cols:4,rows:1,names:MOODS},usedIn:'ต้นฉบับภาพสนทนา 4 อารมณ์ v98.947'});
  for(let i=0;i<4;i++){
   const cv=createCanvas(w,h);cv.getContext('2d').drawImage(cells[i],left,top,w,h,0,0,w,h);
   const target='assets/portraits/'+id+'-'+MOODS[i]+'.webp';
   fs.writeFileSync(target,cv.toBuffer('image/webp',94));
   add({id:'portrait-'+id+'-'+MOODS[i],file:target,category:'characters',status:'final',transparent:true,size:[w,h],usedIn:'StoryActors · StoryCast · BattlePortrait v98.947'});
  }
  console.log('PORTRAIT_EXPORT:'+id+' four expressions '+w+'x'+h);
 }
 for(const id of EVENTS){
  const file='assets/generated-village/events/'+id+'.png',im=await loadImage(file);
  add({id:'town-event-'+id,file,category:'scenes',status:'final',transparent:false,size:[im.width,im.height],usedIn:'TownEvents.card · เหตุการณ์เมืองเดิม v98.947'});
 }
 fs.writeFileSync(file,JSON.stringify(M,null,1)+'\n');
 fs.writeFileSync('js/asset-manifest.js','/* Generated asset manifest. */\nwindow.ASSET_MANIFEST='+JSON.stringify(M)+';\n');
 console.log('PAINTED_NPC_EXPORT:'+JSON.stringify({portraits:48,events:6,manifest:M.assets.length}));
}
build().catch(e=>{console.error(e);process.exitCode=1;});
