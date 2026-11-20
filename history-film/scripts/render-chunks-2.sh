#!/usr/bin/env bash
# Silent half-resolution DRAFT render of an Episode 2 composition, in chunks, JOBS chunks at a time in parallel.
# Usage: scripts/render-chunks-2.sh <CompositionId> <totalFrames> <out.mp4> [scale=0.5] [step=900] [jobs=2]
# Concurrency per job = cores / jobs. Chunks that already exist are skipped (resumable).
cd "$(dirname "$0")/.."
COMP=$1; TOTAL=$2; OUT=$3; SCALE=${4:-0.5}; STEP=${5:-900}; JOBS=${6:-2}
CORES=$(nproc); CONC=$(( CORES / JOBS )); [ $CONC -lt 1 ] && CONC=1
DIR=out/chunks-$COMP; mkdir -p "$DIR"
npx remotion bundle --out-dir=out/bundle >/dev/null 2>&1 || { echo "bundle failed"; exit 1; }
render() {
  local a=$1 b=$2 f=$3
  [ -s "$f" ] && return 0
  npx remotion render out/bundle "$COMP" "$f.tmp.mp4" --frames=$a-$b --scale=$SCALE --crf=23 --muted \
    --concurrency=$CONC --browser-executable=/opt/pw-browsers/chromium --log=error >/dev/null 2>&1 && mv "$f.tmp.mp4" "$f" && echo "chunk $a-$b done"
}
n=0
for ((a=0; a<TOTAL; a+=STEP)); do
  b=$((a+STEP-1)); [ $b -ge $((TOTAL-1)) ] && b=$((TOTAL-1))
  render $a $b "$DIR/part-$n.mp4" &
  n=$((n+1))
  while [ "$(jobs -rp | wc -l)" -ge "$JOBS" ]; do sleep 2; done
done
wait
FF=$(ls node_modules/@remotion/compositor-linux-x64-*/ffmpeg | head -1)
: > "$DIR/list.txt"
for ((i=0;i<n;i++)); do [ -s "$DIR/part-$i.mp4" ] || { echo "missing part-$i"; exit 1; }; echo "file 'part-$i.mp4'" >> "$DIR/list.txt"; done
$FF -y -loglevel error -f concat -safe 0 -i "$DIR/list.txt" -c copy "$OUT" && echo "JOINED $OUT"
