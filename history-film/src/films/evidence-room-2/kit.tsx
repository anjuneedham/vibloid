import React, { createContext, useContext } from "react";
import { AbsoluteFill, Easing, interpolate, Sequence, useCurrentFrame } from "remotion";
import type { Who } from "../../shared/comic";
import { BANGERS, COMIC } from "../../shared/fonts";
import type { Span } from "../../shared/moment";
import type { PlayerProps } from "../../shared/Player";
import {
  BeamDust,
  Bloom,
  Cutout,
  Gel,
  HangingLamp,
  lampSwing,
  LampVignette,
  Layer,
  Moths,
  PaperGrain,
  PinBoard,
  RoomFloor,
  RoomForeground,
  RoomShelves,
  Screen,
  ShadowActor,
  ShadowSourceTag,
  Stage,
} from "../../shared/shadow";
import { BAR_HEIGHT, SHADOW } from "../../shared/theme";
import { LINE_IDS, LINE_TEXT, LineId, linePages } from "./lines";
import { beatSpan, lf } from "./timing";

// Building blocks for EvidenceRoom2 (lantern-lit shadow theatre). Everything is placed in ABSOLUTE frames
// derived from line times, so the whole film re-flows when real timings replace the estimate.

export const ease = Easing.inOut(Easing.sin);
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const drift = (frame: number, len: number, from: number, to: number) => interpolate(frame, [0, len], [from, to], { ...clamp, easing: ease });
export const FLOOR = 905;

// ------------------------------------------------------------------ the shot clock
const ShotCtx = createContext({ start: 0, len: 1, key: "s" });

/** One shot: a Sequence that knows its absolute start, so children can ask for line spans in local frames. */
export const Shot: React.FC<{ from: number; to: number; name: string; children: React.ReactNode }> = ({ from, to, name, children }) => (
  <Sequence from={from} durationInFrames={Math.max(1, to - from)} name={name} premountFor={20}>
    <ShotCtx.Provider value={{ start: from, len: Math.max(1, to - from), key: name }}>{children}</ShotCtx.Provider>
  </Sequence>
);

export const useShot = () => {
  const c = useContext(ShotCtx);
  const frame = useCurrentFrame();
  /** a line's span in this shot's local frames */
  const S = (id: LineId): Span => {
    const s = lf(id);
    return [s[0] - c.start, s[1] - c.start];
  };
  /** absolute frame -> local frame */
  const T = (abs: number) => abs - c.start;
  /** local frame where page `p` of a line starts */
  const P = (id: LineId, p: number) => {
    const s = lf(id);
    const pg = linePages(id)[p];
    return Math.round(s[0] + (s[1] - s[0]) * pg.from) - c.start;
  };
  return { frame, len: c.len, key: c.key, S, T, P };
};

/** All the talk spans for one cast member, in local frames (lip-flap only on their own lines). */
export const useTalk = (who: Who): Span[] => {
  const { S } = useShot();
  return LINE_IDS.filter((id) => LINE_TEXT[id].who === who).map((id) => S(id));
};

// ------------------------------------------------------------------ cast on the stage
export type CastSpec = { who: Who; x: number; width?: number; feet?: number; idle?: boolean } & Partial<Omit<PlayerProps, "who" | "x">>;

/** Camera lean toward whoever is speaking (two-shot rule: lean ~ instead of cutting). Returns cam x. */
export const useLean = (cast: CastSpec[], amount = 0.2) => {
  const { frame, S } = useShot();
  const events: [number, number][] = [];
  for (const id of LINE_IDS) {
    const c = cast.find((k) => k.who === LINE_TEXT[id].who);
    if (!c) continue;
    const sp = S(id);
    if (sp[1] < -30) continue;
    events.push([sp[0] - 10, (c.x - 960) * amount]);
  }
  if (!events.length) return 0;
  let x = events[0][1];
  for (let i = 1; i < events.length; i++) {
    const [t, to] = events[i];
    x = interpolate(frame, [t, t + 20], [x, to], { ...clamp, easing: ease });
  }
  return x;
};

export const Actor: React.FC<CastSpec & { lampX: number; k: string }> = ({ who, x, width = 290, feet = FLOOR, lampX, k, ...rest }) => {
  const talk = useTalk(who);
  return <ShadowActor who={who} x={x} feet={feet} width={width} lampX={lampX} talk={talk} boil="ink" seed={k.length + x} {...rest} />;
};

// ------------------------------------------------------------------ light
/** The hanging lamp's beam: a soft cone down to the floor and a warm pool where it lands. Swings with the lamp. */
export const LampCone: React.FC<{ x: number; y?: number; floor?: number; strength?: number; k: string }> = ({ x, y = 224, floor = FLOOR, strength = 1, k }) => {
  const frame = useCurrentFrame();
  const sw = lampSwing(frame);
  const dx = Math.tan((sw * Math.PI) / 180) * (floor + 40);
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", mixBlendMode: "screen", pointerEvents: "none" }}>
      <defs>
        <linearGradient id={`${k}-cone`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={SHADOW.lampCore} stopOpacity={0.42 * strength} />
          <stop offset="0.6" stopColor={SHADOW.lampGlow} stopOpacity={0.14 * strength} />
          <stop offset="1" stopColor={SHADOW.lampGlow} stopOpacity={0.03 * strength} />
        </linearGradient>
        <radialGradient id={`${k}-pool`}>
          <stop offset="0" stopColor={SHADOW.lampCore} stopOpacity={0.75 * strength} />
          <stop offset="0.5" stopColor={SHADOW.lampGlow} stopOpacity={0.35 * strength} />
          <stop offset="1" stopColor={SHADOW.lampGlow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={`M${x - 96} ${y} L${x + 96} ${y} L${x + dx + 560} ${floor + 10} L${x + dx - 560} ${floor + 10} Z`} fill={`url(#${k}-cone)`} />
      <ellipse cx={x + dx} cy={floor + 22} rx={600} ry={70} fill={`url(#${k}-pool)`} />
    </svg>
  );
};

/** Key-light pass: a warm wash on the lamp side and a deep falloff away from it (kills the flat look). */
export const KeyLight: React.FC<{ x: number; y?: number; strength?: number }> = ({ x, y = 300, strength = 1 }) => (
  <>
    <AbsoluteFill
      style={{
        background: `radial-gradient(900px 760px at ${x}px ${y + 200}px, ${SHADOW.lampGlow} 0%, rgba(0,0,0,0) 70%)`,
        mixBlendMode: "soft-light",
        opacity: 0.55 * strength,
        pointerEvents: "none",
      }}
    />
    <AbsoluteFill
      style={{
        background: `radial-gradient(1500px 1100px at ${x}px ${y + 240}px, rgba(0,0,0,0) 35%, ${SHADOW.room} 100%)`,
        mixBlendMode: "multiply",
        opacity: 0.75 * strength,
        pointerEvents: "none",
      }}
    />
  </>
);

/** Gel + paper grain + vignette: the last three passes of every shot. */
export const Finish: React.FC<{ hot: [number, number]; gel?: string; gelOpacity?: number; vignette?: number }> = ({ hot, gel = SHADOW.gelAmber, gelOpacity = 0.26, vignette = 0.92 }) => (
  <>
    <Gel color={gel} x={-120} y={-80} w={2160} h={300} opacity={gelOpacity} rot={-2} seed={4} />
    <PaperGrain opacity={0.42} />
    <LampVignette hot={hot} strength={vignette} />
  </>
);

/** Midground evidence table on the left (depth between board and cast): files, a ledger, a candle stub. */
const EvidenceTable: React.FC<{ id: string }> = ({ id }) => (
  <Cutout id={id} rim={0.8} shade={0.3}>
    <rect x={-200} y={712} width={600} height={26} fill="white" />
    <rect x={-160} y={738} width={22} height={200} fill="white" />
    <rect x={330} y={738} width={22} height={200} fill="white" />
    <rect x={-120} y={640} width={150} height={72} fill="white" />
    <rect x={-110} y={600} width={130} height={40} fill="white" />
    <rect x={60} y={672} width={190} height={40} fill="white" transform="rotate(-4 155 692)" />
    <rect x={290} y={650} width={22} height={62} fill="white" />
    <path d="M301 650 Q 292 636 301 618 Q 310 636 301 650 Z" fill="black" />
  </Cutout>
);

// ------------------------------------------------------------------ THE EVIDENCE ROOM (fixed: key light, depth, lamp pool, board shadow)
export const BOARD_LABELS = ["GEOFFREY c. 1136", "WACE 1155", "GERALD 1188", "TENNYSON 1856", "THE DIG 1926", "OS MAPS c. 1900"];

export const Room: React.FC<{
  cast: CastSpec[];
  lampX?: number;
  zoom?: [number, number];
  pan?: [number, number];
  lean?: number;
  gel?: string;
  gelOpacity?: number;
  dim?: number;
  lit?: number[];
  labels?: string[];
  table?: boolean;
  moths?: boolean;
  children?: React.ReactNode;
}> = ({ cast, lampX = 900, zoom = [1.0, 1.05], pan = [0, 0], lean = 0.2, gel, gelOpacity, dim = 0, lit = [], labels = BOARD_LABELS, table = true, moths = true, children }) => {
  const { frame, len, key: k } = useShot();
  const lx = useLean(cast, lean);
  const cam = { x: lx + drift(frame, len, pan[0], pan[1]), y: drift(frame, len, 0, -10), zoom: drift(frame, len, zoom[0], zoom[1]) };
  const lamp: [number, number] = [lampX, 222];
  const boardDx = (1010 - lampX) * 0.09;
  return (
    <AbsoluteFill>
      <Stage cam={cam}>
        <Layer depth={0.08}>
          <Screen hot={[lamp[0], lamp[1] + 150]} spread={0.72 - dim * 0.25} seed={k.length} />
        </Layer>
        <Layer depth={0.2}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.85 }}>
            <RoomShelves id={`${k}-sh`} />
          </div>
        </Layer>
        <Layer depth={0.42}>
          {/* the board's shadow on the screen, thrown away from the lamp */}
          <div
            style={{
              position: "absolute",
              left: 480 + boardDx * 4,
              top: 150 + 26,
              width: 1060,
              height: 480,
              background: SHADOW.cut,
              opacity: 0.45,
              filter: "blur(22px)",
              borderRadius: 8,
            }}
          />
        </Layer>
        <Layer depth={0.45}>
          <PinBoard id={`${k}-bd`} lit={lit} labels={labels} />
        </Layer>
        <Layer depth={0.7}>
          <HangingLamp x={lamp[0]} y={lamp[1]} id={`${k}-lp`} />
        </Layer>
        {table ? (
          <Layer depth={0.85}>
            <EvidenceTable id={`${k}-tb`} />
          </Layer>
        ) : null}
        <Layer depth={1}>
          <RoomFloor y={FLOOR} id={`${k}-fl`} />
          <LampCone x={lamp[0]} k={k} strength={1 - dim * 0.4} />
          {cast.map((c) => (
            <Actor key={c.who} lampX={lamp[0]} k={k} {...c} />
          ))}
          {children}
        </Layer>
        <Bloom x={lamp[0]} y={lamp[1] + 30} r={520} opacity={0.42 * (1 - dim * 0.4)} seed={k.length} />
        <BeamDust lamp={lamp} count={50} reach={900} seed={k.length} />
        {moths ? <Moths lamp={[lamp[0], lamp[1] + 20]} count={2} radius={150} seed={k.length} shadows={false} /> : null}
        <Layer depth={1.4}>
          <RoomForeground id={`${k}-fg`} />
        </Layer>
      </Stage>
      <KeyLight x={lamp[0]} strength={1 + dim * 0.5} />
      {dim > 0 ? <AbsoluteFill style={{ background: SHADOW.room, opacity: dim * 0.45, mixBlendMode: "multiply" }} /> : null}
      <Finish hot={lamp} gel={gel} gelOpacity={gelOpacity} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ the lower-third cartouche (one plate per line, pages inside)
const SPEAKER: Record<Who, { name: string; accent: string }> = {
  curator: { name: "THE CURATOR", accent: SHADOW.brass },
  dig: { name: "DIG", accent: SHADOW.gelAmber },
  doubt: { name: "DOUBT", accent: SHADOW.thread },
  clerk: { name: "THE CLERK", accent: SHADOW.gelTeal },
};

const LineCartouche: React.FC<{ id: LineId }> = ({ id }) => {
  const frame = useCurrentFrame();
  const [a, b] = lf(id);
  // hold the caption through the pause after the line (no empty lower third between lines):
  // until the next line takes over, at most 0.9 s, then a quick fade
  const i = LINE_IDS.indexOf(id);
  const next = i < LINE_IDS.length - 1 ? lf(LINE_IDS[i + 1])[0] : Infinity;
  const hold = Math.max(b + 2, Math.min(b + 27, next - 5));
  const o = interpolate(frame, [a - 4, a + 4, hold, hold + 5], [0, 1, 1, 0], clamp);
  if (o <= 0) return null;
  const pages = linePages(id);
  const dur = b - a;
  const found = pages.findIndex((p) => frame < a + dur * p.to);
  // after the line ends (the held pause) keep the LAST page up, never jump back to the first
  const page = pages[found === -1 ? pages.length - 1 : found];
  const p0 = a + dur * page.from;
  const p1 = a + dur * page.to;
  const words = page.text.split(" ");
  const per = Math.max(1, Math.min(3, (p1 - p0) / (words.length * 2.4)));
  const sp = SPEAKER[LINE_TEXT[id].who];
  return (
    <div style={{ position: "absolute", left: "50%", bottom: BAR_HEIGHT + 26 - (1 - o) * 10, width: 1320, transform: "translateX(-50%)", opacity: o, zIndex: 600 }}>
      <div
        style={{
          position: "relative",
          background: SHADOW.plate,
          boxShadow: `inset 0 0 0 2px ${SHADOW.brassDark}, inset 0 0 0 7px ${SHADOW.plate}, inset 0 0 0 8px ${SHADOW.brass}, 0 10px 40px ${SHADOW.shade}`,
          padding: "30px 60px 22px",
          textAlign: "center",
          borderRadius: 4,
          minHeight: 64,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 40,
            top: -25,
            background: SHADOW.room,
            boxShadow: `inset 0 0 0 2px ${sp.accent}`,
            padding: "6px 18px 2px",
            fontFamily: BANGERS,
            fontSize: 32,
            letterSpacing: 3,
            color: sp.accent,
            lineHeight: 1.1,
          }}
        >
          {sp.name}
        </div>
        <div style={{ fontFamily: COMIC, fontWeight: 700, fontSize: 46, lineHeight: 1.2, color: SHADOW.text, textShadow: `0 2px 8px ${SHADOW.room}` }}>
          {words.map((w, i) => (
            <span key={i} style={{ opacity: interpolate(frame, [p0 + i * per, p0 + i * per + 5], [0.18, 1], clamp) }}>
              {w}
              {i < words.length - 1 ? " " : ""}
            </span>
          ))}
        </div>
        {[-1, 1].map((s) => (
          <div
            key={s}
            style={{
              position: "absolute",
              top: "50%",
              [s < 0 ? "left" : "right"]: -9,
              width: 16,
              height: 16,
              marginTop: -8,
              background: SHADOW.brass,
              transform: "rotate(45deg)",
              boxShadow: `0 0 10px ${SHADOW.lampGlow}`,
            }}
          />
        ))}
      </div>
    </div>
  );
};

/** Every line's cartouche, on the film's absolute clock. Only the line being spoken is ever visible. */
export const Speech: React.FC = () => (
  <>
    {LINE_IDS.map((id) => (
      <LineCartouche key={id} id={id} />
    ))}
  </>
);

/** Source tag per beat, exactly as in script.md (beats 1 and 10 have none in the script). */
export const BEAT_TAGS: Record<number, string | null> = {
  1: null,
  2: "Museum Wales; Ordnance Survey maps, recorded 1898 to 1908",
  3: "Cadw; Museum Wales",
  4: "Geoffrey of Monmouth, History of the Kings of Britain, Book IX ch. 12 (Giles translation); Cadw",
  5: "Geoffrey, Book IX ch. 13 (Evans translation); Wace, Roman de Brut, 1155",
  6: "Gerald of Wales, Itinerary through Wales, 1188 (Hoare translation); Hallam Tennyson, Memoir, 1897",
  7: "Cadw, Trailblazers: Tessa Verney Wheeler (booklet), pp. 22 to 25; Coflein",
  8: "RCAHMW Historic Place Names (Ordnance Survey 2nd edition)",
  9: "All exhibits above. Full source list on the end card",
  10: null,
};

export const SourceTags: React.FC = () => (
  <>
    {Object.entries(BEAT_TAGS).map(([b, text]) => {
      if (!text) return null;
      const [s, e] = beatSpan(Number(b));
      return (
        <Sequence key={b} from={s} durationInFrames={e - s} name={`tag-b${b}`} layout="none">
          <ShadowSourceTag text={text} span={[0, e - s - 4]} maxWidth={1100} />
        </Sequence>
      );
    })}
  </>
);

/** A soft lamp-dip between two places (instead of a hard cut): dark for ~8 frames around `at`. */
export const Dips: React.FC<{ at: number[] }> = ({ at }) => {
  const frame = useCurrentFrame();
  const o = Math.max(0, ...at.map((t) => interpolate(frame, [t - 8, t, t + 8], [0, 0.85, 0], clamp)));
  return o > 0 ? <AbsoluteFill style={{ background: SHADOW.room, opacity: o, zIndex: 700 }} /> : null;
};
