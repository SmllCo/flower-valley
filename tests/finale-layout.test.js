import test from 'node:test';import assert from 'node:assert/strict';
import {finaleForest,finaleFlower,finaleBank} from '../src/finale-layout.js';
import {lakeRadius} from '../src/lake-layout.js';
test('forest is deterministic, on dry land and away from the arrival path',()=>{const trees=finaleForest();assert.deepEqual(trees,finaleForest());assert.ok(trees.length>100);for(const t of trees){assert.ok(lakeRadius(t.x,t.z)>=1.13-1e-9);assert.ok(t.z<=-85&&t.z>=-167);assert.ok(t.h>2&&t.h<14);}});
test('finale flowers use existing budget and remain out of the basin',()=>{let n=0;for(let i=0;i<2000;i++){const p=finaleFlower(i);if(p){n++;assert.ok(lakeRadius(p.x,p.z)>=1.09-1e-9);assert.ok(p.z< -65);}}assert.ok(n>100&&n<=200);});
test('bank relief stays outside the lake and does not change the early route',()=>{assert.equal(finaleBank(0,-108),0);assert.equal(finaleBank(0,0),0);assert.ok(finaleBank(35,-110)>0);});
