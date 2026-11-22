#!/bin/bash
# Contact sheet of stills: scripts/sheet.sh <comp> <cols>x<rows> <tile width> <out.jpg> <times> [scale]
# e.g. studio/scripts/sheet.sh demo 3x2 640 out/a.jpg 0,1,2,3,4,5  (needs the Stage 3 studio page, like render.mjs)
set -e
cd "$(dirname "$0")/.."
node scripts/render.mjs "$1" --stills="$5" --scale="${6:-0.5}" 2>&1 | grep -v "^still\|Vite\|__dirname\|VITE_\|404" || true
ffmpeg -hide_banner -v error -y -pattern_type glob -i "out/$1/stills/*.jpg" -vf "scale=$3:-1,tile=$2" -frames:v 1 "$4"
