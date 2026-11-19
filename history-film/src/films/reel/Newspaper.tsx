import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BoilDefs } from "../../shared/BoilDefs";
import { Clerk } from "../../shared/Clerk";
import { BANGERS, COMIC } from "../../shared/fonts";
import { Grain, clamp01, rand } from "../../shared/Frame";

const INK = "#17120D";

const torn = (w: number, h: number, seed: number, step = 26, amp = 8) => {
  const pts: string[] = [];
  for (let x = 0; x <= w; x += step) pts.push(`${x}px ${rand(seed + x) * amp}px`);
  for (let y = 0; y <= h; y += step) pts.push(`${w - rand(seed + y + 100) * amp}px ${y}px`);
  for (let x = w; x >= 0; x -= step) pts.push(`${x}px ${h - rand(seed + x + 200) * amp}px`);
  for (let y = h; y >= 0; y -= step) pts.push(`${rand(seed + y + 300) * amp}px ${y}px`);
  return `polygon(${pts.join(",")})`;
};

export const Newspaper: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const slap = (start: number, damping = 12) => {
    const s = spring({ frame: frame - start, fps, config: { damping, stiffness: 260, mass: 0.6 } });
    return { scale: 1.6 - 0.6 * s, opacity: clamp01((frame - start) / 3), s };
  };
  const scrap1 = slap(2);
  const headline = slap(10);
  const scrap2 = slap(32);
  const photo = slap(40);
  const clerkIn = spring({ frame: frame - 70, fps, config: { damping: 11, stiffness: 140, mass: 0.8 } });
  const stamp = slap(120, 14);

  const shakeT = frame - 120;
  const shake = shakeT > 0 && shakeT < 16 ? Math.sin(shakeT * 2.6) * 10 * (1 - shakeT / 16) : 0;

  const float = (i: number) => Math.sin(frame / 22 + i * 1.7) * 3;

  const mag = interpolate(frame, [170, 285], [180, 1090], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const magY = 300 + Math.sin(frame / 18) * 14;

  return (
    <AbsoluteFill style={{ background: "#D9CCAE", transform: `translate(${shake}px, ${shake * 0.6}px)` }}>
      <BoilDefs id="paper" scale={3.5} rate={8} frequency={0.02} />
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id="sticker" x="-12%" y="-8%" width="124%" height="116%">
            <feMorphology in="SourceAlpha" operator="dilate" radius="9" result="d" />
            <feFlood floodColor="#ffffff" result="w" />
            <feComposite in="w" in2="d" operator="in" result="outline" />
            <feDropShadow in="outline" dx="7" dy="11" stdDeviation="7" floodColor="#000" floodOpacity="0.5" result="sh" />
            <feMerge>
              <feMergeNode in="sh" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* halftone newsprint */}
      <AbsoluteFill
        style={{
          backgroundImage: "radial-gradient(circle, rgba(40,25,10,0.22) 1.3px, transparent 1.8px)",
          backgroundSize: "7px 7px",
        }}
      />
      {/* faint columns of text */}
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0, opacity: 0.22 }}>
        {Array.from({ length: 6 }).map((_, c) =>
          Array.from({ length: 22 }).map((__, r) => (
            <rect key={`${c}-${r}`} x={70 + c * 300} y={400 + r * 28} width={250 * (0.6 + rand(c * 31 + r) * 0.4)} height={9} fill={INK} />
          )),
        )}
      </svg>

      {/* masthead */}
      <div style={{ position: "absolute", left: 0, top: 66, width: "100%", textAlign: "center" }}>
        <div style={{ fontFamily: BANGERS, fontSize: 78, color: INK, letterSpacing: 8 }}>THE DAILY TENSE</div>
        <div style={{ height: 6, margin: "2px 70px 0", background: INK }} />
        <div style={{ height: 2, margin: "5px 70px 0", background: INK }} />
      </div>

      {/* coloured paper scraps */}
      <div
        style={{
          position: "absolute",
          left: 100,
          top: 190,
          width: 1180,
          height: 210,
          background: "#E0A526",
          clipPath: torn(1180, 210, 3),
          transform: `rotate(${-4 + float(1) * 0.1}deg) scale(${scrap1.scale})`,
          opacity: scrap1.opacity,
          filter: "drop-shadow(6px 9px 8px rgba(0,0,0,0.4))",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 1130,
          top: 130,
          width: 640,
          height: 520,
          background: "#C23B2C",
          clipPath: torn(640, 520, 9),
          transform: `rotate(7deg) scale(${scrap2.scale})`,
          opacity: scrap2.opacity,
          filter: "drop-shadow(6px 9px 8px rgba(0,0,0,0.4))",
        }}
      />

      {/* headline strip */}
      <div
        style={{
          position: "absolute",
          left: 130,
          top: 215,
          width: 1100,
          height: 165,
          background: INK,
          clipPath: torn(1100, 165, 21, 30, 9),
          transform: `rotate(${-2 + float(2) * 0.15}deg) scale(${headline.scale})`,
          opacity: headline.opacity,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontFamily: BANGERS, fontSize: 124, color: "#F6EFD8", letterSpacing: 4, paddingTop: 10 }}>
          ARMY VS EMUS?!
        </div>
      </div>

      {/* archive photo placeholder (this is how real public-domain photos will sit) */}
      <div
        style={{
          position: "absolute",
          left: 1180,
          top: 160,
          width: 540,
          height: 430,
          background: "#F5F0E2",
          padding: 20,
          transform: `translateY(${float(3)}px) rotate(5deg) scale(${photo.scale})`,
          opacity: photo.opacity,
          boxShadow: "8px 14px 18px rgba(0,0,0,0.5)",
        }}
      >
        <svg width={500} height={360} viewBox="0 0 500 360" style={{ display: "block" }}>
          <defs>
            <linearGradient id="sepia" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#C9A56E" />
              <stop offset="1" stopColor="#6B4A28" />
            </linearGradient>
          </defs>
          <rect width={500} height={360} fill="url(#sepia)" />
          <circle cx={380} cy={90} r={38} fill="#F2DDB0" />
          <path d="M0 250 Q 120 190 240 240 T 500 230 L500 360 L0 360 Z" fill="#3E2B16" />
          <path d="M70 250 L70 150 M70 190 L40 160 M70 175 L100 140" stroke="#2A1B0C" strokeWidth={8} fill="none" strokeLinecap="round" />
          <rect width={500} height={360} fill="none" stroke="#2A1B0C" strokeWidth={4} opacity={0.4} />
        </svg>
        <div style={{ fontFamily: COMIC, fontSize: 22, color: INK, marginTop: 8, fontWeight: 700 }}>
          ARCHIVE PHOTO (placeholder)
        </div>
        <Grain opacity={0.5} />
      </div>

      {/* Clerk sticker */}
      <div
        style={{
          position: "absolute",
          left: 380,
          top: 330 + (1 - clerkIn) * 700,
          filter: "url(#sticker)",
          transform: `rotate(${-3 + (1 - clerkIn) * 8}deg)`,
        }}
      >
        <Clerk
          width={470}
          filterId="paper"
          mouth="open"
          browLift={0.8}
          wide={0.6}
          armL={18 * Math.sin(frame / 9)}
          armR={-18 * Math.sin(frame / 9 + 1)}
          idle
        />
      </div>

      {/* CLASSIFIED stamp */}
      <div
        style={{
          position: "absolute",
          left: 780,
          top: 700,
          transform: `rotate(-14deg) scale(${stamp.scale * 1.0})`,
          opacity: stamp.opacity * 0.9,
          border: "12px solid #B3001B",
          padding: "2px 30px 0",
          color: "#B3001B",
          fontFamily: BANGERS,
          fontSize: 130,
          letterSpacing: 8,
          filter: "url(#paper)",
          mixBlendMode: "multiply",
        }}
      >
        CLASSIFIED
      </div>

      {/* magnifying glass sweeping over the headline */}
      <div
        style={{
          position: "absolute",
          left: mag - 90,
          top: magY - 90,
          width: 180,
          height: 180,
          opacity: clamp01((frame - 170) / 8),
        }}
      >
        <svg width={260} height={260} viewBox="-90 -90 260 260" style={{ overflow: "visible" }}>
          <path d="M60 60 L150 150" stroke={INK} strokeWidth={24} strokeLinecap="round" />
          <circle cx={0} cy={0} r={78} fill="rgba(255,255,255,0.25)" stroke={INK} strokeWidth={16} />
          <path d="M-46 -30 Q -30 -56 -4 -60" stroke="#fff" strokeWidth={9} strokeLinecap="round" fill="none" opacity={0.7} />
        </svg>
      </div>

      <Grain opacity={0.35} />
      <AbsoluteFill
        style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(40,25,5,0.45) 100%)" }}
      />
    </AbsoluteFill>
  );
};
