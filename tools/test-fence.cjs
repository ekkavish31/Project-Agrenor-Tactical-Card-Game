const F=require('../js/village-fence.js');let ok=0;const t=(c,m)=>{if(!c){console.log('FAIL',m);process.exitCode=1}else ok++};
const o={id:'x',facing:'SW'},fp={u0:4,u1:4,v0:3,v1:3},c={u:0,v:0};
F.set({places:{x:{sides:{back:'hedge',left:'wood',right:'wood',front:'stone'}}}});
let p=F.plan(o,c,fp,[],'none');
t(p.length>0,'pieces');t(!p.some(q=>q.side==='front'&&Math.abs((q.A.u+q.B.u)/2)<2),'front gap at centre');
const back=p.filter(q=>q.side==='back'),left=p.filter(q=>q.side==='left');
t(Math.abs(back[0].A.u-(-3.75))<1e-9&&Math.abs(back.at(-1).B.u-3.75)<1e-9,'back spans full edge');
t(Math.abs(back[0].A.v-left[0].A.v)<1e-9&&Math.abs(back[0].A.u-left[0].A.u)<1e-9,'corner connects');
for(let i=1;i<back.length;i++)t(Math.abs(back[i].A.u-back[i-1].B.u)<1e-9,'chain');
F.set({places:{x:{sides:{back:'none',left:'none',right:'none',front:'none'}}}});
t(F.plan(o,c,fp,[],'none').length===0,'closed sides');
F.set({places:{x:{sides:{front:'wood'}}}});
p=F.plan(o,c,fp,[[6,5]],'none');// cell touches front (iv+1=6>=2*3)
t(!p.some(q=>q.side==='front'&&(q.A.u+q.B.u)/2>2&&(q.A.u+q.B.u)/2<4),'gap at yellow cell');
t(p.some(q=>q.side==='front'&&(q.A.u+q.B.u)/2<-2),'rest of front kept');
const se=F.plan({id:'x',facing:'SE'},c,fp,[],'none');t(se.every(q=>Math.abs(q.A.u)<=3.01&&Math.abs(q.A.v)<=4.01),'SE swaps axes');
t(F.clean({pieces:{a:{src:'javascript:1'}}}).pieces.a===undefined,'reject js src');
// v98.512 · fine position (px, free of the grid)
{ F.set({places:{x:{sides:{front:'wood'}}}}); const p0=F.plan(o,c,fp,[],'none').filter(q=>q.side==='front');
  F.set({places:{x:{sides:{front:'wood'},off:{front:[56,0]}}}}); const p1=F.plan(o,c,fp,[],'none').filter(q=>q.side==='front');
  t(p1.length===p0.length&&p1.every((q,i)=>Math.abs((q.A.u-p0[i].A.u)-1)<1e-9&&Math.abs((q.A.v-p0[i].A.v)+1)<1e-9),'56 px right = +1 u, −1 v (screen right on the 2:1 diamond)');
  F.set({places:{x:{sides:{front:'wood'},off:{front:[0,28]}}}}); const p2=F.plan(o,c,fp,[],'none').filter(q=>q.side==='front');
  t(p2.every((q,i)=>Math.abs((q.A.u-p0[i].A.u)-1)<1e-9&&Math.abs((q.A.v-p0[i].A.v)-1)<1e-9),'28 px down = +1 u, +1 v');
  F.set({places:{x:{sides:{front:'wood',back:'wood'},off:{all:[2.5,0],front:[1,1]}}}}); t(JSON.stringify(F.offOf('x','front'))==='[3.5,1]'&&JSON.stringify(F.offOf('x','back'))==='[2.5,0]','all + side offsets add');
  const cc=F.clean({places:{x:{off:{front:[9999,-9999],bogus:[1,1],back:[0,0]}}}}); t(JSON.stringify(cc.places.x.off)==='{"front":[300,-300]}','offsets are clamped, unknown/zero ones dropped');
  const c2=F.setOff({pieces:{},places:{}},'x','back',3,4); t(F.clean(c2).places.x.off.back[1]===4,'setOff stores'); const c3=F.setOff(F.clean(c2),'x','back',0,0); t(!c3.places.x.off,'zero offset clears it'); F.set({}); }
console.log('fence:',ok,'checks');
