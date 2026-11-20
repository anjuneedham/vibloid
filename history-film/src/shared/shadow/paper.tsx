import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";

const svgUrl = (svg: string) => `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;

const FINE = `<svg xmlns='http://www.w3.org/2000/svg' width='360' height='360'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.25  0 0 0 0 0.17  0 0 0 0 0.08  0 0 0 0.85 0'/></filter><rect width='360' height='360' filter='url(#n)'/></svg>`;
// long soft fibres: stretched noise
const FIBRE = `<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1920'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='0.02 0.05' numOctaves='3' seed='4'/><feColorMatrix values='0 0 0 0 0.3  0 0 0 0 0.2  0 0 0 0 0.1  0 0 0 1.6 -0.62'/></filter><rect width='1920' height='1920' filter='url(#f)'/></svg>`;
// blotchy density: thicker and thinner paper lets more or less light through
const BLOTCH = `<svg xmlns='http://www.w3.org/2000/svg' width='1920' height='1920'><filter id='b'><feTurbulence type='fractalNoise' baseFrequency='0.0035' numOctaves='3' seed='9'/><feColorMatrix values='0 0 0 0 0.2  0 0 0 0 0.1  0 0 0 0 0.03  0 0 0 1.1 -0.35'/></filter><rect width='1920' height='1920' filter='url(#b)'/></svg>`;

/** Paper grain for the backlit screen: blotchy density, fibres and fine tooth. Static (paper does not boil). */
export const PaperGrain: React.FC<{ opacity?: number; fibres?: boolean; film?: number }> = ({ opacity = 0.5, fibres = true, film = 0.06 }) => {
  const frame = useCurrentFrame();
  // a whisper of moving film grain on top so the frame never feels frozen
  const jx = Math.floor((Math.sin(frame * 12.9898) * 43758.5453) % 300);
  const jy = Math.floor((Math.cos(frame * 78.233) * 12345.678) % 300);
  return (
    <>
      <AbsoluteFill style={{ backgroundImage: svgUrl(BLOTCH), backgroundSize: "cover", mixBlendMode: "multiply", opacity: opacity * 0.9, pointerEvents: "none" }} />
      {fibres ? (
        <AbsoluteFill style={{ backgroundImage: svgUrl(FIBRE), backgroundSize: "cover", mixBlendMode: "multiply", opacity: opacity * 0.45, pointerEvents: "none" }} />
      ) : null}
      <AbsoluteFill style={{ backgroundImage: svgUrl(FINE), mixBlendMode: "multiply", opacity: opacity * 0.55, pointerEvents: "none" }} />
      {film > 0 ? (
        <AbsoluteFill
          style={{ backgroundImage: svgUrl(FINE), backgroundPosition: `${jx}px ${jy}px`, mixBlendMode: "overlay", opacity: film, pointerEvents: "none" }}
        />
      ) : null}
    </>
  );
};
