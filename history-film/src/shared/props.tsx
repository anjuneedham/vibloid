import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { ActorBox, charPt, INK, useSpring } from "./comic";
import { BANGERS, COMIC } from "./fonts";
import { clamp01, rand } from "./Frame";
import { PAL, THEME } from "./theme";

// Code-drawn props for The Evidence Room. Each is an SVG <g> in PANEL coordinates,
// meant to sit inside <Art> (which applies the hand-drawn ink boil).

const sk = { stroke: INK, strokeLinejoin: "round", strokeLinecap: "round" } as const;

// ------------------------------- MOUND -------------------------------------
/** Burial mound with a stone ring, a cutaway central chamber and a waving flag. x,y = bottom-left. */
export const MoundG: React.FC<{ x: number; y: number; w: number; start?: number }> = ({ x, y, w, start = 0 }) => {
  const frame = useCurrentFrame();
  const s = useSpring(start, { damping: 9, stiffness: 160, mass: 0.7 });
  const k = w / 600;
  const flag = Math.sin(frame / 6) * 10;
  const glint = 0.5 + 0.5 * Math.sin(frame / 7);
  return (
    <g transform={`translate(${x} ${y}) scale(${k * (0.85 + 0.15 * s)} ${k * (0.7 + 0.3 * s)}) translate(0 -340)`} style={{ transformBox: "fill-box" }}>
      <path d="M10 332 C 60 150, 180 60, 300 56 C 420 60, 540 150, 590 332 Z" fill={PAL.earth} {...sk} strokeWidth={10} />
      <path d="M70 300 C 130 200, 210 150, 300 146 C 390 150, 470 200, 530 300" fill="none" stroke={PAL.earthDark} strokeWidth={7} strokeLinecap="round" />
      <path d="M130 312 C 180 240, 240 205, 300 202 C 360 205, 420 240, 470 312" fill="none" stroke={PAL.earthDark} strokeWidth={7} strokeLinecap="round" />
      {/* central chamber */}
      <rect x={228} y={196} width={144} height={110} fill={THEME.night} {...sk} strokeWidth={9} />
      <path d="M228 232 H372 M228 268 H372 M264 196 V232 M336 232 V268 M264 268 V306" stroke={THEME.dusk} strokeWidth={5} fill="none" />
      <circle cx={282} cy={290} r={6} fill={PAL.seed} opacity={0.5 + 0.5 * glint} />
      <circle cx={318} cy={284} r={5} fill={PAL.seed} opacity={0.5 + 0.5 * (1 - glint)} />
      <circle cx={300} cy={296} r={5} fill={THEME.candle} opacity={0.6 + 0.4 * glint} />
      {/* stone ring */}
      {Array.from({ length: 13 }).map((_, i) => (
        <ellipse key={i} cx={34 + i * 44} cy={326 + (i % 2) * 4} rx={27} ry={16} fill={i % 2 ? PAL.stone : PAL.stoneDark} {...sk} strokeWidth={7} />
      ))}
      {/* flag */}
      <line x1={300} y1={58} x2={300} y2={-34} stroke={INK} strokeWidth={8} strokeLinecap="round" />
      <path d={`M302 -32 Q ${336} ${-46 + flag} ${372} -30 Q ${340} ${-18 - flag} 302 -6 Z`} fill={PAL.red} {...sk} strokeWidth={7} />
    </g>
  );
};

// ------------------------------- SEEDS -------------------------------------
/** A pile of seeds that spills from the top and lands in a heap. */
export const SeedsG: React.FC<{
  from: number;
  x0: number;
  x1: number;
  ground: number;
  peak?: number;
  count?: number;
}> = ({ from, x0, x1, ground, peak = 120, count = 64 }) => {
  const frame = useCurrentFrame();
  const cx = (x0 + x1) / 2;
  const half = (x1 - x0) / 2;
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => {
        const st = from + i * 0.7;
        if (frame < st) return null;
        const dur = 16 + rand(i + 3) * 10;
        const t = clamp01((frame - st) / dur);
        const lx = cx + (rand(i + 9) - 0.5) * 2 * half * (0.35 + 0.65 * rand(i + 20));
        const heap = peak * (1 - Math.abs(lx - cx) / half) * (0.4 + 0.6 * rand(i + 31));
        const ly = ground - 12 - heap;
        const sx = cx + (rand(i + 5) - 0.5) * 60;
        const y = -50 + (ly + 50) * t * t;
        const x = sx + (lx - sx) * t;
        const after = Math.max(0, frame - st - dur);
        const bounce = after < 14 ? -Math.abs(Math.sin(after * 0.5)) * 14 * (1 - after / 14) : 0;
        const rot = t * 540 * (rand(i + 1) - 0.5) + (rand(i + 4) * 360);
        const wig = Math.sin(frame / 12 + i) * 0.8;
        return (
          <g key={i} transform={`translate(${x} ${y + bounce + wig}) rotate(${rot})`}>
            <ellipse rx={10} ry={15} fill={i % 3 ? PAL.seed : PAL.seedDark} {...sk} strokeWidth={4} />
            <path d="M-3 -9 Q 2 0 -3 8" fill="none" stroke={PAL.cardPaper} strokeWidth={2.5} opacity={0.7} />
          </g>
        );
      })}
    </g>
  );
};

// ------------------------------- MAGNIFIER ---------------------------------
/** Magnifying glass over a single hair strand. Lens drifts slowly. */
export const LensG: React.FC<{ cx: number; cy: number; r: number }> = ({ cx, cy, r }) => {
  const frame = useCurrentFrame();
  const dx = Math.sin(frame / 30) * 14;
  const dy = Math.cos(frame / 37) * 8;
  const x = cx + dx;
  const y = cy + dy;
  const wave = (ox: number, amp: number, sp: number) =>
    `M${-r} ${ox} C ${-r * 0.5} ${ox - amp + Math.sin(frame / sp) * 8}, ${r * 0.1} ${ox + amp - Math.sin(frame / sp) * 8}, ${r} ${ox - amp * 0.4}`;
  return (
    <g>
      {/* the real strand on the bench */}
      <path d={`M${cx + 20} ${cy + r * 1.25} q 70 -36 140 -6 t 140 -4 t 140 10`} fill="none" stroke={PAL.hair} strokeWidth={5} strokeLinecap="round" />
      <g transform={`translate(${x} ${y})`}>
        <clipPath id="lensclip">
          <circle r={r - 6} />
        </clipPath>
        <circle r={r} fill={PAL.cardPaper} />
        <g clipPath="url(#lensclip)">
          <rect x={-r} y={-r} width={r * 2} height={r * 2} fill={PAL.labBottom} opacity={0.35} />
          <path d={wave(-6, 40, 13)} fill="none" stroke={PAL.hair} strokeWidth={26} strokeLinecap="round" />
          <path d={wave(-6, 40, 13)} fill="none" stroke={PAL.seedDark} strokeWidth={6} strokeLinecap="round" opacity={0.5} />
          {/* tiny residue flecks */}
          {Array.from({ length: 14 }).map((_, i) => {
            const a = rand(i + 2) * Math.PI * 2 + frame / (60 + i * 4);
            const rr = 30 + rand(i + 8) * (r - 60);
            return <circle key={i} cx={Math.cos(a) * rr} cy={Math.sin(a) * rr * 0.7} r={4 + rand(i) * 4} fill={PAL.seed} opacity={0.85} />;
          })}
        </g>
        <circle r={r} fill={PAL.glassTint} stroke={INK} strokeWidth={13} />
        <path d={`M${-r * 0.6} ${-r * 0.35} A ${r * 0.7} ${r * 0.7} 0 0 1 ${-r * 0.15} ${-r * 0.7}`} fill="none" stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.9} />
        <path d={`M${r * 0.72} ${r * 0.72} L ${r * 1.55} ${r * 1.55}`} stroke={INK} strokeWidth={36} strokeLinecap="round" />
        <path d={`M${r * 0.74} ${r * 0.74} L ${r * 1.52} ${r * 1.52}`} stroke={PAL.wood} strokeWidth={22} strokeLinecap="round" />
      </g>
    </g>
  );
};

// ------------------------------- SCROLL ------------------------------------
export const ScrollG: React.FC<{ x: number; y: number; w: number; h: number; label: string; fs?: number }> = ({
  x,
  y,
  w,
  h,
  label,
  fs = 54,
}) => {
  const frame = useCurrentFrame();
  const tilt = Math.sin(frame / 25) * 1.2;
  return (
    <g transform={`translate(${x} ${y}) rotate(${-4 + tilt} ${w / 2} ${h / 2})`}>
      <rect x={0} y={0} width={w} height={h} fill={PAL.parchment} {...sk} strokeWidth={9} />
      <path d={`M24 ${h * 0.72} H${w - 24} M24 ${h * 0.84} H${w - 60}`} stroke={PAL.parchmentDark} strokeWidth={7} strokeLinecap="round" />
      {[0, 1].map((e) => (
        <g key={e}>
          <rect x={-18} y={-14 + e * (h + 4)} width={w + 36} height={26} rx={13} fill={PAL.wood} {...sk} strokeWidth={8} />
        </g>
      ))}
      <text x={w / 2} y={h * 0.5} textAnchor="middle" fontFamily={BANGERS} fontSize={fs} letterSpacing={3} fill={PAL.red} stroke={INK} strokeWidth={0} style={{ paintOrder: "stroke" }}>
        {label}
      </text>
    </g>
  );
};

// ------------------------------- TENT + STEAM ------------------------------
/** Flat-shape tent with hot stones and rising steam. x,y = bottom-centre. */
export const TentG: React.FC<{ x: number; y: number; w: number; steamFrom: number }> = ({ x, y, w, steamFrom }) => {
  const frame = useCurrentFrame();
  const k = w / 400;
  const sway = Math.sin(frame / 14) * 1.5;
  return (
    <g transform={`translate(${x} ${y}) scale(${k})`}>
      {/* steam puffs */}
      {frame >= steamFrom
        ? Array.from({ length: 14 }).map((_, i) => {
            const age = (frame - steamFrom + i * 9) % 90;
            const t = age / 90;
            const px = 150 + (rand(i + 4) - 0.5) * 120 + Math.sin(t * 7 + i) * 26;
            const py = -60 - t * 340;
            const r = 22 + t * 46;
            return <circle key={i} cx={px} cy={py} r={r} fill={PAL.steam} stroke={INK} strokeWidth={5} opacity={(1 - t) * 0.95} />;
          })
        : null}
      <g transform={`rotate(${sway * 0.3} 0 0)`}>
        <path d="M-200 0 L-10 -300 L10 -300 L200 0 Z" fill={PAL.tent} {...sk} strokeWidth={10} />
        <path d="M-60 0 L0 -190 L60 0 Z" fill={THEME.night} {...sk} strokeWidth={8} />
        <path d="M-200 0 L-10 -300 M200 0 L10 -300" stroke={PAL.tentTrim} strokeWidth={9} fill="none" />
        <line x1={0} y1={-300} x2={0} y2={-352} stroke={INK} strokeWidth={9} strokeLinecap="round" />
        <path d={`M0 -352 L ${34 + sway * 4} -344 L 0 -332 Z`} fill={PAL.brass} {...sk} strokeWidth={5} />
      </g>
      {/* hot stones */}
      {[0, 1, 2].map((i) => (
        <ellipse key={i} cx={150 + i * 34 - 20} cy={-6 - (i === 1 ? 20 : 0)} rx={26} ry={18} fill={i === 1 ? PAL.redHot : PAL.stoneDark} {...sk} strokeWidth={7} />
      ))}
    </g>
  );
};

// ------------------------------- TIMELINE ----------------------------------
export const TimelineG: React.FC<{ x: number; y: number; w: number; marker: number }> = ({ x, y, w, marker }) => {
  const frame = useCurrentFrame();
  const m = useSpring(marker, { damping: 9, stiffness: 200, mass: 0.6 });
  const mx = w * 0.18;
  const bob = frame >= marker ? Math.sin(frame / 6) * 4 : 0;
  return (
    <g transform={`translate(${x} ${y})`}>
      <line x1={0} y1={0} x2={w} y2={0} stroke={INK} strokeWidth={10} strokeLinecap="round" />
      {Array.from({ length: 11 }).map((_, i) => (
        <line key={i} x1={(w * i) / 10} y1={-16} x2={(w * i) / 10} y2={16} stroke={INK} strokeWidth={i % 5 === 0 ? 10 : 6} strokeLinecap="round" />
      ))}
      <g transform={`translate(${mx} ${-70 * m + bob})`} opacity={clamp01(m * 3)}>
        <path d="M0 62 L-26 20 L26 20 Z" fill={PAL.red} {...sk} strokeWidth={7} />
        <circle cx={0} cy={0} r={30} fill={THEME.card} {...sk} strokeWidth={8} />
        <circle cx={0} cy={0} r={11} fill={PAL.red} />
      </g>
    </g>
  );
};

// ------------------------------- GAVEL RIG ---------------------------------
/** 0 = cocked, 1 = slammed. Slam lands exactly on `hit`. */
export const gavelProgress = (frame: number, hit: number) => {
  if (frame < hit - 9) return 0.04 * Math.sin(frame / 5);
  if (frame < hit) return interpolate(frame, [hit - 9, hit], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return interpolate(frame, [hit + 8, hit + 34], [1, 0.1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
};
/** The curator's right-arm angle that goes with a given slam progress. */
export const gavelArm = (p: number) => -125 + 65 * p;

/** Gavel in the curator's hand, sound block on a little pedestal beside him. */
export const GavelRig: React.FC<{ box: ActorBox; p: number; feet: number }> = ({ box, p, feet }) => {
  const s = box.width / 400;
  const a = (gavelArm(p) * Math.PI) / 180;
  const hx = 272 + 24 * Math.cos(a) - 142 * Math.sin(a);
  const hy = 346 + 24 * Math.sin(a) + 142 * Math.cos(a);
  const [px, py] = charPt(box, hx, hy);
  const phi = (p * 78 * Math.PI) / 180; // handle angle from "up"
  const L = 118 * s * 1.5;
  const hdx = Math.sin(phi) * L;
  const hdy = -Math.cos(phi) * L;
  const blockX = charPt(box, 520, 0)[0];
  const blockTop = py + Math.cos(0) * 0 + 40 * s;
  const headX = px + hdx;
  const headY = py + hdy;
  const deg = (phi * 180) / Math.PI;
  return (
    <g>
      {/* pedestal + block */}
      <rect x={blockX - 44 * s * 1.5} y={blockTop + 20 * s} width={88 * s * 1.5} height={Math.max(20, feet - blockTop - 20 * s)} fill={PAL.wood} {...sk} strokeWidth={8} />
      <rect x={blockX - 62 * s * 1.5} y={blockTop - 12 * s} width={124 * s * 1.5} height={34 * s * 1.5} rx={8} fill={PAL.woodDark} {...sk} strokeWidth={8} />
      {/* gavel */}
      <g transform={`translate(${px} ${py}) rotate(${deg})`}>
        <line x1={0} y1={0} x2={0} y2={-L} stroke={INK} strokeWidth={26 * s * 1.6} strokeLinecap="round" />
        <line x1={0} y1={0} x2={0} y2={-L} stroke={PAL.wood} strokeWidth={14 * s * 1.6} strokeLinecap="round" />
        <rect x={-46 * s * 1.5} y={-L - 24 * s * 1.5} width={92 * s * 1.5} height={50 * s * 1.5} rx={10} fill={PAL.woodDark} {...sk} strokeWidth={8} />
        <rect x={-46 * s * 1.5} y={-L - 24 * s * 1.5} width={14 * s * 1.5} height={50 * s * 1.5} fill={PAL.brass} {...sk} strokeWidth={5} />
        <rect x={32 * s * 1.5} y={-L - 24 * s * 1.5} width={14 * s * 1.5} height={50 * s * 1.5} fill={PAL.brass} {...sk} strokeWidth={5} />
      </g>
      <circle cx={headX} cy={headY} r={0.1} fill="none" />
    </g>
  );
};

// ------------------------------- PIN CARD ----------------------------------
/** Paper card pinned to the board (HTML, positioned in panel coords). */
export const PinCard: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  start: number;
  rot: number;
  title: string;
  sub?: string;
  children?: React.ReactNode;
}> = ({ x, y, w, h, start, rot, title, sub, children }) => {
  const frame = useCurrentFrame();
  const s = useSpring(start, { damping: 10, stiffness: 200, mass: 0.7 });
  if (frame < start) return null;
  const sway = Math.sin(frame / 22 + x) * 0.7;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        background: PAL.cardPaper,
        border: `8px solid ${INK}`,
        boxSizing: "border-box",
        boxShadow: `8px 10px 0 ${PAL.shadow}`,
        transform: `translateY(${(1 - s) * -160}px) rotate(${rot + sway}deg) scale(${0.8 + 0.2 * s})`,
        transformOrigin: "50% 0",
        textAlign: "center",
        zIndex: 20,
      }}
    >
      <div style={{ position: "absolute", left: w / 2 - 17, top: -20, width: 34, height: 34, borderRadius: "50%", background: PAL.red, border: `6px solid ${INK}` }} />
      <div style={{ paddingTop: 30, fontFamily: BANGERS, fontSize: 56, letterSpacing: 2, lineHeight: 1, color: INK }}>{title}</div>
      {sub ? <div style={{ fontFamily: COMIC, fontWeight: 700, fontSize: 30, color: INK, marginTop: 8 }}>{sub}</div> : null}
      {children}
    </div>
  );
};
