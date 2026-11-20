#!/usr/bin/env python3
"""Cuts the Part 2 Short's voiceover from the finished long voiceover (run after the owner records).

Usage: python3 scripts/build_short_2.py
Reads public/evidence-room-2/voiceover.mp3 + src/films/evidence-room-2/units.json and writes
public/evidence-room-2/short-voiceover.mp3. Uses the SAME order, lead, gaps and tail as
src/films/evidence-room-short-2/timing.ts (keep the constants below in sync with that file),
so the Short's animation needs no timing edit.
"""
import json, subprocess, wave, os
import numpy as np

FF = "node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg"
SR = 44100
ORDER = ["L02", "L04", "L09", "L10", "L17", "L26", "L28", "L36", "L37", "L38"]
LEAD, TAIL, MAX_SECONDS, VERDICT_PAUSE = 0.3, 2.4, 57.5, 0.5

D = json.load(open("src/films/evidence-room-2/units.json"))
if D.get("estimated"):
    raise SystemExit("units.json is still the ESTIMATE: record and build the long voiceover first.")
norm = lambda i: f"L{int(i[1:]):02d}" if i.startswith("u") else i
U = {norm(u["id"]): u for u in D["units"]}
os.makedirs("out", exist_ok=True)
subprocess.run([FF, "-y", "-loglevel", "error", "-i", "public/evidence-room-2/voiceover.mp3", "-ar", str(SR), "-ac", "1", "out/_vo2.wav"], check=True)
w = wave.open("out/_vo2.wav")
a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
durs = [U[i]["end"] - U[i]["start"] for i in ORDER]
gap = max(0.12, min(0.45, (MAX_SECONDS - LEAD - TAIL - VERDICT_PAUSE - sum(durs)) / (len(ORDER) - 1)))
parts = [np.zeros(int(LEAD * SR), dtype=np.float32)]
for k, i in enumerate(ORDER):
    if i == "L36":
        parts.append(np.zeros(int(VERDICT_PAUSE * SR), dtype=np.float32))
    u = U[i]
    x = a[int(u["start"] * SR): int(u["end"] * SR)].copy()
    f = int(0.012 * SR); x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
    parts.append(x)
    if k < len(ORDER) - 1:
        parts.append(np.zeros(int(gap * SR), dtype=np.float32))
parts.append(np.zeros(int(TAIL * SR), dtype=np.float32))
audio = np.concatenate(parts)
with wave.open("out/_short2.wav", "wb") as o:
    o.setnchannels(1); o.setsampwidth(2); o.setframerate(SR); o.writeframes((np.clip(audio, -1, 1) * 32767).astype(np.int16).tobytes())
subprocess.run([FF, "-y", "-loglevel", "error", "-i", "out/_short2.wav", "-codec:a", "libmp3lame", "-b:a", "192k", "public/evidence-room-2/short-voiceover.mp3"], check=True)
os.remove("out/_vo2.wav"); os.remove("out/_short2.wav")
print("short seconds", round(len(audio) / SR, 2), "gap", round(gap, 3))
