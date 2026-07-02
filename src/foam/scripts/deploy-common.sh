#!/usr/bin/env bash

source ./scripts/sentry-upload.sh

variant="${1:-}"
platform="${2:-ios}"
dotenv_bin="${DOTENV_BIN:-$(resolve_workspace_bin dotenv)}"

validate_deploy_args() {
  local command_name="$1"

  case "$variant" in
    internal | testflight | production) ;;
    *)
      echo "Usage: bun run $command_name -- <internal|testflight|production> [ios|android|all]"
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
    echo "The testflight variant is iOS-only. Use: bun run $command_name -- testflight ios"
    exit 1
  fi
}

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
      -u SENTRY_AUTH_TOKEN \
      "SENTRY_DISABLE_AUTO_UPLOAD=true" \
      "SENTRY_LOAD_DOTENV=0" \
      "SENTRY_RELEASE=$sentry_release_value" \
      "SENTRY_DIST=$sentry_dist_value" \
      "$@"
    return
  fi

  env \
    -u SENTRY_AUTH_TOKEN \
    EXPO_PUBLIC_APP_VARIANT="$variant" \
    EXPO_PUBLIC_SENTRY_RELEASE="$sentry_release_value" \
    EXPO_PUBLIC_SENTRY_DIST="$sentry_dist_value" \
    SENTRY_DISABLE_AUTO_UPLOAD=true \
    SENTRY_LOAD_DOTENV=0 \
    SENTRY_RELEASE="$sentry_release_value" \
    SENTRY_DIST="$sentry_dist_value" \
    "$@"
}

run_with_sentry_upload_env() {
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
      "SENTRY_LOAD_DOTENV=0" \
      "SENTRY_RELEASE=$sentry_release_value" \
      "SENTRY_DIST=$sentry_dist_value" \
      "$@"
    return
  fi

  EXPO_PUBLIC_APP_VARIANT="$variant" \
    EXPO_PUBLIC_SENTRY_RELEASE="$sentry_release_value" \
    EXPO_PUBLIC_SENTRY_DIST="$sentry_dist_value" \
    SENTRY_LOAD_DOTENV=0 \
    SENTRY_RELEASE="$sentry_release_value" \
    SENTRY_DIST="$sentry_dist_value" \
    "$@"
}

run_sentry_helper() {
  local function_name="$1"
  shift

  run_with_sentry_upload_env bash -c 'source ./scripts/sentry-upload.sh; "$@"' _ "$function_name" "$@"
}

ios_artifact_path() {
  local profile="$1"
  printf './build-artifacts/app-%s.ipa\n' "$profile"
}

ios_extracted_dir() {
  local profile="$1"
  printf './build-artifacts/ios-%s\n' "$profile"
}

android_artifact_path() {
  local profile="$1"

  case "$profile" in
    internal | production)
      printf './build-artifacts/app-%s.aab\n' "$profile"
      ;;
    *)
      printf './build-artifacts/app-%s.apk\n' "$profile"
      ;;
  esac
}
