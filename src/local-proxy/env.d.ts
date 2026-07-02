declare namespace NodeJS {
  interface ProcessEnv {
    PORT?: string;
    HOST?: string;
    TWITCH_CLIENT_ID?: string;
    TWITCH_CLIENT_SECRET?: string;
    MAGIC_LINK_BLOB?: string;
  }
}
