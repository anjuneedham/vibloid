import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { COMIC } from "../../shared/fonts";
import { Letterbox, Wordmark } from "../../shared/Frame";
import { BAR_HEIGHT } from "../../shared/theme";
import { Chalk } from "./Chalk";
import { Comic } from "./Comic";
import { Newspaper } from "./Newspaper";
import { Shadow } from "./Shadow";
import { Stained } from "./Stained";
import { Woodcut } from "./Woodcut";

const SEG = 300; // 10 seconds each

const STYLES: { name: string; use: string; Scene: React.FC }[] = [
  { name: "Woodcut print", use: "plagues, medieval and early modern stories", Scene: Woodcut },
  { name: "Shadow puppets", use: "legends, ghosts and folk tales", Scene: Shadow },
  { name: "Newspaper collage", use: "scandals, wars and modern events", Scene: Newspaper },
  { name: "Stained glass", use: "popes, kings and church history", Scene: Stained },
  { name: "Chalk on a blackboard", use: "timelines, maps and explainers", Scene: Chalk },
  { name: "Comic book panels", use: "battles, chases and big moments", Scene: Comic },
];

const Caption: React.FC<{ index: number; name: string; use: string }> = ({ index, name, use }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [18, 34, SEG - 40, SEG - 24], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 44,
        bottom: BAR_HEIGHT + 20,
        opacity: op,
        transform: `translateY(${(1 - op) * 12}px)`,
        background: "rgba(0,0,0,0.72)",
        borderRadius: 12,
        padding: "10px 22px 12px",
        zIndex: 900,
        fontFamily: COMIC,
        color: "#fff",
        maxWidth: 820,
      }}
    >
      <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 1 }}>
        STYLE {index + 1} OF {STYLES.length} · {name.toUpperCase()}
      </div>
      <div style={{ fontSize: 26, opacity: 0.85 }}>Best for: {use}</div>
    </div>
  );
};

export const StyleReel: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {STYLES.map(({ name, use, Scene }, i) => (
        <Sequence key={name} from={i * SEG} durationInFrames={SEG} premountFor={30}>
          <Scene />
          <Caption index={i} name={name} use={use} />
          <Flash />
        </Sequence>
      ))}
      <Wordmark />
      <Letterbox />
    </AbsoluteFill>
  );
};

const Flash: React.FC = () => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 1, 6], [0, 0.6, 0], { extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: "#fff", opacity: op, zIndex: 950, pointerEvents: "none" }} />;
};
