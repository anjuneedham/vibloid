#!/usr/bin/env python3
"""Measures how distinct the four Evidence Room voices are in a finished voiceover.

Usage: python3 scripts/voice_check.py <voiceover.mp3|wav> <units.json>

units.json is the file written by build_vo.py: {"units": [{"who", "start", "end", "wpm_final"}, ...]}.
Reports, per character: median pitch (Hz), pitch movement (semitone spread), loudness and pace,
then the pitch gap between every pair of characters and a PASS / FAIL against the targets in VOICES.md.

The pitch tracker is a simple autocorrelation estimate: good enough to compare characters recorded by the
same person in the same room, not a lab instrument. Judge the final result with your ears too.
"""
import json
import subprocess
import sys
import wave
from itertools import combinations

import numpy as np

SR = 16000

# Targets are expressed relative to the Curator, who is the performer's natural low speaking voice.
# gap_st: how many semitones this character's median pitch should sit above (+) or below (-) the Curator.
TARGETS = {
    "curator": {"gap_st": 0.0, "spread_max": 9.0, "wpm": (115, 125), "loud_db": 0.0},
    "dig": {"gap_st": 5.0, "spread_max": 11.0, "wpm": (120, 135), "loud_db": 2.0},
    "doubt": {"gap_st": -2.5, "spread_max": 4.5, "wpm": (105, 120), "loud_db": -1.5},
    "clerk": {"gap_st": 2.0, "spread_max": 3.5, "wpm": (95, 110), "loud_db": -3.0},
}
GAP_TOLERANCE_ST = 1.5  # a character passes if its gap is within this of the target
MIN_PAIR_GAP_ST = 2.0  # no two characters closer than this in median pitch


def load(path):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", path, "-ar", str(SR), "-ac", "1", "/tmp/_vc.wav"], check=True)
    w = wave.open("/tmp/_vc.wav")
    return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768


def f0_frames(seg):
    out = []
    n, hop = int(0.04 * SR), int(0.01 * SR)
    lo, hi = int(SR / 400), int(SR / 70)
    for i in range(0, len(seg) - n, hop):
        f = seg[i : i + n]
        f = f - f.mean()
        if np.sqrt((f**2).mean()) < 0.01:
            continue
        ac = np.correlate(f, f, "full")[n - 1 :]
        if ac[0] <= 0:
            continue
        ac = ac / ac[0]
        k = lo + int(np.argmax(ac[lo:hi]))
        if ac[k] > 0.5:
            out.append(SR / k)
    return out


def main():
    audio, units_path = sys.argv[1:3]
    x = load(audio)
    units = json.load(open(units_path))["units"]
    acc = {}
    for u in units:
        seg = x[int(u["start"] * SR) : int(u["end"] * SR)]
        a = acc.setdefault(u["who"], {"f0": [], "loud": [], "wpm": []})
        a["f0"] += f0_frames(seg)
        v = seg[np.abs(seg) > 0.01]
        if len(v):
            a["loud"].append(20 * np.log10(np.sqrt((v**2).mean())))
        if u.get("wpm_final"):
            a["wpm"].append(u["wpm_final"])

    stats = {}
    for who, a in acc.items():
        f = np.array(a["f0"])
        if len(f) < 30:
            continue
        st = 12 * np.log2(f / np.median(f))
        stats[who] = {
            "f0": float(np.median(f)),
            "spread": float(np.percentile(st, 90) - np.percentile(st, 10)),
            "loud": float(np.mean(a["loud"])),
            "wpm": float(np.mean(a["wpm"])) if a["wpm"] else float("nan"),
        }

    ref = stats.get("curator")
    print(f"{'voice':8s} {'pitch Hz':>9s} {'vs Curator':>11s} {'movement':>9s} {'loud dB':>8s} {'wpm':>5s}   result")
    fails = 0
    for who, s in stats.items():
        gap = 12 * np.log2(s["f0"] / ref["f0"]) if ref else 0.0
        t = TARGETS.get(who)
        notes = []
        if t and ref:
            if abs(gap - t["gap_st"]) > GAP_TOLERANCE_ST:
                notes.append(f"pitch gap should be {t['gap_st']:+.0f} st")
            if s["spread"] > t["spread_max"]:
                notes.append(f"movement above {t['spread_max']:.1f} st")
            if not (t["wpm"][0] <= s["wpm"] <= t["wpm"][1]):
                notes.append(f"pace should be {t['wpm'][0]}-{t['wpm'][1]}")
        fails += bool(notes)
        print(f"{who:8s} {s['f0']:9.1f} {gap:+9.1f}st {s['spread']:7.1f}st {s['loud']:8.1f} {s['wpm']:5.0f}   {'PASS' if not notes else 'FIX: ' + '; '.join(notes)}")

    print("\nPitch gap between each pair (semitones):")
    pair_fail = 0
    for a, b in combinations(stats, 2):
        g = abs(12 * np.log2(stats[a]["f0"] / stats[b]["f0"]))
        flag = "" if g >= MIN_PAIR_GAP_ST else "   <-- too close, listeners will hear one voice"
        pair_fail += g < MIN_PAIR_GAP_ST
        print(f"  {a:8s} vs {b:8s} {g:4.1f}{flag}")
    print("\nOVERALL:", "PASS" if not fails and not pair_fail else f"{fails} voice(s) to fix, {pair_fail} pair(s) too close")


if __name__ == "__main__":
    main()
