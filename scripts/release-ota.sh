#!/usr/bin/env bash
set -euo pipefail

source ./scripts/sentry-upload.sh

usage() {
  echo "Usage: bun run ota -- <internal|testflight|production> [ios|android|all] [message]"
}

variant="${1:-}"
platform="${2:-all}"
message="${3:-}"
ota_output_dir="./build-artifacts/ota-${variant}-${platform}"

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

run_with_variant_env() {
  local sentry_release_value
  local sentry_dist_value
  sentry_release_value="$(sentry_release)"
  sentry_dist_value="$(sentry_dist)"

  "$dotenv_bin" \
    -c "$variant" \
    -v "EXPO_PUBLIC_APP_VARIANT=$variant" \
    -v "EXPO_PUBLIC_SENTRY_RELEASE=$sentry_release_value" \
    -v "EXPO_PUBLIC_SENTRY_DIST=$sentry_dist_value" \
    -- env \
    "SENTRY_RELEASE=$sentry_release_value" \
    "SENTRY_DIST=$sentry_dist_value" \
    "$@"
}

args=(
  update
  --channel "$variant"
  --platform "$platform"
  --input-dir "$ota_output_dir"
  --clear-cache
  --non-interactive
)

if [ -n "$message" ]; then
  args+=(--message "$message")
fi

mkdir -p build-artifacts
rm -rf "$ota_output_dir"

echo "Publishing OTA to $variant ($platform) using local dotenv cascade"
run_with_variant_env eas "${args[@]}"

run_with_variant_env bash -c 'source ./scripts/sentry-upload.sh; sentry_upload_ota_sourcemaps "$1"' _ "$ota_output_dir"
