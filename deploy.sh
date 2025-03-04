#!/bin/bash


# remove plist and google service json files from gitignore beforehand
# eas ignores any file in gitignore but we want to keep our API keys secret 

# android

# fix google app id not being found
bun run eas build --platform android --profile production --local --non-interactive --output=./app-prod.apk
bun run eas submit -p android --path ./app-prod.apk


# ios

# fix google app id not being found
bun run eas build --platform ios --profile production --local --non-interactive --output=./app-prod.abd
bun run eas submit -p ios --path ./app-prod.abd
