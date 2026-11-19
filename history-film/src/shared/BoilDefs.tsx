import React from "react";
import { useCurrentFrame } from "remotion";
import { FPS } from "./theme";

// Hand-drawn "line boil": the wobble pattern re-seeds a few times per second.
// Use with style={{ filter: `url(#${id})` }} on any element or SVG group.
export const BoilDefs: React.FC<{
  id?: string;
  scale?: number;
  rate?: number;
  frequency?: number;
}> = ({ id = "boil", scale = 5, rate = 10, frequency = 0.015 }) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / (FPS / rate)) % 1000;
  return (
    <svg width={0} height={0} style={{ position: "absolute" }}>
      <defs>
        <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency={frequency}
            numOctaves={2}
            seed={seed}
            result="n"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="n"
            scale={scale}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
};
