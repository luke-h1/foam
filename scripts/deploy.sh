#!/usr/bin/env bash
set -euo pipefail

#  bun run deploy -- internal ios
#  bun run deploy -- internal android
#  bun run deploy -- testflight ios
#  bun run deploy -- production all

source ./scripts/deploy-common.sh

validate_deploy_args "deploy"

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
