#!/bin/bash

# Prints the Google service files as base64, for the GitHub Actions secrets.

set -e

print_base64_file() {
  local file="$1"

  if [ ! -f "$file" ]; then
    echo "Missing: $file"
    return
  fi

  base64 -i "$file" | tr -d '\n'
}

for file in \
  google-services-dev.json \
  google-services-internal.json \
  google-services-testflight.json \
  google-services-prod.json \
  GoogleService-Info-dev.plist \
  GoogleService-Info-internal.plist \
  GoogleService-Info-testflight.plist \
  GoogleService-Info-prod.plist; do
  echo "== $file"
  print_base64_file "$file"
  echo ""
  echo ""
done
