import React from "react";
import { AbsoluteFill } from "remotion";
import { BoilDefs } from "../../shared/BoilDefs";
import { CAST } from "../../shared/cast";
import { EvidenceRoom } from "../../shared/EvidenceRoom";
import { BANGERS, COMIC } from "../../shared/fonts";
import { Letterbox, Vignette } from "../../shared/Frame";
import { THEME } from "../../shared/theme";

const FLOOR = 880;
const W = 330;

export const CastSheet: React.FC = () => (
  <AbsoluteFill>
    <EvidenceRoom floorY={FLOOR} />
    <BoilDefs id="boil" scale={5} rate={10} />
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 62,
        width: "100%",
        textAlign: "center",
        fontFamily: BANGERS,
        fontSize: 84,
        letterSpacing: 6,
        color: THEME.card,
        WebkitTextStroke: `12px ${THEME.ink}`,
        paintOrder: "stroke fill",
        zIndex: 20,
      }}
    >
      THE EVIDENCE ROOM: CAST
    </div>
    {CAST.map(({ id, name, role, look, Comp, scaleY }, i) => {
      const cx = 360 + i * 400;
      const h = (W * 620) / 400;
      return (
        <React.Fragment key={id}>
          <div
            style={{
              position: "absolute",
              left: cx - W / 2,
              top: FLOOR - h * (606 / 620),
              transform: `scaleY(${scaleY})`,
              transformOrigin: "50% 98%",
            }}
          >
            <Comp width={W} filterId="boil" strokeWidth={9} />
          </div>
          <div
            style={{
              position: "absolute",
              left: cx - 190,
              top: FLOOR + 22,
              width: 380,
              textAlign: "center",
              zIndex: 20,
            }}
          >
            <div style={{ fontFamily: BANGERS, fontSize: 46, color: THEME.card, letterSpacing: 3 }}>{name}</div>
            <div style={{ fontFamily: COMIC, fontWeight: 700, fontSize: 24, color: "#fff", lineHeight: 1.15 }}>{role}</div>
            <div style={{ fontFamily: COMIC, fontSize: 22, color: THEME.candle }}>{look}</div>
          </div>
        </React.Fragment>
      );
    })}
    <Vignette strength={0.7} />
    <Letterbox />
  </AbsoluteFill>
);
