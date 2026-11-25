import test from 'node:test';import assert from 'node:assert/strict';import {detailFor} from '../src/lod.js';
test('near and distant flowers select different detail levels',()=>{assert.equal(detailFor(5),0);assert.equal(detailFor(35),1);});
test('hysteresis preserves LOD around boundary',()=>{assert.equal(detailFor(14,0),0);assert.equal(detailFor(13,1),1);assert.equal(detailFor(16,0),1);assert.equal(detailFor(11,1),0);});
