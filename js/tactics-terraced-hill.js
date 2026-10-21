(function(root){
function create(seed='HILL-02',mode='training'){
 const width=25,height=25,tiles=[],key=(x,y)=>x+','+y;
 const inside=(x,y,p)=>{let v=false;for(let i=0,j=p.length-1;i<p.length;j=i++){let a=p[i],b=p[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])v=!v}return v};
 const middle=[[3,9],[6,6],[14,5],[18,7],[20,11],[18,16],[14,18],[7,18],[3,15]],summit=[[6,5],[10,3],[14,4],[17,6],[16,10],[12,12],[7,11],[5,8]];
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){const visible=Math.pow((x-12)/12.4,2)+Math.pow((y-12.5)/12.3,2)<1;let h=inside(x,y,summit)?6:inside(x,y,middle)?3:0;tiles.push({x,y,h,kind:'grass',prop:null,blocked:!visible,void:!visible,variation:((x*71+y*37)%101)/101,surfaceCorners:[h,h,h,h]})}
 const at=(x,y)=>x>=0&&y>=0&&x<width&&y<height?tiles[y*width+x]:null;
 const set=(x,y,h,kind='path')=>Object.assign(at(x,y),{h,kind,blocked:false,void:false,surfaceCorners:[h,h,h,h],route:kind==='path'});
 const flat=(x0,y0,x1,y1,h)=>{for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)set(x,y,h)};
 flat(5,22,6,23,0);flat(5,14,15,15,3);flat(13,6,15,7,6);
 function northRamp(x0,x1,bottom,n,low,high,type='ramp'){for(let i=0;i<n;i++)for(let x=x0;x<=x1;x++){let lo=low+(high-low)*i/n,hi=low+(high-low)*(i+1)/n,t=set(x,bottom-i,Math.round((lo+hi)/2));t.surfaceCorners=[hi,hi,lo,lo];t.ramp=type;}}
 northRamp(5,6,21,6,0,3);northRamp(14,15,13,6,3,6);
 flat(20,16,21,17,0);flat(18,8,21,9,3);flat(18,5,19,8,3);northRamp(20,21,15,6,0,3,'steps');
 for(let i=0;i<6;i++)for(let y=5;y<=6;y++){let lo=3+i*.5,hi=lo+.5,t=set(17-i,y,Math.round((lo+hi)/2));t.surfaceCorners=[hi,lo,lo,hi];t.ramp='steps'}
 flat(10,5,11,6,6);set(5,7,6,'grass');
 for(const [x,y] of [[4,11],[8,17],[16,16],[7,7],[10,4],[14,4],[2,16],[21,19],[17,3]]){let t=at(x,y);if(t&&!t.void&&!t.route)Object.assign(t,{blocked:true,prop:'rock',obstacleHeight:1.2})}
 for(const t of tiles){t.exits=[];if(t.blocked)continue;for(const [dx,dy,a,b] of [[1,0,[1,2],[0,3]],[-1,0,[0,3],[1,2]],[0,1,[3,2],[0,1]],[0,-1,[0,1],[3,2]]]){const n=at(t.x+dx,t.y+dy);if(n&&!n.blocked&&Math.abs(t.h-n.h)<=1&&a.every((j,i)=>Math.abs(t.surfaceCorners[j]-n.surfaceCorners[b[i]])<.001))t.exits.push(key(n.x,n.y));}}
 const allies=[{x:5,y:23},{x:6,y:23},{x:5,y:22},{x:6,y:22},{x:7,y:23}],enemies=[{x:10,y:8},{x:11,y:8},{x:9,y:8},{x:10,y:9},{x:11,y:9},{x:9,y:9},{x:8,y:8},{x:8,y:9},{x:12,y:8},{x:12,y:9}];
 const map={size:25,width,height,tiles,objects:[],seed,theme:'forest',variant:'terraced-hill',authoredTerrain:true,mode,clearance:[1,1],start:allies[0],enemy:enemies[0],spawns:{allies,enemies},landmarks:{summit:{x:11,y:8},eastFoot:{x:21,y:17}}};
 // v51: steep terrace edges become FFT rock-face slopes (shared with the terrain modules)
 const M=root.TacticsMapModules||(typeof require==='function'?require('./tactics-map-modules.js'):null);if(M?.cliffSkin)M.cliffSkin(map,seed);
 return map;
}
root.TacticsTerracedHill={create};
})(globalThis);
