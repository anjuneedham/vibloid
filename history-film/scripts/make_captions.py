#!/usr/bin/env python3
"""Writes the YouTube caption file (SRT) from public/evidence-room-1/units.json and the spoken text."""
import json, re
D = json.load(open("public/evidence-room-1/units.json")); U = {u["id"]: u for u in D["units"]}
# What is spoken in each clean-edit unit (script wording; where the recording differs from the script, the recording wins).
T = json.load(open("scripts/evidence-room-1-siberian-tomb/spoken-text.json"))
def ts(t):
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h:02d}:{m:02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}"
def chunks(text, lim=76):
    parts = []
    for p in re.split(r"(?<=[.!?:,])\s+", text):
        while len(p) > lim:  # no punctuation to split on: cut at a word near the middle
            ws = p.split(); k = len(ws) // 2
            parts.append(" ".join(ws[:k])); p = " ".join(ws[k:])
        parts.append(p)
    out = []; cur = ""
    for p in parts:
        if cur and len(cur) + 1 + len(p) > lim: out.append(cur); cur = p
        else: cur = (cur + " " + p).strip()
    if cur: out.append(cur)
    return out
def wrap(c, maxc=44):
    if len(c) <= maxc: return c
    ws = c.split(); best = None
    for i in range(1, len(ws)):
        a, b = " ".join(ws[:i]), " ".join(ws[i:])
        if len(a) <= maxc and len(b) <= maxc and (best is None or abs(len(a) - len(b)) < best[0]): best = (abs(len(a) - len(b)), a + "\n" + b)
    return best[1] if best else c
cues = []
for uid, txt in T.items():
    u = U[uid]; cs = chunks(txt); tot = sum(len(c) for c in cs); t = u["start"]
    for c in cs:
        d = (u["end"] - u["start"]) * len(c) / tot
        cues.append((t, t + d, wrap(c))); t += d
with open("out/package/past-tense-evidence-room-1.srt", "w") as f:
    for i, (a, b, c) in enumerate(cues, 1): f.write(f"{i}\n{ts(a)} --> {ts(max(a + .8, b - .05))}\n{c}\n\n")
print(len(cues), "caption cues; longest line", max(len(l) for _, _, c in cues for l in c.split("\n")))
