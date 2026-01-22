#!/bin/bash

# Cleanup script to delete unused EAS Update channels
# Keeps only: production, preview, development
# Deletes all other channels

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PROTECTED_CHANNELS=("production" "preview" "development")

echo "🧹 EAS Update Channel Cleanup Script"
echo "======================================"
echo ""

if [ -z "$EXPO_TOKEN" ]; then
  echo -e "${RED}❌ Error: EXPO_TOKEN environment variable is not set${NC}"
  echo "Please set it with: export EXPO_TOKEN=your_token"
  exit 1
fi

if ! command -v eas &> /dev/null; then
  echo -e "${RED}❌ Error: EAS CLI is not installed${NC}"
  echo "Install it with: npm install -g eas-cli"
  exit 1
fi

echo "📋 Fetching list of channels..."
echo ""

CHANNELS=$(eas channel:list --non-interactive 2>/dev/null | grep -E '^\|' | grep -v 'Channel' | grep -v '---' | awk -F'|' '{print $2}' | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | grep -v '^$' || echo "")

if [ -z "$CHANNELS" ]; then
  echo -e "${YELLOW}⚠️  No channels found or unable to fetch channels${NC}"
  exit 0
fi

readarray -t CHANNEL_ARRAY <<< "$CHANNELS"

echo "Found ${#CHANNEL_ARRAY[@]} channel(s):"
echo ""

DELETED_COUNT=0
KEPT_COUNT=0

for channel in "${CHANNEL_ARRAY[@]}"; do
  if [ -z "$channel" ]; then
    continue
  fi
  
  is_protected=false
  for protected in "${PROTECTED_CHANNELS[@]}"; do
    if [ "$channel" == "$protected" ]; then
      is_protected=true
      break
    fi
  done
  
  if [ "$is_protected" == "true" ]; then
    echo -e "${GREEN}✅ Keeping protected channel: ${channel}${NC}"
    ((KEPT_COUNT++))
  else
    echo -e "${YELLOW}🗑️  Deleting channel: ${channel}${NC}"
    
    if eas channel:delete "$channel" --non-interactive --force 2>/dev/null; then
      echo -e "${GREEN}   ✅ Deleted successfully${NC}"
      ((DELETED_COUNT++))
    else
      echo -e "${RED}   ❌ Failed to delete${NC}"
    fi
  fi
done

echo ""
echo "======================================"
echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo ""
echo "Summary:"
echo "  - Kept: $KEPT_COUNT channel(s)"
echo "  - Deleted: $DELETED_COUNT channel(s)"
echo ""
echo "Protected channels (never deleted):"
for protected in "${PROTECTED_CHANNELS[@]}"; do
  echo "  - $protected"
done
