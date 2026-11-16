'use strict';
// VIDEO 2 - "I tagged my bad trades. I was the problem."
const labelGun=(x,y,s,r)=>g(T(x,y,s,r),path('M-44 6L-64 96H-14L4 6Z',C.yellow,{st:C.ink,sw:9})+path('M6 12q4 34 34 30',null,{st:C.ink,sw:9})+rect(88,-40,30,40,C.ink,{r:6})+rect(-64,-54,156,66,C.yellow,{r:16,st:C.ink,sw:9})+circ(-28,-64,36,C.white,{st:C.ink,sw:9})+circ(-28,-64,10,C.ink)+rect(20,-36,50,14,C.ink,{r:7}));
const pips=n=>({1:[[0,0]],2:[[-1,-1],[1,1]],3:[[-1,-1],[0,0],[1,1]],5:[[-1,-1],[1,-1],[0,0],[-1,1],[1,1]],6:[[-1,-1],[1,-1],[-1,0],[1,0],[-1,1],[1,1]]}[n]);
const die=(x,y,sz,r,n)=>g(T(x,y,1,r),rect(-sz/2+6,-sz/2+8,sz,sz,'#000',{r:sz*.2,op:.25})+rect(-sz/2,-sz/2,sz,sz,'#fff',{r:sz*.2,st:C.ink,sw:9})+pips(n).map(p=>circ(p[0]*sz*.25,p[1]*sz*.25,sz*.085,C.ink)).join(''));
const jRow=(x,y,w,h,red,label,chip,chipCol,chipFg)=>rect(x,y,w,h,'#fff',{r:16,st:C.ink,sw:5})+rect(x,y,18,h,red?C.red:C.green,{r:8})+path(red?`M${x+44} ${y+h/2-9}h22l-11 18Z`:`M${x+44} ${y+h/2+9}h22l-11 -18Z`,red?C.red:C.green)+txt(label,x+84,y+h/2+2,30,C.ink,{a:'start',w:800})+(chip?g(T(x+w-24-(mw(chip,24)+34)/2,y+h/2),pill(chip,0,0,24,chipCol,chipFg||C.white,{py:1.6,px:1.3})):'');
const spot=(x,on)=>on<=0?'':path(`M${x-46} 240H${x+46}L${x+215} ${FLOOR+4}H${x-215}Z`,C.yellow,{op:.17*on})+ell(x,FLOOR+6,215,34,C.yellow,{op:.3*on})+rect(x-60,214,120,34,C.ink,{r:10})+rect(x-46,240,92,14,C.yellow,{op:on});
VID[2]={part:2,dur:23.25,
 sfx:[[.8,'thud'],[1.65,'whoosh'],[2.24,'thud'],[3.68,'pop'],[4.4,'whoosh'],[5.14,'pop'],[8.04,'pop'],[8.68,'pop'],[9.56,'pop'],[11.56,'pop'],[11.8,'whoosh'],[12.5,'pop'],[13.05,'thud'],[14.16,'thud'],[16.05,'whoosh'],[16.95,'pop'],[17.78,'pop'],[18.16,'thud'],[19.6,'pop'],[20.74,'pop'],[21.05,'pop'],[21.35,'pop']],
 over:t=>hookSVG(t,[{s:'TAGGED MY BAD TRADES.',bg:C.white,fg:C.ink,at:.03,size:92},{s:'FOUND THE PROBLEM: ME',bg:C.red,fg:C.white,at:.3,size:92}],2.66)+discl('Fictional dramatization'),
 scenes:[
 // 1 HOOK: tag boomerangs to forehead
 {a:0,b:2.62,f:t=>{const H=2.24,hit=t>=H,inx=kf(t,[[0,1150],[.3,770,'out']]);
   let s=floor()+line(150,930,110,FLOOR,C.ink,14)+line(420,930,460,FLOOR,C.ink,14)+rect(78,592,430,356,'#000',{r:26,op:.25})+rect(70,580,430,356,C.navy,{r:26,st:C.ink,sw:10})
     +candles(100,625,370,270,[[.9,.75],[.75,.8],[.8,.6],[.6,.45],[.45,.5],[.5,.3],[.3,.12]],kf(t,[[0,3],[1.4,7,'lin']]));
   const rt={x:kf(t,[[.3,720],[.55,740],[.78,512,'in'],[1.15,512],[1.4,690]]),y:kf(t,[[.3,640],[.55,520,'out'],[.78,760,'in'],[1.15,760],[1.4,900]])};
   const kb=hit?kf(t,[[H,0],[H+.1,1,'out'],[H+.5,.55]]):0,q=pr(t,1.55,1.75);
   const man=stick({x:inx,ground:FLOOR-Math.abs(Math.sin(pr(t,0,.3)*3.14))*70,s:1.15,flip:-1,pose:mixP(mixP({aL:[-30,-110],lean:8},{aL:[-40,-120],aR:[40,120],lean:0},pr(t,1.15,1.4)),{aL:[-70,-20],aR:[60,10],lean:-20,head:-14},kb),
     face:hit?fc('dead'):mixF(mixF({...FACE.angry,lx:1,grit:0,mc:.5},{...FACE.happy,lx:.6},pr(t,.8,.95)),{...FACE.confused,lx:1},q),reachR:t<1.4?rt:null});
   s+=shadow(inx,110)+man.svg;
   const hp={x:man.head.x-4,y:man.head.y-26};let tx,ty,tr,ts=1;
   if(t<.78){tx=man.hR.x-20;ty=man.hR.y;tr=-20}else if(t<1.62){tx=360;ty=760;tr=-6+(t>1.3?wob(t,7,7*pr(t,1.3,1.6)):0)}
   else if(!hit){const k=pr(t,1.62,H);tx=lerp(360,hp.x,k)-Math.sin(k*3.14)*150;ty=lerp(760,hp.y,k)-Math.sin(k*3.14)*190;tr=k*1080;ts=lerp(1,.66,k)}else{tx=hp.x;ty=hp.y;tr=-9;ts=.66}
   s+=tag('PROBLEM',tx,ty,46,C.red,C.white,tr,ts)+impact(t,.78,360,760,C.ink,170,12)+impact(t,H,hp.x,hp.y,C.ink,190,12);
   if(hit)for(let i=0;i<3;i++){const a=t*6+i*2.1;s+=star(man.head.x+Math.cos(a)*120,man.head.y-95+Math.sin(a)*24,22,C.white,5,.45,a)}
   const sk=shk(t,.78,16,.3),s2=shk(t,H,34,.45);
   return{bg:mixc(C.yellow,'#FF8A4A',hit?1-pr(t,H,H+.4):0),svg:s,cam:{z:kf(t,[[0,1.3],[.4,1,'out'],[1.6,1.04,'lin'],[H,1.04],[H+.12,1.2,'out'],[2.62,1.16]]),x:kf(t,[[0,760],[.4,540,'out'],[H,540],[H+.12,650,'out']])+sk[0]+s2[0],y:kf(t,[[H,960],[H+.12,900,'out']])+sk[1]+s2[1]}}}},
 // 2 logbook -> label gun upgrade
 {a:2.62,b:6.12,tr:'up',f:t=>{const toss=pr(t,4.34,4.8),get=kf(t,[[4.55,0],[5.12,1,'bounce']]),up=pr(t,5.12,5.4);
   const man=stick({x:540,ground:FLOOR,s:1.35,pose:mixP({aL:[-30,60],aR:[30,-60]},{aL:[-160,-175],aR:[160,175]},Math.max(E.out(pr(t,4.3,4.5)),0)),face:mixF(mixF({...FACE.neutral,ly:.5,mc:.5},{...FACE.shock,ly:-1},pr(t,4.4,4.6)),{...FACE.happy,ly:-.5},pr(t,5.0,5.2)),
     reachL:toss>0?null:{x:480,y:800},reachR:toss>0?null:{x:600,y:800},bendL:1,bendR:-1});
   const gy=lerp(-260,man.hR.y-150,get),gx=540;
   let s=floor()+(get>0?circ(gx,gy+30,330,C.yellow,{op:.14})+burst(gx,gy+20,170,230+wob(t,3,22),16,C.yellow,14,t*.7):'')+shadow(540,140)+man.svg;
   const bx=lerp(540,-200,toss),byy=lerp(790,500,toss)-Math.sin(toss*3.14)*330;
   if(toss<1)s+=g(T(bx,byy,1,toss*-560),rect(-95,-118,190,236,C.dgreen,{r:16,st:C.ink,sw:10})+rect(-95,-118,34,236,C.ink,{r:10})+rect(-40,-76,112,58,C.white,{r:10,st:C.ink,sw:6})+txt('LOG',16,-45,40,C.ink)+line(-36,20,66,20,C.ink,6,{op:.5})+line(-36,52,66,52,C.ink,6,{op:.5}));
   const b1=pop(t,3.66,.35)*(1-toss);if(b1>0)s+=g(T(775,640,b1,10),star(0,0,112,C.yellow,14,.82,t*.4)+txt('STEP',0,-26,40,C.ink)+txt('1',0,26,70,C.ink));
   if(t>4.5)s+=labelGun(gx-20,gy,1.5,lerp(-30,-12+wob(t,2,4),get));
   const u=pop(t,5.14,.35);if(u>0)s+=g(T(540,860,u*(1+.04*Math.sin(t*12)),-5),txt('UPGRADE!',0,0,124,C.yellow,{st:C.ink,sw:26}));
   return{bg:'#2A3C9E',svg:s,cam:{z:kf(t,[[2.62,1.1],[4.3,1.03,'lin'],[5.1,1.0],[5.3,1.1,'out'],[6.1,1.14,'lin']]),x:540,y:kf(t,[[4.3,980],[5.2,880,'io']])}}}},
 // 3 honest tags: label gun fires
 {a:6.12,b:9.98,tr:'left',f:t=>{const x0=430,y0=350,w=590,shots=[[8.02,'REVENGE',C.red,C.white],[8.66,'MOVED STOP',C.yellow,C.ink],[9.54,'FOMO',C.white,C.ink]];
   let u=txt('Bad trades',x0+40,y0+140,44,C.ink,{a:'start'});
   shots.forEach((sh,i)=>{const y=y0+190+i*150,k=E.back(pr(t,6.3+i*.2,6.65+i*.2)),hk=shk(t,sh[0]+.13,10,.25);
     u+=g(T((1-k)*700+hk[0],hk[1]),rect(x0+30,y,w-60,124,'#fff',{r:18,st:C.ink,sw:6})+rect(x0+30,y,20,124,C.red,{r:8})+txt('Trade 0'+(i+3),x0+74,y+40,34,C.ink,{a:'start'})+path(`M${x0+74} ${y+75}h22l-11 18Z`,C.red)+txt('LOSS',x0+106,y+84,26,C.red,{a:'start'})
       +(t<sh[0]+.13?rect(x0+250,y+30,w-310,64,'none',{r:14,st:'#B9B3A4',sw:5,x:'stroke-dasharray="14 10"'}):''))});
   let s=floor()+uiCard(x0,y0,w,650,u,'Journal')+sample(x0+w/2,1052,pr(t,6.4,6.7));
   let rec=0;shots.forEach(sh=>{rec+=t>=sh[0]?(1-pr(t,sh[0],sh[0]+.3)):0});const cock=Math.sin(pr(t,7.05,7.4)*3.14);
   const gx=330-rec*40,gyy=775-rec*14-cock*30,man=stick({x:175-rec*14,ground:FLOOR,s:1.1,pose:ps({lean:-rec*14+4,lL:[-16,-8],lR:[16,6]}),face:mixF({...FACE.angry,lx:1,grit:0,mc:.6,bl:16,br:16},{...FACE.happy,lx:1},rec),reachR:{x:gx-66,y:gyy+62},reachL:{x:gx-10,y:gyy+30},bendR:-1,bendL:-1});
   s+=shadow(175,105)+man.svg+labelGun(gx,gyy,1,-rec*26);
   shots.forEach((sh,i)=>{if(t<sh[0])return;const k=pr(t,sh[0],sh[0]+.13),ex=x0+250+(w-310)/2,ey=y0+190+i*150+62;
     s+=tag(sh[1],lerp(gx+120,ex,k),lerp(gyy-20,ey,k)-Math.sin(k*3.14)*50,30,sh[2],sh[3],lerp(-30,-3,k),k<1?1:1+.3*(1-E.out(pr(t,sh[0]+.13,sh[0]+.4))))+impact(t,sh[0]+.13,ex,ey,C.ink,150,10)+(k<1?burst(gx+125,gyy-20,24,70,7,C.yellow,9):'')});
   return{bg:C.navy,svg:s,cam:{z:kf(t,[[6.12,1.02],[7.9,1.06,'lin'],[9.5,1.1,'lin'],[9.98,1.12]]),x:kf(t,[[6.12,540],[9.5,575,'lin']]),y:940}}}},
 // 4 filter journal by mistake tag
 {a:9.98,b:13.22,tr:'up',f:t=>{const x0=330,y0=310,w=690,h=720,ck=11.56,on=t>=ck;
   let u=txt('Filter by mistake tag',x0+40,y0+132,28,'#6B6F82',{a:'start',w:800});let cx=x0+40;
   [['All',0],['Revenge',1],['FOMO',0],['Moved stop',0]].forEach(c=>{const cw=mw(c[0],27)+44,act=c[1]?on:!on;
     u+=g(T(cx+cw/2,y0+188,c[1]&&on?1+.25*(1-E.out(pr(t,ck,ck+.3))):1),rect(-cw/2,-27,cw,54,act?(c[1]?C.red:C.ink):'#fff',{r:27,st:C.ink,sw:5})+txt(c[0],0,1,27,act?C.white:C.ink));if(c[1])u+=impact(t,ck,cx+cw/2,y0+188,C.red,110,10);cx+=cw+12});
   const A=[[0,'Trade 01'],[1,'Trade 02','REVENGE',C.red],[0,'Trade 03'],[1,'Trade 04','FOMO',C.ink],[0,'Trade 05'],[1,'Trade 06','REVENGE',C.red]];
   for(let i=0;i<6;i++){const y=y0+238+i*76;if(!on||t<ck+.25){const k=on?1-pr(t,ck+.02*i,ck+.2+.02*i):E.out(pr(t,10.1+i*.06,10.4+i*.06));u+=g(T(x0+w/2,y+32,1,0,k),g(`translate(${-(x0+w/2)} ${-(y+32)})`,jRow(x0+34,y,w-68,64,A[i][0],A[i][1],A[i][2],A[i][3])),`opacity="${k}"`)}
     if(on){const k=pop(t,ck+.2+i*.07,.3);if(k>0)u+=g(T(x0+w/2,y+32,lerp(.6,1,k),0,k),g(`translate(${-(x0+w/2)} ${-(y+32)})`,jRow(x0+34,y,w-68,64,1,'Trade '+String(i*3+2).padStart(2,'0'),'REVENGE',C.red)))}}
   let s=floor()+uiCard(x0,y0,w,h,u,'Journal')+sample(x0+w/2,1070);
   const px=kf(t,[[10.2,900],[11.4,x0+196,'io']]),py=kf(t,[[10.2,980],[11.4,y0+204,'io']]),pc=1-.25*Math.sin(pr(t,ck-.08,ck+.12)*3.14);
   s+=g(T(px,py,1.5*pc),path('M0 0L0 44L12 33L21 52L30 48L21 30L36 30Z',C.white,{st:C.ink,sw:5}));
   const ha=pr(t,12.48,12.6)*(1-pr(t,12.8,12.9)),no=pr(t,12.84,13.06),jy=E.bounce(no);
   const man=stick({x:165,ground:FLOOR-Math.abs(Math.sin(t*20))*ha*26,s:1.1,pose:mixP(mixP({aR:[20,150],aL:[-12,-8]},{aL:[-30,-140],aR:[30,140]},ha),{aL:[-20,-10],aR:[20,10],lean:-6},no),face:mixF(mixF({...FACE.neutral,lx:1,ly:-.3},{...FACE.happy,lx:1},ha),{...FACE.shock,lx:1,mo:0,mc:0,mw:1},no),reachR:ha>0||no>0?null:{x:215,y:760},bendR:-1});
   s+=shadow(165,105)+man.svg;
   if(no>0){const mx=man.head.x+8,my=man.head.y+22,jb=lerp(my+10,FLOOR-18,jy);s+=rect(mx-26,my,52,jb-my,C.ink,{r:20})+rect(mx-12,jb-70,24,60,C.red,{r:12,op:pr(t,12.95,13.05)})+path(`M${mx-38} ${jb-16}q38 46 76 0`,C.white,{st:C.ink,sw:11})+impact(t,13.04,mx,FLOOR-10,C.white,110,8)}
   const sk=shk(t,13.04,14,.25);
   return{bg:C.dgreen,svg:s,cam:{z:kf(t,[[9.98,1],[11.4,1.05,'lin'],[ck,1.1,'out'],[12.4,1.04],[12.84,1.04],[13.0,1.12,'out']]),x:kf(t,[[11.4,560],[12.4,540],[12.84,540],[13.0,470,'out']])+sk[0],y:kf(t,[[12.84,950],[13.0,1000]])+sk[1]}}}},
 // 5a not bad luck
 {a:13.22,b:14.56,tr:'left',f:t=>{const X=14.14,roll=E.out(pr(t,13.22,13.75)),xk=t>=X-.08?kf(t,[[X-.08,3],[X,1,'in'],[X+.06,1.1],[X+.14,1]]):0;
   let s=floor()+shadow(640,230,FLOOR,.2)+die(lerp(1300,560,roll),FLOOR-110-Math.abs(Math.sin(roll*9.4))*(1-roll)*240,200,(1-roll)*-540-8,6)+die(lerp(1500,800,roll),FLOOR-90-Math.abs(Math.sin(roll*7.4+1))*(1-roll)*200,170,(1-roll)*-720+12,5);
   s+=g(T(690,640,pop(t,13.4,.3),-4),pill('BAD LUCK?',0,0,64,C.ink,C.yellow,{r:22,py:1.5}));
   if(xk>0)s+=g(T(690,960,xk,0),line(-190,-150,190,150,C.ink,70)+line(190,-150,-190,150,C.ink,70)+line(-190,-150,190,150,C.red,44)+line(190,-150,-190,150,C.red,44))+impact(t,X,690,960,C.red,330,14);
   const man=stick({x:230,ground:FLOOR,s:1.15,pose:ps({aL:[-14,-8],head:wob(t,3.2,10)}),face:fc('flat',{lx:.8,bl:-10,br:-10,mc:-.4}),reachR:{x:330+wob(t,3.2,34),y:640},bendR:-1});
   const sk=shk(t,X,30,.4);return{bg:C.white,svg:s+shadow(230,110)+man.svg,cam:{z:kf(t,[[13.22,1.04],[X,1.08,'lin'],[X+.1,1,'out']]),x:560+sk[0],y:960+sk[1]}}}},
 // 5b flashback: knew they were bad while clicking
 {a:14.56,b:16.48,tr:'zoom',f:t=>{const pk=Math.abs(Math.sin(t*22)),fl=pr(t,15.95,16.3);
   let s=floor()+rect(610,965,230,155,C.navy,{r:14,st:C.ink,sw:9})+bigBtn(725,940,210,'BUY',pk,C.green,C.ink,54);
   const man=stick({x:440,ground:FLOOR,s:1.3,pose:ps({lean:14,aL:fl>0?[lerp(-20,-140,E.out(fl)),lerp(-10,-100,E.out(fl))]:[-20,-10],lL:[-14,-6],lR:[18,4]}),face:fc('angry',{lx:1,ly:.5,sweat:1}),reachR:{x:722,y:lerp(790,908,pk)}});
   s+=shadow(440,125)+man.svg+(pk>.75?burst(725,925,120,170,9,C.yellow,9,.2):'');
   const ax=lerp(man.sh.x-78,-200,E.in(fl)),ay=lerp(man.sh.y-175,150,E.in(fl))-Math.sin(fl*3.14)*60,ang=stick({x:ax,y:ay,s:.42,ol:'none',rot:fl*-500,pose:ps({aL:[-50,-20],lL:[-6,0],lR:[6,0]}),face:fc(fl>0?'shock':'worried',{lx:1})});
   s+=g(T(ax,ay,1,fl*-500),ell(-46,-40,38,20,C.white,{st:C.ink,sw:6,x:''})+ell(46,-40,38,20,C.white,{st:C.ink,sw:6}))+ang.svg+g(T(ax,ay-150+wob(t,2,4),1,fl*-500),ell(0,0,34,10,'none',{st:C.yellow,sw:9}));
   if(fl<=0)s+=g(T(ax+78,ay-112,1,wob(t,6,14)),line(-10,40,-22,82,C.ink,9)+rect(-58,-40,116,80,C.red,{r:14,st:C.ink,sw:8})+txt('NO',0,3,56,C.white));
   [[14.8,560,640],[15.3,860,700],[15.75,600,560]].forEach(([a,x,y],i)=>{const k=pr(t,a,a+.45);if(k>0&&k<1)s+=g(T(x,y-k*60,pop(t,a,.2),i%2?10:-12),txt('CLICK!',0,0,58,C.yellow,{st:C.ink,sw:14,op:1-E.in(k)}))});
   s+=g(T(820,330,1,3),pill('FLASHBACK',0,0,40,C.ink,C.white,{st:C.white,sw:4,r:14}))+rect(-3000,-3000,7080,3210,'#000',{op:.35})+rect(-3000,1500,7080,3000,'#000',{op:.35});
   const sk=shk(t,14.6,10,1.9);
   return{bg:'#8E1424',svg:s,cam:{z:kf(t,[[14.56,1.12],[16.48,1.2,'lin']]),x:570+sk[0]*.4,y:930+sk[1]*.4,r:-2}}}},
 // 6 not the market, not the firm, me
 {a:16.48,b:19.24,tr:'left',f:t=>{const o1=pr(t,16.5,16.62),n1=pop(t,16.92,.3),o2=pr(t,17.36,17.48),n2=pop(t,17.76,.3),o3=pr(t,18.1,18.2),cl2=t>18.8?Math.abs(Math.sin(t*24)):0;
   const d1=1-.65*pr(t,17.3,17.5),d2=1-.65*pr(t,18.05,18.25);
   let s=floor()+spot(190,o1*d1)+spot(520,o2*d2)+spot(860,o3);
   s+=g(T(0,0),line(120,900,100,FLOOR,C.ink,12)+line(260,900,280,FLOOR,C.ink,12)+rect(70,640,240,270,C.navy,{r:20,st:C.ink,sw:9})+path('M95 860l40 -70l35 40l45 -110l35 60l35 -90',null,{st:C.green,sw:10})+g(T(190,600),pill('THE MARKET',0,0,32,C.white,C.ink,{st:C.ink,sw:5})),`opacity="${.35+.65*o1*d1}"`);
   let b=rect(410,560,220,560,C.white,{st:C.ink,sw:10,r:8})+rect(480,1020,80,100,C.ink,{r:6});for(let i=0;i<12;i++)b+=rect(436+(i%3)*62,670+Math.floor(i/3)*82,44,54,C.navy,{r:6});
   s+=g(T(0,0),b+g(T(520,612),pill('THE FIRM',0,0,32,C.ink,C.white)),`opacity="${.35+.65*o2*d2}"`);
   if(n1>0)s+=stamp('',190,800,40,-10,n1,C.dgreen,['NOT','GUILTY']);if(n2>0)s+=stamp('',520,830,40,8,n2,C.dgreen,['NOT','GUILTY']);
   s+=rect(700,1010,150,110,C.navy,{r:12,st:C.ink,sw:8})+bigBtn(775,990,140,'BUY',cl2,C.green,C.ink,40);
   const man=stick({x:910,ground:FLOOR,s:1.0,flip:-1,pose:ps({lean:10,aL:[-30,-60]}),face:o3>0?(t>18.8?fc('angry',{lx:.6}):fc('worried',{sweat:1,lx:0})):fc('angry',{lx:1}),reachR:{x:778,y:lerp(900,960,cl2)}});
   s+=g(T(0,0),shadow(910,95)+man.svg,`opacity="${.3+.7*o3}"`);
   if(o3>0){s+=steam(t,man.head.x-62,man.head.y-34,.7)+steam(t+.3,man.head.x+62,man.head.y-34,.7);const k=t>=18.08?kf(t,[[18.08,3],[18.18,1,'in'],[18.24,1.12],[18.32,1]]):0;if(k>0)s+=stamp('GUILTY',880,470,74,7,k,C.red)+impact(t,18.18,880,470,C.red,260,12)}
   const sk=shk(t,18.18,30,.4);
   return{bg:C.night,svg:s,cam:{z:kf(t,[[16.48,1.3],[17.3,1.34,'lin'],[17.5,1.3],[18.0,1.34,'lin'],[18.2,1.42,'out'],[19.2,1.5,'lin']]),x:kf(t,[[16.48,330],[17.28,330],[17.5,540,'io'],[18.02,540],[18.2,770,'io']])+sk[0],y:kf(t,[[16.48,945],[18.0,945],[18.2,960]])+sk[1]}}}},
 // 7 slow-mo hover over BUY
 {a:19.24,b:20.94,tr:'zoom',f:t=>{const k=pr(t,19.24,20.9),fz=pr(t,20.72,20.8),hy=lerp(650,868,k),q=pop(t,19.58,.35);
   let s=floor()+rect(560,965,300,155,'#2A3C9E',{r:14,st:C.ink,sw:9})+bigBtn(710,940,280,'BUY',0,C.green,C.ink,64);
   const man=stick({x:330,ground:FLOOR,s:1.3,pose:ps({lean:lerp(8,18,k),aL:[-40,-70],lL:[-14,-6],lR:[18,4]}),face:fc('angry',{lx:1,ly:.6,sweat:1,grit:k>.5?1:0,mc:-.6}),reachR:{x:700,y:hy}});
   s+=shadow(330,125)+man.svg;for(let i=0;i<4;i++)s+=line(640+i*40,hy-70-i*6,640+i*40,hy-150-((i*37)%50),C.white,7,{op:.5});
   for(let i=0;i<3;i++){const d=((t*.8+i/3)%1);s+=ell(man.head.x-70-i*26,man.head.y-20+d*120,8,13,'#7FD4FF',{st:C.ink,sw:3,op:1-d})}
   s+=g(T(880,340,1+.05*Math.sin(t*10)),pill('SLOW-MO',0,0,40,C.ink,C.yellow,{st:C.yellow,sw:4,r:14}));
   if(q>0){let oc='';for(let i=0;i<8;i++){const a=(i+.5)/8*6.2832;oc+=(i?'L':'M')+f1(Math.cos(a)*150)+' '+f1(Math.sin(a)*150)}
     s+=g(T(700,480+wob(t,1.2,10),q,wob(t,1,4)),path(oc+'Z',C.red,{st:C.white,sw:14})+path(oc+'Z',null,{st:C.ink,sw:5})+txt('STOP?',0,4,72,C.white))}
   if(fz>0)s+=rect(60,290,960,1060,'none',{r:30,st:C.white,sw:16,op:1-pr(t,20.8,20.94)*.5});
   return{bg:mixc(C.navy,'#3A0F2A',k),svg:s,cam:{z:kf(t,[[19.24,1.02],[20.72,1.16,'lin'],[20.8,1.24,'out']]),x:kf(t,[[19.24,540],[20.8,610,'lin']]),y:kf(t,[[19.24,960],[20.8,935,'lin']]),r:lerp(0,-3,k)}}}},
 {a:20.94,b:23.4,tr:'zoom',f:t=>({bg:C.yellow,svg:floor()+endCard(t,20.94,3),cam:{z:kf(t,[[20.94,1.06],[23.25,1,'out']])}})}
 ]};
