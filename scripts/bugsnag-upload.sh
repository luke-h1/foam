#!/usr/bin/env bash

set -euo pipefail

bugsnag_uploads_disabled() {
  [ "${BUGSNAG_DISABLE_AUTO_UPLOAD:-}" = "true" ] || [ "${BUGSNAG_DISABLE_UPLOAD:-}" = "true" ]
}

bugsnag_api_key() {
  printf '%s\n' "${BUGSNAG_API_KEY:-${EXPO_PUBLIC_BUGSNAG_API_KEY:-}}"
}

bugsnag_has_api_key() {
  [ -n "$(bugsnag_api_key)" ]
}

bugsnag_app_version() {
  local version
  version="$(sed -n "s/^const VERSION = '\([^']*\)';/\1/p" app.config.ts | head -n 1)"

  if [ -n "$version" ]; then
    printf '%s\n' "$version"
    return
  fi

  printf 'local\n'
}

bugsnag_source_maps_bin() {
  local bin="${BUGSNAG_SOURCE_MAPS_BIN:-./node_modules/.bin/bugsnag-source-maps}"

  if [ ! -x "$bin" ]; then
    echo "Missing Bugsnag source-maps CLI at $bin. Run bun install first." >&2
    return 1
  fi

  printf '%s\n' "$bin"
}

bugsnag_run_upload() {
  if [ "${BUGSNAG_ALLOW_FAILURE:-}" = "true" ]; then
    "$@" || echo "Bugsnag upload failed, continuing because BUGSNAG_ALLOW_FAILURE=true"
    return 0
  fi

  "$@"
}

bugsnag_bundle_for_map() {
  local map="$1"
  local bundle="${map%.map}"

  if [ -f "$bundle" ]; then
    printf '%s\n' "$bundle"
    return 0
  fi

  local sibling
  sibling="$(find "$(dirname "$map")" -maxdepth 1 -type f ! -name '*.map' -print -quit 2>/dev/null || true)"
  if [ -n "$sibling" ]; then
    printf '%s\n' "$sibling"
    return 0
  fi

  return 1
}

bugsnag_upload_ota_sourcemaps() {
  local output_dir="${1:-dist}"

  if bugsnag_uploads_disabled; then
    echo "Skipping Bugsnag sourcemap upload because Bugsnag uploads are disabled"
    return 0
  fi

  if ! bugsnag_has_api_key; then
    echo "Skipping Bugsnag sourcemap upload because BUGSNAG_API_KEY is not set"
    return 0
  fi

  if [ ! -d "$output_dir" ]; then
    echo "Skipping Bugsnag sourcemap upload because $output_dir does not exist"
    return 0
  fi

  local search_dir="$output_dir"
  if [ -d "$output_dir/_expo/static/js" ]; then
    search_dir="$output_dir/_expo/static/js"
  fi

  local maps=()
  local map
  while IFS= read -r -d '' map; do
    maps+=("$map")
  done < <(find "$search_dir" -name '*.map' -print0 2>/dev/null || true)

  if [ "${#maps[@]}" -eq 0 ]; then
    echo "Skipping Bugsnag sourcemap upload because no source maps were found in $output_dir"
    return 0
  fi

  local bin api_key app_version
  bin="$(bugsnag_source_maps_bin)"
  api_key="$(bugsnag_api_key)"
  app_version="$(bugsnag_app_version)"

  for map in "${maps[@]}"; do
    local platform
    platform="$(basename "$(dirname "$map")")"

    case "$platform" in
      ios | android) ;;
      *)
        echo "Skipping $map because platform '$platform' is not ios/android"
        continue
        ;;
    esac

    local bundle
    if ! bundle="$(bugsnag_bundle_for_map "$map")"; then
      echo "Skipping $map because no matching bundle was found"
      continue
    fi

    local args=(
      upload-react-native
      --api-key "$api_key"
      --platform "$platform"
      --bundle "$bundle"
      --source-map "$map"
      --overwrite
    )

    if [ -n "${BUGSNAG_CODE_BUNDLE_ID:-}" ]; then
      args+=(--code-bundle-id "$BUGSNAG_CODE_BUNDLE_ID")
    else
      args+=(--app-version "$app_version")
    fi

    echo "Uploading Bugsnag source map for $platform: $map"
    bugsnag_run_upload "$bin" "${args[@]}"
  done
}
