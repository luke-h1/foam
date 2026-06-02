#!/usr/bin/env bash
set -euo pipefail

#  bun run build:local -- internal ios
#  bun run build:local -- internal android
#  bun run build:local -- testflight ios
#  bun run build:local -- production all

source ./scripts/deploy-common.sh

validate_deploy_args "build:local"
mkdir -p build-artifacts

build_ios() {
  local profile="$1"
  local ipa_path
  local extracted_dir
  local build_marker
  ipa_path="$(ios_artifact_path "$profile")"
  extracted_dir="$(ios_extracted_dir "$profile")"
  build_marker="./build-artifacts/ios-$profile-build-start.marker"

  rm -f "$ipa_path"
  rm -rf "$extracted_dir"
  mkdir -p "$extracted_dir"
  : > "$build_marker"

  run_with_variant_env env \
    EXPO_PUBLIC_ENABLE_TREESHACKING=1 \
    EXPO_APPLE_TEAM_ID="XJA7HDCMMY" \
    bun run eas build \
      --local \
      --platform ios \
      --profile "$profile" \
      --output "$ipa_path" \
      # --non-interactive

  if [ ! -f "$ipa_path" ]; then
    echo "Unable to find an IPA at $ipa_path"
    exit 1
  fi

  unzip -q "$ipa_path" -d "$extracted_dir"

  local dsym_search_paths=("$extracted_dir")
  local xcode_archive_root="${IOS_ARCHIVE_ROOT:-$HOME/Library/Developer/Xcode/Archives}"
  local archive_dsyms_dir

  if [ -d "$xcode_archive_root" ]; then
    while IFS= read -r -d '' archive_dsyms_dir; do
      dsym_search_paths+=("$archive_dsyms_dir")
    done < <(
      find "$xcode_archive_root" \
        -type d \
        -name dSYMs \
        -newer "$build_marker" \
        -print0 2>/dev/null || true
    )
  fi

  run_sentry_helper sentry_upload_dsyms "${dsym_search_paths[@]}"
}

build_android() {
  local profile="$1"
  local artifact_path
  artifact_path="$(android_artifact_path "$profile")"

  rm -f "$artifact_path"

  run_with_variant_env bun run eas build \
    --local \
    --platform android \
    --profile "$profile" \
    --output "$artifact_path" \
    --non-interactive

  if [ ! -f "$artifact_path" ]; then
    echo "Unable to find an Android artifact at $artifact_path"
    exit 1
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
