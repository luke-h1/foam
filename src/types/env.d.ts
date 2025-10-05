declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_TWITCH_CLIENT_ID: string;

      /**
       * TODO: move to lambda
       */
      EXPO_PUBLIC_TWITCH_CLIENT_SECRET: string;
      EXPO_PUBLIC_AUTH_PROXY_API_BASE_URL: string;
      EXPO_PUBLIC_AUTH_PROXY_API_KEY: string;
    }
  }
}

export {};
