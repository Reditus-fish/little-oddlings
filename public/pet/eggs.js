import {cartoonCreatureSVG} from '../cartoon.js';
import {emotionEffectSVG} from './emotion.js';
import {PERSONALITIES} from '../core/content.js';

export const EGG_FOR_FRIEND = {moss:'fizz',pip:'kettle',miso:'cloud'};
const CAST = {fizz:['moss','pip'],kettle:['pip','miso'],cloud:['miso','moss']};
export const FIZZY_BEAD = '<g fill="#f9f9df" stroke="#7a9e77" stroke-width="1.8"><circle cx="53" cy="7" r="3"/><circle cx="65" cy="5" r="2"/><circle cx="72" cy="14" r="3.5"/><path d="M55 17q6-6 11 0q-5 5-11 0Z" fill="#c8e9ad"/></g>';

const clamp = (value, min, max) => Math.min(max, Math.max(min,value));
const mix = (a,b,f) => a+(b-a)*clamp(f,0,1);
const pointBetween = (a,b,f) => ({x:mix(a.x,b.x,f),y:mix(a.y,b.y,f)});

export function createEgg(kind, {width,height,x=width/2,y=height*.68}, reduced=false, random=Math.random, creatures=PERSONALITIES) {
  const size=Math.min(138,width*.40,height*.45);
  const margin=Math.min(size*.62+5,width*.48,height*.48);
  const bounds={left:margin,right:width-margin,top:margin,bottom:height-margin};
  const center={x:clamp(x,bounds.left,bounds.right),y:clamp(y,bounds.top,bounds.bottom)};
  const side=center.x>width*.56?-1:1;
  const start={x:clamp(center.x-side*size*.39,bounds.left,bounds.right),y:center.y};
  const other={x:clamp(center.x+side*size*.53,bounds.left,bounds.right),y:center.y};
  const hits=[];
  if(kind==='fizz'&&!reduced){
    let cursor=start,dx=side,dy=-.65-random()*.5;
    for(let i=0;i<3;i++){
      const toX=((dx>0?bounds.right:bounds.left)-cursor.x)/dx;
      const toY=((dy>0?bounds.bottom:bounds.top)-cursor.y)/dy;
      const distance=Math.min(toX,toY);
      const hitX=toX<=toY,hitY=toY<=toX;
      const next={x:clamp(cursor.x+dx*distance,bounds.left,bounds.right),
        y:clamp(cursor.y+dy*distance,bounds.top,bounds.bottom)};
      hits.push({...next,axis:hitX?'x':'y',distance:Math.hypot(next.x-cursor.x,next.y-cursor.y)});
      cursor=next;
      if(hitX)dx*=-1;
      if(hitY)dy*=-1;
      dy=Math.sign(dy)*(.48+random()*.75);
    }
  }
  const travel=hits.reduce((sum,hit)=>sum+hit.distance,0);
  let at=1.32;
  for(const hit of hits){at+=.22+1.62*hit.distance/(travel||1);hit.at=at;}
  const end=hits.at(-1)??start;
  const rest={x:end.x>width/2?bounds.right:bounds.left,y:bounds.bottom};
  const cast=CAST[kind].map(id=>{
    const defaults=PERSONALITIES.find(c=>c.id===id);
    return {...defaults,...creatures.find(c=>c.id===id),mood:'content'};
  });
  const cues=kind==='fizz'?[{at:.62,sound:'fizz'},...hits.map(({at})=>({at,sound:'bump'})),
    {at:reduced?1.4:4.06,sound:'pop'},{at:5.58,sound:'nibble',actor:'pip'}]
    :kind==='kettle'?[{at:2.12,sound:'nibble',actor:'miso'},{at:2.65,sound:'boil'},{at:3.80,sound:'pop'}]
    :[{at:2.75,sound:'drip',actor:'moss'},{at:4.45,sound:'happy',actor:'moss'}];
  return {kind,width,height,size,center,side,start,other,hits,rest,cast,reduced,cues,duration:kind==='fizz'?7:6};
}

export function eggFrame(scene,time) {
  const t=clamp(time,0,scene.duration);
  const {kind,center,start,other,hits,rest,side,size,reduced}=scene;
  const first={...start,expression:'curious',sx:1,sy:1,look:7*side};
  const second={...other,expression:'content',sx:1,sy:1,look:7*side};
  const frame={first,second,snack:kind!=='cloud',effect:null};
  if(kind==='fizz'){
    first.x=mix(start.x,center.x-side*size*.17,t/.62);
    if(t>=.62&&t<1.32){
      first.expression='startled';
      first.sx=1.08;first.sy=.85;
      frame.effect={kind:'fizz',x:first.x,y:first.y-size*.36};
    }
    if(t>=1.32){
      if(reduced){
        first.expression=t<2.25?'startled':'sleepy';
        if(t<2.25){first.sx=1.18;first.sy=.72;frame.effect={kind:'pop',x:first.x,y:first.y-size*.28};}
      }else{
        let previous={...start,x:center.x-side*size*.17,at:1.32};
        let next=hits.find(hit=>hit.at>t);
        for(const hit of hits){if(hit.at<=t)previous=hit;}
        if(next){Object.assign(first,pointBetween(previous,next,(t-previous.at)/(next.at-previous.at)));first.expression='startled';}
        else {Object.assign(first,pointBetween(previous,rest,(t-previous.at)/.58));first.expression='sleepy';}
        if(previous.axis&&t-previous.at<.17){
          first.sx=previous.axis==='x'?.61:1.21;first.sy=previous.axis==='y'?.56:1.19;
          frame.effect={kind:'pop',x:first.x,y:first.y-size*.35};
        }
      }
    }
    if(t>=4.65){second.x=mix(other.x,center.x+side*size*.12,(t-4.65)/.9);second.look=-7*side;}
    if(t>=5.58){second.expression='happy';frame.snack=false;}
  }else if(kind==='kettle'){
    second.look=-7*side;
    second.x=mix(other.x,center.x+side*size*.12,(t-.65)/1.47);
    if(t>=2.12){second.expression='happy';frame.snack=false;}
    if(t>=2.65&&t<4.55){
      first.expression='grumpy';first.hot=true;
      const heat=clamp((t-2.65)/1.15,0,1);
      first.sx=1.06+heat*.09;first.sy=.94-heat*.06;
      if(!reduced&&t<3.80)first.x+=Math.sin(t*91)*heat*2.8;
      frame.effect={kind:t<3.80?'steam':'ring',x:first.x,y:first.y-size*.43,scale:1+clamp((t-3.8)/.75,0,1)*.7};
      first.hat=reduced?15:Math.max(0,Math.sin(clamp((t-3.80)/.75,0,1)*Math.PI)*27);
    }
    if(t>=4.55){first.expression='startled';first.hat=-28;}
  }else{
    first.expression=t<1?'sad':'curious';
    first.x=mix(start.x,clamp(start.x-side*size*.33,scene.size*.52,scene.width-scene.size*.52),(t-.65)/1.3);
    second.expression=t<2.75?'content':t<3.5?'startled':'happy';
    if(!reduced&&t>=2.75&&t<3.3){second.x+=Math.sin(t*65)*4;second.sy=.88;}
    if(!reduced&&t>=3.3&&t<4.4)second.x+=side*Math.sin((t-3.3)/1.1*Math.PI)*size*.2;
    frame.effect={kind:'rain',x:mix(start.x,other.x,(t-1.28)/1.48),y:center.y-size*.56};
  }
  return frame;
}

const snack = '<path d="M-14 8L15-8" stroke="#8b7358" stroke-width="3" stroke-linecap="round"/><g stroke="#786450" stroke-width="1.6"><circle cx="-9" cy="5" r="6" fill="#edb6ab"/><circle cx="0" cy="0" r="6" fill="#ffe7a6"/><circle cx="10" cy="-5" r="6" fill="#bce49e"/></g>';
const illustrations={
  fizz:'<g fill="#eff9c8" stroke="#7f9d68" stroke-width="1.4"><circle cx="-12" cy="-1" r="4"/><circle cx="4" cy="-13" r="3.5"/><circle cx="15" cy="-2" r="3"/><path d="M-2 3V12M-7 8H3" stroke-linecap="round"/></g>',
  steam:'<path d="M-8 8Q-16 1-8-5T-8-18M6 9Q0 0 7-5T7-17" fill="none" stroke="#c8abb4" stroke-width="4" stroke-linecap="round"/>',
  ring:'<g fill="none" stroke="#d8b0bb" stroke-width="3" stroke-linecap="round"><ellipse cx="0" cy="-4" rx="16" ry="7"/><path d="M-25 0L-29-4M23-9L27-15M1-16V-22"/></g>',
  pop:'<g fill="#f7dd93" stroke="#9f7b61" stroke-width="1.4"><path d="M0-15Q3-3 15 0Q3 3 0 15Q-3 3-15 0Q-3-3 0-15Z"/><circle cx="-20" cy="-9" r="3"/><circle cx="18" cy="9" r="2.7"/></g>'
};

export function renderEggSVG(scene,t) {
  const {first,second,snack:visible,effect}=eggFrame(scene,t);
  const {size,center,cast,kind,width,height,side}=scene;
  const actor=(pose,index)=>{
    const character=cast[index];
    const svg=cartoonCreatureSVG({...character,...pose},pose.hot?'#ed9c92':character.color,'egg-'+index);
    return `<g transform="translate(${pose.x} ${pose.y}) scale(${pose.sx} ${pose.sy})"><svg x="${-size/2}" y="${-size*.36}" width="${size}" height="${size*.6875}" overflow="visible">${svg}</svg></g>`;
  };
  const particles=effect?(effect.kind==='rain'
    ? `<g transform="translate(${effect.x-35} ${effect.y-18})"><svg width="70" height="40">${emotionEffectSVG('rain',true,t)}</svg></g>`
    : `<g transform="translate(${effect.x} ${effect.y}) scale(${effect.scale??1})">${illustrations[effect.kind]}</g>`):'';
  const food=visible?`<g transform="translate(${center.x} ${center.y+size*.16})">${snack}${kind==='fizz'&&t<.62?illustrations.fizz:''}</g>`:'';
  const moon=kind==='fizz'&&t>=4.45?`<g transform="translate(${first.x-side*15} ${first.y-size*.49})"><path d="M8-12a13 13 0 1 0 7 20A12 12 0 0 1 8-12Z" fill="#f5d690" stroke="#9b8269" stroke-width="1.6"/></g>`:'';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" aria-hidden="true">${actor(first,0)}${actor(second,1)}${food}${particles}${moon}</svg>`;
}
