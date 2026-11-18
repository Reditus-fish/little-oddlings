import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=new URL('../',import.meta.url);
const built=spawn(process.execPath,[fileURLToPath(new URL('build-desktop.mjs',import.meta.url))],{stdio:'inherit'});
await new Promise((resolve,reject)=>{built.once('error',reject);built.once('exit',code=>code===0?resolve():reject(new Error('Desktop build failed.')));});
const opened=spawn('open',[fileURLToPath(new URL('desktop-dist/Little Oddlings.app',root))],{stdio:'inherit'});
await new Promise((resolve,reject)=>{opened.once('error',reject);opened.once('exit',code=>code===0?resolve():reject(new Error('Could not launch desktop pet.')));});
