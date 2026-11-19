import React from "react";
import { AbsoluteFill } from "remotion";
import { BoilDefs } from "../../shared/BoilDefs";
import { Curator, Dig, Doubt, TheClerk } from "../../shared/cast";

const HEADS = { curator: Curator, dig: Dig, doubt: Doubt, clerk: TheClerk } as const;

/** One cast member's head on a transparent background (used for avatars, e.g. the recording script page). */
export const CastHead: React.FC<{ who: keyof typeof HEADS }> = ({ who }) => {
  const Comp = HEADS[who];
  return (
    <AbsoluteFill>
      <BoilDefs id="boil" scale={4} rate={8} />
      <div style={{ position: "absolute", left: 0, top: 24 }}>
        <Comp width={400} headOnly filterId="boil" strokeWidth={11} autoBlink={false} idle={false} mouth={who === "doubt" ? "flat" : "smile"} />
      </div>
    </AbsoluteFill>
  );
};
