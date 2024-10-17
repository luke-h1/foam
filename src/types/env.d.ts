declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_TWITCH_CLIENT_ID: string;
      EXPO_PUBLIC_TWITCH_CLIENT_SECRET: string;
      EXPO_PUBLIC_PROXY_API_BASE_URL: string;

      EXPO_PUBLIC_NEW_RELIC_IOS_APP_TOKEN: string;
      EXPO_PUBLIC_NEW_RELIC_ANDROID_APP_TOKEN: string;
    }
  }
}

export {};
