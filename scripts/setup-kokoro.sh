#!/bin/bash
# One-time setup for the free local voice (Kokoro TTS + Whisper alignment). Needs python3 (3.10+), ffmpeg, ~700 MB disk.
# Models: Kokoro v1.0 ONNX (~350 MB) from the kokoro-onnx releases; Whisper "base.en" downloads from Hugging Face on first use.
# Check the Kokoro model card's license yourself before commercial use.
set -euo pipefail
cd "$(dirname "$0")/.."

python3 -m venv .venv-tts
.venv-tts/bin/pip install -q kokoro-onnx soundfile faster-whisper

mkdir -p models/kokoro
BASE=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
[ -f models/kokoro/kokoro-v1.0.onnx ] || curl -fL -o models/kokoro/kokoro-v1.0.onnx "$BASE/kokoro-v1.0.onnx"
[ -f models/kokoro/voices-v1.0.bin ]  || curl -fL -o models/kokoro/voices-v1.0.bin  "$BASE/voices-v1.0.bin"

# Warm the Whisper model cache so the first video isn't slow.
.venv-tts/bin/python - <<'PY'
from faster_whisper import WhisperModel
WhisperModel("base.en", device="cpu", compute_type="int8")
print("whisper base.en ready")
PY
echo "done. Use TTS_PROVIDER=kokoro (optionally KOKORO_VOICE=am_michael, KOKORO_SPEED=1.0)"
