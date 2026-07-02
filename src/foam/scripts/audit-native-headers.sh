#!/usr/bin/env bash
# Captures iOS simulator screenshots for every stack-backed route to verify
# native headers use compact titles on push screens (no large-title/back overlap).
set -euo pipefail

BUNDLE_ID="${BUNDLE_ID:-foam-tv-dev}"
OUTPUT_DIR="${OUTPUT_DIR:-/tmp/foam-header-audit}"
METRO_RELOAD_URL="${METRO_RELOAD_URL:-http://127.0.0.1:8081/reload}"
SCHEME="${SCHEME:-foam}"

ROUTES=(
  "tabs/top"
  "tabs/search"
  "tabs/following"
  "tabs/settings"
  "tabs/settings/about"
  "tabs/settings/appearance"
  "tabs/settings/cache"
  "tabs/settings/cached-images"
  "tabs/settings/changelog"
  "tabs/settings/channel-surfing"
  "tabs/settings/chat-preferences"
  "tabs/settings/debug"
  "tabs/settings/dev-tools"
  "tabs/settings/diagnostics"
  "tabs/settings/faq"
  "tabs/settings/licenses"
  "tabs/settings/other"
  "tabs/settings/profile"
  "tabs/settings/remote-config"
  "tabs/settings/storybook"
  "tabs/top/categories"
  "tabs/top/streams"
  "preferences/blocked-users"
  "preferences/chat"
  "preferences/theming"
  "preferences/video"
  "other/about"
  "other/faq"
  "other/changelog"
  "other/licenses"
  "dev-tools/changelog"
  "dev-tools/debug"
  "dev-tools/diagnostics"
  "auth-sheet"
  "category/21779"
)

mkdir -p "$OUTPUT_DIR"

if ! xcrun simctl list devices booted | grep -q Booted; then
  echo "No booted iOS simulator found." >&2
  exit 1
fi

if curl -sf -X POST "$METRO_RELOAD_URL" -o /dev/null; then
  echo "Reloaded Metro bundle"
  sleep 6
fi

xcrun simctl launch booted "$BUNDLE_ID" >/dev/null || true
sleep 2

for route in "${ROUTES[@]}"; do
  safe_name=${route//\//-}
  xcrun simctl openurl booted "${SCHEME}:///${route}" >/dev/null 2>&1 || true
  sleep 2.5
  xcrun simctl io booted screenshot "${OUTPUT_DIR}/${safe_name}.png" >/dev/null
  echo "captured ${route} -> ${OUTPUT_DIR}/${safe_name}.png"
done

cat <<EOF

Audit complete: ${#ROUTES[@]} routes captured in ${OUTPUT_DIR}

Expected header behavior:
- Tab roots (tabs/settings, tabs/following): iOS large title OK
- Tab roots (tabs/top, tabs/search): compact opaque header
- All other routes: compact title + back button (no large-title overlap)

Review screenshots manually or diff against a known-good baseline.
EOF
