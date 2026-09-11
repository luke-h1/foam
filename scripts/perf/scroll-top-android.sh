#!/bin/bash
# List-scroll frame health on the Top tab (Android). Opens `foam://tabs/top`,
# resets gfxinfo, performs FOAM_SWIPES flings (alternating up and down every
# 5 swipes) with `input swipe`, then prints the gfxinfo frame histogram and
# the PSS before and after.
#
# Usage: scripts/perf/scroll-top-android.sh [label]
# Env: FOAM_ANDROID_SERIAL, FOAM_ANDROID_PACKAGE (com.lhowsam.foam.dev),
#      FOAM_SWIPES (20), FOAM_SWIPE_MS (250), OUTPUT_DIR
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LABEL="${1:-top-scroll}"
PKG="${FOAM_ANDROID_PACKAGE:-com.lhowsam.foam.dev}"
SWIPES="${FOAM_SWIPES:-20}"
SWIPE_MS="${FOAM_SWIPE_MS:-250}"
OUTPUT_DIR="${OUTPUT_DIR:-$ROOT_DIR/research/foam-perf/runs/scroll-top-android}"
ADB=(adb)
if [ -n "${FOAM_ANDROID_SERIAL:-}" ]; then ADB=(adb -s "$FOAM_ANDROID_SERIAL"); fi
mkdir -p "$OUTPUT_DIR"

"${ADB[@]}" shell "am start -a android.intent.action.VIEW -d 'foam://tabs/top' $PKG" >/dev/null
sleep 6
SIZE="$("${ADB[@]}" shell wm size | tr -d '\r' | awk '{print $3}')"
W="${SIZE%x*}"; H="${SIZE#*x}"
X=$(( W / 2 )); Y_LOW=$(( H * 80 / 100 )); Y_HIGH=$(( H * 30 / 100 ))
pss() { "${ADB[@]}" shell dumpsys meminfo "$PKG" | tr -d '\r' | grep -m1 "TOTAL PSS:" | awk '{print $3}'; }
PSS_BEFORE=$(pss)
"${ADB[@]}" shell dumpsys gfxinfo "$PKG" reset >/dev/null
START=$(date +%s)
for i in $(seq 1 "$SWIPES"); do
  if [ $(( (i - 1) / 5 % 2 )) -eq 0 ]; then
    "${ADB[@]}" shell input swipe "$X" "$Y_LOW" "$X" "$Y_HIGH" "$SWIPE_MS"
  else
    "${ADB[@]}" shell input swipe "$X" "$Y_HIGH" "$X" "$Y_LOW" "$SWIPE_MS"
  fi
  sleep 0.8
done
sleep 2
ELAPSED=$(( $(date +%s) - START ))
PSS_AFTER=$(pss)
{
  echo "label=$LABEL swipes=$SWIPES swipe_ms=$SWIPE_MS elapsed_s=$ELAPSED"
  echo "pss_before_mb=$(( PSS_BEFORE / 1024 )) pss_after_mb=$(( PSS_AFTER / 1024 ))"
  "${ADB[@]}" shell dumpsys gfxinfo "$PKG" | tr -d '\r' | sed -n '/Total frames rendered/,/99th percentile/p'
} | tee "$OUTPUT_DIR/$LABEL.gfxinfo.txt"
