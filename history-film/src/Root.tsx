import React from "react";
import { Composition, Still } from "remotion";
import { Avatar, Banner } from "./films/test/Brand";
import { StyleReel } from "./films/reel/StyleReel";
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
      <Still id="Avatar" component={Avatar} width={800} height={800} />
      <Still id="Banner" component={Banner} width={2560} height={1440} />
    </>
  );
};
