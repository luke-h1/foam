#!/usr/bin/env bash
set -euo pipefail

# Checks the S3 fingerprint cache before a native deploy. If the current
# fingerprints match the cached ones, the change is OTA-eligible and we ask
# for confirmation before rolling a native build.
#
#  ./scripts/native-build-guard.sh <internal|testflight|production>

variant="${1:-}"

# This script runs outside dotenv, so pull the FOAM_AWS_* credentials from
# .env when they are not already in the environment.
if [ -z "${FOAM_AWS_FINGERPRINT_BUCKET_NAME:-}" ] && [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

cache_bucket="${FOAM_AWS_FINGERPRINT_BUCKET_NAME:-${FOAM_OTA_FINGERPRINT_CACHE_BUCKET_NAME:-}}"
cache_dir="${FOAM_OTA_FINGERPRINT_CACHE_DIR:-.fingerprint-cache}"
fallback_branch="${FOAM_OTA_FINGERPRINT_CACHE_FALLBACK_BRANCH:-main}"

case "$variant" in
  internal | testflight | production) ;;
  *)
    echo "Usage: ./scripts/native-build-guard.sh <internal|testflight|production>"
    exit 1
    ;;
esac

if [ "${FOAM_FORCE_NATIVE:-}" = "1" ]; then
  echo "FOAM_FORCE_NATIVE=1 set; skipping OTA eligibility check."
  exit 0
fi

if [ -z "$cache_bucket" ]; then
  echo "Skipping OTA eligibility check: FOAM_AWS_FINGERPRINT_BUCKET_NAME is not set."
  exit 0
fi

branch="${FOAM_OTA_FINGERPRINT_CACHE_BRANCH:-}"
if [ -z "$branch" ]; then
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || printf '%s' "$fallback_branch")"
fi

if [ "$branch" = "HEAD" ] || [ -z "$branch" ]; then
  branch="$fallback_branch"
fi

rm -rf "$cache_dir"
mkdir -p "$cache_dir"

bunx tsx scripts/workflows/deploy-ota-or-native.ts restore-fingerprint-cache \
  --cache-dir "$cache_dir" \
  --bucket "$cache_bucket" \
  --branch "$branch" \
  --fallback-branch "$fallback_branch" \
  --variant "$variant"

previous_ios=""
previous_android=""
[ -f "$cache_dir/ios" ] && previous_ios="$(tr -d '[:space:]' < "$cache_dir/ios")"
[ -f "$cache_dir/android" ] && previous_android="$(tr -d '[:space:]' < "$cache_dir/android")"

if [ -z "$previous_ios" ] || [ -z "$previous_android" ]; then
  echo "No previous fingerprints in S3 for $branch/$variant (first run) - native build required."
  exit 0
fi

echo "Calculating fingerprints for $variant..."
current_ios="$(EXPO_PUBLIC_APP_VARIANT="$variant" npx expo-updates fingerprint:generate --platform ios 2>/dev/null | jq -r '.hash')"
current_android="$(EXPO_PUBLIC_APP_VARIANT="$variant" npx expo-updates fingerprint:generate --platform android 2>/dev/null | jq -r '.hash')"

if [ "$previous_ios" != "$current_ios" ] || [ "$previous_android" != "$current_android" ]; then
  [ "$previous_ios" != "$current_ios" ] && echo "iOS fingerprint changed: $previous_ios -> $current_ios"
  [ "$previous_android" != "$current_android" ] && echo "Android fingerprint changed: $previous_android -> $current_android"
  echo "Native changes detected - native build required."
  exit 0
fi

echo "Fingerprints are unchanged since the last $variant deploy ($branch)."
echo "This change is OTA-eligible: bun run ota -- $variant"

if [ ! -t 0 ]; then
  echo "Non-interactive shell; refusing to roll a native build. Set FOAM_FORCE_NATIVE=1 to override."
  exit 1
fi

read -r -p "Roll a native build anyway? [y/N] " answer
case "$answer" in
  y | Y | yes | YES) ;;
  *)
    echo "Aborting native deploy."
    exit 1
    ;;
esac
