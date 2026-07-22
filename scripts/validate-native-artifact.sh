#!/usr/bin/env bash

set -euo pipefail

variant="${1:-}"
platform="${2:-}"
artifact="${3:-}"

if [ -z "$variant" ] || [ -z "$platform" ] || [ -z "$artifact" ]; then
  echo "Usage: $0 <internal|testflight|production> <ios|android> <artifact>" >&2
  exit 1
fi

case "$variant" in
  internal)
    expected_ios_bundle_id='foam-tv-internal'
    expected_android_package='com.lhowsam.foam.internal'
    ;;
  testflight)
    expected_ios_bundle_id='foam-tv-testflight'
    expected_android_package='com.lhowsam.foam.testflight'
    ;;
  production)
    expected_ios_bundle_id='foam-tv'
    expected_android_package='com.lhowsam.foam_tv'
    ;;
  *)
    echo "Unsupported variant: $variant" >&2
    exit 1
    ;;
esac

if [ ! -f "$artifact" ]; then
  echo "Native artifact does not exist: $artifact" >&2
  exit 1
fi

case "$platform" in
  ios)
    info_plist_path="$(unzip -Z1 "$artifact" | rg -m 1 '^Payload/[^/]+\.app/Info\.plist$' || true)"
    if [ -z "$info_plist_path" ]; then
      echo "Unable to find the iOS app Info.plist in $artifact" >&2
      exit 1
    fi

    actual_bundle_id="$(unzip -p "$artifact" "$info_plist_path" | plutil -extract CFBundleIdentifier raw -o - -)"
    if [ "$actual_bundle_id" != "$expected_ios_bundle_id" ]; then
      echo "Native artifact variant mismatch: expected iOS bundle $expected_ios_bundle_id, got $actual_bundle_id" >&2
      exit 1
    fi
    ;;
  android)
    if ! command -v bundletool >/dev/null 2>&1; then
      echo 'bundletool is required to validate an Android App Bundle' >&2
      exit 1
    fi

    actual_package="$(bundletool dump manifest --bundle="$artifact" | sed -n 's/.*package="\([^"]*\)".*/\1/p' | head -n 1)"
    if [ "$actual_package" != "$expected_android_package" ]; then
      echo "Native artifact variant mismatch: expected Android package $expected_android_package, got ${actual_package:-<missing>}" >&2
      exit 1
    fi
    ;;
  *)
    echo "Unsupported platform: $platform" >&2
    exit 1
    ;;
esac

echo "Validated $variant $platform native artifact: $artifact"
