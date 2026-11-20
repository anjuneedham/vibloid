import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BoilDefs } from "../../shared/BoilDefs";
import { BANGERS, COMIC } from "../../shared/fonts";
import { rand } from "../../shared/Frame";
import { BEATS, BeatId, beatAt, MOMENT_TEXT, MomentTiming, VERDICT_WORD } from "../../shared/moment";
import { Player } from "../../shared/Player";
import { PaperGrain } from "../../shared/shadow/paper";
import { tornRect } from "../../shared/shadow/gel";
import { NEWS } from "../../shared/theme";

// STYLE OPTION: NEWSPAPER COLLAGE ON THE EVIDENCE BOARD. Each beat is a clipping pinned to the board:
// a headline, a halftone "photo" with the speaker as a cut-out sticker, a SOURCE line. The camera moves
// clipping to clipping; red string joins them; the verdict stamp lands as the camera pulls back.

type Clip = { x: number; y: number; w: number; h: number; rot: number };
const CLIPS: Record<BeatId, Clip> = {
  open: { x: 120, y: 120, w: 620, h: 430, rot: -3 },
  claim: { x: 800, y: 90, w: 560, h: 450, rot: 2.5 },
  object: { x: 1420, y: 160, w: 470, h: 470, rot: -2 },
  source: { x: 300, y: 600, w: 640, h: 420, rot: 2 },
  verdict: { x: 1040, y: 620, w: 640, h: 400, rot: -1.5 },
};
const HEAD: Record<BeatId, string> = {
  open: "COURT IN SESSION",
  claim: "“ARTHUR WAS HERE!”",
  object: "SAYS WHO?",
  source: "EXHIBIT A FOUND",
  verdict: "THE VERDICT",
};
const center = (c: Clip) => [c.x + c.w / 2, c.y + c.h / 2] as const;

const Clipping: React.FC<{ id: BeatId; at: number; talk: [number, number] }> = ({ id, at, talk }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at) return null;
  const c = CLIPS[id];
  const s = spring({ frame: frame - at, fps, config: { damping: 14, stiffness: 160, mass: 0.7 } });
  const T = MOMENT_TEXT[id];
  const photoW = c.w * 0.46;
  const photoH = c.h - 150;
  return (
    <div style={{ position: "absolute", left: c.x, top: c.y, width: c.w, height: c.h, transform: `rotate(${c.rot}deg) translateY(${(1 - s) * -40}px) scale(${1.08 - 0.08 * s})`, opacity: Math.min(1, s * 3) }}>
      <svg width={c.w + 40} height={c.h + 40} style={{ position: "absolute", left: -20, top: -20 }}>
        <path d={tornRect(26, 28, c.w, c.h, rand(c.x) * 50, 10, 24)} fill={NEWS.desk} opacity={0.6} />
        <path d={tornRect(20, 20, c.w, c.h, rand(c.x) * 50, 10, 24)} fill={id === "source" ? NEWS.printOld : NEWS.print} />
        {/* column text */}
        {Array.from({ length: Math.floor((c.h - 150) / 18) }).map((_, i) => (
          <rect key={i} x={20 + photoW + 40} y={20 + 120 + i * 18} width={(c.w - photoW - 70) * (0.6 + rand(i + c.x) * 0.4)} height={7} fill={NEWS.ink} opacity={0.3} />
        ))}
      </svg>
      <div style={{ position: "absolute", left: 18, top: 14, right: 18, fontFamily: BANGERS, fontSize: c.w * 0.11, lineHeight: 1, color: NEWS.ink, borderBottom: `4px double ${NEWS.ink}`, paddingBottom: 6 }}>{HEAD[id]}</div>
      {/* halftone photo with the speaker as a sticker */}
      <div
        style={{
          position: "absolute",
          left: 22,
          top: 100,
          width: photoW,
          height: photoH,
          overflow: "hidden",
          background: NEWS.photo,
          backgroundImage: `radial-gradient(circle, ${NEWS.ink} 2.2px, transparent 2.8px)`,
          backgroundSize: "9px 9px",
          border: `3px solid ${NEWS.ink}`,
        }}
      >
        <div style={{ position: "absolute", inset: 0, transform: `translate(${photoW / 2 - 960}px, ${photoH - 1030}px)` }}>
          <Player
            who={T.who}
            x={960}
            feet={1040}
            width={photoW * 0.78}
            talk={[talk]}
            filterId="ink"
            prop={T.who === "clerk"}
            cssFilter={`drop-shadow(3px 0 0 ${NEWS.print}) drop-shadow(-3px 0 0 ${NEWS.print}) drop-shadow(0 3px 0 ${NEWS.print}) drop-shadow(0 -3px 0 ${NEWS.print}) drop-shadow(4px 6px 4px ${NEWS.desk})`}
          />
        </div>
      </div>
      {/* the quote, ransom-note style */}
      <div style={{ position: "absolute", left: photoW + 44, top: 106, width: c.w - photoW - 66, display: "flex", flexWrap: "wrap", gap: 6 }}>
        {T.line.split(" ").map((w, i) => (
          <span
            key={i}
            style={{
              fontFamily: i % 3 === 1 ? COMIC : BANGERS,
              fontWeight: 700,
              fontSize: c.w * (0.055 + rand(i + c.y) * 0.02),
              background: i % 4 === 2 ? NEWS.ink : NEWS.print,
              color: i % 4 === 2 ? NEWS.print : i % 5 === 3 ? NEWS.red : NEWS.ink,
              padding: "2px 6px",
              transform: `rotate(${(rand(i * 3 + c.x) - 0.5) * 7}deg)`,
              boxShadow: `1px 2px 0 ${NEWS.desk}`,
              opacity: frame - at > 4 + i * 2 ? 1 : 0,
            }}
          >
            {w}
          </span>
        ))}
      </div>
      <div style={{ position: "absolute", left: 22, right: 22, bottom: 12, fontFamily: COMIC, fontWeight: 700, fontSize: 19, color: NEWS.ink, lineHeight: 1.15 }}>
        <span style={{ fontFamily: BANGERS, color: NEWS.red, letterSpacing: 1, marginRight: 8 }}>SOURCE</span>
        {T.tag}
      </div>
      {/* tape */}
      <div style={{ position: "absolute", left: c.w / 2 - 60, top: -18, width: 120, height: 34, background: NEWS.tape, transform: "rotate(-4deg)" }} />
    </div>
  );
};

export const NewsMoment: React.FC<{ t: MomentTiming }> = ({ t }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const b = beatAt(t, frame);
  const i = BEATS.indexOf(b);
  // camera: close on the current clipping, pulling back to the whole board for the verdict
  const target = (id: BeatId) => (id === "verdict" ? { x: 960, y: 520, z: 0.96 } : { x: center(CLIPS[id])[0], y: center(CLIPS[id])[1], z: 1.55 });
  const prev = target(BEATS[Math.max(0, i - 1)]);
  const cur = target(b);
  const k = interpolate(frame - t.cuts[b], [0, 14], [i === 0 ? 1 : 0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const cx = prev.x + (cur.x - prev.x) * k + Math.sin(frame / 40) * 6;
  const cy = prev.y + (cur.y - prev.y) * k + Math.cos(frame / 50) * 4;
  const z = prev.z + (cur.z - prev.z) * k;
  const stamp = spring({ frame: frame - t.hit, fps, config: { damping: 9, stiffness: 300, mass: 0.5 } });
  const pins = BEATS.filter((id) => frame >= t.cuts[id]).map((id) => [CLIPS[id].x + CLIPS[id].w / 2, CLIPS[id].y - 4] as const);
  return (
    <AbsoluteFill style={{ background: NEWS.desk, overflow: "hidden" }}>
      <BoilDefs id="ink" scale={4} rate={8} frequency={0.02} />
      <AbsoluteFill style={{ transform: `scale(${z}) translate(${960 - cx}px, ${540 - cy}px)`, transformOrigin: "50% 50%" }}>
        {/* the board under a desk lamp */}
        <AbsoluteFill style={{ background: `radial-gradient(1200px 800px at 45% 40%, #3A2C1E 0%, ${NEWS.desk} 100%)` }} />
        {BEATS.map((id) => (
          <Clipping key={id} id={id} at={t.cuts[id]} talk={t.lines[id]} />
        ))}
        <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
          {pins.length > 1 ? <path d={pins.map((p, j) => `${j ? "L" : "M"}${p[0]} ${p[1]}`).join(" ")} stroke={NEWS.red} strokeWidth={4} fill="none" /> : null}
          {pins.map((p, j) => (
            <circle key={j} cx={p[0]} cy={p[1]} r={10} fill={NEWS.red} stroke={NEWS.desk} strokeWidth={3} />
          ))}
        </svg>
        {frame >= t.hit ? (
          <div
            style={{
              position: "absolute",
              left: 1180,
              top: 800,
              width: 560,
              textAlign: "center",
              fontFamily: BANGERS,
              fontSize: 110,
              letterSpacing: 6,
              color: NEWS.red,
              border: `10px solid ${NEWS.red}`,
              padding: "6px 0 0",
              transform: `rotate(-10deg) scale(${1 + (1 - stamp) * 1.4})`,
              opacity: Math.min(0.92, stamp * 3),
              filter: "url(#ink)",
              mixBlendMode: "multiply",
            }}
          >
            {VERDICT_WORD}
          </div>
        ) : null}
      </AbsoluteFill>
      <PaperGrain opacity={0.3} fibres={false} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 50%, ${NEWS.desk} 120%)` }} />
    </AbsoluteFill>
  );
};
