import {drawFortune,mountFortune} from './fortune.js';
import {createStayIdle,stepStayIdle,stayTouch} from './stay.js';
import {installToyInvitation} from './invitation.js';
import {EGG_FOR_FRIEND,FIZZY_BEAD,createEgg,renderEggSVG} from './eggs.js';
import {petEmotion,emotionEffectSVG} from './emotion.js';
import {createChase,stepChase,installPointerPlay} from './chase.js';
import {installSnackToy,snackSVG,snackFace} from './snack.js';
import {installCreatureCursor} from './cursor.js';
import {cartoonCreatureSVG} from '../cartoon.js';
import {createState,act,advance,validState,migrateState,PERSONALITIES,snackFriends} from '../core/game.js';
import {createVoice} from './voice.js';
const native=window.webkit?.messageHandlers?.pet;
const $=id=>document.getElementById(id),voice=createVoice(),reduced=matchMedia('(prefers-reduced-motion: reduce)');
let state=createState(),motion='crawl',frameKey='',lastSound=0,saveReady=!native;
let dragging=false,pin=true,paused=false,nativeVisible=true,following=false,followMoving=false,pending=[];
const cursorSkin=native?null:installCreatureCursor($('follow'));
if(!native)$('follow').setAttribute('aria-label','切換小夥伴游標');
let chase=createChase(),snackPreview=null,browserPosition=null,browserPhase='chase';
let reaction='',reactionUntil=0,startleUntil=0,parked=false;
let idleSince=performance.now(), idlePose=createStayIdle(idleSince), touchPose=null;
const creatureButton=$('creature');
const controls=document.querySelector('.controls');
const staying=()=>!following&&!cursorSkin?.enabled;
if(native)document.body.classList.add('native-pet');
function resetStay(now=performance.now()){
 idlePose=createStayIdle(now);
 touchPose=null;
}
const feeling=$('feeling'),eggStage=$('egg-stage');
const fizzySnackSVG=snackSVG.replace('</svg>',`<g class="fizzy-bead">${FIZZY_BEAD}</g></svg>`);
let egg=null,suppressSnackUntil=0;
const eggSeen=kind=>Array.isArray(state.desktopEggs)&&state.desktopEggs.includes(kind);
const canPlayEgg=()=>!egg&&saveReady&&!paused&&!following&&nativeVisible&&!document.hidden&&!dragging;
function markEgg(kind){
 const seen=Object.values(EGG_FOR_FRIEND).filter(eggSeen);
 if(!seen.includes(kind)){state.desktopEggs=[...seen,kind];persist();}
}
function playEgg(kind,visibleArea){
 if(!canPlayEgg())return;
 snackToy.cancel();parked=false;browserPosition=null;browserPhase='chase';
 reaction='';idleSince=performance.now();
 invitation.cancel();resetStay(idleSince);
 eggStage.hidden=false;
 document.body.classList.add('egg-playing');
 if(native){
  artworkKey='';
  post('artwork',{following});
 }
 let scene,paint;
 if(kind==='fortune'){
  eggStage.dataset.fortune='';
  if(visibleArea){
   eggStage.style.top=`${visibleArea.top}px`;
   eggStage.style.bottom=`${visibleArea.bottom}px`;
  }
  const pet=selected();
  scene=drawFortune({...pet,color:PERSONALITIES.find(friend=>friend.id===pet.id).color},reduced.matches);
  paint=mountFortune(eggStage,scene);
 }else{
  const layout={width:eggStage.clientWidth,height:eggStage.clientHeight};
  scene=createEgg(kind,layout,reduced.matches,Math.random,state.creatures);
  markEgg(kind);
 }
 egg={kind,cue:0,start:performance.now(),scene,paint};
 renderEgg(egg.start);
}
function endEgg(completed=false){
 if(!egg)return;
 const finished=egg;
 egg=null;
 eggStage.hidden=true;eggStage.replaceChildren();
 delete eggStage.dataset.fortune;
 eggStage.style.removeProperty('top');
 eggStage.style.removeProperty('bottom');
 $('fortune-result').textContent='';
 document.body.classList.remove('egg-playing');
 idleSince=performance.now();
 resetStay(idleSince);
 if(completed&&finished.kind==='fizz'&&!native)parked=true;
 render();
}
function renderEgg(now){
 const {scene,start}=egg;
 const t=(now-start)/1000;
 if(t>=scene.duration){endEgg(true);return;}
 while(egg.cue<scene.cues.length&&t>=scene.cues[egg.cue].at){
  const {sound,actor}=scene.cues[egg.cue++];
  voice.play(sound,actor??scene.creature?.id??scene.cast[0].id);
 }
 if(egg.paint){
  egg.paint(t);
  if(t>=1.55&&!$('fortune-result').textContent)$('fortune-result').textContent=scene.label;
 }else eggStage.innerHTML=renderEggSVG(scene,t);
}
const KEY='oddlings-desktop-v1';
const post=(type,extra={})=>native?.postMessage({type,...extra});
let artworkKey='';
function reportArtwork(creature,sharing){
 // Report the resting SVG footprint in AppKit points. Transient shell
 // animations and effects should never push the saved perch around.
 const key=[creature.job,creature.mood==='recovering',following,sharing,innerWidth,innerHeight].join(':');
 if(key===artworkKey)return;
 const svg=$('shell').firstElementChild;
 const art=svg.getBBox(),view=svg.viewBox.baseVal;
 const box=creatureButton.getBoundingClientRect();
 const scale=Math.min(box.width/view.width,box.height/view.height);
 const left=box.left+(box.width-view.width*scale)/2;
 const top=box.top+(box.height-view.height*scale)/2;
 artworkKey=key;
 post('artwork',{
  x:left+art.x*scale-1,
  y:innerHeight-top-(art.y+art.height)*scale-1,
  width:art.width*scale+2,height:art.height*scale+2,
  following,stationary:!following&&!sharing
 });
}
const selected=()=>state.creatures.find(c=>c.id===state.selected);
function restore(raw){
 try{const next=migrateState(typeof raw==='string'?JSON.parse(raw):raw);if(!validState(next))throw new Error();state=advance(next);$('save-alert').hidden=true;return true;}
 catch{$('save-alert').hidden=false;return false;}
}
if(!native){document.body.classList.add('browser-preview');controls.hidden=false;try{const raw=localStorage.getItem(KEY);if(raw&&!restore(raw))saveReady=false;}catch{saveReady=false;$('save-alert').hidden=false;}}
window.__petRestore=raw=>{if(raw!==null&&!restore(raw)){saveReady=false;return;}saveReady=true;render();const actions=pending;pending=[];for(const {type,zone} of actions)interact(type,zone);};
function setPaused(value){
 paused=value;
 if(value){endEgg();invitation.cancel();}
 idleSince=performance.now();
 resetStay(idleSince);
 document.body.dataset.paused=String(paused);
 $('pause').setAttribute('aria-pressed',String(value));
 $('pause').textContent=value?'▷':'Ⅱ';
}
const menuControls=new Set(['change','nap','comfort','snack-toy','invite-toy','replay-egg','sound','pin']);
window.__petNative=(event,value)=>{
 if(event==='fortune')playEgg('fortune',value);
 if(event==='pointer-motion'){
  chase=stepChase(chase,{now:performance.now(),...value,active:canChase()});
  post('follow-tick',{allowed:canChase()&&chase.phase==='chase'});
  render();
 }
 if(event==='following'){
  chase=createChase();following=value;idleSince=performance.now();resetStay(idleSince);
  if(value){endEgg();invitation.cancel();parked=false;}
  document.body.classList.toggle('following',value);
  artworkKey='';
  $('follow').setAttribute('aria-pressed',String(value));
  $('follow').setAttribute('aria-label',value?'停在原處':'跟隨游標');
  $('follow').title=value?'停在原處':'跟隨游標';
  $('follow').textContent=value?'⌖':'◎';
 }
 if(event==='toolbar'){
  if(value!==null)controls.style.top=`${value}px`;
  controls.hidden=value===null;
 }
 if(event==='follow-moving')followMoving=value;
 if(event==='visible'){nativeVisible=value;idleSince=performance.now();resetStay(idleSince);if(!value){endEgg();invitation.cancel();}}
 if(event==='command'&&menuControls.has(value)){
  if(egg?.kind==='fortune')endEgg();
  $(value).click();
 }
 if(event==='pause')setPaused(value);
 if(event==='save-error')$('save-alert').hidden=false;
 if(event==='save-ok')$('save-alert').hidden=true;
};
function persist(){if(!saveReady)return;if(native)post('save',{state:JSON.stringify(state)});else try{localStorage.setItem(KEY,JSON.stringify(state));$('save-alert').hidden=true;}catch{$('save-alert').hidden=false;}}
function canChase(){const c=selected();return !egg&&nativeVisible&&!parked&&!paused&&!reduced.matches&&c.mood==='content'&&c.activity===null;}
function render(){
 if(egg)return;
 $('fortune').disabled=!canPlayEgg();
 document.body.dataset.toy=invitation.phase;
 const c=selected(),p=PERSONALITIES.find(p=>p.id===c.id),phase=following?chase.phase:browserPhase;
 const now=performance.now();
 const remaining=c.activity==='share-snack'?(c.activityUntil??0)-Date.now():0;
 const sharing=remaining>0&&!following&&!paused&&c.activityUntil!==suppressSnackUntil;
 const visitor=sharing?state.creatures.find(f=>f.id!==c.id&&f.activity==='share-snack'):null;
 const elapsed=visitor?Math.max(0,7000-remaining):0;
 const pose=visitor?snackFace(c.id,visitor.id,elapsed,-1):null;
 const emotion=petEmotion(c,{phase,parked,snack:pose?.expression==='happy',
  reaction:now<reactionUntil?reaction:'',startled:now<startleUntil});
 const stayPose=staying()&&!paused&&!dragging&&!invitation.active&&!snackToy.active&&
  c.mood==='content'&&c.activity===null&&!parked
  ? (touchPose&&touchPose.until>now?touchPose:idlePose.active) : null;
 const expression=pose?.expression??stayPose?.face??(invitation.active?(invitation.phase==='playing'?'happy':'curious'):emotion.face);
 const look=pose?.look??stayPose?.look??(invitation.active?8:0);
 const effect=stayPose?.effect??emotion.effect;
 const animation=stayPose?.motion??'';
 if(creatureButton.dataset.stayMotion!==animation)creatureButton.dataset.stayMotion=animation;
 const key=JSON.stringify([c.id,c.mood,c.pattern,c.job,expression,look]);
 cursorSkin?.refresh(c,p.color);
 if(key!==frameKey){$('shell').innerHTML=cartoonCreatureSVG({...c,expression,look},p.color,'desktop');frameKey=key;}
 const sleeping=['sleepy','recovering'].includes(c.mood);
 $('creature').className=`${c.mood} ${!staying()&&!parked&&!sharing&&!sleeping&&!paused&&c.recoverAt===null&&(!following||followMoving)?motion:''}`;
 $('creature').dataset.chase=phase;
 $('creature').style.left=browserPosition?`${browserPosition.x}%`:'';
 $('creature').style.top=browserPosition?`${browserPosition.y}%`:'';
 $('creature').classList.toggle('cursor-playing',Boolean(browserPosition));
 renderSnack(visitor,elapsed);
 if(native)reportArtwork(c,Boolean(visitor));
 const effectKey=effect&&stayPose?.effect?`${effect}:${stayPose.until}`:effect;
 if(feeling.dataset.key!==effectKey){
  feeling.dataset.key=effectKey;
  feeling.innerHTML=emotionEffectSVG(effect);
  feeling.hidden=!effect;
 }
 $('park').setAttribute('aria-pressed',String(parked));
 document.body.classList.toggle('parked',parked);
 document.body.dataset.friend=c.id;
 $('replay-egg').hidden=!eggSeen(EGG_FOR_FRIEND[c.id]);
 if(!snackToy.active){
  const fizzy=Boolean(fizzyPair().length);
  if($('snack-toy').classList.toggle('fizzy',fizzy)!==($('snack-toy').dataset.fizzy==='true')){
   $('snack-toy').dataset.fizzy=String(fizzy);
   $('snack-toy').innerHTML=fizzy?fizzySnackSVG:snackSVG;
  }
 }
}
function interact(type,zone='pat'){
 const wasDozing=parked||idlePose.active?.motion==='doze';
 invitation.cancel();
 parked=false;idleSince=performance.now();reaction=type;reactionUntil=idleSince+2600;
 resetStay(idleSince);
 snackToy.cancel();browserPosition=null;browserPhase='chase';
 if(!saveReady){if(native)pending.push({type,zone});return;}
 if(type==='change'){const index=state.creatures.findIndex(c=>c.id===state.selected);state=act(state,{type:'select',id:state.creatures[(index+1)%3].id});}
 else {
  const before=selected().mood;
  const cloud=type==='comfort'&&selected().id==='miso'&&before==='overwhelmed'&&!eggSeen('cloud')&&
    state.creatures.some(c=>c.id==='moss'&&c.mood==='content'&&c.activity===null);
  state=act(state,{type});
  if(cloud&&canPlayEgg()){persist();playEgg('cloud');return;}
  if(type==='pet'){
   const friend=selected();
   if(staying()&&friend.mood==='content'&&friend.activity===null){
    const pose=stayTouch(friend.id,zone,wasDozing);
    touchPose={...pose,until:idleSince+pose.duration};
    if(creatureButton.dataset.stayMotion===pose.motion){
     creatureButton.dataset.stayMotion='';
     void creatureButton.offsetWidth;
    }
   }
   if(before!=='overwhelmed'&&friend.mood==='overwhelmed')startleUntil=idleSince+550;
  }
 }
 const c=selected();voice.play(c.recoverAt!==null||c.mood==='overwhelmed'?'grumpy':type==='rest'?'sleep':type==='comfort'?'comfort':touchPose?.sound??'happy',c.id);
 persist();render();
}
if(native){
 $('follow').title='跟隨游標';
 $('follow').addEventListener('click',()=>{snackToy.cancel();post('follow',{value:!following});});
}
document.addEventListener('keydown',e=>{
 if(e.key!=='Escape')return;
 if(egg)endEgg();
 else if(invitation.active)invitation.cancel();
 else if(native)post('follow',{value:false});
});
for(const event of ['pointermove','pointerdown','keydown','focusin']){
 document.addEventListener(event,()=>{idleSince=performance.now();},{passive:true});
}
function setParked(value){
 snackToy.cancel();
 parked=value;
 idleSince=performance.now();
 browserPosition=null;browserPhase='chase';
 resetStay(idleSince);
 render();
}
$('fortune').addEventListener('click',()=>{
 if(native)post('fortune');
 else playEgg('fortune');
});
$('park').addEventListener('click',()=>setParked(!parked));
$('replay-egg').addEventListener('click',()=>{
 const kind=EGG_FOR_FRIEND[selected().id];
 if(eggSeen(kind)&&selected().mood==='content'&&selected().activity===null)playEgg(kind);
});
$('pause').addEventListener('click',()=>{if(native)post('pause');else setPaused(!paused);});
let suppressTap=false;
creatureButton.addEventListener('click',event=>{
 if(suppressTap&&event.detail!==0)return;
 if(following||egg)return;
 const bounds=creatureButton.getBoundingClientRect();
 const zone=event.detail!==0&&event.clientY>bounds.top+bounds.height*.62?'boop':'pat';
 interact('pet',zone);
});
$('change').addEventListener('click',()=>interact('change'));
$('nap').addEventListener('click',()=>interact('rest'));
$('comfort').addEventListener('click',()=>interact('comfort'));
$('motion').addEventListener('click',()=>{parked=false;motion=motion==='crawl'?'hop':'crawl';$('motion').textContent=motion==='crawl'?'↝':'↟';$('motion').setAttribute('aria-pressed',String(motion==='hop'));voice.play(motion,selected().id);render();});
$('sound').addEventListener('click',async()=>{try{await voice.enable(!voice.enabled);$('sound').textContent=voice.enabled?'♪':'♩̸';$('sound').setAttribute('aria-pressed',String(voice.enabled));$('sound').setAttribute('aria-label',voice.enabled?'關閉音效':'開啟音效');post('sound',{value:voice.enabled});if(voice.enabled)voice.play('happy',selected().id);}catch{$('sound').textContent='♩̸';}});
$('pin').addEventListener('click',()=>{pin=!pin;$('pin').setAttribute('aria-pressed',String(pin));post('pin',{value:pin});});
$('close').addEventListener('click',()=>{if(native)post('hide');else setPaused(!paused);});
// A small pointer movement is still a tap. Only an intentional drag moves the native panel.
let dragPoint=null;
if(native){
 creatureButton.addEventListener('pointerdown',event=>{
  if(event.button!==0||following||egg||dragPoint)return;
  suppressTap=false;
  dragPoint={id:event.pointerId,x:event.screenX,y:event.screenY};
  creatureButton.setPointerCapture(event.pointerId);
 });
 creatureButton.addEventListener('pointermove',event=>{
  if(dragPoint?.id!==event.pointerId)return;
  const dx=event.screenX-dragPoint.x,dy=event.screenY-dragPoint.y;
  if(!dragging&&Math.hypot(dx,dy)<6)return;
  if(!dragging){dragging=true;suppressTap=true;invitation.cancel();snackToy.cancel();resetStay();}
  post('drag',{dx,dy});
  dragPoint={id:event.pointerId,x:event.screenX,y:event.screenY};
 });
 const finishDrag=event=>{
  if(dragPoint?.id!==event.pointerId)return;
  if(dragging){post('drag-end');resetStay();}
  dragging=false;dragPoint=null;
 };
 for(const event of ['pointerup','pointercancel','lostpointercapture']){
  creatureButton.addEventListener(event,finishDrag);
 }
}
function fizzyPair(){
 return selected().id==='moss'&&!eggSeen('fizz')?snackFriends(state,Date.now(),'pip'):[];
}
const snackToy=installSnackToy({button:$('snack-toy'),surface:$('pet-world'),
 canStart:()=>canPlayEgg()&&snackFriends(state).some(c=>c.id===state.selected),
 art:()=>fizzyPair().length?fizzySnackSVG:snackSVG,
 preview:point=>{snackPreview=point;browserPosition=null;browserPhase='chase';render();},
 cancel:()=>{snackPreview=null;render();},
 drop:point=>{
  snackPreview=null;
  const fizzy=Boolean(fizzyPair().length);
  const c=selected(),prior=c.activityUntil;
  state=act(state,{type:'share-snack',...point,guest:fizzy?'pip':undefined});
  const served=selected().activityUntil;
  if(served!==prior&&selected().activity==='share-snack'){
   const kettle=c.id==='pip'&&!eggSeen('kettle')&&state.creatures.some(f=>f.id==='miso'&&f.activityUntil===served);
   if(fizzy||kettle){
    suppressSnackUntil=served;
    persist();playEgg(fizzy?'fizz':'kettle');return;
   }
  }
  if(selected().activity==='share-snack'){
   parked=false;reaction='';idleSince=performance.now();
   voice.play('happy',selected().id);
  }
  persist();render();
 }
});
const invitation=installToyInvitation({
 surface:$('pet-world'),trigger:$('invite-toy'),reduced,
 eligible:()=>saveReady&&!egg&&!paused&&!following&&!cursorSkin?.enabled&&nativeVisible&&!document.hidden&&!dragging&&!parked&&!snackToy.active&&selected().mood==='content'&&selected().activity===null,
 sound:kind=>voice.play(kind,selected().id),
 settle:()=>native?resetStay():setParked(true)
});
$('shared-snack').innerHTML=snackSVG;
let snackScene='';
function renderSnack(partner,elapsed){
 const c=selected(),sharing=Boolean(partner);
 const special=snackPreview&&!following?fizzyPair():[];
 const pair=snackPreview&&!following?(special.length?special:snackFriends(state)):[];
 const visitor=partner??(pair[0]?.id===c.id?pair[1]:null);
 const scene=sharing?`${c.id}:${partner.id}:${c.activityUntil}`:'';
 if(scene!==snackScene){
  snackScene=scene;
  document.body.style.setProperty('--snack-delay',`-${elapsed}ms`);
 }
 document.body.classList.toggle('snack-mode',Boolean(visitor));
 document.body.classList.toggle('snack-sharing',sharing);
 $('visitor').hidden=!visitor;$('shared-snack').hidden=!sharing;
 if(visitor){
  const p=PERSONALITIES.find(p=>p.id===visitor.id);
  const pose=sharing?snackFace(visitor.id,c.id,elapsed,1):{expression:'curious',look:-8};
  const key=JSON.stringify([visitor.id,visitor.pattern,visitor.job,pose]);
  if($('visitor').dataset.render!==key){
   $('visitor-shell').innerHTML=cartoonCreatureSVG({...visitor,...pose},p.color,'visitor');
   $('visitor').dataset.render=key;
   $('visitor').dataset.friend=visitor.id;
  }
  if(native)return; // CSS stages the visitor beside the fixed native pet.
  const point=sharing?{x:(c.x+visitor.x)/2,y:c.y}:snackPreview;
  const center=`clamp(min(142px, 50vw), ${point.x}%, max(50vw, calc(100% - 142px)))`;
  const spacing='min(18vw, 64px)';
  $('creature').style.left=`calc(${center} - ${spacing})`;$('creature').style.top=`${point.y}%`;
  $('visitor').style.left=`calc(${center} + ${spacing})`;$('visitor').style.top=`${point.y}%`;
  $('shared-snack').style.left=center;$('shared-snack').style.top=`${point.y}%`;
 }
}
if(!native)installPointerPlay({surface:$('pet-world'),enabled:()=>cursorSkin.enabled&&!snackToy.active,
 target:()=>$('creature'),eligible:()=>canChase(),
 move:(x,y)=>{browserPosition={x,y};},pose:phase=>{browserPhase=phase;},reset:()=>{browserPosition=null;browserPhase='chase';}
});
function tick(now){
 invitation.update(now,!native&&now-idleSince>12000);
 if(egg){renderEgg(now);requestAnimationFrame(tick);return;}
 const c=selected();
 const available=saveReady&&!invitation.active&&!parked&&!snackToy.active&&c.activity===null&&
  nativeVisible&&!document.hidden&&!paused&&!dragging&&c.mood==='content';
 idlePose=stepStayIdle(idlePose,now,c.id,available&&staying()&&!(touchPose&&touchPose.until>now));
 if(available&&!reduced.matches&&following&&followMoving&&voice.enabled&&now-lastSound>15000){
  lastSound=now;voice.play(motion,c.id);
 }
 render();requestAnimationFrame(tick);
}
setInterval(()=>{if(saveReady&&!document.hidden){state=advance(state);persist();render();}},3000);
document.addEventListener('visibilitychange',()=>{resetStay();if(document.hidden){endEgg();invitation.cancel();}});
reduced.addEventListener('change',()=>{if(egg)endEgg();});
render();if(native)post('load');requestAnimationFrame(tick);
