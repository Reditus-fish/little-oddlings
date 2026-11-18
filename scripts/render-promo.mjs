// Optional authoring utility. Gameplay has no dependency on Sharp or FFmpeg.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { renderScene, sceneAt, DURATION, CHAPTERS } from '../public/promo/scene.js';
const require=createRequire(import.meta.url);
const sharp=require(process.env.SHARP_MODULE_PATH||'sharp');
const ffmpeg=process.env.FFMPEG_PATH||'ffmpeg';
const out=path.resolve(process.argv[2]||'promo-output');
const audio=process.env.AUDIO_PATH;
const fps=24,size=1080;await mkdir(out,{recursive:true});
const movie=path.join(out,'little-oddlings-nap-committee.mp4');
const encoder=spawn(ffmpeg,['-hide_banner','-loglevel','error','-y','-f','image2pipe','-framerate',String(fps),'-vcodec','png','-i','pipe:0',...(audio?['-i',audio,'-c:a','aac','-b:a','128k','-shortest']:['-an']),'-c:v','libx264','-preset','medium','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',movie],{stdio:['pipe','inherit','inherit']});
const done=new Promise((resolve,reject)=>{encoder.once('error',reject);encoder.once('close',code=>code===0?resolve():reject(new Error(`FFmpeg exited ${code}`)));});
// Attach rejection handling immediately so a missing encoder cannot be unhandled.
done.catch(()=>{});
encoder.stdin.on('error',()=>{});
for(let i=0;i<DURATION*fps;i++){
 const png=await sharp(Buffer.from(renderScene(i/fps))).png().toBuffer();
 if(encoder.exitCode!==null)throw new Error('Video encoder stopped early.');
 if(!encoder.stdin.write(png))await Promise.race([once(encoder.stdin,'drain'),done.then(()=>{throw new Error('Video encoder closed early.');})]);
 if(i%(fps*4)===0)console.log(`Rendered ${i/fps} / ${DURATION} seconds`);
}
encoder.stdin.end();await done;
const samples=[1,4.2,7.2,9.8,14.4,17.2,20.2,24.2];
const tiles=await Promise.all(samples.map(async(t,i)=>({input:await sharp(Buffer.from(renderScene(t,{width:360,height:360}))).png().toBuffer(),left:(i%4)*360,top:Math.floor(i/4)*360})));
await sharp({create:{width:1440,height:720,channels:3,background:'#f8f3e6'}}).composite(tiles).png().toFile(path.join(out,'storyboard-contact-sheet.png'));
await sharp(Buffer.from(renderScene(20.2))).png().toFile(path.join(out,'poster.png'));
const gif=spawn(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',movie,'-filter_complex','fps=10,scale=480:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4','-loop','0',path.join(out,'little-oddlings-nap-committee.gif')],{stdio:'inherit'});
await new Promise((resolve,reject)=>{gif.once('error',reject);gif.once('close',code=>code===0?resolve():reject(new Error(`GIF export failed: ${code}`)));});
await writeFile(path.join(out,'export.json'),JSON.stringify({title:'The Nap Committee',duration:DURATION,fps,width:size,height:size,frames:DURATION*fps,audio:Boolean(audio),format:'H.264 MP4, yuv420p',type:'Authored nonverbal concept animation, not gameplay footage',chapters:CHAPTERS,samples:samples.map(t=>({at:t,chapter:sceneAt(t).chapter})),source:'public/promo/scene.js'},null,2));
console.log(`Exported MP4, GIF, poster, and storyboard to ${out}`);
