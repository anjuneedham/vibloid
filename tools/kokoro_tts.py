#!/usr/bin/env python3
"""
Local voice worker: Kokoro (ONNX) text-to-speech + faster-whisper word alignment. Free, offline after the model download.

Protocol: one JSON object per line on stdin, one JSON object per line on stdout.
  request : {"id": "...", "text": "...", "out": "/path/out.wav", "voice": "am_michael", "speed": 1.0}
  response: {"id": "...", "ok": true, "duration": 3.2, "words": [{"w": "Hello", "start": 0.1, "end": 0.5}, ...]}
            {"id": "...", "ok": false, "error": "..."}
Logs go to stderr only (stdout is reserved for the protocol).
"""
import difflib
import json
import os
import re
import subprocess
import sys

import numpy as np
import soundfile as sf

MODEL_DIR = os.environ.get("KOKORO_MODEL_DIR", os.path.join(os.path.dirname(__file__), "..", "models", "kokoro"))
WHISPER_MODEL = os.environ.get("WHISPER_MODEL", "base.en")

_kokoro = None
_whisper = None


def log(*a):
    print(*a, file=sys.stderr, flush=True)


def kokoro():
    global _kokoro
    if _kokoro is None:
        from kokoro_onnx import Kokoro
        _kokoro = Kokoro(os.path.join(MODEL_DIR, "kokoro-v1.0.onnx"), os.path.join(MODEL_DIR, "voices-v1.0.bin"))
        log("kokoro loaded")
    return _kokoro


def whisper():
    global _whisper
    if _whisper is None:
        from faster_whisper import WhisperModel
        _whisper = WhisperModel(WHISPER_MODEL, device="cpu", compute_type="int8")
        log("whisper loaded:", WHISPER_MODEL)
    return _whisper


def norm(w: str) -> str:
    return re.sub(r"[^a-z0-9]", "", w.lower())


def align_to_script(script_words, heard, duration):
    """
    Give every SCRIPT word a start/end using Whisper's timings.
    Whisper may mishear or normalize ("3%" -> "three percent"), so we match the two word lists with difflib,
    copy timings for matched words, and spread unmatched script words evenly across the gap between their matched neighbours.
    Result: captions show the exact script text with timings that follow the real audio.
    """
    n = len(script_words)
    if n == 0:
        return []
    a = [norm(w) for w in script_words]
    b = [norm(h["w"]) for h in heard]
    start = [None] * n
    end = [None] * n
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    for i, j, size in sm.get_matching_blocks():
        for k in range(size):
            start[i + k] = heard[j + k]["start"]
            end[i + k] = heard[j + k]["end"]
    # Fill unmatched runs by interpolating between the nearest timed neighbours.
    i = 0
    while i < n:
        if start[i] is not None:
            i += 1
            continue
        j = i
        while j < n and start[j] is None:
            j += 1
        lo = end[i - 1] if i > 0 else (heard[0]["start"] if heard else 0.0)
        hi = start[j] if j < n else (heard[-1]["end"] if heard else duration)
        hi = max(hi, lo)
        span = (hi - lo) / (j - i)
        for k in range(i, j):
            start[k] = lo + span * (k - i)
            end[k] = lo + span * (k - i + 1)
        i = j
    out = []
    prev_end = 0.0
    for k, w in enumerate(script_words):
        s = max(prev_end, min(start[k], duration))
        e = max(s + 0.02, min(end[k], duration))
        out.append({"w": w, "start": round(s, 3), "end": round(e, 3)})
        prev_end = s  # allow tiny overlaps from the model but keep starts monotonic
    return out


def load_16k(path):
    """Decode with FFmpeg (already a hard dependency) instead of faster-whisper's PyAV path, which breaks on some PyAV versions."""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32)


def handle(req):
    text = req["text"].strip()
    voice = req.get("voice") or os.environ.get("KOKORO_VOICE", "am_michael")
    speed = float(req.get("speed") or os.environ.get("KOKORO_SPEED", 1.0))
    k = kokoro()
    if voice not in k.get_voices():
        raise ValueError(f"unknown voice {voice!r}; available: {sorted(k.get_voices())}")
    samples, sr = k.create(text, voice=voice, speed=speed, lang="en-us")
    sf.write(req["out"], np.asarray(samples, dtype=np.float32), sr)
    duration = len(samples) / sr
    segments, _ = whisper().transcribe(load_16k(req["out"]), language="en", word_timestamps=True, vad_filter=False, beam_size=1)
    heard = [{"w": w.word.strip(), "start": float(w.start), "end": float(w.end)} for seg in segments for w in (seg.words or [])]
    script_words = text.split()
    return {"duration": round(duration, 3), "words": align_to_script(script_words, heard, duration), "heard": len(heard)}


def main():
    log("kokoro_tts worker ready")
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        rid = None
        try:
            req = json.loads(line)
            rid = req.get("id")
            res = handle(req)
            print(json.dumps({"id": rid, "ok": True, **res}), flush=True)
        except Exception as e:  # report and keep serving
            log("error:", repr(e))
            print(json.dumps({"id": rid, "ok": False, "error": str(e)}), flush=True)


if __name__ == "__main__":
    main()
