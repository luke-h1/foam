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
# xctrace against a simulator currently records nothing (the .trace bundle
# holds only RunIssues.storedata and export fails with "Document Missing
# Template Error"), so simulators use macOS `sample` on the host process
# instead. Set FOAM_FORCE_XCTRACE=1 to retry xctrace after an Xcode update.
FORCE_XCTRACE="${FOAM_FORCE_XCTRACE:-0}"

DEEPLINK="foam://chat?channelId=${CHANNEL_ID}&channelName=${CHANNEL_NAME}"

mkdir -p "$OUTPUT_DIR"

is_simulator() {
  xcrun simctl list devices | grep -q "$IOS_UDID"
}

launch_app() {
  xcrun simctl terminate "$IOS_UDID" "$BUNDLE_ID" >/dev/null 2>&1 || true
  PID_OUTPUT="$(xcrun simctl launch "$IOS_UDID" "$BUNDLE_ID")"
  APP_PID="${PID_OUTPUT##*: }"
}

if is_simulator && [ "$FORCE_XCTRACE" != "1" ]; then
  OUTPUT_PATH="$OUTPUT_DIR/foam-chat-${LABEL}-native.sample.txt"
  SUMMARY_PATH="$OUTPUT_DIR/foam-chat-${LABEL}-native.summary.txt"
  rm -f "$OUTPUT_PATH" "$SUMMARY_PATH"

  echo "Capturing sample profile (simulator; dev build - directional only)"
  echo "  label: $LABEL"
  echo "  seconds: $TRACE_SECONDS"
  echo "  output: $OUTPUT_PATH"
  echo "  route: $DEEPLINK"

  launch_app

  sample "$APP_PID" "$TRACE_SECONDS" -file "$OUTPUT_PATH" >/dev/null &
  SAMPLE_PID=$!
  sleep "$SETTLE_DELAY_SECONDS"
  xcrun simctl openurl "$IOS_UDID" "$DEEPLINK"
  wait "$SAMPLE_PID"

  {
    echo "Top of stack (from $OUTPUT_PATH):"
    awk '/Sort by top of stack/{found=1; next}
      found && NF {print; if (++lines >= 20) exit}
      found && !NF {exit}' "$OUTPUT_PATH"
  } | tee "$SUMMARY_PATH"

  echo
  echo "Saved sample profile:"
  echo "  $OUTPUT_PATH"
  echo "Saved hotspot summary:"
  echo "  $SUMMARY_PATH"
  echo
  echo "Read: Hermes Interpreter::interpretFunction = JS-thread busy share,"
  echo "HadesGC = GC pressure, vImage/codecs = decode off the JS thread."
  echo "Dev-build numbers are directional; use a physical device for release."
  exit 0
fi

OUTPUT_PATH="$OUTPUT_DIR/foam-chat-${LABEL}-native.trace"
rm -rf "$OUTPUT_PATH"

echo "Capturing Instruments trace"
echo "  label: $LABEL"
echo "  template: $TEMPLATE"
echo "  output: $OUTPUT_PATH"
echo "  route: $DEEPLINK"

launch_app

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

if [ ! -e "$OUTPUT_PATH/Trace1.run/run.tracetemplate" ] &&
  ! xcrun xctrace export --input "$OUTPUT_PATH" --toc >/dev/null 2>&1; then
  echo "error: xctrace produced an empty trace bundle (known simulator bug);" >&2
  echo "rerun without FOAM_FORCE_XCTRACE to use the sample-based capture." >&2
  exit 1
fi

"$ROOT_DIR/scripts/perf/export-instruments-trace.sh" "$OUTPUT_PATH" >/dev/null

echo
echo "Saved Instruments trace:"
echo "  $OUTPUT_PATH"
echo "Saved trace TOC export:"
echo "  ${OUTPUT_PATH%.trace}.toc.xml"
