import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { BANGERS, COMIC, FELL } from "../../shared/fonts";
import {
  Amphitheatre,
  BeamDust,
  Bloom,
  Cutout,
  FortressWall,
  Gel,
  GlowParchment,
  Hawthorn,
  Hills,
  LampVignette,
  LanternSlide,
  Layer,
  PaperGrain,
  PaperLabel,
  RoomFloor,
  RoomShelves,
  Screen,
  Stage,
  useSealImpact,
  WarmFlash,
  WaxSeal,
} from "../../shared/shadow";
import { BAR_HEIGHT, SHADOW } from "../../shared/theme";
import EP from "./episode.json";
import { Actor, BEAT_TAGS, CastSpec, clamp, drift, Finish, FLOOR, Hang, HangPlacards, KeyLight, Rib, Ribbon, StagePlacards, useShot } from "./kit";
import { DiggerSil, PressCamSil, ScholarSil, TableSil, WalkerSil, WindowSil } from "./art";

// ------------------------------------------------------------------ PLACE: parallax silhouettes, no cast
export type PlaceKind = "moon" | "fortress" | "dig1926" | "ruins";

const ArenaGlow: React.FC<{ cx: number; cy: number }> = ({ cx, cy }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
    <defs>
      <radialGradient id={`arena-${cx}`} cx="50%" cy="45%" r="60%">
        <stop offset="0" stopColor={SHADOW.screenHot} />
        <stop offset="0.5" stopColor={SHADOW.screenWarm} />
        <stop offset="1" stopColor={SHADOW.screenAmber} />
      </radialGradient>
    </defs>
    <ellipse cx={cx} cy={cy + 10} rx={560} ry={190} fill={`url(#arena-${cx})`} opacity={0.92} />
  </svg>
);

export const PlaceShot: React.FC<{
  kind: PlaceKind;
  zoom?: [number, number];
  pan?: [number, number];
  children?: React.ReactNode;
  /** paper labels pinned to the scene (place, date, numbers) */
  overlay?: React.ReactNode;
  hang?: Hang;
  tag?: Rib | null;
}> = ({ kind, zoom = [1.0, 1.08], pan = [-80, 80], children, overlay, hang = { left: 60, top: 110, w: 640 }, tag = null }) => {
  const { frame, len, key: k } = useShot();
  const moon = kind === "moon";
  const hot: [number, number] = moon ? [1380, 300] : kind === "fortress" ? [1300, 420] : [760, 340];
  const cam = { x: drift(frame, len, pan[0], pan[1]), y: drift(frame, len, 10, -20), zoom: drift(frame, len, zoom[0], zoom[1]) };
  return (
    <AbsoluteFill>
      <Stage cam={cam}>
        <Layer depth={0.05}>
          <Screen hot={hot} spread={moon ? 1 : 0.95} moon={moon} seed={k.length} />
          {moon ? (
            <>
              <Gel color={SHADOW.gelTeal} x={-200} y={-100} w={2300} h={420} opacity={0.3} seed={8} />
              <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
                <circle cx={hot[0]} cy={hot[1]} r={70} fill={SHADOW.lampCore} />
              </svg>
              <Bloom x={hot[0]} y={hot[1]} r={340} opacity={0.5} seed={2} color={SHADOW.screenHot} />
            </>
          ) : (
            <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
              <circle cx={hot[0]} cy={hot[1]} r={90} fill={SHADOW.lampCore} opacity={0.9} />
            </svg>
          )}
          <Bloom x={900} y={830} r={620} opacity={moon ? 0.75 : 0.4} seed={7} color={SHADOW.screenWarm} />
        </Layer>
        <Layer depth={0.15}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.8 }}>
            <Hills id={`${k}-hl`} />
          </div>
        </Layer>
        {kind === "fortress" ? (
          <Layer depth={0.45}>
            <div style={{ position: "absolute", inset: 0, transform: "translateY(60px) scale(1.7)", transformOrigin: "50% 100%" }}>
              <FortressWall id={`${k}-fw`} />
            </div>
          </Layer>
        ) : (
          <Layer depth={0.32}>
            <FortressWall id={`${k}-fw`} />
          </Layer>
        )}
        {kind !== "fortress" ? (
          <Layer depth={0.62}>
            <ArenaGlow cx={900} cy={840} />
            <Amphitheatre id={`${k}-am`} cx={900} cy={840} />
          </Layer>
        ) : null}
        {children}
        <BeamDust lamp={hot} count={36} reach={700} seed={k.length} />
        <Layer depth={1.25}>
          <Hawthorn id={`${k}-th`} />
        </Layer>
      </Stage>
      <KeyLight x={hot[0]} y={hot[1] - 100} strength={0.7} />
      <PaperGrain opacity={0.42} />
      <LampVignette hot={hot} strength={0.9} />
      {overlay}
      <Ribbon r={tag} />
      <HangPlacards hang={hang} />
    </AbsoluteFill>
  );
};

/** 1926: diggers in the arena, a press camera with flashes going off (the "blaze of publicity"). */
export const DigCrew: React.FC = () => {
  const { frame, key: k } = useShot();
  return (
    <>
      <Layer depth={0.62}>
        <Cutout id={`${k}-dg`} rim={0.6} shade={0}>
          <DiggerSil x={700} y={860} s={0.42} t={frame} />
          <DiggerSil x={980} y={850} s={0.4} t={frame} phase={2} />
          <DiggerSil x={1160} y={862} s={0.4} t={frame} kind="barrow" />
        </Cutout>
      </Layer>
    </>
  );
};

export const PressFlash: React.FC<{ every?: number }> = ({ every = 38 }) => {
  const { frame, key: k } = useShot();
  const ph = frame % every;
  const flash = ph < 5 ? (1 - ph / 5) * 0.55 : 0;
  return (
    <>
      <Layer depth={1}>
        <Cutout id={`${k}-pc`} rim={0.9} shade={0.3}>
          <PressCamSil x={260} y={1000} s={1.25} />
        </Cutout>
        <Bloom x={260} y={600} r={300} opacity={flash * 1.6} seed={1} color={SHADOW.lampCore} />
      </Layer>
      {flash > 0 ? <AbsoluteFill style={{ background: SHADOW.lampCore, opacity: flash * 0.5, mixBlendMode: "screen" }} /> : null}
    </>
  );
};

// ------------------------------------------------------------------ SLIDES: the Clerk (or a speaker) and a lantern slide
export const SlideShot: React.FC<{
  cast?: CastSpec[];
  exhibit: string;
  label: string;
  art: (local: number) => React.ReactNode;
  gel?: string;
  full?: boolean;
  enter?: number;
  /** the beat's source tag, pinned under the slide */
  tag?: string | null;
}> = ({ cast = [], exhibit, label, art, gel = SHADOW.gelAmber, full = false, enter = -8, tag = null }) => {
  const { frame, len, key: k } = useShot();
  const lamp: [number, number] = full ? [960, 300] : [360, 250];
  const cam = full
    ? { x: drift(frame, len, -20, 20), y: drift(frame, len, 0, -8), zoom: drift(frame, len, 1.0, 1.06) }
    : { x: drift(frame, len, 0, 30), y: 0, zoom: drift(frame, len, 1.0, 1.04) };
  return (
    <AbsoluteFill>
      <Stage cam={cam}>
        <Layer depth={0.08}>
          <Screen hot={[lamp[0] + 120, lamp[1] + 140]} spread={0.75} seed={k.length} />
        </Layer>
        <Layer depth={0.2}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.7 }}>
            <RoomShelves id={`${k}-sh`} />
          </div>
          <Gel color={SHADOW.gelTeal} x={full ? 1500 : 700} y={0} w={1400} h={1080} opacity={0.3} seed={5} />
        </Layer>
        {cast.length ? (
          <Layer depth={1}>
            <RoomFloor y={FLOOR} id={`${k}-fl`} />
            {cast.map((c) => (
              <Actor key={c.who} lampX={lamp[0] - 200} k={k} {...c} />
            ))}
            <StagePlacards cast={cast.map((c) => ({ say: "above" as const, sayW: 560, ...c }))} />
          </Layer>
        ) : null}
        <Layer depth={0.85}>
          {full ? (
            <>
              <LanternSlide x={70} y={84} w={940} enter={enter} label={label} exhibit={exhibit} tilt={-0.8}>
                {art(frame)}
              </LanternSlide>
              {tag ? <SourceRibbonPinned text={tag} x={110} y={858} w={940} /> : null}
            </>
          ) : (
            <>
              <LanternSlide x={680} y={96} w={900} enter={enter} label={label} exhibit={exhibit}>
                {art(frame)}
              </LanternSlide>
              {tag ? <SourceRibbonPinned text={tag} x={720} y={842} w={960} /> : null}
            </>
          )}
        </Layer>
        <Bloom x={lamp[0]} y={lamp[1] + 30} r={480} opacity={0.35} seed={3} />
        <BeamDust lamp={lamp} count={40} reach={900} seed={3} />
      </Stage>
      <KeyLight x={lamp[0]} strength={0.8} />
      <Finish hot={lamp} gel={gel} gelOpacity={0.2} />
      <HangPlacards hang={full ? { left: 1120, top: 120, w: 720 } : { left: 60, top: 110, w: 560 }} onStage={cast.map((c) => ({ say: "above" as const, ...c }))} />
    </AbsoluteFill>
  );
};

const SourceRibbonPinned: React.FC<{ text: string; x: number; y: number; w: number }> = ({ text, x, y, w }) => <Ribbon r={{ text, x, y, w, rot: -1 }} />;

// ------------------------------------------------------------------ SHADOW PLAY: only the screen and moving shadows
export const PlayShot: React.FC<{
  moon?: boolean;
  hot?: [number, number];
  zoom?: [number, number];
  pan?: [number, number];
  far?: React.ReactNode;
  children: (frame: number) => React.ReactNode;
  /** the place/date label, pinned into the scene */
  label?: { big: string; small?: string; x: number; y: number; pin?: [number, number]; w?: number };
  tag?: Rib | null;
  hang?: Hang;
  gel?: string;
}> = ({ moon = false, hot = [700, 380], zoom = [1.0, 1.06], pan = [-40, 40], far, children, label, tag = null, hang = { left: 60, top: 110, w: 600 }, gel }) => {
  const { frame, len, key: k } = useShot();
  const cam = { x: drift(frame, len, pan[0], pan[1]), y: 0, zoom: drift(frame, len, zoom[0], zoom[1]) };
  return (
    <AbsoluteFill>
      <Stage cam={cam}>
        <Layer depth={0.06}>
          <Screen hot={hot} spread={0.85} moon={moon} seed={k.length} />
        </Layer>
        {far ? <Layer depth={0.3}>{far}</Layer> : null}
        <Layer depth={1}>
          <Cutout id={`${k}-play`} rim={0.85} shade={0.35} shadeOffset={[22, 8]}>
            {children(frame)}
          </Cutout>
        </Layer>
        <Bloom x={hot[0]} y={hot[1]} r={520} opacity={0.4} seed={k.length} />
        <BeamDust lamp={hot} count={40} reach={800} seed={k.length} />
      </Stage>
      <KeyLight x={hot[0]} y={hot[1] - 100} strength={0.8} />
      <Finish hot={hot} gel={gel ?? (moon ? SHADOW.gelTeal : SHADOW.gelAmber)} gelOpacity={0.22} />
      {label ? <PaperLabel big={label.big} small={label.small} x={label.x} y={label.y} pin={label.pin} w={label.w} enter={6} exit={len - 4} /> : null}
      <Ribbon r={tag} />
      <HangPlacards hang={hang} />
    </AbsoluteFill>
  );
};

/** Geoffrey (a cartoon silhouette) writing by candle. */
export const GeoffreyPlay: React.FC = () => (
  <PlayShot
    hot={[1180, 330]}
    hang={{ left: 60, top: 110, w: 560 }}
    label={{ big: "ABOUT 1136", small: "Geoffrey of Monmouth writes his History (cartoon silhouette)", x: 1270, y: 330, w: 580, pin: [1180, 640] }}
    tag={{ text: BEAT_TAGS[4]!, x: 1270, y: 560, w: 600 }}
  >
    {(f) => (
      <>
        <rect x={-300} y={905} width={2520} height={400} fill="white" />
        <ScholarSil x={760} y={905} s={1.3} t={f} />
        {/* a stack of books */}
        <rect x={1260} y={845} width={220} height={60} fill="white" />
        <rect x={1280} y={800} width={180} height={45} fill="white" />
      </>
    )}
  </PlayShot>
);

/** Gerald (a cartoon silhouette) walks past the Roman ruins. */
export const GeraldPlay: React.FC = () => {
  const { len, key: k } = useShot();
  return (
    <PlayShot
      hot={[1300, 360]}
      pan={[-60, 60]}
      label={{ big: "CAERLEON, 1188", small: "Gerald of Wales visits the ruins (cartoon silhouette)", x: 1160, y: 200, w: 660, pin: [1250, 560] }}
      tag={{ text: BEAT_TAGS[6]!, x: 1160, y: 390, w: 700 }}
      far={
        <div style={{ position: "absolute", inset: 0, opacity: 0.85 }}>
          <Cutout id={`${k}-ru`} color={SHADOW.cutMid} rim={0.3} shade={0}>
            {/* broken walls and arches */}
            <path d="M-200 905 L-200 640 L 120 620 L 160 700 L 260 690 L 300 905 Z" fill="white" />
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <rect x={1150 + i * 170} y={560 + (i % 2) * 40} width={130} height={345} fill="white" />
                <path d={`M${1175 + i * 170} 905 L${1175 + i * 170} ${720 + (i % 2) * 40} A 40 40 0 0 1 ${1255 + i * 170} ${720 + (i % 2) * 40} L${1255 + i * 170} 905 Z`} fill="black" />
              </g>
            ))}
            <rect x={500} y={740} width={300} height={165} fill="white" />
            <rect x={540} y={700} width={90} height={40} fill="white" />
          </Cutout>
        </div>
      }
    >
      {(f) => (
        <>
          <rect x={-300} y={905} width={2520} height={400} fill="white" />
          <WalkerSil x={interpolate(f, [0, len], [380, 900], clamp)} y={905} s={1.15} t={f} />
        </>
      )}
    </PlayShot>
  );
};

/** The poet (a cartoon silhouette in a wide hat) writes a letter at an inn window; the Usk outside. */
export const PoetPlay: React.FC = () => (
  <PlayShot
    moon
    hot={[1200, 360]}
    hang={{ left: 60, top: 96, w: 560 }}
    label={{ big: "CAERLEON, 1856", small: "Tennyson writes a letter (cartoon silhouette)", x: 1470, y: 190, w: 410, pin: [1440, 430] }}
    tag={{ text: BEAT_TAGS[6]!, x: 1460, y: 760, w: 440 }}
  >
    {(f) => (
      <>
        <WindowSil x={1000} y={170} w={440} h={600} />
        {/* the river through the window: wavy bands cut into the sill area */}
        {[0, 1, 2].map((i) => (
          <path key={i} d={`M1000 ${640 + i * 34} Q 1110 ${630 + i * 34 + Math.sin(f / 9 + i) * 8} 1220 ${640 + i * 34} T 1440 ${640 + i * 34} L1440 ${650 + i * 34} Q 1330 ${660 + i * 34} 1220 ${650 + i * 34} T 1000 ${650 + i * 34} Z`} fill="white" />
        ))}
        <rect x={-300} y={905} width={2520} height={400} fill="white" />
        <ScholarSil x={1110} y={905} s={1.0} t={f} hat="brim" />
      </>
    )}
  </PlayShot>
);

/** Tessa Wheeler (a cartoon silhouette with a trowel) directs the dig. */
export const TessaPlay: React.FC = () => (
  <PlayShot
    hot={[760, 360]}
    pan={[-30, 50]}
    label={{ big: "CAERLEON, 1926", small: "Tessa Verney Wheeler directs the dig (cartoon silhouette)", x: 1080, y: 170, w: 660, pin: [1180, 560] }}
    tag={{ text: "Cadw booklet p. 19, quoting historian Lydia Carr", x: 1080, y: 380, w: 660 }}
  >
    {(f) => (
      <>
        <path d="M-300 905 Q 400 860 960 900 T 2220 880 L2220 1400 L-300 1400 Z" fill="white" />
        <DiggerSil x={720} y={905} s={1.15} t={f} kind="trowel" hat="cloche" />
        <DiggerSil x={1180} y={895} s={0.8} t={f} phase={1.5} />
        <DiggerSil x={1500} y={890} s={0.75} t={f} kind="barrow" />
      </>
    )}
  </PlayShot>
);

/** Doubt's joke: a small table whose shadow on the screen swells to the size of the arena. */
export const TableGag: React.FC<{ grow: [number, number] }> = ({ grow }) => {
  const { frame, key: k } = useShot();
  const g = interpolate(frame, [grow[0], grow[1]], [0, 1], { ...clamp, easing: (x) => x * x * (3 - 2 * x) });
  const hot: [number, number] = [900, 300];
  const cam = { x: 0, y: 0, zoom: 1 + g * 0.04 };
  return (
    <AbsoluteFill>
      <Stage cam={cam}>
        <Layer depth={0.06}>
          <Screen hot={hot} spread={0.8} seed={k.length} />
        </Layer>
        <Layer depth={0.3}>
          {/* the table's shadow on the screen: grows into an amphitheatre-sized oval */}
          <div style={{ position: "absolute", inset: 0, filter: `blur(${4 + g * 10}px)`, opacity: 0.55 }}>
            <svg width={1920} height={1080}>
              <g transform={`translate(1100 905) scale(${1 + g * 4.2} ${1 + g * 2.2}) translate(-1100 -905)`}>
                <ellipse cx={1100} cy={785} rx={130} ry={22} fill={SHADOW.cut} />
                <rect x={1090} y={785} width={20} height={110} fill={SHADOW.cut} />
              </g>
            </svg>
          </div>
        </Layer>
        <Layer depth={1}>
          <RoomFloor y={FLOOR} id={`${k}-fl`} />
          <Cutout id={`${k}-tb`} rim={0.9} shade={0}>
            <TableSil x={1100} y={FLOOR} s={1} />
          </Cutout>
          <Actor who="doubt" x={560} width={300} lampX={hot[0]} k={k} armR={-30} />
          <StagePlacards cast={[{ who: "doubt", x: 560, width: 300, say: "above", sayW: 560 }]} />
        </Layer>
        <BeamDust lamp={hot} count={36} reach={800} seed={6} />
      </Stage>
      <KeyLight x={hot[0]} strength={0.9} />
      <Finish hot={hot} gel={SHADOW.gelTeal} gelOpacity={0.2} />
      <Ribbon r={{ text: BEAT_TAGS[5]!, x: 1180, y: 880, w: 700 }} />
      {g > 0.6 ? (
        <div style={{ position: "absolute", left: 1180, top: 210, opacity: interpolate(g, [0.6, 1], [0, 0.9]), fontFamily: COMIC, fontWeight: 700, fontSize: 30, color: SHADOW.text, textShadow: `0 2px 10px ${SHADOW.room}` }}>
          (imagine)
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ THE EVIDENCE BOARD (beat 8)
export type BoardCard = { at: number; stampAt: number; head: string; body: string; stamp: string; tone: string; x: number; y: number; r: number };

export const BoardShot: React.FC<{ cards: BoardCard[] }> = ({ cards }) => {
  const { frame, len, key: k } = useShot();
  const { fps } = useVideoConfig();
  const lamp: [number, number] = [860, 120];
  const cam = { x: drift(frame, len, -30, 30), y: drift(frame, len, 10, -10), zoom: drift(frame, len, 1.0, 1.05) };
  const pins = cards.map((c) => [c.x + 220, c.y + 18] as const);
  return (
    <AbsoluteFill>
      <Stage cam={cam}>
        <Layer depth={0.08}>
          <Screen hot={[lamp[0], lamp[1] + 260]} spread={0.8} seed={8} />
        </Layer>
        <Layer depth={0.5}>
          {/* the board's own shadow, then the board frame */}
          <div style={{ position: "absolute", left: 150 + 50, top: 110 + 30, width: 1620, height: 760, background: SHADOW.cut, opacity: 0.5, filter: "blur(26px)" }} />
          <Cutout id={`${k}-fr`} rim={0.8} shade={0}>
            <rect x={150} y={100} width={1620} height={770} fill="white" />
            <rect x={180} y={130} width={1560} height={710} fill="black" />
          </Cutout>
        </Layer>
        <Layer depth={0.55}>
          {cards.map((c, i) => {
            const t = frame - c.at;
            if (t < 0) return null;
            const s = spring({ frame: t, fps, config: { damping: 13, stiffness: 170 } });
            const st = frame - c.stampAt;
            const ss = st < 0 ? 0 : interpolate(st, [0, 3, 8], [2, 0.92, 1], clamp);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: c.x,
                  top: c.y,
                  width: 440,
                  minHeight: 280,
                  background: SHADOW.parchment,
                  boxShadow: `14px 16px 24px ${SHADOW.shade}, inset 0 0 40px ${SHADOW.vellumDark}`,
                  transform: `rotate(${c.r}deg) scale(${0.6 + 0.4 * s}) translateY(${(1 - s) * -40}px)`,
                  opacity: Math.min(1, s * 2),
                  padding: "40px 28px 26px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontFamily: BANGERS, fontSize: 40, letterSpacing: 2, color: SHADOW.scribe, lineHeight: 1.05 }}>{c.head}</div>
                <div style={{ fontFamily: FELL, fontSize: 31, lineHeight: 1.18, color: SHADOW.scribe, marginTop: 10 }}>{c.body}</div>
                {st >= 0 ? (
                  <div
                    style={{
                      marginTop: 16,
                      display: "inline-block",
                      border: `6px solid ${c.tone}`,
                      padding: "6px 18px 0",
                      fontFamily: BANGERS,
                      fontSize: 46,
                      letterSpacing: 3,
                      color: c.tone,
                      transform: `rotate(-6deg) scale(${ss})`,
                    }}
                  >
                    {c.stamp}
                  </div>
                ) : null}
              </div>
            );
          })}
          <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
            {pins.map(([px, py], i) => {
              if (frame < cards[i].at) return null;
              const prev = i > 0 ? pins[i - 1] : null;
              const d = interpolate(frame, [cards[i].at + 4, cards[i].at + 18], [0, 1], clamp);
              return (
                <g key={i}>
                  {prev ? <line x1={prev[0]} y1={prev[1]} x2={prev[0] + (px - prev[0]) * d} y2={prev[1] + (py - prev[1]) * d} stroke={SHADOW.thread} strokeWidth={5} /> : null}
                  <circle cx={px} cy={py} r={11} fill={SHADOW.brassDark} />
                  <circle cx={px - 2} cy={py - 2} r={6} fill={SHADOW.brass} />
                </g>
              );
            })}
          </svg>
        </Layer>
        <Bloom x={lamp[0]} y={lamp[1] + 100} r={700} opacity={0.35} seed={8} />
        <BeamDust lamp={lamp} count={40} reach={1000} seed={8} />
      </Stage>
      <KeyLight x={lamp[0]} y={160} strength={0.9} />
      <Finish hot={lamp} gelOpacity={0.18} />
      <div style={{ position: "absolute", right: 70, top: BAR_HEIGHT + 24, fontFamily: BANGERS, fontSize: 52, letterSpacing: 5, color: SHADOW.text, textShadow: `0 3px 14px ${SHADOW.room}`, zIndex: 600 }}>
        THE EVIDENCE BOARD
      </div>
      <Ribbon r={{ text: BEAT_TAGS[8]!, x: 160, y: 62, w: 1060, rot: -0.6 }} />
      <HangPlacards hang={{ left: 705, top: 330, w: 510 }} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ THE VERDICT: the seal
export const SealShot: React.FC<{ hit: number; speaker?: CastSpec }> = ({ hit, speaker }) => {
  const { frame, len, key: k } = useShot();
  const { nudge, flash } = useSealImpact(hit);
  const hot: [number, number] = [1150, 470];
  const cam = { x: drift(frame, len, 0, 20), y: nudge, zoom: drift(frame, len, 1.0, 1.07) };
  const word = interpolate(frame, [hit + 6, hit + 18], [0, 1], clamp);
  const rose = interpolate(frame, [hit, hit + 20], [0, 0.32], clamp);
  const after = frame >= hit;
  return (
    <AbsoluteFill>
      <Stage cam={cam}>
        <Layer depth={0.08}>
          <Screen hot={hot} spread={0.9} seed={4} />
        </Layer>
        <Layer depth={0.5}>
          <GlowParchment x={650} y={110} w={1080} h={700} rot={-1.2} writing={false}>
            <text x={540} y={92} textAnchor="middle" fontFamily={BANGERS} fontSize={64} letterSpacing={10} fill={SHADOW.scribe} opacity={0.85}>
              THE VERDICT
            </text>
            <line x1={330} x2={750} y1={116} y2={116} stroke={SHADOW.rubric} strokeWidth={3} opacity={0.7} />
            <foreignObject x={110} y={128} width={860} height={90}>
              <div style={{ fontFamily: FELL, fontStyle: "italic", fontSize: 30, lineHeight: 1.2, color: SHADOW.scribe, textAlign: "center" }}>The claim: {EP.claim}</div>
            </foreignObject>
            <WaxSeal cx={540} cy={390} r={140} hit={hit} />
            <text x={540} y={650} textAnchor="middle" fontFamily={BANGERS} fontSize={118} letterSpacing={12} fill={SHADOW.wax} opacity={word} transform={`translate(0 ${(1 - word) * 10})`}>
              {EP.verdict}
            </text>
          </GlowParchment>
        </Layer>
        {speaker ? (
          <Layer depth={1}>
            <RoomFloor y={FLOOR} id={`${k}-fl`} />
            <Actor lampX={hot[0]} k={k} {...speaker} armR={after ? -110 : -40} browLift={after ? 0.6 : 0.2} mouth={after ? "smile" : undefined} />
            <StagePlacards cast={[{ say: "above", sayW: 560, ...speaker }]} />
          </Layer>
        ) : null}
        <BeamDust lamp={hot} count={40} reach={800} seed={4} />
      </Stage>
      <Gel color={SHADOW.gelRose} x={-100} y={-100} w={2120} h={1280} opacity={rose} seed={9} />
      <KeyLight x={hot[0]} y={hot[1] - 200} strength={0.7} />
      <Finish hot={hot} gelOpacity={0.16} />
      <WarmFlash amount={flash} />
      <Ribbon r={{ text: BEAT_TAGS[9]!, x: 700, y: 858, w: 1000 }} />
      <HangPlacards hang={{ left: 50, top: 110, w: 560 }} onStage={speaker ? [{ say: "above", ...speaker }] : []} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ END CARD: sources + the next case (both from episode.json)
export const EndCard: React.FC = () => {
  const { frame } = useShot();
  const o = (i: number) => interpolate(frame, [8 + i * 4, 20 + i * 4], [0, 1], clamp);
  return (
    <AbsoluteFill style={{ background: SHADOW.room }}>
      <Screen hot={[960, 420]} spread={0.9} seed={11} />
      <AbsoluteFill style={{ background: SHADOW.room, opacity: 0.35 }} />
      <div style={{ position: "absolute", left: 200, right: 200, top: 100, bottom: 100, background: SHADOW.parchment, boxShadow: `0 20px 60px ${SHADOW.shade}, inset 0 0 80px ${SHADOW.vellumDark}`, padding: "36px 64px" }}>
        <div style={{ fontFamily: BANGERS, fontSize: 60, letterSpacing: 6, color: SHADOW.rubric, textAlign: "center" }}>SOURCES</div>
        <div style={{ marginTop: 6 }}>
          {EP.sources.map((s, i) => (
            <div key={i} style={{ fontFamily: COMIC, fontWeight: 700, fontSize: 29, lineHeight: 1.22, color: SHADOW.scribe, opacity: o(i), marginTop: 14 }}>
              · {s}
            </div>
          ))}
        </div>
        <div style={{ position: "absolute", left: 64, right: 64, bottom: 30, textAlign: "center", opacity: o(EP.sources.length + 2) }}>
          <div style={{ fontFamily: COMIC, fontWeight: 700, fontSize: 24, color: SHADOW.scribe, opacity: 0.75 }}>A dramatised cartoon. Full links in the description.</div>
          <div style={{ fontFamily: BANGERS, fontSize: 44, letterSpacing: 3, color: SHADOW.rubric, marginTop: 8 }}>{EP.teaser.replace(" / ", " ")}</div>
        </div>
      </div>
      <PaperGrain opacity={0.35} />
      <LampVignette hot={[960, 420]} strength={0.7} />
    </AbsoluteFill>
  );
};

/** Title plate for the case (beat 1), hung in the lamp light. */
export const TitlePlate: React.FC<{ at: number }> = ({ at }) => {
  const { frame } = useShot();
  const { fps } = useVideoConfig();
  const t = frame - at;
  if (t < 0) return null;
  const s = spring({ frame: t, fps, config: { damping: 14 } });
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 790, textAlign: "center", zIndex: 500, opacity: Math.min(1, s * 1.5), transform: `translateY(${(1 - s) * 30}px)` }}>
      <div style={{ display: "inline-block", background: SHADOW.plate, boxShadow: `inset 0 0 0 3px ${SHADOW.brass}`, padding: "18px 50px 10px" }}>
        <div style={{ fontFamily: BANGERS, fontSize: 34, letterSpacing: 8, color: SHADOW.brass }}>THE EVIDENCE ROOM · CASE 2 · CAERLEON, SOUTH WALES</div>
        <div style={{ fontFamily: BANGERS, fontSize: 92, letterSpacing: 4, color: SHADOW.text, lineHeight: 1.05 }}>{EP.caseTitle}</div>
      </div>
    </div>
  );
};

/** Small caption plate (fact + source) used on place shots: max ~10 words. */
export const FactPlate: React.FC<{ at: number; to?: number; big: string; small: string; x?: number; y?: number }> = ({ at, to = 1e9, big, small, x = 1140, y = 210 }) => {
  const { frame } = useShot();
  const o = interpolate(frame, [at, at + 10, to - 8, to], [0, 1, 1, 0], clamp);
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", left: x, top: y, opacity: o, zIndex: 500, background: SHADOW.plate, boxShadow: `inset 3px 0 0 ${SHADOW.brass}`, padding: "14px 26px 12px", maxWidth: 680 }}>
      <div style={{ fontFamily: BANGERS, fontSize: 56, letterSpacing: 3, color: SHADOW.text, lineHeight: 1.05 }}>{big}</div>
      <div style={{ fontFamily: COMIC, fontWeight: 700, fontSize: 26, color: SHADOW.textDim, marginTop: 4 }}>{small}</div>
    </div>
  );
};
