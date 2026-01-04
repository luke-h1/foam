#!/bin/bash
outputIos=$(eas build:version:get -p ios)
outputAndroid=$(eas build:version:get -p android)
FOAM_IOS_NUMBER=${outputIos#*buildNumber - }
FOAM_ANDROID_VERSION_CODE=${outputAndroid#*versionCode - }

echo PACKAGE_VERSION="$(jq -r '.version' package.json)" > "$GITHUB_OUTPUT"
echo FOAM_IOS_NUMBER=$FOAM_IOS_NUMBER >> "$GITHUB_OUTPUT"
echo FOAM_ANDROID_VERSION_CODE=$FOAM_ANDROID_VERSION_CODE >> "$GITHUB_OUTPUT"
