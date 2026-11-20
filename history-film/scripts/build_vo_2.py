#!/usr/bin/env python3
"""Picks the best take of every Evidence Room line from one recording per character, and builds the clean voiceover.

Usage: python3 scripts/build_vo_2.py <out_dir> [--report-only]

Inputs (relative to history-film/):
  recordings/evidence-room-2/<who>.m4a                      one raw file per character (curator, dig, doubt, clerk)
  scripts/evidence-room-2-caerleon/raw-transcripts/<who>.chunks.json  speech chunks with their own transcripts (scripts/transcribe_chunks.py)
  scripts/evidence-room-2-caerleon/script.md                the approved script (lines L01..L39)

What it does
  1. Finds every attempt at every line by fuzzy-matching the script text against runs of consecutive speech chunks
     (letters only, numbers spoken out), so retakes, false starts and stray comments are separated. Chunk edges are
     real silences found from the audio, so every cut lands between words.
  2. Scores each attempt: text match, recogniser confidence, hesitations inside the line, pace against the
     character's target, and a small bonus for later attempts (people improve with practice).
  3. Cuts the winner (cut points snapped to the quietest moment next to the words), evens out each character's
     level, slows only lines that run well above the character's target pace (never below 0.85x),
     adds breathing gaps, and writes <out_dir>/voiceover.mp3 and <out_dir>/units.json (same format as Part 1).
  4. Writes a take report (<out_dir>/take-report.md) listing every attempt, the choice, and anything to check by ear.
"""
import json
import os
import re
import subprocess
import sys
import wave
from difflib import SequenceMatcher

import numpy as np

OUT = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else "public/evidence-room-2"
REPORT_ONLY = "--report-only" in sys.argv
REC = "recordings/evidence-room-2"
TX = "scripts/evidence-room-2-caerleon/raw-transcripts"
SCRIPT = "scripts/evidence-room-2-caerleon/script.md"
FF = "node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg"
if not os.path.exists(FF):
    FF = "ffmpeg"
SR = 48000
LEAD = 1.0
GAP_IN_BEAT = 0.7
GAP_BETWEEN_BEATS = 1.8
GAP_BEFORE_VERDICT = 1.5  # gap after L35, before "Verdict: unproven."
MAX_INNER_PAUSE = 1.0  # pauses inside a line longer than this are shortened to it (dead air, reading ahead)

# per-character pace window (words per minute) and the pace above which a line is slowed
PACE = {"curator": (115, 125, 135), "dig": (120, 135, 140), "doubt": (105, 120, 125), "clerk": (95, 110, 120)}
# target speech level (dBFS RMS of speech) so the mix has the weight the voice bible asks for
LEVEL_DB = {"curator": -20.0, "dig": -18.0, "doubt": -21.5, "clerk": -23.0}

# ------------------------------------------------------------------ script
lines = []  # dicts: id, who, text, beat, slashes
beat = 0
for raw in open(SCRIPT, encoding="utf-8"):
    m = re.match(r"^## BEAT (\d+)", raw)
    if m:
        beat = int(m.group(1))
        continue
    m = re.match(r"^(L\d\d) \[(\w+)\](?: \[S\])? (.*)$", raw.strip())
    if m:
        text = m.group(3)
        lines.append({"id": m.group(1), "who": m.group(2).lower(), "text": text, "beat": beat, "slashes": text.count(" / ")})
assert len(lines) == 39, f"expected 39 lines, found {len(lines)}"

# ------------------------------------------------------------------ text normalisation
ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()
ORD = {"one": "first", "two": "second", "three": "third", "five": "fifth", "eight": "eighth", "nine": "ninth", "twelve": "twelfth"}


def below100(n):
    return ONES[n] if n < 20 else TENS[n // 10] + ("" if n % 10 == 0 else " " + ONES[n % 10])


def num_words(n):
    if 1100 <= n <= 2099 and n % 100 != 0:
        return below100(n // 100) + " " + below100(n % 100)
    if 1000 < n < 2100 and n % 100 == 0:
        return below100(n // 100) + " hundred"
    if n < 100:
        return below100(n)
    if n < 1000:
        return ONES[n // 100] + " hundred" + ("" if n % 100 == 0 else " " + below100(n % 100))
    return num_words(n // 1000) + " thousand" + ("" if n % 1000 == 0 else " " + num_words(n % 1000))


def letters(tok):
    t = tok.lower().strip()
    m = re.fullmatch(r"(\d+)(st|nd|rd|th)", t)
    if m:
        w = num_words(int(m.group(1))).split()
        w[-1] = ORD.get(w[-1], w[-1] + ("th" if not w[-1].endswith("y") else "ieth").replace("yth", "ieth"))
        return re.sub(r"[^a-z]", "", "".join(w))
    t = t.replace(",", "")
    t = re.sub(r"\d+", lambda x: " " + num_words(int(x.group(0))) + " ", t)
    return re.sub(r"[^a-z]", "", t)


def script_letters(text):
    return letters_join([w for w in text.replace(" / ", " ").split()])


def letters_join(toks):
    return "".join(letters(t) for t in toks)


for l in lines:
    l["target"] = script_letters(l["text"])
    l["nwords"] = len([w for w in l["text"].replace(" / ", " ").split()])


# ------------------------------------------------------------------ audio
def decode(who):
    tmp = f"/tmp/_vo2_{who}.wav"
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", f"{REC}/{who}.m4a", "-ar", str(SR), "-ac", "1", tmp], check=True)
    w = wave.open(tmp)
    return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768


audio, rms, chunks = {}, {}, {}
HOP = SR // 100
for who in PACE:
    audio[who] = decode(who)
    a = audio[who]
    rms[who] = np.array([np.sqrt(np.mean(a[i : i + HOP] ** 2)) for i in range(0, len(a) - HOP, HOP)])
    chunks[who] = [c for c in json.load(open(f"{TX}/{who}.chunks.json"))["chunks"] if c["text"].strip()]

# ------------------------------------------------------------------ find every attempt
MAX_RUN = 9  # a line is at most this many consecutive chunks
cands = {}  # line id -> list of takes
for who in PACE:
    C = chunks[who]
    toks = [letters_join(c["text"].split()) for c in C]
    for l in [x for x in lines if x["who"] == who]:
        found = []
        tgt = l["target"]
        n = l["nwords"]
        for i in range(len(C)):
            acc = ""
            for j in range(i, min(len(C), i + MAX_RUN)):
                acc += toks[j]
                if not acc or len(acc) > 1.4 * len(tgt) + 4:
                    break
                if len(acc) < 0.6 * len(tgt) - 3:
                    continue
                sm = SequenceMatcher(None, acc, tgt)
                if sm.real_quick_ratio() < 0.6 or sm.quick_ratio() < 0.65:
                    continue
                r = sm.ratio()
                if r >= (0.8 if n <= 3 else 0.7):
                    found.append((r, i, j + 1))
        found.sort(reverse=True)
        chosen_runs = []
        for r, i, j in found:
            if all(j <= c["j"] or i >= c["j2"] for c in [{"j": x["i"], "j2": x["j"]} for x in chosen_runs]):
                chosen_runs.append({"ratio": r, "i": i, "j": j})
        chosen_runs.sort(key=lambda c: c["i"])
        for idx, c in enumerate(chosen_runs):
            run = C[c["i"] : c["j"]]
            c["start"], c["end"] = run[0]["s"], run[-1]["e"]
            c["text"] = " ".join(x["text"] for x in run)
            c["prob"] = float(np.mean([x["prob"] for x in run]))
            gaps = [run[k + 1]["s"] - run[k]["e"] for k in range(len(run) - 1)]
            c["maxgap"] = max(gaps) if gaps else 0.0
            c["gaps"] = gaps
            c["wpm"] = n / max(0.3, c["end"] - c["start"]) * 60
            c["order"] = idx
        cands[l["id"]] = chosen_runs


# ------------------------------------------------------------------ score and choose
def score(l, c, total):
    lo, hi, _ = PACE[l["who"]]
    allowed = 0.5 + 0.7 * l["slashes"]
    s = 100 * c["ratio"] + 15 * c["prob"]
    s -= 10 * max(0.0, c["maxgap"] - allowed - 0.4)
    s -= 0.15 * max(0.0, c["wpm"] - hi * 1.15, lo * 0.75 - c["wpm"])
    s += 1.5 * (c["order"] / max(1, total - 1)) if total > 1 else 0
    return s


chosen = {}
for l in lines:
    cs = cands.get(l["id"], [])
    for c in cs:
        c["score"] = score(l, c, len(cs))
    chosen[l["id"]] = max(cs, key=lambda c: c["score"]) if cs else None

missing = [l["id"] for l in lines if not chosen[l["id"]]]
if missing:
    print("NO TAKE FOUND for", missing)

# ------------------------------------------------------------------ cut points
# chunk edges are real silences: pad a little so soft starts and endings survive, but never into the neighbouring chunk
for l in lines:
    c = chosen[l["id"]]
    if not c:
        continue
    C = chunks[l["who"]]
    i, j = c["i"], c["j"]
    prev_e = C[i - 1]["e"] if i > 0 else 0.0
    next_s = C[j]["s"] if j < len(C) else len(audio[l["who"]]) / SR
    c["run"] = list(range(i, j))
    c["cut_s"] = max(c["start"] - 0.10, (prev_e + c["start"]) / 2)
    c["cut_e"] = min(c["end"] + 0.14, (next_s + c["end"]) / 2)
    a = audio[l["who"]]
    c["clip"] = float(np.mean(np.abs(a[int(c["cut_s"] * SR) : int(c["cut_e"] * SR)]) > 0.985))

# ------------------------------------------------------------------ report
rep = ["# Take report: Evidence Room Part 2", "",
       "Chosen automatically from the four recordings (transcript match, recogniser confidence, hesitations, pace, later-take bonus).",
       "I cannot hear acting or tone: listen to the final file and tell me any line where you prefer another take.", ""]
flags = []
for l in lines:
    cs = cands.get(l["id"], [])
    c = chosen[l["id"]]
    rep.append(f"## {l['id']} {l['who'].upper()}: {l['text']}")
    if not c:
        rep.append("- NO TAKE FOUND\n")
        flags.append((l["id"], "no take found"))
        continue
    for k in cs:
        mark = "CHOSEN" if k is c else "      "
        rep.append(f"- {mark} {l['who']} {k['start']:.2f}-{k['end']:.2f}s match {k['ratio']:.2f} conf {k['prob']:.2f} {k['wpm']:.0f} wpm gap {k['maxgap']:.1f}s score {k['score']:.1f} | heard: {k['text']}")
    notes = []
    if c["ratio"] < 0.85:
        notes.append(f"low text match ({c['ratio']:.2f}): check by ear")
    if c["prob"] < 0.75:
        notes.append(f"low recogniser confidence ({c['prob']:.2f})")
    if c["maxgap"] > 0.5 + 0.7 * l["slashes"] + 1.0:
        notes.append(f"long pause inside the line ({c['maxgap']:.1f}s)")
    if c["clip"] > 0.002:
        notes.append(f"loud peaks hit the ceiling ({c['clip'] * 100:.1f}% of samples): listen for distortion")
    if len(cs) > 1 and sorted(k["score"] for k in cs)[-1] - sorted(k["score"] for k in cs)[-2] < 3:
        notes.append("two takes were nearly equal: the later one wins ties, listen to both if unsure")
    for n_ in notes:
        rep.append(f"- CHECK: {n_}")
        flags.append((l["id"], n_))
    rep.append("")
os.makedirs(OUT, exist_ok=True)
open(os.path.join(OUT, "take-report.md"), "w").write("\n".join(rep))
print(f"lines {len(lines)}, takes found for {len(lines) - len(missing)}, flags {len(flags)}")
for f in flags:
    print("  ", f[0], f[1])
if REPORT_ONLY or missing:
    sys.exit(0)

def assemble(l, c):
    """The take's audio, with any pause inside the line longer than MAX_INNER_PAUSE shortened (room tone, not silence)."""
    a, C = audio[l["who"]], chunks[l["who"]]
    run = c["run"]
    if len(run) == 1:
        return a[int(c["cut_s"] * SR) : int(c["cut_e"] * SR)].copy()
    parts = [a[int(c["cut_s"] * SR) : int(C[run[0]]["e"] * SR)]]
    for k in range(len(run) - 1):
        e0, s1 = C[run[k]]["e"], C[run[k + 1]]["s"]
        if s1 - e0 <= MAX_INNER_PAUSE:
            parts.append(a[int(e0 * SR) : int(s1 * SR)])
        else:
            half = MAX_INNER_PAUSE / 2
            parts.append(a[int(e0 * SR) : int((e0 + half) * SR)])
            parts.append(a[int((s1 - half) * SR) : int(s1 * SR)])
        last = k == len(run) - 2
        parts.append(a[int(s1 * SR) : int((c["cut_e"] if last else C[run[k + 1]]["e"]) * SR)])
    return np.concatenate(parts).copy()



# ------------------------------------------------------------------ build
speech_db = {}
for who in PACE:
    parts = [assemble(l, chosen[l["id"]]) for l in lines if l["who"] == who]
    x = np.concatenate(parts)
    act = x[np.abs(x) > 0.02]
    speech_db[who] = 20 * np.log10(np.sqrt(np.mean(act**2)) + 1e-9)
gain = {who: 10 ** ((LEVEL_DB[who] - speech_db[who]) / 20) for who in PACE}


def tempo_ffmpeg(x, f):
    if abs(f - 1) < 0.005:
        return x
    p, q = os.path.join(OUT, "_t.wav"), os.path.join(OUT, "_t2.wav")
    with wave.open(p, "wb") as o:
        o.setnchannels(1)
        o.setsampwidth(2)
        o.setframerate(SR)
        o.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    subprocess.run([FF, "-y", "-loglevel", "error", "-i", p, "-filter:a", f"atempo={f:.4f}", q], check=True)
    r = wave.open(q)
    return np.frombuffer(r.readframes(r.getnframes()), dtype=np.int16).astype(np.float32) / 32768


out = [np.zeros(int(LEAD * SR), dtype=np.float32)]
cursor = LEAD
units = []
for idx, l in enumerate(lines):
    c = chosen[l["id"]]
    x = assemble(l, c) * gain[l["who"]]
    pk = np.max(np.abs(x))
    if pk > 0.97:
        x *= 0.97 / pk
    fade = int(0.012 * SR)
    x[:fade] *= np.linspace(0, 1, fade)
    x[-fade:] *= np.linspace(1, 0, fade)
    dur = len(x) / SR
    wpm = l["nwords"] / dur * 60
    cap = PACE[l["who"]][2]
    tempo = min(1.0, max(0.85, cap / wpm)) if wpm > cap else 1.0
    x = tempo_ffmpeg(x, tempo)
    nxt = lines[idx + 1] if idx + 1 < len(lines) else None
    if nxt is None:
        gap = 0.0
    elif l["id"] == "L35":
        gap = GAP_BEFORE_VERDICT
    elif nxt["beat"] != l["beat"]:
        gap = GAP_BETWEEN_BEATS
    else:
        gap = GAP_IN_BEAT
    units.append({
        "id": l["id"], "beat": l["beat"], "who": l["who"], "start": round(cursor, 3), "end": round(cursor + len(x) / SR, 3),
        "tempo": round(tempo, 3), "wpm_raw": round(wpm), "wpm_final": round(wpm * tempo),
        "src": [[round(c["cut_s"], 3), round(c["cut_e"], 3)]],
    })
    out.append(x)
    out.append(np.zeros(int(gap * SR), dtype=np.float32))
    cursor += len(x) / SR + gap

mix = np.concatenate(out)
tmpw = os.path.join(OUT, "_mix.wav")
with wave.open(tmpw, "wb") as o:
    o.setnchannels(1)
    o.setsampwidth(2)
    o.setframerate(SR)
    o.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
subprocess.run([FF, "-y", "-loglevel", "error", "-i", tmpw, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100", "-codec:a", "libmp3lame", "-b:a", "192k", os.path.join(OUT, "voiceover.mp3")], check=True)
json.dump({"units": units, "total": round(len(mix) / SR, 3)}, open(os.path.join(OUT, "units.json"), "w"), indent=1)
for f in ("_t.wav", "_t2.wav", "_mix.wav"):
    p = os.path.join(OUT, f)
    if os.path.exists(p):
        os.remove(p)
slowed = [u["id"] for u in units if u["tempo"] < 1]
print("levels before (dBFS speech):", {k: round(v, 1) for k, v in speech_db.items()})
print("slowed lines:", slowed)
print("total seconds", round(len(mix) / SR, 1))
