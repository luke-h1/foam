#!/bin/bash


# remove plist and google service json files from gitignore beforehand
# eas ignores any file in gitignore but we want to keep our API keys secret 

# android

bun run eas build --platform android --profile production --local --non-interactive --output=./app-prod.apk && bun run eas submit -p android --path ./app-prod.apk


# ios preview

EXPO_APPLE_TEAM_ID="XJA7HDCMMY" bun run eas build --platform ios --profile preview --local --non-interactive --output=./app-preview.abd && bun run eas submit -p ios --path ./app-preview.abd