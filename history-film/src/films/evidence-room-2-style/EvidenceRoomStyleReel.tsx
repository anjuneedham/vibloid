import React from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame } from "remotion";
import { BANGERS, COMIC } from "../../shared/fonts";
import { Letterbox, Wordmark } from "../../shared/Frame";
import { evenMoment } from "../../shared/moment";
import { BAR_HEIGHT, FPS, SHADOW } from "../../shared/theme";
import { LinoMoment } from "./LinoMoment";
import { ManuscriptMoment } from "./ManuscriptMoment";
import { NewsMoment } from "./NewsMoment";
import { ShadowMoment } from "./ShadowMoment";

// The same Evidence Room moment (Curator opens, Dig claims, Doubt objects, Clerk's source, verdict stamp),
// restaged in four non-comic looks. The cast is unchanged in every one. Options for the owner to choose from.

export const REEL_SEG = 9 * FPS;
const T = evenMoment(9, FPS);

const STYLES: { name: string; use: string; Scene: React.FC }[] = [
  { name: "Lantern-lit shadow theatre", use: "the 5-minute film (recommended)", Scene: () => <ShadowMoment t={T} /> },
  { name: "Linocut two-colour print", use: "the 1-minute Short (recommended)", Scene: () => <LinoMoment t={T} /> },
  { name: "Illuminated manuscript", use: "medieval sources, legends, kings", Scene: () => <ManuscriptMoment t={T} /> },
  { name: "Newspaper evidence board", use: "modern claims, hoaxes, scandals", Scene: () => <NewsMoment t={T} /> },
];
export const REEL_FRAMES = REEL_SEG * STYLES.length;

const Caption: React.FC<{ index: number; name: string; use: string }> = ({ index, name, use }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [10, 22, REEL_SEG - 26, REEL_SEG - 12], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        right: 40,
        top: BAR_HEIGHT + 20,
        opacity: op,
        background: SHADOW.plate,
        boxShadow: `inset 0 0 0 2px ${SHADOW.brass}`,
        padding: "10px 22px 12px",
        zIndex: 900,
        fontFamily: COMIC,
        color: SHADOW.text,
        textAlign: "right",
      }}
    >
      <div style={{ fontFamily: BANGERS, fontSize: 34, letterSpacing: 2, color: SHADOW.brass }}>
        STYLE {index + 1} OF {STYLES.length} · {name.toUpperCase()}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>Best for: {use}</div>
    </div>
  );
};

export const EvidenceRoomStyleReel: React.FC = () => (
  <AbsoluteFill style={{ background: SHADOW.room }}>
    {STYLES.map(({ name, use, Scene }, i) => (
      <Sequence key={name} from={i * REEL_SEG} durationInFrames={REEL_SEG} premountFor={20} name={name}>
        <Scene />
        <Caption index={i} name={name} use={use} />
      </Sequence>
    ))}
    <Letterbox />
    <Wordmark bottom={10} zIndex={1100} />
  </AbsoluteFill>
);
