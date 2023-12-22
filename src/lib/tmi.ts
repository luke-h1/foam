/* eslint-disable no-console */
import tmijs from 'tmi.js';

const tmiClient = (channelId: string, token?: string, username?: string) => {
  const client = new tmijs.Client({
    options: {
      debug: false,
      clientId: process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
    },
    channels: [channelId],
    identity: {
      username: username ?? undefined,
      password: token ?? undefined,
    },
    connection: {
      maxReconnectAttempts: 5,
      reconnect: true,
      reconnectDecay: 1.5,
      reconnectInterval: 1500,
    },
    logger: {
      info: (message: string) => console.log(message),
      warn: (message: string) => console.log(message),
      error: (message: string) => console.log(message),
    },
  });

  return client;
};
export default tmiClient;
