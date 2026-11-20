import React from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from "remotion";
import { BoilDefs } from "../../shared/BoilDefs";
import { BANGERS } from "../../shared/fonts";
import { BeatId, beatEnd, MOMENT_TEXT, MomentTiming, Span, VERDICT_WORD } from "../../shared/moment";
import {
  Amphitheatre,
  BeamDust,
  Bloom,
  Cartouche,
  FortressWall,
  Gel,
  GlowParchment,
  HangingLamp,
  Hawthorn,
  Hills,
  LampVignette,
  Layer,
  LanternSlide,
  ManuscriptArt,
  Moths,
  PaperGrain,
  PinBoard,
  PlaceTag,
  RoomFloor,
  RoomForeground,
  RoomShelves,
  Screen,
  ShadowActor,
  ShadowSourceTag,
  Stage,
  useSealImpact,
  WarmFlash,
  WaxSeal,
} from "../../shared/shadow";
import { SHADOW } from "../../shared/theme";

// THE EVIDENCE ROOM moment, staged as LANTERN-LIT SHADOW THEATRE. The cast is drawn exactly as in cast.tsx.
// Every shot: backlit paper screen -> parallax cut-out layers -> cast -> light, dust, moths -> gels -> grain -> vignette.

const ease = Easing.inOut(Easing.sin);
const drift = (frame: number, len: number, from: number, to: number) =>
  interpolate(frame, [0, len], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

/** Local span of a line inside a shot that starts at `start`. */
const local = (s: Span, start: number): Span => [s[0] - start, s[1] - start];

const FLOOR = 905;

const Atmos: React.FC<{ lamp: [number, number]; moths?: boolean; seed?: number }> = ({ lamp, moths = true, seed = 0 }) => (
  <>
    <Bloom x={lamp[0]} y={lamp[1] + 30} r={560} opacity={0.42} seed={seed} />
    <BeamDust lamp={lamp} count={70} reach={950} seed={seed} />
    {moths ? <Moths lamp={[lamp[0], lamp[1] + 20]} count={3} radius={150} seed={seed} /> : null}
  </>
);

const Finish: React.FC<{ hot: [number, number]; gel?: string; gelOpacity?: number }> = ({ hot, gel = SHADOW.gelAmber, gelOpacity = 0.28 }) => (
  <>
    <Gel color={gel} x={-120} y={-80} w={2160} h={300} opacity={gelOpacity} rot={-2} seed={4} feather={6} />
    <PaperGrain opacity={0.42} />
    <LampVignette hot={hot} />
  </>
);

// ------------------------------------------------------------------ SHOT: the room, the Curator opens the court
const RoomShot: React.FC<{ len: number; line: Span }> = ({ len, line }) => {
  const frame = useCurrentFrame();
  const lamp: [number, number] = [640, 222];
  const cam = { x: drift(frame, len, -30, 40), y: drift(frame, len, 0, -12), zoom: drift(frame, len, 1.0, 1.06) };
  const T = MOMENT_TEXT.open;
  return (
    <AbsoluteFill>
      <Stage cam={cam}>
        <Layer depth={0.08}>
          <Screen hot={[lamp[0] + 40, lamp[1] + 140]} spread={0.78} />
        </Layer>
        <Layer depth={0.2} blur={3}>
          <RoomShelves id="r-shelves" />
          <Gel color={SHADOW.gelTeal} x={1360} y={40} w={700} h={980} opacity={0.4} seed={2} feather={18} />
        </Layer>
        <Layer depth={0.45} blur={0.8}>
          <PinBoard id="r-board" />
        </Layer>
        <Layer depth={0.7}>
          <HangingLamp x={lamp[0]} y={lamp[1]} id="r-lamp" />
        </Layer>
        <Layer depth={1}>
          <RoomFloor y={FLOOR} id="r-floor" />
          <ShadowActor who="curator" x={1010} feet={FLOOR} width={310} lampX={lamp[0]} talk={[line]} sway={0.6} headTilt={Math.sin(frame / 22) * 2} browLift={frame > line[0] + 30 ? 0.4 : 0.1} armR={interpolate(frame, [line[0], line[0] + 14], [-4, -38], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
        </Layer>
        <Atmos lamp={lamp} />
        <Layer depth={1.5} blur={8}>
          <RoomForeground id="r-fg" />
        </Layer>
      </Stage>
      <Finish hot={lamp} />
      <Cartouche who={T.who} text={T.line} span={line} />
      <ShadowSourceTag text={T.tag} span={[0, len]} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ SHOT: Dig claims, Doubt objects (one two-shot, the camera leans)
const TwoShot: React.FC<{ len: number; claim: Span; object: Span; cut: number }> = ({ len, claim, object, cut }) => {
  const frame = useCurrentFrame();
  const lamp: [number, number] = [960, 200];
  const lean = interpolate(frame, [cut - 6, cut + 18], [-70, 70], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const cam = { x: lean, y: -6, zoom: drift(frame, len, 1.03, 1.07) };
  const up = interpolate(frame, [claim[0], claim[0] + 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const claiming = frame >= claim[0] && frame < claim[1] + 6;
  const objecting = frame >= object[0] - 4;
  const C = MOMENT_TEXT.claim;
  const O = MOMENT_TEXT.object;
  return (
    <AbsoluteFill>
      <Stage cam={cam}>
        <Layer depth={0.08}>
          <Screen hot={[lamp[0], lamp[1] + 160]} spread={0.78} seed={1} />
        </Layer>
        <Layer depth={0.2} blur={3}>
          <RoomShelves id="t-shelves" />
        </Layer>
        <Layer depth={0.45} blur={1}>
          <PinBoard id="t-board" lit={[2]} />
        </Layer>
        <Layer depth={0.7}>
          <HangingLamp x={lamp[0]} y={lamp[1]} id="t-lamp" />
        </Layer>
        <Layer depth={1}>
          <RoomFloor y={FLOOR} id="t-floor" />
          <ShadowActor
            who="dig"
            x={600}
            feet={FLOOR}
            width={310}
            lampX={lamp[0]}
            talk={[claim]}
            bounce={claiming ? 9 : 0}
            sway={0.8}
            armL={4 + up * 136}
            armR={-4 - up * 136 * (claiming ? 1 : 0.4)}
            browLift={0.3 + up * 0.7}
            wide={up * 0.35}
            headTilt={claiming ? Math.sin(frame / 5) * 3 : objecting ? -6 : 0}
          />
          <ShadowActor
            who="doubt"
            x={1330}
            feet={FLOOR}
            width={300}
            lampX={lamp[0]}
            talk={[object]}
            sway={0.5}
            headTilt={objecting ? 7 + Math.sin(frame / 18) * 1.5 : -2}
            browTilt={objecting ? 0.9 : 0.6}
            browLift={objecting ? 0.4 : 0}
            armL={objecting ? 30 : 6}
            armR={objecting ? -14 : -6}
          />
        </Layer>
        <Atmos lamp={lamp} seed={1} />
        <Layer depth={1.5} blur={8}>
          <RoomForeground id="t-fg" />
        </Layer>
      </Stage>
      <Finish hot={lamp} gel={objecting ? SHADOW.gelTeal : SHADOW.gelAmber} gelOpacity={objecting ? 0.22 : 0.28} />
      <Cartouche who={C.who} text={C.line} span={claim} />
      <Cartouche who={O.who} text={O.line} span={object} />
      <ShadowSourceTag text={frame < cut ? C.tag : O.tag} span={frame < cut ? [0, cut - 6] : [cut, len]} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ SHOT: Caerleon, the amphitheatre (parallax push)
const PlaceShot: React.FC<{ len: number }> = ({ len }) => {
  const frame = useCurrentFrame();
  const moon: [number, number] = [1380, 300];
  const cam = { x: drift(frame, len, -90, 90), y: drift(frame, len, 10, -20), zoom: drift(frame, len, 1.0, 1.1) };
  return (
    <AbsoluteFill>
      <Stage cam={cam}>
        <Layer depth={0.05}>
          <Screen hot={moon} spread={1.0} moon seed={2} />
          <Gel color={SHADOW.gelTeal} x={-200} y={-100} w={2300} h={420} opacity={0.3} seed={8} feather={14} />
          {/* torchlight in the arena: a warm pool behind the cut-out, seen through the arena hole */}
          <Bloom x={900} y={830} r={620} opacity={0.75} seed={7} color={SHADOW.screenWarm} />
          <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
            <circle cx={moon[0]} cy={moon[1]} r={70} fill={SHADOW.lampCore} />
          </svg>
          <Bloom x={moon[0]} y={moon[1]} r={340} opacity={0.5} seed={2} color={SHADOW.screenHot} />
        </Layer>
        <Layer depth={0.15} blur={3.5}>
          <Hills id="p-hills" />
        </Layer>
        <Layer depth={0.32} blur={1.6}>
          <FortressWall id="p-wall" />
        </Layer>
        <Layer depth={0.62}>
          {/* the arena floor, lit warm (the "round table"), seen through the hole in the amphitheatre cut-out */}
          <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
            <defs>
              <radialGradient id="arena" cx="50%" cy="45%" r="60%">
                <stop offset="0" stopColor={SHADOW.screenHot} />
                <stop offset="0.5" stopColor={SHADOW.screenWarm} />
                <stop offset="1" stopColor={SHADOW.screenAmber} />
              </radialGradient>
            </defs>
            <ellipse cx={900} cy={850} rx={560} ry={190} fill="url(#arena)" opacity={0.92} />
          </svg>
          <Amphitheatre id="p-amphi" cx={900} cy={840} />

        </Layer>
        <BeamDust lamp={moon} count={40} reach={700} seed={2} />
        <Layer depth={1.25} blur={2}>
          <Hawthorn id="p-thorn" />
        </Layer>
      </Stage>
      <PaperGrain opacity={0.42} />
      <LampVignette hot={moon} strength={0.9} />
      <PlaceTag place="CAERLEON, SOUTH WALES" sub="The Roman amphitheatre at Isca Augusta" span={[8, len - 4]} />
      <ShadowSourceTag text="Placeholder. Site facts pending (sources.md)" span={[0, len]} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ SHOT: the Clerk projects Exhibit A
const SlideShot: React.FC<{ len: number; line: Span }> = ({ len, line }) => {
  const frame = useCurrentFrame();
  const lamp: [number, number] = [380, 240];
  const cam = { x: drift(frame, len, 0, 30), y: 0, zoom: drift(frame, len, 1.0, 1.04) };
  const S = MOMENT_TEXT.source;
  return (
    <AbsoluteFill>
      <Stage cam={cam}>
        <Layer depth={0.08}>
          <Screen hot={[lamp[0] + 120, lamp[1] + 140]} spread={0.75} seed={3} />
        </Layer>
        <Layer depth={0.2} blur={3}>
          <RoomShelves id="s-shelves" />
          <Gel color={SHADOW.gelTeal} x={700} y={0} w={1400} h={1080} opacity={0.35} seed={5} feather={8} />
        </Layer>
        <Layer depth={1}>
          <RoomFloor y={FLOOR} id="s-floor" />
          <ShadowActor who="clerk" x={360} feet={FLOOR} width={300} lampX={lamp[0] - 200} talk={[line]} sway={0.5} armR={interpolate(frame, [line[0] - 4, line[0] + 10], [-4, -60], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} browLift={0.3} />
        </Layer>
        <Layer depth={0.85}>
          <LanternSlide x={690} y={108} w={880} enter={2} label="Geoffrey of Monmouth, c. 1136">
            <ManuscriptArt reveal={interpolate(frame, [10, 40], [0.4, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
          </LanternSlide>
        </Layer>
        <Atmos lamp={lamp} moths={false} seed={3} />
      </Stage>
      <Finish hot={lamp} gelOpacity={0.2} />
      <Cartouche who={S.who} text={S.line} span={line} />
      <ShadowSourceTag text={S.tag} span={[0, len]} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ SHOT: the verdict, a wax seal pressed into glowing parchment
const SealShot: React.FC<{ len: number; line: Span; hit: number }> = ({ len, line, hit }) => {
  const frame = useCurrentFrame();
  const { nudge, flash } = useSealImpact(hit);
  const hot: [number, number] = [1150, 470];
  const cam = { x: drift(frame, len, 0, 20), y: nudge, zoom: drift(frame, len, 1.0, 1.05) };
  const word = interpolate(frame, [hit + 6, hit + 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rose = interpolate(frame, [hit, hit + 20], [0, 0.32], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const V = MOMENT_TEXT.verdict;
  const after = frame >= hit;
  return (
    <AbsoluteFill>
      <Stage cam={cam}>
        <Layer depth={0.08}>
          <Screen hot={hot} spread={0.9} seed={4} />
        </Layer>
        <Layer depth={0.5}>
          <GlowParchment x={650} y={120} w={1080} h={690} rot={-1.2} writing={false}>
            <text x={540} y={100} textAnchor="middle" fontFamily={BANGERS} fontSize={64} letterSpacing={10} fill={SHADOW.scribe} opacity={0.85}>
              THE VERDICT
            </text>
            <line x1={330} x2={750} y1={124} y2={124} stroke={SHADOW.rubric} strokeWidth={3} opacity={0.7} />
            <WaxSeal cx={540} cy={360} r={150} hit={hit} />
            <text x={540} y={640} textAnchor="middle" fontFamily={BANGERS} fontSize={118} letterSpacing={12} fill={SHADOW.wax} opacity={word} transform={`translate(0 ${(1 - word) * 10})`}>
              {VERDICT_WORD}
            </text>
          </GlowParchment>
        </Layer>
        <Layer depth={1}>
          <RoomFloor y={FLOOR} id="v-floor" />
          <ShadowActor who="curator" x={330} feet={FLOOR} width={300} lampX={hot[0]} talk={[line]} sway={0.4} armR={after ? -110 : interpolate(frame, [line[0], hit - 2], [-10, -70], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} browLift={after ? 0.6 : 0.2} mouth={after ? "smile" : undefined} headTilt={after ? 4 : Math.sin(frame / 20) * 2} />
        </Layer>
        <BeamDust lamp={hot} count={50} reach={800} seed={4} />
      </Stage>
      <Gel color={SHADOW.gelRose} x={-100} y={-100} w={2120} h={1280} opacity={rose} seed={9} />
      <Finish hot={hot} gelOpacity={0.18} />
      <WarmFlash amount={flash} />
      <Cartouche who={V.who} text={V.line} span={line} />
      <ShadowSourceTag text={V.tag} span={[0, len]} />
    </AbsoluteFill>
  );
};

/** The whole moment in shadow theatre. `place` (frames) inserts the Caerleon amphitheatre shot before the source beat. */
export const ShadowMoment: React.FC<{ t: MomentTiming; place?: Span }> = ({ t, place }) => {
  const twoEnd = place ? place[0] : t.cuts.source;
  const shots: { from: number; to: number; name: string; el: (start: number) => React.ReactNode }[] = [
    { from: 0, to: t.cuts.claim, name: "open", el: (s) => <RoomShot len={t.cuts.claim - s} line={local(t.lines.open, s)} /> },
    {
      from: t.cuts.claim,
      to: twoEnd,
      name: "claim+object",
      el: (s) => <TwoShot len={twoEnd - s} claim={local(t.lines.claim, s)} object={local(t.lines.object, s)} cut={t.cuts.object - s} />,
    },
    ...(place ? [{ from: place[0], to: place[1], name: "caerleon", el: (s: number) => <PlaceShot len={place[1] - s} /> }] : []),
    { from: t.cuts.source, to: t.cuts.verdict, name: "source", el: (s) => <SlideShot len={t.cuts.verdict - s} line={local(t.lines.source, s)} /> },
    { from: t.cuts.verdict, to: beatEnd(t, "verdict" as BeatId), name: "verdict", el: (s) => <SealShot len={t.end - s} line={local(t.lines.verdict, s)} hit={t.hit - s} /> },
  ];
  return (
    <AbsoluteFill style={{ background: SHADOW.room }}>
      <BoilDefs id="ink" scale={4} rate={8} frequency={0.02} />
      {shots.map((s) => (
        <Sequence key={s.name} from={s.from} durationInFrames={Math.max(1, s.to - s.from)} name={s.name} premountFor={15}>
          {s.el(s.from)}
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
