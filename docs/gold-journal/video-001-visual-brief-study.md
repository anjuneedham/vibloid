# Gold Journal 001: visual brief for Opus (world: The Study)

Reference stills: `assets/gold-journal/001/backgrounds/bg-A.png` (concept only; redraw properly).
Real footage: `assets/gold-journal/001/recordings/` (R02, R05, R07, R14, R16, R17, R19 staged; the rest recorded by the owner).
Voiceover blocks: `docs/gold-journal/video-001-voiceover-blocks.md`. Script and compliance: `docs/gold-journal/video-001-first-5k.md`.

## 1. The world

One room, shot like a stage: **a warm study at night**. Dark walnut walls, a wooden desk across the lower third, a framed window at upper left, a desk lamp at upper right casting a gold pool of light, a bookshelf, a globe and a clock. The desk is the "stage" where every chapter plays out as a small paper-cut diorama on the desktop, and the room slowly changes to show time passing.

Why this works: it is cosy, ownable, and cheap to animate (one background, camera pushes and lighting changes instead of new environments), and it makes the Keeper (the journal) physically present as the narrator.

**Palette:** walnut `#2a1f17` to `#4a3626`, desk `#6b4a30`, lamp gold `#ffd98a`, gold leaf `#d4a937`, paper `#f5ecd6`, ink navy `#0e1726`, teal `#2a7f7f` (Wren only), warm red `#c2493d` (warnings only).
**Canvas:** 1920x1080, 30 fps, flat 2D vector with paper grain and soft inner shadows. No photorealism.

## 2. Cast (unchanged)

- **The Keeper:** the gold-bound journal on the desk, always in frame in the lower centre. A ribbon bookmark, an embossed sun-and-quill seal, a pen that writes margin notes on its own. It opens, turns pages, and glows when it speaks. No face.
- **Wren:** gender-neutral beginner, round head, messy short hair, teal hoodie, small notebook under one arm. Seen mostly from behind or in three-quarter profile, seated at the desk, so the shot stays simple. Expressive eyebrows when turned.
- **Flick:** a small gold-and-orange hummingbird-like character that flies around the room and lands on shiny objects. Leaves dropped half-finished pages behind it. Never villainous, only distracted.

## 3. Room states (lighting is the storytelling)

| State | Lighting | Used in |
|---|---|---|
| Blank page | Lamp on, rest of room dim, empty ledger | Cold open |
| Working | Lamp bright, window dark blue | Ch 1, Ch 3 |
| Flat zone | Lamp dims to 60%, window grey, clock hands spinning | Ch 2 |
| Focus | Lamp narrows into a spotlight on the desk | Ch 4 |
| Dawn | Window turns from navy to gold across the chapter | Ch 5 and outro |

## 4. Recordings as "pasted pages"

All real footage plays on a **paper page** placed on the desk or pinned to the wall, with a slight tilt, gold corner tabs and a soft shadow, so it reads as part of the journal. For the framed screen at upper left of the room, use it as the "monitor" for full-screen recording moments. Always add the small paper tag **Example** to staged recordings and **Hypothetical** to any character number.

## 5. Scenes (one per block, time to the voiceover audio)

**S0 Cold open (block 1, about 45 s).** Slow push-in on the Keeper's cover glowing open to a blank page. Wren sits down. R01 (owner's empty tracker at $0) slides onto the desk as a paper page. Title card is written onto the page by the Keeper's pen: "FIRST $5K, THE HONEST ROADMAP". Disclaimer line writes itself at the bottom while the spoken disclaimer plays.

**S1 The equation (block 2, about 90 s).** Three paper cards (`$50 x 100`, `$500 x 10`, `$1,000 x 5`) slide onto the desk; coins stack into three towers that all reach the same gold line labelled `$5,000`, tagged **Hypothetical**. Show R02 on the pasted page when the sum is spoken. Three paths fan out from the desk onto the floor of the room. Pen writes the margin note in a lighter ink at the page's edge.

**S2 The four leaks (block 3, about 120 s).** Flick darts from rocket to coin to crate on the shelf, dropping half-written pages. Show R05 (many tabs) and R07 (habit gaps) as pages. Four labelled drops fall into a leaky gold bucket on the desk, one per leak. Lamp dims into the flat-zone state: a flat line on a paper chart at zero, then a tiny upturn at the end to show the line bending. R06 (the owner's zero-views page) as the last pasted page.

**S3 The fit (block 4, about 150 s).** Wren tries on five hats from a hat stand (freelancer, maker, recommender, local, seller) while the Keeper tallies Skill, Time, Cash and Temperament scores on its pages (1 to 5 stars). The globe spins to each path, and the pasted pages show R08 through R12. The chosen hat glows. Keep affiliate language honest: the "recommender" card shows a small **Disclosed** stamp.

**S4 One, one, ninety (block 5, about 90 s).** The room tidies: Flick's signposts fall away and the desk clears except one lit path drawn on a paper map pinned to the wall. A 90-day wall calendar rolls out. Show R13 (calendar), R14 (content board), R15 (search) as pages. Lamp becomes the focus spotlight.

**S5 The loop (block 6, about 90 s).** A circular Ship, Measure, Fix loop turns on the desk like a gear, one turn per Friday page. Pages turn in a time-lapse; the wall calendar crosses off days. Show R16, R17, R18, R19. The window moves from night to dawn gold as the paper chart's line slowly rises. Warn on screen: "Your first month will look unimpressive."

**S6 Close (block 7, about 45 s).** Dawn light fills the study. Wren closes the ledger, a gold seal stamps the cover, and a paper tag reads "NEXT ENTRY: CHOOSING YOUR FIRST BUSINESS". Final line: "Education only. Not financial advice." R20 (the Vibloid review screen) appears briefly on the monitor.

## 6. Motion rules

- Page turn 0.4 s ease-out. Cards and coins slide in with a small overshoot.
- Flick moves in fast straight hops with tiny pauses. Wren moves slowly and steadily.
- Camera: slow pushes, no zoom punches, no shake.
- Lighting changes take 2 to 3 s and are tied to the narration beat, never to a hard cut.
- Keep the lower 220 px free of important content for captions.

## 7. Deliverables

1. Background plate (empty study) plus the five lighting states as separate layers.
2. Rigged Wren, Flick and the Keeper, each with 6 expressions or poses.
3. Props: paper cards, coins, hats, globe, calendar, map, bucket, seal.
4. Seven scene renders (MP4, no audio), each timed to its voiceover block, with pasted-page placeholders at the exact timestamps where each recording drops in.
5. A cue sheet (JSON) mapping each recording ID to scene, start time and duration.

## 8. Rules

- No real income, no fake dashboards, no testimonials.
- All character numbers are tagged **Hypothetical**. Staged recordings are tagged **Example**.
- Every recording has a clip row with `source_url`, `rights_status` and attribution before render. `unknown` never renders.
- Nothing is published without the owner's approval.
