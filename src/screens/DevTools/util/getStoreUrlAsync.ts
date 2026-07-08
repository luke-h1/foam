import { Linking } from 'react-native';

import * as Application from 'expo-application';

import { getAppStoreLink } from './getAppStoreLink';

/**
 * The production bundle ID — the only one with an App Store listing.
 * All other variants (foam-tv-internal, foam-tv-testflight, foam-tv-dev, etc.)
 * should be directed to TestFlight instead.
 */
const PRODUCTION_BUNDLE_ID = 'foam-tv';

/**
 * Get the appropriate store URL based on the platform and release type.
 * - iOS TestFlight builds will open TestFlight
 * - iOS App Store builds will open the App Store
 * - Android builds will open the Play Store (works for all test tracks when user is enrolled)
 */
export async function getStoreUrlAsync() {
  if (process.env.EXPO_OS === 'ios') {
    const releaseType = await Application.getIosApplicationReleaseTypeAsync();

    const isTestFlight =
      releaseType !== Application.ApplicationReleaseType.APP_STORE &&
      releaseType !== Application.ApplicationReleaseType.SIMULATOR;

    // Non-production bundle IDs (internal, testflight, dev, e2e variants) share the
    // App Store signing certificate, so getIosApplicationReleaseTypeAsync() returns
    // APP_STORE for them too — making isTestFlight unreliable on its own.
    // Guard with the bundle ID to ensure only the real production build hits the App Store.
    const isProductionBuild = Application.applicationId === PRODUCTION_BUNDLE_ID;

    if (isTestFlight || !isProductionBuild) {
      const testFlightUrl = 'itms-beta://';
      const canOpen = await Linking.canOpenURL(testFlightUrl);
      if (canOpen) {
        return testFlightUrl;
      }
      return 'https://testflight.apple.com';
    }

    return getAppStoreLink(Application.applicationId as string);
  }

  if (process.env.EXPO_OS === 'android') {
    /**
     * Play store URL works for all tracks (production, internal, closed, open)
     * as long as the user is enrolled in the test track
     */
    return `https://play.google.com/store/apps/details?id=${Application.applicationId}`;
  }

  return null;
}
