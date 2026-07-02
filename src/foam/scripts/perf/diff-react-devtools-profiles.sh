#!/bin/bash

set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <before-profile.json> <after-profile.json> [limit]"
  exit 1
fi

BEFORE="$1"
AFTER="$2"
LIMIT="${3:-20}"

bunx agent-device react-devtools profile diff "$BEFORE" "$AFTER" --limit "$LIMIT"
