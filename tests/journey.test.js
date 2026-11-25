import test from 'node:test';
import assert from 'node:assert/strict';
import {createJourney,STATIONS,HOLD,QUIET} from '../src/journey.js';
import {MAX_SPEED} from '../src/travel.js';
const dt=1/60;
function drive(j,t,dir=1,until=2400){for(let i=0;i<until;i++){t+=dt;const p=j.progress;j.input(dir,t);j.update(dt,t);assert(Math.abs(j.progress-p)<=MAX_SPEED*dt+1e-5);if(j.station>=0)return t;}throw Error('No station reached');}
test('continuous wheel cannot skip a verse even after reading time',()=>{const j=createJourney();let t=drive(j,0);assert.equal(j.station,0);assert.equal(j.progress,STATIONS[0].at);for(let i=0;i<600;i++){t+=dt;j.input(1,t);j.update(dt,t);}assert.equal(j.station,0);assert.equal(j.progress,.19);});
test('fresh scroll or explicit continue can advance only after the reading pause',()=>{const j=createJourney();let t=drive(j,0);j.input(1,t+.1,true);assert.equal(j.station,0);t+=HOLD+QUIET+.1;j.input(1,t);assert.equal(j.station,-1);t=drive(j,t);assert.equal(j.station,1);});
test('all four stops are reachable; final has no forward travel',()=>{const j=createJourney();let t=0;for(let k=0;k<4;k++){t=drive(j,t);assert.equal(j.station,k);t+=HOLD+QUIET+.1;if(k<3)j.input(1,t,true);}for(let i=0;i<60;i++){t+=dt;j.input(1,t,true);j.update(dt,t);}assert.equal(j.station,3);assert.equal(j.progress,1);});
test('reverse returns to previous verse, reset starts from zero',()=>{const j=createJourney();let t=drive(j,0);t+=HOLD+QUIET+.1;j.input(1,t,true);t=drive(j,t);t+=HOLD+QUIET+.1;j.input(-1,t,true);t=drive(j,t,-1);assert.equal(j.station,0);j.reset();assert.equal(j.station,-1);assert.equal(j.progress,0);});
test('Continue button travels to the next station without further input',()=>{const j=createJourney();let t=drive(j,0);t+=HOLD+.1;j.input(1,t,true);for(let i=0;i<1200&&j.station<0;i++){t+=dt;j.update(dt,t);}assert.equal(j.station,1);});
