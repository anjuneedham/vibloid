import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Clerk } from "../../shared/Clerk";
import { Grain, rand } from "../../shared/Frame";

const BLACK = "#0B0705";
const LIT = "#FFE2A8";

const Bat: React.FC<{ i: number }> = ({ i }) => {
  const frame = useCurrentFrame();
  const f = Math.floor(frame / 3) * 3; // puppet-like stepped motion
  const x = ((f * (2.4 + rand(i) * 1.6) + rand(i + 4) * 1920) % 2200) - 140;
  const y = 170 + rand(i + 9) * 260 + Math.sin(f / 12 + i) * 38;
  const flap = Math.sin(f / 1.6 + i) > 0 ? 1 : 0.35;
  return (
    <g transform={`translate(${x} ${y}) scale(1 ${flap})`}>
      <path d="M0 0 Q -30 -34 -64 -8 Q -44 -6 -36 8 Q -22 -2 -12 10 L 0 24 L 12 10 Q 22 -2 36 8 Q 44 -6 64 -8 Q 30 -34 0 0 Z" fill={BLACK} />
    </g>
  );
};

export const Shadow: React.FC = () => {
  const frame = useCurrentFrame();
  const f = Math.floor(frame / 4) * 4; // hold every 4th frame: jerky puppet feel

  // the puppet walks across the stage, then spots a ghost and bolts
  const scared = frame > 175;
  const walk = scared
    ? interpolate(f, [176, 230], [0, -820], { extrapolateRight: "clamp" })
    : 0;
  const px = 760 + 300 * Math.sin(f / 46) + walk;
  const bob = Math.abs(Math.sin(f / 5)) * 16;
  const tilt = scared ? 9 : Math.sin(f / 8) * 5;
  const jump = frame > 176 && frame < 196 ? -80 * Math.sin(((frame - 176) / 20) * Math.PI) : 0;

  const flicker = 0.93 + 0.07 * Math.sin(frame * 1.7) + 0.03 * Math.sin(frame * 4.3);
  const push = interpolate(frame, [0, 300], [1, 1.05]);

  const gx =
    interpolate(frame, [130, 180, 300], [2200, 1300, -260], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) +
    Math.sin(frame / 14) * 26;
  const gy = 520 + Math.sin(frame / 9) * 34;

  const palette = {
    ink: BLACK,
    skin: BLACK,
    coat: BLACK,
    shirt: BLACK,
    accent: BLACK,
    lens: LIT,
    glass: BLACK,
    eye: BLACK,
  };

  return (
    <AbsoluteFill style={{ background: "#1A0D05", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: "50% 60%" }}>
        {/* lit paper screen */}
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse at 50% 55%, #FFE3A6 0%, #F2A94E 38%, #A55A1E 72%, #4A1F08 100%)",
            opacity: flicker,
          }}
        />
        <Grain opacity={0.35} />

        {/* black cut-out scenery */}
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          {/* moon */}
          <circle cx={1340} cy={230} r={86} fill="#FFF3CF" opacity={0.9} />
          {/* gnarled tree */}
          <g transform="translate(270 0)">
          <path
            d="M210 940 Q 230 760 190 620 Q 150 560 90 520 Q 150 520 200 560 Q 180 440 120 380 Q 190 410 230 500 Q 260 400 330 350 Q 300 440 280 540 Q 360 480 440 470 Q 350 540 300 640 Q 290 780 320 940 Z"
            fill={BLACK}
          />
          </g>
          {/* castle on the right */}
          <g transform="translate(-270 0)">
          <path
            d="M1480 940 L1480 640 L1510 640 L1510 600 L1540 600 L1540 640 L1580 640 L1580 520 L1560 520 L1620 440 L1680 520 L1660 520 L1660 640 L1720 640 L1720 580 L1750 580 L1750 640 L1780 640 L1780 940 Z"
            fill={BLACK}
          />
          <rect x={1590} y={700} width={26} height={54} rx={13} fill={LIT} opacity={0.85} />
          <rect x={1650} y={760} width={22} height={46} rx={11} fill={LIT} opacity={0.7} />
          </g>
          {/* ground with grass blades */}
          <path
            d="M0 930 Q 300 905 600 925 T 1200 920 T 1920 915 L1920 1080 L0 1080 Z"
            fill={BLACK}
          />
          {Array.from({ length: 70 }).map((_, i) => {
            const x = i * 28 + rand(i) * 10;
            const h = 22 + rand(i + 3) * 34;
            const sway = Math.sin(f / 14 + i) * 4;
            return (
              <path
                key={i}
                d={`M${x} 930 Q ${x + sway} ${930 - h * 0.6} ${x + 6 + sway * 1.6} ${930 - h} L${x + 12} 930 Z`}
                fill={BLACK}
              />
            );
          })}
          {Array.from({ length: 4 }).map((_, i) => (
            <Bat key={i} i={i + 1} />
          ))}
        </svg>

        {/* ghost puppet */}
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          <g transform={`translate(${gx} ${gy})`}>
            <path
              d={`M-110 160 Q -130 -90 0 -120 Q 130 -90 110 160 ${Array.from({ length: 6 })
                .map((_, i) => `Q ${100 - i * 40} ${190 + (i % 2 === 0 ? 26 : -8)} ${80 - i * 36} 160`)
                .join(" ")} Z`}
              fill={BLACK}
            />
            <ellipse cx={-38} cy={-34} rx={22} ry={32} fill={LIT} />
            <ellipse cx={38} cy={-34} rx={22} ry={32} fill={LIT} />
            <ellipse cx={0} cy={44} rx={26} ry={36} fill={LIT} />
          </g>
        </svg>

        {/* the Clerk puppet */}
        <div
          style={{
            position: "absolute",
            left: px - 190,
            top: 920 - 600 - bob + jump,
            transform: `rotate(${tilt}deg)`,
            transformOrigin: "50% 95%",
          }}
        >
          <Clerk
            width={380}
            palette={palette}
            strokeWidth={8}
            idle={false}
            autoBlink={false}
            prop={false}
            armL={scared ? -80 : 30 * Math.sin(f / 7)}
            armR={scared ? 80 : -30 * Math.sin(f / 7 + 2)}
            wide={scared ? 1 : 0}
            mouth="open"
          />
        </div>
      </AbsoluteFill>

      {/* stage: curtains + valance (black cut-outs) */}
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <path
          d={`M0 0 L330 0 Q 290 200 340 400 Q 300 620 350 1080 L0 1080 Z`}
          fill="#060302"
        />
        <path
          d={`M1920 0 L1590 0 Q 1630 200 1580 400 Q 1620 620 1570 1080 L1920 1080 Z`}
          fill="#060302"
        />
        <path
          d={`M0 0 L1920 0 L1920 120 ${Array.from({ length: 16 })
            .map((_, i) => `Q ${1920 - i * 120 - 60} 190 ${1920 - (i + 1) * 120} 120`)
            .join(" ")} Z`}
          fill="#060302"
        />
      </svg>
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(10,3,0,0.7) 100%)" }}
      />
    </AbsoluteFill>
  );
};
