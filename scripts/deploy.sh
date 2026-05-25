#!/usr/bin/env bash
set -euo pipefail


#  bun run deploy -- internal ios
#  bun run deploy -- internal android
#  bun run deploy -- testflight ios
#  bun run deploy -- production all

source ./scripts/sentry-upload.sh

variant="${1:-}"
platform="${2:-ios}"
dotenv_bin="${DOTENV_BIN:-./node_modules/.bin/dotenv}"

case "$variant" in
  internal | testflight | production) ;;
  *)
    echo "Usage: bun run deploy -- <internal|testflight|production> [ios|android|all]"
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

if [ "$variant" = "testflight" ] && [ "$platform" != "ios" ]; then
  echo "The testflight variant is iOS-only. Use: bun run deploy -- testflight ios"
  exit 1
fi

mkdir -p build-artifacts

run_with_variant_env() {
  local sentry_release_value
  local sentry_dist_value
  sentry_release_value="$(sentry_release)"
  sentry_dist_value="$(sentry_dist)"

  if [ -x "$dotenv_bin" ]; then
    "$dotenv_bin" \
      -c "$variant" \
      -v "EXPO_PUBLIC_APP_VARIANT=$variant" \
      -v "EXPO_PUBLIC_SENTRY_RELEASE=$sentry_release_value" \
      -v "EXPO_PUBLIC_SENTRY_DIST=$sentry_dist_value" \
      -- env \
      "SENTRY_RELEASE=$sentry_release_value" \
      "SENTRY_DIST=$sentry_dist_value" \
      "$@"
    return
  fi

  EXPO_PUBLIC_APP_VARIANT="$variant" \
    EXPO_PUBLIC_SENTRY_RELEASE="$sentry_release_value" \
    EXPO_PUBLIC_SENTRY_DIST="$sentry_dist_value" \
    SENTRY_RELEASE="$sentry_release_value" \
    SENTRY_DIST="$sentry_dist_value" \
    "$@"
}

run_sentry_helper() {
  local function_name="$1"
  shift

  run_with_variant_env bash -c 'source ./scripts/sentry-upload.sh; "$@"' _ "$function_name" "$@"
}

submit_ios() {
  local profile="$1"
  local artifact_path="$2"

  run_with_variant_env bun run eas submit \
    --platform ios \
    --profile "$profile" \
    --path "$artifact_path" \
    --non-interactive
}

submit_android() {
  local profile="$1"
  local artifact_path="$2"

  run_with_variant_env bun run eas submit \
    --platform android \
    --profile "$profile" \
    --path "$artifact_path" \
    --non-interactive
}

build_ios() {
  local profile="$1"
  local archive_path="./build-artifacts/app-${profile}.tar.gz"
  local extracted_dir="./build-artifacts/ios-${profile}"
  local ipa_path

  rm -rf "$extracted_dir"
  mkdir -p "$extracted_dir"

  run_with_variant_env env \
    EXPO_PUBLIC_ENABLE_TREESHACKING=1 \
    EXPO_APPLE_TEAM_ID="XJA7HDCMMY" \
    bun run eas build \
      --local \
      --platform ios \
      --profile "$profile" \
      --output "$archive_path" \
      # --non-interactive

  tar -xzf "$archive_path" -C "$extracted_dir"

  ipa_path="$(find "$extracted_dir" -path '*/ios/build/*.ipa' -print -quit 2>/dev/null || true)"

  if [ -z "$ipa_path" ]; then
    ipa_path="$(find "$extracted_dir" -name '*.ipa' -print -quit 2>/dev/null || true)"
  fi

  if [ -z "$ipa_path" ]; then
    echo "Unable to find an IPA in $extracted_dir"
    exit 1
  fi

  run_sentry_helper sentry_upload_dsyms "$extracted_dir"

  case "$profile" in
    internal | testflight | production)
      submit_ios "$profile" "$ipa_path"
      ;;
  esac
}

build_android() {
  local profile="$1"
  local artifact_path="./build-artifacts/app-${profile}.apk"

  if [ "$profile" = "internal" ] || [ "$profile" = "production" ]; then
    artifact_path="./build-artifacts/app-${profile}.aab"
  fi

  run_with_variant_env bun run eas build \
    --local \
    --platform android \
    --profile "$profile" \
    --output "$artifact_path" \
    --non-interactive

  if [ "$profile" = "internal" ] || [ "$profile" = "production" ]; then
    submit_android "$profile" "$artifact_path"
  fi
}

case "$platform" in
  ios)
    build_ios "$variant"
    ;;
  android)
    build_android "$variant"
    ;;
  all)
    build_ios "$variant"
    build_android "$variant"
    ;;
esac
