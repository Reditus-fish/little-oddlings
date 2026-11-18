import {cartoonCreatureSVG} from '../cartoon.js';
// A small pointer skin. The marked upper-left tip remains the exact click point.
export function creatureCursorSVG(creature,color){
 const art=cartoonCreatureSVG({...creature,mood:'content'},color,'cursor').replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><path d="M2 2L2 12L5 8L9 7Z" fill="#fffdf4" stroke="#655348" stroke-width="1.2" stroke-linejoin="round"/><svg x="7" y="9" width="40" height="32" viewBox="0 0 320 220">${art}</svg></svg>`;
}
export function installCreatureCursor(button){
 let enabled=false,current='',svg='';
 const fine=matchMedia('(pointer: fine)');
 const apply=()=>{document.documentElement.classList.toggle('creature-cursor',enabled&&fine.matches);button?.setAttribute('aria-pressed',String(enabled&&fine.matches));};
 const set=value=>{enabled=Boolean(value);apply();};
 const refresh=(creature,color)=>{const key=JSON.stringify([creature.id,creature.pattern,creature.job,color]);if(key===current)return;current=key;svg=creatureCursorSVG(creature,color);document.documentElement.style.setProperty('--creature-cursor',`url("data:image/svg+xml,${encodeURIComponent(svg)}") 2 2`);};
 button?.addEventListener('click',()=>set(!enabled));
 document.addEventListener('keydown',e=>{if(e.key==='Escape')set(false);});
 fine.addEventListener('change',apply);
 return {set,refresh,get enabled(){return enabled;}};
}
