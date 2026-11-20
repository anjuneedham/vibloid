import React from "react";
import { AbsoluteFill } from "remotion";
import { Letterbox, Wordmark } from "../../shared/Frame";
import { momentFromSeconds } from "../../shared/moment";
import { FPS, SHADOW } from "../../shared/theme";
import { ShadowMoment } from "./ShadowMoment";
import { SHADOW_TEST } from "./timing";

const T = momentFromSeconds(SHADOW_TEST.lines, SHADOW_TEST.hit, SHADOW_TEST.seconds, FPS);
export const SHADOW_TEST_FRAMES = T.end;

/** Episode 2 long-film look test: lantern-lit shadow theatre. No audio. */
export const ShadowStyleTest: React.FC = () => (
  <AbsoluteFill style={{ background: SHADOW.room }}>
    <ShadowMoment t={T} place={[Math.round(SHADOW_TEST.place[0] * FPS), Math.round(SHADOW_TEST.place[1] * FPS)]} />
    <Letterbox />
    <Wordmark bottom={10} zIndex={1100} />
  </AbsoluteFill>
);
