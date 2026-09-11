#!/bin/bash
# Steady-state chat sampling on Android: opens a chat deep link, resets
# gfxinfo, then samples PSS (dumpsys meminfo) and CPU (top) every
# FOAM_SAMPLE_EVERY seconds for FOAM_DURATION_SECONDS, and prints the
# gfxinfo frame histogram at the end.
#
# Usage: scripts/perf/steady-state-android.sh [label]
# Env: FOAM_ANDROID_SERIAL, FOAM_ANDROID_PACKAGE (com.lhowsam.foam.dev),
#      FOAM_CHAT_CHANNEL_ID (71092938), FOAM_CHAT_CHANNEL_NAME (xqc),
#      FOAM_DURATION_SECONDS (300), FOAM_SAMPLE_EVERY (5), OUTPUT_DIR
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LABEL="${1:-chat}"
PKG="${FOAM_ANDROID_PACKAGE:-com.lhowsam.foam.dev}"
CHANNEL_ID="${FOAM_CHAT_CHANNEL_ID:-71092938}"
CHANNEL_NAME="${FOAM_CHAT_CHANNEL_NAME:-xqc}"
DURATION="${FOAM_DURATION_SECONDS:-300}"
EVERY="${FOAM_SAMPLE_EVERY:-5}"
OUTPUT_DIR="${OUTPUT_DIR:-$ROOT_DIR/research/foam-perf/runs/steady-state-android}"
ADB=(adb)
if [ -n "${FOAM_ANDROID_SERIAL:-}" ]; then ADB=(adb -s "$FOAM_ANDROID_SERIAL"); fi
mkdir -p "$OUTPUT_DIR"
CSV="$OUTPUT_DIR/$LABEL.csv"

if [ "$CHANNEL_ID" != "none" ]; then
  # Quoted twice: the device shell would otherwise split the URL at '&'.
  "${ADB[@]}" shell "am start -a android.intent.action.VIEW -d 'foam://chat?channelId=${CHANNEL_ID}&channelName=${CHANNEL_NAME}' $PKG" >/dev/null
fi
sleep 8
"${ADB[@]}" shell dumpsys gfxinfo "$PKG" reset >/dev/null
echo "t_s,cpu_pct,pss_mb,java_heap_mb,native_heap_mb" > "$CSV"
START=$(date +%s)
while [ $(( $(date +%s) - START )) -lt "$DURATION" ]; do
  MEM="$("${ADB[@]}" shell dumpsys meminfo "$PKG" | tr -d '\r')"
  PSS=$(echo "$MEM" | grep -m1 "TOTAL PSS:" | awk '{print $3}')
  JAVA=$(echo "$MEM" | grep -m1 "Java Heap:" | awk '{print $3}')
  NATIVE=$(echo "$MEM" | grep -m1 "Native Heap:" | awk '{print $3}')
  CPU=$("${ADB[@]}" shell top -b -n 1 -o %CPU,CMDLINE 2>/dev/null | tr -d '\r' | grep -m1 " $PKG$" | awk '{print $1}')
  echo "$(( $(date +%s) - START )),${CPU:-0},$(( ${PSS:-0} / 1024 )),$(( ${JAVA:-0} / 1024 )),$(( ${NATIVE:-0} / 1024 ))" >> "$CSV"
  sleep "$EVERY"
done
"${ADB[@]}" shell dumpsys gfxinfo "$PKG" | tr -d '\r' | sed -n '/Total frames rendered/,/95th percentile/p' | tee "$OUTPUT_DIR/$LABEL.gfxinfo.txt"
node "$ROOT_DIR/scripts/perf/summarize-steady-state.mjs" "$CSV"
