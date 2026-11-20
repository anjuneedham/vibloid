import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { rand } from "../Frame";
import { COMIC } from "../fonts";
import { SHADOW } from "../theme";
import { Cutout } from "./stage";

// Scenery for the shadow theatre, each piece a black card cut-out (see Cutout). Put each inside a <Layer depth>.
// Coordinates are for a 1920 x 1080 stage; pieces overhang the edges so the camera can drift.

// ---------------------------------------------------------------- THE EVIDENCE ROOM

/** Far wall: archive shelving with boxes, holes between the shelves let the screen glow through. */
export const RoomShelves: React.FC<{ id?: string }> = ({ id = "shelves" }) => {
  const units = [-160, 140, 1500, 1800];
  return (
    <Cutout id={id} color={SHADOW.cutMid} rim={0.4} shade={0}>
      {units.map((ux, u) => (
        <g key={u}>
          <rect x={ux} y={60} width={300} height={900} fill="white" />
          {[0, 1, 2, 3, 4].map((s) => {
            const sy = 110 + s * 160;
            return (
              <g key={s}>
                <rect x={ux + 18} y={sy} width={264} height={128} fill="black" />
                {/* boxes and ledgers on the shelf */}
                {Array.from({ length: 6 }).map((_, b) => {
                  const bw = 26 + rand(u * 40 + s * 7 + b) * 30;
                  const bh = 60 + rand(u * 50 + s * 9 + b) * 60;
                  const bx = ux + 24 + b * 44;
                  return bx + bw < ux + 280 ? <rect key={b} x={bx} y={sy + 128 - bh} width={bw} height={bh} fill="white" /> : null;
                })}
              </g>
            );
          })}
        </g>
      ))}
    </Cutout>
  );
};

const CARDS: [number, number, number, number, number][] = [
  // x, y, w, h, rotation
  [560, 210, 190, 140, -5],
  [800, 180, 170, 210, 3],
  [1020, 230, 220, 150, -2],
  [1290, 190, 170, 200, 5],
  [660, 400, 200, 130, 4],
  [1150, 420, 210, 140, -4],
];

/** The pin-board: a dark frame, translucent paper cards lit from behind, brass pins and the red thread. */
export const PinBoard: React.FC<{ id?: string; lit?: number[]; labels?: string[] }> = ({ id = "board", lit = [], labels }) => {
  const frame = useCurrentFrame();
  const pins = CARDS.map(([x, y, w, , r]) => {
    const cx = x + w / 2;
    return [cx + Math.sin((r * Math.PI) / 180) * 0, y + 12] as const;
  });
  const thread = [0, 1, 2, 3, 5, 4, 0];
  return (
    <>
      <Cutout id={id} rim={0.7} shade={0.3}>
        <rect x={480} y={130} width={1060} height={480} fill="white" />
        {/* the board face is thin card: we show it as a big window with a cross-brace */}
        <rect x={510} y={160} width={1000} height={420} fill="black" />
        <rect x={510} y={362} width={1000} height={10} fill="white" />
        {CARDS.map(([x, y, w, h, r], i) => (
          <g key={i} transform={`rotate(${r} ${x + w / 2} ${y + h / 2})`}>
            {/* each card is a lighter paper: drawn as solid with a hole in it, so its lines read as handwriting */}
            <rect x={x} y={y} width={w} height={h} fill="white" />
            <rect x={x + 10} y={y + 10} width={w - 20} height={h - 20} fill="black" />
            {labels?.[i] ? null : Array.from({ length: Math.floor((h - 40) / 22) }).map((_, k) => (
              <rect key={k} x={x + 22} y={y + 30 + k * 22} width={(w - 44) * (0.5 + rand(i * 9 + k) * 0.5)} height={5} fill="white" />
            ))}
            {i === 2 ? (
              // a Roman arch sketched on one card
              <path d={`M${x + w - 80} ${y + h - 20} L${x + w - 80} ${y + h - 70} A 30 30 0 0 1 ${x + w - 20} ${y + h - 70} L${x + w - 20} ${y + h - 20} L${x + w - 32} ${y + h - 20} L${x + w - 32} ${y + h - 66} A 18 18 0 0 0 ${x + w - 68} ${y + h - 66} L${x + w - 68} ${y + h - 20} Z`} fill="white" />
            ) : null}
          </g>
        ))}
        {/* the board's lower frame becomes a shelf */}
        <rect x={460} y={600} width={1100} height={26} fill="white" />
      </Cutout>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <defs>
          <filter id={`${id}-glow`} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={4} />
          </filter>
        </defs>
        {/* gel tints on a few cards */}
        {CARDS.map(([x, y, w, h, r], i) =>
          i % 2 === 0 || lit.includes(i) ? (
            <rect
              key={i}
              x={x + 10}
              y={y + 10}
              width={w - 20}
              height={h - 20}
              fill={[SHADOW.gelAmber, SHADOW.gelTeal, SHADOW.gelRose][i % 3]}
              opacity={lit.includes(i) ? 0.15 + 0.1 * Math.sin(frame / 8) : 0.22}
              transform={`rotate(${r} ${x + w / 2} ${y + h / 2})`}
              style={{ mixBlendMode: "multiply" }}
            />
          ) : null,
        )}
        {/* red thread, glowing where the lamp catches it */}
        <path d={thread.map((t, i) => `${i ? "L" : "M"}${pins[t][0]} ${pins[t][1]}`).join(" ")} stroke={SHADOW.thread} strokeWidth={9} fill="none" opacity={0.5} filter={`url(#${id}-glow)`} />
        <path d={thread.map((t, i) => `${i ? "L" : "M"}${pins[t][0]} ${pins[t][1]}`).join(" ")} stroke={SHADOW.thread} strokeWidth={3.5} fill="none" />
        {/* real words on the cards (short labels), inked on the lit paper */}
        {labels
          ? CARDS.map(([x, y, w, h, r], i) =>
              labels[i] ? (
                <foreignObject key={`l${i}`} x={x + 12} y={y + 22} width={w - 24} height={h - 30} transform={`rotate(${r} ${x + w / 2} ${y + h / 2})`}>
                  <div style={{ fontFamily: COMIC, fontWeight: 700, fontSize: 25, lineHeight: 1.08, color: SHADOW.scribe, textAlign: "center" }}>{labels[i]}</div>
                </foreignObject>
              ) : null,
            )
          : null}
        {pins.map(([px, py], i) => (
          <g key={i}>
            <circle cx={px} cy={py} r={9} fill={SHADOW.brassDark} />
            <circle cx={px - 2} cy={py - 2} r={5} fill={SHADOW.brass} />
          </g>
        ))}
      </svg>
    </>
  );
};

/** The hanging lamp: a cut-out shade on a chain, swinging a little; its mouth glows. Returns the lamp's light point. */
export const lampSwing = (frame: number) => Math.sin(frame / 41) * 1.8;
export const HangingLamp: React.FC<{ x: number; y?: number; id?: string }> = ({ x, y = 210, id = "lamp" }) => {
  const frame = useCurrentFrame();
  const sw = lampSwing(frame);
  return (
    <div style={{ position: "absolute", inset: 0, transform: `rotate(${sw}deg)`, transformOrigin: `${x}px -40px` }}>
      <Cutout id={id} rim={0} shade={0.25} shadeOffset={[30, 10]}>
        <rect x={x - 3} y={-60} width={6} height={y - 70} fill="white" />
        <path d={`M${x - 110} ${y} Q ${x - 96} ${y - 96} ${x} ${y - 110} Q ${x + 96} ${y - 96} ${x + 110} ${y} Z`} fill="white" />
        <circle cx={x} cy={y - 120} r={16} fill="white" />
      </Cutout>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <ellipse cx={x} cy={y + 2} rx={98} ry={14} fill={SHADOW.lampCore} />
        <ellipse cx={x} cy={y - 2} rx={104} ry={9} fill={SHADOW.brass} opacity={0.8} />
      </svg>
    </div>
  );
};

/** Floor and the front edge of the evidence table, with a stack of case files. */
export const RoomFloor: React.FC<{ y?: number; id?: string }> = ({ y = 905, id = "floor" }) => (
  <Cutout id={id} rim={0.9} shade={0}>
    <path d={`M-300 ${y} L2220 ${y} L2220 1400 L-300 1400 Z`} fill="white" />
    {/* skirting perforations: a row of small cut holes, the theatre-maker's flourish */}
    {Array.from({ length: 60 }).map((_, i) => (
      <circle key={i} cx={-200 + i * 42} cy={y + 34} r={5} fill="black" />
    ))}
  </Cutout>
);

/** Out-of-focus foreground: a chair back on the left, a hanging tassel on the right. Use depth > 1 and blur. */
export const RoomForeground: React.FC<{ id?: string }> = ({ id = "fg" }) => {
  const frame = useCurrentFrame();
  const sw = Math.sin(frame / 30) * 10;
  return (
    <Cutout id={id} rim={0} shade={0}>
      <path d="M-120 1180 L-60 640 Q -40 600 10 610 L 60 620 Q 92 630 86 670 L 30 1180 Z" fill="white" />
      <rect x={-140} y={760} width={250} height={34} rx={14} fill="white" transform="rotate(-6 0 780)" />
      <g transform={`rotate(${sw} 1840 -20)`}>
        <rect x={1836} y={-20} width={8} height={300} fill="white" />
        <path d="M1800 280 L1880 280 L1866 420 L1814 420 Z" fill="white" />
      </g>
    </Cutout>
  );
};

// ---------------------------------------------------------------- CAERLEON: THE AMPHITHEATRE

/** Far hills of the Usk valley, soft. */
export const Hills: React.FC<{ id?: string }> = ({ id = "hills" }) => (
  <Cutout id={id} color={SHADOW.cutMid} rim={0} shade={0}>
    <path d="M-300 640 Q 0 520 300 590 T 900 560 T 1500 600 T 2220 540 L2220 1400 L-300 1400 Z" fill="white" />
  </Cutout>
);

/** The legionary fortress wall on the rise behind: wall, towers, a few barrack roofs. */
export const FortressWall: React.FC<{ id?: string }> = ({ id = "wall" }) => {
  const towers = [80, 420, 760, 1100, 1440, 1780];
  return (
    <Cutout id={id} color={SHADOW.cutMid} rim={0.35} shade={0}>
      <path d="M-300 700 L2220 690 L2220 1400 L-300 1400 Z" fill="white" />
      {Array.from({ length: 84 }).map((_, i) => (
        <rect key={i} x={-300 + i * 30} y={672} width={18} height={30} fill="white" />
      ))}
      {towers.map((tx) => (
        <g key={tx}>
          <rect x={tx} y={620} width={90} height={90} fill="white" />
          {[0, 1, 2].map((k) => (
            <rect key={k} x={tx + 4 + k * 32} y={602} width={20} height={22} fill="white" />
          ))}
          <rect x={tx + 34} y={640} width={20} height={34} rx={10} fill="black" />
        </g>
      ))}
    </Cutout>
  );
};

/**
 * The amphitheatre seen from its bank: an oval of earth and stone with the arena as a glowing hole,
 * entrance gaps cut through the bank. cx/cy = arena centre.
 */
export const Amphitheatre: React.FC<{ cx?: number; cy?: number; rx?: number; ry?: number; id?: string }> = ({
  cx = 960,
  cy = 820,
  rx = 520,
  ry = 150,
  id = "amphi",
}) => {
  const bank = 120;
  const gaps = [0.5, 1.5, 2.65, 3.6, 4.7, 5.6];
  return (
    <Cutout id={id} rim={0.95} shade={0.3} shadeOffset={[20, 10]}>
      {/* outer bank, rising to a crest */}
      <ellipse cx={cx} cy={cy} rx={rx + bank} ry={ry + bank * 0.5} fill="white" />
      <rect x={-300} y={cy} width={2520} height={600} fill="white" />
      {/* the arena floor: a hole, so the screen glows through */}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="black" />
      {/* stone arena wall: a row of perforated blocks just inside the rim */}
      {Array.from({ length: 52 }).map((_, i) => {
        const a = (i / 52) * Math.PI * 2;
        const x = cx + Math.cos(a) * (rx - 14);
        const y = cy + Math.sin(a) * (ry - 6);
        return Math.sin(a) < 0.15 ? <rect key={i} x={x - 9} y={y - 7} width={18} height={14} fill="white" transform={`rotate(${(a * 180) / Math.PI + 90} ${x} ${y})`} /> : null;
      })}
      {/* entrances cut through the far bank */}
      {gaps.map((a, i) => {
        const x = cx + Math.cos(a) * (rx + bank * 0.5);
        const y = cy + Math.sin(a) * (ry + bank * 0.25);
        return Math.sin(a) < 0 ? <path key={i} d={`M${x - 26} ${y + 40} L${x - 26} ${y - 6} A 26 26 0 0 1 ${x + 26} ${y - 6} L${x + 26} ${y + 40} Z`} fill="black" /> : null;
      })}
      {/* the near bank hides the front of the arena */}
      <path d={`M-300 ${cy + ry * 0.55} Q ${cx - rx * 0.6} ${cy + ry * 0.35} ${cx} ${cy + ry * 0.5} Q ${cx + rx * 0.7} ${cy + ry * 0.62} 2220 ${cy + ry * 0.4} L2220 1400 L-300 1400 Z`} fill="white" />
    </Cutout>
  );
};

/** A wind-bent hawthorn, built as a recursive branching cut-out (tapering limbs, thorny twigs). */
const thorn = (x: number, y: number, ang: number, len: number, seed: number, depth: number): React.ReactNode[] => {
  if (depth === 0 || len < 14) return [];
  const a = (ang * Math.PI) / 180;
  const x2 = x + Math.cos(a) * len;
  const y2 = y + Math.sin(a) * len;
  const w0 = Math.max(2, len * 0.11);
  const w1 = Math.max(1.2, w0 * 0.55);
  const nx = -Math.sin(a);
  const ny = Math.cos(a);
  const bend = (rand(seed + 1) - 0.5) * len * 0.3;
  const mx = (x + x2) / 2 + nx * bend;
  const my = (y + y2) / 2 + ny * bend;
  const d = `M${x + nx * w0} ${y + ny * w0} Q ${mx + nx * (w0 + w1) / 2} ${my + ny * (w0 + w1) / 2} ${x2 + nx * w1} ${y2 + ny * w1} L${x2 - nx * w1} ${y2 - ny * w1} Q ${mx - nx * (w0 + w1) / 2} ${my - ny * (w0 + w1) / 2} ${x - nx * w0} ${y - ny * w0} Z`;
  const out: React.ReactNode[] = [<path key={`${seed}-${depth}`} d={d} fill="white" />];
  // the wind leans everything toward the right
  const kids = depth > 3 ? 2 : 3;
  for (let k = 0; k < kids; k++) {
    const spreadA = (k - (kids - 1) / 2) * (28 + rand(seed + k * 7) * 14) + 10;
    out.push(...thorn(x2, y2, ang + spreadA, len * (0.62 + rand(seed + k * 3) * 0.16), seed * 3 + k + 1, depth - 1));
  }
  if (depth <= 2) {
    // thorns
    out.push(<path key={`t${seed}`} d={`M${mx} ${my} L${mx + nx * 12 + Math.cos(a) * 4} ${my + ny * 12 + Math.sin(a) * 4} L${mx + Math.cos(a) * 6} ${my + Math.sin(a) * 6} Z`} fill="white" />);
  }
  return out;
};

/** A wind-bent hawthorn and grass tussocks in the foreground. */
export const Hawthorn: React.FC<{ id?: string }> = ({ id = "thorn" }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const sway = Math.sin(frame / 34) * 1.2;
  return (
    <Cutout id={id} rim={0.6} shade={0}>
      <path d={`M-300 1000 Q 400 960 960 990 T ${width + 300} 975 L${width + 300} 1400 L-300 1400 Z`} fill="white" />
      {Array.from({ length: 90 }).map((_, i) => {
        const x = -200 + i * 26 + rand(i) * 12;
        const h = 30 + rand(i + 3) * 60;
        const s = Math.sin(frame / 16 + i * 0.7) * 6;
        return <path key={i} d={`M${x} 1000 Q ${x + s} ${1000 - h * 0.6} ${x + 8 + s * 1.7} ${1000 - h} L${x + 14} 1000 Z`} fill="white" />;
      })}
      <g transform={`rotate(${sway} 1640 1000)`}>{thorn(1640, 1000, -88, 300, 0, 5)}</g>
    </Cutout>
  );
};
