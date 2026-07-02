#!/usr/bin/env bash
# Runs the Maestro e2e flows against a booted iOS simulator.
#
# Local (dev-client build): start Metro (EXPO_PUBLIC_APP_VARIANT=e2e) and the
# mock server first, then run this script. CI (standalone e2e build) sets
# APP_ID=foam-tv-e2e and DEV_CLIENT=false — no Metro needed.
set -euo pipefail

APP_ID="${APP_ID:-foam-tv-dev}"
DEV_CLIENT="${DEV_CLIENT:-true}"
E2E_METRO_PORT="${E2E_METRO_PORT:-8081}"
DEV_CLIENT_URL="exp+foam://expo-development-client/?url=http%3A%2F%2Flocalhost%3A${E2E_METRO_PORT}"

# The expo-dev-menu onboarding sheet / floating button overlay the app and
# break flows. Maestro can't pass iOS launch arguments into NSUserDefaults the
# way Detox could, so persist the preferences into the app container instead.
if [[ "$DEV_CLIENT" == "true" ]]; then
  container="$(xcrun simctl get_app_container booted "$APP_ID" data 2>/dev/null || true)"
  if [[ -n "$container" ]]; then
    prefs="$container/Library/Preferences/$APP_ID.plist"
    defaults write "$prefs" EXDevMenuIsOnboardingFinished -bool true
    defaults write "$prefs" EXDevMenuShowsAtLaunch -bool false
    defaults write "$prefs" EXDevMenuShowFloatingActionButton -bool false
  fi
fi

exec maestro test e2e/flows \
  -e APP_ID="$APP_ID" \
  -e DEV_CLIENT="$DEV_CLIENT" \
  -e DEV_CLIENT_URL="$DEV_CLIENT_URL" \
  "$@"
