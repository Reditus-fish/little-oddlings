import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createState, act, advance, validState, migrateState, OBJECTS } from '../src/game.js';

test('over-touching cracks shell, repeated pokes cannot extend distress, rest heals', () => {
  let s=createState(1000);
  for(let i=0;i<5;i++)s=act(s,{type:'pet'},1000+i*100);
  assert.equal(s.creatures[0].mood,'cracked');
  const deadline=s.creatures[0].recoverAt;
  s=act(s,{type:'pet'},2000); assert.equal(s.creatures[0].recoverAt,deadline);
  s=advance(s,deadline+1);assert.equal(s.creatures[0].mood,'content');assert.equal(s.creatures[0].recoverAt,null);
  assert.ok(s.discoveries.includes('A little cracked. Still very loved.'));assert.equal(s.care,0);
});
test('comfort shortens recovery and restores the creature',()=>{
  let s=createState(1000);for(let i=0;i<5;i++)s=act(s,{type:'pet'},1000+i*100);
  s=act(s,{type:'comfort'},2000);assert.equal(s.creatures[0].mood,'recovering');assert.equal(s.creatures[0].recoverAt,8000);
  s=advance(s,8001);assert.equal(s.creatures[0].mood,'content');
});
test('all friends are available immediately; gentle care does not reward button spam',()=>{
  let s=createState(1000);s=act(s,{type:'feed'},1000);s=act(s,{type:'comfort'},1001);assert.equal(s.care,1);
  for(let i=1;i<7;i++)s=act(s,{type:'feed'},1000+i*3000);
  assert.equal(s.care,7);assert.equal(s.creatures.filter(c=>c.unlocked).length,3);
  s=act(s,{type:'select',id:'pip'},22000);assert.equal(s.selected,'pip');
});
test('offline recovery is bounded and clock rollback never moves time backward',()=>{
  const s=createState(10000);const earlier=advance(s,1000);assert.equal(earlier.updatedAt,10000);assert.equal(earlier.creatures[0].fullness,70);
  const later=advance(s,10000+365*24*3600000);assert.equal(later.creatures[0].fullness,70);assert.equal(later.creatures[0].energy,100);assert.ok(validState(later));
});
test('unknown creatures and invalid customization are rejected without changing input',()=>{
  const s=createState(1000),before=JSON.stringify(s);
  assert.throws(()=>act(s,{type:'select',id:'unknown'},1100));
  assert.throws(()=>act(s,{type:'customize',pattern:'bad',job:'chef'},1100));
  assert.equal(JSON.stringify(s),before);assert.ok(validState(s));
});
test('accessories persist through recovery; damaged saves are rejected',()=>{
  let s=createState(1000);s=act(s,{type:'customize',pattern:'stripes',job:'chef'},1000);
  for(let i=0;i<5;i++)s=act(s,{type:'pet'},1000+i*100);
  s=advance(s,50000);assert.equal(s.creatures[0].job,'chef');assert.equal(s.creatures[0].pattern,'stripes');
  assert.ok(validState(JSON.parse(JSON.stringify(s))));s.creatures[0].stress=NaN;assert.equal(validState(s),false);
});


test('v1 migration preserves progress and outfits while making all friends available',()=>{
  const old=createState(1000);old.version=1;delete old.habitat;old.care=12;
  old.creatures.forEach((c,i)=>{delete c.x;delete c.y;delete c.activity;delete c.activityUntil;c.unlocked=i===0;});
  old.creatures[0].pattern='stripes';old.creatures[0].bond=67;
  const upgraded=migrateState(old,2000);
  assert.ok(validState(upgraded));assert.equal(upgraded.care,12);assert.equal(upgraded.creatures[0].bond,67);
  assert.equal(upgraded.creatures[0].pattern,'stripes');assert.ok(upgraded.creatures.every(c=>c.unlocked));
  assert.equal(old.version,1);assert.equal(old.creatures[1].unlocked,false);
});
test('all fifteen object reactions reflect the selected personality',()=>{
  const lines=new Set();
  for(const id of ['miso','moss','pip'])for(const object of OBJECTS){
    let s=act(createState(1000),{type:'select',id},1000);
    s=act(s,{type:'interact',id:object.id},1000);
    const c=s.creatures.find(c=>c.id===id);assert.equal(c.activity,object.id);
    assert.equal(s.log[0].text,object.lines[id]);lines.add(s.log[0].text);assert.ok(validState(s));
    if(object.id==='bell')assert.ok(s.creatures.every(c=>c.activity==='bell'));
    if(object.id==='cushion')assert.equal(c.mood,'sleepy');
    if(object.id==='snack')assert.equal(c.fullness,90);
  }
  assert.equal(lines.size,15);
});
test('furniture movement is bounded, immutable, and saved; quiet mode suppresses ambient stories',()=>{
  const start=createState(1000),before=JSON.stringify(start);
  assert.throws(()=>act(start,{type:'move-object',id:'plant',x:101,y:50},1000));
  assert.throws(()=>act(start,{type:'move-object',id:'plant',x:NaN,y:50},1000));
  let s=act(start,{type:'move-object',id:'plant',x:45,y:55},1000);
  assert.deepEqual(s.habitat.objects.find(o=>o.id==='plant'),{id:'plant',x:45,y:55});assert.equal(JSON.stringify(start),before);
  s=act(s,{type:'settings',mode:'quiet',theme:'bedroom'},1000);
  const quiet=advance(s,30000,{ambient:true});assert.deepEqual(quiet.log,s.log);assert.equal(quiet.habitat.theme,'bedroom');
  const away=advance(start,100000,{ambient:true});assert.deepEqual(away.log,start.log);
  const lively=advance(start,30000,{ambient:true});assert.notDeepEqual(lively.log,start.log);
});
test('a cushion nap expires, and malformed saves are rejected without throwing',()=>{
  let s=act(createState(1000),{type:'interact',id:'cushion'},1000);
  assert.equal(advance(s,12000).creatures[0].mood,'sleepy');
  s=advance(s,14000);assert.equal(s.creatures[0].activity,null);assert.equal(s.creatures[0].mood,'content');
  for(const corrupt of [null,{}, {...s,creatures:[null,null,null]}, {...s,log:[null]}, {...s,habitat:{...s.habitat,objects:[null,null,null,null,null]}}])assert.equal(validState(corrupt),false);
});


test('playdates animate two available friends, increase mutual bond, and expire',()=>{
 const start=createState(1000),s=act(start,{type:'playdate'},1000);
 assert.equal(s.creatures.filter(c=>c.activity==='playdate').length,2);
 assert.equal(s.creatures[0].bond,13);assert.equal(s.creatures[1].bond,13);assert.ok(validState(s));
 const repeated=act(s,{type:'playdate'},1100);assert.equal(repeated.creatures[0].bond,13);
 assert.equal(advance(s,8000).creatures.filter(c=>c.activity==='playdate').length,0);
});
test('playdates respect sleeping and recovering friends',()=>{
 let s=createState(1000);s=act(s,{type:'rest'},1000);
 s=act(s,{type:'select',id:'moss'},1000);s=act(s,{type:'playdate'},1000);
 assert.equal(s.creatures[0].activity,'cushion');assert.equal(s.creatures[1].activity,'playdate');assert.equal(s.creatures[2].activity,'playdate');
 const resting=act(act(createState(1000),{type:'rest'},1000),{type:'playdate'},1000);
 assert.equal(resting.creatures.filter(c=>c.activity==='playdate').length,0);
});
