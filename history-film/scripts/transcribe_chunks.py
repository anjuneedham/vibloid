#!/usr/bin/env python3
"""Splits each character's raw recording into stretches of speech (real silences, from the audio energy)
and transcribes every stretch on its own with faster-whisper.

Usage: python3 scripts/transcribe_chunks.py [who ...]     (default: curator dig doubt clerk)

Reads  recordings/evidence-room-2/<who>.m4a
Writes scripts/evidence-room-2-caerleon/raw-transcripts/<who>.chunks.json

Why per chunk: whole-file Whisper word timings drift across long pauses (words get stretched), so cut
points built from them land inside words. Chunk edges come from the audio itself, so they sit in silence.
Needs: pip install faster-whisper (model small.en downloads on first use).
"""
import json
import subprocess
import sys
import wave

import numpy as np

REC = "recordings/evidence-room-2"
OUT = "scripts/evidence-room-2-caerleon/raw-transcripts"
SR = 16000
HOP_S = 0.01
MERGE_GAP = 0.30  # silences shorter than this stay inside one chunk
MIN_DUR = 0.15
PROMPT = ("Caerleon, Cadw, Wace, Geoffrey of Monmouth, Tennyson, Nemesis, amphitheatre, Round Table, King Arthur, "
          "Second Augustan Legion, Museum Wales, Daily Mail, Tessa Wheeler, Mortimer Wheeler, Gerald of Wales, City of Legions.")


def load(who):
    wav = f"/tmp/_tc_{who}.wav"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", f"{REC}/{who}.m4a", "-ar", str(SR), "-ac", "1", wav], check=True)
    w = wave.open(wav)
    return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768


def chunks_of(a):
    hop = int(SR * HOP_S)
    rms = np.array([np.sqrt(np.mean(a[i : i + hop] ** 2)) for i in range(0, len(a) - hop, hop)])
    thr = max(np.percentile(rms, 10) * 5, 0.01)
    sp = rms > thr
    out, i, n, gap = [], 0, len(sp), int(MERGE_GAP / HOP_S)
    while i < n:
        if not sp[i]:
            i += 1
            continue
        j = i
        while j < n and (sp[j] or sp[j + 1 : j + 1 + gap].any()):
            j += 1
        out.append((i * HOP_S, j * HOP_S))
        i = j
    return [(s, e) for s, e in out if e - s >= MIN_DUR], float(thr)


def main():
    from faster_whisper import WhisperModel

    model = WhisperModel("small.en", device="cpu", compute_type="int8")
    who_list = sys.argv[1:] or ["curator", "dig", "doubt", "clerk"]
    for who in who_list:
        a = load(who)
        ch, thr = chunks_of(a)
        res = []
        for s, e in ch:
            ctx = 0.25
            lo, hi = max(0, s - ctx), min(len(a) / SR, e + ctx)
            clip = a[int(lo * SR) : int(hi * SR)]
            segs, _ = model.transcribe(clip, language="en", initial_prompt=PROMPT, beam_size=5, condition_on_previous_text=False, word_timestamps=True)
            text, probs = "", []
            for sg in segs:
                text += sg.text
                probs += [w.probability for w in (sg.words or [])]
            res.append({"s": round(s, 2), "e": round(e, 2), "text": text.strip(), "prob": round(float(np.mean(probs)), 2) if probs else 0.0})
        json.dump({"threshold": round(thr, 4), "chunks": res}, open(f"{OUT}/{who}.chunks.json", "w"), indent=0)
        print(who, len(res), "chunks", flush=True)


if __name__ == "__main__":
    main()
