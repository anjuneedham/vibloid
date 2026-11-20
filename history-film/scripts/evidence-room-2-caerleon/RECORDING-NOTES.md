# Evidence Room Part 2: recording notes (from the four uploaded takes)

Built by `scripts/transcribe_chunks.py` (finds real silences, transcribes each stretch) and `scripts/build_vo_2.py`
(matches takes to script lines, picks the best, cuts, levels, builds). Full per-line report: `public/evidence-room-2/take-report.md`.

Result: all 39 lines found. Clean voiceover 5:02 (target 4:30 to 5:30). The Short's ten lines total about 49 s of speech.
I cannot hear acting or tone. Every choice below rests on a transcript, silence detection and pace, so listen to the file.

## Check by ear (the recogniser heard something different from the script)
| Line | What was heard | Why it matters | Suggested action |
| --- | --- | --- | --- |
| L31 Clerk | "I **gave** thee a cloak" (two separate transcriptions agree) | It is a quotation; the source says "I give thee" | Re-record L31, or tell me you said "give" |
| L08 Curator | "around **eighty-ninety**... room for **a boat** six thousand" | A fact (AD 90) | Listen to "around A-D ninety"; re-record if it slipped |
| L21 Doubt | "A table I **can't** believe" (an earlier pass heard "can") | "can't" flips the joke | Listen; re-record if you said can't |
| L16 Clerk | "**Research** Geoffrey's book" (script: "We searched") | Wording | Listen; re-record if you said "Research" |
| L06 Curator | Halting: 6 short chunks, 77 wpm, a 7.8 s dead pause (shortened to 1 s in the edit) | Delivery | Optional pickup, the whole line in one flow |
| L37 Dig, L39 Curator | Fast (177 and 185 wpm before slowing; slowed about 12 to 15 percent) | Pace | Optional pickup |
| L38 Doubt | Both takes heard as "Great story sells newspapers" / "Great stories, 7 newspapers" | Wording | Listen to the last take |
| "Cadw" | Heard as Thadou, Cuckoo, Taku, Cacou, Khadou | Say it one way: KAD-oo | Listen that it is the same every time |

## What the edit did
- Cut only at real silences; kept the best attempt of each line (retakes, false starts and stray comments such as "That's cool though" and "Continue from here" were dropped).
- Shortened pauses inside a line longer than 1 s to 1 s (dead air).
- Slowed 14 lines that ran above their character's pace cap, never below 0.85x.
- Evened the four recordings (they were all near -23 dBFS speech) to the weights in `VOICES.md`, then normalised to -16 LUFS.
- Gaps: 0.7 s between lines, 1.8 s between beats, 1.5 s before "Verdict: unproven."

## How distinct are the voices? (`scripts/voice_check.py`)
Untreated: all four within 1.5 semitones of each other (Curator 100.6 Hz, Dig 108.8, Clerk 100.0, Doubt 96.4). Listeners will hear mostly one voice.
Pace is now even (110 to 116 wpm for all four). Pitch movement is narrower than in Part 1 (Curator 3.3 st versus 6.8 st).
Optional treated version (`voiceover-treated.mp3`, made by `voice_treat.py --auto`): Dig +5 st, Clerk +2 st, Doubt -2.5 st from the Curator; every pair at least 2.1 st apart. Measured only; compare it with the untreated file by ear.
