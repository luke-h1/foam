import { Linking } from 'react-native';

import * as Application from 'expo-application';

import { getAppStoreLink } from './get-app-store-link';

/**
 * The only bundle ID with an App Store listing; every other variant goes to TestFlight.
 */
const PRODUCTION_BUNDLE_ID = 'foam-tv';

/**
 * Store URL for the platform and release type: TestFlight for iOS test builds, App Store for production, Play Store on Android.
 */
/**
 * TestFlight builds deep-link into the TestFlight app when it is installed,
 * and fall back to its web page when it is not.
 */
async function resolveTestFlightUrl(): Promise<string> {
  const testFlightUrl = 'itms-beta://';

  return (await Linking.canOpenURL(testFlightUrl))
    ? testFlightUrl
    : 'https://testflight.apple.com';
}

export async function getStoreUrlAsync() {
  if (process.env.EXPO_OS === 'ios') {
    const releaseType = await Application.getIosApplicationReleaseTypeAsync();

    const isTestFlight =
      releaseType !== Application.ApplicationReleaseType.APP_STORE &&
      releaseType !== Application.ApplicationReleaseType.SIMULATOR;

    // Non-production bundle IDs share the App Store signing cert, so release type reads APP_STORE for them too; guard on bundle ID.
    const isProductionBuild =
      Application.applicationId === PRODUCTION_BUNDLE_ID;

    return isTestFlight || !isProductionBuild
      ? resolveTestFlightUrl()
      : getAppStoreLink(PRODUCTION_BUNDLE_ID);
  }

  if (process.env.EXPO_OS === 'android') {
    // Works for all Play tracks when the user is enrolled in the test track.
    return `https://play.google.com/store/apps/details?id=${Application.applicationId}`;
  }

  return null;
}
