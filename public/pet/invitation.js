export const toyArt = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="14" fill="#ead3ac" stroke="#806d59" stroke-width="2"/><path d="M9 13q14 2 20 15M11 29q4-13 18-17" stroke="#b8c78e" stroke-width="5" fill="none"/></svg>';
export function toyPose(elapsed, nudgedAt = null, reduced = false) {
  const smooth = value => {const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
  if(nudgedAt !== null){
    const t=(elapsed-nudgedAt)/1000;
    return {phase:t<3?'playing':'done',position:reduced?.65:.65-.45*Math.sin(Math.min(1,t/3)*Math.PI),done:t>=3};
  }
  if(elapsed<1200)return {phase:'offering',position:reduced?.65:.65*smooth(elapsed/1200),done:false};
  if(elapsed<9200)return {phase:'waiting',position:.65,done:false};
  return {phase:elapsed<11200?'retrieving':'done',position:reduced?0:.65*(1-smooth((elapsed-9200)/2000)),done:elapsed>=11200};
}
export function installToyInvitation({surface,trigger,eligible,sound,settle,reduced}) {
  const ball=document.createElement('button');
  ball.className='invitation-ball';ball.hidden=true;ball.innerHTML=toyArt;
  ball.setAttribute('aria-label','Nudge the toy back');surface.append(ball);
  trigger.innerHTML=toyArt;
  let started=null,nudgedAt=null,nextAt=performance.now()+45000;
  const cancel=()=>{started=null;nudgedAt=null;ball.hidden=true;nextAt=performance.now()+180000;};
  function start(now){if(started!==null||!eligible())return;started=now;nudgedAt=null;ball.hidden=false;sound('crawl');}
  trigger.addEventListener('click',()=>start(performance.now()));
  ball.addEventListener('click',()=>{if(started===null||nudgedAt!==null)return;nudgedAt=performance.now()-started;sound('happy');});
  return {
    get active(){return started!==null;},
    phase:'',
    cancel,
    update(now,canInvite){
      if(!eligible()){if(started!==null)cancel();this.phase='';return;}
      if(started===null&&canInvite&&now>=nextAt)start(now);
      if(started===null){this.phase='';return;}
      const pose=toyPose(now-started,nudgedAt,reduced.matches);
      this.phase=pose.phase;
      ball.style.left=`${50+pose.position*30}%`;
      ball.style.transform=`translate(-50%,0) rotate(${reduced.matches?0:pose.position*360}deg)`;
      if(pose.done){const ignored=nudgedAt===null;cancel();this.phase='';if(ignored)settle();}
    }
  };
}
