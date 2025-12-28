declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TWITCH_CLIENT_ID: string;
      TWITCH_CLIENT_SECRET: string;

      AUTH_PROXY_API_BASE_URL: string;
      AUTH_PROXY_API_KEY: string;

      EXPO_PUBLIC_ENABLE_WDYR: boolean;
      EXPO_PUBLIC_WITH_STORYBOOK: boolean;
      EXPO_PUBLIC_WITH_ROZENITE: boolean;
    }
  }
}

export {};
