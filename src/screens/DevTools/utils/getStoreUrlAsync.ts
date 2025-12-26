import * as Application from 'expo-application';
import { getAppStoreLink } from './getAppStoreLink';

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

    /**
     * Open TestFlight
     */
    if (isTestFlight) {
      return `itms-beta://beta.itunes.apple.com/v1/app/${Application.applicationId}`;
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
