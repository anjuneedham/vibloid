#!/usr/bin/env bash
# Renders EvidenceRoom1 in ~900-frame chunks (skips chunks that already exist), then joins them.
cd "$(dirname "$0")/.."
mkdir -p out/chunks
TOTAL=9000; STEP=900; n=0
for ((a=0; a<TOTAL; a+=STEP)); do
  b=$((a+STEP-1)); [ $b -ge $((TOTAL-1)) ] && b=$((TOTAL-1))
  f=out/chunks/part-$n.mp4
  if [ ! -s "$f" ]; then
    npx remotion render EvidenceRoom1 "$f.tmp.mp4" --frames=$a-$b --crf=24 --browser-executable=/opt/pw-browsers/chromium --log=error && mv "$f.tmp.mp4" "$f" || exit 1
  fi
  n=$((n+1))
done
FF=$(ls node_modules/@remotion/compositor-linux-x64-*/ffmpeg | head -1)
: > out/chunks/list.txt
for ((i=0;i<n;i++)); do echo "file 'part-$i.mp4'" >> out/chunks/list.txt; done
$FF -y -f concat -safe 0 -i out/chunks/list.txt -c copy out/evidence-room-1-draft.mp4 && echo JOINED
