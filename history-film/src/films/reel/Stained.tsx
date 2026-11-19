import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Clerk } from "../../shared/Clerk";
import { BANGERS } from "../../shared/fonts";
import { rand } from "../../shared/Frame";

const LEAD = "#0A0910";
const JEWELS = ["#B3122B", "#1F4FD1", "#0F8F55", "#F2B134", "#7A2DB0", "#E96B1B"];

const X0 = 640;
const Y0 = 110;
const W = 640;
const H = 850;
const COLS = 8;
const ROWS = 11;

const point = (i: number, j: number): [number, number] => {
  const jx = i > 0 && i < COLS ? (rand(i * 17 + j * 3 + 1) - 0.5) * 46 : 0;
  const jy = j > 0 && j < ROWS ? (rand(i * 5 + j * 29 + 7) - 0.5) * 46 : 0;
  return [X0 + (i * W) / COLS + jx, Y0 + (j * H) / ROWS + jy];
};

export const Stained: React.FC = () => {
  const frame = useCurrentFrame();
  const push = interpolate(frame, [0, 300], [1, 1.06]);

  const cells: React.ReactNode[] = [];
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      const idx = j * COLS + i;
      const a = point(i, j);
      const b = point(i + 1, j);
      const c = point(i + 1, j + 1);
      const d = point(i, j + 1);
      const color = JEWELS[Math.floor(rand(idx * 3.1 + 2) * JEWELS.length)];
      const shimmer = 0.06 + 0.14 * (0.5 + 0.5 * Math.sin(frame / 18 + idx * 0.9));
      const pts = `${a[0]},${a[1]} ${b[0]},${b[1]} ${c[0]},${c[1]} ${d[0]},${d[1]}`;
      cells.push(
        <g key={idx}>
          <polygon points={pts} fill={color} />
          <polygon points={pts} fill="#FFF6D8" opacity={shimmer} />
          <polygon points={pts} fill="none" stroke={LEAD} strokeWidth={8} strokeLinejoin="round" />
        </g>,
      );
    }
  }

  const palette = {
    ink: LEAD,
    skin: "#F6D9A4",
    coat: "#2F59C9",
    shirt: "#F8EFD5",
    accent: "#B3122B",
    lens: "rgba(255,255,255,0.35)",
    glass: "#6FB6D9",
    eye: LEAD,
  };

  return (
    <AbsoluteFill style={{ background: "#0C0A10", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: "50% 45%" }}>
        {/* stone pillars */}
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          <defs>
            <linearGradient id="pillar" x1="0" x2="1">
              <stop offset="0" stopColor="#0B0A0F" />
              <stop offset="0.5" stopColor="#24202B" />
              <stop offset="1" stopColor="#0B0A0F" />
            </linearGradient>
            <clipPath id="arch">
              <path d={`M${X0} ${Y0 + W / 2} A${W / 2} ${W / 2} 0 0 1 ${X0 + W} ${Y0 + W / 2} L${X0 + W} ${Y0 + H} L${X0} ${Y0 + H} Z`} />
            </clipPath>
            <clipPath id="roundel">
              <circle cx={960} cy={520} r={190} />
            </clipPath>
          </defs>
          <rect x={330} y={0} width={110} height={1080} fill="url(#pillar)" />
          <rect x={1480} y={0} width={110} height={1080} fill="url(#pillar)" />
          <line x1={0} y1={Y0 + H + 4} x2={1920} y2={Y0 + H + 4} stroke="#5A5F6B" strokeWidth={4} />
        </svg>

        {/* light spilling from the window */}
        <div
          style={{
            position: "absolute",
            left: 960 - 760,
            top: 520 - 760,
            width: 1520,
            height: 1520,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,215,150,0.55) 0%, rgba(255,150,60,0.18) 40%, rgba(0,0,0,0) 68%)",
            mixBlendMode: "screen",
          }}
        />
        {[
          ["#B3122B", 460, 980],
          ["#1F4FD1", 1100, 1010],
          ["#0F8F55", 1480, 960],
          ["#F2B134", 800, 1000],
        ].map(([c, x, y], i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: (x as number) - 260,
              top: (y as number) - 70,
              width: 520,
              height: 140,
              borderRadius: "50%",
              background: `radial-gradient(ellipse, ${c} 0%, rgba(0,0,0,0) 70%)`,
              opacity: 0.35 + 0.15 * Math.sin(frame / 30 + i * 2),
              mixBlendMode: "screen",
            }}
          />
        ))}

        {/* the window itself */}
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          <g clipPath="url(#arch)">{cells}</g>
          <path
            d={`M${X0} ${Y0 + W / 2} A${W / 2} ${W / 2} 0 0 1 ${X0 + W} ${Y0 + W / 2} L${X0 + W} ${Y0 + H} L${X0} ${Y0 + H} Z`}
            fill="none"
            stroke={LEAD}
            strokeWidth={22}
            strokeLinejoin="round"
          />
          {/* roundel */}
          <circle cx={960} cy={520} r={190} fill="#F2B134" />
          <g clipPath="url(#roundel)">
            <g transform={`rotate(${frame * 0.4} 960 520)`}>
              {Array.from({ length: 20 }).map((_, i) => (
                <path key={i} d="M960 520 L930 320 L990 320 Z" fill={i % 2 ? "#FFD36B" : "#E96B1B"} transform={`rotate(${i * 18} 960 520)`} />
              ))}
            </g>
          </g>
          <circle cx={960} cy={520} r={190} fill="none" stroke={LEAD} strokeWidth={14} />
          <circle cx={960} cy={520} r={208} fill="none" stroke={LEAD} strokeWidth={8} />
        </svg>
        <div style={{ position: "absolute", left: 960 - 190, top: 520 - 172, width: 380, height: 360, overflow: "hidden", borderRadius: "50%" }}>
          <Clerk
            width={330}
            palette={palette}
            headOnly
            strokeWidth={10}
            mouth="frown"
            browTilt={-0.8}
            browLift={0.4}
            headTilt={Math.sin(frame / 40) * 3}
            style={{ position: "absolute", left: 25, top: 20 }}
          />
        </div>

        {/* banner */}
        <div
          style={{
            position: "absolute",
            left: X0 + 20,
            top: 836,
            width: W - 40,
            height: 84,
            background: LEAD,
            border: "6px solid #F2B134",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: BANGERS,
            fontSize: 60,
            letterSpacing: 5,
            color: "#F6C453",
            paddingTop: 6,
          }}
        >
          ANNO DOMINI 897
        </div>
      </AbsoluteFill>
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.75) 100%)" }}
      />
    </AbsoluteFill>
  );
};
