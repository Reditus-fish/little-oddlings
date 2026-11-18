import { cartoonCreatureSVG } from './cartoon.js';
const $ = id => document.getElementById(id);
let state, personalities, busy = false, lastMessage = '', lastFamily = '', lastCreature = '';
let requestChain = Promise.resolve();
let artStyle = 'cartoon';
try { if (localStorage.getItem('oddlings-art-style') === 'soft') artStyle = 'soft'; } catch {}
document.body.dataset.art = artStyle;
$('art-style').value = artStyle;
const escape = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

function creatureSVG(c, color, unique = 'main') {
  if (artStyle === 'cartoon') return cartoonCreatureSVG(c, color, unique);
  return softCreatureSVG(c, color, unique);
}
function softCreatureSVG(c, color, unique = 'main') {
  const sad = ['overwhelmed','cracked'].includes(c.mood), sleepy = ['sleepy','recovering'].includes(c.mood);
  const spots = c.pattern === 'stripes' ? '<path d="M105 44Q145 87 122 158M160 27Q196 80 176 166M215 45Q246 101 227 158" stroke="#fff" stroke-opacity=".3" stroke-width="18" fill="none"/>' : Array.from({length:12},(_,i)=>`<ellipse cx="${65+(i*37)%190}" cy="${65+(i*23)%85}" rx="${c.pattern==='spots'?9:3.5}" ry="${c.pattern==='spots'?7:3}" fill="#bf896c" opacity=".27"/>`).join('');
  const hat = c.job === 'gardener' ? '<path d="M170 49Q183 20 185 6" fill="none" stroke="#688c56" stroke-width="4"/><path d="M183 27Q150 29 158 8Q185 7 183 27M184 18Q191 -4 212 8Q206 28 184 18" fill="#92ae73"/>' : c.job === 'chef' ? '<path d="M135 49L131 15Q111 10 119 -5Q125 -19 141 -9Q148 -27 168 -16Q184 -22 193 -9Q208 7 189 18L184 48Z" fill="#fffcf1" stroke="#e6ddc8" stroke-width="2"/>' : c.job === 'intern' ? '<path d="M161 139L172 145L165 157L173 178L158 186L148 174L157 154L151 145Z" fill="#85768e"/><path d="M141 142L151 157L162 146L173 157L184 140" fill="#fff9e9"/>' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" role="img" aria-label="A soft one-eyed egg creature, ${c.mood}"><defs><radialGradient id="shell-${unique}" cx="38%" cy="27%" r="75%"><stop stop-color="#fff9e8"/><stop offset=".65" stop-color="${color}"/><stop offset="1" stop-color="#bdab92"/></radialGradient><radialGradient id="iris-${unique}" cx="35%" cy="30%"><stop stop-color="#817752"/><stop offset="1" stop-color="#403b2e"/></radialGradient><clipPath id="body-${unique}"><path d="M42 148C37 112 65 63 102 43C134 25 173 25 206 43C251 63 279 113 280 148C282 178 246 184 161 185C89 186 46 178 42 148Z"/></clipPath></defs><ellipse cx="160" cy="185" rx="115" ry="12" fill="#7b7352" opacity=".12"/><path d="M42 148C37 112 65 63 102 43C134 25 173 25 206 43C251 63 279 113 280 148C282 178 246 184 161 185C89 186 46 178 42 148Z" fill="url(#shell-${unique})" stroke="#d2bf9f" stroke-width="1.4"/><g clip-path="url(#body-${unique})">${spots}<path d="M42 92L61 88L75 96L86 89L100 97L115 90M192 78L206 87L219 80L237 92L252 86L267 99" fill="none" stroke="#c7ac8c" opacity=".45" stroke-width="2"/></g><ellipse cx="158" cy="112" rx="42" ry="46" fill="#fbf3de" stroke="#c6b59c" stroke-width="3"/><ellipse cx="159" cy="115" rx="28" ry="32" fill="url(#iris-${unique})"/><ellipse cx="159" cy="117" rx="18" ry="23" fill="#292c25"/><ellipse cx="148" cy="103" rx="9" ry="11" fill="#fff" opacity=".88"/><circle cx="170" cy="126" r="4" fill="#fff" opacity=".3"/>${sleepy?`<path d="M116 110Q112 63 158 65Q200 67 199 110Z" fill="${color}" stroke="#c6b59c" stroke-width="2"/>`:''}${sad?'<path d="M119 81Q133 90 145 83M172 83Q187 90 199 80" fill="none" stroke="#9a8062" stroke-width="3" stroke-linecap="round"/><path d="M125 140Q103 164 116 171Q135 177 132 158Z" fill="#9bc9dc" opacity=".9"/><path d="M191 145Q178 164 191 169Q205 168 197 154Z" fill="#9bc9dc" opacity=".9"/>':''}<ellipse cx="101" cy="143" rx="12" ry="6" fill="#df9b83" opacity=".45"/><ellipse cx="214" cy="143" rx="12" ry="6" fill="#df9b83" opacity=".45"/>${c.mood==='cracked'?'<path d="M181 32L174 45L187 59L180 73M240 92L225 111L241 130L229 145L238 174" fill="none" stroke="#9b7c61" stroke-width="4" stroke-linejoin="round"/>':''}${hat}${c.mood==='recovering'?'<path d="M40 156Q91 136 160 165Q225 145 282 156L279 179Q172 203 44 181Z" fill="#a9c5ac"/><path d="M48 163Q98 143 159 173Q227 152 276 163" stroke="#e6edde" stroke-width="9" fill="none"/><path d="M207 74L226 94M225 75L208 94" stroke="#edc274" stroke-width="9" stroke-linecap="round"/>':''}</svg>`;
}
function render() {
  const c = state.creatures.find(c => c.id === state.selected), p = personalities.find(p => p.id === c.id);
  $('name').textContent = p.name; $('personality').textContent = p.title; $('description').textContent = p.description;
  $('profile-number').textContent = `0${personalities.indexOf(p)+1}`;
  const creatureKey = JSON.stringify([artStyle, c.id, c.mood, c.pattern, c.job]);
  if (creatureKey !== lastCreature) {
    $('creature').innerHTML = creatureSVG(c,p.color);
    $('creature').className = `creature ${c.mood}`;
    lastCreature = creatureKey;
  }
  $('creature').disabled = false;
  $('creature').setAttribute('aria-label',`Gently pet ${p.name}`);
  $('mood').textContent = c.recoverAt ? `${c.mood==='cracked'?'A LITTLE CRACKED':'MENDING SOFTLY'} · ${Math.max(1,Math.ceil((c.recoverAt-Date.now())/1000))}s` : ({content:'FEELING AT HOME',overwhelmed:'A LITTLE OVERWHELMED',sleepy:'EXPERTLY DOING NOTHING'}[c.mood] || c.mood);
  const message = state.log[0]?.text || 'Hello, little one.';
  if (message!==lastMessage) { $('bubble').textContent=message; lastMessage=message; }
  $('stats').innerHTML = [['bond','Feeling loved','♡'],['fullness','Tiny tummy','◒'],['energy','Social battery','☼'],['stress','Too much attention','⌁']].map(([k,label,icon]) => `<div class="stat ${k}"><div class="stat-label"><span>${icon} ${label}</span><span>${Math.round(c[k])}%</span></div><div class="track" role="progressbar" aria-label="${label}" aria-valuenow="${Math.round(c[k])}" aria-valuemin="0" aria-valuemax="100"><div class="fill" style="width:${c[k]}%"></div></div></div>`).join('');
  $('pattern').value=c.pattern; $('job').value=c.job;
  $('care-hint').textContent = state.care<3?`${3-state.care} more care moments to welcome Moss. One credit every 3 seconds.`:state.care<7?`${7-state.care} more care moments to welcome Pip. One credit every 3 seconds.`:'Everyone is home. Keep discovering their little quirks.';
  const familyKey = JSON.stringify([artStyle,state.selected,state.creatures.map(c=>[c.unlocked,c.job,c.pattern])]);
  if (familyKey!==lastFamily) {
    $('family').innerHTML = state.creatures.map((x,i)=>`<button class="family-card ${x.id===c.id?'selected':''} ${x.unlocked?'':'locked'}" ${x.unlocked?'':'disabled'} data-id="${x.id}" aria-label="${x.unlocked?'Select':'Locked'} ${personalities[i].name}"><div class="mini">${creatureSVG({...x,mood:'content'},x.unlocked?personalities[i].color:'#d8d9c6',`mini-${i}`)}</div><strong>${personalities[i].name}${x.unlocked?'':' · ◇'}</strong><small>${x.unlocked?['A little overthinker','A friendly menace','A quiet radical'][i]:`${i===1?3:7} care moments to unlock`}</small></button>`).join('');
    lastFamily=familyKey;
  }
  $('family-count').textContent=`${state.creatures.filter(c=>c.unlocked).length} / 3 AT HOME`;
  $('discovery-count').textContent=`${state.discoveries.length} DISCOVERIES`;
  $('journal').innerHTML=state.log.slice(0,4).map(e=>`<li>${escape(e.text)}</li>`).join('');
  $('care-count').textContent=state.care;
}
async function request(action) {
  busy=true; $('save-status').textContent=action?'Saving…':'Checking in…';
  try {
    const res=await fetch(action?'/api/action':'/api/state',action?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(action)}:{});
    const data=await res.json(); if(!res.ok) throw new Error(data.error||'Something went wrong.');
    state=data.state; personalities=data.personalities; render(); $('error').hidden=true; $('save-status').textContent='● Saved on this computer';
    if(action && ['pet','feed','comfort','play','rest'].includes(action.type)) {
      if(action.type==='pet') {
        $('creature').classList.remove('pat');
        void $('creature').offsetWidth;
        $('creature').classList.add('pat');
        setTimeout(() => $('creature').classList.remove('pat'), 450);
      }
      $('reaction').textContent=({pet:state.creatures.find(c=>c.id===state.selected).stress>48?'…':'♡',feed:'◒',comfort:'♡',play:'✦',rest:'z z'})[action.type];
      $('reaction').classList.remove('pop'); void $('reaction').offsetWidth; $('reaction').classList.add('pop');
    }
  } catch(e) { $('error').textContent=`${e.message} Your last saved progress is safe. If the server stopped, restart npm start.`; $('error').hidden=false; $('save-status').textContent='Not connected'; }
  finally {busy=false;}
}
function send(action){requestChain=requestChain.then(()=>request(action));return requestChain;}
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>send({type:b.dataset.action})));
$('creature').addEventListener('click',()=>send({type:'pet'}));
$('family').addEventListener('click',e=>{const b=e.target.closest('[data-id]');if(b&&!b.disabled)send({type:'select',id:b.dataset.id});});
for(const id of ['pattern','job']) $(id).addEventListener('change',()=>send({type:'customize',pattern:$('pattern').value,job:$('job').value}));
$('art-style').addEventListener('change', () => {
  artStyle = $('art-style').value;
  document.body.dataset.art = artStyle;
  try { localStorage.setItem('oddlings-art-style', artStyle); } catch {}
  if (state) render();
});
$('open-art').addEventListener('click',()=>$('art-dialog').showModal());
$('close-art').addEventListener('click',()=>$('art-dialog').close());
$('share').addEventListener('click',async()=>{
  if(!state)return;
  const c=state.creatures.find(c=>c.id===state.selected),p=personalities.find(p=>p.id===c.id);
  const svg=creatureSVG(c,p.color,'postcard');
  const card=`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="750" viewBox="0 0 1000 750"><rect width="1000" height="750" rx="32" fill="#f7f4ec"/><text x="60" y="80" font-family="Georgia" font-size="30" fill="#516d57">little oddlings.</text><text x="60" y="155" font-family="Georgia" font-size="52" fill="#33473d">Meet ${escape(p.name)}.</text><text x="60" y="195" font-family="Arial" font-size="20" fill="#7c8377">${escape(p.title)}</text><svg x="180" y="210" width="640" height="440" viewBox="0 0 320 220">${svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'')}</svg><text x="60" y="705" font-family="Georgia" font-size="25" fill="#516d57">A little odd. A lot to love. · Nurture Game</text></svg>`;
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([card],{type:'image/svg+xml'}));a.download=`${p.name.toLowerCase()}-postcard.svg`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),5000);
  $('share').textContent='Postcard saved ♡';setTimeout(()=>$('share').textContent='Save a little postcard ↗',2500);
});
await send();
setInterval(()=>{if(!busy&&!document.hidden)send();},2000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)send();});
