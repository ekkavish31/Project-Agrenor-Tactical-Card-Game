/* v98.1202 · VFX GL — WebGL runtime for the "reference" spells + FIREBALL I (the owner's Agrenor-Fireball-I-Source, revision 7).
   The reference is a 1280×720 stage where the caster palm is (343,375), the target torso (965,375) and the floor 141 px below the torso. Here the stage is a unit-size space: stage = world / s with s = cw / 217
   (the figures of the reference are ≈217 px wide), so the same shader plays at any distance / angle. Only a window around the effect is rendered:
     1 · the window of the game canvas is copied (the scene) → texture u_bg (the shader refracts and lights it)
     2 · the shader (stage-space; caster / target / distance are uniforms) draws the window; the result is drawn back over the same window
   Nothing is drawn where the effect is not (the scene comes out unchanged, the tone-map only compresses what the effect adds).
   VfxGL.make({frag, atlas, textures}) → program · .draw(g, o) → false when WebGL / the atlas is not available (the caller falls back to the painted look)
   FireballGL.draw(g, e, t01, p, a, cw) → the VfxKit variant 'fire' / 'fireball'; FireballGL.TIMING = {life, hit} ms — the fight waits only until the contact. */
(function (root) {
  'use strict';
  const SRC = (typeof document !== 'undefined' && document.currentScript && document.currentScript.src) || '';
  const url = path => { if (!SRC) return path; const u = new URL('../' + path, SRC), v = new URL(SRC).searchParams.get('v'); if (v) u.searchParams.set('v', v); return u.href };
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s) };
  const VERT = 'attribute vec2 a;varying vec2 v_uv;void main(){v_uv=(a+1.)*.5;gl_Position=vec4(a,0.,1.);}';
  let gl = null, glc = null, failed = false, noiseTex = null, buf = null, stage = null, sg = null, GW = 0, GH = 0;
  const images = {}, texs = {}, progs = [];
  function init() {
    if (gl || failed) return !!gl;
    try {
      glc = document.createElement('canvas'); glc.width = glc.height = 256;
      gl = glc.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
      if (!gl) throw Error('no webgl');
      glc.addEventListener('webglcontextlost', e => { e.preventDefault(); gl = null; progs.forEach(p => p.p = null); for (const k in texs) delete texs[k]; noiseTex = null; buf = null });
      stage = document.createElement('canvas'); sg = stage.getContext('2d');
      GW = GH = 256;
    } catch (_) { failed = true; gl = null; return false }
    return true;
  }
  function compile(type, src) { const sh = gl.createShader(type); gl.shaderSource(sh, src); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(sh)); return sh }
  function link(P) {
    const p = gl.createProgram(); gl.attachShader(p, compile(gl.VERTEX_SHADER, VERT)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, P.frag)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(p));
    P.loc = {}; P.p = p; return p;
  }
  function uni(P, n) { return n in P.loc ? P.loc[n] : (P.loc[n] = gl.getUniformLocation(P.p, n)) }
  function texture(unit, repeat) {
    gl.activeTexture(gl.TEXTURE0 + unit); const x = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, x);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, repeat ? gl.REPEAT : gl.CLAMP_TO_EDGE); return x;
  }
  function image(path) { let im = images[path]; if (!im) { im = images[path] = new Image(); im.decoding = 'async'; im.src = url(path) } return im.complete && im.naturalWidth ? im : null }
  /* shared textures: unit 0 = scene · 1 = noise (repeat) · 2 = the program's atlas */
  function shared() {
    if (!buf) { buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW) }
    if (!texs.bg) texs.bg = texture(0, false);
    if (!noiseTex) {
      noiseTex = texture(1, true); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      let seed = 872361; const bytes = new Uint8Array(256 * 256 * 4);
      for (let i = 0; i < bytes.length; i += 4) { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; const n = (seed >>> 0) % 256; bytes.set([n, n, n, 255], i) }
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 256, 256, 0, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
    }
  }
  function make(def) {
    const P = { frag: def.frag, atlas: def.atlas, p: null, loc: {}, atlasTex: null, atlasOf: null, broken: false };
    P.ready = () => !!(init() && !P.broken && (!P.atlas || image(P.atlas)));
    /* o: {t, caster:{x,y}, target:{x,y} (world · chest points), s, cw, pad:{l,r,t,b} (stage units around the caster–target box), u:{name:value}, res} */
    P.draw = (g, o) => {
      if (!P.ready()) return false;
      try {
        if (!P.p) link(P);
        const m = g.getTransform(); if (Math.abs(m.b) > 1e-6 || Math.abs(m.c) > 1e-6 || m.a <= 0 || m.d <= 0) return false;
        const s = o.s, pad = o.pad, C = o.caster, T = o.target, cvs = g.canvas;
        const sx = x => (x / s), minX = Math.min(sx(C.x), sx(T.x)) - pad.l, maxX = Math.max(sx(C.x), sx(T.x)) + pad.r, minY = Math.min(C.y, T.y) / s - pad.t, maxY = Math.max(C.y, T.y) / s + pad.b;
        /* the window in canvas pixels, clipped to the canvas */
        let x0 = Math.floor(m.a * minX * s + m.e), x1 = Math.ceil(m.a * maxX * s + m.e), y0 = Math.floor(m.d * minY * s + m.f), y1 = Math.ceil(m.d * maxY * s + m.f);
        x0 = Math.max(0, x0); y0 = Math.max(0, y0); x1 = Math.min(cvs.width, x1); y1 = Math.min(cvs.height, y1);
        const cwid = x1 - x0, chei = y1 - y0; if (cwid < 8 || chei < 8) return true;
        const res = Math.min(o.res || 1, Math.sqrt(520000 / (cwid * chei)), 2.2), w = Math.max(8, Math.round(cwid * res)), h = Math.max(8, Math.round(chei * res));
        if (w > GW || h > GH || (GW > 2 * w + 64 && GH > 2 * h + 64)) { GW = Math.ceil(w / 32) * 32; GH = Math.ceil(h / 32) * 32; glc.width = GW; glc.height = GH }
        if (stage.width !== w || stage.height !== h) { stage.width = w; stage.height = h }
        sg.setTransform(1, 0, 0, 1, 0, 0); sg.globalCompositeOperation = 'copy'; sg.drawImage(cvs, x0, y0, cwid, chei, 0, 0, w, h);
        shared(); gl.useProgram(P.p);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texs.bg); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, stage);
        gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, noiseTex);
        if (P.atlas) {
          if (!P.atlasTex || P.atlasOf !== images[P.atlas]) { P.atlasTex = texture(2, false); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, images[P.atlas]); P.atlasOf = images[P.atlas] }
          gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, P.atlasTex);
        }
        gl.viewport(0, 0, w, h);
        gl.bindBuffer(gl.ARRAY_BUFFER, buf); const al = gl.getAttribLocation(P.p, 'a'); gl.enableVertexAttribArray(al); gl.vertexAttribPointer(al, 2, gl.FLOAT, false, 0, 0);
        gl.uniform1i(uni(P, 'u_bg'), 0); gl.uniform1i(uni(P, 'u_noise'), 1); gl.uniform1i(uni(P, 'u_flames'), 2);
        /* stage-space window of the clipped rectangle */
        const offX = (x0 - m.e) / m.a / s, offY = (y0 - m.f) / m.d / s, sizeX = cwid / m.a / s, sizeY = chei / m.d / s;
        gl.uniform2f(uni(P, 'u_size'), sizeX, sizeY); gl.uniform2f(uni(P, 'u_off'), offX, offY);
        gl.uniform2f(uni(P, 'u_caster'), C.x / s, C.y / s); gl.uniform2f(uni(P, 'u_target'), T.x / s, T.y / s);
        gl.uniform1f(uni(P, 'u_dist'), Math.hypot(T.x - C.x, T.y - C.y) / s); gl.uniform1f(uni(P, 'u_t'), o.t);
        for (const k in o.u) gl.uniform1f(uni(P, k), o.u[k]);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.imageSmoothingEnabled = true;
        g.drawImage(glc, 0, GH - h, w, h, x0, y0, cwid, chei); g.restore();
        return true;
      } catch (err) { P.broken = true; try { console.warn('VfxGL', err.message || err) } catch (_) { } return false }
    };
    progs.push(P); return P;
  }

  /* ---------------------------------------------------------------- FIREBALL I ---------------------------------------------------------------- */
  const FRAG = `precision highp float;
uniform sampler2D u_bg;
uniform sampler2D u_noise;
uniform sampler2D u_flames;
uniform vec2 u_size;uniform vec2 u_off;uniform vec2 u_caster;uniform vec2 u_target;uniform float u_dist;
uniform float u_t;
uniform float u_hit;
uniform float u_blastScale;
varying vec2 v_uv;
float sat(float x){return clamp(x,0.,1.);}
float hash(float x){return fract(sin(x*127.1+311.7)*43758.5453);}
float n3(vec3 p){
 vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 vec2 uv=i.xy+f.xy+vec2(37.,71.)*i.z+.5;
 return mix(texture2D(u_noise,uv/256.).r,texture2D(u_noise,(uv+vec2(37.,71.))/256.).r,f.z);
}
float fbm(vec3 p){return n3(p)*.55+n3(p*2.03+vec3(5.3,9.1,1.7))*.28+n3(p*4.09+vec3(17.,1.,7.))*.17;}
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
vec3 palette(float h){
 vec3 red=vec3(.65,.027,.003),orange=vec3(3.0,.32,.015),gold=vec3(5.5,2.3,.25),white=vec3(6.0,4.6,2.1);
 return h<.38?mix(red,orange,h/.38):h<.76?mix(orange,gold,(h-.38)/.38):mix(gold,white,(h-.76)/.24);
}
// Atlas UVs are top-down on both WebGL and EGL.
vec3 cell(vec2 uv,float id){
 vec2 pos=(vec2(mod(id,4.),floor(id/4.))+clamp(uv,.003,.997))/vec2(4.,2.);
 return texture2D(u_flames,pos).rgb;
}
vec3 painted(vec2 uv,float stage){
 if(min(uv.x,uv.y)<0.||max(uv.x,uv.y)>1.)return vec3(0.);
 float k=clamp(stage,0.,7.);
 return mix(cell(uv,floor(k)),cell(uv,min(7.,floor(k)+1.)),smoothstep(0.,1.,fract(k)));
}
// Compact hot orb for the caster's hand and the projectile head.
void orb(vec2 p,float t,out vec3 emission,out float alpha){
 emission=vec3(0.);float tr=1.;
 for(int i=0;i<12;i++){
  float z=-1.+float(i)*.1818;
  vec3 q=vec3(p,z);float n=fbm(q*3.+vec3(0.,-t*4.,t*.2));
  float d=(1.-smoothstep(.65,1.05,length(q)+(n-.5)*.38));
  float h=sat(.98-length(q)*.27+(n-.5)*.5);
  float a=1.-exp(-d*.32);emission+=tr*a*palette(h)*.72;tr*=1.-a;
 }
 alpha=1.-tr;
}
float bell(vec2 p){return exp(-dot(p,p));}
float plane(vec2 pos,vec2 dir){return dot(pos,dir);}

// Flame shapes in local coordinates: root at (0,0), up along positive y.
vec3 plume(vec2 q,float clock,float seed,float family,float pose){
 if(q.y<-.09 || q.y>1.21 || abs(q.x)>.96)return vec3(0.);
 float h=clamp(q.y,0.,1.15), k=seed*19.;
 float t=clock*(3.6+2.5*seed);
 float breeze=.075*sin(t-h*6.+k)+.040*sin(t*1.57-h*11.-k);
 float drift=(seed-.46)*.48*h*h;
 float bend=h*(breeze*(1.+h)+drift);
 float width=.24,split=0.,curl=0.;
 if(family<.5){ // Thin S-shaped wick.
  bend+=h*.19*sin(h*6.1-t*.60+k);width=.25;
 }else if(family<1.5){ // Fork: distinct hot channels separate towards the tip.
  split=smoothstep(.15,.84,h)*.28;width=.25;
 }else if(family<2.5){ // Low, broad rolling flame opens into a torn crown.
  bend+=h*.09*sin(h*9.+t*.6);width=.40;
 }else{ // Wind-swept hook, with a retreating curl along the lee side.
  curl=.37*sin(h*3.8+t*.54+k)*h;bend+=curl;width=.27;
 }
 float x=q.x-bend;
 vec2 flow=vec2(x*6.+k,h*6.-t);
 float n=fbm(vec3(flow,seed*8.+clock*.45));
 float fine=n3(vec3(flow*2.6+vec2(h*1.9,-t*.4),k));
 float taper=pow(max(.002,1.-h),.70);
 float radius=width*taper*(.67+.72*n);
 float edge=(n-.5)*.135+(fine-.5)*.035;
 float channel=abs(x+edge);
 if(family>.5 && family<1.5){
  channel=min(abs(x-split+edge),abs(x+split*.78+edge)*1.42+.065*h);
 }else if(family>1.5 && family<2.5){
  channel=min(channel,min(abs(x-.17*h+edge*1.5),abs(x+.25*h+edge)));
  radius*=1.-.34*smoothstep(.25,.85,h);
 }
 float top=h+(n-.49)*.26+.055*sin(x*20.+k);
 float shape=(1.-smoothstep(radius*.40,radius+.024,channel))*smoothstep(-.065,.035,q.y)*(1.-smoothstep(.74,1.,top));
 float heat=clamp(.78-.46*h+(n-.52)*.98+(fine-.5)*.26-channel*.9,0.,1.);
 vec3 procedural=palette(heat)*shape*(.35+.65*smoothstep(.28,.68,n+.08*taper));
 vec2 art=vec2(.5+(x+.045*(n-.5))/(width*3.15),1.-q.y);
 vec3 ink=painted(art,pose)*smoothstep(-.04,.055,q.y);
 // Break up and extinguish narrow high tips, including the painted contribution.
 float tip=1.-smoothstep(.65+.10*n,.88+.05*fine,h);
 return (procedural*.56+ink*vec3(1.12,.74,.47)*(.34+.57*shape))*tip;
}
float segment(vec2 p,vec2 a,vec2 b){
 vec2 d=b-a;return length(p-a-d*clamp(dot(p-a,d)/dot(d,d),0.,1.));
}
float etch(float distance,float width){return 1.-smoothstep(width,width+.72,distance);}
vec3 seal(vec2 q,float r,float clock){
 float rho=length(q),angle=atan(q.y,q.x);
 float radial=abs(rho-r);
 float fine=min(radial,min(abs(rho-r*.94),abs(rho-r*.72)));
 float frame=etch(fine,.72);
 float sector=6.2831853/12.;
 float a=mod(angle+clock*.21+sector*.5,sector)-sector*.5;
 vec2 z=vec2(cos(a)*rho-.835*r,sin(a)*rho)/r;
 // Alternating engraved sigils between the two outer rings.
 float id=mod(floor((angle+clock*.21+sector*.5)/sector)+24.,3.);
 float d=segment(z,vec2(-.058,0.),vec2(.068,0.));
 if(id<.5){
  d=min(d,segment(z,vec2(.012,-.059),vec2(.064,0.)));
  d=min(d,segment(z,vec2(.012,.059),vec2(.064,0.)));
 }else if(id<1.5){
  d=abs(abs(z.x)*.78+abs(z.y)*.68-.048);
 }else{
  d=min(d,segment(z,vec2(-.044,-.065),vec2(.017,0.)));
  d=min(d,segment(z,vec2(-.044,.065),vec2(.017,0.)));
 }
 float glyph=etch(d*r,.72);
 // Signed distances to the six straight segments of two equilateral triangles.
 float starR=.735*r;
 vec2 top=vec2(0.,-starR),left=vec2(-.8660254,.5)*starR,right=vec2(.8660254,.5)*starR;
 float triA=min(segment(q,top,left),min(segment(q,left,right),segment(q,right,top)));
 float triB=min(segment(-q,top,left),min(segment(-q,left,right),segment(-q,right,top)));
 float hexagram=etch(min(triA,triB),1.48);
 float accents=etch(abs(rho-r*.665),.7)*smoothstep(.28,.67,cos(angle*12.+clock*2.5));
 float nib=exp(-length(vec2(rho-r*.936,sin(a)*rho))*1.05);
 return vec3(1.9,.52,.105)*(frame*.68+hexagram*1.20+accents*.56)
      +vec3(3.3,1.57,.42)*(glyph*.89+nib*.62)+vec3(.64,.112,.011)*exp(-radial*.37);
}
void main(){
 vec2 px=u_off+vec2(v_uv.x,1.-v_uv.y)*u_size;
 float t=u_t,flight=step(.90,t)*(1.-step(u_hit,t));
 float ch=sat((t-.18)/.48),charge=step(.18,t)*(1.-step(.90,t));
 vec2 caster=u_caster,target=u_target;
 vec3 bg=texture2D(u_bg,v_uv).rgb,bg0=bg;
 vec3 sum=vec3(0.);float trans=1.;
 // A closing refractive surface redirects samples of the scene itself, including the caster.
 if(t>=.64 && t<.90){
  float phase=sat((t-.64)/.26);
  float radius=mix(78.,2.,smoothstep(0.,1.,phase));
  vec2 delta=px-caster;
  float dist=length(delta);
  float envelope=smoothstep(0.,.12,phase)*(1.-smoothstep(.91,1.,phase));
  if(dist<radius+22. && dist>.001){
   vec2 normal=delta/dist;
   float edge=(dist-radius)/(4.0+radius*.065);
   float rim=exp(-edge*edge);
   float interior=exp(-pow(abs(dist-radius*.72)/max(3.,radius*.40),2.));
   float bend=(rim*12.+interior*4.)*envelope;
   vec2 offset=vec2(normal.x,-normal.y)*bend/u_size;
   bg=vec3(texture2D(u_bg,v_uv-offset*1.20).r,
           texture2D(u_bg,v_uv-offset).g,texture2D(u_bg,v_uv-offset*.77).b);
   float a=atan(normal.y,normal.x);
   float glint=pow(.5+.5*cos(2.*a+phase*2.7),3.);
   float lip=exp(-abs(dist-radius)/1.55);
   sum+=envelope*(vec3(.37,.15,.07)*rim+vec3(1.65,.98,.53)*lip*(.16+.84*glint));
  }
 }
 float elapsed=t-u_hit;
 vec2 floorAt=target+vec2(0.,141.);
 float size=sqrt(u_blastScale/.40);
 // A refractive front extends beyond both the hot core and the spreading fuel.
 if(elapsed>=0.&&elapsed<.48){
  vec2 delta=px-(target+vec2(0.,28.*size));
  float dist=length(delta),front=size*(185.+100.*(1.-exp(-elapsed*13.)));
  vec2 normal=delta/max(dist,.01);
  float edge=(dist-front)/(size*18.);
  float pressure=exp(-edge*edge)*exp(-elapsed*9.);
  vec2 deflect=vec2(normal.x,-normal.y)*pressure*22.*size/u_size;
  bg=vec3(texture2D(u_bg,v_uv-deflect*1.17).r,texture2D(u_bg,v_uv-deflect).g,
          texture2D(u_bg,v_uv-deflect*.80).b);
  float glint=(.45+.55*pow(abs(dot(normal,vec2(.81,-.58))),3.));
  sum+=vec3(1.38,.50,.17)*pressure*glint;
 }
 if(elapsed>=0.){
  // Preserve masonry and figure detail in the broad orange bounce.
  vec2 lightQ=(px-target-vec2(0.,40.*size))/(vec2(378.,257.)*size);
  float light=bell(lightQ)*(.98*exp(-elapsed*5.4)+.23*exp(-elapsed*2.4));
  bg=bg*(1.+vec3(2.9,1.0,.11)*light)+vec3(.64,.145,.021)*light;
 }
 if(elapsed>=0.&&elapsed<1.25&&abs(px.x-target.x)<270.*size&&px.y>target.y-235.-45.*size&&px.y<target.y+160.+40.*size){
  // Back-to-front depth layers. Rising floor pockets and airborne ejecta share
  // a pressure impulse but have different launch heights, speeds and cooling.
  for(int k=0;k<39;k++){
   float j=float(k),seed=hash(j+45.),z=(j+.5)/39.,angle=j*2.39996+.52*hash(j+29.);
   bool floorJet=mod(j,3.)<1.;
   float local=elapsed-.055*hash(j+21.);
   float life=.52+.62*hash(j+34.),age=local/life;
   if(local<0.||age>=1.)continue;
   float impulse=1.-exp(-local*(5.4+3.8*seed));
   float travel=(22.+127.*hash(j+80.))*impulse*size;
   vec2 delta=vec2(cos(angle)*travel,sin(angle)*travel*(floorJet?.26:.53));
   vec2 origin=floorJet?floorAt:target+vec2(0.,26.*impulse*size);
   delta.y+=(z-.5)*32.*impulse*size;
   delta.y-=(floorJet?64.:18.)*impulse*size+39.*age*age*size;
   vec2 center=origin+delta;
   float rad=(23.+24.*seed)*(1.+.34*z)*size*(.43+.74*impulse)*(1.-.23*age);
   vec2 q=(px-center)/(vec2(1.07,.91+.32*hash(j+18.))*rad);
   if(dot(q,q)>2.30)continue;
   float shell=sqrt(max(0.,1.-dot(q,q)));
   vec3 pos=vec3(q,shell);
   pos.xy=rot((seed-.5)*1.9*local)*pos.xy;
   vec3 flow=pos*(2.4+.9*seed)+vec3(j*.81,-local*2.8,j*3.);
   vec3 warp=vec3(n3(flow),n3(flow+13.),n3(flow+32.))-.5;
   float n=fbm(flow+warp*1.35);
   float fine=n3(flow*3.8+warp*.8);
   float profile=1.-length(q)+(n-.51)*.91+(fine-.50)*.13;
   float coverage=smoothstep(-.04,.22,profile)*(1.-smoothstep(.44,1.,age));
   float split=smoothstep(.36+age*.21,.71+age*.18,n+.09*profile);
   float lit=max(0.,dot(normalize(vec3(q,max(.05,shell))),normalize(vec3(-.40,-.56,.72))));
   float ridge=smoothstep(.40,.77,n*.66+fine*.34);
   float heat=clamp(.24+.35*split+.23*ridge+.07*lit+.05*profile-age*.19,0.,1.);
   vec3 skin=palette(heat)*(.23+.40*split+.23*ridge)*(.62+.49*lit);
   vec2 uv=vec2(.5+q.x*.47,.50+q.y*.45);
   skin+=painted(uv,2.5+age*4.+seed*.7)*vec3(1.05,.58,.31);
   float erosion=smoothstep(.20+age*.27,.50+age*.23,n+.065*profile);
   float alpha=coverage*(.29+.63*split)*erosion*smoothstep(0.,.042,local);
   sum=mix(sum,skin,alpha);trans*=1.-alpha;
   if(mod(j,3.)<1.5){
    vec2 axis=normalize(vec2(cos(angle)*.96,sin(angle)*.52-.58));
    vec2 rel=q-axis*.60;
    vec2 flameUV=vec2(dot(rel,vec2(-axis.y,axis.x))*.88,dot(rel,axis)*1.32+.20);
    float tip=1.-smoothstep(1.20,1.50,length(q));
    sum+=plume(flameUV,j+local,seed,mod(j,4.),3.+age*3.)*tip*.30*(1.-smoothstep(.3,.92,age))*smoothstep(0.,.095,local);
   }
  }
 }
 vec2 lightPos=target;float intensity=0.;
 if(charge>.5||flight>.5){
  float f=sat((t-.90)/max(.05,u_hit-.90));
  vec2 center=charge>.5?caster:mix(caster,target,f);
  float radius=charge>.5?mix(3.,13.,ch):13.;
  vec2 q=(px-center)/radius;
  // All flight geometry is evaluated in distance from the palm, including the soft ends.
  vec2 dir=normalize(target-caster),normal=vec2(-dir.y,dir.x);
  float fromPalm=plane(px-caster,dir),traveled=length(center-caster);
  float lag=traveled-fromPalm,side=dot(px-center,normal);
  float forwardMask=smoothstep(0.,2.5,fromPalm);
  if(flight>.5){
   // The long axis follows the shot direction. The tapered shoulder opens into its wake.
   q=vec2(-lag/20.,side/8.2);
   if(fromPalm>=0.&&lag>=-24.&&lag<u_dist&&abs(side)<60.){
    float d=max(lag,0.),u=d/u_dist,endFade=1.-smoothstep(.63,1.,u);
    float age=t-.90;
    // A pulse of hot gas leaves the head and rolls down the tail. The phase
    // travels in head-local space; the time envelope remains visible in a single short flight.
    float flutter=smoothstep(4.,82.,d);
    float roll=sin(d*.033-age*33.)+.42*sin(d*.061-age*46.+.8);
    float centerline=flutter*(10.+3.*u)*roll*(1.-.55*u);
    float width=mix(10.7,1.45,smoothstep(0.,.58,u))*(1.+.19*flutter*cos(d*.045-age*38.));
    float n=fbm(vec3(d*.045-age*18.,(side-centerline)*.10,age*3.));
    float warp=centerline+(n-.5)*width*.70;
    float cap=smoothstep(-23.,1.,lag)*forwardMask*endFade;
    float wake=exp(-abs(side-warp)/width*2.)*smoothstep(.22,.69,n)*exp(-d*.008);
    sum+=vec3(3.2,.39,.032)*wake*cap;
    for(int k=0;k<3;k++){
     float j=float(k);
     float len=(156.+j*102.)*(1.+.14*sin(age*(23.+2.*j)+j));
     float fraction=d/len;
     if(fraction<1.){
      float phase=d*(.035+.009*j)-age*(37.+6.*j)+j*2.1;
      float offset=(j-1.)*(6.+3.*sin(phase*.65))*(1.-fraction);
      float lick=sin(phase)*(.6+5.5*flutter)+sin(phase*1.65+j)*2.8*flutter;
      float v=(side-warp-offset-lick)/max(2.,width*(.69+.31*(1.-fraction)));
      vec2 uv=vec2(.5+v*.41,1.-fraction);
      vec3 fire=painted(uv,3.6+1.29*sin(age*(24.+j*3.)-fraction*8.+j));
      sum+=fire*vec3(2.65,1.32,.65)*cap*(1.-smoothstep(.72,1.,fraction));
     }
    }
    float filament=exp(-abs(side-warp)/max(.80,width*.22))*exp(-d*.0038);
    sum+=vec3(3.6,1.22,.25)*filament*cap;
    sum+=vec3(.78,.075,.009)*exp(-abs(side-warp)/max(1.4,width*.68))*exp(-d*.0028)*cap;
   }
  }
  if(length(q)<2.){
   vec3 e;float a;orb(q,t,e,a);
   float fade=charge>.5?smoothstep(.18,.34,t):forwardMask;
   sum+=(e*.8+vec3(5.,4.5,3.25)*bell(q*1.8))*fade;trans*=1.-a*fade;
  }
  vec2 halo=(px-center)/vec2(83.,73.);sum+=vec3(1.9,.36,.025)*exp(-dot(halo,halo)*2.9)*.055*(charge>.5?ch:1.);
  lightPos=center;intensity=charge>.5?ch*.31:.35;
 }
 if(elapsed>=0.)intensity+=exp(-elapsed*6.)*.9;
 // A contact-rooted impulse travels from the torso down to the first ignited floor patch.
 float burn=step(0.,elapsed)*(1.-smoothstep(1.85,2.95,elapsed));
 float groundScale=.70*size;
 float patchR=135.*groundScale;
 vec2 patchQ=(px-floorAt)/vec2(patchR,patchR*.33);
 float patch=1.-smoothstep(.70,1.12,length(patchQ));
 if(elapsed>=0.&&abs(px.x-floorAt.x)<patchR*1.7&&px.y>floorAt.y-175.*size&&px.y<floorAt.y+patchR*.52){
  float grain=fbm(vec3(patchQ*4.6,4.2));
  bg*=1.-patch*(.23+.56*grain)*smoothstep(.02,.30,elapsed);
  float spread=1.-exp(-elapsed*14.);
  float front=exp(-abs(length(patchQ)+.16*(grain-.5)-spread)*12.)*exp(-elapsed*4.);
  sum+=vec3(4.,.58,.07)*front*(.23+.9*grain);
  sum+=vec3(1.60,.14,.016)*burn*patch*smoothstep(.38,.71,grain)*(.40+.60*spread);
  if(burn>.001){
   for(int k=0;k<34;k++){
    float j=float(k),seed=hash(j+10.),angle=j*2.39996+seed*.55;
    float r=k==0?0.:pow(hash(j+54.),1.20)*.98;
    float start=r*.115,local=elapsed-start;
    if(local>=0.){
     float phase=local/(1.68+.91*(1.-r)+seed*.60);
     float strength=1.-smoothstep(.56,1.,phase);
     float surge=exp(-local*5.5);
     vec2 root=floorAt+vec2(cos(angle),sin(angle)*.33)*r*patchR;
     float family=mod(j,4.);
     float w=(32.+39.*seed)*groundScale*(1.+surge*.40);
     float h=(31.+57.*hash(j+16.))*size*(.60+.40*strength)*(1.+.57*surge);
     if(family>1.5&&family<2.5){w*=1.42;h*=.55;}
     h=min(min(h,w*1.16),50.*size);
     h*=.93+.12*sin(local*(4.8+seed*3.)+j);
     vec2 q=vec2((px.x-root.x)/w,(root.y-px.y)/h);
     q.x-=q.y*q.y*(.11*sin(local*3.7+j)+.14*cos(angle));
     float pose=mix(2.9+.95*sin(local*(5.+seed*4.)+j),6.7,smoothstep(.43,1.,phase));
     sum+=plume(q,local+j*.41,seed,family,pose)*vec3(.94,.80,.65)*strength*burn;
    }
   }
  }
 }
 // A small fiery charge circle at the caster's feet, fading on release.
 float gathering=smoothstep(.18,.42,t)*(1.-smoothstep(.90,1.01,t));
 if(gathering>.001){
  float r=72.+ch*12.;
  vec2 q=(px-(caster+vec2(-64.,141.)))/vec2(1.,.34);
  // Flame packets orbit in the ground plane with trailing tongues rising above their roots.
  vec2 groundDelta=px-(caster+vec2(-64.,141.));
  if(abs(groundDelta.x)<110.&&abs(groundDelta.y)<57.){
   vec3 orbit=vec3(0.);
   for(int k=0;k<18;k++){
    float j=float(k),a=j*2.39996+(t-.18)*7.6;
    float depth=sin(a);
    vec2 root=vec2(cos(a)*(r+4.),depth*(r+4.)*.34);
    vec2 tangent=normalize(vec2(-sin(a),.34*cos(a)));
    vec2 rel=groundDelta-root;
    float back=-dot(rel,tangent);
    float w=14.+hash(j+22.)*15.;
    float lift=(6.+hash(j+7.)*14.)*(.82+.18*sin(t*12.+j));
    vec2 uv=vec2(.5+rel.x/w+.26*tangent.x*(1.-clamp(1.+rel.y/lift,0.,1.)),1.+rel.y/lift);
    float streak=exp(-abs(rel.x*tangent.y-rel.y*tangent.x)/2.1)*exp(-abs(back)/13.);
    vec3 licks=painted(uv,3.25+1.10*sin(j+t*(5.+hash(j)*4.)));
    float occ=depth<0.?.5:1.;
    orbit+=(licks*vec3(2.45,.96,.29)+vec3(1.3,.22,.025)*streak)*occ;
   }
   sum+=orbit*gathering;
  }
  if(length(q)<r+12.){
   vec2 stepAA=vec2(.25,.25/.34);
   vec3 engraving=seal(q+stepAA,r,t)+seal(q-stepAA,r,t)
                 +seal(q+vec2(stepAA.x,-stepAA.y),r,t)+seal(q+vec2(-stepAA.x,stepAA.y),r,t);
   sum+=engraving*.25*gathering;
  }
 }
 // A brief casting flare and an impact flare, each anchored to its source.
 float release=t>=.90?exp(-(t-.90)*62.):0.;
 vec2 cq=px-caster;float castFlare=exp(-dot(cq,cq)/310.)+exp(-abs(cq.y)*.7-abs(cq.x)*.025)*.26;
 float windup=smoothstep(.48,.86,t)*(1.-smoothstep(.89,.96,t));
 vec2 star=rot(.14)*cq;
 sum+=vec3(5.2,3.3,1.65)*(castFlare*.85+exp(-abs(star.y)*.45-abs(star.x)*.035)*.60)*(windup+release);
 float preFlash=exp(-pow((abs(t-.842)/.045),2.));
 vec2 castQ=(px-caster)/vec2(93.,79.);
 sum+=preFlash*(vec3(2.2,.64,.16)*bell(castQ*1.45)+vec3(8.3,5.2,2.3)*bell(castQ*4.8)
       +vec3(2.8,1.3,.40)*exp(-abs(star.y)/2.6-abs(star.x)/54.));
 if(elapsed>=0.){
  float flash=exp(-elapsed*25.),lift=1.-exp(-elapsed*24.);
  vec2 q=(px-target-vec2(0.,14.+11.*lift))/vec2(124.*size,104.*size);
  float edge=fbm(vec3(q*3.8,elapsed*4.));
  float white=1.-smoothstep(.53,1.23,length(q)+(edge-.5)*.40);
  sum+=vec3(13.,10.,7.8)*white*flash;
  sum+=vec3(3.5,.62,.095)*bell(q*.52)*exp(-elapsed*10.);
  float down=sat((px.y-target.y)/(floorAt.y-target.y));
  vec2 axis=vec2((px.x-target.x)/(32.+41.*down),0.);
  float bridge=bell(axis*1.55)*smoothstep(0.,.22,down)*(1.-smoothstep(.94,1.07,(px.y-target.y)/141.));
  sum+=vec3(5.2,2.1,.45)*bridge*exp(-elapsed*13.);
  vec2 reflected=(px-floorAt)/vec2(230.*size,72.*size);
  bg+=vec3(1.7,.39,.06)*bell(reflected)*exp(-elapsed*7.);
 }
 vec2 floorP=(px-vec2(lightPos.x,lightPos.y+141.))/vec2(145.,47.);
 bg+=vec3(.58,.18,.022)*exp(-dot(floorP,floorP)*1.8)*intensity;
 vec2 body=(px-lightPos)/vec2(90.,105.);bg+=vec3(.30,.065,.006)*exp(-dot(body,body)*2.)*intensity;
 vec2 ground=(px-floorAt)/(vec2(115.,38.)*groundScale);bg+=vec3(.19,.047,.004)*exp(-dot(ground,ground)*2.)*burn;
 if(elapsed>=0.){vec2 halo=(px-target)/vec2(135.,113.);sum+=vec3(1.8,.34,.035)*exp(-dot(halo,halo)*2.4)*exp(-elapsed*23.)*.40;}
 // Brighter inward charge motes, evaluated in WebGL on the same clock.
 if(charge>.5&&abs(px.x-caster.x)<113.&&px.y>caster.y-105.&&px.y<caster.y+115.){
  for(int k=0;k<38;k++){
   float fi=float(k),q=fract(t*1.5+hash(fi*7.)),angle=fi*2.399+q*.8,r=(1.-q)*86.;
   vec2 c=caster+vec2(cos(angle)*r,sin(angle)*r*.52+(1.-q)*38.);
   float radius=1.+hash(fi)*1.4;vec2 d=(px-c)/radius;
   float energy=sin(q*3.14159)*smoothstep(.18,.32,t)*(1.-smoothstep(.64,.78,t));
   float point=exp(-dot(d,d)*1.4)*energy;
   float glow=exp(-dot(d,d)*.13)*energy*.20;
   sum+=vec3(4.8,2.4,.61)*(point+glow)*.83;
  }
 }
 // Ballistic impact sparks; every spark retains its own birth and lifetime.
 if(elapsed>=0.&&elapsed<1.15&&abs(px.x-target.x)<260.&&px.y>target.y-195.&&px.y<target.y+195.){
  for(int k=0;k<78;k++){
   float fi=float(k),a=elapsed-hash(fi+4.)*.025,life=.20+hash(fi+31.)*.82;
   if(a>=0.&&a<life){
    float angle=fi*2.39996,speed=220.+hash(fi+21.)*580.;
    vec2 vel=vec2(cos(angle)*speed,sin(angle)*speed*.78-24.);
    float travel=(1.-exp(-a*3.1))/3.1;
    vec2 root=(k<48)?target:floorAt+vec2((hash(fi+70.)-.5)*90.,0.);
    if(k>=48)vel.y=-abs(vel.y)*.60;
    vec2 c=root+vel*travel+vec2(0.,72.*a*a);
    vec2 tail=vel*.027*exp(-a);vec2 q=px-c;
    float u=sat(dot(q,-tail)/max(1.,dot(tail,tail)));
    float dist=length(q+tail*u);
    float spark=exp(-dist*dist/(1.20+hash(fi)*3.6))*(1.-a/life);
    sum+=mix(vec3(3.5,.65,.05),vec3(5.,3.3,1.5),exp(-a*14.))*spark*1.55;
   }
  }
 }
 // Grey rising vapour is emitted locally from the body and the ground.
 float smokeAlpha=0.;vec3 smokeLight=vec3(0.);
 if(elapsed>1.16&&elapsed<4.8&&px.x>target.x-155.&&px.x<target.x+155.&&px.y>target.y-205.&&px.y<target.y+155.){
  for(int k=0;k<28;k++){
   float fi=float(k),born=1.16+hash(fi+12.)*1.77,a=elapsed-born,life=1.15+hash(fi+27.)*.80;
   if(a>=0.&&a<life){
    bool groundSource=k<16;
    vec2 source=groundSource?vec2(target.x+(hash(fi+6.)-.5)*145.,floorAt.y+(hash(fi+34.)-.5)*40.):vec2(target.x+(hash(fi+6.)-.5)*48.,target.y+22.+hash(fi+44.)*55.);
    vec2 c=source+vec2((hash(fi+7.)-.5)*a*18.+6.*a*sin(fi+a*2.),-a*(39.+hash(fi+3.)*25.));
    vec2 q=(px-c)/vec2(10.+a*14.,14.+a*20.);
    if(length(q)<1.7){
     float n=fbm(vec3(q*2.3,fi*1.3-t*.36));
     float shape=1.-length(q)+(n-.50)*.48;
     float opacity=smoothstep(-.10,.65,shape)*sin(a/life*3.14159)*.25;
     vec3 grey=mix(vec3(.28,.285,.29),vec3(.58,.575,.57),n);
     smokeLight+=(1.-smokeAlpha)*opacity*grey;smokeAlpha+=(1.-smokeAlpha)*opacity;
    }
   }
  }
 }
 vec3 color=(bg*trans+sum)*(1.-smokeAlpha)+smokeLight;

 color=color/(vec3(1.)+max(color-bg0,0.)*.43);
 vec2 ed=min(v_uv,1.-v_uv)*u_size;color=mix(bg0,color,smoothstep(0.,110.,min(ed.x,ed.y)));   /* the window edge never shows */
 gl_FragColor=vec4(color,1.);
}
`;
  const HIT = 1.30, LIFE = 4600, SIZE = .40;   /* the shader's own clock: charge .18–.90 s · flight to HIT · impact · smoke to 6.2 s */
  const FB = make({ frag: FRAG, atlas: 'assets/fx/anim/fire-flames8.webp' });
  /* the small Canvas layers of the reference: wake sparks left along the path, and the embers that rise from the floor after the impact (stage units → world by s) */
  function overlay(g, t, C, T, s, k) {
    const elapsed = t - HIT, dx = T.x - C.x, dy = T.y - C.y, D = Math.hypot(dx, dy) / s; if (D < 1) return;
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    g.translate(C.x, C.y); g.rotate(Math.atan2(dy, dx)); g.scale(s, s);
    g.beginPath(); g.rect(0, -300, D, 600); g.clip();
    const n = Math.round(91 * k), glowFill = (x, y, r, a) => { g.globalAlpha = clamp(a); g.fillStyle = '#ffd398'; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill() };
    for (let i = 1; i <= n; i++) {
      const distance = (i - .5 + hash(i) * .5) / (n + 1), born = .9 + (HIT - .9) * distance, age = t - born, life = .22 + hash(i + 2) * .46;
      if (age < 0 || age >= life) continue;
      const x = D * distance + (hash(i + 7) - .44) * age * 20, y = (hash(i + 3) - .5) * 12 + age * (hash(i + 11) - .6) * 47 + 14 * age * age, fade = (1 - age / life) ** 1.3;
      g.globalAlpha = clamp(fade * .88); g.strokeStyle = '#ffae58'; g.lineWidth = .85 + hash(i) * .85; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 1.8 - hash(i + 5) * 4.7, y + .6); g.stroke();
      if (i % 5 === 0) glowFill(x, y, 3.2, fade * .61);
    }
    g.restore();
    if (elapsed > .02 && elapsed < 2.5) {
      g.save(); g.globalCompositeOperation = 'lighter'; g.translate(T.x, T.y + 141 * s); g.scale(s, s);
      for (let i = 0; i < Math.round(24 * k); i++) {
        const born = .25 + hash(i + 5) * 1.7, age = elapsed - born, life = .3 + hash(i + 11) * .4; if (age < 0 || age > life) continue;
        const x = (hash(i) - .5) * 85 + Math.sin(i) * age * 8, y = -11 - age * (27 + hash(i + 23) * 30), fade = 1 - age / life;
        g.globalAlpha = clamp(fade * .48); g.fillStyle = '#ff9e41'; g.beginPath(); g.arc(x, y, 1.6, 0, 6.2832); g.fill();
      }
      g.restore();
    }
  }
  function draw(g, e, t01, p, a, cw) {
    if (!a || Math.hypot(p.x - a.x, p.y - a.y) < cw * 1.6) return false;   /* no shooter / point blank: the caller uses the painted look */
    const low = root.BattlePolish?.quality === 'low', s = cw / 217, t = clamp(t01) * LIFE / 1000;
    const C = { x: a.x, y: a.y - cw * .65 }, T = { x: p.x, y: p.y - cw * .65 };
    if (!FB.draw(g, { t, s, caster: C, target: T, pad: { l: 560, r: 560, t: 380, b: 340 }, res: low ? .8 : 1.5, u: { u_hit: HIT, u_blastScale: SIZE * (e.scale || 1) } })) return false;
    overlay(g, t, C, T, s, low ? .5 : 1); return true;
  }
  root.VfxGL = { make, ready: () => init() };
  root.FireballGL = { draw, ready: () => FB.ready(), TIMING: { life: LIFE, hit: Math.round(HIT * 1000) } };
})(globalThis);
