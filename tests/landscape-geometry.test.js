import test from 'node:test';
import assert from 'node:assert/strict';
import {pineData,mountainData,mountainHeight,MOUNTAIN_LAYERS} from '../src/landscape-geometry.js';
function checkMesh(mesh){assert.ok(mesh.position.length%3===0);assert.ok(mesh.position.every(Number.isFinite));assert.ok(mesh.index.length%3===0);assert.ok(mesh.index.every(i=>Number.isInteger(i)&&i>=0&&i<mesh.position.length/3));}
test('three distinct deterministic branching pines have valid bounded geometry',()=>{
 const models=[0,1,2].map(pineData);
 for(const [i,m] of models.entries()){checkMesh(m);assert.deepEqual(m,pineData(i));assert.equal(m.color.length,m.position.length);assert.ok(m.color.every(v=>v>=0&&v<=1));assert.ok(m.index.length/3<1350);const y=m.position.filter((_,i)=>i%3===1);assert.equal(Math.min(...y),0);assert.ok(Math.max(...y)>=1&&Math.max(...y)<1.08);}
 assert.notDeepEqual(models[0],models[1]);assert.notDeepEqual(models[0],models[2]);
});
test('mountains have genuine depth, varying heights and bounded lighting',()=>{
 for(const layer of MOUNTAIN_LAYERS){const m=mountainData(layer);checkMesh(m);assert.equal(m.shade.length,m.position.length/3);assert.ok(m.shade.every(v=>v>=0&&v<=1));assert.equal(m.index.length/3,208*18*2);assert.ok(mountainHeight(0,layer.center,layer)>mountainHeight(0,layer.center-layer.depth/2,layer)+8);assert.ok(new Set(m.position.filter((_,i)=>i%3===2)).size>10);assert.ok(Math.max(...m.shade)-Math.min(...m.shade)>.15);}
});
