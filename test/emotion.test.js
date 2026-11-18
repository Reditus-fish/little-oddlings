import {test} from 'node:test';
import assert from 'node:assert/strict';
import {petEmotion,emotionEffectSVG} from '../public/pet/emotion.js';
import {createState,act} from '../src/game.js';

test('distress and recovery override happy reactions without mutating the save',()=>{
 let state=createState(1000);
 for(let i=0;i<5;i++)state=act(state,{type:'pet'},1000+i*100);
 const creature=state.creatures[0],before=JSON.stringify(creature);
 assert.equal(petEmotion(creature,{reaction:'pet',snack:true}).effect,'storm');
 assert.equal(JSON.stringify(creature),before);
 state=act(state,{type:'comfort'},2000);
 assert.deepEqual(petEmotion(state.creatures[0],{reaction:'comfort'}),{face:'sleepy',effect:'healing'});
});
test('gentle care, curiosity and restful poses have distinct wordless reactions',()=>{
 const creature=createState(1000).creatures[0];
 assert.equal(petEmotion(creature,{reaction:'pet'}).face,'happy');
 assert.equal(petEmotion(creature,{phase:'peek'}).face,'curious');
 assert.equal(petEmotion(creature,{parked:true}).face,'sleepy');
 assert.equal(petEmotion(creature).effect,'');
});

test('a startle settles into rain and the effect artwork is drawn, not emoji text',()=>{
 const creature={...createState(1000).creatures[0],mood:'overwhelmed'};
 assert.equal(petEmotion(creature,{startled:true}).effect,'startle');
 assert.equal(petEmotion(creature).effect,'rain');
 assert.match(emotionEffectSVG('rain'),/<path class="feel-drop"/);
 assert.match(emotionEffectSVG('storm'),/<path class="feel-bolt"/);
 assert.equal(emotionEffectSVG('constructor'),'');
});
