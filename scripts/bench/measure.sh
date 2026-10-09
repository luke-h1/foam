#!/usr/bin/env bash
#
# Measures Android performance with Flashlight. Argent flows drive the app.
#
#   bun run perf:bench                       # every bench
#   bun run perf:bench chat-raid             # named benches only
#   ITERATIONS=5 bun run perf:bench          # average 5 runs per bench
#   BUNDLE_ID=com.lhowsam.foam.internal bun run perf:bench
#   METRO_PORT=8082 bun run perf:bench       # Metro on another port
#
# Benches:
#   top-streams     scroll the Top streams list
#   top-categories  scroll the Top categories list
#   chat-raid       chat-perf screen, 10s of the raid synthetic flood
#
# chat-raid replays the same IRC fixture from the start on every run, so it
# does not need a live channel. The chat-perf screen exists only in the
# development, internal and e2e builds.
#
# Each iteration starts from a cold app. The restart, the deep link and the
# open-* flow run in beforeEachCommand, outside the measured window, so
# Flashlight times only the scroll or the flood.
#
# The first iteration is a warm-up and is dropped: in it the Flashlight
# sampler reports every thread at 100% in alternate samples.
#
# Dismiss the Expo dev menu intro once by hand on a new development build, or
# app-ready times out behind it.
#
# Needs: an Android device (ANDROID_SERIAL when more than one is attached),
# the app installed and past onboarding, flashlight, and argent 0.27 or later.
# The development build also needs Metro. Dev-mode JS numbers only compare
# against other dev-mode runs; start Metro with --no-dev --minify for
# production JS.
#
# Adapted from software-mansion-labs/nextappconf-2026-performance-workshops.

set -euo pipefail

BUNDLE_ID="${BUNDLE_ID:-com.lhowsam.foam.dev}"
ITERATIONS="${ITERATIONS:-1}"
METRO_PORT="${METRO_PORT:-8081}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
RESULTS="$ROOT/bench-results"

BENCHES=("$@")
if [ ${#BENCHES[@]} -eq 0 ]; then
  BENCHES=(top-streams top-categories chat-raid)
fi

# Prints "<deep link> <open flow> <measured flow> <label>" for a bench.
bench_config() {
  case "$1" in
    top-streams) echo "foam://tabs/top open-top-streams scroll-only Top streams" ;;
    top-categories) echo "foam://tabs/top open-top-categories scroll-only Top categories" ;;
    chat-raid) echo "foam://dev-tools/chat-perf open-chat-perf chat-raid Chat raid" ;;
    *) return 1 ;;
  esac
}

for bench in "${BENCHES[@]}"; do
  if ! bench_config "$bench" >/dev/null; then
    echo "Unknown bench: $bench. See the list at the top of $0." >&2
    exit 64
  fi
done

if ! argent flow --help 2>&1 | grep -q 'Run a YAML flow'; then
  echo "This argent has no 'flow' command. Update it: npm i -g @swmansion/argent@latest" >&2
  exit 1
fi

if [[ "$BUNDLE_ID" == *.dev ]] && ! lsof -ti:"$METRO_PORT" >/dev/null 2>&1; then
  echo "Metro is not listening on $METRO_PORT. Start it with: bun run start --port $METRO_PORT" >&2
  exit 1
fi

if ! adb shell pm path "$BUNDLE_ID" >/dev/null 2>&1; then
  echo "$BUNDLE_ID is not installed on the device." >&2
  exit 1
fi

# Without --platform, argent can pick a booted iOS simulator.
argent_args="--platform android"
if [ -n "${ANDROID_SERIAL:-}" ]; then
  argent_args="--device $ANDROID_SERIAL"
fi

# Prints an adb command that opens a URL in the app. The command targets the
# package, because each installed variant registers the foam:// scheme and an
# untargeted intent can open a chooser.
open_url() {
  echo "adb shell am start -W -a android.intent.action.VIEW -d \"'$1'\" $BUNDLE_ID >/dev/null"
}

# A cold development build opens the dev launcher and drops the deep link, so
# load the bundle from Metro first and send the deep link to the running app.
launch_url="foam://tabs/top"
if [[ "$BUNDLE_ID" == *.dev ]]; then
  adb reverse "tcp:$METRO_PORT" "tcp:$METRO_PORT" >/dev/null
  launch_url="foam://expo-development-client/?url=http%3A%2F%2Flocalhost%3A$METRO_PORT"
fi

mkdir -p "$RESULTS"
echo "$BUNDLE_ID · $ITERATIONS run(s) per bench + 1 warm-up · cold app before each"
echo

cd "$ROOT"

for bench in "${BENCHES[@]}"; do
  read -r link open_flow test_flow label <<<"$(bench_config "$bench")"

  cold_start="adb shell am force-stop $BUNDLE_ID && $(open_url "$launch_url") && argent flow run app-ready $argent_args"

  if [ "$link" != "foam://tabs/top" ]; then
    cold_start="$cold_start && $(open_url "$link")"
  fi

  out="$RESULTS/$bench.json"
  echo "> $label"

  flashlight test \
    --bundleId "$BUNDLE_ID" \
    --beforeEachCommand "$cold_start && argent flow run $open_flow $argent_args" \
    --testCommand "argent flow run $test_flow $argent_args" \
    --skipRestart \
    --iterationCount "$((ITERATIONS + 1))" \
    --resultsFilePath "$out" >/dev/null 2>&1

  bun -e '
    const file = process.argv[1];
    const result = await Bun.file(file).json();
    result.iterations = result.iterations.slice(1);
    await Bun.write(file, JSON.stringify(result));
  ' "$out"

  bun "$ROOT/scripts/bench/score.ts" "$out"
  echo
done

if [ ${#BENCHES[@]} -gt 1 ]; then
  # Every results file has the name "Results", so the report cannot tell the
  # series apart. Label a copy of each file with its bench before the report.
  tmp="$(mktemp -d)"
  args=()

  for bench in "${BENCHES[@]}"; do
    read -r _ _ _ label <<<"$(bench_config "$bench")"

    bun -e '
      const [src, dest, name] = process.argv.slice(1);
      await Bun.write(dest, JSON.stringify({ ...(await Bun.file(src).json()), name }));
    ' "$RESULTS/$bench.json" "$tmp/$bench.json" "$label"
    args+=("$tmp/$bench.json")
  done

  mkdir -p "$RESULTS/report"
  flashlight report "${args[@]}" -o "$RESULTS/report"
  rm -rf "$tmp"
fi
