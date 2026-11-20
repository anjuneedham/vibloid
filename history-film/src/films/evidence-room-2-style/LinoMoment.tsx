import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import { BANGERS } from "../../shared/fonts";
import { BEATS, BeatId, beatEnd, MOMENT_TEXT, MomentTiming, Span, VERDICT_WORD } from "../../shared/moment";
import {
  CarvedHeadline,
  InkWipe,
  LinoActor,
  LinoAmphi,
  LinoDefs,
  LinoGround,
  LinoManuscript,
  LinoPaper,
  LinoSourceTag,
  LinoStamp,
  LinoSun,
  NameBlock,
  Rays,
  regOffset,
  useThump,
} from "../../shared/linocut";
import { LINO } from "../../shared/theme";

// THE EVIDENCE ROOM moment as a LINOCUT print. One idea per beat, hard cuts, huge type.
// Works in 9:16 (the Short: content kept left of x=920 and above y=1540, clear of the Shorts UI) and 16:9 (style reel).

type L = { portrait: boolean; W: number; H: number };
const useL = (): L => {
  const { width, height } = useVideoConfig();
  return { portrait: height > width, W: width, H: height };
};

const Art: React.FC<{ children: React.ReactNode; z?: number }> = ({ children, z = 5 }) => {
  const { W, H } = useL();
  return (
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0, zIndex: z, overflow: "visible" }}>
      <g filter="url(#lino-ink)">{children}</g>
    </svg>
  );
};

const local = (s: Span, start: number): Span => [s[0] - start, s[1] - start];

// ------------------------------------------------------------------ HOOK (the claim as a question, in the first 2 s)
const Hook: React.FC<{ pull: number }> = ({ pull }) => {
  const l = useL();
  const reg = regOffset(pull);
  const P = l.portrait;
  const sun = P ? { cx: 490, cy: 930, r: 250 } : { cx: 1390, cy: 520, r: 270 };
  const am = P ? { cx: 490, cy: 1190, rx: 340, ry: 95 } : { cx: 1390, cy: 790, rx: 380, ry: 100 };
  return (
    <>
      <Art z={2}>
        <g transform={`translate(${reg[0]} ${reg[1]})`}>
          <LinoSun {...sun} />
        </g>
        <Rays cx={sun.cx} cy={sun.cy} r0={sun.r + 26} r1={sun.r * 1.9} n={30} />
        <LinoGround y={P ? 1270 : 860} w={l.W} h={P ? 700 : 300} />
        <LinoAmphi {...am} />
      </Art>
      <InkWipe start={0} dur={4} seed={pull}>
        <CarvedHeadline lines={["KING ARTHUR'S", "ROUND TABLE?"]} x={P ? 64 : 110} y={P ? 180 : 150} w={P ? 860 : 1000} fs={P ? 138 : 150} start={0} perLetter={0.5} ghost={[reg[0] * 1.6, reg[1] * 1.6]} />
      </InkWipe>
      <NameBlock name="CAERLEON, WALES" x={P ? 70 : 116} y={P ? 470 : 480} fs={P ? 62 : 64} start={14} rot={-2} />
      <LinoSourceTag text={MOMENT_TEXT.claim.tag} x={P ? 64 : 110} y={P ? 1424 : 936} w={P ? 850 : 1100} fs={P ? 30 : 28} />
    </>
  );
};

// ------------------------------------------------------------------ CLAIM (Dig)
const Claim: React.FC<{ pull: number; line: Span }> = ({ pull, line }) => {
  const l = useL();
  const frame = useCurrentFrame();
  const reg = regOffset(pull);
  const P = l.portrait;
  const dig = P ? { x: 430, feet: 1390, width: 520 } : { x: 1380, feet: 905, width: 410 };
  return (
    <>
      <Art z={2}>
        <defs>
          <clipPath id="claim-rays">
            <rect x={P ? 0 : 1000} y={P ? 640 : 0} width={l.W} height={l.H} />
          </clipPath>
        </defs>
        <g transform={`translate(${reg[0]} ${reg[1]})`} clipPath="url(#claim-rays)">
          <Rays cx={dig.x} cy={P ? 980 : 520} r0={P ? 150 : 120} r1={P ? 700 : 560} n={24} color={LINO.red} />
        </g>
        <line x1={P ? 40 : 1000} x2={P ? l.W - 40 : 1000} y1={P ? 640 : 70} y2={P ? 640 : 1010} stroke={LINO.ink} strokeWidth={8} />
        <LinoGround y={P ? 1360 : 880} w={l.W} h={P ? 600 : 300} />
      </Art>
      <LinoActor who="dig" {...dig} reg={reg} talk={[line]} armL={118} armR={-118} browLift={1} wide={0.4} bounce={frame % 8 < 4 ? 6 : 0} headTilt={frame % 12 < 6 ? 3 : -3} z={10} />
      <CarvedHeadline lines={["KING ARTHUR", "HELD COURT", "RIGHT HERE!"]} x={P ? 64 : 110} y={P ? 170 : 140} w={P ? 860 : 900} fs={P ? 126 : 132} start={0} perLetter={0.5} />
      <NameBlock name="DIG" x={P ? 80 : 116} y={P ? 680 : 560} fs={P ? 70 : 62} start={2} />
      <LinoSourceTag text={MOMENT_TEXT.claim.tag} x={P ? 64 : 110} y={P ? 1424 : 936} w={P ? 850 : 1100} fs={P ? 30 : 28} />
    </>
  );
};

// ------------------------------------------------------------------ OBJECTION (Doubt): the print reverses, ink block with a paper spotlight
const Objection: React.FC<{ pull: number; line: Span }> = ({ pull, line }) => {
  const l = useL();
  const frame = useCurrentFrame();
  const reg = regOffset(pull);
  const P = l.portrait;
  const dbt = P ? { x: 520, feet: 1390, width: 500 } : { x: 560, feet: 905, width: 390 };
  const disc = P ? { cx: 520, cy: 1010, r: 380 } : { cx: 560, cy: 580, r: 330 };
  return (
    <>
      <InkWipe start={0} dur={4} dir="down" seed={pull + 3}>
        <Art z={2}>
          <rect x={P ? 40 : 40} y={P ? 120 : 70} width={l.W - 80} height={P ? 1460 : 940} fill="url(#lino-gouge)" />
          <circle cx={disc.cx} cy={disc.cy} r={disc.r} fill={LINO.paper} />
          <circle cx={disc.cx} cy={disc.cy} r={disc.r} fill="none" stroke={LINO.ink} strokeWidth={10} />
        </Art>
      </InkWipe>
      <LinoActor who="doubt" {...dbt} reg={reg} talk={[line]} browTilt={0.9} browLift={0.4} headTilt={frame % 20 < 10 ? 7 : 5} armL={34} armR={-12} z={10} />
      <CarvedHeadline lines={["SAYS WHO?"]} x={P ? 70 : 1000} y={P ? 180 : 170} w={P ? 860 : 860} fs={P ? 180 : 200} start={2} color={LINO.paper} perLetter={0.6} />
      <CarvedHeadline lines={P ? ["AND WRITTEN", "DOWN WHEN?"] : ["AND WRITTEN DOWN", "WHEN?"]} x={P ? 74 : 1006} y={P ? 370 : 390} w={P ? 860 : 860} fs={P ? 84 : 92} start={8} color={LINO.paper} perLetter={0.4} />
      <NameBlock name="DOUBT" x={P ? 80 : 1006} y={P ? 590 : 620} fs={P ? 70 : 62} start={4} rot={3} />
      <LinoSourceTag text={MOMENT_TEXT.object.tag} x={P ? 64 : 1006} y={P ? 1424 : 820} w={P ? 850 : 820} fs={P ? 30 : 28} />
    </>
  );
};

// ------------------------------------------------------------------ SOURCE (the Clerk and the manuscript)
const Source: React.FC<{ pull: number; line: Span }> = ({ pull, line }) => {
  const l = useL();
  const reg = regOffset(pull);
  const P = l.portrait;
  const page = P ? { x: 120, y: 560, w: 760, h: 620 } : { x: 760, y: 150, w: 760, h: 640 };
  const clerk = P ? { x: 250, feet: 1400, width: 330 } : { x: 1690, feet: 905, width: 320 };
  return (
    <>
      <Art z={2}>
        <g transform={`translate(${reg[0]} ${reg[1]})`}>
          <rect x={page.x - 40} y={page.y - 40} width={page.w + 80} height={page.h + 80} fill="url(#lino-red-gouge)" opacity={0.9} />
        </g>
        <LinoManuscript {...page} />
        <LinoGround y={P ? 1380 : 880} w={l.W} h={P ? 600 : 300} />
      </Art>
      <LinoActor who="clerk" {...clerk} reg={reg} talk={[line]} armR={-50} browLift={0.4} prop z={10} />
      <CarvedHeadline lines={["EXHIBIT A"]} x={P ? 64 : 110} y={P ? 170 : 150} w={860} fs={P ? 150 : 150} start={0} perLetter={0.5} ghost={[reg[0], reg[1]]} />
      <CarvedHeadline lines={P ? ["GEOFFREY OF MONMOUTH"] : ["GEOFFREY OF", "MONMOUTH"]} x={P ? 70 : 116} y={P ? 330 : 320} w={860} fs={P ? 74 : 84} start={6} perLetter={0.3} />
      <NameBlock name="C. 1136" x={P ? 74 : 116} y={P ? 420 : 520} fs={P ? 70 : 70} start={12} rot={-3} />
      <LinoSourceTag text={MOMENT_TEXT.source.tag} x={P ? 64 : 110} y={P ? 1424 : 936} w={P ? 850 : 1200} fs={P ? 30 : 28} />
    </>
  );
};

// ------------------------------------------------------------------ VERDICT (the red stamp, slammed)
const Verdict: React.FC<{ pull: number; line: Span; hit: number }> = ({ pull, line, hit }) => {
  const l = useL();
  const frame = useCurrentFrame();
  const reg = regOffset(pull);
  const P = l.portrait;
  const cur = P ? { x: 280, feet: 1400, width: 360 } : { x: 370, feet: 905, width: 340 };
  const after = frame >= hit;
  return (
    <>
      <Art z={2}>
        <LinoGround y={P ? 1380 : 880} w={l.W} h={P ? 600 : 300} />
      </Art>
      <LinoActor who="curator" {...cur} reg={reg} talk={[line]} armR={after ? -120 : -30} browLift={after ? 0.6 : 0.2} mouth={after ? "smile" : undefined} z={10} />
      <CarvedHeadline lines={["THE VERDICT"]} x={P ? 64 : 110} y={P ? 180 : 130} w={P ? 860 : 900} fs={P ? 140 : 120} start={0} perLetter={0.5} />
      <LinoStamp word={VERDICT_WORD} cx={P ? 490 : 1180} cy={P ? 640 : 500} w={P ? 820 : 960} fs={P ? 160 : 190} hit={hit} rot={-8} />
      {after ? (
        <div style={{ position: "absolute", left: P ? 520 : 1260, top: P ? 980 : 760, width: P ? 380 : 560, fontFamily: BANGERS, fontSize: P ? 52 : 50, lineHeight: 1.05, color: LINO.ink, filter: "url(#lino-ink)", zIndex: 60 }}>
          FULL CASE:
          <br />
          <span style={{ color: LINO.red }}>EVIDENCE ROOM 2</span>
        </div>
      ) : null}
      <LinoSourceTag text={MOMENT_TEXT.verdict.tag} x={P ? 64 : 110} y={P ? 1424 : 936} w={P ? 850 : 1100} fs={P ? 30 : 28} />
    </>
  );
};

/** The whole moment as a print. Hard cut between beats; each cut is a new "pull" (new registration, new ink specks). */
export const LinoMoment: React.FC<{ t: MomentTiming }> = ({ t }) => {
  const frame = useCurrentFrame();
  const thump = useThump(t.hit);
  const pull = BEATS.findIndex((b) => frame < beatEnd(t, b));
  const els: Record<BeatId, (s: number, i: number) => React.ReactNode> = {
    open: (_s, i) => <Hook pull={i} />,
    claim: (s, i) => <Claim pull={i} line={local(t.lines.claim, s)} />,
    object: (s, i) => <Objection pull={i} line={local(t.lines.object, s)} />,
    source: (s, i) => <Source pull={i} line={local(t.lines.source, s)} />,
    verdict: (s, i) => <Verdict pull={i} line={local(t.lines.verdict, s)} hit={t.hit - s} />,
  };
  return (
    <AbsoluteFill style={{ background: LINO.paper, transform: thump }}>
      <LinoDefs seed={3 + Math.max(0, pull) * 5} />
      <LinoPaper>
        {BEATS.map((b, i) => (
          <Sequence key={b} from={t.cuts[b]} durationInFrames={Math.max(1, beatEnd(t, b) - t.cuts[b])} name={b}>
            {els[b](t.cuts[b], i)}
          </Sequence>
        ))}
      </LinoPaper>
    </AbsoluteFill>
  );
};
