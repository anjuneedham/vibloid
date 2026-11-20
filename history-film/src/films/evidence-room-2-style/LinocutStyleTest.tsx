import React from "react";
import { AbsoluteFill } from "remotion";
import { BANGERS } from "../../shared/fonts";
import { momentFromSeconds } from "../../shared/moment";
import { FPS, LINO } from "../../shared/theme";
import { LinoMoment } from "./LinoMoment";
import { LINO_TEST } from "./timing";

const T = momentFromSeconds(LINO_TEST.lines, LINO_TEST.hit, LINO_TEST.seconds, FPS, 0.05);
export const LINO_TEST_FRAMES = T.end;

/** Episode 2 Shorts look test: linocut print, 1080 x 1920. Content stays left of x=920 and above y=1540. No audio. */
export const LinocutStyleTest: React.FC = () => (
  <AbsoluteFill style={{ background: LINO.paper }}>
    <LinoMoment t={T} />
    {/* wordmark, top-left as in the Part 1 Short */}
    <div style={{ position: "absolute", left: 64, top: 64, fontFamily: BANGERS, fontSize: 44, letterSpacing: 2, color: LINO.ink, zIndex: 900, filter: "url(#lino-ink)" }}>
      PAST <span style={{ color: LINO.red }}>TENSE</span>
    </div>
  </AbsoluteFill>
);
