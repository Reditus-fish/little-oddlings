import { PERSONALITIES, PATTERNS, JOBS, OBJECTS, AMBIENT_LINES } from './content.js';
export { PERSONALITIES, PATTERNS, JOBS, OBJECTS } from './content.js';
const clamp = x => Math.max(0, Math.min(100, x));
const bound = (v, min, max) => Math.max(min, Math.min(max, v));
const positions = [{x:26,y:71},{x:53,y:59},{x:75,y:75}];

export function createState(now = Date.now()) {
  return {
    version:2, updatedAt:now, selected:'miso', care:0,
    discoveries:['A little hello'], log:[{text:'Three little oddlings. One very unhurried afternoon.',at:now}],
    habitat:{mode:'lively',theme:'garden',lastAmbientAt:now,objects:OBJECTS.map(({id,x,y})=>({id,x,y}))},
    creatures:PERSONALITIES.map((p,i)=>({id:p.id,unlocked:true,stress:0,fullness:70,bond:10,energy:85,mood:'content',recoverAt:null,lastCareAt:null,lastTouchAt:null,pattern:p.pattern,job:p.job,...positions[i],activity:null,activityUntil:null}))
  };
}

export function migrateState(input, now = Date.now()) {
  if(input?.version!==1) return structuredClone(input);
  // Validate the old shape before upgrading. Damaged saves are handled by storage.
  if(!validLegacy(input)) throw new Error('Invalid legacy save.');
  const next=createState(now);
  for(const key of ['updatedAt','selected','care','discoveries','log']) next[key]=structuredClone(input[key]);
  next.creatures=input.creatures.map((c,i)=>({...next.creatures[i],...c,unlocked:true}));
  note(next,'Welcome to the little habitat. All three friends can now keep you company.',now);
  return next;
}
function note(s,text,now){if(s.log[0]?.text===text)return;s.log.unshift({text,at:now});s.log=s.log.slice(0,12);}
function discover(s,text){if(!s.discoveries.includes(text))s.discoveries.push(text);}
function care(s,c,now){if(c.lastCareAt===null||now-c.lastCareAt>=3000){s.care++;c.lastCareAt=now;}}

export function advance(input, now = Date.now(), {ambient=false} = {}) {
  const s=structuredClone(input);
  const elapsed=Math.min(8*3600,Math.max(0,now-s.updatedAt)/1000);
  const period=s.habitat.mode==='quiet'?25000:9000;
  const step=Math.floor(now/period), moved=step>Math.floor(s.updatedAt/period);
  for(const [i,c] of s.creatures.entries()){
    c.stress=clamp(c.stress-elapsed*0.8);
    c.energy=clamp(c.energy+elapsed*0.4);
    // No absence penalty: the pet is fine whether you return in an hour or a month.
    if(c.recoverAt!==null){
      if(now>=c.recoverAt){c.recoverAt=null;c.stress=Math.min(c.stress,15);c.mood='content';discover(s,'A little cracked. Still very loved.');note(s,`${PERSONALITIES[i].name} is all soft and whole again.`,now);}
      else if(c.recoverAt-now<=18000)c.mood='recovering';
    } else if(c.activityUntil!==null&&now<c.activityUntil&&c.activity==='cushion')c.mood='sleepy';
    else c.mood=c.stress>=48?'overwhelmed':c.energy<40?'sleepy':'content';
    if(c.activityUntil!==null&&now>=c.activityUntil){c.activity=null;c.activityUntil=null;}
    if(moved&&c.activity===null&&c.recoverAt===null){
      c.x=bound(c.x+Math.sin(step*1.7+i*2.4)*11,14,86);
      c.y=bound(c.y+Math.cos(step*1.3+i*2.4)*5,48,82);
    }
  }
  if(ambient&&now-s.habitat.lastAmbientAt>=18000){
    // One small moment, never a backlog of notifications after returning.
    if(s.habitat.mode==='lively'&&now-s.updatedAt<60000){
      const i=Math.floor(now/18000)%3,c=s.creatures[i];
      if(c.recoverAt===null&&c.activity===null)note(s,AMBIENT_LINES[c.id][Math.floor(now/54000)%2],now);
    }
    s.habitat.lastAmbientAt=now;
  }
  s.updatedAt=Math.max(s.updatedAt,now);
  return s;
}

export function snackFriends(state, now = Date.now(), guest) {
  const eligible = state.creatures.filter(c => c.recoverAt === null && c.mood === 'content' && c.activity === null &&
    (c.lastCareAt === null || now - c.lastCareAt >= 8000))
    .sort((a, b) => Number(b.id === state.selected) - Number(a.id === state.selected));
  if (guest === undefined) return eligible.slice(0,2);
  const pair = eligible.filter(c => c.id === state.selected || c.id === guest);
  return pair.length === 2 ? pair : [];
}

export function act(input, action, now = Date.now()){
  if(!action||typeof action.type!=='string')throw new Error('An action type is required.');
  const s=advance(input,now),c=s.creatures.find(c=>c.id===s.selected),p=PERSONALITIES.find(p=>p.id===c.id);
  if(action.type==='select'){
    if(!s.creatures.some(c=>c.id===action.id&&c.unlocked))throw new Error('That creature is not available.');
    s.selected=action.id;return s;
  }
  if(action.type==='settings'){
    if(!['quiet','lively'].includes(action.mode)||!['garden','bedroom'].includes(action.theme))throw new Error('Unknown habitat setting.');
    s.habitat.mode=action.mode;s.habitat.theme=action.theme;s.habitat.lastAmbientAt=now;return s;
  }
  if(action.type==='move-object'){
    const object=s.habitat.objects.find(o=>o.id===action.id);
    if(!object||!Number.isFinite(action.x)||!Number.isFinite(action.y)||action.x<8||action.x>92||action.y<36||action.y>84)throw new Error('Place objects inside the habitat.');
    object.x=action.x;object.y=action.y;return s;
  }
  if(action.type==='customize'){
    if(!PATTERNS.includes(action.pattern)||!JOBS.includes(action.job))throw new Error('Unknown pattern or accessory.');
    c.pattern=action.pattern;c.job=action.job;return s;
  }
  if(action.type==='share-snack') {
    if(!Number.isFinite(action.x)||!Number.isFinite(action.y)||action.x<24||action.x>76||action.y<52||action.y>76)
      throw new Error('Place the snack inside the habitat.');
    const pair=snackFriends(s,now,action.guest);
    // Two willing participants or no change: never wake or pull a resting friend.
    if(pair.length<2)return s;
    pair.forEach((friend,i)=>{
      friend.x=action.x+(i===0?-9:9);friend.y=action.y;
      friend.activity='share-snack';friend.activityUntil=now+7000;
      friend.fullness=clamp(friend.fullness+10);friend.bond=clamp(friend.bond+2);
      friend.lastCareAt=now;
    });
    s.care++;discover(s,'One tiny snack, two happy friends');
    note(s,'A little snack, shared together.',now);return s;
  }
  if(action.type==='playdate'){
    if(c.recoverAt!==null||c.mood==='sleepy'||c.stress>=48){note(s,`${p.name} would like a quiet moment first.`,now);return s;}
    if(c.activity==='playdate'){note(s,'They are already sharing a little moment.',now);return s;}
    const friend=s.creatures.find(f=>f.id!==c.id&&f.recoverAt===null&&f.mood!=='sleepy'&&f.stress<48&&f.activity===null);
    if(!friend){note(s,'The others are resting or busy. Friendship can wait.',now);return s;}
    const center=bound((c.x+friend.x)/2,24,76),ground=bound((c.y+friend.y)/2,50,79);
    c.x=center-9;friend.x=center+9;c.y=friend.y=ground;
    for(const participant of [c,friend]){participant.activity='playdate';participant.activityUntil=now+6000;participant.bond=clamp(participant.bond+3);}
    const pair=[c.id,friend.id].sort().join('-');
    const lines={'miso-moss':'Moss invited Miso to a tiny hop. Miso asked for an agenda.','miso-pip':'Miso proposed one little hop. Pip submitted a counter-bounce.','moss-pip':'Moss said a small celebration. Pip brought an imaginary parade.'};
    note(s,lines[pair],now);discover(s,'A little moment, together');care(s,c,now);return s;
  }
  if(action.type==='copycat'){
    if(s.habitat.mode==='quiet'||s.creatures.some(friend=>friend.activity?.startsWith('copycat-')))return s;
    const available=friend=>friend.mood==='content'&&friend.recoverAt===null&&friend.activity===null;
    if(!available(c))return act(s,{type:'interact',id:'cushion'},now);
    const cushion=s.habitat.objects.find(object=>object.id==='cushion');
    const watcher=s.creatures.filter(friend=>friend.id!==c.id&&available(friend))
      .sort((a,b)=>Math.hypot(a.x-cushion.x,a.y-cushion.y)-Math.hypot(b.x-cushion.x,b.y-cushion.y))[0];
    if(!watcher)return act(s,{type:'interact',id:'cushion'},now);
    c.activity='copycat-leader';watcher.activity='copycat-watcher';
    c.activityUntil=watcher.activityUntil=now+10000;
    discover(s,`${p.name} and ${PERSONALITIES.find(person=>person.id===watcher.id).name}: cushion copycats`);
    note(s,`${PERSONALITIES.find(person=>person.id===watcher.id).name} is watching ${p.name}'s cushion routine.`,now);
    return s;
  }
  if(action.type==='interact'){
    const item=OBJECTS.find(o=>o.id===action.id),placed=s.habitat.objects.find(o=>o.id===action.id);
    if(!item)throw new Error('Unknown object.');
    if(c.recoverAt!==null&&item.id!=='cushion'&&item.id!=='snack'){note(s,'A quiet moment first. The cushion will help.',now);return s;}
    c.x=bound(placed.x-6,12,88);c.y=bound(placed.y+6,44,86);c.activity=item.id;c.activityUntil=now+12000;
    c.bond=clamp(c.bond+4);
    if(item.effect==='rest'){c.energy=clamp(c.energy+15);c.stress=clamp(c.stress-30);c.mood=c.recoverAt?'recovering':'sleepy';if(c.recoverAt)c.recoverAt=Math.min(c.recoverAt,now+6000);}
    if(item.effect==='feed'){c.fullness=clamp(c.fullness+20);}
    if(item.effect==='play'){c.energy=clamp(c.energy-8);}
    if(item.effect==='focus'){c.stress=clamp(c.stress-12);}
    if(item.effect==='gather'){
      s.creatures.forEach((friend,i)=>{if(friend.recoverAt===null){friend.x=bound(placed.x-21+i*13,12,88);friend.y=bound(placed.y+6+(i%2)*4,44,86);friend.activity='bell';friend.activityUntil=now+12000;}});
      discover(s,'The smallest gathering in the world');
    }
    discover(s,`${p.name} × ${item.name}`);note(s,item.lines[c.id],now);care(s,c,now);return s;
  }
  if(!['pet','feed','comfort','rest','play'].includes(action.type))throw new Error('Unknown action.');
  if(c.recoverAt!==null&&['pet','play'].includes(action.type)){note(s,'A little space, please. Try a blanket or the cushion.',now);return s;}
  if(action.type==='pet'){
    const rapid=c.lastTouchAt!==null&&now-c.lastTouchAt<3500;
    c.stress=clamp(c.stress+(rapid?25:10));c.lastTouchAt=now;
    if(c.stress>=90){c.mood='cracked';c.recoverAt=now+30000;note(s,'A tiny cartoon crack. A little rest will make everything soft again.',now);}
    else if(c.stress>=48){c.mood='overwhelmed';note(s,'My social battery is now a single raisin. A little space?',now);}
    else {c.bond=clamp(c.bond+3);note(s,p.lines.pet,now);}
  }else if(action.type==='feed'){c.fullness=clamp(c.fullness+20);c.bond=clamp(c.bond+2);note(s,p.lines.feed,now);}
  else if(action.type==='comfort'){
    c.stress=clamp(c.stress-35);c.bond=clamp(c.bond+4);
    if(c.recoverAt!==null){c.mood='recovering';c.recoverAt=Math.min(c.recoverAt,now+6000);}else c.mood='content';
    note(s,p.lines.comfort,now);
  }else if(action.type==='rest'){
    c.energy=clamp(c.energy+15);c.stress=clamp(c.stress-20);c.activity='cushion';c.activityUntil=now+12000;
    if(c.recoverAt!==null){c.mood='recovering';c.recoverAt=Math.min(c.recoverAt,now+10000);}else c.mood='sleepy';
    note(s,'Currently pursuing a masters in lying flat.',now);
  }else{c.energy=clamp(c.energy-12);c.bond=clamp(c.bond+6);discover(s,`${p.name}: a very strange playdate`);note(s,p.lines.play,now);}
  if(action.type!=='pet')care(s,c,now);
  return s;
}

function commonValid(s){
  return Number.isFinite(s?.updatedAt)&&Number.isInteger(s.care)&&s.care>=0&&Array.isArray(s.creatures)&&s.creatures.length===3&&
    s.creatures.every((c,i)=>c&&c.id===PERSONALITIES[i].id&&typeof c.unlocked==='boolean'&&
      ['stress','fullness','bond','energy'].every(k=>Number.isFinite(c[k])&&c[k]>=0&&c[k]<=100)&&
      ['content','sleepy','overwhelmed','cracked','recovering'].includes(c.mood)&&
      ['recoverAt','lastTouchAt','lastCareAt'].every(k=>c[k]===null||Number.isFinite(c[k]))&&PATTERNS.includes(c.pattern)&&JOBS.includes(c.job))&&
    s.creatures.some(c=>c.id===s.selected&&c.unlocked)&&Array.isArray(s.discoveries)&&s.discoveries.length<=80&&s.discoveries.every(x=>typeof x==='string'&&x.length<=250)&&
    Array.isArray(s.log)&&s.log.length<=12&&s.log.every(x=>x&&typeof x.text==='string'&&x.text.length<=500&&Number.isFinite(x.at));
}
function validLegacy(s){return s?.version===1&&commonValid(s);}
export function validState(s){
  return s?.version===2&&commonValid(s)&&['quiet','lively'].includes(s.habitat?.mode)&&['garden','bedroom'].includes(s.habitat?.theme)&&Number.isFinite(s.habitat.lastAmbientAt)&&
    Array.isArray(s.habitat.objects)&&s.habitat.objects.length===5&&new Set(s.habitat.objects.map(o=>o?.id)).size===5&&
    s.habitat.objects.every(o=>o&&OBJECTS.some(item=>item.id===o.id)&&Number.isFinite(o.x)&&o.x>=8&&o.x<=92&&Number.isFinite(o.y)&&o.y>=36&&o.y<=84)&&
    s.creatures.every(c=>Number.isFinite(c.x)&&c.x>=12&&c.x<=88&&Number.isFinite(c.y)&&c.y>=44&&c.y<=86&&(c.activity===null||['copycat-leader','copycat-watcher'].includes(c.activity)||c.activity==='playdate'||c.activity==='share-snack'||OBJECTS.some(o=>o.id===c.activity))&&(c.activityUntil===null||Number.isFinite(c.activityUntil)));
}
