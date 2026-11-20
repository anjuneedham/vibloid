#!/usr/bin/env python3
"""Writes the YouTube captions file and chapter list for Evidence Room Part 2 from the real timing.

Usage: python3 scripts/make_srt_2.py
Reads  src/films/evidence-room-2/units.json (real line times) and scripts/evidence-room-2-caerleon/script.md (script wording)
Writes public/evidence-room-2/captions-en.srt and public/evidence-room-2/chapters.json
Captions use the script's own wording (the owner's rule), split at the slash pauses, timed in proportion to the words.
"""
import json
import re

units = json.load(open("src/films/evidence-room-2/units.json"))["units"]
U = {u["id"]: u for u in units}
NAME = {"curator": "Curator", "dig": "Dig", "doubt": "Doubt", "clerk": "Clerk"}
lines, beat, beat_titles = [], 0, {}
for raw in open("scripts/evidence-room-2-caerleon/script.md", encoding="utf-8"):
    m = re.match(r"^## BEAT (\d+): ([^(|]+)", raw)
    if m:
        beat = int(m.group(1)); beat_titles[beat] = m.group(2).strip().title(); continue
    m = re.match(r"^(L\d\d) \[(\w+)\](?: \[S\])? (.*)$", raw.strip())
    if m:
        lines.append((m.group(1), m.group(2).lower(), m.group(3), beat))


def ts(t):
    t = max(0, t); h, r = divmod(t, 3600); m, s = divmod(r, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}"


cues = []
for lid, who, text, b in lines:
    u = U[lid]
    segs = [x.strip().replace('"', "“", 1) if x.count('"') == 1 else x.strip() for x in text.split(" / ")]
    segs = [re.sub(r'"([^"]*)"', "“\\1”", x) for x in segs]
    # merge tiny segments so each cue is at least ~2 words
    merged = []
    for x in segs:
        if merged and len(x.split()) < 3:
            merged[-1] += " " + x
        else:
            merged.append(x)
    total = sum(len(x.split()) for x in merged)
    t0, dur = u["start"], u["end"] - u["start"]
    for k, x in enumerate(merged):
        w = len(x.split())
        t1 = t0 + dur * w / total
        label = f"[{NAME[who]}] " if k == 0 else ""
        body = label + x
        if len(body) > 42:  # two balanced lines
            words = body.split(); best = min(range(1, len(words)), key=lambda i: abs(len(" ".join(words[:i])) - len(" ".join(words[i:]))))
            body = " ".join(words[:best]) + "\n" + " ".join(words[best:])
        end = min(t1 + (0.3 if k == len(merged) - 1 else 0.0), t1 + 0.3)
        cues.append((t0, end, body))
        t0 = t1
with open("public/evidence-room-2/captions-en.srt", "w", encoding="utf-8") as f:
    for i, (a, z, body) in enumerate(cues, 1):
        f.write(f"{i}\n{ts(a)} --> {ts(z)}\n{body}\n\n")

# chapters: each beat starts half a second before its first line (first chapter at 0:00); YouTube needs >= 10 s per chapter
first = {}
for lid, who, text, b in lines:
    first.setdefault(b, U[lid]["start"])
ch = []
for b in sorted(first):
    ch.append({"beat": b, "t": 0.0 if b == 1 else round(max(0.0, first[b] - 0.5), 1), "title": beat_titles[b]})
json.dump(ch, open("public/evidence-room-2/chapters.json", "w"), indent=1)
fmt = lambda t: f"{int(t // 60)}:{int(t % 60):02d}"
print(len(cues), "caption cues")
for c in ch:
    print(fmt(c["t"]), c["title"])
