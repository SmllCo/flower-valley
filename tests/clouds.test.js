import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL('../src/'+name,import.meta.url),'utf8');
const clouds=read('atmosphere.js').split('export function makeMistBanks')[0];
test('cloud shader uses faster lateral time-based motion and limits opacity',()=>{
 assert.match(clouds,/vec2 drift=vec2\(-time\*\.012,time\*\.0018\)/);
 assert.match(clouds,/clamp\(density\*\.46\*breakup\+wisps,0\.,\.48\)/);
 assert.equal((clouds.match(/texture2D\(/g)||[]).length,1);
});
test('atmospheric animation remains independent of travel and honors reduced motion',()=>{
 assert.match(read('main.js'),/air\.time\.value=reduced\?0:time/);
 assert.match(clouds,/time:air\.time/);
 assert.match(clouds,/horizon\*cloudAmount/);
});
