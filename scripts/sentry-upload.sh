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

sentry_dist() {
  if [ -n "${EXPO_PUBLIC_SENTRY_DIST:-}" ]; then
    printf '%s\n' "$EXPO_PUBLIC_SENTRY_DIST"
    return
  fi

  if [ -n "${SENTRY_DIST:-}" ]; then
    printf '%s\n' "$SENTRY_DIST"
    return
  fi

  local git_sha
  if git_sha="$(git rev-parse HEAD 2>/dev/null)"; then
    printf '%s\n' "$git_sha"
    return
  fi

  printf 'local\n'
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
    SENTRY_RELEASE="$release" \
    SENTRY_DIST="$dist" \
    sentry_run_upload "$bin" debug-files upload \
    --org "${SENTRY_ORG:-luke-howsam}" \
    --project "${SENTRY_PROJECT:-foam}" \
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
  SENTRY_ORG="${SENTRY_ORG:-luke-howsam}" \
    SENTRY_PROJECT="${SENTRY_PROJECT:-foam}" \
    SENTRY_URL="${SENTRY_URL:-https://sentry.io/}" \
    SENTRY_RELEASE="$release" \
    SENTRY_DIST="$dist" \
    sentry_run_upload "$bin" "$output_dir"
}
