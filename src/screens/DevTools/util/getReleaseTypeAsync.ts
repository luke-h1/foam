import * as Application from 'expo-application';

export async function getReleaseTypeAsync() {
  if (process.env.EXPO_OS === 'ios') {
    const releaseType = await Application.getIosApplicationReleaseTypeAsync();

    const suffix = (() => {
      switch (releaseType) {
        case Application.ApplicationReleaseType.AD_HOC:
          return 'Ad Hoc';
        case Application.ApplicationReleaseType.ENTERPRISE:
          return 'Enterprise';
        case Application.ApplicationReleaseType.DEVELOPMENT:
          return 'Development';
        case Application.ApplicationReleaseType.APP_STORE:
          return 'App Store';
        case Application.ApplicationReleaseType.SIMULATOR:
          return 'Simulator';
        case Application.ApplicationReleaseType.UNKNOWN:
        default:
          return 'unknown';
      }
    })();
    return `${Application.applicationName} (${suffix})`;
  }
  if (process.env.EXPO_OS === 'android') {
    return `${Application.applicationName}`;
  }

  return null;
}
