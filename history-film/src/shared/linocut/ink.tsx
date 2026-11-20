import React from "react";
import { useCurrentFrame } from "remotion";
import { LINO } from "../theme";

// Linocut print: black ink + one spot red on cream paper. These defs must be on the page once (use <LinoDefs />).
// Filters: "lino-ink" (bitten edges + specks where the ink missed), "lino-stamp" (heavier, for the verdict stamp).
// Patterns: the carved fills used for the cast's coats, skin tones, hats and the ground.

export const LinoDefs: React.FC<{ seed?: number }> = ({ seed = 3 }) => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      <filter id="lino-ink" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves={2} seed={seed} result="warp" />
        <feDisplacementMap in="SourceGraphic" in2="warp" scale={5} xChannelSelector="R" yChannelSelector="G" result="bitten" />
        <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves={2} seed={seed + 7} result="speck" />
        <feColorMatrix in="speck" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -14 0 0 0 9.4" result="speckA" />
        <feComposite in="bitten" in2="speckA" operator="in" />
      </filter>
      <filter id="lino-stamp" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={seed + 2} result="warp" />
        <feDisplacementMap in="SourceGraphic" in2="warp" scale={7} xChannelSelector="R" yChannelSelector="G" result="bitten" />
        <feTurbulence type="fractalNoise" baseFrequency="0.09 0.35" numOctaves={3} seed={seed + 11} result="speck" />
        <feColorMatrix in="speck" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -9 0 0 0 6.1" result="speckA" />
        <feComposite in="bitten" in2="speckA" operator="in" />
      </filter>
      {/* carved fills. "ink" patterns = black with white gouges; "paper" patterns = paper with ink marks */}
      <pattern id="lino-pin" width="18" height="18" patternUnits="userSpaceOnUse">
        <rect width="18" height="18" fill={LINO.ink} />
        <path d="M0 9 L18 9" stroke={LINO.paper} strokeWidth="2.4" />
      </pattern>
      <pattern id="lino-hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">
        <rect width="14" height="14" fill={LINO.paper} />
        <path d="M0 0 L0 14" stroke={LINO.ink} strokeWidth="5.5" />
      </pattern>
      <pattern id="lino-wave" width="40" height="22" patternUnits="userSpaceOnUse">
        <rect width="40" height="22" fill={LINO.ink} />
        <path d="M0 12 Q 10 4 20 12 T 40 12" stroke={LINO.paper} strokeWidth="3.2" fill="none" />
      </pattern>
      <pattern id="lino-cross" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="16" height="16" fill={LINO.paper} />
        <path d="M0 0 L0 16 M0 0 L16 0" stroke={LINO.ink} strokeWidth="4.5" />
      </pattern>
      <pattern id="lino-dots-light" width="13" height="13" patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
        <rect width="13" height="13" fill={LINO.paper} />
        <circle cx="6.5" cy="6.5" r="1.9" fill={LINO.ink} />
      </pattern>
      <pattern id="lino-dots-dark" width="11" height="11" patternUnits="userSpaceOnUse" patternTransform="rotate(20)">
        <rect width="11" height="11" fill={LINO.paper} />
        <circle cx="5.5" cy="5.5" r="2.7" fill={LINO.ink} />
      </pattern>
      <pattern id="lino-gouge" width="60" height="26" patternUnits="userSpaceOnUse">
        <rect width="60" height="26" fill={LINO.ink} />
        <path d="M6 18 Q 28 4 52 16" stroke={LINO.paper} strokeWidth="3" fill="none" strokeLinecap="round" />
      </pattern>
      <pattern id="lino-red-gouge" width="60" height="26" patternUnits="userSpaceOnUse">
        <rect width="60" height="26" fill={LINO.red} />
        <path d="M6 18 Q 28 4 52 16" stroke={LINO.paper} strokeWidth="3" fill="none" strokeLinecap="round" />
      </pattern>
    </defs>
  </svg>
);

/** Print rhythm: everything moves on twos (or threes), like successive pulls of a print. */
export const useStepped = (step = 2) => {
  const f = useCurrentFrame();
  return Math.floor(f / step) * step;
};

/**
 * Mis-registration between the black and the red plate for this "pull". Changes only on hard cuts
 * (pass the beat index), never per frame, so it reads as print, not as glitch.
 */
export const regOffset = (pull: number): [number, number] => {
  const a = pull * 2.399 + 0.7;
  return [Math.round(Math.cos(a) * 6), Math.round(Math.sin(a) * 5)];
};

/** A print-thump: the whole sheet jolts when a stamp lands. Returns a CSS transform. */
export const useThump = (hit: number, strength = 1) => {
  const f = useCurrentFrame();
  const t = f - hit;
  if (t < 0 || t > 12) return "none";
  const k = (1 - t / 12) * strength;
  const x = Math.round(Math.sin(t * 3.1) * 14 * k);
  const y = Math.round(Math.cos(t * 2.3) * 18 * k);
  const s = 1 + 0.025 * k;
  return `translate(${x}px, ${y}px) scale(${s})`;
};
