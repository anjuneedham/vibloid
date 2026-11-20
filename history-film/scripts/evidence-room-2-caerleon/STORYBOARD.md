# The Evidence Room, Part 2: STORYBOARD (The Round Table at Caerleon)

Status: DRAFT 1 for the owner's review. Built and rendered as a silent half-resolution draft:
`previews/evidence-room-2-draft1-silent.mp4` (long film) and `previews/short-evidence-room-2-draft1-silent.mp4` (Short).

- Script: `script.md` (APPROVED, read only). Sources and on-screen quote rules: `sources.md`.
- Code: `src/films/evidence-room-2/` (composition `EvidenceRoom2`) and `src/films/evidence-room-short-2/` (`ShortEvidenceRoom2`).
- Shot names in the code (`s01` to `s41`) match the SHOT column below.
- Times are ESTIMATES (`scripts/estimate_timing_2.py`: Curator 120, Dig 128, Doubt 112, Clerk 100 wpm; 0.35 s per slash; 1.0 s between lines, 2.5 s between beats, 1.5 s before L36). Every cut is tied to a line start, so the film re-flows when the real `units.json` replaces the estimate (see `src/films/evidence-room-2/timing.ts`).
- Estimated running time: speech ends 5:27.6, end card 10 s, total **5:39** (10171 frames). This is above the 5:00 target and just above the 4:30 to 5:30 range: the given paces (especially the Clerk at 100 wpm on L31 and L33) make the script long. Real takes at Part 1 pace would land near 5:00. Nothing was cut.

## Global rules (every shot)

- LOOK: lantern-lit shadow theatre (`STYLE-EPISODE2.md` A). Backlit paper screen, black card cut-outs on parallax layers, the cast drawn exactly as in `cast.tsx`, rim-lit, each throwing a soft shadow on the screen, a control rod below each figure, boiling ink line.
- ROOM FIXES (from the style review): stronger key light (warm soft-light wash on the lamp side plus a deep falloff away from it), a visible lamp CONE down to the floor and a warm POOL where it lands (both swing with the lamp), the pin-board throws a SHADOW on the screen away from the lamp, a midground evidence-table cut-out on the left for depth, and the board's cards carry real short labels (GEOFFREY c. 1136, WACE 1155, GERALD 1188, TENNYSON 1856, THE DIG 1926, OS MAPS c. 1900).
- IDLE MOTION (per character, `src/shared/shadow/idle.ts`): CURATOR slow dignified sway (about 4 s), DIG bouncy (hops on the rod, quick sway, restless head), DOUBT slumped (leans back, head sunk) with a slow blink every 5 s, CLERK still, then snaps to a new small head tilt and holds (bird-like).
- SPEECH: only the speaker's mouth flaps, only during their own line. Every line is a lower-third CARTOUCHE with the speaker's name tab (brass Curator, amber Dig, red Doubt, teal Clerk). Long lines turn pages at the slash marks (and at `|` page breaks in `lines.ts`) so no page shows more than 10 words. Numbers show as numerals ("AD 74 or 75"). Quoted words are set word for word as in the source (see "Quote wording" below).
- SOURCE TAG: top left on every beat, text exactly as in `script.md`. Beats 1 and 10 have no tag in the script and show none. Beat 9 has no tag in the script; it shows "All exhibits above. Full source list on the end card".
- PLACE TAG: bottom left, above the cartouche, on every place and shadow-play shot.
- REAL WORDS ONLY on pages, letters and tablets: IM Fell English (book pages), Grenze Gotisch (running heads), Cinzel (tablet). No asemic squiggles anywhere a reader might try to read.
- NO PORTRAITS: Geoffrey, Gerald, Tennyson and the Wheelers appear only as anonymous cartoon silhouettes (potato heads, bell robes), captioned "(cartoon silhouette)", or as their written words. No outside images used (ASSETS.md unchanged).
- TRANSITIONS: hard cuts inside the room and for punchlines; a soft LAMP DIP (8 frames dark) when the story moves to a new place or era (s02, s07, s13, s23, s28, s36, s41).
- GELS: amber by default, teal while Doubt objects or the Clerk reads a source, rose after the verdict.

## Shot types used

| Code | Type | What it is |
| --- | --- | --- |
| ROOM | Evidence Room | Screen, shelves, board + its shadow, hanging lamp + cone + pool, evidence table, floor, cast, foreground chair and tassel. Camera leans about 20 % toward the speaker (20 frames, sine) instead of cutting. |
| PLACE | Parallax landscape | Hills, fortress wall, amphitheatre cut-out with the arena glowing through, wind-bent hawthorn foreground. No cast. Slow push and pan. |
| SLIDE | Lantern slide | A speaker on the left, a glass slide sliding into the carrier on the right (16 f slide, 20 f focus pull), EXHIBIT label under it. |
| SLIDE CLOSE | Full slide | The slide fills the frame, slow push. |
| PLAY | Shadow play | Only the screen and moving silhouettes (a dramatised moment, captioned). |
| BOARD | Evidence board | Close on the board: cards pinned one by one, red thread drawn, stamps. |
| SEAL | Verdict | Glowing parchment, wax seal pressed, verdict word inks in, rose gel, warm flash, 4 px nudge. |
| END | End card | Sources list and the next-case line, both from `episode.json`. |

---

## THE LONG FILM (1920 x 1080, 30 fps)

### BEAT 1: THE CASE (0:00 to 0:18) | no source tag (title beat)

| Line | Est. time | Shot | Camera | On stage / speaking | On screen | Light / gel | Hold rationale | Transition out |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L01 | 0:01.0 to 0:06.8 | s01 ROOM ESTABLISH | Push 1.00 to 1.07, drift right 70 px | CURATOR (speaking) at the lamp; the CLERK asleep on the right (eyes shut, head dropped, no idle) | Cartouche L01 | Lamp left of centre, amber | Opening: let the room and the lamp swing breathe (about 13 s incl. L02 first half) | Lamp dip at L02 page 2 |
| L02 [S] | 0:07.8 to 0:16.7 | s01 then s02 PLACE (moonlit amphitheatre) from "and a legend…" | s02: push 1.00 to 1.06, pan 160 px | CURATOR speaking (voice continues over the place shot, no figure) | Title plate "THE EVIDENCE ROOM · CASE 2 / THE ROUND TABLE AT CAERLEON"; place tag "CAERLEON, SOUTH WALES" | Moonlit screen, teal gel, warm torchlight in the arena | The hook image (the "round table" glowing) lands on the word "legend" | Hard cut to the room |

### BEAT 2: THE CLAIM (0:18 to 0:45) | SOURCE "Museum Wales; Ordnance Survey maps, recorded 1898 to 1908"

| Line | Est. time | Shot | Camera | On stage / speaking | On screen | Light / gel | Hold rationale | Transition out |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L03 | 0:19.2 to 0:25.6 | s03 ROOM three-shot | Lean to Dig, push 1.00 to 1.05 | DIG (speaking, arms up), DOUBT, CLERK (awake) | Cartouche | Amber | Claim beat: 7 s, one breath | Hard cut |
| L04 [S] | 0:26.6 to 0:34.8 | s04 PLACE (day: fortress wall behind, amphitheatre outside it), then s05 SLIDE CLOSE at "Old maps label it…" | Pan 160 px, push to 1.08 / slide push 1.06 | DIG speaking (voice over the place) | Place tag "OUTSIDE THE FORTRESS WALLS"; EXHIBIT A: drawn OS-style plan (River Usk, CAERLEON fortress, the oval labelled "King Arthur's Round Table / AMPHITHEATRE", a red ring pulsing) | Warm day screen | Show the arena while he describes it, the map exactly on the word "maps" | Hard cut |
| L05 | 0:35.8 to 0:43.4 | s06 SLIDE | Drift 30 px, push 1.04 | CLERK speaking, raises inkwell arm | EXHIBIT B quote card: MUSEUM WALES "It was founded in AD 74 or 75" (Museum Wales, Caerleon, City of the Legion) | Teal gel (source read) | Source beats hold for the whole read | Lamp dip (new place) |

### BEAT 3: THE ROMANS (0:45 to 1:34) | SOURCE "Cadw; Museum Wales"

| Line | Est. time | Shot | Camera | On stage / speaking | On screen | Light / gel | Hold rationale | Transition out |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L06 | 0:45.9 to 1:00.1 | s07 PLACE (fortress close, walls and towers large) | Pan 160 px, push 1.00 to 1.08 | CURATOR speaking (voice only) | Place tag "ISCA (CAERLEON), ABOUT AD 75 / Fortress of the Second Augustan Legion"; fact plate from page 2: "ONE OF JUST THREE / permanent legionary fortresses in Britain (Cadw)" | Low sun right, warm | Longest fact line (14 s): one calm held shot, one fact plate | Hard cut |
| L07 | 1:01.1 to 1:05.6 | s08 SLIDE CLOSE | Push 1.00 to 1.06 | CURATOR speaking (voice only) | EXHIBIT C: "OVER 5,000 SOLDIERS", 80 legionary silhouettes fill in row by row (Museum Wales info sheet) | Amber | Stat card: one idea, 5 s | Hard cut |
| L08 | 1:06.6 to 1:16.3 | s09 PLACE (amphitheatre) | Push 1.02 to 1.12 into the arena | CURATOR speaking (voice only) | Place tag "THE AMPHITHEATRE"; plate 1 "BEGUN AROUND AD 90 (Cadw; Museum Wales)", plate 2 from page 2 "ABOUT 6,000 SEATS / an estimate (Cadw; Museum Wales)" | Warm day | The estimate is labelled on screen the moment it is said | Hard cut |
| L09 [S] | 1:17.3 to 1:22.6 | s10 SLIDE CLOSE | Push 1.06 | CURATOR speaking (voice only) | EXHIBIT D: CADW CALLS IT "the Roman equivalent of today's multiplex cinema" (Cadw, amphitheatre page) | Amber | Set-up for the joke: 5 s | HARD CUT (punchline) |
| L10 [S] | 1:23.6 to 1:27.2 | s11 ROOM single | Tight, 1.12 to 1.15, no lean | DOUBT alone, speaking | Cartouche | Teal gel | Punchline: 4 s, fast | Hard cut |
| L11 | 1:28.2 to 1:32.4 | s12 SLIDE | Drift | CLERK speaking | CONTRADICTION slide: "AROUND AD 90" ("Built around AD 90 to entertain the legionaries stationed at the fort of Caerleon." Cadw; also Museum Wales Roman Ruins) VS "AROUND AD 80" (the excavators concluded "around AD 80", Museum Wales blog); right column fades in on the line | Teal | The contradiction stays up for the whole line and the beat gap | Lamp dip (new era) |

### BEAT 4: THE WITNESS (1:34 to 2:05) | SOURCE "Geoffrey of Monmouth, History of the Kings of Britain, Book IX ch. 12 (Giles translation); Cadw"

| Line | Est. time | Shot | Camera | On stage / speaking | On screen | Light / gel | Hold rationale | Transition out |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L12 | 1:34.9 to 1:46.1 | s13 PLAY: a hooded writer at a sloped desk by candle, quill moving | Push 1.06, pan 80 px | CURATOR speaking (voice only). Geoffrey = cartoon silhouette | Place tag "ABOUT 1136 / Geoffrey of Monmouth writes his History (cartoon silhouette)" | Warm, candle flame cut through the card | Calm story line, 11 s hold | Hard cut |
| L13 | 1:47.1 to 1:54.8 | s14 SLIDE | Drift | DIG speaking (arm points at the slide) | EXHIBIT E book page: running head "Book IX, chapter 12", "… hold a magnificent court, to place the crown upon his head …" underlined in red as he speaks (Giles 1848) | Amber | Dig paraphrases; the page shows Geoffrey's real words under him | Hard cut |
| L14 | 1:55.8 to 2:01.6 | s15 SLIDE | Drift | CLERK speaking | EXHIBIT F: CADW ON GEOFFREY "the somewhat imaginative 12th-century scholar" | Teal | Set-up | HARD CUT (punchline) |
| L15 | 2:02.6 to 2:03.1 | s16 ROOM single | Very tight 1.16 to 1.18 | DOUBT alone, one word, brows down | Cartouche "Somewhat." | Teal | One word: let it sit (about 3 s incl. the beat gap) | Hard cut |

### BEAT 5: THE MISSING TABLE (2:05 to 2:49) | SOURCE "Geoffrey, Book IX ch. 13 (Evans translation); Wace, Roman de Brut, 1155"

| Line | Est. time | Shot | Camera | On stage / speaking | On screen | Light / gel | Hold rationale | Transition out |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L16 | 2:05.6 to 2:11.4 | s17 SLIDE | Drift | CLERK speaking | EXHIBIT G: three books appear one by one: Giles (English trans., 1848), Evans (English trans., 1904), Giles (Latin edition, 1844), each with "round table": 0, "amphitheatre": 0 | Teal | Shows the search, not just says it | Hard cut |
| L17 [S] | 2:12.4 to 2:15.7 | s18 SLIDE CLOSE | Push 1.06 | CLERK speaking (voice only) | CONTRADICTION: CADW SAYS Geoffrey wrote that "the ruined amphitheatre was actually the remains of King Arthur's Round Table" (Cadw booklet p. 22 and web page) VS GEOFFREY'S TEXT: Round Table: no mention. Amphitheatre: no mention. Stamp "NOT IN THE TEXT" lands on "No amphitheatre" | Amber | The twist of the episode: the contradiction the sources file says to show | Hard cut |
| L18 | 2:16.7 to 2:24.1 | s19 SLIDE CLOSE | Push | CURATOR speaking (voice only) | EXHIBIT H book page: "Book IX, chapter XIII", "… when all were set at table according as the rank of each did demand …" underlined as read; drawing of one long table with a red high seat at the head (Evans 1904) | Amber | Let the irony read | Hard cut |
| L19 | 2:25.1 to 2:34.3 | s20 SLIDE CLOSE | Push | CURATOR speaking (voice only) | EXHIBIT I timeline: "c. 1136 Geoffrey: a table, set by rank" then "1155 Wace: the Round Table: no head seat" (round table with equal seats). Footer: Wace, Roman de Brut (1155): first known Round Table (Camelot Project; Kibler). No Wace quotation (not yet checked in Weiss) | Amber | Two dates, one arrow | Hard cut |
| L20 | 2:35.3 to 2:39.0 | s21 ROOM two-shot | Lean to Dig | DIG speaking (arms up), DOUBT | Cartouche | Amber | Quick reaction | Hard cut on L21 page 2 |
| L21 | 2:40.0 to 2:46.8 | s21, then s22 PLAY at "A table the size of a stadium?" | Slight push as the shadow grows | DOUBT speaking, a small table beside him | The table's shadow on the screen swells to arena size; "(imagine)" caption | Teal | Visual joke on the punch phrase (about 5 s) | Lamp dip (new era) |

### BEAT 6: THE WITNESSES (2:49 to 3:23) | SOURCE "Gerald of Wales, Itinerary through Wales, 1188 (Hoare translation); Hallam Tennyson, Memoir, 1897"

| Line | Est. time | Shot | Camera | On stage / speaking | On screen | Light / gel | Hold rationale | Transition out |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L22 | 2:49.3 to 3:02.4 | s23 PLAY (a robed walker with a staff crosses past broken walls and arches), then s24 SLIDE CLOSE from "He listed palaces…" | Pan 120 px / push | CURATOR speaking (voice only). Gerald = cartoon silhouette | Place tag "CAERLEON, 1188 / Gerald of Wales visits the ruins (cartoon silhouette)"; EXHIBIT J book page "Itinerary, Book I, chapter 5": "… Immense palaces, ornamented with gilded roofs, in imitation of Roman magnificence; a tower of prodigious size, remarkable hot baths, relics of temples, and theatres inclosed within fine walls …" (Hoare 1806); stamp "ROUND TABLE: NOT MENTIONED" on "He never mentions a Round Table" | Warm | Long line split into two shots at the slash | Hard cut |
| L23 | 3:03.4 to 3:14.4 | s25 PLAY (moonlit window, the Usk rippling outside, a figure in a wide hat writing by candle), then s26 SLIDE CLOSE on the quote | Push | DIG speaking (voice only). Tennyson = cartoon silhouette | Place tag "CAERLEON, 1856 / Tennyson writes a letter (cartoon silhouette)"; EXHIBIT K page "A Memoir, vol. 1, p. 416": "… The Usk murmurs by the windows, and I sit like King Arthur in Caerleon. …" (letter of 16 September 1856) | Moon (teal) then amber | The quote gets its own full slide | Hard cut |
| L24 | 3:15.4 to 3:20.5 | s27 ROOM two-shot | Lean to Doubt | DOUBT speaking, DIG | Cartouche | Teal | Dry reply | Lamp dip (new era) |

### BEAT 7: THE NEWSPAPER (3:23 to 4:30) | SOURCE "Cadw, Trailblazers: Tessa Verney Wheeler (booklet), pp. 22 to 25; Coflein"

| Line | Est. time | Shot | Camera | On stage / speaking | On screen | Light / gel | Hold rationale | Transition out |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L25 | 3:23.0 to 3:29.9 | s28 PLACE (amphitheatre by day) + diggers, a barrow, a press camera on a tripod in the foreground whose flash fires every 1.3 s | Pan 100 px | CURATOR speaking (voice only) | Place tag "CAERLEON, 1926 / the amphitheatre is dug out" | Warm day; flashes are the "blaze of publicity" | 7 s | Hard cut |
| L26 [S] | 3:30.9 to 3:40.0 | s29 SLIDE | Drift | CLERK speaking | EXHIBIT L card "1926: WHO PAID?": The Daily Mail funded the dig, in return for "exclusive" updates. (Cadw booklet pp. 22 to 23). No newspaper masthead is drawn | Teal | Source read in full | Hard cut |
| L27 | 3:41.0 to 3:48.3 | s30 SLIDE | Drift | DOUBT speaking | EXHIBIT M: CADW BOOKLET "The Wheelers were canny enough not to dispute this romantic idea" | Teal | | Hard cut |
| L28 [S] | 3:49.3 to 3:55.7 | s31 SLIDE | Drift | CURATOR speaking | EXHIBIT N: CADW'S OWN BOOKLET "an appealing, (though untrue), story and was guaranteed to sell newspapers." (sets up L38) | Amber | | Hard cut |
| L29 | 3:56.7 to 4:04.5 | s32 PLAY: a figure in a cloche hat with a trowel directs diggers and a barrow | Pan 80 px | DIG speaking (voice only). Tessa Wheeler = cartoon silhouette | Place tag "CAERLEON, 1926 / Tessa Verney Wheeler directs the dig (cartoon silhouette)" | Warm | Credit where due: her own shot | Hard cut |
| L30 | 4:05.5 to 4:08.8 | s33 SLIDE | Drift | DIG speaking, arms up | EXHIBIT O: the lead tablet appears (the words faint, not yet read) | Amber | Reveal | Hard cut |
| L31 | 4:09.8 to 4:26.7 | s34 SLIDE CLOSE | Push | CLERK speaking (voice only) | The tablet: Cadw's English translation in Roman capitals, each word brightening as it is read: "LADY NEMESIS, I GIVE THEE A CLOAK AND A PAIR OF BOOTS; LET HIM WHO TOOK THEM NOT REDEEM THEM (UNLESS) WITH HIS OWN BLOOD." Footer: Cadw's translation, booklet p. 25 (shown in English, not the original lettering) | Teal | Longest Clerk line (17 s): the reading itself is the motion | HARD CUT (punchline) |
| L32 | 4:27.7 to 4:29.8 | s35 ROOM single | Tight 1.10 to 1.13 | DOUBT alone, brows up | Cartouche | Amber | Punchline: 2 s | Lamp dip |

### BEAT 8: THE EVIDENCE BOARD (4:30 to 4:59) | SOURCE "RCAHMW Historic Place Names (Ordnance Survey 2nd edition)"

| Line | Est. time | Shot | Camera | On stage / speaking | On screen | Light / gel | Hold rationale | Transition out |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L33 | 4:32.3 to 4:51.1 | s36 BOARD | Drift 60 px, push 1.05 | CLERK speaking (voice only) | Title "THE EVIDENCE BOARD"; card per page, pinned on a spring, thread drawn to it, stamp after: 1 ROMAN AMPHITHEATRE (Cadw; Museum Wales; Coflein) FOUND; 2 ROUND TABLE IN GEOFFREY (Giles, Evans and the Latin, searched) NOT IN THE TEXT; 3 AMPHITHEATRE CALLED THE ROUND TABLE (Earliest firm label: Ordnance Survey maps, recorded 1898 to 1908) c. 1900 | Lamp top centre, board shadow on the screen | The summary: one card per clause, 19 s | Continues |
| L34 | 4:52.1 to 4:56.9 | s36 BOARD | (same) | CLERK speaking (voice only) | Card 4 WHEN DID THE NAME BEGIN? (No dated source found) NOT FOUND | | | Hard cut |

### BEAT 9: THE VERDICT (4:59 to 5:20) | SOURCE (none in script) "All exhibits above. Full source list on the end card"

| Line | Est. time | Shot | Camera | On stage / speaking | On screen | Light / gel | Hold rationale | Transition out |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L35 | 4:59.4 to 5:09.0 | s37 ROOM single | SLOW PUSH 1.04 to 1.13 (the one dramatic push) | CURATOR alone, speaking | Cartouche, four pages | Lamp centred, rose gel creeping in (0.16) | Gravity | Cut inside the 1.5 s pause |
| L36 [S] | 5:10.5 to 5:11.8 | s38 SEAL (from 1.4 s before the line) | Push 1.00 to 1.07, 4 px nudge on the hit | CURATOR on the left, speaking, arm sweeps down on the hit | Parchment "THE VERDICT", "The claim: King Arthur's Round Table was the Roman amphitheatre at Caerleon." Seal matrix comes down, wax spreads on "unproven" (55 % into the line), UNPROVEN inks in | Rose gel after the hit, warm flash | The 1.5 s pause is the seal coming down | Hard cut |
| L37 [S] | 5:12.8 to 5:15.6 | s39 ROOM three-shot | Lean Dig, then Doubt | DIG speaking (arms up), CURATOR (smiling), DOUBT | Cartouche | Rose | Button | |
| L38 [S] | 5:16.6 to 5:18.8 | s39 | Lean to Doubt | DOUBT speaking | Cartouche (echoes L28's "guaranteed to sell newspapers") | Rose | Button lands, 2 s | Hard cut |

### BEAT 10: NEXT CASE (5:20 to 5:29) and END CARD (5:29 to 5:39) | no source tag

| Line | Est. time | Shot | Camera | On stage / speaking | On screen | Light / gel | Hold rationale | Transition out |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L39 | 5:21.3 to 5:27.6 | s40 ROOM, lamp dimmed to one pool on the board | Push 1.02 to 1.08 | CURATOR alone, speaking | Pinned card "NEXT CASE: A POPE PUTS A DEAD POPE ON TRIAL / Pinned for next time" (from `episode.json` `teaserCard`); cartouche text from `episode.json` `teaser` | Dim (0.7) | Quiet close | Lamp dip |
| (end) | 5:29.0 to 5:39.0 | s41 END CARD | Static | none | SOURCES (9 entries from `episode.json`), "A dramatised cartoon. Full links in the description.", the teaser line | Parchment on the lit screen | 10 s to read | end |

---

## THE SHORT (1080 x 1920, linocut two-colour print), `ShortEvidenceRoom2`

Lines: L02, L04, L09, L10, L17, L26, L28, L36, L37, L38 (in that order), cut from the long film's takes (`scripts/build_short_2.py`). Timing: 0.3 s lead, gaps of 0.36 s (auto-squeezed if takes run long, never below 0.12 s), +0.5 s before L36, 2.4 s tail. Estimated length **57.5 s** (1725 frames), under 58 s. If the real takes total more than about 53 s of speech the Short will run over 58 s even at minimum gaps: re-check after recording.

Safe area: every key element sits LEFT of x = 920 and ABOVE y = 1540 (the right 160 px and bottom 380 px are the Shorts UI). The zone below 1540 holds only a decorative carved ink block.
Layout: wordmark (64, 64) | headline y 150 to 560 | figure and art y 560 to 1140 | speech cartouche y 1180 to about 1390 (paper plate, ink border, red name block) | source tag y 1412 to about 1520.
Print rules: ink through the `lino-ink` filter, the red plate offset per scene (`regOffset`), motion on twos, letters stamp on one at a time, HARD CUTS between scenes (each scene a new "pull": new specks, new registration).

| Scene | Line(s) | Est. time | Headline (y 150 to 560) | Figure / art | Speaking (lip-flap) | Source tag | Transition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 HOOK | L02 | 0:00.3 to 0:09.1 | "KING ARTHUR'S / ROUND TABLE?" (red ghost), red block "A ROMAN RUIN IN WALES" | Red sun with carved rays, carved amphitheatre; Curator small on the right | CURATOR | Cadw; Museum Wales (full list in the description) | Hard cut |
| 2 CLAIM | L04 | 0:09.5 to 0:17.7 | "OLD MAPS / LABEL IT:" | Dig on red rays; on "Old maps…" a map label prints beside a carved oval: "King Arthur's Round Table / AMPHITHEATRE" | DIG | Museum Wales; Ordnance Survey maps, recorded 1898 to 1908 | Hard cut |
| 3 CINEMA | L09 | 0:18.1 to 0:23.4 | "CADW CALLS IT:" then the quote "THE ROMAN EQUIVALENT OF TODAY'S MULTIPLEX CINEMA" (red on the last two words) | Carved amphitheatre throwing a red projector beam; Curator | CURATOR | Cadw; Museum Wales | Hard cut |
| 4 OBJECTION | L10 | 0:23.8 to 0:27.3 | Print reverses (ink block): "THRONE ROOM?" in paper, a carved crown crossed out in red | Doubt in a paper spotlight | DOUBT | Cadw; Museum Wales | Hard cut |
| 5 NO TABLE | L17 | 0:27.7 to 0:31.1 | "GEOFFREY'S BOOK, / c. 1136" | Page on a red gouged block with the real Evans words "… when all were set at table according as the rank of each did demand …"; stamps "ROUND TABLE: 0" then "AMPHITHEATRE: 0" on each half of the line; Clerk | CLERK | Geoffrey, Book IX ch. 13 (Evans translation); Wace, Roman de Brut, 1155 | Hard cut |
| 6 NEWSPAPER | L26 | 0:31.4 to 0:40.5 | "1926: A NEWSPAPER / PAID FOR / THE DIG" | Carved amphitheatre, a digging spade (red blade), a generic folded newspaper with ruled columns only (no masthead, no words); Clerk | CLERK | Cadw, Trailblazers: Tessa Verney Wheeler (booklet), pp. 22 to 25; Coflein | Hard cut |
| 7 UNTRUE | L28 | 0:40.9 to 0:47.2 | "CADW'S OWN BOOKLET:" and on a red block "AN APPEALING, (THOUGH UNTRUE), STORY" | Curator | CURATOR | (same as scene 6) | Hard cut |
| 8 VERDICT | L36 | 0:48.1 to 0:49.4 | "THE VERDICT", red stamp UNPROVEN slams on "unproven" (2 frames in the air, contact, splatter, page thump) | Curator, arm comes down, smiles | CURATOR | All exhibits in the full episode (sources in the description) | Hard cut |
| 9 BUTTON | L37, L38 | 0:49.8 to 0:55.1, tail to 0:57.5 | "THE ROUND TABLE / AT CAERLEON:" + red block "UNPROVEN" | Dig (arms up) and Doubt on a red gouged block | DIG then DOUBT | (same as scene 8) | After L38 the cartouche is replaced by "FULL CASE: THE EVIDENCE ROOM, PART 2" |

---

## Quote wording on screen (differs from the spoken script; script.md not edited)

The cartouches and slides set quotes word for word and punctuation for punctuation as `sources.md` records them. The spoken lines are unchanged.

- L14: spoken "twelfth-century", shown "12th-century" (Cadw's spelling).
- L23: script ends the quote with "!"; the Memoir has a full stop. Shown: "I sit like King Arthur in Caerleon."
- L28: script "an appealing, though untrue, story"; the booklet has "an appealing, (though untrue), story". Shown with the brackets.
- L31: script splits the curse into two sentences and drops the brackets; Cadw's translation is one sentence with a semicolon and "(unless)". Shown as Cadw prints it.
- `sources.md` still flags the Cadw web wording (L09, L14) and the OCR-read primary quotes (L13, L18, L22, L23) as "check by eye before on-screen use". They are on screen in this draft and must be checked before publishing.

## Lines that are awkward to stage (not changed)

- L06 and L33 are long (14 s and 19 s at the estimated pace). Staged as one held place shot with a fact plate (L06) and one card per clause (L33). Both read slowly at 100 to 120 wpm.
- L15 ("Somewhat.") is half a second long: the shot holds through the beat gap so the joke can land; with real audio check the pause after it.
- L17 is reused in the Short but means little without L16: the Short shows Geoffrey's book and the page so it stands alone.
- L22 says Gerald "listed palaces, baths, temples and theatres"; the Hoare text also lists "a tower". The slide shows the full sentence.
- L25 "a blaze of publicity" is Coflein's phrase; it is spoken without quotation marks and shown without them (the source tag names Coflein).
- L26: `sources.md` says to confirm that the "exclusive" updates were about Arthur. The line as written does not say so and the slide does not either.
- L39: the script still has the placeholder "[PART 3 CASE, TO BE CHOSEN]". The draft uses `episode.json` ("Next time: a pope puts a dead pope on trial. Case adjourned."). Its length changes the end time slightly.
