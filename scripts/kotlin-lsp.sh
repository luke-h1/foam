#!/usr/bin/env bash
set -euo pipefail

#  ./scripts/kotlin-lsp.sh
#  KOTLIN_LSP_HOME=/path/to/kotlin-lsp ./scripts/kotlin-lsp.sh
#
# Imports the Android Gradle project and writes workspace.json at the repo root,
# so kotlin-lsp in Zed can resolve expo-modules-core and the libraries that
# local modules import. Run it again after you change a build.gradle.

ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
APP="$ROOT"
export EXPO_PUBLIC_APP_VARIANT="${EXPO_PUBLIC_APP_VARIANT:-development}"
export DISABLE_RNREPO="${DISABLE_RNREPO:-true}"
KOTLIN_LSP_HOME="${KOTLIN_LSP_HOME:-$HOME/.local/share/kotlin-lsp}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"

for script in export_workspace.py enrich_workspace.py; do
  if [[ ! -f "$KOTLIN_LSP_HOME/$script" ]]; then
    echo "$KOTLIN_LSP_HOME/$script not found. Set KOTLIN_LSP_HOME." >&2
    exit 1
  fi
done

# android/ is Expo CNG output. Keep an existing one, so the app variant it was
# generated for does not change.
if [[ ! -d "$APP/android" ]]; then
  (cd "$APP" && CI=1 bunx expo prebuild -p android)
fi

# The kotlin-lsp Gradle sync fails on the test variants of KSP modules such as
# expo-updates. This init script turns them off, but only when
# KOTLIN_LSP_IMPORT=1, so normal builds do not change.
mkdir -p "$HOME/.gradle/init.d"
cp "$ROOT/scripts/kotlin-lsp-import.gradle" "$HOME/.gradle/init.d/kotlin-lsp-import.gradle"
export KOTLIN_LSP_IMPORT=1

# kotlin-lsp imports the Gradle project, then writes workspace.json. The enrich
# step adds source roots for modules under node_modules, attaches -sources.jar
# files and drops build outputs that do not exist yet.
python3 "$KOTLIN_LSP_HOME/export_workspace.py" "$APP/android" "$ROOT"
python3 "$KOTLIN_LSP_HOME/enrich_workspace.py" "$ROOT"

echo "Wrote $ROOT/workspace.json. In Zed, run 'editor: restart language server'."
