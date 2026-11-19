import React from "react";
import { Composition, Still } from "remotion";
import { Avatar, Banner } from "./films/test/Brand";
import { StyleReel } from "./films/reel/StyleReel";
import { EvidenceRoom1 } from "./films/evidence-room-1/EvidenceRoom1";
import { TOTAL_FRAMES } from "./films/evidence-room-1/timing";
import { Thumbnail1 } from "./films/series/Thumbnail1";
import { CastHead } from "./films/series/CastHead";
import { CastSheet } from "./films/series/CastSheet";
import { Test10s } from "./films/test/Test10s";
import { FPS, HEIGHT, WIDTH } from "./shared/theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Test10s"
        component={Test10s}
        durationInFrames={10 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="StyleReel"
        component={StyleReel}
        durationInFrames={60 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="EvidenceRoom1"
        component={EvidenceRoom1}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Still id="CastHead" component={CastHead} width={400} height={400} defaultProps={{ who: "curator" as const }} />
      <Still id="Thumbnail1" component={Thumbnail1} width={1280} height={720} />
      <Still id="CastSheet" component={CastSheet} width={WIDTH} height={HEIGHT} />
      <Still id="Avatar" component={Avatar} width={800} height={800} />
      <Still id="Banner" component={Banner} width={2560} height={1440} />
    </>
  );
};
