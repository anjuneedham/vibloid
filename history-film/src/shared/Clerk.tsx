import React from "react";
import { useCurrentFrame } from "remotion";
import { THEME } from "./theme";

export type ClerkPalette = {
  ink: string; // outlines and arms
  skin: string;
  coat: string;
  shirt: string;
  accent: string; // bow tie
  lens: string; // glasses lens fill
  glass: string; // inkwell glass
  eye: string;
  hat: string;
  trim: string; // hat band / scarf
};

export const CLERK_PALETTE: ClerkPalette = {
  ink: THEME.ink,
  skin: "#EFD9C0",
  coat: "#3E6F7A",
  shirt: "#F4EEDD",
  accent: "#C9382F",
  lens: "rgba(255,255,255,0.22)",
  glass: "#6FB6D9",
  eye: THEME.ink,
  hat: "#2A2530",
  trim: "#C9A24A",
};

export type Mouth = "flat" | "smile" | "frown" | "open" | "o" | "smirk";

export type ClerkProps = {
  palette?: Partial<ClerkPalette>;
  strokeWidth?: number;
  /** -1 sad / worried ... 0 neutral ... +1 angry / suspicious */
  browTilt?: number;
  /** -1 low ... +1 high (shock) */
  browLift?: number;
  /** 0 normal eyes ... 1 wide shocked eyes */
  wide?: number;
  eyesClosed?: boolean;
  mouth?: Mouth;
  armL?: number;
  armR?: number;
  headTilt?: number;
  headDrop?: number;
  prop?: boolean;
  idle?: boolean;
  autoBlink?: boolean;
  /** 0..1 draws the outlines on (chalk / line-art mode). Omit for fully drawn. */
  draw?: number;
  /** only the head and shoulders */
  headOnly?: boolean;
  glasses?: "round" | "monocle" | "none";
  hat?: "none" | "bowler" | "pith" | "cap";
  moustache?: boolean;
  scarf?: boolean;
  /** 0 = open dot eyes ... 1 = heavy sleepy lids */
  lids?: number;
  filterId?: string;
  width?: number;
  style?: React.CSSProperties;
};

export const Clerk: React.FC<ClerkProps> = ({
  palette,
  strokeWidth = 9,
  browTilt = 0,
  browLift = 0,
  wide = 0,
  eyesClosed = false,
  mouth = "flat",
  armL = 4,
  armR = -4,
  headTilt = 0,
  headDrop = 0,
  prop = true,
  idle = true,
  autoBlink = true,
  draw,
  headOnly = false,
  glasses = "round",
  hat = "none",
  moustache = false,
  scarf = false,
  lids = 0,
  filterId,
  width = 400,
  style,
}) => {
  const frame = useCurrentFrame();
  const p = { ...CLERK_PALETTE, ...palette };
  const sw = strokeWidth;

  const breath = idle ? 1 + 0.012 * Math.sin(frame / 14) : 1;
  const bob = idle ? Math.sin(frame / 14 + 0.8) * 2.2 : 0;
  const blinkPhase = frame % 118;
  const blinking = autoBlink && blinkPhase > 112;
  const closed = eyesClosed || blinking;

  const drawing = draw !== undefined && draw < 1;
  const detailOp = draw === undefined ? 1 : Math.min(1, Math.max(0, (draw - 0.75) / 0.15));
  const sp = (extra?: React.SVGProps<SVGPathElement>) =>
    ({
      stroke: p.ink,
      strokeWidth: sw,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      ...(draw !== undefined
        ? {
            pathLength: 1,
            strokeDasharray: drawing ? 1 : undefined,
            strokeDashoffset: drawing ? 1 - Math.max(0, draw) : undefined,
          }
        : {}),
      ...extra,
    }) as React.SVGProps<SVGPathElement>;

  const eyeY = 205;
  const eyeR = 9 - 3.5 * wide;
  const lensFill = wide > 0.5 ? "#FFFFFF" : p.lens;
  const browY = 150 - browLift * 16;
  const tilt = browTilt * 15;

  const mouthPath: Record<Mouth, string> = {
    flat: "M178 264 L222 264",
    smile: "M172 258 Q200 282 228 258",
    frown: "M176 272 Q200 252 224 272",
    open: "M178 258 Q200 292 222 258 Q200 252 178 258 Z",
    o: "M192 258 Q200 252 208 258 Q212 272 200 274 Q188 272 192 258 Z",
    smirk: "M178 266 Q205 268 226 254",
  };

  return (
    <svg
      viewBox={headOnly ? "40 50 320 290" : "0 0 400 620"}
      width={width}
      height={headOnly ? (width * 290) / 320 : (width * 620) / 400}
      style={{ overflow: "visible", ...style }}
    >
      <g filter={filterId ? `url(#${filterId})` : undefined}>
        {/* legs */}
        <path d="M165 556 L160 604 L132 608" fill="none" {...sp({ strokeWidth: sw * 1.2 })} />
        <path d="M235 556 L240 604 L268 608" fill="none" {...sp({ strokeWidth: sw * 1.2 })} />

        {/* body + arms (breathing) */}
        <g transform={`translate(0 560) scale(1 ${breath}) translate(0 -560)`}>
          <path
            d="M122 330 Q108 450 92 560 Q200 582 308 560 Q292 450 278 330 Q200 302 122 330 Z"
            fill={p.coat}
            {...sp()}
          />
          {/* collar + bow tie */}
          <path d="M172 322 L200 372 L228 322 Z" fill={p.shirt} {...sp({ strokeWidth: sw * 0.7 })} />
          <path
            d="M200 352 L182 342 L182 366 Z M200 352 L218 342 L218 366 Z"
            fill={p.accent}
            {...sp({ strokeWidth: sw * 0.55 })}
          />
          {scarf ? (
            <>
              <path d="M142 318 Q 200 356 258 318 L 266 346 Q 200 384 134 346 Z" fill={p.trim} {...sp({ strokeWidth: sw * 0.7 })} />
              <path d="M226 352 L 250 440 L 214 432 L 208 362 Z" fill={p.trim} {...sp({ strokeWidth: sw * 0.7 })} />
            </>
          ) : null}
          {/* buttons */}
          <circle cx={200} cy={420} r={4} fill={p.ink} opacity={detailOp} />
          <circle cx={200} cy={470} r={4} fill={p.ink} opacity={detailOp} />

          {/* left arm */}
          <g transform={`translate(128 346) rotate(${armL})`}>
            <path d="M0 0 Q -38 70 -24 142" fill="none" {...sp({ strokeWidth: sw * 1.5 })} />
          </g>
          {/* right arm + inkwell */}
          <g transform={`translate(272 346) rotate(${armR})`}>
            <path d="M0 0 Q 38 70 24 142" fill="none" {...sp({ strokeWidth: sw * 1.5 })} />
            {prop ? (
              <g transform="translate(24 142)">
                <path
                  d="M-15 -2 L15 -2 L19 30 L-19 30 Z"
                  fill={p.glass}
                  {...sp({ strokeWidth: sw * 0.6 })}
                />
                <path d="M-6 -2 L-6 -10 L6 -10 L6 -2" fill={p.ink} {...sp({ strokeWidth: sw * 0.5 })} />
                <path d="M2 -10 Q 22 -38 40 -58" fill="none" {...sp({ strokeWidth: sw * 0.55 })} />
                <path d="M40 -58 Q 52 -78 34 -84 Q 36 -66 40 -58 Z" fill={p.shirt} {...sp({ strokeWidth: sw * 0.4 })} />
              </g>
            ) : null}
          </g>
        </g>

        {/* head */}
        <g transform={`translate(0 ${headDrop + bob}) rotate(${headTilt} 200 300)`}>
          {/* hair wisps */}
          {hat === "none" ? (
            <>
              <path d="M178 92 Q 172 62 196 60" fill="none" {...sp({ strokeWidth: sw * 0.8 })} />
              <path d="M214 90 Q 226 66 244 74" fill="none" {...sp({ strokeWidth: sw * 0.8 })} />
            </>
          ) : null}
          <path
            d="M70 205 C 70 115, 140 85, 205 88 C 275 90, 335 120, 332 200 C 330 270, 275 305, 200 305 C 125 305, 72 275, 70 205 Z"
            fill={p.skin}
            {...sp()}
          />
          {/* glasses */}
          {glasses === "round" ? (
            <>
              <circle cx={150} cy={eyeY} r={34} fill={lensFill} {...(sp() as object)} strokeWidth={sw * 0.75} />
              <circle cx={250} cy={eyeY} r={34} fill={lensFill} {...(sp() as object)} strokeWidth={sw * 0.75} />
              <path d="M184 202 Q200 194 216 202" fill="none" {...sp({ strokeWidth: sw * 0.7 })} />
              <path d="M116 200 L82 194" fill="none" {...sp({ strokeWidth: sw * 0.6 })} />
              <path d="M284 200 L318 194" fill="none" {...sp({ strokeWidth: sw * 0.6 })} />
            </>
          ) : null}
          {glasses === "monocle" ? (
            <>
              <circle cx={250} cy={eyeY} r={36} fill={lensFill} {...(sp() as object)} strokeWidth={sw * 0.7} />
              <path d="M284 222 Q 318 262 300 330" fill="none" {...sp({ strokeWidth: sw * 0.4 })} />
            </>
          ) : null}
          {/* eyes */}
          {closed ? (
            <>
              <path d="M136 208 Q150 220 164 208" fill="none" {...sp({ strokeWidth: sw * 0.6 })} />
              <path d="M236 208 Q250 220 264 208" fill="none" {...sp({ strokeWidth: sw * 0.6 })} />
            </>
          ) : (
            <>
              {lids > 0.3 ? (
                [152, 248].map((ex) => (
                  <g key={ex} opacity={detailOp}>
                    <path d={`M${ex - eyeR} ${eyeY + 2} L${ex + eyeR} ${eyeY + 2} A${eyeR} ${eyeR} 0 0 1 ${ex - eyeR} ${eyeY + 2} Z`} fill={p.eye} />
                    <line x1={ex - eyeR - 5} y1={eyeY + 2} x2={ex + eyeR + 5} y2={eyeY + 2} stroke={p.ink} strokeWidth={sw * 0.55} strokeLinecap="round" />
                  </g>
                ))
              ) : (
                <>
                  <circle cx={152} cy={eyeY + 2} r={eyeR} fill={p.eye} opacity={detailOp} />
                  <circle cx={248} cy={eyeY + 2} r={eyeR} fill={p.eye} opacity={detailOp} />
                </>
              )}
            </>
          )}
          {/* brows */}
          <path
            d={`M114 ${browY} L178 ${browY + tilt}`}
            fill="none"
            {...sp({ strokeWidth: sw * 0.8 })}
          />
          <path
            d={`M222 ${browY + tilt} L286 ${browY}`}
            fill="none"
            {...sp({ strokeWidth: sw * 0.8 })}
          />
          {/* nose + mouth */}
          <path d="M197 232 Q 205 246 213 238" fill="none" {...sp({ strokeWidth: sw * 0.5 })} />
          <path
            d={mouthPath[mouth]}
            fill={mouth === "open" || mouth === "o" ? p.ink : "none"}
            {...sp({ strokeWidth: sw * 0.6 })}
          />
          {moustache ? (
            <path
              d="M164 246 Q 182 230 200 242 Q 218 230 236 246 Q 218 256 200 250 Q 182 256 164 246 Z"
              fill={p.ink}
              {...sp({ strokeWidth: sw * 0.3 })}
            />
          ) : null}
          {hat === "bowler" ? (
            <>
              <path d="M112 126 Q 116 18 200 12 Q 284 18 288 126 Z" fill={p.hat} {...sp()} />
              <path d="M76 130 Q 200 158 324 130 Q 336 114 302 112 L98 112 Q 64 114 76 130 Z" fill={p.hat} {...sp()} />
              <path d="M116 100 Q 200 116 284 100" fill="none" {...sp({ strokeWidth: sw * 0.9, stroke: p.trim })} />
            </>
          ) : null}
          {hat === "pith" ? (
            <>
              <path d="M96 128 Q 100 22 200 16 Q 300 22 304 128 Z" fill={p.hat} {...sp()} />
              <path d="M54 134 Q 200 168 346 134 Q 334 112 300 112 L100 112 Q 66 112 54 134 Z" fill={p.hat} {...sp()} />
              <path d="M104 104 Q 200 122 296 104" fill="none" {...sp({ strokeWidth: sw * 0.9, stroke: p.trim })} />
              <circle cx={200} cy={18} r={7} fill={p.trim} {...(sp() as object)} strokeWidth={sw * 0.4} />
            </>
          ) : null}
          {hat === "cap" ? (
            <>
              <path d="M100 122 Q 104 40 196 34 Q 290 38 298 122 Z" fill={p.hat} {...sp()} />
              <path d="M100 122 Q 48 122 36 140 Q 90 148 150 128 Z" fill={p.hat} {...sp()} />
              <path d="M104 104 Q 200 118 296 104" fill="none" {...sp({ strokeWidth: sw * 0.6, stroke: p.trim })} />
            </>
          ) : null}
        </g>
      </g>
    </svg>
  );
};
