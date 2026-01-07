#!/bin/bash


# android

bun run eas build --platform android --profile production --local --non-interactive --output=./app-prod.apk && bun run eas submit -p android --path ./app-prod.apk


# ios preview

EXPO_PUBLIC_ENABLE_TREESHACKING=1 EXPO_APPLE_TEAM_ID="XJA7HDCMMY" bun run eas build --platform ios --profile preview --local --non-interactive --output=./app-preview.abd && bun run eas submit -p ios --path ./app-preview.abd


# ios test
EXPO_PUBLIC_ENABLE_TREESHACKING=1 EXPO_APPLE_TEAM_ID="XJA7HDCMMY" bun run eas build --platform ios --profile test --local --non-interactive --output=./app-test.abd && bun run eas submit -p ios --path ./app-test.abd


# ios production
EXPO_PUBLIC_ENABLE_TREESHACKING=1 EXPO_APPLE_TEAM_ID="XJA7HDCMMY" bun run eas build --platform ios --profile production --local --non-interactive --output=./app-production.abd && bun run eas submit -p ios --path ./app-production.abd