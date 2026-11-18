import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const {version}=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
const output=path.resolve(process.argv[2]||path.join(root,'desktop-dist'));
if(process.platform!=='darwin')throw new Error('The native desktop wrapper currently supports macOS only.');
const app=path.join(output,'Little Oddlings.app'),contents=path.join(app,'Contents'),resources=path.join(contents,'Resources');
await mkdir(path.join(contents,'MacOS'),{recursive:true});await mkdir(path.join(resources,'pet'),{recursive:true});
const modules=[
 ['public/pet/stay.js',['createStayIdle','stepStayIdle','stayTouch']],
 ['public/pet/invitation.js',['toyArt','toyPose','installToyInvitation']],
 ['public/core/content.js',['PERSONALITIES','PATTERNS','JOBS','OBJECTS','AMBIENT_LINES']],
 ['public/core/game.js',['createState','act','advance','validState','migrateState','snackFriends']],
 ['public/cartoon.js',['cartoonCreatureSVG']],
 ['public/pet/fortune.js',['drawFortune','mountFortune']],
 ['public/pet/emotion.js',['petEmotion','emotionEffectSVG']],
 ['public/pet/chase.js',['createChase','stepChase','installPointerPlay']],
 ['public/pet/eggs.js',['EGG_FOR_FRIEND','FIZZY_BEAD','createEgg','renderEggSVG']],
 ['public/pet/snack.js',['snackSVG','snackFace','installSnackToy']],
 ['public/pet/cursor.js',['creatureCursorSVG','installCreatureCursor']],
 ['public/pet/voice.js',['SOUND_KINDS','makeSound','createVoice']]
];
let bundle='';
for(const [file,exports] of modules){
 let source=await readFile(path.join(root,file),'utf8');source=source.replace(/^import .*;\s*$/gm,'').replace(/^export \{[^\n]*$/gm,'').replace(/\bexport (const|function|class) /g,'$1 ');
 bundle+=`const {${exports.join(',')}}=(()=>{\n${source}\nreturn {${exports.join(',')}};})();\n`;
}
bundle+='(()=>{\n'+(await readFile(path.join(root,'public/pet/pet.js'),'utf8')).replace(/^import .*;\s*$/gm,'')+'\n})();';
await writeFile(path.join(resources,'desktop-bundle.js'),bundle);
const html=(await readFile(path.join(root,'public/pet.html'),'utf8')).replace('<script type="module" src="./pet/pet.js"></script>','<script src="./desktop-bundle.js"></script>');
await writeFile(path.join(resources,'pet.html'),html);
await copyFile(path.join(root,'public/pet/pet.css'),path.join(resources,'pet/pet.css'));
await copyFile(path.join(root,'LICENSE'),path.join(resources,'LICENSE'));
await writeFile(path.join(contents,'Info.plist'),`<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd"><plist version="1.0"><dict><key>CFBundleExecutable</key><string>LittleOddlings</string><key>CFBundleIdentifier</key><string>io.kelvin0110.littleoddlings</string><key>CFBundleName</key><string>Little Oddlings</string><key>CFBundleVersion</key><string>${version}</string><key>CFBundleShortVersionString</key><string>${version}</string><key>CFBundlePackageType</key><string>APPL</string><key>LSUIElement</key><true/><key>NSHighResolutionCapable</key><true/></dict></plist>`);
const compiler=spawn('swiftc',['-swift-version','5','-module-cache-path',path.join(output,'.module-cache'),'-framework','AppKit','-framework','WebKit',path.join(root,'desktop/PetApp.swift'),'-o',path.join(contents,'MacOS/LittleOddlings')],{stdio:'inherit'});
await new Promise((resolve,reject)=>{compiler.once('error',reject);compiler.once('exit',code=>code===0?resolve():reject(new Error(`Compiler exited ${code}`)));});
console.log(app);
