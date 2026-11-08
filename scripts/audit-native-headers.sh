#!/usr/bin/env bash
# Captures iOS simulator screenshots for every stack-backed route to verify
# native headers use compact titles on push screens (no large-title/back overlap).
set -euo pipefail

BUNDLE_ID="${BUNDLE_ID:-foam-tv-dev}"
OUTPUT_DIR="${OUTPUT_DIR:-/tmp/foam-header-audit}"
METRO_RELOAD_URL="${METRO_RELOAD_URL:-http://127.0.0.1:8081/reload}"
SCHEME="${SCHEME:-foam}"

source "$(dirname "$0")/list-routes.sh"

# Streams, chat and the full-screen flows draw their own chrome, so they have
# no native header to audit.
ROUTES=()
while IFS= read -r route; do
  case "$route" in
    streams/* | chat* | feedback | onboarding) ;;
    *) ROUTES+=("$route") ;;
  esac
done < <(list_routes)

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
