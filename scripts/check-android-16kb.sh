#!/usr/bin/env bash
# Checks every native library in an APK or AAB for 16 KB page support: each
# ELF LOAD segment must align to 0x4000. Compressed libraries (the app ships
# with useLegacyPackaging=true) only need the ELF check; uncompressed ones
# also need zipalign -P 16, which runs when zipalign is installed.
#
# Usage: scripts/check-android-16kb.sh path/to/app.aab
set -euo pipefail

ARTIFACT=${1:?usage: $0 <apk|aab>}
SDK=${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Library/Android/sdk}}
READELF=$(ls "$SDK"/ndk/*/toolchains/llvm/prebuilt/*/bin/llvm-readelf 2>/dev/null | tail -1 || true)
ZIPALIGN=$(ls "$SDK"/build-tools/*/zipalign 2>/dev/null | tail -1 || true)

if [ -z "$READELF" ] || [ ! -x "$READELF" ]; then
  echo "llvm-readelf not found under $SDK/ndk" >&2
  exit 2
fi

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

if ! unzip -q "$ARTIFACT" '*.so' -d "$TMP"; then
  echo "no native libraries in $ARTIFACT" >&2
  exit 2
fi

fail=0
count=0
while IFS= read -r lib; do
  count=$((count + 1))
  for align in $("$READELF" -lW "$lib" | awk '$1 == "LOAD" { print $NF }'); do
    if [ "$((align))" -lt 16384 ]; then
      echo "FAIL ${lib#"$TMP"/}: LOAD segment align $align"
      fail=1
    fi
  done
done < <(find "$TMP" -name '*.so')

echo "checked $count native libraries for 16 KB ELF alignment"

if [ -n "$ZIPALIGN" ]; then
  if "$ZIPALIGN" -c -P 16 -v 4 "$ARTIFACT" > /dev/null 2>&1; then
    echo "zipalign -P 16: aligned"
  else
    echo "zipalign -P 16: not aligned (expected while native libraries are compressed)"
  fi
fi

exit $fail
