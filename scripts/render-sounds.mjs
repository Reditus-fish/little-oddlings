import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {makeSound,SOUND_KINDS} from '../public/pet/voice.js';
const out=path.resolve(process.argv[2]||'sound-output'),rate=24000;
await mkdir(out,{recursive:true});
function wav(samples){
 const bytes=Buffer.alloc(44+samples.length*2);bytes.write('RIFF',0);bytes.writeUInt32LE(bytes.length-8,4);bytes.write('WAVEfmt ',8);bytes.writeUInt32LE(16,16);bytes.writeUInt16LE(1,20);bytes.writeUInt16LE(1,22);bytes.writeUInt32LE(rate,24);bytes.writeUInt32LE(rate*2,28);bytes.writeUInt16LE(2,32);bytes.writeUInt16LE(16,34);bytes.write('data',36);bytes.writeUInt32LE(samples.length*2,40);
 samples.forEach((v,i)=>bytes.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),44+i*2));return bytes;
}
for(const kind of SOUND_KINDS)await writeFile(path.join(out,kind+'.wav'),wav(makeSound(kind,'miso',rate)));
function mix(length,events){const result=new Float32Array(length*rate);for(const [at,kind,id]of events){const sound=makeSound(kind,id,rate),start=Math.round(at*rate);for(let i=0;i<sound.length&&start+i<result.length;i++)result[start+i]+=sound[i];}return result;}
const events=[[.5,'sleep','miso'],[2.7,'happy','moss'],[3.05,'hop','pip'],[4.7,'hop','moss'],[5.4,'happy','moss'],[6.6,'hop','pip'],[8.1,'hop','miso'],[9,'grumpy','miso'],[12.4,'crawl','moss'],[13.3,'crawl','pip'],[15.4,'comfort','moss'],[16.4,'happy','miso'],[18.6,'comfort','pip'],[20.3,'sleep','miso'],[22.2,'sleep','moss']];
await writeFile(path.join(out,'soundtrack.wav'),wav(mix(26,events)));
await writeFile(path.join(out,'sound-palette.wav'),wav(mix(12,SOUND_KINDS.map((kind,i)=>[i*2,kind,'miso']))));
console.log('Created six nonverbal cues, a listening sampler, and the 26-second soundtrack.');
