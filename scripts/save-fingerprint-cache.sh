#!/usr/bin/env bash
set -euo pipefail

variant="${1:-}"
cache_bucket="${FOAM_AWS_FINGERPRINT_BUCKET_NAME:-${FOAM_OTA_FINGERPRINT_CACHE_BUCKET_NAME:-}}"
cache_dir="${FOAM_OTA_FINGERPRINT_CACHE_DIR:-.fingerprint-cache}"
fallback_branch="${FOAM_OTA_FINGERPRINT_CACHE_FALLBACK_BRANCH:-main}"

case "$variant" in
  internal | testflight | production) ;;
  *)
    echo "Usage: ./scripts/save-fingerprint-cache.sh <internal|testflight|production>"
    exit 1
    ;;
esac

if [ -z "$cache_bucket" ]; then
  echo "Skipping fingerprint cache save: FOAM_AWS_FINGERPRINT_BUCKET_NAME is not set."
  exit 0
fi

branch="${FOAM_OTA_FINGERPRINT_CACHE_BRANCH:-}"
if [ -z "$branch" ]; then
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || printf '%s' "$fallback_branch")"
fi

if [ "$branch" = "HEAD" ] || [ -z "$branch" ]; then
  branch="$fallback_branch"
fi

mkdir -p "$cache_dir"

echo "Calculating fingerprints for $variant..."
ios_fingerprint="$(EXPO_PUBLIC_APP_VARIANT="$variant" npx expo-updates fingerprint:generate --platform ios 2>/dev/null | jq -r '.hash')"
android_fingerprint="$(EXPO_PUBLIC_APP_VARIANT="$variant" npx expo-updates fingerprint:generate --platform android 2>/dev/null | jq -r '.hash')"

bunx tsx scripts/workflows/deploy-ota-or-native.ts save-fingerprint-cache \
  --cache-dir "$cache_dir" \
  --bucket "$cache_bucket" \
  --branch "$branch" \
  --variant "$variant" \
  --current-ios "$ios_fingerprint" \
  --current-android "$android_fingerprint"
