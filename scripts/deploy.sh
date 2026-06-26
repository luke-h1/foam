#!/usr/bin/env bash
set -euo pipefail

#  bun run deploy -- internal ios
#  bun run deploy -- internal android
#  bun run deploy -- testflight ios
#  bun run deploy -- production all
#
#  Add --no-push to build and submit without committing, tagging, pushing, or
#  creating the GitHub release (CHANGELOG.md is still regenerated locally):
#  bun run deploy -- internal ios --no-push

source ./scripts/deploy-common.sh

validate_deploy_args "deploy"

no_push_flag=""
for arg in "$@"; do
  if [ "$arg" = "--no-push" ]; then
    no_push_flag="--no-push"
  fi
done

./scripts/native-build-guard.sh "$variant"

case "$platform" in
  ios | android)
    ./scripts/build.sh "$variant" "$platform"
    ./scripts/submit.sh "$variant" "$platform"
    ;;
  all)
    ./scripts/build.sh "$variant" ios
    ./scripts/submit.sh "$variant" ios
    ./scripts/build.sh "$variant" android
    ./scripts/submit.sh "$variant" android
    ;;
esac

./scripts/save-fingerprint-cache.sh "$variant"

./scripts/release-github.sh "$variant" $no_push_flag
