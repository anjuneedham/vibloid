import React from "react";
import { Clerk, ClerkProps } from "./Clerk";
import { THEME } from "./theme";

// The Past Tense cast. Each character has ONE signature look that never changes.

/** THE CURATOR: the host. Tall, plum coat, bowler hat, monocle, moustache. Rules on the evidence. */
export const Curator: React.FC<ClerkProps> = (props) => (
  <Clerk
    hat="bowler"
    glasses="monocle"
    moustache
    mouth="smirk"
    prop={false}
    palette={{
      skin: "#E8CDB0",
      coat: "#6B3A68",
      shirt: "#F4EEDD",
      accent: "#E8B64A",
      hat: "#241F2B",
      trim: "#E8B64A",
    }}
    {...props}
  />
);

/** DIG: the enthusiast. Pith helmet, khaki coat, believes every find. */
export const Dig: React.FC<ClerkProps> = (props) => (
  <Clerk
    hat="pith"
    glasses="none"
    mouth="open"
    browLift={0.5}
    wide={0.3}
    prop={false}
    palette={{
      skin: "#C98E5B",
      coat: "#B8995A",
      shirt: "#F4EEDD",
      accent: "#7A5C2A",
      hat: "#D8C48C",
      trim: "#7A5C2A",
    }}
    {...props}
  />
);

/** DOUBT: the sceptic. Red scarf, sleepy eyes, asks "but how do we know?" */
export const Doubt: React.FC<ClerkProps> = (props) => (
  <Clerk
    glasses="none"
    scarf
    lids={0.8}
    mouth="flat"
    browTilt={0.6}
    prop={false}
    palette={{
      skin: "#8A5A2B",
      coat: "#58607A",
      shirt: "#E9E4D4",
      accent: "#B3261E",
      trim: "#B3261E",
    }}
    {...props}
  />
);

/** THE CLERK: keeps the sources. Round glasses, teal coat, inkwell and quill. */
export const TheClerk: React.FC<ClerkProps> = (props) => <Clerk {...props} />;

export const CAST = [
  { id: "curator", name: "THE CURATOR", role: "Host. Rules on the evidence.", look: "Bowler hat + monocle", Comp: Curator, scaleY: 1.1 },
  { id: "dig", name: "DIG", role: "The enthusiast. Believes every find.", look: "Pith helmet", Comp: Dig, scaleY: 0.92 },
  { id: "doubt", name: "DOUBT", role: "The sceptic. \"But how do we know?\"", look: "Red scarf + sleepy eyes", Comp: Doubt, scaleY: 1.0 },
  { id: "clerk", name: "THE CLERK", role: "Keeps the sources.", look: "Round glasses + inkwell", Comp: TheClerk, scaleY: 1.0 },
] as const;

export const CAST_COLOURS = THEME;
