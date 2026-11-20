#!/usr/bin/env python3
"""Mixes the Evidence Room Part 2 soundtrack: the owner's voices + medieval music bed + sound effects in the gaps.

Usage:
  python3 scripts/mix_soundtrack_2.py long  [--duration SECONDS]   -> public/evidence-room-2/final-audio.mp3
  python3 scripts/mix_soundtrack_2.py short                          -> public/evidence-room-2/short-final-audio.mp3

Inputs
  voice   public/evidence-room-2/voiceover.mp3 (long) or short-voiceover.mp3 (short)
  timing  src/films/evidence-room-2/units.json (line start/end seconds); the Short uses the same layout as build_short_2.py
  cues    scripts/evidence-room-2-caerleon/sfx-cues-long.json / sfx-cues-short.json (which sound goes after which line)
  music   assets/music/*.mp3 (CC0, see ASSETS.md); sound effects are synthesised by scripts/make_sfx.py

How it sounds
  * The music sits under the voice and rises about 7 dB in every pause (it "ducks" while someone speaks), so the gaps are never dead.
  * Sound effects are placed after specific lines, inside the pauses. Anything still ringing when the next line starts is ducked under it.
  * A very quiet stone-hall fire crackle runs underneath so the room never goes digitally silent.
  * The result is normalised to -16 LUFS, true peak -1.5 dB (YouTube-friendly).
"""
import json
import os
import subprocess
import sys
import wave

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import make_sfx as sfx  # noqa: E402

SR = sfx.SR
FF = "node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg"
if not os.path.exists(FF):
    FF = "ffmpeg"
CUES = "scripts/evidence-room-2-caerleon"
film = sys.argv[1] if len(sys.argv) > 1 else "long"
assert film in ("long", "short")
duration_arg = float(sys.argv[sys.argv.index("--duration") + 1]) if "--duration" in sys.argv else None

# peak level (dBFS, before the final loudness step) of each effect; a cue's "db" is added to this
PEAK_DB = {"bell": -15, "gavel": -10, "stamp": -9, "quill": -23, "page": -22, "lute_up": -16, "lute_sad": -16,
           "lute_tick": -17, "timpani": -13, "clunk": -15, "gong": -17, "pin": -18}
CORE = {"gavel": 0.45, "stamp": 0.25, "quill": 0.55, "page": 0.45, "lute_up": 0.5, "lute_sad": 0.65, "lute_tick": 0.15,
        "timpani": 0.2, "clunk": 0.25, "gong": 0.2, "pin": 0.1, "bell": 0.1}  # seconds that must sit inside the gap

MUSIC_BELOW_VOICE_DB = 11.0   # music level in the gaps, under the voice's speech level
DUCK_DB = 6.0                 # extra dip while someone speaks
SFX_DUCK_DB = 12.0            # sound-effect tails still ringing under speech
CROSSFADE = 6.0


def dec(path, ch=1):
    tmp = "/tmp/_mix_dec.wav"
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", path, "-ar", str(SR), "-ac", str(ch), tmp], check=True)
    w = wave.open(tmp)
    a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    return a.reshape(-1, ch) if ch > 1 else a


def rms_db(x, active_only=False):
    if active_only:
        x = x[np.abs(x) > 0.02]
    return 20 * np.log10(np.sqrt(np.mean(x**2)) + 1e-9)


# ------------------------------------------------------------------ timeline of lines
if film == "long":
    D = json.load(open("src/films/evidence-room-2/units.json"))
    lines = {u["id"]: (u["start"], u["end"]) for u in D["units"]}
    voice = dec("public/evidence-room-2/voiceover.mp3")
    cues = json.load(open(f"{CUES}/sfx-cues-long.json"))["cues"]
    music_files = ["the-old-tower-inn", "harvest-season", "the-bards-tale"]
    out_path = "public/evidence-room-2/final-audio.mp3"
    total = duration_arg or (len(voice) / SR + 14.0)
else:
    D = json.load(open("src/films/evidence-room-2/units.json"))
    U = {u["id"]: u for u in D["units"]}
    ORDER = ["L02", "L04", "L09", "L10", "L17", "L26", "L28", "L36", "L37", "L38"]
    LEAD, TAIL, MAX_SECONDS, VERDICT_PAUSE = 0.3, 2.4, 57.5, 0.5  # keep in sync with build_short_2.py
    durs = [U[i]["end"] - U[i]["start"] for i in ORDER]
    gap = max(0.12, min(0.45, (MAX_SECONDS - LEAD - TAIL - VERDICT_PAUSE - sum(durs)) / (len(ORDER) - 1)))
    lines, cur = {}, LEAD
    for k, i in enumerate(ORDER):
        if i == "L36":
            cur += VERDICT_PAUSE
        lines[i] = (cur, cur + durs[k])
        cur += durs[k] + gap
    voice = dec("public/evidence-room-2/short-voiceover.mp3")
    cues = json.load(open(f"{CUES}/sfx-cues-short.json"))["cues"]
    music_files = ["minstrel-dance"]
    out_path = "public/evidence-room-2/short-final-audio.mp3"
    total = duration_arg or len(voice) / SR

N = int(total * SR)
voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]
voice_db = rms_db(voice, active_only=True)
spans = sorted(lines.values())


# ------------------------------------------------------------------ ducking envelopes (control rate 200 Hz, then interpolated)
def duck_env(depth_db, attack=0.12, release=0.5, pad_before=0.10, pad_after=0.25):
    cr = 200
    n = int(total * cr) + 2
    target = np.ones(n)
    g = 10 ** (-depth_db / 20)
    for a, b in spans:
        target[max(0, int((a - pad_before) * cr)) : min(n, int((b + pad_after) * cr))] = g
    out = np.empty(n)
    out[0] = 1.0
    ka, kr = np.exp(-1 / (attack * cr)), np.exp(-1 / (release * cr))
    for i in range(1, n):
        k = ka if target[i] < out[i - 1] else kr
        out[i] = target[i] + (out[i - 1] - target[i]) * k
    return np.interp(np.arange(N) / SR, np.arange(n) / cr, out).astype(np.float32)


env_music, env_sfx = duck_env(DUCK_DB), duck_env(SFX_DUCK_DB, attack=0.08, release=0.35)

# ------------------------------------------------------------------ music bed (stereo, equal-power crossfades)
tracks = [dec(f"assets/music/{m}.mp3", 2) for m in music_files]
tracks = [t * (10 ** ((-20.0 - rms_db(t)) / 20)) for t in tracks]  # same average level for every track
cf = int(CROSSFADE * SR)
bed = tracks[0]
for t in tracks[1:]:
    a, b = bed[-cf:], t[:cf]
    ramp = np.linspace(0, np.pi / 2, cf)[:, None]
    bed = np.concatenate([bed[:-cf], a * np.cos(ramp) + b * np.sin(ramp), t[cf:]])
if len(bed) < N:  # never silent: loop the last track's start under the end if the music is shorter than the film
    extra = tracks[-1]
    bed = np.concatenate([bed[:-cf], bed[-cf:] * np.cos(np.linspace(0, np.pi / 2, cf))[:, None] + extra[:cf] * np.sin(np.linspace(0, np.pi / 2, cf))[:, None], extra[cf:]])
bed = np.pad(bed, ((0, max(0, N - len(bed))), (0, 0)))[:N]
bed *= np.minimum(1, np.linspace(0, 1, N) * total / 3.0)[:, None]  # 3 s fade in
bed *= np.minimum(1, (total - np.arange(N) / SR) / 5.0)[:, None]   # 5 s fade out
bed = bed * (10 ** ((voice_db - MUSIC_BELOW_VOICE_DB - rms_db(bed)) / 20)) * env_music[:, None]

# ------------------------------------------------------------------ sound effects
fx = np.zeros(N + 10 * SR, dtype=np.float32)
log, warns = [], []
for c in cues:
    if "abs" in c:
        t0 = c["abs"]
        nxt = None
    else:
        a, b = lines[c["after"]]
        t0 = b + c["at"]
        later = [s for s, _ in spans if s > b + 0.01]
        nxt = min(later) if later else None
    if t0 >= total:
        continue
    x = sfx.LIB[c["sfx"]](**c.get("args", {}))
    x = x * (10 ** ((PEAK_DB[c["sfx"]] + c.get("db", 0)) / 20))
    i = int(t0 * SR)
    fx[i : i + len(x)] += x[: len(fx) - i]
    room = (nxt - t0) if nxt else None
    log.append((t0, c["sfx"], room))
    if room is not None and CORE[c["sfx"]] > room - 0.04:
        warns.append(f"{c['sfx']} after {c.get('after')} at {t0:.2f}s needs {CORE[c['sfx']]:.2f}s but only {room:.2f}s before the next line")
fx = fx[:N] * env_sfx

# fire crackle under everything, very quiet
amb = sfx.crackle(total)[:N]
amb = amb * (10 ** ((voice_db - 34 - rms_db(amb)) / 20))

# ------------------------------------------------------------------ mix and master
mix = np.stack([voice + fx + amb, voice + fx + amb], axis=1) + bed
tmp = "/tmp/_mix_stereo.wav"
with wave.open(tmp, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
master = out_path.replace(".mp3", "-master.wav")  # lossless 48 kHz master: encode the video's AAC from this, once
subprocess.run([FF, "-y", "-loglevel", "error", "-i", tmp, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "48000", "-ac", "2", "-c:a", "pcm_s16le", master], check=True)
subprocess.run([FF, "-y", "-loglevel", "error", "-i", master, "-codec:a", "libmp3lame", "-b:a", "192k", out_path], check=True)

print(f"{film}: {total:.1f}s, voice speech level {voice_db:.1f} dBFS, music {voice_db - MUSIC_BELOW_VOICE_DB:.1f} in gaps / {voice_db - MUSIC_BELOW_VOICE_DB - DUCK_DB:.1f} under speech")
print(f"{len(log)} sound effects placed")
for t0, name, room in sorted(log):
    print(f"  {t0:7.2f}s {name:10s} room before next line: {'-' if room is None else f'{room:.2f}s'}")
for w_ in warns:
    print("WARNING:", w_)
print("wrote", out_path, "and", master)
