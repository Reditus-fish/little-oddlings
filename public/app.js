import {renderCopycat} from './copycat.js';
import {installPointerPlay} from './pet/chase.js';
import {installSnackToy,snackSVG} from './pet/snack.js';
import {snackFriends} from './core/game.js';
import {installCreatureCursor} from './pet/cursor.js';
import { cartoonCreatureSVG } from './cartoon.js';
import { softCreatureSVG } from './soft.js';
import { objectSVG } from './objects.js';
import { OBJECTS } from './core/content.js';
import { update, storageLabel } from './storage.js';
const $=id=>document.getElementById(id);
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state,personalities,busy=false,arranging=false,drag=null,queue=Promise.resolve(),lastStory='';
let artStyle='cartoon',playEnabled=false,playPosition=null,playPhase='chase',snackPreview=null;
const reducedPlay=matchMedia('(prefers-reduced-motion: reduce)');
try{if(localStorage.getItem('oddlings-art-style')==='soft')artStyle='soft';}catch{}
$('art-style').value=artStyle;
const cursorSkin=installCreatureCursor($('cursor-toggle'));
const residentNodes=new Map(),objectNodes=new Map();
const activityText={'copycat-leader':'','copycat-watcher':'','share-snack':'♡',playdate:'♡',cushion:'☾',plant:'♧',snack:'◒',notebook:'⋯',bell:'♡'};
function svg(c,p,id){return(artStyle==='cartoon'?cartoonCreatureSVG:softCreatureSVG)(c,p.color,id);}
const moods={content:'Perfectly happy to be here',sleepy:'Expertly doing nothing',overwhelmed:'A little space would be lovely',cracked:'A tiny crack. Rest will help.',recovering:'Getting soft and whole again'};

function render(){
  const selected=state.creatures.find(c=>c.id===state.selected),person=personalities.find(p=>p.id===state.selected);
  cursorSkin.refresh(selected,person.color);
  $('habitat').dataset.theme=state.habitat.theme;document.body.dataset.mode=state.habitat.mode;
  $('scene-name').textContent=state.habitat.theme==='garden'?'THE WINDOWSILL GARDEN':'THE COZY LITTLE BEDROOM';
  $('quiet').setAttribute('aria-pressed',String(state.habitat.mode==='quiet'));
  $('quiet').setAttribute('aria-label',state.habitat.mode==='quiet'?'Turn off quiet mode':'Turn on quiet mode');
  $('theme').value=state.habitat.theme;
  const story=state.log[0]?.text||'A perfectly ordinary, extraordinary afternoon.';
  if(story!==lastStory){$('story').textContent=selected.recoverAt!==null?'☁':selected.mood==='sleepy'?'☾':selected.mood==='overwhelmed'?'﹏':'♡';lastStory=story;}
  for(const c of state.creatures){
    const p=personalities.find(p=>p.id===c.id);
    let node=residentNodes.get(c.id);
    if(!node){node=document.createElement('button');node.type='button';node.dataset.id=c.id;node.className='resident';node.addEventListener('click',()=>send({type:'select',id:c.id}));$('residents').append(node);residentNodes.set(c.id,node);}
    node.className=`resident ${c.mood} ${c.id===state.selected?'selected':''} ${c.activity?'busy':''} ${c.activity==='playdate'?'playdate':''} ${c.activity==='share-snack'?'sharing-snack':''}`;
    node.setAttribute('aria-label',`Select ${p.name}`);node.setAttribute('aria-pressed',String(c.id===state.selected));
    node.style.setProperty('--hop-delay',`${c.id==='miso'?0:c.id==='moss'?-.6:-1.2}s`);node.style.left=`${c.x}%`;node.style.top=`${c.y}%`;node.style.zIndex=Math.round(c.y);
    const key=JSON.stringify([artStyle,c.mood,c.pattern,c.job,c.activity]);
    if(node.dataset.render!==key){node.innerHTML=`${svg(c,p,`resident-${c.id}`)}${c.activity?`<span class="activity-label">${activityText[c.activity]}</span>`:''}`;node.dataset.render=key;}
  }
  applyPlayPreview();
  const sharing=state.creatures.filter(c=>c.activity==='share-snack');
  $('shared-snack').hidden=sharing.length!==2;
  if(sharing.length===2){$('shared-snack').style.left=`${(sharing[0].x+sharing[1].x)/2}%`;$('shared-snack').style.top=`${sharing[0].y}%`;}
  for(const placed of state.habitat.objects){
    const spec=OBJECTS.find(o=>o.id===placed.id);
    let node=objectNodes.get(placed.id);
    if(!node){
      node=document.createElement('button');node.type='button';node.className='object';node.dataset.id=placed.id;
      node.innerHTML=`${objectSVG(spec.id)}<span class="object-name">${spec.name}</span>`;
      node.addEventListener('click',()=>{if(!arranging)send({type:spec.id==='cushion'&&state.habitat.mode!=='quiet'?'copycat':'interact',id:spec.id});});
      node.addEventListener('pointerdown',e=>startDrag(e,node));
      node.addEventListener('pointermove',moveDrag);node.addEventListener('pointerup',finishDrag);node.addEventListener('pointercancel',cancelDrag);
      node.addEventListener('keydown',e=>moveWithKeys(e,spec.id));
      $('objects').append(node);objectNodes.set(placed.id,node);
    }
    if(!drag||drag.id!==placed.id){node.style.left=`${placed.x}%`;node.style.top=`${placed.y}%`;}
    node.style.zIndex=Math.round(placed.y)-4;
    node.classList.toggle('engaged',state.creatures.some(c=>c.activity===placed.id));
    node.setAttribute('aria-label',arranging?`Move ${spec.name}. Use arrow keys.`:`${spec.verb} with ${person.name}`);
    node.title=arranging?'Drag to move, or use arrow keys':`${spec.verb} with ${person.name}`;
  }
  $('selected-name').textContent=person.name;$('selected-mood').textContent=moods[selected.mood];
  $('detail-name').textContent=person.name;$('detail-personality').textContent=person.title;$('detail-description').textContent=person.description;
  $('friend-preview').innerHTML=svg(selected,person,'profile');
  $('stats').innerHTML=[['bond','Feeling loved'],['fullness','Tiny tummy'],['energy','Energy'],['stress','Needs some space']].map(([key,label])=>`<div class="stat"><span>${label}</span><span>${Math.round(selected[key])}%</span></div>`).join('');
  $('pattern').value=selected.pattern;$('job').value=selected.job;
  const familyKey=JSON.stringify([artStyle,state.selected,state.creatures.map(c=>[c.pattern,c.job])]);
  if($('family').dataset.render!==familyKey){
    $('family').innerHTML=state.creatures.map((c,i)=>`<button data-id="${c.id}" aria-label="Meet ${personalities[i].name}" aria-pressed="${c.id===state.selected}">${svg({...c,mood:'content'},personalities[i],`family-${c.id}`)}<span><strong>${personalities[i].name}</strong><small>${['Overthinker','Social menace','Quiet radical'][i]}</small></span></button>`).join('');
    $('family').dataset.render=familyKey;
  }
  $('journal').innerHTML=state.log.slice(0,3).map(e=>`<li>${escape(e.text)}</li>`).join('');
  $('discovery-count').textContent=`${state.discoveries.length} DISCOVERED`;
  $('storage-note').textContent=`${storageLabel}. No account, ads, or analytics. Browser-only builds keep a separate save from the local server.`;
}
async function request(action){
  busy=true;
  try{
    const data=await update(action);state=data.state;personalities=data.personalities;render();
    $('save-status').textContent=`● ${storageLabel}`;$('error').hidden=true;
    if(action?.type==='pet'){
      const node=residentNodes.get(state.selected);node.classList.remove('pat');void node.offsetWidth;node.classList.add('pat');setTimeout(()=>node.classList.remove('pat'),450);
    }
  }catch(e){$('error').textContent=`Could not save: ${e.message} Your previous save has not been replaced. Please retry.`;$('error').hidden=false;$('save-status').textContent='Not saved';}
  finally{busy=false;}
}
function send(action){queue=queue.then(()=>request(action));return queue;}
function setArrange(){
  snackToy.cancel();stopPointerPlay();arranging=!arranging;$('habitat').classList.toggle('arranging',arranging);$('arrange').setAttribute('aria-pressed',String(arranging));
  $('arrange').textContent=arranging?'✓ All cozy':'✥ Arrange their home';
  $('scene-tip').textContent=arranging?'Drag the objects. Keyboard: focus an object and use arrow keys.':'Choose a friend, then touch the cushion. The nearest awake friend copies them.';
  if(state)render();
}
function startDrag(e,node){
  if(!arranging||!state||e.button!==0)return;
  e.preventDefault();const rect=$('habitat').getBoundingClientRect(),o=state.habitat.objects.find(x=>x.id===node.dataset.id);
  drag={id:o.id,node,x:o.x,y:o.y,startX:o.x,startY:o.y,dx:e.clientX-rect.left-o.x/100*rect.width,dy:e.clientY-rect.top-o.y/100*rect.height};
  node.setPointerCapture(e.pointerId);node.classList.add('dragging');
}
function moveDrag(e){
  if(!drag)return;const r=$('habitat').getBoundingClientRect();
  drag.x=Math.max(8,Math.min(92,(e.clientX-r.left-drag.dx)/r.width*100));drag.y=Math.max(36,Math.min(84,(e.clientY-r.top-drag.dy)/r.height*100));
  drag.node.style.left=`${drag.x}%`;drag.node.style.top=`${drag.y}%`;
}
function finishDrag(e){if(!drag)return;const {id,x,y,node}=drag;drag=null;node.classList.remove('dragging');if(node.hasPointerCapture(e.pointerId))node.releasePointerCapture(e.pointerId);send({type:'move-object',id,x,y});}
function cancelDrag(){if(!drag)return;drag.node.classList.remove('dragging');drag=null;render();}
function moveWithKeys(e,id){
  if(!arranging||!state)return;const delta={ArrowLeft:[-2,0],ArrowRight:[2,0],ArrowUp:[0,-2],ArrowDown:[0,2]}[e.key];if(!delta)return;
  e.preventDefault();const o=state.habitat.objects.find(o=>o.id===id);
  send({type:'move-object',id,x:Math.max(8,Math.min(92,o.x+delta[0])),y:Math.max(36,Math.min(84,o.y+delta[1]))});
}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);}

async function snapshot(){
  if(!state)return;$('snapshot').disabled=true;
  try{
    const background=document.querySelector('.backdrop').cloneNode(true);
    background.querySelector(state.habitat.theme==='garden'?'.bedroom-background':'.garden-background').remove();
    if(state.habitat.theme==='bedroom')background.querySelector('.floor').setAttribute('fill','#e5d7bd');
    const inner=s=>s.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
    const placed=state.habitat.objects.map(o=>`<svg x="${o.x*12-60}" y="${o.y*6.8-55}" width="120" height="86" viewBox="0 0 140 100">${inner(objectSVG(o.id))}</svg>`).join('');
    const friends=state.creatures.map(c=>`<svg x="${c.x*12-96}" y="${c.y*6.8-90}" width="192" height="132" viewBox="0 0 320 220">${inner(svg(c,personalities.find(p=>p.id===c.id),`share-${c.id}`))}</svg>`).join('');
    const picture=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="680" viewBox="0 0 1200 680">${background.innerHTML}${placed}${friends}</svg>`;
    const url=URL.createObjectURL(new Blob([picture],{type:'image/svg+xml'}));
    try{
      const img=new Image();img.src=url;await img.decode();const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=680;canvas.getContext('2d').drawImage(img,0,0);
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('Image export unavailable.');download(blob,'little-oddlings-moment.png');
    }finally{URL.revokeObjectURL(url);}
  }catch(e){$('error').textContent=`Could not export the picture: ${e.message}`;$('error').hidden=false;}
  finally{$('snapshot').disabled=false;}
}

function applyPlayPreview(){
  for(const [id,node] of residentNodes){
    const c=state.creatures.find(c=>c.id===id);
    node.classList.remove('cursor-playing','snack-looking');node.removeAttribute('data-chase');
    node.style.left=`${c.x}%`;node.style.top=`${c.y}%`;
    if(playPosition&&id===state.selected){
      node.classList.add('cursor-playing');node.dataset.chase=playPhase;
      node.style.left=`${playPosition.x}%`;node.style.top=`${playPosition.y}%`;
    }
    if(snackPreview&&!reducedPlay.matches){
      const pair=snackFriends(state),i=pair.findIndex(f=>f.id===id);
      if(pair.length===2&&i>=0){node.classList.add('snack-looking');node.style.left=`${snackPreview.x+(i===0?-10:10)}%`;node.style.top=`${snackPreview.y}%`;}
    }
  }
}
function stopPointerPlay(){playPosition=null;playPhase='chase';if(state)applyPlayPreview();}
$('chase-toggle').addEventListener('click',()=>{playEnabled=!playEnabled;$('chase-toggle').setAttribute('aria-pressed',String(playEnabled));if(!playEnabled)stopPointerPlay();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){playEnabled=false;$('chase-toggle').setAttribute('aria-pressed','false');stopPointerPlay();}});
installPointerPlay({surface:$('habitat'),enabled:()=>playEnabled&&!arranging&&!snackToy.active&&!snackPending&&state?.habitat.mode!=='quiet',
  target:()=>residentNodes.get(state?.selected),eligible:()=>{const c=state?.creatures.find(c=>c.id===state.selected);return c?.mood==='content'&&c.activity===null;},
  move:(x,y)=>{playPosition={x,y};applyPlayPreview();},pose:phase=>{playPhase=phase;applyPlayPreview();},reset:stopPointerPlay});
let snackPending=false;
const snackToy=installSnackToy({button:$('snack-toy'),surface:$('habitat'),canStart:()=>Boolean(state)&&!arranging&&!snackPending,
  preview:point=>{stopPointerPlay();snackPreview=point;applyPlayPreview();},
  cancel:()=>{snackPreview=null;if(state)render();},
  drop:async point=>{snackPending=true;snackPreview=null;await send({type:'share-snack',...point});snackPending=false;}
});
$('shared-snack').innerHTML=snackSVG;

$('arrange').addEventListener('click',setArrange);
$('family').addEventListener('click',e=>{const node=e.target.closest('[data-id]');if(node)send({type:'select',id:node.dataset.id});});
for(const b of document.querySelectorAll('[data-action]'))b.addEventListener('click',()=>send({type:b.dataset.action}));
$('quiet').addEventListener('click',()=>{if(state)send({type:'settings',mode:state.habitat.mode==='quiet'?'lively':'quiet',theme:state.habitat.theme});});
$('theme').addEventListener('change',()=>{if(state)send({type:'settings',theme:$('theme').value,mode:state.habitat.mode});});
$('art-style').addEventListener('change',()=>{artStyle=$('art-style').value;try{localStorage.setItem('oddlings-art-style',artStyle);}catch{}if(state)render();});
for(const id of ['pattern','job'])$(id).addEventListener('change',()=>send({type:'customize',pattern:$('pattern').value,job:$('job').value}));
for(const [button,dialog] of [['settings-open','settings'],['details-open','details'],['gallery-open','gallery']])$(button).addEventListener('click',()=>$(dialog).showModal());
for(const b of document.querySelectorAll('[data-close]'))b.addEventListener('click',()=>$(b.dataset.close).close());
$('snapshot').addEventListener('click',snapshot);
$('export-save').addEventListener('click',()=>{if(state)download(new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),'little-oddlings-save.json');});
await send();
setInterval(()=>{if(!busy&&!drag&&!document.hidden)send();},2000);
// The periodic refresh reads the latest save without a cross-tab storage-event loop.
document.addEventListener('visibilitychange',()=>{if(!document.hidden)send();});

const copycatLayer=document.createElement('div');
copycatLayer.className='copycat-scene';
copycatLayer.hidden=true;
$('habitat').append(copycatLayer);
function drawCopycat(){
  const leader=state?.creatures.find(friend=>friend.activity==='copycat-leader');
  const watcher=state?.creatures.find(friend=>friend.activity==='copycat-watcher');
  const active=leader&&watcher&&leader.activityUntil>Date.now()&&!arranging&&state.habitat.mode!=='quiet';
  copycatLayer.hidden=!active;
  for(const [id,node] of residentNodes)node.classList.toggle('copycat-hidden',Boolean(active&&(id===leader.id||id===watcher.id)));
  const cushion=objectNodes.get('cushion');
  cushion?.classList.toggle('copycat-hidden',Boolean(active));
  if(active){
    const placed=state.habitat.objects.find(object=>object.id==='cushion');
    copycatLayer.style.left=`${Math.max(35,Math.min(65,placed.x))}%`;
    copycatLayer.style.top=`${Math.max(40,Math.min(70,placed.y))}%`;
    copycatLayer.innerHTML=renderCopycat(leader,watcher,10-(leader.activityUntil-Date.now())/1000,reducedPlay.matches);
  }
  requestAnimationFrame(drawCopycat);
}
requestAnimationFrame(drawCopycat);
