import {test} from 'node:test';
import assert from 'node:assert/strict';
import {drawFortune,fortuneFrame} from '../public/pet/fortune.js';
import {cartoonCreatureSVG} from '../public/cartoon.js';

test('each stick occupies one fifth of the draw and remains readable before the reaction',()=>{
  const expected=['大吉','中吉','小吉','小凶','大凶'];
  for (let i=0;i<5;i++){
    for(const value of [i/5,(i+.999)/5]){
      const scene=drawFortune({id:'moss'},false,()=>value);
      assert.equal(scene.label,expected[i]);
      assert.equal(scene.lucky,i<3);
      assert.deepEqual(fortuneFrame(scene,1.6),fortuneFrame(scene,2.85));
    }
  }
});

test('a lucky stick passes behind and in front, and reduced motion keeps it still',()=>{
  const scene=drawFortune({},false,()=>0);
  const poses=Array.from({length:100},(_,i)=>fortuneFrame(scene,3.65+i*.043));
  assert.ok(poses.some(p=>p.behind && p.x<143));
  assert.ok(poses.some(p=>!p.behind && p.x<143));
  const still={...scene,reduced:true};
  assert.equal(fortuneFrame(still,4.1).x,fortuneFrame(still,6.5).x);
  assert.equal(fortuneFrame(still,5).glimmer,1);
});

test('an unlucky stick reaches the original mouth and shortens in two bites',()=>{
  const scene=drawFortune({},false,()=>.96);
  const pose=fortuneFrame(scene,4.45);
  assert.ok(Math.abs(pose.x-(10+.83*160))<1e-8);
  assert.ok(Math.abs(pose.y-(-4+.83*155))<1e-8);
  assert.equal(pose.face,'nibble');
  assert.deepEqual([4.45,4.97,5.55].map(t=>fortuneFrame(scene,t).eaten),[0,26,56]);
  assert.equal(fortuneFrame(scene,5.7).face,'happy');
  const art=cartoonCreatureSVG({costume:'fortune',expression:'nibble'},'#ccc');
  assert.equal((art.match(/data-bite-mouth/g)||[]).length,1);
  assert.doesNotMatch(art,/M155 154Q160 159/);
});
