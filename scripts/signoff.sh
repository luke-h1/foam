#!/usr/bin/env bash
#
# Runs the full local CI suite and, if it comes back green, posts a `signoff`
# commit status on HEAD (basecamp/gh-signoff).
#
#   bun run signoff
#
# The status is not a required check: merges still gate on the GitHub workflows,
# so this records that the suite passed on this machine rather than unlocking
# anything. `gh signoff install` would make it required.
#
# Deliberately takes no job filter. Signing off asserts that every check passed,
# so it always runs the whole suite; use `bun run ci:local <job>` while
# iterating on one thing.

set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

if [ $# -gt 0 ]; then
  echo "usage: bun run signoff    (no arguments; to narrow, run: bun run ci:local $*)" >&2
  exit 64
fi

if ! command -v gh >/dev/null; then
  echo "gh not found. Install the GitHub CLI: https://cli.github.com" >&2
  exit 1
fi

if ! gh extension list | grep -q 'basecamp/gh-signoff'; then
  echo "gh-signoff not installed. Run: gh extension install basecamp/gh-signoff" >&2
  exit 1
fi

./scripts/ci-local.sh || exit 1

# gh signoff refuses unless HEAD is contained in @{push}, so push first.
gh signoff
