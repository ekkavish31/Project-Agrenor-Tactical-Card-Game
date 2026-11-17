'use strict';
const assert=require('node:assert/strict'),{createCanvas}=require('@napi-rs/canvas'),PA=require('../js/proportion-adjust.js');global.document={createElement:()=>createCanvas(1,1)};
const W=100,H=120,src=createCanvas(W,H),g=src.getContext('2d');g.fillStyle='#eb4020';g.fillRect(10,5,80,110);const m={w:W,h:H,H:110,top:5,bottom:114,x0:10,x1:89},marks={chin:.28,hip:.65};
const identity=PA.warp(src,m,marks,{head:1,torso:1,legs:1},{sharpen:0});assert.deepEqual(Buffer.from(identity.canvas.getContext('2d').getImageData(0,0,W,H).data),Buffer.from(g.getImageData(0,0,W,H).data));
const out=PA.warp(src,m,marks,{head:1.9,torso:.65,legs:1.2},{keepHeight:false,mode:'shape',grow:3,sharpen:0}),pixels=out.canvas.getContext('2d').getImageData(0,0,out.canvas.width,out.canvas.height).data;assert(out.canvas.width>W||out.canvas.height>H);
for(let y=10;y<H-10;y+=2){const p=PA.mapPoint(out,50,y);assert(pixels[(Math.round(p[1])*out.canvas.width+Math.round(p[0]))*4+3]>200,'no tear')}
for(let y=0;y<out.canvas.height;y++)for(let x=0;x<out.canvas.width;x++)if(pixels[(y*out.canvas.width+x)*4+3])assert(x>0&&y>0&&x<out.canvas.width-1&&y<out.canvas.height-1,'unclipped margin');
const edits=new Uint8Array(W*H);PA.paintZone(edits,W,H,15,10,30,20,8,4);assert.equal(edits[15*W+22],4);const changed=PA.warp(src,m,marks,{head:1.5,torso:.8,legs:1},{zoneEdits:edits,sharpen:0});assert.equal(changed.labels[15*W+22],4);assert(changed.weights[1][15*W+22]>.99);PA.paintZone(edits,W,H,22,15,22,15,10,0);assert.equal(edits[15*W+22],0);assert.equal(PA.zoneCanvas(changed,true).width,changed.canvas.width);
console.log('PASS zones: identity, connected mesh, expanded bounds, paint and erase');
