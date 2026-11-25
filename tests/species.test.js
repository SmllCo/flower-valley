import test from 'node:test';
import assert from 'node:assert/strict';
import {chooseSpecies,prefixCounts} from '../src/species.js';
test('species are deterministic, bounded, and all five are represented',()=>{const set=new Set();for(let x=-30;x<30;x++)for(let z=-100;z<30;z++){const a=chooseSpecies(x,z,.5);assert.equal(a,chooseSpecies(x,z,.5));assert.ok(a>=0&&a<5);set.add(a);}assert.equal(set.size,5);});
test('per-species prefix counts preserve instance slot mapping when density changes',()=>{const items=[2,1,2,0,4,3,1].map(species=>({species}));assert.deepEqual(prefixCounts(items,3),[0,1,2,0,0]);assert.deepEqual(prefixCounts(items,7),[1,2,2,1,1]);assert.deepEqual(prefixCounts(items,0),[0,0,0,0,0]);});
