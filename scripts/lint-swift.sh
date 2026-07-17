#!/usr/bin/env bash
set -euo pipefail

# Formats (SwiftFormat) and lints (SwiftLint) Swift files, autofixing in place.
# Passed staged *.swift paths by lint-staged, or run with no args for the whole
# project. With LINT_CHECK=1 it verifies formatting instead of writing (for CI).
# Warns and exits 0 when the tools aren't installed.
#
#  ./scripts/lint-swift.sh [file ...]
#  LINT_CHECK=1 ./scripts/lint-swift.sh

if ! command -v swiftlint >/dev/null 2>&1; then
  echo "⚠️  swiftlint not found - skipping Swift lint. Install with: brew install swiftlint" >&2
  exit 0
fi

format() {
  if ! command -v swiftformat >/dev/null 2>&1; then
    echo "⚠️  swiftformat not found - skipping format. Install with: brew install swiftformat" >&2
    return 0
  fi
  if [ "${LINT_CHECK:-}" = "1" ]; then
    swiftformat --lint "$@"
  else
    swiftformat "$@"
  fi
}

# Run format and lint independently and aggregate their status so a formatting
# failure doesn't mask lint results (and vice versa) in a single run.
files=("$@")
status=0
if [ "${#files[@]}" -eq 0 ]; then
  format modules || status=1
  [ "${LINT_CHECK:-}" = "1" ] || swiftlint lint --fix --quiet || true
  swiftlint lint --quiet || status=1
else
  format "${files[@]}" || status=1
  [ "${LINT_CHECK:-}" = "1" ] || swiftlint lint --fix --quiet -- "${files[@]}" || true
  swiftlint lint --quiet -- "${files[@]}" || status=1
fi
exit "$status"
