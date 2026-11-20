# The Evidence Room, Episode 2+: art bible (OPTIONS, pending the owner's choice)

Status: style tests only. The script and voiceover for Episode 2 (Caerleon) do not exist yet; every line on screen is a placeholder (`src/shared/moment.ts`). Nothing here is a verified claim.

**The cast is unchanged.** The Curator, Dig, Doubt and the Clerk are drawn exactly as in `src/shared/cast.tsx` (same thick boiling ink outline, potato heads, dot eyes, signature items). What changes is the WORLD around them: light, sets, texture, camera, type, transitions, verdict stamp. Comic panels are Part 1 only.

Recommendation: **shadow theatre for the 5-minute film, linocut for the 1-minute Short.** Manuscript and newspaper board are kept as alternatives in the reel.

| What | Composition | Code | Preview |
|---|---|---|---|
| Long film look | `ShadowStyleTest` (1920x1080, 14.4 s) | `src/films/evidence-room-2-style/ShadowMoment.tsx`, `src/shared/shadow/*` | `previews/shadow-style-test.mp4` |
| Short look | `LinocutStyleTest` (1080x1920, 10 s) | `src/films/evidence-room-2-style/LinoMoment.tsx`, `src/shared/linocut/*` | `previews/linocut-style-test.mp4` |
| All four options | `EvidenceRoomStyleReel` (1920x1080, 36 s, 9 s each) | `src/films/evidence-room-2-style/EvidenceRoomStyleReel.tsx` | `previews/evidence-room-style-reel.mp4` |

Colours: `SHADOW`, `LINO`, `MANU`, `NEWS` in `src/shared/theme.ts`. Type: the series family is unchanged (Bangers for names, stamps and headlines; Comic Neue for lines and source tags).

---

## A. LANTERN-LIT SHADOW THEATRE (long film)

A layered paper diorama in front of a backlit paper screen. Calm, cinematic, warm.

**Palette.** Screen: `screenHot` > `screenWarm` > `screenAmber` > `screenDeep` > `screenEdge`. Cut-outs `cut` (near) and `cutMid` (far). Rim light `rim`. Accents only: `brass` (pins, cartouche rules, Curator), `thread` red (string, Doubt), `gelTeal` (Clerk, night), `gelRose` (verdict). Night exteriors use the moonlit screen (`nightHot` > `nightEdge`, `<Screen moon />`) with ONE warm pool for contrast; never multiply teal over amber (it goes olive).

**Light rules.**
- One lamp per shot. Its hot spot on the screen is off-centre (default upper left) and everything is lit from that side: cut-outs get a rim on the lamp side (`Cutout` rim pass), the cast gets a rim (`ShadowActor` drop-shadow) and throws a soft, bigger shadow onto the screen on the far side.
- Flicker is slow value-noise (`flickerAt`), max ~6 % brightness. Never strobe.
- `Bloom` over the stack (halation past cut edges), `BeamDust` brightest near the lamp, `Moths` only when a lamp is in frame (their soft shadows cross the screen).
- Finish every shot with a tissue `Gel` (amber default, teal for objections and night, rose after the verdict), `PaperGrain`, `LampVignette`.

**Depth / parallax.** `Stage` + `Layer depth`: 0.05-0.1 screen, 0.15-0.3 far set (blur 2-4 px, `cutMid`), 0.45-0.7 mid set (board, lamp, buildings), 1.0 focal plane (floor + cast), 1.2-1.5 foreground (blur 6-8 px, out-of-focus chair, tassel, hawthorn). Cast always on depth 1.

**Motion rules.** Slow pushes (zoom 1.00 to 1.06-1.10 over the shot) and gentle pans (60-180 px). Hold 5-10 s on explaining lines. Two-shots lean the camera toward the speaker (about 70 px, 20 frames, sine ease) instead of cutting. Hard cuts only between places and on punchlines. Cast: gentle sway (0.4-0.8 deg), lip-flap only while their cartouche is up, a thin control rod below each figure.

**Type.** Lines in a lower-third `Cartouche` (dark plate, brass rule, name tab in the character's accent, words settle in one by one). `ShadowSourceTag` top-left on EVERY beat. `PlaceTag` bottom-left when the story moves.

**Per character (treatment only, drawing unchanged).**
- THE CURATOR: bowler, monocle, moustache. Brass name tab. Best lit three-quarter from the lamp so the monocle reads.
- DIG: pith helmet. Amber name tab. Arms up, small bounce on claims.
- DOUBT: red scarf, sleepy lids. Red name tab. Head tilt 6-8 deg; the shot's gel shifts to teal while he objects.
- THE CLERK: round glasses, inkwell. Teal name tab. Raises the inkwell arm when a slide comes in.

**Beat staging.**
- CLAIM (Dig): Evidence Room two-shot, lamp centre, camera on Dig, amber gel.
- OBJECTION (Doubt): same shot, camera leans to Doubt, gel cools to teal.
- SOURCES (Clerk): Clerk left, `LanternSlide` slides into the carrier right (slide-in 16 f, focus pull 20 f) with drawn art (`ManuscriptArt`, never a copied image) and an EXHIBIT label.
- EVIDENCE BOARD: `PinBoard` (lit cards, brass pins, red thread). Add a card per exhibit; `lit` makes one glow.
- VERDICT (Curator): `GlowParchment` + `WaxSeal` (matrix down 14 f, press, lift; wax spreads on a spring; embossed ring and monogram), warm flash, 4 px nudge, rose gel, verdict word inks in under the seal.
- TEASER: back in the room, lamp dims to one pool on the board, next case card pinned, hard cut to the end card.
- PLACE / HISTORY scenes: full-frame parallax silhouettes (e.g. `Hills`, `FortressWall`, `Amphitheatre`, `Hawthorn`) with a place tag. The cast is not needed in these.

---

## B. LINOCUT TWO-COLOUR PRINT (Short)

**Palette.** `LINO.paper` cream, `LINO.ink` black, ONE spot colour `LINO.red` (Welsh-dragon red). Nothing else.

**Print rules.**
- All ink goes through `filter: url(#lino-ink)` (bitten edges + specks where the ink missed). Stamps use `lino-stamp` (heavier). `<LinoDefs seed>` re-seeds per beat, so each cut is a new "pull".
- Red and black are separate plates: red is printed over black with multiply and offset by `regOffset(beat)` (a few px, changes only on cuts).
- Carved fills (`lino-pin`, `lino-hatch`, `lino-wave`, `lino-cross`, stipples, `lino-gouge`) replace flat colour. Lighter colours = more carving.
- Motion on twos (`step = 2`), letters stamp on one at a time, `InkWipe` brayer reveals, hard cuts between beats, `useThump` on the stamp.

**Layout (9:16).** Content left of x = 920 and above y = 1540 (Shorts UI). Wordmark top-left (64, 64). Headline zone y 170-560 (126-180 px Bangers, 3 lines max). Figure zone y 600-1390. Source tag y 1424 (32 px, readable on a phone). Hook readable by frame 6.

**Per character (two-colour translation, drawing unchanged).** CURATOR: ink bowler, pinstripe coat, red bow tie. DIG: paper pith helmet with ink band, hatched khaki coat, light stipple skin. DOUBT: wavy-carved coat, darker stipple skin, the RED scarf (his signature carries the spot colour). CLERK: crosshatch coat, red bow tie, hatched inkwell.

**Beat staging (one idea per beat).** HOOK: claim as a question + red sun + carved amphitheatre + place block. CLAIM: Dig on red rays, headline above. OBJECTION: the print reverses (ink block, paper spotlight, paper type). SOURCES: Clerk + carved manuscript page on a red block, title + date. VERDICT: "THE VERDICT", stamp slam (2 frames in the air, contact, splatter, thump), "full case" line. TEASER: next case title carved in, red underline wipe.

**Timing.** The Short is cut from the long film's recorded lines. `LinocutStyleTest` reads `LINO_TEST` (seconds per line + stamp hit) from `src/films/evidence-room-2-style/timing.ts` via `momentFromSeconds`; beats start just before each line and re-flow to any timings.

---

## C. Alternatives in the reel (not recommended for now)

- ILLUMINATED MANUSCRIPT (`ManuscriptMoment`): vellum page, gold border, speaker in a lapis arched miniature, line set as text with a red/gold initial, source as a marginal note, gilded verdict roundel. Good for medieval-source beats; it could become the look of Exhibit slides inside the shadow film.
- NEWSPAPER EVIDENCE BOARD (`NewsMoment`): each beat a torn clipping (headline, halftone photo with the speaker as a sticker, ransom-note quote, SOURCE line) pinned and joined by red string; the camera moves clipping to clipping and pulls back for the stamp. Good for modern claims and hoaxes.
- Chalk was dropped: it turns the cast into line drawings and is the weakest fit for "same four people".

---

## Reuse for episodes 3+

Reuse unchanged: `src/shared/shadow/*`, `src/shared/linocut/*`, `src/shared/Player.tsx`, `src/shared/moment.ts` (timing helpers), the room pieces (`RoomShelves`, `PinBoard`, `HangingLamp`, `RoomFloor`, `RoomForeground`), `LanternSlide`, `WaxSeal`, `LinoStamp`. New per episode: one or two place sets (parallax silhouettes, built like `Amphitheatre`), exhibit art for slides, the timing file.

## Shot list for a full storyboard

Shadow film:
1. ROOM ESTABLISH: room wide, lamp swing, slow push, Curator opens (cartouche).
2. TWO-SHOT LEAN: Dig claims / Doubt objects, camera leans speaker to speaker.
3. SINGLE: one cast member, tighter push (zoom 1.08+), long hold on a key line.
4. PLACE WIDE: parallax silhouette landscape, place tag, no cast.
5. PLACE PUSH: same set, slow push into a detail (arena, gateway, stone).
6. LANTERN SLIDE: Clerk + exhibit slide in, focus pull, EXHIBIT label.
7. SLIDE CLOSE: slide full frame, push across the art (manuscript, poem page, plan).
8. BOARD: pin-board insert, new card pinned, thread drawn to it.
9. SHADOW PLAY: only the screen and moving shadows (a dramatised "imagine" moment), framed as imagined.
10. VERDICT SEAL: parchment, seal press, verdict word.
11. TEASER: room, lamp dims to one pool, next case card, hard cut.
12. END CARD: sources list on parchment.

Short: HOOK CARD, CLAIM FIGURE, REVERSED OBJECTION, EXHIBIT PAGE, STAMP SLAM, TEASER CARD.
