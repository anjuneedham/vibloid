import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame } from "remotion";
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
  SourceTag,
  SpeedLines,
  Span,
  useSpring,
} from "../../shared/comic";
import { BANGERS } from "../../shared/fonts";
import { FPS, PAL, THEME } from "../../shared/theme";
import { GavelRig, gavelArm, gavelProgress, LensG, MoundG, SeedsG } from "../../shared/props";
import { LINES, SCENES, SHORT_SECONDS, SHORT_VOICEOVER, VERDICT_HIT } from "./timing";

// A vertical (1080x1920) YouTube Short: Part 1 in about 50 seconds. Shorts' own buttons cover the bottom ~300 px and the right edge,
// so everything important sits above y = 1650 and left of x = 980.

const f = (t: number, scene: readonly [number, number]) => Math.round((t - scene[0]) * FPS);
const span = (id: keyof typeof LINES, scene: readonly [number, number], pre = 0.15, post = 0.5): Span => [
  f(LINES[id][0] - pre, scene),
  f(LINES[id][1] + post, scene),
];

const SRC_MAIN = "Science, Nov 2026 (reported by ScienceDaily and AP)";

// ---------------- Scene 1: the hook ----------------
const S1: React.FC = () => {
  const frame = useCurrentFrame();
  const sc = SCENES.s1;
  const l = span("u2", sc);
  const cur = actorBox("curator", 489, 770, 300);
  return (
    <ComicPage>
      <Panel id={1} x={40} y={130} w={1000} h={860} start={0} bg={THEME.night}>
        <RoomBackdrop scale={0.85} ox={385} oy={0} floorY={900} />
        <Actor who="curator" x={489} feet={770} width={300} talk={[l]} browLift={frame > 120 ? 0.5 : 0.1} headTilt={Math.sin(frame / 20) * 1.5} />
        <Bubble span={l} x={30} y={16} w={918} fs={42} tip={charPt(cur, 230, 150)} text="Today's case: a tomb in Siberia, a thousand cannabis seeds, and one very big claim." />
        <SourceTag x={14} y={800} text={SRC_MAIN} fs={20} />
      </Panel>
      <Panel id={2} x={40} y={1020} w={1000} h={620} start={14} bg={grad(PAL.dawnTop, PAL.dawnBottom)}>
        <Art>
          <rect x={0} y={520} width={978} height={100} fill={PAL.earth} stroke={THEME.ink} strokeWidth={9} />
          <MoundG x={140} y={540} w={700} start={14} />
          <SeedsG from={22} x0={150} x1={830} ground={560} peak={110} count={70} />
        </Art>
      </Panel>
    </ComicPage>
  );
};

// ---------------- Scene 2: the claim and the objection ----------------
const S2: React.FC = () => {
  const frame = useCurrentFrame();
  const sc = SCENES.s2;
  const a = span("u8", sc);
  const b = span("u10", sc, 0.1, 0.8);
  const dig = actorBox("dig", 300, 700, 420);
  const dbt = actorBox("doubt", 700, 700, 420);
  return (
    <ComicPage>
      <Panel id={1} x={40} y={130} w={1000} h={740} start={0} bg={grad(PAL.sunTop, PAL.sunBottom)}>
        <SpeedLines cx={300} cy={380} inner={120} outer={900} color={PAL.burstPale} opacity={0.45} />
        <Actor who="dig" x={300} feet={700} width={420} talk={[a]} bounce={10} armL={125} armR={-125} browLift={1} wide={0.5} headTilt={Math.sin(frame / 5) * 3} />
        <Bubble span={a} x={470} y={40} w={480} fs={40} tip={charPt(dig, 290, 150)} text="The oldest dated evidence of cannabis used to get high!" />
        <SourceTag x={14} y={680} text={SRC_MAIN} fs={20} />
      </Panel>
      <Panel id={2} x={40} y={900} w={1000} h={740} start={f(LINES.u10[0] - 0.3, sc)} bg={grad(PAL.nightTop, PAL.nightBottom)} dots={PAL.dotsLight}>
        <Actor who="doubt" x={700} feet={700} width={420} enter={f(LINES.u10[0] - 0.3, sc)} talk={[b]} browLift={0.5} browTilt={0.9} headTilt={7 + Math.sin(frame / 18) * 1.5} armL={14} armR={-14} />
        <Bubble span={b} x={30} y={50} w={500} fs={40} tip={charPt(dbt, 110, 150)} text={'Hold on. "Used to get high" is doing a lot of work in that sentence.'} />
      </Panel>
    </ComicPage>
  );
};

// ---------------- Scene 3: the hair ----------------
const S3: React.FC = () => {
  const frame = useCurrentFrame();
  const sc = SCENES.s3;
  const c = span("u11", sc, 0.15, 0.6);
  const d = span("u13", sc, 0.1, 0.5);
  const o = span("u14", sc, 0.1, 1.0);
  const cur = actorBox("curator", 170, 650, 250);
  const dig = actorBox("dig", 240, 740, 330);
  const dbt = actorBox("doubt", 760, 740, 330);
  const pB = f(LINES.u13[0] - 0.4, sc);
  return (
    <ComicPage>
      <Panel id={1} x={40} y={130} w={1000} h={700} start={0} bg={grad(PAL.labTop, PAL.labBottom)} dots={PAL.dotsLight}>
        <Art>
          <rect x={0} y={580} width={978} height={100} fill={PAL.woodDark} stroke={THEME.ink} strokeWidth={9} />
          <LensG cx={620} cy={250} r={170} />
        </Art>
        <Actor who="curator" x={170} feet={650} width={250} talk={[c]} browLift={0.4} headTilt={Math.sin(frame / 22) * 2} />
        <Bubble span={c} x={290} y={440} w={650} fs={38} tip={charPt(cur, 290, 215)} text="The seeds are not the key evidence. The hair is." />
        <SourceTag x={14} y={640} text="AP report, Nov 2026: outside researchers" fs={20} />
      </Panel>
      <Panel id={2} x={40} y={860} w={1000} h={780} start={pB} bg={grad(PAL.dawnTop, PAL.dawnBottom)}>
        <Art>
          <rect x={0} y={700} width={978} height={80} fill={PAL.earth} stroke={THEME.ink} strokeWidth={9} />
        </Art>
        <Actor who="dig" x={240} feet={740} width={330} enter={pB} talk={[d]} armR={-55} browLift={0.9} wide={0.4} mouth="open" headTilt={5} />
        <Actor who="doubt" x={760} feet={740} width={330} enter={pB + 6} talk={[o]} browLift={0.3} browTilt={0.8} headTilt={-6} armL={50} />
        <Bubble span={d} x={40} y={40} w={420} fs={44} tip={charPt(dig, 230, 100)} text="Proof they used it!" />
        <Bubble span={o} x={330} y={30} w={640} fs={40} tip={charPt(dbt, 170, 100)} text="Or proof the hair spent two thousand years next to a pile of cannabis." />
      </Panel>
    </ComicPage>
  );
};

// ---------------- Scene 4: the verdict ----------------
const S4: React.FC = () => {
  const frame = useCurrentFrame();
  const sc = SCENES.s4;
  const hit = f(VERDICT_HIT, sc);
  const a = span("u27", sc, 0.15, 0.5);
  const b: Span = [f(LINES.u28[0] - 0.1, sc), f(LINES.u28[1] + 1.0, sc)];
  const p = gavelProgress(frame, hit);
  const wham = useSpring(hit, { damping: 8, stiffness: 300, mass: 0.5 });
  const cur = actorBox("curator", 300, 790, 330);
  return (
    <ComicPage hits={[hit]}>
      <Panel id={1} x={40} y={130} w={1000} h={840} start={0} bg={THEME.night}>
        <RoomBackdrop scale={0.85} ox={385} oy={0} floorY={900} />
        <Actor who="curator" x={300} feet={790} width={330} talk={[a, b]} armR={gavelArm(p)} armL={12} hits={[hit]} browLift={frame >= hit ? 0.5 : 0.1} mouth={frame >= hit ? "open" : "smirk"} />
        <Art>
          <GavelRig box={cur} p={p} feet={790} />
        </Art>
        <Bubble span={a} x={30} y={16} w={918} fs={42} tip={charPt(cur, 230, 150)} text="The court finds: the seeds are real. The dates are solid. The high is unproven." />
        <Bubble span={b} x={30} y={30} w={918} fs={50} tip={charPt(cur, 230, 150)} text="Verdict: plausible, not proven." />
        <SourceTag x={14} y={770} text="Science, Nov 2026; outside experts quoted by AP" fs={20} />
      </Panel>
      <Panel id={2} x={40} y={1000} w={1000} h={640} start={f(LINES.u28[0] - 0.3, sc)} bg={grad(PAL.redHot, PAL.red)} dots={PAL.dotsLight}>
        <SpeedLines cx={489} cy={260} inner={200} outer={1000} count={44} color={PAL.burstPale} opacity={frame >= hit ? 0.65 : 0.2} />
        {frame >= hit ? (
          <>
            <Art>
              <g transform={`translate(489 270) rotate(${-4 + (1 - wham) * 16}) scale(${wham * (1 + Math.sin(frame / 6) * 0.015)})`}>
                <Burst r={330} spikes={16} fill={THEME.card} rot={frame * 0.003} />
              </g>
            </Art>
            <BigText x={19} y={170} w={940} fs={118} color={PAL.red} rot={-6 + (1 - wham) * 16} scale={wham} stroke={11}>
              PLAUSIBLE,
              <br />
              NOT PROVEN
            </BigText>
          </>
        ) : null}
        <Caption x={60} y={520} w={860} fs={34} rot={-1} span={[f(LINES.u28[1] + 0.6, sc), 99999]} text="The Evidence Room, Part 1: The Siberian Tomb. Full case on Past Tense." />
      </Panel>
    </ComicPage>
  );
};

export const ShortEvidenceRoom1: React.FC = () => {
  const ranges = [SCENES.s1, SCENES.s2, SCENES.s3, SCENES.s4];
  const Comps = [S1, S2, S3, S4];
  return (
    <AbsoluteFill style={{ background: PAL.black }}>
      {Comps.map((C, i) => (
        <Sequence key={i} from={Math.round(ranges[i][0] * FPS)} durationInFrames={Math.round((ranges[i][1] - ranges[i][0]) * FPS)} name={`scene-${i + 1}`}>
          <C />
        </Sequence>
      ))}
      <div style={{ position: "absolute", left: 48, top: 46, fontFamily: BANGERS, fontSize: 44, letterSpacing: 2, color: THEME.ink, zIndex: 900 }}>
        PAST <span style={{ color: PAL.red }}>TENSE</span>
      </div>
      <Audio src={staticFile(SHORT_VOICEOVER)} />
    </AbsoluteFill>
  );
};

export const SHORT_FRAMES = Math.round(SHORT_SECONDS * FPS);
