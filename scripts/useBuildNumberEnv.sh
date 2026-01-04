#!/bin/bash

outputIos=$(eas build:version:get -p ios)
outputAndroid=$(eas build:version:get -p android)
FOAM_IOS_BUILD_NUMBER=${outputIos#*buildNumber - }
FOAM_ANDROID_VERSION_CODE=${outputAndroid#*versionCode - }

bash -c "FOAM_IOS_BUILD_NUMBER=$FOAM_IOS_BUILD_NUMBER FOAM_ANDROID_VERSION_CODE=$FOAM_ANDROID_VERSION_CODE $*"
