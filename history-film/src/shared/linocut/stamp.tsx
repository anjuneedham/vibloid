import React from "react";
import { useCurrentFrame } from "remotion";
import { BANGERS } from "../fonts";
import { rand } from "../Frame";
import { LINO } from "../theme";

/** The verdict stamp: slammed down at `hit` (2 frames in the air, then contact), red ink, double border, splatter. */
export const LinoStamp: React.FC<{ word: string; cx: number; cy: number; w: number; fs: number; hit: number; rot?: number }> = ({ word, cx, cy, w, fs, hit, rot = -8 }) => {
  const frame = useCurrentFrame();
  const t = frame - hit;
  if (t < -3) return null;
  const s = t < -1 ? 2.1 : t < 0 ? 1.45 : t < 2 ? 0.96 : 1;
  const o = t < 0 ? 0.35 : 1;
  const h = fs * 1.5;
  return (
    <div style={{ position: "absolute", left: cx - w / 2, top: cy - h / 2, width: w, height: h, transform: `rotate(${rot}deg) scale(${s})`, opacity: o, zIndex: 80 }}>
      {t >= 0
        ? Array.from({ length: 16 }).map((_, i) => {
            const a = rand(i + 2) * Math.PI * 2;
            const d = w * (0.42 + rand(i + 5) * 0.32);
            const r = 4 + rand(i + 8) * 14;
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: w / 2 + Math.cos(a) * d - r,
                  top: h / 2 + Math.sin(a) * d * 0.55 - r,
                  width: r * 2,
                  height: r * 2,
                  borderRadius: "50%",
                  background: LINO.red,
                  filter: "url(#lino-stamp)",
                }}
              />
            );
          })
        : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          border: `${fs * 0.09}px solid ${LINO.red}`,
          boxShadow: `inset 0 0 0 ${fs * 0.05}px ${LINO.paper}, inset 0 0 0 ${fs * 0.1}px ${LINO.red}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          filter: "url(#lino-stamp)",
        }}
      >
        <div style={{ fontFamily: BANGERS, fontSize: fs, letterSpacing: fs * 0.06, color: LINO.red, lineHeight: 1, paddingTop: fs * 0.08 }}>{word}</div>
      </div>
    </div>
  );
};
