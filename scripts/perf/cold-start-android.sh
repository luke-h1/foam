#!/bin/bash
# Cold-start timeline for the Android app on an emulator or device, from
# `am start -W` plus logcat markers. Works on the Debug dev client (Metro
# reachable from the device) and on release builds with FOAM_LAUNCH_MODE=launch.
#
# Usage:
#   scripts/perf/cold-start-android.sh [runs]
# Env:
#   FOAM_ANDROID_SERIAL  adb serial (default: first device)
#   FOAM_ANDROID_PACKAGE app id (default: com.lhowsam.foam.dev)
#   FOAM_LAUNCH_MODE     devclient | launch (default: devclient)
#   FOAM_METRO_URL       Metro URL as seen from the device (default: http://10.0.2.2:8081)
#   FOAM_DONE_MARKER     logcat substring that ends a run (default: "GET /helix/streams 200")
#   FOAM_RUN_TIMEOUT     seconds to wait for the done marker (default: 90)
#   OUTPUT_DIR           where raw logs + CSV go (default: research/foam-perf/runs/cold-start-android)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RUNS="${1:-5}"
PKG="${FOAM_ANDROID_PACKAGE:-com.lhowsam.foam.dev}"
LAUNCH_MODE="${FOAM_LAUNCH_MODE:-devclient}"
METRO_URL="${FOAM_METRO_URL:-http://10.0.2.2:8081}"
DONE_MARKER="${FOAM_DONE_MARKER:-GET /helix/streams 200}"
RUN_TIMEOUT="${FOAM_RUN_TIMEOUT:-90}"
OUTPUT_DIR="${OUTPUT_DIR:-$ROOT_DIR/research/foam-perf/runs/cold-start-android}"
ADB=(adb)
if [ -n "${FOAM_ANDROID_SERIAL:-}" ]; then ADB=(adb -s "$FOAM_ANDROID_SERIAL"); fi

mkdir -p "$OUTPUT_DIR"
CSV="$OUTPUT_DIR/runs.csv"
echo "run,launch_issued_device_ms,am_start_output,log_file" > "$CSV"
encoded_metro="$(printf '%s' "$METRO_URL" | sed 's/:/%3A/g; s#/#%2F#g')"

for i in $(seq 1 "$RUNS"); do
  LOG="$OUTPUT_DIR/run-$i.logcat"
  "${ADB[@]}" shell am force-stop "$PKG"
  sleep 2
  "${ADB[@]}" logcat -c
  "${ADB[@]}" logcat -v epoch > "$LOG" 2>&1 &
  LOG_PID=$!
  sleep 1
  # Device clock, so the launch moment lines up with logcat's epoch timestamps.
  LAUNCH_MS="$("${ADB[@]}" shell 'date +%s%N' | tr -d '\r' | awk '{ printf "%.0f", $1 / 1000000 }')"
  if [ "$LAUNCH_MODE" = "devclient" ]; then
    AM_OUT="$("${ADB[@]}" shell am start -W -a android.intent.action.VIEW -d "foam://expo-development-client/?url=${encoded_metro}" "$PKG" | tr '\n' ' ' | tr -d '\r')"
  else
    AM_OUT="$("${ADB[@]}" shell am start -W -n "$PKG/.MainActivity" | tr '\n' ' ' | tr -d '\r')"
  fi
  waited=0
  while ! grep -q -- "$DONE_MARKER" "$LOG" && [ "$waited" -lt "$RUN_TIMEOUT" ]; do
    sleep 1
    waited=$((waited + 1))
  done
  sleep 1
  kill "$LOG_PID" >/dev/null 2>&1 || true
  wait "$LOG_PID" 2>/dev/null || true
  echo "$i,$LAUNCH_MS,\"$AM_OUT\",$LOG" >> "$CSV"
  echo "run $i done (waited ${waited}s): $AM_OUT"
done

node "$ROOT_DIR/scripts/perf/summarize-cold-start-android.mjs" "$CSV"
