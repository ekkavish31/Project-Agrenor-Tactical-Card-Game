/* v98.1163/1164 · regression: the quest ribbon stays at 1/4 of the screen height while the lesson card appears below it; a long lesson is split into pages (no scrollbar, ◀ ▶, continue button only on the last page). node tools/test-quest-ribbon.cjs (needs a static server: python3 -m http.server 8767) */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();let bad=0;
 for(const [w,h] of [[1920,1080],[1280,720],[1024,600],[800,480],[390,800]]){
  const p=await b.newPage({viewport:{width:w,height:h}});
  await p.goto('http://localhost:8767/tools/_ribbon.html');
  await p.evaluate(()=>{window.__p=QuestAnnouncement.show({title:'ไปหาผู้ใหญ่บ้าน',lesson:{title:'เดินในหมู่บ้าน',lines:Array.from({length:9},(_, i)=>'บรรทัดบทเรียนยาวๆ ข้อ '+(i+1)+' ลองเดินไปคุยกับผู้ใหญ่บ้านแล้วคลิกที่ตัวเพื่อคุย')}})});
  await p.waitForTimeout(150);
  const at=()=>p.evaluate(()=>{const r=document.querySelector('#questAnnouncement .qa-visual').getBoundingClientRect(),c=document.querySelector('#questAnnouncement .qa-card'),cr=c.hidden?null:c.getBoundingClientRect();return {cy:r.top+r.height/2,rh:r.height,H:innerHeight,cardBottom:cr&&cr.bottom,hidden:c.hidden}});
  const a=await at();await p.waitForFunction(()=>!document.querySelector('#questAnnouncement .qa-card').hidden,null,{timeout:6000});const z=await at();
  const q=z.cy/z.H,moved=Math.abs(a.cy-z.cy)>1,over=z.cardBottom>z.H+1;
  /* pages */
  const info=()=>p.evaluate(()=>{const c=document.querySelector('#questAnnouncement .qa-card'),go=c.querySelector('.qa-go'),nav=c.querySelector('.qa-nav');return {pg:c.querySelector('.qa-pg').textContent,h:Math.round(c.getBoundingClientRect().height),scroll:c.scrollHeight>c.clientHeight+1,goShown:getComputedStyle(go).display!=='none',navShown:getComputedStyle(nav).display!=='none',items:c.querySelectorAll('li').length,bottom:c.getBoundingClientRect().bottom,H:innerHeight}});
  let pi=await info();const total1=+pi.pg.split('/')[1]<2;const hs=[pi.h];let pgOk=!pi.scroll&&(total1?!pi.navShown&&pi.goShown:pi.navShown&&!pi.goShown)&&pi.bottom<=pi.H+1,n=1,seen=pi.items;
  const total=+pi.pg.split('/')[1];
  while(n<total){await p.click('#questAnnouncement .qa-next');pi=await info();n++;hs.push(pi.h);seen+=pi.items;if(pi.scroll||pi.bottom>pi.H+1)pgOk=false;if((n<total)===pi.goShown)pgOk=false}
  if(total>1){await p.click('#questAnnouncement .qa-prev');const back=await info();if(+back.pg.split(' / ')[0]!==total-1)pgOk=false}
  const stable=Math.max(...hs)-Math.min(...hs)<=1;
  console.log('   pages',total,'items',seen,'/9','heights',hs.join(','),'stable',stable,'pgOk',pgOk);
  if(!pgOk||!stable||seen!==9||(total<2&&h<700))bad++;
  const after=await at();if(Math.abs(after.cy-z.cy)>1){bad++;console.log('   ribbon moved while paging')}
  console.log(w+'x'+h,'ribbon centre',(q*100).toFixed(1)+'%','moved',moved,'card bottom',Math.round(z.cardBottom),'/',z.H,over?'OVERFLOW':'');
  if(moved||over||Math.abs(z.cy-Math.max(.25*z.H,8+z.rh/2))>2)bad++;await p.close()}
 await b.close();console.log(bad?'FAIL':'PASS');process.exit(bad?1:0)})()
