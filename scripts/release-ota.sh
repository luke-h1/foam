#!/usr/bin/env bash
set -euo pipefail

variant="${1:-production}"
platform="${2:-all}"

case "$variant" in
  internal | testflight | production) ;;
  *)
    echo "Usage: scripts/release-ota.sh [internal|testflight|production] [ios|android|all]"
    exit 1
    ;;
esac

case "$platform" in
  ios | android | all) ;;
  *)
    echo "Invalid platform: $platform"
    echo "Expected one of: ios, android, all"
    exit 1
    ;;
esac

APP_VARIANT="$variant" eas update \
  --channel "$variant" \
  --environment "$variant" \
  --platform "$platform" \
  --clear-cache \
  --non-interactive
