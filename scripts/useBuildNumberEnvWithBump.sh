#!/bin/bash

outputIos=$(eas build:version:get -p ios)
outputAndroid=$(eas build:version:get -p android)
currentIosVersion=${outputIos#*buildNumber - }
currentAndroidVersion=${outputAndroid#*versionCode - }

FOAM_IOS_BUILD_NUMBER=$((currentIosVersion+1))
FOAM_ANDROID_VERSION_CODE=$((currentAndroidVersion+1))

bash -c "FOAM_IOS_BUILD_NUMBER=$FOAM_IOS_BUILD_NUMBER FOAM_ANDROID_VERSION_CODE=$FOAM_ANDROID_VERSION_CODE $*"
