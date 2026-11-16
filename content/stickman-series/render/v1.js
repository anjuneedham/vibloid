'use strict';
// VIDEO 1 - "One revenge trade ended my challenge". All times are seconds on the real voiceover.
const endCard=(t,a,n)=>{let s='';
  s+=g(T(540,430,pop(t,a+.08,.4)*(1+.02*Math.sin(t*9)),-3),txt('PART '+n,10,12,215,'#000',{op:.25})+txt('PART '+n,0,0,215,C.ink));
  const k2=pop(t,a+.4,.35);if(k2>0)s+=g(T(540,655,k2*(1+.035*Math.sin(t*12)),2),pill('TAP MY PROFILE',0,0,84,C.ink,C.yellow,{py:1.6,r:30}));
  const k3=pop(t,a+.65,.3);if(k3>0)s+=g(T(300-Math.abs(Math.sin(t*7))*26,880+Math.abs(Math.sin(t*7))*44,k3,32),arrow(0,0,230,0,C.white,58)+arrow(0,0,230,0,C.red,34));
  const jy=Math.abs(Math.sin(t*7))*-34,m=stick({x:760,ground:FLOOR+jy,s:.9,flip:-1,pose:ps({aL:[-150,-170],lL:[-14,-4],lR:[14,4]}),face:fc('happy'),reachR:{x:600,y:900+jy}});
  return burst(540,430,560,640,14,C.ink,10,t*.6)+shadow(760,90)+m.svg+s};
VID[1]={part:1,dur:26.6,
 sfx:[[1.3,'thud'],[2.05,'thud'],[3.3,'pop'],[4.4,'pop'],[5.42,'whoosh'],[6.32,'thud'],[9.36,'thud'],[11.3,'pop'],[11.5,'pop'],[11.7,'pop'],[11.98,'pop'],[13.08,'thud'],[15.6,'pop'],[16.16,'pop'],[16.54,'pop'],[17.46,'pop'],[21.14,'thud'],[22.0,'pop'],[23.74,'pop'],[24.35,'pop'],[24.65,'pop']],
 over:t=>hookSVG(t,[{s:'BLEW MY CHALLENGE',bg:C.white,fg:C.ink,at:.03,size:92},{s:'IN ONE TRADE',bg:C.red,fg:C.white,at:.22,size:128}],2.35)
   +(t>10&&t<13.4?'':discl('Fictional dramatization'))+disclPill('Fictional dramatization',t,10.0,13.42,1590),
 scenes:[
 // 1 HOOK: giant red candle flattens him
 {a:0,b:2.3,f:t=>{const L=1.3,hit=t>=L,cy=kf(t,[[.9,-1100],[L,0,'in'],[1.84,0],[1.95,-130,'out'],[2.05,0,'in']]);
   const sq=kf(t,[[L,1],[L+.07,.16,'out'],[1.86,.2],[1.96,.34],[2.05,.13,'in']]),sk=shk(t,L,38,.5),sk2=shk(t,2.05,22,.3);
   const n=kf(t,[[0,2.5],[1.15,6,'lin'],[L,6],[1.5,7,'out']]);
   const data=[[.15,.26],[.26,.4],[.4,.36],[.36,.55],[.55,.7],[.7,.85],[.85,.08]];
   let s=floor()+desk(60,905,470)+monitor(100,585,390,270,candles(128,615,334,210,data,n));
   const look=pr(t,.95,1.1),man=stick({x:770,ground:FLOOR,s:1.12,flip:-1,sy:sq,sx:hit?1+(1-sq)*.75:1,
     pose:hit?ps({aL:[-80,-95],aR:[80,95],lL:[-60,-80],lR:[60,80]}):mixP({aL:[-150,-170+wob(t,3,10)]},{aL:[-40,-140],lean:-6},look),
     face:hit?fc('dead'):mixF('happy',{...FACE.worried,ly:-1},look),reachR:hit?null:{x:lerp(590,640,look),y:lerp(730+wob(t,3,10),700,look)}});
   s+=shadow(770,lerp(100,230,pr(t,.9,L)),FLOOR,lerp(.3,.55,pr(t,.9,L)))+man.svg;
   const cb=FLOOR-493*sq-6+cy; // candle bottom
   s+=line(770,cb-720,770,cb-560,C.red,22)+rect(770-135+3,cb-600,270,600,C.ink,{r:20})+rect(770-135,cb-600,270,600,C.red,{r:20,st:C.ink,sw:12})+rect(770-100,cb-570,36,520,'#fff',{r:14,op:.22});
   s+=impact(t,L,770,FLOOR-20,C.white,260,14)+impact(t,2.05,770,FLOOR-20,C.white,200,10);
   if(hit)for(let i=0;i<3;i++){const a=t*5+i*2.1;s+=star(770+Math.cos(a)*190,cb-640+Math.sin(a)*30,26,C.yellow,5,.45,a)}
   return{bg:mixc(C.navy,'#7A1022',hit?1-pr(t,L,L+.5)*.75:0),svg:s,cam:{z:kf(t,[[0,1.35],[.45,1,'out'],[L,1],[2.3,1.07,'lin']]),x:kf(t,[[0,700],[.45,540,'out']])+sk[0]+sk2[0],y:kf(t,[[0,860],[.45,960,'out']])+sk[1]+sk2[1]}}}},
 // 2 green morning -> one red trade -> I want it back
 {a:2.3,b:5.92,tr:'left',f:t=>{const red=pr(t,3.26,3.6),ang=pr(t,4.1,4.9),zk=kf(t,[[5.3,0],[5.5,1,'back']]);
   const data=[[.1,.2],[.2,.3],[.3,.27],[.27,.42],[.42,.55],[.55,.52],[.52,.68],[.68,.82],[.82,.45]];
   let s=floor()+desk(40,930,640)+monitor(80,520,560,350,candles(110,575,500,270,data,t<3.26?8:8+red)+
     (red<.5?pill('▲ GREEN ALL MORNING',360,500,30,C.green,C.ink):g(T(360,500,1+.08*Math.sin(t*20)),pill('▼ ONE RED TRADE',0,0,30,C.red,C.white))));
   // winged money flying away
   const mk=pr(t,3.9,5.3);if(mk>0&&mk<1){const mx=lerp(520,150,E.io(mk)),my=lerp(600,330,mk)+wob(t,2,24),fl=Math.sin(t*26)*26;
     s+=g(T(mx,my,1.15,-12),path(`M-50 0q-50 ${-50-fl} -100 ${-12-fl}q30 26 100 40`,C.white,{st:C.ink,sw:7})+path(`M50 0q50 ${-50-fl} 100 ${-12-fl}q-30 26 -100 40`,C.white,{st:C.ink,sw:7})+rect(-62,-36,124,72,C.green,{r:12,st:C.ink,sw:8})+circ(0,0,20,C.white,{st:C.ink,sw:5})+txt('$',0,2,30,C.ink))}
   const sip=kf(t,[[2.4,0],[2.72,1],[3.15,1],[3.34,0,'out']]),tr=ang*wob(t,17,7);
   const mt={x:lerp(712,792,sip)+tr,y:lerp(880,668,sip)+tr};
   let F=mixF({...FACE.smug,eo:1},{...FACE.shock,lx:1},pr(t,3.26,3.36));F=mixF(F,{e:'dot',bl:22,br:-14,mc:-.5,lx:1,mw:16,tw:t>3.5?Math.abs(Math.sin(t*42))*5:0},pr(t,3.5,3.75));F=mixF(F,{...FACE.angry,lx:.6,tw:Math.abs(Math.sin(t*42))*3},ang);
   const man=stick({x:830,ground:FLOOR,s:1.25,flip:-1,pose:mixP({aL:[-12,-6],lean:-4*sip},{aL:[-70,-100],lean:8},ang),face:F,reachR:mt,
     reachL:ang>0?{x:lerp(860,690,E.out(ang))+wob(t,9,6),y:lerp(900,700,E.out(ang))}:null,bendL:1});
   s+=shadow(830,120)+man.svg+mug(man.hR.x-6,man.hR.y-10,.82,pr(t,4.25,4.7));
   if(t>4.3)for(let i=0;i<4;i++){const k=((t-4.3)*1.7+i*.25)%1;s+=ell(man.hR.x-30+i*14,man.hR.y+40+k*150,7,11,'#6B3F1D',{op:1-k})}
   if(zk>0)s+=steam(t,man.head.x-70,man.head.y-40,.8)+steam(t+.4,man.head.x+70,man.head.y-40,.8);
   s+=impact(t,3.3,575,690,C.red,90,8);
   const sk=shk(t,5.46,16,.4);
   return{bg:mixc('#11A452',mixc('#C4283A','#8E1424',zk),red),svg:s,cam:{z:lerp(kf(t,[[2.3,1.04],[5.3,1.1,'lin']]),2.35,zk),x:lerp(540,man.head.x-10,zk)+sk[0],y:lerp(960,man.head.y+120,zk)+sk[1],r:zk*-4}}}},
 // 3 doubled size, moved my stop, breached
 {a:5.92,b:9.88,tr:'zoom',f:t=>{const st=9.34,press=kf(t,[[6.26,0],[6.33,1,'in'],[6.5,1],[6.7,0]]);
   const sY=kf(t,[[6.9,600],[7.65,845,'io']]),drag=t>=6.72&&t<7.86;
   const data=[[.92,.82],[.82,.86],[.86,.72],[.72,.63],[.63,.67],[.67,.5],[.5,.4],[.4,.27],[.27,.1]];
   const n=kf(t,[[5.92,3],[6.86,4.6,'lin'],[7.65,6.2,'lin'],[8.4,7.4,'lin'],[9.3,9,'lin']]),fill=kf(t,[[6.3,.2],[7.65,.5,'lin'],[8.42,.62,'lin'],[9.3,1,'in']]);
   let s=floor()+rect(95,965,210,155,C.navy,{r:14,st:C.ink,sw:9})+bigBtn(200,940,190,'SIZE ×2',press);
   s+=rect(518,372,502,580,'#000',{r:28,op:.3})+rect(510,360,502,580,C.navy,{r:28,st:C.ink,sw:10})+txt('DAILY LOSS',540,408,28,C.white,{a:'start',w:800})+txt('LIMIT',985,408,28,C.red,{a:'end'})
     +rect(540,432,445,30,C.ink,{r:15})+rect(540,432,445*fill,30,mixc(C.yellow,C.red,fill*1.2-.2),{r:15})+candles(545,500,430,410,data,n);
   s+=line(520,sY,1000,sY,C.red,9,{dash:'22 16'})+g(T(930,sY-32),pill('STOP',0,0,30,C.red,C.white,{py:1.5}))+circ(520,sY,24,C.white,{st:C.ink,sw:9});
   const up=kf(t,[[5.95,0],[6.2,1,'out'],[6.26,1],[6.33,0,'in'],[6.6,0],[6.72,.3]]),jump=kf(t,[[st,0],[st+.14,-90,'out'],[st+.34,0,'in']]);
   const ugh=pr(t,7.86,8.05)*(1-pr(t,8.5,8.7)),sh=pr(t,st,st+.08);
   let pose,F,o={};
   if(t<6.72){pose=ps({lean:lerp(-16,6,up),aL:[-150,-160]});F=mixF({...FACE.angry},{...FACE.angry,grit:0,mo:.8,mw:16},up);o={flip:-1,reachR:{x:lerp(205,330,up),y:lerp(912,560,up)}}}
   else if(drag){const k=pr(t,6.9,7.65);pose=ps({lean:lerp(8,22,k),lL:[lerp(-9,-50,k),lerp(-5,20,k)],lR:[lerp(9,40,k),lerp(5,-20,k)]});F=fc('strain',{sweat:1});o={reachL:{x:516,y:sY-6},reachR:{x:516,y:sY+8},bendL:1}}
   else{pose=mixP(mixP({aL:[-10,-4],aR:[20,30]},'slump',ugh),{aL:[-140,-160],aR:[140,160]},sh);F=mixF(mixF({...FACE.worried,lx:1},'ugh',ugh),{...FACE.shock,lx:.5},sh)}
   const tk=kf(t,[[6.64,1],[6.72,.12],[6.8,1]]);
   const man=stick({x:lerp(372,398,pr(t,6.7,6.9)),ground:FLOOR+jump,s:1.2,sx:tk,pose,face:F,...o});
   s+=shadow(385,115)+man.svg+impact(t,6.33,200,930,C.ink,150,10);
   const xk=pr(t,6.33,7.0);if(xk>0&&xk<1)s+=g(T(210,860-xk*230,pop(t,6.33,.25)*1.1,-10),txt('×2!',0,0,130,C.red,{st:C.ink,sw:16,op:1-E.in(xk)}));
   if(ugh>0)s+=g(T(man.head.x+95,man.head.y-70,ugh),path('M0 0q26 -22 52 0q26 22 52 0',null,{st:C.ink,sw:9}));
   if(t>=st-.09)s+=stamp('',545,690,96,-8,kf(t,[[st-.09,3.4],[st,1,'in'],[st+.06,1.08],[st+.14,1]]),C.red,['DAILY LIMIT','BREACHED'])+impact(t,st,545,690,C.red,430,16);
   const sk=shk(t,6.33,20,.3),s2=shk(t,st,44,.55);
   return{bg:mixc(C.yellow,'#FF6A3D',t>=st?1-pr(t,st,st+.5)*.6:0),svg:s,cam:{z:kf(t,[[5.92,1.0],[6.86,1.03],[7.7,1.1,'io'],[8.4,1.06],[st-.05,1.12,'lin'],[st+.1,1,'out']]),x:kf(t,[[6.7,540],[7.3,600],[8.5,560]])+sk[0]+s2[0],y:960+sk[1]+s2[1]}}}},
 // 4 reset vending machine + exact same thing
 {a:9.88,b:13.45,tr:'left',f:t=>{const drop=11.95,rk=pr(t,12.2,12.5),wb=t>11.7&&t<drop?wob(t,22,5):0;
   let s=floor()+shadow(775,220,FLOOR,.35);
   let m=rect(590,330,370,790,'#E9333F',{r:26,st:C.ink,sw:11})+rect(612,352,326,96,C.ink,{r:16})+txt('RESET',775,402,74,(Math.floor(t*6)%2&&t>11.2&&t<drop+.4)?C.yellow:C.white)
     +rect(615,470,235,380,C.night,{r:14,st:C.ink,sw:8})+rect(870,470,66,380,C.navy,{r:12,st:C.ink,sw:8})+rect(888,530,30,70,C.yellow,{r:8,st:C.ink,sw:6})+rect(899,542,8,46,C.ink,{r:4})+txt('¢',903,640,40,C.yellow)
     +rect(630,900,290,150,C.night,{r:16,st:C.ink,sw:9});
   for(let i=0;i<6;i++){const cx=672+(i%2)*118,cy=535+Math.floor(i/2)*118;m+=rect(cx-46,cy-36,92,72,C.white,{r:10,st:C.ink,sw:5})+rect(cx-34,cy-22,36,10,C.green,{r:5})+rect(cx-34,cy,68,8,'#B9B3A4',{r:4})+rect(cx-34,cy+16,50,8,'#B9B3A4',{r:4})}
   s+=g(T(775+wb,0),g('translate(-775 0)',m));
   // coins
   const tap=pr(t,10.25,10.5)*(1-pr(t,11.0,11.2)),give=pr(t,11.15,11.3)*(1-pr(t,drop,drop+.2)),win=pr(t,drop+.05,drop+.3);
   const hd={x:330,y:627};
   const man=stick({x:330,ground:FLOOR,s:1.25,pose:mixP(mixP({aL:[-20,-30],head:-6*tap},{lean:8},give),'cheer',win),face:mixF(mixF({...FACE.smug,lx:.4},{...FACE.happy,lx:1},give),{...FACE.happy,lx:1},win),
     reachR:win>.5?null:tap>0||give>0?{x:lerp(lerp(400,376+wob(t,5,5),tap),530,give),y:lerp(lerp(900,614+Math.abs(wob(t,5,10)),tap),640,give)}:null,bendR:-1});
   s+=shadow(330,120)+man.svg;
   if(tap>.2)s+=star(455,520,34*tap*(1+.25*Math.sin(t*14)),C.yellow,4,.35,t)+star(505,585,18*tap,C.yellow,4,.35,-t);
   [11.24,11.44,11.64].forEach(c=>{const k=pr(t,c,c+.24);if(k>0&&k<1)s+=g(T(lerp(540,900,k),lerp(640,560,k)-Math.sin(k*3.14)*120,1),circ(0,0,26,C.yellow,{st:C.ink,sw:7})+txt('¢',0,1,28,C.ink))});
   const ck=pr(t,drop,drop+.16),cu=pop(t,drop+.2,.4);
   if(ck>0)s+=g(T(775,lerp(lerp(700,975,E.in(ck)),800,cu),1+cu*.75,cu*-6),rect(-110,-70,220,140,C.white,{r:16,st:C.ink,sw:8})+rect(-88,-48,70,18,C.green,{r:9})+txt('FRESH',0,-4,40,C.ink)+txt('ACCOUNT',0,38,34,C.ink))+impact(t,drop+.2,775,800,C.yellow,210,12);
   // replay inset
   if(rk>0){const st=13.06,pk=Math.abs(Math.sin(t*20));
     const mm=stick({x:330,ground:930,s:.82,flip:-1,ol:'none',pose:ps({aL:[-150,-160],lean:-8}),face:fc('angry'),reachR:{x:205,y:lerp(700,838,pk)}});
     let r=rect(-250,-330,500,640,'#000',{r:30,op:.35,x:'transform="translate(12 16)"'})+rect(-250,-330,500,640,C.yellow,{r:30,st:C.ink,sw:11})+rect(-250,-330,500,84,C.ink,{r:24})
       +path('M-212 -306l26 18l-26 18ZM-182 -306l26 18l-26 18Z',C.red)+txt('REPLAY ×8',-140,-287,38,C.white,{a:'start'});
     r+=g('translate(-290 -690)',rect(120,862,170,78,C.navy,{r:12,st:C.ink,sw:8})+bigBtn(205,845,150,'SIZE ×2',pk,C.red,C.white,32)+mm.svg+(pk>.8?burst(205,830,60,95,8,C.ink,7):''));
     if(t>=st-.08)r+=stamp('',20,40,62,-10,kf(t,[[st-.08,3],[st,1,'in'],[st+.07,1.1],[st+.15,1]]),C.red,['BREACHED','(AGAIN)']);
     const sk=shk(t,st,20,.3);s+=g(T(lerp(-420,300,E.back(rk))+sk[0],700+sk[1],1,-4+rk*1.5),r)}
   return{bg:'#2A3C9E',svg:s,cam:{z:kf(t,[[9.88,1.08],[11.1,1.0],[11.2,1.0],[drop,1.06,'lin'],[12.3,1]]),x:kf(t,[[9.88,440],[11.1,470],[11.4,560],[12.3,540]]),y:960}}}},
 // 5 TradeNotes trade form
 {a:13.45,b:17.92,tr:'up',f:t=>{const x0=300,y0=330,w=710,h=680,rows=[['ENTRY','100.00',15.58,16.0],['STOP','99.00',16.14,16.45],['EXIT','96.00',16.52,16.86]];
   let u=txt('New trade',x0+44,y0+140,46,C.ink,{a:'start'})+g(T(x0+w-100,y0+140,pop(t,14.2,.3)),pill('LONG',0,0,30,C.green,C.ink));
   rows.forEach((r,i)=>{const y=y0+200+i*108,act=t>=r[2]-.05&&(i==2?t<17.0:t<rows[i+1][2]-.05),n=Math.round(pr(t,r[2],r[3])*r[1].length),v=r[1].slice(0,n);
     u+=txt(r[0],x0+44,y+44,36,'#6B6F82',{a:'start',w:800})+rect(x0+230,y,w-274,88,'#fff',{r:18,st:act?C.green:C.ink,sw:act?10:6})+txt(v,x0+262,y+46,52,C.ink,{a:'start'})
       +(act&&Math.floor(t*5)%2?rect(x0+266+mw(v,52),y+18,6,52,C.ink):'')+(i==1?circ(x0+w-84,y+44,13,C.red):'')});
   const by=y0+h-110,bk=pop(t,17.44,.4);
   u+=line(x0+40,by-34,x0+w-40,by-34,'#CFC8B8',5)+txt('R-MULTIPLE',x0+44,by+30,36,'#6B6F82',{a:'start',w:800});
   if(t>16.9&&t<17.44)for(let i=0;i<3;i++)u+=circ(x0+w-190+i*44,by+30-Math.abs(Math.sin(t*9-i*.8))*20,11,C.ink);
   if(bk>0)u+=g(T(x0+w-150,by+30,bk*(1+.05*Math.sin(t*10)),-4),pill('-4.0R',0,0,62,C.red,C.white,{st:C.ink,sw:8,py:1.45,px:.9}))+impact(t,17.44,x0+w-150,by+30,C.red,150,12);
   const cy=lerp(900,0,E.back(pr(t,13.5,13.95)));
   let s=floor()+g(T(0,cy),uiCard(x0,y0,w,h,u)+(t>14.85&&t<15.4?burst(x0+150,y0+47,150,190,12,C.green,8,t):''));
   s+=sample(655,1062,pr(t,13.8,14.1));
   const tx=kf(t,[[13.6,420],[14.75,330,'io'],[15.5,330],[15.62,505],[16.1,505],[16.2,505],[16.5,505],[16.6,505],[16.95,505],[17.4,720,'io']]),
     ty=kf(t,[[13.6,800],[14.75,y0+62,'io'],[15.4,y0+62],[15.62,y0+244,'out'],[16.08,y0+244],[16.2,y0+352,'out'],[16.46,y0+352],[16.58,y0+460,'out'],[16.95,y0+460],[17.4,by+40,'io']]);
   const wk=pr(t,13.5,14.3),man=stick({x:lerp(-120,150,E.out(wk)),ground:FLOOR,s:1.1,pose:wk<1?ps(walkPose(t*3)):ps({aL:[-14,-8],lean:4}),face:mixF({...FACE.happy,lx:1,ly:-.4},{...FACE.shock,lx:1},pr(t,17.44,17.55)),
     reachR:{x:lerp(-20,150,E.out(wk))+110,y:lerp(820,ty+60,.35)},bendR:-1});
   s+=shadow(man.hip.x,105)+man.svg+line(man.hR.x,man.hR.y,tx,ty,C.ink,20)+line(man.hR.x,man.hR.y,tx,ty,C.yellow,10)+circ(tx,ty,13,C.red,{st:C.ink,sw:6});
   const sk=shk(t,17.46,14,.3);
   return{bg:C.navy,svg:s,cam:{z:kf(t,[[13.45,1],[15.5,1.03],[17.3,1.07,'lin'],[17.46,1.16,'out'],[17.9,1.12]]),x:kf(t,[[15.5,540],[17.46,610]])+sk[0],y:kf(t,[[15.5,960],[17.46,900]])+sk[1]}}}},
 // 6 -1R vs -4R
 {a:17.92,b:21.46,tr:'left',f:t=>{const L=21.14,hit=t>=L,sq=hit?kf(t,[[L,1],[L+.07,.13,'out']]):1;
   const by=kf(t,[[19.7,-420],[20.25,330,'back'],[20.9,300,'io'],[L,FLOOR-270,'in']]),wr=hit?0:wob(t,2.6,5),sg=kf(t,[[18.3,330],[18.74,0,'back']]);
   const look=pr(t,19.8,20.05);
   let s=floor()+shadow(560,lerp(60,330,pr(t,19.7,L)),FLOOR,lerp(0,.5,pr(t,19.7,20.3)));
   const man=stick({x:340,ground:FLOOR,s:1.15,sy:sq,sx:hit?1.7:1,pose:hit?ps({aL:[-85,-95],aR:[85,95],lL:[-65,-85],lR:[65,85]}):ps({aL:[-150,-165+wob(t,2,6)],lean:look*-5}),
     face:hit?fc('dead'):mixF({...FACE.happy,lx:-.3},{...FACE.worried,ly:-1,lx:.6,sweat:1},look),reachR:hit?null:{x:535,y:800+look*wob(t,14,5)},bendR:-1});
   if(!hit||t<L+.5){const fx=hit?lerp(535,60,pr(t,L,L+.5)):535,fy=hit?700-Math.sin(pr(t,L,L+.5)*3.14)*300:670+sg,fr=hit?(t-L)*-700:look*wob(t,14,3);
     s+=g(T(fx,fy,1,fr),line(0,-40,0,150,C.ink,16)+rect(-125,-150,250,140,C.white,{r:18,st:C.ink,sw:10})+txt('-1R',0,-78,96,C.dgreen)+g(T(0,-190,pop(t,18.3,.3)),pill('MY STOP',0,0,30,C.ink,C.white)))}
   s+=man.svg;
   if(t>19.65){const bb=g(T(560,by,1,wr),rect(-322,-192,660,400,'#000',{r:36,op:.3})+rect(-330,-200,660,400,C.red,{r:36,st:C.ink,sw:14})+txt('-4R',0,24,290,C.white,{st:C.ink,sw:26})
       +g(T(0,-200),pill('REVENGE TRADE',0,0,44,C.ink,C.yellow,{st:C.yellow,sw:5})));s+=bb}
   s+=impact(t,L,560,FLOOR-20,C.ink,420,18);const sk=shk(t,L,46,.5);
   return{bg:mixc(C.white,'#FFB4A8',hit?1-pr(t,L,L+.4):0),svg:s,cam:{z:kf(t,[[17.92,1.12],[19.6,1.05,'lin'],[19.9,.98,'out'],[L-.05,1.1,'lin'],[L+.1,1,'out']]),x:kf(t,[[17.92,440],[19.6,460,'lin'],[19.95,540,'out']])+sk[0],y:kf(t,[[17.92,900],[19.6,900],[19.95,900,'out'],[L,960]])+sk[1]}}}},
 // 7 lightbulb flickers off
 {a:21.46,b:24.24,tr:'up',f:t=>{const lit=t<22.0?1:t<22.08?0:t<22.16?1:t<22.24?0:t<22.3?.6:0,toss=pr(t,22.85,23.2),shr=pr(t,23.2,23.45);
   const man=stick({x:540,ground:FLOOR,s:1.42,pose:mixP(mixP({aL:[-12,-6],aR:[150,172],head:-8},{aL:[-12,-6],aR:[40,60],head:0},toss),'shrug',E.back(shr)),
     face:mixF(mixF(mixF({...FACE.happy,lx:.7,ly:-.8},{...FACE.flat,lx:.8,ly:-.8,bl:-14,br:-14},pr(t,22.1,22.3)),{...FACE.flat,lx:0,ly:0},toss),'confused',shr)});
   const bx=lerp(man.hR.x,1250,E.in(toss)),byy=lerp(man.hR.y-78,man.hR.y+500,E.in(toss))-Math.sin(toss*3.14)*260;
   let s=floor()+(lit>0?circ(bx,byy,430,C.yellow,{op:.13*lit})+circ(bx,byy,250,C.yellow,{op:.16*lit})+burst(bx,byy,105,150+wob(t,3,12),12,C.yellow,12,t*.5):'')+shadow(540,150)+man.svg;
   if(toss<1)s+=g(T(bx,byy,1.25,toss*500),rect(-24,36,48,44,'#8A90A6',{r:8,st:C.ink,sw:7})+circ(0,0,54,lit?mixc('#59607A',C.yellow,lit):'#59607A',{st:C.ink,sw:9})+path('M-16 14l8 -26l8 26l8 -26l8 26',null,{st:C.ink,sw:5})
       +(toss>0?'':g(T(0,-104,1),pill('LOGGING',0,0,34,lit?C.yellow:'#59607A',C.ink,{st:C.ink,sw:6}))));
   const q=pop(t,23.72,.4);if(q>0)s+=g(T(540,330+wob(t,1.5,10),q,8),txt('?',0,0,300,C.yellow,{st:C.ink,sw:26}))+g(T(330,470,pop(t,23.85,.3),-18),txt('?',0,0,130,C.white,{st:C.ink,sw:16}))+g(T(760,480,pop(t,23.95,.3),20),txt('?',0,0,130,C.white,{st:C.ink,sw:16}));
   return{bg:mixc(C.night,'#1A2350',lit),svg:s,cam:{z:kf(t,[[21.46,1.0],[22.0,1.06,'lin'],[23.2,1.02],[23.4,1.14,'back'],[24.2,1.18,'lin']]),x:540,y:kf(t,[[23.2,960],[23.4,900]])}}}},
 // 8 end card
 {a:24.24,b:26.7,tr:'zoom',f:t=>({bg:C.yellow,svg:floor()+endCard(t,24.24,2),cam:{z:kf(t,[[24.24,1.06],[26.6,1,'out']])}})}
 ]};
