import React from "react";
import type { ClerkPalette } from "../Clerk";
import type { Who } from "../comic";
import { Player, PlayerProps } from "../Player";
import { LINO } from "../theme";

// The cast in a two-colour linocut. Same drawings (cast.tsx), translated to ink + carved fills + the spot red.
// Lighter colours become more paper (more carving), darker ones more ink. Skin tones keep their relative
// value with stipple density, so the cast still reads as the same four people.

const N = "none";
const BLACK_PLATE: Record<Who, Partial<ClerkPalette>> = {
  curator: { ink: LINO.ink, skin: LINO.paper, coat: "url(#lino-pin)", shirt: LINO.paper, accent: N, lens: LINO.paper, glass: LINO.paper, eye: LINO.ink, hat: LINO.ink, trim: LINO.paper },
  dig: { ink: LINO.ink, skin: "url(#lino-dots-light)", coat: "url(#lino-hatch)", shirt: LINO.paper, accent: LINO.ink, lens: LINO.paper, glass: LINO.paper, eye: LINO.ink, hat: LINO.paper, trim: LINO.ink },
  doubt: { ink: LINO.ink, skin: "url(#lino-dots-dark)", coat: "url(#lino-wave)", shirt: LINO.paper, accent: LINO.ink, lens: LINO.paper, glass: LINO.paper, eye: LINO.ink, hat: LINO.ink, trim: N },
  clerk: { ink: LINO.ink, skin: LINO.paper, coat: "url(#lino-cross)", shirt: LINO.paper, accent: N, lens: LINO.paper, glass: "url(#lino-hatch)", eye: LINO.ink, hat: LINO.ink, trim: LINO.ink },
};
/** What each character prints in red: Doubt's scarf (the signature), the Curator's and Clerk's bow ties. */
const RED_KEYS: Record<Who, (keyof ClerkPalette)[]> = { curator: ["accent"], dig: [], doubt: ["trim"], clerk: ["accent"] };

const blackPlate = (who: Who): Partial<ClerkPalette> => {
  // where the red prints, the black block is cut away: leave clean paper for the red to land on
  const p = { ...BLACK_PLATE[who] };
  for (const k of RED_KEYS[who]) p[k] = LINO.paper;
  return p;
};

const redPlate = (who: Who): Partial<ClerkPalette> => {
  const p: Partial<ClerkPalette> = { ink: N, skin: N, coat: N, shirt: N, accent: N, lens: N, glass: N, eye: N, hat: N, trim: N };
  for (const k of RED_KEYS[who]) p[k] = LINO.red;
  return p;
};

export const LinoActor: React.FC<Omit<PlayerProps, "palette" | "filterId"> & { reg?: [number, number] }> = ({ reg = [5, -4], ...p }) => {
  const sw = p.strokeWidth ?? Math.max(10, (5.4 * 400) / p.width);
  // black plate first, red plate printed over it (multiply: red on paper = red, red on ink = ink), slightly off-register
  return (
    <>
      <Player {...p} strokeWidth={sw} palette={blackPlate(p.who)} filterId="lino-ink" step={p.step ?? 2} autoBlink={false} />
      {RED_KEYS[p.who].length ? (
        <div style={{ position: "absolute", inset: 0, transform: `translate(${reg[0]}px, ${reg[1]}px)`, zIndex: (p.z ?? 10) + 1, mixBlendMode: "multiply", pointerEvents: "none" }}>
          <Player {...p} strokeWidth={sw} palette={redPlate(p.who)} filterId="lino-ink" step={p.step ?? 2} autoBlink={false} />
        </div>
      ) : null}
    </>
  );
};
