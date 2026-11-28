/* v98.1204 · LIGHTNING GL (sample) — the lightning spell in the same quality standard as Fireball I (js/vfx-gl.js runtime, stage space = world / (cw/217)).
   Timeline (s): charge at the palm .18–.90 (orb, crawling arcs, inward motes, seal on the ground, lens collapsing on the palm) → release .90 (flash + an arc thrown to the sky = the call)
   → the leader feels down from the sky .90–HIT → HIT = the strike: no projectile, the bolt drops straight onto the target (two re-strikes at +.11 / +.24 s), white flash, refractive pressure ring, blue light on the scene,
   a ring of shock + currents running over the floor, currents wrapping the body, sparks, a scorch that fades.   Nothing is drawn outside the effect; the scene stays untouched elsewhere.
   LightningGL.draw(g, e, t01, p, a, cw) → the VfxKit variant 'lightning' / 'lightningGL' · TIMING = {life, hit} ms */
(function (root) {
  'use strict';
  const FRAG = `precision highp float;
uniform sampler2D u_bg;uniform sampler2D u_noise;
uniform vec2 u_size;uniform vec2 u_off;uniform vec2 u_caster;uniform vec2 u_target;
uniform float u_t;uniform float u_hit;uniform float u_blastScale;
varying vec2 v_uv;
float sat(float x){return clamp(x,0.,1.);}
float hash(float x){return fract(sin(x*127.1+311.7)*43758.5453);}
float n3(vec3 p){
 vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 vec2 uv=i.xy+f.xy+vec2(37.,71.)*i.z+.5;
 return mix(texture2D(u_noise,uv/256.).r,texture2D(u_noise,(uv+vec2(37.,71.))/256.).r,f.z);
}
float fbm(vec3 p){return n3(p)*.55+n3(p*2.03+vec3(5.3,9.1,1.7))*.28+n3(p*4.09+vec3(17.,1.,7.))*.17;}
float bell(vec2 p){return exp(-dot(p,p));}
float segment(vec2 p,vec2 a,vec2 b){vec2 d=b-a;return length(p-a-d*clamp(dot(p-a,d)/dot(d,d),0.,1.));}
float etch(float distance,float width){return 1.-smoothstep(width,width+.72,distance);}
// Vertex f (0..1) of a jagged path a->b: a straight line pushed sideways by a seeded, end-pinned offset.
vec2 jv(vec2 a,vec2 b,float seed,float amp,float f){
 vec2 d=b-a;float L=length(d);vec2 nrm=vec2(-d.y,d.x)/max(L,.001);
 float i=floor(f*12.+.5);
 return a+d*f+nrm*(hash(seed+i*7.3)-.5)*2.*sin(f*3.14159)*amp*L;
}
float jag(vec2 p,vec2 a,vec2 b,float seed,float amp){
 float best=1e5;vec2 prev=a;
 for(int i=1;i<=12;i++){
  float f=float(i)/12.;
  vec2 q=i==12?b:jv(a,b,seed,amp,f);
  best=min(best,segment(p,prev,q));prev=q;
 }
 return best;
}
// Core + halo of a thin electric channel at distance d (stage px).
vec3 chan(float d,float w){
 return vec3(9.,9.4,11.)*exp(-d*d/(w*w*.30))+vec3(1.15,1.05,4.4)*exp(-d/(w*3.4))+vec3(.30,.22,1.35)*exp(-d/(w*15.));
}
vec3 seal(vec2 q,float r,float clock){
 float rho=length(q),angle=atan(q.y,q.x);
 float radial=abs(rho-r);
 float fine=min(radial,min(abs(rho-r*.94),abs(rho-r*.72)));
 float frame=etch(fine,.72);
 float sector=6.2831853/12.;
 float a=mod(angle+clock*.21+sector*.5,sector)-sector*.5;
 vec2 z=vec2(cos(a)*rho-.835*r,sin(a)*rho)/r;
 float id=mod(floor((angle+clock*.21+sector*.5)/sector)+24.,3.);
 float d=segment(z,vec2(-.058,0.),vec2(.068,0.));
 if(id<.5){d=min(d,segment(z,vec2(.012,-.059),vec2(.064,0.)));d=min(d,segment(z,vec2(.012,.059),vec2(.064,0.)));}
 else if(id<1.5){d=abs(abs(z.x)*.78+abs(z.y)*.68-.048);}
 else{d=min(d,segment(z,vec2(-.044,-.065),vec2(.017,0.)));d=min(d,segment(z,vec2(-.044,.065),vec2(.017,0.)));}
 float glyph=etch(d*r,.72);
 float starR=.735*r;
 vec2 top=vec2(0.,-starR),left=vec2(-.8660254,.5)*starR,right=vec2(.8660254,.5)*starR;
 float triA=min(segment(q,top,left),min(segment(q,left,right),segment(q,right,top)));
 float triB=min(segment(-q,top,left),min(segment(-q,left,right),segment(-q,right,top)));
 float hexagram=etch(min(triA,triB),1.48);
 float accents=etch(abs(rho-r*.665),.7)*smoothstep(.28,.67,cos(angle*12.+clock*2.5));
 float nib=exp(-length(vec2(rho-r*.936,sin(a)*rho))*1.05);
 return vec3(.30,.95,2.4)*(frame*.68+hexagram*1.20+accents*.56)+vec3(1.5,2.6,4.2)*(glyph*.89+nib*.62)+vec3(.05,.20,.62)*exp(-radial*.37);
}
void main(){
 vec2 px=u_off+vec2(v_uv.x,1.-v_uv.y)*u_size;
 float t=u_t,el=t-u_hit;
 float ch=sat((t-.18)/.48),charge=step(.18,t)*(1.-step(.90,t));
 vec2 caster=u_caster,target=u_target,floorAt=target+vec2(0.,141.);
 vec3 bg=texture2D(u_bg,v_uv).rgb,bg0=bg,sum=vec3(0.);
 float size=sqrt(u_blastScale/.40);
 float tick=floor(t*24.);   // electric shapes re-roll 24 times a second
 // ---- lens collapsing on the palm before the release ----
 if(t>=.64&&t<.90){
  float phase=sat((t-.64)/.26),radius=mix(78.,2.,smoothstep(0.,1.,phase));
  vec2 delta=px-caster;float dist=length(delta);
  float envelope=smoothstep(0.,.12,phase)*(1.-smoothstep(.91,1.,phase));
  if(dist<radius+22.&&dist>.001){
   vec2 normal=delta/dist;float edge=(dist-radius)/(4.+radius*.065),rim=exp(-edge*edge);
   float interior=exp(-pow(abs(dist-radius*.72)/max(3.,radius*.40),2.));
   vec2 offset=vec2(normal.x,-normal.y)*(rim*12.+interior*4.)*envelope/u_size;
   bg=vec3(texture2D(u_bg,v_uv-offset*1.20).r,texture2D(u_bg,v_uv-offset).g,texture2D(u_bg,v_uv-offset*.77).b);
   float glint=pow(.5+.5*cos(2.*atan(normal.y,normal.x)+phase*2.7),3.),lip=exp(-abs(dist-radius)/1.55);
   sum+=envelope*(vec3(.10,.22,.50)*rim+vec3(.55,1.2,2.4)*lip*(.16+.84*glint));
  }
 }
 // ---- the strike's own sky flash and the light it throws on the scene ----
 if(el>=0.){
  float flare=exp(-el*16.)*.9+.18*exp(-pow((el-.11)/.05,2.))+.1*exp(-pow((el-.24)/.05,2.));
  vec2 fd=(px-target)/(vec2(340.,300.)*size);float fall=exp(-dot(fd,fd));
  bg*=1.+vec3(.45,.60,1.5)*flare*.8*fall;sum+=vec3(.55,.62,1.5)*flare*.25*fall;
  vec2 lq=(px-target-vec2(0.,40.*size))/(vec2(330.,250.)*size);
  float light=bell(lq)*(.9*exp(-el*6.)+.22*exp(-el*2.2));
  bg=bg*(1.+vec3(.55,1.35,3.4)*light)+vec3(.03,.12,.36)*light;
 }
 // ---- pressure front: a refractive ring leaving the strike ----
 if(el>=0.&&el<.5){
  vec2 delta=px-(target+vec2(0.,28.*size));float dist=length(delta),front=size*(150.+120.*(1.-exp(-el*12.)));
  vec2 normal=delta/max(dist,.01);float edge=(dist-front)/(size*16.),pressure=exp(-edge*edge)*exp(-el*8.);
  vec2 deflect=vec2(normal.x,-normal.y)*pressure*20.*size/u_size;
  bg=vec3(texture2D(u_bg,v_uv-deflect*1.17).r,texture2D(u_bg,v_uv-deflect).g,texture2D(u_bg,v_uv-deflect*.80).b);
  sum+=vec3(.35,.85,1.9)*pressure*(.45+.55*pow(abs(dot(normal,vec2(.81,-.58))),3.));
 }
 // ---- charge at the palm: orb, crawling arcs, inward motes, seal on the ground ----
 if(charge>.5){
  float rad=mix(3.,13.,ch);vec2 q=(px-caster)/rad;
  sum+=(vec3(.8,1.9,4.2)*bell(q*.55)*.6+vec3(7.,8.,10.)*bell(q*1.6))*smoothstep(.18,.34,t);
  for(int k=0;k<5;k++){
   float j=float(k),ang=hash(j+tick*3.1)*6.2832,len=(16.+hash(j+tick*1.7+9.)*34.)*(.4+ch);
   vec2 e=caster+vec2(cos(ang),sin(ang))*len;
   sum+=chan(jag(px,caster,e,j*5.+tick,.30),1.15)*ch*step(.3,hash(j*3.+tick*.7))*.55;
  }
 }
 float gathering=smoothstep(.18,.42,t)*(1.-smoothstep(.90,1.01,t));
 if(gathering>.001){
  float r=72.+ch*12.;vec2 gc=caster+vec2(-64.,141.),gd=px-gc;
  if(abs(gd.x)<110.&&abs(gd.y)<57.){
   vec2 q=gd/vec2(1.,.34);
   if(length(q)<r+12.){
    vec2 s=vec2(.25,.25/.34);
    sum+=(seal(q+s,r,t)+seal(q-s,r,t)+seal(q+vec2(s.x,-s.y),r,t)+seal(q+vec2(-s.x,s.y),r,t))*.25*gathering;
   }
   // small bright arcs hopping along the ring
   for(int k=0;k<4;k++){
    float j=float(k),a0=hash(j+tick*2.3)*6.2832,a1=a0+.5+hash(j+tick*5.1)*.6;
    sum+=chan(jag(gd,vec2(cos(a0),sin(a0)*.34)*r,vec2(cos(a1),sin(a1)*.34)*r,j+tick,.35),1.)*gathering*step(.35,hash(j+tick*.37))*.5;
   }
  }
 }
 if(charge>.5&&abs(px.x-caster.x)<113.&&px.y>caster.y-105.&&px.y<caster.y+115.){
  for(int k=0;k<38;k++){
   float fi=float(k),q=fract(t*1.5+hash(fi*7.)),angle=fi*2.399+q*.8,r=(1.-q)*86.;
   vec2 c=caster+vec2(cos(angle)*r,sin(angle)*r*.52+(1.-q)*38.);
   float radius=1.+hash(fi)*1.4;vec2 d=(px-c)/radius;
   float energy=sin(q*3.14159)*smoothstep(.18,.32,t)*(1.-smoothstep(.64,.78,t));
   sum+=vec3(1.6,3.4,5.)*(exp(-dot(d,d)*1.4)*energy+exp(-dot(d,d)*.13)*energy*.2)*.8;
  }
 }
 // ---- release: the palm throws an arc skyward (the call) and flashes ----
 float call=smoothstep(.88,.90,t)*(1.-smoothstep(.90,u_hit,t));
 if(call>.001){
  vec2 top=caster+vec2(14.,-340.);
  float d=jag(px,caster,top,77.+tick,.12);
  sum+=chan(d,1.3)*call*.8*(1.-sat((caster.y-px.y)/380.));
 }
 vec2 cq=px-caster;float rel=t>=.90?exp(-(t-.90)*50.):0.,windup=smoothstep(.48,.86,t)*(1.-smoothstep(.89,.96,t));
 sum+=vec3(2.4,4.4,7.)*(exp(-dot(cq,cq)/300.)+exp(-abs(cq.y)*.7-abs(cq.x)*.025)*.26)*(windup+rel)*.8;
 // ---- the leader: a faint branching thread feeling down from the sky ----
 vec2 topA=vec2(target.x+34.*(hash(3.)-.5),target.y-520.*size);
 vec2 mid=target+vec2(26.*(hash(5.)-.5),-170.*size),low=target+vec2(0.,38.*size);
 float lead=sat((t-.90)/max(.05,u_hit-.90));
 float strike=el>=0.?exp(-el*9.)+.55*(el>.11?exp(-(el-.11)*14.):0.)+.35*(el>.24?exp(-(el-.24)*14.):0.):0.;
 float wob=floor(max(el,0.)*28.);
 float sd=3.+wob*.017;
 float dMain=1e5;
 if(t>=.90&&el<2.6&&abs(px.x-target.x)<330.*size&&px.y<floorAt.y+30.){
  dMain=min(jag(px,topA,mid,sd,.20),min(jag(px,mid,low,sd+1.,.26),jag(px,low,floorAt,sd+2.,.16)));
  float dBr=1e5,dSub=1e5;
  for(int k=0;k<9;k++){
   float j=float(k),f=.07+j*.095;
   vec2 s0=jv(topA,mid,sd,.20,f);
   vec2 dirv=vec2((hash(j+11.)-.5)*2.,.45+hash(j+13.)*.8);
   vec2 e0=s0+dirv*(60.+hash(j+17.)*110.)*size;
   dBr=min(dBr,jag(px,s0,e0,j*3.+sd,.30));
   if(k<5){vec2 m0=jv(s0,e0,j*3.+sd,.30,.55);dSub=min(dSub,jag(px,m0,m0+vec2((hash(j+23.)-.5)*2.,.3+hash(j+29.)*.6)*52.*size,j*5.+sd,.34));}
  }
  // forks near the ground: the bolt splits as it lands
  for(int k=0;k<3;k++){
   float j=float(k);vec2 s0=jv(mid,low,sd+1.,.26,.35+j*.22);
   dBr=min(dBr,jag(px,s0,s0+vec2((hash(j+41.)-.5)*2.4,.35+hash(j+43.)*.5)*95.*size,j+sd,.28));
  }
  if(el<0.){
   float vis=lead*lead*.18,tipMask=step(px.y,topA.y+(low.y-topA.y)*lead);
   sum+=(chan(dMain,3.6*size)+chan(dBr,1.8*size)*.6)*vis*tipMask*.8;
  }else{
   sum+=(chan(dMain,7.*size)+chan(dBr,3.6*size)*.62+chan(dSub,2.*size)*.45)*strike;
   sum+=vec3(.30,.34,1.5)*exp(-dMain/(8.*size))*exp(-el*2.4)*.55;   // the ionised channel hangs in the air after the stroke
  }
 }
 // ---- impact ----
 if(el>=0.){
  float flash=exp(-el*24.),lift=1.-exp(-el*24.);
  vec2 q=(px-target-vec2(0.,14.+11.*lift))/vec2(120.*size,104.*size);
  float edge=fbm(vec3(q*3.8,el*4.));
  float white=1.-smoothstep(.45,1.15,length(q)+(edge-.5)*.4);
  sum+=vec3(9.,11.,15.)*white*flash+vec3(.6,1.6,4.)*bell(q*.55)*exp(-el*9.);
  // the column of light bridging the strike and the floor
  float down=sat((px.y-target.y)/(floorAt.y-target.y));
  float bridge=bell(vec2((px.x-target.x)/(26.+34.*down),0.)*1.55)*smoothstep(0.,.2,down)*(1.-smoothstep(.94,1.07,(px.y-target.y)/141.));
  sum+=vec3(1.8,3.2,6.)*bridge*exp(-el*12.);
  // reflected floor glow and the ring of shock on the ground
  vec2 refl=(px-floorAt)/vec2(220.*size,70.*size);bg+=vec3(.25,.7,2.)*bell(refl)*exp(-el*6.);
  vec2 rq=(px-floorAt)/vec2(1.,.33);float rr=length(rq),rf=size*(40.+170.*(1.-exp(-el*7.)));
  sum+=vec3(.7,1.7,3.6)*exp(-pow((rr-rf)/(9.*size),2.))*exp(-el*5.5)*.9;
  float dustR=size*(50.+210.*(1.-exp(-el*5.)));vec2 dq=(px-floorAt)/vec2(1.,.33);
  bg=mix(bg,vec3(.55,.58,.72)*.55,exp(-pow((length(dq)-dustR)/(30.*size),2.))*exp(-el*3.2)*.55*(.4+.6*fbm(vec3(dq*.05,el*2.))));
  vec2 bq=(px-target)/vec2(46.*size,70.*size);bg+=vec3(.12,.18,.9)*bell(bq*1.1)*exp(-el*1.2)*(.5+.5*step(.5,hash(floor(el*22.))));
  // scorch left on the floor
  vec2 sq=(px-floorAt)/vec2(95.*size,30.*size);bg*=1.-.55*exp(-dot(sq,sq)*1.6)*sat(el*4.)*(1.-smoothstep(2.0,3.3,el));
  // ground currents: arcs run out over the floor and flicker out
  float ef=floor(el*22.);
  if(el<2.8&&abs(px.x-floorAt.x)<300.*size&&abs(px.y-floorAt.y)<110.*size){
   for(int k=0;k<12;k++){
    float j=float(k),ang=j*.5236+hash(j+ef*.37)*.5,R=(80.+hash(j+3.)*130.)*size*(1.-exp(-el*9.));
    vec2 e=floorAt+vec2(cos(ang)*R,sin(ang)*R*.33);
    float on=step(.28,hash(j*5.+ef*.61))*exp(-el*1.5);
    float d=jag(px,floorAt,e,j*4.+ef,.22);
    vec2 m=jv(floorAt,e,j*4.+ef,.22,.5);
    float d2=jag(px,m,m+vec2((hash(j+ef)-.5)*80.,(hash(j+ef+9.)-.3)*50.)*size,j+ef,.3);
    sum+=(chan(d,2.4)+chan(d2,1.4)*.7)*on*.8;
   }
  }
  // currents wrapping the body of the target
  if(el<2.6&&abs(px.x-target.x)<110.*size&&abs(px.y-target.y)<130.*size){
   for(int k=0;k<10;k++){
    float j=float(k),a0=hash(j+ef*.43)*6.2832,a1=a0+.8+hash(j+ef*.77)*1.6;
    vec2 p0=target+vec2(cos(a0)*30.,sin(a0)*54.)*size,p1=target+vec2(cos(a1)*38.,sin(a1)*66.)*size;
    float on=step(.22,hash(j*7.+ef*.29))*exp(-el*1.3);
    sum+=chan(jag(px,p0,p1,j+ef*1.3,.35),1.5*size)*on*.7;
   }
  }
  // sparks
  if(el<1.1&&abs(px.x-target.x)<260.&&px.y>target.y-195.&&px.y<target.y+195.){
   for(int k=0;k<60;k++){
    float fi=float(k),a=el-hash(fi+4.)*.03,life=.18+hash(fi+31.)*.7;
    if(a>=0.&&a<life){
     float angle=fi*2.39996,speed=200.+hash(fi+21.)*520.;
     vec2 vel=vec2(cos(angle)*speed,sin(angle)*speed*.78-30.);
     float travel=(1.-exp(-a*3.4))/3.4;
     vec2 root=k<40?target:floorAt+vec2((hash(fi+70.)-.5)*90.,0.);
     if(k>=40)vel.y=-abs(vel.y)*.55;
     vec2 c=root+vel*travel+vec2(0.,70.*a*a),tail=vel*.024*exp(-a),qq=px-c;
     float u=sat(dot(qq,-tail)/max(1.,dot(tail,tail))),dist=length(qq+tail*u);
     sum+=mix(vec3(1.2,2.6,5.),vec3(6.,7.,9.),exp(-a*14.))*exp(-dist*dist/(1.1+hash(fi)*3.))*(1.-a/life)*1.4;
    }
   }
  }
 }
 vec3 color=bg+sum;
 color=color/(vec3(1.)+max(color-bg0,0.)*.43);
 vec2 ed=min(v_uv,1.-v_uv)*u_size;color=mix(bg0,color,smoothstep(0.,110.,min(ed.x,ed.y)));
 gl_FragColor=vec4(color,1.);
}
`;
  const HIT = 1.05, LIFE = 3800, SIZE = .40, clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  let P = null;
  const prog = () => P || (P = root.VfxGL?.make({ frag: FRAG }));
  function draw(g, e, t01, p, a, cw) {
    const pr = prog(); if (!pr || !a) return false;
    const low = root.BattlePolish?.quality === 'low', s = cw / 217, t = clamp(t01) * LIFE / 1000;
    const C = { x: a.x, y: a.y - cw * .65 }, T = { x: p.x, y: p.y - cw * .65 };
    return pr.draw(g, { t, s, caster: C, target: T, pad: { l: 500, r: 500, t: 1150, b: 340 }, res: low ? .8 : 1.5, u: { u_hit: HIT, u_blastScale: SIZE * (e.scale || 1) } });
  }
  root.LightningGL = { draw, ready: () => !!prog()?.ready(), TIMING: { life: LIFE, hit: Math.round(HIT * 1000) } };
})(globalThis);
