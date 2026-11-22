#!/bin/bash
# Renders the whole style test into qa/out/studio/: the book spread (four languages, and as a phone shows it),
# the ten-second film shot with its contact sheet, the model sheets, the places sheet and a style-swap sample.
#   bash studio/scripts/proofs.sh            everything
#   bash studio/scripts/proofs.sh stills     everything but the film
set -e
cd "$(dirname "$0")/../.."
X="node studio/scripts/export.mjs"
OUT=qa/out/studio
mkdir -p $OUT
# (a) the spread: full size in four languages, then one page at phone width in English and Arabic
for l in en ar he da; do $X still spread-oranges --lang=$l --format=webp; done
$X still spread-oranges --format=png
$X still spread-oranges --lang=ar --format=png
$X still spread-oranges --page=1 --width=390 --format=png
$X still spread-oranges --page=1 --width=390 --lang=ar --format=png
$X still spread-oranges --width=844 --lang=he --format=png
# (c) (d) the model sheets
$X still cast-sheet
$X still gesture-sheet --scale=1.5
$X still face-sheet
$X still cast-sheet --style=ink --scale=1 --out=$OUT/cast-sheet-ink-profile.png
$X still cast-sheet --width=390 --scale=3 --out=$OUT/cast-sheet-390.png
# the places library, one frame per place
$X sheet places --times=0.5,1.5,2.5,3.5,4.5,5.5 --cols=2 --tile=960 --out=$OUT/places-sheet.jpg
# a looping instruction clip
$X loop loop-clap --scale=0.6
if [ "$1" != "stills" ]; then
  # (b) the film shot, its contact sheet, and the same shot at phone width
  $X video shot-tower
  $X sheet shot-tower --every=0.8334 --cols=4 --tile=640 --captions=burn --out=$OUT/shot-tower-sheet.jpg
  $X sheet shot-tower --times=0.6,3.4,5.2,7.2 --cols=2 --tile=390 --width=390 --scale=2 --captions=burn --out=$OUT/shot-tower-390.jpg
  $X video shot-tower --lang=ar
fi
ls -la $OUT
