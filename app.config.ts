import type { ExpoConfig } from '@expo/config';
import type { AppIconBadgeConfig } from 'app-icon-badge/types';
import * as fs from 'fs';
import * as path from 'path';

interface AppVariantConfig {
  name: string;
  icon: string;
  androidPackageName: string;
  splashImage: string;
  splashBackgroundColor: string;
  iosBundleIdentifier: string;
  iosGoogleServicesFile: string;
  androidGoogleServicesFile: string;
  mockServerUrl?: string;
}

export type Variant = 'development' | 'preview' | 'test' | 'e2e' | 'production';

// https://docs.expo.dev/tutorial/eas/multiple-app-variants
const APP_VARIANT_CONFIG: Record<Variant, AppVariantConfig> = {
  development: {
    name: 'Foam (dev)',
    icon: './assets/splash/splash-image-production.png',
    iosBundleIdentifier: 'foam-tv-dev',
    androidPackageName: 'com.lhowsam.foam.dev',
    splashImage: './assets/splash/splash-image-production.png',
    splashBackgroundColor: '#000000',
    iosGoogleServicesFile: './GoogleService-Info-dev.plist',
    androidGoogleServicesFile: './google-services-dev.json',
  },
  preview: {
    name: 'Foam (preview)',
    icon: './assets/splash/splash-image-production.png',
    iosBundleIdentifier: 'foam-tv-preview',
    androidPackageName: 'com.lhowsam.foam.preview',
    splashImage: './assets/splash/splash-image-production.png',
    splashBackgroundColor: '#000000',
    iosGoogleServicesFile: './GoogleService-Info-preview.plist',
    androidGoogleServicesFile: './google-services-preview.json',
  },
  test: {
    name: 'Foam (test)',
    icon: './assets/splash/splash-image-production.png',
    iosBundleIdentifier: 'foam-tv-test',
    androidPackageName: 'com.lhowsam.foam.test',
    splashImage: './assets/splash/splash-image-production.png',
    splashBackgroundColor: '#000000',
    iosGoogleServicesFile: './GoogleService-Info-test.plist',
    androidGoogleServicesFile: './google-services-test.json',
  },
  e2e: {
    name: 'Foam (E2E)',
    icon: './assets/splash/splash-image-production.png',
    iosBundleIdentifier: 'foam-tv-e2e',
    androidPackageName: 'com.lhowsam.foam.e2e',
    splashImage: './assets/splash/splash-image-production.png',
    splashBackgroundColor: '#000000',
    iosGoogleServicesFile: './GoogleService-Info-prod.plist',
    androidGoogleServicesFile: './google-services-prod.json',
    mockServerUrl: 'http://localhost:3001',
  },
  production: {
    name: 'Foam',
    icon: './assets/splash/splash-image-production.png',
    iosBundleIdentifier: 'foam-tv',
    androidPackageName: 'com.lhowsam.foam',
    splashImage: './assets/splash/splash-image-production.png',
    splashBackgroundColor: '#000000',
    iosGoogleServicesFile:
      (process.env.IOS_GOOGLE_SERVICES_JSON as string) ||
      './GoogleService-Info-prod.plist',
    androidGoogleServicesFile: './google-services-prod.json',
  },
} as const;

const variant = (process.env.APP_VARIANT as Variant) || 'development';

const VERSION = '0.0.39';

const appConfig = APP_VARIANT_CONFIG[variant];

const iosGoogleServicesFileExists = fs.existsSync(
  path.resolve(__dirname, appConfig.iosGoogleServicesFile),
);

const googleServicesExist = fs.existsSync(
  path.resolve(__dirname, appConfig.androidGoogleServicesFile),
);

const appIconBadgeConfig: AppIconBadgeConfig = {
  enabled: variant !== 'production',
  badges: [
    {
      text: variant,
      type: 'banner',
      color: 'white',
      background: '#FF0000',
    },
    {
      text: VERSION,
      type: 'ribbon',
    },
  ],
};

const config: ExpoConfig = {
  name: appConfig.name,
  slug: 'foam',
  newArchEnabled: true,
  version: VERSION,
  scheme: 'foam',
  owner: 'lukehowsam123',
  icon: './assets/app-icon/app-icon-production.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: appConfig.splashImage,
    resizeMode: 'contain',
    backgroundColor: appConfig.splashBackgroundColor,
  },
  updates: {
    url: 'https://u.expo.dev/950a1e2f-6b25-4be7-adb2-3c16287a2b5e',
    // Configure the channel to "local" for local development, if we
    // compile/run locally EAS Build will configure this for us automatically
    // based on the value provided in the build profile, and that will
    // overwrite this value.
    requestHeaders: {
      'expo-channel-name': 'local',
    },
    // Disable automatic update checks on launch to prevent blank screen issues
    // Updates are checked manually after the app has fully loaded
    checkAutomatically: 'NEVER',
    fallbackToCacheTimeout: 30000,
  },
  runtimeVersion: {
    policy: 'fingerprint',
  },
  extra: {
    AUTH_PROXY_API_BASE_URL: process.env.AUTH_PROXY_API_BASE_URL,
    TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID,
    TWITCH_CLIENT_SECRET: process.env.TWITCH_CLIENT_SECRET,
    AUTH_PROXY_API_KEY: process.env.AUTH_PROXY_API_KEY,
    MOCK_SERVER_URL: appConfig.mockServerUrl,
    updates: {
      assetPatternsToBeBundled: ['**/*'],
    },
    eas: {
      projectId: '950a1e2f-6b25-4be7-adb2-3c16287a2b5e',
    },
  },
  plugins: [
    'newrelic-react-native-agent',
    'react-native-compressor',
    [
      '@sentry/react-native/expo',
      {
        url: 'https://sentry.io/',
        note: 'Use SENTRY_AUTH_TOKEN env to authenticate with Sentry.',
        project: 'foam',
        organization: 'luke-howsam',
      },
    ],
    [
      'expo-media-library',
      {
        photosPermission:
          'Allow $(PRODUCT_NAME) to access your photos to download emotes/badges',
        savePhotosPermission: 'Allow $(PRODUCT_NAME) to save emotes/badges.',
        isAccessMediaLocationEnabled: true,
        granularPermissions: ['audio', 'photo'],
      },
    ],
    ['app-icon-badge', appIconBadgeConfig],
    'expo-secure-store',
    'expo-background-task',
    [
      'expo-font',
      {
        fonts: [
          'node_modules/@expo-google-fonts/source-code-pro/400Regular',
          'node_modules/@expo-google-fonts/source-code-pro/600SemiBold',
          'node_modules/@expo-google-fonts/source-code-pro/700Bold',
        ],
        android: {
          permissions: [
            'android.permission.READ_EXTERNAL_STORAGE',
            'android.permission.WRITE_EXTERNAL_STORAGE',
            'android.permission.ACCESS_MEDIA_LOCATION',
          ],
          fonts: [
            {
              fontFamily: 'SourceCodePro',
              fontDefinitions: [
                {
                  path: 'node_modules/@expo-google-fonts/source-code-pro/400Regular/SourceCodePro_400Regular.ttf',
                  weight: 400,
                },
                {
                  path: 'node_modules/@expo-google-fonts/source-code-pro/600SemiBold/SourceCodePro_600SemiBold.ttf',
                  weight: 600,
                },
                {
                  path: 'node_modules/@expo-google-fonts/source-code-pro/700Bold/SourceCodePro_700Bold.ttf',
                  weight: 700,
                },
              ],
            },
          ],
        },
      },
    ],
    '@bacons/apple-colors',
    // '@bacons/apple-targets',
    'react-native-legal',
    'react-native-edge-to-edge',
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
          // buildReactNativeFromSource: true,
          forceStaticLinking: ['RNFBApp'],
          deploymentTarget: '16.0',
        },
      },
    ],
    '@react-native-firebase/app',
    [
      'expo-video',
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    // ['./src/plugins/withAnimatedWebPSupport.js'],
    // ['./src/plugins/withFastImageWebPSupportIOS.js'],
    // ['./src/plugins/withFastImageWebPSupportAndroid.js'],
  ],
  experiments: {
    tsconfigPaths: true,
  },
  web: {},
  ios: {
    appleTeamId: 'XJA7HDCMMY',
    supportsTablet: false,
    bundleIdentifier: appConfig.iosBundleIdentifier,
    googleServicesFile: iosGoogleServicesFileExists
      ? appConfig.iosGoogleServicesFile
      : undefined,
    icon: appConfig.icon,
    config: {
      // needed for expo-secure-store
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      NSSupportsLiveActivities: true,
      NSPhotoLibraryUsageDescription: 'Used for saving emotes/badges',
    },
  },
  android: {
    package: appConfig.androidPackageName,
    googleServicesFile: googleServicesExist
      ? appConfig.androidGoogleServicesFile
      : undefined,
    edgeToEdgeEnabled: true,
    intentFilters: [
      {
        action: 'VIEW',
        autoVerify: true,
        category: ['BROWSABLE', 'DEFAULT'],
        data: [
          { scheme: 'https', host: 'www.twitch.tv' },
          { scheme: 'https', host: 'twitch.tv' },
          { scheme: 'https', host: 'm.twitch.tv' },
        ],
      },
    ],
  },
};

export default config;
