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
}

type Variant = 'development' | 'preview' | 'production';

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
  production: {
    name: 'Foam',
    icon: './assets/splash/splash-image-production.png',
    iosBundleIdentifier: 'foam-tv',
    androidPackageName: 'com.lhowsam.foam',
    splashImage: './assets/splash/splash-image-production.png',
    splashBackgroundColor: '#000000',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    iosGoogleServicesFile:
      process.env.IOS_GOOGLE_SERVICES_JSON ||
      './GoogleService-Info-production.plist',
    androidGoogleServicesFile: './google-services-prod.json',
  },
} as const;

const variant = (process.env.APP_VARIANT as Variant) || 'production';

const VERSION = '0.0.29';

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
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  extra: {
    AUTH_PROXY_API_BASE_URL: process.env.AUTH_PROXY_API_BASE_URL,
    TWITCH_CLIENT_ID: process.env.TWITCH_CLIENT_ID,
    TWITCH_CLIENT_SECRET: process.env.TWITCH_CLIENT_SECRET,
    NEW_RELIC_IOS_APP_TOKEN: process.env.NEW_RELIC_IOS_APP_TOKEN,
    NEW_RELIC_ANDROID_APP_TOKEN: process.env.NEW_RELIC_ANDROID_APP_TOKEN,
    AUTH_PROXY_API_KEY: process.env.AUTH_PROXY_API_KEY,
    updates: {
      assetPatternsToBeBundled: ['**/*'],
    },
    eas: {
      projectId: '950a1e2f-6b25-4be7-adb2-3c16287a2b5e',
    },
  },
  plugins: [
    'react-native-bottom-tabs',
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
    '@bacons/apple-targets',
    'react-native-legal',
    'react-native-edge-to-edge',
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
          extraPods: [],
        },
      },
    ],
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
    },
    entitlements: {
      'com.apple.security.application-groups': ['group.foam-tv-dev'],
    },
  },
  android: {
    package: appConfig.androidPackageName,
    googleServicesFile: googleServicesExist
      ? appConfig.androidGoogleServicesFile
      : undefined,
    edgeToEdgeEnabled: true,
  },
};

export default config;
