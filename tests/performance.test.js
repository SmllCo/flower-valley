import test from 'node:test';import assert from 'node:assert/strict';
import {bloomDimensions,mistBankPositions,BLOOM_SCALE} from '../src/performance.js';
test('bloom buffers scale to 36 percent of scene resolution with positive integer dimensions',()=>{assert.equal(BLOOM_SCALE,.36);assert.deepEqual(bloomDimensions(1920,1080),{width:691,height:389});assert.deepEqual(bloomDimensions(1,1),{width:1,height:1});});
test('five mist banks cover the same endpoints as the eight original banks',()=>{const z=mistBankPositions(88);assert.equal(z.length,5);assert.equal(z[0],8);assert.equal(z.at(-1),-69);assert.ok(z.every((v,i)=>i===0||v<z[i-1]));});
