import { Variant } from '../../app.config';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_TWITCH_CLIENT_ID: string;
      EXPO_PUBLIC_ENABLE_SENTRY?: string;
      EXPO_PUBLIC_SENTRY_DSN?: string;
      EXPO_PUBLIC_SENTRY_RELEASE?: string;
      EXPO_PUBLIC_SENTRY_DIST?: string;
      EXPO_PUBLIC_VEXO_API_KEY?: string;
      SENTRY_DIST?: string;
      EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL: string;
      EXPO_PUBLIC_AUTH_PROXY_API_KEY: string;

      EXPO_PUBLIC_ENABLE_WDYR: boolean;
      EXPO_PUBLIC_WITH_STORYBOOK: boolean;
      EXPO_PUBLIC_WITH_ROZENITE: boolean;

      EXPO_PUBLIC_APP_VARIANT: Variant;

      MOCK_SERVER_PORT: number;
    }
  }
}

export {};
