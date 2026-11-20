#!/usr/bin/env python3
"""Optional light 'character treatment' for a one-performer voiceover.

Usage: python3 scripts/voice_treat.py <voiceover.mp3|wav> <units.json> <out.mp3> [--strength 0..1] [--auto]

Applies a small, different pitch + tone chain to each character's lines so one performer reads as four people.
It keeps every line's start, end and length, so timing.ts and the animation do not change.
Pitch is shifted by resampling and then restoring length with atempo, so the shift is small and character-like,
not a chipmunk. Keep it subtle: the performance (pace, pitch movement, pauses) must still do most of the work.

--strength scales the semitone shifts (1.0 = the values below, 0.5 = half as much).
--auto measures each voice's median pitch in the file and shifts it to the target gap from the Curator (Dig +5, Clerk +2,
Doubt -2.5 semitones, the targets in VOICES.md), so it works whatever your natural pitch offsets are. Shifts are clamped to +-6.
The result is for the owner's ears to judge. Always compare with the untreated take.
"""
import json
import subprocess
import sys
import wave

import numpy as np

SR = 48000
FF = "ffmpeg"

# semitone shift, then a tone/EQ chain applied after the shift
CHAINS = {
    "curator": {"st": 0.0, "eq": "equalizer=f=140:t=q:w=1.2:g=2.5,highshelf=f=4500:g=-1"},
    "dig": {"st": 6.0, "eq": "highshelf=f=3000:g=2.5,equalizer=f=250:t=q:w=1.0:g=-2"},
    "doubt": {"st": -2.5, "eq": "highshelf=f=3500:g=-3,volume=-1.5dB"},
    "clerk": {"st": 3.0, "eq": "highpass=f=130,lowpass=f=7000,equalizer=f=2500:t=q:w=1.0:g=2,volume=2dB"},
}


def decode(path):
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", path, "-ar", str(SR), "-ac", "1", "/tmp/_vt_in.wav"], check=True)
    w = wave.open("/tmp/_vt_in.wav")
    return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768


def write_wav(path, x):
    w = wave.open(path, "wb")
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    w.close()


def treat(seg, st, eq):
    write_wav("/tmp/_vt_seg.wav", seg)
    ratio = 2 ** (st / 12)
    # asetrate shifts pitch and speed together; atempo gives the speed back so the length is unchanged
    chain = f"asetrate={SR * ratio:.1f},aresample={SR},atempo={1 / ratio:.5f}"
    if eq:
        chain += "," + eq
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", "/tmp/_vt_seg.wav", "-af", chain, "-ar", str(SR), "-ac", "1", "/tmp/_vt_out.wav"], check=True)
    w = wave.open("/tmp/_vt_out.wav")
    y = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    if len(y) < len(seg):
        y = np.pad(y, (0, len(seg) - len(y)))
    return y[: len(seg)]


TARGET_GAP = {"curator": 0.0, "dig": 5.0, "doubt": -2.5, "clerk": 2.0}


def auto_shifts(src, units_path):
    """Semitone shift per voice = target gap from the Curator minus the gap already in the recording."""
    import os
    import numpy as np

    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import voice_check as vc

    x = vc.load(src)
    f = {}
    for u in json.load(open(units_path))["units"]:
        f.setdefault(u["who"], []).extend(vc.f0_frames(x[int(u["start"] * vc.SR) : int(u["end"] * vc.SR)]))
    med = {k: float(np.median(v)) for k, v in f.items() if len(v) > 30}
    ref = med["curator"]
    out = {}
    for who, hz in med.items():
        natural = 12 * np.log2(hz / ref)
        out[who] = max(-6.0, min(6.0, TARGET_GAP[who] - natural))
        print(f"{who:8s} natural {hz:6.1f} Hz ({natural:+.1f} st vs Curator) -> shift {out[who]:+.1f} st")
    return out


def main():
    src, units_path, out = sys.argv[1:4]
    strength = float(sys.argv[sys.argv.index("--strength") + 1]) if "--strength" in sys.argv else 1.0
    shifts = auto_shifts(src, units_path) if "--auto" in sys.argv else {}
    x = decode(src)
    y = x.copy()
    for u in json.load(open(units_path))["units"]:
        c = CHAINS.get(u["who"])
        if not c:
            continue
        c = dict(c, st=shifts.get(u["who"], c["st"]))
        a, b = int(u["start"] * SR), int(u["end"] * SR)
        fade = int(0.01 * SR)
        seg = treat(x[a:b], c["st"] * strength, c["eq"])
        seg[:fade] *= np.linspace(0, 1, fade)
        seg[-fade:] *= np.linspace(1, 0, fade)
        y[a:b] = seg
    write_wav("/tmp/_vt_final.wav", y)
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", "/tmp/_vt_final.wav", "-codec:a", "libmp3lame", "-b:a", "192k", out], check=True)
    print("wrote", out)


if __name__ == "__main__":
    main()
