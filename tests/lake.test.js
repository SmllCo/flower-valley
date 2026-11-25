import test from 'node:test';import assert from 'node:assert/strict';
import {LAKE,lakeRadius,lakeTerrain,dryPosition,lakeReveal,shoreShape} from '../src/lake-layout.js';
test('lake basin is submerged, rim above water, and distant terrain unchanged',()=>{
 assert.ok(lakeTerrain(LAKE.x,LAKE.z,0)<LAKE.y);for(let i=0;i<40;i++){const a=i*Math.PI/20,r=shoreShape(a);const x=LAKE.x+Math.cos(a)*LAKE.rx*r,z=LAKE.z+Math.sin(a)*LAKE.rz*r;assert.ok(lakeTerrain(x,z,0)>LAKE.y);}
 assert.equal(lakeTerrain(0,0,.42),.42);
});
test('plant relocation stays outside the lake and leaves dry points alone',()=>{
 for(let x=-35;x<=35;x+=2)for(let z=-145;z<=-65;z+=2){const p=dryPosition(x,z);assert.ok(lakeRadius(...p)>=1.09-1e-9);if(lakeRadius(x,z)>=1.09)assert.deepEqual(p,[x,z]);}
});
test('final reveal is continuous and limited to the final segment',()=>{assert.equal(lakeReveal(.70),0);assert.equal(lakeReveal(1),1);let prior=0;for(let p=0;p<=1;p+=.001){const v=lakeReveal(p);assert.ok(v>=prior&&v<=1);prior=v;}});

test('new shoreline has an irregular but bounded shape',()=>{for(let i=0;i<360;i++)assert.ok(shoreShape(i*Math.PI/180)>.84&&shoreShape(i*Math.PI/180)<1.16);});
