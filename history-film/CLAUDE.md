# history-film: Past Tense (animated history channel, Remotion)

This is the HISTORY channel. It is separate from the wealth/motivation channel in `../my-film`. Do not mix the rules.
The user records the voiceover. You are the writer, director and animator.
Channel identity, bio, branding and episode ideas live in `CHANNEL.md`. Read it before starting any film.

The look is inspired by dark, moody cartoon history stories: simple thick-outlined cartoon characters standing in dim, atmospheric scenes. Never copy any existing channel's characters, logo, name, jokes or footage. Everything here is our own design.

## FORMAT

- 1920x1080, 30 fps.
- Length: about 5 minutes (9000 frames). Acceptable range 4:30 to 5:30.
- Thin black bars top and bottom (54 px each, letterbox).
- Voiceover is recorded by the user. Animation is timed to the real audio. See WORKFLOW.
- Small channel wordmark bottom right at about 50 percent opacity, drawn in code.

## OUR CARTOON STYLE (original: keep it consistent)

- Thick, slightly wobbly ink outline (`INK`, near black) on every character and key prop. The line "boils": its wobble re-seeds about 8 to 12 times per second, so it feels hand-drawn. Implement with an SVG displacement filter driven by `useCurrentFrame()`.
- Flat single-colour fills. No gradients inside characters.
- HEADS: wide, soft potato shapes (wider than tall), never a perfect circle. No neck, no ears.
- EYES: small solid dots. Heavy half-closed lids for sarcasm or boredom, wide white rings for shock.
- MOUTH: a tiny curved line, or none. A small nose bump is allowed. Eyebrows are single lines and carry most of the emotion.
- BODIES: a simple bell/coat shape in one colour, with short stick legs and noodle arms. No fingers.
- Every character has ONE signature item (hat, scarf, spectacles, crown, medal) so the audience recognises them at once. Pick it once and keep it identical for the whole film.
- Skin tones, clothing and cultures must be drawn respectfully and accurately for the period. Avoid caricature.
- Recurring mascot: THE CLERK, a pale round-headed archivist with round spectacles and an inkwell. Appears in the corner for "source" and "fun fact" beats, and sleeps through the boring parts.

## SCENES AND BACKGROUNDS

- Scenes are dim and moody: dark vignette, soft light pools from candles, windows, lamps, torches or the moon, drifting dust. All drawn in code (SVG, CSS, canvas).
- Interiors and landscapes are built from simple flat shapes with soft blur on far layers for depth.
- Alternate with BRIGHT flat-colour gradient cards (purple, teal, red) carrying big bold list text, for lists, stats and names.
- Maps: draw the country or region as a simple outline shape that can wear a face and react. Use only simplified outlines drawn in code.
- Ghost / memory scenes: tint characters neon blue-green with a soft glow and blurred overlapping duplicates.
- Evidence photos: an old sepia photo tilted a few degrees on a dark background, with a slow push-in. ONLY public-domain or CC0 images, never game footage, film clips, news photos or anything under copyright. Log every one in `ASSETS.md` (title, URL, licence, date checked). If a licence is unclear, redraw the picture in our cartoon style instead.

## TEXT

- Big card text: Bangers (via `@remotion/google-fonts/Bangers`), bold yellow `#FFE600` with a thick dark outline, short lines only.
- Small captions, dates, place names and source tags: Comic Neue (via `@remotion/google-fonts/ComicNeue`), white, with a soft dark shadow.
- Show the date and place when the story moves ("1968, Equatorial Guinea" style), small, bottom-left above the bar.
- Never put more than 10 words on screen at once outside list cards.

## ANIMATION

- Everything moves on every frame. Never a slideshow. Characters breathe, blink, sway. Lights flicker. Dust drifts.
- Squash and stretch on entrances, shocks, jokes and hits.
- Slow push-ins on emotional or dramatic lines. Hard cuts for punchlines. Quick whip-pans between places.
- Cut rhythm follows the voiceover: calm explaining shots hold 5 to 10 seconds, jokes and punchlines cut fast (1 to 3 seconds).
- Characters can lip-flap (simple mouth open/close) only when they speak in a scene. The narrator is voice only, never drawn speaking.
- Drive all motion from `useCurrentFrame()`, `interpolate()` and `spring()`. No CSS transitions or animations.

## STORY STRUCTURE (5 minutes, about 700 to 800 spoken words)

1. HOOK (0:00 to 0:20): the strangest or most shocking moment first, no intro.
2. CONTEXT (0:20 to 1:30): who, where, when, in plain words.
3. THE STORY (1:30 to 4:00): escalate in clear steps, one reveal per beat.
4. AFTERMATH (4:00 to 4:40): what happened next and why it matters today.
5. SIGN-OFF (4:40 to 5:00): one line to think about, then the end card with sources.

## HISTORY AND SAFETY RULES

- Accuracy first. Every claim in a script must be traceable. Keep a `scripts/<film>/sources.md` listing sources for each claim. Mark uncertain or disputed claims in the script as "historians disagree" or "according to".
- Never present rumour as fact. Never invent quotes. Dramatised or imagined dialogue must be obviously cartoon and framed as "imagine".
- Treat victims and real suffering with respect. Humour targets power, absurdity and bad decisions, never victims or ethnic or religious groups.
- No graphic violence on screen. Imply it off-screen or with a cut, so the video stays advertiser-friendly.
- Be careful with living people: stick to documented public facts and avoid anything defamatory.
- Description of every video carries the standard footer from `CHANNEL.md` (dramatised cartoon, sources, not a substitute for academic research).

## WORKFLOW

1. TOPIC: user picks from `CHANNEL.md` ideas or suggests one.
2. SCRIPT: write about 700 to 800 words in short spoken sentences, split into numbered beats, with a source file. User approves or edits.
3. STORYBOARD: a beat sheet with a visual idea and timing for each beat. User approves.
4. VOICEOVER: user records the audio and gives it to Claude as `public/<film>/voiceover.mp3` (or .wav).
5. TIMING: transcribe the audio, get beat start times, store them in `src/films/<film>/timing.ts`.
6. BUILD: animate every beat to the real timing, with the voiceover in an `<Audio>` track.
7. REVIEW: user watches the hosted preview on a tablet and sends notes. Fix, push, repeat.
8. PACKAGE: title options, thumbnail concept, description with sources and footer, tags, chapters.

## CODE LAYOUT

- Shared pieces in `src/shared/`: `theme.ts`, `Letterbox`, `Wordmark`, `Character`, `Clerk`, `Card`, `DateStamp`, `Dust`, `Vignette`, `BoilFilter`, `Photo`.
- Each film in `src/films/<film-name>/` with one registered Composition in `src/Root.tsx`.
- Colours only from `src/shared/theme.ts`. Never hard-code.
- Run `npx remotion bundle` before pushing to confirm the project builds.
- Commit and push to the current development branch. Never publish or upload anything to YouTube: a human reviews and uploads.

## SERIES: THE EVIDENCE ROOM (3 parts, about 5 minutes each)

Format: a new historical claim goes on trial. Same four beats every episode: DIG announces the claim, DOUBT objects, THE CLERK produces the sources, THE CURATOR gives a verdict (PROVEN, PLAUSIBLE or UNPROVEN).

- LOOK: COMIC BOOK PANELS (the user chose style 6 from the style reel). Reference implementation: `src/films/reel/Comic.tsx`.
  - Each beat is a comic "page" of 2 to 4 panels on a cream halftone page. Thick black panel borders, hard drop shadow, halftone dots.
  - Panels slam in one after another (spring from scale 1.18). Big moments get a starburst with Bangers text, speed lines, a white flash and a page shake.
  - Narration appears in yellow caption boxes (Comic Neue bold). Character lines appear in speech bubbles with tails.
  - Hard cuts between pages. Slow push-ins only on the verdict.
- CAST (`src/shared/cast.tsx`, never change their looks): THE CURATOR (host, bowler hat + monocle + moustache), DIG (enthusiast, pith helmet), DOUBT (sceptic, red scarf + sleepy eyes), THE CLERK (sources, round glasses + inkwell).
- SET: the Evidence Room (`src/shared/EvidenceRoom.tsx`): pin-board, red string, hanging lamp. Used for intro, evidence-table and verdict pages.
- VOICE: the user records ALL voices. Characters are not voiced separately: their lines show in speech bubbles and the user reads them (a different voice per character is optional). Characters may lip-flap while their bubble is up.
- Every disputed claim is attributed ("researchers report", "one outside expert said"). Never state a contested claim as fact. Each episode ends with an evidence board and a verdict stamp.
- Series files: `scripts/evidence-room-<n>-<slug>/` containing `script.md` and `sources.md`.
