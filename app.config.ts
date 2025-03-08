import type { ExpoConfig } from '@expo/config';
import type { AppIconBadgeConfig } from 'app-icon-badge/types';

import fs from 'fs';
import path from 'path';

// @todo luke-h1:
// setup prod images ✅

interface AppVariantConfig {
  name: string;
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
    iosBundleIdentifier: 'foam-tv-dev',
    androidPackageName: 'com.lhowsam.foam.dev',
    splashImage: './assets/splash/splash-image-production.png',
    splashBackgroundColor: '#000',
    iosGoogleServicesFile: './GoogleService-Info-dev.plist',
    androidGoogleServicesFile: './google-services-dev.json',
  },
  preview: {
    name: 'Foam (preview)',
    iosBundleIdentifier: 'foam-tv-preview',
    androidPackageName: 'com.lhowsam.foam.preview',
    splashImage: './assets/splash/splash-image-production.png',
    splashBackgroundColor: '#000',
    iosGoogleServicesFile: './GoogleService-Info-preview.plist',
    androidGoogleServicesFile: './google-services-preview.json',
  },
  production: {
    name: 'Foam',
    iosBundleIdentifier: 'foam-tv',
    androidPackageName: 'com.lhowsam.foam',
    splashImage: './assets/splash/splash-image-production.png',
    splashBackgroundColor: '#000',
    iosGoogleServicesFile:
      process.env.IOS_GOOGLE_SERVICES_JSON ||
      './GoogleService-Info-production.plist',
    androidGoogleServicesFile: './google-services-prod.json',
  },
} as const;

const variant = (process.env.APP_VARIANT as Variant) || 'production';

const VERSION = '0.0.18';

const appConfig = APP_VARIANT_CONFIG[variant];

const iosGoogleServicesFileExists = fs.existsSync(
  path.resolve(__dirname, appConfig.iosGoogleServicesFile),
);

const googleServicesExist = fs.existsSync(
  path.resolve(__dirname, appConfig.androidGoogleServicesFile),
);

const appIconBadgeConfig: AppIconBadgeConfig = {
  enabled: true,
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
    updates: {
      assetPatternsToBeBundled: ['**/*'],
    },
    eas: {
      projectId: '950a1e2f-6b25-4be7-adb2-3c16287a2b5e',
    },
  },
  plugins: [
    ['app-icon-badge', appIconBadgeConfig],
    ['expo-font', 'expo-secure-store'],
    [
      'expo-build-properties',
      {
        ios: {
          flipper: true,
          useFrameworks: 'static',
        },
        android: {
          enableProguardInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
        },
      },
    ],
    [
      'expo-dev-launcher',
      {
        launchMode: 'most-recent',
      },
    ],
    [
      'expo-video',
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    ['newrelic-react-native-agent'],
    // ['./src/plugins/withAnimatedWebPSupport.js'],
    // ['./src/plugins/withFastImageWebPSupportIOS.js'],
    // ['./src/plugins/withFastImageWebPSupportAndroid.js'],
  ],
  experiments: {
    tsconfigPaths: true,
  },
  web: {},
  ios: {
    supportsTablet: false,
    bundleIdentifier: appConfig.iosBundleIdentifier,
    googleServicesFile: iosGoogleServicesFileExists
      ? appConfig.iosGoogleServicesFile
      : undefined,
    config: {
      // needed for expo-secure-store
      usesNonExemptEncryption: false,
    },
  },
  android: {
    package: appConfig.androidPackageName,
    googleServicesFile: googleServicesExist
      ? appConfig.androidGoogleServicesFile
      : undefined,
  },
};

export default config;
