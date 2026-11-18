import {cartoonCreatureSVG} from '../cartoon.js';

// All five sticks have the same chance of being drawn.
const lots = [
  {label:'大吉', lucky:true}, {label:'中吉', lucky:true}, {label:'小吉', lucky:true},
  {label:'小凶', lucky:false}, {label:'大凶', lucky:false}
];

export function drawFortune(creature, reduced, random = Math.random) {
  const lot = lots[Math.floor(random() * lots.length)];
  return {
    ...lot, creature, reduced, duration:lot.lucky ? 8.6 : 6.7,
    cues:[{at:.2,sound:'bump'}, {at:.65,sound:'bump'}, {at:1.1,sound:'pop'},
      {at:lot.lucky ? 3.85 : 4.4,sound:lot.lucky ? 'happy' : 'nibble'},
      {at:lot.lucky ? 7.55 : 5.65,sound:'comfort'}]
  };
}

function progress(time, start, end) {
  const u = Math.max(0, Math.min(1, (time-start)/(end-start)));
  return u*u*(3-2*u);
}

// The stick's lower tip is the anchor throughout the draw, orbit and bite.
export function fortuneFrame(scene, t) {
  const lift = progress(t,.78,1.55);
  const frame = {
    x:244, y:178-62*lift, tilt:0, scale:.6+.4*lift, eaten:0,
    behind:t<1.3, cupTilt:0, face:'curious', chew:0, glimmer:0,
    cupOpacity:1-progress(t,2.95,3.6), stickOpacity:1
  };
  if (!scene.reduced && t < .78) frame.cupTilt=7*Math.sin(t*29)*Math.sin(Math.PI*t/.78);
  if (scene.reduced && t<1.55) { frame.y=116; frame.scale=1; frame.stickOpacity=0; }
  if (t<3.65) return frame;
  if (scene.lucky) {
    frame.face='happy';
    const angle=progress(t,3.65,8.05)*Math.PI*4;
    if (!scene.reduced) {
      frame.x=143+101*Math.cos(angle);
      frame.y=116-44*Math.sin(angle);
      frame.tilt=-15*Math.sin(angle);
      frame.behind=Math.sin(angle)>0;
    }
    frame.glimmer=scene.reduced ? 1 : Math.sin(angle)**2;
    frame.stickOpacity=1-progress(t,8.05,8.6);
  } else {
    const reach=progress(t,3.65,4.45);
    // Matches the mouth in the scaled pet group below.
    frame.x=244+(142.8-244)*reach;
    frame.y=116+(124.65-116)*reach;
    frame.tilt=68*reach;
    if (scene.reduced && reach>0) { frame.x=142.8; frame.y=124.65; frame.tilt=68; }
    const bite=progress(t,4.45,4.9)*26 + progress(t,5,5.55)*30;
    frame.eaten=bite;
    frame.face=t<5.55 ? 'nibble' : 'happy';
    if (!scene.reduced && t>=4.45 && t<=5.65) frame.chew=Math.sin((t-4.45)*12)**2;
  }
  return frame;
}

const cup = `<g stroke="#674943" stroke-linejoin="round" stroke-width="2">
  <ellipse cx="244" cy="184" rx="24" ry="3.5" fill="#d6cfb9" stroke="none"/>
  <g fill="#e5c994">
    <path d="m229 151-7-30q-1-4 4-4l9 34Z"/><path d="m236 149-2-38q0-4 5-3l3 41Z"/>
    <path d="m248 149 4-36q1-4 5-2l-4 39Z"/><path d="m253 149 9-28q2-4 5-1l-9 32Z"/>
  </g>
  <ellipse cx="244" cy="144" rx="22" ry="6" fill="#713f36"/>
  <path d="M222 144q19 10 44 0l-4 33q-1 8-18 8t-18-8Z" fill="#b56d56"/>
  <path d="M225 151q19 7 38 0m-36 23q17 7 34 0" fill="none" stroke="#e1b17f"/>
  <path d="m244 154 6 8-6 8-6-8Z" fill="#edc88d" stroke-width="1.4"/>
  </g>`;

export function mountFortune(stage, scene) {
  const ink=scene.lucky?'#8b4c39':'#514f65';
  const [first,second]=scene.label;
  stage.innerHTML=`<svg viewBox="0 0 300 200" aria-hidden="true">
    <defs><clipPath id="fortune-bite"><rect x="-16" y="-56" width="32" height="56"/></clipPath></defs>
    <g data-back></g><g data-pet transform="translate(10 -4) scale(.83)"></g>
    <g data-front></g><g data-cup>${cup}</g>
    <g data-stick><g clip-path="url(#fortune-bite)">
      <path d="M-11 -55q11-2 22 0v48L0 0l-11-7Z" fill="#ffedc3" stroke="#735842" stroke-width="1.7"/>
      <path d="M-8-51H8M-4-6h8" stroke="#bb8060" stroke-width="1.5"/>
      <text text-anchor="middle" fill="${ink}" font-size="19" font-weight="600" font-family="Songti TC, Noto Serif CJK TC, serif">
        <tspan x="0" y="-30">${first}</tspan><tspan x="0" y="-10">${second}</tspan>
      </text></g></g>
    <g data-glimmer fill="#ebcc86" stroke="#a98353" stroke-width="1"><path d="m55 78 2 5 5 2-5 2-2 5-2-5-5-2 5-2Zm159-15 1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5Z"/></g>
    </svg>`;
  const part=name=>stage.querySelector(`[data-${name}]`);
  const pet=part('pet'), stick=part('stick'), back=part('back'), front=part('front');
  const bamboo=part('cup'),glimmer=part('glimmer'),clip=stage.querySelector('clipPath rect');
  let expression='';
  return time=>{
    const pose=fortuneFrame(scene,time);
    if (pose.face!==expression) {
      expression=pose.face;
      pet.innerHTML=cartoonCreatureSVG({...scene.creature,mood:'content',costume:'fortune',expression},
        scene.creature.color,'fortune-pet').replace(/^<svg[^>]*>|<\/svg>$/g,'');
    }
    const layer=pose.behind?back:front;
    if (stick.parentNode!==layer) layer.append(stick);
    bamboo.setAttribute('transform',`rotate(${pose.cupTilt} 244 180)`);
    bamboo.setAttribute('opacity',pose.cupOpacity);
    stick.setAttribute('transform',`translate(${pose.x} ${pose.y}) rotate(${pose.tilt}) scale(${pose.scale}) translate(0 ${pose.eaten})`);
    stick.setAttribute('opacity',pose.stickOpacity);
    clip.setAttribute('height',56-pose.eaten);
    pet.querySelector('[data-bite-mouth]')?.setAttribute('ry',6-3*pose.chew);
    glimmer.setAttribute('opacity',pose.glimmer);
  };
}
