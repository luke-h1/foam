#!/usr/bin/env bash
#
# Runs the checks GitHub Actions runs on a pull request, in one go.
#
#   bun run ci:local              # everything
#   bun run ci:local lint ts      # only the named jobs
#   SKIP_DOCTOR=1 bun run ci:local
#
# Each job's full output goes to .ci-local/<job>.log. The summary names the log
# and prints its failure lines, so a failing test is findable without scrolling
# the combined output.
#
# Jobs mirror .github/workflows, and like the CI matrices this does not fail
# fast: every job runs and the summary at the end lists what broke.
#
# Two jobs are close rather than exact. React Doctor runs the latest CLI where
# CI pins v2.2.9, though both scan the same changed-files-against-the-merge-base
# baseline. zizmor runs with --offline to match the action's
# `online-audits: false`; online audits flagged findings CI never reports.
#
# The native lint jobs skip themselves when swiftlint/swiftformat/ktlint are not
# installed, and the Kotlin one has nothing to scan until `bun run prebuild` has
# generated android/.
#
# Not covered, having no local equivalent: CodeQL, the codex review bot,
# fingerprint detection, e2e, chat performance, OTA compatibility,
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

LOG_DIR=.ci-local
rm -rf "$LOG_DIR"
mkdir -p "$LOG_DIR"

log_path() {
  printf '%s/%s.log' "$LOG_DIR" "$(printf '%s' "$1" | tr 'A-Z ' 'a-z-')"
}

run() {
  local label="$1"
  shift
  printf '\n%s▶ %s%s %s%s%s\n' "$BOLD" "$label" "$RESET" "$DIM" "$*" "$RESET"

  "$@" 2>&1 | tee "$(log_path "$label")"

  if [ "${PIPESTATUS[0]}" -eq 0 ]; then
    PASSED+=("$label")
  else
    FAILED+=("$label")
  fi
}

# The lines that name what broke: Jest suites and tests, tsc and lint errors.
# A job with none of those markers shows the end of its log instead.
print_failure_lines() {
  local log lines
  log="$(log_path "$1")"
  printf '%s        %s%s\n' "$DIM" "$log" "$RESET"

  lines="$(grep -E '^FAIL |● .+ › |✕|error' "$log" | grep -v '^error: script ' | head -n 20)"

  if [ -z "$lines" ]; then
    lines="$(grep -v '^error: script ' "$log" | tail -n 15)"
  fi

  printf '%s\n' "$lines" | sed 's/^/        /'
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

# The CLI only sets a failing exit code when it could diff against a baseline.
# A branch with a large rename (1,400+ files in #909) leaves the baseline
# "degraded": the CLI still prints every error in the changed files, then exits
# 0, so the job passed while CI posted the same errors on the PR. Gate on the
# error count in the JSON report instead of the exit code.
react_doctor() {
  local report
  report="$(mktemp)"

  npx react-doctor@latest --scope changed --base "$(doctor_base)" \
    --include-untracked --no-score --json --json-out "$report"

  # The CLI also exits non-zero when it finds errors. Fail early only when it
  # wrote no report, so the diagnostics below still print.
  if ! jq -e '.summary' "$report" >/dev/null 2>&1; then
    rm -f "$report"
    return 1
  fi

  jq -r '.diagnostics[] | "\(.severity)  \(.plugin)/\(.rule)  \(.filePath):\(.line)"' \
    "$report"

  local errors
  errors="$(jq '.summary.errorCount' "$report")"
  printf '%s error(s), %s warning(s)%s\n' "$errors" \
    "$(jq '.summary.warningCount' "$report")" \
    "$(jq -r 'if .baselineDegraded then " (baseline degraded: showing every issue in the changed files)" else "" end' "$report")"

  rm -f "$report"
  [ "$errors" -eq 0 ]
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
KNOWN_JOBS=(prettier ast-grep ts docs variants lint oxlint test native commitlint doctor zizmor)

for job in "${JOBS[@]:-}"; do
  [ -z "$job" ] && continue
  if [[ ! " ${KNOWN_JOBS[*]} " =~ " $job " ]]; then
    printf '%sUnknown job: %s%s\nJobs: %s\n' "$RED" "$job" "$RESET" "${KNOWN_JOBS[*]}"
    exit 2
  fi
done

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

if wants docs; then
  run 'Doc paths' bun run docs:check
fi

if wants variants; then
  run 'Platform variants' bun run variants:check
fi

if wants lint; then
  run 'ESLint' bun run lint
fi

if wants oxlint; then
  run 'oxlint' bun run lint:oxlint
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
    run 'React Doctor' react_doctor
  fi
fi

if wants zizmor; then
  if command -v zizmor >/dev/null; then
    run 'zizmor' zizmor --offline .github/workflows
  elif command -v uvx >/dev/null; then
    run 'zizmor' uvx zizmor --offline .github/workflows
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
  [ -z "$label" ] && continue
  printf '%s  FAIL%s  %s\n' "$RED" "$RESET" "$label"
  print_failure_lines "$label"
done

if [ ${#FAILED[@]} -gt 0 ]; then
  printf '\n%s%d job(s) failed.%s\n' "$RED" "${#FAILED[@]}" "$RESET"
  exit 1
fi

printf '\n%sAll green.%s\n' "$GREEN" "$RESET"
