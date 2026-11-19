#!/usr/bin/env python3
"""Builds the clean Part 1 voiceover from the raw recording and writes unit timings.

Usage: python3 scripts/build_vo.py <raw.m4a> <transcript.json> <out_dir>
 - cuts the best take of every script line (retakes dropped), snapping cut points to silence
 - slows only the lines spoken faster than TARGET_WPM (never below 0.85x)
 - adds breathing gaps between lines and longer gaps between beats
 - writes <out_dir>/voiceover.mp3 and <out_dir>/units.json (final-time map used by timing.ts)
"""
import json, subprocess, sys, wave, os
import numpy as np

RAW, TRANSCRIPT, OUT = sys.argv[1:4]
FF = "node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg"
SR = 48000
TARGET_WPM = 135
LEAD = 1.0

# (id, beat, who, [(start, end) windows in the raw recording], gap after in seconds)
U = [
    ("u1", 1, "curator", [(2.1, 7.7)], 1.0),
    ("u2", 1, "curator", [(8.5, 15.5)], 3.2),
    ("u3", 2, "dig", [(16.4, 24.2)], 1.0),
    ("u4", 2, "dig", [(25.2, 32.8)], 1.3),
    ("u5", 2, "clerk", [(35.0, 38.3)], 2.2),
    ("u6", 3, "curator", [(42.0, 50.1)], 0.5),
    ("u7", 3, "curator", [(50.8, 55.8)], 1.0),
    ("u8", 3, "dig", [(57.5, 61.6)], 0.4),
    ("u9", 3, "dig", [(62.3, 64.0)], 1.1),
    ("u10", 3, "doubt", [(65.0, 69.6)], 2.2),
    ("u11", 4, "curator", [(71.8, 76.0)], 0.7),
    ("u12", 4, "curator", [(77.2, 86.2)], 1.1),
    ("u13", 4, "dig", [(86.9, 89.3)], 1.0),
    ("u14", 4, "doubt", [(92.9, 97.5)], 1.1),
    ("u15", 4, "curator", [(98.5, 100.4)], 0.6),
    ("u16", 4, "curator", [(102.4, 110.3)], 0.7),
    ("u17", 4, "curator", [(110.8, 114.8)], 2.4),
    ("u18", 5, "doubt", [(118.9, 124.5)], 1.2),
    ("u19", 5, "clerk", [(126.2, 129.6)], 2.4),
    ("u20", 6, "curator", [(136.8, 147.0)], 0.7),
    ("u21", 6, "curator", [(147.6, 151.7)], 1.1),
    ("u22", 6, "dig", [(153.4, 161.9)], 1.1),
    ("u23", 6, "doubt", [(168.6, 175.6)], 1.1),
    ("u24", 6, "curator", [(178.4, 183.0)], 0.6),
    ("u25", 6, "curator", [(183.3, 190.0)], 2.4),
    ("u26", 7, "clerk", [(193.7, 202.5)], 2.4),
    ("u27", 8, "curator", [(204.0, 210.0)], 1.0),
    ("u28", 8, "curator", [(210.3, 215.6)], 1.8),
    ("u29", 8, "dig", [(216.0, 218.2)], 1.0),
    ("u30", 8, "doubt", [(218.4, 221.4)], 2.4),
    ("u31", 9, "curator", [(222.0, 229.2)], 0.0),
]

os.makedirs(OUT, exist_ok=True)
tmp = os.path.join(OUT, "_raw48k.wav")
subprocess.run([FF, "-y", "-loglevel", "error", "-i", RAW, "-ar", str(SR), "-ac", "1", tmp], check=True)
w = wave.open(tmp)
raw = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
hop = SR // 100
rms = np.array([np.sqrt(np.mean(raw[i : i + hop] ** 2)) for i in range(0, len(raw) - hop, hop)])

words = [x for s in json.load(open(TRANSCRIPT)) for x in s["words"]]


def snap_start(a):
    lo, hi = int((a - 0.25) * 100), int(a * 100)
    seg = rms[lo : hi + 1] + np.linspace(0.002, 0, hi - lo + 1)
    return (lo + int(np.argmin(seg))) / 100


def snap_end(b):
    lo, hi = int(b * 100), int((b + 0.3) * 100)
    seg = rms[lo : hi + 1] + np.linspace(0, 0.002, hi - lo + 1)
    return (lo + int(np.argmin(seg))) / 100


def tempo_ffmpeg(x, f):
    if abs(f - 1) < 0.005:
        return x
    p = os.path.join(OUT, "_t.wav")
    q = os.path.join(OUT, "_t2.wav")
    with wave.open(p, "wb") as o:
        o.setnchannels(1); o.setsampwidth(2); o.setframerate(SR)
        o.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", p, "-filter:a", f"atempo={f:.4f}", q], check=True)
    r = wave.open(q)
    return np.frombuffer(r.readframes(r.getnframes()), dtype=np.int16).astype(np.float32) / 32768


out = [np.zeros(int(LEAD * SR), dtype=np.float32)]
cursor = LEAD
units = []
for uid, beat, who, wins, gap in U:
    pieces, spans = [], []
    for a, b in wins:
        s, e = snap_start(a), snap_end(b)
        spans.append((s, e))
        pieces.append(raw[int(s * SR) : int(e * SR)])
    n = len([x for x in words if any(x["s"] >= a - 0.05 and x["e"] <= b + 0.3 for a, b in wins)])
    dur = sum(e - s for s, e in spans)
    wpm = n / dur * 60
    tempo = min(1.0, max(0.85, TARGET_WPM / wpm)) if wpm > TARGET_WPM else 1.0
    if len(pieces) > 1:
        x = np.concatenate([pieces[0], np.zeros(int(0.05 * SR), dtype=np.float32), pieces[1]])
    else:
        x = pieces[0]
    fade = int(0.012 * SR)
    x = x.copy(); x[:fade] *= np.linspace(0, 1, fade); x[-fade:] *= np.linspace(1, 0, fade)
    x = tempo_ffmpeg(x, tempo)
    start = cursor
    units.append({
        "id": uid, "beat": beat, "who": who, "start": round(start, 3), "end": round(start + len(x) / SR, 3),
        "tempo": round(tempo, 3), "wpm_raw": round(wpm), "wpm_final": round(wpm * tempo),
        "src": [(round(s, 3), round(e, 3)) for s, e in spans],
    })
    out.append(x)
    out.append(np.zeros(int(gap * SR), dtype=np.float32))
    cursor += len(x) / SR + gap

audio = np.concatenate(out)
tmpw = os.path.join(OUT, "_mix.wav")
with wave.open(tmpw, "wb") as o:
    o.setnchannels(1); o.setsampwidth(2); o.setframerate(SR)
    o.writeframes((np.clip(audio, -1, 1) * 32767).astype(np.int16).tobytes())
subprocess.run([
    FF, "-y", "-loglevel", "error", "-i", tmpw,
    "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100", "-codec:a", "libmp3lame", "-b:a", "192k",
    os.path.join(OUT, "voiceover.mp3"),
], check=True)
json.dump({"units": units, "total": round(len(audio) / SR, 3)}, open(os.path.join(OUT, "units.json"), "w"), indent=1)
for f in ("_raw48k.wav", "_t.wav", "_t2.wav", "_mix.wav"):
    p = os.path.join(OUT, f)
    if os.path.exists(p):
        os.remove(p)
print("total seconds", round(len(audio) / SR, 1))
