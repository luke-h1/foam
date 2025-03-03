#!/bin/bash


# android

# fix google app id not being found
bun run eas build --platform android --profile production --local --non-interactive --output=./app-prod.apk
bun run eas submit -p android --path ./app-prod.apk


# ios

# fix google app id not being found
bun run eas build --platform ios --profile production --local --non-interactive --output=./app-prod.abd
bun run eas submit -p ios --path ./app-prod.abd
