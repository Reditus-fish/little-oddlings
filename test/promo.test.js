import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DURATION,sceneAt,renderScene} from '../public/promo/scene.js';

test('the interaction has cause, reaction, repair, and a shared resolution',()=>{
 const start=sceneAt(1);assert.equal(start.characters[0].face,'sleep');
 const catchGame=sceneAt(6.7);assert.ok(catchGame.characters[2].jump>0);assert.ok(catchGame.ball.visible);
 const wake=sceneAt(8.3);assert.equal(wake.characters[0].face,'surprise');assert.equal(wake.characters[1].face,'sorry');
 const boundary=sceneAt(10);assert.equal(boundary.characters[0].face,'grumpy');assert.ok(Math.abs(boundary.characters[2].jump)<1e-9);
 const repair=sceneAt(15);assert.ok(repair.blanket>0);assert.ok(repair.cookie>0);
 const resolution=sceneAt(20);assert.ok(resolution.characters.every(c=>c.face==='sleep'));assert.equal(resolution.blanket,1);
});
test('every exported frame is deterministic, finite, and validly bounded',()=>{
 for(let i=0;i<=DURATION*24;i++){
  const t=i/24,s=sceneAt(t);
  assert.deepEqual(s,sceneAt(t));
  for(const c of s.characters){for(const key of ['x','y','jump','rot','sx','sy'])assert.ok(Number.isFinite(c[key]));assert.ok(c.x>150&&c.x<950);assert.ok(c.jump>=0);}
  const svg=renderScene(t);assert.ok(!svg.includes('NaN'));assert.ok(!svg.includes('undefined'));assert.ok(!svg.includes('<text'));assert.ok(!svg.includes('M-94 -34Q-122'));
 }
 assert.equal(sceneAt(-5).t,0);assert.equal(sceneAt(Infinity).t,0);assert.equal(sceneAt(1000).t,DURATION);
});
