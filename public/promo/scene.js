// A deterministic authored short, shared by the browser player and video export.
// This is an animation concept, not a recording of autonomous game behavior.
export const DURATION = 26;
export const CHAPTERS = [
  {at:0,label:'An excellent nap'}, {at:2.5,label:'A tiny game of catch'},
  {at:8,label:'The nap committee objects'}, {at:12,label:'A peace offering'},
  {at:18,label:'A group nap counts'}, {at:22,label:'Little Oddlings'}
];
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
const mix=(a,b,p)=>a+(b-a)*smooth(p);
const phase=(t,a,b)=>clamp((t-a)/(b-a));
const arc=(t,a,b,height)=>Math.sin(Math.PI*phase(t,a,b))*height;
const f=n=>Number(n.toFixed(3));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function sceneAt(time){
  const t=clamp(Number.isFinite(time)?time:0,0,DURATION);
  const miso={id:'miso',x:300,y:718,jump:0,rot:0,sx:1,sy:1,face:'sleep',look:0};
  const moss={id:'moss',x:570,y:700,jump:0,rot:0,sx:1,sy:1,face:'happy',look:1};
  const pip={id:'pip',x:825,y:718,jump:0,rot:0,sx:1,sy:1,face:'happy',look:-1};
  let ball={x:754,y:700,rot:t*90,visible:t>=2.5&&t<12},caption='an excellent day for doing nothing.',speaker=null;
  let blanket=0,cookie=0,hearts=0;
  if(t<2.5){moss.rot=Math.sin(t*5)*3;pip.look=-1;miso.sx=1.08;miso.sy=.88;}
  if(t>=2.5&&t<5){
    caption='until your friends have an idea.';pip.jump=arc(t,2.6,3.5,76);pip.rot=-9*Math.sin(phase(t,2.6,3.5)*Math.PI);
    ball.x=mix(766,576,phase(t,3.2,4.7));ball.y=690-arc(t,3.2,4.7,150);
    moss.look=1;moss.sy=1+.05*Math.sin(t*6);
  }
  if(t>=5&&t<8){
    caption='just a quiet game of catch.';
    if(t<6.35){moss.jump=arc(t,5,5.85,68);moss.rot=8*Math.sin(phase(t,5,5.85)*Math.PI);ball.x=mix(576,814,phase(t,5.25,6.35));ball.y=680-arc(t,5.25,6.35,175);}
    else {pip.jump=arc(t,6.2,7.1,110);pip.rot=-14*Math.sin(phase(t,6.2,7.1)*Math.PI);ball.x=mix(814,330,phase(t,6.65,8));ball.y=680-arc(t,6.65,8,190);}
    moss.look=t>6.8?-1:1;pip.face='excited';
  }
  if(t>=8&&t<12){
    caption='the nap committee objects.';miso.face=t<8.65?'surprise':'grumpy';miso.jump=arc(t,8,8.7,60);
    miso.rot=t<9?Math.sin((t-8)*30)*5:Math.sin(t*7)*1.5;
    moss.x=mix(570,615,phase(t,8.15,8.6));pip.x=mix(825,858,phase(t,8.15,8.6));
    moss.face='sorry';pip.face='surprise';moss.look=-1;pip.look=-1;
    moss.jump=arc(t,8.2,8.7,32);pip.jump=arc(t,8.25,8.75,22);
    ball.x=mix(330,207,phase(t,8,9.2));ball.y=700-arc(t,8,9.2,55);ball.rot=90;
    if(t>9)speaker={x:300,y:460,lines:['This meeting could','have been a nap.']};
  }
  if(t>=12&&t<18){
    caption=t<15?'a little less chaos.':'a little more kindness.';
    miso.face=t<15.5?'grumpy':'happy';miso.look=1;
    moss.x=mix(615,520,phase(t,12,15));moss.y=mix(700,730,phase(t,12,15));
    pip.x=mix(858,735,phase(t,12.8,16));pip.y=mix(718,744,phase(t,12.8,16));
    moss.face=t<15?'sorry':'happy';pip.face=t<15.5?'sorry':'happy';moss.look=-1;pip.look=-1;
    moss.jump=t<15?Math.abs(Math.sin((t-12)*Math.PI*2))*9:0;
    pip.jump=t>12.8&&t<16?Math.abs(Math.sin((t-12.8)*Math.PI*2))*8:0;
    blanket=smooth(phase(t,14.3,16));cookie=smooth(phase(t,12.8,13.4))*(1-smooth(phase(t,16.3,16.8)));
    if(t>=16){hearts=smooth(phase(t,16,17));moss.rot=-5*Math.sin(phase(t,16,17.5)*Math.PI);miso.rot=5*Math.sin(phase(t,16,17.5)*Math.PI);}
    if(t>16.5)speaker={x:340,y:455,lines:['...one tiny cuddle.']};
  }
  if(t>=18){
    caption=t<22?'a group nap still counts as hanging out.':'big feelings. tiny friends.';
    miso.face='sleep';miso.x=300;miso.sx=1.06;miso.sy=.92;
    moss.x=520;moss.y=730;moss.face='sleep';moss.rot=-4;
    pip.x=735;pip.y=744;pip.face=t<19.4?'drowsy':'sleep';pip.rot=mix(0,-6,phase(t,18.5,19.5));
    blanket=1;hearts=.55;
  }
  // Breathing and anticipation; squash never changes the contact point.
  for(const [i,c] of [miso,moss,pip].entries()){
    const breathe=Math.sin(t*(c.face==='sleep'?2:3)+i*1.8);
    c.sx*=1+breathe*.018;c.sy*=1-breathe*.018;
    if(c.jump>1){c.sx*=.97;c.sy*=1.05;}
    if(c.face==='sleep'){c.sx*=1.04;c.sy*=.91;}
  }
  return {t,characters:[miso,moss,pip],ball,caption,speaker,blanket,cookie,hearts,chapter:CHAPTERS.filter(c=>c.at<=t).at(-1).label};
}

const palette={miso:{fill:'#f5caa1',shade:'#dfaa80',pattern:'freckles'},moss:{fill:'#c2d5ae',shade:'#a0ba8b',pattern:'spots'},pip:{fill:'#cebde5',shade:'#b29dcd',pattern:'stripes'}};
const outline='#65554c';
const body='M-122 -51C-130 -93 -91 -144 -41 -155C7 -167 50 -159 86 -133C118 -110 140 -70 125 -43C105 -18 54 -13 0 -14C-60 -13 -111 -20 -122 -51Z';
function pet(c,t){
  const {fill,shade,pattern}=palette[c.id];
  const blink=Math.sin(t*2.07+(c.id==='moss'?2:0))>.997;
  const closed=c.face==='sleep'||blink;
  let eye=closed?'<path d="M-14 -83Q0 -70 15 -83" fill="none" stroke-width="5"/>':`<ellipse cx="${f(c.look*4)}" cy="-87" rx="13" ry="19" fill="#4f403b" stroke="none"/><ellipse cx="${f(c.look*4-4)}" cy="-94" rx="4" ry="6" fill="#fffdf4" stroke="none"/>`;
  if(c.face==='surprise')eye='<ellipse cx="0" cy="-87" rx="17" ry="23" fill="#4f403b"/><circle cx="-5" cy="-94" r="6" fill="#fffdf4" stroke="none"/>';
  if(c.face==='excited')eye='<path d="M-14 -80L0 -96L15 -80" fill="none" stroke-width="5"/>';
  if(c.face==='drowsy')eye='<path d="M-14 -85L15 -85" fill="none" stroke-width="5"/>';
  const mouth=c.face==='grumpy'?'<path d="M-10 -51Q0 -60 11 -51" fill="none" stroke-width="3.5"/>':c.face==='surprise'?'<ellipse cy="-51" rx="6" ry="8" fill="#93665b"/>':c.face==='sorry'?'<path d="M-7 -52L8 -52" stroke-width="3"/>':closed?'<path d="M-6 -51Q0 -48 6 -51" fill="none" stroke-width="2.8"/>':'<path d="M-9 -54Q0 -41 10 -54" fill="none" stroke-width="3"/>';
  let eyebrows='';
  if(c.face==='grumpy')eyebrows='<path d="M-23 -111L-3 -102L20 -111" fill="none" stroke-width="5"/>';
  if(c.face==='sorry')eyebrows='<path d="M-19 -111Q-5 -108 5 -119" fill="none" stroke-width="3"/>';
  const marks=pattern==='stripes'?'<path d="M-83 -173Q-42 -100 -65 -9M-10 -176Q20 -105 10 -10M63 -166Q97 -92 83 -7" stroke="#fff4ed" stroke-width="18" fill="none"/>':Array.from({length:10},(_,i)=>`<circle cx="${-93+(i*47)%193}" cy="${-127+(i*31)%91}" r="${pattern==='spots'?7:3}" fill="${shade}" stroke="none"/>`).join('');
  const job=c.id==='moss'?'<path d="M0 -157L11 -186" fill="none"/><path d="M8 -170Q-23 -170 -15 -190Q9 -191 8 -170M11 -179Q18 -203 39 -196Q36 -174 11 -179" fill="#a8c58d"/>':c.id==='pip'?'<path d="M-30 -151L-32 -180Q-50 -187 -38 -202Q-30 -208 -20 -203Q-9 -225 8 -205Q30 -217 38 -198Q54 -183 31 -177L29 -152Z" fill="#fffcf1"/><path d="M-28 -166H28" stroke="#e8d7bf"/>':'<circle cx="0" cy="-87" r="27" fill="none" stroke-width="3"/><path d="M26 -88L63 -103" fill="none" stroke-width="3"/><path d="M-7 -34L8 -34L11 -23L0 -6L-11 -23Z" fill="#b69ece" stroke-width="3"/>';
  return `<g transform="translate(${f(c.x)} ${f(c.y-c.jump)}) rotate(${f(c.rot)}) scale(${f(c.sx)} ${f(c.sy)})" stroke="${outline}" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round">
  <defs><clipPath id="body-${c.id}"><path d="${body}"/></clipPath></defs>
  <path d="${body}" fill="${fill}"/>
  <g clip-path="url(#body-${c.id})">${marks}<path d="M-130 -42Q0 -12 130 -48V0H-130Z" fill="${shade}" opacity=".28" stroke="none"/></g>
  <path d="M-110 -101L-94 -93L-83 -100L-71 -92M78 -119L87 -112L96 -116L105 -106" fill="none" stroke="#9e8874" stroke-width="2.5"/>
  <ellipse cx="-44" cy="-63" rx="14" ry="5" fill="#e8a4a0" stroke="none"/><ellipse cx="45" cy="-63" rx="14" ry="5" fill="#e8a4a0" stroke="none"/>
  ${eye}${eyebrows}${mouth}${job}
  ${c.face==='grumpy'?'<path d="M50 -145v10q0 5 7 5h8M75 -145v10q0 5 -7 5M50 -114v-8q0-5 7-5M75 -114v-8q0-5-7-5" stroke="#bd7565" stroke-width="3" fill="none"/>':''}
  </g>`;
}
const leaf=(x,y,rot,scale=1)=>`<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${scale})"><path d="M-40 2Q-20 -34 41 -10Q27 30 -40 2Z" fill="#b5ca93" stroke="#708667" stroke-width="3"/><path d="M-40 2L26 -5" stroke="#839a72" stroke-width="2"/></g>`;
function heart(x,y,s,opacity=1){return `<path transform="translate(${f(x)} ${f(y)}) scale(${f(s)})" d="M0 7C-29 -13 -13 -31 0 -16C13 -31 29 -13 0 7Z" fill="#d79b94" opacity="${f(opacity)}"/>`;}

export function renderScene(time,{width=1080,height=1080}={}){
  const s=sceneAt(time),t=s.t;
  const shadows=s.characters.map(c=>`<ellipse cx="${f(c.x)}" cy="${f(c.y-12)}" rx="${f(110-c.jump*.25)}" ry="15" fill="#a6b28c" opacity="${f(.23-c.jump*.001)}"/>`).join('');
  const curtain=Math.sin(t*.6)*7;
  let scenery=`<rect width="1080" height="1080" fill="#f8f3e6"/><rect x="36" y="36" width="1008" height="1008" rx="42" fill="#eee8d9"/>
  <rect x="36" y="36" width="1008" height="590" rx="42" fill="#f1eada"/>
  <path d="M42 268H1038M42 460H1038" stroke="#e6ddcb" stroke-width="2"/>
  <rect x="337" y="215" width="420" height="330" rx="125" fill="#d9e5cd" stroke="#d5c5aa" stroke-width="14"/>
  <defs><clipPath id="window-view"><rect x="344" y="222" width="406" height="316" rx="118"/></clipPath></defs><g clip-path="url(#window-view)"><path d="M347 456Q441 384 537 431Q639 374 748 428V524H348Z" fill="#bfcfa9"/>
  <circle cx="642" cy="300" r="44" fill="#f5d99a"/></g>
  <path d="M547 222V537M344 379H747" stroke="#d5c5aa" stroke-width="10"/>
  <path d="M352 216Q${320+curtain} 333 367 453L313 470L310 216Z" fill="#f7f0d9" opacity=".75"/>
  <path d="M739 216Q${775+curtain} 333 727 453L784 470L785 216Z" fill="#f7f0d9" opacity=".75"/>
  <path d="M37 605Q540 564 1043 605V1004Q1043 1043 1004 1043H76Q37 1043 37 1004Z" fill="#e2e4c9"/>
  <ellipse cx="550" cy="766" rx="426" ry="135" fill="#ced8b5"/><ellipse cx="550" cy="766" rx="389" ry="108" fill="none" stroke="#e5e8ce" stroke-width="3" stroke-dasharray="6 12"/>
  <g stroke="#948c72" stroke-width="3" stroke-linejoin="round"><path d="M905 510V453" fill="none"/><path d="M905 482Q861 479 863 443Q906 441 905 482M906 470Q912 421 951 432Q952 464 906 470" fill="#a9bf8c"/><path d="M870 511H942L930 560H883Z" fill="#d7ab8d"/><rect x="864" y="502" width="85" height="13" rx="5" fill="#e2bda0"/></g>
  <g transform="translate(134 444) rotate(-7)"><rect width="83" height="98" rx="7" fill="#d9c5a6"/><rect x="7" y="7" width="69" height="83" rx="3" fill="#fff4d6"/><circle cx="42" cy="38" r="17" fill="#e6bc86"/><path d="M17 74Q42 40 68 74" fill="#afc18e"/></g>
  <path d="M173 717Q157 691 190 681Q294 659 399 684Q435 697 416 719Q297 747 173 717Z" fill="#c9c7e1" stroke="#9c98af" stroke-width="3"/>
  <path d="M180 706Q297 727 408 707" fill="none" stroke="#eee9f4" stroke-width="3"/>`;
  const flyingLeaf=t>=12&&t<15.8?leaf(mix(580,380,phase(t,12,15.8)),mix(588,682,phase(t,12,15.8)),-12+Math.sin(t*5)*4,1.4):'';
  const blanket=s.blanket>0?`<g opacity="${f(s.blanket)}"><path d="M174 676Q280 650 411 686Q518 656 642 696Q731 674 851 711L858 760Q712 799 585 769Q424 800 274 754Q212 750 173 731Z" fill="#aabf99" stroke="#6c8567" stroke-width="3"/><path d="M182 687Q282 661 411 699Q520 669 641 709Q737 687 844 723" fill="none" stroke="#e8eed7" stroke-width="8"/><path d="M264 719L273 733M273 719L264 733M470 726L479 740M479 726L470 740M700 740L709 754M709 740L700 754" stroke="#e2e8cf" stroke-width="3"/></g>`:'';
  const cookie=s.cookie>0?`<g opacity="${f(s.cookie)}" transform="translate(${f(mix(790,416,phase(t,13,16.4)))} ${f(665-arc(t,15.3,16.4,65))})"><ellipse rx="22" ry="19" fill="#e8c090" stroke="#a58161" stroke-width="3"/><path d="M-8 -7l3 2M6 5l3 2M7 -9l3 2M-9 8l3 2" stroke="#a58161" stroke-width="4" stroke-linecap="round"/></g>`:'';
  const sparks=s.hearts>0?Array.from({length:3},(_,i)=>heart(430+i*119,540-Math.sin(t*1.3+i)*16,.62,s.hearts*(.65+.2*Math.sin(t+i)))).join(''):'';
  const impact=t>=8&&t<8.65?`<g transform="translate(300 525)" stroke="#bb9872" stroke-width="4" stroke-linecap="round"><path d="M-40 -32l-14 -24M-7 -40v-28M25 -30l16 -23"/></g>`:'';
  const ball=s.ball.visible?`<g transform="translate(${f(s.ball.x)} ${f(s.ball.y)}) rotate(${f(s.ball.rot)})"><ellipse rx="22" ry="20" fill="#e3bb87" stroke="#9c795c" stroke-width="3"/><path d="M-13 -12Q-5 -21 5 -15" fill="none" stroke="#f9dfb7" stroke-width="4"/>${leaf(8,-24,40,.42)}</g>`:'';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1080 1080" role="img" aria-label="${esc(s.chapter)}" font-family="Trebuchet MS,Arial,sans-serif">${scenery}
  ${shadows}${s.characters.map(c=>pet(c,t)).join('')}${flyingLeaf}${blanket}${cookie}${ball}${sparks}${impact}

  </svg>`;
}
