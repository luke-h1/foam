#!/bin/bash

# Base64 encoded Google Service files for GitHub Actions secrets

set -e

print_base64_file() {
  local file="$1"

  if [ ! -f "$file" ]; then
    echo "Missing: $file"
    return
  fi

  base64 -i "$file" | tr -d '\n'
}

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           GOOGLE SERVICES - BASE64 ENCODED FILES              ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 ANDROID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "┌─────────────────────────────────────────────────────────────┐"
echo "│ DEVELOPMENT                                                  │"
echo "└─────────────────────────────────────────────────────────────┘"
print_base64_file google-services-dev.json
echo ""
echo ""

echo "┌─────────────────────────────────────────────────────────────┐"
echo "│ INTERNAL                                                     │"
echo "└─────────────────────────────────────────────────────────────┘"
print_base64_file google-services-internal.json
echo ""
echo ""

echo "┌─────────────────────────────────────────────────────────────┐"
echo "│ TESTFLIGHT                                                   │"
echo "└─────────────────────────────────────────────────────────────┘"
print_base64_file google-services-testflight.json
echo ""
echo ""

echo "┌─────────────────────────────────────────────────────────────┐"
echo "│ PRODUCTION                                                   │"
echo "└─────────────────────────────────────────────────────────────┘"
print_base64_file google-services-prod.json
echo ""
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🍎 iOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "┌─────────────────────────────────────────────────────────────┐"
echo "│ DEVELOPMENT                                                  │"
echo "└─────────────────────────────────────────────────────────────┘"
print_base64_file GoogleService-Info-dev.plist
echo ""
echo ""

echo "┌─────────────────────────────────────────────────────────────┐"
echo "│ INTERNAL                                                     │"
echo "└─────────────────────────────────────────────────────────────┘"
print_base64_file GoogleService-Info-internal.plist
echo ""
echo ""

echo "┌─────────────────────────────────────────────────────────────┐"
echo "│ TESTFLIGHT                                                   │"
echo "└─────────────────────────────────────────────────────────────┘"
print_base64_file GoogleService-Info-testflight.plist
echo ""
echo ""

echo "┌─────────────────────────────────────────────────────────────┐"
echo "│ PRODUCTION                                                   │"
echo "└─────────────────────────────────────────────────────────────┘"
print_base64_file GoogleService-Info-prod.plist
echo ""
echo ""

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                         COMPLETE                              ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
