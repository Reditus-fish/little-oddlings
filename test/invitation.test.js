import {test} from 'node:test';
import assert from 'node:assert/strict';
import {toyPose} from '../public/pet/invitation.js';
test('an ignored toy waits, returns and finishes',()=>{
 assert.equal(toyPose(500).phase,'offering');
 assert.equal(toyPose(4000).phase,'waiting');
 assert.equal(toyPose(10000).phase,'retrieving');
 assert.equal(toyPose(11200).done,true);
 assert.equal(toyPose(11200).position,0);
});
test('a nudge starts a bounded round and reduced motion avoids rolling',()=>{
 assert.equal(toyPose(5000,4000).phase,'playing');
 assert.equal(toyPose(7000,4000).done,true);
 assert.equal(toyPose(4000,3500,true).position,toyPose(5000,3500,true).position);
 for(let time=0;time<14000;time+=30){const pose=toyPose(time);assert.ok(pose.position>=0&&pose.position<=.65);}
});
