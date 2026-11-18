import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {makeSound,SOUND_KINDS} from '../public/pet/voice.js';
import {cartoonCreatureSVG} from '../public/cartoon.js';
import {createState} from '../src/game.js';
test('nonverbal cues are deterministic, fade in/out, and cannot clip',()=>{
 for(const kind of SOUND_KINDS)for(const id of ['miso','moss','pip']){
  const sound=makeSound(kind,id);assert.ok(sound.length>=5000);assert.equal(sound[0],0);
  assert.ok(Math.abs(sound.at(-1))<.001);assert.ok(sound.some(v=>Math.abs(v)>.01));
  assert.ok(sound.every(v=>Number.isFinite(v)&&Math.abs(v)<.5));
  assert.deepEqual(sound,makeSound(kind,id));
 }
 assert.notDeepEqual(makeSound('happy','miso'),makeSound('happy','pip'));
});
test('current cartoon artwork has no feet and desktop content has no dialogue',async()=>{
 const pet=cartoonCreatureSVG(createState().creatures[0],'#f2cda3');assert.ok(!pet.includes('M65 174Q53'));
 const html=await readFile(new URL('../public/pet.html',import.meta.url),'utf8');
 const visible=html.replace(/<head>[\s\S]*?<\/head>/,'').replace(/<[^>]*>/g,'');assert.ok(!/[a-zA-Z\u4e00-\u9fff]/.test(visible));
});
