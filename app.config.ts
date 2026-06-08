import type { ExpoConfig } from '@expo/config';
import type { AppIconBadgeConfig } from 'app-icon-badge/types';
import * as fs from 'node:fs';
import * as path from 'node:path';

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

export type Variant =
  | 'development'
  | 'internal'
  | 'testflight'
  | 'e2e'
  | 'production';

// https://docs.expo.dev/tutorial/eas/multiple-app-variants
const VARIANT_CONFIG: Record<Variant, AppVariantConfig> = {
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
  internal: {
    name: 'Foam (internal)',
    icon: './assets/splash/splash-image-production.png',
    iosBundleIdentifier: 'foam-tv-internal',
    androidPackageName: 'com.lhowsam.foam.internal',
    splashImage: './assets/splash/splash-image-production.png',
    splashBackgroundColor: '#000000',
    iosGoogleServicesFile: './GoogleService-Info-internal.plist',
    androidGoogleServicesFile: './google-services-internal.json',
  },
  testflight: {
    name: 'Foam (TestFlight)',
    icon: './assets/splash/splash-image-production.png',
    iosBundleIdentifier: 'foam-tv-testflight',
    androidPackageName: 'com.lhowsam.foam.testflight',
    splashImage: './assets/splash/splash-image-production.png',
    splashBackgroundColor: '#000000',
    iosGoogleServicesFile: './GoogleService-Info-testflight.plist',
    androidGoogleServicesFile: './google-services-testflight.json',
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

const variant =
  (process.env.EXPO_PUBLIC_APP_VARIANT as Variant) || 'development';

const VERSION = '0.0.41';

const appConfig = VARIANT_CONFIG[variant];
const sentryRelease = process.env.EXPO_PUBLIC_SENTRY_RELEASE ?? VERSION;
// Local deploy/OTA scripts generate SENTRY_DIST from the current git commit
// and expose it as EXPO_PUBLIC_SENTRY_DIST before evaluating this config.
const sentryDist =
  process.env.EXPO_PUBLIC_SENTRY_DIST ??
  process.env.SENTRY_DIST ??
  process.env.EAS_BUILD_GIT_COMMIT_HASH ??
  process.env.GITHUB_SHA ??
  'local';
const iosICloudContainerIdentifier = `iCloud.${appConfig.iosBundleIdentifier}`;
const enableICloudEntitlements =
  process.env.ENABLE_IOS_ICLOUD_ENTITLEMENTS === 'true';

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

const quickActions = [
  {
    id: 'following',
    title: 'Following',
    subtitle: 'Open followed channels',
    icon: 'favorite',
    params: {
      href: '/tabs/following',
    },
  },
  {
    id: 'live',
    title: 'Live',
    subtitle: 'Browse live streams',
    icon: 'play',
    params: {
      href: '/tabs/top/streams',
    },
  },
  {
    id: 'search',
    title: 'Search',
    subtitle: 'Find streamers and categories',
    icon: 'search',
    params: {
      href: '/tabs/search',
    },
  },
] as const;

const config: ExpoConfig = {
  name: appConfig.name,
  slug: 'foam',
  version: VERSION,
  scheme: 'foam',
  owner: 'lukehowsam123',
  platforms: ['android', 'ios', 'web'],
  icon: './assets/app-icon/app-icon-production.png',
  splash: {
    image: appConfig.splashImage,
    resizeMode: 'contain',
    backgroundColor: appConfig.splashBackgroundColor,
  },
  userInterfaceStyle: 'dark',
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
    disableAntiBrickingMeasures: variant !== 'production',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  extra: {
    EXPO_PUBLIC_APP_VARIANT: variant,
    router: {
      root: 'src/app',
    },
    EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL:
      process.env.EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL,
    EXPO_PUBLIC_TWITCH_CLIENT_ID: process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
    EXPO_PUBLIC_AUTH_PROXY_API_KEY: process.env.EXPO_PUBLIC_AUTH_PROXY_API_KEY,
    EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
    EXPO_PUBLIC_SENTRY_RELEASE: sentryRelease,
    EXPO_PUBLIC_SENTRY_DIST: sentryDist,
    MOCK_SERVER_URL: appConfig.mockServerUrl,
    ota: {
      criticalIndex: Number.parseInt(process.env.OTA_CRITICAL_INDEX ?? '0', 10),
    },
    updates: {
      assetPatternsToBeBundled: ['**/*'],
    },
    eas: {
      projectId: '950a1e2f-6b25-4be7-adb2-3c16287a2b5e',
    },
  },
  plugins: [
    'expo-router',
    'expo-image',
    '@rnrepo/expo-config-plugin',
    'react-native-compressor',
    'expo-status-bar',
    [
      '@sentry/react-native/expo',
      {
        url: 'https://sentry.io/',
        note: 'Use SENTRY_AUTH_TOKEN env to authenticate with Sentry.',
        project: 'foam',
        organization: 'luke-howsam',
        useNativeInit: true,
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
    [
      'expo-quick-actions',
      {
        iosActions: quickActions,
      },
    ],
    ['app-icon-badge', appIconBadgeConfig],
    'expo-secure-store',
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
    'react-native-nitro-websockets',
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
          forceStaticLinking: ['RNFBApp'],
          deploymentTarget: '18.0',
        },
        android: {
          enableProguardInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
          useLegacyPackaging: true,
        },
      },
    ],
    ['./src/plugins/withPodDeploymentTarget.js', { minIosVersion: '16.4' }],
    './src/plugins/withIosStaticFrameworkHeaderFix.js',
    '@react-native-firebase/app',
    './src/plugins/withAndroidReleaseLintFix.js',
    './src/plugins/withAndroidMainActivityConfigChanges.js',
    './plugins/with-fix-dev-launcher-cycle.js',
    // ['./src/plugins/withAnimatedWebPSupport.js'],
    // ['./src/plugins/withFastImageWebPSupportIOS.js'],
    // ['./src/plugins/withFastImageWebPSupportAndroid.js'],
  ],
  experiments: {
    reactCompiler: true,
    tsconfigPaths: true,
    buildCacheProvider: 'eas',
  },
  web: {},
  ios: {
    appleTeamId: 'XJA7HDCMMY',
    supportsTablet: false,
    bundleIdentifier: appConfig.iosBundleIdentifier,
    googleServicesFile: iosGoogleServicesFileExists
      ? appConfig.iosGoogleServicesFile
      : undefined,
    icon: './assets/app-icon.icon',
    config: {
      // needed for expo-secure-store
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      NSSupportsLiveActivities: true,
      NSPhotoLibraryUsageDescription: 'Used for saving emotes/badges',
      UIBackgroundModes: ['audio'],
    },
    entitlements: enableICloudEntitlements
      ? {
          'com.apple.developer.icloud-container-identifiers': [
            iosICloudContainerIdentifier,
          ],
          'com.apple.developer.icloud-services': ['CloudDocuments'],
          'com.apple.developer.ubiquity-container-identifiers': [
            iosICloudContainerIdentifier,
          ],
          'com.apple.developer.ubiquity-kvstore-identifier':
            '$(TeamIdentifierPrefix)$(CFBundleIdentifier)',
        }
      : undefined,
  },
  android: {
    package: appConfig.androidPackageName,
    googleServicesFile: googleServicesExist
      ? appConfig.androidGoogleServicesFile
      : undefined,
    adaptiveIcon: {
      foregroundImage: './assets/android-icon.png',
      backgroundImage: './assets/android-icon.png',
      monochromeImage: './assets/android-icon.png',
    },
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
