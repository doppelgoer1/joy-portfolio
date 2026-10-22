"""Measure full-frame palette coverage; retain inherited T1 pixels in the result."""
import json, sys
from pathlib import Path
import numpy as np
from PIL import Image
root=Path(sys.argv[1] if len(sys.argv)>1 else '/Users/joy/code/joy-motion-v3-evidence')
records=json.loads((root/'stills-metrics.json').read_text())
summary=[]
for record in records:
 samples=[]
 for row in record['samples']:
  pixels=np.asarray(Image.open(root/'stills'/row['file']).convert('RGB'),dtype=np.int16)
  red=np.all(np.abs(pixels-np.array([122,12,7]))<=6,axis=2)
  # A 32px square of nearly uniform red identifies a solid-plane interior,
  # rather than a 2px rule or a glyph. This is a diagnostic, not an exemption.
  integral=np.pad(red.astype(np.int32),((1,0),(1,0))).cumsum(0).cumsum(1)
  block=32
  sums=integral[block:,block:]-integral[:-block,block:]-integral[block:,:-block]+integral[:-block,:-block]
  solid=int(np.count_nonzero(sums==block*block))
  palette={name:int(np.count_nonzero(np.all(np.abs(pixels-np.array(color))<=6,axis=2))) for name,color in [('ink',[5,5,5]),('paper',[242,242,242])]}
  samples.append({'file':row['file'],'progress':row['progress'],'redPixels':int(red.sum()),'redPercent':float(red.mean()*100),'solidRedInteriorWindows':solid,**palette})
 peak=max(samples,key=lambda x:x['redPercent'])
 increases=[{'from':a['progress'],'to':b['progress'],'increase':b['solidRedInteriorWindows']-a['solidRedInteriorWindows']} for a,b in zip(samples,samples[1:]) if b['solidRedInteriorWindows']>a['solidRedInteriorWindows']]
 summary.append({'width':record['viewport']['width'],'project':record['selected'],'scene':record['scene']['name'],'frames':len(samples),'maxRedPercent':peak['redPercent'],'peakFrame':peak['file'],'redLimitPass':peak['redPercent']<=1.5,'solidRedGrowthEvents':increases,'samples':samples})
report={'method':'Full viewport, #7a0c07 ±6 per RGB channel. No masks/exclusions; inherited T1 cards included. Solid-plane diagnostic counts uniform 32×32 red interiors. Ink/paper counts retained separately.','thresholdPercent':1.5,'scenes':summary,'pass':all(s['redLimitPass'] and not s['solidRedGrowthEvents'] for s in summary)}
(root/'pixel-measurements.json').write_text(json.dumps(report,indent=2))
for s in summary: print(json.dumps({k:v for k,v in s.items() if k!='samples'}))
print('PASS='+str(report['pass']))
sys.exit(0 if report['pass'] else 1)
