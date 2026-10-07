#!/usr/bin/env bash
set -euo pipefail

#  bun run dropper -- upload build-artifacts/app-internal-preview.ipa --notes "Fix login crash"
#  bun run dropper -- list
#  bun run dropper -- delete <id>

export DROPPER_URL="${DROPPER_URL:-https://builds.tightlog.com}"

if [ -z "${DROPPER_API_KEY:-}" ]; then
  DROPPER_API_KEY="$(op read op://ci-cd/tightlog-apk-ipa-uploader/DROPPER_API_KEY)"
  export DROPPER_API_KEY
fi

dir="$(mktemp -d "${TMPDIR:-/tmp}/dropper.XXXXXX")"
trap 'rm -rf "$dir"' EXIT
curl -fsSL "$DROPPER_URL/dropper.mjs" -o "$dir/dropper.mjs"
node "$dir/dropper.mjs" "$@"
