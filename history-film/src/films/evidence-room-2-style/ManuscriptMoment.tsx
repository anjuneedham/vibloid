import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BoilDefs } from "../../shared/BoilDefs";
import { BANGERS, COMIC } from "../../shared/fonts";
import { rand } from "../../shared/Frame";
import { beatAt, MOMENT_TEXT, MomentTiming, VERDICT_WORD } from "../../shared/moment";
import { Player } from "../../shared/Player";
import { PaperGrain } from "../../shared/shadow/paper";
import { flickerAt } from "../../shared/shadow/light";
import { ScriptLines } from "../../shared/shadow/slide";
import { MANU } from "../../shared/theme";

// STYLE OPTION: ILLUMINATED MANUSCRIPT. The moment is written up as a page of a medieval book:
// the speaker stands in a gilded arched miniature, the line is set as the text, the source is a marginal note.

const ARCH = { x: 190, y: 150, w: 600, h: 760 };
const archPath = (x: number, y: number, w: number, h: number) =>
  `M${x} ${y + h} L${x} ${y + w * 0.55} Q ${x} ${y} ${x + w / 2} ${y} Q ${x + w} ${y} ${x + w} ${y + w * 0.55} L${x + w} ${y + h} Z`;

const Border: React.FC = () => {
  const frame = useCurrentFrame();
  const glint = (i: number) => 0.4 + 0.6 * Math.max(0, Math.sin(frame / 14 - i * 0.35));
  return (
    <g>
      <rect x={110} y={100} width={1700} height={880} fill="none" stroke={MANU.gold} strokeWidth={14} />
      <rect x={128} y={118} width={1664} height={844} fill="none" stroke={MANU.vermilion} strokeWidth={4} />
      {Array.from({ length: 44 }).map((_, i) => (
        <g key={i}>
          <circle cx={150 + i * 37.6} cy={100} r={6} fill={MANU.goldHi} opacity={glint(i)} />
          <circle cx={150 + i * 37.6} cy={980} r={6} fill={MANU.goldHi} opacity={glint(i + 9)} />
        </g>
      ))}
      {/* vine scroll in the margin */}
      <path d="M1840 140 C 1880 260, 1800 330, 1840 450 S 1800 640, 1840 760 S 1810 900, 1840 960" stroke={MANU.verdigris} strokeWidth={6} fill="none" />
      {Array.from({ length: 8 }).map((_, i) => (
        <ellipse key={i} cx={1840 + (i % 2 ? 22 : -22)} cy={180 + i * 100} rx={16} ry={8} fill={MANU.verdigris} transform={`rotate(${i % 2 ? 30 : -30} ${1840 + (i % 2 ? 22 : -22)} ${180 + i * 100})`} />
      ))}
    </g>
  );
};

const Miniature: React.FC<{ who: "curator" | "dig" | "doubt" | "clerk"; since: number; talk: [number, number] }> = ({ who, since, talk }) => {
  const frame = useCurrentFrame();
  const stars = Array.from({ length: 40 }).map((_, i) => [ARCH.x + 30 + rand(i + 3) * (ARCH.w - 60), ARCH.y + 40 + rand(i + 7) * (ARCH.h - 200)]);
  const o = interpolate(frame - since, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <clipPath id="arch">
            <path d={archPath(ARCH.x, ARCH.y, ARCH.w, ARCH.h)} />
          </clipPath>
        </defs>
        <path d={archPath(ARCH.x - 16, ARCH.y - 16, ARCH.w + 32, ARCH.h + 32)} fill={MANU.gold} />
        <g clipPath="url(#arch)">
          <rect x={ARCH.x} y={ARCH.y} width={ARCH.w} height={ARCH.h} fill={MANU.lapis} />
          {stars.map(([x, y], i) => (
            <path key={i} d={`M${x} ${y - 9} L${x + 3} ${y - 3} L${x + 9} ${y} L${x + 3} ${y + 3} L${x} ${y + 9} L${x - 3} ${y + 3} L${x - 9} ${y} L${x - 3} ${y - 3} Z`} fill={MANU.goldHi} opacity={0.55 + 0.45 * Math.sin(frame / 10 + i)} />
          ))}
          {/* tiled floor */}
          {Array.from({ length: 10 }).map((_, i) => (
            <rect key={i} x={ARCH.x + i * 60} y={ARCH.y + ARCH.h - 110} width={60} height={110} fill={i % 2 ? MANU.vermilion : MANU.verdigris} opacity={0.85} />
          ))}
        </g>
        <path d={archPath(ARCH.x, ARCH.y, ARCH.w, ARCH.h)} fill="none" stroke={MANU.ink} strokeWidth={6} />
      </svg>
      <div style={{ position: "absolute", inset: 0, opacity: o, clipPath: `path('${archPath(ARCH.x, ARCH.y, ARCH.w, ARCH.h)}')` }}>
        <Player who={who} x={ARCH.x + ARCH.w / 2} feet={ARCH.y + ARCH.h - 50} width={330} talk={[talk]} filterId="ink" sway={0.6} prop={who === "clerk"} />
      </div>
    </>
  );
};

export const ManuscriptMoment: React.FC<{ t: MomentTiming }> = ({ t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = beatAt(t, frame);
  const T = MOMENT_TEXT[b];
  const since = t.cuts[b];
  const fl = flickerAt(frame, 2);
  const words = T.line.split(" ");
  const ink = (frame - since - 4) / 2.2; // the scribe writes about one word every 2 frames
  const hit = spring({ frame: frame - t.hit, fps, config: { damping: 10, stiffness: 220, mass: 0.6 } });
  const push = interpolate(frame, [0, t.end], [1, 1.05]);
  return (
    <AbsoluteFill style={{ background: MANU.night }}>
      <BoilDefs id="ink" scale={4} rate={8} frequency={0.02} />
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        {/* the page */}
        <AbsoluteFill style={{ background: `radial-gradient(1100px 800px at 40% 40%, ${MANU.vellum} 30%, ${MANU.vellumDark} 100%)` }} />
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          <Border />
          <g opacity={0.25}>
            <ScriptLines x={880} y={700} w={860} rows={6} gap={36} seed={5} color={MANU.ink} />
          </g>
        </svg>
        <Miniature key={b} who={T.who} since={since} talk={t.lines[b]} />
        {/* the text column */}
        <div style={{ position: "absolute", left: 880, top: 190, width: 860 }}>
          <div style={{ fontFamily: BANGERS, fontSize: 40, letterSpacing: 6, color: MANU.vermilion }}>
            {T.who === "curator" ? "THE CURATOR" : T.who === "clerk" ? "THE CLERK" : T.who.toUpperCase()} SPEAKETH
          </div>
          <div style={{ fontFamily: COMIC, fontWeight: 700, fontSize: 64, lineHeight: 1.18, color: MANU.ink, marginTop: 10 }}>
            <span style={{ display: "inline-block", fontFamily: BANGERS, fontSize: 132, lineHeight: 0.8, color: MANU.vermilion, background: MANU.gold, padding: "12px 14px 0", marginRight: 12, float: "left", border: `5px solid ${MANU.ink}` }}>
              {words[0][0]}
            </span>
            {words.map((w, i) => (
              <span key={i} style={{ opacity: Math.max(0, Math.min(1, ink - i)) }}>
                {i === 0 ? w.slice(1) : w}{" "}
              </span>
            ))}
          </div>
        </div>
        {/* marginal source note with a pointing hand */}
        <div style={{ position: "absolute", left: 880, top: 920, width: 900, fontFamily: COMIC, fontWeight: 700, fontSize: 26, color: MANU.ink, opacity: interpolate(frame - since, [8, 16], [0, 0.9], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>
          <span style={{ fontFamily: BANGERS, color: MANU.vermilion, letterSpacing: 2, marginRight: 10 }}>{"☞"} SOURCE</span>
          {T.tag}
        </div>
        {/* verdict: a gilded roundel pressed onto the page */}
        {frame >= t.hit ? (
          <div style={{ position: "absolute", left: 1290 - 210, top: 560 - 210 + 40, width: 420, height: 420, transform: `scale(${0.4 + 0.6 * hit}) rotate(${-6 * hit}deg)`, opacity: Math.min(1, hit * 2) }}>
            <svg width={420} height={420}>
              <circle cx={210} cy={210} r={200} fill={MANU.gold} stroke={MANU.ink} strokeWidth={8} />
              <circle cx={210} cy={210} r={168} fill={MANU.vermilion} stroke={MANU.goldHi} strokeWidth={6} />
              {Array.from({ length: 24 }).map((_, i) => (
                <circle key={i} cx={210 + Math.cos((i / 24) * Math.PI * 2) * 184} cy={210 + Math.sin((i / 24) * Math.PI * 2) * 184} r={5} fill={MANU.ink} />
              ))}
              <text x={210} y={240} textAnchor="middle" fontFamily={BANGERS} fontSize={80} letterSpacing={4} fill={MANU.goldHi} stroke={MANU.ink} strokeWidth={2}>
                {VERDICT_WORD}
              </text>
            </svg>
          </div>
        ) : null}
        <PaperGrain opacity={0.35} />
      </AbsoluteFill>
      {/* candle light over the page */}
      <AbsoluteFill style={{ background: `radial-gradient(1300px 820px at 52% 42%, rgba(0,0,0,0) 45%, ${MANU.night} 125%)`, opacity: 0.7 + (1 - fl) * 3 }} />
    </AbsoluteFill>
  );
};
