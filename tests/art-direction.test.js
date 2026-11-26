import test from 'node:test';import assert from 'node:assert/strict';
import {openingFlower,artFrame,groundDetail} from '../src/art-direction.js';
test('opening accents are a small deterministic part of each flower preset, outside the path',()=>{
 for(const [count,expected] of [[500,25],[2000,100],[5000,100]]){
  const flowers=Array.from({length:count},(_,i)=>openingFlower(i)).filter(Boolean);assert.equal(flowers.length,expected);
  for(const f of flowers){assert.ok(f.z>=-.4&&f.z<=15.4);assert.ok(Math.abs(f.offset)>=1.18);assert.ok(f.scale>=.98&&f.scale<=1.28);}
 }
 assert.deepEqual(openingFlower(40),openingFlower(40));
});
test('opening camera accents smoothly disappear before the first station',()=>{
 for(const portrait of [0,1]){assert.ok(artFrame(0,portrait).cameraDrop>0);assert.equal(artFrame(.19,portrait).cameraDrop,0);assert.equal(artFrame(1,portrait).lookDrop,0);}
 for(let p=0;p<=1;p+=.001){const a=artFrame(p,1);assert.ok(a.ambient>0&&a.moonlight>0&&a.halo<.25);}
});
test('ground verge is bounded and does not affect the path centre or distant terrain',()=>{
 assert.deepEqual(groundDetail(1,1,0),{verge:0,shade:1});assert.deepEqual(groundDetail(1,1,5),{verge:0,shade:1});
 assert.ok(groundDetail(1,1,2).shade<1);
});
