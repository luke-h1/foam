/* eslint-disable no-console */
import tmijs from 'tmi.js';

const tmiClient = (channelId: string, token?: string, username?: string) => {
  const client = new tmijs.Client({
    options: {
      clientId: process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
    },
    channels: [channelId],
    identity: {
      username: username ?? undefined,
      password: token ?? undefined,
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
