#!/bin/bash
# Cold-start timeline for the iOS app on a simulator, from the unified log.
# Works on the Debug dev client (Metro must be running) and, with
# FOAM_LAUNCH_MODE=launch, on any installed build with an embedded bundle.
#
# Usage:
#   scripts/perf/cold-start-ios.sh [runs]
# Env:
#   FOAM_IOS_UDID      simulator UDID (default: iPhone 16 sim)
#   FOAM_BUNDLE_ID     app bundle id (default: foam-tv-dev)
#   FOAM_PROCESS_NAME  process name in the log (default: Foamdev)
#   FOAM_LAUNCH_MODE   devclient | launch (default: devclient)
#   FOAM_METRO_URL     Metro URL for devclient mode (default: http://localhost:8081)
#   FOAM_DONE_MARKER   log substring that ends a run (default: "GET /helix/streams 200")
#   FOAM_RUN_TIMEOUT   seconds to wait for the done marker (default: 60)
#   OUTPUT_DIR         where raw logs + CSV go (default: research/foam-perf/runs/cold-start-ios)
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RUNS="${1:-5}"
UDID="${FOAM_IOS_UDID:-AA1A3696-8F85-4AE2-96CA-1E5C69018B1C}"
BUNDLE_ID="${FOAM_BUNDLE_ID:-foam-tv-dev}"
PROCESS_NAME="${FOAM_PROCESS_NAME:-Foamdev}"
LAUNCH_MODE="${FOAM_LAUNCH_MODE:-devclient}"
METRO_URL="${FOAM_METRO_URL:-http://localhost:8081}"
DONE_MARKER="${FOAM_DONE_MARKER:-GET /helix/streams 200}"
RUN_TIMEOUT="${FOAM_RUN_TIMEOUT:-60}"
OUTPUT_DIR="${OUTPUT_DIR:-$ROOT_DIR/research/foam-perf/runs/cold-start-ios}"

mkdir -p "$OUTPUT_DIR"
CSV="$OUTPUT_DIR/runs.csv"
echo "run,launch_issued,log_file" > "$CSV"

encoded_metro="$(printf '%s' "$METRO_URL" | sed 's/:/%3A/g; s#/#%2F#g')"

for i in $(seq 1 "$RUNS"); do
  LOG="$OUTPUT_DIR/run-$i.log"
  xcrun simctl terminate "$UDID" "$BUNDLE_ID" >/dev/null 2>&1 || true
  sleep 2
  xcrun simctl spawn "$UDID" log stream --style compact --level info \
    --predicate "process == \"$PROCESS_NAME\"" > "$LOG" 2>&1 &
  LOG_PID=$!
  sleep 2
  LAUNCH_AT="$(date +%s.%N)"
  if [ "$LAUNCH_MODE" = "devclient" ]; then
    xcrun simctl openurl "$UDID" "${BUNDLE_ID}://expo-development-client/?url=${encoded_metro}"
  else
    xcrun simctl launch "$UDID" "$BUNDLE_ID" >/dev/null
  fi
  waited=0
  while ! grep -q -- "$DONE_MARKER" "$LOG" && [ "$waited" -lt "$RUN_TIMEOUT" ]; do
    sleep 1
    waited=$((waited + 1))
  done
  sleep 1
  kill "$LOG_PID" >/dev/null 2>&1 || true
  wait "$LOG_PID" 2>/dev/null || true
  echo "$i,$LAUNCH_AT,$LOG" >> "$CSV"
  echo "run $i done (waited ${waited}s)"
done

node "$ROOT_DIR/scripts/perf/summarize-cold-start.mjs" "$CSV"
