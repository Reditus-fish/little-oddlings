import {snackFace} from '../public/pet/snack.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createChase, stepChase } from '../public/pet/chase.js';
import { createState, act, advance, validState, snackFriends } from '../src/game.js';

test('sustained fast chasing flops, peeks, then resumes with a cooldown', () => {
  let s = createChase();
  for (let now = 0; now <= 600; now += 50) s = stepChase(s, { now, speed: 1200 });
  assert.equal(s.phase, 'flop');
  s = stepChase(s, { now: s.until, speed: 1200 }); assert.equal(s.phase, 'peek');
  s = stepChase(s, { now: s.until, speed: 1200 }); assert.equal(s.phase, 'chase');
  const resumed = s.last;
  for (let now = resumed + 50; now < resumed + 3000; now += 50) s = stepChase(s, { now, speed: 2000 });
  assert.equal(s.phase, 'chase');
  s = stepChase(s, { now: s.last + 50, active: false });
  assert.deepEqual(s, createChase());
});

test('gentle chasing and an isolated pointer spike do not trigger a flop', () => {
  let s = stepChase(createChase(), { now: 0 });
  s = stepChase(s, { now: 50, speed: 3000 });
  for (let now = 100; now < 8000; now += 50) s = stepChase(s, { now, speed: 100, distance: 70 });
  assert.equal(s.phase, 'chase'); assert.equal(s.effort, 0);
  s = stepChase(s, { now: 90000, speed: 3000 });
  assert.equal(s.phase, 'chase', 'a suspended tab does not accumulate a long chase');
});

test('shared food recruits two friends, persists, expires and cannot be spammed', () => {
  const before = createState(1000), original = JSON.stringify(before);
  let s = act(before, { type: 'share-snack', x: 76, y: 76 }, 1100);
  assert.equal(JSON.stringify(before), original);
  assert.equal(s.creatures.filter(c => c.activity === 'share-snack').length, 2);
  assert.deepEqual(s.creatures.map(c => c.fullness), [80, 80, 70]);
  assert.equal(s.care, 1); assert.ok(validState(JSON.parse(JSON.stringify(s))));
  s = act(s, { type: 'share-snack', x: 24, y: 52 }, 1200);
  assert.equal(s.care, 1); assert.deepEqual(s.creatures.map(c => c.fullness), [80, 80, 70]);
  s = advance(s, 8101); assert.ok(s.creatures.every(c => c.activity === null));
  s = act(s, { type: 'share-snack', x: 24, y: 52 }, 8200); assert.equal(s.care, 1);
  s = act(s, { type: 'share-snack', x: 24, y: 52 }, 9200); assert.equal(s.care, 2);
  assert.ok(validState(s));
});

test('food respects sleeping and recovering friends, with no reward for fewer than two', () => {
  let s = act(createState(1000), { type: 'rest' }, 1000);
  s = act(s, { type: 'share-snack', x: 50, y: 64 }, 1200);
  assert.equal(s.creatures[0].activity, 'cushion'); assert.equal(s.creatures[0].fullness, 70);
  assert.equal(s.creatures[1].activity, 'share-snack'); assert.equal(s.creatures[2].activity, 'share-snack');
  const damaged = createState(1000);
  damaged.creatures[0].recoverAt = 20000; damaged.creatures[0].mood = 'cracked';
  damaged.creatures[1].mood = 'sleepy'; damaged.creatures[1].energy = 20;
  assert.equal(snackFriends(damaged, 1000).length, 1);
  assert.equal(act(damaged, { type: 'share-snack', x: 50, y: 64 }, 1000).care, 0);
});

test('invalid food placements are rejected without modifying the save', () => {
  const s = createState(1000), before = JSON.stringify(s);
  for (const [x,y] of [[NaN,60],[50,Infinity],[23,60],[77,60],[50,51],[50,77]])
    assert.throws(() => act(s, { type: 'share-snack', x, y }, 1000));
  assert.equal(JSON.stringify(s), before);
});


test('Pip sneaks in while the other pet looks away, and each pet reaches the snack in its own time',()=>{
 assert.deepEqual(snackFace('pip','miso',1500,1),{expression:'content',look:8});
 assert.deepEqual(snackFace('miso','pip',1500,-1),{expression:'curious',look:8});
 assert.deepEqual(snackFace('miso','pip',2200,-1),{expression:'content',look:-8});
 assert.deepEqual(snackFace('pip','miso',2200,1),{expression:'curious',look:-8});
 for(const id of ['miso','pip'])assert.equal(snackFace(id,id==='miso'?'pip':'miso',3200,1).expression,'happy');
 assert.equal(snackFace('moss','miso',1200,1).expression,'happy');
 assert.equal(snackFace('miso','moss',1200,-1).expression,'curious');
});
