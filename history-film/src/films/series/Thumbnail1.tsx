import React from "react";
import { Sequence } from "remotion";
import { Actor, Art, BigText, ComicPage, grad, Panel, SpeedLines, StampMark } from "../../shared/comic";
import { MoundG, SeedsG } from "../../shared/props";
import { PAL, THEME } from "../../shared/theme";

/** YouTube thumbnail (1280x720) for The Evidence Room, Part 1. Rendered as a still; frame offset so springs have settled. */
const Inner: React.FC = () => (
  <ComicPage>
    <Panel x={0} y={0} w={1280} h={720} start={0} bg={grad(PAL.sunTop, PAL.sunBottom)}>
      <SpeedLines cx={629} cy={330} inner={120} outer={1100} count={36} color={PAL.burstPale} opacity={0.55} />
      <Art>
        <rect x={0} y={640} width={1258} height={60} fill={PAL.earth} stroke={THEME.ink} strokeWidth={9} />
        <MoundG x={330} y={652} w={600} start={-30} />
        <SeedsG from={-40} x0={440} x1={820} ground={650} peak={90} count={60} />
      </Art>
      <Actor who="dig" x={230} feet={680} width={360} enter={-30} armL={125} armR={-125} browLift={1} wide={1} mouth="o" headTilt={-4} />
      <Actor who="doubt" x={1030} feet={680} width={360} enter={-30} browLift={0.5} browTilt={0.9} headTilt={7} armL={50} armR={-30} />
      <BigText x={0} y={4} w={1258} fs={165} color={THEME.card} rot={-3} stroke={16}>
        TOMB ON TRIAL
      </BigText>
      <StampMark x={290} y={430} w={680} start={-30} text="NOT PROVEN" color={PAL.red} fs={120} rot={-7} />
    </Panel>
  </ComicPage>
);

export const Thumbnail1: React.FC = () => (
  <Sequence from={-60}>
    <Inner />
  </Sequence>
);
