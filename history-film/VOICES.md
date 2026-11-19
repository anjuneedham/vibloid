# The Evidence Room: voice bible

One performer, four distinct voices. Applies to every episode and every Short.

## Why this exists: what we measured in Part 1

Measured on the cleaned Part 1 voiceover (`scripts/voice_check.py`, run it on any finished voiceover):

| Voice | Median pitch | vs Curator | Pitch movement | Loudness | Pace |
| --- | --- | --- | --- | --- | --- |
| Curator | 102.6 Hz | 0 | 6.8 st | -14.4 dB | 116 wpm |
| Dig | 97.0 Hz | -1.0 st | 7.2 st | -15.5 dB | 122 wpm |
| Clerk | 98.8 Hz | -0.7 st | 4.8 st | -14.4 dB | 97 wpm |
| Doubt | 99.4 Hz | -0.5 st | 7.5 st | -15.0 dB | 134 wpm |

(st = semitones. 12 st is one octave.)

What it says: the four voices sit within one semitone of each other and within 1.1 dB of each other. Pace is the only thing that varies, and it varies the wrong way: Dig is lower than the Curator and Doubt, who was meant to be the slow, dry one, was the second fastest. Listeners will hear one person reading four parts. Nothing was wrong with the performance as a read. The voices just are not separated yet.

Rule of thumb for a one-person cast: pitch, pace, movement and weight each separate the voices a little. Change at least three of the four for every character, and keep each one the same all series long.

## The four voices (targets)

Pitch targets are relative to the Curator, who is your natural low speaking voice. Hz values assume the roughly 100 Hz base measured above; keep the gaps if your base is different.

### THE CURATOR (host, judge)
- Pitch: your natural low voice. Stays the reference (0 st). Deep, warm, resonant. Speak from the chest.
- Pace: 115 to 125 wpm. Never above 135, even on long fact lines.
- Movement: wide and slow. Long phrases, and every sentence ends on a downward cadence (authority).
- Weight: full, rounded vowels, every consonant landed. One hand-width from the mic for warmth.
- Posture: stand tall, chin slightly down.
- Tell: "Ladies and gentlemen". A hint of a smile on "court of history". Pause 1.5 seconds before the verdict.
- Warm-up line: "The court of history is now in session."
- Failure to avoid: racing through long fact lines (Part 1: "Hair buried beside the seeds…" at 173 wpm). Use the slash marks.

### DIG (the enthusiast)
- Pitch: about +5 st above the Curator (about 135 Hz). Bright, forward, in the mask of the face.
- Pace: 120 to 135 wpm. The excitement comes from pitch and volume, never from speed.
- Movement: big. Sentences rise at the end. Catch a small breath before every big claim.
- Weight: loudest of the four (about +2 dB). Two hand-widths from the mic so the shouts do not crowd.
- Posture: stand up, up on the toes, smile while you read.
- Tell: opens with a gasp, stretches the key word ("Siberia!").
- Warm-up line: "A huge burial mound, in the south of Siberia!"
- Failure to avoid: the 169 wpm Herodotus line. Slow down for lists, let each noun ring.

### DOUBT (the sceptic)
- Pitch: about 2.5 st BELOW the Curator (about 86 Hz), and flat. Deadpan.
- Pace: 105 to 120 wpm. The slowest voice with feelings. In Part 1 it was the fastest (134 wpm). Fixing this is the single biggest win.
- Movement: small, 4.5 st or less. Close to a monotone; the sigh does the work. Sentences go down and end flat.
- Weight: dry and a little dull, slightly quieter (about -1.5 dB). Lazy consonants, half-closed lids.
- Posture: sit back, slump, eyebrow raised.
- Tell: a small exhale before the line. The joke lives in the pause before the punch word: "Hold on. / 'Used to get high' is doing / a lot / of work / in that sentence."
- Warm-up line: "Hold on. That is doing a lot of work."
- Failure to avoid: delivering the funny line fast. Slower is funnier.

### THE CLERK (sources)
- Pitch: about +2 st above the Curator (about 115 Hz), and narrow. Almost a read-out.
- Pace: 95 to 110 wpm, every word equal. No emotion.
- Movement: the narrowest of the four, 3.5 st or less. Staccato. "Source:" lands like a rubber stamp.
- Weight: small, tidy and quiet (about -3 dB). Close to the mic and a little quieter, like paperwork being read in a library.
- Posture: sit up, chin tucked, bureaucrat.
- Tell: a flat "Source:" then a full stop, then the source.
- Warm-up line: "Source: study published in Science. Contested."
- Failure to avoid: letting a word go soft ("Contestant", "source"). Hit every ending: "sources".

### Separation at a glance

| | Pitch | Pace | Movement | Weight |
| --- | --- | --- | --- | --- |
| Curator | 0 (low, warm) | 115 to 125 | wide, falls | full, close |
| Dig | +5 st | 120 to 135 | big, rises | loud, bright |
| Doubt | -2.5 st | 105 to 120 | flat, drops | dry, quieter |
| Clerk | +2 st | 95 to 110 | narrowest | small, quiet, close |

## Pacing rules (all voices)

- Comma: a small breath (a third of a second). Full stop: a full breath (one second). Exclamation: let it ring for a beat.
- New speaker: stop, sip, change posture and pitch, then speak. Wait 3 seconds of silence between beats; I can cut silence but cannot add a missing breath.
- Pause BEFORE the reveal word, not after: "The hair / is." "The high / is unproven."
- Long fact lines: break them with slashes and take a beat at each. Target 115 to 140 wpm for the whole film; the quick bursts are what make it sound rushed, not the average.
- Script length: about 480 spoken words lands near 5 minutes at your pace with room to breathe. Short: about 110 to 130 words, reusing takes from the long film.

## Recording method

1. Record one character at a time in separate passes (all Curator lines, then all Dig lines, and so on). It is far easier to hold a voice.
2. Same room, same mic, no fan. Keep the Curator at one hand-width; Dig two hand-widths; Doubt and Clerk close and a little quieter. Do not change the mic gain between passes.
3. Do the warm-up line for each character before their pass, then throw it away.
4. Record each line twice. I pick the best take and cut the retakes.
5. Pronunciation: read `scripts/<film>/pronunciation.md` first. Pick one way to say each hard name and say it identically every time.
6. Send the audio. I build the clean edit, then run the check below.

## Check, then optional polish

1. Run `python3 scripts/voice_check.py <voiceover> <units.json>`. It prints each voice's pitch, movement, loudness and pace, and says which pairs sit too close. Target: no pair closer than 2 st, and every row PASS.
2. If one performer still sounds like one person, `python3 scripts/voice_treat.py <voiceover> <units.json> <out.mp3>` applies a small pitch and tone shift to each character (Curator 0, Dig +6, Doubt -2.5, Clerk +3 semitones, plus a different EQ for each) without changing timing. It is a safety net, not a substitute: the performance (pace, movement, pauses) still does most of the work. The shift amounts allow for each voice's natural offset in your Part 1 recording and should be re-tuned if your Episode 2 baseline changes.
3. A/B demo on the Part 1 audio: `previews/part1-voices-treated-demo.mp3`. Judge it with your own ears and against the untouched take.

## Honest limits

- The pitch tracker is a simple estimate, good for comparing characters recorded by the same person in the same room. It cannot judge acting, tone or whether a voice sounds natural. That is your ear's job.
- The treated demo was checked by measurement only. I have not listened to it.
- If you ever want truly separate voices instead of one performer, the options are AI voices per character (ElevenLabs voice design, which costs credits and loses your acting) or a speech-to-speech voice changer. Both are optional and we have not used either.
