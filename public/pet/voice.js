// Original nonverbal sounds: no speech synthesis or recordings.
export const SOUND_KINDS=['hop','crawl','happy','grumpy','sleep','comfort','fizz','bump','boil','pop','nibble','drip'];
const durations={hop:.23,crawl:.34,happy:.55,grumpy:.5,sleep:1.2,comfort:.8,fizz:.42,bump:.24,boil:1.12,pop:.23,nibble:.22,drip:.32};
export function makeSound(kind,character='miso',sampleRate=24000){
 if(!SOUND_KINDS.includes(kind))throw new Error('Unknown sound');
 const duration=durations[kind],data=new Float32Array(Math.ceil(duration*sampleRate));
 const pitch={miso:.92,moss:1.08,pip:1.2}[character]||1;
 let phase=0;
 for(let i=0;i<data.length;i++){
  const t=i/sampleRate,u=t/duration,fade=Math.sin(Math.PI*u)**1.7;
  let hz=220,gain=.2;
  if(kind==='hop'){hz=180+360*Math.exp(-u*5);gain=.26;}
  if(kind==='crawl'){hz=125+26*Math.sin(u*Math.PI*3);gain=.08;}
  if(kind==='happy'){hz=(u<.45?430:580)+40*Math.sin(u*Math.PI);gain=.18*(.55+.45*Math.sin(u*Math.PI*2)**2);}
  if(kind==='grumpy'){hz=185-55*u+7*Math.sin(t*80);gain=.18*(.65+.35*Math.sin(t*90));}
  if(kind==='sleep'){hz=120+12*Math.sin(u*Math.PI*2);gain=.055;}
  if(kind==='comfort'){hz=390-90*u+10*Math.sin(t*18);gain=.14;}
  if(kind==='fizz'){hz=480+200*u+75*Math.sin(t*90);gain=.11*Math.sin(u*Math.PI*5)**2;}
  if(kind==='bump'){hz=370-240*Math.sqrt(u);gain=.16;}
  if(kind==='boil'){hz=155+265*u+34*Math.sin(t*36);gain=.14*Math.sin(Math.PI*(3*u+4*u*u))**4;}
  if(kind==='pop'){hz=235+270*Math.exp(-u*6);gain=.16;}
  if(kind==='nibble'){hz=205-50*u;gain=.11*Math.sin(u*Math.PI*3)**4;}
  if(kind==='drip'){hz=620-230*u;gain=.085*Math.sin(u*Math.PI*2)**2;}
  phase+=2*Math.PI*hz*pitch/sampleRate;
  data[i]=(Math.sin(phase)+.14*Math.sin(phase*2)+.04*Math.sin(phase*3))*fade*gain;
 }
 return data;
}
export function createVoice(){
 let context=null,enabled=false,last=-Infinity;
 return {
  get enabled(){return enabled;},
  async enable(value){enabled=value;if(enabled){context??=new (window.AudioContext||window.webkitAudioContext)();await context.resume();}else if(context)await context.suspend();},
  async play(kind,character='miso'){
   if(!enabled||!context||document.hidden||performance.now()-last<150)return;
   last=performance.now();await context.resume();
   const samples=makeSound(kind,character,context.sampleRate),buffer=context.createBuffer(1,samples.length,context.sampleRate);buffer.copyToChannel(samples,0);
   const source=context.createBufferSource();source.buffer=buffer;source.connect(context.destination);source.start();
  }
 };
}
