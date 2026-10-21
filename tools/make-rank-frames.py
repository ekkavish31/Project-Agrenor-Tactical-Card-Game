"""v13: build the rank / character card frames from the gold master frame.
usage: python3 tools/make-rank-frames.py   (reads assets/cards/src/frame-gold-master.png)
Opens the big parchment panel as the art window (transparent) and recolours the gold:
boss = shiny gold · miniboss = shiny silver · elite = light blue · normal = light green · unit (characters) = red-gold"""
from PIL import Image, ImageFilter
import numpy as np
from collections import deque
im=np.array(Image.open('assets/cards/src/frame-gold-master.png').convert('RGBA')).astype(np.float32)
H,W=im.shape[:2];rgb=im[...,:3]/255;v0=rgb.max(2);s0=np.where(v0>0,(v0-rgb.min(2))/np.maximum(v0,1e-6),0)
pale=(v0>0.78)&(s0<0.16)&(im[...,3]>200);mask=np.zeros((H,W),bool);sy,sx=int(H*.46),W//2;q=deque([(sy,sx)]);mask[sy,sx]=True
while q:
  y,x=q.popleft()
  for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
    yy,xx=y+dy,x+dx
    if 0<=yy<H and 0<=xx<W and not mask[yy,xx] and pale[yy,xx]:mask[yy,xx]=True;q.append((yy,xx))
ma=np.array(Image.fromarray((mask*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32)/255
lum=0.3*rgb[...,0]+0.59*rgb[...,1]+0.11*rgb[...,2]
def from_hsv(hh,ss,vv):
  i=np.floor(hh*6)%6;f=hh*6-np.floor(hh*6);p=vv*(1-ss);qq=vv*(1-f*ss);t=vv*(1-(1-f)*ss);out=np.zeros(vv.shape+(3,))
  for k,(a,b,c) in enumerate([(vv,t,p),(qq,vv,p),(p,vv,t),(p,qq,vv),(t,p,vv),(vv,p,qq)]):
    sel=i==k;out[sel,0]=a[sel];out[sel,1]=b[sel];out[sel,2]=c[sel]
  return out
def variant(name,new):
  out=im.copy();w=np.clip((s0-0.15)/0.2,0,1)[...,None];out[...,:3]=np.clip(rgb*(1-w)+new*w,0,1)*255;out[...,3]=im[...,3]*(1-ma)
  Image.fromarray(out.astype(np.uint8)).save(f'assets/cards/frame-{name}.webp',quality=90);print('frame-'+name)
shine=lambda v,k=1.45,m=.56:np.clip((v-.5)*k+m,0,1)   # stronger contrast = polished metal look
L=shine(lum*1.12,1.6,.6)
variant('rank-boss',from_hsv(np.full(lum.shape,.118),np.clip(s0*1.1,0,1),shine(v0,1.35,.6)))            # shiny gold
variant('rank-miniboss',np.stack([L*.96,L*.98,np.clip(L*1.05,0,1)],-1))                                  # shiny silver
variant('rank-elite',from_hsv(np.full(lum.shape,.55),np.full(lum.shape,.42),np.clip(v0*1.08,0,1)))      # light blue
variant('rank-normal',from_hsv(np.full(lum.shape,.29),np.full(lum.shape,.38),np.clip(v0*1.05,0,1)))     # light green
variant('unit',from_hsv(np.where(v0<.8,.985,.11),np.clip(s0*np.where(v0<.8,1.15,.9),0,1),np.clip(v0*np.where(v0<.8,.82,1),0,1)))  # red-gold
