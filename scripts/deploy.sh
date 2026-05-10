#!/usr/bin/env bash
set -euo pipefail


#  bun run deploy -- internal ios
#  bun run deploy -- internal android
#  bun run deploy -- testflight ios
#  bun run deploy -- production all

variant="${1:-}"
platform="${2:-ios}"

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

submit_ios() {
  local profile="$1"
  local artifact_path="$2"

  bun run eas submit \
    --platform ios \
    --profile "$profile" \
    --path "$artifact_path" \
    --non-interactive
}

submit_android() {
  local profile="$1"
  local artifact_path="$2"

  bun run eas submit \
    --platform android \
    --profile "$profile" \
    --path "$artifact_path" \
    --non-interactive
}

build_ios() {
  local profile="$1"
  local artifact_path="./build-artifacts/app-${profile}.ipa"

  EXPO_PUBLIC_ENABLE_TREESHACKING=1 EXPO_APPLE_TEAM_ID="XJA7HDCMMY" \
    bun run eas build \
      --local \
      --platform ios \
      --profile "$profile" \
      --output "$artifact_path" \
      # --non-interactive

  case "$profile" in
    internal | testflight | production)
      submit_ios "$profile" "$artifact_path"
      ;;
  esac
}

build_android() {
  local profile="$1"
  local artifact_path="./build-artifacts/app-${profile}.apk"

  if [ "$profile" = "internal" ] || [ "$profile" = "production" ]; then
    artifact_path="./build-artifacts/app-${profile}.aab"
  fi

  bun run eas build \
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
