import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createState,act,advance,validState} from '../public/core/game.js';
import {copycatPose} from '../public/copycat.js';
test('cushion chooses the nearest available watcher and expires without moving furniture',()=>{
  const original=createState(1000);
  original.creatures[1].x=22;original.creatures[1].y=64;
  const state=act(original,{type:'copycat'},1000);
  assert.equal(state.creatures[0].activity,'copycat-leader');
  assert.equal(state.creatures[1].activity,'copycat-watcher');
  assert.equal(original.creatures[0].activity,null);
  assert.ok(validState(state));
  const again=act(state,{type:'copycat'},2000);
  assert.equal(again.creatures[0].activityUntil,11000);
  assert.ok(advance(state,12000).creatures.every(friend=>friend.activity===null));
  assert.deepEqual(state.habitat.objects,original.habitat.objects);
});
test('copycats respect quiet mode and unavailable friends',()=>{
  const state=createState(1000);state.habitat.mode='quiet';
  assert.equal(act(state,{type:'copycat'},1000).creatures[0].activity,null);
  state.habitat.mode='lively';state.creatures.slice(1).forEach(friend=>{friend.activity='cushion';friend.activityUntil=9000;});
  assert.equal(act(state,{type:'copycat'},1000).creatures[0].activity,'cushion');
  assert.equal(copycatPose('moss',5,true).jump,0);
  assert.notEqual(copycatPose('moss',6).cushionX,copycatPose('pip',6).cushionX);
});
