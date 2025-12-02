declare global {
  namespace NodeJS {
    interface ProcessEnv {
      TWITCH_CLIENT_ID: string;
      TWITCH_CLIENT_SECRET: string;

      AUTH_PROXY_API_BASE_URL: string;
      AUTH_PROXY_API_KEY: string;

      ENABLE_WDYR: 'true' | 'false';

      WITH_ROZENITE: boolean;
    }
  }
}

export {};
