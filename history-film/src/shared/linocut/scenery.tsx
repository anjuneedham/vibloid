import React from "react";
import { useCurrentFrame } from "remotion";
import { rand } from "../Frame";
import { ScriptLines } from "../shadow/slide";
import { BANGERS } from "../fonts";
import { LINO } from "../theme";

// Carved scenery for the linocut look. All are SVG <g> pieces: put them inside an <svg> with filter="url(#lino-ink)".

/** Radiating carved wedges (the classic linocut sunburst). Turns a notch every 6 frames. */
export const Rays: React.FC<{ cx: number; cy: number; r0: number; r1: number; n?: number; color?: string }> = ({ cx, cy, r0, r1, n = 28, color = LINO.ink }) => {
  const frame = useCurrentFrame();
  const rot = Math.floor(frame / 6) * 0.8;
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rot})`}>
      {Array.from({ length: n }).map((_, i) => {
        const a0 = (i / n) * Math.PI * 2;
        const a1 = a0 + (Math.PI * 2) / n / 2.2;
        const rr = r1 * (0.85 + rand(i + 4) * 0.3);
        return (
          <path
            key={i}
            d={`M${Math.cos(a0) * r0} ${Math.sin(a0) * r0} L${Math.cos(a0) * rr} ${Math.sin(a0) * rr} L${Math.cos(a1) * rr} ${Math.sin(a1) * rr} L${Math.cos(a1) * r0} ${Math.sin(a1) * r0} Z`}
            fill={color}
          />
        );
      })}
    </g>
  );
};

/** The red sun / moon disc with carved rings. */
export const LinoSun: React.FC<{ cx: number; cy: number; r: number }> = ({ cx, cy, r }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill={LINO.red} />
    {[0.78, 0.6, 0.42].map((k, i) => (
      <circle key={i} cx={cx - r * 0.06} cy={cy - r * 0.06} r={r * k} fill="none" stroke={LINO.paper} strokeWidth={5} strokeDasharray={`${40 + i * 20} ${14 + i * 6}`} />
    ))}
  </g>
);

/** The amphitheatre, carved: ink bank with white contour gouges, a paper arena, entrance gaps. */
export const LinoAmphi: React.FC<{ cx: number; cy: number; rx: number; ry: number }> = ({ cx, cy, rx, ry }) => {
  const bank = rx * 0.24;
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx + bank} ry={ry + bank * 0.5} fill={LINO.ink} />
      {[0.25, 0.5, 0.75].map((k, i) => (
        <ellipse key={i} cx={cx} cy={cy - 2} rx={rx + bank * k} ry={ry + bank * 0.5 * k} fill="none" stroke={LINO.paper} strokeWidth={3.5} strokeDasharray={`${70 + i * 30} ${22}`} />
      ))}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={LINO.paper} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="url(#lino-dots-light)" opacity={0.45} />
      {/* the two main entrances at the ends of the long axis, cut through the bank */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <rect x={s < 0 ? cx - rx - bank - 8 : cx + rx - 4} y={cy - ry * 0.16} width={bank + 12} height={ry * 0.32} fill={LINO.paper} />
          <line x1={s < 0 ? cx - rx - bank - 8 : cx + rx - 4} x2={s < 0 ? cx - rx + 4 : cx + rx + bank + 8} y1={cy - ry * 0.16} y2={cy - ry * 0.16} stroke={LINO.ink} strokeWidth={5} />
        </g>
      ))}
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={LINO.ink} strokeWidth={8} />
    </g>
  );
};

/** A carved ground band with gouge marks. */
export const LinoGround: React.FC<{ y: number; w: number; h: number }> = ({ y, w, h }) => (
  <g>
    <path d={`M-20 ${y + 10} Q ${w * 0.25} ${y - 14} ${w * 0.5} ${y + 6} T ${w + 20} ${y} L${w + 20} ${y + h} L-20 ${y + h} Z`} fill="url(#lino-gouge)" />
    <path d={`M-20 ${y + 10} Q ${w * 0.25} ${y - 14} ${w * 0.5} ${y + 6} T ${w + 20} ${y}`} stroke={LINO.ink} strokeWidth={10} fill="none" />
  </g>
);

/** A carved manuscript page: ink frame, red initial, asemic lines, the marginal round table. */
export const LinoManuscript: React.FC<{ x: number; y: number; w: number; h: number; rot?: number }> = ({ x, y, w, h, rot = -3 }) => (
  <g transform={`rotate(${rot} ${x + w / 2} ${y + h / 2})`}>
    <rect x={x + 16} y={y + 18} width={w} height={h} fill={LINO.ink} />
    <rect x={x} y={y} width={w} height={h} fill={LINO.paper} stroke={LINO.ink} strokeWidth={12} />
    <rect x={x + 26} y={y + 26} width={w - 52} height={h - 52} fill="none" stroke={LINO.ink} strokeWidth={4} />
    <rect x={x + 50} y={y + 56} width={w * 0.22} height={w * 0.22} fill={LINO.red} />
    <text x={x + 50 + w * 0.11} y={y + 56 + w * 0.19} textAnchor="middle" fontFamily={BANGERS} fontSize={w * 0.2} fill={LINO.paper}>
      G
    </text>
    <ScriptLines x={x + 70 + w * 0.22} y={y + 90} w={w - 130 - w * 0.22} rows={4} gap={w * 0.05} seed={12} color={LINO.ink} size={w / 560} />
    <ScriptLines x={x + 56} y={y + 80 + w * 0.26} w={w - 112} rows={Math.floor((h - w * 0.26 - 200) / (w * 0.05))} gap={w * 0.05} seed={31} color={LINO.ink} size={w / 560} />
    <g transform={`translate(${x + w - 120} ${y + h - 90})`}>
      <ellipse rx={56} ry={20} fill="none" stroke={LINO.ink} strokeWidth={6} />
      {Array.from({ length: 8 }).map((_, i) => (
        <circle key={i} cx={Math.cos((i / 8) * Math.PI * 2) * 70} cy={Math.sin((i / 8) * Math.PI * 2) * 28} r={7} fill={LINO.red} />
      ))}
    </g>
  </g>
);
