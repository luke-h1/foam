#!/usr/bin/env bash
set -euo pipefail

#  ./scripts/swift-lsp.sh
#  DEVELOPER_DIR=/path/to/Xcode.app/Contents/Developer ./scripts/swift-lsp.sh
#
# Builds the iOS app once and writes buildServer.json and .compile at the repo
# root, so sourcekit-lsp in Zed can resolve the pods that local modules import.
# Run it again after you add a native dependency or change a podspec.

ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
APP="$ROOT"
export EXPO_PUBLIC_APP_VARIANT="${EXPO_PUBLIC_APP_VARIANT:-development}"
export DISABLE_RNREPO="${DISABLE_RNREPO:-true}"

# Must be the Xcode that Zed's sourcekit-lsp uses: modules built by a newer
# Swift compiler cannot be read by an older sourcekit-lsp.
export DEVELOPER_DIR="${DEVELOPER_DIR:-/Applications/Xcode.app/Contents/Developer}"

if ! command -v xcode-build-server >/dev/null; then
  echo "xcode-build-server is not installed. Run: brew install xcode-build-server" >&2
  exit 1
fi

# ios/ is Expo CNG output. Keep an existing one, so the app variant it was
# generated for does not change.
if [[ ! -d "$APP/ios" ]]; then
  (cd "$APP" && CI=1 bunx expo prebuild -p ios)
fi

WORKSPACE="$(find "$APP/ios" -maxdepth 1 -name '*.xcworkspace' | head -1)"
if [[ -z "$WORKSPACE" ]]; then
  echo "No .xcworkspace in $APP/ios. Run pod install." >&2
  exit 1
fi
SCHEME="$(basename "$WORKSPACE" .xcworkspace)"

# xcode-build-server reads compiler flags from the full xcodebuild log, so do
# not pass -quiet. A failed app build still logs the flags of every target that
# compiled, which is enough for sourcekit-lsp, so warn and continue.
# Build only this Mac's architecture: the x86_64 simulator slice of some pods,
# such as RNSentry, does not build, and sourcekit-lsp needs one slice only.
# An incremental build only logs the targets it rebuilt, so later runs append to
# .compile. The first run also writes buildServer.json.
cd "$ROOT"
parse=(xcode-build-server parse)
if [[ -f .compile && -f buildServer.json ]]; then
  parse+=(-a -o .compile)
fi
if ! xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Debug \
  -destination 'generic/platform=iOS Simulator' \
  ARCHS="$(uname -m)" \
  ONLY_ACTIVE_ARCH=YES \
  build 2>&1 | "${parse[@]}" >/dev/null; then
  echo "warning: xcodebuild failed. Files in targets that did not compile will have no completions." >&2
fi

echo "Wrote $ROOT/buildServer.json and $ROOT/.compile for $SCHEME. In Zed, run 'editor: restart language server'."
