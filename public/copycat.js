import {cartoonCreatureSVG} from './cartoon.js';
import {objectSVG} from './objects.js';
import {PERSONALITIES} from './core/content.js';
const ease = value => { const t = Math.max(0, Math.min(1, value)); return t*t*(3-2*t); };
export function copycatPose(watcher, seconds, reduced = false) {
  const settle = ease((seconds-1)/2);
  const response = ease((seconds-3.5)/2);
  const release = ease((seconds-7)/2);
  const surprise = watcher === 'moss' ? Math.sin(response*Math.PI)*28 : 0;
  return {
    leaderScale: 1-.27*settle+.15*release,
    watcherScale: watcher === 'moss' ? 1-.4*response+.25*release : 1-.15*response,
    watcherX: reduced ? 420 : 420-(watcher === 'pip' ? 60 : 32)*response,
    cushionX: 205+(reduced ? 0 : (watcher === 'moss' ? 110 : watcher === 'pip' ? 145 : 25)*response),
    jump: reduced ? 0 : surprise,
    leaderLook: seconds>6 ? 13 : -8,
    watcherLook: watcher === 'pip' && seconds<5 ? 15 : -12
  };
}
export function renderCopycat(leader, watcher, seconds, reduced) {
  const pose = copycatPose(watcher.id, seconds, reduced);
  const creature = (friend, x, y, scale, look, expression) => {
    const color = PERSONALITIES.find(person => person.id === friend.id).color;
    return `<g transform="translate(${x} ${y}) scale(${1/scale} ${scale})"><svg x="-95" y="-130" width="190" height="130" viewBox="0 0 320 220">${cartoonCreatureSVG({...friend,look,expression},color,`copy-${friend.id}`).replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'')}</svg></g>`;
  };
  return `<svg viewBox="0 0 600 260" aria-hidden="true"><svg x="${pose.cushionX-60}" y="173" width="120" height="70" viewBox="0 0 140 100">${objectSVG('cushion').replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'')}</svg>${creature(leader,190,205,pose.leaderScale,pose.leaderLook,seconds>6?'curious':'sleepy')}${creature(watcher,pose.watcherX,205-pose.jump,pose.watcherScale,pose.watcherLook,watcher.id==='pip'?'curious':'happy')}</svg>`;
}
