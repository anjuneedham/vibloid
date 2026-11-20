#!/usr/bin/env python3
"""ESTIMATED line timings for Evidence Room Part 2 until the owner records.

Writes src/films/evidence-room-2/units.json in the SAME shape build_vo.py writes
({"units": [{id, beat, who, start, end, ...}], "total"}) plus "estimated": true.
To swap in the real recording: build the clean voiceover with build_vo.py (unit ids "L01".."L39",
or "u1".."u39" in script order), then copy its units.json over src/films/evidence-room-2/units.json
and put the mp3 at public/evidence-room-2/voiceover.mp3. Nothing else changes.

Pace: Curator 120, Dig 128, Doubt 112, Clerk 100 wpm. 0.35 s per slash pause.
Gaps: 0.7 s between lines, 1.8 s between beats, 1.5 s before L36. 1.0 s lead-in.
(Tightened from 1.0 / 2.5 so the estimate lands inside 4:30 to 5:30; the script is unchanged.)
"""
import json, re
SCRIPT = "scripts/evidence-room-2-caerleon/script.md"
OUT = "src/films/evidence-room-2/units.json"
EP = json.load(open("src/films/evidence-room-2/episode.json"))
WPM = {"curator": 120, "dig": 128, "doubt": 112, "clerk": 100}
LEAD, GAP, BEAT_GAP, PRE_VERDICT, SLASH = 1.0, 0.7, 1.8, 1.5, 0.35

lines, beat = [], 0
for row in open(SCRIPT):
    m = re.match(r"## BEAT (\d+)", row)
    if m:
        beat = int(m.group(1))
        continue
    m = re.match(r"(L\d\d) \[(\w+)\] (.*)", row.strip())
    if m and beat:
        lid, who, text = m.group(1), m.group(2).lower(), m.group(3)
        text = text.replace("[S] ", "")
        if lid == "L39":
            text = EP["teaser"]
        lines.append((lid, beat, who, text))

t, units, prev_beat = LEAD, [], None
for lid, b, who, text in lines:
    if prev_beat is not None:
        t += PRE_VERDICT if lid == "L36" else (BEAT_GAP if b != prev_beat else GAP)
    words = len([w for w in text.split() if w != "/"])
    slashes = text.count(" / ")
    dur = words / WPM[who] * 60 + slashes * SLASH
    units.append({"id": lid, "beat": b, "who": who, "start": round(t, 3), "end": round(t + dur, 3), "words": words, "estimated": True})
    t += dur
    prev_beat = b
json.dump({"estimated": True, "units": units, "total": round(t, 3)}, open(OUT, "w"), indent=1)
print(len(units), "lines, speech ends at", round(t, 1), "s")
