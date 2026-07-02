#!/usr/bin/env bash
set -euo pipefail

#  bun run submit -- internal ios
#  bun run submit -- internal android
#  bun run submit -- testflight ios
#  bun run submit -- production all

source ./scripts/deploy-common.sh

validate_deploy_args "submit"

submit_ios() {
  local profile="$1"
  local artifact_path
  artifact_path="$(ios_artifact_path "$profile")"

  if [ ! -f "$artifact_path" ]; then
    echo "Unable to find an IPA at $artifact_path"
    exit 1
  fi

  run_with_variant_env bun run eas submit \
    --platform ios \
    --profile "$profile" \
    --path "$artifact_path"
}

submit_android() {
  local profile="$1"
  local artifact_path
  artifact_path="$(android_artifact_path "$profile")"

  if [ ! -f "$artifact_path" ]; then
    echo "Unable to find an Android artifact at $artifact_path"
    exit 1
  fi

  run_with_variant_env bun run eas submit \
    --platform android \
    --profile "$profile" \
    --path "$artifact_path"
}

case "$platform" in
  ios)
    submit_ios "$variant"
    ;;
  android)
    submit_android "$variant"
    ;;
  all)
    submit_ios "$variant"
    submit_android "$variant"
    ;;
esac
