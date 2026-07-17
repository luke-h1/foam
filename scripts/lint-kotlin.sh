#!/usr/bin/env bash
set -euo pipefail

# Formats and lints Kotlin files with ktlint (config in .editorconfig),
# autofixing in place. Passed staged *.kt/*.kts paths by lint-staged, or run
# with no args for android/ and modules/. With LINT_CHECK=1 it verifies without
# writing (for CI). Warns and exits 0 when ktlint isn't installed.
#
#  ./scripts/lint-kotlin.sh [file ...]
#  LINT_CHECK=1 ./scripts/lint-kotlin.sh

if ! command -v ktlint >/dev/null 2>&1; then
  echo "⚠️  ktlint not found - skipping Kotlin lint. Install with: brew install ktlint" >&2
  exit 0
fi

files=("$@")
if [ "${#files[@]}" -eq 0 ]; then
  files=("android/**/*.kt" "android/**/*.kts" "modules/**/*.kt")
fi

if [ "${LINT_CHECK:-}" = "1" ]; then
  ktlint --relative -- "${files[@]}"
else
  ktlint --format --relative -- "${files[@]}"
fi
