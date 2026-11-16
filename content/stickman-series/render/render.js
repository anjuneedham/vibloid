// Stickman shorts renderer. Usage: node render.js <video 1|2|3> [parallel pages=4]
// Poses every frame with render(v,t) in headless Chromium (Playwright), screenshots 1080x1920 PNGs,
// synthesizes a quiet whoosh/pop/thud bed (no samples), and muxes with the voiceover via ffmpeg.
// Env: AUDIO_DIR (v1.mp3..), OUT_DIR (video<N>.mp4), WORK_DIR (temp frames; default: OS temp dir).
const {chromium}=require('playwright');const path=require('path'),fs=require('fs'),{execFileSync}=require('child_process');
const AUDIO=process.env.AUDIO_DIR||'/home/user/vibloid/content/stickman-series/audio',OUT=process.env.OUT_DIR||'/home/user/vibloid/content/stickman-series/video',WORK=process.env.WORK_DIR||path.join(require('os').tmpdir(),'stickman-render');
const SRC=fs.existsSync(path.join(__dirname,'src/index.html'))?path.join(__dirname,'src'):__dirname;
function writeSfx(ev,dur,file){const sr=44100,out=new Float64Array(Math.ceil(dur*sr));let seed=7;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/2147483648-1};
 const G={whoosh(){const n=Math.round(.32*sr),y=new Float64Array(n);let lp=0;for(let i=0;i<n;i++){const a=.02+.25*Math.sin(Math.PI*i/n)**2;lp+=a*(rnd()*1.7-lp);y[i]=lp*Math.sin(Math.PI*i/n)**2*.9}return y},
  pop(){const n=Math.round(.07*sr),y=new Float64Array(n);let ph=0;for(let i=0;i<n;i++){const t=i/sr;ph+=2*Math.PI*720*Math.exp(-t*14)/sr;y[i]=Math.sin(ph)*Math.exp(-t*45)*.5}return y},
  thud(){const n=Math.round(.28*sr),y=new Float64Array(n);let ph=0;for(let i=0;i<n;i++){const t=i/sr;ph+=2*Math.PI*(95*Math.exp(-t*9)+38)/sr;y[i]=(Math.sin(ph)*Math.exp(-t*13)+rnd()*Math.exp(-t*90)*.25)*.9}return y}};
 for(const[t,k]of ev){const s=G[k](),i0=Math.max(0,Math.round((t-(k==='whoosh'?.14:0))*sr));for(let i=0;i<s.length&&i0+i<out.length;i++)out[i0+i]+=s[i]}
 const b=Buffer.alloc(44+out.length*2);b.write('RIFF',0);b.writeUInt32LE(36+out.length*2,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(sr,24);b.writeUInt32LE(sr*2,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(out.length*2,40);
 for(let i=0;i<out.length;i++)b.writeInt16LE(Math.round(Math.max(-1,Math.min(1,out[i]*.05))*32767),44+i*2);fs.writeFileSync(file,b)} // gain .05 => peaks about -23 dBFS, far under the voice
(async()=>{const v=+process.argv[2],NP=+(process.argv[3]||4),FPS=30;
 const adur=+execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',`${AUDIO}/v${v}.mp3`]).toString();
 const N=Math.ceil((adur+.5)*FPS),dir=path.join(WORK,'frames','v'+v);fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir,{recursive:true});fs.mkdirSync(OUT,{recursive:true});fs.mkdirSync(WORK,{recursive:true});
 const b=await chromium.launch();let next=0,sfx;const t0=Date.now();
 await Promise.all([...Array(NP)].map(async()=>{const p=await b.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});p.on('pageerror',e=>{console.error('PAGEERR',e.message);process.exit(1)});
  await p.goto('file://'+path.join(SRC,'index.html'));await p.evaluate(()=>window.ready);if(!sfx)sfx=await p.evaluate(v=>sfxList(v),v);
  for(;;){const i=next++;if(i>=N)break;await p.evaluate(([v,t])=>render(v,t),[v,i/FPS]);await p.screenshot({path:path.join(dir,String(i).padStart(5,'0')+'.png')})}}));
 await b.close();console.log(`v${v}: ${N} frames in ${((Date.now()-t0)/1000).toFixed(0)}s`);
 const ej=path.join(WORK,`sfx_v${v}.json`),wav=path.join(WORK,`sfx_v${v}.wav`),dur=(N/FPS).toFixed(4);fs.writeFileSync(ej,JSON.stringify(sfx));
 writeSfx(sfx,+dur,wav);
 execFileSync('ffmpeg',['-v','error','-y','-framerate',String(FPS),'-i',path.join(dir,'%05d.png'),'-i',`${AUDIO}/v${v}.mp3`,'-i',wav,
  '-filter_complex','[1:a]apad[v];[v][2:a]amix=inputs=2:duration=shortest:normalize=0[a]','-map','0:v','-map','[a]','-t',dur,
  '-c:v','libx264','-pix_fmt','yuv420p','-crf','17','-preset','medium','-r',String(FPS),'-c:a','aac','-b:a','192k','-ar','44100','-movflags','+faststart',`${OUT}/video${v}.mp4`],{stdio:'inherit'});
 console.log('wrote',`${OUT}/video${v}.mp4`)})();
