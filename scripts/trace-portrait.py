"""Measure source pixels and emit vector clipping contours; source PNGs stay unchanged."""
import json
from pathlib import Path
import numpy as np
from PIL import Image

root=Path(__file__).resolve().parents[1]
specs=json.loads((root/'scripts/portrait-measurements.json').read_text(encoding='utf-8-sig'))
result={}
for key,s in specs.items():
    rgb=np.asarray(Image.open(root/f'dist/assets/references/{key}.png').convert('RGB')).astype(np.int16)
    r,g,b=rgb[:,:,0],rgb[:,:,1],rgb[:,:,2]
    foreground=((r<133)&(g<145)&(b<151))|((r>g*1.10)&(g>b*1.045)&(r>80)&(b>45)&(r-g<110)&(g-b<100))
    x,y,w,h=s['person']; x0=max(0,x-25);x1=min(1672,x+w+25);y0=max(0,y-10);y1=min(941,y+h)
    foreground[:y0]=False;foreground[y1:]=False;foreground[:,:x0]=False;foreground[:,x1:]=False
    # Connected scanline runs distinguish the person from individual letters and icons.
    parent=[];runs=[];previous=[]
    def find(a):
        while parent[a]!=a:
            parent[a]=parent[parent[a]];a=parent[a]
        return a
    for yy in range(y0,y1):
        edges=np.diff(np.r_[False,foreground[yy],False].astype(np.int8))
        spans=list(zip(np.flatnonzero(edges==1),np.flatnonzero(edges==-1)))
        current=[]
        for a,z in spans:
            if z-a<2:continue
            n=len(parent);parent.append(n);runs.append((yy,int(a),int(z),n));current.append((a,z,n))
            for pa,pz,pn in previous:
                if pz<a-1:continue
                if pa>z+1:break
                root1,root2=find(n),find(pn)
                if root1!=root2:parent[root1]=root2
        previous=current
    stats={}
    for yy,a,z,n in runs:
        k=find(n)
        if k not in stats:stats[k]=[0,0,0,yy,yy]
        v=stats[k];v[0]+=z-a;v[1]+=(a+z)/2*(z-a);v[2]+=yy*(z-a);v[4]=yy
    fx,fy,fw,fh=s['face'];cx=fx+fw/2
    chosen=[]
    for k,(area,sx,sy,lo,hi) in stats.items():
        if area<2000:continue
        mx,my=sx/area,sy/area
        if abs(mx-cx)<w*.33 and (my>fy or (lo<fy+fh and hi>fy)):
            chosen.append(k)
    ys={}
    for yy,a,z,n in runs:
        if find(n) in chosen:
            if yy not in ys:ys[yy]=[a,z]
            else:ys[yy]=[min(a,ys[yy][0]),max(z,ys[yy][1])]
    if not ys:raise RuntimeError(key)
    points=sorted(ys)
    # Interpolate tiny uncolored gaps (white shirt); a 1 px inset excludes the source backdrop.
    yy=np.arange(points[0],points[-1]+1,2)
    left=np.interp(yy,points,[ys[i][0] for i in points])+1
    right=np.interp(yy,points,[ys[i][1] for i in points])-1
    if key!='19-pixel':
        left=np.convolve(np.pad(left,(2,2),mode='edge'),np.ones(5)/5,mode='valid')
        right=np.convolve(np.pad(right,(2,2),mode='edge'),np.ones(5)/5,mode='valid')
    polygon=list(zip(left,yy))+list(zip(right[::-1],yy[::-1]))
    path='M'+' '.join(f'{a:.1f},{z}' for a,z in polygon)+'Z'
    result[key]=path
    print(key, 'components',len(chosen),'outline',len(polygon),'bounds',points[0],points[-1])
(root/'scripts/portrait-paths.json').write_text(json.dumps(result,separators=(',',':')),encoding='utf-8')
