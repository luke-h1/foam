#!/bin/bash

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <trace-path> [output-path] [xpath]"
  exit 1
fi

TRACE_PATH="$1"
OUTPUT_PATH="${2:-${TRACE_PATH%.trace}.toc.xml}"
XPATH="${3:-}"

if [ -n "$XPATH" ]; then
  xcrun xctrace export --input "$TRACE_PATH" --xpath "$XPATH" --output "$OUTPUT_PATH"
else
  xcrun xctrace export --input "$TRACE_PATH" --toc --output "$OUTPUT_PATH"
fi

echo "$OUTPUT_PATH"
