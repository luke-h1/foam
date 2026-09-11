#!/bin/bash
# Steady-state chat sampling on an iOS simulator: opens a chat deep link, then
# samples process CPU% and RSS every FOAM_SAMPLE_EVERY seconds for
# FOAM_DURATION_SECONDS, and takes one `sample` call-stack capture at the end.
# Simulator processes run on the host, so `ps` sees them directly.
#
# Usage: scripts/perf/steady-state-ios.sh [label]
# Env: FOAM_IOS_UDID, FOAM_BUNDLE_ID (foam-tv-dev), FOAM_PROCESS_NAME (Foamdev),
#      FOAM_CHAT_CHANNEL_ID (71092938), FOAM_CHAT_CHANNEL_NAME (xqc),
#      FOAM_DURATION_SECONDS (600), FOAM_SAMPLE_EVERY (5), OUTPUT_DIR
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LABEL="${1:-chat}"
UDID="${FOAM_IOS_UDID:-AA1A3696-8F85-4AE2-96CA-1E5C69018B1C}"
BUNDLE_ID="${FOAM_BUNDLE_ID:-foam-tv-dev}"
PROCESS_NAME="${FOAM_PROCESS_NAME:-Foamdev}"
CHANNEL_ID="${FOAM_CHAT_CHANNEL_ID:-71092938}"
CHANNEL_NAME="${FOAM_CHAT_CHANNEL_NAME:-xqc}"
DURATION="${FOAM_DURATION_SECONDS:-600}"
EVERY="${FOAM_SAMPLE_EVERY:-5}"
OUTPUT_DIR="${OUTPUT_DIR:-$ROOT_DIR/research/foam-perf/runs/steady-state-ios}"
mkdir -p "$OUTPUT_DIR"
CSV="$OUTPUT_DIR/$LABEL.csv"

if [ "$CHANNEL_ID" != "none" ]; then
  xcrun simctl openurl "$UDID" "foam://chat?channelId=${CHANNEL_ID}&channelName=${CHANNEL_NAME}"
fi
sleep 5
PID="$(pgrep -x "$PROCESS_NAME" | head -1)"
if [ -z "$PID" ]; then echo "process $PROCESS_NAME not running"; exit 1; fi
echo "t_s,cpu_pct,rss_mb,threads" > "$CSV"
START=$(date +%s)
while [ $(( $(date +%s) - START )) -lt "$DURATION" ]; do
  # ps %cpu is a decaying average; use top -l 2 style would be heavier, so
  # sample both %cpu and a 1s delta of cputime for an instantaneous figure.
  T1=$(ps -o cputime= -p "$PID" | tr -d ' ')
  RSS=$(ps -o rss= -p "$PID" | tr -d ' ')
  THREADS=$(ps -M -p "$PID" | tail -n +2 | wc -l | tr -d ' ')
  sleep 1
  T2=$(ps -o cputime= -p "$PID" | tr -d ' ')
  to_s() { echo "$1" | awk -F'[:.]' '{ if (NF>=3) print ($1*60+$2)*1 + $3/100; else print $1*60+$2 }'; }
  CPU=$(awk -v a="$(to_s "$T1")" -v b="$(to_s "$T2")" 'BEGIN { printf "%.0f", (b-a)*100 }')
  echo "$(( $(date +%s) - START )),$CPU,$(( RSS / 1024 )),$THREADS" >> "$CSV"
  sleep $(( EVERY > 1 ? EVERY - 1 : 0 ))
done
sample "$PID" 10 -file "$OUTPUT_DIR/$LABEL.sample.txt" >/dev/null 2>&1 || true
node "$ROOT_DIR/scripts/perf/summarize-steady-state.mjs" "$CSV"
