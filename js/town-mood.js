/* v66 · Village look without new art: one light, one palette, things sitting on the ground.
   • grade(): screen-space colour grade after the scene is drawn — warm light from the top-left, darker lower-right,
     a little desaturation and contrast, vignette. Strength = GameMood (slider in ⚙ เครื่องมือ and battle settings).
   • shadows(): soft contact/cast shadows under every building, baked into the cached terrain (costs nothing per frame).
   • objects(): lamp posts along the main roads at a steady rhythm, kept off roads, plots, buildings and gates.
   Uses the village globals (locations, center, project, inv, estate, plotPoints, roadLines, roadKinds, roadPixels, lamp, ROAD). */
(function(root){'use strict';
const level=()=>root.GameMood?root.GameMood.level():.6;
function mix(c,k){return `rgb(${c.map(x=>Math.round(255-(255-x)*k)).join(',')})`}
function grade(g,W,H){const k=level();if(!k)return;g.save();g.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
 // 1. one warm light from the top-left: multiply a diagonal gradient
 g.globalCompositeOperation='multiply';let gr=g.createLinearGradient(0,0,W,H);gr.addColorStop(0,mix([255,242,218],k));gr.addColorStop(.55,mix([226,212,192],k));gr.addColorStop(1,mix([150,140,146],k));g.fillStyle=gr;g.fillRect(0,0,W,H);
 // 2. warmth + contrast
 g.globalCompositeOperation='soft-light';g.fillStyle=`rgba(255,168,92,${.22*k})`;g.fillRect(0,0,W,H);
 // 3. calm the bright greens a little
 g.globalCompositeOperation='saturation';g.fillStyle=`rgba(128,128,128,${.16*k})`;g.fillRect(0,0,W,H);
 // 4. vignette
 g.globalCompositeOperation='multiply';const r=Math.hypot(W,H)/2;gr=g.createRadialGradient(W*.5,H*.46,r*.38,W*.5,H*.5,r);gr.addColorStop(0,'#fff');gr.addColorStop(1,mix([92,84,88],k));g.fillStyle=gr;g.fillRect(0,0,W,H);
 g.restore()}
function shadows(g){const k=Math.max(.35,level());g.save();g.filter='blur(14px)';g.fillStyle=`rgba(24,30,18,${.38*k+.12})`;const p=new Path2D();
 for(const o of locations){if(!o.w||!o.d)continue;const c=center(o),L=o.id==='square'?.5:Math.min(3.2,(o.w+o.d)*.55);
  for(let s=0;s<=1;s+=.25){const du=L*s,dv=L*s*.25,pts=[[-o.w,-o.d],[o.w,-o.d],[o.w,o.d],[-o.w,o.d]].map(([a,b])=>project(c.u+a+du,c.v+b+dv));p.moveTo(pts[0].x,pts[0].y);for(const q of pts.slice(1))p.lineTo(q.x,q.y);p.closePath()}}
 g.fill(p,'nonzero');g.restore()}
/* lamps */
let lamps=[],lampKey='';
function inPoly(x,y,pts){let a=false;for(let i=0,j=pts.length-1;i<pts.length;j=i++){const p=pts[i],q=pts[j];if((p.y>y)!==(q.y>y)&&x<(q.x-p.x)*(y-p.y)/(q.y-p.y)+p.x)a=!a}return a}
function onRoad(x,y){if(!roadPixels)return true;for(const[dx,dy]of[[0,0],[10,0],[-10,0],[0,6],[0,-6]]){const X=Math.round(x+dx),Y=Math.round(y+dy);if(X<0||Y<0||X>=WORLD_W||Y>=WORLD_H)return true;if(roadPixels[(Y*WORLD_W+X)*4+3]>40)return true}return false}
function buildLamps(){lamps=[];const plots=locations.filter(o=>estate(o)).map(o=>plotPoints(o)),boxes=locations.filter(o=>o.w).map(o=>{const c=center(o);return{c,w:o.w+.8,d:o.d+.8}}),gates=(root.Village25D?.getExits()||[]).map(e=>project(e.u,e.v)),off=ROAD.main.curb/2+18,sqo=locations.find(o=>o.id==='square'),sq=sqo?(()=>{const c=center(sqo);return project(c.u,c.v)})():null;let side=1;
 roadLines.forEach((line,li)=>{if(roadKinds[li]!=='main'||line.length<2)return;let carry=220;for(let i=1;i<line.length;i++){const a={x:line[i-1].x,y:line[i-1].y*2},b={x:line[i].x,y:line[i].y*2},len=Math.hypot(b.x-a.x,b.y-a.y);if(!len)continue;const t={x:(b.x-a.x)/len,y:(b.y-a.y)/len},n={x:-t.y,y:t.x};
  let s=carry;for(;s<len;s+=440){side=-side;for(const sd of[side,-side]){const x=a.x+t.x*s+n.x*off*sd,y=(a.y+t.y*s+n.y*off*sd)/2;
    if(onRoad(x,y)||plots.some(P=>inPoly(x,y,P)))continue;const uv=inv(x,y);if(boxes.some(B=>Math.abs(uv.u-B.c.u)<B.w&&Math.abs(uv.v-B.c.v)<B.d))continue;
    if(sq&&Math.hypot(sq.x-x,(sq.y-y)*2)<560)continue;if(gates.some(q=>Math.hypot(q.x-x,(q.y-y)*2)<220)||lamps.some(q=>Math.hypot(q.x-x,(q.y-y)*2)<340))continue;lamps.push({x,y});break}}
  carry=s-len}})}
function objects(){if(!roadLines?.length||!roadPixels)return[];const key=roadLines.length+':'+locations.map(o=>o.x.toFixed(1)+o.y.toFixed(1)).join();if(key!==lampKey||!lamps.length){lampKey=key;buildLamps()}
 return lamps.map(p=>({x:p.x,y:p.y,draw:()=>lamp(p)}))}
// slider in the village ⚙ tools panel
function mount(){const panel=document.getElementById('toolsPanel');if(!panel||!root.GameMood||panel.querySelector('.moodSlider'))return;const s=root.GameMood.slider();panel.insertBefore(s,panel.querySelector('h3').nextSibling);const sh=document.createElement('label');sh.className='moodSlider';sh.innerHTML='<span>หัวแปรงถนน</span><select><option value="square">สี่เหลี่ยมมุมมน (ตามกริด)</option><option value="round">กลม (แบบเดิม)</option></select>';const sel=sh.querySelector('select');sel.value=ROAD_SHAPE;sel.onchange=()=>setRoadShape(sel.value);s.after(sh);const st=document.createElement('style');st.textContent='.moodSlider{display:grid;grid-template-columns:1fr auto;gap:2px 8px;align-items:center;font-size:13px;margin:4px 0 8px}.moodSlider input{grid-column:1/-1;width:100%}';document.head.appendChild(st);root.GameMood.onChange(()=>{terrainDirty=true})}
mount();
root.TownMood={grade,shadows,objects,lamps:()=>lamps.map(p=>({...p}))};
})(globalThis);
