import { ExpoConfig, ConfigContext } from '@expo/config';
import { version } from './package.json';

const BUILD_NUMBER = 1;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Foam',
  slug: 'Foam',
  scheme: 'foam',
  version,
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  jsEngine: 'hermes',
  assetBundlePatterns: ['**/*'],

  // ios
  ios: {
    buildNumber: String(BUILD_NUMBER),
    supportsTablet: false,
    // googleServicesFile: `./GoogleService-Info.plist`,
    bundleIdentifier: 'com.foam',
    config: {
      // needed for expo-secure-store
      usesNonExemptEncryption: false,
    },
  },

  // android
  android: {
    package: 'com.foam',
    // needed for haptic feedback UI
    permissions: ['VIBRATE'],
    versionCode: BUILD_NUMBER,
    // googleServicesFile: './google-services.json',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
  },

  // web
  web: {
    favicon: './assets/favicon.png',
  },
  extra: {
    eas: {
      projectId: '950a1e2f-6b25-4be7-adb2-3c16287a2b5e',
    },
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: {
    fallbackToCacheTimeout: 0,
  },
  experiments: {
    tsconfigPaths: true,
  },
  plugins: [
    ['expo-font', 'expo-secure-store'],
    [
      'expo-build-properties',
      {
        ios: {
          flipper: true,
        },
        android: {
          enableProguardInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
        },
      },
    ],
    ['newrelic-react-native-agent'],
    ['./src/plugins/withAnimatedWebPSupport.js'],
    ['./src/plugins/withFastImageWebPSupportIOS.js'],
    ['./src/plugins/withFastImageWebPSupportAndroid.js'],
  ],
});
