declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_TWITCH_CLIENT_ID: string;
      EXPO_PUBLIC_TWITCH_CLIENT_SECRET: string;
      EXPO_PUBLIC_PROXY_API_BASE_URL: string;

      EXPO_PUBLIC_NEW_RELIC_IOS_APP_TOKEN: string;
      EXPO_PUBLIC_NEW_RELIC_ANDROID_APP_TOKEN: string;

      // firebase
      EXPO_PUBLIC_FIREBASE_API_KEY: string;
      EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: string;
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: string;
      EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: string;
      EXPO_PUBLIC_FIREBASE_MESSAGE_SENDER_ID: string;
      EXPO_PUBLIC_FIREBASE_APP_ID: string;
      EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID: string;
    }
  }
}

export {};
