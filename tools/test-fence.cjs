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
console.log('fence:',ok,'checks');
