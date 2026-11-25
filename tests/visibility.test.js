import test from 'node:test';import assert from 'node:assert/strict';import {potentiallyVisible,nextResolution} from '../src/visibility.js';
const p=(x,y,z,constant)=>({normal:{x,y,z},constant});
const planes=[p(1,0,0,0),p(-1,0,0,10),p(0,0,1,0),p(0,0,-1,20)];
test('visible plants and plants just outside a boundary remain drawn',()=>{assert.equal(potentiallyVisible(planes,5,1,8,5,1,8),true);assert.equal(potentiallyVisible(planes,-1,1,8,5,1,8),true);});
test('clearly offscreen plants can be omitted',()=>{assert.equal(potentiallyVisible(planes,-35,1,8,5,1,8),false);assert.equal(potentiallyVisible(planes,5,1,-30,5,1,8),false);});
test('adaptive resolution has a dead band and hard bounds',()=>{assert.equal(nextResolution(1,25),.92);assert.equal(nextResolution(.92,32),.92);assert.equal(nextResolution(.76,10),.76);assert.equal(nextResolution(.92,55),1);assert.equal(nextResolution(1,60),1);});
