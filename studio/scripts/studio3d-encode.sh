#!/usr/bin/env bash
# Encode the rendered A04 3D test shot and build its review images.
#   bash studio/scripts/studio3d-encode.sh
# In:  qa/out/studio3d/frames/f0001.png ... (from studio3d-render.sh)
# Out: docs/previews/studio3d/a04-hill-test.mp4      H.264, phone-friendly, under 15 MB
#      qa/out/studio3d/contact-sheet.jpg              every 1/3 s
#      docs/previews/studio3d/comparison-sheet.jpg    owner's reference frames beside ours, under 1 MB
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
F="$ROOT/qa/out/studio3d/frames"
OUT="$ROOT/docs/previews/studio3d"
QA="$ROOT/qa/out/studio3d"
REF="$ROOT/docs/previews/reference"
mkdir -p "$OUT" "$QA"
FONT=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf

# Light finishing grade (the render is already graded in-camera with AgX): a soft bloom on the highlights,
# a gentle vignette. Nothing is painted in.
GRADE="format=gbrp,split[a][b];[b]curves=all='0/0 0.62/0 1/1',gblur=sigma=18[g];[a][g]blend=all_mode=screen:all_opacity=0.28,vignette=angle=0.42"

ffmpeg -v error -y -framerate 24 -i "$F/f%04d.png" -vf "$GRADE,format=yuv420p" \
  -c:v libx264 -preset slow -crf 20 -profile:v high -level 4.0 -movflags +faststart -an "$OUT/a04-hill-test.mp4"
ls -l "$OUT/a04-hill-test.mp4"

# contact sheet of the finished film (every 1/3 s)
ffmpeg -v error -y -i "$OUT/a04-hill-test.mp4" -vf "fps=3,scale=320:-1,tile=6x6:padding=4:color=white" \
  -frames:v 1 -q:v 3 "$QA/contact-sheet.jpg"

# comparison sheet: reference on the left, ours on the right (same row = same kind of shot)
T=$(mktemp -d)
ffmpeg -v error -y -i "$OUT/a04-hill-test.mp4" -vf "select='eq(n\,0)+eq(n\,169)'" -vsync 0 "$T/ours%d.png"
# reference frames: wide (from the sheet), close-up face, low angle (the owner's single frame)
# (REF_VIDEO = the owner's clip gives sharp frames; without it, tiles of the 4x4 reference sheet are used)
if [ -n "${REF_VIDEO:-}" ]; then
  ffmpeg -v error -y -ss 0.8 -i "$REF_VIDEO" -frames:v 1 -vf "scale=1280:720" "$T/ref1.png"
  ffmpeg -v error -y -ss 4.9 -i "$REF_VIDEO" -frames:v 1 -vf "scale=1280:720" "$T/ref2.png"
else
  ffmpeg -v error -y -i "$REF/owner-reference-sheet.jpg" -vf "crop=540:304:0:0,scale=1280:720" "$T/ref1.png"
  ffmpeg -v error -y -i "$REF/owner-reference-sheet.jpg" -vf "crop=540:304:1620:304,scale=1280:720" "$T/ref2.png"
fi
ffmpeg -v error -y -i "$REF/owner-reference-frame.jpg" -vf "scale=1280:720" "$T/ref3.png"
# ours: the wave (wide), a 75 mm close-up of Sami rendered from the same set and moment, the ladybird opening
ffmpeg -v error -y -i "$QA/closeup/f0200.png" -vf "$GRADE" "$T/ours_face.png"
lab() { echo "drawtext=fontfile=$FONT:text='$1':x=24:y=h-56:fontsize=34:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=12"; }
ffmpeg -v error -y \
  -i "$T/ref1.png" -i "$T/ours2.png" -i "$T/ref2.png" -i "$T/ours_face.png" -i "$T/ref3.png" -i "$T/ours1.png" \
  -filter_complex "\
[0]$(lab 'Reference - wide')[a];[1]$(lab 'Ours - wide - the wave')[b];\
[2]$(lab 'Reference - face')[c];[3]$(lab 'Ours - 75 mm close-up of the same moment')[d];\
[4]$(lab 'Reference - low angle and shallow focus')[e];[5]$(lab 'Ours - ladybird and shallow focus')[f];\
[a][b]hstack[r1];[c][d]hstack[r2];[e][f]hstack[r3];[r1][r2][r3]vstack=inputs=3,scale=1800:-1" \
  -q:v 4 "$OUT/comparison-sheet.jpg"
rm -rf "$T"
ls -l "$OUT/comparison-sheet.jpg"
