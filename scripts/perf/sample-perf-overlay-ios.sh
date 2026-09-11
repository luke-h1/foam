#!/bin/bash
# Samples the dev-tools chat-perf overlay (`LiveChatPerfOverlay`) on an iOS
# simulator through the accessibility tree: JS fps, jank/s, UI fps, UI jank,
# CPU %, memory. Dev/internal builds only (the route is `dev-tools/chat-perf`).
# Each `argent run describe` call takes a few seconds, so samples are ~5 s
# apart. Prints median / p90 per column at the end.
#
# Usage: scripts/perf/sample-perf-overlay-ios.sh [label] [samples]
# Env: FOAM_IOS_UDID, FOAM_OPEN_ROUTE (foam://dev-tools/chat-perf; "none" to
#      sample whatever is on screen), FOAM_SAMPLE_EVERY (5), OUTPUT_DIR
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LABEL="${1:-chat-perf-overlay}"
SAMPLES="${2:-12}"
UDID="${FOAM_IOS_UDID:-AA1A3696-8F85-4AE2-96CA-1E5C69018B1C}"
ROUTE="${FOAM_OPEN_ROUTE:-foam://dev-tools/chat-perf}"
EVERY="${FOAM_SAMPLE_EVERY:-5}"
OUTPUT_DIR="${OUTPUT_DIR:-$ROOT_DIR/research/foam-perf/runs/perf-overlay-ios}"
mkdir -p "$OUTPUT_DIR"
CSV="$OUTPUT_DIR/$LABEL.csv"
if [ "$ROUTE" != "none" ]; then xcrun simctl openurl "$UDID" "$ROUTE"; sleep 8; fi
echo "t_s,js_fps,js_jank,ui_fps,ui_jank,cpu_pct,mem_mb" > "$CSV"
START=$(date +%s)
for i in $(seq 1 "$SAMPLES"); do
  ROW="$(argent run describe --udid "$UDID" 2>/dev/null | grep -v '^\*\*' | python3 -c '
import sys, json, re
raw = sys.stdin.read()
try:
    txt = json.loads(raw).get("description", raw)
except Exception:
    txt = raw
vals = []
for line in txt.split("\n"):
    m = re.match(r"\s*AXStaticText \"([^\"]*)\"\s+\(([\d.]+), ([\d.]+), ([\d.]+), ([\d.]+)\)", line)
    if not m:
        continue
    text, x, y = m.group(1), float(m.group(2)), float(m.group(3))
    if 0.12 <= y <= 0.135 and x < 0.75 and re.fullmatch(r"-?\d+(%|MB)?", text):
        vals.append((x, text))
vals.sort()
# The overlay row is exactly six values; anything else is a chat row that
# happened to sit in the same band, so the sample is dropped.
print(",".join(v.rstrip("%").replace("MB", "") for _, v in vals) if len(vals) == 6 else ",,,,,")
')"
  echo "$(( $(date +%s) - START )),$ROW" >> "$CSV"
  echo "sample $i: $ROW"
  sleep "$EVERY"
done
node "$ROOT_DIR/scripts/perf/summarize-steady-state.mjs" "$CSV"
