#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
OUTPUT_DIR="${OUTPUT_DIR:-$ROOT_DIR/docs/profiles/chat}"
LABEL="${1:-legend}"

SESSION="${FOAM_AGENT_DEVICE_SESSION:-foam}"
DEVICE_NAME="${FOAM_IOS_DEVICE_NAME:-iPhone 17 Pro}"
IOS_UDID="${FOAM_IOS_UDID:-4C6D18D2-92C5-469F-91DC-CABCFD1F76E5}"
APP_NAME="${FOAM_APP_NAME:-Foam (dev)}"
BUNDLE_ID="${FOAM_BUNDLE_ID:-foam-tv-dev}"
CHANNEL_ID="${FOAM_CHAT_CHANNEL_ID:-71092938}"
CHANNEL_NAME="${FOAM_CHAT_CHANNEL_NAME:-xqc}"
CAPTURE_SECONDS="${FOAM_RN_PROFILE_SECONDS:-10}"

OUTPUT_PATH="$OUTPUT_DIR/foam-chat-${LABEL}-profile.json"
DEEPLINK="foam://chat?channelId=${CHANNEL_ID}&channelName=${CHANNEL_NAME}"

mkdir -p "$OUTPUT_DIR"
rm -f "$OUTPUT_PATH"

echo "Capturing React DevTools profile"
echo "  label: $LABEL"
echo "  output: $OUTPUT_PATH"
echo "  device: $DEVICE_NAME"
echo "  route: $DEEPLINK"

bunx agent-device open "$APP_NAME" --platform ios --device "$DEVICE_NAME" --session "$SESSION" >/dev/null
bunx agent-device react-devtools wait --connected >/dev/null

xcrun simctl terminate "$IOS_UDID" "$BUNDLE_ID" >/dev/null 2>&1 || true
xcrun simctl launch "$IOS_UDID" "$BUNDLE_ID" >/dev/null
sleep 2

bunx agent-device react-devtools wait --connected >/dev/null
bunx agent-device react-devtools profile start >/dev/null
xcrun simctl openurl "$IOS_UDID" "$DEEPLINK"
sleep "$CAPTURE_SECONDS"
bunx agent-device react-devtools profile stop >/dev/null
bunx agent-device react-devtools profile export "$OUTPUT_PATH" >/dev/null

echo
echo "Saved React DevTools profile:"
echo "  $OUTPUT_PATH"
echo
echo "Top slow components:"
bunx agent-device react-devtools profile slow --limit 10
echo
echo "Top rerenders:"
bunx agent-device react-devtools profile rerenders --limit 10
