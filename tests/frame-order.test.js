import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
test('adaptive buffer resizing happens before drawing and not after it',()=>{
 const frame=source.slice(source.indexOf('function frame(now)'));
 const resize=frame.indexOf('if(resizePending)');
 const draw=frame.indexOf('effects.render(dt');
 assert.ok(resize>=0&&draw>resize);
 assert.ok(frame.indexOf('const target=nextResolution')<resize);
 assert.ok(!frame.slice(draw).includes('size();'));
});
test('UI and window resize callbacks enqueue buffer changes rather than resizing the canvas immediately',()=>{
 assert.ok(source.includes("addEventListener('resize',queueSize)"));
 assert.ok(source.includes('low=!low;queueSize();'));
 assert.ok(source.includes('adaptFrames=adaptElapsed=0;queueSize();updateButtons();'));
});
