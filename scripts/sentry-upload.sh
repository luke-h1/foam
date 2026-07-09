#!/usr/bin/env bash

set -euo pipefail

sentry_uploads_disabled() {
  [ "${SENTRY_DISABLE_AUTO_UPLOAD:-}" = "true" ] || [ "${SENTRY_DISABLE_UPLOAD:-}" = "true" ]
}

sentry_has_auth_token() {
  [ -n "${SENTRY_AUTH_TOKEN:-}" ]
}

sentry_app_version() {
  local version
  version="$(sed -n "s/^const VERSION = '\([^']*\)';/\1/p" app.config.ts | head -n 1)"

  if [ -n "$version" ]; then
    printf '%s\n' "$version"
    return
  fi

  printf 'local\n'
}

sentry_release() {
  printf '%s\n' "${EXPO_PUBLIC_SENTRY_RELEASE:-${SENTRY_RELEASE:-$(sentry_app_version)}}"
}

sentry_dist_for_variant() {
  local app_variant="${EXPO_PUBLIC_APP_VARIANT:-${variant:-development}}"

  case "$app_variant" in
    internal)
      printf 'foam-tv-internal\n'
      ;;
    testflight)
      printf 'foam-tv-testflight\n'
      ;;
    production)
      printf 'foam-tv\n'
      ;;
    *)
      printf 'foam-tv-dev\n'
      ;;
  esac
}

sentry_dist() {
  if [ -n "${EXPO_PUBLIC_SENTRY_DIST:-}" ]; then
    printf '%s\n' "$EXPO_PUBLIC_SENTRY_DIST"
    return
  fi

  if [ -n "${SENTRY_DIST:-}" ]; then
    printf '%s\n' "$SENTRY_DIST"
    return
  fi

  sentry_dist_for_variant
}

sentry_size_analysis_build_configuration() {
  local app_variant="${EXPO_PUBLIC_APP_VARIANT:-${variant:-${VARIANT:-development}}}"
  printf 'Release-%s\n' "$app_variant"
}

sentry_find_ios_size_analysis_artifact() {
  local ipa_path="$1"
  local build_marker="$2"
  local xcode_archive_root="${IOS_ARCHIVE_ROOT:-$HOME/Library/Developer/Xcode/Archives}"
  local xcarchive_path=""

  if [ -d "$xcode_archive_root" ] && [ -f "$build_marker" ]; then
    local -a archives=()
    while IFS= read -r -d '' archive; do
      archives+=("$archive")
    done < <(
      find "$xcode_archive_root" \
        -type d \
        -name '*.xcarchive' \
        -newer "$build_marker" \
        -print0 2>/dev/null || true
    )

    if [ "${#archives[@]}" -gt 0 ]; then
      xcarchive_path="$(
        printf '%s\0' "${archives[@]}" | xargs -0 ls -td 2>/dev/null | head -1 || true
      )"
    fi
  fi

  if [ -n "$xcarchive_path" ] && [ "$xcarchive_path" != "." ] && [ -e "$xcarchive_path" ]; then
    printf '%s\n' "$xcarchive_path"
    return
  fi

  printf '%s\n' "$ipa_path"
}

sentry_upload_size_analysis() {
  local artifact_path="$1"

  if sentry_uploads_disabled; then
    echo "Skipping Sentry Size Analysis upload because Sentry uploads are disabled"
    return 0
  fi

  if ! sentry_has_auth_token; then
    echo "Skipping Sentry Size Analysis upload because SENTRY_AUTH_TOKEN is not set"
    return 0
  fi

  if [ ! -e "$artifact_path" ]; then
    echo "Skipping Sentry Size Analysis upload because $artifact_path does not exist"
    return 0
  fi

  local bin
  bin="$(sentry_cli_bin)"

  local build_configuration
  build_configuration="$(sentry_size_analysis_build_configuration)"

  echo "Uploading Sentry Size Analysis build from $artifact_path ($build_configuration)"
  SENTRY_URL="${SENTRY_URL:-https://sentry.io/}" \
    SENTRY_LOAD_DOTENV="${SENTRY_LOAD_DOTENV:-0}" \
    sentry_run_upload "$bin" build upload "$artifact_path" \
      --org "${SENTRY_ORG:-foam-tv}" \
      --project "${SENTRY_PROJECT:-foam-tv-mobile}" \
      --build-configuration "$build_configuration"
}

sentry_cli_bin() {
  local bin="${SENTRY_CLI_BIN:-./node_modules/.bin/sentry-cli}"

  if [ ! -x "$bin" ]; then
    echo "Missing Sentry CLI at $bin. Run bun install first." >&2
    return 1
  fi

  printf '%s\n' "$bin"
}

sentry_expo_upload_sourcemaps_bin() {
  local bin="${SENTRY_EXPO_UPLOAD_SOURCEMAPS_BIN:-./node_modules/.bin/sentry-expo-upload-sourcemaps}"

  if [ ! -x "$bin" ]; then
    echo "Missing Sentry Expo sourcemap uploader at $bin. Run bun install first." >&2
    return 1
  fi

  printf '%s\n' "$bin"
}

sentry_run_upload() {
  if [ "${SENTRY_ALLOW_FAILURE:-}" = "true" ]; then
    "$@" || echo "Sentry upload failed, continuing because SENTRY_ALLOW_FAILURE=true"
    return 0
  fi

  "$@"
}

sentry_upload_dsyms() {
  if sentry_uploads_disabled; then
    echo "Skipping Sentry dSYM upload because Sentry uploads are disabled"
    return 0
  fi

  if ! sentry_has_auth_token; then
    echo "Skipping Sentry dSYM upload because SENTRY_AUTH_TOKEN is not set"
    return 0
  fi

  local paths=()
  local path

  for path in "$@"; do
    if [ -e "$path" ]; then
      paths+=("$path")
    fi
  done

  if [ "${#paths[@]}" -eq 0 ]; then
    echo "Skipping Sentry dSYM upload because no symbol search paths exist"
    return 0
  fi

  local dsym_paths=()
  local dsym_path

  while IFS= read -r -d '' dsym_path; do
    dsym_paths+=("$dsym_path")
  done < <(find "${paths[@]}" -name '*.app.dSYM.zip' -print0 2>/dev/null || true)

  if [ "${#dsym_paths[@]}" -eq 0 ]; then
    while IFS= read -r -d '' dsym_path; do
      dsym_paths+=("$dsym_path")
    done < <(find "${paths[@]}" -name '*.dSYM.zip' -print0 2>/dev/null || true)
  fi

  if [ "${#dsym_paths[@]}" -eq 0 ]; then
    while IFS= read -r -d '' dsym_path; do
      dsym_paths+=("$dsym_path")
    done < <(find "${paths[@]}" -name '*.dSYM' -print0 2>/dev/null || true)
  fi

  if [ "${#dsym_paths[@]}" -eq 0 ]; then
    echo "Skipping Sentry dSYM upload because no dSYM files were found"
    return 0
  fi

  local bin
  bin="$(sentry_cli_bin)"

  local release
  local dist
  release="$(sentry_release)"
  dist="$(sentry_dist)"

  echo "Uploading Sentry dSYMs from ${dsym_paths[*]}"
  SENTRY_URL="${SENTRY_URL:-https://sentry.io/}" \
    SENTRY_LOAD_DOTENV="${SENTRY_LOAD_DOTENV:-0}" \
    SENTRY_RELEASE="$release" \
    SENTRY_DIST="$dist" \
    sentry_run_upload "$bin" debug-files upload \
    --org "${SENTRY_ORG:-foam-tv}" \
    --project "${SENTRY_PROJECT:-foam-tv-mobile}" \
    --include-sources \
    --type dsym \
    "${dsym_paths[@]}"
}

sentry_upload_ota_sourcemaps() {
  local output_dir="${1:-dist}"

  if sentry_uploads_disabled; then
    echo "Skipping Sentry sourcemap upload because Sentry uploads are disabled"
    return 0
  fi

  if ! sentry_has_auth_token; then
    echo "Skipping Sentry sourcemap upload because SENTRY_AUTH_TOKEN is not set"
    return 0
  fi

  if [ ! -d "$output_dir" ]; then
    echo "Skipping Sentry sourcemap upload because $output_dir does not exist"
    return 0
  fi

  local sourcemap_path
  sourcemap_path="$(find "$output_dir" -name '*.map' -print -quit 2>/dev/null || true)"

  if [ -z "$sourcemap_path" ]; then
    echo "Skipping Sentry sourcemap upload because no source maps were found in $output_dir"
    return 0
  fi

  local bin
  bin="$(sentry_expo_upload_sourcemaps_bin)"

  local release
  local dist
  release="$(sentry_release)"
  dist="$(sentry_dist)"

  echo "Uploading Sentry OTA source maps from $output_dir"
  SENTRY_ORG="${SENTRY_ORG:-foam-tv}" \
    SENTRY_PROJECT="${SENTRY_PROJECT:-foam-tv-mobile}" \
    SENTRY_URL="${SENTRY_URL:-https://sentry.io/}" \
    SENTRY_LOAD_DOTENV="${SENTRY_LOAD_DOTENV:-0}" \
    SENTRY_RELEASE="$release" \
    SENTRY_DIST="$dist" \
    sentry_run_upload "$bin" "$output_dir"
}
