'use strict';
/* Stickman explainer engine: everything is a pure function of time t (seconds). */
const RAD=Math.PI/180, W=1080, H=1920, FLOOR=1120;
const C={navy:'#101736',night:'#080B1C',ink:'#0B0B14',white:'#F6F1E7',red:'#FF3B3B',green:'#1ED36F',yellow:'#FFD21F',
  floor:'#070A19',dred:'#B3202C',dgreen:'#0E8F4A',grey:'#8A90A6',panel:'#1A2350'};
const cl=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const lerp=(a,b,k)=>a+(b-a)*k;
const pr=(t,a,b)=>cl((t-a)/(b-a));
const E={lin:k=>k,io:k=>k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2,out:k=>1-Math.pow(1-k,3),in:k=>k*k*k,
  back:k=>{const c=2.4;return 1+(c+1)*Math.pow(k-1,3)+c*Math.pow(k-1,2)},
  el:k=>k<=0?0:k>=1?1:Math.pow(2,-9*k)*Math.sin((k*10-.75)*2.0944)+1,
  bounce:k=>{const n=7.5625,d=2.75;if(k<1/d)return n*k*k;if(k<2/d)return n*(k-=1.5/d)*k+.75;if(k<2.5/d)return n*(k-=2.25/d)*k+.9375;return n*(k-=2.625/d)*k+.984375}};
const pop=(t,t0,d=.38)=>t<t0?0:E.back(pr(t,t0,t0+d));
const kf=(t,ks)=>{if(t<=ks[0][0])return ks[0][1];for(let i=1;i<ks.length;i++){if(t<=ks[i][0]){const k=(t-ks[i-1][0])/(ks[i][0]-ks[i-1][0]);return ks[i-1][1]+(ks[i][1]-ks[i-1][1])*E[ks[i][2]||'io'](k)}}return ks[ks.length-1][1]};
const shk=(t,t0,amp=26,d=.45)=>{if(t<t0||t>t0+d)return[0,0];const k=1-(t-t0)/d,a=amp*k*k;return[Math.sin(t*97)*a,Math.cos(t*131)*a]};
const wob=(t,f,a,ph=0)=>Math.sin((t*f+ph)*6.2832)*a;
const mixc=(a,b,k)=>{const h=s=>[1,3,5].map(i=>parseInt(s.substr(i,2),16));const A=h(a),B=h(b);return'#'+A.map((v,i)=>Math.round(lerp(v,B[i],cl(k))).toString(16).padStart(2,'0')).join('')};
const f1=n=>(Math.round(n*10)/10);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
// ---------- svg helpers
const g=(tr,inner,extra='')=>`<g transform="${tr}" ${extra}>${inner}</g>`;
const T=(x,y,s=1,r=0,sy)=>`translate(${f1(x)} ${f1(y)}) rotate(${f1(r)}) scale(${(+s).toFixed(4)} ${(sy==null?+s:+sy).toFixed(4)})`;
const at=(x,y,s,r,inner,sy)=>g(T(x,y,s,r,sy),inner);
const rect=(x,y,w,h,fill,o={})=>`<rect x="${f1(x)}" y="${f1(y)}" width="${f1(Math.max(0,w))}" height="${f1(Math.max(0,h))}" rx="${o.r||0}" fill="${fill}" ${o.st?`stroke="${o.st}" stroke-width="${o.sw||8}"`:''} ${o.op!=null?`opacity="${o.op}"`:''} ${o.x||''}/>`;
const circ=(x,y,r,fill,o={})=>`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(Math.max(0,r))}" fill="${fill}" ${o.st?`stroke="${o.st}" stroke-width="${o.sw||8}"`:''} ${o.op!=null?`opacity="${o.op}"`:''}/>`;
const ell=(x,y,rx,ry,fill,o={})=>`<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(Math.max(0,rx))}" ry="${f1(Math.max(0,ry))}" fill="${fill}" ${o.st?`stroke="${o.st}" stroke-width="${o.sw||8}"`:''} ${o.op!=null?`opacity="${o.op}"`:''}/>`;
const line=(x1,y1,x2,y2,st,sw=8,o={})=>`<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="${st}" stroke-width="${sw}" stroke-linecap="round" ${o.dash?`stroke-dasharray="${o.dash}"`:''} ${o.op!=null?`opacity="${o.op}"`:''}/>`;
const path=(d,fill,o={})=>`<path d="${d}" fill="${fill||'none'}" ${o.st?`stroke="${o.st}" stroke-width="${o.sw||8}" stroke-linecap="round" stroke-linejoin="round"`:''} ${o.op!=null?`opacity="${o.op}"`:''} ${o.dash?`stroke-dasharray="${o.dash}"`:''}/>`;
const txt=(s,x,y,size,fill,o={})=>`<text x="${f1(x)}" y="${f1(y)}" font-size="${f1(size)}" font-weight="${o.w||900}" fill="${fill}" text-anchor="${o.a||'middle'}" dominant-baseline="central" ${o.ls?`letter-spacing="${o.ls}"`:''} ${o.st?`stroke="${o.st}" stroke-width="${o.sw||10}" stroke-linejoin="round" paint-order="stroke"`:''} ${o.op!=null?`opacity="${o.op}"`:''}>${esc(s)}</text>`;
let _ctx;const mw=(s,size,w=900)=>{_ctx=_ctx||document.createElement('canvas').getContext('2d');_ctx.font=`${w} ${size}px Inter`;return _ctx.measureText(s).width};
const pill=(s,x,y,size,bg,fg,o={})=>{const w=mw(s,size,o.w||900)+size*(o.px||1.1),h=size*(o.py||1.7);return rect(x-w/2,y-h/2,w,h,bg,{r:o.r==null?h/2:o.r,st:o.st,sw:o.sw,op:o.op})+txt(s,x,y+size*.03,size,fg,{w:o.w})};
const burst=(x,y,r1,r2,n,col,sw=10,ph=0)=>{let s='';for(let i=0;i<n;i++){const a=(i/n)*6.2832+ph;s+=line(x+Math.cos(a)*r1,y+Math.sin(a)*r1,x+Math.cos(a)*r2,y+Math.sin(a)*r2,col,sw)}return s};
const star=(x,y,r,col,n=12,inner=.6,ph=0)=>{let d='';for(let i=0;i<n*2;i++){const a=i/(n*2)*6.2832+ph,rr=i%2?r*inner:r;d+=(i?'L':'M')+f1(x+Math.cos(a)*rr)+' '+f1(y+Math.sin(a)*rr)}return path(d+'Z',col)};
// impact puff: expanding ring of lines after t0
const impact=(t,t0,x,y,col=C.white,r=120,n=10)=>{if(t<t0||t>t0+.35)return'';const k=E.out(pr(t,t0,t0+.35));return burst(x,y,r*(.4+k*.7),r*(.7+k*.75),n,col,12*(1-k)+2,.3)};
const floor=(col=C.floor,y=FLOOR)=>rect(-3000,y,7080,3000,col)+rect(-3000,y,7080,10,'#000',{op:.35});
const shadow=(x,w=110,y=FLOOR,op=.3)=>ell(x,y+6,w,w*.16,'#000',{op});
// ---------- stickman
const POSE={stand:{lean:0,aL:[-16,-8],aR:[16,8],lL:[-9,-5],lR:[9,5],head:0},
  shrug:{lean:0,aL:[-55,-150],aR:[55,150],lL:[-9,-5],lR:[9,5],head:8},
  cheer:{lean:0,aL:[-150,-170],aR:[150,170],lL:[-12,-6],lR:[12,6],head:0},
  slump:{lean:14,aL:[-4,2],aR:[8,4],lL:[-9,-5],lR:[9,5],head:30}};
const FACE={neutral:{e:'dot',eo:1,bl:0,br:0,bh:0,mc:.35,mo:0,mw:20,mx:0,lx:0,ly:0,grit:0,grin:0},
  happy:{mc:1,mo:.7,grin:1,mw:22,bh:3},smug:{e:'half',bl:-6,br:14,bh:2,mc:.8,mw:15,mx:7},
  shock:{e:'wide',bh:12,mo:1,mw:13,mc:0},angry:{bl:26,br:26,bh:-5,mc:-.8,grit:1},
  sad:{bl:-20,br:-20,mc:-1,mw:17},dead:{e:'x',mc:-.5,mw:16},ugh:{e:'line',bl:-12,br:-12,mc:-1,mw:17},
  confused:{bl:-18,br:14,bh:5,mc:-.25,mw:12,mx:6},worried:{e:'wide',bl:-22,br:-22,bh:4,mc:-.7,mw:14},
  flat:{mc:0,mw:16,e:'half'},strain:{e:'line',bl:22,br:22,grit:1}};
const mixO=(a,b,k)=>{const o={};for(const key of new Set([...Object.keys(a),...Object.keys(b)])){const x=a[key],y=b[key];
  if(Array.isArray(x)&&Array.isArray(y))o[key]=x.map((v,i)=>lerp(v,y[i],k));else if(typeof x==='number'&&typeof y==='number')o[key]=lerp(x,y,k);else o[key]=(k>.5?(y!==undefined?y:x):(x!==undefined?x:y))}return o};
const fc=(...n)=>Object.assign({},FACE.neutral,...n.map(x=>typeof x==='string'?FACE[x]:x));
const ps=(...n)=>Object.assign({},POSE.stand,...n.map(x=>typeof x==='string'?POSE[x]:x));
const mixF=(a,b,k)=>mixO(fc(a),fc(b),cl(k)), mixP=(a,b,k)=>mixO(ps(a),ps(b),cl(k));
function faceSVG(F){let s='';const lx=F.lx||0,ly=F.ly||0;
  for(const sd of[-1,1]){const cx=sd*20+lx*9,cy=-8+ly*7,ba=sd<0?F.bl:F.br,by=cy-22-(F.bh||0);
    const tw=(sd>0&&F.tw)?F.tw:0;
    if(F.e==='wide'){s+=circ(cx,cy,15+tw,'#fff',{st:C.ink,sw:5})+circ(cx+lx*5,cy+ly*5,6,C.ink)}
    else if(F.e==='x'){s+=line(cx-10,cy-10,cx+10,cy+10,C.ink,6)+line(cx+10,cy-10,cx-10,cy+10,C.ink,6)}
    else if(F.e==='line'){s+=path(`M${cx-11} ${cy}Q${cx} ${cy+7} ${cx+11} ${cy}`,null,{st:C.ink,sw:6})}
    else if(F.e==='half'){s+=ell(cx,cy+2,8,5,C.ink)+line(cx-12,cy-4,cx+12,cy-4,C.ink,6)}
    else if(F.e==='shades'){}
    else s+=ell(cx,cy,7.5+tw,cl(8*(F.eo==null?1:F.eo),1.5,12)+tw,C.ink);
    if(F.e!=='shades')s+=g(`translate(${f1(cx)} ${f1(by)}) rotate(${f1(-sd*ba)})`,line(-13,0,13,0,C.ink,7))}
  const mx=(F.mx||0)+lx*6,my=26+ly*4,m=F.mw||20;
  if(F.grit>.5)s+=rect(mx-20,my-8,40,17,'#fff',{r:6,st:C.ink,sw:5})+line(mx-7,my-6,mx-7,my+7,C.ink,4)+line(mx+7,my-6,mx+7,my+7,C.ink,4)+line(mx,my-6,mx,my+7,C.ink,4);
  else if(F.mo>.12){if(F.grin>.5)s+=path(`M${mx-m} ${my-6}Q${mx} ${my-6+F.mo*44} ${mx+m} ${my-6}Z`,C.ink,{st:C.ink,sw:5})+ell(mx,my+F.mo*10,m*.45,F.mo*5,C.red);
    else s+=ell(mx,my+F.mo*4,m*.8,4+F.mo*17,C.ink)}
  else s+=path(`M${f1(mx-m)} ${f1(my-F.mc*5)}Q${f1(mx)} ${f1(my+F.mc*17)} ${f1(mx+m)} ${f1(my-F.mc*5)}`,null,{st:C.ink,sw:7});
  if(F.sweat)s+=path('M44 -30q-9 14 0 18q9 -4 0 -18Z','#7FD4FF',{st:C.ink,sw:3});
  if(F.blush)s+=ell(-30,12,9,5,C.red,{op:.5})+ell(30,12,9,5,C.red,{op:.5});
  return s}
function stick(o){const s=o.s||1,fl=o.flip||1,sx=o.sx||1,sy=o.sy||1,P=ps(o.pose||{}),F=fc(o.face||{});
  const TL=150,HR=54,UA=80,FA=80,TH=90,SL=90;
  const dv=a=>[Math.sin(a*RAD),Math.cos(a*RAD)],ad=(p,v,l)=>[p[0]+v[0]*l,p[1]+v[1]*l];
  const hip=[0,0],up=dv(180-P.lean),neck=ad(hip,up,TL),sh=ad(hip,up,TL*.84),hc=ad(neck,dv(180-P.lean-(P.head||0)*.4),HR+4);
  const leg=a=>{const k=ad(hip,dv(a[0]),TH);return[k,ad(k,dv(a[1]),SL)]};
  const[kL,fL]=leg(P.lL),[kR,fR]=leg(P.lR);const gy=Math.max(fL[1],fR[1])+8;
  const X=o.x,Y=o.ground!=null?o.ground-gy*s*sy:o.y;
  const toL=p=>[((p.x-X)/(s*sx))*fl,(p.y-Y)/(s*sy)],toW=p=>({x:X+p[0]*s*sx*fl,y:Y+p[1]*s*sy});
  const arm=(a,tg,bend)=>{if(tg){const q=toL(tg);let dx=q[0]-sh[0],dy=q[1]-sh[1],dd=Math.hypot(dx,dy);const m=UA+FA-2;if(dd>m){dx*=m/dd;dy*=m/dd;dd=m}dd=Math.max(dd,24);
    const th=Math.atan2(dx,dy)/RAD,al=Math.acos(cl((UA*UA+dd*dd-FA*FA)/(2*UA*dd),-1,1))/RAD;return[ad(sh,dv(th+bend*al),UA),[sh[0]+dx,sh[1]+dy]]}
    const e=ad(sh,dv(a[0]),UA);return[e,ad(e,dv(a[1]),FA)]};
  const[eL,hL]=arm(P.aL,o.reachL,o.bendL||-1),[eR,hR]=arm(P.aR,o.reachR,o.bendR||1);
  const pl=(...p)=>'M'+p.map(q=>f1(q[0])+' '+f1(q[1])).join('L');const ft=f=>[f[0]+26,f[1]];
  const D=pl(hip,neck)+pl(sh,eL,hL)+pl(sh,eR,hR)+pl(hip,kL,fL,ft(fL))+pl(hip,kR,fR,ft(fR));
  const ol=o.ol||C.white;let b='';
  if(ol!=='none')b+=path(D,null,{st:ol,sw:34})+circ(hc[0],hc[1],HR+15,ol);
  b+=path(D,null,{st:C.ink,sw:17})+(o.bodyExtra||'');
  b+=g(`translate(${f1(hc[0])} ${f1(hc[1])}) rotate(${f1((P.head||0)+P.lean*.5)})`,circ(0,0,HR,o.skin||C.white,{st:C.ink,sw:13})+faceSVG(F)+(o.headExtra||''));
  const svg=g(`translate(${f1(X)} ${f1(Y)}) rotate(${f1(o.rot||0)}) scale(${(s*sx*fl).toFixed(4)} ${(s*sy).toFixed(4)})`,b);
  return{svg,hL:toW(hL),hR:toW(hR),head:toW(hc),sh:toW(sh),hip:{x:X,y:Y},s}}
const walkPose=(ph,amp=28)=>{const a=Math.sin(ph*6.2832)*amp;return{lL:[-a,-a+Math.max(0,-a)*.8-6],lR:[a,a+Math.max(0,a)*.8-6],aL:[a*.9,a*.9+12],aR:[-a*.9,-a*.9+12],lean:5}};
const steam=(t,x,y,s=1)=>{let o='';for(let i=0;i<3;i++){const k=((t*1.6+i/3)%1),xx=x+(i-1)*34*s+wob(t,2,6,i*.3);o+=path(`M${f1(xx)} ${f1(y-k*70*s)}q${14*s} ${-14*s} 0 ${-28*s}q${-14*s} ${-14*s} 0 ${-28*s}`,null,{st:C.white,sw:8*s,op:(1-k)*.9})}return o};
// ---------- props
const candles=(x,y,w,h,data,n,o={})=>{let s='';const cw=w/data.length;for(let i=0;i<Math.min(data.length,Math.ceil(n));i++){const gk=cl(n-i),d=data[i],op=d[0],c=lerp(d[0],d[1],E.out(gk)),up=c>=op,col=up?C.green:C.red;
  const y1=y+h*(1-Math.max(op,c)),y2=y+h*(1-Math.min(op,c)),cx=x+cw*(i+.5),wk=h*.05;
  s+=line(cx,y1-wk,cx,y2+wk,col,o.sw||5)+rect(cx-cw*.32,y1,cw*.64,Math.max(6,y2-y1),col,{r:4})}return s};
const monitor=(x,y,w,h,inner='',scr='#0A0F2A')=>rect(x+w/2-22,y+h-4,44,54,C.ink)+rect(x+w/2-90,y+h+44,180,18,C.ink,{r:9})+rect(x,y,w,h,C.ink,{r:22})+rect(x+16,y+16,w-32,h-32,scr,{r:10})+inner;
const desk=(x,y,w,col='#2A3566')=>rect(x,y,w,26,col,{r:8,st:C.ink,sw:8})+rect(x+30,y+26,22,FLOOR-y-26,col,{st:C.ink,sw:8})+rect(x+w-52,y+26,22,FLOOR-y-26,col,{st:C.ink,sw:8});
const mug=(x,y,s=1,crack=0,col=C.white)=>g(T(x,y,s),path('M38 -42q40 0 40 26q0 26 -40 26',null,{st:C.ink,sw:12})+rect(-42,-62,84,92,col,{r:14,st:C.ink,sw:9})+rect(-42,-62,84,22,'#6B3F1D',{r:10,st:C.ink,sw:9})+(crack>0?path('M-10 -40l16 20l-18 14l14 22l-8 14',null,{st:C.ink,sw:6,dash:`${crack*110} 200`}):''));
const tag=(s,x,y,size,bg,fg=C.white,r=0,sc=1)=>{const w=mw(s,size)+size*1.9,h=size*1.75;return g(T(x,y,sc,r),path(`M${-w/2+h*.5} ${-h/2}H${w/2-12}q12 0 12 12V${h/2-12}q0 12 -12 12H${-w/2+h*.5}L${-w/2} 0Z`,bg,{st:C.ink,sw:7})+circ(-w/2+h*.5,0,size*.2,C.ink)+txt(s,size*.35,size*.04,size,fg))};
const stamp=(s,x,y,size,r,sc,col=C.red,lines)=>{const ls=lines||[s],wd=Math.max(...ls.map(l=>mw(l,size)))+size*1.2,h=size*1.25*ls.length+size*.7;
  return g(T(x,y,sc,r),rect(-wd/2,-h/2,wd,h,C.white,{r:18,st:col,sw:16})+ls.map((l,i)=>txt(l,0,(i-(ls.length-1)/2)*size*1.2+size*.04,size,col)).join(''))};
const wordmark=(x,y,size,dark)=>g(T(x,y,size/40),rect(0,-20,40,40,C.green,{r:10})+path('M10 0l8 8l13 -15',null,{st:'#fff',sw:6})+`<text x="52" y="2" font-size="38" font-weight="900" dominant-baseline="central" fill="${dark?C.white:C.ink}">Trade<tspan fill="${C.green}">Notes</tspan></text>`);
const sample=(x,y,op=1)=>g(T(x,y),pill('SAMPLE DATA - NOT REAL TRADES',0,0,26,C.ink,C.yellow,{w:800,st:C.yellow,sw:3}),`opacity="${op}"`);
const uiCard=(x,y,w,h,inner,title)=>rect(x+10,y+14,w,h,'#000',{r:34,op:.35})+rect(x,y,w,h,C.white,{r:34,st:C.ink,sw:9})+path(`M${x} ${y+92}V${y+34}q0 -34 34 -34H${x+w-34}q34 0 34 34V${y+92}Z`,'#E4DDCD',{st:C.ink,sw:9})+wordmark(x+34,y+47,38)+(title?txt(title,x+w-34,y+48,28,'#6B6F82',{a:'end',w:800}):'')+inner;
const arrow=(x,y,len,r,col,sw=26)=>g(T(x,y,1,r),path(`M0 ${-len/2}V${len/2-10}`,null,{st:col,sw})+path(`M${-sw*1.5} ${len/2-sw*1.6}L0 ${len/2}L${sw*1.5} ${len/2-sw*1.6}`,null,{st:col,sw}));
const bigBtn=(x,y,w,label,press,col=C.red,fg=C.white,size=44)=>{const dy=press*18;return rect(x-w/2-16,y+22,w+32,40,C.ink,{r:14})+rect(x-w/2,y-34+18,w,60,mixc(col,'#000000',.4),{r:18,st:C.ink,sw:8})+rect(x-w/2,y-34+dy,w,60,col,{r:18,st:C.ink,sw:8})+txt(label,x,y-3+dy,size,fg)};
// ---------- screen overlays
const partTag=n=>rect(56,196,mw(`PART ${n}/3`,34)+52,64,C.ink,{r:16,st:C.yellow,sw:5})+txt(`PART ${n}/3`,82,229,34,C.yellow,{a:'start'});
function hookSVG(t,lines,tOut){let s='',y=300;const ex=E.in(pr(t,tOut-.22,tOut));if(ex>=1)return'';
  lines.forEach((L,i)=>{const size=Math.min(L.size||128,(L.size||128)*850/mw(L.s,L.size||128)),w=mw(L.s,size)+size*.6,h=size*1.2,k=pop(t,L.at,.32);
    if(k>0)s+=g(T(540+(i%2?-1:1)*ex*1300,y+h/2,k*(1+.03*Math.sin(t*5+i)),L.r==null?(i%2?1.6:-2):L.r),rect(-w/2+8,-h/2+10,w,h,'#000',{r:16,op:.45})+rect(-w/2,-h/2,w,h,L.bg,{r:16,st:C.ink,sw:9})+txt(L.s,0,size*.04,size,L.fg));
    y+=h+16});return s}
const discl=(s,size=28,y=1604,op=.8)=>txt(s,540,y,size,C.white,{w:800,st:'#000',sw:6,op});
const disclPill=(s,t,a,b,y=1548)=>{const k=pop(t,a,.3)*(1-pr(t,b-.2,b));return k<=0?'':g(T(540,y,k),pill(s,0,0,37,C.ink,C.white,{w:800,st:C.white,sw:4}))};
// ---------- captions
const RED_W=/^(REVENGE|FOMO|BREACHED|-4R|RED|IDIOT|PROBLEM\??)$/,GRN_W=/^(TRADENOTES|GREEN|-1R|STOP|TAG|TAGS|TAGGING|TAGGED|ONE|TWO|TWO'S|THREE|3|R-MULTIPLE|FRIDAY|FRIDAY-YOU|RULE|CALENDAR|RESET|ONE-MORE-TRADE)$/;
function buildCaps(words){const tk=[];
  for(let i=0;i<words.length;i++){let w=words[i],raw=w.w,e=w.e;
    if(/^minus$/i.test(raw)&&words[i+2]&&/^R\W*$/.test(words[i+2].w)){raw='-'+({one:1,two:2,three:3,four:4}[words[i+1].w.toLowerCase()])+'R.';e=words[i+2].e;i+=2}
    tk.push({raw,s:w.s,e})}
  tk.forEach((k,i)=>{k.s0=k.s;if(k.e-k.s<.08)k.s=Math.max(i?tk[i-1].e:0,k.s-.18);k.end=/[.?!]$/.test(k.raw);k.t=k.raw.toUpperCase().replace(/[.,]+$/,'');k.col=RED_W.test(k.t)?C.red:GRN_W.test(k.t)?C.green:null});
  const chunks=[];let cur=[];const flush=()=>{if(cur.length)chunks.push({w:cur});cur=[]};
  tk.forEach((k,i)=>{const p=tk[i-1],n=tk[i+1],last=k.end||!n||n.s0-k.e>.26;if(cur.length&&(cur.length>=(last?4:3)||p.end||k.s0-p.e>.26||cur.map(x=>x.t).join(' ').length+k.t.length>(last?20:15)))flush();cur.push(k)});flush();
  const SZ=92,MAXW=840;
  chunks.forEach((c,ci)=>{const sp=SZ*.34,ws=c.w.map(k=>mw(k.t,SZ));const tot=a=>a.reduce((x,y)=>x+y,0)+sp*(a.length-1);let lines=[c.w.map((_,i)=>i)];
    if(tot(ws)>MAXW&&c.w.length>1){let best=1,bv=1e9;for(let j=1;j<c.w.length;j++){const v=Math.max(tot(ws.slice(0,j)),tot(ws.slice(j)));if(v<bv){bv=v;best=j}}lines=[lines[0].slice(0,best),lines[0].slice(best)]}
    const mx=Math.max(...lines.map(l=>tot(l.map(i=>ws[i]))));c.sc=Math.min(1,MAXW/mx);c.lines=lines.map(l=>{let x=-tot(l.map(i=>ws[i]))/2;return l.map(i=>{const o={k:c.w[i],cx:x+ws[i]/2};x+=ws[i]+sp;return o})});
    c.s=c.w[0].s-.05;c.e=c.w[c.w.length-1].e+.75});
  chunks.forEach((c,i)=>{if(chunks[i+1])c.e=Math.min(c.e,chunks[i+1].s)});
  return{chunks,tk,SZ}}
function capsSVG(cap,t,cy=1320){const c=cap.chunks.find(c=>t>=c.s&&t<c.e);if(!c)return'';const SZ=cap.SZ,k=pr(t,c.s,c.s+.14),LH=112;let cur=null;c.w.forEach(w=>{if(t>=w.s)cur=w});
  let sh='',fg='';c.lines.forEach((L,li)=>{const y=(li-(c.lines.length-1)/2)*LH;L.forEach(o=>{const w=o.k,isC=w===cur,hp=isC?1-E.out(pr(t,w.s,w.s+.22)):0,sc=1+.07*hp,col=w.col||(isC?C.yellow:'#FFFFFF');
      const tr=`translate(${f1(o.cx)} ${f1(y-hp*16)}) scale(${sc.toFixed(3)}) rotate(${f1(-3*hp)})`;
      sh+=`<text transform="${tr} translate(0 9)" font-size="${SZ}" text-anchor="middle" dominant-baseline="central" fill="#000" stroke="#000" stroke-width="22" stroke-linejoin="round" opacity=".45">${esc(w.t)}</text>`;
      fg+=`<text transform="${tr}" font-size="${SZ}" text-anchor="middle" dominant-baseline="central" fill="${col}" stroke="#000" stroke-width="20" stroke-linejoin="round" paint-order="stroke">${esc(w.t)}</text>`})});
  return g(T(540,cy+(1-E.out(k))*26,c.sc*lerp(.82,1,E.back(k))),sh+fg,`opacity="${cl(k*2.5)}"`)}
// ---------- composition
const VID={};let CAPS={};
function initAll(){for(const v of[1,2,3])CAPS[v]=buildCaps(TIMINGS[v])}
function sceneSVG(sc,t){const r=sc.f(t),c=Object.assign({x:540,y:960,z:1,r:0},r.cam||{});
  return g(`translate(540 960) rotate(${f1(c.r)}) scale(${c.z.toFixed(4)}) translate(${f1(-c.x)} ${f1(-c.y)})`,rect(-3000,-3000,7080,7920,r.bg||C.navy)+r.svg)}
function frameSVG(v,t){const V=VID[v],S=V.scenes,h=.15;let i=S.findIndex(s=>t<s.b);if(i<0)i=S.length-1;let out='';
  const panel=(sc,dx,dy,z=1,op=1)=>g(`translate(${f1(dx)} ${f1(dy)}) translate(540 960) scale(${z.toFixed(4)}) translate(-540 -960)`,sceneSVG(sc,t),`clip-path="url(#fr)" opacity="${op}"`);
  let a=null,k=0; // transition between a and a+1
  if(i<S.length-1&&t>S[i].b-h){a=i;k=pr(t,S[i].b-h,S[i].b+h)}else if(i>0&&t<S[i].a+h){a=i-1;k=pr(t,S[i].a-h,S[i].a+h)}
  if(a==null)out=panel(S[i],0,0);else{const e=E.io(k),tr=S[a+1].tr||'left',d={left:[-1,0],right:[1,0],up:[0,-1],down:[0,1]}[tr];
    if(d)out=panel(S[a],d[0]*1080*e,d[1]*1920*e)+panel(S[a+1],-d[0]*1080*(1-e),-d[1]*1920*(1-e));
    else out=panel(S[a+1],0,0,lerp(.7,1,e))+(e<1?panel(S[a],0,0,1+e*2.2,1-e):'')}
  return`<defs><clipPath id="fr"><rect width="1080" height="1920"/></clipPath></defs><rect width="1080" height="1920" fill="#000"/>`+out+(V.over?V.over(t):'')+partTag(V.part)+capsSVG(CAPS[v],t)}
function render(v,t){document.getElementById('stage').innerHTML=frameSVG(v,t)}
function sfxList(v){const V=VID[v];return V.scenes.slice(1).map(s=>[s.a,'whoosh']).concat(V.sfx||[])}
