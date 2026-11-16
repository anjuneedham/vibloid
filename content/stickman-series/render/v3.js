'use strict';
// VIDEO 3 - "The 3-step habit that ended my one-more-trade spiral"
const slotM=(t,sh=0)=>{const x=80+sh,y=650;let s=shadow(x+150,190,FLOOR,.35)+line(x+300,y+250,x+352,y+250,C.ink,16)+line(x+352,y+250,x+352,y+150,C.ink,16)+circ(x+352,y+140,26,C.red,{st:C.ink,sw:8})
   +rect(x,y+70,300,400,C.navy,{r:26,st:C.ink,sw:11})+rect(x+16,y,268,104,C.yellow,{r:20,st:C.ink,sw:10})+txt('ONE MORE',x+150,y+34,36,C.ink)+txt('TRADE',x+150,y+72,36,C.red)
   +rect(x+26,y+140,248,120,C.white,{r:14,st:C.ink,sw:8})+rect(x+60,y+320,180,70,C.night,{r:14,st:C.ink,sw:8});
  for(let i=0;i<3;i++){const cx=x+68+i*82,up=Math.floor(t*8+i*1.7)%3==0,off=((t*8+i*1.7)%1-.5)*26;s+=(i?line(cx-41,y+146,cx-41,y+254,C.ink,6):'')+line(cx,y+166+off,cx,y+234+off,up?C.green:C.red,6)+rect(cx-15,y+180+off,30,40,up?C.green:C.red,{r:5})}
  for(let i=0;i<5;i++)s+=circ(x+50+i*50,y+292,9,(Math.floor(t*6)+i)%2?C.yellow:C.red);return s};
const scissors=(x,y,r,open,s=1)=>g(T(x,y,s,r),[1,-1].map(d=>g(`rotate(${f1(d*open)})`,path(`M14 ${-d*16}L-190 ${-d*3}L14 ${d*24}Z`,'#DDE3F0',{st:C.ink,sw:8})+line(0,0,70,d*34,C.ink,18)+circ(108,d*52,34,'none',{st:C.ink,sw:26})+circ(108,d*52,34,'none',{st:C.red,sw:12}))).join('')+circ(0,0,10,C.ink));
const ticket=(x,gy,label,col,ok,t,rot=0,dizzy=0,walk=1)=>g(T(x,gy,1,rot),line(-22,-44,-22+wob(t,5,14)*walk,0,C.ink,10)+line(22,-44,22-wob(t,5,14)*walk,0,C.ink,10)+rect(-72,-214,144,174,C.white,{r:18,st:C.ink,sw:8})
  +(dizzy?line(-34,-178,-14,-158,C.ink,6)+line(-14,-178,-34,-158,C.ink,6)+line(14,-178,34,-158,C.ink,6)+line(34,-178,14,-158,C.ink,6):circ(-24,-168,8,C.ink)+circ(24,-168,8,C.ink))
  +path(dizzy?'M-16 -136q16 -12 32 0':'M-16 -140q16 12 32 0',null,{st:C.ink,sw:6})+(ok?line(-48,-108,48,-108,col,7,{dash:'12 9'}):'')+txt(label,0,-76,25,col)+(ok?circ(62,-204,24,C.green,{st:C.ink,sw:6})+path('M50 -204l9 9l15 -17',null,{st:'#fff',sw:6}):''));
const bookmark=(x,y,s,r=0)=>g(T(x,y,s,r),path('M-44 -66H44V66L0 30L-44 66Z',C.yellow,{st:C.ink,sw:10}));
const mnote=(x,y,s,op)=>g(T(x,y,s,-8),ell(0,0,16,12,C.ink)+line(15,0,15,-56,C.ink,7)+path('M15 -56q22 4 24 26',null,{st:C.ink,sw:7}),`opacity="${op}"`);
const stepB=(t,a,b,n,s)=>{const k=pop(t,a,.35)*(1-E.in(pr(t,b-.18,b)));if(k<=0)return'';const size=Math.min(56,56*690/mw(s,56));return g(T(540,356,1,0,k),rect(-462,-54,940,124,'#000',{r:30,op:.3})+rect(-470,-62,940,124,C.ink,{r:30,st:C.yellow,sw:6})+circ(-392,0,48,C.yellow)+txt(n,-392,3,70,C.ink)+txt(s,-318,3,size,C.white,{a:'start'}))};
const end3=(t,a)=>{const k=pop(t,a,.4);if(k<=0)return'';const b=Math.abs(Math.sin(t*6.5))*-30;return g(T(540,452,k,-1.5),rect(-462,-160,940,336,'#000',{r:40,op:.35})+rect(-470,-168,940,336,C.ink,{r:40,st:C.yellow,sw:9})+bookmark(-355,-30+b,1.5,-6)
  +txt('SAVE THIS',70,-96,96,C.white)+txt('FOR FRIDAY',70,2,96,C.yellow)+g(T(70,104,pop(t,a+.3,.3)*(1+.04*Math.sin(t*11))),pill('LINK IN BIO',-30,0,44,C.green,C.ink,{py:1.5})+arrow(190+Math.abs(Math.sin(t*6.5))*14,2,74,-90,C.green,14)))};
const slotScene=(t,loop)=>{const SN=.9,cut=!loop&&t>=SN,jk=cut?pr(t,SN,1.45):0,land=!loop&&t>=1.45;
  let s=floor()+g(T(cut?wob(t,14,7):0,0),slotM(t));
  const mx=loop?720+wob(t,3,8):cut?lerp(700,820,E.out(jk)):700+wob(t,6,5),jy=cut?-Math.sin(jk*3.14)*190-(land?Math.abs(Math.sin((t-1.45)*9))*40:0):0;
  const man=loop?stick({x:mx,ground:FLOOR,s:.92,pose:ps({lean:24,lL:[-34,10],lR:[30,-6],aL:[40,80],aR:[70,100]}),face:fc('strain',{sweat:1})})
    :cut?stick({x:mx,ground:FLOOR+jy,s:1.02,pose:mixP({lean:10},'cheer',pr(t,SN,1.1)),face:fc('happy')})
    :stick({x:mx,ground:FLOOR,s:1.02,flip:-1,pose:ps({lean:52,lL:[-20,6],lR:[24,-4]}),face:fc('strain',{sweat:1,lx:.5,ly:.8}),reachR:{x:618,y:1012},reachL:{x:640,y:1070},bendR:-1,bendL:-1});
  const ax=loop?mx-55:cut?mx-10:mx+12,ay=FLOOR-12+jy;
  const ch=d=>path(d,null,{st:C.white,sw:26})+path(d,null,{st:C.ink,sw:15,dash:'2 24'});
  if(!cut)s+=ch(`M378 1086Q${f1((378+ax)/2)} ${loop?1092:1128+wob(t,6,6)} ${f1(ax)} ${f1(ay)}`);
  else s+=ch(`M378 1086Q420 ${f1(lerp(1120,1150,jk))} 470 1112`)+ch(`M${f1(ax)} ${f1(ay)}q-40 ${f1(30+jk*20)} -90 ${f1(lerp(10,60,jk))}`);
  s+=circ(ax,ay,20,'none',{st:C.ink,sw:11})+shadow(mx,100)+man.svg;
  if(!loop){const fk=pr(t,SN+.05,1.5);if(fk<1)s+=scissors(lerp(590,480,fk),lerp(1056,400,E.out(fk))+(fk>0?Math.pow(fk,2)*500:0),-18+fk*700,kf(t,[[0,26],[.25,30],[.78,30],[SN,0,'in']]),1.05);
    s+=impact(t,SN,485,1108,C.white,170,12);if(land)for(let i=0;i<4;i++)s+=star(mx+[-170,150,-120,190][i],[640,600,820,790][i],22+10*Math.sin(t*9+i),C.yellow,4,.35,t+i)}
  else s+=g(T(735,690,pop(t,24.0,.35),-3),pill('BACK TO STEP 1',0,0,44,C.yellow,C.ink,{st:C.ink,sw:7,r:18}));
  return s};
VID[3]={part:3,dur:25.3,
 sfx:[[.9,'pop'],[1.45,'thud'],[2.62,'pop'],[4.68,'thud'],[5.3,'pop'],[5.84,'pop'],[7.4,'pop'],[7.7,'pop'],[8.62,'pop'],[9.04,'pop'],[10.3,'pop'],[12.5,'pop'],[15.12,'thud'],[16.2,'pop'],[17.8,'pop'],[19.05,'pop'],[20.64,'pop'],[21.46,'pop'],[22.55,'whoosh'],[22.85,'pop'],[24.02,'pop']],
 over:t=>hookSVG(t,[{s:'THE 3-STEP HABIT',bg:C.yellow,fg:C.ink,at:.03,size:96},{s:'THAT ENDED MY',bg:C.white,fg:C.ink,at:.18,size:64},{s:"'ONE MORE TRADE'",bg:C.ink,fg:C.white,at:.34,size:92}],2.56)
   +stepB(t,2.62,5.72,'1','LOG EVERY TRADE + ITS STOP')+stepB(t,5.8,8.94,'2','TAG EVERY MISTAKE')+stepB(t,9.02,12.94,'3','FRIDAY: FILTER + CALENDAR')
   +(t>17.3?discl('Fictional dramatization - not financial advice',28,1604,.8*pr(t,17.3,17.7)):'')+disclPill('Not financial advice. Results vary.',t,18.8,22.3)+end3(t,22.8),
 scenes:[
 {a:0,b:2.52,f:t=>{const sk=shk(t,.9,18,.3),s2=shk(t,1.45,14,.25);return{bg:'#C4283A',svg:slotScene(t,0),cam:{z:kf(t,[[0,1.4],[.4,1,'out'],[.9,1.03,'lin'],[1.1,1],[2.5,1.06,'lin']]),x:kf(t,[[0,560],[.4,540,'out']])+sk[0]+s2[0],y:kf(t,[[0,1020],[.4,960,'out']])+sk[1]+s2[1]}}}},
 // step 1: bouncer - no stop, no trade
 {a:2.52,b:5.72,tr:'left',f:t=>{const B=4.68,deny=t>=B,fl=pr(t,5.2,5.6);
   let s=floor()+rect(650,440,600,680,'#1F2C7A')+rect(700,548,250,572,C.night,{r:12,st:C.ink,sw:10})+circ(735,850,13,C.yellow)+g(T(825,494),pill('CLUB JOURNAL',0,0,40,C.ink,(Math.floor(t*4)%2)?C.yellow:C.white,{st:C.yellow,sw:5,r:14}));
   const wave=pr(t,3.15,3.4)*(1-pr(t,4.25,4.45)),palm=pr(t,4.5,B);
   const man=stick({x:590,ground:FLOOR,s:1.2,flip:-1,pose:mixP({aL:[26,-80],aR:[-26,80],lean:0},{aL:[26,-80],aR:[-26,80],lean:10},palm),face:fc({e:'shades',bl:0,br:0,mc:deny?-.7:wave>0?.7:-.2,mw:16}),headExtra:rect(-46,-24,92,28,C.ink,{r:9})+rect(-40,-20,22,6,'#fff',{op:.5,r:3}),
     reachL:wave>0?{x:lerp(600,700,wave),y:lerp(820,790+wob(t,4,14),wave)}:null,reachR:palm>0?{x:lerp(560,440,E.back(palm)),y:lerp(800,765,palm)}:null,bendR:-1});
   s+=shadow(590,115)+man.svg;
   const x1=kf(t,[[2.7,-120],[4.3,830,'lin']]),o1=1-pr(t,4.2,4.4);if(o1>0)s+=g(T(0,0),ticket(x1,FLOOR-Math.abs(wob(t,5,10)),'STOP',C.dgreen,1,t),`opacity="${o1}"`);
   const x2=deny?lerp(lerp(378,300,E.out(pr(t,B,B+.25))),-300,E.in(fl)):kf(t,[[4.0,-120],[B,378,'lin']]);
   s+=ticket(x2,FLOOR-(deny?Math.sin(pr(t,B,B+.25)*3.14)*50+Math.sin(fl*3.14)*320:Math.abs(wob(t,5,10))),'NO STOP',C.red,0,t,deny?lerp(-14,-500,fl):0,deny,deny?0:1)+impact(t,B,430,790,C.white,130,10);
   if(deny)for(let i=0;i<3;i++){const a=t*6+i*2.1;if(fl<=0)s+=star(x2+Math.cos(a)*90,FLOOR-250+Math.sin(a)*20,18,C.yellow,5,.45,a)}
   const dk=t>=5.2?kf(t,[[5.2,3],[5.3,1,'in'],[5.36,1.1],[5.44,1]]):0;if(dk>0)s+=stamp('DENIED',300,700,84,-9,dk,C.red)+impact(t,5.3,300,700,C.red,250,12);
   const sk=shk(t,B,18,.3),s2=shk(t,5.3,24,.35);
   return{bg:'#2A3C9E',svg:s,cam:{z:kf(t,[[2.52,1.04],[4.4,1.0,'lin'],[B,1.08,'out'],[5.7,1.05]]),x:kf(t,[[2.52,560],[4.4,560],[B,500,'out']])+sk[0]+s2[0],y:960+sk[1]+s2[1]}}}},
 // step 2: tag every mistake (one sticks to his butt)
 {a:5.72,b:8.94,tr:'left',f:t=>{const th=[[7.38,'REVENGE',C.red,C.white,470],[7.68,'FOMO',C.ink,C.white,690],[8.32,'MOVED STOP',C.yellow,C.ink,910]],BT=8.62;
   let s=floor()+rect(368,482,660,440,'#000',{r:26,op:.2})+rect(360,470,660,440,'#D9C9A3',{r:26,st:C.ink,sw:10});
   th.forEach((h,i)=>{const k=pop(t,5.9+i*.2,.35),hk=shk(t,h[0]+.16,9,.25);if(k>0)s+=g(T(h[4]+(i<2?hk[0]:0),690+(i<2?hk[1]:0),k,[-3,2,-2][i]),rect(-88,-150,176,300,C.white,{r:16,st:C.ink,sw:8})+circ(0,-128,10,C.red,{st:C.ink,sw:4})+candles(-66,-96,132,120,[[.9,.7],[.7,.75],[.75,.45],[.45,.2]],4)+txt('LOSS',0,58,30,C.red))});
   let sw=0;th.forEach(h=>{sw+=Math.sin(pr(t,h[0]-.12,h[0]+.14)*3.14)});const bt=pr(t,BT,BT+.15);
   const man=stick({x:210,ground:FLOOR,s:1.15,pose:mixP({lean:6+sw*8,aL:[-24,-60]},{lean:-4,aL:[-50,-100],aR:[30,70],head:-10},bt),face:mixF(mixF({...FACE.happy,lx:1},{...FACE.angry,lx:1,grit:0,mc:.6},sw),{...FACE.confused,lx:-1,ly:.8},bt),reachR:bt>0?null:{x:300+sw*60,y:760-sw*70},bendR:-1});
   s+=shadow(210,110)+man.svg;const hx=300,hy=740;
   th.forEach((h,i)=>{if(t<h[0])return;const k=pr(t,h[0],h[0]+.16);
     if(i<2)s+=tag(h[1],lerp(hx,h[4],k),lerp(hy,790,k)-Math.sin(k*3.14)*70,30,h[2],h[3],lerp(-40,[-4,3][i],k)+ (k<1?k*360:0),k<1?1:1+.3*(1-E.out(pr(t,h[0]+.16,h[0]+.4))))+impact(t,h[0]+.16,h[4],790,C.ink,140,10);
     else{const q=pr(t,h[0],BT),bx=man.hip.x-62,byy=man.hip.y+4;s+=tag(h[1],q<1?lerp(hx,bx,q)+Math.sin(q*3.14)*560:bx,q<1?lerp(hy,byy,q)-Math.sin(q*3.14)*230:byy,30,h[2],h[3],q<1?q*900:14,q<1?1:.72+.25*(1-E.out(pr(t,BT,BT+.3))))+impact(t,BT,bx,byy,C.ink,130,10)}});
   if(bt>0)s+=g(T(man.head.x+50,man.head.y-110,pop(t,BT+.05,.3),10),txt('?!',0,0,90,C.red,{st:C.ink,sw:14}));
   return{bg:C.white,svg:s,cam:{z:kf(t,[[5.72,1.05],[7.3,1.0,'lin'],[BT,1.0],[BT+.15,1.14,'out']]),x:kf(t,[[BT,540],[BT+.15,400,'out']])+shk(t,BT,12,.25)[0],y:kf(t,[[BT,960],[BT+.15,990,'out']])}}}},
 // step 3: Friday calendar review
 {a:8.94,b:12.94,tr:'up',f:t=>{const x0=310,y0=440,w=710,h=612,F=10.3,on=t>=F,gx=x0+36,gy=y0+250;
   const st='GGRGNGRGRRNGGRRGGRGG',rev=[8,9,13,14];
   let u=txt('Month view',x0+40,y0+146,42,C.ink,{a:'start'})+g(T(x0+w-150,y0+146,on?1+.25*(1-E.out(pr(t,F,F+.3))):1),rect(-116,-30,232,60,on?C.red:'#fff',{r:30,st:C.ink,sw:5})+txt('Tag: Revenge',0,1,28,on?C.white:C.ink))+impact(t,F,x0+w-150,y0+146,C.red,150,10);
   'MTWTF'.split('').forEach((d,i)=>{u+=txt(d,gx+59+i*130,y0+218,30,i==4&&t>9.5?C.red:'#6B6F82')});
   for(let i=0;i<20;i++){const c=i%5,r=Math.floor(i/5),k=pop(t,9.05+(c+r)*.06,.3),col={G:C.green,R:C.red,N:'#D5CFC0'}[st[i]],dim=on&&!rev.includes(i)?lerp(1,.28,pr(t,F,F+.3)):1;
     if(k>0)u+=g(T(gx+59+c*130,gy+37+r*86,k),rect(-59,-37,118,74,col,{r:14,st:C.ink,sw:5})+txt(String(i+1),-44,-17,22,C.ink,{a:'start',w:800})+(on&&rev.includes(i)?g(T(18,10,pop(t,F+.1+i*.02,.3)),circ(0,0,17,C.white,{st:C.ink,sw:4})+path('M-8 -6h10l8 6l-8 6h-10Z',C.red)):''),`opacity="${dim}"`)}
   const fk=pr(t,9.5,9.7)*(1-pr(t,10.9,11.2));if(fk>0)u+=rect(gx+4*130-8,y0+194,134,gy+4*86-y0-194,'none',{r:20,st:C.yellow,sw:10,op:fk});
   const ck=pr(t,11.45,12.5),ecx=gx+3.5*130+59-65+65,ecy=gy+2*86-6,rx=165,ry=112;
   if(ck>0)u+=`<ellipse cx="${ecx}" cy="${ecy}" rx="${rx}" ry="${ry}" fill="none" stroke="${C.ink}" stroke-width="20" stroke-linecap="round" stroke-dasharray="${f1(ck*890)} 2000" transform="rotate(-8 ${ecx} ${ecy})"/><ellipse cx="${ecx}" cy="${ecy}" rx="${rx}" ry="${ry}" fill="none" stroke="${C.yellow}" stroke-width="11" stroke-linecap="round" stroke-dasharray="${f1(ck*890)} 2000" transform="rotate(-8 ${ecx} ${ecy})"/>`;
   let s=floor()+g(T(0,lerp(800,0,E.back(pr(t,8.9,9.3)))),uiCard(x0,y0,w,h,u,'Calendar'))+sample(x0+w/2,1090,pr(t,9.2,9.5));
   const an=ck*6.2832-8*RAD,tx=ck>0?ecx+Math.cos(an)*rx:kf(t,[[9.3,420],[9.6,x0+4*130+95,'io'],[10.1,x0+4*130+95],[F,x0+w-220,'io'],[11.3,ecx+rx,'io']]),ty=ck>0?ecy+Math.sin(an)*ry:kf(t,[[9.3,900],[9.6,y0+214,'io'],[10.1,y0+214],[F,y0+160,'io'],[11.3,ecy,'io']]);
   const man=stick({x:150,ground:FLOOR,s:1.05,pose:ps({aL:[-14,-8],lean:5}),face:mixF({...FACE.neutral,lx:1,ly:-.3,mc:.6},{...FACE.worried,lx:1},pr(t,11.6,12.0)),reachR:{x:260,y:lerp(820,ty+60,.3)},bendR:-1});
   s+=shadow(150,100)+man.svg+line(man.hR.x,man.hR.y,tx,ty,C.ink,20)+line(man.hR.x,man.hR.y,tx,ty,C.yellow,10)+circ(tx,ty,13,C.red,{st:C.ink,sw:6});
   return{bg:C.navy,svg:s,cam:{z:kf(t,[[8.94,1],[11.3,1.02,'lin'],[12.5,1.06,'io']]),x:kf(t,[[11.3,540],[12.5,600]]),y:kf(t,[[11.3,960],[12.5,945]])}}}},
 // one rule on a sticky note
 {a:12.94,b:15.78,tr:'left',f:t=>{const SL=15.02,fly=E.io(pr(t,SL-.02,SL+.12)),stuck=t>=SL+.12,wk=pr(t,15.25,15.78);
   const nx=lerp(450,770,fly),ny=lerp(540,735,fly),nk=pop(t,13.0,.35),off=stuck;
   let s=floor()+desk(500,930,560)+monitor(560,590,420,290,off?rect(576,606,388,258,'#05060D',{r:10}):candles(590,640,360,190,[[.5,.6],[.6,.4],[.4,.5],[.5,.3],[.3,.42],[.42,.2]],6)+pill('ONE MORE?',770,628,24,C.red,C.white));
   const rev=(str,a,b)=>str.slice(0,Math.round(pr(t,a,b)*str.length));
   const note=g(T(nx,ny,nk*lerp(1,.86,fly),lerp(-5,4,fly)),rect(-162,-152,340,320,'#000',{r:6,op:.25})+rect(-170,-160,340,320,C.yellow,{r:6,st:C.ink,sw:8})+rect(-60,-176,120,34,C.white,{op:.75})
     +txt(rev('MY ONE RULE:',13.1,13.65),-140,-100,34,C.ink,{a:'start',w:800})+txt(rev('1 REVENGE TAG',14.22,14.86),-140,-22,38,C.red,{a:'start'})+txt(rev('= DONE',14.88,15.0),-140,60,74,C.ink,{a:'start'})+txt(stuck?'FOR THE DAY':'',-140,124,30,C.ink,{a:'start',w:800}));
   const wr=t<SL-.05?{x:nx-130+((t*210)%250),y:ny+(t<13.7?-100:t<14.88?-22:60)+wob(t,11,10)}:null,walk=wk>0;
   const man=stick({x:lerp(240,-140,E.in(wk)),ground:FLOOR,s:1.2,flip:walk?-1:1,pose:walk?ps(walkPose(t*3.2)):mixP({lean:4},{lean:16,aL:[-20,-30]},Math.sin(pr(t,SL-.1,SL+.25)*3.14)),face:walk?fc({e:'line',mc:0,mo:.5,mw:7,bh:4}):mixF({...FACE.neutral,lx:1,ly:-.4,mc:.6},{...FACE.happy,lx:1},pr(t,SL,SL+.1)),
     reachR:walk?null:wr||{x:lerp(420,560,fly),y:lerp(640,760,fly)},reachL:walk||t>SL?null:{x:300,y:690},bendR:-1,bendL:1});
   s+=shadow(man.hip.x,115)+(stuck?note+man.svg:man.svg+note)+impact(t,SL+.12,770,735,C.white,250,12);
   if(walk)for(let i=0;i<3;i++){const k=((t-15.25)*1.5+i*.33)%1;s+=mnote(man.head.x-70-k*60+i*20,man.head.y-70-k*150,1+i*.2,1-k)}
   const sk=shk(t,SL+.12,20,.3);
   return{bg:C.dgreen,svg:s,cam:{z:kf(t,[[12.94,1.12],[14.9,1.16,'lin'],[SL+.12,1,'out']]),x:kf(t,[[12.94,460],[14.9,470],[SL+.12,540,'out']])+sk[0],y:kf(t,[[12.94,900],[14.9,900],[SL+.12,960,'out']])+sk[1]}}}},
 // mirror: pattern hard to ignore
 {a:15.78,b:18.72,tr:'right',f:t=>{const wv=pr(t,17.7,17.9),np=pop(t,16.16,.35)*(1-pr(t,17.0,17.15)),pt=pr(t,17.16,17.4),pk=wv>0?0:Math.abs(Math.sin(t*22));
   const refl=stick({x:800,ground:1085,s:.95,flip:-1,ol:'none',pose:mixP({lean:12,aL:[-30,-50]},{lean:0,aL:[-20,-10],aR:[150,170+wob(t,4,22)]},wv),face:wv>0?fc({e:'wide',bl:-14,br:-14,mc:.7,mw:20,sweat:1,blush:1}):fc('angry',{lx:1,ly:.5}),reachR:wv>0?null:{x:672,y:lerp(900,952,pk)}});
   let m=rect(500,380,500,760,'#A9C8F5')+path('M560 380L700 380L560 700Z','#fff',{op:.35})+rect(500,1085,500,60,'#7FA3D9')+rect(610,995,130,90,C.navy,{r:10,st:C.ink,sw:7})+bigBtn(675,978,120,'BUY',pk,C.green,C.ink,34)+refl.svg
     +(wv>0?'':steam(t,refl.head.x-56,refl.head.y-30,.6)+steam(t+.3,refl.head.x+56,refl.head.y-30,.6)+(pk>.8?burst(675,965,70,105,8,C.ink,7):''));
   let s=floor()+shadow(745,230,FLOOR,.3)+line(640,1040,600,FLOOR,C.ink,16)+line(850,1040,890,FLOOR,C.ink,16)+`<clipPath id="mir"><ellipse cx="745" cy="760" rx="195" ry="325"/></clipPath><g clip-path="url(#mir)">${m}</g>`+ell(745,760,195,325,'none',{st:C.ink,sw:34})+ell(745,760,195,325,'none',{st:C.yellow,sw:18});
   const man=stick({x:290,ground:FLOOR,s:1.2,pose:mixP(mixP('shrug',{aL:[-14,-8],lean:6},pt),{aL:[-14,-8],lean:-6},wv),face:mixF(mixF({...FACE.neutral,mc:-.2,bl:-10,br:-10},{...FACE.neutral,lx:1,mc:0},pt),{...FACE.worried,lx:1},wv),reachR:pt>0?{x:lerp(380,450,pt),y:lerp(800,740,pt)}:null,bendR:-1});
   s+=shadow(290,115)+man.svg;if(np>0)s+=g(T(290,520,np,-4),pill('NO PROMISES',0,0,50,C.red,C.white,{st:C.ink,sw:8,r:20,py:1.5}));
   if(wv>0)s+=g(T(905,430,pop(t,17.8,.3),8),pill('...hi.',0,0,44,C.white,C.ink,{st:C.ink,sw:6,r:20}));
   return{bg:'#1A2350',svg:s,cam:{z:kf(t,[[15.78,1.03],[17.1,1.0,'lin'],[17.4,1.08,'io'],[17.7,1.08],[17.9,1.2,'out'],[18.7,1.24,'lin']]),x:kf(t,[[17.1,540],[17.4,600,'io'],[17.7,600],[17.9,690,'out']]),y:kf(t,[[17.7,960],[17.9,930,'out']])}}}},
 // I built TradeNotes, so I'm biased
 {a:18.72,b:22.3,tr:'up',f:t=>{const wm=pop(t,19.0,.4),sh=pr(t,19.6,19.85)*(1-pr(t,20.45,20.65)),lk=pop(t,20.62,.35),sv=pop(t,21.44,.35),bb=Math.abs(Math.sin(t*7));
   const man=stick({x:540,ground:FLOOR,s:1.3,pose:mixP(mixP(mixP({aL:[-14,-8],aR:[60,150]},'shrug',E.back(sh)),{aL:[-110,-125],aR:[16,8]},cl(lk)),{aL:[-110,-125],aR:[110,125]},cl(sv)),
     face:mixF(mixF({...FACE.happy},{e:'line',bl:-14,br:-14,mc:.6,mw:18,sweat:1,blush:1},sh),{...FACE.happy},cl(lk))});
   let s=floor()+shadow(540,135)+man.svg+g(T(man.sh.x+34,man.sh.y+58,1,-10),star(0,0,50,C.red,12,.84)+circ(0,0,36,C.white,{st:C.ink,sw:4})+txt('I MADE',0,-9,15,C.ink)+txt('THIS',0,10,17,C.red));
   if(wm>0)s+=g(T(540,425,wm*(1+.02*Math.sin(t*8)),-3),rect(-312,-72,640,160,'#000',{r:36,op:.3})+rect(-320,-80,640,160,C.white,{r:36,st:C.ink,sw:10})+wordmark(-262,0,72));
   if(sh>.3)s+=g(T(800,650,pop(t,19.7,.3),6),pill('(biased)',0,0,46,C.ink,C.yellow,{r:20}));
   if(lk>0)s+=g(T(215,640,lk,-4),pill('LINK IN BIO',0,0,46,C.ink,C.white,{r:20,py:1.6}))+arrow(215,770+bb*30,120,0,C.ink,24);
   if(sv>0)s+=bookmark(860,660-bb*40,sv*1.6,6)+g(T(860,810,sv),pill('SAVE',0,0,46,C.ink,C.yellow,{r:20,py:1.6}));
   return{bg:C.yellow,svg:s,cam:{z:kf(t,[[18.72,1.08],[19.6,1.02,'lin'],[19.85,1.1,'out'],[20.6,1.04],[22.3,1.0,'lin']]),x:540,y:kf(t,[[19.6,960],[19.85,930,'out'],[20.6,960]])}}}},
 // Friday-you forgets
 {a:22.3,b:23.9,tr:'left',f:t=>{const fp=pr(t,22.5,22.8),sy=Math.abs(Math.cos(fp*3.1416)),fri=fp>.5;
   let s=floor()+circ(290,690,12,C.ink)+g(T(290,880,1,-2),rect(-152,-172,320,360,'#000',{r:18,op:.3})+rect(-160,-180,320,360,C.white,{r:18,st:C.ink,sw:10})+rect(-160,-180,320,90,C.red,{r:18,st:C.ink,sw:10})+txt('TODAY',0,-134,44,C.white)
     +g(T(0,48,1,0,Math.max(.02,sy)),txt(fri?'FRI':'THU',0,0,150,fri?C.red:C.ink)));
   const man=stick({x:740,ground:FLOOR,s:1.0,pose:ps({aL:[-30,-110],head:10}),face:fc('confused',{lx:-.6,ly:-.3}),reachR:{x:770+wob(t,3,16),y:FLOOR-470},bendR:1});
   s+=shadow(740,95)+man.svg+g(T(900,800,pop(t,23.28,.3),12),txt('?',0,0,150,C.yellow,{st:C.ink,sw:18}))+g(T(940,860,pop(t,23.45,.3),-8),txt('?',0,0,90,C.white,{st:C.ink,sw:12}));
   return{bg:C.navy,svg:s,cam:{z:kf(t,[[22.3,1.04],[23.9,1.0,'lin']])}}}},
 // loop back to the slot machine
 {a:23.9,b:25.5,tr:'right',f:t=>({bg:'#C4283A',svg:slotScene(t,1),cam:{z:kf(t,[[23.9,1.0],[25.3,1.05,'lin']])}})}
 ]};
