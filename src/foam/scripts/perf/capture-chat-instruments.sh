#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUTPUT_DIR="${OUTPUT_DIR:-$ROOT_DIR/docs/profiles/chat}"
LABEL="${1:-legend}"

IOS_UDID="${FOAM_IOS_UDID:-4C6D18D2-92C5-469F-91DC-CABCFD1F76E5}"
BUNDLE_ID="${FOAM_BUNDLE_ID:-foam-tv-dev}"
CHANNEL_ID="${FOAM_CHAT_CHANNEL_ID:-71092938}"
CHANNEL_NAME="${FOAM_CHAT_CHANNEL_NAME:-xqc}"
TEMPLATE="${FOAM_INSTRUMENTS_TEMPLATE:-Time Profiler}"
TRACE_SECONDS="${FOAM_INSTRUMENTS_SECONDS:-12}"
SETTLE_DELAY_SECONDS="${FOAM_INSTRUMENTS_SETTLE_SECONDS:-1}"

OUTPUT_PATH="$OUTPUT_DIR/foam-chat-${LABEL}-native.trace"
DEEPLINK="foam://chat?channelId=${CHANNEL_ID}&channelName=${CHANNEL_NAME}"

mkdir -p "$OUTPUT_DIR"
rm -rf "$OUTPUT_PATH"

echo "Capturing Instruments trace"
echo "  label: $LABEL"
echo "  template: $TEMPLATE"
echo "  output: $OUTPUT_PATH"
echo "  route: $DEEPLINK"

xcrun simctl terminate "$IOS_UDID" "$BUNDLE_ID" >/dev/null 2>&1 || true
PID_OUTPUT="$(xcrun simctl launch "$IOS_UDID" "$BUNDLE_ID")"
APP_PID="${PID_OUTPUT##*: }"

xcrun xctrace record \
  --template "$TEMPLATE" \
  --device "$IOS_UDID" \
  --attach "$APP_PID" \
  --time-limit "${TRACE_SECONDS}s" \
  --output "$OUTPUT_PATH" \
  --no-prompt &
TRACE_PID=$!

sleep "$SETTLE_DELAY_SECONDS"
xcrun simctl openurl "$IOS_UDID" "$DEEPLINK"
wait "$TRACE_PID"

"$ROOT_DIR/scripts/perf/export-instruments-trace.sh" "$OUTPUT_PATH" >/dev/null

echo
echo "Saved Instruments trace:"
echo "  $OUTPUT_PATH"
echo "Saved trace TOC export:"
echo "  ${OUTPUT_PATH%.trace}.toc.xml"
