import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createStayIdle,stepStayIdle,stayTouch} from '../public/pet/stay.js';

test('Stay poses wait for their deadline and vary without repeating back to back',()=>{
 const random=()=>0;
 const initial=createStayIdle(1000,random);
 assert.equal(stepStayIdle(initial,6499,'miso',true,random).active,null);
 const first=stepStayIdle(initial,6500,'miso',true,random);
 assert.equal(first.active.motion,'peek');
 assert.equal(stepStayIdle(first,6501,'miso',true,random),first);
 const next=stepStayIdle(first,first.nextAt,'miso',true,random);
 assert.notEqual(next.active.motion,first.active.motion);
});

test('Pause or Follow clears an active Stay pose without replaying a backlog',()=>{
 const random=()=>0;
 const start=createStayIdle(0,random);
 const active=stepStayIdle(start,start.nextAt,'moss',true,random);
 const stopped=stepStayIdle(active,start.nextAt+1,'moss',false,random);
 assert.equal(stopped.active,null);
 assert.equal(stepStayIdle(stopped,stopped.nextAt-1,'moss',true,random).active,null);
});

test('Each pet has distinct pat and boop reactions and a dozing pet wakes gently',()=>{
 for(const id of ['miso','moss','pip']){
  assert.notEqual(stayTouch(id,'pat').motion,stayTouch(id,'boop').motion);
 }
 assert.equal(stayTouch('moss','boop').motion,'bounce');
 assert.equal(stayTouch('moss','boop',true).motion,'stretch');
});
