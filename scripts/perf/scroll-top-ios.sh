#!/bin/bash
# List-scroll cost on the Top tab (iOS simulator). Opens `foam://tabs/top`,
# samples process CPU% and RSS once per second while FOAM_SWIPES flings run
# through `argent run gesture-swipe` (alternating direction every 5 swipes),
# and prints median / p90 of the samples. The simulator has no frame
# histogram; pair this with the dev-tools perf overlay for FPS.
#
# Usage: scripts/perf/scroll-top-ios.sh [label]
# Env: FOAM_IOS_UDID, FOAM_BUNDLE_ID (foam-tv-dev), FOAM_PROCESS_NAME (Foamdev),
#      FOAM_SWIPES (20), FOAM_SWIPE_MS (250), OUTPUT_DIR
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LABEL="${1:-top-scroll}"
UDID="${FOAM_IOS_UDID:-AA1A3696-8F85-4AE2-96CA-1E5C69018B1C}"
PROCESS_NAME="${FOAM_PROCESS_NAME:-Foamdev}"
SWIPES="${FOAM_SWIPES:-20}"
SWIPE_MS="${FOAM_SWIPE_MS:-250}"
OUTPUT_DIR="${OUTPUT_DIR:-$ROOT_DIR/research/foam-perf/runs/scroll-top-ios}"
mkdir -p "$OUTPUT_DIR"
CSV="$OUTPUT_DIR/$LABEL.csv"

xcrun simctl openurl "$UDID" "foam://tabs/top"
sleep 6
PID="$(pgrep -x "$PROCESS_NAME" | head -1)"
if [ -z "$PID" ]; then echo "process $PROCESS_NAME not running"; exit 1; fi
to_s() { echo "$1" | awk -F'[:.]' '{ if (NF>=3) print ($1*60+$2)*1 + $3/100; else print $1*60+$2 }'; }
echo "t_s,cpu_pct,rss_mb,threads" > "$CSV"
START=$(date +%s)
(
  while kill -0 "$PID" 2>/dev/null; do
    T1=$(ps -o cputime= -p "$PID" | tr -d ' ')
    RSS=$(ps -o rss= -p "$PID" | tr -d ' ')
    THREADS=$(ps -M -p "$PID" | tail -n +2 | wc -l | tr -d ' ')
    sleep 1
    T2=$(ps -o cputime= -p "$PID" | tr -d ' ')
    CPU=$(awk -v a="$(to_s "$T1")" -v b="$(to_s "$T2")" 'BEGIN { printf "%.0f", (b-a)*100 }')
    echo "$(( $(date +%s) - START )),$CPU,$(( RSS / 1024 )),$THREADS" >> "$CSV"
  done
) &
SAMPLER=$!
for i in $(seq 1 "$SWIPES"); do
  if [ $(( (i - 1) / 5 % 2 )) -eq 0 ]; then
    argent run gesture-swipe --udid "$UDID" --fromX 0.5 --fromY 0.8 --toX 0.5 --toY 0.3 --durationMs "$SWIPE_MS" >/dev/null 2>&1
  else
    argent run gesture-swipe --udid "$UDID" --fromX 0.5 --fromY 0.3 --toX 0.5 --toY 0.8 --durationMs "$SWIPE_MS" >/dev/null 2>&1
  fi
  sleep 0.8
done
sleep 2
kill "$SAMPLER" >/dev/null 2>&1 || true
wait "$SAMPLER" 2>/dev/null || true
echo "label=$LABEL swipes=$SWIPES swipe_ms=$SWIPE_MS"
node "$ROOT_DIR/scripts/perf/summarize-steady-state.mjs" "$CSV"
