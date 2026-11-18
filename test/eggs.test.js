import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createEgg,eggFrame,renderEggSVG} from '../public/pet/eggs.js';
import {createState,act,snackFriends} from '../public/core/game.js';

test('Moss hits three bounded edges and finishes asleep while Pip gets the snack',()=>{
 for(const [width,height] of [[340,290],[1920,1080],[290,800]])for(const x of [0,width/2,width]){
  for(const random of [()=>0,()=>.41,()=>.99]){
   const scene=createEgg('fizz',{width,height,x,y:height},false,random);
   assert.equal(scene.hits.length,3);
   assert.equal(scene.cues.filter(cue=>cue.sound==='bump').length,3);
   for(const hit of scene.hits){
    assert.ok(hit.x>=0&&hit.x<=width&&hit.y>=0&&hit.y<=height);
    assert.ok(hit.distance>0);
   }
   for(let t=0;t<=7;t+=.05){
    const {first,second}=eggFrame(scene,t);
    for(const {x,y} of [first,second])assert.ok(x>=0&&x<=width&&y>=0&&y<=height);
   }
   assert.equal(eggFrame(scene,5).first.expression,'sleepy');
   assert.equal(eggFrame(scene,6).second.expression,'happy');
   assert.equal(eggFrame(scene,6).snack,false);
   assert.doesNotMatch(renderEggSVG(scene,2.6),/NaN|Infinity/);
  }
 }
});

test('reduced motion stays local and the other scenes land their character beats',()=>{
 const layout={width:340,height:290};
 const fizz=createEgg('fizz',layout,true);
 assert.equal(fizz.hits.length,0);
 assert.equal(eggFrame(fizz,1.65).effect.kind,'pop');
 assert.equal(eggFrame(fizz,1.65).first.x,eggFrame(fizz,5).first.x);
 const kettle=createEgg('kettle',layout);
 assert.equal(eggFrame(kettle,3).first.hot,true);
 assert.ok(eggFrame(kettle,4.1).first.hat>0);
 assert.equal(eggFrame(kettle,5).first.hat,-28);
 const cloud=createEgg('cloud',layout);
 assert.equal(eggFrame(cloud,1).effect.x,cloud.start.x);
 assert.equal(eggFrame(cloud,4.5).effect.x,cloud.other.x);
 assert.equal(eggFrame(cloud,4.5).second.expression,'happy');
});

test('the fizzy guest must be available and ordinary snack pairing still works',()=>{
 const now=10000;
 const state=act(createState(now),{type:'select',id:'moss'},now);
 assert.deepEqual(snackFriends(state,now).map(c=>c.id),['moss','miso']);
 const snack={type:'share-snack',x:50,y:60,guest:'pip'};
 const next=act(state,snack,now);
 assert.deepEqual(next.creatures.filter(c=>c.activity==='share-snack').map(c=>c.id),['moss','pip']);
 state.creatures[2].lastCareAt=now;
 assert.equal(act(state,snack,now).care,state.care);
});
