import { Variant } from '../../app.config';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_TWITCH_CLIENT_ID: string;
      EXPO_PUBLIC_ENABLE_SENTRY?: string;
      EXPO_PUBLIC_SENTRY_DSN?: string;
      EXPO_PUBLIC_SENTRY_RELEASE?: string;
      EXPO_PUBLIC_SENTRY_DIST?: string;
      EXPO_PUBLIC_SENTRY_DEBUG?: string;
      SENTRY_DIST?: string;
      EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL: string;
      EXPO_PUBLIC_AUTH_PROXY_API_KEY: string;

      EXPO_PUBLIC_ENABLE_WDYR: string;
      EXPO_PUBLIC_WITH_STORYBOOK: string;
      EXPO_PUBLIC_WITH_ROZENITE: string;
      EXPO_PUBLIC_PERF_MARKS?: string;

      EXPO_PUBLIC_APP_VARIANT: Variant;

      MOCK_SERVER_PORT: number;
      MOCK_IRC_PORT?: string;

      ENABLE_IOS_ICLOUD_ENTITLEMENTS?: string;
      OTA_CRITICAL_INDEX?: string;

      PORT?: string;
      HOST?: string;
      TWITCH_CLIENT_ID?: string;
      TWITCH_CLIENT_SECRET?: string;
      MAGIC_LINK_BLOB?: string;

      GIT_CLIFF_BIN?: string;
      CLIFF_CONFIG?: string;

      FOAM_AWS_FINGERPRINT_ACCESS_KEY_ID?: string;
      FOAM_AWS_FINGERPRINT_SECRET_KEY?: string;
      FOAM_AWS_REGION?: string;

      GITHUB_OUTPUT?: string;
    }
  }
}

export {};
