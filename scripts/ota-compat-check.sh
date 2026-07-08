#!/usr/bin/env bash
set -euo pipefail

# Local mirror of the "OTA compatibility check" GitHub workflow. Answers a
# single question for the current code: can it ship as an OTA update, or does it
# change the native fingerprint and therefore require a new native build?
#
# Compares the current working tree against a base commit (origin/main by
# default) using the same `expo-updates fingerprint:generate` the deploy
# pipeline relies on, across every variant/platform. Exits 0 when OTA
# compatible, 1 when a native release is required.
#
#   ./scripts/ota-compat-check.sh [base-ref]
#
# base-ref defaults to the merge-base with origin/main.

base_ref="${1:-}"
worktree_dir=".__ota_base__"

cleanup() {
  git worktree remove --force "$worktree_dir" 2>/dev/null || true
}
trap cleanup EXIT

if [ -z "$base_ref" ]; then
  echo "Fetching origin/main..."
  git fetch --no-tags origin main
  base_sha="$(git merge-base HEAD origin/main)"
else
  base_sha="$(git rev-parse "$base_ref")"
fi

echo "Base commit: $base_sha"

git worktree remove --force "$worktree_dir" 2>/dev/null || true
git worktree add --detach "$worktree_dir" "$base_sha"

echo "Installing dependencies for base commit..."
(cd "$worktree_dir" && bun install --frozen-lockfile)

ota_compatible="true"

for variant in production testflight internal; do
  echo "=== Variant: $variant ==="

  echo "Computing current fingerprints..."
  head_ios="$(EXPO_PUBLIC_APP_VARIANT="$variant" bunx expo-updates fingerprint:generate --platform ios | jq -r '.hash')"
  head_android="$(EXPO_PUBLIC_APP_VARIANT="$variant" bunx expo-updates fingerprint:generate --platform android | jq -r '.hash')"

  echo "Computing base fingerprints..."
  base_ios="$(cd "$worktree_dir" && EXPO_PUBLIC_APP_VARIANT="$variant" bunx expo-updates fingerprint:generate --platform ios | jq -r '.hash')"
  base_android="$(cd "$worktree_dir" && EXPO_PUBLIC_APP_VARIANT="$variant" bunx expo-updates fingerprint:generate --platform android | jq -r '.hash')"

  if [ "$head_ios" != "$base_ios" ]; then
    echo "  iOS fingerprint changed: $base_ios -> $head_ios"
    ota_compatible="false"
  else
    echo "  iOS fingerprint unchanged: $head_ios"
  fi

  if [ "$head_android" != "$base_android" ]; then
    echo "  Android fingerprint changed: $base_android -> $head_android"
    ota_compatible="false"
  else
    echo "  Android fingerprint unchanged: $head_android"
  fi
done

echo
if [ "$ota_compatible" = "true" ]; then
  echo "✅ OTA compatible: the current code does not alter the native fingerprint and can ship as an OTA update."
  exit 0
fi

echo "🔨 Native build required: the current code alters the native fingerprint. Bump the app version and cut a native release."
exit 1
