import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../src/'+name,import.meta.url),'utf8');
test('sky scattering replaces periodic radial shafts and respects the haze uniform',()=>{
 const world=read('world.js');assert.ok(!world.includes('cos(fan*19.'));assert.match(world,/scatter\*rays/);assert.match(world,/rays:cinema\.rays/);
});
test('cloud haze reuses existing noise and shared runtime switch',()=>{
 const clouds=read('atmosphere.js').split('export function makeMistBanks')[0];assert.match(clouds,/lunarHaze:cinema\.rays/);assert.match(clouds,/thinCloud\*moon\*lunarHaze/);assert.equal((clouds.match(/texture2D\(/g)||[]).length,1);assert.match(read('main.js'),/id="rays" aria-pressed="true">Haze<\/button>/);
});
