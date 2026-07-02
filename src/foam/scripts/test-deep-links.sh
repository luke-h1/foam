#!/bin/bash

# Usage:
#   ./scripts/test-deep-links.sh [method] [platform] [url]
#   method: uri-scheme (default), xcrun, or adb
#   platform: ios (default) or android
#   url: specific URL to test (optional, tests all if not provided)
#
# Examples:
#   ./scripts/test-deep-links.sh                    # Test URLs on iOS using uri-scheme
#   ./scripts/test-deep-links.sh xcrun ios          # Test URLs on iOS using xcrun
#   ./scripts/test-deep-links.sh adb android        # Test URLs on Android using adb
#   ./scripts/test-deep-links.sh uri-scheme ios "foam://tabs/following" # Test specific URL

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

METHOD="${1:-uri-scheme}"
PLATFORM="${2:-ios}"
URL="${3:-}"

declare -a TEST_URLS=(
  "foam://tabs/following"
  "foam://tabs/top"
  "foam://tabs/top/categories"
  "foam://tabs/top/streams"
  "foam://tabs/search"
  "foam://tabs/settings"
  "foam://tabs/settings/profile"
  "foam://tabs/settings/appearance"
  "foam://tabs/settings/chat-preferences"
  "foam://tabs/settings/dev-tools"
  "foam://tabs/settings/other"
  "foam://tabs/settings/about"
  "foam://tabs/settings/cached-images"
  "foam://tabs/settings/diagnostics"
  "foam://tabs/settings/remote-config"
  "foam://tabs/settings/licenses"
  "foam://tabs/settings/faq"
  "foam://tabs/settings/changelog"
  "foam://tabs/settings/debug"
  "foam://tabs/settings/storybook"
  "foam://streams/live-stream/123"
  "foam://streams/streamer-profile/456"
  "foam://top"
  "foam://top/categories"
  "foam://top/streams"
  "foam://category/789"
  "foam://chat?channelName=test&channelId=123"
  "foam://login"
  "foam://storybook"
  "foam://preferences/chat"
  "foam://preferences/video"
  "foam://preferences/theming"
  "foam://preferences/blocked-users"
  "foam://dev-tools/diagnostics"
  "foam://dev-tools/sentry-demo"
  "foam://dev-tools/debug"
  "foam://other/about"
  "foam://other/changelog"
  "foam://other/faq"
  "foam://other/licenses"
)

test_uri_scheme() {
  local url=$1
  local platform=$2
  
  if ! command -v npx &> /dev/null; then
    echo -e "${RED}Error: npx not found. Make sure Node.js is installed.${NC}"
    return 1
  fi

  echo -e "${BLUE}Testing with npx uri-scheme on ${platform}...${NC}"
  npx uri-scheme open "$url" "--${platform}"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully opened: ${url}${NC}"
    return 0
  else
    echo -e "${RED}✗ Failed to open: ${url}${NC}"
    return 1
  fi
}

test_xcrun() {
  local url=$1
  
  if ! command -v xcrun &> /dev/null; then
    echo -e "${RED}Error: xcrun not found. Make sure Xcode is installed.${NC}"
    return 1
  fi

  echo -e "${BLUE}Testing with xcrun simctl on booted simulator...${NC}"
  xcrun simctl openurl booted "$url"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully opened: ${url}${NC}"
    return 0
  else
    echo -e "${RED}✗ Failed to open: ${url}${NC}"
    echo -e "${YELLOW}Make sure an iOS simulator is booted.${NC}"
    return 1
  fi
}

test_adb() {
  local url=$1
  
  if ! command -v adb &> /dev/null; then
    echo -e "${RED}Error: adb not found. Make sure Android SDK is installed and adb is in your PATH.${NC}"
    return 1
  fi

  if ! adb devices | grep -q "device$"; then
    echo -e "${RED}Error: No Android device/emulator found.${NC}"
    echo -e "${YELLOW}Make sure an emulator is running or a device is connected via USB.${NC}"
    return 1
  fi

  echo -e "${BLUE}Testing with adb on Android device/emulator...${NC}"
  echo -e "${YELLOW}Note: If this fails, you may need to specify your app's package name.${NC}"
  echo -e "${YELLOW}For Expo apps, use 'host.exp.exponent' for Expo Go.${NC}"
  
  adb shell am start -W -a android.intent.action.VIEW -d "$url"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully opened: ${url}${NC}"
    return 0
  else
    echo -e "${RED}✗ Failed to open: ${url}${NC}"
    echo -e "${YELLOW}Try: adb shell am start -W -a android.intent.action.VIEW -d \"${url}\" <your-package-name>${NC}"
    return 1
  fi
}

test_url() {
  local url=$1
  
  echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${YELLOW}Testing: ${url}${NC}"
  echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  case "$METHOD" in
    uri-scheme)
      test_uri_scheme "$url" "$PLATFORM"
      ;;
    xcrun)
      if [ "$PLATFORM" != "ios" ]; then
        echo -e "${RED}Error: xcrun method only works with iOS platform.${NC}"
        return 1
      fi
      test_xcrun "$url"
      ;;
    adb)
      if [ "$PLATFORM" != "android" ]; then
        echo -e "${RED}Error: adb method only works with android platform.${NC}"
        return 1
      fi
      test_adb "$url"
      ;;
    *)
      echo -e "${RED}Error: Invalid method '${METHOD}'. Use 'uri-scheme', 'xcrun', or 'adb'.${NC}"
      exit 1
      ;;
  esac
}

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Foam Deep Link Testing                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo -e "${CYAN}Method:  ${METHOD}${NC}"
echo -e "${CYAN}Platform: ${PLATFORM}${NC}"
echo ""

if [ -n "$URL" ]; then
  test_url "$URL"
else
  echo -e "${YELLOW}Testing all configured deep links...${NC}"
  echo -e "${YELLOW}Total URLs to test: ${#TEST_URLS[@]}${NC}\n"
  
  passed=0
  failed=0
  
  for url in "${TEST_URLS[@]}"; do
    if test_url "$url"; then
      ((passed++))
    else
      ((failed++))
    fi
    sleep 1
  done
  
  echo -e "\n${BLUE}╔════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║   Test Summary                             ║${NC}"
  echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
  echo -e "${GREEN}✓ Passed: ${passed}${NC}"
  if [ $failed -gt 0 ]; then
    echo -e "${RED}✗ Failed: ${failed}${NC}"
  else
    echo -e "${GREEN}✗ Failed: ${failed}${NC}"
  fi
  echo -e "${CYAN}Total: ${#TEST_URLS[@]}${NC}"
fi
