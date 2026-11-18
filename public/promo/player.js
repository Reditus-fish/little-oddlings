import {createVoice} from '../pet/voice.js';
import { DURATION, CHAPTERS, sceneAt, renderScene } from './scene.js';
const stage=document.getElementById('stage'),play=document.getElementById('play'),timeline=document.getElementById('timeline'),time=document.getElementById('time');
const voice=createVoice();
const cues=[[.5,'sleep','miso'],[2.7,'happy','moss'],[3.05,'hop','pip'],[4.7,'hop','moss'],[6.6,'hop','pip'],[9,'grumpy','miso'],[12.4,'crawl','moss'],[15.4,'comfort','moss'],[16.4,'happy','miso'],[20.3,'sleep','miso']];
document.getElementById('film-sound').addEventListener('click',async()=>{await voice.enable(!voice.enabled);document.getElementById('film-sound').textContent=voice.enabled?'♪':'♩̸';document.getElementById('film-sound').setAttribute('aria-pressed',String(voice.enabled));});
let position=0,playing=!matchMedia('(prefers-reduced-motion: reduce)').matches,last=null;
const format=t=>`0:${String(Math.floor(t)).padStart(2,'0')}`;
const buttons=CHAPTERS.map(chapter=>{const button=document.createElement('button');button.textContent=`${format(chapter.at)} · ${chapter.label}`;button.addEventListener('click',()=>{position=chapter.at;playing=false;last=null;draw();});document.getElementById('chapters').append(button);return button;});
function draw(){
  stage.innerHTML=renderScene(position);timeline.value=position;time.textContent=`${format(position)} / ${format(DURATION)}`;
  play.textContent=playing?'Ⅱ':'▷';play.setAttribute('aria-label',playing?'Pause animation':'Play animation');
  const chapter=sceneAt(position).chapter;buttons.forEach((b,i)=>b.setAttribute('aria-current',String(CHAPTERS[i].label===chapter)));
}
play.addEventListener('click',()=>{if(position===DURATION)position=0;playing=!playing;last=null;draw();});
document.getElementById('replay').addEventListener('click',()=>{position=0;playing=true;last=null;draw();});
timeline.addEventListener('input',()=>{position=Number(timeline.value);playing=false;last=null;draw();});
document.addEventListener('visibilitychange',()=>{last=null;});
function frame(now){if(playing&&!document.hidden){const before=position;if(last!==null)position=Math.min(DURATION,position+(now-last)/1000);for(const [at,kind,id]of cues)if(before<at&&position>=at)voice.play(kind,id);last=now;if(position===DURATION)playing=false;draw();}else last=null;requestAnimationFrame(frame);}
draw();requestAnimationFrame(frame);
