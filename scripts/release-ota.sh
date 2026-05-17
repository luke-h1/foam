#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: bun run ota -- <internal|testflight|production> [ios|android|all] [message]"
}

variant="${1:-}"
platform="${2:-all}"
message="${3:-}"

case "$variant" in
  internal | testflight | production) ;;
  *)
    usage
    exit 1
    ;;
esac

case "$platform" in
  ios | android | all) ;;
  *)
    echo "Invalid platform: $platform"
    echo "Expected one of: ios, android, all"
    usage
    exit 1
    ;;
esac

dotenv_bin="${DOTENV_BIN:-./node_modules/.bin/dotenv}"

if [ ! -x "$dotenv_bin" ]; then
  echo "Missing dotenv CLI at $dotenv_bin. Run bun install first."
  exit 1
fi

args=(
  update
  --channel "$variant"
  --platform "$platform"
  --clear-cache
  --non-interactive
)

if [ -n "$message" ]; then
  args+=(--message "$message")
fi

echo "Publishing OTA to $variant ($platform) using local dotenv cascade"
"$dotenv_bin" -c "$variant" -v "EXPO_PUBLIC_APP_VARIANT=$variant" -- eas "${args[@]}"
