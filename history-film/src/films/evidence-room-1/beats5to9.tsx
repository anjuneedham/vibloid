import React from "react";
import { useCurrentFrame } from "remotion";
import {
  Actor,
  actorBox,
  Art,
  BigText,
  Bubble,
  Burst,
  Caption,
  charPt,
  ComicPage,
  grad,
  Panel,
  RoomBackdrop,
  SpeedLines,
  StampMark,
  useSpring,
} from "../../shared/comic";
import { BANGERS } from "../../shared/fonts";
import { GavelRig, gavelArm, gavelProgress, PinCard, ScrollG, TentG } from "../../shared/props";
import { PAL, THEME } from "../../shared/theme";
import { beatTimes, slamArm } from "./common";

const INK = THEME.ink;

// ============================ BEAT 5: THE NUMBERS ===========================
export const Beat5: React.FC = () => {
  const frame = useCurrentFrame();
  const { T, S } = beatTimes("b5");
  const o1 = S("o1");
  const stamp = T("stamp");
  const dbt = actorBox("doubt", 330, 880, 460);
  return (
    <ComicPage hits={[stamp]}>
      <Panel id={1} x={50} y={74} w={1180} h={932} start={T("pA")} bg={grad(PAL.nightTop, PAL.nightBottom)} dots={PAL.dotsLight}>
        <SpeedLines cx={330} cy={500} inner={260} outer={1000} color={PAL.burstPale} opacity={0.18} />
        <Art>
          <rect x={0} y={820} width={1158} height={100} fill={PAL.woodDark} stroke={INK} strokeWidth={9} />
        </Art>
        <Actor
          who="doubt"
          x={330}
          feet={880}
          width={460}
          talk={[o1]}
          browLift={0.7}
          browTilt={0.9}
          headTilt={-5 + Math.sin(frame / 16) * 1.5}
          armL={22 + Math.sin(frame / 9) * 3}
          armR={-22 - Math.sin(frame / 9) * 3}
        />
        <Bubble
          span={o1}
          x={580}
          y={110}
          w={540}
          fs={38}
          chars={112}
          tip={charPt(dbt, 330, 190)}
          text={
            <>
              Another outside expert called the CBN levels{" "}
              <span style={{ fontFamily: BANGERS, fontSize: 66, color: PAL.red, letterSpacing: 2, lineHeight: 1 }}>"HARD TO BELIEVE"</span>{" "}
              for wild cannabis.
            </>
          }
        />
      </Panel>

      <Panel id={2} x={1256} y={74} w={614} h={932} start={T("pB")} bg={grad(PAL.sunTop, PAL.sunBottom)}>
        <Caption x={40} y={40} w={510} fs={40} span={[T("cap"), 99999]} text="Contested. Both views are in the sources." />
        <StampMark x={46} y={300} w={500} start={stamp} text="CONTESTED" color={PAL.red} fs={96} rot={-9} />
        <Actor
          who="clerk"
          x={300}
          feet={880}
          width={280}
          enter={T("pB")}
          armR={slamArm(frame, [stamp], -125, -35)}
          hits={[stamp]}
          browTilt={0.3}
        />
      </Panel>
    </ComicPage>
  );
};

// ============================ BEAT 6: THE GREEK WITNESS =====================
export const Beat6: React.FC = () => {
  const frame = useCurrentFrame();
  const { T, S } = beatTimes("b6");
  const c1 = S("c1");
  const d1 = S("d1");
  const o1 = S("o1");
  const c2a = S("c2a");
  const c2b = S("c2b");
  const curA = actorBox("curator", 170, 490, 220);
  const dig = actorBox("dig", 110, 490, 190);
  const dbt = actorBox("doubt", 170, 330, 200);
  const curD = actorBox("curator", 130, 330, 170);
  const burst = useSpring(T("steam"), { damping: 7, stiffness: 200, mass: 0.6 });
  const shrug = Math.sin(frame / 10) * 6;
  return (
    <ComicPage>
      <Panel id={1} x={50} y={74} w={900} h={540} start={T("pA")} bg={grad(PAL.sunTop, PAL.sunBottom)}>
        <Art>
          <rect x={0} y={470} width={878} height={60} fill={PAL.earth} stroke={INK} strokeWidth={9} />
          <ScrollG x={460} y={56} w={360} h={150} label="HERODOTUS" fs={58} />
        </Art>
        <Actor who="curator" x={170} feet={492} width={220} talk={[c1]} browLift={0.3} headTilt={Math.sin(frame / 20) * 2} armR={-70 + Math.sin(frame / 12) * 4} />
        <Bubble
          span={c1}
          x={330}
          y={250}
          w={520}
          fs={30}
          tip={charPt(curA, 290, 215)}
          text="Why does this matter? Because the ancient Greek writer Herodotus described Scythian people using hemp."
        />
      </Panel>

      <Panel id={2} x={976} y={74} w={894} h={540} start={T("pB")} bg={grad(PAL.tealTop, PAL.tealBottom)} dots={PAL.dotsLight}>
        <Art>
          <rect x={0} y={470} width={872} height={60} fill={PAL.earthDark} stroke={INK} strokeWidth={9} />
          {frame >= T("steam") ? (
            <g transform={`translate(650 150) rotate(${frame * 0.5}) scale(${burst})`}>
              <Burst r={150} spikes={14} fill={PAL.burstPale} sw={7} />
            </g>
          ) : null}
          <TentG x={650} y={490} w={300} steamFrom={T("steam")} />
        </Art>
        <Actor who="dig" x={110} feet={492} width={190} enter={T("pB")} talk={[d1]} bounce={10} armL={125} armR={-125} browLift={1} wide={0.4} />
        <Bubble
          span={d1}
          x={210}
          y={16}
          w={430}
          fs={28}
          tip={charPt(dig, 230, 100)}
          text="He wrote that they threw hemp seeds on hot stones inside a tent, and shouted with joy in the vapour!"
        />
      </Panel>

      <Panel id={3} x={50} y={640} w={900} h={366} start={T("pC")} bg={grad(PAL.nightTop, PAL.nightBottom)} dots={PAL.dotsLight}>
        <Actor
          who="doubt"
          x={170}
          feet={332}
          width={200}
          enter={T("pC")}
          talk={[o1]}
          browLift={0.4}
          browTilt={0.6}
          headTilt={8 + shrug * 0.4}
          armL={65 + shrug}
          armR={-65 - shrug}
          hits={[T("pC")]}
        />
        <Bubble
          span={o1}
          x={330}
          y={30}
          w={520}
          fs={32}
          tip={charPt(dbt, 290, 215)}
          text="Herodotus wrote that centuries after this tomb. And he was repeating what he was told."
        />
      </Panel>

      <Panel id={4} x={976} y={640} w={894} h={366} start={T("pD")} bg={grad(PAL.sunTop, PAL.sunBottom)}>
        <Actor who="curator" x={130} feet={332} width={170} enter={T("pD")} talk={[c2a, c2b]} browLift={0.1} hits={[T("pD")]} />
        <Bubble span={c2a} x={250} y={40} w={590} fs={34} tip={charPt(curD, 290, 215)} text="Reports tie this find to Scythian culture." />
        <Bubble
          span={c2b}
          x={250}
          y={30}
          w={600}
          fs={32}
          tip={charPt(curD, 290, 215)}
          text="But the tomb does not establish whether cannabis was consumed during the burial ceremony itself."
        />
      </Panel>
    </ComicPage>
  );
};

// ============================ BEAT 7: THE EVIDENCE BOARD ====================
export const Beat7: React.FC = () => {
  const frame = useCurrentFrame();
  const { T, S } = beatTimes("b7");
  const cl1 = S("cl1");
  const cl2 = S("cl2");
  const cl3 = S("cl3");
  const stamps = [T("stamp1"), T("stamp2"), T("stamp3")];
  const clerk = actorBox("clerk", 190, 862, 240);
  const tip = charPt(clerk, 300, 215);
  const sag = (a: number) => Math.sin(frame / 20 + a) * 4;
  const string1 = useSpring(T("card2"), { damping: 14, stiffness: 120, mass: 1 });
  const string2 = useSpring(T("card3"), { damping: 14, stiffness: 120, mass: 1 });
  return (
    <ComicPage>
      <Panel id={1} x={50} y={74} w={1820} h={932} start={T("pA")} bg={THEME.night}>
        <RoomBackdrop scale={0.936} ox={0} oy={30} floorY={900} />
        <PinCard x={250} y={150} w={400} h={330} start={T("card1")} rot={-3} title="SEEDS" sub="radiocarbon dated" />
        <PinCard x={700} y={150} w={400} h={330} start={T("card2")} rot={2} title="HAIR CHEMISTRY" />
        <PinCard x={1150} y={150} w={400} h={330} start={T("card3")} rot={-2} title="USE IN BURIAL CEREMONIES" />
        <Art>
          {frame >= T("card2") ? (
            <path d={`M450 138 Q 575 ${170 + sag(0)} ${450 + 250 * string1} 138`} fill="none" stroke={PAL.redHot} strokeWidth={6} />
          ) : null}
          {frame >= T("card3") ? (
            <path d={`M900 138 Q 1025 ${170 + sag(2)} ${900 + 250 * string2} 138`} fill="none" stroke={PAL.redHot} strokeWidth={6} />
          ) : null}
        </Art>
        <StampMark x={262} y={300} w={376} start={stamps[0]} text="FOUND" color={PAL.stampGreen} fs={84} rot={-8} />
        <StampMark x={712} y={300} w={376} start={stamps[1]} text="CONTESTED" color={PAL.red} fs={68} rot={7} />
        <StampMark x={1162} y={330} w={376} start={stamps[2]} text="NOT ESTABLISHED" color={PAL.stampGrey} fs={52} rot={-6} />
        <Actor
          who="clerk"
          x={190}
          feet={862}
          width={240}
          talk={[cl1, cl2, cl3]}
          armR={slamArm(frame, stamps, -120, -40)}
          hits={stamps}
          browTilt={0.2}
        />
        <Bubble span={cl1} x={340} y={690} w={900} fs={42} tip={tip} text="Seeds: found, and radiocarbon dated." />
        <Bubble span={cl2} x={340} y={690} w={900} fs={42} tip={tip} text="Hair chemistry: contested." />
        <Bubble span={cl3} x={340} y={690} w={900} fs={42} tip={tip} text="Use in burial ceremonies: not established." />
      </Panel>
    </ComicPage>
  );
};

// ============================ BEAT 8: THE VERDICT ===========================
export const Beat8: React.FC = () => {
  const frame = useCurrentFrame();
  const { T, S, len } = beatTimes("b8");
  const hit = T("hit");
  const c1a = S("c1a");
  const c1b = S("c1b");
  const d1 = S("d1");
  const o1 = S("o1");
  const p = gavelProgress(frame, hit);
  const wham = useSpring(hit, { damping: 8, stiffness: 300, mass: 0.5 });
  const cur = actorBox("curator", 380, 800, 330);
  const dig = actorBox("dig", 100, 300, 130);
  const dbt = actorBox("doubt", 100, 300, 130);
  return (
    <ComicPage hits={[hit]} push={[0, len, 0.06]}>
      <Panel id={1} x={50} y={74} w={1000} h={932} start={T("pA")} bg={THEME.night}>
        <RoomBackdrop scale={0.9} ox={400} oy={40} floorY={900} />
        <Actor
          who="curator"
          x={380}
          feet={800}
          width={330}
          talk={[c1a, c1b]}
          armR={gavelArm(p)}
          armL={12}
          hits={[hit]}
          browLift={frame >= hit ? 0.5 : 0.1}
          mouth={frame >= hit ? "open" : "smirk"}
        />
        <Art>
          <GavelRig box={cur} p={p} feet={800} />
        </Art>
        <Bubble
          span={c1a}
          x={110}
          y={50}
          w={780}
          fs={42}
          tip={charPt(cur, 230, 150)}
          text="The court finds: the seeds are real. The dates are solid. The high is unproven."
        />
        <Bubble span={c1b} x={110} y={60} w={780} fs={46} tip={charPt(cur, 230, 150)} text="Verdict: plausible, not proven." />
      </Panel>

      <Panel id={2} x={1076} y={74} w={794} h={560} start={T("pB")} bg={grad(PAL.redHot, PAL.red)} dots={PAL.dotsLight}>
        <SpeedLines cx={386} cy={269} inner={200} outer={900} count={44} color={PAL.burstPale} opacity={frame >= hit ? 0.65 : 0.2} />
        {frame >= hit ? (
          <>
            <Art>
              <g transform={`translate(386 269) rotate(${-4 + (1 - wham) * 16}) scale(${wham * (1 + Math.sin(frame / 6) * 0.015)})`}>
                <Burst r={340} spikes={16} fill={THEME.card} rot={frame * 0.003} />
              </g>
            </Art>
            <BigText x={26} y={150} w={720} fs={118} color={PAL.red} rot={-6 + (1 - wham) * 16} scale={wham} stroke={10}>
              PLAUSIBLE,
              <br />
              NOT PROVEN
            </BigText>
          </>
        ) : null}
      </Panel>

      <Panel id={3} x={1076} y={660} w={386} h={346} start={T("pC")} bg={grad(PAL.sunTop, PAL.sunBottom)}>
        <Actor who="dig" x={100} feet={300} width={130} enter={T("pC")} talk={[d1]} bounce={8} armL={120} armR={-120} browLift={0.9} wide={0.3} />
        <Bubble span={d1} x={16} y={10} w={340} fs={28} tip={charPt(dig, 200, 90)} text="Plausible is still exciting!" />
      </Panel>

      <Panel id={4} x={1484} y={660} w={386} h={346} start={T("pD")} bg={grad(PAL.nightTop, PAL.nightBottom)} dots={PAL.dotsLight}>
        <Actor who="doubt" x={100} feet={300} width={130} enter={T("pD")} talk={[o1]} browLift={0.3} browTilt={0.7} headTilt={6} />
        <Bubble span={o1} x={16} y={10} w={340} fs={28} tip={charPt(dbt, 200, 90)} text="Plausible is where arguments start." />
      </Panel>
    </ComicPage>
  );
};

// ============================ BEAT 9: NEXT CASE + END CARD ==================
export const Beat9: React.FC = () => {
  const frame = useCurrentFrame();
  const { T, S } = beatTimes("b9");
  const hit = T("hit");
  const c1a = S("c1a");
  const c1b = S("c1b");
  const p = gavelProgress(frame, hit);
  const wham = useSpring(hit, { damping: 8, stiffness: 300, mass: 0.5 });
  const cur = actorBox("curator", 380, 800, 330);
  const next = useSpring(T("pB") + 4, { damping: 9, stiffness: 200, mass: 0.6 });
  return (
    <ComicPage hits={[hit]}>
      <Panel id={1} x={50} y={74} w={1000} h={932} start={T("pA")} bg={THEME.night}>
        <RoomBackdrop scale={0.9} ox={400} oy={40} floorY={900} />
        <Actor
          who="curator"
          x={380}
          feet={800}
          width={330}
          talk={[c1a, c1b]}
          armR={gavelArm(p)}
          armL={12}
          hits={[hit]}
          mouth={frame >= hit ? "open" : "smirk"}
        />
        <Art>
          <GavelRig box={cur} p={p} feet={800} />
          {frame >= hit ? (
            <g transform={`translate(800 420) rotate(${-8 + (1 - wham) * 20}) scale(${wham})`}>
              <Burst r={140} spikes={13} fill={THEME.card} rot={frame * 0.004} />
            </g>
          ) : null}
        </Art>
        {frame >= hit ? (
          <BigText x={690} y={398} w={220} fs={42} color={PAL.red} rot={-8 + (1 - wham) * 20} scale={wham} stroke={6}>
            ADJOURNED!
          </BigText>
        ) : null}
        <Bubble
          span={c1a}
          x={110}
          y={40}
          w={780}
          fs={40}
          tip={charPt(cur, 230, 150)}
          text="Next time: a Roman fort in Wales, and a legend that may or may not be true."
        />
        <Bubble span={c1b} x={110} y={50} w={780} fs={46} tip={charPt(cur, 230, 150)} text="Case adjourned." />
      </Panel>

      <Panel id={2} x={1076} y={74} w={794} h={500} start={T("pB")} bg={grad(PAL.redHot, PAL.red)} dots={PAL.dotsLight}>
        <SpeedLines cx={386} cy={228} inner={190} outer={900} count={40} color={PAL.burstPale} opacity={0.4} />
        <Art>
          <g transform={`translate(386 228) rotate(${-3 + Math.sin(frame / 20) * 2}) scale(${next})`}>
            <Burst r={300} spikes={15} fill={THEME.card} rot={frame * 0.003} />
          </g>
        </Art>
        <BigText x={36} y={104} w={700} fs={88} color={PAL.red} rot={-4} scale={next} stroke={9}>
          NEXT:
          <br />A ROMAN FORT
          <br />
          IN WALES
        </BigText>
      </Panel>

      <Panel id={3} x={1076} y={600} w={794} h={406} start={T("pC")} bg={grad(PAL.tealTop, PAL.tealBottom)} dots={PAL.dotsLight}>
        <BigText x={0} y={18} w={772} fs={84} color={THEME.card} stroke={9}>
          THE EVIDENCE ROOM
        </BigText>
        <BigText x={0} y={112} w={772} fs={46} color="#fff" stroke={7}>
          PART 1: THE SIBERIAN TOMB
        </BigText>
        <Caption x={24} y={218} w={470} fs={36} span={[T("pC") + 8, 99999]} text="Sources: see the video description." />
        <Actor who="clerk" x={650} feet={382} width={170} enter={T("pC") + 4} browLift={0.2} />
      </Panel>
    </ComicPage>
  );
};
