#!/bin/bash
# Warm (resumed) start on an iOS simulator: backgrounds the app by opening
# Safari, waits, brings the app back, and counts what the JS side does in the
# first FOAM_WARM_WINDOW seconds (requests, socket revives, OTA checks).
# Dev build only: it reads the app's logger output from the unified log.
#
# Usage: scripts/perf/warm-start-ios.sh [cycles]
# Env: FOAM_IOS_UDID, FOAM_BUNDLE_ID (foam-tv-dev), FOAM_PROCESS_NAME (Foamdev),
#      FOAM_BACKGROUND_SECONDS (15), FOAM_WARM_WINDOW (15), OUTPUT_DIR
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CYCLES="${1:-3}"
UDID="${FOAM_IOS_UDID:-AA1A3696-8F85-4AE2-96CA-1E5C69018B1C}"
BUNDLE_ID="${FOAM_BUNDLE_ID:-foam-tv-dev}"
PROCESS_NAME="${FOAM_PROCESS_NAME:-Foamdev}"
BG_SECONDS="${FOAM_BACKGROUND_SECONDS:-15}"
WINDOW="${FOAM_WARM_WINDOW:-15}"
OUTPUT_DIR="${OUTPUT_DIR:-$ROOT_DIR/research/foam-perf/runs/warm-start-ios}"
mkdir -p "$OUTPUT_DIR"

for i in $(seq 1 "$CYCLES"); do
  LOG="$OUTPUT_DIR/cycle-$i.log"
  # `simctl launch` returns non-zero when the target is already frontmost;
  # that is not an error for this script.
  xcrun simctl launch "$UDID" com.apple.mobilesafari >/dev/null 2>&1 || true
  sleep "$BG_SECONDS"
  xcrun simctl spawn "$UDID" log stream --style compact --level info \
    --predicate "process == \"$PROCESS_NAME\"" > "$LOG" 2>&1 &
  LOG_PID=$!
  sleep 2
  FG_AT="$(date '+%H:%M:%S')"
  xcrun simctl launch "$UDID" "$BUNDLE_ID" >/dev/null 2>&1 || true
  sleep "$WINDOW"
  kill "$LOG_PID" >/dev/null 2>&1 || true
  wait "$LOG_PID" 2>/dev/null || true
  JS_LINES=$(grep -c "react.log:javascript" "$LOG" || true)
  REQUESTS=$(grep "react.log:javascript" "$LOG" | grep -c "INFO : https://" || true)
  RESPONSES=$(grep "react.log:javascript" "$LOG" | grep -cE "GET|POST" || true)
  REVIVES=$(grep -ciE "Reviving|reconnect" "$LOG" || true)
  OTA=$(grep -c "checking for updates" "$LOG" || true)
  RC=$(grep -c "fetchAndActivate" "$LOG" || true)
  grep "react.log:javascript" "$LOG" | sed 's/.*javascript\] //' | cut -c1-200 > "$OUTPUT_DIR/cycle-$i.js-lines.txt" || true
  echo "cycle $i: foreground at $FG_AT; js log lines=$JS_LINES; requests=$REQUESTS; responses=$RESPONSES; socket revive/reconnect lines=$REVIVES; ota checks=$OTA; remote config fetches=$RC"
  grep "react.log:javascript" "$LOG" | grep -E "INFO : https://|GET |POST |Reviving|reconnect|checking for updates|fetchAndActivate" | sed 's/.*javascript\] //' | sed 's/\\134^\[\[[0-9;]*m//g' | cut -c1-120 | sed 's/^/    /'
done
