#!/usr/bin/env bash
# Render the A04 code-built 3D test shot with Blender Cycles (CPU), then encode it.
#   BLENDER=/path/to/blender bash studio/scripts/studio3d-render.sh [frames] [samples] [res]
# Frames are written one PNG at a time to qa/out/studio3d/frames/ and skipped if they already exist,
# so a stopped render resumes where it left off. Timings go to qa/out/studio3d/render.log.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
BLENDER="${BLENDER:?set BLENDER to the blender binary (official build, checked against its sha256)}"
FRAMES="${1:-1-264}"
SAMPLES="${2:-16}"
RES="${3:-1280x720}"
OUT="$ROOT/qa/out/studio3d/frames"
mkdir -p "$OUT"
"$BLENDER" -b --factory-startup --python "$ROOT/src/studio3d/blender/shot_a04_hill.py" -- \
  --out "$OUT" --frames "$FRAMES" --samples "$SAMPLES" --res "$RES" --blur 1 2>&1 \
  | grep --line-buffered -E "BUILD|FRAME|Error|Traceback" | tee -a "$ROOT/qa/out/studio3d/render.log"
