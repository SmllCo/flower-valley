import test from 'node:test';
import assert from 'node:assert/strict';
import {queueTravel,advanceTravel,MAX_SPEED,MAX_QUEUE,TRAIL_LENGTH,SPEED_UNITS} from '../src/travel.js';
test('extreme wheel input cannot launch the camera',()=>{let p=0,t=0;for(let i=0;i<600;i++){t=queueTravel(p,t,1);assert(t-p<=MAX_QUEUE+1e-12);let q=advanceTravel(p,t,1/60);assert(q-p<=MAX_SPEED/60+1e-12);p=q;}assert(Math.abs(p*TRAIL_LENGTH-SPEED_UNITS*10)<.001);});
test('release settles and reverse input moves backwards',()=>{let p=.5,t=queueTravel(p,p,.02);for(let i=0;i<600;i++)p=advanceTravel(p,t,1/60);assert(Math.abs(t-p)<.00001);t=queueTravel(p,t,-1);assert(advanceTravel(p,t,1/60)<p);});
test('endpoints stay in the trail',()=>{assert.equal(queueTravel(0,0,-1),0);assert.equal(queueTravel(1,1,1),1);});
test('continuous scrolling reaches the meadow in under 30 seconds',()=>{let p=0,t=0;for(let i=0;i<30*60;i++){t=queueTravel(p,t,.02);p=advanceTravel(p,t,1/60);}assert(p>.99);});
