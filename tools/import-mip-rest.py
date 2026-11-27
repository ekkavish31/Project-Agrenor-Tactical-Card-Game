from PIL import Image
from pathlib import Path
import json,sys
ROOT=Path(__file__).resolve().parents[1]
SIT=Path(sys.argv[1]) if len(sys.argv)>1 else ROOT/'assets/ui/mip-sit-source.webp'
REST=Path(sys.argv[2]) if len(sys.argv)>2 else ROOT/'assets/ui/mip-rest-source.webp'
def cells(path,rows):
 im=Image.open(path).convert('RGBA');return [im.crop((round(c*im.width/4),round(r*im.height/rows),round((c+1)*im.width/4),round((r+1)*im.height/rows))) for r in range(rows) for c in range(4)]
def bounds(im):return im.getchannel('A').point(lambda a:255 if a>40 else 0).getbbox()
def neck(im):
 p=im.load();seen=set();comps=[];w,h=im.size
 def blue(x,y):
  r,g,b,a=p[x,y];return a>80 and b>r*1.2 and b>g*.95 and b-r>35
 for y in range(h):
  for x in range(w):
   if (x,y) in seen or not blue(x,y):continue
   q=[(x,y)];seen.add((x,y))
   for xx,yy in q:
    for a,b in [(xx-1,yy),(xx+1,yy),(xx,yy-1),(xx,yy+1)]:
     if 0<=a<w and 0<=b<h and (a,b) not in seen and blue(a,b):seen.add((a,b));q.append((a,b))
   if len(q)>20:
    cx=sum(a for a,b in q)/len(q);cy=sum(b for a,b in q)/len(q)
    if cx<w*.65 and cy>h*.52:comps.append((abs(cy-h*.68),cx,cy))
 if not comps:raise ValueError('missing neck datum')
 _,x,y=min(comps);return x,y
sit=cells(SIT,2);rest=cells(REST,3);scale=.53
nx,ny=neck(sit[-1]);head=(ny-bounds(sit[-1])[1])*scale
rx,ry=neck(rest[0]);restscale=head/(ry-bounds(rest[0])[1])
report={}
for name,frames,k in [('mip-sit',sit,scale),('mip-rest',rest,restscale)]:
 atlas=Image.new('RGBA',(256*len(frames),256));data=[]
 for i,im in enumerate(frames):
  b=bounds(im);x,y=neck(im);anchor=54+(128-54)*min(1,i/3) if name=='mip-sit' else 128
  # One anatomical scale per sheet, pinned paws and neck datum; never fit each pose independently.
  tile=im.resize((round(im.width*k),round(im.height*k)),Image.Resampling.LANCZOS)
  dx=round(anchor-x*k);dy=round(245-b[3]*k);cell=Image.new('RGBA',(256,256));cell.alpha_composite(tile,(dx,dy));atlas.alpha_composite(cell,(i*256,0));data.append({'neck':[round(anchor,2),round(y*k+dy,2)],'base':245,'scale':k})
 atlas.save(ROOT/'assets/ui'/f'{name}-sheet.webp',quality=95,method=6);report[name]=data
Image.open(SIT).save(ROOT/'assets/ui/mip-sit-source.webp',lossless=True)
Image.open(REST).save(ROOT/'assets/ui/mip-rest-source.webp',lossless=True)
(ROOT/'assets/ui/mip-rest-datums.json').write_text(json.dumps(report,indent=2)+'\n');print('Mip art imported',scale,restscale,head)
