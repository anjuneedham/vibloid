import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { Letterbox, Wordmark } from "../../shared/Frame";
import { PAL } from "../../shared/theme";
import { Beat1, Beat2, Beat3, Beat4 } from "./beats1to4";
import { Beat5, Beat6, Beat7, Beat8, Beat9 } from "./beats5to9";
import { BEAT_ORDER, beatLengthFrames, beatStartFrame, BeatId, HAS_VOICEOVER, VOICEOVER_FILE } from "./timing";

const BEAT_COMPONENTS: Record<BeatId, React.FC> = {
  b1: Beat1,
  b2: Beat2,
  b3: Beat3,
  b4: Beat4,
  b5: Beat5,
  b6: Beat6,
  b7: Beat7,
  b8: Beat8,
  b9: Beat9,
};

/** The Evidence Room, Part 1: The Siberian Tomb. Every beat is one comic page. Hard cuts between pages. */
export const EvidenceRoom1: React.FC = () => (
  <AbsoluteFill style={{ background: PAL.black }}>
    {BEAT_ORDER.map((id) => {
      const Comp = BEAT_COMPONENTS[id];
      return (
        <Sequence key={id} from={beatStartFrame(id)} durationInFrames={beatLengthFrames(id)} name={id}>
          <Comp />
        </Sequence>
      );
    })}
    {HAS_VOICEOVER ? <Audio src={staticFile(VOICEOVER_FILE)} /> : null}
    <Letterbox />
    <Wordmark bottom={10} zIndex={1100} />
  </AbsoluteFill>
);
