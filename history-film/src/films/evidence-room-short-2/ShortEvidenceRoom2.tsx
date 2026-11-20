import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import type { Who } from "../../shared/comic";
import { BANGERS, COMIC, FELL } from "../../shared/fonts";
import { CarvedHeadline, InkWipe, LinoActor, LinoAmphi, LinoDefs, LinoGround, LinoPaper, LinoStamp, LinoSun, NameBlock, Rays, regOffset, useThump } from "../../shared/linocut";
import type { Span } from "../../shared/moment";
import { LINO } from "../../shared/theme";
import EP from "../evidence-room-2/episode.json";
import { LINE_TEXT, LineId, linePages } from "../evidence-room-2/lines";
import { HAS_SHORT_VOICEOVER, SHORT_FRAMES, SHORT_ORDER, SHORT_VOICEOVER, sf, slf, VERDICT_HIT } from "./timing";

// THE EVIDENCE ROOM, PART 2: the Short (1080 x 1920), LINOCUT two-colour print. Cut from the long film's takes.
// SAFE AREA: every key element sits left of x = 920 and above y = 1540 (Shorts UI covers the right 160 px and bottom 380 px).
// Zones: wordmark (64, 64) | headline y 150-560 | figure + art y 560-1140 | cartouche y 1160-1390 | source tag y 1405-1530.

const SAFE_R = 920;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Art: React.FC<{ children: React.ReactNode; z?: number }> = ({ children, z = 5 }) => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, zIndex: z, overflow: "visible" }}>
    <g filter="url(#lino-ink)">{children}</g>
  </svg>
);

/** Scene clock: local spans for lines. */
const useScene = (start: number) => {
  const frame = useCurrentFrame();
  const S = (id: LineId): Span => {
    const s = slf(id);
    return [s[0] - start, s[1] - start];
  };
  return { frame, S };
};

// ------------------------------------------------------------------ the printed cartouche (speech, lower third)
const NAME: Record<Who, string> = { curator: "THE CURATOR", dig: "DIG", doubt: "DOUBT", clerk: "THE CLERK" };

const LinoCartouche: React.FC<{ id: LineId }> = ({ id }) => {
  const frame = useCurrentFrame();
  const [a, b] = slf(id);
  // hold through the short pause until the next line starts (no empty plate gaps)
  const k = SHORT_ORDER.indexOf(id);
  const next = k < SHORT_ORDER.length - 1 ? slf(SHORT_ORDER[k + 1])[0] : b + 20;
  if (frame < a - 3 || frame >= Math.max(b + 2, next - 3)) return null;
  const pages = linePages(id);
  const dur = b - a;
  let pi = pages.findIndex((p) => frame < a + dur * p.to);
  if (pi < 0) pi = pages.length - 1;
  const page = pages[pi];
  const p0 = a + dur * page.from;
  const words = page.text.split(" ");
  const per = Math.max(1, Math.min(3, (a + dur * page.to - p0) / (words.length * 2.4)));
  return (
    <div style={{ position: "absolute", left: 64, top: 1180, width: SAFE_R - 64, zIndex: 70 }}>
      <div style={{ position: "relative", background: LINO.paper, border: `8px solid ${LINO.ink}`, padding: "40px 30px 22px", filter: "url(#lino-ink)", minHeight: 120 }}>
        <div style={{ fontFamily: COMIC, fontWeight: 700, fontSize: 48, lineHeight: 1.16, color: LINO.ink }}>
          {words.map((w, i) => (
            <span key={i} style={{ whiteSpace: "nowrap", opacity: frame >= Math.floor((p0 + i * per) / 2) * 2 ? 1 : 0.12 }}>
              {w}{" "}
            </span>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", left: 24, top: -30, background: LINO.red, padding: "6px 16px 0", filter: "url(#lino-ink)" }}>
        <div style={{ fontFamily: BANGERS, fontSize: 46, letterSpacing: 3, color: LINO.paper, lineHeight: 1.05 }}>{NAME[LINE_TEXT[id].who]}</div>
      </div>
    </div>
  );
};

/** Source tag: the black bar is printed (bitten edges), the words are clean so they read at phone size. */
const Tag: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: "absolute", left: 64, top: 1412, maxWidth: SAFE_R - 64, zIndex: 60 }}>
    <div style={{ position: "absolute", inset: 0, background: LINO.ink, filter: "url(#lino-ink)" }} />
    <div style={{ position: "relative", padding: "9px 18px 11px" }}>
      <span style={{ fontFamily: BANGERS, fontSize: 32, letterSpacing: 2, color: LINO.red, marginRight: 12 }}>SOURCE</span>
      <span style={{ fontFamily: COMIC, fontWeight: 700, fontSize: 30, color: LINO.paper, lineHeight: 1.2 }}>{text}</span>
    </div>
  </div>
);

const TAG = {
  hook: "Cadw; Museum Wales (full list in the description)",
  claim: "Museum Wales; Ordnance Survey maps, recorded 1898 to 1908",
  romans: "Cadw; Museum Wales",
  table: "Geoffrey, Book IX ch. 13 (Evans translation); Wace, Roman de Brut, 1155",
  paper: "Cadw, Trailblazers: Tessa Verney Wheeler (booklet), pp. 22 to 25; Coflein",
  verdict: "All exhibits in the full episode (sources in the description)",
};

// ------------------------------------------------------------------ scenes
const Hook: React.FC<{ start: number; pull: number }> = ({ start, pull }) => {
  const { S } = useScene(start);
  const reg = regOffset(pull);
  return (
    <>
      <Art z={2}>
        <g transform={`translate(${reg[0]} ${reg[1]})`}>
          <LinoSun cx={400} cy={850} r={190} />
        </g>
        <Rays cx={400} cy={850} r0={214} r1={380} n={28} />
        <LinoGround y={1080} w={SAFE_R + 60} h={80} />
        <LinoAmphi cx={400} cy={1040} rx={280} ry={74} />
      </Art>
      <InkWipe start={0} dur={4} seed={pull}>
        <CarvedHeadline lines={["KING ARTHUR'S", "ROUND TABLE?"]} x={64} y={160} w={856} fs={124} start={0} perLetter={0.4} ghost={[reg[0] * 1.6, reg[1] * 1.6]} />
      </InkWipe>
      <NameBlock name="A ROMAN RUIN IN WALES" x={70} y={440} fs={56} start={10} rot={-2} />
      <LinoActor who="curator" x={790} feet={1140} width={230} reg={reg} talk={[S("L02")]} armR={-40} z={10} />
      <Tag text={TAG.hook} />
    </>
  );
};

const Claim: React.FC<{ start: number; pull: number }> = ({ start, pull }) => {
  const { S, frame } = useScene(start);
  const reg = regOffset(pull);
  const map = interpolate(frame, [S("L04")[0] + (S("L04")[1] - S("L04")[0]) * linePages("L04")[2].from - 6, S("L04")[0] + (S("L04")[1] - S("L04")[0]) * linePages("L04")[2].from + 4], [0, 1], clamp);
  return (
    <>
      <Art z={2}>
        <defs>
          <clipPath id="sc-rays">
            <rect x={40} y={580} width={SAFE_R} height={560} />
          </clipPath>
        </defs>
        <g transform={`translate(${reg[0]} ${reg[1]})`} clipPath="url(#sc-rays)">
          <Rays cx={260} cy={900} r0={120} r1={560} n={22} color={LINO.red} />
        </g>
        <LinoGround y={1110} w={SAFE_R + 60} h={50} />
        {/* the map's oval, labelled as the map labels it */}
        <g opacity={map > 0 ? 1 : 0}>
          <LinoAmphi cx={700} cy={860} rx={170} ry={58} />
        </g>
      </Art>
      <LinoActor who="dig" x={260} feet={1110} width={330} reg={reg} talk={[S("L04")]} armL={118} armR={-118} browLift={1} wide={0.4} bounce={frame % 8 < 4 ? 6 : 0} z={10} />
      <CarvedHeadline lines={["OLD MAPS", "LABEL IT:"]} x={64} y={160} w={856} fs={124} start={0} perLetter={0.4} />
      {map > 0 ? (
        <div style={{ position: "absolute", left: 500, top: 620, width: 410, transform: `rotate(-3deg) scale(${0.8 + 0.2 * map})`, background: LINO.paper, border: `6px solid ${LINO.ink}`, padding: "12px 16px", filter: "url(#lino-ink)", zIndex: 30, textAlign: "center" }}>
          <div style={{ fontFamily: FELL, fontStyle: "italic", fontSize: 44, lineHeight: 1.05, color: LINO.ink }}>King Arthur’s Round Table</div>
          <div style={{ fontFamily: FELL, fontSize: 28, letterSpacing: 5, color: LINO.red, marginTop: 4 }}>AMPHITHEATRE</div>
        </div>
      ) : null}
      <Tag text={TAG.claim} />
    </>
  );
};

const Cinema: React.FC<{ start: number; pull: number }> = ({ start, pull }) => {
  const { S } = useScene(start);
  const reg = regOffset(pull);
  return (
    <>
      <Art z={2}>
        <LinoGround y={1110} w={SAFE_R + 60} h={50} />
        <LinoAmphi cx={330} cy={1010} rx={230} ry={64} />
        {/* a projector beam out of the arena */}
        <g transform={`translate(${reg[0]} ${reg[1]})`}>
          <path d="M330 990 L 120 640 L 560 640 Z" fill={LINO.red} opacity={0.85} />
        </g>
      </Art>
      <CarvedHeadline lines={["CADW CALLS IT:"]} x={64} y={150} w={856} fs={100} start={0} perLetter={0.4} />
      <div style={{ position: "absolute", left: 64, top: 270, width: 856, fontFamily: BANGERS, fontSize: 74, lineHeight: 1.0, color: LINO.ink, filter: "url(#lino-ink)", zIndex: 40 }}>
        “THE ROMAN EQUIVALENT OF TODAY’S <span style={{ color: LINO.red }}>MULTIPLEX CINEMA</span>”
      </div>
      <LinoActor who="curator" x={760} feet={1110} width={260} reg={reg} talk={[S("L09")]} armR={-60} z={10} />
      <Tag text={TAG.romans} />
    </>
  );
};

const ThroneRoom: React.FC<{ start: number; pull: number }> = ({ start, pull }) => {
  const { S, frame } = useScene(start);
  const reg = regOffset(pull);
  const x = interpolate(frame, [S("L10")[0] + 20, S("L10")[0] + 26], [0, 1], clamp);
  return (
    <>
      <InkWipe start={0} dur={4} dir="down" seed={pull + 3}>
        <Art z={2}>
          <rect x={40} y={120} width={SAFE_R - 20} height={1040} fill="url(#lino-gouge)" />
          <circle cx={480} cy={860} r={290} fill={LINO.paper} />
          <circle cx={480} cy={860} r={290} fill="none" stroke={LINO.ink} strokeWidth={10} />
        </Art>
      </InkWipe>
      <CarvedHeadline lines={["THRONE ROOM?"]} x={70} y={170} w={856} fs={150} start={2} color={LINO.paper} perLetter={0.5} />
      {/* a carved crown, crossed out in red */}
      <Art z={20}>
        <path d="M640 420 L 640 360 L 680 392 L 720 340 L 760 392 L 800 360 L 800 420 Z" fill={LINO.paper} />
        {x > 0 ? <path d="M620 330 L 830 450 M830 330 L 620 450" stroke={LINO.red} strokeWidth={22} /> : null}
      </Art>
      <LinoActor who="doubt" x={480} feet={1130} width={360} reg={reg} talk={[S("L10")]} browTilt={0.9} browLift={0.3} headTilt={6} armL={30} armR={-12} z={10} />
      <Tag text={TAG.romans} />
    </>
  );
};

const NoTable: React.FC<{ start: number; pull: number }> = ({ start, pull }) => {
  const { S, frame } = useScene(start);
  const reg = regOffset(pull);
  const s = S("L17");
  const st1 = s[0] + 2;
  const st2 = s[0] + Math.round((s[1] - s[0]) * linePages("L17")[1].from);
  const stamp = (t: number, word: string, y: number) =>
    frame >= t ? (
      <div style={{ position: "absolute", left: 360, top: y, transform: `rotate(-7deg) scale(${frame - t < 2 ? 1.3 : 1})`, border: `7px solid ${LINO.red}`, padding: "6px 16px 0", fontFamily: BANGERS, fontSize: 58, letterSpacing: 2, color: LINO.red, filter: "url(#lino-stamp)", zIndex: 40, background: LINO.paper }}>
        {word}
      </div>
    ) : null;
  return (
    <>
      <Art z={2}>
        <g transform={`translate(${reg[0]} ${reg[1]})`}>
          <rect x={300} y={560} width={600} height={560} fill="url(#lino-red-gouge)" />
        </g>
        <rect x={330} y={590} width={540} height={500} fill={LINO.paper} stroke={LINO.ink} strokeWidth={10} />
        <LinoGround y={1130} w={SAFE_R + 60} h={30} />
      </Art>
      <div style={{ position: "absolute", left: 360, top: 620, width: 480, fontFamily: FELL, fontSize: 38, lineHeight: 1.18, color: LINO.ink, zIndex: 30, textAlign: "center" }}>
        … when all were set at table according as the rank of each did demand …
        <div style={{ fontFamily: COMIC, fontWeight: 700, fontSize: 24, marginTop: 10 }}>Evans translation (1904), Book IX ch. XIII</div>
      </div>
      {stamp(st1, "ROUND TABLE: 0", 900)}
      {stamp(st2, "AMPHITHEATRE: 0", 990)}
      <CarvedHeadline lines={["GEOFFREY'S BOOK,", "c. 1136"]} x={64} y={160} w={856} fs={112} start={0} perLetter={0.4} ghost={[reg[0], reg[1]]} />
      <LinoActor who="clerk" x={170} feet={1130} width={230} reg={reg} talk={[s]} armR={-60} prop z={10} />
      <Tag text={TAG.table} />
    </>
  );
};

const Paper: React.FC<{ start: number; pull: number }> = ({ start, pull }) => {
  const { S, frame } = useScene(start);
  const reg = regOffset(pull);
  const dig = Math.sin(frame / 6) * 14;
  return (
    <>
      <Art z={2}>
        <LinoGround y={1110} w={SAFE_R + 60} h={50} />
        <LinoAmphi cx={360} cy={1040} rx={250} ry={64} />
        {/* a spade, carved, digging */}
        <g transform={`translate(360 900) rotate(${-20 + dig})`}>
          <rect x={-8} y={-220} width={16} height={230} fill={LINO.ink} />
          <path d="M-30 10 L 30 10 L 24 80 L -24 80 Z" fill={LINO.red} />
        </g>
        {/* a folded newspaper (no masthead, no invented words): ruled columns only */}
        <g transform={`translate(${600 + reg[0]} ${640 + reg[1]}) rotate(6)`}>
          <rect width={290} height={360} fill={LINO.paper} stroke={LINO.ink} strokeWidth={8} />
          <rect x={20} y={20} width={250} height={56} fill={LINO.ink} />
          {[0, 1, 2].map((c) => (
            <rect key={c} x={20 + c * 86} y={96} width={74} height={244} fill="url(#lino-hatch)" />
          ))}
        </g>
      </Art>
      <CarvedHeadline lines={["1926: A NEWSPAPER", "PAID FOR", "THE DIG"]} x={64} y={150} w={856} fs={110} start={0} perLetter={0.35} />
      <LinoActor who="clerk" x={800} feet={1110} width={200} reg={reg} talk={[S("L26")]} armR={-50} prop z={10} />
      <Tag text={TAG.paper} />
    </>
  );
};

const Untrue: React.FC<{ start: number; pull: number }> = ({ start, pull }) => {
  const { S } = useScene(start);
  const reg = regOffset(pull);
  return (
    <>
      <Art z={2}>
        <g transform={`translate(${reg[0]} ${reg[1]})`}>
          <rect x={64} y={300} width={856} height={330} fill={LINO.red} />
        </g>
        <LinoGround y={1110} w={SAFE_R + 60} h={50} />
      </Art>
      <CarvedHeadline lines={["CADW'S OWN BOOKLET:"]} x={64} y={160} w={856} fs={92} start={0} perLetter={0.35} />
      <div style={{ position: "absolute", left: 90, top: 320, width: 800, fontFamily: BANGERS, fontSize: 90, lineHeight: 1.02, color: LINO.paper, filter: "url(#lino-ink)", zIndex: 40 }}>
        “AN APPEALING, (THOUGH UNTRUE), STORY”
      </div>
      <LinoActor who="curator" x={480} feet={1110} width={300} reg={reg} talk={[S("L28")]} armR={-60} browLift={0.4} z={10} />
      <Tag text={TAG.paper} />
    </>
  );
};

const Verdict: React.FC<{ start: number; pull: number }> = ({ start, pull }) => {
  const { S, frame } = useScene(start);
  const reg = regOffset(pull);
  const hit = sf(VERDICT_HIT) - start;
  const after = frame >= hit;
  return (
    <>
      <Art z={2}>
        <LinoGround y={1120} w={SAFE_R + 60} h={40} />
      </Art>
      <CarvedHeadline lines={["THE VERDICT"]} x={64} y={160} w={856} fs={140} start={0} perLetter={0.5} />
      <LinoStamp word={EP.verdict} cx={490} cy={520} w={780} fs={150} hit={hit} rot={-8} />
      <LinoActor who="curator" x={300} feet={1120} width={300} reg={reg} talk={[S("L36")]} armR={after ? -120 : -30} browLift={after ? 0.6 : 0.2} mouth={after ? "smile" : undefined} z={10} />
      <Tag text={TAG.verdict} />
    </>
  );
};

const Button: React.FC<{ start: number; pull: number }> = ({ start, pull }) => {
  const { S, frame } = useScene(start);
  const reg = regOffset(pull);
  const end = S("L38")[1];
  return (
    <>
      <Art z={2}>
        <g transform={`translate(${reg[0]} ${reg[1]})`}>
          <rect x={64} y={560} width={856} height={560} fill="url(#lino-red-gouge)" opacity={0.85} />
        </g>
        <LinoGround y={1120} w={SAFE_R + 60} h={40} />
      </Art>
      <CarvedHeadline lines={["THE ROUND TABLE", "AT CAERLEON:"]} x={64} y={160} w={856} fs={104} start={0} perLetter={0.35} />
      <NameBlock name={EP.verdict} x={70} y={400} fs={90} start={4} rot={-3} />
      <LinoActor who="dig" x={280} feet={1120} width={300} reg={reg} talk={[S("L37")]} armL={110} armR={-110} browLift={1} z={10} />
      <LinoActor who="doubt" x={680} feet={1120} width={300} reg={reg} talk={[S("L38")]} browTilt={0.9} headTilt={6} z={10} />
      {frame > end + 6 ? (
        <div style={{ position: "absolute", left: 64, top: 1180, width: 856, background: LINO.ink, padding: "26px 30px", filter: "url(#lino-ink)", zIndex: 80 }}>
          <div style={{ fontFamily: BANGERS, fontSize: 64, letterSpacing: 2, color: LINO.paper, lineHeight: 1.05 }}>
            FULL CASE: <span style={{ color: LINO.red }}>THE EVIDENCE ROOM, PART 2</span>
          </div>
        </div>
      ) : null}
      <Tag text={TAG.verdict} />
    </>
  );
};

// scene -> first line; each scene starts a few frames before its first line (hard cut, new "pull")
const SCENES: { first: LineId; C: React.FC<{ start: number; pull: number }> }[] = [
  { first: "L02", C: Hook },
  { first: "L04", C: Claim },
  { first: "L09", C: Cinema },
  { first: "L10", C: ThroneRoom },
  { first: "L17", C: NoTable },
  { first: "L26", C: Paper },
  { first: "L28", C: Untrue },
  { first: "L36", C: Verdict },
  { first: "L37", C: Button },
];
const cut = (i: number) => (i === 0 ? 0 : slf(SCENES[i].first)[0] - 5);

export const ShortEvidenceRoom2: React.FC = () => {
  const frame = useCurrentFrame();
  const pull = Math.max(0, SCENES.findIndex((_, i) => i === SCENES.length - 1 || frame < cut(i + 1)));
  const thump = useThump(sf(VERDICT_HIT));
  return (
    <AbsoluteFill style={{ background: LINO.paper }}>
      <AbsoluteFill style={{ transform: thump }}>
        <LinoDefs seed={3 + pull * 5} />
        <LinoPaper>
          {SCENES.map((s, i) => {
            const from = cut(i);
            const to = i < SCENES.length - 1 ? cut(i + 1) : SHORT_FRAMES;
            return (
              <Sequence key={s.first} from={from} durationInFrames={to - from} name={`scene-${s.first}`}>
                <s.C start={from} pull={i} />
              </Sequence>
            );
          })}
          {/* the Shorts UI zone (y > 1540): decorative carved block only, never key content */}
          <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0, zIndex: 1 }}>
            <g filter="url(#lino-ink)">
              <path d="M-20 1575 Q 270 1550 540 1570 T 1100 1560 L1100 1940 L-20 1940 Z" fill="url(#lino-gouge)" />
            </g>
          </svg>
          {SHORT_ORDER.map((id) => (
            <LinoCartouche key={id} id={id} />
          ))}
        </LinoPaper>
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 64, top: 64, fontFamily: BANGERS, fontSize: 44, letterSpacing: 2, color: LINO.ink, zIndex: 900, filter: "url(#lino-ink)" }}>
        PAST <span style={{ color: LINO.red }}>TENSE</span>
      </div>
      {HAS_SHORT_VOICEOVER ? <Audio src={staticFile(SHORT_VOICEOVER)} /> : null}
    </AbsoluteFill>
  );
};
