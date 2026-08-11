#!/usr/bin/env bash
#
# Runs the checks GitHub Actions runs on a pull request, in one go.
#
#   bun run ci:local              # everything
#   bun run ci:local lint ts      # only the named jobs
#   SKIP_DOCTOR=1 bun run ci:local
#
# Jobs mirror .github/workflows, and like the CI matrices this does not fail
# fast: every job runs and the summary at the end lists what broke.
#
# Two jobs are close rather than exact. React Doctor runs the latest CLI where
# CI pins v2.2.8, though both scan the same changed-files-against-the-merge-base
# baseline. zizmor here is whatever version is on PATH rather than the pinned
# action.
#
# The native lint jobs skip themselves when swiftlint/swiftformat/ktlint are not
# installed, and the Kotlin one has nothing to scan until `bun run prebuild` has
# generated android/.
#
# Not covered, having no local equivalent: CodeQL, the codex and cursor review
# bots, fingerprint detection, e2e, chat performance, OTA compatibility,
# enforce-rebase, and label.

set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

BOLD=$'\033[1m'
RED=$'\033[31m'
GREEN=$'\033[32m'
DIM=$'\033[2m'
RESET=$'\033[0m'

PASSED=()
FAILED=()
SKIPPED=()

run() {
  local label="$1"
  shift
  printf '\n%s▶ %s%s %s%s%s\n' "$BOLD" "$label" "$RESET" "$DIM" "$*" "$RESET"
  if "$@"; then
    PASSED+=("$label")
  else
    FAILED+=("$label")
  fi
}

skip() {
  printf '\n%s▶ %s%s %s(skipped: %s)%s\n' "$BOLD" "$1" "$RESET" "$DIM" "$2" "$RESET"
  SKIPPED+=("$1")
}

# React Doctor's CI action scans a PR's changed files against the merge base and
# reports only the issues new relative to it. Handed no scope the CLI scans the
# whole project and reports the entire standing backlog, which no branch could
# ever clear, so resolve the same base here.
doctor_base() {
  git merge-base HEAD origin/main 2>/dev/null ||
    git merge-base HEAD main 2>/dev/null ||
    echo main
}

wants() {
  [ ${#JOBS[@]} -eq 0 ] && return 0
  local job
  for job in "${JOBS[@]}"; do
    [ "$job" = "$1" ] && return 0
  done
  return 1
}

JOBS=("$@")

if wants prettier; then
  run 'Prettier check' bun run format:check
fi

if wants ast-grep; then
  run 'ast-grep rules' bun run test:ast-grep
  run 'ast-grep scan' bun run lint:ast-grep
fi

if wants ts; then
  run 'TypeScript' bun run ts:check
fi

if wants lint; then
  run 'ESLint' bun run lint
fi

if wants test; then
  run 'Jest' bun run test -- --maxWorkers=100%
fi

if wants native; then
  # Both scripts warn and exit 0 when their tool is missing, so they report as
  # passes rather than skips on a machine without swiftlint or ktlint.
  run 'SwiftLint' env LINT_CHECK=1 ./scripts/lint-swift.sh

  # ktlint is handed the tracked files explicitly. Left to pick its own roots it
  # also walks android/, which is gitignored prebuild output: it exists on any
  # machine that has run `bun run prebuild` but never on CI's checkout, so the
  # job would fail here over generated code that CI never lints.
  KOTLIN_FILES=()
  while IFS= read -r file; do
    KOTLIN_FILES+=("$file")
  done < <(git ls-files '*.kt' '*.kts')
  if [ ${#KOTLIN_FILES[@]} -gt 0 ]; then
    run 'ktlint' env LINT_CHECK=1 ./scripts/lint-kotlin.sh "${KOTLIN_FILES[@]}"
  else
    skip 'ktlint' 'no tracked Kotlin files'
  fi
fi

if wants commitlint; then
  if git rev-parse --verify --quiet HEAD^1 >/dev/null; then
    run 'Commitlint' bun run commitlint --from=HEAD^1
  else
    skip 'Commitlint' 'no parent commit to lint against'
  fi
fi

if wants doctor; then
  if [ -n "${SKIP_DOCTOR:-}" ]; then
    skip 'React Doctor' 'SKIP_DOCTOR is set'
  else
    run 'React Doctor' npx react-doctor@latest \
      --scope changed --base "$(doctor_base)" --include-untracked
  fi
fi

if wants zizmor; then
  if command -v zizmor >/dev/null; then
    run 'zizmor' zizmor .github/workflows
  elif command -v uvx >/dev/null; then
    run 'zizmor' uvx zizmor .github/workflows
  else
    skip 'zizmor' 'install zizmor or uv to lint the workflow files'
  fi
fi

printf '\n%s── summary ──%s\n' "$BOLD" "$RESET"
for label in "${PASSED[@]:-}"; do
  [ -n "$label" ] && printf '%s  pass%s  %s\n' "$GREEN" "$RESET" "$label"
done
for label in "${SKIPPED[@]:-}"; do
  [ -n "$label" ] && printf '%s  skip  %s%s\n' "$DIM" "$label" "$RESET"
done
for label in "${FAILED[@]:-}"; do
  [ -n "$label" ] && printf '%s  FAIL%s  %s\n' "$RED" "$RESET" "$label"
done

if [ ${#FAILED[@]} -gt 0 ]; then
  printf '\n%s%d job(s) failed.%s\n' "$RED" "${#FAILED[@]}" "$RESET"
  exit 1
fi

printf '\n%sAll green.%s\n' "$GREEN" "$RESET"
