import React from "react";
import { useCurrentFrame } from "remotion";
import {
  Actor,
  actorBox,
  Art,
  Bubble,
  BigText,
  Burst,
  Caption,
  charPt,
  ComicPage,
  grad,
  Panel,
  RoomBackdrop,
  SourceTag,
  SpeedLines,
  StampMark,
  useSpring,
} from "../../shared/comic";
import { BANGERS, COMIC } from "../../shared/fonts";
import { LensG, MoundG, SeedsG, TimelineG, GavelRig, gavelArm, gavelProgress } from "../../shared/props";
import { PAL, THEME } from "../../shared/theme";
import { beatTimes, slamArm } from "./common";

const INK = THEME.ink;

// ============================ BEAT 1: THE CASE ==============================
export const Beat1: React.FC = () => {
  const frame = useCurrentFrame();
  const { T, S } = beatTimes("b1");
  const hit = T("hit");
  const wham = useSpring(hit, { damping: 8, stiffness: 300, mass: 0.5 });
  const l1 = S("l1");
  const l2 = S("l2");

  // Panel A: the room
  const fA = 516;
  const cA = actorBox("curator", 579, fA, 250);
  // Panel C: the gavel
  const p = gavelProgress(frame, hit);
  const cC = actorBox("curator", 420, 318, 170);

  return (
    <ComicPage hits={[hit]}>
      <Panel id={1} x={50} y={74} w={1180} h={560} start={T("pA")} bg={grad(THEME.night, THEME.dusk)}>
        <RoomBackdrop scale={0.605} ox={0} oy={40} floorY={900} />
        <Actor
          who="curator"
          x={579}
          feet={fA}
          width={250}
          talk={[l1, l2]}
          browLift={frame > l2[0] ? 0.5 : 0.1}
          headTilt={Math.sin(frame / 20) * 1.5}
        />
        <Bubble
          span={l1}
          x={800}
          y={40}
          w={340}
          tip={charPt(cA, 296, 215)}
          text="Ladies and gentlemen, the court of history is now in session."
        />
        <Bubble
          span={l2}
          x={800}
          y={40}
          w={340}
          tip={charPt(cA, 296, 215)}
          text="Today's case: a tomb in Siberia, a thousand cannabis seeds, and one very big claim."
        />
        <SourceTag x={16} y={488} text="Science, Nov 2026" />
        <Caption
          x={22}
          y={22}
          w={460}
          span={[T("title"), 99999]}
          rot={-2}
          text={<span style={{ fontFamily: BANGERS, fontSize: 56, letterSpacing: 3 }}>THE EVIDENCE ROOM</span>}
        />
      </Panel>

      <Panel id={2} x={1256} y={74} w={614} h={560} start={T("pB")} bg={grad(PAL.nightTop, PAL.nightBottom)} dots={PAL.dotsLight}>
        <SpeedLines cx={296} cy={290} inner={170} outer={600} color={PAL.burstPale} opacity={0.35} />
        <Actor
          who="curator"
          x={296}
          feet={490}
          top={100}
          width={440}
          headOnly
          enter={T("pB")}
          browLift={0.7 + Math.sin(frame / 9) * 0.1}
          wide={0.35}
          headTilt={Math.sin(frame / 25) * 3}
          talk={[l2]}
        />
        {/* monocle glint */}
        <svg width={592} height={538} style={{ position: "absolute", left: 0, top: 0 }}>
          <g transform={`translate(365 313) rotate(${frame * 2.5}) scale(${0.8 + 0.3 * Math.sin(frame / 5)})`}>
            <path d="M0 -52 L8 -8 L52 0 L8 8 L0 52 L-8 8 L-52 0 L-8 -8 Z" fill="#fff" stroke={INK} strokeWidth={4} />
          </g>
        </svg>
      </Panel>

      <Panel id={3} x={50} y={660} w={1820} h={346} start={T("pC")} bg={grad(PAL.redHot, PAL.red)} dots={PAL.dotsLight}>
        <SpeedLines cx={1130} cy={162} inner={150} outer={1200} count={40} color={PAL.burstPale} opacity={frame >= hit ? 0.6 : 0.25} />
        <Actor
          who="curator"
          x={420}
          feet={318}
          width={170}
          enter={T("pC")}
          armR={gavelArm(p)}
          armL={12}
          hits={[hit]}
          mouth={frame >= hit ? "open" : "smirk"}
        />
        <Art>
          <GavelRig box={cC} p={p} feet={318} />
          {frame >= hit ? (
            <g transform={`translate(1130 162) rotate(${-8 + (1 - wham) * 20}) scale(${wham})`}>
              <Burst r={150} spikes={14} fill={THEME.card} rot={frame * 0.004} />
            </g>
          ) : null}
        </Art>
        {frame >= hit ? (
          <BigText x={830} y={110} w={600} fs={110} color={PAL.red} rot={-8 + (1 - wham) * 20} scale={wham}>
            ORDER!
          </BigText>
        ) : null}
      </Panel>
    </ComicPage>
  );
};

// ============================ BEAT 2: THE CLAIM =============================
export const Beat2: React.FC = () => {
  const frame = useCurrentFrame();
  const { T, S } = beatTimes("b2");
  const d1 = S("d1");
  const d2a = S("d2a");
  const d2b = S("d2b");
  const stamp = T("stamp");
  const counter = T("counter");
  const pop = useSpring(counter, { damping: 8, stiffness: 260, mass: 0.5 });

  const dig = actorBox("dig", 250, 790, 360);
  const clerk = 0;
  void clerk;
  return (
    <ComicPage hits={[counter, stamp]}>
      <Panel id={1} x={50} y={74} w={1060} h={932} start={T("pA")} bg={grad(PAL.dawnTop, PAL.dawnBottom)}>
        <Art>
          <rect x={0} y={730} width={1038} height={200} fill={PAL.earth} stroke={INK} strokeWidth={9} />
          <path d="M0 740 Q 260 700 520 740 T 1038 730" fill="none" stroke={INK} strokeWidth={8} />
          <circle cx={900} cy={130} r={70} fill={THEME.card} stroke={INK} strokeWidth={9} />
          <MoundG x={440} y={742} w={580} start={4} />
        </Art>
        <SourceTag x={20} y={862} text="Science, Nov 2026 (reported by ScienceDaily and AP)" />
        <div
          style={{
            position: "absolute",
            left: 640,
            top: 770,
            fontFamily: COMIC,
            fontWeight: 700,
            fontSize: 28,
            color: THEME.card,
            textShadow: `2px 2px 0 ${INK}`,
          }}
        >
          Tyva (also spelled Tuva)
        </div>
        <Actor
          who="dig"
          x={250}
          feet={795}
          width={360}
          enter={0}
          talk={[d1, d2a, d2b]}
          armR={-88 + Math.sin(frame / 7) * 5}
          armL={8}
          browLift={0.6}
          wide={0.3}
          bounce={frame < d1[1] ? 5 : 0}
          headTilt={Math.sin(frame / 12) * 2}
        />
        <Bubble
          span={d1}
          x={40}
          y={36}
          w={620}
          fs={38}
          tip={charPt(dig, 210, 70)}
          text="Siberia! A huge burial mound called Tunnug 1, in Tyva, in the south of Siberia!"
        />
        <Bubble span={d2a} x={40} y={36} w={560} fs={38} tip={charPt(dig, 210, 70)} text="And inside the central chamber," />
        <Bubble
          span={d2b}
          x={40}
          y={36}
          w={640}
          fs={38}
          tip={charPt(dig, 210, 70)}
          text="researchers report somewhere between a thousand and fifteen hundred cannabis seeds and fragments!"
        />
      </Panel>

      <Panel id={2} x={1136} y={74} w={734} h={560} start={T("pB")} bg={grad(PAL.tealTop, PAL.tealBottom)} dots={PAL.dotsLight}>
        {frame >= counter ? <SpeedLines cx={356} cy={170} inner={160} outer={700} color={PAL.burstPale} opacity={0.4} /> : null}
        <Art>
          <rect x={0} y={492} width={712} height={60} fill={PAL.earthDark} stroke={INK} strokeWidth={9} />
          <SeedsG from={T("seeds")} x0={70} x1={640} ground={500} peak={150} count={70} />
          {frame >= counter ? (
            <g transform={`translate(356 170) rotate(${-6 + (1 - pop) * 14}) scale(${pop})`}>
              <Burst r={150} spikes={14} fill={THEME.card} rot={frame * 0.004} />
            </g>
          ) : null}
        </Art>
        {frame >= counter ? (
          <>
            <BigText x={106} y={118} w={500} fs={66} color={PAL.red} rot={-6} scale={pop} stroke={8}>
              1,000 – 1,500
            </BigText>
            <BigText x={106} y={186} w={500} fs={38} color={PAL.red} rot={-6} scale={pop} stroke={6}>
              SEEDS &amp; FRAGMENTS
            </BigText>
          </>
        ) : null}
      </Panel>

      <Panel id={3} x={1136} y={660} w={734} h={346} start={T("pC")} bg={grad(PAL.sunTop, PAL.sunBottom)}>
        <Actor
          who="clerk"
          x={130}
          feet={316}
          width={170}
          enter={T("pC")}
          armR={slamArm(frame, [stamp], -125, -35)}
          hits={[stamp]}
          browTilt={0.2}
        />
        <Caption
          x={250}
          y={22}
          w={450}
          fs={32}
          span={T("cap") ? [T("cap"), 99999] : [0, 0]}
          text="Source: study published in Science, November 2026."
        />
        <StampMark x={350} y={200} w={300} start={stamp} text="SOURCE" color={PAL.red} fs={72} rot={-7} />
      </Panel>
    </ComicPage>
  );
};

// ============================ BEAT 3: THE DATE ==============================
export const Beat3: React.FC = () => {
  const frame = useCurrentFrame();
  const { T, S } = beatTimes("b3");
  const c1a = S("c1a");
  const c1b = S("c1b");
  const d1 = S("d1");
  const o1 = S("o1");
  const card = useSpring(T("card"), { damping: 9, stiffness: 200, mass: 0.6 });
  const years = useSpring(T("years"), { damping: 10, stiffness: 220, mass: 0.6 });
  const cur = actorBox("curator", 1620, 430, 230);
  const dig = actorBox("dig", 220, 410, 230);
  const dbt = actorBox("doubt", 220, 410, 230);
  return (
    <ComicPage>
      <Panel id={1} x={50} y={74} w={1820} h={470} start={T("pA")} bg={grad(PAL.labTop, PAL.labBottom)} dots={PAL.dotsLight}>
        <div style={{ position: "absolute", left: 60, top: 36, width: 960, transform: `scale(${0.4 + 0.6 * card})`, transformOrigin: "0 0" }}>
          <BigText x={0} y={0} w={960} fs={64} color={PAL.burstPale} stroke={7}>
            EARLY
          </BigText>
          <BigText x={0} y={56} w={960} fs={140} color={THEME.card} stroke={10}>
            8TH CENTURY BCE
          </BigText>
        </div>
        <Art>
          <TimelineG x={150} y={330} w={800} marker={T("marker")} />
        </Art>
        <div
          style={{
            position: "absolute",
            left: 60,
            top: 352,
            width: 960,
            textAlign: "center",
            fontFamily: COMIC,
            fontWeight: 700,
            fontSize: 38,
            color: "#fff",
            textShadow: `3px 3px 0 ${INK}`,
            opacity: years,
            transform: `translateY(${(1 - years) * 20}px)`,
          }}
        >
          about 2,700 to 2,800 years ago
        </div>
        <SourceTag x={20} y={402} text="Science, Nov 2026 (reported by ScienceDaily and AP)" />
        <Actor who="curator" x={1620} feet={430} width={230} enter={4} talk={[c1a, c1b]} browLift={0.2} headTilt={Math.sin(frame / 22) * 2} />
        <Bubble span={c1a} x={1070} y={44} w={480} fs={34} tip={charPt(cur, 100, 215)} text="Radiocarbon dating of six of those seeds places them in the early eighth century BCE." />
        <Bubble span={c1b} x={1070} y={44} w={480} fs={34} tip={charPt(cur, 100, 215)} text="That is somewhere around twenty-seven or twenty-eight hundred years ago." />
      </Panel>

      <Panel id={2} x={50} y={570} w={900} h={436} start={T("pB")} bg={grad(PAL.sunTop, PAL.sunBottom)}>
        <SpeedLines cx={230} cy={210} inner={120} outer={700} color={PAL.burstPale} opacity={0.5} />
        <Art>
          <g transform={`translate(230 210) rotate(${frame * 0.6})`}>
            <Burst r={150} spikes={16} fill={PAL.burstPale} sw={7} />
          </g>
        </Art>
        <Actor
          who="dig"
          x={230}
          feet={412}
          width={230}
          enter={T("pB")}
          talk={[d1]}
          bounce={14}
          armL={125}
          armR={-125}
          browLift={1}
          wide={0.5}
          headTilt={Math.sin(frame / 5) * 4}
        />
        <Bubble span={d1} x={390} y={34} w={470} fs={34} tip={charPt(dig, 290, 215)} text="The oldest directly dated evidence of cannabis used to get high! That is the claim!" />
      </Panel>

      <Panel id={3} x={976} y={570} w={894} h={436} start={T("pC")} bg={grad(PAL.nightTop, PAL.nightBottom)} dots={PAL.dotsLight}>
        <Actor
          who="doubt"
          x={220}
          feet={412}
          width={230}
          enter={T("pC")}
          talk={[o1]}
          browLift={0.5}
          browTilt={0.8}
          headTilt={7 + Math.sin(frame / 18) * 1.5}
          armL={14}
          armR={-14}
        />
        <Bubble span={o1} x={380} y={40} w={470} fs={34} tip={charPt(dbt, 290, 215)} text={'Hold on. "Used to get high" is doing a lot of work in that sentence.'} />
      </Panel>
    </ComicPage>
  );
};

// ============================ BEAT 4: THE HAIR ==============================
export const Beat4: React.FC = () => {
  const frame = useCurrentFrame();
  const { T, S } = beatTimes("b4");
  const c1a = S("c1a");
  const c1b = S("c1b");
  const c2a = S("c2a");
  const c2b = S("c2b");
  const d1 = S("d1");
  const o1 = S("o1");
  const tag = useSpring(c1b[0], { damping: 9, stiffness: 220, mass: 0.6 });
  const card = useSpring(T("pC"), { damping: 10, stiffness: 200, mass: 0.7 });
  const cur = actorBox("curator", 190, 880, 300);
  const dig = actorBox("dig", 170, 430, 200);
  const dbt = actorBox("doubt", 600, 430, 200);
  const clerk = actorBox("clerk", 170, 385, 200);
  const hand = charPt(clerk, 383, 254);
  const bubbleTip = charPt(cur, 300, 215);
  const zig = `M0 0 L30 -34 L10 -34 L44 -78 L24 -78 L60 -122`;
  return (
    <ComicPage>
      <Panel id={1} x={50} y={74} w={1000} h={932} start={T("pA")} bg={grad(PAL.labTop, PAL.labBottom)} dots={PAL.dotsLight}>
        <Art>
          <rect x={0} y={800} width={978} height={110} fill={PAL.woodDark} stroke={INK} strokeWidth={9} />
          <LensG cx={400} cy={250} r={150} />
          {frame >= c1b[0] ? (
            <>
              <g transform={`translate(${170} ${90 + Math.sin(frame / 8) * 5}) scale(${tag})`}>
                <circle r={62} fill={THEME.card} stroke={INK} strokeWidth={8} />
              </g>
              <g transform={`translate(${780} ${110 + Math.sin(frame / 9 + 2) * 5}) scale(${tag})`}>
                <circle r={62} fill={PAL.burstPale} stroke={INK} strokeWidth={8} />
              </g>
            </>
          ) : null}
        </Art>
        {frame >= c1b[0] ? (
          <>
            <BigText x={170 - 62} y={90 - 28 + Math.sin(frame / 8) * 5} w={124} fs={54} color={PAL.red} scale={tag} stroke={0}>
              THC
            </BigText>
            <BigText x={780 - 62} y={110 - 28 + Math.sin(frame / 9 + 2) * 5} w={124} fs={54} color={PAL.red} scale={tag} stroke={0}>
              CBN
            </BigText>
          </>
        ) : null}
        <SourceTag x={360} y={858} text="AP report, Nov 2026: outside researchers" />
        <Actor
          who="curator"
          x={190}
          feet={880}
          width={300}
          talk={[c1a, c1b, c2a, c2b]}
          browLift={frame > c2a[0] ? 0.1 : 0.4}
          headTilt={Math.sin(frame / 22) * 2}
        />
        <Bubble span={c1a} x={380} y={560} w={560} fs={34} tip={bubbleTip} text="The seeds are not the key evidence. The hair is." />
        <Bubble
          span={c1b}
          x={380}
          y={540}
          w={570}
          fs={32}
          tip={bubbleTip}
          text="Researchers report finding traces of THC, and a related compound called CBN, in strands of human hair from the central chamber."
        />
        <Bubble
          span={c2a}
          x={380}
          y={530}
          w={570}
          fs={32}
          tip={bubbleTip}
          text="That is the objection. One outside researcher said the data do not distinguish consumption from external exposure."
        />
        <Bubble span={c2b} x={380} y={560} w={570} fs={32} tip={bubbleTip} text="Hair buried beside the seeds could simply have picked up residue." />
      </Panel>

      <Panel id={2} x={1076} y={74} w={794} h={480} start={T("pB")} bg={grad(PAL.dawnTop, PAL.dawnBottom)}>
        <Art>
          <rect x={0} y={420} width={772} height={60} fill={PAL.earth} stroke={INK} strokeWidth={9} />
          {frame >= d1[0] ? (
            <g transform={`translate(386 ${300})`}>
              <path d={zig} transform={`translate(-30 ${60 + Math.sin(frame) * 2}) scale(${1 + Math.sin(frame / 3) * 0.08})`} fill="none" stroke={PAL.red} strokeWidth={12} strokeLinejoin="round" />
            </g>
          ) : null}
        </Art>
        <Actor who="dig" x={170} feet={430} width={200} enter={T("pB")} talk={[d1]} armR={-55} browLift={0.9} wide={0.4} mouth="open" headTilt={5} />
        <Actor who="doubt" x={600} feet={430} width={200} enter={T("pB") + 6} talk={[o1]} browLift={0.3} browTilt={0.8} headTilt={-6} armL={50} />
        <Bubble span={d1} x={30} y={36} w={300} fs={34} tip={charPt(dig, 230, 90)} text="Proof they used it!" />
        <Bubble
          span={o1}
          x={300}
          y={16}
          w={450}
          fs={32}
          tip={charPt(dbt, 170, 90)}
          text="Or proof the hair spent two thousand years next to a pile of cannabis."
        />
      </Panel>

      <Panel id={3} x={1076} y={580} w={794} h={426} start={T("pC")} bg={grad(PAL.tealTop, PAL.tealBottom)} dots={PAL.dotsLight}>
        <Actor who="clerk" x={170} feet={385} width={200} enter={T("pC")} armR={-120} browLift={0.3} hits={[T("pC")]} />
        <div
          style={{
            position: "absolute",
            left: hand[0] - 10,
            top: 18,
            width: 380,
            height: hand[1] - 12,
            background: PAL.cardPaper,
            border: `8px solid ${INK}`,
            boxShadow: `8px 10px 0 ${PAL.shadow}`,
            boxSizing: "border-box",
            textAlign: "center",
            fontFamily: BANGERS,
            fontSize: 70,
            lineHeight: 1,
            letterSpacing: 2,
            color: PAL.red,
            paddingTop: 32,
            transform: `rotate(${3 + Math.sin(frame / 14) * 1.5}deg) scale(${0.5 + 0.5 * card})`,
            transformOrigin: "0 100%",
            zIndex: 30,
          }}
        >
          EXTERNAL EXPOSURE?
        </div>
        <Art>
          <line x1={hand[0] + 8} y1={hand[1] - 12} x2={hand[0] + 8} y2={hand[1] + 40} stroke={INK} strokeWidth={9} strokeLinecap="round" />
        </Art>
      </Panel>
    </ComicPage>
  );
};
