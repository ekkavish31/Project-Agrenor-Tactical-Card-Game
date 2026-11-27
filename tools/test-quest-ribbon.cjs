/* v98.1163 · regression: the quest ribbon stays at 1/4 of the screen height while the lesson card appears below it. node tools/test-quest-ribbon.cjs (needs a static server: python3 -m http.server 8767) */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;
 for(const [w,h] of [[1920,1080],[1280,720],[1024,600],[800,480],[390,800]]){
  const p=await b.newPage({viewport:{width:w,height:h}});
  await p.goto('http://localhost:8767/tools/_ribbon.html');
  await p.evaluate(()=>{window.__p=QuestAnnouncement.show({title:'ไปหาผู้ใหญ่บ้าน',lesson:{title:'เดินในหมู่บ้าน',lines:Array.from({length:9},(_, i)=>'บรรทัดบทเรียนยาวๆ ข้อ '+(i+1)+' ลองเดินไปคุยกับผู้ใหญ่บ้านแล้วคลิกที่ตัวเพื่อคุย')}})});
  await p.waitForTimeout(150);
  const at=()=>p.evaluate(()=>{const r=document.querySelector('#questAnnouncement .qa-visual').getBoundingClientRect(),c=document.querySelector('#questAnnouncement .qa-card'),cr=c.hidden?null:c.getBoundingClientRect();return {cy:r.top+r.height/2,H:innerHeight,cardBottom:cr&&cr.bottom,hidden:c.hidden}});
  const a=await at();await p.waitForFunction(()=>!document.querySelector('#questAnnouncement .qa-card').hidden,null,{timeout:6000});const z=await at();
  const q=z.cy/z.H,moved=Math.abs(a.cy-z.cy)>1,over=z.cardBottom>z.H+1;
  console.log(w+'x'+h,'ribbon centre',(q*100).toFixed(1)+'%','moved',moved,'card bottom',Math.round(z.cardBottom),'/',z.H,over?'OVERFLOW':'');
  if(moved||over||(w>=800&&Math.abs(q-.25)>.02))bad++;await p.close()}
 await b.close();console.log(bad?'FAIL':'PASS');process.exit(bad?1:0)})()
