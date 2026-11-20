#!/usr/bin/env bash
# Joins a silent Remotion master with the mixed audio master into the YouTube file, and prints a spec check.
# Usage: scripts/finalize_video_2.sh <silent.mp4> <audio-master.wav> <out.mp4>
# The video stream is copied (no second encode). Audio becomes AAC-LC 48 kHz stereo 256 kbps. faststart puts the index first.
set -euo pipefail
V="$1"; A="$2"; O="$3"
FF=ffmpeg; [ -x node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg ] && FF=node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")
$FF -y -loglevel error -i "$V" -i "$A" -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k -ar 48000 -ac 2 \
  -af "apad" -t "$DUR" -movflags +faststart "$O"
echo "== $O"
ffprobe -v error -show_entries stream=codec_name,profile,width,height,r_frame_rate,pix_fmt,bit_rate,sample_rate,channels,duration -of default=nw=1 "$O" | tr '\n' ' '; echo
ls -la "$O" | awk '{printf "size %.1f MB\n", $5/1048576}'
ffmpeg -hide_banner -nostats -i "$O" -af ebur128=peak=true -f null - 2>&1 | grep -E " I:| Peak:" | tail -2 | tr '\n' ' '; echo
