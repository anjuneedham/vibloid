import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { BANGERS, COMIC } from "../fonts";
import type { Span } from "../moment";
import { BAR_HEIGHT, SHADOW } from "../theme";

// Speech, source and place type for the shadow theatre. Same type family as the series (Bangers + Comic Neue),
// set small and calm in lower-third plates instead of bubbles.

const SPEAKER: Record<string, { name: string; accent: string }> = {
  curator: { name: "THE CURATOR", accent: SHADOW.brass },
  dig: { name: "DIG", accent: SHADOW.gelAmber },
  doubt: { name: "DOUBT", accent: SHADOW.thread },
  clerk: { name: "THE CLERK", accent: SHADOW.gelTeal },
};

const fade = (frame: number, span: Span, inF = 9, outF = 7) =>
  interpolate(frame, [span[0] - 2, span[0] + inF, span[1], span[1] + outF], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

/** Lower-third cartouche: a dark plate with a brass rule, the speaker's name on a tab, the line typeset below. */
export const Cartouche: React.FC<{ who: string; text: string; span: Span; width?: number; fs?: number; bottom?: number }> = ({
  who,
  text,
  span,
  width = 1180,
  fs = 46,
  bottom = BAR_HEIGHT + 30,
}) => {
  const frame = useCurrentFrame();
  const o = fade(frame, span);
  if (o <= 0) return null;
  const sp = SPEAKER[who] ?? { name: who.toUpperCase(), accent: SHADOW.brass };
  // words settle in one after another, like type being set
  const words = text.split(" ");
  const per = Math.max(1.2, Math.min(3, (span[1] - span[0]) / (words.length * 2.2)));
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: bottom - (1 - o) * 10,
        width,
        transform: "translateX(-50%)",
        opacity: o,
        zIndex: 600,
      }}
    >
      <div
        style={{
          position: "relative",
          background: `linear-gradient(180deg, ${SHADOW.plate} 0%, ${SHADOW.plate} 100%)`,
          boxShadow: `inset 0 0 0 2px ${SHADOW.brassDark}, inset 0 0 0 7px ${SHADOW.plate}, inset 0 0 0 8px ${SHADOW.brass}, 0 10px 40px ${SHADOW.shade}`,
          padding: "30px 56px 24px",
          textAlign: "center",
          borderRadius: 4,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 40,
            top: -24,
            background: SHADOW.room,
            boxShadow: `inset 0 0 0 2px ${sp.accent}`,
            padding: "6px 18px 2px",
            fontFamily: BANGERS,
            fontSize: 30,
            letterSpacing: 3,
            color: sp.accent,
            lineHeight: 1.1,
          }}
        >
          {sp.name}
        </div>
        <div style={{ fontFamily: COMIC, fontWeight: 700, fontSize: fs, lineHeight: 1.22, color: SHADOW.text, textShadow: `0 2px 8px ${SHADOW.room}` }}>
          {words.map((w, i) => {
            const wo = interpolate(frame, [span[0] + i * per, span[0] + i * per + 6], [0.15, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            return (
              <span key={i} style={{ opacity: wo }}>
                {w}
                {i < words.length - 1 ? " " : ""}
              </span>
            );
          })}
        </div>
        {/* brass end studs */}
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

/** SOURCE tag (series rule: on every beat). Top-left, under the letterbox bar. */
export const ShadowSourceTag: React.FC<{ text: string; span?: Span; left?: number; top?: number; fs?: number; maxWidth?: number }> = ({
  text,
  span = [0, 1e9],
  left = 48,
  top = BAR_HEIGHT + 24,
  fs = 24,
  maxWidth = 900,
}) => {
  const frame = useCurrentFrame();
  const o = fade(frame, [span[0] + 6, span[1]], 12, 6);
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        maxWidth,
        opacity: o * 0.95,
        zIndex: 600,
        background: SHADOW.plate,
        boxShadow: `inset 3px 0 0 ${SHADOW.brass}`,
        padding: "7px 16px 8px 18px",
        fontFamily: COMIC,
        fontWeight: 700,
        fontSize: fs,
        lineHeight: 1.2,
        color: SHADOW.text,
      }}
    >
      <span style={{ fontFamily: BANGERS, letterSpacing: 2, color: SHADOW.brass, marginRight: 10 }}>SOURCE</span>
      {text}
    </div>
  );
};

/** Place and date, bottom-left above the bar (CLAUDE.md TEXT rule). */
export const PlaceTag: React.FC<{ place: string; sub?: string; span: Span }> = ({ place, sub, span }) => {
  const frame = useCurrentFrame();
  const o = fade(frame, span, 14, 10);
  return (
    <div style={{ position: "absolute", left: 60, bottom: BAR_HEIGHT + 34, opacity: o, zIndex: 600, transform: `translateY(${(1 - o) * 8}px)` }}>
      <div style={{ fontFamily: BANGERS, fontSize: 54, letterSpacing: 4, color: SHADOW.text, textShadow: `0 3px 14px ${SHADOW.room}, 0 0 2px ${SHADOW.room}` }}>{place}</div>
      {sub ? (
        <div style={{ fontFamily: COMIC, fontWeight: 700, fontSize: 28, color: SHADOW.textDim, textShadow: `0 2px 10px ${SHADOW.room}`, marginTop: -4 }}>{sub}</div>
      ) : null}
    </div>
  );
};
