import logger from '@app/utils/logger';
import { useEffect, useMemo } from 'react';
import tmijs from 'tmi.js';

export interface TmiClientOptions {
  channels: string[];
  token?: string;
  username?: string;
  tmiOptions?: tmijs.Options;
}

const useTmiClient = ({
  channels,
  tmiOptions,
  token,
  username,
}: TmiClientOptions) => {
  const tmiClient = useMemo(() => {
    // eslint-disable-next-line import/no-named-as-default-member
    return new tmijs.Client({
      options: {
        clientId: process.env.EXPO_PUBLIC_TWITCH_CLIENT_ID,
        debug: false,
      },
      channels,
      identity: {
        username,
        password: token,
      },
      logger: {
        info: (message: string) => logger.info(message),
        warn: (message: string) => logger.warn(message),
        error: (message: string) => logger.error(message),
      },
      ...tmiOptions,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = async () => {
    await tmiClient.connect();
  };

  useEffect(() => {
    connect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const disconnect = async () => {
    await tmiClient.disconnect();
  };

  return {
    tmiClient,
    disconnect,
    connect,
  };
};
export default useTmiClient;
