import test from 'node:test';import assert from 'node:assert/strict';import {framing,pixelRatio} from '../src/framing.js';
test('portrait uses a wider vertical angle and gentler pointer movement',()=>{assert.ok(framing(390,844).fov>75);assert.equal(framing(1600,900).fov,57);assert.ok(framing(390,844).lookStrength<1);});
test('small screens are allowed higher pixel density without forcing low quality',()=>{assert.ok(pixelRatio(390,844,3,false,1)>1);assert.ok(pixelRatio(390,844,3,true,1)<=.8);});
test('adaptive scaling and pixel budget remain effective',()=>{const a=pixelRatio(1920,1080,2,false,1);assert.ok(a*a*1920*1080<=1900000+1);assert.ok(pixelRatio(390,844,3,false,.76)<pixelRatio(390,844,3,false,1));});
